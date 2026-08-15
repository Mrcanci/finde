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

// Medianoche Lima previa a la salida = 00:00 del propio día de salida, en UTC.
// Lima es UTC-5 sin DST → 00:00 Lima del día D son las 05:00 UTC de D.
export function departureEveMidnight(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 5, 0));
}

// expiresAt de una solicitud: min(cierre de su salida, creación + 72h,
// medianoche previa a la salida). El tercer tope es la red de seguridad dura:
// sin él, una solicitud creada después del cierre caía solo en las 72h y seguía
// viva después de que el tour ya había salido. Ese caso además ya no entra:
// createBookingWithInventory rechaza las solicitudes posteriores al cierre
// (misma hora de cierre, las dos puntas), así que el cierre nunca está en el
// pasado al crear y ninguna solicitud nace vencida.
export function solicitudExpiresAt(
  now: Date,
  date: string,
  closeTime: string | null,
  closeDaysBefore: number | null
): Date {
  const close = departureCloseAt(date, closeTime, closeDaysBefore);
  const cap72 = new Date(now.getTime() + H72_MS);
  const eve = departureEveMidnight(date);
  return new Date(Math.min(close.getTime(), cap72.getTime(), eve.getTime()));
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
// sin cupo suficiente o salida cancelada. Prisma no compara columnas en
// updateMany.where, por eso es $executeRaw.
//
// El estado de la salida NO es el instrumento de corte de ventas, y por eso la
// condición excluye CANCELADA en vez de exigir ABIERTA. Los instrumentos de
// corte son otros dos, y cada uno tapa lo suyo: el CUPO (esta misma condición,
// integridad: nunca se vende más de lo que entra) y la ANTICIPACIÓN, que en
// SOLICITUD es closeTime/closeDaysBefore y en CUPO_FIJO es hoy MIN_BOOKING_LEAD_DAYS.
//
// CONFIRMADA significa "el tour sale", no "cerramos la lista" (ver el refine de
// api/operators/me/[resource].ts: la agencia confirma que el tour sale, y si
// sale van todos). Una salida confirmada con cupo libre TIENE que poder vender:
// exigir ABIERTA destruía inventario vendible de forma permanente, porque nada
// devuelve una salida a ABIERTA. Y era además una inconsistencia entre los dos
// caminos de venta que nadie decidió: el de SOLICITUD (addRequestedSeats) nunca
// miró el estado, así que ya aceptaba reservas en salidas confirmadas.
//
// CANCELADA sí corta: la agencia dijo que ese día no sale nadie.
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
      AND d."status" <> 'CANCELADA'
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

// Filas por transacción del barrido. NO es un número elegido a ojo.
//
// Medido contra el pooler el 2026-08-15: en UNA transacción interactiva entran
// **23 viajes** de ida y vuelta antes de que Prisma la corte por timeout (el
// default son 5 segundos, y cada viaje cuesta ~220ms). Idéntico para SELECT y
// para UPDATE, o sea que el costo es la latencia, no el trabajo.
//
// El barrido hace **2 viajes por fila** (la transición y la liberación de
// cupo), así que el máximo REAL son **11 filas**; con 12 se pasa. Con 19 eran
// 38 viajes y por eso murió con P2028 al correr el backfill.
//
// 5 deja un margen de más del doble sobre ese máximo: la latencia tendría que
// pasar de 220ms a más de 450ms para que una tanda falle. Bajarlo más no sale
// gratis: cada tanda agrega su propio BEGIN y COMMIT, así que tandas muy chicas
// alargan el barrido completo sin comprar seguridad.
export const EXPIRE_BATCH_SIZE = 5;

// Vencimiento PEREZOSO: no hay cron en Vercel Hobby, así que los puntos de
// lectura de reservas llaman esto ANTES de leer. Toda SOLICITUD del scope con
// expiresAt < now transiciona a VENCIDA (y libera su seatsRequested). La
// transición por fila es condicional → idempotente bajo lecturas concurrentes.
// Upgrade futuro: pg_cron de Supabase para barrer y disparar avisos.
//
// ── POR TANDAS, y esto protege a TODOS los llamadores ──
//
// Una sola transacción para todo se pasaba del timeout con ~12 solicitudes
// vencidas, y el barrido corre ANTES de leer reservas: en el panel es
// bloqueante, así que una agencia con esa acumulación se quedaba sin poder
// abrirlo, con 500. No era un riesgo teórico, era un 500 alcanzable por una
// agencia real en una semana normal.
//
// Cada tanda va en su PROPIA transacción. Si una falla, las anteriores quedan
// aplicadas, y eso es correcto porque el barrido es idempotente y retomable:
// la transición de cada fila es condicional a que siga en SOLICITUD, así que
// una fila ya vencida no se vuelve a tocar ni se le libera el cupo dos veces,
// y la próxima corrida vuelve a consultar y toma solo lo que quedó pendiente.
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
  for (let i = 0; i < stale.length; i += EXPIRE_BATCH_SIZE) {
    const tanda = stale.slice(i, i + EXPIRE_BATCH_SIZE);
    // El contador se acumula DESPUÉS de que la transacción commitea: si la
    // tanda se cae, sus transiciones se revierten y no tienen que contarse.
    let deLaTanda = 0;
    await client.$transaction(async (tx) => {
      deLaTanda = 0;
      for (const b of tanda) {
        const changed = await tx.booking.updateMany({
          where: { id: b.id, statusNew: "SOLICITUD" },
          data: {
            statusNew: "VENCIDA",
            status: LEGACY_STATUS.VENCIDA,
            decidedAt: now,
          },
        });
        if (changed.count === 1) {
          deLaTanda++;
          if (b.departureId) await releaseRequestedSeats(tx, b.departureId, b.guests);
        }
      }
    });
    expired += deLaTanda;
  }
  if (expired > 0) console.log(`[inventario] ${expired} solicitud(es) vencida(s) persistidas`);
  return expired;
}
