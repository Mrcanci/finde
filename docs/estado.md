# Estado del proyecto

> Se sobrescribe al cerrar cada tanda, en el mismo commit del trabajo.
> Última actualización: 2026-08-14 (verificado contra el repo y contra la DB de producción)

## Rama activa

`dev`. Toda tanda arranca acá. `main` es producción (finde.pe), `dev` es QA (dev.finde.pe).

## Terminado y mergeado

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

## En curso

Nada arrancado. **Lo próximo es la Fase 4 del plan tipográfico**, que no se
empieza sin visto bueno explícito.

## Plan tipográfico: dónde quedó, al 2026-08-14

Fuente: `docs/plans/2026-08-13-plan-tipografia.md`. Nace de la auditoría del
2026-08-13 (`docs/audits/2026-08-13-typography-audit.md`), que sigue siendo
válida como diagnóstico pero **tiene seis errores de análisis ya corregidos
en el plan**. Cuando los dos se contradigan, manda el plan.

### Aplicado y en `main`

Mergeado a `main` el 2026-08-14 (`af7c0b1`), post-QA. Primer merge a `main`
desde el saneamiento previo.

| Fase | Qué entró |
|---|---|
| **Fase 1, contraste** | Paleta accesible (`--tr-text`, `--gy-strong`, `--gy-soft` borrado), gradiente del hero, placeholders, borde del radio de pago |
| **Fase 2, áreas táctiles** | Piso de 44px en los nueve controles y en la celda del calendario de reserva |
| **Fase 3, micro-arreglos** | Input a 16px en desktop, cifras tabulares, código de reserva unificado, `preconnect` a Google Fonts |

Dos decisiones de esas fases que **no se reabren**: los cuatro `hover` de
`--sg` y el `.login-google:hover` se quedan como estaban, porque son bordes
y ya pasaban el umbral de 3:1; y el peso 300 de la fuente se queda, porque
las tres URLs son byte a byte idénticas y comparten entrada de caché.

### Fase 0, cerrada

Sin commits de código, es medición. **No tiene bloqueos abiertos.**

- **Entregable 4, auditoría de `text-align`: completa.** 128 selectores
  dependen de la herencia, sobre 20 vistas y sub-vistas. Es el checklist del
  riesgo número uno de la Fase 4. En
  `~/Documents/finde-capturas/2026-08-13-fase0/datos/auditoria-text-align.md`
- **Capturas de línea base** en claro y oscuro, a 390, 412 y 1440px
- **Comparación de modo oscuro contra claro**: quedan dos diferencias, las
  dos del bloque `.app-demo`
- Queda pendiente solo el entregable 6, la cursiva de `.voucher-more`, que
  no bloquea nada

**Las capturas viven fuera del repo a propósito**, en
`~/Documents/finde-capturas/2026-08-13-fase0/`, porque la Fase 0 no hace
commits. Ver el `INDICE.md` de esa carpeta antes de compararlas: hay dos
familias y **no se comparan entre sí**.

### Lo que hay que saber antes de arrancar la Fase 4

Es la fase de riesgo alto del plan. Tres cosas que ya están decididas y
medidas, para no volver a discutirlas:

1. **La secuencia es obligatoria**: replicar `text-align:center` en `.app`
   primero, borrar el bloque `.app-demo` después, y recién al final ir
   sacando el centrado selector por selector. Al revés no funciona, porque
   los dos calendarios suman **81 elementos sin clase** que no tienen
   entrada en la lista de 128.
2. **El `border-inline` no se replica.** Es estética de scaffold de Vite.
3. **Ni el flujo de reserva ni el de tour nuevo están en las capturas de
   línea base**, y ahí viven esos 81 elementos. El diff visual no los va a
   detectar: hay que recorrerlos a mano, en 390 y 1440, dos veces.

Estos dos ítems vienen del **título de una tanda del 2026-08-13, "Refina generador de IA y fix de fecha en demo"**. La tanda nunca se detalló: no quedó escrito qué había que refinar ni cuál era el bug. Son el título y nada más.

- **Refinar el generador de descripciones con IA.** Se refiere a `POST /api/ai/generate-description` (y probablemente a `generate-quechua`).

  **Corrección del 2026-08-14: la parte de "no está enchufado a la UI" ya no es cierta.** Verificado en dev.finde.pe recorriendo el formulario paso por paso: el **paso 4 de 5 de `NewTourView`** tiene el bloque "Generador IA · Genera una descripción profesional basada en los datos que ya ingresaste" con su botón "Generar descripción". Está conectado y funcionando.

  Lo que queda del pendiente, entonces, es solo **mejorar el prompt**, y ahí sí hay trabajo concreto identificado: ver el riesgo del generador de quechua más abajo.
- **Fix de fecha en el demo.** No hay síntoma registrado ni pantalla identificada. Hay varios candidatos posibles (el calendario de reserva, `scheduledAt`, las fechas Lima de las salidas), y sin el síntoma no se puede saber cuál era.

**Los dos hay que definirlos o eliminarlos.** Si al leer esto nadie recuerda a qué se referían, borralos: un pendiente que nadie puede accionar solo genera ruido en cada tanda.

## Em-dashes: las cuatro canillas, cerradas

Cerrado el 2026-08-14. El canon prohíbe la raya en copy y en texto generado
por IA, y estaba entrando por cuatro lados a la vez.

| Canilla | Qué era | Estado |
|---|---|---|
| Los tres prompts de IA de `api/` | Tenían em-dashes adentro y no prohibían la raya. El modelo imitaba sus instrucciones | cerrada |
| `scripts/backfill-quechua.ts` | Copia del prompt sin la prohibición. **Era la que generó los 52 de `descQu`** | cerrada |
| `prisma/seed.ts` | 30 rayas en las descripciones. Volvían enteras en cada `db:seed` | limpio |
| La base | 88 rayas en 52 campos de 28 tours | limpia |

**La base y el seed dicen lo mismo ahora.** Verificado sobre los nueve
campos de texto del tour, no solo los cuatro tocados: cero rayas, cero
anomalías de puntuación. Backup previo en
`backups/tour-antes-limpieza-em-dash-20260814.sql`, verificado con contenido
real (49 filas) antes de escribir.

El script quedó versionado en `scripts/limpieza-em-dash.ts`, en dry run por
defecto: escribir exige `--apply`.

**Excepción que no es violación:** los nueve `"—"` de `AppDemo.jsx` son el
glifo de dato vacío (`user?.email || "—"`), no prosa. Se quedan. Anotado en
`.claude/rules/frontend.md` para que un barrido no los vuelva a marcar.

## Bugs abiertos

Ninguno registrado.

Pendientes de performance:

- **El bundle pasa los 500 kB y Vite lo avisa en cada build** (661 kB, 180 kB comprimido, en un solo chunk). No es urgente para el piloto, pero sí para el mercado real: Android de gama media sobre 4G peruano, con objetivo de LCP bajo 3 segundos. `src/AppDemo.jsx` son más de 6200 líneas que hoy viajan enteras aunque el usuario solo abra el home. Candidato claro a code splitting por vista, que es como ya está organizado el archivo (el switch de `effectiveView`). Sin fecha ni tanda asignada.

Textos con fecha de vencimiento (se van a borrar solos, no invertir en ellos):

- `src/AppDemo.jsx:5818`, el mensaje "Inicia sesión o regístrate para reservar tu tour". Aparece cuando alguien intenta reservar sin sesión. **Ese string desaparece entero cuando se implemente reserva como invitado**, porque no va a haber gate que mostrar. Se corrigió el copy (decía "experiencia") pero no vale la pena traducirlo, testearlo ni pulirlo más.

Riesgos de producto (no son bugs, no hay nada roto):

- **Las traducciones al quechua las escribe un modelo y nadie del equipo las valida.**

  El síntoma que encontramos es medible: el generador **agrega em-dashes que no están en el original**. Contado sobre los 49 tours de la base el 2026-08-14: **52 rayas en `descQu` contra 35 en `description`**, y hay tours con 3 o 4 en quechua y **cero** en español (Tambomachay, Pachacamac, Sacsayhuamán, Iquitos). No las está copiando, las está inventando.

  La causa es concreta y está en el código: los `SYSTEM_PROMPT` de `api/ai/generate-quechua.ts` y `api/ai/generate-description.ts` **contienen em-dashes ellos mismos** (2 y 3 respectivamente) y **no prohíben la raya**. El único prompt que sí la prohíbe es `api/search-reasoning.ts:63`. El modelo imita sus propias instrucciones.

  **Pero las rayas son lo de menos: son solo lo que encontramos porque lo buscábamos.** Lo que no sabemos es qué más está inventando el modelo en un idioma que nadie del equipo lee. Si imita el formato de sus instrucciones, no hay razón para suponer que no invente también contenido.

  **Hoy no llega a ningún usuario**, porque la capa de display de quechua no existe: las columnas `titleQu`, `descQu`, etc. se llenan pero no se muestran. Eso es lo que lo mantiene como riesgo y no como incidente.

  **Antes de mostrar quechua en el producto, alguien que lo hable tiene que leer una muestra de las traducciones.** No es opcional: el quechua es una promesa de marca de Finde, y publicar traducciones sin revisar de un idioma que el equipo no habla es exactamente la forma de romperla sin enterarse. Sin fecha ni tanda asignada.

  La canilla se cierra aparte, en `fix/prompts-sin-raya`. Eso arregla las rayas futuras, no la validación de fondo ni las 88 que ya están en la base.

Trabajo pendiente de producto:

- **El título del tour en desktop, fuera del hero.** `src/AppDemo.jsx` tiene un `<h1 class="det-tl-desktop">` con el nombre del tour que hoy computa `display:none` en todos los anchos, de 390 a 1600. **No es marcado muerto: es una intención abandonada.** La idea era el patrón de Airbnb, con el título del tour arriba y afuera de la foto en desktop, en vez de superpuesto al hero como está hoy (`.det-tl`). Quedó a medio camino: el marcado existe, el CSS que lo mostraría no. **Es trabajo del rediseño de la ficha de tour, no algo para borrar.**

  Ojo con un detalle al retomarlo: ese `h1` hoy no declara color propio y hereda `--text-h` del bloque `.app-demo` de `index.css`, o sea que en modo oscuro saldría casi blanco. Es el mismo patrón de los dos títulos invisibles ya arreglados (`c171347`, `e818d8e`). **No hay que arreglarlo antes: la Fase 4 del plan tipográfico lo desactiva sola** al eliminar el bloque y con él la variable. Ver `docs/plans/2026-08-13-plan-tipografia.md`.

Pendientes menores (no justifican tocar nada por sí solos):

- `src/Landing.jsx:575` tiene un comentario que nombra `App.css`, archivo borrado en `c96bd05` por ser código muerto sin importar. El comentario quedó desactualizado. `Landing.jsx` es archivo protegido, así que **no se toca por esto**: corregirlo cuando haya un motivo real para editar la landing y aprovechar el viaje.

Cerrados y verificados (no reabrir):

- Gate de `operatorResolved` en `ProfileView` y `TopNav`: cerrado en `9a928c2`. Ambos lo consumen hoy (`AppDemo.jsx:3744` y `:1865`).
- `/api/me` corriendo el vencimiento perezoso en el camino de identidad: cerrado en `4e81cb0` con el `?scope=operator`.

## Inventario real de la base (2026-08-13)

Local, dev.finde.pe y producción usan **la misma base**. Estos son los números reales, no los del PRD:

- **49 tours**, todos `active: true`, todos con embedding Voyage.
- **14 agencias**. 9 son del seed (sin `userId`, sin RUC, sin MINCETUR). 5 tienen dueño real.
- **37 reservas**. Casi todas de prueba.
- **25 salidas** materializadas, varias con cupo tomado.
- Categorías: adventure 19, cultural 16, nature 9, mystic 3, gastronomy 2.
- `FeaturedSearch`: 32 filas. `SearchLog`: 271 filas.

## Antes de lanzar a usuarios reales

- [ ] **Reactivar "Confirm email" en Supabase** (desactivado para acelerar el MVP).
- [ ] **Arreglar las 8 agencias del seed con `verified: true` sin RUC ni MINCETUR.** Hoy el catálogo público las muestra como verificadas cuando no pasaron ninguna verificación. Choca de frente con la regla "nada falso visible al usuario real". Son las 8 sin `userId`: Amazonía Viva, Andes Auténticos, Colca Adventures, Inka Trail Co, Lima Cultural Tours, Norte Salvaje, Pachamama Sagrada y Perú Total Tours. O se les carga RUC y MINCETUR reales, o se les baja `verified` a false.
- [ ] **"Descubre el Perú" (`demo@finde.pe`): incumplimiento de la regla de no mostrar nada falso al usuario real.** Está `verified: true` con RUC `20601234567` y MINCETUR `REG12345`. Son valores de demo, pero **con formato válido**, así que pasan por reales a la vista de cualquiera.

  **Es un caso distinto del de las 8 agencias del seed, y más grave.** Las 8 no tienen datos: el problema ahí es un sello sin respaldo. Esta tiene **datos falsos que parecen reales**, y sus 5 tours salen al catálogo público con el sello de verificada al lado de un RUC inventado. Un viajero que quiera comprobar la agencia va a buscar ese RUC en SUNAT y no va a encontrar nada, que es exactamente el escenario que la regla existe para evitar.

  Resolverlo antes de lanzar: o se cargan RUC y MINCETUR reales, o se baja `verified` a false, o los tours salen del catálogo público. Es la cuenta de presentaciones, así que hay que decidir cómo sigue sirviendo para demos sin quedar publicada como agencia verificada.
- [ ] **Borrar los datos de prueba.** Inventario concreto:
  - Tours de `hola@finde.pe` ("Tour Prueba", sin verificar): **dos**, `"prueba"` (2026-07-28) y `"prueba manual"` (2026-08-13). Los dos están activos y visibles en el catálogo público.
  - Las **37 reservas** son de prueba salvo revisión caso por caso. Cuentas que las crearon: `hola@finde.pe`, `test@finde.pe`, `demo@finde.pe`, `megatours@finde.pe` y **`totemhubapp@gmail.com`** (ojo: esta no es `@finde.pe`, el criterio de "cuentas @finde.pe" la deja afuera). **La agencia MEGATOURS no se toca** (ver abajo); lo que se borra son las reservas de prueba hechas desde esa cuenta y las que caen sobre sus tours.
  - Las **25 salidas**, incluidas 7 del tour "prueba".
  - Agencias sin tours creadas en pruebas: `test@finde.pe` (jose luis cancino cuellar), `op-test@finde.pe` (Tours Test), `totemhubapp@gmail.com` (Totem Travels).
  - Borrar reservas antes que tours: el FK `Booking.tourId` es `onDelete: Restrict` y el DELETE responde 409 si el tour tiene reservas.
- [ ] **Coordinar la operación con MEGATOURS antes de que entre una reserva real.** `megatours@finde.pe` es **agencia piloto confirmada, no dato de prueba**: no se borra. Sus 5 tours de Cajamarca (City Tour, Cumbe Mayo, Granja Porcón, Otuzco, Namora) están **públicos hoy en finde.pe**, pero la coordinación operativa con la agencia todavía está pendiente. O sea: si un viajero reserva hoy, le llega un correo a alguien que no lo está esperando y no sabe qué hacer con eso. Hay que cerrar la coordinación, o pausar los tours mientras tanto.
- [ ] **Sacar el mock `USER`** de `src/AppDemo.jsx:921` ("Alejandra Quispe"). Ya no se usa para el saludo, pero sigue siendo el fallback del nombre del cliente (`:2908`, `:6194`) y el autor de las reseñas de sesión (`:5812`). Si alguna vez cae en ese fallback, el usuario ve un nombre inventado.

## Próximo

Integración de **Culqi** como feature de lanzamiento. Al integrarla se reactiva la pestaña "Ingresos" del dashboard de la agencia, hoy oculta (`AppDemo.jsx:4211`). Ver `docs/decisiones.md`.

## Material de postulaciones

Emprende Turismo TEC 2026 ya terminó, pero el material quedó y sirve de base para la próxima postulación:

- `docs/pitch-demoday-eturismo-tec-2026.md`: guion palabra por palabra de 7 beats, estructura y contenido del deck, y un banco de cerca de 18 preguntas de Q&A.
- `docs/finde-onepager.html`: leave-behind de una página en la marca. Para exportarlo: abrir en el navegador → Cmd+P → PDF, con la opción de gráficos de fondo activada.

**Equipo:** Jose Cancino (CEO, ex-LATAM Airlines) y Franco Romaní (CTO, 8 años de ingeniería).

**Ojo con los números:** los dos archivos citan 40 tours y 13 agencias, heredado del PRD. Está desactualizado e inflado. Los números salen de este documento, no del PRD. Ver la entrada del 2026-08-13 en `docs/decisiones.md`.

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
| `USER` | **Mock residual.** Ver la checklist de arriba. |
