# 2026-06-16 — `Tour.meetingPointQu` / `Tour.shortPitchQu`

## Cambio

Se agregaron 2 columnas quechua al modelo **`Tour`**, aplicadas vía `prisma db push` (no `migrate dev`, por drift con extensiones Supabase).

```prisma
model Tour {
  ...
  shortPitchQu   String?  // traducción quechua del shortPitch (null = sin traducir)
  ...
  meetingPointQu String?  // traducción quechua del meetingPoint (null = sin traducir)
  ...
}
```

- Tipos en Postgres: `text`, `is_nullable = YES`. Cambio **no-destructivo**: columnas nuevas nullable. Las 40 filas existentes quedan `null`. `db push` corrió sin warnings de data loss.

## Razón

Persistir la **traducción a quechua** del punto de encuentro (`meetingPoint`) y del pitch corto (`shortPitch`), completando la cobertura quechua del detalle del tour iniciada con `titleQu`/`descQu`/`includedQu`/`excludedQu` (ver [`2026-06-16-add-tour-quechua-columns.md`](2026-06-16-add-tour-quechua-columns.md)). `null` = sin traducir → el frontend cae al español.

## Estado y próximos pasos

Esta migración es **solo schema + db push**. Aún NO tocado: selects (`lib/tour-select.ts`), backfill y frontend.
