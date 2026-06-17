# 2026-06-16 — `Tour.titleQu` / `Tour.descQu` / `Tour.includedQu` / `Tour.excludedQu`

## Cambio

Se agregaron 4 columnas quechua al modelo **`Tour`**, aplicadas vía `prisma db push` (no `migrate dev`, por drift con extensiones Supabase).

```prisma
model Tour {
  ...
  titleQu       String?            // traducción quechua del título (null = sin traducir)
  descQu        String?            // traducción quechua de la descripción (null = sin traducir)
  ...
  includedQu    String[] @default([]) // espeja included en quechua (vacío = sin traducir)
  excludedQu    String[] @default([]) // espeja excluded en quechua (vacío = sin traducir)
  ...
}
```

- Tipos en Postgres: `titleQu`/`descQu` → `text`, `is_nullable = YES`; `includedQu`/`excludedQu` → `text[]` con default `'{}'`.
- Cambio **no-destructivo**: columnas nuevas nullable / con default vacío. Las 40 filas existentes quedan `titleQu`/`descQu` = `null` e `includedQu`/`excludedQu` = `[]`. `db push` corrió sin warnings de data loss.

## Razón

Persistir la **traducción a quechua** del contenido visible del tour (título, descripción, incluye, no incluye). Hoy el toggle ES↔QU de `DetailView` traduce la descripción on-the-fly vía `POST /api/ai/generate-quechua` y no persiste; el título e incluye/no-incluye quedan siempre en español. Estas columnas permiten guardar la traducción una vez (backfill) y servirla desde la API.

## Convención de "sin traducir"

- `titleQu`/`descQu`: `null` = sin traducir → el frontend cae al español (`title`/`description`).
- `includedQu`/`excludedQu`: array vacío `[]` = sin traducir → el frontend cae a `included`/`excluded`. Cuando se pueblen, deben tener **el mismo número de items** que su contraparte en español (mismo orden).

## Estado y próximos pasos

Esta migración es **solo schema + db push**. Aún NO tocado (pasos siguientes del plan):

- Selects (`lib/tour-select.ts`): exponer los 4 campos en `tourFields` / `DETAIL_SELECT`.
- Backfill: script que traduce included/excluded por bloque (respetando el mínimo 50 chars de `generate-quechua` y validando que el nº de líneas de salida == entrada) y persiste.
- Frontend (`DetailView`): leer `titleQu`/`descQu`/`includedQu`/`excludedQu` desde la API en lugar de la traducción on-the-fly.
