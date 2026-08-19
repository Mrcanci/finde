// lib/geo.ts
// Fachada tipada de las ciudades soportadas para el backend.
//
// LOS DATOS Y LA LÓGICA NO VIVEN ACÁ: viven en `lib/cities.js`, que no tiene ni
// un import justamente para que lo puedan usar los dos lados, la función
// serverless y el navegador. Este archivo solo les pone tipos de TypeScript y
// los reexporta, para que `api/geo.ts` no cambie.
//
// Si vas a agregar o sacar una ciudad, es en `lib/cities.js`. Acá no hay nada
// que tocar.

import {
  SUPPORTED_CITIES as CITIES,
  CITY_ALIASES as ALIASES,
  normalizeCity,
  mapToSupportedCity as mapCity,
  toursByCity as filterByCity,
} from "./cities.js";

export const SUPPORTED_CITIES = CITIES as readonly string[];
export type SupportedCity = string;

export const CITY_ALIASES = ALIASES as Record<string, readonly string[]>;

export const normalize: (raw: string | undefined | null) => string = normalizeCity;

export type MapResult = {
  city: SupportedCity;
  reason: "matched" | "non_pe" | "unmapped" | "no_input";
};

export const mapToSupportedCity: (
  rawCity: string | undefined | null,
  rawRegion: string | undefined | null,
  country: string | undefined | null
) => MapResult = mapCity;

export const toursByCity: <T extends { location?: string }>(
  tours: T[],
  city: SupportedCity
) => T[] = filterByCity;
