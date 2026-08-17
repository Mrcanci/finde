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

// El origen absoluto, que los og: y el canonical necesitan sí o sí: una ruta
// relativa no le sirve a ningún crawler.
const ORIGEN = process.env.PRERENDER_ORIGIN || "https://finde.pe";

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

// Escapa para atributos HTML. Los títulos y descripciones vienen de agencias y
// pueden traer comillas: sin esto, una comilla parte el atributo y el tag queda
// roto justo en el contenido que el crawler viene a leer.
function esc(t: string): string {
  return (t || "")
    .replace(/&/g, "&amp;").replace(/"/g, "&quot;")
    .replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Recorta a `max` sin partir palabras, y sin dejar puntuación colgando.
function recortar(t: string, max: number): string {
  const limpio = (t || "").replace(/\s+/g, " ").trim();
  if (limpio.length <= max) return limpio;
  const corte = limpio.slice(0, max);
  const i = corte.lastIndexOf(" ");
  return (i > max * 0.6 ? corte.slice(0, i) : corte).replace(/[\s,;:.]+$/, "") + "...";
}

// El <title>. "<tour> en <ciudad> | Finde" da contexto de destino, que es la
// palabra por la que alguien busca. Medido sobre los 42 títulos reales: promedio
// 54 caracteres y 15 pasan de 60, así que los largos caen a la forma corta en vez
// de recortarse a la mitad de una palabra.
function titulo(t: { title: string; city: string }): string {
  const largo = `${t.title} en ${t.city} | Finde`;
  return largo.length <= 65 ? largo : `${t.title} | Finde`;
}

// La description. shortPitch es el gancho escrito a mano, pero mide entre 39 y 68
// caracteres (medido sobre los 37 que lo tienen) y Google usa unos 155: solo con
// eso quedaría a menos de la mitad. Y CINCO tours no lo tienen, que son
// justamente los 5 de MEGATOURS, la única agencia real. Por eso se concatena con
// la descripción, que arranca con los datos concretos.
//
// Los dos textos se PEGAN con un punto en el medio. Sin él salía "…en Pacífico
// norte Salida 7:30 AM…", dos oraciones cosidas sin corte, y eso se lee en cada
// previsualización de WhatsApp y en cada resultado de Google.
//
// Medido sobre los 37 ganchos activos al 2026-08-17: **ninguno** termina en
// puntuación, así que hoy el separador siempre hace falta. La guarda de abajo es
// para el gancho que una agencia escriba mañana cerrando con punto: ahí agregar
// otro daría "norte.. Salida".
//
// El gancho no se toca en la base. Esta normalización vive acá, al emitir el
// tag, igual que el recorte de la portada de Unsplash.
function descripcion(t: { shortPitch: string | null; description: string }): string {
  const gancho = (t.shortPitch || "").trim();
  const cuerpo = (t.description || "").trim();
  if (!gancho) return recortar(cuerpo, 155);
  if (!cuerpo) return recortar(gancho, 155);
  // Una coma o un punto y coma al final quedan raros delante de otra oración, y
  // agregarles un punto da "norte,.". Se reemplazan; una puntuación de cierre
  // (. ! ? …) se respeta tal cual.
  const limpio = gancho.replace(/[,;:]+$/, "");
  const yaCierra = /[.!?…]$/.test(limpio);
  return recortar(`${limpio}${yaCierra ? "" : "."} ${cuerpo}`, 155);
}

// La portada, ajustada a lo que pide una tarjeta grande.
//
// Facebook (que es el crawler que usa WhatsApp) documenta: mínimo 200x200, y
// POR DEBAJO DE 600x315 la tarjeta se muestra chica. Lo recomendado es 1200x630
// con relación 1.91:1.
//
// Medido sobre las 42 portadas del catálogo: 27 vienen de Unsplash con ?w=1200,
// 5 de nuestro bucket a 1310x983, y **10 de Unsplash con ?w=400**, o sea 400x300:
// por debajo del umbral, tarjeta chica. Es el 24% del catálogo.
//
// Las de Unsplash se arreglan GRATIS: el ancho va en la URL y su CDN hace el
// recorte. Se reescribe acá, al emitir el tag, y NO en la base: el dato de la
// agencia no se toca y si mañana esos tours se borran, no quedó nada que limpiar.
//
// Las 5 nuestras no tienen CDN que recorte. Quedan como están: con 1310 de ancho
// la tarjeta sale grande, solo que recortada por la relación 4:3. Generar una
// variante 1200x630 en build es posible y no vale la pena por cinco imágenes.
function portadaOg(url: string | null): { url: string; recortada: boolean } {
  if (!url) return { url: "", recortada: false };
  try {
    const u = new URL(url);
    // Por HOSTNAME, no por regex sobre la URL entera. El primer intento usó
    // /(^|\.)images\.unsplash\.com\// y no matcheaba NUNCA, porque el host viene
    // después de "//" y no de un punto ni del inicio. No falló ruidosamente: las
    // 37 portadas salieron sin reescribir y el conteo lo cazó.
    if (u.hostname !== "images.unsplash.com") return { url, recortada: false };
    u.searchParams.set("w", "1200");
    u.searchParams.set("h", "630");
    u.searchParams.set("fit", "crop");
    return { url: u.toString(), recortada: true };
  } catch {
    return { url, recortada: false };
  }
}

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
      select: {
        id: true, title: true, city: true, region: true,
        shortPitch: true, description: true, imageUrl: true,
      },
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
    const url = `${ORIGEN}${BASE_PATH}/tour/${seg}`;
    const tit = esc(titulo(t));
    const desc = esc(descripcion(t));
    const og = portadaOg(t.imageUrl);
    const img = esc(og.url);
    const bloque = [
      `    <title>${tit}</title>`,
      `    <meta name="description" content="${desc}">`,
      `    <link rel="canonical" href="${url}" data-prerender="1">`,
      `    <meta property="og:type" content="article">`,
      `    <meta property="og:site_name" content="Finde">`,
      `    <meta property="og:locale" content="es_PE">`,
      `    <meta property="og:url" content="${url}">`,
      `    <meta property="og:title" content="${tit}">`,
      `    <meta property="og:description" content="${desc}">`,
      img ? `    <meta property="og:image" content="${img}">` : "",
      // width/height SOLO cuando nosotros fijamos el recorte. Declararlos en las
      // del bucket sería mentir: miden 1310x983, no 1200x630, y una dimensión
      // declarada que no coincide hace que el crawler renderice mal o la ignore.
      // Sin el tag, el crawler mide la imagen y acierta.
      og.recortada ? `    <meta property="og:image:width" content="1200">` : "",
      og.recortada ? `    <meta property="og:image:height" content="630">` : "",
      `    <meta name="twitter:card" content="summary_large_image">`,
      NOINDEX ? `    <meta name="robots" content="noindex" data-prerender="1">` : "",
    ].filter(Boolean).join("\n");
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
