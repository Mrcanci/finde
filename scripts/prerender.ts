// scripts/prerender.ts
// Escribe un HTML estático por tour, para que Google y WhatsApp lean meta tags
// de verdad en vez de la cáscara genérica de la SPA.
//
// Corre al final del build:  prisma generate && vite build && tsx scripts/prerender.ts
//
// POR QUÉ ASÍ Y NO CON UNA FUNCIÓN SERVERLESS. Las tres vías evaluadas están en
// docs/historia/2026-08-router-y-urls.md. El prerender gana porque cuesta CERO
// funciones (Vercel Hobby permite 12 y hay 12), sirve a Google y a WhatsApp con
// el MISMO artefacto (así que no hay riesgo de cloaking) y no depende de que el
// crawler ejecute JavaScript.
//
// POR QUÉ FUNCIONA SIN TOCAR vercel.json. Verificado antes de escribir esto:
//   · Los rewrites de Vercel corren DESPUÉS del sistema de archivos, así que un
//     HTML estático en dist/demo/tour/... gana sobre el rewrite /demo/:path*.
//   · Los assets del index.html construido son rutas ABSOLUTAS (/assets/...),
//     así que un archivo a cualquier profundidad los resuelve igual.
//
// NUNCA ROMPE EL DEPLOY. Si la base no responde, o falta DATABASE_URL, o
// cualquier otra cosa falla, avisa y sale con código 0. Un hipo de Supabase no
// puede dejar el sitio sin desplegar: el peor caso aceptable es un deploy sin
// meta tags nuevos, nunca un deploy que no ocurre.

import { PrismaClient } from "@prisma/client";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
// El slug y el sufijo salen del MISMO módulo que usa la app. Si acá se
// reimplementaran, divergirían en silencio y el canonical apuntaría a una URL
// que la app no genera.
import { tourSegment, BASE_PATH } from "../src/lib/routes.js";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(RAIZ, "dist");

// Mientras el producto viva en /demo, las fichas NO se indexan. Ver
// docs/decisiones.md: /demo se queda hasta el lanzamiento.
//
// Y el instrumento es `noindex`, NO un Disallow en robots.txt, porque son cosas
// distintas: robots.txt bloquea el RASTREO y noindex bloquea el INDEXADO. Los
// crawlers de previsualización respetan robots.txt, así que bloquear ahí
// apagaría también la tarjeta de WhatsApp, que es justo lo que esta tanda viene
// a comprar. Con noindex el crawler entra, lee los og: y arma la tarjeta, y
// Google no publica la página.
const NOINDEX = BASE_PATH !== "";

function log(msg: string): void {
  console.log(`[prerender] ${msg}`);
}

// La primera línea útil del error. Sin esto, un error de Prisma imprime un code
// frame de varias líneas y el mensaje queda cortado a la mitad, que es peor que
// no decir nada: parece que el script se rompió en vez de que se saltó el paso.
function motivo(e: unknown): string {
  const txt = e instanceof Error ? e.message : String(e);
  const linea = txt.split("\n").map((l) => l.trim()).find((l) => l.length > 12 && !l.startsWith("at "));
  return (linea ?? txt).slice(0, 150);
}

// Inserta un bloque antes de </head>, sacando primero los tags que reemplaza
// para no dejar duplicados del index.html genérico.
function inyectar(plantilla: string, bloque: string): string {
  const limpia = plantilla
    .replace(/\n?\s*<title>[\s\S]*?<\/title>/i, "")
    .replace(/\n?\s*<meta\s+name="description"[^>]*>/gi, "")
    .replace(/\n?\s*<meta\s+property="og:[^"]*"[^>]*>/gi, "")
    .replace(/\n?\s*<meta\s+name="robots"[^>]*>/gi, "")
    .replace(/\n?\s*<link\s+rel="canonical"[^>]*>/gi, "");
  return limpia.replace(/<\/head>/i, `${bloque}\n  </head>`);
}

async function main(): Promise<void> {
  const plantillaPath = join(DIST, "index.html");
  if (!existsSync(plantillaPath)) {
    log("no existe dist/index.html, ¿corrió vite build? Se salta el paso.");
    return;
  }
  if (!process.env.DATABASE_URL) {
    // Ojo al probar esto en local: `@prisma/client` carga `.env` al importarse y
    // puebla process.env, así que acá casi nunca se dispara. En Vercel NO hay
    // `.env` (está en .gitignore), así que ahí sí es la guarda real. No borrar
    // por parecer código muerto.
    log("sin DATABASE_URL: se salta el paso. El deploy sigue.");
    return;
  }

  let db: PrismaClient | null = null;
  let tours;
  try {
    db = new PrismaClient();
    tours = await db.tour.findMany({
      where: { active: true },
      select: { id: true, title: true, city: true },
      orderBy: { title: "asc" },
    });
  } catch (e) {
    log(`no se pudo leer la base, se salta el paso. El deploy sigue: ${motivo(e)}`);
    await db?.$disconnect().catch(() => {});
    return;
  } finally {
    await db?.$disconnect().catch(() => {});
  }

  const plantilla = readFileSync(plantillaPath, "utf8");
  let escritos = 0;
  for (const t of tours) {
    const seg = tourSegment(t);
    const bloque = NOINDEX ? `    <meta name="robots" content="noindex" data-prerender="1">` : "";
    const html = inyectar(plantilla, bloque);
    const dir = join(DIST, `${BASE_PATH}/tour/${seg}`.replace(/^\//, ""));
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "index.html"), html, "utf8");
    escritos++;
  }
  log(`${escritos} fichas escritas en dist${BASE_PATH}/tour/`);
  if (NOINDEX) log(`con noindex, porque el producto vive en ${BASE_PATH}`);
}

main().catch((e) => {
  // Cualquier cosa inesperada: avisar y salir BIEN. El deploy no se rompe.
  log(`falló y se salta el paso. El deploy sigue: ${motivo(e)}`);
  process.exit(0);
});
