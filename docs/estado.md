# Estado del proyecto

> Se sobrescribe al cerrar cada tanda, en el mismo commit del trabajo.
> Última actualización: 2026-08-13 (verificado contra el repo y contra la DB de producción)

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

Nada arrancado.

- **Auditoría tipográfica del demo, completada el 2026-08-13** (`docs/audits/2026-08-13-typography-audit.md`). Investigación read-only: **21 hallazgos (8 alta, 10 media, 3 baja), ninguno aplicado.** El hallazgo principal es un bloque muerto de la plantilla de Vite en `src/index.css:6-45` que hoy controla el `font-size` del root, el interlineado base, el `letter-spacing` global y el color de los `h2` del demo (el color viene del mismo bloque `.app-demo`, unas líneas más abajo). Aplicar cualquier cosa toca `src/index.css` y `src/AppDemo.jsx`, y el documento lista 10 riesgos de regresión: leerlos antes de arrancar.

Estos dos ítems vienen del **título de una tanda del 2026-08-13, "Refina generador de IA y fix de fecha en demo"**. La tanda nunca se detalló: no quedó escrito qué había que refinar ni cuál era el bug. Son el título y nada más.

- **Refinar el generador de descripciones con IA.** Se refiere a `POST /api/ai/generate-description` (y probablemente a `generate-quechua`), que están listos en backend pero todavía no enchufados a la UI de `NewTourView`. No se sabe si "refinar" significaba mejorar el prompt, conectarlo a la UI, o las dos cosas.
- **Fix de fecha en el demo.** No hay síntoma registrado ni pantalla identificada. Hay varios candidatos posibles (el calendario de reserva, `scheduledAt`, las fechas Lima de las salidas), y sin el síntoma no se puede saber cuál era.

**Los dos hay que definirlos o eliminarlos.** Si al leer esto nadie recuerda a qué se referían, borralos: un pendiente que nadie puede accionar solo genera ruido en cada tanda.

## Bugs abiertos

Ninguno registrado.

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
