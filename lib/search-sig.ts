// lib/search-sig.ts
// Firma HMAC que liga la query normalizada, los ids elegidos por la fase 1 y
// (desde que la fase 2 dejó de rehidratar) el hash de los datos de tours que
// viajan por el cliente. La fase 2 solo confía en esos datos y solo escribe el
// cache compartido (FeaturedSearch) si la firma verifica: sin esto, cualquier
// cliente podría asociar una query popular a ids arbitrarios o descriptions
// falsas con un reasoning inyectado (cache poisoning).
// Si SEARCH_PHASE_SECRET no está definida se firma con un secreto fijo de
// desarrollo y se avisa fuerte en el log en cada invocación.
import { createHash, createHmac, timingSafeEqual } from "crypto";

const DEV_SECRET = "finde-dev-sin-proteccion";

function secret(): string {
  const s = process.env.SEARCH_PHASE_SECRET;
  if (!s) {
    console.warn(
      "[search-sig] SEARCH_PHASE_SECRET no definida: firmando con el secreto de DESARROLLO, sin protección real. Configurarla en Vercel antes de exponer esto en producción."
    );
    return DEV_SECRET;
  }
  return s;
}

// Datos mínimos que la fase 2 necesita para armar su prompt sin rehidratar.
// La fase 1 los emite (description ya truncada a 500) y el cliente los devuelve
// verbatim; el orden del array ES el ranking.
export interface Phase2Tour {
  id: string;
  title: string;
  description: string;
  category: string;
  city: string;
  region: string;
  priceSoles: number;
  rating: number;
}

// Serialización canónica: objeto reconstruido con los campos en orden fijo,
// así el hash no depende del orden de keys que mande el cliente ni de campos
// extra que agregue.
function canonicalPhase2Tours(tours: Phase2Tour[]): Phase2Tour[] {
  return tours.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    category: t.category,
    city: t.city,
    region: t.region,
    priceSoles: t.priceSoles,
    rating: t.rating,
  }));
}

export function hashPhase2Tours(tours: Phase2Tour[]): string {
  return createHash("sha256")
    .update(JSON.stringify(canonicalPhase2Tours(tours)))
    .digest("hex");
}

export function signSearchPhase(
  normalizedQuery: string,
  ids: string[],
  toursHash?: string
): string {
  const base = `${normalizedQuery}|${ids.join(",")}`;
  return createHmac("sha256", secret())
    .update(toursHash ? `${base}|${toursHash}` : base)
    .digest("hex");
}

export function verifySearchPhase(
  normalizedQuery: string,
  ids: string[],
  sig: unknown,
  toursHash?: string
): boolean {
  if (typeof sig !== "string" || sig.length !== 64) return false;
  const expected = Buffer.from(
    signSearchPhase(normalizedQuery, ids, toursHash),
    "hex"
  );
  const provided = Buffer.from(sig, "hex");
  if (provided.length !== expected.length) return false;
  return timingSafeEqual(expected, provided);
}
