# Plan tipográfico del demo

**Fecha:** 13 ago 2026 · **Rama de origen:** `dev` · **Fuente:** `docs/audits/2026-08-13-typography-audit.md`
**Estado:** aprobado, sin implementar. Ninguna fase está aplicada.

Este plan reordena los hallazgos de la auditoría tipográfica y **corrige seis errores de análisis que se le encontraron al verificarla**. La auditoría se trata como hipótesis, no como verdad. Cuando este plan y la auditoría se contradicen, manda este plan.

---

## Conclusión

Los bugs que un usuario sufre hoy (contraste, botones chicos, texto de 8px) se arreglan casi sin riesgo y **no dependen** del dominó de `index.css`. La auditoría los mezcla con la reescritura de la escala. Van separados.

**Fases 0 a 3: bugs visibles, riesgo bajo, se pueden hacer ya.**
**Fases 4 a 7: deuda de sistema, riesgo alto, sin urgencia.**

No mezclar las dos mitades en el mismo commit. La primera se revierte fácil, la segunda no.

---

## Errores de la auditoría, verificados

| # | Dice la auditoría | Lo verificado | Impacto |
|---|---|---|---|
| **E1** | El interlineado heredado es 26.1px en todo el demo | Solo en desktop. `line-height:145%` es porcentaje y se resuelve contra el tamaño del propio elemento; en ≤1024px el media query baja el root a 16px, así que hereda **23.2px**. La auditoría se delata: reporta `width:1126px` en su medición. Todos sus "ratios efectivos" están calculados en la pantalla que menos importa | Medio |
| **E2** | Riesgo #2: poner `line-height` base en `.app` afecta a los botones y rompe `.chip`, `.dsh-tab`, `.tp-tab` | **Falso.** El navegador declara `line-height:normal` sobre `button`, `input` y `textarea`, y una declaración sobre el elemento le gana siempre a un valor heredado del padre. Prueba: hoy `.app-demo` impone su interlineado y los botones igual computan `normal`. Verificado además que ninguna de las 30 reglas con `line-height` del demo toca controles | **Alto** |
| **E2b** | El arreglo del interlineado "arregla las áreas táctiles del §9" | Consecuencia de E2: **no las arregla**. Los botones no cambian de alto. Los targets se agrandan con padding, trabajo aparte que se puede hacer ya | **Alto** |
| **E3** | `.st` a 22px computa ratio 1.00 | `.st` es 22px en mobile y 26px desde 1024px. El 1.00 es el caso desktop; en mobile es 1.05. Síntoma real, número mal atribuido | Bajo |
| **E4** | Conteos por selector (`--gy` 67, `--lg` 5, `--sg` 2, `--gd` ~5, letter-spacing 22) | Los reales son 66, 6, 6, 7 y 23. **Las tablas de la auditoría están hechas a ojo y no sirven como checklist de reemplazo** | Bajo |
| **E5** | Números de línea (`:6248` el root, `:4925` el badge) | Corrieron +9 con `c171347` y `e818d8e`. Root es `:6257`, badge `:4934`. El `fontSize: 8` sigue en `:437` | Bajo |
| **E6** | Contraste de badges: 2.81 / 3.44 / 2.97 | Mezcló los tintes sobre `--wh`. Los tres contenedores (`.tp-card`, `.dsh-bk`, `.biz-sec`) declaran `background:white`. Los valores reales son 2.92 / 3.57 / 3.09. Misma conclusión, números distintos | Bajo |

**Lo que sí se verificó y está correcto:** el bloque `.app-demo` de `index.css`, que `.app` no declara ancho ni centrado ni tamaño ni interlineado, los conteos gruesos (242 `font-size` en CSS, 106 inline), que `App.css` no está importado, que `index.html` no tiene `preconnect`, que `--gy-soft` no lo usa nadie, que hay exactamente 1 `h1` y 3 `h2`, y **la matemática de contraste del §6, recalculada y correcta**.

**Lo que queda sin verificar, va en la Fase 0:** que la cursiva muerta de `.voucher-more` sea por `font-synthesis`, y qué se descuadra exactamente al perder el `text-align:center` heredado.

---

## Bugs visibles vs deuda de sistema

**Bugs que un usuario sufre hoy:** contraste que falla accesibilidad en el color de acción secundaria, en la hora de las notificaciones, en el código de reserva y en los badges de estado · el subtítulo del hero sobre foto clara · el rojo del error de formulario · botones de 16px de alto ("Ver todos") · el aviso "Último cupo" a 8px, que es señal de negocio · zoom del input en iPad · el contador de personas que salta al cambiar de número · el código de reserva con dos tratamientos según la pantalla.

**Deuda de sistema:** el bloque muerto de la plantilla de Vite en `index.css` que gobierna el demo · la escala de 23 tamaños sin sistema · que la fuente del demo dependa del orden en que el bundler inyecta el CSS · los 106 estilos inline que ningún cambio de CSS alcanza · falta de `preconnect` y peso de fuente que se descarga sin usarse.

---

## Paleta aprobada

Decisión de marca tomada: **`--tr` queda intacto** para decoración, `--focus` y el punto de "finde.". Se crea `--tr-text` solo para texto.

| Token | Valor | Contraste | Uso |
|---|---|---|---|
| `--tr-text` | `#A84E2C` | 5.30 sobre `--wh` · 4.89 sobre `--cr` · 4.53 sobre blanco | reemplaza a `--tr` en los 17 usos como texto |
| `--gy-strong` | `#5A5A57` | 6.62 sobre `--wh` · 6.11 sobre `--cr` · 6.93 sobre blanco | reemplaza a `--gy` donde hoy falla, y a `--lg` |
| `--gy-soft` | eliminar | cero usos | deuda muerta |
| acento de IA | `--f` en vez de `--ai` | 11.88 | además corrige que el celeste rompía la paleta andina |
| `.tp-completed` | `--m` en vez de `--sg` | 7.60 | |
| `.field-err` | `#C0392B` en vez de `#e53e3e` | 5.20 | ya existe en el código |
| número de rating | `--ch` o `--gy-strong` | | la estrella se queda en `--gd`, es ícono decorativo |

### Badges sobre fondo tintado

Los tres contenedores declaran `background:white`, así que el tinte se mezcla sobre blanco, no sobre `--wh`.

| Badge | Fondo efectivo | Actual | Aprobado |
|---|---|---|---|
| `.st-pending` / `.biz-badge.pending` | `#f9f2e3` | `#B8860B` 2.92 ❌ | **`#7A5C10` → 5.60** ✅ |
| `.st-cancelled` / `.biz-badge.no` | `#f9efeb` | `--tr` 3.57 ❌ | **`--tr-text` → 4.90** ✅ |
| `.tp-completed` / `.st-completed` | `#e9eeea` | `--sg` 3.09 ❌ | **`--m` → 6.77** ✅ |
| `.st-confirmed` / `.tp-upcoming` / `.biz-badge.ok` | `#eaefec` | `--m` 6.84 ✅ | sin cambio |

Para el ámbar se descartó `#8B6914` (4.56), que ya existe en el código: pasa por 0.06 y ese es exactamente el margen que ya falló con `--gy` (4.55). Se usa `#7A5C10`.

---

## Fase 0 · Medir en mobile antes de tocar nada

Sin commits. Media hora.

- **Hallazgos:** ninguno. Cierra E1, E2 y las dudas abiertas
- **Archivos:** ninguno
- **Qué se hace:** abrir dev.finde.pe/demo en 390px, confirmar el interlineado real del root, confirmar que los botones siguen en `normal`, confirmar si la cursiva de `.voucher-more` se ve o no, y sacar capturas de referencia de home, detalle, reserva, voucher y panel
- **Qué puede romperse:** nada
- **Cómo se valida:** las capturas son la línea base de todas las fases siguientes

---

## Fase 1 · Contraste de color

Mejor relación impacto/riesgo del plan. Bugs visibles, riesgo casi nulo.

- **Hallazgos:** §6a, §6b, §6c, §4c
- **Archivos:** solo `src/AppDemo.jsx` (bloque de tokens en `:939`, hexes sueltos, gradiente del hero)
- **Qué se hace:** aplicar la paleta aprobada de arriba; oscurecer el gradiente del hero para que `.hero-sub`, `.hero-tag` y `.login-hero-tagline` pasen AA sobre foto clara; borrar `--gy-soft`; dar color propio a los placeholders de `.inp`, `.login-input`, `.rv-textarea` y `.ai-cc-input`
- **Qué puede romperse:** nada de layout. Cambiar un color no mueve ninguna caja. El riesgo es solo estético
- **Cómo se valida:** capturas de Fase 0 lado a lado. Recorrido con `demo@finde.pe` sobre tours de cuentas `@finde.pe` por home, resultados de búsqueda, detalle, reserva completa hasta el voucher, notificaciones, mis reservas y panel. Revisar en particular badges de estado, hora de notificación, código de reserva, "Ver todos" y el error de un formulario forzado

### Corrección (a): no usar las tablas de la auditoría como checklist

Por E4, los conteos por selector de la auditoría están hechos a ojo y tienen desvíos en los cinco colores que hay que tocar. **La lista de usos se regenera con `grep` al empezar la fase**, sobre el archivo en su estado de ese momento, y esa lista es la que se sigue. Las tablas del documento de auditoría sirven para entender el problema, no para ejecutarlo.

---

## Fase 2 · Áreas táctiles

Bugs visibles, riesgo bajo. **No depende de ninguna otra fase**, por E2.

- **Hallazgos:** §9 completo
- **Archivos:** solo `src/AppDemo.jsx` (unas 10 reglas de padding en la constante CSS, más la celda del calendario en `:415-442`)
- **Qué se hace:** subir el área táctil de los controles del Grupo A a 44px
- **Qué puede romperse:** `.chip` y `.dsh-tab` viven en scrollers horizontales con texto que no envuelve, así que el scroller se alarga (molesto, no roto) · `.bn-i` de la barra inferior cumple 44px **por accidente**, su alto lo da el ícono de 22px y no su padding, no se toca en esta fase · **el calendario de reserva es el punto frágil del demo**, los tres commits previos a la auditoría fueron justo ahí, va como sub-paso aparte al final con su propio QA
- **Cómo se valida:** en un teléfono real, no en el simulador, tocando cada control con el pulgar. Para el calendario: entrar a un tour de una cuenta `@finde.pe`, abrir la reserva y probar todas las celdas incluidas las de "Último cupo"

### Corrección (b): clasificar cada target en dos grupos antes de tocar padding

Consecuencia directa de E2. Cada target se clasifica antes de calcularle el padding:

**Grupo A: `<button>`, `<input>`, `<textarea>`.** El navegador les declara `line-height: normal` sobre el propio elemento, así que **no heredan** el interlineado del contenedor y **no se van a mover cuando la Fase 5 cambie la base**. Su padding se calcula ahora y queda fijo.

**Grupo B: todo lo demás** (`div`, `span`, `a` que funcionan como zona tocable). Sí heredan interlineado, así que **van a encoger cuando la Fase 5 cambie la base**. Su padding se calcula **después** de la Fase 5, nunca antes, o hay que rehacerlo.

Clasificación preliminar, a confirmar contra el JSX al empezar la fase. El marcador confiable es `font-family:inherit` junto a `border:none` o `background:none`: solo hace falta declararlos si el navegador los pisó, y eso pasa únicamente en controles nativos.

| Grupo | Selectores |
|---|---|
| **A** (padding ahora, queda fijo) | `.sl` · `.chip` · `.tn-btn` · `.tn-link` · `.city-btn` · `.sr-clear` · `.lang-dd-btn` · `.tp-tab` · `.dsh-tab` · `.rev-more` · `.bn-i` · celda del calendario (`:415-442`, verificada: es `<button type="button">` con `padding:0` y `minHeight:36`) |
| **B** (padding después de la Fase 5) | ninguno de la lista del §9 |

**Hallazgo que la auditoría no tiene:** los ocho targets de su §9 son **todos controles nativos**, o sea Grupo A. Eso significa que la Fase 2 se puede hacer entera ahora y nada de ella se deshace en la Fase 5. Pero también significa que **la auditoría nunca inventarió las zonas tocables que no son controles nativos** (cards, filas de listado, opciones de sheet). Ese barrido del Grupo B queda pendiente y se hace después de la Fase 5.

---

## Fase 3 · Micro-arreglos sueltos

Cada uno es de una a tres líneas, independientes entre sí. Riesgo bajo.

- **Hallazgos:** §1c (el input de 15px), §7b (números), §7c (monospace y cursiva), §8a, §8b, §8c
- **Archivos:** `src/AppDemo.jsx` (constante CSS) e `index.html`. **`Landing.jsx` no se toca**
- **Qué se hace:** subir el input del buscador a 16px en desktop para matar el zoom de iPad · poner `tabular-nums` en el contador de personas, las barras de ingresos y las filas de precio · unificar el código de reserva en un solo tratamiento (hoy tiene dos tamaños, dos pesos, dos colores y dos trackings según la pantalla) · agregar `preconnect` a Google Fonts · sacar el peso 300 que se descarga y no usa nadie
- **Qué puede romperse:** la URL de fuentes es **compartida con la landing**, verificar que la landing tampoco use el peso 300 antes de tocar · `tabular-nums` cambia levemente el ancho de los números, mirar que el contador de 60px fijos siga entrando · borrar los `@import` redundantes toca `Landing.jsx`, que es archivo protegido, **queda fuera del plan hasta autorización explícita**
- **Cómo se valida:** el zoom, en un iPad en horizontal. Los números, tocando `+`/`−` en el selector de personas. El `preconnect`, mirando que los títulos serif dejen de parpadear al cargar

---

## Fase 4 · El dominó: `index.css`

Acá empieza la deuda de sistema y el riesgo alto. Nada de esta fase se ve; todo previene bugs futuros.

- **Hallazgos:** §10a completo. Habilita la Fase 5
- **Archivos:** `src/index.css` (borrar el bloque `.app-demo`) y `src/AppDemo.jsx` (replicar a propósito lo que se conserve en `.app`). **Un commit, solo esto**
- **Qué se hace:** el bloque es plantilla de Vite renombrada, pero hoy gobierna el ancho, el centrado, el tamaño del root, el interlineado, el espaciado entre letras y el color de los `h2`. No alcanza con borrarlo: hay que decidir qué se replica
- **Qué puede romperse:** **es el riesgo número uno del proyecto.** Al borrarlo el demo pierde de golpe `width:1126px`, `max-width:100%`, `margin:0 auto`, `text-align:center`, `display:flex`, `flex-direction:column`, `min-height:100svh` y `border-inline`. El centrado en particular sostiene pantallas enteras. El demo declara centrado explícito en 22 reglas propias, o sea que parte se salva sola, pero el resto no
- **Ganancia:** desaparece la fragilidad de que la fuente del demo dependa del orden de inyección del bundler, y desaparece la fuente del bug de "Notificaciones" en vez de seguir tapándolo caso por caso
- **Cómo se valida:** capturas de Fase 0 contra el resultado, **pantalla por pantalla, en 390px y en 1440px, en modo claro y en modo oscuro**. Es la única fase donde vale la pena el diff visual completo antes de pushear

---

## Fase 5 · Interlineado base y ritmo vertical

Depende de la Fase 4. Riesgo medio.

- **Hallazgos:** hallazgo principal, §3a, §3b, §3c
- **Archivos:** `src/AppDemo.jsx` (tokens de `.app` y las ~30 reglas de `line-height` que hoy compensan a mano)
- **Qué se hace:** darle a `.app` un interlineado base **sin unidad**, para que se herede como proporción y no como valor fijo, y limpiar las reglas que existen solo para compensar la base equivocada
- **Qué puede romperse:** menos de lo que dice la auditoría. Por E2 los botones no se mueven. Lo que sí se mueve es todo el texto dentro de `div`, o sea alturas de card, y ahí `.tc` (ancho fijo de 260px) y `.tg` (grilla de dos columnas en mobile) pueden dejar de tener altura pareja
- **Cómo se valida:** home y catálogo en 390px mirando que las cards de la grilla sigan alineadas. Detalle de tour con descripción larga. Voucher completo. **Al terminar, recién ahí, el barrido de padding del Grupo B de la Fase 2**

---

## Fase 6 · La escala en tokens

La fase grande. Deuda pura, riesgo alto, ninguna urgencia.

- **Hallazgos:** §1a, §1b, §1c, §2, §4a, §4b, §5, §10b
- **Archivos:** `src/AppDemo.jsx`, la constante CSS entera
- **Qué se hace:** definir la escala como variables, reemplazar los 23 tamaños sueltos, subir el cuerpo de 13px, ordenar los pesos, decidir qué títulos en serif bajan a la sans, ordenar el espaciado de las versalitas
- **Qué puede romperse:** el §10b de la auditoría es su mejor sección y se verificó en lo esencial. Los puntos frágiles son el contador de personas con 60px fijos, el precio de la barra de reserva que no envuelve y comparte fila con el botón "Reservar", la grilla de dos columnas a 390px donde cada celda mide ~175px, y los tabs del panel que en desktop pasan a columna de 220px fijos
- **Cómo se hace:** partir en sub-pasos **por pantalla, no por propiedad**. Un commit por pantalla se puede revertir; un commit de 242 reemplazos no
- **Cómo se valida:** recorrido completo por las doce vistas del demo en 390px, 768px y 1440px

---

## Fase 7 · Los estilos inline

Cierre. Depende de la Fase 6.

- **Hallazgos:** §1d
- **Archivos:** `src/AppDemo.jsx`, fuera de la constante CSS
- **Qué se hace:** migrar los 106 tamaños inline a la escala. Son el 30% de la superficie tipográfica y **ningún cambio de CSS los alcanza**, así que sin esta fase el rediseño queda a medias
- **Qué puede romperse:** el `fontSize: 8` de `:437` vive dentro de una celda de calendario de 36px con texto que no envuelve. Cualquier aumento la rompe. Mismo punto frágil de la Fase 2
- **Cómo se valida:** las mismas pantallas de la Fase 6, más el calendario a mano

---

## Saneamiento previo

Hecho en la rama `chore/saneamiento-previo`, antes de arrancar cualquier fase:

1. **`.claude/rules/frontend.md`**: decía que el ancho máximo del contenedor es 430px y ese valor no existe en el CSS del demo. Corregido al valor real.
2. **`src/App.css`**: borrado. 184 líneas de código muerto que no importaba nadie.

### Corrección (c): rama mergeada que se puede borrar

`origin/docs/reestructuracion-documentacion` ya está mergeada en `main` (commit `4fe412d`). Se puede borrar.

---

## Reglas de ejecución

- Ninguna fase se implementa sin visto bueno explícito.
- Las fases 0 a 3 y las fases 4 a 7 **no comparten commit**.
- QA solo con `demo@finde.pe` y sobre tours de cuentas `@finde.pe`. dev.finde.pe corre contra la base de producción y manda correos reales.
- `src/Landing.jsx` no se toca sin la frase "EXCEPCIÓN AUTORIZADA".
