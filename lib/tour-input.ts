// lib/tour-input.ts
// Mapeo compartido form (UI del operador) → schema Tour, usado por
// POST /api/tours (crear) y PUT /api/tours/:id (editar). Vive aquí para no
// duplicar el schema/validaciones/embedding entre ambos handlers y evitar drift.

import { z } from "zod";
import { db } from "./db.js";
import { voyage, MODEL_EMBED, DIM } from "./voyage.js";
import { PITCH_MIN, PITCH_MAX, DESC_MIN } from "./tour-publish.js";
import { toDepartment } from "./geo.js";

// Los mínimos para publicar viven en lib/tour-publish.js, que NO tiene
// dependencias y por eso lo puede importar también el frontend. El schema de
// abajo usa esos números y `api/tours/[id].ts` usa la condición: los dos
// caminos citan la misma fuente. Ver ese archivo para el porqué de la forma.
export {
  PITCH_MIN,
  PITCH_MAX,
  DESC_MIN,
  faltaParaPublicar,
  mensajeFaltaParaPublicar,
} from "./tour-publish.js";

// UI (flexible/...) → enum CancellationPolicy del schema.
const CANCEL_MAP = {
  flexible: "Flexible",
  moderada: "Moderada",
  estricta: "Estricta",
  no_reembolsable: "NoReembolsable",
} as const;

const DEFAULT_DAYS = [true, true, true, true, true, true, true];

// Schema del cuerpo que envía el form del operador (crear/editar comparten forma).
export const tourInputSchema = z.object({
  title: z.string().trim().min(3).max(120),
  // ── UBICACIÓN: DOS CAMPOS, Y ANTES ERA UNO DE TEXTO LIBRE ─────────────────
  // Hasta el 2026-08-19 esto era un solo campo `location` con la forma
  // "Ciudad, Región", que acá se partía por la coma. Ese parseo tenía DOS
  // fallos que no daban error nunca, y por eso el campo se separó:
  //
  //   "Huacachina, Ica, Perú"  ->  city "Huacachina", region "Ica"
  //                                y "Perú" SE DESCARTABA EN SILENCIO, porque
  //                                nadie leía la tercera parte.
  //   ", Áncash"               ->  city "Áncash", region "Áncash"
  //                                la coma al principio corría todo un lugar y
  //                                el DEPARTAMENTO quedaba guardado como CIUDAD.
  //   "Huaraz"                 ->  city "Huaraz", region "Huaraz"
  //                                sin coma, la región quedaba mal. Zafaba solo
  //                                cuando la ciudad se llama igual que el
  //                                departamento (Cusco, Arequipa, Ica...), que
  //                                es el caso de 31 de los 49 tours.
  //
  // Los tres desaparecen con dos campos: no hay coma que interpretar. Quedan
  // escritos acá porque son la evidencia de por qué el texto libre no servía, y
  // sin ellos "volvamos a un solo campo, es más simple" suena razonable.
  city: z.string().trim().min(2).max(80),
  // La región es un DEPARTAMENTO de la lista cerrada, no texto libre. La
  // validación de que sea uno de los 24 está abajo, en parseTourInput, porque
  // normaliza antes de comparar y eso un z.enum no lo hace.
  region: z.string().trim().min(2).max(80),
  // soles (string o number) → priceSoles en céntimos.
  price: z.coerce.number().positive().max(100000),
  // "5 horas" / "2 días" → durationHours (Int) en parseTourInput.
  duration: z.string().trim().min(1).max(40),
  // UI (culture/gastro) → enum (cultural/gastronomy); resto idéntico.
  category: z
    .string()
    .transform((c) => (c === "culture" ? "cultural" : c === "gastro" ? "gastronomy" : c))
    .pipe(z.enum(["adventure", "cultural", "gastronomy", "nature", "mystic"])),
  capacity: z.coerce.number().int().min(1).max(3000),
  difficulty: z.string().trim().max(40).optional(),
  // Mínimo 300, no 10. El piso viejo dejaba pasar una descripción de una línea,
  // y desde el prerender esa descripción ES el snippet de Google. 300 no bloquea
  // a nadie hoy: la más corta de las 42 fichas públicas mide 351.
  description: z.string().trim().min(DESC_MIN).max(5000),
  // El gancho de una línea. Es lo que abre la meta description de la ficha y lo
  // que se lee en la tarjeta de WhatsApp antes que nada.
  //
  // OBLIGATORIO desde el 2026-08-16, y el motivo es medible: los 5 tours que
  // cargó una agencia real por el formulario NO lo tienen, y los 37 sembrados
  // por script SÍ. No era descuido de la agencia, que además escribió
  // descripciones más largas que el seed: es que este campo no existía acá, así
  // que el formulario no podía mandarlo y el backend no podía guardarlo.
  //
  // El tope de 80 es el mismo que ya valida api/ai/generate-description, así que
  // el botón "Usar esta" del generador lo llena sin conflicto.
  shortPitch: z.string().trim().min(PITCH_MIN).max(PITCH_MAX),
  included: z.union([z.string(), z.array(z.string())]).optional(),
  excluded: z.union([z.string(), z.array(z.string())]).optional(),
  days: z.array(z.boolean()).length(7).optional(),
  excludedDates: z.array(z.string()).default([]),
  addedDates: z.array(z.string()).default([]),
  meetingPoint: z.string().trim().max(200).optional(),
  cancellation: z
    .enum(["flexible", "moderada", "estricta", "no_reembolsable"])
    .default("flexible"),
  // Solo aceptamos URL http(s); base64/data URL se ignora (upload real: futuro).
  photo: z.string().optional(),
  // Galería multi-foto (Opción A). Array de URLs; se filtra a http(s) abajo.
  // imageUrl (portada) sigue saliendo de `photo`, sin cambios.
  images: z.array(z.string()).optional(),
  // Hora de salida "HH:MM" (24h), opcional. La columna existe desde M3.1; se
  // persiste (ver más abajo). El <input type="time"> ya garantiza el formato.
  startTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "startTime debe tener formato HH:MM (24h)")
    .optional(),
});

export type TourInput = z.infer<typeof tourInputSchema>;

// Campos comunes mapeados al modelo Tour. POST añade operatorId + language;
// PUT los omite a propósito (no se re-asigna dueño ni se resetea idioma).
export type TourData = {
  title: string;
  description: string;
  shortPitch: string;
  category: TourInput["category"];
  city: string;
  region: string;
  durationHours: number;
  priceSoles: number;
  capacity: number;
  difficulty: string | null;
  included: string[];
  excluded: string[];
  days: boolean[];
  excludedDates: string[];
  addedDates: string[];
  meetingPoint: string | null;
  cancellation: (typeof CANCEL_MAP)[keyof typeof CANCEL_MAP];
  // undefined (no string) cuando no se manda foto http válida: Prisma ignora
  // undefined en update → el PUT PRESERVA la imagen existente; en create cae a
  // null (columna nullable). null borraría la imagen, por eso se evita.
  imageUrl?: string;
  // Galería (Opción A). Misma semántica undefined que imageUrl: si no llega el
  // campo `images` → undefined, el PUT PRESERVA la galería existente y el POST
  // cae al @default([]) de la columna. Si llega un array → REEMPLAZA (filtrado
  // a URLs http(s); puede quedar []).
  images?: string[];
  // Misma semántica undefined que imageUrl: si no llega startTime → undefined,
  // el PUT preserva la hora existente (editar sin tocarla no la borra); en
  // create cae a null (columna nullable).
  startTime?: string;
};

export type ParseTourInputResult =
  | { ok: true; data: TourData; embeddingText: string }
  | { ok: false; status: number; error: string; details?: unknown };

function toStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((s) => String(s).trim()).filter(Boolean);
  if (typeof v === "string") return v.split(",").map((s) => s.trim()).filter(Boolean);
  return [];
}

function parseDurationHours(raw: string): number {
  // Frases sin dígitos que el form ofrece como ejemplo ("Full day"): se
  // resuelven a horas antes del parseo numérico.
  if (/full\s*day|d[ií]a completo|todo el d[ií]a/i.test(raw)) return 8;
  if (/medio d[ií]a|half\s*day/i.test(raw)) return 4;
  const n = parseInt(raw.match(/\d+/)?.[0] ?? "", 10);
  if (Number.isNaN(n) || n <= 0) return 0;
  return /d[ií]a/i.test(raw) ? n * 24 : n;
}

// Etiquetas amigables (es) por campo del schema, para que el mensaje de error
// nombre el campo que falló en vez de un genérico "Cuerpo inválido".
const FIELD_LABELS: Record<string, string> = {
  title: "Nombre",
  city: "Ciudad",
  region: "Región",
  price: "Precio",
  duration: "Duración",
  category: "Categoría",
  capacity: "Capacidad",
  difficulty: "Dificultad",
  description: "Descripción",
  shortPitch: "Frase de gancho",
  included: "Qué incluye",
  excluded: "Qué no incluye",
  days: "Días",
  excludedDates: "Fechas excluidas",
  addedDates: "Fechas agregadas",
  meetingPoint: "Punto de encuentro",
  cancellation: "Política de cancelación",
  photo: "Foto",
  images: "Galería",
  startTime: "Hora de salida",
};

// Valida el cuerpo del form y lo mapea a campos del modelo Tour. Devuelve un
// resultado discriminado: en error trae { status, error } listo para responder.
export function parseTourInput(rawBody: unknown): ParseTourInputResult {
  const parsed = tourInputSchema.safeParse(rawBody);
  if (!parsed.success) {
    // Nombrar los campos que fallaron (de issues[].path) con etiquetas en es,
    // sin duplicados y preservando el orden. La lógica de validación zod NO
    // cambia: solo se mejora el mensaje. El array `details` sigue intacto.
    const fields = [
      ...new Set(
        parsed.error.issues.map((i) => {
          const key = typeof i.path[0] === "string" ? i.path[0] : "";
          return FIELD_LABELS[key] ?? key;
        })
      ),
    ].filter(Boolean);
    const error =
      fields.length > 0
        ? `Revisa estos campos: ${fields.join(", ")}`
        : "Cuerpo inválido";
    return {
      ok: false,
      status: 400,
      error,
      details: parsed.error.issues,
    };
  }
  const b = parsed.data;

  const city = b.city;

  // ── LA REGIÓN SE NORMALIZA ANTES DE VALIDARSE, Y ES UNA DECISIÓN ───────────
  // `toDepartment` acepta "lima", "LIMA" y "Lima", y devuelve siempre la forma
  // canónica ("Lima", con su tilde donde va). Rechazar una grafía que sabemos
  // traducir sería fricción sin beneficio: el objetivo es que el dato quede
  // canónico, y normalizando queda igual de canónico sin frenar a nadie.
  //
  // Medido sobre los 49 tours de la base el 2026-08-19: con match exacto fallan
  // DOS ("lima" y "lima lima"), normalizando falla UNO ("lima lima"). Los dos
  // son tours de prueba pausados. Ninguno de los 42 activos falla, así que esta
  // validación no arregla nada existente: EVITA lo que viene.
  //
  // No hay migración de datos y no hace falta: un tour con región inválida falla
  // recién cuando alguien lo edita, y ahí se corrige. Se limpia solo.
  const region = toDepartment(b.region);
  if (!region) {
    return {
      ok: false,
      status: 400,
      // El mensaje nombra el campo como lo llama la interfaz y dice qué hacer.
      // "Región inválida" a secas obliga a adivinar cuál era la lista.
      error: `La región "${b.region}" no es un departamento del Perú. Elegí uno de la lista en el paso 1.`,
    };
  }

  const durationHours = parseDurationHours(b.duration);
  if (durationHours < 1 || durationHours > 168) {
    return {
      ok: false,
      status: 400,
      error: "duration inválida (esperado p.ej. '5 horas' o '2 días')",
    };
  }

  const priceSoles = Math.round(b.price * 100);
  // Solo una URL http(s) cuenta como "foto nueva". Si no hay → undefined (NO
  // null): en el PUT, Prisma ignora undefined y preserva la imagen actual; en
  // el POST cae a null (columna nullable). Semántica: photo ausente/no-URL =
  // "no tocar la imagen"; photo con URL = "reemplazar".
  const imageUrl =
    typeof b.photo === "string" && /^https?:\/\//i.test(b.photo) ? b.photo : undefined;
  // Galería: si el campo `images` llega, se REEMPLAZA por las URLs http(s)
  // válidas (puede quedar []). Si no llega → undefined: el PUT preserva la
  // galería actual y el POST cae al @default([]). Mismo filtro que la portada.
  const images = Array.isArray(b.images)
    ? b.images.filter((u) => typeof u === "string" && /^https?:\/\//i.test(u))
    : undefined;
  // undefined si no llega → el PUT preserva la hora existente; el POST cae a
  // null (columna nullable). El form siempre manda una hora al crear.
  const startTime = b.startTime ?? undefined;

  return {
    ok: true,
    data: {
      title: b.title,
      description: b.description,
      shortPitch: b.shortPitch,
      category: b.category,
      city,
      region,
      durationHours,
      priceSoles,
      capacity: b.capacity,
      difficulty: b.difficulty ?? null,
      included: toStringArray(b.included),
      excluded: toStringArray(b.excluded),
      days: b.days ?? DEFAULT_DAYS,
      excludedDates: b.excludedDates,
      addedDates: b.addedDates,
      meetingPoint: b.meetingPoint ?? null,
      cancellation: CANCEL_MAP[b.cancellation],
      imageUrl,
      images,
      startTime,
    },
    embeddingText: `${b.title}. ${b.description}. ${b.category}. ${city}, ${region}`,
  };
}

// Embedding on-write (Opción A): mismo modelo/inputType y escritura ::vector que
// scripts/generate-embeddings.ts. Si Voyage falla, NO lanza: el tour ya está
// persistido y embedding queda NULL — marca natural de backfill.
export async function embedTourSafe(tourId: string, text: string): Promise<void> {
  try {
    const resp = await voyage.embed({
      input: text,
      model: MODEL_EMBED,
      inputType: "document",
    });
    const embedding = resp.data?.[0]?.embedding;
    if (!embedding || !Array.isArray(embedding) || embedding.length !== DIM) {
      throw new Error("Voyage no devolvió un embedding válido");
    }
    const literal = JSON.stringify(embedding);
    await db.$executeRaw`
      UPDATE "Tour" SET embedding = ${literal}::vector WHERE id = ${tourId}
    `;
  } catch (error) {
    console.error(
      "Embedding falló; tour sin embedding (backfill pendiente):",
      tourId,
      error
    );
  }
}
