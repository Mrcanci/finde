// api/search-reasoning.ts
// POST /api/search-reasoning — FASE 2 de la búsqueda: recibe la query, los 3
// ids que eligió la fase 1 y los datos de esos tours (phase2Tours, firmados
// por la fase 1), y genera el reasoning en peruano + los filtros detectados.
// Con firma válida usa los datos del body directo (sin tocar la DB: la fase 1
// los hidrató hace un segundo); con firma inválida o body legacy (solo ids)
// rehidrata desde la DB. Acá viven las escrituras de SearchLog y
// FeaturedSearch (vía waitUntil, fuera del camino crítico). El cache
// compartido solo se escribe si la firma verifica; con firma inválida se
// genera el reasoning igual (no rompe UX) pero NO se cachea.

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { waitUntil } from "@vercel/functions";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "../lib/db.js";
import { anthropic, MODEL } from "../lib/anthropic.js";
import { rateLimit, ipFromRequest } from "../lib/rate-limit.js";
import { normalizeQuery } from "../lib/search-cache.js";
import {
  hashPhase2Tours,
  verifySearchPhase,
  type Phase2Tour,
} from "../lib/search-sig.js";

const phase2TourSchema = z.object({
  id: z.string().min(10).max(40),
  title: z.string().min(1).max(300),
  description: z.string().min(1).max(600),
  category: z.string().min(1).max(40),
  city: z.string().min(1).max(120),
  region: z.string().min(1).max(120),
  priceSoles: z.number().int().nonnegative(),
  rating: z.number().min(0).max(5),
});

const bodySchema = z.object({
  query: z.string().trim().min(3).max(500),
  ids: z.array(z.string().min(10).max(40)).length(3),
  sig: z.string().optional(),
  // Datos firmados por la fase 1. Opcional por compatibilidad con bundles
  // viejos del frontend, que mandan solo ids (path legacy: rehidrata).
  tours: z.array(phase2TourSchema).length(3).optional(),
});

interface FiltrosDetectados {
  category?: string;
  city?: string;
  maxPrice?: number;
  duration?: string;
}

// Prompt de TEXTO: los tours ya están elegidos; acá viven las reglas de tono
// que en el flujo de una llamada convivían con las de selección.
const SYSTEM_REASONING = `Eres el asistente de Finde, un marketplace peruano de experiencias turísticas curadas. Ya se eligieron los 3 tours para la consulta del viajero (vienen en orden de ranking: el primero es la mejor recomendación). Tu trabajo:

1. Explicar POR QUÉ estos 3 son la mejor recomendación para esa consulta. Presenta los tours en el mismo orden del ranking.
2. Detectar filtros implícitos en la consulta: categoría (adventure | cultural | gastronomy | nature | mystic), ciudad, presupuesto máximo en soles, duración aproximada.

REGLAS DEL TEXTO:
- Suena a peruano natural y cálido, como un guía peruano experimentado recomendando: tutea ("te"), usa expresiones cotidianas como "te va a encantar", "cae bien", "ideal para arrancar". Evita el español neutro y los clichés ("pachamama", "vibras", "experiencia mágica"). Evita el voseo rioplatense ("mira", nunca "mirá"; "tienes", nunca "tenes").
- Español peruano estricto: prohibido el vocabulario ibérico. Nunca escribas "flipar", "guay", "molar", "currar", "chaval" ni "vale" como muletilla.
- Nunca uses la raya (—) en el texto. Si necesitas una pausa, usa coma, dos puntos o punto.
- No describas qué es cada tour: el usuario ya ve el título, la ubicación, la duración y el precio en las tarjetas. Escribe solo lo que NO está en la tarjeta: por qué encaja con lo que pidió, datos concretos que ayuden a decidir (altitud, distancia, dificultad), y cualquier advertencia relevante (que salga de otra ciudad, que sea de temporada, que exija esfuerzo).
- Usa solo datos que estén en la información de los tours. No afirmes distancias, tiempos de viaje, cercanías entre ciudades ni características que no figuren ahí. Si no tienes el dato, no lo menciones.
- Si algún tour queda en otra zona que la que pidió el viajero, aclara la ubicación.
- Dos o tres frases cortas, máximo 300 caracteres en total. Sin emojis. Sin listar los tours uno por uno.

Llama SIEMPRE la herramienta explicar_recomendacion. No respondas en texto libre.`;

const TOOL_REASONING = {
  name: "explicar_recomendacion",
  description:
    "Devuelve el reasoning en peruano y los filtros detectados en la consulta.",
  input_schema: {
    type: "object" as const,
    properties: {
      reasoning: {
        type: "string",
        description:
          "Dos o tres frases cortas (máximo 300 caracteres en total) en español peruano natural explicando por qué estos 3 son la mejor recomendación.",
      },
      filters_detected: {
        type: "object",
        description:
          "Filtros implícitos detectados en la consulta. Incluye solo los que aparezcan claramente; omite el resto.",
        properties: {
          category: {
            type: "string",
            enum: ["adventure", "cultural", "gastronomy", "nature", "mystic"],
          },
          city: { type: "string" },
          maxPrice: {
            type: "number",
            description: "Presupuesto máximo aproximado en soles.",
          },
          duration: {
            type: "string",
            description:
              "Duración aproximada (ej. 'medio día', 'full day', '2 días').",
          },
        },
        additionalProperties: false,
      },
    },
    required: ["reasoning", "filters_detected"],
    additionalProperties: false,
  },
};

// Mismo formato y truncado a 500 que la fase 1, sin numeración (acá no se
// elige nada, solo se explica).
function formatElegidos(tours: Phase2Tour[]): string {
  return tours
    .map(
      (t, i) => `[ranking ${i + 1}]
título: ${t.title}
categoría: ${t.category}
ciudad: ${t.city}, ${t.region}
precio: S/${(t.priceSoles / 100).toFixed(2)}
rating: ${t.rating}
descripción: ${t.description.slice(0, 500)}`
    )
    .join("\n\n");
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  const t0 = Date.now();
  const t: Record<string, number> = {};
  const mark = (k: string, start: number) => { t[k] = Date.now() - start; };
  let s = t0;

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Método no permitido" });
    return;
  }

  const ip = ipFromRequest(req.headers["x-forwarded-for"]);
  const rl = rateLimit(ip, "search-reasoning", 10);
  if (!rl.allowed) {
    const seconds = rl.retryAfterSeconds ?? 60;
    res.setHeader("Retry-After", String(seconds));
    res.status(429).json({
      error: `Demasiadas peticiones, intenta en ${seconds} segundos`,
    });
    return;
  }

  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "Cuerpo inválido",
      details: parsed.error.issues,
    });
    return;
  }

  const { query, ids, sig, tours } = parsed.data;
  const normalized = normalizeQuery(query);

  // Verificación: con tours en el body, la firma debe cubrir query + ids +
  // hash de los datos (y los ids deben coincidir con los de los tours, en el
  // mismo orden: el orden es el ranking). Sin tours (bundle viejo), fórmula
  // legacy sobre query + ids. Firma inválida ≠ error de usuario: se responde
  // igual pero sin confiar en los datos del cliente ni tocar el cache
  // compartido. Se loguea sin la query (Ley 29733).
  const toursMatchIds =
    tours != null && tours.map((t) => t.id).join(",") === ids.join(",");
  const sigOk = tours
    ? toursMatchIds && verifySearchPhase(normalized, ids, sig, hashPhase2Tours(tours))
    : verifySearchPhase(normalized, ids, sig);
  if (!sigOk) {
    console.warn(
      `[search-sig] firma inválida en fase 2 qlen=${query.length} ids=${ids.length} tours=${tours ? 1 : 0}`
    );
  }

  // Datos para el prompt. Camino rápido: firma válida → los datos firmados
  // del body, cero roundtrips a DB (la fase 1 los hidrató hace un segundo).
  // Camino lento (firma inválida o body legacy): rehidratar desde la DB por
  // ids, que también valida que los 3 existan y sigan activos.
  let elegidos: Phase2Tour[];
  if (sigOk && tours) {
    elegidos = tours;
    t.hydration = 0;
  } else {
    s = Date.now();
    const rows = await db.tour.findMany({
      where: { id: { in: ids }, active: true },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        city: true,
        region: true,
        priceSoles: true,
        rating: true,
      },
    });
    mark("hydration", s);

    const byId = new Map(rows.map((r) => [r.id, r]));
    const hidratados = ids
      .map((id) => byId.get(id))
      .filter((x): x is NonNullable<typeof x> => x != null);
    if (hidratados.length !== 3) {
      res.status(409).json({
        error: "Los tours seleccionados ya no están disponibles",
      });
      return;
    }
    elegidos = hidratados;
  }

  s = Date.now();
  let reasoning: string;
  let filtersDetected: FiltrosDetectados;
  try {
    const respuesta = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 256,
      system: SYSTEM_REASONING,
      tools: [TOOL_REASONING],
      tool_choice: { type: "tool", name: TOOL_REASONING.name },
      messages: [
        {
          role: "user",
          content: `Consulta del viajero: "${query}"

Tours ya elegidos (en orden de ranking):

${formatElegidos(elegidos)}

Escribe el reasoning y llama explicar_recomendacion.`,
        },
      ],
    });
    const toolUse = respuesta.content.find((b) => b.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      throw new Error("El modelo no llamó explicar_recomendacion");
    }
    const input = toolUse.input as {
      reasoning?: unknown;
      filters_detected?: FiltrosDetectados;
    };
    if (typeof input.reasoning !== "string" || input.reasoning.length === 0) {
      throw new Error("reasoning inválido");
    }
    reasoning = input.reasoning;
    filtersDetected = input.filters_detected ?? {};
  } catch (error) {
    console.error("Fase 2 falló generando el reasoning:", error);
    res.status(502).json({ error: "No pudimos generar el análisis" });
    return;
  }
  mark("model", s);

  // Escrituras fuera del camino crítico. SearchLog siempre; FeaturedSearch
  // solo con firma válida (anti cache poisoning: los ids vienen del cliente).
  s = Date.now();
  const escrituras: Promise<void>[] = [
    db.searchLog
      .create({
        data: { query, resultIds: ids, reasoning },
      })
      .then(() => mark("searchlog", s))
      .catch((error) => {
        console.error("Error guardando SearchLog (no bloqueante):", error);
        mark("searchlog", s);
      }),
  ];
  if (sigOk) {
    escrituras.push(
      db.featuredSearch
        .upsert({
          where: { query: normalized },
          create: {
            query: normalized,
            results: ids,
            reasoning,
            filtersDetected: filtersDetected as unknown as Prisma.InputJsonValue,
          },
          update: {
            results: ids,
            reasoning,
            filtersDetected: filtersDetected as unknown as Prisma.InputJsonValue,
          },
        })
        .then(() => mark("cache_write", s))
        .catch((error) => {
          console.error("Error en write-through cache (no bloqueante):", error);
          mark("cache_write", s);
        })
    );
  } else {
    t.cache_write = 0;
  }

  mark("total", t0);
  waitUntil(
    Promise.all(escrituras).then(() => {
      console.log(
        `[search-timing] phase=2 hydration=${t.hydration}ms model=${t.model}ms searchlog=${t.searchlog}ms cache_write=${t.cache_write}ms total=${t.total}ms sig=${sigOk ? 1 : 0}`
      );
    })
  );
  res.status(200).json({ reasoning, filters_detected: filtersDetected });
}
