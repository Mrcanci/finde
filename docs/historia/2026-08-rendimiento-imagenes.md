# El peso de las imágenes

> **Historia, no estado.** Es el registro de trabajo **ya cerrado y en `main`**.
> Se archivó acá el 2026-08-16 al podar `docs/estado.md`, que había llegado a
> 1.767 líneas y se leía entero al empezar cada sesión.
>
> **El estado actual del proyecto vive en `docs/estado.md`.** Este archivo se lee
> solo cuando hace falta reconstruir por qué algo se hizo como se hizo.

### Tanda 1B, CERRADA: los 6,1 MB que se descargaban y nadie veía

**En `main` desde el 2026-08-16 (`d916e65`), post-QA.** José la validó en
dev.finde.pe **junto con la 1C**, que es como correspondía: las dos tocan las
mismas imágenes desde puntas distintas.

> **El QA anterior quedó anulado y se rehízo.** El primer "QA OK" se dio sobre
> `dev` **sin** esta rama mergeada, así que lo que se había probado era el estado
> anterior. Se detectó antes de subir nada a `main`. **Vale como regla: un QA sobre
> `dev` solo cubre lo que está EN `dev`.**

**Sale directo de medir la tanda 1.** Es más importante que todo lo que había
anotado de rendimiento: **6.130 kB contra los 184 kB del bundle**, que era el
pendiente que figuraba.

**El arreglo, en `src/App.jsx`:** la URL se lee **durante el render** en vez de en
un `useEffect`, así `<Landing />` no se monta nunca cuando la URL es `/demo`. Se
fueron el `useState` y el `useEffect`; queda una función `isDemoUrl()` y un
ternario. **`Landing.jsx` no se tocó.**

**El warning de ESLint desapareció**, que era la verificación pedida:
`react-hooks/set-state-in-effect` ya no aparece y `src/App.jsx` salió entero del
reporte. De 4 problemas a 3, todos preexistentes.

#### Medición, mismo método que la tanda 1

Lighthouse 12.8.2, preset mobile (1638 Kbps, 150 ms de RTT, CPU 4x más lenta).
**Seis corridas válidas por lado**, con flags anti-throttling de Chrome que
eliminaron los `NO_FCP` que ensuciaban las primeras tandas.

| Métrica | Antes | Después | Delta |
|---|---|---|---|
| **Bytes transferidos** | 6.528.216 | **232.992** | **-6.295.224 (-96,4%)** |
| Peticiones | 21 | 13 | -8 |
| Imágenes de la landing | 7 (6.130 kB) | **0** | todas |
| LCP | 5.859 a 12.531 ms | **3.510 a 3.615 ms** | estable en 3,6 s |
| TTI | 6.204 a 12.853 ms | **3.510 a 3.615 ms** | estable en 3,6 s |
| Score de rendimiento | 70 a 77 | **87 a 89** | +13 |
| Total Blocking Time | 0 ms | 0 ms | sin cambio |

**El LCP no solo baja: deja de ser bimodal.** Antes saltaba entre ~5,9 s y ~12,5 s
según cómo cayera la carrera por el ancho de banda con la imagen de 4,3 MB;
ahora las seis corridas caen dentro de **105 ms entre sí**. Un producto que a
veces tarda el doble es peor que uno lento y predecible.

El elemento LCP es el mismo en los dos casos: la pantalla de carga con el
logotipo. O sea que esos 6,1 MB **retrasaban el primer dibujo de la app misma**,
no solo el de una foto que nadie mira.

### El análisis de las imágenes de la landing, que dio origen a la tanda 1C

> **Esta sección quedó como el diagnóstico. La ejecución está en "Tanda 1C, HECHA
> el 2026-08-16" más abajo, con los números finales.** Se conserva porque explica
> cómo se eligió la opción, no solo cuál se eligió.

**El arreglo de la tanda 1B no tocaba este problema.** `finde.pe`, que es lo que
Google indexa, seguía descargando lo mismo: medido, **6.526.560 bytes y un LCP de
entre 5,6 y 12,8 segundos**. La tanda 1C lo bajó a **976.569 bytes**.

#### Las nueve imágenes

| Archivo | Peso | Dimensiones | ¿Se usa? |
|---|---|---|---|
| `oxapampa.jpg` | **4.287 kB** | 5184x3456 | sí |
| `arequipa.jpg` | 825 kB | 2560x1674 | **no, huérfana** |
| `rajuntay.jpg` | 565 kB | 1920x1440 | sí |
| `paracas.jpg` | 425 kB | 1920x1280 | sí |
| `kuelap.jpg` | 357 kB | 1920x1080 | sí |
| `colca.jpg` | 227 kB | 1920x1080 | sí |
| `mancora.jpg` | 152 kB | 1200x675 | **no, huérfana** |
| `chachapoyas.jpg` | 83 kB | 540x360 | sí |
| `cusco.jpg` | 34 kB | 330x220 | **no, huérfana** |

Más tres mockups PNG: 433 kB en total, de los que solo uno carga al inicio.

**Tres archivos no los referencia nadie** (`arequipa`, `cusco`, `mancora`): son
**1.011 kB muertos en el repo**. Borrarlos no ahorra ni un byte al usuario, porque
nunca se descargaban, pero limpia el repositorio y no toca `Landing.jsx`.

**El dato que ordena todo:** la tarjeta de destino se renderiza a **179x119 píxeles
CSS** en móvil. `oxapampa.jpg` mide 5184x3456. Lighthouse calcula que el
**99,6% de esos 4,3 MB es desperdicio puro**.

#### Las cuatro opciones, con ahorro MEDIDO

Los tres primeros números salen de los audits de Lighthouse sobre la landing real;
el cuarto, de recomprimir los archivos de verdad con `cwebp` y `ffmpeg`.

| Opción | Ahorro | Veredicto |
|---|---|---|
| **Carga diferida** de lo que está bajo el pliegue | **0 kB** | **Ya está hecha.** `loading="lazy"` está puesto en `Landing.jsx:199` y `:462`, y el audit `offscreen-images` da 0. No hay nada que ganar |
| **Recomprimir** sin cambiar resolución | **9 kB** | **Inútil.** Los JPEG ya están razonablemente comprimidos: el problema no es la calidad, es el tamaño |
| **Convertir a WebP** sin cambiar resolución | **1.945 kB** | Ayuda, pero es el premio chico |
| **Servir el tamaño real** (redimensionar) | **5.995 kB** | **Es el 90% del problema.** Gana por lejos |

**Experimento propio, sobre los 6 destinos que sí se usan:**

| Variante | Peso total | Ahorro |
|---|---|---|
| Como están hoy | 5.946 kB | |
| Redimensionadas a 800 px, **siguen siendo JPEG** | **566 kB** | **5.380 kB (90,5%)** |
| Redimensionadas a 800 px y pasadas a WebP | 460 kB | 5.485 kB (92,2%) |
| Redimensionadas a 1200 px y pasadas a WebP | 909 kB | 5.037 kB (84,7%) |

#### La recomendación que se ejecutó, y por qué no hizo falta autorización

**El 90,5% del ahorro se conseguía sin tocar una línea de `Landing.jsx`:**
**reemplazar los archivos en `public/destinations/` por versiones redimensionadas
a 800 px, con el mismo nombre y la misma extensión `.jpg`**. El JSX sigue
apuntando a las mismas rutas y no se entera. **Es lo que hizo la tanda 1C.**

WebP suma apenas **106 kB más** sobre eso, y `srcset` por tamaño de pantalla suma
todavía menos. Las dos **sí exigirían tocar `Landing.jsx`** (cambia la extensión
del `src`, o hace falta un `<picture>`), y ninguna justifica el permiso por 106 kB.
**Si algún día se abre `Landing.jsx` por otro motivo, se aprovecha el viaje.**

Las dos verificaciones que se exigieron antes de reemplazar, y cómo se cerraron:

1. **Los 179x119 px eran la medición en móvil.** Se midió también en escritorio
   antes de fijar los 800 px: **193x129 px CSS** con viewport de 1350, casi
   idéntico. Con eso, 800 px cubre hasta 4x de densidad de pantalla.
2. **Reemplazar los archivos cambia lo que se ve.** Se armó una comparación de las
   seis, antes y después, a 450 px de ancho (más del doble del tamaño real), y se
   le pasó a José antes de commitear.

**Los mockups son un caso aparte y más chico:** 433 kB que bajan a 256 kB en WebP,
pero eso sí exige tocar el JSX y solo uno de los tres carga al inicio. No vale el
permiso hoy.

### Tanda 1C, CERRADA: las imágenes de la landing

**En `main` desde el 2026-08-16 (`5575328`), post-QA**, validada junto con la 1B.

**Cero líneas de código. `Landing.jsx` intacto.** Se reemplazaron los archivos de
`public/destinations/` por versiones a **800 px de ancho máximo**, con el mismo
nombre y la misma extensión `.jpg`, así que el JSX no se entera.

| Archivo | Antes | Después | |
|---|---|---|---|
| `oxapampa.jpg` | 4.287 kB (5184x3456) | **116 kB** (800x534) | -97,3% |
| `rajuntay.jpg` | 565 kB (1920x1440) | **76 kB** (800x600) | -86,5% |
| `paracas.jpg` | 425 kB (1920x1280) | **53 kB** (800x534) | -87,5% |
| `kuelap.jpg` | 357 kB (1920x1080) | **118 kB** (800x450) | -66,8% |
| `colca.jpg` | 227 kB (1920x1080) | **93 kB** (800x450) | -58,8% |
| `chachapoyas.jpg` | 83 kB (540x360) | **68 kB** (540x360) | -18,6% |
| **Total** | **5.946 kB** | **526 kB** | **-91,1%** |

**Por qué 800 px, medido y no elegido a ojo:** la tarjeta de destino se renderiza
a **193x129 px CSS en escritorio** (viewport de 1350) y a **179x119 en móvil**. Es
casi el mismo tamaño en los dos. 800 px cubre hasta **4x de densidad de pantalla**,
más margen del que existe hoy en el mercado.

**`chachapoyas.jpg` no se redimensionó, solo se recomprimió**: ya medía 540 px, por
debajo del tope. La regla aplicada fue **nunca agrandar**, porque escalar hacia
arriba una imagen chica la hace más pesada sin mejorarla (comprobado: llevarla a
800 la subía de 83 a 108 kB).

**Efecto sobre la landing entera**, que es la página que Google indexa, medido con
Lighthouse mobile (4G, CPU 4x):

| Métrica | Antes | Después | Delta |
|---|---|---|---|
| **Bytes transferidos** | 6.526.560 | **976.569** | **-5.549.991 (-85%)** |
| LCP | 5.634 a 12.756 ms | **4.289 a 5.186 ms** | |
| TTI | 5.852 a 13.086 ms | **4.432 a 5.269 ms** | |
| Score de rendimiento | 72 a 77 | **78 a 84** | |

**El LCP también deja de ser bimodal acá**: de 7.122 ms de dispersión entre
corridas a 897 ms.

**Qué NO se tocó, y por qué:**

- **Los tres archivos huérfanos** (`arequipa.jpg` 825 kB, `mancora.jpg` 152 kB,
  `cusco.jpg` 34 kB) no los referencia nadie. **No cuestan ancho de banda porque
  nunca se descargan**, solo peso de repositorio. Borrarlos es decisión aparte.
- **Los mockups PNG** (436 kB, de los que solo uno carga al inicio). Se intentó:
  mejorarlos sin cambiar de formato exige un optimizador de PNG que no está
  instalado (`pngquant`, `optipng`), y con lo que hay (`ffmpeg`) salían **entre
  53% y 131% más pesados**. Pasarlos a WebP sí los achicaría, pero **exige tocar
  `Landing.jsx`**. Queda para cuando haya un motivo para abrir ese archivo.
- **WebP en los destinos.** Ahorraría unos 66 kB más sobre los 526, y cambia la
  extensión del `src`, o sea `Landing.jsx`. No justifica el permiso.

**Las cuatro opciones que se evaluaron antes de elegir**, con el ahorro que
calculó Lighthouse sobre la landing real:

| Opción | Ahorro | Veredicto |
|---|---|---|
| Carga diferida bajo el pliegue | **0 kB** | Ya estaba hecha (`loading="lazy"`), el audit `offscreen-images` daba 0 |
| Recomprimir sin cambiar resolución | **9 kB** | Inútil: el problema no era la calidad |
| Convertir a WebP sin redimensionar | 1.945 kB | El premio chico |
| **Servir el tamaño real** | **5.995 kB** | **Es el 90% del problema. Lo que se hizo** |

Textos con fecha de vencimiento (se van a borrar solos, no invertir en ellos):

- `src/AppDemo.jsx:5818`, el mensaje "Inicia sesión o regístrate para reservar tu tour". Aparece cuando alguien intenta reservar sin sesión. **Ese string desaparece entero cuando se implemente reserva como invitado**, porque no va a haber gate que mostrar. Se corrigió el copy (decía "experiencia") pero no vale la pena traducirlo, testearlo ni pulirlo más.

## Procesar las fotos, RESUELTO. Era la condición para que la plataforma funcione con tráfico

> **CERRADO y en `main` desde el 2026-08-16 (`62a1d1a`), post-QA.** José lo validó
> en dev.finde.pe con **una foto de paisaje sacada con un iPhone, de las que antes
> se rechazaban**: ahora sube sin decir nada.
>
> Ver "La implementación" al final de esta sección, con los números medidos en un
> navegador real. **El resto queda como el diagnóstico que la originó**, porque
> explica por qué era una condición y no una mejora.

**Diagnóstico (2026-08-16).** La foto que sube una agencia se guardaba **tal
cual**, al tamaño que salió del celular.

**Esto dejó de ser "conviene hacerlo" y pasó a ser condición para que la
plataforma funcione con tráfico.** Lo que lo movió de categoría es el plan de
Supabase, confirmado por José el 2026-08-16: **el proyecto está en FREE**, y el
plan Free **no cobra excedente: RESTRINGE**. Agotar la cuota no es una factura que
llega a fin de mes, **es que la plataforma deja de servir**.

**Por qué además tiene que resolverse ANTES y no después.** En el lanzamiento se
borran las agencias actuales y entran agencias reales que suben sus propias fotos.
**Si las primeras suben fotos sin procesar, después hay que reprocesarlas a mano o
pedirles que vuelvan a subir todo**, que es exactamente el pedido que no se le
hace a una agencia recién onboardeada. Es una ventana que se abre una sola vez.

### El plan Free, y el límite que nadie había mirado

| Recurso | Uso hoy | Tope | Ocupado |
|---|---|---|---|
| Storage | 0,027 GB | **1 GB** | 3% |
| **Egress** | 0,126 GB | **5 GB al mes** | 3% |
| Database | 0,029 GB | 0,5 GB | 6% |

**Storage Image Transformations figura como "Unavailable in plan".** O sea que
**Supabase no puede achicar las fotos del lado del servidor**: no hay atajo de
configuración. **El arreglo en el navegador es el único camino**, no una opción
entre varias.

**Y el que muerde primero no es el almacenamiento, es el EGRESS.** El
almacenamiento se llena una vez y se ve venir; el egress **se consume en cada
visita** y se recarga cada mes. Cada persona que abre el catálogo descarga el peso
de las portadas, y eso sale de la cuota.

#### Cuántas visitas al home agotan los 5 GB

Contando 1 GB como 1024 MB, y sumando lo que la app consume **aparte** de las
fotos: la respuesta de `GET /api/tours` (181 kB, que viaja de Supabase a Vercel) y
las llamadas de Auth, que son de pocos kB.

| Escenario | Por visita al home | **Visitas al mes hasta agotar** |
|---|---|---|
| **Hoy** | 3,6 MB | **~1.450** |
| **Sin procesar, portadas de 4 MB** | 194,6 MB | **~26** |
| **Con el arreglo, 1600 px** | 9,9 MB | **~518** |

**Veintiséis visitas.** Ese es el número que convierte el pendiente en una
condición: con fotos sin procesar, **la plataforma deja de servir imágenes antes
de terminar el primer día de cualquier difusión real**.

#### El lanzamiento hace DOS cosas a la vez, y los dos efectos se multiplican

**Este es el hallazgo que cambia el cálculo del lanzamiento, y es fácil de pasar
por alto porque el número de hoy engaña.**

Los 3,6 MB por visita de hoy son bajos por un motivo que **desaparece en el
lanzamiento**: la mayoría de las fotos **no las servimos nosotros**.

| De dónde sale la portada | Tours | Peso | ¿Cuenta para nuestro egress? |
|---|---|---|---|
| Unsplash (tours del seed) | 38 | **7.904 kB** | **No.** Lo paga Unsplash |
| Nuestro bucket de Supabase | 9 | **3.429 kB** | **Sí** |
| **Total en pantalla** | 47 | **11.333 kB** | solo el 30% es nuestro |

**Al borrar los tours del seed y entrar agencias reales, el 100% de las fotos pasa
a salir de nuestro bucket.** Entonces el lanzamiento hace **dos cosas a la vez**:

1. **Agrega fotos más pesadas**, porque las agencias suben lo que sale del celular
   (hasta 4 MB) en vez de las versiones ya optimizadas que sirve Unsplash.
2. **Mueve el 70% del tráfico de imágenes desde Unsplash hacia el egress de
   Supabase**, que hoy no pagábamos.

**Los dos efectos se multiplican, no se suman.** No es que el peso por visita suba
de 3,6 a 11 MB por cambiar de proveedor, ni que suba de 11 a 194 MB por el tamaño
de los archivos: es que **el mismo salto ocurre sobre una base que además pasa a
ser entera nuestra**.

**El cálculo de las 26 visitas ya incluye las dos cosas**, no hace falta
corregirlo hacia abajo: los 194,6 MB por visita asumen las 49 portadas sin
procesar **y** todas servidas desde nuestro bucket, que es exactamente el estado
en que queda el catálogo después del lanzamiento.

**Dos matices honestos sobre estos números**, que no cambian la conclusión:

- **Son el techo, para visitantes nuevos.** El navegador cachea, así que quien
  vuelve no descarga de nuevo. Pero **el visitante que llega de Google es nuevo
  por definición**, y ese es justamente el público que persigue todo el plan de
  SEO: el peor caso es el caso que estamos buscando.
- Lo que importa es el **orden de magnitud**, no el número exacto: decenas de
  visitas contra cientos contra miles. Entre "sin procesar" y "con el arreglo" hay
  un factor de **26 veces**, y eso ninguna caché lo compensa.

### 1. No hay redimensionado ni compresión en ningún punto de la cadena

Verificado en los cuatro eslabones, no deducido:

| Eslabón | Qué hace con la imagen |
|---|---|
| `uploadOnePhoto` (`src/AppDemo.jsx`) | Pide la URL firmada y sube **el `File` original**, sin tocarlo |
| `POST /api/uploads/tour-image` | Solo firma. **El archivo nunca pasa por la función**, va directo del navegador a Storage |
| Bucket `tour-images` | Valida tamaño y MIME. **No transforma** |
| `lib/tour-input.ts` | Solo comprueba que la URL sea `http(s)`. **No mira la imagen** |

La lectura era correcta: **no hay procesamiento en ninguna parte.**

### 2. Qué pasa con una foto de 8 MB: falla claro, pero el mensaje no sirve

**No se rompe.** El cliente valida **antes** de subir (`MAX_PHOTO_BYTES`, 5 MiB,
el mismo número exacto que el `file_size_limit` del bucket) y muestra "Una imagen
supera los 5MB. Elige versiones más livianas."

Tres problemas reales igual:

1. **El mensaje no dice qué hacer.** A una agencia que sacó la foto con el celular,
   "elige versiones más livianas" no le dice nada accionable, y **la app no ofrece
   ninguna forma de achicarla**.
2. **Aborta el lote entero.** Valida todas las fotos antes de subir ninguna (a
   propósito, para no subir a medias), así que **una foto pesada entre cinco tira
   las cinco**. Y no dice cuál era la pesada.
3. **Va a pasar seguido.** Una foto de 12 MP pesa entre 3 y 6 MB; una de 48 MP,
   entre 8 y 15. **El archivo más grande que ya está en el bucket son 4.062 kB**
   (4608x3456), o sea que pasó raspando.

Anomalía menor anotada al medir: hay **un archivo en el bucket con mimetype
`application/octet-stream`**, que la lista blanca no debería permitir. Uno de 44,
16 kB. Sin investigar.

### 3. El impacto, medido y proyectado

**Hoy** las 47 portadas del catálogo público pesan **11.333 kB**, con promedio de
241 kB. La pantalla de inicio renderiza **los 49 tours** en la grilla "Explora
tours", así que las pide todas.

| Escenario | Peso de las portadas | Sobre 4G (1638 kbps) |
|---|---|---|
| Hoy | 11,3 MB | ~63 segundos |
| **49 tours con portadas sin procesar de 4 MB** | **194 MB** | **~18 minutos** |
| 49 tours con el arreglo (1600 px) | **7,2 MB** | ~40 segundos |

**Son 17 veces lo de hoy**, y lo de hoy ya es malo. Con el arreglo queda **por
debajo** del estado actual, porque el promedio de 241 kB baja a 151.

Agravante: las portadas del catálogo se pintan con **`background-image` de CSS**,
no con `<img>`. **`loading="lazy"` no aplica a los fondos CSS**, así que no hay
forma de diferirlas sin cambiar el marcado.

**Lo que ya se puede observar en el bucket, que es evidencia y no hipótesis:**

| Agencia | Archivos | Total | Promedio | El más grande |
|---|---|---|---|---|
| MEGATOURS (real) | 28 | 8.952 kB | 320 kB | 981 kB |
| Descubre el Perú (demo) | 14 | 17 MB | 1,2 MB | **4.062 kB** |

**Matiz honesto: la única agencia real que subió fotos lo hizo en un rango
razonable** (320 kB de promedio, probablemente sacadas de su propia web). Los
archivos de 4 MB salieron de la cuenta de demo. El riesgo es real y está
evidenciado, pero todavía no lo causó una agencia de verdad.

### 4. El arreglo: redimensionar en el NAVEGADOR antes de subir

La agencia elige su archivo de 6 MB, el navegador sube uno de ~150 kB y **no nota
nada**.

**Cómo.** `createImageBitmap(file)` para decodificar, un `<canvas>` para escalar,
y `canvas.toBlob(cb, "image/jpeg", 0.82)` para reencodear. **Todo nativo del
navegador: cero dependencias nuevas y cero peso en el bundle.** Va en un archivo
nuevo (`src/lib/image-resize.js`) que `uploadOnePhoto` llama antes de subir. Entre
40 y 60 líneas en total. **Es una tanda chica.**

**Ancho máximo: 1600 px.** Justificado por dónde se muestran las fotos: el hero de
la ficha en escritorio ocupa la mitad de una grilla de 1440, o sea ~720 px CSS,
que a 2x son 1440; en móvil son ~390 px CSS, que a 3x son 1170. **1600 cubre los
dos con margen**, y para las tarjetas del catálogo (360 px como mucho) sobra.

**Calidad: 0.82 en JPEG.** Medido sobre la foto real de 4.062 kB del bucket:

| Ancho | JPEG | WebP |
|---|---|---|
| 1200 px | 101 kB | 62 kB |
| **1600 px** | **151 kB** | 97 kB |  ← estimado con ffmpeg; medido en el navegador dio **203 kB**
| 2000 px | 211 kB | 131 kB |

**De 4.062 kB a 151 kB: un 96,3% menos.** **Corrección post-implementación: el
navegador da 203 kB, no 151.** El 151 salió de `ffmpeg`, y el codificador JPEG de
Chrome no produce el mismo archivo con la misma calidad nominal. **El ahorro real
sigue siendo del 95%** y la decisión de 1600 px con calidad 0.82 no cambia; lo que
estaba mal era la predicción del tamaño, no el parámetro.

**WebP: todavía no, y el motivo es concreto.** El bucket declara
`allowed_mime_types = {image/jpeg, image/png}`, así que **un WebP lo rechaza**.
Habría que cambiar la config del bucket, el `bodySchema` y el
`CONTENT_TYPE_TO_EXT` de `api/uploads/tour-image.ts`. Ahorra 54 kB más por foto
sobre el JPEG, y no desbloquea nada. **Se puede hacer después, aparte.**

**Efecto secundario que vale tanto como el ahorro: el límite de 5 MB deja de
importar.** Si el navegador achica antes de subir, la agencia puede elegir un
archivo de 12 MB sin enterarse de que existe un tope. El mensaje "elige versiones
más livianas" desaparece del producto.

**Tres trampas que hay que dejar escritas antes de implementarlo:**

1. **Orientación EXIF.** Sin `{ imageOrientation: "from-image" }` en
   `createImageBitmap`, las fotos verticales de celular **salen rotadas**. Es el
   error clásico de este arreglo.
2. **PNG con transparencia.** Pasarlo a JPEG le pone fondo negro. Para fotos de
   tours no importa, pero conviene pintar fondo blanco antes de dibujar.
3. **Hace falta un tope de entrada igual**, generoso (25 MB), para no colgar el
   navegador decodificando un archivo enorme. Reemplaza al de 5 MB, no se suma.

**Las fotos ya subidas: casi no hay nada que reprocesar.** De los 44 archivos, los
14 de "Descubre el Perú" (17 MB, donde están los de 4 MB) y el de "Tour Prueba" se
van con las cuentas que se borran en el lanzamiento. Quedan **las 28 de MEGATOURS,
que ya promedian 320 kB** y no urge tocar. Si algún día hiciera falta, es un
script de una sola corrida, y **no habría que tocar la base**: re-subir con el
mismo path conserva la URL (ojo con la caché del CDN).

### 5. El bucket: 26 MB de 1 GB, y el almacenamiento es el problema MENOR

| Dato | Valor |
|---|---|
| Archivos hoy | 44 |
| Ocupado hoy | **26 MB de 1 GB** |
| Promedio por archivo | 600 kB |
| El más grande | 4.062 kB |

Los archivos por tour rondan **4** (MEGATOURS: 28 archivos para 5 tours).

| Escenario | Por tour | Tours que entran en 1 GB |
|---|---|---|
| Sin procesar, fotos de 4 MB | 16 MB | **~64** |
| Con el arreglo, 203 kB medidos | 812 kB | **~1.290** |

**Plan confirmado el 2026-08-16: FREE.** Así que el tope real es 1 GB, y con fotos
sin procesar el bucket se llena con **64 tours**: un número perfectamente
alcanzable este año.

**Pero el almacenamiento es el límite menos urgente de los tres.** Llenar 1 GB
requiere que las agencias suban 64 tours; agotar el egress requiere **26 visitas**.
El techo que se toca primero, y por dos órdenes de magnitud, es el de
transferencia. Ver la sección del egress más arriba.

### La implementación (2026-08-16, `feat/procesar-fotos-agencia`, pendiente de QA)

**Archivo nuevo `src/lib/image-resize.js`**, llamado desde `uploadOnePhoto`.
`createImageBitmap` más canvas más `toBlob`. **Cero dependencias nuevas**, y el
bundle comprimido sube **0,72 kB** (184,23 a 184,95).

Parámetros tal como quedaron decididos en la investigación, sin recalcular:
**1600 px de ancho máximo y calidad JPEG 0.82.**

#### Las tres trampas, resueltas y verificadas en un navegador real

Verificado con un banco de pruebas que ejecuta el módulo en Chrome, **sin subir
nada al bucket**: el conteo quedó en 44 archivos y 26 MB, igual que antes.

| Caso | Resultado | Peso |
|---|---|---|
| **Vertical de celular** (4000x3000 con EXIF Orientation=6) | **1600x2133, VERTICAL.** La rotación se aplicó | 427 kB a **93 kB** |
| **PNG con transparencia** (12,6 MB) | Convertido a JPEG, **el píxel de la zona transparente da `rgb(255,255,255)`** | 12.921 kB a **256 kB** |
| **Archivo de 25,3 MB** | `ImageTooLargeError` **antes de decodificar**, y el mensaje **nombra el archivo** | rechazado |
| **Foto real del bucket** (la más pesada que subió una cuenta) | 1600x1200 | 4.062 kB a **203 kB, un 95% menos** |
| **Imagen ya chica** (540x360) | **No se agrandó**, se conserva el original | sin cambio |

**Y el QA lo confirmó con hardware real:** José subió en dev.finde.pe **una foto
de paisaje sacada con un iPhone, de las que antes se rechazaban por pasar los
5 MB**, y entró sin decir nada. Es la prueba que la verificación en el banco no
podía dar: ahí el EXIF era sintético y acá lo escribió una cámara de verdad.

**La regla de "nunca agrandar" se implementó también acá**, igual que en la tanda
1C: si el resultado pesa más que el original, se sube el original. Es lo que hace
que una foto ya optimizada no empeore al pasar por el procesamiento.

#### Dos cosas que la verificación destapó y conviene no perder

1. **La primera versión de la prueba del PNG daba un falso negativo.** Leía el
   color de un píxel transparente **del PNG original**, que siempre da
   `rgb(0,0,0)` porque el canal alfa no se lee en el RGB. El fondo blanco solo se
   puede comprobar **sobre un PNG lo bastante grande como para que el JPEG gane**,
   que es cuando de verdad hay conversión. Con un PNG chico se conserva el
   original y no hay nada que comprobar.
2. **El `contentType` que viaja al endpoint es el de SALIDA, no el del archivo
   elegido.** Un PNG que se recomprimió sale como `image/jpeg`, y de ese valor el
   backend deriva la extensión del archivo en el bucket. Mandar el de entrada
   guardaría un JPEG con nombre `.png`. Además ahora el `uploadToSignedUrl` manda
   `contentType` explícito: **hay un archivo en el bucket guardado como
   `application/octet-stream`** y esto es lo que evita que vuelva a pasar.

#### Por qué el rechazo aparecía con unas fotos y no con otras

**Lo reportó José en el QA, y explica un fenómeno que hasta ahora parecía
caprichoso: con la misma cámara, unas fotos se rechazaban y otras no.**

**Las fotos de paisaje de día pesan mucho más que las de interior.** No es la
cámara ni la resolución: es que **los degradados de cielo y la textura de
vegetación comprimen mal en JPEG**. El formato guarda bien las zonas planas y las
transiciones suaves largas; un cielo con degradado sutil y un cerro lleno de
follaje son justo lo contrario, y el archivo se dispara.

**Esto importa porque el catálogo de Finde es exactamente eso: paisaje de día.**
El caso que peor comprime es el caso normal del producto, no la excepción. Con el
límite viejo de 5 MB, la agencia que sacaba la foto del tour al aire libre era la
que se comía el rechazo, y la que fotografiaba un interior pasaba sin problema.

**El procesamiento lo resuelve igual, y por el orden en que hace las cosas:
achica ANTES de comprimir.** El costo de un cielo difícil se paga sobre 1600 px
de ancho, no sobre 4000, así que el archivo final queda en el mismo rango para
una foto de paisaje que para una de interior. **Es la razón de fondo por la que
redimensionar gana por lejos sobre recomprimir**, que ya se había medido en la
tanda 1C sin entender del todo por qué.

#### El límite de 5 MB desapareció del producto

El tope de entrada pasó a **25 MB y reemplaza al de 5**, no se suma: como la foto
se achica antes de subir, lo que sale entra holgado en el bucket sin importar de
qué tamaño se partió.

- El mensaje **"Una imagen supera los 5MB. Elige versiones más livianas"** ya no
  existe.
- El copy del formulario dice **"las achicamos por ti"** en vez de "máx 5MB c/u".
- **Los mensajes de rechazo ahora nombran el archivo.** Antes decían "una imagen"
  y la agencia tenía que adivinar cuál de las cinco era.

**Lo que NO se cambió, a propósito:** que un archivo inválido aborte el lote
entero. Está comentado en el código como decisión de UX ("no subir a medias por
uno malo") y con el tope en 25 MB el caso casi desaparece. Lo que se arregló es
que ahora se sabe **cuál** archivo fue.
