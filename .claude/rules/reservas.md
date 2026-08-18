---
paths:
  - '**/bookings.ts'
  - 'api/operators/**'
  - '**/inventory.ts'
  - '**/traveler-emails.ts'
---

# Reservas e inventario

> **Historia de estos `paths`, para que no se vuelvan a romper.** Cubren los mismos
> cuatro archivos de siempre (`api/bookings.ts`, `api/operators/me/[resource].ts`,
> `lib/inventory.ts`, `lib/traveler-emails.ts`), pero escritos como globs.
>
> Dos versiones anteriores fallaron. La primera apuntaba a `api/bookings/**` (no
> existe ese directorio) y a `api/operators/me/departures*` (no existe ese archivo:
> `departures` es un valor de `req.query.resource`). La segunda usaba rutas literales
> más `api/operators/me/[resource].ts`, y **los corchetes son el error**: en glob,
> `[resource]` es una expresión de corchetes que matchea **un solo carácter** del
> conjunto `{r,e,s,o,u,c}`, así que nunca matchea el archivo real.
>
> Regla práctica: **usá siempre comodines y nunca corchetes sin escapar.** Detalle en
> la sección "Reglas con alcance" del `CLAUDE.md`.

## Concurrencia (crítico)

El contador de cupos se actualiza **solo con SQL crudo**, nunca con helpers de Prisma:

- **Materialización de la salida**: `INSERT ... ON CONFLICT ("tourId", "date") DO NOTHING`, en `materializeDeparture` (`lib/inventory.ts`). El `upsert` de Prisma **no es atómico** bajo concurrencia: hace SELECT y después INSERT, y dos requests simultáneos se pisan. Lo cazó la prueba de concurrencia y lo arregló el commit `2f23182`.
- **Toma de cupo**: update condicional atómico contra el cupo efectivo, vía `$executeRaw`, porque la condición compara dos columnas y eso no entra en un `updateMany.where`.

Verificación manual: 10 requests paralelos contra 3 cupos deben dar exactamente 3 confirmadas y 7 rechazadas. **No hay suite de tests en el repo**, así que si tocás esta lógica hay que repetirla a mano. Repetida el 2026-08-15 sobre una salida **CONFIRMADA**, al cambiar la condición de estado: 3 y 7, con `seatsTaken` final 3.

### La condición de estado excluye `CANCELADA`, NO exige `ABIERTA`

Escrito después de que costara un bug de producción. `takeSeats` decía
`AND d."status" = 'ABIERTA'`, y como **nada devuelve una salida a `ABIERTA`**,
confirmar una salida la dejaba sin vender para siempre aunque le sobrara cupo.
El calendario en cambio solo trata como llena la `CANCELADA`, así que seguía
ofreciendo la fecha y el viajero se comía un 409 en el paso 3 que le anunciaba
los cupos que le acababa de negar.

**El estado de la salida no es el instrumento de corte de ventas.** Los
instrumentos son otros dos: el **cupo** (integridad, en esa misma condición) y la
**anticipación** (`closeTime`/`closeDaysBefore` en SOLICITUD,
`MIN_BOOKING_LEAD_DAYS` en CUPO_FIJO). `CONFIRMADA` significa "el tour sale", no
"cerramos la lista", que es exactamente lo que dice el refine de
`api/operators/me/[resource].ts`.

Y no era una decisión de diseño: el camino de SOLICITUD (`addRequestedSeats`)
nunca miró el estado, así que ya aceptaba reservas en salidas confirmadas. Era
una inconsistencia entre los dos caminos de venta. **No vuelvas a poner
`= 'ABIERTA'`.**


## Modos de venta

- **`CUPO_FIJO`**: confirmación instantánea. La reserva nace `CONFIRMADA`. No hay nada que confirmar, así que queda exento de la lógica de cierre y de vencimiento.
- **`SOLICITUD`** (default): la reserva nace `SOLICITUD` y la agencia confirma o rechaza. Es el modo que tiene cierre, vencimiento y correos.

### Cambiar de modo con solicitudes pendientes: 409

`PATCH /api/tours/:id` rechaza el paso a **CUPO_FIJO** si el tour tiene solicitudes **vigentes** (`expiresAt` null o futuro, misma definición que el panel). Motivo concreto y no simetría: una solicitud pendiente retiene `seatsRequested`, y **`takeSeats` no mira ese contador**, solo `seatsTaken`. Esos asientos quedarían invisibles y el tour podría vender su cupo entero encima de gente que ya está esperando respuesta.

**No se bloquea** el paso a SOLICITUD (ese modo no tiene tope por diseño, y los confirmados siguen en `seatsTaken`), ni se bloquea por reservas **CONFIRMADAS** (el cupo ya las descuenta).

El 409 dice qué hacer para desbloquearse, no solo que no se puede, y siempre hay salida: como `expiresAt` topea contra la medianoche del día de salida, una solicitud vigente está por fuerza en una salida **futura**, y ahí el panel sí ofrece confirmar y rechazar.

## Vencimiento

```
expiresAt = min( cierre de la salida,
                 creación + 72h,
                 medianoche Lima del día de salida )
```

Los tres topes, y ninguno es opcional:

1. **Cierre de la salida**: `departureCloseAt(date, closeTime, closeDaysBefore)`. Es `(fecha de salida - closeDaysBefore días)` a las `closeTime`, hora Lima.
   - `closeTime` null usa `DEFAULT_CLOSE_TIME = "20:00"`.
   - **`closeDaysBefore` null usa `DEFAULT_CLOSE_DAYS_BEFORE = 1`, o sea la víspera, pero el campo es configurable por tour.** No asumas que el cierre es siempre la víspera: una agencia puede pedir 3 días de anticipación. La versión anterior de esta regla decía "closeTime de la víspera" y eso desinforma sobre un campo que la agencia controla.
2. **Creación + 72h** (`H72_MS`).
3. **Medianoche Lima del día de salida** (`departureEveMidnight`). Ojo con el nombre: pese a "Eve", son las `00:00` del **propio día de salida**, no del día anterior. Es la red de seguridad dura: sin ella, una solicitud creada después del cierre caía solo en las 72h y seguía viva después de que el tour ya salió.

Lima es UTC-5 sin horario de verano, así que las conversiones son `hora Lima + 5 = hora UTC`, hechas con `Date.UTC` para que normalice los desbordes de día. Las fechas de salida son `String` `"YYYY-MM-DD"` en fecha Lima, no `Date`.

**Vencimiento perezoso**: no hay cron en Vercel Hobby. `expireStaleSolicitudes` corre **antes de cada lectura** de reservas (en `api/me.ts` completo y en el panel), transiciona a `VENCIDA` toda solicitud con `expiresAt` en el pasado y libera su `seatsRequested`. El índice `@@index([statusNew, expiresAt])` existe para ese barrido.

**El barrido va POR TANDAS, y el tamaño no se toca a ojo.** `EXPIRE_BATCH_SIZE = 5`, cada tanda en su propia transacción. El techo de una transacción son **23 viajes** y está medido: ver "Transacciones: hay un techo de ~20 operaciones secuenciales" en `.claude/rules/api-y-schema.md`. El barrido hace **2 viajes por fila**, así que el máximo real son **11 filas**: con 12 se pasa y muere con `P2028`. Pasó de verdad, con las 19 del backfill.

Antes esto era una sola transacción para todo, y como el barrido corre **antes de leer** y en el panel es **bloqueante**, una agencia con una docena de vencidas se quedaba sin poder abrirlo. Si subís el tamaño de tanda, volvés a acercarte al techo: 11 es el máximo absoluto medido, no un objetivo.

Que una tanda falle y las anteriores queden aplicadas es **correcto**: la transición de cada fila es condicional a que siga en `SOLICITUD`, así que nada se vence ni se libera dos veces y la próxima corrida toma solo lo que quedó. Verificado con 25 filas.

**Y el barrido nunca toma las que tienen `expiresAt = NULL`**, porque el filtro es `expiresAt: { lt: now }`. Eso dejó 19 solicitudes imposibles de vencer hasta el backfill del 2026-08-15 (`scripts/backfill-expiresat-solicitudes.ts`). Si alguna vez se vuelve a poblar esa columna con NULL en reservas vivas, vuelven a ser inmortales.

## Cierre en las dos puntas

La hora de cierre cierra los dos extremos:

- **Backend**: `createBookingWithInventory` rechaza con **409** las solicitudes posteriores al cierre.
- **Frontend**: el calendario del viajero deja de ofrecer la fecha.

Consecuencia buscada: el cierre nunca está en el pasado al crear, así que **ninguna solicitud nace vencida**.

## Panel de salidas

La agencia confirma o rechaza **en lote** (toda la salida) o **puntualmente** (una sola solicitud, `f499fda`). Dos pasos de confirmación en la UI, y una sola decisión abierta a la vez (`60d8b8f`), porque la acción manda correos a los viajeros y **no se puede deshacer**.

## Los mensajes le hablan a la agencia en el vocabulario de la INTERFAZ

**Nunca en nombres del enum.** Los mensajes del motor decían "cupo fijo", "modo
solicitud" y "panel de salidas", y **ninguno de los tres existe en la pantalla**.

| En el código | En la interfaz |
|---|---|
| `CUPO_FIJO` | **Confirmación automática** |
| `SOLICITUD` | **Confirmación manual** |
| el panel de salidas | **Reservas**, que es el nombre de la pestaña |
| `allotment` | **Cupos por salida**, que es la etiqueta del campo |

**Si un mensaje nuevo nombra un `salesMode` o una sección, se verifica contra el
código de la UI y no contra lo que suena bien.** Dos de los tres casos que se
corrigieron el 2026-08-15 eran preexistentes: nadie los había leído desde el lado
de la agencia.

## Estados

`BookingStatus`: `SOLICITUD | CONFIRMADA | RECHAZADA | VENCIDA | CANCELADA`

`DepartureStatus`: `ABIERTA | CONFIRMADA | CANCELADA`. "Llena" no es un estado, es derivado de `seatsTaken >= cupo efectivo`.

### Contrato por adición

`Booking.status` (String legacy) y `Booking.statusNew` (enum) **conviven**. Toda escritura nueva mantiene los dos coherentes vía el mapa `LEGACY_STATUS` de `lib/inventory.ts`:

| `statusNew` | `status` legacy |
|---|---|
| `SOLICITUD` | `pending_payment` |
| `CONFIRMADA` | `confirmed` |
| `VENCIDA` | `cancelled` |
| `RECHAZADA` | `cancelled` |
| `CANCELADA` | `cancelled` |

En las respuestas de la API el nombre canónico es **`bookingState`**, no `statusNew`. Ver `.claude/rules/api-y-schema.md`.

## Correos (`lib/traveler-emails.ts` y `sendOperatorBookingEmail`)

Lo que hay que saber antes de tocar cualquier cosa que dispare un correo:

- **Nunca lanzan.** Todos los caminos de error se loguean y retornan. Están pensados para correr vía `waitUntil`, fuera del camino crítico de la respuesta. Un fallo de Resend no rompe la reserva ni la decisión de la salida.
- **Timeout duro de 5s** por envío, con `AbortController`. Se usa `fetch` nativo contra `https://api.resend.com/emails`, sin SDK.
- **Un correo por persona, no por reserva.** `sendDepartureDecisionEmails` agrupa por email (case-insensitive): un viajero con tres reservas en la misma salida recibe **un** mensaje listando sus tres códigos.
- Remitente: `Finde <reservas@finde.pe>`. Envíos en paralelo con `Promise.allSettled`.
- El texto de rechazo es neutro a propósito: no culpa a la agencia.
- Si falta `RESEND_API_KEY`, loguea `"[email] RESEND_API_KEY ausente, skip"` y **sigue sin lanzar**: la reserva se crea igual y nadie recibe nada.

### Entorno: el envío desde dev es intencional

**`RESEND_API_KEY` está cargada en los tres entornos de Vercel (Development, Preview y Production), y dev.finde.pe corre contra la base de PRODUCCIÓN. Es a propósito.**

El flujo de reservas y salidas termina en un correo, así que sin envío real desde dev no hay forma de probarlo de punta a punta. **Apagar Resend en dev, o meter un guard por `NODE_ENV`, rompería las pruebas.** No lo hagas y no lo propongas como mejora.

La contrapartida es que el código no distingue destinatario:

- Confirmar o rechazar una salida desde dev.finde.pe **manda correos reales a los viajeros reales de esa salida**.
- Crear una reserva sobre el tour de una agencia real **le manda un correo real a esa agencia**.
- No hay forma de deshacerlo.

La contención no es apagar el envío, es controlar sobre quién cae: **QA solo con `demo@finde.pe` y sobre tours de cuentas `@finde.pe`.** Nunca sobre agencias reales.

## Identidad

`operatorId` y la identidad del usuario salen **siempre del token**, nunca del body. Endpoints de escritura protegidos con `requireOperator` más verificación de propiedad (`tour.operatorId === operator.id`).
