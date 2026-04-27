// prisma/seed.ts
// Finde — Seed inicial: 8 operadores + 30 tours peruanos
// Ejecutar con: npm run db:seed

import { PrismaClient, Category } from "@prisma/client";

const prisma = new PrismaClient();

type OperatorSeed = {
  name: string;
  email: string;
  phone: string;
  city: string;
  verified: boolean;
};

type TourSeed = {
  operatorName: string;
  title: string;
  description: string;
  shortPitch: string;
  category: Category;
  difficulty?: string;
  city: string;
  region: string;
  durationHours: number;
  priceSoles: number; // en céntimos (8500 = S/85.00)
  capacity: number;
  language: string[];
  included: string[];
  excluded: string[];
  imageUrl: string;
  rating: number;
  reviewsCount: number;
};

const OPERATORS: OperatorSeed[] = [
  {
    name: "Andes Auténticos",
    email: "hola@andesautenticos.pe",
    phone: "+51 984 112 233",
    city: "Cusco",
    verified: true,
  },
  {
    name: "Inka Trail Co",
    email: "reservas@inkatrailco.pe",
    phone: "+51 984 556 778",
    city: "Cusco",
    verified: true,
  },
  {
    name: "Lima Cultural Tours",
    email: "info@limacultural.pe",
    phone: "+51 998 221 990",
    city: "Lima",
    verified: true,
  },
  {
    name: "Colca Adventures",
    email: "ventas@colcaadventures.pe",
    phone: "+51 959 442 110",
    city: "Arequipa",
    verified: true,
  },
  {
    name: "Norte Salvaje",
    email: "contacto@nortesalvaje.pe",
    phone: "+51 944 778 220",
    city: "Trujillo",
    verified: true,
  },
  {
    name: "Amazonía Viva",
    email: "tours@amazoniaviva.pe",
    phone: "+51 965 113 887",
    city: "Iquitos",
    verified: true,
  },
  {
    name: "Pachamama Sagrada",
    email: "ceremonias@pachamamasagrada.pe",
    phone: "+51 984 332 156",
    city: "Pisac",
    verified: true,
  },
  {
    name: "Perú Total Tours",
    email: "booking@perutotaltours.pe",
    phone: "+51 998 661 442",
    city: "Lima",
    verified: true,
  },
];

const TOURS: TourSeed[] = [
  // ============ CUSCO (10) ============
  {
    operatorName: "Inka Trail Co",
    title: "Machu Picchu Full Day desde Cusco",
    description:
      "Salida 5:30 AM desde tu hotel en Cusco hacia la estación de Ollantaytambo (1h 30min en transporte privado). Tren PeruRail Expedition de las 7:45 AM, viaje escénico de 1h 40min siguiendo el río Vilcanota hasta Aguas Calientes (2,040 msnm). Bus oficial Consettur de 25 minutos por la carretera Hiram Bingham hasta la entrada de la ciudadela (2,430 msnm). Recorrido guiado de 2h 30min con guía oficial certificado por Mincetur: Plaza Sagrada, Templo del Sol, Intihuatana, sector agrícola con sus terrazas, Templo del Cóndor. Tiempo libre de 1h dentro del santuario respetando el circuito asignado por el Ministerio de Cultura. Almuerzo en restaurante a la carta de Aguas Calientes (no incluido). Retorno en tren de las 18:20 PM, llegada a Cusco 22:00 PM. Llevar pasaporte original obligatorio (lo piden en entrada), agua, repelente con DEET, gorro, casaca ligera y calzado cerrado. Mochila máximo 25 litros, no se permiten trípodes ni drones. Por regulación SERNANP el ingreso es por turnos: tu boleto te asignará entrada de 7:00 AM o 8:00 AM. Capacidad 10 personas por guía.",
    shortPitch: "Tren PeruRail + ciudadela inca con guía oficial Mincetur",
    category: Category.cultural,
    difficulty: "moderado",
    city: "Cusco",
    region: "Cusco",
    durationHours: 17,
    priceSoles: 47500,
    capacity: 10,
    language: ["es", "en"],
    included: [
      "Transporte privado Cusco-Ollantaytambo y retorno",
      "Tren PeruRail Expedition ida y vuelta",
      "Bus Consettur subida y bajada",
      "Boleto de ingreso Machu Picchu circuito 2",
      "Guía oficial Mincetur español/inglés",
    ],
    excluded: ["Almuerzo en Aguas Calientes", "Subida a Huayna Picchu (S/200 extra)", "Propinas"],
    imageUrl: "https://source.unsplash.com/800x600/?machu-picchu",
    rating: 4.9,
    reviewsCount: 187,
  },
  {
    operatorName: "Andes Auténticos",
    title: "Valle Sagrado: Pisac, Ollantaytambo y Chinchero",
    description:
      "Recorrido de día completo por los tres pueblos clave del Valle Sagrado del Urubamba. Salida 7:30 AM desde Cusco. Primera parada: mercado tradicional de Pisac (2,972 msnm) donde los comuneros bajan a vender productos. Visita al complejo arqueológico inca con sus andenes agrícolas suspendidos. Almuerzo buffet incluido en restaurante de Urubamba (12:30 PM) con platos de cocina andina: rocoto relleno, trucha de río, quinua. A las 14:30 visitamos la fortaleza de Ollantaytambo (2,792 msnm), última ciudad inca habitada continuamente, con sus terrazas ceremoniales y el Templo del Sol con bloques de 50 toneladas traídos desde Cachicata. Cierre del recorrido en Chinchero (3,762 msnm) con demostración de tejido en telar de cintura por mujeres de la comunidad: lavado de lana con saqta, teñido natural con cochinilla y chilca, hilado en pushka. Retorno a Cusco 19:30 PM. Llevar boleto turístico parcial del Valle (S/70) o lo gestionamos por ti. Recomendamos calzado cómodo, sombrero, protector solar 50+ y mínimo 1.5 litros de agua. La altitud es notable: si llegaste a Cusco hace menos de 24h, mastica hojas de coca durante el recorrido.",
    shortPitch: "Mercado de Pisac, fortaleza de Ollantaytambo y textiles de Chinchero",
    category: Category.cultural,
    difficulty: "fácil",
    city: "Cusco",
    region: "Cusco",
    durationHours: 12,
    priceSoles: 22000,
    capacity: 14,
    language: ["es", "en", "qu"],
    included: [
      "Transporte turístico ida y vuelta",
      "Guía bilingüe oficial Mincetur",
      "Almuerzo buffet en Urubamba",
      "Demostración de tejido tradicional en Chinchero",
    ],
    excluded: ["Boleto turístico parcial del Valle (S/70)", "Bebidas durante el almuerzo", "Propinas"],
    imageUrl: "https://source.unsplash.com/800x600/?sacred-valley-peru",
    rating: 4.8,
    reviewsCount: 142,
  },
  {
    operatorName: "Inka Trail Co",
    title: "Vinicunca Montaña de 7 Colores",
    description:
      "Salida 4:00 AM desde Cusco hacia la comunidad de Pampachiri (3h 30min en bus). Desayuno tradicional de quinua y pan de chuta a las 7:00 AM. Inicio del trekking a 4,650 msnm: 6 km de caminata progresiva por el valle de Cusipata, atravesando rebaños de alpacas y vicuñas silvestres, hasta la cumbre de Vinicunca (5,200 msnm). Tiempo aproximado de subida: 2h 30min para personas con aclimatación previa de 48h en Cusco. La montaña debe sus franjas a la oxidación de óxido férrico (rojo), peridotita (verde) y arenisca (amarilla) — un fenómeno geológico que quedó visible solo después del retroceso glaciar del 2013. Vista panorámica de la cordillera Vilcanota y el nevado Ausangate (6,384 msnm). Para quienes no completen la subida hay caballos disponibles desde el km 4 (S/80, pago directo a la comunidad). Almuerzo tipo lunch box vegetariano incluido. Retorno a Cusco 17:30 PM. ATENCIÓN: no apto para personas que llegaron a Cusco hace menos de 48h, embarazadas, ni con hipertensión no controlada. Llevar casaca cortavientos, gorro, guantes, lentes UV, bastones (alquiler S/15), agua y caramelos de glucosa. Temperatura en cima: -2 a 8°C.",
    shortPitch: "Trekking 6km a 5,200 msnm con vista al Ausangate",
    category: Category.adventure,
    difficulty: "difícil",
    city: "Cusco",
    region: "Cusco",
    durationHours: 14,
    priceSoles: 18000,
    capacity: 12,
    language: ["es", "en"],
    included: [
      "Transporte ida y vuelta Cusco-Pampachiri",
      "Desayuno tradicional y lunch box",
      "Guía de montaña certificado",
      "Entrada a la comunidad",
    ],
    excluded: ["Caballo opcional (S/80)", "Alquiler de bastones (S/15)", "Propinas"],
    imageUrl: "https://source.unsplash.com/800x600/?rainbow-mountain-peru",
    rating: 4.6,
    reviewsCount: 198,
  },
  {
    operatorName: "Andes Auténticos",
    title: "Laguna Humantay full day",
    description:
      "Salida 4:30 AM desde Cusco. Viaje en van por la ruta de Mollepata (3h 30min) con desayuno andino en la comunidad de Soraypampa: pan casero, mate de muña y huevos de gallina criolla. Inicio del trekking a 3,900 msnm con ascenso progresivo de 4 km hasta la laguna a 4,200 msnm (1h 30min de caminata moderada). El lago Humantay es alimentado por el deshielo del nevado del mismo nombre (5,917 msnm), parte del macizo del Salkantay. El color turquesa intenso se debe al sedimento glaciar suspendido. Por respeto a la comunidad campesina de Soraypampa que administra el sitio NO está permitido bañarse en la laguna; sí se permite el ritual de la apacheta (apilar piedras como ofrenda a los apus). Almuerzo buffet en Mollepata a las 14:30 con sopa de quinua, lomo saltado y postre. Llegada a Cusco 19:00 PM. Tour ideal como aclimatación previa al Camino Salkantay o Inca. Llevar bastones (alquiler S/10), botas de trekking, ropa por capas, gorro de lana y protector solar (la radiación UV a esa altitud es extrema). Capacidad 14 personas, ratio 1 guía por cada 7 caminantes.",
    shortPitch: "Caminata de 1h al lago turquesa al pie del nevado Salkantay",
    category: Category.adventure,
    difficulty: "moderado",
    city: "Cusco",
    region: "Cusco",
    durationHours: 14,
    priceSoles: 16500,
    capacity: 14,
    language: ["es", "en"],
    included: [
      "Transporte privado ida y vuelta",
      "Desayuno andino en Soraypampa",
      "Almuerzo buffet en Mollepata",
      "Guía bilingüe certificado",
      "Entrada a la comunidad",
    ],
    excluded: ["Alquiler de bastones (S/10)", "Caballo opcional", "Propinas"],
    imageUrl: "https://source.unsplash.com/800x600/?humantay-lake",
    rating: 4.7,
    reviewsCount: 156,
  },
  {
    operatorName: "Inka Trail Co",
    title: "Trek a Choquequirao 4 días",
    description:
      "Expedición de 4 días al complejo arqueológico hermano de Machu Picchu, ubicado en el cañón del Apurímac a 3,033 msnm y solo accesible a pie. Día 1: salida 5:00 AM desde Cusco hacia Cachora (4h en transporte privado). Trekking descendente de 12 km hasta Playa Rosalina (1,500 msnm) — 6h de caminata bajando 1,500 m de desnivel. Acampamos junto al río Apurímac. Día 2: subida brutal de 1,500 m de desnivel positivo en 8 km hasta Marampata (3,000 msnm), 7h con paradas. Tarde libre. Día 3: amanecer en el complejo Choquequirao, recorrido guiado de 4h por los sectores de las llamas (terrazas con figuras de camélidos en piedra blanca), Hanan, Hurin y la plaza ceremonial. Solo el 30% del sitio está descubierto. Tarde de retorno a Playa Rosalina. Día 4: subida final a Cachora y retorno a Cusco. Distancia total: 64 km. Apto para caminantes con experiencia previa en altitud y buen estado físico (acostumbrados a 6h+ de caminata). Incluye carpas, sleeping bags, colchonetas, cocinero, comidas completas, mulas para equipaje (hasta 7kg por persona), guía bilingüe certificado. Grupos pequeños máximo 8 personas. NO incluye seguro de evacuación (recomendado). Mejor temporada: abril a octubre.",
    shortPitch: "Trek exigente al \"otro Machu Picchu\" sin multitudes",
    category: Category.adventure,
    difficulty: "extremo",
    city: "Cusco",
    region: "Cusco",
    durationHours: 96,
    priceSoles: 130000,
    capacity: 8,
    language: ["es", "en"],
    included: [
      "Transporte Cusco-Cachora ida y vuelta",
      "Carpas, sleeping bags y colchonetas",
      "Cocinero y comidas completas (12 comidas)",
      "Mulas para equipaje (7kg por persona)",
      "Guía bilingüe certificado de alta montaña",
      "Entradas al complejo Choquequirao",
    ],
    excluded: ["Seguro de evacuación", "Bolsa de dormir personal -5°C", "Propinas para arrieros y cocinero"],
    imageUrl: "https://source.unsplash.com/800x600/?choquequirao",
    rating: 4.9,
    reviewsCount: 47,
  },
  {
    operatorName: "Andes Auténticos",
    title: "Sacsayhuamán y Cusco Imperial",
    description:
      "Recorrido de medio día por el centro histórico inca-colonial de Cusco y la fortaleza ceremonial de Sacsayhuamán (3,701 msnm). Salida 13:30 PM. Iniciamos en la Catedral del Cusco (1654), construida sobre el palacio del inca Wiracocha, con su célebre lienzo de la Última Cena donde el plato central es cuy. Continuamos al Qoricancha o Templo del Sol, base inca con planchas de oro saqueadas en 1533, hoy convento de Santo Domingo. Subimos a Sacsayhuamán: muros zigzagueantes con bloques de andesita de hasta 125 toneladas ensamblados sin mortero. La técnica de talla con golpe de hematita aún no ha sido replicada. Recorrido por las tres terrazas y el rodadero, formación rocosa pulida usada por los niños incas como tobogán ceremonial. Vista panorámica de Cusco al atardecer. Cierre con visita rápida a Q'enqo, sitio ceremonial subterráneo con altar zoomorfo. Retorno al centro 18:30 PM. Llevar el boleto turístico general del Cusco (BTG, S/130) o lo adquirimos juntos en la primera parada. Por la altitud recomendamos caminar despacio, hidratarse y mascar coca. Tour ideal para el primer día en Cusco como aclimatación moderada.",
    shortPitch: "Catedral, Qoricancha y la fortaleza de los muros ciclópeos",
    category: Category.cultural,
    difficulty: "fácil",
    city: "Cusco",
    region: "Cusco",
    durationHours: 5,
    priceSoles: 8500,
    capacity: 14,
    language: ["es", "en"],
    included: [
      "Transporte turístico de subida",
      "Guía oficial bilingüe",
      "Entradas a Catedral y Qoricancha",
    ],
    excluded: ["Boleto turístico general del Cusco (S/130)", "Propinas"],
    imageUrl: "https://source.unsplash.com/800x600/?sacsayhuaman",
    rating: 4.5,
    reviewsCount: 112,
  },
  {
    operatorName: "Andes Auténticos",
    title: "Maras, Moray y Salineras",
    description:
      "Excursión de medio día por dos sitios arqueológicos únicos del Valle Sagrado. Salida 8:00 AM. Primera parada: Moray (3,500 msnm), conjunto de andenes circulares concéntricos con desnivel de 30 metros entre el anillo superior e inferior. Investigaciones del INC Cusco confirman variación térmica de hasta 15°C entre niveles, lo que sugiere su uso como laboratorio agrícola para aclimatar especies como maíz, quinua y papa a distintos pisos ecológicos antes de distribuirlas al imperio. Continuamos a las Salineras de Maras: 4,500 pozas escalonadas en una ladera, alimentadas por un manantial salino subterráneo que brota a 800 ppm de salinidad. La explotación es comunitaria desde tiempos pre-incas — cada familia maraseña posee un número fijo de pozas heredadas. La sal rosada se cosecha en estación seca (mayo-octubre). Caminata por las pozas con un comunero que explica el ciclo de evaporación de 30 días. Posibilidad de comprar sal directamente al productor (S/8 el kilo). Retorno a Cusco vía pueblo de Maras 14:00 PM. Llevar gafas de sol (el reflejo en las pozas blancas es intenso), gorro y agua. Tour ideal combinado con Pisac al día siguiente. No bajamos a las pozas individualmente para no contaminar la sal.",
    shortPitch: "Laboratorio agrícola circular inca y minas de sal pre-incas",
    category: Category.cultural,
    difficulty: "fácil",
    city: "Cusco",
    region: "Cusco",
    durationHours: 6,
    priceSoles: 12000,
    capacity: 14,
    language: ["es", "en"],
    included: [
      "Transporte turístico ida y vuelta",
      "Guía oficial bilingüe",
      "Entrada a Moray y Salineras",
    ],
    excluded: ["Almuerzo", "Propinas", "Compras en el sitio"],
    imageUrl: "https://source.unsplash.com/800x600/?maras-salt-mines",
    rating: 4.7,
    reviewsCount: 89,
  },
  {
    operatorName: "Pachamama Sagrada",
    title: "Pisac: ruinas y mercado tradicional",
    description:
      "Recorrido de medio día al pueblo y complejo arqueológico de Pisac, puerta de entrada al Valle Sagrado. Salida 8:30 AM hacia Pisac (1h en bus). Iniciamos en lo alto del complejo arqueológico (3,300 msnm) — bajamos a pie por los andenes ceremoniales, las plazas de Q'allaqasa y P'isaqa, y el sector religioso con su Intihuatana tallado en una sola roca. Caminata moderada de 2h con desnivel descendente de 300m. Bajamos al pueblo de Pisac, fundación reduccional del virrey Toledo (1572) sobre asentamiento inca. Mercado tradicional: solo los miércoles, jueves y domingos los comuneros de las alturas (Cuyo Grande, Maska, Chahuaytire) bajan con productos textiles teñidos con cochinilla, chilca y tara. Demostración de tejido en awana (telar de cintura) con una tejedora de Chahuaytire. Almuerzo opcional en Mullu Restaurante (no incluido, ~S/45 menú). Tiempo libre en el mercado para compras. Retorno a Cusco 14:30 PM. Llevar boleto turístico parcial del Valle (incluido en el tour) y dinero en efectivo en soles para el mercado (no aceptan tarjeta). Capacidad 12 personas. Si quieres profundizar en textiles, podemos extender al Centro de Tejidos de Chinchero por S/40 adicionales.",
    shortPitch: "Andenes incas suspendidos y mercado de los comuneros",
    category: Category.cultural,
    difficulty: "moderado",
    city: "Pisac",
    region: "Cusco",
    durationHours: 6,
    priceSoles: 10500,
    capacity: 12,
    language: ["es", "en", "qu"],
    included: [
      "Transporte turístico ida y vuelta",
      "Guía bilingüe quechua-hablante",
      "Boleto turístico parcial del Valle",
      "Demostración de tejido tradicional",
    ],
    excluded: ["Almuerzo en Mullu (~S/45)", "Compras en el mercado", "Extensión a Chinchero (S/40)"],
    imageUrl: "https://source.unsplash.com/800x600/?pisac-peru",
    rating: 4.6,
    reviewsCount: 103,
  },
  {
    operatorName: "Andes Auténticos",
    title: "Ollantaytambo: fortaleza inca habitada",
    description:
      "Recorrido enfocado en Ollantaytambo (2,792 msnm), la única ciudad inca cuya traza original — calles, canchas, sistema de canales — sigue habitada por descendientes directos. Salida 9:00 AM desde Cusco (1h 45min). Iniciamos caminando por las callejuelas empedradas del barrio Q'osqo Ayllu, donde aún funcionan los canales de irrigación incas que abastecen a las viviendas. Subida al complejo arqueológico por los 200 escalones de la Fortaleza: terrazas ceremoniales y el inacabado Templo del Sol con 6 monolitos rosados de 50 toneladas cada uno traídos desde la cantera de Cachicata, a 6 km cruzando el río Urubamba. La rampa de tracción usada para transportarlos aún es visible. Vista al rostro tallado de Wiracocha en la montaña Pinkuylluna al frente. Almuerzo incluido en restaurante de la plaza (12:30 PM) con menú andino. Tarde: visita a los graneros de Pinkuylluna en la ladera opuesta, que aprovechaban los vientos para conservar maíz y quinua. Retorno a Cusco 17:30 PM. Si vas a Machu Picchu al día siguiente, el tren PeruRail sale de la estación Ollantaytambo, así que este tour es excelente preparación. Llevar boleto turístico del Valle. Capacidad 12. Caminata moderada con escalones, no apto para personas con problemas de rodilla severos.",
    shortPitch: "Última ciudad inca habitada continuamente desde el siglo XV",
    category: Category.cultural,
    difficulty: "moderado",
    city: "Ollantaytambo",
    region: "Cusco",
    durationHours: 7,
    priceSoles: 11500,
    capacity: 12,
    language: ["es", "en"],
    included: [
      "Transporte turístico ida y vuelta",
      "Guía oficial bilingüe",
      "Almuerzo andino en plaza",
    ],
    excluded: ["Boleto turístico parcial del Valle (S/70)", "Bebidas", "Propinas"],
    imageUrl: "https://source.unsplash.com/800x600/?ollantaytambo",
    rating: 4.7,
    reviewsCount: 78,
  },
  {
    operatorName: "Pachamama Sagrada",
    title: "Tambomachay: baño ritual del Inca",
    description:
      "Experiencia ceremonial de medio día en el santuario de agua de Tambomachay (3,765 msnm), el lugar donde la nobleza inca realizaba abluciones rituales. Salida 13:00 PM. Subida progresiva por la antigua Capaq Ñan hacia Tambomachay con paradas en Pukapukara (puesto de control inca rojo por la oxidación del hierro en sus piedras). En Tambomachay, el guía y un altomisayoq (sacerdote andino) introducen el significado del agua en la cosmovisión inca: las tres fuentes representan los tres mundos (Hanan, Kay, Uku Pacha). El agua brota de un manantial subterráneo a temperatura constante de 9°C todo el año y aún no se ha podido determinar su origen exacto. Ceremonia opcional de Tinkay: ofrenda de hojas de coca, chicha de jora y kintu (tres hojas perfectas) a la Pachamama, con conducción en quechua y traducción al español. Si decides participar del baño ritual lleva ropa que se pueda mojar. Cierre en mirador de Cusco con explicación del Hatun Rumiyoq. Retorno 17:00 PM. Tour respetuoso conducido en colaboración con la comunidad de Yuncaypata. NO es turismo místico new-age: es práctica ancestral viva. Capacidad 8 personas máximo para mantener el carácter íntimo.",
    shortPitch: "Fuente ceremonial inca y ritual de purificación con agua sagrada",
    category: Category.mystic,
    difficulty: "fácil",
    city: "Cusco",
    region: "Cusco",
    durationHours: 5,
    priceSoles: 9500,
    capacity: 8,
    language: ["es", "en", "qu"],
    included: [
      "Transporte privado",
      "Guía bilingüe quechua-hablante",
      "Altomisayoq de la comunidad de Yuncaypata",
      "Ofrenda ceremonial (coca, chicha, kintu)",
    ],
    excluded: ["Boleto turístico general del Cusco (S/130)", "Toalla y ropa de baño", "Propinas"],
    imageUrl: "https://source.unsplash.com/800x600/?tambomachay-cusco",
    rating: 4.8,
    reviewsCount: 41,
  },

  // ============ LIMA (6) ============
  {
    operatorName: "Lima Cultural Tours",
    title: "Lima Colonial: Centro Histórico patrimonio UNESCO",
    description:
      "Caminata guiada de 4 horas por el casco antiguo de Lima, declarado Patrimonio de la Humanidad por UNESCO en 1991. Punto de encuentro: Plaza Mayor 9:00 AM. Recorrido por el Palacio de Gobierno (cambio de guardia 11:45 AM), la Catedral de Lima fundada en 1535 con la cripta de Francisco Pizarro, y el Palacio del Arzobispo con sus balcones de madera tallada estilo mudéjar — los mejor conservados de Sudamérica. Continuamos por el Jirón de la Unión, eje peatonal de la ciudad colonial, hacia la iglesia y catacumbas de San Francisco (siglo XVII). Bajamos a las catacumbas: cementerio subterráneo donde reposan unos 25,000 limeños, con osarios geométricos visibles. La biblioteca del convento conserva 25,000 volúmenes incluyendo incunables del siglo XV. Cierre en la Casa de Aliaga, casona habitada por la misma familia desde 1535 — la más antigua de América en uso continuo (entrada con cita previa, incluida). Incluye guía oficial Mincetur, entradas a San Francisco y Casa Aliaga. Caminata cómoda 3 km en plano. Llevar identificación (lo piden en Palacio), agua. Para extender, ofrecemos almuerzo en La Catedral del Pisco (no incluido). Recomendado en mañana de día laborable cuando hay menos tráfico vehicular.",
    shortPitch: "Plaza Mayor, catacumbas de San Francisco y balcones coloniales",
    category: Category.cultural,
    difficulty: "fácil",
    city: "Lima",
    region: "Lima",
    durationHours: 4,
    priceSoles: 7500,
    capacity: 16,
    language: ["es", "en"],
    included: [
      "Guía oficial Mincetur bilingüe",
      "Entrada al Convento de San Francisco y catacumbas",
      "Entrada a Casa de Aliaga",
    ],
    excluded: ["Almuerzo", "Transporte hasta el punto de encuentro", "Propinas"],
    imageUrl: "https://source.unsplash.com/800x600/?lima-cathedral",
    rating: 4.7,
    reviewsCount: 164,
  },
  {
    operatorName: "Lima Cultural Tours",
    title: "Tour gastronómico Miraflores y Barranco",
    description:
      "Recorrido culinario de 5 horas por las dos comunas más sabrosas de Lima. Punto de encuentro 17:30 PM en Larcomar. Parada 1: cevichería La Mar — degustación de cebiche clásico de pescado del día, leche de tigre y conchitas a la parmesana. Parada 2: anticuchería tradicional en parque Kennedy — anticuchos de corazón de res marinados 12h en ají panca, vinagre y kión, asados a la brasa de carbón con choclo y papa amarilla. Parada 3: cruzamos a Barranco, barrio bohemio. Bar Ayahuasca en casona republicana de 1900: degustación de pisco quebranta puro, pisco sour clásico (3:1:1 con clara de huevo) y chilcano de pisco con kion. Educación sobre las 8 cepas pisqueras y la diferencia con el aguardiente chileno. Parada 4: Picarones del Tío Mario en Bajada de Baños — picarones de zapallo y camote frescos bañados en miel de chancaca con higo y naranja. Parada 5: heladería artesanal con sabores nativos: lúcuma, chirimoya, sauco y tumbo. Cierre con caminata por el Puente de los Suspiros 22:00 PM. Incluye todas las degustaciones (8 platillos en total) + 4 bebidas. Apto para vegetarianos con menú alternativo (avisar al reservar). NO recomendado para celiacos estrictos.",
    shortPitch: "5 paradas: cebiche, anticucho, pisco sour y postres limeños",
    category: Category.gastronomy,
    difficulty: "fácil",
    city: "Lima",
    region: "Lima",
    durationHours: 5,
    priceSoles: 18500,
    capacity: 10,
    language: ["es", "en"],
    included: [
      "8 degustaciones en 5 paradas",
      "4 bebidas (pisco sour, chilcano, pisco puro, jugo)",
      "Guía gastronómico bilingüe",
      "Caminata Miraflores-Barranco con transporte intermedio",
    ],
    excluded: ["Comidas adicionales fuera del recorrido", "Propinas"],
    imageUrl: "https://source.unsplash.com/800x600/?ceviche-peruvian-food",
    rating: 4.9,
    reviewsCount: 221,
  },
  {
    operatorName: "Lima Cultural Tours",
    title: "Caral: civilización más antigua de América",
    description:
      "Excursión de día completo a la Ciudad Sagrada de Caral, 200 km al norte de Lima en el valle de Supe. Salida 6:00 AM desde Miraflores (4h por la Panamericana Norte). Caral es el sitio urbano más antiguo de América: dataciones de C14 confirman ocupación entre 3000-1800 a.C., contemporánea a las pirámides de Egipto. La Dra. Ruth Shady dirige las excavaciones desde 1996 — su equipo demostró que Caral floreció 1,500 años antes que la civilización Olmeca. Recorrido guiado de 2h 30min por las 6 pirámides principales: Pirámide Mayor con su plaza circular hundida y altar de fuego sagrado, Pirámide de la Galería con las flautas hechas de hueso de cóndor (33 instrumentos hallados), Pirámide del Anfiteatro y los conjuntos residenciales. Caral nunca usó cerámica ni se han encontrado evidencias de guerra: comerciaban con la costa (intercambiaban pescado seco por algodón y achiote) y construían en quincha sismorresistente. Almuerzo campestre en Supe Pueblo incluido (1:30 PM). Retorno a Lima 19:00 PM. Llevar gorro de ala ancha, protector 50+, agua (mínimo 2L), zapatillas cómodas. El sitio NO tiene sombra. Con calor extremo en verano (dic-mar) puede llegar a 35°C. Tour familiar, niños desde 6 años.",
    shortPitch: "Pirámides de 5,000 años en el valle de Supe",
    category: Category.cultural,
    difficulty: "fácil",
    city: "Lima",
    region: "Lima",
    durationHours: 13,
    priceSoles: 22000,
    capacity: 14,
    language: ["es", "en"],
    included: [
      "Transporte privado ida y vuelta",
      "Guía oficial bilingüe especializado",
      "Entrada al sitio arqueológico de Caral",
      "Almuerzo campestre en Supe Pueblo",
      "Agua y snack en bus",
    ],
    excluded: ["Propinas", "Compras en el sitio"],
    imageUrl: "https://source.unsplash.com/800x600/?caral-pyramids",
    rating: 4.7,
    reviewsCount: 67,
  },
  {
    operatorName: "Lima Cultural Tours",
    title: "Pachacamac: santuario costeño pre-inca",
    description:
      "Recorrido de medio día al complejo arqueológico de Pachacamac, 31 km al sur de Lima. Salida 8:30 AM desde Miraflores. El santuario fue ocupado continuamente desde el 200 d.C. (cultura Lima) hasta 1533, pasando por Wari, Ychsma e Inca. Los Incas respetaron y ampliaron el oráculo de Pachacamac (\"el que anima al mundo\"), considerado el más poderoso de la costa: peregrinos venían desde Quito y Cochabamba a consultarlo. Recorrido por el Templo del Sol Inca con sus rampas ceremoniales y vista al Pacífico, el Acllahuasi (casa de las escogidas) con sus paredes pintadas de rojo y amarillo, y la Plaza de los Peregrinos. Visita al museo de sitio que reabrió en 2016 con diseño del arquitecto Enrique Ciriani: alberga el ídolo de Pachacamac (madera tallada con doble rostro, 760 d.C.) y los textiles Wari de policromía excepcional. Almuerzo opcional en Mamacona (no incluido). Retorno a Lima 14:00 PM. Tour ideal para quienes buscan profundidad cultural sin las multitudes de los sitios cusqueños. Incluye guía oficial, transporte, entrada al complejo y museo. Llevar zapatillas cerradas (terreno arenoso), gorro, agua. La brisa marina engaña: usar protector solar igual.",
    shortPitch: "Templo del oráculo más importante de la costa peruana",
    category: Category.cultural,
    difficulty: "fácil",
    city: "Lima",
    region: "Lima",
    durationHours: 5,
    priceSoles: 9500,
    capacity: 14,
    language: ["es", "en"],
    included: [
      "Transporte ida y vuelta desde Miraflores",
      "Guía oficial bilingüe",
      "Entrada al complejo y museo de sitio",
    ],
    excluded: ["Almuerzo", "Propinas"],
    imageUrl: "https://source.unsplash.com/800x600/?pachacamac",
    rating: 4.5,
    reviewsCount: 54,
  },
  {
    operatorName: "Perú Total Tours",
    title: "Lomas de Lúcumo: bosque de neblina costero",
    description:
      "Trekking ligero de 6 horas en el ecosistema de lomas más accesible desde Lima, en Pachacámac. Salida 7:30 AM desde Miraflores. Las lomas son un fenómeno biogeográfico raro: ecosistemas que dependen 100% de la neblina costera (camanchaca) entre junio y octubre. El resto del año son desierto. Lúcumo (3,000 hectáreas) tiene 67 especies de flora endémica registradas por la UNALM, incluyendo la flor de amancaes (símbolo de Lima), el tabaco silvestre, ortiga macho, y poblaciones del lúcumo silvestre que dan nombre al lugar. Caminata circular de 7.5 km con desnivel acumulado de 350m, dificultad media. Avistamiento de aves: turtupilín peruano, perdiz serrana, cernícalo americano y con suerte el águila mora. Si la neblina baja densa (lo más habitual en julio-agosto) la visibilidad cae a 30 metros y el bosque adquiere un carácter onírico — recomendamos llevar linterna. Las lomas son administradas por la Asociación de Pobladores de Quebrada Verde; la entrada (S/15) financia el guardabosques comunal. Almuerzo campestre en mirador (incluido): pachamanca a la olla con pollo, papa, camote y habas. Retorno a Lima 16:00 PM. Llevar casaca impermeable, zapatillas con buen agarre, mochila pequeña. Tour familiar; niños desde 8 años. Solo operamos junio-noviembre.",
    shortPitch: "Ecosistema único que solo florece de junio a octubre",
    category: Category.nature,
    difficulty: "moderado",
    city: "Lima",
    region: "Lima",
    durationHours: 8,
    priceSoles: 11000,
    capacity: 12,
    language: ["es", "en"],
    included: [
      "Transporte ida y vuelta desde Miraflores",
      "Guía naturalista bilingüe",
      "Entrada a las Lomas (administrada por la comunidad)",
      "Almuerzo pachamanca en mirador",
    ],
    excluded: ["Bastones de trekking", "Propinas", "Linterna frontal"],
    imageUrl: "https://source.unsplash.com/800x600/?lomas-lucumo",
    rating: 4.6,
    reviewsCount: 38,
  },
  {
    operatorName: "Perú Total Tours",
    title: "Clase de surf en Costa Verde",
    description:
      "Clase grupal de surf de 3 horas en la playa La Pampilla (Miraflores), una de las mejores olas de iniciación de Lima. Punto de encuentro 8:30 AM en la escuela en Bajada Balta. Briefing de seguridad de 30 minutos: corrientes de retorno, lectura del set, posición en la tabla, paddling y el pop-up. Equipo incluido: tabla soft-top de 8'0 a 9'2 según peso, traje neoprene 3/2mm (la temperatura del Pacífico en Lima oscila entre 14°C en invierno y 22°C en verano), leash y wax. Sesión en agua de 2h con un instructor por cada 4 alumnos. La ola de La Pampilla es una izquierda lenta tipo point break que rompe sobre canto rodado, ideal para tomar las primeras espumas y luego pasar a olas formadas. La temporada técnica fuerte es de marzo a octubre (swells del SO consistentes); el verano (dic-feb) ofrece olas más suaves perfectas para el primer contacto. Cierre con desayuno post-surf en cafetería frente al mar (incluido): pan con palta, café o jugo de fruta. Apto desde 12 años. NO requiere experiencia previa, sí saber nadar 50 metros básico. Cobertura de seguro contra accidentes en agua incluida. Si necesitas casillero y ducha caliente, los tenemos en local.",
    shortPitch: "Iniciación al surf en La Pampilla con tabla y traje incluidos",
    category: Category.adventure,
    difficulty: "fácil",
    city: "Lima",
    region: "Lima",
    durationHours: 3,
    priceSoles: 12500,
    capacity: 8,
    language: ["es", "en"],
    included: [
      "Tabla soft-top según peso",
      "Traje neoprene 3/2mm, leash y wax",
      "Instructor certificado (1 cada 4 alumnos)",
      "Desayuno post-surf",
      "Casillero y ducha caliente",
      "Seguro contra accidentes en agua",
    ],
    excluded: ["Transporte hasta la escuela", "Cámara de fotos en agua (S/40 extra)", "Propinas"],
    imageUrl: "https://source.unsplash.com/800x600/?lima-surf",
    rating: 4.7,
    reviewsCount: 92,
  },

  // ============ AREQUIPA-COLCA (5) ============
  {
    operatorName: "Colca Adventures",
    title: "Cañón del Colca 2 días con vuelo del cóndor",
    description:
      "Tour clásico de 2 días al segundo cañón más profundo del mundo (3,400m de profundidad, el doble del Gran Cañón). Día 1: salida 8:00 AM desde Arequipa. Cruzamos la Reserva Nacional de Salinas y Aguada Blanca con paradas para vicuñas silvestres y la Pampa Cañahuas. Almuerzo buffet en Chivay (3,633 msnm). Tarde: aguas termales de La Calera, 4 piscinas de origen volcánico entre 35°C y 42°C ricas en hierro y calcio. Cena buffet con show folclórico de wititi (danza colla declarada Patrimonio Inmaterial UNESCO). Hospedaje en hotel turístico de Yanque (habitación doble con baño privado y calefacción). Día 2: salida 6:00 AM hacia el mirador de la Cruz del Cóndor (3,287 msnm). Entre 7:30 y 9:00 AM los cóndores andinos (Vultur gryphus) emergen del cañón aprovechando las corrientes térmicas matinales — entre 4 y 12 individuos según la temporada. Visita a los pueblos de Pinchollo, Maca, Coporaque (con sus collcas pre-incas). Almuerzo en Chivay y retorno a Arequipa 17:30 PM. Incluye transporte, hotel, guía, 3 comidas, entrada a aguas termales. NO incluye boleto turístico Colca (S/70 nacional, S/40 extranjero). Llevar ropa de abrigo (la noche en Yanque cae a 5°C en invierno), gorro, gafas. Aclimátate en Arequipa al menos 24h antes.",
    shortPitch: "Cruz del Cóndor al amanecer y aguas termales en Yanque",
    category: Category.nature,
    difficulty: "moderado",
    city: "Arequipa",
    region: "Arequipa",
    durationHours: 36,
    priceSoles: 55000,
    capacity: 14,
    language: ["es", "en"],
    included: [
      "Transporte turístico Arequipa-Colca-Arequipa",
      "Hotel 1 noche en Yanque (habitación doble baño privado)",
      "3 comidas (almuerzo D1, cena D1, almuerzo D2)",
      "Guía oficial bilingüe",
      "Entrada a aguas termales La Calera",
    ],
    excluded: ["Boleto turístico Colca (S/70)", "Bebidas en almuerzos", "Propinas"],
    imageUrl: "https://source.unsplash.com/800x600/?colca-canyon",
    rating: 4.8,
    reviewsCount: 134,
  },
  {
    operatorName: "Colca Adventures",
    title: "Ruta del Sillar: la cantera blanca de Arequipa",
    description:
      "Recorrido de medio día por la quebrada de Añashuayco y Culebrillas, fuente del sillar que define la arquitectura colonial de Arequipa desde 1540. Salida 14:00 PM. El sillar es una toba volcánica blanca o rosada eyectada hace 1.6 millones de años por las erupciones del Chachani; su porosidad lo hace ligero, fácil de tallar y excelente aislante térmico. Caminata de 2h por las paredes de la cantera donde aún trabajan canteros artesanales. Demostración de talla en vivo: un canterista experimentado tarda 15 minutos en cortar un bloque rectangular usando combo, cincel y línea de plomo. La técnica no ha cambiado en 480 años. Continuamos por el cañón labrado donde se aprecian relieves tallados por los mismos canteros en su tiempo libre — figuras religiosas, escudos y rostros incas que el escultor arequipeño Juan Fernando Carpio empezó a documentar en 1980. Las paredes alcanzan los 20 metros de alto. Cierre con vista panorámica al volcán Misti (5,822 msnm) y Chachani (6,057 msnm). Retorno al centro 18:30 PM. Tour ideal para combinar con city tour de Arequipa al día siguiente. Llevar zapatillas cómodas (terreno polvoriento), gorra, agua. La temperatura en la quebrada puede subir 3°C sobre la del centro. Capacidad 12 personas.",
    shortPitch: "Cantera de piedra volcánica que dio forma a la Ciudad Blanca",
    category: Category.cultural,
    difficulty: "fácil",
    city: "Arequipa",
    region: "Arequipa",
    durationHours: 5,
    priceSoles: 9500,
    capacity: 12,
    language: ["es", "en"],
    included: [
      "Transporte turístico ida y vuelta",
      "Guía oficial bilingüe",
      "Demostración de talla con cantero local",
      "Entrada a la cantera",
    ],
    excluded: ["Bebidas y snacks", "Propinas"],
    imageUrl: "https://source.unsplash.com/800x600/?arequipa-sillar",
    rating: 4.5,
    reviewsCount: 42,
  },
  {
    operatorName: "Colca Adventures",
    title: "Ascenso al volcán Misti 2 días",
    description:
      "Expedición de alta montaña en 2 días al volcán Misti, el icónico cono perfecto que custodia Arequipa. Día 1: salida 5:00 AM desde Arequipa. Acceso por la ruta noreste (Aguada Blanca) en vehículo 4x4 hasta los 4,400 msnm. Inicio de la caminata con desnivel positivo de 1,000m hasta el campamento base \"Monte Blanco\" a 5,400 msnm — 5 a 6 horas de ascenso por arena volcánica suelta y morrenas. Cena energética y descanso temprano. Día 2: alarma 1:30 AM. Ascenso nocturno con frontal hasta el cráter (5,822 msnm) por la pendiente final de hielo y ceniza, 35° de inclinación promedio — 4 a 5 horas. Amanecer desde el borde del cráter con fumarolas activas (el Misti está activo, última erupción 1985, monitoreo IGP constante). Vista de Arequipa, el cañón del Colca, el Pichu Pichu y el Chachani. Descenso rápido por el arenal (\"corriendo la arena\") en 2h hasta el vehículo. Retorno a Arequipa 18:00 PM. Incluye transporte 4x4, guía de alta montaña UIAGM, equipo grupal (carpa, cocina, comidas calientes), permiso, oxígeno de emergencia. NO incluye equipo personal: pides bota plástica, polainas, casaca pluma, sleeping bag -10°C — lo alquilamos S/120 día. EXIGE aclimatación previa de 4+ días sobre 3,000 msnm. NO apto para principiantes en altitud.",
    shortPitch: "Cumbre activa a 5,822 msnm con vista a Arequipa",
    category: Category.adventure,
    difficulty: "extremo",
    city: "Arequipa",
    region: "Arequipa",
    durationHours: 36,
    priceSoles: 65000,
    capacity: 6,
    language: ["es", "en"],
    included: [
      "Transporte 4x4 Arequipa-Aguada Blanca",
      "Guía de alta montaña UIAGM",
      "Equipo grupal (carpa, cocina, comidas)",
      "Oxígeno de emergencia",
      "Permiso de ascenso",
    ],
    excluded: ["Equipo personal (alquiler S/120/día)", "Seguro de evacuación", "Propinas"],
    imageUrl: "https://source.unsplash.com/800x600/?misti-volcano",
    rating: 4.6,
    reviewsCount: 28,
  },
  {
    operatorName: "Colca Adventures",
    title: "Mirador de Yanahuara y centro de Arequipa",
    description:
      "Recorrido a pie de medio día por dos joyas de Arequipa. Inicio 9:00 AM en Plaza de Armas: catedral con su órgano belga de 1854, los dos campanarios reconstruidos tras el sismo del 2001, y el portal de gemelos. Continuamos al Monasterio de Santa Catalina (entrada incluida): ciudadela conventual de 20,000 m² fundada en 1579, habitada por monjas dominicas hasta hoy — tres calles enteras (Granada, Sevilla, Toledo) en sillar pintado con añil y rojo siena. Recorrido por las celdas, el lavadero, el coro alto y la pinacoteca con escuela cusqueña. A las 11:30 AM cruzamos el puente Grau hacia Yanahuara, barrio de antigua reducción india. Iglesia de San Juan Bautista (1750) con su fachada churrigueresca tallada en sillar — una de las cumbres del barroco mestizo. Mirador de Yanahuara: serie de 9 arcos de sillar enmarcando al Misti, el Pichu Pichu y el Chachani. Cierre 12:30 PM en una picantería tradicional yanahuarina (almuerzo no incluido pero recomendado): rocoto relleno horneado en horno de leña, chupe de camarón del río Majes los viernes, adobo arequipeño los domingos. Recorrido principalmente en plano, 3.5 km caminata acumulada. Llevar gorra y agua (sol arequipeño es directo a 2,335 msnm). Capacidad 14 personas.",
    shortPitch: "Sillar colonial, Santa Catalina y vista al Misti",
    category: Category.cultural,
    difficulty: "fácil",
    city: "Arequipa",
    region: "Arequipa",
    durationHours: 4,
    priceSoles: 7000,
    capacity: 14,
    language: ["es", "en"],
    included: [
      "Guía oficial bilingüe",
      "Entrada al Monasterio de Santa Catalina",
      "Transporte centro-Yanahuara-centro",
    ],
    excluded: ["Almuerzo en picantería", "Bebidas", "Propinas"],
    imageUrl: "https://source.unsplash.com/800x600/?yanahuara-arequipa",
    rating: 4.6,
    reviewsCount: 71,
  },
  {
    operatorName: "Colca Adventures",
    title: "Reserva Salinas y Aguada Blanca",
    description:
      "Excursión de día completo a la Reserva Nacional de Salinas y Aguada Blanca, 366,936 hectáreas de puna entre 3,800 y 6,057 msnm. Salida 7:30 AM desde Arequipa. Ruta panorámica a Chivay con paradas estratégicas: Pampa Cañahuas para vicuñas silvestres en libertad (la población se recuperó de 5,000 a 50,000 individuos desde 1970 gracias al manejo comunal del chaccu, esquila tradicional); las bofedales de Toccra donde pastan llamas y alpacas; el bosque de Puya raimondii cerca del paso de Patapampa (4,910 msnm) — la planta de inflorescencia más alta del mundo (10m), florece una sola vez en sus 100 años de vida. Llegada a la Laguna de Salinas (4,300 msnm): salar de 9 km² con tres especies de flamencos andinos (chileno, andino y de James) entre mayo y noviembre. Almuerzo box-lunch en mirador. Vista de los volcanes Pichu Pichu (5,664 msnm), Misti y Ubinas (este último activo, monitoreado por IGP). Retorno por la ruta del bosque de piedras de Pampa de Arrieros 18:30 PM. Incluye transporte 4x4 (la ruta cruza pistas afirmadas), guía naturalista, almuerzo. Llevar binoculares, casaca cortavientos (a 4,500 msnm el viento sopla a 30 km/h), protector 50+, agua, hojas de coca. La altitud puede provocar mareo: tour NO recomendado si llegaste a Arequipa hace menos de 24h.",
    shortPitch: "Vicuñas, flamencos andinos y laguna salada a 4,300 msnm",
    category: Category.nature,
    difficulty: "fácil",
    city: "Arequipa",
    region: "Arequipa",
    durationHours: 11,
    priceSoles: 14500,
    capacity: 8,
    language: ["es", "en"],
    included: [
      "Transporte 4x4 con chofer experimentado",
      "Guía naturalista bilingüe",
      "Box-lunch en mirador",
      "Snack y agua durante el recorrido",
    ],
    excluded: ["Binoculares (alquiler S/15)", "Propinas", "Boleto turístico Colca si extiende ruta"],
    imageUrl: "https://source.unsplash.com/800x600/?vicuna-peru",
    rating: 4.7,
    reviewsCount: 49,
  },

  // ============ COSTA NORTE (4) ============
  {
    operatorName: "Norte Salvaje",
    title: "Clase de surf en Máncora",
    description:
      "Clase de surf de 3 horas en Máncora, balneario de la costa norte donde el mar tropical se mantiene entre 22°C y 27°C todo el año (la corriente de Humboldt no llega hasta acá). Punto de encuentro: escuela en Boulevard Piura 8:00 AM o 16:30 PM (las dos sesiones aprovechan la marea media). Briefing en seco de 25 minutos: corrientes, etiqueta del lineup, paddling, pop-up y posición. La playa principal de Máncora ofrece una izquierda larga tipo point break que rompe sobre arena (la temida \"Punta Máncora\" para avanzados está al norte). Para iniciación trabajamos la zona central donde la espuma blanca se extiende 80 metros. Equipo incluido: tabla soft-top según peso, leash, lycra protectora UV, wax. NO usamos neoprene — el agua está caliente. Sesión de 2h con un instructor por cada 3 alumnos, ratio menor que en Lima por la presencia de bañistas. Cierre con jugo natural de mango en chiringuito. Si la marea no acompaña, ofrecemos un estiramiento + sesión teórica de lectura de olas y pasamos a la siguiente franja horaria. Apto desde 10 años, saber nadar 100 metros. Si vienes con experiencia, podemos pasarte directo a tabla evolutiva (7'2) y rotar a Vichayito o Lobitos. Mejor temporada de olas: octubre a marzo (swells del N).",
    shortPitch: "Aguas cálidas todo el año y olas para todos los niveles",
    category: Category.adventure,
    difficulty: "fácil",
    city: "Máncora",
    region: "Piura",
    durationHours: 3,
    priceSoles: 12000,
    capacity: 9,
    language: ["es", "en"],
    included: [
      "Tabla soft-top, leash y wax",
      "Lycra protectora UV",
      "Instructor certificado (1 cada 3 alumnos)",
      "Jugo natural post-surf",
    ],
    excluded: ["Transporte hasta la escuela", "Foto en agua (S/40)", "Propinas"],
    imageUrl: "https://source.unsplash.com/800x600/?mancora-surf",
    rating: 4.8,
    reviewsCount: 116,
  },
  {
    operatorName: "Norte Salvaje",
    title: "Chan Chan: ciudadela de barro más grande de América",
    description:
      "Recorrido de medio día por el complejo arqueológico Chan Chan (Trujillo), 20 km² de adobe que fueron capital del reino Chimú entre 900 y 1470 d.C. Salida 8:30 AM desde Trujillo. Chan Chan llegó a tener 100,000 habitantes — más que cualquier ciudad europea contemporánea — y fue conquistada por los Incas en una década por el bloqueo de los canales de irrigación. Recorrido guiado por el Palacio Nik An (antes Tschudi), uno de los 9 conjuntos amurallados (ciudadelas) destinados al gobernante en vida y mausoleo en muerte. Recorrido por la Plaza Ceremonial con sus relieves de pelícanos, la Sala de las Hornacinas con 24 nichos para idolos, el laberinto de pasadizos y el Pozo Ceremonial alimentado por napa freática a 3 metros. Las paredes de adobe alcanzan 9 metros de alto y conservan relieves originales de peces, pelícanos y la red Chimú. Continuamos al Museo de Sitio (incluido) con la maqueta del complejo total. Cierre opcional en Huaca Arco Iris (\"el Dragón\"), templo Chimú con relieve serpentino bicéfalo. Retorno a Trujillo 13:00 PM. Llevar gorro de ala ancha (no hay sombra), 2L de agua, protector 50+, zapatillas cerradas (suelo arenoso). El sitio es vulnerable a las lluvias del Niño: si llueve, el recorrido se modifica para proteger los relieves. Capacidad 14 personas.",
    shortPitch: "Capital del reino Chimú declarada Patrimonio UNESCO",
    category: Category.cultural,
    difficulty: "fácil",
    city: "Trujillo",
    region: "La Libertad",
    durationHours: 5,
    priceSoles: 10500,
    capacity: 14,
    language: ["es", "en"],
    included: [
      "Transporte ida y vuelta desde Trujillo",
      "Guía oficial Mincetur bilingüe",
      "Entrada a Palacio Nik An, Museo de Sitio y Huaca Arco Iris",
      "Agua durante el recorrido",
    ],
    excluded: ["Almuerzo", "Propinas"],
    imageUrl: "https://source.unsplash.com/800x600/?chan-chan-peru",
    rating: 4.6,
    reviewsCount: 73,
  },
  {
    operatorName: "Norte Salvaje",
    title: "Huanchaco: caballitos de totora y cebiche del muelle",
    description:
      "Tour de medio día al balneario de Huanchaco (15 km al norte de Trujillo), donde la pesca artesanal en caballitos de totora se mantiene viva como tradición Mochica-Chimú. Salida 14:00 PM. Visita al \"Otorongo\", reservorio comunitario donde los pescadores cultivan la totora (Schoenoplectus californicus) en piscinas de 50x50 metros. La totora se corta verde, se seca al sol 21 días y se amarra con yute para formar el caballito de 3.5 metros — la embarcación pesquera continua en uso más antigua del Pacífico, datada por restos cerámicos en 1,500 a.C. Demostración de armado en vivo por un pescador huanchaquero (toma 4 horas armar uno desde cero, dura 3 meses navegando). Quien lo desee puede subirse a un caballito junto al pescador (ida y vuelta 200 metros, S/30 directo al pescador, cobertura de chaleco salvavidas). Continuamos a la Iglesia de Huanchaco (1535), una de las primeras del Perú, con vista al mar. Cierre con cebiche fresco del muelle en cebichería La Esquina (incluido): cebiche mixto del día, choclo y camote. Atardecer en el malecón, popular entre surfistas porque la izquierda larga de Huanchaco es de las más estables de la costa peruana. Retorno a Trujillo 19:30 PM. Tour familiar, niños desde 5 años. Llevar gorro, zapatillas que se puedan mojar, abrigo ligero (la brisa cae fuerte tras el atardecer).",
    shortPitch: "Embarcación pre-inca de 3,000 años aún en uso pesquero",
    category: Category.cultural,
    difficulty: "fácil",
    city: "Trujillo",
    region: "La Libertad",
    durationHours: 4,
    priceSoles: 8500,
    capacity: 12,
    language: ["es", "en"],
    included: [
      "Transporte Trujillo-Huanchaco-Trujillo",
      "Guía bilingüe",
      "Demostración con pescador local",
      "Cebiche mixto en cebichería del muelle",
    ],
    excluded: ["Paseo en caballito de totora (S/30)", "Bebidas adicionales", "Propinas"],
    imageUrl: "https://source.unsplash.com/800x600/?huanchaco-totora",
    rating: 4.7,
    reviewsCount: 88,
  },
  {
    operatorName: "Norte Salvaje",
    title: "Kuélap: fortaleza de los chachapoyas 2 días",
    description:
      "Tour de 2 días a Kuélap, complejo monumental de la cultura Chachapoyas en el departamento de Amazonas. Día 1: vuelo Lima/Trujillo–Jaén, traslado terrestre 4h hasta Chachapoyas (2,335 msnm). Almuerzo en plaza de armas. Tarde: visita al Museo Leymebamba (incluido), donde se conservan 219 fardos funerarios chachapoyas hallados en 1997 en la Laguna de los Cóndores — momias en posición fetal con sus textiles intactos por el microclima seco de la cueva. Cena y hospedaje en hostal de Chachapoyas. Día 2: salida 6:30 AM hacia Tingo (1h 15min). Subida a Kuélap por el primer teleférico turístico del Perú (operado por POMA, 4 km, 20 minutos sobre el cañón de Tingo). Entrada al complejo (3,000 msnm): muralla perimétrica de hasta 19 metros de alto rodeando 6 hectáreas con 420 estructuras circulares. La fortaleza fue ocupada del 500 al 1570 d.C. y resistió al imperio Inca dos décadas. Recorrido guiado de 3h por el Pueblo Alto, el Tintero (templo subterráneo en forma de embudo), la Torre y los relieves geométricos en zigzag de las viviendas elite. Almuerzo box-lunch. Bajada en teleférico, retorno a Jaén y vuelo a Lima/Trujillo. Incluye vuelos, hotel 4 estrellas, todas las comidas, teleférico, entradas, guía. Mejor temporada: mayo-octubre (lluvias intensas nov-abril dificultan el teleférico). Llevar casaca impermeable, zapatillas con buen agarre.",
    shortPitch: "Ciudadela amurallada de los \"guerreros de las nubes\"",
    category: Category.cultural,
    difficulty: "moderado",
    city: "Chachapoyas",
    region: "Amazonas",
    durationHours: 36,
    priceSoles: 58000,
    capacity: 10,
    language: ["es", "en"],
    included: [
      "Vuelos Lima/Trujillo-Jaén ida y vuelta",
      "Traslados terrestres",
      "Hotel 4 estrellas en Chachapoyas (1 noche)",
      "Todas las comidas (3 almuerzos, 1 cena, 2 desayunos)",
      "Teleférico Tingo-Kuélap ida y vuelta",
      "Entradas a Kuélap y Museo Leymebamba",
      "Guía bilingüe",
    ],
    excluded: ["Propinas", "Bebidas en almuerzos", "Seguro de viaje"],
    imageUrl: "https://source.unsplash.com/800x600/?kuelap-fortress",
    rating: 4.8,
    reviewsCount: 36,
  },

  // ============ SELVA (3) ============
  {
    operatorName: "Amazonía Viva",
    title: "Iquitos Amazonas 3 días en lodge selvático",
    description:
      "Programa de 3 días en lodge ribereño a 60 km de Iquitos por el río Amazonas, en territorio amazónico de selva baja (110 msnm). Día 1: recojo del aeropuerto Crnl. FAP Francisco Secada, traslado al puerto de Nanay. Navegación en bote rápido 2h aguas abajo del Amazonas hasta el lodge. Almuerzo en el lodge: juane de gallina, plátano frito, ensalada de cocona. Tarde: caminata interpretativa por trocha selvática con guía Cocama, identificación de la lupuna (Ceiba pentandra, hasta 70m), liana \"escalera de mono\", catahua y árbol del caucho con su corte característico. Avistamiento de monos pichicos y maquisapas. Cena con jugo natural de aguaje. Caminata nocturna a tarántulas y caimán enano. Día 2: salida 5:00 AM al Lago Tarapoto en busca del delfín rosado (Inia geoffrensis): única especie de delfín de agua dulce, hembras llegan a 2.5m. Población estable y se observa el 90% de las visitas. Pesca artesanal de pirañas con caña de tacuara (las que se pesquen las almuerzas). Tarde: visita comunidad indígena Yagua, ceremonia con cerbatana y demostración de tejido en chambira. Día 3: amanecer ornitológico (130 especies registradas), retorno a Iquitos, traslado al aeropuerto. Incluye 2 noches lodge bungalow privado con mosquitero, todas las comidas, traslados acuáticos, guía bilingüe. Llevar repelente con DEET 30%+ obligatorio, ropa de manga larga, botas alquilables S/15.",
    shortPitch: "Delfines rosados, pesca de pirañas y caminata nocturna",
    category: Category.nature,
    difficulty: "moderado",
    city: "Iquitos",
    region: "Loreto",
    durationHours: 72,
    priceSoles: 95000,
    capacity: 12,
    language: ["es", "en"],
    included: [
      "Traslados aeropuerto-lodge ida y vuelta",
      "2 noches en lodge con bungalow privado y mosquitero",
      "Todas las comidas (3 desayunos, 3 almuerzos, 2 cenas)",
      "Guía Cocama bilingüe",
      "Visita a comunidad Yagua",
      "Pesca artesanal y caminata nocturna",
    ],
    excluded: ["Vuelos a Iquitos", "Repelente con DEET", "Botas (alquiler S/15)", "Propinas"],
    imageUrl: "https://source.unsplash.com/800x600/?amazon-river-peru",
    rating: 4.7,
    reviewsCount: 58,
  },
  {
    operatorName: "Amazonía Viva",
    title: "Tambopata 3 días: collpa de guacamayos",
    description:
      "Expedición de 3 días en la Reserva Nacional de Tambopata (Madre de Dios), 274,690 hectáreas de selva amazónica entre los ríos Tambopata y Heath. Día 1: vuelo Lima-Puerto Maldonado. Recojo y navegación 3h por el río Tambopata hasta lodge ribereño en zona de amortiguamiento. Almuerzo en el lodge. Tarde: caminata por el sendero del aguajal, visita a torre canopy de 30m para vista del dosel y aves rapaces (águila harpía con suerte). Cena con palmito de chonta y patarashca de doncella. Día 2: alarma 4:30 AM. Navegación 1h hasta la collpa Chuncho, una pared arcillosa donde guacamayos rojos, escarlatas y azul-amarillos descienden en grupos de hasta 200 al amanecer para consumir arcilla rica en sodio que neutraliza las toxinas de las semillas que comen. Espectáculo único entre 6:00 y 8:30 AM. Retorno al lodge para almuerzo. Tarde: visita al Lago Sandoval (área estrictamente protegida) con remo silencioso para nutrias gigantes (Pteronura brasiliensis) — solo 5 familias quedan en el lago, avistamiento 70% probable. Día 3: amanecer en torre, retorno a Puerto Maldonado y vuelo a Lima. Incluye vuelo nacional, traslados acuáticos, lodge con baño privado, todas las comidas, guía naturalista bilingüe, entrada a la Reserva. Tour estricto en buenas prácticas: prohibido alimentar fauna o tocar plantas. Repelente, botas (alquiler), linterna frontal y poncho impermeable obligatorios. Lluvias dic-marzo, mejor sept-nov.",
    shortPitch: "Collpa Chuncho con 200 guacamayos al amanecer",
    category: Category.nature,
    difficulty: "moderado",
    city: "Puerto Maldonado",
    region: "Madre de Dios",
    durationHours: 72,
    priceSoles: 88000,
    capacity: 10,
    language: ["es", "en"],
    included: [
      "Vuelo Lima-Puerto Maldonado ida y vuelta",
      "Traslados acuáticos",
      "2 noches en lodge con baño privado",
      "Todas las comidas",
      "Guía naturalista bilingüe",
      "Entrada a la Reserva Nacional Tambopata",
      "Acceso a torre canopy y collpa Chuncho",
    ],
    excluded: ["Botas y linterna (alquiler S/25)", "Repelente con DEET", "Bebidas alcohólicas", "Propinas"],
    imageUrl: "https://source.unsplash.com/800x600/?macaw-amazon",
    rating: 4.9,
    reviewsCount: 74,
  },
  {
    operatorName: "Amazonía Viva",
    title: "Manu: parque nacional virgen 4 días",
    description:
      "Expedición de 4 días al Parque Nacional del Manu (Cusco-Madre de Dios), Reserva de Biósfera UNESCO con 1,025 especies de aves, 222 de mamíferos y la mayor biodiversidad documentada del planeta. Día 1: salida 5:00 AM Cusco, ruta terrestre por Paucartambo cruzando los pisos altitudinales de puna, ceja de selva y selva alta. Parada en Tres Cruces (3,800 msnm) para amanecer espectacular sobre el Amazonas. Cena y noche en Cock of the Rock Lodge (1,700 msnm). Día 2: amanecer en lek del gallito de las rocas (Rupicola peruviana, ave nacional del Perú): 12-15 machos cantando y bailando para atraer hembras a 30m de la plataforma. Bajada al río Madre de Dios, navegación 4h hasta Boca Manu. Día 3: día completo en zona reservada del Manu — solo 2,500 visitantes/año por estricto control SERNANP. Cocha Salvador para nutrias gigantes y caimán negro de hasta 5m. Caminata por sendero interpretativo: árbol shihuahuaco de 1,200 años, lianas, hormigas cortadoras. Día 4: collpa de loros al amanecer (50+ aves), retorno por el río y vuelo charter Boca Manu-Cusco (45 minutos en avioneta cessna). Llegada Cusco 14:00 PM. Incluye transporte privado, vuelo charter de regreso, lodge con baño privado, todas las comidas (chef del lodge), entrada al PN Manu, guía especializado. Restricciones: máximo 8 personas por grupo. NO recomendado para niños menores de 10 años. Mejor: mayo-octubre (estación seca).",
    shortPitch: "Reserva de Biósfera UNESCO con la mayor biodiversidad del planeta",
    category: Category.nature,
    difficulty: "moderado",
    city: "Cusco",
    region: "Madre de Dios",
    durationHours: 96,
    priceSoles: 135000,
    capacity: 8,
    language: ["es", "en"],
    included: [
      "Transporte privado Cusco-Manu",
      "Vuelo charter Boca Manu-Cusco",
      "3 noches en lodges con baño privado",
      "Todas las comidas (chef del lodge)",
      "Guía naturalista especializado",
      "Entrada al Parque Nacional del Manu",
    ],
    excluded: ["Repelente y botas", "Bebidas alcohólicas", "Seguro de evacuación", "Propinas"],
    imageUrl: "https://source.unsplash.com/800x600/?manu-rainforest",
    rating: 4.9,
    reviewsCount: 31,
  },

  // ============ MYSTIC (2) ============
  {
    operatorName: "Pachamama Sagrada",
    title: "Comunidad Q'eros: vivencial 2 días",
    description:
      "Programa vivencial de 2 días en Hatun Q'eros (4,200 msnm), comunidad reconocida por el Estado peruano en 2007 como \"última nación Inca\" por la continuidad cultural directa de su organización. Los Q'eros nunca fueron evangelizados intensamente, mantienen el quechua como única lengua hogar y la espiritualidad de los apus en práctica diaria. Día 1: salida 6:00 AM desde Cusco a Paucartambo (3h). Vehículo 4x4 hasta el centro poblado de Hatun Q'eros (4h adicional por trocha). Recibimiento por el Yachaq (curandero-sacerdote) anfitrión, quien comparte té de muña y explica las tres dimensiones de la cosmovisión Q'ero: Hanan Pacha (alto), Kay Pacha (presente), Uku Pacha (interior). Tarde: trabajo con la familia anfitriona en pastoreo de alpacas y demostración de hilado en pushka. Cena de chuño con cordero y mate de coca en cocina de barro. Pernocte en habitación familiar con cama y mantas de alpaca (no es hotel; es casa Q'ero). Día 2: amanecer y despacho ceremonial con la familia: ofrenda de hojas de coca, chicha de jora y semillas a los apus Ausangate y Pachatusan, conducida íntegramente en quechua con traducción. Visita a tejedoras: el textil Q'ero es Patrimonio Inmaterial de la Nación (2009) por sus iconografías ancestrales no replicadas en otras zonas. Retorno a Cusco tarde día 2. Tour respetuoso: la comunidad recibe el 70% del precio directo, sin intermediarios. NO se permiten fotos sin pedir permiso. Apto solo para viajeros con interés cultural genuino.",
    shortPitch: "Convive con la última comunidad inca aún viviendo en la altura",
    category: Category.mystic,
    difficulty: "moderado",
    city: "Cusco",
    region: "Cusco",
    durationHours: 36,
    priceSoles: 28000,
    capacity: 6,
    language: ["es", "en", "qu"],
    included: [
      "Transporte 4x4 Cusco-Hatun Q'eros ida y vuelta",
      "Hospedaje en casa familiar con mantas de alpaca",
      "Todas las comidas (cocina tradicional)",
      "Traductor quechua-español-inglés",
      "Despacho ceremonial con Yachaq",
      "Aporte directo a la comunidad (70% del precio)",
    ],
    excluded: ["Sleeping bag personal recomendado", "Snacks adicionales", "Propinas voluntarias"],
    imageUrl: "https://source.unsplash.com/800x600/?qeros-andean",
    rating: 5.0,
    reviewsCount: 19,
  },
  {
    operatorName: "Pachamama Sagrada",
    title: "Ceremonia de ayahuasca regulada en Tarapoto",
    description:
      "Ceremonia tradicional shipiba de ayahuasca en centro acreditado por el INC y la Dirección Regional de Salud de San Martín, 14 km al sur de Tarapoto. La ayahuasca (Banisteriopsis caapi + Psychotria viridis) es Patrimonio Cultural de la Nación desde 2008. NO es retiro místico vendido en Instagram: es ceremonia con curandero shipibo-konibo de Pucallpa, brebaje preparado en chacruna del centro, protocolo de admisión médica y atención psicológica certificada. Programa de 24h: día 1, 14:00 PM check-in en maloca cerca de Sauce. Entrevista clínica obligatoria: tensión, antecedentes psiquiátricos, medicamentos en uso (los ISRS son contraindicación absoluta — si tomas antidepresivos no podemos atenderte por riesgo de síndrome serotoninérgico). Charla introductoria de 2h con el curandero José sobre el linaje shipibo, los ícaros (cantos curativos) que dirigen la ceremonia y las purgas comunes. Cena vegetariana ligera 18:00 PM (sin sal, sin condimentos, sin carne, sin alcohol — la dieta debió iniciarse 3 días antes en casa). Ceremonia inicia 20:30 PM en maloca tradicional con piso de tierra batida: el curandero administra dosis individual (40-80ml según peso y constitución), apaga las velas y abre la ceremonia con ícaro de mariri. La sesión dura 4-6 horas. Apoyo de 3 facilitadores certificados, una facilitadora exclusiva para mujeres. Cierre con ícaro de yacuruna 02:30 AM. Día siguiente: integración grupal hasta 11:00 AM, desayuno suave y check-out. Apto desde 21 años, NO embarazadas, NO antecedentes psicóticos personales o familiares. Cita previa con 7 días de anticipación obligatoria.",
    shortPitch: "Centro acreditado con curandero shipibo y protocolo médico",
    category: Category.mystic,
    difficulty: "moderado",
    city: "Tarapoto",
    region: "San Martín",
    durationHours: 24,
    priceSoles: 24500,
    capacity: 8,
    language: ["es", "en"],
    included: [
      "Entrevista clínica con personal médico",
      "Charla introductoria con curandero shipibo",
      "Cena vegetariana ceremonial",
      "Ceremonia de ayahuasca con 3 facilitadores",
      "Hospedaje en maloca tradicional",
      "Desayuno e integración grupal post-ceremonia",
    ],
    excluded: [
      "Transporte hasta Tarapoto",
      "Dieta preparatoria de 3 días previos",
      "Sesiones extendidas o adicionales",
    ],
    imageUrl: "https://source.unsplash.com/800x600/?ayahuasca-amazon",
    rating: 4.8,
    reviewsCount: 22,
  },
];

async function main(): Promise<void> {
  console.log("Limpiando datos previos…");
  // Orden importa por foreign keys: bookings → tours → operators
  await prisma.booking.deleteMany();
  await prisma.tour.deleteMany();
  await prisma.operator.deleteMany();
  console.log("Datos previos eliminados");

  console.log("Sembrando operadores…");
  const operatorIdByName: Record<string, string> = {};
  for (const op of OPERATORS) {
    const created = await prisma.operator.create({ data: op });
    operatorIdByName[op.name] = created.id;
  }
  console.log(`${OPERATORS.length} operadores creados`);

  console.log("Sembrando tours…");
  let toursCreated = 0;
  for (const tour of TOURS) {
    const { operatorName, ...rest } = tour;
    const operatorId = operatorIdByName[operatorName];
    if (!operatorId) {
      throw new Error(`Operador no encontrado para tour "${tour.title}": ${operatorName}`);
    }
    await prisma.tour.create({ data: { ...rest, operatorId } });
    toursCreated++;
  }
  console.log(`${toursCreated} tours creados`);

  console.log(`\nSembrados ${OPERATORS.length} operadores y ${toursCreated} tours`);
}

main()
  .catch((error) => {
    console.error("Error en el seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
