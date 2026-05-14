// api/geo.ts
// GET /api/geo — Resuelve la ciudad del usuario a partir de las cabeceras
// x-vercel-ip-* que Vercel inyecta en producción. En localhost/vercel dev
// estas cabeceras no existen y el endpoint devuelve fallback Lima.
//
// Nota: este proyecto corre en @vercel/node (Serverless), no en Edge, por
// lo que request.geo NO está disponible. La fuente de verdad son los headers.

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { mapToSupportedCity } from "../lib/geo.js";

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

    // Sin ninguna cabecera de geo (localhost o vercel dev) → fallback Lima.
    if (!rawCountry && !rawRegion && !rawCity) {
      const body: Record<string, unknown> = {
        city: "Lima",
        country: "PE",
        source: "fallback",
      };
      if (process.env.NODE_ENV !== "production") {
        body.debug = {
          rawCity: null,
          rawRegion: null,
          rawCountry: null,
          reason: "no_geo_headers",
        };
      }
      res.setHeader("Cache-Control", "private, max-age=300");
      res.status(200).json(body);
      return;
    }

    const result = mapToSupportedCity(rawCity, rawRegion, rawCountry);
    const source: "geo" | "fallback" =
      result.reason === "matched" ? "geo" : "fallback";

    const body: Record<string, unknown> = {
      city: result.city,
      country: rawCountry || "PE",
      source,
    };
    if (process.env.NODE_ENV !== "production") {
      body.debug = {
        rawCity: rawCity ?? null,
        rawRegion: rawRegion ?? null,
        rawCountry: rawCountry ?? null,
        reason: result.reason,
      };
    }

    res.setHeader("Cache-Control", "private, max-age=300");
    res.status(200).json(body);
  } catch (error) {
    // En caso de cualquier fallo inesperado nunca crasheamos el cliente:
    // devolvemos siempre el fallback Lima para que el frontend pueda seguir.
    console.error("Error en GET /api/geo:", error);
    res.status(200).json({
      city: "Lima",
      country: "PE",
      source: "fallback",
    });
  }
}
