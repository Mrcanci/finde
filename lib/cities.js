// lib/cities.js
// LA ÚNICA definición de cómo se agrupan los tours por ubicación y de cómo se
// resuelve la ubicación del visitante.
//
// ── POR QUÉ ESTE ARCHIVO EXISTE ─────────────────────────────────────────────
// Hasta el 2026-08-19 la lista de ciudades estaba escrita TRES veces y las tres
// eran distintas (lib/geo.ts y dos listas separadas dentro de src/AppDemo.jsx).
// Ninguna tenía Cajamarca, y por eso un viajero en Cajamarca veía tours de Lima.
// El registro completo está en `docs/audits/2026-08-19-ciudad-no-detectada.md`.
//
// ── POR QUÉ AHORA SON DEPARTAMENTOS Y NO UNA LISTA DE CIUDADES ──────────────
// La lista de nueve ciudades escrita a mano quedaba corta cada vez que entraba
// una agencia nueva: con 42 tours activos ya dejaba SIETE fuera de todo grupo, y
// cinco eran de MEGATOURS, la única agencia piloto real. Su catálogo entero era
// invisible en la única sección que ordena tours por ubicación.
//
// Se evaluaron tres salidas, medidas sobre esos 42 tours:
//
//   agregar las que faltaban a mano  12 grupos | 0 sucios | UNA EDICIÓN POR
//                                                           AGENCIA NUEVA
//   derivar de las CIUDADES con tours 18 grupos | 1 sucio  | cero
//   derivar del DEPARTAMENTO          12 grupos | 0 sucios | cero, y para siempre
//
// Ganó el departamento. Derivar de las ciudades hereda la calidad del dato: uno
// de los 18 grupos ya nacía roto (`"Huacachina, Ica"`, con la coma del campo de
// texto libre metida adentro de la ciudad) y fragmentaba destinos que el viajero
// piensa juntos, partiendo Cusco en Cusco, Ollantaytambo y Pisac.
//
// Los departamentos del Perú, en cambio, no se agregan cuando entra una agencia.
// Con eso la lista deja de ser una lista: los grupos salen de los tours que
// existen, y el mapeo de la IP es una tabla que se escribe una vez.
//
// ── SIN UN SOLO IMPORT, Y ES DELIBERADO ────────────────────────────────────
// Lo consumen los dos lados: las funciones serverless de /api y el navegador. Si
// acá entrara zod, Prisma o cualquier cosa de Node, el frontend arrastraría todo
// al bundle y la única salida sería volver a copiar la lista, que es el error
// que este archivo existe para evitar. Ver `.claude/rules/api-y-schema.md`,
// sección de lib/tour-publish.js.
//
// EL DÍA QUE EL FORMULARIO DE TOUR TENGA SELECTOR DE DEPARTAMENTO en vez del
// campo Ubicación de texto libre, LA LISTA DE ESE SELECTOR TIENE QUE SER
// `DEPARTMENTS` DE ACÁ. Si se escribe otra, se crea la cuarta copia por otra
// puerta, y esta vez con la excusa de que es "la del formulario".

/**
 * Los 26 códigos ISO 3166-2:PE con su departamento. Verificado contra la norma,
 * no escrito de memoria.
 *
 * TRES CÓDIGOS CAEN EN LIMA, y esto NO se habría adivinado: la norma separa
 * `LIM` (departamento de Lima), `LMA` (Municipalidad Metropolitana de Lima) y
 * `CAL` (El Callao). Para un buscador de tours los tres son Lima.
 *
 * De dónde sale que Vercel manda esto: `x-vercel-ip-country-region` trae "the
 * region-portion of the ISO 3166-2 code". Medido de verdad UNA vez, el
 * 2026-08-19, con José en Lima: llegó `"ARE"`.
 * @type {Record<string, string>}
 */
export const DEPARTMENT_BY_ISO = {
  AMA: "Amazonas",
  ANC: "Áncash",
  APU: "Apurímac",
  ARE: "Arequipa",
  AYA: "Ayacucho",
  CAJ: "Cajamarca",
  CAL: "Lima", // El Callao
  CUS: "Cusco",
  HUC: "Huánuco",
  HUV: "Huancavelica",
  ICA: "Ica",
  JUN: "Junín",
  LAL: "La Libertad",
  LAM: "Lambayeque",
  LIM: "Lima",
  LMA: "Lima", // Municipalidad Metropolitana de Lima
  LOR: "Loreto",
  MDD: "Madre de Dios",
  MOQ: "Moquegua",
  PAS: "Pasco",
  PIU: "Piura",
  PUN: "Puno",
  SAM: "San Martín",
  TAC: "Tacna",
  TUM: "Tumbes",
  UCA: "Ucayali",
};

/** Los 25 departamentos más Callao, sin repetir. @type {readonly string[]} */
export const DEPARTMENTS = [...new Set(Object.values(DEPARTMENT_BY_ISO))];

/**
 * EL NOMBRE QUE VE EL VIAJERO, cuando el departamento no es como se llama al
 * destino. Solo estos seis: en el resto el departamento y la ciudad coinciden.
 *
 * NO ES PREFERENCIA, SALE DE LOS DATOS. En los seis casos la agencia que cargó
 * el tour eligió la ciudad y no el departamento en el campo de ubicación:
 *
 *   Amazonas      -> "Chachapoyas"        Áncash        -> "Huaraz"
 *   La Libertad   -> "Trujillo" (x2)      Loreto        -> "Iquitos"
 *   Madre de Dios -> "Puerto Maldonado"   San Martín    -> "Tarapoto"
 *
 * Seis de seis. Y en Amazonas hay una razón extra y más fuerte: en el catálogo
 * la palabra "Amazonas" aparece en el título de un tour de LORETO ("Iquitos
 * Amazonas 3 días en lodge selvático"), porque en Perú "el Amazonas" es la
 * selva antes que un departamento. Como etiqueta se confundiría con el otro.
 * @type {Record<string, string>}
 */
export const DEPARTMENT_DISPLAY = {
  Amazonas: "Chachapoyas",
  "Áncash": "Huaraz",
  "La Libertad": "Trujillo",
  Loreto: "Iquitos",
  "Madre de Dios": "Puerto Maldonado",
  "San Martín": "Tarapoto",
};

/**
 * Cómo se llama un departamento en pantalla.
 * @param {string} department
 * @returns {string}
 */
export function displayName(department) {
  return DEPARTMENT_DISPLAY[department] || department;
}

/**
 * Ciudades y distritos conocidos → su departamento. Es el RESPALDO para cuando
 * la IP no trae código ISO, y además lo que permite que un tour aparezca en el
 * grupo de la ciudad DESDE LA QUE SALE aunque ocurra en otro departamento (ver
 * `toursByDepartment`).
 * @type {Record<string, string>}
 */
export const CITY_TO_DEPARTMENT = {
  Lima: "Lima", Miraflores: "Lima", "San Isidro": "Lima", Barranco: "Lima",
  Surco: "Lima", "La Molina": "Lima", Callao: "Lima", Chorrillos: "Lima",
  "San Borja": "Lima", Magdalena: "Lima", "Pueblo Libre": "Lima",
  Chancay: "Lima", "Lunahuaná": "Lima", Marcapomacocha: "Lima",
  Cusco: "Cusco", Cuzco: "Cusco", Ollantaytambo: "Cusco", Pisac: "Cusco",
  Urubamba: "Cusco", Chinchero: "Cusco",
  Arequipa: "Arequipa",
  Trujillo: "La Libertad", Huanchaco: "La Libertad",
  Ica: "Ica", Paracas: "Ica", Huacachina: "Ica", Nazca: "Ica", Chincha: "Ica",
  Pisco: "Ica",
  Iquitos: "Loreto",
  Piura: "Piura", "Máncora": "Piura", "Los Órganos": "Piura", Talara: "Piura",
  Huaraz: "Áncash",
  "Puerto Maldonado": "Madre de Dios", Tambopata: "Madre de Dios",
  Cajamarca: "Cajamarca",
  Chachapoyas: "Amazonas", "Kuélap": "Amazonas",
  Tarapoto: "San Martín",
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
    // decodeURIComponent falla con cadenas mal formadas (ej. "%E0").
  }
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

const CITY_INDEX = (() => {
  /** @type {Record<string, string>} */
  const index = {};
  for (const [city, dep] of Object.entries(CITY_TO_DEPARTMENT)) {
    index[normalizeCity(city)] = dep;
  }
  return index;
})();

const DEPARTMENT_INDEX = (() => {
  /** @type {Record<string, string>} */
  const index = {};
  for (const dep of DEPARTMENTS) index[normalizeCity(dep)] = dep;
  return index;
})();

/** El departamento de una ciudad conocida, o null. @returns {string | null} */
export function departmentOfCity(city) {
  return CITY_INDEX[normalizeCity(city)] || null;
}

/**
 * Resuelve el departamento del visitante a partir de la geo IP.
 *
 * EL ORDEN IMPORTA Y NO ES EL DE ANTES. Primero el CÓDIGO ISO, que es una tabla
 * cerrada de 26 entradas que cubre el país entero y no cambia nunca. Recién
 * después el nombre de ciudad, que es un respaldo por si el código no viene.
 *
 * La versión anterior probaba la región DESPUÉS de la ciudad y comparaba el
 * código ISO contra nombres de ciudad: de los 25 códigos acertaba UNO, "ICA", y
 * solo por coincidencia ortográfica. Ver `.claude/rules/metodo.md`, punto 6.
 *
 * OJO CON LO QUE ESTO NO ARREGLA. Resuelve la COBERTURA, no la PRECISIÓN. Si la
 * IP dice Arequipa estando el viajero en Lima, el código ISO dice "ARE" y se
 * equivoca igual: los dos salen de la misma consulta. Está medido el 2026-08-19.
 * Por eso el título de la sección no afirma ubicación.
 *
 * @param {string | undefined | null} rawCity
 * @param {string | undefined | null} rawRegion
 * @param {string | undefined | null} country
 * @returns {{ department: string, reason: "iso" | "city" | "non_pe" | "unmapped" | "no_input" }}
 */
export function mapToDepartment(rawCity, rawRegion, country) {
  const normalizedCountry = normalizeCity(country);
  if (normalizedCountry && normalizedCountry !== "pe") {
    return { department: "Lima", reason: "non_pe" };
  }

  const iso = (rawRegion || "").trim().toUpperCase();
  if (iso && DEPARTMENT_BY_ISO[iso]) {
    return { department: DEPARTMENT_BY_ISO[iso], reason: "iso" };
  }

  // Respaldo 1: el nombre de región, por si algún día no viene como código.
  const normRegion = normalizeCity(rawRegion);
  if (normRegion && DEPARTMENT_INDEX[normRegion]) {
    return { department: DEPARTMENT_INDEX[normRegion], reason: "city" };
  }

  // Respaldo 2: la ciudad.
  const porCiudad = departmentOfCity(rawCity);
  if (porCiudad) return { department: porCiudad, reason: "city" };

  const normCity = normalizeCity(rawCity);
  if (normCity && DEPARTMENT_INDEX[normCity]) {
    return { department: DEPARTMENT_INDEX[normCity], reason: "city" };
  }

  if (!normCity && !normRegion) {
    return { department: "Lima", reason: "no_input" };
  }
  return { department: "Lima", reason: "unmapped" };
}

/**
 * Los departamentos que TIENEN tours, en orden de cuántos tienen. Acá es donde
 * la lista deja de estar escrita a mano: sale de los tours que existen.
 * @param {{ region?: string, city?: string }[]} tours
 * @returns {string[]}
 */
export function departmentsWithTours(tours) {
  /** @type {Record<string, number>} */
  const cuenta = {};
  for (const t of tours || []) {
    for (const d of departmentsOfTour(t)) cuenta[d] = (cuenta[d] || 0) + 1;
  }
  return Object.keys(cuenta).sort((a, b) => cuenta[b] - cuenta[a] || a.localeCompare(b));
}

/**
 * A qué departamentos pertenece un tour. Son DOS y no uno, a propósito:
 *
 *   1. Donde OCURRE, que es `region`.
 *   2. Desde donde SALE, si su ciudad es de otro departamento.
 *
 * El caso real que obliga a esto: "Manu: parque nacional virgen 4 días" tiene
 * `region: "Madre de Dios"` y `city: "Cusco"`, porque el viaje sale de Cusco.
 * Agrupando solo por región desaparecería del grupo Cusco, donde hoy aparece y
 * donde tiene sentido que aparezca: el viajero que está en Cusco puede tomarlo.
 * @param {{ region?: string, city?: string }} tour
 * @returns {string[]}
 */
export function departmentsOfTour(tour) {
  const out = [];
  const porRegion = tour?.region ? DEPARTMENT_INDEX[normalizeCity(tour.region)] : null;
  if (porRegion) out.push(porRegion);
  const porCiudad = departmentOfCity(tour?.city);
  if (porCiudad && !out.includes(porCiudad)) out.push(porCiudad);
  return out;
}

/**
 * Los tours de un departamento.
 * @template {{ region?: string, city?: string }} T
 * @param {T[]} tours
 * @param {string} department
 * @returns {T[]}
 */
export function toursByDepartment(tours, department) {
  return (tours || []).filter((t) => departmentsOfTour(t).includes(department));
}

/**
 * Tabla para el buscador local por palabras de `searchTours`: ahí se busca el
 * nombre del lugar DENTRO de la consulta que escribió el usuario, que ya viene
 * en minúscula, y después se filtra por `location`.
 *
 * Cada entrada acepta el departamento Y el nombre que se muestra, porque el
 * viajero escribe "iquitos", no "loreto". Los valores son los textos que pueden
 * aparecer dentro de `location`.
 *
 * Antes esto era una tercera lista escrita a mano, con Apurímac (que no tiene un
 * solo tour) y sin Trujillo, Iquitos ni Puerto Maldonado.
 * @type {Record<string, readonly string[]>}
 */
export const QUERY_DEPT_ALIASES = (() => {
  /** @type {Record<string, readonly string[]>} */
  const out = {};
  for (const dep of DEPARTMENTS) {
    const nombres = new Set([dep, displayName(dep)]);
    for (const [city, d] of Object.entries(CITY_TO_DEPARTMENT)) {
      if (d === dep) nombres.add(city);
    }
    const lista = [...nombres];
    out[normalizeCity(dep)] = lista;
    const visible = normalizeCity(displayName(dep));
    if (visible !== normalizeCity(dep)) out[visible] = lista;
  }
  return out;
})();
