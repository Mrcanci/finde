# El plan tipográfico y el canon del texto

> **Historia, no estado.** Es el registro de trabajo **ya cerrado y en `main`**.
> Se archivó acá el 2026-08-16 al podar `docs/estado.md`, que había llegado a
> 1.767 líneas y se leía entero al empezar cada sesión.
>
> **El estado actual del proyecto vive en `docs/estado.md`.** Este archivo se lee
> solo cuando hace falta reconstruir por qué algo se hizo como se hizo.

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
