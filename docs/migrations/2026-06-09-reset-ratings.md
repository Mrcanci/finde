# 2026-06-09 — Reset de ratings/reseñas fabricados

## Qué hace

Elimina por completo los **ratings y reseñas inventados** del producto. Antes,
los 40 tours del catálogo mostraban un `rating` (4.4–5.0) y un `reviewsCount`
(19–230) **hardcodeados en el seed**, más reseñas individuales (autor, texto,
fecha) **generadas por hash** en el frontend. Nada de eso provenía de reseñas
reales (no existe modelo `Review` en la DB).

Tras este cambio, **ningún tour muestra rating hasta que existan reseñas
reales**: todos se ven como "Nuevo" / sin bloque de rating. El único origen de
rating válido hoy son las reseñas que deja el viajero en sesión (estado
`reviews` en `AppDemo.jsx`, vía `handleReview`); a futuro, un modelo `Review`
en DB (trabajo aparte, **no** incluido aquí).

## Cambios incluidos

- **Frontend** (`src/AppDemo.jsx`):
  - Eliminado el andamiaje de reseñas fabricadas: `REVIEW_AUTHORS`,
    `REVIEW_TEXTS_BY_CATEGORY`, `hashTourId`, `distributeStars`,
    `generateMockReviews`.
  - La sección de reseñas del detalle solo renderiza reseñas **reales**
    (`reviews[tour.id]`); conteo, distribución de estrellas y promedio se
    calculan sobre esas reseñas.
  - `reviews === 0` ahora se trata como "Nuevo"/oculto en todos los lugares:
    `TCard` (carrusel), resultados de búsqueda, header del detalle, bloque
    "Resumen de N reseñas" y dashboard "Mis Tours". Ningún spot muestra
    "★ 0 (0)".
- **Seed** (`prisma/seed.ts`): quitados los `rating`/`reviewsCount`
  hardcodeados (tipo `TourSeed` y array `TOURS`) y los del path de tours
  migrados. Un tour sembrado nace en `0/0` (default del schema).
- **Backfill** (`scripts/backfill-reset-ratings.ts`): pone `rating=0` y
  `reviewsCount=0` en todos los tours existentes en la DB.

## Comando

```bash
# 1) Resetear los tours ya existentes en la DB (idempotente)
npx dotenv-cli -e .env.local -- npx tsx scripts/backfill-reset-ratings.ts

# 2) Refrescar el cache de búsqueda (ver nota abajo). Requiere `vercel dev`.
npx dotenv-cli -e .env.local -- npx tsx scripts/prebuild-featured-searches.ts
```

El backfill **no** requiere `prisma db push` (no hay cambio de schema: las
columnas `rating`/`reviewsCount` ya existían con default 0). Solo zerea datos.

## Nota sobre el cache (`FeaturedSearch`)

El cache de búsquedas famosas **no** guarda valores de rating por tour: almacena
IDs de resultado (`results`) y la **prosa de razonamiento** de Claude
(`reasoning`); los tours se re-hidratan en vivo desde la DB, así que los números
de rating ya saldrán en 0 tras el backfill.

**Pero** el prompt de `/api/search` le pasa a Claude el `rating` de cada tour,
así que la `reasoning` **cacheada** puede mencionar ratings viejos en texto
("…con calificación de 4.9"). Por eso, tras el backfill hay que **refrescar el
cache**:

- Recomendado: re-correr `scripts/prebuild-featured-searches.ts` (hace `upsert`,
  sobrescribe `results` + `reasoning` con valores frescos). Requiere `vercel
  dev` corriendo en `localhost:3000`.
- Alternativa rápida (si no se puede pre-cachear antes de un demo): vaciar el
  cache con `DELETE FROM "FeaturedSearch";` — las queries caen al flujo en vivo
  (~10s) en vez de servir prosa con ratings viejos.

## ORDER BY: reemplazo por `createdAt desc` (APLICADO)

Con todos los ratings en 0, ordenar por rating ya no discrimina. Los tres
lugares que ordenaban por rating se cambiaron a **recencia (`createdAt desc`,
lo más nuevo primero)**, incluidos en este cambio:

- `api/tours/index.ts` — antes `orderBy: [{ rating: "desc" }, { reviewsCount: "desc" }]` → ahora `orderBy: [{ createdAt: "desc" }]`.
- `src/AppDemo.jsx` (`feat`, carrusel de destacados) — antes `sort((a,b) => b.rating - a.rating || b.reviews - a.reviews)` → ahora `sort((a,b) => (b.createdAt || "").localeCompare(a.createdAt || ""))`.
- `src/AppDemo.jsx` (catálogo de ciudad) — antes `sort((a,b) => (b.rating || 0) - (a.rating || 0))` → ahora `sort((a,b) => (b.createdAt || "").localeCompare(a.createdAt || ""))`.

Detalle de soporte: `createdAt` ya estaba en `LIST_SELECT` pero no se mapeaba al
objeto del front; se expuso en `mapTourFromApi` (`createdAt: t.createdAt ?? null`)
para que los dos `sort` del front operen sobre un valor real (las fechas ISO
comparan lexicográfico = cronológico).

`/api/search` ordena por distancia vectorial (pgvector), **no** por rating, así
que no se ve afectado en su orden.

Pendiente a futuro (no en este cambio): reemplazar la recencia por señal real
de calidad/popularidad (reseñas reales, ranking por reservas) cuando exista.

## Reversibilidad

- **Código** (frontend/seed/script/doc): revertible con `git revert` del commit.
- **Datos** (backfill): el reset es **destructivo** sobre los valores
  fabricados — al ponerlos en 0 se pierden los ratings/reviewsCount previos. Eso
  es **intencional** (eran inventados). Si por alguna razón se quisieran
  recuperar, los valores originales del seed siguen en el historial de git
  (`prisma/seed.ts` y `data/track-b/tours-db-snapshot.json` antes de este
  commit) y se podrían re-sembrar. No hay reseñas reales que se pierdan (no
  existían).
