// lib/rate-limit.ts
// Rate limiting in-memory para el sprint de Finde.
//
// TRADEOFF (importante): este limiter vive en memoria del proceso. En Vercel
// serverless cada instancia de función tiene su propio Map, así que los
// límites aplican POR INSTANCIA, no globalmente. Si Vercel reparte el tráfico
// entre N instancias calientes, el techo efectivo es ~N × maxPerMinute.
// Aceptable para el demo (tráfico bajo, una instancia caliente la mayor parte
// del tiempo). En producción reemplazar por Upstash Redis o Vercel KV para
// un contador compartido entre regiones e instancias.

const WINDOW_MS = 60_000;

const buckets = new Map<string, number[]>();

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
}

export function rateLimit(
  ip: string,
  key: string,
  maxPerMinute: number
): RateLimitResult {
  const bucketKey = `${ip}:${key}`;
  const now = Date.now();
  const cutoff = now - WINDOW_MS;

  const previous = buckets.get(bucketKey) ?? [];
  // Filtramos timestamps fuera de la ventana de 1 minuto en cada llamada;
  // así el bucket nunca crece indefinidamente.
  const recent = previous.filter((t) => t > cutoff);

  if (recent.length >= maxPerMinute) {
    // recent[0] es el más antiguo (los timestamps se insertan en orden).
    const oldest = recent[0];
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((oldest + WINDOW_MS - now) / 1000)
    );
    buckets.set(bucketKey, recent);
    return { allowed: false, retryAfterSeconds };
  }

  recent.push(now);
  buckets.set(bucketKey, recent);
  return { allowed: true };
}

export function ipFromRequest(
  forwardedFor: string | string[] | undefined
): string {
  if (!forwardedFor) return "unknown";
  const raw = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
  // x-forwarded-for puede venir como "client, proxy1, proxy2" — el primero es el cliente.
  const first = raw.split(",")[0]?.trim();
  return first && first.length > 0 ? first : "unknown";
}
