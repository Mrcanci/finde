// Verifica que el HTML de docs/plantillas-correo-supabase.md no dependa de nada
// que un cliente de correo no soporte, y que no invente variables de Supabase.
//
// NO prueba el render. Eso hay que hacerlo abriendo los correos en Gmail,
// Outlook de Windows y Apple Mail. Este script solo cierra la puerta a los
// errores que SI se pueden detectar leyendo el HTML.
//
//   node scripts/check-plantillas-correo.mjs
import { readFileSync } from "node:fs";

const DOC = "docs/plantillas-correo-supabase.md";
const texto = readFileSync(DOC, "utf8");

// Variables que la documentacion de Supabase declara para Confirm signup,
// Invite user, Magic Link y Reset password. Verificado el 2026-08-18.
const VARS_OK = new Set([
  "ConfirmationURL", "Token", "TokenHash", "SiteURL", "RedirectTo", "Data", "Email",
]);

// Cada regla es [nombre, patron, por que]
const PROHIBIDO = [
  ["elemento <style>", /<style[\s>]/i, "Gmail lo limita al head y Outlook tiene bugs de orden"],
  ["hoja externa <link>", /<link[\s>]/i, "no se cargan hojas externas"],
  ["clases CSS", /\sclass\s*=/i, "sin <style> una clase no aplica nada"],
  ["<script>", /<script[\s>]/i, "ningun cliente ejecuta JavaScript"],
  ["imagen remota", /<img[\s>]/i, "muchos clientes bloquean imagenes hasta que el lector las habilita"],
  ["@font-face", /@font-face/i, "no lo soportan Gmail ni Yahoo"],
  ["@media", /@media/i, "va dentro de <style>, que no se usa"],
  ["display:flex", /display\s*:\s*(inline-)?flex/i, "soporte parcial y roto en cuentas que no son de Google"],
  ["display:grid", /display\s*:\s*(inline-)?grid/i, "sin soporte"],
  ["position", /position\s*:\s*(absolute|fixed|sticky|relative)/i, "sin soporte confiable"],
  ["fuente web", /fonts\.(googleapis|gstatic)\.com/i, "las fuentes web no cargan"],
];

const bloques = [...texto.matchAll(/```html\n([\s\S]*?)```/g)].map(m => m[1]);
if (bloques.length === 0) {
  console.error("FALLO: no se encontro ningun bloque ```html en " + DOC);
  process.exit(1);
}

let fallas = 0;
console.log(`Revisando ${bloques.length} plantillas de ${DOC}\n`);

bloques.forEach((html, i) => {
  const n = i + 1;
  const errores = [];

  for (const [nombre, patron, porque] of PROHIBIDO) {
    if (patron.test(html)) errores.push(`usa ${nombre} (${porque})`);
  }

  // Variables de Supabase: que existan en la lista verificada
  for (const m of html.matchAll(/\{\{\s*\.(\w+)\s*\}\}/g)) {
    if (!VARS_OK.has(m[1])) errores.push(`variable inventada: {{ .${m[1]} }}`);
  }

  // Que el layout sea de tablas y las etiquetas cierren
  const abre = (t) => (html.match(new RegExp(`<${t}[\\s>]`, "gi")) || []).length;
  const cierra = (t) => (html.match(new RegExp(`</${t}>`, "gi")) || []).length;
  for (const t of ["table", "tr", "td", "html", "body"]) {
    if (abre(t) !== cierra(t)) errores.push(`<${t}> abre ${abre(t)} veces y cierra ${cierra(t)}`);
  }
  if (abre("table") === 0) errores.push("no usa tablas para el layout");

  // Que la pila de fuentes termine en algo que Outlook de Windows entienda
  const pilas = [...html.matchAll(/font-family\s*:\s*([^;"]+)/gi)].map(m => m[1].trim());
  if (pilas.length === 0) errores.push("ninguna declaracion de font-family");
  for (const pila of pilas) {
    if (!/\b(arial|helvetica|verdana|georgia|times)\b/i.test(pila)) {
      errores.push(`pila de fuentes sin respaldo clasico: "${pila}"`);
    }
  }

  const usadas = [...new Set([...html.matchAll(/\{\{\s*\.(\w+)\s*\}\}/g)].map(m => m[1]))];
  if (errores.length === 0) {
    console.log(`  Plantilla ${n}: OK  (variables: ${usadas.join(", ") || "ninguna"})`);
  } else {
    fallas += errores.length;
    console.log(`  Plantilla ${n}: ${errores.length} problema(s)`);
    for (const e of errores) console.log(`      - ${e}`);
  }
});

console.log();
if (fallas > 0) {
  console.error(`FALLO: ${fallas} problema(s). El HTML no se pega hasta arreglarlos.`);
  process.exit(1);
}
console.log("Todo OK en lo que se puede verificar leyendo el HTML.");
console.log("LO QUE ESTE SCRIPT NO CUBRE: como dibuja el HTML un cliente real.");
console.log("Al 2026-08-18 solo se probo Invite user, en Gmail. Las otras tres no");
console.log("se pueden disparar todavia, y falta Outlook de Windows y Apple Mail");
console.log("en las cuatro. Ver docs/plantillas-correo-supabase.md.");
