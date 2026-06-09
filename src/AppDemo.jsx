import { useState, useEffect, useRef, useCallback } from "react";
import { Sparkles, Mountain, Landmark, UtensilsCrossed, Trees, Bell, User, BarChart3, Compass, Search, Ticket, Star, MapPin, Timer, ArrowUp, Users, Dumbbell, Check, X, ChevronLeft, ChevronRight, ChevronDown, ArrowLeft, ArrowRight, Bot, CheckCircle, Clock, Tag, Languages, ShieldCheck, Building2, Smartphone, MessageCircle, Camera, MountainSnow, Hand, FileText, Pencil, HelpCircle, Heart, Home, Calendar, Eye, EyeOff, Info, Trash2, Lock } from "lucide-react";
import { useAuth } from "./contexts/AuthContext.jsx";
import { authFetch } from "./lib/authFetch.js";
import { supabase } from "./lib/supabase.js";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FINDE v3 — AI-Native Marketplace
// Búsqueda semántica · AI Content Creator · Quechua · Anti-overtourism
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const CATS = [
  { id: "all", n: "Todos", ic: Sparkles },
  { id: "adventure", n: "Aventura", ic: Mountain },
  { id: "culture", n: "Cultura", ic: Landmark },
  { id: "gastro", n: "Gastronomía", ic: UtensilsCrossed },
  { id: "nature", n: "Naturaleza", ic: Trees },
  { id: "mystic", n: "Místico", ic: Compass },
];

// Reglas v1.2 §3.2 — Cuatro políticas oficiales. Default = Flexible.
const CANCEL_POLICIES = {
  flexible: {
    label: "Flexible",
    short: "Cancelación gratuita hasta 24h antes del tour. Sin reembolso con menos de 24h.",
  },
  moderada: {
    label: "Moderada",
    short: "100% de reembolso si cancelas con 72h o más. 50% entre 72h y 24h. Sin reembolso con menos de 24h.",
  },
  estricta: {
    label: "Estricta",
    short: "100% si cancelas con 30+ días. 50% entre 15 y 30 días. Sin reembolso con menos de 15 días.",
  },
  no_reembolsable: {
    label: "No reembolsable",
    short: "Sin reembolso desde el momento del pago, salvo cancelación por la agencia o fuerza mayor.",
  },
};
const getCancelPolicy = (id) => CANCEL_POLICIES[id] || CANCEL_POLICIES.flexible;

// Etapa piloto: sin gateway de pago, Finde no gestiona reembolsos, así que NO
// mostramos política de cancelación en la UI. Flag reversible: poner en true
// reactiva todos los bloques (detalle, flujo de reserva, voucher, formulario del
// operador) cuando haya pagos. Los datos/helpers de cancelación se conservan.
const SHOW_CANCELLATION_POLICY = false;

// ─── Disponibilidad de tours ──────────────────────────
// Trabajamos con strings YYYY-MM-DD para evitar bugs de zona horaria peruana.
const DAY_CODES = ["dom", "lun", "mar", "mie", "jue", "vie", "sab"];
const DAY_LABEL = { lun: "Lun", mar: "Mar", mie: "Mié", jue: "Jue", vie: "Vie", sab: "Sáb", dom: "Dom" };
const DAY_LABEL_LONG = { lun: "lunes", mar: "martes", mie: "miércoles", jue: "jueves", vie: "viernes", sab: "sábado", dom: "domingo" };
const DEFAULT_DAYS = ["lun", "mar", "mie", "jue", "vie", "sab", "dom"];
const MONTH_LABELS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const MONTH_LABELS_LOWER = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function addDaysISO(iso, days) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
}
function dayCodeFromISO(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return DAY_CODES[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}
function formatLongDate(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return `${DAY_LABEL_LONG[dayCodeFromISO(iso)]} ${d} de ${MONTH_LABELS_LOWER[m - 1]} de ${y}`;
}
function isDateAvailable(dateStr, tour) {
  if (!dateStr || !tour) return false;
  if (dateStr < todayISO()) return false;
  const excluded = tour.excludedDates || [];
  const added = tour.addedDates || [];
  if (excluded.includes(dateStr)) return false;
  if (added.includes(dateStr)) return true;
  // days == null (legacy) → todos los días.
  // days == [] → solo opera en addedDates (nada del patrón recurrente).
  const days = tour.days != null ? tour.days : DEFAULT_DAYS;
  return days.includes(dayCodeFromISO(dateStr));
}
function getAvailableDatesInRange(tour, fromISO, toISO) {
  const result = [];
  let cur = fromISO;
  while (cur <= toISO) {
    if (isDateAvailable(cur, tour)) result.push(cur);
    cur = addDaysISO(cur, 1);
  }
  return result;
}
function ensureAvailabilityFields(t) {
  if (!t) return t;
  return {
    ...t,
    // Solo defaultear cuando `days` no viene en el objeto (legacy).
    // Un array vacío explícito significa "solo fechas específicas".
    days: t.days != null ? t.days : DEFAULT_DAYS,
    excludedDates: t.excludedDates || [],
    addedDates: t.addedDates || [],
  };
}

// Calendario reusable. mode="edit" (wizard) o mode="select" (booking).
function MonthCalendar({ mode, selectedDate, onSelect, days = DEFAULT_DAYS, excludedDates = [], addedDates = [], onToggleException }) {
  const todayStr = todayISO();
  const [todayY, todayM] = todayStr.split("-").map(Number);
  const [view, setView] = useState({ y: todayY, m: todayM });
  const minKey = todayY * 12 + (todayM - 1);
  const curKey = view.y * 12 + (view.m - 1);
  const canPrev = curKey > minKey;
  const canNext = curKey < minKey + 3;
  const goPrev = () => {
    if (!canPrev) return;
    setView(v => v.m === 1 ? { y: v.y - 1, m: 12 } : { y: v.y, m: v.m - 1 });
  };
  const goNext = () => {
    if (!canNext) return;
    setView(v => v.m === 12 ? { y: v.y + 1, m: 1 } : { y: v.y, m: v.m + 1 });
  };
  const firstDayUtc = new Date(Date.UTC(view.y, view.m - 1, 1));
  const lastDayUtc = new Date(Date.UTC(view.y, view.m, 0));
  const numDays = lastDayUtc.getUTCDate();
  const startCol = (firstDayUtc.getUTCDay() + 6) % 7; // 0 = Lunes
  const cells = [];
  for (let i = 0; i < startCol; i++) cells.push(null);
  for (let d = 1; d <= numDays; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const headers = ["L", "M", "M", "J", "V", "S", "D"];
  const navStyle = (enabled) => ({
    width: 32, height: 32, borderRadius: 8, border: "none",
    background: enabled ? "var(--cr)" : "transparent",
    color: enabled ? "var(--ch)" : "var(--lg)",
    cursor: enabled ? "pointer" : "not-allowed",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: 0, fontFamily: "inherit",
  });
  return (
    <div style={{ background: "white", border: "1px solid var(--sd)", borderRadius: 14, padding: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <button type="button" onClick={goPrev} disabled={!canPrev} style={navStyle(canPrev)} aria-label="Mes anterior">
          <ChevronLeft size={18} strokeWidth={1.5} />
        </button>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ch)" }}>
          {MONTH_LABELS[view.m - 1]} {view.y}
        </div>
        <button type="button" onClick={goNext} disabled={!canNext} style={navStyle(canNext)} aria-label="Mes siguiente">
          <ChevronRight size={18} strokeWidth={1.5} />
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
        {headers.map((h, i) => (
          <div key={i} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: "var(--gy)", padding: "4px 0" }}>{h}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {cells.map((d, i) => {
          if (d === null) return <div key={i} style={{ minHeight: 36 }} />;
          const iso = `${view.y}-${String(view.m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const isPast = iso < todayStr;
          const code = dayCodeFromISO(iso);
          const inPattern = days.includes(code);
          const inExcluded = excludedDates.includes(iso);
          const inAdded = addedDates.includes(iso);
          const isSelected = selectedDate === iso;
          let state;
          if (isPast) state = "disabled";
          else if (inAdded) state = "added";
          else if (inExcluded) state = inPattern ? "excluded" : "disabled";
          else if (inPattern) state = "pattern";
          else state = "neutral";
          let bg = "transparent", color = "var(--ch)", textDecoration = "none";
          let cursor = "pointer", opacity = 1, isClickable = true;
          let border = "1.5px solid transparent";
          if (mode === "select") {
            const available = state === "added" || state === "pattern";
            if (isSelected) { bg = "var(--f)"; color = "white"; border = "1.5px solid var(--f)"; }
            else if (available) { bg = "var(--cr)"; color = "var(--f)"; }
            else { color = "var(--lg)"; opacity = 0.5; cursor = "not-allowed"; isClickable = false; }
          } else {
            if (state === "disabled") { color = "var(--lg)"; opacity = 0.45; cursor = "not-allowed"; isClickable = false; }
            else if (state === "added") { bg = "var(--f)"; color = "white"; }
            else if (state === "excluded") { bg = "rgba(199,97,58,.15)"; color = "var(--tr)"; textDecoration = "line-through"; }
            else if (state === "pattern") { bg = "var(--cr)"; color = "var(--f)"; }
            else { color = "var(--gy)"; }
          }
          const titleAttr = (mode === "select" && !isClickable && !isPast) ? "El operador no opera este día" : undefined;
          return (
            <button
              key={i}
              type="button"
              disabled={!isClickable}
              title={titleAttr}
              onClick={() => {
                if (!isClickable) return;
                if (mode === "select") onSelect && onSelect(iso);
                else onToggleException && onToggleException(iso, state);
              }}
              style={{
                minHeight: 36, aspectRatio: "1", borderRadius: 8, border,
                background: bg, color, fontSize: 13, fontWeight: 600,
                cursor, fontFamily: "inherit", textDecoration, opacity,
                transition: "background .15s", padding: 0,
              }}
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const CAT_API_TO_UI = { cultural: "culture", gastronomy: "gastro" };
const CAT_UI_TO_API = { culture: "cultural", gastro: "gastronomy" };
// Enum del API (CancellationPolicy) → clave lowercase que usa el front
// (CANCEL_POLICIES). Inverso del CANCEL_MAP del backend (lib/tour-input.ts).
const CANCEL_API_TO_UI = {
  Flexible: "flexible",
  Moderada: "moderada",
  Estricta: "estricta",
  NoReembolsable: "no_reembolsable",
};

function mapTourFromApi(t) {
  return ensureAvailabilityFields({
    id: t.id,
    title: t.title,
    titleQu: "",
    location: t.region && t.region !== t.city ? `${t.city}, ${t.region}` : t.city,
    price: Math.round(t.priceSoles / 100),
    rating: t.rating,
    reviews: t.reviewsCount,
    duration: t.durationHours >= 24
      ? `${Math.round(t.durationHours / 24)} días`
      : `${t.durationHours} horas`,
    image: t.imageUrl,
    badge: "",
    category: CAT_API_TO_UI[t.category] || t.category,
    operator: t.operator?.name || "Operador Finde",
    verified: !!t.operator?.verified,
    // Teléfono del operador para el link wa.me de coordinación (M4). null si no
    // tiene → el botón de WhatsApp no se muestra. NO se renderiza como texto.
    operatorPhone: t.operator?.phone ?? null,
    capacity: t.capacity,
    altitude: "",
    difficulty: t.difficulty || "Moderada",
    included: t.included || [],
    excluded: t.excluded || [],
    desc: t.description,
    descQu: "",
    aiSummary: t.shortPitch || "",
    altTour: null,
    tags: [],
    // cancellation: enum API → key del front; undefined si el API no lo trae
    // (getCancelPolicy ya defaultea a flexible al renderizar).
    cancellation: t.cancellation ? (CANCEL_API_TO_UI[t.cancellation] || "flexible") : undefined,
    meetingPoint: t.meetingPoint ?? "",
    // days: Boolean[7] → day-codes, ESPEJO de la conversión de envío de
    // handleCreateTour (DAY_CODES.map(c => form.days.includes(c))). undefined
    // si el API no trae el campo → ensureAvailabilityFields aplica el default
    // legacy (DEFAULT_DAYS) sin romper tours viejos.
    days: Array.isArray(t.days) ? DAY_CODES.filter((_, i) => t.days[i]) : undefined,
    excludedDates: t.excludedDates ?? undefined,
    addedDates: t.addedDates ?? undefined,
    // Hora de salida real del API (M3.2). undefined para tours legacy (null);
    // el fallback "08:00" se aplica donde se consume (hidratación / voucher).
    startTime: t.startTime ?? undefined,
    // Estado activo/inactivo real del API (M2.3); default true si no viene.
    active: t.active ?? true,
  });
}

// Mapeo inverso form (UI) → body que esperan POST/PUT /api/tours. Compartido
// por crear (2.5) y editar (2.6) para no duplicar la conversión:
// - category UI (culture/gastro) → enum API (el backend también lo tolera).
// - days: day-codes (["lun",...]) → Boolean[7] indexado por DAY_CODES
//   (índice i = DAY_CODES[i], misma convención getUTCDay() del front).
// - included/excluded: el form ya los tiene como string coma-sep; el backend
//   acepta string o array, así que se envían tal cual.
// - price: soles tal cual (el backend hace el ×100).
// - photo: solo si es URL http(s); el backend ignora lo demás.
function tourFormToApiBody(f) {
  return {
    title: f.title,
    location: f.location,
    price: f.price,
    duration: f.duration,
    category: CAT_UI_TO_API[f.category] || f.category,
    capacity: f.capacity,
    difficulty: f.difficulty || undefined,
    description: f.description,
    included: f.included || "",
    excluded: f.excluded || "",
    days: DAY_CODES.map((code) => (f.days || []).includes(code)),
    excludedDates: f.excludedDates || [],
    addedDates: f.addedDates || [],
    meetingPoint: f.meetingPoint || undefined,
    cancellation: f.cancellation || "flexible",
    // Hora de salida "HH:MM" — el backend la persiste (M3.2). undefined si el
    // form no la tiene (el backend preserva la existente en el PUT).
    startTime: f.startTime || undefined,
    ...(f.photo && /^https?:\/\//i.test(f.photo) ? { photo: f.photo } : {}),
  };
}

// Etiquetas amigables por campo (mismo set que lib/tour-input.ts) para nombrar
// el campo que falló a partir de `details` (zod issues) cuando POST/PUT /api/tours
// responde 400. Evita el mensaje genérico que oculta la causa.
const API_FIELD_LABELS = {
  title: "Nombre", location: "Ubicación", price: "Precio", duration: "Duración",
  category: "Categoría", capacity: "Cantidad de personas", difficulty: "Dificultad",
  description: "Descripción", included: "Qué incluye", excluded: "Qué no incluye",
  days: "Días", excludedDates: "Fechas excluidas", addedDates: "Fechas agregadas",
  meetingPoint: "Punto de encuentro", cancellation: "Política de cancelación",
  photo: "Foto", startTime: "Hora de salida",
};

// Construye un mensaje útil desde la respuesta de error del API de tours:
// si trae `details` (zod issues), nombra los campos que fallaron; si no, usa
// data.error (que el backend ya enriquece) o el fallback.
function describeTourApiError(data, fallback) {
  const issues = Array.isArray(data?.details) ? data.details : [];
  const fields = [...new Set(issues.map((i) => {
    const key = Array.isArray(i?.path) && typeof i.path[0] === "string" ? i.path[0] : "";
    return API_FIELD_LABELS[key] || key;
  }))].filter(Boolean);
  if (fields.length > 0) {
    return `Revisa ${fields.length > 1 ? "estos campos" : "el campo"}: ${fields.join(", ")}`;
  }
  return data?.error || fallback;
}

const AI_SUGGESTIONS = [
  { query: "algo tranquilo con niños sin mucha altitud", results: ["cmoh8rd3t000zvpn2vn252gw0", "cmoh8rd6l0011vpn2gh5sebuu", "cmoh8rdvu001jvpn2mor2wbyw"], reason: "Baja altitud + actividades familiares" },
  { query: "aventura extrema para jóvenes", results: ["cmoh8rceb000hvpn29qhzz4ug", "cmoh8rdhw0019vpn2wq5xn8tk", "cmoh8rc8h000dvpn22yhhhrii"], reason: "Alta adrenalina + desafío físico" },
  { query: "tour barato con almuerzo incluido", results: ["cmoh8rcvc000tvpn23butdi5i", "cmoh8rdkp001bvpn26emecam2", "cmoh8rcha000jvpn2fo8kzet0", "cmoh8rdf30017vpn2syj9r18z"], reason: "Precio accesible + almuerzo en inclusiones" },
  { query: "qué hacer en feriado largo de mayo", results: ["cmoh8re7d001rvpn2eyvaz3bk", "cmoh8re4h001pvpn23qzu04f2", "cmoh8re1o001nvpn2yispucfu"], reason: "Multi-día o full day + temporada seca" },
  { query: "sin turistas y naturaleza pura", results: ["cmoh8rea5001tvpn2uchbmxj4", "cmoh8rdyo001lvpn28ylkpior", "cmoh8rdt1001hvpn2a6g2ai1a"], reason: "Baja masificación + naturaleza" },
  { query: "planes cerca de Lima para el fin de semana", results: ["cmoh8rd0x000xvpn2orc0q2wm", "cmoh8rd3t000zvpn2vn252gw0", "cmpdm1s1e000rvpl9a1qv68up", "cmpdm1po0000nvpl9zonbjbq3"], reason: "Destinos accesibles desde Lima" },
];

const KEYWORD_MAPS = [
  { keywords: ["tranquilo","relajado","familia","niños","familiar"], filters: { difficulty: ["Fácil"], categories: ["nature","culture","gastro"] } },
  { keywords: ["aventura","extremo","adrenalina"], filters: { difficulty: ["Alta","Moderada"], categories: ["adventure"] } },
  { keywords: ["místico","espiritual","ceremonia","ayahuasca","chamán","ritual"], filters: { categories: ["mystic"] } },
  { keywords: ["barato","económico"], filters: { sort: "price_asc" } },
  { keywords: ["full day","1 día"], filters: { durationMatch: "fullday" } },
  { keywords: ["fin de semana"], filters: { durationMatch: "multiday" } },
  { keywords: ["corto"], filters: { durationMatch: "short" } },
  { keywords: ["sin altitud","baja altitud"], filters: { maxAltitude: 3000 } },
];

const CITY_ALIASES = {
  lima: ["Lima","Miraflores"], cusco: ["Cusco"], arequipa: ["Arequipa"],
  ica: ["Ica","Paracas","Huacachina"], huaraz: ["Huaraz","Áncash"],
  piura: ["Piura","Los Órganos","Máncora"], apurímac: ["Apurímac"],
};

// Feature "Tours en [ciudad]": 9 ciudades soportadas, ordenadas por tráfico
// turístico. SUPPORTED_CITY_ALIASES amplía CITY_ALIASES (usado por la búsqueda
// IA) con distritos de Lima y subdestinos de cada región, alineado con el
// mapeo de lib/geo.ts del backend.
const SUPPORTED_CITIES = [
  "Lima","Cusco","Arequipa","Trujillo","Ica","Iquitos","Piura","Huaraz","Puerto Maldonado",
];
const SUPPORTED_CITY_ALIASES = {
  "Lima": ["Lima","Miraflores","San Isidro","Barranco","Surco","La Molina","Callao","Chorrillos","San Borja","Magdalena","Pueblo Libre","Chancay","Lunahuaná","Marcapomacocha"],
  "Cusco": ["Cusco","Cuzco"],
  "Arequipa": ["Arequipa"],
  "Trujillo": ["Trujillo"],
  "Ica": ["Ica","Paracas","Huacachina","Nazca","Chincha"],
  "Iquitos": ["Iquitos"],
  "Piura": ["Piura","Máncora","Los Órganos","Talara"],
  "Huaraz": ["Huaraz"],
  "Puerto Maldonado": ["Puerto Maldonado","Tambopata"],
};
function normalizeCity(s) {
  return (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}
// Dev-only: en localhost permitimos override por ?city=Cusco. En cualquier
// otro host devuelve null y el frontend confía en /api/geo.
function readDevCityOverride() {
  if (typeof window === "undefined") return null;
  const host = window.location.hostname;
  if (host !== "localhost" && host !== "127.0.0.1") return null;
  const params = new URLSearchParams(window.location.search);
  const override = params.get("city");
  if (!override) return null;
  const norm = normalizeCity(override);
  return SUPPORTED_CITIES.find(c => normalizeCity(c) === norm) || null;
}
function toursByCity(tours, city) {
  const aliases = SUPPORTED_CITY_ALIASES[city] || [city];
  const normAliases = aliases.map(normalizeCity);
  return tours.filter(t => {
    const loc = normalizeCity(t.location);
    return loc && normAliases.some(a => loc.includes(a));
  });
}

function parseAltitude(t) { return parseInt((t.altitude || "").replace(/,/g, ""), 10) || 0; }
function parseDurationDays(t) {
  const d = (t.duration || "").toLowerCase();
  if (d.includes("hora")) return 0.5;
  const m = d.match(/(\d+)\s*d/i);
  if (m) return parseInt(m[1], 10);
  if (d.includes("full day")) return 1;
  return 1;
}

function searchTours(tours, query, categoryFilter) {
  const q = query.toLowerCase().trim();
  if (q.length < 2) return { results: categoryFilter === "all" ? tours : tours.filter(t => t.category === categoryFilter), hasKeywordMatch: false, sort: null };
  let matchedFilters = {};
  let hasKeywordMatch = false;
  let remaining = q;
  for (const map of KEYWORD_MAPS) {
    for (const kw of map.keywords) {
      if (remaining.includes(kw)) {
        hasKeywordMatch = true;
        remaining = remaining.replace(kw, "").trim();
        Object.assign(matchedFilters, map.filters);
      }
    }
  }
  let cityMatch = null;
  for (const [city, aliases] of Object.entries(CITY_ALIASES)) {
    if (remaining.includes(city) || remaining.includes("cerca de " + city)) {
      cityMatch = aliases;
      remaining = remaining.replace("cerca de " + city, "").replace(city, "").trim();
      hasKeywordMatch = true;
    }
  }
  const tokens = remaining.split(/\s+/).filter(t => t.length >= 2);
  const scored = tours.map(t => {
    let score = 0;
    if (matchedFilters.difficulty && !matchedFilters.difficulty.includes(t.difficulty)) return { tour: t, score: 0 };
    if (matchedFilters.categories && !matchedFilters.categories.includes(t.category)) return { tour: t, score: 0 };
    if (matchedFilters.maxAltitude && parseAltitude(t) > matchedFilters.maxAltitude) return { tour: t, score: 0 };
    if (matchedFilters.durationMatch) {
      const days = parseDurationDays(t);
      if (matchedFilters.durationMatch === "fullday" && days !== 1) return { tour: t, score: 0 };
      if (matchedFilters.durationMatch === "multiday" && days < 2) return { tour: t, score: 0 };
      if (matchedFilters.durationMatch === "short" && days > 1) return { tour: t, score: 0 };
    }
    if (cityMatch && !cityMatch.some(a => t.location.includes(a))) return { tour: t, score: 0 };
    if (hasKeywordMatch && tokens.length === 0) score += 10;
    const catName = (CATS.find(c => c.id === t.category) || {}).n || "";
    const incl = (t.included || []).join(" ");
    for (const tk of tokens) {
      if (t.title.toLowerCase().includes(tk)) score += 40;
      if (t.location.toLowerCase().includes(tk)) score += 30;
      if (catName.toLowerCase().includes(tk)) score += 30;
      if ((t.desc || "").toLowerCase().includes(tk)) score += 15;
      if (incl.toLowerCase().includes(tk)) score += 8;
      if ((t.tags || []).some(tag => tag.includes(tk))) score += 20;
    }
    if (categoryFilter !== "all" && t.category !== categoryFilter) return { tour: t, score: 0 };
    return { tour: t, score };
  });
  let results = scored.filter(s => s.score > 0);
  if (matchedFilters.sort === "price_asc") results.sort((a, b) => a.tour.price - b.tour.price);
  else results.sort((a, b) => b.score - a.score);
  return { results: results.map(s => s.tour), hasKeywordMatch, sort: matchedFilters.sort || null };
}

const NOTIFS = [
  { id:1, type:"ai", title:"Finde IA encontró algo para ti", body:"Basado en tu búsqueda de 'aventura sin altitud', te recomendamos Sandboarding en Huacachina.", time:"Hace 1 hora", read:false, icon:Bot },
  { id:2, type:"booking", title:"Reserva confirmada", body:"Tu Trekking al Nevado Pastoruri del 19 May está confirmado.", time:"Hace 3 horas", read:false, icon:CheckCircle },
  { id:3, type:"reminder", title:"Recordatorio: mañana sales", body:"Tour Gastronómico por Lima mañana 10:00 AM. Parque Kennedy.", time:"Hace 5 horas", read:false, icon:Clock },
  { id:4, type:"promo", title:"Feriado largo de mayo", body:"Nuevos tours añadidos para el feriado largo. Reserva con anticipación.", time:"Hace 1 día", read:true, icon:Tag },
  { id:5, type:"review", title:"¿Cómo estuvo tu experiencia?", body:"Cuéntanos sobre tu Sandboarding en Huacachina.", time:"Hace 3 días", read:true, icon:Star },
  { id:6, type:"quechua", title:"Nuevo: tours en quechua", body:"3 operadores ahora tienen descripciones en runasimi.", time:"Hace 5 días", read:true, icon:Languages },
];

// Fase 3.2: 2 trips fijos con CUIDs reales de DB (tour objects inline
// replicados desde data/track-b/tours-db-snapshot.json). El shape
// anidado { id, tour: {...}, date, total, ... } coincide con el
// consumido por TripsView, VoucherDetail y buildWhatsAppLink.
const MY_TRIPS = [
  {
    id: 101,
    tour: {
      id: "cmoh8rbzp0009vpn26ju9npzp",
      title: "Machu Picchu Full Day desde Cusco",
      location: "Cusco",
      price: 475,
      duration: "17 horas",
      image: "https://images.unsplash.com/photo-1526392060635-9d6019884377?w=1200&q=80",
      operator: "Inka Trail Co",
      verified: true,
      included: [
        "Transporte privado Cusco-Ollantaytambo y retorno",
        "Tren PeruRail Expedition ida y vuelta",
        "Bus Consettur subida y bajada",
        "Boleto de ingreso Machu Picchu circuito 2",
        "Guía oficial Mincetur español/inglés",
      ],
      cancellation: "flexible",
      meetingPoint: "",
    },
    date: "2025-08-15",
    guests: 2,
    total: 950,
    status: "completed",
    code: "FINDE-MP-001",
    reviewed: false,
  },
  {
    id: 102,
    tour: {
      id: "cmoh8rcvc000tvpn23butdi5i",
      title: "Lima Colonial: Centro Histórico patrimonio UNESCO",
      location: "Lima",
      price: 75,
      duration: "4 horas",
      image: "https://images.unsplash.com/photo-1687835071853-b72ebad325d1?w=1200&q=80",
      operator: "Lima Cultural Tours",
      verified: true,
      included: [
        "Guía oficial Mincetur bilingüe",
        "Entrada al Convento de San Francisco y catacumbas",
        "Entrada a Casa de Aliaga",
      ],
      cancellation: "flexible",
      meetingPoint: "",
    },
    date: "2025-11-22",
    guests: 1,
    total: 75,
    status: "completed",
    code: "FINDE-LC-002",
    reviewed: false,
  },
];

// Fase 3.1: eliminado el diccionario REVIEWS (claves 1-14 ya no aplican
// porque los tours ahora usan CUIDs del API). reviews[cuid] retorna
// undefined y cae al fallback determinístico generateMockReviews.

// Pools determinísticos para reseñas mock de tours del API (CUIDs).
const REVIEW_AUTHORS = [
  { author: "María García", avatar: "MG" },
  { author: "Carlos Mendoza", avatar: "CM" },
  { author: "Andrea Vargas", avatar: "AV" },
  { author: "Diego Salazar", avatar: "DS" },
  { author: "Lucía Ramos", avatar: "LR" },
  { author: "Sebastián Castro", avatar: "SC" },
  { author: "Camila Torres", avatar: "CT" },
  { author: "Yanet Quispe", avatar: "YQ" },
  { author: "Edgar Mamani", avatar: "EM" },
  { author: "Rocío Huamán", avatar: "RH" },
  { author: "Ana Rodríguez", avatar: "AR" },
  { author: "James Wilson", avatar: "JW" },
  { author: "Sofia Müller", avatar: "SM" },
];

const REVIEW_TEXTS_BY_CATEGORY = {
  adventure: [
    "Adrenalina pura y bien organizado. El equipo de seguridad estaba impecable y los instructores muy claros con las indicaciones.",
    "Día intenso de principio a fin. Los breaks fueron en el momento justo y el almuerzo súper bien servido.",
    "Si vienes a Perú a desconectarte y conectar con la naturaleza, este tour cumple. Las fotos del operador con drone son un plus.",
    "Llevé buen calzado y ropa cómoda como recomendaron por WhatsApp y todo perfecto. Súper recomendado para grupos jóvenes.",
  ],
  gastro: [
    "Probamos cebiche, anticuchos, picarones... todo de primera. El guía conoce muy bien la historia detrás de cada plato.",
    "Mucho más que solo comer. Aprendimos sobre la fusión peruana, las influencias chinas y japonesas. Excelente experiencia.",
    "Las paradas estuvieron bien escogidas. Mi favorita fue la cevichería en Barranco. Volvería sin dudarlo.",
    "Cantidad y calidad. No vinimos con hambre y aún así no abasteció. La causa rellena fue la estrella del recorrido.",
  ],
  culture: [
    "El guía habla con pasión de la historia. Te das cuenta que ama lo que hace. Aprendí muchísimo del contexto pre-inca y colonial.",
    "Sitio impresionante. Llegamos temprano y evitamos las hordas de turistas, gran consejo del operador.",
    "Recomendado para quienes quieren entender el contexto, no sólo tomarse fotos. La narrativa conecta los puntos muy bien.",
    "Volvería con mis hijos cuando estén un poco más grandes. Hay historia para tres tours en uno.",
  ],
  nature: [
    "Vimos guacamayos, monos y hasta una nutria gigante. La selva peruana es mágica y el guía sabía identificar todo lo que se movía.",
    "Tour bien organizado, los lodges cómodos. Los guías locales saben hasta de qué especie son las huellas en el barro.",
    "Si te gusta la fauna, este tour es imperdible. Llevé buenos binoculares y valió la pena cada gramo.",
    "El silencio del amanecer escuchando aves es algo que no se olvida. Excelente para fotógrafos amateur.",
  ],
  mystic: [
    "Una ceremonia con mucho respeto a la tradición. El maestro andino explicó cada paso y se sintió genuino.",
    "No esperaba que me moviera tanto. La energía del lugar combinada con la guía hizo de este día algo especial.",
    "Para venir con mente abierta. La conexión con la cosmovisión andina vale el viaje.",
  ],
  generic: [
    "Comunicación impecable desde la reserva. Llegaron puntuales al hotel y todo el día fue muy fluido.",
    "Muy buena relación calidad-precio. Lo único que cambiaría es empezar un poco más tarde.",
    "Excelente experiencia con Finde. La agencia respondió rápido por WhatsApp y todo salió como lo prometieron.",
    "Equipo súper amable. Hablaron español, inglés y un poquito de quechua con la gente del pueblo. Auténtico.",
  ],
};

function hashTourId(id) {
  const s = String(id);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

// Distribuye un total de reseñas en buckets de 5/4/3/2/1 estrellas según el
// rating promedio. Para ratings altos (4.8+) la distribución se concentra
// fuertemente en 5★; para ratings medios se reparte. Usado sólo para la viz
// de barras cuando tour.reviews > tourRevs.length (caso tours del API).
function distributeStars(rating, total) {
  if (!total || total <= 0) return [5,4,3,2,1].map(s => ({ star: s, count: 0 }));
  const r = Math.max(0, Math.min(5, Number(rating) || 0));
  let pct;
  if (r >= 4.8) pct = [0.88, 0.09, 0.02, 0.005, 0.005];
  else if (r >= 4.5) pct = [0.70, 0.20, 0.07, 0.02, 0.01];
  else if (r >= 4.2) pct = [0.55, 0.28, 0.10, 0.04, 0.03];
  else if (r >= 4.0) pct = [0.45, 0.32, 0.15, 0.05, 0.03];
  else if (r >= 3.5) pct = [0.30, 0.32, 0.22, 0.10, 0.06];
  else pct = [0.20, 0.25, 0.30, 0.15, 0.10];
  const exact = pct.map(p => p * total);
  const counts = exact.map(Math.round);
  let diff = total - counts.reduce((a, b) => a + b, 0);
  let safety = 0;
  while (diff !== 0 && safety++ < 100) {
    let idx = 0;
    for (let i = 1; i < counts.length; i++) if (counts[i] > counts[idx]) idx = i;
    counts[idx] += diff > 0 ? 1 : -1;
    diff += diff > 0 ? -1 : 1;
  }
  return [5,4,3,2,1].map((s, i) => ({ star: s, count: Math.max(0, counts[i]) }));
}

function generateMockReviews(tour) {
  if (!tour) return [];
  const seed = hashTourId(tour.id);
  const count = 3 + (seed % 2); // 3 ó 4 reseñas
  const catKey = tour.category && REVIEW_TEXTS_BY_CATEGORY[tour.category] ? tour.category : "generic";
  const catPool = REVIEW_TEXTS_BY_CATEGORY[catKey];
  const monthsShort = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const today = new Date();
  const out = [];
  for (let i = 0; i < count; i++) {
    const author = REVIEW_AUTHORS[(seed + i * 7) % REVIEW_AUTHORS.length];
    // Mezcla: ~70% comentarios de la categoría, ~30% genéricos.
    const useGeneric = ((seed + i) % 10) >= 7;
    const pool = useGeneric ? REVIEW_TEXTS_BY_CATEGORY.generic : catPool;
    const text = pool[(seed + i * 3) % pool.length];
    // ~25% de reseñas con 4 estrellas, resto 5.
    const rating = ((seed + i) % 4) === 0 ? 4 : 5;
    // Fechas espaciadas: 60-360 días atrás.
    const daysBack = 60 + ((seed + i * 47) % 300);
    const d = new Date(today.getTime() - daysBack * 86400000);
    const date = `${String(d.getDate()).padStart(2, "0")} ${monthsShort[d.getMonth()]} ${d.getFullYear()}`;
    out.push({
      id: `mock-${tour.id}-${i}`,
      author: author.author,
      avatar: author.avatar,
      rating,
      text,
      date,
    });
  }
  return out;
}

const USER = { name:"Alejandra Quispe", phone:"+51 987 654 321", email:"ale.quispe@gmail.com", dni:"72345678", city:"Lima", joinDate:"Enero 2026", trips:4, favorites:6, reviews:2, avatar:"AQ" };

// OP_BK (mock de reservas del operador) eliminado en M3 Sub-paso B: la tab
// "Reservas" ahora hidrata datos reales desde GET /api/operators/me/bookings.
// EARN (mock de ingresos semanales) eliminado al ocultar la tab "Ingresos":
// sin gateway de pago en la etapa piloto no hay ingresos reales que mostrar.

// Returns a style object for background images that works for both CSS gradients and uploaded photos.
const imgBg = (image) => {
  if (!image) return {};
  if (image.startsWith("http") || image.startsWith("data:")) return { background: `url(${image}) center/cover no-repeat` };
  if (image.startsWith("url(")) return { background: `${image} center/cover no-repeat` };
  return { background: image };
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
html{scrollbar-gutter:stable}
.app{--f:#1B3A2D;--m:#2D5A3D;--sg:#6B8F71;--sd:#E8DDD3;--cr:#F5F0EA;--wh:#FAFAF7;--tr:#C7613A;--trl:#E8845A;--gd:#D4A843;--ch:#2C2C2A;--gy:#737370;--gy-soft:#8A8A85;--lg:#959591;--yp:#6B2FA0;--pl:#00B4D8;--ai:#0EA5E9;--focus:rgba(199,97,58,.4)}
.app *{margin:0;padding:0;box-sizing:border-box}
.app{font-family:'Plus Jakarta Sans',system-ui,sans-serif;background:var(--wh);color:var(--ch);-webkit-font-smoothing:antialiased;overflow-x:hidden}
.app{min-height:100vh;background:var(--wh);position:relative}

/* Focus accesible — solo navegación con teclado */
.app :focus{outline:none}
.app a:focus-visible,.app button:focus-visible,.app summary:focus-visible,.app [role="button"]:focus-visible,.app [tabindex="0"]:focus-visible{outline:2px solid var(--tr);outline-offset:2px;border-radius:4px}
.app input:focus-visible,.app textarea:focus-visible,.app select:focus-visible{outline:none;border-color:var(--m);box-shadow:0 0 0 4px var(--focus)}
.app input[type="checkbox"]:focus-visible,.app input[type="radio"]:focus-visible{outline:2px solid var(--tr);outline-offset:2px;box-shadow:none}

@media (prefers-reduced-motion: reduce){
  .app *,.app *::before,.app *::after{animation-duration:.01ms !important;animation-iteration-count:1 !important;transition-duration:.01ms !important;scroll-behavior:auto !important}
}

/* Hover/active states unificados para botones y elementos interactivos */
.app .chip:hover{border-color:var(--sg);color:var(--f)}
.app .chip.on{background:var(--f);color:white;border-color:var(--f)}
.app .tc:hover{transform:translateY(-3px);box-shadow:0 8px 20px rgba(0,0,0,.08);border-color:rgba(199,97,58,.18)}
.app .tc:active{transform:translateY(-1px)}
.app .gc:hover{transform:translateY(-2px);box-shadow:0 6px 16px rgba(0,0,0,.07);border-color:rgba(199,97,58,.18)}
.app .gc:active{transform:translateY(0)}
.app .bk-btn:hover{background:white;transform:scale(1.05)}
.app .bk-btn:active{transform:scale(.95)}
.app .bn-i:hover{color:var(--ch)}
.app .bn-i.on:hover{color:var(--f)}
.app .tp-tab:hover:not(.on){border-color:var(--sg);color:var(--ch)}
.app .dsh-tab:hover:not(.on){color:var(--ch)}
.app .pm:hover:not(.sel){border-color:var(--sg)}
.app .pm:active{transform:scale(.98)}
.app .login-btn:active:not(:disabled),.app .mbtn:active:not(:disabled),.app .bb-bt:active:not(:disabled){transform:translateY(1px);box-shadow:0 1px 3px rgba(0,0,0,.1)}
.app .login-btn:hover:not(:disabled),.app .mbtn:hover:not(:disabled),.app .bb-bt:hover:not(:disabled){box-shadow:0 4px 12px rgba(27,58,45,.18)}

/* Disabled state visualmente claro */
.app .login-btn:disabled,.app .mbtn:disabled,.app .bb-bt:disabled{background:var(--gy);box-shadow:none}

/* Inputs y textareas con focus mejorado (border + box-shadow) */
.app .inp:focus,.app .ai-cc-input:focus,.app .rv-textarea:focus,.app .otp-digit:focus{border-color:var(--m);box-shadow:0 0 0 4px var(--focus)}

/* Smooth scroll en contenedores horizontales */
.app .cats,.app .dsh-tabs,.app .tscr{scroll-behavior:smooth;-webkit-overflow-scrolling:touch}
@keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
@keyframes typingDot{0%,100%{opacity:.3}50%{opacity:1}}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
@keyframes glow{0%,100%{box-shadow:0 0 8px rgba(14,165,233,.2)}50%{box-shadow:0 0 20px rgba(14,165,233,.4)}}
.fu{animation:fadeUp .45s ease forwards}.fd1{animation:fadeUp .45s ease .1s forwards;opacity:0}.fd2{animation:fadeUp .45s ease .2s forwards;opacity:0}.fd3{animation:fadeUp .45s ease .3s forwards;opacity:0}

/* ── Login / Onboarding ── */
.login{min-height:100vh;display:flex;flex-direction:column}
.login-hero{flex:0 0 280px;background:linear-gradient(160deg,var(--f) 0%,#1a4a35 40%,var(--m) 100%);position:relative;display:flex;flex-direction:column;justify-content:flex-end;padding:32px 28px;overflow:hidden}
.login-hero-tex{position:absolute;inset:0;background:repeating-linear-gradient(45deg,transparent,transparent 8px,rgba(255,255,255,.02) 8px,rgba(255,255,255,.02) 16px)}
.login-hero-logo{font-family:'DM Serif Display',Georgia,serif;font-size:42px;color:white;position:relative;z-index:2}
.login-hero-logo span{color:var(--tr)}
.login-hero-tagline{font-size:15px;color:rgba(255,255,255,.7);margin-top:6px;position:relative;z-index:2;line-height:1.5}
.login-hero-stat{display:flex;gap:20px;margin-top:20px;position:relative;z-index:2}
.login-hero-stat-i{text-align:center}
.login-hero-stat-v{font-size:18px;font-weight:800;color:white}
.login-hero-stat-l{font-size:10px;color:rgba(255,255,255,.75);text-transform:uppercase;letter-spacing:.5px;margin-top:2px}
.login-body{flex:1;padding:28px 24px;display:flex;flex-direction:column}
.login-title{font-family:'DM Serif Display',Georgia,serif;font-size:24px;margin-bottom:4px}
.login-sub{font-size:13px;color:var(--gy);margin-bottom:24px;line-height:1.5}
.login-btn{width:100%;padding:16px;border-radius:14px;background:var(--f);color:white;font-weight:700;font-size:15px;border:none;cursor:pointer;font-family:inherit;transition:.2s;margin-bottom:12px}
.login-btn:hover{background:var(--m)}
.login-btn:disabled{opacity:.4;cursor:not-allowed}
.login-google{width:100%;padding:14px;border-radius:14px;background:white;border:1.5px solid var(--sd);color:var(--ch);font-weight:600;font-size:14px;cursor:pointer;font-family:inherit;transition:.2s;display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:12px}
.login-google:hover{border-color:var(--lg);background:var(--cr)}
.login-google svg{flex-shrink:0}
.login-divider{display:flex;align-items:center;gap:14px;margin:16px 0;color:var(--lg);font-size:12px}
.login-divider::before,.login-divider::after{content:'';flex:1;height:1px;background:var(--sd)}
.login-skip{width:100%;padding:14px;border-radius:14px;background:none;border:1.5px solid var(--sd);color:var(--gy);font-weight:600;font-size:13px;cursor:pointer;font-family:inherit;transition:.2s}
.login-skip:hover{border-color:var(--m);color:var(--ch)}
.login-terms{font-size:11px;color:var(--lg);text-align:center;margin-top:auto;padding-top:16px;line-height:1.5}
.login-terms a{color:var(--tr);text-decoration:none;font-weight:600}
/* Login input (M1: email/password). No flex:1 ni letter-spacing del campo de teléfono. */
.login-input{width:100%;padding:13px 16px;border:2px solid var(--sd);border-radius:14px;font-size:16px;font-family:inherit;background:white;color:var(--ch);outline:none;transition:.2s;box-sizing:border-box}
.login-input:focus{border-color:var(--m);box-shadow:0 0 0 4px var(--focus)}
.login-input:-webkit-autofill,.login-input:-webkit-autofill:hover,.login-input:-webkit-autofill:focus,.login-input:-webkit-autofill:active{-webkit-box-shadow:0 0 0 1000px white inset !important;box-shadow:0 0 0 1000px white inset !important;-webkit-text-fill-color:var(--ch) !important;caret-color:var(--ch);transition:background-color 9999s ease-in-out 0s}
.login-input:-webkit-autofill:focus{-webkit-box-shadow:0 0 0 1000px white inset,0 0 0 4px var(--focus) !important;box-shadow:0 0 0 1000px white inset,0 0 0 4px var(--focus) !important}
/* Segmented control signin/signup */
.login-tabs{display:flex;gap:0;background:var(--cr);border:1.5px solid var(--sd);border-radius:12px;padding:4px;margin-bottom:20px}
.login-tab{flex:1;padding:10px 12px;border:0;background:transparent;color:var(--gy);font-weight:600;font-size:13px;border-radius:8px;cursor:pointer;font-family:inherit;transition:.2s}
.login-tab.on{background:var(--f);color:white;box-shadow:0 2px 6px rgba(27,58,45,.15)}

/* OTP Input */
.otp-row{display:flex;gap:10px;justify-content:center;margin-bottom:24px}
.otp-digit{width:48px;height:56px;border:2px solid var(--sd);border-radius:12px;font-size:24px;font-weight:700;text-align:center;font-family:inherit;outline:none;transition:.2s;color:var(--ch)}
.otp-digit:focus{border-color:var(--f);background:rgba(45,90,61,.03)}
.otp-resend{font-size:12px;color:var(--gy);text-align:center;margin-bottom:20px}
.otp-resend button{background:none;border:none;color:var(--tr);font-weight:600;cursor:pointer;font-family:inherit;font-size:12px}

/* Welcome screen */
.welcome{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 24px;text-align:center}
.welcome-check{width:72px;height:72px;border-radius:50%;background:var(--f);color:white;display:flex;align-items:center;justify-content:center;font-size:32px;margin-bottom:20px;animation:pulse .6s ease}
.welcome-title{font-family:'DM Serif Display',Georgia,serif;font-size:26px;margin-bottom:8px}
.welcome-sub{font-size:14px;color:var(--gy);margin-bottom:32px;line-height:1.6;max-width:280px}
.welcome-features{display:flex;flex-direction:column;gap:12px;width:100%;margin-bottom:32px}
.welcome-feat{display:flex;align-items:center;gap:12px;padding:14px 16px;background:var(--cr);border-radius:12px;text-align:left}
.welcome-feat-ic{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}
.welcome-feat-txt{font-size:13px;font-weight:600}

/* ── Nav ── */
.tn{position:sticky;top:0;z-index:50;background:rgba(250,250,247,.85);backdrop-filter:blur(20px);box-shadow:0 1px 0 transparent;transition:box-shadow .15s}
.tn.scrolled{box-shadow:0 1px 0 rgba(0,0,0,.06)}
.tn-inner{display:flex;align-items:center;justify-content:space-between;padding:12px 20px}
.logo{font-family:'DM Serif Display',Georgia,serif;font-size:28px;color:var(--f);cursor:pointer;letter-spacing:-.5px}
.logo span{color:var(--tr)}
.logo-ai{font-size:9px;font-weight:700;color:var(--ai);background:rgba(14,165,233,.1);padding:2px 6px;border-radius:4px;margin-left:6px;vertical-align:super;letter-spacing:.5px}
.tn-r{display:flex;gap:8px}
.tn-btn{width:44px;height:44px;border-radius:50%;border:1.5px solid var(--lg);background:white;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:.2s;font-family:inherit;position:relative;color:var(--ch)}
.tn-btn:hover{border-color:var(--f);transform:scale(1.05)}
.tn-btn.on{background:var(--f);border-color:var(--f);color:white}
.ndot{position:absolute;top:6px;right:6px;width:8px;height:8px;border-radius:50%;background:var(--tr);border:2px solid white}

.bn{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:none;background:rgba(250,250,247,.92);backdrop-filter:blur(20px);border-top:1px solid rgba(0,0,0,.06);display:flex;justify-content:space-around;padding:8px 0 max(env(safe-area-inset-bottom),8px);z-index:100}
.bn-i{display:flex;flex-direction:column;align-items:center;gap:2px;font-size:10px;font-weight:600;color:var(--gy);cursor:pointer;padding:6px 16px;border-radius:12px;transition:.2s;background:none;border:none;font-family:inherit}
.bn-i.on{color:var(--f)}.bn-i .ni{font-size:22px;line-height:1}
.bn-i .nd{width:4px;height:4px;border-radius:50%;background:var(--tr);opacity:0;transition:.2s}.bn-i.on .nd{opacity:1}

/* ── Hero ── */
.hero{position:relative;margin:0 16px 20px;border-radius:28px;overflow:hidden;height:220px;background:url(https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=400&h=300&fit=crop) center/cover no-repeat}
.hero-tex{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.35) 0%,rgba(0,0,0,.55) 100%)}
.hero-c{position:relative;z-index:2;padding:28px 24px;display:flex;flex-direction:column;justify-content:space-between;height:100%}
.hero-tag{display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,.15);backdrop-filter:blur(10px);padding:6px 14px;border-radius:100px;font-size:11px;font-weight:600;color:rgba(255,255,255,.9);width:fit-content;letter-spacing:.5px}
.hero-t{font-family:'DM Serif Display',Georgia,serif;font-size:28px;line-height:1.15;color:white;max-width:280px}
.hero-sub{font-size:13px;color:rgba(255,255,255,.7);margin-top:4px}

/* ── AI Search ── */
.ai-sb{margin:0 16px 12px;position:relative;z-index:70}
.ai-sb input{width:100%;padding:13px 48px 13px 44px;border:2px solid var(--sd);border-radius:20px;font-size:16px;font-family:inherit;background:white;color:var(--ch);transition:.3s;outline:none}
.ai-sb input:focus{border-color:var(--m);box-shadow:0 0 0 4px rgba(45,90,61,.08)}
.ai-sb input::placeholder{color:var(--gy)}
.ai-sb-ic{position:absolute;left:16px;top:50%;transform:translateY(-50%);font-size:16px;color:var(--gy)}
.ai-sb-tag{position:absolute;right:14px;top:50%;transform:translateY(-50%);padding:3px 8px;border-radius:6px;font-size:9px;font-weight:700;color:var(--f);background:var(--cr);letter-spacing:.3px}
.ai-suggest{position:absolute;top:calc(100% + 4px);left:0;right:0;background:white;border-radius:12px;box-shadow:0 8px 28px rgba(0,0,0,.12);z-index:200;border:1px solid rgba(0,0,0,.08);max-height:380px;overflow-y:auto;padding:6px 0}
.ai-suggest-h{padding:8px 12px 4px;font-size:10px;font-weight:700;color:var(--f);text-transform:uppercase;letter-spacing:1px;display:flex;align-items:center;gap:6px}
.ai-suggest-i{padding:8px 12px;cursor:pointer;transition:.15s;font-size:13px;color:var(--ch);border-bottom:1px solid rgba(0,0,0,.03)}
.ai-suggest-i:hover{background:var(--cr)}
.ai-suggest-i:last-child{border-bottom:none}
.ai-suggest-q{font-weight:600}
.ai-suggest-r{font-size:11px;color:var(--gy);margin-top:2px}
.sr-item{display:flex;align-items:center;gap:10px;padding:10px 12px;cursor:pointer;transition:.15s;border-bottom:1px solid rgba(0,0,0,.03)}
.sr-item:hover{background:var(--cr)}
.sr-item:last-of-type{border-bottom:none}
.sr-thumb{width:44px;height:44px;border-radius:10px;flex-shrink:0}
.sr-info{flex:1;min-width:0}
.sr-name{font-size:13px;font-weight:700;color:var(--ch);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sr-loc{font-size:11px;color:var(--gy);margin-top:1px}
.sr-meta{text-align:right;flex-shrink:0}
.sr-price{font-size:13px;font-weight:800;color:var(--f)}
.sr-rating{font-size:10px;color:var(--gd)}
.sr-viewall{padding:10px 12px;text-align:center;font-size:13px;font-weight:700;color:var(--tr);cursor:pointer;border-top:1px solid rgba(0,0,0,.06)}
.sr-viewall:hover{background:var(--cr)}
.sr-noresults{padding:16px 12px;font-size:13px;color:var(--gy);text-align:center;line-height:1.5}
.sr-pills{display:flex;flex-wrap:wrap;gap:6px;padding:8px 12px;justify-content:center}
.sr-ai-hint{padding:6px 12px;font-size:11px;color:var(--m);font-weight:600;display:flex;align-items:center;gap:4px}
.sr-clear{background:none;border:none;font-size:16px;color:var(--gy);cursor:pointer;padding:4px 8px;margin-left:auto;flex-shrink:0}
.sr-clear:hover{color:var(--ch)}

/* AI Result banner */
.ai-result{margin:0 16px 16px;padding:14px 16px;background:var(--cr);border:1px solid var(--sd);border-radius:14px;display:flex;align-items:flex-start;gap:10px}
.ai-result-ic{width:28px;height:28px;border-radius:8px;background:rgba(45,90,61,.1);display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;color:var(--f)}
.ai-result-t{font-size:12px;font-weight:600;color:var(--f)}
.ai-result-b{font-size:11px;color:var(--gy);margin-top:2px;line-height:1.4}
.ai-result-x{font-size:13px;color:var(--ch);margin-top:8px;padding-top:8px;line-height:1.55;border-top:1px solid rgba(0,0,0,.08)}
/* Loading reusa exactamente el mismo banner que el resultado IA: solo el
   ícono pulsa para indicar actividad, sin cambios de color. */
.ai-result.loading .ai-result-ic{animation:pulse 1.4s ease-in-out infinite}

/* ── Language Dropdown ── */
.lang-dd{position:relative;display:inline-block}
.lang-dd-btn{padding:5px 12px;border-radius:8px;font-size:11px;font-weight:600;border:1.5px solid var(--sd);background:white;color:var(--ch);cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:4px}
.lang-dd-btn .arr{font-size:8px;color:var(--gy);margin-left:2px}
.lang-dd-menu{position:absolute;top:calc(100% + 4px);right:0;background:white;border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.12);z-index:80;overflow:hidden;min-width:120px;border:1px solid rgba(0,0,0,.06)}
.lang-dd-item{padding:10px 14px;font-size:12px;font-weight:500;cursor:pointer;transition:.15s;display:flex;align-items:center;gap:8px;border-bottom:1px solid rgba(0,0,0,.03)}
.lang-dd-item:last-child{border-bottom:none}
.lang-dd-item:hover{background:var(--cr)}
.lang-dd-item.on{font-weight:700;color:var(--f)}
.lang-dd-item .lang-check{width:14px;font-size:12px;color:var(--f)}

/* ── Chips ── */
.cats{display:flex;gap:8px;padding:0 16px 16px;overflow-x:auto;scrollbar-width:none}
.cats::-webkit-scrollbar{display:none}
.chip{display:flex;align-items:center;gap:6px;padding:10px 16px;border-radius:100px;font-size:13px;font-weight:600;white-space:nowrap;cursor:pointer;transition:.25s;border:1.5px solid var(--sd);background:white;color:var(--ch);font-family:inherit}
.chip.on{background:var(--f);color:white;border-color:var(--f)}

.sh{display:flex;justify-content:space-between;align-items:baseline;padding:0 20px;margin-bottom:14px}
.st{font-family:'DM Serif Display',Georgia,serif;font-size:22px}
.sl{font-size:13px;font-weight:600;color:var(--tr);cursor:pointer;border:none;background:none;font-family:inherit}

/* ── Sección "Tours en [ciudad]" con selector ── */
.city-sh{align-items:center}
.city-near{font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-size:13px;color:var(--gy);font-weight:400;letter-spacing:0}
.city-actions{display:flex;align-items:center;gap:12px}
/* Mobile-first: el botón "Ver todos / Ver menos" se oculta en mobile porque
   el carrusel horizontal ya permite navegar todas las cards con swipe. En
   ≥640px (donde .tscr pasa a grid) lo restauramos. */
.city-actions .sl{display:none}
.city-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:999px;border:1.5px solid var(--sd);background:white;color:var(--ch);font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;transition:.2s}
.city-btn:hover{border-color:var(--sg);color:var(--f)}
.city-btn .city-btn-chev{transition:transform .2s}
.city-btn.open .city-btn-chev{transform:rotate(180deg)}
.city-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:90;animation:fadeUp .2s ease-out}
.city-sheet{position:fixed;left:0;right:0;bottom:0;background:white;border-radius:20px 20px 0 0;padding:8px 0 24px;z-index:91;max-height:60vh;overflow-y:auto;animation:slideUp .25s ease-out;box-shadow:0 -8px 32px rgba(0,0,0,.15)}
.city-sheet-grip{width:40px;height:4px;background:var(--sd);border-radius:2px;margin:10px auto 14px}
.city-sheet-title{font-family:'DM Serif Display',Georgia,serif;font-size:18px;padding:0 20px 10px;color:var(--ch)}
.city-sheet-opt{display:flex;justify-content:space-between;align-items:center;padding:14px 20px;cursor:pointer;border:none;background:none;width:100%;font-family:inherit;font-size:14px;font-weight:600;color:var(--ch);text-align:left;transition:background .15s}
.city-sheet-opt:hover{background:var(--cr)}
.city-sheet-opt.on{color:var(--tr)}
.city-sheet-opt .city-sheet-check{color:var(--tr)}
.city-empty{margin:0 16px 24px;padding:32px 20px;background:var(--cr);border-radius:20px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:10px}
.city-empty-ic{width:48px;height:48px;border-radius:50%;background:rgba(199,97,58,.12);color:var(--tr);display:flex;align-items:center;justify-content:center;margin-bottom:4px}
.city-empty-tl{font-family:'DM Serif Display',Georgia,serif;font-size:18px;color:var(--ch);max-width:260px}
.city-empty-sub{font-size:13px;color:var(--gy);max-width:300px;line-height:1.45}
.city-empty-btn{margin-top:8px;padding:10px 18px;border-radius:999px;border:none;background:var(--f);color:white;font-weight:700;font-size:13px;cursor:pointer;font-family:inherit;transition:.2s}
.city-empty-btn:hover{background:var(--m);box-shadow:0 4px 12px rgba(27,58,45,.18)}

/* ── Cards ── */
.tscr{display:flex;gap:14px;padding:0 16px 24px;overflow-x:auto;scrollbar-width:none}
.tscr::-webkit-scrollbar{display:none}
.tc{flex:0 0 260px;border-radius:20px;overflow:hidden;background:white;border:1px solid rgba(0,0,0,.06);cursor:pointer;transition:.25s;box-shadow:0 2px 12px rgba(0,0,0,.06)}
.tc:hover{transform:translateY(-3px);box-shadow:0 8px 24px rgba(0,0,0,.1)}
.tc-img{height:160px;position:relative}
.tc-bdg{position:absolute;top:10px;left:10px;padding:4px 10px;border-radius:100px;font-size:10px;font-weight:700;background:rgba(255,255,255,.95);color:var(--ch);backdrop-filter:blur(10px)}
.tc-bdg.anti{background:var(--f);color:white}
.tc-ver{position:absolute;bottom:10px;left:10px;padding:3px 8px;border-radius:100px;font-size:9px;font-weight:700;background:rgba(45,90,61,.9);color:white}
.tc-b{padding:14px;text-align:center}
.tc-loc{font-size:11px;color:var(--gy);font-weight:600;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px}
.tc-tl{font-size:15px;font-weight:700;margin-bottom:6px;line-height:1.3}
.tc-m{display:flex;align-items:center;justify-content:center;gap:6px;font-size:12px;color:var(--gy);margin-bottom:10px}
.tc-m .rt{color:var(--gd);font-weight:700}
.tc-ft{display:flex;justify-content:center;align-items:center}
.tc-pr{font-size:16px;font-weight:800;color:var(--f)}.tc-pr span{font-size:11px;font-weight:400;color:var(--gy)}

.tg{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:0 16px 120px}
.gc{border-radius:16px;overflow:hidden;background:white;border:1px solid rgba(0,0,0,.06);cursor:pointer;transition:.2s}
.gc:hover{transform:translateY(-2px);box-shadow:0 4px 16px rgba(0,0,0,.08)}
.gc-img{height:120px;position:relative}
.gc-ver{position:absolute;bottom:8px;left:8px;padding:3px 8px;border-radius:100px;font-size:9px;font-weight:700;background:rgba(45,90,61,.9);color:white;display:inline-flex;align-items:center;gap:3px}
.gc-b{padding:10px}
.gc-loc{font-size:10px;color:var(--gy);font-weight:600;text-transform:uppercase;letter-spacing:.3px;margin-bottom:3px}
.gc-t{font-size:13px;font-weight:700;margin-bottom:6px;line-height:1.3}
.gc-p{font-size:14px;font-weight:800;color:var(--f)}.gc-p span{font-size:10px;font-weight:400;color:var(--gy)}
.gc-m{display:flex;align-items:center;justify-content:center;gap:5px;font-size:11px;color:var(--gy);margin-bottom:6px;flex-wrap:wrap}
.gc-m .rt{color:var(--gd);font-weight:700;display:inline-flex;align-items:center;gap:2px}

/* ── Detail ── */
.det{padding-bottom:100px}
.det-hero{height:280px;position:relative;display:flex;flex-direction:column;justify-content:space-between;padding:16px}
/* Gradient con bottom reforzado para garantizar legibilidad del título blanco
   sobre cualquier imagen — incluso playas, mar, platos claros, cielos. */
.det-ov{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.25) 0%,rgba(0,0,0,0) 30%,rgba(0,0,0,0) 50%,rgba(0,0,0,.7) 100%)}
.bk-btn{width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.9);border:none;cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center;z-index:2;position:relative;backdrop-filter:blur(10px);color:var(--ch)}
.det-nfo{position:relative;z-index:2}
.det-bdg{display:inline-block;padding:4px 12px;border-radius:100px;font-size:10px;font-weight:700;background:rgba(255,255,255,.95);color:var(--ch);margin-bottom:8px}
.det-tl{font-family:'DM Serif Display',Georgia,serif;font-size:26px;color:white;line-height:1.2}
/* Título del panel derecho — solo desktop. En mobile el título vive sobre la
   imagen del hero (.det-tl). En desktop el hero es sticky y 100vh, así que el
   título overlaid queda fuera del viewport. Mostramos un H1 en la columna de
   contenido para que sea legible y natural. */
.det-tl-desktop{display:none}
.det-c{padding:20px}
.ai-sum{padding:14px 16px;background:linear-gradient(135deg,rgba(14,165,233,.06),rgba(14,165,233,.02));border:1.5px solid rgba(14,165,233,.15);border-radius:14px;margin-bottom:20px}
.ai-sum-h{display:flex;align-items:center;gap:6px;font-size:10px;font-weight:700;color:var(--ai);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px}
.ai-sum-t{font-size:13px;color:var(--ch);line-height:1.6}
.det-mb{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:20px}
.det-mi{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--ch);font-weight:500}
.mic{font-size:14px;opacity:.7}
.det-ds{font-size:14px;line-height:1.7;color:var(--ch);margin-bottom:20px}
.det-op{display:flex;align-items:center;gap:12px;padding:14px;background:var(--cr);border-radius:14px;margin-bottom:20px}
.det-op-av{width:44px;height:44px;border-radius:12px;background:var(--f);color:white;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:18px;position:relative;flex-shrink:0}
.det-op-n{font-size:14px;font-weight:700}.det-op-d{font-size:11px;color:var(--gy);margin-top:2px}
.det-st{font-size:13px;font-weight:700;color:var(--ch);margin-bottom:10px;text-transform:uppercase;letter-spacing:.5px}
.det-incs{display:flex;flex-direction:column;gap:6px;margin-bottom:20px}
.det-inc{display:flex;align-items:center;gap:10px;font-size:13px}
.det-ic{width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0}
.det-ic.iy{background:rgba(45,90,61,.1);color:var(--m)}.det-ic.in{background:rgba(199,97,58,.1);color:var(--tr)}
.bb{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:none;padding:12px 20px max(env(safe-area-inset-bottom),12px);background:rgba(250,250,247,.95);backdrop-filter:blur(20px);border-top:1px solid rgba(0,0,0,.06);display:flex;align-items:center;gap:14px;z-index:100}
.bb-p{font-size:20px;font-weight:800;color:var(--f);white-space:nowrap}.bb-p span{font-size:12px;font-weight:400;color:var(--gy);display:block}
.bb-bt{flex:1;padding:14px;border-radius:14px;background:var(--f);color:white;font-weight:700;font-size:15px;border:none;cursor:pointer;font-family:inherit;transition:.2s}
.bb-bt:hover{background:var(--m)}

/* ── Booking ── */
.bkf{padding:20px 20px 120px}
.bkf-st{display:flex;gap:6px;margin-bottom:24px}
.bkf-s{flex:1;height:4px;border-radius:2px;background:var(--sd);transition:.3s}
.bkf-s.on{background:var(--f)}
.bkf-t{font-family:'DM Serif Display',Georgia,serif;font-size:24px;margin-bottom:4px}
.bkf-sub{font-size:13px;color:var(--gy);margin-bottom:24px}
/* Ancho fijo para que paso 1 → 2 → 3 no descuadre. Antes había min-height:820px
   pero en mobile generaba hueco vacío gigante en pasos cortos — preferimos
   layout-jump leve entre pasos. */
.bkf-steps{width:100%;box-sizing:border-box;display:block}
.bkf-steps>.fu{width:100%;box-sizing:border-box;display:block}
.bkf{width:100%;box-sizing:border-box}
.fg{margin-bottom:20px}
.lbl{display:block;font-size:12px;font-weight:700;color:var(--gy);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px}
.inp{width:100%;padding:13px 16px;border:2px solid var(--sd);border-radius:14px;font-size:16px;font-family:inherit;background:white;color:var(--ch);outline:none;transition:.2s}
.inp:focus{border-color:var(--m)}
.gctr{display:flex;align-items:center;gap:0;border:2px solid var(--sd);border-radius:14px;overflow:hidden;width:fit-content}
.gbtn{width:44px;height:44px;background:var(--cr);border:none;font-size:20px;cursor:pointer;font-family:inherit;transition:.2s;color:var(--ch)}
.gbtn:hover:not(:disabled){background:var(--sd)}
.gbtn:active:not(:disabled){background:var(--lg)}
.gbtn:disabled{opacity:.4;cursor:not-allowed;color:var(--gy)}
.gcnt{width:60px;text-align:center;font-size:18px;font-weight:700}
.sum{background:var(--cr);border-radius:16px;padding:16px;margin-bottom:20px}
.sum-r{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(0,0,0,.06);font-size:14px}
.sum-r:last-child{border-bottom:none}
.sum-t{display:flex;justify-content:space-between;padding:12px 0 4px;font-size:16px;font-weight:800;color:var(--f)}
.mbtn{width:100%;padding:16px;border-radius:14px;background:var(--f);color:white;font-weight:700;font-size:15px;border:none;cursor:pointer;font-family:inherit;transition:.2s}
.mbtn:hover{background:var(--m)}
.mbtn:disabled{opacity:.4;cursor:not-allowed}
.mbtn.yp{background:var(--yp)}
.pms{display:flex;flex-direction:column;gap:8px;margin-bottom:16px}
.pm{display:flex;align-items:center;gap:12px;padding:14px;border:2px solid var(--sd);border-radius:14px;cursor:pointer;transition:.2s}
.pm.sel{border-color:var(--f);background:rgba(27,58,45,.03)}
.pm-rd{width:18px;height:18px;border-radius:50%;border:2px solid var(--lg);transition:.2s;flex-shrink:0}
.pm.sel .pm-rd{border-color:var(--f);background:var(--f);box-shadow:inset 0 0 0 3px white}
.pm-ic{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:white;flex-shrink:0}
.pm-n{flex:1;font-size:14px;font-weight:600}
.pm-tg{font-size:10px;font-weight:700;color:var(--yp);background:rgba(107,47,160,.1);padding:2px 8px;border-radius:4px}

/* Success */
.suc{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:80vh;padding:40px 24px;text-align:center}
.suc-chk{width:72px;height:72px;border-radius:50%;background:var(--f);color:white;display:flex;align-items:center;justify-content:center;font-size:32px;margin-bottom:20px;animation:pulse .6s ease}
.suc-t{font-family:'DM Serif Display',Georgia,serif;font-size:26px;margin-bottom:8px}
.suc-sub{font-size:14px;color:var(--gy);margin-bottom:24px;line-height:1.6}
.suc-card{width:100%;background:var(--cr);border-radius:16px;padding:16px;margin-bottom:20px;text-align:left}
.suc-row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(0,0,0,.06);font-size:14px}
.suc-row:last-child{border-bottom:none}
.suc-row .l{color:var(--gy)}
.suc-wa{width:100%;padding:14px;border-radius:14px;background:#25D366;color:white;font-weight:700;font-size:14px;border:none;cursor:pointer;font-family:inherit;margin-bottom:10px;transition:.2s}
.suc-wa:hover{background:#1eb954;box-shadow:0 4px 12px rgba(37,211,102,.3)}
.suc-wa:active{transform:translateY(1px)}

/* Voucher (post-pago + detalle de viaje) */
.voucher{width:100%;background:white;border:1px solid rgba(0,0,0,.06);border-radius:16px;overflow:hidden;margin-bottom:20px;text-align:left;box-shadow:0 2px 12px rgba(0,0,0,.04)}
.voucher-sec{padding:16px 18px;border-bottom:1px solid var(--cr)}
.voucher-sec:last-child{border-bottom:none}
.voucher-sec-l{font-size:10px;font-weight:700;color:var(--gy);text-transform:uppercase;letter-spacing:.7px;margin-bottom:10px}
.voucher-tour{font-size:18px;font-weight:800;color:var(--ch);line-height:1.3;margin-bottom:10px}
.voucher-row{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--ch);margin-bottom:6px}
.voucher-row:last-child{margin-bottom:0}
.voucher-row .ic{color:var(--gy);flex-shrink:0;display:inline-flex;align-items:center}
.voucher-note{font-size:11px;color:var(--gy);margin-top:6px;line-height:1.4}
.voucher-link{display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:600;color:var(--tr);text-decoration:none;margin-top:8px}
.voucher-link:hover{text-decoration:underline}
.voucher-list{display:flex;flex-direction:column;gap:8px}
.voucher-item{display:flex;align-items:center;gap:10px;font-size:13px;color:var(--ch)}
.voucher-item .vi-ic{width:20px;height:20px;border-radius:50%;background:rgba(45,90,61,.1);color:var(--m);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.voucher-more{font-size:11px;color:var(--gy);margin-top:8px;font-style:italic}
.voucher-cancel{padding:12px 14px;background:var(--cr);border-radius:10px;border-left:3px solid var(--f)}
.voucher-cancel-t{font-size:12px;font-weight:700;color:var(--f);margin-bottom:4px;display:flex;align-items:center;gap:6px}
.voucher-cancel-d{font-size:12px;color:var(--gy);line-height:1.5}
.voucher-pay-row{display:flex;justify-content:space-between;align-items:center;padding:6px 0;font-size:13px;color:var(--ch)}
.voucher-pay-row .l{color:var(--gy)}
.voucher-pay-row.total{padding-top:10px;margin-top:6px;border-top:1px solid rgba(0,0,0,.08);font-size:15px;font-weight:800;color:var(--f)}
.voucher-pay-row.total .l{color:var(--ch);font-weight:600}
.voucher-code{font-family:monospace;font-size:13px;font-weight:700;color:var(--ch);background:var(--cr);padding:5px 9px;border-radius:6px;letter-spacing:1px}
.voucher-agency-n{font-size:14px;font-weight:700;color:var(--ch);display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.voucher-verified{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:100px;font-size:10px;font-weight:700;background:rgba(45,90,61,.12);color:var(--m)}
.voucher-agency-d{font-size:11px;color:var(--gy);margin-top:6px;line-height:1.4}
.voucher-wa{display:flex;align-items:center;justify-content:center;gap:6px;font-size:12px;font-weight:600;color:var(--gy);text-decoration:none;padding:14px 8px;text-align:center}
.voucher-wa:hover{color:var(--ch)}
.voucher-wa svg{color:#25D366}

/* Trip detail page */
.tdet-page{padding:16px 16px 100px}
.tdet-back{margin-bottom:8px}
.tdet-h{font-family:'DM Serif Display',Georgia,serif;font-size:24px;color:var(--ch);margin-bottom:14px}
.tdet-actions{display:flex;flex-direction:column;gap:8px;margin-top:4px}
.tdet-act-prim{padding:13px 16px;border-radius:14px;background:var(--ch);color:white;font-weight:700;font-size:14px;border:none;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px;transition:.2s}
.tdet-act-prim:hover{background:#000}
.tdet-act-sec{padding:13px 16px;border-radius:14px;background:transparent;color:var(--ch);font-weight:600;font-size:13px;border:1.5px solid var(--lg);cursor:pointer;font-family:inherit;transition:.2s}
.tdet-act-sec:hover{border-color:var(--m)}

/* Booking extras */
.login-banner{background:rgba(212,168,67,.14);border:1px solid rgba(212,168,67,.40);color:#8B6914;padding:12px 14px;font-size:13px;font-weight:600;line-height:1.4;border-radius:12px;margin:0 0 16px;display:flex;align-items:flex-start;gap:10px;text-align:left}
.login-banner svg{flex-shrink:0;margin-top:1px;color:var(--gd)}
.inp-err{border-color:#e53e3e !important;background:rgba(229,62,62,.04) !important}
.inp-err:focus{box-shadow:0 0 0 4px rgba(229,62,62,.18) !important;border-color:#e53e3e !important}
.field-err{font-size:11px;color:#e53e3e;margin-top:4px;font-weight:600;display:flex;align-items:center;gap:4px}
.bk-phone-row{display:flex;gap:0}
.bk-phone-prefix{display:flex;align-items:center;gap:6px;padding:0 12px;border:2px solid var(--sd);border-radius:14px 0 0 14px;font-size:14px;font-weight:600;background:var(--cr);color:var(--ch);border-right:none;white-space:nowrap}
.bk-phone-prefix .wa-ic{color:#25D366;font-size:16px}
.bk-phone-inp{border-radius:0 14px 14px 0 !important}
.bk-sum-tour{font-weight:700;font-size:15px;padding-bottom:4px}
.bk-sum-meta{font-size:13px;color:var(--gy);padding-bottom:8px;border-bottom:1px solid rgba(0,0,0,.06)}

/* ── Notifs ── */
.npage{padding:20px 0 100px}
.npage-h{display:flex;justify-content:space-between;align-items:center;padding:0 20px 16px}
.npage-h h2{font-family:'DM Serif Display',Georgia,serif;font-size:24px}
.npage-h button{font-size:12px;font-weight:600;color:var(--tr);background:none;border:none;cursor:pointer;font-family:inherit}
.ni-item{display:flex;align-items:flex-start;gap:12px;padding:16px 20px;border-bottom:1px solid rgba(0,0,0,.04);cursor:pointer;transition:.15s;position:relative}
.ni-item:hover{background:var(--cr)}
.ni-item.unread{background:rgba(27,58,45,.02)}
.ni-ic{width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--f)}
.ni-ic.ai{background:rgba(14,165,233,.1)}.ni-ic.booking{background:rgba(45,90,61,.1)}.ni-ic.reminder{background:rgba(212,168,67,.1)}.ni-ic.promo{background:rgba(199,97,58,.1)}.ni-ic.review{background:rgba(212,168,67,.1)}.ni-ic.quechua{background:rgba(212,168,67,.1)}
.ni-body{flex:1}
.ni-title{font-size:14px;font-weight:700;margin-bottom:3px}
.ni-text{font-size:12px;color:var(--gy);line-height:1.4}
.ni-time{font-size:11px;color:var(--lg);margin-top:4px}
.ni-dot{width:8px;height:8px;border-radius:50%;background:var(--tr);flex-shrink:0;margin-top:6px}

/* ── Trips ── */
.tp-page{padding:20px 16px 120px}
.tp-h{margin-bottom:20px}.tp-h h2{font-family:'DM Serif Display',Georgia,serif;font-size:28px;color:var(--ch)}.tp-h p{font-size:14px;color:var(--gy);margin-top:4px}
.tp-tabs{display:flex;gap:6px;margin-bottom:16px}
.tp-tab{padding:10px 16px;border-radius:100px;font-size:13px;font-weight:600;border:1.5px solid var(--sd);background:white;color:var(--gy);cursor:pointer;font-family:inherit;transition:.2s}
.tp-tab.on{background:var(--f);color:white;border-color:var(--f)}
.tp-card{display:flex;gap:14px;padding:16px;background:white;border-radius:16px;border:1px solid rgba(0,0,0,.06);margin-bottom:10px;cursor:pointer;transition:.2s;width:100%}
.tp-card:hover{box-shadow:0 2px 12px rgba(0,0,0,.08)}
.tp-img{width:100px;height:100px;border-radius:12px;flex-shrink:0}
.tp-info{flex:1;min-width:0}
.tp-name{font-size:15px;font-weight:700;margin-bottom:4px;color:var(--ch)}
.tp-det{font-size:12px;color:var(--gy);margin-bottom:3px}
.tp-code{font-size:11px;color:var(--lg);font-family:monospace;margin-bottom:6px}
.tp-foot{display:flex;justify-content:space-between;align-items:center}
.tp-price{font-size:15px;font-weight:800;color:var(--f)}
.tp-st{font-size:10px;font-weight:700;padding:3px 8px;border-radius:100px;text-transform:uppercase}
.tp-upcoming{background:rgba(45,90,61,.1);color:var(--m)}.tp-completed{background:rgba(107,143,113,.15);color:var(--sg)}
.tp-rv{padding:10px 16px;background:rgba(212,168,67,.1);border-radius:10px;font-size:13px;font-weight:600;color:#8B6914;margin-bottom:12px;cursor:pointer;text-align:center}

/* ── Reviews ── */
.rev-sec{margin-top:24px;padding-top:24px;border-top:1px solid rgba(0,0,0,.06)}
.rev-hdr{font-family:'DM Serif Display',Georgia,serif;font-size:20px;margin-bottom:16px}
.rev-summary{display:flex;gap:20px;align-items:center;margin-bottom:20px;padding:16px;background:var(--cr);border-radius:14px}
.rev-big{text-align:center;min-width:72px}
.rev-big-n{font-family:'DM Serif Display',Georgia,serif;font-size:36px;color:var(--f);line-height:1}
.rev-big-stars{color:var(--gd);font-size:12px;margin:4px 0 2px}
.rev-big-cnt{font-size:11px;color:var(--gy)}
.rev-bars{flex:1;display:flex;flex-direction:column;gap:4px}
.rev-bar-row{display:flex;align-items:center;gap:8px;font-size:11px;color:var(--gy)}
.rev-bar-row span:first-child{width:12px;text-align:right}
.rev-bar{flex:1;height:6px;background:var(--sd);border-radius:3px;overflow:hidden}
.rev-bar-fill{height:100%;background:var(--gd);border-radius:3px}
.rev-bar-row span:last-child{width:24px;font-size:10px}
.rev-card{padding:14px 0;border-bottom:1px solid rgba(0,0,0,.05)}
.rev-card:last-child{border-bottom:none}
.rev-top{display:flex;align-items:center;gap:10px;margin-bottom:6px}
.rev-av{width:32px;height:32px;border-radius:50%;background:var(--m);color:white;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0}
.rev-author{font-size:13px;font-weight:600}
.rev-date{font-size:11px;color:var(--gy)}
.rev-stars{color:var(--gd);font-size:12px;margin-bottom:4px}
.rev-text{font-size:13px;line-height:1.6;color:var(--ch)}
.rev-more{width:100%;padding:12px;border:1.5px solid var(--sd);border-radius:12px;background:none;font-size:13px;font-weight:600;color:var(--gy);cursor:pointer;font-family:inherit;margin-top:12px;transition:.2s}
.rev-more:hover{border-color:var(--f);color:var(--f)}

/* Review form */
.rv-form{padding:16px;background:var(--cr);border-radius:14px;margin-bottom:12px}
.rv-form-t{font-size:14px;font-weight:700;margin-bottom:12px}
.rv-stars{display:flex;gap:6px;margin-bottom:12px}
.rv-star{width:40px;height:40px;border:none;background:none;font-size:22px;cursor:pointer;padding:0;opacity:.3;transition:.15s;display:flex;align-items:center;justify-content:center}
.rv-star.on{opacity:1}
.rv-textarea{width:100%;padding:11px;border:2px solid var(--sd);border-radius:12px;font-size:16px;font-family:inherit;resize:vertical;min-height:80px;outline:none;transition:.2s}
.rv-textarea:focus{border-color:var(--m)}
.rv-actions{display:flex;gap:8px;margin-top:12px}
.rv-submit{flex:1;padding:12px;border-radius:12px;background:var(--f);color:white;font-weight:700;font-size:13px;border:none;cursor:pointer;font-family:inherit;transition:.2s}
.rv-submit:hover{background:var(--m)}
.rv-submit:disabled{opacity:.4;cursor:not-allowed}
.rv-cancel{padding:12px 16px;border-radius:12px;background:none;border:1.5px solid var(--sd);font-size:13px;font-weight:600;color:var(--gy);cursor:pointer;font-family:inherit}

/* ── Profile ── */
.pf-page{padding-bottom:120px;overflow-x:hidden}
.pf-hdr{padding:24px 20px;text-align:center;border-bottom:1px solid rgba(0,0,0,.06);margin-bottom:20px}
.pf-av{width:72px;height:72px;border-radius:50%;background:var(--f);color:white;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700;margin:0 auto 12px}
.pf-name{font-family:'DM Serif Display',Georgia,serif;font-size:22px;margin-bottom:2px}
.pf-since{font-size:12px;color:var(--gy);margin-bottom:16px}
.pf-stats{display:flex;gap:20px;justify-content:center}
.pf-stat{text-align:center}.pf-stat-v{font-size:20px;font-weight:800;color:var(--f)}.pf-stat-l{font-size:10px;color:var(--gy);text-transform:uppercase;letter-spacing:.5px}
.pf-sec{padding:0 20px;margin-bottom:20px}
.pf-sec-t{font-family:'DM Serif Display',Georgia,serif;font-size:18px;margin-bottom:12px}
.pf-field{display:flex;justify-content:space-between;align-items:center;padding:14px 0;border-bottom:1px solid rgba(0,0,0,.04)}
.pf-field:last-child{border-bottom:none}.pf-field-l{font-size:12px;color:var(--gy);font-weight:600;text-transform:uppercase;letter-spacing:.5px}.pf-field-v{font-size:14px;font-weight:600}
.pf-mi{display:flex;align-items:center;gap:14px;padding:16px 20px;border-bottom:1px solid rgba(0,0,0,.04);cursor:pointer;transition:.15s}
.pf-mi:hover{background:var(--cr)}
.pf-mi-ic{width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--f)}
.pf-mi-txt{flex:1}.pf-mi-t{font-size:14px;font-weight:600}.pf-mi-d{font-size:11px;color:var(--gy);margin-top:1px}
.pf-logout{margin:20px;padding:14px;border-radius:14px;background:none;border:2px solid var(--tr);color:var(--tr);font-weight:700;font-size:14px;cursor:pointer;font-family:inherit;width:calc(100% - 40px);transition:.2s;text-align:center}
.pf-logout:hover{background:var(--tr);color:white}
.pf-ver{text-align:center;padding:16px;font-size:11px;color:var(--lg)}
.pf-op-card{margin:0 20px 20px;padding:18px 20px;background:var(--f);border-radius:14px;color:white;display:flex;align-items:center;justify-content:space-between;cursor:pointer;transition:.2s;min-height:80px}
.pf-op-card:hover{opacity:.9}
.pf-op-left{display:flex;align-items:center;gap:12px;min-width:0;flex:1}
.pf-op-left>div:last-child{min-width:0;flex:1}
.pf-op-ic{width:40px;height:40px;border-radius:12px;background:rgba(255,255,255,.15);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:white}
.pf-op-title{font-size:14px;font-weight:700;white-space:nowrap}
.pf-op-desc{font-size:11px;opacity:.7;margin-top:1px;text-overflow:ellipsis;overflow:hidden}

/* ═══ DASHBOARD ═══ */
.dsh{padding-bottom:100px}
.dsh-h{padding:20px;background:linear-gradient(135deg,var(--f) 0%,#1a4a35 100%);color:white}
.dsh-gr{font-size:14px;opacity:.8}.dsh-nm{font-family:'DM Serif Display',Georgia,serif;font-size:24px;margin:4px 0 6px}
.dsh-sts{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.dsh-s{background:rgba(255,255,255,.12);border-radius:14px;padding:12px;text-align:center}
.dsh-s-v{font-size:22px;font-weight:800}.dsh-s-l{font-size:10px;opacity:.7;text-transform:uppercase;letter-spacing:.5px;margin-top:2px}
.dsh-tabs{display:flex;border-bottom:2px solid var(--sd);padding:0 20px;margin-bottom:16px;overflow-x:auto;scrollbar-width:none}
.dsh-tabs::-webkit-scrollbar{display:none}
.dsh-tab{padding:14px 14px;font-size:12px;font-weight:600;color:var(--gy);cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-2px;white-space:nowrap;background:none;border-top:none;border-left:none;border-right:none;font-family:inherit;transition:.2s}
.dsh-tab.on{color:var(--f);border-bottom-color:var(--f)}
.dsh-bk{margin:0 0 10px;padding:16px;background:white;border-radius:14px;border:1px solid rgba(0,0,0,.06);display:flex;align-items:center;gap:14px;cursor:pointer;transition:.2s;width:100%}
.dsh-bk:hover{box-shadow:0 1px 3px rgba(0,0,0,.06)}
.dsh-bk-av{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:16px;color:white;flex-shrink:0}
.dsh-bk-i{flex:1;min-width:0}.dsh-bk-n{font-size:14px;font-weight:700}.dsh-bk-d{font-size:12px;color:var(--gy);margin-top:2px}
.dsh-bk-r{text-align:right;flex-shrink:0}.dsh-bk-a{font-size:15px;font-weight:800;color:var(--f)}
.dsh-bk-s{display:inline-block;padding:3px 10px;border-radius:100px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;margin-top:4px}
.st-confirmed{background:rgba(45,90,61,.1);color:var(--m)}.st-pending{background:rgba(212,168,67,.15);color:#B8860B}.st-completed{background:rgba(107,143,113,.15);color:var(--sg)}.st-cancelled{background:rgba(199,97,58,.1);color:var(--tr)}

/* AI Content Creator */
.ai-cc{margin:0 0 16px 0;padding:20px;background:linear-gradient(135deg,rgba(45,90,61,.06),rgba(45,90,61,.02));border:1.5px solid rgba(45,90,61,.15);border-radius:16px}
.ai-cc-h{display:flex;align-items:center;gap:8px;margin-bottom:12px}
.ai-cc-h span{font-size:18px}
.ai-cc-h h3{font-size:15px;font-weight:700;color:var(--f)}
.ai-cc-desc{font-size:12px;color:var(--gy);margin-bottom:14px;line-height:1.5}
.ai-cc-input{width:100%;padding:11px;border:1.5px solid var(--sd);border-radius:10px;font-size:16px;font-family:inherit;background:white;color:var(--ch);outline:none;resize:vertical;min-height:70px;transition:.2s}
.ai-cc-input:focus{border-color:var(--m)}
.ai-cc-btn{margin-top:10px;padding:10px 20px;border-radius:100px;background:var(--gd);color:white;font-weight:700;font-size:12px;border:none;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:6px}
.ai-cc-result{margin-top:14px;padding:14px;background:white;border-radius:10px;border:1px solid var(--sd)}
.ai-cc-result-h{font-size:10px;font-weight:700;color:var(--f);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px}
.ai-cc-result-t{font-size:13px;color:var(--ch);line-height:1.6}
.ai-cc-langs{display:flex;gap:6px;margin-top:10px}
.ai-cc-lang{padding:4px 10px;border-radius:100px;font-size:10px;font-weight:600;border:1px solid var(--sd);background:white;cursor:pointer;font-family:inherit}
.ai-cc-lang.on{background:var(--f);color:white;border-color:var(--f)}
.ai-cc-lang.qu{background:var(--gd);color:white;border-color:var(--gd)}

.dsh-ls{margin:0 0 12px 0;padding:16px;background:white;border-radius:14px;border:1px solid rgba(0,0,0,.06);display:flex;gap:14px;width:100%}
.dsh-ls-img{width:80px;height:80px;border-radius:12px;flex-shrink:0}
.dsh-ls-i{flex:1}.dsh-ls-t{font-size:14px;font-weight:700;margin-bottom:4px}.dsh-ls-m{font-size:12px;color:var(--gy);margin-bottom:8px}
.dsh-ls-sts{display:flex;gap:16px}.dsh-ls-st{font-size:12px;display:flex;align-items:center;gap:4px}.dsh-ls-st .v{font-weight:700;color:var(--f)}
.biz-sec{margin:0 0 16px;padding:20px;background:white;border-radius:14px;border:1px solid rgba(0,0,0,.06)}
.biz-sec-t{font-size:15px;font-weight:700;color:var(--f);margin-bottom:16px;display:flex;align-items:center;gap:8px}
.biz-badge{display:inline-flex;align-items:center;gap:4px;padding:4px 12px;border-radius:100px;font-size:11px;font-weight:700}
.biz-badge.ok{background:rgba(45,90,61,.1);color:var(--m)}
.biz-badge.pending{background:rgba(212,168,67,.15);color:#B8860B}
.biz-badge.no{background:rgba(199,97,58,.1);color:var(--tr)}
.biz-note{font-size:12px;color:var(--gy);line-height:1.5;padding:12px;background:var(--cr);border-radius:10px;margin-top:12px}
.biz-radio{display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap}
.biz-radio label{display:flex;align-items:center;gap:6px;padding:10px 16px;border-radius:10px;border:2px solid var(--sd);cursor:pointer;font-size:13px;font-weight:600;transition:.2s}
.biz-radio label.on{border-color:var(--f);background:rgba(45,90,61,.04)}
.biz-doc{display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid rgba(0,0,0,.04)}
.biz-doc:last-child{border-bottom:none}
.biz-doc-name{font-size:13px;font-weight:600;color:var(--ch)}
.biz-doc-r{display:flex;align-items:center;gap:8px}
.biz-doc-btn{padding:6px 12px;border-radius:8px;border:1.5px solid var(--sd);background:white;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;color:var(--gy);transition:.2s}
.biz-doc-btn:hover{border-color:var(--m);color:var(--f)}
.biz-saved{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:var(--m);margin-top:8px}

.earn-tot{margin:0 0 12px;padding:20px;background:var(--f);color:white;border-radius:14px;display:flex;justify-content:space-between;align-items:center;width:100%;box-sizing:border-box}
.earn-chart{margin:0 0 20px;padding:20px;background:white;border-radius:14px;border:1px solid rgba(0,0,0,.06);width:100%;box-sizing:border-box}
.earn-bars{display:flex;align-items:flex-end;gap:12px;height:140px;margin-top:16px}
.earn-bg{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px}
.earn-bc{width:100%;display:flex;gap:3px;align-items:flex-end;height:120px}
.earn-b{flex:1;border-radius:4px 4px 0 0;transition:height .5s;min-height:2px}
.earn-bl{font-size:10px;font-weight:600;color:var(--gy)}
.earn-leg{display:flex;gap:16px;margin-top:16px;padding-top:12px;border-top:1px solid var(--sd)}
.earn-li{display:flex;align-items:center;gap:6px;font-size:11px;color:var(--gy)}.earn-dt{width:8px;height:8px;border-radius:3px}
.earn-rows{margin:0;display:flex;flex-direction:column;gap:8px;width:100%}
.earn-row{display:flex;justify-content:space-between;align-items:center;padding:14px 16px;background:white;border-radius:14px;border:1px solid rgba(0,0,0,.04);width:100%;box-sizing:border-box}

/* ══ DESKTOP NAV LINKS (hidden on mobile) ═══════════ */
.tn-links{display:none;gap:2px;align-items:center}
.tn-link{padding:8px 16px;border-radius:10px;font-size:14px;font-weight:600;color:var(--gy);background:none;border:none;cursor:pointer;font-family:inherit;transition:.2s;position:relative}
.tn-link::after{content:'';position:absolute;bottom:2px;left:16px;right:16px;height:2px;background:var(--f);border-radius:1px;transform:scaleX(0);transition:transform .15s}
.tn-link:hover{color:var(--f)}
.tn-link.on{color:var(--f)}
.tn-link.on::after{transform:scaleX(1)}
.tn-profile{display:none}

/* ══ SITE FOOTER (hidden on mobile) ═════════════════ */
.site-footer{display:none;background:var(--f);color:rgba(255,255,255,.85);padding:56px 0 0;margin-top:0}
.site-footer-inner{max-width:1080px;margin:0 auto;padding:0 40px}
.site-footer-cols{display:grid;grid-template-columns:1.4fr 1fr 1fr 1fr;gap:40px;padding-bottom:40px}
.site-footer-brand .logo{font-size:24px;color:white;margin-bottom:10px;display:block}
.site-footer-brand .logo span{color:var(--trl)}
.site-footer-tagline{font-size:13px;color:rgba(255,255,255,.55);line-height:1.7;max-width:240px}
.site-footer-col-t{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,.7);margin-bottom:16px}
.site-footer-col a,.site-footer-col button{display:block;font-size:13px;color:rgba(255,255,255,.7);text-decoration:none;margin-bottom:10px;cursor:pointer;transition:.15s;background:none;border:none;font-family:inherit;padding:0;text-align:left}
.site-footer-col a:hover,.site-footer-col button:hover{color:white}
.site-footer-copy{font-size:12px;color:rgba(255,255,255,.55);padding:24px 0;border-top:1px solid rgba(255,255,255,.15);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px}
.site-footer-copy-links{display:flex;gap:20px}
.site-footer-copy-links button{font-size:12px;color:rgba(255,255,255,.55);background:none;border:none;cursor:pointer;font-family:inherit;padding:0;transition:.15s}
.site-footer-copy-links button:hover{color:rgba(255,255,255,.6)}

/* ═══ TABLET ≥640px ═════════════════════════════════ */
@media(min-width:640px){
  .login{max-width:520px;margin:0 auto;border-radius:0;overflow:hidden}
  .welcome{max-width:480px;margin:0 auto}

  .hero{height:300px;margin:0;border-radius:0}
  .hero-t{font-size:36px;max-width:500px}
  .hero-c{padding:32px 32px}

  .tn-inner{padding:12px 32px}

  .pg{padding:0 32px}
  .ai-sb{max-width:680px;margin:0 auto 16px}
  .cats{justify-content:center;flex-wrap:wrap;overflow:visible;padding:0 0 20px;gap:10px}

  .tscr{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;
        padding:0 0 32px;overflow:visible}
  .tc{flex:none}

  .sh{padding:0;margin-bottom:20px}
  .tg{gap:16px;padding:0 0 40px}

  /* Botón "Ver todos / Ver menos" solo visible en ≥640px donde .tscr es grid. */
  .city-actions .sl{display:inline-flex;align-items:center;gap:4px}
  /* Cuando la sección no está expandida ocultamos cards 5+ vía CSS para no
     depender de listeners de resize ni de detección de viewport en JS. */
  .city-tscr:not(.expanded) > .tc:nth-child(n+5){display:none}

  /* Selector ciudad: pasa a dropdown anclado al botón (mobile usa bottom sheet) */
  .city-sh{position:relative}
  .city-backdrop{background:transparent}
  .city-sheet{position:absolute;left:auto;right:0;bottom:auto;top:calc(100% + 6px);width:240px;max-height:none;border-radius:14px;padding:6px 0;animation:fadeUp .15s ease-out;box-shadow:0 10px 32px rgba(0,0,0,.15);border:1px solid var(--sd)}
  .city-sheet-grip{display:none}
  .city-sheet-title{display:none}
  .city-sheet-opt{padding:10px 16px;font-size:13px}
  .city-empty{margin:0 0 24px}
  .gc{display:flex;flex-direction:column;height:100%}
  .gc-b{flex:1}
  .gc-img{height:160px}

  .ai-result{max-width:680px;margin:0 auto 16px}
  .bkf{max-width:580px;margin:0 auto;padding:24px 32px 100px}
  .suc{max-width:520px;margin:0 auto}
  .npage{padding:24px 32px 60px}
  .tp-page{padding:24px 32px 60px}
  .pf-page{padding:0 32px 60px}
}

/* ═══ HIDE BOTTOM NAV ≥768px ════════════════════════ */
@media(min-width:768px){
  .bn{display:none !important}
  .tn-links{display:flex}
  .tn-profile{display:flex}
  .tn-inner{padding:12px 40px}
  .bb{left:0;right:0;transform:none;max-width:none;width:auto}
}

/* ═══ DESKTOP ≥1024px ═══════════════════════════════ */
@media(min-width:1024px){
  .login{max-width:none;flex-direction:row;margin:0}
  .login-hero{flex:0 0 50%;max-width:640px;border-radius:0}
  .login-body{flex:1;padding:60px 48px;justify-content:center;max-width:520px;margin:0 auto}
  .welcome{max-width:520px}
  .welcome-features{max-width:400px}

  .tn{height:64px;background:rgba(255,255,255,.98);
      backdrop-filter:blur(20px);margin-left:calc(-50vw + 50%);margin-right:calc(-50vw + 50%);padding-left:calc(50vw - 50%);padding-right:calc(50vw - 50%)}
  .tn-inner{padding:0 48px;max-width:1200px;margin:0 auto;height:100%}
  .tn .logo{font-size:26px}

  .pg{max-width:1080px;margin:0 auto;padding:0 40px}

  .hero{height:400px}
  .hero-c{padding:60px 48px;justify-content:center;align-items:center;
          text-align:center;gap:20px;flex-direction:column}
  .hero-tag{margin:0 auto}
  .hero-t{font-size:48px;max-width:700px;text-align:center}
  .hero-sub{text-align:center;font-size:16px}

  .home-pg{margin-top:-40px;position:relative;z-index:10}
  .home-pg .ai-sb{margin-bottom:40px;background:white;border-radius:50px;
                  box-shadow:0 8px 48px rgba(0,0,0,.16);padding:0}
  .home-pg .ai-sb input{border:none;border-radius:50px;padding:18px 56px;
                         font-size:15px;height:60px}
  .home-pg .ai-sb input:focus{border:none;box-shadow:none}
  .home-pg .ai-sb .ai-sb-ic{left:22px;font-size:18px}
  .home-pg .ai-sb .ai-sb-tag{right:22px}

  .cats{padding:0 0 28px}

  .tscr{grid-template-columns:repeat(4,1fr);gap:20px;padding:0 0 40px}

  .sh{margin-bottom:24px}
  .st{font-size:26px}
  .city-near{font-size:14px}

  .tg{grid-template-columns:repeat(3,1fr);gap:24px;padding:0 0 48px}
  .gc:hover{transform:translateY(-5px);box-shadow:0 16px 40px rgba(0,0,0,.1)}
  .gc-img{height:200px}
  .gc-t{font-size:14px}

  .ai-result{max-width:680px;margin:0 auto 20px}

  .det{display:grid;grid-template-columns:1fr 1fr;padding-bottom:0;align-items:start;max-width:1280px;margin:0 auto}
  /* height ajustada a calc(100vh - 64px) para que el hero quepa exactamente
     en el viewport bajo la nav y el título overlay sea visible (antes con
     100vh el bottom del hero quedaba 64px por debajo del fold). */
  .det-hero{height:calc(100vh - 64px);position:sticky;top:64px;padding:32px 40px}
  /* Pinear el contenedor del título a la esquina inferior izquierda del hero
     decopla el título del flex space-between y de la geometría del grid row,
     evitando que se corte cuando .det-c colapsa o cuando hay sub-pixel issues. */
  .det-hero .det-nfo{position:absolute;bottom:96px;left:40px;right:40px;z-index:2}
  .det-hero .det-tl{font-size:38px;max-width:92%}
  .det-c{padding:32px 40px 100px;max-height:calc(100vh - 64px);overflow-y:auto}
  /* H1 del panel derecho ya no se necesita: el título vuelve a vivir sobre la
     imagen del hero como en mobile, con gradient reforzado para legibilidad. */
  .det-tl-desktop{display:none}

  .bkf{max-width:640px;margin:0 auto;padding:40px 40px 100px}

  .dsh{display:grid;grid-template-columns:220px 1fr;padding-bottom:0;align-items:start;max-width:1280px;margin:0 auto;width:100%}
  .dsh-h{grid-column:1/-1;grid-row:1}
  .dsh-tabs{grid-column:1;grid-row:2;flex-direction:column;border-bottom:none;
            border-right:2px solid var(--sd);padding:16px 0;margin-bottom:0;
            overflow-x:visible;overflow-y:auto;align-items:stretch;
            position:sticky;top:64px;max-height:calc(100vh - 64px);gap:0}
  .dsh-tab{text-align:left;border-bottom:none;border-left:3px solid transparent;
           margin-bottom:0;padding:13px 20px;width:100%;font-size:13px;transition:background .15s}
  .dsh-tab:hover{background:rgba(27,58,45,.04)}
  .dsh-tab.on{color:var(--f);border-left-color:var(--f);border-bottom-color:transparent;background:rgba(27,58,45,.05)}
  .dsh>.fu:not(.dsh-h){grid-column:2;grid-row:2;padding:20px}
  .biz-sec{margin:0 0 16px 0}

  .npage{padding:32px 40px 48px;max-width:1080px;margin:0 auto}
  .tp-page{padding:32px 40px 48px;max-width:960px;margin:0 auto}
  .pf-page{max-width:680px;margin:0 auto;padding:32px 0 48px}
  .pf-logout{margin-left:auto;margin-right:auto;display:block}

  .site-footer{display:block}
}

/* ═══ WIDE DESKTOP ≥1200px ═══════════════════════════ */
@media(min-width:1200px){
  .tg{grid-template-columns:repeat(4,1fr)}
}

/* ── Skeleton loading (Fase 5) ─────────────────────────
   Consume el @keyframes shimmer existente (L649). Las cards
   skeleton reusan .tc / .gc para no introducir CLS. */
.skeleton{
  background:linear-gradient(90deg,#e8e8e8 0%,#f3f3f3 50%,#e8e8e8 100%);
  background-size:200% 100%;
  animation:shimmer 1.4s ease-in-out infinite;
  border-radius:6px;
}
.skel-card{cursor:default;pointer-events:none}
.skel-card:hover{transform:none;box-shadow:0 2px 12px rgba(0,0,0,.06)}
.sk-line{height:12px;margin-bottom:8px;border-radius:6px}
.sk-loc{width:40%;height:9px}
.sk-title{width:85%;height:15px;margin-top:2px}
.sk-meta{width:65%;height:10px;margin-top:10px}
.sk-price{width:35%;height:14px;margin-top:8px}
@media (prefers-reduced-motion: reduce){
  .skeleton{animation:none;background:#efefef}
}
`;

// ── Reusable Components ───────────────────────────────

function TopNav({ onHome, onDash, onNotif, view, unread, isOperator, navActive, onNavClick }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", h, { passive: true });
    h();
    return () => window.removeEventListener("scroll", h);
  }, []);
  return (
    <div className={`tn${scrolled ? " scrolled" : ""}`}>
      <div className="tn-inner">
        <div className="logo" onClick={onHome}>finde<span>.</span></div>
        <div className="tn-links">
          {[{id:"explore",l:"Explorar"},{id:"search",l:"Buscar"},{id:"trips",l:"Mis Viajes"}].map(i => (
            <button key={i.id} className={`tn-link ${navActive===i.id?"on":""}`} onClick={() => onNavClick(i.id)}>{i.l}</button>
          ))}
        </div>
        <div className="tn-r">
          <button className={`tn-btn ${view === "dashboard" ? "on" : ""}`} onClick={onDash} aria-label={view === "dashboard" || view === "new-tour" ? "Inicio" : "Dashboard"} type="button" style={{ visibility: isOperator ? 'visible' : 'hidden' }}>{view === "dashboard" || view === "new-tour" ? <Home size={18} strokeWidth={1.5} /> : <BarChart3 size={18} strokeWidth={1.5} />}</button>
          <button className="tn-btn" onClick={onNotif} aria-label={unread > 0 ? `Notificaciones, ${unread} sin leer` : "Notificaciones"} type="button">{unread > 0 && <span className="ndot" />}<Bell size={18} strokeWidth={1.5} /></button>
          <button className="tn-btn tn-profile" onClick={() => onNavClick("profile")} aria-label="Perfil" type="button"><User size={18} strokeWidth={1.5} /></button>
        </div>
      </div>
    </div>
  );
}

function BNav({ active, go }) {
  return (
    <nav className="bn" aria-label="Navegación principal">
      {[{ id: "explore", ic: Compass, l: "Explorar" }, { id: "search", ic: Search, l: "Buscar" }, { id: "trips", ic: Ticket, l: "Mis Viajes" }, { id: "profile", ic: User, l: "Perfil" }].map((i) => (
        <button key={i.id} className={`bn-i ${active === i.id ? "on" : ""}`} onClick={() => go(i.id)} aria-label={i.l} aria-current={active === i.id ? "page" : undefined} type="button">
          <span className="ni" aria-hidden="true"><i.ic size={20} strokeWidth={1.5} /></span>{i.l}<span className="nd" aria-hidden="true" />
        </button>
      ))}
    </nav>
  );
}

function Footer({ go }) {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-cols">
          <div className="site-footer-brand">
            <div className="logo" onClick={() => go("home")}>finde<span>.</span></div>
            <div className="site-footer-tagline">Descubre experiencias auténticas en todo el Perú. +8,000 tours verificados en 52 destinos.</div>
          </div>
          <div className="site-footer-col">
            <div className="site-footer-col-t">Explorar</div>
            <button onClick={() => go("home")}>Inicio</button>
            <button onClick={() => go("catalog")}>Buscar tours</button>
            <button onClick={() => go("trips")}>Mis viajes</button>
            <button onClick={() => go("notifications")}>Notificaciones</button>
          </div>
          <div className="site-footer-col">
            <div className="site-footer-col-t">Empresa</div>
            <button>Sobre Finde</button>
            <button>Operadores</button>
            <button>Blog</button>
            <button>Contacto</button>
          </div>
          <div className="site-footer-col">
            <div className="site-footer-col-t">Legal</div>
            <button>Términos de uso</button>
            <button>Privacidad</button>
            <button>Cookies</button>
            <button>Centro de ayuda</button>
          </div>
        </div>
        <div className="site-footer-copy">
          <span>© 2026 Finde. Todos los derechos reservados.</span>
          <div className="site-footer-copy-links">
            <button>Hecho en Perú</button>
          </div>
        </div>
      </div>
    </footer>
  );
}

function TCardSkeleton() {
  return (
    <div className="tc skel-card" aria-hidden="true">
      <div className="tc-img skeleton" />
      <div className="tc-b">
        <div className="sk-line skeleton sk-loc" />
        <div className="sk-line skeleton sk-title" />
        <div className="sk-line skeleton sk-meta" />
        <div className="sk-line skeleton sk-price" />
      </div>
    </div>
  );
}

function GCardSkeleton() {
  return (
    <div className="gc skel-card" aria-hidden="true">
      <div className="gc-img skeleton" />
      <div className="gc-b">
        <div className="sk-line skeleton sk-loc" />
        <div className="sk-line skeleton sk-title" />
        <div className="sk-line skeleton sk-meta" />
        <div className="sk-line skeleton sk-price" />
      </div>
    </div>
  );
}

function TCard({ t, onClick }) {
  return (
    <div className="tc" onClick={onClick}>
      <div className="tc-img" style={imgBg(t.image)}>
        {t.verified && <span className="tc-ver"><Check size={12} strokeWidth={2} /> Verificado</span>}
      </div>
      <div className="tc-b">
        <div className="tc-loc">{t.location}</div>
        <div className="tc-tl">{t.title}</div>
        <div className="tc-m"><span className="rt"><Star size={12} strokeWidth={1.5} fill="currentColor" /> {t.rating}</span><span>({t.reviews})</span><span>·</span><span>{t.duration}</span></div>
        <div className="tc-ft"><div className="tc-pr">S/ {t.price} <span>por persona</span></div></div>
      </div>
    </div>
  );
}

function GCard({ t, onClick }) {
  const hasReviews = t.reviews > 0;
  return (
    <div className="gc" onClick={onClick}>
      <div className="gc-img" style={imgBg(t.image)}>
        {t.verified && <span className="gc-ver"><Check size={10} strokeWidth={2} /> Verificado</span>}
      </div>
      <div className="gc-b">
        <div className="gc-loc">{t.location}</div>
        <div className="gc-t">{t.title}</div>
        <div className="gc-m">
          {hasReviews ? (
            <>
              <span className="rt"><Star size={11} strokeWidth={1.5} fill="currentColor" /> {t.rating}</span>
              <span>({t.reviews})</span>
              {t.duration && <><span>·</span><span>{t.duration}</span></>}
            </>
          ) : (
            <>
              <span className="rt">Nuevo</span>
              {t.duration && <><span>·</span><span>{t.duration}</span></>}
            </>
          )}
        </div>
        <div className="gc-p">S/ {t.price} <span>/ pers</span></div>
      </div>
    </div>
  );
}

function LoginView({ go, loginMsg }) {
  const { signInWithPassword, signUpWithPassword } = useAuth();
  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const isSignIn = mode === "signin";
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const validPassword = password.length >= 6;
  const canSubmit = !busy && validEmail && validPassword;

  function translateError(message) {
    const m = (message || "").toLowerCase();
    if (m.includes("invalid login credentials")) return "Email o contraseña incorrectos.";
    if (m.includes("already registered")) return "Ya existe una cuenta con ese email. Intenta iniciar sesión.";
    if (m.includes("email not confirmed")) return "Confirma tu email antes de iniciar sesión.";
    if (m.includes("password should be at least")) return "La contraseña debe tener al menos 6 caracteres.";
    if (m.includes("rate limit") || m.includes("too many")) return "Demasiados intentos. Espera un momento.";
    if (m.includes("invalid email") || m.includes("not a valid email")) return "Email inválido.";
    return "No pudimos completar la operación. Intenta de nuevo.";
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    setError("");
    setBusy(true);
    const fn = isSignIn ? signInWithPassword : signUpWithPassword;
    const { error: authError } = await fn({ email: email.trim(), password });
    setBusy(false);
    if (authError) {
      setError(translateError(authError.message));
      return;
    }
    go(isSignIn ? "home" : "welcome");
  }

  function toggleMode() {
    setMode(isSignIn ? "signup" : "signin");
    setError("");
  }

  return (
    <div className="login fu">
      <div className="login-hero">
        <div className="login-hero-tex" />
        <div className="login-hero-logo">finde<span>.</span></div>
        <div className="login-hero-tagline">El marketplace de tours y experiencias para descubrir el Perú</div>
        <div className="login-hero-stat">
          <div className="login-hero-stat-i"><div className="login-hero-stat-v">8,000+</div><div className="login-hero-stat-l">Experiencias</div></div>
          <div className="login-hero-stat-i"><div className="login-hero-stat-v">52</div><div className="login-hero-stat-l">Destinos</div></div>
          <div className="login-hero-stat-i"><div className="login-hero-stat-v">4.7<Star size={12} strokeWidth={1.5} fill="currentColor" style={{display:"inline",verticalAlign:"middle",marginLeft:2}} /></div><div className="login-hero-stat-l">Promedio</div></div>
        </div>
      </div>
      <div className="login-body">
        {loginMsg && (
          <div className="login-banner" role="status">
            <Info size={16} strokeWidth={2} aria-hidden="true" />
            <span>{loginMsg}</span>
          </div>
        )}

        <div className="login-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={isSignIn}
            className={`login-tab ${isSignIn ? "on" : ""}`}
            onClick={() => { if (!isSignIn) toggleMode(); }}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={!isSignIn}
            className={`login-tab ${!isSignIn ? "on" : ""}`}
            onClick={() => { if (isSignIn) toggleMode(); }}
          >
            Crear cuenta
          </button>
        </div>

        <div className="login-title">{isSignIn ? "Inicia sesión" : "Crea tu cuenta"}</div>
        <div className="login-sub">
          {isSignIn ? "Ingresa con tu email y contraseña" : "Regístrate con email y contraseña para empezar"}
        </div>

        <input
          className="login-input"
          type="email"
          autoComplete="email"
          placeholder="tucorreo@ejemplo.com"
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (error) setError(""); }}
          style={{ marginBottom: 10 }}
        />

        <div style={{ position: "relative", marginBottom: 12 }}>
          <input
            className="login-input"
            type={showPassword ? "text" : "password"}
            autoComplete={isSignIn ? "current-password" : "new-password"}
            placeholder="Contraseña (mínimo 6 caracteres)"
            value={password}
            onChange={(e) => { setPassword(e.target.value); if (error) setError(""); }}
            onKeyDown={(e) => { if (e.key === "Enter" && canSubmit) handleSubmit(); }}
            style={{ paddingRight: 44 }}
          />
          <button
            type="button"
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            onClick={() => setShowPassword((s) => !s)}
            style={{
              position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
              background: "transparent", border: 0, cursor: "pointer", padding: 6,
              color: "#8A8A85", display: "flex", alignItems: "center",
            }}
          >
            {showPassword ? <EyeOff size={18} strokeWidth={1.5} /> : <Eye size={18} strokeWidth={1.5} />}
          </button>
        </div>

        {error && (
          <div className="login-banner" style={{ background: "rgba(199,97,58,0.12)", color: "#C7613A" }}>
            {error}
          </div>
        )}

        <button
          className="login-btn"
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          {busy ? "..." : isSignIn ? "Entrar" : "Crear cuenta"}
        </button>

        <div className="login-divider">o</div>
        <button className="login-skip" onClick={() => go("home")}>Explorar sin cuenta</button>

        {/* TODO(M1 sub-paso 8): enlace "¿Eres agencia de turismo?" para onboarding de operador. */}

        <div className="login-terms">Al continuar, aceptas los <a href="#">Términos de uso</a> y la <a href="#">Política de privacidad</a> de Finde</div>
      </div>
    </div>
  );
}

function WelcomeView({ go }) {
  return (
    <div className="welcome fu">
      <div className="welcome-check"><Check size={24} strokeWidth={2.5} /></div>
      <div className="welcome-title">¡Bienvenida, Alejandra!</div>
      <div className="welcome-sub">Tu cuenta está lista. Esto es lo que puedes hacer en Finde:</div>
      <div className="welcome-features">
        <div className="welcome-feat"><div className="welcome-feat-ic" style={{ background: "rgba(45,90,61,.1)" }}><Search size={20} strokeWidth={1.5} /></div><div className="welcome-feat-txt">Buscar experiencias con inteligencia artificial</div></div>
        <div className="welcome-feat"><div className="welcome-feat-ic" style={{ background: "rgba(107,42,160,.1)" }}><Heart size={20} strokeWidth={1.5} /></div><div className="welcome-feat-txt">Coordina y paga con la agencia por WhatsApp</div></div>
        <div className="welcome-feat"><div className="welcome-feat-ic" style={{ background: "rgba(37,211,102,.1)" }}><MessageCircle size={20} strokeWidth={1.5} /></div><div className="welcome-feat-txt">Recibir confirmaciones por WhatsApp</div></div>
        <div className="welcome-feat"><div className="welcome-feat-ic" style={{ background: "rgba(212,168,67,.1)" }}><Languages size={20} strokeWidth={1.5} /></div><div className="welcome-feat-txt">Tours disponibles en quechua</div></div>
      </div>
      <button className="login-btn" onClick={() => go("home")}>Empezar a explorar</button>
    </div>
  );
}

function CitySelector({ selectedCity, onPick }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    // setTimeout 0 evita que el mismo click que abre cierre el sheet.
    const t = setTimeout(() => window.addEventListener("mousedown", onClick), 0);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
      clearTimeout(t);
    };
  }, [open]);

  const handlePick = (city) => {
    onPick(city);
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        className={`city-btn ${open ? "open" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <MapPin size={14} strokeWidth={1.5} />
        {selectedCity}
        <ChevronDown className="city-btn-chev" size={14} strokeWidth={1.5} />
      </button>
      {open && (
        <>
          <div className="city-backdrop" onClick={() => setOpen(false)} />
          <div className="city-sheet" role="listbox" aria-label="Elegir ciudad">
            <div className="city-sheet-grip" />
            <div className="city-sheet-title">Elige tu ciudad</div>
            {SUPPORTED_CITIES.map((c) => (
              <button
                key={c}
                type="button"
                role="option"
                aria-selected={c === selectedCity}
                className={`city-sheet-opt ${c === selectedCity ? "on" : ""}`}
                onClick={() => handlePick(c)}
              >
                <span>{c}</span>
                {c === selectedCity && (
                  <Check className="city-sheet-check" size={16} strokeWidth={2} />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function HomeView({ go, pick, cat, setCat, tours, toursLoading, selectedCity, setSelectedCity, geoSource }) {
  const [cityExpanded, setCityExpanded] = useState(false);
  const filt = cat === "all" ? tours : tours.filter((t) => t.category === cat);
  const feat = [...filt].sort((a, b) => b.rating - a.rating || b.reviews - a.reviews).slice(0, 4);
  // Todos los tours de la ciudad ordenados por rating desc (sin rating al final).
  // Renderizamos siempre todos: en mobile el .tscr es carrusel horizontal y
  // muestra todos por swipe natural. En ≥640px el CSS oculta las cards 5+
  // cuando .city-tscr no tiene la clase .expanded.
  const allCityTours = toursByCity(filt, selectedCity)
    .slice()
    .sort((a, b) => (b.rating || 0) - (a.rating || 0));
  // Cambiar de ciudad colapsa la sección para que el usuario no aterrice
  // expandido en una ciudad nueva. Aplica tanto al CitySelector como al
  // botón "Ver tours en Lima" del empty state.
  const handleCityChange = (c) => {
    setCityExpanded(false);
    setSelectedCity(c);
  };
  return (
    <div>
      <div className="hero fu"><div className="hero-tex" /><div className="hero-c">
        <div><div className="hero-tag"><Sparkles size={12} strokeWidth={1.5} style={{display:"inline",verticalAlign:"middle",marginRight:4}} />FERIADO LARGO · 1-4 MAYO</div></div>
        <div><div className="hero-t">Descubre el Perú que no conoces</div><div className="hero-sub">+8,000 experiencias verificadas en 52 destinos</div></div>
      </div></div>
      <div className="home-pg pg">
        <div className="ai-sb fd1">
          <span className="ai-sb-ic"><Search size={16} strokeWidth={1.5} /></span>
          <input placeholder="¿A dónde quieres ir?" readOnly onFocus={() => go("catalog")} />
          <span className="ai-sb-tag"><Sparkles size={12} strokeWidth={1.5} /> IA</span>
        </div>
        <div className="cats fd2">{CATS.map((c) => <button key={c.id} className={`chip ${cat === c.id ? "on" : ""}`} onClick={() => setCat(c.id)}><c.ic size={16} strokeWidth={1.5} /> {c.n}</button>)}</div>
        <div className="sh fd2"><div className="st">Populares este mes</div><button className="sl" onClick={() => go("catalog")}>Ver todos <ArrowRight size={12} strokeWidth={1.5} style={{verticalAlign:"middle"}} /></button></div>
        <div className="tscr fd3">{toursLoading ? Array.from({ length: 4 }).map((_, i) => <TCardSkeleton key={i} />) : feat.map((t) => <TCard key={t.id} t={t} onClick={() => { pick(t); go("detail"); }} />)}</div>
        <div className="sh city-sh" style={{ marginTop: 8 }}>
          <div className="st">
            Tours en {selectedCity}
            {geoSource === "geo" && <span className="city-near"> · cerca de ti</span>}
          </div>
          <div className="city-actions">
            {allCityTours.length > 4 && (
              <button className="sl" onClick={() => setCityExpanded((v) => !v)}>
                {cityExpanded ? "Ver menos" : (
                  <>Ver todos <ArrowRight size={12} strokeWidth={1.5} style={{verticalAlign:"middle"}} /></>
                )}
              </button>
            )}
            <CitySelector selectedCity={selectedCity} onPick={handleCityChange} />
          </div>
        </div>
        {toursLoading ? (
          <div className="tscr">
            {Array.from({ length: 4 }).map((_, i) => <TCardSkeleton key={i} />)}
          </div>
        ) : allCityTours.length > 0 ? (
          <div className={`tscr city-tscr${cityExpanded ? " expanded" : ""}`}>
            {allCityTours.map((t) => (
              <TCard key={t.id} t={t} onClick={() => { pick(t); go("detail"); }} />
            ))}
          </div>
        ) : (
          <div className="city-empty">
            <div className="city-empty-ic"><MapPin size={22} strokeWidth={1.5} /></div>
            <div className="city-empty-tl">Pronto tendremos experiencias en {selectedCity}</div>
            <div className="city-empty-sub">Estamos sumando operadores verificados. Mientras tanto, mira los tours de Lima.</div>
            <button type="button" className="city-empty-btn" onClick={() => handleCityChange("Lima")}>
              Ver tours en Lima
            </button>
          </div>
        )}
        <div className="sh" style={{ marginTop: 8 }}><div className="st">Explora experiencias</div></div>
        <div className="tg">{toursLoading ? Array.from({ length: 8 }).map((_, i) => <GCardSkeleton key={i} />) : filt.map((t) => <GCard key={t.id} t={t} onClick={() => { pick(t); go("detail"); }} />)}</div>
      </div>
    </div>
  );
}

function CatalogView({ go, pick, cat, setCat, tours, toursLoading }) {
  const [q, setQ] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [localResults, setLocalResults] = useState([]);
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [geminiIds, setGeminiIds] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [apiReasoning, setApiReasoning] = useState("");
  // hasSearched evita que aparezca "No se encontraron resultados" en la
  // pantalla vacía inicial. Se prende con la primera búsqueda real (Enter,
  // dispatch IA, o sugerencia clickeada) y se apaga al limpiar el query.
  const [hasSearched, setHasSearched] = useState(false);
  const geminiTimer = useRef(null);
  const searchRef = useRef(null);
  const fullSearch = q.length >= 2 ? searchTours(tours, q, cat) : null;
  const filt = aiResult
    ? tours.filter(t => aiResult.results.includes(t.id))
    : geminiIds
      ? geminiIds.map(id => tours.find(t => t.id === id)).filter(Boolean)
      : fullSearch
        ? fullSearch.results
        : cat === "all" ? tours : tours.filter(t => t.category === cat);
  const handleAiSearch = (suggestion) => { setQ(suggestion.query); setShowDropdown(false); setAiResult(suggestion); setGeminiIds(null); setHasSearched(true); };

  // Búsqueda IA reusable: la llama el debounce desde handleChange y también
  // Enter (que cancela el timer pendiente y dispara la búsqueda al toque).
  // Combina los 3 tours top de Claude con los matches locales relevantes para
  // que el grid no quede limitado a 3 cards (api/search devuelve top_3_ids).
  const runAiSearch = async (value) => {
    setShowDropdown(false);
    setHasSearched(true);
    setGeminiLoading(true);
    try {
      const r = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: value }),
      });
      if (r.ok) {
        const data = await r.json();
        const apiIds = (data.results || []).map(t => t.id);
        const local = searchTours(tours, value, cat).results;
        if (apiIds.length > 0) {
          // Merge: top 3 de Claude primero (más relevantes), luego matches
          // locales que no estén en la respuesta IA (para abundancia).
          const apiSet = new Set(apiIds);
          const localExtras = local.filter(t => !apiSet.has(t.id)).slice(0, 12);
          const combinedIds = [...apiIds, ...localExtras.map(t => t.id)];
          const apiTours = apiIds.map(id => tours.find(t => t.id === id)).filter(Boolean);
          const localNotInApi = local.filter(t => !apiSet.has(t.id));
          // Setear todo ANTES de bajar geminiLoading para evitar frame con
          // loading=false + grid vacía.
          setGeminiIds(combinedIds);
          setApiReasoning(data.reasoning || "");
          setLocalResults([...apiTours, ...localNotInApi].slice(0, 5));
        } else {
          // Backend respondió pero sin matches IA. Guardamos el reasoning
          // ("Por ahora no encontramos…") para mostrarlo como análisis.
          setApiReasoning(data.reasoning || "");
        }
      }
    } catch { /* silent fallback */ }
    setGeminiLoading(false);
  };

  const handleChange = (value) => {
    setQ(value);
    setGeminiIds(null);
    setAiResult(null);
    if (geminiTimer.current) clearTimeout(geminiTimer.current);
    if (value.trim().length < 2) {
      setLocalResults([]);
      setShowDropdown(false);
      setHasSearched(false);
      return;
    }
    const { results, hasKeywordMatch } = searchTours(tours, value, cat);
    setLocalResults(results.slice(0, 5));
    setShowDropdown(true);
    const wordCount = value.trim().split(/\s+/).filter(Boolean).length;
    // 3+ palabras siempre dispara IA. Antes había una condición secundaria
    // (solo si búsqueda local no matcheaba) que cortocircuitaba la IA en
    // queries naturales como "que hacer en cusco este fin de semana".
    if (wordCount >= 3) {
      geminiTimer.current = setTimeout(() => runAiSearch(value), 800);
    }
    // Silenciar warning de unused: hasKeywordMatch ya no se usa para gatear IA.
    void hasKeywordMatch;
  };
  const handleFocus = () => {
    if (geminiLoading) return;
    if (q.trim().length >= 2) {
      const { results } = searchTours(tours, q, cat);
      setLocalResults(results.slice(0, 5));
    } else {
      // Input vacío: limpiamos localResults stale para que
      // el dropdown muestre solo AI_SUGGESTIONS (sugerencias
      // curadas), NO los top-3 por reviews (esa rama causaba
      // el "dropdown fantasma" del commit a3cf9a6).
      setLocalResults([]);
    }
    setShowDropdown(true);
  };
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setShowDropdown(false);
      e.currentTarget.blur();
      const value = q.trim();
      if (value.length < 2) return;
      setHasSearched(true);
      // Si hay búsqueda IA pendiente en debounce, dispárala YA en lugar de
      // esperar los 800ms — evita el flash de grid vacía mientras se carga.
      if (geminiTimer.current) {
        clearTimeout(geminiTimer.current);
        geminiTimer.current = null;
      }
      const wordCount = value.split(/\s+/).filter(Boolean).length;
      // 3+ palabras → IA siempre, sin condición secundaria (la regla del
      // producto es "consulta natural = IA", no "IA solo si local falla").
      if (wordCount >= 3) {
        runAiSearch(value);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setShowDropdown(false);
      e.currentTarget.blur();
    }
  };
  useEffect(() => { return () => { if (geminiTimer.current) clearTimeout(geminiTimer.current); }; }, []);
  // Click/tap fuera del contenedor del buscador → cerrar dropdown.
  useEffect(() => {
    const onPointerDown = (ev) => {
      if (searchRef.current && !searchRef.current.contains(ev.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);
  const isPopular = q.trim().length < 2;
  const hasResults = localResults.length > 0;
  const dropdownOpen = showDropdown && !geminiLoading;
  return (
    <div>
      <div className="pg catalog-pg">
        <div className="ai-sb" style={{ marginTop: 8 }} ref={searchRef}>
          <span className="ai-sb-ic"><Search size={16} strokeWidth={1.5} /></span>
          <input placeholder="¿Qué quieres hacer? ¿A dónde ir?"
            value={q}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown} />
          <span className="ai-sb-tag"><Sparkles size={12} strokeWidth={1.5} /> IA</span>
          {dropdownOpen && (
            <div className="ai-suggest">
              {isPopular && hasResults && <div className="ai-suggest-h">Búsquedas populares</div>}
              {!isPopular && geminiLoading && <div className="sr-ai-hint"><Sparkles size={12} strokeWidth={1.5} /> Buscando con IA...</div>}
              {hasResults ? localResults.map(t => (
                <div key={t.id} className="sr-item" onMouseDown={(e) => { e.preventDefault(); pick(t); go("detail"); }}>
                  <div className="sr-thumb" style={imgBg(t.image)} />
                  <div className="sr-info"><div className="sr-name">{t.title}</div><div className="sr-loc">{t.location}</div></div>
                  <div className="sr-meta"><div className="sr-price">S/ {t.price}</div><div className="sr-rating">{Array.from({length: Math.round(t.rating)}, (_,i) => <Star key={i} size={10} strokeWidth={1.5} fill="currentColor" />)} {t.rating}</div></div>
                </div>
              )) : !isPopular && !geminiLoading && (
                <>
                  <div className="sr-noresults">No encontramos tours para &ldquo;{q}&rdquo;. Prueba con:</div>
                  <div className="sr-pills">{CATS.filter(c => c.id !== "all").map(c => (
                    <button key={c.id} className="chip" onMouseDown={(e) => { e.preventDefault(); setCat(c.id); setQ(""); setGeminiIds(null); setAiResult(null); setShowDropdown(false); }}><c.ic size={16} strokeWidth={1.5} /> {c.n}</button>
                  ))}</div>
                </>
              )}
              {!isPopular && hasResults && fullSearch && (
                <div className="sr-viewall" onMouseDown={(e) => { e.preventDefault(); setShowDropdown(false); }}>Ver todos los resultados ({fullSearch.results.length})</div>
              )}
              {isPopular && (
                <>
                  <div className="ai-suggest-h" style={{ marginTop: 4 }}><Sparkles size={14} strokeWidth={1.5} /> Sugerencias inteligentes</div>
                  {AI_SUGGESTIONS.map((s, i) => (
                    <div key={i} className="ai-suggest-i" onMouseDown={(e) => { e.preventDefault(); handleAiSearch(s); }}>
                      <div className="ai-suggest-q">{s.query}</div>
                      <div className="ai-suggest-r">{s.reason}</div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
        {aiResult && (
          <div className="ai-result">
            <div className="ai-result-ic"><Sparkles size={16} strokeWidth={1.5} /></div>
            <div><div className="ai-result-t">Finde encontró {filt.length} experiencias</div><div className="ai-result-b">&ldquo;{aiResult.query}&rdquo; — {aiResult.reason}</div></div>
            <button className="sr-clear" onClick={() => { setAiResult(null); setQ(""); }}><X size={16} strokeWidth={1.5} /></button>
          </div>
        )}
        {geminiIds && !aiResult && (
          <div className="ai-result">
            <div className="ai-result-ic"><Sparkles size={16} strokeWidth={1.5} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="ai-result-t">IA encontró {filt.length} experiencias</div>
              <div className="ai-result-b">para &ldquo;{q}&rdquo;</div>
              {apiReasoning && <div className="ai-result-x">{apiReasoning}</div>}
            </div>
            <button className="sr-clear" onClick={() => { setGeminiIds(null); setApiReasoning(""); }}><X size={16} strokeWidth={1.5} /></button>
          </div>
        )}
        <div className="cats">{CATS.map((c) => <button key={c.id} className={`chip ${cat === c.id ? "on" : ""}`} onClick={() => { setCat(c.id); setQ(""); setGeminiIds(null); setAiResult(null); setLocalResults([]); setHasSearched(false); }}><c.ic size={16} strokeWidth={1.5} /> {c.n}</button>)}</div>
        {geminiLoading && (
          <div className="ai-result loading">
            <div className="ai-result-ic"><Sparkles size={16} strokeWidth={1.5} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="ai-result-t">Buscando con IA…</div>
              <div className="ai-result-b">Analizando tu consulta para encontrar las mejores experiencias</div>
            </div>
          </div>
        )}
        {!geminiLoading && hasSearched && filt.length === 0 && apiReasoning && (
          <div className="ai-result">
            <div className="ai-result-ic"><Sparkles size={16} strokeWidth={1.5} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="ai-result-t">No se encontraron resultados con IA</div>
              <div className="ai-result-b">para &ldquo;{q}&rdquo;</div>
              <div className="ai-result-x">{apiReasoning}</div>
            </div>
            <button className="sr-clear" onClick={() => { setApiReasoning(""); }}><X size={16} strokeWidth={1.5} /></button>
          </div>
        )}
        {toursLoading ? (
          <>
            <div style={{ paddingBottom: 12, fontSize: 13, color: "var(--gy)" }}>Cargando experiencias…</div>
            <div className="tg">{Array.from({ length: 8 }).map((_, i) => <GCardSkeleton key={i} />)}</div>
          </>
        ) : !geminiLoading && !(hasSearched && filt.length === 0 && apiReasoning) && (hasSearched && filt.length === 0 ? (
          <div style={{ padding: "32px 16px 24px", textAlign: "center", color: "var(--gy)", minHeight: 180 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ch)", marginBottom: 6 }}>No se encontraron resultados</div>
            <div style={{ fontSize: 12, lineHeight: 1.5 }}>Prueba con otras palabras o explora por categoría.</div>
          </div>
        ) : (
          <>
            <div style={{ paddingBottom: 12, fontSize: 13, color: "var(--gy)" }}>{filt.length} experiencias verificadas</div>
            <div className="tg">{filt.map((t) => <GCard key={t.id} t={t} onClick={() => { pick(t); go("detail"); }} />)}</div>
          </>
        ))}
      </div>
    </div>
  );
}

function DetailView({ tour, go, pick, onBook, reviews }) {
  const [lang, setLang] = useState("es");
  const [langOpen, setLangOpen] = useState(false);
  const [showAllRevs, setShowAllRevs] = useState(false);
  const [quechuaByTour, setQuechuaByTour] = useState({});
  const [quechuaLoading, setQuechuaLoading] = useState(false);
  const [quechuaError, setQuechuaError] = useState("");
  const quechuaText = (tour?.id && quechuaByTour[tour.id]) || tour?.descQu || "";

  useEffect(() => {
    if (lang !== "qu") return;
    if (!tour?.id) return;
    if (quechuaByTour[tour.id]) return;
    if (tour.descQu) return;
    if (!tour.desc || tour.desc.length < 50) return;

    let cancel = false;
    (async () => {
      setQuechuaError("");
      setQuechuaLoading(true);
      try {
        const r = await fetch("/api/ai/generate-quechua", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ spanishText: tour.desc }),
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const d = await r.json();
        if (!cancel) {
          setQuechuaByTour(prev => ({ ...prev, [tour.id]: d.quechuaText || "" }));
        }
      } catch {
        if (!cancel) setQuechuaError("No pudimos traducir al quechua. Intenta de nuevo.");
      } finally {
        if (!cancel) setQuechuaLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [lang, tour?.id]);

  if (!tour) return null;
  const isQu = lang === "qu";
  const langLabels = { es: "Español", qu: "Quechua", en: "English" };
  const langFlags = { es: "PE", qu: "QU", en: "EN" };
  // Tours locales (id 1-14) usan REVIEWS curadas. Para tours del API (CUIDs)
  // generamos reseñas determinísticas para no romper la coherencia con el
  // contador del header (rating "4.9 (221)" no debe quedar sin reseñas).
  const realRevs = reviews[tour.id];
  const tourRevs = (realRevs && realRevs.length > 0)
    ? realRevs
    : (tour.reviews > 0 ? generateMockReviews(tour) : []);
  const visibleRevs = showAllRevs ? tourRevs : tourRevs.slice(0, 3);
  // Conteo total visible y distribución se calculan sobre tour.reviews (dato real),
  // no sobre tourRevs.length (que son sólo las muestras renderizadas: 3-4). Así el
  // header "(221)" coincide con la sección y las barras se ven proporcionales.
  const totalReviews = Number(tour.reviews) || 0;
  const useRealCounts = totalReviews > 0 && totalReviews === tourRevs.length;
  const starCounts = useRealCounts
    ? [5, 4, 3, 2, 1].map(s => ({ star: s, count: tourRevs.filter(r => r.rating === s).length }))
    : distributeStars(tour.rating, totalReviews);
  const maxCount = Math.max(...starCounts.map(s => s.count), 1);
  return (
    <div className="det">
      <div className="det-hero" style={imgBg(tour.image)}><div className="det-ov" />
        <button className="bk-btn" onClick={() => go("home")} aria-label="Volver al inicio" type="button"><ArrowLeft size={20} strokeWidth={1.5} /></button>
        <div className="det-nfo">
          <div className="det-tl">{isQu ? tour.titleQu : tour.title}</div>
        </div>
      </div>
      <div className="det-c fu">
        <h1 className="det-tl-desktop">{isQu ? tour.titleQu : tour.title}</h1>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
          <div className="lang-dd">
            <button className="lang-dd-btn" onClick={() => setLangOpen(!langOpen)}>
              {langFlags[lang]} {langLabels[lang]} <span className="arr"><ChevronDown size={14} strokeWidth={1.5} /></span>
            </button>
            {langOpen && (
              <div className="lang-dd-menu">
                {[["es", "PE", "Español"], ["qu", "QU", "Quechua"], ["en", "EN", "English"]].map(([id, flag, label]) => (
                  <div key={id} className={`lang-dd-item ${lang === id ? "on" : ""}`} onClick={() => { setLang(id); setLangOpen(false); }}>
                    <span>{flag}</span> {label}<span className="lang-check">{lang === id ? <Check size={12} strokeWidth={2} /> : ""}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="ai-sum">
          <div className="ai-sum-h"><Sparkles size={14} strokeWidth={1.5} /> Resumen de {tour.reviews} reseñas</div>
          <div className="ai-sum-t">{tour.aiSummary}</div>
        </div>
        {(() => {
          // Sólo mostramos la altitud cuando el dato es significativo. Tours
          // costeños/citadinos vienen con "" o "0" y el bloque "↑ m" suelto
          // queda vacío y feo.
          const altRaw = (tour.altitude || "").toString().trim();
          const altNum = parseInt(altRaw.replace(/,/g, ""), 10);
          const hasAltitude = altRaw && altRaw !== "—" && !isNaN(altNum) && altNum > 0;
          return (
            <div className="det-mb">
              <div className="det-mi"><span className="mic"><MapPin size={14} strokeWidth={1.5} /></span>{tour.location}</div>
              <div className="det-mi"><span className="mic"><Timer size={14} strokeWidth={1.5} /></span>{tour.duration}</div>
              <div className="det-mi"><span className="mic"><Star size={14} strokeWidth={1.5} fill="currentColor" /></span>{tour.rating} ({tour.reviews})</div>
              {hasAltitude && (
                <div className="det-mi"><span className="mic"><ArrowUp size={14} strokeWidth={1.5} /></span>{tour.altitude} m</div>
              )}
              <div className="det-mi"><span className="mic"><Users size={14} strokeWidth={1.5} /></span>Max {tour.capacity}</div>
              <div className="det-mi"><span className="mic"><Dumbbell size={14} strokeWidth={1.5} /></span>{tour.difficulty}</div>
            </div>
          );
        })()}
        <p className="det-ds">
          {isQu
            ? (quechuaText
                || (quechuaLoading ? "Traduciendo a quechua…" : (quechuaError || tour.desc)))
            : tour.desc}
        </p>
        <div className="det-op">
          <div className="det-op-av">{tour.operator[0]}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="det-op-n">{tour.operator}</div>
            <div className="det-op-d">
              {tour.verified
                ? <><ShieldCheck size={14} strokeWidth={1.5} /> Finde Verificado</>
                : "Operador Finde Basic"}
            </div>
            {/* RUC/MINCETUR hardcodeados (falsos) eliminados: misma credencial
                inventada que se mostraba en el voucher. La confianza real es el
                badge "Finde Verificado" (solo si operator.verified). */}
          </div>
        </div>
        <div className="det-st">{isQu ? "Imapas chaypi kan" : "Incluye"}</div>
        <div className="det-incs">
          {(Array.isArray(tour.included) ? tour.included : []).map((x, i) => <div key={i} className="det-inc"><div className="det-ic iy"><Check size={14} strokeWidth={2} /></div>{x}</div>)}
          {(Array.isArray(tour.excluded) ? tour.excluded : []).map((x, i) => <div key={i} className="det-inc"><div className="det-ic in"><X size={14} strokeWidth={2} /></div>{x}</div>)}
        </div>
        {SHOW_CANCELLATION_POLICY && (() => {
          const pol = getCancelPolicy(tour.cancellation);
          return (
            <div style={{ padding: 14, background: "var(--cr)", borderRadius: 12, marginBottom: 20, borderLeft: "3px solid var(--f)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--f)", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                <ShieldCheck size={14} strokeWidth={1.5} /> Política de cancelación: {pol.label}
              </div>
              <div style={{ fontSize: 12, color: "var(--gy)", lineHeight: 1.5 }}>{pol.short}</div>
            </div>
          );
        })()}
        {totalReviews > 0 && (
          <div className="rev-sec">
            <div className="rev-hdr">Reseñas de viajeros ({totalReviews})</div>
            <div className="rev-summary">
              <div className="rev-big">
                <div className="rev-big-n">{tour.rating}</div>
                <div className="rev-big-stars">{Array.from({length:5},(_,i)=><Star key={i} size={14} strokeWidth={1.5} fill={i < Math.round(tour.rating) ? "currentColor" : "none"} />)}</div>
                <div className="rev-big-cnt">{totalReviews} reseñas</div>
              </div>
              <div className="rev-bars">
                {starCounts.map(s => (
                  <div key={s.star} className="rev-bar-row">
                    <span>{s.star}</span>
                    <div className="rev-bar"><div className="rev-bar-fill" style={{ width: `${(s.count / maxCount) * 100}%` }} /></div>
                    <span>{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
            {visibleRevs.map(r => (
              <div key={r.id} className="rev-card">
                <div className="rev-top">
                  <div className="rev-av">{r.avatar}</div>
                  <div><div className="rev-author">{r.author}</div><div className="rev-date">{r.date}</div></div>
                </div>
                <div className="rev-stars">{Array.from({length:5},(_,i)=><Star key={i} size={12} strokeWidth={1.5} fill={i < r.rating ? "currentColor" : "none"} />)}</div>
                <div className="rev-text">{r.text}</div>
              </div>
            ))}
            {tourRevs.length > 3 && !showAllRevs && (
              <button className="rev-more" onClick={() => setShowAllRevs(true)}>Ver todas las reseñas ({tourRevs.length})</button>
            )}
          </div>
        )}
      </div>
      <div className="bb"><div className="bb-p">S/ {tour.price}<span>por persona</span></div><button className="bb-bt" onClick={onBook}>Reservar ahora</button></div>
    </div>
  );
}

// Convierte el `date` de un trip (ISO "YYYY-MM-DD" o "DD MMM YYYY" en español)
// a ISO. Sirve para reusar formatLongDate sin importar de dónde venga el trip.
function tripDateISO(trip) {
  if (!trip) return null;
  if (trip.dateISO) return trip.dateISO;
  const v = trip.date;
  if (typeof v !== "string") return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const monMap = { ene:1, feb:2, mar:3, abr:4, may:5, jun:6, jul:7, ago:8, sep:9, oct:10, nov:11, dic:12 };
  const m = v.match(/^(\d{1,2})\s+([A-Za-zÁ-úé]{3})\s+(\d{4})$/);
  if (!m) return null;
  const day = parseInt(m[1], 10);
  const mon = monMap[m[2].toLowerCase().slice(0, 3)];
  const year = parseInt(m[3], 10);
  if (!mon) return null;
  return `${year}-${String(mon).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
}

// Normaliza un teléfono a formato internacional para wa.me (solo dígitos, sin
// '+'). Asume Perú: un móvil de 9 dígitos se prefija con 51; un número que ya
// viene en internacional (empieza con 51 y largo 11+) se usa tal cual. Devuelve
// null si no hay un teléfono utilizable (→ el botón de WhatsApp no se muestra).
function toIntlPhone(raw) {
  if (!raw) return null;
  const digits = String(raw).replace(/\D/g, "");
  if (digits.startsWith("51") && digits.length >= 11) return digits;
  if (digits.length === 9) return `51${digits}`;
  return digits.length >= 11 ? digits : null;
}

// Construye el link wa.me para coordinar con la agencia (M4): teléfono REAL del
// operador (threaded en mapTourFromApi como tour.operatorPhone), normalizado a
// internacional. Devuelve null si el operador no tiene teléfono utilizable, para
// que el caller oculte el botón en vez de generar un link roto.
function buildWhatsAppLink(trip) {
  const phone = toIntlPhone(trip?.tour?.operatorPhone);
  if (!phone) return null;
  const tourTitle = trip?.tour?.title || "mi tour";
  const dateLabel = (() => {
    const iso = tripDateISO(trip);
    return iso ? formatLongDate(iso) : (trip?.date || "la fecha agendada");
  })();
  const code = trip?.code || "";
  const customer = trip?.customerName || USER.name;
  const guests = Number(trip?.guests) || 0;
  const guestsLabel = guests > 0 ? ` para ${guests} ${guests === 1 ? "persona" : "personas"}` : "";
  const lines = [
    `Hola, soy ${customer}. Hice una reserva por finde.pe.`,
    `Reservé ${tourTitle}${guestsLabel} para el ${dateLabel}.`,
    code ? `Mi código de reserva es ${code}.` : "",
    "Quisiera coordinar los detalles y el pago.",
  ].filter(Boolean);
  return `https://wa.me/${phone}?text=${encodeURIComponent(lines.join(" "))}`;
}

const PAYMENT_LABELS = { yape: "Yape", plin: "Plin", card: "Tarjeta", cash: "PagoEfectivo" };

// VoucherDetail — comprobante completo del viaje. Único componente compartido
// entre la pantalla de éxito post-pago y el detalle del viaje en Mis Viajes,
// para que el viajero vea exactamente la misma información en ambos lados.
function VoucherDetail({ trip }) {
  if (!trip || !trip.tour) return null;
  const tour = trip.tour;
  const iso = tripDateISO(trip);
  const dateLabel = iso ? formatLongDate(iso) : (trip.date || "");
  const startTime = tour.startTime || "08:00";
  const endTime = tour.endTime || null;
  const timeRange = endTime
    ? `${startTime} → ${endTime}${tour.returnsNextDay ? " (regresa al día siguiente)" : ""}`
    : (tour.duration ? `${startTime} · ${tour.duration}` : startTime);
  const included = Array.isArray(tour.included) ? tour.included : [];
  const includedShown = included.slice(0, 5);
  const includedExtra = Math.max(0, included.length - 5);
  const whatToBring = Array.isArray(tour.whatToBring) && tour.whatToBring.length > 0
    ? tour.whatToBring
    : [
        "DNI o pasaporte original",
        "Ropa cómoda y zapatillas adecuadas",
        "Protector solar y agua",
        "Efectivo extra para gastos personales",
      ];
  const totalSoles = Number(trip.total) || 0;
  const code = trip.code || "—";
  const meetingPoint = (tour.meetingPoint || "").trim();
  const hasMeetingPoint = meetingPoint.length > 0;

  return (
    <div className="voucher">
      {/* 1 — Tour + fecha */}
      <div className="voucher-sec">
        <div className="voucher-sec-l">Tu reserva</div>
        <div className="voucher-tour">{tour.title}</div>
        <div className="voucher-row">
          <span className="ic"><Calendar size={14} strokeWidth={1.5} /></span>
          <span style={{ textTransform: "capitalize" }}>{dateLabel}</span>
        </div>
        <div className="voucher-row">
          <span className="ic"><Clock size={14} strokeWidth={1.5} /></span>
          <span>{timeRange}</span>
        </div>
        <div className="voucher-row">
          <span className="ic"><Users size={14} strokeWidth={1.5} /></span>
          <span>{trip.guests} {trip.guests === 1 ? "persona" : "personas"}</span>
        </div>
      </div>

      {/* 2 — Punto de encuentro */}
      <div className="voucher-sec">
        <div className="voucher-sec-l">Punto de encuentro</div>
        {hasMeetingPoint ? (
          <>
            <div className="voucher-row">
              <span className="ic"><MapPin size={14} strokeWidth={1.5} /></span>
              <span style={{ fontWeight: 600 }}>{meetingPoint}</span>
            </div>
            {tour.location && <div className="voucher-note">{tour.location}</div>}
          </>
        ) : (
          <>
            <div className="voucher-row">
              <span className="ic"><MapPin size={14} strokeWidth={1.5} /></span>
              <span>{tour.location || "Por confirmar"}</span>
            </div>
            <div className="voucher-note">La agencia confirmará el punto exacto por WhatsApp.</div>
          </>
        )}
      </div>

      {/* 3 — Tu agencia */}
      <div className="voucher-sec">
        <div className="voucher-sec-l">Tu agencia</div>
        <div className="voucher-agency-n">
          {tour.operator || "Operador Finde"}
          {tour.verified && (
            <span className="voucher-verified"><ShieldCheck size={11} strokeWidth={1.5} /> Finde Verificado</span>
          )}
        </div>
        {/* RUC/MINCETUR hardcodeados (falsos) eliminados: eran credenciales de
            confianza inventadas mostradas al viajero. El RUC real (operator.ruc)
            no llega hoy al voucher (no está en LIST_SELECT del catálogo); se
            mostrará cuando se decida cómo exponerlo. La verificación real es el
            badge "Finde Verificado" de arriba (solo si operator.verified). */}
      </div>

      {/* 4 — Qué incluye */}
      {includedShown.length > 0 && (
        <div className="voucher-sec">
          <div className="voucher-sec-l">Qué incluye</div>
          <div className="voucher-list">
            {includedShown.map((x, i) => (
              <div key={i} className="voucher-item">
                <div className="vi-ic"><Check size={12} strokeWidth={2.5} /></div>
                <span>{x}</span>
              </div>
            ))}
          </div>
          {includedExtra > 0 && <div className="voucher-more">y {includedExtra} más</div>}
        </div>
      )}

      {/* 5 — Recomendaciones generales. NO es dato específico del tour
          (no existe tour.whatToBring); es una lista genérica re-rotulada para
          no presentarse como del tour. */}
      <div className="voucher-sec">
        <div className="voucher-sec-l">Recomendaciones generales</div>
        <div className="voucher-list">
          {whatToBring.map((x, i) => (
            <div key={i} className="voucher-item">
              <div className="vi-ic"><Check size={12} strokeWidth={2.5} /></div>
              <span>{x}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 6 — Política de cancelación (oculta en el piloto vía flag) */}
      {SHOW_CANCELLATION_POLICY && (() => {
        const pol = getCancelPolicy(tour.cancellation);
        return (
          <div className="voucher-sec">
            <div className="voucher-sec-l">Política de cancelación</div>
            <div className="voucher-cancel">
              <div className="voucher-cancel-t"><ShieldCheck size={13} strokeWidth={1.5} /> {pol.label}</div>
              <div className="voucher-cancel-d">{pol.short}</div>
            </div>
          </div>
        );
      })()}

      {/* 7 — Resumen. Etapa piloto: sin gateway de pago. El pago se coordina con
          la agencia por WhatsApp, así que NO se muestra método ni "total pagado"
          (sería falso); solo código y total de la reserva, más la nota. */}
      <div className="voucher-sec">
        <div className="voucher-sec-l">Resumen</div>
        <div className="voucher-pay-row">
          <span className="l">Código de reserva</span>
          <span className="voucher-code">{code}</span>
        </div>
        <div className="voucher-pay-row total">
          <span className="l">Total</span>
          <span>S/ {totalSoles.toFixed(2)}</span>
        </div>
        <div className="voucher-note">El pago se coordina directamente con la agencia por WhatsApp.</div>
      </div>
    </div>
  );
}

function BookingView({ tour, go, onLocalBookingSuccess }) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [guests, setGuests] = useState(2);
  const [date, setDate] = useState(() => {
    if (!tour) return "";
    const t0 = todayISO();
    const available = getAvailableDatesInRange(tour, t0, addDaysISO(t0, 90));
    return available[0] || "";
  });
  const [name, setName] = useState(USER.name || "");
  const [phone, setPhone] = useState(USER.phone ? USER.phone.replace(/^\+51\s*/, "") : "");
  // Prellenar con el email del usuario logueado. El backend ignora este valor
  // y usa el del token; lo mostramos sólo para que el usuario vea su identidad.
  const [email, setEmail] = useState(user?.email || "");
  const [docId, setDocId] = useState("");
  const [touched, setTouched] = useState(false);
  const [bookingCode] = useState(() => Math.random().toString(36).substring(2, 8).toUpperCase());
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [serverBooking, setServerBooking] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [step]);

  const submitBooking = async () => {
    setSubmitting(true);
    setSubmitError("");
    // Demo: si el tour es un mock local (id numérico) el backend rechazaría
    // el POST por validar tourId como CUID. Simulamos confirmación localmente
    // y registramos el viaje en TripsView. Fase 2: seedear mocks en DB.
    const isLocalDemoTour = typeof tour.id === "number";
    if (isLocalDemoTour) {
      const localCode = `FND-${bookingCode}`;
      const totalCent = Math.round(tour.price * guests * 100);
      setServerBooking({
        bookingCode: localCode,
        tourTitle: tour.title,
        guests,
        totalSoles: totalCent,
      });
      if (onLocalBookingSuccess) {
        onLocalBookingSuccess({
          tour,
          date,
          guests,
          total: tour.price * guests,
          code: localCode,
          customerName: name,
          customerPhone: phone.replace(/\D/g, ""),
          customerEmail: email,
        });
      }
      setStep(3);
      setSubmitting(false);
      return;
    }
    try {
      const phoneClean = phone.replace(/\D/g, "");
      const scheduledAt = new Date(`${date}T13:00:00.000Z`).toISOString();
      const r = await authFetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tourId: tour.id,
          userName: name,
          userEmail: email,
          userPhone: phoneClean,
          guests,
          scheduledAt,
        }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${r.status}`);
      }
      const data = await r.json();
      setServerBooking(data.booking || null);
      // Registrar también el viaje en el estado local para que aparezca en
      // TripsView. Reusamos el mismo handler que el flujo simulado: TripsView
      // no necesita distinguir entre booking del API y booking local.
      if (onLocalBookingSuccess) {
        const apiCode = data.booking?.bookingCode || `FND-${bookingCode}`;
        const apiTotal = data.booking?.totalSoles != null
          ? data.booking.totalSoles / 100
          : tour.price * guests;
        onLocalBookingSuccess({
          tour,
          date,
          guests,
          total: apiTotal,
          code: apiCode,
          customerName: name,
          customerPhone: phone.replace(/\D/g, ""),
          customerEmail: email,
        });
      }
      setStep(3);
    } catch (e) {
      setSubmitError(e.message || "Error creando la reserva");
    } finally {
      setSubmitting(false);
    }
  };

  if (!tour) return null;
  const total = tour.price * guests;
  // Validación de formato (no sólo trim) para evitar confirmar con datos que el
  // backend rechazará (api/bookings.ts: email format, phone /^\d{8,15}$/).
  const nameValid = name.trim().length >= 3;
  const phoneValid = /^\d{8,15}$/.test(phone.replace(/\s/g, ""));
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const docIdValid = docId.trim().length >= 6;
  const step2Valid = nameValid && phoneValid && emailValid && docIdValid;

  if (step === 3) {
    // Construimos el trip equivalente al que terminó en TripsView para que el
    // voucher muestre exactamente la misma información que verá el viajero en el
    // detalle de su viaje.
    const successTrip = {
      tour,
      date,
      guests: serverBooking?.guests ?? guests,
      total: serverBooking?.totalSoles != null ? serverBooking.totalSoles / 100 : total,
      code: serverBooking?.bookingCode || `FND-${bookingCode}`,
      customerName: name,
    };
    return (
      <div className="suc fu" style={{ alignItems: "stretch", padding: "32px 16px 100px", textAlign: "left" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginBottom: 20 }}>
          <div className="suc-chk"><Check size={28} strokeWidth={2.5} /></div>
          <div className="suc-t">¡Reserva confirmada!</div>
          <div className="suc-sub">Tu voucher está listo. Toda la información que necesitas está aquí abajo.</div>
        </div>
        {/* CTA primario ARRIBA del voucher: coordinar/pagar con la agencia por
            WhatsApp (sin gateway en el piloto) es la acción principal. El número
            real va en el href, nunca visible como texto. Fallback honesto si el
            operador no tiene teléfono → sin link roto. */}
        {(() => {
          const wa = buildWhatsAppLink(successTrip);
          return wa ? (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="mbtn"
              style={{ background: "#25D366", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, textDecoration: "none", marginBottom: 16 }}
            >
              <Smartphone size={18} strokeWidth={2} /> Coordinar con la agencia por WhatsApp
            </a>
          ) : (
            <div className="mbtn" style={{ background: "var(--lg)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "default", pointerEvents: "none", marginBottom: 16 }}>
              <Smartphone size={18} strokeWidth={2} /> Coordinación por WhatsApp no disponible
            </div>
          );
        })()}
        <VoucherDetail trip={successTrip} />
        <button
          className="bk-btn"
          onClick={() => go("trips")}
          style={{ position: "relative", width: "100%", marginTop: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "none", border: "none", color: "var(--f)", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}
        >
          <Ticket size={16} strokeWidth={1.5} /> Ver en Mis Viajes
        </button>
      </div>
    );
  }

  return (
    <div className="bkf fu">
      <button className="bk-btn" onClick={() => step === 1 ? go("detail") : setStep(step - 1)} style={{ position: "relative", marginBottom: 16 }} aria-label={step === 1 ? "Volver al tour" : "Paso anterior"} type="button"><ArrowLeft size={20} strokeWidth={1.5} /></button>
      {/* 3 etapas: Fecha/Viajeros → Datos → Reserva lista (la final es step 3,
          que se renderiza arriba; aquí solo se ven las etapas 1 y 2). */}
      <div className="bkf-st"><div className={`bkf-s ${step >= 1 ? "on" : ""}`} /><div className={`bkf-s ${step >= 2 ? "on" : ""}`} /><div className={`bkf-s ${step >= 3 ? "on" : ""}`} /></div>

      <div className="bkf-steps">
      {step === 1 && <div className="fu">
        <div className="bkf-t">Elige fecha y viajeros</div>
        <div className="bkf-sub" style={{ marginBottom: 10 }}>{tour.title}</div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", background: "var(--cr)", borderRadius: 100, fontSize: 12, color: "var(--gy)", fontWeight: 600, marginBottom: 24 }}>
          <Clock size={13} strokeWidth={1.5} /> Duración: {tour.duration}
        </div>
        <div className="fg">
          <label className="lbl">Fecha</label>
          <MonthCalendar
            mode="select"
            selectedDate={date}
            onSelect={setDate}
            days={tour.days || DEFAULT_DAYS}
            excludedDates={tour.excludedDates || []}
            addedDates={tour.addedDates || []}
          />
          {date ? (
            <div style={{ marginTop: 10, fontSize: 12, color: "var(--gy)" }}>
              Fecha seleccionada: <strong style={{ color: "var(--f)" }}>{formatLongDate(date)}</strong>
            </div>
          ) : (
            <div style={{ marginTop: 10, padding: 10, background: "rgba(199,97,58,.08)", borderRadius: 10, fontSize: 12, color: "var(--tr)", lineHeight: 1.5 }}>
              Sin fechas disponibles próximamente. Contacta al operador por WhatsApp.
            </div>
          )}
        </div>
        <div className="fg"><label className="lbl">Personas</label><div className="gctr" role="group" aria-label="Cantidad de personas"><button type="button" className="gbtn" onClick={() => setGuests(Math.max(1, guests - 1))} disabled={guests <= 1} aria-label="Disminuir número de personas">−</button><div className="gcnt" aria-live="polite">{guests}</div><button type="button" className="gbtn" onClick={() => setGuests(Math.min(tour.capacity, guests + 1))} disabled={guests >= tour.capacity} aria-label="Aumentar número de personas">+</button></div></div>
        <div className="sum"><div className="sum-r"><span>S/ {tour.price} × {guests}</span><span>S/ {total.toFixed(2)}</span></div><div className="sum-t"><span>Total</span><span>S/ {total.toFixed(2)}</span></div></div>
        {SHOW_CANCELLATION_POLICY && (() => {
          const pol = getCancelPolicy(tour.cancellation);
          return (
            <div style={{ padding: 12, background: "var(--cr)", borderRadius: 12, marginBottom: 16, borderLeft: "3px solid var(--f)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--f)", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                <ShieldCheck size={14} strokeWidth={1.5} /> Política de cancelación: {pol.label}
              </div>
              <div style={{ fontSize: 12, color: "var(--gy)", lineHeight: 1.5 }}>{pol.short}</div>
            </div>
          );
        })()}
        <button className="mbtn" disabled={!date} onClick={() => setStep(2)}>Continuar</button>
      </div>}

      {step === 2 && <div className="fu">
        <div className="bkf-t">Datos del viajero</div><div className="bkf-sub">{tour.title}</div>
        <div className="fg">
          <label className="lbl">Nombre completo</label>
          <input className={`inp${touched && !nameValid ? " inp-err" : ""}`} placeholder="Tu nombre completo" value={name} onChange={(e) => setName(e.target.value)} />
          {touched && !nameValid && <div className="field-err">Nombre debe tener al menos 3 caracteres</div>}
        </div>
        <div className="fg">
          <label className="lbl">Teléfono</label>
          <input className={`inp${touched && !phoneValid ? " inp-err" : ""}`} placeholder="987 654 321" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^0-9\s]/g, ""))} type="tel" maxLength={11} />
          {touched && !phoneValid && <div className="field-err">Teléfono debe tener entre 8 y 15 dígitos</div>}
        </div>
        <div className="fg">
          <label className="lbl">Email</label>
          <input className={`inp${touched && !emailValid ? " inp-err" : ""}`} placeholder="tu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
          {touched && !emailValid && <div className="field-err">Email inválido</div>}
        </div>
        <div className="fg">
          <label className="lbl">DNI, Pasaporte o CE</label>
          <input className={`inp${touched && !docIdValid ? " inp-err" : ""}`} placeholder="DNI, pasaporte o carnet de extranjería" value={docId} onChange={(e) => setDocId(e.target.value)} maxLength={20} inputMode="numeric" />
          {touched && !docIdValid && <div className="field-err">Documento inválido (mínimo 6 caracteres)</div>}
        </div>
        {/* Resumen + política movidos aquí desde el ex-step de pago: el viajero
            confirma con contexto completo y crea la reserva directamente. */}
        <div className="sum" style={{ marginTop: 8, marginBottom: 16 }}>
          <div className="bk-sum-tour">{tour.title}</div>
          <div className="bk-sum-meta"><Calendar size={14} strokeWidth={1.5} /> {formatLongDate(date) || date} · <Users size={14} strokeWidth={1.5} /> {guests} persona{guests > 1 ? "s" : ""}</div>
          <div className="sum-r"><span>S/ {tour.price} × {guests}</span><span>S/ {total.toFixed(2)}</span></div>
          <div className="sum-t"><span>Total</span><span>S/ {total.toFixed(2)}</span></div>
        </div>
        {SHOW_CANCELLATION_POLICY && (() => {
          const pol = getCancelPolicy(tour.cancellation);
          return (
            <div style={{ padding: 12, background: "var(--cr)", borderRadius: 12, marginBottom: 16, borderLeft: "3px solid var(--f)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--f)", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                <ShieldCheck size={14} strokeWidth={1.5} /> Política de cancelación: {pol.label}
              </div>
              <div style={{ fontSize: 12, color: "var(--gy)", lineHeight: 1.5 }}>{pol.short}</div>
            </div>
          );
        })()}
        <div style={{ fontSize: 12, color: "var(--gy)", lineHeight: 1.5, marginBottom: 14, textAlign: "center" }}>
          Al confirmar, coordinarás el pago y los detalles directamente con la agencia por WhatsApp.
        </div>
        {submitError && <div className="field-err" style={{ marginBottom: 12 }}>{submitError}</div>}
        <button className="mbtn" disabled={submitting} onClick={() => { if (!step2Valid) { setTouched(true); return; } submitBooking(); }}>
          {submitting ? "Procesando reserva…" : "Confirmar reserva"}
        </button>
      </div>}
      </div>
    </div>
  );
}

function NotifsView({ notifs, setNotifs }) {
  return (
    <div className="npage fu">
      <div className="npage-h"><h2>Notificaciones</h2><button onClick={() => setNotifs(notifs.map((n) => ({ ...n, read: true })))}>Marcar leído</button></div>
      {notifs.map((n) => (
        <div key={n.id} className={`ni-item ${!n.read ? "unread" : ""}`} onClick={() => setNotifs(notifs.map((x) => x.id === n.id ? { ...x, read: true } : x))}>
          <div className={`ni-ic ${n.type}`}>{(() => { const Ic = n.icon; return <Ic size={18} strokeWidth={1.5} color="#2D5A3D" />; })()}</div>
          <div className="ni-body"><div className="ni-title">{n.title}</div><div className="ni-text">{n.body}</div><div className="ni-time">{n.time}</div></div>
          {!n.read && <div className="ni-dot" />}
        </div>
      ))}
    </div>
  );
}

function TripsView({ go, onSelectTrip, trips }) {
  const [f, setF] = useState("all");
  const list = f === "all" ? trips : trips.filter((t) => t.status === f);
  return (
    <div className="tp-page fu">
      <div className="tp-h"><h2>Mis Viajes</h2><p>{trips.length} experiencias</p></div>
      <div className="tp-tabs">{[{ id: "all", l: "Todos" }, { id: "upcoming", l: "Próximos" }, { id: "completed", l: "Completados" }].map((x) => <button key={x.id} className={`tp-tab ${f === x.id ? "on" : ""}`} onClick={() => setF(x.id)}>{x.l}</button>)}</div>
      {list.map((trip) => (
        <div key={trip.id}>
          <div className="tp-card" onClick={() => { onSelectTrip(trip); go("trip-detail"); }}>
            <div className="tp-img" style={imgBg(trip.tour.image)} />
            <div className="tp-info"><div className="tp-name">{trip.tour.title}</div><div className="tp-det">{trip.date} · {trip.guests} pers</div><div className="tp-code">{trip.code}</div>
              <div className="tp-foot"><div className="tp-price">S/ {trip.total}</div><div className={`tp-st tp-${trip.status}`}>{trip.status === "upcoming" ? "Próximo" : "Completado"}</div></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Detalle del viaje: usa el mismo VoucherDetail que la pantalla de éxito.
// Aquí también vive el formulario de reseña (antes inline en TripsView).
function TripDetailView({ trip, go, onReview }) {
  const [showRev, setShowRev] = useState(false);
  const [rvRating, setRvRating] = useState(0);
  const [rvText, setRvText] = useState("");
  if (!trip || !trip.tour) return null;
  const submitReview = () => {
    if (rvRating === 0) return;
    onReview(trip.id, trip.tour.id, rvRating, rvText);
    setShowRev(false);
    setRvRating(0);
    setRvText("");
  };
  const canReview = trip.status === "completed" && !trip.reviewed;
  const isUpcoming = trip.status === "upcoming";
  return (
    <div className="tdet-page fu">
      <button className="bk-btn tdet-back" onClick={() => go("trips")} aria-label="Volver a Mis Viajes" type="button"><ArrowLeft size={20} strokeWidth={1.5} /></button>
      <h2 className="tdet-h">Tu viaje</h2>
      <VoucherDetail trip={trip} />
      <div className="tdet-actions">
        {canReview && !showRev && (
          <button className="tdet-act-sec" onClick={() => { setShowRev(true); setRvRating(0); setRvText(""); }}>
            <Star size={14} strokeWidth={1.5} style={{ display: "inline", verticalAlign: "middle", marginRight: 6 }} />
            Deja tu reseña
          </button>
        )}
        {showRev && (
          <div className="rv-form">
            <div className="rv-form-t">Tu reseña de {trip.tour.title}</div>
            <div className="rv-stars">
              {[1, 2, 3, 4, 5].map(s => (
                <button key={s} className={`rv-star ${s <= rvRating ? "on" : ""}`} onClick={() => setRvRating(s)}><Star size={22} strokeWidth={1.5} fill={s <= rvRating ? "currentColor" : "none"} /></button>
              ))}
            </div>
            <textarea className="rv-textarea" placeholder="Comparte tu experiencia con otros viajeros..." value={rvText} onChange={(e) => setRvText(e.target.value)} />
            <div className="rv-actions">
              <button className="rv-cancel" onClick={() => setShowRev(false)}>Cancelar</button>
              <button className="rv-submit" disabled={rvRating === 0} onClick={submitReview}>Publicar reseña</button>
            </div>
          </div>
        )}
        {isUpcoming && (
          <button className="tdet-act-sec" onClick={() => alert("Próximamente: aquí podrás reportar un problema con esta reserva.\n\nMientras tanto escríbenos a soporte@finde.pe")}>
            Reportar un problema
          </button>
        )}
      </div>
      {(() => {
        const wa = buildWhatsAppLink(trip);
        return wa ? (
          <a className="voucher-wa" href={wa} target="_blank" rel="noopener noreferrer" style={{ marginTop: 12 }}>
            <Smartphone size={14} strokeWidth={1.5} /> Coordinar con la agencia por WhatsApp <ArrowRight size={12} strokeWidth={1.5} />
          </a>
        ) : (
          <div className="voucher-wa" style={{ marginTop: 12, opacity: .6, cursor: "default", pointerEvents: "none" }}>
            <Smartphone size={14} strokeWidth={1.5} /> Coordinación por WhatsApp no disponible
          </div>
        );
      })()}
    </div>
  );
}

function ProfileView({ go }) {
  const { user, isOperator, refreshOperator, signOut } = useAuth();
  // Opción 1 (mínimo honesto): solo datos reales. El email es el identificador
  // principal; joinLabel sale de created_at si existe; no se finge nombre.
  const joinLabel = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("es-PE", { month: "long", year: "numeric" })
    : null;
  const avatarInitials = (user?.email || "?").slice(0, 2).toUpperCase();
  const [showOpForm, setShowOpForm] = useState(false);
  const [opForm, setOpForm] = useState({
    // Campos vacíos: el operador ingresa SUS datos reales (no sembrar con mocks).
    name: "",
    // Email del usuario logueado (el backend lo toma del token; el body lo ignora).
    email: user?.email || "",
    phone: "",
    city: "",
    ruc: "",
  });
  const [opLoading, setOpLoading] = useState(false);
  const [opError, setOpError] = useState("");
  const [opAcceptTerms, setOpAcceptTerms] = useState(false);

  const updOp = (k, v) => setOpForm(prev => ({ ...prev, [k]: v }));
  const opRucValid = /^\d{11}$/.test(opForm.ruc);
  const opFormValid = opForm.name && opForm.email && opForm.phone && opForm.city && opRucValid && opAcceptTerms;

  const submitOperator = async () => {
    if (!opRucValid) { setOpError("El RUC debe tener exactamente 11 dígitos"); return; }
    if (!opAcceptTerms) { setOpError("Debes aceptar los Términos y Condiciones"); return; }
    setOpLoading(true);
    setOpError("");
    try {
      // email NO va en el body: el backend lo toma del token (sub-paso 8.4).
      const body = {
        name: opForm.name,
        phone: opForm.phone,
        city: opForm.city,
        ruc: opForm.ruc,
      };
      const r = await authFetch("/api/operators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        if (r.status === 409) {
          // Ya es operador (o email duplicado): refrescamos y cerramos el form.
          await refreshOperator();
          setShowOpForm(false);
          return;
        }
        throw new Error(err.error || `HTTP ${r.status}`);
      }
      // Re-consulta /api/me para actualizar isOperator global (en vez de
      // setear estado local, que ya no existe).
      await refreshOperator();
      setShowOpForm(false);
    } catch (e) {
      setOpError(e.message || "Error registrando operador");
    } finally {
      setOpLoading(false);
    }
  };

  return (
    <div className="pf-page fu">
      <div className="pf-hdr">
        <div className="pf-av">{avatarInitials}</div><div className="pf-name">{user?.email || "—"}</div>
        {joinLabel && <div className="pf-since">Miembro desde {joinLabel}</div>}
      </div>
      {!isOperator && !showOpForm ? (
        <div className="pf-op-card" onClick={() => setShowOpForm(true)}>
          <div className="pf-op-left">
            <div className="pf-op-ic">
              <MountainSnow size={20} strokeWidth={1.5} color="white" />
            </div>
            <div>
              <div className="pf-op-title">¿Ofreces tours?</div>
              <div className="pf-op-desc">Activa tu perfil de operador</div>
            </div>
          </div>
          <ChevronRight size={16} strokeWidth={1.5} style={{ color: "var(--lg)" }} />
        </div>
      ) : !isOperator && showOpForm ? (
        <div className="pf-sec">
          <div className="pf-sec-t">Registrarse como operador</div>
          <div className="fg">
            <label className="lbl">Nombre o razón social</label>
            <input className="inp" value={opForm.name} onChange={(e) => updOp("name", e.target.value)} />
          </div>
          <div className="fg">
            <label className="lbl">Email</label>
            <input className="inp" type="email" value={opForm.email} onChange={(e) => updOp("email", e.target.value)} />
          </div>
          <div className="fg">
            <label className="lbl">Teléfono (solo dígitos)</label>
            <input className="inp" value={opForm.phone} onChange={(e) => updOp("phone", e.target.value.replace(/\D/g, ""))} maxLength={15} type="tel" inputMode="numeric" />
          </div>
          <div className="fg">
            <label className="lbl">Ciudad</label>
            <input className="inp" value={opForm.city} onChange={(e) => updOp("city", e.target.value)} />
          </div>
          <div className="fg">
            <label className="lbl">RUC <span style={{ color: "var(--tr)" }}>*</span> <span style={{ color: "var(--gy)", fontWeight: 400 }}>(11 dígitos)</span></label>
            <input className={`inp${opForm.ruc && !opRucValid ? " inp-err" : ""}`} value={opForm.ruc} onChange={(e) => updOp("ruc", e.target.value.replace(/\D/g, ""))} maxLength={11} placeholder="20612345678" inputMode="numeric" />
            {opForm.ruc && !opRucValid && <div className="field-err">El RUC debe tener 11 dígitos</div>}
            <div style={{ fontSize: 11, color: "var(--gy)", marginTop: 6, lineHeight: 1.5 }}>
              Solo agencias con RUC activo pueden vender en Finde. Validaremos contra SUNAT.
            </div>
          </div>
          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 0", marginBottom: 12, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={opAcceptTerms}
              onChange={(e) => setOpAcceptTerms(e.target.checked)}
              style={{ marginTop: 3, width: 18, height: 18, accentColor: "var(--f)", flexShrink: 0, cursor: "pointer" }}
            />
            <span style={{ fontSize: 12, color: "var(--ch)", lineHeight: 1.5 }}>
              Acepto los <span style={{ color: "var(--f)", fontWeight: 700, textDecoration: "underline" }}>Términos y Condiciones</span> de Finde y confirmo que la información proporcionada es verídica.
            </span>
          </label>
          {opError && <div className="field-err" style={{ marginBottom: 12 }}>{opError}</div>}
          <button className="mbtn" disabled={opLoading || !opFormValid} onClick={submitOperator}>
            {opLoading ? "Registrando…" : "Registrarse como operador"}
          </button>
          <button className="rv-cancel" style={{ marginTop: 8, width: "100%" }} onClick={() => { setShowOpForm(false); setOpError(""); }}>Cancelar</button>
        </div>
      ) : (
        <div className="pf-op-card" onClick={() => go("dashboard")}>
          <div className="pf-op-left">
            <div className="pf-op-ic">
              <MountainSnow size={20} strokeWidth={1.5} color="white" />
            </div>
            <div>
              <div className="pf-op-title">Panel de operador</div>
              <div className="pf-op-desc">Gestiona reservas e ingresos</div>
            </div>
          </div>
          <ChevronRight size={16} strokeWidth={1.5} style={{ color: "var(--lg)" }} />
        </div>
      )}
      <div className="pf-sec"><div className="pf-sec-t">Datos personales</div>
        <div className="pf-field"><div><div className="pf-field-l">Email</div><div className="pf-field-v">{user?.email || "—"}</div></div><ChevronRight size={16} strokeWidth={1.5} style={{ color: "var(--lg)" }} /></div>
      </div>
      {[
        { ic: Languages, bg: "rgba(212,168,67,.1)", t: "Idioma", d: "Español · Runasimi disponible" },
        { ic: HelpCircle, bg: "rgba(107,143,113,.1)", t: "Ayuda", d: "FAQ, WhatsApp" },
      ].map((i, idx) => (
        <div key={idx} className="pf-mi"><div className="pf-mi-ic" style={{ background: i.bg }}><i.ic size={18} strokeWidth={1.5} color="#2D5A3D" /></div><div className="pf-mi-txt"><div className="pf-mi-t">{i.t}</div><div className="pf-mi-d">{i.d}</div></div><ChevronRight size={16} strokeWidth={1.5} style={{ color: "var(--lg)" }} /></div>
      ))}
      <div
        className="pf-mi"
        onClick={() => alert("Próximamente: aquí podrás presentar reclamos formales conforme a la Ley 32495.\n\nMientras tanto, escríbenos a reclamos@finde.pe")}
        style={{ cursor: "pointer" }}
      >
        <div className="pf-mi-ic" style={{ background: "rgba(199,97,58,.1)" }}>
          <FileText size={18} strokeWidth={1.5} color="#C7613A" />
        </div>
        <div className="pf-mi-txt">
          <div className="pf-mi-t">Libro de Reclamaciones</div>
          <div className="pf-mi-d">Presenta un reclamo formal · Ley 32495</div>
        </div>
        <ChevronRight size={16} strokeWidth={1.5} style={{ color: "var(--lg)" }} />
      </div>
      <button className="pf-logout" onClick={() => signOut()}>Cerrar sesión</button>
      <div className="pf-ver">finde. AI v3.0 · Hecho en Perú</div>
    </div>
  );
}

function DashView({ go, opTours, opBookings, onEditTour, onDeleteTour, onToggleActive, initialTab = "bookings", onTabConsumed }) {
  const [tab, setTab] = useState(initialTab);
  useEffect(() => { if (onTabConsumed) onTabConsumed(); }, []);
  // Reservas reales del operador (GET /api/operators/me/bookings), hidratadas en
  // AppDemo y pasadas como prop. Etapa piloto: solo lectura (sin cambio de estado).
  const bookings = opBookings;
  // Nombre real del operador logueado (de GET /api/me vía AuthContext), en vez
  // del mock "Andes Trek Perú". DashView solo se renderiza para operadores, así
  // que operator suele estar presente; fallback defensivo por si aún no hidrata.
  const { user, operator, refreshOperator } = useAuth();
  const operatorName = operator?.name || "Mi negocio";
  const initials = (name) => (name || "?").trim().split(/\s+/).map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Edición del perfil de operador (PATCH /api/operators). Solo los 4 campos
  // editables (name/phone/city/ruc); email y verificación son solo lectura.
  const [editingBiz, setEditingBiz] = useState(false);
  const [bizForm, setBizForm] = useState({ name: "", phone: "", city: "", ruc: "" });
  const [bizBusy, setBizBusy] = useState(false);
  const [bizError, setBizError] = useState("");
  const [bizSaved, setBizSaved] = useState(false);
  const setBizField = (k, v) => setBizForm((prev) => ({ ...prev, [k]: v }));
  const startEditBiz = () => {
    setBizForm({
      name: operator?.name || "",
      phone: operator?.phone || "",
      city: operator?.city || "",
      ruc: operator?.ruc || "",
    });
    setBizError("");
    setEditingBiz(true);
  };
  // Mismas validaciones que el alta (api/operators.ts bodySchema).
  const bizNameValid = bizForm.name.trim().length >= 3 && bizForm.name.trim().length <= 100;
  const bizCityValid = bizForm.city.trim().length >= 2 && bizForm.city.trim().length <= 50;
  const bizPhoneValid = /^\d{8,15}$/.test(bizForm.phone.trim());
  const bizRucValid = /^\d{11}$/.test(bizForm.ruc.trim());
  const bizFormValid = bizNameValid && bizCityValid && bizPhoneValid && bizRucValid;
  const saveBiz = async () => {
    if (!bizFormValid || bizBusy) return;
    setBizBusy(true);
    setBizError("");
    try {
      const r = await authFetch("/api/operators", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: bizForm.name.trim(),
          phone: bizForm.phone.trim(),
          city: bizForm.city.trim(),
          ruc: bizForm.ruc.trim(),
        }),
      });
      if (!r.ok) {
        if (r.status === 404) throw new Error("No encontramos tu perfil de operador.");
        if (r.status === 429) throw new Error("Demasiados intentos. Espera un momento.");
        if (r.status === 400) throw new Error("Revisa los datos: RUC de 11 dígitos y teléfono de 8 a 15.");
        throw new Error("No pudimos guardar los cambios. Intenta de nuevo.");
      }
      await refreshOperator();
      setEditingBiz(false);
      setBizSaved(true);
      setTimeout(() => setBizSaved(false), 3000);
    } catch (e) {
      setBizError(e.message || "No pudimos guardar los cambios.");
    } finally {
      setBizBusy(false);
    }
  };

  // Verificación MINCETUR: el operador envía/edita su N° de registro (PATCH con
  // solo { mincetur }). verified lo marca Finde a mano tras validar — el front
  // nunca lo toca. Estado separado del de edición de perfil.
  const [showMincInput, setShowMincInput] = useState(false);
  const [mincForm, setMincForm] = useState("");
  const [mincBusy, setMincBusy] = useState(false);
  const [mincError, setMincError] = useState("");
  const minceturValid = /^[A-Za-z0-9-]{3,30}$/.test(mincForm.trim());
  const startMincInput = () => {
    setMincForm(operator?.mincetur || "");
    setMincError("");
    setShowMincInput(true);
  };
  const submitMincetur = async () => {
    if (!minceturValid || mincBusy) return;
    setMincBusy(true);
    setMincError("");
    try {
      const r = await authFetch("/api/operators", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mincetur: mincForm.trim() }),
      });
      if (!r.ok) {
        if (r.status === 404) throw new Error("No encontramos tu perfil de operador.");
        if (r.status === 429) throw new Error("Demasiados intentos. Espera un momento.");
        if (r.status === 400) throw new Error("N° MINCETUR inválido (3 a 30 caracteres alfanuméricos o guiones).");
        throw new Error("No pudimos enviar tu N° MINCETUR. Intenta de nuevo.");
      }
      await refreshOperator();
      setShowMincInput(false);
    } catch (e) {
      setMincError(e.message || "No pudimos enviar tu N° MINCETUR.");
    } finally {
      setMincBusy(false);
    }
  };

  // Estado mock `biz` (RUC/MINCETUR/CCI/pago) eliminado: la tab "Mi Negocio" es
  // informativa de solo lectura y muestra datos reales del operador (useAuth).
  // M2.3: el toggle persiste vía PATCH (delegado a onToggleActive en AppDemo,
  // que hace la actualización optimista + revert). Aquí solo surfaceamos el error.
  const [toggleErr, setToggleErr] = useState("");
  const handleToggle = async (t) => {
    setToggleErr("");
    const r = await onToggleActive(t);
    if (!r?.ok) setToggleErr(r?.error || "No pudimos actualizar el estado del tour.");
  };

  // Sub-paso M2.6b: borrado de tour CON confirmación. `confirmDel` guarda el
  // tour pendiente de confirmar; el borrado real solo ocurre al Confirmar.
  const [confirmDel, setConfirmDel] = useState(null);
  const [delBusy, setDelBusy] = useState(false);
  const [delError, setDelError] = useState("");
  const askDelete = (t) => { setDelError(""); setConfirmDel(t); };
  const cancelDelete = () => { if (!delBusy) { setConfirmDel(null); setDelError(""); } };
  const confirmDelete = async () => {
    if (!confirmDel) return;
    setDelBusy(true);
    setDelError("");
    const result = await onDeleteTour(confirmDel);
    setDelBusy(false);
    if (result?.ok) setConfirmDel(null);
    else setDelError(result?.error || "No pudimos borrar el tour.");
  };



  return (
    <div className="dsh">
      <div className="dsh-h fu">
        <div className="dsh-gr">Panel de operador <Hand size={18} strokeWidth={1.5} style={{display:"inline",verticalAlign:"middle"}} /></div>
        <div className="dsh-nm">{operatorName}</div>
        <div className="dsh-sts">
          <div className="dsh-s"><div className="dsh-s-v">{opTours.filter((t) => t.active).length}</div><div className="dsh-s-l">Tours activos</div></div>
          <div className="dsh-s"><div className="dsh-s-v">{bookings.length}</div><div className="dsh-s-l">Reservas</div></div>
          {/* Stat "Rating" oculto en la etapa piloto: no hay modelo Review ni ratings
              reales (los del seed son siembra). Reactivar cuando exista reseñas reales. */}
        </div>
      </div>

      <div className="dsh-tabs fd1">
        {/* Tab "Ingresos" oculta en la etapa piloto: sin gateway de pago no hay
            ingresos reales que mostrar (los datos eran mock). Reactivar cuando se cobre. */}
        {[{ id: "bookings", l: "Reservas" }, { id: "business", l: "Mi Negocio" }, { id: "listings", l: "Mis Tours" }].map((t) => (
          <button key={t.id} className={`dsh-tab ${tab === t.id ? "on" : ""}`} onClick={() => { setTab(t.id); setSelectedBooking(null); }}>{t.l}</button>
        ))}
      </div>

      {/* ── RESERVAS ── */}
      {tab === "bookings" && !selectedBooking && <div className="fu">
        {bookings.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--gy)" }}>
            <Smartphone size={28} strokeWidth={1.5} style={{ color: "var(--lg)", marginBottom: 12 }} />
            <div style={{ fontWeight: 700, fontSize: 15, color: "var(--ch)", marginBottom: 6 }}>Aún no tienes reservas</div>
            <div style={{ fontSize: 13, lineHeight: 1.5 }}>Cuando un viajero reserve uno de tus tours, aparecerá aquí y podrás coordinar con él por WhatsApp.</div>
          </div>
        ) : bookings.map((b) => (
          <div key={b.id} className="dsh-bk" style={{ alignItems: "center", gap: 10, cursor: "pointer" }}
            onClick={() => setSelectedBooking(b)}>
            <div className="dsh-bk-av" style={{ background: "var(--m)" }}>{initials(b.customer)}</div>
            <div className="dsh-bk-i"><div className="dsh-bk-n">{b.customer}</div><div className="dsh-bk-d">{b.tour} · {b.date} · {b.guests} pers</div></div>
            <div className="dsh-bk-r"><div className="dsh-bk-a">S/ {b.amount.toLocaleString("es-PE")}</div><div className="dsh-bk-s" style={{ color: "var(--gy)" }}>Solicitud recibida</div></div>
          </div>
        ))}
      </div>}

      {/* ── DETALLE DE RESERVA ── */}
      {tab === "bookings" && selectedBooking && (() => {
        const b = bookings.find(x => x.id === selectedBooking.id);
        return (
          <div className="fu" style={{ padding: "0 16px 32px" }}>
            <button onClick={() => setSelectedBooking(null)}
              style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", padding: "12px 0", display: "block", color: "var(--ch)" }}><ArrowLeft size={20} strokeWidth={1.5} /></button>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginBottom: 24 }}>
              <div className="dsh-bk-av" style={{ width: 64, height: 64, fontSize: 22, background: "var(--m)" }}>
                {initials(b.customer)}
              </div>
              <div style={{ fontWeight: 800, fontSize: 18 }}>{b.customer}</div>
              <div className="dsh-bk-s" style={{ color: "var(--gy)" }}>Solicitud recibida</div>
            </div>
            <div className="sum">
              {[["Código", b.id], ["Tour", b.tour], ["Fecha", b.date], ["Personas", `${b.guests} personas`]].map(([l, v]) => (
                <div key={l} className="sum-r"><span style={{ color: "var(--gy)" }}>{l}</span><span style={{ fontWeight: 600 }}>{v}</span></div>
              ))}
              <div className="sum-t"><span>Total</span><span>S/ {b.amount.toLocaleString("es-PE")}</span></div>
            </div>
            {b.phone ? (
              <a href={`https://wa.me/${b.phone.replace(/\D/g,"")}`}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  padding: "13px 0", borderRadius: 14, background: "#25D366", color: "white",
                  fontWeight: 700, fontSize: 14, textDecoration: "none", marginBottom: 10 }}>
                <Smartphone size={16} strokeWidth={1.5} /> Contactar por WhatsApp
              </a>
            ) : (
              <div style={{ textAlign: "center", padding: "12px 0", color: "var(--gy)", fontSize: 13 }}>
                El viajero no dejó un teléfono de contacto.
              </div>
            )}
          </div>
        );
      })()}


      {/* ── INGRESOS ── (oculta en la etapa piloto; ver tabs arriba) */}

      {/* ── MI NEGOCIO ── (solo lectura; datos reales del operador vía useAuth).
          Solo presentación: identidad + lista de datos reales + estado real de
          verificación. Sin formularios ni edición (milestone futuro). Sin datos
          mock: campos vacíos muestran texto neutro. */}
      {tab === "business" && <div className="fu">
        <div className="biz-sec">
          {/* Identidad del negocio: avatar + nombre real */}
          <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 18, paddingBottom: 18, borderBottom: "1px solid var(--sd)" }}>
            <div className="dsh-bk-av" style={{ width: 52, height: 52, fontSize: 18, background: "var(--m)" }}>{initials(operator?.name)}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "'DM Serif Display',Georgia,serif", fontSize: 20, color: "var(--ch)", lineHeight: 1.15 }}>{operator?.name || "Mi negocio"}</div>
              <div style={{ fontSize: 12.5, color: "var(--gy)", marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}><MapPin size={12} strokeWidth={1.5} /> {operator?.city || "Ciudad no registrada"}</div>
            </div>
          </div>

          {/* Datos del registro: solo lectura con botón Editar, o formulario de
              edición (PATCH). Email y verificación NO son editables. */}
          <div className="biz-sec-t" style={{ marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}><Building2 size={16} strokeWidth={1.5} /> Datos del negocio</span>
            {!editingBiz && (
              <button onClick={startEditBiz} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", color: "var(--f)", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                <Pencil size={13} strokeWidth={1.5} /> Editar
              </button>
            )}
          </div>

          {!editingBiz ? (
            <>
              <div className="sum" style={{ marginBottom: 0 }}>
                {[
                  ["Nombre", operator?.name || "—"],
                  ["RUC", operator?.ruc || "No registrado"],
                  ["Email de contacto", user?.email || operator?.email || "—"],
                  ["Teléfono", operator?.phone || "No registrado"],
                  ["Ciudad", operator?.city || "No registrada"],
                ].map(([l, v]) => {
                  const empty = v === "—" || v.startsWith("No ");
                  return (
                    <div key={l} className="sum-r">
                      <span style={{ color: "var(--gy)" }}>{l}</span>
                      <span style={{ fontWeight: 600, color: empty ? "var(--lg)" : "var(--ch)" }}>{v}</span>
                    </div>
                  );
                })}
              </div>
              {bizSaved && <div className="biz-saved"><Check size={12} strokeWidth={2} /> Cambios guardados</div>}
              <div className="biz-note" style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <Info size={14} strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>El email de contacto y el estado de verificación no se editan aquí (el email es el de tu cuenta).</span>
              </div>
            </>
          ) : (
            <>
              <div className="fg">
                <label className="lbl">Nombre del negocio</label>
                <input className="inp" value={bizForm.name} onChange={(e) => setBizField("name", e.target.value)} maxLength={100} />
              </div>
              <div className="fg">
                <label className="lbl">RUC</label>
                <input className={`inp${bizForm.ruc && !bizRucValid ? " inp-err" : ""}`} value={bizForm.ruc} onChange={(e) => setBizField("ruc", e.target.value.replace(/\D/g, ""))} maxLength={11} inputMode="numeric" placeholder="20612345678" />
                {bizForm.ruc && !bizRucValid && <div className="field-err">El RUC debe tener 11 dígitos</div>}
              </div>
              <div className="fg">
                <label className="lbl">Teléfono</label>
                <input className={`inp${bizForm.phone && !bizPhoneValid ? " inp-err" : ""}`} value={bizForm.phone} onChange={(e) => setBizField("phone", e.target.value.replace(/\D/g, ""))} maxLength={15} type="tel" inputMode="numeric" placeholder="984000111" />
                {bizForm.phone && !bizPhoneValid && <div className="field-err">Teléfono de 8 a 15 dígitos</div>}
              </div>
              <div className="fg">
                <label className="lbl">Ciudad</label>
                <input className="inp" value={bizForm.city} onChange={(e) => setBizField("city", e.target.value)} maxLength={50} />
              </div>
              {/* Email NO editable: solo-lectura (fondo atenuado, candado),
                  claramente distinto de los inputs. Sale del token. La
                  verificación NO va aquí: tiene su propia sección aparte. */}
              <div className="fg">
                <label className="lbl">Email de contacto</label>
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 14px", borderRadius: 12, background: "var(--cr)", border: "1px solid var(--sd)", color: "var(--gy)" }}>
                  <Lock size={14} strokeWidth={1.5} style={{ flexShrink: 0 }} />
                  <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.email || operator?.email || "—"}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, flexShrink: 0 }}>No editable</span>
                </div>
                <div style={{ fontSize: 11, color: "var(--gy)", marginTop: 4, lineHeight: 1.5 }}>Email de tu cuenta · no editable.</div>
              </div>
              {bizError && <div className="field-err" style={{ marginBottom: 10 }}>{bizError}</div>}
              <div style={{ display: "flex", gap: 8 }}>
                <button className="mbtn" style={{ flex: 1, marginTop: 0 }} disabled={!bizFormValid || bizBusy} onClick={saveBiz}>{bizBusy ? "Guardando…" : "Guardar cambios"}</button>
                <button className="rv-cancel" style={{ flex: 1 }} disabled={bizBusy} onClick={() => { setEditingBiz(false); setBizError(""); }}>Cancelar</button>
              </div>
            </>
          )}
        </div>

        {/* Estado de verificación — 3 estados según operator.verified + mincetur.
            verified SOLO lo marca Finde a mano tras validar; el operador solo
            envía/edita su N° MINCETUR. El badge del viajero depende solo de verified. */}
        <div className="biz-sec">
          <div className="biz-sec-t"><ShieldCheck size={16} strokeWidth={1.5} /> Estado de verificación</div>

          {operator?.verified ? (
            // ── Verificado ──
            <div style={{ padding: 14, borderRadius: 12, background: "rgba(45,90,61,.06)", borderLeft: "3px solid var(--m)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <ShieldCheck size={18} strokeWidth={1.5} style={{ color: "var(--m)", flexShrink: 0 }} />
                <span className="biz-badge ok"><Check size={12} strokeWidth={2} /> Verificado</span>
              </div>
              <div style={{ fontSize: 13, color: "var(--ch)", lineHeight: 1.5 }}>Tu negocio está verificado. Tus tours muestran el sello “Finde Verificado”.</div>
              {operator?.mincetur && (
                <div style={{ fontSize: 12, color: "var(--gy)", marginTop: 8 }}>N° MINCETUR: <strong style={{ color: "var(--ch)" }}>{operator.mincetur}</strong></div>
              )}
            </div>
          ) : operator?.mincetur && !showMincInput ? (
            // ── En revisión (ya envió su N° MINCETUR) ──
            <div style={{ padding: 14, borderRadius: 12, background: "rgba(212,168,67,.08)", borderLeft: "3px solid var(--gd)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <Clock size={18} strokeWidth={1.5} style={{ color: "var(--gd)", flexShrink: 0 }} />
                <span className="biz-badge pending"><Clock size={12} strokeWidth={1.5} /> En revisión</span>
              </div>
              <div style={{ fontSize: 13, color: "var(--ch)", lineHeight: 1.5 }}>Recibimos tu N° MINCETUR y lo estamos validando. Te avisaremos cuando la verificación esté lista; mientras tanto tus tours ya pueden publicarse.</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--sd)" }}>
                <div style={{ fontSize: 12, color: "var(--gy)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>N° MINCETUR: <strong style={{ color: "var(--ch)" }}>{operator.mincetur}</strong></div>
                <button onClick={startMincInput} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", color: "var(--f)", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}><Pencil size={13} strokeWidth={1.5} /> Editar</button>
              </div>
            </div>
          ) : (
            // ── Sin enviar (o editando): CTA + input ──
            <div style={{ padding: 14, borderRadius: 12, background: "rgba(212,168,67,.08)", borderLeft: "3px solid var(--gd)" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ch)", marginBottom: 6 }}>Verifica tu agencia</div>
              <div style={{ fontSize: 13, color: "var(--ch)", lineHeight: 1.5, marginBottom: 12 }}>Envía tu N° de registro MINCETUR para que Finde verifique tu agencia. Al verificarte, tus tours muestran el sello “Finde Verificado”.</div>
              <div className="fg" style={{ marginBottom: 10 }}>
                <label className="lbl">N° de registro MINCETUR</label>
                <input className={`inp${mincForm && !minceturValid ? " inp-err" : ""}`} value={mincForm} onChange={(e) => setMincForm(e.target.value)} maxLength={30} placeholder="Ej. CAL-12345" />
                {mincForm && !minceturValid && <div className="field-err">3 a 30 caracteres alfanuméricos o guiones.</div>}
              </div>
              {mincError && <div className="field-err" style={{ marginBottom: 10 }}>{mincError}</div>}
              <div style={{ display: "flex", gap: 8 }}>
                <button className="mbtn" style={{ flex: 1, marginTop: 0 }} disabled={!minceturValid || mincBusy} onClick={submitMincetur}>{mincBusy ? "Enviando…" : operator?.mincetur ? "Guardar" : "Enviar para verificación"}</button>
                {operator?.mincetur && <button className="rv-cancel" style={{ flex: 1 }} disabled={mincBusy} onClick={() => { setShowMincInput(false); setMincError(""); }}>Cancelar</button>}
              </div>
            </div>
          )}
        </div>
      </div>}

      {/* ── MIS TOURS ── */}
      {tab === "listings" && <div className="fu">
        {toggleErr && (
          <div className="field-err" style={{ margin: "0 0 12px", textAlign: "center" }}>{toggleErr}</div>
        )}
        {opTours.map((t) => (
          <div key={t.id} className="dsh-ls" style={{ flexDirection: "column", gap: 0, padding: 0, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 12 }}>
              <div className="dsh-ls-img" style={{ ...imgBg(t.image), flexShrink: 0 }} />
              <div className="dsh-ls-i" style={{ flex: 1, minWidth: 0 }}>
                <div className="dsh-ls-t" style={{ opacity: t.active ? 1 : 0.45 }}>{t.title}</div>
                <div className="dsh-ls-m">{t.location} · {t.duration}</div>
                <div className="dsh-ls-sts">
                  <div className="dsh-ls-st"><Star size={13} strokeWidth={1.5} fill="currentColor" /> <span className="v">{t.rating}</span></div>
                  <div className="dsh-ls-st"><MessageCircle size={13} strokeWidth={1.5} /> <span className="v">{t.reviews}</span></div>
                  <div className="dsh-ls-st">S/ <span className="v">{t.price}</span></div>
                </div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); handleToggle(t); }} style={{
                width: 44, height: 24, borderRadius: 12, flexShrink: 0, border: "none", padding: 0,
                background: t.active ? "var(--f)" : "var(--lg)",
                position: "relative", cursor: "pointer", transition: "background .2s"
              }}>
                <div style={{
                  position: "absolute", top: 3, width: 18, height: 18, borderRadius: "50%",
                  background: "white", transition: "left .2s", pointerEvents: "none",
                  left: t.active ? 23 : 3
                }} />
              </button>
            </div>
            <div style={{ borderTop: "1px solid var(--cr)", display: "flex" }}>
              <button style={{
                flex: 1, padding: "9px 0", background: "none", border: "none",
                fontSize: 12, fontWeight: 600, color: "var(--f)", cursor: "pointer", fontFamily: "inherit"
              }} onClick={() => onEditTour(t)}><Pencil size={13} strokeWidth={1.5} /> Editar</button>
              <div style={{ width: 1, background: "var(--cr)" }} />
              <button style={{
                flex: 1, padding: "9px 0", background: "none", border: "none",
                fontSize: 12, fontWeight: 600, color: "#C0392B", cursor: "pointer", fontFamily: "inherit",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 4
              }} onClick={() => askDelete(t)}><Trash2 size={13} strokeWidth={1.5} /> Borrar</button>
            </div>
          </div>
        ))}
        <div style={{ padding: 16 }}>
          <button className="mbtn" style={{ background: "var(--tr)" }} onClick={() => go("new-tour")}>+ Agregar nuevo tour</button>
        </div>
      </div>}

      {/* Diálogo de confirmación de borrado (Sub-paso M2.6b). Borrado real solo
          al Confirmar; Cancelar (o clic en el fondo) cierra sin borrar. */}
      {confirmDel && (
        <div
          onClick={cancelDelete}
          style={{
            position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,.45)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
            animation: "fadeUp .2s ease-out"
          }}
          role="dialog"
          aria-modal="true"
        >
          <div onClick={(e) => e.stopPropagation()} style={{
            width: "100%", maxWidth: 340, background: "white", borderRadius: 18, padding: 20,
            boxShadow: "0 12px 40px rgba(0,0,0,.25)"
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: "50%", background: "rgba(192,57,43,.1)",
              display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12
            }}>
              <Trash2 size={20} strokeWidth={1.75} style={{ color: "#C0392B" }} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--ch)", marginBottom: 6 }}>
              ¿Borrar este tour?
            </div>
            <div style={{ fontSize: 13, color: "var(--gy)", lineHeight: 1.5, marginBottom: 16 }}>
              "{confirmDel.title}" se eliminará de forma permanente. Esta acción no se puede deshacer.
            </div>
            {delError && <div className="field-err" style={{ marginBottom: 12 }}>{delError}</div>}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={cancelDelete}
                disabled={delBusy}
                style={{
                  flex: 1, padding: "11px 0", borderRadius: 12, border: "1.5px solid var(--sd)",
                  background: "white", color: "var(--ch)", fontSize: 13, fontWeight: 700,
                  cursor: delBusy ? "default" : "pointer", fontFamily: "inherit", opacity: delBusy ? 0.6 : 1
                }}
              >Cancelar</button>
              <button
                onClick={confirmDelete}
                disabled={delBusy}
                style={{
                  flex: 1, padding: "11px 0", borderRadius: 12, border: "none",
                  background: "#C0392B", color: "white", fontSize: 13, fontWeight: 700,
                  cursor: delBusy ? "default" : "pointer", fontFamily: "inherit", opacity: delBusy ? 0.7 : 1
                }}
              >{delBusy ? "Borrando…" : "Borrar"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── NEW TOUR WIZARD ───────────────────────────────────
function NewTourView({ go, editingTour, onSaveTour, onCreateTour, onCancel }) {
  const isEditing = !!editingTour;
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(isEditing ? {
    title: editingTour.title || "",
    location: editingTour.location || "",
    meetingPoint: editingTour.meetingPoint || "",
    category: editingTour.category || "adventure",
    duration: editingTour.duration || "",
    price: String(editingTour.price || ""),
    capacity: String(editingTour.capacity || ""),
    difficulty: editingTour.difficulty || "Moderada",
    description: editingTour.description || "",
    included: editingTour.included || "",
    excluded: editingTour.excluded || "",
    days: editingTour.days || [],
    excludedDates: editingTour.excludedDates || [],
    addedDates: editingTour.addedDates || [],
    startTime: editingTour.startTime || "08:00",
    cancellation: editingTour.cancellation || "flexible",
    // La imagen de un tour del API vive en `image` (URL); `photo` suele venir
    // null. Cargarla aquí hace que el editor la muestre y la re-envíe (al ser
    // URL http) para que el backend la preserve en vez de borrarla.
    photo: editingTour.photo || editingTour.image || null,
  } : {
    title: "", location: "", meetingPoint: "", category: "adventure", duration: "", price: "",
    capacity: "", difficulty: "Moderada", description: "", included: "", excluded: "",
    days: [], excludedDates: [], addedDates: [], startTime: "08:00", cancellation: "flexible", photo: null
  });
  const [aiDesc, setAiDesc] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [published, setPublished] = useState(false);
  // Sub-paso 2.5: estado del submit de creación (POST /api/tours es async; el
  // embedding agrega 1-2s). El modo edición (2.6) sigue siendo síncrono.
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  // Sub-paso 3.2: estado de la subida de foto (Flujo A — el archivo va directo
  // a Supabase Storage con una signed URL que emite el backend en 3.1).
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const u = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  // Sube la foto real a Storage (Flujo A) y deja la URL pública en form.photo.
  // Reemplaza el viejo readAsDataURL (que descartaba el archivo). Como photo
  // queda como URL http(s), tourFormToApiBody la incluye y el backend la guarda
  // en imageUrl — sin cambios en el submit.
  const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png"];
  const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5MB, alineado con el bucket.
  const handlePhotoUpload = async (file) => {
    if (!file) return;
    setUploadError("");
    // 1. Validación de front (UX): tipo y tamaño ANTES de pedir la URL firmada.
    if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
      setUploadError("Formato no válido. Sube una imagen JPG o PNG.");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setUploadError("La imagen supera los 5MB. Elige una más liviana.");
      return;
    }
    setUploading(true);
    try {
      // 2. Pedir la signed upload URL (solo operadores; authFetch agrega Bearer).
      const r = await authFetch("/api/uploads/tour-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType: file.type }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${r.status}`);
      }
      const { token, path, publicUrl } = await r.json();
      // 3. Subir el archivo DIRECTO a Storage con la URL firmada (no pasa por
      //    la function → esquiva el límite ~4.5MB de Vercel).
      const { error: upErr } = await supabase.storage
        .from("tour-images")
        .uploadToSignedUrl(path, token, file);
      if (upErr) throw new Error(upErr.message || "No se pudo subir la imagen");
      // 4. Éxito: la URL pública va a form.photo (el submit ya sabe usarla).
      setForm(prev => ({ ...prev, photo: publicUrl }));
    } catch (e) {
      setUploadError(e.message || "No pudimos subir la imagen. Intenta de nuevo.");
    } finally {
      setUploading(false);
    }
  };

  const generateAiDesc = async () => {
    if (!form.title || !form.location) return;
    setAiLoading(true);
    setAiError("");
    try {
      const cityRegion = form.location.split(",").map(s => s.trim());
      const apiCat = CAT_UI_TO_API[form.category] || form.category;
      const allowed = ["adventure", "cultural", "gastronomy", "nature", "mystic"];
      const safeCat = allowed.includes(apiCat) ? apiCat : "adventure";
      const hours = parseInt((form.duration || "").match(/\d+/)?.[0] || "8", 10);
      const inclArr = form.included
        ? form.included.split(",").map(s => s.trim()).filter(s => s.length >= 1).slice(0, 10)
        : [];
      const highlights = (form.included
        ? form.included.split(",").map(s => s.trim()).filter(s => s.length >= 5)
        : []).slice(0, 5);
      if (highlights.length === 0) highlights.push(`${form.title} en ${cityRegion[0] || form.location}`);
      const body = {
        title: form.title,
        category: safeCat,
        durationHours: Math.max(1, Math.min(168, hours)),
        city: cityRegion[0] || form.location,
        region: cityRegion[1] || cityRegion[0] || form.location,
        highlights,
        ...(inclArr.length ? { included: inclArr } : {}),
      };
      const r = await fetch("/api/ai/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${r.status}`);
      }
      const data = await r.json();
      setAiDesc(data.description || "");
    } catch (e) {
      setAiError(e.message || "No pudimos generar la descripción. Intenta de nuevo.");
    } finally {
      setAiLoading(false);
    }
  };

  if (published) {
    return (
      <div className="suc fu">
        <div className="suc-chk"><Check size={28} strokeWidth={2.5} /></div>
        <div className="suc-t">{isEditing ? "¡Tour actualizado!" : "¡Tour publicado!"}</div>
        <div className="suc-sub">"{form.title}" {isEditing ? "ha sido actualizado correctamente." : "ya está visible para miles de viajeros en Finde."}</div>
        <div className="suc-card">
          <div className="suc-row"><span className="l">Tour</span><span style={{ fontWeight: 700 }}>{form.title}</span></div>
          <div className="suc-row"><span className="l">Ubicación</span><span>{form.location}</span></div>
          <div className="suc-row"><span className="l">Precio</span><span style={{ fontWeight: 800, color: "var(--f)" }}>S/ {form.price || "0"}</span></div>
          <div className="suc-row"><span className="l">Cantidad de personas</span><span>{form.capacity} personas</span></div>
        </div>
        <button className="mbtn" onClick={() => isEditing ? onSaveTour({ ...editingTour, ...form, price: Number(form.price) || editingTour.price, image: form.photo ? `url(${form.photo})` : editingTour.image }) : go("dashboard")}>Volver al panel</button>
      </div>
    );
  }

  // Validez del paso 2, alineada con las reglas zod del backend (lib/tour-input.ts).
  // Antes estos campos no se validaban en el front y fallaban recién al publicar
  // con un "Cuerpo inválido" que no decía cuál.
  const durationValid = (form.duration || "").trim().length >= 1; // requerido (min 1)
  const priceNum = Number(form.price);
  const priceValid = Number.isFinite(priceNum) && priceNum > 0 && priceNum <= 100000;
  const capacityRaw = (form.capacity ?? "").toString().trim();
  const capacityNum = Number(form.capacity);
  // Tope superior (3000) es solo red de seguridad silenciosa, alineada con el
  // backend; no se comunica al usuario porque en la práctica nadie lo alcanza.
  const capacityInRange = Number.isInteger(capacityNum) && capacityNum >= 1 && capacityNum <= 3000;
  // Requerido (sin default): vacío es inválido y bloquea el "Siguiente".
  const capacityValid = capacityRaw !== "" && capacityInRange;

  return (
    <div className="bkf fu">
      <button className="bk-btn" onClick={() => step === 1 ? onCancel() : setStep(step - 1)} style={{ position: "relative", marginBottom: 16 }} aria-label={step === 1 ? "Cancelar" : "Paso anterior"} type="button"><ArrowLeft size={20} strokeWidth={1.5} /></button>
      <div className="bkf-st">
        {[1, 2, 3, 4, 5].map((s) => <div key={s} className={`bkf-s ${step >= s ? "on" : ""}`} />)}
      </div>

      {/* Step 1: Información básica */}
      {step === 1 && <div className="fu">
        <div className="bkf-t">Información básica</div>
        <div className="bkf-sub">Paso 1 de 5 · Nombre, ubicación y categoría</div>
        <div className="fg">
          <label className="lbl">Nombre del tour <span style={{ color: "var(--tr)" }}>*</span></label>
          <input
            className={`inp${(form.title || "").trim().length > 0 && (form.title || "").trim().length < 3 ? " inp-err" : ""}`}
            placeholder="Ej: Trekking al Nevado Pastoruri"
            value={form.title}
            onChange={(e) => u("title", e.target.value)}
          />
          {(form.title || "").trim().length > 0 && (form.title || "").trim().length < 3 && (
            <div className="field-err">El nombre debe tener al menos 3 caracteres</div>
          )}
        </div>
        <div className="fg">
          <label className="lbl">Ubicación <span style={{ color: "var(--tr)" }}>*</span></label>
          <input className="inp" placeholder="Ej: Huaraz, Áncash" value={form.location} onChange={(e) => u("location", e.target.value)} />
        </div>
        <div className="fg">
          <label className="lbl">Punto de encuentro <span style={{ color: "var(--tr)" }}>*</span></label>
          <div style={{ fontSize: 11, color: "var(--gy)", marginBottom: 8, lineHeight: 1.5 }}>
            Lugar exacto donde tus viajeros te encontrarán (ej. "Frente a Larcomar, tienda Inkawasi, segundo piso")
          </div>
          <input
            className={`inp${form.meetingPoint && form.meetingPoint.trim().length < 10 ? " inp-err" : ""}`}
            placeholder="Ej. Plaza de Armas, frente a la catedral"
            value={form.meetingPoint}
            maxLength={200}
            onChange={(e) => u("meetingPoint", e.target.value)}
          />
          {form.meetingPoint && form.meetingPoint.trim().length < 10 && (
            <div className="field-err">Indica un punto de encuentro claro (mínimo 10 caracteres)</div>
          )}
        </div>
        <div className="fg">
          <label className="lbl">Categoría</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {CATS.filter((c) => c.id !== "all").map((c) => (
              <button key={c.id} className={`chip ${form.category === c.id ? "on" : ""}`}
                style={{ fontSize: 12, padding: "6px 14px" }}
                onClick={() => u("category", c.id)}><c.ic size={16} strokeWidth={1.5} /> {c.n}</button>
            ))}
          </div>
        </div>
        <div className="fg">
          <label className="lbl">Dificultad</label>
          <div style={{ display: "flex", gap: 6 }}>
            {["Fácil", "Moderada", "Alta"].map((d) => (
              <button key={d} className={`chip ${form.difficulty === d ? "on" : ""}`}
                style={{ fontSize: 12, padding: "6px 14px", flex: 1, justifyContent: "center" }}
                onClick={() => u("difficulty", d)}>{d}</button>
            ))}
          </div>
        </div>
        <div className="fg">
          <label className="lbl">Foto principal del tour <span style={{ color: "var(--gy)", fontWeight: 500 }}>(opcional)</span></label>
          {!form.photo && isEditing && editingTour.image && (
            <div style={{ borderRadius: 16, overflow: "hidden", height: 100, marginBottom: 8, ...imgBg(editingTour.image), display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,.7)", fontWeight: 600 }}>Imagen actual · Sube una foto para reemplazarla</span>
            </div>
          )}
          {uploading ? (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: 8, padding: 24, borderRadius: 16, border: "2px dashed var(--lg)",
              background: "var(--cr)"
            }}>
              <Camera size={28} strokeWidth={1.5} style={{ color: "var(--f)", opacity: .5 }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--f)" }}>Subiendo…</span>
              <span style={{ fontSize: 11, color: "var(--gy)", textAlign: "center" }}>Subiendo tu foto, no cierres esta pantalla.</span>
            </div>
          ) : !form.photo ? (
            <label style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: 8, padding: 24, borderRadius: 16, border: "2px dashed var(--lg)",
              cursor: "pointer", background: "var(--cr)"
            }}>
              <Camera size={28} strokeWidth={1.5} style={{ color: "var(--f)" }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--f)" }}>{isEditing ? "Cambiar foto" : "Subir foto"}</span>
              <span style={{ fontSize: 11, color: "var(--gy)", textAlign: "center" }}>Recomendado: 1200×800px · JPG o PNG · máx 5MB</span>
              <span style={{ fontSize: 11, color: "var(--gy)", textAlign: "center" }}>Opcional por ahora — sin foto usamos un diseño por defecto.</span>
              <input type="file" accept="image/jpeg,image/png" style={{ display: "none" }}
                onChange={(e) => { handlePhotoUpload(e.target.files[0]); e.target.value = ""; }} />
            </label>
          ) : (
            <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", height: 160 }}>
              <img src={form.photo} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              <button onClick={(e) => { e.preventDefault(); u("photo", null); }} style={{
                position: "absolute", top: 8, right: 8, width: 28, height: 28,
                borderRadius: "50%", background: "rgba(0,0,0,.55)", border: "none",
                color: "white", fontSize: 14, cursor: "pointer", fontFamily: "inherit"
              }}><X size={14} strokeWidth={2} /></button>
            </div>
          )}
          {uploadError && (
            <div style={{ marginTop: 8, fontSize: 12, fontWeight: 600, color: "var(--tr)" }}>{uploadError}</div>
          )}
        </div>
        <button className="mbtn" style={{ marginTop: 8 }}
          disabled={(form.title || "").trim().length < 3 || (form.location || "").trim().length < 2 || (form.meetingPoint || "").trim().length < 10}
          onClick={() => setStep(2)}>Siguiente</button>
      </div>}

      {/* Step 2: Detalles */}
      {step === 2 && <div className="fu">
        <div className="bkf-t">Detalles del tour</div>
        <div className="bkf-sub">Paso 2 de 5 · Duración, precio y capacidad</div>
        <div className="fg">
          <label className="lbl">Duración <span style={{ color: "var(--tr)" }}>*</span></label>
          <input
            className="inp"
            placeholder="Ej: 8 horas, Full day, 2 días"
            value={form.duration}
            onChange={(e) => u("duration", e.target.value)}
          />
          <div style={{ fontSize: 11, color: "var(--gy)", marginTop: 4 }}>Ej. "8 horas", "Full day" o "2 días". Obligatorio.</div>
        </div>
        <div className="fg">
          <label className="lbl">Precio por persona (S/) <span style={{ color: "var(--tr)" }}>*</span></label>
          <input
            className={`inp${form.price !== "" && form.price != null && !priceValid ? " inp-err" : ""}`}
            placeholder="150"
            type="number"
            value={form.price}
            onChange={(e) => u("price", e.target.value)}
          />
          {form.price !== "" && form.price != null && !priceValid
            ? <div className="field-err">El precio debe estar entre S/ 1 y S/ 100,000</div>
            : <div style={{ fontSize: 11, color: "var(--gy)", marginTop: 4 }}>Entre S/ 1 y S/ 100,000</div>}
        </div>
        <div className="fg">
          <label className="lbl">Cantidad de personas <span style={{ color: "var(--tr)" }}>*</span></label>
          <input
            className={`inp${capacityRaw !== "" && !capacityInRange ? " inp-err" : ""}`}
            placeholder="12"
            type="number"
            value={form.capacity}
            onChange={(e) => u("capacity", e.target.value)}
          />
          {capacityRaw !== "" && !capacityInRange
            ? <div className="field-err">Ingresa un número entero válido (mínimo 1)</div>
            : <div style={{ fontSize: 11, color: "var(--gy)", marginTop: 4 }}>Personas por salida. Obligatorio.</div>}
        </div>
        <div className="fg">
          <label className="lbl">Qué incluye (separado por comas)</label>
          <input className="inp" placeholder="Transporte, guía, almuerzo, entrada" value={form.included} onChange={(e) => u("included", e.target.value)} />
        </div>
        <div className="fg">
          <label className="lbl">Qué no incluye (separado por comas)</label>
          <input className="inp" placeholder="Propinas, snacks, seguro" value={form.excluded} onChange={(e) => u("excluded", e.target.value)} />
        </div>
        <button className="mbtn" style={{ marginTop: 8 }} disabled={!durationValid || !priceValid || !capacityValid} onClick={() => setStep(3)}>Siguiente</button>
      </div>}

      {/* Step 3: Disponibilidad */}
      {step === 3 && <div className="fu">
        <div className="bkf-t">Disponibilidad</div>
        <div className="bkf-sub">Paso 3 de 5 · Días y horario{SHOW_CANCELLATION_POLICY ? " y cancelación" : ""}</div>
        <div className="fg">
          <label className="lbl">Días que operas</label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[["L","lun"],["M","mar"],["M","mie"],["J","jue"],["V","vie"],["S","sab"],["D","dom"]].map(([short, code]) => {
              const active = form.days.includes(code);
              return (
                <button key={code}
                  type="button"
                  onClick={() => u("days", active ? form.days.filter(d => d !== code) : [...form.days, code])}
                  style={{
                    width: 40, height: 40, borderRadius: "50%", border: "2px solid",
                    borderColor: active ? "var(--f)" : "var(--lg)",
                    background: active ? "var(--f)" : "transparent",
                    color: active ? "white" : "var(--gy)",
                    fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit"
                  }}>{short}</button>
              );
            })}
          </div>
          <div style={{ fontSize: 11, color: "var(--gy)", marginTop: 6 }}>
            {form.days.length === 0
              ? "Sin días recurrentes — usa el calendario abajo para fechas específicas"
              : `Opera: ${form.days.map(d => DAY_LABEL_LONG[d] || d).join(", ")}`}
          </div>
        </div>
        {/* Calendario de excepciones — Reglas v1.2 §3.2 */}
        <div className="fg" style={{ marginTop: 4 }}>
          <label className="lbl">Calendario de excepciones</label>
          <div style={{ fontSize: 11, color: "var(--gy)", lineHeight: 1.5, marginBottom: 12 }}>
            Por defecto, tu tour opera todos los días marcados arriba. Aquí puedes <strong>excluir</strong> fechas (feriados, mantenimiento) o <strong>agregar</strong> fechas extras fuera del patrón. Si solo operas según los días marcados, deja este calendario en blanco.
          </div>
          <MonthCalendar
            mode="edit"
            days={form.days}
            excludedDates={form.excludedDates}
            addedDates={form.addedDates}
            onToggleException={(iso, state) => {
              setForm(prev => {
                const ex = new Set(prev.excludedDates);
                const ad = new Set(prev.addedDates);
                if (state === "pattern") ex.add(iso);
                else if (state === "excluded") ex.delete(iso);
                else if (state === "neutral") ad.add(iso);
                else if (state === "added") ad.delete(iso);
                return {
                  ...prev,
                  excludedDates: [...ex].sort(),
                  addedDates: [...ad].sort(),
                };
              });
            }}
          />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 12, fontSize: 11, color: "var(--gy)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 12, height: 12, borderRadius: 4, background: "var(--cr)", border: "1px solid var(--sd)" }} />Día operativo
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 12, height: 12, borderRadius: 4, background: "rgba(199,97,58,.15)" }} />Excluido
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 12, height: 12, borderRadius: 4, background: "var(--f)" }} />Agregado extra
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 12, height: 12, borderRadius: 4, background: "white", border: "1px solid var(--lg)" }} />Sin operación
            </div>
          </div>
        </div>
        <div className="fg">
          <label className="lbl">Hora de salida</label>
          <input className="inp" type="time" value={form.startTime} onChange={(e) => u("startTime", e.target.value)} />
        </div>
        {/* Campo de política de cancelación oculto en el piloto vía flag. El
            estado form.cancellation conserva su default ("flexible") aunque el
            input no se muestre → el submit sigue mandando un valor válido. */}
        {SHOW_CANCELLATION_POLICY && (
        <div className="fg">
          <label className="lbl">Política de cancelación</label>
          <div style={{ fontSize: 11, color: "var(--gy)", marginBottom: 8, lineHeight: 1.5 }}>
            Elige la que aplica a este tour. Recomendamos <strong>Flexible</strong> para tours cortos.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { id: "flexible", label: "Flexible", desc: "100% si cancela 24+ horas antes. 0% con menos de 24h." },
              { id: "moderada", label: "Moderada", desc: "100% si cancela 72+ horas antes. 50% entre 72h y 24h. 0% con menos de 24h." },
              { id: "estricta", label: "Estricta", desc: "100% si cancela 30+ días antes. 50% entre 15 y 30 días. 0% con menos de 15 días." },
              { id: "no_reembolsable", label: "No reembolsable", desc: "Sin reembolso desde el momento del pago. Solo para tours con permisos prepagados." },
            ].map((opt) => (
              <div key={opt.id} onClick={() => u("cancellation", opt.id)} style={{
                padding: "12px 14px", borderRadius: 12, border: "2px solid",
                borderColor: form.cancellation === opt.id ? "var(--f)" : "var(--lg)",
                background: form.cancellation === opt.id ? "rgba(27,58,45,.05)" : "transparent",
                cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 10
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: "50%",
                  background: form.cancellation === opt.id ? "var(--f)" : "var(--lg)",
                  color: "white", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 700, flexShrink: 0, marginTop: 1
                }}>{form.cancellation === opt.id ? "●" : ""}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ch)" }}>{opt.label}</div>
                  <div style={{ fontSize: 11, color: "var(--gy)", lineHeight: 1.5, marginTop: 2 }}>{opt.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        )}
        {form.days.length === 0 && form.addedDates.length === 0 && (
          <div style={{ padding: 10, background: "rgba(199,97,58,.08)", borderRadius: 10, fontSize: 12, color: "var(--tr)", lineHeight: 1.5, marginTop: 8, marginBottom: 8 }}>
            Configura al menos un día recurrente o agrega fechas específicas en el calendario
          </div>
        )}
        <button className="mbtn" style={{ marginTop: 8 }} disabled={form.days.length === 0 && form.addedDates.length === 0} onClick={() => setStep(4)}>Siguiente</button>
      </div>}

      {/* Step 4: Descripción con IA */}
      {step === 4 && <div className="fu">
        <div className="bkf-t">Descripción</div>
        <div className="bkf-sub">Paso 4 de 5 · Escríbela tú o usa la IA</div>
        <div className="fg">
          <label className="lbl">Descripción del tour <span style={{ color: "var(--tr)" }}>*</span></label>
          <textarea className="ai-cc-input" style={{ minHeight: 100 }} placeholder="Describe tu experiencia con detalle: qué verán los viajeros, qué hace especial este tour, qué pueden esperar..."
            value={form.description} onChange={(e) => u("description", e.target.value)} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
            {(form.description || "").trim().length > 0 && (form.description || "").trim().length < 10
              ? <span className="field-err">Mínimo 10 caracteres</span>
              : <span style={{ fontSize: 11, color: "var(--gy)", fontWeight: 600 }}>Mínimo 10 caracteres</span>}
            <span style={{ fontSize: 11, fontWeight: 600, color: (form.description || "").trim().length >= 10 ? "var(--m)" : "var(--gy)" }}>
              {(form.description || "").trim().length}/10
            </span>
          </div>
        </div>
        <div style={{ padding: 14, background: "var(--cr)", borderRadius: 12, marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--f)", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}><Sparkles size={12} strokeWidth={1.5} /> Generador IA</div>
          <div style={{ fontSize: 11, color: "var(--gy)", marginBottom: 10 }}>Genera una descripción profesional basada en los datos que ya ingresaste</div>
          <button className="ai-cc-btn" onClick={generateAiDesc} disabled={aiLoading || !form.title || !form.location}>
            <Sparkles size={12} strokeWidth={1.5} /> {aiLoading ? "Generando…" : "Generar descripción"}
          </button>
          {aiError && <div className="field-err" style={{ marginTop: 8 }}>{aiError}</div>}
          {aiDesc && (
            <div style={{ marginTop: 12, padding: 12, background: "white", borderRadius: 10, fontSize: 13, lineHeight: 1.6, color: "var(--ch)" }}>
              {aiDesc}
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button style={{ padding: "6px 14px", borderRadius: 8, background: "var(--f)", color: "white", border: "none", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                  onClick={() => u("description", aiDesc)}>Usar esta</button>
                <button style={{ padding: "6px 14px", borderRadius: 8, background: "var(--sd)", color: "var(--ch)", border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                  onClick={generateAiDesc}>Regenerar</button>
              </div>
            </div>
          )}
        </div>
        <button className="mbtn" disabled={(form.description || "").trim().length < 10} onClick={() => setStep(5)}>Siguiente</button>
      </div>}

      {/* Step 5: Revisión y publicar */}
      {step === 5 && <div className="fu">
        <div className="bkf-t">{isEditing ? "Revisar y guardar" : "Revisar y publicar"}</div>
        <div className="bkf-sub">Paso 5 de 5 · Verifica que todo esté correcto</div>

        {form.photo && (
          <div style={{ borderRadius: 16, overflow: "hidden", height: 160, marginBottom: 16 }}>
            <img src={form.photo} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        )}

        <div className="sum">
          <div className="sum-r"><span style={{ color: "var(--gy)" }}>Nombre</span><span style={{ fontWeight: 700 }}>{form.title}</span></div>
          <div className="sum-r"><span style={{ color: "var(--gy)" }}>Ubicación</span><span>{form.location}</span></div>
          {form.meetingPoint && (
            <div className="sum-r"><span style={{ color: "var(--gy)" }}>Punto de encuentro</span><span style={{ textAlign: "right", maxWidth: "60%" }}>{form.meetingPoint}</span></div>
          )}
          <div className="sum-r"><span style={{ color: "var(--gy)" }}>Categoría</span><span>{CATS.find((c) => c.id === form.category)?.n}</span></div>
          <div className="sum-r"><span style={{ color: "var(--gy)" }}>Dificultad</span><span>{form.difficulty}</span></div>
          <div className="sum-r"><span style={{ color: "var(--gy)" }}>Duración</span><span>{form.duration}</span></div>
          <div className="sum-r"><span style={{ color: "var(--gy)" }}>Cantidad de personas</span><span>{form.capacity} personas</span></div>
          <div className="sum-r"><span style={{ color: "var(--gy)" }}>Días recurrentes</span><span>{form.days.length > 0 ? form.days.map(d => DAY_LABEL[d] || d).join(", ") : "—"}</span></div>
          {(form.excludedDates.length > 0 || form.addedDates.length > 0) && (
            <div className="sum-r">
              <span style={{ color: "var(--gy)" }}>Excepciones</span>
              <span style={{ textAlign: "right" }}>
                {form.excludedDates.length > 0 && `${form.excludedDates.length} fecha${form.excludedDates.length > 1 ? "s" : ""} excluida${form.excludedDates.length > 1 ? "s" : ""}`}
                {form.excludedDates.length > 0 && form.addedDates.length > 0 && " · "}
                {form.addedDates.length > 0 && `${form.addedDates.length} fecha${form.addedDates.length > 1 ? "s" : ""} extra agregada${form.addedDates.length > 1 ? "s" : ""}`}
              </span>
            </div>
          )}
          <div className="sum-r"><span style={{ color: "var(--gy)" }}>Hora salida</span><span>{form.startTime}</span></div>
          {SHOW_CANCELLATION_POLICY && <div className="sum-r"><span style={{ color: "var(--gy)" }}>Cancelación</span><span>{getCancelPolicy(form.cancellation).label}</span></div>}
          <div className="sum-t"><span>Precio por persona</span><span>S/ {form.price}</span></div>
        </div>

        {form.description && (
          <div style={{ marginBottom: 16 }}>
            <div className="lbl">Descripción</div>
            <div style={{ fontSize: 13, lineHeight: 1.6, color: "#555", padding: 14, background: "var(--cr)", borderRadius: 12 }}>{form.description}</div>
          </div>
        )}
        {form.included && (
          <div style={{ marginBottom: 16 }}>
            <div className="lbl">Incluye</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {form.included.split(",").map((x, i) => <div key={i} className="det-inc"><div className="det-ic iy"><Check size={14} strokeWidth={2} /></div>{x.trim()}</div>)}
            </div>
          </div>
        )}
        {form.excluded && (
          <div style={{ marginBottom: 16 }}>
            <div className="lbl">No incluye</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {form.excluded.split(",").map((x, i) => <div key={i} className="det-inc"><div className="det-ic in"><X size={14} strokeWidth={2} /></div>{x.trim()}</div>)}
            </div>
          </div>
        )}

        <div style={{ padding: 12, background: "rgba(45,90,61,.05)", borderRadius: 12, marginBottom: 16, fontSize: 12, color: "var(--gy)", lineHeight: 1.5 }}>
          Al publicar, tu tour quedará visible de inmediato en Finde.
        </div>
        {submitError && (
          <div className="field-err" style={{ marginBottom: 10, textAlign: "center" }}>{submitError}</div>
        )}
        <button className="mbtn" disabled={submitting} onClick={async () => {
          setSubmitError("");
          setSubmitting(true);
          if (isEditing) {
            const result = await onSaveTour({ ...editingTour, ...form, price: Number(form.price) || editingTour.price, image: form.photo ? `url(${form.photo})` : editingTour.image });
            setSubmitting(false);
            if (!result?.ok) {
              setSubmitError(result?.error || "No pudimos guardar los cambios. Intenta de nuevo.");
            }
            return;
          }
          const result = await onCreateTour(form);
          setSubmitting(false);
          if (result?.ok) {
            setPublished(true);
          } else {
            setSubmitError(result?.error || "No pudimos publicar el tour. Intenta de nuevo.");
          }
        }}>{submitting ? "Guardando…" : (isEditing ? "Guardar cambios" : "Publicar tour")}</button>
      </div>}
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────
export default function AppDemo() {
  const { user, loading, isOperator } = useAuth();
  const [view, setView] = useState("login");
  const [tour, setTour] = useState(null);
  const [nav, setNav] = useState("explore");
  const [cat, setCat] = useState("all");
  const [notifs, setNotifs] = useState(NOTIFS);
  const [tours, setTours] = useState([]);
  const [toursLoading, setToursLoading] = useState(true);
  // Feature "Tours en [ciudad]": ciudad mostrada en la sección. Arranca en
  // Lima para evitar flash/CLS antes de que llegue /api/geo. geoSource permite
  // ignorar respuestas tardías de la geo si el usuario ya eligió manualmente.
  const [selectedCity, setSelectedCity] = useState(() => readDevCityOverride() || "Lima");
  // Si hay override en localhost lo tratamos como "manual" para que la respuesta
  // tardía de /api/geo (siempre fallback en localhost) no lo pise.
  const [geoSource, setGeoSource] = useState(() => readDevCityOverride() ? "manual" : "fallback");
  const pickCity = useCallback((city) => {
    setSelectedCity(city);
    setGeoSource("manual");
  }, []);

  // opTours (dashboard del operador) se hidrata aparte, desde
  // /api/operators/me/tours (ver efecto más abajo). Arranca vacío.
  const [opTours, setOpTours] = useState([]);

  // M3 Sub-paso B: reservas reales del operador, desde /api/operators/me/bookings
  // (filtrado por operatorId del token). Reemplaza el mock OP_BK. Arranca vacío.
  const [opBookings, setOpBookings] = useState([]);

  // Carga (y recarga) el catálogo público. Reusable: montaje inicial y refetch
  // tras pausar/reanudar un tour (M2.3), para que el catálogo refleje el filtro
  // active del backend sin recargar la página.
  const loadPublicTours = useCallback(async () => {
    try {
      const r = await fetch("/api/tours?limit=50");
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      setTours((data.tours || []).map(mapTourFromApi).map(ensureAvailabilityFields));
    } catch (err) {
      console.error("Error cargando tours:", err);
    }
  }, []);

  // Catálogo público: alimenta `tours` (NO opTours). Una sola vez al montar.
  useEffect(() => {
    let cancel = false;
    const run = async () => {
      await loadPublicTours();
      if (!cancel) setToursLoading(false);
    };
    run();
    return () => { cancel = true; };
  }, [loadPublicTours]);

  // Sub-paso 2.7: opTours = los tours REALES del operador autenticado
  // (GET /api/operators/me/tours, filtrado por operatorId del token). Reemplaza
  // el mock previo de "primeros 4 del catálogo" (tours ajenos → editar daba 403).
  // - Espera a que useAuth resuelva (loading) antes de decidir.
  // - No operador → opTours vacío (no dashboard de tours).
  // - tourId conserva el CUID real → handleSaveTour (2.6) edita el tour correcto
  //   y, al ser propio, el PUT responde 200.
  useEffect(() => {
    if (loading) return;
    let cancel = false;
    // setState solo dentro de este callback async (no síncrono en el efecto).
    const hydrateOpTours = async () => {
      if (!isOperator) {
        if (!cancel) setOpTours([]);
        return;
      }
      try {
        const r = await authFetch("/api/operators/me/tours");
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = await r.json();
        if (cancel) return;
        // mapTourFromApi ya normaliza (incl. days/cancellation reales vía
        // LIST_SELECT ampliado); de ahí a la forma que espera el dashboard.
        const mine = (data.tours || []).map(mapTourFromApi);
        setOpTours(mine.map((t, i) => ({
          id: i + 1,
          tourId: t.id,
          // Estado real del API (M2.3); me/tours devuelve activos e inactivos.
          active: t.active ?? true,
          image: t.image,
          title: t.title || "",
          location: t.location || "",
          duration: t.duration || "",
          price: t.price || 0,
          rating: t.rating || 0,
          reviews: t.reviews || 0,
          category: t.category || "adventure",
          capacity: String(t.capacity || ""),
          difficulty: t.difficulty || "Moderada",
          description: t.desc || "",
          included: Array.isArray(t.included) ? t.included.join(", ") : (t.included || ""),
          excluded: Array.isArray(t.excluded) ? t.excluded.join(", ") : (t.excluded || ""),
          days: t.days || DEFAULT_DAYS,
          excludedDates: t.excludedDates || [],
          addedDates: t.addedDates || [],
          meetingPoint: t.meetingPoint || "",
          // Hora real del API (M3.3); "08:00" solo como fallback para tours
          // legacy sin hora (startTime null).
          startTime: t.startTime || "08:00",
          cancellation: t.cancellation || "flexible",
          photo: null,
        })));
      } catch (err) {
        console.error("Error cargando tours del operador:", err);
        if (!cancel) setOpTours([]);
      }
    };
    hydrateOpTours();
    return () => { cancel = true; };
  }, [isOperator, loading]);

  // M3 Sub-paso B: hidrata las reservas del operador (GET /api/operators/me/bookings,
  // filtrado por operatorId del token). Mismo patrón que opTours: espera a que
  // useAuth resuelva, no operador → vacío, !r.ok → loguea y deja []. Adapta la
  // forma del API a lo que renderiza la tab (amount = totalSoles/100 en soles).
  useEffect(() => {
    if (loading) return;
    let cancel = false;
    const monthsShort = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const fmtBookingDate = (iso) => {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return "";
      return `${String(d.getDate()).padStart(2, "0")} ${monthsShort[d.getMonth()]} ${d.getFullYear()}`;
    };
    const hydrateOpBookings = async () => {
      if (!isOperator) {
        if (!cancel) setOpBookings([]);
        return;
      }
      try {
        const r = await authFetch("/api/operators/me/bookings");
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = await r.json();
        if (cancel) return;
        // Adaptador API → shape de la tab. El API da CÉNTIMOS: amount en soles.
        // note y pay NO existen en el modelo real → no se mapean.
        setOpBookings((data.bookings || []).map((b) => ({
          id: b.bookingCode,
          customer: b.userName,
          phone: b.userPhone || null,
          date: fmtBookingDate(b.scheduledAt),
          guests: b.guests,
          amount: (b.totalSoles || 0) / 100,
          tour: b.tour?.title || "",
          status: b.status,
        })));
      } catch (err) {
        console.error("Error cargando reservas del operador:", err);
        if (!cancel) setOpBookings([]);
      }
    };
    hydrateOpBookings();
    return () => { cancel = true; };
  }, [isOperator, loading]);

  // Resolución de ciudad vía /api/geo. Si el usuario ya cambió manualmente
  // (geoSource === "manual") cuando llega la respuesta, la ignoramos
  // (race condition R2). En localhost el dev override aplicado en el
  // inicializador de useState ya marcó geoSource = "manual", así que esta
  // respuesta tardía no lo pisará.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/geo")
      .then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
      .then(data => {
        if (cancelled) return;
        setGeoSource(prevSource => {
          if (prevSource === "manual") return prevSource;
          if (data?.city && SUPPORTED_CITIES.includes(data.city)) {
            setSelectedCity(data.city);
            return data.source === "geo" ? "geo" : "fallback";
          }
          return prevSource;
        });
      })
      .catch(() => {
        // Silencioso: ya tenemos Lima por defecto.
      });
    return () => { cancelled = true; };
  }, []);

  const [editingTour, setEditingTour] = useState(null);
  const [dashTab, setDashTab] = useState("bookings");
  const [loginMsg, setLoginMsg] = useState("");
  const [reviews, setReviews] = useState({});
  const [trips, setTrips] = useState(MY_TRIPS);
  const [currentTrip, setCurrentTrip] = useState(null);
  const ref = useRef(null);
  const unread = notifs.filter((n) => !n.read).length;

  // SPA fix: cambiar de vista no es navegación real, así que reseteamos
  // manualmente el scroll de window y del contenedor principal en cada
  // cambio de view para que el usuario aterrice arriba en la nueva pantalla.
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = 0;
    if (typeof window !== "undefined") window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [view]);

  const go = (v) => {
    if (v !== "login") setLoginMsg("");
    setView(v);
    if (v === "home") setNav("explore");
    if (v === "catalog") setNav("search");
  };
  const handleBook = () => {
    if (!user) { setLoginMsg("Inicia sesión o regístrate para reservar tu experiencia"); go("login"); }
    else go("booking");
  };
  const handleReview = (tripId, tourId, rating, text) => {
    const newReview = { id: Date.now(), author: USER.name, avatar: USER.avatar, rating, text, date: "Hoy" };
    setReviews(prev => ({ ...prev, [tourId]: [newReview, ...(prev[tourId] || [])] }));
    setTrips(prev => prev.map(t => t.id === tripId ? { ...t, reviewed: true } : t));
    setCurrentTrip(prev => (prev && prev.id === tripId ? { ...prev, reviewed: true } : prev));
    setTours(prev => prev.map(t => {
      if (t.id !== tourId) return t;
      const newCount = t.reviews + 1;
      const newRating = Math.round(((t.rating * t.reviews + rating) / newCount) * 10) / 10;
      return { ...t, reviews: newCount, rating: newRating };
    }));
    setOpTours(prev => prev.map(t => {
      if (t.tourId !== tourId) return t;
      const src = tours.find(x => x.id === tourId);
      if (!src) return t;
      const newCount = src.reviews + 1;
      const newRating = Math.round(((src.rating * src.reviews + rating) / newCount) * 10) / 10;
      return { ...t, reviews: newCount, rating: newRating };
    }));
  };
  const navGo = (id) => { setNav(id); if (id === "explore") go("home"); else if (id === "search") go("catalog"); else if (id === "trips") go("trips"); else if (id === "profile") go("profile"); };

  const handleEditTour = (t) => { setEditingTour(t); go("new-tour"); };
  // Sub-paso M2.6b: borra el tour propio (hard delete) vía DELETE /api/tours/:id
  // y lo quita de las listas al instante. Usa el CUID real (tourId), igual que
  // editar. Devuelve { ok } / { ok:false, error } para que el diálogo de
  // confirmación en DashView muestre "Borrando…" y maneje el error.
  const handleDeleteTour = async (tour) => {
    const cuid = tour.tourId;
    // Sin CUID real (tour local no persistido en DB) → solo quitar de la lista.
    const isPersisted = typeof cuid === "string" && !/^\d+$/.test(cuid);
    if (!isPersisted) {
      setOpTours(prev => prev.filter(t => t.id !== tour.id));
      return { ok: true };
    }
    let res;
    try {
      res = await authFetch(`/api/tours/${cuid}`, { method: "DELETE" });
    } catch {
      return { ok: false, error: "No pudimos conectar. Revisa tu conexión e intenta de nuevo." };
    }
    // 404 = el tour ya no existe → lo tratamos como borrado (quitarlo igual).
    if (res.ok || res.status === 404) {
      setOpTours(prev => prev.filter(t => t.id !== tour.id));
      setTours(prev => prev.filter(t => t.id !== cuid));
      return { ok: true };
    }
    if (res.status === 403) return { ok: false, error: "No puedes borrar este tour." };
    const data = await res.json().catch(() => ({}));
    return { ok: false, error: data?.error || "No pudimos borrar el tour. Intenta de nuevo." };
  };
  // Sub-paso M2.3: pausar/reanudar un tour propio (PATCH /api/tours/:id con
  // { active }). Optimista en opTours (el switch refleja al instante); revierte
  // si el PATCH falla. Tras éxito, recarga el catálogo público para que el tour
  // pausado desaparezca (o reaparezca) sin recargar. Usa el CUID real (tourId),
  // guard isPersisted como editar/borrar. Devuelve { ok } / { ok:false, error }.
  const handleToggleTourActive = async (tour) => {
    const cuid = tour.tourId;
    const next = !tour.active;
    // Optimista en el dashboard.
    setOpTours(prev => prev.map(t => t.id === tour.id ? { ...t, active: next } : t));
    const isPersisted = typeof cuid === "string" && !/^\d+$/.test(cuid);
    if (!isPersisted) return { ok: true }; // tour local no persistido: solo estado local
    const revert = () =>
      setOpTours(prev => prev.map(t => t.id === tour.id ? { ...t, active: tour.active } : t));
    let res;
    try {
      res = await authFetch(`/api/tours/${cuid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: next }),
      });
    } catch {
      revert();
      return { ok: false, error: "No pudimos conectar. Revisa tu conexión e intenta de nuevo." };
    }
    if (!res.ok) {
      revert();
      if (res.status === 403) return { ok: false, error: "No puedes modificar este tour." };
      return { ok: false, error: "No pudimos actualizar el estado del tour. Intenta de nuevo." };
    }
    // Sincroniza el catálogo público con el estado real (el backend filtra active).
    await loadPublicTours();
    return { ok: true };
  };
  // Normaliza included/excluded SIEMPRE a array (incluso vacío) para que
  // DetailView no crashee con `"".map is not a function` si el operador deja
  // el campo en blanco.
  const toArr = (v) => Array.isArray(v)
    ? v
    : (typeof v === "string" && v.trim()
        ? v.split(",").map(s => s.trim()).filter(Boolean)
        : []);
  // Update solo-local (sin API). Fallback para tours sin CUID en DB (id local
  // numérico) — comportamiento previo a 2.6.
  const applyLocalSave = (updated) => {
    setOpTours(prev => prev.map(t => t.id === updated.id ? updated : t));
    if (updated.tourId) {
      setTours(prev => prev.map(t => t.id === updated.tourId ? {
        ...t,
        title: updated.title,
        location: updated.location,
        duration: updated.duration,
        price: updated.price,
        image: updated.image,
        ...(updated.description && { desc: updated.description }),
        included: toArr(updated.included),
        excluded: toArr(updated.excluded),
        ...(updated.capacity && { capacity: Number(updated.capacity) }),
        ...(updated.category && { category: updated.category }),
        ...(updated.difficulty && { difficulty: updated.difficulty }),
        ...(updated.cancellation && { cancellation: updated.cancellation }),
        ...(updated.meetingPoint && { meetingPoint: updated.meetingPoint }),
        days: updated.days || t.days,
        excludedDates: updated.excludedDates || [],
        addedDates: updated.addedDates || [],
      } : t));
    }
  };
  // Sub-paso 2.6: edita el tour en el backend real (PUT /api/tours/:id) con
  // verificación de propiedad. Reusa el mismo mapeo form→body que crear (2.5)
  // vía tourFormToApiBody. Devuelve { ok } / { ok:false, error } para que
  // NewTourView muestre "Guardando…" y maneje el error sin navegar.
  const handleSaveTour = async (updated) => {
    // El CUID real vive en tourId (editingTour es un item de opTours, cuyo `id`
    // es solo la clave local de lista). Tours sin CUID (id local numérico) no
    // existen en DB → update solo local, sin pegarle al API.
    const cuid = updated.tourId;
    const isPersisted = typeof cuid === "string" && !/^\d+$/.test(cuid);

    if (!isPersisted) {
      applyLocalSave(updated);
      setEditingTour(null);
      setDashTab("listings");
      go("dashboard");
      return { ok: true };
    }

    const body = tourFormToApiBody(updated);
    let res;
    try {
      res = await authFetch(`/api/tours/${cuid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch {
      return { ok: false, error: "No pudimos conectar. Revisa tu conexión e intenta de nuevo." };
    }

    if (res.status === 403) return { ok: false, error: "No puedes editar este tour." };
    if (res.status === 404) return { ok: false, error: "El tour ya no existe." };
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: describeTourApiError(data, "No pudimos guardar los cambios. Revisa los datos.") };
    }

    // Éxito. mapTourFromApi normaliza el tour real (DETAIL_SELECT ya expone
    // days/meetingPoint/cancellation/fechas, así que viene completo).
    const apiTour = ensureAvailabilityFields(mapTourFromApi(data.tour));

    // tours: reemplazar la entrada (keyed por CUID) por la versión del API,
    // preservando los day-codes/fechas que el operador dejó en el form.
    setTours(prev => prev.map(t => t.id === cuid ? {
      ...t,
      ...apiTour,
      days: Array.isArray(updated.days) ? updated.days : apiTour.days,
      excludedDates: updated.excludedDates || apiTour.excludedDates || [],
      addedDates: updated.addedDates || apiTour.addedDates || [],
    } : t));

    // opTours: misma forma de siempre (included/excluded string, image css,
    // capacity string); se mantiene el id/active locales y se actualiza el resto.
    const cssImage = updated.photo
      ? `url(${updated.photo})`
      : apiTour.image || "linear-gradient(135deg,#1B3A2D 0%,#2D5A3D 100%)";
    setOpTours(prev => prev.map(t => t.id === updated.id ? {
      ...t,
      tourId: apiTour.id,
      image: cssImage,
      title: apiTour.title,
      location: apiTour.location,
      duration: apiTour.duration,
      price: apiTour.price,
      category: apiTour.category,
      capacity: String(updated.capacity || apiTour.capacity || ""),
      difficulty: apiTour.difficulty,
      description: updated.description,
      included: updated.included || "",
      excluded: updated.excluded || "",
      days: Array.isArray(updated.days) ? updated.days : DEFAULT_DAYS,
      excludedDates: updated.excludedDates || [],
      addedDates: updated.addedDates || [],
      meetingPoint: apiTour.meetingPoint || updated.meetingPoint || "",
      cancellation: apiTour.cancellation || updated.cancellation || "flexible",
      startTime: updated.startTime || "08:00",
      photo: updated.photo || null,
    } : t));

    setEditingTour(null);
    setDashTab("listings");
    go("dashboard");
    return { ok: true };
  };
  // Sub-paso 2.5: crea el tour en el backend real (POST /api/tours) en vez de
  // un tour local con id numérico. Devuelve { ok } / { ok:false, error } para
  // que NewTourView muestre "Guardando…" y maneje el error sin navegar.
  const handleCreateTour = async (formData) => {
    // Mapeo form→body compartido con editar (2.6) — ver tourFormToApiBody.
    const body = tourFormToApiBody(formData);

    let res;
    try {
      res = await authFetch("/api/tours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch {
      return { ok: false, error: "No pudimos conectar. Revisa tu conexión e intenta de nuevo." };
    }

    if (res.status === 403) {
      return { ok: false, error: "Necesitas un perfil de operador para publicar tours." };
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: describeTourApiError(data, "No pudimos publicar el tour. Revisa los datos.") };
    }

    // Éxito (201). mapTourFromApi normaliza el tour real (CUID, no numérico).
    // El API (DETAIL_SELECT) no devuelve days/meetingPoint/cancellation/fechas,
    // así que preservamos lo que el operador ingresó en el form para el display
    // optimista (limitación conocida: al recargar caen a defaults hasta ampliar
    // tour-select.ts).
    const apiTour = ensureAvailabilityFields(mapTourFromApi(data.tour));
    // Respeta una selección vacía deliberada (form.days = [] → solo fechas
    // específicas); no la confundas con "sin valor".
    const formDays = Array.isArray(formData.days) ? formData.days : DEFAULT_DAYS;
    const merged = {
      ...apiTour,
      meetingPoint: formData.meetingPoint || apiTour.meetingPoint || "",
      cancellation: formData.cancellation || apiTour.cancellation || "flexible",
      days: formDays,
      excludedDates: formData.excludedDates || [],
      addedDates: formData.addedDates || [],
    };
    setTours(prev => [...prev, merged]);

    // opTours usa otra forma: included/excluded como string, image css, capacity
    // string, tourId = CUID real (el id local es solo clave de lista).
    const cssImage = formData.photo
      ? `url(${formData.photo})`
      : apiTour.image || "linear-gradient(135deg,#1B3A2D 0%,#2D5A3D 100%)";
    setOpTours(prev => [...prev, {
      id: prev.reduce((m, t) => Math.max(m, Number(t.id) || 0), 0) + 1,
      tourId: merged.id,
      active: true,
      image: cssImage,
      title: merged.title,
      location: merged.location,
      duration: merged.duration,
      meetingPoint: merged.meetingPoint,
      price: merged.price,
      rating: 0,
      reviews: 0,
      category: merged.category,
      capacity: String(formData.capacity || merged.capacity || ""),
      difficulty: merged.difficulty,
      description: formData.description,
      included: formData.included || "",
      excluded: formData.excluded || "",
      days: Array.isArray(formData.days) ? formData.days : DEFAULT_DAYS,
      excludedDates: formData.excludedDates || [],
      addedDates: formData.addedDates || [],
      startTime: formData.startTime || "08:00",
      cancellation: formData.cancellation || "flexible",
      photo: formData.photo || null,
    }]);

    setDashTab("listings");
    return { ok: true };
  };
  const handleCancelTour = () => { setEditingTour(null); setDashTab("bookings"); go("dashboard"); };

  // Demo: cuando el viajero reserva un tour mock local (id numérico, no CUID),
  // el backend rechaza el POST por validación CUID. Aquí registramos el viaje
  // localmente para que aparezca en TripsView. Fase 2: seedear los 14 mocks
  // en DB para tener CUIDs reales y consolidar el flujo.
  const handleAddLocalTrip = ({ tour: bookedTour, date, guests, total, code, customerName, customerPhone, customerEmail }) => {
    const months = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
    const isoDate = date || todayISO();
    const [y, m, d] = isoDate.split("-").map(Number);
    const dateLabel = `${String(d).padStart(2, "0")} ${months[m - 1]} ${y}`;
    const newTrip = {
      id: Date.now(),
      tour: bookedTour,
      date: dateLabel,
      dateISO: isoDate,
      guests,
      total,
      status: "upcoming",
      code,
      customerName: customerName || USER.name,
      customerPhone: customerPhone || "",
      customerEmail: customerEmail || "",
    };
    setTrips(prev => [newTrip, ...prev]);
    setCurrentTrip(newTrip);
  };

  // effectiveView desacopla el chrome/switch del view crudo:
  // - con sesión y view==="login" → tratamos como "home" (paso 6), así el
  //   chrome no se oculta al arrancar logueado hasta la primera navegación.
  // - sin sesión en una vista protegida (logout o expiración de sesión) →
  //   "login". Guard derivado durante el render (no useEffect/setState): sin
  //   flash ni render extra. En el re-login, LoginView hace go("home").
  const effectiveView =
    user && view === "login" ? "home"
      : !user && !["login", "welcome"].includes(view) ? "login"
        : view;
  const isAuth = !["login", "welcome"].includes(effectiveView);
  const showNav = isAuth && !["booking", "detail", "new-tour", "trip-detail"].includes(effectiveView);
  const showHeader = isAuth && !["booking", "new-tour"].includes(effectiveView);
  const showFooter = isAuth && !["booking", "detail", "new-tour", "dashboard", "trip-detail"].includes(effectiveView);
  const currentTour = tour ? tours.find(t => t.id === tour.id) || tour : null;
  // M2.3: el catálogo se filtra en el BACKEND (GET /api/tours solo devuelve
  // active:true). Ya no hay filtro local por el flag de opTours (que solo servía
  // para el propio operador y no para otros usuarios). `tours` ya viene filtrado;
  // tras pausar/reanudar, handleToggleTourActive recarga el catálogo.

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center",
        fontFamily: "'DM Serif Display', Georgia, serif",
        fontSize: 32, color: "#1B3A2D", background: "#FAFAF7",
      }}>
        finde<span style={{ color: "#C7613A" }}>.</span>
      </div>
    );
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="app app-demo" ref={ref}>
        {showHeader && <TopNav onHome={() => go("home")} onDash={() => go(view === "dashboard" ? "home" : "dashboard")} onNotif={() => go("notifications")} view={view} unread={unread} isOperator={isOperator} navActive={nav} onNavClick={navGo} />}
        {effectiveView === "login" && <LoginView go={go} loginMsg={loginMsg} />}
        {effectiveView === "welcome" && <WelcomeView go={go} />}
        {effectiveView === "home" && <HomeView go={go} pick={setTour} cat={cat} setCat={setCat} tours={tours} toursLoading={toursLoading} selectedCity={selectedCity} setSelectedCity={pickCity} geoSource={geoSource} />}
        {effectiveView === "catalog" && <CatalogView go={go} pick={setTour} cat={cat} setCat={setCat} tours={tours} toursLoading={toursLoading} />}
        {effectiveView === "detail" && <DetailView tour={currentTour} go={go} pick={setTour} onBook={handleBook} reviews={reviews} />}
        {effectiveView === "booking" && <BookingView tour={currentTour} go={go} onLocalBookingSuccess={handleAddLocalTrip} />}
        {effectiveView === "notifications" && <NotifsView notifs={notifs} setNotifs={setNotifs} />}
        {effectiveView === "trips" && <TripsView go={go} onSelectTrip={setCurrentTrip} trips={trips} />}
        {effectiveView === "trip-detail" && <TripDetailView trip={currentTrip} go={go} onReview={handleReview} />}
        {effectiveView === "profile" && <ProfileView go={go} />}
        {effectiveView === "dashboard" && <DashView go={go} opTours={opTours} opBookings={opBookings} onEditTour={handleEditTour} onDeleteTour={handleDeleteTour} onToggleActive={handleToggleTourActive} initialTab={dashTab} onTabConsumed={() => setDashTab("bookings")} />}
        {effectiveView === "new-tour" && <NewTourView go={go} editingTour={editingTour} onSaveTour={handleSaveTour} onCreateTour={handleCreateTour} onCancel={handleCancelTour} />}
        {showFooter && <Footer go={go} />}
        {showNav && <BNav active={nav} go={navGo} />}
      </div>
    </>
  );
}