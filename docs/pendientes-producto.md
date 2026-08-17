# Pendientes de producto

> **Lo que está abierto y por qué, con el razonamiento entero.** Salió de
> `docs/estado.md` el 2026-08-16 al podarlo: ahí quedó la lista corta con el
> puntero a este archivo.
>
> **Ninguno de estos es un bug.** Son huecos de producto y riesgos conocidos, con
> la decisión pendiente escrita al lado. Lo que está roto va en "Bugs abiertos"
> de `docs/estado.md`.

## Pendiente de lanzamiento: el SMTP de los correos de auth

**Conectar Resend como SMTP propio en Supabase.** Hoy Custom SMTP está
**apagado**, así que los correos de autenticación salen por el remitente por
defecto de Supabase, que en el plan Free tiene un tope bajo por hora. **Sirve
para probar, no para operar.**

**No es una mejora, es un pendiente de lanzamiento**, y el motivo es que hay
tres cosas atadas al mismo cambio que hoy figuran sueltas:

- **Reactivar "Confirm email"**, que hoy está apagado (`mailer_autoconfirm: true`
  en `/auth/v1/settings`, medido el 2026-08-17). Cada registro pasa a mandar un
  correo por ese remitente.
- **El código de 6 dígitos del modal de cuenta**, que es la alternativa natural a
  la contraseña y manda un correo por cada intento de entrar.
- **Cualquier recuperación de contraseña**, que también sale por ahí.

**Es configuración, no desarrollo.** Resend ya está andando para los correos
transaccionales, con `RESEND_API_KEY` cargada en los tres entornos: lo que falta
es apuntar el SMTP de Supabase al mismo proveedor.

### El orden importa, y hoy no estaba escrito en ningún lado

**Mientras "Confirm email" siga apagado, el alta desde el modal de cuenta loguea
al instante y el viajero sigue reservando sin salir de la pantalla.** Eso es lo
que deja que el modal de la tanda 3 funcione con correo y contraseña.

**El día que se reactive, ese camino se rompe**, salvo que el modal maneje el
estado "revisa tu correo": el viajero crearía la cuenta, no quedaría logueado, y
el checkout se cortaría justo ahí, con la fecha y los cupos ya elegidos.

> **Reactivar "Confirm email" sin tocar el modal rompe el checkout.** No es un
> efecto lateral a vigilar, es la consecuencia directa, y por eso los dos ítems
> van juntos o no van.

## Riesgos de producto

No son bugs: no hay nada roto.

- **Las traducciones al quechua las escribe un modelo y nadie del equipo las valida.**

  El síntoma que encontramos es medible: el generador **agrega em-dashes que no están en el original**. Contado sobre los 49 tours de la base el 2026-08-14: **52 rayas en `descQu` contra 35 en `description`**, y hay tours con 3 o 4 en quechua y **cero** en español (Tambomachay, Pachacamac, Sacsayhuamán, Iquitos). No las está copiando, las está inventando.

  La causa es concreta y está en el código: los `SYSTEM_PROMPT` de `api/ai/generate-quechua.ts` y `api/ai/generate-description.ts` **contienen em-dashes ellos mismos** (2 y 3 respectivamente) y **no prohíben la raya**. El único prompt que sí la prohíbe es `api/search-reasoning.ts:63`. El modelo imita sus propias instrucciones.

  **Pero las rayas son lo de menos: son solo lo que encontramos porque lo buscábamos.** Lo que no sabemos es qué más está inventando el modelo en un idioma que nadie del equipo lee. Si imita el formato de sus instrucciones, no hay razón para suponer que no invente también contenido.

  **Hoy no llega a ningún usuario**, porque la capa de display de quechua no existe: las columnas `titleQu`, `descQu`, etc. se llenan pero no se muestran. Eso es lo que lo mantiene como riesgo y no como incidente.

  **Antes de mostrar quechua en el producto, alguien que lo hable tiene que leer una muestra de las traducciones.** No es opcional: el quechua es una promesa de marca de Finde, y publicar traducciones sin revisar de un idioma que el equipo no habla es exactamente la forma de romperla sin enterarse. Sin fecha ni tanda asignada.

  La canilla se cierra aparte, en `fix/prompts-sin-raya`. Eso arregla las rayas futuras, no la validación de fondo ni las 88 que ya están en la base.

## El deploy hook del prerender

**Anotado, NO implementado.** El disparador es explícito:

> **Cuando entre la SEGUNDA agencia real que cargue tours.**

**Por qué no ahora.** El prerender solo corre en deploy, así que un tour nuevo no
tiene tarjeta de WhatsApp hasta el próximo build. Pero hoy la única agencia que
carga tours es MEGATOURS y sus cinco fichas ya están prerenderizadas: conectar el
hook ahora es **infraestructura sin usuario**.

**Por qué cambió respecto de lo que se había decidido antes.** El 2026-08-16 se
resolvió "aceptar el retraso hasta el lanzamiento", y era correcto **porque el
retraso no tenía consecuencia visible**. Ahora sí la tiene: sin build, un tour
nuevo se comparte sin tarjeta.

**Cómo se haría.** Un `POST` saliente al deploy hook de Vercel desde los handlers
que ya existen (`POST` y `PUT /api/tours`), vía `waitUntil` para que quede fuera
del camino crítico. **Cuesta cero funciones serverless.**

**La ventana de agrupación es parte del diseño, no un detalle.** Una agencia que
edita un tour cinco veces dispararía cinco builds, y **Vercel Hobby limita los
despliegues por día**. Hay que mirar ese número antes de conectarlo y agrupar los
disparos en una ventana de varios minutos. Sin eso, el hook se convierte en una
forma de agotar la cuota de deploys de la cuenta.

**Cuánto cuesta el prerender en el build**, medido en local el 2026-08-16:
`prisma generate` 1,6 s, `vite build` 0,8 s y el prerender **3,0 s**, de los
cuales 1,5 son la consulta de los 42 tours. **No pude medir los tiempos reales de
Vercel**: su API responde 403 con las credenciales de esta sesión.

## Pendientes de rendimiento

- **El bundle pasa los 500 kB y Vite lo avisa en cada build** (673 kB, 184 kB comprimido, en un solo chunk). No es urgente para el piloto, pero sí para el mercado real: Android de gama media sobre 4G peruano, con objetivo de LCP bajo 3 segundos. `src/AppDemo.jsx` son más de 6200 líneas que hoy viajan enteras aunque el usuario solo abra el home. Candidato claro a code splitting por vista, que es como ya está organizado el archivo (el switch de `effectiveView`). Sin fecha ni tanda asignada.

  **Ojo con la prioridad, que las mediciones del 2026-08-16 dieron vuelta.** Este pendiente figuraba como el número uno de rendimiento y no lo era: las tandas 1B y 1C sacaron **11,8 MB** entre las dos, más de sesenta veces el bundle comprimido entero. **Lo que pesa son imágenes, no JavaScript.** **Las dos puntas del problema de imágenes ya están resueltas**: la landing (tanda 1C) y las que suben las agencias (procesamiento en el navegador). Con eso, el code splitting sí pasa a ser el próximo pendiente de rendimiento.

- **El botón "Panel de agencia" del perfil tarda 1 o 2 segundos.** Mientras
  `operatorResolved` es false, `ProfileView` muestra un esqueleto del mismo alto
  (`AppDemo.jsx:3958`) y recién después aparece la card real.

  **Esto NO es el mismo problema que el interruptor de activar un tour, aunque se
  vean igual, y la diferencia decide el arreglo:**

  | | De dónde sale el dato | La espera |
  |---|---|---|
  | Interruptor de activar | ya está en el cliente, en la tarjeta del panel | **sobra**: se decide local |
  | Botón "Panel de agencia" | de `/api/me?scope=operator`, un viaje al servidor | **es real**: el cliente todavía no sabe si la cuenta es agencia |

  Por eso no hay una solución que sirva para los dos. **Y el esqueleto actual no
  es un parche, es lo correcto**: mostrar `isOperator=false` antes de tiempo le
  dice a una agencia existente "¿Ofreces tours? Activa tu perfil de agencia".
  Eso ya pasó y está documentado en `.claude/rules/frontend.md`.

  **El único arreglo que quitaría el segundo es recordar la última respuesta**
  (localStorage) para usarla como valor inicial y revalidar por detrás.

  **Su costo, que es el motivo de no hacerlo de paso:** toca `AuthContext`, que
  tiene tres guardas de concurrencia que hoy funcionan (`opSeq` latest-wins,
  `opInFlight` dedupe, `opUserId` dueño del estado). Y el riesgo concreto es
  **mostrarle a un usuario el estado de otra cuenta**: un valor cacheado que se
  pinta antes de saber quién es el usuario actual es exactamente el bug que
  `opUserId` existe para evitar. Un estado falso que parece legítimo es peor que
  esperar, que es la misma razón por la que se puso el esqueleto.

  **Tanda aparte, con su propia verificación de cambio de cuenta.** Sin fecha.

## Huecos de producto

- **El formulario de tour se pierde entero, sin aviso, al navegar afuera.** El
  estado vive en un `useState` de `NewTourView`: no hay `localStorage`, no hay
  `sessionStorage`, no hay `beforeunload` y no hay diálogo de confirmación. Salir
  de la vista desmonta el componente y se va todo lo editado.

  **No lo trajo ninguna tanda reciente: pasa hoy con el botón de atrás, con la
  barra inferior y con cualquier navegación.** Se documenta ahora porque el aviso
  de solicitudes pendientes del paso de disponibilidad invita a ir a Reservas, y
  ahí se vuelve visible.

  **La salida es un diálogo de confirmación al abandonar con ediciones sin
  guardar**, y se elige justamente porque **protege todos los caminos de salida y
  no solo ese**. Descartadas por ahora, con su motivo:

  - **Borrador en `localStorage`:** más superficie de la que parece. Hay que
    decidir cuándo se descarta, qué pasa con las fotos ya subidas y qué gana si
    el tour se editó desde otro lado en el medio.
  - **Resolver las solicitudes desde el propio formulario:** mete decisiones que
    **mandan correos irreversibles** dentro de una pantalla de edición, donde no
    existe el patrón de dos pasos de confirmación que el panel sí tiene.

- **Fotos huérfanas en Supabase Storage: es deuda CON COSTO, no cosmética.**
  `uploadOnePhoto` sube el archivo al bucket **cuando la agencia lo elige**, no
  cuando guarda el tour (es el flujo de signed URL, que evita el límite de tamaño
  de request de Vercel y por eso no se va a cambiar a la ligera).

  Consecuencia: **cada formulario abandonado a mitad deja archivos en el bucket
  que ningún tour referencia y que nadie borra nunca.** El borrado de fotos solo
  ocurre al borrar un tour (`DELETE /api/tours/:id` limpia `imageUrl` e
  `images[]`), así que una foto que nunca llegó a asociarse a un tour no entra
  por ningún camino de limpieza.

  Hoy son pocas. **Con agencias reales subiendo fotos y abandonando a mitad crece
  sin techo**, y el almacenamiento se paga.

  **Pregunta abierta, sin decidir:** ¿se limpia con un barrido periódico que
  compare el bucket contra las URLs referenciadas, o se cambia el flujo para
  subir recién al guardar? Lo primero no toca el flujo probado pero necesita un
  job que hoy no existe; lo segundo elimina el problema de raíz pero cambia la
  experiencia de carga y hay que revisar que siga esquivando el límite de Vercel.

- **Una salida que pasa con solicitudes sin decidir deja al viajero colgado, y
  hoy no hay forma de cerrarla.** El panel no ofrece confirmar ni rechazar en
  salidas pasadas (`!esPasada` en el render de cada salida), así que si la
  agencia no decide a tiempo, esa solicitud ya no se puede resolver. El barrido
  perezoso la vence **en silencio**: nadie le avisa al viajero, que se queda
  esperando una respuesta que no va a llegar.

  **No es un bug: es un hueco de producto.** Hoy no duele porque las 19 que están
  en esa situación son datos de prueba. **Con MEGATOURS operando de verdad sí
  duele**, porque el que espera es un viajero real que reservó y nunca supo qué
  pasó.

  Dos cosas a resolver cuando toque, y son independientes:
  1. **Que el vencimiento le avise al viajero.** Hoy `expireStaleSolicitudes` no
     manda nada; la doc de la migración ya tenía anotado el aviso automático como
     upgrade con `pg_cron`.
  2. **Que el panel permita cerrar salidas pasadas.** El backend ya lo acepta
     (solo bloquea `CANCELADA`); lo que falta es la acción en la interfaz.

- **El cierre de venta (`closeTime` / `closeDaysBefore`) no se evalúa en
  CUPO_FIJO.** `api/bookings.ts` solo lo mira `if (tour.salesMode === "SOLICITUD")`,
  así que un tour de cupo fijo vende hasta la víspera y no tiene forma de cortar
  antes. El campo existe en el schema y la agencia lo puede configurar, pero en
  ese modo no hace nada: el único tour CUPO_FIJO de la base ("prueba") los tiene
  los dos en NULL, o sea que ni siquiera se nota.

  **El cupo sigue siendo el freno de integridad** (nunca se vende más de lo que
  entra) y eso funciona. **Lo que falta es el freno operativo**: que la agencia
  pueda dejar de recibir reservas con antelación aunque queden asientos, porque
  a cierta hora ya cerró la lista con el transportista. Salió al arreglar el bug
  de la salida confirmada, y se decidió **anotarlo y no arreglarlo ahí**: es
  alcance nuevo, no parte del bug.

  **Subordinado a la decisión del 2026-08-15** (`docs/decisiones.md`): el corte
  de la etapa piloto es la medianoche previa a la salida, que es lo que CUPO_FIJO
  ya hace. Este pendiente **no se toca hasta que una agencia real pida cortar
  antes**. El instrumento ya existe y es por tour; lo que faltaría es evaluarlo
  también en ese modo.

- **El título del tour en desktop, fuera del hero.** `src/AppDemo.jsx` tiene un `<h1 class="det-tl-desktop">` con el nombre del tour que hoy computa `display:none` en todos los anchos, de 390 a 1600. **No es marcado muerto: es una intención abandonada.** La idea era el patrón de Airbnb, con el título del tour arriba y afuera de la foto en desktop, en vez de superpuesto al hero como está hoy (`.det-tl`). Quedó a medio camino: el marcado existe, el CSS que lo mostraría no. **Es trabajo del rediseño de la ficha de tour, no algo para borrar.**

  Ojo con un detalle al retomarlo: ese `h1` hoy no declara color propio y hereda `--text-h` del bloque `.app-demo` de `index.css`, o sea que en modo oscuro saldría casi blanco. Es el mismo patrón de los dos títulos invisibles ya arreglados (`c171347`, `e818d8e`). **No hay que arreglarlo antes: la Fase 4 del plan tipográfico lo desactiva sola** al eliminar el bloque y con él la variable. Ver `docs/plans/2026-08-13-plan-tipografia.md`.

## Pendientes menores

No justifican tocar nada por sí solos.

- `src/Landing.jsx:575` tiene un comentario que nombra `App.css`, archivo borrado en `c96bd05` por ser código muerto sin importar. El comentario quedó desactualizado. `Landing.jsx` es archivo protegido, así que **no se toca por esto**: corregirlo cuando haya un motivo real para editar la landing y aprovechar el viaje.

## Cerrados y verificados, NO reabrir

- Gate de `operatorResolved` en `ProfileView` y `TopNav`: cerrado en `9a928c2`. Ambos lo consumen hoy (`AppDemo.jsx:3744` y `:1865`).
- `/api/me` corriendo el vencimiento perezoso en el camino de identidad: cerrado en `4e81cb0` con el `?scope=operator`.
