// scripts/prebuild-featured-searches.ts
// Pre-cachea 5 queries famosos del demo para responder en <100ms en vez de ~10s
// durante presentaciones a jurados de concursos. Llama al endpoint local
// /api/search (que usa Voyage + Claude) y guarda el resultado en FeaturedSearch.
//
// PRE-REQUISITO: tener `vercel dev` corriendo en http://localhost:3000 antes
// de ejecutar este script — el script HTTP-llama al endpoint real, no replica
// el flujo internamente. Esto garantiza que los datos cacheados son idénticos
// a lo que produciría el endpoint en vivo.
//
// Uso:
//   npx dotenv -e .env.local -- tsx scripts/prebuild-featured-searches.ts
//
// Costo aproximado: ~$0.10 USD (5 × Claude Sonnet 4.6 + 5 × embeddings Voyage)
// Tiempo aproximado: ~50s (5 queries × ~10s cada una)

import { Prisma } from "@prisma/client";
import { db } from "../lib/db";
import { normalizeQuery } from "../lib/search-cache";

const SEARCH_URL = "http://localhost:3000/api/search";

const QUERIES: readonly string[] = [
  "quiero algo tranquilo en familia con mis hijos pequeños",
  "busco una ceremonia espiritual auténtica",
  "voy a estar 3 días en Arequipa qué me recomiendas",
  "soy foodie y quiero conocer la cocina peruana de verdad",
  "primera vez en Perú qué no me puedo perder",
];

interface SearchResult {
  id: string;
}

interface SearchResponse {
  results: SearchResult[];
  reasoning: string;
  query: string;
  filters_detected: Record<string, unknown>;
}

async function fetchSearch(query: string): Promise<SearchResponse> {
  const res = await fetch(SEARCH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  }
  return (await res.json()) as SearchResponse;
}

async function main(): Promise<void> {
  console.log(`→ Pre-cacheando ${QUERIES.length} queries famosos del demo...\n`);

  let ok = 0;
  let fail = 0;

  for (const query of QUERIES) {
    console.log(`Procesando: "${query}"`);
    const start = Date.now();
    try {
      const data = await fetchSearch(query);
      const ids = data.results.map((r) => r.id);
      if (ids.length === 0) {
        throw new Error("respuesta sin resultados");
      }

      const normalized = normalizeQuery(query);
      await db.featuredSearch.upsert({
        where: { query: normalized },
        create: {
          query: normalized,
          results: ids,
          reasoning: data.reasoning,
          filtersDetected: (data.filters_detected ?? {}) as Prisma.InputJsonValue,
        },
        update: {
          results: ids,
          reasoning: data.reasoning,
          filtersDetected: (data.filters_detected ?? {}) as Prisma.InputJsonValue,
        },
      });

      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      console.log(`  ✅ Cacheado en ${elapsed}s — ${ids.length} resultados\n`);
      ok++;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`  ❌ Error: ${msg}\n`);
      fail++;
    }
  }

  console.log(`Listo. ${ok} ok, ${fail} fallos.`);
  await db.$disconnect();
  if (fail > 0) process.exit(1);
}

main().catch(async (error) => {
  console.error("Fatal:", error);
  await db.$disconnect();
  process.exit(1);
});
