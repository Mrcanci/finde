# La elección tipográfica, con las capturas y el costo de cada opción

> 2026-08-18. Investigación, **nada aplicado**. Bloquea la Fase 6 del plan
> tipográfico (`docs/plans/2026-08-13-plan-tipografia.md`) y sale del punto 1 de
> `docs/audits/2026-08-16-identidad-visual.md`.
>
> **El entregable son las capturas.** Esto es solo el costo, que no se ve mirando.

## Lo que se puso a prueba

La hipótesis no es cuál serif, sino **si hace falta un serif de títulos**. Ningún
marketplace de viajes grande usa serif display para títulos de sección: Airbnb
(Cereal), Booking (Avenir Next más Roboto), GetYourGuide, y Stripe, Linear y
GitHub con Inter. Serif de títulos más sans de cuerpo es convención **editorial**,
para lectura larga. Finde es un catálogo donde la gente escanea y compara.

**Instrument Serif no se probó, y es a propósito**: está reemplazando a DM Serif
como la fuente por defecto de las plantillas de IA. Mudarse ahí es el mismo
problema un año más tarde. Ya estaba anotado en la auditoría de identidad.

**El logo no se toca en ninguna variante.** Cambiarlo es cambiar la marca, no la
tipografía del producto. Eso tiene una consecuencia de costo que se ve abajo.

## Cómo se sacaron las capturas

Chrome headless con el viewport real en 412 y 1440, contra `localhost:3000` con
la base de producción, o sea **tours reales con textos reales** (Namora, de
MEGATOURS). No hizo falta el iframe de las líneas base: **ese truco existía
porque la ventana interactiva no se deja redimensionar, y headless sí.** Se
mantuvo lo demás del método: animaciones a `0s` (no `none`), y se espera al
contenido real, no al esqueleto.

**Control de cada captura:** se leyó la fuente computada de `.logo`, `.hero-t`,
`.st` y `.det-tl` antes de disparar. Sin eso, una variante que no cargó se ve
"parecida a hoy" y pasa por buena.

## El costo, medido

Bytes reales del subset **latin**, que es el único que descarga un navegador con
contenido en español (`latin-ext` va aparte y solo entra si aparece un carácter
de ese rango).

| Archivo | Peso | Tipo |
|---|---|---|
| Plus Jakarta Sans | **26,6 kB** | **variable**, un solo archivo cubre 300 a 800 |
| DM Serif Display roman | 17,4 kB | estático |
| DM Serif Display itálica | 17,2 kB | estático |
| DM Serif recortado al logo (`&text=finde.`) | **1,5 kB** | estático |
| Inter | 47,3 kB | variable |
| Fraunces | 65,8 kB | variable (con eje óptico, por eso pesa) |

**Lo que hoy se descarga de verdad**, medido interceptando la red:

| Pantalla | Peso | Archivos |
|---|---|---|
| `/demo` | **44,1 kB** | Jakarta variable + DM Serif roman |
| finde.pe (la landing) | **61,3 kB** | los dos anteriores **más la itálica** |

**Hallazgo: la landing descarga 17,2 kB de itálica que el demo no usa.** Sale de
`.hero-title em{font-style:italic}` en `src/Landing.jsx`. El demo no tiene ni una
itálica (la última se sacó en la Fase 4).

### Variante por variante

| | Peso de fuentes en `/demo` | Contra hoy | ¿Se puede sacar DM Serif? |
|---|---|---|---|
| **a) hoy** | 44,1 kB | referencia | no aplica |
| **b) Jakarta en todo** | **28,1 kB** | **−16,0 kB (−36%)** | **No entera: el logo se queda.** Pero se recorta a `&text=finde.` y baja de 17,4 kB a 1,5 kB |
| **c) Inter en todo** | 48,8 kB | +4,7 kB | igual que b: recortada al logo |
| **d) serif solo en hero y tour** | 44,1 kB | **0** | no: los títulos son texto arbitrario, no admiten recorte |
| **e) Fraunces** | 93,9 kB | **+49,8 kB (+113%)** | igual que b, pero suma Fraunces |

**El ahorro de b y c tiene una condición y no es chica: la hoja de fuentes es una
sola y la comparte la landing.** El `<link>` vive en `index.html`, que sirve a
las dos pantallas, y la landing usa DM Serif en el logo, el hero, los `h1` a `h4`,
los títulos de sección y su itálica. Recortar el import a `text=finde.` **le saca
la tipografía a finde.pe**. Las dos salidas:

1. Que la landing también deje el serif. Es una decisión de marca más grande que
   esta, y no está sobre la mesa hoy.
2. **Separar las hojas**: que la del serif completo la cargue solo la landing.
   Se puede hacer desde `src/App.jsx`, que ya decide qué pantalla se monta, **sin
   tocar `src/Landing.jsx`**, que es archivo protegido. Es trabajo chico pero
   real, y **hay que contarlo dentro del costo de b y de c**.

Sin eso, **b no ahorra un solo byte**: el logo sigue pidiendo el archivo entero.

### Cuánto obliga a recalcular la escala de la Fase 6

La Fase 6 asigna tamaños por token y hoy fija **DM Serif 400 en `--fs-d1` y
`--fs-d2`**. Dos fuentes al mismo tamaño en px **no se ven del mismo tamaño**, así
que cambiar la familia mueve los números. Medido a 100px, contra DM Serif:

| Fuente | Altura de x | Altura de mayúscula | Ancho de la misma frase |
|---|---|---|---|
| Plus Jakarta Sans 700 | **+13%** | +13% | **+11%** |
| Inter 700 | **+14%** | +10% | **+13%** |
| Fraunces 600 | **−8%** | +6% | **−9%** |

| | Filas de la escala que hay que rehacer | Qué cambia |
|---|---|---|
| **b** | **2 de 9** (`d1`, `d2`) | bajar entre 11% y 13%: `d1` 44→39 y 30→26, `d2` 32→28 y 26→23 |
| **c** | **9 de 9** | Inter toca todos los roles. Los números del cuerpo casi no se mueven (Inter es 2% más ancha que Jakarta), pero **hay que verificar las nueve** |
| **d** | **0** | no cambia ningún número. Cambia la **asignación**: los títulos de sección dejan de ser `d2` y pasan a `h1` |
| **e** | **2 de 9** | subir ~8%: `d1` 44→48, `d2` 32→35 |

**El ancho ya se ve en las capturas y no es teoría**: a 412px el hero corta
distinto en b y c que en a, porque Jakarta e Inter son 11% y 13% más anchas al
mismo tamaño. Es exactamente el riesgo que la Fase 6 ya tenía anotado para
`.gc-t` en la grilla de 390px.

## Nota de método: la primera medición de altura de x estaba mal

Dio que Inter 400 tenía una altura de x **más baja que un serif**, que es
imposible. El canvas estaba midiendo la fuente de respaldo porque la cara todavía
no había cargado. Se corrigió cargando cada cara con `document.fonts.load()` y
**verificando con `document.fonts.check()` antes de medir**, con el resultado del
check impreso al lado de cada número. Es el mismo patrón de siempre: un número
que sale de una medición mal instrumentada se lee igual de creíble que uno bueno.
