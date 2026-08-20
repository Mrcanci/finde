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
| `SUPABASE_URL` | **La que lee el backend** (`lib/supabase-admin.ts`) | Vercel: Preview, Prod. En local sale de `.env.local` |
| `VITE_SUPABASE_URL` | Cliente del navegador, y **respaldo** del backend si falta la de arriba | Vercel: Preview, Prod. En local sale de `.env.local` |
| `VITE_SUPABASE_ANON_KEY` | Cliente del navegador | Vercel: Preview, Prod. En local sale de `.env.local` |
| `SUPABASE_SERVICE_ROLE_KEY` | Solo backend (`lib/supabase-admin.ts`): valida tokens y firma uploads. **Nunca al cliente** | Vercel: Preview, Prod. En local sale de `.env.local` |

Las cuatro primeras vienen del entorno **Development de Vercel** y **pisan** lo que haya en `.env.local` al correr `vercel dev`. Las de Supabase no están en Development, así que esas sí salen de `.env.local` vía `dotenv-cli`. Por eso el wrapper sigue siendo necesario:

```bash
npx dotenv-cli -e .env.local -- vercel dev
```

**La normalización del prefijo `VITE_` en el backend ya está hecha.** `lib/supabase-admin.ts` resuelve `process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL`, o sea que **prefiere la variable sin prefijo** y solo cae a la del cliente como respaldo. Las dos están cargadas en Preview y Production. *(Hasta el 2026-08-17 esta sección decía "el backend lee `VITE_SUPABASE_URL`... revisar al normalizar para producción", y eso mandaba a hacer un trabajo ya hecho.)*

**Lo que sí sigue valiendo: una variable con prefijo `VITE_` la ve el navegador.** Vite inyecta en el bundle todo lo que empiece así. Por eso `SUPABASE_SERVICE_ROLE_KEY` **no lleva prefijo y nunca puede llevarlo**, y por eso al agregar una variable nueva de backend la pregunta es si alguna vez tiene que llegar al cliente. Si la respuesta es no, va sin `VITE_`.

## Transacciones: hay un techo de ~20 operaciones secuenciales

**Medido el 2026-08-15 contra el pooler, no estimado: en UNA `$transaction`
interactiva entran 23 viajes de ida y vuelta antes de que Prisma la corte con
`P2028`.** El default de Prisma son 5 segundos y cada viaje cuesta unos 220ms.

**El número es idéntico para `SELECT` y para `UPDATE`, y eso es lo que hay que
recordar: el costo es la LATENCIA, no el trabajo.** No importa qué tan barata sea
la consulta. Cualquier `$transaction` con más de ~20 operaciones secuenciales va
a fallar, haga lo que haga.

Consecuencia práctica al escribir código: **un `for` con un `await` adentro de
una transacción es un contador de viajes.** Si el largo del bucle lo decide un
dato (cuántas filas hay que tocar), el código funciona con pocos datos y falla
con muchos, en producción y no en la prueba. Pasó de verdad con el barrido de
solicitudes vencidas: 19 filas por 2 viajes cada una son 38 viajes, y murió.

Salidas, en orden de preferencia:

1. **Una sola sentencia que toque N filas** en vez de N sentencias. Un `UPDATE`
   con `WHERE id IN (...)` es un viaje, no N.
2. **Partir en tandas**, cada una en su propia transacción, si de verdad hace
   falta lógica por fila. Es lo que hace `expireStaleSolicitudes`
   (`EXPIRE_BATCH_SIZE`, ver `.claude/rules/reservas.md`). Que una tanda falle y
   las anteriores queden aplicadas hay que analizarlo caso por caso: ahí funciona
   porque cada fila es condicional e idempotente.
3. Subir el `timeout` del `$transaction` **no** es la salida por default: alarga
   el bloqueo y el techo real pasa a ser la duración de la función serverless.

### Cómo se mide, para no discutirlo a ojo

Bisección con operaciones que hacen el viaje completo **sin tocar datos**: un
`updateMany` contra una fila que no existe. Se prueba con 10, 20, 30 viajes, y
entre el último que pasa y el primero que falla se afina por mitades. Cero
escrituras y el número sale en menos de un minuto.

## Almacenamiento de imágenes (Supabase Storage)

Bucket **`tour-images`**: lectura pública, límite 5MB, MIME `image/jpeg` y `image/png`, **sin INSERT público**.

Flujo: `POST /api/uploads/tour-image` (tras `requireOperator`) emite una **signed upload URL** y el navegador sube el archivo **directo** a Storage. El archivo nunca pasa por la función, así que esquiva el límite de request de Vercel. Ruta `{operatorId}/{uuid}.{ext}`; la `publicUrl` resultante se guarda en `Tour.imageUrl`.

## El plan de Supabase es FREE, y el límite que muerde es el EGRESS

**Confirmado el 2026-08-16.** No es un detalle de facturación: **el plan Free no
cobra excedente, RESTRINGE.** Agotar la cuota no es una factura a fin de mes, es
que la plataforma **deja de servir**.

| Recurso | Tope | Uso al 2026-08-16 |
|---|---|---|
| Storage | 1 GB | 0,027 GB |
| **Egress** | **5 GB al mes** | 0,126 GB |
| Database | 0,5 GB | 0,029 GB |

**El almacenamiento se llena una vez y se ve venir. El egress se consume en CADA
visita y se recarga cada mes**, así que es el que se toca primero, y por dos
órdenes de magnitud: llenar 1 GB requiere unos 64 tours con fotos sin procesar;
agotar el egress requiere **26 visitas al catálogo**.

**Consecuencia al escribir código:** cualquier cosa que aumente los bytes que
Supabase sirve por visita (una foto más pesada, un `select` más gordo, una imagen
que pasa de un CDN externo a nuestro bucket) sale de esa cuota. **Antes de sumar
peso a un camino público, hacer la cuenta de cuántas visitas mensuales lo
agotan.**

**Y `Storage Image Transformations` no está disponible en este plan**, así que
Supabase no puede achicar imágenes del lado del servidor. Por eso el
procesamiento vive en el navegador (`src/lib/image-resize.js`) y no es una
preferencia: es el único camino.

La medición completa está en `docs/historia/2026-08-rendimiento-imagenes.md`.

## Límite de plataforma (crítico)

**Vercel Hobby permite 12 funciones serverless. `/api/` tiene hoy exactamente 12 archivos.** No se puede agregar uno sin sacar otro. Antes de crear un endpoint, consolidar en una ruta dinámica existente.

Las 12:

```
api/ai/generate-description.ts   api/geo.ts        api/search.ts
api/ai/generate-quechua.ts       api/me.ts         api/search-reasoning.ts
api/bookings.ts                  api/operators.ts  api/tours/index.ts
api/operators/me/[resource].ts   api/tours/[id].ts api/uploads/tour-image.ts
```

### El slot designado a liberar: `generate-quechua`

**Cuando haga falta un endpoint nuevo, el que sale es `api/ai/generate-quechua.ts`.**
Está decidido y anotado desde el 2026-08-16, para no tener que reabrir la
discusión con la urgencia encima.

Los tres motivos:

1. **No lo llama nadie.** El toggle QU de la ficha lee las columnas persistidas, y
   `scripts/backfill-quechua.ts` le pega directo a Anthropic sin pasar por el
   endpoint. Borrarlo no rompe ninguna pantalla ni ningún script.
2. **Su capacidad no se pierde**: el script de backfill traduce igual, con el
   mismo prompt.
3. **Hoy no llega a ningún usuario**: la capa de display de quechua no existe.

**Destinatario por definir.** Culqi prohíbe por contrato actuar como agregador;
Mercado Pago Split es candidata sin confirmar. Estimación ~4 rutas, no 3 (crear
cargo, webhook, estado, callback OAuth de subcomercios). **NO liberar el slot
hasta tener la decisión.**

Y si algún día se retoma el quechua en vivo, **el camino no es revivir el archivo
suelto sino consolidarlo en una ruta dinámica**, como se hizo con
`api/operators/me/[resource].ts`. El límite de 12 se resuelve consolidando.

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

## La guarda va en el ESTADO que se protege, no en el camino que la descubrió

**Patrón que ya se repitió dos veces, las dos con la misma forma:** una regla se
escribe en el camino donde se pensó, y el otro camino que llega al mismo estado
queda abierto. No es descuido, es que **el segundo camino casi nunca se parece al
primero**, así que no aparece al leer el código del primero.

| Regla | Dónde estaba | Camino que quedaba abierto |
|---|---|---|
| Una salida tiene que estar `ABIERTA` para vender | `takeSeats` la exigía | `addRequestedSeats` no miraba el estado |
| Un tour publicado necesita gancho, descripción y portada | el formulario, vía `parseTourInput` (POST y PUT) | `PATCH /api/tours/:id` con `{active:true}`, que tiene su propio schema de config de venta |

**El segundo lo encontró José apretando "activar" en el panel, no una lectura del
código.** Desde afuera los dos caminos ni se parecen: uno es un formulario de
cinco pasos y el otro es un botón.

### Cómo se escribe para que no vuelva a pasar

1. **Enunciá la regla sobre el ESTADO, no sobre la acción.** No es "al crear" ni
   "al editar": es **"un tour no puede estar en `active=true` sin su metadata
   mínima"**. Enunciada así, la pregunta siguiente sale sola: ¿por dónde más se
   llega a ese estado?
2. **Enumerá TODOS los caminos que escriben ese campo antes de arreglar uno.**
   Un `grep` del nombre de la columna sobre `api/` y `lib/` toma segundos y es la
   diferencia entre tapar el síntoma y cerrar la regla. Para `active` son dos:
   el POST que crea y el PATCH que activa (el PUT no lo toca).
3. **La condición vive en UN lugar, con sus números.** `faltaParaPublicar` y las
   constantes `PITCH_MIN`, `PITCH_MAX` y `DESC_MIN` están en
   **`lib/tour-publish.js`**, que **no tiene ninguna dependencia** justamente
   para que lo puedan importar los dos lados: el backend y el navegador.

   **Ese archivo sin imports no es un detalle de estilo.** La condición nació en
   `lib/tour-input.ts`, que importa zod, Prisma y Voyage, así que el frontend no
   podía usarla sin arrastrar todo eso al bundle, y la única salida aparente era
   copiarla. Sacar la parte pura a su propio archivo fue lo que permitió
   compartirla de verdad. **Si alguna vez le agregás un import a
   `tour-publish.js`, rompés esa propiedad y volvés a forzar la copia.**

   Vive en `lib/` y no en `src/` a propósito: así la función serverless hace un
   import normal de la carpeta de al lado y el que cruza carpetas es Vite.
   Verificado con `vercel build` el 2026-08-17: el archivo viaja dentro del
   bundle desplegado (`api/tours/[id].func/lib/tour-publish.js`). **Un import que
   compila pero no se despliega rompe en producción y no en la prueba**, así que
   ese es el chequeo que vale, no `tsc`.
4. **El mensaje dice QUÉ falta y DÓNDE se arregla**, nombrando el campo como lo
   llama la interfaz y el paso del formulario. "No se pudo" obliga a adivinar.

## `gateOperatorMincetur`

La función `gateOperatorMincetur` de `lib/tour-select.ts`. Regla de compliance, no de presentación:

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
- **Para separar cuentas internas de agencias reales, el criterio NUNCA es el dominio `@finde.pe`.** MEGATOURS, la agencia piloto real y hoy la única con el sello ganado, usa `megatours@finde.pe`: **comparte dominio con las cuentas de prueba**. Un filtro del tipo `email LIKE '%@finde.pe'`, que es la forma obvia de escribir "sacar lo interno del catálogo", **le borra el sello a la única agencia que lo tiene y baja sus tours reales**. Las cuentas se nombran **una por una**, con su email exacto, y después se verifica que el piloto quedó intacto. Pasó de verdad el 2026-08-16 y se detectó antes de aplicar; ver `docs/historia/2026-08-sello-verificacion.md` y `scripts/limpiar-sello-verificacion.ts`.
- `Booking.userDocument` (DNI, pasaporte o CE) se llama así y no `userDocId` para no confundirlo con `userId`. Solo se expone a la agencia dueña del tour.
- `Tour.embedding` es `Unsupported("vector(1024)")`: no se puede leer ni escribir por el cliente Prisma normal, va por `$queryRaw` / `$executeRaw`.

## IA

- **Claude**: modelo `claude-sonnet-4-6`. **Fuente de verdad: `lib/anthropic.ts`** (export `MODEL`). No hardcodear el id en otro lado.
- **Embeddings**: Voyage AI, vectores de **1024 dimensiones**, vía `lib/voyage.ts` (`MODEL_EMBED`, `DIM`). El schema tiene `vector(1024)`: cambiar de modelo implica migración y re-embed de los 49 tours.
- Embedding **on-write**: al crear o editar un tour, `embedTourSafe` (`lib/tour-input.ts`) regenera el vector. Si falla, no rompe el guardado.

### Búsqueda en dos fases

1. **Fase 1** (`api/search.ts`): Voyage + pgvector eligen los candidatos y devuelven ids validados, ya firmados. Cache en `FeaturedSearch` para queries normalizadas (`lib/search-cache.ts`). Filtra `active: true` en sus tres queries.
2. **Fase 2** (`api/search-reasoning.ts`): genera el reasoning **sobre los ids ya elegidos**, con los datos firmados de la fase 1. La firma es HMAC con `SEARCH_PHASE_SECRET` (`lib/search-sig.ts`), para que la fase 2 no pueda ser inducida a razonar sobre tours que la fase 1 no eligió.

**Regla anti-invención**, literal dentro de `SYSTEM_REASONING` en `api/search-reasoning.ts`: "Usa solo datos que estén en la información de los tours. No afirmes distancias, tiempos de viaje, cercanías entre ciudades ni características que no figuren ahí." Ese mismo bloque de REGLAS DEL TEXTO prohíbe la raya (`—`) dos viñetas antes. Si tocás ese prompt, las dos reglas se quedan.

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
- `framework: null`: Vercel no autodetecta nada. **El build que corre Vercel es el `buildCommand` de este archivo, no el script `build` de `package.json`.**

### El `buildCommand` delega en `npm run build`, y no es cosmético

```json
"buildCommand": "npm run build"
```

**Así el build queda definido en UN solo lugar (`package.json`) y `vercel.json`
solo delega.** Si acá se escribe la cadena de comandos completa quedan dos
definiciones del build que pueden separarse sin que nadie se entere, que es
exactamente lo que pasó.

#### El caso que confirmó la regla: el prerender que nunca corrió

**La regla de arriba ya estaba escrita el 2026-08-16 y aun así se rompió al día
siguiente.** El paso de prerender (`scripts/prerender.ts`, los meta tags por
tour) se agregó al script `build` de `package.json`, y se verificó corriendo
`npm run build` en local: 43 fichas escritas, con su `noindex`. Todo verde.

**Pero `vercel.json` decía `"buildCommand": "vite build"`, así que Vercel nunca
ejecutó el paso.** El deploy salió con los meta tags genéricos y sin `noindex`,
y lo encontró José usando el sitio, no la verificación.

La medición que lo cerró, un comando cada una:

| Comando | Fichas generadas | `noindex` |
|---|---|---|
| `vite build` (lo que corría Vercel) | **0** | no |
| `npm run build` (lo que se verificó) | **43** | sí |

**La lección es la diferencia entre medir el punto y medir un borde parecido.**
Correr `npm run build` en local no prueba nada sobre el deploy: prueba el
comando que uno eligió correr. El punto exacto era **qué comando ejecuta
Vercel**, y eso se lee en `vercel.json`, que es este archivo, donde la regla ya
estaba.

**Al tocar el build:** el cambio va en `package.json`, y se verifica que
`vercel.json` siga delegando. Si algún día alguien vuelve a poner acá la cadena
completa, esta sección explica por qué no.
