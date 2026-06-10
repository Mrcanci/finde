# 2026-06-09 — Backfill de `Tour.startTime`

## Qué hace

Setea una **hora de salida realista** (`startTime`, formato "HH:MM") en los tours que la tenían en `null` (40 tours del seed). No cambia el schema (la columna `startTime String?` ya existe) ni borra/recrea datos: solo hace `UPDATE` de `startTime` en los tours donde es `null`.

Las horas se asignan por **tipo de tour** (treks de madrugada 05:00, multi-día/vivenciales 06:00, día completo 08:00, medio día/city 09:00, nocturnos 19:00, con ajustes puntuales: sandboarding 16:00, gastronómico 11:00). El mapa completo título→hora vive en `scripts/backfill-starttime.ts` y, para futuros seeds, en `SEED_STARTTIME_BY_TITLE` de `prisma/seed.ts`.

## Comando

```bash
npx dotenv-cli -e .env.local -- npx tsx scripts/backfill-starttime.ts
```

- Solo toca tours con `startTime === null`. **No pisa** tours que ya tienen hora (p. ej. "prueba" → "08:00").
- Reporta cuántos actualizó, si quedó algún tour `null` sin cubrir, y títulos del map sin match (para cazar typos).
- **Idempotente:** una segunda corrida no cambia nada (ya no quedan `null`).

## Archivos

- `scripts/backfill-starttime.ts` — el backfill (UPDATE puntual).
- `prisma/seed.ts` — agrega `startTime` a los tours sembrados (vía `SEED_STARTTIME_BY_TITLE`), para que un seed futuro nazca con hora. NO se re-sembró.
- `src/AppDemo.jsx` (VoucherDetail) — se quitó el fallback fabricado `|| "08:00"`: la hora del voucher ahora sale de `tour.startTime` y se omite si no existe (coherente con el detalle del tour y el paso 1 de la reserva).

## Reversibilidad

El cambio es un `UPDATE startTime` sobre filas que estaban en `null`. Para revertir (volver esos tours a `null`):

```sql
-- Revertir SOLO los del seed que este backfill tocó (los del map). Ejemplo para
-- volver todo a null salvo "prueba" (creado por el operador con 08:00):
UPDATE "Tour" SET "startTime" = NULL WHERE title <> 'prueba';
```

(Ajustar el `WHERE` si se han creado más tours con hora real por operadores entre tanto.) No hay pérdida de datos: `startTime` era `null` antes; la información original (la ausencia de hora) es trivial de restaurar.
