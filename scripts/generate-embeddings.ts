// scripts/generate-embeddings.ts
// Genera embeddings (Voyage voyage-3, 1024 dim) para tours sin embedding.
// Texto fuente: "${title}. ${description}. ${category}. ${city}, ${region}"
// Uso: dotenv -e .env.local -- tsx scripts/generate-embeddings.ts

import { db } from "../lib/db";
import { voyage, MODEL_EMBED, DIM } from "../lib/voyage";

interface TourPendiente {
  id: string;
  title: string;
  description: string;
  category: string;
  city: string;
  region: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  console.log("→ Buscando tours sin embedding...");

  // Prisma no permite filtrar por Unsupported(vector), así que vamos por SQL crudo.
  const pendientes = await db.$queryRaw<TourPendiente[]>`
    SELECT id, title, description, category::text AS category, city, region
    FROM "Tour"
    WHERE embedding IS NULL
    ORDER BY "createdAt" ASC
  `;

  console.log(`→ Tours pendientes: ${pendientes.length}`);

  if (pendientes.length === 0) {
    console.log("✓ Todos los tours ya tienen embedding. Nada que hacer.");
    return;
  }

  let exitosos = 0;
  const fallidos: Array<{ id: string; title: string; error: string }> = [];

  for (let i = 0; i < pendientes.length; i++) {
    const tour = pendientes[i];
    const texto = `${tour.title}. ${tour.description}. ${tour.category}. ${tour.city}, ${tour.region}`;

    try {
      const respuesta = await voyage.embed({
        input: texto,
        model: MODEL_EMBED,
        inputType: "document",
      });

      const embedding = respuesta.data?.[0]?.embedding;

      if (!embedding || !Array.isArray(embedding)) {
        throw new Error("Voyage no devolvió un embedding válido");
      }

      if (embedding.length !== DIM) {
        throw new Error(
          `Dimensión inesperada: esperaba ${DIM}, recibí ${embedding.length}`
        );
      }

      // pgvector acepta literales en formato '[1,2,3,...]' con cast ::vector
      const literal = JSON.stringify(embedding);

      await db.$executeRaw`
        UPDATE "Tour"
        SET embedding = ${literal}::vector
        WHERE id = ${tour.id}
      `;

      exitosos++;

      if ((i + 1) % 5 === 0 || i + 1 === pendientes.length) {
        const corto =
          tour.title.length > 40 ? tour.title.slice(0, 40) + "…" : tour.title;
        console.log(
          `  Procesados ${i + 1}/${pendientes.length} tours (último: ${corto})`
        );
      }
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : String(error);
      console.error(`✗ Falló tour ${tour.id} ("${tour.title}"): ${mensaje}`);
      fallidos.push({ id: tour.id, title: tour.title, error: mensaje });
    }

    // Pausa para evitar rate limits de Voyage (no aplica al último)
    if (i < pendientes.length - 1) {
      await sleep(100);
    }
  }

  console.log(
    `\n✓ Embeddings completados: ${exitosos} exitosos, ${fallidos.length} fallidos`
  );

  if (fallidos.length > 0) {
    console.log("\nTours fallidos (reintentar):");
    for (const f of fallidos) {
      console.log(`  - ${f.id} | ${f.title} → ${f.error}`);
    }
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error("Error fatal en el script:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
