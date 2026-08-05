// api/search.ts
// POST /api/search — FASE 1 de la búsqueda semántica: embedding del query
// (Voyage) → top 8 candidatos (pgvector <=>) → Claude elige 3 POR ÍNDICE
// (1-8, corrupción de ids estructuralmente imposible) → responde los tours
// validados + firma HMAC para la fase 2. El reasoning lo genera la fase 2
// (/api/search-reasoning) con las tarjetas ya en pantalla.
// Cache HIT responde todo junto acá (results + reasoning, sin fase 2).
// Si el modelo falla, fallback graceful con top 3 semánticos: reasoning
// canned, SearchLog acá, sin fase 2 y sin escribir cache.

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { waitUntil } from "@vercel/functions";
import { z } from "zod";
import { db } from "../lib/db.js";
import { voyage, MODEL_EMBED, DIM } from "../lib/voyage.js";
import { anthropic, MODEL } from "../lib/anthropic.js";
import { LIST_SELECT, gateOperatorMincetur } from "../lib/tour-select.js";
import { rateLimit, ipFromRequest } from "../lib/rate-limit.js";
import { normalizeQuery } from "../lib/search-cache.js";
import {
  hashPhase2Tours,
  signSearchPhase,
  type Phase2Tour,
} from "../lib/search-sig.js";

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

// Prompt de SELECCIÓN pura: mantiene TODAS las reglas que afectan qué tours se
// eligen (exclusiones por niños/tranquilo/económico, zona, variedad, ranking).
// Las reglas de TEXTO (tono peruano, 2-4 frases) viven en la fase 2.
const SYSTEM_SELECTOR = `Eres el selector de tours de Finde (marketplace peruano de turismo). Recibes la consulta de un viajero y 8 tours candidatos numerados del 1 al 8. Elige los 3 más relevantes para esa consulta.

REGLAS:
- Respeta restricciones del viajero: si menciona familia con niños, excluye ayahuasca, treks extremos y alta montaña. Si pide algo tranquilo, evita aventura intensa. Si pide económico, prioriza menor priceSoles.
- Si la consulta menciona una ciudad o región específica (ej. Cusco, Arequipa, costa norte), prioriza tours en esa zona; solo elige opciones de otra zona si son objetivamente superiores en relevancia.
- Ante consultas ambiguas prefiere variedad temática (no 3 tours del mismo tipo).
- El orden del array ES tu ranking: el primero es tu mejor recomendación.
- Devuelve SOLO números del 1 al 8, sin repetir.

Llama SIEMPRE elegir_tours. No respondas en texto libre.`;

const TOOL_SELECTOR = {
  name: "elegir_tours",
  description:
    "Devuelve los números (1-8) de los 3 tours más relevantes, en orden de ranking.",
  input_schema: {
    type: "object" as const,
    properties: {
      top_3: {
        type: "array",
        items: { type: "integer", minimum: 1, maximum: 8 },
        minItems: 3,
        maxItems: 3,
      },
    },
    required: ["top_3"],
    additionalProperties: false,
  },
};

// La description va truncada a 500 chars: las descriptions arrancan con los
// datos concretos (distancias, horarios, desnivel) y el recorte ahorra ~2s de
// modelo sin degradar el reasoning (calibrado contra 300 y sin truncar).
function formatCandidatos(c: Candidato[]): string {
  return c
    .map(
      (t, i) => `[${i + 1}]
título: ${t.title}
categoría: ${t.category}
ciudad: ${t.city}, ${t.region}
precio: S/${(t.priceSoles / 100).toFixed(2)}
rating: ${t.rating}
descripción: ${t.description.slice(0, 500)}`
    )
    .join("\n\n");
}

// Devuelve los índices (1-8) elegidos, validados: exactamente 3, enteros en
// rango y sin repetir. Cualquier otra cosa lanza y el handler cae al fallback
// semántico. El modelo nunca ve cuids, así que no puede corromperlos.
async function elegirConClaude(
  query: string,
  candidatos: Candidato[]
): Promise<number[]> {
  const userMessage = `Consulta del viajero: "${query}"

Candidatos:

${formatCandidatos(candidatos)}

Elige los 3 mejores y llama elegir_tours.`;

  const respuesta = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 50,
    system: SYSTEM_SELECTOR,
    tools: [TOOL_SELECTOR],
    tool_choice: { type: "tool", name: TOOL_SELECTOR.name },
    messages: [{ role: "user", content: userMessage }],
  });

  const toolUse = respuesta.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("El modelo no llamó la herramienta elegir_tours");
  }

  const nums = (toolUse.input as { top_3?: unknown }).top_3;
  if (
    !Array.isArray(nums) ||
    nums.length !== 3 ||
    new Set(nums).size !== 3 ||
    !nums.every(
      (n) => Number.isInteger(n) && n >= 1 && n <= candidatos.length
    )
  ) {
    throw new Error(`Índices inválidos del modelo: ${JSON.stringify(nums)}`);
  }
  return nums as number[];
}

const FALLBACK_REASONING = "Resultados ordenados por similitud semántica";

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
      `[search-timing] phase=1 cache=HIT cache_lookup=${t.cache_lookup}ms hydration=${t.hydration}ms total=${t.total}ms results=${cachedResults.length}`
    );
    // HIT: todo junto (results + reasoning). El frontend NO llama fase 2.
    res.status(200).json({
      results: cachedResults,
      reasoning: cached.reasoning,
      query,
      filters_detected:
        (cached.filtersDetected as unknown as FiltrosDetectados) ?? {},
      cached: true,
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
      `[search-timing] phase=1 cache=MISS cache_lookup=${t.cache_lookup}ms embedding=${t.embedding}ms vector=${t.vector}ms total=${t.total}ms results=0`
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

  // Paso 3: el modelo elige 3 de los 8 por índice (con fallback graceful).
  // El fallback semántico NO pasa por la fase 2 ni se cachea.
  let chosenIds: string[];
  let fallback = false;

  s = Date.now();
  try {
    const indices = await elegirConClaude(query, candidatos);
    chosenIds = indices.map((n) => candidatos[n - 1].id);
  } catch (error) {
    console.error("Fase 1 falló, usando fallback semántico:", error);
    chosenIds = candidatos.slice(0, 3).map((c) => c.id);
    fallback = true;
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

  mark("total", t0);

  if (fallback) {
    // El fallback no pasa por la fase 2, así que su SearchLog se escribe acá
    // (vía waitUntil, fuera del camino crítico) y NO se cachea, igual que
    // siempre. El frontend recibe reasoning ≠ null y no llama la fase 2.
    const sLog = Date.now();
    waitUntil(
      db.searchLog
        .create({
          data: {
            query,
            resultIds: results.map((t) => t.id),
            reasoning: FALLBACK_REASONING,
          },
        })
        .catch((error) =>
          console.error("Error guardando SearchLog (no bloqueante):", error)
        )
        .then(() => {
          mark("searchlog", sLog);
          console.log(
            `[search-timing] phase=1 cache=MISS cache_lookup=${t.cache_lookup}ms embedding=${t.embedding}ms vector=${t.vector}ms model=${t.model}ms hydration=${t.hydration}ms searchlog=${t.searchlog}ms total=${t.total}ms results=${results.length} fallback=1`
          );
        })
    );
    res.status(200).json({
      results,
      reasoning: FALLBACK_REASONING,
      query,
      filters_detected: {},
      fallback: true,
    });
    return;
  }

  // Respuesta normal de fase 1: tours validados (los ids salen de
  // candidatos[n-1], nunca del modelo), sin reasoning todavía. phase2Tours
  // lleva los datos que la fase 2 necesita para su prompt (evita rehidratar);
  // la firma liga query normalizada + ids + hash de esos datos, así la fase 2
  // puede confiar en lo que vuelve del cliente al generar y al escribir el
  // cache compartido. SearchLog y FeaturedSearch se escriben en la fase 2.
  const byCandId = new Map(candidatos.map((c) => [c.id, c]));
  const phase2Tours: Phase2Tour[] = chosenIds.map((id) => {
    const c = byCandId.get(id)!;
    return {
      id: c.id,
      title: c.title,
      description: c.description.slice(0, 500),
      category: c.category,
      city: c.city,
      region: c.region,
      priceSoles: c.priceSoles,
      rating: c.rating,
    };
  });
  console.log(
    `[search-timing] phase=1 cache=MISS cache_lookup=${t.cache_lookup}ms embedding=${t.embedding}ms vector=${t.vector}ms model=${t.model}ms hydration=${t.hydration}ms total=${t.total}ms results=${results.length} fallback=0`
  );
  res.status(200).json({
    results,
    reasoning: null,
    query,
    filters_detected: {},
    fallback: false,
    phase2Tours,
    sig: signSearchPhase(normalized, chosenIds, hashPhase2Tours(phase2Tours)),
  });
}
