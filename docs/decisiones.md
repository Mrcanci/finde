# Decisiones

> Solo se agrega, nunca se borra. Una entrada por decisión de peso.
> Formato: fecha, qué se decidió, qué se descartó, por qué, y qué consecuencia trae.
> Las consecuencias se corrigen cuando el código las contradice, pero la decisión no se toca.

---

## 2026-08-13 - Culqi pasa a ser feature de lanzamiento

**Decisión:** integrar Culqi desde el inicio, no como hito posterior.

**Descartado:** coordinar pagos por WhatsApp durante la etapa piloto.

**Razón:** sin pasarela hay partes del producto que quedan ocultas o a medias, y eso choca con la regla de no mostrar nada falso ni incompleto al usuario real.

**Consecuencia (verificada contra el código el 2026-08-13):** lo que hoy está oculto esperando la pasarela es:

- La pestaña **"Ingresos"** del dashboard de la agencia (`src/AppDemo.jsx:4211`). El mock `EARN` que la alimentaba ya fue eliminado, así que reactivarla implica construir el cálculo real, no solo mostrar la tab.
- El stat **"Rating"** del dashboard (`src/AppDemo.jsx:4205`), oculto por una razón distinta: no hay modelo `Review` en la DB y los ratings del seed son siembra. No lo destraba Culqi.

**Corrección respecto de la versión anterior de esta entrada:** decía que la política de cancelación estaba oculta en la UI. **Es falso.** `getCancelPolicy(tour.cancellation)` se renderiza en cinco puntos de `src/AppDemo.jsx` (`:2795`, `:3045`, `:3406`, `:3457`, `:3497`), incluido el flujo de reserva. La exigencia INDECOPI de mostrarla antes de pagar ya está cumplida y no depende de Culqi.

**Pendiente de la decisión:** confirmar si la comisión visible es 15% o 20%.

---

## 2026-07 - Comisión única de 20% todo incluido

*(día exacto sin registrar)*

**Decisión:** comisión única del 20%, a éxito, que incluye pasarela, soporte y demanda.

**Descartado:** 15% base más SaaS y B2G como motores complementarios.

**Razón:** el 20% está en el piso del mercado (Viator 25%, GetYourGuide 20-30%, Airbnb 20%) y el modelo financiero validó que un solo motor de revenue es más sólido que tres. Bajar de 15% rompe la unidad económica.

**Consecuencia (verificada contra el código el 2026-08-13):** **no hay nada que unificar en el producto.** La UI no muestra ninguna comisión: no existen `15%`, `20%`, `0.15` ni `0.20` en `src/`, `api/` ni `lib/`. La etapa piloto va sin comisión, con link directo a WhatsApp. El único lugar que afirmaba 15% era el `CLAUDE.md` viejo, ya reescrito.

La decisión queda como número de referencia para cuando se active el cobro con Culqi. En ese momento hay que definir el porcentaje final y recién ahí aparece en la UI. La entrada anterior decía "el CLAUDE.md y la UI todavía mencionan 15%, hay que unificar"; eso ya no describe el estado del repo.

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
