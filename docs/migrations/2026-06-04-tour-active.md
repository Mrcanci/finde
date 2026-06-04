# 2026-06-04 — `Tour.active` (estado activo/inactivo)

## Qué se agregó

Columna **`active Boolean @default(true)`** al modelo `Tour` (`prisma/schema.prisma`).

```prisma
active        Boolean            @default(true) // operador pausa/reanuda; el catálogo público filtra active=true
```

## Por qué `Boolean @default(true)`

- Da **persistencia** al toggle de pausar/reanudar del dashboard del operador,
  que hoy solo vive en estado local del front (`t.active`) y se pierde al recargar
  (hallazgo M-2 de la auditoría).
- **`@default(true)`**: todos los tours existentes quedan **activos** automáticamente,
  así el catálogo público no cambia y nada se rompe.
- Nombre **`active`** (no `published`): la UI es un switch de pausar/reanudar controlado
  por el operador; "active" lo describe y coincide con el campo que el front ya usa.
  "published" sugeriría un ciclo borrador/aprobación (territorio de moderación, M-1).

## Impacto en datos existentes

- Cambio **no destructivo** (columna con default): sin pérdida de datos.
- Verificado tras el push: **43 tours total, 43 con `active=true`, 0 en `false`**.

## Pendiente (fuera de esta migración)

La columna solo da el almacenamiento. El flujo completo se conecta después:
- **M2.2 (backend):** exponer `active` en `lib/tour-select.ts`; nuevo `PATCH /api/tours/:id { active }`
  (requireOperator + verificación de propiedad); **filtrar `active=true`** en el GET público
  (`api/tours/index.ts`) y en las 3 queries de `api/search.ts`. `GET /api/operators/me/tours`
  NO filtra (el operador gestiona también los pausados).
- **M2.3 (frontend):** `toggleTour` llama al PATCH; `mapTourFromApi`/hidratación leen el valor
  real; se quita el filtro local de `activeTours`.

## Cómo se aplicó

Con **`prisma db push`** (NO `migrate dev`, por la regla del proyecto: drift de extensiones
de Supabase). El cliente Prisma se regeneró en el mismo paso.

```bash
npx dotenv-cli -e .env.local -- npx prisma db push
npm run db:generate
```

Resultado: `🚀  Your database is now in sync with your Prisma schema.` (sin warnings de
pérdida de datos).
