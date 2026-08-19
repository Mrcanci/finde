# La ciudad no se detecta en Cajamarca: diagnóstico

> **2026-08-19. Investigación, sin arreglar.** Reportado por José usando el demo
> desde Cajamarca: la ubicación no cambió y siguió viendo tours de Lima. No tocó
> el selector manual.

## La respuesta corta

**La detección NO falló. Detectó bien y no hubo match, y el respaldo es Lima.**

De las dos hipótesis que había sobre la mesa, es la segunda. Y la causa es una
sola línea de datos: **Cajamarca no está en la lista de ciudades soportadas.**
Son nueve, escritas a mano, y no está.

```
Lima, Cusco, Arequipa, Trujillo, Ica, Iquitos, Piura, Huaraz, Puerto Maldonado
```

## Lo medido, corriendo la función real

```
x-vercel-ip-city="Cajamarca" region="CAJ"       -> "Lima" (reason: unmapped)
x-vercel-ip-city="Cajamarca" region="Cajamarca" -> "Lima" (reason: unmapped)
x-vercel-ip-city="Arequipa"  region="ARE"       -> "Arequipa" (reason: matched)
```

**Y el endpoint responde.** Contra producción:

```
GET https://www.finde.pe/api/geo
{"city":"Arequipa","country":"PE","source":"geo"}
```

> **CORRECCIÓN del 2026-08-19, y es un error de razonamiento mío, no un dato
> que envejeció.** La primera versión de este párrafo decía "desde una máquina
> en Arequipa". **Eso era circular**: describí dónde estaba la máquina usando la
> respuesta que estaba probando. Nadie verificó que la máquina estuviera en
> Arequipa. Lo que la medición dice es "el endpoint responde Arequipa con
> source geo", nada más. Ver "La segunda cara" al final, que es donde esa
> distinción resultó ser lo más importante del informe.

O sea que el mecanismo responde: detecta algo, mapea y contesta. Para Cajamarca
no tiene a dónde mapear.

## 1. Cómo detecta la ciudad

**Por IP, con las cabeceras `x-vercel-ip-*` que Vercel inyecta.** No es GPS ni la
API de geolocalización del navegador: **nunca se le pide permiso al usuario**.

`api/geo.ts` lee `x-vercel-ip-city`, `x-vercel-ip-country-region` y
`x-vercel-ip-country`, y se los pasa a `mapToSupportedCity` (`lib/geo.ts`).

## 2. La cadena completa

```
Vercel (cabeceras de IP)
  -> api/geo.ts
  -> mapToSupportedCity (lib/geo.ts)   <- ACA se pierde Cajamarca
  -> { city, country, source }
  -> efecto en AppDemo que hace fetch("/api/geo")
  -> GUARDA #2: solo acepta si SUPPORTED_CITIES.includes(data.city)
  -> useState selectedCity
  -> toursByCity(tours, selectedCity) filtra por tour.location
  -> carrusel "Tours en [ciudad]" de la PANTALLA DE INICIO
```

**Dos cosas que sorprenden de esta cadena:**

1. **El filtro por ciudad existe SOLO en el carrusel del inicio.** `CatalogView`
   no recibe `selectedCity` y nunca filtró por ciudad: el catálogo muestra todo.
   Si lo que José miró fue el catálogo, ahí no hay nada roto, hay una función que
   no existe.
2. **La lista de nueve ciudades está escrita TRES veces**, y las tres son
   distintas entre sí:
   - `lib/geo.ts`: `SUPPORTED_CITIES` + `CITY_ALIASES` (backend)
   - `src/AppDemo.jsx`: `SUPPORTED_CITIES` + `SUPPORTED_CITY_ALIASES` (selector y
     filtro)
   - `src/AppDemo.jsx`: `CITY_ALIASES`, otra lista más chica y con otras claves,
     que usa el buscador local por palabras

   **Ninguna de las tres tiene Cajamarca**, así que agregarla es tocar las tres.

## 3. Cómo reproducirlo sin estar en Cajamarca

**El override de desarrollo no sirve para esto.** `readDevCityOverride` acepta
`?city=` solo en localhost y **solo si la ciudad está en la lista**, así que no
se puede forzar Cajamarca justamente porque el bug es que no está.

Lo que sí se puede, y es lo que se hizo: **correr `mapToSupportedCity` con los
valores que mandaría Vercel** (arriba).

### Y hay una forma de saber cuál de los dos fallos fue, mirando la pantalla

**Al lado de "Tours en [ciudad]" aparece " · cerca de ti", pero SOLO si
`source === "geo"`.** Con Cajamarca la respuesta es `source: "fallback"`, así que
ese texto **no** aparece.

| Lo que José vio | Qué significa |
|---|---|
| "Tours en Lima" **sin** "· cerca de ti" | Detectó Cajamarca y no matcheó. **Es este bug.** |
| "Tours en Lima **· cerca de ti**" | La IP del celular estaba geolocalizada en Lima de verdad. Sería el caso del punto 6 |

**Es la pregunta más barata que se le puede hacer**, y decide si hay uno o dos
problemas.

## 4. Qué pasa cuando falla: siempre Lima

`mapToSupportedCity` devuelve Lima en **cuatro** caminos distintos, y solo uno de
ellos es "no hay dato":

| reason | Cuándo | source |
|---|---|---|
| `non_pe` | el país no es PE | fallback |
| `unmapped` | hay ciudad pero no está en la lista | fallback | 
| `no_input` | no hay ciudad ni región | fallback |
| (sin headers) | localhost o `vercel dev` | fallback |

**Cajamarca cae en `unmapped`.** El respaldo a Lima es deliberado y está
comentado, pero **hoy es indistinguible de "no pudimos detectarte"** para
cualquiera que mire desde afuera.

**Y el dato que lo haría evidente no está donde se necesita:** `api/geo.ts`
agrega un bloque `debug` con la ciudad cruda y el `reason`, pero solo si
`NODE_ENV !== "production"`. En Vercel eso es "production" **también en los
deploys de preview**, así que en dev.finde.pe tampoco se ve. Confirmado: la
respuesta de producción no trae `debug`.

## 5. La sospecha de `Tour.region` sucio: NO es la causa

**Los datos de Cajamarca están limpios.** Los cinco tours de MEGATOURS:

```
city="Cajamarca" | region="Cajamarca" | location="Cajamarca"
```

Bien escritos, con mayúscula, los cinco iguales.

**Y aunque estuvieran sucios, no cambiaría nada: el filtro no compara con
igualdad exacta.** `toursByCity` normaliza (minúsculas, sin tildes) y usa
`includes`, así que "cajamarca" matchearía igual que "Cajamarca". La comparación
no es el problema.

Las grafías sucias (`"lima"`, `"lima lima"`) están en **tours pausados**, fuera
del catálogo. Ese pendiente sigue vivo por la métrica de demanda, pero **no es
este bug**.

## 6. La duda de las IPs móviles: no se pudo medir, y así se mide

**No se puede verificar desde acá**: haría falta una IP móvil peruana fuera de
Lima. Lo único medido es que **desde una conexión fija en Arequipa la detección
acertó**, o sea que el mecanismo no está roto de raíz.

La forma barata de saberlo es la tabla del punto 3: si José vio "· cerca de ti",
la IP decía Lima y el problema es el que él sospecha; si no lo vio, es `unmapped`
y las IPs no tienen nada que ver.

**Y vale la pena decirlo aunque no esté medido:** si resultara ser eso, la salida
no es afinar la detección, es **preguntar la ciudad la primera vez o hacer el
selector mucho más visible**, porque la IP nunca va a ser confiable.

## 7. El selector manual: filtra de verdad, pero tampoco tiene Cajamarca

**Cambia el filtro real**, no solo el título: `onPick` llama a `pickCity`, que
setea `selectedCity` (el mismo estado que alimenta a `toursByCity`) y marca
`geoSource = "manual"` para que una respuesta tardía de `/api/geo` no lo pise.

**Pero lista las mismas nueve ciudades.** O sea que **José no habría podido
arreglarlo a mano aunque hubiera tocado el selector**: Cajamarca no está ahí
tampoco.

## 8. La búsqueda con IA: no está afectada, porque nunca recibe la ciudad

El POST a `/api/search` manda **solo** `{ query }`. La ciudad detectada no viaja.

Lo que hay en el frontend es otra cosa: un buscador local por palabras que parsea
**el texto que el usuario escribió** ("cerca de Lima") con una tercera lista de
alias. No usa la geolocalización.

**No está afectada por este bug**, pero de acá sale otro hueco: **"tours cerca de
mí" no funciona en la búsqueda**, porque la ciudad nunca llega al backend.

## El alcance real, medido: 7 de 42 tours activos

Corriendo el filtro real contra los tours activos:

```
Lima 10 · Cusco 9 · Arequipa 5 · Ica 4 · Trujillo 2 · Piura 2
Iquitos 1 · Huaraz 1 · Puerto Maldonado 1

activos: 42 | alcanzables: 35 | SIN NINGUNA CIUDAD: 7
  - "Kuélap: fortaleza de los chachapoyas 2 días"  location="Chachapoyas, Amazonas"
  - "Ceremonia de ayahuasca regulada en Tarapoto"  location="Tarapoto, San Martín"
  - "City Tour (Medio día)"                        location="Cajamarca"
  - "Cumbe Mayo"                                   location="Cajamarca"
  - "Granja Porcón"                                location="Cajamarca"
  - "Namora"                                       location="Cajamarca"
  - "Otuzco"                                       location="Cajamarca"
```

**El 17% del catálogo activo no aparece en ningún carrusel de ciudad. Y cinco de
esos siete son los de MEGATOURS**, la única agencia piloto real: su catálogo
entero es invisible en la única función que ordena tours por ubicación.

## Si es la misma causa raíz que el pendiente de la región: no

**Son dos problemas distintos y no cambia el orden de las tandas.**

- El pendiente de `Tour.region` es de **entrada de datos**: el campo Ubicación es
  texto libre partido por la coma, y ensucia la métrica de demanda.
- Este bug es de **una lista escrita a mano en tres archivos** que no cubre el
  país.

**Se tocan en un punto**, y conviene tenerlo presente al planificar: el día que
el formulario de tour tenga un selector de ciudad y región en vez de texto libre,
la lista de ciudades de ese selector y la lista de ciudades soportadas **deberían
ser la misma**. Hacer las dos cosas en tandas separadas y con listas distintas
sería crear una cuarta.

---

# El plan (propuesto el 2026-08-19, sin escribir código todavía)

## Un hallazgo posterior al diagnóstico que cambia el plan

**`x-vercel-ip-country-region` no es un nombre de región: es el código ISO
3166-2.** Documentación de Vercel: "a string of up to three characters containing
the region-portion of the ISO 3166-2 code for the first level region". En Perú el
primer nivel son **los 25 departamentos más Callao**, así que ese header trae
`CAJ`, `LIM`, `CUS`, `ARE`.

**Consecuencia inmediata: la rama por región de `mapToSupportedCity` es código
muerto, salvo por una coincidencia.** Compara el código ISO contra alias que son
nombres de ciudad. Probados los 25 códigos:

```
codigos que matchean: ICA -> Ica     (uno solo, y por casualidad ortográfica)

alguien en Pisco (Ica)      -> "Ica"  (matched, por el accidente de "ICA")
alguien en Urubamba (Cusco) -> "Lima" (unmapped)
```

**Y consecuencia para el plan: existe una llave que cubre el país entero y no
cambia nunca**, porque los departamentos del Perú no se agregan cada vez que
entra una agencia.

## 1. Unificar la lista, antes de agregar una sola ciudad

**Hoy está escrita tres veces y las tres son distintas.** Agregar Cajamarca sin
unificar es crear la cuarta copia. Es el mismo patrón que ya costó cuatro veces:
`mapTourFromApi`, `takeSeats`, la condición de publicar y el objeto del panel.

**Forma propuesta: `lib/cities.js`, JavaScript plano con JSDoc y CERO imports**,
siguiendo el precedente documentado de `lib/tour-publish.js`, que existe
exactamente por esto: lo importan los dos lados sin que el navegador arrastre
nada. Ahí viven la lista canónica, la tabla de mapeo y `normalize`.

Consumidores: `lib/geo.ts` (que se queda como el que lee headers), y las **dos**
listas de `src/AppDemo.jsx`, incluida la del buscador local por palabras.

> **Anotar junto a la lista: el día que el formulario de tour tenga selector de
> ciudad y región en vez de texto libre, ESA lista y ESTA tienen que ser la
> misma.** Si no, se crea la cuarta copia por otra puerta, y esta vez con la
> excusa de que es "del formulario".

## 2. Que se pueda diagnosticar sin adivinar

Tres piezas, de menor a mayor:

1. **`reason` pasa a ser un campo permanente de la respuesta.** Hoy existe pero
   solo dentro de `debug`, y `debug` no sale nunca en Vercel. `source` colapsa
   tres casos distintos en `"fallback"`. Con `reason` visible siempre, un `curl`
   distingue "no te detecté" de "te detecté y no te tengo".
   **No expone nada:** es una categoría de cuatro valores.
2. **`/api/geo?debug=1` devuelve la ciudad y la región crudas.** Lo único que
   revela es **la ubicación del que pregunta, a él mismo**. No hay datos de otros
   usuarios ni secretos. Es lo que habría contestado la pregunta de José sin que
   él tuviera que acordarse de nada.
3. **Que la interfaz deje de afirmar lo que no sabe.** Hoy dice "Tours en Lima"
   con la misma cara cuando detectó Lima y cuando no detectó nada. Propuesta:
   cuando `reason !== "matched"`, el título no afirma ubicación y **el selector
   se muestra prominente**, invitando a elegir. Eso además cubre el escenario de
   las IPs móviles sin tener que resolverlo: si la detección no es confiable, lo
   honesto es preguntar.

## 3. Las ciudades que faltan: el criterio

**La formulación que importa, y no era el bug reportado:** hoy **7 de 42 tours
activos no aparecen en ninguna ciudad, y cinco son de MEGATOURS**. El catálogo
entero de la única agencia real es invisible en la única sección que ordena tours
por ubicación.

### Las tres opciones, con su costo medido

| | Qué es | Grupos hoy | Datos sucios | Mantenimiento |
|---|---|---|---|---|
| **A** | Agregar Cajamarca, Chachapoyas y Tarapoto a mano | 12 | ninguno | **Una edición por agencia nueva fuera de la lista** |
| **B** | Derivar de las **ciudades** que tienen tours | **18** | **1** (`"Huacachina, Ica"`, con la coma adentro) | cero |
| **C** | Derivar de la **región** (departamento), y mapear la IP por **código ISO** | **12** | **0** | **cero, y para siempre** |

**Medido sobre los 42 activos:**

```
por ciudad:  18 grupos | 1 sucio | fragmenta Cusco en Cusco/Ollantaytambo/Pisac
                                   y Lima en Lima/Chancay/Lunahuaná
por region:  12 grupos | 0 sucios | 0 tours sin region | 0 huerfanos
             Lima 10 · Cusco 8 · Cajamarca 5 · Arequipa 5 · Ica 4 · Piura 2
             Madre de Dios 2 · La Libertad 2 · Amazonas 1 · Loreto 1
             Áncash 1 · San Martín 1
```

### La recomendación es la C, y el argumento es que la lista deja de existir

**La A es la que hay que descartar por lo que José ya dijo**: una lista a mano de
nueve ciudades en un producto que vende descentralización queda corta cada vez
que entra una agencia nueva.

**La B tiene un costo que no se ve hasta medirlo: hereda la calidad del dato.**
Uno de los 18 grupos ya nace roto (`"Huacachina, Ica"`, con la coma del campo de
texto libre metida adentro de la ciudad), y fragmenta destinos que el viajero
piensa juntos. **El selector pasaría a ser un espejo del pendiente de datos
sucios que sigue abierto.**

**La C usa una llave que no depende de nosotros ni de las agencias:** los 25
departamentos del Perú. El mapeo IP → departamento es una tabla escrita una vez y
que no se toca nunca más, y los grupos salen de los tours que existen. **Con eso
la lista deja de ser una lista.**

### Lo que cuesta la C, dicho completo

1. **El nombre que ve el viajero cambia en seis casos.** "Tours en Loreto" en vez
   de "Tours en Iquitos", y lo mismo con Áncash/Huaraz, La Libertad/Trujillo,
   Madre de Dios/Puerto Maldonado, San Martín/Tarapoto y Amazonas/Chachapoyas.
   **En los seis, el departamento es menos reconocible que el destino.** Se
   resuelve con una tabla chica de nombres para mostrar, pero eso es una decisión
   de producto y va aparte.
2. **Acopla esta función al pendiente de `Tour.region` sucio.** Hoy los 42
   activos tienen región limpia, pero el formulario puede volver a ensuciarla.
   **Esto no es solo un costo: sube la apuesta de cerrar ese formulario**, porque
   pasa a verse en el producto y no solo en una métrica de un informe.
3. **Hay que confirmar el valor real del header**, y hoy no se puede. **Por eso
   el paso 2 va antes que el 3**: sin poder ver qué manda Vercel, la C se
   escribiría sobre una lectura de la documentación en vez de sobre una medición.

## 4. Pendiente aparte, sin arreglar: "tours cerca de mí" no funciona

El POST a `/api/search` manda **solo** `{ query }`. La ciudad detectada nunca
viaja al backend, así que la búsqueda con IA no puede priorizar por cercanía
aunque el frontend ya sepa dónde está el usuario. **Se anota, no se arregla en
esta tanda.**

## 5. La poda de `docs/estado.md`

Va en la tanda del arreglo. Está en 248 líneas contra un tope de 250, y este bug
necesita su propia línea.

## El orden, y por qué es ese

1. **Unificar** (sin cambiar comportamiento). Verificable: la salida del filtro
   tiene que ser idéntica antes y después, tour por tour.
2. **Hacer visible el diagnóstico.** Habilita medir el header real.
3. **Medir el header en producción** y recién ahí elegir entre B y C con el dato
   a la vista.
4. **Aplicar la opción elegida**, más los nombres para mostrar si se va por C.
5. **Anotar** el pendiente de la búsqueda y **podar** el estado.

---

# La segunda cara: la detección se equivocó, y eso cambia el orden

*Agregado el 2026-08-19, después de que José confirmara que no usa VPN.*

## Las dos mediciones, juntas

| Dónde estaba José | Qué detectó | Qué hizo | Veredicto |
|---|---|---|---|
| **Cajamarca** | `Cajamarca` (bien) | no matcheó, cayó a Lima | **la lista era corta** |
| **Lima** | `Arequipa` (**mal**) | matcheó y mostró Arequipa | **la detección se equivocó** |

**La segunda medición salió de la máquina de José, corriendo en Lima, y da
`Arequipa` con `source: "geo"` de forma estable (repetida dos veces).** Sin VPN.

**Y esa es la peor de las dos**, porque `source: "geo"` es lo que enciende el
texto **" · cerca de ti"**. O sea que la app le decía a José, con confianza:

> **Tours en Arequipa · cerca de ti**

estando él en Lima. **No es que no supiera: es que afirmó, y se equivocó.**

## Lo que NO se puede concluir, y hay que decirlo

**Dos casos no miden una tasa de error.** Sería exactamente el error que este
mismo repo acaba de anotar como regla (`.claude/rules/metodo.md`, punto 6): sacar
una conclusión general de un solo caso que salió como uno esperaba.

**No sabemos si la geolocalización por IP falla el 5% o el 50% de las veces en
Perú.** Lo que sabemos es que **falla**, con un caso confirmado y sin VPN de por
medio.

## Y no hace falta saber la tasa, porque la asimetría ya decide

| | Qué gana el viajero | Qué pierde |
|---|---|---|
| **Detección correcta** | se ahorra **un toque** en el selector | nada |
| **Detección incorrecta** | nada | ve **el catálogo equivocado**, con un sello que dice que estamos seguros |

**El premio por acertar es un toque. El costo de errar es mandarlo a otra ciudad
y decirle que es la suya.** Con esa asimetría, la decisión no depende de la tasa:
aunque acertara el 90% de las veces, seguiría sin convenir afirmar.

**La detección por IP no se arregla con código nuestro.** Se deja de afirmar, o
se pregunta.

## El tratamiento propuesto para la interfaz, en tres niveles

### Nivel 1: sacar " · cerca de ti"

**Es la única frase donde la app dice saber dónde está el viajero**, y es la que
estaba mintiendo. Sacarla no cuesta nada y no se pierde ninguna función: la
ciudad elegida se sigue viendo en el título y en el selector.

### Nivel 2: el encabezado deja de afirmar

Hoy "Tours en Lima" es una **afirmación sobre el viajero**. Pasa a ser una
**etiqueta de lo que está mirando**, con el selector al lado como el control que
lo cambia. La ciudad deja de ser "dónde estás" y pasa a ser "qué estás viendo",
que es lo único que la app puede sostener.

### Nivel 3: preguntar la primera vez, y no volver a adivinar

En la primera visita, en vez de adivinar en silencio, **una fila de ciudades con
la sugerencia ya resaltada**. Un toque y listo. La elección se recuerda
(`localStorage`, con el precedente que ya existe para las notificaciones vistas y
el borrador del checkout).

**Qué cuesta:** algo de fricción en la primera carga del inicio. Se mitiga
haciéndolo **en línea y no en un modal**, con la sugerencia preseleccionada, para
que el que no quiera elegir simplemente siga scrolleando.

**Qué resuelve, y es lo que ningún arreglo de código resuelve:** el viajero que
está en un lugar que la IP reporta mal deja de depender de que nosotros
acertemos.

## Sobre invertir el orden: sí, y hay un argumento que no es solo de prioridad

**La C empeora el costo de una detección equivocada.** Hoy, cuando la detección
falla, el viajero aterriza en Lima: el catálogo más grande, el destino menos
sorprendente, y la equivocación pasa desapercibida.

**Con la C, una detección equivocada puede aterrizar en "Loreto" y mostrar UN
tour.** Y el viajero, que además leyó "cerca de ti", concluye que eso es todo lo
que Finde tiene cerca suyo. **Mejorar la lista sin sacar la afirmación hace que
el error, cuando pase, sea más caro y más creíble.**

Por eso el orden pasa a ser:

1. **Dejar de afirmar** (niveles 1 y 2). Es chico y quita una mentira que ya
   ocurrió, medida.
2. **La C**, que sigue valiendo por sí sola: 7 tours invisibles, 5 de la única
   agencia real, es un problema independiente de la precisión de la detección.
3. **Preguntar la primera vez** (nivel 3), que es lo que de verdad reemplaza a la
   adivinanza, y que conviene hacer **después** de la C, porque recién ahí la
   lista de ciudades para elegir cubre el país.
