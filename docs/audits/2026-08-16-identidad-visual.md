# Auditoría de identidad visual, PENDIENTE

> **Diagnóstico pendiente de ejecución.** Salió de `docs/estado.md` el 2026-08-16
> al podarlo: es un diagnóstico de un momento, que es lo que va en `docs/audits/`,
> no estado ni historia.
>
> **Nada de esto está decidido ni empezado.** `docs/estado.md` conserva el
> resumen y el puntero.

> **Esto es una auditoría PENDIENTE, no un plan de ejecución.** Queda registrada
> para abordarla más adelante. Nada de lo que sigue está decidido ni empezado.

## Qué la origina

José, el **2026-08-16**, mirando el home: los títulos de sección le parecen
**"hechos por IA"**. Al conversarlo quedó claro que **no es sobre esos títulos**:
es sobre **todo el producto**.

## Por qué no la cubre la auditoría anterior

La de agosto midió **mecánica**: contraste WCAG, tamaños de fuente, interlineado,
áreas táctiles, jerarquía. Todo verificable con números, y por eso se pudo
ejecutar en fases con mediciones antes y después.

**Esta es de criterio de diseño:** si el producto se ve como algo hecho por
alguien con intención, o como una plantilla. **No se mide, se juzga.** Son dos
preguntas distintas y la segunda no se responde con las herramientas de la
primera.

## Por qué importa para el negocio, y no es vanidad

**Finde vende confianza.** Un viajero que pone S/300 en una plataforma que no
conoce necesita creer que **hay gente real detrás**. Y una agencia que entra al
panel decide ahí si vale la pena subir sus tours.

**Una interfaz que se lee como plantilla generada debilita las dos cosas antes de
la primera palabra.**

## Qué tendría que cubrir, sin resolverlo ahora

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

## Cómo NO hacerla

**Leyendo CSS y midiendo números. Eso ya se hizo y no responde esta pregunta.**

Hay que **mirar pantallas completas, en contexto**, y compararlas contra
referentes reales (**Airbnb Experiences, Civitatis, GetYourGuide**) preguntando
**qué comunica cada una, no qué mide**.

## Cuándo

**El punto 1 tiene fecha: la elección tipográfica se decide ANTES de la Fase 6.**
Esa fase asigna tamaños e interlineados por token, y **cada tipografía tiene su
propia altura de x**. Cambiar la fuente después **obliga a recalcular la escala
entera**.

**El resto no bloquea el lanzamiento**, pero conviene resolverlo **antes de que el
prerender congele el diseño en HTML indexable** (tanda 5 del camino al
lanzamiento).

## Y esto pesa MÁS que todo lo anterior: tres cosas de CONTENIDO

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

---

# Ampliación del 2026-08-18: tres puntos medidos contra los referentes

> **Se agrega sin tocar nada de lo anterior.** José comparó el inicio nuevo (ya
> sin serif) contra Airbnb, Booking y GetYourGuide y salieron tres cosas. Acá van
> con su medición. **Nada de esto está aplicado.**
>
> Los referentes se midieron en el navegador leyendo estilos computados de sus
> páginas públicas. **Dos trampas del método, y las dos cambiaron los números:**
> los tres sitios deciden el layout **por el user-agent**, así que un navegador
> de escritorio angosto seguía sirviendo la versión de escritorio y las
> mediciones "de 412" eran falsas; y **el encabezado de sección de Airbnb que
> lee un lector de pantalla está a 14px y oculto**, mientras el que se ve es un
> `span` al lado, así que medir el `h2` daba una relación de 1.00 que en pantalla
> no existe.

## 1. El tamaño de los títulos de sección

**Lo que importa es la relación entre el título de sección y el título de
tarjeta, no el número suelto:** es lo que define la jerarquía y lo único
comparable entre sitios con tipografías distintas.

| Sitio | 412px (móvil real) | 1440px |
|---|---|---|
| Airbnb | 18 / 13 = **1,38** | 20 / 13 = **1,54** |
| Booking | 20 / 16 = **1,25** | 24 / 16 = **1,50** |
| GetYourGuide | 24 / 18 = **1,33** | 24 / 18 = **1,33** |
| **Finde, tarjeta del carrusel** | 19 / 15 = **1,27** | 23 / 15 = **1,53** |
| **Finde, tarjeta de la grilla** | 19 / 13 = **1,46** | 23 / 14 = **1,64** |

**La banda de los tres referentes va de 1,25 a 1,54. El único valor de Finde que
queda afuera es la grilla en escritorio, 1,64.**

**Y el hallazgo que no se esperaba: en móvil el título de sección de Finde no es
grande.** Son 19px contra 18 de Airbnb y 20 de Booking. **Lo que está chico es el
título de la tarjeta**: 13px en la grilla, contra 16 de Booking y 18 de
GetYourGuide. La sensación de "título de sección grande" viene de la distancia
entre los dos, no del título solo.

**Ojo con la Fase 6 tal como está escrita: empeora esto.** Su escala asigna
`--fs-d2` = 23/28 (ya corregido por la decisión del 2026-08-18). Con la tarjeta a
15px que la misma fase planea, eso da **1,53 en móvil y 1,87 en escritorio**, o
sea que escritorio se iría bastante más afuera de la banda que hoy.

### Propuesta para `--fs-d2`

**`--fs-d2` = 20 móvil / 22 escritorio**, junto con la subida de `.gc-t` a 15px
que la Fase 6 ya tenía planeada como `--fs-h3`.

| | Relación resultante | Dónde queda |
|---|---|---|
| móvil | 20 / 15 = **1,33** | igual que GetYourGuide |
| escritorio | 22 / 15 = **1,47** | entre Booking (1,50) y GetYourGuide (1,33) |

**Si se prefiere no tocar el tamaño de la tarjeta**, la alternativa mínima es
`--fs-d2` = **19 / 21**, que con las tarjetas de hoy da 1,46 y 1,50: también
adentro de la banda, y en móvil no cambia nada respecto de lo que ya está.

## 2. El texto de las tarjetas está centrado y en los tres referentes va a la izquierda

**Verificado en los tres: `text-align: start` en el título de tarjeta de Airbnb,
Booking y GetYourGuide, en las dos anchos.** Sin excepción.

**El costo son CUATRO declaraciones, no dos, y la diferencia importa.** Medido
elemento por elemento dentro de cada tarjeta:

| Tarjeta | Elementos | Cuántos dependen de la herencia |
|---|---|---|
| `.gc` (grilla) | 13 | **los 13**: ninguno declara alineación propia |
| `.tc` (carrusel) | 14 | solo 4, porque **`.tc-b` declara `text-align:center`** |

Las cuatro declaraciones:

1. `.gc` → agregar `text-align:left`
2. `.tc-b` → `center` pasa a `left`
3. **`.tc-m` → `justify-content:center` pasa a `flex-start`**
4. **`.gc-m` → `justify-content:center` pasa a `flex-start`**

**Las dos últimas son el punto que un cambio "de una línea" se comería.** La fila
de metadatos (rating, duración) es flex y se centra con `justify-content`, que
**`text-align` no toca**. Alinear solo el texto dejaría el título a la izquierda y
el rating centrado debajo, que se ve peor que el centrado actual.

**La lista de 128 selectores de la Fase 0 NO aplica acá, y conviene decirlo para
que nadie la use como argumento de riesgo.** Esa lista mide qué se descuadra al
sacar el `text-align:center` **global** que la Fase 4 replicó en `.app`. Este
cambio no toca ese centrado: alcanza a dos subárboles, y **fuera de las tarjetas
no cambia ni un elemento**. Son dos cosas distintas que se parecen en el nombre.

**Riesgo real: bajo.** Está acotado a las tarjetas, no toca layout, y se revierte
con las mismas cuatro declaraciones.

## 3. Las tarjetas son cajas blancas con borde y sombra

Lo que declara Finde hoy, medido:

| | `.tc` (carrusel) | `.gc` (grilla) |
|---|---|---|
| Fondo | blanco | blanco |
| Borde | 1px `rgba(0,0,0,.06)` | 1px `rgba(0,0,0,.06)` |
| Sombra | `0 2px 12px rgba(0,0,0,.06)` | ninguna en reposo |
| Radio | 20px, con `overflow:hidden` | 16px, con `overflow:hidden` |
| Hover | sube 3px, sombra más fuerte, borde terracota | sube 2px, sombra, borde terracota |

Y los referentes, medidos: **fondo transparente, sin borde y sin sombra** en
Airbnb y en las tarjetas principales de GetYourGuide. Booking tampoco usa caja,
solo una sombra muy suave en algunas. **La observación es correcta.**

### Pero la premisa de las 6 tarjetas por fila NO se sostiene, y esto cambia el análisis

Medido a 1440:

| Sitio | Por fila | Ancho de tarjeta |
|---|---|---|
| Airbnb | **8** | 180px |
| GetYourGuide | **4** | 284px |
| **Finde** | **4** | 232px |

**GetYourGuide muestra las mismas 4 que Finde**, con tarjetas más grandes. Airbnb
muestra 8 porque **usa los 1440px completos con tarjetas angostas**, mientras la
grilla de Finde vive en un contenedor de **1000px**.

**Lo que limita las columnas es el ancho del contenedor y el de la tarjeta, no la
caja.** Sacar la caja libera **2px por tarjeta**, los dos bordes de 1px. Para
llegar a 6 columnas en 1000px las tarjetas tendrían que medir 147px, o habría que
ensanchar el contenedor a unos 1300. **Son dos cambios independientes y conviene
no venderlos juntos.**

### Qué sostiene la caja, que es lo que hay que reponer si se saca

1. **Las esquinas redondeadas de la foto.** `.tc-img` y `.gc-img` tienen
   `border-radius: 0`: **el redondeo sale del `overflow:hidden` de la caja.** Sin
   caja, la foto sale con esquinas rectas hasta que se le ponga radio propio.
2. **Todo el hover.** Hoy es la caja la que sube, cambia de sombra y de color de
   borde. Sin caja hay que inventar otra señal (Airbnb usa la foto). **Es la
   parte más cara del cambio, y es interacción, no color.**
3. **El padding del texto**, `14px` en el carrusel y `10px` en la grilla. Sin
   caja el texto debería quedar al ras de la foto, así que el padding horizontal
   se va a 0 y el vertical se queda. **Se cruza con el punto 2**: conviene hacer
   los dos juntos o el texto queda a la izquierda pero con sangría.
4. **El contraste del texto, que baja pero NO falla.** Hoy el texto va sobre
   blanco; sin caja iría sobre el `#FAFAF7` de la página:

   | Color | Sobre blanco | Sobre `#FAFAF7` |
   |---|---|---|
   | `--ch` principal | 13,99 | 13,38 |
   | `--gy-strong` | 6,92 | 6,62 |
   | **`--gy`** (la fila de metadatos, 12px) | 4,76 | **4,55** |

   **Ninguno cae debajo de 4,5, así que sigue cumpliendo AA.** Pero `--gy` pasa a
   cumplir por 0,05, o sea que **el margen desaparece**: cualquier ajuste futuro
   del fondo o del gris lo rompe. Si se saca la caja, ese gris conviene subirlo a
   `--gy-strong`.
5. **Lo que NO sostiene: la separación visual.** El blanco de la tarjeta contra
   el `#FAFAF7` de la página es una diferencia de 2% de luminancia. **La caja casi
   no se ve hoy**, así que sacarla pierde menos de lo que parece.
