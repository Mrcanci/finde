# Finde — marketplace peruano de experiencias turísticas

Plataforma mobile-first con búsqueda semántica en lenguaje natural, generación de contenido por IA para operadores y soporte de quechua. En pre-launch, postulando a **Emprende TEC**, **ProInnóvate** y **Startup Perú**.

🌐 **Demo en vivo:** [finde-two.vercel.app/demo](https://finde-two.vercel.app/demo)  
🔑 **Password:** `finde2026`

---

## Stack

| Capa | Tecnología |
|------|------------|
| Frontend | Vite 8 + React 19 (SPA, mobile-first, sin router) |
| Backend | Vercel Serverless Functions (TypeScript, `@vercel/node`) sobre Fluid Compute |
| Base de datos | Supabase Postgres con extensiones `pgvector` (1024-dim) y `pg_trgm` |
| ORM | Prisma 6 (`postgresqlExtensions` preview) |
| IA — re-ranking de búsqueda y generación de contenido | Claude Sonnet 4.6 (`@anthropic-ai/sdk`) |
| IA — embeddings semánticos | Voyage AI (`voyageai`, modelo `voyage-3`) |
| Validación | `zod` en todos los endpoints |
| Hosting | Vercel (proyecto `mrcancis-projects/finde`, dominio actual: `finde-two.vercel.app`) |

---

## Features hechos en el sprint

- 🔍 **Búsqueda semántica en lenguaje natural** — el viajero escribe "quiero algo tranquilo en familia con mis hijos pequeños" y Claude entiende intención + restricciones, descarta opciones inadecuadas y reordena candidatos pre-filtrados por similitud vectorial (`pgvector <=>`).
- ⚡ **Cache de queries famosos** — pre-cacheados via `FeaturedSearch`. Demo responde en ~1.3s en vez de ~10s para queries del jurado.
- 🎙️ **Generación de descripciones con IA** — el operador sube título + 3 highlights, Claude redacta descripción 200–300 palabras + shortPitch + keywords SEO.
- 🌐 **Toggle quechua sureño** — traducción al quechua Cusco-Collao generada por Claude (validación lingüística pendiente — Pista B).
- 📅 **Reserva end-to-end** — bookings con código único `FND-XXXXXX`, sin Excel, sin WhatsApp.
- 🛡️ **Rate limiting** — 10/min en `/api/search`, 3/min en `/api/operators` (memoria por IP).
- 👩 **Operador demo verificado** — María Quispe (Cusco) con 3 tours reales asignados.

---

## Cómo correr local

### Pre-requisitos
- Node.js 24+ (Vercel default)
- Cuenta Supabase con `pgvector` habilitado
- API keys de Anthropic y Voyage AI

### Setup

```bash
# 1. Clonar e instalar
npm install

# 2. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales (ver tabla abajo)

# 3. Migrar schema y generar cliente
npx dotenv -e .env.local -- prisma db push --skip-generate
npm run db:generate

# 4. Seed de 30 tours peruanos + embeddings
npm run db:seed
npx dotenv -e .env.local -- tsx scripts/generate-embeddings.ts

# 5. (opcional) operador demo y cache de queries
npx dotenv -e .env.local -- tsx scripts/seed-demo-operator.ts
# Para el cache de queries necesitas vercel dev corriendo en otro tab:
vercel dev   # en una terminal
npx dotenv -e .env.local -- tsx scripts/prebuild-featured-searches.ts   # en otra
# Nota: el script popula FeaturedSearch en Supabase. Como la DB es compartida,
# el cache también se ve en producción automáticamente.
```

### Variables de entorno (`.env.local`)

| Variable | Propósito |
|----------|-----------|
| `DATABASE_URL` | Supabase pooled connection (runtime de Prisma) |
| `DIRECT_URL` | Supabase direct connection (migraciones) |
| `ANTHROPIC_API_KEY` | Claude Sonnet 4.6 |
| `VOYAGE_API_KEY` | Embeddings Voyage |

### Comandos

```bash
npm run dev               # Vite dev (solo frontend, HMR)
vercel dev                # Stack completo: Vite + /api/ functions
npm run build             # Build de producción
npm run lint              # ESLint

npm run db:generate       # Regenerar cliente Prisma
npm run db:migrate        # prisma migrate dev (NO usar — usar db push por las extensiones)
npm run db:migrate:deploy # Aplicar migraciones en CI/prod
npm run db:studio         # Prisma Studio (GUI)
npm run db:seed           # Seed de 30 tours

# Scripts utilitarios (vía tsx)
npx dotenv -e .env.local -- tsx scripts/generate-embeddings.ts
npx dotenv -e .env.local -- tsx scripts/seed-demo-operator.ts
npx dotenv -e .env.local -- tsx scripts/prebuild-featured-searches.ts
```

---

## Estructura

```
api/                Vercel Serverless Functions (TypeScript). Una ruta por archivo.
  health.ts         GET   /api/health
  search.ts         POST  /api/search   (semántica + cache + Claude)
  bookings.ts       POST  /api/bookings
  operators.ts      POST  /api/operators
  tours/index.ts    GET   /api/tours
  tours/[id].ts     GET   /api/tours/[id]
  ai/
    generate-description.ts   POST  /api/ai/generate-description
    generate-quechua.ts       POST  /api/ai/generate-quechua

lib/                Singletons compartidos (Prisma, Anthropic, Voyage), helpers
  db.ts             Cliente Prisma cacheado
  anthropic.ts      Cliente Anthropic + nombre del modelo
  voyage.ts         Cliente Voyage + modelo de embedding + dim
  tour-select.ts    Shapes Prisma.select reusables (LIST_SELECT, DETAIL_SELECT)
  rate-limit.ts     Rate limiter en memoria por IP
  search-cache.ts   normalizeQuery() — fuente única para cache lookups

prisma/             schema.prisma + migraciones + seed.ts
scripts/            Scripts one-off (seed, embeddings, prebuild de cache, etc.)
src/                React (Vite). Landing + AppDemo (mobile mockup).
public/             Assets estáticos
```

---

## Roadmap

### ✅ Pista A — Sprint demo (Día 1–7, completado)

Alcance: **demo funcional end-to-end** para postular a concursos de innovación. Algunas piezas son intencionalmente simplificadas para entregar en 7 días.

- Schema completo (Operator / Tour / Booking / SearchLog / FeaturedSearch).
- 30 tours peruanos reales con embeddings, distribuidos en 5 categorías y 14 ciudades.
- Búsqueda semántica con re-ranking por Claude y reasoning en peruano natural.
- Cache de 5 queries famosos (1.3s vs 10s) para presentaciones a jurados.
- Generador de descripciones + traductor de quechua (operador-side).
- Bookings con código `FND-XXXXXX`.
- Onboarding de operadores sin verificación automatizada (`verified` se marca a mano off-platform).
- Rate limiting en memoria.
- Operador demo verificado (María Quispe) con 3 tours.
- Deploy en producción (Vercel + Supabase).

### 🚧 Pista B — Producción real (post-concurso)

Alcance: **plataforma escalable** con flujos reales de operador y usuario, monetizable. Lo que cambia respecto a Pista A:

- **Auth real** — tabla `Session` con expiración y revocación, en vez del cookie demo. Magic links por email.
- **Verificación de operadores** — webhook a SUNAT por RUC, validación automática de cuentas, flag `verified` real.
- **Pagos** — integración con Mercado Pago / Culqi para procesar reservas y comisión por transacción.
- **Validación lingüística del quechua** — partnership con quechuahablantes nativos (cooperativa Cusco) para revisar las traducciones generadas por Claude antes de publicarlas.
- **Cache distribuido** — reemplazar `lib/rate-limit.ts` (in-memory) y `FeaturedSearch` (DB) por Upstash Redis para horizontal scaling.
- **Búsqueda multi-idioma** — embeddings y reasoning también en inglés (mercado turista internacional).
- **Reviews y ratings auténticos** — moderación post-tour, con foto y bookingCode validado.
- **Dashboard operador con datos reales** — bookings, calendario, ingresos, estadísticas. Hoy es mock React state.
- **Notificaciones** — email transaccional (Resend) y WhatsApp Business para operadores.
- **Observabilidad** — Sentry + Logtail; monitoreo de costo de tokens Claude/Voyage por endpoint.
- **CMS para destacados** — editor de `FeaturedSearch` desde panel admin, sin re-correr scripts.
- **Dominio personalizado `finde.pe`** — actualmente desvinculado, se reactivará al lanzar la versión pública.

---

## Convenciones del proyecto

- Logs y mensajes UI en **español**, código e identificadores en **inglés**.
- TypeScript estricto en `/api/`, `/lib/`, `/scripts/`. Frontend (`/src/`) sigue siendo JSX en este sprint.
- Una Serverless Function por archivo en `/api/`. Siempre manejar `405` para métodos no soportados.
- Validar todos los bodies con `zod` antes de tocar la DB.
- Usar los singletons de `/lib/` — nunca instanciar Prisma/Anthropic/Voyage ad-hoc en endpoints (cold-start cost).

---

## Licencia

Propietario. Todos los derechos reservados © 2026 Finde.
