# 2026-08-12 — `Booking.userDocument`

## Cambio

Se agregó 1 columna al modelo **`Booking`**, aplicada vía `prisma db push` (no `migrate dev`, por drift con extensiones Supabase).

```prisma
model Booking {
  ...
  userPhone    String?
  userDocument String?   // DNI, pasaporte o CE del viajero
  ...
}
```

Verificado en `information_schema` después del push:

```
userDocument | text | is_nullable = YES | default = ninguno
```

Cambio **no-destructivo**: las 35 filas existentes quedaron en `null`. `db push` corrió sin warnings de data loss.

## Razón

El formulario de reserva del viajero pedía "DNI, Pasaporte o CE" como campo **obligatorio** desde el commit `30d1222` (2026-04-24), lo validaba (`docIdValid`, mínimo 6 caracteres) y **lo descartaba**: el `docId` nunca entraba en el body del `POST /api/bookings` y no existía columna donde guardarlo.

Pedir un documento de identidad y tirarlo es un problema bajo la **Ley 29733 de protección de datos personales**: se declara implícitamente una finalidad que no existe. La decisión de producto fue guardarlo y usarlo (la agencia lo necesita para el registro de pasajeros), no dejar de pedirlo.

Lo único bueno del estado anterior es que el dato nunca salió del navegador: no hubo nada almacenado que purgar ni brecha que notificar.

## Por qué nullable (y por qué importa acá)

**Dev y producción comparten la MISMA base de Supabase.** Una columna nullable sin default hace que `ALTER TABLE ADD COLUMN` sea no-bloqueante y compatible hacia atrás: el código ya desplegado hace `INSERT` sin mencionarla y Postgres pone `null`. No hay ventana de ruptura, así que el push y el deploy del código pueden ir en cualquier orden.

Por la misma razón el campo es **opcional en el schema zod** de `POST /api/bookings` aunque el formulario lo exija: si durante el rollout un navegador con el bundle viejo en caché manda el POST sin el campo, la reserva se crea igual en vez de fallar con 400.

## Nombre

`userDocument`, no `userDocId`: ya existe `userId` en el modelo con otro significado (el id de `auth.users` de Supabase), y `userDocId` se presta a confusión al leer el schema.

## Exposición

Todos los `select` de `Booking` en el repo son **explícitos** (`select: {...}`, nunca `include` suelto), así que agregar la columna no la expone en ningún endpoint hasta agregarla a un select a mano.

Se agregó SOLO a las dos lecturas del operador dueño del tour, en `api/operators/me/[resource].ts`:

- `GET /api/operators/me/bookings`
- `GET /api/operators/me/departures`

**NO** se agregó a los selects públicos ni a `GET /api/me`. Un documento de identidad no debe viajar en el catálogo ni en ninguna respuesta que no sea para la agencia que opera esa reserva.

## Convención de "sin documento"

`null` = la reserva es anterior a este cambio (o llegó de un cliente viejo). El detalle del panel **omite la fila entera** en ese caso, no muestra un campo vacío.
