# Plan M1 — Integración de Supabase Auth en Vite SPA + Vercel Functions

> Plan de implementación de la fase **M1 (Auth)** del roadmap MVP.
> Pre-implementación: documento de revisión antes de escribir código.

## Decisiones tomadas (2026-05-24)
- NO usar `@supabase/ssr` (basta `supabase-js`, ya instalado)
- `OTPView` se oculta del flujo (con email+password no aplica)
- Orden: viajero primero, operador en el sub-paso final (`Operator.userId`)
- Login = email+password. Google OAuth y password reset quedan fuera de M1.

---

## 1) ¿`@supabase/ssr` o solo `@supabase/supabase-js`?

**Recomendación: NO instalar `@supabase/ssr`. Basta con `@supabase/supabase-js` (ya instalado).**

Razones:
- `@supabase/ssr` existe para resolver un problema específico: sincronizar la sesión vía **cookies** entre el render del servidor y el cliente en frameworks SSR (Next.js App Router, SvelteKit, Remix). Nada de eso aplica acá: Vite produce un `index.html` estático y React hidrata en el navegador. No hay render del lado del servidor que necesite leer la cookie de sesión antes de pintar.
- Las funciones de `/api/*` **no participan del render**. Son endpoints JSON que se invocan con `fetch` desde el navegador. No necesitan compartir cookie con el HTML — pueden recibir el token explícitamente en `Authorization`.
- `@supabase/ssr` introduciría complejidad sin beneficio: requiere wrappers de cookies, ciclos de refresh server-side, y manejo de Set-Cookie en cada función serverless. Nada de eso encaja con un SPA.

**Patrón a usar:**

| Capa | Cliente | Storage | Cómo obtiene la sesión |
|------|---------|---------|------------------------|
| Frontend (Vite SPA) | `createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)` con `persistSession: true` (default) | `localStorage` del navegador | `supabase.auth.getSession()` + `onAuthStateChange` |
| Backend (`/api/*`) | `createClient(URL, SERVICE_ROLE_KEY)` singleton, **sin** persistencia | Ninguno (stateless) | Cliente manda `Authorization: Bearer <access_token>`; backend llama `admin.auth.getUser(token)` para validar |

Sobre las **nuevas keys** (`sb_publishable_` / `sb_secret_`): `@supabase/supabase-js` ≥ 2.95 ya las soporta nativamente — se pasan al mismo parámetro que las viejas anon/service. Sin cambios de API.

---

## 2) Archivos helper a crear

**Frontend** (`src/lib/`):

- `src/lib/supabase.js` — **Cliente singleton del navegador.**
  - Lee `import.meta.env.VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
  - Exporta `export const supabase = createClient(...)` con `auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }`.
  - `detectSessionInUrl` queda activo para soportar después callbacks OAuth / magic link sin reescribir.

- `src/lib/authFetch.js` — **Wrapper de `fetch` para llamadas autenticadas al backend.**
  - Lee la sesión actual de `supabase.auth.getSession()`, agrega `Authorization: Bearer <access_token>`, devuelve `fetch(url, opts)`.
  - Centralizar acá evita repetir el header en cada llamada de AppDemo.

**Backend** (`lib/`, sigue el patrón existente de singletons):

- `lib/supabase-admin.ts` — **Cliente singleton con service role.**
  - Lee `process.env.VITE_SUPABASE_URL` y `process.env.SUPABASE_SERVICE_ROLE_KEY`.
  - `createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })`.
  - Cacheado en `globalThis` igual que `lib/db.ts` para no reinstanciar en dev.

- `lib/auth.ts` — **Helpers de autenticación para endpoints.**
  - `getAuthUser(req): Promise<User | null>` — extrae el bearer token, lo valida con `supabaseAdmin.auth.getUser(token)`. Devuelve el user o null.
  - `requireAuth(req, res): Promise<User>` — wrapper que responde 401 y lanza si no hay user. Devuelve el user garantizado.
  - (Opcional, para la fase del dashboard) `requireOperator(req, res)` — además consulta `prisma.operator.findUnique({ where: { userId: user.id } })` y responde 403 si no existe.

**Por qué `lib/` y no `src/lib/` para el backend:** los archivos de `/api/` ya importan de `lib/` (ej. `lib/db.ts`). Vercel bundlea ese directorio con las funciones; `src/` lo bundlea Vite para el cliente.

---

## 3) Cómo conecta el frontend con la sesión

**AuthContext + hook `useAuth`** — es el patrón estándar y encaja con la estructura actual.

Ubicación propuesta: `src/contexts/AuthContext.jsx`

Lo que expone el provider:

```
{
  user,          // Supabase User | null
  session,       // Session | null
  loading,       // true durante el getSession() inicial
  isOperator,    // boolean (derivado de fetch al backend)
  signInWithPassword({ email, password }),
  signUpWithPassword({ email, password }),
  signOut(),
}
```

Comportamiento interno:

1. En `useEffect` de mount: `await supabase.auth.getSession()` para restaurar la sesión desde `localStorage`. Setea `user`, `session`, baja `loading` a false.
2. Subscribe a `supabase.auth.onAuthStateChange((event, session) => …)` para reaccionar a `SIGNED_IN`, `SIGNED_OUT`, `TOKEN_REFRESHED`. Limpia la subscripción en cleanup.
3. Cuando `user` cambia, dispara un `fetch` a `/api/me` (nuevo endpoint chico) para resolver `isOperator` consultando si existe `Operator.userId == user.id`.

**Montaje:** envolver `<App />` con `<AuthProvider>` en `src/main.jsx`. **No tocar `Landing.jsx`** (archivo protegido) — el provider va en el nivel donde se monta App, no dentro de Landing.

**Reemplazo de los `useState` actuales en `AppDemo.jsx`** (líneas 3596 y 3692):

| Hoy | Después |
|-----|---------|
| `const [loggedIn, setLoggedIn] = useState(false)` | `const { user, loading } = useAuth(); const loggedIn = !!user;` |
| `const [isOperator, setIsOperator] = useState(false)` | `const { isOperator } = useAuth();` |
| `setLoggedIn(true)` tras llegar a "welcome" (línea 3709) | desaparece — el provider ya tiene `user` después del `signIn` exitoso |
| `setLoggedIn(false)` al ir a "login" (línea 3710) | reemplazar por `signOut()` del context |
| `setIsOperator(true)` dentro de `ProfileView` tras onboarding | `signOut` no, sino que tras `POST /api/operators` exitoso el provider refresca su estado de operador (un `refreshOperatorStatus()` expuesto en el context) |

Los `view` (login/otp/welcome/home/…) **siguen siendo `useState` local** de AppDemo. La auth no rompe ese switch; solo provee la fuente de verdad de "hay sesión o no".

**OTPView:** en M1 queda **oculto** del flujo (decisión tomada: con email+password no aplica). El switch de `view` deja de enrutar a `"otp"`.

**Persistencia entre recargas:** automática vía `localStorage` (default de supabase-js). En el primer render del provider habrá un instante de `loading: true` mientras se restaura — AppDemo debe renderizar un skeleton/splash en ese estado para evitar parpadeos de la pantalla de login.

---

## 4) Cómo el backend sabe quién es el usuario

**Contrato:** el frontend envía el access token en el header `Authorization`. El backend lo valida con la service key contra Supabase.

**Helper en `lib/auth.ts`:**

```
// pseudocódigo
export async function requireAuth(req, res) {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) { res.status(401).json({ error: 'Falta token' }); throw new AuthError(); }
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) { res.status(401).json({ error: 'Token inválido' }); throw new AuthError(); }
  return data.user; // { id, email, ... }
}
```

**Uso en un endpoint:**

```
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  let user;
  try { user = await requireAuth(req, res); } catch { return; }
  // user.id es el auth.users.id; úsalo como FK
  ...
}
```

**Costo / cache:** cada `auth.getUser(token)` es un round-trip a Supabase. Para el volumen del MVP no es problema. Si después molesta, se cachea el resultado por `token` con TTL corto (1-2 min) en memoria del proceso — pero **no en este paso**.

**Endpoints a marcar como autenticados (en sub-pasos posteriores, no ahora):**
- `POST /api/bookings` — `userId` viene de `requireAuth`, no del body.
- `POST /api/operators` — `userId` viene de `requireAuth`; bloquear si ya hay operator con ese userId.
- Nuevo `GET /api/me` — devuelve `{ user, operator | null }` para el AuthContext.
- Eventual `POST/PUT /api/tours` (cuando exista) — `requireOperator`.

**Pública sigue siendo:** `/api/health`, `/api/geo`, `/api/tours/*` (GET), `/api/search` (decidir si la atamos a sesión por antiabuso — hoy ya hay `rate-limit.ts`, alcanza para M1).

---

## 5) Orden de implementación sugerido

Cada sub-paso es chico, independiente y validable antes de pasar al siguiente.
**Orden: viajero primero, operador al final.**

1. **Instalar nada nuevo.** Confirmar que `@supabase/supabase-js` instalado alcanza. (No-op de código.)
2. **Backend: `lib/supabase-admin.ts` + `lib/auth.ts` + endpoint smoke `/api/me.ts`.**
   - Validación: con `curl -H "Authorization: Bearer <token-pegado-a-mano>"` el endpoint responde 200 con el user o 401 sin token. (Token sacado de la consola del navegador después de un `signUp` manual en un script de prueba.)
3. **Frontend: `src/lib/supabase.js`.**
   - Validación: en la consola del browser, `await supabase.auth.signInWithPassword(...)` funciona contra un user creado a mano en el dashboard de Supabase. La sesión persiste tras recargar (`getSession()` la devuelve).
4. **Frontend: `src/contexts/AuthContext.jsx` + `useAuth`, montado en `main.jsx`.**
   - Validación: un componente debug temporal muestra `user.email` o "no logged in" y reacciona a signIn/signOut sin recargar.
5. **Reemplazar `LoginView` por flujo real (signUp + signInWithPassword). Ocultar `OTPView` del switch de vistas.**
   - Mantener el look visual existente; cambiar solo los handlers.
   - Validación: registro → login → al recargar sigues logueado → signOut te saca.
6. **Reemplazar `loggedIn` / `isOperator` de `useState` por valores del context.**
   - Validación: el flujo existente (home → catalog → detail → booking) funciona idéntico con sesión real.
7. **`src/lib/authFetch.js` + atar `POST /api/bookings` a `requireAuth`.**
   - Cambia el `userName/userEmail/userPhone` del body por datos derivados del token (o se mantienen como override pero el `userId` se setea del token).
   - Validación: una reserva sin sesión retorna 401; con sesión persiste con el `userId` correcto.
8. **Schema: agregar `Operator.userId @unique` + relación a `auth.users` lógica (FK no la maneja Prisma).**
   - Sub-paso aparte: `prisma db push` + doc en `docs/migrations/2026-05-24-operator-userid.md`.
   - Migrar onboarding (`POST /api/operators`) para tomar `userId` de `requireAuth`.
   - Validación: signUp como operador → `POST /api/operators` → `GET /api/me` reporta `isOperator: true`.
9. **Logout y email en `ProfileView`.** Botón "Cerrar sesión" + mostrar `user.email`.

Cortar M1 acá. Lo demás (password reset, Google OAuth, RLS, MFA) es M1.x o posterior.

---

## 6) Qué **NO** hacer en este paso

Para mantener el plan acotado y revisable:

- **No instalar nada todavía** — la decisión sobre `@supabase/ssr` queda confirmada en este plan; instalar `@supabase/ssr` queda descartado.
- **No tocar `prisma/schema.prisma`** — `Operator.userId` se introduce recién en el sub-paso 8, con su propio `db push` documentado.
- **No tocar `src/Landing.jsx`** — está protegido por `CLAUDE.md`.
- **No reescribir `LoginView` / `OTPView`** — solo se planifican; la edición real es del sub-paso 5 en adelante.
- **No configurar RLS en Supabase** — el backend usa service role y valida user explícitamente. RLS es endurecimiento posterior, no requisito de M1.
- **No agregar Google OAuth, magic links, ni password reset** — fuera de M1 (ya quedó decidido).
- **No tocar el dashboard del operador (`DashView`) ni `NewTourView`** — esos siguen en mock; se conectan cuando `isOperator` ya viene de DB real.
- **No agregar variables nuevas a `.env.local`** — las 3 que se sumaron alcanzan. Cuando se mirroreen a Vercel se hará explícitamente al deployar M1.
- **No agregar `/api/auth/*` proxy endpoints** — el SPA habla directo con Supabase para signIn/signUp/signOut. El backend solo valida tokens.

---

## Resumen ejecutivo

Para un Vite SPA + Vercel functions, lo más simple y correcto es **un solo cliente supabase-js en el browser con sesión en localStorage** + **un cliente admin con service role en el backend que valida bearer tokens** vía `auth.getUser`. Se crean 5 archivos nuevos (`src/lib/supabase.js`, `src/lib/authFetch.js`, `src/contexts/AuthContext.jsx`, `lib/supabase-admin.ts`, `lib/auth.ts`) más un endpoint smoke `/api/me.ts`. El reemplazo en `AppDemo.jsx` es quirúrgico: dos `useState` locales (`loggedIn`, `isOperator`) pasan a leerse del `useAuth()`. El schema solo se toca al final, en su propio sub-paso, para añadir `Operator.userId`.
