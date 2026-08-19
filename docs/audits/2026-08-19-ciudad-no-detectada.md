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

**Y el endpoint funciona.** Contra producción, desde una máquina en Arequipa:

```
GET https://www.finde.pe/api/geo
{"city":"Arequipa","country":"PE","source":"geo"}
```

O sea que el mecanismo está bien: detecta, mapea y responde. Solo que para
Cajamarca no tiene a dónde mapear.

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
