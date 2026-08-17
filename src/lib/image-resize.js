// src/lib/image-resize.js
// Achica y recomprime una foto EN EL NAVEGADOR antes de subirla al bucket.
//
// Por qué existe: el plan Free de Supabase da 5 GB de egress al mes y NO cobra
// excedente, restringe. Con portadas sin procesar de 4 MB, 26 visitas al catálogo
// agotan la cuota del mes y la plataforma deja de servir imágenes. Además
// "Storage Image Transformations" no está disponible en ese plan, así que
// achicar del lado del servidor no es una opción: este es el único camino.
// Ver docs/estado.md, "CONDICIÓN PARA QUE LA PLATAFORMA FUNCIONE CON TRÁFICO".
//
// Todo nativo del navegador: createImageBitmap + canvas + toBlob. Cero
// dependencias nuevas y cero peso agregado al bundle.

// Ancho máximo. Sale de dónde se muestran las fotos, no de un número redondo:
// el hero de la ficha en escritorio ocupa ~720 px CSS (a 2x, 1440) y en móvil
// ~390 px CSS (a 3x, 1170). 1600 cubre los dos con margen, y para las tarjetas
// del catálogo (360 px como mucho) sobra.
export const MAX_WIDTH = 1600;

// Calidad JPEG. Medida sobre una foto real de 4.062 kB del bucket: a 1600 px
// queda en ~151 kB, un 96,3% menos.
export const JPEG_QUALITY = 0.82;

// Tope de ENTRADA, para no colgar el navegador decodificando un archivo enorme.
// REEMPLAZA al viejo tope de 5 MB (que era el del bucket), no se suma: como acá
// se achica antes de subir, lo que sale siempre entra holgado en el bucket.
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

// Piso para que la tarjeta de WhatsApp salga GRANDE. Facebook, que es el crawler
// que usa WhatsApp, documenta que por debajo de 600x315 la tarjeta se muestra
// chica. No bloquea nada: el redimensionado nunca agranda, así que una foto de
// 400x300 se sube igual. Solo sirve para avisarle a la agencia.
export const OG_MIN_WIDTH = 600;
export const OG_MIN_HEIGHT = 315;

// Tipos que aceptamos de entrada. Alineado con la config del bucket y con lo que
// promete el formulario.
export const ALLOWED_INPUT_TYPES = ["image/jpeg", "image/png"];

// Errores tipados: el llamador decide el copy, acá no se arma texto de interfaz.
export class ImageTooLargeError extends Error {
  constructor(file) {
    super(`El archivo pesa ${(file.size / 1048576).toFixed(1)} MB`);
    this.name = "ImageTooLargeError";
    this.fileName = file.name;
    this.bytes = file.size;
  }
}

export class ImageTypeError extends Error {
  constructor(file) {
    super(`Tipo no admitido: ${file.type || "desconocido"}`);
    this.name = "ImageTypeError";
    this.fileName = file.name;
  }
}

// Decodifica el archivo a un bitmap con la orientación EXIF YA APLICADA.
//
// `imageOrientation: "from-image"` no es opcional: sin eso, una foto vertical
// sacada con el celular llega al canvas acostada, porque el sensor guarda los
// píxeles en horizontal y la rotación vive en un tag EXIF que el canvas ignora.
// Es el error clásico de este arreglo y solo se ve mirando la foto.
//
// El fallback por <img> existe para navegadores que no soportan el segundo
// argumento de createImageBitmap. Ahí la orientación la resuelve el navegador
// solo: `image-orientation: from-image` es el valor por defecto del CSS desde
// hace años, así que un <img> ya se dibuja derecho.
async function decode(file) {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      /* cae al fallback */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "sync";
    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = () => rej(new Error("No se pudo leer la imagen"));
      img.src = url;
    });
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function toBlobAsync(canvas, type, quality) {
  return new Promise((res, rej) => {
    canvas.toBlob(
      (blob) => (blob ? res(blob) : rej(new Error("No se pudo codificar la imagen"))),
      type,
      quality
    );
  });
}

// Achica y recomprime. Devuelve siempre lo que hay que subir, ya sea el
// resultado o el archivo original si procesarlo no lo mejoraba.
//
// Lanza ImageTooLargeError o ImageTypeError ANTES de decodificar nada.
export async function resizeImageForUpload(file) {
  if (!ALLOWED_INPUT_TYPES.includes(file.type)) throw new ImageTypeError(file);
  if (file.size > MAX_UPLOAD_BYTES) throw new ImageTooLargeError(file);

  const src = await decode(file);
  const srcW = src.width || src.naturalWidth;
  const srcH = src.height || src.naturalHeight;
  if (!srcW || !srcH) {
    if (src.close) src.close();
    throw new Error("La imagen no tiene dimensiones legibles");
  }

  // NUNCA agrandar. Escalar hacia arriba una imagen chica la hace más pesada sin
  // mejorarla: comprobado en la tanda 1C, donde llevar una foto de 540 px a 800
  // la subía de 83 a 108 kB.
  const scale = Math.min(1, MAX_WIDTH / srcW);
  const w = Math.round(srcW * scale);
  const h = Math.round(srcH * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");

  // Fondo blanco ANTES de dibujar. El canvas nace transparente y el JPEG no
  // tiene canal alfa, así que un PNG con transparencia saldría con fondo NEGRO.
  // Se pinta siempre, no solo para PNG: en una foto opaca queda tapado igual.
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(src, 0, 0, w, h);
  if (src.close) src.close();

  const blob = await toBlobAsync(canvas, "image/jpeg", JPEG_QUALITY);
  // Liberar el canvas: en móvil, ocho fotos seguidas dejan memoria retenida.
  canvas.width = 0;
  canvas.height = 0;

  // Si procesar no mejoró nada, se sube el original. Pasa con imágenes que ya
  // vienen chicas y bien comprimidas, donde reencodear solo agrega peso. Misma
  // regla que se aplicó a mano en la tanda 1C.
  if (blob.size >= file.size) {
    return {
      blob: file,
      contentType: file.type,
      width: srcW,
      height: srcH,
      originalBytes: file.size,
      resultBytes: file.size,
      processed: false,
      chicaParaCompartir: srcW < OG_MIN_WIDTH || srcH < OG_MIN_HEIGHT,
    };
  }

  return {
    blob,
    contentType: "image/jpeg",
    width: w,
    height: h,
    originalBytes: file.size,
    resultBytes: blob.size,
    processed: true,
    chicaParaCompartir: w < OG_MIN_WIDTH || h < OG_MIN_HEIGHT,
  };
}
