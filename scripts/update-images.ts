// scripts/update-images.ts
// Asigna imageUrl con URLs directas de images.unsplash.com (verificadas).
// Las 5 que fallaron en extracción usan reuso temático apropiado.
// Correr con: npx tsx scripts/update-images.ts

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// URLs directas (verificadas con redirect 200 + content-type image/jpeg)
const URLS = {
  MACHU_PICCHU: "https://images.unsplash.com/photo-1526392060635-9d6019884377?w=1200&q=80",
  VINICUNCA: "https://images.unsplash.com/photo-1556691245-401a1a99a8cb?w=1200&q=80",
  HUMANTAY: "https://images.unsplash.com/photo-1665858539835-ec8e05971f56?w=1200&q=80",
  OLLANTAYTAMBO: "https://images.unsplash.com/photo-1725153265879-9b0949e808d3?w=1200&q=80",
  PISAC: "https://images.unsplash.com/photo-1669334871131-0e7a6f69cfca?w=1200&q=80",
  TAMBOMACHAY: "https://images.unsplash.com/photo-1642193014656-15166ddc8bdf?w=1200&q=80",
  SACSAYHUAMAN: "https://images.unsplash.com/photo-1640525041130-3db495dde1b8?w=1200&q=80",
  MARAS: "https://images.unsplash.com/photo-1525222529557-b8849ca37860?w=1200&q=80",
  QEROS: "https://images.unsplash.com/photo-1593494441374-bad54249d0e8?w=1200&q=80",
  MANU: "https://images.unsplash.com/photo-1622894809004-87c81c4a48b1?w=1200&q=80",
  CEVICHE: "https://images.unsplash.com/photo-1535399831218-d5bd36d1a6b3?w=1200&q=80",
  LIMA_COLONIAL: "https://images.unsplash.com/photo-1687835071853-b72ebad325d1?w=1200&q=80",
  SURF_COSTA_VERDE: "https://images.unsplash.com/photo-1660521844005-015733ce411e?w=1200&q=80",
  CARAL: "https://images.unsplash.com/photo-1721864389794-1beb1c4c5244?w=1200&q=80",
  LOMAS: "https://images.unsplash.com/photo-1717813332015-1cfbbe859bdf?w=1200&q=80",
  PACHACAMAC: "https://images.unsplash.com/photo-1722980933523-4bc014a0145c?w=1200&q=80",
  SALINAS_AGUADA: "https://images.unsplash.com/photo-1563239089-195efede1473?w=1200&q=80",
  YANAHUARA: "https://images.unsplash.com/photo-1675793736370-98dcf279eedd?w=1200&q=80",
  MISTI: "https://images.unsplash.com/photo-1727161797764-3f7f83bf3adf?w=1200&q=80",
  SILLAR: "https://images.unsplash.com/photo-1634065690358-bd9e34edd7c5?w=1200&q=80",
  MANCORA: "https://images.unsplash.com/photo-1764077158554-26a53cd0f469?w=1200&q=80",
  HUANCHACO: "https://images.unsplash.com/photo-1607402921249-130689dfba7c?w=1200&q=80",
  CHAN_CHAN: "https://images.unsplash.com/photo-1687835073280-fd0f002062d2?w=1200&q=80",
  KUELAP: "https://images.unsplash.com/photo-1657258525936-cd012399e25e?w=1200&q=80",
  IQUITOS: "https://images.unsplash.com/photo-1647288255373-bc2e6d983fc1?w=1200&q=80",
};

const TOUR_IMAGES: Record<string, string> = {
  // CUSCO 11 + 1 selva
  "cmoh8rbzp0009vpn26ju9npzp": URLS.MACHU_PICCHU,
  "cmoh8rc8h000dvpn22yhhhrii": URLS.VINICUNCA,
  "cmoh8rceb000hvpn29qhzz4ug": URLS.HUMANTAY, // Choquequirao reusa Humantay (trek andino)
  "cmoh8rcbj000fvpn2n0qvixep": URLS.HUMANTAY,
  "cmoh8rc5n000bvpn2rvde2bax": URLS.PISAC, // Valle Sagrado reusa Pisac
  "cmoh8rcpm000pvpn2koidz469": URLS.OLLANTAYTAMBO,
  "cmoh8rcmv000nvpn2m5y938j1": URLS.PISAC,
  "cmoh8rcsg000rvpn2bhwxmomr": URLS.TAMBOMACHAY,
  "cmoh8rcha000jvpn2fo8kzet0": URLS.SACSAYHUAMAN,
  "cmoh8rck3000lvpn2rgjfh2lx": URLS.MARAS,
  "cmoh8rea5001tvpn2uchbmxj4": URLS.QEROS,
  "cmoh8re7d001rvpn2eyvaz3bk": URLS.MANU,

  // LIMA 6
  "cmoh8rcy4000vvpn25tzlc0ss": URLS.CEVICHE,
  "cmoh8rcvc000tvpn23butdi5i": URLS.LIMA_COLONIAL,
  "cmoh8rd9g0013vpn2o4d7a6zg": URLS.SURF_COSTA_VERDE,
  "cmoh8rd0x000xvpn2orc0q2wm": URLS.CARAL,
  "cmoh8rd6l0011vpn2gh5sebuu": URLS.LOMAS,
  "cmoh8rd3t000zvpn2vn252gw0": URLS.PACHACAMAC,

  // AREQUIPA 5
  "cmoh8rdca0015vpn2gk23k37h": URLS.HUMANTAY, // Colca reusa Humantay (cañón andino)
  "cmoh8rdng001dvpn2h9xobfux": URLS.SALINAS_AGUADA,
  "cmoh8rdkp001bvpn26emecam2": URLS.YANAHUARA,
  "cmoh8rdhw0019vpn2wq5xn8tk": URLS.MISTI,
  "cmoh8rdf30017vpn2syj9r18z": URLS.SILLAR,

  // COSTA NORTE 4
  "cmoh8rdq9001fvpn2xsyrxyld": URLS.MANCORA,
  "cmoh8rdvu001jvpn2mor2wbyw": URLS.HUANCHACO,
  "cmoh8rdt1001hvpn2a6g2ai1a": URLS.CHAN_CHAN,
  "cmoh8rdyo001lvpn28ylkpior": URLS.KUELAP,

  // SELVA 3
  "cmoh8re4h001pvpn23qzu04f2": URLS.MANU, // Tambopata reusa Manu (selva)
  "cmoh8re1o001nvpn2yispucfu": URLS.IQUITOS,
  "cmoh8red8001vvpn2o9w6e0ph": URLS.IQUITOS, // Ayahuasca reusa Iquitos
};

async function main() {
  const total = Object.keys(TOUR_IMAGES).length;
  console.log(`Actualizando imageUrl en ${total} tours...\n`);

  let exitos = 0;
  let fallos = 0;

  for (const [tourId, imageUrl] of Object.entries(TOUR_IMAGES)) {
    try {
      const updated = await db.tour.update({
        where: { id: tourId },
        data: { imageUrl },
        select: { id: true, title: true },
      });
      console.log(`OK  ${updated.title}`);
      exitos++;
    } catch (error) {
      console.error(`FAIL  ${tourId}: ${(error as Error).message}`);
      fallos++;
    }
  }

  console.log(`\nTotal: ${exitos} actualizados, ${fallos} fallaron`);
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
