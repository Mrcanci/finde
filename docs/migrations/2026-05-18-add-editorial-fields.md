# Migración manual: add editorial fields + CancellationPolicy enum

**Fecha:** 2026-05-18
**Branch:** feature/tours-db-i18n
**Método:** `prisma db push` (no `migrate dev` por drift con extensiones de Supabase)

## Razón de no usar migrate dev

El baseline 0_init no captura las extensiones de Supabase
(pgcrypto, uuid-ossp, pg_stat_statements) con el schema/namespace
exacto en que Supabase las tiene instaladas. Esto causa que
`prisma migrate dev` detecte drift y solicite resetear la DB
(destructivo). Ajustar manualmente el baseline tomaría horas sin
valor proporcional para el estado actual del proyecto
(un solo ambiente Supabase, sin staging ni CI/CD que requiera
reproducir el schema). Se prioriza avanzar con `db push` directo
y documentar el cambio aquí.

## Cambios al schema (modelo Tour)

Campos agregados, todos al final del modelo Tour antes de
`embedding`:

| Campo | Tipo | Default |
|---|---|---|
| aiSummary | String? | null |
| altTour | Json? | null |
| tags | String[] | [] |
| badge | String? | null |
| cancellation | CancellationPolicy | Moderada |
| meetingPoint | String? | null |
| altitude | Int? | null |
| days | Boolean[] | [true,true,true,true,true,true,true] |
| excludedDates | String[] | [] |
| addedDates | String[] | [] |

## Enum agregado

```prisma
enum CancellationPolicy {
  Flexible
  Moderada
  Estricta
  NoReembolsable
}
```

## Verificación post-migración

- Tours antes del push: 30 (debe ser 30)
- Tours después del push: 30 (debe ser 30)
- Sample tour con campos nuevos: ver paso 3 del prompt de ejecución
- Defaults aplicados correctamente: ✅
- Campo embedding (Voyage) preservado: ✅

## Próximo paso

Fase 2 del proyecto tours-db-i18n: actualizar seed y aplicar
contenido editorial aprobado en data/track-b/.
