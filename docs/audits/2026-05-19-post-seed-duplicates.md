# Auditoría: duplicados visibles en /demo post Fase 2.1

Fecha: 2026-05-19
Rama: feature/tours-db-i18n
Contexto: tras seedar 10 tours nuevos, la DB tiene 40 tours. El frontend mergea con 14 hardcoded → en producción se ven **52 tours**. Esta auditoría explica por qué (no son 50) y cuáles duplicados semánticos quedan visibles.

## 1. Hardcoded en `src/AppDemo.jsx` (14 tours)

| id | título |
|---|---|
| 1  | Trekking al Nevado Pastoruri |
| 2  | Tour Gastronómico por Lima |
| 3  | Islas Ballestas + Paracas |
| 4  | Valle Sagrado en un Día |
| 5  | Sandboarding en Huacachina |
| 6  | Avistamiento de Ballenas |
| 7  | Choquequirao: El Otro Machu Picchu |
| 8  | Cañón del Colca 2D/1N |
| 9  | Sandboarding & Buggy en Paracas |
| 10 | Trekking al Nevado Rajuntay |
| 11 | Playa La Mina & Reserva de Paracas |
| 12 | Castillo de Chancay & Puerto |
| 13 | Lima de Noche: Circuito Mágico del Agua |
| 14 | Lunahuaná: Canotaje + Canopy + Vino |

## 2. Lógica de dedupe (AppDemo.jsx:3596-3613)

```js
const norm = (s) => (s || "").toLowerCase().trim();
const apiTitles = new Set(apiMapped.map(t => norm(t.title)));
// ...
const localOnly = TOURS
  .map(ensureAvailabilityFields)
  .filter(t => !apiTitles.has(norm(t.title)))   // ← criterio único
  .map(...id reasignado si choca...);
setTours([...apiMapped, ...localOnly]);
```

**Criterio:** comparación exacta de título, normalizado por `toLowerCase()` + `trim()`. No hay fuzzy match, ni comparación por ciudad/categoría, ni stripping de puntuación o acentos.

## 3. Simulación del merge

- DB (API): 40
- Hardcoded: 14
- Dedupeados (match exacto): **2** → `Trekking al Nevado Pastoruri`, `Lima de Noche: Circuito Mágico del Agua`
- Hardcoded sobrevivientes: **12**
- **Total visible en UI: 40 + 12 = 52** ✓ coincide con producción.

## 4. Sobrevivientes y sus duplicados semánticos en DB

Los 12 hardcoded que sobreviven tienen TODOS un tour equivalente en DB que el dedupe exacto no detecta. Cada par (hardcoded → DB) es un duplicado semántico real visible al usuario:

| # | Hardcoded (sobrevive) | DB equivalente (no se dedupea) | Notas |
|---|---|---|---|
| 2  | Tour Gastronómico por Lima | Tour gastronómico Miraflores y Barranco | Mismo concepto, distinto wording |
| 3  | Islas Ballestas + Paracas | Islas Ballestas + Reserva de Paracas | Wording casi idéntico, falla por una palabra |
| 4  | Valle Sagrado en un Día | Valle Sagrado: Pisac, Ollantaytambo y Chinchero | Mismo destino |
| 5  | Sandboarding en Huacachina | Sandboarding y Buggies en Huacachina | Mismo destino + actividad |
| 6  | Avistamiento de Ballenas | Avistamiento de Ballenas Jorobadas en Los Órganos | DB es más específico |
| 7  | Choquequirao: El Otro Machu Picchu | Trek a Choquequirao 4 días | Mismo destino, distinto framing |
| 8  | Cañón del Colca 2D/1N | Cañón del Colca 2 días con vuelo del cóndor | Mismo tour |
| 9  | Sandboarding & Buggy en Paracas | Sandboarding y Quad Bikes en Paracas | Mismo destino + actividad (quad ≈ buggy) |
| 10 | Trekking al Nevado Rajuntay | Trekking a la Laguna Rajuntay | DB cambió Nevado→Laguna, ciudad Lima/Marcapomacocha |
| 11 | Playa La Mina & Reserva de Paracas | Playa La Mina y Playa Roja en Paracas | Mismo destino |
| 12 | Castillo de Chancay & Puerto | Castillo de Chancay y Mercado Tradicional | Mismo destino, distinto add-on |
| 14 | Lunahuaná: Canotaje + Canopy + Vino | Lunahuaná: vino, pisco y deportes de aventura | Mismo destino + perfil |

**Los 2 que SÍ dedupean (1 y 13):** sucede porque al migrarlos a DB en Fase 2.1 se copió el título hardcoded literalmente. Los otros 8 migrados (originalHardcodedId 3, 5, 6, 9, 10, 11, 12, 14) recibieron títulos más descriptivos al pasar a DB y por eso quedan duplicados con sus propios originales hardcoded.

## 5. Diagnóstico

- El dedupe por título exacto **funciona como diseñado**, no es un bug: simplemente no es suficiente para esta data.
- De los 14 hardcoded, **12 son duplicados semánticos** de tours ya en DB (4 que ya existían antes de Fase 2.1 + 8 recién creados por el seed con título ligeramente distinto).
- Antes de Fase 2.1 había 30 DB + 14 hardcoded = 44 visibles, con ~4 duplicados ocultos (Ballestas, Valle Sagrado, Choquequirao, Colca preexistentes).
- Después de Fase 2.1: 40 + 12 = 52 visibles, con **12 duplicados semánticos** — empeoró el ratio porque el seed creó nuevos DB tours con títulos no idénticos a los hardcoded originales.

## 6. Recomendaciones (no ejecutar — son ideas)

Tres caminos posibles para Fase 3:

1. **Eliminar el array `TOURS` hardcoded** una vez que el frontend tenga fallbacks robustos y los flujos TripsView/NOTIFS no dependan de IDs hardcoded. Solución limpia, total visible = 40.
2. **Alinear títulos** en las dos fuentes (renombrar los 10 migrados en DB para que coincidan exactamente con sus hardcoded, o viceversa). Mantiene el merge pero baja a 40 visibles.
3. **Dedupe más agresivo** (por ciudad + primera palabra clave del título, o por slug). Frágil; postergaría el problema real (la fuente dual).

La opción 1 es la que el plan del sprint marca como Fase 3.
