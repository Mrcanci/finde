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
> Por eso va después del SMTP propio, no antes.

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

## Riesgos de producto

No son bugs: no hay nada roto.

- **`Tour.region` está sucio, y el formulario lo puede volver a ensuciar. Se
  calcula mal una métrica que hay que presentar.**

  **La consecuencia primero:** "% de demanda fuera del eje Lima-Cusco" es una de
  las métricas que pide Creatividad Empresarial 2027, y **hoy sale mal**, porque
  Lima está partida en tres regiones distintas que no se suman entre sí.

  **Medido el 2026-08-17 sobre los 49 tours:** 14 grafías de región y **una sola
  familia sucia**, la de Lima: `"Lima"` (10 tours), `"lima"` (1) y `"lima lima"`
  (1). **Los dos tours con la grafía mala están pausados**, así que en el
  catálogo no se ve. **Del lado de las reservas pesa mucho más: 20 de las 43 caen
  en esas dos grafías** (18 en `"lima lima"`, 2 en `"lima"`) contra 1 en
  `"Lima"`. O sea que el informe de demanda parte Lima en tres y ninguna de las
  tres dice la verdad.

  **La causa no es un dato viejo: es el formulario, y sigue abierto.** El campo
  Ubicación es **texto libre** (`Ej: Huaraz, Áncash`), y `parseTourInput`
  (`lib/tour-input.ts`) parte por la coma: antes de la coma la ciudad, después la
  región. **Si no hay coma, la región cae a la ciudad.** Hoy funciona de
  casualidad en 31 de los 49 tours porque la ciudad y el departamento se llaman
  igual (Cusco, Arequipa, Lima). Con "Huaraz" a secas la región queda `"Huaraz"`,
  que no es una región. **Cada agencia nueva puede volver a ensuciarlo**, así que
  limpiar los datos sin tocar el formulario es trabajo que se deshace solo.

  **Sin decidir**, y son dos cosas separadas: normalizar lo que ya está, y
  cerrar la entrada. Lo segundo es lo que evita repetir lo primero, **y es lo
  urgente de los dos.**

  ### El disparador NO es el switch: es el onboarding de la primera agencia

  **Y esto le cambia la fecha al pendiente, así que va con su propio
  encabezado.** La razón por la que hoy la región está casi limpia no es que el
  sistema funcione: es que **los 31 tours donde la región cayó a la ciudad están
  en Cusco, Arequipa y Lima, donde la ciudad y el departamento se llaman igual.**
  Es una casualidad geográfica, no una validación.

  **Las agencias reales cargan tours en otros lados.** Cocachimba, Chachapoyas,
  Los Órganos, Huaraz, Paracas, Máncora: **ninguno de esos nombres coincide con
  su región.** El primer tour que cargue una agencia en cualquiera de esos
  lugares, sin escribir la coma, deja la región mal desde el día uno.

  | Lo que la agencia escribe | Región que queda hoy | La de verdad |
  |---|---|---|
  | `Cusco` | Cusco | Cusco (zafa) |
  | `Huaraz` | **Huaraz** | Áncash |
  | `Cocachimba` | **Cocachimba** | Amazonas |
  | `Los Órganos` | **Los Órganos** | Piura |

  **Consecuencia práctica: la ventana se cierra con el onboarding de la próxima
  agencia, no con el switch.** Cerrar la entrada después significa además tener
  que corregirle los datos a una agencia real, que es otra conversación y otro
  riesgo. Antes de onboardear la siguiente, esto tendría que estar resuelto.

  ### Cómo se cierra la entrada: tres opciones y lo que cuesta cada una

  **Nada de esto está implementado. Es la decisión, escrita antes de que haga
  falta.**

  | Opción | Qué cuesta | Qué garantiza |
  |---|---|---|
  | **A. Selector de departamento** (lista cerrada de 25) más el campo de ciudad aparte | Una constante con los 25 nombres, un `<select>` en el paso 1 de `NewTourView`, y **el backend deja de partir por la coma**: recibe ciudad y región por separado (toca el schema de `parseTourInput`). Hay que revisar la precarga al editar, que hoy arma `"Ciudad, Región"` | **Cierra el problema de raíz.** Escribir una región inválida deja de ser posible |
  | **B. Autocompletado sobre la misma lista, dejando pasar texto libre** | Más trabajo de interfaz que el selector (input, filtrado, estado, teclado) | **Nada.** Sugiere, no obliga. Con una lista de 25 el autocompletado no compra ni siquiera comodidad |
  | **C. Separar ciudad y región en dos campos, los dos libres** | Lo más barato: dos inputs y sacar la regla de la coma | **A medias.** Mata la causa mecánica (`"lima lima"` no vuelve), pero `"lima"` contra `"Lima"` sí, porque la región sigue siendo texto libre |

  **La recomendada es la A, y conviene ver que A ya contiene a C**: poner un
  selector obliga a separar los dos campos, así que no son alternativas
  acumulables. **La B se descarta**: paga más interfaz y garantiza menos.

  **Y hay una cuarta pieza que no es alternativa sino complemento, y la pide la
  regla de la casa** (`.claude/rules/api-y-schema.md`, "la guarda va en el estado
  que se protege, no en el camino que la descubrió"): **la validación de la
  región va en el backend, no solo en el formulario.** Un `enum` de zod contra
  los 25 nombres en `parseTourInput` cubre el POST y el PUT de una vez, y deja el
  selector como comodidad y no como única defensa. Si la guarda vive solo en el
  `<select>`, cualquier otro camino al API la esquiva.

  **Dos detalles que van a aparecer al hacerlo**, anotados para que no sorprendan:
  las tildes de la lista tienen que estar bien de entrada (Áncash, Apurímac,
  Huánuco, Junín, San Martín), y **son 25 y no 24**: los 24 departamentos más la
  Provincia Constitucional del Callao. Y con la validación puesta, **los 2 tours
  sucios de hoy van a fallar la próxima vez que alguien los edite**, que es la
  forma barata de que se limpien solos.

- **`SearchLog` guarda el texto completo de las búsquedas: 272 filas desde el
  2026-04-28, y no hay decisión sobre qué se hace con ellas.**

  **La distinción que hay que tener clara, porque es fácil afirmar de más:** el
  criterio de la Ley 29733 que sí está aplicado (loguear `qlen`, el largo, y
  nunca el texto) vive en los **logs de consola** de `api/search.ts`. **La tabla
  `SearchLog` es otra cosa, y es anterior a ese criterio**: la columna `query`
  guarda la consulta entera. Escribir "Finde nunca guarda el texto de las
  búsquedas" sería falso.

  **Por qué es un riesgo y no un incidente.** En la fila no hay correo, ni
  nombre, ni id de usuario: es texto y fecha. **Pero el texto lo escribe una
  persona en un campo libre**, y alguien puede buscar algo que lo identifique.
  Además no hay política de borrado: se acumula sin techo.

  **Decisión abierta, antes del lanzamiento**, y las tres opciones son baratas:
  truncar la consulta a los primeros N caracteres, guardar solo el largo y los
  resultados (que es lo que la tabla se usa para analizar), o dejarla como está y
  documentarlo. Lo que no puede pasar es llegar al lanzamiento sin haberlo
  mirado, con la tabla creciendo con búsquedas de gente real.

- **Las traducciones al quechua las escribe un modelo y nadie del equipo las valida.**

  **El riesgo sigue abierto. Lo que se cerró es el síntoma por el que lo descubrimos, y conviene no confundirlos.**

  **Cómo apareció (2026-08-14, ya resuelto).** El generador **agregaba em-dashes que no estaban en el original**: contado sobre los 49 tours, **52 rayas en `descQu` contra 35 en `description`**, con tours que tenían 3 o 4 en quechua y **cero** en español (Tambomachay, Pachacamac, Sacsayhuamán, Iquitos). No las copiaba, las inventaba. La causa estaba en el código: los `SYSTEM_PROMPT` de `api/ai/generate-quechua.ts` y `api/ai/generate-description.ts` **contenían em-dashes ellos mismos** y **no prohibían la raya**, mientras que el de `api/search-reasoning.ts` sí. El modelo imitaba sus propias instrucciones.

  **Cerrado en `f2d527d`, mergeado a `main`**, y verificado el 2026-08-17: **los tres prompts prohíben la raya** y la base tiene **cero** em-dashes en `description`, `descQu` y `shortPitch`. La limpieza de los datos ya existentes la hizo `scripts/limpieza-em-dash.ts`.

  **Y acá está el punto: las rayas nunca fueron el problema, fueron el único síntoma que sabíamos buscar.** Lo que no sabemos es **qué más inventa el modelo en un idioma que nadie del equipo lee**. Que el síntoma medible esté arreglado no dice nada sobre el resto; si acaso, ahora hay menos de dónde agarrarse para detectarlo.

  **Hoy no llega a ningún usuario**, porque la capa de display de quechua no existe: las columnas `titleQu`, `descQu`, etc. se llenan (40 de 49 tours) pero no se muestran. **Eso, y solo eso, es lo que lo mantiene como riesgo y no como incidente.**

  **Antes de mostrar quechua en el producto, alguien que lo hable tiene que leer una muestra de las traducciones.** No es opcional: el quechua es una promesa de marca de Finde, y publicar traducciones sin revisar de un idioma que el equipo no habla es exactamente la forma de romperla sin enterarse. Sin fecha ni tanda asignada.

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

## Huecos de producto

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

## Pendientes menores

No justifican tocar nada por sí solos.

- `src/Landing.jsx:575` tiene un comentario que nombra `App.css`, archivo borrado en `c96bd05` por ser código muerto sin importar. El comentario quedó desactualizado. `Landing.jsx` es archivo protegido, así que **no se toca por esto**: corregirlo cuando haya un motivo real para editar la landing y aprovechar el viaje.

## Cerrados y verificados, NO reabrir

- Gate de `operatorResolved` en `ProfileView` y `TopNav`: cerrado en `9a928c2`. Ambos lo consumen hoy.
- `/api/me` corriendo el vencimiento perezoso en el camino de identidad: cerrado en `4e81cb0` con el `?scope=operator`.
