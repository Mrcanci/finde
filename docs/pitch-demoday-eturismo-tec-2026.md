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

## 9. Guion del hook y del cierre — palabra por palabra

El cierre bookendea con el hook (vuelve a la frase de la mamá): hace que el pitch se sienta una historia, no una lista de features.

### Hook (~50s)

**[Pantalla: la frase de la mamá]**
> "«¿Será seguro? Revísalo tú.» Eso me decía mi mamá cada vez que encontraba un full day en Facebook."

**[pausa 1s]**
> "Y tenía razón en desconfiar. Así se reserva un tour en el Perú hoy:"

**[Pantalla: el chat del Yape]**
> "'Full day Paracas, 89 soles, últimos cupos.' Preguntas si son formales. Te dicen: 'sí señito, yapea al 987 a nombre de J. Ramírez para separar.' Y le pagas a un desconocido. Sin comprobante. Sin protección."

> "Seis de cada diez agencias en el Perú operan en la informalidad. Nueve de cada diez reservas ocurren así, a ciegas. En nuestras entrevistas, ocho de cada diez viajeros no pudo verificar si la agencia era formal."

**[al jurado, más lento]**
> "Reservar un tour en el Perú es un acto de fe. Nosotros lo volvemos una decisión informada. Y no es una idea en papel: está en producción, ahora mismo. Miren."

**[→ arranca la demo sin pausa]**

### Cierre (~15s)

**[viene del beat de equipo, tras "lo construimos nosotros dos"]**
> "Finde ya existe. En producción, en finde.pe, hecho por nosotros dos. Lo que pedimos de este programa es el acompañamiento para dar el último salto: de MVP a nuestro primer piloto con ventas reales en Lima."

**[pausa, al jurado]**
> "Que la pregunta de mi mamá ya no sea «¿será seguro?»."

**[más lento, mic-drop]**
> "Sino: «¿está en Finde? Resérvalo.» Gracias."

### Notas de entrega
- El hook abre con vulnerabilidad, no con datos. La línea de la mamá desarma; dila despacio. Los números vienen después.
- El chat del Yape dilo con complicidad/humor; cuando el jurado se ríe reconociéndolo, ganaste el problema.
- "Está en producción, ahora mismo. Miren." es el puente al demo: dilo y arranca de inmediato, sin aire muerto.
- Termina en «Resérvalo» + "Gracias". No agregues, no resumas.
- El pedido es específico a propósito ("de MVP a primer piloto con ventas reales"): muestra que sabes tu siguiente paso. Mucho más fuerte que "queremos ganar".

## 10. Guion de impacto y equipo — palabra por palabra

Los dos criterios pesados que más fácil suenan genéricos. Clave: especificidad peruana concreta.

### Beat 4 · Impacto en el turismo (~42s)

**[Pantalla: Formaliza · Descentraliza · Sostiene]**
> "Finde no solo le resuelve al viajero. Mueve tres palancas del turismo peruano."
> "**Formaliza.** Hoy formalizarse cuesta y no vende. Con Finde, el sello Verificado convierte el RUC y el registro MINCETUR en ventaja comercial: la agencia formal aparece primero y vende más. Por primera vez, ser formal es negocio."
> "**Descentraliza.** La IA empuja demanda hacia destinos regionales, más allá de Lima y Cusco: Choquequirao en vez de Machu Picchu, San Fernando en vez de Ballestas. Menos overtourism, más ingreso para regiones que hoy no reciben nada."
> "**Sostiene.** Economías locales, guías certificados, y el quechua que acaban de ver."
> **[al jurado]** "Es nuestra respuesta directa al desafío del concurso: experiencias innovadoras y sostenibles con tecnología emergente en el núcleo. Alineado con la Nueva Ley General de Turismo."

### Beat 6 · Equipo (~28s)

**[Pantalla: Jose + Franco]**
> "Somos dos. Yo, Jose: vengo de LATAM Airlines, conozco la industria de viajes por dentro, y llevo el producto y el negocio."
> "Franco: ocho años de ingeniería de sistemas. Él construyó esta plataforma. La IA, la búsqueda semántica, el quechua, todo."
> "Quince años de amistad y de construir juntos."
> **[pausa antes de la última línea]** "Todo lo que acaban de ver, este MVP en producción, no lo tercerizamos ni contratamos a nadie. Lo construimos nosotros dos."

### Notas de entrega
- Impacto: baja la velocidad en *"por primera vez, ser formal es negocio"* — es el objetivo de política pública del MINCETUR resuelto con producto.
- Nombra destinos concretos (Choquequirao vs. Machu Picchu); la especificidad convence más que "destinos regionales".
- La Ley 32392: una mención al final, sin forzar.
- Equipo: LATAM es la credencial de turismo ("la industria de viajes por dentro"); señala operación y escala.
- *"Lo construimos nosotros dos"* = prueba de ejecución. Míralos, pausa antes, sin apuro. Tu mayor diferenciador de equipo en una sala de conceptos.

## 11. Guion de innovación y tracción — palabra por palabra

Los dos beats de transición. Van comprimidos.

### Beat 3 · Innovación (~40s)

**[Pantalla: 3 pilares / "AI-native"]**
> "Lo que acaban de ver son tres tecnologías que nadie junta en el Perú."
> "**Una:** búsqueda semántica sobre inventario real. La IA razona en lenguaje natural, pero solo sobre tours que existen. No alucina."
> "**Dos:** verificación formal. Hoy validamos a mano el RUC en SUNAT y el registro MINCETUR de cada agencia; cada sello es real. El siguiente paso: agentes de IA que lo hacen continuo, en el tiempo. La confianza como dato, no como promesa."
> "**Tres:** quechua persistido en los 40 tours."
> **[al jurado]** "No es un chatbot pegado a un marketplace. Es la primera plataforma de tours AI-native del Perú."

**Ojo honestidad:** la verificación con IA continua es **roadmap, no está viva** (hoy es manual). Misma trampa que el pago — no digas "agentes que validan" como si ya corrieran. El framing "hoy a mano, el siguiente paso son agentes" es más fuerte: el trabajo manual prueba que cada sello es real.

### Beat 5 · Tracción + mercado (~36s)

**[Pantalla: los 3 números]**
> "¿Le importa a alguien? Entrevistamos a 25 personas, 20 viajeros y 5 agencias: el 80% usaría Finde en un viaje que ya tiene en mente."
> "El MVP está en producción, en finde.pe, funcionando. Ya tenemos 3 agencias reales interesadas en sumarse. Somos pre-comerciales; el piloto valida la primera venta."
> "El mercado: solo los millennials de Lima que reservan en línea son 700 mil. Nuestra meta del Año 1 es menos del 1% de eso, y ya es rentable. Cobramos 20%, y solo si la agencia vende."

**Notas:** va rápido, es el beat que comprimes. No te disculpes por no tener ventas (en etapa temprana es lo esperado; decirlo de frente da credibilidad). Aterriza *"y solo si la agencia vende"* — tu modelo pro-agencia en cuatro palabras.

---

## Guion completo — resumen de tiempos

| Beat | Contenido | Tiempo | Sección |
|---|---|---|---|
| 1 | Hook + problema | ~50s | §9 |
| 2 | Demo (grabada + narrada) | ~90s | §8 |
| 3 | Innovación | ~40s | §11 |
| 4 | Impacto en turismo | ~42s | §10 |
| 5 | Tracción + mercado | ~36s | §11 |
| 6 | Equipo | ~28s | §10 |
| 7 | Cierre | ~15s | §9 |
| | **Total** | **~5:01** | |

Ajuste fino: si te pasas, el primer recorte es el Beat 5 (mercado), luego el Beat 3. Nunca recortes el hook, la demo ni el cierre.

## 12. Orden del deck y su lógica

El deck cuenta una historia que responde 5 preguntas en orden:

| Pregunta | Slides |
|---|---|
| 1. ¿Cuál es el dolor? | 1 (hook) → 2 (problema) |
| 2. ¿Qué hiciste? | 3 (demo) |
| 3. ¿Por qué es innovador? | 4 (innovación) |
| 4. ¿Por qué le importa al Perú? | 5 (impacto) |
| 5. ¿Funciona y quién lo hizo? | 6 (tracción) → 7 (equipo) |
| → Pedido | 8 (cierre) |

**Decisiones de orden (y por qué):**
1. **Demo temprano (slide 3), no al final.** Es tu activo más fuerte; gana la atención antes de pedirla. Muestras primero, explicas después.
2. **Innovación antes que impacto.** Primero el *cómo* (tech real), luego el *por qué importa*. El impacto pega más si ya entendieron que la tecnología no es humo.
3. **Tracción/mercado después del impacto.** Los números aterrizan mejor con el jurado ya comprado emocionalmente. Abrir con tamaño de mercado = hoja de cálculo.
4. **Equipo al final (slide 7).** Para este jurado, la credibilidad del equipo ES que 2 personas construyeron lo que vieron. Funciona como remate del demo. El hilo se planta al cerrar la demo (*"lo construimos nosotros dos"*) y se cobra en la slide 7. Regla: no abras con quién eres, ciérralo con quién eres, tras probar qué eres capaz de hacer.

**Fijo, no reordenar:** hook (1) y cierre (8) son un par (bookend con la mamá). Mover uno sin el otro rompe el círculo que convierte 8 slides en una historia.

## 13. Contenido exacto de las slides a rehacer (deck v2)

Decisión: la grilla de 6 capturas queda como **slide de backup oculta** (plan B si el demo en vivo falla). Anexos solo se muestran si el jurado pregunta.

### Slide 3 · Problema (comprimida)
- Kicker: `EL PROBLEMA`
- [chat del Yape, grande]
- Dato único: **6 de 10 agencias operan en la informalidad** · fuente chica: CANATUR / APAVIT
- Cierre: **Reservar un tour en el Perú es un acto de fe.**
- Elimina: "70% reservó así · 8 de 10 no pudo verificar" y "sin comprobante · sin protección". La slide 2 vieja ("acto de fe") desaparece; su frase baja acá.

### Slide 4 · Demo + backup
- **Slide 4 (presentada):** screencast a pantalla completa. Único texto: header `finde.pe · en producción`. Sin bullets.
- **Slide 4-BACKUP (oculta):** la grilla de 6 capturas actual. Cambia la nota del pago a `Pago con Yape en soles · custodia en integración final`. Márcala "skip slide" en Keynote/PPT.

### Slide 5 · Tecnología → 3 pilares
- Kicker: `LA TECNOLOGÍA` · Titular: **La primera plataforma de tours AI-native del Perú**
- **Búsqueda semántica** — La IA razona en lenguaje natural, solo sobre tours reales. No alucina.
- **Verificación formal** — Hoy a mano (SUNAT + MINCETUR); el siguiente paso, agentes de IA continuos. Confianza como dato.
- **Quechua persistido** — Los 40 tours, en quechua. Único en LATAM.
- Footer chico: IA generativa + búsqueda semántica sobre inventario real · serverless · construido por el equipo.
- Elimina los párrafos y el bloque "Siguiente fase / WhatsApp 24/7".

### Slide 6 · Tracción + mercado (fusiona 7 + 8 + 1 línea de 9/10)
- Kicker: `TRACCIÓN Y MERCADO`
- **80%** — usaría Finde en un viaje que ya tiene en mente (25 entrevistas: 20 viajeros + 5 agencias)
- **MVP en vivo + 3 agencias interesadas** — finde.pe en producción, funcionando
- **700 mil** — millennials de Lima que reservan en línea (SAM); meta Año 1 <1% = 5,000 reservas
- Línea del modelo: **Comisión 20%, solo si la agencia vende. Rentable desde el Año 1.**
- Nota chica: Pre-comerciales: el piloto valida la primera venta.
- Al anexo: desglose S/24/S/96 (modelo) y tablas de viabilidad.

### Resto
- Slide 1 (hook) y 6-impacto: quedan casi igual, solo apretar.
- Slide 11 vieja: **separar** en Equipo (7) + Cierre (8); el "¿está en Finde? Resérvalo" va solo en su slide (mic-drop).
- Anexos (ocultos): competencia · proyección financiera · plan del piloto · modelo · viabilidad.

## 14. Banco de preguntas de Q&A (Demo Day)

**Reglas:** (1) responde en una respiración y para; (2) en trampas, reconoce rápido, no te defiendas; (3) repártanse por dominio — Jose: negocio/mercado/impacto/equipo · Franco: IA/técnica.

### Peligrosas (reconoce y reencuadra)
- **¿Cuántas ventas reales tienen?** → "Cero, y es a propósito. Primero validamos demanda y captamos oferta: 80% de intención en entrevistas y 3 agencias reales interesadas en sumarse. La venta se activa al conectar la pasarela, en integración final. Construir pagos antes de validar demanda es resolver un problema que aún no existe." [flip → anexo Plan del Piloto]
- **¿La pasarela ya la eligieron? ¿Soporta custodia?** → "La custodia no depende del gateway. El gateway solo cobra; la retención y liberación post-tour las manejamos nosotros con el payout quincenal. Culqi es candidata (Yape/Plin/soles); verificando con Culqi, Izipay y Niubiz antes de comprometer."
- **¿No es solo ChatGPT con una base de datos?** (Franco) → "No. Búsqueda sobre embeddings propios con pgvector, sobre inventario real. Claude razona solo sobre tours que existen: no alucina. Quechua persistido en los 40 tours, no runtime. Infraestructura de IA de punta a punta, construida por nosotros."
- **¿La verificación con IA ya funciona?** → "Hoy a mano: RUC en SUNAT y registro MINCETUR de cada agencia. Cada sello es real. El siguiente paso es automatizarla con agentes continuos. No la vendemos como si ya corriera."
- **¿Qué evita la desintermediación (que coordinen por fuera)?** → "Con custodia no hay nada que saltar: el viajero le paga a Finde, no a la agencia. El valor es descubrimiento + verificación + protección. En el piloto sin pasarela coordinamos por WhatsApp y trackeamos con el código FINDE cuánto se cae. Eso lo mide el piloto."

### De fuerza (extiéndete un poco)
- **¿Qué impide que Viator/Civitatis los copien?** → "Pagos locales en soles (Yape/Plin), verificación formal peruana (SUNAT/MINCETUR), contenido regional. Ellos apuntan al turista extranjero; nosotros al interno, que no atienden."
- **¿Y si Yape o un banco entra?** → "Un banco tiene distribución y pagos, no la oferta: agencias verificadas, catálogo curado, la capa de IA, contenido regional. Ese es el trabajo difícil, ya lo hicimos. Sería más socio que competidor."
- **¿20% no es caro?** → "Es el piso del mercado (Viator 25%, GYG hasta 30%), todo incluido y a éxito. La agencia ya gasta 15-25% en pauta con IGV, vendedores y pasarela, venda o no. El 20% reemplaza ese gasto y solo existe con una venta. El riesgo cambia de lado."
- **Si ganan la beca, ¿qué harían?** → "De MVP a piloto transaccional: pasarela con custodia, comprobantes SUNAT, y las primeras agencias a sus primeras 20 reservas reales en Lima."

### Segundo nivel
- **¿Cómo consiguen agencias?** → "Supply first, a mano. Ya tenemos 3 reales interesadas en sumarse. Gancho: el sello (ser formal vende más). Piloto ~50 en Lima, Cajamarca ancla regional. Cero alta, cero comisión en piloto."
- **¿Y los viajeros?** → "Piloto: círculo cercano + tráfico de la landing. Adquisición masiva después; no gastamos en demanda hasta tener oferta que buscar."
- **¿Cómo miden el piloto?** → "5 agencias activas, 20 reservas trackeadas, 80% de coordinación efectiva, y feedback de si pagarían comisión."
- **¿Por qué ahora?** → "Yape/Plin masificaron el pago en soles, la IA generativa hizo viable búsqueda semántica y quechua barato, el turismo interno creció post-pandemia. Hace 3 años dos personas no lo construían."
- **¿Mayor riesgo?** → "Oferta comprometida: agencias que publiquen y atiendan bien. La tech está; el riesgo es ejecución comercial. Por eso el piloto es chico y medible."
- **¿Levantan capital?** → "Todavía no. Pipeline Startup Perú; aceleradoras con tracción del piloto. Primero la venta, después levantamos con datos."
- **¿El margen S/19 aguanta escala?** → "El costo de pasarela es % fijo del ticket: el margen por reserva es estable. Lo que se diluye es el costo fijo por reserva. Equilibrio baja de 27% a 5%."
- **¿El quechua lo usan?** → "Diferenciación e inclusión más que volumen. Nadie lo tiene; para el turismo descentralizado es respeto cultural. Activo de marca y misión."
- **¿Tiempo completo? ¿Solo dos?** → "Dos construimos el MVP; la IA hace el trabajo pesado. Plan 1→3→6 con el volumen." (**Adaptar la parte de dedicación a la verdad.**)

## 7. La tarea (antes de la próxima mentoría)
1. **Rearmar el deck a 7 slides + apéndice** con esta estructura.
2. **Grabar UNA corrida completa de 5 minutos en video, con la demo en vivo real**, y verla de vuelta. El video no miente: vas a ver dónde te pasas de tiempo y dónde la demo se traba.
3. **Grabar el video de respaldo de la demo** y conseguir hotspot.
4. **Escribir a la FDA** para confirmar tiempo exacto, Q&A y condiciones técnicas del Demo Day.
