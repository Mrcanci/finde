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

## En curso

Nada arrancado. **Lo próximo es la Fase 6 del plan tipográfico**, la escala en
tokens, que no se empieza sin visto bueno explícito. Antes que ella conviene
hacer el **barrido de padding del Grupo B**, que la Fase 5 acaba de desbloquear
y es más chico.

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

Cinco pasos, todos aplicados. Nace del bug que José reportó el 15 de agosto ("a
veces la reserva falla aunque el calendario muestre cupos") y termina cubriendo
los tres problemas que la investigación destapó. **No tenía nada que ver con el
plan tipográfico**: apareció durante el QA de la Fase 5, que no toca una línea de
lógica.

| Paso | Qué arregló | Commits |
|---|---|---|
| **1** | `takeSeats` exigía `Departure.status = 'ABIERTA'`, y como nada devuelve una salida a `ABIERTA`, confirmar una salida la dejaba **sin vender para siempre** aunque le sobrara cupo. Ahora excluye `CANCELADA`. **Liberó 14 asientos** | `c574888` |
| **2** | `AVAIL_CACHE` no se invalidaba nunca: el calendario mostraba el cupo previo durante toda la sesión de la página. Ahora se invalida por tour y mes | `3d47306` |
| **3** | La carrera de cupos caía en el mismo aviso de 11px que "el teléfono es inválido" y no ofrecía salida. Ahora tiene bloque propio y una acción según `seatsLeft` | `359d701` |
| **4** | **19 solicitudes que no podían vencer nunca** (`expiresAt` NULL, anteriores a la migración del 5 de agosto). Vencidas, **36 asientos liberados**. De paso borró el daño existente del paso 5 | `9b4c4dd` |
| **extra** | `expireStaleSolicitudes` se pasaba del timeout de la transacción con ~12 filas. **Era un 500 alcanzable en un camino de lectura**, no un riesgo teórico. Ahora va en tandas de 5 | `f4097ef` |
| **5** | Cambiar de modo de venta con solicitudes pendientes dejaba asientos invisibles para `takeSeats` y habilitaba **sobreventa**. Ahora 409 con instrucciones | `d85ad33`, `44508c9` |

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
