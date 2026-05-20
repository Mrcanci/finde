# Investigación: 40 tours en API, 39 en UI

Fecha: 2026-05-19
Rama: feature/tours-db-i18n (Fase 3.1 sin commit aún)

## Resumen

El filtro `activeTours` (línea 3750 de `src/AppDemo.jsx`) oculta tours cuyo `opTour` tiene `active: false`. La hidratación de `opTours` que introduje en Fase 3.1 marca el 4to tour del fetch como inactivo (`active: i < 3`), siguiendo literalmente la instrucción del prompt anterior ("primeros 3 activos, el 4to inactivo"). Resultado: 40 API − 1 inactivo = **39 visibles**. El tour que queda invisible es **"Machu Picchu Full Day desde Cusco"** (id `cmoh8rbzp0009vpn26ju9npzp`), porque el endpoint devuelve los tours en orden no determinístico y le tocó el índice 3.

## Filtros encontrados en el frontend

`mapTourFromApi` (línea 214-244) **no descarta tours** — no tiene `return null` ni condicionales que filtren.

El `useEffect` del fetch (líneas 3504-3546) tampoco filtra. Hace `setTours(apiMapped)` directo con los 40.

El único filtro relevante encontrado:

| Línea | Código | Efecto |
|---:|---|---|
| 3750 | `tours.filter(t => { const op = opTours.find(o => o.tourId === t.id); return !op || op.active; })` | **Excluye tours con opTour.active=false** |

Otros filtros sobre `tours` (líneas 1580, 1666, 1671) operan por `cat` o por resultados de búsqueda — no aplican al render inicial de home/catalog y pasan después por `activeTours`.

Las vistas `HomeView` y `CatalogView` reciben `tours={activeTours}` (líneas 3760-3761), por eso el efecto se ve en ambas.

## El tour invisible

- **ID:** `cmoh8rbzp0009vpn26ju9npzp`
- **Título:** Machu Picchu Full Day desde Cusco
- **City:** Cusco
- **Razón por la que no aparece:** el endpoint `/api/tours?limit=50` lo devuelve en posición `[3]` (4to elemento). Mi hidratación de `opTours` en Fase 3.1 hace:
  ```js
  return apiMapped.slice(0, 4).map((t, i) => ({
    ...
    active: i < 3,   // ← índice 3 = active:false
    ...
  }));
  ```
  Eso crea un `opTour` con `tourId = cmoh8rbzp0009vpn26ju9npzp` y `active: false`. El filtro `activeTours` lo oculta.

**Peor detalle:** el endpoint no fuerza un orden determinístico, así que *cualquier* tour puede caer en el índice 3 entre cargas. Hoy es Machu Picchu; mañana podría ser otro. El bug es estructural, no específico de un tour.

## Recomendación

Cambiar la hidratación de opTours para que **todos los `active: true`**:

```js
// En src/AppDemo.jsx, useEffect del fetch (~líneas 3514-3540):
return apiMapped.slice(0, 4).map((t, i) => ({
  id: i + 1,
  tourId: t.id,
  active: true,   // ← antes: i < 3
  ...
}));
```

Razonamiento: el seed original de TOURS hardcoded creaba opTours con `active: true` para los 14 (línea 3673 pre-refactor: `TOURS.map((t, i) => fromTour(i + 1, t.id, true, t.image))` — el `true` era el parámetro `active`). Yo introduje el `i < 3` mal interpretando una sugerencia del prompt anterior que dijo "los primeros 3 activos, el 4to inactivo". Esa instrucción asumía que estábamos "demoteando" un tour para el dashboard del operador, pero no consideró que `activeTours` también afecta al render del catálogo público.

Alternativas equivalentes:
- (a) `active: true` en todos los slice(0,4) — más simple. **Recomendada.**
- (b) Si se quiere preservar la demo de "un tour inactivo en el dashboard", desacoplar: que el filtro `activeTours` solo aplique en `DashView`, no en `HomeView`/`CatalogView`. Cambio más invasivo.

**Bloqueante para commit de Fase 3.1:** sí, porque deja invisible al tour más importante del demo (Machu Picchu hoy, otro mañana). Es un one-liner: cambiar `active: i < 3` → `active: true`. Tarda 5 segundos. Mejor arreglarlo antes de commitear que dejarlo para otro PR.
