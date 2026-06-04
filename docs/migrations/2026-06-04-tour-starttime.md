# 2026-06-04 — `Tour.startTime` (hora de salida)

## Qué se agregó

Columna **`startTime String?`** al modelo `Tour` (`prisma/schema.prisma`).

```prisma
startTime     String?            // hora de salida "HH:MM" (24h); null = sin definir (legacy)
```

## Por qué `String?` (y no `DateTime`)

- El dato es una **hora del día** ("HH:MM", 24h), no un instante con fecha. `DateTime`
  obligaría a inventar una fecha y a lidiar con zonas horarias — innecesario.
- El frontend ya produce y consume el valor como string `"HH:MM"` (viene de un
  `<input type="time">`), así que guardar el mismo string es un round-trip directo.
- **Nullable** (`?`, sin default) por coherencia con otros opcionales del modelo
  (`meetingPoint`, `shortPitch`, `imageUrl`) y para no romper los tours existentes.

## Impacto en datos existentes

- Es un cambio **no destructivo** (columna nullable nueva): no hubo pérdida de datos.
- Los **41 tours existentes** (seed + creados) quedaron con `startTime = null`.
  Verificado tras el push: `41 total / 0 con startTime / 41 null`.
- El frontend ya tiene un fallback (`tour.startTime || "08:00"`) que cubre los `null`
  legacy sin romper. La persistencia real de la hora se conecta en M3.2 (backend:
  `lib/tour-input.ts` + `lib/tour-select.ts`) y M3.3 (frontend), fuera de esta migración.

## Cómo se aplicó

Con **`prisma db push`** (NO `migrate dev`, por la regla del proyecto: drift de las
extensiones de Supabase). El cliente Prisma se regeneró en el mismo paso.

```bash
npx dotenv-cli -e .env.local -- npx prisma db push
npm run db:generate
```

Resultado: `🚀  Your database is now in sync with your Prisma schema.` (sin warnings de
pérdida de datos).
