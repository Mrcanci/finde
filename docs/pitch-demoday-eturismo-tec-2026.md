# Pitch Demo Day — Emprende Turismo TEC 2026

- **Fecha de la sesión:** 2026-07-06 (office hours)
- **Evento:** Pitch Bootcamp + Demo Day, Cajamarca (FDA / MINCETUR)
- **Formato:** 5 minutos · demo en vivo posible · proyector + internet
- **Equipo:** Jose Cancino (CEO, ex-LATAM Airlines, producto/negocio) · Franco Romaní (CTO, 8 años ing. de sistemas, IA/arquitectura)
- **Eje narrativo elegido:** Impacto turístico + IA (fusión), liderando con demo en vivo

---

## 1. Por qué se reestructura (el diagnóstico)

El deck actual (`Finde_Pitch_DemoDay1.pdf`, 14 slides) es un pitch de inversionista metido a un concurso de preincubación. Mal reparto de peso vs. la rúbrica:

| Criterio | Peso | Slides actuales |
|---|---|---|
| 1.2 Innovación (base tecnológica) — **el desempate** | 25 | 1 (slide 5) |
| 1.3 Impacto en turismo | 25 | 1 (slide 6) |
| 2.1 Equipo | 20 | ½ (slide 14) |
| 1.1 Oportunidad de mercado | 15 | 1 (slide 8) |
| 3.1 Escalabilidad | 15 | 3 (slides 11-13) |

**Innovación + impacto = 50% del puntaje y tenían 2 slides. Mercado + escalabilidad = 30% y tenían 6 slides.** El equipo (20%) tenía media slide apurada.

Dos problemas de fondo:
1. **El pitch se paraba sobre lo único no construido** (custodia/pago). La pasarela es solo demo (`DEMO_PAYMENT_FLOW`), cero transacciones reales. Riesgo en Q&A.
2. **El superpoder real —un MVP en producción y demoable— se mencionaba de pasada.** En un concurso de "etapa temprana / antes del PMV", tener producto vivo es rarísimo y premiado. Hay que convertirlo en el momento central: **demo en vivo**.

Reencuadre en una línea: **dejar de pitchear el marketplace y empezar a pitchear la plataforma AI-native que formaliza y descentraliza el turismo peruano, demostrada en vivo.**

---

## 2. Estructura nueva — 5 minutos, 7 beats

| # | Beat | Tiempo | Criterio |
|---|---|---|---|
| 1 | Hook + problema | 0:00–0:50 | setup |
| 2 | **Demo en vivo en finde.pe** | 0:50–2:30 | 1.2 + 2.1 |
| 3 | Por qué es innovación real | 2:30–3:05 | 1.2 (desempate) |
| 4 | Impacto en el turismo peruano | 3:05–3:45 | 1.3 |
| 5 | Tracción + mercado (1 slide) | 3:45–4:20 | 1.1 + 3.1 |
| 6 | Equipo | 4:20–4:45 | 2.1 |
| 7 | Cierre + pedido | 4:45–5:00 | — |

### Beat 1 — Hook + problema (0:50)
- Conserva la frase de tu mamá: *«¿Será seguro? Revísalo tú.» — mi mamá, con cada full day que encontraba en Facebook.* Es específica, peruana, emocional. No la toques.
- El mockup del Yape a "J. Ramírez" para separar cupo. Concreto, todos en la sala lo han vivido.
- Cierra con la apuesta: *6 de 10 agencias en la informalidad; reservar un tour en Perú es un acto de fe, y esa desconfianza mantiene el 90% de las reservas en la informalidad.*

### Beat 2 — Demo (1:40, el corazón)
**Formato recomendado: screencast grabado y editado (60-90s), narrado EN VIVO.** El video maneja el guion; tú hablas encima e interactúas con la sala. Esto elimina las dos formas en que una demo en vivo falla: internet Y latencia (la búsqueda semántica tarda ~1.3s en cache pero hasta ~10s sin cache — 10s de silencio en escenario matan el ritmo; en el video editado eso se corta a 1s).

Guion de ~90 segundos:
1. Búsqueda en lenguaje natural: *"algo de aventura cerca de Lima que no sea lo de siempre"* → muestra el razonamiento de la IA en peruano.
2. Abre un tour de agencia verificada → señala el sello *"verificado contra SUNAT y MINCETUR"*.
3. Toca el toggle **quechua** → *"40 de 40 tours, único en LATAM"*. Momento "whoa".
4. Reserva → pago con Yape, con framing honesto (ver §4).

**Remate de liveness (opcional, cero dependencia):** al terminar el video, *"y esto no es un video montado, está en producción ahora mismo"* y saltas a una pestaña con finde.pe abierta para UNA query real, ~10s. Si el internet funciona, entregas la prueba de que está vivo. Si falla, ya diste toda la demo por video y te saltas el flip sin que se note. Nunca se rompe el pitch.

**Si igual vas en vivo:** pre-calienta el cache corriendo las queries exactas justo antes de subir (quedan en `FeaturedSearch`, ~10s → ~1.3s).

### Beat 3 — Por qué es innovación real (0:35)
- Tesis: *"la primera plataforma de tours AI-native del Perú."*
- Tres pilares: (1) verificación con IA **continua** — la confianza como dato, no como promesa; (2) búsqueda semántica sobre inventario real — no alucina, solo tours del catálogo; (3) quechua persistido.
- Remate que ata al equipo: *"construido íntegramente por nosotros dos."*

### Beat 4 — Impacto en el turismo peruano (0:40)
Este es el 25% que le habla al jurado MINCETUR. Átalo explícitamente al desafío del concurso y a la **Nueva Ley General de Turismo (Ley 32392)** citada en las bases (criterio 1.3 = "coherencia con los desafíos y estrategias del sector").
- **Formaliza:** por primera vez ser formal vende más; el sello convierte RUC + MINCETUR en ventaja comercial.
- **Descentraliza:** demanda hacia regiones más allá de Lima-Cusco; anti-overtourism.
- **Sostiene:** economías locales, guías certificados, quechua como inclusión cultural.

### Beat 5 — Tracción + mercado en UNA slide (0:35)
Tres números, nada más:
- **80% de intención** de uso (25 entrevistas: 20 viajeros + 5 agencias).
- **MVP en producción:** 40 tours con embeddings, 13 agencias (9 verificadas).
- **Mercado:** SOM Año 1 ≈ S/600K (menos del 1% del SAM). Modelo: comisión 20% a éxito, rentable desde el Año 1.

### Beat 6 — Equipo (0:25)
Sube a beat completo (20% del puntaje; la preincubación apuesta por equipos).
- **Jose:** LATAM Airlines → industria de viajes, operaciones, escala + producto/negocio.
- **Franco:** 8 años de ingeniería, IA y arquitectura; construyó la plataforma.
- **15 años de amistad.** Línea killer: *"no contratamos a nadie para construir esto; lo construimos nosotros."*

### Beat 7 — Cierre (0:15)
Conserva tu cierre, es bueno: *"Que la pregunta ya no sea '¿será seguro?' sino '¿está en Finde? Resérvalo.'"* + un pedido claro (qué buscas del programa: la beca de incubación / mentoría en pasarela y compliance).

---

## 3. Slides de apéndice (solo para Q&A, no se presentan)
No se borran, se mueven al final por si el jurado pregunta:
- Proyección financiera a 3 años.
- Desglose del presupuesto del piloto (S/11,790).
- Tabla de competencia (Finde vs. Viator/GYG/Civitatis).
- Unit economics (S/24 − S/5 = S/19).

---

## 4. Framing honesto del pago (crítico)
En la demo, **no digas "se realizó el pago"** como si fuera real. Di:
> *"Aquí el viajero paga con Yape; la pasarela con custodia está en integración final, entra en producción en las próximas semanas."*
Muestras el flujo completo igual. Si un jurado pregunta, tu respuesta ya está dada y no quedas en falta con la Declaración Jurada de veracidad que firmaste (bases §10.1). Coherente con tu propio principio de integridad de producto.

---

## 5. Prep de Q&A (preguntas probables)
- *"¿La pasarela funciona?"* → §4. Está en integración, semanas. Muestra el flujo demo.
- *"¿Cuántas ventas reales tienen?"* → Honesto: cero transacciones aún, etapa pre-comercial; el piloto valida la venta. Es lo esperado en etapa temprana; no lo escondas.
- *"¿Qué los defiende de Viator/Civitatis?"* → Apéndice competencia: pagos locales (Yape/Plin en soles) + verificación formal peruana + contenido regional. Ninguna OTA global lo replica rápido.
- *"¿Por qué es innovación y no un marketplace más?"* → verificación IA continua + búsqueda semántica sobre inventario real + quechua persistido. Demo lo respalda.

---

## 6. Riesgos de ejecución
- **Demo: grabado como principal, en vivo como remate.** Ver Beat 2 (§2). El screencast editado y narrado en vivo maneja el guion; el flip a finde.pe en vivo es la cereza sin dependencia. No reemplazar la demo por un video: respaldarla con uno y hacerlo al revés (grabado maneja, vivo es opcional). Ten también un **hotspot** propio por si usas el flip.
- **Fase virtual = 50% del puntaje final.** El Demo Day pesa la mitad; la otra mitad ya se juega en las sesiones virtuales. No descuides esas calificaciones.
- **Confirmar formato con la FDA:** tiempo exacto, si hay Q&A, condiciones técnicas de proyección/internet.

---

## 8. Guion de la demo — palabra por palabra (~90s)

Calibrado para ~90s a ritmo de pitch. Si lo dices más lento, recorta el Beat 3. Acciones entre corchetes.

**[Entrada · home de finde.pe]**
> "Esto es Finde. En producción, ahora mismo. Miren cómo reserva un viajero."

**[Beat 1 · Búsqueda semántica — ~22s]**
[escribes: *"algo de aventura cerca de Lima que no sea lo de siempre"*]
> "No escribo categorías ni filtros. Escribo como le hablaría a un amigo."
[aparecen resultados con el razonamiento de la IA]
> "Y la IA no solo busca: me explica en peruano por qué me recomienda cada tour. Y esto es clave: solo recomienda tours reales del catálogo. No inventa. Es la primera plataforma de tours AI-native del Perú."

**[Beat 2 · Agencia verificada — ~16s]**
[abres un tour, señalas el sello]
> "Entro a este tour. Esta agencia tiene el sello Verificado: validamos su RUC en SUNAT y su registro en MINCETUR. Por primera vez en el Perú, ser formal vende más."

**[Beat 3 · Quechua — ~18s]**
> "Y esto no lo tiene ninguna plataforma en el mundo."
[toggle ES → QU; la pantalla cambia]
> "El tour completo en quechua. Título, descripción, todo. En los 40 tours de la plataforma. Tecnología para un turismo que incluye, no que excluye."

**[Beat 4 · Reserva + pago — ~20s]**
[eliges fecha y personas]
> "Reservo: fecha, número de personas."
[pago con Yape]
> "Y pago con Yape, en soles. La pasarela con custodia está en integración final, entra en producción en semanas: el viajero le paga a Finde, y Finde le libera a la agencia cuando el tour se completa."
[confirmación]
> "Reserva confirmada. De un acto de fe, a un tour reservado, en menos de un minuto."

### Notas de entrega
- **La primera línea es la más importante:** *"en producción, ahora mismo."* Dila mirando al jurado, no a la pantalla.
- **Pausa después del quechua.** Es el momento "whoa". Toca el toggle, cállate un segundo, deja que aterrice, y sigue.
- **El pago va rápido y sin drama.** Una frase y avanzas; si te detienes ahí, el jurado se pregunta por qué no funciona.
- **Transición de salida** hacia el Beat 3 del pitch (innovación): al ver "Reserva confirmada", levantas la vista → *"lo que acaban de ver son tres tecnologías que nadie más junta en el Perú…"*
- **Cronométralo con el video corriendo, no leyendo.** El screencast marca el ritmo; narras encima.

## 7. La tarea (antes de la próxima mentoría)
1. **Rearmar el deck a 7 slides + apéndice** con esta estructura.
2. **Grabar UNA corrida completa de 5 minutos en video, con la demo en vivo real**, y verla de vuelta. El video no miente: vas a ver dónde te pasas de tiempo y dónde la demo se traba.
3. **Grabar el video de respaldo de la demo** y conseguir hotspot.
4. **Escribir a la FDA** para confirmar tiempo exacto, Q&A y condiciones técnicas del Demo Day.
