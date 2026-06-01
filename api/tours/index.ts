// api/tours/index.ts
// GET /api/tours?category=&city=&limit=
// Lista pública de tours con filtros opcionales.

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { db } from "../../lib/db.js";
import { LIST_SELECT, DETAIL_SELECT } from "../../lib/tour-select.js";
import { requireOperator } from "../../lib/auth.js";
import { voyage, MODEL_EMBED, DIM } from "../../lib/voyage.js";

const querySchema = z.object({
  category: z
    .enum(["adventure", "cultural", "gastronomy", "nature", "mystic"])
    .optional(),
  city: z.string().min(1).max(100).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method === "POST") {
    await handlePost(req, res);
    return;
  }
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET, POST");
    res.status(405).json({ error: "Método no permitido" });
    return;
  }

  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({
      error: "Parámetros inválidos",
      details: parsed.error.issues,
    });
    return;
  }

  const { category, city, limit } = parsed.data;

  try {
    const tours = await db.tour.findMany({
      where: {
        ...(category && { category }),
        ...(city && { city: { equals: city, mode: "insensitive" } }),
      },
      select: LIST_SELECT,
      orderBy: [{ rating: "desc" }, { reviewsCount: "desc" }],
      take: limit,
    });

    res.status(200).json({ tours });
  } catch (error) {
    console.error("Error en GET /api/tours:", error);
    res.status(500).json({ error: "Error interno" });
  }
}

// ── POST /api/tours — crear un tour del operador autenticado ──
// operatorId sale del token (requireOperator), nunca del body. El embedding
// se genera on-write (Voyage); si falla, el tour se crea igual y embedding
// queda NULL — marca natural de backfill (scripts/generate-embeddings.ts
// recupera los tours WHERE embedding IS NULL).

const CANCEL_MAP = {
  flexible: "Flexible",
  moderada: "Moderada",
  estricta: "Estricta",
  no_reembolsable: "NoReembolsable",
} as const;

const createSchema = z.object({
  title: z.string().trim().min(3).max(120),
  // "Ciudad, Región" → se separa por coma en el handler.
  location: z.string().trim().min(2).max(120),
  // soles (string o number) → priceSoles en céntimos.
  price: z.coerce.number().positive().max(100000),
  // "5 horas" / "2 días" → durationHours (Int) en el handler.
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

async function handlePost(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  let operator: { id: string; name: string; verified: boolean };
  try {
    ({ operator } = await requireOperator(req, res));
  } catch {
    return; // requireOperator ya respondió 401 (sin sesión) o 403 (no operador)
  }

  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Cuerpo inválido", details: parsed.error.issues });
    return;
  }
  const b = parsed.data;

  // location "Ciudad, Región" → city / region (region cae a city si falta).
  const locParts = b.location.split(",").map((s) => s.trim()).filter(Boolean);
  const city = locParts[0];
  const region = locParts[1] ?? city;
  if (!city) {
    res.status(400).json({ error: "location debe incluir al menos la ciudad" });
    return;
  }

  const durationHours = parseDurationHours(b.duration);
  if (durationHours < 1 || durationHours > 168) {
    res.status(400).json({
      error: "duration inválida (esperado p.ej. '5 horas' o '2 días')",
    });
    return;
  }

  const priceSoles = Math.round(b.price * 100);
  const imageUrl =
    typeof b.photo === "string" && /^https?:\/\//i.test(b.photo) ? b.photo : null;
  const days = b.days ?? [true, true, true, true, true, true, true];

  let tour: Prisma.TourGetPayload<{ select: typeof DETAIL_SELECT }>;
  try {
    tour = await db.tour.create({
      data: {
        operatorId: operator.id,
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
        days,
        excludedDates: b.excludedDates,
        addedDates: b.addedDates,
        meetingPoint: b.meetingPoint ?? null,
        cancellation: CANCEL_MAP[b.cancellation],
        imageUrl,
        language: ["es"],
      },
      select: DETAIL_SELECT,
    });
  } catch (error) {
    console.error("Error creando tour:", error);
    res.status(500).json({ error: "Error creando el tour" });
    return;
  }

  // Embedding on-write (Opción A): mismo modelo/inputType y escritura ::vector
  // que scripts/generate-embeddings.ts. Si falla, el tour queda sin embedding.
  try {
    const texto = `${b.title}. ${b.description}. ${b.category}. ${city}, ${region}`;
    const resp = await voyage.embed({
      input: texto,
      model: MODEL_EMBED,
      inputType: "document",
    });
    const embedding = resp.data?.[0]?.embedding;
    if (!embedding || !Array.isArray(embedding) || embedding.length !== DIM) {
      throw new Error("Voyage no devolvió un embedding válido");
    }
    const literal = JSON.stringify(embedding);
    await db.$executeRaw`
      UPDATE "Tour" SET embedding = ${literal}::vector WHERE id = ${tour.id}
    `;
  } catch (error) {
    console.error(
      "Embedding falló; tour creado sin embedding (backfill pendiente):",
      tour.id,
      error
    );
  }

  res.status(201).json({ tour });
}
