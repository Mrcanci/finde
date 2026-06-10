# 2026-06-09 — Corrección de 2 títulos truncados en la DB

## Qué hace

Corrige el `title` de **2 tours** que quedaron truncados a media frase en la DB (probable error de captura del seed original). `prisma/seed.ts` ya tiene los títulos completos, por lo que un seed futuro nace correcto — **solo hay que arreglar las filas existentes**. No toca el schema, no re-siembra, no borra, no afecta a ningún otro tour.

| id | title actual (truncado) | title corregido |
|---|---|---|
| `cmoh8rcha000jvpn2fo8kzet0` | `Sacsayhuamán y Cusco Impe` | `Sacsayhuamán y Cusco Imperial` |
| `cmoh8rcsg000rvpn2bhwxmomr` | `Tambomachay: baño ritual del` | `Tambomachay: baño ritual del Inca` |

Tras el rename, **re-genera el embedding** de esos 2 tours, porque el título forma parte del `embeddingText` (`${title}. ${description}. ${category}. ${city}, ${region}`). Reusa `embedTourSafe` (`lib/tour-input.ts`) — no reimplementa la llamada a Voyage ni el `UPDATE` del vector. Impacto semántico bajo (la descripción, intacta, domina el vector), pero se hace por coherencia.

## Comando

```bash
npx dotenv-cli -e .env.local -- npx tsx scripts/fix-truncated-titles.ts
```

- `UPDATE` **solo** de esos 2 ids (por ID exacto, nunca por título).
- Imprime `title` antes→después de cada uno y un resumen (renombrados / re-embeddeados).
- **Idempotente:** si un título ya está corregido, salta el rename; el re-embed reescribe el mismo vector sin efectos secundarios.
- Requiere `VOYAGE_API_KEY` para el re-embed. Si Voyage falla, `embedTourSafe` **no lanza**: el título queda corregido y el embedding podría quedar pendiente (re-ejecutable).

## Reversibilidad

```sql
-- Volver a los títulos truncados (no recomendado; solo si hiciera falta revertir):
UPDATE "Tour" SET title = 'Sacsayhuamán y Cusco Impe'   WHERE id = 'cmoh8rcha000jvpn2fo8kzet0';
UPDATE "Tour" SET title = 'Tambomachay: baño ritual del' WHERE id = 'cmoh8rcsg000rvpn2bhwxmomr';
```

El embedding se regeneraría re-ejecutando `scripts/generate-embeddings.ts` (o este script). Sin pérdida de datos: el cambio es un `UPDATE` de 2 campos `title` + sus vectores.
