# Auditoría de preparación para MVP — Finde

- **Fecha:** 2026-05-22
- **Rama / commit:** `main` @ `c1da37a`
- **Alcance:** auditoría sin modificaciones. Solo lectura del código y conteo en DB.

---

## Resumen ejecutivo

El proyecto tiene una **demo visualmente completa** con muchos flujos hardcoded y un **backend funcional pero todavía parcial**: la lectura de tours, la búsqueda IA y la creación de "intención de reserva" sí pegan a Postgres; la **autenticación, el pago real, la persistencia de tours del operador, el chat WhatsApp transaccional y los emails de confirmación no existen**. El MVP en su definición (operador registra → publica tour → viajero reserva → paga real → recibe confirmación por WhatsApp) está a roughly **40–50 % de cobertura**: tienes la mitad pública del marketplace lista, pero falta toda la mitad de "transacciones reales".

Los **3 gaps más críticos** son: (1) **auth con roles**, (2) **persistencia real de tours desde el dashboard del operador**, (3) **pasarela de pago real** + confirmación transaccional (email/WhatsApp).

---

## Tabla de estado por área

| Área | Estado | Detalle | Esfuerzo estimado |
|---|---|---|---|
| Autenticación viajero | ❌ | Login es UI fake (OTP de 4 dígitos sin verificación, Google es botón decorativo, "Explorar sin cuenta" salta todo). `loggedIn` es un boolean local. | Alto (3–5 días) — Supabase Auth o Clerk + integración con `isOperator` |
| Autenticación operador | 🟡 | `POST /api/operators` crea row en DB y setea cookie `finde_session` con UUID aleatorio, **pero el UUID no se persiste, no hay middleware que valide la cookie, y `isOperator` se pierde al recargar**. | Medio (2–3 días) — tabla Sessions + middleware + login para operadores ya creados |
| Roles operador/viajero | ❌ | No hay columna `role` en DB ni distinción en el API. `isOperator` solo vive en estado local de AppDemo. | Bajo si se ataca junto con auth |
| Config operador (dashboard) | 🟡 | DashView existe con 4 tabs (Reservas/Ingresos/Mi Negocio/Mis Tours), pero **todo lo que muestra son mocks**: `OP_BK` constante (6 bookings ficticios), `EARN` semanas inventadas, `biz` state con RUC/CCI hardcoded. | Alto (3–4 días) — endpoints `GET /api/operators/me/bookings`, `GET /api/operators/me/earnings`, `PATCH /api/operators/me` |
| Creación de tours por operador | ❌ | `handleCreateTour` solo hace `setOpTours([...prev, ...])` en estado local. No hay `POST /api/tours`. Se pierde al recargar. | Alto (3–4 días) — `POST/PUT/DELETE /api/tours` + autorización por operatorId + regenerar embedding (Voyage) on-write |
| Edición de tours | ❌ | `handleSaveTour` igual: solo estado local. No persiste. | Junto con el anterior |
| Onboarding operador | 🟡 | ProfileView tiene formulario con RUC (regex 11 dígitos), pero el RUC no se persiste (`api/operators.ts` valida formato y descarta — comment "TODO Pista B"). Sin verificación SUNAT, sin confirmación de email. | Medio (1–2 días) — añadir columna `ruc`, persistirla, marcar `verified=false` y dejar verificación manual |
| Pasarela de pagos | ❌ | **Sin librería instalada** (no Culqi, no MercadoPago, no Stripe, no PayU SDK en `package.json`). `POST /api/bookings` devuelve `paymentInstructions = { method: "yape", phone: "999-111-222", note: "Mock visual para demo. En producción se conecta a PayU sandbox." }`. Status del booking queda en `pending_payment` para siempre. | Alto (4–6 días) — integración real (Culqi o MercadoPago para tarjeta + Yape/Plin via deeplink/QR), webhook de confirmación, estado del booking |
| WhatsApp | 🟡 | Solo link `wa.me` con número **hardcoded `+51 987 654 321`** (`buildWhatsAppLink`, línea 2205, con TODO "Fase 2 traer el número real del operador"). Sin Twilio, sin envío automático. | Medio (1–2 días) — usar `operator.phone` real + plantilla de mensaje; o alto (3–5 días) si se quiere WhatsApp Business API |
| Emails transaccionales | ❌ | Sin Resend/SendGrid/Postmark instalado. POST `/api/bookings` no envía nada. | Medio (1 día) — Resend + 2 plantillas (viajero + operador) |
| Booking E2E | 🟡 | Frontend → step 1 fecha+guests → step 2 datos → step 3 método de pago → `POST /api/bookings` (✅ persiste) → step 4 voucher. Pero: voucher muestra RUC/MINCETUR **inventados hardcoded**; `status` nunca transiciona; ningún canal de confirmación se dispara. | Bajo si auth+pago resueltos (1 día de integración) |
| Búsqueda IA semántica | ✅ | `POST /api/search` con Voyage embeddings + pgvector + Claude Sonnet + cache `FeaturedSearch`. 40/40 tours con embedding. 71 SearchLogs ya escritos. Frontend la consume (`runAiSearch`). | — |
| Reviews | ❌ | `generateMockReviews(tour)` produce 3–4 reseñas determinísticas por hash del id. **No existe modelo `Review` en `schema.prisma`** y no hay endpoint. La UI muestra reseñas, pero todas son sintéticas. | Medio (2 días) — modelo `Review`, `POST /api/reviews`, vincular a `Booking` completado |
| Notificaciones in-app | ❌ | Constante `NOTIFS` con 6 entradas hardcoded (líneas 379–386). Sin tabla, sin endpoint, sin push. | Bajo (1 día) si solo es feed in-app; alto si push real |
| Geo / ciudad | ✅ | `/api/geo` resuelve headers `x-vercel-ip-*` con fallback a Lima. |
| AI content B2B (descripción + quechua) | ✅ | `/api/ai/generate-description` y `/api/ai/generate-quechua` con Claude Sonnet + tool_use forzado. **Pero ninguno está conectado todavía al dashboard del operador** (NewTourView no los llama). | Bajo (medio día) — botón en NewTourView |

---

## Detalle por área

### 1) Inventario del repo

```
api/
  ai/generate-description.ts    POST  ficha pública por Claude
  ai/generate-quechua.ts        POST  traducción a quechua sureño
  bookings.ts                   POST  crea reserva pending_payment + mock Yape
  geo.ts                        GET   ciudad por headers Vercel
  health.ts                     GET   healthcheck
  operators.ts                  POST  registra operador (verified=false)
  search.ts                     POST  búsqueda semántica con cache
  tours/index.ts                GET   lista tours (limit ≤ 50)
  tours/[id].ts                 GET   detalle tour
lib/
  anthropic.ts  db.ts  voyage.ts  geo.ts  rate-limit.ts  search-cache.ts  tour-select.ts
prisma/
  schema.prisma                 (5 modelos)
  migrations/0_init/            (única migración)
scripts/
  generate-embeddings.ts        backfill embeddings Voyage
  prebuild-featured-searches.ts pre-warm cache de queries
  seed-demo-operator.ts         seed del operador demo
  update-images.ts / update-2-images.ts  scripts de imágenes
src/
  App.jsx        (69 líneas)   gate landing vs demo + password "finde2026"
  AppDemo.jsx    (3886 líneas) toda la app móvil con CSS in-string
  Landing.jsx    (811 líneas)  landing pre-registro
  main.jsx       (10 líneas)
```

**Archivos más grandes:** `src/AppDemo.jsx` (3886 líneas, contiene el CSS + todas las vistas + handlers + mocks); `src/Landing.jsx` (811); `api/search.ts` (339); `api/ai/generate-description.ts` (271).

**Dependencias relevantes en `package.json`:**
- IA: `@anthropic-ai/sdk@^0.91`, `voyageai@^0.2`
- DB: `@prisma/client@^6.19`, `@supabase/supabase-js@^2.104` (instalado pero **no se importa en ningún archivo de `/api`**)
- Validación: `zod@^4.3`
- **No instalado:** ninguna lib de pago (Culqi, Stripe, MercadoPago, PayU), ninguna lib de auth (Clerk, NextAuth, Auth.js), ningún cliente de email (Resend, SendGrid, Postmark), ningún SDK de Twilio/WhatsApp.

### 2) Autenticación

- **Frontend (viajero):**
  - `LoginView` (línea 1507): pide celular, botón "Continuar" navega a `OTPView` sin enviar nada.
  - `OTPView` (1545): 4 dígitos cualquiera → `go("welcome")`. No hay POST.
  - "Continuar con Google" (1534) y "Explorar sin cuenta" (1538) saltan al estado autenticado.
  - `loggedIn` (3692) es boolean local que se setea en `go()` cuando vienes de "welcome".
- **Backend (operador):**
  - `POST /api/operators` crea Operator, setea cookie `finde_session=<uuid>` HttpOnly. **El UUID es aleatorio y nunca se guarda en DB.**
  - Ningún endpoint lee la cookie. No hay middleware. No hay `GET /api/me`. No hay logout server-side.
- **Roles:** `isOperator` es estado local en `AppDemo` (línea 3596). El operador "real" persistente coexiste con cualquier viajero, no hay forma de retomar la sesión tras recargar.

**Estado:** ❌ no existe sistema de auth funcional con persistencia y roles.

### 3) Configuración del operador

- **Dashboard:** `DashView` (2879) con 4 tabs.
- **Tab Reservas:** consume `OP_BK` (constante mock 577–583).
- **Tab Ingresos:** consume `EARN` (constante 586–...).
- **Tab Mi Negocio:** `biz` state con RUC `20612345678`, MINCETUR `VER-2024-00891`, BCP, CCI, todos hardcoded (2889–2893). El botón "Guardar" solo cambia `bizSaved` local.
- **Tab Mis Tours:** lista `opTours`, que se hidrata tomando los primeros 4 tours de `/api/tours` (3627–3653). Esos tours no le "pertenecen" al operador real — es un truco visual.
- **Crear/editar tour:** `handleCreateTour` (3778) y `handleSaveTour` (3743) **solo modifican `setOpTours` y `setTours` locales**. No hay `POST /api/tours`. Al recargar, tour creado desaparece.
- **Ver mis bookings reales:** no hay endpoint `GET /api/operators/:id/bookings`.

**Estado:** 🟡 — el dashboard existe y luce, pero el operador real no puede operar nada que persista.

### 4) Pasarela de pagos

- Sin SDK de pago instalado.
- Frontend (`BookingView`, 2613): radios Yape/Plin/Tarjeta/PagoEfectivo. Al hacer clic en "Pagar" → `submitBooking` → `POST /api/bookings`.
- Backend (`api/bookings.ts`): crea `Booking` con `status: "pending_payment"` y devuelve:
  ```json
  { "paymentInstructions": { "method": "yape", "phone": "999-111-222", "note": "Mock visual para demo. En producción se conecta a PayU sandbox." } }
  ```
- No hay webhook, no hay transición de estado, no hay reintento, no hay reembolsos.

**Estado:** ❌

### 5) WhatsApp

- `buildWhatsAppLink(trip)` (línea 2203): genera link `wa.me` con **teléfono hardcoded `+51 987 654 321`** (mismo comentario advierte "Fase 2 traer el número real del operador").
- Usado en `TripDetailView` ("Contactar agencia por WhatsApp") y en mensaje cuando no hay fechas (2547).
- No hay envío automático tras booking, no hay Twilio, no hay plantillas verificadas de WhatsApp Business.

**Estado:** 🟡 (link decorativo con teléfono falso, no chat real).

### 6) Booking E2E

Flujo real al hacer clic en "Reservar":
1. `DetailView` → `handleBook` (3716): si `!loggedIn` → fuerza login (que es fake). Si logged-in → `go("booking")`.
2. `BookingView` paso 1: fecha + número de personas, validados contra `tour.days/excludedDates/addedDates`.
3. Paso 2: nombre, teléfono (regex 8–15 dígitos), email, DNI (mín 6 chars).
4. Paso 3: elige Yape/Plin/Tarjeta/PagoEfectivo. Botón "Pagar S/ X con Yape" llama `submitBooking`.
5. `submitBooking` (2395):
   - Si `tour.id` es numérico (mock local) → simula localmente, salta backend.
   - Si es CUID → `POST /api/bookings`. Si responde 200 → `setServerBooking(data.booking)` y muestra paso 4 (voucher).
6. Paso 4 (voucher): muestra `VoucherDetail` con código real, agencia con **RUC/MINCETUR hardcoded** (2308–2310: `20612345678 · VER-2024-00891`).
7. El trip también se registra localmente en `setTrips` para que aparezca en TripsView.

**Lo que pasa en realidad en DB:** un `Booking` queda en `pending_payment` para siempre. Tabla `Booking` ya tiene 16 filas creadas — todas en ese estado (no validado, pero ningún flujo las muta).

**Estado:** 🟡 — persiste la intención, pero el "pago / confirmación / aviso a operador" es vaporware.

### 7) Backend / API (resumen tabular)

| Endpoint | Método | DB | Validación | Rate-limit | Observación |
|---|---|---|---|---|---|
| `/api/health` | GET | — | — | — | OK |
| `/api/geo` | GET | — | — | — | Fallback Lima si no hay headers de Vercel |
| `/api/tours` | GET | ✅ Prisma | zod | — | `limit` topado a **50 hardcoded**, sin offset/cursor |
| `/api/tours/[id]` | GET | ✅ Prisma | zod | — | OK |
| `/api/bookings` | POST | ✅ Prisma | zod | 5/min | Mockea instrucciones Yape; status `pending_payment` perpetuo |
| `/api/operators` | POST | ✅ Prisma | zod | 3/min | RUC validado pero **no persistido**; cookie sin backend que la valide |
| `/api/search` | POST | ✅ Prisma + raw SQL pgvector | zod | 10/min | Cache de queries famosas, fallback a top-3 semántico si Claude falla |
| `/api/ai/generate-description` | POST | — | zod | sí | No conectado a NewTourView |
| `/api/ai/generate-quechua` | POST | — | zod | sí | No conectado a NewTourView |

Faltan endpoints típicos del MVP: auth (`/api/auth/*`), `POST/PUT /api/tours`, `POST /api/reviews`, `GET /api/operators/me/*`, `POST /api/payments/webhook`.

### 8) Base de datos

Modelos en `schema.prisma`: `Operator`, `Tour`, `Booking`, `SearchLog`, `FeaturedSearch`.
Falta para MVP: `Review`, `Session` (auth), `Payment` o `PaymentEvent` (gateway), `Notification` (si se persisten).

**Counts en producción** (Supabase, `aws-1-sa-east-1`, vía script temporal ya eliminado):

| Tabla | Filas |
|---|---:|
| Operator | **29** (9 con tours, 20 zombies) |
| Operator verificados | 9 |
| Tour | **40** (40 con embedding ✅) |
| Booking | 16 |
| SearchLog | 71 |
| FeaturedSearch | 5 |

**Operadores zombie confirmados: 20.** La mayoría son cuentas de prueba con email `ale.qui*spe@gmail.com` (10+ variantes), `testop-1@ejemplo.com`, `apurimac-1777436686@finde.pe`. Listado completo disponible si se requiere para limpieza.

### 9) Otros componentes

- **Reviews:** ❌ no hay modelo en DB. `generateMockReviews(tour)` (542) genera 3–4 reseñas determinísticas por hash; el pool de textos (`REVIEW_TEXTS_BY_CATEGORY`, 470) y autores (`REVIEW_AUTHORS`, 454) son listas en código. Las "39 reviews curadas dead code" antiguas (diccionario `REVIEWS`) fueron eliminadas (Fase 3.1, comentario línea 449) — lo que queda hoy son **mocks generados, no curados**.
- **Notificaciones:** ❌ `NOTIFS` constante de 6 entradas (379–386). Vista funciona, datos no.
- **Búsqueda IA:** ✅ funcional end-to-end. 40 tours con embedding, 71 logs.
- **Emails transaccionales:** ❌ no existen. Sin cliente de email instalado.
- **AI B2B (generate-description / generate-quechua):** endpoints ✅, **pero no enchufados a la UI de operador**.

### 10) Pendientes y deuda técnica conocidos

| # | Pendiente | Estado actual |
|---|---|---|
| 1 | Operadores zombie en DB | **Confirmado: 20** (mayoría son cuentas de prueba de "Alejandra Quispe"). |
| 2 | Tipografía TCard vs GCard | **Confirmado**: distintos class names (`.tc-tl` vs `.gc-t`). Requiere armonizar `font-family/size/weight` en CSS. |
| 3 | `/api/tours` con tope duro `limit ≤ 50` | **Confirmado**: zod `max(50).default(20)`. **No hay paginación** (`offset`/`cursor`). MVP la va a necesitar cuando el catálogo crezca. |
| 4 | 39 reviews curadas como dead code | **Eliminadas** en Fase 3.1 (comentario línea 449). Lo que queda hoy es `REVIEW_TEXTS_BY_CATEGORY` (un pool, no las 39 originales) usado por el generador determinístico. No es dead code: se usa. |
| 5 | Tag `pre-merge-tours-db-i18n` apuntando a commit incorrecto | **Confirmado**: el tag apunta a `c1da37a` (HEAD actual). Si la intención era marcar el estado *previo* al merge, el target correcto sería el último commit del branch base — `7392abe fix(landing): mensaje compartir whatsapp` solo está 5 commits atrás en `main` y ya es post-merge en cuanto a contenido. El tag está mal puesto. |

---

## Lo que está LISTO (no tocar para MVP)

- ✅ Schema Prisma con `Tour`, `Operator`, `Booking`, `SearchLog`, `FeaturedSearch`, extensión `pgvector`.
- ✅ Tours en DB: 40 filas, 40 con embedding Voyage de 1024 dim, listos para búsqueda semántica.
- ✅ Frontend público (Landing.jsx) — además, regla en CLAUDE.md prohíbe tocarlo.
- ✅ `GET /api/tours` y `GET /api/tours/:id` con zod + Prisma + `LIST_SELECT`/`DETAIL_SELECT`.
- ✅ `POST /api/search` con Voyage + pgvector + Claude + cache `FeaturedSearch` + fallback.
- ✅ `POST /api/ai/generate-description` y `POST /api/ai/generate-quechua` con tool_use y reintento.
- ✅ `GET /api/geo` con fallback a Lima.
- ✅ `lib/db.ts`, `lib/anthropic.ts`, `lib/voyage.ts`, `lib/rate-limit.ts`, `lib/search-cache.ts`.
- ✅ Deploy en Vercel a `finde.pe`, env vars sincronizadas, build verde.

---

## Gaps críticos para MVP (priorizados — ruta sugerida, no decisión)

1. **Auth real con roles** (viajero / operador). Sin esto nada del resto se sostiene: no se puede atribuir tour al operador, ni booking al viajero, ni reviews. Opciones: Supabase Auth (ya tienes Supabase) o Clerk.
2. **Persistencia de tours desde el dashboard del operador.** `POST/PUT/DELETE /api/tours` con autorización por `operatorId` derivado de la sesión, regenerando embedding al guardar (o asincrónicamente). Hoy `handleCreateTour` y `handleSaveTour` están a un fetch de funcionar — la deuda es backend, no UI.
3. **Pasarela de pago real.** Decisión a tomar: Culqi (más simple, tarjeta + Yape) vs MercadoPago vs PayU. Hay que añadir SDK, `POST /api/payments/intent` o equivalente, webhook que transicione `Booking.status` de `pending_payment` → `confirmed`, y manejar fallos/timeouts.
4. **Notificación transaccional al confirmar booking.** Mínimo: email (Resend, 1 día) para viajero y para operador. Idealmente: WhatsApp (link `wa.me` ya estructurado, solo cambiar a `operator.phone` real). Esto incluye eliminar el RUC/MINCETUR hardcodeado del voucher.
5. **`GET /api/operators/me/bookings`** y endpoint de perfil/datos comerciales para que el dashboard del operador deje de ser mock. Va junto con (1).
6. **Modelo `Review` + `POST /api/reviews`** (con guard: solo si hay `Booking` `completed`). Reemplazar `generateMockReviews`.
7. **Limpieza de zombies y de hardcodes** (20 operators sin tours, número WhatsApp fijo, RUC/MINCETUR fijo en voucher, etc.) — barrida final pre-lanzamiento, no urgente.
8. **Mover el tag `pre-merge-tours-db-i18n`** a su commit correcto (o eliminarlo si ya no aplica) — limpieza de Git, no MVP.
