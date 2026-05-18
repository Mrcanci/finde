# Investigación: número real de tours en producción

Fecha: 2026-05-17
Rama: feature/tours-db-i18n
Pregunta: ¿por qué el usuario ve 44 tours en finde.pe/demo si el código
parece hacer reemplazo (no merge)?

## TL;DR

**El usuario tiene razón: hay 44 tours visibles.**
La hipótesis previa de "reemplazo" era incorrecta — basada en una lectura
parcial del archivo. El código SÍ hace merge: `setTours([...apiMapped, ...localOnly])`
en `src/AppDemo.jsx:3613`. El intento de deduplicar por título no captura
ninguno de los 4 duplicados detectados en la auditoría anterior porque el
match es **igualdad exacta** post-`toLowerCase().trim()`, y los títulos
hardcoded vs DB son **parecidos pero no idénticos** (ej. "Cañón del Colca
2D/1N" vs "Cañón del Colca 2 días con vuelo del cóndor"). Resultado:
30 (API) + 14 (locales) = **44**.

## Lógica de carga actual

### Estado inicial (`src/AppDemo.jsx:3576`)

```jsx
const [tours, setTours] = useState(() => TOURS.map(ensureAvailabilityFields));
```

Arranca con los **14 tours hardcoded** del array `TOURS` (línea 211).

### useEffect que hace fetch a `/api/tours` (`src/AppDemo.jsx:3589-3620`)

```jsx
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

**Comentario clave en el código (líneas 3596-3598):** ya está documentado
que se hace merge intencional para conservar mocks que `TripsView`/`NOTIFS`
referencian por id (ej. "Sandboarding en Huacachina"). No es un bug
involuntario, es deliberado — pero el filtro de deduplicación por título
exacto deja pasar duplicados temáticos.

### Otros `setTours` en el archivo (NO afectan el conteo inicial)

- **`src/AppDemo.jsx:3710`** — `handleReview`: actualiza rating/reviewsCount de un tour existente. **No agrega**.
- **`src/AppDemo.jsx:3739`** — `handleSaveTour`: actualiza un tour existente cuando el operador edita desde el dashboard. **No agrega**.
- **`src/AppDemo.jsx:3781`** — `handleCreateTour`: agrega un nuevo tour cuando el operador crea uno desde el dashboard. Solo se dispara en flujo de operador, no en la carga inicial del demo.

### Conclusión sobre la lógica

**MERGE** (no reemplazo, no otro). Concretamente:
```
tours_finales = api_30_tours + hardcoded_14_que_no_matchean_por_titulo_exacto
```

## Datos reales

### Fetch a `/api/tours?limit=50` (producción)

```
$ curl -sL "https://finde.pe/api/tours?limit=50"
→ { "tours": [ ... 30 items ... ] }
```

- `limit=100` → la API responde 400: `{"error":"Parámetros inválidos","details":[{...,"maximum":50,...}]}`. **Límite duro de 50 en el endpoint.**
- `limit=50` (lo que pide AppDemo) → **30 tours**.
- No hay paginación implementada en el cliente; el `useEffect` solo hace una llamada.

**Primeros 5 (orden devuelto por la API):**

| id (prefijo) | título |
|---|---|
| cmoh8rea5... | Comunidad Q'eros: vivencial 2 días |
| cmoh8rcy4... | Tour gastronómico Miraflores y Barranco |
| cmoh8rbzp... | Machu Picchu Full Day desde Cusco |
| cmoh8re4h... | Tambopata 3 días: collpa de guacamayos |
| cmoh8rceb... | Trek a Choquequirao 4 días |

**Últimos 5:**

| id (prefijo) | título |
|---|---|
| cmoh8rd6l... | Lomas de Lúcumo: bosque de neblina costero |
| cmoh8rdhw... | Ascenso al volcán Misti 2 días |
| cmoh8rcha... | Sacsayhuamán y Cusco Imperial |
| cmoh8rd3t... | Pachacamac: santuario costeño pre-inca |
| cmoh8rdf3... | Ruta del Sillar: la cantera blanca de Arequipa |

### Conteo directo en DB (Prisma)

```
prisma.tour.count() → 30
```

El schema actual (`prisma/schema.prisma`) **no tiene** campos `deletedAt`,
`active`, ni `published`. Todos los tours de la tabla son visibles. No hay
soft-delete ni gating de publicación.

### Simulación local del merge (`/tmp/simulate-merge.mjs`)

```
API tours: 30
Hardcoded tours: 14
Title collisions (exact lowercased): 0 []
localOnly survivors: 14
Final merged count: 44
```

**Ninguno de los 14 títulos hardcoded coincide exactamente** (después de
`toLowerCase().trim()`) con ninguno de los 30 títulos de DB. Por eso los
14 sobreviven el filtro y se concatenan.

Casos de duplicación temática que el filtro NO captura:

| Hardcoded | DB | Razón por la que no matchea |
|---|---|---|
| "Tour Gastronómico por Lima" | "Tour gastronómico Miraflores y Barranco" | sufijos distintos |
| "Valle Sagrado en un Día" | "Valle Sagrado: Pisac, Ollantaytambo y Chinchero" | sufijos distintos |
| "Choquequirao: El Otro Machu Picchu" | "Trek a Choquequirao 4 días" | prefijo y sufijo distintos |
| "Cañón del Colca 2D/1N" | "Cañón del Colca 2 días con vuelo del cóndor" | "2D/1N" vs "2 días con vuelo del cóndor" |

## Comparación de hipótesis

| Métrica | Valor |
|---|---|
| Tours en DB (total) | **30** |
| Tours en DB activos / visibles | **30** (no hay flags) |
| Tours devueltos por `/api/tours?limit=50` en prod | **30** |
| Tours en array `TOURS` hardcoded | **14** |
| Hipótesis previa (reemplazo `setTours(mapped)`) | 30 |
| Hipótesis usuario (44 visibles) | **44** ✅ |

**La hipótesis del usuario es la correcta.** El código en `src/AppDemo.jsx:3613`
hace `setTours([...apiMapped, ...localOnly])`, no reemplazo. La hipótesis
previa se basó en lectura parcial; el bloque real tiene dedupe por título
exacto que no captura los duplicados temáticos.

## Verificación local == producción

```
git diff main..feature/tours-db-i18n -- src/AppDemo.jsx
→ (sin diferencias)
```

El `src/AppDemo.jsx` de la rama `feature/tours-db-i18n` es **idéntico** al
de `main`, que es lo que está deployado en finde.pe. No hay drift entre
lo investigado y lo que ve el usuario.

Otras fuentes potenciales de tours (grep en `src/`):

```
src/AppDemo.jsx:211:  const TOURS = [
src/AppDemo.jsx:3576: const [tours, setTours] = useState(() => TOURS.map(...));
src/AppDemo.jsx:3613: setTours([...apiMapped, ...localOnly]);
src/AppDemo.jsx:3710: setTours(prev => prev.map(...));       // review handler
src/AppDemo.jsx:3739: setTours(prev => prev.map(...));       // edit tour handler
src/AppDemo.jsx:3781: setTours(prev => [...prev, ...]);      // create tour handler (operator)
```

No hay otras fuentes ocultas: el único origen de datos es `TOURS` + `/api/tours`.

## Conclusión

**El usuario ve 44 tours porque el código mergea explícitamente API + hardcoded.**

Causas raíz combinadas:
1. **Decisión de diseño explícita** (líneas 3596-3598): el merge se hizo
   intencionalmente para que `TripsView` y `NOTIFS` puedan seguir referenciando
   mocks (ej. "Sandboarding en Huacachina") incluso después de que la API
   responde, sin romper la demo.
2. **El filtro de dedupe es muy débil** (igualdad exacta de título
   lowercased). 4 de los 14 hardcoded son **duplicados temáticos** del
   contenido en DB pero con títulos suficientemente distintos como para
   pasar el filtro. Esto genera contenido visualmente duplicado:
   - Dos tours de Valle Sagrado (uno hardcoded "Valle Sagrado en un Día", otro de DB "Valle Sagrado: Pisac…").
   - Dos tours del Colca.
   - Dos tours de Choquequirao.
   - Dos tours gastronómicos en Miraflores/Barranco.

**Consecuencias sobre la auditoría anterior:**
- La auditoría `2024-tours-hardcoded-vs-db.md` clasificó 4 hardcoded como
  "duplicados exactos" y 1 como "probable" — esa clasificación **sigue
  siendo correcta a nivel de contenido**, pero la conclusión operativa
  cambia: hoy esos duplicados **están visibles simultáneamente al usuario
  en producción**, no son una redundancia inofensiva.
- El recuento de la auditoría anterior asumió implícitamente que solo
  uno de los dos sobreviviría. En producción, **ambos sobreviven**.

## Recomendación

**Prioridad 1 — Decidir qué versión gana para los 4-5 duplicados temáticos
antes de cualquier migración.** Una vez decidido, hay tres caminos:

1. **Fortalecer el filtro de dedupe en `AppDemo.jsx:3596-3611`.** Reemplazar
   el match por título exacto con una heurística por `location + categoría +
   palabra-clave` (ej. "valle sagrado", "colca", "choquequirao", "gastronómic"
   en Lima). Mantiene el merge pero deduplica casos temáticos. **Solución
   menos invasiva, no requiere migración.**

2. **Eliminar los 4 hardcoded duplicados directamente del array `TOURS`**
   (`src/AppDemo.jsx` líneas 213, 215, 218, 219). Mantiene la lógica de
   merge actual para los 9 únicos y el demo deja de mostrar doblones.
   **Recomendado a corto plazo**: rápido, reversible, alineado con el plan
   de migración.

3. **Migrar los 10 únicos al seed de Prisma y eliminar el merge.** Solución
   final, pero más trabajo. Requiere ampliar el enum `Category` (`beach`,
   `trekking`), normalizar precios (céntimos) y duraciones (horas), decidir
   qué hacer con `titleQu`/`descQu`/`altTour`/`badge`/`cancellation`/
   `meetingPoint`/`days`/`excludedDates`/`addedDates` que el schema actual
   no contempla (ver "Diferencias de schema detectadas" en la auditoría
   previa).

**Para tu pitch de los concursos**: hoy el demo muestra 44 tours, no 30.
Si comunicas "30 tours en DB con búsqueda semántica", el evaluador verá
44 y notará la inconsistencia. Vale la pena alinear el discurso con el
estado real **antes** de cualquier submission.
