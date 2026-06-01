# Migración 2026-06-01 — `Operator.userId`, `Operator.ruc`, `Booking.userId`

**Sub-paso 8.1 de M1 (Auth con Supabase Auth).** Conecta el lado operador y
las reservas al usuario real de `auth.users`.

## Qué se agregó

Vía `prisma db push --accept-data-loss` (NO `migrate dev`, por drift con
extensiones Supabase `pgvector` / `pg_trgm` — conforme a `CLAUDE.md`).

```prisma
model Operator {
  // ...
  userId String? @unique   // vínculo lógico a auth.users.id
  ruc    String?           // RUC del onboarding (antes solo se validaba)
}

model Booking {
  // ...
  userId String?           // vínculo lógico a auth.users.id
  @@index([userId])
}
```

## Por qué nullable (y por qué fue seguro sobre producción)

- La DB de producción ya tenía **9 operadores, 17 bookings, 40 tours**. Una
  columna `NOT NULL` sin default **falla** sobre tablas con filas. Las tres
  columnas se agregaron **nullable** → cambio puramente aditivo, ninguna fila
  existente se reescribió.
- El `@unique` sobre `Operator.userId` disparó el warning de Prisma que exige
  `--accept-data-loss`. **No hubo pérdida de datos:** la columna es nueva
  (todas las filas quedan `NULL`) y Postgres permite **múltiples NULL** en un
  índice único, así que los 9 operadores sin dueño no colisionan.
- La FK Tour→Operator, `Operator.email @unique` y el resto del schema **no se
  tocaron**.

## Conteos antes / después (sin pérdida)

| Tabla     | Antes | Después |
|-----------|-------|---------|
| operators | 9     | 9       |
| bookings  | 17    | 17      |
| tours     | 40    | 40      |

## Backfill del operador de prueba

Para que la cuenta demo pueda actuar como operador real en el dashboard, se
ligó el operador **María Quispe (`demo@finde.pe`)** al usuario de Supabase Auth
`demo@finde.pe`:

- `auth.users.id` obtenido vía `supabaseAdmin.auth.admin.listUsers()`
  (service role, sin exponer el token).
- `UPDATE Operator SET userId = '<auth uuid>' WHERE email = 'demo@finde.pe'`.
- Resultado: operador ligado, conserva sus **3 tours**.

Estado de los vínculos tras el backfill:

- **1 operador ligado** (`demo@finde.pe`).
- **8 operadores con `userId = null`** — catálogo sin dueño. Sus tours siguen
  mostrándose (los listados no filtran por `userId`); simplemente no son
  gestionables vía login. Aceptable para el MVP.
- **17 bookings con `userId = null`** — reservas previas al auth. Las nuevas se
  poblarán cuando el handler de `POST /api/bookings` setee `userId` (sub-paso
  posterior).

## Qué NO se tocó

Código de endpoints (`api/operators.ts`, `api/me.ts`, `api/bookings.ts`) ni
frontend. Eso corresponde a los sub-pasos 8.2+.
