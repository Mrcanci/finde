# Investigación: dependencias del array `TOURS` en AppDemo.jsx

Fecha: 2026-05-19
Branch: feature/tours-db-i18n
Tag de retorno: pre-phase-3-frontend-refactor
Pregunta: ¿qué hay que cambiar para eliminar el array `TOURS` (líneas 211-226) sin romper el demo?

## Resumen ejecutivo

- **Referencias directas a `TOURS`:** 6 sitios (1 declaración + 5 lecturas).
- **Dependencias por id numérico 1-14:** 2 estructuras críticas (`MY_TRIPS`, `REVIEWS`) + 2 fallbacks de booking/trip locales que detectan `typeof tour.id === "number"`.
- **Cambios necesarios para retirar el array:** rediseñar 3 estados (`tours`, `opTours`, `trips`) para que se hidraten desde el fetch API en lugar de seed estático, simplificar el merge a `setTours(apiMapped)` directo, y decidir qué hacer con `REVIEWS` curadas y los fallbacks "local demo tour".
- **Riesgo estimado:** **medio**. La eliminación en sí es mecánica, pero el demo tiene dos fallbacks (`isLocalDemoTour` en booking, `handleAddLocalTrip`) que existen *porque* hay tours con id numérico. Esos fallbacks siguen necesitándose para tours que el operador crea inline desde `new-tour` (usan `Date.now()` como id numérico). Hay que conservar la rama "local id" sin que dependa de `TOURS`.

## Referencias a `TOURS`

| Línea | Contexto | Acción necesaria |
|---:|---|---|
| 211-226 | `const TOURS = [ … 14 tours … ];` declaración. | **Eliminar** al final del refactor (paso último). |
| 406 | `MY_TRIPS[0].tour = TOURS[0]` (Pastoruri) | Reescribir `MY_TRIPS`: arrancar con `[]` o resolver por CUID al recibir API. |
| 407 | `MY_TRIPS[1].tour = TOURS[1]` (Tour Gastro Lima) | idem |
| 408 | `MY_TRIPS[2].tour = TOURS[4]` (Sandboarding Huacachina) | idem |
| 409 | `MY_TRIPS[3].tour = TOURS[3]` (Valle Sagrado) | idem |
| 3576 | `useState(() => TOURS.map(ensureAvailabilityFields))` — seed inicial de `tours`. | Cambiar a `useState([])`. La UI verá vacío hasta que llegue `/api/tours`. |
| 3603 | `TOURS.filter(t => !apiTitles.has(norm(t.title)))` — fallback `localOnly` del merge. | Eliminar todo el bloque 3596-3613 → `setTours(apiMapped)`. |
| 3650 | `TOURS.find(x => x.id === tourId)` dentro de `fromTour` para seed de `opTours`. | Reescribir `opTours` init: arrancar `[]` y rehidratar tras fetch (mismo `useEffect` que `tours`). |
| 3673 | `TOURS.map((t, i) => fromTour(i+1, t.id, true, t.image))` — seed inicial de `opTours`. | idem |

## Dependencias por id hardcoded 1-14

### `NOTIFS` (líneas 396-403)

**Sin referencia estructural a tour.id.** Las notificaciones solo mencionan títulos como texto plano ("Sandboarding en Huacachina", "Trekking al Nevado Pastoruri", "Tour Gastronómico por Lima"). No requiere cambio para retirar `TOURS`, pero los textos quedarán desactualizados si los títulos en DB difieren.

### `MY_TRIPS` (líneas 405-410)

```js
{ id:101, tour:TOURS[0], date:"19 May 2026", ... }
```
Embede el objeto tour completo en cada trip. `trip.tour.id` se usa en `onReview(trip.id, trip.tour.id, ...)` (línea 2655) → entra a `setReviews(prev => ({...prev, [tourId]: ...}))` (línea 3707), guardando con clave numérica.

**Acción:** dos opciones:
- (a) iniciar `MY_TRIPS = []` y dejar que el usuario "cree" trips reservando — limpio, pierde el seed de "mis viajes" para el primer login.
- (b) tras `setTours(apiMapped)`, construir `MY_TRIPS` mapeando los primeros N tours con CUIDs reales — preserva el demo de "mis viajes".

### `REVIEWS` (líneas 412-480)

Diccionario `{ [tourId]: Review[] }` con claves numéricas 1-14 (los mismos ids de `TOURS`). Consumido en línea 2022:

```js
const realRevs = reviews[tour.id];
const tourRevs = (realRevs && realRevs.length > 0)
  ? realRevs
  : (tour.reviews > 0 ? generateMockReviews(tour) : []);
```

Tras retirar `TOURS`, los `tour.id` serán CUIDs → `reviews[cuid]` → `undefined` → cae automáticamente a `generateMockReviews` (determinístico por hash del id). **Funciona sin cambio**, pero los 39 reviews curados (firmados por viajeros reales/inventados como "Carlos M.", "Sofía R.", etc.) se vuelven dead code.

**Acción recomendada:** mover esos reviews curados a la DB (tabla Review o JSON columns en Tour) en una fase posterior. Mientras tanto, dejarlos o borrarlos al gusto.

### `isLocalDemoTour` (línea 2380, BookingView)

```js
const isLocalDemoTour = typeof tour.id === "number";
if (isLocalDemoTour) { /* confirmación local sin POST /api/bookings */ }
```
Existe porque `/api/bookings` valida `tourId` como CUID y rechaza los numéricos hardcoded. **Importante:** no se puede borrar este branch del todo, porque el operador puede crear tours nuevos desde `new-tour` (línea 3781) y esos siguen recibiendo id numérico (`newTourId` = secuencial). Hay que mantener la rama "local id" pero saber que ya no aplica a los 14 hardcoded.

### `handleAddLocalTrip` (líneas 3819-3840)

Espejo de lo anterior para trips. Sigue siendo necesario para tours creados inline por el operador (id numérico), aunque ya no para los 14 hardcoded.

## `opTours` (línea 3648-3674)

```js
const [opTours, setOpTours] = useState(() => {
  const fromTour = (id, tourId, active, image) => {
    const t = TOURS.find(x => x.id === tourId) || {};
    return { id, tourId, active, image, title: t.title || "", … };
  };
  return TOURS.map((t, i) => fromTour(i + 1, t.id, true, t.image));
});
```

Cada `opTour` tiene `tourId` que apunta al id del tour real. Más adelante (línea 3847):

```js
const activeTours = tours.filter(t => {
  const op = opTours.find(o => o.tourId === t.id);
  return !op || op.active;
});
```

Es decir, si un tour tiene un opTour con `active:false`, se oculta. La filosofía actual asume que **todos los tours hardcoded pertenecen al "operador demo"** y por eso se crean opTours-mirror automáticamente.

**Acción propuesta para Fase 3:** en el `useEffect` que ya popula `tours` desde la API, crear `opTours` derivados de la misma respuesta (por ahora todos `active:true`, atados al CUID). Mantiene la semántica sin depender de `TOURS`. Alternativa: dejar `opTours = []` y aceptar que `activeTours` mostrará todos los tours (por el `!op || op.active`).

## Merge en `setTours` (líneas 3589-3620, bloque exacto a eliminar)

```js
useEffect(() => {
  let cancel = false;
  fetch("/api/tours?limit=50")
    .then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
    .then(data => {
      if (cancel) return;
      const apiMapped = (data.tours || []).map(mapTourFromApi).map(ensureAvailabilityFields);
      // Merge API + locales: el API no devuelve algunos mocks que TripsView/NOTIFS
      // referencian (ej. Sandboarding en Huacachina). Conservamos los locales no
      // presentes en API, deduplicando por título y reasignando IDs si chocan.
      const norm = (s) => (s || "").toLowerCase().trim();
      const apiTitles = new Set(apiMapped.map(t => norm(t.title)));
      const usedIds = new Set(apiMapped.map(t => t.id));
      let nextId = apiMapped.reduce((m, t) => Math.max(m, Number(t.id) || 0), 0) + 10000;
      const localOnly = TOURS
        .map(ensureAvailabilityFields)
        .filter(t => !apiTitles.has(norm(t.title)))
        .map(t => {
          if (!usedIds.has(t.id)) { usedIds.add(t.id); return t; }
          const newId = nextId++;
          usedIds.add(newId);
          return { ...t, id: newId };
        });
      if (apiMapped.length > 0 || localOnly.length > 0) {
        setTours([...apiMapped, ...localOnly]);
      }
    })
    .catch(err => {
      console.error("Error cargando tours, fallback a mock:", err);
    });
  return () => { cancel = true; };
}, []);
```

**Reemplazo propuesto** (~10 líneas):

```js
useEffect(() => {
  let cancel = false;
  fetch("/api/tours?limit=50")
    .then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
    .then(data => {
      if (cancel) return;
      const apiMapped = (data.tours || []).map(mapTourFromApi).map(ensureAvailabilityFields);
      setTours(apiMapped);
      // Hidratar opTours desde la misma respuesta:
      setOpTours(apiMapped.map((t, i) => ({
        id: i + 1, tourId: t.id, active: true, image: t.image,
        title: t.title, /* …resto de defaults para edición… */
      })));
    })
    .catch(err => console.error("Error cargando tours:", err));
  return () => { cancel = true; };
}, []);
```

## Plan de refactor propuesto

Orden recomendado (cada paso es testeable independientemente — usar `git commit` entre cada uno para poder hacer revert quirúrgico):

1. **Cambiar `useState` inicial de `tours` a `[]`** (línea 3576). Verificar que la pantalla muestra estado de carga sano antes de que llegue API.
2. **Cambiar `useState` inicial de `opTours` a `[]`** y mover su hidratación al `useEffect` del API (lineas 3589+). Verificar que el dashboard del operador muestra la lista correcta una vez carga el fetch.
3. **Simplificar el merge** (líneas 3596-3613) a `setTours(apiMapped)`. Probar `/demo` y confirmar que ya no aparecen los 12 duplicados semánticos (ver audit `2026-05-19-post-seed-duplicates.md`).
4. **Reescribir `MY_TRIPS`**: la opción más simple es arrancar con `[]` y aceptar que el primer login no ve "mis viajes" hasta que se reserve. Si se quiere preservar, hidratar tras fetch usando los primeros 4 CUIDs.
5. **Eliminar el array `TOURS`** (líneas 211-226) — debería quedar sin referencias después de pasos 1-4. Correr `grep -n "TOURS\b" src/AppDemo.jsx` para confirmar 0 hits.
6. **Decidir sobre `REVIEWS` curados**: dejarlos como dead code (sin costo runtime) o eliminarlos. `generateMockReviews` cubre el render.
7. **Mantener `isLocalDemoTour` y `handleAddLocalTrip`**: siguen siendo necesarios para tours creados por el operador inline (id numérico). Solo actualizar comentarios para clarificar que ya no aplican a los 14 hardcoded.

### Estimación de líneas removidas/cambiadas
- **Eliminar:** ~15 líneas (TOURS array, una vez compactado por entrada) + ~25 líneas (merge complejo + opTours seed) ≈ **40-55 líneas netas menos**.
- **Modificar:** ~10 líneas (useState inits + nuevo bloque dentro del useEffect).
- **Riesgo de regresión:** verificar manualmente las rutas: home → tour detail, dashboard operador → listings, my-trips, booking flow para tours locales vs API.
