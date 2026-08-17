# El `noindex` de `/demo` y las URLs de tours que no existen

**Piezas 1 y 2 APLICADAS el 2026-08-17. Pieza 3 DIFERIDA al día del switch, con decisión tomada y costo aceptado (ver abajo).**

**Diagnóstico del 2026-08-17.** Decisión de José tomada:
**nada bajo `/demo` debe indexarse hoy**, ni la portada, ni el buscador, ni las
fichas. El producto no está lanzado y adentro hay datos de prueba.

---

## Cómo apareció

José reportó que la ficha de "Cumbe Mayo" traía el HTML genérico. **El prerender
no estaba roto**: 42 tours activos, 42 carpetas, cero faltantes y cero segmentos
repetidos. La URL que probó apuntaba a un tour **que no existe en la base**
(sufijo `vqowds`; el Cumbe Mayo real es `dnro3d`, y el sufijo sale del id y no
cambia nunca).

**De dónde salió esa URL:** del texto de ejemplo del propio formulario, que
interpolaba el título real de la agencia y le pegaba "bosque de piedras cerca de
Cajamarca". Alguien lo copió como título de verdad. **Corregido el 2026-08-17**:
el ejemplo ya no se lee como un dato listo para usar.

**Pero el hallazgo de verdad fue otro**, y lo nombró José: que a esa ficha le
faltara el `noindex` importa más que el título.

## El estado medido

No hay `robots.txt`, y el `index.html` genérico **no tiene ninguna etiqueta
`robots`**. El `noindex` existe solo en las 42 fichas prerenderizadas.

| URL | HTML que llega | `noindex` en el HTML crudo |
|---|---|---|
| Las 42 fichas de tours activos | propio | **sí** |
| `/demo` | genérico | no |
| `/demo/buscar` | genérico | no |
| `/demo/no-encontrado` | genérico | no |
| **Los 7 tours pausados** | genérico | no |
| Cualquier URL inventada bajo `/demo/tour/` | genérico | no |

Y **todas responden 200**, no 404: el rewrite `/demo/:path*` las captura. Para
Google eso es un soft 404, que es peor que un 404 de verdad.

Las 7 URLs concretas hoy en ese estado son las de los tours pausados, y importan
porque **estuvieron públicas y pueden estar enlazadas**: las cinco de "Descubre
el Perú" que bajó la limpieza del sello, más las dos de prueba.

---

## Pieza 1: el `noindex` general

**Recomendada: una línea en `index.html`**, la plantilla de la SPA.

```html
<meta name="robots" content="noindex">
```

Con eso, **todo lo que se sirve desde la plantilla genérica queda con `noindex`**:
la portada, el buscador, la pantalla de 404 y cualquier URL huérfana. Y las
fichas no se duplican: `inyectar()` en `scripts/prerender.ts` ya borra las
etiquetas `robots` de la plantilla antes de poner las suyas.

- **Cuesta cero funciones.** El slot sigue reservado para Culqi.
- **Se ve en "ver código fuente"**, así que el QA es el mismo que ya se hizo con
  las fichas, sin abrir la pestaña de red.

**Alternativa evaluada y descartada: `robots.txt` con `Disallow: /demo/`.** Es la
misma razón por la que la tanda 5 eligió `noindex` y no `robots.txt`:
**`robots.txt` bloquea el RASTREO**, así que apagaría también la tarjeta de
WhatsApp, que es justo lo que esa tanda vino a comprar. Además un `Disallow` no
garantiza no ser indexado: Google puede indexar una URL bloqueada si la encuentra
enlazada desde afuera, y la muestra sin descripción.

**Segunda alternativa: la cabecera `X-Robots-Tag` por `vercel.json`.** Funciona y
también cuesta cero funciones, pero **una cabecera no se ve en "ver código
fuente"**, así que el QA se vuelve más difícil y es más fácil olvidarse de ella
el día del switch. Si algún día hay que noindexar algo que no pasa por la
plantilla, esta es la herramienta.

## Pieza 2: cómo se saca el día del switch

**Dos cambios, los dos de una línea:**

1. Borrar el `<meta name="robots">` de `index.html`.
2. `BASE_PATH` a `""` en `src/lib/routes.js`, que ya es parte de la tanda 6.

**Las fichas se arreglan solas con el punto 2**, porque el prerender decide con
`const NOINDEX = BASE_PATH !== ""`. No hay que tocar `scripts/prerender.ts`.

Y es reversible: si algo sale mal, se vuelve a poner la línea. **Esa fue la prueba
que decidió la forma**: si aplicarlo hiciera difícil sacarlo, sería la forma
equivocada.

## Pieza 3: las URLs de tours que no existen

**Un 404 de verdad SÍ se puede, sin función y sin servidor propio.** Corregí acá
lo que había dicho antes: no hace falta un servidor, hace falta configuración.

**Vercel ya genera la ruta de 404**, verificado leyendo la salida de
`vercel build` (`.vercel/output/config.json`):

```json
{ "handle": "error" },
{ "status": 404, "src": "^(?!/api).*$", "dest": "/404.html" }
```

**Existe y nunca se dispara**, porque el rewrite de `/demo/:path*` atrapa la
petición antes. El orden real de las fases es: **archivos primero** (por eso las
fichas prerenderizadas ganan), después los rewrites, y la fase de error al final,
a la que ya no llega nada.

**La salida es angostar el rewrite para que `/demo/tour/*` no esté incluido.**
Entonces:

| Caso | Qué pasa |
|---|---|
| `/demo/tour/<tour que existe>` | lo sirve el archivo prerenderizado, 200 |
| `/demo/tour/<tour que no existe>` | no hay archivo, no hay rewrite, **404 real** |
| `/demo`, `/demo/buscar` | siguen con su rewrite, la SPA anda igual |

Se puede escribir con un `source` que excluya `tour/`, o migrando a `routes`, que
acepta `status` explícito. **La forma exacta hay que probarla en un preview antes
de commitearla**, porque de ese rewrite depende que ande todo el sitio.

Conviene además un `public/404.html` propio, para que la página no sea la de
Vercel. Vite copia `public/` tal cual, así que no cuesta configuración.

**El costo real de esta pieza no es técnico, es de mantenimiento:** hoy
`.claude/rules/frontend.md` dice que agregar una pantalla no se toca en
`vercel.json`. Con el rewrite angostado, **eso deja de ser cierto para las rutas
bajo `/demo/tour/`** y la regla hay que actualizarla, o alguien va a agregar una
vista y le va a dar 404 en producción andando en local.

### DECISIÓN: se difiere al día del switch (2026-08-17)

**No se hace ahora, y no por falta de tiempo: el costo de mantenimiento no se
justifica todavía.** Con el `noindex` general puesto, las URLs huérfanas no se
indexan igual, así que la pieza 3 no compra nada hoy.

**Lo que quien la ejecute está aceptando, explícito para que no lo descubra
después:**

> Hoy **agregar una pantalla nueva no toca `vercel.json`**. Los rewrites de
> `/demo/*` y `/app/*` mandan todo al `index.html` de la raíz y el switch de
> vistas de `AppDemo.jsx` decide qué renderizar. Está escrito así en
> `.claude/rules/frontend.md` y en `.claude/rules/api-y-schema.md`.
>
> **Con el rewrite angostado eso deja de ser cierto bajo `/demo/tour/`.** Alguien
> va a agregar una vista, le va a andar en `npm run dev`, y en producción va a
> dar 404. **Y va a dar 404 de verdad, no una pantalla en blanco**, así que se va
> a parecer a un problema de datos y no a uno de configuración, que es la clase
> de error que más tarda en diagnosticarse.
>
> Si se ejecuta, **las dos reglas hay que actualizarlas en el mismo commit**, no
> después.

**EL DISPARADOR ES CONCRETO, no "algún día":** el día que se borren **los 37
tours del seed**, sus 37 URLs quedan huérfanas de golpe, y son URLs que
estuvieron públicas y prerenderizadas, o sea descubribles por Google. Ese borrado
y el switch son el mismo evento. **Antes de ese día la pieza 3 es opcional;
después es lo que evita 37 soft 404 servidos con la portada genérica.**

**Y el `noindex` general se saca ese mismo día**, así que **no hay ventana en la
que una cosa tape a la otra**: o está el `noindex`, o está el 404. Ese es el
motivo real por el que las tres piezas van juntas y no de a una.
