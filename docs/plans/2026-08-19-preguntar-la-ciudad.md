# Preguntar la ciudad: investigación y plan

> **2026-08-19. Investigación y plan, sin código escrito.**
>
> Es el nivel 3 del trabajo de geolocalización, y **la única de las tres piezas
> que ataca la PRECISIÓN**. Las otras dos ya están en `main`: dejar de afirmar
> (niveles 1 y 2) y los departamentos (la opción C).

## Por qué existe esta tanda, en una línea

La detección por IP **se equivoca y no lo podemos arreglar**. Medido: con José en
Lima y sin VPN, Vercel reporta `rawCity: "Arequipa"` y `rawRegion: "ARE"`. El
error es del proveedor, no del mapeo, y el código ISO se equivoca igual que el
nombre de ciudad porque salen de la misma consulta.

**Lo único que queda es preguntar.**

## 1. Dónde se recuerda la elección

**Con el precedente que ya existe, sin inventar nada.** El repo tiene dos pares
de helpers de `localStorage` con la misma forma, los dos con la guarda
`typeof localStorage === "undefined"` y `try/catch`:

- `NOTIF_SEEN_KEY = "finde_notif_seen"` (notificaciones vistas)
- `BOOKING_DRAFT_KEY = "finde:borrador-reserva"` (el borrador del checkout)

Se agrega un tercero con la misma forma. **Lo que se guarda son TRES campos, y el
tercero es el que hace funcionar el caso del viajero:**

```js
{
  dept: "Lima",              // lo que el viajero eligió
  detectedAtChoice: "Arequipa", // lo que la IP decía CUANDO eligió
  ts: 1787157008022
}
```

## 2. Cuándo se pregunta, y por qué NO alcanza con "la primera vez"

**La duda de José es correcta y el caso es real:** alguien que guarda Lima y
viaja a Cusco quiere ver tours de Cusco, y si la elección es para siempre le
mostramos los de su casa.

**Pero comparar la detección contra la ELECCIÓN no sirve**, y esto es lo que
`detectedAtChoice` resuelve. Si José elige "Lima" mientras la IP dice "Arequipa",
la detección va a diferir de su elección **en todas las visitas siguientes,
esté donde esté**. Preguntarle cada vez sería castigarlo por un error nuestro.

**Comparar la detección contra lo que la IP decía CUANDO eligió sí sirve:**

| Situación | `detected` | `detectedAtChoice` | Qué hacemos |
|---|---|---|---|
| José en su casa, la IP sigue equivocada igual | Arequipa | Arequipa | **nada**, silencio |
| José viaja a Cusco, la IP cambia | Cusco | Arequipa | **ofrecer** cambiar a Cusco |
| Primera visita, sin elección guardada | Arequipa | (no hay) | **preguntar** |

**Y no es una pregunta, es una oferta.** Una línea al lado del selector: "¿Estás
en Cusco? Cambiar". No bloquea, no interrumpe, y si la ignora sigue viendo lo que
eligió.

> **Supuesto que hay que decir: esto asume que la detección es ESTABLE por
> conexión.** Tenemos dos muestras de la de José, las dos "Arequipa". Si en
> realidad fuera ruidosa, la oferta aparecería de más. **El costo de equivocarse
> es bajo a propósito**: es una línea descartable, no un modal.

## 3. Dónde va, medido a 390px

Medido sobre la pantalla real de inicio a 390 de ancho:

```
barra superior            0
hero                     86  (alto 220)
buscador                308  (alto  51)
chips de categoria      371  (alto  60)
"Recién publicados"     431  (alto  44)
PRIMERA TARJETA         489  (alto 272)
"Tours en [ciudad]"     809
```

Y una fila de chips realista (rótulo + chips + margen) **mide 98px**, medido
insertándola de verdad:

| Dónde | Qué le pasa a la primera tarjeta | Qué le pasa a la sección de ciudad |
|---|---|---|
| **A. Arriba, tras los chips de categoría** | **489 → 587** | 809 → 907 |
| **C. Dentro de la sección de ciudad** | **no se mueve** | no se mueve |

**Con un viewport útil de unos 700px** (390×844 con las barras del navegador), la
opción A deja **113px de la primera tarjeta visibles**: se ve un pedazo de la
foto y nada más. El producto se va abajo del pliegue.

### La propuesta es la C, y el argumento no es solo el espacio

**La pregunta solo le importa a quien va a usar la sección que controla.** El
filtro por ciudad **solo afecta al carrusel "Tours en [ciudad]"**: está medido
que `CatalogView` nunca recibió la ciudad, y "Recién publicados" tampoco se
filtra. Preguntar arriba interrumpe a todos, incluido al que llegó buscando otra
cosa, para decidir algo que no afecta a nada de lo que está viendo.

**Forma concreta:** la sección de ciudad mantiene su título ("Tours en Lima") y
su carrusel, y **debajo** aparece la fila de chips la primera vez. El viajero ve
contenido Y la pregunta juntos, en el único lugar donde la respuesta cambia algo.
Los 98px caen a partir de y≈900, o sea abajo del pliegue, y no empujan nada que
importe.

## 4. Qué pasa si no elige nada

**Puede ignorarla, y no hay truco: no es un modal, es contenido de la página.**
Se scrollea y ya.

**El silencio NO se toma como aceptación.** La fila se queda ahí, como parte de
esa sección, hasta que elija. Eso hace innecesarios el contador de apariciones,
el "no volver a mostrar" y el temporizador: **no hay nada que nagear porque nunca
aparece encima de nada.**

La sugerencia de la IP se sigue usando mientras tanto, y está bien: es un punto de
partida, y desde el nivel 2 el título ya no la anuncia como conocimiento.

## 5. El deep link a una ficha: NO se pregunta, y hay un argumento medido

**Coincido con la intuición de José, y además hay un dato duro.**

**El filtro por ciudad no afecta a la ficha de tour en absoluto.** Preguntarle la
ciudad a alguien que llegó de Google a "Cumbe Mayo" sería pedirle una decisión
que **no cambia ni un píxel de la pantalla que está mirando**.

A eso se suma lo obvio: quien llega por un deep link trae una intención
específica, y la pregunta es general. Interrumpirla es cambiarle el tema.

**Y con la forma de la opción C el asunto se resuelve solo**, sin ninguna
condición extra en el código: **la fila vive dentro de la sección de ciudad, que
solo existe en el inicio.** No hay que escribir "si es deep link no preguntes":
no está ahí porque esa sección no está ahí.

Cuando el viajero navegue al inicio, la verá.

## El plan, en pasos

1. **El tercer par de helpers de `localStorage`**, con la forma de los dos que ya
   existen, guardando `{ dept, detectedAtChoice, ts }`.
2. **Que `/api/geo` siga informando el departamento detectado** (ya lo hace) y que
   el frontend lo guarde en memoria para poder comparar contra
   `detectedAtChoice`.
3. **La elección guardada gana sobre la detección** al elegir el departamento
   inicial, con el mismo orden de precedencia que ya tiene el override de
   desarrollo.
4. **La fila de chips dentro de la sección de ciudad**, la primera vez.
5. **La oferta de cambio** cuando `detected !== detectedAtChoice`.
6. **Verificación**: volcado de posiciones a 390 antes y después, con la fila
   presente y ausente, para confirmar que nada arriba de la sección de ciudad se
   mueve.

## Lo que esta tanda NO hace

- **No pide permiso de geolocalización del navegador.** Sería más preciso y
  además pediría un permiso que hoy no pedimos nunca. Queda fuera: la decisión de
  pedir permisos es de producto y merece su propia discusión.
- **No toca la búsqueda.** "Tours cerca de mí" sigue sin funcionar porque el POST
  a `/api/search` manda solo `{ query }`. Es un pendiente aparte ya anotado.
