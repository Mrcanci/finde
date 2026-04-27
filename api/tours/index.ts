// api/tours/index.ts
// GET /api/tours?category=&city=&limit=
// Lista pública de tours con filtros opcionales.

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { db } from "../../lib/db";
import { LIST_SELECT } from "../../lib/tour-select";

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
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
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
