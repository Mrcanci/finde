// src/lib/routes.js
// El mapa entre URLs y vistas del demo, y el ÚNICO lugar donde vive el prefijo.
//
// POR QUÉ ESTE ARCHIVO EXISTE. La decisión del 2026-08-15 (docs/decisiones.md)
// dice que /demo se queda hasta el lanzamiento pero que el switch a la raíz
// tiene que ser un cambio mínimo y reversible. Eso solo es cierto si el prefijo
// es UNA constante: si estuviera repartido en veinte archivos, el día del
// lanzamiento sería una migración en vez de una línea.
//
// REGLA: ningún otro archivo escribe "/demo" ni "/tour" a mano. Todo link
// interno se arma con toPath() o href().
//
// Funciones puras, sin React y sin dependencias: se pueden probar solas.

// El prefijo. El día del switch esto pasa a "" y es el cambio de una línea.
// El otro lugar que hay que tocar ese día es el rewrite catch-all de
// vercel.json, que hoy no hace falta porque /demo/:path* ya cubre todo.
/**
 * @type {string} Anotado como string a propósito, no como el literal "/demo".
 * Sin esto TypeScript lo infiere como tipo literal y marca cualquier
 * comparación contra "" como código muerto, cuando es exactamente lo que va a
 * pasar el día del switch.
 */
export const BASE_PATH = "/demo";

// Caracteres del CUID que se usan como sufijo. Seis, y el número está medido:
// solo los últimos 8 caracteres de un CUID v1 son aleatorios (del noveno en
// adelante empieza la huella de máquina, que es casi constante entre
// registros). Con 6, la probabilidad de colisión llega al 1% recién a los 6.615
// tours. Ver docs/decisiones.md.
export const SUFFIX_LEN = 6;

// Largo máximo del slug. Cincuenta, y también está medido: con 40 se cortan 15
// de los 42 títulos reales y lo que se pierde es EL DESTINO (arequipa, america,
// tarapoto, chinchero), que es justo la palabra por la que alguien busca. Con
// 50 se corta uno solo y pierde "muelle".
export const SLUG_MAX = 50;

const SUFFIX_RE = /^[a-z0-9]{6}$/;

// Normaliza un texto a slug: minúsculas, sin tildes, ñ a n, todo lo que no sea
// [a-z0-9] a guion, guiones colapsados y sin guiones en los bordes.
export function slugify(text) {
  return (text || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ñ/gi, "n")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Recorta al tope sin partir palabras: corta en el último guion, salvo que eso
// deje menos del 60% del tope (caso de una sola palabra larguísima), donde se
// corta duro.
export function truncateSlug(slug, max = SLUG_MAX) {
  if (slug.length <= max) return slug;
  const cut = slug.slice(0, max);
  const i = cut.lastIndexOf("-");
  return i > max * 0.6 ? cut.slice(0, i) : cut;
}

// El slug de un tour, con los dos niveles de respaldo.
//
// Un título puede normalizar a NADA, y no solo si es basura como "..." o "###":
// un título en alfabeto no latino ("日本ツアー") también queda vacío, y el quechua
// es promesa de marca de Finde. Por eso hay respaldo por CIUDAD, que además
// conserva una palabra clave, y recién después el literal "tour".
export function tourSlug(tour) {
  const porTitulo = truncateSlug(slugify(tour?.title));
  if (porTitulo) return porTitulo;
  const porCiudad = truncateSlug(slugify(tour?.city || tour?.location));
  if (porCiudad) return porCiudad;
  return "tour";
}

export function suffixOf(id) {
  return typeof id === "string" ? id.slice(-SUFFIX_LEN) : "";
}

// El segmento de una ficha: "<slug>-<sufijo>".
export function tourSegment(tour) {
  return `${tourSlug(tour)}-${suffixOf(tour?.id)}`;
}

// Lee un segmento de ficha y devuelve { slug, suffix }, o null si no es válido.
//
// La regla es "todo lo que va después del ÚLTIMO guion", y si no hay guion, el
// segmento entero. Así resuelven los tres casos posibles:
//   /tour/laguna-humantay-full-day-abc123  -> abc123
//   /tour/cusco-abc123                     -> abc123   (respaldo por ciudad)
//   /tour/abc123                           -> abc123   (sin slug)
export function parseTourSegment(segment) {
  if (typeof segment !== "string" || !segment) return null;
  const i = segment.lastIndexOf("-");
  const suffix = i === -1 ? segment : segment.slice(i + 1);
  const slug = i === -1 ? "" : segment.slice(0, i);
  if (!SUFFIX_RE.test(suffix)) return null;
  return { slug, suffix };
}

// El mapa. El orden importa: las rutas sin parámetro se prueban antes que las
// que tienen uno en la misma posición.
const ROUTES = [
  { view: "home", segs: [] },
  { view: "catalog", segs: ["buscar"] },
  { view: "login", segs: ["entrar"] },
  { view: "welcome", segs: ["bienvenido"] },
  { view: "notifications", segs: ["notificaciones"] },
  { view: "profile", segs: ["perfil"] },
  { view: "trips", segs: ["mis-reservas"] },
  { view: "trip-detail", segs: ["mis-reservas", ":code"] },
  { view: "dashboard", segs: ["panel"] },
  { view: "new-tour", segs: ["panel", "tour", "nuevo"] },
  { view: "detail", segs: ["tour", ":seg"] },
  { view: "booking", segs: ["reservar", ":seg"] },
  { view: "not-found", segs: ["no-encontrado"] },
];

function splitPath(pathname) {
  let p = pathname || "/";
  if (BASE_PATH && (p === BASE_PATH || p.startsWith(BASE_PATH + "/"))) {
    p = p.slice(BASE_PATH.length) || "/";
  }
  return p.split("/").filter(Boolean).map(decodeURIComponent);
}

// URL -> { view, params }. Nunca lanza: lo que no matchea cae en not-found.
export function fromPath(pathname) {
  const segs = splitPath(pathname);
  for (const r of ROUTES) {
    if (r.segs.length !== segs.length) continue;
    const params = {};
    let ok = true;
    for (let i = 0; i < r.segs.length; i++) {
      const pat = r.segs[i];
      if (pat.startsWith(":")) params[pat.slice(1)] = segs[i];
      else if (pat !== segs[i]) { ok = false; break; }
    }
    if (!ok) continue;
    // Una ficha con sufijo mal formado no es una ficha: es un 404.
    if ((r.view === "detail" || r.view === "booking") && !parseTourSegment(params.seg)) {
      return { view: "not-found", params: {} };
    }
    return { view: r.view, params };
  }
  return { view: "not-found", params: {} };
}

// { view, params } -> URL con el prefijo puesto. Es lo que usan go() y href().
export function toPath(view, params = {}) {
  const r = ROUTES.find((x) => x.view === view) || ROUTES.find((x) => x.view === "not-found");
  const segs = r.segs.map((s) => {
    if (!s.startsWith(":")) return s;
    const key = s.slice(1);
    // params.tour es el atajo cómodo: se pasa el tour y acá se arma el segmento.
    if (key === "seg" && params.tour) return tourSegment(params.tour);
    return encodeURIComponent(params[key] ?? "");
  });
  return `${BASE_PATH}/${segs.join("/")}`.replace(/\/+$/, "") || BASE_PATH || "/";
}

// Para los <a href> reales, que es lo que permite copiar el link y que Google
// lo siga. Hoy la app navega con onClick; esto queda listo para cuando las
// tarjetas pasen a ser enlaces de verdad.
export function href(view, params) {
  return toPath(view, params);
}

// La URL canónica de una ficha, para comparar contra la que llegó.
export function canonicalTourPath(tour) {
  return toPath("detail", { tour });
}

// Acá vivía PUBLIC_VIEWS, la lista de vistas que un deep link podía abrir sin
// sesión. Existía porque la tanda 2 abrió los links compartidos pero no la
// navegación: había que distinguir "llegué por un link" de "entré a /demo". La
// tanda 3 abrió la navegación entera, así que esa distinción dejó de existir y
// la única lista que queda es GUEST_VIEWS, en src/AppDemo.jsx.
