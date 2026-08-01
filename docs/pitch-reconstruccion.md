# Reconstrucción del pitch de Finde — eje "Capa de Confianza"

- **Fecha:** 2026-07-10
- **Origen:** un mentor dijo que el pitch no hace sentir real la problemática. Investigación propia + análisis office-hours.
- **Decisión de eje:** el corazón del pitch es la **capa de confianza** (ICF + Escudo anti-estafa). El argumento de caja de la agencia (costo fijo → variable) es lo que la hace irresistible para la oferta.
- **Etapa:** preincubación / pre-MVP (eTEC 2026). Se puede **explicar y demostrar con prototipo** el trust score; NO afirmar datos operativos reales que no existen.

---

## 1. Diagnóstico — por qué el pitch no convencía

El error central: la problemática se cuenta desde la **moral** ("formalizar el Perú") y no desde el **bolsillo** de quien paga. La informalidad es el *contexto*, no el *dolor*.

Cuatro correcciones (las últimas dos van más allá de la investigación original):
1. **Problema económico, no moral.** Mostrar la caja de la agencia sangrando, no el discurso de ministerio.
2. **El 20% como ahorro, no como precio.** Anclarlo contra el costo real de conseguir un cliente hoy.
3. **El trust score con señales de comportamiento es humo hoy** (0 transacciones). v1 = solo capa registral; comportamiento = "se activa con reservas". Eso es el flywheel de datos, no una debilidad.
4. **El foso no es la fórmula del score** (copiable), es la **red de confianza verificada** (dato + verificación viva + comportamiento acumulado).
5. **Benchmarks = dolor prestado. Las 5 agencias entrevistadas = dolor propio.** Un testimonio grabado con números reales > todas las citas. Máxima palanca, cero código.

---

## 2. Problemática / Solución / Valor agregado

### Problemática (visceral primero, económica después)
**Lado viajero:** Comprar un tour por internet en Perú es una ruleta. En nov-2025, Pax Travel Assist estafó a 40 personas que pagaron hasta S/7,000 por paquetes que nunca existieron: operaba por TikTok/Facebook, cobraba por Yape a cuenta personal, y desapareció aunque no tenía denuncias en Indecopi. La División de Estafas de la PNP persigue decenas de "agencias fantasma" con el mismo libreto.

**Lado agencia formal:** La agencia con RUC y MINCETUR no puede competir contra eso. Quema pauta fija en Meta (+18% IGV desde dic-2024, se venda o no), pierde reservas por no-shows sin adelanto, cobra por Yape personal sin comprobante, y para volumen entrega 20-30% a Viator/GYG que le pagan semanas después. **Ser formal cuesta más y no vende más. La informalidad gana por default.**

**Núcleo:** No existe una capa de confianza entre el viajero peruano y la agencia local. Sin ella, el viajero no distingue lo formal de lo trucho, y la formalidad no tiene recompensa.

### Solución
Finde es esa capa de confianza. Marketplace donde cada agencia está **verificada de forma continua** contra SUNAT y MINCETUR (no un check único), con un **Índice de Confianza visible y explicable**, un **Escudo anti-estafa** que bloquea fantasmas, búsqueda con IA sobre inventario real, y pago en soles. El viajero ve en quién confiar; la agencia formal convierte su formalidad en ventaja de venta. Cobramos 20% solo cuando la agencia vende. *(Custodia: próxima fase.)*

### Valor agregado / moat
No es "hacer un marketplace". Es la **red de confianza verificada del turismo peruano**: oferta verificada + verificación viva contra fuentes oficiales + comportamiento acumulado con cada transacción. Cada reserva mejora el score → mejora el ranking → sube la conversión → atrae más oferta. Flywheel que solo corre para el primero que lo construya en Perú. WhatsApp no puede; una OTA global no atiende el turismo interno; un banco tiene pagos pero no la oferta verificada.

### Reframe del 20%
"No le quitamos 20% a la agencia. Le cambiamos un costo fijo que le quema la caja — pauta con IGV, no-shows, 20-30% a las OTAs que pagan tarde — por un costo variable que solo aparece cuando ya cobró, en soles, al terminar el tour."

**Valor para la agencia (dos lados):** con Finde **cuesta menos** (20% a éxito, sin costos fijos) **y gana más** (Última Hora llena los asientos que hoy pierde). Finde no solo la protege: la hace ganar.

---

## 3. Índice de Confianza Finde (ICF)

Puntaje 0-100 por agencia, visible al viajero, **explicable** (no caja negra). Hace la confianza legible y la formalidad rentable.

**Capa registral (verificable hoy — la base):**
| Factor | Fuente | Tipo |
|---|---|---|
| RUC activo y habido | SUNAT | Gate (binario) |
| Antigüedad de actividad | SUNAT | Escala |
| Registro MINCETUR/DIRCETUR vigente | Directorio DNPSTC | Binario + fecha |
| Datos completos (rep. legal, CCI, contacto verificado) | Onboarding | Escala |

**Capa de comportamiento ("se activa con las primeras reservas" — roadmap):** cumplimiento, velocidad de respuesta, no-show (inverso), **reseñas verificadas** (solo quien reservó y completó el tour puede reseñar → anti reseñas falsas; **hoy las reseñas de Finde son mock**, se activan con el piloto), disputas. En el prototipo: marcadas como *"pendiente de datos de reservas"*.

**El trío "no se puede fingir":** el **Escudo** caza agencias fantasma · la **verificación viva** caza registros vencidos · las **reseñas verificadas** cazan reseñas falsas. Los tres son la misma idea: *en Finde, la confianza no se puede fingir.* Frase de cierre del beat de innovación.

**Fórmula (transparente):** `ICF = 100 × Σ(wᵢ × fᵢ)`, cada `fᵢ` normalizado 0-1, pesos suman 1. Hoy ~70% registral + 30% comportamiento (arranca neutro). **RUC inactivo/sin habido = gate, no publica.**

**Gate + Score + Vivo:** gate al entrar; score entre las verificadas; **vivo** = re-chequeo periódico, si el MINCETUR vence o el RUC cae, el score baja/suspende en vivo (el momento demo: una agencia que *cae*).

**Ejemplo de demo (agencias inventadas, dicho como prototipo):**
| Agencia (ejemplo) | Situación | ICF |
|---|---|---|
| Andes Explorer | RUC 6 años, MINCETUR vigente, datos completos | 87 · Verificado |
| Cusco Nuevo Tours | RUC formal 4 meses, MINCETUR en trámite | 58 · En verificación |
| "PromoViajes Perú" (fantasma) | RUC nuevo, sin MINCETUR, solo Facebook | 18 · Bloqueada |

---

## 4. Detector de Agencias Fantasma ("Escudo anti-estafa")

Distinto del ICF. ICF puntúa a las legítimas; el Escudo **caza estafadores disfrazados** antes de que dañen. Corre en el registro (gate/flag aguas arriba del ICF).

**Señales (motor de reglas v1; ML con datos después):**
- RUC creado hace poco + paquetes de alto valor.
- Ofrece tours sin registro MINCETUR.
- Nombre comercial no coincide con el titular del RUC.
- Solo redes sociales, sin datos verificables.
- Intenta redirigir el pago fuera de la plataforma / a cuenta personal.
- Contacto sin verificar; velocidad anómala (muchos tours caros de golpe).

**Salidas:** bloqueo duro (patrón claro) o revisión manual (sospechoso).

**Ángulo jurado:** "El ICF premia a las buenas; el Escudo caza a las malas. Pax Travel Assist habría sido bloqueada: RUC de días, sin MINCETUR, marca que no coincide con el titular, pago redirigido." Cierra el bucle problema→solución. Argumento B2G: haces el control de fraude que el Estado no puede.

**Honestidad:** v1 = reglas (real). No decir "modelo ML de fraude" que no existe.

---

## 5. Otros diferenciadores
- **Ranking ponderado por confianza:** `relevancia_semántica × ICF × disponibilidad`, no solo similitud de embeddings. "No te mostramos el más barato, sino el más confiable y disponible."
- **Última Hora (motor de cupos) — próxima fase:** detecta salidas próximas con asientos libres y genera ofertas de última hora / avisa a viajeros cercanos. Regla simple: `si (fecha_salida − ahora < X h && cupos_libres > 0) → publica oferta`. Valor de **crecimiento** para la agencia (recupera capacidad ociosa). No es moat (copiable), pero es el argumento de "te hago ganar".
- **Roadmap adicional:** sugerencia de precios con IA.
- **No soltar lo que ya existe y es real:** búsqueda semántica + quechua persistido. Bajan a apoyo del ICF, no protagonistas.

---

## 6. Reestructura del pitch (eje confianza) — un solo hilo, 7 beats
1. **El problema — dos víctimas:** viajero (Pax Travel Assist) + agencia formal (la caja de Rosa). Un solo beat, señalizado. Sin mamá como personaje; se conserva la pregunta "¿será seguro?".
2. **Demo:** el MVP real en vivo (búsqueda IA · agencia verificada · quechua · reserva) → y **encima**, el prototipo del ICF + Escudo (verificación viva + fantasma bloqueado).
3. **Modelo:** reframe del 20% "a éxito vs. costo real" + Última Hora.
4. **Impacto:** formaliza · protege · descentraliza y sostiene (ambiental/social/cultural).
5. **Equipo:** negocio + tecnología, credenciales reales.
6. **Tracción + ask:** 80% intención · MVP en vivo · 3 agencias interesadas; ask concreto.
7. **Cierre:** "¿será seguro?" → "¿está en Finde? Resérvalo."

---

## 7. Framing honesto (la línea)
- ✅ "Así funciona nuestro Índice de Confianza. Prototipo con agencias de ejemplo para ver el mecanismo."
- ❌ "Estas agencias tienen este score calculado con su tasa real de no-show."
- Comportamiento en el ICF, ML de fraude, custodia, agente WhatsApp, verificación IA continua = **"próxima fase"**.

---

## 9. Guion nuevo eje — palabra por palabra

### Beat 1 · El problema — dos víctimas (~70s)
**[Pantalla: «¿Será seguro?»]**
> "En el Perú, reservar un tour es un acto de fe. La pregunta siempre es la misma: *¿será seguro?* Y esa desconfianza tiene **dos víctimas.**"

**[El viajero — Pantalla: titular real de Pax Travel Assist]**
> "El viajero. En noviembre, **Pax Travel Assist estafó a 40 personas:** paquetes que nunca existieron, pago por Yape a cuenta personal, hasta **7,000 soles** — y desapareció sin una sola denuncia en Indecopi. La Policía persigue decenas de estas 'agencias fantasma'. El viajero no tiene cómo distinguir la real de la trucha."

**[La agencia formal — Pantalla: la "caja" de Rosa]**
> "Y del otro lado, **Rosa**, con RUC y registro MINCETUR, que no puede competir contra eso: quema pauta con IGV (se venda o no), pierde reservas por no-shows, cobra por Yape personal, y entrega hasta **30% a las OTAs**. **Ser formal le cuesta más y no le vende más.**"

**[al jurado]** "No existe una capa de confianza entre los dos. **Por eso la informalidad gana.**"
**[transición]** "Finde es la capa de confianza que le faltaba a los dos."

### Beat 2 · Demo: el MVP real + la capa de confianza (~90s)

**Parte A — lo que YA funciona (en vivo). Recupera el MVP real + buscador IA + quechua.**
**[transición desde Rosa]** "Y Finde ya resuelve esto. No es una idea: está en producción. Mírenlo."
**[Pantalla: finde.pe en vivo]**
> "El viajero busca en lenguaje natural — 'algo de aventura cerca de Lima que no sea lo de siempre' — y la IA razona y le recomienda, solo tours reales del catálogo. No inventa. Somos la primera plataforma de tours **AI-native** del Perú."
> "Entra a un tour: **agencia verificada** contra SUNAT y MINCETUR."
> "Toca el toggle: el tour completo en **quechua**, en los 40 tours. Único en LATAM."
> "Y reserva, en soles."
**[al jurado]** "Todo esto **ya funciona hoy.** Eso es lo que casi nadie en esta sala trae: un producto real."

**Parte B — lo que construimos ENCIMA (prototipo). El foso.**
> "Y sobre ese producto real, estamos construyendo lo que nos hace únicos: una **capa de confianza medible.** El Índice de Confianza."
**[señalas puntaje + desglose]**
> "Un puntaje del 0 al 100 por agencia, y no es una caja negra: **se explica.** Se calcula contra fuentes oficiales — RUC en SUNAT, antigüedad, registro MINCETUR. Es un prototipo con agencias de ejemplo, pero el mecanismo corre sobre datos reales."
**[verificación viva]** "Y es **vivo:** si el registro de una agencia vence, su puntaje cae solo."
**[el Escudo]** "Más un **Escudo** que bloquea a los fantasmas. ¿Recuerdan a Pax Travel Assist? RUC de días, sin MINCETUR, pago a cuenta personal. **Con Finde, bloqueada.**"
**[moat, al jurado]** "Eso no es un marketplace. Es la **red de confianza del turismo peruano**, y se hace más fuerte con cada reserva. Eso es lo que no se copia."

### Notas de entrega
- Abre con la pregunta "¿será seguro?" y salta directo al dato duro de Pax (crudo, grave). Muestra el titular real del caso. Señaliza "dos víctimas" para que no se disperse.
- "Rosa" úsala REAL si consigues testimonio grabado (números de pauta/no-shows). Nombre y voz real > personaje.
- La caja de Rosa debe verse sangrar (costos apilándose en pantalla).
- Beat innovación: baja la velocidad, "explicable" es la palabra clave; la agencia que "cae" es el momento visual (pausa); el callback a Pax cierra problema→solución; termina en el moat mirando al jurado.

### Beat 3 · Modelo: reframe del 20% (~30s)
> "¿Y cómo ganamos? Cobramos 20% de comisión, pero **solo cuando la agencia vende.**"
**[Pantalla: costo fijo vs. variable]**
> "Acuérdense de Rosa. Hoy ya paga eso y más: 20 a 30% a Viator o GetYourGuide, que le pagan semanas después. O quema pauta fija con IGV, que se paga venda o no."
**[al jurado]** "No le quitamos 20%. Le cambiamos un costo fijo que le quema la caja por uno variable que solo aparece **cuando ya cobró**, en soles, apenas termina el tour. **El riesgo cambia de lado.**"
**[+ próxima fase]** "Y no solo le cuesta menos: con **Última Hora** llenamos los asientos que hoy salen vacíos. La agencia gana con Finde, no solo ahorra."

### Beat 4 · Impacto en turismo (~30s)
> "Y esta capa de confianza es, en el fondo, una herramienta de política turística. **Formaliza:** por primera vez, ser formal vende más. **Protege:** bloquea las estafas que hoy golpean al viajero peruano. **Descentraliza y sostiene:** lleva demanda a regiones más allá de Lima y Cusco — menos overtourism, economías locales, guías certificados y el quechua."
> "Es nuestra respuesta directa al desafío: turismo innovador y **sostenible** — ambiental, social y cultural — alineado con la Nueva Ley General de Turismo."

### Beat 5 · Equipo (~28s)
> "Somos dos, y somos el equipo completo para construir esto: negocio y tecnología."
> "Yo, Jose: vengo de LATAM Airlines, conozco la industria de viajes por dentro, y llevo el producto y el negocio."
> "Franco: ingeniero de sistemas con maestría en Dirección de TI, 8 años liderando productos digitales, y con su propia consultora tecnológica desde 2018. Él construyó la plataforma."
**[al jurado, pausa]** "15 años de amistad y de proyectos juntos. Todo lo que acaban de ver lo hicimos nosotros dos, sin contratar a nadie."

### Beat 6 · Tracción + ask (~24s)
> "¿Le importa a alguien? 25 entrevistas, 20 viajeros y 5 agencias: el 80% usaría Finde en un viaje que ya tiene en mente."
> "El MVP está en producción, en finde.pe, y ya tenemos 3 agencias reales interesadas en sumarse. Somos pre-comerciales; el piloto valida la primera venta."
**[el pedido]** "Buscamos el acompañamiento para dar el salto: de MVP a nuestro primer piloto transaccional en Lima."

### Beat 7 · Cierre (~15s)
**[viene del equipo]**
> "La pregunta de todo viajero peruano es «¿será seguro?». Finde existe para que desaparezca."
**[pausa, al jurado]** "Que ya no sea «¿será seguro?», sino: «**¿está en Finde? Resérvalo.**» Somos Jose y Franco. Gracias."

### Running order completo — 5 min, un solo hilo
| # | Beat | Tiempo | Criterio |
|---|---|---|---|
| 1 | El problema — dos víctimas (Pax viajero + Rosa agencia) | ~70s | setup/mercado |
| 2 | Demo: MVP real (IA+quechua) + ICF/Escudo prototipo | ~90s | Innovación 25% |
| 3 | Modelo: reframe 20% (+ Última Hora) | ~30s | — |
| 4 | Impacto en turismo | ~30s | Impacto 25% |
| 5 | Equipo | ~25s | Equipo 20% |
| 6 | Tracción + ask | ~20s | Mercado/Escal. |
| 7 | Cierre (bookend con "¿será seguro?") | ~15s | — |

Total ~280s. **Un solo hilo:** problema (2 víctimas) → producto + foso → por qué la agencia entra → impacto → equipo → tracción → cierre. Sin mamá como personaje; se conserva la pregunta "¿será seguro?" y el bookend. Si te pasas: recorta el lado agencia del beat 1; nunca el demo. Números honestos: 3 agencias interesadas · MVP en vivo · 0 ventas.

### Prototipo que Franco debe construir para el beat 3
1. Vista del ICF con desglose (puntaje + factores registrales).
2. Agencia que "cae" (toggle/animación: vigencia vence → score baja → badge cambia).
3. Ejemplo de fantasma bloqueado (ficha tipo Pax Travel Assist marcada por el Escudo).
Con datos de ejemplo, honesto.

## 11. Impacto esperado en el turismo — KPIs

Respuesta a la pregunta de los mentores ("¿cuánto esperan impactar?"). Tres niveles, cada uno con un KPI medible en el piloto. Dicho como **meta**, no como logro.

- **Viajero — confianza (y expande el mercado):** al resolver la confianza no solo repartimos reservas; convertimos al viajero que hoy no se anima a reservar online por miedo. *KPI: % que declara reservar con más confianza (encuesta post-reserva); el 80% de intención ya es evidencia.*
- **Agencia — formalización + servicio:** el sello hace que ser formal venda más (incentivo a formalizarse); el ICF + reseñas + strikes crean presión de calidad → mejor servicio. *KPIs: # agencias formalizadas/verificadas · rating promedio · caída de no-shows.*
- **Destino — descentralización + sostenibilidad:** demanda a regiones = ingreso descentralizado + alivio de overtourism (ambiental), economías locales y guías certificados (social), quechua (cultural). *KPI: % de GMV a destinos fuera de Lima-Cusco.*

**El "cuánto" (honesto, atado al SOM):** Año 1 = 5,000 reservas → **~S/480,000 liberados a agencias locales formales** (80% de S/600K de GMV). 100% del catálogo verificado por diseño.

**Frase para mentores:** *"Nuestro impacto se mide en tres cosas: cuántas agencias se formalizan porque ser formal ahora vende, cuánto ingreso llega a regiones fuera de Lima y Cusco, y cuántos viajeros reservan con confianza en vez de a ciegas. Al resolver la confianza no solo repartimos el mercado, lo hacemos crecer."*

Va como **slide de apéndice** (Q&A), no en los 5 min. En el deck: slide 12.

## 10. Deck — blueprint nuevo eje (confianza)

Una idea por slide, texto mínimo. Slide 5 = **MVP real en vivo/screencast**; slides 6-7 = prototipo del ICF.

| # | Slide | Titular | Beat |
|---|---|---|---|
| 1 | Hook | «¿Será seguro? Revísalo tú.» | 1 |
| 2 | Problema viajero | Reservar un tour es un acto de fe (Pax Travel Assist) | 1 |
| 3 | Problema agencia | Ser formal cuesta más y no vende más (caja de Rosa) | 2 |
| 4 | Solución | La capa de confianza que falta (flujo roto vs. Finde) | 3 |
| 5 | **MVP en vivo (REAL)** | Esto ya existe · búsqueda IA · agencia verificada · quechua · reserva | 3-A |
| 6 | ICF (prototipo) | Y encima: Índice de Confianza · explicable | 3-B |
| 7 | Vivo + Escudo (prototipo) | La confianza es viva · fantasma bloqueado | 3-B |
| 8 | Modelo | 20%, solo cuando vende (+ Última Hora) | 4 |
| 9 | Impacto | Formaliza · Protege · Descentraliza y sostiene | 5 |
| 10 | Equipo | Negocio y tecnología (credenciales reales) | 6 |
| 11 | Tracción + ask | 80% · MVP en vivo · 3 agencias + pedido | 7 |
| 12 | Cierre | «¿Está en Finde? Resérvalo.» | 8 |

**Apéndice (oculto):** impacto esperado/KPIs · **propuesta de valor** (viajero/agencia) · competencia · proyección financiera · plan del piloto.

**Cambio clave (recuperado):** el **MVP en vivo real** (búsqueda IA + quechua + verificación + reserva) vuelve como **prueba de ejecución** (slide 5), ANTES del prototipo del ICF (6-7). El producto real es tu mayor ventaja en preincubación; no se reemplaza con capturas.

**Prioridad de construcción #1:** el prototipo del ICF (slides 6-7).

## 8. Qué construir / próximos pasos (foco)
1. **Testimonio grabado de 1 agencia con números reales** (pauta/mes, no-shows). Cero código, máxima palanca.
2. **ICF registral + verificación viva**, con la demo de la agencia que "cae". Una cosa, impecable.
3. **Escudo anti-estafa v1 (reglas)** + el ejemplo Pax Travel Assist en lámina.
4. Pendiente: reescribir el guion del beat de innovación (ICF) palabra por palabra.
