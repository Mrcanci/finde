# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start development server with HMR
npm run build     # Production build (outputs to dist/)
npm run preview   # Preview production build locally
npm run lint      # Run ESLint
```

There is no test suite configured.

## Architecture

This is a React 19 + Vite SPA — a mobile-first marketplace for Peru tourism experiences, with AI-powered semantic search and Quechua language support.

**Entire app lives in `src/App.jsx`** — all UI components, state, screens, data, and inline CSS are colocated in this single file. There is no routing library; screens are conditionally rendered via `useState`. The main state variable controlling the active view is called `screen`.

### Screen flow

```
login → onboarding → home → tourDetail → booking → bookingSuccess
                    → notifications
                    → myTrips
                    → profile
                    → operator (dashboard for tour operators)
```

### Data model

All data is currently hardcoded in `App.jsx` as module-level constants:

- `TOURS` — 8 sample Peru tours with id, name, price, rating, region, category tags, duration, etc.
- `CATS` — 7 tour categories used for filtering
- `AI_SUGGESTIONS` — canned AI search suggestion chips
- `NOTIFS` — sample user notifications
- `MY_TRIPS` — booking history records
- `OP_BK` / `EARN` — operator dashboard data
- `USER` — current user profile

### Styling

CSS variables are defined in `src/index.css` (`:root`). Key variables:

| Variable | Value | Role |
|----------|-------|------|
| `--f` | `#1B3A2D` | Primary dark green |
| `--m` | `#2D5A3D` | Secondary green |
| `--tr` | `#C7613A` | Terracotta accent |
| `--gd` | `#D4A843` | Gold |
| `--yp` | `#6B2FA0` | Purple |

Fonts loaded from Google Fonts: **DM Serif Display** (headings), **Plus Jakarta Sans** (body). Max container width is `430px` (mobile-first).

### ESLint

Config is in `eslint.config.js`. Capitalized unused variables are intentionally ignored (React components). React Hooks rules are enforced.
