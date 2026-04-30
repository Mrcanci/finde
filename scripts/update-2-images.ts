// Actualiza solo Choquequirao y Cañón del Colca
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const UPDATES: Record<string, string> = {
  // Trek a Choquequirao 4 días
  "cmoh8rceb000hvpn29qhzz4ug": "https://images.unsplash.com/photo-1752067954986-31cae7d48000?w=1200&q=80",
  // Cañón del Colca 2 días con vuelo del cóndor
  "cmoh8rdca0015vpn2gk23k37h": "https://images.unsplash.com/photo-1563106254-9bffcc4994fa?w=1200&q=80",
};

async function main() {
  for (const [tourId, imageUrl] of Object.entries(UPDATES)) {
    const updated = await db.tour.update({
      where: { id: tourId },
      data: { imageUrl },
      select: { title: true },
    });
    console.log(`OK  ${updated.title}`);
  }
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
