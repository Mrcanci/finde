# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

**Finde** is a mobile-first marketplace for Peru tourism experiences with AI-powered semantic search and Quechua language support. The project is in pre-launch and being submitted to MINCETUR / Emprende TEC / ProInnóvate / Startup Perú contests.

Production: deployed to **finde.pe** via Vercel (project `mrcancis-projects/finde`).

## Stack

- **Frontend**: Vite 8 + React 19 (SPA, mobile-first, no router library)
- **Backend**: Vercel Serverless Functions in `/api/` (TypeScript, `@vercel/node`)
- **Database**: Supabase Postgres with `pgvector` and `pg_trgm` extensions
- **ORM**: Prisma 6 (`previewFeatures = ["postgresqlExtensions"]`)
- **AI**: Claude Sonnet 4.5 (`@anthropic-ai/sdk`) for natural-language search and tour-description generation
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
npm run db:migrate       # prisma migrate dev (create/apply migrations against Supabase)
npm run db:migrate:deploy# prisma migrate deploy (apply pending migrations in CI/prod)
npm run db:studio        # prisma studio (DB GUI)
npm run db:seed          # tsx prisma/seed.ts (seed sample tours/operators)
```

There is no test suite configured.

## Folder Structure

```
/api/         Vercel Serverless Functions (TypeScript). One file = one route.
              Subfolders: api/ai/, api/tours/
/lib/         Shared backend singletons (Prisma client, Anthropic, Voyage)
/prisma/      schema.prisma + migrations/
/scripts/     One-off scripts (seed, backfill embeddings, etc.) run via `tsx`
/src/         Frontend React code (Vite)
/public/      Static assets served as-is
```

## Frontend Architecture

`src/main.jsx` mounts `<App />`. `src/App.jsx` is the top-level entry that gates between two screens:

- **`src/Landing.jsx`** — public landing page (finde.pe homepage)
- **`src/AppDemo.jsx`** — interactive demo of the mobile app (password-gated; toggled via state in `App.jsx`)

There is no routing library. `AppDemo.jsx` internally renders different "screens" via a `useState` switch:

```
login → onboarding → home → tourDetail → booking → bookingSuccess
                    → notifications
                    → myTrips
                    → profile
                    → operator (dashboard for tour operators)
```

The demo is currently 100% mocked: tours, AI suggestions, notifications, bookings, and operator data are all hardcoded constants inside `AppDemo.jsx`. The Day-1 sprint backend will progressively replace these mocks via `/api/` calls.

## Backend Architecture

Endpoints live in `/api/` as TypeScript files using `@vercel/node` types (`VercelRequest`, `VercelResponse`). Each file maps to a route (e.g. `api/health.ts` → `/api/health`).

Shared clients are singletons in `/lib/` to avoid reconnecting on every invocation in dev:

- `lib/db.ts` — Prisma client (cached on `globalThis` in non-prod)
- `lib/anthropic.ts` — Anthropic SDK client
- `lib/voyage.ts` — Voyage embeddings client

### Data model (see `prisma/schema.prisma`)

- **Operator** — tour providers (verified flag, city, contact)
- **Tour** — listings with `embedding vector(1024)` for semantic search, plus `category`, `difficulty`, `city`, `region`, pricing, capacity, languages
- **Booking** — reservations with unique `bookingCode`, status, scheduled date
- **SearchLog** — natural-language query log (query, returned tour ids, Claude reasoning)

Tour categories: `adventure | cultural | gastronomy | nature | mystic`
Languages: `es | en | qu`

## Environment Variables

Required in `.env.local` (gitignored). Never commit.

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Supabase pooled connection (used at runtime by Prisma client) |
| `DIRECT_URL` | Supabase direct connection (used by `prisma migrate`) |
| `ANTHROPIC_API_KEY` | Claude Sonnet 4.5 — search + content generation |
| `VOYAGE_API_KEY` | Voyage embeddings (1024-dim) for `pgvector` |

Mirror these in Vercel via `vercel env add` for preview/production.

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
- TypeScript strict in `/api/`, `/lib/`, `/scripts/`. Frontend stays JSX (no migration in this sprint).
- One Vercel Serverless Function per file in `/api/`. Always handle 405 for unsupported methods.
- Validate all request bodies with `zod` before touching the DB.
- Use the `/lib/` singletons — never instantiate Prisma/Anthropic/Voyage clients ad-hoc inside endpoints.

## Sprint actual (Día 1-7)

7-day sprint to build minimum viable backend for innovation contests (Emprende TEC, ProInnóvate, Startup Perú).

**DO NOT modify during this sprint** unless explicitly asked:
- src/Landing.jsx
- src/AppDemo.jsx
- src/App.jsx

These will be updated in Day 3-4 when frontend connects to /api/ endpoints. Until then, all backend work happens in /api/, /lib/, /prisma/, /scripts/.

**Day-by-day plan:**
- Day 1: Prisma schema, DB migration, /api/health.ts, lib singletons
- Day 2: GET /api/tours, GET /api/tours/[id], seed 30 Peru tours
- Day 3: POST /api/search (semantic search with Claude + pgvector)
- Day 4: POST /api/ai/generate-description (AI content for operators)
- Day 5: POST /api/bookings, POST /api/operators
- Day 6: Production deploy + smoke tests
- Day 7: Demo polish, contingency, video script
