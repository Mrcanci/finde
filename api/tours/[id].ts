// api/tours/[id].ts
// GET /api/tours/:id
// Detalle público de un tour, con operador extendido.

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { db } from "../../lib/db.js";
import { DETAIL_SELECT } from "../../lib/tour-select.js";
import { requireOperator } from "../../lib/auth.js";
import { voyage, MODEL_EMBED, DIM } from "../../lib/voyage.js";

const paramsSchema = z.object({
  id: z.string().min(1),
});

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method === "PUT") {
    await handlePut(req, res);
    return;
  }
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET, PUT");
    res.status(405).json({ error: "Método no permitido" });
    return;
  }

  const parsed = paramsSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({
      error: "Parámetros inválidos",
      details: parsed.error.issues,
    });
    return;
  }

  const { id } = parsed.data;

  try {
    const tour = await db.tour.findUnique({
      where: { id },
      select: DETAIL_SELECT,
    });

    if (!tour) {
      res.status(404).json({ error: "Tour no encontrado" });
      return;
    }

    res.status(200).json({ tour });
  } catch (error) {
    console.error(`Error en GET /api/tours/${id}:`, error);
    res.status(500).json({ error: "Error interno" });
  }
}

// ── PUT /api/tours/:id — editar un tour propio del operador autenticado ──
// Verifica propiedad (tour.operatorId === operator.id) antes de tocar nada.
// NOTA: el mapeo form→schema y el patrón de embedding son IDÉNTICOS a
// POST /api/tours (api/tours/index.ts, sub-paso 2.2). Hoy se replica porque
// los helpers viven privados en ese archivo; una limpieza futura los podría
// extraer a lib/tour-input.ts y compartir entre POST y PUT.

const CANCEL_MAP = {
  flexible: "Flexible",
  moderada: "Moderada",
  estricta: "Estricta",
  no_reembolsable: "NoReembolsable",
} as const;

const bodySchema = z.object({
  title: z.string().trim().min(3).max(120),
  location: z.string().trim().min(2).max(120),
  price: z.coerce.number().positive().max(100000),
  duration: z.string().trim().min(1).max(40),
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
  photo: z.string().optional(),
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

async function handlePut(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  let operator: { id: string; name: string; verified: boolean };
  try {
    ({ operator } = await requireOperator(req, res));
  } catch {
    return; // requireOperator ya respondió 401 (sin sesión) o 403 (no operador)
  }

  const id = typeof req.query.id === "string" ? req.query.id : "";
  if (!id) {
    res.status(400).json({ error: "id inválido" });
    return;
  }

  // Verificación de PROPIEDAD: solo el dueño puede editar su tour.
  const existing = await db.tour.findUnique({
    where: { id },
    select: { id: true, operatorId: true },
  });
  if (!existing) {
    res.status(404).json({ error: "Tour no encontrado" });
    return;
  }
  if (existing.operatorId !== operator.id) {
    res.status(403).json({ error: "No puedes editar este tour" });
    return;
  }

  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Cuerpo inválido", details: parsed.error.issues });
    return;
  }
  const b = parsed.data;

  // Mapeo form→schema idéntico a POST 2.2.
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
    tour = await db.tour.update({
      where: { id },
      // operatorId NO se toca (el tour sigue siendo del mismo operador).
      // language se OMITE a propósito: el form no lo captura y resetearlo a
      // ["es"] clobbearía tours multi-idioma; se preserva el valor existente.
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
        days,
        excludedDates: b.excludedDates,
        addedDates: b.addedDates,
        meetingPoint: b.meetingPoint ?? null,
        cancellation: CANCEL_MAP[b.cancellation],
        imageUrl,
      },
      select: DETAIL_SELECT,
    });
  } catch (error) {
    console.error("Error actualizando tour:", error);
    res.status(500).json({ error: "Error actualizando el tour" });
    return;
  }

  // Re-embed SIEMPRE (Opción A): mismo patrón que POST. Si Voyage falla, el
  // update igual persiste y embedding queda NULL (backfill pendiente).
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
      "Embedding falló; tour actualizado sin re-embedding (backfill pendiente):",
      tour.id,
      error
    );
  }

  res.status(200).json({ tour });
}
