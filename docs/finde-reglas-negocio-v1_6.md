Finde · Reglas de Negocio v1.6	Agosto 2026 · Confidencial

**FINDE**

Marketplace de Tours y Experiencias en Perú

────────────────────────────────────────

**REGLAS DE NEGOCIO**

Precio · Circuito de comprobantes · Custodia de pagos · Cancelaciones · Disputas · Compliance

Versión 1.6 · Agosto 2026

*Documento Confidencial*

# Historial de cambios v1.5 → v1.6

La v1.5 cerró el modelo comercial de precio y payout. **La v1.6 cambia el circuito de comprobantes y, con él, la figura jurídica.** Finde deja de vender en nombre y por cuenta de la agencia: **pasa a comprar el servicio al operador y venderlo al turista como agencia de viajes y turismo minorista.** La economía por reserva no se mueve; lo que se mueve es quién le factura a quién, y de qué depende que el margen siga siendo el mismo.

| **Cambio** | **Antes (v1.5)** | **Ahora (v1.6)** | **Sustento** |
| --- | --- | --- | --- |
| Circuito de comprobantes | Finde factura **solo su comisión** (S/24) a la agencia. La agencia le emite el comprobante al viajero por el PVP. "Finde NUNCA factura el valor total del tour" | **Invertido.** La agencia operadora **le emite factura a Finde por su neto** (S/96). **Finde le emite boleta de venta electrónica al viajero por el PVP completo** (S/120). **Finde ya no emite factura de comisión a la agencia** | Es el circuito que corresponde a una agencia minorista que comercializa al turista servicios operados por terceros (DS 005-2020-MINCETUR, art. 7.1.1). El circuito anterior dependía de que la agencia le facturara al viajero, cosa que Finde no controla y que en la práctica no ocurría |
| Figura jurídica | Agente de cobro de la agencia con custodia diferida (comisionista mercantil, mandatario con representación) | **Agencia de viajes y turismo minorista.** Finde compra el servicio al operador y lo vende al turista por cuenta propia, con custodia del pago hasta la prestación | El circuito de comprobantes define la figura, no al revés. Si Finde emite el comprobante al turista por el total, la operación es venta propia |
| Condición de vigencia del circuito | n/a | **Nueva y dura: la agencia tiene que estar afecta al IGV y emitir factura.** Con boleta o con NRUS, Finde pierde el crédito fiscal y **el margen por reserva cae de S/15.21 a ~S/0.56** | Es el mismo cálculo que en v1.5 servía para descartar esta ruta. Acá no la descarta: la condiciona, y convierte el régimen tributario de la agencia en requisito de onboarding |
| Payout | Dos condiciones: pasarela abonó **y** tour + 48h sin reclamo | **Tres condiciones:** factura de la agencia recibida y validada, pasarela abonó, y tour + 48h sin reclamo | La condición documental cambió de dueño: ya no es el comprobante de la agencia al viajero, es la factura de la agencia a Finde, que es la que sostiene el crédito fiscal |
| Reloj de la liquidación | "En la práctica manda la pasarela, que tarda más" | **Depende de la anticipación de la reserva.** El reloj de la pasarela arranca en el **cobro**, no en el tour: en reservas anticipadas la pasarela abona semanas antes de que el tour ocurra, y ahí la condición vinculante es tour + 48h | Corrección de un supuesto de v1.5 que solo se cumple en reservas de última hora. El sistema tiene que evaluar las dos fechas |
| Capital de trabajo | Cero. "Finde no adelanta fondos" | **Deja de ser cero.** Finde emite boleta al cobro y recibe la factura de la agencia después: hasta **S/14.64 de IGV por reserva** que adelanta y recupera en el período siguiente | Consecuencia directa del circuito nuevo. Con 400 reservas anticipadas al mes la exposición ronda los **S/6,000** |
| Verificación de agencias (Nivel 2) | RUC, razones sociales, representante, CCI, T&C, más inscripción MINCETUR | **Requisitos duros con evidencia archivada:** RUC activo y habido, **régimen que permita facturar con IGV más factura de muestra**, inscripción MINCETUR vigente, **póliza con Finde como asegurado adicional** y **certificado de aventura o canotaje** cuando aplique. Más **recheck periódico** | Lo que en v1.5 era declaración de la agencia en el Anexo A pasa a ser proceso con expediente. El régimen tributario dejó de ser un dato administrativo: es lo que sostiene el margen |
| Clasificación MINCETUR | "Finde se inscribe como agencia minorista con canal digital" | **Ampliada con el reparto de roles y las obligaciones que derivan:** Finde minorista y **no operador**, las agencias proveedoras son **operadores de turismo**, verificación y archivo del certificado de aventura antes de publicar, ESNNA como declaración jurada **de Finde**, y distintivo oficial | La clasificación ya estaba; lo que faltaba era qué obliga a hacer. Los tres primeros puntos son fiscalizables |
| Responsabilidad frente al viajero | Responsabilidad solidaria, con la identificación de la agencia como defensa | **Sección propia (9.3).** El contrato reparte responsabilidad entre Finde y la agencia pero **no exime a Finde frente al viajero**: sirve para repetir contra la agencia, no para no responder | INDECOPI: el proveedor responde por la idoneidad de los servicios que brinda directa o indirectamente, y contratar terceros no lo exime. Con el circuito nuevo Finde es además el vendedor, así que la defensa de v1.5 pesa menos |
| Posicionamiento ante pasarelas | Restricción de Culqi documentada, sin guión de presentación | **Sección propia (10.1).** Finde se presenta como **comercio de turismo con canal digital**, nunca como facilitador, agregador ni marketplace. Producto pedido: **checkout con cargo único**, sin split ni subcomercios | El modelo minorista simplifica la conversación con la pasarela: Finde cobra por lo que vende. **Riesgo abierto: el MCC de turismo puede costar 4.45% + IGV** contra el ~3.5% que asume el modelo |
| Anexo A | Siete secciones | **Nueva A.8** con responsabilidad, póliza con asegurado adicional, indemnidad, compensación contra liquidaciones futuras, suspensión ante siniestro, obligación de facturar con IGV y advertencia de detracción | Insumo para el abogado. Son las cláusulas que el circuito nuevo hace necesarias |

| **Lo que NO cambió, y conviene decirlo porque se confunde** El **modelo de precio** sigue siendo neto declarado más markup negociado (piso 15%, objetivo 25%). El **margen por reserva sigue siendo S/15.21** y el **equilibrio del piloto sigue siendo 43 reservas/mes**. Las **políticas de cancelación** son las mismas cuatro con los mismos plazos. La **custodia** sigue en pie: el viajero paga el 100% a Finde y la agencia cobra después de la prestación. |
| --- |

| **Tres cosas de esta versión están PENDIENTES DE CONFIRMACIÓN CON TRIBUTARISTA** y están marcadas como tales donde aparecen: la aplicación de la **detracción (SPOT)** a los servicios turísticos, la **oportunidad de emisión** de la boleta al viajero, y el **umbral de salida del RMT**, que en este circuito se calcula sobre el GMV completo y no sobre la comisión. Ninguna de las tres bloquea el diseño, pero las tres cambian números. |
| --- |

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

| **Principio rector** Finde retiene un **20% del precio de venta, todo incluido y a éxito**: incluye pasarela de pagos, soporte y la demanda que Finde genera. La agencia solo lo asume cuando concreta una venta. **Ese 20% es la lectura comercial del markup, no el circuito fiscal**: desde la v1.6 Finde no le emite factura de comisión a la agencia, le compra el servicio y lo revende (sección 2.2.1). El 20% está en el piso del estándar del mercado (Viator 25%, GetYourGuide 20-30%, Airbnb Experiences 20%) y reemplaza gastos que la agencia ya realiza (pauta con IGV, personal de ventas, pasarela), con la diferencia de que esos gastos se pagan venda o no venda. |
| --- |

Este documento establece las reglas de negocio completas para la operación del marketplace Finde en Perú: comisión, custodia de pagos, políticas de cancelación y reembolso, liquidación a agencias, disputas, verificación, pricing, penalidades y compliance regulatorio peruano.

**Contexto de mercado:** El mercado global de tours vale USD $300B, pero más del 90% de las reservas aún ocurren offline. En Perú, los gremios del sector (CANATUR, APAVIT) estiman que ~6 de cada 10 agencias operan en la informalidad, no existe una plataforma local dominante, y las OTAs globales (Viator, GetYourGuide, Civitatis+Rappi) no aceptan Yape/Plin ni atienden al turismo interno peruano.

**Mercado direccionable (validado para e-Turismo TEC 2026):**

| **Capa** | **Tamaño (personas)** | **Mercado (S/)** | **Metodología** |
| --- | --- | --- | --- |
| TAM | ~8.7 M viajeros | S/1,044 M | 43.5M viajes internos (MINCETUR) × ~20% que incluiría tour pagado × ticket S/120 |
| SAM | ~700,000 | ~S/84 M | Millennials de Lima (28-40, NSE B/C, Ipsos/APEIM) × ~45% que reserva en línea |
| SOM (Año 1) | ~5,000 reservas | S/600,000 | ~400 viajeros reservando al mes, menos del 1% del SAM |

**Parámetros base:** Ticket promedio S/120 (rango S/80-250). Modelo de precio neto + markup negociado (piso 15%, objetivo 25%). Finde opera como **agencia de viajes y turismo minorista**: compra el servicio al operador y lo vende al turista. Custodia total del pago con payout por **regla de tres condiciones**. Yape/Plin/tarjeta como métodos de pago. Moneda única: soles (S/).

**Validación:** Estudio de aceptación con 25 entrevistas (20 viajeros de Lima + 5 agencias regionales) sobre el MVP real: 80% de intención de uso en un viaje concreto. Iteraciones derivadas: pago protegido (custodia) y comisión replanteada como modelo "a éxito".

## 1.1 Fases del modelo

|  | **Fase 1: Piloto (6 meses, Lima)** | **Fase 2: Crecimiento** |
| --- | --- | --- |
| Agencias objetivo | ~50 agencias activas en el Año 1 (oferta Lima + regiones; Cajamarca como ancla regional) | Escala a nivel nacional |
| Herramientas | Todo habilitado gratis para todas las agencias | Evaluación de tiers (exploración futura, no comprometido) |
| Markup | Negociado por agencia, piso 15%, objetivo 25% | Piso revisado con datos reales del piloto |
| Retención de seguridad | Sin retención (confianza primero) | Rolling reserve 5-10% para agencias nuevas |
| Descuentos y promos | Sin descuentos automáticos ni códigos | Descuentos por grupo, early bird, last minute, códigos |
| Payout | Transferencia CCI, regla de tres condiciones (sección 5.1) | Automatización + pago rápido para agencias con historial limpio |
| Soporte disputas | Manual vía WhatsApp | Agente de IA en WhatsApp 24/7 + Case Manager humano |
| Verificación | Manual, con expediente: SUNAT, régimen tributario, MINCETUR, póliza y certificados. Sello Verificado | Agentes de IA: validación automática y continua de RUC activo y registro MINCETUR vigente |

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

**Desde la v1.6 el markup SÍ es un margen de comercialización**, no la retribución de un mandato: Finde compra el servicio al operador por su neto y lo vende al turista al PVP (sección 4.1). Para la agencia la conversación comercial no cambia en nada, porque recibe exactamente el neto que declaró. Lo que cambia es el circuito de comprobantes, y eso sí le impone una condición: tiene que poder emitir factura con IGV.

**Por qué este modelo y no el de comisión:** las agencias rechazan la conversación "te pago menos por tu tour" y aceptan sin fricción "dame tu neto y yo vendo arriba". Es el estándar de la distribución turística mayorista (tarifa neta vs. tarifa comisionable). El resultado económico es idéntico; la aceptación comercial no.

### 2.2.1 Qué pasa con cada S/120 que paga un viajero

Ejemplo con neto S/96 y markup 25% (PVP S/120). **La tabla tiene dos bloques y NO se leen como una sola suma:** el primero calcula el IGV y termina en la fila "IGV neto"; el segundo calcula el margen y empieza en "markup bruto". **La única fila del primer bloque que entra en el segundo es el IGV neto.**

| **Concepto** | **Monto (S/)** | **Explicación** |
| --- | --- | --- |
| PVP (paga el viajero) | 120.00 | Precio final visible, sin cargos ocultos. Pagado en su totalidad a Finde (custodia). **Finde emite boleta de venta electrónica por este monto** |
| IGV débito de Finde (18/118 de 120) | -18.31 | Lo que Finde le debe a SUNAT por la venta al viajero |
| Factura de la agencia a Finde | -96.00 | Su neto declarado. **Es factura, no boleta**, y por eso trae crédito fiscal |
| Crédito fiscal de esa factura (18/118 de 96) | +14.64 | Se compensa contra el débito de arriba |
| **IGV neto que paga Finde** | **-3.67** | 18.31 menos 14.64. **Es el mismo IGV que en v1.5**, cobrado por otro camino |
| **Markup bruto de Finde (25% sobre el neto)** | **24.00** | 120.00 menos 96.00 |
| **Ingreso neto de Finde** | **20.34** | Markup bruto menos el IGV neto exacto (S/3.6610). Es el mismo ingreso neto que declaraba la v1.5 |
| Pasarela de pagos (3.44% del PVP, IGV recuperable) | -4.13 | Costo neto tras crédito fiscal. **Ver el riesgo de MCC en la sección 10.1** |
| IA en runtime | -1.00 | Búsqueda semántica y generación |
| **Margen de contribución Finde** | **15.21** | Por reserva, antes de costos fijos. **Sin cambios respecto de v1.5** |

**Nota de redondeo, para que nadie la corrija dos veces.** Sobre los montos exactos el IGV neto es **S/3.6610** (18.3051 menos 14.6441), el mismo número que la v1.5 mostraba como S/3.66 de IGV de la comisión. La tabla dice S/3.67 porque redondea cada línea antes de restar. **El margen se calcula sobre los montos exactos y por eso se mantiene en S/15.21.**

| **Regla tributaria crítica (circuito minorista)** Finde opera como **agencia de viajes y turismo MINORISTA**. La agencia operadora **emite factura electrónica a Finde por su precio neto**. Finde **emite boleta de venta electrónica al viajero por el PVP completo**. **Finde NO emite factura de comisión a la agencia.** |
| --- |

| **CONDICIÓN DE VIGENCIA (no es una nota al pie)** Este circuito exige que la agencia esté **afecta al IGV y emita factura**. Si emite boleta o está en NRUS, Finde pierde el crédito fiscal y **el margen por reserva cae de S/15.21 a ~S/0.56**. La **verificación de régimen es requisito de onboarding, no opcional** (sección 6.2). El cálculo completo está en la sección 2.2.4. |
| --- |

**Qué cambia en la contabilidad respecto de v1.5.** El ingreso bruto de Finde **ya no es la comisión: es el PVP completo**, y los S/96 son **costo de venta**, no un pasivo en tránsito. Es el cambio de mayor alcance de esta versión y toca tres cosas fuera de este documento: lo que Finde puede declarar como facturación, el umbral de salida del RMT (sección 2.3) y cómo se presenta ante la pasarela (sección 10.1).

| **PENDIENTE DE CONFIRMACIÓN CON TRIBUTARISTA: oportunidad de emisión de la boleta** El circuito no define todavía **cuándo** se emite la boleta al viajero: al cobro o al prestarse el tour. No es un detalle de forma. Emitir al cobro es lo que genera el desfase de IGV de la sección 5.4; emitir al tour lo cierra, pero deja semanas entre el cobro y el comprobante en reservas anticipadas. **Documentar las dos variantes con su impacto en caja antes de configurar el emisor electrónico.** |
| --- |

### 2.2.2 Para la agencia, vender por Finde es idéntico a vender directo

**La objeción de v1.5 desapareció con el circuito nuevo.** Ahí la agencia tenía que emitirle al viajero un comprobante por S/120 cuando su precio era S/96, y había que explicarle por qué eso no le costaba plata. **Ahora la agencia factura S/96 y recibe S/96.** Su situación tributaria es exactamente la misma que si le hubiera vendido ese tour directamente a un cliente a ese precio.

| **Régimen de la agencia** | **Vendiendo directo a S/96** | **Vía Finde (factura S/96 a Finde)** | **Diferencia** |
| --- | --- | --- | --- |
| RMT / General | IGV débito S/14.64. Le quedan S/81.36 | IGV débito S/14.64. Le quedan S/81.36 | **Ninguna** |
| RER (1.5% de ingresos netos) | S/1.44 de IR | S/1.44 de IR | **Ninguna** |
| NRUS | Sin IGV, **pero no puede emitir factura** | **No puede operar bajo este circuito.** Ver la condición de vigencia de 2.2.1 y el requisito de onboarding de 6.2 | **Queda fuera** |

**Finde no le agrega ni le quita carga tributaria a la agencia formal.** Ese es el argumento entero, y es más corto y más fácil de sostener que el de v1.5. Debe estar en el material de onboarding.

**La contracara, y hay que decirla de frente en la conversación comercial:** el circuito **excluye a las agencias que no pueden facturar con IGV**. Una agencia en NRUS no puede vender por Finde hasta cambiar de régimen. Esto convive con la misión de formalización (sección 6.3), pero sube el escalón de entrada, y es una decisión consciente, no un efecto colateral.

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

**Por qué esto no es un tecnicismo, y por qué el mismo cálculo cambió de función en v1.6.** Finde compra y revende el tour, así que su ingreso es el PVP completo y su IGV se calcula sobre ese total. **Ese IGV solo se compensa si la agencia emite factura.** Con una agencia en NRUS o que emita boleta no hay crédito fiscal, y el margen se desploma:

| **Comprobante que emite la agencia** | **IGV débito** | **Crédito fiscal** | **IGV neto** | **Margen por reserva** |
| --- | --- | --- | --- | --- |
| **Factura con IGV** (RMT, General, RER afecto) | 18.31 | 14.64 | **3.67** | **S/15.21** |
| Boleta, o agencia en NRUS | 18.31 | **0.00** | **18.31** | **~S/0.56** |

**En v1.5 este cálculo servía para descartar la ruta. En v1.6 sirve para blindarla.** Facturar el valor total funciona, y funciona bien, **siempre que la agencia proveedora emita factura con IGV**. Por eso el régimen tributario de la agencia es **requisito duro de onboarding y no un dato administrativo** (sección 6.2), y por eso se archiva una factura de muestra en el expediente: es la evidencia de que la condición se cumple, no la declaración de que se cumplirá.

**El caso de borde que hay que mirar antes de firmar con cada agencia:** una agencia puede estar afecta al IGV y aun así emitir boleta por costumbre o por configuración de su emisor. El régimen habilita la factura; no la garantiza. La obligación de emitir **factura** y de comunicar cualquier cambio de régimen va al contrato (Anexo A.3 y A.8).

**Nota sobre el margen:** el costo de pasarela es un porcentaje fijo del ticket, por lo que el margen por reserva NO mejora con la escala. Lo que sí se diluye con el volumen es el costo fijo por reserva (equipo + infraestructura repartidos entre más reservas).

## 2.3 Modelo de revenue

**Años 1-3: comisión única del 20%.** El modelo financiero validado se sostiene exclusivamente con la comisión de marketplace. Rentable desde el Año 1 con costos reales de equipo y marketing:

| **Anual** | **Año 1** | **Año 2** | **Año 3** |
| --- | --- | --- | --- |
| Reservas | 5,000 | 40,000 | 120,000 |
| Ingreso retenido (take rate 20% sobre el PVP) | S/120,000 | S/960,000 | S/2,880,000 |
| *GMV, que es el ingreso bruto contable del circuito minorista* | *S/600,000* | *S/4,800,000* | *S/14,400,000* |
| Costos variables (S/5/reserva) | S/25,000 | S/200,000 | S/600,000 |
| Equipo + infraestructura | S/26,000 | S/65,000 | S/122,000 |
| Marketing | S/18,000 | S/72,000 | S/180,000 |
| **Utilidad operativa** | **S/51,000** | **S/623,000** | **S/1,978,000** |

Supuestos: equipo de 1 → 3 → 6 personas (~S/1,500/persona promedio, perfiles junior/practicantes en etapa temprana), infraestructura S/650 → S/900 → S/1,200/mes. Punto de equilibrio del piloto: 43 reservas/mes al 25% de markup (costos fijos S/650 ÷ margen S/15.21).

| **PENDIENTE DE CONFIRMACIÓN CON TRIBUTARISTA: el umbral de salida del RMT** En el circuito minorista los **ingresos brutos de Finde son el GMV completo, no el markup**. El RMT admite hasta **1,700 UIT anuales**, y el límite se mira contra ingresos netos del ejercicio, no contra el margen. Con el GMV de la fila de arriba, el Año 2 ya está en otro orden de magnitud que el que se suponía al elegir el régimen. **Hay que confirmar el cálculo exacto del límite bajo este circuito y en qué año proyectado se cruza**, porque salir del RMT cambia la carga de IR y la planificación societaria. Es la consecuencia menos visible de invertir el circuito de comprobantes. |
| --- |

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

| **Figura jurídica (regla vinculante, cambiada en v1.6)** Finde actúa como **agencia de viajes y turismo minorista**: **compra el servicio al operador** por su precio neto y **lo vende al turista** al precio de venta al público, reteniendo el pago en custodia hasta la prestación. **Finde NO opera el servicio**: lo opera la agencia proveedora, que es un operador de turismo (sección 9.4). La venta al turista es de Finde; la prestación es de la agencia. La agencia **no tiene acción contra el viajero**: su cliente es Finde. |
| --- |

| **Qué se descartó, y por qué se dice acá** La v1.5 usaba la figura de **agente de cobro con custodia diferida** (comisionista mercantil con mandato de representación), donde la agencia le emitía el comprobante al viajero. Se descartó por dos razones. **La primera es de hecho:** ese circuito dependía de que la agencia emitiera un comprobante al viajero por un monto que no era su precio, algo que Finde no controla y que exigía un control de carga en el panel para que ocurriera. **La segunda es de coherencia:** Finde fija el precio de venta, cobra al turista, retiene el dinero, media las disputas y responde ante INDECOPI (sección 9.3). Esa es la conducta de un vendedor, y la forma tributaria tenía que acompañarla. **SUNAT evalúa la forma efectiva de actuación, no la denominación del contrato**, y ese criterio, que en v1.5 sostenía el mandato, es el mismo que ahora lo desaconseja. |
| --- |

**Regla central del modelo:** el viajero paga el 100% del tour a Finde (no a la agencia ni a un intermediario). Finde retiene el dinero en custodia y lo libera a la agencia después de completarse el tour (ver liquidación, sección 5). **La custodia del pago es la misma que usan Viator, GetYourGuide, Klook y Airbnb**, aunque la figura tributaria de Finde ya no sea la de ellos, y es la base de la confianza en ambos lados:

- **Para el viajero:** no le paga a un desconocido; su dinero está protegido hasta recibir el servicio. **Y desde la v1.6 el comprobante se lo emite Finde**, que es a quien le compró.
- **Para la agencia:** el cobro está garantizado aunque el viajero no se presente (protección anti no-show). Su cliente es Finde, no un turista que puede desaparecer.
- **Para Finde:** control total de la transacción, con poder real de mediación, devolución y cumplimiento ante INDECOPI. El margen queda del lado de Finde desde el cobro, sin riesgo de desintermediación.

| **Decisión registrada: modelo de señal descartado** Se evaluó un modelo de adelanto parcial ("el viajero paga el 20% a Finde como comisión y el 80% en persona a la agencia"). Se descartó por dos razones: (1) desprotege a la agencia ante el no-show, y (2) Finde pierde el control del dinero y con él su poder de mediación, sin custodia, la plataforma no puede dar garantías y no se diferencia de WhatsApp. La fricción del pago total online se mitiga con métodos locales (Yape/Plin), el sello de verificación y la promesa explícita de custodia ("no le pagas al desconocido: le pagas a Finde, que retiene hasta que el tour ocurra"). |
| --- |

## 4.2 Cómo lo hacen las plataformas de referencia

Ninguna de las grandes plataformas compra el tour. Todas usan la misma figura de agente:

| **Plataforma** | **Figura declarada** | **Cuándo libera al proveedor** |
| --- | --- | --- |
| GetYourGuide | Agente comercial del proveedor. El contrato de servicio se celebra directamente entre cliente y proveedor; GYG lo concluye en nombre y por cuenta del proveedor y cobra en su nombre | Mensual (quincenal con 2% extra de comisión) |
| Airbnb Experiences | Airbnb Payments es agente de cobro con propósito limitado. El pago del huésped extingue su obligación frente al host | Día siguiente de realizada la experiencia |
| Civitatis | Intermediario. Solo factura al proveedor la comisión negociada | Mensual, al inicio del mes siguiente |
| **Finde** | **Agencia minorista: compra al operador y vende al turista, con custodia** | **Regla de tres condiciones (sección 5.1)** |

**Ojo con leer esta tabla como un modelo a copiar.** Las tres plataformas usan la figura de agente, que es justamente la que la v1.6 descartó. Se mantienen acá porque siguen siendo la referencia de **cuándo se libera el dinero al proveedor**, que es lo que la sección 5 resuelve, no de cómo se emiten los comprobantes. Las tres operan con volumen y estructura que Finde no tiene: Airbnb opera su propia entidad de pagos con licencia y GetYourGuide tiene entidades locales por país. **Finde depende de una pasarela de terceros, y por eso el modelo se declara y se aprueba por escrito con el proveedor antes de integrar** (sección 10.1).

## 4.3 Requisitos documentales del circuito minorista (vinculantes)

La figura de agencia minorista solo se sostiene si la operación real la respalda. SUNAT evalúa la forma efectiva de actuación, no la denominación del contrato. Estos cuatro requisitos son condición para operar:

1. **Contrato marco con cada agencia** que declare expresamente que la agencia le vende a Finde el servicio turístico por su precio neto, que Finde lo comercializa al turista por cuenta propia al precio de venta al público, y que la agencia **se obliga a emitir factura con IGV a Finde** y a comunicar cualquier cambio de régimen tributario (Anexo A.3 y A.8).
2. **Identificación de la agencia como operador del servicio** en el listing, el checkout, el voucher y los T&C del viajero. **Esto no cambia con el circuito nuevo y es más importante que antes:** el viajero tiene que saber quién presta el servicio aunque le compre a Finde. Coincide con el principio de identidad visible de la agencia (Finde no opera en white-label).
3. **Factura de la agencia a Finde como condición de payout.** Sin factura recibida y validada, no se libera el pago (sección 5.1). Es el requisito que sostiene el crédito fiscal, o sea el margen: sin ella la reserva deja S/0.56 en vez de S/15.21.
4. **Boleta de venta electrónica al viajero por el PVP completo**, emitida por Finde, con el emisor electrónico configurado antes de la primera venta real. Los S/96 de la agencia se registran como **costo de venta**, no como pasivo en tránsito.

| **PENDIENTE DE CONFIRMACIÓN CON TRIBUTARISTA: la detracción (SPOT)** Hay que confirmar **si los servicios turísticos que Finde compra a la agencia caen en el Anexo 3 del SPOT**, que aplica una detracción del **12% sobre operaciones mayores a S/700**. Si aplica, Finde no le paga el 100% del neto a la agencia: **deposita el 88% en su cuenta CCI y el 12% en su cuenta de detracciones del Banco de la Nación**. No cambia lo que la agencia recibe en total, pero sí **cuándo y en qué cuenta**, y **hay que advertírselo a las agencias antes de la primera liquidación**, no después. Una liquidación que llega 12% corta sin aviso previo es un problema de confianza, no de contabilidad. Aplica por operación, así que una reserva de S/120 no lo gatilla y una compra agregada de varias reservas del mismo tour podría. **Confirmar también el criterio de agregación.** |
| --- |

| **Pendiente de asesoría profesional (se mantiene de v1.5)** El **ITF** y la eventual calificación como sistema de pagos organizado por el movimiento sistemático de fondos (Ley 28194) siguen requiriendo pronunciamiento. **El circuito minorista simplifica este punto**, porque los fondos que Finde mueve son mayormente propios y no de terceros, pero la consulta se mantiene abierta hasta tener la respuesta por escrito. |
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

## 5.1 Liquidación: regla de tres condiciones

| **Regla de payout (vinculante, tres condiciones desde v1.6)** Finde libera el pago a la agencia cuando se cumplen **las tres** condiciones siguientes, en la fecha de la que ocurra más tarde:
**(a)** la **factura de la agencia a Finde** fue recibida y validada,
**(b)** la pasarela ya abonó los fondos en la cuenta de Finde, y
**(c)** transcurrieron 48 horas desde la finalización del tour sin reclamo abierto del viajero. |
| --- |

| **El reloj de la pasarela arranca en el COBRO, no en el tour** La v1.5 daba por hecho que la condición que manda es casi siempre la pasarela, porque tarda más. **Eso solo es cierto en reservas de última hora.** El plazo de la pasarela corre desde que se cobra, así que **en una reserva anticipada la pasarela abona semanas antes de que el tour ocurra**, y ahí la condición vinculante es **tour + 48h**. En una reserva del mismo día manda la pasarela. **El sistema tiene que evaluar las dos fechas y quedarse con la más tardía, no asumir cuál gana.** Es la corrección de un supuesto, no un cambio de política. |
| --- |

**Flujo completo:**

- **Paso 1. El viajero paga.** El PVP entra a Finde vía pasarela y queda en custodia. NO va directo a la agencia. **Se registra como ingreso de Finde por el PVP**, y el neto de la agencia como **cuenta por pagar comercial** contra su factura. Ya no son fondos de terceros.

- **Paso 2. Se ejecuta el tour.** Empieza a correr la ventana de reporte de 48 horas del viajero (sección 4.4).

- **Paso 3. La agencia emite su factura a Finde** por su precio neto, con IGV. Sin factura recibida y validada el pago no se habilita (sección 4.3). **La factura se le pide al confirmarse la reserva, no al terminar el tour**, por el motivo de caja de la sección 5.4.

- **Paso 4. Abono de la pasarela.** Los fondos llegan a la cuenta de Finde. El plazo depende del proveedor: hasta 4 días hábiles para iniciar el procesamiento más 1 a 2 días de acreditación, contados **desde el cobro**.

- **Paso 5. Transferencia CCI.** Finde transfiere el neto íntegro a la agencia. **Ya no emite factura de comisión**: su margen es la diferencia entre lo que vendió y lo que compró, y no se documenta con un comprobante aparte.

| **Ejemplo práctico, reserva de última hora** Tour del sábado 6 de junio, neto S/96, PVP S/120. El viajero pagó el 1 de junio. La agencia facturó a Finde el 2 de junio, al confirmarse la reserva. La ventana de 48 horas cierra el lunes 8 sin reclamo. La pasarela abona el miércoles 10. **Finde transfiere S/96 el miércoles 10**, el mismo día que dispone de los fondos. Manda la pasarela. |
| --- |

| **Ejemplo práctico, reserva anticipada, que es el caso que v1.5 no contemplaba** Mismo tour, mismo neto, pero el viajero paga el **1 de abril** para un tour del **6 de junio**. La agencia factura el 2 de abril. **La pasarela abona el 10 de abril**, casi dos meses antes del tour. **Finde transfiere S/96 el 8 de junio**, cuando cierra la ventana de 48 horas. Manda el tour, no la pasarela. Y en el medio Finde tuvo dos meses el neto comprometido con esa agencia, que es exactamente lo que la sección 5.4 obliga a segregar contablemente y a mostrarle en su panel. |
| --- |

| **Parámetro** | **Regla Finde** | **Comparación con la competencia** |
| --- | --- | --- |
| Disparador del pago | Factura de la agencia + abono de pasarela + 48h post-tour sin reclamo, lo que ocurra más tarde | Viator, GYG, Klook: corte mensual. Airbnb: día siguiente |
| Condición documental | La agencia debe haber emitido **factura con IGV a Finde** | No aplica (modelos distintos) |
| Frecuencia | Continua, por reserva. Sin cortes de calendario | Viator: cierre mensual único |
| Método de pago | Transferencia CCI | n/a |
| Monto mínimo para pagar | S/50 acumulados. Por debajo se acumula al siguiente | Viator: US$50 (~S/190) |
| Costo de la transferencia | Finde asume el costo | Estándar Klook/Airbnb |
| Retención de seguridad | Sin retención en Fase 1 | GYG retiene % a todos |

| **Ventaja competitiva** Finde paga por reserva y en cuanto dispone de los fondos, cuando las plataformas globales pagan por corte mensual. Para agencias peruanas con flujo de caja ajustado, es el diferenciador operativo más fuerte del modelo. GetYourGuide incluso cobra 2% extra por adelantar el pago a quincenal. |
| --- |

| **Riesgo asumido y su mitigación** El viajero conserva hasta 90 días para iniciar un contracargo bancario, plazo que ninguna ventana de payout puede cubrir. Si el contracargo llega después de pagada la agencia, Finde debe recuperar los fondos de ella. Mitigación: cláusula de repetición en el contrato marco (Anexo A), descuento del siguiente payout, y **rolling reserve del 5-10% para agencias nuevas a partir de la Fase 2** (sección 5.2). |
| --- |

**Nota de negociación: el cobro adelantado parcial quedó resuelto.** Durante las conversaciones de onboarding, algunas agencias plantearon cobrar una parte por adelantado, antes de prestar el servicio. **Quedó resuelto y no es una decisión abierta: las agencias aceptaron cobrar contra prestación del servicio**, que es lo que esta sección describe. Se deja escrito porque la pregunta va a volver a aparecer con cada agencia nueva y conviene saber que ya se conversó y cómo terminó.

## 5.2 Retención de seguridad (solo Fase 2)

**En la Fase 1 NO se retiene nada adicional a la custodia estándar.** En Fase 2 se introducirá un rolling reserve del 5-10% durante 90 días para agencias nuevas, como colchón ante reclamos o chargebacks.

## 5.3 Disputas y su impacto en el payout

Si hay una disputa abierta sobre una reserva específica, el monto de esa reserva se retiene del payout hasta resolverse. El resto del payout se transfiere normalmente.

## 5.4 Capital de trabajo

**El capital de trabajo dejó de ser cero en v1.6, y es una corrección obligatoria, no un matiz.** Por el lado del payout la afirmación de v1.5 sigue en pie: Finde paga cuando ya tiene el dinero, así que no adelanta fondos para liquidar. **Lo que aparece es un desfase de IGV que antes no existía.**

| **Desfase de IGV (nuevo en v1.6)** En el circuito minorista, **Finde emite boleta al viajero al momento del cobro y recibe la factura de la agencia después**. Eso genera un desfase de IGV de **hasta S/14.64 por reserva**, que Finde adelanta y recupera en el período siguiente. **Con 400 reservas mensuales de reserva anticipada, la exposición ronda los S/6,000 flotantes.** |
| --- |

**Mitigación evaluada: exigirle a la agencia que facture al confirmarse la reserva y no al terminar el tour**, con lo que el crédito fiscal entra en el mismo período que el débito y el desfase se cierra. Es lo que el paso 3 de la sección 5.1 ya pide.

| **PENDIENTE DE VALIDACIÓN TRIBUTARIA** Hay que confirmar que **emitir factura antes de prestar el servicio es compatible con la oportunidad de emisión** que le corresponde a la agencia. Si no lo fuera, la mitigación no se puede exigir y el desfase se asume. **Documentar las dos variantes con su impacto en caja** antes de fijarlo en el contrato marco. Se resuelve en la misma consulta que la oportunidad de emisión de la boleta de Finde (sección 2.2.1): son la misma pregunta vista desde los dos lados del circuito. |
| --- |

**Y se mantiene el flotante contable**: fondos de la agencia que están en tránsito en la pasarela o en la cuenta de Finde a la espera de que cierren las tres condiciones. No es un costo, pero es dinero comprometido bajo control de Finde, y debe estar segregado contablemente y visible en el dashboard de agencia.

| **Volumen mensual** | **GMV mensual (S/)** | **Flotante promedio comprometido (S/)** |
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

| **Lo que la v1.6 le agrega a la verificación, y no es un trámite más** Hasta la v1.5 la verificación respondía una sola pregunta: **si la agencia existe y es formal**. Con el circuito minorista responde una segunda, que es económica: **si la agencia puede emitir factura con IGV**. De eso depende que la reserva deje S/15.21 o S/0.56 (sección 2.2.4). Por eso los requisitos del Nivel 2 dejaron de ser declaraciones de la agencia y pasaron a ser **evidencia archivada en un expediente**. |
| --- |

**Roadmap (piloto → Fase 2): verificación con agentes de IA.** Agentes que validan automáticamente que el RUC esté activo en SUNAT (vía API) y el registro MINCETUR vigente, y no solo al alta: **verificación continua** en el tiempo. La confianza como dato, no como promesa. Nota técnica: la consulta de RUC tiene APIs confiables; el registro MINCETUR requiere procesamiento del directorio público (donde el agente de IA aporta valor real).

Sistema de dos niveles (diseño vigente):

|  | **Finde Basic (Nivel 1)** | **Finde Verificado (Nivel 2)** |
| --- | --- | --- |
| Qué es | La agencia completó el registro con su info básica | La agencia pasó los **cinco requisitos duros de la sección 6.2**, con la evidencia archivada en su expediente |
| Puede publicar tours | ✓ | ✓ |
| Puede recibir reservas y pagos | **Solo si emite factura con IGV.** Ver la condición de vigencia de 2.2.1 | ✓ |
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

### Nivel 2: Finde Verificado (requisitos duros antes de `verified = true`)

Todo lo del Nivel 1, más los cinco requisitos de abajo. **Ninguno es una declaración de la agencia: los cinco se acreditan con un documento que queda archivado en el expediente de esa agencia.** Sin los cinco, no hay sello.

| **#** | **Requisito** | **Evidencia que se archiva** |
| --- | --- | --- |
| 10 | **RUC activo y habido** | Captura fechada del cruce en Consulta RUC de SUNAT |
| 11 | **Régimen tributario que permita emitir factura con IGV** | El régimen declarado más una **factura de muestra** emitida por la agencia. Es el requisito que sostiene el margen: ver 2.2.4 |
| 12 | **Inscripción vigente en el Directorio Nacional MINCETUR** | Número de inscripción, región y constancia. Cruce contra el DNPSTC |
| 13 | **Póliza vigente de responsabilidad civil** | Copia de la póliza con **tipo de cobertura, sumas aseguradas, deducible**, verificación de que **cubre la actividad concreta** del tour, y **Finde incorporado como asegurado adicional** |
| 14 | **Certificado de autorización de turismo de aventura o canotaje**, cuando el tour caiga en esas categorías | Certificado vigente del operador. **Sin certificado archivado, el tour no se publica** (sección 9.4) |

| **La póliza se lee, no se recibe** Recibir una póliza no es verificarla. Las cuatro cosas que hay que mirar antes de aceptarla: **qué cubre** (una póliza de responsabilidad civil general puede excluir expresamente actividades de aventura), **por cuánto** (una suma asegurada baja frente al riesgo real no protege a nadie), **cuál es el deducible** (si es alto, en un siniestro chico responde la agencia, que es quien puede no tener con qué) y **si Finde figura como asegurado adicional** (sin eso, la póliza cubre a la agencia y no a Finde, que es quien vendió y a quien el viajero le reclama, ver 9.3). |
| --- |

| **Recheck periódico: el estado de hoy no es el de dentro de seis meses** Los requisitos 10, 11, 12 y 13 **caducan en la práctica sin avisar**. Un RUC pasa a no habido, un régimen cambia, una inscripción vence, una póliza no se renueva, y **nada de eso genera una notificación**: la agencia sigue publicada con su sello. **El recheck es obligatorio y su periodicidad es decisión abierta (sección 12).** Mientras no esté automatizado, va con fecha en el expediente y con un responsable. La verificación continua por agentes de IA, que ya estaba en el roadmap, es la forma de resolverlo cuando el volumen lo pida. |
| --- |

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

## 9.3 Responsabilidad frente al viajero: el contrato reparte, pero no exime

| **Regla de lectura obligatoria antes de negociar el contrato marco** El contrato reparte responsabilidad entre Finde y la agencia, **pero NO exime a Finde frente al viajero.** INDECOPI ha establecido que el proveedor responde por la **idoneidad de los servicios que brinda directa o indirectamente**, y que **contratar a un tercero para ejecutarlos no lo exime**. **El contrato sirve para repetir contra la agencia, no para no responder.** |
| --- |

**Por qué esto pesa más en v1.6 que en v1.5.** La defensa de la versión anterior era que Finde solo intermediaba y que el prestador estaba identificado. **Con el circuito minorista Finde es además el vendedor y el emisor del comprobante del viajero**, así que esa defensa pierde fuerza justo donde antes era más útil. La conclusión práctica no cambia de dirección, cambia de tamaño: hay que asumir que **frente al viajero responde Finde**, y organizar todo lo demás en función de eso.

**Las tres cosas que se derivan, y ninguna es opcional:**

- **Repetición contractual.** Si Finde paga una multa, una indemnización o un reembolso por culpa de la agencia, **la agencia lo reintegra**, y Finde puede compensarlo contra liquidaciones futuras y retener payouts. Va al contrato marco (Anexo A.8).
- **Póliza con Finde como asegurado adicional.** Una cláusula de indemnidad contra una agencia que no tiene con qué responder es papel. **La póliza es lo que la vuelve cobrable**, y por eso es requisito de verificación (sección 6.2) y no una recomendación.
- **Identificación de la agencia igual.** Se mantiene en listing, checkout, voucher y T&C. **Ya no como defensa de responsabilidad sino como obligación de información al consumidor**, que es otra exigencia y se cumple igual.

**El Finde Guarantee** se presenta como servicio de buena fe con topes definidos, **no como garantía contractual ilimitada**. Esto no cambia.

## 9.4 Clasificación MINCETUR: qué es Finde, qué son las agencias, y qué obliga eso

### 9.4.1 El reparto de roles

| **Clasificación (regla vinculante)** **Finde es una agencia de viajes y turismo MINORISTA**, con modalidad de comercialización **exclusivamente digital**, inscrita en el **Directorio Nacional de Prestadores de Servicios Turísticos Calificados** (DS 005-2020-MINCETUR). **Las agencias proveedoras son OPERADORES DE TURISMO: ellas operan, Finde vende al turista. Finde NO opera servicios turísticos organizados.** |
| --- |

**El sustento normativo.** El DS 005-2020-MINCETUR define agencia de viajes y turismo como toda persona natural o jurídica que realiza actividades de organización, mediación, coordinación, promoción, asesoría, venta y operación de servicios turísticos (art. 3.1.a). Entre las actividades de la agencia **minorista** figuran expresamente "intermediar programas organizados y operados por otras agencias" y "comercializar programas y demás servicios turísticos directamente al turista" (art. 7.1.1). El art. 21 obliga a cualquier prestador que desarrolle funciones de agencia a inscribirse. **Finde comercializa y cobra al turista programas operados por terceros: le corresponde inscribirse como agencia minorista con canal digital exclusivo.**

**Y el reparto no es una formalidad de registro: define qué puede hacer Finde.** Un operador de turismo organiza y opera el servicio. Una minorista lo comercializa. **Finde no puede armar ni ejecutar un tour propio sin cambiar de clasificación**, y eso incluye cosas que parecen de producto: contratar directamente a un guía, definir el itinerario por su cuenta o vender un tour sin una agencia operadora detrás. Marco de referencia sectorial: Ley N.º 32392, Nueva Ley General de Turismo, y su reglamento DS 002-2026-MINCETUR.

### 9.4.2 Las tres obligaciones que derivan de la clasificación

**1. Turismo de aventura y canotaje: certificado archivado ANTES de publicar.** Finde debe **verificar y archivar el certificado de autorización vigente del operador** antes de publicar cualquier tour de esas categorías (art. 17.4 y normativa específica de canotaje). **Es fiscalizable**, o sea que no alcanza con haberlo mirado: tiene que estar en el expediente y tiene que estar vigente. **Sin certificado archivado, el tour no se publica**, y esto es un control de publicación, no un requisito de onboarding: una agencia verificada puede cargar mañana un tour de aventura que no tenía antes.

**2. Código de Conducta contra la ESNNA: la declaración jurada es DE FINDE.** La adhesión al Código de Conducta contra la explotación sexual de niñas, niños y adolescentes (RM 430-2018-MINCETUR) exige **declaración jurada del titular de la agencia**. **Acá la agencia es Finde**, así que la declaración la firma el titular de Finde. **No se cubre pidiéndosela a las agencias proveedoras**, que tienen la suya por su cuenta. El afiche ESNNA visible en la web ya está listado como contenido obligatorio en el cuadro de abajo.

**3. Distintivo oficial MINCETUR: se puede usar, una vez inscrito.** Con la constancia de inscripción, Finde puede exhibir el **distintivo oficial** en la landing, y la denominación "Agencia de Viajes y Turismo". **Antes de tener la constancia, ninguno de los dos** (art. 15.7). Es un activo de confianza real y gratuito: conviene usarlo en la landing apenas exista, junto al resto del contenido obligatorio del art. 22.1.a.

### 9.4.3 Requisitos concretos del registro de Finde

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

- **Finde emite boleta de venta electrónica al viajero por el PVP completo** y **la agencia le emite factura a Finde por su neto** (circuito minorista, v1.6). Finde **no** emite factura de comisión a la agencia. Ver sección 2.2.1 y su condición de vigencia.

- La **factura de la agencia a Finde** es **condición de payout** (secciones 4.3 y 5.1), y es lo que sostiene el crédito fiscal.

- El **ingreso bruto de Finde es el PVP**, y el neto de la agencia es **costo de venta**. Ya no hay fondos de terceros registrados como pasivo. Esto cambia el umbral de salida del RMT: ver el pendiente de la sección 2.3.

- **Emisión electrónica:** Finde necesita emitir boletas desde la primera venta real. SEE-SOL de SUNAT es gratuito y sirve para arrancar; un OSE o emisor como Nubefact, Bsale o Efact (~S/50/mes) es lo que permite emitir desde el sistema. **Es un pendiente de lanzamiento con impacto técnico**, no solo administrativo.

- **Forma societaria: SAC** (Sociedad Anónima Cerrada). Se descarta la SACS: solo admite personas naturales como accionistas, lo que bloquea el ingreso de la consultora de Franco o de un fondo, y es un vehículo poco reconocido en due diligence.

- **Objeto social** debe cubrir, como mínimo: servicios de agencia de viajes y turismo (minorista y operador de turismo), intermediación y comercialización de servicios turísticos por canales digitales, desarrollo y explotación de plataformas y software, y servicios de publicidad y marketing digital. Si el objeto social no menciona agencia de viajes, se traba el registro MINCETUR y el giro declarado ante la pasarela.

- **Régimen tributario: RMT** (Régimen MYPE Tributario). Permite ingresos de hasta 1,700 UIT anuales, 10% de IR sobre utilidades hasta 15 UIT y 29.5% sobre el exceso, y arrastre de pérdidas, que importa porque los primeros meses son deficitarios. Se descarta el RER por su tope de S/525,000 y por no permitir arrastre de pérdidas.

- **Ejecución del fondo MINCETUR (hasta 30-nov-2026):** los comprobantes del fondo se emiten al RUC personal de Jose Luis Cancino Cuellar. Los gastos de la SAC se emiten al RUC de la SAC. **Cero cruces entre ambas contabilidades.** Confirmar por escrito con FDA-UNALM e Incubagraria si la constitución durante la ejecución requiere comunicación previa.

- Todo pago a agencia >S/2,000 pasa por medio bancario (Ley 28194).

- **Pendiente de tributarista (tres puntos, ver secciones 2.2.1, 2.3 y 4.3):** aplicación de la **detracción (SPOT)** a los servicios turísticos comprados a la agencia, **oportunidad de emisión** de la boleta al viajero, y **umbral de salida del RMT** calculado sobre el GMV. Se mantiene abierto el tratamiento del **ITF**.

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

## 10.1 Posicionamiento ante las pasarelas

| **Cómo se presenta Finde (regla vinculante)** Finde se presenta como **comercio de turismo, agencia de viajes minorista con canal digital**. **NUNCA como facilitador de pagos, agregador, marketplace ni "solo intermediario".** Esas cuatro palabras describen negocios que los contratos de afiliación listan como prohibidos o restringidos, y usarlas en la conversación comercial abre una puerta que después no se cierra. |
| --- |

**El circuito minorista simplifica esta conversación, y ese es uno de sus beneficios menos obvios.** Finde cobra por lo que vende, con su propio comprobante al comprador. Eso es un comercio común y corriente para cualquier pasarela.

**Producto requerido: checkout de e-commerce con cargo único.** **NO split de pagos, NO subcomercios, NO cuentas conectadas.** El dinero entra completo a la cuenta de Finde y Finde le paga a la agencia por transferencia, que es una operación fuera del circuito de la pasarela.

| **Esto cambia la prioridad de proveedores que traía la v1.5** El Split de Pagos de Mercado Pago era prioridad 1 **porque resolvía el riesgo de manejar dinero ajeno**, que en el modelo de agente era el problema central. **Con el circuito minorista ese riesgo desaparece**: el dinero es de Finde hasta que le paga a la agencia. La tabla de la sección 10.2 se mantiene como está, pero **el criterio de selección ya no es quién tiene split, sino costo, disponibilidad de add-ons y velocidad de abono.** Revisar la prioridad con ese criterio antes de decidir. |
| --- |

**Add-ons que se piden explícitamente en la afiliación**, porque ninguno viene por defecto:

| **Add-on** | **Para qué** |
| --- | --- |
| **Tarjetas internacionales** | El turista extranjero es parte del mercado objetivo y su tarjeta no es local |
| **3DS (autenticación del titular)** | Reduce fraude y traslada responsabilidad del contracargo en las operaciones autenticadas |
| **Yape y billeteras** | Es el método de pago masivo en Perú y está en los parámetros base del modelo |
| **Webhook de confirmación** | La reserva no se confirma sola: el sistema necesita el evento para pasar el estado y disparar los correos |

| **RIESGO ABIERTO, PENDIENTE DE CONFIRMACIÓN: el MCC de turismo puede costar bastante más** El código de comercio (MCC) probable de Finde es **4722, agencias de viajes**. Según fuentes de mercado, **la tasa para turismo puede llegar a 4.45% + IGV**, contra el **~3.5%** que asume el modelo financiero de este documento. **Si se confirma, el margen por reserva baja de S/15.21 a ~S/14 y el punto de equilibrio del piloto sube de 43 a ~47 reservas al mes.** No cambia la viabilidad del modelo, pero cambia el número que se usa en el pitch y en las postulaciones. **Confirmarlo por escrito con cada pasarela junto con la aprobación del modelo, y en la misma conversación**, porque es el mismo interlocutor y la misma reunión. |
| --- |

## 10.2 Métodos de pago y pasarela

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

- **Tarjetas internacionales** deben solicitarse explícitamente durante la afiliación. No vienen por defecto. La lista completa de add-ons a pedir está en la sección 10.1.
- **PCI:** usar el checkout embebido o la tokenización del proveedor. Integrar pasarela propia exigiría certificación PCI con AOC vigente.
- **Comisión mínima:** algunas pasarelas aplican piso por transacción (Culqi: S/3.50 para montos menores a S/87.72). Afecta a los tours del extremo bajo del rango (S/80).
- **Poder de negociación:** el BCRP reporta que la comisión promedio de facilitadores bajó de 3.27% a 2.92%. Las tarifas de lista son negociables con volumen.

**Regla de arquitectura:** la integración se construye detrás de una interfaz abstracta de proveedor de pagos (`createCharge`, `capture`, `refund`, `handleWebhook`). Ninguna lógica de negocio se acopla a un proveedor específico. El proveedor final aún no está decidido y el costo de cambiarlo debe mantenerse bajo.

**Estado de implementación:** el flujo de pago del producto está tras la bandera DEMO_PAYMENT_FLOW (solo demo). Antes de onboarding de agencias reales: DEMO_PAYMENT_FLOW = false. La selección final de pasarela debe verificar soporte y costos vigentes directamente con los proveedores, **incluida la tasa real del MCC de turismo** (sección 10.1).

## 10.3 Reglas de pagos

- **Todo en soles (S/).** Una sola moneda.

- **Custodia total:** el 100% del pago entra a Finde **como vendedor del servicio** y el neto de la agencia se libera al cumplirse las tres condiciones de la sección 5.1. **Aunque los fondos ya son de Finde, el neto comprometido se segrega contablemente** y es visible para la agencia en su dashboard (sección 5.4).

- El costo de la pasarela sale del margen de Finde (está dentro del 20% de take rate). NO se cobra al viajero ni se traslada a la agencia como línea aparte.

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
| Pago a las agencias | Con factura recibida, pasarela abonada y 48h del tour cumplidas | Viator/GYG/Klook: mensual. Airbnb: día siguiente |
| Respuesta a Libro de Reclamaciones | Máximo 30 días | Obligatorio por Ley 32495 |
| Primera respuesta soporte | 48 horas | Estándar |
| Onboarding agencia nueva (Nivel 1) | 3-5 días hábiles | Viator: 1-2 semanas |
| Apelación de desactivación | 30 días | Airbnb: 30 días |

| **El stack de confianza de Finde** Custodia total del pago + payout apenas se cumplen las tres condiciones + Finde Guarantee + verificación de agencias con expediente (SUNAT, régimen, MINCETUR, póliza) + soporte en español peruano vía WhatsApp (agente de IA 24/7 y quechua en roadmap) + Libro de Reclamaciones visible + precio total transparente. Esto es lo que ninguna OTA global replica rápido en Perú, y lo que separa a Finde de la reserva informal por WhatsApp. |
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
| 11 | Alinear PRD Técnico v5 con la **figura de agencia minorista**, el circuito de comprobantes de la v1.6 y el modelo neto + markup | Coherencia documental | José |
| 12 | Definir techo de subsidio (monto y plazo) para markups por debajo del piso de 15% | Disciplina de negociación | José |
| 13 | Implementar en schema: precio neto, markup por tour, PVP calculado, historial de cambios y precio congelado en la reserva | Todo el modelo de precio | Franco |
| 14 | Eliminar del copy toda promesa de mejor precio. Reemplazar por precio seguro | INDECOPI y coherencia con markup | José |
| 15 | Llevar el Anexo A al abogado para redactar el contrato marco, **incluida la A.8 nueva** | Onboarding de agencias reales | José |
| 16 | **Reunión con tributarista, agenda de la v1.6:** si los servicios turísticos caen en el **Anexo 3 del SPOT** (detracción 12% sobre operaciones mayores a S/700), **oportunidad de emisión** de la boleta al viajero y de la factura de la agencia, y **umbral de salida del RMT** calculado sobre el GMV | El circuito entero: contrato marco, emisor electrónico y proyecciones | José |
| 17 | **Contratar y configurar emisión electrónica de boletas** (Nubefact, Bsale o similar). **Suma endpoints y hoy hay 12 de 12 funciones en Vercel** | Primera venta real | Franco |
| 18 | **Inscribir a Finde en el Directorio Nacional MINCETUR como agencia minorista** con canal digital exclusivo | Distintivo oficial, contenido obligatorio de la web, y operar conforme | José |
| 19 | **Declaración jurada de adhesión al Código de Conducta contra la ESNNA**, firmada por el titular de Finde, más el afiche visible en la web | Registro MINCETUR y fiscalización | José |
| 20 | **Verificar el régimen tributario y la factura de muestra de las 14 agencias ya registradas.** Las que no puedan facturar con IGV no pueden operar bajo el circuito nuevo | Primera venta real con cada agencia | José |
| 21 | **Pedir y archivar los certificados de aventura y canotaje** de los tours publicados que caigan en esas categorías. Sin certificado, el tour se pausa | Publicación de esos tours. **Es fiscalizable** | José |
| 22 | **Definir la periodicidad del recheck de verificación** (RUC, régimen, MINCETUR, póliza) y quién lo corre mientras sea manual | Que el sello siga diciendo la verdad a los seis meses | José |
| 23 | **Confirmar por escrito con cada pasarela la tasa real del MCC de turismo**, en la misma conversación donde se aprueba el modelo | Modelo financiero y punto de equilibrio | José |
| 24 | **Advertir a las agencias sobre la detracción antes de la primera liquidación**, si el tributarista confirma que aplica | Confianza en el primer payout | José |

| **Aviso** Este documento no sustituye asesoría legal ni contable. Los puntos de estructura societaria, tributación y registro sectorial requieren pronunciamiento de un abogado corporativo y un contador tributarista peruanos antes de operar con pagos reales. |
| --- |


# Anexo A. Pliego de cláusulas para el contrato marco con agencias

Insumo para el abogado. No es un contrato: es la lista de lo que el contrato debe resolver, para no pagar honorarios por descubrir el modelo de negocio.

## A.1 Naturaleza de la relación

- Finde actúa como **agencia de viajes y turismo minorista**: **compra** el servicio turístico a la agencia por su precio neto y **lo comercializa al turista** por cuenta propia al precio de venta al público.
- **La agencia es el operador del servicio.** Finde no organiza ni ejecuta el servicio turístico, y la agencia no puede subcontratarlo sin aviso y aprobación previa.
- La venta al turista es de Finde. **La agencia no tiene acción contra el viajero: su cliente es Finde.**
- El neto comprometido con la agencia **se segrega contablemente** y es visible para ella en su panel, aunque los fondos sean de Finde desde el cobro.
- Nada en el contrato constituye sociedad, joint venture, relación laboral ni exclusividad.

## A.2 Precio y markup

- La agencia declara un **precio neto** por tour y por tipo de pasajero.
- La agencia **autoriza expresamente** a Finde a fijar el precio de venta al público aplicando un markup acordado, dentro de un rango pactado por escrito para cada tour.
- La agencia acepta que **Finde emita el comprobante al viajero por el precio de venta al público**, y que ese comprobante sea de Finde y no de la agencia.
- Finde informa a la agencia el precio de venta al público de cada reserva. La agencia lo conoce y lo ha preautorizado.
- Cambios de neto: preaviso mínimo de 48 horas, frecuencia máxima de un cambio cada 7 días fuera de temporada alta, aplicables solo a reservas nuevas.
- **Irretroactividad absoluta:** ningún cambio de precio afecta reservas ya confirmadas.

## A.3 Obligaciones tributarias

- La agencia se obliga a **emitir factura electrónica a Finde, con IGV, por su precio neto**, dentro del plazo legal. **Boleta no cumple esta obligación.**
- **La recepción y validación de esa factura es condición suspensiva del pago** a la agencia.
- La agencia se obliga a **facturar al confirmarse la reserva**, no al terminar el tour, en la medida en que su oportunidad de emisión lo permita (sujeto a validación tributaria, sección 5.4).
- **Finde emite boleta de venta electrónica al viajero por el precio de venta al público.** Finde no emite factura de comisión a la agencia.
- La agencia **declara su régimen tributario, acredita que le permite facturar con IGV, y se obliga a comunicar por escrito cualquier cambio de régimen dentro de los 5 días hábiles.** Un cambio que le impida facturar con IGV **suspende su operación en la plataforma** hasta regularizarse.
- **Advertencia de detracción:** si el servicio queda sujeto al SPOT, Finde deposita el porcentaje que corresponda en la cuenta de detracciones de la agencia y el saldo en su CCI. La agencia lo acepta expresamente y declara su cuenta de detracciones.
- Cada parte responde por sus propias obligaciones tributarias. Ninguna asume las de la otra.

## A.4 Custodia y liquidación

- **Regla de tres condiciones:** pago cuando la factura de la agencia fue recibida y validada, **y** la pasarela abonó, **y** transcurrieron 48 horas del tour sin reclamo. Se paga en la fecha de la que ocurra más tarde.
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

- La agencia **declara, acredita con documento y mantiene**: RUC activo y habido, régimen que le permita facturar con IGV, inscripción vigente en el Directorio Nacional de Prestadores de Servicios Turísticos, y **certificado de autorización de turismo de aventura o canotaje** cuando corresponda.
- **El certificado de aventura o canotaje es condición de publicación del tour**, no del alta de la agencia. Sin certificado vigente archivado, ese tour no se publica.
- Autorización a Finde para verificar esa información de forma continua contra fuentes oficiales, **y obligación de responder a los rechequeos periódicos** dentro del plazo que Finde indique.
- Adhesión al Código de Conducta contra la ESNNA.
- Tratamiento de datos personales del viajero: la agencia actúa como encargada, con finalidad limitada a la prestación del servicio.

## A.7 Salida y varios

- Vigencia indefinida. Cualquiera de las partes puede terminar con 30 días de preaviso.
- Las reservas confirmadas al momento de la salida **se honran** hasta su ejecución.
- Suspensión inmediata sin preaviso ante queja grave y verificable de seguridad.
- Ley peruana. Domicilio y foro en Lima.
- Modificaciones a los Términos y Condiciones operativos con preaviso de 30 días y derecho de la agencia a terminar sin penalidad.

## A.8 Responsabilidad, seguros e indemnidad (nuevo en v1.6)

**Los siete bloques que el circuito minorista hace necesarios.** Van juntos porque se sostienen entre sí: la indemnidad sin póliza es papel, y la póliza sin facultad de compensación tarda un juicio en cobrarse.

1. **Responsabilidad de la agencia por el servicio y por la seguridad de los pasajeros.** La agencia responde por la prestación, por la idoneidad del servicio y por la seguridad de las personas durante su ejecución. **Esto no exime a Finde frente al viajero** (sección 9.3): reparte responsabilidad entre las partes.
2. **Obligación de póliza vigente con Finde como asegurado adicional**, acreditada al alta y **renovada sin requerimiento**. La póliza debe cubrir la actividad concreta que la agencia opera. La caducidad de la póliza suspende la publicación de sus tours.
3. **Indemnidad.** Si Finde paga una multa, una indemnización, un reembolso o un costo de defensa **por causa imputable a la agencia**, la agencia se lo reembolsa íntegramente, incluidos los gastos razonables.
4. **Compensación contra liquidaciones futuras y retención de payouts.** Finde queda expresamente facultado a **descontar de liquidaciones futuras** los montos que la agencia le deba por indemnidad, contracargos o reembolsos, y a **retener payouts** mientras un caso esté abierto.
5. **Suspensión inmediata ante siniestro.** Ante un siniestro con daño a personas, Finde puede **suspender de inmediato y sin preaviso** la publicación y la venta de los tours de esa agencia, hasta esclarecer los hechos. La suspensión no genera indemnización a favor de la agencia.
6. **Obligación de emitir factura con IGV y de comunicar cambio de régimen** (detalle en A.3). Es la cláusula que sostiene la economía del circuito, no un requisito administrativo.
7. **Advertencia de detracción**, si el tributarista confirma que aplica: Finde deposita el porcentaje correspondiente en la cuenta de detracciones de la agencia. **Se advierte antes de la primera liquidación**, no en la liquidación.

| **Aviso** Este anexo no es un contrato ni sustituye asesoría legal. Es una lista de puntos a resolver, redactada para acortar el tiempo de un abogado corporativo peruano. |
| --- |

Página
