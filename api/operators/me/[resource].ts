// api/operators/me/[resource].ts
// Ruta dinámica que consolida las operaciones del operador logueado en UNA sola
// función Vercel (límite de 12 funciones del plan Hobby):
//   GET  /api/operators/me/tours      → { tours }        (con config de venta)
//   GET  /api/operators/me/bookings   → { bookings }     (lista plana, legacy)
//   GET  /api/operators/me/departures → { departures }   (agrupadas por salida)
//   POST /api/operators/me/departures → confirmar/rechazar una salida en lote,
//                                        o rechazar UNA solicitud (bookingId)
// requireOperator siempre (operatorId del token, nunca del cliente). El POST
// lleva la acción en el body ({ departureId, action }) porque [resource] captura
// un solo segmento de URL: /departures/:id/confirm exigiría un catch-all.

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { BookingStatus } from "@prisma/client";
import { waitUntil } from "@vercel/functions";
import { db } from "../../../lib/db.js";
import { requireOperator } from "../../../lib/auth.js";
import { OPERATOR_LIST_SELECT } from "../../../lib/tour-select.js";
import {
  LEGACY_STATUS,
  assertBookingTransition,
  confirmSeats,
  departureCloseAt,
  expireStaleSolicitudes,
  limaDateISO,
  releaseRequestedSeats,
} from "../../../lib/inventory.js";
import { sendDepartureDecisionEmails } from "../../../lib/traveler-emails.js";

// Error de negocio dentro de la transacción del POST: al lanzarse, Prisma
// revierte todo y el handler responde con el código y mensaje que lleva.
class DepartureActionError extends Error {
  httpStatus: number;
  constructor(message: string, httpStatus: number) {
    super(message);
    this.httpStatus = httpStatus;
  }
}

// bookingId opcional = rechazo de UNA solicitud puntual (caso real: llegan 3
// solicitudes por 20 personas y la van tiene 15). Sin bookingId, la acción es
// sobre la salida entera, como siempre.
// El refine deja la regla de producto en el contrato y no solo en la UI: la
// CONFIRMACIÓN es siempre a nivel de salida (la agencia confirma que el tour
// sale, y si sale van todos), así que confirmar una sola es 400.
const postBodySchema = z
  .object({
    departureId: z.string().min(1),
    action: z.enum(["confirm", "reject"]),
    bookingId: z.string().min(1).optional(),
  })
  .refine((b) => !(b.bookingId && b.action === "confirm"), {
    message: "La confirmación es siempre a nivel de salida",
    path: ["bookingId"],
  });

// Shape de los contadores/estado de una salida que devuelve el POST (y que el
// GET extiende con tour, counts y bookings).
const DEPARTURE_CORE_SELECT = {
  id: true,
  date: true,
  startTime: true,
  status: true,
  seatsTaken: true,
  seatsRequested: true,
  allotmentOverride: true,
} as const;

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    res.status(405).json({ error: "Método no permitido" });
    return;
  }

  let operator: { id: string; name: string; verified: boolean };
  try {
    ({ operator } = await requireOperator(req, res));
  } catch {
    return; // requireOperator ya respondió 401 (sin sesión) o 403 (no operador)
  }

  // Segmento dinámico de la URL: "tours", "bookings" o "departures". Vercel
  // puede entregarlo como string[] (rutas repetidas); normalizamos al primero.
  const r = req.query.resource;
  const resource = Array.isArray(r) ? r[0] : r;

  if (req.method === "POST") {
    if (resource !== "departures") {
      res.setHeader("Allow", "GET");
      res.status(405).json({ error: "Método no permitido" });
      return;
    }
    await handleDepartureAction(req, res, operator.id);
    return;
  }

  try {
    if (resource === "tours") {
      // Tours del operador (activos e inactivos), más recientes primero. Con
      // la config de venta (salesMode/allotment/minQuorum/closeTime/
      // closeDaysBefore): contrato por adición, solo en esta vista de dueño.
      const tours = await db.tour.findMany({
        where: { operatorId: operator.id },
        select: OPERATOR_LIST_SELECT,
        orderBy: { createdAt: "desc" },
      });
      res.status(200).json({ tours });
      return;
    }

    if (resource === "bookings") {
      // Vencimiento PEREZOSO antes de leer: las solicitudes vencidas del
      // operador se persisten como VENCIDA (y liberan seatsRequested). Un
      // fallo no rompe la lectura.
      try {
        await expireStaleSolicitudes(db, { tour: { operatorId: operator.id } });
      } catch (error) {
        console.error("Error venciendo solicitudes (no bloqueante):", error);
      }

      // Reservas de los tours del operador (propiedad vía tour.operatorId).
      // Contrato por adición: status legacy intacto + bookingState/expiresAt.
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
          statusNew: true,
          expiresAt: true,
          scheduledAt: true,
          createdAt: true,
          tour: { select: { id: true, title: true, startTime: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      res.status(200).json({
        bookings: bookings.map(({ statusNew, ...b }) => ({
          ...b,
          bookingState: statusNew,
        })),
      });
      return;
    }

    if (resource === "departures") {
      await handleDeparturesList(req, res, operator.id);
      return;
    }

    res.status(404).json({ error: "No encontrado" });
  } catch (error) {
    console.error(`Error en GET /api/operators/me/${resource}:`, error);
    res.status(500).json({ error: "Error interno" });
  }
}

// ── GET /api/operators/me/departures — salidas agrupadas con sus reservas ──
// ?scope=upcoming (default, fecha >= hoy Lima) | all. Orden: fecha ascendente.

async function handleDeparturesList(
  req: VercelRequest,
  res: VercelResponse,
  operatorId: string
): Promise<void> {
  // Vencimiento perezoso OBLIGATORIO y bloqueante acá: normalizar primero,
  // contar después. Sin esto la agencia vería solicitudes ya vencidas,
  // confirmaría, y pasarían menos reservas de las esperadas. Si falla, falla
  // la lectura (500 del catch del handler) antes que mostrar conteos falsos.
  await expireStaleSolicitudes(db, { tour: { operatorId } });

  const s = req.query.scope;
  const scope = Array.isArray(s) ? s[0] : s;
  const dateFilter =
    scope === "all" ? {} : { date: { gte: limaDateISO(new Date()) } };

  const departures = await db.departure.findMany({
    where: { tour: { operatorId }, ...dateFilter },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
    select: {
      ...DEPARTURE_CORE_SELECT,
      tour: {
        select: {
          id: true,
          title: true,
          imageUrl: true,
          salesMode: true,
          allotment: true,
          minQuorum: true,
          closeTime: true,
          closeDaysBefore: true,
        },
      },
      bookings: {
        select: {
          id: true,
          bookingCode: true,
          userName: true,
          userPhone: true,
          userEmail: true,
          guests: true,
          totalSoles: true,
          status: true,
          statusNew: true,
          expiresAt: true,
          scheduledAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const payload = departures.map((d) => {
    const counts = {
      solicitudes: 0,
      confirmadas: 0,
      vencidas: 0,
      rechazadas: 0,
      canceladas: 0,
    };
    for (const b of d.bookings) {
      if (b.statusNew === "SOLICITUD") counts.solicitudes++;
      else if (b.statusNew === "CONFIRMADA") counts.confirmadas++;
      else if (b.statusNew === "VENCIDA") counts.vencidas++;
      else if (b.statusNew === "RECHAZADA") counts.rechazadas++;
      else if (b.statusNew === "CANCELADA") counts.canceladas++;
    }
    const cupoEfectivo = d.allotmentOverride ?? d.tour.allotment;
    return {
      id: d.id,
      date: d.date,
      startTime: d.startTime,
      status: d.status,
      seatsTaken: d.seatsTaken,
      seatsRequested: d.seatsRequested,
      allotmentOverride: d.allotmentOverride,
      closeAt: departureCloseAt(
        d.date,
        d.tour.closeTime,
        d.tour.closeDaysBefore
      ).toISOString(),
      // Lleno derivado (sin estado extra): solo aplica a CUPO_FIJO con cupo.
      isFull:
        d.tour.salesMode === "CUPO_FIJO" &&
        cupoEfectivo != null &&
        d.seatsTaken >= cupoEfectivo,
      tour: d.tour,
      counts,
      bookings: d.bookings.map(({ statusNew, ...b }) => ({
        ...b,
        bookingState: statusNew,
      })),
    };
  });

  res.status(200).json({ departures: payload });
}

// ── POST /api/operators/me/departures — decisión de la agencia ──
// Confirmar = todas las solicitudes VIGENTES pasan a CONFIRMADA (las VENCIDAS
// no se tocan) y la salida queda CONFIRMADA. Rechazar = vigentes a RECHAZADA
// con mensaje neutro; la salida QUEDA ABIERTA (puede recibir solicitudes
// nuevas). Todo transaccional; emails a los viajeros vía waitUntil después.
//
// Con `bookingId` el rechazo se acota a UNA solicitud. No es un camino
// paralelo: es el MISMO flujo con la consulta de vigentes filtrada por ese id,
// así que transiciones, contadores y correos no pueden desincronizarse del
// lote. La salida queda ABIERTA igual, y si era la última vigente el panel
// deja de ofrecer las acciones de salida (derivado en el front, sin estado
// nuevo acá).

async function handleDepartureAction(
  req: VercelRequest,
  res: VercelResponse,
  operatorId: string
): Promise<void> {
  const parsed = postBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ error: "Cuerpo inválido", details: parsed.error.issues });
    return;
  }
  const { departureId, action, bookingId } = parsed.data;

  try {
    // Propiedad ESTRICTA: la salida debe existir y ser de un tour del operador
    // autenticado. 404 si no existe, 403 si es de otra agencia (patrón de
    // api/tours/[id]).
    const dep = await db.departure.findUnique({
      where: { id: departureId },
      select: {
        id: true,
        date: true,
        startTime: true,
        status: true,
        confirmedAt: true,
        tour: { select: { id: true, title: true, operatorId: true } },
      },
    });
    if (!dep) {
      res.status(404).json({ error: "Salida no encontrada" });
      return;
    }
    if (dep.tour.operatorId !== operatorId) {
      res.status(403).json({ error: "No puedes gestionar esta salida" });
      return;
    }
    if (dep.status === "CANCELADA") {
      res.status(409).json({ error: "Esta salida fue cancelada." });
      return;
    }

    // Normalizar ANTES de decidir: las solicitudes ya vencidas de esta salida
    // se persisten como VENCIDA (y liberan seatsRequested) para que el lote
    // solo tome vigentes reales. Bloqueante a propósito.
    await expireStaleSolicitudes(db, { departureId: dep.id });

    const now = new Date();
    const target: BookingStatus =
      action === "confirm" ? "CONFIRMADA" : "RECHAZADA";

    const result = await db.$transaction(async (tx) => {
      // Vigentes: SOLICITUD sin vencer. expiresAt null cuenta como vigente
      // (las del backfill no tienen vencimiento retroactivo, por diseño).
      // El bookingId va DENTRO de este where, no en una consulta aparte: la
      // salida ya pasó la verificación de propiedad, así que una reserva de
      // otra agencia (o de otra salida, o ya decidida) simplemente no matchea
      // y cae en el mismo 409 de abajo. Sin ruta de autorización nueva.
      const vigentes = await tx.booking.findMany({
        where: {
          departureId: dep.id,
          statusNew: "SOLICITUD",
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
          ...(bookingId ? { id: bookingId } : {}),
        },
        select: {
          id: true,
          bookingCode: true,
          userName: true,
          userEmail: true,
          guests: true,
        },
      });
      if (vigentes.length === 0) {
        throw new DepartureActionError(
          bookingId
            ? "Esta solicitud ya no está vigente. Puede haber vencido o haber sido decidida."
            : "No hay solicitudes vigentes en esta salida.",
          409
        );
      }

      // Transición por fila condicional (patrón expireStaleSolicitudes):
      // idempotente bajo carreras, y sabemos EXACTAMENTE cuáles pasaron (para
      // contadores y emails). La guarda VENCIDA queda como cinturón explícito.
      const transitioned: typeof vigentes = [];
      for (const b of vigentes) {
        assertBookingTransition("SOLICITUD", target);
        const changed = await tx.booking.updateMany({
          where: { id: b.id, statusNew: "SOLICITUD" },
          data: {
            statusNew: target,
            status: LEGACY_STATUS[target],
            decidedAt: now,
            // El vencimiento es atributo de la ESPERA, no de la reserva:
            // decidida (confirmada o rechazada), expiresAt se limpia.
            expiresAt: null,
          },
        });
        if (changed.count === 1) transitioned.push(b);
      }

      const totalGuests = transitioned.reduce((s, b) => s + b.guests, 0);
      if (totalGuests > 0) {
        if (action === "confirm") {
          // Suma directa sin tope: la agencia decide cuántas toma (el tope
          // del cupo rige la venta, no la confirmación).
          await confirmSeats(tx, dep.id, totalGuests);
        }
        await releaseRequestedSeats(tx, dep.id, totalGuests);
      }

      if (action === "confirm") {
        await tx.departure.update({
          where: { id: dep.id },
          data: {
            status: "CONFIRMADA",
            confirmedAt: dep.confirmedAt ?? now,
          },
        });
      }

      const fresh = await tx.departure.findUniqueOrThrow({
        where: { id: dep.id },
        select: DEPARTURE_CORE_SELECT,
      });
      const vencidas = await tx.booking.count({
        where: { departureId: dep.id, statusNew: "VENCIDA" },
      });
      return { transitioned, fresh, vencidas };
    });

    // Emails a los VIAJEROS después del commit, fuera del camino crítico.
    // Agrupados por viajero (lib/traveler-emails); nunca rompe la respuesta.
    waitUntil(
      sendDepartureDecisionEmails({
        action,
        tourTitle: dep.tour.title,
        date: dep.date,
        startTime: dep.startTime,
        bookings: result.transitioned,
      })
    );

    res.status(200).json({
      ok: true,
      action,
      transitioned: result.transitioned.length,
      // Ids exactos de lo que cambió: el front actualiza la card sin inferir
      // qué reservas tocó (importa en el rechazo individual).
      transitionedIds: result.transitioned.map((b) => b.id),
      skippedVencidas: result.vencidas,
      departure: result.fresh,
    });
  } catch (error) {
    if (error instanceof DepartureActionError) {
      res.status(error.httpStatus).json({ error: error.message });
      return;
    }
    console.error("Error en POST /api/operators/me/departures:", error);
    res.status(500).json({ error: "Error interno" });
  }
}
