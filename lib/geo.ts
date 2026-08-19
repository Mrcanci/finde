// lib/geo.ts
// Fachada tipada para el backend.
//
// LOS DATOS Y LA LÓGICA NO VIVEN ACÁ: viven en `lib/cities.js`, que no tiene ni
// un import justamente para que lo puedan usar los dos lados, la función
// serverless y el navegador. Este archivo solo les pone tipos y los reexporta.
//
// Si vas a tocar la tabla de departamentos, los nombres para mostrar o el mapeo
// de la IP, es en `lib/cities.js`. Acá no hay nada que cambiar.

import {
  DEPARTMENTS as DEPS,
  DEPARTMENTS_FOR_SELECT as DEPS_SELECT,
  DEPARTMENT_BY_ISO as BY_ISO,
  DEPARTMENT_DISPLAY as DISPLAY,
  displayName as display,
  normalizeCity,
  toDepartment as toDep,
  mapToDepartment as mapDep,
  departmentsOfTour as depsOfTour,
  departmentsWithTours as depsWithTours,
  toursByDepartment as byDep,
} from "./cities.js";

export const DEPARTMENTS = DEPS as readonly string[];
export const DEPARTMENTS_FOR_SELECT = DEPS_SELECT as readonly string[];

/**
 * Un texto de región → el departamento canónico, o null. Normaliza antes de
 * validar (acepta "lima", devuelve "Lima"). Acepta SOLO departamentos: para una
 * ciudad hay que usar la tabla de ciudades. La usa `parseTourInput`.
 */
export const toDepartment: (raw: string | undefined | null) => string | null = toDep;
export const DEPARTMENT_BY_ISO = BY_ISO as Record<string, string>;
export const DEPARTMENT_DISPLAY = DISPLAY as Record<string, string>;

export const displayName: (department: string) => string = display;
export const normalize: (raw: string | undefined | null) => string = normalizeCity;

export type MapResult = {
  department: string;
  reason: "iso" | "city" | "non_pe" | "unmapped" | "no_input";
};

export const mapToDepartment: (
  rawCity: string | undefined | null,
  rawRegion: string | undefined | null,
  country: string | undefined | null
) => MapResult = mapDep;

export const departmentsOfTour: (tour: { region?: string; city?: string }) => string[] =
  depsOfTour;

export const departmentsWithTours: (
  tours: { region?: string; city?: string }[]
) => string[] = depsWithTours;

export const toursByDepartment: <T extends { region?: string; city?: string }>(
  tours: T[],
  department: string
) => T[] = byDep;
