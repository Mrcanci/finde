# Estado del proyecto

> **El presente. Se lee al empezar cada tanda y se actualiza en el mismo commit al cerrarla.**
> Última actualización: 2026-08-17.
>
> **Lo que ya se hizo NO vive acá**, vive en `docs/historia/`. Ver el índice al final.

## Rama activa

`dev`. Toda tanda arranca acá. `main` es producción (finde.pe), `dev` es QA (dev.finde.pe).

## Dónde está el trabajo

**Frente abierto el 2026-08-15: navegación abierta y camino al lanzamiento.** Ver
la decisión del 2026-08-15 en `docs/decisiones.md`: `/demo` se queda hasta el
lanzamiento, y **cada tanda tiene que dejar el switch más cerca, no más lejos**.

| # | Tanda | Depende de | Estado |
|---|---|---|---|
| 0 | Endpoints de IA con auth | nada | ✅ en `main` |
| 1 | Analítica base, solo Vercel Analytics | nada | ✅ en `main` |
| 1B | La landing no se carga en `/demo` | salió de medir la 1 | ✅ en `main` |
| 1C | Fotos de la landing a 800 px | 1B | ✅ en `main` |
| 2 | Router con `BASE_PATH` y URL por tour | 1 | ✅ en `main` |
| 3 | Modal de cuenta en el checkout, navegación abierta | 2 ✅ | **la siguiente** |
| 4 | Eventos del embudo | 3 | esperando |
| 5 | Meta tags por tour, más la metadata obligatoria del formulario | 2 ✅ | ✅ en `main`. `robots.txt` y `sitemap.xml` van con el switch |
| 5B | Activar un tour exige la metadata mínima, y el panel avisa antes | 5 ✅ | ✅ en `main` |
| 6 | Día del switch: `BASE_PATH` a `""` más el rewrite de la raíz | todo | el código es reversible, el SEO no |

**Las 5 y 5B cerraron el 2026-08-17 y están en `main`. La 3 es la siguiente y no
depende de ninguna de las dos.** El detalle de lo cerrado está en
`docs/historia/2026-08-router-y-urls.md`.

- **La 3** abre la navegación por defecto. Hoy `/demo` pelado **sigue mostrando el
  login**: la 2 solo abrió los deep links. De la 3 depende la 4.

**Lo que queda abierto del frente de SEO, y no se toca antes de tiempo:**

- **PENDIENTE INMEDIATO: el `noindex` general de `/demo`.** Decidido el
  2026-08-17 y **todavía sin aplicar**. Hoy el `noindex` está solo en las 42
  fichas prerenderizadas: la portada, el buscador y cualquier URL huérfana se
  sirven **sin ninguna instrucción para Google**. Nada bajo `/demo` debe
  indexarse mientras el producto no esté lanzado. Opciones con su costo en
  `docs/audits/2026-08-17-noindex-y-urls-huerfanas.md`.
- **El paso 5 de la tanda 5 tiene TRES piezas, no dos.** Va el día del switch,
  no antes:
  1. **Sacar el `noindex`.**
  2. **Publicar `robots.txt` y `sitemap.xml`.** Hoy sería invitar a indexar lo
     que el `noindex` bloquea, y listaría las 37 URLs que se borran.
  3. **Resolver las URLs de tours que no existen.** *(Descubierta el 2026-08-17,
     no estaba en el plan original.)* Hoy responden **200 con la portada
     genérica**, no 404: el rewrite de `/demo/:path*` las captura antes de que
     Vercel llegue a su fase de error. Para Google eso es un soft 404. **Mientras
     dure el `noindex` general no hace daño; el día que se saque, sí.** Y es
     justo cuando más van a existir, porque se borran los 37 tours del seed.
     Análisis y opciones en `docs/audits/2026-08-17-noindex-y-urls-huerfanas.md`.
- **El prerender corre en CADA deploy**, así que **los datos sucios se congelan
  en HTML indexable** y quedan en el índice de Google hasta el próximo crawl. Hoy
  lo tapa el `noindex`; el día del switch deja de taparlo. Es la razón por la que
  la limpieza de datos de prueba va **antes** del switch, no después.

### Fuera del frente de lanzamiento

- **Fase 6 del plan tipográfico**, la escala en tokens. **Tiene un requisito
  previo**: la elección tipográfica de la auditoría de identidad visual
  (`docs/audits/2026-08-16-identidad-visual.md`). Cada tipografía tiene su propia
  altura de x, así que cambiar la fuente después obliga a recalcular la escala.
- **Barrido de padding del Grupo B**, más chico y ya desbloqueado.
- **Integración de Culqi** como feature de lanzamiento. Al integrarla se reactiva
  la pestaña "Ingresos" del dashboard, hoy oculta. Ver `docs/decisiones.md`.

## Terminado y mergeado

- **SEO de las fichas (tandas 5 y 5B, 2026-08-17)**: cada tour tiene su HTML estático con title, description y `og:` propios, generado en cada deploy y con `noindex` mientras el producto viva en `/demo`. La metadata mínima (gancho de 40 a 80, descripción de 300, portada) es obligatoria **por los dos caminos**: al guardar en el formulario y al activar desde el panel, con la condición compartida en `lib/tour-publish.js`. El panel apaga el interruptor de entrada y dice qué falta.

- **tours-db-i18n**: tours migrados de array hardcoded a DB, con embeddings Voyage, 6 categorías sincronizadas con el enum, skeleton loading y dropdown AI_SUGGESTIONS.
- **M1 Auth**: Supabase Auth email + password, sesión persistente en localStorage, `isOperator` derivado de la DB.
- **M2 Tours de la agencia**: CRUD real, upload de imágenes a Supabase Storage por signed URL (el navegador sube directo a Storage y esquiva el límite de ~4.5MB de Vercel).
- **Búsqueda en dos fases**: la fase 2 genera el reasoning sobre los ids ya elegidos, con los datos firmados de la fase 1 (`lib/search-sig.ts`, HMAC). `SEARCH_PHASE_SECRET` cargada en Development, Preview y Production.
- **Inventario y salidas**: modelo `Departure`, enums `SalesMode` / `BookingStatus` / `DepartureStatus`, motor en `lib/inventory.ts` con materialización perezosa y toma de cupo atómica, panel de salidas con confirmación en lote.
- **Cierre de venta en las dos puntas** para tours `SOLICITUD`.
- **Emails transaccionales**: Resend. `RESEND_API_KEY` ya está cargada en **los tres entornos** (Development, Preview, Production). Ver la advertencia de QA en `CLAUDE.md`.
- **Rechazo puntual de una solicitud** desde el panel, además del lote (`f499fda`, `60d8b8f`).
- **Documento del viajero** (`Booking.userDocument`) guardado en la reserva y visible en el panel de la agencia dueña (`98e92d0`, migración `2026-08-12-booking-user-document.md`).
- **Datos del pasajero agrupados** en el detalle de reserva del panel (`7d0333b`).
- **Modo de venta visible al viajero** al reservar (`d561bb2`).
- **Jerarquía visual de escasez** en el calendario de reserva y disponibilidad pre-cargada desde el detalle (`0100120`, `4379219`, `db21c0b`).
- **`/api/me?scope=operator`**: camino liviano que resuelve la identidad de agencia sin la query de bookings ni el vencimiento perezoso (`4e81cb0`).
- **Los endpoints de IA exigen perfil de agencia** (`6e6fb83`). Tanda 0 del camino al lanzamiento, cerrada post-QA el 2026-08-15.
- **Vercel Web Analytics** (`8681dee`). Tanda 1, reducida a eso por decisión de José. Costo medido: unos 2,3 kB comprimidos y cero bloqueo del hilo principal.
- **La landing deja de cargarse en `/demo`** (`d916e65`). Tanda 1B, cerrada post-QA el 2026-08-16. Bytes de `/demo`: **6.528.216 a 232.992, un 96,4% menos**.
- **Las fotos de destinos de la landing, a 800 px** (`5575328`). Tanda 1C, cerrada post-QA el 2026-08-16. Bytes de la landing: **6.526.560 a 976.569, un 85% menos**.
- **Las fotos que suben las agencias se achican en el navegador** (`62a1d1a`). Cerrada post-QA el 2026-08-16. Era la **condición** que imponía el plan Free de Supabase: una foto real de 4.062 kB sube como **203 kB**.
- **El sello de verificación deja de afirmar algo falso** (`38823ed`). Cerrado post-QA el 2026-08-16. Era el **bloqueante de lanzamiento**: 42 tours visibles y MEGATOURS como la única agencia con sello.
- **El router y las URLs por vista** (`1d5bad0`). Tanda 2, cerrada post-QA el 2026-08-16. Cada vista tiene URL, la ficha resuelve por deep link y **el prefijo vive en una sola constante**.

## Pendientes abiertos

**El detalle y el razonamiento de cada uno están en `docs/pendientes-producto.md`.**
Acá va solo la lista, para que se vean desde el estado.

| Qué | Por qué importa |
|---|---|
| **Las traducciones al quechua las escribe un modelo y nadie las valida** | El quechua es promesa de marca. Hoy no llega a ningún usuario porque la capa de display no existe, y eso es lo que lo mantiene como riesgo y no como incidente |
| **El formulario de tour se pierde entero al navegar afuera** | Sin aviso y por cualquier camino de salida. La salida elegida es un diálogo de confirmación |
| **Fotos huérfanas en Supabase Storage** | Deuda **con costo**: cada formulario abandonado deja archivos que nadie borra nunca |
| **Una salida que pasa con solicitudes sin decidir deja al viajero colgado** | Hoy no duele porque son datos de prueba. Con MEGATOURS operando sí |
| **El cierre operativo no se evalúa en `CUPO_FIJO`** | Subordinado a la decisión del 2026-08-15: no se toca hasta que una agencia lo pida |
| **El `<h1>` del título del tour en escritorio** | Marcado existente que computa `display:none`. Es trabajo del rediseño de la ficha, no algo para borrar |
| **El bundle pasa los 500 kB** (673 kB, 184 comprimido, un solo chunk) | Candidato a code splitting por vista. **Dejó de ser el pendiente número uno de rendimiento**: las tandas 1B y 1C sacaron 11,8 MB, sesenta veces el bundle entero. Lo que pesa son imágenes, no JavaScript |

**Auditoría de identidad visual, pendiente.** José, mirando el home, dijo que los
títulos de sección le parecen "hechos por IA", y al conversarlo quedó claro que es
sobre **todo el producto**. **No la cubre la auditoría tipográfica de agosto**:
esa midió mecánica (contraste, tamaños, interlineado), esta es de criterio de
diseño. **No se mide, se juzga.** Siete puntos a cubrir, más tres cosas de
contenido que pesan más que cualquier decisión de diseño. Detalle completo en
`docs/audits/2026-08-16-identidad-visual.md`.

## Bugs abiertos

Ninguno.

## Antes de lanzar a usuarios reales

- [x] **Procesar las fotos en el navegador antes de subirlas.** ~~CONDICIÓN, no mejora.~~ **HECHO el 2026-08-16** (`62a1d1a`), antes de onboardear ninguna agencia real, que era el punto. Registro en `docs/historia/2026-08-rendimiento-imagenes.md`.
- [ ] **Reactivar "Confirm email" en Supabase** (desactivado para acelerar el MVP).
- [x] **El sello de verificación falso: CERRADO el 2026-08-16.** Fue el único bloqueante de lanzamiento y El registro completo está en `docs/historia/2026-08-sello-verificacion.md`. Resultado: **42 tours visibles y MEGATOURS como la única agencia con sello, que es la única que lo tiene de verdad.**
- [ ] **Borrar los datos de prueba.** Inventario concreto:
  - Tours de `hola@finde.pe` ("Tour Prueba", sin verificar): **dos**, `"prueba"` (2026-07-28) y `"prueba manual"` (2026-08-13). **Los dos están pausados**: `"prueba manual"` ya lo estaba y `"prueba"` se pausó el 2026-08-17, porque seguía en el catálogo público con 15 caracteres de descripción. Falta borrarlos.
  - Las **37 reservas** son de prueba salvo revisión caso por caso. Cuentas que las crearon: `hola@finde.pe`, `test@finde.pe`, `demo@finde.pe`, `megatours@finde.pe` y **`totemhubapp@gmail.com`** (ojo: esta no es `@finde.pe`. Y el criterio **nunca** es el dominio: ver `.claude/rules/api-y-schema.md`, porque MEGATOURS también es `@finde.pe`). **La agencia MEGATOURS no se toca** (ver el ítem de coordinación en esta misma lista); lo que se borra son las reservas de prueba hechas desde esa cuenta y las que caen sobre sus tours.
  - Las **25 salidas**, incluidas 7 del tour "prueba".
  - Agencias sin tours creadas en pruebas: `test@finde.pe` (jose luis cancino cuellar), `op-test@finde.pe` (Tours Test), `totemhubapp@gmail.com` (Totem Travels).
  - Borrar reservas antes que tours: el FK `Booking.tourId` es `onDelete: Restrict` y el DELETE responde 409 si el tour tiene reservas.
- [ ] **Coordinar la operación con MEGATOURS antes de que entre una reserva real.** `megatours@finde.pe` es **agencia piloto confirmada, no dato de prueba**: no se borra. Sus 5 tours de Cajamarca (City Tour, Cumbe Mayo, Granja Porcón, Otuzco, Namora) están **públicos hoy en finde.pe**, pero la coordinación operativa con la agencia todavía está pendiente. O sea: si un viajero reserva hoy, le llega un correo a alguien que no lo está esperando y no sabe qué hacer con eso. Hay que cerrar la coordinación, o pausar los tours mientras tanto.
- [ ] **Sacar el mock `USER`** de `src/AppDemo.jsx:921` ("Alejandra Quispe"). Ya no se usa para el saludo, pero sigue siendo el fallback del nombre del cliente (`:2908`, `:6194`) y el autor de las reseñas de sesión (`:5812`). Si alguna vez cae en ese fallback, el usuario ve un nombre inventado.

## Inventario real de la base (2026-08-16)

Local, dev.finde.pe y producción usan **la misma base**. Estos son los números
reales, no los del PRD:

- **49 tours**, de los cuales **42 activos** y visibles en el catálogo público.
- **14 agencias**, y **solo 2 verificadas**: MEGATOURS (real) y "Descubre el Perú"
  (la cuenta de demos, que ya no tiene tours públicos).
- **43 reservas**. Casi todas de prueba.
- **25 salidas** materializadas, varias con cupo tomado.
- Categorías de los activos: cultural 15, adventure 14, nature 9, gastronomy 2, mystic 2.
- `FeaturedSearch`: 33 filas. `SearchLog`: 272 filas.
- Bucket `tour-images`: **44 archivos, 26 MB de 1 GB**.

**De los 42 tours públicos, 37 son del seed y se borran en el lanzamiento.**
Quedan los 5 de MEGATOURS.

## Estado de los datos: real vs mock

Casi todo lo que antes era mock ya se eliminó. Lo que queda:

| Qué | Estado |
|---|---|
| Notificaciones | **Real.** Se derivan de reservas reales (`derivedNotifs`, `AppDemo.jsx:5762`), de `trips` y `opBookings`. La constante `NOTIFS` ya no existe. |
| Reservas del panel | **Real.** `GET /api/operators/me/bookings`. `OP_BK` eliminado en M3. |
| Ingresos del dashboard | **Eliminado.** `EARN` borrado junto con la tab "Ingresos", que está oculta hasta que haya pasarela. |
| Reviews | **Parcial, no mock.** `generateMockReviews` fue eliminado. Un tour sin reseñas muestra "Nuevo". Las reseñas que deja el viajero viven solo en el estado de sesión: **se pierden al recargar**. No existe modelo `Review` en la DB. |
| Mis viajes | **Real.** Salen de `GET /api/me`. `MY_TRIPS` eliminado. |
| Rating del dashboard | **Oculto** (`AppDemo.jsx:4205`), porque los ratings del seed son siembra, no reseñas reales. |
| `USER` | **Mock residual.** Ver "Antes de lanzar a usuarios reales". |

## Material de postulaciones

Emprende Turismo TEC 2026 ya terminó, pero el material quedó y sirve de base para la próxima postulación:

- `docs/pitch-demoday-eturismo-tec-2026.md`: guion palabra por palabra de 7 beats, estructura y contenido del deck, y un banco de cerca de 18 preguntas de Q&A.
- `docs/finde-onepager.html`: leave-behind de una página en la marca. Para exportarlo: abrir en el navegador → Cmd+P → PDF, con la opción de gráficos de fondo activada.

**Equipo:** Jose Cancino (CEO, ex-LATAM Airlines) y Franco Romaní (CTO, 8 años de ingeniería).

**Ojo con los números:** los dos archivos citan 40 tours y 13 agencias, heredado del PRD. Está desactualizado e inflado. Los números salen de este documento, no del PRD. Ver la entrada del 2026-08-13 en `docs/decisiones.md`.

## Dónde está el resto

Este archivo es **el presente**. Lo demás vive en su lugar, y esa separación es a
propósito: **lo único que se carga solo son las reglas con alcance**, todo lo
demás hay que ir a buscarlo, y un archivo que nadie termina de leer es
información que existe pero no está disponible.

| Dónde | Qué |
|---|---|
| `docs/historia/` | **Lo que ya se hizo**, con su investigación y su medición. Índice en su `README.md` |
| `docs/decisiones.md` | **Por qué se decidió cada cosa.** Solo se agrega, nunca se borra |
| `docs/audits/` | **Diagnósticos de un momento**, con o sin ejecución posterior |
| `docs/pendientes-producto.md` | **El razonamiento entero** de los pendientes de arriba |
| `docs/migrations/` | Historial de cambios de schema con su razón |
| `.claude/rules/` | **Las barandas.** Se cargan solas al tocar los archivos que cubren |
