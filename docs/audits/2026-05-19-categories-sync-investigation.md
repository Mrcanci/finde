# Investigación: sincronización de categorías UI con enum DB

**Fecha:** 2026-05-19
**Branch:** `feature/tours-db-i18n`
**Último commit:** `e593477` (Fase 3.3)

Objetivo de Fase 4: alinear las categorías visibles del demo
(`CATS` en `src/AppDemo.jsx`) con el `enum Category` de la DB
(`prisma/schema.prisma`): eliminar las que no existen en DB
("Playas", "Trekking") y agregar la que falta ("Místico").

## 1. Constante CATS actual

`src/AppDemo.jsx:9-17`

```js
const CATS = [
  { id: "all", n: "Todos", ic: Sparkles },
  { id: "adventure", n: "Aventura", ic: Mountain },
  { id: "culture", n: "Cultura", ic: Landmark },
  { id: "gastro", n: "Gastronomía", ic: UtensilsCrossed },
  { id: "nature", n: "Naturaleza", ic: Trees },
  { id: "beach", n: "Playas", ic: Umbrella },
  { id: "trekking", n: "Trekking", ic: Footprints },
];
```

Shape de cada item: `{ id: string, n: string (label visible), ic: LucideIcon }`.

## 2. Mapping UI ↔ DB

`src/AppDemo.jsx:211-212` define dos tablas porque UI usa labels
cortos y DB usa nombres completos:

```js
const CAT_API_TO_UI = { cultural: "culture", gastronomy: "gastro" };
const CAT_UI_TO_API = { culture: "cultural", gastro: "gastronomy" };
```

Aplicado en `mapTourFromApi` (L228): `category: CAT_API_TO_UI[t.category] || t.category`.

## 3. Categorías actuales vs enum DB

Enum DB (`prisma/schema.prisma:18-24`, también en `prisma/migrations/0_init/migration.sql:23`):

```
Category = adventure | cultural | gastronomy | nature | mystic
```

| UI label | UI key | DB enum | ¿Match? | Acción Fase 4 |
|---|---|---|---|---|
| Todos | `all` | — (filtro especial) | ✓ | conservar |
| Aventura | `adventure` | `adventure` | ✓ directo | conservar |
| Cultura | `culture` | `cultural` | ✓ vía CAT_API_TO_UI | conservar |
| Gastronomía | `gastro` | `gastronomy` | ✓ vía CAT_API_TO_UI | conservar |
| Naturaleza | `nature` | `nature` | ✓ directo | conservar |
| Playas | `beach` | — (no existe) | ✗ | **eliminar** |
| Trekking | `trekking` | — (no existe) | ✗ | **eliminar** |
| — | — | `mystic` | ✗ ausente en UI | **agregar** |

## 4. Lógica de filtrado por categoría

Los 5 sitios donde se filtra por categoría:

| Línea | Contexto | Expresión |
|---|---|---|
| 325 | `searchTours()` con `q < 2` | `categoryFilter === "all" ? tours : tours.filter(t => t.category === categoryFilter)` |
| 350 | `searchTours()` filtros keyword | `if (matchedFilters.categories && !matchedFilters.categories.includes(t.category)) return { ..., score: 0 }` |
| 360 | `searchTours()` para score por nombre de categoría | `(CATS.find(c => c.id === t.category) || {}).n || ""` |
| 370 | `searchTours()` filtro final | `if (categoryFilter !== "all" && t.category !== categoryFilter) return { ..., score: 0 }` |
| 1637 | HomeView grid principal | `cat === "all" ? tours : tours.filter((t) => t.category === cat)` |
| 1665 | HomeView chips | `CATS.map(...)` botones de filtro |
| 1728 | CatalogView filt fallback | `cat === "all" ? tours : tours.filter(t => t.category === cat)` |
| 1914 | CatalogView chips | `CATS.map(...)` botones de filtro |
| 3236 | NewTourForm | `CATS.filter(c => c.id !== "all").map(...)` chips |

Todos comparan `t.category` (UI key, ya mapeado por `mapTourFromApi`)
contra el `id` de algún item de `CATS`. Si eliminamos "beach" y
"trekking" de `CATS`, ningún tour de la DB tendrá `category` con
esos valores (porque el enum DB no los acepta) → no se rompe nada.

## 5. Referencias a `trekking` y `beach`

### `src/AppDemo.jsx`

| Línea | Contexto | ¿Estructural o textual? | Riesgo si eliminamos |
|---|---|---|---|
| 15 | `CATS` declaración (`beach`) | **estructural** | el cambio en sí |
| 16 | `CATS` declaración (`trekking`) | **estructural** | el cambio en sí |
| 256 | `KEYWORD_MAPS` array `["nature","beach","culture","gastro"]` | **estructural** | inerte (ningún tour DB es `beach`); limpiar para no engañar futuros lectores |
| 257 | `KEYWORD_MAPS` array `["adventure","trekking"]` | **estructural** | igual: inerte; limpiar |
| 477 | `REVIEW_TEXTS_BY_CATEGORY.trekking` | **estructural** | código muerto (la lookup en L558 cae a `generic`); opcional limpiar |
| 501 | `REVIEW_TEXTS_BY_CATEGORY.beach` | **estructural** | igual: opcional limpiar |
| 381 | texto en notificación mock: `"Tu Trekking al Nevado Pastoruri..."` | **textual** (string body) | ninguno |
| 590-595 | tours mock del dashboard operador con `tour:"Trekking al Nevado Pastoruri"` | **textual** (string display) | ninguno |
| 3211 | placeholder del form: `placeholder="Ej: Trekking al Nevado..."` | **textual** | ninguno |

### `api/`

| Archivo | Línea | Contexto |
|---|---|---|
| `api/search.ts` | 51, 90 | Validación enum con `["adventure", "cultural", "gastronomy", "nature", "mystic"]` — alineado con DB. |
| `api/tours/index.ts` | 12 | Zod schema con mismo enum DB. |
| `api/ai/generate-description.ts` | 14 | `CATEGORIES` const con enum DB. Las líneas 61, 66, 81 mencionan "trekking" como **palabra del español** en prompts/ejemplos, no como key de categoría. |

### `prisma/`

- `schema.prisma:23` y `0_init/migration.sql:23`: enum oficial sin `trekking`/`beach`.
- `seed.ts`: usa "trekking" como **sustantivo en descripciones** de tours (L183, L208, L234, L500). Nada que tocar.

## 6. Referencias a `mystic` (ya presentes)

- `prisma/schema.prisma:23` enum.
- `prisma/seed.ts:360, 850, 857, 884`: tours con `category: Category.mystic` (2 tours seedeados — Q'eros y Ayahuasca).
- `src/AppDemo.jsx:507` `REVIEW_TEXTS_BY_CATEGORY.mystic`: 3 textos de reseñas ya escritos. **No hay que agregarlos.**
- `src/AppDemo.jsx:3144` validación frontend al pedir AI generate-description: `allowed = [..., "mystic"]`. ✓
- `api/search.ts`, `api/tours/index.ts`, `api/ai/generate-description.ts`: ya incluyen `mystic` en sus enums.

**Conclusión:** todo el backend y la lógica auxiliar de reviews
ya soportan `mystic`. Lo único que falta es agregarlo a `CATS`
para que aparezca como chip clickeable en el UI.

## 7. Plan de cambio (Fase 4)

### Cambio principal (mínimo, suficiente)

`src/AppDemo.jsx:9-17` — modificar `CATS`:

```diff
 const CATS = [
   { id: "all", n: "Todos", ic: Sparkles },
   { id: "adventure", n: "Aventura", ic: Mountain },
   { id: "culture", n: "Cultura", ic: Landmark },
   { id: "gastro", n: "Gastronomía", ic: UtensilsCrossed },
   { id: "nature", n: "Naturaleza", ic: Trees },
-  { id: "beach", n: "Playas", ic: Umbrella },
-  { id: "trekking", n: "Trekking", ic: Footprints },
+  { id: "mystic", n: "Místico", ic: Compass },
 ];
```

Decisión de **icono** para Místico: opciones en lucide-react ya
importadas:
- `Compass` (brújula) — sugerencia A: connota guía/dirección espiritual.
- `Sparkles` — ya usado por "Todos", causaría colisión visual.
- `Hand` — ya importado, podría asociarse a ritual/ofrenda.
- `MountainSnow` — más asociado a paisaje andino.

Recomendación: `Compass` (alineado con cosmovisión / búsqueda
interior). Validar visualmente en UI.

Si `Umbrella` y `Footprints` quedan **sin uso** tras este cambio,
removerlos del import de lucide-react en L2 evita el warning
"declared but never read".

### Limpieza recomendada (opcional, mismo PR)

1. `src/AppDemo.jsx:256-257` `KEYWORD_MAPS`: limpiar `"beach"` y
   `"trekking"` de los arrays de categorías:

   ```diff
   -  { keywords: ["tranquilo",...], filters: { ..., categories: ["nature","beach","culture","gastro"] } },
   -  { keywords: ["aventura","extremo","adrenalina"], filters: { ..., categories: ["adventure","trekking"] } },
   +  { keywords: ["tranquilo",...], filters: { ..., categories: ["nature","culture","gastro"] } },
   +  { keywords: ["aventura","extremo","adrenalina"], filters: { ..., categories: ["adventure"] } },
   ```

   Opcionalmente agregar un mapping nuevo para místico:

   ```js
   { keywords: ["ceremonia","ayahuasca","místico","espiritual","ritual"],
     filters: { categories: ["mystic"] } },
   ```

2. `src/AppDemo.jsx:477-510` `REVIEW_TEXTS_BY_CATEGORY`: opcionalmente
   borrar las claves `trekking` (L477) y `beach` (L501). Son código
   muerto (ningún tour DB tiene esas categorías). No urgente.

### No tocar

- Strings textuales L381, L590-595, L3211 ("Trekking al Nevado…"
  como nombre de tour mock) — es contenido, no key.
- `api/*` y `prisma/*` — ya alineados con DB.
- `L3144` allowed array — ya correcto.

## 8. Riesgos

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| Tours en DB con `category="beach"` o `"trekking"` quedarían huérfanos (sin chip) | Imposible: el enum DB no acepta esos valores | N/A |
| Filtros de búsqueda viejos en URL (`?cat=beach`) | Bajo: no hay router, `cat` es estado React | El default `"all"` cubre cualquier valor inválido |
| Limpieza incompleta de `KEYWORD_MAPS` / `REVIEW_TEXTS_BY_CATEGORY` | Bajo (código muerto, no rompe nada) | Acción opcional, marcar como follow-up |
| Imports lucide huérfanos (`Umbrella`, `Footprints`) | Bajo (warning ESLint, no error) | Remover del import L2 |
| Test/snapshots referenciando `beach`/`trekking` como key | Cero: no hay test suite | N/A |
| Quechua (titleQu/descQu) sin categoría `mystic` traducida | Bajo (label "Místico" es palabra usable en quechua: "machaq runa", "yachaq") | Fuera de alcance Fase 4 |

## 9. Alcance recomendado para Fase 4

**Mínimo (1 archivo, ~5 líneas):**

1. Editar `CATS` (L9-17) — quitar 2 entries, agregar 1.
2. Limpiar import de `Umbrella` y `Footprints` (L2) si quedan sin uso.

**Completo (1 archivo, ~10 líneas):**

3. Limpiar `KEYWORD_MAPS` (L256-257) — quitar refs a `beach`/`trekking`,
   agregar regla para `mystic`.
4. Limpiar `REVIEW_TEXTS_BY_CATEGORY` (L477, L501) — borrar las dos
   claves muertas.

Ambas variantes son seguras según el análisis. La mínima despacha
el objetivo declarado; la completa deja el archivo sin código
muerto.
