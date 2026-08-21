# Estado del proyecto

> **El presente. Se lee al empezar cada tanda y se actualiza en el mismo commit al cerrarla.**
> Última actualización: 2026-08-21.
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
| 3 | Modal de cuenta en el checkout, navegación abierta | 2 ✅ | ✅ en `main` |
| 4 | Eventos del embudo | 3 ✅ | ✅ **investigada el 2026-08-17: no se instrumenta nada.** Ver abajo |
| 5 | Meta tags por tour, más la metadata obligatoria del formulario | 2 ✅ | ✅ en `main`. `robots.txt` y `sitemap.xml` van con el switch |
| 5B | Activar un tour exige la metadata mínima, y el panel avisa antes | 5 ✅ | ✅ en `main` |
| 6 | Día del switch: `BASE_PATH` a `""` más el rewrite de la raíz | todo | el código es reversible, el SEO no |

**La 3 cerró el 2026-08-17 y está en `main`.** El detalle de las tandas 2, 5 y 5B
está en `docs/historia/2026-08-router-y-urls.md`.

- **La 4 se investigó y la conclusión es que no se instrumenta nada todavía.**
  El router de la tanda 2 ya dejó medidos 3 de los 4 pasos del embudo sin costo,
  y **instrumentar el cuarto hoy no compra nada porque no hay tráfico** (15
  páginas vistas en 30 días, todas del QA propio). El instrumento elegido para el
  día del switch es **darle URL a cada paso del checkout**, que cuesta cero bytes
  y además arregla el bug de abajo. Reporte en
  `docs/audits/2026-08-17-eventos-del-embudo.md`.

**Lo que queda abierto del frente de SEO, y no se toca antes de tiempo:**

- **El `noindex` general de `/demo` YA ESTÁ**, desde el 2026-08-17: una etiqueta
  en `index.html`, la plantilla de la SPA, así que cubre la portada, el buscador
  y cualquier URL huérfana además de las fichas. **Nada bajo `/demo` se indexa.**
  Es una de las dos líneas que se tocan el día del switch.
- **El paso 5 de la tanda 5 tiene TRES piezas, no dos.** Va el día del switch,
  no antes:
  1. **Sacar el `noindex`**: borrar la etiqueta de `index.html`. Las fichas se
     arreglan solas al poner `BASE_PATH` en `""`, porque el prerender decide con
     `NOINDEX = BASE_PATH !== ""`.
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

- **Fase 6B del plan tipográfico, lo que queda de la escala.** La 6A cerró el
  2026-08-18. Son cuatro piezas, con el detalle en
  `docs/plans/2026-08-13-plan-tipografia.md`: el **barrido del piso de 12px
  pantalla por pantalla** (56 declaraciones del CSS y 43 inline por debajo del
  piso, más las 98 que la primera pasada dejó sin rol; seis commits, el panel al
  final porque ahí está el 70% de la deuda inline) · **versalitas y tracking**,
  donde los badges que las conservan son `.tp-st` y `.dsh-bk-s` y no `.st-*` ·
  **el número de rating separado de la estrella**, que es cambio de JSX · y **el
  calendario, solo lo que el piso obliga**. **La primera decisión de la fase** es
  si `--fs-h1` (18/20) y `--fs-h2` (17/18) se sostienen a 1px de distancia en
  móvil.

  **La etiqueta de escasez ya salió de esta fase** (se cerró el 2026-08-18, ver
  "Terminado"), pero deja **la primera excepción conocida al piso de 12px**: esa
  etiqueta no puede cumplirlo. "3 cupos" a 12px mide **45,92px** y en la celda de
  un móvil de 360 hay **36** disponibles. El techo medido es 9px, y quedó en 8,5
  porque es el que aguanta también la fuente de respaldo. **La 6B tiene que
  decidir** si se documenta como excepción o si el piso obliga a sacar el texto
  de la celda, que es un camino que ya se construyó y se revirtió.

  **Dos cosas vistas de paso en la 6A y sin tocar**, para la pantalla que las
  cubra: **`.app h2{font-weight:400}` quedó muerto** desde la tanda sin serif,
  porque los tres `h2` del demo ya declaran su propio 700 y esa regla existía
  para preservar el render de DM Serif, que solo traía el peso 400 · y
  **`.sr-name` es el único título de fila que trunca**, con `ellipsis` de una
  línea, mientras el resto no trunca y `.gc-t` ahora clampea a dos: **tres
  tratamientos distintos para el mismo problema**.
- **Barrido de padding del Grupo B**, más chico y ya desbloqueado.
- **Pasarela por definir.** Conversación comercial abierta con Mercado Pago, Culqi
  e Izipay. Nada se integra sin aprobación escrita del modelo de custodia. Al
  integrarla se reactiva la pestaña "Ingresos" del dashboard, hoy oculta. Ver
  `docs/decisiones.md`.

## Terminado y mergeado

- **El frente de la ubicación, CERRADO COMPLETO (2026-08-19)**: un viajero en Cajamarca veía tours de Lima. Se resolvió en tres piezas y **cada una atacó un problema distinto**, que es lo que conviene no mezclar al leerlo:
  - **La región del tour, CERRADA (2026-08-19)**: el campo Ubicación de texto libre pasó a **ciudad + selector de región** contra los 24 departamentos de `lib/cities.js`, con validación en `parseTourInput` que **normaliza antes de comparar**. Medido: de los 49 tours **1 quedaría rechazado y 0 activos**, así que no hubo migración. **Callao NO se agregó como departamento 25**, y el motivo está escrito al lado de la lista: el viajero no lo piensa separado de Lima, y un tour con esa región se caería del agrupamiento. Se cerró además **el tercer parseo por coma**, el que alimentaba el prompt de la IA. Detalle en `docs/plans/2026-08-19-selector-de-region.md`.
  - **Cobertura.** La lista de ciudades estaba escrita **tres veces y las tres eran distintas**, y ninguna tenía Cajamarca. Ahora vive una sola vez en `lib/cities.js` y los grupos son **departamentos derivados de los tours que existen**, con la IP mapeada por código ISO 3166-2. **De 35 de 42 tours alcanzables se pasó a 42 de 42**, y los 7 que faltaban incluían los 5 de MEGATOURS: el catálogo entero de la única agencia real era invisible en la única sección que ordena por ubicación.
  - **Honestidad.** El título decía "Tours en Lima · cerca de ti" con la misma cara cuando acertaba y cuando no. **Se midió equivocado**: con José en Lima y sin VPN, la IP reporta Arequipa. El título dejó de afirmar dónde estás y pasa a decir qué estás viendo.
  - **Precisión.** Es lo único que ataca el error de la detección: **se pregunta la ciudad la primera vez** y se recuerda, y si la IP cambia respecto de lo que decía cuando el viajero eligió, **se le ofrece** el cambio. Comparar contra su elección lo habría castigado en cada visita por un error nuestro. **Y desde el 2026-08-19 el default es Lima FIJO**: la detección ya no lo elige, porque Lima es el origen más probable (~30% de la población) y un default que se va a equivocar igual conviene que se equivoque hacia ahí. Eso arregló además un salto que nadie había reportado: la sección cambiaba sola cuando `/api/geo` respondía.

  **Lo que NO se resolvió, y no se resuelve con código: la IP puede reportar mal el departamento.** Es del proveedor, no del mapeo. **Lo que cambió es que ahora el viajero puede corregirlo y la corrección se recuerda.** Diagnóstico, mediciones y las opciones descartadas en `docs/audits/2026-08-19-ciudad-no-detectada.md` y `docs/plans/2026-08-19-preguntar-la-ciudad.md`.

- **Recuperar contraseña (2026-08-19)**: no existía el flujo y había que resolverlo a mano desde Supabase. **El hallazgo que ordenó la tanda: el enlace del correo ES un inicio de sesión**, así que sin manejarlo el usuario volvía logueado y nadie le pedía la contraseña nueva. Va con el borrador del checkout persistido, que además resolvió la precondición del pendiente de Google. Detalle y mediciones en `docs/audits/2026-08-18-recuperar-contrasena.md`.

- **El calendario de escasez, tres arreglos (2026-08-18)**: el texto se acortó a "1 cupo" y subió a 8,5px (el desborde lo causaba el largo, no el tamaño), la etiqueta bajó al fondo de la celda y de paso se corrigió una desalineación de 4,46px que nadie había visto, y la tarjeta lleva un tope de 372px en los dos calendarios. Se descartaron con medición el punto de color y sacar el texto de la celda. Todo el porqué en `docs/decisiones.md`.

- **La escala tipográfica en tokens, Fase 6A (2026-08-18)**: los nueve tokens declarados y consumidos por los display. La relación entre título de sección y de tarjeta pasó de **1,46 a 1,33 en móvil y de 1,64 a 1,47 en escritorio**, dentro de la banda de Airbnb, Booking y GetYourGuide. Tres piezas quedaron fuera de la escala a propósito y está escrito por qué en el CSS. Detalle en `docs/plans/2026-08-13-plan-tipografia.md`.

- **El texto de las tarjetas de tour va a la izquierda (2026-08-18)**: como en Airbnb, Booking y GetYourGuide, medidos. **Fueron cinco declaraciones y no una**: las filas de metadatos y de precio son flex y se centran con `justify-content`, que `text-align` no toca. Queda un comentario en el CSS para que nadie las simplifique.

- **El producto sale del serif (2026-08-18)**: Plus Jakarta Sans 700 en los 19 títulos que eran DM Serif, con el tamaño corregido por altura de x (factor 0,884). **El logo se queda en DM Serif y es la única excepción.** El camino de vuelta y el detalle, en `docs/decisiones.md`. Falta el recorte del import a `text=finde.`, que va **el día del switch** porque hoy la hoja de fuentes la comparte la landing: son 16 kB y es la cuarta pieza de esa checklist.

- **Navegación abierta y modal de cuenta (tanda 3, 2026-08-17)**: `/demo` pelado abre el catálogo, no el login, y el muro de cuenta se movió al checkout con **un solo modal** que sirve a los cuatro puntos de entrada. Entrar no desmonta nada. Detalle en `docs/historia/2026-08-navegacion-y-cuenta.md`.

- **El copy de viajero deja de hablar de "salidas" (`de73b14`, 2026-08-17)**: "salida" es la fila de `Departure` que ve la agencia, no el vocabulario del viajero. La regla ya vive en `.claude/rules/reservas.md`.

- **SEO de las fichas (tandas 5 y 5B, 2026-08-17)**: cada tour tiene su HTML estático con title, description y `og:` propios, con `noindex` mientras el producto viva en `/demo`. La metadata mínima es obligatoria **por los dos caminos**, con la condición compartida en `lib/tour-publish.js`. Detalle en `docs/historia/2026-08-router-y-urls.md`.

- **tours-db-i18n**: tours migrados de array hardcoded a DB, con embeddings Voyage, 6 categorías sincronizadas con el enum, skeleton loading y dropdown AI_SUGGESTIONS.
- **M1 Auth**: Supabase Auth email + password, sesión persistente en localStorage, `isOperator` derivado de la DB.
- **M2 Tours de la agencia**: CRUD real, upload de imágenes a Supabase Storage por signed URL (el navegador sube directo a Storage y esquiva el límite de ~4.5MB de Vercel).
- **Búsqueda en dos fases**: la fase 2 genera el reasoning sobre los ids ya elegidos, con los datos firmados de la fase 1 (`lib/search-sig.ts`, HMAC). `SEARCH_PHASE_SECRET` cargada en Development, Preview y Production.
- **Inventario y salidas**: modelo `Departure`, enums `SalesMode` / `BookingStatus` / `DepartureStatus`, motor en `lib/inventory.ts` con materialización perezosa y toma de cupo atómica, panel de salidas con confirmación en lote.
- **Correos**: Resend, y desde el 2026-08-18 **los transaccionales y los de auth de Supabase salen por el mismo proveedor** (SMTP propio configurado). `RESEND_API_KEY` está cargada en **los tres entornos**. Ver la advertencia de QA en `CLAUDE.md` y el presupuesto compartido de 100 diarios en `docs/pendientes-producto.md`.
- **Seis tandas chicas del flujo de reserva, todas en `main`**: cierre de venta en las dos puntas para `SOLICITUD`, rechazo puntual además del lote, documento del viajero en el panel de su agencia, datos del pasajero agrupados, modo de venta visible al reservar, y la jerarquía visual de escasez del calendario. **Las barandas de todas viven en `.claude/rules/reservas.md`**, que se carga sola.
- **`/api/me?scope=operator`**: camino liviano que resuelve la identidad de agencia sin la query de bookings ni el vencimiento perezoso (`4e81cb0`).
- **Las tandas 0, 1, 1B, 1C y 2, más el sello de verificación y el procesamiento de fotos**: todas en `main` y ya listadas en la tabla de arriba. Su medición completa (los 11,8 MB de las tandas de imágenes, el costo de la analítica, el router y el sello) vive en `docs/historia/`.

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
| **`SearchLog` guarda el texto completo de 272 búsquedas** | El criterio de loguear solo el largo aplica a los logs de consola, **no a esa tabla**. Alguien puede buscar algo que lo identifique. Truncar, anonimizar o dejar: decidir antes del lanzamiento |
| **El catálogo en escritorio usa 1000px de 1440** | Es lo que limita las columnas a cuatro, **no la caja de las tarjetas**, que fue la sospecha original y quedó descartada con medición. Pregunta de producto: más opciones por pantalla o tarjetas más grandes |
| **El objeto del panel se arma en CUATRO lugares sin compartir código** | `mapTourFromApi`, cargar la lista, guardar y crear enumeran los mismos campos a mano, y **ya se cobró un bug por lugar**: `pendingRequests` en la lista blanca, `shortPitch` al guardar, `shortPitch` y `pendingRequests` al crear, y **la ciudad y la región que `loadOperatorTours` descartaba en silencio** (2026-08-19, el selector de región). El de guardar hereda el valor VIEJO y el de crear deja `undefined`: las dos formas fallan sin error. **Cuatro veces el mismo error deja de ser prolijidad**: extraer una sola función es el arreglo de raíz |
| **La foto mensual de la analítica necesita disparador** | La ventana de Hobby es de **un mes**: lo que no se copia se pierde para siempre. La propuesta es un renglón fechado en este archivo, que se lee al empezar cada tanda |

**Auditoría de identidad visual, pendiente.** José, mirando el home, dijo que los
títulos de sección le parecen "hechos por IA", y al conversarlo quedó claro que es
sobre **todo el producto**. **No la cubre la auditoría tipográfica de agosto**:
esa midió mecánica (contraste, tamaños, interlineado), esta es de criterio de
diseño. **No se mide, se juzga.** Siete puntos a cubrir, más tres cosas de
contenido que pesan más que cualquier decisión de diseño. Detalle completo en
`docs/audits/2026-08-16-identidad-visual.md`.

## Bugs abiertos

- **El botón de atrás rompe el checkout entero** (encontrado el 2026-08-17). Los
  cuatro pasos comparten una sola URL, así que volver atrás en el paso de pago no
  retrocede un paso: **saca al viajero del checkout y le tira el formulario**, con
  la fecha, los cupos y sus datos. En móvil el gesto de volver es constante. **Lo
  arregla el mismo cambio que mide el embudo** (URL por paso). Razonamiento
  entero en `docs/pendientes-producto.md`.

## Antes de lanzar a usuarios reales

- [x] **Procesar las fotos en el navegador antes de subirlas.** ~~CONDICIÓN, no mejora.~~ **HECHO el 2026-08-16** (`62a1d1a`), antes de onboardear ninguna agencia real, que era el punto. Registro en `docs/historia/2026-08-rendimiento-imagenes.md`.
- [x] **El SMTP propio: RESUELTO el 2026-08-18.** Resend quedó configurado y verificado como remitente de los correos de auth de Supabase. Los números, medidos: el remitente por defecto son **2 correos por hora para todo el proyecto** y **solo entrega a direcciones de la organización**; con SMTP propio son **30 por hora**, ajustables. Se probó con una invitación a un Gmail, que con el remitente viejo habría fallado con "Email address not authorized". El plan gratuito de Resend da **100 por día y 3.000 por mes**, y **esos 100 se COMPARTEN con los correos transaccionales que la app ya manda**: el presupuesto es uno solo, y con dos correos por reserva son unas **30 reservas más 40 registros por día**. Desbloquea las tres cosas que estaban atadas: **reactivar "Confirm email", la recuperación de contraseña y el código de 6 dígitos del modal**. Las tres siguen siendo decisión de producto, no interruptor: ver `docs/pendientes-producto.md`.
- [x] **Recuperar contraseña: CERRADO el 2026-08-19 y en `main`.** Ver la entrada en "Terminado y mergeado".
- [x] **Las plantillas de correo, en español: PEGADAS el 2026-08-18.** Las cuatro (Invite user, Confirm sign up, Magic Link y Reset password) están guardadas en Authentication > Emails > Templates, en español y con la identidad de Finde. El HTML vive en `docs/plantillas-correo-supabase.md`.
- [ ] **Verificar en un cliente de correo las tres plantillas que todavía no se pueden disparar.** **Probada de verdad hay UNA: Invite user, en Gmail, y se ve bien.** Es la única que hoy se puede mandar. Las otras tres no dependen de las plantillas sino de flujos que no existen: **Confirm sign up** necesita apagar `mailer_autoconfirm`, **Magic Link** necesita el flujo de OTP y **Reset password** necesita el de recuperación, y ninguno de los dos está en el código. **Cada una se verifica cuando se implemente su flujo, no antes**, y hasta entonces no cuenta como probada. Falta además **Outlook de Windows y Apple Mail**, en las cuatro: solo se probó Gmail.
- [x] **El sello de verificación falso: CERRADO el 2026-08-16.** Fue el único bloqueante de lanzamiento y El registro completo está en `docs/historia/2026-08-sello-verificacion.md`. Resultado: **42 tours visibles y MEGATOURS como la única agencia con sello, que es la única que lo tiene de verdad.**
- [ ] **Borrar los datos de prueba.** Inventario concreto:
  - Tours de `hola@finde.pe` ("Tour Prueba", sin verificar): **dos**, `"prueba"` (2026-07-28) y `"prueba manual"` (2026-08-13). **Los dos están pausados**: `"prueba manual"` ya lo estaba y `"prueba"` se pausó el 2026-08-17, porque seguía en el catálogo público con 15 caracteres de descripción. Falta borrarlos.
  - Las **43 reservas** son de prueba salvo revisión caso por caso. Cuentas que las crearon, con su conteo al 2026-08-17: `demo@finde.pe` (16), `test@finde.pe` (12), `hola@finde.pe` (11), `megatours@finde.pe` (2) y **`totemhubapp@gmail.com`** (2, ojo: esta no es `@finde.pe`. Y el criterio **nunca** es el dominio: ver `.claude/rules/api-y-schema.md`, porque MEGATOURS también es `@finde.pe`). Esas cinco cuentas cubren las 43, no queda ninguna de origen desconocido. **La agencia MEGATOURS no se toca** (ver el ítem de coordinación en esta misma lista); lo que se borra son las reservas de prueba hechas desde esa cuenta y las que caen sobre sus tours.
  - Las **25 salidas**, incluidas **8** del tour "prueba".
  - Agencias sin tours creadas en pruebas: `test@finde.pe` (jose luis cancino cuellar), `op-test@finde.pe` (Tours Test), `totemhubapp@gmail.com` (Totem Travels).
  - Borrar reservas antes que tours: el FK `Booking.tourId` es `onDelete: Restrict` y el DELETE responde 409 si el tour tiene reservas.
- [ ] **Emisión electrónica de boletas** (Nubefact, Bsale o similar). Desde la v1.6 Finde le emite la boleta al viajero por el PVP, así que **sin esto no hay venta real**. **Suma endpoints y hoy hay 12 de 12 funciones en Vercel**: hay que resolver el slot, no solo contratar el emisor. Ver `docs/finde-reglas-negocio-v1_6.md`, secciones 2.2.1 y 9.6.
- [ ] **Inscribir a Finde en el Directorio Nacional MINCETUR como agencia minorista** con canal digital exclusivo. Desbloquea el distintivo oficial y la denominación en la landing.
- [ ] **Declaración jurada de adhesión al Código de Conducta contra la ESNNA**, firmada por el titular de Finde, más el afiche visible en la web. **Es de Finde, no de las agencias proveedoras.**
- [ ] **Verificar régimen tributario y factura de muestra de las 14 agencias registradas.** Una agencia que no pueda facturar con IGV **deja la reserva en ~S/0.56 de margen en vez de S/15.21**, así que esto es economía, no papeleo.
- [ ] **Pedir y archivar los certificados de aventura y canotaje** de los tours publicados que caigan en esas categorías. **Es fiscalizable**: sin certificado archivado, el tour se pausa.
- [ ] **Coordinar la operación con MEGATOURS antes de que entre una reserva real.** `megatours@finde.pe` es **agencia piloto confirmada, no dato de prueba**: no se borra. Sus 5 tours de Cajamarca (City Tour, Cumbe Mayo, Granja Porcón, Otuzco, Namora) están **públicos hoy en finde.pe**, pero la coordinación operativa con la agencia todavía está pendiente. O sea: si un viajero reserva hoy, le llega un correo a alguien que no lo está esperando y no sabe qué hacer con eso. Hay que cerrar la coordinación, o pausar los tours mientras tanto.
- [ ] **Sacar el mock `USER`** de `src/AppDemo.jsx` ("Alejandra Quispe"). Ya no se usa para el saludo, pero sigue siendo el fallback en tres lugares: `buildWhatsAppLink`, `handleAddLocalTrip` y `handleReview`. Si alguna vez cae en ese fallback, el usuario ve un nombre inventado.
- [ ] **Sacarle el sello y el MINCETUR inventado a la cuenta de demos.** `demo@finde.pe` ("Descubre el Perú") está con `verified: true` y `mincetur: "REG12345"`, que **es un número inventado**. Hoy no se ve, y por una sola razón: sus **5 tours están todos pausados**, así que `gateOperatorMincetur` nunca lo publica. **Eso no es una contención, es una casualidad.** Reactivar cualquiera de esos 5 tours publica un registro MINCETUR falso en la ficha, que es exactamente lo que la regla de "nada falso visible al usuario real" prohíbe, y lo mismo que se limpió el 2026-08-16 en las otras ocho agencias (`38823ed`). La cuenta sirve para demos y se queda; lo que sale es el sello, o el número, o los dos. **Decidir cuál antes de volver a activar un tour de esa cuenta.**

## Inventario real de la base (2026-08-17)

Local, dev.finde.pe y producción usan **la misma base**. Estos son los números
reales, no los del PRD. Recontados el 2026-08-17 contra la base:

- **49 tours**, de los cuales **42 activos** y visibles en el catálogo público.
- **14 agencias**, y **solo 2 verificadas**: MEGATOURS (real) y "Descubre el Perú"
  (la cuenta de demos, que ya no tiene tours públicos, **pero sigue con el sello
  y un MINCETUR inventado**: ver la checklist de arriba).
- **43 reservas**. Casi todas de prueba. Por estado: 21 vencidas, 17 confirmadas,
  4 rechazadas, 1 en solicitud.
- **25 salidas** materializadas, varias con cupo tomado.
- Categorías de los activos: cultural 15, adventure 14, nature 9, gastronomy 2, mystic 2.
- `FeaturedSearch`: 33 filas. `SearchLog`: 272 filas.
- Bucket `tour-images`: **49 archivos, 36,8 MB de 1 GB**, y **13 de esos archivos
  no los referencia ningún tour**. Ver abajo.
- Agencias **sin dueño** (seed, sin `userId`): **8**. Con dueño real: **6**.

**De los 42 tours públicos, 37 son del seed y se borran en el lanzamiento.**
Quedan los 5 de MEGATOURS.

### Las fotos huérfanas tienen número, y el número es para que se vea si crece

**36 de los 49 archivos del bucket los referencia algún tour. Los otros 13 no los
referencia nadie**, y ningún camino de limpieza los toca. Entre el 2026-08-16 y el
2026-08-17 el bucket pasó de 44 archivos a 49 **sin que se creara ningún tour
nuevo**. **Al actualizar este inventario, recontar las dos cifras**: la distancia
entre ellas es la deuda, y es la única forma de saber si crece.

## Estado de los datos: real vs mock

Casi todo lo que antes era mock ya se eliminó. Lo que queda:

| Qué | Estado |
|---|---|
| Notificaciones | **Real.** Se derivan de reservas reales (el `useMemo` `derivedNotifs` del componente `AppDemo`), de `trips` y `opBookings`. La constante `NOTIFS` ya no existe. |
| Reservas del panel | **Real.** `GET /api/operators/me/bookings`. `OP_BK` eliminado en M3. |
| Ingresos del dashboard | **Eliminado.** `EARN` borrado junto con la tab "Ingresos", que está oculta hasta que haya pasarela. |
| Reviews | **Parcial, no mock.** `generateMockReviews` fue eliminado. Un tour sin reseñas muestra "Nuevo". Las reseñas que deja el viajero viven solo en el estado de sesión: **se pierden al recargar**. No existe modelo `Review` en la DB. |
| Mis viajes | **Real.** Salen de `GET /api/me`. `MY_TRIPS` eliminado. |
| Rating del dashboard | **Oculto** (bloque `.dsh-sts` del componente `DashView`, donde quedó el comentario en lugar del marcado), porque los ratings del seed son siembra, no reseñas reales. |
| `USER` | **Mock residual.** Ver "Antes de lanzar a usuarios reales". |

## Material de postulaciones

Emprende Turismo TEC 2026 ya terminó. Queda el material y sirve de base para la próxima: `docs/pitch-demoday-eturismo-tec-2026.md` (guion, deck y Q&A) y `docs/finde-onepager.html` (leave-behind, se exporta con Cmd+P a PDF con gráficos de fondo).

**Equipo:** Jose Cancino (CEO, ex-LATAM Airlines) y Franco Romaní (CTO, 8 años de ingeniería).

**Ojo con los números:** los dos archivos citan 40 tours y 13 agencias, heredado del PRD. Está inflado. Los números salen de este documento.

## Dónde está el resto

Este archivo es **el presente**. El mapa de dónde vive cada cosa
(`docs/historia/`, `docs/decisiones.md`, `docs/audits/`, `docs/migrations/`,
`.claude/rules/`) está en `CLAUDE.md`, que se carga solo en cada sesión, así que
acá no se repite.
