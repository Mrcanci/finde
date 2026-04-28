// api/ai/generate-description.ts
// POST /api/ai/generate-description — generador IA B2B para operadores.
// Recibe datos básicos del tour (título, categoría, duración, ciudad, highlights)
// y devuelve description (200-300 palabras), shortPitch (≤80 chars) y
// seoKeywords (5-8 keywords). Claude Sonnet 4.6 con tool_use forzado.
// Reintento con feedback si la validación post-Claude falla; 502 si vuelve a
// fallar; 500 ante errores de red/SDK persistentes.

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { anthropic, MODEL } from "../../lib/anthropic";

const CATEGORIES = ["adventure", "cultural", "gastronomy", "nature", "mystic"] as const;

const bodySchema = z.object({
  title: z.string().trim().min(3).max(100),
  category: z.enum(CATEGORIES),
  durationHours: z.number().int().min(1).max(168),
  city: z.string().trim().min(1).max(50),
  region: z.string().trim().min(1).max(50),
  highlights: z
    .array(z.string().trim().min(5).max(100))
    .min(1)
    .max(5),
  included: z
    .array(z.string().trim().min(1).max(100))
    .min(1)
    .max(10)
    .optional(),
});

type Body = z.infer<typeof bodySchema>;

interface GeneratedContent {
  description: string;
  shortPitch: string;
  seoKeywords: string[];
}

type ChatMessage = { role: "user" | "assistant"; content: string };

const SYSTEM_PROMPT = `Eres redactor de contenido para Finde, un marketplace peruano de experiencias turísticas curadas. Operadores reales (agencias, guías independientes) te dan los datos básicos de su tour y tú generas la ficha pública que verán los viajeros en la app.

Escribes COMO UN OPERADOR PERUANO PROFESIONAL escribiría su propio tour: con conocimiento de campo, datos concretos y sin marketing barato. NO eres un copywriter de agencia internacional, NO eres un blog de viajes.

REGLAS DE CONTENIDO:

1. description (200-300 palabras, alrededor de 1500 caracteres):
   - Específica, no genérica. Si el título dice "Vinicunca" hablas de los 5,200 msnm, del óxido férrico que da el rojo, del nevado Ausangate al fondo. Si es "Mercado de San Pedro" hablas de los puestos de jugos, las causas de la sección Bartola, el horario real.
   - Incluye SIEMPRE datos concretos cuando el título o los highlights lo permitan: altitudes (msnm), distancias (km), horarios de salida y retorno, duración por tramo, técnica involucrada, dato histórico/geológico/cultural relevante, regulación o normativa peruana si aplica (Mincetur, SERNANP, Ministerio de Cultura).
   - Los highlights del operador son la materia prima — exprímelos. Si el operador dice "tren PeruRail" tú escribes "tren PeruRail Expedition de las 7:45 AM, viaje de 1h 40min siguiendo el río Vilcanota". No los repitas literal: úsalos para construir narrativa con detalle.
   - Si no tienes el dato, NO lo inventes. Mejor describir qué hace el viajero ese momento que rellenar con relleno.
   - Tono peruano profesional: tutea ("llevas", "subes", "te recogemos"), expresiones cotidianas suaves ("ojo con la altura", "vale la pena llegar temprano"). NO español neutro de Madrid, NO inglés traducido.
   - Cierra con info práctica útil: qué llevar, advertencia de altitud si aplica, capacidad por guía, restricción etaria/médica si corresponde.

2. shortPitch (máximo 80 caracteres):
   - Un gancho concreto que se lea bien en la card de la app.
   - Menciona el dato más distintivo del tour, no el beneficio genérico.
   - Bien: "Tren PeruRail + ciudadela inca con guía oficial Mincetur"
   - Bien: "Trekking 6km a 5,200 msnm con vista al Ausangate"
   - Mal: "Descubre la magia de los Andes" / "Una experiencia única"

3. seoKeywords (5-8 keywords):
   - Útiles para SEO orgánico de Google peruano.
   - Mezcla: nombre del tour, ciudad/región, categoría, términos de búsqueda real ("tour", "full day", "trekking", "city tour").
   - Incluye SIEMPRE el topónimo específico (no solo "Cusco" — también "Valle Sagrado", "Ollantaytambo", lo que aplique).
   - Sin hashtags, sin comillas, en minúsculas, sin tildes opcionales (Google maneja ambas).

CLICHÉS PROHIBIDOS — si usas alguno de estos, fallaste:
- "experiencia mágica", "experiencia inolvidable", "experiencia única"
- "vive el Perú", "descubre el Perú", "descubre la magia"
- "vibras", "pachamama" (cuando se usan como decoración superficial)
- "viaje del alma", "transformación interior", "conexión con tu ser"
- "lugar paradisíaco", "rincón mágico", "paraíso escondido"
- "imperdible", "no te lo pierdas", "sin igual"
- exclamaciones excesivas con "!" (máximo cero, idealmente)
- adjetivos vacíos en cadena ("hermoso, increíble, espectacular")

ESTILO DE REFERENCIA (así escribe Finde):
"Salida 5:00 AM desde Cusco hacia Cachora (4h en transporte privado). Trekking descendente de 12 km hasta Playa Rosalina (1,500 msnm), 6h de caminata bajando 1,500m de desnivel. Acampamos junto al río Apurímac."

Llama SIEMPRE la herramienta generar_ficha_tour. No respondas en texto libre.`;

const TOOL = {
  name: "generar_ficha_tour",
  description:
    "Genera la ficha pública del tour: descripción larga, gancho corto y keywords SEO.",
  input_schema: {
    type: "object" as const,
    properties: {
      description: {
        type: "string",
        description:
          "Descripción de 200-300 palabras (entre 1000 y 2500 caracteres). Específica, con datos concretos, sin clichés, en peruano profesional. Cierra con info práctica.",
      },
      shortPitch: {
        type: "string",
        description:
          "Gancho de máximo 80 caracteres con el dato más distintivo del tour. Sin clichés.",
      },
      seoKeywords: {
        type: "array",
        items: { type: "string" },
        minItems: 5,
        maxItems: 8,
        description:
          "Entre 5 y 8 keywords SEO útiles, en minúsculas, incluyendo topónimos específicos.",
      },
    },
    required: ["description", "shortPitch", "seoKeywords"],
    additionalProperties: false,
  },
};

function buildUserMessage(b: Body): string {
  const partes = [
    `Datos del tour proporcionados por el operador:`,
    ``,
    `Título: ${b.title}`,
    `Categoría: ${b.category}`,
    `Duración: ${b.durationHours} horas`,
    `Ciudad: ${b.city}`,
    `Región: ${b.region}`,
    ``,
    `Highlights (qué tiene de único, según el operador):`,
    ...b.highlights.map((h, i) => `  ${i + 1}. ${h}`),
  ];

  if (b.included && b.included.length > 0) {
    partes.push(``, `Qué incluye el precio:`);
    partes.push(...b.included.map((x, i) => `  ${i + 1}. ${x}`));
  }

  partes.push(
    ``,
    `Genera la ficha pública del tour llamando generar_ficha_tour.`
  );

  return partes.join("\n");
}

async function llamarClaude(messages: ChatMessage[]): Promise<GeneratedContent> {
  const respuesta = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    tools: [TOOL],
    tool_choice: { type: "tool", name: TOOL.name },
    messages,
  });

  const toolUse = respuesta.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Claude no llamó la herramienta generar_ficha_tour");
  }

  const out = toolUse.input as GeneratedContent;

  if (typeof out.description !== "string") {
    throw new Error("description no es string");
  }
  if (typeof out.shortPitch !== "string") {
    throw new Error("shortPitch no es string");
  }
  if (!Array.isArray(out.seoKeywords)) {
    throw new Error("seoKeywords no es array");
  }

  return {
    description: out.description.trim(),
    shortPitch: out.shortPitch.trim(),
    seoKeywords: out.seoKeywords.map((k) => k.trim().toLowerCase()),
  };
}

function validarSalida(c: GeneratedContent): string | null {
  if (c.description.length < 1000 || c.description.length > 2500) {
    return `description fuera de rango (${c.description.length} chars, requerido 1000-2500)`;
  }
  if (c.shortPitch.length === 0 || c.shortPitch.length > 80) {
    return `shortPitch fuera de rango (${c.shortPitch.length} chars, requerido 1-80)`;
  }
  if (c.seoKeywords.length < 5 || c.seoKeywords.length > 8) {
    return `seoKeywords fuera de rango (${c.seoKeywords.length} items, requerido 5-8)`;
  }
  if (c.seoKeywords.some((k) => k.length === 0)) {
    return "seoKeywords contiene strings vacíos";
  }
  return null;
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

  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "Cuerpo inválido",
      details: parsed.error.issues,
    });
    return;
  }

  const userMessage = buildUserMessage(parsed.data);

  // Loop con reintento inteligente:
  // - Si la 1ª llamada falla por VALIDACIÓN, reintentamos pasándole a Claude
  //   un mensaje de feedback con el error específico.
  // - Si la 1ª llamada falla por error de RED/SDK, reintentamos con el prompt
  //   original (no hay nada útil que comunicarle a Claude).
  const baseMessages: ChatMessage[] = [{ role: "user", content: userMessage }];
  let messages: ChatMessage[] = baseMessages;

  for (let intento = 1; intento <= 2; intento++) {
    try {
      const generado = await llamarClaude(messages);
      const errorValidacion = validarSalida(generado);

      if (!errorValidacion) {
        res.status(200).json(generado);
        return;
      }

      console.error(
        `Generador IA: validación falló en intento ${intento}: ${errorValidacion}`
      );

      if (intento === 1) {
        messages = [
          ...baseMessages,
          {
            role: "assistant",
            content: "Realicé un intento previo que no cumplió los criterios.",
          },
          {
            role: "user",
            content: `El intento anterior falló: ${errorValidacion}. Genera de nuevo respetando estrictamente los rangos especificados en las reglas (description 1000-2500 caracteres, shortPitch ≤80 caracteres, seoKeywords 5-8 items).`,
          },
        ];
      }
    } catch (error) {
      console.error(`Error llamando a Claude (intento ${intento}):`, error);
      if (intento === 2) {
        res.status(500).json({ error: "Error generando contenido" });
        return;
      }
      // Reintento sin feedback: mantenemos messages como esté (original).
    }
  }

  res.status(502).json({ error: "El generador no produjo contenido válido" });
}
