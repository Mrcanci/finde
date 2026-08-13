---
paths:
  - 'api/**'
  - 'lib/**'
  - 'prisma/*.prisma'
  - '**/vercel.json'
---

# API y schema

## Antes de cambiar el schema

1. Backup con `/opt/homebrew/opt/postgresql@17/bin/pg_dump`. **El `pg_dump` del PATH es la v16** (verificado: 16.13) y contra un server Postgres 17 produce archivos de 0 bytes sin avisar. Los backups van a `/backups/`.
2. `prisma db push`, nunca `migrate dev` (drift con las extensiones de Supabase).
3. Documentar en `docs/migrations/YYYY-MM-DD-<descripcion>.md` con la razón del cambio, y agregar la fila en `docs/migrations/README.md`.

```bash
npx dotenv-cli -e .env.local -- npx prisma db push
npm run db:generate
```

## Conexiones y variables de entorno

- `DATABASE_URL`: puerto 6543, con parámetros pgbouncer. La usa el cliente Prisma en runtime.
- `DIRECT_URL`: puerto 5432, sin parámetros. La usa `db push`.

| Variable | Para qué | Dónde vive |
|---|---|---|
| `DATABASE_URL` | Prisma en runtime (pooled) | Vercel: Dev, Preview, Prod |
| `DIRECT_URL` | `prisma db push` | Vercel: Dev, Preview, Prod |
| `ANTHROPIC_API_KEY` | Claude (búsqueda + generación) | Vercel: Dev, Preview, Prod |
| `VOYAGE_API_KEY` | Embeddings 1024-dim | Vercel: Dev, Preview, Prod |
| `SEARCH_PHASE_SECRET` | HMAC entre fase 1 y fase 2 de búsqueda | Vercel: Dev, Preview, Prod |
| `RESEND_API_KEY` | Correos transaccionales | Vercel: Dev, Preview, Prod |
| `VITE_SUPABASE_URL` | Cliente del navegador **y** admin del backend | Vercel: Preview, Prod. En local sale de `.env.local` |
| `VITE_SUPABASE_ANON_KEY` | Cliente del navegador | Vercel: Preview, Prod. En local sale de `.env.local` |
| `SUPABASE_SERVICE_ROLE_KEY` | Solo backend (`lib/supabase-admin.ts`): valida tokens y firma uploads. **Nunca al cliente** | Vercel: Preview, Prod. En local sale de `.env.local` |

Las cuatro primeras vienen del entorno **Development de Vercel** y **pisan** lo que haya en `.env.local` al correr `vercel dev`. Las tres de Supabase no están en Development, así que esas sí salen de `.env.local` vía `dotenv-cli`. Por eso el wrapper sigue siendo necesario:

```bash
npx dotenv-cli -e .env.local -- vercel dev
```

El backend lee `VITE_SUPABASE_URL` con prefijo `VITE_`. Es intencional hoy; revisar al normalizar para producción.

## Almacenamiento de imágenes (Supabase Storage)

Bucket **`tour-images`**: lectura pública, límite 5MB, MIME `image/jpeg` y `image/png`, **sin INSERT público**.

Flujo: `POST /api/uploads/tour-image` (tras `requireOperator`) emite una **signed upload URL** y el navegador sube el archivo **directo** a Storage. El archivo nunca pasa por la función, así que esquiva el límite de request de Vercel. Ruta `{operatorId}/{uuid}.{ext}`; la `publicUrl` resultante se guarda en `Tour.imageUrl`.

## Límite de plataforma (crítico)

**Vercel Hobby permite 12 funciones serverless. `/api/` tiene hoy exactamente 12 archivos.** No se puede agregar uno sin sacar otro. Antes de crear un endpoint, consolidar en una ruta dinámica existente.

Las 12:

```
api/ai/generate-description.ts   api/geo.ts        api/search.ts
api/ai/generate-quechua.ts       api/me.ts         api/search-reasoning.ts
api/bookings.ts                  api/operators.ts  api/tours/index.ts
api/operators/me/[resource].ts   api/tours/[id].ts api/uploads/tour-image.ts
```

### `api/operators/me/[resource].ts`, el endpoint consolidado

Es la consolidación que impone ese límite, y el archivo más denso del backend. Un solo archivo resuelve tres recursos vía `req.query.resource`:

| Método | resource | Qué hace |
|---|---|---|
| `GET` | `tours` | Tours de la agencia para el dashboard. **NO filtra `active`**: muestra activos y pausados. |
| `GET` | `bookings` | Reservas recibidas, con los datos del pasajero. Reemplazó al mock `OP_BK`. |
| `GET` | `departures` | Salidas agrupadas, con contadores por estado. `?scope=all` incluye las pasadas. |
| `POST` | `departures` | Confirmar o rechazar. **La acción va en el body** (`{ departureId, action }`, o `bookingId` para rechazo puntual) porque `[resource]` ya se comió el segmento de ruta. |

Todo pasa por `requireOperator`. Antes de escribir sobre un tour o una salida hay que verificar propiedad (`tour.operatorId === operator.id`).

## Endpoints: convenciones

- Uno por archivo. Siempre manejar 405 con `res.setHeader("Allow", ...)`.
- **Imports con extensión `.js`** (Node ESM). Sin la extensión la función falla en runtime, no en build.
- Validar el body con `zod` antes de tocar la DB.
- Usar los singletons de `/lib/`: `db`, `anthropic`, `voyage`. Nunca instanciarlos ad-hoc.
- Autenticados con `requireAuth`; de agencia con `requireOperator` (`lib/auth.ts`). **La identidad (`userId`, email, `operatorId`) sale siempre del token, nunca del body.** `requireOperator` lanza `AuthRequiredError` en 401 y 403 para que el `catch { return }` del handler funcione igual en los dos casos.
- Tours pausados (`active: false`): invisibles en catálogo, búsqueda, detalle y booking. Visibles solo para su dueño en el dashboard.
- Los GET públicos (`/api/tours`, `/api/tours/[id]`) filtran `active: true`. Un tour pausado responde 404 en el detalle.
- `DELETE /api/tours/[id]` **responde 409 si el tour tiene reservas** e invita a pausar. El FK `Booking.tourId` es `onDelete: Restrict`: es la red de seguridad a nivel DB para que borrar un tour nunca evapore reservas en silencio. Si el borrado procede, también limpia la foto del bucket `tour-images` (las URLs externas del seed se dejan intactas; un fallo de Storage no rompe el borrado).

## `gateOperatorMincetur`

`lib/tour-select.ts:126`. Regla de compliance, no de presentación:

- El número de MINCETUR de la agencia se expone al público **solo si `Operator.verified` es true**. Si no, se fuerza a `null` antes de responder.
- En el dashboard de la agencia se muestra siempre, sin importar `verified`: es su propio dato.

Aplicarlo en todo endpoint público que hidrate `operator.mincetur`.

## Modelo de datos

Fuente de verdad: `prisma/schema.prisma`, que está comentado en detalle. Lo que hay que saber antes de tocarlo:

### Enums

- `Category`: `adventure | cultural | gastronomy | nature | mystic`
- `CancellationPolicy`: `Flexible | Moderada | Estricta | NoReembolsable`
- `SalesMode`: `CUPO_FIJO | SOLICITUD`
- `BookingStatus`: `SOLICITUD | CONFIRMADA | RECHAZADA | VENCIDA | CANCELADA`
- `DepartureStatus`: `ABIERTA | CONFIRMADA | CANCELADA`. **"Llena" no es un estado**: es derivado (`seatsTaken >= cupo efectivo`), justamente para no tener nada extra que sincronizar.
- Idiomas (`Tour.language`): `es | en | qu`.

### `SalesMode` y la config de venta en `Tour`

`SalesMode` decide todo el comportamiento de la reserva:

- **`CUPO_FIJO`**: allotment exclusivo de Finde, confirmación instantánea, cierra al llenarse.
- **`SOLICITUD`** (default, porque es el comportamiento histórico): sin límite de asientos; las reservas nacen como solicitudes y la agencia confirma en lote antes del cierre.

Campos de config en `Tour`:

| Campo | Significado |
|---|---|
| `salesMode` | `SOLICITUD` por default |
| `allotment` | Asientos exclusivos Finde por salida. Solo `CUPO_FIJO`; null en `SOLICITUD` |
| `minQuorum` | "Mínimo N personas para salir". **Informa progreso, no ejecuta nada** |
| `closeTime` | "HH:MM" hora Lima. null = default de producto "20:00" |
| `closeDaysBefore` | Días antes de la salida. **null = default 1 (víspera), pero es configurable** |

`days`, `startTime`, `excludedDates` y `addedDates` siguen siendo la regla de recurrencia. Las salidas concretas se materializan aparte, en `Departure`.

### `Departure`

Salida **materializada perezosamente**: la fila existe solo cuando hubo un evento real sobre esa fecha (una reserva, una edición, una confirmación). La disponibilidad general se calcula al vuelo desde la recurrencia del `Tour`.

- `@@unique([tourId, date])` es la clave del upsert anti-carrera.
- `startTime` se **copia** del tour al materializar (pin): editar el tour no mueve salidas ya vendidas.
- `allotmentOverride`: cupo efectivo = `allotmentOverride ?? tour.allotment`.
- `seatsTaken` (confirmados) y `seatsRequested` (en solicitud pendiente) son contadores separados. Solo mutan por update condicional atómico.
- `date` es un `String` `"YYYY-MM-DD"` en fecha Lima, misma convención que `excludedDates`.

Detalle del motor en `.claude/rules/reservas.md`.

### Contrato por adición: `status` y `statusNew`

Patrón que se repite y que se malinterpreta fácil. **No es un bug ni un descuido.**

- `Booking.status` es el `String` legacy (`"pending_payment"`, `"confirmed"`, `"cancelled"`). Sigue vivo.
- `Booking.statusNew` es el enum nuevo `BookingStatus`. Convive con el anterior.
- Es **transicional**: la limpieza (DROP del viejo + RENAME de `statusNew` a `status`) queda para después, porque convertir el tipo in-place con `db push` implicaría dropear la columna.
- **En las respuestas de la API el nombre canónico es `bookingState`**, no `statusNew`. `api/me.ts` mapea `({ statusNew, ...b }) => ({ ...b, bookingState: statusNew })`. El campo crudo no se expone.
- `expiresAt: null` significa legacy sin vencimiento (las reservas previas a la migración no vencen retroactivamente) **o** reserva ya decidida. Las dos cosas.

Al agregar un campo de este tipo: agregar, no reemplazar; mapear el nombre público en el handler; documentar la fase de limpieza.

### Otros campos que sorprenden

- `Tour.priceSoles` y `Booking.totalSoles` están en **céntimos** (8500 = S/85.00).
- `Tour.imageUrl` es la portada; `Tour.images[]` es la galería multi-foto.
- Columnas quechua espejadas: `titleQu`, `descQu`, `shortPitchQu`, `meetingPointQu`, `includedQu[]`, `excludedQu[]`. null o array vacío = sin traducir.
- `Operator.userId` y `Booking.userId` son FK **lógicas** a `auth.users` de Supabase. Prisma no las maneja. Nullable a propósito: las agencias del seed no tienen dueño.
- `Booking.userDocument` (DNI, pasaporte o CE) se llama así y no `userDocId` para no confundirlo con `userId`. Solo se expone a la agencia dueña del tour.
- `Tour.embedding` es `Unsupported("vector(1024)")`: no se puede leer ni escribir por el cliente Prisma normal, va por `$queryRaw` / `$executeRaw`.

## IA

- **Claude**: modelo `claude-sonnet-4-6`. **Fuente de verdad: `lib/anthropic.ts`** (export `MODEL`). No hardcodear el id en otro lado.
- **Embeddings**: Voyage AI, vectores de **1024 dimensiones**, vía `lib/voyage.ts` (`MODEL_EMBED`, `DIM`). El schema tiene `vector(1024)`: cambiar de modelo implica migración y re-embed de los 49 tours.
- Embedding **on-write**: al crear o editar un tour, `embedTourSafe` (`lib/tour-input.ts`) regenera el vector. Si falla, no rompe el guardado.

### Búsqueda en dos fases

1. **Fase 1** (`api/search.ts`): Voyage + pgvector eligen los candidatos y devuelven ids validados, ya firmados. Cache en `FeaturedSearch` para queries normalizadas (`lib/search-cache.ts`). Filtra `active: true` en sus tres queries.
2. **Fase 2** (`api/search-reasoning.ts`): genera el reasoning **sobre los ids ya elegidos**, con los datos firmados de la fase 1. La firma es HMAC con `SEARCH_PHASE_SECRET` (`lib/search-sig.ts`), para que la fase 2 no pueda ser inducida a razonar sobre tours que la fase 1 no eligió.

**Regla anti-invención** (`api/search-reasoning.ts:65`, literal en el prompt): "Usa solo datos que estén en la información de los tours. No afirmes distancias, tiempos de viaje, cercanías entre ciudades ni características que no figuren ahí." También tiene prohibida la raya (`—`) en la línea 63. Si tocás ese prompt, las dos reglas se quedan.

## Configuración de despliegue: `vercel.json`

```json
"rewrites": [
  { "source": "/demo/:path*", "destination": "/" },
  { "source": "/app/:path*", "destination": "/" }
]
```

El frontend es una SPA **sin router library**. Esos rewrites hacen que cualquier URL bajo `/demo/*` y `/app/*` sirva el `index.html` de la raíz, y de ahí el switch de vistas de `AppDemo.jsx` decide qué renderizar. Consecuencias:

- **Agregar una ruta de página no se hace acá.** Se hace en el switch de `src/AppDemo.jsx` (ver `.claude/rules/frontend.md`).
- Si algún día se agrega un prefijo de URL nuevo, hay que sumar el rewrite o va a dar 404 en producción y funcionar en `npm run dev`.
- `framework: null` y `buildCommand: "vite build"`: Vercel no autodetecta nada. Cambiar el build se hace en este archivo.
