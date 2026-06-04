# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

**Finde** is a mobile-first marketplace for Peru tourism experiences with AI-powered semantic search and Quechua language support. The project is in pre-launch and being submitted to MINCETUR / Emprende TEC / ProInnóvate / Startup Perú contests.

Production: deployed to **finde.pe** via Vercel (project `mrcancis-projects/finde`).

## Estado del proyecto (junio 2026)

- Proyecto **`tours-db-i18n` COMPLETADO**: tours migrados de array hardcoded a DB, **40 tours con embeddings Voyage**, 6 categorías UI sincronizadas con el enum DB, skeleton loading en grid y carruseles, dropdown AI_SUGGESTIONS funcional.
- **M1 (Auth con Supabase Auth) COMPLETADO y EN PRODUCCIÓN** (finde.pe, `main` @ `b214307`): auth real email+password, sesión persistente en localStorage, logout real, reservas y onboarding de operador ligados a la identidad del token, `isOperator` derivado de la DB. Plan: [`docs/m1-auth-plan.md`](docs/m1-auth-plan.md). **`main` tiene solo M1.**
- **M2 (Tours del operador + medios) COMPLETO y validado, pero EN LA RAMA `feature/m2-operator-tours` — NO mergeado a `main`, NO en producción todavía**: CRUD real de tours del operador (crear/editar/borrar/pausar), upload de imágenes a Supabase Storage (signed URL, subida directa navegador→Storage), y las correcciones de la auditoría aplicadas (publicación honesta sin moderación falsa, onboarding sin datos mock, comisión 15% oculta en etapa piloto). `requireOperator` protege todos los endpoints de escritura; los tours pausados quedan invisibles en catálogo/búsqueda/detalle/booking pero visibles en el dashboard del operador. Todo lo de M2 descrito más abajo (endpoints, libs, Storage, columnas `active`/`startTime`) vive en esta rama, aún sin desplegar.
- **Próximo:** continuar el MVP end-to-end (M4+). Ver [`docs/roadmap-mvp.md`](docs/roadmap-mvp.md) (fases M1-M6).
- **Antes de lanzar auth a usuarios reales:** reactivar "Confirm email" en Supabase (desactivado para pruebas) y cargar las credenciales Supabase en Vercel (los 3 entornos).
- **Etapa piloto:** sin comisión (link directo a WhatsApp); el 15% está oculto en la UI y se reactiva cuando se cobre.
- Auditoría de estado: [`docs/audits/2026-05-20-mvp-readiness-audit.md`](docs/audits/2026-05-20-mvp-readiness-audit.md).

## Archivos protegidos

- **`src/Landing.jsx`** — NO modificar bajo ninguna circunstancia. Si una tarea requiere tocarlo, confirmar **explícitamente** con el usuario antes de cualquier edición.
- **`prisma/schema.prisma`** — solo modificar vía migraciones planeadas. Para cambios de schema usar `prisma db push` (NO `migrate dev`, por drift con extensiones Supabase) y documentar el cambio en `docs/migrations/`.

## Stack

- **Frontend**: Vite 8 + React 19 (SPA, mobile-first, no router library)
- **Backend**: Vercel Serverless Functions in `/api/` (TypeScript, `@vercel/node`)
- **Database**: Supabase Postgres with `pgvector` and `pg_trgm` extensions
- **ORM**: Prisma 6 (`previewFeatures = ["postgresqlExtensions"]`)
- **AI**: Claude Sonnet 4.6 (`@anthropic-ai/sdk`, model id `claude-sonnet-4-6` — fuente de verdad: `lib/anthropic.ts`) para búsqueda en lenguaje natural y generación de contenido para operadores
- **Embeddings**: Voyage AI (`voyageai`, 1024-dim vectors) for semantic search via `pgvector`
- **Validation**: `zod`

## Commands

```bash
npm run dev              # Vite dev server (frontend only, HMR)
vercel dev               # Full stack local: Vite + /api/ functions (use this for backend work)
npm run build            # Production build of frontend (outputs to dist/)
npm run preview          # Preview production build locally
npm run lint             # Run ESLint

npm run db:generate      # prisma generate (regenerate client after schema changes)
npm run db:migrate       # prisma migrate dev (NO usar por drift con extensiones Supabase — preferir `prisma db push`)
npm run db:migrate:deploy# prisma migrate deploy (apply pending migrations in CI/prod)
npm run db:studio        # prisma studio (DB GUI)
npm run db:seed          # tsx prisma/seed.ts (seed sample tours/operators)
```

Para cambios de schema, en lugar de `migrate dev` usar:

```bash
npx dotenv-cli -e .env.local -- npx prisma db push
```

y documentar el cambio en `docs/migrations/YYYY-MM-DD-<descripcion>.md`.

Para backend/auth en local, las funciones `/api/*` necesitan las variables de `.env.local`. `vercel dev` por sí solo no las carga; usar:

```bash
npx dotenv-cli -e .env.local -- vercel dev
```

There is no test suite configured.

## Folder Structure

```
/api/         Vercel Serverless Functions (TypeScript). One file = one route.
              Subfolders: api/ai/, api/tours/, api/operators/, api/uploads/
/lib/         Shared backend singletons (Prisma client, Anthropic, Voyage)
/prisma/      schema.prisma + migrations/
/scripts/     One-off scripts (seed, embeddings, prebuild de cache, etc.) run via `tsx`
/src/         Frontend React code (Vite)
/public/      Static assets served as-is
/data/track-b/ Snapshots de DB usados como fuente de mocks (ej. tours-db-snapshot.json)
/docs/audits/  Auditorías de estado y de incidentes
/docs/migrations/ Historial de cambios de schema (db push) con su razón
```

## Frontend Architecture

`src/main.jsx` mounts `<App />`. `src/App.jsx` is the top-level entry that gates between two screens:

- **`src/Landing.jsx`** — public landing page (finde.pe homepage)
- **`src/AppDemo.jsx`** — interactive demo of the mobile app (password-gated; toggled via state in `App.jsx`)

There is no routing library. `AppDemo.jsx` internally renders different "screens" via a `useState` switch (`view`). Los estados reales del switch hoy (`AppDemo.jsx` ~líneas 3982-3994):

```
login → welcome → home
                  ├─► catalog (búsqueda)
                  ├─► detail (tourDetail) → booking → bookingSuccess (step 4 dentro de BookingView)
                  ├─► notifications
                  ├─► trips → trip-detail
                  ├─► profile
                  └─► dashboard (panel del operador) → new-tour (crear/editar tour)
```

La sesión es real (Supabase Auth). `src/main.jsx` envuelve `<App />` con `<AuthProvider>` (`src/contexts/AuthContext.jsx`); `useAuth()` es la fuente de verdad de `user`/`session`/`isOperator`. `LoginView` usa email+password (pestañas signin/signup); `OTPView` fue eliminada. El "gate" de password de `App.jsx` (acceso al demo) es independiente de la sesión de Supabase.

## Estado de datos (qué es real vs mock)

### Datos REALES (del API / DB)

- **Auth** — Supabase Auth (email+password) vía `src/contexts/AuthContext.jsx` (`useAuth`). Sesión persistente en localStorage; el backend valida el `Bearer` token con `lib/auth.ts`. `isOperator` se deriva de `GET /api/me`.
- **Tours (catálogo)** — `fetch('/api/tours?limit=50')` en el mount de `AppDemo`. 40 tours en DB con embeddings Voyage. El GET público filtra `active:true` (tours pausados no aparecen).
- **Tours del operador (CRUD)** — crear/editar/borrar/pausar conectados a endpoints reales (`POST /api/tours`, `PUT/DELETE/PATCH /api/tours/[id]`). `opTours` se hidrata desde `GET /api/operators/me/tours` (ya no es mock); muestra activos e inactivos.
- **Upload de imágenes** — `POST /api/uploads/tour-image` emite una signed upload URL (tras `requireOperator`); el navegador sube la foto **directo** a Supabase Storage (bucket `tour-images`), esquivando el límite ~4.5MB de Vercel. La `publicUrl` resultante se guarda en `Tour.imageUrl`.
- **Búsqueda IA** — `POST /api/search` (Voyage embeddings + pgvector + Claude Sonnet 4.6, con cache `FeaturedSearch`). Filtra `active:true` en sus 3 queries (cache, pgvector, hidratación).
- **Bookings** — `POST /api/bookings` persiste en DB (status inicial `pending_payment`; no transiciona hasta que se implemente la pasarela). Requiere sesión (`requireAuth`); el `userEmail`/identidad sale del token, no del body. Rechaza reservas de tours pausados (409).
- **Operadores (onboarding)** — `POST /api/operators` requiere sesión; crea row con `verified: false`, ligado a `Operator.userId` del token, persiste `ruc`; responde 409 si el usuario ya es operador.
- **Geo** — `GET /api/geo` resuelve ciudad desde headers `x-vercel-ip-*` con fallback Lima.
- **AI B2B** — `POST /api/ai/generate-description` y `POST /api/ai/generate-quechua` están listos en backend (todavía no enchufados a la UI de `NewTourView`).

### Datos que siguen MOCK (pendientes en el roadmap MVP)

- **`NOTIFS`** — notificaciones in-app, constante hardcoded.
- **`OP_BK`, `EARN`, `biz`** — datos del dashboard del operador (`DashView`): reservas, ingresos semanales, datos comerciales (RUC/MINCETUR/CCI).
- **Reviews** — `generateMockReviews(tour)` produce 3-4 reseñas determinísticas por hash del tour. No existe modelo `Review` en DB.
- **`MY_TRIPS`** — semi-mock: 2 trips fijos con CUIDs reales de DB (`data/track-b/tours-db-snapshot.json`).

## Backend Architecture

Endpoints live in `/api/` as TypeScript files using `@vercel/node` types (`VercelRequest`, `VercelResponse`). Each file maps to a route (e.g. `api/health.ts` → `/api/health`).

Shared clients are singletons in `/lib/` to avoid reconnecting on every invocation in dev:

- `lib/db.ts` — Prisma client (cached on `globalThis` in non-prod)
- `lib/anthropic.ts` — Anthropic SDK client (export `MODEL = "claude-sonnet-4-6"`)
- `lib/voyage.ts` — Voyage embeddings client
- `lib/rate-limit.ts` — rate limiter por IP + bucket
- `lib/search-cache.ts` — normalización de queries para cache `FeaturedSearch`
- `lib/tour-select.ts` — `LIST_SELECT` y `DETAIL_SELECT` reusables (`tourFields` incluye `days`, `meetingPoint`, `cancellation`, `excludedDates`, `addedDates`, `startTime`, `active`)
- `lib/tour-input.ts` — mapeo compartido form→schema para crear/editar tours: `tourInputSchema` (zod), `parseTourInput`, `embedTourSafe` (embedding on-write Voyage, Opción A), `CANCEL_MAP`, `parseDurationHours` ("full day"→8h, "medio día"→4h). Semántica `undefined` para `imageUrl` y `startTime` (preserva el valor existente en update). Mensajes de error que nombran el campo (`FIELD_LABELS`). `capacity` int 1-3000 (requerido)
- `lib/geo.ts` — mapeo de ciudad/región a ciudad soportada
- `lib/supabase-admin.ts` — cliente Supabase con **service role** (stateless, cacheado en `globalThis`); valida tokens y emite signed upload URLs de Storage
- `lib/auth.ts` — `requireAuth(req, res)` / `getAuthUser(req)`: extraen y validan el `Bearer` token vía `supabase-admin`. `requireOperator(req, res)` se monta sobre `requireAuth`: resuelve el `Operator` por `userId`, responde 403 si la cuenta no es operador, y devuelve `{ user, operator: { id, name, verified } }` (lanza `AuthRequiredError` en 401 y 403 para que el `catch { return }` de los handlers funcione igual)

Endpoints autenticados (vía `requireAuth`): `GET /api/me` (devuelve `{ user, operator | null }`), `POST /api/bookings`, `POST /api/operators`. La identidad (email/`userId`) se toma del token, nunca del body.

Endpoints de operador (vía `requireOperator`; `operatorId` sale del token, nunca del body):

- `POST /api/tours` — crear un tour (mapeo form→schema vía `lib/tour-input.ts`, embedding on-write). Devuelve 201.
- `PUT /api/tours/[id]` — editar un tour propio (verificación de propiedad, re-embed; preserva `imageUrl`/`startTime` si no se mandan — semántica `undefined`; omite `language` para no clobbear tours multi-idioma).
- `DELETE /api/tours/[id]` — borrar un tour propio (hard delete) + su foto en Storage. Borra la DB primero; solo toca Storage si la `imageUrl` vive en el bucket `tour-images` (las URLs externas del seed se dejan intactas); un fallo de Storage no rompe el borrado (foto huérfana, se loguea).
- `PATCH /api/tours/[id]` — pausar/reactivar (body `{ active: boolean }`, verificación de propiedad).
- `GET /api/operators/me/tours` — lista los tours del operador para el dashboard (NO filtra `active`: muestra activos e inactivos).
- `POST /api/uploads/tour-image` — emite una signed upload URL para Supabase Storage (valida `contentType` jpeg/png; ruta `{operatorId}/{uuid}.{ext}`; devuelve `token`, `path`, `publicUrl`).

`GET /api/tours` y `GET /api/tours/[id]` son públicos pero filtran `active:true` (un tour pausado no aparece en el catálogo y su detalle responde 404).

### Almacenamiento de imágenes (Supabase Storage)

Bucket **`tour-images`** (lectura pública, límite 5MB, MIME `image/jpeg`/`image/png`, **sin INSERT público** — las subidas van por signed URL). Flujo A: el backend (`requireOperator`) emite la signed upload URL en `POST /api/uploads/tour-image` y el navegador sube el archivo **directo** a Storage (nunca pasa por la función → esquiva el límite ~4.5MB de Vercel). La `publicUrl` se guarda en `Tour.imageUrl`.

### Data model (see `prisma/schema.prisma`)

- **Operator** — tour providers (`verified` flag, `city`, `email` único, `phone`), más `userId` (único, FK **lógica** a `auth.users` de Supabase — no la maneja Prisma) y `ruc`. `userId` es nullable: los 9 operadores del seed quedan sin dueño (catálogo).
- **Tour** — listings con `embedding vector(1024)` para búsqueda semántica, más:
  - básicos: `title`, `description`, `category`, `difficulty`, `city`, `region`, `durationHours`, `priceSoles` (en céntimos), `capacity`, `language[]`, `included[]`, `excluded[]`, `imageUrl`, `rating`, `reviewsCount`
  - editoriales: `shortPitch`, `aiSummary`, `altTour` (Json), `tags` (String[]), `badge`, `cancellation` (enum), `meetingPoint`, `altitude`
  - disponibilidad: `days` (Boolean[7] — patrón semanal), `excludedDates` (String[]), `addedDates` (String[]), `startTime` (String? — hora de salida "HH:MM" 24h, nullable; null = legacy/sin definir)
  - estado: `active` (Boolean `@default(true)` — el operador pausa/reanuda; el catálogo público filtra `active=true`)
- **Booking** — reservas con `bookingCode` único, `status` (string), `scheduledAt`, datos del viajero (`userName`, `userEmail`, `userPhone`) y `userId` (nullable, FK lógica a `auth.users`).
- **SearchLog** — log de queries en lenguaje natural (`query`, `resultIds[]`, `reasoning`).
- **FeaturedSearch** — cache de queries famosas pre-procesadas (Voyage + Claude). Salta el flujo completo y responde en <100ms para queries normalizadas presentes en cache.

Enums:

- **`Category`**: `adventure | cultural | gastronomy | nature | mystic`
- **`CancellationPolicy`**: `Flexible | Moderada | Estricta | NoReembolsable`

Idiomas (campo `language` en `Tour`): `es | en | qu`.

## Environment Variables

Required in `.env.local` (gitignored). Never commit.

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Supabase pooled connection (used at runtime by Prisma client) |
| `DIRECT_URL` | Supabase direct connection (used by `prisma migrate` / `db push`) |
| `ANTHROPIC_API_KEY` | Claude Sonnet 4.6 — búsqueda + generación de contenido |
| `VOYAGE_API_KEY` | Voyage embeddings (1024-dim) for `pgvector` |
| `VITE_SUPABASE_URL` | Supabase project URL — usada por el cliente del navegador (`src/lib/supabase.js`) **y** por el admin del backend (`lib/supabase-admin.ts`) |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/publishable key — cliente del navegador |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role — **solo backend** (`lib/supabase-admin.ts`); valida tokens. Nunca exponer al cliente |

Mirror these in Vercel via `vercel env add` for preview/production.

> M1 (Auth) ya consume estas 3 variables. Nota: el backend lee `VITE_SUPABASE_URL` (con prefijo `VITE_`) — intencional hoy; revisar al normalizar para producción. **Pendiente:** cargarlas en Vercel (preview + production) antes de desplegar M1.

## Styling

CSS variables defined in `src/index.css` (`:root`):

| Variable | Value | Role |
|----------|-------|------|
| `--f` | `#1B3A2D` | Primary dark green |
| `--m` | `#2D5A3D` | Secondary green |
| `--tr` | `#C7613A` | Terracotta accent |
| `--gd` | `#D4A843` | Gold |
| `--yp` | `#6B2FA0` | Purple |

Fonts: **DM Serif Display** (headings), **Plus Jakarta Sans** (body). Max container width is `430px` (mobile-first).

## ESLint

Config in `eslint.config.js`. Capitalized unused variables are intentionally ignored (React components). React Hooks rules are enforced.

## Conventions

- Logs in **Spanish**, code and identifiers in **English**.
- TypeScript strict in `/api/`, `/lib/`, `/scripts/`. Frontend stays JSX.
- One Vercel Serverless Function per file in `/api/`. Always handle 405 for unsupported methods.
- Validate all request bodies with `zod` before touching the DB.
- Use the `/lib/` singletons — never instantiate Prisma/Anthropic/Voyage clients ad-hoc inside endpoints.
- Cambios de schema: `prisma db push` (no `migrate dev`) + documentar en `docs/migrations/`.
- Endpoints de escritura del operador: proteger con `requireOperator` y verificar **propiedad** (`tour.operatorId === operator.id`) antes de mutar; el `operatorId`/identidad sale del token, nunca del body.
- **Tours pausados** (`active:false`): invisibles en catálogo, búsqueda, detalle y booking; visibles solo para su dueño en el dashboard (`GET /api/operators/me/tours`).
- **Etapa piloto: sin comisión** — el 15% está oculto en la UI (link directo a WhatsApp). Reactivar cuando se cobre.
- Publicación de tours honesta: sin moderación falsa ni datos mock en el onboarding del operador.
