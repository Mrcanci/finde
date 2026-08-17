# La analítica y los endpoints de IA

> **Historia, no estado.** Es el registro de trabajo **ya cerrado y en `main`**.
> Se archivó acá el 2026-08-16 al podar `docs/estado.md`, que había llegado a
> 1.767 líneas y se leía entero al empezar cada sesión.
>
> **El estado actual del proyecto vive en `docs/estado.md`.** Este archivo se lee
> solo cuando hace falta reconstruir por qué algo se hizo como se hizo.

### Tanda 0, CERRADA: los endpoints de IA exigen agencia

**En `main` desde el 2026-08-15 (`6e6fb83`), post-QA.** José lo validó en
dev.finde.pe: el generador funciona con sesión, y sin sesión responde 401.

`POST /api/ai/generate-description` y `POST /api/ai/generate-quechua` no pedían
sesión. Son **llamadas pagas a la API de Claude** y su única defensa era el rate
limit de 10 por minuto por IP, o sea un costo variable abierto a internet.

Los dos pasan por `requireOperator`. Se verificó que ningún llamador queda afuera:

- `generate-description` tiene **un solo llamador**, el paso 4 de `NewTourView`
  (`src/AppDemo.jsx`), que ya vive detrás del panel. Ese llamador usaba `fetch`
  pelado y pasó a `authFetch`: **sin ese tercer cambio la guarda rompía el
  botón**, porque no viajaba el header `Authorization`.
- `generate-quechua` **no tiene ningún llamador**. El toggle QU de la ficha pasó
  a leer las columnas persistidas, y `scripts/backfill-quechua.ts` le pega
  directo a Anthropic sin pasar por el endpoint. Ver abajo: es el slot designado
  a liberar.

El 403 del backend dice "Requiere perfil de operador", vocabulario interno que no
existe en la interfaz. El frontend lo traduce: 401 es "Tu sesión venció" y 403 es
"Necesitas un perfil de agencia para usar el generador".

### Tanda 1, REDUCIDA a Vercel Analytics (decisión de José, 2026-08-15)

**La tanda 1 se redujo a instalar Vercel Web Analytics. Nada más.** Decisión de
José: **la experiencia de usuario va primero y no se suma peso sin certeza de que
valga la pena.**

**PostHog se pospone, no se descarta.** El motivo no es solo el peso: **hoy no
mediría nada útil.** Los eventos que lo justifican (dónde se cae la gente en el
checkout) dependen del modal de cuenta, que es la **tanda 3**. Instalarlo ahora
sería cargar peso para leer un dashboard vacío.

**Queda como decisión pendiente, a tomar antes del switch**, con la app ya
terminada y **con la línea base de esta tanda como referencia**. El criterio para
aceptarlo o rechazarlo se fija en ese momento, con números reales, no ahora.

**Si PostHog no entra, la alternativa es armar los embudos con consultas a la
base**: más trabajo de nuestro lado, **cero peso en el cliente**. No es un plan B
degradado, es un intercambio distinto.

**Lo que Vercel Analytics sí da, y alcanza para varias de las métricas:**
visitantes, páginas vistas y **origen del tráfico**. Ese último es el que **prueba
que Google y WhatsApp traen gente**, que es exactamente el argumento del canal
barato. Lo que no da es el embudo interno del checkout.

#### Línea base medida, contra la que se evalúa PostHog después

Medido el 2026-08-15 con Lighthouse 12.8.2, preset **mobile**: 1638 Kbps de
bajada, 150 ms de RTT y **CPU 4x más lenta** (4G y gama media). Cinco corridas por
lado sobre `npm run build` servido con `vite preview`; se reportan **medianas de
las corridas válidas**, porque una de cada cinco falla con `NO_FCP`.

| Métrica | Antes | Después | Delta |
|---|---|---|---|
| Bundle JS (gzip) | 183.19 kB | 184.23 kB | **+1.04 kB** |
| Bytes transferidos | 6.527.044 | 6.528.216 | **+1.172 bytes** |
| LCP (mediana) | 6.728 ms | 6.916 ms | +188 ms |
| TTI (mediana) | 7.032 ms | 7.231 ms | +199 ms |
| Total Blocking Time | 0 ms | 0 ms | **sin cambio** |

**Los deltas de LCP y TTI están DENTRO del ruido de medición y no se pueden
atribuir al cambio.** Solo del lado "antes", el LCP osciló entre 6.313 y 6.836 ms,
o sea **523 ms de dispersión entre corridas**: más del doble que el delta. Lo que
sí es exacto y reproducible es el peso: **+1,04 kB comprimidos y cero tiempo de
bloqueo del hilo principal.**

A eso hay que sumarle **el script que sirve Vercel en runtime**, que no está en el
bundle y por eso no aparece arriba: **2.495 bytes, 1.271 comprimidos**, medidos
contra un despliegue real de Vercel. En local ese pedido da 404 y no pasa nada.

**Total honesto del costo de esta tanda: unos 2,3 kB comprimidos y cero bloqueo.**

**La ficha de tour no se pudo medir por separado, y esa imposibilidad ES el
hallazgo:** hoy no es una carga de página, es un cambio de `useState`, así que no
tiene URL y Lighthouse no la puede abrir. Es justo lo que resuelve la tanda 2.
Hasta entonces, lo medible es cuánto agrega en red: las portadas reales del
catálogo público pesan **entre 94 kB y 977 kB, con mediana de 276 kB**, y una
ficha con galería de tres fotos ronda los **800 kB**.

#### Hallazgo grande que salió de medir: se arregló en la tanda 1B

**Abrir `/demo` descargaba 6,1 MB de imágenes de la landing que el usuario nunca
ve**, el 96% del peso de la carga. Está **arreglado**, ver la tanda 1B más abajo.

La causa estaba en `src/App.jsx`: `showDemo` arrancaba en `false` y se corregía
dentro de un `useEffect`, o sea **después del primer render**. En ese render se
montaba `<Landing />`, el navegador disparaba la descarga de sus imágenes, y un
instante después React la desmontaba. Las imágenes ya habían salido.

**ESLint lo venía marcando** con `react-hooks/set-state-in-effect` en
`src/App.jsx:13`, sin que nadie atara el warning a su consecuencia.

### La analítica va primera, pero su fecha límite real es el SWITCH

**Precisión que evita esperar datos que todavía no van a existir.** Hoy no hay
**nada** instrumentado: ni Plausible, ni GA, ni PostHog, ni `@vercel/analytics`,
ni un helper propio. Verificado contra `src/`, `api/`, `index.html`, `vercel.json`
y `package.json`.

Va primera en la secuencia por dos razones, y ninguna es que vaya a dar números
ya: **es barata** (cero funciones serverless, es script de cliente) y **no se
recupera hacia atrás** (el visitante que no se contó no se cuenta después).

**Pero mientras el producto viva en `/demo` con el gate de login, no va a contar
casi nada.** El tráfico de hoy es José, el equipo y quien recibe el link a mano.
Los números recién empiezan a significar algo cuando la navegación esté abierta
(tanda 3) y sobre todo cuando la raíz sea el producto (tanda 6).

**Su fecha límite real es el switch, no hoy.** Se instrumenta antes para que el
día uno esté contando, no para leer el dashboard esta semana. Si alguien mira los
números antes del switch y los ve planos, **eso es lo esperado y no es un fallo de
la instrumentación.**

Vale aparte: la mitad de las métricas que hay que demostrar **ya se pueden contar
hoy desde la base**, sin instrumentar nada. Reservas confirmadas, GMV, agencias
verificadas y % fuera del eje Lima-Cusco salen de una consulta a `Booking`,
`Operator` y `Tour`; las búsquedas ya viven en `SearchLog`. Lo que falta
instrumentar es **solo el top of funnel**: visitantes, vistas de ficha y reservas
iniciadas.

#### Qué recolecta Vercel Analytics, y qué dice la Ley 29733

Verificado contra la documentación oficial de Vercel el 2026-08-15, no de memoria.

**No guarda IP ni nada identificable.** Sin cookies de terceros. Al visitante lo
identifica con un **hash del request entrante**, y **la sesión se descarta a las
24 horas**. No permite reconstruir la navegación de una persona entre sitios ni
identificarla.

Los diez datos que guarda por evento: momento, URL, ruta dinámica, referrer,
query params filtrados, geolocalización (país, región, ciudad), sistema operativo
y versión, navegador y versión, tipo de dispositivo, y versión del script.

**Conclusión: nada de esto es dato personal bajo la Ley 29733, y puede ir a
producción.** La geolocalización es a nivel ciudad y viene desagregada de
cualquier identificador.

**Pero hay un riesgo a futuro, y es nuestro, no de Vercel: la URL se guarda.**
Hoy no importa porque la app no tiene URLs. **Desde la tanda 2 sí las va a
tener**, y ahí hay que mirar dos casos antes de que salgan:

- `/mis-reservas/:code` llevaría el código de reserva (`FND-XXXXXX`) a los
  servidores de Vercel.
- Cualquier query param que se agregue después.

**El instrumento existe y es la función `beforeSend` del propio paquete**, que
deja reescribir o descartar la URL antes de enviarla. **Es trabajo de la tanda 2,
no de esta**, pero se decide ahí y no cuando ya esté publicado.

Un detalle operativo para el QA: la versión 2 del paquete usa **Resilient
Intake**, que arma la URL del script con una semilla generada en build. En un
proyecto con `framework: null` como este hay que **confirmar que el pedido del
script responde 200 y no 404**, porque de eso depende que se registre algo.
También hay que **activar Web Analytics en el dashboard de Vercel**: sin ese
interruptor el paquete no reporta nada.
