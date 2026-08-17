# El router y las URLs por vista

> **Historia, no estado.** Es el registro de trabajo **ya cerrado y en `main`**.
> Se archivó acá el 2026-08-16 al podar `docs/estado.md`, que había llegado a
> 1.767 líneas y se leía entero al empezar cada sesión.
>
> **El estado actual del proyecto vive en `docs/estado.md`.** Este archivo se lee
> solo cuando hace falta reconstruir por qué algo se hizo como se hizo.

### Tanda 2, CERRADA: el router y las URLs por vista

**En `main` desde el 2026-08-16 (`1d5bad0`), post-QA.** José validó los ocho
puntos del checklist en dev.finde.pe, incluido el link abierto en incógnito y
compartido por WhatsApp, que es la prueba que resume la tanda.

**Rama `feat/router-urls`, tag `pre-router`.** Cinco commits, uno por paso.

| # | Qué |
|---|---|
| 1 | `src/lib/routes.js`: el mapa de URLs y **el prefijo en una constante** |
| 2 | `GET /api/tours/:id` acepta el sufijo de 6, **sin gastar un slot de función** |
| 3 | La vista sale de la URL, `go()` empuja historial y el botón de atrás anda |
| 4 | La ficha se hidrata por link frío, y aparece la pantalla de 404 |
| 5 | `rel=canonical`, `noindex` en los 404 y el código de reserva fuera de la analítica |

#### Lo que hace que la tanda sea chica

**`go()` ya era el único punto por donde pasa toda la navegación.** El router se
enchufa ahí y no en cada botón. El guard de `effectiveView` **no se tocó**: sigue
siendo la única autoridad sobre qué se ve sin sesión.

#### El deep link sin sesión, y dónde está el límite con la tanda 3

**Un deep link a una vista pública prende el modo invitado**, o el visitante que
llega de Google rebotaría al muro de login y el router no serviría para su
propósito.

**El borde que lo separa de la tanda 3: solo cuenta como deep link una ruta que NO
es la raíz.** Entrar a `/demo` pelado sigue mostrando el login, como siempre.
Abrir la navegación por defecto es la tanda 3.

#### El 404, que no existía

Hasta ahora **la app no tenía concepto de "no encontrado"**: una ficha sin tour
devolvía `null` y quedaba un cuadro en blanco. Con URLs eso pasa a ser frecuente,
porque Google va a tener indexadas fichas de tours que después salen del catálogo.
**Acaba de pasar con siete** en la limpieza del sello.

Dos textos, según lo que sabemos:

- **"Este tour ya no está disponible"**, cuando la URL era una ficha bien formada
  que no resolvió.
- **"No encontramos esta página"**, cuando la URL no corresponde a nada.

**No se distingue entre "no existe" y "está fuera del catálogo", y es a
propósito:** el API responde 404 en los dos casos desde M-2, y al viajero la
diferencia no le sirve. Exponerla además filtraría qué tours tiene pausados una
agencia.

#### Verificado en Chrome, con y sin sesión

| Caso | Resultado |
|---|---|
| `/demo/tour/machu-picchu-...-u9npzp` en frío, sin sesión | el tour, **sin muro de login** |
| `/demo/tour/u9npzp` sin slug | el mismo tour |
| `/demo/tour/titulo-viejo-...-u9npzp` | corrige la barra al canónico y emite `rel=canonical` |
| `/demo/tour/trfkuj` (dado de baja) | "Este tour ya no está disponible" más `noindex` |
| `/demo/cualquier-cosa` | "No encontramos esta página" más `noindex` |
| `/demo` sin sesión | el login, **sin cambios** |
| `/demo/perfil` sin sesión | rebota al login |
| `/mis-reservas/FND-ABC123` | la analítica recibe `/mis-reservas/[code]` |

Más 34 aserciones sobre `routes.js`: tildes, ñ, alfabeto no latino, títulos que
normalizan a nada, el corte en el último guion, los tres formatos de segmento y
la ida y vuelta de todas las vistas.

**Nota de método:** las primeras lecturas del navegador mostraban "Cargando el
tour…" y parecía un bug. **No lo era: es `vercel dev`, que corre cada request en
proceso nuevo y tarda unos 3 segundos en frío.** Está escrito en `CLAUDE.md` que
las latencias locales no son representativas. Lo confirmé reproduciendo la
concurrencia con `curl` antes de tocar nada.

#### Lo que quedó explícitamente afuera

El `document.title` por vista y los meta tags (tanda 5), el modal de cuenta
(tanda 3), los eventos de embudo (tanda 4) y el code splitting por vista, que el
router habilita casi gratis pero es otra cosa.

**`vercel.json` no se tocó.** El rewrite `/demo/:path*` ya cubre cualquier
profundidad; el catch-all de la raíz recién hace falta el día del switch.


---

## La metadata de los tours nuevos, cerrada el 2026-08-16

**El prerender es automático, pero la calidad de los datos no.** El script usa lo
que hay en la base, así que un tour sin `shortPitch` sale así en Google y en
WhatsApp. Con más agencias entrando, esto se repetía sin arreglo.

### El hallazgo que lo hizo obligatorio

| Origen | Tours | Con `shortPitch` | Título promedio | Descripción promedio |
|---|---|---|---|---|
| **Formulario** (agencia real) | 5 | **0 de 5** | **11** | **1.407** |
| Seed (script) | 37 | **37 de 37** | 38 | 1.061 |

**Ninguno de los cinco tours que cargó una agencia real por el formulario tiene
`shortPitch`. Los treinta y siete sembrados por script lo tienen todos.**

**No era descuido de la agencia:** el campo **no existía en `lib/tour-input.ts`**,
así que el formulario no podía mandarlo y el backend no podía guardarlo. Solo lo
llenó el seed, por script.

Y la prueba de que la voluntad nunca fue el problema está en la última columna:
**la agencia escribió descripciones más largas que el seed**, 1.407 caracteres
contra 1.061. **Nunca se lo pidieron.**

**Sin arreglarlo, cada agencia que entrara repetía exactamente lo mismo.**

### Qué se decidió, y qué bloquea y qué no

| Qué | Regla | Bloquea o avisa |
|---|---|---|
| `shortPitch` | 40 a 80 caracteres | **BLOQUEA** |
| Descripción | mínimo 300, era 10 | **BLOQUEA** |
| Portada | al menos una foto | **BLOQUEA** |
| Dimensiones de la portada | aviso bajo 600x315 | avisa |
| Título corto | aviso bajo 15 caracteres | avisa |

**`shortPitch` bloquea porque la fricción es un clic:** el generador de IA **ya
devolvía el campo validado** y el frontend lo tiraba en
`setAiDesc(data.description)`. Esa línea es la razón de fondo del hallazgo. Ahora
"Usar esta" llena los dos campos.

**El mínimo de 300 no bloquea a nadie hoy:** la descripción más corta de las 42
fichas públicas mide 351. Es un piso que solo ataja el caso patológico.

**La portada bloquea porque el formulario NO distingue guardar de publicar.** Se
verificó antes de decidirlo: no existe el concepto de borrador en el código,
`active` nace en `true` y crear un tour lo publica al instante. Un tour sin foto
sería un tour público sin foto, y sin `og:image` el link compartido no tiene
tarjeta.

**El título AVISA y no bloquea, y es la decisión más discutida.** "Namora" y
"Otuzco" tienen 6 letras y son **nombres reales de distritos de Cajamarca**.
Exigir un largo mínimo obligaría a la agencia a inventarle un nombre al tour, que
es peor que el problema. Y el caso ya está resuelto donde corresponde: el
prerender emite `Namora en Cajamarca | Finde`.

---

## El agujero de activar, cerrado el 2026-08-17

**La metadata obligatoria de arriba tenía un agujero, y lo encontró José usando
el panel, no leyendo código.** El formulario bloqueaba guardar sin gancho, pero
**"activar" no pasa por el formulario**: usa `PATCH /api/tours/:id`, que tiene su
propio schema pensado para la config de venta y nunca miraba el contenido. Se
podía apretar el interruptor y devolver al catálogo público un tour sin gancho.

**Es la tercera vez que aparece la misma forma**: una guarda puesta en un camino
y no en el otro que llega al mismo estado (antes: `takeSeats` exigía `ABIERTA` y
`addRequestedSeats` no miraba nada). La lección se promovió a
`.claude/rules/api-y-schema.md`, que se carga sola al tocar `api/`.

### La regla se enunció sobre el ESTADO, no sobre la acción

No es "al crear" ni "al editar": **un tour no puede estar en `active=true` sin su
metadata mínima**, y se valida donde `active` pasa a true. Enunciada así, la
pregunta "¿por dónde más se llega a ese estado?" sale sola. Son dos caminos: el
POST que crea (ya cubierto) y el PATCH que activa (el PUT no toca `active`).

Se dispara solo cuando el cuerpo **pide** `active:true`, así que pausar nunca se
bloquea y cambiar el modo de venta de un tour ya publicado tampoco. Los 5 tours
de MEGATOURS que estaban activos sin gancho **siguieron publicados**: solo
tendrían que completarlo si alguna vez los pausan.

### Compartir la condición costó un archivo nuevo, y valió

La condición nació en `lib/tour-input.ts`, que importa zod, Prisma y Voyage. **El
frontend no podía usarla sin arrastrar todo eso al navegador**, así que la única
salida aparente era copiarla. José lo vetó: una copia se desincroniza el día que
se agregue un cuarto campo obligatorio.

La salida fue **`lib/tour-publish.js`, sin ninguna dependencia**. Verificado en
los tres puntos donde podía fallar, antes de escribir nada:

| Riesgo | Resultado |
|---|---|
| Que Vite no empaquete un archivo fuera de `src/` | entra al bundle |
| Que `tsc` rechace un `.js` compartido en `lib/` | limpio |
| **Que la función serverless se despliegue sin él** | `vercel build` lo mete en `api/tours/[id].func/lib/tour-publish.js` |

**El tercero era el que importaba**: un import que compila pero no se despliega
rompe en producción y no en la prueba.

**No aplicó el precedente del `slugify` duplicado** (`api/tours/[id].ts:85`). Ese
se justifica porque si divergen el único efecto es un 404; acá divergir hace que
el panel muestre como publicable un tour que el servidor rechaza.

Al buscar copias aparecieron **cuatro**, una más de la esperada: el formulario
tenía sus propios 40, 80 y 300 escritos a mano en siete lugares.

### El aviso temprano: el problema no era la lentitud

José reportó que el interruptor "tardaba". **No tardaba: se contradecía.** Tiene
actualización optimista, así que al apretarlo se movía al instante y parecía que
había funcionado; un segundo después volvía solo y recién ahí aparecía el error.

El dato para decidirlo **ya estaba en el cliente**. Ahora la tarjeta lo calcula
con la misma condición del servidor y el interruptor nace apagado, con el motivo
visible debajo. La guarda del servidor se queda: es la que protege de verdad.

**El motivo va visible y no en un tooltip**, y eso corrigió la intuición inicial:
en un celular no hay hover, y el control es un interruptor de 44x24 sin etiqueta
donde no habría dónde colgarlo. Mismo criterio que el aviso de solicitudes
pendientes del formulario.

**La trampa que casi entra:** la tarjeta del panel llama `image` a la portada, no
`imageUrl`. El payload pasa por dos mapeos y **la descripción vuelve a su nombre
original pero la portada no**. Pasarle `t.imageUrl` habría dado `undefined` y el
aviso habría dicho "falta la foto" sobre tours que sí la tienen. Se evitó
leyendo la respuesta real del API con la sesión abierta antes de escribir la
condición. Anotado en `.claude/rules/frontend.md`.

También se le puso bandera de ocupado, que era **el único de los cuatro botones
del panel sin ella**. Sin eso, el segundo clic leía el estado que la
actualización optimista ya había cambiado y mandaba el cuerpo contrario: dos
peticiones opuestas, y ganaba la que respondiera última.

### El prerender que Vercel nunca corrió

**La tanda 5 estuvo rota en el deploy dos días sin que nadie lo notara.** El paso
de prerender se agregó al script `build` de `package.json` y se verificó
corriendo `npm run build` en local: 43 fichas, con su `noindex`. Todo verde.

**Pero `vercel.json` decía `"buildCommand": "vite build"`**, así que Vercel nunca
lo ejecutó. Los deploys salían con los meta tags genéricos.

| Comando | Fichas | `noindex` |
|---|---|---|
| `vite build` (lo que corría Vercel) | **0** | no |
| `npm run build` (lo que se verificó) | **43** | sí |

**La regla ya estaba escrita en `.claude/rules/api-y-schema.md` y no se aplicó**:
se verificó el build local en vez del comando que corre Vercel. Es la diferencia
entre medir el punto y medir un borde parecido. Hoy el `buildCommand` delega en
`npm run build`, así que el build queda definido en un solo lugar.

De paso salió que la meta description pegaba el gancho con la descripción sin
separador ("...en Pacífico norte Salida 7:30 AM..."). Medido sobre los 37 ganchos
activos: ninguno termina en puntuación, así que el punto siempre hace falta; la
guarda de no duplicarlo es para el gancho que se escriba mañana con punto.
