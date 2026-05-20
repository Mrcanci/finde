# Diagnóstico: AI_SUGGESTIONS dropdown no aparece

**Fecha:** 2026-05-19
**Rama:** `feature/tours-db-i18n`
**Síntoma:** En CatalogView (tab "Buscar"), al hacer foco/click en el
input de búsqueda vacío, el dropdown con la sección
"✨ Sugerencias inteligentes" (renderizada desde `AI_SUGGESTIONS`)
nunca aparece.

## Condiciones para que aparezca

El JSX que renderiza `AI_SUGGESTIONS` (src/AppDemo.jsx:1855-1886)
está envuelto por dos condiciones:

```jsx
{dropdownOpen && (
  <div className="ai-suggest">
    ...
    {isPopular && (
      <>
        <div className="ai-suggest-h"><Sparkles /> Sugerencias inteligentes</div>
        {AI_SUGGESTIONS.map(...)}
      </>
    )}
  </div>
)}
```

Las variables derivadas (líneas 1841-1843):

```js
const isPopular = q.trim().length < 2;          // L1841
const hasResults = localResults.length > 0;     // L1842
const dropdownOpen = showDropdown && !geminiLoading;  // L1843
```

Para que el bloque se vea hay que cumplir simultáneamente:

1. `showDropdown === true`
2. `geminiLoading === false`
3. `q.trim().length < 2` (input vacío o de 1 carácter)

## Cómo se activa `showDropdown`

Solo dos handlers lo prenden:

**`handleFocus`** (src/AppDemo.jsx:1796-1803):

```js
const handleFocus = () => {
  // Solo reabrimos el dropdown si el usuario ya estaba buscando algo. El
  // click en input vacío no abre nada — evita el dropdown fantasma.
  if (q.trim().length < 2 || geminiLoading) return;
  const { results } = searchTours(tours, q, cat);
  setLocalResults(results.slice(0, 5));
  setShowDropdown(true);
};
```

**`handleChange`** (src/AppDemo.jsx:1772-1795):

```js
const handleChange = (value) => {
  setQ(value);
  setGeminiIds(null);
  setAiResult(null);
  if (geminiTimer.current) clearTimeout(geminiTimer.current);
  if (value.trim().length < 2) {
    setLocalResults([]);
    setShowDropdown(false);   // ← apaga el dropdown si <2 chars
    setHasSearched(false);
    return;
  }
  ...
  setShowDropdown(true);
};
```

## Causa raíz

**Contradicción lógica entre las dos condiciones requeridas.**

- `AI_SUGGESTIONS` se renderiza solo si `isPopular === true` → exige
  `q.length < 2`.
- Pero `showDropdown` solo pasa a `true` cuando `q.length >= 2`
  (ambos handlers cortan antes con `if (... < 2) return` /
  `setShowDropdown(false)`).

Es decir: `isPopular && showDropdown` **nunca puede ser `true`
simultáneamente** con el flujo actual. El bloque
"Sugerencias inteligentes" + `AI_SUGGESTIONS.map(...)` es
**código muerto desde que se introdujo la guarda de `handleFocus`**.

Igual pasa con el header "Búsquedas populares" (L1857), que
también requiere `isPopular && hasResults` — inalcanzable.

## ¿Fase 3.2 modificó algo relevante?

**No.** El diff de Fase 3.2 (vs commit `e310710`) toca únicamente:

- El contenido del array `AI_SUGGESTIONS` (cuids en `results`,
  líneas 246-253).
- El array `MY_TRIPS` (líneas 388-449).

No toca `handleFocus`, `handleChange`, `showDropdown`,
`dropdownOpen`, `isPopular`, `geminiLoading`, el JSX del
`<input>` ni el del dropdown.

`grep` del diff sobre esos identificadores: vacío.

## ¿Cuándo se introdujo el bug?

El comentario `// evita el dropdown fantasma` y la guarda
`if (q.trim().length < 2 || geminiLoading) return;` en
`handleFocus` se introdujeron en el commit:

```
a3cf9a6  fix(demo): dropdown buscador cierra correctamente con enter/escape/click fuera
Sat May 9 2026
```

Es decir, el bug es **preexistente** desde hace ~10 días, mucho
antes de Fase 3.2. Probablemente nunca se detectó porque las
"Sugerencias inteligentes" no se usaban activamente y el panel
de IA real (banner naranja post-search) sí funciona.

## Hipótesis alternativas descartadas

- ¿`geminiLoading` quedó atascado en `true`? No: `useState(false)`
  por defecto y solo se prende durante `runAiSearch`. No es el
  caso al hacer foco inicial.
- ¿El `useEffect` del `pointerdown` cierra inmediatamente? No: solo
  cierra cuando el click está fuera de `searchRef`; el `onFocus`
  precede a ese pointerdown y el click cae dentro del input.
- ¿El `AI_SUGGESTIONS.map` falla por cuids nuevos? No: el `.map`
  solo lee `query` y `reason` de cada sugerencia, no resuelve
  cuids al render (eso pasa solo al hacer click → `handleAiSearch`
  → `filt`).

## Recomendación

Esto **NO se arregla en Fase 3.2**. Fase 3.2 es estrictamente el
reemplazo de IDs numéricos por cuids. El bug del dropdown es:

- Preexistente.
- En lógica de handlers, no en datos.
- Independiente del refactor i18n/cuids.

Pasar a una fase de fix UI aparte (sugerido nombre: **Fase 3.3
— Fix dropdown sugerencias**), con dos opciones de solución:

**Opción A (mínima, restaurar comportamiento original):**
Eliminar la guarda `if (q.trim().length < 2 ...)` de
`handleFocus`, o cambiarla a permitir foco vacío:

```js
const handleFocus = () => {
  if (geminiLoading) return;
  const { results } = q.trim().length >= 2
    ? searchTours(tours, q, cat)
    : { results: [] };
  setLocalResults(results.slice(0, 5));
  setShowDropdown(true);
};
```

Riesgo: revive el "dropdown fantasma" que motivó el commit
`a3cf9a6` (probablemente: aparecía dropdown vacío en focus inicial,
sin contenido visible). Verificar visualmente.

**Opción B (semánticamente más limpia):**
Separar el estado del dropdown en dos: uno para "panel de
sugerencias populares" (visible en foco con input vacío) y otro
para "resultados live" (visible cuando `q.length >= 2`). Permite
mostrar AI_SUGGESTIONS sin reabrir el resto del dropdown.

Recomiendo **Opción A** primero, validar UX, y solo escalar a B
si hay problema visual.

## Sugerencia de prueba (sin tocar código)

1. En React DevTools, seleccionar el componente `CatalogView` y
   forzar `showDropdown = true`. Si el panel de sugerencias
   aparece, confirma que la causa está en cómo se prende
   `showDropdown` (no en el render).
2. Escribir 2+ caracteres en el input. El dropdown sí debería
   aparecer (con `localResults` o `"No encontramos tours"`),
   confirmando que `dropdownOpen` funciona — solo el path
   `isPopular` está bloqueado.
3. Borrar todo el input. El dropdown debe cerrarse (porque
   `handleChange` con `value.length < 2` ejecuta
   `setShowDropdown(false)`).

Si los 3 puntos se cumplen, la causa raíz está confirmada.
