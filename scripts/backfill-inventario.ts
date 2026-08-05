// scripts/backfill-inventario.ts
// Backfill de la migración de inventario (docs/migrations/2026-08-05-inventario-salidas.md).
// IDEMPOTENTE: re-ejecutable sin daño (updates condicionales, upserts, sumas absolutas).
// Correr DESPUÉS del db push y del deploy:
//   npx dotenv-cli -e .env.local -- npx tsx scripts/backfill-inventario.ts
//
// Qué hace:
//   1. statusNew = SOLICITUD para toda reserva sin migrar (mapeo aprobado: el
//      comportamiento actual real es "Solicitud recibida"). expiresAt queda null
//      a propósito: legacy sin vencimiento, nada vence retroactivamente.
//   2. Materializa la Departure de CADA (tourId, fecha) con reservas —pasadas
//      incluidas, como registro histórico— y vincula departureId.
//   3. Recalcula seatsRequested en absoluto (suma de guests de solicitudes
//      vinculadas). seatsTaken queda 0: cuenta CONFIRMADAS, y las reservas
//      migradas son SOLICITUD.
//   4. Verificación: cero reservas sin statusNew, cero sin departureId, y el
//      detalle por Departure.
import { db } from "../lib/db.js";

async function main() {
  const migradas = await db.$executeRaw`
    UPDATE "Booking" SET "statusNew" = 'SOLICITUD' WHERE "statusNew" IS NULL`;
  console.log(`1. statusNew backfilleado: ${migradas} reservas`);

  // Convención 13:00Z del proyecto: los primeros 10 chars del ISO son la fecha Lima.
  const pendientes = await db.booking.findMany({
    where: { departureId: null },
    select: {
      id: true,
      tourId: true,
      scheduledAt: true,
      tour: { select: { startTime: true } },
    },
  });
  for (const b of pendientes) {
    const date = b.scheduledAt.toISOString().slice(0, 10);
    const dep = await db.departure.upsert({
      where: { tourId_date: { tourId: b.tourId, date } },
      create: { tourId: b.tourId, date, startTime: b.tour.startTime },
      update: {}, // ya existe: no tocar nada
    });
    await db.booking.update({ where: { id: b.id }, data: { departureId: dep.id } });
  }
  console.log(`2. departures materializadas y vinculadas: ${pendientes.length} reservas`);

  // Suma absoluta (no incremental) → idempotente. Primero a 0 para cubrir
  // departures que hayan quedado sin solicitudes vivas.
  await db.$executeRaw`UPDATE "Departure" SET "seatsRequested" = 0`;
  await db.$executeRaw`
    UPDATE "Departure" d SET "seatsRequested" = agg.total
    FROM (
      SELECT "departureId", SUM("guests")::int AS total
      FROM "Booking"
      WHERE "statusNew" = 'SOLICITUD' AND "departureId" IS NOT NULL
      GROUP BY "departureId"
    ) agg
    WHERE agg."departureId" = d."id"`;
  console.log("3. seatsRequested recalculado");

  const sinStatus = await db.booking.count({ where: { statusNew: null } });
  const sinLink = await db.booking.count({ where: { departureId: null } });
  const deps = await db.$queryRaw<
    { title: string; date: string; reservas: number; seatsRequested: number; seatsTaken: number }[]
  >`
    SELECT t."title", d."date",
           (SELECT count(*)::int FROM "Booking" b WHERE b."departureId" = d."id") AS reservas,
           d."seatsRequested", d."seatsTaken"
    FROM "Departure" d JOIN "Tour" t ON t."id" = d."tourId"
    ORDER BY t."title", d."date"`;
  console.log(`4. VERIFICACIÓN — sin statusNew: ${sinStatus} | sin departureId: ${sinLink}`);
  console.table(deps);
  if (sinStatus > 0 || sinLink > 0) {
    console.error("BACKFILL INCOMPLETO: revisar antes de seguir.");
    process.exitCode = 1;
  }
  await db.$disconnect();
}
main();
