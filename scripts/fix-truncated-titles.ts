// scripts/fix-truncated-titles.ts
// Corrige 2 títulos truncados en la DB (por ID exacto) y re-genera su embedding
// (el título entra en el embeddingText). seed.ts ya tiene los títulos completos,
// no se toca. NO modifica ningún otro tour.
//
// Uso:
//   npx dotenv-cli -e .env.local -- npx tsx scripts/fix-truncated-titles.ts
//
// Idempotente: si un título ya está corregido, salta el rename; el re-embed
// reescribe el mismo vector sin efectos secundarios.
// Reusa embedTourSafe (lib/tour-input.ts) para el embedding — NO reimplementa
// la llamada a Voyage ni el UPDATE del vector. Requiere VOYAGE_API_KEY.

import { db } from "../lib/db";
import { embedTourSafe } from "../lib/tour-input";

// Solo estos 2 ids. Títulos completos = los de prisma/seed.ts.
const FIXES = [
  { id: "cmoh8rcha000jvpn2fo8kzet0", title: "Sacsayhuamán y Cusco Imperial" },
  { id: "cmoh8rcsg000rvpn2bhwxmomr", title: "Tambomachay: baño ritual del Inca" },
];

async function main(): Promise<void> {
  let renamed = 0;
  let reembedded = 0;

  for (const fix of FIXES) {
    const before = await db.tour.findUnique({
      where: { id: fix.id },
      select: { id: true, title: true },
    });
    if (!before) {
      console.warn(`⚠️ Tour ${fix.id} no existe — salto.`);
      continue;
    }

    // 1) Rename (idempotente).
    if (before.title === fix.title) {
      console.log(`= ${fix.id}: el título ya es correcto ("${fix.title}").`);
    } else {
      await db.tour.update({ where: { id: fix.id }, data: { title: fix.title } });
      console.log(`✓ ${fix.id}: "${before.title}" → "${fix.title}"`);
      renamed++;
    }

    // 2) Re-embed con el título corregido, MISMO embeddingText que parseTourInput
    //    (`${title}. ${description}. ${category}. ${city}, ${region}`) y reusando
    //    embedTourSafe (Voyage + UPDATE del vector).
    const t = await db.tour.findUnique({
      where: { id: fix.id },
      select: { title: true, description: true, category: true, city: true, region: true },
    });
    if (t) {
      const text = `${t.title}. ${t.description}. ${t.category}. ${t.city}, ${t.region}`;
      await embedTourSafe(fix.id, text);
      console.log(`  ↻ re-embed lanzado para ${fix.id} (título corregido).`);
      reembedded++;
    }
  }

  console.log(`\nResumen: renombrados ${renamed}/${FIXES.length} · re-embeddeados ${reembedded}/${FIXES.length}.`);
}

main()
  .catch((error) => {
    console.error("Error en fix-truncated-titles:", error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
