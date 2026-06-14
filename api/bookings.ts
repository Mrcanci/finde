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
import { requireAuth } from "../lib/auth.js";

// Anticipación mínima para reservar (en días). MANTENER EN SYNC con
// src/AppDemo.jsx (MIN_BOOKING_LEAD_DAYS): el frontend bloquea el calendario y
// aquí lo validamos en hora de Lima (fuente de verdad).
const MIN_BOOKING_LEAD_DAYS = 1;

const YAPE_DEMO_PHONE = "999-111-222";
const PAYMENT_NOTE =
  "Mock visual para demo. En producción se conecta a PayU sandbox.";

// userEmail NO va en el schema: la identidad del comprador sale del token
// validado (requireAuth → user.email), no del body. El cliente no puede
// declararse como otro usuario.
const bodySchema = z.object({
  tourId: z.string().cuid(),
  userName: z.string().trim().min(3).max(100),
  userPhone: z
    .string()
    .trim()
    .regex(/^\d{8,15}$/, "userPhone debe tener entre 8 y 15 dígitos numéricos"),
  // Techo alineado con el máximo de capacidad de un tour (lib/tour-input.ts:
  // capacity max 3000). El límite real por reserva lo impone guests <=
  // tour.capacity (validado abajo, 400 si excede), no este tope del schema.
  guests: z.number().int().min(1).max(3000),
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

// yyyy-mm-dd de un instante expresado en hora de Lima (America/Lima, UTC-5 sin
// DST). El server corre en UTC, así que NO se puede usar el Date local: se
// fuerza la zona vía Intl (en-CA produce el formato yyyy-mm-dd).
function limaDateISO(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

// Suma días a una fecha yyyy-mm-dd (aritmética en UTC para evitar saltos de DST).
function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
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

  // La reserva requiere sesión: el userEmail se deriva del token validado,
  // no del body. requireAuth ya respondió 401 si no hay/inválido el token.
  let user;
  try {
    user = await requireAuth(req, res);
  } catch {
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

  const { tourId, userName, userPhone, guests, scheduledAt } = parsed.data;

  // Identidad del comprador desde el token, no del body.
  const userEmail = user.email;
  if (!userEmail) {
    res.status(400).json({ error: "La cuenta no tiene email asociado" });
    return;
  }

  const scheduledDate = new Date(scheduledAt);
  // Anticipación mínima en hora de Lima: la fecha del tour debe ser >= hoy(Lima)
  // + MIN_BOOKING_LEAD_DAYS. Subsume el viejo chequeo de "fecha futura": hoy y
  // pasado quedan rechazados, mañana en adelante permitido.
  const minBookingLima = addDaysISO(limaDateISO(new Date()), MIN_BOOKING_LEAD_DAYS);
  if (limaDateISO(scheduledDate) < minBookingLima) {
    res.status(400).json({
      error: `Las reservas requieren al menos ${MIN_BOOKING_LEAD_DAYS} día${MIN_BOOKING_LEAD_DAYS > 1 ? "s" : ""} de anticipación.`,
    });
    return;
  }

  const tour = await db.tour.findUnique({
    where: { id: tourId },
    select: { id: true, priceSoles: true, capacity: true, active: true },
  });

  if (!tour) {
    res.status(404).json({ error: "Tour no encontrado" });
    return;
  }

  // Tour pausado (active:false) → no reservable (M-2). 409: existe pero no
  // está disponible para reservar ahora.
  if (!tour.active) {
    res.status(409).json({ error: "Este tour no está disponible para reservar" });
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
