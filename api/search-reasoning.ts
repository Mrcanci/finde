// api/search-reasoning.ts
// POST /api/search-reasoning — FASE 2 de la búsqueda: recibe la query y los 3
// ids que eligió la fase 1 y genera el reasoning en peruano + los filtros
// detectados. Acá viven las escrituras de SearchLog y FeaturedSearch (vía
// waitUntil, fuera del camino crítico). El cache compartido solo se escribe si
// la firma HMAC emitida por la fase 1 verifica; con firma inválida se genera
// el reasoning igual (no rompe UX) pero NO se cachea.

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { waitUntil } from "@vercel/functions";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "../lib/db.js";
import { anthropic, MODEL } from "../lib/anthropic.js";
import { rateLimit, ipFromRequest } from "../lib/rate-limit.js";
import { normalizeQuery } from "../lib/search-cache.js";
import { verifySearchPhase } from "../lib/search-sig.js";

const bodySchema = z.object({
  query: z.string().trim().min(3).max(500),
  ids: z.array(z.string().min(10).max(40)).length(3),
  sig: z.string().optional(),
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

1. Explicar en 2–4 frases POR QUÉ estos 3 son la mejor recomendación (no qué son — el usuario ya ve la ficha). Presenta los tours en el mismo orden del ranking.
2. Detectar filtros implícitos en la consulta: categoría (adventure | cultural | gastronomy | nature | mystic), ciudad, presupuesto máximo en soles, duración aproximada.

REGLAS DEL TEXTO:
- Suena a peruano natural y cálido, como un guía peruano experimentado recomendando: tutea ("te"), usa expresiones cotidianas como "te va a encantar", "cae bien", "ideal para arrancar". Evita el español neutro y los clichés ("pachamama", "vibras", "experiencia mágica"). Evita el voseo rioplatense ("mira", nunca "mirá"; "tienes", nunca "tenes").
- Español peruano estricto: prohibido el vocabulario ibérico. Nunca escribas "flipar", "guay", "molar", "currar", "chaval" ni "vale" como muletilla.
- Nunca uses la raya (—) en el texto. Si necesitas una pausa, usa coma, dos puntos o punto.
- Si algún tour queda en otra zona que la que pidió el viajero, aclara la ubicación.
- Entre 2 y 4 frases. Sin emojis. Sin listar los tours uno por uno.

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
          "2–4 frases en español peruano natural explicando por qué estos 3 son la mejor recomendación.",
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

interface TourPrompt {
  id: string;
  title: string;
  description: string;
  category: string;
  city: string;
  region: string;
  priceSoles: number;
  rating: number;
}

// Mismo formato y truncado a 500 que la fase 1, sin numeración (acá no se
// elige nada, solo se explica).
function formatElegidos(tours: TourPrompt[]): string {
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

  const { query, ids, sig } = parsed.data;
  const normalized = normalizeQuery(query);

  // Firma inválida ≠ error de usuario: se responde igual pero sin tocar el
  // cache compartido. Se loguea sin la query (Ley 29733).
  const sigOk = verifySearchPhase(normalized, ids, sig);
  if (!sigOk) {
    console.warn(
      `[search-sig] firma inválida en fase 2 qlen=${query.length} ids=${ids.length}`
    );
  }

  // Hidratación para el prompt (y validación implícita: los 3 deben existir y
  // estar activos). El orden del body es el ranking de la fase 1.
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
  const elegidos = ids
    .map((id) => byId.get(id))
    .filter((x): x is NonNullable<typeof x> => x != null);
  if (elegidos.length !== 3) {
    res.status(409).json({
      error: "Los tours seleccionados ya no están disponibles",
    });
    return;
  }

  s = Date.now();
  let reasoning: string;
  let filtersDetected: FiltrosDetectados;
  try {
    const respuesta = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 512,
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
