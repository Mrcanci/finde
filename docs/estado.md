# Estado del proyecto

> Se sobrescribe al cerrar cada tanda, en el mismo commit del trabajo.
> Última actualización: 2026-08-15 (verificado contra el repo y contra la DB de producción)

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
- **Los endpoints de IA exigen perfil de agencia** (`6e6fb83`). Tanda 0 del camino al lanzamiento, cerrada post-QA el 2026-08-15.
- **Vercel Web Analytics** (`8681dee`). Tanda 1, reducida a eso por decisión de José. Costo medido: unos 2,3 kB comprimidos y cero bloqueo del hilo principal.
- **La landing deja de cargarse en `/demo`** (`d916e65`). Tanda 1B, cerrada post-QA el 2026-08-16. Bytes de `/demo`: **6.528.216 a 232.992, un 96,4% menos**.
- **Las fotos de destinos de la landing, a 800 px** (`5575328`). Tanda 1C, cerrada post-QA el 2026-08-16. Bytes de la landing: **6.526.560 a 976.569, un 85% menos**.
- **Las fotos que suben las agencias se achican en el navegador** (`62a1d1a`). Cerrada post-QA el 2026-08-16. Era la **condición** que imponía el plan Free de Supabase: una foto real de 4.062 kB sube como **203 kB**.

## En curso

**Frente abierto el 2026-08-15: navegación abierta y camino al lanzamiento.**
Ver la decisión del 2026-08-15 en `docs/decisiones.md` (`/demo` se queda hasta el
lanzamiento, y cada tanda deja el switch más cerca). La investigación que lo
arrancó cubrió gates de sesión, permisos del backend y RLS; el hallazgo central
es que **el backend ya está abierto y la base no necesita nada**: lo que falta es
frontend, y sobre todo **URLs**, que hoy no existen.

**Cerradas y en `main`: las tandas 0, 1, 1B y 1C.** Los endpoints de IA con auth,
Vercel Analytics, la landing que deja de cargarse en `/demo` y las fotos de la
landing a 800 px. Cada una tiene su sección más abajo con los números.

**Las dos tandas de rendimiento no estaban planificadas: salieron de medir.** La
1B apareció al medir el costo de la 1, y la 1C al analizar lo que la 1B destapó.
**Entre las dos sacaron 11,8 MB de peso**, y de paso dieron vuelta la prioridad
que el documento tenía anotada: **lo que pesa son imágenes, no JavaScript.**

**Lo próximo de este frente es la tanda 2, el router con `BASE_PATH` y la URL por
tour, y no está arrancada.** No se empieza sin visto bueno explícito, y arranca
con las tres definiciones que pide la decisión de la URL del tour.

**Lo que queda pendiente y no es una tanda de la secuencia**, en orden de
gravedad:

1. ~~El sello de verificación falso.~~ **CERRADO el 2026-08-16.** Era el único
   bloqueante de lanzamiento. Sección propia, ahora como registro.
2. ~~Procesar las fotos que suben las agencias.~~ **RESUELTO el 2026-08-16 y en
   `main`.** Era la condición que imponía el plan Free. Sección propia, ahora
   como registro de lo que se hizo.

**La secuencia hasta el lanzamiento**, en orden y con sus dependencias:

| # | Tanda | Depende de | Reversible |
|---|---|---|---|
| 0 | ✅ Endpoints de IA con auth, **en `main`** | nada | sí |
| 1 | ✅ Analítica base: SOLO Vercel Analytics (reducida), **en `main`** | nada | sí |
| 1B | ✅ La landing no se carga en `/demo`, **en `main`** | salió de medir la 1 | sí |
| 1C | ✅ Fotos de la landing a 800 px, **en `main`** | 1B | sí |
| 2 | Router con `BASE_PATH` y URL por tour | 1 | sí |
| 3 | Modal de cuenta en el checkout, navegación abierta | 2 | sí |
| 4 | Eventos del embudo (`booking_started`, `auth_prompted`, ...) | 3 | sí |
| 5 | Meta tags por tour (prerender en build), `robots.txt`, `sitemap.xml` | 2 | sí |
| 6 | Día del switch: `BASE_PATH` a `""` más el rewrite de la raíz | todo | el código sí, el SEO no |

La tanda 2 arranca con las tres definiciones que pide la decisión de la URL del
tour (`docs/decisiones.md`): caracteres del sufijo, normalización del título a
slug, y qué pasa con un slug vacío.

**Lo próximo es la Fase 6 del plan tipográfico**, la escala en tokens, que no se
empieza sin visto bueno explícito. Antes que ella conviene hacer el **barrido de
padding del Grupo B**, que la Fase 5 acaba de desbloquear y es más chico. Los dos
quedan detrás del frente de lanzamiento, que tiene fecha y ellos no.

**Y la Fase 6 tiene ahora un requisito previo: la elección tipográfica.** Ver
"Auditoría de identidad visual, pendiente" más abajo. La Fase 6 asigna tamaños e
interlineados por token, y cada tipografía tiene su propia altura de x: **si la
fuente cambia después, hay que recalcular la escala entera.**

### Tanda 1, REDUCIDA a Vercel Analytics (decisión de José, 2026-08-15)

**La tanda 1 se redujo a instalar Vercel Web Analytics. Nada más.** Decisión de
José: **la experiencia de usuario va primero y no se suma peso sin certeza de que
valga la pena.**

**PostHog se pospone, no se descarta.** El motivo no es solo el peso: **hoy no
mediría nada útil.** Los eventos que lo justifican (dónde se cae la gente en el
checkout) dependen del modal de cuenta, que es la **tanda 3**. Instalarlo ahora
sería cargar peso para leer un dashboard vacío.

**Queda como decisión pendiente, a tomar antes del switch**, con la app ya
terminada y **con la línea base de esta tanda como referencia**. El criterio para
aceptarlo o rechazarlo se fija en ese momento, con números reales, no ahora.

**Si PostHog no entra, la alternativa es armar los embudos con consultas a la
base**: más trabajo de nuestro lado, **cero peso en el cliente**. No es un plan B
degradado, es un intercambio distinto.

**Lo que Vercel Analytics sí da, y alcanza para varias de las métricas:**
visitantes, páginas vistas y **origen del tráfico**. Ese último es el que **prueba
que Google y WhatsApp traen gente**, que es exactamente el argumento del canal
barato. Lo que no da es el embudo interno del checkout.

#### Línea base medida, contra la que se evalúa PostHog después

Medido el 2026-08-15 con Lighthouse 12.8.2, preset **mobile**: 1638 Kbps de
bajada, 150 ms de RTT y **CPU 4x más lenta** (4G y gama media). Cinco corridas por
lado sobre `npm run build` servido con `vite preview`; se reportan **medianas de
las corridas válidas**, porque una de cada cinco falla con `NO_FCP`.

| Métrica | Antes | Después | Delta |
|---|---|---|---|
| Bundle JS (gzip) | 183.19 kB | 184.23 kB | **+1.04 kB** |
| Bytes transferidos | 6.527.044 | 6.528.216 | **+1.172 bytes** |
| LCP (mediana) | 6.728 ms | 6.916 ms | +188 ms |
| TTI (mediana) | 7.032 ms | 7.231 ms | +199 ms |
| Total Blocking Time | 0 ms | 0 ms | **sin cambio** |

**Los deltas de LCP y TTI están DENTRO del ruido de medición y no se pueden
atribuir al cambio.** Solo del lado "antes", el LCP osciló entre 6.313 y 6.836 ms,
o sea **523 ms de dispersión entre corridas**: más del doble que el delta. Lo que
sí es exacto y reproducible es el peso: **+1,04 kB comprimidos y cero tiempo de
bloqueo del hilo principal.**

A eso hay que sumarle **el script que sirve Vercel en runtime**, que no está en el
bundle y por eso no aparece arriba: **2.495 bytes, 1.271 comprimidos**, medidos
contra un despliegue real de Vercel. En local ese pedido da 404 y no pasa nada.

**Total honesto del costo de esta tanda: unos 2,3 kB comprimidos y cero bloqueo.**

**La ficha de tour no se pudo medir por separado, y esa imposibilidad ES el
hallazgo:** hoy no es una carga de página, es un cambio de `useState`, así que no
tiene URL y Lighthouse no la puede abrir. Es justo lo que resuelve la tanda 2.
Hasta entonces, lo medible es cuánto agrega en red: las portadas reales del
catálogo público pesan **entre 94 kB y 977 kB, con mediana de 276 kB**, y una
ficha con galería de tres fotos ronda los **800 kB**.

#### Hallazgo grande que salió de medir: se arregló en la tanda 1B

**Abrir `/demo` descargaba 6,1 MB de imágenes de la landing que el usuario nunca
ve**, el 96% del peso de la carga. Está **arreglado**, ver la tanda 1B más abajo.

La causa estaba en `src/App.jsx`: `showDemo` arrancaba en `false` y se corregía
dentro de un `useEffect`, o sea **después del primer render**. En ese render se
montaba `<Landing />`, el navegador disparaba la descarga de sus imágenes, y un
instante después React la desmontaba. Las imágenes ya habían salido.

**ESLint lo venía marcando** con `react-hooks/set-state-in-effect` en
`src/App.jsx:13`, sin que nadie atara el warning a su consecuencia.

### Tanda 1B, CERRADA: los 6,1 MB que se descargaban y nadie veía

**En `main` desde el 2026-08-16 (`d916e65`), post-QA.** José la validó en
dev.finde.pe **junto con la 1C**, que es como correspondía: las dos tocan las
mismas imágenes desde puntas distintas.

> **El QA anterior quedó anulado y se rehízo.** El primer "QA OK" se dio sobre
> `dev` **sin** esta rama mergeada, así que lo que se había probado era el estado
> anterior. Se detectó antes de subir nada a `main`. **Vale como regla: un QA sobre
> `dev` solo cubre lo que está EN `dev`.**

**Sale directo de medir la tanda 1.** Es más importante que todo lo que había
anotado de rendimiento: **6.130 kB contra los 184 kB del bundle**, que era el
pendiente que figuraba.

**El arreglo, en `src/App.jsx`:** la URL se lee **durante el render** en vez de en
un `useEffect`, así `<Landing />` no se monta nunca cuando la URL es `/demo`. Se
fueron el `useState` y el `useEffect`; queda una función `isDemoUrl()` y un
ternario. **`Landing.jsx` no se tocó.**

**El warning de ESLint desapareció**, que era la verificación pedida:
`react-hooks/set-state-in-effect` ya no aparece y `src/App.jsx` salió entero del
reporte. De 4 problemas a 3, todos preexistentes.

#### Medición, mismo método que la tanda 1

Lighthouse 12.8.2, preset mobile (1638 Kbps, 150 ms de RTT, CPU 4x más lenta).
**Seis corridas válidas por lado**, con flags anti-throttling de Chrome que
eliminaron los `NO_FCP` que ensuciaban las primeras tandas.

| Métrica | Antes | Después | Delta |
|---|---|---|---|
| **Bytes transferidos** | 6.528.216 | **232.992** | **-6.295.224 (-96,4%)** |
| Peticiones | 21 | 13 | -8 |
| Imágenes de la landing | 7 (6.130 kB) | **0** | todas |
| LCP | 5.859 a 12.531 ms | **3.510 a 3.615 ms** | estable en 3,6 s |
| TTI | 6.204 a 12.853 ms | **3.510 a 3.615 ms** | estable en 3,6 s |
| Score de rendimiento | 70 a 77 | **87 a 89** | +13 |
| Total Blocking Time | 0 ms | 0 ms | sin cambio |

**El LCP no solo baja: deja de ser bimodal.** Antes saltaba entre ~5,9 s y ~12,5 s
según cómo cayera la carrera por el ancho de banda con la imagen de 4,3 MB;
ahora las seis corridas caen dentro de **105 ms entre sí**. Un producto que a
veces tarda el doble es peor que uno lento y predecible.

El elemento LCP es el mismo en los dos casos: la pantalla de carga con el
logotipo. O sea que esos 6,1 MB **retrasaban el primer dibujo de la app misma**,
no solo el de una foto que nadie mira.

### El análisis de las imágenes de la landing, que dio origen a la tanda 1C

> **Esta sección quedó como el diagnóstico. La ejecución está en "Tanda 1C, HECHA
> el 2026-08-16" más abajo, con los números finales.** Se conserva porque explica
> cómo se eligió la opción, no solo cuál se eligió.

**El arreglo de la tanda 1B no tocaba este problema.** `finde.pe`, que es lo que
Google indexa, seguía descargando lo mismo: medido, **6.526.560 bytes y un LCP de
entre 5,6 y 12,8 segundos**. La tanda 1C lo bajó a **976.569 bytes**.

#### Las nueve imágenes

| Archivo | Peso | Dimensiones | ¿Se usa? |
|---|---|---|---|
| `oxapampa.jpg` | **4.287 kB** | 5184x3456 | sí |
| `arequipa.jpg` | 825 kB | 2560x1674 | **no, huérfana** |
| `rajuntay.jpg` | 565 kB | 1920x1440 | sí |
| `paracas.jpg` | 425 kB | 1920x1280 | sí |
| `kuelap.jpg` | 357 kB | 1920x1080 | sí |
| `colca.jpg` | 227 kB | 1920x1080 | sí |
| `mancora.jpg` | 152 kB | 1200x675 | **no, huérfana** |
| `chachapoyas.jpg` | 83 kB | 540x360 | sí |
| `cusco.jpg` | 34 kB | 330x220 | **no, huérfana** |

Más tres mockups PNG: 433 kB en total, de los que solo uno carga al inicio.

**Tres archivos no los referencia nadie** (`arequipa`, `cusco`, `mancora`): son
**1.011 kB muertos en el repo**. Borrarlos no ahorra ni un byte al usuario, porque
nunca se descargaban, pero limpia el repositorio y no toca `Landing.jsx`.

**El dato que ordena todo:** la tarjeta de destino se renderiza a **179x119 píxeles
CSS** en móvil. `oxapampa.jpg` mide 5184x3456. Lighthouse calcula que el
**99,6% de esos 4,3 MB es desperdicio puro**.

#### Las cuatro opciones, con ahorro MEDIDO

Los tres primeros números salen de los audits de Lighthouse sobre la landing real;
el cuarto, de recomprimir los archivos de verdad con `cwebp` y `ffmpeg`.

| Opción | Ahorro | Veredicto |
|---|---|---|
| **Carga diferida** de lo que está bajo el pliegue | **0 kB** | **Ya está hecha.** `loading="lazy"` está puesto en `Landing.jsx:199` y `:462`, y el audit `offscreen-images` da 0. No hay nada que ganar |
| **Recomprimir** sin cambiar resolución | **9 kB** | **Inútil.** Los JPEG ya están razonablemente comprimidos: el problema no es la calidad, es el tamaño |
| **Convertir a WebP** sin cambiar resolución | **1.945 kB** | Ayuda, pero es el premio chico |
| **Servir el tamaño real** (redimensionar) | **5.995 kB** | **Es el 90% del problema.** Gana por lejos |

**Experimento propio, sobre los 6 destinos que sí se usan:**

| Variante | Peso total | Ahorro |
|---|---|---|
| Como están hoy | 5.946 kB | |
| Redimensionadas a 800 px, **siguen siendo JPEG** | **566 kB** | **5.380 kB (90,5%)** |
| Redimensionadas a 800 px y pasadas a WebP | 460 kB | 5.485 kB (92,2%) |
| Redimensionadas a 1200 px y pasadas a WebP | 909 kB | 5.037 kB (84,7%) |

#### La recomendación que se ejecutó, y por qué no hizo falta autorización

**El 90,5% del ahorro se conseguía sin tocar una línea de `Landing.jsx`:**
**reemplazar los archivos en `public/destinations/` por versiones redimensionadas
a 800 px, con el mismo nombre y la misma extensión `.jpg`**. El JSX sigue
apuntando a las mismas rutas y no se entera. **Es lo que hizo la tanda 1C.**

WebP suma apenas **106 kB más** sobre eso, y `srcset` por tamaño de pantalla suma
todavía menos. Las dos **sí exigirían tocar `Landing.jsx`** (cambia la extensión
del `src`, o hace falta un `<picture>`), y ninguna justifica el permiso por 106 kB.
**Si algún día se abre `Landing.jsx` por otro motivo, se aprovecha el viaje.**

Las dos verificaciones que se exigieron antes de reemplazar, y cómo se cerraron:

1. **Los 179x119 px eran la medición en móvil.** Se midió también en escritorio
   antes de fijar los 800 px: **193x129 px CSS** con viewport de 1350, casi
   idéntico. Con eso, 800 px cubre hasta 4x de densidad de pantalla.
2. **Reemplazar los archivos cambia lo que se ve.** Se armó una comparación de las
   seis, antes y después, a 450 px de ancho (más del doble del tamaño real), y se
   le pasó a José antes de commitear.

**Los mockups son un caso aparte y más chico:** 433 kB que bajan a 256 kB en WebP,
pero eso sí exige tocar el JSX y solo uno de los tres carga al inicio. No vale el
permiso hoy.

### La analítica va primera, pero su fecha límite real es el SWITCH

**Precisión que evita esperar datos que todavía no van a existir.** Hoy no hay
**nada** instrumentado: ni Plausible, ni GA, ni PostHog, ni `@vercel/analytics`,
ni un helper propio. Verificado contra `src/`, `api/`, `index.html`, `vercel.json`
y `package.json`.

Va primera en la secuencia por dos razones, y ninguna es que vaya a dar números
ya: **es barata** (cero funciones serverless, es script de cliente) y **no se
recupera hacia atrás** (el visitante que no se contó no se cuenta después).

**Pero mientras el producto viva en `/demo` con el gate de login, no va a contar
casi nada.** El tráfico de hoy es José, el equipo y quien recibe el link a mano.
Los números recién empiezan a significar algo cuando la navegación esté abierta
(tanda 3) y sobre todo cuando la raíz sea el producto (tanda 6).

**Su fecha límite real es el switch, no hoy.** Se instrumenta antes para que el
día uno esté contando, no para leer el dashboard esta semana. Si alguien mira los
números antes del switch y los ve planos, **eso es lo esperado y no es un fallo de
la instrumentación.**

Vale aparte: la mitad de las métricas que hay que demostrar **ya se pueden contar
hoy desde la base**, sin instrumentar nada. Reservas confirmadas, GMV, agencias
verificadas y % fuera del eje Lima-Cusco salen de una consulta a `Booking`,
`Operator` y `Tour`; las búsquedas ya viven en `SearchLog`. Lo que falta
instrumentar es **solo el top of funnel**: visitantes, vistas de ficha y reservas
iniciadas.

#### Qué recolecta Vercel Analytics, y qué dice la Ley 29733

Verificado contra la documentación oficial de Vercel el 2026-08-15, no de memoria.

**No guarda IP ni nada identificable.** Sin cookies de terceros. Al visitante lo
identifica con un **hash del request entrante**, y **la sesión se descarta a las
24 horas**. No permite reconstruir la navegación de una persona entre sitios ni
identificarla.

Los diez datos que guarda por evento: momento, URL, ruta dinámica, referrer,
query params filtrados, geolocalización (país, región, ciudad), sistema operativo
y versión, navegador y versión, tipo de dispositivo, y versión del script.

**Conclusión: nada de esto es dato personal bajo la Ley 29733, y puede ir a
producción.** La geolocalización es a nivel ciudad y viene desagregada de
cualquier identificador.

**Pero hay un riesgo a futuro, y es nuestro, no de Vercel: la URL se guarda.**
Hoy no importa porque la app no tiene URLs. **Desde la tanda 2 sí las va a
tener**, y ahí hay que mirar dos casos antes de que salgan:

- `/mis-reservas/:code` llevaría el código de reserva (`FND-XXXXXX`) a los
  servidores de Vercel.
- Cualquier query param que se agregue después.

**El instrumento existe y es la función `beforeSend` del propio paquete**, que
deja reescribir o descartar la URL antes de enviarla. **Es trabajo de la tanda 2,
no de esta**, pero se decide ahí y no cuando ya esté publicado.

Un detalle operativo para el QA: la versión 2 del paquete usa **Resilient
Intake**, que arma la URL del script con una semilla generada en build. En un
proyecto con `framework: null` como este hay que **confirmar que el pedido del
script responde 200 y no 404**, porque de eso depende que se registre algo.
También hay que **activar Web Analytics en el dashboard de Vercel**: sin ese
interruptor el paquete no reporta nada.

### Tanda 0, CERRADA: los endpoints de IA exigen agencia

**En `main` desde el 2026-08-15 (`6e6fb83`), post-QA.** José lo validó en
dev.finde.pe: el generador funciona con sesión, y sin sesión responde 401.

`POST /api/ai/generate-description` y `POST /api/ai/generate-quechua` no pedían
sesión. Son **llamadas pagas a la API de Claude** y su única defensa era el rate
limit de 10 por minuto por IP, o sea un costo variable abierto a internet.

Los dos pasan por `requireOperator`. Se verificó que ningún llamador queda afuera:

- `generate-description` tiene **un solo llamador**, el paso 4 de `NewTourView`
  (`src/AppDemo.jsx`), que ya vive detrás del panel. Ese llamador usaba `fetch`
  pelado y pasó a `authFetch`: **sin ese tercer cambio la guarda rompía el
  botón**, porque no viajaba el header `Authorization`.
- `generate-quechua` **no tiene ningún llamador**. El toggle QU de la ficha pasó
  a leer las columnas persistidas, y `scripts/backfill-quechua.ts` le pega
  directo a Anthropic sin pasar por el endpoint. Ver abajo: es el slot designado
  a liberar.

El 403 del backend dice "Requiere perfil de operador", vocabulario interno que no
existe en la interfaz. El frontend lo traduce: 401 es "Tu sesión venció" y 403 es
"Necesitas un perfil de agencia para usar el generador".

### `generate-quechua` es el slot designado a liberar cuando arranque Culqi

**No se borra ahora.** Para los meta tags por tour se eligió **prerender en
build**, que cuesta **cero funciones**, así que el slot no hace falta para eso.
Borrarlo hoy sería trabajo sin destinatario.

**Pero estamos en 12 de 12**, que es el techo de Vercel Hobby, y **Culqi va a
necesitar endpoints**: crear cargo, recibir el webhook y consultar estado son tres
como mínimo. Cuando eso arranque, hay que sacar algo, y **este es el candidato
designado**, por tres motivos:

1. **No lo llama nadie.** Borrarlo no rompe ninguna pantalla ni ningún script.
2. **Su capacidad no se pierde.** `scripts/backfill-quechua.ts` traduce igual, con
   el mismo prompt, pegándole directo a Anthropic. La traducción a quechua sigue
   siendo posible sin el endpoint.
3. **Hoy no llega a ningún usuario.** La capa de display de quechua no existe: las
   columnas `titleQu`, `descQu` y compañía se llenan pero no se muestran.

Si algún día se retoma el quechua en el producto y hace falta traducir en vivo, el
camino no es revivir este archivo suelto sino **consolidarlo en una ruta dinámica**,
como ya se hizo con `api/operators/me/[resource].ts`. El límite de 12 se resuelve
consolidando, no borrando para siempre.

Anotado el 2026-08-15, junto con la decisión de dejarlo vivo por ahora.

## El sello de verificación, CERRADO. Era el bloqueante de lanzamiento

> **RESUELTO el 2026-08-16 (`fix/sello-verificacion-falso`).** Aplicado con
> `scripts/limpiar-sello-verificacion.ts`, con backup previo de `Operator` y
> `Tour` en `backups/sello-antes-limpieza-20260816.sql` (14 y 49 filas
> verificadas dentro del dump, no solo su peso).
>
> **El resto de la sección queda como el diagnóstico que lo originó.**

### Cómo quedó el catálogo público

Verificado contra el API real de finde.pe, no solo contra la base:

| Dato | Antes | Después |
|---|---|---|
| Tours visibles | 49 | **42** |
| Agencias con el sello visibles | **9** | **1** |
| Tours que muestran el sello | 44 | **5** |
| Número MINCETUR expuesto al público | uno inventado y uno real | **solo `201-2025-DIRCETURCAJ`, el real** |

**Las 42 fichas visibles, por agencia:**

| Agencia | Tours | ¿Sello? |
|---|---|---|
| **MEGATOURS** | 5 | **SÍ, y es la única. Es real** |
| Perú Total Tours | 8 | no |
| Norte Salvaje | 6 | no |
| Lima Cultural Tours | 6 | no |
| Colca Adventures | 5 | no |
| Amazonía Viva, Pachamama Sagrada, Inka Trail Co, Andes Auténticos | 3 cada una | no |

**Lo que se hizo, por caso:**

1. **Ocho agencias del seed a `verified = false`.** Sus 37 tours siguen en el
   catálogo, ahora sin badge. Son agencias inventadas: no había nada que
   verificar.
2. **Los 5 tours de "Descubre el Perú" a `active = false`.** La agencia y la
   cuenta quedan **intactas y usables para presentaciones**. No se le bajó
   `verified` porque el sello es justamente lo que se muestra en las demos; lo
   que no podía era estar publicada. **Sigue con `verified = true` en la base y
   eso no expone nada**, porque `gateOperatorMincetur` solo entrega el MINCETUR
   en payloads públicos y ya no tiene ningún tour público.
3. **Los 2 tours de "Tour Prueba" a `active = false`.** No tenían sello, así que
   no eran parte del bloqueante del badge, pero sus descripciones dicen
   `asdasdasd` en el catálogo público y comunican "esto es una demo" con la misma
   fuerza. **No se borraron**: son los tours sobre los que se hizo todo el QA del
   motor de inventario y siguen usables desde el panel.

### EL CRITERIO NUNCA ES EL DOMINIO `@finde.pe`

**Es la trampa del caso y por poco se cae en ella.** La instrucción original decía
"el catálogo público sin tours de cuentas internas", y la forma obvia de
escribirlo es filtrar por `email LIKE '%@finde.pe'`.

**MEGATOURS usa `megatours@finde.pe`.** Comparte dominio con las cuentas
internas. Ese filtro **le habría borrado el sello a la única agencia que lo tiene
ganado y bajado sus 5 tours reales**: el mismo error que la tanda venía a
arreglar, cometido al arreglarlo.

**Por eso las cuentas se nombran una por una, con su email exacto**, y el script
tiene una verificación posterior que comprueba que MEGATOURS quedó con
`verified = true`, su RUC, su MINCETUR y sus 5 tours públicos. Está escrito en el
encabezado de `scripts/limpiar-sello-verificacion.ts` para que no se repita.

### Las reservas existentes no se rompieron

Verificado en el código antes de aplicar: **ningún camino de lectura de reservas
filtra por `active`**. "Mis reservas" del viajero, el panel de la agencia y la
decisión de salidas siguen funcionando; lo que `active = false` corta es la ficha
pública (404) y crear reservas nuevas (409), que es el objetivo.

**Y ninguna reserva real quedó afectada:** las 13 de la cuenta demo y las 20 de
"Tour Prueba" son todas de cuentas internas (`test@finde.pe`, `demo@finde.pe`,
`hola@finde.pe`). **Solicitudes vigentes que quedaran bloqueadas: cero.**

---

### El diagnóstico original (2026-08-15)

**Esto no es deuda de datos ni un ítem de checklist. Es el badge de verificación
de Finde afirmando algo falso, y sobre ese badge descansa toda la propuesta de
valor del producto.** Subió de categoría el 2026-08-15, al abrirse el frente de
navegación abierta.

**El switch no se hace con esto sin resolver.**

### Qué es, exactamente

| Caso | Cuántas | Qué tienen | Por qué es falso |
|---|---|---|---|
| Agencias del seed | **8** | `verified: true`, **sin RUC y sin MINCETUR** | Un sello sin ningún respaldo detrás |
| "Descubre el Perú" (`demo@finde.pe`) | **1** | `verified: true`, RUC `20601234567`, MINCETUR `REG12345` | **Datos inventados con formato válido**, que pasan por reales |

Las 8 del seed, todas sin `userId`: Amazonía Viva, Andes Auténticos, Colca
Adventures, Inka Trail Co, Lima Cultural Tours, Norte Salvaje, Pachamama Sagrada
y Perú Total Tours.

**El segundo caso es el más grave de los dos.** Las 8 no tienen datos: el problema
ahí es un sello vacío. "Descubre el Perú" tiene datos que **parecen reales**, y sus
5 tours salen al catálogo público con el sello al lado de un RUC inventado. Un
viajero que quiera comprobar la agencia va a buscar ese RUC en SUNAT y no va a
encontrar nada, que es exactamente el escenario que la regla existe para evitar.

### Por qué sube de categoría ahora

**Hoy lo ve quien encuentra el demo.** Después de las tandas de navegación abierta
y URLs lo va a ver **Google**, y con el tiempo **una agencia real** que compare su
propio proceso de verificación contra el de estas nueve, o **MINCETUR**.

Y hay un agravante de secuencia: el prerender de meta tags (tanda 5) **congela el
contenido en HTML estático indexable**. Un sello falso publicado así no se
deshace apagándolo en la base: queda en el índice de Google hasta el próximo
crawl. Es la clase de error que se arregla en minutos antes de publicar y en
semanas después.

Choca de frente con dos reglas de la casa, no con una:

- "Nada falso visible al usuario real: sin ratings inventados, sin datos mock, sin
  moderación simulada."
- La verificación manual contra SUNAT y MINCETUR **es el proceso vigente** y es lo
  que se afirma en el copy. Nueve agencias con el sello sin haber pasado por él
  vacían esa afirmación.

### Salidas posibles

Cualquiera de las tres cierra el bloqueante, y se elige caso por caso:

1. **Cargar RUC y MINCETUR reales** y verificarlos a mano, como se hace con las
   agencias de verdad.
2. **Bajar `verified` a `false`.** El tour sigue en el catálogo, sin sello. Es la
   salida más barata y la que menos rompe.
3. **Sacar los tours del catálogo público** (`active: false`).

Para "Descubre el Perú" hay una decisión extra que tomar: es **la cuenta de
presentaciones**, así que hay que resolver cómo sigue sirviendo para demos sin
quedar publicada como agencia verificada.

**Nada de esto se toca sin decisión explícita de José**, porque son escrituras en
la base de producción sobre datos que el catálogo público está mostrando ahora
mismo.

## Plan tipográfico: dónde quedó, al 2026-08-15

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
| **Fase 4, el dominó de `index.css`** | Merge `6f3bbed`. Se elimina el bloque `.app-demo`. Ver abajo |
| **Fase 5, interlineado base** | La base pasa a `1.5` sin unidad. Ver abajo |

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
- **Entregable 6, la cursiva de `.voucher-more`: CERRADO** el 2026-08-14, con
  la Fase 4. Plus Jakarta Sans no trae cara itálica, así que el
  `font-synthesis:none` del bloque hacía que ese texto se viera **recto**. Al
  borrar el bloque habría aparecido una cursiva sintética a 11px, así que se
  sacó el `font-style:italic`

**Las capturas viven fuera del repo a propósito**, en
`~/Documents/finde-capturas/2026-08-13-fase0/`, porque la Fase 0 no hace
commits. Ver el `INDICE.md` de esa carpeta antes de compararlas: hay dos
familias y **no se comparan entre sí**.

### Fase 4, COMPLETA

**En `main` desde el 2026-08-14 (`6f3bbed`), post-QA.**

**El bloque `.app-demo` ya no existe.** `src/index.css` pasó de 109 líneas a una
sola regla, y el CSS compilado de **1.95 kB a 0.06 kB**.

Dos commits, en el orden obligatorio:

| Paso | Commit | Qué hizo |
|---|---|---|
| 1 | `26670f0` | Replicar en `.app` lo que había que conservar, con el bloque todavía vivo |
| 2 | `ced7bf3` | Borrar el bloque, más sacar el `font-style:italic` de `.voucher-more` |

#### Los tres cambios visibles

1. **Desaparece el borde lateral** del contenedor. Era estética de scaffold de
   Vite y se decidió no replicarlo, **ni siquiera transparente**. Consecuencia
   medida: el contenido pasa de 1124 a 1126px en desktop y de 388 a 390px en
   mobile, y todo se corre 1px a la izquierda.
2. **El título del tour "Caral" pasa de 3 líneas a 2** en la grilla a 390px, por
   esos 2px. **Es el único reflow de todo el demo** y mejora: empareja esa celda
   con el resto.
3. **El ícono del reloj del input de hora se vuelve visible en modo oscuro.** Ver
   abajo, es un bug corregido.

#### Bug de accesibilidad corregido de paso: el ícono del reloj

**No es un efecto secundario de la fase, es un bug preexistente que la fase
destapa y arregla.**

El bloque declaraba `color-scheme: light dark`. Con macOS en modo oscuro, Chrome
pintaba el ícono del selector de hora en color claro, **sobre el campo blanco que
el demo fuerza con `.app{background:var(--wh)}`**. Resultado: el ícono quedaba
invisible. Un usuario en modo oscuro no veía que ese campo abría un selector.

Está en el paso 3 de 5 del formulario de tour nuevo, campo "Hora de salida".

Evidencia en `~/Documents/finde-capturas/2026-08-14-fase4/datos/`:
`icono-hora-ANTES-oscuro.png` e `icono-hora-DESPUES-oscuro.png`.

#### Qué se descartó a propósito

`border-inline`, `color-scheme`, `font-synthesis`, `text-rendering` y
`box-sizing`. El `min-height:100svh` no entraba en la lista: **ya estaba muerto**,
porque `.app` declara `min-height:100vh` y le gana por orden de documento.

El `h1` tampoco se replica. El único del demo es `h1.det-tl-desktop` y computa
`display:none`. Está anotado en el plan para cuando se retome la ficha de tour.

`body{margin:0;font-family}` **se queda** en `index.css`, y no es redundante: la
hoja de notificaciones se renderiza en mobile con `createPortal` a `document.body`,
queda fuera de `.app` y de `.landing`, y hereda de ahí su fuente.

#### El paso 4, los 128 selectores: NO SE HACE

Queda documentado en el plan como opcional, con su tabla de ocho commits y la
nota de que el commit 5 (armazón de formulario y método de pago) sería el único
que necesita QA en dev. **No cambia nada visible y agrega riesgo a cambio de
limpieza interna.**

#### Cómo se validó

Por medición, no a ojo: se volcó el `getComputedStyle` de **todos** los elementos
(no de una muestra) antes y después, partiendo el diff en geometría, tipografía y
propiedades heredadas.

- **Paso 1: cero cambios** en las cuatro vistas medidas, incluidos los dos
  calendarios y sus 81 elementos sin clase, que eran el riesgo número uno
- **Paso 2: cero cambios tipográficos**, y **ningún elemento cambia de alto**
  salvo el título de Caral
- **Cero reglas de `prefers-color-scheme`** en ninguna hoja. El único hueco era
  la hoja de Google Fonts, que el CSSOM no deja leer: se cerró bajándola por
  `fetch` (28 `@font-face`, cero selectores de clase)

Detalle completo en
`~/Documents/finde-capturas/2026-08-14-fase4/datos/paso0-resultados.md`, más las
**32 capturas de línea base** de los dos flujos de formulario (8 pantallas por
390 y 1440, por claro y oscuro), que antes no existían.

### Fase 5, COMPLETA

**En `main` desde el 2026-08-15 (`86a4ea3`), post-QA.** José la validó en
dev.finde.pe: se ve mejor.

`.app` dejó de heredar un interlineado en píxeles. `145%` es porcentaje: se
resolvía **una sola vez** contra el tamaño del root y bajaba como valor absoluto,
26.1px en desktop y 23.2px en mobile, **iguales para un texto de 9px que para uno
de 42px**. Sin unidad se hereda la proporción, que es lo que arregla el ritmo
vertical.

Tres commits, que fueron juntos a `dev` a propósito: un estado intermedio con los
títulos inflados no tenía por qué existir en una rama compartida.

| Paso | Commit | Qué hizo |
|---|---|---|
| 1 | `b1e83ba` | La base de `.app` a `1.5` sin unidad, y el `h2` de `118%` a `1.18` |
| 2 | `fe85c1f` | Interlineado propio a los 22 display que la base perturba, más `.gcnt` a `min-width` |
| 3 | `f4941b6` | Borra las 37 declaraciones que quedaron en no-op |

#### Por qué el paso 2 no es scope creep

Dejar el logotipo en 1.5 no es la base funcionando: es cambiar un valor malo por
otro. El logotipo del login son **42px de letra en una caja de 23.2px, ratio
0.55**, y con la base sana saltaba a 63px. Los valores del paso 2 **no se
inventaron**: son los de la escala ya aprobada de la Fase 6, asignados por rol y
no por tamaño (1.2 es `--fs-d2`, 1.3 es `--fs-h1`, 1.35 es `--fs-h2`; el 1.1 del
logotipo y el 1 del ícono son casos propios). **La Fase 6 los migra al token, no
los recalcula.**

#### Qué se ve

- **El badge "Finde Verificado" encoge 9.7px**, de 29.2 a 19.5. Es el cambio más
  visible. Está en `position:absolute` sobre la foto, así que no empuja layout.
  El número viejo de este documento (entre 7 y 9px) estaba medido con `1.6`, que
  era una hipótesis y no la base aprobada
- `.hero-tag` pasa de 35.2 a 28.5px y el chip "IA" del buscador de 29.2 a 21.5.
  **Ningún otro elemento con fondo o borde cambia de alto en todo el demo**
- Los formularios se compactan: las etiquetas pasan de 26.1 a 18px de caja
- Las páginas se acortan cerca de un 6%

#### Cómo se validó

Volcado de `getComputedStyle` de **todos** los elementos en las 20 vistas por dos
anchos, aplicando las reglas del bundle compilado sobre el CSSOM de la app real.

- **Ancho: cero elementos** en las 40 mediciones, en los tres pasos
- **Los dos calendarios: 0 de 31 celdas** cada uno. Era el riesgo número uno
- **Áreas táctiles intactas**: `.chip`, `.sl`, `.city-btn` y `.tn-btn` en 44px
  exactos, porque los controles nativos computan `line-height:normal` (error E2)
- **Las cards no se desparejan**: 24 filas de `.gc` a 390 y 12 a 1440, cero
  desparejas antes y después
- **Barras fijas idénticas**: `.tn`, `.ai-sb`, `.bn`, `.hero`
- Del paso 3, las 33 declaraciones puras computan **el mismo `line-height` con la
  regla y sin ella**, así que no pueden mover nada. Las 4 con desvío accidental
  convergen a la base a 0.65px por línea

Cuatro vistas no se pueden validar mirando y se midieron **por inyección**, con
la cadena de ancestros real dentro de `.app`: login, welcome, éxito de reserva y
el bloque de reseñas de la ficha. Detalle en
`~/Documents/finde-capturas/2026-08-14-fase5/datos/paso0-resultados.md`, más 20
capturas de línea base con los dos anchos en la misma imagen.

#### Dos hallazgos que conviene no perder

1. **La hoja de notificaciones en mobile no la toca esta fase.** Se renderiza con
   `createPortal` al `body`, o sea fuera de `.app`: computa `line-height:normal`.
   Es el mismo resultado que la auditoría de `text-align` de la Fase 0.
2. **El bloque de reseñas de la ficha es UI muerta hoy, y es intencional.**
   `.rev-hdr` y `.rev-big-n` están detrás de `totalReviews > 0` y los 49 tours
   muestran "Nuevo", porque los ratings de siembra se sacaron por la regla de
   nada falso visible. Se le aplicó interlineado igual. **Que nadie lo lea como
   bug ni lo "arregle" mostrándolo.**

#### Desbloqueado por esta fase

- **El barrido de padding del Grupo B de la Fase 2.** Era lo único que esperaba a
  la Fase 5, porque esas zonas tocables sí heredan interlineado y su padding
  había que calcularlo **después** de la base nueva. Ya se puede hacer. Ojo: el
  §9 de la auditoría solo inventarió controles nativos, así que **el inventario
  del Grupo B hay que armarlo**, no existe.
- **El re-cálculo del ancho de celda de `.tg` para la Fase 6.** La mitigación de
  `.gc-t` está calculada sobre celdas de ~155px y con la Fase 4 pasaron a ~156px.
  Dato medido que acota el trabajo: **la Fase 5 no cambia ni un ancho en todo el
  demo**, así que el número sale de medir con la Fase 4 aplicada y no se mueve
  más. La conclusión no cambia (el `-webkit-line-clamp:2` sigue haciendo falta),
  pero el número de partida hay que rehacerlo antes de aplicar la Fase 6.

#### Pendiente cosmético, anotado y sin arreglar

La etiqueta **"Último cupo"** del calendario de reserva. Sale del `fontSize: 8`
de `AppDemo.jsx`, que vive dentro de una celda de 36px con texto que no envuelve:
cualquier aumento la rompe. **Es trabajo de la Fase 7**, que es la que migra los
estilos inline. No se toca por su cuenta.

### Pendientes que nadie definió

Estos dos ítems vienen del **título de una tanda del 2026-08-13, "Refina generador de IA y fix de fecha en demo"**. La tanda nunca se detalló: no quedó escrito qué había que refinar ni cuál era el bug. Son el título y nada más.

- **Refinar el generador de descripciones con IA.** Se refiere a `POST /api/ai/generate-description` (y probablemente a `generate-quechua`).

  **Corrección del 2026-08-14: la parte de "no está enchufado a la UI" ya no es cierta.** Verificado en dev.finde.pe recorriendo el formulario paso por paso: el **paso 4 de 5 de `NewTourView`** tiene el bloque "Generador IA · Genera una descripción profesional basada en los datos que ya ingresaste" con su botón "Generar descripción". Está conectado y funcionando.

  Lo que queda del pendiente, entonces, es solo **mejorar el prompt**, y ahí sí hay trabajo concreto identificado: ver el riesgo del generador de quechua más abajo.
- **Fix de fecha en el demo.** No hay síntoma registrado ni pantalla identificada. Hay varios candidatos posibles (el calendario de reserva, `scheduledAt`, las fechas Lima de las salidas), y sin el síntoma no se puede saber cuál era.

**Los dos hay que definirlos o eliminarlos.** Si al leer esto nadie recuerda a qué se referían, borralos: un pendiente que nadie puede accionar solo genera ruido en cada tanda.

## Auditoría de identidad visual, pendiente. Distinta de la auditoría tipográfica de agosto

> **Esto es una auditoría PENDIENTE, no un plan de ejecución.** Queda registrada
> para abordarla más adelante. Nada de lo que sigue está decidido ni empezado.

### Qué la origina

José, el **2026-08-16**, mirando el home: los títulos de sección le parecen
**"hechos por IA"**. Al conversarlo quedó claro que **no es sobre esos títulos**:
es sobre **todo el producto**.

### Por qué no la cubre la auditoría anterior

La de agosto midió **mecánica**: contraste WCAG, tamaños de fuente, interlineado,
áreas táctiles, jerarquía. Todo verificable con números, y por eso se pudo
ejecutar en fases con mediciones antes y después.

**Esta es de criterio de diseño:** si el producto se ve como algo hecho por
alguien con intención, o como una plantilla. **No se mide, se juzga.** Son dos
preguntas distintas y la segunda no se responde con las herramientas de la
primera.

### Por qué importa para el negocio, y no es vanidad

**Finde vende confianza.** Un viajero que pone S/300 en una plataforma que no
conoce necesita creer que **hay gente real detrás**. Y una agencia que entra al
panel decide ahí si vale la pena subir sus tours.

**Una interfaz que se lee como plantilla generada debilita las dos cosas antes de
la primera palabra.**

### Qué tendría que cubrir, sin resolverlo ahora

**1. La elección tipográfica.** **DM Serif Display más Plus Jakarta Sans es la
combinación por defecto del estilo asociado a IA de 2023-2024** (plantillas de
Framer, Webflow, landings generadas).

- Alternativas a evaluar: **Fraunces**, **Newsreader**, **Bricolage Grotesque**.
- **Ojo con Instrument Serif:** está reemplazando a DM Serif como **la nueva
  fuente por defecto de IA**. Cambiar a ella sería mudarse al mismo problema un
  año más tarde.
- **Y hay una opción que no cambia de fuente: usar el serif MENOS y con más
  intención.** Hoy está en el logo, el hero, **cada** título de sección, los
  títulos de página y los del panel.

**2. La paleta.** Verde bosque, terracota, crema y dorado es coherente y andina.
Lo que hay que revisar es **si se usa con intención o por inercia**, y si el
**dorado** (hoy casi solo en las estrellas) **tiene trabajo real que hacer**.

**3. Las cards de tour.** Hay **dos diseños para el mismo objeto**: `.tc` del
carrusel y `.gc` de la grilla, con escalas, radios y paddings distintos. **Airbnb
usa una sola card en todos los contextos.**

**4. La ficha de tour.** El diagnóstico ya está hecho de la primera conversación:

- El **título va sobre la foto**, y Airbnb no lo hace.
- **Falta el bloque "Qué harás"** con itinerario.
- **La agencia verificada está subdimensionada**, siendo el diferenciador del
  producto.
- **Falta el mapa** del punto de encuentro.

**5. El panel de agencia.** **Nunca se auditó visualmente.** Es la pantalla que
decide si una agencia confía en la plataforma.

**6. Los estados vacíos, de carga y de error.** Nunca se revisaron **como
conjunto**.

**7. Iconografía, ilustración y microinteracciones.** Hoy **no hay criterio
declarado** sobre ninguna de las tres.

### Cómo NO hacerla

**Leyendo CSS y midiendo números. Eso ya se hizo y no responde esta pregunta.**

Hay que **mirar pantallas completas, en contexto**, y compararlas contra
referentes reales (**Airbnb Experiences, Civitatis, GetYourGuide**) preguntando
**qué comunica cada una, no qué mide**.

### Cuándo

**El punto 1 tiene fecha: la elección tipográfica se decide ANTES de la Fase 6.**
Esa fase asigna tamaños e interlineados por token, y **cada tipografía tiene su
propia altura de x**. Cambiar la fuente después **obliga a recalcular la escala
entera**.

**El resto no bloquea el lanzamiento**, pero conviene resolverlo **antes de que el
prerender congele el diseño en HTML indexable** (tanda 5 del camino al
lanzamiento).

### Y esto pesa MÁS que todo lo anterior: tres cosas de CONTENIDO

**Comunican "esto no es real" con más fuerza que cualquier decisión de diseño, y
no se arreglan diseñando.**

1. **Los 49 tours dicen "Nuevo".** Es **honesto** (los ratings falsos se sacaron a
   propósito, ver la regla de nada falso visible), pero **visualmente comunica
   catálogo vacío**. Un marketplace real tiene mezcla. **Hay que decidir qué
   mostrar mientras no haya reseñas reales.**
2. **Varias fotos tienen la marca de agua de MEGATOURS quemada en la esquina.** La
   foto pertenece a la agencia y **lo dice encima del producto**. Es **tema de
   onboarding, no de UI**.
3. **Una card sale con cuadro blanco sin foto** ("prueba manual"). Ya está en la
   checklist de limpieza.

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

Ninguno.

## El motor de inventario, cerrado el 2026-08-15

**En `main` (`77f5f7e`), post-QA.** Cinco pasos más tres arreglos que salieron en
el camino. Nace del bug que José reportó el 15 de agosto ("a veces la reserva
falla aunque el calendario muestre cupos") y termina cubriendo los tres problemas
que la investigación destapó. **No tenía nada que ver con el plan tipográfico**:
apareció durante el QA de la Fase 5, que no toca una línea de lógica.

| Paso | Qué arregló | Commits |
|---|---|---|
| **1** | `takeSeats` exigía `Departure.status = 'ABIERTA'`, y como nada devuelve una salida a `ABIERTA`, confirmar una salida la dejaba **sin vender para siempre** aunque le sobrara cupo. Ahora excluye `CANCELADA`. **Liberó 14 asientos** | `c574888` |
| **2** | `AVAIL_CACHE` no se invalidaba nunca: el calendario mostraba el cupo previo durante toda la sesión de la página. Ahora se invalida por tour y mes | `3d47306` |
| **3** | La carrera de cupos caía en el mismo aviso de 11px que "el teléfono es inválido" y no ofrecía salida. Ahora tiene bloque propio y una acción según `seatsLeft` | `359d701` |
| **4** | **19 solicitudes que no podían vencer nunca** (`expiresAt` NULL, anteriores a la migración del 5 de agosto). Vencidas, **36 asientos liberados**. De paso borró el daño existente del paso 5 | `9b4c4dd` |
| **extra** | `expireStaleSolicitudes` se pasaba del timeout de la transacción con ~12 filas. **Era un 500 alcanzable en un camino de lectura**, no un riesgo teórico. Ahora va en tandas de 5 | `f4097ef` |
| **5** | Cambiar de modo de venta con solicitudes pendientes dejaba asientos invisibles para `takeSeats` y habilitaba **sobreventa**. Ahora 409 con instrucciones | `d85ad33`, `44508c9` |
| **extra** | Los mensajes del motor le hablaban a la agencia en **nombres del enum**: "cupo fijo", "modo solicitud", "panel de salidas". Ninguno existe en la interfaz, que dice "Confirmación automática", "Confirmación manual" y "Reservas". Dos de los tres eran **preexistentes** | `85aea40` |
| **extra** | El 409 del paso 5 llegaba **al guardar el tour**, tres pantallas después de elegir el modo. Ahora la opción se muestra deshabilitada con el motivo, en el paso de disponibilidad, desde que la pantalla se renderiza | `54bb0dc`, `7c6b7b6` |

### El aviso temprano, y por qué está donde está

El 409 del paso 5 es la guarda **real** y no se movió. Lo que se agregó es una
**segunda capa que avisa antes**: `GET /api/operators/me/tours` devuelve
`pendingRequests` por tour (un `groupBy` para toda la lista, sin llamada extra,
en el mismo payload que el formulario ya carga), y con eso la opción
"Confirmación automática" se muestra **deshabilitada con el motivo debajo**.

**No valida al tocar la opción ni al dar "Siguiente".** Tocar y revertir una
selección se lee como que la app está rota, y validar al avanzar deja que la
agencia llene "Cupos por salida" para después decirle que no aplica. Deshabilitada
desde el render, el motivo se lee **sin tener que provocar un error**.

Dos cosas que van con eso y no son adorno:

- La lista de tours **se recarga al decidir una salida**, porque ahí vive
  `pendingRequests`: resolver una solicitud es justo lo que desbloquea la opción.
  Sin eso el formulario mostraría el conteo viejo hasta recargar la página.
- El texto del aviso en el paso 3 **no** dice "para poder cambiar a confirmación
  automática": está pegado a esa opción, en el momento de elegirla. El 409 del
  servidor sí lo conserva, porque ahí aparece al guardar.

**Y costó un bug que quedó como regla:** el campo se agregó en el endpoint y en
el consumidor, los dos extremos funcionaban, y el aviso igual no salía. En el
medio estaba `mapTourFromApi`, un normalizador de **lista blanca** que descarta
en silencio lo que no enumera. Está documentado en `.claude/rules/frontend.md`:
agregar un campo al payload de un tour son **tres** lugares, no dos.

### Lo que quedó demostrado, y conviene no volver a discutir

- **El estado de la salida no es el instrumento de corte de ventas.** Los
  instrumentos son el cupo (integridad) y la anticipación. `CONFIRMADA` significa
  "el tour sale", no "cerramos la lista".
- **El bloqueo del paso 5 siempre tiene salida, y es estructural.** Una solicitud
  vigente está por fuerza en una salida futura (por el tope de la medianoche), y
  ahí el panel sí ofrece decidir. Y **no pueden volver a existir solicitudes
  inmortales**: hay un solo camino que crea reservas y siempre puebla `expiresAt`.
- **El techo de 23 viajes por transacción** es del proyecto entero, no del
  barrido. Está en `.claude/rules/api-y-schema.md`.
- **Los mensajes de error le hablan a la agencia en el vocabulario de la
  interfaz**, no en el del enum. "Confirmación automática" y "Confirmación
  manual" son los modos; "Reservas" es la pestaña; "Cupos por salida" es el
  campo. Si un mensaje nuevo nombra un `salesMode` o una sección, se verifica
  contra el código de la UI y no contra lo que suena bien.
- **Verificar las dos puntas de una cadena no alcanza.** Se perdió `pendingRequests`
  entre un endpoint que lo devolvía y un componente que lo leía. Vale para las
  tres reglas de la casa: medir el punto exacto, no deducirlo de los bordes.

### Caso conocido que NO se cubre: la salida cancelada

Si la agencia **cancela** una salida que tiene solicitudes vigentes, esas
solicitudes **no se pueden resolver a mano**: el endpoint de decisión rechaza con
409 cualquier acción sobre una salida `CANCELADA`. Solo salen por vencimiento.

**El comportamiento es correcto** (vencen solas, con la medianoche del día de
salida como tope duro), pero durante ese lapso la agencia queda bloqueada para
cambiar el modo de venta de ese tour **sin nada que pueda hacer al respecto**. Es
el único caso donde el bloqueo del paso 5 no se resuelve con una acción del
panel. Registrado, sin arreglar: la ventana es corta por construcción y la
combinación (cancelar una salida con solicitudes vivas y además querer cambiar el
modo de venta en ese mismo lapso) es rara.

### Lo que queda pendiente de este dominio

Ninguno es un bug: son huecos de producto, y están detallados más abajo en
"Trabajo pendiente de producto".

1. **El cierre operativo en CUPO_FIJO.** `closeTime` y `closeDaysBefore` no se
   evalúan en ese modo, así que vende hasta la víspera y la agencia no tiene cómo
   cortar antes. **Subordinado a la decisión del 2026-08-15**: no se toca hasta
   que una agencia real lo pida.
2. **El aviso al viajero cuando su solicitud vence.** El vencimiento es
   silencioso: nadie le escribe. Hoy no duele porque son datos de prueba.
3. **El panel sin acciones en salidas pasadas.** Una salida que pasa con
   solicitudes sin decidir deja al viajero colgado y no hay forma de cerrarla.

### Lo que NO queda pendiente

- **La cancelación de reservas.** `cancelBookingInternal` existe sin ruta
  expuesta, y es a propósito: es decisión de producto que va con Culqi.
- **`seatsRequested` bloqueando ventas.** No lo hace y no tiene que hacerlo: es
  progreso de quórum, no inventario comprometido.
- **El `pg_cron` para barrer.** El barrido perezoso alcanza al volumen actual.
- **La guarda del servidor NO se reemplaza por la del cliente.** El 409 de
  `PATCH /api/tours/:id` es la que protege de verdad; la opción deshabilitada del
  formulario solo avisa temprano. Son dos capas a propósito: la del cliente puede
  quedarse con un conteo viejo, la del servidor consulta en el momento.
- **El aviso temprano NO se mueve al paso 5 ni al "Siguiente".** Es la decisión
  que resolvió el bug original: cualquier cosa que aparezca después de elegir el
  modo devuelve el problema que veníamos a arreglar.

### Datos y consecuencias que quedaron registrados

- **Dos reservas de prueba intencionales, que NO se borran.** `FND-07DD62`
  (salida del 16 de agosto) y `FND-ED3818` (30 de agosto), las dos de
  `demo@finde.pe` sobre el tour interno "prueba", creadas en el QA del
  2026-08-15. **Son la evidencia de que el arreglo de la salida confirmada
  funciona en producción**: las dos entraron sobre salidas `CONFIRMADA`, que es
  exactamente lo que antes fallaba. Se quedan por eso, porque el tour es interno
  (`hola@finde.pe`) y porque **no hay camino de cancelación construido**:
  `cancelBookingInternal` no tiene ruta expuesta, así que borrarlas sería un
  DELETE a mano que además habría que compensar en `seatsTaken`. Van en la
  checklist de limpieza previa al lanzamiento, no antes.

- **Las 4 solicitudes de MEGATOURS desaparecen del panel de esa agencia como
  pendientes** (`FND-32AA9C`, `FND-F2B258`, `FND-DA6A0B`, `FND-1E4FB2`). Pasaron
  a VENCIDA, así que la agencia ya no las ve esperando decisión. **El impacto
  operativo es nulo**: las cuatro son de salidas pasadas (27, 28 y 30 de julio y
  7 de agosto) y el panel no ofrece acciones en salidas pasadas, así que nunca
  fueron accionables. Queda registrado igual porque es la única agencia real
  operando y su panel cambia de contenido sin que ella haya hecho nada.

  De las cuatro, **tres son de cuentas `@finde.pe`** y la única de fuera es de la
  cuenta de pruebas ya inventariada. Ningún viajero externo real queda afectado.

- **`expireStaleSolicitudes` se pasaba del timeout con pocas filas: ARREGLADO el
  2026-08-15** en `lib/inventory.ts`, no en el script, para que proteja a todos
  los llamadores.

  No era un riesgo latente sino **un 500 alcanzable en un camino de lectura**: el
  barrido corre antes de leer reservas y en el panel es **bloqueante**, así que
  una agencia con una docena de solicitudes vencidas se quedaba sin poder abrirlo.
  Una docena en una semana no es volumen extraordinario.

  **El umbral está medido, no estimado.** Contra el pooler entran **23 viajes de
  ida y vuelta** en una transacción interactiva antes del corte de los 5 segundos
  (unos 220ms por viaje, igual para SELECT que para UPDATE: el costo es la
  latencia, no el trabajo). El barrido hace **2 viajes por fila**, así que el
  máximo real eran **11 filas**. Con las 19 del backfill eran 38 viajes.

  Ahora el barrido va **en tandas de 5** (`EXPIRE_BATCH_SIZE`), cada una en su
  propia transacción: más del doble de margen sobre el máximo medido. Probado con
  **25 filas**, más del doble del umbral: pasa sin `P2028`, deja el contador en
  cero, y una segunda corrida no toca nada (idempotente).

  **El techo no desapareció: se movió.** El arreglo no cambia el tiempo total,
  porque lo domina la latencia por fila: **unos 0.5 segundos por solicitud
  vencida** (2 viajes), o sea que 25 tardan 12 segundos. Ya no falla con `P2028`,
  pero el barrido corre **dentro de una función serverless** y esa función tiene
  su propia duración máxima. **El techo nuevo es esa duración, y el barrido lo
  alcanza con suficientes vencidas.**

  **Dónde está exactamente ese techo hay que confirmarlo en el dashboard.** El
  repo **no** declara `maxDuration` en `vercel.json`, así que rige el default de
  la plataforma. Según la documentación vigente de Vercel ese default hoy son
  **300 segundos en todos los planes**, no los 10 del límite viejo de Hobby: con
  0.5s por fila el techo caería en el orden de las **cientos** de solicitudes, no
  de las decenas. No pude leer el límite efectivo del proyecto desde acá (la API
  de Vercel responde 403/404 con las credenciales de esta sesión), así que **ese
  número es el único dato del párrafo que falta verificar**, y conviene mirarlo
  antes de confiar en el margen.

  **Y el problema práctico llega mucho antes que cualquier timeout**: 25 vencidas
  ya son 12 segundos de espera en una lectura bloqueante del panel. Eso molesta
  bastante antes de que nada se corte.

  Si llega a hacer falta, la salida es **acotar cuántas se barren por lectura**, y
  eso sí cambia semántica: quedarían vencidas sin persistir hasta la lectura
  siguiente. Sin fecha ni tanda asignada.

Pendientes de performance:

- **El bundle pasa los 500 kB y Vite lo avisa en cada build** (673 kB, 184 kB comprimido, en un solo chunk). No es urgente para el piloto, pero sí para el mercado real: Android de gama media sobre 4G peruano, con objetivo de LCP bajo 3 segundos. `src/AppDemo.jsx` son más de 6200 líneas que hoy viajan enteras aunque el usuario solo abra el home. Candidato claro a code splitting por vista, que es como ya está organizado el archivo (el switch de `effectiveView`). Sin fecha ni tanda asignada.

  **Ojo con la prioridad, que las mediciones del 2026-08-16 dieron vuelta.** Este pendiente figuraba como el número uno de rendimiento y no lo era: las tandas 1B y 1C sacaron **11,8 MB** entre las dos, más de sesenta veces el bundle comprimido entero. **Lo que pesa son imágenes, no JavaScript.** **Las dos puntas del problema de imágenes ya están resueltas**: la landing (tanda 1C) y las que suben las agencias (procesamiento en el navegador). Con eso, el code splitting sí pasa a ser el próximo pendiente de rendimiento.

### Tanda 1C, CERRADA: las imágenes de la landing

**En `main` desde el 2026-08-16 (`5575328`), post-QA**, validada junto con la 1B.

**Cero líneas de código. `Landing.jsx` intacto.** Se reemplazaron los archivos de
`public/destinations/` por versiones a **800 px de ancho máximo**, con el mismo
nombre y la misma extensión `.jpg`, así que el JSX no se entera.

| Archivo | Antes | Después | |
|---|---|---|---|
| `oxapampa.jpg` | 4.287 kB (5184x3456) | **116 kB** (800x534) | -97,3% |
| `rajuntay.jpg` | 565 kB (1920x1440) | **76 kB** (800x600) | -86,5% |
| `paracas.jpg` | 425 kB (1920x1280) | **53 kB** (800x534) | -87,5% |
| `kuelap.jpg` | 357 kB (1920x1080) | **118 kB** (800x450) | -66,8% |
| `colca.jpg` | 227 kB (1920x1080) | **93 kB** (800x450) | -58,8% |
| `chachapoyas.jpg` | 83 kB (540x360) | **68 kB** (540x360) | -18,6% |
| **Total** | **5.946 kB** | **526 kB** | **-91,1%** |

**Por qué 800 px, medido y no elegido a ojo:** la tarjeta de destino se renderiza
a **193x129 px CSS en escritorio** (viewport de 1350) y a **179x119 en móvil**. Es
casi el mismo tamaño en los dos. 800 px cubre hasta **4x de densidad de pantalla**,
más margen del que existe hoy en el mercado.

**`chachapoyas.jpg` no se redimensionó, solo se recomprimió**: ya medía 540 px, por
debajo del tope. La regla aplicada fue **nunca agrandar**, porque escalar hacia
arriba una imagen chica la hace más pesada sin mejorarla (comprobado: llevarla a
800 la subía de 83 a 108 kB).

**Efecto sobre la landing entera**, que es la página que Google indexa, medido con
Lighthouse mobile (4G, CPU 4x):

| Métrica | Antes | Después | Delta |
|---|---|---|---|
| **Bytes transferidos** | 6.526.560 | **976.569** | **-5.549.991 (-85%)** |
| LCP | 5.634 a 12.756 ms | **4.289 a 5.186 ms** | |
| TTI | 5.852 a 13.086 ms | **4.432 a 5.269 ms** | |
| Score de rendimiento | 72 a 77 | **78 a 84** | |

**El LCP también deja de ser bimodal acá**: de 7.122 ms de dispersión entre
corridas a 897 ms.

**Qué NO se tocó, y por qué:**

- **Los tres archivos huérfanos** (`arequipa.jpg` 825 kB, `mancora.jpg` 152 kB,
  `cusco.jpg` 34 kB) no los referencia nadie. **No cuestan ancho de banda porque
  nunca se descargan**, solo peso de repositorio. Borrarlos es decisión aparte.
- **Los mockups PNG** (436 kB, de los que solo uno carga al inicio). Se intentó:
  mejorarlos sin cambiar de formato exige un optimizador de PNG que no está
  instalado (`pngquant`, `optipng`), y con lo que hay (`ffmpeg`) salían **entre
  53% y 131% más pesados**. Pasarlos a WebP sí los achicaría, pero **exige tocar
  `Landing.jsx`**. Queda para cuando haya un motivo para abrir ese archivo.
- **WebP en los destinos.** Ahorraría unos 66 kB más sobre los 526, y cambia la
  extensión del `src`, o sea `Landing.jsx`. No justifica el permiso.

**Las cuatro opciones que se evaluaron antes de elegir**, con el ahorro que
calculó Lighthouse sobre la landing real:

| Opción | Ahorro | Veredicto |
|---|---|---|
| Carga diferida bajo el pliegue | **0 kB** | Ya estaba hecha (`loading="lazy"`), el audit `offscreen-images` daba 0 |
| Recomprimir sin cambiar resolución | **9 kB** | Inútil: el problema no era la calidad |
| Convertir a WebP sin redimensionar | 1.945 kB | El premio chico |
| **Servir el tamaño real** | **5.995 kB** | **Es el 90% del problema. Lo que se hizo** |

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

- **El formulario de tour se pierde entero, sin aviso, al navegar afuera.** El
  estado vive en un `useState` de `NewTourView`: no hay `localStorage`, no hay
  `sessionStorage`, no hay `beforeunload` y no hay diálogo de confirmación. Salir
  de la vista desmonta el componente y se va todo lo editado.

  **No lo trajo ninguna tanda reciente: pasa hoy con el botón de atrás, con la
  barra inferior y con cualquier navegación.** Se documenta ahora porque el aviso
  de solicitudes pendientes del paso de disponibilidad invita a ir a Reservas, y
  ahí se vuelve visible.

  **La salida es un diálogo de confirmación al abandonar con ediciones sin
  guardar**, y se elige justamente porque **protege todos los caminos de salida y
  no solo ese**. Descartadas por ahora, con su motivo:

  - **Borrador en `localStorage`:** más superficie de la que parece. Hay que
    decidir cuándo se descarta, qué pasa con las fotos ya subidas y qué gana si
    el tour se editó desde otro lado en el medio.
  - **Resolver las solicitudes desde el propio formulario:** mete decisiones que
    **mandan correos irreversibles** dentro de una pantalla de edición, donde no
    existe el patrón de dos pasos de confirmación que el panel sí tiene.

- **Fotos huérfanas en Supabase Storage: es deuda CON COSTO, no cosmética.**
  `uploadOnePhoto` sube el archivo al bucket **cuando la agencia lo elige**, no
  cuando guarda el tour (es el flujo de signed URL, que evita el límite de tamaño
  de request de Vercel y por eso no se va a cambiar a la ligera).

  Consecuencia: **cada formulario abandonado a mitad deja archivos en el bucket
  que ningún tour referencia y que nadie borra nunca.** El borrado de fotos solo
  ocurre al borrar un tour (`DELETE /api/tours/:id` limpia `imageUrl` e
  `images[]`), así que una foto que nunca llegó a asociarse a un tour no entra
  por ningún camino de limpieza.

  Hoy son pocas. **Con agencias reales subiendo fotos y abandonando a mitad crece
  sin techo**, y el almacenamiento se paga.

  **Pregunta abierta, sin decidir:** ¿se limpia con un barrido periódico que
  compare el bucket contra las URLs referenciadas, o se cambia el flujo para
  subir recién al guardar? Lo primero no toca el flujo probado pero necesita un
  job que hoy no existe; lo segundo elimina el problema de raíz pero cambia la
  experiencia de carga y hay que revisar que siga esquivando el límite de Vercel.

- **Una salida que pasa con solicitudes sin decidir deja al viajero colgado, y
  hoy no hay forma de cerrarla.** El panel no ofrece confirmar ni rechazar en
  salidas pasadas (`!esPasada` en el render de cada salida), así que si la
  agencia no decide a tiempo, esa solicitud ya no se puede resolver. El barrido
  perezoso la vence **en silencio**: nadie le avisa al viajero, que se queda
  esperando una respuesta que no va a llegar.

  **No es un bug: es un hueco de producto.** Hoy no duele porque las 19 que están
  en esa situación son datos de prueba. **Con MEGATOURS operando de verdad sí
  duele**, porque el que espera es un viajero real que reservó y nunca supo qué
  pasó.

  Dos cosas a resolver cuando toque, y son independientes:
  1. **Que el vencimiento le avise al viajero.** Hoy `expireStaleSolicitudes` no
     manda nada; la doc de la migración ya tenía anotado el aviso automático como
     upgrade con `pg_cron`.
  2. **Que el panel permita cerrar salidas pasadas.** El backend ya lo acepta
     (solo bloquea `CANCELADA`); lo que falta es la acción en la interfaz.

- **El cierre de venta (`closeTime` / `closeDaysBefore`) no se evalúa en
  CUPO_FIJO.** `api/bookings.ts` solo lo mira `if (tour.salesMode === "SOLICITUD")`,
  así que un tour de cupo fijo vende hasta la víspera y no tiene forma de cortar
  antes. El campo existe en el schema y la agencia lo puede configurar, pero en
  ese modo no hace nada: el único tour CUPO_FIJO de la base ("prueba") los tiene
  los dos en NULL, o sea que ni siquiera se nota.

  **El cupo sigue siendo el freno de integridad** (nunca se vende más de lo que
  entra) y eso funciona. **Lo que falta es el freno operativo**: que la agencia
  pueda dejar de recibir reservas con antelación aunque queden asientos, porque
  a cierta hora ya cerró la lista con el transportista. Salió al arreglar el bug
  de la salida confirmada, y se decidió **anotarlo y no arreglarlo ahí**: es
  alcance nuevo, no parte del bug.

  **Subordinado a la decisión del 2026-08-15** (`docs/decisiones.md`): el corte
  de la etapa piloto es la medianoche previa a la salida, que es lo que CUPO_FIJO
  ya hace. Este pendiente **no se toca hasta que una agencia real pida cortar
  antes**. El instrumento ya existe y es por tour; lo que faltaría es evaluarlo
  también en ese modo.

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

## Procesar las fotos, RESUELTO. Era la condición para que la plataforma funcione con tráfico

> **CERRADO y en `main` desde el 2026-08-16 (`62a1d1a`), post-QA.** José lo validó
> en dev.finde.pe con **una foto de paisaje sacada con un iPhone, de las que antes
> se rechazaban**: ahora sube sin decir nada.
>
> Ver "La implementación" al final de esta sección, con los números medidos en un
> navegador real. **El resto queda como el diagnóstico que la originó**, porque
> explica por qué era una condición y no una mejora.

**Diagnóstico (2026-08-16).** La foto que sube una agencia se guardaba **tal
cual**, al tamaño que salió del celular.

**Esto dejó de ser "conviene hacerlo" y pasó a ser condición para que la
plataforma funcione con tráfico.** Lo que lo movió de categoría es el plan de
Supabase, confirmado por José el 2026-08-16: **el proyecto está en FREE**, y el
plan Free **no cobra excedente: RESTRINGE**. Agotar la cuota no es una factura que
llega a fin de mes, **es que la plataforma deja de servir**.

**Por qué además tiene que resolverse ANTES y no después.** En el lanzamiento se
borran las agencias actuales y entran agencias reales que suben sus propias fotos.
**Si las primeras suben fotos sin procesar, después hay que reprocesarlas a mano o
pedirles que vuelvan a subir todo**, que es exactamente el pedido que no se le
hace a una agencia recién onboardeada. Es una ventana que se abre una sola vez.

### El plan Free, y el límite que nadie había mirado

| Recurso | Uso hoy | Tope | Ocupado |
|---|---|---|---|
| Storage | 0,027 GB | **1 GB** | 3% |
| **Egress** | 0,126 GB | **5 GB al mes** | 3% |
| Database | 0,029 GB | 0,5 GB | 6% |

**Storage Image Transformations figura como "Unavailable in plan".** O sea que
**Supabase no puede achicar las fotos del lado del servidor**: no hay atajo de
configuración. **El arreglo en el navegador es el único camino**, no una opción
entre varias.

**Y el que muerde primero no es el almacenamiento, es el EGRESS.** El
almacenamiento se llena una vez y se ve venir; el egress **se consume en cada
visita** y se recarga cada mes. Cada persona que abre el catálogo descarga el peso
de las portadas, y eso sale de la cuota.

#### Cuántas visitas al home agotan los 5 GB

Contando 1 GB como 1024 MB, y sumando lo que la app consume **aparte** de las
fotos: la respuesta de `GET /api/tours` (181 kB, que viaja de Supabase a Vercel) y
las llamadas de Auth, que son de pocos kB.

| Escenario | Por visita al home | **Visitas al mes hasta agotar** |
|---|---|---|
| **Hoy** | 3,6 MB | **~1.450** |
| **Sin procesar, portadas de 4 MB** | 194,6 MB | **~26** |
| **Con el arreglo, 1600 px** | 9,9 MB | **~518** |

**Veintiséis visitas.** Ese es el número que convierte el pendiente en una
condición: con fotos sin procesar, **la plataforma deja de servir imágenes antes
de terminar el primer día de cualquier difusión real**.

#### El lanzamiento hace DOS cosas a la vez, y los dos efectos se multiplican

**Este es el hallazgo que cambia el cálculo del lanzamiento, y es fácil de pasar
por alto porque el número de hoy engaña.**

Los 3,6 MB por visita de hoy son bajos por un motivo que **desaparece en el
lanzamiento**: la mayoría de las fotos **no las servimos nosotros**.

| De dónde sale la portada | Tours | Peso | ¿Cuenta para nuestro egress? |
|---|---|---|---|
| Unsplash (tours del seed) | 38 | **7.904 kB** | **No.** Lo paga Unsplash |
| Nuestro bucket de Supabase | 9 | **3.429 kB** | **Sí** |
| **Total en pantalla** | 47 | **11.333 kB** | solo el 30% es nuestro |

**Al borrar los tours del seed y entrar agencias reales, el 100% de las fotos pasa
a salir de nuestro bucket.** Entonces el lanzamiento hace **dos cosas a la vez**:

1. **Agrega fotos más pesadas**, porque las agencias suben lo que sale del celular
   (hasta 4 MB) en vez de las versiones ya optimizadas que sirve Unsplash.
2. **Mueve el 70% del tráfico de imágenes desde Unsplash hacia el egress de
   Supabase**, que hoy no pagábamos.

**Los dos efectos se multiplican, no se suman.** No es que el peso por visita suba
de 3,6 a 11 MB por cambiar de proveedor, ni que suba de 11 a 194 MB por el tamaño
de los archivos: es que **el mismo salto ocurre sobre una base que además pasa a
ser entera nuestra**.

**El cálculo de las 26 visitas ya incluye las dos cosas**, no hace falta
corregirlo hacia abajo: los 194,6 MB por visita asumen las 49 portadas sin
procesar **y** todas servidas desde nuestro bucket, que es exactamente el estado
en que queda el catálogo después del lanzamiento.

**Dos matices honestos sobre estos números**, que no cambian la conclusión:

- **Son el techo, para visitantes nuevos.** El navegador cachea, así que quien
  vuelve no descarga de nuevo. Pero **el visitante que llega de Google es nuevo
  por definición**, y ese es justamente el público que persigue todo el plan de
  SEO: el peor caso es el caso que estamos buscando.
- Lo que importa es el **orden de magnitud**, no el número exacto: decenas de
  visitas contra cientos contra miles. Entre "sin procesar" y "con el arreglo" hay
  un factor de **26 veces**, y eso ninguna caché lo compensa.

### 1. No hay redimensionado ni compresión en ningún punto de la cadena

Verificado en los cuatro eslabones, no deducido:

| Eslabón | Qué hace con la imagen |
|---|---|
| `uploadOnePhoto` (`src/AppDemo.jsx`) | Pide la URL firmada y sube **el `File` original**, sin tocarlo |
| `POST /api/uploads/tour-image` | Solo firma. **El archivo nunca pasa por la función**, va directo del navegador a Storage |
| Bucket `tour-images` | Valida tamaño y MIME. **No transforma** |
| `lib/tour-input.ts` | Solo comprueba que la URL sea `http(s)`. **No mira la imagen** |

La lectura era correcta: **no hay procesamiento en ninguna parte.**

### 2. Qué pasa con una foto de 8 MB: falla claro, pero el mensaje no sirve

**No se rompe.** El cliente valida **antes** de subir (`MAX_PHOTO_BYTES`, 5 MiB,
el mismo número exacto que el `file_size_limit` del bucket) y muestra "Una imagen
supera los 5MB. Elige versiones más livianas."

Tres problemas reales igual:

1. **El mensaje no dice qué hacer.** A una agencia que sacó la foto con el celular,
   "elige versiones más livianas" no le dice nada accionable, y **la app no ofrece
   ninguna forma de achicarla**.
2. **Aborta el lote entero.** Valida todas las fotos antes de subir ninguna (a
   propósito, para no subir a medias), así que **una foto pesada entre cinco tira
   las cinco**. Y no dice cuál era la pesada.
3. **Va a pasar seguido.** Una foto de 12 MP pesa entre 3 y 6 MB; una de 48 MP,
   entre 8 y 15. **El archivo más grande que ya está en el bucket son 4.062 kB**
   (4608x3456), o sea que pasó raspando.

Anomalía menor anotada al medir: hay **un archivo en el bucket con mimetype
`application/octet-stream`**, que la lista blanca no debería permitir. Uno de 44,
16 kB. Sin investigar.

### 3. El impacto, medido y proyectado

**Hoy** las 47 portadas del catálogo público pesan **11.333 kB**, con promedio de
241 kB. La pantalla de inicio renderiza **los 49 tours** en la grilla "Explora
tours", así que las pide todas.

| Escenario | Peso de las portadas | Sobre 4G (1638 kbps) |
|---|---|---|
| Hoy | 11,3 MB | ~63 segundos |
| **49 tours con portadas sin procesar de 4 MB** | **194 MB** | **~18 minutos** |
| 49 tours con el arreglo (1600 px) | **7,2 MB** | ~40 segundos |

**Son 17 veces lo de hoy**, y lo de hoy ya es malo. Con el arreglo queda **por
debajo** del estado actual, porque el promedio de 241 kB baja a 151.

Agravante: las portadas del catálogo se pintan con **`background-image` de CSS**,
no con `<img>`. **`loading="lazy"` no aplica a los fondos CSS**, así que no hay
forma de diferirlas sin cambiar el marcado.

**Lo que ya se puede observar en el bucket, que es evidencia y no hipótesis:**

| Agencia | Archivos | Total | Promedio | El más grande |
|---|---|---|---|---|
| MEGATOURS (real) | 28 | 8.952 kB | 320 kB | 981 kB |
| Descubre el Perú (demo) | 14 | 17 MB | 1,2 MB | **4.062 kB** |

**Matiz honesto: la única agencia real que subió fotos lo hizo en un rango
razonable** (320 kB de promedio, probablemente sacadas de su propia web). Los
archivos de 4 MB salieron de la cuenta de demo. El riesgo es real y está
evidenciado, pero todavía no lo causó una agencia de verdad.

### 4. El arreglo: redimensionar en el NAVEGADOR antes de subir

La agencia elige su archivo de 6 MB, el navegador sube uno de ~150 kB y **no nota
nada**.

**Cómo.** `createImageBitmap(file)` para decodificar, un `<canvas>` para escalar,
y `canvas.toBlob(cb, "image/jpeg", 0.82)` para reencodear. **Todo nativo del
navegador: cero dependencias nuevas y cero peso en el bundle.** Va en un archivo
nuevo (`src/lib/image-resize.js`) que `uploadOnePhoto` llama antes de subir. Entre
40 y 60 líneas en total. **Es una tanda chica.**

**Ancho máximo: 1600 px.** Justificado por dónde se muestran las fotos: el hero de
la ficha en escritorio ocupa la mitad de una grilla de 1440, o sea ~720 px CSS,
que a 2x son 1440; en móvil son ~390 px CSS, que a 3x son 1170. **1600 cubre los
dos con margen**, y para las tarjetas del catálogo (360 px como mucho) sobra.

**Calidad: 0.82 en JPEG.** Medido sobre la foto real de 4.062 kB del bucket:

| Ancho | JPEG | WebP |
|---|---|---|
| 1200 px | 101 kB | 62 kB |
| **1600 px** | **151 kB** | 97 kB |  ← estimado con ffmpeg; medido en el navegador dio **203 kB**
| 2000 px | 211 kB | 131 kB |

**De 4.062 kB a 151 kB: un 96,3% menos.** **Corrección post-implementación: el
navegador da 203 kB, no 151.** El 151 salió de `ffmpeg`, y el codificador JPEG de
Chrome no produce el mismo archivo con la misma calidad nominal. **El ahorro real
sigue siendo del 95%** y la decisión de 1600 px con calidad 0.82 no cambia; lo que
estaba mal era la predicción del tamaño, no el parámetro.

**WebP: todavía no, y el motivo es concreto.** El bucket declara
`allowed_mime_types = {image/jpeg, image/png}`, así que **un WebP lo rechaza**.
Habría que cambiar la config del bucket, el `bodySchema` y el
`CONTENT_TYPE_TO_EXT` de `api/uploads/tour-image.ts`. Ahorra 54 kB más por foto
sobre el JPEG, y no desbloquea nada. **Se puede hacer después, aparte.**

**Efecto secundario que vale tanto como el ahorro: el límite de 5 MB deja de
importar.** Si el navegador achica antes de subir, la agencia puede elegir un
archivo de 12 MB sin enterarse de que existe un tope. El mensaje "elige versiones
más livianas" desaparece del producto.

**Tres trampas que hay que dejar escritas antes de implementarlo:**

1. **Orientación EXIF.** Sin `{ imageOrientation: "from-image" }` en
   `createImageBitmap`, las fotos verticales de celular **salen rotadas**. Es el
   error clásico de este arreglo.
2. **PNG con transparencia.** Pasarlo a JPEG le pone fondo negro. Para fotos de
   tours no importa, pero conviene pintar fondo blanco antes de dibujar.
3. **Hace falta un tope de entrada igual**, generoso (25 MB), para no colgar el
   navegador decodificando un archivo enorme. Reemplaza al de 5 MB, no se suma.

**Las fotos ya subidas: casi no hay nada que reprocesar.** De los 44 archivos, los
14 de "Descubre el Perú" (17 MB, donde están los de 4 MB) y el de "Tour Prueba" se
van con las cuentas que se borran en el lanzamiento. Quedan **las 28 de MEGATOURS,
que ya promedian 320 kB** y no urge tocar. Si algún día hiciera falta, es un
script de una sola corrida, y **no habría que tocar la base**: re-subir con el
mismo path conserva la URL (ojo con la caché del CDN).

### 5. El bucket: 26 MB de 1 GB, y el almacenamiento es el problema MENOR

| Dato | Valor |
|---|---|
| Archivos hoy | 44 |
| Ocupado hoy | **26 MB de 1 GB** |
| Promedio por archivo | 600 kB |
| El más grande | 4.062 kB |

Los archivos por tour rondan **4** (MEGATOURS: 28 archivos para 5 tours).

| Escenario | Por tour | Tours que entran en 1 GB |
|---|---|---|
| Sin procesar, fotos de 4 MB | 16 MB | **~64** |
| Con el arreglo, 203 kB medidos | 812 kB | **~1.290** |

**Plan confirmado el 2026-08-16: FREE.** Así que el tope real es 1 GB, y con fotos
sin procesar el bucket se llena con **64 tours**: un número perfectamente
alcanzable este año.

**Pero el almacenamiento es el límite menos urgente de los tres.** Llenar 1 GB
requiere que las agencias suban 64 tours; agotar el egress requiere **26 visitas**.
El techo que se toca primero, y por dos órdenes de magnitud, es el de
transferencia. Ver la sección del egress más arriba.

### La implementación (2026-08-16, `feat/procesar-fotos-agencia`, pendiente de QA)

**Archivo nuevo `src/lib/image-resize.js`**, llamado desde `uploadOnePhoto`.
`createImageBitmap` más canvas más `toBlob`. **Cero dependencias nuevas**, y el
bundle comprimido sube **0,72 kB** (184,23 a 184,95).

Parámetros tal como quedaron decididos en la investigación, sin recalcular:
**1600 px de ancho máximo y calidad JPEG 0.82.**

#### Las tres trampas, resueltas y verificadas en un navegador real

Verificado con un banco de pruebas que ejecuta el módulo en Chrome, **sin subir
nada al bucket**: el conteo quedó en 44 archivos y 26 MB, igual que antes.

| Caso | Resultado | Peso |
|---|---|---|
| **Vertical de celular** (4000x3000 con EXIF Orientation=6) | **1600x2133, VERTICAL.** La rotación se aplicó | 427 kB a **93 kB** |
| **PNG con transparencia** (12,6 MB) | Convertido a JPEG, **el píxel de la zona transparente da `rgb(255,255,255)`** | 12.921 kB a **256 kB** |
| **Archivo de 25,3 MB** | `ImageTooLargeError` **antes de decodificar**, y el mensaje **nombra el archivo** | rechazado |
| **Foto real del bucket** (la más pesada que subió una cuenta) | 1600x1200 | 4.062 kB a **203 kB, un 95% menos** |
| **Imagen ya chica** (540x360) | **No se agrandó**, se conserva el original | sin cambio |

**Y el QA lo confirmó con hardware real:** José subió en dev.finde.pe **una foto
de paisaje sacada con un iPhone, de las que antes se rechazaban por pasar los
5 MB**, y entró sin decir nada. Es la prueba que la verificación en el banco no
podía dar: ahí el EXIF era sintético y acá lo escribió una cámara de verdad.

**La regla de "nunca agrandar" se implementó también acá**, igual que en la tanda
1C: si el resultado pesa más que el original, se sube el original. Es lo que hace
que una foto ya optimizada no empeore al pasar por el procesamiento.

#### Dos cosas que la verificación destapó y conviene no perder

1. **La primera versión de la prueba del PNG daba un falso negativo.** Leía el
   color de un píxel transparente **del PNG original**, que siempre da
   `rgb(0,0,0)` porque el canal alfa no se lee en el RGB. El fondo blanco solo se
   puede comprobar **sobre un PNG lo bastante grande como para que el JPEG gane**,
   que es cuando de verdad hay conversión. Con un PNG chico se conserva el
   original y no hay nada que comprobar.
2. **El `contentType` que viaja al endpoint es el de SALIDA, no el del archivo
   elegido.** Un PNG que se recomprimió sale como `image/jpeg`, y de ese valor el
   backend deriva la extensión del archivo en el bucket. Mandar el de entrada
   guardaría un JPEG con nombre `.png`. Además ahora el `uploadToSignedUrl` manda
   `contentType` explícito: **hay un archivo en el bucket guardado como
   `application/octet-stream`** y esto es lo que evita que vuelva a pasar.

#### Por qué el rechazo aparecía con unas fotos y no con otras

**Lo reportó José en el QA, y explica un fenómeno que hasta ahora parecía
caprichoso: con la misma cámara, unas fotos se rechazaban y otras no.**

**Las fotos de paisaje de día pesan mucho más que las de interior.** No es la
cámara ni la resolución: es que **los degradados de cielo y la textura de
vegetación comprimen mal en JPEG**. El formato guarda bien las zonas planas y las
transiciones suaves largas; un cielo con degradado sutil y un cerro lleno de
follaje son justo lo contrario, y el archivo se dispara.

**Esto importa porque el catálogo de Finde es exactamente eso: paisaje de día.**
El caso que peor comprime es el caso normal del producto, no la excepción. Con el
límite viejo de 5 MB, la agencia que sacaba la foto del tour al aire libre era la
que se comía el rechazo, y la que fotografiaba un interior pasaba sin problema.

**El procesamiento lo resuelve igual, y por el orden en que hace las cosas:
achica ANTES de comprimir.** El costo de un cielo difícil se paga sobre 1600 px
de ancho, no sobre 4000, así que el archivo final queda en el mismo rango para
una foto de paisaje que para una de interior. **Es la razón de fondo por la que
redimensionar gana por lejos sobre recomprimir**, que ya se había medido en la
tanda 1C sin entender del todo por qué.

#### El límite de 5 MB desapareció del producto

El tope de entrada pasó a **25 MB y reemplaza al de 5**, no se suma: como la foto
se achica antes de subir, lo que sale entra holgado en el bucket sin importar de
qué tamaño se partió.

- El mensaje **"Una imagen supera los 5MB. Elige versiones más livianas"** ya no
  existe.
- El copy del formulario dice **"las achicamos por ti"** en vez de "máx 5MB c/u".
- **Los mensajes de rechazo ahora nombran el archivo.** Antes decían "una imagen"
  y la agencia tenía que adivinar cuál de las cinco era.

**Lo que NO se cambió, a propósito:** que un archivo inválido aborte el lote
entero. Está comentado en el código como decisión de UX ("no subir a medias por
uno malo") y con el tope en 25 MB el caso casi desaparece. Lo que se arregló es
que ahora se sabe **cuál** archivo fue.

## Antes de lanzar a usuarios reales

- [x] **Procesar las fotos en el navegador antes de subirlas.** ~~CONDICIÓN, no mejora.~~ **HECHO el 2026-08-16** (`62a1d1a`), antes de onboardear ninguna agencia real, que era el punto. Sección propia arriba.
- [ ] **Reactivar "Confirm email" en Supabase** (desactivado para acelerar el MVP).
- [x] **El sello de verificación falso: CERRADO el 2026-08-16.** Fue el único bloqueante de lanzamiento y tiene sección propia más arriba, con el estado final del catálogo. Resultado: **42 tours visibles y MEGATOURS como la única agencia con sello, que es la única que lo tiene de verdad.**
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
