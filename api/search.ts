// api/search.ts
// POST /api/search — búsqueda semántica con pgvector + re-ranking con Claude.
// Flujo: embedding del query (Voyage) → top 8 candidatos (pgvector <=>)
// → Claude Sonnet 4.6 elige 3 con reasoning peruano → SearchLog → respuesta.
// Si Claude falla por cualquier razón, fallback graceful con top 3 semánticos.

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { waitUntil } from "@vercel/functions";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "../lib/db.js";
import { voyage, MODEL_EMBED, DIM } from "../lib/voyage.js";
import { anthropic, MODEL } from "../lib/anthropic.js";
import { LIST_SELECT, gateOperatorMincetur } from "../lib/tour-select.js";
import { rateLimit, ipFromRequest } from "../lib/rate-limit.js";
import { normalizeQuery } from "../lib/search-cache.js";

const bodySchema = z.object({
  query: z.string().trim().min(3).max(500),
});

interface Candidato {
  id: string;
  title: string;
  description: string;
  category: string;
  city: string;
  region: string;
  priceSoles: number;
  imageUrl: string | null;
  rating: number;
}

interface FiltrosDetectados {
  category?: string;
  city?: string;
  maxPrice?: number;
  duration?: string;
}

interface DecisionClaude {
  top_3_ids: string[];
  reasoning: string;
  filters_detected: FiltrosDetectados;
}

const SYSTEM_PROMPT = `Eres el asistente de Finde, un marketplace peruano de experiencias turísticas curadas (aventura, cultural, gastronomía, naturaleza, místico).

Recibes la consulta de un viajero en lenguaje natural y 8 tours pre-seleccionados por similitud semántica. Tu trabajo es:

1. Elegir los 3 tours más relevantes para esa consulta específica.
2. Explicar en 2–4 frases POR QUÉ esos tres son la mejor recomendación (no qué son — el usuario ya ve la ficha).
3. Detectar filtros implícitos en la consulta: categoría (adventure | cultural | gastronomy | nature | mystic), ciudad, presupuesto máximo en soles, duración aproximada.

REGLAS:
- Solo puedes elegir IDs de los 8 candidatos. Nunca inventes ni recomiendes nada fuera de esa lista.
- Respeta restricciones del viajero. Si menciona familia con niños, excluye ayahuasca, treks extremos y alta montaña. Si pide algo tranquilo, evita aventura intensa. Si pide económico, prioriza menor priceSoles.
- Si la consulta menciona una ciudad o región específica (ej. Cusco, Arequipa, costa norte), prioriza tours en esa zona. Solo recomienda opciones cercanas si son objetivamente superiores en relevancia, y aclara la ubicación en el reasoning.
- Ante consultas ambiguas prefiere variedad temática (no 3 tours del mismo tipo).
- El orden de top_3_ids ES tu ranking: el primer id del array debe ser el tour que tu reasoning presenta como la mejor opción, el segundo la siguiente, y así. NUNCA conserves el orden en que recibiste los candidatos: reordena según tu recomendación. Si tu reasoning presenta uno como "agregado" o alternativa secundaria, ese va ÚLTIMO en el array.
- El reasoning debe sonar a peruano natural y cálido, como un guía peruano experimentado recomendando: tutea ("te"), usa expresiones cotidianas como "te va a encantar", "cae bien", "ideal para arrancar". Evita el español neutro y los clichés ("pachamama", "vibras", "experiencia mágica"). Evita el voseo rioplatense ("mira", nunca "mirá"; "tienes", nunca "tenes").
- Entre 2 y 4 frases. Sin emojis. Sin listar los tours uno por uno.

Llama SIEMPRE la herramienta recomendar_tours con tu decisión. No respondas en texto libre.`;

const TOOL = {
  name: "recomendar_tours",
  description:
    "Devuelve los 3 tours más relevantes de los 8 candidatos, con reasoning en peruano y filtros detectados.",
  input_schema: {
    type: "object" as const,
    properties: {
      top_3_ids: {
        type: "array",
        items: { type: "string" },
        minItems: 3,
        maxItems: 3,
        description:
          "IDs (cuid) de los 3 tours elegidos, ordenados por TU ranking (el primero = tu mejor recomendación, coherente con el orden en que tu reasoning los presenta). NO conserves el orden de la lista de candidatos. Deben venir EXACTAMENTE de esa lista.",
      },
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
    required: ["top_3_ids", "reasoning", "filters_detected"],
    additionalProperties: false,
  },
};

// La description va truncada a 500 chars: las descriptions arrancan con los
// datos concretos (distancias, horarios, desnivel) y el recorte ahorra ~2s de
// modelo sin degradar el reasoning (calibrado contra 300 y sin truncar).
function formatCandidatos(c: Candidato[]): string {
  return c
    .map(
      (t, i) => `[${i + 1}] id=${t.id}
título: ${t.title}
categoría: ${t.category}
ciudad: ${t.city}, ${t.region}
precio: S/${(t.priceSoles / 100).toFixed(2)}
rating: ${t.rating}
descripción: ${t.description.slice(0, 500)}`
    )
    .join("\n\n");
}

async function decidirConClaude(
  query: string,
  candidatos: Candidato[]
): Promise<DecisionClaude> {
  const userMessage = `Consulta del viajero: "${query}"

Candidatos pre-seleccionados (orden por similitud semántica):

${formatCandidatos(candidatos)}

Elige los 3 mejores y llama recomendar_tours.`;

  const respuesta = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    tools: [TOOL],
    tool_choice: { type: "tool", name: TOOL.name },
    messages: [{ role: "user", content: userMessage }],
  });

  const toolUse = respuesta.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Claude no llamó la herramienta recomendar_tours");
  }

  const decision = toolUse.input as DecisionClaude;

  if (
    !Array.isArray(decision.top_3_ids) ||
    decision.top_3_ids.length !== 3
  ) {
    throw new Error("top_3_ids inválido");
  }

  const idsValidos = new Set(candidatos.map((c) => c.id));
  for (const id of decision.top_3_ids) {
    if (!idsValidos.has(id)) {
      throw new Error(`Claude eligió un id fuera de los candidatos: ${id}`);
    }
  }

  if (typeof decision.reasoning !== "string" || decision.reasoning.length === 0) {
    throw new Error("reasoning inválido");
  }

  return {
    top_3_ids: decision.top_3_ids,
    reasoning: decision.reasoning,
    filters_detected: decision.filters_detected ?? {},
  };
}

// Días que una entrada de FeaturedSearch se considera fresca. Al expirar, el
// cache-hit se degrada a MISS y el flujo completo recomputa TODO junto
// (resultados + reasoning coherentes) y re-upsertea, refrescando updatedAt.
const CACHE_TTL_DIAS = 7;

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // Instrumentación de latencia por etapa. Solo duraciones y conteos:
  // nunca el texto de la consulta (Ley 29733).
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
  const rl = rateLimit(ip, "search", 10);
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

  const { query } = parsed.data;

  // Paso 0: cache hit en FeaturedSearch (queries famosos pre-cacheados).
  // Salta Voyage + Claude → respuesta en <100ms en vez de ~10s.
  // El rate limit ya se aplicó arriba, así que un cache hit no es bypass.
  // No se escribe SearchLog en cache hit (la query ya está representada en
  // FeaturedSearch y el demo no debe pagar el costo del INSERT).
  const normalized = normalizeQuery(query);
  s = Date.now();
  const cached = await db.featuredSearch.findFirst({
    where: { query: normalized },
  });
  mark("cache_lookup", s);

  const cacheExpirado =
    cached != null &&
    Date.now() - cached.updatedAt.getTime() >
      CACHE_TTL_DIAS * 24 * 60 * 60 * 1000;

  if (cacheExpirado) {
    console.log(`[cache EXPIRED] qlen=${query.length} — recomputando`);
  }

  if (cached && cached.results.length > 0 && !cacheExpirado) {
    console.log(`[cache HIT] qlen=${query.length}`);
    s = Date.now();
    const cachedTours = await db.tour.findMany({
      where: { id: { in: cached.results }, active: true },
      select: LIST_SELECT,
    });
    mark("hydration", s);
    // Gateo: mincetur de operador no verificado nunca sale en el payload.
    cachedTours.forEach(gateOperatorMincetur);
    const byCachedId = new Map(cachedTours.map((t) => [t.id, t]));
    const cachedResults = cached.results
      .map((id) => byCachedId.get(id))
      .filter((t): t is NonNullable<typeof t> => t != null);

    mark("total", t0);
    console.log(
      `[search-timing] cache=HIT cache_lookup=${t.cache_lookup}ms hydration=${t.hydration}ms total=${t.total}ms results=${cachedResults.length}`
    );
    res.status(200).json({
      results: cachedResults,
      reasoning: cached.reasoning,
      query,
      filters_detected:
        (cached.filtersDetected as unknown as FiltrosDetectados) ?? {},
    });
    return;
  }

  console.log(`[cache MISS] qlen=${query.length} — usando flujo completo`);

  // Paso 1: embedding del query (inputType "query" para retrieval asimétrico)
  s = Date.now();
  let queryEmbedding: number[];
  try {
    const r = await voyage.embed({
      input: query,
      model: MODEL_EMBED,
      inputType: "query",
    });
    const e = r.data?.[0]?.embedding;
    if (!e || !Array.isArray(e) || e.length !== DIM) {
      throw new Error(`Embedding inválido (dim=${e?.length ?? "?"})`);
    }
    queryEmbedding = e;
  } catch (error) {
    console.error("Error generando embedding del query:", error);
    res.status(500).json({ error: "Error al procesar la búsqueda" });
    return;
  }
  mark("embedding", s);

  // Paso 2: top 8 candidatos por distancia cosenoidal (pgvector <=>)
  const vectorLiteral = JSON.stringify(queryEmbedding);
  s = Date.now();
  let candidatos: Candidato[];
  try {
    candidatos = await db.$queryRaw<Candidato[]>`
      SELECT id, title, description, category::text AS category, city, region,
             "priceSoles", "imageUrl", rating
      FROM "Tour"
      WHERE embedding IS NOT NULL AND active = true
      ORDER BY embedding <=> ${vectorLiteral}::vector
      LIMIT 8
    `;
  } catch (error) {
    console.error("Error en similarity search pgvector:", error);
    res.status(500).json({ error: "Error al procesar la búsqueda" });
    return;
  }
  mark("vector", s);

  if (candidatos.length === 0) {
    mark("total", t0);
    console.log(
      `[search-timing] cache=MISS cache_lookup=${t.cache_lookup}ms embedding=${t.embedding}ms vector=${t.vector}ms total=${t.total}ms results=0`
    );
    res.status(200).json({
      results: [],
      reasoning:
        "Por ahora no encontramos tours que calcen con tu búsqueda. Prueba con otras palabras.",
      query,
      filters_detected: {},
    });
    return;
  }

  // Paso 4 arranca ANTES que el paso 3 y corre en paralelo con Claude: los 3
  // elegidos son siempre subconjunto de los 8 candidatos, así que hidratamos
  // los 8 con LIST_SELECT mientras el modelo decide, y filtramos al final.
  // La conexión de DB queda libre durante la llamada HTTP a Anthropic, así
  // que el solape es real incluso con connection_limit=1.
  const sHydration = Date.now();
  const hydrationPromise = db.tour
    .findMany({
      where: { id: { in: candidatos.map((c) => c.id) }, active: true },
      select: LIST_SELECT,
    })
    .then((rows) => {
      mark("hydration", sHydration);
      return rows;
    });

  // Paso 3: Claude re-rankea (con fallback graceful)
  let chosenIds: string[];
  let reasoning: string;
  let filtersDetected: FiltrosDetectados;
  // Solo el flujo con Claude exitoso alimenta el write-through cache; el
  // fallback semántico NO se cachea (detectado por boolean, no por strings).
  let claudeOk = false;

  s = Date.now();
  try {
    const decision = await decidirConClaude(query, candidatos);
    chosenIds = decision.top_3_ids;
    reasoning = decision.reasoning;
    filtersDetected = decision.filters_detected;
    claudeOk = true;
  } catch (error) {
    console.error("Claude falló, usando fallback semántico:", error);
    chosenIds = candidatos.slice(0, 3).map((c) => c.id);
    reasoning = "Resultados ordenados por similitud semántica";
    filtersDetected = {};
  }
  mark("model", s);

  // Paso 4 (cierre): la hidratación ya corrió en paralelo con Claude; acá
  // solo esperamos el resultado (normalmente ya resuelto) y filtramos los 3.
  const tours = await hydrationPromise;
  // Gateo: mincetur de operador no verificado nunca sale en el payload.
  tours.forEach(gateOperatorMincetur);

  // Reordenar según el orden elegido (findMany no respeta el orden de in:;
  // el Map tiene los 8 candidatos, chosenIds selecciona y ordena los 3)
  const byId = new Map(tours.map((t) => [t.id, t]));
  const results = chosenIds
    .map((id) => byId.get(id))
    .filter((t): t is NonNullable<typeof t> => t != null);

  // Pasos 5 y 6 en paralelo y FUERA del camino crítico: SearchLog y el
  // write-through cache no dependen entre sí (tablas distintas) y un fallo de
  // cualquiera no debe romper la respuesta. waitUntil mantiene viva la función
  // hasta completarlos DESPUÉS de responder; el tradeoff aceptado es que si la
  // instancia muere antes de terminar, esa fila de log o ese upsert se pierden.
  // Write-through cache: toda búsqueda EXITOSA se upsertea a FeaturedSearch
  // por query normalizada → repeticiones exactas responden instantáneas con
  // texto idéntico. @updatedAt refresca la ventana TTL. Guardrails: NO
  // cachear fallback (claudeOk=false) ni respuestas con <3 tours.
  s = Date.now();
  const escrituras: Promise<void>[] = [
    db.searchLog
      .create({
        data: {
          query,
          resultIds: results.map((t) => t.id),
          reasoning,
        },
      })
      .then(() => mark("searchlog", s))
      .catch((error) => {
        console.error("Error guardando SearchLog (no bloqueante):", error);
        mark("searchlog", s);
      }),
  ];
  if (claudeOk && results.length >= 3) {
    escrituras.push(
      db.featuredSearch
        .upsert({
          where: { query: normalized },
          create: {
            query: normalized,
            results: results.map((t) => t.id),
            reasoning,
            filtersDetected: filtersDetected as unknown as Prisma.InputJsonValue,
          },
          update: {
            results: results.map((t) => t.id),
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
  // total mide hasta la respuesta al usuario; el log sale cuando terminan las
  // escrituras en background para incluir también sus duraciones.
  mark("total", t0);
  waitUntil(
    Promise.all(escrituras).then(() => {
      console.log(
        `[search-timing] cache=MISS cache_lookup=${t.cache_lookup}ms embedding=${t.embedding}ms vector=${t.vector}ms model=${t.model}ms hydration=${t.hydration}ms searchlog=${t.searchlog}ms cache_write=${t.cache_write}ms total=${t.total}ms results=${results.length}`
      );
    })
  );
  res.status(200).json({
    results,
    reasoning,
    query,
    filters_detected: filtersDetected,
  });
}
