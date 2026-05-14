// lib/geo.ts
// Utilidades de geolocalización IP-based para el feature "Tours en [ciudad]".
// Mapea las cabeceras x-vercel-ip-* (inyectadas por Vercel en producción) a
// una de las 9 ciudades soportadas en orden de tráfico turístico.

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
] as const;

export type SupportedCity = (typeof SUPPORTED_CITIES)[number];

// Mapeo de alias → ciudad canónica. Incluye distritos de Lima, variantes
// ortográficas (Cuzco), y subdestinos turísticos de la región (Máncora →
// Piura, Paracas → Ica, etc.).
export const CITY_ALIASES: Record<SupportedCity, readonly string[]> = {
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

// Normaliza un string para comparación: decodifica URL-encoding, separa
// diacríticos (NFD), los elimina, baja a minúsculas, trim.
export function normalize(raw: string | undefined | null): string {
  if (!raw) return "";
  let value = raw;
  try {
    value = decodeURIComponent(raw);
  } catch {
    // decodeURIComponent puede fallar con cadenas mal formadas (ej. "%E0").
    // En ese caso usamos el raw tal cual.
  }
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

// Índice inverso normalizado: cada alias → ciudad canónica, todo en lowercase
// sin tildes. Lo computamos una sola vez al cargar el módulo.
const NORMALIZED_ALIAS_INDEX: Record<string, SupportedCity> = (() => {
  const index: Record<string, SupportedCity> = {};
  for (const city of SUPPORTED_CITIES) {
    for (const alias of CITY_ALIASES[city]) {
      index[normalize(alias)] = city;
    }
  }
  return index;
})();

export type MapResult = {
  city: SupportedCity;
  reason: "matched" | "non_pe" | "unmapped" | "no_input";
};

// Resuelve la ciudad soportada a partir de la geo IP. Reglas:
//   1. Si país !== PE (no vacío) → Lima fallback (non_pe).
//   2. Match exacto del rawCity normalizado contra el índice de alias.
//   3. Match exacto del rawRegion normalizado contra el índice de alias.
//   4. Caso contrario → Lima fallback (unmapped).
// Si no hay rawCity ni rawRegion y país es PE o vacío → Lima (no_input).
export function mapToSupportedCity(
  rawCity: string | undefined | null,
  rawRegion: string | undefined | null,
  country: string | undefined | null
): MapResult {
  const normalizedCountry = normalize(country);
  if (normalizedCountry && normalizedCountry !== "pe") {
    return { city: "Lima", reason: "non_pe" };
  }

  const normalizedCity = normalize(rawCity);
  if (normalizedCity && NORMALIZED_ALIAS_INDEX[normalizedCity]) {
    return {
      city: NORMALIZED_ALIAS_INDEX[normalizedCity],
      reason: "matched",
    };
  }

  const normalizedRegion = normalize(rawRegion);
  if (normalizedRegion && NORMALIZED_ALIAS_INDEX[normalizedRegion]) {
    return {
      city: NORMALIZED_ALIAS_INDEX[normalizedRegion],
      reason: "matched",
    };
  }

  if (!normalizedCity && !normalizedRegion) {
    return { city: "Lima", reason: "no_input" };
  }

  return { city: "Lima", reason: "unmapped" };
}

// Filtra un array de tours donde tour.location incluye (substring,
// case-insensitive y sin tildes) el nombre canónico o cualquier alias de la
// ciudad. El frontend usa esto para poblar el carrusel "Tours en [ciudad]".
export function toursByCity<T extends { location?: string }>(
  tours: T[],
  city: SupportedCity
): T[] {
  const aliases = CITY_ALIASES[city];
  const normalizedAliases = aliases.map((a) => normalize(a));
  return tours.filter((t) => {
    const loc = normalize(t.location);
    if (!loc) return false;
    return normalizedAliases.some((a) => loc.includes(a));
  });
}
