# Decisiones

> Solo se agrega, nunca se borra. Una entrada por decisión de peso.
> Formato: fecha, qué se decidió, qué se descartó, por qué, y qué consecuencia trae.
> Las consecuencias se corrigen cuando el código las contradice, pero la decisión no se toca.

---

## 2026-08-18 - La caja de las tarjetas se queda, y la premisa que la cuestionaba era falsa

**Qué se decidió.** **No se saca la caja blanca de las tarjetas de tour** (`.tc`
del carrusel y `.gc` de la grilla). Se difiere sin fecha.

**De dónde salía la pregunta.** Airbnb, Booking y GetYourGuide no usan caja: foto
con esquinas redondeadas y texto suelto sobre el fondo. **Eso es correcto y está
verificado.** El argumento para copiarlos era que la caja le costaba columnas a
Finde: cuatro tarjetas por fila donde ellos meten seis.

**Ese argumento es falso, y por eso se anota la decisión.** Medido a 1440 el
2026-08-18:

| Sitio | Tarjetas por fila | Ancho de tarjeta |
|---|---|---|
| Airbnb | 8 | 180px |
| **GetYourGuide** | **4** | 284px |
| **Finde** | **4** | 232px |

**GetYourGuide muestra las mismas cuatro que Finde.** Airbnb muestra ocho porque
usa los 1440px completos con tarjetas angostas, mientras la grilla de Finde vive
en un contenedor de **1000px**. **Lo que limita las columnas es el ancho del
contenedor, no la caja: sacarla libera 2px por tarjeta**, los dos bordes de 1px.

**Y a cambio de esos 2px hay que reponer cuatro cosas que la caja sostiene:**

1. **El redondeo de la foto.** `.tc-img` y `.gc-img` tienen `border-radius: 0`:
   las esquinas salen del `overflow:hidden` de la caja. Sin caja, foto cuadrada.
2. **Todo el hover.** Hoy la caja sube, cambia de sombra y de color de borde. Sin
   caja hay que inventar otra señal, y **eso es trabajo de interacción, que es el
   más caro de los cuatro**.
3. **El padding del texto** (14px en el carrusel, 10px en la grilla), que hay que
   rehacer para que el texto quede al ras de la foto.
4. **El contraste de la fila de metadatos.** Ese gris pasa de 4,76 sobre blanco a
   **4,55** sobre el fondo de la página: sigue cumpliendo AA, pero por 0,05, o sea
   que el margen desaparece y habría que subirlo a `--gy-strong`.

**Lo que NO es un motivo para conservarla, para no defenderla con un argumento
malo:** la separación visual. El blanco de la tarjeta contra el `#FAFAF7` de la
página es un 2% de luminancia, así que **la caja casi no se ve hoy**.

**Consecuencia.** Si alguien reabre esto, que no sea con el argumento de las
columnas. **La pregunta de las columnas es otra, es más barata y quedó anotada
aparte** en `docs/pendientes-producto.md`: el contenedor de 1000px.

---

## 2026-08-18 - Los títulos de sección bajan a 20/22, y el que estaba mal era el de la tarjeta

**Qué se decidió.** En la Fase 6, **`--fs-d2` va a 20 en móvil y 22 en
escritorio** (no 23/28), **junto con subir el título de tarjeta `.gc-t` a 15px**,
que esa misma fase ya tenía planeado. **Las dos cosas van juntas o no van.**

**Qué se descartó.** Bajar solo el título de sección, que era la lectura obvia
del síntoma.

**Por qué, y este es el punto que hay que recordar.** José reportó que los
títulos de sección se veían grandes. **Notó algo real, pero la causa es la
contraria.** Medido contra los tres referentes el 2026-08-18:

| Sitio | 412px | 1440px |
|---|---|---|
| Airbnb | 18 / 13 = 1,38 | 20 / 13 = 1,54 |
| Booking | 20 / 16 = 1,25 | 24 / 16 = 1,50 |
| GetYourGuide | 24 / 18 = 1,33 | 24 / 18 = 1,33 |
| Finde, grilla | 19 / 13 = **1,46** | 23 / 14 = **1,64** |

**En móvil el título de sección de Finde está en el promedio de la categoría**:
19px contra 18 de Airbnb y 20 de Booking. **El que está fuera de rango es el
título de tarjeta: 13px, contra 16 y 18.** Lo que se percibe como "el título de
sección grande" es la distancia entre los dos.

**Bajar el título de sección, que era la corrección obvia, habría empeorado la
jerarquía**: habría achicado todo en vez de arreglar la relación.

Con `--fs-d2` en 20/22 y `.gc-t` en 15px la relación queda en **1,33 y 1,47**,
adentro de la banda de 1,25 a 1,54 de los tres referentes.

**Consecuencias.**

1. **La tabla de la Fase 6 en `docs/plans/` ya está corregida**, con el porqué al
   lado, porque tal como estaba escrita (23/28 con la tarjeta en 15) daba **1,87
   en escritorio**, más afuera que hoy. Aplicarla sin corregir habría empeorado
   justo lo que esa fase existe para arreglar.
2. **Nada de esto está aplicado todavía**: va con la Fase 6.
3. **Lección de método:** una queja sobre un elemento no dice cuál elemento está
   mal. Lo dice la relación entre los dos, y para medirla hace falta una
   referencia externa. Sin los tres referentes, este cambio se hacía al revés.

---

## 2026-08-18 - El producto va sin serif: Plus Jakarta Sans en todo, salvo el logo

**Qué se decidió.** **Plus Jakarta Sans en toda la interfaz del producto, con
títulos en 700. Cero serif, con una sola excepción: el logo, que se queda en DM
Serif Display.** Es la variante "b" de la investigación del 2026-08-18.

**Qué se descartó, y por qué cada una:**

- **Seguir como estaba** (DM Serif en el hero, en el título del tour y en **cada**
  título de sección). Es la combinación por defecto de las plantillas generadas
  por IA, que es justamente el diagnóstico del punto 1 de
  `docs/audits/2026-08-16-identidad-visual.md`.
- **Inter en todo.** No compra nada: Jakarta ya es un sans humanista de la misma
  familia que Cereal de Airbnb y es más distintiva que Inter. Encima pesa 20,7 kB
  más y obliga a revisar las nueve filas de la escala.
- **Serif solo en el hero y el título del tour** (la variante "d"). **Era la
  recomendada por el análisis** y se descartó a conciencia: ver el camino de
  vuelta al final de esta entrada.
- **Fraunces.** Sigue siendo serif en los mismos lugares, o sea que no toca el
  diagnóstico, y cuesta +49,8 kB (+113%).
- **Instrument Serif ni se probó.** Está reemplazando a DM Serif como la fuente
  por defecto de las plantillas de IA: mudarse ahí es el mismo problema un año
  más tarde.

### El criterio que la elige es la categoría, NO el costo

**Esto es lo importante de esta entrada y por eso va antes que los números.**

Ningún marketplace de viajes grande usa serif display en la interfaz: Airbnb
(Cereal), Booking (Avenir Next más Roboto), GetYourGuide, y Stripe, Linear y
GitHub con Inter. **Varios tienen logotipo en una fuente distinta a la de su
producto**, o sea que "el logo como excepción" no es una concesión: es lo que
hace la categoría.

El motivo de fondo es estructural: en un marketplace **las fotos ponen la
personalidad y la tipografía se corre a un lado**. Serif de títulos más sans de
cuerpo es una convención **editorial**, de Medium y The New Yorker, y sirve para
lectura larga. Finde es un catálogo donde la gente escanea, compara y reserva.

**El costo NO decidió, y no podía: dejó de separar a las opciones en las dos
direcciones.** b) ahorra 16 kB sobre una página de 233 kB, un 7%, y ese ahorro
además sale gratis el día del switch (más abajo). Para dimensionarlo: las tandas
1B y 1C sacaron 11,8 MB, así que esto es el 0,14% de aquello.

### Dos argumentos de costo que se usaron y quedan RETIRADOS

Van escritos para que nadie los reviva en la próxima discusión.

1. **"El serif ya está pago por el logo, no usarlo sería desperdiciarlo."
   FALSO.** Con el logo como único uso, el import se recorta a los seis glifos de
   "finde." con el parámetro `text=` de Google Fonts y el archivo pasa de
   **17,4 kB a 1,5 kB** (medido). No se desperdicia: se deja de pagar.
2. **"La variante d no obliga a recalcular la escala y eso la hace más barata."
   Cierto pero irrelevante.** Son **2 filas de una tabla de 9**, y la Fase 6 va a
   tocar las doce pantallas de todos modos. Recalcular dos números es una hora,
   no una tanda.

### Lo que hay que recalcular en la Fase 6: dos filas, con los números

Medido a 100px en el navegador, con cada cara cargada y verificada:

| Fuente | Altura de x | Altura de mayúscula | Ancho de la misma frase |
|---|---|---|---|
| DM Serif Display 400 | 48,1 | 66,0 | referencia |
| **Plus Jakarta Sans 700** | **54,4 (+13%)** | 74,5 (+13%) | **+11%** |

**Al mismo tamaño en px, Jakarta se ve más grande.** El factor de corrección es
**48,1 / 54,4 = 0,884**, o sea que los display bajan entre 11% y 13%:

| Token | Antes (DM Serif 400) | Después (Jakarta 700) |
|---|---|---|
| `--fs-d1` | 30 mobile / 44 desktop | **26 / 39** |
| `--fs-d2` | 26 mobile / 32 desktop | **23 / 28** |

Comprobado sobre los elementos reales antes de decidir: el hero pasa de 28 a
25px en 412 y de 48 a 42px en 1440; los títulos de sección de 22 a 19 y de 26 a
23; el título del tour de 26 a 23 y de 38 a 34.

**Las otras siete filas de la escala no se tocan.** Ya eran Jakarta.

**Ojo con el ancho, que es el que rompe layouts y no el alto:** Jakarta 700 es
11% más ancha, y eso ya está anotado como el riesgo de `.gc-t` en la grilla de
390px, con su mitigación obligatoria (`-webkit-line-clamp: 2`).

### El recorte del import va el DÍA DEL SWITCH, no antes

**Los 16 kB no se cobran ahora, y el motivo no es pereza: es que la hoja de
fuentes es una sola y hoy la comparte la landing.** `index.html` sirve a las dos
pantallas, y `src/Landing.jsx` usa DM Serif en el logo, el hero, los `h1` a `h4`,
los títulos de sección y una itálica. Recortar el import hoy le saca la
tipografía a finde.pe.

**Y el problema tiene fecha de vencimiento**: `src/App.jsx` decide con
`BASE_PATH`, y el día que esa constante pase a `""` **la raíz ya es el producto y
la landing deja de ser alcanzable**. O sea que ese día el recorte sale gratis.

> **Va a la checklist del switch, que pasa a tener cuatro piezas:** cambiar el
> `<link>` de `index.html` por `family=DM+Serif+Display&text=finde.`

**Lo medido sobre la alternativa, para no reabrirla:**

- **Cargar la hoja del serif desde `App.jsx` solo cuando se monta la landing:**
  funciona y **no cuesta 1 o 2 segundos como se dijo primero**. En una SPA la
  fuente no se pide al parsear el HTML sino **cuando React pinta el texto**
  (medido: la hoja llega a los 274 ms y el archivo recién a los 9,1 s). El costo
  real es **262 ms más** y la ventana con la fuente de respaldo en pantalla pasa
  de 374 ms a 584 ms. Es poco, pero es trabajo con vencimiento de semanas.
- **Dos `<link>` de la misma familia en el mismo `head`, el completo y el
  recortado, dejando que `unicode-range` decida cuál baja cada pantalla:
  PROBADO Y NO FUNCIONA.** Chrome baja **los dos** archivos (1.560 B más
  17.844 B) aunque la pantalla solo diga "finde.". Queda escrito para que nadie
  lo vuelva a intentar.

### El camino de vuelta, explícito

**El análisis recomendaba la variante d, y el argumento en contra de b sigue en
pie: el logo queda huérfano.** En b es la única pieza serif del producto y nada
le hace eco; en d el hero y el título del tour se lo hacían. Se miró con recorte
y aumento antes de decidir: **el logo aguanta** (es chico, está aislado, y el
punto terracota lo marca como marca), pero pasa de ser parte de un sistema a ser
una firma.

**Si al ver b aplicada no convence, se vuelve a d sacando dos reglas**, y esto es
literal:

> Devolver `font-family:'DM Serif Display',Georgia,serif` a **`.hero-t`** y a
> **`.det-tl`**, y devolverles su tamaño anterior. Nada más. Los otros 17
> selectores se quedan en Jakarta, que es la parte que ninguna de las dos
> variantes discute.

No hace falta revertir la tanda ni tocar la escala: `d1` y `d2` vuelven a sus
valores de DM Serif, que quedaron escritos en la tabla de arriba.

**Material para juzgarlo:** las capturas de las cinco variantes, en inicio y
ficha de tour, a 412 y 1440, más la comparación de b antes y después de corregir
el tamaño. Método y costos medidos en
`docs/audits/2026-08-18-identidad-tipografica.md`.

---

## 2026-08-18 - La región del tour se elige de una lista de 25, y la valida el backend

**Qué se decidió.** Cerrar la entrada de `Tour.region` con **tres piezas que van
juntas**:

1. **Un selector de departamento** en el formulario de tour, contra la lista
   cerrada de los **25**.
2. **La ciudad en un campo aparte**, así el backend deja de derivar la región
   partiendo un texto libre por la coma.
3. **La validación en el backend**, con un `enum` de zod contra esos 25 nombres
   dentro de `parseTourInput` (`lib/tour-input.ts`).

**Qué se descartó.**

- **Autocompletado sobre la misma lista, dejando pasar texto libre.** Paga más
  interfaz que un selector (input, filtrado, estado, teclado) y **no garantiza
  nada, porque sugiere sin obligar**. Con una lista de 25 el autocompletado no
  compra ni siquiera comodidad.
- **Separar ciudad y región en dos campos libres, sin lista.** No es una opción
  aparte: ver el primer motivo de abajo.

**Por qué esta, y son dos motivos:**

1. **El selector ya contiene a los dos campos separados, así que no son opciones
   que se sumen.** Poner una lista cerrada obliga a separar ciudad de región: no
   se puede elegir de una lista y a la vez seguir mandando `"Ciudad, Región"` en
   un solo texto. Elegir "los dos campos" como alternativa era elegir la mitad de
   esto.
2. **El selector solo protege el camino que pasa por el selector.** Es comodidad,
   no defensa: cualquier otro camino al API la esquiva. **La validación del
   backend es la que la vuelve real**, y cubre el POST y el PUT de una vez. Es la
   regla de `.claude/rules/api-y-schema.md`: la guarda va en el estado que se
   protege, no en el camino que la descubrió.

**Por qué se decide antes de implementar.** El disparador de este trabajo **no es
el switch, es el onboarding de la próxima agencia**, y ese día puede llegar sin
aviso. El razonamiento completo, con los números medidos el 2026-08-17, está en
`docs/pendientes-producto.md`. Resumido: hoy la región está casi limpia por
casualidad geográfica (los tours sin coma están en Cusco, Arequipa y Lima, donde
la ciudad y el departamento se llaman igual), y con Huaraz, Cocachimba o Los
Órganos queda mal desde el primer tour.

**Consecuencias.**

1. **No hace falta migración, y esto es un hallazgo, no una suposición.** Con la
   validación puesta, **los 2 tours con la grafía sucia de hoy (`"lima"` y
   `"lima lima"`, los dos pausados) van a fallar la próxima vez que alguien los
   edite**, y quien los edite tendrá que elegir la región de la lista. Se limpian
   solos por el camino normal del producto.
2. **Son 25 y no 24**: los 24 departamentos más la **Provincia Constitucional del
   Callao**.
3. **Las tildes tienen que entrar bien de entrada**, porque una lista cerrada mal
   escrita convierte el error en permanente: **Áncash, Apurímac, Huánuco, Junín,
   San Martín**.
4. **Al implementarlo hay que revisar la precarga al editar**, que hoy arma
   `"Ciudad, Región"` en un solo campo para el formulario.
5. **Sin fecha ni tanda asignada, y no se implementa todavía.** Lo que esta
   entrada cierra es la discusión, no el trabajo.

---

## 2026-08-15 - La URL del tour es slug más sufijo del id

**Qué se decidió.** La ruta pública de un tour es
**`/tour/<slug-del-titulo>-<sufijo-del-cuid>`**, por ejemplo
`/tour/laguna-humantay-full-day-abc123`. El slug **se deriva del título al
renderizar**; lo que resuelve la ruta es **solo el sufijo del id**.

**Qué se descartó.** Las otras dos opciones que estaban sobre la mesa:

- **CUID pelado (`/tour/cmoh8rd3t000zvpn2vn252gw0`).** Estable y sin trabajo, pero
  tira la palabra clave, que es justo lo que se comparte por WhatsApp.
- **Slug puro con columna `slug` en el schema.** Obliga a migración, a manejo de
  colisiones y a decidir qué pasa cuando una agencia edita el título.

**Por qué esta, y en este orden de peso:**

1. **No necesita columna nueva.** Cero cambios de schema, cero migración.
2. **No necesita manejo de colisiones.** El id desambigua. Dos tours con el mismo
   título conviven sin lógica extra.
3. **El título puede cambiar y la URL vieja sigue resolviendo**, porque el
   matcheo ignora la parte del slug. Si el slug recibido difiere del canónico, la
   página se autocorrige con **`rel=canonical` más `history.replaceState`**.
   **Corregido el 2026-08-16: acá decía "301" y era un error de arquitectura,
   no de redacción.** Ver la sección propia más abajo.
4. **Gana la palabra clave en la URL**, que importa para búsqueda y sobre todo
   para el link compartido por WhatsApp, donde la URL se lee antes que el preview.

**Por qué se decide ANTES de implementar.** Cambiar URLs ya indexadas cuesta
redirects para siempre. Esta entrada existe para que la tanda del router no
tenga que elegir en el momento.

**Consecuencias.**

1. **Va con el router de la tanda 2**, y se resuelve con la misma constante
   `BASE_PATH` de la decisión de abajo: la ruta es `${BASE_PATH}/tour/...`, nunca
   un literal.
2. **La canonicalización es parte del alcance, no un extra.** Sin ella, el mismo
   tour queda accesible bajo infinitas URLs y Google reparte la señal entre
   todas. **El instrumento es `rel=canonical`, no un 301**: ver abajo.
3. **Las tres definiciones que faltaban quedaron cerradas el 2026-08-16**, con
   medición sobre los datos reales. Ver la sección de abajo.
4. **El sufijo se toma del final del CUID, no del principio.** Los CUID comparten
   prefijo entre registros creados cerca en el tiempo; la entropía está al final.

---

### Las tres definiciones, cerradas el 2026-08-16 con datos

Medidas sobre los 42 tours del catálogo real y los 106 ids de `Tour`, `Booking` y
`Operator`. **Ninguna es una corazonada.**

#### 1. El sufijo son SEIS caracteres

**Lo que decide la elección es que solo los últimos 8 caracteres del CUID son
aleatorios.** Un CUID v1 son 25 caracteres con esta estructura:

```
c + timestamp(8) + contador(4) + huella de máquina(4) + aleatorio(8)
```

Medido, valores distintos de 36 posibles en cada posición contando desde el final:

| Posición | Distintos | Bloque |
|---|---|---|
| -1 a -8 | 33 a 35 | **aleatorio** |
| -9 | 22 | huella de máquina |
| -10 | 19 | huella de máquina |
| -11 | 18 | huella de máquina |
| -12 | **6** | huella de máquina |

**De ahí sale un techo duro: el sufijo NUNCA puede pasar de 8 caracteres.** Del
noveno en adelante se entra en la huella de la máquina, que es casi constante
entre registros: se agrega largo a la URL sin agregar seguridad.

Probabilidad de colisión (paradoja del cumpleaños, base36):

| Chars | 42 tours | 500 | 5.000 | Tours hasta el 1% |
|---|---|---|---|---|
| 4 | 0,051 % | 7,16 % | 99,94 % | **184** |
| 5 | 0,0014 % | 0,206 % | 18,67 % | **1.102** |
| **6** | < 0,0001 % | 0,0057 % | 0,57 % | **6.615** |
| 8 | < 0,0001 % | < 0,0001 % | 0,0004 % | 238.131 |

**Seis.** Cuatro se rompe a los 184 tours y cinco a los 1.102, dos horizontes
alcanzables si Finde funciona. Seis aguanta 6.615 y mantiene la URL corta para
WhatsApp. Ocho no se justifica: dos caracteres más en cada link a cambio de un
margen que no se va a usar.

**Con red de seguridad, que hace la elección casi irrelevante:** si al resolver
un sufijo aparece más de un tour, se desempata con el slug; si sigue ambiguo,
404. Así una colisión **degrada** en vez de **romper**.

#### 2. El tope del slug son 50 caracteres, cortando en el último guion

Normalización: minúsculas, sin tildes, ñ a n, todo lo que no sea `[a-z0-9]` a
guion, guiones colapsados y sin guiones en los bordes.

Sobre los 42 títulos reales: largo mínimo 6, mediana 37, máximo 51.

| Tope | Se cortan | Veredicto |
|---|---|---|
| 40 | **15 de 42** | pierde el destino |
| **50** | **1 de 42** | el corte es inofensivo |
| 60 | 0 de 42 | largo de más |

**El argumento que decide no es cuántos se cortan sino QUÉ se corta.** Con tope
40, en cuatro de los primeros cinco casos lo que se pierde es **el destino**, que
es justo la palabra por la que alguien busca:

```
mirador-de-yanahuara-y-centro-de     pierde  arequipa
caral-civilizacion-mas-antigua-de    pierde  america
ceremonia-de-ayahuasca-regulada-en   pierde  tarapoto
valle-sagrado-pisac-ollantaytambo-y  pierde  chinchero
```

Con tope 50 se corta uno solo y pierde `muelle`, que no cambia nada.

**Cero slugs duplicados entre sí** con cualquier tope, y de todos modos el sufijo
los desambigua.

#### 3. Slug vacío: respaldo por ciudad, y después el literal `tour`

**El slug vacío es alcanzable desde el formulario real**, no es hipotético: el
schema solo exige `title` de 3 a 120 caracteres, así que `...`, `###` o `¡¿?!`
pasan la validación y normalizan a nada.

**Y el caso que importa no es la basura: es un título en alfabeto no latino.**
`日本ツアー` y `中文标题` también normalizan a vacío, y **el quechua es promesa de
marca de Finde**: algún día puede haber contenido fuera del alfabeto latino.

Dos niveles de respaldo:

1. Slug vacío → **el slug de la ciudad** (`cusco`, `lima`, `arequipa`). El tour
   siempre tiene ciudad, y de paso conserva una palabra clave.
2. La ciudad también vacía → el literal **`tour`**.

Así la URL **nunca queda como un sufijo pelado** y siempre tiene la misma forma.

La regla de parseo que lo sostiene: **tomar todo lo que va después del último
guion**, y si no hay guion, el segmento entero. Después se valida que sean
exactamente 6 caracteres de `[a-z0-9]`; si no, 404 sin tocar la base.

---

### Por qué NO hay 301, y qué hay en su lugar

**Corregido el 2026-08-16. La versión original de esta decisión decía "301" y era
un error de arquitectura.**

**Un 301 es una respuesta HTTP, y en una SPA pura no hay servidor que la emita.**
Los `redirects` de `vercel.json` son **patrones estáticos**: no pueden conocer el
slug canónico de un tour, que sale de un dato de la base. Cuando la app arranca,
ya se sirvió el HTML y el 301 no tiene dónde ocurrir.

**Agravante medido: la tabla `Tour` no tiene columna `updatedAt`, solo
`createdAt`.** O sea que **hoy no hay forma de saber si un título cambió**, ni de
medir cuántas veces pasó, ni de guardar historia de slugs. No es que sea difícil:
el dato no existe.

**Lo que se hace en su lugar, y cuesta cero:**

1. **`rel=canonical`** apuntando a la URL canónica. Es exactamente el instrumento
   que Google define para consolidar señal entre URLs equivalentes.
2. **`history.replaceState`** al canónico cuando la app arranca, así la barra se
   autocorrige sin recargar.
3. Cuando llegue el prerender (tanda 5), el `rel=canonical` va **en el HTML
   crudo**, sin depender de que Googlebot ejecute JavaScript.

**Por qué NO se hace el 301 real, aunque se podría.** Un 301 de verdad exige una
función serverless en `/tour/*`. Eso **cuesta uno de los 12 slots de Vercel
Hobby**, y el slot que hay para liberar (`generate-quechua`) está **reservado para
Culqi**, que va a necesitar tres endpoints.

Y se gastaría a cambio de poco:

- **La URL vieja resuelve igual y muestra el tour correcto**, porque el slug no
  participa de la resolución. No hay link roto que arreglar.
- **El único daño real que evita el 301 es el contenido duplicado**, y eso es
  precisamente lo que `rel=canonical` existe para resolver.

Si algún día hay presupuesto de funciones y el contenido duplicado se vuelve un
problema medido, el 301 se agrega sin cambiar nada de lo anterior.

### Nota de rendimiento, para cuando haga falta

Resolver por sufijo es un `LIKE '%abc123'`, que **no usa índice**. Medido con 49
tours: **0,065 ms con barrido secuencial contra 0,125 ms del índice por id**, o
sea que hoy el barrido es más rápido porque la tabla entra en una página.

Crece lineal. Si alguna vez molesta, la salida es un **índice por expresión**:

```sql
CREATE INDEX ON "Tour" ((right(id, 6)));
```

**Prisma no sabe expresar índices por expresión**, así que hay que crearlo con SQL
crudo y documentarlo en `docs/migrations/`. No hace falta ahora y conviene que
quede escrito antes de que alguien lo descubra con tráfico encima.

---

## 2026-08-15 - /demo se mantiene hasta el lanzamiento, y todo se construye listo para el switch

**Qué se decidió.** El producto sigue viviendo en **finde.pe/demo** hasta el
lanzamiento oficial de Finde, que es en las **próximas semanas**. **TODO se
construye ahora**, pero preparado para que el switch de `finde.pe/demo` a
`finde.pe` sea un **cambio mínimo y reversible**.

**Qué se descartó.** Mover la raíz ahora, y también lo contrario: esperar al
lanzamiento para empezar a construir. Las dos opciones pagan el mismo costo dos
veces.

**Razón.** El día del switch no puede ser el día en que se descubre qué faltaba.
Si cada tanda deja el trabajo atado a `/demo`, el lanzamiento se convierte en una
migración; si lo deja agnóstico del prefijo, es un cambio de una constante.

**Consecuencia que ordena el trabajo, y es la parte accionable de esta entrada:**

> **Cada tanda de acá en adelante tiene que dejar el switch más cerca, no más
> lejos. Nada que haya que rehacer el día del lanzamiento.**

En concreto, y esto se revisa al cerrar cada tanda:

1. **El prefijo de las rutas es una constante, nunca un literal repetido.** Ningún
   archivo nuevo puede escribir `/demo` a mano.

   **Actualizado el 2026-08-17, y la decisión se cumplió mejor de lo que este
   texto describía.** Cuando se escribió, los dos lugares que nombraban `/demo`
   eran `src/App.jsx` (que decide Landing contra AppDemo) y los rewrites de
   `vercel.json`. La tanda 2 creó **`src/lib/routes.js`** con la constante
   `BASE_PATH`, **y `src/App.jsx` pasó a consumirla**: hoy ese archivo importa
   `BASE_PATH` y no escribe el prefijo a mano. La única mención que le queda es
   un comentario.

   **Estado real hoy: el prefijo se declara en DOS lugares.**

   | Dónde | Qué es | El día del switch |
   |---|---|---|
   | `src/lib/routes.js` (`BASE_PATH`) | La constante. Todo el código sale de acá | pasa a `""` |
   | `vercel.json` (rewrites) | Configuración de plataforma, que la constante no puede cubrir | se suma el rewrite de la raíz |

   **Esa cuenta de dos no puede crecer.** Ningún archivo nuevo escribe `/demo`:
   se importa `BASE_PATH`, o se arma el link con `toPath()` / `href()`.
2. **Todo link interno se arma con esa constante.** Un link absoluto a `/tour/x`
   funciona en la raíz y rompe bajo `/demo`; uno armado con el prefijo funciona en
   los dos.
3. **Lo que se instrumente para medir arranca antes del lanzamiento, no después.**
   Las métricas que Finde necesita para postular en 2027 se cuentan desde el día
   uno o no se cuentan.
4. **Si una tanda no puede dejar el switch más cerca, deja escrito por qué**, en
   `docs/estado.md`, para que el día del lanzamiento no aparezca de sorpresa.

**El switch, cuando toque, es reversible.** Lo que lo hace reversible es
justamente lo de arriba: si el prefijo es una constante y los rewrites cubren los
dos caminos, volver atrás es revertir el commit que cambió la constante. Si el
prefijo estuviera repartido en veinte archivos, no lo sería.

---

## 2026-08-15 - Las reservas se aceptan hasta la medianoche previa a la salida

**Qué se decidió.** El corte de ventas de la etapa piloto es la **medianoche del
día anterior a la salida**, hora de Lima. Más adelante se ajusta agencia por
agencia, según las condiciones reales de cada una.

**Lo importante: no hay nada que implementar en CUPO_FIJO, ya hace exactamente
eso.** Se verificó contra el código antes de decidir, con las funciones reales
del repo y no por deducción. `MIN_BOOKING_LEAD_DAYS = 1` se evalúa en hora Lima
(`limaDateISO`), así que la fecha mínima reservable es siempre mañana:

| Instante (hora Lima) | Reserva para el día siguiente |
|---|---|
| 23:59:59.999 del día previo | **se acepta** |
| 00:00:00 del día de la salida | rechaza |

O sea que el corte cae exactamente en la medianoche pedida. **Esta decisión
documenta el comportamiento vigente, no lo cambia.**

**Qué se descartó.** Mover `MIN_BOOKING_LEAD_DAYS`, y también extender la
evaluación de `closeTime` / `closeDaysBefore` a CUPO_FIJO ahora. Sin condiciones
reales de ninguna agencia, cualquier corte más temprano sería una restricción
inventada por nosotros: es más fácil apretar después, cuando una agencia lo pida,
que aflojar una regla que ya frustró ventas.

**Los dos modos tienen cortes distintos, y es intencional.** En SOLICITUD el
corte llega antes: `closeTime` default 20:00 del día anterior (`closeDaysBefore`
default 1), o sea cuatro horas antes que en CUPO_FIJO. No es un accidente y está
escrito en dos lugares del repo desde antes de esta decisión. `api/bookings.ts`:
"la MISMA hora de cierre que vence el plazo de la agencia cierra también la
entrada de solicitudes. Sin esto, una reserva creada pasada esa hora nace con el
plazo ya cumplido y la agencia recibe un aviso que no puede atender. En
CUPO_FIJO no aplica: no hay nada que confirmar".

El motivo de fondo: en SOLICITUD la agencia **tiene que decidir**, así que el
corte le reserva tiempo para hacerlo. En CUPO_FIJO la reserva nace confirmada y
no hay nada que esperar, así que el único límite razonable es la anticipación
mínima. **Dos modos de venta distintos con cortes distintos es coherente, no una
inconsistencia a emparejar.**

**Consecuencias.**

1. El pendiente de `docs/estado.md` sobre extender el cierre a CUPO_FIJO queda
   **subordinado a esta decisión**: no se toca hasta que una agencia real pida
   cortar antes. El cupo sigue siendo el freno de integridad; el operativo se
   agrega cuando exista la necesidad, no antes.
2. Cuando se ajuste por agencia, el instrumento ya existe y es por tour
   (`closeTime` y `closeDaysBefore` son campos de `Tour`): lo que faltaría es
   evaluarlos también en CUPO_FIJO. No hace falta schema nuevo.
3. El calendario del viajero aplica la misma regla (`minBookingISO`), así que
   frontend y backend cortan igual. La fuente de verdad es el backend, en hora
   de Lima.

## 2026-08-13 - El catálogo es contenido de validación, no tracción comercial

*(rescatada de la memoria automática, criterio original de julio 2026)*

**Decisión:** en todo material externo (pitch, onepager, postulaciones a concursos y fondos) los números del catálogo se presentan como **contenido de validación del producto**, nunca como tracción comercial. La tracción es ventas, y hoy son cero.

**Descartado:** citar el conteo de tours y agencias del PRD como prueba de tracción.

**Razón:** José firmó una Declaración Jurada de veracidad en Emprende Turismo TEC 2026, y el producto tiene la regla de no mostrar nada falso. Presentar catálogo sembrado como demanda real es exactamente lo que esa regla existe para evitar.

**Estado real al 2026-08-13** (verificado contra la DB, ver `docs/estado.md`):

- **49 tours** y **14 agencias** en la base. De las 14, **8 son del seed** (sin dueño, sin RUC, sin MINCETUR) y **6 tienen dueño real**. *(Recontado el 2026-08-17: acá decía 9 y 5. Los tours y las agencias no se movieron; lo que cambió es cuántas tienen `userId`.)*
- **0 ventas.** Etapa pre-comercial: la pasarela todavía no existe.
- **MEGATOURS es agencia piloto confirmada**, con 5 tours de Cajamarca públicos hoy en finde.pe. Es la tracción real que sí se puede contar, y la coordinación operativa con ellos sigue pendiente.
- Lo demostrable: el MVP funcional en producción, la búsqueda semántica, el quechua persistido y la verificación manual SUNAT/MINCETUR.

**Consecuencia:** **el PRD (`finde-prd-tecnico-v5.md`) no se cita para postulaciones.** Sigue afirmando "40 tours con embeddings reales" y "13 agencias (9 verificadas)" como tracción (líneas 20 y 152), y esos números están inflados en las dos puntas: son viejos y además mezclan seed con real. Los docs de pitch heredaron la misma cifra. Si hay que postular de nuevo, los números salen de `docs/estado.md`, no del PRD.

**Nota:** el agente de WhatsApp 24/7 y la verificación con IA continua se presentan siempre como próxima fase. Hoy la verificación es manual y es el proceso vigente, no una carencia.

---

## 2026-08-13 - Onboarding de agencia: decisión abierta

*(rescatada de la memoria automática; el encuadre original decía "resolver en M2" y ese milestone ya cerró sin resolverla)*

**Decisión:** ninguna todavía. Queda registrada acá porque es la única forma de que no se pierda entre tandas.

**La pregunta:** ¿dónde vive el onboarding de agencia?

Las dos opciones sobre la mesa:

1. **Donde está hoy:** la card "¿Ofreces tours?" (clase `.pf-op-card`) dentro del componente `ProfileView`. El viajero ya registrado la descubre navegando.
2. **Elegir rol viajero o agencia en el registro mismo**, antes de crear la cuenta.

**Razón para no dejarlo implícito:** conseguir agencias es el cuello de botella del marketplace. La fricción y la visibilidad de este punto de entrada son decisión de negocio, no de UI.

**Estado en el código al 2026-08-13:**

- La card del Perfil (`.pf-op-card`, en `ProfileView`) sigue siendo la única puerta.
- El enlace "¿Eres agencia de turismo?" en la pantalla de Login sigue **comentado como TODO** dentro de `LoginView`: buscar `TODO(M1 sub-paso 8)`. Se difirió en M1 y nunca se retomó.

**Por qué caducó el encuadre de M2:** M2 (persistencia de tours de la agencia) está terminado y mergeado, y la decisión nunca se tomó. Atarla a un milestone cerrado la volvía invisible. Ahora vive acá hasta que se resuelva.

---

## 2026-08-13 - Fase 1 de la búsqueda se queda con Sonnet, no baja a Haiku

*(rescatada de la memoria automática, evaluación original del 2026-08-05/06)*

**Decisión:** la fase 1 de la búsqueda en dos fases usa **Claude Sonnet 4.6**. No se migra a Haiku 4.5.

**Descartado:** Haiku 4.5, pese a ser cerca de 2 veces más rápido y 3 veces más barato.

**Razón:** se probaron las dos en paralelo y Haiku falló de forma sistemática, no ocasional. En **5 de 5 corridas** con la consulta "comida típica del norte" eligió un tour de **región equivocada y precio 10 veces mayor** (Tambopata, que es selva sur y otro rango de precio). Sonnet acertó **5 de 5**. El ahorro no compensa: la fase 1 es la que decide qué tours ve el viajero, así que un error ahí es un resultado equivocado en pantalla, no una respuesta más lenta.

**También descartado en la misma evaluación: el disparo anticipado de la fase 2 por streaming o SSE desde el servidor.** La ganancia estimada era de 300 a 800 ms, y el costo era reintroducir la complejidad de streaming que ya se había descartado antes por corromper cuids (cerca del 23% de los casos en streaming, visto también en producción). Por eso la fase 1 elige por índices 1 a 8 y no por id. Queda anotado como optimización futura **solo si el reasoning vuelve a sentirse lento**.

**Consecuencia:** el id del modelo vive en `lib/anthropic.ts` (export `MODEL`) y no se hardcodea en otro lado. Si alguna vez se reevalúa el cambio de modelo, hay que repetir la prueba de región y precio: es el caso que lo cazó.

---

## 2026-08-13 - Culqi pasa a ser feature de lanzamiento

**Decisión:** integrar Culqi desde el inicio, no como hito posterior.

**Descartado:** coordinar pagos por WhatsApp durante la etapa piloto.

**Razón:** sin pasarela hay partes del producto que quedan ocultas o a medias, y eso choca con la regla de no mostrar nada falso ni incompleto al usuario real.

**Consecuencia (verificada contra el código el 2026-08-13):** lo que hoy está oculto esperando la pasarela es:

- La pestaña **"Ingresos"** del dashboard de la agencia (bloque `.dsh-tabs` del componente `DashView`, donde quedó el comentario en lugar del marcado). El mock `EARN` que la alimentaba ya fue eliminado, así que reactivarla implica construir el cálculo real, no solo mostrar la tab.
- El stat **"Rating"** del dashboard (bloque `.dsh-sts`, mismo componente), oculto por una razón distinta: no hay modelo `Review` en la DB y los ratings del seed son siembra. No lo destraba Culqi.

**Corrección respecto de la versión anterior de esta entrada:** decía que la política de cancelación estaba oculta en la UI. **Es falso.** `getCancelPolicy` se renderiza en el flujo de reserva y en la ficha, entre otros puntos. La exigencia INDECOPI de mostrarla antes de pagar ya está cumplida y no depende de Culqi. El detalle de dónde se renderiza y qué banderas la gobiernan está en `.claude/rules/frontend.md`, que es donde se mantiene actualizado.

**Pendiente de la decisión:** el porcentaje de comisión (15% o 20%) **queda sin definir hasta la integración de Culqi**. No hace falta resolverlo antes: mientras no haya cobro, la UI no muestra ningún porcentaje. Se define al integrar.

---

## 2026-07 - Comisión única de 20% todo incluido

*(día exacto sin registrar)*

**Decisión:** comisión única del 20%, a éxito, que incluye pasarela, soporte y demanda.

**Descartado:** 15% base más SaaS y B2G como motores complementarios.

**Razón:** el 20% está en el piso del mercado (Viator 25%, GetYourGuide 20-30%, Airbnb 20%) y el modelo financiero validó que un solo motor de revenue es más sólido que tres. Bajar de 15% rompe la unidad económica.

**Consecuencia (verificada contra el código el 2026-08-13):** **no hay nada que unificar en el producto.** La UI no muestra ninguna comisión: no existen `15%`, `20%`, `0.15` ni `0.20` en `src/`, `api/` ni `lib/`. La etapa piloto va sin comisión, con link directo a WhatsApp. El único lugar que afirmaba 15% era el `CLAUDE.md` viejo, ya reescrito.

**El número final queda pendiente hasta la integración de Culqi.** El 20% es la referencia que salió del modelo financiero, pero no está cerrado y no hay que cerrarlo ahora: mientras no haya cobro, la UI no muestra ningún porcentaje y nada depende de esto. Se define al integrar la pasarela, y recién ahí aparece en el producto.

La entrada anterior decía "el CLAUDE.md y la UI todavía mencionan 15%, hay que unificar"; eso ya no describe el estado del repo.

---

## 2026-07 - Custodia total de fondos

*(día exacto sin registrar)*

**Decisión:** el viajero paga el 100% a Finde; se libera a la agencia al completarse el tour.

**Descartado:** modelo de señal o adelanto. PagoEfectivo eliminado por contradecir la trazabilidad.

**Razón:** protege ambos lados y da poder de mediación en disputas.

**Consecuencia:** la custodia no depende del gateway. El gateway solo cobra; la retención y la liberación post-tour las maneja Finde. Nada de esto está implementado todavía: `Booking.status` se queda en `pending_payment` de forma indefinida.

---

## Terminología: agencias, no operadores

*(fecha sin registrar)*

**Decisión:** el lado oferta se llama "agencias" en todo el producto y la documentación (vocabulario MINCETUR y SUNAT).

**Consecuencia:** en el código persisten `Operator`, `/api/operators`, `requireOperator`, `Operator.userId`. Es deuda de nomenclatura interna aceptada. La regla aplica solo a copy visible.

---

## Identidad visible de la agencia como diferenciador

*(fecha sin registrar)*

**Decisión:** el viajero siempre ve qué agencia opera el tour.

**Descartado:** estrategia white-label estilo Tur.com.

**Razón:** la confianza verificada es el producto. Tur.com opera en Perú como entidad extranjera sin RUC local, y las agencias exponen su RUC mientras la plataforma se queda con el margen y la marca. Ese es el argumento de venta.

**Matiz:** se bloquean los datos de contacto (no la identidad) hasta que la reserva esté confirmada, patrón Airbnb, para evitar desintermediación.

**Consecuencia en el código:** `gateOperatorMincetur` (`lib/tour-select.ts`) implementa la parte visible de esto: el número de MINCETUR de la agencia se muestra al público solo si `Operator.verified` es true, y siempre en el dashboard propio de la agencia.

**Tensión, actualizada el 2026-08-17.** *(La versión anterior decía "hay 8 agencias del seed con `verified: true` sin RUC ni MINCETUR cargados". Eso se cerró el 2026-08-16 y quedó sin corregir hasta la auditoría de coherencia. La decisión no cambia; cambia su consecuencia.)*

- **El sello falso ya se limpió** (`38823ed`, ver `docs/historia/2026-08-sello-verificacion.md`). Hoy hay **2 agencias verificadas** sobre 14, no 9.
- **La única con el sello ganado de verdad es MEGATOURS.** La otra es `demo@finde.pe`, la cuenta de demos, que conserva `verified: true` y un MINCETUR inventado (`"REG12345"`). No se ve porque sus tours están pausados, no porque algo lo impida: **está en la checklist de `docs/estado.md` como ítem propio.**
- **Lo que sigue sin respaldo técnico es el proceso, y es a propósito.** El código solo valida que el RUC tenga 11 dígitos; la verificación contra SUNAT y MINCETUR la hace José a mano y **es el proceso vigente, no una carencia** (ver `CLAUDE.md`). La tensión real no es que falte automatización: es que **`verified` es un booleano que se escribe a mano y nada en el código impide escribirlo mal**. Por eso el control es la checklist, no una validación.

---

## La etiqueta de escasez del calendario se queda en la celda, con el texto corto

*2026-08-18*

**Decisión:** el aviso de cupos bajos sigue **dentro de la celda** del
calendario. Lo que cambia es el texto: **"Último cupo" pasa a "1 cupo"**, y el
tamaño sube de 8 a **8,5px**.

**Descartados, los dos medidos en pantalla y no discutidos:**

1. **El punto de color en la celda.** Era la opción anotada en `docs/estado.md`
   antes de mirarla. Se montaron las dos variantes a 390 y 412: sin elegir, el
   punto no aporta nada sobre el tinte, el borde y el número que la celda ya
   tiene en terracota; y **con la fecha ya elegida la celda se llena de terracota
   sólido y el punto terracota desaparece**. O sea que falla en el estado donde
   más importaría. Sostenerlo obliga a invertirlo a blanco, una regla condicional
   de color para algo que en el estado normal ya era redundante.
2. **Sacar el texto de la celda**, compensándolo con una leyenda dentro de la
   tarjeta y un `aria-label`. **Se construyó, se verificó (198 celdas comparadas,
   0 movidas) y se revirtió** en el mismo día: resolvía el desborde, pero a
   cambio de tres piezas nuevas donde alcanzaba con acortar una palabra.

**Razón del camino elegido:** el desborde lo causaba el largo del texto, no el
tamaño. "Último cupo" mide **47,31px a 8px**, y desborda en **los cuatro anchos
probados**, incluso en 412 donde solo hay 43,42px. "3 cupos" mide 32,53px a
8,5px. El problema era de 11 caracteres, no de tipografía.

**Consecuencia en el código:** una sola línea del `data-low-label` de
`MonthCalendar` (`src/AppDemo.jsx`). Las variantes de ese texto son exactamente
tres, porque el valor está acotado a 1..3 por la condición de la celda y por
`computeAvailability` (`api/tours/[id].ts`): "1 cupo", "2 cupos", "3 cupos".

**El dato que hay que llevarse, y que vale más que la decisión: esta etiqueta no
puede cumplir el piso de 12px de la escala tipográfica.** Medido con la fuente
real, en el ancho de la celda de cada viewport:

| Ancho | Celda | Disponible | "3 cupos" a 8,5px | a 9px | a 12px |
|---|---|---|---|---|---|
| 360 | 38px | **36px** | 32,53 (entra) | 34,45 (entra) | 45,92 (desborda) |
| 390 | 42,3px | 40,28px | 32,53 | 34,45 | 45,92 (desborda) |
| 412 | 45,4px | 43,42px | 32,53 | 34,45 | 45,92 (desborda) |

**El techo es 9px** (a 9,5 ya desborda en 360). Se aplicó **8,5** y no 9 por una
medición concreta: si Plus Jakarta Sans no llegó a cargar todavía, el respaldo
`system-ui` mide **36,95px a 9px** contra los 36 disponibles, o sea que **9px
desborda durante el FOUT**, que es exactamente el defecto que esto viene a
arreglar. A 8,5px el respaldo mide 35,11 y entra.

**Ajuste posterior del mismo día, y destapó un defecto que nadie había visto.**
La etiqueta quedaba pegada al número y abajo sobraba espacio. Al medirlo apareció
la causa real: número y etiqueta vivían dentro de un mismo `flex column` que se
centraba **como una sola pieza**, así que en las celdas con cupo bajo el número
quedaba **4,46px más arriba** que en las celdas normales. En una fila de siete
días eso se ve. La etiqueta pasó a `position: absolute` anclada al fondo de la
celda, o sea que ya no participa del centrado: **la desalineación del número
contra una celda sin etiqueta pasó de 4,46px a 0** a 360, 390 y 412, y la
etiqueta ocupa los 9,72px que estaban muertos abajo.

**Para el barrido del piso de 12px de la Fase 6B esto es una excepción medida:**
el piso no se puede cumplir acá sin sacar el texto de la celda, que es lo que se
revirtió. Queda para decidir cuando se ejecute ese barrido.

---

## La tarjeta del calendario tiene un tope de 372px en escritorio

*2026-08-18*

**Decisión:** la tarjeta de `MonthCalendar` lleva `maxWidth: 372`, en **los dos
calendarios**, el de reservar y el del paso 3 del formulario de tour.

**El problema, medido antes de tocar nada.** La celda es cuadrada
(`aspectRatio: 1`) y se estira con la tarjeta, pero el número (13px) y la
etiqueta (8,5px) son fijos. Entonces:

| Ancho | Tarjeta | Celda | Aire arriba del número | Hueco número → etiqueta |
|---|---|---|---|---|
| 390 | 350 | 42,28 × 44 | 13 | **1,08** |
| 412 | 372 | 45,42 × 45,42 | 13,7 | 1,8 |
| 768 | 516 | 66 × 66 | 24 | 12,08 |
| 1024 y 1440 | 560 | 72,28 × 72,28 | 27,14 | **15,22** |

El contenido pasa de llenar el **59%** del alto de la celda a llenar el **35%**,
y el hueco entre el número y la etiqueta se multiplica por **14**. En el
calendario del formulario es peor, porque solo tiene el número: del 38% al
**23%**.

**Por qué 372 y no otro.** Deja la celda en 45,42px, que es exactamente la de un
móvil de 412: compacta pero un poco más holgada que la de 390. Y en móvil el tope
**no puede aplicar**, porque la tarjeta ya mide 350 a 390 y 372 a 412.

**Descartadas, las dos medidas:**

- **Escalar el número y la etiqueta con la celda** (factor 1,67: número a 21,75px
  y etiqueta a 14,22px). Restaura la proporción exacta y de paso la etiqueta
  superaría el piso de 12px, pero el número de día queda más grande que varios
  títulos del producto y **no deja el escritorio igual al móvil, lo deja como un
  calendario más grande**. Además los tamaños son estilos inline, que no aceptan
  media queries.
- **Que la celda deje de ser cuadrada arriba de un breakpoint.** Simulada a 1024
  con alto fijo de 48: la grilla NO se rompe (7 columnas, todas las celdas de 48,
  filas separadas 52, los 11 huecos vacíos estiran solos). Pero arregla el aire
  vertical y **deja el horizontal intacto**: la celda sigue midiendo 72px de
  ancho para un número de 13px.

**Va en los dos calendarios a propósito:** no hay motivo para que la agencia vea
un calendario peor que el viajero, y mantenerlos iguales evita que dentro de seis
meses alguien arregle uno y se olvide del otro.

**Verificación:** volcado de rectángulos a 390, 412, 768, 1024 y 1440, sobre los
dos calendarios. **A 390 y 412: 0 celdas movidas de 33, en los dos.** De 768 para
arriba se mueven 32 de 33, que es el cambio buscado, y la única que no se mueve
es la flecha de mes anterior, que vive en el padding de la tarjeta. La celda
queda en **45,42 × 45,42 a 768, 1024 y 1440**, igual que en 412.

**Y de acá salió el porqué de `minWidth: 0`, que ahora está comentado en el
código.** `minHeight: 44` junto con `aspectRatio: 1` le transfiere a la celda un
**ancho mínimo de 44px** a través de la relación de aspecto. Con siete columnas
eso son 308px de mínimo más los gaps, más de lo que entra en la tarjeta a 390: la
grilla desborda y los domingos se salen. Pasó de verdad en la Fase 2, cuando la
celda subió de 36 a 44 de alto. `minWidth: 0` es lo que corta esa transferencia.
**Parece innecesario justamente porque funciona**, y por eso el comentario está
al lado de la propiedad y no en un documento.
