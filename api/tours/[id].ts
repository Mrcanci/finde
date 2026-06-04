// api/tours/[id].ts
// GET /api/tours/:id
// Detalle público de un tour, con operador extendido.

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { db } from "../../lib/db.js";
import { DETAIL_SELECT } from "../../lib/tour-select.js";
import { requireOperator } from "../../lib/auth.js";
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
    select: { id: true, operatorId: true, imageUrl: true },
  });
  if (!existing) {
    res.status(404).json({ error: "Tour no encontrado" });
    return;
  }
  if (existing.operatorId !== operator.id) {
    res.status(403).json({ error: "No puedes borrar este tour" });
    return;
  }

  // (a) Borrar el tour de la DB PRIMERO. Si falla, no tocamos Storage.
  try {
    await db.tour.delete({ where: { id } });
  } catch (error) {
    console.error("Error borrando tour:", error);
    res.status(500).json({ error: "Error borrando el tour" });
    return;
  }

  // (b) Borrar la foto de Storage DESPUÉS, solo si vive en nuestro bucket.
  // Un fallo aquí se loguea pero NO rompe la request: el tour ya se borró.
  const path = storagePathFromImageUrl(existing.imageUrl);
  if (path) {
    try {
      const { error } = await supabaseAdmin.storage
        .from(STORAGE_BUCKET)
        .remove([path]);
      if (error) {
        console.error(
          "Tour borrado, pero falló borrar la foto de Storage (huérfana):",
          path,
          error
        );
      }
    } catch (error) {
      console.error(
        "Tour borrado, pero error inesperado borrando la foto de Storage:",
        path,
        error
      );
    }
  }

  res.status(200).json({ ok: true, id });
}

// ── PATCH /api/tours/:id — pausar/reanudar un tour propio (M-2) ──
// Cambia solo el estado `active`. Mismo patrón de propiedad que PUT/DELETE.
// Un body mínimo { active: boolean } evita re-validar/re-enviar todo el tour
// solo para pausarlo. El filtro de active en el catálogo/búsqueda/detalle vive
// en sus respectivos GET; aquí solo se persiste el flag.

const patchBodySchema = z.object({ active: z.boolean() });

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

  // Verificación de PROPIEDAD: solo el dueño puede cambiar el estado.
  const existing = await db.tour.findUnique({
    where: { id },
    select: { id: true, operatorId: true },
  });
  if (!existing) {
    res.status(404).json({ error: "Tour no encontrado" });
    return;
  }
  if (existing.operatorId !== operator.id) {
    res.status(403).json({ error: "No puedes modificar este tour" });
    return;
  }

  let tour: Prisma.TourGetPayload<{ select: typeof DETAIL_SELECT }>;
  try {
    tour = await db.tour.update({
      where: { id },
      data: { active: parsed.data.active },
      select: DETAIL_SELECT,
    });
  } catch (error) {
    console.error("Error actualizando estado del tour:", error);
    res.status(500).json({ error: "Error actualizando el tour" });
    return;
  }

  res.status(200).json({ tour });
}
