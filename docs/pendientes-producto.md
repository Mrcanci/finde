# Pendientes de producto

> **Lo que está abierto y por qué, con el razonamiento entero.** Salió de
> `docs/estado.md` el 2026-08-16 al podarlo: ahí quedó la lista corta con el
> puntero a este archivo.
>
> **Casi ninguno de estos es un bug.** Son huecos de producto y riesgos
> conocidos, con la decisión pendiente escrita al lado. Lo que está roto va en
> "Bugs abiertos" de `docs/estado.md`.
>
> **La excepción, y es una sola: el botón de atrás en el checkout.** Está listado
> en "Bugs abiertos" de `docs/estado.md`, como corresponde, y **el razonamiento
> entero vive acá** porque es el mismo archivo donde está el arreglo que lo cubre
> (la URL por paso). Partirlo en dos era garantizar que se leyera medio.

## RESUELTO el 2026-08-18: el SMTP de los correos de auth

**Resend quedó configurado y verificado como remitente de los correos de auth de
Supabase.** Era configuración, no desarrollo: Resend ya movía los correos
transaccionales con `RESEND_API_KEY` en los tres entornos, y lo que faltaba era
apuntar el SMTP de Supabase al mismo proveedor.

**Los dos límites, medidos, y el segundo es el que de verdad bloqueaba:**

| | Remitente por defecto de Supabase | Con SMTP propio |
|---|---|---|
| Ritmo | **2 correos por hora**, para todo el proyecto | **30 por hora**, ajustables |
| A quién entrega | **solo a direcciones de la organización** | a cualquiera |

**El tope de 2 por hora era incómodo; la restricción de destinatarios era
directamente un muro.** Se verificó con una invitación a un **Gmail**, que con el
remitente por defecto habría fallado con **"Email address not authorized"**. O
sea que con la configuración vieja no se podía dar de alta a un usuario real, ni
para probar.

### El presupuesto de correos es UNO SOLO, y hay que tenerlo presente

**El plan gratuito de Resend da 100 correos por día y 3.000 por mes.** Esos 100
**no son para auth**: se comparten con los correos transaccionales que la app ya
manda (confirmaciones de reserva, avisos de salida a la agencia y al viajero).

Con **dos correos por reserva**, el presupuesto diario da para algo como **30
reservas más 40 registros**. No es un problema hoy, pero es el número que hay que
mirar antes de encender cualquier cosa que multiplique los envíos, y el que dice
cuándo toca pasar a un plan pago.

### Lo que esto desbloquea

Las tres cosas que estaban atadas al mismo cambio y figuraban sueltas:

- **Reactivar "Confirm email"**, que sigue apagado (`mailer_autoconfirm: true` en
  `/auth/v1/settings`, medido el 2026-08-17).
- **La recuperación de contraseña.**
- **El código de 6 dígitos del modal de cuenta**, la alternativa natural a la
  contraseña.

**Desbloqueadas no quiere decir hechas.** Ver abajo por qué reactivar la
confirmación sigue siendo una decisión de producto, y ver el pendiente de las
plantillas en inglés, que conviene resolver en el mismo movimiento.

### El orden importa, y hoy no estaba escrito en ningún lado

**Mientras "Confirm email" siga apagado, el alta desde el modal de cuenta loguea
al instante y el viajero sigue reservando sin salir de la pantalla.** Eso es lo
que deja que el modal funcione con correo y contraseña.

**El día que se reactive, el alta deja de devolver sesión y el checkout se corta
ahí**, con la fecha y los cupos ya elegidos.

**El modal ya lo maneja, así que no va a romper en silencio.** `AuthForm` mira si
el alta devolvió sesión y, si no vino, muestra "Te enviamos un correo para
confirmar tu cuenta. Ábrelo y vuelve acá para continuar." en vez de avanzar el
checkout hacia un 401 tres pantallas después. **Lo que no hace es evitar el
corte**: el viajero igual tiene que salir al correo y volver.

> Reactivarlo sigue siendo una decisión de producto y no un interruptor: cambia
> el alta de "entras y sigues reservando" a "entras, sales al correo y vuelves".
> **El SMTP propio ya no lo bloquea** (resuelto el 2026-08-18): lo único que
> falta es tomar esa decisión, y traducir las plantillas antes de que esos
> textos se empiecen a ver.

## Las plantillas de correo: traducidas y pegadas, probada una de cuatro

**Estaban en inglés**, encontrado el 2026-08-18 probando el SMTP propio: la
invitación llegó diciendo **"You have been invited to create a user on..."**. Los
usuarios son peruanos y el resto del producto está en español, con el canon de
`CLAUDE.md`: segunda persona, español peruano, sin vocabulario ibérico y sin
rayas. Un correo de la plataforma en inglés rompía eso en el primer contacto con
la cuenta.

**Resuelto el mismo día: las cuatro están escritas, pegadas y guardadas** en
Authentication > Emails > Templates, en español y con la identidad de Finde. El
HTML de cada una vive en `docs/plantillas-correo-supabase.md`. Entre ellas está
la que faltaba en la lista original: **el código de 6 dígitos no tiene plantilla
propia, sale de "Magic Link"**.

### Lo que queda abierto es la VERIFICACIÓN, y no es lo mismo que estar pegadas

**Probada de verdad hay una sola.** Este es el estado real, plantilla por
plantilla:

| Plantilla | ¿Se puede disparar hoy? | Estado |
|---|---|---|
| **Invite user** | Sí, desde Auth > Users | **Probada en Gmail el 2026-08-18. Se ve bien.** |
| **Confirm sign up** | No: `mailer_autoconfirm` está en `true` | Pegada, **sin probar** |
| **Magic Link** (el código de 6 dígitos) | No: no hay flujo de OTP, nadie llama a `signInWithOtp` | Pegada, **sin probar** |
| **Reset password** | No: no hay flujo de recuperación, nadie llama a `resetPasswordForEmail` | Pegada, **sin probar** |

**Las tres sin probar no lo están por descuido: no se pueden mandar.** Cada una
necesita que exista su flujo, y ninguno de los tres existe todavía.

> **Regla, para que nadie las dé por buenas antes de tiempo: cada una de esas
> tres se verifica EN EL MOMENTO en que se implemente su flujo, no antes.**
> Reactivar `mailer_autoconfirm`, construir el OTP o construir la recuperación
> son las tres ocasiones, y el correo se abre y se mira como parte de esa tanda.
> Estar pegada no es estar probada.

**Y falta un eje entero, en las cuatro: solo se probó Gmail.** La advertencia al
escribirlas fue que el render no se podía verificar desde el repo, y sigue en
pie para **Outlook de Windows** (que usa el motor de Word y es el que rompe lo
que en todos los demás anda) y **Apple Mail**. Los detalles de qué se verificó
por lectura del HTML, y qué no, están arriba de todo en
`docs/plantillas-correo-supabase.md`.

## BUG DE UX: el botón de atrás rompe el checkout entero

**Encontrado el 2026-08-17, investigando la tanda 4. No es un hueco de analítica:
es una pantalla rota, y está en la que la tanda 3 acaba de estabilizar.**

**Qué pasa.** Los cuatro pasos del checkout viven en `BookingView` con el paso en
un `useState`, y **los cuatro comparten una sola URL**, `/demo/reservar/<tour>`.
La app deja una entrada de historial al entrar al checkout y ninguna más. Así
que el botón de atrás en el paso de pago no retrocede al paso anterior: **sale
del checkout completo** (el `popstate` de `AppDemo` lee la URL previa y monta la
ficha), y el formulario se pierde, con la fecha, los cupos y los datos ya
escritos.

**Por qué importa más de lo que suena.**

- **En móvil el gesto de volver es constante**, y ahí no es un botón que se
  aprieta por error: es el deslizamiento con el que la gente navega.
- **Cae justo donde el viajero ya invirtió trabajo.** Alguien que eligió fecha,
  puso sus cupos, creó la cuenta y llenó sus datos vuelve un paso y no le queda
  nada. Es la peor posición posible del embudo para perder a alguien.
- **Es de la misma familia que el formulario de tour que se pierde al navegar
  afuera** (más abajo en este archivo), pero **este es peor**: aquel le pasa a
  una agencia que puede volver a cargar, este le pasa a un viajero en el momento
  de comprar.

**El arreglo, y acá está lo bueno: es el mismo instrumento de medición.** Darle
URL propia a cada paso (`/cuenta`, `/datos`, `/pago`, `/listo`) hace que atrás
retroceda de a un paso, y **de paso destapa el único tramo del embudo que hoy no
se puede medir**. Un solo trabajo que cierra las dos cosas. El detalle del
instrumento, con su costo (cero bytes al cliente) y su riesgo (toca el checkout),
está en `docs/audits/2026-08-17-eventos-del-embudo.md`.

**Cuándo.** El audit recomienda hacerlo con el switch, porque antes no hay
tráfico que medir. **Este bug es un argumento para adelantarlo**: el viajero que
pierde el formulario no espera al lanzamiento, y MEGATOURS ya tiene sus cinco
tours públicos. Sin decidir.

## RESUELTO el 2026-08-19: la región del tour ya no se puede ensuciar

**Era el único riesgo de producto abierto de esta lista.** `Tour.region` estaba
sucio y el formulario lo podía volver a ensuciar. El campo Ubicación de texto
libre pasó a **ciudad + un selector de región** contra los 24 departamentos de
`lib/cities.js`, con la validación en `parseTourInput`, que **normaliza antes de
comparar**. Con eso el formulario deja de poder ensuciar la columna, que era la
mitad urgente.

**No hubo migración y no hace falta:** medido contra los 49 tours, **1 quedaría
rechazado y 0 activos**, y ese se corrige solo la próxima vez que alguien lo
edite. Se cae además el disparador que tenía: ya no hay ventana que se cierre con
el onboarding de la próxima agencia.

**Dos cosas que conviene no reabrir sin leer primero**: **Callao NO entra como
departamento 25** (el motivo de producto está escrito al lado de la lista, y este
archivo llegó a decir "son 25 y no 24"), y el **tercer parseo por coma**, el que
armaba el prompt de la IA, se cerró en la misma tanda. Detalle en
`docs/plans/2026-08-19-selector-de-region.md` y en `docs/decisiones.md`.

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

## La foto mensual de la analítica necesita un disparador

**Anotado el 2026-08-17 al cerrar la tanda 4. No implementado.**

**El problema tiene fecha de vencimiento y por eso está acá:** la ventana de
reporte de Vercel Web Analytics en el plan Hobby es de **un mes**. Lo que pasó
hace 40 días **no se puede consultar**, ni pagando después. Y las métricas de
embudo que Finde tiene que mostrar en 2027 no se reconstruyen: o se copiaron a
tiempo, o no existen.

**La foto en sí no cuesta nada** (un comando, JSON, cero código, cero bytes en el
cliente):

```bash
npx vercel metrics vercel.analytics_pageview.count \
  --group-by request_path --filter "environment eq 'production'" \
  --since 30d --granularity 1d --format json
```

**Lo que falta no es el comando, es el disparador.** Una tarea manual que hay que
acordarse cada mes no se hace. Lo evaluado:

| Dónde anclarla | Veredicto |
|---|---|
| Un cron de Vercel | **Descartado.** Cuesta una función serverless y hay 12 de 12 |
| El build | **No sirve.** El build no puede escribir en el repo |
| Recordatorio de calendario | Sirve de respaldo, pero depende de que la persona esté disponible |
| **Un renglón fechado en `docs/estado.md`** | **La propuesta.** No inventa un hábito: usa el que ya existe |

**La propuesta concreta.** Un renglón en `docs/estado.md` con la fecha de la
última foto, y las fotos guardadas en `docs/metricas/YYYY-MM.json`. **El
disparador es que `docs/estado.md` se lee entero al empezar cada tanda**, que es
regla de la casa y hoy se cumple: el que arranca ve la fecha vencida y corre el
comando en treinta segundos. La checklist del switch la arranca, el renglón la
sostiene.

**El límite honesto, escrito para que no sorprenda:** esto funciona mientras haya
tandas seguidas. Si después del lanzamiento pasa un mes sin abrir el repo, la
foto se pierde igual, y ahí el respaldo tiene que ser el recordatorio de
calendario.

**Antes del switch no hace falta**, y el motivo está medido en
`docs/audits/2026-08-17-eventos-del-embudo.md`: hoy la foto retrataría nuestro
propio QA.

## Pendientes de rendimiento

- **El bundle pasa los 500 kB y Vite lo avisa en cada build** (673 kB, 184 kB comprimido, en un solo chunk). No es urgente para el piloto, pero sí para el mercado real: Android de gama media sobre 4G peruano, con objetivo de LCP bajo 3 segundos. `src/AppDemo.jsx` son **7.278 líneas** (medidas el 2026-08-17; eran 6.277 el 2026-08-13) que hoy viajan enteras aunque el usuario solo abra el home. Candidato claro a code splitting por vista, que es como ya está organizado el archivo (el switch de `effectiveView`). Sin fecha ni tanda asignada.

  **Ojo con la prioridad, que las mediciones del 2026-08-16 dieron vuelta.** Este pendiente figuraba como el número uno de rendimiento y no lo era: las tandas 1B y 1C sacaron **11,8 MB** entre las dos, más de sesenta veces el bundle comprimido entero. **Lo que pesa son imágenes, no JavaScript.** **Las dos puntas del problema de imágenes ya están resueltas**: la landing (tanda 1C) y las que suben las agencias (procesamiento en el navegador). Con eso, el code splitting sí pasa a ser el próximo pendiente de rendimiento.

- **El botón "Panel de agencia" del perfil tarda 1 o 2 segundos.** Mientras
  `operatorResolved` es false, `ProfileView` muestra un esqueleto del mismo alto
  (la clase `.pf-op-skel`) y recién después aparece la card real.

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

## BACKLOG: entrar con Google

*(Anotado el 2026-08-18. No es para ahora, y el disparador está escrito abajo.)*

**Por qué vale la pena.** Airbnb lo tiene y le funciona por una razón que Finde
comparte: **su modal de cuenta aparece DESPUÉS de que el viajero eligió fecha y
personas**, igual que el nuestro desde la tanda 3. En ese punto el viajero ya
invirtió algo y la fricción de escribir una contraseña en un teclado de celular
es justo donde se cae. Un botón de Google saca esa fricción.

### La precondición YA ESTÁ RESUELTA (2026-08-19), y esto es lo que queda

**El borrador persistido del checkout se construyó en la tanda de recuperar
contraseña**, que tenía exactamente el mismo problema en chico: volver del correo
también es una carga completa de página. Está en `main`.

Hoy `BookingView` guarda `{ tourId, path, date, guests, step }` en `localStorage`
y lo restaura sembrando sus `useState`. Los datos personales no se guardan, a
propósito. **Cuando se retome este pendiente, esa parte ya no cuesta**: queda
comprobar que el borrador sobrevive también al redirect de `signInWithOAuth`, que
es el mismo camino que ya sobrevive a la vuelta del correo.

Lo que sigue explica **por qué** era precondición, y se deja escrito porque el
motivo no caduca aunque el trabajo esté hecho.

### Por qué era precondición, y sale de algo ya medido

**En la tanda 3 se midió que el redirect de `signInWithOAuth` desmonta la SPA
entera.** Y hasta el 2026-08-19 `BookingView` guardaba **todo** su estado en
`useState`, sin ninguna persistencia: la fecha, los cupos, el paso del formulario
y los cuatro campos del viajero.

**O sea que el viajero habría vuelto con sesión y sin nada de lo que había
elegido**, que es exactamente el corte que el modal vino a evitar. Poner el botón
sin resolver eso no mejoraba el embudo: lo empeoraba, porque cambiaba una
fricción visible (escribir una contraseña) por una invisible (perder lo que ya
habías cargado).

> **La precondición era: persistir un borrador antes del redirect y restaurarlo
> al volver, escrito y probado ANTES de que el botón exista. Hecho el
> 2026-08-19.**

### Lo que necesita fuera del código

Nada de esto es desarrollo, pero sin esto el botón no funciona:

1. **Credenciales en Google Cloud** (proyecto, pantalla de consentimiento, client
   ID y client secret).
2. **Tres URLs de retorno** en la lista blanca: `finde.pe`, `dev.finde.pe` y
   `localhost`. Si falta una, ese entorno queda roto y los otros dos no avisan.
3. **Habilitarlo en Supabase.** Hoy está apagado: `google: false`, medido contra
   `/auth/v1/settings` el 2026-08-18. De hecho **no hay ningún proveedor externo
   encendido**, solo email.

### El disparador

**Después del switch, cuando haya tráfico real para medir cuánta gente abandona
en el modal.** Hoy sería adivinar: la tanda 4 ya midió que en 30 días hubo 15
páginas vistas, todas del QA propio. Con ese volumen no se puede saber si el
modal es un problema o no, y el botón de Google es trabajo que se justifica con
un número, no con una intuición.

## Huecos de producto

- **PREGUNTA ABIERTA: el catálogo en escritorio usa 1000px de 1440, y eso es lo
  que limita las columnas.** *(Anotada el 2026-08-18, sin resolver.)*

  Medido a 1440: la grilla `.tg` vive en un contenedor de **1000px** con cuatro
  tarjetas de 232px. Airbnb muestra **ocho** por fila porque usa el ancho
  completo de la ventana con tarjetas de 180px. GetYourGuide muestra **cuatro**,
  igual que Finde, con tarjetas de 284px.

  **Esto salió al descartar otra cosa, y conviene no confundirlas.** La pregunta
  original era si sacar la caja blanca de las tarjetas daba más columnas: **no,
  libera 2px** (ver la decisión del 2026-08-18 en `docs/decisiones.md`). Lo que
  decide cuántas entran es este contenedor.

  **Por qué es más barata que aquella:** es un `max-width`, no toca el diseño de
  la tarjeta, no toca el hover ni el contraste, y se revierte cambiando un
  número. **Lo que hay que decidir no es técnico sino de producto:** si el
  catálogo en escritorio quiere mostrar más opciones por pantalla (Airbnb) o
  tarjetas más grandes con mejores fotos (GetYourGuide). **Las dos son
  defendibles y por eso no se resuelve acá.**

  Al resolverlo, medir antes: el ancho del contenedor también gobierna el resto
  de las vistas, no solo el catálogo.


- **El autocompletado de Chrome deja el botón de entrar en gris.** Chrome
  rellena el correo y la contraseña, se ven escritos en pantalla, y el botón
  sigue deshabilitado hasta que el usuario toca una tecla en alguno de los dos
  campos. Es el desencuentro clásico entre el autofill del navegador y el estado
  de React: el `onChange` no llega, así que `canSubmit` sigue en falso mientras
  los campos se ven llenos.

  **Es preexistente, no lo trajo el modal de cuenta**, y estaba en la pantalla de
  login desde M1. **Pero sube de prioridad**, y ese es el motivo de anotarlo
  ahora: desde la tanda 3 el mismo formulario aparece dentro del checkout, así
  que ahora está en el camino de una reserva. Alguien que ya eligió fecha y
  cupos ve sus datos puestos y un botón que no responde, y la lectura natural es
  que Finde está roto.

  **No se arregla acá.** Queda anotado con su síntoma para que la tanda que lo
  tome sepa qué está buscando, porque desde afuera parece un bug de validación y
  no lo es.

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
  ese modo no hace nada: los dos tours CUPO_FIJO de la base ("prueba" y
  "Ventanillas de Otuzco", recontados el 2026-08-17) los tienen en NULL, y además
  **están los dos pausados**, o sea que hoy ni siquiera se nota.

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

  **El riesgo de color que este pendiente traía ya no existe, y esto se actualizó el 2026-08-17.** Decía que ese `h1` heredaba `--text-h` del bloque `.app-demo` de `index.css` y saldría casi blanco en modo oscuro, como los dos títulos invisibles que se arreglaron en `c171347` y `e818d8e`. **La Fase 4 eliminó ese bloque y con él la variable**, así que la trampa se desactivó sola, tal como estaba previsto. Hoy `index.css` son 20 líneas y no gobierna nada del demo: ver `.claude/rules/frontend.md`.

  Lo que queda al retomarlo es lo normal de cualquier elemento nuevo: **decidirle un color explícito en `.app`** en vez de confiar en lo que herede. Ver `docs/plans/2026-08-13-plan-tipografia.md` y `docs/historia/2026-08-tipografia.md`.

## Deuda de raíz: el objeto del panel se arma en CUATRO lugares sin compartir código

**Anotado el 2026-08-18 con tres casos, actualizado el 2026-08-19 con el
cuarto.** No es prolijidad: **son cuatro defectos, uno por cada lugar donde el
objeto se arma a mano**, y cada uno se arregló solo en el lugar donde apareció.

### La forma

La tarjeta del panel de la agencia (`opTours`) es un objeto de **30 campos** que
se construye en cuatro lugares distintos de `src/AppDemo.jsx`, **cada uno
enumerando los campos a mano y ninguno compartiendo código con los otros**:

| Dónde | Cómo arma el objeto | Qué pasa si falta un campo |
|---|---|---|
| `mapTourFromApi` | lista blanca de lo que llega del API. **Está antes que los otros tres** | el campo llega `undefined` y un `?? 0` río abajo lo vuelve creíble |
| `loadOperatorTours` | de cero, sobre lo que devolvió el mapeo anterior. **Es la forma canónica del panel** | el campo no existe nunca, aunque el API lo mande |
| `handleSaveTour` | campo por campo **sobre `...t`** | **conserva el valor VIEJO**, que parece un dato |
| `handleCreateTour` | **de cero**, sin heredar | queda en `undefined`, y un `?? 0` río abajo lo vuelve creíble |

**Las dos formas de fallar son distintas y las dos son silenciosas.** Ni el
compilador ni el linter pueden ver el problema: no falta una propiedad de un
tipo, falta una línea en un objeto literal.

### Los cuatro casos que ya costó

| # | Campo | Dónde se perdió | Qué se vio |
|---|---|---|---|
| 1 | `pendingRequests` | la lista blanca de `mapTourFromApi` | el API devolvía 2 solicitudes vigentes, el `?? 0` del consumidor lo convertía en un 0 creíble, **la opción de confirmación automática nunca se deshabilitaba** y el error reaparecía al guardar, que era justo lo que el cambio venía a evitar |
| 2 | `shortPitch` | `handleSaveTour` | **el bug del 2026-08-18.** El gancho se guardaba bien en la base (67 caracteres, comprobado), y el panel seguía diciendo "falta la frase de gancho" y **bloqueaba el botón de publicar**. La descripción no fallaba solo porque sí estaba enumerada |
| 3 | `shortPitch` y `pendingRequests` | `handleCreateTour` | latente, encontrado revisando el caso 2. No se veía **por casualidad**: un tour recién creado nace activo y el aviso solo se muestra en pausados |
| 4 | `city` y `region` | `loadOperatorTours` | **el caso del 2026-08-19**, en el selector de región. `mapTourFromApi` ya las traía desde la tanda de geolocalización y el segundo mapeo del panel las descartaba: la precarga del editor llegaba vacía y **guardar pisaba la región del tour con nada**, sin un solo error de por medio |

**El caso 2 es el que mejor muestra el costo:** el dato estaba bien guardado, el
endpoint lo devolvía y los dos mapeos lo enumeraban. Se perdía en un cuarto
eslabón que nadie mira, **el estado local que se actualiza después de guardar**.

### Qué se hizo el 2026-08-18, y qué NO

Se agregó el campo en los dos lugares **y se recargó la lista después de
guardar** (`loadOperatorTours()` sin `await`, detrás de la navegación, como ya
hacía `loadDepartures`). La recarga **no es lo que arregla el bug**: el merge
local ya deja la tarjeta correcta. Es la red para el próximo campo.

Costo medido antes de aceptarla, contra dev.finde.pe: el piso de la función son
**243 ms** y la versión pesada del mismo query (los 42 tours públicos, 66 kB)
tarda **1.284 ms**; el panel son 5 tours y 18 kB. **Como no se espera, el costo
percibido al guardar es cero.**

**Lo que NO se hizo es el arreglo de raíz**, y es este pendiente: **extraer una
sola función que arme el objeto del panel** y usarla en los cuatro lugares, de
modo que agregar un campo sea una línea en un lugar y no cuatro en cuatro.

### Por qué no se hizo en el momento

Toca los cuatro caminos a la vez (lo que llega del API, cargar, guardar y crear),
y todos necesitan QA propio con una cuenta de agencia: crear un tour, editarlo,
pausarlo y publicarlo. El arreglo del bug se verifica en dos minutos; este no.

**Ese disparador ya sonó, y no se extrajo la función.** El 2026-08-19 el
selector de región agregó `city` y `region`, o sea el próximo campo del panel, y
hubo que escribirlas **en los cuatro lugares a mano**: en tres entraron y en el
cuarto se olvidaron, que es el caso 4 de la tabla. **La regla de "se extrae en el
viaje del próximo campo" ya falló una vez**, así que si no se hace sola, la
próxima vez va a fallar igual. Y **la recarga tras guardar tapa el síntoma**
solo del camino de guardar: no cubrió nada de esto.

**Nota de alcance:** hoy la recarga corre después de guardar, no después de
crear. Crear es el camino que arma el objeto desde cero, o sea el más frágil de
los tres, así que al extraer la función conviene cubrir los dos.

## Pendientes menores

No justifican tocar nada por sí solos.

- `src/Landing.jsx:575` tiene un comentario que nombra `App.css`, archivo borrado en `c96bd05` por ser código muerto sin importar. El comentario quedó desactualizado. `Landing.jsx` es archivo protegido, así que **no se toca por esto**: corregirlo cuando haya un motivo real para editar la landing y aprovechar el viaje.

## Cerrados y verificados, NO reabrir

- Gate de `operatorResolved` en `ProfileView` y `TopNav`: cerrado en `9a928c2`. Ambos lo consumen hoy.
- `/api/me` corriendo el vencimiento perezoso en el camino de identidad: cerrado en `4e81cb0` con el `?scope=operator`.
