// scripts/backfill-expiresat-solicitudes.ts
// Rellena el expiresAt de las solicitudes que quedaron en NULL con la migracion
// del inventario (2026-08-05) y que por eso NO PUEDEN VENCER NUNCA.
//
// POR DEFECTO ES DRY RUN: no escribe nada. Para escribir hay que pasar --apply
// de forma explicita.
//
//   npx dotenv-cli -e .env.local -- npx tsx scripts/backfill-expiresat-solicitudes.ts
//   npx dotenv-cli -e .env.local -- npx tsx scripts/backfill-expiresat-solicitudes.ts --apply
//
// ANTES DE --apply: backup de la tabla, con el pg_dump v17.
//   /opt/homebrew/opt/postgresql@17/bin/pg_dump "$DIRECT_URL" -t '"Booking"' \
//     -f backups/booking-antes-backfill-expiresat.sql
// El pg_dump del PATH es la v16 y contra un server 17 produce archivos de
// 0 bytes sin avisar. Ver .claude/rules/api-y-schema.md.
//
// ── POR QUE ESTE CAMINO Y NO EL ATAJO ──
//
// El atajo obvio seria poner statusNew = VENCIDA directo. NO SE HACE: ese
// camino saltea releaseRequestedSeats y deja seatsRequested inflado, que es
// EXACTAMENTE el sintoma que este script existe para eliminar.
//
// Lo correcto es escribir UNA sola columna, expiresAt, con una fecha pasada, y
// dejar que expireStaleSolicitudes (lib/inventory.ts) las tome. Ese camino ya
// hace la transicion condicional por fila y libera el contador en la MISMA
// transaccion, y esta probado en produccion. El script no toca la maquina de
// estados.
//
// El valor que se escribe no es un centinela arbitrario: es el que la reserva
// HABRIA tenido, recalculado con solicitudExpiresAt del propio motor, o sea
// min(cierre de la salida, creacion + 72h, medianoche previa a la salida).
// Como las salidas involucradas ya pasaron, los tres topes estan en el pasado.
//
// Contexto completo en docs/estado.md, seccion "Bugs abiertos".

import { PrismaClient } from "@prisma/client";
import { solicitudExpiresAt, expireStaleSolicitudes } from "../lib/inventory";

const db = new PrismaClient();
const APPLY = process.argv.includes("--apply");

// La unica agencia real operando hoy. Si aparece una solicitud suya, se marca
// aparte: son viajeros que podrian estar esperando respuesta de verdad.
const AGENCIA_OPERANDO = "MEGATOURS";

// Muestra el dominio y no la direccion completa cuando no es una cuenta interna.
function correoSeguro(email: string): string {
  const [usuario, dominio] = email.split("@");
  if (dominio === "finde.pe") return email;
  return `${usuario.slice(0, 2)}***@${dominio}`;
}

function fecha(d: Date | null): string {
  return d ? d.toISOString().slice(0, 16).replace("T", " ") : "-";
}

async function main(): Promise<void> {
  const ahora = new Date();
  console.log(`${APPLY ? "APLICANDO" : "DRY RUN (no escribe nada)"} · ${ahora.toISOString()}\n`);

  const objetivo = await db.booking.findMany({
    where: { statusNew: "SOLICITUD", expiresAt: null },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      bookingCode: true,
      userEmail: true,
      guests: true,
      createdAt: true,
      departureId: true,
      departure: { select: { id: true, date: true, status: true, seatsRequested: true } },
      tour: {
        select: {
          title: true,
          closeTime: true,
          closeDaysBefore: true,
          operator: { select: { name: true, userId: true } },
        },
      },
    },
  });

  if (objetivo.length === 0) {
    console.log("No hay solicitudes con expiresAt NULL: la fase de escritura no tiene nada que hacer.");
    console.log("(El barrido de abajo corre igual: es lo que permite retomar una corrida a medias.)\n");
  }

  // ── 1. Que se va a tocar ──
  console.log(`=== ${objetivo.length} solicitudes con expiresAt NULL ===\n`);
  console.log("codigo     | viajero                | salida     | tour                      | agencia          | expiresAt que se escribe");
  console.log("-".repeat(132));

  const sinSalida: string[] = [];
  const enElFuturo: string[] = [];
  const deAgenciaOperando: string[] = [];
  const plan: Array<{ id: string; bookingCode: string; expiresAt: Date; departureId: string; guests: number }> = [];

  for (const b of objetivo) {
    // Sin salida no hay fecha con la que calcular: no se toca y se reporta.
    if (!b.departure) {
      sinSalida.push(b.bookingCode);
      continue;
    }
    const nuevo = solicitudExpiresAt(
      b.createdAt,
      b.departure.date,
      b.tour.closeTime,
      b.tour.closeDaysBefore
    );
    // Guarda dura: si el valor calculado NO esta en el pasado, esta reserva
    // seguiria viva y el barrido no la tomaria. Se reporta y no se toca.
    if (nuevo >= ahora) {
      enElFuturo.push(`${b.bookingCode} (${nuevo.toISOString()})`);
      continue;
    }
    if (b.tour.operator.name === AGENCIA_OPERANDO) deAgenciaOperando.push(b.bookingCode);

    plan.push({
      id: b.id,
      bookingCode: b.bookingCode,
      expiresAt: nuevo,
      departureId: b.departure.id,
      guests: b.guests,
    });

    console.log(
      `${b.bookingCode} | ${correoSeguro(b.userEmail).padEnd(22)} | ${b.departure.date} | ${b.tour.title.slice(0, 25).padEnd(25)} | ${b.tour.operator.name.slice(0, 16).padEnd(16)} | ${fecha(nuevo)}`
    );
  }

  // ── 2. Que seatsRequested se libera, por salida ──
  const porSalida = new Map<string, { date: string; tour: string; status: string; actual: number; libera: number; vivas: number }>();
  for (const b of objetivo) {
    if (!b.departure) continue;
    const k = b.departure.id;
    if (!porSalida.has(k)) {
      porSalida.set(k, {
        date: b.departure.date,
        tour: b.tour.title,
        status: b.departure.status,
        actual: b.departure.seatsRequested,
        libera: 0,
        vivas: 0,
      });
    }
    const s = porSalida.get(k)!;
    if (plan.some((p) => p.id === b.id)) s.libera += b.guests;
  }
  // Solicitudes que quedan vivas en esas salidas (las que NO toca este script).
  for (const [depId, s] of porSalida) {
    const vivas = await db.booking.findMany({
      where: { departureId: depId, statusNew: "SOLICITUD", expiresAt: { not: null } },
      select: { guests: true },
    });
    s.vivas = vivas.reduce((n, v) => n + v.guests, 0);
  }

  console.log(`\n=== seatsRequested que se libera, por salida (${porSalida.size} salidas) ===\n`);
  console.log("salida     | tour                      | estado     | actual | libera | queda | esperado");
  console.log("-".repeat(96));
  let totalLibera = 0;
  let descuadre = 0;
  for (const s of [...porSalida.values()].sort((a, b) => a.date.localeCompare(b.date))) {
    const queda = s.actual - s.libera;
    totalLibera += s.libera;
    // Al terminar, seatsRequested tiene que ser igual a los guests de las
    // solicitudes que siguen vivas en esa salida.
    const ok = queda === s.vivas;
    if (!ok) descuadre++;
    console.log(
      `${s.date} | ${s.tour.slice(0, 25).padEnd(25)} | ${s.status.padEnd(10)} | ${String(s.actual).padStart(6)} | ${String(s.libera).padStart(6)} | ${String(queda).padStart(5)} | ${String(s.vivas).padStart(8)}${ok ? "" : "  *** NO CUADRA ***"}`
    );
  }
  console.log(`\ntotal a liberar: ${totalLibera} asientos · salidas con descuadre previsto: ${descuadre}`);

  // ── 3. Chequeos de seguridad ──
  console.log("\n=== Chequeos ===");
  console.log(`  a tocar: ${plan.length} de ${objetivo.length}`);
  if (sinSalida.length) console.log(`  SIN SALIDA (no se tocan): ${sinSalida.join(", ")}`);
  if (enElFuturo.length) console.log(`  CON expiresAt CALCULADO EN EL FUTURO (no se tocan): ${enElFuturo.join(", ")}`);
  if (deAgenciaOperando.length) {
    console.log(`  *** ${deAgenciaOperando.length} son de ${AGENCIA_OPERANDO}, la agencia que opera de verdad: ${deAgenciaOperando.join(", ")}`);
  } else {
    console.log(`  ninguna es de ${AGENCIA_OPERANDO}`);
  }
  const dominios = new Map<string, number>();
  objetivo.forEach((b) => {
    const d = b.userEmail.split("@")[1];
    dominios.set(d, (dominios.get(d) || 0) + 1);
  });
  console.log(`  dominios de los viajeros: ${[...dominios].map(([d, n]) => `${d}:${n}`).join("  ")}`);

  // Que agencias estan involucradas y cuales tienen dueno real (userId de
  // Supabase). Una agencia del seed no tiene a nadie del otro lado; una con
  // dueno si. Es el chequeo que decide si esto toca a alguien de verdad.
  const agencias = new Map<string, { real: boolean; n: number; viajerosExternos: number }>();
  objetivo.forEach((b) => {
    const k = b.tour.operator.name;
    if (!agencias.has(k)) agencias.set(k, { real: !!b.tour.operator.userId, n: 0, viajerosExternos: 0 });
    const a = agencias.get(k)!;
    a.n++;
    if (!b.userEmail.endsWith("@finde.pe")) a.viajerosExternos++;
  });
  console.log("\n  agencia          | solicitudes | con dueno real | viajeros fuera de @finde.pe");
  console.log("  " + "-".repeat(76));
  for (const [nombre, a] of [...agencias].sort((x, y) => y[1].n - x[1].n)) {
    console.log(
      `  ${nombre.slice(0, 16).padEnd(16)} | ${String(a.n).padStart(11)} | ${(a.real ? "SI" : "no (seed)").padEnd(14)} | ${String(a.viajerosExternos).padStart(27)}`
    );
  }

  if (descuadre > 0) {
    console.log("\nABORTA: algun seatsRequested no cuadraria al terminar. Revisar antes de aplicar.");
    await db.$disconnect();
    process.exit(1);
  }

  if (!APPLY) {
    console.log("\nDRY RUN. Nada escrito. Para aplicar: --apply");
    await db.$disconnect();
    return;
  }

  // ── 4. Escribir UNA columna ──
  console.log("\n=== Escribiendo expiresAt ===");
  let escritos = 0;
  for (const p of plan) {
    // Condicional: solo si sigue en SOLICITUD y con expiresAt NULL. Si algo
    // cambio entre el dry run y ahora, esa fila no se toca.
    const r = await db.booking.updateMany({
      where: { id: p.id, statusNew: "SOLICITUD", expiresAt: null },
      data: { expiresAt: p.expiresAt },
    });
    if (r.count === 1) escritos++;
  }
  console.log(`  filas escritas: ${escritos} de ${plan.length}`);

  // ── 5. Disparar el barrido YA PROBADO ──
  //
  // De una sola llamada: desde el 2026-08-15 expireStaleSolicitudes hace las
  // tandas ADENTRO (lib/inventory.ts, EXPIRE_BATCH_SIZE), asi que ya no se
  // pasa del timeout de la transaccion. La primera corrida de este script
  // murio con P2028 justamente ahi, y el arreglo se hizo en el motor y no aca,
  // para que proteja tambien a /api/me y al panel.
  //
  // El alcance NO son los ids de esta corrida sino "toda SOLICITUD con
  // expiresAt vencido". Asi el script es RETOMABLE: si la escritura ya paso y
  // el barrido no, volver a correrlo termina el trabajo.
  console.log(`\n=== Barrido (expireStaleSolicitudes) ===`);
  const vencidas = await expireStaleSolicitudes(db, {
    statusNew: "SOLICITUD",
    expiresAt: { lt: new Date() },
  });
  console.log(`  solicitudes vencidas: ${vencidas}`);

  // ── 6. Verificacion ──
  console.log("\n=== Verificacion ===");
  const quedanNull = await db.booking.count({ where: { statusNew: "SOLICITUD", expiresAt: null } });
  console.log(`  solicitudes con expiresAt NULL: ${quedanNull} (esperado 0)`);

  // Se verifican TODAS las salidas, no solo las de esta corrida: el contador
  // tiene que cuadrar en la base entera, no solo donde tocamos.
  const deps = await db.departure.findMany({
    select: {
      id: true,
      date: true,
      seatsRequested: true,
      bookings: { where: { statusNew: "SOLICITUD" }, select: { guests: true } },
      tour: { select: { title: true } },
    },
    orderBy: { date: "asc" },
  });
  let mal = 0;
  console.log("\n  salida     | tour                      | seatsRequested | deberia");
  console.log("  " + "-".repeat(70));
  for (const d of deps) {
    const deberia = d.bookings.reduce((n, b) => n + b.guests, 0);
    const ok = d.seatsRequested === deberia;
    if (!ok) mal++;
    // Solo se imprimen las que tienen algo que mostrar o las que no cuadran:
    // con la base entera, listar 25 ceros no aporta.
    if (!ok || d.seatsRequested > 0 || deberia > 0) {
      console.log(
        `  ${d.date} | ${d.tour.title.slice(0, 25).padEnd(25)} | ${String(d.seatsRequested).padStart(14)} | ${String(deberia).padStart(7)}${ok ? "" : "  *** NO CUADRA ***"}`
      );
    }
  }
  console.log(`\n  salidas descuadradas: ${mal} (esperado 0)`);

  await db.$disconnect();
}

main();
