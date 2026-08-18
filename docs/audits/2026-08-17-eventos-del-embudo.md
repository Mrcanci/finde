# Tanda 4: los eventos del embudo. Investigación, sin cambios de código

> 2026-08-17. Rama `dev`, árbol limpio. **Nada de esto se implementó.**
> Todos los números salen de comandos, no de lectura. Los comandos quedan citados.

## Conclusión en tres líneas

1. **El embudo ya se mide en 3 de sus 4 pasos**, gratis y sin sumar un byte:
   desde la tanda 2 cada paso tiene URL propia y Vercel cuenta por URL, también
   en la SPA. El paso que falta, "confirmó", está en la base para siempre.
2. **El hueco real es el que sospechabas, y es más grande: el checkout entero
   por dentro es invisible.** No solo el modal de cuenta: los pasos datos, pago
   y voucher tampoco tienen URL, así que no dejan rastro.
3. **No hace falta instrumentar nada todavía**, y el motivo no es que no sirva:
   es que **hasta el switch no hay a quién medir**. Medido: en los últimos 30
   días producción tuvo **15 páginas vistas, todas del 17 de agosto, todas sin
   referente**, o sea el QA propio. La landing de finde.pe tuvo **cero**.
   Lo que sí hay que decidir ahora es el instrumento, y va escrito abajo.

---

## 1. Qué se puede medir hoy con Vercel Web Analytics

### Qué significa exactamente "No Custom Events" en Hobby

De la tabla de precios oficial (`vercel.com/docs/analytics/limits-and-pricing`):

| | Hobby | Pro |
|---|---|---|
| Eventos incluidos | **50.000 al mes** | ninguno, se paga por uso |
| Ventana de reporte | **1 mes** | 12 meses |
| **Custom Events** | **no** | incluidos |
| Propiedades por evento | no aplica | 2 |
| Parámetros UTM | **no** | con el add-on |

Dos cosas que no son obvias y cambian decisiones:

- **La cuota es de la cuenta entera, no del proyecto**, y al pasarse **la
  recolección se pausa** (3 días de gracia, después deja de contar hasta el
  siguiente ciclo). En Hobby no se puede comprar más.
- **La ventana de reporte es un mes.** Lo que pasó hace 40 días ya no se puede
  consultar. Esto es lo único de esta tanda con fecha de vencimiento: ver el
  punto 4.

**Confirmado además contra la cuenta real, no solo contra el doc:** el catálogo
de métricas del equipo `mrcancis-projects` expone
`vercel.analytics_pageview.count` y **no existe** ninguna métrica de eventos
personalizados. O sea que llamar a `track()` hoy gastaría cuota y no se vería en
ningún lado.

```
npx vercel metrics schema vercel.analytics_pageview.count
# Dimensiones: browser_name, country, device_type, environment, os_name,
#              project_id, project_name, referrer_hostname, request_hostname,
#              request_path, route, visitor_id
```

### Sí cuenta por ruta, y sí cuenta la navegación de la SPA

Esto era la duda que decidía la tanda, y está verificada en las dos puntas.

**En el script**: el que sirve Vercel (`/_vercel/insights/script.js`) parchea
`history.pushState` y escucha `popstate`. `navigateTo` de `AppDemo.jsx` navega
con `pushState`, así que **cada cambio de vista cuenta como página vista**.

Tres detalles del mismo código que conviene saber:

- **`replaceState` no está parcheado.** La autocorrección al slug canónico de la
  ficha usa `replaceState`, así que **no genera una visita duplicada**. Salió
  bien por diseño, no por suerte.
- **Solo cuenta si cambia el `pathname`.** Los query params no generan visita.
- **`beforeSend` se aplica antes de enviar**, así que la redacción de
  `/mis-reservas/<código>` a `/mis-reservas/[code]` que ya está puesta en
  `src/main.jsx` funciona sobre las visitas automáticas, no solo sobre las
  manuales.

**En los datos**: últimos 7 días, agrupado por ruta. Estas rutas solo existen en
el navegador (el servidor siempre devuelve el mismo `index.html`), así que si
aparecen es porque el conteo por ruta de la SPA funciona.

```
npx vercel metrics vercel.analytics_pageview.count --group-by request_path --since 7d --limit 40
```

| Ruta | Vistas |
|---|---|
| `/demo` | 36 |
| `/demo/panel` | 15 |
| `/demo/tour/namora-0a8k7h` | 15 |
| `/demo/perfil` | 9 |
| `/demo/buscar` | 7 |
| `/demo/panel/tour/nuevo` | 6 |
| `/` | 4 |
| `/demo/tour/otuzco-t9yjok` | 4 |
| `/demo/mis-reservas` | 3 |
| `/demo/reservar/namora-0a8k7h` | 2 |
| ... | (19 rutas distintas en total) |

### La trampa: `route` está vacío, así que cada tour es una fila

```
npx vercel metrics vercel.analytics_pageview.count --group-by route --since 30d
# route "(not set)": 114 vistas. Una sola fila, la de "sin valor".
```

Vercel tiene dos dimensiones: `route` (el patrón, `/tour/[seg]`) y
`request_path` (la URL concreta). **`route` lo llena la integración del
framework, y como esto es React pelado, viene vacío siempre.** Consecuencia: en
el panel, cada tour es su propia fila, y "cuántos abrieron un tour" no se lee de
un vistazo, hay que sumar.

**Se resuelve con un filtro por prefijo, y funciona** (probado, no supuesto):

```
npx vercel metrics vercel.analytics_pageview.count \
  --filter "startswith(request_path,'/demo/tour/')" --since 30d
# total 27
```

### El embudo que ya se puede armar hoy, con cuatro comandos

| Paso del embudo | Cómo se mide hoy | ¿Cubierto? |
|---|---|---|
| Entra | visitas totales (el panel además da visitantes únicos por página) | **sí** |
| Busca | `request_path eq '/demo/buscar'` | **sí**, y es un paso extra que no estaba en la pregunta |
| Abre un tour | `startswith(request_path,'/demo/tour/')` | **sí** |
| Empieza a reservar | `startswith(request_path,'/demo/reservar/')` | **sí** |
| Le piden la cuenta | nada | **no** |
| Llena sus datos | nada | **no** |
| Confirma | nada en la analítica | **no acá**, sí en la base |

Un detalle de método: el panel de Vercel y la API dan **visitantes únicos además
de páginas vistas** por ruta, que es lo que hace falta para decir "de cada 100
personas". El CLI `vercel metrics` devuelve solo páginas vistas, así que los
porcentajes se leen del panel o de la API, no del CLI.

Y una contaminación que hay que filtrar siempre: **dev.finde.pe cuenta**. De las
114 vistas de los últimos 30 días, **99 son de dev (preview) y 15 de producción**.
Todo número del embudo lleva `--filter "environment eq 'production'"`.

---

## 2. Qué se reconstruye desde la base

Medido con consultas de solo lectura contra la base real (la misma de
producción), hoy.

**Se responde con una consulta:**

| Pregunta | Dato | Estado al 2026-08-17 |
|---|---|---|
| Cuántas reservas y en qué estado | `Booking.statusNew` | 17 confirmadas, 21 vencidas, 4 rechazadas, 1 en solicitud |
| GMV | suma de `totalSoles` de las confirmadas | S/ 4.400,00 |
| Reservas por día | `Booking.createdAt` | serie completa desde el 2026-06-20 |
| Demanda por región | join `Booking` con `Tour.region` | tal como está en la base: `"lima lima"` 18, Amazonas 11, Cajamarca 9, `"lima"` 2, `"Lima"` 1, Ica 1, La Libertad 1. **Sin normalizar, y ese es el problema del punto de abajo** |
| Agencias verificadas | `Operator.verified` | 2 de 14 |
| Tours activos | `Tour.active` | 42 de 49 |
| Qué se buscó y qué devolvió | `SearchLog` | 272 filas desde el 2026-04-28 |

**No se responde desde la base, y son justo las del embudo:**

- **Cuántas personas hubo.** La base guarda reservas, no visitas. No hay
  ninguna fila que represente a alguien que miró y no reservó.
- **Cuántas reservas por visitante.** `Booking.userId` está **vacío en las 43
  reservas**: las reservas se vinculan por `userEmail` (está anotado en
  `api/me.ts`). O sea que ni siquiera dentro de la base hay un identificador de
  persona estable para cruzar.
- **De dónde vino la reserva.** Nada guarda si el viajero llegó por búsqueda,
  por el catálogo o por un link compartido.

**Dos cosas encontradas de paso, no se tocaron:**

1. **`Tour.region` está sucio, y el mecanismo que lo ensucia sigue abierto.**
   Contado sobre los 49 tours: **14 grafías distintas de región, y una sola
   familia sucia**, la de Lima, con tres formas: `"Lima"` (10 tours), `"lima"`
   (1) y `"lima lima"` (1). **Los dos tours con la grafía mala están pausados**,
   así que en el catálogo hoy no se ve.

   **Pero del lado de las reservas pesa mucho más: 20 de las 43 caen en esas dos
   grafías** (18 en `"lima lima"` y 2 en `"lima"`), contra 1 en `"Lima"`. Un
   informe de demanda por región hecho hoy parte Lima en tres y ninguna de las
   tres dice la verdad.

   **La causa no es un dato viejo, es el formulario.** El campo Ubicación es
   texto libre (`Ej: Huaraz, Áncash`), y `parseTourInput` (`lib/tour-input.ts`)
   parte por la coma: lo de antes de la coma es la ciudad y lo de después la
   región. **Si no hay coma, la región cae a la ciudad.** Hoy funciona de
   casualidad en 31 de los 49 tours porque la ciudad y el departamento se llaman
   igual (Cusco, Arequipa, Lima). Con "Huaraz" a secas, la región queda
   `"Huaraz"`, que no existe. **Cada agencia nueva puede volver a ensuciarlo.**
2. **`SearchLog.query` guarda el texto completo de la consulta**, 272 filas desde
   el 2026-04-28. El criterio de la Ley 29733 que cita el pedido (`qlen`, no la
   query) aplica a los **logs de consola** de `api/search.ts`, que efectivamente
   loguean solo el largo. **La tabla es otra cosa, y es anterior.** No es un
   incidente (no hay correo ni id de persona en la fila), pero **alguien puede
   escribir en el buscador algo que lo identifique**, y eso queda guardado sin
   fecha de borrado. Decisión abierta antes del lanzamiento: truncar, anonimizar
   o dejar como está. Anotada en `docs/pendientes-producto.md`.

---

## 3. El hueco real

**Tu sospecha era correcta y se queda corta.** No es solo el modal de cuenta: es
**todo el checkout por dentro**.

El checkout es un solo componente (`BookingView`) con cuatro pasos en estado
local, y **una sola URL para los cuatro**:

```
/demo/reservar/<tour>   →  paso 1: fecha y cupos        ← única URL que existe
                        →  modal de cuenta               ← sin URL
                        →  paso 2: nombre, teléfono, doc ← sin URL
                        →  paso 3: pago (demo)           ← sin URL
                        →  paso 4: voucher               ← sin URL
```

Lo que eso significa en preguntas concretas que hoy **no** tienen respuesta:

- Cuántos llegaron al modal de cuenta y se fueron ahí.
- Cuántos crearon la cuenta y aun así no terminaron.
- En cuál de los tres pasos del formulario se cae la gente.
- Cuántos abrieron el checkout y no reservaron (esto es casi computable: visitas
  a `/demo/reservar/*` contra reservas creadas en la base, pero son dos sistemas
  distintos, con ventanas distintas, y no se pueden cruzar por persona).

**Y hay un efecto secundario que no es de medición sino de producto**, y que
apareció leyendo esto: como el checkout entero es una sola entrada de historial,
**el botón de atrás del navegador en el paso 3 saca al viajero del checkout
completo** y le tira el formulario. Cualquier instrumento que le dé URL a los
pasos arregla eso de arrastre.

**Eso no queda acá: es un bug vivo y se anotó como tal**, en "Bugs abiertos" de
`docs/estado.md` con el razonamiento entero en `docs/pendientes-producto.md`.

---

## 4. Si hace falta instrumentar: qué, dónde y cuánto pesa

### Lo único que recomiendo hacer ya, y cuesta cero código

**Guardar una foto mensual de los números.** La ventana de Hobby es de **un mes**:
lo que no se copie, se pierde. Y las métricas que Finde tiene que mostrar en 2027
no se pueden reconstruir después.

El comando ya está probado y devuelve JSON:

```bash
npx vercel metrics vercel.analytics_pageview.count \
  --group-by request_path --filter "environment eq 'production'" \
  --since 30d --granularity 1d --format json
```

Costo: cero bytes en el cliente, cero código, un comando al mes. **Empieza a
valer el día del switch**, no antes, porque hasta entonces la foto es del QA
propio.

**Y necesita un disparador, porque una tarea manual mensual no se hace sola.**
Lo evaluado, con su costo:

| Dónde anclarla | Veredicto |
|---|---|
| Un cron de Vercel | **Descartado.** Cuesta una función serverless y estamos en 12 de 12 |
| El build | **No sirve.** El build no puede escribir en el repo |
| Recordatorio de calendario de José | Sirve, pero depende de una persona y de que esa persona esté en otra cosa |
| **Un renglón fechado en `docs/estado.md`** | **La recomendada.** No inventa un hábito: usa el que ya existe |

**La propuesta concreta**: un renglón en `docs/estado.md` que diga la fecha de la
última foto, y las fotos guardadas en `docs/metricas/YYYY-MM.json`. **El
disparador es que `docs/estado.md` se lee entero al empezar cada tanda**, que es
regla de la casa y hoy se cumple. El que arranca ve la fecha vencida y corre el
comando en treinta segundos. La checklist del switch la arranca; el renglón la
sostiene.

**El límite honesto de esta propuesta**: sirve mientras haya tandas seguidas. Si
después del lanzamiento pasa un mes sin abrir el repo, la foto se pierde igual, y
ahí el respaldo tiene que ser el recordatorio de calendario.

### La instrumentación de verdad, cuando toque: URL por paso del checkout

**Es la única forma de medir el abandono sin sumar un gramo al cliente**, porque
usa lo que ya está: el `pushState` que la app ya hace y el script que Vercel ya
sirve.

| Paso | URL propuesta |
|---|---|
| fecha y cupos | `/demo/reservar/<tour>` (ya existe) |
| modal de cuenta abierto | `/demo/reservar/<tour>/cuenta` |
| datos del viajero | `/demo/reservar/<tour>/datos` |
| pago | `/demo/reservar/<tour>/pago` |
| voucher | `/demo/reservar/<tour>/listo` |

- **Qué se guardaría**: nada nuevo. Son páginas vistas normales de Vercel.
- **Cuánto pesa en el cliente**: **cero.** No entra ninguna librería, no se
  importa `track`, no hay pedido nuevo. Es la misma llamada que ya se hace al
  cambiar de vista.
- **Ley 29733**: la URL lleva el tour, nunca a la persona. Ningún correo, nombre,
  teléfono, documento ni texto de búsqueda. El único dato de persona que puede
  aparecer en una URL es el código de reserva de `/mis-reservas/<código>`, y eso
  ya está redactado en `src/main.jsx`.
- **Qué cuesta de verdad**: trabajo en dos archivos (`src/lib/routes.js` y
  `BookingView` dentro de `AppDemo.jsx`) y una decisión de diseño: qué hacer con
  un link frío a `/demo/reservar/x/pago`, donde el formulario no existe (la
  respuesta razonable es mandarlo al paso 1). **Es tocar el checkout, que es
  justo lo que la tanda 3 acaba de estabilizar**, así que no es gratis en riesgo
  aunque sea gratis en bytes.
- **De regalo**: el botón de atrás pasa a retroceder de a un paso en vez de
  tirar el checkout entero.

**Cuándo**: con el switch, no ahora. Antes del switch no hay tráfico que medir, y
el riesgo de tocar el checkout no compra ningún dato.

### Lo que descarto, con el motivo

| Opción | Por qué no |
|---|---|
| **`track()` de Vercel (custom events)** | **Hobby no los acepta.** Se enviarían, gastarían cuota y no se verían en ningún lado. Recién con Pro. |
| **Guardar eventos en Postgres** | Necesita un modelo nuevo y **un endpoint, y no hay slot libre** (12 de 12 funciones en Hobby). Además suma escrituras a una base Supabase Free. Mucho costo para medir a nadie. |
| **PostHog** | Ya está decidido: se evalúa antes del switch, con la app terminada. Esta tanda no lo reabre. |

### Un techo que conviene tener anotado para 2027

Con URL por paso, un viajero que navega y reserva genera unas 10 páginas vistas.
Con **50.000 eventos al mes** de Hobby, eso da del orden de **5.000 visitantes
mensuales** antes de que Vercel **pause la recolección**. No es un problema hoy,
es el número que dice cuándo hay que pasar a Pro.

---

## 5. Qué va a ser cero hasta el switch

Para no esperar datos que no existen:

- **Tráfico orgánico: cero, y por diseño.** `index.html` lleva `<meta
  name="robots" content="noindex">`, así que nada bajo `/demo` se indexa, y
  `robots.txt` y `sitemap.xml` todavía no se publican. Ninguna visita va a venir
  de Google.
- **Referentes: cero.** Medido: las 15 vistas de producción de los últimos 30
  días tienen `referrer_hostname` sin valor, o sea entrada directa. No hay una
  sola visita de una fuente externa.
- **La landing de finde.pe: cero visitas en 30 días.** Todo el tráfico de
  producción cayó en `/demo`.
- **Tasas de conversión: no calculables.** Con 15 páginas vistas en un mes,
  cualquier porcentaje es ruido.
- **Nada del embudo de hoy es de un viajero real.** Las 15 vistas de producción
  son todas del 17 de agosto, el día del QA. Y **de los 114 eventos del mes, 99
  son de dev.finde.pe**, que es literalmente nuestra pantalla.
- **Y no hay forma de excluir el QA propio**: sin cookies y sin identificación,
  Vercel no distingue nuestras visitas de las ajenas. Hoy eso es el 100% del
  dato; después del switch pasa a ser ruido de fondo.
- **Ventas: cero.** Las 43 reservas de la base son de prueba y no hay pasarela.
- Detalle final de calendario: **la ventana de un mes se va a haber dado vuelta
  para cuando lancemos**, así que ninguno de estos números va a existir el día
  del switch aunque los midamos hoy.
