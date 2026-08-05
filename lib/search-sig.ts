// lib/search-sig.ts
// Firma HMAC que liga la query normalizada con los ids elegidos por la fase 1
// de la búsqueda. La fase 2 solo escribe el cache compartido (FeaturedSearch)
// si la firma verifica: sin esto, cualquier cliente podría asociar una query
// popular a ids arbitrarios con un reasoning inyectado (cache poisoning).
// Si SEARCH_PHASE_SECRET no está definida se firma con un secreto fijo de
// desarrollo y se avisa fuerte en el log en cada invocación.
import { createHmac, timingSafeEqual } from "crypto";

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

export function signSearchPhase(
  normalizedQuery: string,
  ids: string[]
): string {
  return createHmac("sha256", secret())
    .update(`${normalizedQuery}|${ids.join(",")}`)
    .digest("hex");
}

export function verifySearchPhase(
  normalizedQuery: string,
  ids: string[],
  sig: unknown
): boolean {
  if (typeof sig !== "string" || sig.length !== 64) return false;
  const expected = Buffer.from(signSearchPhase(normalizedQuery, ids), "hex");
  const provided = Buffer.from(sig, "hex");
  if (provided.length !== expected.length) return false;
  return timingSafeEqual(expected, provided);
}
