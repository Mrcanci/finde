// api/search.ts
// POST /api/search — búsqueda semántica con pgvector + re-ranking con Claude.
// Flujo: embedding del query (Voyage) → top 8 candidatos (pgvector <=>)
// → Claude Sonnet 4.6 elige 3 con reasoning peruano → SearchLog → respuesta.
// Si Claude falla por cualquier razón, fallback graceful con top 3 semánticos.

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { db } from "../lib/db.js";
import { voyage, MODEL_EMBED, DIM } from "../lib/voyage.js";
import { anthropic, MODEL } from "../lib/anthropic.js";
import { LIST_SELECT } from "../lib/tour-select.js";
import { rateLimit, ipFromRequest } from "../lib/rate-limit.js";

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
2. Explicar en 1–2 frases POR QUÉ esos tres son la mejor recomendación (no qué son — el usuario ya ve la ficha).
3. Detectar filtros implícitos en la consulta: categoría (adventure | cultural | gastronomy | nature | mystic), ciudad, presupuesto máximo en soles, duración aproximada.

REGLAS:
- Solo puedes elegir IDs de los 8 candidatos. Nunca inventes ni recomiendes nada fuera de esa lista.
- Respeta restricciones del viajero. Si menciona familia con niños, excluye ayahuasca, treks extremos y alta montaña. Si pide algo tranquilo, evita aventura intensa. Si pide económico, prioriza menor priceSoles.
- Si la consulta menciona una ciudad o región específica (ej. Cusco, Arequipa, costa norte), prioriza tours en esa zona. Solo recomienda opciones cercanas si son objetivamente superiores en relevancia, y aclara la ubicación en el reasoning.
- Ante consultas ambiguas prefiere variedad temática (no 3 tours del mismo tipo).
- El reasoning debe sonar a peruano natural y cálido, como un guía peruano experimentado recomendando: tutea ("te"), usa expresiones cotidianas como "te va a encantar", "cae bien", "ideal para arrancar". Evita el español neutro y los clichés ("pachamama", "vibras", "experiencia mágica").
- Máximo 2 frases. Sin emojis. Sin listar los tours uno por uno.

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
          "IDs (cuid) de los 3 tours elegidos, en orden de relevancia. Deben venir EXACTAMENTE de la lista de candidatos.",
      },
      reasoning: {
        type: "string",
        description:
          "1–2 frases en español peruano natural explicando por qué estos 3 son la mejor recomendación.",
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

function formatCandidatos(c: Candidato[]): string {
  return c
    .map(
      (t, i) => `[${i + 1}] id=${t.id}
título: ${t.title}
categoría: ${t.category}
ciudad: ${t.city}, ${t.region}
precio: S/${(t.priceSoles / 100).toFixed(2)}
rating: ${t.rating}
descripción: ${t.description}`
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

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
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

  // Paso 1: embedding del query (inputType "query" para retrieval asimétrico)
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

  // Paso 2: top 8 candidatos por distancia cosenoidal (pgvector <=>)
  const vectorLiteral = JSON.stringify(queryEmbedding);
  let candidatos: Candidato[];
  try {
    candidatos = await db.$queryRaw<Candidato[]>`
      SELECT id, title, description, category::text AS category, city, region,
             "priceSoles", "imageUrl", rating
      FROM "Tour"
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> ${vectorLiteral}::vector
      LIMIT 8
    `;
  } catch (error) {
    console.error("Error en similarity search pgvector:", error);
    res.status(500).json({ error: "Error al procesar la búsqueda" });
    return;
  }

  if (candidatos.length === 0) {
    res.status(200).json({
      results: [],
      reasoning:
        "Por ahora no encontramos tours que calcen con tu búsqueda. Prueba con otras palabras.",
      query,
      filters_detected: {},
    });
    return;
  }

  // Paso 3: Claude re-rankea (con fallback graceful)
  let chosenIds: string[];
  let reasoning: string;
  let filtersDetected: FiltrosDetectados;

  try {
    const decision = await decidirConClaude(query, candidatos);
    chosenIds = decision.top_3_ids;
    reasoning = decision.reasoning;
    filtersDetected = decision.filters_detected;
  } catch (error) {
    console.error("Claude falló, usando fallback semántico:", error);
    chosenIds = candidatos.slice(0, 3).map((c) => c.id);
    reasoning = "Resultados ordenados por similitud semántica";
    filtersDetected = {};
  }

  // Paso 4: hidratamos con LIST_SELECT (incluye operator name + verified)
  const tours = await db.tour.findMany({
    where: { id: { in: chosenIds } },
    select: LIST_SELECT,
  });

  // Reordenar según el orden elegido (findMany no respeta el orden de in:)
  const byId = new Map(tours.map((t) => [t.id, t]));
  const results = chosenIds
    .map((id) => byId.get(id))
    .filter((t): t is NonNullable<typeof t> => t != null);

  // Paso 5: SearchLog (no bloqueante — un fallo de log no debe romper la respuesta)
  try {
    await db.searchLog.create({
      data: {
        query,
        resultIds: results.map((t) => t.id),
        reasoning,
      },
    });
  } catch (error) {
    console.error("Error guardando SearchLog (no bloqueante):", error);
  }

  res.status(200).json({
    results,
    reasoning,
    query,
    filters_detected: filtersDetected,
  });
}
