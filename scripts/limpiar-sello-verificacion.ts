// scripts/limpiar-sello-verificacion.ts
// Saca el sello "Finde Verificado" de las agencias que no lo tienen ganado, y
// baja del catálogo público los tours de la cuenta de demostraciones.
//
// POR DEFECTO ES DRY RUN: no escribe nada. Para escribir hay que pasar --apply
// de forma explicita.
//
//   npx dotenv-cli -e .env.local -- npx tsx scripts/limpiar-sello-verificacion.ts
//   npx dotenv-cli -e .env.local -- npx tsx scripts/limpiar-sello-verificacion.ts --apply
//
// ANTES DE --apply: backup de las DOS tablas, con el pg_dump v17.
//   /opt/homebrew/opt/postgresql@17/bin/pg_dump "$DIRECT_URL" \
//     -t '"Operator"' -t '"Tour"' -f backups/sello-antes-limpieza.sql
// El pg_dump del PATH es la v16 y contra un server 17 produce archivos de
// 0 bytes sin avisar. Ver .claude/rules/api-y-schema.md.
//
// CONTEXTO. El sello es el diferenciador del producto y estaba afirmando algo
// falso en nueve agencias. Era bloqueante de lanzamiento. Dos casos distintos,
// con decisiones distintas (ver docs/estado.md):
//
//   1. Ocho agencias del seed, sin RUC ni MINCETUR: verified = false. Son
//      agencias inventadas, no hay nada que verificar. Sus tours siguen en el
//      catálogo, sin badge.
//   2. "Descubre el Perú" (demo@finde.pe): sus TOURS salen del catálogo con
//      active = false. La agencia y la cuenta quedan intactas para
//      presentaciones. No se le baja verified porque el sello es lo que se
//      muestra en las demos; lo que no puede es estar publicada.
//
// MEGATOURS NO SE TOCA: es la agencia piloto real, con RUC y MINCETUR reales.
// Ojo con esto, que es la trampa del caso: su email es megatours@finde.pe, o
// sea que CUALQUIER criterio basado en el dominio @finde.pe la barre junto con
// las cuentas internas. Acá las cuentas se nombran una por una a propósito.

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const APPLY = process.argv.includes("--apply");

// La cuenta de demostraciones, por email exacto. Nunca por dominio.
const EMAIL_DEMO = "demo@finde.pe";
// La agencia piloto real. Se nombra para poder afirmar que quedó intacta.
const EMAIL_PILOTO = "megatours@finde.pe";

// Cuántas agencias del seed esperamos encontrar. Si el número no coincide, el
// script para: significa que la base cambió y hay que volver a mirar.
const SEED_ESPERADAS = 8;

function linea(): void {
  console.log("-".repeat(78));
}

async function main(): Promise<void> {
  console.log(APPLY ? "MODO: APLICAR (escribe en la base)" : "MODO: DRY RUN (no escribe nada)");
  linea();

  // ── 1. Agencias del seed con el sello puesto ──
  // Criterio explícito y verificable: verificadas, sin dueño de Supabase, y sin
  // RUC ni MINCETUR. Las tres condiciones juntas, no una sola.
  const seed = await db.operator.findMany({
    where: { verified: true, userId: null, ruc: null, mincetur: null },
    select: { id: true, name: true, email: true, _count: { select: { tours: true } } },
    orderBy: { name: "asc" },
  });

  console.log(`\n[1] AGENCIAS DEL SEED CON EL SELLO PUESTO: ${seed.length}`);
  console.log("    Acción: verified = false. Sus tours SIGUEN en el catálogo, sin badge.\n");
  for (const o of seed) {
    console.log(`    ${o.name.padEnd(24)} ${(o.email ?? "").padEnd(32)} ${o._count.tours} tours`);
  }
  if (seed.length !== SEED_ESPERADAS) {
    console.error(
      `\nPARA: se esperaban ${SEED_ESPERADAS} agencias del seed y hay ${seed.length}. ` +
        `La base cambió desde la investigación: revisar antes de aplicar.`
    );
    process.exit(1);
  }

  // ── 2. La cuenta de demostraciones ──
  const demo = await db.operator.findUnique({
    where: { email: EMAIL_DEMO },
    select: { id: true, name: true, verified: true, ruc: true, mincetur: true },
  });
  if (!demo) {
    console.error(`\nPARA: no existe la agencia ${EMAIL_DEMO}.`);
    process.exit(1);
  }
  const toursDemo = await db.tour.findMany({
    where: { operatorId: demo.id },
    select: { id: true, title: true, active: true, _count: { select: { bookings: true } } },
    orderBy: { title: "asc" },
  });
  const aBajar = toursDemo.filter((t) => t.active);

  linea();
  console.log(`\n[2] CUENTA DE DEMOSTRACIONES: ${demo.name} (${EMAIL_DEMO})`);
  console.log(`    RUC declarado: ${demo.ruc} · MINCETUR declarado: ${demo.mincetur}`);
  console.log(`    Los dos son inventados, pero con formato válido: por eso pasan por reales.`);
  console.log(`    Acción: la AGENCIA no se toca (sigue verified=${demo.verified}).`);
  console.log(`            Sus TOURS salen del catálogo con active = false.\n`);
  for (const t of toursDemo) {
    const marca = t.active ? "SALE DEL CATÁLOGO" : "ya estaba fuera";
    console.log(`    ${t.title.padEnd(38)} ${marca.padEnd(20)} ${t._count.bookings} reservas`);
  }

  // ── 3. La agencia piloto, que NO se toca ──
  const piloto = await db.operator.findUnique({
    where: { email: EMAIL_PILOTO },
    select: { id: true, name: true, verified: true, ruc: true, mincetur: true },
  });
  linea();
  console.log(`\n[3] AGENCIA PILOTO, INTACTA: ${piloto?.name}`);
  console.log(`    verified=${piloto?.verified} · RUC ${piloto?.ruc} · MINCETUR ${piloto?.mincetur}`);
  console.log(`    Su email es @finde.pe pero NO es cuenta interna: es la agencia real.`);

  // ── 4. Cualquier otra agencia con el sello y sin respaldo ──
  // Red de seguridad: si aparece una verificada que no es ni del seed ni la
  // demo ni el piloto, y le falta RUC o MINCETUR, el script para.
  const idsConocidos = new Set([...seed.map((o) => o.id), demo.id, piloto?.id].filter(Boolean));
  const otras = (
    await db.operator.findMany({
      where: { verified: true },
      select: { id: true, name: true, email: true, ruc: true, mincetur: true },
    })
  ).filter((o) => !idsConocidos.has(o.id));
  const otrasSinRespaldo = otras.filter((o) => !o.ruc || !o.mincetur);

  linea();
  console.log(`\n[4] OTRAS AGENCIAS VERIFICADAS FUERA DE LOS NUEVE CASOS: ${otras.length}`);
  if (otrasSinRespaldo.length > 0) {
    console.error("    HAY CASOS NUEVOS SIN RUC O SIN MINCETUR. El script para:");
    for (const o of otrasSinRespaldo) {
      console.error(`      ${o.name} (${o.email}) ruc=${o.ruc ?? "null"} mincetur=${o.mincetur ?? "null"}`);
    }
    process.exit(1);
  }
  console.log("    Ninguna sin RUC ni MINCETUR. Nada más que limpiar.");

  // ── 5. Cuentas internas con tours todavía públicos ──
  // No es parte de las dos decisiones: se REPORTA para que se decida aparte.
  const internas = await db.operator.findMany({
    where: { email: { in: ["hola@finde.pe", "test@finde.pe", "op-test@finde.pe", "totemhubapp@gmail.com"] } },
    select: { name: true, email: true, verified: true, tours: { where: { active: true }, select: { title: true } } },
  });
  const conTours = internas.filter((o) => o.tours.length > 0);
  linea();
  console.log(`\n[5] OTRAS CUENTAS INTERNAS CON TOURS PÚBLICOS: ${conTours.length}`);
  if (conTours.length === 0) {
    console.log("    Ninguna.");
  } else {
    for (const o of conTours) {
      console.log(`    ${o.name} (${o.email}) verified=${o.verified}`);
      for (const t of o.tours) console.log(`        ${t.title}`);
    }
    console.log("\n    ESTE SCRIPT NO LAS TOCA: no está en las dos decisiones tomadas.");
    console.log("    Ninguna tiene el sello puesto, así que no son parte del bloqueante.");
    console.log("    Están en la checklist de borrar datos de prueba. Decisión aparte.");
  }

  // ── 6. Cómo queda el catálogo público ──
  const antes = await db.tour.count({ where: { active: true } });
  const idsFuera = new Set(aBajar.map((t) => t.id));
  const visibles = await db.tour.findMany({
    where: { active: true },
    select: { id: true, operator: { select: { name: true, verified: true, email: true } } },
  });
  const resultantes = visibles.filter((t) => !idsFuera.has(t.id));
  const porAgencia = new Map<string, { n: number; verified: boolean; email: string }>();
  for (const t of resultantes) {
    const k = t.operator.name;
    const prev = porAgencia.get(k);
    // verified proyectado: las del seed pasan a false tras aplicar.
    const seedIds = new Set(seed.map((o) => o.email));
    const verifiedFinal = seedIds.has(t.operator.email ?? "") ? false : t.operator.verified;
    porAgencia.set(k, { n: (prev?.n ?? 0) + 1, verified: verifiedFinal, email: t.operator.email ?? "" });
  }

  linea();
  console.log(`\n[6] CÓMO QUEDA EL CATÁLOGO PÚBLICO`);
  console.log(`    Tours visibles ahora: ${antes}`);
  console.log(`    Tours que salen:      ${aBajar.length}`);
  console.log(`    Tours visibles al final: ${resultantes.length}\n`);
  console.log(`    ${"AGENCIA".padEnd(24)} ${"TOURS".padEnd(7)} ${"VERIFICADA".padEnd(12)} EMAIL`);
  for (const [nombre, d] of [...porAgencia.entries()].sort((a, b) => b[1].n - a[1].n)) {
    console.log(`    ${nombre.padEnd(24)} ${String(d.n).padEnd(7)} ${(d.verified ? "SÍ" : "no").padEnd(12)} ${d.email}`);
  }
  const verificadasFinales = [...porAgencia.entries()].filter(([, d]) => d.verified);
  console.log(`\n    Agencias con sello visibles al final: ${verificadasFinales.length}`);
  for (const [n] of verificadasFinales) console.log(`      ${n}`);

  // ── 7. Escribir, solo con --apply ──
  linea();
  if (!APPLY) {
    console.log("\nDRY RUN: no se escribió nada. Para aplicar, --apply.");
    await db.$disconnect();
    return;
  }

  const r1 = await db.operator.updateMany({
    where: { id: { in: seed.map((o) => o.id) } },
    data: { verified: false },
  });
  const r2 = await db.tour.updateMany({
    where: { id: { in: aBajar.map((t) => t.id) } },
    data: { active: false },
  });
  console.log(`\nAPLICADO: ${r1.count} agencias sin sello, ${r2.count} tours fuera del catálogo.`);

  // Verificación posterior, dentro del mismo script: que no queden sellos sin
  // respaldo y que el piloto siga intacto.
  const quedanSinRespaldo = await db.operator.count({
    where: { verified: true, OR: [{ ruc: null }, { mincetur: null }] },
  });
  const pilotoOk = await db.operator.findUnique({
    where: { email: EMAIL_PILOTO },
    select: { verified: true },
  });
  console.log(`VERIFICACIÓN: agencias con sello sin RUC o sin MINCETUR: ${quedanSinRespaldo} (esperado 0)`);
  console.log(`VERIFICACIÓN: ${EMAIL_PILOTO} verified=${pilotoOk?.verified} (esperado true)`);
  if (quedanSinRespaldo !== 0 || pilotoOk?.verified !== true) {
    console.error("LA VERIFICACIÓN POSTERIOR FALLÓ. Revisar contra el backup.");
    process.exit(1);
  }

  await db.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await db.$disconnect();
  process.exit(1);
});
