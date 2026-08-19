// lib/cities.js
// LA ÚNICA definición de las ciudades soportadas, sus alias y cómo se matchean.
//
// POR QUÉ ESTE ARCHIVO EXISTE. Hasta el 2026-08-19 esta lista estaba escrita
// TRES veces, y las tres eran distintas entre sí:
//
//   1. lib/geo.ts            SUPPORTED_CITIES + CITY_ALIASES  (el backend)
//   2. src/AppDemo.jsx       SUPPORTED_CITIES + SUPPORTED_CITY_ALIASES
//                            (el selector y el filtro del carrusel)
//   3. src/AppDemo.jsx       CITY_ALIASES, otra lista más chica, con las claves
//                            en minúscula y sin Trujillo, Iquitos ni Puerto
//                            Maldonado, pero con Apurímac, que no tiene tours
//
// Ninguna de las tres tenía Cajamarca, y por eso un viajero en Cajamarca veía
// tours de Lima (ver docs/audits/2026-08-19-ciudad-no-detectada.md). Agregarla
// en un solo lugar habría dejado las otras dos mintiendo.
//
// Es el mismo patrón que ya costó cuatro veces en este repo: mapTourFromApi,
// takeSeats, la condición de publicar y el objeto del panel. La forma de
// cerrarlo es la misma que se usó para la condición de publicar.
//
// SIN UN SOLO IMPORT, Y ES DELIBERADO. Lo consumen los dos lados: las funciones
// serverless de /api y el navegador. Si acá adentro entrara zod, Prisma o
// cualquier cosa de Node, el frontend arrastraría todo eso al bundle y la única
// salida sería volver a copiar la lista, que es exactamente el error que este
// archivo existe para evitar. El precedente y el porqué completo están en
// `.claude/rules/api-y-schema.md`, sección de lib/tour-publish.js.
//
// EL DÍA QUE EL FORMULARIO DE TOUR TENGA SELECTOR DE CIUDAD Y REGIÓN en vez del
// campo Ubicación de texto libre, LA LISTA DE ESE SELECTOR TIENE QUE SER ESTA.
// Si se escribe otra, se crea la cuarta copia por otra puerta, y esta vez con la
// excusa de que es "la del formulario".

/**
 * Las ciudades soportadas por el carrusel "Tours en [ciudad]", en orden de
 * tráfico turístico.
 * @type {readonly string[]}
 */
export const SUPPORTED_CITIES = [
  "Lima",
  "Cusco",
  "Arequipa",
  "Trujillo",
  "Ica",
  "Iquitos",
  "Piura",
  "Huaraz",
  "Puerto Maldonado",
];

/**
 * Alias → ciudad canónica. Incluye distritos de Lima, variantes ortográficas
 * (Cuzco) y subdestinos turísticos de la región (Máncora → Piura, Paracas →
 * Ica). Sirve para dos trabajos distintos: mapear la ciudad que reporta la IP a
 * una ciudad soportada, y agrupar tours cuya ubicación es un subdestino.
 * @type {Record<string, readonly string[]>}
 */
export const CITY_ALIASES = {
  Lima: [
    "Lima",
    "Miraflores",
    "San Isidro",
    "Barranco",
    "Surco",
    "La Molina",
    "Callao",
    "Chorrillos",
    "San Borja",
    "Magdalena",
    "Pueblo Libre",
    "Chancay",
    "Lunahuaná",
    "Marcapomacocha",
  ],
  Cusco: ["Cusco", "Cuzco"],
  Arequipa: ["Arequipa"],
  Trujillo: ["Trujillo"],
  Ica: ["Ica", "Paracas", "Huacachina", "Nazca", "Chincha"],
  Iquitos: ["Iquitos"],
  Piura: ["Piura", "Máncora", "Los Órganos", "Talara"],
  Huaraz: ["Huaraz"],
  "Puerto Maldonado": ["Puerto Maldonado", "Tambopata"],
};

/**
 * Normaliza para comparar: decodifica URL-encoding, separa diacríticos, los
 * elimina, baja a minúsculas y recorta.
 * @param {string | undefined | null} raw
 * @returns {string}
 */
export function normalizeCity(raw) {
  if (!raw) return "";
  let value = raw;
  try {
    value = decodeURIComponent(raw);
  } catch {
    // decodeURIComponent falla con cadenas mal formadas (ej. "%E0"): se usa el
    // raw tal cual.
  }
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

// Índice inverso normalizado, computado una sola vez al cargar el módulo.
const NORMALIZED_ALIAS_INDEX = (() => {
  /** @type {Record<string, string>} */
  const index = {};
  for (const city of SUPPORTED_CITIES) {
    for (const alias of CITY_ALIASES[city]) {
      index[normalizeCity(alias)] = city;
    }
  }
  return index;
})();

/**
 * Resuelve la ciudad soportada a partir de la geo IP.
 *
 * OJO CON LA RAMA POR REGIÓN: hoy es casi código muerto y no por diseño. El
 * header `x-vercel-ip-country-region` trae el CÓDIGO ISO 3166-2 ("CAJ", "LIM",
 * "CUS"), y acá se lo compara contra alias que son NOMBRES de ciudad. De los 25
 * códigos del Perú matchea uno solo, "ICA", y únicamente porque el código se
 * escribe igual que la ciudad. Ver la nota en `.claude/rules/metodo.md`.
 *
 * @param {string | undefined | null} rawCity
 * @param {string | undefined | null} rawRegion
 * @param {string | undefined | null} country
 * @returns {{ city: string, reason: "matched" | "non_pe" | "unmapped" | "no_input" }}
 */
export function mapToSupportedCity(rawCity, rawRegion, country) {
  const normalizedCountry = normalizeCity(country);
  if (normalizedCountry && normalizedCountry !== "pe") {
    return { city: "Lima", reason: "non_pe" };
  }

  const normalizedCity = normalizeCity(rawCity);
  if (normalizedCity && NORMALIZED_ALIAS_INDEX[normalizedCity]) {
    return { city: NORMALIZED_ALIAS_INDEX[normalizedCity], reason: "matched" };
  }

  const normalizedRegion = normalizeCity(rawRegion);
  if (normalizedRegion && NORMALIZED_ALIAS_INDEX[normalizedRegion]) {
    return { city: NORMALIZED_ALIAS_INDEX[normalizedRegion], reason: "matched" };
  }

  if (!normalizedCity && !normalizedRegion) {
    return { city: "Lima", reason: "no_input" };
  }

  return { city: "Lima", reason: "unmapped" };
}

/**
 * Filtra tours cuya `location` contiene (substring, sin tildes y sin distinguir
 * mayúsculas) el nombre canónico o cualquier alias de la ciudad.
 * @template {{ location?: string }} T
 * @param {T[]} tours
 * @param {string} city
 * @returns {T[]}
 */
export function toursByCity(tours, city) {
  const aliases = CITY_ALIASES[city] || [city];
  const normalizedAliases = aliases.map((a) => normalizeCity(a));
  return tours.filter((t) => {
    const loc = normalizeCity(t.location);
    if (!loc) return false;
    return normalizedAliases.some((a) => loc.includes(a));
  });
}

/**
 * La misma tabla, con las claves normalizadas, para el buscador local por
 * palabras de `searchTours`: ahí se busca el nombre de la ciudad DENTRO de la
 * consulta que escribió el usuario, que ya viene en minúscula.
 *
 * Antes esto era una tercera lista escrita a mano. Derivarla cambió dos cosas,
 * las dos medidas y las dos a favor: aparecen Trujillo, Iquitos y Puerto
 * Maldonado, que faltaban, y desaparece Apurímac, que no tiene ni un tour.
 * @type {Record<string, readonly string[]>}
 */
export const QUERY_CITY_ALIASES = (() => {
  /** @type {Record<string, readonly string[]>} */
  const out = {};
  for (const city of SUPPORTED_CITIES) {
    out[normalizeCity(city)] = CITY_ALIASES[city];
  }
  return out;
})();
