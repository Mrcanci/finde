# 2026-08-05 — Inventario: modos de venta, salidas y estados de reserva

Migración aditiva del diseño de inventario/reservas (aprobado 2026-08-05).
Aplicada con `prisma db push` (nunca `migrate dev`, por drift con extensiones
Supabase). Backup previo: `~/Documents/backup-pre-inventario-20260805.dump`
(pg_dump 17, custom format, verificado con `pg_restore --list`).

## Qué agrega

- **Enums**: `SalesMode` (CUPO_FIJO | SOLICITUD), `BookingStatus` (SOLICITUD |
  CONFIRMADA | RECHAZADA | VENCIDA | CANCELADA), `DepartureStatus` (ABIERTA |
  CONFIRMADA | CANCELADA — "llena" es derivado: `seatsTaken >= cupo efectivo`).
- **Tour**: `salesMode` (default SOLICITUD = comportamiento actual), `allotment`,
  `minQuorum` (informa, no ejecuta), `closeTime`/`closeDaysBefore` (cierre de
  confirmación; defaults de producto "20:00" y 1 se resuelven en código).
- **Departure**: salida materializada PEREZOSAMENTE (la fila nace con el primer
  evento real sobre una fecha). `UNIQUE(tourId, date)` es la clave del upsert
  anti-carrera. `startTime` se COPIA al materializar (pin). Cupo efectivo =
  `allotmentOverride ?? tour.allotment`. Contadores denormalizados `seatsTaken`
  (confirmados; solo muta vía update condicional atómico) y `seatsRequested`
  (solicitudes pendientes, progreso de quórum).
- **Booking**: `statusNew` (transicional, ver abajo), `departureId`, `expiresAt`
  (min(creación+72h, cierre de la salida); null = legacy sin vencimiento),
  `decidedAt`. Índices `[departureId]` y `[statusNew, expiresAt]`.

Todo nullable o con default: el código pre-migración convive con el schema
nuevo sin enterarse.

## Reserva atómica (CUPO_FIJO), patrón para la fase de endpoints

```sql
-- 1. Materializar si no existe (idempotente, anti-carrera por el unique)
INSERT INTO "Departure" ("id","tourId","date","startTime")
VALUES ($cuid,$tourId,$date,$tourStartTime) ON CONFLICT ("tourId","date") DO NOTHING;
-- 2. Tomar cupo: condicional atómico contra el cupo EFECTIVO (rowCount = verificación)
UPDATE "Departure" d SET "seatsTaken" = d."seatsTaken" + $guests
FROM "Tour" t
WHERE d."tourId" = t."id" AND d."tourId" = $tourId AND d."date" = $date
  AND d."status" = 'ABIERTA'
  AND d."seatsTaken" + $guests <= COALESCE(d."allotmentOverride", t."allotment");
```

(Prisma no compara columnas en `updateMany.where` → esto es `$executeRaw`.)

## Vencimiento perezoso (sin cron en Vercel Hobby)

`expiresAt` se persiste al crear la solicitud. El estado efectivo se calcula al
LEER (`SOLICITUD` con `expiresAt < now()` se muestra VENCIDA siempre) y se
persiste al TOCAR la fila. La confirmación en lote usa
`WHERE status='SOLICITUD' AND "expiresAt" >= now()` para no confirmar vencidas
por carrera. **Upgrade futuro**: `pg_cron` de Supabase para barrer y DISPARAR
AVISOS automáticos (email al vencer, recordatorio pre-cierre); no cambia el
schema, solo agrega el job.

## Backfill (scripts/backfill-inventario.ts, idempotente)

Mapeo aprobado: las reservas existentes (todas `pending_payment`) →
`statusNew = SOLICITUD` con `expiresAt = null` (sin vencimiento retroactivo);
TODAS (pasadas incluidas) reciben su `Departure` y `departureId`;
`seatsRequested` = suma de guests por salida; `seatsTaken` queda 0 (cuenta
confirmadas). Tours existentes: `salesMode = SOLICITUD` (default del schema),
nada cambia de comportamiento.

## Pendiente (fases siguientes, coordinadas)

1. **Endpoints**: reserva con materialización + cupo atómico, confirmación en
   lote de la agencia, vencimiento al tocar, endpoint de disponibilidad como
   fuente única del calendario (hoy el frontend duplica la regla). Hasta esa
   fase, el POST /api/bookings actual sigue escribiendo el flujo viejo
   (statusNew null, sin departure): el backfill es re-ejecutable para recoger
   esas reservas en el cutover.
2. **Limpieza de Booking.status**: `DROP COLUMN "status"` (String) + `RENAME
   COLUMN "statusNew" TO "status"` (SQL directo, metadata-only) + schema con el
   nombre final + db push no-op. Recién entonces la reversión deja de ser
   "redeploy" y pasa a ser "restaurar backup"; por eso va separada y con su
   propio backup.
