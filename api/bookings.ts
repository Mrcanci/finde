// api/bookings.ts
// POST /api/bookings — crea una reserva con pago mockeado (Yape).
// El gateway real (PayU sandbox) se conectará en Pista B; aquí solo
// registramos la intención de reserva con status="pending_payment" y
// devolvemos instrucciones visuales para el demo.

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";
import { db } from "../lib/db.js";
import { rateLimit, ipFromRequest } from "../lib/rate-limit.js";

// Tolerancia para zona horaria del cliente: aceptamos hasta 1 hora en el pasado.
const PAST_TOLERANCE_MS = 60 * 60 * 1000;

const YAPE_DEMO_PHONE = "999-111-222";
const PAYMENT_NOTE =
  "Mock visual para demo. En producción se conecta a PayU sandbox.";

const bodySchema = z.object({
  tourId: z.string().cuid(),
  userName: z.string().trim().min(3).max(100),
  userEmail: z.string().trim().toLowerCase().email().max(150),
  userPhone: z
    .string()
    .trim()
    .regex(/^\d{8,15}$/, "userPhone debe tener entre 8 y 15 dígitos numéricos"),
  guests: z.number().int().min(1).max(20),
  scheduledAt: z
    .string()
    .datetime({ message: "scheduledAt debe ser ISO 8601" }),
});

function generateBookingCode(): string {
  // 4 bytes → 8 hex chars; recortamos a 6 ⇒ 16^6 ≈ 16M combinaciones.
  return "FND-" + randomBytes(4).toString("hex").toUpperCase().slice(0, 6);
}

function formatSoles(centimos: number): string {
  return `S/ ${(centimos / 100).toFixed(2)}`;
}

interface BookingCreated {
  id: string;
  bookingCode: string;
  totalSoles: number;
  scheduledAt: Date;
  guests: number;
  tour: { title: string };
}

async function createBookingWithRetry(data: {
  tourId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  guests: number;
  totalSoles: number;
  scheduledAt: Date;
}): Promise<BookingCreated> {
  for (let intento = 1; intento <= 3; intento++) {
    const bookingCode = generateBookingCode();
    try {
      return await db.booking.create({
        data: { ...data, bookingCode, status: "pending_payment" },
        select: {
          id: true,
          bookingCode: true,
          totalSoles: true,
          scheduledAt: true,
          guests: true,
          tour: { select: { title: true } },
        },
      });
    } catch (error) {
      const target = (error as Prisma.PrismaClientKnownRequestError)?.meta
        ?.target as string[] | string | undefined;
      const isCodeCollision =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002" &&
        (Array.isArray(target)
          ? target.includes("bookingCode")
          : target === "bookingCode" || target === "Booking_bookingCode_key");
      if (isCodeCollision) {
        console.warn(
          `Colisión de bookingCode en intento ${intento}, regenerando…`
        );
        continue;
      }
      throw error;
    }
  }
  throw new Error("No se pudo generar bookingCode único tras 3 intentos");
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Método no permitido" });
    return;
  }

  const ip = ipFromRequest(req.headers["x-forwarded-for"]);
  const rl = rateLimit(ip, "bookings", 5);
  if (!rl.allowed) {
    const seconds = rl.retryAfterSeconds ?? 60;
    res.setHeader("Retry-After", String(seconds));
    res.status(429).json({
      error: `Demasiadas peticiones, intenta en ${seconds} segundos`,
    });
    return;
  }

  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "Cuerpo inválido",
      details: parsed.error.issues,
    });
    return;
  }

  const { tourId, userName, userEmail, userPhone, guests, scheduledAt } =
    parsed.data;

  const scheduledDate = new Date(scheduledAt);
  if (scheduledDate.getTime() < Date.now() - PAST_TOLERANCE_MS) {
    res.status(400).json({ error: "scheduledAt debe ser una fecha futura" });
    return;
  }

  const tour = await db.tour.findUnique({
    where: { id: tourId },
    select: { id: true, priceSoles: true, capacity: true },
  });

  if (!tour) {
    res.status(404).json({ error: "Tour no encontrado" });
    return;
  }

  if (guests > tour.capacity) {
    res.status(400).json({
      error: "Excede capacidad disponible",
      capacity: tour.capacity,
      requested: guests,
    });
    return;
  }

  const totalSoles = tour.priceSoles * guests;

  let booking: BookingCreated;
  try {
    booking = await createBookingWithRetry({
      tourId,
      userName,
      userEmail,
      userPhone,
      guests,
      totalSoles,
      scheduledAt: scheduledDate,
    });
  } catch (error) {
    console.error("Error creando booking:", error);
    res.status(500).json({ error: "Error creando la reserva" });
    return;
  }

  res.status(200).json({
    booking: {
      id: booking.id,
      bookingCode: booking.bookingCode,
      totalSoles: booking.totalSoles,
      scheduledAt: booking.scheduledAt.toISOString(),
      guests: booking.guests,
      tourTitle: booking.tour.title,
    },
    paymentInstructions: {
      method: "yape",
      phone: YAPE_DEMO_PHONE,
      amount: booking.totalSoles,
      amountFormatted: formatSoles(booking.totalSoles),
      reference: booking.bookingCode,
      note: PAYMENT_NOTE,
    },
  });
}
