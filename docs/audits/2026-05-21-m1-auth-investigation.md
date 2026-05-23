# Investigación M1: estado del auth actual

- **Fecha:** 2026-05-22
- **Rama:** `feature/m1-auth` @ `9f6a584`
- **Objetivo:** mapear el sistema de "login fake" actual y el modelo de datos relacionado, para planear el reemplazo con Supabase Auth (decisión: **un rol por cuenta** — viajero **o** operador, no ambos).
- **Documentos hermanos:** [`docs/roadmap-mvp.md`](../roadmap-mvp.md) (fase M1), [`docs/audits/2026-05-20-mvp-readiness-audit.md`](2026-05-20-mvp-readiness-audit.md).

---

## Flujo de login/registro actual

Toda la "auth" del viajero vive dentro de `src/AppDemo.jsx` y se compone de **tres vistas + dos handlers**. Ninguna pega al backend ni guarda nada persistente.

### Pantalla `login` — `LoginView` (AppDemo.jsx:1507-1543)

- **Inputs:** prefijo país readonly `+51`, input de celular (regex local `/[^0-9\s]/g` y `maxLength=11`).
- **Botón "Continuar":** `disabled` mientras `phone.replace(/\s/g, "").length < 9`. Cuando se cumple, `onClick={() => go("otp")}`. **No envía nada al backend, no llama a ningún `/api/*`.**
- **Botón "Continuar con Google":** SVG decorativo del logo de Google. `onClick={() => go("welcome")}` — salta directamente al estado autenticado sin pasar por OTP ni por OAuth real.
- **Botón "Explorar sin cuenta":** `onClick={() => go("home")}` — entra a `home` sin marcar `loggedIn`. Luego, si el usuario intenta reservar, `handleBook` (3716-3719) detecta `!loggedIn` y lo manda de vuelta a `login` con el mensaje "Inicia sesión o regístrate para reservar tu experiencia".
- **Links de Términos / Privacidad:** `href="#"` (placeholder).

### Pantalla `otp` — `OTPView` (AppDemo.jsx:1545-1586)

- **Inputs:** 4 cajas de 1 dígito (`maxLength=1`, `inputMode="numeric"`, `autoComplete="one-time-code"`).
- **Lógica:** `filled = otp.every((d) => d !== "")` → habilita botón "Verificar".
- **"Verificar":** `onClick={() => go("welcome")}`. **Acepta cualquier código de 4 dígitos.** No hay POST, no hay validación contra ningún servicio.
- **Timer:** countdown de 30s con botón "Reenviar código" cuando llega a 0 (no envía nada, solo reinicia el timer).
- **"Cambiar número":** vuelve a `login`.

### Pantalla `welcome` — `WelcomeView` (AppDemo.jsx:1588-1603)

- Pantalla de bienvenida estática ("¡Bienvenida, Alejandra!" — nombre hardcoded del mock `USER`).
- Botón "Empezar a explorar": `onClick={() => go("home")}`.
- **Clave:** cuando `go("home")` se ejecuta y el `view` actual es `welcome`, el handler `go` (línea 3709) ejecuta `setLoggedIn(true)`. **Este es el único punto donde se marca al usuario como "logueado" en toda la app.**

### Pantalla `profile` — onboarding de operador (AppDemo.jsx:2723-2877)

Este flujo **sí** habla con el backend (ver más abajo, sección "Onboarding operador").

---

## Estado de sesión actual

| Cosa | Dónde vive | Persistencia |
|---|---|---|
| `loggedIn` | `useState(false)` en `AppDemo` (línea 3692) | ❌ **ninguna** — se pierde al recargar |
| `isOperator` | `useState(false)` en `AppDemo` (línea 3596) | ❌ **ninguna** — se pierde al recargar |
| `USER` | constante mock global (línea 575): `{ name:"Alejandra Quispe", email:"ale.quispe@gmail.com", … }` | n/a, es un literal |
| Cookie `finde_session` | seteada por `POST /api/operators` (UUID aleatorio HttpOnly) | ✅ persiste en el navegador, **pero ningún endpoint la lee ni la valida** |
| `localStorage` / `sessionStorage` | no se usan para auth | ❌ |

**Resumen:** no hay sesión real. El "estar logueado" es un boolean efímero en memoria. Al recargar la página, el usuario vuelve a la vista `login` sin importar lo que haya hecho antes. La cookie que devuelve `/api/operators` se persiste en el cliente pero es dead weight: ningún handler la lee.

### Cómo se distingue viajero vs operador hoy

- **`isOperator`** boolean local (línea 3596).
- Se activa con `setIsOperator(true)` **dentro de `ProfileView` después de un `POST /api/operators` exitoso** (línea 2762).
- También se puede entrar al flujo de operador haciendo click en el card "Panel de operador" del perfil cuando `isOperator === true` (línea 2835), que navega a `dashboard`.
- **No hay forma server-side de distinguir roles.** El backend no sabe si quien pega a un endpoint es viajero, operador, o un bot anónimo.

### Logout

- Botón "Cerrar sesión" en `ProfileView` (línea 2873): `onClick={() => go("login")}`. El handler `go` detecta el cambio a `login` y ejecuta `setLoggedIn(false)` (línea 3710). **No invalida ninguna cookie ni llama al backend.**

---

## Onboarding operador

Único flujo de auth que **sí** persiste algo en DB. Está dentro de `ProfileView`, fuera del flujo de login/OTP.

### Formulario (AppDemo.jsx:2790-2833)

Campos:

| Campo | Validación cliente | Estado inicial |
|---|---|---|
| `name` (razón social) | requerido | prellena `USER.name` |
| `email` | requerido | prellena `USER.email` |
| `phone` (solo dígitos) | `replace(/\D/g, "")`, maxLength 15 | prellena `USER.phone` |
| `city` | requerido | prellena `USER.city` |
| `ruc` | `/^\d{11}$/` | vacío, placeholder `20612345678` |
| `opAcceptTerms` | checkbox obligatorio | `false` |

`opFormValid = name && email && phone && city && opRucValid && opAcceptTerms`.

### Submit: `POST /api/operators`

Llamada: `fetch("/api/operators", { method: "POST", body: JSON.stringify({ name, email, phone, city, ruc }) })`.

### Backend: `api/operators.ts`

- **Validación con zod:**
  - `name`: 3-100 chars
  - `email`: lowercase, email, max 150
  - `phone`: `/^\d{8,15}$/`
  - `city`: 2-50 chars
  - `ruc`: `/^\d{11}$/`
- **Rate limit:** 3/min por IP, retorna `429` con `Retry-After`.
- **Persistencia:**
  ```ts
  await db.operator.create({
    data: { name, email, phone, city, verified: false },
    // RUC validado pero NO persistido — comment en línea 82-83:
    // "TODO: persistir ruc cuando agreguemos la columna en Pista B"
  });
  ```
- **Errores:** `P2002` (email duplicado) → `409`. Otros → `500`.
- **Sesión:**
  ```ts
  const sessionToken = randomUUID();
  res.setHeader("Set-Cookie", `finde_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000` + (prod ? "; Secure" : ""));
  res.status(200).json({ operator, sessionToken });
  ```
  - **El UUID nunca se guarda en DB.** No hay tabla `Session`.
  - Comentario en el header del archivo (líneas 8-9): *"El sessionToken NO se persiste en DB en este sprint: la cookie firmada por el dominio es suficiente para mostrar el dashboard demo. En producción (Pista B) se agrega tabla Sessions con expiración y revocación."*
- **Ningún endpoint lee la cookie.** Confirmado vía grep: no hay match para `finde_session` ni en `/lib` ni en `/api` (excepto en el propio `api/operators.ts` que la setea).

### Confirmación del hallazgo de la auditoría

✅ La auditoría previa decía "cookie de sesión no se persiste ni se valida". **Confirmado al 100%:**
1. El UUID es `randomUUID()` y se descarta inmediatamente después de mandarlo al cliente.
2. No existe middleware, no existe `GET /api/me`, no existe ningún endpoint que la lea.
3. El frontend tampoco la usa: `submitOperator` (línea 2740) hace `setIsOperator(true)` localmente y descarta `sessionToken` del response.

---

## Modelo de datos actual (relevante a auth)

### `prisma/schema.prisma`

```prisma
model Operator {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  phone     String?
  verified  Boolean  @default(false)
  city      String?
  createdAt DateTime @default(now())

  tours     Tour[]
}
```

- **`email` con `@unique`** — base útil si decidimos vincular `Operator.email` con `auth.users.email` de Supabase. Pero **no hay FK** a ninguna tabla de usuarios; el `Operator` es autónomo.
- **No hay `password`, `hashedPassword`, `userId`, `authUserId`, ni nada equivalente.** Los operadores se crean sin credenciales y nunca pueden "iniciar sesión" — solo existir como row.
- **No hay campo `role`** en `Operator` ni en ningún otro modelo.
- **No hay modelo `User`, `Traveler`, `Customer`, `Account`, `Session`.** Confirmado leyendo el schema completo (5 modelos: `Operator`, `Tour`, `Booking`, `SearchLog`, `FeaturedSearch`).
- **`Booking.userEmail` es un `String` libre**, sin FK. Los viajeros no son entidades en DB — son strings sueltos en cada booking.

### Implicación para M1

- Para ligar `Operator` con `auth.users` de Supabase hay dos opciones razonables:
  - **Opción A:** agregar columna `userId String? @unique` a `Operator` con FK lógica a `auth.users.id` (UUID). Mantener `email` como dato de contacto, pero la identidad pasa a ser el `userId`.
  - **Opción B:** usar `Operator.email` como llave de unión con `auth.users.email`. Más frágil (el email puede cambiar en Supabase Auth) pero no requiere migración.
- Los viajeros, hoy inexistentes en DB, **no necesitan tabla propia para M1**: pueden ser identificados directamente por su `auth.users.id` en Supabase. Si en algún momento queremos perfil de viajero (avatar, idioma preferido, etc.), se agrega un modelo `TravelerProfile` con `userId` como PK.

---

## Endpoints de auth y protección actual

### ¿Hay `api/auth/*` o equivalentes?

❌ **No.** Verificado con `find api -name '*auth*'` — sin resultados.

### ¿Algún endpoint requiere autenticación?

❌ **Ninguno.** Repaso de cada endpoint:

| Endpoint | Método | ¿Requiere auth? | Comentario |
|---|---|---|---|
| `/api/health` | GET | no | público intencional |
| `/api/geo` | GET | no | público (resuelve ciudad del visitante) |
| `/api/tours` | GET | no | público, correcto |
| `/api/tours/[id]` | GET | no | público, correcto |
| `/api/search` | POST | no | público (con rate limit) |
| `/api/bookings` | POST | no | **debería requerir auth tras M1** — hoy cualquiera puede crear una reserva con un email arbitrario |
| `/api/operators` | POST | no | onboarding inicial; pero **no hay forma de iniciar sesión** después: la cuenta queda creada y huérfana |
| `/api/ai/generate-description` | POST | no | **debería requerir auth de operador tras M1** (consume Claude → costo) |
| `/api/ai/generate-quechua` | POST | no | mismo caso |

### Middleware de auth

❌ **No existe.** No hay archivo `middleware.ts` (Vercel/Next) ni helper compartido en `/lib` para validar sesión. Ningún endpoint llama a `getCookie`, `verifySession`, `requireAuth`, ni nada similar.

### Validación de "quién pide"

- Lo único que se valida es la **IP** (vía `rate-limit.ts`), no la identidad. Sirve para evitar abuso, no para autorizar.
- `api/bookings.ts` confía en los strings `userName`, `userEmail`, `userPhone` del body sin verificar que correspondan a un usuario real.
- `api/operators.ts` no exige que el RUC esté validado contra SUNAT (TODO en código).

---

## Dependencias instaladas

### Relacionadas con Supabase

```json
"@supabase/supabase-js": "^2.104.1"
```

✅ **Cliente JS de Supabase está instalado**, pero **no se importa en ningún archivo** del repo (`grep -rnE "supabase|@supabase|createClient" lib api src` → sin matches). Es una dependencia heredada que nunca se enchufó.

### NO instaladas (van a hacer falta)

- `@supabase/ssr` — helper recomendado por Supabase para serverless functions y SSR. Maneja correctamente el ciclo de cookies en `@vercel/node`. **Va a hacer falta.**
- ~~`@supabase/auth-helpers-*`~~ — deprecadas a favor de `@supabase/ssr`. No instalar.

### Otras dependencias relevantes

- `zod` ✅ (validación de bodies)
- `@vercel/node` ✅ (tipos de request/response)
- No hay `jsonwebtoken`, `jose`, `iron-session`, ni `next-auth` — no se mezclan stacks.

---

## Gaps para Supabase Auth (un rol por cuenta)

En orden sugerido de implementación:

1. **Configurar el proyecto en Supabase Dashboard.**
   - Habilitar providers: email + password (mínimo). Decidir si activar magic link y/o Google OAuth para M1 o dejarlos para después.
   - Configurar URLs de redirect: `https://finde.pe/auth/callback`, `http://localhost:3000/auth/callback` (vercel dev).
   - Activar email templates en español (Supabase los tiene por default en inglés).
   - Decidir política de confirmación de email: ¿obligatoria antes de poder reservar?

2. **Instalar `@supabase/ssr`.** Sumar a `package.json`. Crear `lib/supabase-server.ts` (cliente para handlers de `/api`) y `lib/supabase-browser.ts` o equivalente para el frontend.

3. **Sumar env vars:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (públicos, expuestos al cliente), `SUPABASE_SERVICE_ROLE_KEY` (solo backend, jamás al cliente). Espejarlos en Vercel (`vercel env add`).

4. **Schema:** decidir entre Opción A (columna `userId` en `Operator`) u Opción B (unión por `email`). Si Opción A → `prisma db push` + documentar en `docs/migrations/`. Limpiar los **20 operadores zombie** antes de tocar el schema (tienen emails de prueba que pueden colisionar con usuarios reales de Supabase Auth).

5. **Endpoint `GET /api/me`** — devuelve el usuario actual (de la sesión Supabase) más, si existe, el `Operator` ligado. Es la "fuente de verdad" del rol que el frontend va a consumir al cargar.

6. **Middleware o helper `requireAuth`** en `/lib` que:
   - Lee la sesión de Supabase desde la cookie.
   - Devuelve `{ user, role: "operator" | "traveler" }` (con regla: `role = "operator"` si existe row en `Operator` ligado a este `user.id`, sino `"traveler"`).
   - Devuelve `401` si no hay sesión y el endpoint la exige.

7. **Reemplazar `LoginView` y `OTPView`** por:
   - Sign-in / sign-up con email + password (o magic link, según decisión del paso 1).
   - Selector inicial **"¿Eres viajero o operador?"** antes del registro — porque la decisión es de **un rol por cuenta** y al crear la cuenta hay que decidir si se crea o no el row en `Operator`.
   - El `WelcomeView` puede mantenerse como confirmación post-signup.

8. **Reemplazar `useState` locales por contexto:** `loggedIn` e `isOperator` desaparecen; en su lugar un `AuthContext` que lee la sesión Supabase y expone `{ user, role, loading }`. Persistencia automática vía cookie de Supabase.

9. **Migrar el onboarding de operador (`POST /api/operators`):**
   - Ya no crea la cuenta desde cero — exige que el usuario esté autenticado en Supabase Auth.
   - El endpoint pasa a ser "convertir mi cuenta de viajero en cuenta de operador" o, si decidimos pedir el rol en el signup, simplemente "completar perfil de operador".
   - Persistir `ruc` (columna nueva en `Operator` o tabla separada `OperatorProfile`).
   - Resetear la cookie `finde_session` artesanal — ya no aplica, Supabase maneja todo.

10. **Proteger endpoints:**
    - `POST /api/bookings` → exige sesión (puede ser viajero, no se exige operador).
    - `POST /api/ai/generate-description`, `/api/ai/generate-quechua` → exige rol operador.
    - `POST/PUT/DELETE /api/tours` (cuando exista en M2) → exige rol operador + ownership por `operatorId`.
    - `GET /api/operators/me/*` (cuando exista en M3) → exige rol operador.

11. **Logout:** botón en `ProfileView` debe llamar `supabase.auth.signOut()` + redirección a `/`.

12. **Borrado de la cuenta de prueba `USER`:** la constante mock con datos de "Alejandra Quispe" debe morir — el frontend leerá el usuario real desde `AuthContext`.

---

## Decisiones pendientes para discutir con el usuario

Antes de empezar a escribir código en M1, conviene cerrar estas decisiones:

1. **Providers de login para M1.** Mínimo viable: email + password. ¿Sumamos también magic link y/o Google OAuth desde el día 1, o los dejamos para post-MVP? (Recomendación: empezar solo con email + password para reducir superficie; sumar Google después si los usuarios lo piden.)

2. **Confirmación de email obligatoria.** ¿El usuario puede usar la app sin confirmar email, o lo bloqueamos hasta confirmar? Impacta el flujo de reserva: si no confirma → no puede reservar. (Recomendación: obligatoria para reservar, opcional para explorar.)

3. **Cómo se elige el rol en el signup.** Tres caminos:
   - (a) Pantalla previa "¿Vienes a explorar o a vender tours?" antes del formulario de signup.
   - (b) Un solo signup genérico (todos arrancan como viajero) + flujo separado "convertirme en operador" desde `ProfileView` (como hoy).
   - (c) Dos URLs distintas (`/signup` y `/operadores/signup`).
   - El usuario ya decidió "un rol por cuenta", pero la UX del momento de elección sigue abierta.

4. **Vínculo `Operator ↔ auth.users`** — Opción A (columna `userId`) vs Opción B (unión por email). Opción A es más robusta pero requiere migración; B es más rápida pero frágil. (Recomendación: A.)

5. **Limpieza de operadores zombie.** ¿Borrar los 20 zombies antes de M1 (recomendado, así Supabase Auth arranca con DB limpia) o dejarlos y filtrarlos en queries? (Recomendación: borrar — son todos cuentas de prueba.)

6. **¿Persistimos `ruc` ahora?** El RUC se valida en formato pero no se guarda en DB (TODO histórico). M1 es buen momento para sumarlo si vamos a tocar `Operator` de todas formas.

7. **¿Qué pasa con los 16 bookings existentes?** Tienen `userEmail` libre, sin FK a ningún usuario. ¿Los dejamos huérfanos, los borramos, o intentamos ligarlos a `auth.users` cuando esos emails se registren? (Recomendación: dejarlos — son datos de prueba; en M4 cuando renombremos `pending_payment` → `pending_coordination` los limpiamos.)

8. **Supabase Pro ($25/mes).** El free tier pausa el proyecto tras 7 días sin tráfico de DB. ¿Migrar a Pro ya, o esperar a tener operadores piloto activos? (Recomendación: esperar — mientras estés tú solo testeando no se va a pausar.)

9. **Rate limit en endpoints autenticados.** Hoy el rate limit es por IP. Tras M1 conviene complementar con rate limit por `userId` (o `user.id + IP`) para evitar que un usuario malicioso autenticado abuse del endpoint de generación con Claude. ¿Lo metemos en M1 o lo dejamos para después? (Recomendación: dejar para después salvo que veamos abuso.)
