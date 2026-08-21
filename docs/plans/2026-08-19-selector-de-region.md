# Selector de región en el formulario de tour: investigación y plan

> **2026-08-19. Investigación, plan, y las decisiones con las que se ejecutó.**
>
> **ESTADO: EJECUTADO.** La investigación de abajo es del estado previo y se deja
> tal cual. Las decisiones de José y lo que efectivamente se hizo están al final,
> en "Lo que se decidió". Los números medidos acá son de antes del cambio.
>
> La decisión ya está tomada (`docs/decisiones.md`, opción A): selector de
> departamento, ciudad en campo aparte, validación con `enum` de zod en
> `parseTourInput`. **Acá no se reabre**: se mide el terreno y se ordena el
> trabajo.

## LO PRIMERO: la lista existente NO sirve tal cual

**`DEPARTMENTS` de `lib/cities.js` tiene 24 entradas, no 25.** Medido:

```
DEPARTMENTS: 24
codigos ISO en la tabla: 26
  COLAPSAN en "Lima": CAL, LIM, LMA
```

**Callao no está, y su ausencia es deliberada**, no un olvido: la tabla mapea
`CAL` (El Callao) y `LMA` (Municipalidad Metropolitana de Lima) a `"Lima"`,
porque para un buscador de tours los tres son el mismo lugar.

### Y esto tiene una consecuencia medible, no teórica

**Si el formulario ofreciera "Callao" como región, esos tours se caerían del
agrupamiento que ve el viajero.** `departmentsOfTour` matchea la región contra el
índice de `DEPARTMENTS`, y `"Callao"` no está ahí: el tour quedaría fuera de todo
grupo, que es exactamente el bug de los 7 tours invisibles que se acaba de cerrar.

**Recomendación: el formulario usa las mismas 24, y Callao se carga como CIUDAD
con región Lima.** Es coherente con la decisión que ya se tomó para la geo, no
crea una lista distinta, y mantiene la propiedad de que **hay una sola lista**.

Si alguna vez se quiere Callao separado, se agrega en `lib/cities.js` **y ahí
mismo se decide cómo agrupa**, que es el único lugar donde esa decisión se puede
tomar una sola vez.

## 1. El campo Ubicación hoy, medido

Es **un solo campo de texto libre** (`Ej: Huaraz, Áncash`) que el backend parte
por la coma en `parseTourInput` (`lib/tour-input.ts`):

```js
const locParts = b.location.split(",").map((s) => s.trim()).filter(Boolean);
const city = locParts[0];
const region = locParts[1] ?? city;
```

Qué hace con cada forma de escribirlo, corriendo esas dos líneas:

| Lo que escribe la agencia | city / region | |
|---|---|---|
| `Huaraz, Áncash` | Huaraz / Áncash | correcto |
| `Huaraz` | Huaraz / **Huaraz** | la región queda mal |
| `Cusco` | Cusco / Cusco | zafa por casualidad: la ciudad y el departamento se llaman igual |
| `Huacachina, Ica, Perú` | Huacachina / Ica | **descarta "Perú" en silencio** |
| `, Áncash` | **Áncash** / Áncash | la coma al principio convierte la región en ciudad |
| `Lima,` | Lima / Lima | |
| `lima lima` | lima lima / lima lima | el valor sucio que hay hoy en la base |

**Hay dos fallos silenciosos que no estaban anotados:** lo que pasa de la segunda
parte se descarta sin avisar, y una coma al principio hace que el departamento
termine guardado como ciudad.

## 2. Cuántos tours quedarían inválidos: 2 o 1, según cómo se valide

Medido sobre los **49 tours** de la base (42 activos):

```
ENUM ESTRICTO (z.enum, match exacto):              2 de 49
   pausado "prueba manual"  region="lima"
   pausado "prueba"         region="lima lima"

CON NORMALIZACION previa (minusculas, sin tildes): 1 de 49
   pausado "prueba"         region="lima lima"
```

**Los dos están pausados y son tours de prueba** que ya figuran en la checklist de
borrado de `docs/estado.md`. **Ninguno de los 42 activos falla**, con cualquiera
de las dos variantes.

**Es una decisión del plan, no un detalle**: el enum estricto rechaza `"lima"` y
obliga a corregirlo a mano; la normalización previa lo acepta y lo guarda como
`"Lima"`. **Recomendación: normalizar antes de validar**, porque el objetivo es
que el dato quede canónico, y rechazar una grafía que sabemos traducir es
fricción sin beneficio.

## 3. La autolimpieza: sigue siendo cierta, y hoy sobra

**Confirmado**, y con un matiz que la vuelve casi irrelevante: **hoy no hay nada
que limpiar en el catálogo público.** Los 42 activos ya tienen región válida.

Los 2 sucios están pausados y salen por otra puerta (la checklist de borrado). O
sea que **la validación es puramente preventiva**: no arregla un problema
existente, evita el que viene con la próxima agencia.

**Sigue sin hacer falta migración**, por el motivo original: con la validación
puesta, un tour sucio falla al editarse y se corrige ahí.

## 4. Qué se rompe

### a. La precarga al editar, y son DOS mapeos, no uno

El formulario se precarga con `editingTour.location`, que es el string
`"Ciudad, Región"` armado en `mapTourFromApi`. Con dos campos separados hay que
precargar `city` y `region` por separado.

**La mitad del trabajo ya está hecha y es un regalo de la tanda de geo:**
`mapTourFromApi` **ya expone `city` y `region`** (se agregaron para agrupar por
departamento).

**Pero `loadOperatorTours` los descarta.** Es la segunda lista blanca, la del
panel, y enumera campos a mano sin incluirlos. **Es exactamente el trap que
documenta `.claude/rules/frontend.md`**, una capa más afuera: el dato existe en el
API, sobrevive el primer mapeo, y el segundo lo tira en silencio.

### b. El seed: no se rompe, y tampoco queda protegido

**`prisma/seed.ts` NO pasa por `parseTourInput`**: escribe directo a Prisma con
`city` y `region` ya separados. Sus 9 valores de región son todos departamentos
válidos.

O sea que **la validación no lo toca**, ni para bien ni para mal. Si algún día el
seed escribe una región inválida, nada lo detiene. **Queda como decisión: validar
también ahí o dejarlo anotado.**

### c. `generateAiDesc`: un TERCER parseo por coma, y ES EL MÁS CARO DE LOS TRES

> **PRIORIDAD, y no es la que sugiere el orden de esta lista.** José lo marcó
> como el hallazgo más caro de la investigación, y no estaba en ninguna lista
> previa. El motivo: **los otros dos guardan un dato mal en una columna; este le
> dice a la IA sobre qué lugar escribir.**
>
> Con la región derivada mal, Claude no falla ni avisa: escribe un párrafo bien
> redactado sobre el lugar equivocado, se publica, y **le llega al viajero como
> texto plausible**. Un error que se ve bien es más difícil de detectar que uno
> que rompe: un campo vacío se nota, un párrafo sobre Áncash en un tour de Ica
> pasa la revisión de cualquiera que no conozca los dos lugares.

El botón de generar descripción con IA hace su propio
`form.location.split(",")` y manda `city` y `region` a
`/api/ai/generate-description`. **Si no se toca, seguiría derivando la región de
un campo de texto libre que ya no va a existir.**

Y no es cosmético: esa región **entra al prompt de la IA**, así que una región mal
derivada le hace escribir sobre el lugar equivocado.

### d. Los tres lugares donde el formulario muestra `form.location`

El input del paso 1, el resumen del paso y el resumen final de "tour publicado".
Los tres tienen que pasar a mostrar los dos campos.

### e. El contrato del API

`parseTourInput` lo usan **el POST (`api/tours/index.ts`) y el PUT
(`api/tours/[id].ts`)**, así que una sola validación cubre los dos, como decía la
decisión. Pero el body pasa a llevar `city` y `region` en vez de `location`, y eso
**es un cambio de contrato**: hay que decidir si se acepta `location` como
respaldo durante una transición o se corta seco. **Recomendación: cortar seco.**
El único cliente es el formulario, y mantener los dos caminos es mantener vivo
justo el que se quiere eliminar.

## 5. La relación con el selector de ciudad del inicio: NO hay que tocarlo, y mejora

**Sigue funcionando tal cual, y queda mejor que hoy.**

Los grupos del viajero salen de `departmentsOfTour(t)`, que matchea **primero por
`region`** contra los departamentos y **después por `city`**. Con la validación
puesta, **la región SIEMPRE va a matchear**, que hoy no está garantizado.

**Los nombres para mostrar no se tocan.** La traducción `Loreto → Iquitos` vive en
`DEPARTMENT_DISPLAY` y se aplica al renderizar. Que la agencia elija "Loreto" en
el formulario y el viajero lea "Iquitos" **es el diseño, no un desajuste**: son
las dos caras de la misma tabla.

**Y el caso raro sigue andando:** "Manu" tiene `region: "Madre de Dios"` y
`city: "Cusco"`, y aparece en los dos grupos. Eso depende de `CITY_TO_DEPARTMENT`,
que no cambia.

> **La única forma de romper esto es agregar al formulario una región que no esté
> en `DEPARTMENTS`.** O sea: Callao. Ver la sección de arriba.

## El plan, en pasos

### Paso 1. Decidir Callao, y que quede escrito

**Qué toca:** `lib/cities.js` si se decide agregarlo, o solo un comentario si no.
**Qué puede romperse:** nada todavía, pero es el paso que evita romper el paso 5.
**Cómo se verifica:** que `DEPARTMENTS.length` y la lista del formulario sean
literalmente la misma expresión, no dos que coinciden.

### Paso 2. El backend: `city` y `region` separados, con el enum

**Qué toca:** `lib/tour-input.ts` (el schema de zod y las dos líneas del split).
**Qué puede romperse:** el POST y el PUT a la vez, que es lo que hace este paso
valioso y también riesgoso. Un tour existente que se edite y no mande `region`
válida pasa a fallar.
**Cómo se verifica:** correr el parseo contra los 49 tours de la base y confirmar
el número medido (1 o 2 inválidos, todos pausados). Y probar el PUT sobre un tour
válido y sobre uno sucio.

### Paso 3. El formulario: dos campos y el selector

**Qué toca:** el input de Ubicación pasa a ser dos controles, más los dos
resúmenes que muestran `form.location`.
**Qué puede romperse:** la precarga al editar, y el ancho del selector en 390.
**Cómo se verifica:** editar un tour existente de cada forma (con coma y sin
coma) y confirmar que los dos campos llegan precargados y correctos.

### Paso 4. La precarga: agregar `city` y `region` a `loadOperatorTours`

**Qué toca:** la segunda lista blanca, la del panel.
**Qué puede romperse:** nada, es aditivo. Lo que rompe es NO hacerlo: los campos
llegan vacíos y el editor pisa la región con un valor por defecto.
**Cómo se verifica:** leer el objeto de `opTours` en la sesión real y confirmar
que `city` y `region` están, que es la lección de `pendingRequests`.

### Paso 5. `generateAiDesc`: dejar de partir por la coma

**Qué toca:** el armado del body del generador de descripción.
**Qué puede romperse:** el prompt de la IA, en silencio, si se olvida.
**Cómo se verifica:** generar una descripción para un tour con ciudad y región
distintas y confirmar que el texto habla del lugar correcto.

### Paso 6. Documentar

**Qué toca:** `docs/estado.md` (el pendiente pasa a cerrado),
`docs/pendientes-producto.md` (el razonamiento) y `docs/decisiones.md` si la
decisión de Callao o la de normalizar merecen quedar registradas.

## Lo que este plan NO hace

- **No migra los datos.** No hace falta: ninguno de los 42 activos es inválido.
- **No valida el seed.** Queda anotado como decisión aparte.
- **No toca el selector de ciudad del viajero.** Mejora solo.


---

# Lo que se decidió, y lo que se ejecutó

**2026-08-19, mismo día.** Las cinco decisiones de José y el resultado.

## 1. Callao: van las 24, y el motivo de producto pesa más que el técnico

**Decidido: la lista del formulario son las mismas 24, y Callao entra como
CIUDAD con región Lima.**

El motivo técnico ya estaba (un tour con `region: "Callao"` se caería del
agrupamiento). **El que José agregó es más fuerte y es el que quedó escrito
primero en el código:** un viajero que busca tours no piensa "Callao" como
destino separado de Lima, piensa Lima. **La división administrativa no coincide
con cómo la gente busca**, y esta lista ordena una búsqueda, no un padrón.

Queda anotado **al lado de la lista**, en `lib/cities.js`, para que nadie la
"complete" a 25 después: la lista se ve incompleta y no lo está.

## 2. Normalizar antes de validar

**Decidido: sí.** Rechazar `"lima"` cuando sabemos que es Lima es fricción sin
beneficio. Lo hace `toDepartment`, que acepta cualquier grafía y devuelve siempre
la forma canónica.

**Medido con el código ya escrito, contra los 49 tours reales:**

```
tours en la base: 49 (activos: 42)
RECHAZADOS por la validacion nueva: 1
   pausado  region="lima lima"  prueba
ACEPTADOS pero se les corrige la grafia: 1
   pausado  "lima" -> "Lima"  prueba manual
>>> ACTIVOS que fallarian al editarse: 0
```

## 3. Los dos fallos silenciosos quedan escritos, aunque ya no puedan pasar

**Decidido: van al plan Y al código, como evidencia.** Desaparecen solos con el
selector, así que documentarlos parece innecesario. No lo es: **son la razón por
la que el texto libre no servía**, y sin ellos "volvamos a un solo campo, es más
simple" suena razonable dentro de seis meses.

Los tres casos (la tercera parte descartada, la coma inicial que corre todo un
lugar, y la región que quedaba igual a la ciudad sin coma) están escritos en
`lib/tour-input.ts`, arriba de los campos que los reemplazaron.

## 4. El seed: qué costaba, y qué se hizo

**La pregunta era si convenía hacerlo pasar por la validación. La respuesta es
que no, y que la garantía sale igual por otro lado más barato.**

**Enchufarlo a `parseTourInput` es caro y además equivocado.** El seed escribe
con la forma del MODELO (`priceSoles` en céntimos, `durationHours` entero, el
enum `Category`) y `parseTourInput` espera la forma del FORMULARIO (precio en
soles, `"5 horas"`, `"culture"`). Habría que convertir 40 tours **hacia atrás**
para que la función los convierta de nuevo hacia adelante, y arrastraría zod,
Prisma y Voyage a un script que hoy no los necesita.

**Lo que hacía falta era la garantía, no el camino.** Se agregó
`verificarRegiones` en `prisma/seed.ts`: quince líneas que corren **antes de
escribir nada** y cortan el seed si alguna región no es un departamento.

**Y cubre las DOS fuentes, que es el punto.** El seed no tiene una lista de
tours, tiene dos:

| Fuente | Tours | Protección previa |
|---|---|---|
| el array `TOURS` de `seed.ts` | 30 | el tipo `TourSeed`, que solo dice `string` |
| `data/track-b/tours-to-migrate-from-hardcoded.json` | 10 | **ninguna, es un JSON** |

**La segunda es la que importa**: ningún chequeo de tipos puede mirar adentro de
un JSON. Medido: **40 regiones, 0 inválidas**, y con un valor malo inyectado el
corte dispara.

## 5. Qué quedó tocado

| Archivo | Qué |
|---|---|
| `lib/cities.js` | el criterio de Callao, `DEPARTMENTS_FOR_SELECT` y `toDepartment` |
| `lib/geo.ts` | los reexporta con tipos |
| `lib/tour-input.ts` | `city` y `region` separados, validación normalizando |
| `src/AppDemo.jsx` | los dos campos, `formatLocation`, y los cinco puntos que leían `location` |
| `prisma/seed.ts` | `verificarRegiones` |

**El orden de `DEPARTMENTS` resultó ser un problema real que no estaba
previsto.** Ese array sale de recorrer la tabla de códigos ISO, donde `CAL` viene
antes que `CUS`, así que **"Lima" aparecía entre Cajamarca y Cusco**. En un
desplegable eso se lee como un error. Por eso el selector usa
`DEPARTMENTS_FOR_SELECT`, que es la misma lista ordenada, no una lista aparte.
