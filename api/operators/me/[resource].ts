// api/operators/me/[resource].ts
// Ruta dinámica que consolida las lecturas del operador logueado en UNA sola
// función Vercel (en vez de tours.ts + bookings.ts → ahorra 1 función):
//   GET /api/operators/me/tours    → { tours }
//   GET /api/operators/me/bookings → { bookings }
// Mismo comportamiento que los archivos que reemplaza: GET-only, requireOperator
// (operatorId del token, nunca del cliente), y queries/selects/shapes idénticos.

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

  // Segmento dinámico de la URL: "tours" o "bookings". Vercel puede entregarlo
  // como string[] (rutas repetidas); normalizamos al primer valor.
  const r = req.query.resource;
  const resource = Array.isArray(r) ? r[0] : r;

  try {
    if (resource === "tours") {
      // Idéntico a api/operators/me/tours.ts: tours del operador (activos e
      // inactivos), LIST_SELECT, más recientes primero.
      const tours = await db.tour.findMany({
        where: { operatorId: operator.id },
        select: LIST_SELECT,
        orderBy: { createdAt: "desc" },
      });
      res.status(200).json({ tours });
      return;
    }

    if (resource === "bookings") {
      // Idéntico a api/operators/me/bookings.ts: reservas de los tours del
      // operador (propiedad vía relación tour.operatorId).
      const bookings = await db.booking.findMany({
        where: { tour: { operatorId: operator.id } },
        select: {
          id: true,
          bookingCode: true,
          userName: true,
          userPhone: true,
          userEmail: true,
          guests: true,
          totalSoles: true,
          status: true,
          scheduledAt: true,
          createdAt: true,
          tour: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      res.status(200).json({ bookings });
      return;
    }

    res.status(404).json({ error: "No encontrado" });
  } catch (error) {
    console.error(`Error en GET /api/operators/me/${resource}:`, error);
    res.status(500).json({ error: "Error interno" });
  }
}
