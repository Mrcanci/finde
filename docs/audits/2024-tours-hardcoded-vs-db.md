# Auditoría: tours hardcoded vs DB

Fecha: 2026-05-16
Rama: feature/tours-db-i18n

## Resumen

- Total tours hardcoded en `src/AppDemo.jsx` (`const TOURS`): **14**
- Total tours en DB (tabla `Tour`): **30**
- Duplicados exactos: **4**
- Probablemente duplicados (revisar): **1**
- Únicos en hardcoded: **9**

## Tabla de comparación

| ID hardcoded | Título hardcoded | Location | Match en DB | Tipo de match | Notas |
|---|---|---|---|---|---|
| 1 | Trekking al Nevado Pastoruri | Huaraz, Áncash | — | único | DB no tiene ningún tour en Huaraz/Áncash ni de glaciar. Categoría `trekking` no existe en enum Prisma (se mapea a `adventure`). |
| 2 | Tour Gastronómico por Lima | Miraflores, Lima | `cmoh8rcy4000vvpn25tzlc0ss` — Tour gastronómico Miraflores y Barranco | exacto | Misma ciudad, misma categoría (`gastronomy`), mismo concepto (food tour por Miraflores/Barranco con ceviche, anticucho, pisco). Versión DB tiene más detalle (5 paradas, 8 degustaciones). |
| 3 | Islas Ballestas + Paracas | Paracas, Ica | — | único | DB no tiene ningún tour en Ica/Paracas. |
| 4 | Valle Sagrado en un Día | Cusco | `cmoh8rc5n000bvpn2rvde2bax` — Valle Sagrado: Pisac, Ollantaytambo y Chinchero | exacto | Mismo recorrido (Pisac + Ollantaytambo + Chinchero), Cusco, `cultural`. Versión DB lo etiqueta como `fácil` (12h) vs hardcoded `Fácil` (10h). |
| 5 | Sandboarding en Huacachina | Ica | — | único | DB no tiene ningún tour en Ica/Huacachina. |
| 6 | Avistamiento de Ballenas | Los Órganos, Piura | — | único | DB tiene una operación en Piura (Norte Salvaje, Máncora) pero solo surf — no avistamiento de ballenas. |
| 7 | Choquequirao: El Otro Machu Picchu | Apurímac | `cmoh8rceb000hvpn29qhzz4ug` — Trek a Choquequirao 4 días | exacto | Mismo destino, ambos 4 días. Diferencias: DB lo lista como ciudad `Cusco` (no Apurímac) y categoría `adventure` (no `trekking`), dificultad `extremo` vs `Alta`. |
| 8 | Cañón del Colca 2D/1N | Arequipa | `cmoh8rdca0015vpn2gk23k37h` — Cañón del Colca 2 días con vuelo del cóndor | exacto | Mismo tour 2 días Arequipa-Colca con cóndor y aguas termales. DB lo clasifica `nature` `moderado`; hardcoded `trekking` `Alta`. |
| 9 | Sandboarding & Buggy en Paracas | Paracas, Ica | — | único | DB no tiene Paracas/Ica. |
| 10 | Trekking al Nevado Rajuntay | Marcapomacocha, Lima | — | único | DB no tiene trekking de alta montaña en Lima/Marcapomacocha. (Lo más cercano es surf en Costa Verde, no comparable.) |
| 11 | Playa La Mina & Reserva de Paracas | Paracas, Ica | — | único | DB no tiene Paracas. Además, categoría `beach` del hardcoded no existe en enum Prisma. |
| 12 | Castillo de Chancay & Puerto | Chancay, Lima | — | único | DB no tiene Chancay. Hay tours culturales en Lima pero ninguno cubre este destino. |
| 13 | Lima de Noche: Circuito Mágico del Agua | Lima, Lima | `cmoh8rcvc000tvpn23butdi5i` — Lima Colonial: Centro Histórico patrimonio UNESCO | probable | Misma ciudad, misma categoría (`cultural`), ambos cubren el Centro Histórico de Lima. Diferencia clave: el hardcoded es **nocturno** e incluye Circuito Mágico del Agua; el de DB es **diurno**. Revisar si conviene fusionarlos en un solo tour o mantenerlos separados. |
| 14 | Lunahuaná: Canotaje + Canopy + Vino | Lunahuaná, Lima | — | único | DB no tiene Lunahuaná. Combo rafting + canopy + vino no existe en seed. |

## Tours en DB que NO tienen contraparte hardcoded

(lista informativa, no requiere acción)

| DB id | Título | Location | Category |
|---|---|---|---|
| cmoh8rbzp0009vpn26ju9npzp | Machu Picchu Full Day desde Cusco | Cusco, Cusco | cultural |
| cmoh8rc8h000dvpn22yhhhrii | Vinicunca Montaña de 7 Colores | Cusco, Cusco | adventure |
| cmoh8rcbj000fvpn2n0qvixep | Laguna Humantay full day | Cusco, Cusco | adventure |
| cmoh8rcha000jvpn2fo8kzet0 | Sacsayhuamán y Cusco Imperial | Cusco, Cusco | cultural |
| cmoh8rck3000lvpn2rgjfh2lx | Maras, Moray y Salineras | Cusco, Cusco | cultural |
| cmoh8rcmv000nvpn2m5y938j1 | Pisac: ruinas y mercado tradicional | Pisac, Cusco | cultural |
| cmoh8rcpm000pvpn2koidz469 | Ollantaytambo: fortaleza inca habitada | Ollantaytambo, Cusco | cultural |
| cmoh8rcsg000rvpn2bhwxmomr | Tambomachay: baño ritual del Inca | Cusco, Cusco | mystic |
| cmoh8rd0x000xvpn2orc0q2wm | Caral: civilización más antigua de América | Lima, Lima | cultural |
| cmoh8rd3t000zvpn2vn252gw0 | Pachacamac: santuario costeño pre-inca | Lima, Lima | cultural |
| cmoh8rd6l0011vpn2gh5sebuu | Lomas de Lúcumo: bosque de neblina costero | Lima, Lima | nature |
| cmoh8rd9g0013vpn2o4d7a6zg | Clase de surf en Costa Verde | Lima, Lima | adventure |
| cmoh8rdf30017vpn2syj9r18z | Ruta del Sillar: la cantera blanca de Arequipa | Arequipa, Arequipa | cultural |
| cmoh8rdhw0019vpn2wq5xn8tk | Ascenso al volcán Misti 2 días | Arequipa, Arequipa | adventure |
| cmoh8rdkp001bvpn26emecam2 | Mirador de Yanahuara y centro de Arequipa | Arequipa, Arequipa | cultural |
| cmoh8rdng001dvpn2h9xobfux | Reserva Salinas y Aguada Blanca | Arequipa, Arequipa | nature |
| cmoh8rdq9001fvpn2xsyrxyld | Clase de surf en Máncora | Máncora, Piura | adventure |
| cmoh8rdt1001hvpn2a6g2ai1a | Chan Chan: ciudadela de barro más grande de América | Trujillo, La Libertad | cultural |
| cmoh8rdvu001jvpn2mor2wbyw | Huanchaco: caballitos de totora y cebiche del muelle | Trujillo, La Libertad | cultural |
| cmoh8rdyo001lvpn28ylkpior | Kuélap: fortaleza de los chachapoyas 2 días | Chachapoyas, Amazonas | cultural |
| cmoh8re1o001nvpn2yispucfu | Iquitos Amazonas 3 días en lodge selvático | Iquitos, Loreto | nature |
| cmoh8re4h001pvpn23qzu04f2 | Tambopata 3 días: collpa de guacamayos | Puerto Maldonado, Madre de Dios | nature |
| cmoh8re7d001rvpn2eyvaz3bk | Manu: parque nacional virgen 4 días | Cusco, Madre de Dios | nature |
| cmoh8rea5001tvpn2uchbmxj4 | Comunidad Q'eros: vivencial 2 días | Cusco, Cusco | mystic |
| cmoh8red8001vvpn2o9w6e0ph | Ceremonia de ayahuasca regulada en Tarapoto | Tarapoto, San Martín | mystic |

## Recomendación

- **#1 Trekking al Nevado Pastoruri** — Migrar al seed de Prisma (`prisma/seed.ts`) para mantener el contenido. Mapear categoría `trekking` → `adventure`. Áncash es una región turística importante que falta cubrir.
- **#2 Tour Gastronómico por Lima** — Eliminar del array `TOURS`. La versión de DB (`cmoh8rcy4`) es la oficial y más detallada.
- **#3 Islas Ballestas + Paracas** — Migrar al seed. Paracas es un destino clave del circuito sur (Lima-Paracas-Nazca) y actualmente la DB no cubre Ica.
- **#4 Valle Sagrado en un Día** — Eliminar del array `TOURS`. La versión de DB (`cmoh8rc5n`) es la oficial.
- **#5 Sandboarding en Huacachina** — Migrar al seed. Cubre Ica, destino faltante en DB.
- **#6 Avistamiento de Ballenas** — Migrar al seed. Operación estacional (ago-oct) en Piura no cubierta por DB.
- **#7 Choquequirao** — Eliminar del array `TOURS`. La versión de DB (`cmoh8rceb`) es la oficial; revisar si conviene ajustar `city` de Cusco → Apurímac y/o `category` adventure → mantener.
- **#8 Cañón del Colca 2D/1N** — Eliminar del array `TOURS`. La versión de DB (`cmoh8rdca`) es la oficial.
- **#9 Sandboarding & Buggy en Paracas** — Revisar con el usuario si es redundante con #5 una vez migrados ambos; podría consolidarse en un solo tour de Ica.
- **#10 Trekking al Nevado Rajuntay** — Migrar al seed. Es el único tour de alta montaña accesible desde Lima en un día, único valor diferencial.
- **#11 Playa La Mina & Reserva de Paracas** — Migrar al seed. Nota: categoría `beach` no existe en enum Prisma — mapear a `nature` o ampliar el enum.
- **#12 Castillo de Chancay & Puerto** — Migrar al seed. Chancay es estratégico por el nuevo Megapuerto y no está en DB.
- **#13 Lima de Noche: Circuito Mágico del Agua** — Revisar con el usuario qué versión prevalece antes de migrar. Sugerencia: mantener ambos como tours distintos (diurno vs nocturno) ya que cubren experiencias diferentes del centro de Lima.
- **#14 Lunahuaná: Canotaje + Canopy + Vino** — Migrar al seed. Combo único cerca de Lima sin contraparte en DB.

## Diferencias de schema detectadas

Campos presentes en `TOURS` hardcoded pero **NO** en el schema actual (`prisma/schema.prisma`):

- `titleQu` (string) — traducción al quechua del título. Schema **no** tiene. Relevante para Fase 2 (i18n).
- `descQu` (string) — traducción al quechua de la descripción. Schema **no** tiene. Relevante para Fase 2 (i18n).
- `aiSummary` (string) — resumen IA de reseñas. Schema tiene `shortPitch` pero la semántica es distinta (pitch comercial vs resumen de reviews).
- `altTour` (objeto `{ name, alt, reason }`) — sugerencia anti-overtourism. Schema **no** tiene. Importante para el pitch de innovación del proyecto.
- `tags` (string[]) — tags libres para búsqueda. Schema **no** tiene.
- `badge` (string) — etiqueta visual ("Más vendido", "Anti-overtourism", "Cancelación gratis", etc.). Schema **no** tiene.
- `altitude` (string) — msnm como string. Schema **no** tiene; podría inferirse de `city` o agregarse como `Int?`.
- `cancellation` (string id de política) — `flexible | moderada | estricta | no_reembolsable`. Schema **no** tiene.
- `meetingPoint` (string) — punto de encuentro detallado. Schema **no** tiene (algunas descripciones de DB lo embeben en `description`, no es estructurado).
- `days` (string[7] códigos de día) — patrón de disponibilidad semanal. Schema **no** tiene.
- `excludedDates`, `addedDates` (string[] ISO) — excepciones de calendario. Schema **no** tiene.
- `verified` (en el hardcoded está plano en el tour) — en el schema vive en `Operator.verified`, accesible vía relación.

Campos presentes en el schema pero **NO** en `TOURS` hardcoded:

- `shortPitch` (string?) — pitch corto comercial (más cercano a un subtítulo SEO que al `aiSummary`).
- `language` (string[], default `["es"]`) — idiomas soportados. En el hardcoded se infiere por presencia de `titleQu`/`descQu`.
- `embedding` (`vector(1024)`) — vector semántico para `pgvector` (búsqueda IA).
- `region` (string) — separado de `city`. En el hardcoded está embebido en `location` (formato `"Ciudad, Región"`).
- `reviewsCount` (int) — el hardcoded usa `reviews` con el mismo significado.
- `priceSoles` (int céntimos, ej. 47500 = S/475) — el hardcoded usa `price` en soles enteros (ej. 189). Conversión requerida en cualquier migración: `priceSoles = price * 100`.
- `durationHours` (int) — el hardcoded usa `duration` como string (`"Full day"`, `"4 horas"`, `"4 días"`). Mapeo requerido.

Diferencias de enum/vocabulario:

- Categorías hardcoded (UI): `adventure | culture | gastro | nature | beach | trekking`.
- Categorías DB (Prisma `Category`): `adventure | cultural | gastronomy | nature | mystic`.
- Equivalencias ya implementadas en `AppDemo.jsx` (líneas ~228-229): `CAT_API_TO_UI = { cultural: "culture", gastronomy: "gastro" }`.
- **No tienen contraparte directa**: `trekking` (UI, sin equivalente en enum DB) y `beach` (UI, sin equivalente en enum DB). El frontend los muestra como categorías UI pero ningún tour de DB puede tener esas categorías.
- En DB existe `mystic` pero **no** está en las categorías UI de `CATS` — los tours místicos (Q'eros, ayahuasca, Tambomachay) no son seleccionables desde el filtro de categorías del demo.
- Dificultad: hardcoded usa `"Fácil" | "Moderada" | "Alta"`; DB usa `"fácil" | "moderado" | "difícil" | "extremo"`. Casing y vocabulario distintos.

Estas diferencias son **relevantes para Fase 2** (i18n + cobertura de categorías + extensión de modelo para anti-overtourism y disponibilidad).
