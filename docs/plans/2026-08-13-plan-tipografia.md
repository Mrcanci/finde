# Plan tipográfico del demo

**Fecha:** 13 ago 2026 · **Rama de origen:** `dev` · **Fuente:** `docs/audits/2026-08-13-typography-audit.md`
**Estado al 2026-08-15:** Fases 0 a 3 en `main` (`af7c0b1`). Fase 4 en `main` (`6f3bbed`). **Fase 5 COMPLETA y en `main`** (`86a4ea3`), post-QA.

**Estado al 2026-08-18:** la elección tipográfica se decidió y se aplicó (el producto sale del serif), y con eso **la Fase 6 quedó desbloqueada y se partió en dos**. **La siguiente es la 6A**: los tokens y la jerarquía entre el título de sección y el de tarjeta. La 6B es el barrido del piso de 12px, las versalitas y el calendario. El barrido de padding del Grupo B sigue pendiente y es independiente de las dos.

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

**Lo que quedaba sin verificar, ya cerrado:** la cursiva muerta de `.voucher-more` **sí era por `font-synthesis`** (confirmado el 14 ago), y lo que se descuadra al perder el `text-align:center` quedó medido en los 128 selectores del entregable 4.

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
| 6 | Confirmar si la cursiva de `.voucher-more` se ve o no | ✅ **CERRADO el 14 ago con la Fase 4. Se veía RECTA**: Plus Jakarta Sans no trae cara itálica y `font-synthesis:none` impedía inventarla. Se sacó el `font-style:italic` |
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

**Para capturas es correcto y además conveniente**, porque fija el alto y hace que las series sean comparables entre sí. **Corregido el 14 ago:** el `min-height:100svh` del bloque **ya está muerto**. `.app` declara `min-height:100vh` con la misma especificidad y le gana por orden de documento, porque el `<style>` del demo se renderiza en el `<body>` y el `index.css` vive en el `<head>`. O sea que la Fase 4 no lo toca y no hay nada que replicar ahí. Queda un solo caso a verificar fuera del iframe, `.det-hero`, y por el `100vh` que declara él mismo, no por el bloque.

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

**DESBLOQUEADO el 2026-08-15**, con la Fase 5 en `main`. Era lo único que la esperaba: el padding del Grupo B había que calcularlo con la base nueva puesta, porque esas zonas sí heredan interlineado. **El inventario hay que armarlo**, no existe: el §9 de la auditoría solo listó controles nativos.

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

## Fase 4 · El dominó: `index.css` ✅ COMPLETA

Acá empieza la deuda de sistema y el riesgo alto. Nada de esta fase se ve; todo previene bugs futuros.

- **Hallazgos:** §10a completo. Habilita la Fase 5
- **Archivos:** `src/index.css` (borrar el bloque `.app-demo`) y `src/AppDemo.jsx` (replicar a propósito lo que se conserve en `.app`). **Un commit, solo esto**
- **Qué se hace:** el bloque es plantilla de Vite renombrada, pero hoy gobierna el ancho, el centrado, el tamaño del root, el interlineado, el espaciado entre letras y el color de los `h2`. No alcanza con borrarlo: hay que decidir qué se replica
- **Qué puede romperse:** **es el riesgo número uno del proyecto.** Al borrarlo el demo pierde de golpe `width:1126px`, `max-width:100%`, `margin:0 auto`, `text-align:center`, `display:flex`, `flex-direction:column` y `border-inline`, y además `font-size:18px` (16px en ≤1024px), `line-height:145%`, `letter-spacing:0.18px`, `font-synthesis:none`, `text-rendering:optimizeLegibility`, `box-sizing:border-box` y las reglas de `h1`/`h2` (peso 500 y `margin:0 0 8px`). **`min-height:100svh` NO entra en la lista: `.app` ya declara `min-height:100vh` y le gana por orden de documento, o sea que hoy ya está muerto.** El centrado en particular sostiene pantallas enteras. El demo declara alineación explícita en **36 selectores del CSS más 20 `textAlign` inline en el JSX, o sea 56 que se salvan solos** (el 36 de la auditoría solo cuenta el CSS), pero **128 selectores dependen de la herencia**, más los dos calendarios, que suman 81 elementos sin clase y por eso no entran en ninguna lista
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

**Ojo con el ancho al replicar.** El bloque también declara `width:1126px`, `margin:0 auto` y `text-align:center`. Eso no es modo oscuro y no se valida con este criterio: va aparte, con las capturas.

### Secuencia obligatoria: replicar primero, borrar después, limpiar al final

**No es una recomendación ni queda a criterio del momento. La Fase 4 se hace en este orden y no en otro.**

| # | Paso | Cómo se verifica |
|---|---|---|
| **a** | **Replicar `text-align:center` en `.app`**, con el bloque de `index.css` todavía en su lugar | Comparar contra `post-fase3-*`. **Nada se tiene que haber movido.** Si algo se movió, el problema está acá y no más adelante |
| **b** | **Borrar el bloque `.app-demo`** de `index.css` | **El diff tiene que ser exactamente el efecto del `border-inline` y nada más.** Ver abajo. Más confirmar que el media query oscuro ya no tiene reglas que apliquen al demo |
| **c** | **Recién después**, ir sacando el centrado selector por selector con la lista de 128 | Cada quita se valida sola, y se puede revertir de a una |

**Por qué este orden y no el intuitivo.** Lo natural sería borrar primero y corregir después con la lista en la mano. Eso no funciona, y el motivo es concreto: **los dos calendarios suman 81 elementos que dependen de la herencia y no tienen ninguna clase**, son `div`, `button` y `strong` con estilos inline. No hay ninguna entrada en la lista de 128 que los arregle, porque no se pueden nombrar. Si se borra primero, se descuadran y no hay checklist que los levante.

O sea: **la lista de 128 selectores no es la herramienta principal, es la secundaria.** La principal es replicar el centrado. La lista sirve para la limpieza opcional del paso (c), que se puede no hacer nunca.

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

### Decisión tomada: el `border-inline` NO se replica, ni siquiera transparente

**No es un pendiente ni queda a criterio del momento.** Queda escrito acá justamente para que no se replique por inercia junto con las propiedades que sí hay que conservar.

El marco lateral de 1px que rodea al contenedor de 1126px es **estética de scaffold de Vite, no diseño de Finde**. Vino con la plantilla, igual que el resto del bloque. Al borrar el bloque desaparece, y así se queda.

Consecuencia práctica: la diferencia #1 entre modo claro y modo oscuro, la que hoy se ve en las 10 vistas, **se cierra sola**. No hay que corregir nada, hay que no replicar nada.

Lo que sí hay que decidir a propósito es el ancho y el centrado. El borde no entra en esa lista, y el `min-height` tampoco: ya está muerto.

**Se descartó también la variante `border-inline:1px solid transparent`**, que habría dejado la geometría idéntica al píxel. El motivo no es técnico: es que un borde transparente es un artefacto que nadie entiende en seis meses y que alguien borra sin saber que sostenía 2px. **Es la misma deuda de sistema entrando por otra puerta**, que es justo lo que esta fase existe para sacar.

**Criterio de validación del paso (b), ya con esto decidido:** el diff contra `post-fase3-*` tiene que ser **exactamente el efecto del borde y nada más**. Eso es, medido en el Paso 0: el contenido pasa de 1124px a 1126px en desktop y de 388px a 390px en mobile, todo se corre 1px a la izquierda, y el único elemento que reflowea es `.gc-t` del tour "Caral", que pasa de tres líneas a dos y se empareja con la grilla. **Cualquier otra diferencia es un error de la fase.**

---

### Investigación del 14 ago: inventario completo, riesgos nuevos y plan aprobado

Salida de la tanda de investigación previa a implementar, aprobada por José con cinco ajustes.
**Reemplaza a cualquier lista anterior de lo que el bloque impone.** Todos los conteos salen de
script sobre el archivo en su estado del 14 ago, no de leer una lista.

#### Punto de partida: qué declara `.app` hoy

Solo esto: los 19 tokens de marca, `font-family`, `background`, `color`,
`-webkit-font-smoothing`, `overflow-x`, `min-height:100vh` y `position:relative`. Nada más.

#### Qué se replica y qué se descarta

| Propiedad | Impone el bloque | ¿`.app` la declara? | Decisión |
|---|---|---|---|
| `font-size` root | **18px**, 16px en ≤1024px | NO | **REPLICAR idéntico.** Sin esto el desktop encoge de 18 a 16 y la fase deja de ser invisible. Cambiarlo es Fase 5 |
| `line-height` | `145%` (26.1px desktop, 23.2px mobile) | NO | **REPLICAR idéntico**, como `145%`, no como valor fijo. Pasarlo a sin unidad es Fase 5 |
| `letter-spacing` | `0.18px` | NO | **REPLICAR.** Es global y decide dónde corta cada línea. Sacarlo es Fase 6 |
| `text-align` | `center` | NO | **REPLICAR.** Es el paso (a), el riesgo número uno |
| `width` | `1126px` | NO | **REPLICAR.** Sin esto el demo se va a ancho completo en desktop |
| `max-width` | `100%` | NO | **REPLICAR**, va pegada a `width` |
| `margin` | `0 auto` | NO | **REPLICAR**, es lo que centra el contenedor |
| `display` | `flex` | NO | **REPLICAR, OBLIGATORIO.** Ver abajo |
| `flex-direction` | `column` | NO | **REPLICAR, OBLIGATORIO.** Ver abajo |
| `min-height` | `100svh` | **SÍ: `100vh`, y ya le gana** | **DESCARTAR.** Ya está muerto, no hay nada que replicar |
| `box-sizing` | `border-box` | NO (`.app *` cubre a los hijos, no a `.app`) | **DESCARTAR.** `.app` no tiene padding ni borde propio |
| `border-inline` | `1px solid var(--border)` | NO | **DESCARTAR.** Ya decidido arriba |
| `color-scheme` | `light dark` | NO | **DESCARTAR.** Es lo que la fase quiere matar |
| `text-rendering` | `optimizeLegibility` | NO | **DESCARTAR**, mirando los títulos DM Serif: activa ligaduras y kerning, y el ancho del texto puede moverse un pelo |
| `font-synthesis` | `none` | NO | **DESCARTAR**, con la corrección de R3 en el mismo commit |
| `-moz-osx-font-smoothing` | `grayscale` | NO | **DESCARTAR.** Solo Firefox en macOS, cosmético |
| `-webkit-font-smoothing` | `antialiased` | SÍ, igual | nada que hacer |
| `color` / `background` / `font-family` | `var(--text)` / `var(--bg)` / `var(--sans)` | SÍ, y ganan | nada que hacer, ya están pisadas |

**`display:flex` y `flex-direction:column` son réplica obligatoria, no precaución.** Ese `div` **es**
hoy un contenedor flex en columna. Si no se replica pasa a `block`, y con eso cambian dos cosas: el
colapso de márgenes entre los hijos directos (flex lo impide, block no) y cómo se reparte el
`min-height`. No es una property cosmética.

#### El bloque tiene más código muerto del que parecía

Verificado con script: **las trece variables del bloque (`--text`, `--text-h`, `--bg`, `--border`,
`--code-bg`, `--accent`, `--accent-bg`, `--accent-border`, `--social-bg`, `--shadow`, `--sans`,
`--heading`, `--mono`) tienen CERO consumidores** en `AppDemo.jsx` y en `Landing.jsx`. Los únicos
que las usan son los propios sub-bloques del `index.css`.

Y tampoco existen en el demo `id="social"`, `<code>` ni `.counter`. O sea que **el media query
oscuro entero y el bloque de `code`/`.counter` son 100% código muerto**: se borran sin verificar nada.

#### Cuatro riesgos que este plan no tenía anotados

**R1. El peso de los tres `h2`.** `.app-demo h1, .app-demo h2{font-weight:500}` tiene especificidad
clase más elemento, así que le gana al `bold` que el navegador le pone a un `<h2>` por defecto. Los
tres `h2` del demo (`.npage-h h2`, `.tp-h h2`, `.tdet-page .tdet-h`) **no declaran `font-weight`
propio**. Al borrar el bloque saltan a 700, y los tres usan DM Serif Display, que en el archivo
cargado solo tiene el peso 400.

Hoy computan 500 pero **renderizan 400**, porque es el único peso que existe y `font-synthesis:none`
impide inventarlo. Sin el bloque, computarían 700 y el navegador los engordaría a mano.

**Medido el 14 ago: heredan CUATRO propiedades de `.app-demo h2`, no una.** Además del peso: `line-height:118%` (28.32px sobre 24, 33.04px sobre 28), `letter-spacing:-0.24px` y `margin:0 0 8px`. `.tdet-h` se salva del margen porque declara `margin-bottom:14px` con más especificidad.

**Arreglo: `font-weight:400` explícito a los tres, más replicar las otras tres en `.app h2`.** Declarar 400 preserva el render exacto de hoy.

**R2. El margen de 8px de los `h2`.** Misma cascada: `.app-demo h2{margin:0 0 8px}` (0,1,1) le gana a
`.app *{margin:0}` (0,1,0). `.tdet-h` se salva porque declara `margin-bottom:14px` con más
especificidad, pero **"Notificaciones" y "Mis reservas" pierden 8px** y sus cabeceras se acortan.

**R3. La cursiva de `.voucher-more`.** Cierra el entregable 6 de la Fase 0, que seguía pendiente.

Hay **exactamente un** `font-style:italic` en todo el demo: `.voucher-more`. No declara familia, así
que hereda Plus Jakarta Sans, y el `@import` pide `wght@300;400;500;600;700;800` **sin eje de
cursiva**: no hay archivo itálico. Con `font-synthesis:none`, el navegador no la inventa.

**O sea que hoy ese texto se ve recto.** Al borrar el bloque aparecería una cursiva sintética que hoy
no existe.

**Ojo con cómo se verifica.** El valor computado de `font-style` sigue siendo `italic` con el bloque puesto: `font-synthesis` no cambia el valor computado, cambia el **render**. Confirmado el 14 ago midiendo las caras cargadas (Plus Jakarta Sans tiene **cero** caras itálicas) y visualmente, con las dos variantes lado a lado.

**Decisión tomada: se saca el `font-style:italic`.** Hoy no se ve, nadie la extraña, y una cursiva
sintética a 11px se ve mal. Sacarla preserva el estado actual, que es el objetivo de la fase.
**Va en el commit del paso 2, no en uno aparte:** es parte de dejar la fase invisible, no una
decisión de diseño.

**R4. `color-scheme` toca más que la barra de scroll del dropdown.** El criterio de validación de
arriba dice que las diferencias claro contra oscuro son exactamente dos y están medidas. Eso es
cierto **solo para las 10 vistas capturadas**.

`color-scheme: light dark` gobierna todos los controles nativos, y el demo tiene, contados: **2
`input type="time"`, 4 `type="number"`, 2 checkbox, 1 radio, 3 `type="file"` y 2 `<textarea>`**.
Todos viven en los dos flujos de formulario, que **no están en la línea base**.

**⚠️ Corregido el 2026-08-14, al ejecutar el paso 2: R4 estaba sobredimensionado.** Se midieron
los controles uno por uno y el resultado real es mucho más chico:

| Control | Resultado |
|---|---|
| `text`, `number`, `textarea` | **sin cambio**. El demo ya les declara fondo, color y borde, así que `color-scheme` no tenía nada que pintar. La agarradera de resize del textarea tampoco cambia |
| `checkbox` | sin cambio visible |
| `file` | el input nativo mide 0x0. El demo usa su propia zona de arrastre |
| **los "radios" del método de pago** | **no son controles nativos.** Son `<div class="pm-rd">` pintados por CSS, así que `color-scheme` nunca los tocó |
| **`time`** | **el único que cambia.** Ver abajo |

**El error de método fue el mismo de siempre:** se contaron `type="radio"` en el código fuente sin
mirar dónde renderizaban ni si el demo ya los estilaba. Es la tercera aparición de la misma
trampa, después de E2 (`line-height`) y de `login` (`text-align`). **Contar declaraciones en el
fuente sobreestima; la única forma de saberlo es medir.**

### Bug de accesibilidad corregido de paso: el ícono del reloj

**No es un efecto secundario de la Fase 4. Es un bug preexistente que la fase destapa y arregla**,
y por eso va anotado como bug y no como cambio.

El bloque declaraba `color-scheme: light dark`. Con macOS en modo oscuro, Chrome pintaba el ícono
del selector del `input type="time"` en color claro, **sobre el campo blanco que el demo fuerza con
`.app{background:var(--wh)}`**. Resultado: el ícono quedaba invisible. Un usuario en modo oscuro no
veía que ese campo abría un selector de hora.

Está en el paso 3 de 5 del formulario de tour nuevo, campo "Hora de salida". Al borrar el bloque el
ícono se pinta oscuro y **se ve**.

Evidencia: `~/Documents/finde-capturas/2026-08-14-fase4/datos/icono-hora-ANTES-oscuro.png` y
`icono-hora-DESPUES-oscuro.png`.

**Es el caso que mejor justifica esta fase entera.** El bloque no era solo deuda inerte de la
plantilla: le estaba metiendo al demo una preferencia de sistema que el demo no honra en ningún
otro lado, y eso rompía un control real para una parte de los usuarios.

#### Lo que se revisó y NO es riesgo

- **`em` y `rem`:** hay **un solo** `em` en todo `AppDemo.jsx`, un `letter-spacing:.05em`, y resuelve
  contra el tamaño del propio elemento, no contra el root. **Cero `rem`.** Nada depende del 18px por
  esa vía. El 18px se hereda directo, que es otra cosa y ya está en la tabla.
- **`vh` y `svh`:** los diez usos (`.det-hero`, `.det-c`, las sheets, el dropdown) miden contra el
  viewport, no contra el bloque. **Nada cambia.**
- **El ancho completo de `.tn`:** usa `calc(-50vw + 50%)`, y ese `50%` es del contenedor, o sea que
  **depende directamente del `width:1126px`**. Con el ancho replicado no pasa nada. Es un argumento
  más para replicarlo.

#### Plan de ejecución aprobado, cinco pasos

**Paso 0, solo medición.** Tag `pre-fase4`. Confirmar en el navegador las tres deducciones que salen
de leer el CSS, porque la lectura estática ya falló dos veces en este plan: que `min-height` computa
`100vh` y no `100svh`, que los tres `h2` computan peso 500, y que `.voucher-more` computa `normal` y
no `italic`. Capturar la línea base que falta: los 3 pasos de reserva y los 5 de tour nuevo, en 390 y
1440, claro y oscuro. Más el volcado inicial de `getComputedStyle`.

**Paso 1, replicar en `.app` con el bloque todavía vivo.** Un commit. Las diez propiedades marcadas
REPLICAR, más el `font-weight:400` de R1 y el margen de R2. *Qué puede romperse:* nada visible, y ese
es el punto. Todo lo que se agrega ya estaba activo por herencia. Si algo se mueve, el error está acá
y se revierte solo.

**Paso 2, borrar el bloque.** Un commit, que incluye sacar el `font-style:italic` de R3. *Qué puede
romperse:* el kerning de los títulos serif y los controles nativos de los formularios (R4). *Cómo se
verifica:* primero releer el `cssRules` del navegador y confirmar que el media query oscuro ya no
tiene ninguna regla que aplique al demo, que es la prueba fuerte porque cubre todo el demo y no solo
lo capturado. Después las capturas. Después el recorrido a mano de los dos formularios.

**Paso 3, cerrar.** Actualizar `docs/estado.md` y este plan.

**Paso 4, los 128 selectores: NO SE HACE.** Ver abajo.

#### La verificación que manda: el volcado de `getComputedStyle`

**Es más fuerte que las capturas y las reemplaza como prueba.** Las capturas quedan como
confirmación visual.

Antes del paso 1 se vuelca a JSON el `getComputedStyle` de una muestra amplia: el root más unos 30 a
50 elementos repartidos entre las vistas y los dos formularios. Se repite el volcado después del paso
1 y después del paso 2, y se diffea.

**Si el diff da cero, la fase es correcta por construcción.** Si da algo, ahí está el problema,
aunque ninguna captura lo muestre.

La muestra incluye obligatoriamente: **los dos calendarios, un `input type="time"`, uno de
`number`, un checkbox, un radio, un `file`, un `textarea` y los tres `h2`.**

#### El paso (c) de la secuencia obligatoria no se hace

**Decisión tomada: la limpieza selector por selector de la lista de 128 queda documentada como
opcional y no se ejecuta.** No cambia nada de lo que ve un usuario y agrega riesgo a cambio de
limpieza interna. El plan ya la llamaba secundaria y decía que se puede no hacer nunca.

Si algún día se hace, el corte natural es **ocho commits, agrupando por pantalla y no por prefijo de
clase**, porque lo que se valida es una pantalla:

| Commit | Familias | Selectores |
|---|---|---|
| 1 | Navegación, contenedor raíz y `.fu` | 8 |
| 2 | Home y hero | 16 |
| 3 | Cards de tour y catálogo | 14 |
| 4 | Ficha de tour | 8 |
| 5 | **Armazón de formulario y método de pago** | **18** |
| 6 | Mis reservas y voucher | 19 |
| 7 | Perfil | 16 |
| 8 | Panel de agencia y mi negocio | 19 |
| | **Total** | **128** |

**El commit 5 es el único que necesita QA en dev.** El armazón `.bkf` sirve a ocho pantallas a la vez
y ahí viven los dos calendarios. Los otros siete se validan en local contra las capturas.

---

### Paso 0 ejecutado el 14 ago: la fase está simulada y da cero

Detalle completo, con método y números, en
`~/Documents/finde-capturas/2026-08-14-fase4/datos/paso0-resultados.md`.

**Las tres deducciones quedaron confirmadas.** El `min-height:100svh` ya estaba muerto, los tres
`h2` computan peso 500, y `.voucher-more` se ve recta hoy y se vería inclinada después.

**Y se hizo algo más fuerte que medir: se simuló la fase entera.** Se aplicaron el paso 1 y el
paso 2 en vivo sobre el CSSOM de un iframe y se diffeó el `getComputedStyle` de **todos** los
elementos, no de una muestra, partiendo el diff en geometría, tipografía y propiedades heredadas.

| Vista | Ancho | Elementos | Paso 1 | Paso 2 (geo / tipo / heredadas) |
|---|---|---|---|---|
| home | 1440 | 977 | **cero** | 28 / 0 / 977 |
| home | 390 | 977 | **cero** | 833 / 0 / 977 |
| **reserva paso 1** (calendario) | 1440 | 96 | **cero** | **2** / 0 / 96 |
| **tour nuevo paso 3** (116 sin clase) | 1440 | 146 | **cero** | **2** / 0 / 146 |
| mis reservas | 390 | 89 | 1, el `h2` | 25 / 1 / 89 |

**El paso 1 es un no-op perfecto**, salvo el único cambio intencional: el peso de los `h2`.
**Los dos calendarios no se mueven ni un píxel.** El riesgo número uno del plan queda cerrado
antes de escribir una línea de código.

**Del paso 2, cada cambio está atribuido:**

- las **977 heredadas** son `font-synthesis-*`, `text-rendering` y `color-scheme`, las tres
  decididas como descartar. Único efecto visual: la cursiva de `.voucher-more`, que se corrige
  sacando el `font-style`
- **toda la geometría sale del `border-inline`**. Con `box-sizing:border-box` los dos bordes de
  1px comen del ancho, así que el contenido pasa de **1124px a 1126px** y se corre 1px a la
  izquierda
- **la tipografía no cambia en ningún elemento**, en ninguna de las cinco vistas

**Cuánto pesan esos 2px:** a 390px, de 975 elementos cambian de ancho 364 y de posición 662,
pero **de alto solo 3**, y uno es el puntito de notificaciones, que es dinámico. **El único
reflow real de todo el demo es `.gc-t` del tour "Caral", que pasa de tres líneas a dos.** Es
justo el elemento que la Fase 6 ya tiene marcado con `-webkit-line-clamp:2`, y el cambio además
empareja esa celda con el resto de la grilla.

**Queda una decisión chica sobre esos 2px:** o se aceptan (opción aprobada), o se pone
`border-inline:1px solid transparent` en `.app`, que deja la geometría idéntica al píxel y
también cierra la diferencia claro contra oscuro, porque transparente es transparente en los dos
modos.

**Paso 0 cerrado.** Las cuatro series de línea base están completas: 8 pantallas de los dos
flujos de formulario, por 390 y 1440, por claro y oscuro. 32 capturas en
`~/Documents/finde-capturas/2026-08-14-fase4/`.

### Paso 1 aplicado y verificado contra el código real

Commit `26670f0`. Las reglas se extrajeron **verbatim del bundle compilado** y se insertaron en
la **misma posición que ocupan en el código**, sobre la app real con la sesión real.

| Vista | Ancho | Elementos | **Paso 1** |
|---|---|---|---|
| home | 1440 | 978 | **cero** |
| reserva paso 1 (calendario) | 1440 | 96 | **cero** |
| tour nuevo paso 3 (116 sin clase) | 390 | 146 | **cero** |
| mis reservas | 390 | 90 | 1, el `h2` |

Medido además por rectángulos en la pantalla más riesgosa: **0 de alto, 0 de ancho, 0 en x y 0
en y.** El alcance se verificó contra el tag `pre-fase4` propiedad por propiedad: **catorce
declaraciones agregadas, cero quitadas**.

#### Dos decisiones del paso 1 que conviene tener escritas

**1. El `h1` NO se replica, y es a propósito.** El bloque original es
`.app-demo h1, .app-demo h2`; la réplica es solo `.app h2`. Hoy da exactamente igual, porque el
único `h1` del demo es `h1.det-tl-desktop` y **computa `display:none` en los nueve anchos
probados**, de 390 a 1600.

Pero ese `h1` es el título del tour pensado para desktop fuera del hero, el patrón de Airbnb,
y quedó como intención abandonada. **El día que se active va a renderizar con reglas distintas
de las que tenía cuando se escribió**: sin los 56px, sin el `letter-spacing:-1.68px` y sin el
`margin:32px 0` que hoy le pone el bloque.

Queda anotado para que el día que se retome la ficha de tour no sorprenda. **No se replica
igual: replicar reglas para sostener un elemento invisible es agregar deuda para evitar una
sorpresa que ya está documentada.**

**2. `body{margin:0;font-family}` se queda en `index.css`.** Se verificó antes de borrar el
bloque, porque parecía código muerto y no lo es.

`.landing` declara su propia `font-family` (`Landing.jsx:564`) y `.app` también, así que
ninguna de las dos pantallas depende del `body`. **Pero la hoja de notificaciones sí.** En
mobile se renderiza con `createPortal(popover, document.body)` (`AppDemo.jsx:1881`), o sea que
cuelga del `<body>` y queda fuera de los dos scopes. Y ni `.notif-sheet`, ni
`.notif-sheet-list`, ni `.ni-item` declaran `font-family`: **heredan la del `body`**.

Sacar esa línea dejaría la hoja de notificaciones con la fuente por defecto del navegador, en
mobile. Es la misma hoja que la auditoría de `text-align` ya había marcado como "fuera de
`.app-demo`", por el mismo motivo.

### Cierre de la Fase 4

**En `main` desde el 2026-08-14 (`6f3bbed`), post-QA.** QA hecho por José en dev.finde.pe contra
las 32 capturas de línea base: los tres cambios visibles confirmados, sin sorpresas.

`src/index.css` pasó de **109 líneas a una sola regla**, y el CSS compilado de **1.95 kB a
0.06 kB**.

| Paso | Commit | Qué hizo |
|---|---|---|
| 1 | `26670f0` | Replicar en `.app` lo que había que conservar, con el bloque todavía vivo |
| 2 | `ced7bf3` | Borrar el bloque, más sacar el `font-style:italic` de `.voucher-more` |

#### Los tres cambios visibles

1. **Desaparece el borde lateral** del contenedor. El contenido pasa de 1124 a 1126px en desktop
   y de 388 a 390px en mobile, y todo se corre 1px a la izquierda.
2. **El título del tour "Caral" pasa de 3 líneas a 2** en la grilla a 390px. **Es el único reflow
   de todo el demo**, y mejora: empareja esa celda con el resto.
3. **El ícono del reloj se vuelve visible en modo oscuro.** Bug corregido, ver arriba.

#### Los cuatro criterios de validación, cumplidos

| # | Criterio | Resultado |
|---|---|---|
| 1 | El diff es exactamente el efecto del borde | **Cero cambios tipográficos** en las tres vistas medidas |
| 2 | Ningún elemento cambia de alto | **Cero**, salvo el título de Caral y su contenedor |
| 3 | El media query oscuro ya no aplica al demo | **Cero reglas** en ninguna hoja. El hueco de Google Fonts se cerró por `fetch`: 28 `@font-face`, cero selectores de clase |
| 4 | Controles nativos | Solo cambia el `time`, y para mejor. Ver la corrección de R4 |

El paso 1 dio **cero cambios** en las cuatro vistas medidas, incluidos los dos calendarios y sus
81 elementos sin clase, que eran el riesgo número uno del plan.

#### Lo que quedó sin hacer, a propósito

**El paso (c), la limpieza de los 128 selectores, NO se hace.** Queda documentado arriba como
opcional, con su tabla de ocho commits. No cambia nada visible y agrega riesgo a cambio de
limpieza interna.

**La comparación visual de las 32 capturas contra el código desplegado** no se puede hacer sin
mergear, porque la sesión de Supabase vive por origen y un preview no la tiene. Queda para el QA
en dev.finde.pe.

#### Entregable 6 de la Fase 0, cerrado

La cursiva de `.voucher-more` quedó respondida: **hoy se veía recta**, porque Plus Jakarta Sans no
trae cara itálica y el `font-synthesis:none` del bloque impedía inventarla. Al borrar el bloque
habría aparecido una cursiva sintética a 11px, así que se sacó el `font-style:italic`.

**La Fase 0 ya no tiene entregables pendientes.**

---

## Fase 5 · Interlineado base y ritmo vertical ✅ COMPLETA

Depende de la Fase 4. Riesgo medio.

- **Hallazgos:** hallazgo principal, §3a, §3b, §3c
- **Archivos:** `src/AppDemo.jsx` (tokens de `.app` y las ~30 reglas de `line-height` que hoy compensan a mano)
- **Qué se hace:** darle a `.app` un interlineado base **sin unidad**, para que se herede como proporción y no como valor fijo, y limpiar las reglas que existen solo para compensar la base equivocada
- **Qué puede romperse:** menos de lo que dice la auditoría. Por E2 los botones no se mueven. Lo que sí se mueve es todo el texto dentro de `div`, o sea alturas de card, y ahí `.tc` (ancho fijo de 260px) y `.tg` (grilla de dos columnas en mobile) pueden dejar de tener altura pareja
- **Cómo se valida:** home y catálogo en 390px mirando que las cards de la grilla sigan alineadas. Detalle de tour con descripción larga. Voucher completo. **Al terminar, recién ahí, el barrido de padding del Grupo B de la Fase 2**

### La base es `1.5` sin unidad, y la fase va en dos pasos

Aprobado el 14 ago. **Paso 1: la base**, `line-height:145%` pasa a `1.5` en `.app`, más el `118%`
de `.app h2` a `1.18`, que es la misma forma equivocada aunque hoy no haga daño. **Paso 2: los
display que la base perturba.** Los dos van a `dev` juntos: commits separados para que el diff sea
atribuible, pero un estado intermedio con los títulos inflados no tiene por qué existir en una rama
compartida.

El `1.5` es el valor que menos reglas propias obliga a escribir: deja **33 de las 62 declaraciones
de interlineado en no-op exacto** (7 en la constante CSS y 26 inline), contra 7 del segundo mejor
candidato. Detalle en `~/Documents/finde-capturas/2026-08-14-fase5/datos/paso0-resultados.md`.

### Los valores del paso 2 son los de la Fase 6, no valores nuevos

**Anotado para que la Fase 6 no los rehaga.** Los interlineados que el paso 2 le pone a los display
salen de la escala ya aprobada más abajo, y coinciden token por token:

| Valor del paso 2 | Token de la Fase 6 |
|---|---|
| **1.2** (título de página, de sección y de formulario, 26 y 24px) | `--fs-d2` |
| **1.3** (encabezado menor y número destacado, 22 y 20px) | `--fs-h1` |
| **1.35** (encabezado chico, 18px) | `--fs-h2` |
| **1.1** (los cuatro logotipos) | **caso propio, fuera de escala** |

`--fs-d1` (1.15) no aparece porque el único elemento de ese tamaño, `.hero-t`, ya declara `1.15`
propio y por eso no se mueve.

Cuando la Fase 6 arme los tokens, estos selectores ya van a tener el interlineado correcto: hay que
migrarlos al token, no recalcularlos.

### El bloque de reseñas es UI muerta hoy, y es INTENCIONAL

`.rev-hdr`, `.rev-big-n` y el resto de `.rev-*` de la ficha de tour están detrás de
`totalReviews > 0`, y **los 49 tours del catálogo muestran "Nuevo"**. O sea que hoy ese bloque no
renderiza nunca.

**No es un bug ni marcado muerto.** Los ratings de siembra se sacaron del seed por la regla de nada
falso visible al usuario real, así que "Nuevo" es la respuesta correcta mientras no exista el modelo
`Review`. Ver `.claude/rules/frontend.md`.

Consecuencia práctica para esta fase: al bloque **se le aplica el interlineado igual** (medido por
inyección, con la cascada real), pero **no se puede validar mirando la pantalla**. Que nadie lo lea
como defecto ni lo "arregle" mostrándolo.

### Caso de verificación medido: el badge "Finde Verificado" encoge

Sale de investigar un desalineado que José reportó en el QA del 14 ago. El desalineado resultó ser otra cosa (ver abajo), pero la medición dejó un caso concreto para esta fase.

`.tc-ver` y `.gc-ver` están a **9px de fuente dentro de una caja de línea de 23.2px, ratio 2.58**. El contenido real del badge mide unos 12px, pero el badge mide **29.2px de alto**, porque el interlineado heredado manda sobre el contenido.

**Corregido el 14 ago con la base ya decidida.** La primera medición se hizo inyectando
`line-height:1.6`, que era una hipótesis, no la base aprobada. Con `1.5`, que es lo que hace el paso
1, el número es otro y más grande:

| Selector | Alto hoy | Con `1.6` (medición vieja) | **Con `1.5` (la base aprobada)** |
|---|---|---|---|
| `.tc-ver` | 29.2px | 22.4px | **19.5px** |
| `.gc-ver` | 29.2px | 20.4px | **19.5px** |

O sea que **el badge encoge 9.7px**, no entre 7 y 9. Como está en `position:absolute` sobre la foto,
no empuja el layout de la card pero sí cambia su peso visual sobre la imagen. Hay que mirarlo.

Los otros dos elementos pintados que encogen en home, medidos igual: `.hero-tag` de 35.2 a 28.5px y
`.ai-sb-tag`, el chip "IA" del buscador, de 29.2 a 21.5px. **Ningún otro elemento con fondo o borde
cambia de alto en todo el demo.**

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

### Cierre de la Fase 5

**En `main` desde el 2026-08-15 (`86a4ea3`), post-QA.** QA hecho por José en dev.finde.pe.

| Paso | Commit | Qué hizo |
|---|---|---|
| 1 | `b1e83ba` | La base de `.app` a `1.5` sin unidad, y el `h2` de `118%` a `1.18` |
| 2 | `fe85c1f` | Interlineado propio a los 22 display que la base perturba, más `.gcnt` a `min-width:60px` |
| 3 | `f4941b6` | Borra las 37 declaraciones que quedaron en no-op |

Los tres fueron juntos a `dev`: un estado intermedio con los títulos inflados no
tenía por qué existir en una rama compartida.

**Las declaraciones de interlineado pasan de 62 a 32.** El paso 2 suma 7 y el
paso 3 saca 37. La cuenta vieja de "62 a 25" se hizo antes de que el paso 2
existiera.

#### Cómo se validó

Volcado de `getComputedStyle` de todos los elementos, 20 vistas por dos anchos,
con las reglas del bundle compilado aplicadas sobre el CSSOM de la app real.

| Criterio | Resultado |
|---|---|
| Ancho | **cero elementos** en las 40 mediciones, en los tres pasos |
| Los dos calendarios | **0 de 31 celdas** cada uno |
| Áreas táctiles | `.chip`, `.sl`, `.city-btn`, `.tn-btn` en **44px exactos** |
| Filas de `.gc` y `.tc` | **cero desparejas**, antes y después |
| Barras fijas | `.tn`, `.ai-sb`, `.bn`, `.hero`: idénticas |
| Las 33 declaraciones puras del paso 3 | computan **el mismo `line-height`** con la regla y sin ella |

#### Cuatro cosas que quedaron aprendidas

1. **La lectura estática volvió a sobreestimar, por quinta vez en este plan.**
   Daba 39 reglas de display sin interlineado propio; midiendo son 30, y de esas
   4 no se mueven porque otra regla del mismo selector ya les declara el valor
   (`.hero-t`, `.det-hero .det-tl` y los dos `h2`). Contar declaraciones no
   sustituye medir.
2. **Clasificar por tamaño no alcanza: hay que clasificar por rol.** `.ai-sb-ic`
   figuraba como encabezado de 18px y es un `<span>` que solo contiene un SVG.
   Va a `1`, como `.bn-i .ni`. Con él se reclasificaron los números destacados
   (`.bb-p`, `.sum-t`, `.dsh-s-v`, `.pf-stat-v`, `.gcnt`, `.login-hero-stat-v`):
   son datos de una línea cuyo alto lo absorbe un contenedor con padding propio,
   así que la caja de línea no les aporta legibilidad, solo aire impredecible.
3. **El login se midió montando la vista entera**, no por inyección de un
   selector suelto. Importaba porque `.login-hero` es `flex:0 0 280px` con
   `justify-content:flex-end` y **`overflow:hidden`**: si el contenido no entra,
   se recorta por arriba en silencio. Medido: el logotipo pasa de 23.2 a 46.2px y
   quedan **60.2px de holgura**.
4. **La hoja de notificaciones en mobile queda fuera del alcance de `.app`.**
   `createPortal` al `body`, computa `line-height:normal`.

#### Pendiente cosmético que sale del QA

La etiqueta **"Último cupo"** del calendario de reserva, `AppDemo.jsx:437`, a
`fontSize: 8`. **Anotada y sin arreglar a propósito.** Vive dentro de una celda
de 36px con `whiteSpace:nowrap`: cualquier aumento la rompe, y es exactamente el
punto frágil que la Fase 7 ya tiene marcado. Se arregla ahí, con el resto de los
inline, no por su cuenta.

---

## Fase 6 · La escala en tokens, PARTIDA EN DOS

> **Partida el 2026-08-18, y no es una decisión de prolijidad.** Los pasos 0 a 3
> responden lo que José reportó (la relación entre el título de sección y el de
> tarjeta) y se validan enteros en dos pantallas. El barrido del piso de 12px es
> otro trabajo: más grande, más disperso y sin urgencia. **Juntos, un QA malo del
> barrido bloquea el arreglo de jerarquía, que es lo único que alguien pidió.**

| | Qué | Alcance |
|---|---|---|
| **6A ← LA SIGUIENTE** | pasos 0 a 3: declarar los tokens, la pareja de jerarquía y los display | `--fs-d1`, `--fs-d2`, `--fs-h3` en `.gc-t`, el logo. Home, catálogo, ficha, login y las cabeceras de página |
| **6B** | el piso de 12px pantalla por pantalla, los pesos, las versalitas, el tracking y el calendario | las doce vistas |

### Fase 6A · Los tokens y la jerarquía

- **Hallazgos:** §1a, §1b, §2, §4a, §10b
- **Archivos:** `src/AppDemo.jsx`, la constante CSS
- **Qué se hace:** declarar los nueve tokens, aplicar `--fs-d2` y `--fs-h3` juntos (la pareja de jerarquía) y después el resto de los display
- **Qué puede romperse:** la altura pareja de la grilla a 390px, que es el riesgo #3 de la auditoría y lo que obliga al clamp · el hero, que tiene `max-width:280px` y puede cortar en otro lado · el logotipo del login, que vive en un `flex:0 0 280px` con `overflow:hidden`
- **Cómo se hace:** un commit por paso, y los pasos 2 y 3 se validan por separado
- **Cómo se valida:** home y catálogo a 390, 412 y 1440 para el paso 2; login, welcome, éxito de reserva, notificaciones, mis reservas y panel para el paso 3

### Estado medido al arrancar, 2026-08-18

**Los números del plan viejo estaban corridos.** Recontados con script sobre el
archivo de hoy, después de las tandas de identidad:

| | Decía el plan | Es |
|---|---|---|
| `font-size` en la constante CSS | 242 | **250** |
| `fontSize` inline en el JSX | 106 | **115** |
| Declaraciones a 13px | 47 | **48 en CSS más 25 inline** |
| Por debajo de 12px, CSS | 56 | **56** |
| Por debajo de 12px, inline | 64 | **43** |
| Peso 800 a eliminar | 20 | **16** |
| Versalitas | 9 más 3 badges | **17** |
| `letter-spacing` | 23 | **25** |

**De las 250 del CSS, 63 no son texto:** 44 son controles nativos (declaran
`font-family:inherit`, el marcador que este mismo plan documenta en la Fase 2) y
**19 son íconos o glifos**, donde `font-size` mide un dibujo y no una palabra
(`.pf-av`, `.bn-i .ni`, `.lang-dd-btn .arr` a 8px). **Quedan 187 de texto real.**

**Y los 115 inline están concentrados en dos pantallas:** NewTourView 45 y
DashView 35, o sea **80, el 70%**, con 37 de las 43 que están por debajo del
piso. Eso es dato para la Fase 7, no para esta: reordena aquella fase de "barrido
parejo" a "dos pantallas".

**Dos cosas del plan que ya no son ciertas y se corrigen acá:**

- **Los badges `.st-*` NO declaran versalitas hoy.** La regla de abajo dice que
  sobreviven ahí; los que las tienen son `.tp-st` y `.dsh-bk-s`.
- **La celda del calendario ya no mide 36px.** La Fase 2 la subió a
  `minHeight:44`.

### La escala, aprobada

> **⚠️ CORREGIDA EL 2026-08-18, y las dos primeras filas cambiaron dos veces.**
> Los valores de abajo son los vigentes. **No repongas los viejos**: el porqué
> de cada corrección está en la sección que sigue a esta tabla, y el detalle
> completo en `docs/decisiones.md` (entradas del 2026-08-18) y en
> `docs/audits/2026-08-18-identidad-tipografica.md`.

| Token | Mobile | 640 | Desktop | Fuente / peso | Line-height | Calibrado mirando |
|---|---|---|---|---|---|---|
| `--fs-d1` | **26** | **32** | **39** | **Jakarta 700** | 1.15 | el hero del inicio |
| `--fs-d2` | **20** | | **22** | **Jakarta 700** | 1.2 | **el título de SECCIÓN del inicio, contra el de tarjeta** |
| `--fs-h1` | **18** | | **20** | Jakarta 700 | 1.3 | nada todavía, ver 6B |
| `--fs-h2` | 17 | | 18 | Jakarta 700 | 1.35 | nada todavía, ver 6B |
| `--fs-h3` | 15 | | 15 | Jakarta 700 | 1.35 | el título de tarjeta, contra el de sección |
| `--fs-body` | 16 | | 16 | Jakarta 400 | 1.6 | |
| `--fs-sm` | 14 | | 14 | Jakarta 500 | 1.5 | |
| `--fs-cap` | 13 | | 13 | Jakarta 500 | 1.4 | |
| `--fs-label` | 12 | | 12 | Jakarta 600 | 1.3 | |

**La columna "calibrado mirando" es la guarda, y va acá a propósito.** Ver
"El token se calibró en una pantalla y se aplica en tres", abajo.

**Fuera de la escala, decidido el 2026-08-18:**

| | Queda en | Por qué |
|---|---|---|
| **`.logo`** | **28 / 26 en `.tn` / 24 en el pie, y 42 en el login** | Es la única pieza serif del producto. Un token calibrado por la altura de x de Jakarta no le aplica, y con `--fs-d2` en 20/22 bajaría de 28 a 20. Su `line-height:1.1` ya está puesto desde la Fase 5 |
| **`.det-tl`**, el título del tour | **23 / 34** | Ver abajo. **Es el único del grupo de `--fs-d2` con escalón propio de escritorio**, y ese es el dato que lo delata |

**`--fs-h1` a 18/20 y `--fs-h2` a 17/18 quedan a 1px en móvil.** No se resuelve en
6A porque **ningún elemento los consume hasta 6B**: queda anotado como la primera
decisión de esa fase, con los elementos reales en la mano (`--fs-h1` hoy son
`.pf-name` 19 y `.rev-hdr` 18; `--fs-h2` son `.pf-sec-t` y las tres cabeceras de
hoja a 16, más `.ai-cc-h span` a 18).

**Reglas que van con la escala:**

- **Piso absoluto de 12px, sin excepciones.** Elimina las 56 declaraciones del CSS y las 64 inline que hoy están por debajo.
- **Pesos: 400 cuerpo, 500 metadatos, 600 etiquetas y UI, 700 títulos. El 800 se elimina por completo** (20 declaraciones). A 16px, Jakarta 800 se empasta y 700 alcanza.
- **~~DM Serif Display solo en `--fs-d1` y `--fs-d2`~~. YA NO HAY SERIF EN LA ESCALA.** Los 20 usos de serif pasaron a Jakarta 700 el 2026-08-18, no 11: el único DM Serif que queda en el producto es el logo, que no tiene token porque no es texto de interfaz. Ver la decisión del 2026-08-18.
- **Versalitas: sobreviven solo en `--fs-label` y solo en badges de estado** (`.tp-st`, `.dsh-bk-s`, `.st-*`), donde ayudan al escaneo. Se eliminan de `.tc-loc`, `.gc-loc`, `.det-st`, `.ai-sum-h`, `.pf-stat-l`, `.dsh-s-l`, `.login-hero-stat-l`, `.sal-sec-t` y `.site-footer-col-t`. El tracking pasa a **un solo valor relativo, `.03em`**, en lugar de los seis valores absolutos de hoy.

### Por qué `--fs-d1` y `--fs-d2` cambiaron dos veces, con las dos mediciones

**Van las dos correcciones en orden, porque la segunda no se entiende sin la
primera y porque las dos se hicieron midiendo, no opinando.**

#### Corrección 1: cambió la fuente, así que cambia el número

DM Serif salió del producto (decisión del 2026-08-18). **Dos fuentes al mismo
tamaño en px no se ven del mismo tamaño**: medido a 100px en el navegador, Plus
Jakarta Sans 700 tiene 54,4 de altura de x contra 48,1 de DM Serif, o sea 13%
más, y es 11% más ancha. El factor de corrección es **48,1 / 54,4 = 0,884**, y
así `--fs-d1` pasó de 30/44 a **26/39** y `--fs-d2` de 26/32 a 23/28.

#### Corrección 2: `--fs-d2` baja otra vez, a 20/22, y el motivo es la jerarquía

**Los 23/28 de la corrección 1 eran fieles a la fuente nueva y aun así estaban
mal**, y eso solo se vio comparando contra los referentes. Medido el 2026-08-18
en Airbnb, Booking y GetYourGuide, la relación entre el **título de sección** y
el **título de tarjeta**:

| Sitio | 412px | 1440px |
|---|---|---|
| Airbnb | 18 / 13 = 1,38 | 20 / 13 = 1,54 |
| Booking | 20 / 16 = 1,25 | 24 / 16 = 1,50 |
| GetYourGuide | 24 / 18 = 1,33 | 24 / 18 = 1,33 |

**La banda va de 1,25 a 1,54.** Con `--fs-d2` en 23/28 y `.gc-t` en los 15px que
esta misma fase planea, Finde daría **1,53 en móvil y 1,87 en escritorio**: más
afuera de lo que está hoy. **Aplicar la escala como estaba escrita habría
empeorado exactamente lo que la Fase 6 existe para arreglar.**

Con `--fs-d2` en **20/22** y `.gc-t` en 15px, da **1,33 y 1,47**, pegado a
GetYourGuide y a Booking.

#### Y el hallazgo que da vuelta el diagnóstico: el problema NO es el título de sección

**Esto es lo que hay que leer antes de tocar un número.** José reportó que los
títulos de sección se veían grandes, y **notó algo real, pero la causa es la
contraria**: medido en móvil, el título de sección de Finde son 19px contra 18
de Airbnb y 20 de Booking, o sea que **está en el promedio de la categoría**. El
que está fuera de rango es el **título de tarjeta**: 13px, contra 16 de Booking
y 18 de GetYourGuide.

**La corrección obvia habría sido bajar el título de sección, y habría empeorado
la jerarquía**: la distancia entre los dos se achica achicando el de arriba o
agrandando el de abajo, y en este caso el que estaba mal era el de abajo. Por eso
`--fs-d2` baja **poco** (de 23 a 20 en móvil, de 28 a 22 en escritorio) y el
movimiento importante es `.gc-t` subiendo a 15px.

**Lección de método, que vale más que estos números: una queja sobre un elemento
no dice cuál elemento está mal.** Lo dice la relación entre los dos, y eso hay
que medirlo contra algo externo. Sin los tres referentes, este cambio se hacía al
revés.

### El token se calibró mirando UNA pantalla y se aplica en TRES

**Hallazgo del 2026-08-18, y es el que más cambia la fase.**

`--fs-d2` vale 20/22 porque se midió **la relación entre el título de sección del
inicio y el título de tarjeta** contra Airbnb, Booking y GetYourGuide. Esa
medición es correcta y no se toca. **El problema es dónde termina aplicándose el
número.**

El grupo de `--fs-d2` no son solo los títulos de sección. Son doce selectores, y
entre ellos está **`.det-tl`, el nombre del tour sobre la foto de la ficha, que
hoy mide 23 en móvil y 34 en escritorio**. Aplicarle el token le saca **12px en
escritorio, un 35%**, en la pantalla que más tráfico va a tener, **y eso no lo
midió nadie**: los referentes se compararon en el inicio.

**Decidido: `.det-tl` se queda como display propio, fuera de `--fs-d2`.**

#### El criterio que lo separa del resto, para no decidir por intuición

Del grupo de doce, **solo dos tienen escalón propio de escritorio**: `.st`, que es
el que se midió, y `.det-tl`, que no. **Que alguien le haya escrito una regla de
escritorio propia es la señal de que su tamaño es una decisión y no una herencia**,
y un token calibrado en otra pantalla la borra sin dejar rastro.

Los otros diez no tienen escalón propio, y ahí el token es exactamente lo que hace
falta.

**`.tp-h h2` se revisó con este criterio y NO es el mismo caso.** Es "Mis
reservas", cabecera de página, el rol que `--fs-d2` nombra. Lo que tiene es una
inconsistencia con las otras cinco cabeceras de página, que están a 21 mientras
esta está a 25, **y unificarlas es justamente para lo que existe el token**. Aun
así es la baja más grande del grupo (25 a 20 en móvil, un 20%), así que **se
verifica en pantalla en el paso 3, no se da por buena**.

#### La lección, y por qué la guarda va en la tabla

**Un número medido en una pantalla y convertido en token se aplica en todas, y el
que lo aplica seis meses después no tiene forma de saber dónde se midió.**

Es el mismo patrón que ya costó tres veces en este proyecto: **la guarda escrita
en el camino donde se descubrió el problema, en vez de en el estado que protege.**
Un `db:migrate` prohibido en un documento pero cargado en `package.json`. Un campo
verificado en las dos puntas de la cadena y perdido en el medio. Una auditoría que
se corrige en el documento donde se leyó y no donde se ejecuta.

Por eso la guarda **no** es este párrafo: es la **columna "calibrado mirando" de
la tabla de la escala**, que es lo único que alguien va a tener abierto en el
momento de asignar un token a un selector.

### ⚠️ Advertencia: la escala se aplica por rol, no por valor

**"Reemplazar los 23 tamaños sueltos" NO significa un mapeo mecánico px → token.**

`13px` no es un rol, es un accidente. Recontadas el 2026-08-18 son **73
declaraciones, 48 en el CSS y 25 inline**, y sirven a **cuatro funciones
distintas**: texto de lectura (`.rev-text`, `.det-inc`), metadato
(`.voucher-row`), etiqueta de control (`.chip`, `.sl`, `.tp-tab`) y título de fila
(`.sr-name`, `.gc-t`). Un mapeo mecánico las colapsa en una sola y **destruye
exactamente la jerarquía que el rediseño existe para crear**.

**CADA DECLARACIÓN SE CLASIFICA POR ROL, NO POR VALOR.**

Un buscar y reemplazar de `13px` por `var(--fs-cap)` es la forma más rápida de terminar con una escala nueva y la misma jerarquía plana de antes.

**Primera pasada por rol sobre las 187 declaraciones de texto del CSS**, hecha con
script el 2026-08-18. Sirve para dimensionar, no para ejecutar:

| Rol | Declaraciones |
|---|---|
| `d1` display | 3 |
| logo, fuera de escala | 4 |
| `d2` título | 14 |
| número o precio | 20 |
| `h2` encabezado chico | 9 |
| `h3` título de tarjeta o de fila | 20 |
| versalita | 17 |
| root | 2 |
| **sin resolver: hay que verlas en pantalla** | **98** |

**Las 98 son el trabajo de 6B y ningún script las va a cerrar**, que es
exactamente lo que dice esta advertencia. Se reparten en 58 de banda etiqueta, 26
de banda 13, 11 de banda 14-15 y 3 de 16 para arriba.

**Y salen dos roles que la escala no nombra:**

1. **Precio o número destacado.** Hoy aparece a 20, 16, 15, 14, 13 y 12px según
   el contexto, y en los seis casos es el mismo rol. Decidir en 6B si es un token
   o si se resuelve por contexto.
2. **Ícono o glifo.** Son 19 declaraciones donde `font-size` mide un dibujo.
   **No toman token de texto ni les aplica el piso de 12px.** La Fase 5 ya
   encontró este caso con `.ai-sb-ic`.

**Lo que NO hay que rehacer: la clasificación por rol de los display ya existe en
el código.** La Fase 5 paso 2 agrupó 22 selectores por rol y dejó escrito a qué
token corresponde cada grupo de interlineado. **Se migra al token, no se
recalcula.** Ojo que esos comentarios citan los tamaños de antes del cambio de
fuente (26/24, 22/20, 18) y hay que corregirlos en el mismo viaje.

### Mitigaciones obligatorias

No son opcionales ni quedan a criterio del momento. Van sí o sí con la fase.

**1. `.gc-t` va a 15px (`--fs-h3`), no a 16px, y necesita `-webkit-line-clamp: 2`.**

> **Actualizado el 2026-08-18: esta mitigación dejó de ser solo una mitigación.**
> Subir `.gc-t` de 13 a 15px es **la mitad importante del arreglo de jerarquía**
> que se explicó más arriba: es lo que acerca la relación con el título de
> sección a la de los referentes. Si se aplica `--fs-d2` en 20/22 pero `.gc-t`
> se queda en 13, la relación queda en 1,54 móvil y no mejora nada.


**RE-MEDIDO el 2026-08-18, con la Fase 4 ya aplicada.** El número viejo era ~155px
útiles y estaba calculado sobre el ancho con el `border-inline` puesto:

| | Cuenta |
|---|---|
| Viewport | 390px |
| `.tg` tiene `padding:0 16px` y `gap:12px`, dos columnas | celda de **173px** |
| `.gc` tiene borde de 1px y `.gc-b` tiene `padding:10px` | **~151px útiles** |

**Es cálculo sobre el CSS, no medición.** Falta confirmarlo en el navegador, y hay
un motivo concreto: `html{scrollbar-gutter:stable}` puede reservar ~15px según el
entorno, y eso mueve la cuenta entera. **Es el paso 0 de la Fase 6A.**

**Y apareció el dato que faltaba, que da vuelta el peso de esta mitigación.**
Medido sobre los títulos reales del catálogo (`data/track-b/tours-db-snapshot.json`,
30 tours):

| | |
|---|---|
| Largo del título, mediana | **38 caracteres** |
| Títulos de más de 38 caracteres | **13 de 30** |
| El más largo | 52 (`Huanchaco: caballitos de totora y cebiche del muelle`) |

O sea que a 15px **casi la mitad del catálogo se iría a tres líneas**. El clamp
deja de ser la mitigación de un caso borde y pasa a ser parte del cambio.

Dos cosas más: **el demo no usa `-webkit-line-clamp` en ningún lado hoy**, así que
es patrón nuevo (lo que hay es `ellipsis` de una línea en `.sr-name` y
`.pf-op-desc`); y ya hay evidencia de que un solo píxel decide, porque en la
simulación del Paso 0 de la Fase 4 **el único elemento de todo el demo que
reflowea son esos 2px sobre `.gc-t`**, en el tour "Caral".

**2. ~~`.gcnt` cambia `width:60px` por `min-width:60px`.~~ YA ESTÁ HECHA.**

La aplicó el **paso 2 de la Fase 5** (`fe85c1f`), junto con los interlineados de
los display. Verificado el 2026-08-18: la regla dice `min-width:60px`. **El riesgo
#5 está cerrado y esta fase no tiene que hacer nada.**

### `.logo`: sale de la escala

> **Corregido el 2026-08-18.** Este plan decía que iba a `--fs-d2`. **No va.**

Se queda en **28px, 26 en `.tn` a partir de 1024 y 24 en el pie**, más los 42 de
`.login-hero-logo`. Dos motivos, y el segundo solo:

1. `--fs-d2` vale hoy 20/22, o sea que el token lo bajaría de 28 a 20.
2. **Es la única pieza serif que queda en el producto**, y los números de la
   escala están calibrados por la altura de x de Jakarta, con el factor 0,884 de
   la decisión del 2026-08-18. Ese factor no le aplica a DM Serif: aplicárselo es
   corregir dos veces.

Lo que sí queda del hallazgo original es el `line-height:1.1`, y **ya está puesto
desde la Fase 5**. El problema era de matemática de layout, no de legibilidad.

### El número de rating, heredado de la Fase 1

La Fase 1 no pudo corregir el color del número de rating y **el trabajo cae acá, no en la Fase 7**.

`.tc-m .rt`, `.gc-m .rt` y `.sr-rating` renderizan **la estrella y el número dentro del mismo elemento**, con el ícono en `fill="currentColor"`. O sea que el color es uno solo para los dos: pintar el número en `--ch` pinta también la estrella, y la estrella tiene que quedarse en `--gd` porque es decorativa.

Separarlos exige envolver el número en su propio elemento, que es un cambio de JSX y no de CSS. **Se hace en esta fase y no en la 7 porque estos tres selectores se tocan igual acá** (`.sr-rating` está a 10px y muere con el piso de 12px; `.tc-m` y `.gc-m` cambian de tamaño y de peso), así que conviene separar ícono y número en el mismo viaje en vez de abrir el archivo dos veces.

Objetivo al separarlos: número en `--ch` o `--gy-strong`, estrella en `--gd`.

**Cae en 6B**, con el barrido de la pantalla que corresponda: `.sr-rating` está a
10px y muere con el piso, y `.tc-m` y `.gc-m` cambian de tamaño y de peso ahí.

---

### Los cuatro pasos de la Fase 6A

Rama `tipografia/fase-6a-escala` desde `dev`. QA solo con `demo@finde.pe` y sobre
tours de cuentas `@finde.pe`.

#### Paso 0 · Medir y decidir. Sin código, sin commit

- **Qué toca:** nada.
- **Qué se mide, en el navegador y no por cálculo:** el ancho real de la celda de
  `.tg` a 390 y a 412, y cuántos caracteres de Jakarta 700 a 15px entran en ese
  ancho, con los títulos reales del catálogo y no con un promedio.
- **Qué puede romperse:** nada. Lo que puede fallar es la cuenta de 151px, y por
  eso se mide.
- **Cómo se verifica:** el número medido queda escrito acá antes de tocar una
  línea. Si difiere del cálculo, manda el medido.

**Las cinco decisiones, tomadas el 2026-08-18:** `.det-tl` se queda fuera de
`--fs-d2` · el logo sale de la escala · `--fs-h1` baja a 18/20 para no ser el
mismo número que `--fs-d2` · la etiqueta de escasez va a punto de color más
leyenda, y eso es 6B · `--fs-d1` conserva su escalón de 640 y pasa a tres.

#### Paso 1 · Declarar los nueve tokens, sin un solo consumidor

- **Qué toca:** un bloque de variables en `.app` y su media query.
- **Qué puede romperse:** nada, y ese es el punto. Es aditivo puro.
- **Cómo se verifica:** volcado de `getComputedStyle`, **tiene que dar cero
  diferencias**. Es el mismo criterio del paso 1 de la Fase 4, que dio cero.

#### Paso 2 · La pareja de jerarquía: `--fs-d2` más `.gc-t` a 15px con clamp

**Las dos van en el mismo push.** `--fs-d2` sin `.gc-t` deja la relación en 1,54 y
no arregla nada; `.gc-t` sin clamp descuadra la grilla.

- **Qué toca:** `.st` (19 a 20, y 23 a 22 en escritorio), `.gc-t` (13 a 15 en
  móvil, 14 a 15 en escritorio) y su `-webkit-line-clamp:2`.
- **Qué puede romperse:** la altura pareja de la grilla a 390px, que es el riesgo
  #3 de la auditoría. Con 13 de 30 títulos por encima de los 38 caracteres, el
  clamp se ejercita de entrada y no en un caso raro.
- **Cómo se verifica:** home y catálogo a 390, 412 y 1440, con los cinco títulos
  más largos del catálogo en pantalla. **La relación medida tiene que dar 1,33 en
  móvil y 1,47 en escritorio**, que es la banda de los referentes.

**Se reporta acá antes de seguir al paso 3.** Es el paso que responde lo que José
notó.

#### Paso 3 · El resto de los display

- **Qué toca:** `--fs-d1` en `.hero-t` (25 a 26, 32 se queda, 42 a 39), el logo
  fuera de escala, y las cabeceras de página y de formulario: `.login-title`,
  `.bkf-t`, `.npage-h h2`, `.tp-h h2`, `.dsh-nm`, `.tdet-h`, `.welcome-title`,
  `.suc-t`, `.pf-name`. Se migran al token los interlineados que la Fase 5 dejó
  agrupados por rol y se corrigen sus comentarios.
- **Qué puede romperse:** el hero, que tiene `max-width:280px` y puede cortar en
  otro lado · el logotipo del login, que vive en un `flex:0 0 280px` con
  `overflow:hidden` y del que la Fase 5 midió 60,2px de holgura · **`.tp-h h2`,
  que es la baja más grande del grupo**, 25 a 20 en móvil.
- **Cómo se verifica:** login, welcome, éxito de reserva, notificaciones, mis
  reservas, perfil y panel, a 390 y 1440. Y el chequeo de alcance contra el tag
  `pre-fase6a`, propiedad por propiedad, con el script de
  `.claude/rules/frontend.md`.

---

## Fase 6B · El piso, las versalitas y el calendario

Lo que se sacó de la 6A el 2026-08-18. **Más grande, más disperso y sin urgencia.**

- **Archivos:** `src/AppDemo.jsx`, la constante CSS y el calendario
- **Cómo se hace:** **por pantalla, no por propiedad.** Un commit por pantalla se
  puede revertir; un commit de 250 reemplazos no. Cada commit aplica en UNA
  pantalla el piso de 12px, el peso (800 a 700) y los roles `cap`, `sm`, `body` y
  `label`. Orden por riesgo: home y catálogo, ficha y reserva, mis reservas y
  voucher, perfil, **panel al final**, que es donde está el 70% de la deuda inline
  y donde menos línea base hay
- **Cómo se valida:** cada commit contra su propia captura, más el chequeo de
  alcance contra un tag. **Una pantalla no pasa a la siguiente sin verificarse**

**Las cuatro piezas, en orden:**

1. **El barrido por pantalla**, seis commits. Acá se resuelven las 98
   declaraciones que la primera pasada dejó sin rol, y la primera decisión es si
   `--fs-h1` (18/20) y `--fs-h2` (17/18) se sostienen a 1px de distancia en móvil.
2. **Versalitas y tracking.** Sacar `text-transform:uppercase` de los nueve
   selectores que este plan nombra, dejarlo en los badges de estado (**que hoy son
   `.tp-st` y `.dsh-bk-s`, no `.st-*`**), y unificar los seis valores absolutos de
   `letter-spacing` en un solo `.03em`. *Qué puede romperse:* los anchos de las
   etiquetas se acortan bastante al salir de mayúsculas, y eso descuadra filas de
   dos columnas.
3. **El número de rating**, separado de la estrella. Ver arriba.
4. **El calendario, solo lo que el piso obliga.** Ver abajo.

### El calendario: el piso lo arrastra en dos lugares

**El calendario no se rediseña, pero el piso de 12px lo toca igual.** Medido el
2026-08-18:

- **Las cabeceras L/M/M/J/V/S/D están a `fontSize:11` inline.** Suben a 12. La
  fila tiene aire, riesgo bajo.
- **La etiqueta de escasez está a `fontSize:8`, con `whiteSpace:nowrap` y sin
  `overflow:hidden`.** Y no entra ni hoy.

Geometría real a 390px: `.bkf` deja 350, el calendario tiene borde de 1px y
`padding:14`, quedan 320 internos, y siete columnas con `gap:4` dan **celdas de
~42px de ancho**. "Último cupo" son 11 caracteres: **unos 48 a 51px a 8px, que ya
se salen de la celda, y 72 a 77px a 12px, casi el doble**.

**El piso no la aprieta: la rompe.**

**Decidido el 2026-08-18: punto de color en la celda más leyenda debajo del
calendario.** Se descartaron acortar el copy (se pierde la señal de urgencia, que
es de negocio), moverla al texto de abajo referido a la fecha ya elegida (se
pierde el escaneo previo, que es lo que hace útil la señal) y una excepción al
piso (abre justo la puerta que el piso viene a cerrar).

**Ojo al ejecutarlo:** la jerarquía visual de escasez ya está aplicada
(`0100120`, `4379219`, `db21c0b`) y el tratamiento de la celda escasa es tinte
terracota más borde propio. El punto de color tiene que convivir con eso, no
duplicarlo. Y el calendario es el punto más frágil del demo: tres commits antes de
la auditoría fueron ahí.

---

## Fase 7 · Los estilos inline

Cierre. Depende de la Fase 6.

- **Hallazgos:** §1d
- **Archivos:** `src/AppDemo.jsx`, fuera de la constante CSS
- **Qué se hace:** migrar los tamaños inline a la escala. Son el 30% de la superficie tipográfica y **ningún cambio de CSS los alcanza**, así que sin esta fase el rediseño queda a medias
- **Recontados el 2026-08-18: son 115, no 106, y NO están repartidos parejo.** 45 están en `NewTourView` y 35 en `DashView`, o sea **80, el 70%, en el panel de la agencia**, con 37 de las 43 que están por debajo del piso de 12px. **Esta fase son dos pantallas, no un barrido**
- **Qué puede romperse:** el `fontSize: 8` de la etiqueta de escasez vive dentro de una celda de calendario que no envuelve texto. **Ese caso se resuelve antes, en la Fase 6B**, con el punto de color y la leyenda. La celda ya no mide 36px: la Fase 2 la subió a `minHeight:44`
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
