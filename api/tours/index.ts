// api/tours/index.ts
// GET /api/tours?category=&city=&limit=
// Lista pública de tours con filtros opcionales.

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { db } from "../../lib/db.js";
import { LIST_SELECT, DETAIL_SELECT } from "../../lib/tour-select.js";
import { requireOperator } from "../../lib/auth.js";
import { parseTourInput, embedTourSafe } from "../../lib/tour-input.js";

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
        // Solo tours activos en el catálogo público (M-2). Los pausados
        // (active:false) solo los ve su dueño en /api/operators/me/tours.
        active: true,
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
// operatorId sale del token (requireOperator), nunca del body. El mapeo
// form→schema y el embedding on-write viven en lib/tour-input.js (compartidos
// con PUT /api/tours/:id). Si el embedding falla, el tour se crea igual y
// embedding queda NULL — marca natural de backfill (scripts/generate-embeddings.ts
// recupera los tours WHERE embedding IS NULL).

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

  const input = parseTourInput(req.body);
  if (!input.ok) {
    res.status(input.status).json({ error: input.error, details: input.details });
    return;
  }

  let tour: Prisma.TourGetPayload<{ select: typeof DETAIL_SELECT }>;
  try {
    tour = await db.tour.create({
      data: {
        ...input.data,
        operatorId: operator.id,
        language: ["es"],
      },
      select: DETAIL_SELECT,
    });
  } catch (error) {
    console.error("Error creando tour:", error);
    res.status(500).json({ error: "Error creando el tour" });
    return;
  }

  await embedTourSafe(tour.id, input.embeddingText);

  res.status(201).json({ tour });
}
