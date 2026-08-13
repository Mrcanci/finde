# Historial de migraciones

Cambios de schema aplicados con **`prisma db push`**, nunca `migrate dev` (drift con las extensiones de Supabase). Cada fila enlaza al documento con el detalle y la razón.

**Al agregar una migración: crear `YYYY-MM-DD-<descripcion>.md` y sumar la fila acá, en el mismo commit.** El procedimiento completo (backup con el `pg_dump` v17, `db push`, `db:generate`) está en `.claude/rules/api-y-schema.md`.

| Fecha | Cambio | Qué hizo |
|---|---|---|
| 2026-05-18 | [campos editoriales + enum `CancellationPolicy`](2026-05-18-add-editorial-fields.md) | Campos editoriales del `Tour` y el enum de política de cancelación. Rama `feature/tours-db-i18n`. |
| 2026-06-01 | [`Operator.userId`, `Operator.ruc`, `Booking.userId`](2026-06-01-operator-booking-userid.md) | Sub-paso 8.1 de M1. Conecta agencias y reservas al usuario real de `auth.users`. FK lógicas, nullable. |
| 2026-06-04 | [`Tour.active`](2026-06-04-tour-active.md) | `Boolean @default(true)`. Permite pausar y reanudar un tour; el catálogo público filtra `active = true`. |
| 2026-06-04 | [`Tour.startTime`](2026-06-04-tour-starttime.md) | `String?` con la hora de salida "HH:MM". null = legacy sin definir. |
| 2026-06-09 | [`Operator.mincetur`](2026-06-09-add-operator-mincetur.md) | `String?` con el registro MINCETUR declarado por la agencia. Se muestra al público solo vía `gateOperatorMincetur`. |
| 2026-06-09 | [backfill de `Tour.startTime`](2026-06-09-backfill-starttime.md) | Solo datos, sin cambio de schema. Puso hora realista en los tours del seed que la tenían en null. |
| 2026-06-09 | [títulos truncados](2026-06-09-fix-truncated-titles.md) | Solo datos. Corrigió 2 títulos cortados a media frase por un error de captura del seed. |
| 2026-06-09 | [reset de ratings fabricados](2026-06-09-reset-ratings.md) | Solo datos. Eliminó los ratings y `reviewsCount` inventados del catálogo. Aplicación directa de la regla "nada falso visible al usuario real". |
| 2026-06-10 | [proteger reservas al borrar un tour](2026-06-10-protect-bookings-on-delete.md) | Cambió el FK `Booking.tour` de `Cascade` a **`Restrict`**. Borrar un tour con reservas ahora falla en la DB; el handler responde 409 e invita a pausar. |
| 2026-06-16 | [columnas quechua del `Tour` (4)](2026-06-16-add-tour-quechua-columns.md) | `titleQu`, `descQu`, `includedQu`, `excludedQu`. |
| 2026-06-16 | [columnas quechua del `Tour` (2)](2026-06-16-add-tour-quechua-meetingpoint-shortpitch.md) | `meetingPointQu`, `shortPitchQu`. |
| 2026-08-05 | [inventario: modos de venta, salidas y estados](2026-08-05-inventario-salidas.md) | La grande. Modelo `Departure`, enums `SalesMode` / `BookingStatus` / `DepartureStatus`, config de venta en `Tour` (`allotment`, `minQuorum`, `closeTime`, `closeDaysBefore`) y `Booking.statusNew` / `departureId` / `expiresAt` / `decidedAt`. Aditiva. |
| 2026-08-12 | [`Booking.userDocument`](2026-08-12-booking-user-document.md) | `String?` con DNI, pasaporte o CE del viajero. Nullable por las reservas previas. Solo se expone a la agencia dueña del tour. |

## Deuda pendiente

- **Fase de limpieza del contrato por adición**: dropear `Booking.status` (String legacy) y renombrar `statusNew` a `status`. No se hizo junto con la migración de inventario porque convertir el tipo in-place con `db push` implicaría dropear la columna. Mientras tanto, toda escritura mantiene los dos campos coherentes vía `LEGACY_STATUS`.
- **`limaDateISO` duplicada**: `api/bookings.ts` tiene una copia local previa al export de `lib/inventory.ts`. Unificar en la misma fase de limpieza.
