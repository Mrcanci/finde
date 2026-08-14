// scripts/limpieza-em-dash.ts
// Saca los em-dashes (raya larga, U+2014) del texto visible de los tours.
//
// POR DEFECTO ES DRY RUN: no escribe nada. Para escribir hay que pasar --apply
// de forma explicita.
//
//   npx dotenv-cli -e .env.local -- npx tsx scripts/limpieza-em-dash.ts
//   npx dotenv-cli -e .env.local -- npx tsx scripts/limpieza-em-dash.ts --apply
//
// ANTES DE --apply: backup de la tabla, con el pg_dump v17.
//   /opt/homebrew/opt/postgresql@17/bin/pg_dump "$DIRECT_URL" -t '"Tour"' \
//     -f backups/tour-antes-limpieza-em-dash.sql
// El pg_dump del PATH es la v16 y contra un server 17 produce archivos de
// 0 bytes sin avisar. Ver .claude/rules/api-y-schema.md.
//
// Contexto: los em-dashes los metio el generador de IA, que imitaba los que
// tenian sus propios SYSTEM_PROMPT. Esa canilla ya se cerro en
// fix/prompts-sin-raya. Este script limpia lo que quedo de antes.

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const EM = String.fromCharCode(0x2014);
const CAMPOS = ["title", "description", "titleQu", "descQu"] as const;
const APPLY = process.argv.includes("--apply");

// Regla de reemplazo. Sale del dry run del 2026-08-14 sobre 88 ocurrencias:
// 86 con espacios a los dos lados y 2 seguidas de coma. Ninguna pegada a
// palabra, ninguna al inicio ni al final.
export function limpiar(txt: string): string {
  let out = txt;
  // 1. " raya," pasa a ",". Evita la coma huerfana.
  out = out.split(" " + EM + ",").join(",");
  // 2. " raya " pasa a ", ".
  out = out.split(" " + EM + " ").join(", ");
  return out;
}

// Formas que la regla NO cubre. Si aparece alguna, el script para.
function restoSinCubrir(txt: string): boolean {
  return txt.includes(EM);
}

async function main(): Promise<void> {
  const tours = await db.tour.findMany({
    select: { id: true, title: true, description: true, titleQu: true, descQu: true },
    orderBy: { createdAt: "asc" },
  });

  const cambios: Array<{ id: string; campo: string; antes: string; despues: string }> = [];
  const sinCubrir: Array<{ id: string; campo: string }> = [];

  for (const t of tours as any[]) {
    for (const campo of CAMPOS) {
      const v = t[campo];
      if (typeof v !== "string" || !v.includes(EM)) continue;
      const nuevo = limpiar(v);
      if (restoSinCubrir(nuevo)) {
        sinCubrir.push({ id: t.id, campo });
        continue;
      }
      cambios.push({ id: t.id, campo, antes: v, despues: nuevo });
    }
  }

  const ocurrencias = cambios.reduce((n, c) => n + (c.antes.split(EM).length - 1), 0);
  console.log(`Campos a tocar: ${cambios.length} · ocurrencias: ${ocurrencias}`);

  if (sinCubrir.length > 0) {
    console.error(
      `\nABORTA: ${sinCubrir.length} campos tienen una forma de raya que la regla no cubre.`
    );
    for (const s of sinCubrir) console.error(`  tour ${s.id} campo ${s.campo}`);
    console.error(`Revisar el dry run y ajustar la regla antes de seguir.`);
    await db.$disconnect();
    process.exit(1);
  }

  if (!APPLY) {
    console.log(`\nDRY RUN. No se escribio nada. Para escribir: --apply`);
    await db.$disconnect();
    return;
  }

  // Escritura: un update por campo, sin tocar nada mas de la fila.
  let escritos = 0;
  for (const c of cambios) {
    await db.tour.update({
      where: { id: c.id },
      data: { [c.campo]: c.despues } as any,
    });
    escritos++;
  }
  console.log(`\nEscritos ${escritos} campos.`);

  // Verificacion posterior: no puede quedar ninguna raya.
  const quedan = await db.tour.findMany({
    select: { id: true, title: true, description: true, titleQu: true, descQu: true },
  });
  const restantes = (quedan as any[]).reduce((n, t) => {
    for (const campo of CAMPOS) {
      const v = t[campo];
      if (typeof v === "string") n += v.split(EM).length - 1;
    }
    return n;
  }, 0);
  console.log(`Rayas restantes en los cuatro campos: ${restantes}`);

  await db.$disconnect();
}

main();
