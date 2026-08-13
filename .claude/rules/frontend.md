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

`src/index.css` tiene un `:root` **distinto** (`--text`, `--bg`, `--border`, `--accent`, `--shadow`, `--sans`, `--heading`, `--mono`) con bloque de dark mode. Son dos sistemas separados: no mezclarlos ni asumir que una variable de uno existe en el otro.

- Tipografías: **DM Serif Display** (títulos), **Plus Jakarta Sans** (cuerpo).
- Ancho del contenedor: **1126px** en desktop, con `max-width:100%` por debajo. El contenido interno usa `max-width` por sección (1280, 1080, 680, 640, 520px). No hay ningún 430px en el código: ese valor estaba mal documentado acá.

  **Ojo: ese ancho no lo declara el CSS del demo.** Sale del bloque `.app-demo` de `src/index.css` (plantilla de Vite renombrada), igual que el centrado, el tamaño de texto del root y el interlineado base. `.app` no declara ancho propio, así que gana `index.css` por defecto, no por empate de cascada. **Este valor va a cambiar cuando la Fase 4 de `docs/plans/2026-08-13-plan-tipografia.md` elimine ese bloque:** ahí hay que decidir a propósito qué ancho se replica en `.app`.
- Sin em-dashes en ningún copy, tampoco en el texto que genera la IA dentro del producto.

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

## Convenciones

- El frontend queda en **JSX**, sin TypeScript.
- ESLint (`eslint.config.js`): las variables sin usar que empiezan con mayúscula se ignoran a propósito (componentes React). Las reglas de React Hooks se aplican.
- Terminología visible: **agencia**, **tour**, segunda persona ("tú"), español peruano. Nunca "operador" ni "experiencia" en copy.
