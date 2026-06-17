// scripts/backfill-quechua.ts
// Backfill puntual: traduce los tours al QUECHUA SUREÑO (variante Cusco-Collao)
// y persiste los campos *Qu en la DB. Acompaña las migraciones
// docs/migrations/2026-06-16-add-tour-quechua-columns.md y
// docs/migrations/2026-06-16-add-tour-quechua-meetingpoint-shortpitch.md.
//
// Campos traducibles (6): titleQu, descQu, shortPitchQu, meetingPointQu (strings)
// e includedQu, excludedQu (listas). Usa la MISMA variante de quechua y reglas
// que api/ai/generate-quechua.ts (Claude Sonnet 4.6, tool_use forzado).
//
// PARCIAL E IDEMPOTENTE: por cada tour solo traduce los campos *Qu que están
// vacíos Y cuya fuente en español existe. NO re-traduce ni pisa los *Qu que ya
// tienen valor, y escribe un update SOLO con los campos recién traducidos. Así:
//   - los 40 tours ya traducidos (title/desc/included/excluded) solo reciben
//     meetingPointQu/shortPitchQu;
//   - un tour nuevo (todo null) recibe los 6;
//   - un campo con fuente null/vacía (p. ej. meetingPoint null) se deja en null.
//
// Uso:
//   # (a) DRY-RUN sobre 2 tours: traduce e IMPRIME, NO escribe en DB.
//   DRY_RUN=1 LIMIT=2 npx dotenv-cli -e .env.local -- npx tsx scripts/backfill-quechua.ts
//
//   # (b) Corrida REAL (todos los tours con campos faltantes):
//   npx dotenv-cli -e .env.local -- npx tsx scripts/backfill-quechua.ts
//
//   # variantes:
//   LIMIT=5 npx dotenv-cli -e .env.local -- npx tsx scripts/backfill-quechua.ts   # real, solo 5
//   DRY_RUN=1 npx dotenv-cli -e .env.local -- npx tsx scripts/backfill-quechua.ts # dry-run, todos
//
// Tras completar, un re-run reporta "nada que hacer" (ningún campo faltante).
// Secuencial (sin paralelismo) para no pegarle a los rate limits de Anthropic.

import { db } from "../lib/db";
import { anthropic, MODEL } from "../lib/anthropic";

// Reglas de traducción: COPIA VERBATIM de las reglas 1-6 de
// api/ai/generate-quechua.ts (misma variante Cusco-Collao). Solo cambia la
// sección OUTPUT y la instrucción de tool, porque aquí devolvemos campos
// estructurados (los que se pidan en cada tour) en vez de un único string.
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

OUTPUT (traducción de los campos indicados de un tour):
- Traduce SOLO los campos que se te piden, respetando las reglas anteriores.
- Las listas ("includedQu"/"excludedQu") deben tener EXACTAMENTE el mismo número de elementos que la lista de entrada, traduciendo cada ítem EN EL MISMO ORDEN. NO agregues, NO quites, NO reordenes, NO fusiones ítems.
- Cada ítem de las listas es una frase corta (p. ej. "Transporte ida y vuelta", "Almuerzo buffet"); tradúcelo como frase corta equivalente.
- SIN meta-comentarios, SIN notas del traductor, SIN explicaciones, SIN markdown, SIN emojis.

Llama SIEMPRE la herramienta traducir_tour_a_quechua. No respondas en texto libre.`;

interface TourRow {
  id: string;
  title: string;
  description: string;
  included: string[];
  excluded: string[];
  meetingPoint: string | null;
  shortPitch: string | null;
  titleQu: string | null;
  descQu: string | null;
  includedQu: string[];
  excludedQu: string[];
  meetingPointQu: string | null;
  shortPitchQu: string | null;
}

// Una "QuKey" es el nombre de columna *Qu. Cada campo declara su tipo (string o
// lista), su fuente en español (src) y su valor *Qu actual (cur), para decidir
// si falta traducir y para traducir solo lo necesario.
type QuKey =
  | "titleQu"
  | "descQu"
  | "shortPitchQu"
  | "meetingPointQu"
  | "includedQu"
  | "excludedQu";

interface Campo {
  qu: QuKey;
  kind: "string" | "list";
  label: string;
  src: (t: TourRow) => string | string[] | null;
  cur: (t: TourRow) => string | string[] | null;
}

const CAMPOS: Campo[] = [
  { qu: "titleQu", kind: "string", label: "TÍTULO", src: (t) => t.title, cur: (t) => t.titleQu },
  { qu: "descQu", kind: "string", label: "DESCRIPCIÓN", src: (t) => t.description, cur: (t) => t.descQu },
  { qu: "shortPitchQu", kind: "string", label: "PITCH CORTO", src: (t) => t.shortPitch, cur: (t) => t.shortPitchQu },
  { qu: "meetingPointQu", kind: "string", label: "PUNTO DE ENCUENTRO", src: (t) => t.meetingPoint, cur: (t) => t.meetingPointQu },
  { qu: "includedQu", kind: "list", label: "INCLUYE", src: (t) => t.included, cur: (t) => t.includedQu },
  { qu: "excludedQu", kind: "list", label: "NO INCLUYE", src: (t) => t.excluded, cur: (t) => t.excludedQu },
];

const DRY_RUN = !!process.env.DRY_RUN;
const LIMIT = process.env.LIMIT ? parseInt(process.env.LIMIT, 10) : null;

// Campos que faltan traducir en un tour: el *Qu está vacío Y la fuente existe.
// - string: cur null/"" y src con texto.
// - list: cur [] y src con al menos 1 ítem.
// Un campo con fuente vacía (meetingPoint null, included []) NO se incluye → su
// *Qu queda como está (null / []).
function camposFaltantes(t: TourRow): Campo[] {
  return CAMPOS.filter((c) => {
    const cur = c.cur(t);
    const src = c.src(t);
    if (c.kind === "list") {
      const curEmpty = !Array.isArray(cur) || cur.length === 0;
      const srcPresent = Array.isArray(src) && src.length > 0;
      return curEmpty && srcPresent;
    }
    const curEmpty = !cur || String(cur).trim().length === 0;
    const srcPresent = !!src && String(src).trim().length > 0;
    return curEmpty && srcPresent;
  });
}

// Tool dinámico: solo expone (y exige) los campos a traducir en ESTE tour.
function buildTool(campos: Campo[]) {
  const properties: Record<string, unknown> = {};
  const required: string[] = [];
  for (const c of campos) {
    properties[c.qu] =
      c.kind === "list"
        ? {
            type: "array",
            items: { type: "string" },
            description: `Traducción al quechua de "${c.label}". MISMO número de ítems y orden que la entrada.`,
          }
        : {
            type: "string",
            description: `Traducción al quechua de "${c.label}".`,
          };
    required.push(c.qu);
  }
  return {
    name: "traducir_tour_a_quechua",
    description:
      "Devuelve la traducción al quechua sureño (Cusco-Collao) de los campos indicados de un tour.",
    input_schema: {
      type: "object" as const,
      properties,
      required,
      additionalProperties: false,
    },
  };
}

function fmtList(xs: string[]): string {
  return xs.length ? xs.map((x, i) => `${i + 1}. ${x}`).join("\n") : "(vacía)";
}

function buildUserMessage(t: TourRow, campos: Campo[]): string {
  const bloques = campos
    .map((c) => {
      if (c.kind === "list") {
        const xs = c.src(t) as string[];
        return `${c.label} (${xs.length} ítems — devuelve EXACTAMENTE ${xs.length} en ${c.qu}, mismo orden):\n${fmtList(xs)}`;
      }
      return `${c.label}:\n"""\n${c.src(t) as string}\n"""`;
    })
    .join("\n\n");

  return `Traduce al quechua sureño (Cusco-Collao) SOLO los siguientes campos de este tour. Llama traducir_tour_a_quechua devolviendo únicamente esos campos.

${bloques}`;
}

type ChatMessage = { role: "user" | "assistant"; content: string };
type Result = Partial<Record<QuKey, string | string[]>>;

// Una llamada a Claude. Valida el shape básico de CADA campo pedido (strings no
// vacíos, listas son arrays). Lanza con mensaje específico si falla, para que el
// loop reintente con feedback. NO valida el LARGO de las listas (eso pasa al
// escribir, con fallback a español por campo).
async function intentarTraduccion(
  messages: ChatMessage[],
  tool: ReturnType<typeof buildTool>,
  campos: Campo[]
): Promise<Result> {
  const respuesta = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    tools: [tool],
    tool_choice: { type: "tool", name: tool.name },
    messages,
  });

  const toolUse = respuesta.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Claude no llamó la herramienta traducir_tour_a_quechua");
  }

  const out = toolUse.input as Record<string, unknown>;
  const result: Result = {};

  for (const c of campos) {
    const v = out[c.qu];
    if (c.kind === "list") {
      if (!Array.isArray(v)) throw new Error(`${c.qu} no es array`);
      result[c.qu] = v.map((x) => String(x));
    } else {
      if (typeof v !== "string" || v.trim().length === 0) {
        throw new Error(`${c.qu} ausente o vacío`);
      }
      result[c.qu] = v.trim();
    }
  }

  return result;
}

// Loop de hasta 3 intentos con feedback (mirror de api/ai/generate-quechua.ts).
// El fallo "X no es array" / "X ausente" es NO-determinístico, por eso reintentar
// lo convierte en transitorio. Si los 3 intentos fallan, relanza el último error
// → el caller saltea el tour (campos quedan sin traducir, re-procesables).
async function llamarClaude(t: TourRow, campos: Campo[]): Promise<Result> {
  const tool = buildTool(campos);
  const baseMessages: ChatMessage[] = [
    { role: "user", content: buildUserMessage(t, campos) },
  ];
  let messages: ChatMessage[] = baseMessages;
  let ultimoError: Error | null = null;

  const listas = campos.filter((c) => c.kind === "list");
  const detalleListas = listas
    .map((c) => `${c.qu} con EXACTAMENTE ${(c.src(t) as string[]).length} ítems`)
    .join(" y ");

  for (let intento = 1; intento <= 3; intento++) {
    try {
      return await intentarTraduccion(messages, tool, campos);
    } catch (error) {
      ultimoError = error as Error;
      messages = [
        ...baseMessages,
        {
          role: "assistant",
          content: "Realicé un intento previo que no cumplió el formato.",
        },
        {
          role: "user",
          content: `El intento anterior falló: ${ultimoError.message}. Vuelve a llamar traducir_tour_a_quechua devolviendo EXACTAMENTE estos campos: ${campos
            .map((c) => c.qu)
            .join(", ")}.${
            detalleListas
              ? ` Las listas (${detalleListas}) deben ser arrays JSON, cada ítem traducido en orden (no como string ni texto unido por saltos de línea).`
              : ""
          } Los textos deben ser strings no vacíos.`,
        },
      ];
    }
  }

  throw ultimoError ?? new Error("traducción falló tras 3 intentos");
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function main(): Promise<void> {
  const total = await db.tour.count();
  // SELECCIÓN: tours nuevos (titleQu null → todo por traducir) MÁS los ya
  // traducidos que solo necesitan los 2 campos nuevos (meetingPoint/shortPitch).
  const pendientesTodos = (await db.tour.findMany({
    where: {
      OR: [
        { titleQu: null },
        { AND: [{ meetingPoint: { not: null } }, { meetingPointQu: null }] },
        { AND: [{ shortPitch: { not: null } }, { shortPitchQu: null }] },
      ],
    },
    select: {
      id: true,
      title: true,
      description: true,
      included: true,
      excluded: true,
      meetingPoint: true,
      shortPitch: true,
      titleQu: true,
      descQu: true,
      includedQu: true,
      excludedQu: true,
      meetingPointQu: true,
      shortPitchQu: true,
    },
    orderBy: { createdAt: "asc" },
  })) as TourRow[];

  const pendientes =
    LIMIT != null ? pendientesTodos.slice(0, LIMIT) : pendientesTodos;

  console.log(
    `Tours totales: ${total}. Con campos *Qu faltantes: ${pendientesTodos.length}.` +
      (LIMIT != null ? ` LIMIT=${LIMIT} → procesando ${pendientes.length}.` : "") +
      (DRY_RUN ? " MODO DRY_RUN (no se escribe en DB)." : "")
  );

  if (pendientes.length === 0) {
    console.log("Nada que hacer: no quedan tours con campos por traducir.");
    await db.$disconnect();
    return;
  }

  let traducidos = 0;
  let fallidos = 0;
  const fallbacks: string[] = [];

  for (const [idx, t] of pendientes.entries()) {
    const campos = camposFaltantes(t);
    const tag = `[${idx + 1}/${pendientes.length}] ${t.id} — "${t.title.slice(0, 45)}" [${campos.map((c) => c.qu).join(",")}]`;

    // Defensa: si la selección lo trajo pero no hay campos con fuente, saltea.
    if (campos.length === 0) {
      console.log(`SKIP (sin campos con fuente) ${tag}`);
      continue;
    }

    try {
      const result = await llamarClaude(t, campos);

      // Arma el update SOLO con los campos recién traducidos. Para listas valida
      // el largo: si no coincide, deja ESE campo en español (no escribe desalineo).
      const data: Record<string, string | string[]> = {};
      for (const c of campos) {
        if (c.kind === "list") {
          const src = c.src(t) as string[];
          const tr = result[c.qu] as string[];
          if (tr.length === src.length) {
            data[c.qu] = tr;
          } else {
            data[c.qu] = src; // fallback a español
            fallbacks.push(`${t.id}: ${c.qu} (${tr.length} vs ${src.length}) → ES`);
          }
        } else {
          data[c.qu] = result[c.qu] as string;
        }
      }

      if (DRY_RUN) {
        console.log(`\nOK (dry-run) ${tag}`);
        for (const c of campos) {
          const v = data[c.qu];
          const isFallback = c.kind === "list" && v === c.src(t) && (result[c.qu] as string[]).length !== (c.src(t) as string[]).length;
          if (Array.isArray(v)) {
            console.log(`  ${c.qu} (${v.length}${isFallback ? ", FALLBACK ES" : ""}): ${JSON.stringify(v)}`);
          } else {
            console.log(`  ${c.qu}: ${v.slice(0, 120)}${v.length > 120 ? "…" : ""}`);
          }
        }
      } else {
        await db.tour.update({ where: { id: t.id }, data });
        console.log(`OK ${tag}`);
      }
      traducidos++;
    } catch (error) {
      fallidos++;
      console.error(`FALLÓ (saltado) ${tag}: ${(error as Error).message}`);
    }

    if (idx < pendientes.length - 1) await sleep(500);
  }

  console.log(
    `\nResumen: ${traducidos} ${DRY_RUN ? "tours traducidos (dry-run, sin escribir)" : "tours actualizados"}, ` +
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
