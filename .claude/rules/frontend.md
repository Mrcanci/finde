---
paths:
  - 'src/**'
---

# Frontend

## Estructura

`src/main.jsx` monta `<App />` envuelto en `<AuthProvider>`. `src/App.jsx` hace de switch entre dos pantallas:

- **`src/Landing.jsx`**: landing pública (homepage de finde.pe). **ARCHIVO PROTEGIDO: no se modifica sin la frase explícita "EXCEPCIÓN AUTORIZADA" del usuario.**
- **`src/AppDemo.jsx`**: demo interactivo de la app móvil, con gate de password propio (independiente de la sesión de Supabase).

**No hay router library, pero sí hay router propio.** El mapa entre URL y vista
vive en **`src/lib/routes.js`** (`fromPath`, `toPath`, la tabla `ROUTES` y la
constante `BASE_PATH`), y `AppDemo.jsx` guarda la vista actual en un `useState`
(`view`) que resuelve contra el derivado **`effectiveView`**, dentro del
componente `AppDemo`.

## Mapa de vistas

**La tanda 3 (2026-08-17) eliminó el muro de entrada.** `/demo` pelado ya no abre
el login: abre el inicio, y la navegación entera está disponible sin cuenta. La
cuenta se pide recién en el checkout, con **un solo modal** que sirve a los cuatro
puntos de entrada (reservar, "Mis reservas", "Perfil" y notificaciones). Entrar no
desmonta nada: el viajero sigue con su paso, su fecha y sus cupos.

```
home (entrada, sin cuenta)
 ├─► catalog (búsqueda)
 ├─► detail ──► booking ──► bookingSuccess (paso 4 dentro de BookingView)
 ├─► notifications ┐
 ├─► trips ──► trip-detail
 ├─► profile       ├─ vistas privadas: entrar por URL muestra el inicio
 └─► dashboard (panel de la agencia) ──► new-tour (crear/editar)
                   └─ con el modal de cuenta encima, para no perder el destino

login / welcome siguen existiendo como vistas, ya no como puerta de entrada
not-found: cualquier URL que no matchea, y toda ficha con sufijo mal formado
```

Estados del switch: `home`, `catalog`, `detail`, `booking`, `notifications`,
`trips`, `trip-detail`, `profile`, `dashboard`, `new-tour`, `login`, `welcome`,
`not-found`.

Las dos listas que gobiernan esto viven en `AppDemo.jsx` y son complementarias:
**`GUEST_VIEWS`** (lo que se ve sin cuenta) y **`ACCOUNT_VIEWS`** (lo que la
exige, y por lo tanto abre el modal). En `src/lib/routes.js` vivía además
`PUBLIC_VIEWS`, borrada en la tanda 3: existía para distinguir "llegué por un
link" de "entré a `/demo`", y esa distinción dejó de existir cuando se abrió la
navegación entera.

**Agregar una pantalla son DOS lugares, y ninguno es `vercel.json`:** la tabla
`ROUTES` de `src/lib/routes.js` y el switch de `AppDemo.jsx`. Los rewrites de
`/demo/*` y `/app/*` ya mandan todo al `index.html` de la raíz. Ver
`.claude/rules/api-y-schema.md`.

Al cambiar de vista hay un reset manual de scroll (window y contenedor), porque en una SPA cambiar de `view` no es navegación real y el usuario aterrizaba a media página.

## Sesión y estado de agencia

`useAuth()` (`src/contexts/AuthContext.jsx`) es la fuente de verdad de `user`, `session`, `isOperator` y `operatorResolved`. Sesión real de Supabase Auth (email + password), persistida en localStorage. `LoginView` tiene pestañas signin/signup; `OTPView` fue eliminada.

### `operatorResolved`: usarlo, no `isOperator` solo

Regla que ya se rompió una vez y costó un bug de producto. `loading` (sesión) resuelve al instante; el perfil de agencia tarda un roundtrip más. En esa ventana `isOperator` es `false`, y cualquier ternario que dependa solo de eso le muestra a una agencia existente el cartel "¿Ofreces tours? Activa tu perfil de agencia". **Un estado falso que parece legítimo es peor que esperar.**

Todo gate que dependa de la identidad de agencia espera `operatorResolved`, no `loading`. Hoy lo consumen tres:

- **`ProfileView`**, con un placeholder (`.pf-op-skel`) del mismo alto que la card real, para que resolver el operador no empuje el resto del perfil hacia abajo.
- **`TopNav`**, que lo recibe como prop desde `AppDemo` y con eso decide la visibilidad del botón del panel.
- **El gate del panel** en el switch de `effectiveView` de `AppDemo`.

Cerrado en `9a928c2`. **No reintroducir gates que miren solo `isOperator`.**

`AuthContext` tiene tres guardas de concurrencia que conviene no romper:

- `opSeq` (latest-wins): solo la llamada más reciente escribe estado. Sin esto, los `/api/me` concurrentes de una recarga resolvían fuera de orden y un fallo tardío pisaba al operador ya resuelto, vaciando el panel.
- `opInFlight` (dedupe): los tres eventos de auth de una recarga (`SIGNED_IN` + `getSession` + `INITIAL_SESSION`) colapsan en un solo request.
- `opUserId`: dueño del estado actual; al cambiar de usuario se resetea.

Además: un 200 con `operator: null` **no** degrada un operador ya resuelto. El reset legítimo (logout, cambio de usuario) pasa por `resolveOperatorFor`, no por ahí.

`AuthContext` llama a **`/api/me?scope=operator`**, el camino liviano (auth + un `findUnique` indexado). "Mis viajes" sigue usando `/api/me` completo, que además corre el vencimiento perezoso.

## Estilos

**Desde la Fase 4 del plan tipográfico hay UN solo sistema de estilos para el demo, y vive dentro de `AppDemo.jsx`.** Antes había dos y esta sección describía el reparto entre ellos; ese reparto ya no existe.

Las variables de marca viven en el template literal **`CSS`** de `src/AppDemo.jsx`, bajo el scope **`.app`**, y están espejadas en `src/Landing.jsx` con su propio scope.

| Variable | Valor | Rol |
|---|---|---|
| `--f` | `#1B3A2D` | Verde oscuro primario |
| `--m` | `#2D5A3D` | Verde secundario |
| `--tr` | `#C7613A` | Terracota (acento) |
| `--gd` | `#D4A843` | Dorado |
| `--yp` | `#6B2FA0` | Morado |

Las demás del mismo bloque `.app`: `--sg`, `--sd`, `--cr`, `--wh`, `--tr-text`, `--trl`, `--gd-text`, `--ch`, `--gy`, `--gy-strong`, `--lg`, `--pl`, `--ai`, `--focus`.

**Ojo con dos que se confunden.** `--gy-soft` **no existe en el demo**: se borró de `.app` en `2c002bb` y hoy solo vive en `src/Landing.jsx`. Escribirla en `AppDemo.jsx` da un valor vacío sin error, que es la peor forma de fallar. La del demo es `--gy`.

`--tr-text`, `--gd-text` y `--gy-strong` son las variantes accesibles que agregó esa misma tanda de contraste (`2c002bb`, `6bcc211`). **Se usan solo sobre texto**, verificado: sus 57 usos son todos `color:`. `--tr`, `--gd` y `--gy` siguen para fondos y bordes, que tienen otro umbral.

### `src/index.css` son 20 líneas, y no gobierna nada del demo

Hoy declara **solo** `body { margin: 0; font-family }`. El `font-family` **no es redundante** aunque `.landing` y `.app` declaren la suya: la hoja de notificaciones se renderiza en mobile con `createPortal(popover, document.body)`, o sea que cuelga del `<body>` y queda fuera de los dos scopes.

**El bloque `.app-demo` que vivía acá ya no existe.** Era residuo de la plantilla de Vite y gobernaba el ancho, el centrado, el tamaño de texto del root, el interlineado, el espaciado entre letras y los `h2` del demo, con un juego de variables propio (`--text`, `--text-h`, `--bg`...) y bloque de modo oscuro. **La Fase 4 lo eliminó**, replicando antes en `.app` lo que había que conservar. El comentario de `index.css` dice "no lo devuelvas", y va en serio.

Consecuencias prácticas, que es lo que hay que saber al tocar CSS hoy:

- **La clase `.app-demo` sigue puesta en el root del demo** (`<div className="app app-demo">`) pero **no tiene ni una regla asociada**. Es vestigial. No escribas reglas nuevas contra ella: el scope del demo es `.app`.
- **Ya no hay dos sistemas de variables que no mezclar.** La pregunta vieja frente a una herencia era "¿le gana a `.app-demo`?" y hoy no aplica: si una propiedad no está declarada en `.app` o en una regla más específica, no está declarada.
- Los dos títulos que desaparecían en modo oscuro (`c171347` y `e818d8e`) eran de esa época: heredaban `--text-h` de `.app-demo`. Quedan como historia, no como patrón vigente. Ver `docs/plans/2026-08-13-plan-tipografia.md`, Fase 4, y `docs/historia/2026-08-tipografia.md`.

### Lo demás

- Tipografías: **DM Serif Display** (títulos), **Plus Jakarta Sans** (cuerpo).
- Ancho del contenedor: **1126px** en desktop, con `max-width:100%` por debajo. **Lo declara `.app`, dentro de la constante `CSS` de `AppDemo.jsx`**, junto con el centrado, el tamaño de texto del root, el interlineado base y el espaciado entre letras. Todo eso se replicó ahí en la Fase 4, a propósito y con la línea base medida antes.
- El contenido interno usa `max-width` por sección (1280, 1080, 680, 640, 520px). No hay ningún 430px en el código: ese valor estaba mal documentado acá.
- Sin em-dashes en ningún copy, tampoco en el texto que genera la IA dentro del producto.

### Excepción: la raya como glifo de dato vacío se queda

**El canon prohíbe la raya en prosa, no como glifo.** `AppDemo.jsx` usa `"—"` en nueve lugares como marcador de dato vacío, no como signo de puntuación:

```jsx
{user?.email || "—"}
const code = trip.code || "—";
form.days.length > 0 ? form.days.map(...).join(", ") : "—"
```

Eso es convención tipográfica de tabla, la misma que usa cualquier planilla para decir "acá no hay valor". No es una pausa dentro de una oración y **no se toca**.

Queda escrito porque un barrido de em-dashes los marca como violación y ya pasó una vez. Al buscar rayas, separar dos cosas:

| Caso | Qué hacer |
|---|---|
| Raya en medio de una oración, en copy o en un prompt de IA | **se saca**, va coma, dos puntos o punto |
| Raya sola como valor, entre comillas y con un `\|\|` al lado | **se queda** |

El barrido del 2026-08-14 encontró además dos en `index.html` (el `<title>` y el `og:title`), que sí eran prosa visible en la pestaña del navegador y en el preview al compartir el link. Esas se sacaron.

## Datos: qué es real y qué no

El detalle vive en `docs/estado.md` y cambia seguido. Resumen: notificaciones, reservas del panel y "Mis viajes" son **reales**; los mocks `NOTIFS`, `OP_BK`, `EARN`, `MY_TRIPS` y `generateMockReviews` **fueron eliminados**.

Dos cosas que siguen incompletas y hay que tratar con cuidado:

- **Reseñas**: no hay modelo `Review` en la DB. Las que deja el viajero viven solo en el estado de sesión y se pierden al recargar. Un tour sin reseñas muestra "Nuevo", nunca un rating inventado.
- **La constante `USER` de `AppDemo.jsx`**: mock residual ("Alejandra Quispe"). Ya no se usa para el saludo, pero sigue siendo el fallback en tres lugares: `buildWhatsAppLink` (el nombre del cliente en el mensaje), `handleAddLocalTrip` (el `customerName` del viaje local) y `handleReview` (el autor de las reseñas de sesión). Si cae en ese fallback, el usuario ve un nombre inventado, y eso rompe la regla de "nada falso visible al usuario real". Está en la checklist pre-lanzamiento.

## `mapTourFromApi` es una LISTA BLANCA, y descarta en silencio

Todo tour que llega del API pasa por la función `mapTourFromApi` de
`src/AppDemo.jsx`, tanto el catálogo público como el listado del operador. **No
hace spread del objeto de origen**: construye uno nuevo enumerando campos a mano.

Consecuencia: **cualquier campo del API que no esté en esa lista se descarta sin
error, sin warning y sin dejar rastro.** El objeto llega al componente con el
campo en `undefined`, y si el consumidor tiene un `?? 0` o un `?? null` (que es
lo habitual), el valor por default se ve exactamente igual que un dato real.

### La tarjeta del panel pasa por DOS mapeos, y los nombres cambian

Un tour del dashboard **no tiene los nombres del API**. Pasa por
`mapTourFromApi` y después por el mapeo de `loadOperatorTours`, y cada uno
renombra:

| Campo | API | tras `mapTourFromApi` | **en la tarjeta del panel** |
|---|---|---|---|
| gancho | `shortPitch` | `shortPitch` | `shortPitch` |
| descripción | `description` | `desc` | `description` (vuelve al nombre original) |
| **portada** | `imageUrl` | `image` | **`image`** (no vuelve nunca) |

**La descripción hace un viaje de ida y vuelta y la portada no.** Por eso
escribir `t.imageUrl` sobre un objeto de `opTours` no falla: da `undefined`, y
una condición que lo lea va a decir "falta la foto" sobre un tour que la tiene.
**Un dato inventado que parece dato es peor que un error**, que es la misma razón
por la que existe la sección de abajo.

Pasó al escribir la guarda de publicar en el panel (2026-08-17). Se evitó
leyendo la respuesta real del API con la sesión abierta antes de escribir la
condición, no deduciéndola del código.

### Agregar un campo al payload de un tour son TRES lugares, no dos

1. El `select` del backend (`lib/tour-select.ts`), o el handler si el campo se
   calcula aparte.
2. **La lista blanca de `mapTourFromApi`.** Este es el que se olvida.
3. El consumidor (el componente que lo lee).

### El caso que costó una tanda: `pendingRequests`

`GET /api/operators/me/tours` empezó a devolver `pendingRequests` (solicitudes
vigentes por tour) para avisar en el formulario de edición que ese tour no puede
pasar a confirmación automática. El campo se agregó **en el endpoint** y **en el
consumidor**, y funcionaba en los dos extremos:

- el API devolvía `pendingRequests: 2`, comprobado con la sesión real
- el mapeo del dashboard decía `pendingRequests: t.pendingRequests ?? 0`

Pero en el medio estaba `mapTourFromApi`, que no lo enumeraba. El `?? 0` del
consumidor convertía el `undefined` en un 0 perfectamente creíble, la opción
nunca se deshabilitaba, y el error volvía a aparecer al guardar, que era
justamente lo que el cambio venía a evitar.

### Cómo se verifica, y por qué mirar las puntas no alcanza

**Leé el valor computado en el punto EXACTO donde se usa, no en los extremos de
la cadena.** Comprobar que el API lo devuelve y que el componente lo lee deja sin
examinar todos los eslabones del medio, y es ahí donde se pierde.

En la práctica: abrí la vista real con la sesión real y medí el efecto
observable, no el dato de origen. Para `pendingRequests` la prueba que cerró el
caso fue leer la opción renderizada en el paso 3 (`cursor: pointer`, `opacity: 1`,
sin bloque de aviso), que dice que el valor llegó en 0 aunque el API mandara 2.

Es el mismo criterio que la sección de reemplazos por script de más abajo, y el
mismo que `.claude/rules/api-y-schema.md` aplica a las transacciones: **medir el
punto, no deducirlo de los bordes.**

## Elementos ocultos en la etapa piloto

No son bugs. No los "arregles" mostrándolos:

Los dos primeros están en el componente **`DashView`**, y en los dos el marcado se borró y quedó un comentario en su lugar. Buscalos por ahí, no por su etiqueta:

- Pestaña **"Ingresos"** del dashboard, en el bloque `.dsh-tabs`: sin pasarela no hay ingresos reales. El mock `EARN` ya se borró, así que reactivarla implica construir el cálculo.
- Stat **"Rating"** del dashboard, en el bloque `.dsh-sts`: los ratings del seed son siembra, no reseñas reales.
- **Precio**: la agencia declara un precio neto y Finde publica el PVP aplicando un markup negociado por tour. En la UI NO se muestra markup, comisión ni porcentaje al viajero. El viajero solo ve el PVP. Ver `docs/decisiones.md`.

La **política de cancelación sí se muestra**, y el flujo de reserva está cubierto. Es exigencia INDECOPI antes de pagar: no la ocultes.

`getCancelPolicy` tiene **seis llamadas**, en cuatro componentes: **`DetailView`** (la ficha), **`VoucherDetail`** (el comprobante), **`BookingView`** (tres, una por paso del formulario) y **`NewTourView`** (el resumen que ve la agencia al cargar el tour, no el viajero).

**Ojo con las banderas antes de contar cuáles se ven.** Las seis están detrás de `SHOW_CANCELLATION_POLICY`, que hoy vale `DEMO_PAYMENT_FLOW`, que es `true`. Pero dos de las tres de `BookingView` piden además `!DEMO_PAYMENT_FLOW`, así que **hoy no renderizan**: son el camino alternativo para cuando el flujo de pago deje de ser demo. La que cubre la exigencia en el checkout es la tercera. Si algún día se toca `DEMO_PAYMENT_FLOW`, hay que verificar en pantalla que la política siga apareciendo antes de pagar, no deducirlo del conteo de llamadas.

## Extraer o reemplazar en la constante CSS por script

Regla escrita después de cometer **dos veces el mismo tipo de error en dos tandas seguidas**, las dos veces sobre `src/AppDemo.jsx`. Quedan siete fases del plan tipográfico con reemplazos masivos por delante, así que esto no es teoría.

### 1. Nunca parsear por línea, siempre por regla

La constante `CSS` de `AppDemo.jsx` **mete varias reglas en una misma línea**. Partir por línea y tomar lo que va antes del primer `{` como selector atribuye la propiedad al selector equivocado.

Pasó así: se leyó `.det-op-n{font-size:14px;font-weight:700}.det-op-d{font-size:11px;color:var(--gy)}` y el `color` quedó atribuido a `.det-op-n`, que no lo tiene. Además de mal, se saltearon otras cinco reglas del mismo tirón.

**Partir por `}` antes de hacer nada.** Una regla por elemento, después buscar.

### 2. Anclar el patrón al inicio de la declaración

`color:` matchea dentro de `border-color:`, `background-color:` y `outline-color:`.

Pasó así: un grep de `color:var(--sg)` devolvió cuatro reglas que en realidad eran `border-color:var(--sg)`. Se reportaron como texto que fallaba AA cuando eran bordes, que tienen otro umbral (3:1) y ya lo pasaban. Se hizo un cambio que había que revertir.

**Usar un separador explícito antes de la propiedad**: inicio de bloque, `;` o `{`. En regex, `[{;]color:` o `(?<![-\w])color:`.

### 3. Contar antes y después, y comparar contra el delta esperado

Todo reemplazo masivo termina con un conteo de las dos formas, la vieja y la nueva, y una comparación contra lo que se esperaba cambiar.

**Si el delta no coincide, la extracción está mal, no el conteo.** No ajustar el número esperado para que cierre: volver a la lista.

### 4. Verificar el alcance contra un tag

Antes de una tanda con reemplazos, crear un tag (`pre-<lo-que-sea>`). Al terminar, comparar propiedad por propiedad lo que **no** se debía tocar:

```bash
for prop in font-size font-weight line-height letter-spacing padding margin width height gap; do
  a=$(git show pre-TAG:src/AppDemo.jsx | grep -oE "$prop:[^;\"}]*" | sort | md5 -q)
  b=$(grep -oE "$prop:[^;\"}]*" src/AppDemo.jsx | sort | md5 -q)
  [ "$a" = "$b" ] && echo "$prop IDENTICO" || echo "$prop ***CAMBIO***"
done
```

Compara los valores, no el diff. Un diff de reglas completas muestra `font-size` en las líneas `-` y `+` aunque solo haya cambiado el color, y eso hace pensar que se rompió el alcance cuando no.

### 5. Los titulares numéricos también se cuentan con script

La regla 3 dice que todo reemplazo masivo se cuenta antes y después. **Esto la extiende: si un documento afirma un número, ese número sale de un comando, no de contar a ojo.**

Van tres casos del mismo tipo, y los tres se detectaron recontando después, no al escribirlos:

| Documento decía | Era | Cómo se detectó |
|---|---|---|
| Conteos por selector de la auditoría (`--gy` 67, `--lg` 5, `--sg` 2, `--gd` ~5, letter-spacing 22) | 66, 6, 6, 7 y 23 | Error E4 del plan tipográfico, al verificar la auditoría |
| "96 selectores dependen de la herencia" | 91 | Al parsear la lista con script para calcular un delta |
| "El demo declara centrado explícito en 22 reglas propias" | 36 | Al leer el `cssRules` del navegador |

Los tres eran de documentos de investigación, escritos con cuidado, y los tres estaban mal. **El problema no es la falta de cuidado: es que contar a ojo una lista de 90 ítems no funciona por más cuidado que se ponga.**

Lo caro no es el número en sí, es que **un número mal se cita después como si fuera medición**. El "22 reglas" viajó del documento de auditoría al plan y de ahí a la descripción de la Fase 4, tres documentos, antes de que alguien lo contara.

Concretamente:

- Un total en un título o en una tabla sale de `grep -c`, de un `wc -l`, o de un script que parsea la fuente. Nunca de contar la lista.
- Si el número se recalcula al actualizar el documento, el script se deja escrito, aunque sea en el scratchpad, y se vuelve a correr.
- Si un número viejo no coincide con el recuento, **se corrige el titular y se deja anotado que estaba mal**. La lista casi nunca cambia; el que cambia es el número.

#### Cada reemplazo se verifica solo, nunca en bloque

Corolario del mismo problema, y ya costó un error propio.

**Un `assert` que solo confirma que "algo cambió" deja pasar en silencio los reemplazos que no matchearon.** Si un script hace cinco reemplazos y verifica con un `assert texto != original`, alcanza con que uno entre para que el assert pase. Los otros cuatro fallan sin ruido y el archivo queda a medias.

**Pasó en `3d6c900`.** Un script de Python aplicaba cuatro reemplazos sobre `docs/plans/2026-08-13-plan-tipografia.md` y terminaba con `assert s != o`. Tres entraron y el cuarto no: el patrón buscado terminaba en `de 35, no menos.` y el archivo decía `de 35.`, cuatro palabras de diferencia. El assert pasó igual, el commit se hizo, y la sección vieja se quedó en el documento. Se descubrió al ir a editar esa misma sección en la tanda siguiente.

Lo peligroso no es que falle: es que **falla pareciendo que funcionó**. Un documento con una sección desactualizada se lee como si estuviera al día.

La forma correcta es contar ocurrencias del patrón **antes** de reemplazar, y exigir el número exacto:

```python
def rep(s, viejo, nuevo, etiqueta):
    n = s.count(viejo)
    assert n == 1, f'FALLO [{etiqueta}]: el patron aparece {n} veces, se esperaba 1'
    return s.replace(viejo, nuevo)
```

Con eso, un patrón que no matchea aborta el script entero en vez de dejar el archivo a medias. Y si aparece dos veces, también aborta, que es el otro error de esta familia: reemplazar sin querer en un segundo lugar.

Vale igual para los reemplazos sobre datos, no solo sobre documentos. El script de `scripts/limpieza-em-dash.ts` aplica el mismo criterio: si aparece una forma que la regla no cubre, aborta con `exit 1` en vez de escribir a medias.

### 6. Las tablas de las auditorías no son checklists

Los conteos por selector de `docs/audits/2026-08-13-typography-audit.md` están hechos a ojo y tienen desvíos en cinco de seis colores. Sirven para entender el problema, nunca para ejecutarlo. **La lista se regenera con script al empezar cada tanda**, contra el archivo en su estado de ese momento.

## Convenciones

- El frontend queda en **JSX**, sin TypeScript.
- ESLint (`eslint.config.js`): las variables sin usar que empiezan con mayúscula se ignoran a propósito (componentes React). Las reglas de React Hooks se aplican.
- Terminología visible: **agencia**, **tour**, segunda persona ("tú"), español peruano. Nunca "operador" ni "experiencia" en copy.
