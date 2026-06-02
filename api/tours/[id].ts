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
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET, PUT");
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

    if (!tour) {
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
