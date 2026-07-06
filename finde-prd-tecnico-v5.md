finde — PRD Técnico v5 · Confidencial

**finde****.**

**Product Requirements Document — PRD Técnico v5**

*Marketplace de Tours y Experiencias para el Perú*

Documento técnico definitivo · Refleja el estado real del producto en julio 2026

| **Campo** | **Detalle** |
| --- | --- |
| Versión | 5.0 — consolidada con estado real de producción post-módulos M1-M4 |
| Fecha | Julio 2026 |
| Estado del producto | MVP funcional en producción · Etapa pre-comercial (sin transacciones reales) |
| URL | finde.pe (landing pública) · finde.pe/demo (acceso demo con contraseña) |
| Reemplaza a | v4 (mayo 2026) |
| Confidencialidad | Documento confidencial — uso interno y evaluadores |

**Resumen ejecutivo.** Finde tiene un **MVP funcional en producción** (Vercel + Supabase + pgvector): autenticación real (Supabase), gestión completa de tours por parte de las agencias (crear/editar/borrar/pausar, con imágenes propias y galería multi-foto), reservas reales con datos verdaderos en el dashboard, coordinación por WhatsApp con teléfonos reales, búsqueda semántica con embeddings Voyage + razonamiento Claude, generación de descripciones con IA y traducción quechua persistida con toggle ES/QU en producción. 40 tours con embeddings reales y traducción quechua completa (40/40), y 13 agencias (9 verificadas). **Falta para MVP transaccional:** pasarela de pagos con custodia (el flujo actual de pago es solo demo tras bandera), comprobantes electrónicos y el checklist pre-lanzamiento. Modelo de negocio: comisión única 20% todo incluido; economía por reserva S/24 − S/5 = S/19 de margen.

**Terminología:** en todo el producto, la documentación y los materiales, el lado oferta se denomina **"agencias"** (vocabulario MINCETUR/SUNAT). El término "operador" queda deprecado; donde persista en código (p. ej. modelo `Operator`, rutas `/api/operators`) es deuda de nomenclatura interna, nunca copy visible al usuario ni lenguaje de documentos.

# **1. Contexto e historial de versiones**

| **Versión previa** | **Fecha** | **Qué describía** | **Por qué quedó obsoleta** |
| --- | --- | --- | --- |
| PRD v2 (Tambo) | Abril 2026 | Visión, stack ideal y roadmap con el nombre Tambo | Pre-rebranding y pre-prototipo |
| PRD v3 (Finde) | Abril 2026 | 13 vistas del prototipo con datos mockeados | El backend no existía |
| PRD v4 | Mayo 2026 | Demo navegable + backend real; auth, pagos y dashboard como pendientes P0 | **M1-M4 completados**: auth real, gestión de tours, reservas reales, WhatsApp. Comisión y modelo financiero actualizados (15% → 20%) |

La realidad de julio 2026: Finde ya no es un demo con fallbacks mock — es un MVP operativo donde una agencia real puede registrarse, ser verificada, publicar tours con sus propias fotos y recibir reservas coordinadas por WhatsApp. Lo único simulado (y claramente aislado tras bandera) es el pago.

# **2. Visión del producto**

Finde es un marketplace curado (no P2P) que conecta viajeros con **agencias locales verificadas** de tours y experiencias en Perú. Modelo de ingresos: **comisión única del 20% todo incluido, a éxito** — incluye pasarela, soporte y demanda; la agencia solo paga cuando vende. Custodia total del pago: el viajero paga a Finde y el dinero se libera a la agencia al completarse el tour.

## **2.1 Principios estratégicos**

- **Curar, no abrir indiscriminadamente.** GetYourGuide creció a $1.2B cuando abandonó P2P. Vayable, Airbnb Experiences (v1) y Dopios fracasaron con P2P.

- **Supply first.** Digitalizar y captar agencias antes de invertir en adquisición masiva de viajeros.

- **Pagos locales como moat.** Yape + Plin + tarjeta, en soles. Ningún competidor global lo acepta como método nativo.

- **Custodia como base de confianza.** El viajero no le paga a un desconocido; la agencia cobra garantizado aunque haya no-show; Finde retiene el poder de mediación. (Modelo de señal/adelanto parcial evaluado y descartado — ver Reglas de Negocio v1.3, sección 4.1.)

- **IA transversal a toda la solución.** (1) Verificación: agentes que validan RUC activo en SUNAT y registro MINCETUR vigente, con verificación continua (roadmap; hoy manual). (2) Experiencia: búsqueda semántica real, conversación para planificar y recomendaciones por comportamiento (roadmap). (3) Operación: agente de IA en WhatsApp para soporte 24/7 y traducción a quechua (siguiente fase). La IA no es un chatbot decorativo: es el núcleo de la propuesta ("primera plataforma de tours AI-native del Perú").

- **Anti-overtourism y descentralización.** El catálogo prioriza alternativas a destinos masificados (Choquequirao vs. Machu Picchu, Reserva San Fernando vs. Ballestas). La redistribución de flujos es también el argumento de sostenibilidad ambiental.

- **Soporte quechua.** Traducción persistida (variante Cusco-Collao) en los 40 tours: título, descripción, incluye/no-incluye, punto de encuentro y pitch. Toggle ES/QU en producción sin IA en runtime (traducción por lote, una sola vez). Diferenciador único en LATAM. Idioma completo de UI e inglés (EN) en roadmap.

- **Integridad de producto.** Nada falso o mock visible para usuarios reales: sin ratings inventados, sin credenciales simuladas, sin flujos de pago falsos fuera del demo. Este principio ya motivó: ocultar la pestaña Ingresos, remover el mock de pago, remover ratings falsos, eliminar PagoEfectivo y remover métricas de vanidad del UI ("+8,000 experiencias / 52 destinos" reemplazadas por claims defendibles como "agencias verificadas en todo el Perú").

## **2.2 Posicionamiento competitivo**

El mercado global de tours vale $300B pero Viator + GetYourGuide controlan solo 5-6%; más del 90% de las reservas ocurren offline. En Perú no existe plataforma dominante: Turismoi pivoteó a SaaS, Kango es nicho. La alianza Civitatis-Rappi es la amenaza más seria, pero su catálogo apunta al turista extranjero. **El competidor real es WhatsApp**: más del 90% de las reservas actuales ocurren por canales directos informales. El foso de Finde: pagos locales + verificación formal peruana (SUNAT/MINCETUR) + contenido regional + custodia.

**Mercado direccionable:** TAM ~8.7M viajeros (S/1,044M) · SAM ~700K millennials de Lima que reservan en línea (~S/84M) · SOM Año 1 ~5,000 reservas ≈ 400 viajeros/mes (S/600K, <1% del SAM). Metodología: MINCETUR, Ipsos, APEIM; ticket promedio S/120.

## **2.3 Métricas objetivo (modelo financiero validado, julio 2026)**

| **Métrica** | **Año 1** | **Año 2** | **Año 3** |
| --- | --- | --- | --- |
| Reservas/año | 5,000 (~400/mes) | 40,000 | 120,000 |
| GMV (S/) | 600,000 | 4,800,000 | 14,400,000 |
| Ingresos (comisión 20%) | S/120,000 | S/960,000 | S/2,880,000 |
| Utilidad operativa | S/51,000 | S/623,000 | S/1,978,000 |
| Equipo | 1 persona | 3 personas | 6 personas |
| Punto de equilibrio (% del volumen) | 27% | 9% | 5% |

Economía por reserva: ingreso S/24 (20% × S/120) − costo variable S/5 (pasarela ~S/4 + IA ~S/1) = **margen S/19**. Punto de equilibrio del piloto (fundadores sin sueldo, solo infraestructura S/650/mes): **34 reservas/mes**. Validación de demanda: 25 entrevistas (20 viajeros + 5 agencias), 80% de intención de uso.

# **3. Estado real del producto (julio 2026)**

El producto se compone de: landing pública (finde.pe), aplicación demo con acceso por contraseña (finde.pe/demo), y un MVP funcional con backend real. Los módulos M1-M4 del plan de MVP están completados.

## **3.1 Módulos completados**

| **Módulo** | **Qué incluye** | **Estado** |
| --- | --- | --- |
| M1 — Autenticación | Auth real con Supabase (email + contraseña). ⚠ "Confirm email" está DESACTIVADO por velocidad de desarrollo — reactivar antes de usuarios reales (checklist pre-lanzamiento) | ✓ Producción |
| M2 — Gestión de tours (agencia) | Crear/editar/borrar/pausar tours; galería multi-foto con carrusel; carga de imágenes propias vía Supabase Storage con signed URLs | ✓ Producción |
| M3 — Reservas y dashboard | Pestaña de reservas conectada a datos reales; dashboard de agencia 100% honesto (sin datos inventados); notificaciones in-app derivadas de reservas reales (popover, sin modelo en DB) | ✓ Producción |
| M4 — Coordinación WhatsApp | Flujo de coordinación con teléfono real de la agencia normalizado a formato internacional; mock de pago falso eliminado | ✓ Producción |
| Flujo de pago (demo) | Simulación de pago SOLO en demo (wizard de 4 pasos con Yape/Plin/Tarjeta; la política de cancelación es visible en este modo), aislada tras la bandera DEMO_PAYMENT_FLOW. **Debe ponerse en false antes de onboarding real** | ✓ (demo) |

## **3.2 Decisiones de UI del piloto (intencionales, no bugs)**

| **Elemento** | **Estado** | **Razón** | **Cuándo se restaura** |
| --- | --- | --- | --- |
| Pestaña "Ingresos" (dashboard agencia) | Oculta | Sin pasarela no hay dinero real que mostrar | Con pasarela en producción |
| Política de cancelación (4 niveles) | Existe en schema; UI atada a DEMO_PAYMENT_FLOW: visible en modo demo (paso de pago, voucher, detalle y selector en creación/edición), oculta en modo piloto | Sin pago real no hay reembolso real; coordinación por WhatsApp | End-to-end real con pasarela en producción |
| Comisión en UI | Oculta durante el piloto | Se comunica en onboarding, no en la UI del flujo | Con transacciones reales |
| Ratings | Seed muestra ratings; tours de agencias reales muestran 0/0 | Integridad: sin reseñas reales no hay rating | Revisión de coherencia pendiente en "Mis Tours" |
| Stat "Neto mes" (dashboard) | Desconectada | Sin ingresos reales | Con pasarela en producción |

## **3.3 Verificación de agencias (proceso vigente)**

Manual en el piloto: Finde valida el RUC contra SUNAT (activo/habido) y la inscripción en el registro MINCETUR antes de activar `verified=true` (Supabase Table Editor). El copy del producto ("Validaremos contra SUNAT") es honesto respecto a este proceso. **Roadmap:** agentes de IA que automatizan la validación (RUC por API; MINCETUR con procesamiento del directorio) y la hacen **continua** en el tiempo, no solo al alta.

## **3.4 Backend en producción**

Serverless functions TypeScript en Vercel; PostgreSQL en Supabase (región São Paulo) con pgvector; Prisma 6 como ORM.

### **Capacidades servidas por el backend (julio 2026)**

| **Capacidad** | **Estado** |
| --- | --- |
| Salud del servicio, listado y detalle de tours desde DB | ✓ Live |
| Búsqueda semántica: Voyage embed → pgvector top-k → razonamiento Claude con explicación en peruano | ✓ Live |
| Cache FeaturedSearch para queries frecuentes (latencia de ~10s → ~1.3s) | ✓ Live |
| Creación de reservas con código único (FND-XXXXXX) | ✓ Live |
| Registro y autenticación de usuarios/agencias (Supabase) | ✓ Live |
| CRUD completo de tours de la agencia (con imágenes en Storage) | ✓ Live |
| Reservas de la agencia con datos reales | ✓ Live |
| Generación de descripciones con IA · traducción quechua persistida (backfill por lote; endpoint on-demand disponible) | ✓ Live |

*Los contratos exactos de endpoints viven en el repo (github.com/Mrcanci/finde, branch main) y en CLAUDE.md; este PRD documenta capacidades, no firmas.*

### **Modelo de datos (Prisma + pgvector)**

| **Modelo** | **Campos clave** | **Notas** |
| --- | --- | --- |
| Operator (= agencia) | id, name, ruc, city, email, phone, verified, rating | `verified` activa el sello; nombre del modelo es deuda de nomenclatura (ver Terminología) |
| Tour | id, operatorId, title, desc, shortPitch, meetingPoint, startTime, category, city, region, priceSoles, durationHours, capacity, languages, included[], excluded[], imágenes (galería multi-foto), cancellation (enum 4 niveles, default Moderada), campos quechua ×6 (titleQu, descQu, includedQu, excludedQu, meetingPointQu, shortPitchQu), embedding vector(1024) | priceSoles en céntimos. UI de cancelación atada a DEMO_PAYMENT_FLOW. Traducción quechua persistida (Cusco-Collao) |
| Booking | id, tourId, userName, userEmail, userPhone, guests, scheduledAt, totalSoles, bookingCode, status | bookingCode único legible |
| SearchLog | id, query, returnedTourIds, reasoning, createdAt | Log de queries para análisis |
| FeaturedSearch | id, normalizedQuery, tourIds, reasoning, filtersDetected, hitCount | Cache de queries frecuentes |

### **Stack y servicios en producción**

| **Capa** | **Servicio** | **Estado / Notas** |
| --- | --- | --- |
| Hosting frontend + functions | Vercel (plan Hobby) | Límite de 12 funciones — resuelto con consolidación de rutas dinámicas |
| Base de datos | Supabase PostgreSQL + pgvector (São Paulo) | DATABASE_URL puerto 6543 con pgbouncer; DIRECT_URL puerto 5432 sin params |
| ORM | Prisma 6 | Cambios de schema SOLO con `prisma db push` (nunca `migrate dev` — evita drift con Supabase) |
| Frontend | Vite + React 19 | SPA; migración a SSR evaluada post-piloto |
| Auth | Supabase Auth | Confirm email OFF (checklist pre-lanzamiento) |
| Storage de imágenes | Supabase Storage (signed URLs) | Uploads de agencias en producción |
| LLM | Claude Sonnet (razonamiento de búsqueda, descripciones, quechua) | Producción |
| Embeddings | Voyage voyage-3 (1024 dim) | Producción |
| Correo corporativo | Google Workspace (hola@finde.pe) | DNS con SPF/DKIM/DMARC, 10/10 en mail-tester |
| Captura de leads | Google Apps Script + Sheet | Producción |
| Rate limiting | Implementación propia | Producción |

**Convenciones de desarrollo:** imports en `/api/` con extensión `.js` (Node ESM). Variables de entorno vía Vercel Dashboard (no CLI). Flujo git: branch antes de implementar, validación en navegador antes de commit, merges `--no-ff`, commits atómicos.

## **3.5 Datos en producción**

40 tours con embeddings reales (1024-dim) y traducción quechua completa (40/40): el seed original de 30 (Cusco 10, Lima 6, Arequipa-Colca 5, Costa Norte 4, Selva 3, místico 2) más los tours creados por agencias desde el propio producto. 13 agencias registradas, 9 verificadas — incluida la agencia demo María Quispe (demo@finde.pe) para presentaciones, con su data de prueba ya depurada (reservas de prueba eliminadas; catálogo demo en 3 tours).

# **4. Pendientes**

## **4.1 Checklist pre-lanzamiento (bloquean onboarding real)**

| **Pendiente** | **Descripción** |
| --- | --- |
| DEMO_PAYMENT_FLOW = false | Apagar el flujo de pago simulado antes de agencias reales |
| Gatear textos de custodia del voucher | La nota "Tu pago está protegido por Finde", el CTA "¿Tienes consultas? Escríbele a la agencia" y el mensaje de WhatsApp sin mención de pago se introdujeron para el demo SIN bandera: al apagar DEMO_PAYMENT_FLOW deben gatearse o revertirse (en modo piloto el pago se coordina por WhatsApp y el CTA de coordinación vuelve a ser primario) |
| Reactivar "Confirm email" (Supabase) | El off actual es atajo de desarrollo, no decisión de producción |
| `git push` | Commits locales pendientes de subir a origin |
| Bug "1 días" | Plural incorrecto en la duración del voucher |
| Coherencia de ratings | Tarjetas "Mis Tours": ratings de seed vs. 0/0 de agencias reales |

## **4.2 P0 — MVP transaccional**

| **Pendiente** | **Descripción** | **Estimado** |
| --- | --- | --- |
| Pasarela de pagos con custodia | Selección de pasarela (Culqi candidata; evaluar Izipay/Niubiz y verificar costos/soporte vigentes con proveedores). Cobro total al viajero, retención y liberación post-tour. Incluye webhook de confirmación | 2-3 semanas |
| Restaurar UI condicionada al pago | Pestaña Ingresos, política de cancelación end-to-end, stat "Neto mes" | 1 semana (con pasarela) |
| Comprobantes electrónicos SUNAT | Integración OSE (Nubefact u otro emisor) — factura solo por la comisión (comisión mercantil) | 1-2 semanas |

## **4.3 P1 — Sub-proyectos que tocan schema (planificados)**

| **Pendiente** | **Descripción** |
| --- | --- |
| Múltiples horarios por tour | Hoy un solo `startTime`; un tour con horarios seleccionables (no tours duplicados por horario) |

## **4.4 P1 — Crecimiento**

| **Pendiente** | **Descripción** |
| --- | --- |
| Aviso a la agencia por email | Email transaccional al recibir una reserva (Resend): hoy el aviso es solo in-app y el WhatsApp lo inicia el viajero, por lo que una reserva puede pasar desapercibida. Cierra el loop del handoff; recomendado antes o durante el onboarding real. Dependencias: cuenta Resend, API key en los entornos, verificación del dominio finde.pe |
| Agente de IA en WhatsApp | Soporte 24/7 conectado a WhatsApp Business API + traducción a quechua (distinto de la coordinación manual wa.me actual) |
| Conversación multi-turn con la IA | De búsqueda one-shot a planificación conversacional |
| Recomendaciones por comportamiento | Tours recomendados según búsquedas y actividad del usuario |
| Verificación automatizada con agentes de IA | RUC (API SUNAT) + registro MINCETUR, con verificación continua — reemplaza el toggle manual |
| i18n / búsqueda multi-idioma | Inglés para turistas internacionales (detección de idioma + traducción; hoy EN cae a español). El quechua ES/QU ya está en producción, persistido; falta el idioma completo de UI y el soporte EN. Diferido hasta migración a fuente única de datos |
| Información de accesibilidad | En los listados de tours |
| Persistencia de favoritos y reseñas | Hoy estado local en React |

## **4.5 P2 — Exploración futura (no comprometida)**

- SaaS premium para agencias · módulo B2G municipal (retirados del modelo de revenue de Años 1-3; solo se evalúan con evidencia)
- App React Native (Expo) · SEO/SSR · modo offline · referidos · dynamic pricing · voice search · MCP server

# **5. Especificación funcional**

## **5.1 Módulo viajero**

| **Feature** | **P** | **Estado** | **Notas** |
| --- | --- | --- | --- |
| Búsqueda semántica IA | P0 | ✓ Producción | Voyage + pgvector + Claude, con cache |
| Listado y detalle de tours | P0 | ✓ Producción | Desde DB real |
| Toggle quechua | P0 | ✓ Producción | Persistido (6 campos, 40/40 tours, Cusco-Collao); sin IA en runtime; EN cae a español (P1) |
| Reserva | P0 | ✓ Producción | Crea booking real; coordinación por WhatsApp; pago = demo tras bandera |
| Autenticación | P0 | ✓ Producción | Supabase (confirm email pendiente de reactivar) |
| Pago con custodia (Yape/Plin/tarjeta) | P0 | Pendiente | Pasarela por seleccionar |
| Voucher | P0 | ✓ Producción | Bug "1 días" pendiente; QR/WhatsApp automático pendiente |
| Reviews verificadas | P1 | Parcial | UI lista, persistencia local |
| Favoritos | P1 | Pendiente | UI lista, falta backend |

## **5.2 Módulo agencia**

| **Feature** | **P** | **Estado** | **Notas** |
| --- | --- | --- | --- |
| Registro + verificación | P0 | ✓ Producción | Verificación manual (SUNAT/MINCETUR) con sello |
| Crear/editar/borrar/pausar tour | P0 | ✓ Producción | Con imágenes propias (Supabase Storage) |
| AI Content Creator | P0 | ✓ Producción | Claude genera descripciones |
| Lista de reservas | P0 | ✓ Producción | Datos reales |
| Dashboard | P0 | ✓ Producción | Honesto; Ingresos y "Neto mes" ocultos hasta pasarela |
| Coordinación WhatsApp | P0 | ✓ Producción | Teléfono real normalizado |
| Galería multi-foto | P0 | ✓ Producción | Carrusel con imágenes propias (Supabase Storage) |
| Múltiples horarios | P1 | Pendiente | Toca schema |
| Calendario de disponibilidad | P1 | Pendiente | — |

# **6. Seguridad, compliance y riesgos**

## **6.1 Seguridad**

- Auth: Supabase Auth (email + contraseña). Confirm email debe reactivarse antes de usuarios reales.

- Cifrado: AES-256 en reposo (Supabase managed), TLS 1.3 en tránsito (Vercel).

- PCI DSS: se delegará al gateway. Finde no almacenará datos de tarjeta.

- Rate limiting propio por IP, activo.

- Variables sensibles solo en Vercel Dashboard, nunca en repo.

- Storage: signed URLs para imágenes de agencias.

## **6.2 Compliance peruano (ver Reglas de Negocio v1.3, sección 9, para el detalle)**

- Marca FINDE registrada en INDECOPI (Clase 39, Cert. S00141782, vigente a 2032); cesión onerosa en trámite.

- Régimen: persona natural con negocio (RMT); migración a SACS con tracción. Comisión mercantil: solo la comisión es ingreso gravable.

- Ley 29733 (datos personales): registro ANPD pendiente; política de privacidad en landing.

- INDECOPI: Libro de Reclamaciones virtual — pendiente, requerido antes de transacciones reales.

- MINCETUR: registro de Finde pendiente según corresponda; agencias verificadas contra DNPSTC.

- UIF: régimen acotado aplicable.

## **6.3 Riesgos técnicos**

| **Riesgo** | **Probabilidad** | **Impacto** | **Mitigación** |
| --- | --- | --- | --- |
| Costos de Claude/Voyage suben con tráfico | Media | Medio | Cache FeaturedSearch activo (10s → 1.3s); cache adicional evaluable |
| Pasarela no soporta custodia/liberación diferida como se necesita | Media | Alto | Verificar con Culqi/Izipay/Niubiz antes de comprometer; liberación vía payout quincenal propio |
| Caída de gateway en feriado | Media | Alto | Fallback entre métodos + cola de reintentos |
| Fraude con reservas falsas | Media | Medio | Auth verificada + límites por usuario |
| Agencia no cumple el tour | Baja | Alto | Custodia + disputas + Finde Guarantee |
| Conectividad en destinos rurales | Alta | Medio | SMS/WhatsApp fallback; modo offline en P2 |
| Scraping por competidores | Media | Bajo | Rate limiting activo |
| Deuda de nomenclatura (Operator vs. agencia) | Alta | Bajo | Regla: nunca en copy visible; refactor evaluado post-piloto |

# **7. Roadmap**

| **Fase** | **Hito** | **Entregables** | **Estado** |
| --- | --- | --- | --- |
| Demo | Mayo 2026 | Landing + demo navegable + backend con búsqueda IA | ✓ Hecho |
| MVP funcional (M1-M4) | Junio-julio 2026 | Auth real, CRUD de tours con galería multi-foto, reservas reales, coordinación WhatsApp, dashboard honesto, quechua persistido (40/40), notificaciones derivadas | ✓ Hecho |
| e-Turismo TEC 2026 | Julio 2026 | Módulos 1-8 del programa + Pitch Bootcamp y Demo Day (Cajamarca). Reconocimiento: S/12,000 + beca de incubación (top 3) | En curso |
| Pre-lanzamiento | Post-Demo Day | Checklist 4.1 completo + Libro de Reclamaciones + selección de pasarela | Siguiente |
| Piloto transaccional | 6 meses, Lima | Pasarela con custodia + comprobantes + ~50 agencias activas + superar equilibrio (34 reservas/mes). Presupuesto S/11,790 con EDT y ruta crítica definidas | Planificado |
| Growth | 2027 | Agente WhatsApp 24/7 + quechua, recomendaciones, horarios múltiples/disponibilidad, i18n (EN), verificación automatizada continua | Planificado |
| Funding | Q4 2026 - Q1 2027 | Startup Perú EIN 14G (esperado Q4 2026) · Platanus/500 Global con tracción real (Q1 2027) · Google for Startups Cloud (reaplicar con MVP público) | Pipeline |

# **8. Costos de infraestructura**

| **Concepto** | **Piloto actual (S//mes)** | **Notas** |
| --- | --- | --- |
| Vercel (Hobby) | 0 | Límite 12 funciones gestionado |
| Supabase | 0 (free tier) | Upgrade evaluable con volumen |
| Voyage AI embeddings | ~S/20 | Bajo consumo con cache |
| Claude (búsqueda + contenido + quechua) | ~S/300-400 | Incluye Claude Code (herramienta de desarrollo, aporte propio) |
| Google Workspace (hola@finde.pe) | ~S/25 | Correo corporativo |
| Dominio + varios | ~S/15 | — |
| Contabilidad | ~S/150 | Régimen RMT |
| **Total fijo aproximado** | **~S/650/mes** | Base del punto de equilibrio del piloto (34 reservas/mes) |

Proyección de fijos del modelo financiero: Año 1 S/26,000 (infra + 1 persona a S/1,500) · Año 2 S/65,000 (3 personas) · Año 3 S/122,000 (6 personas). Con pasarela en producción se suma el costo variable (~S/4/reserva) ya contemplado en el margen de S/19.

*PRD Técnico v5 · finde · Julio 2026 · Documento confidencial*

*Reemplaza: PRD v4 (mayo 2026). Documento hermano: Reglas de Negocio v1.3 (julio 2026).*

Página · finde · Julio 2026
