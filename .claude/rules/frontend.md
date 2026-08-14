---
paths:
  - 'src/**'
---

# Frontend

## Estructura

`src/main.jsx` monta `<App />` envuelto en `<AuthProvider>`. `src/App.jsx` hace de switch entre dos pantallas:

- **`src/Landing.jsx`**: landing pública (homepage de finde.pe). **ARCHIVO PROTEGIDO: no se modifica sin la frase explícita "EXCEPCIÓN AUTORIZADA" del usuario.**
- **`src/AppDemo.jsx`**: demo interactivo de la app móvil, con gate de password propio (independiente de la sesión de Supabase).

**No hay router library.** `AppDemo.jsx` renderiza "pantallas" con un `useState` (`view`) y un switch de `effectiveView` (`AppDemo.jsx:6250-6263`).

## Mapa de vistas

```
login ─┬─► welcome ──► home
       └─► (invitado: "Explorar sin cuenta")
                       ├─► catalog (búsqueda)
                       ├─► detail ──► booking ──► bookingSuccess (paso 4 dentro de BookingView)
                       ├─► notifications
                       ├─► trips ──► trip-detail
                       ├─► profile
                       └─► dashboard (panel de la agencia) ──► new-tour (crear/editar)
```

Estados del switch: `login`, `welcome`, `home`, `catalog`, `detail`, `booking`, `notifications`, `trips`, `trip-detail`, `profile`, `dashboard`, `new-tour`.

**Agregar una pantalla se hace acá, no en `vercel.json`.** Los rewrites de `/demo/*` y `/app/*` ya mandan todo al `index.html` de la raíz. Ver `.claude/rules/api-y-schema.md`.

Al cambiar de vista hay un reset manual de scroll (window y contenedor), porque en una SPA cambiar de `view` no es navegación real y el usuario aterrizaba a media página.

## Sesión y estado de agencia

`useAuth()` (`src/contexts/AuthContext.jsx`) es la fuente de verdad de `user`, `session`, `isOperator` y `operatorResolved`. Sesión real de Supabase Auth (email + password), persistida en localStorage. `LoginView` tiene pestañas signin/signup; `OTPView` fue eliminada.

### `operatorResolved`: usarlo, no `isOperator` solo

Regla que ya se rompió una vez y costó un bug de producto. `loading` (sesión) resuelve al instante; el perfil de agencia tarda un roundtrip más. En esa ventana `isOperator` es `false`, y cualquier ternario que dependa solo de eso le muestra a una agencia existente el cartel "¿Ofreces tours? Activa tu perfil de agencia". **Un estado falso que parece legítimo es peor que esperar.**

Todo gate que dependa de la identidad de agencia espera `operatorResolved`, no `loading`. Hoy lo consumen `ProfileView` (`:3665`, `:3744`, con un skeleton del mismo alto para que la card real no empuje el layout), `TopNav` (`:1865`, prop en `:6249`) y el gate del panel (`:6260`). Cerrado en `9a928c2`. **No reintroducir gates que miren solo `isOperator`.**

`AuthContext` tiene tres guardas de concurrencia que conviene no romper:

- `opSeq` (latest-wins): solo la llamada más reciente escribe estado. Sin esto, los `/api/me` concurrentes de una recarga resolvían fuera de orden y un fallo tardío pisaba al operador ya resuelto, vaciando el panel.
- `opInFlight` (dedupe): los tres eventos de auth de una recarga (`SIGNED_IN` + `getSession` + `INITIAL_SESSION`) colapsan en un solo request.
- `opUserId`: dueño del estado actual; al cambiar de usuario se resetea.

Además: un 200 con `operator: null` **no** degrada un operador ya resuelto. El reset legítimo (logout, cambio de usuario) pasa por `resolveOperatorFor`, no por ahí.

`AuthContext` llama a **`/api/me?scope=operator`**, el camino liviano (auth + un `findUnique` indexado). "Mis viajes" sigue usando `/api/me` completo, que además corre el vencimiento perezoso.

## Estilos

**Ojo, esto estaba mal documentado.** Las variables de marca **no están en `src/index.css`**. Viven en el template literal `CSS` de `src/AppDemo.jsx:939`, bajo el scope `.app`, y espejadas en `src/Landing.jsx:557-559` con su propio scope.

| Variable | Valor | Rol |
|---|---|---|
| `--f` | `#1B3A2D` | Verde oscuro primario |
| `--m` | `#2D5A3D` | Verde secundario |
| `--tr` | `#C7613A` | Terracota (acento) |
| `--gd` | `#D4A843` | Dorado |
| `--yp` | `#6B2FA0` | Morado |

Otras del mismo bloque: `--sg`, `--sd`, `--cr`, `--wh`, `--trl`, `--ch`, `--gy`, `--gy-soft`, `--lg`, `--pl`, `--ai`, `--focus`.

`src/index.css` tiene un juego de variables **distinto** (`--text`, `--text-h`, `--bg`, `--border`, `--accent`, `--shadow`, `--sans`, `--heading`, `--mono`) con bloque de dark mode. Son dos sistemas separados: no mezclarlos ni asumir que una variable de uno existe en el otro.

**Ojo con dónde vive ese juego: no es `:root`, es `.app-demo`.** La distinción importa y ya costó dos bugs. Si fuera `:root` sería un default global que cualquier regla del demo pisa sin esfuerzo. Pero `.app-demo` es una clase que **el root del demo lleva puesta** (`<div className="app app-demo">`, `AppDemo.jsx:6257`), así que ese bloque no es un fallback: **gobierna el demo de igual a igual con `.app`**, y le gana en todo lo que `.app` no declara (ancho, centrado, tamaño de texto del root, interlineado base, espaciado entre letras, `font-synthesis`) y empata en lo que sí (`font-family`, `color`, `background`), resolviéndose por orden de documento.

De ahí salieron los dos títulos que desaparecían en modo oscuro (`c171347` y `e818d8e`): heredaban `--text-h` de `.app-demo` porque no le ganaban la cascada a `.app-demo h2`. La pregunta correcta frente a esta herencia nunca es "¿declara la propiedad?" sino "¿le gana a `.app-demo`?". Ver `docs/plans/2026-08-13-plan-tipografia.md`, Fase 4.

- Tipografías: **DM Serif Display** (títulos), **Plus Jakarta Sans** (cuerpo).
- Ancho del contenedor: **1126px** en desktop, con `max-width:100%` por debajo. El contenido interno usa `max-width` por sección (1280, 1080, 680, 640, 520px). No hay ningún 430px en el código: ese valor estaba mal documentado acá.

  **Ojo: ese ancho no lo declara el CSS del demo.** Sale del bloque `.app-demo` de `src/index.css` (plantilla de Vite renombrada), igual que el centrado, el tamaño de texto del root y el interlineado base. `.app` no declara ancho propio, así que gana `index.css` por defecto, no por empate de cascada. **Este valor va a cambiar cuando la Fase 4 de `docs/plans/2026-08-13-plan-tipografia.md` elimine ese bloque:** ahí hay que decidir a propósito qué ancho se replica en `.app`.
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
- **`USER` (`AppDemo.jsx:921`)**: mock residual ("Alejandra Quispe"). Ya no se usa para el saludo, pero sigue siendo el fallback del nombre del cliente (`:2908`, `:6194`) y el autor de las reseñas de sesión (`:5812`). Si cae en ese fallback, el usuario ve un nombre inventado, y eso rompe la regla de "nada falso visible al usuario real". Está en la checklist pre-lanzamiento.

## Elementos ocultos en la etapa piloto

No son bugs. No los "arregles" mostrándolos:

- Pestaña **"Ingresos"** del dashboard (`:4211`): sin pasarela no hay ingresos reales. El mock `EARN` ya se borró, así que reactivarla implica construir el cálculo.
- Stat **"Rating"** del dashboard (`:4205`): los ratings del seed son siembra, no reseñas reales.
- **Comisión**: la etapa piloto va sin comisión (link directo a WhatsApp). No hay ningún porcentaje en la UI y no hay que agregarlo hasta que se defina con Culqi. Ver `docs/decisiones.md`.

La **política de cancelación sí se muestra** (`getCancelPolicy` en `:2795`, `:3045`, `:3406`, `:3457`, `:3497`), incluido el flujo de reserva. Es exigencia INDECOPI antes de pagar: no la ocultes.

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
