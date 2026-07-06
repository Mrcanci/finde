Finde · Reglas de Negocio v1.3	Julio 2026 · Confidencial

**FINDE**

Marketplace de Tours y Experiencias en Perú

────────────────────────────────────────

**REGLAS DE NEGOCIO**

Comisiones · Custodia de pagos · Cancelaciones · Disputas · Compliance

Versión 1.3 · Julio 2026

*Documento Confidencial*

# Historial de cambios v1.2 → v1.3

| **Cambio** | **Antes (v1.2)** | **Ahora (v1.3)** | **Sustento** |
| --- | --- | --- | --- |
| Comisión | 15% base + take rate blended 18-22% | **20% todo incluido, a éxito** | Investigación de mercado (Viator 25%, GYG 20-30%, Airbnb 20%) + estudio de aceptación con agencias |
| Ticket promedio | S/150 | **S/120** | Promedio ponderado de precios reales (tours sueltos Lima S/80-150; paquetes >S/300) |
| Modelo de revenue | Triple motor (marketplace 60% + SaaS 25% + B2G 15%) | **Comisión única 20% (Años 1-3)**; SaaS y B2G pasan a exploración futura | Modelo financiero validado con benchmarks; foco en un solo motor |
| Modelo de cobro | Merchant of record (implícito) | **Custodia total explícita**: el viajero paga el 100% a Finde; se libera a la agencia al completarse el tour | Decisión estratégica: protección de ambos lados + poder de mediación (modelo de señal/adelanto evaluado y descartado) |
| PagoEfectivo | Fallback en tabla de pasarelas | **Eliminado** | Contradice el modelo de custodia (pago diferido en efectivo sin trazabilidad) |
| Verificación | "Validación automática vía API" | **Manual en piloto** (validación directa contra SUNAT y MINCETUR); agentes de IA con verificación continua en roadmap | Estado real del producto |
| Economía por reserva | No documentada | **S/24 ingreso − S/5 variable = S/19 margen** | Modelo financiero M6 / e-Turismo TEC |

# 1. Resumen Ejecutivo

| **Principio rector** Finde cobra una **comisión única del 20%, todo incluido y a éxito**: incluye pasarela de pagos, soporte y la demanda que Finde genera. La agencia solo paga cuando concreta una venta. El 20% está en el piso del estándar del mercado (Viator 25%, GetYourGuide 20-30%, Airbnb Experiences 20%) y reemplaza gastos que la agencia ya realiza (pauta con IGV, personal de ventas, pasarela) — con la diferencia de que esos gastos se pagan venda o no venda. |
| --- |

Este documento establece las reglas de negocio completas para la operación del marketplace Finde en Perú: comisión, custodia de pagos, políticas de cancelación y reembolso, liquidación a agencias, disputas, verificación, pricing, penalidades y compliance regulatorio peruano.

**Contexto de mercado:** El mercado global de tours vale USD $300B, pero más del 90% de las reservas aún ocurren offline. En Perú, los gremios del sector (CANATUR, APAVIT) estiman que ~6 de cada 10 agencias operan en la informalidad, no existe una plataforma local dominante, y las OTAs globales (Viator, GetYourGuide, Civitatis+Rappi) no aceptan Yape/Plin ni atienden al turismo interno peruano.

**Mercado direccionable (validado para e-Turismo TEC 2026):**

| **Capa** | **Tamaño (personas)** | **Mercado (S/)** | **Metodología** |
| --- | --- | --- | --- |
| TAM | ~8.7 M viajeros | S/1,044 M | 43.5M viajes internos (MINCETUR) × ~20% que incluiría tour pagado × ticket S/120 |
| SAM | ~700,000 | ~S/84 M | Millennials de Lima (28-40, NSE B/C, Ipsos/APEIM) × ~45% que reserva en línea |
| SOM (Año 1) | ~5,000 reservas | S/600,000 | ~400 viajeros reservando al mes — menos del 1% del SAM |

**Parámetros base:** Ticket promedio S/120 (rango S/80-250). Comisión marketplace 20% todo incluido. Custodia total del pago. Liquidación quincenal. Yape/Plin/tarjeta como métodos de pago. Moneda única: soles (S/).

**Validación:** Estudio de aceptación con 25 entrevistas (20 viajeros de Lima + 5 agencias regionales) sobre el MVP real: 80% de intención de uso en un viaje concreto. Iteraciones derivadas: pago protegido (custodia) y comisión replanteada como modelo "a éxito".

## 1.1 Fases del modelo

|  | **Fase 1: Piloto (6 meses, Lima)** | **Fase 2: Crecimiento** |
| --- | --- | --- |
| Agencias objetivo | ~50 agencias activas en el Año 1 (oferta Lima + regiones; Cajamarca como ancla regional) | Escala a nivel nacional |
| Herramientas | Todo habilitado gratis para todas las agencias | Evaluación de tiers (exploración futura, no comprometido) |
| Comisión | 20% todo incluido | 20% base; ajustes solo con evidencia del piloto |
| Retención de seguridad | Sin retención (confianza primero) | Rolling reserve 5-10% para agencias nuevas |
| Descuentos y promos | Sin descuentos automáticos ni códigos | Descuentos por grupo, early bird, last minute, códigos |
| Payout | Transferencia CCI quincenal | CCI quincenal + automatización |
| Soporte disputas | Manual vía WhatsApp | Agente de IA en WhatsApp 24/7 + Case Manager humano |
| Verificación | Manual (validación directa SUNAT/MINCETUR) con sello Verificado | Agentes de IA: validación automática y continua de RUC activo y registro MINCETUR vigente |

| **Estrategia Fase 1** En el piloto, todas las herramientas están habilitadas gratis, no se retiene dinero adicional y no hay descuentos automáticos. El foco es validar la venta real: superar el punto de equilibrio del piloto (34 reservas/mes) y convertir la aceptación validada en transacciones. |
| --- |

# 2. Estructura de Comisión y Economía

## 2.1 Benchmark de comisiones

El 20% de Finde está en el piso del rango del mercado relevante — con la diferencia de que es **todo incluido** (pasarela, soporte y demanda) y **a éxito**:

| **Plataforma** | **Comisión** | **Modelo** | **Notas** |
| --- | --- | --- | --- |
| Viator (TripAdvisor) | 20-25% base | Comisión pura | Accelerate sube hasta 30-35%. Cobra US$29/listing nuevo |
| GetYourGuide | 20-30% | Comisión pura | Cobra 2% extra por pago quincenal en vez de mensual |
| Klook | 15-35% | Negociado por volumen | 15% solo para atracciones de altísimo volumen |
| Airbnb Experiences | 20% plano | Comisión plana | Modelo relanzado 2025 |
| Civitatis | 20-25% est. | Comisión + Rappi | Principal amenaza en LATAM hispano |
| Rappi (referencia delivery) | 20-25% | Comisión + logística | Referencia local de aceptación de comisiones "a éxito" |
| **Finde** | **20% todo incluido** | **Comisión a éxito** | **Pasarela incluida, en soles, sin costo de alta ni pago por posición** |

**Argumento comercial ante la agencia:** la agencia hoy gasta ~15-25% del ticket en pauta en redes (+18% IGV desde dic. 2024), personal de ventas y pasarela de pagos — y la mayor parte se paga venda o no venda. El 20% de Finde reemplaza ese gasto y solo existe cuando hay una venta concreta. El riesgo cambia de lado.

## 2.2 Qué pasa con cada S/120 que paga un viajero

Desglose económico de una transacción típica (ticket promedio S/120):

| **Concepto** | **Monto (S/)** | **Explicación** |
| --- | --- | --- |
| Precio del tour (paga el viajero) | 120.00 | Precio final que ve el viajero, sin cargos ocultos. Pagado en su totalidad a Finde (custodia) |
| **Comisión Finde (20%)** | **24.00** | Lo que Finde retiene de cada venta |
| Costo variable por reserva | -5.00 | Pasarela de pagos (~S/4, ~3.5% del ticket) + IA en runtime (~S/1) |
| **Margen de contribución Finde** | **19.00** | Por reserva, antes de costos fijos (equipo, infraestructura, marketing) |
| **Pago a la agencia** | **96.00** | La agencia recibe el 80% del precio del tour, liberado al completarse el tour |

| **Regla tributaria crítica (comisión mercantil)** Finde opera bajo el marco de comisión mercantil: solo la comisión (S/24) es ingreso gravable de Finde, no el pass-through completo. Finde emite factura electrónica a la agencia por S/24 + IGV 18% = S/28.32 (solo la comisión). La agencia emite su propio comprobante al viajero por S/120 bajo su régimen tributario. Finde NUNCA factura el valor total del tour. |
| --- |

**Nota sobre el margen:** el costo de pasarela es un porcentaje fijo del ticket, por lo que el margen por reserva NO mejora con la escala — se mantiene estable en ~S/19. Lo que sí se diluye con el volumen es el costo fijo por reserva (equipo + infraestructura repartidos entre más reservas).

## 2.3 Modelo de revenue

**Años 1-3: comisión única del 20%.** El modelo financiero validado se sostiene exclusivamente con la comisión de marketplace. Rentable desde el Año 1 con costos reales de equipo y marketing:

| **Anual** | **Año 1** | **Año 2** | **Año 3** |
| --- | --- | --- | --- |
| Reservas | 5,000 | 40,000 | 120,000 |
| Ingresos (comisión 20%) | S/120,000 | S/960,000 | S/2,880,000 |
| Costos variables (S/5/reserva) | S/25,000 | S/200,000 | S/600,000 |
| Equipo + infraestructura | S/26,000 | S/65,000 | S/122,000 |
| Marketing | S/18,000 | S/72,000 | S/180,000 |
| **Utilidad operativa** | **S/51,000** | **S/623,000** | **S/1,978,000** |

Supuestos: equipo de 1 → 3 → 6 personas (~S/1,500/persona promedio, perfiles junior/practicantes en etapa temprana), infraestructura S/650 → S/900 → S/1,200/mes. Punto de equilibrio del piloto: 34 reservas/mes (costos fijos S/650 ÷ margen S/19). El equilibrio anual pasa de 27% (Año 1) a 5% (Año 3) del volumen.

| **SaaS y B2G — exploración futura (no comprometida)** El tier premium para agencias (S/99/mes) y los servicios B2G municipales que aparecían en v1.2 como "triple motor de revenue" pasan a exploración futura. No forman parte del modelo financiero de los Años 1-3 ni de los compromisos con agencias. Solo se evaluarán con evidencia de volumen y demanda real. |
| --- |

## 2.4 Herramientas para agencias

**Fase 1 (piloto):** todas las herramientas habilitadas sin costo para todas las agencias: perfil de agencia, tours ilimitados, cobros Yape/Plin/tarjeta (vía Finde, en custodia), gestión de reservas, coordinación por WhatsApp.

**Reglas de pricing:** No cobrar listing fee fijo. No cobrar fee al viajero. El costo de pasarela está incluido en el 20% (nunca se traslada como línea aparte a la agencia ni al viajero).

**Estado de implementación (piloto):** el dashboard de Ingresos permanece **oculto** hasta que haya pasarela (sin dinero real no hay nada que mostrar). La política de cancelación está **atada a la bandera del demo (DEMO_PAYMENT_FLOW)**: visible en modo demo — la agencia la elige al crear/editar el tour y el viajero la ve en el paso de pago, el detalle y el voucher —; oculta en modo piloto sin pasarela. Se activa end-to-end (con reembolsos reales) cuando la pasarela entre en producción.

# 3. Política de Cancelación y Reembolso

## 3.1 Por qué toda reserva necesita política de cancelación

| **Importante: la política de cancelación es obligatoria** INDECOPI exige que el consumidor conozca las condiciones de cancelación ANTES de comprar (Código del Consumidor, Art. 18-20). Si Finde no publica política, el viajero puede reclamar reembolso total en cualquier momento y ganaría. La solución: la agencia elige qué política aplicar a cada tour, incluyendo "No reembolsable" para tours con permisos comprados con anticipación. |
| --- |

**Estado de implementación (piloto):** el sistema de 4 políticas existe en el esquema de datos y su UI está atada a la bandera del demo (DEMO_PAYMENT_FLOW): en modo demo es visible en todo el flujo (la agencia la elige al crear/editar el tour; el viajero la ve antes de pagar, en el detalle y en el voucher); en modo piloto sin pasarela queda oculta — sin pago real no hay reembolso real y la coordinación se hace por WhatsApp. Las reglas de esta sección son el diseño vinculante que se activa end-to-end con la pasarela.

## 3.2 Cuatro opciones de cancelación (la agencia elige)

| **Política** | **Cómo funciona el reembolso** | **Ideal para** | **% Catálogo recomendado** |
| --- | --- | --- | --- |
| **FLEXIBLE (recomendada)** | 100% si cancela 24+ horas antes del tour. 0% con menos de 24h o no-show. | City tours, food tours, half-day (Lima, Cusco, Arequipa) | 60-75% |
| **MODERADA** | 100% si cancela 72+ horas antes. 50% entre 72 y 24 horas. 0% con menos de 24h. | Tours día completo, Valle Sagrado, Islas Ballestas, tours con transporte contratado | 15-20% |
| **ESTRICTA** | 100% si cancela 30+ días antes. 50% entre 15 y 30 días. 0% con menos de 15 días. | Inca Trail, Salkantay, Choquequirao, tours multi-día | 5-10% |
| **NO REEMBOLSABLE** | Sin devolución bajo ninguna circunstancia (excepto fuerza mayor o cancelación por la agencia). | Tours con permisos/entradas prepagadas (ej: Machu Picchu con boleto incluido) | 5-10% |

**Regla:** Si la agencia no selecciona una política al crear el tour, se asigna Flexible automáticamente. La política elegida se muestra claramente al viajero ANTES de pagar.

## 3.3 Cancelación por el viajero

- **Dentro de ventana de reembolso:** Se devuelve el monto según la política al método de pago original. Finde NO se queda con su 20% de comisión sobre reservas canceladas dentro de ventana (estándar de la industria). La custodia hace la devolución operativamente simple: el dinero aún está en Finde.

- **Fuera de ventana:** Sin reembolso. La agencia recibe su pago completo menos la comisión.

- **No-show (el viajero no se presenta):** 0% reembolso. La agencia cobra el 100% (menos comisión). La custodia protege a la agencia: el pago ya está garantizado en Finde aunque el viajero no aparezca.

- **Plazo para procesar la devolución:** 5-7 días hábiles.

## 3.4 Cancelación por la agencia

- **Devolución automática del 100% al viajero** al método de pago original, sin importar la política del tour.

- **Cupón de compensación del 10%** del valor de la reserva para el viajero, válido 12 meses.

- **Penalidad a la agencia: 20% del valor de la reserva** descontada del próximo payout, destinada al fondo de garantía Finde.

- **Strike al historial de la agencia** (ver sección 8).

## 3.5 Fuerza mayor y clima

**Situación crítica en Perú:** lluvias noviembre-marzo, huaycos, bloqueos sociales, cierres de rutas por SERNANP. En estos casos:

- El viajero puede reprogramar gratis o recibir devolución del 100%.

- La agencia NO recibe penalidad ni strike.

- Finde NO cobra comisión sobre esa reserva.

- Se requiere documentación verificable: reporte SENAMHI, comunicado oficial, cierre de ruta.

- La agencia debe marcar la cancelación como fuerza mayor con evidencia dentro de 24 horas.

## 3.6 Política en temporada alta

Durante las 6 ventanas de temporada alta (ver sección 7), la política de cancelación se endurece automáticamente:

- Reembolso solo si cancela 7+ días antes del tour.

- 50% de reembolso entre 3 y 7 días antes.

- 0% con menos de 72 horas.

# 4. Custodia de Pagos, Disputas y Garantía Finde

## 4.1 Custodia total: Finde cobra, retiene y luego paga

**Regla central del modelo:** el viajero paga el 100% del tour a Finde (no a la agencia ni a un intermediario). Finde retiene el dinero en custodia y lo libera a la agencia después de completarse el tour (ver liquidación, sección 5). Este modelo — el mismo de Viator, GetYourGuide, Klook y Airbnb — es la base de la confianza en ambos lados:

- **Para el viajero:** no le paga a un desconocido; su dinero está protegido hasta recibir el servicio.
- **Para la agencia:** el cobro está garantizado aunque el viajero no se presente (protección anti no-show).
- **Para Finde:** control total de la transacción → poder real de mediación, devolución y cumplimiento ante INDECOPI. La comisión se cobra por adelantado y garantizada, eliminando el riesgo de desintermediación en el cobro.

| **Decisión registrada: modelo de señal descartado** Se evaluó un modelo de adelanto parcial ("el viajero paga el 20% a Finde como comisión y el 80% en persona a la agencia"). Se descartó por dos razones: (1) desprotege a la agencia ante el no-show, y (2) Finde pierde el control del dinero y con él su poder de mediación — sin custodia, la plataforma no puede dar garantías y no se diferencia de WhatsApp. La fricción del pago total online se mitiga con métodos locales (Yape/Plin), el sello de verificación y la promesa explícita de custodia ("no le pagas al desconocido: le pagas a Finde, que retiene hasta que el tour ocurra"). |
| --- |

## 4.2 Flujo de resolución en 7 pasos

| **Paso** | **Qué pasa** | **Plazo máximo** | **Quién actúa** |
| --- | --- | --- | --- |
| 1 | El viajero reporta el problema por el chat de Finde o formulario | Hasta 72 horas después del tour | Viajero |
| 2 | La agencia recibe la queja y responde | 24 horas para responder | Agencia |
| 3 | Si no se ponen de acuerdo, Finde interviene como mediador | 48 horas para intervenir | Finde |
| 4 | Se recopilan pruebas: chat, fotos, voucher, lo que decía el listing | Durante el proceso | Ambos |
| 5 | Finde toma una decisión aplicando las reglas publicadas | 5 días hábiles | Finde |
| 6 | Se ejecuta: devolución parcial/total al viajero + strike a la agencia si corresponde | Inmediato | Finde |
| 7 | Cualquiera puede apelar presentando nueva evidencia | 30 días para apelar | Parte afectada |

## 4.3 Finde Guarantee (Garantía Finde)

La promesa de Finde al viajero de que su compra está protegida — posible únicamente gracias a la custodia:

- **La agencia no se presenta al tour:** Devolución del 100% + cupón del 15% para otra experiencia.

- **La experiencia fue muy diferente a lo publicado:** Devolución parcial del 30% al 100% según la gravedad.

- **Problema de seguridad comprobado:** Devolución del 100% + suspensión inmediata de la agencia.

- **Cobro incorrecto:** Se corrige y se devuelve la diferencia.

| **Fondo de Garantía Finde** Finde mantiene un fondo equivalente al 1-2% del volumen total de ventas para resolver rápidamente quejas menores (bajo S/300) sin proceso largo. Para montos mayores a S/500, se sigue el proceso completo de mediación con evidencia. |
| --- |

## 4.4 Chargebacks bancarios

**Qué es:** el viajero disputa el cobro directamente con su banco. El banco devuelve el dinero al viajero y se lo quita a Finde a través de la pasarela.

**Cómo se defiende Finde:** presentando pruebas de que el servicio se prestó: voucher de confirmación, captura del chat, confirmación de la agencia. El banco tiene hasta 90 días para resolver.

**Con Yape/Plin es menos común:** el viajero aprueba con OTP, lo que dificulta alegar desconocimiento. Los chargebacks son más frecuentes con tarjetas de crédito.

# 5. Liquidación: Cómo y Cuándo se Paga a las Agencias

## 5.1 Liquidación quincenal

- **Paso 1 — El viajero paga:** paga S/120 por un tour. El dinero entra a Finde vía pasarela y queda en custodia. NO va directo a la agencia.

- **Paso 2 — Se ejecuta el tour:** la agencia realiza el tour. Finde espera 7 días después del tour para dar ventana de reporte al viajero.

- **Paso 3 — Corte quincenal:** Finde consolida las ventas de cada quincena (día 1-15 y 16-fin de mes) y calcula el monto de cada agencia.

- **Paso 4 — Transferencia CCI:** Finde transfiere a la agencia el monto de la quincena, descontando el 20% de comisión, 3 días hábiles después del cierre.

| **Ejemplo práctico** Una agencia vendió 10 tours de S/120 entre el 1 y el 15 de junio (S/1,200 total). Todos los tours ya se ejecutaron. El día 19 de junio, Finde le transfiere S/960 a su cuenta CCI (S/1,200 menos el 20% de comisión = S/240 para Finde). |
| --- |

| **Parámetro** | **Regla Finde** | **Comparación con la competencia** |
| --- | --- | --- |
| Frecuencia de pago | Quincenal (cada 15 días) | Viator, GetYourGuide, Klook: mensual |
| Fechas de corte | Día 1-15 y día 16 al último del mes | Viator: cierre mensual único |
| Día de transferencia | 3 días hábiles post-cierre (aprox. días 4 y 19) | Viator: mensual + 15 días de espera |
| Solo tours ya ejecutados | Sí, tours realizados hace 7+ días | Estándar: nunca pagan antes del tour |
| Método de pago | Transferencia CCI | — |
| Monto mínimo para pagar | S/50 | Viator: US$50 (~S/190) |
| Costo de la transferencia | Finde asume el costo | Estándar Klook/Airbnb |
| Retención de seguridad | Sin retención en Fase 1 | GYG retiene % a todos |

| **Ventaja competitiva** Finde paga cada 15 días cuando las plataformas globales pagan cada mes o más. Para agencias peruanas con flujo de caja ajustado, es un diferenciador real. GetYourGuide incluso cobra 2% extra por pago quincenal. |
| --- |

## 5.2 Retención de seguridad (solo Fase 2)

**En la Fase 1 NO se retiene nada adicional a la custodia estándar.** En Fase 2 se introducirá un rolling reserve del 5-10% durante 90 días para agencias nuevas, como colchón ante reclamos o chargebacks.

## 5.3 Disputas y su impacto en el payout

Si hay una disputa abierta sobre una reserva específica, el monto de esa reserva se retiene del payout hasta resolverse. El resto del payout se transfiere normalmente.

# 6. Verificación y Onboarding de Agencias

## 6.1 Estado actual y diseño de niveles

**Estado en el piloto (implementado):** la verificación es **manual**: Finde valida el RUC directamente contra SUNAT (activo y habido) y la inscripción en el Directorio Nacional (MINCETUR/DIRCETUR) antes de activar el flag "Verificado" de la agencia. Cada agencia publicada con sello ha sido verificada de verdad. El copy del producto ("Validaremos contra SUNAT") refleja este proceso honesto.

**Roadmap (piloto → Fase 2): verificación con agentes de IA.** Agentes que validan automáticamente que el RUC esté activo en SUNAT (vía API) y el registro MINCETUR vigente — y no solo al alta: **verificación continua** en el tiempo. La confianza como dato, no como promesa. Nota técnica: la consulta de RUC tiene APIs confiables; el registro MINCETUR requiere procesamiento del directorio público (donde el agente de IA aporta valor real).

Sistema de dos niveles (diseño vigente):

|  | **Finde Basic (Nivel 1)** | **Finde Verificado (Nivel 2)** |
| --- | --- | --- |
| Qué es | La agencia completó el registro con su info básica y puede empezar a vender | La agencia tiene registro MINCETUR/DIRCETUR confirmado y toda la información completa |
| Puede publicar tours | ✓ | ✓ |
| Puede recibir reservas y pagos | ✓ | ✓ |
| Badge de verificación visible | — | ✓ Badge "Verificado" en cada tour |
| Ranking en búsqueda | Normal | Prioridad sobre agencias Basic |
| Confianza del viajero | Estándar | Mayor (el badge genera confianza) |

## 6.2 Información requerida por nivel

### Nivel 1 — Finde Basic (puede empezar a vender)

| **#** | **Dato requerido** | **Cómo se valida** |
| --- | --- | --- |
| 1 | RUC | Contra SUNAT: activo y habido (manual en piloto; API/agente IA en roadmap) |
| 2 | Razón social y nombre comercial | Se cruza con datos SUNAT |
| 3 | Fecha de inicio de actividades (SUNAT) | Consulta SUNAT |
| 4 | Nombre completo del representante legal | Declaración de la agencia |
| 5 | DNI del representante legal | Validación contra RENIEC (roadmap) |
| 6 | Teléfono del representante legal | Verificación por OTP/WhatsApp |
| 7 | Correo electrónico del representante legal | Verificación por código |
| 8 | Cuenta CCI para recibir pagos | A nombre del titular del RUC |
| 9 | Aceptación de Términos y Condiciones | Firma digital en la plataforma |

### Nivel 2 — Finde Verificado (badge de confianza)

Todo lo del Nivel 1, más:

| **#** | **Dato adicional requerido** | **Cómo se valida** |
| --- | --- | --- |
| 10 | Número de inscripción en MINCETUR/DIRCETUR | Validación contra Directorio Nacional (DNPSTC) |
| 11 | Región donde se inscribió | Se cruza con registro MINCETUR |

| **Nivel 3 — Finde Trusted (Fase 2)** Tercer nivel basado en desempeño: rating alto, baja cancelación, respuesta rápida. Se definirá con volumen y datos suficientes. |
| --- |

## 6.3 Agencias informales (sin RUC)

| **Regla estricta** Las agencias sin RUC NO pueden vender en Finde. El riesgo tributario (Ley de Bancarización 28194) y de responsabilidad solidaria ante INDECOPI es demasiado alto. |
| --- |

**Finde apoya la formalización:** al exigir RUC como requisito mínimo, Finde convierte la formalidad en ventaja comercial (el sello verificado vende más) e impulsa a las informales a formalizarse. En etapas posteriores: convenios con estudios contables, guías de inscripción MINCETUR y apoyo con pólizas de responsabilidad civil.

# 7. Pricing y Calendario Peruano

## 7.1 Precios en Fase 1

**El pricing es simple:** la agencia pone el precio de cada tour y ese es el precio final que ve el viajero. Sin descuentos automáticos ni códigos en el piloto. La agencia puede ajustar sus precios manualmente.

## 7.2 Precios y ranking

**Finde NO obliga rate parity** (prohibido en Europa por anticompetitivo). Lo que sí hace:

- **Best-price guarantee al viajero:** si encuentra el mismo tour más barato en la web de la agencia, Finde iguala el precio.

- **Ranking boost:** las agencias cuyo precio en Finde es igual o menor que en su web propia aparecen más arriba.

## 7.3 Calendario peruano de temporada alta

| **Temporada** | **Región principal** | **Aumento típico** | **Anticipación de reservas** |
| --- | --- | --- | --- |
| Carnavales y Candelaria (febrero) | Puno, Cajamarca, Ayacucho | +30% a +50% | 90 días antes |
| Semana Santa (abril) | Nacional, pico en Ayacucho/Cusco | +25% a +40% | 60 a 90 días |
| Corpus Christi + Inti Raymi (junio) | Cusco | +40% a +60% | 90 a 180 días |
| Fiestas Patrias (28-29 julio) | Nacional | +30% a +50% | 60 a 120 días |
| Señor de los Milagros (octubre) | Lima | +10% a +15% | 30 días |
| Navidad/Año Nuevo (dic-ene) | Nacional, pico Machu Picchu | +25% a +40% | 60 a 90 días |

# 8. Penalidades y Suspensión de Agencias

## 8.1 Umbrales de calidad

| **Nivel de alerta** | **Cuándo se activa** | **Qué pasa** |
| --- | --- | --- |
| **ADVERTENCIA** | Rating últimos 12 meses <4.5, o cancelaciones >5% en 90 días, o respuesta <85% en 24h, o 2 quejas formales en 90 días | Finde notifica y da plan de mejora |
| **STRIKE (Suspensión 14 días)** | Rating <4.3, o cancelaciones >10%, o respuesta <75%, o 3 quejas en 90 días, o chargebacks >2% | Tours ocultos por 14 días |
| **DESACTIVACIÓN** | Rating <4.0, o cancelaciones >15%, o respuesta <60%, o 5 quejas en 90 días, o 1 queja grave de seguridad | Agencia desactivada. Puede apelar en 30 días |

## 8.2 Cómo funcionan los strikes

- Los strikes expiran después de 180 días.

- 3 strikes acumulados en 180 días = suspensión temporal de 14 días.

- 5 strikes acumulados = desactivación permanente (se honran reservas existentes por 30 días).

- Las cancelaciones por clima o fuerza mayor documentada NO cuentan como strike.

## 8.3 Suspensión preventiva inmediata

Una sola queja grave y verificable de seguridad activa la suspensión inmediata mientras se investiga.

# 9. Compliance Regulatorio Perú

## 9.1 INDECOPI y protección al consumidor

| **Ley / Norma** | **Qué obliga a hacer** | **Multa si no cumples** |
| --- | --- | --- |
| Ley 32495 (nov-2025) | Libro de Reclamaciones virtual visible, responder en máximo 30 días | Hasta 150 UIT (~S/802,500) |
| D.Leg. 1729 (feb-2026) | Prohibido usar dark patterns | Hasta 450 UIT (~S/2.4M) |
| Ley 31537 (Art. 47) | Voucher al viajero en máximo 15 días hábiles + prueba de aceptación de T&C | Hasta 50 UIT |
| Código del Consumidor | Precio total final visible desde la primera pantalla | Variable |

## 9.2 Cinco reglas no negociables

- **1. Libro de Reclamaciones virtual** con enlace visible. Primera respuesta en 48h, resolución en máximo 30 días.

- **2. Auditoría contra dark patterns cada 3 meses** (D.Leg. 1729).

- **3. Precio total final visible desde la primera pantalla.** Sin cargos sorpresa.

- **4. Voucher post-compra** con todas las condiciones, enviado por WhatsApp y descargable.

- **5. Ruta clara de reclamo:** contacto con la agencia → mediación Finde → Libro de Reclamaciones → INDECOPI.

## 9.3 Responsabilidad solidaria

INDECOPI ha establecido que cuando una plataforma cobra comisión, procesa pagos y usa su marca, responde junto con la agencia. **Defensa:** cada listing y voucher identifica claramente a la agencia (nombre, RUC, registro MINCETUR). El Finde Guarantee se presenta como servicio de buena fe, no como garantía contractual absoluta.

## 9.4 MINCETUR y turismo

- Las agencias deben estar inscritas en el DNPSTC según DS 005-2020-MINCETUR.

- Para turismo de aventura, Finde verifica certificados vigentes (Art. 17.4).

- Finde como marketplace debe completar su registro ante MINCETUR según corresponda a su actividad.

- Código de Conducta contra ESNNA: firma obligatoria (RM 430-2018-MINCETUR).

- Marco de referencia sectorial: Ley N.º 32392, Nueva Ley General de Turismo.

## 9.5 Protección de datos personales

- Inscribir bancos de datos ante la ANPD (Ley 29733 + DS 016-2024-JUS).

- Consentimientos separados: uso del servicio, marketing, compartir datos con agencias.

- Retención de datos transaccionales: 5 años. Datos de sesión: máximo 90 días.

## 9.6 SUNAT y tributación

- **Finde factura solo su comisión (20%) + IGV 18%.** Nunca el valor total del tour (comisión mercantil).

- La agencia emite su propio comprobante al viajero por el precio total.

- Régimen actual de Finde: persona natural con negocio bajo Régimen MYPE Tributario (RMT); migración a SACS planificada al alcanzar tracción.

- Todo pago a agencia >S/2,000 pasa por medio bancario (Ley 28194).

- Comprobantes electrónicos vía OSE como Nubefact o Efact (~S/50/mes).

## 9.7 Prevención de lavado de activos

Como plataforma que intermedia pagos turísticos, aplican obligaciones UIF bajo el **régimen acotado**:

- Designar Oficial de Cumplimiento (al alcanzar los umbrales aplicables).

- Sistema de prevención (SPLAFT) proporcional al régimen acotado.

- Registrar operaciones mayores a S/10,000.

- Reportar operaciones sospechosas a la UIF-Perú.

## 9.8 Propiedad intelectual

- Marca **FINDE** registrada en INDECOPI (Clase 39, Certificado S00141782, vigente hasta 2032).

- Adquisición en proceso vía cesión onerosa ante INDECOPI desde el titular anterior.

# 10. Arquitectura de Pagos

## 10.1 Métodos de pago y pasarela

**Métodos ofrecidos al viajero:** Yape, Plin y tarjeta — en soles. (PagoEfectivo fue eliminado del stack en esta versión: el pago diferido en efectivo contradice el modelo de custodia.)

| **Pasarela** | **Comisión** | **Métodos de pago** | **Estado** |
| --- | --- | --- | --- |
| Culqi (candidata principal) | 3.44% + IGV | Yape, Plin, tarjetas nacionales | Por confirmar en el piloto (evaluar también Izipay/Niubiz) |
| Niubiz (secundaria) | 3.99% + IGV | Amex, Diners, tarjetas internacionales | Evaluación para turistas extranjeros (en soles) |
| Yape Empresa (alternativa) | 2.95% + IGV | Solo Yape | Si el volumen justifica integración directa |

**Estado de implementación:** el flujo de pago del producto está tras la bandera DEMO_PAYMENT_FLOW (solo demo; wizard de 4 pasos con Yape/Plin/Tarjeta y política de cancelación visible). Antes de onboarding de agencias reales: DEMO_PAYMENT_FLOW = false, y gatear o revertir los textos de custodia del voucher introducidos para el demo (ver checklist pre-lanzamiento del PRD v5). La selección final de pasarela debe verificar soporte y costos vigentes directamente con los proveedores.

## 10.2 Reglas de pagos

- **Todo en soles (S/).** Una sola moneda.

- **Custodia total:** el 100% del pago entra a Finde y se libera a la agencia post-tour (sección 4.1).

- El costo de la pasarela sale de la comisión de Finde (está dentro del 20%). NO se cobra al viajero ni se traslada a la agencia como línea aparte.

- Yape/Plin como métodos default (billeteras digitales masivas en Perú).

- Conciliación diaria automática con la pasarela.

- PCI DSS delegado al gateway. Finde NUNCA almacena datos de tarjeta.

- Apple y Google NO cobran su comisión del 30% porque los tours son servicios físicos, no digitales.

# 11. Resumen de Compromisos (SLAs)

| **Compromiso** | **Plazo Finde** | **Lo que hace la competencia** |
| --- | --- | --- |
| Agencia responde a nueva reserva | 24 horas | Airbnb permite 72h |
| Viajero puede reportar problema post-tour | Hasta 72 horas | Airbnb da 48h |
| Finde resuelve una disputa | 5 días hábiles | Airbnb: 5 días |
| Devolución de dinero al viajero | 5-7 días hábiles | GetYourGuide: 3-5 días (banca europea) |
| Pago a las agencias | Quincenal (días 4 y 19) | Viator/GYG/Klook: mensual |
| Respuesta a Libro de Reclamaciones | Máximo 30 días | Obligatorio por Ley 32495 |
| Primera respuesta soporte | 48 horas | Estándar |
| Onboarding agencia nueva (Nivel 1) | 3-5 días hábiles | Viator: 1-2 semanas |
| Apelación de desactivación | 30 días | Airbnb: 30 días |

| **El stack de confianza de Finde** Custodia total del pago + liquidación quincenal + Finde Guarantee + verificación de agencias (SUNAT/MINCETUR) + soporte en español peruano vía WhatsApp (agente de IA 24/7 y quechua en roadmap) + Libro de Reclamaciones visible + precio total transparente. Esto es lo que ninguna OTA global replica rápido en Perú, y lo que separa a Finde de la reserva informal por WhatsApp. |
| --- |

Página
