// api/operators/me/tours.ts
// GET /api/operators/me/tours
// Lista los tours del operador autenticado (para el dashboard). Filtra por
// operatorId del token (requireOperator), nunca por un parámetro del cliente.
// Usa LIST_SELECT (igual que /api/tours) para que el frontend los mapee con
// mapTourFromApi sin cambios.

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "../../../lib/db.js";
import { requireOperator } from "../../../lib/auth.js";
import { LIST_SELECT } from "../../../lib/tour-select.js";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "Método no permitido" });
    return;
  }

  let operator: { id: string; name: string; verified: boolean };
  try {
    ({ operator } = await requireOperator(req, res));
  } catch {
    return; // requireOperator ya respondió 401 (sin sesión) o 403 (no operador)
  }

  try {
    const tours = await db.tour.findMany({
      where: { operatorId: operator.id },
      select: LIST_SELECT,
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json({ tours });
  } catch (error) {
    console.error("Error en GET /api/operators/me/tours:", error);
    res.status(500).json({ error: "Error interno" });
  }
}
