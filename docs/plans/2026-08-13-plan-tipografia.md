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

Sin commits, no toca ningún archivo del repo. Es medición y capturas.

- **Hallazgos:** ninguno. Cierra E1, E2 y las dudas abiertas
- **Archivos:** ninguno
- **Qué puede romperse:** nada

### Entregables

| # | Entregable | Estado |
|---|---|---|
| 1 | Interlineado real del root medido en mobile | ✅ **16px / 23.2px, ratio 1.450.** E1 confirmado: la auditoría reportaba 26.1px y ese valor solo existe en desktop |
| 2 | Confirmación de que los `<button>` computan `line-height:normal` con la base actual | ✅ **33 de 33, cero excepciones.** E2 confirmado |
| 3 | Capturas de referencia en 412px | ✅ 10 vistas, **previas a la Fase 1** |
| 4 | **Auditoría de `text-align:center`** | ✅ **COMPLETA. 128 selectores dependen de la herencia**, sobre 20 vistas y sub-vistas. No queda ninguna vista sin medir |
| 5 | Series de línea base para la Fase 4 | ✅ **completo.** oscuro 412, 1440 y 390 · claro 1440 (10 vistas) y 390 (2 vistas) |
| 6 | Confirmar si la cursiva de `.voucher-more` se ve o no | pendiente |
| 7 | Comparación oscuro vs claro en 1440, vista por vista | ✅ **2 diferencias, las dos del bloque `.app-demo`.** Ver abajo |

### ⚠️ Hay dos familias de capturas y no se comparan entre sí

Las Fases 1, 2 y 3 **ya están aplicadas y mergeadas en `dev`**. Eso parte el material en dos:

| Familia | Qué es | Para qué sirve |
|---|---|---|
| `pre-fase1-*` | estado **anterior** al refactor | ver cuánto cambió con las Fases 1 a 3 |
| `post-fase3-*` | estado **actual**, con contraste, áreas táctiles y micro-arreglos ya aplicados | **línea base de la Fase 4 en adelante** |

**Validar la Fase 4 contra `pre-fase1-*` sería un error:** mezclaría los cambios de tres fases con los de una. La Fase 4 se compara contra `post-fase3-*`.

Las carpetas están nombradas con ese prefijo justamente para que no se confundan. Ver `INDICE.md` en la carpeta de capturas.

### Cómo se destrabó el viewport

El bloqueo era que la ventana de Chrome no se deja redimensionar por automatización. La salida no fue redimensionar: **se carga el demo en un `iframe` del mismo origen al ancho deseado**. Un iframe crea su propio viewport, así que las media queries responden a **su** ancho y no al de la ventana, y al compartir origen hereda la sesión.

Verificado en cada serie con `innerWidth` del iframe y `matchMedia` de los breakpoints de 640, 1024 y 1200.

Detalle que costó dos intentos: las vistas con animación de entrada salían capturadas a media transición.

**La inyección correcta es acelerar a cero, no apagar.** Esto estaba mal anotado y costó una tanda más:

```css
*{animation-duration:0s !important;
  animation-delay:0s !important;
  transition-duration:0s !important}
```

`*{animation:none}` **no sirve**. Los cinco bloques con entrada (`.fu`, `.fd1`, `.fd2`, `.fd3`) arrancan en `opacity:0` y suben con la animación, que tiene `fill:forwards`. Apagarla los deja invisibles para siempre: la primera captura de home salió sin buscador, sin chips y sin "Recién publicados", con un hueco blanco donde iban.

Medido en el navegador, opacidad de los cinco elementos después de cada inyección:

| Inyección | Resultado |
|---|---|
| `animation:none` | `1, 0, 0, 0, 0` ❌ |
| **`animation-duration:0s` + `animation-delay:0s` + `transition-duration:0s`** | **`1, 1, 1, 1, 1`** ✅ |
| `animation-duration:0.001s` | `0, 0, 0, 0, 0` ❌ |

**Ojo con la milésima:** una duración chica pero distinta de cero **no alcanza**, porque dentro del iframe la línea de tiempo de las animaciones puede quedar en `currentTime:0` y ahí el elemento sigue en el fotograma inicial. Con `0s` el navegador aplica el fotograma final de una, sin depender del reloj. Las series claras del 14 ago se sacaron con `0.001s` y salieron bien de casualidad, porque el reloj ya había avanzado: son válidas, pero la receta que se repite es la de `0s`.

### Entregable 4: auditoría de `text-align:center`

Es el que más importa de los que faltan, porque **es el riesgo número uno de la Fase 4** y hasta ahora solo figuraba como una duda suelta, no como un paso con resultado.

El entregable es **una lista de selectores**, no una impresión: los que hoy se ven centrados **por herencia** del `text-align:center` de `.app-demo` y **no declaran `text-align` propio**. Esos son exactamente los que se descuadran el día que la Fase 4 borre el bloque, y son los que hay que replicar a propósito en `.app`.

Se saca por prueba empírica: se inyecta `.app-demo{text-align:left}` y se registra qué elementos cambian de `text-align` computado. El demo declara alineación explícita en **36 reglas propias**, no 22 como decía este plan: esas se salvan solas y no van en la lista.

### Segunda tanda: la muestra de 9 vistas subestimaba el alcance en un 20%

Las 9 vistas de la primera tanda daban 91 selectores. Lo que se sumó el 14 ago aporta **37 nuevos**, un 41% más, y no son marginales: son **cuatro familias enteras** que no estaban.

| Familia | Selectores | Por qué importa |
|---|---|---|
| **Ficha de tour** (`.det*`, `.bb*`) | 8 | Incluye `.det-hero` y `.bb`, la foto grande y la barra de reserva fija. La pantalla que más tráfico va a tener |
| **Armazón de formulario** (`.bkf*`, `.fg`, `.lbl`, `.gctr`, `.sum-t`) | 10 | **Es uno solo y sirve a dos flujos**: reserva (3 pasos) y tour nuevo (5 pasos). Un selector mal replicado descuadra ocho pantallas |
| **Método de pago** (`.pm*`, `.pms`, `.bk-sum-*`) | 8 | El último paso antes de pagar, donde un descuadre cuesta plata |
| **Login** (`.login*`) | 11 | La primera pantalla que ve cualquiera sin sesión |

Se volvió a correr el home como control: dio 34 selectores y **los 34 ya estaban**, cero nuevos. El método es el mismo y los números se suman.

Los cuatro pasos del formulario de tour nuevo **no aportan un solo selector nuevo**: reusan entero el armazón `.bkf`.

### Dos hallazgos que ninguna lista de selectores captura

**1. Los calendarios no tienen clases.** 19 elementos en el paso 1 de la reserva y **62 más en el paso 3 del formulario de tour nuevo** dependen de la herencia y son `div`, `button` y `strong` con estilos inline. 81 en total. **Son invisibles para cualquier checklist por selector**, este incluido, así que no se pueden corregir uno por uno. Y es justo el punto frágil que la Fase 2 ya tenía marcado. Si el centrado no se replica en `.app`, los calendarios se descuadran y la lista no sirve de nada: hay que darles `text-align` propio a los contenedores de las dos grillas.

**2. La hoja de notificaciones está fuera de `.app-demo`.** Se renderiza colgada del `<body>`. Sus 52 elementos cambian cero: **la Fase 4 no la toca.** No es un hueco de la auditoría, es un resultado.

### La auditoría quedó completa

José cerró sesión a mano el 14 ago para que se pudiera medir `login`, que era el último hueco. **No queda ninguna vista del demo sin medir.**

`login` dio **11 selectores**, idénticos en sus dos pestañas y también idénticos a 412px y a 1440px. Eso último confirma de paso una suposición que la auditoría arrastraba sin verificar: **el centrado no depende del breakpoint.**

**`welcome` es la única que no se midió, y no se va a medir.** `.welcome` declara `text-align:center` propio, así que su subárbol hereda de ahí; y la vista solo aparece justo después de registrarse, o sea que medirla exigiría crear una cuenta, que es ensuciar la base de producción para confirmar un cero que el CSS ya afirma.

### La trampa de los controles nativos, segunda aparición

La lectura estática predijo 35 selectores para `login` y son 11. Se equivocó por tres veces, y **por el mismo mecanismo del error E2 de este plan**. Ya van dos veces, con dos propiedades distintas:

| | Propiedad | Qué se creía | Qué pasa de verdad |
|---|---|---|---|
| **E2** | `line-height` | Poner una base en `.app` iba a mover los botones y romper `.chip`, `.dsh-tab`, `.tp-tab` | Los 33 controles nativos computan `normal`. **No se mueve ninguno** |
| **login** | `text-align` | 35 de los 38 selectores `.login-*` dependían de la herencia | Son **11**. La mitad de la familia son controles nativos |

**El mecanismo es uno solo:** el navegador declara la propiedad **sobre el elemento** (`line-height:normal` en botones e inputs, `text-align:center` en `button`, `text-align:start` en `input`), y una declaración sobre el elemento le gana siempre a un valor heredado del ancestro. Da igual qué tan específico sea el ancestro.

**Y el error de método también es uno solo:** las dos veces se contaron selectores sin mirar **qué tipo de elemento** eran. Un `.login-btn` y un `.login-title` se ven igual en una lista de selectores y se comportan al revés frente a la herencia.

**Por qué la lista de 128 sí es confiable.** No se armó contando selectores ni leyendo la cascada: se armó **midiendo**. Se inyectó `.app-demo{text-align:left}` y se registró qué elementos cambiaron de valor computado. Los 128 son elementos que **efectivamente cambiaron**, con los controles nativos ya descartados por el propio navegador. Es la diferencia entre inventariar lo que debería pasar y observar lo que pasa.

**Regla para lo que viene:** frente a cualquier propiedad heredable, la pregunta no es "¿qué selectores la usan?" sino "¿qué elementos cambian cuando la saco?". Y esa segunda solo se responde midiendo.

### Calibración: la lectura estática falló en las dos direcciones

Ninguna de las tres predicciones numéricas dio en el clavo:

| Predicción | Real | |
|---|---|---|
| tour nuevo pasos 2 a 5: "cero nuevos" | cero | acertó |
| paso de pago: "6 selectores" | 8 | **corta** |
| `login`: "35 de 38" | **11** | **sobreestimó por tres veces** |

**Se queda corta** cuando mira una sola familia de selectores: el paso de pago trajo además `.bk-sum-*`. **Sobreestima** cuando cuenta selectores sin mirar qué tipo de elemento son, que es el caso de arriba.

Sirve para decidir si vale la pena abrir una vista. Nunca para reemplazar la medición.

### Por qué 390px además de 412px

A 412px cada celda del grid `.tg` mide ~186px; a 390px mide ~175px. Esos 11px deciden si `.gc-t` pasa de dos líneas a tres, que es el riesgo #3 de la auditoría y la razón de la mitigación obligatoria de la Fase 6. **La serie de 390px documenta el caso apretado**, así que hacen falta al menos home y catálogo a ese ancho.

### El modo claro, destrabado

**`prefers-color-scheme` no se puede forzar desde la página.** Depende de la preferencia del sistema operativo. Las series oscuras se sacaron con macOS en oscuro; las claras salieron el 14 ago con macOS ya en claro, verificando `matchMedia('(prefers-color-scheme: light)')` dentro del iframe antes de cada serie, no por confianza.

El bloqueo del viewport ya estaba resuelto con el iframe. **La Fase 0 no tiene bloqueos abiertos.**

### Salvedad del método del iframe: los `100vh` miden contra el iframe

Un iframe crea su propio viewport, y eso es justamente lo que resuelve el problema del ancho. La contrapartida es que **`vh`, `svh` y `dvh` se resuelven contra la altura del iframe, no contra la de la ventana**.

En este demo eso toca dos lugares: `.det-hero` y el `min-height:100svh` que `.app-demo` le impone al root. Con el iframe a 1272px de alto, `100vh` vale 1272px.

**Para capturas es correcto y además conveniente**, porque fija el alto y hace que las series sean comparables entre sí. Pero **la Fase 4 toca justamente ese `min-height:100svh`**, así que esos dos casos hay que verificarlos también **fuera del iframe**, en una ventana de verdad, antes de dar la fase por buena. Un `100svh` que se ve bien dentro de un iframe de 1272px no prueba nada sobre una ventana de 800px.

### La comparación oscuro vs claro en 1440

Sale gratis con las dos series completas y sirve de línea base para la Fase 4. El demo fuerza fondo claro con `.app{background:var(--wh)}`, así que en teoría los dos modos deberían verse casi idénticos.

**Quedan dos diferencias, y las dos salen del mismo bloque `.app-demo`:**

| # | Qué cambia | De dónde sale | Vistas afectadas |
|---|---|---|---|
| 1 | **Los bordes laterales del contenedor** pasan de gris claro casi invisible a gris oscuro | `.app-demo{border-inline:1px solid var(--border)}` y `--border` cambia de `#e5e4e7` a `#2e303a` | **las 10** |
| 2 | **La barra de scroll del dropdown de notificaciones** | `.app-demo{color-scheme:light dark}`, o sea controles nativos siguiendo al sistema | 1 |

**La primera es una tercera fuga de `.app-demo` que no estaba documentada.** Las dos conocidas (`c171347`, `e818d8e`) eran de `--text-h`; esta es de `--border`, y a diferencia de aquellas se ve en todas las pantallas, no en dos títulos.

**Decisión tomada: el `border-inline` no se replica.** Ver la Fase 4.

Lo demás es idéntico. La garantía no la da el diff de imágenes sino la lectura del `cssRules` del navegador: **el media query oscuro de `index.css` tiene exactamente tres reglas**, y cada consumidor posible se verificó en vivo. `color` y `background` los gana `.app`, que vive en un `<style>` posterior; `h1`/`h2` hoy no los hereda ningún elemento visible; y `code`, `.counter` y `#social` no existen en el demo.

**Hallazgo latente: `h1.det-tl-desktop`.** El detalle de tour tiene un `<h1 class="det-tl-desktop">` que computa `color: var(--text-h)`, el único elemento del demo que consume esa variable. Hoy no se ve: computa `display:none` en los nueve anchos probados, de 390 a 1600.

**No es marcado muerto ni hay que borrarlo.** Es el título del tour pensado para desktop **fuera** del hero, o sea el patrón de Airbnb, y quedó como intención abandonada. Es trabajo pendiente del rediseño de la ficha de tour, anotado en `docs/estado.md`.

**El bug latente de `--text-h` no hay que arreglarlo antes.** La Fase 4 lo desactiva sola al eliminar la variable: cuando el bloque `.app-demo` deje de existir, ese `h1` pasa a heredar el color del demo como cualquier otro elemento. Arreglarlo ahora sería trabajo que la Fase 4 borra.

Detalle completo, con mediciones de los bordes en las 10 vistas y el método, en `datos/comparacion-oscuro-claro.md`.

**Nota sobre 412px:** cae en la misma banda de breakpoint que 390 (`≤1024px`), así que **toda la tipografía computada es idéntica**. Lo único que cambia es el ancho de las cards. Por eso las mediciones 1 y 2 son válidas y definitivas; lo que aporta la serie de 390px es la evidencia visual del caso apretado de la grilla, que es lo que decide la mitigación de `.gc-t` en la Fase 6.

### Método usado

Chrome real contra dev.finde.pe/demo, sesión de `demo@finde.pe`. Las mediciones salen de `getComputedStyle` inyectado en la página, no de cálculo propio: son los valores que computa el navegador. Las capturas son screenshot del viewport, navegando con clics reales por la UI.

**Cero datos creados.** El voucher se capturó de una reserva que la cuenta demo ya tenía.

### Dónde quedó todo

`~/Documents/finde-capturas/2026-08-13-fase0/`, fuera del repo a propósito porque esta fase no hace commits.

| Carpeta | Vistas | Estado |
|---|---|---|
| `INDICE.md` | | qué compara cada serie y con qué método se sacó |
| `pre-fase1-light-412/` | 10 | previo al refactor |
| `post-fase3-dark-412/` | 10 | ✅ |
| `post-fase3-dark-1440/` | 10 | ✅ |
| `post-fase3-dark-390/` | 2 | home y catálogo |
| `post-fase3-light-1440/` | 10 | ✅ |
| `post-fase3-light-390/` | 2 | home y catálogo |
| `datos/mediciones.md` | | mediciones con su método |
| `datos/auditoria-text-align.md` | | los 128 selectores del entregable 4 |
| `datos/comparacion-oscuro-claro.md` | | el entregable 7, oscuro vs claro vista por vista |

### Hallazgo nuevo, no está en la auditoría (severidad baja)

**`.logo` (28px, DM Serif) computa `line-height: 23.2px`, ratio 0.83.** La auditoría lista `.logo` en su tabla de DM Serif pero nunca le mira el interlineado.

**Calibración, para no inflarlo:** un `line-height` menor que el `font-size` **no recorta el texto**. Solo hace que la caja de línea sea más chica que los glifos, que se desbordan hacia el espacio de los vecinos. En una barra con `flex` y `align-items:center`, como es el caso, eso casi nunca se ve, y "finde." no tiene descendentes que asomen. **El riesgo es de matemática de layout, no de legibilidad.**

O sea: hay que arreglarlo porque el número está mal y ensucia cualquier cálculo de altura que se haga sobre el encabezado, no porque alguien esté viendo el logo cortado. Se arregla en la Fase 6.

---

## Fase 1 · Contraste de color

Mejor relación impacto/riesgo del plan. Bugs visibles, riesgo casi nulo.

- **Hallazgos:** §6a, §6b, §6c, §4c
- **Archivos:** solo `src/AppDemo.jsx` (bloque de tokens en `:939`, hexes sueltos, gradiente del hero)
- **Qué se hace:** aplicar la paleta aprobada de arriba; oscurecer el gradiente del hero para que `.hero-sub`, `.hero-tag` y `.login-hero-tagline` pasen AA sobre foto clara; borrar `--gy-soft`; dar color propio a los placeholders de `.inp`, `.login-input`, `.rv-textarea` y `.ai-cc-input`
- **Qué puede romperse:** nada de layout. Cambiar un color no mueve ninguna caja. El riesgo es solo estético
- **Cómo se valida:** capturas de Fase 0 lado a lado. Recorrido con `demo@finde.pe` sobre tours de cuentas `@finde.pe` por home, resultados de búsqueda, detalle, reserva completa hasta el voucher, notificaciones, mis reservas y panel. Revisar en particular badges de estado, hora de notificación, código de reserva, "Ver todos" y el error de un formulario forzado

### Criterio para los bordes: se corrige el que porta el estado

`--lg` (2.87) y `--sg` (3.47) se usan también como color de borde, y ahí el umbral no es 4.5 sino **3:1**, por WCAG 1.4.11, que cubre elementos no textuales.

**Se corrige el borde cuando el borde ES el portador del estado.** Se queda como está cuando es decorativo, o sea cuando el control ya se identifica por otra vía.

| Selector | Qué lo identifica | Decisión |
|---|---|---|
| `.pm-rd` | **nada más que el borde.** Es el radio de método de pago: seleccionado se rellena, no seleccionado solo tiene borde | corregido a `--gy-strong` |
| `.tn-btn` | lleva ícono adentro | se queda en `--lg` |
| `.tdet-act-sec` | lleva texto | se queda en `--lg` |
| `.sal-btn.sec` | lleva texto | se queda en `--lg` |

**Los cuatro `:hover` que usan `--sg` como borde (`.chip`, `.tp-tab`, `.pm`, `.city-btn`) se quedan como están.** Pasan el 3:1 con 3.47, así que no son un fallo de contraste y no le corresponden a esta fase.

Se llegaron a cambiar a `--m` y se revirtieron. Dos motivos, y el segundo importa más que el primero:

1. Como borde, el cambio **sí se percibe**: `--sg` es un verde salvia suave y `--m` es verde bosque oscuro.
2. **Rompía el alcance de la fase.** La Fase 1 corrige fallos de contraste. Un cambio que no corrige ningún fallo es un cambio de diseño, y esos no entran acá aunque se vean bien.

Queda anotado como precedente: **que un color sea mejorable no lo vuelve trabajo de la Fase 1. Tiene que estar fallando.**

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

**`.bn-i` está en el Grupo A por clasificación, pero igual no se toca en esta fase.** Es `<button>`, así que su padding sería estable si se tocara; el problema es otro: su altura no la da el padding sino el ícono de 22px que apila adentro, o sea que ajustarle el padding no es la palanca correcta.

**Hallazgo que la auditoría no tiene:** los ocho targets de su §9 son **todos controles nativos**, o sea Grupo A. Eso significa que la Fase 2 se puede hacer entera ahora y nada de ella se deshace en la Fase 5. Pero también significa que **la auditoría nunca inventarió las zonas tocables que no son controles nativos** (cards, filas de listado, opciones de sheet). Ese barrido del Grupo B queda pendiente y se hace después de la Fase 5.

---

## Fase 3 · Micro-arreglos sueltos

Cada uno es de una a tres líneas, independientes entre sí. Riesgo bajo.

- **Hallazgos:** §1c (el input de 15px), §7b (números), §7c (monospace y cursiva), §8a, §8b, §8c
- **Archivos:** `src/AppDemo.jsx` (constante CSS) e `index.html`. **`Landing.jsx` no se toca**
- **Qué se hace:** subir el input del buscador a 16px en desktop para matar el zoom de iPad · poner `tabular-nums` en el contador de personas, las barras de ingresos y las filas de precio · unificar el código de reserva en un solo tratamiento (hoy tiene dos tamaños, dos pesos, dos colores y dos trackings según la pantalla) · agregar `preconnect` a Google Fonts · sacar el peso 300 que se descarga y no usa nadie
- **Qué puede romperse:** `tabular-nums` cambia levemente el ancho de los números · borrar los `@import` redundantes toca `Landing.jsx`, que es archivo protegido, **queda fuera del plan hasta autorización explícita**
- **Cómo se valida:** el zoom, en un iPad en horizontal. Los números, tocando `+`/`−` en el selector de personas. El `preconnect`, mirando que los títulos serif dejen de parpadear al cargar

### El peso 300 NO se saca de la URL de fuentes. Decidido, no reabrir

La auditoría lo listaba como "descarga muerta" y es correcto que **nadie usa el peso 300**: cero ocurrencias en `AppDemo.jsx`, `Landing.jsx`, `index.css` e `index.html`. Pero sacarlo sale más caro que dejarlo, por dos razones que la auditoría no tuvo en cuenta.

**1. Las tres URLs son byte a byte idénticas y por eso comparten entrada de caché.** `index.html`, el `@import` de `AppDemo.jsx` y el de `Landing.jsx` piden exactamente la misma URL, así que el navegador hace **una sola petición**. Si se le saca el `300;` a una sola, dejan de ser idénticas y aparece una segunda petición. Como `Landing.jsx` es archivo protegido y no se puede tocar, el resultado sería: **la landing, que es la página pública, pasa a pedir dos hojas de fuentes y encima sigue bajando el peso 300**.

**2. Plus Jakarta Sans en Google Fonts es una fuente variable.** Los seis pesos no son seis archivos: son **un solo archivo con un rango de eje**. Quitar el 300 cambia el rango de `300-800` a `400-800` y ahorra unos pocos KB, no un archivo entero como suponía la auditoría.

O sea: el ahorro es casi nulo y el costo es una petición extra en la landing. **Se queda como está.**

Si alguna vez se autoriza tocar `Landing.jsx`, el cambio correcto es actualizar las tres URLs a la vez, nunca una sola.

### Verificado: `tabular-nums` no rompe ningún ancho

Las cifras tabulares ensanchan los dígitos angostos (el "1" pasa de 8.93px a 11.82px), así que había que comprobar que no activaran por una vía nueva el **riesgo #4 de la auditoría**, el precio de la barra de reserva comprimiendo al botón. Medido en el navegador con precios de hasta cinco cifras:

| Selector | Peor caso | Crecimiento | Presupuesto |
|---|---|---|---|
| `.bb-p` | `S/ 1,111` | +13.2px | al botón "Reservar" le quedan **221.7px a 360px**, de sobra |
| `.tc-pr` | `S/ 11,111` | +15.5px | 77.5px dentro de ~232px de la card |
| `.gc-p` | `S/ 11,111` | +13.7px | 68.1px dentro de ~155px de la celda |
| `.sr-price` | `S/ 11,111` | +12.7px | fila flexible |

Dato contraintuitivo: los precios cortos se vuelven **más angostos** con cifras tabulares (`S/ 40` pierde 2.5px), porque el "4" y el "0" son más anchos que el avance tabular. No es un crecimiento en una sola dirección.

---

## Fase 4 · El dominó: `index.css`

Acá empieza la deuda de sistema y el riesgo alto. Nada de esta fase se ve; todo previene bugs futuros.

- **Hallazgos:** §10a completo. Habilita la Fase 5
- **Archivos:** `src/index.css` (borrar el bloque `.app-demo`) y `src/AppDemo.jsx` (replicar a propósito lo que se conserve en `.app`). **Un commit, solo esto**
- **Qué se hace:** el bloque es plantilla de Vite renombrada, pero hoy gobierna el ancho, el centrado, el tamaño del root, el interlineado, el espaciado entre letras y el color de los `h2`. No alcanza con borrarlo: hay que decidir qué se replica
- **Qué puede romperse:** **es el riesgo número uno del proyecto.** Al borrarlo el demo pierde de golpe `width:1126px`, `max-width:100%`, `margin:0 auto`, `text-align:center`, `display:flex`, `flex-direction:column`, `min-height:100svh` y `border-inline`. El centrado en particular sostiene pantallas enteras. El demo declara alineación explícita en 36 reglas propias, o sea que parte se salva sola, pero **128 selectores dependen de la herencia**, más los dos calendarios, que suman 81 elementos sin clase y por eso no entran en ninguna lista
- **Ganancia:** desaparece la fragilidad de que la fuente del demo dependa del orden de inyección del bundler, y desaparece la fuente del bug de "Notificaciones" en vez de seguir tapándolo caso por caso
- **Cómo se valida:** capturas de Fase 0 contra el resultado, **pantalla por pantalla, en 390px y en 1440px, en modo claro y en modo oscuro**. Es la única fase donde vale la pena el diff visual completo antes de pushear

### Criterio de validación: al terminar, oscuro y claro tienen que ser IDÉNTICOS

Es más duro y mucho más verificable que "mirá que se vea bien", así que reemplaza a cualquier revisión a ojo.

**El razonamiento:** las variables de modo oscuro viven dentro del bloque `.app-demo` de `index.css`. Al borrar el bloque desaparecen con él, y con ellas la única vía por la que el demo se entera de la preferencia del sistema. Si después de la Fase 4 queda **cualquier** diferencia entre los dos modos, algo del bloque sobrevivió o se replicó mal.

Hoy, antes de la fase, las diferencias son exactamente dos y están medidas: los bordes laterales del contenedor y la barra de scroll del dropdown de notificaciones. **Las dos tienen que desaparecer.** Concretamente:

- si los bordes laterales siguen cambiando de color, quedó un `border-inline` colgado de `var(--border)`
- si la barra de scroll del dropdown sigue cambiando, quedó el `color-scheme: light dark`
- si aparece una diferencia **nueva**, que hoy no existe, es que la Fase 4 la introdujo

**Cómo se verifica**, y este es el punto: no hace falta capturar de nuevo las dos series enteras. Alcanza con **releer el `cssRules` del navegador** y confirmar que el media query `prefers-color-scheme: dark` ya no tiene ninguna regla que aplique al demo. Eso cubre todo el demo, no solo las diez vistas capturadas. El diff de imágenes queda como confirmación, no como prueba.

**Ojo con el ancho al replicar.** El bloque también declara `width:1126px`, `margin:0 auto`, `text-align:center` y `min-height:100svh`. Eso no es modo oscuro y no se valida con este criterio: va aparte, con las capturas.

### Secuencia obligatoria: replicar primero, borrar después, limpiar al final

**No es una recomendación ni queda a criterio del momento. La Fase 4 se hace en este orden y no en otro.**

| # | Paso | Cómo se verifica |
|---|---|---|
| **a** | **Replicar `text-align:center` en `.app`**, con el bloque de `index.css` todavía en su lugar | Comparar contra `post-fase3-*`. **Nada se tiene que haber movido.** Si algo se movió, el problema está acá y no más adelante |
| **b** | **Borrar el bloque `.app-demo`** de `index.css` | Comparar de nuevo contra `post-fase3-*`, y además confirmar que el media query oscuro ya no tiene reglas que apliquen al demo |
| **c** | **Recién después**, ir sacando el centrado selector por selector con la lista de 117 | Cada quita se valida sola, y se puede revertir de a una |

**Por qué este orden y no el intuitivo.** Lo natural sería borrar primero y corregir después con la lista en la mano. Eso no funciona, y el motivo es concreto: **los dos calendarios suman 81 elementos que dependen de la herencia y no tienen ninguna clase**, son `div`, `button` y `strong` con estilos inline. No hay ninguna entrada en la lista de 117 que los arregle, porque no se pueden nombrar. Si se borra primero, se descuadran y no hay checklist que los levante.

O sea: **la lista de 117 selectores no es la herramienta principal, es la secundaria.** La principal es replicar el centrado. La lista sirve para la limpieza opcional del paso (c), que se puede no hacer nunca.

El paso (a) tiene además una propiedad que conviene aprovechar: **es reversible y no rompe nada**, porque mientras el bloque siga vivo el centrado ya estaba. Es la única oportunidad de verificar la réplica de forma aislada, sin que se mezcle con los otros ocho efectos de borrar el bloque.

### Los dos flujos de formulario NO están en las capturas de línea base

Esto no es un detalle: **es un agujero en el método de validación de la Fase 4.**

Ni el flujo de reserva ni el de tour nuevo aparecen en `post-fase3-*`. Las capturas cubren home, catálogo, notificaciones, mis reservas, perfil, las tres pestañas del panel, detalle de tour y voucher. **Los formularios no están.**

Y ahí viven **los 81 elementos sin clase de los dos calendarios**, más el armazón `.bkf`, que sirve a los dos flujos a la vez: reserva (3 pasos) y tour nuevo (5 pasos). **Un selector mal replicado ahí descuadra ocho pantallas de una.**

**El diff visual no los va a detectar, porque no hay contra qué diffear.**

Así que la validación de la Fase 4 incluye, obligatorio y a mano:

- Recorrer **los 3 pasos del flujo de reserva** y **los 5 del formulario de tour nuevo**
- En **390px y en 1440px**
- **Dos veces**: después de replicar el centrado (paso a) y otra vez después de borrar el bloque (paso b)

Prestando atención particular a las dos grillas de calendario, que son donde se concentra el riesgo y donde ninguna lista de selectores ayuda.

### Decisión tomada: el `border-inline` NO se replica

**No es un pendiente ni queda a criterio del momento.** Queda escrito acá justamente para que no se replique por inercia junto con las propiedades que sí hay que conservar.

El marco lateral de 1px que rodea al contenedor de 1126px es **estética de scaffold de Vite, no diseño de Finde**. Vino con la plantilla, igual que el resto del bloque. Al borrar el bloque desaparece, y así se queda.

Consecuencia práctica: la diferencia #1 entre modo claro y modo oscuro, la que hoy se ve en las 10 vistas, **se cierra sola**. No hay que corregir nada, hay que no replicar nada.

Lo que sí hay que decidir a propósito es el ancho, el centrado y el `min-height`. El borde no entra en esa lista.

---

## Fase 5 · Interlineado base y ritmo vertical

Depende de la Fase 4. Riesgo medio.

- **Hallazgos:** hallazgo principal, §3a, §3b, §3c
- **Archivos:** `src/AppDemo.jsx` (tokens de `.app` y las ~30 reglas de `line-height` que hoy compensan a mano)
- **Qué se hace:** darle a `.app` un interlineado base **sin unidad**, para que se herede como proporción y no como valor fijo, y limpiar las reglas que existen solo para compensar la base equivocada
- **Qué puede romperse:** menos de lo que dice la auditoría. Por E2 los botones no se mueven. Lo que sí se mueve es todo el texto dentro de `div`, o sea alturas de card, y ahí `.tc` (ancho fijo de 260px) y `.tg` (grilla de dos columnas en mobile) pueden dejar de tener altura pareja
- **Cómo se valida:** home y catálogo en 390px mirando que las cards de la grilla sigan alineadas. Detalle de tour con descripción larga. Voucher completo. **Al terminar, recién ahí, el barrido de padding del Grupo B de la Fase 2**

### Caso de verificación medido: el badge "Finde Verificado" encoge

Sale de investigar un desalineado que José reportó en el QA del 14 ago. El desalineado resultó ser otra cosa (ver abajo), pero la medición dejó un caso concreto para esta fase.

`.tc-ver` y `.gc-ver` están a **9px de fuente dentro de una caja de línea de 23.2px, ratio 2.58**. El contenido real del badge mide unos 12px, pero el badge mide **29.2px de alto**, porque el interlineado heredado manda sobre el contenido.

Medido en el navegador, inyectando `line-height:1.6` en `.app-demo`, que es lo que hace esta fase:

| Selector | Alto hoy | Alto con la base arreglada |
|---|---|---|
| `.tc-ver` | 29.2px | **22.4px** |
| `.gc-ver` | 29.2px | **20.4px** |

O sea que **el badge encoge entre 7 y 9px**, y como está en `position:absolute` sobre la foto, no empuja el layout de la card pero sí cambia su peso visual sobre la imagen. Hay que mirarlo.

**Es además la mejor demostración de por qué esta fase existe:** un badge de 9px de texto ocupando 29px de alto es exactamente el síntoma de una base de interlineado en valor absoluto.

### Lo que NO es un caso de esta fase: el desalineado del check

Se midió y **la Fase 5 no lo arregla**. Queda escrito para que nadie lo espere.

`.tc-ver` tiene el check 2.5px más arriba que el texto. `.gc-ver`, con **el mismo font-size y el mismo interlineado heredado**, está a 0.09px, o sea perfecto. Si la causa fuera el ratio 2.58, los dos estarían mal.

La causa es que `.gc-ver` declara `display:inline-flex; align-items:center` y `.tc-ver` no. Sin flex, el `<svg>` de 12px es contenido inline y se alinea por `vertical-align:baseline`, así que apoya su borde inferior en la línea base y sobresale por arriba.

Verificado con dos experimentos en el navegador:

| Experimento | Desfase de `.tc-ver` |
|---|---|
| como está hoy | -2.5px |
| bajando el interlineado a 1.6, o sea lo que hace esta fase | **-2.5px, no cambia** |
| dándole a `.tc-ver` el `inline-flex` que ya tiene `.gc-ver` | **0.09px** |

Es un bug independiente y preexistente, de una línea. **Arreglado aparte, en `fix/badge-verificado`**, replicando en `.tc-ver` el `display:inline-flex; align-items:center; gap:3px` que `.gc-ver` ya tenía. Verificado con la regla final literal: el desfase pasó de `-2.36px` a `+0.68px`, exactamente el de su gemelo, y el badge no se movió de la foto (sigue a 10px del borde izquierdo y 10px del inferior).

### La hipótesis del ratio 2.58 era incorrecta, y por qué la prueba la descartó

Vale anotarlo porque el método es reutilizable, no porque el número importe.

**La hipótesis:** el badge se desalinea porque su texto de 9px vive en una caja de línea de 23.2px, ratio 2.58, y el centrado se descalibra contra un SVG de tamaño fijo.

**Por qué era razonable:** el ratio 2.58 es real y está medido. Y es cierto que ese interlineado infla la caja del badge, que es de lo que trata la Fase 5.

**Qué la descartó:** `.gc-ver` tiene **el mismo `font-size` de 9px y el mismo interlineado heredado de 23.2px**, o sea el mismo ratio 2.58, y está alineado a 0.68px. Si el ratio fuera la causa, los dos estarían mal. Como uno está bien y el otro mal, la causa tiene que estar en algo en lo que difieren, y difieren en una sola cosa: `.gc-ver` declara `inline-flex` y `.tc-ver` no.

**El método, que es lo que conviene recordar:** cuando hay dos elementos casi idénticos y uno falla, **la causa está en lo que los diferencia, no en lo que comparten.** El ratio 2.58 lo comparten, así que no puede explicar por qué uno falla y el otro no. Aislar así es más barato y más concluyente que razonar sobre el mecanismo, y no necesita entender la causa de antemano.

La confirmación experimental cerró el caso en dos mediciones: bajar el interlineado a 1.6 dejó el desfase igual en `-2.5px`, y darle el `inline-flex` lo llevó a `0.09px` sin tocar el interlineado.

---

## Fase 6 · La escala en tokens

La fase grande. Deuda pura, riesgo alto, ninguna urgencia.

- **Hallazgos:** §1a, §1b, §1c, §2, §4a, §4b, §5, §10b
- **Archivos:** `src/AppDemo.jsx`, la constante CSS entera
- **Qué se hace:** aplicar la escala aprobada de abajo
- **Qué puede romperse:** el §10b de la auditoría es su mejor sección y se verificó en lo esencial. Los puntos frágiles son el contador de personas con 60px fijos, el precio de la barra de reserva que no envuelve y comparte fila con el botón "Reservar", la grilla de dos columnas a 390px donde cada celda mide ~175px, y los tabs del panel que en desktop pasan a columna de 220px fijos
- **Cómo se hace:** partir en sub-pasos **por pantalla, no por propiedad**. Un commit por pantalla se puede revertir; un commit de 242 reemplazos no
- **Cómo se valida:** recorrido completo por las doce vistas del demo en 390px, 768px y 1440px

### La escala, aprobada

| Token | Mobile | Desktop | Fuente / peso | Line-height |
|---|---|---|---|---|
| `--fs-d1` | 30 | 44 | DM Serif 400 | 1.15 |
| `--fs-d2` | 26 | 32 | DM Serif 400 | 1.2 |
| `--fs-h1` | 20 | 22 | Jakarta 700 | 1.3 |
| `--fs-h2` | 17 | 18 | Jakarta 700 | 1.35 |
| `--fs-h3` | 15 | 15 | Jakarta 700 | 1.35 |
| `--fs-body` | 16 | 16 | Jakarta 400 | 1.6 |
| `--fs-sm` | 14 | 14 | Jakarta 500 | 1.5 |
| `--fs-cap` | 13 | 13 | Jakarta 500 | 1.4 |
| `--fs-label` | 12 | 12 | Jakarta 600 | 1.3 |

**Reglas que van con la escala:**

- **Piso absoluto de 12px, sin excepciones.** Elimina las 56 declaraciones del CSS y las 64 inline que hoy están por debajo.
- **Pesos: 400 cuerpo, 500 metadatos, 600 etiquetas y UI, 700 títulos. El 800 se elimina por completo** (20 declaraciones). A 16px, Jakarta 800 se empasta y 700 alcanza.
- **DM Serif Display solo en `--fs-d1` y `--fs-d2`, o sea nunca por debajo de 26px.** Esto responde la pregunta que el plan dejaba abierta: **11 de los 20 usos actuales de serif bajan a Jakarta 700.**
- **Versalitas: sobreviven solo en `--fs-label` y solo en badges de estado** (`.tp-st`, `.dsh-bk-s`, `.st-*`), donde ayudan al escaneo. Se eliminan de `.tc-loc`, `.gc-loc`, `.det-st`, `.ai-sum-h`, `.pf-stat-l`, `.dsh-s-l`, `.login-hero-stat-l`, `.sal-sec-t` y `.site-footer-col-t`. El tracking pasa a **un solo valor relativo, `.03em`**, en lugar de los seis valores absolutos de hoy.

### ⚠️ Advertencia: la escala se aplica por rol, no por valor

**"Reemplazar los 23 tamaños sueltos" NO significa un mapeo mecánico px → token.**

`13px` no es un rol, es un accidente. Sus 47 declaraciones sirven a **tres funciones distintas**: texto de lectura, metadatos secundarios y etiquetas de control. Un mapeo mecánico las colapsa en una sola y **destruye exactamente la jerarquía que el rediseño existe para crear**.

**CADA DECLARACIÓN SE CLASIFICA POR ROL, NO POR VALOR.**

Un buscar y reemplazar de `13px` por `var(--fs-cap)` es la forma más rápida de terminar con una escala nueva y la misma jerarquía plana de antes.

### Mitigaciones obligatorias

No son opcionales ni quedan a criterio del momento. Van sí o sí con la fase.

**1. `.gc-t` va a 15px (`--fs-h3`), no a 16px, y necesita `-webkit-line-clamp: 2`.**

A 390px la celda de `.tg` deja ~155px útiles. A 15px con peso 700 entran ~19 caracteres por línea, o sea 38 en dos líneas. Los títulos de 40 caracteres o más se van a tres líneas y la grilla pierde la altura pareja, que es el **riesgo #3 de la auditoría**. Con el clamp deja de ser riesgo.

**2. `.gcnt` cambia `width:60px` por `min-width:60px`.**

Una línea. Elimina el **riesgo #5** sin congelar el tamaño del contador.

### `.logo`

Va a **`--fs-d2` con `line-height: 1.1` explícito**. Hoy computa 0.83 porque no declara interlineado propio y hereda el valor absoluto del root. Es el hallazgo de severidad baja de la Fase 0: el problema es de matemática de layout, no de legibilidad.

### El número de rating, heredado de la Fase 1

La Fase 1 no pudo corregir el color del número de rating y **el trabajo cae acá, no en la Fase 7**.

`.tc-m .rt`, `.gc-m .rt` y `.sr-rating` renderizan **la estrella y el número dentro del mismo elemento**, con el ícono en `fill="currentColor"`. O sea que el color es uno solo para los dos: pintar el número en `--ch` pinta también la estrella, y la estrella tiene que quedarse en `--gd` porque es decorativa.

Separarlos exige envolver el número en su propio elemento, que es un cambio de JSX y no de CSS. **Se hace en esta fase y no en la 7 porque estos tres selectores se tocan igual acá** (`.sr-rating` está a 10px y muere con el piso de 12px; `.tc-m` y `.gc-m` cambian de tamaño y de peso), así que conviene separar ícono y número en el mismo viaje en vez de abrir el archivo dos veces.

Objetivo al separarlos: número en `--ch` o `--gy-strong`, estrella en `--gd`.

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

### Corrección (c): rama mergeada, ya borrada

`origin/docs/reestructuracion-documentacion` estaba mergeada en `main` (commit `4fe412d`) y **ya fue borrada**. Queda una copia local homónima en la máquina de José, sin uso.

---

## Riesgo operativo fuera de alcance

No lo resuelve este plan, pero este plan lo empeora, así que queda registrado acá.

**dev.finde.pe escribe sobre la base de producción.**

Hoy es inofensivo: todo el contenido es demo y Mega Tours es data de prueba con correo inventado, no una agencia real. Pero **este plan tiene ocho fases de QA con recorrido completo hasta el voucher**, y cada pase crea reservas y muta contadores de cupo **en la misma base donde va a vivir el inventario real**.

Dos acciones, en orden:

**a) Ahora, y no cuesta nada: todo el QA usa direcciones `@finde.pe` reales como destinatario.** Mandar a dominios inexistentes genera rebotes, y los rebotes dañan la reputación de `finde.pe` en Resend, que es un dominio recién verificado. Esto no es una precaución teórica: es la diferencia entre que los correos de reserva lleguen o caigan en spam cuando entre la primera agencia real.

**b) Antes de la primera agencia real: base de staging separada**, o `dev` apuntando a un proyecto Supabase distinto con datos sembrados. Es trabajo aparte y **no bloquea este plan**, pero tiene que llegar antes que la Fase 7.

---

## Reglas de ejecución

- Ninguna fase se implementa sin visto bueno explícito.
- Las fases 0 a 3 y las fases 4 a 7 **no comparten commit**.
- QA solo con `demo@finde.pe` y sobre tours de cuentas `@finde.pe`, con destinatarios `@finde.pe` reales. El motivo no es que los correos lleguen a terceros: es que **dev.finde.pe escribe sobre la base de producción** y que los rebotes queman la reputación del dominio. Ver "Riesgo operativo fuera de alcance".
- Los datos que se creen durante el QA se borran al terminar.
- `src/Landing.jsx` no se toca sin la frase "EXCEPCIÓN AUTORIZADA".
