// lib/tour-input.ts
// Mapeo compartido form (UI del operador) → schema Tour, usado por
// POST /api/tours (crear) y PUT /api/tours/:id (editar). Vive aquí para no
// duplicar el schema/validaciones/embedding entre ambos handlers y evitar drift.

import { z } from "zod";
import { db } from "./db.js";
import { voyage, MODEL_EMBED, DIM } from "./voyage.js";

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
  // "Ciudad, Región" → se separa por coma en parseTourInput.
  location: z.string().trim().min(2).max(120),
  // soles (string o number) → priceSoles en céntimos.
  price: z.coerce.number().positive().max(100000),
  // "5 horas" / "2 días" → durationHours (Int) en parseTourInput.
  duration: z.string().trim().min(1).max(40),
  // UI (culture/gastro) → enum (cultural/gastronomy); resto idéntico.
  category: z
    .string()
    .transform((c) => (c === "culture" ? "cultural" : c === "gastro" ? "gastronomy" : c))
    .pipe(z.enum(["adventure", "cultural", "gastronomy", "nature", "mystic"])),
  capacity: z.coerce.number().int().min(1).max(100).default(10),
  difficulty: z.string().trim().max(40).optional(),
  description: z.string().trim().min(10).max(5000),
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
  // startTime se acepta pero se ignora: no existe columna en Tour.
  startTime: z.string().optional(),
});

export type TourInput = z.infer<typeof tourInputSchema>;

// Campos comunes mapeados al modelo Tour. POST añade operatorId + language;
// PUT los omite a propósito (no se re-asigna dueño ni se resetea idioma).
export type TourData = {
  title: string;
  description: string;
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
  imageUrl: string | null;
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
  const n = parseInt(raw.match(/\d+/)?.[0] ?? "", 10);
  if (Number.isNaN(n) || n <= 0) return 0;
  return /d[ií]a/i.test(raw) ? n * 24 : n;
}

// Valida el cuerpo del form y lo mapea a campos del modelo Tour. Devuelve un
// resultado discriminado: en error trae { status, error } listo para responder.
export function parseTourInput(rawBody: unknown): ParseTourInputResult {
  const parsed = tourInputSchema.safeParse(rawBody);
  if (!parsed.success) {
    return {
      ok: false,
      status: 400,
      error: "Cuerpo inválido",
      details: parsed.error.issues,
    };
  }
  const b = parsed.data;

  // location "Ciudad, Región" → city / region (region cae a city si falta).
  const locParts = b.location.split(",").map((s) => s.trim()).filter(Boolean);
  const city = locParts[0];
  const region = locParts[1] ?? city;
  if (!city) {
    return { ok: false, status: 400, error: "location debe incluir al menos la ciudad" };
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
  const imageUrl =
    typeof b.photo === "string" && /^https?:\/\//i.test(b.photo) ? b.photo : null;

  return {
    ok: true,
    data: {
      title: b.title,
      description: b.description,
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
