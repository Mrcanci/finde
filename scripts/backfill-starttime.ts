// scripts/backfill-starttime.ts
// Backfill puntual de Tour.startTime para los tours del seed que quedaron en
// null (40 al momento de escribir). Asigna una hora de salida realista por
// TÍTULO (ver STARTTIME_BY_TITLE). SOLO actualiza tours con startTime === null:
// nunca pisa un tour que ya tiene hora (p. ej. "prueba" → "08:00").
//
// Uso:
//   npx dotenv-cli -e .env.local -- npx tsx scripts/backfill-starttime.ts
//
// Idempotente: una segunda corrida no cambia nada (ya no quedan nulls).
// No borra, no recrea, no re-siembra: solo UPDATE de startTime donde es null.

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// Hora de salida "HH:MM" por título exacto (matcheado contra la DB).
const STARTTIME_BY_TITLE: Record<string, string> = {
  "Ascenso al volcán Misti 2 días": "05:00",
  "Avistamiento de Ballenas Jorobadas en Los Órganos": "08:00",
  "Cañón del Colca 2 días con vuelo del cóndor": "06:00",
  "Caral: civilización más antigua de América": "08:00",
  "Castillo de Chancay y Mercado Tradicional": "08:00",
  "Ceremonia de ayahuasca regulada en Tarapoto": "19:00",
  "Chan Chan: ciudadela de barro más grande de América": "09:00",
  "Clase de surf en Costa Verde": "09:00",
  "Clase de surf en Máncora": "09:00",
  "Comunidad Q'eros: vivencial 2 días": "06:00",
  "Huanchaco: caballitos de totora y cebiche del muelle": "09:00",
  "Iquitos Amazonas 3 días en lodge selvático": "06:00",
  "Islas Ballestas + Reserva de Paracas": "08:00",
  "Kuélap: fortaleza de los chachapoyas 2 días": "06:00",
  "Laguna Humantay full day": "05:00",
  "Lima Colonial: Centro Histórico patrimonio UNESCO": "09:00",
  "Lima de Noche: Circuito Mágico del Agua": "19:00",
  "Lomas de Lúcumo: bosque de neblina costero": "08:00",
  "Lunahuaná: vino, pisco y deportes de aventura": "08:00",
  "Machu Picchu Full Day desde Cusco": "05:00",
  "Manu: parque nacional virgen 4 días": "06:00",
  "Maras, Moray y Salineras": "08:00",
  "Mirador de Yanahuara y centro de Arequipa": "09:00",
  "Ollantaytambo: fortaleza inca habitada": "08:00",
  "Pachacamac: santuario costeño pre-inca": "09:00",
  "Pisac: ruinas y mercado tradicional": "08:00",
  "Playa La Mina y Playa Roja en Paracas": "09:00",
  "Reserva Salinas y Aguada Blanca": "08:00",
  "Ruta del Sillar: la cantera blanca de Arequipa": "09:00",
  "Sacsayhuamán y Cusco Impe": "09:00",
  "Sandboarding y Buggies en Huacachina": "16:00",
  "Sandboarding y Quad Bikes en Paracas": "16:00",
  "Tambomachay: baño ritual del": "09:00",
  "Tambopata 3 días: collpa de guacamayos": "06:00",
  "Tour gastronómico Miraflores y Barranco": "11:00",
  "Trek a Choquequirao 4 días": "06:00",
  "Trekking a la Laguna Rajuntay": "05:00",
  "Trekking al Nevado Pastoruri": "05:00",
  "Valle Sagrado: Pisac, Ollantaytambo y Chinchero": "08:00",
  "Vinicunca Montaña de 7 Colores": "05:00",
};

async function main() {
  // Re-consultar el estado actual (id + title + startTime) para asignar por
  // título real y solo tocar los que están en null.
  const tours = await db.tour.findMany({
    select: { id: true, title: true, startTime: true },
    orderBy: { title: "asc" },
  });

  const pendientes = tours.filter((t) => t.startTime === null);
  console.log(`Tours totales: ${tours.length} · con startTime null: ${pendientes.length}`);

  let actualizados = 0;
  const sinCubrir: string[] = [];

  for (const tour of pendientes) {
    const hora = STARTTIME_BY_TITLE[tour.title];
    if (!hora) {
      sinCubrir.push(`${tour.id} | ${tour.title}`);
      continue;
    }
    await db.tour.update({
      where: { id: tour.id },
      data: { startTime: hora },
    });
    actualizados++;
    console.log(`✓ ${tour.title} → ${hora}`);
  }

  // Títulos del map que no matchearon ningún tour pendiente (cazar typos).
  const titulosDB = new Set(tours.map((t) => t.title));
  const mapSinMatch = Object.keys(STARTTIME_BY_TITLE).filter((t) => !titulosDB.has(t));

  console.log("\n── Resumen ──");
  console.log(`Actualizados: ${actualizados}`);
  if (sinCubrir.length > 0) {
    console.log(`⚠️ Tours null SIN hora en el map (${sinCubrir.length}):`);
    sinCubrir.forEach((t) => console.log(`   ${t}`));
  } else {
    console.log("Sin tours null fuera del map ✓");
  }
  if (mapSinMatch.length > 0) {
    console.log(`⚠️ Títulos del map que NO existen en la DB (${mapSinMatch.length}):`);
    mapSinMatch.forEach((t) => console.log(`   ${t}`));
  }

  // Verificación final: ¿quedan nulls?
  const nullsRestantes = await db.tour.count({ where: { startTime: null } });
  console.log(`\nstartTime null restantes: ${nullsRestantes}`);
}

main()
  .catch((e) => {
    console.error("Error en backfill:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
