// api/operators/me/bookings.ts
// GET /api/operators/me/bookings
// Lista las reservas de los tours del operador autenticado (para el dashboard).
// Filtra por operatorId del token (requireOperator) VÍA la relación
// Booking → Tour → operatorId; nunca por un parámetro del cliente. Un operador
// solo ve las reservas de SUS tours, jamás las de otro.
//
// Etapa piloto: solo lectura. El operador coordina por WhatsApp; no cambia
// estados en Finde (sin endpoint de escritura ni enum de estados todavía).

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "../../../lib/db.js";
import { requireOperator } from "../../../lib/auth.js";

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
    const bookings = await db.booking.findMany({
      // Propiedad vía relación: solo reservas de tours cuyo operatorId es el
      // del token. El operator.id viene de requireOperator, nunca del cliente.
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
  } catch (error) {
    console.error("Error en GET /api/operators/me/bookings:", error);
    res.status(500).json({ error: "Error interno" });
  }
}
