# El motor de inventario

> **Historia, no estado.** Es el registro de trabajo **ya cerrado y en `main`**.
> Se archivó acá el 2026-08-16 al podar `docs/estado.md`, que había llegado a
> 1.767 líneas y se leía entero al empezar cada sesión.
>
> **El estado actual del proyecto vive en `docs/estado.md`.** Este archivo se lee
> solo cuando hace falta reconstruir por qué algo se hizo como se hizo.

## El motor de inventario, cerrado el 2026-08-15

**En `main` (`77f5f7e`), post-QA.** Cinco pasos más tres arreglos que salieron en
el camino. Nace del bug que José reportó el 15 de agosto ("a veces la reserva
falla aunque el calendario muestre cupos") y termina cubriendo los tres problemas
que la investigación destapó. **No tenía nada que ver con el plan tipográfico**:
apareció durante el QA de la Fase 5, que no toca una línea de lógica.

| Paso | Qué arregló | Commits |
|---|---|---|
| **1** | `takeSeats` exigía `Departure.status = 'ABIERTA'`, y como nada devuelve una salida a `ABIERTA`, confirmar una salida la dejaba **sin vender para siempre** aunque le sobrara cupo. Ahora excluye `CANCELADA`. **Liberó 14 asientos** | `c574888` |
| **2** | `AVAIL_CACHE` no se invalidaba nunca: el calendario mostraba el cupo previo durante toda la sesión de la página. Ahora se invalida por tour y mes | `3d47306` |
| **3** | La carrera de cupos caía en el mismo aviso de 11px que "el teléfono es inválido" y no ofrecía salida. Ahora tiene bloque propio y una acción según `seatsLeft` | `359d701` |
| **4** | **19 solicitudes que no podían vencer nunca** (`expiresAt` NULL, anteriores a la migración del 5 de agosto). Vencidas, **36 asientos liberados**. De paso borró el daño existente del paso 5 | `9b4c4dd` |
| **extra** | `expireStaleSolicitudes` se pasaba del timeout de la transacción con ~12 filas. **Era un 500 alcanzable en un camino de lectura**, no un riesgo teórico. Ahora va en tandas de 5 | `f4097ef` |
| **5** | Cambiar de modo de venta con solicitudes pendientes dejaba asientos invisibles para `takeSeats` y habilitaba **sobreventa**. Ahora 409 con instrucciones | `d85ad33`, `44508c9` |
| **extra** | Los mensajes del motor le hablaban a la agencia en **nombres del enum**: "cupo fijo", "modo solicitud", "panel de salidas". Ninguno existe en la interfaz, que dice "Confirmación automática", "Confirmación manual" y "Reservas". Dos de los tres eran **preexistentes** | `85aea40` |
| **extra** | El 409 del paso 5 llegaba **al guardar el tour**, tres pantallas después de elegir el modo. Ahora la opción se muestra deshabilitada con el motivo, en el paso de disponibilidad, desde que la pantalla se renderiza | `54bb0dc`, `7c6b7b6` |

### El aviso temprano, y por qué está donde está

El 409 del paso 5 es la guarda **real** y no se movió. Lo que se agregó es una
**segunda capa que avisa antes**: `GET /api/operators/me/tours` devuelve
`pendingRequests` por tour (un `groupBy` para toda la lista, sin llamada extra,
en el mismo payload que el formulario ya carga), y con eso la opción
"Confirmación automática" se muestra **deshabilitada con el motivo debajo**.

**No valida al tocar la opción ni al dar "Siguiente".** Tocar y revertir una
selección se lee como que la app está rota, y validar al avanzar deja que la
agencia llene "Cupos por salida" para después decirle que no aplica. Deshabilitada
desde el render, el motivo se lee **sin tener que provocar un error**.

Dos cosas que van con eso y no son adorno:

- La lista de tours **se recarga al decidir una salida**, porque ahí vive
  `pendingRequests`: resolver una solicitud es justo lo que desbloquea la opción.
  Sin eso el formulario mostraría el conteo viejo hasta recargar la página.
- El texto del aviso en el paso 3 **no** dice "para poder cambiar a confirmación
  automática": está pegado a esa opción, en el momento de elegirla. El 409 del
  servidor sí lo conserva, porque ahí aparece al guardar.

**Y costó un bug que quedó como regla:** el campo se agregó en el endpoint y en
el consumidor, los dos extremos funcionaban, y el aviso igual no salía. En el
medio estaba `mapTourFromApi`, un normalizador de **lista blanca** que descarta
en silencio lo que no enumera. Está documentado en `.claude/rules/frontend.md`:
agregar un campo al payload de un tour son **tres** lugares, no dos.

### Lo que quedó demostrado, y conviene no volver a discutir

- **El estado de la salida no es el instrumento de corte de ventas.** Los
  instrumentos son el cupo (integridad) y la anticipación. `CONFIRMADA` significa
  "el tour sale", no "cerramos la lista".
- **El bloqueo del paso 5 siempre tiene salida, y es estructural.** Una solicitud
  vigente está por fuerza en una salida futura (por el tope de la medianoche), y
  ahí el panel sí ofrece decidir. Y **no pueden volver a existir solicitudes
  inmortales**: hay un solo camino que crea reservas y siempre puebla `expiresAt`.
- **El techo de 23 viajes por transacción** es del proyecto entero, no del
  barrido. Está en `.claude/rules/api-y-schema.md`.
- **Los mensajes de error le hablan a la agencia en el vocabulario de la
  interfaz**, no en el del enum. "Confirmación automática" y "Confirmación
  manual" son los modos; "Reservas" es la pestaña; "Cupos por salida" es el
  campo. Si un mensaje nuevo nombra un `salesMode` o una sección, se verifica
  contra el código de la UI y no contra lo que suena bien.
- **Verificar las dos puntas de una cadena no alcanza.** Se perdió `pendingRequests`
  entre un endpoint que lo devolvía y un componente que lo leía. Vale para las
  tres reglas de la casa: medir el punto exacto, no deducirlo de los bordes.

### Caso conocido que NO se cubre: la salida cancelada

Si la agencia **cancela** una salida que tiene solicitudes vigentes, esas
solicitudes **no se pueden resolver a mano**: el endpoint de decisión rechaza con
409 cualquier acción sobre una salida `CANCELADA`. Solo salen por vencimiento.

**El comportamiento es correcto** (vencen solas, con la medianoche del día de
salida como tope duro), pero durante ese lapso la agencia queda bloqueada para
cambiar el modo de venta de ese tour **sin nada que pueda hacer al respecto**. Es
el único caso donde el bloqueo del paso 5 no se resuelve con una acción del
panel. Registrado, sin arreglar: la ventana es corta por construcción y la
combinación (cancelar una salida con solicitudes vivas y además querer cambiar el
modo de venta en ese mismo lapso) es rara.

### Lo que queda pendiente de este dominio

Ninguno es un bug: son huecos de producto, y están detallados más abajo en
"Trabajo pendiente de producto".

1. **El cierre operativo en CUPO_FIJO.** `closeTime` y `closeDaysBefore` no se
   evalúan en ese modo, así que vende hasta la víspera y la agencia no tiene cómo
   cortar antes. **Subordinado a la decisión del 2026-08-15**: no se toca hasta
   que una agencia real lo pida.
2. **El aviso al viajero cuando su solicitud vence.** El vencimiento es
   silencioso: nadie le escribe. Hoy no duele porque son datos de prueba.
3. **El panel sin acciones en salidas pasadas.** Una salida que pasa con
   solicitudes sin decidir deja al viajero colgado y no hay forma de cerrarla.

### Lo que NO queda pendiente

- **La cancelación de reservas.** `cancelBookingInternal` existe sin ruta
  expuesta, y es a propósito: es decisión de producto que va con Culqi.
- **`seatsRequested` bloqueando ventas.** No lo hace y no tiene que hacerlo: es
  progreso de quórum, no inventario comprometido.
- **El `pg_cron` para barrer.** El barrido perezoso alcanza al volumen actual.
- **La guarda del servidor NO se reemplaza por la del cliente.** El 409 de
  `PATCH /api/tours/:id` es la que protege de verdad; la opción deshabilitada del
  formulario solo avisa temprano. Son dos capas a propósito: la del cliente puede
  quedarse con un conteo viejo, la del servidor consulta en el momento.
- **El aviso temprano NO se mueve al paso 5 ni al "Siguiente".** Es la decisión
  que resolvió el bug original: cualquier cosa que aparezca después de elegir el
  modo devuelve el problema que veníamos a arreglar.

### Datos y consecuencias que quedaron registrados

- **Dos reservas de prueba intencionales, que NO se borran.** `FND-07DD62`
  (salida del 16 de agosto) y `FND-ED3818` (30 de agosto), las dos de
  `demo@finde.pe` sobre el tour interno "prueba", creadas en el QA del
  2026-08-15. **Son la evidencia de que el arreglo de la salida confirmada
  funciona en producción**: las dos entraron sobre salidas `CONFIRMADA`, que es
  exactamente lo que antes fallaba. Se quedan por eso, porque el tour es interno
  (`hola@finde.pe`) y porque **no hay camino de cancelación construido**:
  `cancelBookingInternal` no tiene ruta expuesta, así que borrarlas sería un
  DELETE a mano que además habría que compensar en `seatsTaken`. Van en la
  checklist de limpieza previa al lanzamiento, no antes.

- **Las 4 solicitudes de MEGATOURS desaparecen del panel de esa agencia como
  pendientes** (`FND-32AA9C`, `FND-F2B258`, `FND-DA6A0B`, `FND-1E4FB2`). Pasaron
  a VENCIDA, así que la agencia ya no las ve esperando decisión. **El impacto
  operativo es nulo**: las cuatro son de salidas pasadas (27, 28 y 30 de julio y
  7 de agosto) y el panel no ofrece acciones en salidas pasadas, así que nunca
  fueron accionables. Queda registrado igual porque es la única agencia real
  operando y su panel cambia de contenido sin que ella haya hecho nada.

  De las cuatro, **tres son de cuentas `@finde.pe`** y la única de fuera es de la
  cuenta de pruebas ya inventariada. Ningún viajero externo real queda afectado.

- **`expireStaleSolicitudes` se pasaba del timeout con pocas filas: ARREGLADO el
  2026-08-15** en `lib/inventory.ts`, no en el script, para que proteja a todos
  los llamadores.

  No era un riesgo latente sino **un 500 alcanzable en un camino de lectura**: el
  barrido corre antes de leer reservas y en el panel es **bloqueante**, así que
  una agencia con una docena de solicitudes vencidas se quedaba sin poder abrirlo.
  Una docena en una semana no es volumen extraordinario.

  **El umbral está medido, no estimado.** Contra el pooler entran **23 viajes de
  ida y vuelta** en una transacción interactiva antes del corte de los 5 segundos
  (unos 220ms por viaje, igual para SELECT que para UPDATE: el costo es la
  latencia, no el trabajo). El barrido hace **2 viajes por fila**, así que el
  máximo real eran **11 filas**. Con las 19 del backfill eran 38 viajes.

  Ahora el barrido va **en tandas de 5** (`EXPIRE_BATCH_SIZE`), cada una en su
  propia transacción: más del doble de margen sobre el máximo medido. Probado con
  **25 filas**, más del doble del umbral: pasa sin `P2028`, deja el contador en
  cero, y una segunda corrida no toca nada (idempotente).

  **El techo no desapareció: se movió.** El arreglo no cambia el tiempo total,
  porque lo domina la latencia por fila: **unos 0.5 segundos por solicitud
  vencida** (2 viajes), o sea que 25 tardan 12 segundos. Ya no falla con `P2028`,
  pero el barrido corre **dentro de una función serverless** y esa función tiene
  su propia duración máxima. **El techo nuevo es esa duración, y el barrido lo
  alcanza con suficientes vencidas.**

  **Dónde está exactamente ese techo hay que confirmarlo en el dashboard.** El
  repo **no** declara `maxDuration` en `vercel.json`, así que rige el default de
  la plataforma. Según la documentación vigente de Vercel ese default hoy son
  **300 segundos en todos los planes**, no los 10 del límite viejo de Hobby: con
  0.5s por fila el techo caería en el orden de las **cientos** de solicitudes, no
  de las decenas. No pude leer el límite efectivo del proyecto desde acá (la API
  de Vercel responde 403/404 con las credenciales de esta sesión), así que **ese
  número es el único dato del párrafo que falta verificar**, y conviene mirarlo
  antes de confiar en el margen.

  **Y el problema práctico llega mucho antes que cualquier timeout**: 25 vencidas
  ya son 12 segundos de espera en una lectura bloqueante del panel. Eso molesta
  bastante antes de que nada se corte.

  Si llega a hacer falta, la salida es **acotar cuántas se barren por lectura**, y
  eso sí cambia semántica: quedarían vencidas sin persistir hasta la lectura
  siguiente. Sin fecha ni tanda asignada.
