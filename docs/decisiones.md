# Decisiones

> Solo se agrega, nunca se borra. Una entrada por decisión de peso.
> Formato: fecha, qué se decidió, qué se descartó, por qué, y qué consecuencia trae.
> Las consecuencias se corrigen cuando el código las contradice, pero la decisión no se toca.

---

## 2026-08-13 - El catálogo es contenido de validación, no tracción comercial

*(rescatada de la memoria automática, criterio original de julio 2026)*

**Decisión:** en todo material externo (pitch, onepager, postulaciones a concursos y fondos) los números del catálogo se presentan como **contenido de validación del producto**, nunca como tracción comercial. La tracción es ventas, y hoy son cero.

**Descartado:** citar el conteo de tours y agencias del PRD como prueba de tracción.

**Razón:** José firmó una Declaración Jurada de veracidad en Emprende Turismo TEC 2026, y el producto tiene la regla de no mostrar nada falso. Presentar catálogo sembrado como demanda real es exactamente lo que esa regla existe para evitar.

**Estado real al 2026-08-13** (verificado contra la DB, ver `docs/estado.md`):

- **49 tours** y **14 agencias** en la base. De las 14, **9 son del seed** (sin dueño, sin RUC, sin MINCETUR) y **5 tienen dueño real**.
- **0 ventas.** Etapa pre-comercial: la pasarela todavía no existe.
- **MEGATOURS es agencia piloto confirmada**, con 5 tours de Cajamarca públicos hoy en finde.pe. Es la tracción real que sí se puede contar, y la coordinación operativa con ellos sigue pendiente.
- Lo demostrable: el MVP funcional en producción, la búsqueda semántica, el quechua persistido y la verificación manual SUNAT/MINCETUR.

**Consecuencia:** **el PRD (`finde-prd-tecnico-v5.md`) no se cita para postulaciones.** Sigue afirmando "40 tours con embeddings reales" y "13 agencias (9 verificadas)" como tracción (líneas 20 y 152), y esos números están inflados en las dos puntas: son viejos y además mezclan seed con real. Los docs de pitch heredaron la misma cifra. Si hay que postular de nuevo, los números salen de `docs/estado.md`, no del PRD.

**Nota:** el agente de WhatsApp 24/7 y la verificación con IA continua se presentan siempre como próxima fase. Hoy la verificación es manual y es el proceso vigente, no una carencia.

---

## 2026-08-13 - Onboarding de agencia: decisión abierta

*(rescatada de la memoria automática; el encuadre original decía "resolver en M2" y ese milestone ya cerró sin resolverla)*

**Decisión:** ninguna todavía. Queda registrada acá porque es la única forma de que no se pierda entre tandas.

**La pregunta:** ¿dónde vive el onboarding de agencia?

Las dos opciones sobre la mesa:

1. **Donde está hoy:** una card "¿Ofreces tours?" dentro del Perfil (`src/AppDemo.jsx:3763`). El viajero ya registrado la descubre navegando.
2. **Elegir rol viajero o agencia en el registro mismo**, antes de crear la cuenta.

**Razón para no dejarlo implícito:** conseguir agencias es el cuello de botella del marketplace. La fricción y la visibilidad de este punto de entrada son decisión de negocio, no de UI.

**Estado en el código al 2026-08-13:**

- La card del Perfil sigue siendo la única puerta: `src/AppDemo.jsx:3763`.
- El enlace "¿Eres agencia de turismo?" en la pantalla de Login sigue **comentado como TODO**: `src/AppDemo.jsx:2152`. Se difirió en M1 y nunca se retomó.

**Por qué caducó el encuadre de M2:** M2 (persistencia de tours de la agencia) está terminado y mergeado, y la decisión nunca se tomó. Atarla a un milestone cerrado la volvía invisible. Ahora vive acá hasta que se resuelva.

---

## 2026-08-13 - Fase 1 de la búsqueda se queda con Sonnet, no baja a Haiku

*(rescatada de la memoria automática, evaluación original del 2026-08-05/06)*

**Decisión:** la fase 1 de la búsqueda en dos fases usa **Claude Sonnet 4.6**. No se migra a Haiku 4.5.

**Descartado:** Haiku 4.5, pese a ser cerca de 2 veces más rápido y 3 veces más barato.

**Razón:** se probaron las dos en paralelo y Haiku falló de forma sistemática, no ocasional. En **5 de 5 corridas** con la consulta "comida típica del norte" eligió un tour de **región equivocada y precio 10 veces mayor** (Tambopata, que es selva sur y otro rango de precio). Sonnet acertó **5 de 5**. El ahorro no compensa: la fase 1 es la que decide qué tours ve el viajero, así que un error ahí es un resultado equivocado en pantalla, no una respuesta más lenta.

**También descartado en la misma evaluación: el disparo anticipado de la fase 2 por streaming o SSE desde el servidor.** La ganancia estimada era de 300 a 800 ms, y el costo era reintroducir la complejidad de streaming que ya se había descartado antes por corromper cuids (cerca del 23% de los casos en streaming, visto también en producción). Por eso la fase 1 elige por índices 1 a 8 y no por id. Queda anotado como optimización futura **solo si el reasoning vuelve a sentirse lento**.

**Consecuencia:** el id del modelo vive en `lib/anthropic.ts` (export `MODEL`) y no se hardcodea en otro lado. Si alguna vez se reevalúa el cambio de modelo, hay que repetir la prueba de región y precio: es el caso que lo cazó.

---

## 2026-08-13 - Culqi pasa a ser feature de lanzamiento

**Decisión:** integrar Culqi desde el inicio, no como hito posterior.

**Descartado:** coordinar pagos por WhatsApp durante la etapa piloto.

**Razón:** sin pasarela hay partes del producto que quedan ocultas o a medias, y eso choca con la regla de no mostrar nada falso ni incompleto al usuario real.

**Consecuencia (verificada contra el código el 2026-08-13):** lo que hoy está oculto esperando la pasarela es:

- La pestaña **"Ingresos"** del dashboard de la agencia (`src/AppDemo.jsx:4211`). El mock `EARN` que la alimentaba ya fue eliminado, así que reactivarla implica construir el cálculo real, no solo mostrar la tab.
- El stat **"Rating"** del dashboard (`src/AppDemo.jsx:4205`), oculto por una razón distinta: no hay modelo `Review` en la DB y los ratings del seed son siembra. No lo destraba Culqi.

**Corrección respecto de la versión anterior de esta entrada:** decía que la política de cancelación estaba oculta en la UI. **Es falso.** `getCancelPolicy(tour.cancellation)` se renderiza en cinco puntos de `src/AppDemo.jsx` (`:2795`, `:3045`, `:3406`, `:3457`, `:3497`), incluido el flujo de reserva. La exigencia INDECOPI de mostrarla antes de pagar ya está cumplida y no depende de Culqi.

**Pendiente de la decisión:** el porcentaje de comisión (15% o 20%) **queda sin definir hasta la integración de Culqi**. No hace falta resolverlo antes: mientras no haya cobro, la UI no muestra ningún porcentaje. Se define al integrar.

---

## 2026-07 - Comisión única de 20% todo incluido

*(día exacto sin registrar)*

**Decisión:** comisión única del 20%, a éxito, que incluye pasarela, soporte y demanda.

**Descartado:** 15% base más SaaS y B2G como motores complementarios.

**Razón:** el 20% está en el piso del mercado (Viator 25%, GetYourGuide 20-30%, Airbnb 20%) y el modelo financiero validó que un solo motor de revenue es más sólido que tres. Bajar de 15% rompe la unidad económica.

**Consecuencia (verificada contra el código el 2026-08-13):** **no hay nada que unificar en el producto.** La UI no muestra ninguna comisión: no existen `15%`, `20%`, `0.15` ni `0.20` en `src/`, `api/` ni `lib/`. La etapa piloto va sin comisión, con link directo a WhatsApp. El único lugar que afirmaba 15% era el `CLAUDE.md` viejo, ya reescrito.

**El número final queda pendiente hasta la integración de Culqi.** El 20% es la referencia que salió del modelo financiero, pero no está cerrado y no hay que cerrarlo ahora: mientras no haya cobro, la UI no muestra ningún porcentaje y nada depende de esto. Se define al integrar la pasarela, y recién ahí aparece en el producto.

La entrada anterior decía "el CLAUDE.md y la UI todavía mencionan 15%, hay que unificar"; eso ya no describe el estado del repo.

---

## 2026-07 - Custodia total de fondos

*(día exacto sin registrar)*

**Decisión:** el viajero paga el 100% a Finde; se libera a la agencia al completarse el tour.

**Descartado:** modelo de señal o adelanto. PagoEfectivo eliminado por contradecir la trazabilidad.

**Razón:** protege ambos lados y da poder de mediación en disputas.

**Consecuencia:** la custodia no depende del gateway. El gateway solo cobra; la retención y la liberación post-tour las maneja Finde. Nada de esto está implementado todavía: `Booking.status` se queda en `pending_payment` de forma indefinida.

---

## Terminología: agencias, no operadores

*(fecha sin registrar)*

**Decisión:** el lado oferta se llama "agencias" en todo el producto y la documentación (vocabulario MINCETUR y SUNAT).

**Consecuencia:** en el código persisten `Operator`, `/api/operators`, `requireOperator`, `Operator.userId`. Es deuda de nomenclatura interna aceptada. La regla aplica solo a copy visible.

---

## Identidad visible de la agencia como diferenciador

*(fecha sin registrar)*

**Decisión:** el viajero siempre ve qué agencia opera el tour.

**Descartado:** estrategia white-label estilo Tur.com.

**Razón:** la confianza verificada es el producto. Tur.com opera en Perú como entidad extranjera sin RUC local, y las agencias exponen su RUC mientras la plataforma se queda con el margen y la marca. Ese es el argumento de venta.

**Matiz:** se bloquean los datos de contacto (no la identidad) hasta que la reserva esté confirmada, patrón Airbnb, para evitar desintermediación.

**Consecuencia en el código:** `gateOperatorMincetur` (`lib/tour-select.ts:126`) implementa la parte visible de esto: el número de MINCETUR de la agencia se muestra al público solo si `Operator.verified` es true, y siempre en el dashboard propio de la agencia.

**Tensión abierta:** la promesa de "verificada" hoy no tiene respaldo técnico. El código solo valida que el RUC tenga 11 dígitos, y hay 8 agencias del seed con `verified: true` sin RUC ni MINCETUR cargados. Ver la checklist de `docs/estado.md`.
