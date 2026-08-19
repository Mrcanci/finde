// api/geo.ts
// GET /api/geo — Resuelve la ciudad del usuario a partir de las cabeceras
// x-vercel-ip-* que Vercel inyecta en producción. En localhost/vercel dev
// estas cabeceras no existen y el endpoint devuelve fallback Lima.
//
// Nota: este proyecto corre en @vercel/node (Serverless), no en Edge, por
// lo que request.geo NO está disponible. La fuente de verdad son los headers.
//
// ── POR QUÉ `reason` VIAJA SIEMPRE ──────────────────────────────────────────
// Hasta el 2026-08-19 `reason` existía pero solo dentro de un bloque `debug`
// que se emitía si `NODE_ENV !== "production"`. En Vercel eso es "production"
// TAMBIÉN en los deploys de preview, así que ese bloque no salía nunca, ni en
// finde.pe ni en dev.finde.pe.
//
// El resultado fue que cuando José vio tours de Lima estando en Cajamarca no
// había forma de saber qué había pasado, y las dos explicaciones posibles
// pedían arreglos distintos:
//
//   "no te detecté"            -> la IP no trajo nada, o no es peruana
//   "te detecté y no te tengo" -> Cajamarca no estaba en la lista de soportadas
//                                 (eso ya no pasa: desde el 2026-08-19 los
//                                 grupos son los 26 departamentos, ver
//                                 lib/cities.js)
//
// `source` no las distingue: colapsa las dos en "fallback". `reason` sí, y no
// expone nada: es una categoría de cinco valores, sin datos de nadie.
//
// El detalle crudo (qué ciudad exacta reportó la IP) va detrás de `?debug=1`,
// porque eso sí es la ubicación de alguien. Y es la de quien pregunta, sobre sí
// mismo: no hay forma de preguntar por otro.

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { mapToDepartment, displayName } from "../lib/geo.js";

function firstHeader(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function safeDecode(value: string | undefined): string | undefined {
  if (!value) return value;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "Método no permitido" });
    return;
  }

  try {
    const rawCountry = firstHeader(req.headers["x-vercel-ip-country"]);
    const rawRegion = firstHeader(req.headers["x-vercel-ip-country-region"]);
    const rawCityHeader = firstHeader(req.headers["x-vercel-ip-city"]);
    const rawCity = safeDecode(rawCityHeader);

    // Opt-in explícito. Devuelve la ubicación que la IP reporta de QUIEN
    // PREGUNTA, a sí mismo: no hay parámetro para preguntar por otro.
    const wantsDebug = firstHeader(req.query.debug as string | string[] | undefined) === "1";
    const debug = {
      rawCity: rawCity ?? null,
      rawRegion: rawRegion ?? null,
      rawCountry: rawCountry ?? null,
    };

    // Sin ninguna cabecera de geo (localhost o vercel dev) → fallback Lima.
    if (!rawCountry && !rawRegion && !rawCity) {
      const body: Record<string, unknown> = {
        department: "Lima",
        display: displayName("Lima"),
        country: "PE",
        source: "fallback",
        reason: "no_headers",
      };
      if (wantsDebug) body.debug = debug;
      res.setHeader("Cache-Control", "private, max-age=300");
      res.status(200).json(body);
      return;
    }

    // El departamento sale del CODIGO ISO de la region, que es una tabla
    // cerrada que cubre el pais entero. El nombre de ciudad quedo como
    // respaldo. Ver lib/cities.js.
    const result = mapToDepartment(rawCity, rawRegion, rawCountry);
    const source: "geo" | "fallback" =
      result.reason === "iso" || result.reason === "city" ? "geo" : "fallback";

    const body: Record<string, unknown> = {
      department: result.department,
      display: displayName(result.department),
      country: rawCountry || "PE",
      source,
      reason: result.reason,
    };
    if (wantsDebug) body.debug = debug;

    res.setHeader("Cache-Control", "private, max-age=300");
    res.status(200).json(body);
  } catch (error) {
    // En caso de cualquier fallo inesperado nunca crasheamos el cliente:
    // devolvemos siempre el fallback Lima para que el frontend pueda seguir.
    console.error("Error en GET /api/geo:", error);
    res.status(200).json({
      department: "Lima",
      display: "Lima",
      country: "PE",
      source: "fallback",
      reason: "error",
    });
  }
}
