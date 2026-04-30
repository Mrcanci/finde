// lib/search-cache.ts
// Normalización compartida de queries para el cache FeaturedSearch.
// IMPORTANTE: esta función es la fuente única de verdad. Si el script de
// prebuild y /api/search no usan EXACTAMENTE la misma normalización, el
// cache deja de matchear silenciosamente y el demo vuelve a tardar 10s.

export function normalizeQuery(q: string): string {
  return q.trim().toLowerCase();
}
