// lib/tour-publish.js
// La condición para que un tour pueda estar PUBLICADO, en un solo lugar.
//
// LA REGLA: un tour no puede estar en `active=true` sin su metadata mínima, y
// eso se valida en el punto donde `active` pasa a true, venga por donde venga.
//
// ESTE ARCHIVO LO IMPORTAN LOS DOS LADOS:
//   · el backend, para la guarda real (lib/tour-input.ts arma el schema del
//     formulario con estos números; api/tours/[id].ts bloquea el PATCH)
//   · el frontend, para apagar el interruptor del panel antes de que la agencia
//     lo apriete (src/AppDemo.jsx)
//
// POR QUÉ ES UN .js SIN DEPENDENCIAS, Y POR QUÉ VIVE EN lib/. Está medido, no
// supuesto (2026-08-17):
//   · Sin imports. Si importara zod o Prisma, meterlos en el bundle del
//     navegador sería inaceptable, y es lo que impedía compartir la condición
//     desde lib/tour-input.ts.
//   · JavaScript plano con tipos en JSDoc, para que lo coman las dos cadenas de
//     herramientas sin configuración: Vite lo empaqueta y `tsc` lo acepta.
//   · En lib/ y no en src/ a propósito. Así el lado que no perdona (la función
//     serverless) hace un import normal de la carpeta de al lado, y el que cruza
//     carpetas es Vite. Verificado con `vercel build`: el archivo viaja DENTRO
//     del bundle desplegado, en api/tours/[id].func/lib/tour-publish.js.
//
// NO COPIES ESTOS NÚMEROS A NINGÚN LADO. Es el error que ya mordió tres veces
// (la lista blanca de mapTourFromApi, takeSeats contra addRequestedSeats, y la
// guarda del formulario contra la de activar). Ver `.claude/rules/api-y-schema.md`.

export const PITCH_MIN = 40;
export const PITCH_MAX = 80;
export const DESC_MIN = 300;

/**
 * Lo que le falta a un tour para poder estar publicado.
 *
 * OJO CON LOS NOMBRES DE LOS CAMPOS. El backend los tiene como `shortPitch`,
 * `description` e `imageUrl`, pero **la tarjeta del panel llama `image` a la
 * portada**: el objeto pasa por dos mapeos y ese nombre no vuelve. Por eso esta
 * función pide los tres explícitos y cada llamador arma el argumento. Un
 * `imageUrl` que llega undefined no da error: reporta "falta la foto" sobre un
 * tour que sí la tiene, que es peor porque parece un dato.
 *
 * @param {{ shortPitch: string | null, description: string | null, imageUrl: string | null }} t
 * @returns {string[]} Lista de lo que falta. Vacía = el tour puede publicarse.
 */
export function faltaParaPublicar(t) {
  const falta = [];
  const gancho = (t?.shortPitch || "").trim();
  const cuerpo = (t?.description || "").trim();
  // Se enumeran TODAS las condiciones, sin cortar en la primera: un tour puede
  // fallar las tres a la vez y la agencia tiene que verlas juntas, no de a una
  // por intento.
  if (gancho.length < PITCH_MIN || gancho.length > PITCH_MAX) {
    falta.push(`la frase de gancho, de ${PITCH_MIN} a ${PITCH_MAX} caracteres (paso 4)`);
  }
  if (cuerpo.length < DESC_MIN) {
    falta.push(`una descripción de al menos ${DESC_MIN} caracteres (paso 4)`);
  }
  if (!t?.imageUrl) {
    falta.push("la foto de portada (paso 1)");
  }
  return falta;
}

/**
 * El mensaje del servidor, cuando alguien intenta activar y no puede.
 * @param {string[]} falta
 * @returns {string}
 */
export function mensajeFaltaParaPublicar(falta) {
  const lista =
    falta.length === 1
      ? falta[0]
      : `${falta.slice(0, -1).join(", ")} y ${falta[falta.length - 1]}`;
  return `Para publicar este tour falta ${lista}. Edítalo, completa lo que falte y vuelve a activarlo.`;
}
