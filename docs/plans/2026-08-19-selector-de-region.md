# Selector de región en el formulario de tour: investigación y plan

> **2026-08-19. Investigación y plan, sin código escrito.**
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

### c. `generateAiDesc`: un TERCER parseo por coma, en el frontend

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
