// api/bookings.ts
// POST /api/bookings — crea una reserva con pago mockeado (Yape).
// El gateway real (PayU sandbox) se conectará en Pista B; aquí solo
// registramos la intención de reserva con status="pending_payment" y
// devolvemos instrucciones visuales para el demo.

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { randomBytes } from "node:crypto";
import { Prisma, BookingStatus } from "@prisma/client";
import { db } from "../lib/db.js";
import { rateLimit, ipFromRequest } from "../lib/rate-limit.js";
import { requireAuth } from "../lib/auth.js";
import {
  LEGACY_STATUS,
  departureCloseAt,
  materializeDeparture,
  takeSeats,
  addRequestedSeats,
  solicitudExpiresAt,
} from "../lib/inventory.js";

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
  statusNew: BookingStatus | null;
  expiresAt: Date | null;
  tour: { title: string };
}

// Error de disponibilidad dentro de la transacción: al lanzarse, Prisma revierte
// TODO (departure/contadores/booking quedan intactos) y el handler responde con
// el código y mensaje que lleva.
class AvailabilityError extends Error {
  httpStatus: number;
  seatsLeft?: number;
  constructor(message: string, httpStatus: number, seatsLeft?: number) {
    super(message);
    this.httpStatus = httpStatus;
    this.seatsLeft = seatsLeft;
  }
}

function isBookingCodeCollision(error: unknown): boolean {
  const target = (error as Prisma.PrismaClientKnownRequestError)?.meta
    ?.target as string[] | string | undefined;
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002" &&
    (Array.isArray(target)
      ? target.includes("bookingCode")
      : target === "bookingCode" || target === "Booking_bookingCode_key")
  );
}

// Crea la reserva usando el inventario: materializa la Departure (upsert
// anti-carrera), toma cupo atómico en CUPO_FIJO o suma seatsRequested en
// SOLICITUD, y crea el Booking vinculado. TODO en una transacción: si algo
// falla a mitad, nada queda escrito. Reintenta la transacción completa ante
// colisión de bookingCode (16^6 combinaciones: rarísimo).
async function createBookingWithInventory(params: {
  tour: {
    id: string;
    startTime: string | null;
    salesMode: "CUPO_FIJO" | "SOLICITUD";
    allotment: number | null;
    closeTime: string | null;
    closeDaysBefore: number | null;
  };
  date: string; // "YYYY-MM-DD" Lima
  userName: string;
  userEmail: string;
  userPhone: string;
  guests: number;
  totalSoles: number;
  scheduledAt: Date;
}): Promise<{ booking: BookingCreated; seatsLeft: number | null }> {
  const { tour, date, guests } = params;
  const isCupoFijo = tour.salesMode === "CUPO_FIJO";
  const bookingState: BookingStatus = isCupoFijo ? "CONFIRMADA" : "SOLICITUD";
  const expiresAt = isCupoFijo
    ? null
    : solicitudExpiresAt(new Date(), date, tour.closeTime, tour.closeDaysBefore);

  for (let intento = 1; intento <= 3; intento++) {
    const bookingCode = generateBookingCode();
    try {
      return await db.$transaction(async (tx) => {
        const dep = await materializeDeparture(tx, tour, date);
        if (dep.status === "CANCELADA") {
          throw new AvailabilityError(
            "Esta salida fue cancelada por la agencia. Elige otra fecha.",
            409
          );
        }

        let seatsLeft: number | null = null;
        if (isCupoFijo) {
          const cupoEfectivo = dep.allotmentOverride ?? tour.allotment;
          if (cupoEfectivo == null) {
            throw new AvailabilityError(
              "Este tour no tiene cupo configurado. Contacta a la agencia.",
              409
            );
          }
          const ok = await takeSeats(tx, dep.id, guests);
          if (!ok) {
            const fresh = await tx.departure.findUnique({
              where: { id: dep.id },
              select: { seatsTaken: true, allotmentOverride: true },
            });
            const left = Math.max(
              (fresh?.allotmentOverride ?? tour.allotment ?? 0) -
                (fresh?.seatsTaken ?? 0),
              0
            );
            throw new AvailabilityError(
              left > 0
                ? `Solo quedan ${left} cupo${left > 1 ? "s" : ""} para esa fecha`
                : "No quedan cupos para esa fecha. Elige otra fecha.",
              409,
              left
            );
          }
          const after = await tx.departure.findUnique({
            where: { id: dep.id },
            select: { seatsTaken: true, allotmentOverride: true },
          });
          seatsLeft = Math.max(
            (after?.allotmentOverride ?? tour.allotment ?? 0) -
              (after?.seatsTaken ?? 0),
            0
          );
        } else {
          await addRequestedSeats(tx, dep.id, guests);
        }

        const booking = await tx.booking.create({
          data: {
            tourId: tour.id,
            userName: params.userName,
            userEmail: params.userEmail,
            userPhone: params.userPhone,
            guests,
            totalSoles: params.totalSoles,
            scheduledAt: params.scheduledAt,
            bookingCode,
            // Contrato por adición: el String legacy y el estado nuevo viajan
            // SIEMPRE coherentes (LEGACY_STATUS).
            status: LEGACY_STATUS[bookingState],
            statusNew: bookingState,
            departureId: dep.id,
            expiresAt,
          },
          select: {
            id: true,
            bookingCode: true,
            totalSoles: true,
            scheduledAt: true,
            guests: true,
            statusNew: true,
            expiresAt: true,
            tour: { select: { title: true } },
          },
        });
        return { booking, seatsLeft };
      });
    } catch (error) {
      if (isBookingCodeCollision(error)) {
        console.warn(`Colisión de bookingCode en intento ${intento}, regenerando…`);
        continue;
      }
      throw error;
    }
  }
  throw new Error("No se pudo generar bookingCode único tras 3 intentos");
}

// Fecha larga en hora de Lima, ej. "13 de agosto de 2026".
function fechaLargaLima(d: Date): string {
  return new Intl.DateTimeFormat("es-PE", {
    timeZone: "America/Lima",
    dateStyle: "long",
  }).format(d);
}

// Fecha límite para confirmar, en hora de Lima y con día de la semana:
// "jueves 13 de agosto, 8:00 pm". Es el dato que dispara la acción de la
// agencia, así que lleva el día de la semana (no solo el número).
function fechaLimiteLima(d: Date): string {
  // Partes por separado: es-PE inserta una coma tras el día de la semana
  // ("miércoles, 12 de agosto") que sobra cuando la línea ya lleva la hora.
  const semana = new Intl.DateTimeFormat("es-PE", {
    timeZone: "America/Lima",
    weekday: "long",
  }).format(d);
  const dia = new Intl.DateTimeFormat("es-PE", {
    timeZone: "America/Lima",
    day: "numeric",
    month: "long",
  }).format(d);
  const hora = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Lima",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
    .format(d)
    .toLowerCase();
  return `${semana} ${dia}, ${hora}`;
}

// Aviso a la agencia según el modo de venta del tour.
// SOLICITUD: la agencia TIENE que decidir → asunto que pide acción y la fecha
// límite destacada arriba, antes de los datos. CUPO_FIJO: la reserva ya quedó
// confirmada sola → asunto y tono informativos, sin llamado a confirmar.
export function buildOperatorEmail(params: {
  operatorName: string;
  isSolicitud: boolean;
  expiresAt: Date | null;
  tourTitle: string;
  fechaLarga: string;
  guests: number;
  totalSoles: number;
  bookingCode: string;
  userName: string;
  userPhone: string;
  userEmail: string;
}): { subject: string; text: string } {
  const datos = `Tour: ${params.tourTitle}
Fecha de salida: ${params.fechaLarga}
Personas: ${params.guests}
Total: ${formatSoles(params.totalSoles)}
Código de reserva: ${params.bookingCode}

Datos del viajero:
Nombre: ${params.userName}
Teléfono: ${params.userPhone}
Email: ${params.userEmail}`;

  if (!params.isSolicitud) {
    return {
      subject: `Nueva reserva confirmada: ${params.tourTitle}`,
      text: `Hola ${params.operatorName},

Tienes una nueva reserva en Finde y ya quedó confirmada.

${datos}

No necesitas confirmar nada. Coordina los detalles con el viajero cuando quieras.
Puedes verla en tu panel: https://finde.pe/demo

El equipo de Finde`,
    };
  }

  // El límite siempre existe en modo solicitud (solicitudExpiresAt); el
  // fallback es defensivo para no mandar un correo roto si llegara null.
  const limite = params.expiresAt
    ? `TIENES HASTA EL ${fechaLimiteLima(params.expiresAt).toUpperCase()}`
    : "TIENES QUE CONFIRMAR ANTES DE LA MEDIANOCHE PREVIA A LA SALIDA";

  return {
    subject: `Tienes una solicitud por confirmar: ${params.tourTitle}`,
    text: `Hola ${params.operatorName},

Recibiste una solicitud de reserva y tienes que decidir si confirmas la salida.

============================================
${limite}
============================================

Si no confirmas antes de esa hora, la solicitud vence sola y el viajero recibe un aviso.

${datos}

Entra a tu panel a confirmar o rechazar la salida:
https://finde.pe/demo

El equipo de Finde`,
  };
}

// Envía a la agencia el aviso de nueva reserva vía Resend (fetch nativo, sin
// SDK). NUNCA lanza: todos los caminos de error se loguean y retornan, para que
// el envío no pueda romper la reserva ya creada.
async function sendOperatorBookingEmail(params: {
  operator: { email: string; name: string; userId: string | null };
  isSolicitud: boolean;
  expiresAt: Date | null;
  tourTitle: string;
  scheduledAt: Date;
  guests: number;
  totalSoles: number;
  bookingCode: string;
  userName: string;
  userPhone: string;
  userEmail: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY ausente, skip");
    return;
  }

  // Solo agencias reales onboarded (userId de Supabase). Los operadores del seed
  // tienen emails ficticios; enviarles genera rebotes que dañan la reputación
  // del dominio en Resend.
  const { operator } = params;
  if (!operator?.userId || !operator?.email) {
    console.log("[email] agencia seed o sin email, skip");
    return;
  }

  // Solo la fecha (sin hora): scheduledAt lleva una hora técnica que no refleja
  // la salida real del tour. Formato largo en español, hora de Lima.
  const { subject, text } = buildOperatorEmail({
    operatorName: operator.name,
    isSolicitud: params.isSolicitud,
    expiresAt: params.expiresAt,
    tourTitle: params.tourTitle,
    fechaLarga: fechaLargaLima(params.scheduledAt),
    guests: params.guests,
    totalSoles: params.totalSoles,
    bookingCode: params.bookingCode,
    userName: params.userName,
    userPhone: params.userPhone,
    userEmail: params.userEmail,
  });

  // Timeout duro de 5s: un Resend lento no debe colgar la respuesta al viajero.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Finde <reservas@finde.pe>",
        to: [operator.email],
        reply_to: params.userEmail,
        subject,
        text,
      }),
      signal: controller.signal,
    });
    if (!resp.ok) {
      const body = await resp.text().catch(() => "");
      console.error(
        `[email] Resend respondió ${resp.status} (no bloqueante):`,
        body
      );
    }
  } catch (error) {
    console.error(
      "[email] Error enviando aviso a la agencia (no bloqueante):",
      error
    );
  } finally {
    clearTimeout(timeout);
  }
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
    select: {
      id: true,
      priceSoles: true,
      capacity: true,
      active: true,
      // Inventario: modo de venta, cupo y parámetros de cierre de solicitudes.
      salesMode: true,
      allotment: true,
      startTime: true,
      closeTime: true,
      closeDaysBefore: true,
      // Datos de la agencia para el aviso por email (sin query extra; userId
      // distingue agencia real onboarded vs operador del seed).
      operator: { select: { email: true, name: true, userId: true } },
    },
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

  // Cierre de venta (solo confirmación manual): la MISMA hora de cierre que
  // vence el plazo de la agencia cierra también la entrada de solicitudes. Sin
  // esto, una reserva creada pasada esa hora nace con el plazo ya cumplido y la
  // agencia recibe un aviso que no puede atender. En CUPO_FIJO no aplica: no
  // hay nada que confirmar, así que rige solo la anticipación mínima de arriba.
  // El calendario del front aplica esta regla primero (minBookingISO); acá es
  // la fuente de verdad, en hora de Lima.
  if (tour.salesMode === "SOLICITUD") {
    const closeAt = departureCloseAt(
      limaDateISO(scheduledDate),
      tour.closeTime,
      tour.closeDaysBefore
    );
    if (new Date() >= closeAt) {
      res.status(409).json({
        error:
          "Ya pasó la hora límite para reservar esta fecha. Elige otra fecha disponible.",
      });
      return;
    }
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
  let seatsLeft: number | null;
  try {
    ({ booking, seatsLeft } = await createBookingWithInventory({
      tour: {
        id: tour.id,
        startTime: tour.startTime,
        salesMode: tour.salesMode,
        allotment: tour.allotment,
        closeTime: tour.closeTime,
        closeDaysBefore: tour.closeDaysBefore,
      },
      // Fecha Lima de la salida: robusta ante cualquier hora que mande el
      // cliente (la convención del frontend es 13:00Z).
      date: limaDateISO(scheduledDate),
      userName,
      userEmail,
      userPhone,
      guests,
      totalSoles,
      scheduledAt: scheduledDate,
    }));
  } catch (error) {
    if (error instanceof AvailabilityError) {
      res.status(error.httpStatus).json({
        error: error.message,
        ...(error.seatsLeft != null ? { seatsLeft: error.seatsLeft } : {}),
      });
      return;
    }
    console.error("Error creando booking:", error);
    res.status(500).json({ error: "Error creando la reserva" });
    return;
  }

  // Aviso por email a la agencia (no bloqueante, patrón SearchLog): la función
  // se traga cualquier error y solo loguea, así que la reserva JAMÁS falla por
  // el email. Se hace await ANTES del res porque Vercel puede congelar la
  // función tras responder.
  await sendOperatorBookingEmail({
    operator: tour.operator,
    // El modo del tour decide el correo entero (asunto y cuerpo): en SOLICITUD
    // la agencia tiene que decidir y el expiresAt es el dato que dispara la
    // acción; en CUPO_FIJO ya está confirmada y el aviso es informativo.
    isSolicitud: booking.statusNew === "SOLICITUD",
    expiresAt: booking.expiresAt,
    tourTitle: booking.tour.title,
    scheduledAt: booking.scheduledAt,
    guests: booking.guests,
    totalSoles: booking.totalSoles,
    bookingCode: booking.bookingCode,
    userName,
    userPhone,
    userEmail,
  });

  res.status(200).json({
    booking: {
      id: booking.id,
      bookingCode: booking.bookingCode,
      totalSoles: booking.totalSoles,
      scheduledAt: booking.scheduledAt.toISOString(),
      guests: booking.guests,
      tourTitle: booking.tour.title,
      // Contrato por adición (el frontend actual usa bookingCode/totalSoles/
      // guests y sigue igual): estado legacy + estado nuevo + vencimiento +
      // cupo restante (solo CUPO_FIJO).
      status: booking.statusNew ? LEGACY_STATUS[booking.statusNew] : "pending_payment",
      bookingState: booking.statusNew,
      expiresAt: booking.expiresAt ? booking.expiresAt.toISOString() : null,
      seatsLeft,
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
