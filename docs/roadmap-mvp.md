# Roadmap MVP — Finde

- **Fecha:** 2026-05-22
- **Rama base:** `main` @ commit `c1da37a`
- **Estado previo:** proyecto `tours-db-i18n` completado (tours migrados a DB, 40 tours con embedding Voyage, búsqueda IA funcional).
- **Documento hermano:** [`docs/audits/2026-05-20-mvp-readiness-audit.md`](./audits/2026-05-20-mvp-readiness-audit.md) — auditoría de estado que sirve como línea base de este roadmap.

---

## Objetivo del MVP

MVP real end-to-end donde:

- **Un operador** puede registrarse, configurar su perfil y crear/editar tours reales que se publican y se buscan.
- **Un viajero** puede buscar, ver el detalle y reservar un tour.
- **La reserva se coordina por WhatsApp directo** con el operador (sin pasarela en esta etapa). Finde genera el código de reserva y trackea la transacción.
- **Hay autenticación real con roles** (viajero / operador) que reemplaza el login fake actual.

El criterio de "MVP" no es paridad funcional con una OTA grande; es: **un operador piloto puede recibir y atender una reserva de un viajero real, originada y trackeada por Finde**.

---

## Decisiones arquitectónicas

### Autenticación: Supabase Auth

Usamos **Supabase Auth** porque ya tenemos Supabase para la DB (Postgres + pgvector) y porque el free tier cubre hasta **50 000 MAU** sin costo. Soporta email + contraseña, magic link y OAuth (Google).

- **Costo MVP:** $0.
- **Riesgo conocido:** el proyecto en free tier de Supabase **se pausa tras 7 días sin tráfico de DB**. Mientras estemos en validación con operadores y viajeros piloto eso no es problema, pero cuando haya usuarios reales conviene migrar a **Supabase Pro ($25/mes)** para evitar pausas y obtener backups + soporte.
- **Ventaja secundaria:** las RLS (Row Level Security) de Postgres permiten escribir reglas tipo "un operador solo ve sus propios Bookings" directamente en la DB, sin tener que duplicar la lógica en cada endpoint.

### Pagos: WhatsApp directo (pasarela postergada)

El MVP **no procesa pagos**. La reserva genera un código (`FINDE-XXXX`) y un mensaje pre-armado de WhatsApp que el viajero envía al teléfono real del operador; el pago se coordina por fuera (Yape/Plin/efectivo/lo que el operador prefiera).

- **Por qué:** todavía no tenemos RUC activo, no tenemos volumen para amortizar el costo de integración + KYC + reconciliación, y todavía no validamos con operadores reales si el "flujo Finde" les resulta útil. Construir una pasarela hoy es resolver un problema que aún no existe.
- **Referencia:** patrón "do things that don't scale" — Airbnb empezó coordinando pagos manualmente (PayPal + cheques) durante años antes de construir su plataforma de pagos. Lo que importa en esta fase es validar la demanda, no la fricción operativa interna.
- **Cuando sí construimos Culqi:** cuando tengamos (a) RUC activo, (b) operadores piloto que pidan cobrar dentro de la plataforma, (c) reservas con suficiente volumen para que el ahorro de tiempo del operador justifique el ~5-8% de comisión + IGV.

### Comisión: Modelo C (sin comisión en piloto)

Los primeros operadores **no pagan comisión** a cambio de feedback honesto y testimonios. El código de reserva (`FINDE-XXXX`) en cada Booking nos permite trackear que la reserva se originó en Finde aunque el pago haya sido por fuera, así no perdemos visibilidad del GMV real que generamos para el operador.

La comisión se activa **el día que se enchufa la pasarela**, no antes.

---

## Fases del MVP

> Cada fase incluye objetivo, alcance, esfuerzo estimado y el estado actual derivado de la auditoría.

### M1 — Autenticación + roles

**Objetivo:** reemplazar el login fake actual con auth real, con dos roles (viajero y operador) y sesión persistente.

- Integrar Supabase Auth en el frontend (`AppDemo.jsx` reemplaza `LoginView` y `OTPView` con flujos reales) y en `/api/` (middleware que valida JWT en cada request protegido).
- Tabla `Operator` se liga a `auth.users` vía `userId` (FK a UUID de Supabase). Una `auth.users` puede tener 0 o 1 fila en `Operator`; el rol "viajero" es simplemente "no tiene Operator vinculado".
- Endpoint `GET /api/me` que devuelve el usuario actual + (si aplica) su Operator.
- Protección de rutas: `POST /api/tours`, `PUT /api/tours/:id`, `GET /api/operators/me/*` exigen sesión y rol operador. `POST /api/bookings` exige sesión viajero (o anónimo + email confirmado — a decidir).
- Limpieza: descartar la cookie `finde_session` con UUID aleatorio que hoy no se valida en ningún lado.

**Esfuerzo:** ~1 semana (fase más delicada — base de todo lo demás).
**Estado actual (auditoría):** auth viajero ❌ fake, auth operador 🟡 a medias (crea row pero no persiste sesión), roles ❌ no existen en DB ni en API.

### M2 — Persistencia de tours del operador

**Objetivo:** que el operador pueda crear y editar tours desde el dashboard y queden guardados en DB con su embedding.

- `POST /api/tours` y `PUT /api/tours/:id` con autorización: `operatorId` se deriva del JWT, no del body.
- Generar embedding Voyage al crear/editar el tour. Decisión a tomar: on-write síncrono (más simple, +1-2s de latencia en el guardado) vs job asíncrono (más complejo pero el operador no espera). Recomendación: **on-write síncrono** para el MVP; si la latencia molesta, mover a queue.
- Reemplazar `handleCreateTour` y `handleSaveTour` en `AppDemo.jsx` (hoy solo mutan estado local) por fetch real.
- Validar con zod los mismos campos del schema y devolver el tour creado para que el frontend actualice `tours` y `opTours`.

**Esfuerzo:** ~3-5 días.
**Estado actual:** ❌ solo estado local, sin `POST /api/tours`. Al recargar, los tours creados desaparecen.

### M3 — Endpoints "me" del operador

**Objetivo:** que el dashboard del operador (que visualmente ya existe) deje de ser mock.

- `GET /api/operators/me/bookings` — listado de las reservas de los tours del operador, con filtros por estado y fecha.
- `GET /api/operators/me/earnings` — agregado semanal/mensual (con la salvedad de que en piloto no hay comisión, solo GMV trackado).
- `GET /api/operators/me` y `PUT /api/operators/me` — perfil (nombre, teléfono, ciudad, RUC, datos comerciales).
- Conectar `DashView` (4 tabs Reservas/Ingresos/Mi Negocio/Mis Tours) a estos endpoints.

**Esfuerzo:** ~3-4 días.
**Estado actual:** 🟡 el dashboard luce completo pero todo lo que muestra son constantes mock: `OP_BK` (reservas), `EARN` (ingresos), `biz` (RUC/MINCETUR/CCI hardcoded).

### M4 — Flujo reserva → WhatsApp

**Objetivo:** cerrar el bucle viajero → operador sin pasarela.

- Viajero elige fecha + número de personas en `BookingView`.
- `POST /api/bookings` registra la reserva con código `FINDE-XXXX`. Status inicial **`pending_coordination`** (renombrar desde el actual `pending_payment`, que es engañoso porque no hay flujo de pago que lo transicione).
- Pantalla post-reserva: botón **"Coordinar por WhatsApp"** que abre `wa.me/<telefono_real_del_operador>` con mensaje pre-armado:
  > "Hola, soy [nombre]. Reservé [tour] para el [fecha], [N] personas. Mi código es [FINDE-XXXX]. ¿Cómo coordinamos el pago?"
- Reemplazar el teléfono hardcoded `+51 987 654 321` (línea 2206 de `AppDemo.jsx`) por `operator.phone` real desde el tour.
- (Opcional) endpoint `POST /api/bookings/:code/confirm` que el operador llama desde su dashboard para mover el booking a `confirmed` una vez recibió el pago por fuera.

**Esfuerzo:** ~3-4 días.
**Estado actual:** 🟡 el booking sí persiste en DB pero queda en `pending_payment` para siempre; el botón WhatsApp existe pero apunta a un número fijo de demo.

### M5 — Confirmaciones + voucher honesto

**Objetivo:** que lo que el viajero ve después de reservar sea verdad.

- Quitar del `VoucherDetail` (líneas 2308-2310 de `AppDemo.jsx`) los datos fiscales inventados (`RUC: 20612345678 · MINCETUR: VER-2024-00891`). Mostrar solo los datos reales del operador cuando existan, y `null` cuando no.
- Tracking de reservas: cada `Booking` con `FINDE-XXXX` queda visible para Finde aunque el pago haya sido por fuera. Esto se vuelve la base de la comisión cuando llegue la pasarela.
- **Email de confirmación (opcional, evaluar):** Resend tiene free tier (3 000 emails/mes) y se integra en 1-2 horas. Si decidimos sí, mandar dos emails al crear `Booking`: uno al viajero ("tu reserva está pendiente de coordinación, te llegó un mensaje al WhatsApp") y otro al operador ("nueva reserva FINDE-XXXX de [viajero], contáctalo en [phone]"). Útil porque WhatsApp se pierde y el correo queda.

**Esfuerzo:** ~2-3 días.
**Estado actual:** voucher con RUC/MINCETUR inventados (riesgo legal a corregir), sin email transaccional.

### M6 — Reviews reales

**Objetivo:** reemplazar las reviews sintéticas por reviews de viajeros reales.

- Modelo `Review` en `prisma/schema.prisma` (no existe hoy). Campos mínimos: `id`, `tourId`, `bookingId` (FK obligatoria — solo quien reservó puede reseñar), `userId`, `rating 1-5`, `text`, `createdAt`. Constraint: una review por `bookingId`.
- `POST /api/reviews` con guard: solo se aceptan reviews si existe un `Booking` con `status = "completed"` para ese par (userId, tourId).
- `GET /api/tours/:id/reviews` paginado.
- Reemplazar `generateMockReviews` por fetch real; conservar el fallback "sin reviews todavía" para tours nuevos.
- Recalcular `Tour.rating` y `Tour.reviewsCount` en cada review (trigger o lógica en endpoint).

**Esfuerzo:** ~3-4 días.
**Estado actual:** ❌ no hay modelo `Review`; todo se genera con `generateMockReviews` determinístico desde pools de texto por categoría.

---

## Limpieza / deuda técnica (entre fases)

Tareas chicas que conviene intercalar entre fases — no son bloqueantes pero suman calidad:

1. **20 operadores zombie en DB** (mayoría son cuentas de prueba `ale.qui*spe@gmail.com`). Borrar con un `DELETE` con whitelist explícita. Buen momento: justo antes de M1, así Supabase Auth arranca con DB limpia.
2. **Tipografía inconsistente** `TCard` (`.tc-tl`) vs `GCard` (`.gc-t`). Armonizar `font-family/size/weight` en `src/index.css`.
3. **`GET /api/tours` con tope duro `limit ≤ 50`**, sin paginación (`offset`/`cursor`). Paginar cuando el catálogo supere ~80 tours; antes no es prioridad.
4. **Tag `pre-merge-tours-db-i18n`** apunta a `c1da37a` (HEAD actual) — debería apuntar al commit previo al merge. Mover el tag o borrarlo si ya no aporta.
5. **`CLAUDE.md` desactualizado**: la sección "Sprint actual (Día 1-7)" describe trabajo terminado como en curso, y la restricción "no modificar AppDemo.jsx" ya no aplica. Actualizar cuando arranque M1.

---

## Fuera del MVP (postergado)

- **Pasarela de pago Culqi.** Hasta tener RUC activo + operadores piloto que la pidan + volumen que la justifique.
- **Filtros beach/trekking u otras categorías.** Las 5 categorías actuales (`adventure | cultural | gastronomy | nature | mystic`) son suficientes. Sumar más solo cuando un operador piloto lo pida con tour real en la mano.
- **Notificaciones reales** (push, in-app feed). `NOTIFS` mock no bloquea el flujo core; suma cuando haya retención que sostener.
- **WhatsApp Business API / Twilio.** El link `wa.me` con mensaje pre-armado es suficiente en el piloto. La API formal entra cuando se quiera medir entregas, plantillas verificadas y respuestas automáticas.
- **App nativa (iOS/Android).** La PWA mobile-first cubre el piloto.

---

## Dependencias de negocio (no técnicas)

- **RUC activo** — necesario para activar pasarela real más adelante (Culqi/MercadoPago requieren persona jurídica con RUC en Perú).
- **Operadores piloto** — conseguir 3-5 operadores reales que estén dispuestos a publicar tours y atender reservas vía WhatsApp durante el piloto. Sin ellos, el MVP no se valida.
- **Viajeros piloto** — círculo cercano + tráfico de la landing (`finde.pe`) para generar las primeras 10-20 reservas reales.
- **Decisión Supabase Pro ($25/mes)** — el día que un operador piloto reciba su primera reserva real, hay que tomar la decisión (riesgo: free tier pausa el proyecto tras 7 días sin tráfico de DB).
- **Términos y Política de Privacidad** — los links en `LoginView` apuntan a `#`. Hay que tener textos reales (ProInnóvate / MINCETUR probablemente los exijan).

---

## Orden de ejecución recomendado

```
M1 (auth + roles) ──► M2 (persistencia tours) ──► M3 (endpoints "me")
                                                          │
                                                          ▼
                                              M4 (reserva → WhatsApp)
                                                          │
                                                          ▼
                                              M5 (voucher honesto + email)
                                                          │
                                                          ▼
                                                    M6 (reviews)
```

- **M1 bloquea todo lo demás.** Es la fase con más riesgo de regresiones y la que más cuidado pide; lo razonable es darle una semana completa.
- **M2 y M3 son separables** pero forman un par natural: M2 deja al operador publicar; M3 lo deja ver los frutos. No tiene sentido entregar solo uno de los dos.
- **M4 + M5 cierran el flujo end-to-end** del viajero. Con esos dos en main, ya se puede correr un piloto real.
- **M6 puede ir al final, no es bloqueante para validar.** Mientras tanto, `generateMockReviews` cumple el rol de "no rompe la UI por ausencia de datos".

**Estimación total:** ~5-6 semanas calendario (no continuas), ajustable según ritmo del fundador y conversaciones con operadores piloto.

---

## Cómo medimos éxito del MVP

(no es un acuerdo cerrado, propuesta para conversar)

- **5 operadores piloto activos** con al menos 1 tour publicado cada uno.
- **20 reservas reales** generadas y trackeadas con código `FINDE-XXXX`.
- **Tasa de coordinación efectiva por WhatsApp ≥ 80%** (la reserva termina en pago real coordinado por fuera, no se cae).
- **Feedback cualitativo de los 5 operadores** sobre qué les sirve, qué les molesta, y si pagarían comisión por seguir usando Finde.

Estos números no son ambiciosos; son los suficientes para decidir si vale la pena construir la pasarela y escalar.
