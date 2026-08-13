# Auditoría tipográfica — demo Finde (`src/AppDemo.jsx`)

**Rama:** `dev` · **HEAD:** `c6e8573` · **Working tree:** limpio · **Fecha:** 13 ago 2026
**Alcance leído:** `src/AppDemo.jsx` (constante `CSS`, líneas 936–1763, 690 reglas, más ~106 estilos inline), `src/index.css`, `src/App.css`, `index.html`, y `src/Landing.jsx` solo como referencia comparativa.
**Verificación:** los hallazgos de cascada están confirmados contra los estilos computados en `dev.finde.pe/demo`.
**Estado:** investigación read-only. No se modificó, creó ni borró ningún archivo del repo. Sin commits ni ramas nuevas.

---

## Resumen

| Métrica | Valor |
|---|---|
| `font-size` en la constante CSS | **242** |
| de ellas por debajo de 12px | **56** (23%) |
| `fontSize` inline en el JSX | **106** |
| tamaños distintos (sin escala) | **23** |
| áreas táctiles bajo 44px | **7 de 8** |
| colores de texto que fallan WCAG AA | **5** |

**Severidad:** 8 hallazgos ALTA · 10 MEDIA · 3 BAJA.

El diagnóstico previo apuntaba a la escala, y en eso acierta: hay 23 tamaños distintos para 242 declaraciones, nueve de ellos apretados en un rango de 5px, y el cuerpo de texto por defecto es de 13px. Pero **el punto de partida no es la escala**. Es un bloque de CSS muerto de la plantilla de Vite que hoy controla el `font-size` del root, el interlineado base, el `letter-spacing` global y el color de los `h2` del demo.

---

## 🔴 HALLAZGO PRINCIPAL — antes de las 10 secciones

**Severidad: ALTA** — El interlineado base existe, viene del sitio equivocado y se hereda como valor absoluto.

El diagnóstico previo decía *"ausencia de line-height base"*. Es al revés, y es peor.

`src/main.jsx:3` importa `index.css` globalmente. El root del demo es `<div className="app app-demo">` (`AppDemo.jsx:6248`). Y `src/index.css:6-45` tiene un bloque `.app-demo` que es la plantilla de Vite renombrada:

```css
.app-demo {
  font: 18px/145% var(--sans);   /* ← font-size Y line-height */
  letter-spacing: 0.18px;
  width: 1126px;  text-align: center;
  border-inline: 1px solid var(--border);
  display: flex; flex-direction: column;
  font-synthesis: none;
  @media (max-width: 1024px) { font-size: 16px; }
}
```

`.app` (en `AppDemo.jsx`) nunca declara `font-size` ni `line-height`, así que **estas dos ganan por defecto, no por empate de cascada**. Medido en producción:

```
ROOT  fontSize: 18px   lineHeight: 26.1px   width: 1126px   textAlign: center
```

**`line-height: 145%` es un porcentaje: se computa a 26,1px en el root y ese valor absoluto se hereda tal cual.** No es un ratio. Cada descendiente sin `line-height` propio recibe una caja de línea de **26,1px sin importar su propio tamaño**. Medido en vivo:

| Selector | font-size | line-height heredado | ratio efectivo |
|---|---|---|---|
| `.gc-loc` | 10px | 26.1px | **2.61** |
| `.gc-m`, `.hero-tag`, `.tc-loc` | 11px | 26.1px | **2.37** |
| `.tc-m` | 12px | 26.1px | **2.18** |
| `.city-near` | 14px | 26.1px | **1.86** |
| `.hero-sub` | 16px | 26.1px | 1.63 |
| `.st` (DM Serif) | 26px | 26.1px | **1.00** ← serif display sin aire |

Y hay un **segundo régimen**: los controles de formulario (`<button>`, `<input>`, `<textarea>`) no heredan esto, porque el shorthand `font` del UA stylesheet les fija `line-height: normal` y ninguna regla lo pisa. Medido: `.chip` → `normal`, `.sl` → `normal`, `.ai-sb input` → `normal`.

**Consecuencia:** el mismo texto de 13px se renderiza con caja de 26,1px dentro de un `<div>` y de ~16px dentro de un `<button>`. Ese es el origen real del ritmo vertical roto, y ninguna corrección de escala lo arregla si no se toca primero `index.css`.

---

## 1. Inventario de escala

### 1a/1b · font-size por tamaño (242 declaraciones)

**Severidad: ALTA** (el bloque <12px) · **MEDIA** (la fragmentación de la escala)

**⚠️ Menores a 12px — 56 declaraciones (23% del total)**

| px | n | Selectores |
|---|---|---|
| **8px** | 1 | `.lang-dd-btn .arr` |
| **9px** | 4 | `.logo-ai`, `.ai-sb-tag`, `.tc-ver`, `.gc-ver` |
| **10px** | 21 | `.login-hero-stat-l`, `.bn-i`, `.ai-suggest-h`, `.sr-rating`, `.tc-bdg`, `.gc-loc`, `.gc-p span`, `.det-bdg`, `.ai-sum-h`, `.det-ic`, `.pm-tg`, `.voucher-sec-l`, `.voucher-verified`, `.tp-st`, `.rev-bar-row span:last-child`, `.pf-stat-l`, `.dsh-s-l`, `.dsh-bk-s`, `.ai-cc-result-h`, `.ai-cc-lang`, `.earn-bl` |
| **10.5px** | 1 | `.sum-h` |
| **11px** | 27 | `.login-terms`, `.hero-tag`, `.ai-suggest-r`, `.sr-loc`, `.sr-ai-hint`, `.ai-result-b`, `.lang-dd-btn`, `.tc-loc`, `.tc-pr span`, `.gc-m`, `.det-op-d`, `.voucher-note`, `.voucher-more`, `.voucher-agency-d`, `.field-err`, `.ni-time`, `.tp-code`, `.rev-big-cnt`, `.rev-bar-row`, `.rev-av`, `.rev-date`, `.pf-mi-d`, `.pf-ver`, `.pf-op-desc`, `.biz-badge`, `.biz-doc-btn`, `.earn-li` |
| **11.5px** | 2 | `.bb-mode`, `.sale-note` |

**Resto de la escala:** 12px (37) · 12.5px (3) · **13px (47 — el tamaño dominante)** · 14px (30) · 15px (13) · 16px (12) · 18px (12) · 20px (4) · 22px (5) · 24px (8) · 26px (5) · 28px (3) · 32px (2) · 36px (2) · 38px (1) · 42px (1) · 48px (1).

**Diagnóstico:** 23 valores distintos para 242 declaraciones. No es una escala, es un continuo — hay 8px, 9px, 10px, 10.5px, 11px, 11.5px, 12px, 12.5px y 13px, nueve pasos en un rango de 5px. Y **el cuerpo de texto por defecto es 13px**, no 16px: `.rev-text`, `.ai-sum-t`, `.det-inc`, `.voucher-row`, `.sr-noresults` y `.city-empty-sub` son texto de lectura a 13px.

### 1c · font-size dentro de media queries — 13 en `AppDemo.jsx` + 3 en `index.css`

**Severidad: MEDIA** (falta de escalado) · **BAJA** (el input de 15px)

| Breakpoint | Regla | Valor |
|---|---|---|
| `@media(min-width:640px)` | `.hero-t` | 36px |
| | `.city-sheet-opt` | 13px |
| `@media(min-width:768px)` | *(ninguna — solo layout)* | — |
| `@media(min-width:1024px)` | `.tn .logo` | 26px |
| | `.hero-t` | 48px |
| | `.hero-sub` | 16px |
| | `.home-pg .ai-sb input` | **15px** |
| | `.home-pg .ai-sb .ai-sb-ic` | 18px |
| | `.st` | 26px |
| | `.city-near` | 14px |
| | `.gc-t` | 14px |
| | `.det-hero .det-tl` | 38px |
| | `.dsh-tab` | 13px |
| `@media(min-width:1200px)` | *(ninguna)* | — |
| **`index.css` `@media(max-width:1024px)`** | **`.app-demo`** ← root | **16px** |
| | `.app-demo h1` | 36px |
| | `.app-demo h2` | 20px |

Solo **11 de 242** declaraciones (4,5%) son responsive. La tipografía es prácticamente fija entre 390px y 2560px; lo único que escala es el hero (28→36→48px) y el título de detalle (26→38px).

`.home-pg .ai-sb input{font-size:15px}` en ≥1024px baja un input de texto por debajo de 16px — en iPad en landscape (que matchea el breakpoint) Safari hace zoom al enfocar.

### 1d · font-size en estilos inline del JSX — **sí, 106 declaraciones**

**Severidad: ALTA**

Fuera de la constante CSS hay 106 `fontSize` inline, además de 53 `fontWeight` y 30 `lineHeight`.

| px | n | px | n |
|---|---|---|---|
| **8** | 1 | 14 | 7 |
| **9** | 1 | 15 | 2 |
| **10** | 5 | 16 | 1 |
| **11** | **31** | 18 | 2 |
| **12** | **26** | 20 | 1 |
| 12.5 | 1 | 22 | 2 |
| 13 | 25 | 32 | 1 |

**64 de 106 (60%) están por debajo de 12px.**

Los dos casos extremos:

- **`AppDemo.jsx:437`** — `fontSize: 8, fontWeight: 700` en el aviso de escasez dentro de la celda del calendario (`"Último cupo"` / `"2 cupos"`). Es el texto más pequeño del demo y es una señal de negocio crítica, en bold, dentro de un botón de `minHeight: 36`.
- **`AppDemo.jsx:4925`** — `fontSize: 9, fontWeight: 700` en el badge "Portada" del uploader de fotos.

Estos 106 valores **no se ven afectados por ningún cambio en la constante CSS**. Cualquier rediseño que solo toque el bloque `CSS` deja el 30% de la superficie tipográfica sin migrar.

---

## 2. Pesos

**Severidad: MEDIA**

### 2a · Declaraciones de font-weight

| Peso | CSS | Inline | Nota |
|---|---|---|---|
| 400 | **4** | 1 | `.city-near`, `.tc-pr span`, `.gc-p span`, `.bb-p span` |
| 500 | **2** | 1 | `.lang-dd-item`, `.det-mi` |
| 600 | 46 | 16 | |
| **700** | **62** | **31** | el peso más usado del sistema |
| 800 | 16 | 4 | |

**Combinado: 93 declaraciones de 700 y 20 de 800 → 113 de 183 (62%) son bold o extra-bold.** Solo 5 declaraciones en todo el proyecto son 400 explícito, y 3 son 500.

### 2b · Quién usa 800 (16 en CSS + 4 inline)

`.login-hero-stat-v` (18px) · `.sr-price` (13px) · `.tc-pr` (16px) · `.gc-p` (14px) · `.det-op-av` (18px) · `.bb-p` (20px) · `.sum-t` (16px) · `.voucher-tour` (18px) · `.voucher-pay-row.total` (15px) · `.tp-price` (15px) · `.pf-stat-v` (20px) · `.dsh-s-v` (22px) · `.dsh-bk-a` (15px) · `.sal-date` (14px) · **`.sal-sec-t` (12px, uppercase, `letter-spacing:.8px`)** · `.sal-plazo.hard`.

El patrón es coherente (precios, cifras y totales) salvo dos excepciones: `.sal-sec-t` es un encabezado de sección de 12px en versalitas con 800 — el peso más alto del sistema aplicado al tamaño más chico — y `.det-op-av` / `.dsh-bk-av`, que son iniciales dentro de avatares circulares (uso decorativo, no tipográfico).

### 2c · ¿El texto de lectura depende del default del navegador?

**Sí.** No existe ninguna regla que declare `font-weight: 400` sobre texto de lectura largo. `.rev-text`, `.det-ds`, `.ai-sum-t`, `.ni-text`, `.suc-sub`, `.welcome-sub`, `.city-empty-sub`, `.biz-note` y `.voucher-cancel-d` heredan el 400 que fija el shorthand `font: 18px/145%` de `.app-demo` en `index.css`.

Es decir: **el peso del texto de lectura del demo lo está fijando hoy la plantilla de Vite.** Si alguien borra ese bloque (que es lo correcto, es código muerto), el peso pasa a depender del default del UA — que también es 400, así que no rompe nada visible, pero el sistema no lo controla en ningún punto propio.

---

## 3. Line-height

**Severidad: ALTA**

### 3a · ¿`.app` declara line-height? — **No**

Las tres reglas `.app` son (`AppDemo.jsx:939`, `:941`, `:942`):

```css
.app{--f:#1B3A2D;--m:#2D5A3D;--sg:#6B8F71;--sd:#E8DDD3;--cr:#F5F0EA;--wh:#FAFAF7;--tr:#C7613A;--trl:#E8845A;--gd:#D4A843;--ch:#2C2C2A;--gy:#737370;--gy-soft:#8A8A85;--lg:#959591;--yp:#6B2FA0;--pl:#00B4D8;--ai:#0EA5E9;--focus:rgba(199,97,58,.4)}
.app{font-family:'Plus Jakarta Sans',system-ui,sans-serif;background:var(--wh);color:var(--ch);-webkit-font-smoothing:antialiased;overflow-x:hidden}
.app{min-height:100vh;background:var(--wh);position:relative}
```

Ninguna declara `line-height` ni `font-size`. El reset `.app *{margin:0;padding:0;box-sizing:border-box}` tampoco. Por eso gana `index.css`.

### 3b · Selectores que sí declaran line-height — 30 en CSS + 30 inline

| Valor | Selectores (constante CSS) |
|---|---|
| **1** | `.bn-i .ni` (22px), `.rev-big-n` (36px) |
| **1.15** | `.hero-t` (28px) |
| **1.2** | `.det-tl` (26px) |
| **1.3** | `.tc-tl` (15px), `.gc-t` (13px), `.voucher-tour` (18px) |
| **1.4** | `.ai-result-b` (11px), `.voucher-note` (11px), `.voucher-agency-d` (11px), `.login-banner` (13px), `.ni-text` (12px) |
| **1.45** | `.city-empty-sub` (13px), `.sal-bk-q` (12.5px) |
| **1.5** | `.login-hero-tagline`, `.login-sub`, `.login-terms`, `.sr-noresults`, `.voucher-cancel-d`, `.ai-cc-desc`, `.biz-note` |
| **1.55** | `.ai-result-x` (13px), `.sale-note` (11.5px) |
| **1.6** | `.welcome-sub`, `.ai-sum-t`, `.suc-sub`, `.rev-text`, `.ai-cc-result-t` |
| **1.7** | `.det-ds` (14px), `.site-footer-tagline` (13px) |

Inline: `1.5` (26 veces), `1.6` (2), `1.15` (1), `1.05` (1 — `AppDemo.jsx:435`, la celda del calendario).

Diez valores distintos, sin regla que los ordene: el texto largo oscila entre 1.4 y 1.7 según quién escribió la regla.

### 3c · Texto de lectura larga SIN line-height propio (hereda los 26,1px absolutos)

| Selector | fs | ratio efectivo | Qué es |
|---|---|---|---|
| `.sr-ai-hint` | 11px | 2.37 | pista de búsqueda IA |
| `.ai-suggest-r` | 11px | 2.37 | razón de la sugerencia IA |
| `.voucher-more` | 11px | 2.37 | "y N más" del voucher |
| `.pf-mi-d` | 11px | 2.37 | descripción de ítem de perfil |
| `.rev-date`, `.rev-big-cnt`, `.rev-bar-row` | 11px | 2.37 | metadatos de reseñas |
| `.tp-det` | 12px | 2.18 | detalle de la reserva |
| `.dsh-bk-d` | 12px | 2.18 | detalle de reserva (dashboard) |
| `.sal-meta` | 12px | 2.18 | meta de la salida |
| `.dsh-ls-m` | 12px | 2.18 | meta del listado |
| `.sal-tour` | 12.5px | 2.09 | nombre de tour en la salida |
| `.sal-line` | 12.5px | 2.09 | línea de cupos |
| `.bk-sum-meta` | 13px | 2.01 | meta del resumen de reserva |
| `.det-mi` / `.det-inc` | 13px | 2.01 | meta e incluidos del tour |
| `.voucher-row` / `.voucher-item` | 13px | 2.01 | filas del voucher |
| `.biz-doc-name` | 13px | 2.01 | nombre de documento |
| `.tp-h p` | 14px | 1.86 | subtítulo de "Mis reservas" |

**Notificaciones:** `.ni-title` (14px) hereda 26,1px → ratio 1.86; `.ni-text` (12px) sí declara 1.4; `.ni-time` (11px) hereda → 2.37. Los tres renglones de una misma notificación usan tres ritmos distintos.

**Resumen de IA:** `.ai-sum-t` declara 1.6 ✅ pero `.ai-sum-h` (10px, versalitas) hereda 26,1px → ratio 2.61.

---

## 4. Uso de DM Serif Display

**Severidad: MEDIA** (los 18px) · **ALTA** (`.hero-sub` sobre foto)

### 4a/4b · 20 selectores. **⚠️ 11 de 20 están por debajo de 26px**

| font-size | Selector | Color | ¿<26px? |
|---|---|---|---|
| 42px | `.login-hero-logo` | white | |
| 38px | `.det-hero .det-tl` `@1024` | white | |
| 36px | `.rev-big-n` | `var(--f)` | |
| 28px | `.logo` | `var(--f)` | |
| 28px | `.hero-t` | white | |
| 28px | `.tp-h h2` | `var(--ch)` | |
| 26px | `.welcome-title` | heredado | |
| 26px | `.det-tl` | white | |
| 26px | `.suc-t` | heredado | |
| 24px | `.login-title` | heredado | ⚠️ |
| 24px | `.bkf-t` | heredado | ⚠️ |
| 24px | `.tdet-h` | `var(--ch)` | ⚠️ |
| 24px | `.npage-h h2` | **ninguno** ⚠️ | ⚠️ |
| 24px | `.dsh-nm` | heredado | ⚠️ |
| 22px | `.st` | heredado | ⚠️ |
| 22px | `.pf-name` | heredado | ⚠️ |
| 20px | `.rev-hdr` | heredado | ⚠️ |
| **18px** | `.city-sheet-title` | `var(--ch)` | ⚠️ |
| **18px** | `.notif-sheet-title` | `var(--ch)` | ⚠️ |
| **18px** | `.pf-sec-t` | heredado | ⚠️ |
| **18px** | `.city-empty-tl` | `var(--ch)` | ⚠️ |

DM Serif Display tiene una x-height baja y trazos finos: a 18px pierde legibilidad y a 20-22px pierde carácter sin ganar claridad. Los cuatro casos de 18px son títulos funcionales (sheets, secciones de perfil, empty state) — candidatos naturales a volver a la sans.

Además `.st` (22px) computa `line-height: 26.1px` = **ratio 1.00**: un título de sección serif sin aire; a dos líneas los trazos se tocan.

### 4c · DM Serif sobre imagen de fondo — 3 casos

| Selector | fs | Color | Fondo |
|---|---|---|---|
| `.hero-t` | 28/36/48px | `white` | `.hero` con imagen de Unsplash `center/cover` + `.hero-tex` = `linear-gradient(180deg, rgba(0,0,0,.35), rgba(0,0,0,.55))` |
| `.det-tl` | 26/38px | `white` | `.det-hero` con imagen del tour + `.det-ov` = gradiente `rgba(0,0,0,.25) → transparente (30–50%) → rgba(0,0,0,.7)` |
| `.login-hero-logo` | 42px | `white` | gradiente sólido (no es imagen): `linear-gradient(160deg, var(--f), #1a4a35, var(--m))` |

El comentario en `AppDemo.jsx:1216` documenta que el gradiente de `.det-ov` se reforzó justo para garantizar legibilidad sobre fotos claras — la mitigación está y funciona (`.7` de negro al pie da ≥7:1 con blanco incluso sobre foto blanca).

**Pero el subtítulo de al lado no está cubierto:** `.hero-sub` es `rgba(255,255,255,.7)` a 13px sobre `.hero-tex`, cuyo tope es `.35` de negro. Peor caso (foto clara): fondo efectivo ≈ `#737373`, texto ≈ `#d5d5d5` → **contraste 3.23:1**, falla AA. Mismo patrón en `.login-hero-tagline` y `.hero-tag` (`rgba(255,255,255,.9)`, 11px).

---

## 5. Mayúsculas y tracking

**Severidad: MEDIA**

### 5a · `text-transform:uppercase` con font-size ≤ 12px — **16 de 17 reglas**

| fs | letter-spacing | weight | Selector |
|---|---|---|---|
| 10px | .5px | — | `.login-hero-stat-l` |
| 10px | **1px** | 700 | `.ai-suggest-h` |
| 10px | .3px | 600 | `.gc-loc` |
| 10px | .5px | 700 | `.ai-sum-h` |
| 10px | .7px | 700 | `.voucher-sec-l` |
| 10px | **—** | 700 | `.tp-st` ⚠️ sin tracking |
| 10px | .5px | — | `.pf-stat-l` |
| 10px | .5px | — | `.dsh-s-l` |
| 10px | .5px | 700 | `.dsh-bk-s` |
| 10px | .5px | 700 | `.ai-cc-result-h` |
| 10.5px | .05em | 700 | `.sum-h` |
| 11px | .5px | 600 | `.tc-loc` |
| 12px | .5px | 600 | `.pf-field-l` |
| 12px | .5px | 700 | `.lbl` |
| 12px | **.8px** | **800** | `.sal-sec-t` |
| 12px | **1px** | 700 | `.site-footer-col-t` |
| *13px* | *.5px* | *700* | *`.det-st` — único ≥13px* |

**Once reglas en versalitas a 10px o menos.** Cinco de ellas son etiquetas de estado o de sección con función real (`.tp-st` = estado de la reserva, `.dsh-bk-s` = estado del booking, `.voucher-sec-l` = secciones del voucher). `.tp-st` además no tiene tracking, que es lo mínimo que necesita un texto en caja alta a 10px.

### 5b · Todas las declaraciones de letter-spacing — 22

| Valor | n | Selectores |
|---|---|---|
| `-.5px` | 1 | `.logo` (28px) |
| `0` | 1 | `.city-near` (13px) — reset explícito para anular el `.18px` heredado |
| `.3px` | 2 | `.ai-sb-tag` (9px), `.gc-loc` (10px) |
| `.5px` | 12 | `.login-hero-stat-l`, `.logo-ai`, `.hero-tag`, `.tc-loc`, `.ai-sum-h`, `.det-st`, `.lbl`, `.pf-stat-l`, `.pf-field-l`, `.dsh-s-l`, `.dsh-bk-s`, `.ai-cc-result-h` |
| `.05em` | 1 | `.sum-h` (10.5px) — **única unidad relativa del sistema** |
| `.7px` | 1 | `.voucher-sec-l` |
| `.8px` | 1 | `.sal-sec-t` |
| `1px` | 3 | `.ai-suggest-h` (10px), `.voucher-code` (13px), `.site-footer-col-t` (12px) |

Más el **`letter-spacing: 0.18px` global heredado de `.app-demo`** (`index.css:23`), que aplica a todo el demo y que nadie declaró intencionalmente — otro resto de la plantilla Vite. `.city-near` lo anula a mano con `letter-spacing:0`, lo que sugiere que alguien ya chocó con él sin identificar el origen.

Seis valores absolutos distintos en px para el mismo caso de uso (versalitas pequeñas), más un `em`. `.sum-h` es la única regla que lo hace bien (relativo al tamaño).

---

## 6. Colores de texto y contraste

**Severidad: ALTA**

### 6a · Bloque completo de variables (`AppDemo.jsx:939`)

```css
.app{--f:#1B3A2D;--m:#2D5A3D;--sg:#6B8F71;--sd:#E8DDD3;--cr:#F5F0EA;
     --wh:#FAFAF7;--tr:#C7613A;--trl:#E8845A;--gd:#D4A843;--ch:#2C2C2A;
     --gy:#737370;--gy-soft:#8A8A85;--lg:#959591;--yp:#6B2FA0;
     --pl:#00B4D8;--ai:#0EA5E9;--focus:rgba(199,97,58,.4)}
```

**Contraste WCAG sobre los tres fondos reales del demo (AA texto normal = 4.5):**

| Var | Hex | vs `--wh` #FAFAF7 | vs white | vs `--cr` #F5F0EA | Veredicto |
|---|---|---|---|---|---|
| `--ch` | #2C2C2A | 13.38 | 13.99 | 12.35 | ✅ |
| `--f` | #1B3A2D | 11.88 | 12.43 | 10.97 | ✅ |
| `--yp` | #6B2FA0 | 7.91 | 8.27 | 7.30 | ✅ |
| `--m` | #2D5A3D | 7.60 | 7.95 | 7.02 | ✅ |
| `--gy` | #737370 | **4.55** | 4.76 | **4.20** | ⚠️ pasa por 0.05 sobre `--wh`; **falla sobre `--cr`** |
| `--tr` | #C7613A | **3.86** | 4.04 | 3.56 | ❌ falla |
| `--sg` | #6B8F71 | 3.47 | 3.63 | 3.20 | ❌ falla |
| `--gy-soft` | #8A8A85 | 3.32 | 3.47 | 3.06 | ❌ (nunca usado) |
| `--lg` | #959591 | **2.87** | 3.01 | 2.65 | ❌ falla incluso para texto grande |
| `--ai` | #0EA5E9 | 2.65 | 2.77 | 2.45 | ❌ falla |
| `--gd` | #D4A843 | **2.12** | 2.21 | 1.95 | ❌ el peor |

### 6b · Dónde se usan (con su tamaño y peso)

**`color: var(--lg)` — 5 selectores, todos ❌ 2.87:1**

| fs | fw | Selector | Qué es |
|---|---|---|---|
| 12px | 400 | `.login-divider` | "o" del divisor de login |
| 11px | 400 | `.login-terms` | términos y condiciones |
| 11px | 400 | `.ni-time` | **hora de la notificación** |
| 11px | 400 | `.tp-code` | **código de reserva (monospace)** |
| 11px | 400 | `.pf-ver` | versión de la app |

`--lg` también se usa como `border` en `.tn-btn`, `.pm-rd`, `.tdet-act-sec`, `.sal-btn.sec` (bordes de control: AA no-textual pide 3:1 → 2.87 falla también ahí).

**`color: var(--gy-soft)` — cero usos.** Está definida en la paleta y no la referencia nadie. Deuda muerta.

**`color: var(--tr)` — 17 selectores, todos ❌ 3.86:1** (ninguno alcanza el umbral de "texto grande": ≥24px, o ≥18.66px en bold)

| fs | fw | Selector |
|---|---|---|
| 14px | 700 | `.pf-logout` — botón de cerrar sesión |
| 13px | 700 | `.sr-viewall` — "ver todos los resultados" |
| 13px | 600 | `.sl` — "Ver todos" de sección |
| 12px | 600 | `.notif-sheet-mark`, `.npage-h button` — "Marcar leído" |
| 12px | 600 | `.voucher-link` |
| 12px | 600 | `.otp-resend button` |
| heredado | 800 | `.sal-plazo.hard` — **cuenta regresiva de la salida** |
| heredado | 600 | `.login-terms a` |
| heredado | 400 | `.logo span`, `.login-hero-logo span` (el punto de "finde.") |
| heredado | 400 | `.city-sheet-opt.on`, `.city-sheet-check`, `.det-ic.in`, `.st-cancelled`, `.biz-badge.no`, `.city-empty-ic` |

**`--tr` es el color de acción secundaria de todo el demo** y falla AA en todas sus apariciones como texto.

**`color: var(--gy)` — 67 selectores.** Es el gris de cuerpo del demo. A 4.55:1 sobre `--wh` pasa AA por 0.05 puntos, pero:
- **Falla (4.20:1) sobre `--cr` #F5F0EA**, y varios de sus usos viven exactamente ahí: `.voucher-cancel-d`, `.biz-note`, `.suc-row .l`, `.ai-cc-desc`, `.sal-tour`/`.sal-meta` dentro de `.sal-bk-q-box`.
- 18 de esos 67 están a ≤11px.

**Otros colores fuera de la paleta (medidos):**

| Color | Uso | sobre `--wh` | Veredicto |
|---|---|---|---|
| `#8B6914` | `.login-banner`, `.tp-rv` | 4.86 | ✅ |
| `#8A6A12` | `.sal-plazo.soft` | 4.84 | ✅ |
| `#C0392B` | botón borrar inline (`:4521`, `:4578`) | 5.20 | ✅ |
| `#555` | preview de descripción (`:5309`) | 7.13 | ✅ |
| `#e53e3e` | `.field-err` (11px) | 3.95 | ❌ **error de formulario que falla AA** |
| `#B8860B` | `.st-pending`, `.biz-badge.pending` | 3.11 | ❌ |

**Badges sobre su propio fondo tintado:**

| Badge | Contraste real | |
|---|---|---|
| `.st-pending` #B8860B sobre `rgba(212,168,67,.15)` | **2.81** | ❌ |
| `.tp-completed` `--sg` sobre `rgba(107,143,113,.15)` | **2.97** | ❌ |
| `.st-cancelled` `--tr` sobre `rgba(199,97,58,.1)` | **3.44** | ❌ |
| `.biz-badge.ok` `--m` sobre `rgba(45,90,61,.1)` | 6.53 | ✅ |

Los badges de estado son 10px, uppercase, sobre fondo tintado — el peor combo del sistema.

**`--gd` #D4A843 (2.12:1)** en `.rev-big-stars`, `.rev-stars` (12px), `.sr-rating` (10px), `.tc-m .rt`, `.gc-m .rt`. Las estrellas son semi-decorativas (hay número al lado), pero `.tc-m .rt` y `.gc-m .rt` renderizan **el número de rating** en oro sobre blanco.

**`--ai` #0EA5E9** en `.ai-sum-h` (10px, 700, uppercase) sobre el tinte del panel `.ai-sum` (≈`#f1fafe`) → **2.62:1**.

### 6c · Placeholders

**Una sola regla en todo el demo:**

```css
.ai-sb input::placeholder{color:var(--gy)}
```

Los demás inputs — `.inp`, `.login-input`, `.rv-textarea`, `.ai-cc-input`, `.bk-phone-inp` — **no declaran color de placeholder**, así que usan el default del UA (≈`#757575` en Chrome, más claro en Safari). Es decir: el placeholder del buscador y el del formulario de reserva no son el mismo color, y ninguno de los dos está bajo control del sistema. Ninguno usa `--lg` ni `--gy-soft`.

### 6d · Sobre qué fondo se renderiza cada uno

| Fondo | Hex | Dónde | Notas |
|---|---|---|---|
| `--wh` | #FAFAF7 | root de la app, `.tn`, `.bn`, `.bb` | la mayoría del texto |
| `white` | #FFFFFF | `.tc`, `.gc`, `.tp-card`, `.dsh-bk`, `.dsh-ls`, `.voucher`, `.biz-sec`, `.earn-row`, `.earn-chart`, `.ai-suggest`, `.lang-dd-menu`, `.city-sheet`, `.notif-sheet`, `.ai-cc-result` | títulos y meta de card |
| `--cr` | #F5F0EA | `.ai-result`, `.sum`, `.suc-card`, `.det-op`, `.rev-summary`, `.rv-form`, `.voucher-cancel`, `.biz-note`, `.sal-bk-q-box`, `.sale-note`, `.login-tabs`, `.gbtn`, `.bk-phone-prefix`, `.voucher-code`, `.city-empty`, y todos los `:hover` | **aquí `--gy` cae a 4.20 y falla** |
| `--f` | #1B3A2D | `.site-footer`, `.dsh-h`, `.earn-tot`, `.pf-op-card`, `.login-hero` | blancos translúcidos: `.55` → 4.91 ✅ · `.7` → 6.97 ✅ · `.75` → 7.75 ✅ |
| imagen | variable | `.hero`, `.det-hero` | ver §4c |
| tintes | variable | badges de estado | ver tabla de badges |

Nota: en `index.css` el bloque `@media (prefers-color-scheme: dark)` redefine `--bg: #16171d` para `.app-demo`, pero `.app{background:var(--wh)}` gana por orden de cascada. El fondo se mantiene claro en modo oscuro — que es lo deseado, pero por accidente, no por diseño (ver §10a para el caso donde **no** gana).

---

## 7. Números y fuentes adicionales

### 7a · `font-variant-numeric` — **no existe en ningún archivo**

Verificado en `AppDemo.jsx`, `index.css`, `App.css` y `Landing.jsx`: cero ocurrencias. Sin `tabular-nums`, todos los números usan cifras proporcionales.

### 7b · Selectores que muestran precios, ratings o contadores

**Severidad: MEDIA**

- **Precios (12):** `.sr-price` (13/800) · `.tc-pr` + `.tc-pr span` (16/800 + 11/400) · `.gc-p` + `.gc-p span` (14/800 + 10/400) · `.bb-p` + `.bb-p span` (20/800 + 12/400) · `.sum-t` (16/800) · `.sum-r` (14) · `.voucher-pay-row` (13) · `.voucher-pay-row.total` (15/800) · `.tp-price` (15/800) · `.dsh-bk-a` (15/800) · `.earn-tot` · `.suc-row` (14)
- **Ratings (8):** `.sr-rating` (10, `--gd`) · `.tc-m .rt` (700, `--gd`) · `.gc-m .rt` (700, `--gd`) · `.rev-big-n` (36, DM Serif) · `.rev-big-stars` (12, `--gd`) · `.rev-stars` (12, `--gd`) · `.rev-big-cnt` (11) · `.rev-bar-row` (11) + `span:last-child` (10)
- **Contadores (7):** `.gcnt` (18/700 — selector de personas) · `.rev-bar-row span:last-child` (10) · `.dsh-s-v` (22/800) · `.pf-stat-v` (20/800) · `.login-hero-stat-v` (18/800) · `.earn-bl` (10) · `.tp-h p` (14, "N reservas")

**El caso que más lo necesita:** `.gcnt` es un contador de ancho fijo (`width: 60px`) que cambia de valor con los botones `+`/`−`. Sin `tabular-nums`, el número salta lateralmente al pasar de 1 a 2 a 10. Lo mismo en `.earn-bl` (etiquetas de barras) y en las filas de precio de `.sum-r`/`.voucher-pay-row`, donde los montos deberían alinearse en columna y no lo hacen.

### 7c · font-family distintos a Plus Jakarta Sans y DM Serif Display

**Severidad: MEDIA** (monospace) · **BAJA** (la cursiva muerta)

**Monospace — 2 usos:**

| Selector | Declaración | Problema |
|---|---|---|
| `.voucher-code` | `font-family:monospace;font-size:13px;font-weight:700;letter-spacing:1px` | `monospace` genérico + tamaño fijo |
| `.tp-code` | `font-family:monospace;font-size:11px;color:var(--lg)` | 11px + contraste 2.87 ❌ |

Ambos usan la keyword `monospace` sin stack. En Chrome eso activa el bug histórico del tamaño de fuente monoespaciada. Además, son **el mismo dato** — el código de reserva — con dos tamaños, dos pesos, dos colores y dos trackings distintos según la pantalla.

**Fuentes del sistema (heredadas de `index.css`, no intencionales):**

`--sans: system-ui, 'Segoe UI', Roboto, sans-serif` y `--heading: system-ui, …` definidas en `.app-demo`. El shorthand `font: 18px/145% var(--sans)` las aplica al root; `.app{font-family:'Plus Jakarta Sans'}` las pisa por orden de cascada. **Funciona, pero por un empate resuelto por orden de documento** — si el bundler cambiara el orden de inyección de estilos, el demo entero renderizaría en `system-ui`.

**`font-synthesis: none`** (heredado de `.app-demo`) tiene un efecto silencioso: `.voucher-more{font-style:italic}` no puede renderizar cursiva, porque el `@import` de Plus Jakarta Sans solo pide el eje `wght` (sin `ital`) y la síntesis está desactivada. Esa cursiva **hoy no se ve**.

---

## 8. Carga de fuentes

**Severidad: MEDIA** (falta preconnect) · **BAJA** (peso 300 muerto, imports redundantes)

### 8a · Import en `AppDemo.jsx`

`AppDemo.jsx:937`, primera línea de la constante `CSS`:

```css
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
```

**Pesos solicitados:**
- Plus Jakarta Sans: **300, 400, 500, 600, 700, 800** (6 pesos)
- DM Serif Display: `ital@0;1` → regular + itálica (solo peso 400)

**Pesos solicitados que no se usan:**
- **`300` — cero usos** en todo el proyecto (verificado en `AppDemo.jsx` y `Landing.jsx`). Descarga muerta.
- **DM Serif italic** — cero usos en el demo. Solo lo usa `Landing.jsx:625` (`.hero-title em`).

El `@import` es válido (está antes de cualquier otra regla), pero se ejecuta desde un `<style>` que React renderiza **dentro del `<body>`**, o sea después del hidratado del JS.

### 8b · `index.html`

`index.html:7` tiene un `<link>` con **exactamente la misma URL**:

```html
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
```

**No hay `preconnect`. No hay `preload`.** Verificado: cero ocurrencias de ambos en `index.html`.

Falta `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`. Sin él, el navegador paga DNS + TCP + TLS a `fonts.gstatic.com` recién cuando parsea el CSS de Google — típicamente 100–300ms extra antes de que empiece a bajar el primer `.woff2`. Con `display=swap`, ese tiempo se ve directamente como FOUT en el logo y los títulos serif.

### 8c · `Landing.jsx` y duplicación

`Landing.jsx:554` tiene su propio `@import` con **la misma URL idéntica**. Total: **tres declaraciones de la misma hoja de fuentes** (`index.html` + `Landing.jsx` + `AppDemo.jsx`).

**¿Hay peticiones duplicadas?** No en la red: las tres URLs son byte-a-byte idénticas, así que el navegador deduplica (misma entrada de caché HTTP). Y como `App.jsx` es un `if/else` (landing **o** demo, nunca ambos), solo uno de los dos `@import` de JSX se monta por sesión.

Lo que sí es real es que **los dos `@import` de JSX son redundantes**: el `<link>` de `index.html` ya inicia la descarga en el `<head>`, antes de que el JS cargue. Se pueden borrar los dos sin efecto visible.

---

## 9. Áreas táctiles

**Severidad: ALTA**

**Método:** medí `getBoundingClientRect().height` en vivo donde el elemento estaba montado; para el resto calculé `padding-vertical×2 + font-size×~1.23 + border` (el factor 1.23 es el `line-height: normal` de Plus Jakarta Sans, validado contra las medidas reales — `.chip` estimado 39.4px vs. **38.0px medido**).

| Selector | padY | fs | border | Altura | Veredicto |
|---|---|---|---|---|---|
| `.tn-btn` | 0 | — | 3 | **44.0px** (medido) | ✅ único que cumple |
| `.dsh-tab` (base) | 28 | 12px | 2 | **45.1px** | ✅ |
| `.rev-more` | 24 | 13px | 3 | **43.4px** | ❌ por 0.6px |
| `.dsh-tab` `@1024` | 26 | 13px | 0 | **42.4px** | ❌ |
| `.chip` | 20 | 13px | 3 | **38.0px** (medido) | ❌ |
| `.tp-tab` | 20 | 13px | 3 | **~38px** | ❌ |
| `.city-btn` | 16 | 13px | 3 | **34.0px** (medido) | ❌ |
| `.tn-link` | 16 | 14px | 0 | **34.0px** (medido) | ❌ |
| `.sr-clear` | 8 | 16px | 0 | **~28px** | ❌ |
| `.lang-dd-btn` | 10 | 11px | 3 | **~27px** | ❌ |
| `.sl` | 0 | 13px | 0 | **16.0px** (medido) | ❌ **el peor** |
| `.bn-i` | 12 | 10px | 0 | **~48.6px** | ⚠️ cumple por accidente |

**7 de los 8 selectores del brief quedan por debajo de 44px.**

Aclaraciones:

- **`.bn-i` pasa por accidente:** los 48.6px no vienen de su propio padding (12px) sino de que apila un ícono de 22px (`.ni`, `line-height: 1`) sobre la etiqueta de 10px. **Bajar el ícono o cambiar el gap rompe el target.** No está garantizado por CSS, es emergente.
- **`.sl` mide 16px de alto.** Es el "Ver todos" de cada sección: un `<button>` sin padding alguno. Es el target más chico del demo y aparece en todas las secciones del home.
- **`.rev-more` falla por 0.6px** — 1px más de padding lo arregla.
- **`.dsh-tab` invierte el resultado con el breakpoint:** cumple en mobile (45.1px) y falla en desktop (42.4px). Menos grave (ahí es puntero), pero delata que nadie calculó el target.

**Fuera de la lista del brief, mismo problema:** las celdas del calendario de reserva (`AppDemo.jsx:428`) usan `minHeight: 36, aspectRatio: "1"` → **36×36px**, y son el control táctil más crítico del flujo de reserva. Ahí adentro vive el `fontSize: 8` de §1d.

---

## 10. Riesgo de colisión

### 10a · Reglas globales en `index.css` / `App.css`

**Severidad: ALTA**

**`src/App.css` — sin riesgo: no está importado en ninguna parte.** Verificado (`grep` en `src/` e `index.html`): el único match es un comentario en `Landing.jsx:575`. Sus 184 líneas (`.counter`, `.hero`, `#center`, `#next-steps`, `.ticks`) son código muerto. Ojo: **contiene un `.hero`** que colisionaría con el `.hero` del demo si alguien lo importara.

**`src/index.css` — riesgo ALTO. Importado globalmente en `src/main.jsx:3`.** Es la plantilla de Vite con `.app` renombrado a `.app-demo`, y el root del demo lleva esa clase. Reglas vivas leídas del build desplegado:

```css
.app-demo { --text-h: #08060d; ... }
[DARK] .app-demo { --text-h: #f3f4f6; ... }
.app-demo h1, .app-demo h2 { font-family: var(--heading); color: var(--text-h); font-weight: 500; }
.app-demo h1 { letter-spacing: -1.68px; margin: 32px 0px; font-size: 56px; }
.app-demo h2 { letter-spacing: -0.24px; margin: 0px 0px 8px; font-size: 24px; line-height: 118%; }
.app-demo p  { margin: 0px; }
.app-demo code, .app-demo .counter { font-family: var(--mono); ... }
```

**Lo que `index.css` gana hoy sin oposición** (porque `.app` no declara la propiedad):

| Propiedad | Valor impuesto | Impacto |
|---|---|---|
| `font-size` (root) | **18px** / 16px ≤1024 | el rem-equivalente del demo no es 16px |
| `line-height` (root) | **145% → 26.1px absoluto heredado** | ver hallazgo principal |
| `letter-spacing` | **0.18px** en todo el demo | `.city-near` lo anula a mano |
| `text-align` | **center** | sostiene el centrado de `.tc-b`, `.welcome`, `.suc` y el home |
| `width` / `max-width` / `margin` | 1126px / 100% / auto | |
| `border-inline` | 1px solid `--border` | |
| `display` / `flex-direction` | flex / column | |
| `font-synthesis` | **none** | mata la cursiva de `.voucher-more` |
| `text-rendering` | optimizeLegibility | |
| `color-scheme` | **light dark** | afecta controles nativos en modo oscuro |

**Lo que se resuelve por empate de especificidad (0,1,0) y orden de documento** — `.app` gana solo porque el `<style>` de React está en `<body>`, después del `<link>` del `<head>`:

`font-family` · `color` · `background` · `min-height` · `-webkit-font-smoothing`

Esto es frágil: cualquier cambio en cómo Vite inyecta CSS (o mover el `<style>` al head, que sería lo correcto) invierte el resultado y el demo entero pasa a `system-ui`.

#### 🔴 Bug latente concreto — `.npage-h h2`

`.app-demo h1, .app-demo h2 { color: var(--text-h) }` tiene especificidad (0,1,1). De los cuatro `h2` del demo:

| `h2` | ¿Declara `color`? | Resultado |
|---|---|---|
| `.tp-h h2` ("Mis reservas") | sí, `var(--ch)` | ✅ protegido |
| `.tdet-h` ("Tu reserva") | sí, `var(--ch)` | ✅ protegido |
| `.det-tl-desktop` (h1) | — | `display: none` |
| **`.npage-h h2` ("Notificaciones")** | **no** | ❌ **hereda `var(--text-h)`** |

En modo claro eso da `#08060d` (casi negro, apenas distinto de `--ch`, imperceptible). **Pero con `prefers-color-scheme: dark`, `--text-h` pasa a `#f3f4f6`** — texto casi blanco sobre el fondo `--wh` #FAFAF7 del demo. Contraste ≈ **1.03:1: el título "Notificaciones" desaparece.**

Es un bug de accesibilidad real, presente en producción, para cualquier usuario con el sistema en modo oscuro. Los otros dos `h2` se salvan solo porque alguien les puso `color` por otro motivo.

> **Nota al pie agregada el 2026-08-13, después de aplicar el arreglo. La tabla de arriba tiene un error y se deja tal cual para que quede el registro.**
>
> **`.tdet-h` ("Tu reserva") NO estaba protegido.** La auditoría lo dio por salvado porque declara `color: var(--ch)`, y **declarar color no alcanza: hay que ganar la cascada.**
>
> - `.app-demo h2` es clase + elemento → **(0,1,1)**.
> - `.npage-h h2` y `.tp-h h2` también son clase + elemento → **(0,1,1)**. Empatan, y ganan por orden de documento, porque el `<style>` de React se inyecta en el `<body>`, después del `<link>` del `<head>`.
> - **`.tdet-h` es una clase sobre el propio `h2` → (0,1,0). Pierde.** Su `color` nunca se aplicó, ni siquiera en modo claro: medido en vivo daba `#08060d` (el `--text-h` claro) en vez de `#2C2C2A`. En claro la diferencia es imperceptible, los dos son casi negros, y por eso nadie lo notó nunca. En modo oscuro pasaba exactamente lo mismo que en Notificaciones: `#f3f4f6` sobre fondo `#FAFAF7`, **1.05:1**, título invisible.
>
> O sea que los `h2` afectados eran **dos**, no uno, y el segundo es la pantalla de detalle de una reserva ya hecha.
>
> **El error de análisis a no repetir:** la pregunta correcta no es "¿declara `color`?" sino "¿le gana a `.app-demo h2`?". Cualquier revisión futura de esta herencia tiene que comparar especificidad, no presencia de la propiedad.
>
> **Universo verificado y cerrado:** el demo tiene exactamente **tres `h2` y un `h1`**, sin HTML inyectado ni `h2` generados dinámicamente. `.npage-h h2` y `.tdet-h` se arreglaron (commits `c171347` y el siguiente); `.tp-h h2` gana hoy, pero por orden de documento, no por especificidad, así que sigue expuesto al riesgo #8 de esta misma auditoría. El `h1` `.det-tl-desktop` hereda `--text-h` igual que los demás, pero es `display:none` en sus dos declaraciones (`AppDemo.jsx:1227` y `:1718`), así que hoy no se ve: **si alguien lo muestra alguna vez, arrastra el mismo bug.**

Además, los tres `h2` reciben `font-weight: 500` y `margin: 0 0 8px` de `index.css` — pesos y márgenes que el sistema de `AppDemo` nunca declaró.

### 10b · Selectores donde subir font-size puede romper layout

**Severidad: MEDIA**

**Riesgo alto — ancho fijo + texto que crece:**

| Selector | Restricción | Qué pasa si sube el tamaño |
|---|---|---|
| `.gcnt` | `width: 60px` + `font-size: 18px/700` | contador de personas; a 20px+ un "10" desborda o se recorta |
| `.rev-bar-row span:first-child` | `width: 12px` | número de estrella (1–5) |
| `.rev-bar-row span:last-child` | `width: 24px` + `font-size: 10px` | porcentaje; a 12px+ "100%" no entra |
| `.lang-dd-item .lang-check` | `width: 14px` + `font-size: 12px` | check del idioma |
| `.lang-dd-menu` | `min-width: 120px` | el menú crece pero el botón `.lang-dd-btn` no |
| `.rev-big` | `min-width: 72px` con `.rev-big-n` a 36px | |

**Riesgo alto — `white-space: nowrap` (7 casos):** el texto no puede envolver, así que crece en horizontal y desborda o comprime al vecino.

| Selector | fs | Contexto |
|---|---|---|
| **`.bb-p`** | 20px/800 | precio en la barra fija de reserva, junto a `.bb-bt{flex:1}` — el botón se come el espacio que el precio necesite |
| **`.chip`** | 13px | scroller horizontal de categorías |
| **`.dsh-tab`** | 12px | tabs del dashboard; en ≥1024px pasan a sidebar de **220px fijos** |
| `.sr-name` | 13px | tiene `text-overflow: ellipsis` ✅ mitigado |
| `.pf-op-title` | 14px | dentro de `.pf-op-card` con `min-height: 80px` |
| `.bk-phone-prefix` | 14px | prefijo +51 pegado al input de teléfono |
| *(inline)* `AppDemo.jsx:437` | 8px | "Último cupo" dentro de una celda de 36px — **cualquier aumento lo rompe** |

**Riesgo medio — cards de ancho fijo y grids rígidos:**

| Selector | Restricción | Textos dentro |
|---|---|---|
| `.tc` | `flex: 0 0 260px` (mobile) | `.tc-tl` 15px a 2 líneas, `.tc-loc` uppercase, `.tc-pr` 16px |
| `.tg` | `grid: 1fr 1fr` (mobile) → 3col @1024 → 4col @1200 | `.gc-t` 13px, `.gc-p` 14px — **a 390px cada celda son ~175px**; subir `.gc-t` a 15-16px fuerza 3 líneas y descuadra la altura de las cards |
| `.det-mb` | `grid: 1fr 1fr` | `.det-mi` 13px con ícono |
| `.dsh-sts` | `grid: 1fr 1fr` | `.dsh-s-v` 22px/800 + `.dsh-s-l` 10px uppercase |
| `.dsh` @1024 | `grid: 220px 1fr` | columna de tabs con `nowrap` |
| `.site-footer-cols` | `grid: 1.4fr 1fr 1fr 1fr` | 4 columnas de links a 13px |

**Riesgo medio — altura fija con texto adentro:**

`.otp-digit` (48×56px, fs 24px) · `.welcome-check` / `.suc-chk` / `.pf-av` (72×72, fs 32/24) · `.det-op-av` / `.dsh-bk-av` / `.gbtn` / `.bk-btn` (44×44, fs 18/16/20/18) · `.det-ic` (20×20, fs 10px) · `.rev-av` (32×32, fs 11px) · `.pm-ic` (32×32, fs 12px) · `.home-pg .ai-sb input` (`height: 60px`, fs 15px @1024).

**Riesgo bajo pero real — `.det-hero .det-tl` @1024:** `font-size: 38px` con `max-width: 92%` posicionado en `bottom: 96px` absoluto. El comentario en `AppDemo.jsx:1712-1714` documenta que ya se peleó con que el título se cortara. Subirlo reabre ese problema.

---

## Archivos a tocar, en orden

1. **`src/index.css`** — primero y solo esto en su propio commit. Eliminar o neutralizar el bloque `.app-demo` (líneas 6-45, 47-65, 67-109). Es código muerto de la plantilla Vite que hoy controla el `font-size` del root, el `line-height` base, el `letter-spacing` global, el `font-synthesis`, el `text-align`, el ancho y el color de los `h2` (incluido el bug de modo oscuro). **Sin este paso, cualquier escala nueva se sigue mezclando con un `line-height` de 26,1px absolutos.** Verificar antes qué se rompe: el demo perdería `width: 1126px`, `text-align: center`, `display: flex` y `border-inline` — hay que decidir cuáles se replican en `.app` a propósito.

2. **`src/AppDemo.jsx` — bloque de tokens** (`:939-942`). Añadir a `.app` un `font-size` y un `line-height` base propios (**unitless, no porcentaje**, para que se herede como ratio), y las variables de la nueva escala. Corregir `--lg`, `--tr`, `--gd`, `--ai`, `--sg` y `--gy` a valores que pasen AA; borrar `--gy-soft` (no la usa nadie).

3. **`src/AppDemo.jsx` — constante `CSS`** (`:936-1763`). Migrar las 242 `font-size`, las 130 `font-weight`, las 30 `line-height` y las 22 `letter-spacing` a los tokens. Añadir reglas de placeholder para `.inp`, `.login-input`, `.rv-textarea`, `.ai-cc-input`.

4. **`src/AppDemo.jsx` — estilos inline del JSX** (fuera de `936-1763`). 106 `fontSize`, 53 `fontWeight`, 30 `lineHeight`. Son el 30% de la superficie y no los alcanza ningún cambio en la constante CSS. Prioridad dentro de este paso: `:437` (el 8px del calendario) y `:4925` (el 9px del uploader).

5. **`index.html`** — añadir `preconnect` a `fonts.googleapis.com` y `fonts.gstatic.com` (crossorigin); quitar el peso `300` de la URL si se confirma que nadie lo va a usar. **Ojo:** la URL de fuentes es compartida con `Landing.jsx` — cambiarla afecta a la landing.

6. **`src/AppDemo.jsx:937` y `src/Landing.jsx:554`** — opcional: borrar los dos `@import` redundantes (el `<link>` de `index.html` ya los cubre). Tocar `Landing.jsx` requiere confirmación explícita según CLAUDE.md.

**No se toca `src/App.css`** (código muerto, no importado) ni `src/Landing.jsx` salvo autorización.

---

## Estimación de declaraciones afectadas

| Superficie | Declaraciones |
|---|---|
| `font-size` en constante CSS | 242 |
| `fontSize` inline en JSX | 106 |
| `font-weight` en constante CSS | 130 |
| `fontWeight` inline en JSX | 53 |
| `line-height` en constante CSS | 30 |
| `lineHeight` inline en JSX | 30 |
| `letter-spacing` en constante CSS | 22 |
| `color:` con variable a corregir (`--gy` 67, `--tr` 17, `--lg` 5, `--gd` ~5, `--sg` 2, `--ai` 1) | ~97 |
| Bloque `.app-demo` de `index.css` a eliminar | ~35 |
| **Superficie total tocable** | **~745** |

Ese es el techo si se reescribe declaración por declaración. **Con tokens CSS el cambio real es mucho menor:** definir la escala en `.app` (≈15 variables nuevas) y hacer un reemplazo mecánico px→token deja ~420 ediciones de una línea, de las cuales **~350 son búsqueda-y-reemplazo directa** (todos los `13px` → `var(--fs-body)`, etc.).

**El núcleo del arreglo son ~50 declaraciones:** el bloque de `index.css`, los tokens de `.app`, las 5 variables de color que fallan AA, y las ~11 reglas de `line-height` que hoy compensan a mano lo que debería dar la base.

---

## Riesgos de regresión detectados

1. **🔴 Quitar `.app-demo` de `index.css` cambia el layout, no solo la tipografía.** Se pierden `width: 1126px`, `max-width: 100%`, `margin: 0 auto`, `text-align: center`, `display: flex`, `flex-direction: column`, `min-height: 100svh` y `border-inline`. El `text-align: center` en particular está sosteniendo el centrado de `.tc-b`, `.welcome`, `.suc` y el home. **Hay que replicar deliberadamente lo que se quiera conservar antes de borrar**, o el demo se descuadra entero. Este es el riesgo #1 del proyecto.

2. **🔴 Los dos regímenes de line-height se van a igualar.** Hoy los `<button>` tienen `line-height: normal` (~1.23) y los `<div>` tienen 26,1px. Al fijar un `line-height` base unitless en `.app`, los botones **también lo heredarán**. Eso *arregla* las áreas táctiles de §9, pero **rompe `.chip`, `.dsh-tab` y `.tp-tab` que tienen `nowrap` dentro de scrollers horizontales**, y engorda `.bb-bt`, `.mbtn` y `.login-btn`. Hay que auditar botón por botón, no solo texto.

3. **🟠 Subir el cuerpo de 13px a 15-16px descuadra `.tg` en mobile.** A 390px cada celda del grid `1fr 1fr` mide ~175px. `.gc-t` (13px, 2 líneas hoy) pasaría a 3 líneas y las cards del grid dejarían de tener altura pareja. Igual con `.tc` en su `flex: 0 0 260px`.

4. **🟠 `.bb-p` con `nowrap` a 20px/800 junto a `.bb-bt{flex:1}`.** Si el precio crece, el botón "Reservar" se comprime hasta romperse. La barra tiene `flex-wrap: wrap`, así que probablemente el modo de venta (`.bb-mode`) salte de línea antes — pero hay que verlo con precios de 4 cifras.

5. **🟠 `.gcnt` con `width: 60px` fijo.** El contador de personas a 20px+ desborda con dos dígitos.

6. **🟠 El calendario de reserva es el punto más frágil.** Celdas de `minHeight: 36` con `aspectRatio: 1`, texto de 13px y una etiqueta de escasez de 8px con `nowrap` y `lineHeight: 1.05`. Los últimos tres commits (`0100120`, `4379219`, `db21c0b`) son precisamente ajustes a esa celda. Cualquier cambio de escala ahí reabre trabajo ya cerrado — conviene tratarlo como caso aparte y verificarlo a mano.

7. **🟡 Corregir `--tr` a un valor que pase AA cambia el color de marca.** `--tr` #C7613A es el terracota del logo ("finde**.**"), del acento de la landing y de la variable `--focus`. Oscurecerlo a ≥4.5:1 lo aleja del terracota de `Landing.jsx`, que comparte la paleta. **Es una decisión de marca, no técnica** — la alternativa es dejar `--tr` para superficies decorativas y crear un `--tr-text` más oscuro solo para texto.

8. **🟡 `font-family` depende del orden de inyección de CSS.** Hoy `.app` gana a `.app-demo` por orden de documento, no por especificidad. Si al limpiar `index.css` se mueve el `<style>` del demo al `<head>`, el empate se invierte y todo renderiza en `system-ui`. Si se elimina el bloque `.app-demo`, el problema desaparece — pero no hay que dejarlo a medias.

9. **🟡 `.dsh-tab` invierte su comportamiento con el breakpoint** (45.1px mobile ✅ / 42.4px desktop ❌). Cualquier ajuste tiene que probarse en los dos lados del `@media(min-width:1024px)`, donde además pasa de tab horizontal a sidebar de 220px.

10. **🟡 `.bn-i` cumple 44px por accidente.** Su altura la da el ícono de 22px, no su padding. Tocar el gap, el `line-height: 1` de `.ni` o el tamaño del ícono lo baja de 44px sin que ninguna regla de tipografía parezca responsable.

---

## Salida literal solicitada

```
$ git branch --show-current
dev
```

```
$ git log --oneline -6
c6e8573 docs: agrega flujo obligatorio dev → QA → prod a CLAUDE.md
1aa6832 chore: trigger preview deploy
db21c0b fix(demo): disponibilidad pre-cargada desde el detalle y contraste de escasez
4379219 fix(demo): jerarquia visual de escasez en el calendario de reserva
0100120 fix(demo): el aviso de cupos va en la celda del calendario y limita el selector
d561bb2 feat(demo): el viajero ve el modo de venta del tour que reserva
```

**Rama activa: `dev`.** Working tree limpio, sin cambios, sin ramas nuevas, sin commits. `Landing.jsx` leído solo como referencia (§8c), nunca editado.

---

**Lo que cambiaría del diagnóstico previo:** no es que falte un `line-height` base — es que hay uno equivocado, heredado de la plantilla de Vite, expresado en porcentaje (y por eso se propaga como valor absoluto), y que además arrastra el `font-size` del root, el `letter-spacing` global, el `font-synthesis`, el ancho, el centrado y un bug de contraste en modo oscuro. Ese bloque de `index.css` es el primer dominó; el resto de la escala es más fácil de ordenar una vez que está fuera.
