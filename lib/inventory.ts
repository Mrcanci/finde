// lib/inventory.ts
// Mecánica del sistema de inventario (docs/migrations/2026-08-05-inventario-salidas.md):
// materialización perezosa de salidas, toma/liberación atómica de cupo,
// cálculo de expiresAt, vencimiento perezoso y transiciones de estado.
// Los contadores de Departure los mueven SOLO estas funciones: la creación de
// reservas (api/bookings.ts) y la cancelación interna de abajo. Los endpoints
// legacy (p. ej. PATCH /api/tours/[id]) no tocan contadores.

import { randomUUID } from "node:crypto";
import { Prisma, PrismaClient, BookingStatus } from "@prisma/client";

// Cliente Prisma o transacción en curso: los helpers atómicos funcionan igual.
type Db = PrismaClient | Prisma.TransactionClient;

export const DEFAULT_CLOSE_TIME = "20:00";
export const DEFAULT_CLOSE_DAYS_BEFORE = 1;
const H72_MS = 72 * 60 * 60 * 1000;

// yyyy-mm-dd de un instante en hora de Lima (America/Lima, UTC-5 sin DST). El
// server corre en UTC → se fuerza la zona vía Intl (en-CA da yyyy-mm-dd).
// api/bookings.ts tiene una copia local previa a este export; unificar en la
// fase de limpieza de Booking.status.
export function limaDateISO(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

// Mapeo al String legacy de Booking.status (decisión b): el contrato migra por
// adición, así que toda escritura nueva mantiene ambos campos coherentes.
// "pending_payment" es el valor histórico que el frontend ya conoce.
export const LEGACY_STATUS: Record<BookingStatus, string> = {
  SOLICITUD: "pending_payment",
  CONFIRMADA: "confirmed",
  VENCIDA: "cancelled",
  RECHAZADA: "cancelled",
  CANCELADA: "cancelled",
};

// Cierre de confirmación de una salida, en UTC: (date - closeDaysBefore días) a
// las closeTime hora Lima. Lima es UTC-5 sin DST → hora Lima + 5 = hora UTC
// (Date.UTC normaliza los desbordes de día/hora).
export function departureCloseAt(
  date: string,
  closeTime: string | null,
  closeDaysBefore: number | null
): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = (closeTime ?? DEFAULT_CLOSE_TIME).split(":").map(Number);
  const days = closeDaysBefore ?? DEFAULT_CLOSE_DAYS_BEFORE;
  return new Date(Date.UTC(y, m - 1, d - days, hh + 5, mm));
}

// expiresAt de una solicitud: min(creación + 72h, cierre de su salida).
// Decisión provisoria (reportada): si el cierre ya pasó al crear, aplica solo
// el tope de 72h para que la solicitud no nazca vencida.
export function solicitudExpiresAt(
  now: Date,
  date: string,
  closeTime: string | null,
  closeDaysBefore: number | null
): Date {
  const close = departureCloseAt(date, closeTime, closeDaysBefore);
  const cap = new Date(now.getTime() + H72_MS);
  if (close <= now) return cap;
  return close < cap ? close : cap;
}

// Materializa la salida si no existe. IMPORTANTE: INSERT ... ON CONFLICT DO
// NOTHING crudo, NO el upsert de Prisma: el upsert hace find→create y bajo
// concurrencia choca con el unique (P2002) abortando la transacción entera
// (lo cazó el test de concurrencia). El ON CONFLICT es atómico y silencioso:
// dos primeros compradores simultáneos no chocan jamás. El id se genera acá
// (randomUUID) porque el default cuid() vive en el cliente Prisma, no en la DB.
// startTime se COPIA del tour (pin): editarlo después no mueve salidas vendidas.
export async function materializeDeparture(
  db: Db,
  tour: { id: string; startTime: string | null },
  date: string
) {
  await db.$executeRaw`
    INSERT INTO "Departure" ("id", "tourId", "date", "startTime")
    VALUES (${randomUUID()}, ${tour.id}, ${date}, ${tour.startTime})
    ON CONFLICT ("tourId", "date") DO NOTHING`;
  return db.departure.findUniqueOrThrow({
    where: { tourId_date: { tourId: tour.id, date } },
  });
}

// Toma de cupo CUPO_FIJO: update condicional atómico contra el cupo EFECTIVO
// (allotmentOverride ?? tour.allotment). El rowCount es la verificación: 0 =
// sin cupo suficiente (o salida no ABIERTA). Prisma no compara columnas en
// updateMany.where, por eso es $executeRaw.
export async function takeSeats(
  db: Db,
  departureId: string,
  guests: number
): Promise<boolean> {
  const updated = await db.$executeRaw`
    UPDATE "Departure" d
    SET "seatsTaken" = d."seatsTaken" + ${guests}
    FROM "Tour" t
    WHERE d."id" = ${departureId}
      AND t."id" = d."tourId"
      AND d."status" = 'ABIERTA'
      AND d."seatsTaken" + ${guests} <= COALESCE(d."allotmentOverride", t."allotment")`;
  return updated === 1;
}

// Confirmación en lote de la agencia: suma directa a seatsTaken SIN tope. El
// tope del cupo (takeSeats) rige la VENTA en CUPO_FIJO; cuando la agencia
// confirma solicitudes decide ella cuántas toma (los tours SOLICITUD suelen no
// tener allotment y el COALESCE de takeSeats daría siempre falso).
export async function confirmSeats(
  db: Db,
  departureId: string,
  guests: number
): Promise<void> {
  await db.$executeRaw`
    UPDATE "Departure"
    SET "seatsTaken" = "seatsTaken" + ${guests}
    WHERE "id" = ${departureId}`;
}

// Liberación atómica de cupo confirmado; nunca por debajo de 0.
export async function releaseSeats(
  db: Db,
  departureId: string,
  guests: number
): Promise<void> {
  await db.$executeRaw`
    UPDATE "Departure"
    SET "seatsTaken" = GREATEST("seatsTaken" - ${guests}, 0)
    WHERE "id" = ${departureId}`;
}

// Contadores de solicitudes pendientes (progreso de quórum), mismo patrón.
export async function addRequestedSeats(
  db: Db,
  departureId: string,
  guests: number
): Promise<void> {
  await db.$executeRaw`
    UPDATE "Departure"
    SET "seatsRequested" = "seatsRequested" + ${guests}
    WHERE "id" = ${departureId}`;
}

export async function releaseRequestedSeats(
  db: Db,
  departureId: string,
  guests: number
): Promise<void> {
  await db.$executeRaw`
    UPDATE "Departure"
    SET "seatsRequested" = GREATEST("seatsRequested" - ${guests}, 0)
    WHERE "id" = ${departureId}`;
}

// Guarda de transición (decisión d): una solicitud VENCIDA no puede
// confirmarse. Hoy NO existe endpoint de cambio de estado de reservas; esta
// guarda queda centralizada para el endpoint que la fase de panel cree.
export const ERR_VENCIDA_NO_CONFIRMABLE =
  "Esta solicitud venció. El viajero ya fue notificado.";

export function assertBookingTransition(
  from: BookingStatus,
  to: BookingStatus
): void {
  if (from === "VENCIDA" && to === "CONFIRMADA") {
    throw new Error(ERR_VENCIDA_NO_CONFIRMABLE);
  }
}

// Cancelación interna (decisión c): SIN ruta expuesta — el endpoint es decisión
// de producto que va con Culqi. Transiciona a CANCELADA y libera el cupo que
// corresponda de forma atómica. La condición statusNew en el updateMany hace la
// operación idempotente bajo carreras (solo quien logra la transición libera).
export async function cancelBookingInternal(
  client: PrismaClient,
  bookingId: string
): Promise<{ ok: boolean; reason?: string }> {
  return client.$transaction(async (tx) => {
    const b = await tx.booking.findUnique({
      where: { id: bookingId },
      select: { id: true, statusNew: true, guests: true, departureId: true },
    });
    if (!b) return { ok: false, reason: "Reserva no encontrada" };
    if (b.statusNew === "CANCELADA") return { ok: true }; // ya cancelada: idempotente
    if (b.statusNew == null) {
      return { ok: false, reason: "Reserva legacy sin estado nuevo (correr backfill)" };
    }
    const prev = b.statusNew;
    const changed = await tx.booking.updateMany({
      where: { id: b.id, statusNew: prev },
      data: {
        statusNew: "CANCELADA",
        status: LEGACY_STATUS.CANCELADA,
        decidedAt: new Date(),
        expiresAt: null,
      },
    });
    if (changed.count !== 1) return { ok: false, reason: "La reserva cambió de estado, reintentar" };
    if (b.departureId) {
      if (prev === "CONFIRMADA") await releaseSeats(tx, b.departureId, b.guests);
      else if (prev === "SOLICITUD") await releaseRequestedSeats(tx, b.departureId, b.guests);
    }
    return { ok: true };
  });
}

// Vencimiento PEREZOSO: no hay cron en Vercel Hobby, así que los puntos de
// lectura de reservas llaman esto ANTES de leer. Toda SOLICITUD del scope con
// expiresAt < now transiciona a VENCIDA (y libera su seatsRequested). La
// transición por fila es condicional → idempotente bajo lecturas concurrentes.
// Upgrade futuro: pg_cron de Supabase para barrer y disparar avisos.
export async function expireStaleSolicitudes(
  client: PrismaClient,
  scope: Prisma.BookingWhereInput
): Promise<number> {
  const now = new Date();
  const stale = await client.booking.findMany({
    where: {
      AND: [scope, { statusNew: "SOLICITUD", expiresAt: { lt: now } }],
    },
    select: { id: true, guests: true, departureId: true },
  });
  if (stale.length === 0) return 0;

  let expired = 0;
  await client.$transaction(async (tx) => {
    for (const b of stale) {
      const changed = await tx.booking.updateMany({
        where: { id: b.id, statusNew: "SOLICITUD" },
        data: {
          statusNew: "VENCIDA",
          status: LEGACY_STATUS.VENCIDA,
          decidedAt: now,
        },
      });
      if (changed.count === 1) {
        expired++;
        if (b.departureId) await releaseRequestedSeats(tx, b.departureId, b.guests);
      }
    }
  });
  if (expired > 0) console.log(`[inventario] ${expired} solicitud(es) vencida(s) persistidas`);
  return expired;
}
