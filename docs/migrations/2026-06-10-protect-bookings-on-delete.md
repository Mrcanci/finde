# 2026-06-10 — Proteger reservas al borrar un tour

## Problema

`DELETE /api/tours/[id]` hacía `db.tour.delete()` con el FK
`Booking.tour onDelete: Cascade`, así que borrar un tour **evaporaba todas sus
reservas en silencio** — sin contar, sin avisar, sin bloquear. Riesgo real: la
operadora con cuenta reclamada (María Quispe) tenía 7 reservas futuras; pulsar
"Borrar" las habría destruido sin rastro.

## Qué hace este cambio

Borrar un tour que tiene **cualquier** reserva (futura o pasada) ahora se
**rechaza**. El operador debe **pausar** el tour (`active:false`) en su lugar,
que lo oculta del catálogo/búsqueda/detalle/booking **conservando** el tour y
sus reservas. Borrar un tour **sin** reservas sigue igual (tour + foto de
Storage).

Defensa en profundidad en dos capas:

1. **Handler** (`api/tours/[id].ts`, `DELETE`): antes de borrar, cuenta
   reservas; si hay ≥ 1 responde **409** con
   `{ error, bookingsCount }` y el mensaje
   *"Este tour tiene N reserva(s). Púsalo en pausa en lugar de borrarlo."*.
   Además, el `db.tour.delete()` queda envuelto en `try/catch`: si una reserva
   entra entre el conteo y el borrado, el FK `Restrict` lanza `P2003` y se
   traduce al **mismo 409 limpio** (no un 500).
2. **Schema** (`prisma/schema.prisma`): `Booking.tour` pasa de
   `onDelete: Cascade` a **`onDelete: Restrict`** — la DB rechaza borrar un tour
   con reservas aunque el borrado llegue por otra vía (script, otro endpoint).

**Frontend** (`src/AppDemo.jsx`, "Mis Tours"):

- `handleDeleteTour`: maneja el **409** explícitamente — **no** quita el tour de
  la lista y surfacea el mensaje del backend en el diálogo (invita a pausar).
- Diálogo de confirmación: copy nuevo avisando que un tour con reservas no se
  podrá borrar y que conviene pausarlo (sin fetch de conteo).

## Alcance / lo que NO se toca

- **`Tour.operator onDelete: Cascade` se deja como está.** No hay endpoint para
  borrar operadores hoy, así que no hay vía de evaporar tours/reservas por ahí.
  Anotado para revisar si alguna vez se agrega ese endpoint (borrar operador
  cascadearía tours → que con `Restrict` ahora fallarían si tuvieran reservas).
- Sin cambio de estados de `Booking` ni de la lógica de "pausar" (ya existía).

## Comando (lo aplica el responsable, NO incluido en este cambio)

El cambio de schema (`onDelete`) requiere empujar el constraint a la DB. Usar
`prisma db push` (NO `migrate dev`, por drift con extensiones Supabase):

```bash
npx dotenv-cli -e .env.local -- npx prisma db push
```

`db push` recrea el foreign key `Booking_tourId_fkey` con `ON DELETE RESTRICT`.
No migra datos ni toca filas; solo cambia la regla del constraint. El handler
ya funciona aun antes del push (el chequeo de conteo es a nivel de aplicación);
el push solo activa la red de seguridad a nivel DB.

## Reversibilidad

- **Código** (handler + frontend + doc): revertible con `git revert` del commit.
- **Schema**: volver el FK a `onDelete: Cascade` en `schema.prisma` y re-correr
  `prisma db push` restaura el comportamiento anterior. No hay pérdida de datos
  en ninguna dirección (el cambio solo endurece/afloja la regla de borrado, no
  modifica reservas existentes).
