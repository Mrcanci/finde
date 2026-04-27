// lib/tour-select.ts
// Shapes de Prisma.select reusables para queries de Tour.
// Excluye explícitamente el campo embedding (interno, no se expone en API).

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
  rating: true,
  reviewsCount: true,
  createdAt: true,
};

// Para listados: solo nombre y verificación del operador (info mínima de card).
export const LIST_SELECT = {
  ...tourFields,
  operator: {
    select: {
      name: true,
      verified: true,
    },
  },
};

// Para detalle: agrega ciudad y email del operador (perfil completo).
export const DETAIL_SELECT = {
  ...tourFields,
  operator: {
    select: {
      name: true,
      verified: true,
      city: true,
      email: true,
    },
  },
};
