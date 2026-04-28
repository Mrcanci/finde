// api/ai/generate-quechua.ts
// POST /api/ai/generate-quechua — traducción de español a quechua sureño
// (variante Cusco-Collao). Endpoint para que operadores generen una versión
// en quechua de la descripción de su tour. Claude Sonnet 4.6 con tool_use
// forzado. Reintento con feedback si la validación falla; 502 si vuelve a
// fallar; 500 ante errores de red/SDK persistentes.

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { anthropic, MODEL } from "../../lib/anthropic";

const bodySchema = z.object({
  spanishText: z.string().trim().min(50).max(1500),
});

interface GeneratedTranslation {
  quechuaText: string;
}

type ChatMessage = { role: "user" | "assistant"; content: string };

const SYSTEM_PROMPT = `Eres traductor especializado de español a QUECHUA SUREÑO, variante Cusco-Collao (qheswa simi de Cusco, Puno y Apurímac). Es la variante mayoritaria del Perú andino. NO traduces a quechua boliviano, NO a quechua ayacuchano-chanka, NO a kichwa ecuatoriano. NO mezcles variantes.

Tu trabajo es producir una traducción USABLE por un quechuahablante de Cusco, no una traducción académica ni una transliteración palabra por palabra. Mantén el SENTIDO y el TONO del original — si el español es respetuoso y formal, el quechua también lo será.

REGLAS:

1. Persona y trato:
   - Si el español dice "tú / te / tu", usa la 2da persona singular en quechua: "qam", sufijos -yki / -nki según corresponda.
   - Si el español es impersonal, mantén impersonal en quechua.

2. TÉRMINOS MODERNOS sin equivalente quechua antiguo:
   - Déjalos EN ESPAÑOL entre comillas dobles dentro del texto quechua.
   - Aplica a: "GPS", "WhatsApp", "PeruRail Expedition", "carbono-14", "boleto", "WiFi", "Mincetur", "SERNANP", marcas, nombres de empresas, terminología técnica/científica moderna.
   - NO inventes neologismos quechuas para conceptos modernos.
   - Préstamos del español ya integrados al quechua andino sí se aceptan (ej: "kawallu" para caballo, "kuntur" para cóndor, "papa", "iskay", etc.).

3. TOPÓNIMOS y nombres propios:
   - Déjalos COMO ESTÁN en su forma usual: Machu Picchu, Cusco, Ollantaytambo, Pisac, Vinicunca, Apurímac, Ausangate.
   - No los re-romanices a ortografía quechua académica (no escribir "Qosqo" si el original dice "Cusco").
   - Nombres de personas, empresas y agencias también se mantienen.

4. Números:
   - Mantén los números arábigos del original: "4,200 msnm", "5:00 AM", "12 km".
   - NO traduzcas a numerales quechuas (no "tawa-waranqa iskay-pachak").
   - Las unidades (msnm, km, AM, PM, soles, S/) también se mantienen.

5. Frases imposibles de traducir razonablemente:
   - Si una oración entera es técnica, legal o de pago digital sin posibilidad de quechua natural, MEJOR omítela o resúmela brevemente en quechua que producir quechua forzado o macarrónico.
   - El resultado debe sonar a quechua hablado, no a traducción de Google.

6. Ortografía:
   - Usa ortografía pan-quechua estándar (k, q, w, y) — la más extendida en escuelas EIB del sur peruano.
   - Triple vocálica (a, i, u). NO uses la pentavocálica académica (no e/o salvo en préstamos del español).

OUTPUT:
- Solo el texto traducido como un único string.
- SIN meta-comentarios, SIN notas del traductor, SIN explicaciones, SIN "Aquí está la traducción:".
- SIN markdown, SIN emojis.

Llama SIEMPRE la herramienta traducir_a_quechua. No respondas en texto libre.`;

const TOOL = {
  name: "traducir_a_quechua",
  description:
    "Devuelve la traducción del texto español a quechua sureño Cusco-Collao.",
  input_schema: {
    type: "object" as const,
    properties: {
      quechuaText: {
        type: "string",
        description:
          "Traducción al quechua sureño (Cusco-Collao). Conserva topónimos, números arábigos y términos modernos en español entre comillas. Sin meta-comentarios.",
      },
    },
    required: ["quechuaText"],
    additionalProperties: false,
  },
};

async function llamarClaude(
  messages: ChatMessage[]
): Promise<GeneratedTranslation> {
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
    throw new Error("Claude no llamó la herramienta traducir_a_quechua");
  }

  const out = toolUse.input as GeneratedTranslation;

  if (typeof out.quechuaText !== "string") {
    throw new Error("quechuaText no es string");
  }

  return { quechuaText: out.quechuaText.trim() };
}

function validarSalida(t: GeneratedTranslation): string | null {
  if (t.quechuaText.length < 30 || t.quechuaText.length > 3000) {
    return `quechuaText fuera de rango (${t.quechuaText.length} chars, requerido 30-3000)`;
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

  const userMessage = `Traduce al quechua sureño (Cusco-Collao) el siguiente texto en español. Llama traducir_a_quechua con el resultado.

Texto en español:
"""
${parsed.data.spanishText}
"""`;

  // Loop con reintento inteligente (mismo patrón que generate-description):
  // - Si la 1ª llamada falla por VALIDACIÓN, reintentamos con feedback.
  // - Si falla por error de RED/SDK, reintentamos con el prompt original.
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
        `Traductor quechua: validación falló en intento ${intento}: ${errorValidacion}`
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
            content: `El intento anterior falló: ${errorValidacion}. Genera la traducción de nuevo respetando el rango de longitud (entre 30 y 3000 caracteres).`,
          },
        ];
      }
    } catch (error) {
      console.error(
        `Error llamando a Claude para traducción (intento ${intento}):`,
        error
      );
      if (intento === 2) {
        res.status(500).json({ error: "Error generando traducción" });
        return;
      }
      // Reintento sin feedback: mantenemos messages como esté (original).
    }
  }

  res.status(502).json({ error: "El traductor no produjo contenido válido" });
}
