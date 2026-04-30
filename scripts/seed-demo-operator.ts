// scripts/seed-demo-operator.ts
// Seed del operador demo "María Quispe — Cusco Auténtico" para presentaciones
// a jurados de concursos (Emprende TEC, ProInnóvate, Startup Perú).
// Idempotente: re-correr el script no duplica nada.
//
// Flujo:
//   1. Upsert Operator (email demo@finde.pe, verified=true).
//   2. Selecciona 3 tours existentes en Cusco (cultural, mystic, adventure)
//      por menor priceSoles. NO crea tours nuevos — reusa título, descripción
//      y embedding ya generados (cero gasto en Voyage/Claude).
//   3. Reasigna operatorId de esos 3 tours a María Quispe.
//
// Nota sobre el "sessionToken" demo-session-2026:
//   No se persiste en DB (no existe columna en este sprint, ver CLAUDE.md).
//   En el demo en vivo, el dashboard se activa flipeando React state via:
//     Perfil → "Trabajar como operador" → form → submit → setIsOperator(true)
//   Este script garantiza que María existe en DB y es dueña de 3 tours
//   verificados, listos para mostrarse cuando un jurado pida ver "el lado del
//   operador".
//
// Uso:
//   npx dotenv -e .env.local -- tsx scripts/seed-demo-operator.ts

import { Category } from "@prisma/client";
import { db } from "../lib/db";

const DEMO_EMAIL = "demo@finde.pe";
const DEMO_SESSION_TOKEN = "demo-session-2026"; // referencia, no persistido

async function pickTour(
  category: Category
): Promise<{ id: string; title: string } | null> {
  // Determinístico: el más barato de la categoría en Cusco.
  // Re-correr el script reasigna SIEMPRE los mismos 3 tours.
  return db.tour.findFirst({
    where: { category, city: "Cusco" },
    orderBy: { priceSoles: "asc" },
    select: { id: true, title: true },
  });
}

async function main(): Promise<void> {
  console.log("→ Creando/actualizando operador demo...");
  const operador = await db.operator.upsert({
    where: { email: DEMO_EMAIL },
    create: {
      name: "María Quispe",
      email: DEMO_EMAIL,
      phone: "984000111",
      city: "Cusco",
      verified: true,
    },
    update: {
      name: "María Quispe",
      phone: "984000111",
      city: "Cusco",
      verified: true,
    },
  });
  console.log(
    `  ✅ Operador creado/actualizado: ${operador.email} (id=${operador.id})\n`
  );

  console.log("→ Seleccionando 3 tours existentes para reasignar...");
  const cultural = await pickTour(Category.cultural);
  const mystic = await pickTour(Category.mystic);
  const adventure = await pickTour(Category.adventure);

  if (!cultural || !mystic || !adventure) {
    console.error("  ❌ Faltan tours en Cusco para alguna categoría:");
    console.error(`     cultural:  ${cultural?.title ?? "AUSENTE"}`);
    console.error(`     mystic:    ${mystic?.title ?? "AUSENTE"}`);
    console.error(`     adventure: ${adventure?.title ?? "AUSENTE"}`);
    console.error("  Corre `npm run db:seed` antes de este script.");
    await db.$disconnect();
    process.exit(1);
  }

  const ids = [cultural.id, mystic.id, adventure.id];
  await db.tour.updateMany({
    where: { id: { in: ids } },
    data: { operatorId: operador.id },
  });

  console.log("  ✅ Tours reasignados a María Quispe:");
  console.log(`     cultural:  ${cultural.title}`);
  console.log(`     mystic:    ${mystic.title}`);
  console.log(`     adventure: ${adventure.title}\n`);

  console.log("Demo listo.");
  console.log("Para ver el dashboard como María Quispe en el demo:");
  console.log("  1. Abrir https://finde-two.vercel.app/demo (password: finde2026)");
  console.log("  2. Ir a Perfil → 'Trabajar como operador'");
  console.log("  3. Llenar el form (cualquier dato) → Enviar");
  console.log("  4. El TopNav muestra el ícono de dashboard.");
  console.log("");
  console.log(
    `Token demo (referencia, no persistido en DB): ${DEMO_SESSION_TOKEN}`
  );

  await db.$disconnect();
}

main().catch(async (error) => {
  console.error("Fatal:", error);
  await db.$disconnect();
  process.exit(1);
});
