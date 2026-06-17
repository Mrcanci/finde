// scripts/backfill-quechua.ts
// Backfill puntual: traduce los tours al QUECHUA SUREÑO (variante Cusco-Collao)
// y persiste titleQu / descQu / includedQu / excludedQu en la DB. Acompaña la
// migración docs/migrations/2026-06-16-add-tour-quechua-columns.md.
//
// Usa la MISMA variante de quechua y las MISMAS reglas de traducción que el
// endpoint api/ai/generate-quechua.ts (Claude Sonnet 4.6, tool_use forzado),
// para que el contenido persistido y el on-the-fly sean consistentes. La
// diferencia: este script traduce title + description + included[] + excluded[]
// en UNA sola llamada con salida estructurada (4 campos), en vez de un string.
//
// Uso:
//   # (a) DRY-RUN sobre 2 tours: traduce e IMPRIME, NO escribe en DB.
//   DRY_RUN=1 LIMIT=2 npx dotenv-cli -e .env.local -- npx tsx scripts/backfill-quechua.ts
//
//   # (b) Corrida REAL (todos los tours sin traducir):
//   npx dotenv-cli -e .env.local -- npx tsx scripts/backfill-quechua.ts
//
//   # variantes:
//   LIMIT=5 npx dotenv-cli -e .env.local -- npx tsx scripts/backfill-quechua.ts   # real, solo 5
//   DRY_RUN=1 npx dotenv-cli -e .env.local -- npx tsx scripts/backfill-quechua.ts # dry-run, todos
//
// IDEMPOTENTE: solo procesa tours con titleQu === null. Una segunda corrida
// rellena únicamente los que falten (los ya traducidos se saltean). Un tour solo
// se ESCRIBE si la traducción pasa todas las validaciones; si falla, se saltea y
// se reintenta en la próxima corrida.
//
// Secuencial (sin paralelismo) para no pegarle a los rate limits de Anthropic.

import { db } from "../lib/db";
import { anthropic, MODEL } from "../lib/anthropic";

// Reglas de traducción: COPIA VERBATIM de las reglas 1-6 de
// api/ai/generate-quechua.ts (misma variante Cusco-Collao). Solo cambia la
// sección OUTPUT y la instrucción de tool, porque aquí devolvemos 4 campos
// estructurados en vez de un único string.
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

OUTPUT (traducción de la ficha COMPLETA de un tour):
- Traduce CADA campo respetando las reglas anteriores.
- "includedQu" y "excludedQu" deben tener EXACTAMENTE el mismo número de elementos que las listas de entrada, traduciendo cada ítem EN EL MISMO ORDEN. NO agregues, NO quites, NO reordenes, NO fusiones ítems. Si una lista de entrada está vacía, devuelve una lista vacía.
- Cada ítem de las listas es una frase corta (p. ej. "Transporte ida y vuelta", "Almuerzo buffet"); tradúcelo como frase corta equivalente.
- SIN meta-comentarios, SIN notas del traductor, SIN explicaciones, SIN markdown, SIN emojis.

Llama SIEMPRE la herramienta traducir_tour_a_quechua. No respondas en texto libre.`;

const TOOL = {
  name: "traducir_tour_a_quechua",
  description:
    "Devuelve la traducción al quechua sureño (Cusco-Collao) de los campos de un tour.",
  input_schema: {
    type: "object" as const,
    properties: {
      titleQu: {
        type: "string",
        description: "Traducción al quechua del título del tour.",
      },
      descQu: {
        type: "string",
        description: "Traducción al quechua de la descripción del tour.",
      },
      includedQu: {
        type: "array",
        items: { type: "string" },
        description:
          "Traducción al quechua de la lista 'incluye'. MISMO número de ítems y MISMO orden que la entrada.",
      },
      excludedQu: {
        type: "array",
        items: { type: "string" },
        description:
          "Traducción al quechua de la lista 'no incluye'. MISMO número de ítems y MISMO orden que la entrada.",
      },
    },
    required: ["titleQu", "descQu", "includedQu", "excludedQu"],
    additionalProperties: false,
  },
};

interface TourRow {
  id: string;
  title: string;
  description: string;
  included: string[];
  excluded: string[];
}

interface Translation {
  titleQu: string;
  descQu: string;
  includedQu: string[];
  excludedQu: string[];
}

const DRY_RUN = !!process.env.DRY_RUN;
const LIMIT = process.env.LIMIT ? parseInt(process.env.LIMIT, 10) : null;

function buildUserMessage(t: TourRow): string {
  const fmtList = (xs: string[]) =>
    xs.length ? xs.map((x, i) => `${i + 1}. ${x}`).join("\n") : "(vacía)";

  return `Traduce al quechua sureño (Cusco-Collao) la ficha de este tour. Llama traducir_tour_a_quechua con el resultado.

TÍTULO:
"""
${t.title}
"""

DESCRIPCIÓN:
"""
${t.description}
"""

INCLUYE (${t.included.length} ítems — devuelve EXACTAMENTE ${t.included.length} en includedQu, mismo orden):
${fmtList(t.included)}

NO INCLUYE (${t.excluded.length} ítems — devuelve EXACTAMENTE ${t.excluded.length} en excludedQu, mismo orden):
${fmtList(t.excluded)}`;
}

type ChatMessage = { role: "user" | "assistant"; content: string };

// Una llamada a Claude. Devuelve la Translation validada (shape básico: titleQu/
// descQu strings no vacíos, includedQu/excludedQu arrays). Lanza con un mensaje
// específico si el shape falla, para que el loop reintente con feedback.
async function intentarTraduccion(messages: ChatMessage[]): Promise<Translation> {
  const respuesta = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    tools: [TOOL],
    tool_choice: { type: "tool", name: TOOL.name },
    messages,
  });

  const toolUse = respuesta.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Claude no llamó la herramienta traducir_tour_a_quechua");
  }

  const out = toolUse.input as Partial<Translation>;

  if (typeof out.titleQu !== "string" || out.titleQu.trim().length === 0) {
    throw new Error("titleQu ausente o vacío");
  }
  if (typeof out.descQu !== "string" || out.descQu.trim().length === 0) {
    throw new Error("descQu ausente o vacío");
  }
  if (!Array.isArray(out.includedQu) || !Array.isArray(out.excludedQu)) {
    throw new Error("includedQu/excludedQu no son arrays");
  }

  return {
    titleQu: out.titleQu.trim(),
    descQu: out.descQu.trim(),
    includedQu: out.includedQu.map((x) => String(x)),
    excludedQu: out.excludedQu.map((x) => String(x)),
  };
}

// Loop de hasta 3 intentos con feedback (mirror de api/ai/generate-quechua.ts).
// El fallo "includedQu/excludedQu no son arrays" es NO-determinístico (~25% de
// los tours), por eso reintentar lo convierte en transitorio. Si los 3 intentos
// fallan, relanza el último error → el caller saltea el tour (titleQu=null,
// re-procesable). NO valida el LARGO de las listas aquí: eso lo maneja
// alinearListas() downstream (fallback a español por campo).
async function llamarClaude(t: TourRow): Promise<Translation> {
  const baseMessages: ChatMessage[] = [
    { role: "user", content: buildUserMessage(t) },
  ];
  let messages: ChatMessage[] = baseMessages;
  let ultimoError: Error | null = null;

  for (let intento = 1; intento <= 3; intento++) {
    try {
      return await intentarTraduccion(messages);
    } catch (error) {
      ultimoError = error as Error;
      // Reintento con feedback que nombra el defecto y exige el shape correcto.
      messages = [
        ...baseMessages,
        {
          role: "assistant",
          content: "Realicé un intento previo que no cumplió el formato.",
        },
        {
          role: "user",
          content: `El intento anterior falló: ${ultimoError.message}. Vuelve a llamar traducir_tour_a_quechua devolviendo includedQu como un array JSON con EXACTAMENTE ${t.included.length} ítems y excludedQu con EXACTAMENTE ${t.excluded.length} ítems, cada uno traducido en orden (no como string ni texto unido por saltos de línea), y titleQu/descQu como strings no vacíos.`,
        },
      ];
    }
  }

  // Los 3 intentos fallaron: relanza para que el caller saltee el tour.
  throw ultimoError ?? new Error("traducción falló tras 3 intentos");
}

// Valida el largo de las listas. Si includedQu/excludedQu no coinciden en
// número de ítems con la entrada, deja ESE campo EN ESPAÑOL (no escribe un
// array desalineado). Devuelve los campos finales a persistir + flags de
// fallback para el log.
function alinearListas(
  t: TourRow,
  tr: Translation
): { includedQu: string[]; excludedQu: string[]; incFallback: boolean; excFallback: boolean } {
  const incOk = tr.includedQu.length === t.included.length;
  const excOk = tr.excludedQu.length === t.excluded.length;
  return {
    includedQu: incOk ? tr.includedQu : t.included,
    excludedQu: excOk ? tr.excludedQu : t.excluded,
    incFallback: !incOk,
    excFallback: !excOk,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function main(): Promise<void> {
  const total = await db.tour.count();
  // IDEMPOTENCIA: solo los que aún NO tienen título en quechua.
  const pendientesTodos = await db.tour.findMany({
    where: { titleQu: null },
    select: { id: true, title: true, description: true, included: true, excluded: true },
    orderBy: { createdAt: "asc" },
  });

  const pendientes =
    LIMIT != null ? pendientesTodos.slice(0, LIMIT) : pendientesTodos;

  console.log(
    `Tours totales: ${total}. Sin traducir (titleQu=null): ${pendientesTodos.length}.` +
      (LIMIT != null ? ` LIMIT=${LIMIT} → procesando ${pendientes.length}.` : "") +
      (DRY_RUN ? " MODO DRY_RUN (no se escribe en DB)." : "")
  );

  if (pendientes.length === 0) {
    console.log("Nada que hacer: no quedan tours sin traducir.");
    await db.$disconnect();
    return;
  }

  let traducidos = 0;
  let fallidos = 0;
  const fallbacks: string[] = [];

  for (const [idx, t] of pendientes.entries()) {
    const tag = `[${idx + 1}/${pendientes.length}] ${t.id} — "${t.title.slice(0, 50)}"`;
    try {
      const tr = await llamarClaude(t);
      const { includedQu, excludedQu, incFallback, excFallback } = alinearListas(t, tr);

      if (incFallback) {
        fallbacks.push(`${t.id}: includedQu (${tr.includedQu.length} vs ${t.included.length}) → ES`);
      }
      if (excFallback) {
        fallbacks.push(`${t.id}: excludedQu (${tr.excludedQu.length} vs ${t.excluded.length}) → ES`);
      }

      if (DRY_RUN) {
        console.log(`\nOK (dry-run) ${tag}`);
        console.log(`  titleQu: ${tr.titleQu}`);
        console.log(`  descQu:  ${tr.descQu.slice(0, 120)}${tr.descQu.length > 120 ? "…" : ""}`);
        console.log(`  includedQu (${includedQu.length}${incFallback ? ", FALLBACK ES" : ""}): ${JSON.stringify(includedQu)}`);
        console.log(`  excludedQu (${excludedQu.length}${excFallback ? ", FALLBACK ES" : ""}): ${JSON.stringify(excludedQu)}`);
      } else {
        await db.tour.update({
          where: { id: t.id },
          data: {
            titleQu: tr.titleQu,
            descQu: tr.descQu,
            includedQu,
            excludedQu,
          },
        });
        const flags = [incFallback && "inc→ES", excFallback && "exc→ES"].filter(Boolean).join(",");
        console.log(`OK ${tag}${flags ? ` (${flags})` : ""}`);
      }
      traducidos++;
    } catch (error) {
      fallidos++;
      console.error(`FALLÓ (saltado) ${tag}: ${(error as Error).message}`);
    }

    // Pausa corta entre tours: amable con el rate limit.
    if (idx < pendientes.length - 1) await sleep(500);
  }

  console.log(
    `\nResumen: ${traducidos} ${DRY_RUN ? "traducidos (dry-run, sin escribir)" : "traducidos y escritos"}, ` +
      `${fallidos} fallidos/saltados, ${pendientesTodos.length - pendientes.length} fuera del LIMIT.`
  );
  if (fallbacks.length) {
    console.log(`Listas dejadas en español por desalineo (${fallbacks.length}):`);
    for (const f of fallbacks) console.log(`  - ${f}`);
  }

  await db.$disconnect();
}

main().catch(async (e) => {
  console.error("Error fatal en backfill-quechua:", e);
  await db.$disconnect();
  process.exit(1);
});
