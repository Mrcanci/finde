// scripts/backfill-reset-ratings.ts
// Backfill puntual: pone rating=0 y reviewsCount=0 en TODOS los tours.
// Acompaña la eliminación de ratings/reseñas fabricados (ver
// docs/migrations/2026-06-09-reset-ratings.md). Tras correrlo, ningún tour
// muestra rating hasta que existan reseñas reales.
//
// Uso:
//   npx dotenv-cli -e .env.local -- npx tsx scripts/backfill-reset-ratings.ts
//
// Idempotente: solo actualiza los tours que aún NO están en 0/0. Una segunda
// corrida reporta "0 reseteados". No borra ni recrea tours; solo zerea dos
// columnas. No toca embeddings, imágenes ni ningún otro campo.

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main(): Promise<void> {
  const pendientes = await db.tour.count({
    where: { OR: [{ rating: { not: 0 } }, { reviewsCount: { not: 0 } }] },
  });
  const total = await db.tour.count();

  console.log(
    `Tours totales: ${total}. Con rating/reseñas != 0 (a resetear): ${pendientes}.`
  );

  if (pendientes === 0) {
    console.log("Nada que hacer: todos los tours ya están en 0/0.");
    await db.$disconnect();
    return;
  }

  const res = await db.tour.updateMany({
    where: { OR: [{ rating: { not: 0 } }, { reviewsCount: { not: 0 } }] },
    data: { rating: 0, reviewsCount: 0 },
  });

  console.log(`Tours reseteados a 0/0: ${res.count}.`);
  await db.$disconnect();
}

main().catch(async (e) => {
  console.error("Error reseteando ratings:", e);
  await db.$disconnect();
  process.exit(1);
});
