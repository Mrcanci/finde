// lib/tour-select.ts
// Shapes de Prisma.select reusables para queries de Tour.
// Excluye explícitamente el campo embedding (interno, no se expone en API).
//
// `Prisma.validator<Prisma.TourSelect>()(...)` preserva los tipos literales
// (`id: true` en vez de `id: boolean`) para que `findMany({ select })` infiera
// el shape concreto del resultado y no `{}[]`.

import { Prisma } from "@prisma/client";

const tourFields = {
  id: true,
  operatorId: true,
  title: true,
  description: true,
  shortPitch: true,
  category: true,
  difficulty: true,
  city: true,
  region: true,
  durationHours: true,
  priceSoles: true,
  capacity: true,
  language: true,
  included: true,
  excluded: true,
  imageUrl: true,
  images: true,
  rating: true,
  reviewsCount: true,
  createdAt: true,
  // Disponibilidad/políticas: el front (mapTourFromApi) los necesita para no
  // caer a defaults al recargar (días → todos marcados). Son campos del select,
  // no del schema DB.
  days: true,
  meetingPoint: true,
  cancellation: true,
  excludedDates: true,
  addedDates: true,
  startTime: true,
  active: true,
} as const;

// Para listados: nombre, verificación y teléfono del operador. El phone se
// incluye aquí (no solo en detalle) porque el front reserva con la data del
// catálogo (no hay re-fetch del detalle), y M4 arma el link wa.me de
// coordinación viajero→operador con ese teléfono. Es un contacto de negocio.
export const LIST_SELECT = Prisma.validator<Prisma.TourSelect>()({
  ...tourFields,
  operator: {
    select: {
      name: true,
      verified: true,
      phone: true,
      // N° MINCETUR: credencial pública. SOLO debe llegar al viajero si el
      // operador está verificado → gatear con gateOperatorMincetur antes de
      // responder en endpoints públicos (catálogo/búsqueda/detalle).
      mincetur: true,
    },
  },
});

// Para detalle: agrega ciudad y email del operador (perfil completo).
export const DETAIL_SELECT = Prisma.validator<Prisma.TourSelect>()({
  ...tourFields,
  operator: {
    select: {
      name: true,
      verified: true,
      city: true,
      email: true,
      phone: true,
      mincetur: true,
    },
  },
});

// Gatea el N° MINCETUR de un tour: lo anula (null) si el operador NO está
// verificado, para que el número de un operador en revisión nunca salga en el
// payload público. Null-safe (operator puede ser null). Devuelve el MISMO tour
// mutado (in-place) y también lo retorna para encadenar/map. Aplicar en las
// lecturas que ve el viajero (GET /api/tours, /api/search, GET /api/tours/[id]);
// NO en el dashboard del operador (ve su propio mincetur sin importar verified).
export function gateOperatorMincetur<T extends { operator?: { verified?: boolean; mincetur?: string | null } | null }>(
  tour: T
): T {
  if (tour?.operator && tour.operator.verified !== true) {
    tour.operator.mincetur = null;
  }
  return tour;
}
