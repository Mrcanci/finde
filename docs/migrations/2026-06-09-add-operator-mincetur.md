# 2026-06-09 — `Operator.mincetur`

## Cambio

Se agregó la columna **`Operator.mincetur` (`String?`, nullable)** al schema, aplicada vía `prisma db push` (no `migrate dev`, por drift con extensiones Supabase).

```prisma
model Operator {
  ...
  ruc       String?
  mincetur  String?   // N° de registro MINCETUR enviado por el operador; null = no enviado
  ...
}
```

- Tipo en Postgres: `text`, `is_nullable = YES`. Cambio **no-destructivo** (columna nueva nullable; local y producción comparten la misma DB Supabase).

## Razón

Captura el **N° de registro MINCETUR** que el operador envía desde "Mi Negocio" para iniciar su verificación. `null` = aún no enviado.

## Relación con `verified`

- `verified` (boolean) **se mantiene como la única señal del badge** "Finde Verificado" del lado del viajero (catálogo/detalle/voucher, vía `tour.operator.verified`).
- El flujo: el operador envía `mincetur` → estado "En revisión" en su panel (`verified` sigue `false`) → **Finde valida el número a mano** y marca `verified = true` directamente en la DB (sin panel admin en el piloto) → el badge aparece en sus tours.
- `mincetur` es **interno para la revisión**: NO se expone en `LIST_SELECT`/`DETAIL_SELECT` (el viajero no lo ve), solo en `GET /api/me` y en la respuesta del `PATCH /api/operators` (panel del operador).
- El `PATCH /api/operators` permite enviar/editar `mincetur` pero **nunca** toca `verified`, `email` ni `userId`.

## Validación manual (piloto)

Para revisar pendientes y aprobar:

```sql
-- Pendientes de verificación (enviaron MINCETUR, aún no verificados)
SELECT id, name, ruc, mincetur FROM "Operator" WHERE mincetur IS NOT NULL AND verified = false;

-- Aprobar tras validar el número contra el registro MINCETUR
UPDATE "Operator" SET verified = true WHERE id = '<operatorId>';
```
