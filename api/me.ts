import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAuth } from "../lib/auth.js";
import { db } from "../lib/db.js";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  let user;
  try {
    user = await requireAuth(req, res);
  } catch {
    return; // requireAuth ya respondió 401
  }

  // Resolver perfil de operador + reservas del usuario en paralelo (sin sumar
  // latencia). Las reservas se vinculan por userEmail (el create de bookings hoy
  // no persiste userId, ver api/bookings.ts); el campo está indexado.
  const [operator, bookings] = await Promise.all([
    db.operator.findUnique({
      where: { userId: user.id },
      select: { id: true, name: true, verified: true, city: true, ruc: true, phone: true, email: true, mincetur: true },
    }),
    user.email
      ? db.booking.findMany({
          where: { userEmail: user.email },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            bookingCode: true,
            scheduledAt: true,
            createdAt: true,
            guests: true,
            totalSoles: true,
            status: true,
            // userName/userPhone: identidad real del viajero para el voucher y el
            // link de coordinación por WhatsApp (sin esto el nombre saldría mock).
            userName: true,
            userPhone: true,
            tour: {
              select: {
                id: true,
                title: true,
                startTime: true,
                city: true,
                region: true,
                imageUrl: true,
                // Campos que el detalle/voucher de "Mis Viajes" necesita para no
                // degradarse (duración, qué incluye, punto de encuentro, agencia y
                // teléfono para WhatsApp). Se mapean con mapTourFromApi en el front.
                durationHours: true,
                included: true,
                meetingPoint: true,
                operator: {
                  select: { name: true, verified: true, phone: true, mincetur: true },
                },
              },
            },
          },
        })
      : Promise.resolve([]),
  ]);

  res.status(200).json({
    user: {
      id: user.id,
      email: user.email,
    },
    operator: operator ?? null,
    bookings,
  });
}
