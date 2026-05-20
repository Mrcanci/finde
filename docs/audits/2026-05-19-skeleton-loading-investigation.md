# Investigación: Skeleton loading para grid de tours

**Fecha:** 2026-05-19
**Branch:** `feature/tours-db-i18n`
**Último commit:** `4121e77` (Fase 4)

Objetivo Fase 5: mostrar 8 placeholders animados (shimmer) mientras
`fetch /api/tours` está en curso, en lugar de la pantalla vacía actual.

## 1. Stack de styling

**No hay Tailwind.** El proyecto usa una única plantilla CSS
inlineada en `src/AppDemo.jsx`:

```jsx
const CSS = `...`;            // L556-1300+ aprox
return (
  <>
    <style>{CSS}</style>
    ...
  </>
);
```

`src/index.css` y `src/App.css` existen pero no tienen ni skeleton
ni keyframes (vacíos para este propósito). **Todo el styling del
demo vive en el bloque `const CSS` de `AppDemo.jsx`.**

## 2. Render del grid de tours

Cuatro lugares renderizan listas de tours:

| # | Archivo:Línea | Vista | Contenedor CSS | Card | Fuente datos |
|---|---|---|---|---|---|
| 1 | `AppDemo.jsx:1655` | HomeView "Populares este mes" | `.tscr` (carousel horizontal) | `TCard` | `feat` (top tours por rating) |
| 2 | `AppDemo.jsx:1675` | HomeView "Tours en {ciudad}" | `.tscr.city-tscr` (carousel horizontal) | `TCard` | `allCityTours` |
| 3 | `AppDemo.jsx:1689` | HomeView grid "Explora experiencias" | `.tg` (grid 2 columnas) | `GCard` | `filt` |
| 4 | `AppDemo.jsx:1931` | CatalogView grid principal | `.tg` (grid 2 columnas) | `GCard` | `filt` |

Pattern del map (idéntico en los 4):

```jsx
{collection.map((t) => <Card key={t.id} t={t} onClick={...} />)}
```

## 3. Componentes de card

### `TCard` (AppDemo.jsx:1413-1427) — carousel

```jsx
<div className="tc">
  <div className="tc-img" style={imgBg(t.image)}>
    {t.verified && <span className="tc-ver">Verificado</span>}
  </div>
  <div className="tc-b">
    <div className="tc-loc">{t.location}</div>
    <div className="tc-tl">{t.title}</div>
    <div className="tc-m">★ {t.rating} ({t.reviews}) · {t.duration}</div>
    <div className="tc-ft"><div className="tc-pr">S/ {t.price}</div></div>
  </div>
</div>
```

### `GCard` (AppDemo.jsx:1429-1466) — grid

```jsx
<div className="gc">
  <div className="gc-img" style={imgBg(t.image)}>
    {t.verified && <span className="gc-ver">Verificado</span>}
  </div>
  <div className="gc-b">
    <div className="gc-loc">{t.location}</div>
    <div className="gc-t">{t.title}</div>
    <div className="gc-m">★ {t.rating} ({t.reviews}) · {t.duration}</div>
    <div className="gc-p">S/ {t.price}</div>
  </div>
</div>
```

## 4. Dimensiones reales (CSS L818-843)

### TCard `.tc`

| Propiedad | Valor |
|---|---|
| flex | `0 0 260px` (ancho fijo 260px) |
| border-radius | `20px` |
| box-shadow | `0 2px 12px rgba(0,0,0,.06)` |
| `.tc-img` height | **160px** |
| `.tc-b` padding | `14px` |
| `.tc-loc` | font 11px, uppercase |
| `.tc-tl` | font 15px, weight 700, line-height 1.3 (~2 líneas) |
| `.tc-m` | font 12px, gap 6px |
| `.tc-pr` | font 16px |

**Altura total estimada:** 160 (img) + 14×2 (padding) + ~110 (texto) ≈ **300px**.

### Container `.tscr`

```css
.tscr{display:flex;gap:14px;padding:0 16px 24px;overflow-x:auto}
```

### GCard `.gc`

| Propiedad | Valor |
|---|---|
| ancho | `1fr` dentro de `.tg` (grid 2 columnas) |
| border-radius | `16px` |
| `.gc-img` height | **120px** |
| `.gc-b` padding | `10px` |
| `.gc-loc` | font 10px, uppercase |
| `.gc-t` | font 13px, weight 700, line-height 1.3 (~2 líneas) |
| `.gc-m` | font 11px |
| `.gc-p` | font 14px |

**Altura total estimada:** 120 (img) + 10×2 (padding) + ~80 (texto) ≈ **220px**.

### Container `.tg`

```css
.tg{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:0 16px 120px}
```

## 5. Estado actual de loading

### Fetch (AppDemo.jsx:3557-3601)

```jsx
const [tours, setTours] = useState([]);
const [opTours, setOpTours] = useState([]);

useEffect(() => {
  let cancel = false;
  fetch("/api/tours?limit=50")
    .then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
    .then(data => {
      if (cancel) return;
      const apiMapped = (data.tours || []).map(mapTourFromApi).map(ensureAvailabilityFields);
      setTours(apiMapped);
      setOpTours(prev => { ... });
    })
    .catch(err => {
      console.error("Error cargando tours:", err);
    });
  return () => { cancel = true; };
}, []);
```

Observaciones:

- **No existe** estado `isLoading` / `loadingTours` / `error`.
- `tours` arranca como `[]`. Mientras dura el fetch, `tours.length === 0`.
- `.catch` solo loguea; no setea estado → tras error, el grid queda
  igual de vacío que durante la carga.
- **Problema actual:** los 4 grids hacen `collection.map(...)` con
  collection vacía → renderizan nada. Eso es el "flash de pantalla vacía"
  que el skeleton va a tapar.

### `loading` en el demo (no relevante)

`grep loading` solo encuentra:
- `.ai-result.loading .ai-result-ic{animation:pulse 1.4s ...}` (L767) — animación del icono ✨ en el banner naranja de búsqueda IA.
- `geminiLoading` en `CatalogView` (L1711) — booleano local de la búsqueda IA.

Ningún `isLoading` global para el fetch inicial de tours.

## 6. Animaciones y keyframes existentes

`@keyframes` definidos en CSS (L645-650):

```css
@keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
@keyframes typingDot{0%,100%{opacity:.3}50%{opacity:1}}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
@keyframes glow{0%,100%{box-shadow:0 0 8px rgba(14,165,233,.2)}50%{box-shadow:0 0 20px rgba(14,165,233,.4)}}
```

### 🟢 `@keyframes shimmer` YA EXISTE (L649)

Buena noticia: el keyframe `shimmer` ya está definido **pero no se
usa en ninguna clase**. `grep -n "animation:.*shimmer\|animation-name:.*shimmer"`
→ **0 resultados**. Es CSS huérfano listo para consumir.

Implementación lista para skeleton (gradient sliding):

```css
.skeleton{
  background: linear-gradient(90deg,
    rgba(0,0,0,.06) 0%,
    rgba(0,0,0,.10) 50%,
    rgba(0,0,0,.06) 100%);
  background-size: 200% 100%;
  animation: shimmer 1.4s ease-in-out infinite;
  border-radius: 8px;
}
```

(El keyframe va de -200% a +200%; con background-size 200% el barrido
recorre el doble del ancho → efecto onda continua.)

## 7. Plan de implementación (Fase 5)

### Cambios necesarios en `src/AppDemo.jsx`

**1. Agregar estado de loading** (junto a L3540):

```jsx
const [tours, setTours] = useState([]);
const [toursLoading, setToursLoading] = useState(true);
```

**2. Apagar el flag al final del fetch** (L3597-3599):

```jsx
.catch(err => {
  console.error("Error cargando tours:", err);
})
.finally(() => {
  if (!cancel) setToursLoading(false);
});
```

(O usar `setToursLoading(false)` después de `setTours(apiMapped)` y dentro de `.catch`.)

**3. Crear componentes skeleton** (cerca de TCard/GCard, L1411 aprox):

```jsx
function TCardSkeleton() {
  return (
    <div className="tc skel-card">
      <div className="tc-img skeleton" />
      <div className="tc-b">
        <div className="skeleton sk-line sk-loc" />
        <div className="skeleton sk-line sk-title" />
        <div className="skeleton sk-line sk-title" style={{width: "60%"}} />
        <div className="skeleton sk-line sk-meta" />
        <div className="skeleton sk-line sk-price" />
      </div>
    </div>
  );
}

function GCardSkeleton() {
  return (
    <div className="gc skel-card">
      <div className="gc-img skeleton" />
      <div className="gc-b">
        <div className="skeleton sk-line sk-loc" />
        <div className="skeleton sk-line sk-title" />
        <div className="skeleton sk-line sk-title" style={{width: "55%"}} />
        <div className="skeleton sk-line sk-meta" />
        <div className="skeleton sk-line sk-price" />
      </div>
    </div>
  );
}
```

**4. Renderizar condicionalmente en los 4 lugares**:

| # | Línea | Cambio |
|---|---|---|
| 1 | L1655 carousel "Populares" | `toursLoading ? <>{Array.from({length:4}).map((_,i)=><TCardSkeleton key={i} />)}</> : feat.map(...)` |
| 2 | L1675 carousel "Tours en {city}" | igual con `TCardSkeleton` × 4 |
| 3 | L1689 grid HomeView | `toursLoading ? <>{Array(8).map(...)}<GCardSkeleton/></> : filt.map(...)` × 8 |
| 4 | L1931 grid CatalogView | igual con `GCardSkeleton` × 8 |

(8 skeletons en grids = 4 filas de 2 cards. La decisión aprobada
dice "8 skeletons (2 filas)" — chequear si refiere a 8 cards en 4
filas de 2, o 4 cards en 2 filas de 2. El número estándar para mobile
mostrar arriba del fold suele ser 8.)

Como `toursLoading` también es `true` antes de que se sepa si hubo
error, conviene exponer también un estado `toursError` para futuro
fallback. **Fuera de alcance de Fase 5** según decisión aprobada.

**5. Agregar CSS en el bloque `const CSS`** (cerca de L818 después
de los estilos de `.tc`/`.gc`):

```css
.skeleton{
  background: linear-gradient(90deg,
    rgba(0,0,0,.06) 0%,
    rgba(0,0,0,.10) 50%,
    rgba(0,0,0,.06) 100%);
  background-size: 200% 100%;
  animation: shimmer 1.4s ease-in-out infinite;
  border-radius: 8px;
}
.skel-card{cursor:default;pointer-events:none}
.skel-card:hover{transform:none;box-shadow:0 2px 12px rgba(0,0,0,.06)}
.sk-line{height:10px;margin-bottom:6px}
.sk-loc{width:40%;height:8px}
.sk-title{width:90%;height:13px;margin-top:4px}
.sk-meta{width:70%;height:9px;margin-top:8px}
.sk-price{width:50%;height:14px;margin-top:8px}
@media (prefers-reduced-motion: reduce){
  .skeleton{animation:none;background:rgba(0,0,0,.08)}
}
```

## 8. Riesgos

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| CLS (layout shift) al cargar tours reales | Bajo | Los skeleton usan las **mismas clases** `.tc`/`.gc` → mismo tamaño exacto. La altura de `.tc-img`/`.gc-img` es fija. El cuerpo puede variar un poco (título 1 vs 2 líneas), pero sin saltos grandes. |
| Skeleton sigue visible si fetch falla → "loading infinito" | Medio | Usar `.finally(setToursLoading(false))` en lugar de solo `.then`. Tras error, grids quedan vacíos como ahora — comportamiento actual preservado, no peor. |
| `feat` y `allCityTours` se derivan de `tours` con `.sort()` → cuando `tours = []` ya son `[]` | OK | Las condiciones existentes `allCityTours.length > 0 ? ... : empty-state` (L1684) van a interferir. Hay que envolver con `toursLoading ? skeleton : (empty ? empty : grid)`. |
| Skeleton bloquea el empty-state legítimo "Pronto tendremos experiencias en {ciudad}" (L1681) | Medio | Solo mostrar skeleton si `toursLoading === true`. Cuando termina, evaluar empty-state normal. |
| Doble shimmer (skeleton card sobre `.tc`/`.gc` con `transition`) | Bajo | `.skel-card{pointer-events:none}` evita hover transform; añadir `:hover{transform:none}` específico. |
| Reduced motion users | Bajo | Ya hay regla `@media (prefers-reduced-motion: reduce)` global (L570-572) que aplica a `*`. Pero conviene fallback de color sólido en `.skeleton` por claridad. |
| Mismo `toursLoading` apaga skeletons antes de tiempo si llega `data.tours = []` válido (DB vacía) | Bajo | Aceptable: empty-state se muestra. La diferencia entre "loading" y "vacío real" se respeta. |
| Fade-in al transicionar de skeleton a real (sin transición → pop visual) | Bajo | Opcional: agregar `transition: opacity .25s` a `.tg` o usar `fadeUp` (clase ya existente) en el contenedor real. No bloqueante. |

## 9. Resumen de cambios anticipados

- **1 archivo**: `src/AppDemo.jsx`.
- **~5 ediciones**: state, fetch, 2 nuevos componentes, 4 sitios de render condicional, ~15 líneas CSS.
- **Líneas estimadas**: +90 / -5.
- **Sin tocar**: `prisma/*`, `api/*`, `lib/*`, `src/Landing.jsx`, `src/index.css`, `src/App.css`.
- **Sin dependencias nuevas**: 0 paquetes (puro CSS + React state).

`@keyframes shimmer` ya existe (L649) → ahorra definir keyframe.
Solo hay que agregar las clases que lo consumen.
