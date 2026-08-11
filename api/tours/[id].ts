// api/tours/[id].ts
// GET /api/tours/:id
// Detalle público de un tour, con operador extendido.

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { db } from "../../lib/db.js";
import {
  DETAIL_SELECT,
  OPERATOR_DETAIL_SELECT,
  gateOperatorMincetur,
} from "../../lib/tour-select.js";
import { requireOperator } from "../../lib/auth.js";
import { limaDateISO } from "../../lib/inventory.js";
import { parseTourInput, embedTourSafe } from "../../lib/tour-input.js";
import { supabaseAdmin } from "../../lib/supabase-admin.js";

const STORAGE_BUCKET = "tour-images";
// Marca de las URLs públicas de NUESTRO bucket. Solo borramos de Storage las
// imágenes que viven aquí; URLs externas (p.ej. unsplash del seed) se ignoran.
const PUBLIC_PREFIX = `/storage/v1/object/public/${STORAGE_BUCKET}/`;

// De una imageUrl pública de tour-images, extrae el path del archivo
// (${operatorId}/${uuid}.${ext}). Devuelve null si la URL no es de nuestro
// bucket (no se debe tocar Storage en ese caso).
function storagePathFromImageUrl(imageUrl: string | null): string | null {
  if (!imageUrl) return null;
  const idx = imageUrl.indexOf(PUBLIC_PREFIX);
  if (idx === -1) return null;
  const path = imageUrl.slice(idx + PUBLIC_PREFIX.length);
  return path.length > 0 ? path : null;
}

// Mensaje 409 al intentar borrar un tour que tiene reservas: invita a PAUSAR
// (active:false) en su lugar, que lo oculta del catálogo conservando tour y
// reservas. Mismo texto para el chequeo previo y la red de seguridad P2003.
function bookingsBlockedMessage(n: number): string {
  return `Este tour tiene ${n} reserva${n === 1 ? "" : "s"}. Púsalo en pausa en lugar de borrarlo.`;
}

const paramsSchema = z.object({
  id: z.string().min(1),
});

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method === "PUT") {
    await handlePut(req, res);
    return;
  }
  if (req.method === "DELETE") {
    await handleDelete(req, res);
    return;
  }
  if (req.method === "PATCH") {
    await handlePatch(req, res);
    return;
  }
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET, PUT, DELETE, PATCH");
    res.status(405).json({ error: "Método no permitido" });
    return;
  }

  const parsed = paramsSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({
      error: "Parámetros inválidos",
      details: parsed.error.issues,
    });
    return;
  }

  const { id } = parsed.data;

  try {
    const tour = await db.tour.findUnique({
      where: { id },
      select: DETAIL_SELECT,
    });

    // Pausado (active:false) → 404 público: un link directo no debe mostrarlo
    // (M-2). El dueño gestiona sus pausados vía GET /api/operators/me/tours.
    if (!tour || !tour.active) {
      res.status(404).json({ error: "Tour no encontrado" });
      return;
    }

    // Gateo: el mincetur de un operador no verificado nunca sale en el payload.
    gateOperatorMincetur(tour);
    res.status(200).json({ tour });
  } catch (error) {
    console.error(`Error en GET /api/tours/${id}:`, error);
    res.status(500).json({ error: "Error interno" });
  }
}

// ── PUT /api/tours/:id — editar un tour propio del operador autenticado ──
// Verifica propiedad (tour.operatorId === operator.id) antes de tocar nada.
// El mapeo form→schema y el embedding on-write viven en lib/tour-input.js,
// compartidos con POST /api/tours (api/tours/index.ts).

async function handlePut(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  let operator: { id: string; name: string; verified: boolean };
  try {
    ({ operator } = await requireOperator(req, res));
  } catch {
    return; // requireOperator ya respondió 401 (sin sesión) o 403 (no operador)
  }

  const id = typeof req.query.id === "string" ? req.query.id : "";
  if (!id) {
    res.status(400).json({ error: "id inválido" });
    return;
  }

  // Verificación de PROPIEDAD: solo el dueño puede editar su tour.
  const existing = await db.tour.findUnique({
    where: { id },
    select: { id: true, operatorId: true },
  });
  if (!existing) {
    res.status(404).json({ error: "Tour no encontrado" });
    return;
  }
  if (existing.operatorId !== operator.id) {
    res.status(403).json({ error: "No puedes editar este tour" });
    return;
  }

  const input = parseTourInput(req.body);
  if (!input.ok) {
    res.status(input.status).json({ error: input.error, details: input.details });
    return;
  }

  let tour: Prisma.TourGetPayload<{ select: typeof DETAIL_SELECT }>;
  try {
    tour = await db.tour.update({
      where: { id },
      // operatorId NO se toca (el tour sigue siendo del mismo operador).
      // language se OMITE a propósito: el form no lo captura y resetearlo a
      // ["es"] clobbearía tours multi-idioma; se preserva el valor existente.
      data: input.data,
      select: DETAIL_SELECT,
    });
  } catch (error) {
    console.error("Error actualizando tour:", error);
    res.status(500).json({ error: "Error actualizando el tour" });
    return;
  }

  // Re-embed SIEMPRE (Opción A): si Voyage falla, el update igual persiste y
  // embedding queda NULL (backfill pendiente).
  await embedTourSafe(tour.id, input.embeddingText);

  res.status(200).json({ tour });
}

// ── DELETE /api/tours/:id — borrar un tour propio (hard delete) + su foto ──
// Verifica propiedad (mismo patrón que PUT). Orden de borrado: DB primero,
// Storage después. Si el borrado de la foto falla, NO rompe la request: el
// tour ya está borrado y una foto huérfana es un problema menor (se loguea).
// Solo se intenta borrar de Storage si la imageUrl pertenece a nuestro bucket
// tour-images; las URLs externas (unsplash del seed) se dejan intactas.

async function handleDelete(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  let operator: { id: string; name: string; verified: boolean };
  try {
    ({ operator } = await requireOperator(req, res));
  } catch {
    return; // requireOperator ya respondió 401 (sin sesión) o 403 (no operador)
  }

  const id = typeof req.query.id === "string" ? req.query.id : "";
  if (!id) {
    res.status(400).json({ error: "id inválido" });
    return;
  }

  // Verificación de PROPIEDAD: solo el dueño puede borrar su tour.
  const existing = await db.tour.findUnique({
    where: { id },
    select: { id: true, operatorId: true, imageUrl: true, images: true },
  });
  if (!existing) {
    res.status(404).json({ error: "Tour no encontrado" });
    return;
  }
  if (existing.operatorId !== operator.id) {
    res.status(403).json({ error: "No puedes borrar este tour" });
    return;
  }

  // Protección de reservas: borrar un tour con reservas las destruiría. Si tiene
  // CUALQUIER reserva (futura o pasada), se rechaza con 409 e invita a PAUSAR el
  // tour (active:false), que lo oculta del catálogo conservando tour y reservas.
  const bookingsCount = await db.booking.count({ where: { tourId: id } });
  if (bookingsCount > 0) {
    res
      .status(409)
      .json({ error: bookingsBlockedMessage(bookingsCount), bookingsCount });
    return;
  }

  // (a) Borrar el tour de la DB PRIMERO. Si falla, no tocamos Storage.
  try {
    await db.tour.delete({ where: { id } });
  } catch (error) {
    // Red de seguridad: si una reserva entró entre el count y el delete, el FK
    // Restrict (Booking.tour) hace fallar el delete con P2003. Lo traducimos al
    // MISMO 409 limpio en vez de un 500 (re-contamos para el conteo actual).
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      const n = await db.booking.count({ where: { tourId: id } });
      res.status(409).json({ error: bookingsBlockedMessage(n), bookingsCount: n });
      return;
    }
    console.error("Error borrando tour:", error);
    res.status(500).json({ error: "Error borrando el tour" });
    return;
  }

  // (b) Borrar las fotos de Storage DESPUÉS, solo las que viven en nuestro
  // bucket. Con galería hay que limpiar portada (imageUrl) Y galería (images[]),
  // o quedan huérfanas. La portada suele estar también en images[] → DEDUP.
  // Un fallo aquí se loguea pero NO rompe la request: el tour ya se borró.
  const paths = [
    ...new Set(
      [existing.imageUrl, ...(existing.images || [])]
        .map(storagePathFromImageUrl)
        .filter((p): p is string => p !== null)
    ),
  ];
  if (paths.length > 0) {
    try {
      const { error } = await supabaseAdmin.storage
        .from(STORAGE_BUCKET)
        .remove(paths);
      if (error) {
        console.error(
          "Tour borrado, pero falló borrar fotos de Storage (huérfanas):",
          paths,
          error
        );
      } else {
        console.log(`Tour borrado: ${paths.length} foto(s) limpiada(s) de Storage`);
      }
    } catch (error) {
      console.error(
        "Tour borrado, pero error inesperado borrando fotos de Storage:",
        paths,
        error
      );
    }
  }

  res.status(200).json({ ok: true, id });
}

// ── PATCH /api/tours/:id — pausar/reanudar + config de venta (fase panel) ──
// Body parcial: { active } sigue funcionando idéntico (contrato por adición), y
// ahora acepta la config del sistema de salidas: salesMode, allotment,
// minQuorum, closeTime, closeDaysBefore (null = volver al default). Las
// validaciones corren sobre el estado RESULTANTE (valor entrante ?? actual).
// Mismo patrón de propiedad que PUT/DELETE.
//
// Este PATCH NO mueve contadores de Departure: seatsTaken/seatsRequested los
// mueven SOLO la creación de reservas, la confirmación/rechazo en lote y la
// cancelación del motor (lib/inventory.ts).

const patchBodySchema = z
  .object({
    active: z.boolean().optional(),
    salesMode: z.enum(["CUPO_FIJO", "SOLICITUD"]).optional(),
    allotment: z.number().int().min(1).max(3000).nullable().optional(),
    minQuorum: z.number().int().min(1).max(3000).nullable().optional(),
    closeTime: z
      .string()
      .regex(
        /^([01]\d|2[0-3]):[0-5]\d$/,
        "closeTime debe tener formato HH:MM (24 horas)"
      )
      .nullable()
      .optional(),
    closeDaysBefore: z.number().int().min(0).max(30).nullable().optional(),
  })
  .refine((b) => Object.values(b).some((v) => v !== undefined), {
    message: "El cuerpo debe incluir al menos un campo para actualizar",
  });

async function handlePatch(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  let operator: { id: string; name: string; verified: boolean };
  try {
    ({ operator } = await requireOperator(req, res));
  } catch {
    return; // requireOperator ya respondió 401 (sin sesión) o 403 (no operador)
  }

  const id = typeof req.query.id === "string" ? req.query.id : "";
  if (!id) {
    res.status(400).json({ error: "id inválido" });
    return;
  }

  const parsed = patchBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Cuerpo inválido", details: parsed.error.issues });
    return;
  }

  // Verificación de PROPIEDAD: solo el dueño puede cambiar el estado. El select
  // trae la config de venta actual para validar el estado RESULTANTE.
  const existing = await db.tour.findUnique({
    where: { id },
    select: {
      id: true,
      operatorId: true,
      salesMode: true,
      allotment: true,
      minQuorum: true,
      closeTime: true,
      closeDaysBefore: true,
    },
  });
  if (!existing) {
    res.status(404).json({ error: "Tour no encontrado" });
    return;
  }
  if (existing.operatorId !== operator.id) {
    res.status(403).json({ error: "No puedes modificar este tour" });
    return;
  }

  // Estado resultante = entrante ?? actual (undefined preserva; null limpia y
  // vuelve al default del motor).
  const body = parsed.data;
  const next = {
    salesMode: body.salesMode ?? existing.salesMode,
    allotment: body.allotment === undefined ? existing.allotment : body.allotment,
    minQuorum: body.minQuorum === undefined ? existing.minQuorum : body.minQuorum,
  };

  if (next.salesMode === "CUPO_FIJO" && next.allotment == null) {
    res
      .status(400)
      .json({ error: "Configura el cupo para vender con cupo fijo." });
    return;
  }
  if (next.salesMode === "CUPO_FIJO" && next.minQuorum != null) {
    res.status(400).json({
      error:
        "El quórum mínimo solo aplica en modo solicitud. Quítalo para vender con cupo fijo.",
    });
    return;
  }

  // Con CUPO_FIJO, el cupo debe cubrir los asientos YA confirmados de las
  // salidas vivas (futuras, no canceladas, sin override propio). Cubre tanto
  // el cambio de modo como bajar el allotment con ventas hechas.
  if (next.salesMode === "CUPO_FIJO" && next.allotment != null) {
    const agg = await db.departure.aggregate({
      _max: { seatsTaken: true },
      where: {
        tourId: id,
        date: { gte: limaDateISO(new Date()) },
        status: { not: "CANCELADA" },
        allotmentOverride: null,
      },
    });
    const maxTaken = agg._max.seatsTaken ?? 0;
    if (next.allotment < maxTaken) {
      res.status(409).json({
        error: `Hay salidas próximas con ${maxTaken} asiento${maxTaken === 1 ? "" : "s"} confirmado${maxTaken === 1 ? "" : "s"}. El cupo no puede ser menor a eso.`,
        maxSeatsTaken: maxTaken,
      });
      return;
    }
  }

  let tour: Prisma.TourGetPayload<{ select: typeof OPERATOR_DETAIL_SELECT }>;
  try {
    tour = await db.tour.update({
      where: { id },
      // Solo los campos presentes en el body: lo demás se preserva.
      data: {
        ...(body.active !== undefined && { active: body.active }),
        ...(body.salesMode !== undefined && { salesMode: body.salesMode }),
        ...(body.allotment !== undefined && { allotment: body.allotment }),
        ...(body.minQuorum !== undefined && { minQuorum: body.minQuorum }),
        ...(body.closeTime !== undefined && { closeTime: body.closeTime }),
        ...(body.closeDaysBefore !== undefined && {
          closeDaysBefore: body.closeDaysBefore,
        }),
      },
      select: OPERATOR_DETAIL_SELECT,
    });
  } catch (error) {
    console.error("Error actualizando estado del tour:", error);
    res.status(500).json({ error: "Error actualizando el tour" });
    return;
  }

  res.status(200).json({ tour });
}
