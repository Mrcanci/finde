Finde · Reglas de Negocio v1.5	Agosto 2026 · Confidencial

**FINDE**

Marketplace de Tours y Experiencias en Perú

────────────────────────────────────────

**REGLAS DE NEGOCIO**

Precio · Comisiones · Custodia de pagos · Cancelaciones · Disputas · Compliance

Versión 1.5 · Agosto 2026

*Documento Confidencial*

# Historial de cambios v1.4 → v1.5

La v1.4 corrigió la figura jurídica. La v1.5 cierra el modelo comercial de precio y payout, y corrige un error de cálculo que arrastraba desde la v1.3.

| **Cambio** | **Antes (v1.4)** | **Ahora (v1.5)** | **Sustento** |
| --- | --- | --- | --- |
| Modelo de precio | La agencia fija el PVP; Finde cobra 20% de comisión | **Precio neto + markup negociado.** La agencia declara el neto que quiere recibir; Finde fija el PVP aplicando un markup acordado tour por tour | Las agencias rechazan "te pago menos por tu tour" y aceptan "dame tu neto y vende arriba". Es el estándar de la distribución turística mayorista |
| Markup | n/a | **Variable, negociado por agencia y fijo por tour.** Piso operativo 15%, objetivo 25%, excepciones bajo 15% aprobadas caso por caso | Prioridad de tracción en el piloto. El piso protege el punto de equilibrio |
| IGV de la comisión | Ambiguo (S/24 + IGV = S/28.32 contra pago de S/96, que no cuadraba) | **IGV incluido en el markup.** El markup es bruto: de S/24, S/3.66 es IGV y S/20.34 es ingreso de Finde. La agencia asume el IGV de lo que ella recibe | Comunicación limpia ("de S/120 recibes S/96") y aritmética consistente |
| Margen por reserva | S/19 | **S/15.21 al 25% de markup** (ver tabla de sensibilidad, sección 2.3) | El S/19 nunca descontó el IGV de la comisión. Corrección de error |
| Punto de equilibrio del piloto | 34 reservas/mes | **43 reservas/mes al 25% de markup** (185 al 10%) | Consecuencia del punto anterior |
| Payout a agencias | Decisión pendiente (quincenal vs. 24 horas) | **Regla de dos condiciones:** se paga cuando (a) la pasarela abonó y (b) pasaron 48 horas del tour sin reclamo, lo que ocurra más tarde | Cierra la contradicción. En la práctica manda la pasarela, así que el pago es casi tan rápido como se quería, con colchón de disputa |
| Ventana de reporte del viajero | 72 horas post-tour | **48 horas post-tour** | Debe ser igual o menor que la ventana de payout, o el colchón no sirve. Airbnb usa 48h |
| Best-price guarantee (sección 7.2) | Vigente | **Eliminado.** Reemplazado por posicionamiento de precio seguro y ranking por proximidad de precio | Incompatible con markup: obligaría a devolver el margen completo cada vez que un viajero compara |
| Modelo financiero Años 1-3 | Proyecciones con margen S/19 | **Marcado para recálculo** con markup promedio ponderado real | No se recalcula aquí porque depende del markup promedio que resulte de las negociaciones |
| Anexo A | n/a | **Pliego de cláusulas para el abogado** | Insumo para redactar el contrato marco |

# Historial de cambios v1.3 → v1.4

Esta versión corrige la figura jurídica del modelo de cobro. No cambia la comisión, ni la economía por reserva, ni las políticas de cancelación. Cambia **cómo se nombra y se documenta** lo que Finde ya hacía, porque el nombre equivocado tenía consecuencias tributarias y contractuales reales.

| **Cambio** | **Antes (v1.3)** | **Ahora (v1.4)** | **Sustento** |
| --- | --- | --- | --- |
| Figura jurídica del cobro | "Merchant of record" (en el historial) coexistiendo con "comisión mercantil" (en la sección 2.2). Contradicción interna | **Agente de cobro con custodia diferida.** Finde NO compra ni revende el tour. Cobra en nombre y por cuenta de la agencia, retiene, y libera | Es la figura que usan GetYourGuide (agente comercial), Airbnb (limited payment collection agent) y Civitatis (intermediario que solo factura comisión). Merchant of record obligaría a facturar el total del tour, con IGV sobre S/120 y sin crédito fiscal frente a agencias en NRUS |
| Requisitos documentales del mandato | No especificados | **Nuevos requisitos vinculantes** (sección 4.2): contrato de mandato con cada agencia, comprobante de la agencia al viajero como condición de payout, contabilidad de fondos en custodia como pasivo | Sin evidencia real del mandato, SUNAT puede recalificar la operación como compraventa y gravar el total |
| Relación con la pasarela | Culqi listada como "candidata principal" | **Restricción documentada**: el contrato estándar de Culqi prohíbe al comercio actuar como intermediario de pago o agregador, y lista a los facilitadores de pagos entre los negocios prohibidos. Ninguna pasarela se integra sin aprobación escrita del modelo | Lectura directa del Contrato de Afiliación al Sistema de Pago Culqi (BCP) |
| Registro MINCETUR de Finde | "Debe completar su registro según corresponda" | **Finde se inscribe como agencia de viajes y turismo minorista con canal digital exclusivo** (DS 005-2020-MINCETUR, arts. 3.1.a, 7.1.1.g, 21 y 22) | Finde intermedia, comercializa y cobra al turista. El art. 21 obliga a cualquier prestador que desarrolle funciones de agencia |
| Forma societaria | "Migración a SACS planificada" | **SAC** (Sociedad Anónima Cerrada) | La SACS solo admite personas naturales como accionistas y es un vehículo poco reconocido por inversionistas. Franco tiene consultora propia |
| Payout a agencias | Quincenal (días 4 y 19) | **Decisión pendiente documentada** (sección 5.4): el compromiso público es de 24 horas post-tour, el documento dice quincenal. Hay que unificar antes de lanzar | Contradicción detectada entre documento y comunicación externa |
| Capital de trabajo | No documentado | **Nueva línea de costo** (sección 5.4): desfase entre el payout prometido y el abono de la pasarela | El abono puede tomar hasta 4 días hábiles en iniciarse más 1 a 2 días de acreditación |
| Rayas largas | Presentes | Eliminadas del documento | Estándar de redacción Finde |

# Historial de cambios v1.2 → v1.3

| **Cambio** | **Antes (v1.2)** | **Ahora (v1.3)** | **Sustento** |
| --- | --- | --- | --- |
| Comisión | 15% base + take rate blended 18-22% | **20% todo incluido, a éxito** | Investigación de mercado (Viator 25%, GYG 20-30%, Airbnb 20%) + estudio de aceptación con agencias |
| Ticket promedio | S/150 | **S/120** | Promedio ponderado de precios reales (tours sueltos Lima S/80-150; paquetes >S/300) |
| Modelo de revenue | Triple motor (marketplace 60% + SaaS 25% + B2G 15%) | **Comisión única 20% (Años 1-3)**; SaaS y B2G pasan a exploración futura | Modelo financiero validado con benchmarks; foco en un solo motor |
| Modelo de cobro | Sin figura jurídica definida | **Custodia total explícita**: el viajero paga el 100% a Finde; se libera a la agencia al completarse el tour | Decisión estratégica: protección de ambos lados + poder de mediación (modelo de señal/adelanto evaluado y descartado). *Nota v1.4: la v1.3 usaba el término "merchant of record", corregido a agente de cobro. Ver historial v1.3 → v1.4* |
| PagoEfectivo | Fallback en tabla de pasarelas | **Eliminado** | Contradice el modelo de custodia (pago diferido en efectivo sin trazabilidad) |
| Verificación | "Validación automática vía API" | **Manual en piloto** (validación directa contra SUNAT y MINCETUR); agentes de IA con verificación continua en roadmap | Estado real del producto |
| Economía por reserva | No documentada | **S/24 ingreso − S/5 variable = S/19 margen** | Modelo financiero M6 / e-Turismo TEC |

# 1. Resumen Ejecutivo

| **Principio rector** Finde cobra una **comisión única del 20%, todo incluido y a éxito**: incluye pasarela de pagos, soporte y la demanda que Finde genera. La agencia solo paga cuando concreta una venta. El 20% está en el piso del estándar del mercado (Viator 25%, GetYourGuide 20-30%, Airbnb Experiences 20%) y reemplaza gastos que la agencia ya realiza (pauta con IGV, personal de ventas, pasarela), con la diferencia de que esos gastos se pagan venda o no venda. |
| --- |

Este documento establece las reglas de negocio completas para la operación del marketplace Finde en Perú: comisión, custodia de pagos, políticas de cancelación y reembolso, liquidación a agencias, disputas, verificación, pricing, penalidades y compliance regulatorio peruano.

**Contexto de mercado:** El mercado global de tours vale USD $300B, pero más del 90% de las reservas aún ocurren offline. En Perú, los gremios del sector (CANATUR, APAVIT) estiman que ~6 de cada 10 agencias operan en la informalidad, no existe una plataforma local dominante, y las OTAs globales (Viator, GetYourGuide, Civitatis+Rappi) no aceptan Yape/Plin ni atienden al turismo interno peruano.

**Mercado direccionable (validado para e-Turismo TEC 2026):**

| **Capa** | **Tamaño (personas)** | **Mercado (S/)** | **Metodología** |
| --- | --- | --- | --- |
| TAM | ~8.7 M viajeros | S/1,044 M | 43.5M viajes internos (MINCETUR) × ~20% que incluiría tour pagado × ticket S/120 |
| SAM | ~700,000 | ~S/84 M | Millennials de Lima (28-40, NSE B/C, Ipsos/APEIM) × ~45% que reserva en línea |
| SOM (Año 1) | ~5,000 reservas | S/600,000 | ~400 viajeros reservando al mes, menos del 1% del SAM |

**Parámetros base:** Ticket promedio S/120 (rango S/80-250). Modelo de precio neto + markup negociado (piso 15%, objetivo 25%). Custodia total del pago con payout por regla de dos condiciones. Yape/Plin/tarjeta como métodos de pago. Moneda única: soles (S/).

**Validación:** Estudio de aceptación con 25 entrevistas (20 viajeros de Lima + 5 agencias regionales) sobre el MVP real: 80% de intención de uso en un viaje concreto. Iteraciones derivadas: pago protegido (custodia) y comisión replanteada como modelo "a éxito".

## 1.1 Fases del modelo

|  | **Fase 1: Piloto (6 meses, Lima)** | **Fase 2: Crecimiento** |
| --- | --- | --- |
| Agencias objetivo | ~50 agencias activas en el Año 1 (oferta Lima + regiones; Cajamarca como ancla regional) | Escala a nivel nacional |
| Herramientas | Todo habilitado gratis para todas las agencias | Evaluación de tiers (exploración futura, no comprometido) |
| Markup | Negociado por agencia, piso 15%, objetivo 25% | Piso revisado con datos reales del piloto |
| Retención de seguridad | Sin retención (confianza primero) | Rolling reserve 5-10% para agencias nuevas |
| Descuentos y promos | Sin descuentos automáticos ni códigos | Descuentos por grupo, early bird, last minute, códigos |
| Payout | Transferencia CCI, regla de dos condiciones (sección 5.1) | Automatización + pago rápido para agencias con historial limpio |
| Soporte disputas | Manual vía WhatsApp | Agente de IA en WhatsApp 24/7 + Case Manager humano |
| Verificación | Manual (validación directa SUNAT/MINCETUR) con sello Verificado | Agentes de IA: validación automática y continua de RUC activo y registro MINCETUR vigente |

| **Estrategia Fase 1** En el piloto, todas las herramientas están habilitadas gratis, no se retiene dinero adicional y no hay descuentos automáticos. El foco es validar la venta real: superar el punto de equilibrio del piloto (43 reservas/mes al 25% de markup) y convertir la aceptación validada en transacciones. |
| --- |

# 2. Estructura de Comisión y Economía

## 2.1 Benchmark de comisiones

El 20% de Finde está en el piso del rango del mercado relevante, con la diferencia de que es **todo incluido** (pasarela, soporte y demanda) y **a éxito**:

| **Plataforma** | **Comisión** | **Modelo** | **Notas** |
| --- | --- | --- | --- |
| Viator (TripAdvisor) | 20-25% base | Comisión pura | Accelerate sube hasta 30-35%. Cobra US$29/listing nuevo |
| GetYourGuide | 20-30% | Comisión pura | Cobra 2% extra por pago quincenal en vez de mensual |
| Klook | 15-35% | Negociado por volumen | 15% solo para atracciones de altísimo volumen |
| Airbnb Experiences | 20% plano | Comisión plana | Modelo relanzado 2025 |
| Civitatis | 20-25% est. | Comisión + Rappi | Principal amenaza en LATAM hispano |
| Rappi (referencia delivery) | 20-25% | Comisión + logística | Referencia local de aceptación de comisiones "a éxito" |
| **Finde** | **Markup negociado (piso 15%, objetivo 25%)** | **Neto + markup a éxito** | **Pasarela incluida, en soles, sin costo de alta ni pago por posición** |

**Equivalencia entre markup y comisión.** Son la misma operación leída desde los dos lados. La agencia habla en netos; la contabilidad de Finde habla en comisión:

| Markup sobre el neto | Equivale a comisión sobre el PVP |
| --- | --- |
| 10% | 9.09% |
| **15% (piso operativo)** | **13.04%** |
| 20% | 16.67% |
| **25% (objetivo)** | **20.00%** |
| 30% | 23.08% |

Nota: el incentivo de descentralización documentado como "13% de comisión en regiones" equivale a **15% de markup**. Por eso el piso operativo es 15%: bajar de ahí significa dar a cualquier agencia algo mejor que el descuento reservado para regiones.

**Argumento comercial ante la agencia:** la agencia hoy gasta ~15-25% del ticket en pauta en redes (+18% IGV desde dic. 2024), personal de ventas y pasarela de pagos, y la mayor parte se paga venda o no venda. El markup de Finde reemplaza ese gasto y solo existe cuando hay una venta concreta. El riesgo cambia de lado.

## 2.2 Modelo de precio: neto declarado + markup negociado

**Regla central.** La agencia declara el **precio neto** que quiere recibir por pasajero. Finde fija el **precio de venta al público (PVP)** aplicando un markup acordado con esa agencia para ese tour. La agencia recibe exactamente su neto, sin descuentos posteriores.

Esto no cambia la figura jurídica de la sección 4: Finde sigue vendiendo **en nombre y por cuenta de la agencia**. El markup es la retribución del mandato, no un margen de reventa.

**Por qué este modelo y no el de comisión:** las agencias rechazan la conversación "te pago menos por tu tour" y aceptan sin fricción "dame tu neto y yo vendo arriba". Es el estándar de la distribución turística mayorista (tarifa neta vs. tarifa comisionable). El resultado económico es idéntico; la aceptación comercial no.

### 2.2.1 Qué pasa con cada S/120 que paga un viajero

Ejemplo con neto S/96 y markup 25% (PVP S/120):

| **Concepto** | **Monto (S/)** | **Explicación** |
| --- | --- | --- |
| PVP (paga el viajero) | 120.00 | Precio final visible, sin cargos ocultos. Pagado en su totalidad a Finde (custodia) |
| Neto de la agencia | 96.00 | Lo que la agencia declaró querer recibir. Se le paga íntegro |
| **Markup Finde (25% sobre el neto)** | **24.00** | Bruto, con IGV incluido |
| IGV de la comisión (18/118) | -3.66 | Finde asume el IGV sobre lo que él recibe |
| **Ingreso neto de Finde** | **20.34** | Base imponible real |
| Pasarela de pagos (3.44% del PVP, IGV recuperable) | -4.13 | Costo neto tras crédito fiscal |
| IA en runtime | -1.00 | Búsqueda semántica y generación |
| **Margen de contribución Finde** | **15.21** | Por reserva, antes de costos fijos |

| **Regla tributaria crítica (comisión mercantil)** Finde opera como mandatario con representación: solo su comisión es ingreso gravable, no el pass-through completo. Finde emite factura electrónica a la agencia por S/24 (S/20.34 + IGV S/3.66). La agencia emite su propio comprobante al viajero **por el PVP de S/120**, no por su neto. Finde NUNCA factura el valor total del tour. Los S/96 en tránsito se registran como pasivo (cuentas por pagar a agencias), nunca como ingreso. |
| --- |

### 2.2.2 El IGV del markup es neutro para la agencia formal

La objeción que toda agencia va a plantear es: "¿por qué facturo S/120 si mi precio es S/96?". La respuesta con números:

| **Régimen de la agencia** | **Vendiendo directo a S/96** | **Vía Finde a S/120** | **Diferencia** |
| --- | --- | --- | --- |
| RMT / General | IGV débito S/14.64. Le quedan S/81.36 | IGV débito S/18.31, menos crédito fiscal S/3.66 por la factura de Finde = S/14.65. Le quedan S/81.35 | **Neutro** |
| RER (1.5% de ingresos netos) | S/1.44 de IR | S/1.80 de IR | S/0.36 más por reserva |
| NRUS | Sin IGV | Sin IGV. Solo consume su tope mensual más rápido | Neutro en impuesto |

**Por qué es neutro:** el IGV adicional que la agencia paga por vender a S/120 en vez de S/96 es exactamente el IGV que recupera como crédito fiscal de la factura de comisión de Finde. Se compensan. Este argumento debe estar en el material de onboarding de agencias.

### 2.2.3 Reglas de negociación del markup

El markup se negocia **por agencia y queda fijo por tour**. No es una tarifa pública. Reglas para que la flexibilidad no se convierta en erosión:

| **Regla** | **Detalle** |
| --- | --- |
| Piso operativo | 15%. Por debajo requiere aprobación explícita de José y quedar registrado con el motivo |
| Objetivo | 25% en Lima. 15% en regiones como incentivo de descentralización |
| Justificaciones válidas para bajar del objetivo | Tour ancla que trae tráfico, ticket alto (S/300+ donde un markup menor sigue pagando la operación), agencia de región prioritaria, condición temporal de lanzamiento con fecha de vencimiento |
| Frecuencia de cambio del neto | Máximo un cambio por tour cada 7 días fuera de temporada alta. Preaviso de 48 horas |
| Métrica de control | **Markup promedio ponderado por GMV**, revisado mensualmente. Es el indicador que determina si el modelo financiero se sostiene |

| **Advertencia registrada: el costo de la tracción** Un markup de 10% deja S/3.51 de margen por reserva y eleva el punto de equilibrio del piloto a 185 reservas mensuales, contra 43 al 25%. Priorizar tracción sobre margen es una decisión válida y deliberada, pero implica operar a pérdida durante el periodo en que el markup promedio esté por debajo del piso. Debe fijarse un techo de subsidio (monto y plazo) antes de iniciar las negociaciones. |
| --- |

### 2.2.4 Sensibilidad del margen al markup

Neto de la agencia S/96, costos fijos del piloto S/650/mes:

| **Markup** | **PVP (S/)** | **Markup bruto (S/)** | **Ingreso neto Finde (S/)** | **Margen (S/)** | **Reservas/mes para equilibrio** |
| --- | --- | --- | --- | --- | --- |
| 10% | 105.60 | 9.60 | 8.14 | **3.51** | **185** |
| 15% | 110.40 | 14.40 | 12.20 | **7.40** | **88** |
| 20% | 115.20 | 19.20 | 16.27 | **11.31** | **58** |
| 25% | 120.00 | 24.00 | 20.34 | **15.21** | **43** |
| 30% | 124.80 | 28.80 | 24.41 | **19.12** | **34** |

**Por qué esto no es un tecnicismo.** Si Finde figurara como comprador y revendedor del tour (merchant of record), su ingreso sería el PVP completo y su IGV se calcularía sobre ese total. Ese IGV solo se compensa si la agencia emite **factura**, y una parte importante de las agencias pequeñas está en NRUS y solo puede emitir boleta, que no da crédito fiscal. En ese escenario el margen por reserva se desploma. La figura de agente de cobro protege la economía del modelo justamente en el segmento que Finde quiere formalizar.

**Nota sobre el margen:** el costo de pasarela es un porcentaje fijo del ticket, por lo que el margen por reserva NO mejora con la escala. Lo que sí se diluye con el volumen es el costo fijo por reserva (equipo + infraestructura repartidos entre más reservas).

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

Supuestos: equipo de 1 → 3 → 6 personas (~S/1,500/persona promedio, perfiles junior/practicantes en etapa temprana), infraestructura S/650 → S/900 → S/1,200/mes. Punto de equilibrio del piloto: 43 reservas/mes al 25% de markup (costos fijos S/650 ÷ margen S/15.21).

| **Modelo financiero marcado para recálculo** Las proyecciones de esta tabla se construyeron con un margen de S/19 por reserva, que no descontaba el IGV de la comisión. El margen real al 25% de markup es S/15.21, y baja a S/3.51 al 10%. Con markup variable, la proyección depende del markup promedio ponderado que resulte de las negociaciones. **No usar estas cifras en material externo hasta recalcularlas.** |
| --- |

| **SaaS y B2G: exploración futura (no comprometida)** El tier premium para agencias (S/99/mes) y los servicios B2G municipales que aparecían en v1.2 como "triple motor de revenue" pasan a exploración futura. No forman parte del modelo financiero de los Años 1-3 ni de los compromisos con agencias. Solo se evaluarán con evidencia de volumen y demanda real. |
| --- |

## 2.4 Herramientas para agencias

**Fase 1 (piloto):** todas las herramientas habilitadas sin costo para todas las agencias: perfil de agencia, tours ilimitados, cobros Yape/Plin/tarjeta (vía Finde, en custodia), gestión de reservas, coordinación por WhatsApp.

**Reglas de pricing:** No cobrar listing fee fijo. No cobrar fee al viajero. El costo de pasarela está incluido en el 20% (nunca se traslada como línea aparte a la agencia ni al viajero).

**Estado de implementación (piloto):** el dashboard de Ingresos y la selección de política de cancelación en el flujo de creación de tours están construidos pero **ocultos en la UI durante el piloto** (sin pasarela real no hay dinero que mostrar ni reembolsos que ejecutar). Se reactivan cuando la pasarela entre en producción.

# 3. Política de Cancelación y Reembolso

## 3.1 Por qué toda reserva necesita política de cancelación

| **Importante: la política de cancelación es obligatoria** INDECOPI exige que el consumidor conozca las condiciones de cancelación ANTES de comprar (Código del Consumidor, Art. 18-20). Si Finde no publica política, el viajero puede reclamar reembolso total en cualquier momento y ganaría. La solución: la agencia elige qué política aplicar a cada tour, incluyendo "No reembolsable" para tours con permisos comprados con anticipación. |
| --- |

**Estado de implementación (piloto):** el sistema de 4 políticas existe en el esquema de datos, pero la UI está oculta en todo el flujo (voucher, reserva, detalle de tour, creación/edición) mientras no haya pasarela: sin pago real no hay reembolso real; la coordinación se hace por WhatsApp. La columna se preserva en la base de datos y la UI se restaura junto con la pasarela. Las reglas de esta sección son el diseño vinculante al que se vuelve en ese momento.

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

| **Figura jurídica (regla vinculante)** Finde actúa como **agente de cobro de la agencia con custodia diferida**. Finde NO compra el tour, NO lo revende y NO es el prestador del servicio. El contrato de servicio se celebra entre el viajero y la agencia; Finde lo concluye y cobra en nombre y por cuenta de la agencia. El pago del viajero a Finde **extingue la obligación de pago del viajero frente a la agencia**: desde ese momento la agencia solo tiene acción contra Finde, nunca contra el viajero. |
| --- |

**Regla central del modelo:** el viajero paga el 100% del tour a Finde (no a la agencia ni a un intermediario). Finde retiene el dinero en custodia y lo libera a la agencia después de completarse el tour (ver liquidación, sección 5). Este modelo, el mismo de Viator, GetYourGuide, Klook y Airbnb, es la base de la confianza en ambos lados:

- **Para el viajero:** no le paga a un desconocido; su dinero está protegido hasta recibir el servicio.
- **Para la agencia:** el cobro está garantizado aunque el viajero no se presente (protección anti no-show).
- **Para Finde:** control total de la transacción → poder real de mediación, devolución y cumplimiento ante INDECOPI. La comisión se cobra por adelantado y garantizada, eliminando el riesgo de desintermediación en el cobro.

| **Decisión registrada: modelo de señal descartado** Se evaluó un modelo de adelanto parcial ("el viajero paga el 20% a Finde como comisión y el 80% en persona a la agencia"). Se descartó por dos razones: (1) desprotege a la agencia ante el no-show, y (2) Finde pierde el control del dinero y con él su poder de mediación, sin custodia, la plataforma no puede dar garantías y no se diferencia de WhatsApp. La fricción del pago total online se mitiga con métodos locales (Yape/Plin), el sello de verificación y la promesa explícita de custodia ("no le pagas al desconocido: le pagas a Finde, que retiene hasta que el tour ocurra"). |
| --- |

## 4.2 Cómo lo hacen las plataformas de referencia

Ninguna de las grandes plataformas compra el tour. Todas usan la misma figura de agente:

| **Plataforma** | **Figura declarada** | **Cuándo libera al proveedor** |
| --- | --- | --- |
| GetYourGuide | Agente comercial del proveedor. El contrato de servicio se celebra directamente entre cliente y proveedor; GYG lo concluye en nombre y por cuenta del proveedor y cobra en su nombre | Mensual (quincenal con 2% extra de comisión) |
| Airbnb Experiences | Airbnb Payments es agente de cobro con propósito limitado. El pago del huésped extingue su obligación frente al host | Día siguiente de realizada la experiencia |
| Civitatis | Intermediario. Solo factura al proveedor la comisión negociada | Mensual, al inicio del mes siguiente |
| **Finde** | **Agente de cobro con custodia diferida** | **Ver sección 5.4 (decisión pendiente)** |

**Lo que Finde no puede copiar:** Airbnb opera su propia entidad de pagos con licencia, y GetYourGuide tiene entidades locales por país. Finde depende de una pasarela de terceros, y por eso el modelo debe declararse y aprobarse por escrito con el proveedor de pagos antes de integrar (ver sección 10.1).

## 4.3 Requisitos documentales del mandato (vinculantes)

La figura de agente de cobro solo se sostiene si la operación real la respalda. SUNAT evalúa la forma efectiva de actuación, no la denominación del contrato. Estos cuatro requisitos son condición para operar:

1. **Contrato marco con cada agencia** que declare expresamente que Finde actúa como comisionista mercantil y mandatario con representación, que recibe pagos por cuenta y orden de la agencia, y que el pago del viajero a Finde extingue su obligación frente a la agencia.
2. **Identificación de la agencia como prestador** en el listing, el checkout, el voucher y los T&C del viajero. Esto coincide con el principio de identidad visible de la agencia (Finde no opera en white-label).
3. **Comprobante de la agencia al viajero como condición de payout.** El dashboard de agencia exige cargar o generar el comprobante antes de liberar el pago. Sin este control, el flujo documental no ocurre en la práctica y la operación es recalificable.
4. **Contabilidad separada.** Los fondos en custodia se registran como pasivo (cuentas por pagar a agencias). Nunca ingresan a cuentas de ingreso.

| **Pendiente de asesoría profesional** Dos puntos requieren pronunciamiento de un contador tributarista antes de operar con pasarela real: (a) la mecánica de la **detracción (SPOT)** sobre la factura de comisión, dado que Finde se autodescuenta la comisión de fondos que ya tiene en custodia; y (b) la aplicación del **ITF** y la eventual calificación como sistema de pagos organizado por el movimiento sistemático de fondos de terceros (Ley 28194). |
| --- |

## 4.4 Flujo de resolución en 7 pasos

| **Paso** | **Qué pasa** | **Plazo máximo** | **Quién actúa** |
| --- | --- | --- | --- |
| 1 | El viajero reporta el problema por el chat de Finde o formulario | Hasta 48 horas después del tour | Viajero |
| 2 | La agencia recibe la queja y responde | 24 horas para responder | Agencia |
| 3 | Si no se ponen de acuerdo, Finde interviene como mediador | 48 horas para intervenir | Finde |
| 4 | Se recopilan pruebas: chat, fotos, voucher, lo que decía el listing | Durante el proceso | Ambos |
| 5 | Finde toma una decisión aplicando las reglas publicadas | 5 días hábiles | Finde |
| 6 | Se ejecuta: devolución parcial/total al viajero + strike a la agencia si corresponde | Inmediato | Finde |
| 7 | Cualquiera puede apelar presentando nueva evidencia | 30 días para apelar | Parte afectada |

## 4.5 Finde Guarantee (Garantía Finde)

La promesa de Finde al viajero de que su compra está protegida, posible únicamente gracias a la custodia:

- **La agencia no se presenta al tour:** Devolución del 100% + cupón del 15% para otra experiencia.

- **La experiencia fue muy diferente a lo publicado:** Devolución parcial del 30% al 100% según la gravedad.

- **Problema de seguridad comprobado:** Devolución del 100% + suspensión inmediata de la agencia.

- **Cobro incorrecto:** Se corrige y se devuelve la diferencia.

| **Fondo de Garantía Finde** Finde mantiene un fondo equivalente al 1-2% del volumen total de ventas para resolver rápidamente quejas menores (bajo S/300) sin proceso largo. Para montos mayores a S/500, se sigue el proceso completo de mediación con evidencia. |
| --- |

## 4.6 Chargebacks bancarios

**Qué es:** el viajero disputa el cobro directamente con su banco. El banco devuelve el dinero al viajero y se lo quita a Finde a través de la pasarela.

**Cómo se defiende Finde:** presentando pruebas de que el servicio se prestó: voucher de confirmación, captura del chat, confirmación de la agencia. El banco tiene hasta 90 días para resolver.

**Con Yape/Plin es menos común:** el viajero aprueba con OTP, lo que dificulta alegar desconocimiento. Los chargebacks son más frecuentes con tarjetas de crédito.

# 5. Liquidación: Cómo y Cuándo se Paga a las Agencias

## 5.1 Liquidación: regla de dos condiciones

| **Regla de payout (vinculante)** Finde libera el pago a la agencia cuando se cumplen **las dos** condiciones siguientes, en la fecha de la que ocurra más tarde:
**(a)** la pasarela ya abonó los fondos en la cuenta de Finde, y
**(b)** transcurrieron 48 horas desde la finalización del tour sin reclamo abierto del viajero.
En la práctica la condición que manda casi siempre es (a), porque la pasarela tarda más. El resultado es un pago tan rápido como la infraestructura permite, con colchón de disputa. |
| --- |

**Flujo completo:**

- **Paso 1. El viajero paga.** El PVP entra a Finde vía pasarela y queda en custodia. NO va directo a la agencia. Se registra como pasivo por el neto de la agencia.

- **Paso 2. Se ejecuta el tour.** Empieza a correr la ventana de reporte de 48 horas del viajero (sección 4.4).

- **Paso 3. La agencia emite su comprobante.** Boleta o factura al viajero **por el PVP**, cargada en su panel. Sin este paso el pago no se habilita (sección 4.3).

- **Paso 4. Abono de la pasarela.** Los fondos llegan a la cuenta de Finde. El plazo depende del proveedor: hasta 4 días hábiles para iniciar el procesamiento más 1 a 2 días de acreditación.

- **Paso 5. Transferencia CCI.** Finde transfiere el neto íntegro a la agencia y emite su factura de comisión.

| **Ejemplo práctico** Tour del sábado 6 de junio, neto S/96, PVP S/120. El viajero pagó el 1 de junio. La ventana de 48 horas cierra el lunes 8 sin reclamo. La pasarela abona el miércoles 10. La agencia cargó su boleta el domingo 7. **Finde transfiere S/96 el miércoles 10**, el mismo día que dispone de los fondos. Su factura de comisión: S/24 (S/20.34 + IGV S/3.66). |
| --- |

| **Parámetro** | **Regla Finde** | **Comparación con la competencia** |
| --- | --- | --- |
| Disparador del pago | Abono de pasarela + 48h post-tour sin reclamo | Viator, GYG, Klook: corte mensual. Airbnb: día siguiente |
| Condición documental | La agencia debe haber emitido su comprobante al viajero | No aplica (modelos distintos) |
| Frecuencia | Continua, por reserva. Sin cortes de calendario | Viator: cierre mensual único |
| Método de pago | Transferencia CCI | n/a |
| Monto mínimo para pagar | S/50 acumulados. Por debajo se acumula al siguiente | Viator: US$50 (~S/190) |
| Costo de la transferencia | Finde asume el costo | Estándar Klook/Airbnb |
| Retención de seguridad | Sin retención en Fase 1 | GYG retiene % a todos |

| **Ventaja competitiva** Finde paga por reserva y en cuanto dispone de los fondos, cuando las plataformas globales pagan por corte mensual. Para agencias peruanas con flujo de caja ajustado, es el diferenciador operativo más fuerte del modelo. GetYourGuide incluso cobra 2% extra por adelantar el pago a quincenal. |
| --- |

| **Riesgo asumido y su mitigación** El viajero conserva hasta 90 días para iniciar un contracargo bancario, plazo que ninguna ventana de payout puede cubrir. Si el contracargo llega después de pagada la agencia, Finde debe recuperar los fondos de ella. Mitigación: cláusula de repetición en el contrato marco (Anexo A), descuento del siguiente payout, y **rolling reserve del 5-10% para agencias nuevas a partir de la Fase 2** (sección 5.2). |
| --- |

## 5.2 Retención de seguridad (solo Fase 2)

**En la Fase 1 NO se retiene nada adicional a la custodia estándar.** En Fase 2 se introducirá un rolling reserve del 5-10% durante 90 días para agencias nuevas, como colchón ante reclamos o chargebacks.

## 5.3 Disputas y su impacto en el payout

Si hay una disputa abierta sobre una reserva específica, el monto de esa reserva se retiene del payout hasta resolverse. El resto del payout se transfiere normalmente.

## 5.4 Capital de trabajo

Con la regla de dos condiciones, Finde **no adelanta fondos propios**: paga cuando ya tiene el dinero. El requerimiento de capital de trabajo por desfase de payout queda en cero.

Lo que sí queda es el **flotante contable**: fondos de agencias que están en tránsito en la pasarela o en la cuenta de Finde a la espera de que cierre la ventana. No es un costo, pero sí es dinero ajeno bajo control de Finde, y debe estar segregado contablemente como pasivo y visible en el dashboard de agencia.

| **Volumen mensual** | **GMV mensual (S/)** | **Flotante promedio en tránsito (S/)** |
| --- | --- | --- |
| 43 reservas (equilibrio piloto al 25%) | 5,160 | ~1,100 |
| 400 reservas (Año 1) | 48,000 | ~10,300 |
| 3,300 reservas (Año 2) | 400,000 | ~86,000 |

Supuesto: 8 días promedio entre el cobro al viajero y la transferencia a la agencia, sobre el 80% del GMV.

| **Decisión pendiente: pago rápido como producto** Una vez que haya datos reales de disputas y de tiempos de abono, evaluar un "pago rápido" opcional para agencias con historial limpio: Finde adelanta con capital propio antes del abono de la pasarela, a cambio de un punto adicional de markup. Es la única forma de mejorar el plazo sin asumir riesgo gratis. **No comprometer con agencias hasta tener el dato.** |
| --- |

# 6. Verificación y Onboarding de Agencias

## 6.1 Estado actual y diseño de niveles

**Estado en el piloto (implementado):** la verificación es **manual**: Finde valida el RUC directamente contra SUNAT (activo y habido) y la inscripción en el Directorio Nacional (MINCETUR/DIRCETUR) antes de activar el flag "Verificado" de la agencia. Cada agencia publicada con sello ha sido verificada de verdad. El copy del producto ("Validaremos contra SUNAT") refleja este proceso honesto.

**Roadmap (piloto → Fase 2): verificación con agentes de IA.** Agentes que validan automáticamente que el RUC esté activo en SUNAT (vía API) y el registro MINCETUR vigente, y no solo al alta: **verificación continua** en el tiempo. La confianza como dato, no como promesa. Nota técnica: la consulta de RUC tiene APIs confiables; el registro MINCETUR requiere procesamiento del directorio público (donde el agente de IA aporta valor real).

Sistema de dos niveles (diseño vigente):

|  | **Finde Basic (Nivel 1)** | **Finde Verificado (Nivel 2)** |
| --- | --- | --- |
| Qué es | La agencia completó el registro con su info básica y puede empezar a vender | La agencia tiene registro MINCETUR/DIRCETUR confirmado y toda la información completa |
| Puede publicar tours | ✓ | ✓ |
| Puede recibir reservas y pagos | ✓ | ✓ |
| Badge de verificación visible | n/a | ✓ Badge "Verificado" en cada tour |
| Ranking en búsqueda | Normal | Prioridad sobre agencias Basic |
| Confianza del viajero | Estándar | Mayor (el badge genera confianza) |

## 6.2 Información requerida por nivel

### Nivel 1: Finde Basic (puede empezar a vender)

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

### Nivel 2: Finde Verificado (badge de confianza)

Todo lo del Nivel 1, más:

| **#** | **Dato adicional requerido** | **Cómo se valida** |
| --- | --- | --- |
| 10 | Número de inscripción en MINCETUR/DIRCETUR | Validación contra Directorio Nacional (DNPSTC) |
| 11 | Región donde se inscribió | Se cruza con registro MINCETUR |

| **Nivel 3: Finde Trusted (Fase 2)** Tercer nivel basado en desempeño: rating alto, baja cancelación, respuesta rápida. Se definirá con volumen y datos suficientes. |
| --- |

## 6.3 Agencias informales (sin RUC)

| **Regla estricta** Las agencias sin RUC NO pueden vender en Finde. El riesgo tributario (Ley de Bancarización 28194) y de responsabilidad solidaria ante INDECOPI es demasiado alto. |
| --- |

**Finde apoya la formalización:** al exigir RUC como requisito mínimo, Finde convierte la formalidad en ventaja comercial (el sello verificado vende más) e impulsa a las informales a formalizarse. En etapas posteriores: convenios con estudios contables, guías de inscripción MINCETUR y apoyo con pólizas de responsabilidad civil.

# 7. Pricing y Calendario Peruano

## 7.1 Precios en Fase 1

**El pricing funciona así:** la agencia declara su **precio neto** por tour. Finde aplica el markup negociado y publica el PVP resultante. Sin descuentos automáticos ni códigos en el piloto.

**Reglas de cambio de precio:**

| **Situación** | **Regla** |
| --- | --- |
| Precio congelado al reservar | **El PVP y el neto se copian a la reserva en el momento de reservar.** Nunca se leen del tour al momento de pagar o liquidar. Es obligación de INDECOPI: el precio que el consumidor vio al comprar es el precio |
| La agencia cambia su neto | Se acepta con 48 horas de preaviso. Aplica solo a reservas nuevas. Las confirmadas quedan intactas |
| Frecuencia máxima | Un cambio de neto por tour cada 7 días fuera de temporada alta |
| Temporada alta | La agencia programa netos por rango de fechas con anticipación, en vez de avisar caso por caso (ver calendario, sección 7.3) |
| Subida extraordinaria de costos (entradas, permisos, combustible) | Permitida con evidencia documentada, solo hacia reservas futuras. Nunca retroactivo |
| Cambio de precio en reserva ya confirmada | **No se puede.** Si el tour se volvió inviable, es cancelación por la agencia con las consecuencias de la sección 3.4 |
| Trazabilidad | Todo cambio de neto o de markup queda registrado con fecha, hora y autor |

## 7.2 Posicionamiento de precio y ranking

**Finde NO obliga rate parity** (prohibido en Europa por anticompetitivo) y **NO promete el precio más bajo.**

| **Regla eliminada en v1.5: best-price guarantee** La v1.4 prometía igualar el precio si el viajero encontraba el mismo tour más barato en el canal directo de la agencia. Con el modelo de markup esa promesa es inviable: obligaría a Finde a devolver su margen completo cada vez que un viajero compara, quedando incluso por debajo del costo de pasarela. Se elimina. |
| --- |

**Lo que Finde promete en su lugar:** no el precio más bajo, sino el **precio seguro**. Agencia verificada contra SUNAT y MINCETUR, dinero en custodia hasta que el tour ocurra, y alguien a quien reclamar. Todo el copy debe alinearse con este posicionamiento y evitar cualquier afirmación de mejor precio.

**Ranking por proximidad de precio (reemplazo del boost anterior):** las agencias cuyo precio en su canal directo público esté dentro de un 10% del PVP de Finde suben en el ranking. No es obligación ni exclusividad: es un incentivo voluntario a no socavar el canal.

**Segmento objetivo del markup:** el markup es defendible en demanda de **descubrimiento** (el viajero encontró el tour a través de Finde y no habría llegado a esa agencia por su cuenta), no en demanda de **comparación** (el viajero ya conoce a la agencia y solo busca precio). El segundo segmento no se persigue con descuentos.

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

- Código de Conducta contra ESNNA: firma obligatoria (RM 430-2018-MINCETUR).

- Marco de referencia sectorial: Ley N.º 32392, Nueva Ley General de Turismo, y su reglamento DS 002-2026-MINCETUR.

| **Finde también es agencia de viajes y turismo (corrección v1.4)** El DS 005-2020-MINCETUR define agencia de viajes y turismo como toda persona natural o jurídica que realiza actividades de organización, mediación, coordinación, promoción, asesoría, venta y operación de servicios turísticos (art. 3.1.a). Entre las actividades de la agencia **minorista** figuran expresamente "intermediar programas organizados y operados por otras agencias" y "comercializar programas y demás servicios turísticos directamente al turista" (art. 7.1.1). El art. 21 obliga a cualquier prestador que desarrolle funciones de agencia a inscribirse. Finde intermedia, comercializa y cobra al turista: **le corresponde inscribirse como agencia minorista con canal digital exclusivo**. |
| --- |

**Requisitos concretos del registro de Finde:**

| **Requisito** | **Detalle** | **Estado** |
| --- | --- | --- |
| RUC activo | Único requisito de inicio para canal digital exclusivo. No se exige licencia de funcionamiento ni oficina física (art. 8.2) | Bloqueado hasta constituir la SAC |
| Declaración jurada | Presentación dentro de los 30 días de iniciadas actividades. Aprobación automática. Constancia en 5 días hábiles. Trámite gratuito (arts. 9 y 10) | Pendiente |
| Contenido obligatorio en la web | Teléfono, dirección de contacto, correo, RUC, razón social, nombre comercial, política de datos personales, T&C con políticas de cobro/cancelación/reembolso, constancia de inscripción y afiche ESNNA, todo accesible desde la portada (art. 22.1.a) | Se puede avanzar ya |
| Medidas técnicas | Seguridad y diligencia debida en la interfaz de compra, incluidas las herramientas de procesamiento de pagos, y protección de datos (art. 22.3) | Parcial |
| **Personal calificado** | Quien atienda directamente al turista debe acreditar 1 año de experiencia en turismo más un curso de atención al cliente, **o** formación superior o técnico-productiva en turismo (art. 22.1.c). El órgano competente puede exigir el listado con hojas de vida y certificados | **Verificar de inmediato.** Si no se cumple, resolver con un curso (CENFOTUR o similar) o incorporando a alguien con formación en turismo para soporte |
| Denominación y distintivo | "Agencia de Viajes y Turismo" y el distintivo MINCETUR quedan reservados a inscritos (art. 15.7). No usarlos antes de tener la constancia | Regla activa |

**Órgano competente en Lima Metropolitana:** Dirección General de Políticas de Desarrollo Turístico del MINCETUR, hasta que la Municipalidad de Lima asuma la función.

## 9.5 Protección de datos personales

- Inscribir bancos de datos ante la ANPD (Ley 29733 + DS 016-2024-JUS).

- Consentimientos separados: uso del servicio, marketing, compartir datos con agencias.

- Retención de datos transaccionales: 5 años. Datos de sesión: máximo 90 días.

## 9.6 SUNAT y tributación

- **Finde factura solo su comisión (20%) + IGV 18%.** Nunca el valor total del tour (comisión mercantil, mandato con representación).

- La agencia emite su propio comprobante al viajero por el precio total. Ese comprobante es **condición de payout** (sección 4.3).

- Los fondos en custodia se registran como pasivo, no como ingreso.

- **Forma societaria: SAC** (Sociedad Anónima Cerrada). Se descarta la SACS: solo admite personas naturales como accionistas, lo que bloquea el ingreso de la consultora de Franco o de un fondo, y es un vehículo poco reconocido en due diligence.

- **Objeto social** debe cubrir, como mínimo: servicios de agencia de viajes y turismo (minorista y operador de turismo), intermediación y comercialización de servicios turísticos por canales digitales, desarrollo y explotación de plataformas y software, y servicios de publicidad y marketing digital. Si el objeto social no menciona agencia de viajes, se traba el registro MINCETUR y el giro declarado ante la pasarela.

- **Régimen tributario: RMT** (Régimen MYPE Tributario). Permite ingresos de hasta 1,700 UIT anuales, 10% de IR sobre utilidades hasta 15 UIT y 29.5% sobre el exceso, y arrastre de pérdidas, que importa porque los primeros meses son deficitarios. Se descarta el RER por su tope de S/525,000 y por no permitir arrastre de pérdidas.

- **Ejecución del fondo MINCETUR (hasta 30-nov-2026):** los comprobantes del fondo se emiten al RUC personal de Jose Luis Cancino Cuellar. Los gastos de la SAC se emiten al RUC de la SAC. **Cero cruces entre ambas contabilidades.** Confirmar por escrito con FDA-UNALM e Incubagraria si la constitución durante la ejecución requiere comunicación previa.

- Todo pago a agencia >S/2,000 pasa por medio bancario (Ley 28194).

- Comprobantes electrónicos: SEE-SOL de SUNAT (gratuito) en el piloto; OSE como Nubefact o Efact (~S/50/mes) al escalar.

- **Pendiente de tributarista:** mecánica de la detracción (SPOT) sobre la factura de comisión y tratamiento del ITF por movimiento de fondos de terceros.

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

**Métodos ofrecidos al viajero:** Yape, Plin y tarjeta, en soles. (PagoEfectivo fue eliminado del stack en esta versión: el pago diferido en efectivo contradice el modelo de custodia.)

| **Restricción crítica descubierta (v1.4)** El Contrato de Afiliación al Sistema de Pago Culqi (BCP) **prohíbe expresamente al Comercio actuar como intermediario de pago o agregador** (cláusula 12.29.iii) y lista a los **"Facilitadores de pagos" entre los Negocios Prohibidos** (Anexo 4). "Adquirente" y "Facilitador de Pago" son roles que asume BCP, no el comercio. Afiliarse sin declarar el modelo de custodia expone a Finde a desafiliación sin previo aviso y a **retención de fondos por hasta 180 días** (cláusula 5.1), con dinero de agencias adentro. **Ninguna pasarela se integra sin aprobación escrita del modelo.** |
| --- |

| **Pasarela** | **Comisión** | **Fit con el modelo** | **Estado** |
| --- | --- | --- | --- |
| Mercado Pago | Más alta que las locales | **El único con Split de Pagos documentado.** Cada agencia es subcomercio vía OAuth; el dinero de la agencia nunca es de Finde. Elimina el riesgo de raíz | **Prioridad 1.** Verificar: disponibilidad en Perú, control de la fecha de liberación de fondos, y nivel de KYC exigido a cada agencia |
| Culqi | 3.44% + IGV | Malo bajo custodia (prohibido por contrato). Viable solo si Finde vende a nombre propio, lo que rompe la economía por IGV | **Prioridad 2.** Pedir por escrito si aceptan el modelo y bajo qué giro |
| Izipay | Desde 3.29% + IGV | Sin producto de split público. Plan B más limpio si se opera con custodia bajo contrato de mandato | **Prioridad 3** |
| Niubiz | 3.45% a 4.19% + IGV | Tiene soluciones de split pero requieren integración avanzada y dependen del banco. Afiliación lenta | Diferir hasta tener volumen |
| Yape Empresa | 2.95% + IGV | Solo Yape, no resuelve tarjetas | Si el volumen justifica integración directa |

**Notas operativas:**

- **Tarjetas internacionales** deben solicitarse explícitamente durante la afiliación. No vienen por defecto.
- **PCI:** usar el checkout embebido o la tokenización del proveedor. Integrar pasarela propia exigiría certificación PCI con AOC vigente.
- **Comisión mínima:** algunas pasarelas aplican piso por transacción (Culqi: S/3.50 para montos menores a S/87.72). Afecta a los tours del extremo bajo del rango (S/80).
- **Poder de negociación:** el BCRP reporta que la comisión promedio de facilitadores bajó de 3.27% a 2.92%. Las tarifas de lista son negociables con volumen.

**Regla de arquitectura:** la integración se construye detrás de una interfaz abstracta de proveedor de pagos (`createCharge`, `capture`, `refund`, `handleWebhook`). Ninguna lógica de negocio se acopla a un proveedor específico. El proveedor final aún no está decidido y el costo de cambiarlo debe mantenerse bajo.

**Estado de implementación:** el flujo de pago del producto está tras la bandera DEMO_PAYMENT_FLOW (solo demo). Antes de onboarding de agencias reales: DEMO_PAYMENT_FLOW = false. La selección final de pasarela debe verificar soporte y costos vigentes directamente con los proveedores.

## 10.2 Reglas de pagos

- **Todo en soles (S/).** Una sola moneda.

- **Custodia total:** el 100% del pago entra a Finde **como agente de cobro de la agencia** y se libera post-tour (sección 4.1). Los fondos retenidos no son patrimonio de Finde.

- El costo de la pasarela sale de la comisión de Finde (está dentro del 20%). NO se cobra al viajero ni se traslada a la agencia como línea aparte.

- Yape/Plin como métodos default (billeteras digitales masivas en Perú).

- Conciliación diaria automática con la pasarela.

- PCI DSS delegado al gateway. Finde NUNCA almacena datos de tarjeta.

- Apple y Google NO cobran su comisión del 30% porque los tours son servicios físicos, no digitales.

# 11. Resumen de Compromisos (SLAs)

| **Compromiso** | **Plazo Finde** | **Lo que hace la competencia** |
| --- | --- | --- |
| Agencia responde a nueva reserva | 24 horas | Airbnb permite 72h |
| Viajero puede reportar problema post-tour | Hasta 48 horas | Airbnb: 48h |
| Finde resuelve una disputa | 5 días hábiles | Airbnb: 5 días |
| Devolución de dinero al viajero | 5-7 días hábiles | GetYourGuide: 3-5 días (banca europea) |
| Pago a las agencias | Al abonar la pasarela y pasadas 48h del tour | Viator/GYG/Klook: mensual. Airbnb: día siguiente |
| Respuesta a Libro de Reclamaciones | Máximo 30 días | Obligatorio por Ley 32495 |
| Primera respuesta soporte | 48 horas | Estándar |
| Onboarding agencia nueva (Nivel 1) | 3-5 días hábiles | Viator: 1-2 semanas |
| Apelación de desactivación | 30 días | Airbnb: 30 días |

| **El stack de confianza de Finde** Custodia total del pago + payout apenas la pasarela abona + Finde Guarantee + verificación de agencias (SUNAT/MINCETUR) + soporte en español peruano vía WhatsApp (agente de IA 24/7 y quechua en roadmap) + Libro de Reclamaciones visible + precio total transparente. Esto es lo que ninguna OTA global replica rápido en Perú, y lo que separa a Finde de la reserva informal por WhatsApp. |
| --- |

# 12. Acciones abiertas

| **#** | **Acción** | **Bloquea a** | **Responsable** |
| --- | --- | --- | --- |
| 1 | Escribir a Mercado Pago, Culqi e Izipay describiendo el modelo. Pedir respuesta por escrito | Objeto social, estructura tributaria, arquitectura de pagos | José |
| 2 | Reunión con tributarista: confirmar mandato con representación, detracciones e ITF | Contrato marco con agencias | José |
| 3 | Confirmar por escrito con FDA-UNALM e Incubagraria si se puede constituir durante la ejecución del fondo | Constitución de la SAC | José |
| 4 | Verificar si alguien del equipo cumple el requisito de personal calificado (art. 22.1.c) | Registro MINCETUR | José |
| 5 | Consultar a Walter Valcárcel si la cesión de marca puede redirigirse a la SAC | Traspaso de marca | José |
| 6 | Recalcular el modelo financiero Años 1-3 con markup promedio ponderado real | Pitch, postulaciones, rendición MINCETUR | José |
| 7 | Redactar T&C, política de privacidad y política de cancelación (sirven a la vez para pasarela, MINCETUR e INDECOPI) | Afiliación a pasarela y registro MINCETUR | José + abogado |
| 8 | Redactar contrato marco con agencias (cláusulas de la sección 4.3 y del Anexo A) | Onboarding de agencias reales | Abogado |
| 9 | Implementar el comprobante de la agencia como condición de payout en el dashboard | Cumplimiento del mandato | Franco |
| 10 | Construir la integración de pagos detrás de interfaz abstracta de proveedor | Flexibilidad de pasarela | Franco |
| 11 | Alinear PRD Técnico v5 con la figura de agente de cobro y el modelo neto + markup | Coherencia documental | José |
| 12 | Definir techo de subsidio (monto y plazo) para markups por debajo del piso de 15% | Disciplina de negociación | José |
| 13 | Implementar en schema: precio neto, markup por tour, PVP calculado, historial de cambios y precio congelado en la reserva | Todo el modelo de precio | Franco |
| 14 | Eliminar del copy toda promesa de mejor precio. Reemplazar por precio seguro | INDECOPI y coherencia con markup | José |
| 15 | Llevar el Anexo A al abogado para redactar el contrato marco | Onboarding de agencias reales | José |

| **Aviso** Este documento no sustituye asesoría legal ni contable. Los puntos de estructura societaria, tributación y registro sectorial requieren pronunciamiento de un abogado corporativo y un contador tributarista peruanos antes de operar con pagos reales. |
| --- |


# Anexo A. Pliego de cláusulas para el contrato marco con agencias

Insumo para el abogado. No es un contrato: es la lista de lo que el contrato debe resolver, para no pagar honorarios por descubrir el modelo de negocio.

## A.1 Naturaleza de la relación

- Finde actúa como **comisionista mercantil y mandatario con representación** de la agencia. No compra, no revende, no es prestador del servicio turístico.
- El contrato de servicio se celebra **entre el viajero y la agencia**. Finde lo concluye en nombre y por cuenta de la agencia.
- El pago del viajero a Finde **extingue la obligación de pago del viajero frente a la agencia**. Desde ese momento la agencia solo tiene acción contra Finde.
- Los fondos recibidos por Finde por cuenta de la agencia **no integran el patrimonio de Finde** y se mantienen segregados contablemente.
- Nada en el contrato constituye sociedad, joint venture, relación laboral ni exclusividad.

## A.2 Precio y markup

- La agencia declara un **precio neto** por tour y por tipo de pasajero.
- La agencia **autoriza expresamente** a Finde a fijar el precio de venta al público aplicando un markup acordado, dentro de un rango pactado por escrito para cada tour.
- La agencia acepta que **el comprobante de pago al viajero se emita por el precio de venta al público**, no por su neto.
- Finde informa a la agencia el precio de venta al público de cada reserva. La agencia lo conoce y lo ha preautorizado.
- Cambios de neto: preaviso mínimo de 48 horas, frecuencia máxima de un cambio cada 7 días fuera de temporada alta, aplicables solo a reservas nuevas.
- **Irretroactividad absoluta:** ningún cambio de precio afecta reservas ya confirmadas.

## A.3 Obligaciones tributarias

- La agencia se obliga a **emitir su comprobante de pago al viajero por el precio de venta al público**, dentro del plazo legal y bajo su propio régimen tributario.
- La emisión y carga del comprobante en la plataforma es **condición suspensiva del pago** a la agencia.
- Finde emite factura electrónica a la agencia únicamente por su comisión, con IGV incluido.
- La agencia declara su régimen tributario y se obliga a comunicar cualquier cambio.
- Cada parte responde por sus propias obligaciones tributarias. Ninguna asume las de la otra.

## A.4 Custodia y liquidación

- Regla de dos condiciones: pago cuando la pasarela abonó **y** transcurrieron 48 horas del tour sin reclamo, lo que ocurra más tarde.
- Transferencia a cuenta CCI **a nombre del titular del RUC** de la agencia. Sin excepciones.
- Monto mínimo de liquidación: S/50 acumulados.
- Finde asume el costo de la transferencia.
- **Cláusula de repetición:** si un contracargo, reclamo o devolución se materializa después de liquidada la reserva, la agencia se obliga a reintegrar el monto, autorizando a Finde a descontarlo de liquidaciones futuras.
- Facultad de retención sobre reservas con disputa abierta.

## A.5 Cancelaciones, disputas y garantía

- La agencia elige la política de cancelación por tour entre las cuatro opciones de la sección 3.2.
- Procedimiento de disputa de la sección 4.4, con la decisión de Finde como mediador y derecho de apelación de 30 días.
- Penalidades por cancelación imputable a la agencia (sección 3.4) y régimen de strikes (sección 8).
- El Finde Guarantee se pacta como servicio de buena fe con topes definidos, **no como garantía contractual ilimitada**.

## A.6 Verificación, cumplimiento y datos

- La agencia declara y mantiene: RUC activo y habido, inscripción vigente en el Directorio Nacional de Prestadores de Servicios Turísticos, y certificaciones de turismo de aventura cuando corresponda.
- Autorización a Finde para verificar esa información de forma continua contra fuentes oficiales.
- Adhesión al Código de Conducta contra la ESNNA.
- Tratamiento de datos personales del viajero: la agencia actúa como encargada, con finalidad limitada a la prestación del servicio.
- Declaración de seguro de responsabilidad civil cuando la actividad lo requiera.

## A.7 Salida y varios

- Vigencia indefinida. Cualquiera de las partes puede terminar con 30 días de preaviso.
- Las reservas confirmadas al momento de la salida **se honran** hasta su ejecución.
- Suspensión inmediata sin preaviso ante queja grave y verificable de seguridad.
- Ley peruana. Domicilio y foro en Lima.
- Modificaciones a los Términos y Condiciones operativos con preaviso de 30 días y derecho de la agencia a terminar sin penalidad.

| **Aviso** Este anexo no es un contrato ni sustituye asesoría legal. Es una lista de puntos a resolver, redactada para acortar el tiempo de un abogado corporativo peruano. |
| --- |

Página
