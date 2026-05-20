# Investigación: setup Voyage embeddings

Fecha: 2026-05-19
Rama: feature/tours-db-i18n
Último commit: 338d890

## Script encontrado

- **Ruta:** `scripts/generate-embeddings.ts`
- **Cliente Voyage:** `lib/voyage.ts` (cliente HTTP minimalista propio, no usa el SDK `voyageai` aunque está en `dependencies` — fue reemplazado por incompatibilidad ESM en Node 20+)
- **Última modificación:** commit `7ff1ade` — Tue Apr 28 2026 09:20:24 -0500 — *feat(day-3): AI semantic search with Voyage embeddings + Claude reranking*
- **Endpoint usado:** `https://api.voyageai.com/v1/embeddings` (POST, Bearer token)
- **Modelo Voyage:** `voyage-3` (constante `MODEL_EMBED` en `lib/voyage.ts:5`)
- **Dimensión:** 1024 (constante `DIM`, validada por el script antes de hacer UPDATE)
- **Campos del Tour usados para el embedding:**
  ```
  `${title}. ${description}. ${category}. ${city}, ${region}`
  ```
  Concatenación simple con `inputType: "document"`.
- **Variable de entorno:** `VOYAGE_API_KEY` (leída en el constructor de `VoyageClient`; lanza error si falta)
- **Parametrización:** procesa **todos los tours con `embedding IS NULL`** ordenados por `createdAt ASC`. No acepta `tourId` como argumento — es idempotente: si todos ya tienen embedding, no hace nada.
- **Manejo de errores:** try/catch por tour, no aborta el lote — acumula fallidos en un array y los lista al final con `process.exitCode = 1`.
- **Rate limiting:** `sleep(100)` ms entre tours (excepto el último).
- **UPDATE en DB:** SQL crudo con `embedding = ${literal}::vector` (Prisma no soporta filtrar/escribir `Unsupported("vector(1024)")` directamente).

## Estado de embeddings en DB

- Total tours: **30**
- Tours CON embedding: **30**
- Tours SIN embedding: **0**

Verificado vía `prisma.tour.count()` + `SELECT count(*) WHERE embedding IS NOT NULL`.

## Configuración

- `VOYAGE_API_KEY` en `.env`: **Sí** (también en `.env.local`)
- Archivos de env presentes: `.env`, `.env.local`, `.env.production.local`, `.env.example`
- **Scripts de npm relacionados:** ninguno dedicado. El script se ejecuta manualmente con:
  ```
  dotenv -e .env.local -- tsx scripts/generate-embeddings.ts
  ```
  (Uso documentado en el comentario de la línea 4 del script.)

## Reproducibilidad

**Sí, sin modificaciones.** El script ya está diseñado para regenerar embeddings de tours nuevos:

1. Detecta automáticamente los tours con `embedding IS NULL` vía SQL crudo.
2. Genera embedding por cada uno usando los mismos 5 campos (`title`, `description`, `category`, `city`, `region`).
3. Hace `UPDATE` idempotente (los 30 tours ya procesados no se vuelven a tocar).
4. Tiene rate limiting de 100ms y manejo de errores por tour.

Para los 10 tours nuevos de Fase 2 basta con:
1. Insertar los tours en DB (sin embedding, o con `embedding = NULL`).
2. Correr `dotenv -e .env.local -- tsx scripts/generate-embeddings.ts`.

## Recomendación

**Reusar el script tal cual** para Fase 2. Es robusto, idempotente y ya validado en producción (los 30 tours actuales fueron procesados con él).

Consideraciones menores (no bloqueantes):
- El paquete `voyageai` (`^0.2.1`) sigue declarado en `dependencies` de `package.json` pero el cliente real está en `lib/voyage.ts`. Es código muerto en `node_modules`; podría eliminarse en una limpieza separada — no aplica a Fase 2.
- Si en Fase 2 se cambia el texto fuente del embedding (ej. agregar `tags` o nuevos campos editoriales), habría que **regenerar los 30 tours existentes también** para mantener consistencia en el espacio vectorial. Si solo se agregan 10 tours con el mismo formato actual, no hace falta tocar los 30.
- Sugerir agregar un npm script `"embeddings": "dotenv -e .env.local -- tsx scripts/generate-embeddings.ts"` para descubribilidad (opcional, no urgente).
