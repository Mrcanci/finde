import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { Sparkles, Mountain, Landmark, UtensilsCrossed, Trees, Bell, User, BarChart3, Compass, Search, Ticket, Star, MapPin, Timer, ArrowUp, Users, Dumbbell, Check, X, ChevronLeft, ChevronRight, ChevronDown, ArrowLeft, ArrowRight, Bot, CheckCircle, Clock, Tag, Languages, ShieldCheck, Building2, Smartphone, MessageCircle, Camera, MountainSnow, Hand, FileText, Pencil, HelpCircle, Heart, Home, Calendar, Eye, EyeOff, Info, Trash2, Lock, CreditCard } from "lucide-react";
import { useAuth } from "./contexts/AuthContext.jsx";
import { authFetch } from "./lib/authFetch.js";
import { supabase } from "./lib/supabase.js";
import { resizeImageForUpload, ALLOWED_INPUT_TYPES, MAX_UPLOAD_BYTES, OG_MIN_WIDTH, OG_MIN_HEIGHT } from "./lib/image-resize.js";
import { fromPath, toPath, parseTourSegment, canonicalTourPath } from "./lib/routes.js";
// La condición de publicar y sus números salen del MISMO módulo que usa el
// backend. No se copian acá: ver lib/tour-publish.js.
import { faltaParaPublicar, PITCH_MIN, PITCH_MAX, DESC_MIN } from "../lib/tour-publish.js";
// Las ciudades soportadas y sus alias salen del MISMO modulo que usa /api/geo.
// Estuvieron escritas tres veces y las tres eran distintas: ver lib/cities.js.
import { DEPARTMENTS, QUERY_DEPT_ALIASES, displayName, normalizeCity, departmentsWithTours, toursByDepartment } from "../lib/cities.js";

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

// DEMO_PAYMENT_FLOW: flag maestro del demo. Gatea la pantalla de pago mock y, a
// través de SHOW_CANCELLATION_POLICY, la política de cancelación.
// Poner en false antes de onboardear operadores reales o cuando el gateway real reemplace el mock.
const DEMO_PAYMENT_FLOW = true;

// Política de cancelación: atada al flag maestro. En el piloto (DEMO_PAYMENT_FLOW
// false) no se muestra en ningún lado; con el pago encendido reaparece en detalle,
// paso de pago, voucher y formulario del operador. Los datos/helpers se conservan.
const SHOW_CANCELLATION_POLICY = DEMO_PAYMENT_FLOW;

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
// Anticipación mínima para reservar (en días). MANTENER EN SYNC con
// api/bookings.ts (MIN_BOOKING_LEAD_DAYS): el calendario de reserva no deja
// elegir antes de hoy + estos días y el backend valida lo mismo en hora de Lima.
const MIN_BOOKING_LEAD_DAYS = 1;
// Defaults de cierre. MANTENER EN SYNC con lib/inventory.ts
// (DEFAULT_CLOSE_TIME / DEFAULT_CLOSE_DAYS_BEFORE): null en DB = estos valores.
const DEFAULT_CLOSE_TIME = "20:00";
const DEFAULT_CLOSE_DAYS_BEFORE = 1;
// Fecha y hora actuales en Lima (America/Lima, UTC-5 sin DST). El calendario
// compara contra la hora de cierre de la agencia, así que NO puede usar la hora
// del dispositivo: un viajero con el reloj en otra zona vería fechas que el
// backend va a rechazar.
function limaNow() {
  const now = new Date();
  return {
    date: new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Lima", year: "numeric", month: "2-digit", day: "2-digit",
    }).format(now),
    time: new Intl.DateTimeFormat("en-GB", {
      timeZone: "America/Lima", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).format(now),
  };
}
// Fecha mínima reservable (yyyy-mm-dd). Dos pisos, gana el más tardío:
//   1. anticipación mínima: hoy (Lima) + MIN_BOOKING_LEAD_DAYS
//   2. cierre de venta, SOLO en confirmación manual: una fecha deja de ofrecerse
//      pasada la hora de cierre de esa salida. Como el cierre de D cae en
//      D - closeDaysBefore a closeTime, la primera fecha con cierre todavía
//      vigente es hoy + closeDaysBefore, o un día más si esa hora ya pasó.
// En confirmación automática no hay nada que confirmar y solo rige el piso 1.
// MANTENER EN SYNC con api/bookings.ts, que es la fuente de verdad.
function minBookingISO(tour) {
  const { date: hoyLima, time: ahoraLima } = limaNow();
  const porAnticipacion = addDaysISO(hoyLima, MIN_BOOKING_LEAD_DAYS);
  if (tour?.salesMode !== "SOLICITUD") return porAnticipacion;
  const closeTime = tour.closeTime || DEFAULT_CLOSE_TIME;
  const diasAntes = tour.closeDaysBefore != null ? tour.closeDaysBefore : DEFAULT_CLOSE_DAYS_BEFORE;
  const porCierre = addDaysISO(hoyLima, diasAntes + (ahoraLima < closeTime ? 0 : 1));
  return porAnticipacion > porCierre ? porAnticipacion : porCierre;
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
// Fecha corta de reserva "16 Ago 2026" desde un ISO timestamp. Los primeros 10
// chars son el yyyy-mm-dd: parsearlos directo evita el drift de zona de
// new Date() + getters locales (mismo patrón que mapBookingToTrip).
const MONTHS_SHORT = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
function fmtBookingDate(iso) {
  if (typeof iso !== "string") return "";
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d || !MONTHS_SHORT[m - 1]) return "";
  return `${String(d).padStart(2, "0")} ${MONTHS_SHORT[m - 1]} ${y}`;
}
// "sábado 15, 8:00 pm" en hora de Lima desde el closeAt ISO que calcula el
// backend (cierre de solicitudes de una salida).
function fmtCloseAt(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const wd = new Intl.DateTimeFormat("es-PE", { timeZone: "America/Lima", weekday: "long" }).format(d);
  const day = new Intl.DateTimeFormat("es-PE", { timeZone: "America/Lima", day: "numeric" }).format(d);
  const time = new Intl.DateTimeFormat("en-US", { timeZone: "America/Lima", hour: "numeric", minute: "2-digit", hour12: true }).format(d).toLowerCase();
  return `${wd} ${day}, ${time}`;
}
// "viernes 14" desde un yyyy-mm-dd: día de la semana + número del día. Es cómo
// la agencia nombra una salida cuando habla con su gente.
function fmtDiaFecha(iso) {
  if (typeof iso !== "string") return "";
  const d = Number(iso.slice(8, 10));
  return `${DAY_LABEL_LONG[dayCodeFromISO(iso)]} ${d}`;
}
// Cuenta regresiva del plazo para confirmar una salida, desde el expiresAt más
// próximo de sus solicitudes vigentes. Se calcula al renderizar (sin
// temporizador en vivo): el panel se recalcula al actuar o al recargar.
// level: "" = informativo, "soft" = menos de 24h, "hard" = menos de 3h.
const PLAZO_HORA = 3600000;
function plazoConfirmacion(expiresAtIso, nowMs) {
  const exp = new Date(expiresAtIso);
  if (isNaN(exp.getTime())) return null;
  const ms = exp.getTime() - nowMs;
  if (ms <= 0) return { text: "El plazo venció", level: "" };
  if (ms >= 24 * PLAZO_HORA) {
    return { text: `Confirma antes del ${fmtCloseAt(expiresAtIso)}`, level: "" };
  }
  if (ms >= 3 * PLAZO_HORA) {
    const h = Math.floor(ms / PLAZO_HORA);
    return { text: `Te quedan ${h} hora${h === 1 ? "" : "s"} para confirmar`, level: "soft" };
  }
  const min = Math.max(1, Math.floor(ms / 60000));
  return { text: `Te quedan ${min} minuto${min === 1 ? "" : "s"} para confirmar`, level: "hard" };
}
const cap1 = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");
// Estado real de una reserva en el panel: etiqueta + color. Manda bookingState
// (enum nuevo del API); las reservas legacy sin él caen al status viejo.
const BK_STATE_UI = {
  SOLICITUD: { label: "Solicitud recibida", color: "var(--tr)" },
  CONFIRMADA: { label: "Confirmada", color: "var(--m)" },
  RECHAZADA: { label: "Rechazada", color: "var(--gy)" },
  VENCIDA: { label: "Vencida", color: "var(--gy)" },
  CANCELADA: { label: "Cancelada", color: "var(--gy)" },
};
const BK_LEGACY_STATE = { pending_payment: "SOLICITUD", pending: "SOLICITUD", confirmed: "CONFIRMADA", cancelled: "CANCELADA" };
// Estados para el VIAJERO (Mis reservas): textos propios, distintos del panel.
// RECHAZADA y VENCIDA se unifican en "No confirmada": al viajero no le sirve
// la interna de la agencia y "rechazada" suena a que hizo algo mal.
const TRIP_STATE_UI = {
  SOLICITUD: { label: "Solicitud enviada", bg: "rgba(199,97,58,.12)", color: "var(--tr)" },
  CONFIRMADA: { label: "Confirmada", bg: "rgba(45,90,61,.1)", color: "var(--m)" },
  RECHAZADA: { label: "No confirmada", bg: "rgba(0,0,0,.06)", color: "var(--gy)" },
  VENCIDA: { label: "No confirmada", bg: "rgba(0,0,0,.06)", color: "var(--gy)" },
  CANCELADA: { label: "Cancelada", bg: "rgba(0,0,0,.06)", color: "var(--gy)" },
};
function bookingStateUI(b) {
  const key = b?.bookingState || BK_LEGACY_STATE[b?.status] || "SOLICITUD";
  return BK_STATE_UI[key] || BK_STATE_UI.SOLICITUD;
}
// Recuenta los estados de una salida a partir de sus reservas (para actualizar
// la card tras confirmar/rechazar sin re-fetch).
function recountDeparture(bookings) {
  const c = { solicitudes: 0, confirmadas: 0, vencidas: 0, rechazadas: 0, canceladas: 0 };
  for (const b of bookings || []) {
    if (b.bookingState === "SOLICITUD") c.solicitudes++;
    else if (b.bookingState === "CONFIRMADA") c.confirmadas++;
    else if (b.bookingState === "VENCIDA") c.vencidas++;
    else if (b.bookingState === "RECHAZADA") c.rechazadas++;
    else if (b.bookingState === "CANCELADA") c.canceladas++;
  }
  return c;
}
// Fecha + hora en zona Lima a partir de un ISO timestamp, ej. "20 Jun 2026, 14:32".
// Usado para Booking.createdAt en el panel del operador. Devuelve "" si el ISO no parsea.
function fmtDateTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString("es-PE", {
    timeZone: "America/Lima",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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
// ── Disponibilidad de cupos: cache a NIVEL MÓDULO por tour+mes ──
// El detalle del tour PRE-CARGA el mes actual mientras el viajero lee; el
// calendario del flujo de reserva lee el cache sincrónico al montar y pinta
// las celdas con el dato desde el primer frame (sin ventana de demora).
// In-flight dedupeado; un fallo no se cachea (reintenta el próximo montaje).
const AVAIL_CACHE = new Map(); // `${tourId}:${y}-${m}` → availability | null
const AVAIL_INFLIGHT = new Map();
// Generación por clave: la sube cada invalidación. Un fetch en vuelo que
// arrancó antes NO escribe el cache al volver, o resucitaría el dato viejo
// justo después de haberlo tirado.
const AVAIL_EPOCH = new Map();
const availKey = (tourId, y, m) => `${tourId}:${y}-${m}`;
// Invalida el mes de UNA fecha de un tour. El alcance es el mes y no el tour
// porque la clave ya es por tour y mes y los meses son disjuntos: tirar el tour
// entero obligaría a re-pedir meses que nadie miró.
// Se llama en los dos momentos en que sabemos que el dato local quedó viejo:
// una reserva creada (el cupo bajó) y una reserva rechazada por el servidor
// (el cache mintió, por eso llegamos hasta el paso 3).
function invalidateMonthAvailability(tourId, iso) {
  if (!tourId || !iso) return;
  const [y, m] = iso.split("-").map(Number);
  if (!y || !m) return;
  const key = availKey(tourId, y, m);
  AVAIL_CACHE.delete(key);
  AVAIL_INFLIGHT.delete(key);
  AVAIL_EPOCH.set(key, (AVAIL_EPOCH.get(key) || 0) + 1);
}
function limaCurrentYM() {
  const [y, m] = todayISO().split("-").map(Number);
  return { y, m };
}
async function fetchMonthAvailability(tourId, y, m) {
  const key = availKey(tourId, y, m);
  if (AVAIL_CACHE.has(key)) return AVAIL_CACHE.get(key);
  if (AVAIL_INFLIGHT.has(key)) return AVAIL_INFLIGHT.get(key);
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const mm = String(m).padStart(2, "0");
  const epoch = AVAIL_EPOCH.get(key) || 0;
  const p = (async () => {
    try {
      const r = await fetch(`/api/tours/${tourId}?from=${y}-${mm}-01&to=${y}-${mm}-${String(lastDay).padStart(2, "0")}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      const a = data.availability ?? null;
      // Si alguien invalidó mientras esto viajaba, el dato ya nació viejo: se
      // devuelve para quien lo pidió pero no se cachea.
      if ((AVAIL_EPOCH.get(key) || 0) === epoch) AVAIL_CACHE.set(key, a);
      return a;
    } catch (err) {
      console.error("Error cargando disponibilidad de cupos:", err);
      return undefined;
    } finally {
      AVAIL_INFLIGHT.delete(key);
    }
  })();
  AVAIL_INFLIGHT.set(key, p);
  return p;
}

function MonthCalendar({ mode, selectedDate, onSelect, days = DEFAULT_DAYS, excludedDates = [], addedDates = [], onToggleException, minDate, minDateNote, fullDates, lowDates, lowBase, onMonthChange }) {
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
  // Avisa el mes visible (montaje + navegación): el flujo de reserva carga la
  // disponibilidad de cupos del mes con UN request (fechas llenas/cupos bajos).
  // El caller debe pasar un callback estable (useCallback) para no re-disparar.
  useEffect(() => {
    if (onMonthChange) onMonthChange(view.y, view.m);
  }, [onMonthChange, view.y, view.m]);
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
    // TOPE DE ANCHO, Y ES LO QUE HACE QUE ESCRITORIO SE VEA COMO MOVIL.
    // La celda es cuadrada y se estira con la tarjeta, pero el numero (13px) y
    // la etiqueta (8,5px) no: son fijos. Medido, sin tope la celda pasa de
    // 42,28px a 390 a 72,28px de 1024 para arriba, un 64% mas de alto para el
    // mismo contenido, y el hueco entre el numero y la etiqueta se multiplica
    // por 14 (de 1,08 a 15,22px). El contenido pasa de llenar el 59% de la
    // celda a llenar el 35%, y en escritorio queda todo flotando.
    // 372px deja la celda en 45,42, que es exactamente la de un movil de 412.
    // En movil este tope NO APLICA: la tarjeta ya mide 350 a 390 y 372 a 412.
    <div style={{ background: "white", border: "1px solid var(--sd)", borderRadius: 14, padding: 14, maxWidth: 372, margin: "0 auto" }}>
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
          // Piso de anticipación: solo en booking (mode="select"). Los días
          // anteriores a minDate quedan no seleccionables aunque el operador
          // opere ese día. No aplica al wizard del operador (mode="edit").
          const belowMin = mode === "select" && minDate ? iso < minDate : false;
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
          // Cupos bajos (1-3) de la fecha: el número exacto o, para fechas sin
          // salida materializada, el cupo total del tour si ya es <= 3.
          const lowRaw = mode === "select" && lowDates
            ? (lowDates[iso] != null
                ? lowDates[iso]
                : (lowBase != null && !(fullDates && fullDates.has(iso)) ? lowBase : undefined))
            : undefined;
          if (mode === "select") {
            // Fecha sin cupo (CUPO_FIJO): mismo tratamiento visual que un día
            // no operativo, con su propio tooltip "Sin cupos".
            const isFull = !!(fullDates && fullDates.has(iso));
            const available = !belowMin && !isFull && (state === "added" || state === "pattern");
            const escasa = lowRaw >= 1 && lowRaw <= 3;
            if (isSelected && escasa) {
              // Selección + escasez superpuestas: terracota SÓLIDO con texto
              // blanco. Conserva la semántica de "elegida" (celda llena de
              // color) y la alarma de cupo en un solo tratamiento.
              bg = "var(--tr)"; color = "white"; border = "1.5px solid var(--tr)";
            }
            else if (isSelected) { bg = "var(--f)"; color = "white"; border = "1.5px solid var(--f)"; }
            else if (available && escasa) {
              // Escasez DESTACADA: compite de igual a igual con la celda
              // seleccionada (tinte más saturado + borde terracota propio +
              // número en el acento, semibold). Nunca el gris de lo
              // secundario/deshabilitado.
              bg = "rgba(199,97,58,.18)"; color = "var(--tr)"; border = "1.5px solid var(--tr)";
            }
            else if (available) { bg = "var(--cr)"; color = "var(--f)"; }
            else { color = "var(--lg)"; opacity = 0.5; cursor = "not-allowed"; isClickable = false; }
          } else {
            if (state === "disabled") { color = "var(--lg)"; opacity = 0.45; cursor = "not-allowed"; isClickable = false; }
            else if (state === "added") { bg = "var(--f)"; color = "white"; }
            else if (state === "excluded") { bg = "rgba(199,97,58,.15)"; color = "var(--tr)"; textDecoration = "line-through"; }
            else if (state === "pattern") { bg = "var(--cr)"; color = "var(--f)"; }
            else { color = "var(--gy)"; }
          }
          const titleAttr = (mode === "select" && !isClickable && !isPast)
            ? (fullDates && fullDates.has(iso) && !belowMin && (state === "added" || state === "pattern")
                ? "Sin cupos"
                : belowMin
                ? (minDateNote || `Requiere al menos ${MIN_BOOKING_LEAD_DAYS} día${MIN_BOOKING_LEAD_DAYS > 1 ? "s" : ""} de anticipación`)
                // "Salidas" es la fila de Departure que ve la agencia en su
                // panel. Al viajero se le habla de que el tour sale o no sale,
                // que es lo que ya dice la línea de abajo del calendario
                // ("Este tour solo sale los sábados y domingos").
                : "Este tour no sale este día")
            : undefined;
          // El aviso solo se pinta en fechas elegibles; la celda no cambia de
          // tamaño (minHeight/aspectRatio fijos, la fila no crece).
          const lowN = isClickable ? lowRaw : undefined;
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
                position: "relative",
                minHeight: 44,
                /* minWidth:0 NO ES DECORATIVO Y SACARLO ROMPE LA GRILLA.
                   `minHeight:44` junto con `aspectRatio:1` le transfiere a la
                   celda un ANCHO minimo de 44px a traves de la relacion de
                   aspecto. Con siete columnas eso son 308px de minimo mas los
                   gaps, mas de lo que entra en la tarjeta a 390: la grilla
                   desborda y los domingos se salen de la tarjeta. Paso de
                   verdad en la Fase 2, cuando la celda subio de 36 a 44 de
                   alto. `minWidth:0` corta esa transferencia y deja que mande
                   la columna `1fr`. Parece innecesario JUSTAMENTE porque
                   funciona: no lo saques. */
                minWidth: 0, width: "100%", aspectRatio: "1", borderRadius: 8, border,
                background: bg, color, fontSize: 13, fontWeight: 600,
                cursor, fontFamily: "inherit", textDecoration, opacity,
                transition: "background .15s", padding: 0,
              }}
            >
              {lowN >= 1 && lowN <= 3 ? (
                <>
                  {/* El número se renderiza EXACTAMENTE igual que en una celda
                      sin etiqueta: texto suelto, centrado por el botón. Antes
                      vivía dentro de un flex column junto con la etiqueta, y ese
                      bloque, al centrarse como una sola pieza, lo empujaba
                      4,46px hacia arriba. En una misma fila eso dejaba los días
                      con cupo bajo más altos que el resto.

                      La etiqueta va ABSOLUTA justamente para NO participar de
                      ese centrado. Así ocupa el espacio muerto de abajo (había
                      9,72px sin usar) sin mover el número ni un píxel.

                      Medido a 360, 390 y 412: la desalineación del número
                      contra la de una celda sin etiqueta da 0 en las tres, y la
                      etiqueta no desborda por abajo en ninguna. */}
                  {d}
                  <span data-low-label style={{ position: "absolute", left: 0, right: 0, bottom: 3, fontSize: 8.5, fontWeight: 700, lineHeight: 1.05, whiteSpace: "nowrap" }}>{lowN === 1 ? "1 cupo" : `${lowN} cupos`}</span>
                </>
              ) : (
                d
              )}
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
    // Traducción quechua persistida en DB (solo la trae DETAIL_SELECT). "" si el
    // tour aún no está traducido → el toggle QU cae a español.
    titleQu: t.titleQu ?? "",
    location: t.region && t.region !== t.city ? `${t.city}, ${t.region}` : t.city,
    // city y region viajan ADEMAS de location, y no es redundancia: la
    // agrupacion por departamento necesita los campos crudos. Antes solo estaba
    // `location` (los dos concatenados), asi que agrupar obligaba a partir un
    // string por la coma, que es exactamente el problema que tiene el campo de
    // Ubicacion del formulario. Ver lib/cities.js.
    //
    // Y es el tercero de los TRES lugares que hay que tocar para agregar un
    // campo (`.claude/rules/frontend.md`): el select del backend ya lo traia,
    // el consumidor lo pedia, y esta lista blanca lo descartaba EN SILENCIO.
    city: t.city,
    region: t.region ?? undefined,
    price: Number.isFinite(t.priceSoles) ? Math.round(t.priceSoles / 100) : null,
    rating: t.rating,
    reviews: t.reviewsCount,
    duration: t.durationHours >= 24
      ? `${Math.round(t.durationHours / 24)} ${Math.round(t.durationHours / 24) === 1 ? "día" : "días"}`
      : `${t.durationHours} horas`,
    image: t.imageUrl,
    // Galería multi-foto (Opción A). `image` (portada) sigue siendo imageUrl;
    // `images` es la galería para el carrusel del detalle (sub-paso 2).
    images: Array.isArray(t.images) ? t.images : [],
    badge: "",
    category: CAT_API_TO_UI[t.category] || t.category,
    operator: t.operator?.name || "Agencia",
    verified: !!t.operator?.verified,
    // Teléfono del operador para el link wa.me de coordinación (M4). null si no
    // tiene → el botón de WhatsApp no se muestra. NO se renderiza como texto.
    operatorPhone: t.operator?.phone ?? null,
    // N° MINCETUR del operador. El backend ya lo anula si no está verificado, así
    // que solo llega de operadores verificados; se muestra junto al badge.
    operatorMincetur: t.operator?.mincetur ?? null,
    capacity: t.capacity,
    altitude: "",
    difficulty: t.difficulty || "Moderada",
    included: t.included || [],
    excluded: t.excluded || [],
    // Listas quechua persistidas (DETAIL_SELECT). [] si sin traducir → fallback ES.
    includedQu: t.includedQu ?? [],
    excludedQu: t.excludedQu ?? [],
    desc: t.description,
    descQu: t.descQu ?? "",
    aiSummary: t.shortPitch || "",
    // El campo crudo, además de aiSummary. El formulario de edición lo necesita
    // para prellenarlo, y esta lista blanca descarta en silencio lo que no
    // enumera: es el error que costó una tanda con pendingRequests.
    shortPitch: t.shortPitch ?? "",
    // Traducciones quechua persistidas (DETAIL_SELECT). "" si sin traducir.
    // Disponibles para el render bajo el toggle QU cuando exista un sitio que
    // las muestre (hoy: shortPitch va a aiSummary y meetingPoint vive en el
    // voucher, ninguno bajo el toggle del detalle).
    shortPitchQu: t.shortPitchQu ?? "",
    meetingPointQu: t.meetingPointQu ?? "",
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
    // Config de venta. salesMode/closeTime/closeDaysBefore vienen también en el
    // catálogo público: el calendario del viajero los necesita para cerrar la
    // venta a la hora límite (minBookingISO). allotment/minQuorum solo llegan en
    // las vistas del operador (OPERATOR_*_SELECT); en público quedan en null.
    salesMode: t.salesMode ?? undefined,
    allotment: t.allotment ?? null,
    minQuorum: t.minQuorum ?? null,
    closeTime: t.closeTime ?? null,
    closeDaysBefore: t.closeDaysBefore ?? null,
    // Solicitudes vigentes del tour. Mismo caso que las cuatro de arriba: solo
    // llega en la vista del operador (GET /api/operators/me/tours) y en público
    // no viene. Va acá porque esta función es de LISTA BLANCA: si el campo no se
    // enumera se descarta en silencio, que es como se perdió la primera vez.
    pendingRequests: t.pendingRequests ?? 0,
    // Fecha de creación (ISO). Se usa para ordenar el catálogo por recencia
    // ahora que no hay ratings que ordenar (ver reset de ratings 2026-06-09).
    createdAt: t.createdAt ?? null,
  });
}

// Mapea una reserva real (GET /api/me → bookings) a la forma de "trip" que
// consumen TripsView / TripDetailView / VoucherDetail / buildWhatsAppLink. El
// tour se mapea con mapTourFromApi (mismo shape que el catálogo). La fecha sale
// del scheduledAt: como el booking se crea a las 13:00 UTC sobre la fecha
// elegida, los primeros 10 chars del ISO recuperan ese yyyy-mm-dd sin drift de
// zona. status se deriva (futuro/hoy → "upcoming", pasado → "completed").
const TRIP_MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
function mapBookingToTrip(b) {
  if (!b || !b.tour) return null;
  const isoDate = typeof b.scheduledAt === "string" ? b.scheduledAt.slice(0, 10) : todayISO();
  const [y, m, d] = isoDate.split("-").map(Number);
  const dateLabel = `${String(d).padStart(2, "0")} ${TRIP_MONTHS[m - 1]} ${y}`;
  return {
    id: b.bookingCode || b.id,
    tour: mapTourFromApi(b.tour),
    date: dateLabel,
    dateISO: isoDate,
    guests: b.guests,
    total: (b.totalSoles || 0) / 100,
    status: isoDate >= todayISO() ? "upcoming" : "completed",
    // Estado real del inventario (/api/me ya lo manda). null para reservas
    // legacy o trips locales del demo → el badge cae al temporal de siempre.
    bookingState: b.bookingState ?? null,
    code: b.bookingCode,
    customerName: b.userName || "",
    customerPhone: b.userPhone || "",
    // createdAt (ISO) de la reserva: usado para derivar notificaciones de
    // "Reserva confirmada" (recientes) y su etiqueta de tiempo relativa.
    createdAt: b.createdAt ?? null,
    // Sin modelo Review en DB todavía: las reseñas viven en sesión (estado
    // `reviews`); el trip arranca como no reseñado.
    reviewed: false,
  };
}

// ── Notificaciones in-app (derivadas, sin modelo Notification en DB) ──────────
// El estado "leído" se persiste como un set de IDs vistos en localStorage (no
// hay backend). Cada notificación se DERIVA de datos reales (hoy, reservas del
// viajero; en el sub-paso 3 se sumarán las del operador).
const NOTIF_SEEN_KEY = "finde_notif_seen";
function loadSeenNotifs() {
  if (typeof localStorage === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(NOTIF_SEEN_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}
function persistSeenNotifs(set) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(NOTIF_SEEN_KEY, JSON.stringify([...set]));
  } catch {
    /* quota / serialización: el "leído" no es crítico, se ignora */
  }
}

// ── Borrador del checkout ────────────────────────────────────────────────────
// POR QUE EXISTE. BookingView guarda TODO en useState y no persiste nada. Ese
// diseño alcanzaba mientras la única interrupción era el modal de cuenta, que
// es hermano de las vistas en el árbol y por lo tanto NO desmonta BookingView:
// el viajero entra y sigue con su fecha y sus cupos intactos.
//
// Recuperar la contraseña rompe esa condición. El viajero sale al correo y
// vuelve con una CARGA COMPLETA de página, así que BookingView se vuelve a
// montar vacío: volvería con la contraseña cambiada y sin nada de lo que había
// elegido, que es justo el corte que el modal vino a evitar.
//
// SOLO se guardan tour, fecha, cupos, paso y la RUTA de vuelta. Los datos
// personales (nombre, teléfono, correo y documento) NO se guardan a propósito:
// son identidad, no navegación, y no tienen por qué quedar escritos en el disco
// de nadie.
//
// La ruta va porque sin ella el viajero que cambió su contraseña sabe que su
// reserva quedó guardada pero no tiene botón para volver a ella: habría que
// reconstruir la URL desde el id, y el id solo no alcanza (la ficha lleva slug
// y sufijo).
//
// Es además la precondición anotada para "entrar con Google" en
// `docs/pendientes-producto.md`: ese redirect tiene el mismo problema, más
// grande. Se escribe una vez y sirve para los dos.
const BOOKING_DRAFT_KEY = "finde:borrador-reserva";
// Un borrador viejo no se restaura: si alguien vuelve una semana después, la
// fecha que había elegido puede estar en el pasado o sin cupo.
const BOOKING_DRAFT_TTL_MS = 24 * 60 * 60 * 1000;

function readBookingDraft() {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(BOOKING_DRAFT_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    if (!d || typeof d !== "object" || !d.tourId) return null;
    if (!d.ts || Date.now() - d.ts > BOOKING_DRAFT_TTL_MS) {
      localStorage.removeItem(BOOKING_DRAFT_KEY);
      return null;
    }
    return d;
  } catch {
    return null;
  }
}

function writeBookingDraft(d) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(BOOKING_DRAFT_KEY, JSON.stringify({ ...d, ts: Date.now() }));
  } catch {
    /* quota: el borrador es una comodidad, no se rompe la reserva por esto */
  }
}

function clearBookingDraft() {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(BOOKING_DRAFT_KEY);
  } catch {
    /* idem */
  }
}

// ── El departamento que eligió el viajero ────────────────────────────────────
// Tercer par de helpers con la misma forma que los dos de arriba
// (`finde_notif_seen` y `finde:borrador-reserva`), con la misma guarda de
// `typeof` y el mismo try/catch. No se inventa un mecanismo nuevo.
//
// SE GUARDAN TRES CAMPOS, Y EL TERCERO ES EL QUE HACE FUNCIONAR TODO:
//
//   dept             lo que el viajero eligió
//   detectedAtChoice lo que la IP decía EN EL MOMENTO en que eligió
//   ts               cuándo
//
// POR QUÉ `detectedAtChoice` Y NO COMPARAR CONTRA `dept`. La pregunta que hay
// que responder en cada visita es "¿este viajero se movió?", y la respuesta
// NO es "¿la IP dice algo distinto de lo que eligió?".
//
// El caso real que lo demuestra, y está medido: la IP de José reporta
// "Arequipa" estando él en Lima. Si él elige "Lima", entonces la detección va a
// diferir de su elección EN TODAS LAS VISITAS SIGUIENTES, esté donde esté.
// Comparar contra la elección lo haría ver la oferta de cambio para siempre:
// lo estaríamos castigando en cada visita por un error nuestro.
//
// Comparar contra lo que la IP decía CUANDO eligió responde la pregunta
// correcta:
//
//   mismo lugar, la IP sigue igual de equivocada -> detected == detectedAtChoice
//                                                   -> silencio
//   se movió, la IP cambió                       -> detected != detectedAtChoice
//                                                   -> se ofrece cambiar
//
// SUPUESTO, Y VA COMO SUPUESTO Y NO COMO HECHO: esto asume que la detección es
// ESTABLE POR CONEXIÓN, o sea que desde la misma red la IP contesta siempre lo
// mismo aunque se equivoque. De eso hay DOS muestras (la conexión de José, las
// dos veces "Arequipa"). Dos muestras no prueban estabilidad.
//
// QUÉ SE VERÍA SI EL SUPUESTO ES FALSO, para reconocerlo rápido: la oferta de
// cambio ("¿Estás en X? Cambiar") aparecería sola, a gente que no se movió, y
// cambiando de departamento entre visitas o incluso entre recargas. Si alguien
// reporta eso, la detección es ruidosa y esta comparación no sirve: habría que
// exigir varias lecturas seguidas iguales antes de ofrecer, o directamente dejar
// de ofrecer. Por eso la oferta es una línea descartable y no un modal: si el
// supuesto falla, molesta, no rompe.
const CITY_CHOICE_KEY = "finde_ciudad";

function readCityChoice() {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(CITY_CHOICE_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw);
    return c && typeof c === "object" && typeof c.dept === "string" ? c : null;
  } catch {
    return null;
  }
}

function writeCityChoice(dept, detectedAtChoice) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(
      CITY_CHOICE_KEY,
      JSON.stringify({ dept, detectedAtChoice: detectedAtChoice || null, ts: Date.now() })
    );
  } catch {
    /* quota: recordar la ciudad es una comodidad, no se rompe nada por esto */
  }
}

// Fecha de hoy (yyyy-mm-dd) en hora de Lima, para los reminders "hoy/mañana".
function limaTodayISO() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

// Etiqueta de tiempo relativa en español desde un ISO timestamp.
function relativeTimeLabel(iso) {
  const then = new Date(iso).getTime();
  if (isNaN(then)) return "";
  const diffMin = Math.floor((Date.now() - then) / 60000);
  if (diffMin < 1) return "Hace un momento";
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const h = Math.floor(diffMin / 60);
  if (h < 24) return `Hace ${h} ${h === 1 ? "hora" : "horas"}`;
  const d = Math.floor(h / 24);
  return `Hace ${d} ${d === 1 ? "día" : "días"}`;
}

// Deriva las notificaciones del VIAJERO desde sus reservas reales (trips):
// - "Tu tour es hoy/mañana" para reservas con fecha hoy/mañana (Lima). Arriba,
//   por urgencia (hoy antes que mañana).
// - "Reserva confirmada: {tour}" para reservas creadas en los últimos 7 días,
//   más recientes primero, máximo 5.
// Cada ítem navega a Mis Viajes (target "trips"). IDs estables por código.
const NOTIF_RECENT_MS = 7 * 24 * 60 * 60 * 1000;
function buildTravelerNotifs(trips) {
  if (!Array.isArray(trips)) return [];
  const today = limaTodayISO();
  const tomorrow = addDaysISO(today, 1);
  const now = Date.now();

  const reminders = trips
    .filter((t) => t.dateISO === today || t.dateISO === tomorrow)
    .sort((a, b) => (a.dateISO || "").localeCompare(b.dateISO || ""))
    .map((t) => {
      const isToday = t.dateISO === today;
      const title = t.tour?.title || "tu tour";
      return {
        id: `remind-${t.code}`,
        type: "reminder",
        title: isToday ? "Tu tour es hoy" : "Tu tour es mañana",
        body: `${title}${t.tour?.startTime ? ` · Salida ${t.tour.startTime}` : ""}`,
        time: isToday ? "Hoy" : "Mañana",
        icon: Clock,
        target: "trips",
      };
    });

  const confirmed = trips
    .filter((t) => t.createdAt && now - new Date(t.createdAt).getTime() <= NOTIF_RECENT_MS)
    // Reservas ya decididas en contra (no confirmada/cancelada): sin
    // notificación de celebración; el email de la decisión ya avisó.
    .filter((t) => !["RECHAZADA", "VENCIDA", "CANCELADA"].includes(t.bookingState))
    // Orden por recencia (createdAt desc) ANTES de cortar, con comparación
    // numérica de timestamp (robusta ante formatos de fecha no uniformes).
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
    .map((t) => {
      // Mismo criterio que el voucher: en modo manual la reserva nace como
      // SOLICITUD y "Reserva confirmada" sería falso. Sin estado (legacy,
      // trip local del demo) se conserva el texto de siempre.
      const esSolicitud = t.bookingState === "SOLICITUD";
      return {
        id: `confirm-${t.code}`,
        type: "booking",
        title: esSolicitud ? "Solicitud enviada" : "Reserva confirmada",
        body: `${t.tour?.title || "Tu tour"} · ${t.date}`,
        time: relativeTimeLabel(t.createdAt),
        icon: esSolicitud ? Clock : CheckCircle,
        target: "trips",
        // ts: orden por recencia en la lista combinada (viajero + operador).
        ts: new Date(t.createdAt).getTime(),
      };
    });

  // Reminders (urgentes) primero, luego confirmadas por recencia.
  return [...reminders, ...confirmed];
}

// Deriva las notificaciones del OPERADOR desde las reservas RECIBIDAS en sus
// tours (opBookings, de /api/operators/me/bookings): "Nueva reserva: {cliente}
// reservó {tour}" por cada reserva creada en los últimos 7 días, más recientes
// primero, máximo 5. Cada ítem navega a la pestaña Reservas (target
// "dashboard"). Para un viajero puro opBookings=[] → lista vacía.
function buildOperatorNotifs(opBookings) {
  if (!Array.isArray(opBookings)) return [];
  const now = Date.now();
  return opBookings
    .filter((b) => b.createdAt && now - new Date(b.createdAt).getTime() <= NOTIF_RECENT_MS)
    // Orden por recencia (createdAt desc) ANTES de cortar, con comparación
    // numérica de timestamp (robusta ante formatos de fecha no uniformes).
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
    .map((b) => ({
      id: `opbooking-${b.id}`,
      type: "booking",
      title: "Nueva reserva",
      body: `${b.customer || "Un cliente"} reservó ${b.tour || "tu tour"}`,
      time: relativeTimeLabel(b.createdAt),
      icon: Ticket,
      target: "dashboard",
      ts: new Date(b.createdAt).getTime(),
    }));
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
    shortPitch: f.shortPitch,
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
    // Galería (sub-paso 3): array de URLs en orden. Siempre se envía (el backend
    // lo filtra a http(s) y REEMPLAZA Tour.images). En edición se carga la
    // galería existente en form.images, así que re-enviarla la preserva.
    images: Array.isArray(f.images) ? f.images : [],
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
  { query: "qué hacer en Fiestas Patrias", results: ["cmoh8re7d001rvpn2eyvaz3bk", "cmoh8re4h001pvpn23qzu04f2", "cmoh8re1o001nvpn2yispucfu"], reason: "Multi-día o full day + temporada seca" },
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

// Aca vivian TRES definiciones de las ciudades: la lista soportada, sus alias y
// una tercera lista mas chica para el buscador local. Las tres se fueron a
// lib/cities.js, que es el mismo modulo que consume /api/geo. El porque, y el
// bug que costo (un viajero en Cajamarca veia tours de Lima), estan ahi.
//
// Lo unico que quedo aca es el override de desarrollo, que es de la app y no
// del dominio.

// Dev-only: en localhost permitimos override por ?city=Cusco. En cualquier
// otro host devuelve null y el frontend confia en /api/geo.
function readDevCityOverride() {
  if (typeof window === "undefined") return null;
  const host = window.location.hostname;
  if (host !== "localhost" && host !== "127.0.0.1") return null;
  const params = new URLSearchParams(window.location.search);
  const override = params.get("city");
  if (!override) return null;
  const norm = normalizeCity(override);
  // Acepta el departamento ("Loreto") o el nombre que se muestra ("Iquitos").
  return DEPARTMENTS.find(d => normalizeCity(d) === norm || normalizeCity(displayName(d)) === norm) || null;
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
  for (const [city, aliases] of Object.entries(QUERY_DEPT_ALIASES)) {
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

// Las notificaciones in-app ya no son un array mock: se DERIVAN de datos reales
// (ver buildTravelerNotifs y la derivación en AppDemo). El estado "leído" vive en
// localStorage (NOTIF_SEEN_KEY), no hay modelo Notification en DB.

// "Mis Viajes" ya no usa seed mock: se hidrata con las reservas REALES del
// viajero desde GET /api/me (bookings filtradas por userEmail del token),
// mapeadas con mapBookingToTrip. Ver el useEffect de hidratación en AppDemo.

// Reseñas: solo reales. Eliminado todo el andamiaje de reseñas/ratings
// fabricados (REVIEW_AUTHORS, REVIEW_TEXTS_BY_CATEGORY, hashTourId,
// distributeStars, generateMockReviews). Un tour solo muestra rating/reseñas
// cuando existen reseñas reales: hoy, las que deja el viajero en sesión vía
// handleReview (estado `reviews`); a futuro, un modelo Review en DB. Sin
// reseñas → "Nuevo" en cards y sin bloque de rating en detalle/búsqueda.

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
.app{--f:#1B3A2D;--m:#2D5A3D;--sg:#6B8F71;--sd:#E8DDD3;--cr:#F5F0EA;--wh:#FAFAF7;--tr:#C7613A;--tr-text:#A84E2C;--trl:#E8845A;--gd:#D4A843;--gd-text:#7A5C10;--ch:#2C2C2A;--gy:#737370;--gy-strong:#5A5A57;--lg:#959591;--yp:#6B2FA0;--pl:#00B4D8;--ai:#0EA5E9;--focus:rgba(45,90,61,.35)}
.app *{margin:0;padding:0;box-sizing:border-box}

/* ── Fase 6A, paso 1: la escala en tokens ──
   Los nueve tamanos de la escala aprobada, declarados y SIN UN SOLO
   CONSUMIDOR. Este paso no mueve un pixel A PROPOSITO: los tokens se empiezan
   a consumir en el paso 2 (los titulos de seccion y de tarjeta), siguen en el
   paso 3 (el resto de los display) y se terminan en la Fase 6B.

   AL ASIGNARLOS SE CLASIFICA POR ROL, NO POR VALOR. 13px no es un rol, es un
   accidente: sus 73 declaraciones (48 aca mas 25 inline) sirven a cuatro
   funciones distintas. Un buscar y reemplazar de 13px por var(--fs-cap) deja
   una escala nueva con la misma jerarquia plana de antes.

   Y hay dos familias que NO toman token de texto: los controles nativos (44,
   los que declaran font-family:inherit) y los font-size que miden un glifo y
   no una palabra (19, como .pf-av o .lang-dd-btn .arr).

   FUERA DE LA ESCALA, decidido el 2026-08-18 y no por olvido:
   - .logo, la unica pieza serif que queda en el producto. Los numeros de esta
     escala estan calibrados por la altura de x de Jakarta (factor 0,884) y a
     DM Serif no le aplican.
   - .det-tl, el titulo del tour. --fs-d2 se midio mirando el titulo de
     SECCION del inicio contra el de tarjeta; aplicarselo al titulo del tour
     le sacaba 12px en escritorio, un 35%, en la pantalla que mas trafico va a
     tener, y eso no lo midio nadie. Es el unico del grupo con escalon propio
     de escritorio ademas de .st, y esa es la senal.

   Ver docs/plans/2026-08-13-plan-tipografia.md, Fase 6A. */
.app{--fs-d1:26px;--fs-d2:20px;--fs-h1:18px;--fs-h2:17px;--fs-h3:15px;--fs-body:16px;--fs-sm:14px;--fs-cap:13px;--fs-label:12px}
@media(min-width:640px){.app{--fs-d1:32px}}
@media(min-width:1024px){.app{--fs-d1:39px;--fs-d2:22px;--fs-h1:20px;--fs-h2:18px}}
/* Cifras tabulares: mismo ancho por digito. Evita que un contador salte de
   posicion al cambiar de valor y alinea los montos en columna. */
.gcnt,.dsh-s-v,.pf-stat-v,.login-hero-stat-v,.rev-big-n,.rev-big-cnt,.earn-bl,.sr-price,.tc-pr,.tc-pr span,.gc-p,.gc-p span,.bb-p,.bb-p span,.sum-r,.sum-t,.voucher-pay-row,.voucher-pay-row.total,.tp-price,.dsh-bk-a,.earn-tot,.sr-rating,.tc-m .rt,.gc-m .rt{font-variant-numeric:tabular-nums}
.app{font-family:'Plus Jakarta Sans',system-ui,sans-serif;background:var(--wh);color:var(--ch);-webkit-font-smoothing:antialiased;overflow-x:hidden}
.app{min-height:100vh;background:var(--wh);position:relative}

/* ── Fase 4, paso 1: replica de lo que hoy gobierna el bloque .app-demo ──
   Estas declaraciones replican A PROPOSITO lo que el demo hereda hoy del
   residuo de la plantilla de Vite que vive en src/index.css, para poder
   borrar ese bloque (paso 2) sin que se mueva nada.

   No las toques sin leer la Fase 4 de docs/plans/2026-08-13-plan-tipografia.md.
   El centrado en particular sostiene 128 selectores, mas los dos calendarios,
   que suman 81 elementos sin clase y por eso no figuran en ninguna lista.

   OJO: el line-height ya NO es replica. La Fase 5 lo paso de 145% a 1.5 sin
   unidad, que es el unico cambio de esta linea respecto de lo que imponia el
   bloque. El de .app h2 paso de 118% a 1.18 por el mismo motivo.

   NO se replican a proposito, y eso tambien esta decidido: border-inline
   (estetica de scaffold de Vite), color-scheme, font-synthesis,
   text-rendering y box-sizing. El min-height ya lo declara .app arriba. */
.app{width:1126px;max-width:100%;margin:0 auto;text-align:center;display:flex;flex-direction:column;font-size:18px;line-height:1.5;letter-spacing:.18px}
@media(max-width:1024px){.app{font-size:16px}}
/* Los tres h2 del demo (.npage-h h2, .tp-h h2 y .tdet-h) heredan CUATRO
   propiedades de .app-demo h2, no solo el peso. El 400 va explicito porque DM
   Serif Display solo trae ese peso: hoy computan 500 y renderizan 400, porque
   font-synthesis:none impide inventarlo, asi que declarar 400 preserva el
   render exacto. .tdet-h conserva su margin-bottom:14px propio, que gana por
   especificidad. */
.app h2{font-weight:400;line-height:1.18;letter-spacing:-.24px;margin:0 0 8px}

/* ── Fase 5, paso 2: los display que la base perturba ──
   La base sin unidad le devuelve a cada elemento una caja proporcional, y eso
   destapa que estos 22 selectores nunca declararon la suya: venian aplastados
   por el valor absoluto heredado. El logotipo de 42px del login vivia en una
   caja de 23.2px, ratio 0.55. Sin este bloque la fase los deja inflados, que es
   cambiar un valor malo por otro.

   Los valores NO son nuevos: son los de la escala de la Fase 6, asignados por
   ROL y no por tamano. 1.2 es --fs-d2, 1.3 es --fs-h1, 1.35 es --fs-h2. El 1.1
   del logotipo y el 1 del icono son casos propios, fuera de escala. Cuando la
   Fase 6 arme los tokens, esto se MIGRA al token, no se recalcula.
   Ver docs/plans/2026-08-13-plan-tipografia.md, Fase 5. */

/* Icono: la caja pegada al glifo, mismo criterio que .bn-i .ni, que ya lo tiene.
   .ai-sb-ic es un <span> que solo contiene un SVG y esta en position:absolute
   centrado con translateY(-50%): una caja del tamano del glifo hace que ese
   centrado no dependa de la base. */
.ai-sb-ic{line-height:1}
/* Logotipo. Una sola declaracion cubre los tres tamanos, porque .tn .logo y
   .site-footer-brand .logo son el mismo elemento con otro font-size. */
.logo,.login-hero-logo{line-height:1.1}
/* Titulo de pagina, de seccion y de formulario = --fs-d2, hoy 20/22.
   El tamano que decia este comentario (26 y 24px) quedo viejo dos veces: por
   el cambio de fuente del 2026-08-18 y por la correccion de --fs-d2 a 20/22.
   Los seis ya consumen el token (Fase 6A, pasos 2 y 3). */
.welcome-title,.suc-t,.st,.login-title,.bkf-t,.dsh-nm{line-height:1.2}
/* Numero o dato destacado: una sola linea, o linea mas etiqueta, cuyo alto lo
   absorbe un contenedor con padding propio. La caja de linea no le aporta
   legibilidad, solo aire impredecible en una fila que tiene que cuadrar con un
   boton o con su etiqueta. Apretado hace que el alto lo mande el padding, que
   esta declarado, en vez de la base, que se hereda. */
.bb-p,.sum-t,.dsh-s-v,.pf-stat-v,.gcnt,.login-hero-stat-v{line-height:1.2}
/* Encabezado menor = --fs-h1, hoy 18/20. Estos dos TODAVIA no consumen el
   token: .pf-name esta en 19px y .rev-hdr en 18. Se migran en la Fase 6B,
   junto con la decision de si --fs-h1 (18/20) y --fs-h2 (17/18) se sostienen
   a 1px de distancia en movil. */
.pf-name,.rev-hdr{line-height:1.3}
/* Encabezado chico = --fs-h2, hoy 17/18. Tampoco consumen el token todavia:
   los cuatro primeros estan en 16px y .ai-cc-h span en 18. Fase 6B. */
.city-sheet-title,.notif-sheet-title,.city-empty-tl,.pf-sec-t,.ai-cc-h span{line-height:1.35}

/* Focus accesible — solo navegación con teclado */
.app :focus{outline:none}
.app a:focus-visible,.app button:focus-visible,.app summary:focus-visible,.app [role="button"]:focus-visible,.app [tabindex="0"]:focus-visible{outline:2px solid var(--f);outline-offset:2px;border-radius:4px}
.app input:focus-visible,.app textarea:focus-visible,.app select:focus-visible{outline:none;border-color:var(--m);box-shadow:0 0 0 4px var(--focus)}
.app input[type="checkbox"]:focus-visible,.app input[type="radio"]:focus-visible{outline:2px solid var(--f);outline-offset:2px;box-shadow:none}

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
.login-hero-tagline{font-size:15px;color:rgba(255,255,255,.7);margin-top:6px;position:relative;z-index:2}
.login-hero-stat{display:flex;gap:20px;margin-top:20px;position:relative;z-index:2}
.login-hero-stat-i{text-align:center}
.login-hero-stat-v{font-size:18px;font-weight:800;color:white}
.login-hero-stat-l{font-size:10px;color:rgba(255,255,255,.75);text-transform:uppercase;letter-spacing:.5px;margin-top:2px}
.login-body{flex:1;padding:28px 24px;display:flex;flex-direction:column}
.login-title{font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-weight:700;font-size:var(--fs-d2);margin-bottom:4px}
.login-sub{font-size:13px;color:var(--gy);margin-bottom:24px}
.login-btn{width:100%;padding:16px;border-radius:14px;background:var(--f);color:white;font-weight:700;font-size:15px;border:none;cursor:pointer;font-family:inherit;transition:.2s;margin-bottom:12px}
.login-btn:hover{background:var(--m)}
.login-btn:disabled{opacity:.4;cursor:not-allowed}
.login-google{width:100%;padding:14px;border-radius:14px;background:white;border:1.5px solid var(--sd);color:var(--ch);font-weight:600;font-size:14px;cursor:pointer;font-family:inherit;transition:.2s;display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:12px}
.login-google:hover{border-color:var(--lg);background:var(--cr)}
.login-google svg{flex-shrink:0}
.login-divider{display:flex;align-items:center;gap:14px;margin:16px 0;color:var(--gy-strong);font-size:12px}
.login-divider::before,.login-divider::after{content:'';flex:1;height:1px;background:var(--sd)}
.login-skip{width:100%;padding:14px;border-radius:14px;background:none;border:1.5px solid var(--sd);color:var(--gy);font-weight:600;font-size:13px;cursor:pointer;font-family:inherit;transition:.2s}
.login-skip:hover{border-color:var(--m);color:var(--ch)}
.login-terms{font-size:11px;color:var(--gy-strong);text-align:center;margin-top:auto;padding-top:16px}
.login-terms a{color:var(--tr-text);text-decoration:none;font-weight:600}
/* Modal de cuenta. NO se portaliza a document.body a propósito: las variables
   de marca (--f, --cr, --gy-strong...) se declaran en .app, así que un portal
   fuera de ese árbol dejaría a .login-btn con background:var(--f) sin resolver.
   .app no declara transform ni filter, así que position:fixed adentro cubre el
   viewport igual y no necesita escapar de nada. */
.acc-backdrop{position:fixed;inset:0;background:rgba(27,58,45,.45);z-index:120;animation:fadeUp .18s ease-out}
.acc-modal{position:fixed;z-index:121;left:50%;top:50%;transform:translate(-50%,-50%);width:min(420px,calc(100vw - 32px));max-height:calc(100vh - 32px);overflow-y:auto;background:white;border-radius:20px;padding:28px 24px 24px;box-shadow:0 20px 60px rgba(0,0,0,.22);text-align:left;animation:fadeUp .2s ease-out}
.acc-close{position:absolute;top:14px;right:14px;background:transparent;border:0;padding:6px;cursor:pointer;color:var(--gy);display:flex;align-items:center;border-radius:8px;transition:.2s}
.acc-close:hover{background:var(--cr);color:var(--ch)}
.acc-modal-h{margin-bottom:20px;padding-right:28px}
.acc-t{font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-weight:700;font-size:var(--fs-d2);color:var(--f);margin-bottom:8px;line-height:1.2;letter-spacing:0}
.acc-d{font-size:14px;color:var(--gy-strong);line-height:1.5}
.acc-calma{display:flex;align-items:center;gap:8px;margin-top:14px;padding:10px 12px;background:var(--cr);border-radius:10px;font-size:12px;color:var(--f);font-weight:600;line-height:1.4}
.acc-calma svg{flex-shrink:0}
@media(max-width:639px){
  /* Hoja inferior, mismo patrón que el sheet de notificaciones. */
  .acc-modal{left:0;right:0;bottom:0;top:auto;transform:none;width:auto;border-radius:20px 20px 0 0;max-height:88vh;padding:24px 20px 28px;animation:slideUp .25s ease-out}
}
/* Login input (M1: email/password). No flex:1 ni letter-spacing del campo de teléfono. */
.login-input{width:100%;padding:13px 16px;border:2px solid var(--sd);border-radius:14px;font-size:16px;font-family:inherit;background:white;color:var(--ch);outline:none;transition:.2s;box-sizing:border-box}
.login-input:focus{border-color:var(--m);box-shadow:0 0 0 4px var(--focus)}
.login-input:-webkit-autofill,.login-input:-webkit-autofill:hover,.login-input:-webkit-autofill:focus,.login-input:-webkit-autofill:active{-webkit-box-shadow:0 0 0 1000px white inset !important;box-shadow:0 0 0 1000px white inset !important;-webkit-text-fill-color:var(--ch) !important;caret-color:var(--ch);transition:background-color 9999s ease-in-out 0s}
.login-input:-webkit-autofill:focus{-webkit-box-shadow:0 0 0 1000px white inset,0 0 0 4px var(--focus) !important;box-shadow:0 0 0 1000px white inset,0 0 0 4px var(--focus) !important}
/* Segmented control signin/signup */
.login-tabs{display:flex;gap:0;background:var(--cr);border:1.5px solid var(--sd);border-radius:12px;padding:4px;margin-bottom:20px}
.login-tab{flex:1;padding:10px 12px;border:0;background:transparent;color:var(--gy-strong);font-weight:600;font-size:13px;border-radius:8px;cursor:pointer;font-family:inherit;transition:.2s}
.login-tab.on{background:var(--f);color:white;box-shadow:0 2px 6px rgba(27,58,45,.15)}

/* OTP Input */
.otp-row{display:flex;gap:10px;justify-content:center;margin-bottom:24px}
.otp-digit{width:48px;height:56px;border:2px solid var(--sd);border-radius:12px;font-size:24px;font-weight:700;text-align:center;font-family:inherit;outline:none;transition:.2s;color:var(--ch)}
.otp-digit:focus{border-color:var(--f);background:rgba(45,90,61,.03)}
.otp-resend{font-size:12px;color:var(--gy);text-align:center;margin-bottom:20px}
.otp-resend button{background:none;border:none;color:var(--tr-text);font-weight:600;cursor:pointer;font-family:inherit;font-size:12px}

/* Welcome screen */
.welcome{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 24px;text-align:center}
.welcome-check{width:72px;height:72px;border-radius:50%;background:var(--f);color:white;display:flex;align-items:center;justify-content:center;font-size:32px;margin-bottom:20px;animation:pulse .6s ease}
.welcome-title{font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-weight:700;font-size:var(--fs-d2);margin-bottom:8px}
.welcome-sub{font-size:14px;color:var(--gy);margin-bottom:32px;line-height:1.6;max-width:280px}
.welcome-features{display:flex;flex-direction:column;gap:12px;width:100%;margin-bottom:32px}
.welcome-feat{display:flex;align-items:center;gap:12px;padding:14px 16px;background:var(--cr);border-radius:12px;text-align:left}
.welcome-feat-ic{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}
.welcome-feat-txt{font-size:13px;font-weight:600}

/* ── Nav ── */
.tn{position:sticky;top:0;z-index:50;background:rgba(250,250,247,.85);backdrop-filter:blur(20px);box-shadow:0 1px 0 transparent;transition:box-shadow .15s}
.tn.scrolled{box-shadow:0 1px 0 rgba(0,0,0,.06)}
.tn-inner{display:flex;align-items:center;justify-content:space-between;padding:12px 20px}
/* EL LOGO ES LA UNICA PIEZA SERIF DEL PRODUCTO, y es a proposito.
   Decision del 2026-08-18 (docs/decisiones.md): el producto va en Plus
   Jakarta Sans porque ningun marketplace de viajes grande usa serif display
   en la interfaz, y varios tienen logotipo en otra fuente que su producto.
   Un wordmark es un dibujo de una palabra, no texto: no se unifica con el
   resto. Las otras dos apariciones de DM Serif son el mismo logo en otro
   lado (.login-hero-logo y la pantalla de carga). No agregar mas. */
/* El logo NO toma token, y no es un olvido: es la unica pieza serif que queda
   en el producto, y los numeros de la escala estan calibrados por la altura de
   x de Jakarta (factor 0,884), que a DM Serif no le aplica. Con --fs-d2 en
   20/22 bajaria de 28 a 20. Sus tamanos son 28 aca, 26 en la barra a partir de
   1024 y 24 en el pie. Ver la Fase 6A del plan tipografico. */
.logo{font-family:'DM Serif Display',Georgia,serif;font-size:28px;color:var(--f);cursor:pointer;letter-spacing:-.5px}
.logo span{color:var(--tr)}
.logo-ai{font-size:9px;font-weight:700;color:var(--f);background:rgba(14,165,233,.1);padding:2px 6px;border-radius:4px;margin-left:6px;vertical-align:super;letter-spacing:.5px}
.tn-r{display:flex;gap:8px}
.tn-btn{width:44px;height:44px;border-radius:50%;border:1.5px solid var(--lg);background:white;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:.2s;font-family:inherit;position:relative;color:var(--ch)}
.tn-btn:hover{border-color:var(--f);transform:scale(1.05)}
.tn-btn.on{background:var(--f);border-color:var(--f);color:white}
.ndot{position:absolute;top:6px;right:6px;width:8px;height:8px;border-radius:50%;background:var(--tr);border:2px solid white}

.bn{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:none;background:rgba(250,250,247,.92);backdrop-filter:blur(20px);border-top:1px solid rgba(0,0,0,.06);display:flex;justify-content:space-around;padding:8px 0 max(env(safe-area-inset-bottom),8px);z-index:100}
.bn-i{display:flex;flex-direction:column;align-items:center;gap:2px;font-size:10px;font-weight:600;color:var(--gy-strong);cursor:pointer;padding:6px 16px;border-radius:12px;transition:.2s;background:none;border:none;font-family:inherit}
.bn-i.on{color:var(--f)}.bn-i .ni{font-size:22px;line-height:1}
.bn-i .nd{width:4px;height:4px;border-radius:50%;background:var(--tr);opacity:0;transition:.2s}.bn-i.on .nd{opacity:1}

/* ── Hero ── */
.hero{position:relative;margin:0 16px 20px;border-radius:28px;overflow:hidden;height:220px;background:url(https://images.unsplash.com/photo-1593111357479-0384c900794c?q=80&w=2400&auto=format&fit=crop) center/cover no-repeat}
.hero-tex{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.45) 0%,rgba(0,0,0,.65) 100%)}
.hero-c{position:relative;z-index:2;padding:28px 24px;display:flex;flex-direction:column;justify-content:space-between;height:100%}
.hero-tag{display:inline-flex;align-items:center;gap:6px;background:rgba(0,0,0,.45);backdrop-filter:blur(10px);padding:6px 14px;border-radius:100px;font-size:11px;font-weight:600;color:#fff;width:fit-content;letter-spacing:.5px}
/* Display de portada. --fs-d1 trae los TRES escalones (26 / 32 a 640 / 39 a
   1024), asi que los media queries de abajo ya no declaran font-size, solo el
   max-width y el centrado, que son de layout y no de escala. */
.hero-t{font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-weight:700;font-size:var(--fs-d1);line-height:1.15;color:white;max-width:280px}
.hero-sub{font-size:13px;color:#fff;margin-top:4px}

/* ── AI Search ── */
.ai-sb{margin:0 16px 12px;position:relative;z-index:70}
.ai-sb input{width:100%;padding:13px 48px 13px 44px;border:2px solid var(--sd);border-radius:20px;font-size:16px;font-family:inherit;background:white;color:var(--ch);transition:.3s;outline:none}
.ai-sb input:focus{border-color:var(--m);box-shadow:0 0 0 4px rgba(45,90,61,.08)}
.ai-sb input::placeholder{color:var(--gy)}
.inp::placeholder,.login-input::placeholder,.rv-textarea::placeholder,.ai-cc-input::placeholder{color:var(--gy)}
.ai-sb-ic{position:absolute;left:16px;top:50%;transform:translateY(-50%);font-size:16px;color:var(--gy)}
.ai-sb-tag{position:absolute;right:14px;top:50%;transform:translateY(-50%);padding:3px 8px;border-radius:6px;font-size:9px;font-weight:700;color:var(--f);background:var(--cr);letter-spacing:.3px}
.ai-suggest{position:absolute;top:calc(100% + 4px);left:0;right:0;background:white;border-radius:12px;box-shadow:0 8px 28px rgba(0,0,0,.12);z-index:200;border:1px solid rgba(0,0,0,.08);max-height:380px;overflow-y:auto;padding:6px 0}
.ai-suggest-h{padding:8px 12px 4px;font-size:10px;font-weight:700;color:var(--f);text-transform:uppercase;letter-spacing:1px;display:flex;align-items:center;gap:6px}
.ai-suggest-i{padding:8px 12px;cursor:pointer;transition:.15s;font-size:13px;color:var(--ch);border-bottom:1px solid rgba(0,0,0,.03)}
.ai-suggest-i:hover{background:var(--cr)}
.ai-suggest-i:last-child{border-bottom:none}
.ai-suggest-q{font-weight:600}
.ai-suggest-r{font-size:11px;color:var(--gy-strong);margin-top:2px}
.sr-item{display:flex;align-items:center;gap:10px;padding:10px 12px;cursor:pointer;transition:.15s;border-bottom:1px solid rgba(0,0,0,.03)}
.sr-item:hover{background:var(--cr)}
.sr-item:last-of-type{border-bottom:none}
.sr-thumb{width:44px;height:44px;border-radius:10px;flex-shrink:0}
.sr-info{flex:1;min-width:0}
.sr-name{font-size:13px;font-weight:700;color:var(--ch);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sr-loc{font-size:11px;color:var(--gy-strong);margin-top:1px}
.sr-meta{text-align:right;flex-shrink:0}
.sr-price{font-size:13px;font-weight:800;color:var(--f)}
.sr-rating{font-size:10px;color:var(--gd)}
.sr-viewall{padding:10px 12px;text-align:center;font-size:13px;font-weight:700;color:var(--tr-text);cursor:pointer;border-top:1px solid rgba(0,0,0,.06)}
.sr-viewall:hover{background:var(--cr)}
.sr-noresults{padding:16px 12px;font-size:13px;color:var(--gy);text-align:center}
.sr-pills{display:flex;flex-wrap:wrap;gap:6px;padding:8px 12px;justify-content:center}
.sr-ai-hint{padding:6px 12px;font-size:11px;color:var(--m);font-weight:600;display:flex;align-items:center;gap:4px}
.sr-clear{background:none;border:none;font-size:16px;color:var(--gy);cursor:pointer;padding:4px 8px;margin-left:auto;flex-shrink:0;min-height:44px}
.sr-clear:hover{color:var(--ch)}

/* AI Result banner */
.ai-result{margin:0 16px 16px;padding:14px 16px;background:var(--cr);border:1px solid var(--sd);border-radius:14px;display:flex;align-items:flex-start;gap:10px}
.ai-result-ic{width:28px;height:28px;border-radius:8px;background:rgba(45,90,61,.1);display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;color:var(--f)}
.ai-result-t{font-size:12px;font-weight:600;color:var(--f)}
.ai-result-b{font-size:11px;color:var(--gy-strong);margin-top:2px;line-height:1.4}
.ai-result-x{font-size:13px;color:var(--ch);margin-top:8px;padding-top:8px;border-top:1px solid rgba(0,0,0,.08)}
/* Loading reusa exactamente el mismo banner que el resultado IA: solo el
   ícono pulsa para indicar actividad, sin cambios de color. */
.ai-result.loading .ai-result-ic{animation:pulse 1.4s ease-in-out infinite}

/* ── Language Dropdown ── */
.lang-dd{position:relative;display:inline-block}
.lang-dd-btn{padding:5px 12px;border-radius:8px;font-size:11px;font-weight:600;border:1.5px solid var(--sd);background:white;color:var(--ch);cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:4px;min-height:44px}
.lang-dd-btn .arr{font-size:8px;color:var(--gy-strong);margin-left:2px}
.lang-dd-menu{position:absolute;top:calc(100% + 4px);right:0;background:white;border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.12);z-index:80;overflow:hidden;min-width:120px;border:1px solid rgba(0,0,0,.06)}
.lang-dd-item{padding:10px 14px;font-size:12px;font-weight:500;cursor:pointer;transition:.15s;display:flex;align-items:center;gap:8px;border-bottom:1px solid rgba(0,0,0,.03)}
.lang-dd-item:last-child{border-bottom:none}
.lang-dd-item:hover{background:var(--cr)}
.lang-dd-item.on{font-weight:700;color:var(--f)}
.lang-dd-item .lang-check{width:14px;font-size:12px;color:var(--f)}

/* ── Chips ── */
.cats{display:flex;gap:8px;padding:0 16px 16px;overflow-x:auto;scrollbar-width:none}
.cats::-webkit-scrollbar{display:none}
.chip{display:flex;align-items:center;gap:6px;padding:10px 16px;border-radius:100px;font-size:13px;font-weight:600;white-space:nowrap;cursor:pointer;transition:.25s;border:1.5px solid var(--sd);background:white;color:var(--ch);font-family:inherit;min-height:44px}
.chip.on{background:var(--f);color:white;border-color:var(--f)}

.sh{display:flex;justify-content:space-between;align-items:baseline;padding:0 20px;margin-bottom:14px}
/* Titulo de seccion. El tamano lo manda --fs-d2, que incluye el escalon de
   escritorio: por eso ya no hay una regla de .st en el media query de 1024.

   OJO, y esto vale para las otras nueve cabeceras que tambien tomaron --fs-d2:
   el numero 20/22 se midio mirando ESTE selector contra el titulo de tarjeta
   del inicio. .det-tl, el titulo del tour, quedo AFUERA del token a proposito,
   porque nadie midio esa pantalla. Ver la Fase 6A del plan. */
.st{font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-weight:700;font-size:var(--fs-d2)}
.sl{font-size:13px;font-weight:600;color:var(--tr-text);cursor:pointer;border:none;background:none;font-family:inherit;min-height:44px}

/* ── Sección "Tours en [ciudad]" con selector ── */
.city-sh{align-items:center}
.city-ask{margin:0 0 16px;text-align:left}
.city-ask-t{font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-size:15px;font-weight:700;color:var(--ch);margin-bottom:8px}
.city-ask-row{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch}
.city-ask-row::-webkit-scrollbar{display:none}
.city-ask-chip{flex:0 0 auto;padding:9px 14px;border-radius:100px;border:1.5px solid var(--sd);background:white;color:var(--ch);font-family:inherit;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap}
.city-ask-chip.on{background:var(--f);border-color:var(--f);color:white}
.city-ask-move{display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-size:14px;color:var(--gy-strong);font-weight:600}
/* Aca vivian .city-near y .city-near-off, que pintaban ' · cerca de ti' y
   ' · no detectamos tu ciudad' al lado del titulo de la seccion de ciudad. Las
   dos frases se sacaron el 2026-08-19 (ver el comentario largo en HomeView) y
   las reglas se van con ellas. Si alguna vuelve a aparecer, que sea con una
   decision nueva y no porque quedo el estilo hecho. */
.city-actions{display:flex;align-items:center;gap:12px}
/* Mobile-first: el botón "Ver todos / Ver menos" se oculta en mobile porque
   el carrusel horizontal ya permite navegar todas las cards con swipe. En
   ≥640px (donde .tscr pasa a grid) lo restauramos. */
.city-actions .sl{display:none}
.city-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:999px;border:1.5px solid var(--sd);background:white;color:var(--ch);font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;transition:.2s;min-height:44px}
.city-btn:hover{border-color:var(--sg);color:var(--f)}
.city-btn .city-btn-chev{transition:transform .2s}
.city-btn.open .city-btn-chev{transform:rotate(180deg)}
.city-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:90;animation:fadeUp .2s ease-out}
.city-sheet{position:fixed;left:0;right:0;bottom:0;background:white;border-radius:20px 20px 0 0;padding:8px 0 24px;z-index:91;max-height:60vh;overflow-y:auto;animation:slideUp .25s ease-out;box-shadow:0 -8px 32px rgba(0,0,0,.15)}
.city-sheet-grip{width:40px;height:4px;background:var(--sd);border-radius:2px;margin:10px auto 14px}
.city-sheet-title{font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-weight:700;font-size:16px;padding:0 20px 10px;color:var(--ch)}
.city-sheet-opt{display:flex;justify-content:space-between;align-items:center;padding:14px 20px;cursor:pointer;border:none;background:none;width:100%;font-family:inherit;font-size:14px;font-weight:600;color:var(--ch);text-align:left;transition:background .15s}
.city-sheet-opt:hover{background:var(--cr)}
.city-sheet-opt.on{color:var(--tr-text)}
.city-sheet-opt .city-sheet-check{color:var(--tr)}
/* Popover de notificaciones (campana): mobile = bottom-sheet; desktop (≥640px,
   en el media query de abajo) = dropdown anclado a la derecha. Clases propias
   notif-* (no reutilizan city-*). */
.notif-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:90;animation:fadeUp .2s ease-out}
.notif-sheet{position:fixed;left:0;right:0;bottom:0;background:white;border-radius:20px 20px 0 0;padding:8px 0 24px;z-index:91;max-height:70vh;display:flex;flex-direction:column;animation:slideUp .25s ease-out;box-shadow:0 -8px 32px rgba(0,0,0,.15)}
.notif-sheet-grip{width:40px;height:4px;background:var(--sd);border-radius:2px;margin:10px auto 14px;flex:none}
.notif-sheet-h{display:flex;justify-content:space-between;align-items:center;padding:0 20px 12px;flex:none}
.notif-sheet-title{font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-weight:700;font-size:16px;color:var(--ch)}
.notif-sheet-mark{font-size:12px;font-weight:600;color:var(--tr-text);background:none;border:none;cursor:pointer;font-family:inherit}
.notif-sheet-list{flex:1;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;text-align:left}
.city-empty{margin:0 16px 24px;padding:32px 20px;background:var(--cr);border-radius:20px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:10px}
.city-empty-ic{width:48px;height:48px;border-radius:50%;background:rgba(199,97,58,.12);color:var(--tr);display:flex;align-items:center;justify-content:center;margin-bottom:4px}
.city-empty-tl{font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-weight:700;font-size:16px;color:var(--ch);max-width:260px}
.city-empty-sub{font-size:13px;color:var(--gy-strong);max-width:300px}
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
.tc-ver{position:absolute;bottom:10px;left:10px;padding:3px 8px;border-radius:100px;font-size:9px;font-weight:700;background:rgba(45,90,61,.9);color:white;display:inline-flex;align-items:center;gap:3px}
/* TEXTO DE LA TARJETA A LA IZQUIERDA. Son CINCO declaraciones y no una, y
   conviene saber por que antes de "simplificarlo": text-align alcanza para
   .tc-b y .gc, pero las filas de metadatos y de precio son flex y se centran
   con justify-content, que text-align NO toca. Cambiar solo el text-align
   deja el titulo a la izquierda y el rating centrado debajo, que se ve peor
   que el centrado de antes. Las cinco: .gc, .tc-b, .tc-m, .gc-m y .tc-ft.
   Medido contra Airbnb, Booking y GetYourGuide el 2026-08-18: los tres
   alinean a la izquierda. Ver docs/audits/2026-08-16-identidad-visual.md. */
.tc-b{padding:14px;text-align:left}
.tc-loc{font-size:11px;color:var(--gy-strong);font-weight:600;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px}
/* Titulo de tarjeta del carrusel. Mismo rol que .gc-t, mismo token. El valor
   no cambia (ya estaba en 15px): se migra para que los dos titulos de tarjeta
   sigan al mismo token y no queden uno con token y otro a mano. */
.tc-tl{font-size:var(--fs-h3);font-weight:700;margin-bottom:6px;line-height:1.3}
.tc-m{display:flex;align-items:center;justify-content:flex-start;gap:6px;font-size:12px;color:var(--gy);margin-bottom:10px}
.tc-m .rt{color:var(--gd);font-weight:700}
.tc-ft{display:flex;justify-content:flex-start;align-items:center}
.tc-pr{font-size:16px;font-weight:800;color:var(--f)}.tc-pr span{font-size:11px;font-weight:400;color:var(--gy-strong)}

.tg{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:0 16px 120px}
.gc{border-radius:16px;overflow:hidden;background:white;border:1px solid rgba(0,0,0,.06);cursor:pointer;transition:.2s;text-align:left}
.gc:hover{transform:translateY(-2px);box-shadow:0 4px 16px rgba(0,0,0,.08)}
.gc-img{height:120px;position:relative}
.gc-ver{position:absolute;bottom:8px;left:8px;padding:3px 8px;border-radius:100px;font-size:9px;font-weight:700;background:rgba(45,90,61,.9);color:white;display:inline-flex;align-items:center;gap:3px}
.gc-b{padding:10px}
.gc-loc{font-size:10px;color:var(--gy-strong);font-weight:600;text-transform:uppercase;letter-spacing:.3px;margin-bottom:3px}
/* Titulo de tarjeta de la grilla. Sube de 13 a 15 (--fs-h3), y esa subida NO
   es cosmetica: es la mitad importante del arreglo de jerarquia. Medido contra
   Airbnb, Booking y GetYourGuide, la relacion entre el titulo de seccion y el
   de tarjeta tiene que caer entre 1,25 y 1,54; con .st en 20/22 y esto en 13
   quedaba en 1,54 movil y no mejoraba nada.

   El clamp va PEGADO a la subida y no es opcional. A 390px la celda deja
   143,5px utiles (medido: la barra de scroll se come 15px), o sea 16
   caracteres por linea a 15px. Con una mediana de titulo de 38 caracteres, 28
   de los 42 tours del catalogo pasan de dos lineas y la grilla pierde la
   altura pareja, que es el riesgo #3 de la auditoria.

   El tamano de escritorio lo manda el token, asi que ya no hay regla de .gc-t
   en el media query de 1024. */
.gc-t{font-size:var(--fs-h3);font-weight:700;margin-bottom:6px;line-height:1.3;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden}
.gc-p{font-size:14px;font-weight:800;color:var(--f)}.gc-p span{font-size:10px;font-weight:400;color:var(--gy-strong)}
.gc-m{display:flex;align-items:center;justify-content:flex-start;gap:5px;font-size:11px;color:var(--gy-strong);margin-bottom:6px;flex-wrap:wrap}
.gc-m .rt{color:var(--gd);font-weight:700;display:inline-flex;align-items:center;gap:2px}

/* ── Detail ── */
.det{padding-bottom:100px}
.det-hero{height:280px;position:relative;display:flex;flex-direction:column;justify-content:space-between;padding:16px}
/* Gradient con bottom reforzado para garantizar legibilidad del título blanco
   sobre cualquier imagen — incluso playas, mar, platos claros, cielos. */
.det-ov{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.25) 0%,rgba(0,0,0,0) 30%,rgba(0,0,0,0) 50%,rgba(0,0,0,.7) 100%);pointer-events:none}
/* Carrusel del hero (galería). Capa absoluta detrás del overlay/título: NO
   cambia el flex del hero → el título no se mueve. scroll-snap = swipe nativo. */
.det-gal{position:absolute;inset:0;z-index:0}
.det-gal-track{position:absolute;inset:0;display:flex;overflow-x:auto;overflow-y:hidden;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;scrollbar-width:none}
.det-gal-track::-webkit-scrollbar{display:none}
.det-gal-slide{flex:0 0 100%;width:100%;height:100%;scroll-snap-align:start}
.det-gal-arr{position:absolute;top:50%;transform:translateY(-50%);width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,.85);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--ch);z-index:3;backdrop-filter:blur(8px)}
.det-gal-arr:disabled{opacity:.35;cursor:default}
.det-gal-arr-l{left:12px}
.det-gal-arr-r{right:12px}
.det-gal-dots{position:absolute;top:16px;left:0;right:0;display:flex;gap:6px;justify-content:center;z-index:3;pointer-events:none}
.det-gal-dot{width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.55);transition:.2s}
.det-gal-dot.on{background:white;width:18px;border-radius:3px}
.bk-btn{width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.9);border:none;cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center;z-index:2;position:relative;backdrop-filter:blur(10px);color:var(--ch)}
.det-nfo{position:relative;z-index:2}
.det-bdg{display:inline-block;padding:4px 12px;border-radius:100px;font-size:10px;font-weight:700;background:rgba(255,255,255,.95);color:var(--ch);margin-bottom:8px}
.det-tl{font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-weight:700;font-size:23px;color:white;line-height:1.2}
/* Título del panel derecho — solo desktop. En mobile el título vive sobre la
   imagen del hero (.det-tl). En desktop el hero es sticky y 100vh, así que el
   título overlaid queda fuera del viewport. Mostramos un H1 en la columna de
   contenido para que sea legible y natural. */
.det-tl-desktop{display:none}
.det-c{padding:20px;text-align:left}
.ai-sum{padding:14px 16px;background:linear-gradient(135deg,rgba(14,165,233,.06),rgba(14,165,233,.02));border:1.5px solid rgba(14,165,233,.15);border-radius:14px;margin-bottom:20px}
.ai-sum-h{display:flex;align-items:center;gap:6px;font-size:10px;font-weight:700;color:var(--f);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px}
.ai-sum-t{font-size:13px;color:var(--ch);line-height:1.6}
.det-mb{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:20px}
.det-mi{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--ch);font-weight:500}
.mic{font-size:14px;opacity:.7}
.det-ds{font-size:14px;line-height:1.7;color:var(--ch);margin-bottom:20px}
.det-op{display:flex;align-items:center;gap:12px;padding:14px;background:var(--cr);border-radius:14px;margin-bottom:20px}
.det-op-av{width:44px;height:44px;border-radius:12px;background:var(--f);color:white;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:18px;position:relative;flex-shrink:0}
.det-op-n{font-size:14px;font-weight:700}.det-op-d{font-size:11px;color:var(--gy-strong);margin-top:2px}
.det-st{font-size:13px;font-weight:700;color:var(--ch);margin-bottom:10px;text-transform:uppercase;letter-spacing:.5px}
.det-incs{display:flex;flex-direction:column;gap:6px;margin-bottom:20px}
.det-inc{display:flex;align-items:center;gap:10px;font-size:13px}
.det-ic{width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0}
.det-ic.iy{background:rgba(45,90,61,.1);color:var(--m)}.det-ic.in{background:rgba(199,97,58,.1);color:var(--tr)}
.bb{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:none;padding:12px 20px max(env(safe-area-inset-bottom),12px);background:rgba(250,250,247,.95);backdrop-filter:blur(20px);border-top:1px solid rgba(0,0,0,.06);display:flex;align-items:center;gap:14px;z-index:100;flex-wrap:wrap}
/* Modo de venta para el viajero: fila propia arriba del precio y el boton */
.bb-mode{flex-basis:100%;display:flex;align-items:center;gap:5px;font-size:11.5px;font-weight:600;color:var(--gy-strong);margin-bottom:-2px}
.bb-p{font-size:20px;font-weight:800;color:var(--f);white-space:nowrap}.bb-p span{font-size:12px;font-weight:400;color:var(--gy);display:block}
.bb-bt{flex:1;padding:14px;border-radius:14px;background:var(--f);color:white;font-weight:700;font-size:15px;border:none;cursor:pointer;font-family:inherit;transition:.2s}
.bb-bt:hover{background:var(--m)}

/* ── Booking ── */
.bkf{padding:20px 20px 120px}
.bkf-st{display:flex;gap:6px;margin-bottom:24px}
.bkf-s{flex:1;height:4px;border-radius:2px;background:var(--sd);transition:.3s}
.bkf-s.on{background:var(--f)}
.bkf-t{font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-weight:700;font-size:var(--fs-d2);margin-bottom:4px}
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
.gbtn:disabled{opacity:.4;cursor:not-allowed;color:var(--gy-strong)}
.gcnt{min-width:60px;text-align:center;font-size:18px;font-weight:700}
.sum{background:var(--cr);border-radius:16px;padding:16px;margin-bottom:20px}
.sum-r{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(0,0,0,.06);font-size:14px}
.sum-r:last-child{border-bottom:none}
.sum-t{display:flex;justify-content:space-between;padding:12px 0 4px;font-size:16px;font-weight:800;color:var(--f)}
/* Bloques del detalle de reserva: separador entre tour, viajero y pago. */
.sum-g{border-top:1px solid rgba(0,0,0,.1);margin-top:6px;padding-top:6px}
.sum-h{font-size:10.5px;font-weight:700;color:var(--gy-strong);letter-spacing:.05em;text-transform:uppercase;padding:4px 0 2px}
.mbtn{width:100%;padding:16px;border-radius:14px;background:var(--f);color:white;font-weight:700;font-size:15px;border:none;cursor:pointer;font-family:inherit;transition:.2s}
.mbtn:hover{background:var(--m)}
.mbtn:disabled{opacity:.4;cursor:not-allowed}
.mbtn.yp{background:var(--yp)}
.pms{display:flex;flex-direction:column;gap:8px;margin-bottom:16px}
.pm{display:flex;align-items:center;gap:12px;padding:14px;border:2px solid var(--sd);border-radius:14px;cursor:pointer;transition:.2s}
.pm.sel{border-color:var(--f);background:rgba(27,58,45,.03)}
.pm-rd{width:18px;height:18px;border-radius:50%;border:2px solid var(--gy-strong);transition:.2s;flex-shrink:0}
.pm.sel .pm-rd{border-color:var(--f);background:var(--f);box-shadow:inset 0 0 0 3px white}
.pm-ic{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:white;flex-shrink:0}
.pm-n{flex:1;font-size:14px;font-weight:600}
.pm-tg{font-size:10px;font-weight:700;color:var(--yp);background:rgba(107,47,160,.1);padding:2px 8px;border-radius:4px}

/* Success */
.suc{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:80vh;padding:40px 24px;text-align:center}
.suc-chk{width:72px;height:72px;border-radius:50%;background:var(--f);color:white;display:flex;align-items:center;justify-content:center;font-size:32px;margin-bottom:20px;animation:pulse .6s ease}
.suc-t{font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-weight:700;font-size:var(--fs-d2);margin-bottom:8px}
.suc-sub{font-size:14px;color:var(--gy-strong);margin-bottom:24px;line-height:1.6}
.suc-card{width:100%;background:var(--cr);border-radius:16px;padding:16px;margin-bottom:20px;text-align:left}
.suc-row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(0,0,0,.06);font-size:14px}
.suc-row:last-child{border-bottom:none}
.suc-row .l{color:var(--gy-strong)}
.suc-wa{width:100%;padding:14px;border-radius:14px;background:#25D366;color:white;font-weight:700;font-size:14px;border:none;cursor:pointer;font-family:inherit;margin-bottom:10px;transition:.2s}
.suc-wa:hover{background:#1eb954;box-shadow:0 4px 12px rgba(37,211,102,.3)}
.suc-wa:active{transform:translateY(1px)}

/* Voucher (post-pago + detalle de viaje) */
.voucher{width:100%;background:white;border:1px solid rgba(0,0,0,.06);border-radius:16px;overflow:hidden;margin-bottom:20px;text-align:left;box-shadow:0 2px 12px rgba(0,0,0,.04)}
.voucher-sec{padding:16px 18px;border-bottom:1px solid var(--cr)}
.voucher-sec:last-child{border-bottom:none}
.voucher-sec-l{font-size:10px;font-weight:700;color:var(--gy-strong);text-transform:uppercase;letter-spacing:.7px;margin-bottom:10px}
.voucher-tour{font-size:18px;font-weight:800;color:var(--ch);line-height:1.3;margin-bottom:10px}
.voucher-row{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--ch);margin-bottom:6px}
.voucher-row:last-child{margin-bottom:0}
.voucher-row .ic{color:var(--gy);flex-shrink:0;display:inline-flex;align-items:center}
.voucher-note{font-size:11px;color:var(--gy-strong);margin-top:6px;line-height:1.4}
.voucher-link{display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:600;color:var(--tr-text);text-decoration:none;margin-top:8px}
.voucher-link:hover{text-decoration:underline}
.voucher-list{display:flex;flex-direction:column;gap:8px}
.voucher-item{display:flex;align-items:center;gap:10px;font-size:13px;color:var(--ch)}
.voucher-item .vi-ic{width:20px;height:20px;border-radius:50%;background:rgba(45,90,61,.1);color:var(--m);display:flex;align-items:center;justify-content:center;flex-shrink:0}
/* Sin font-style:italic a proposito. Plus Jakarta Sans no trae cara italica
   (el @import pide wght, sin eje ital), asi que hasta la Fase 4 este texto se
   veia RECTO: el font-synthesis:none del bloque .app-demo impedia que el
   navegador la inventara. Al borrar ese bloque, font-synthesis vuelve a auto y
   la cursiva sintetica aparecia a 11px, que se ve mal. Sacarla preserva el
   render que el demo ya tenia. */
.voucher-more{font-size:11px;color:var(--gy-strong);margin-top:8px}
.voucher-cancel{padding:12px 14px;background:var(--cr);border-radius:10px;border-left:3px solid var(--f)}
.voucher-cancel-t{font-size:12px;font-weight:700;color:var(--f);margin-bottom:4px;display:flex;align-items:center;gap:6px}
.voucher-cancel-d{font-size:12px;color:var(--gy-strong)}
.voucher-pay-row{display:flex;justify-content:space-between;align-items:center;padding:6px 0;font-size:13px;color:var(--ch)}
.voucher-pay-row .l{color:var(--gy)}
.voucher-pay-row.total{padding-top:10px;margin-top:6px;border-top:1px solid rgba(0,0,0,.08);font-size:15px;font-weight:800;color:var(--f)}
.voucher-pay-row.total .l{color:var(--ch);font-weight:600}
/* Codigo de reserva: un solo tratamiento en las dos pantallas donde aparece.
   Stack explicito, no la keyword monospace: en Chrome esa keyword arrastra el
   tamano de fuente monoespaciada por defecto y el px declarado no se respeta. */
.voucher-code,.tp-code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-weight:700;letter-spacing:1px;color:var(--ch)}
.voucher-code{font-size:13px;background:var(--cr);padding:5px 9px;border-radius:6px}
.voucher-agency-n{font-size:14px;font-weight:700;color:var(--ch);display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.voucher-verified{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:100px;font-size:10px;font-weight:700;background:rgba(45,90,61,.12);color:var(--m)}
.voucher-agency-d{font-size:11px;color:var(--gy-strong);margin-top:6px;line-height:1.4}
.voucher-wa{display:flex;align-items:center;justify-content:center;gap:6px;font-size:12px;font-weight:600;color:var(--gy);text-decoration:none;padding:14px 8px;text-align:center}
.voucher-wa:hover{color:var(--ch)}
.voucher-wa svg{color:#25D366}

/* Trip detail page */
.tdet-page{padding:16px 16px 100px}
.tdet-back{margin-bottom:8px}
/* Va calificado con .tdet-page a proposito: declarar color no alcanza. Este h2
   compite con .app-demo h2 de index.css (clase + elemento), y .tdet-h sola es
   solo una clase, asi que perdia y heredaba --text-h. En modo oscuro eso lo
   volvia casi blanco sobre el fondo claro del demo. No le bajes la especificidad
   hasta que se limpie ese bloque de index.css. */
.tdet-page .tdet-h{font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-weight:700;font-size:var(--fs-d2);color:var(--ch);margin-bottom:14px}
.tdet-actions{display:flex;flex-direction:column;gap:8px;margin-top:4px}
.tdet-act-prim{padding:13px 16px;border-radius:14px;background:var(--ch);color:white;font-weight:700;font-size:14px;border:none;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px;transition:.2s}
.tdet-act-prim:hover{background:#000}
.tdet-act-sec{padding:13px 16px;border-radius:14px;background:transparent;color:var(--ch);font-weight:600;font-size:13px;border:1.5px solid var(--lg);cursor:pointer;font-family:inherit;transition:.2s}
.tdet-act-sec:hover{border-color:var(--m)}

/* Booking extras */
.login-banner{background:rgba(212,168,67,.14);border:1px solid rgba(212,168,67,.40);color:#8B6914;padding:12px 14px;font-size:13px;font-weight:600;line-height:1.4;border-radius:12px;margin:0 0 16px;display:flex;align-items:flex-start;gap:10px;text-align:left}
.login-banner svg{flex-shrink:0;margin-top:1px;color:var(--gd)}
.inp-err{border-color:#C0392B !important;background:rgba(229,62,62,.04) !important}
.inp-err:focus{box-shadow:0 0 0 4px rgba(229,62,62,.18) !important;border-color:#C0392B !important}
.field-err{font-size:11px;color:#C0392B;margin-top:4px;font-weight:600;display:flex;align-items:center;gap:4px}
/* Bloque de aviso con titulo, explicacion y (opcional) accion. Deliberadamente
   MAS pesado que .field-err: no es un campo mal escrito, es algo que le cambia
   el plan a la persona y que trae la salida. El boton respeta el piso de 44px
   de la Fase 2.

   El nombre describe la FORMA y no el caso, a proposito: nacio para la carrera
   de cupos del checkout y hoy sirve tambien al aviso de solicitudes pendientes
   del formulario de tour. Si aparece un tercer uso, no hay que renombrar. */
.notice{display:flex;flex-direction:column;gap:10px;padding:14px;margin-bottom:12px;border-radius:12px;background:rgba(199,97,58,.08);border-left:3px solid var(--tr-text);text-align:left}
.notice-t{font-size:14px;font-weight:700;color:var(--tr-text)}
.notice-d{font-size:13px;color:var(--ch)}
.notice-b{align-self:flex-start;min-height:44px;padding:0 16px;border-radius:10px;border:1.5px solid var(--tr-text);background:white;color:var(--tr-text);font-family:inherit;font-size:14px;font-weight:700;cursor:pointer}
.bk-phone-row{display:flex;gap:0}
.bk-phone-prefix{display:flex;align-items:center;gap:6px;padding:0 12px;border:2px solid var(--sd);border-radius:14px 0 0 14px;font-size:14px;font-weight:600;background:var(--cr);color:var(--ch);border-right:none;white-space:nowrap}
.bk-phone-prefix .wa-ic{color:#25D366;font-size:16px}
.bk-phone-inp{border-radius:0 14px 14px 0 !important}
.bk-sum-tour{font-weight:700;font-size:15px;padding-bottom:4px}
.bk-sum-meta{font-size:13px;color:var(--gy);padding-bottom:8px;border-bottom:1px solid rgba(0,0,0,.06)}

/* ── Notifs ── */
.npage{padding:20px 0 100px}
.npage-h{display:flex;justify-content:space-between;align-items:center;padding:0 20px 16px}
/* El color es obligatorio, no decorativo: sin el, este h2 hereda --text-h del
   bloque .app-demo de index.css (plantilla de Vite) y en modo oscuro del sistema
   queda casi blanco sobre el fondo claro del demo. Los otros h2 se salvan porque
   ya declaraban color. No lo saques hasta que ese bloque de index.css se limpie. */
.npage-h h2{font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-weight:700;font-size:var(--fs-d2);color:var(--ch)}
.npage-h button{font-size:12px;font-weight:600;color:var(--tr-text);background:none;border:none;cursor:pointer;font-family:inherit}
.ni-item{display:flex;align-items:flex-start;gap:10px;padding:10px 16px;border-bottom:1px solid rgba(0,0,0,.04);cursor:pointer;transition:.15s;position:relative}
.ni-item:hover{background:var(--cr)}
.ni-item.unread{background:rgba(27,58,45,.02)}
.ni-ic{width:32px;height:32px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--f)}
.ni-ic.ai{background:rgba(14,165,233,.1)}.ni-ic.booking{background:rgba(45,90,61,.1)}.ni-ic.reminder{background:rgba(212,168,67,.1)}.ni-ic.promo{background:rgba(199,97,58,.1)}.ni-ic.review{background:rgba(212,168,67,.1)}.ni-ic.quechua{background:rgba(212,168,67,.1)}
.ni-body{flex:1}
.ni-title{font-size:14px;font-weight:700;margin-bottom:3px}
.ni-text{font-size:12px;color:var(--gy-strong);line-height:1.4}
.ni-time{font-size:11px;color:var(--gy-strong);margin-top:4px}
.ni-dot{width:8px;height:8px;border-radius:50%;background:var(--tr);flex-shrink:0;margin-top:6px}

/* ── Trips ── */
.tp-page{padding:20px 16px 120px}
.tp-h{margin-bottom:20px}.tp-h h2{font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-weight:700;font-size:var(--fs-d2);color:var(--ch)}.tp-h p{font-size:14px;color:var(--gy);margin-top:4px}
.tp-tabs{display:flex;gap:6px;margin-bottom:16px}
.tp-tab{padding:10px 16px;border-radius:100px;font-size:13px;font-weight:600;border:1.5px solid var(--sd);background:white;color:var(--gy);cursor:pointer;font-family:inherit;transition:.2s;min-height:44px}
.tp-tab.on{background:var(--f);color:white;border-color:var(--f)}
.tp-card{display:flex;gap:14px;padding:16px;background:white;border-radius:16px;border:1px solid rgba(0,0,0,.06);margin-bottom:10px;cursor:pointer;transition:.2s;width:100%}
.tp-card:hover{box-shadow:0 2px 12px rgba(0,0,0,.08)}
.tp-img{width:100px;height:100px;border-radius:12px;flex-shrink:0}
.tp-info{flex:1;min-width:0}
.tp-name{font-size:15px;font-weight:700;margin-bottom:4px;color:var(--ch)}
.tp-det{font-size:12px;color:var(--gy);margin-bottom:3px}
.tp-code{font-size:11px;margin-bottom:6px}
.tp-foot{display:flex;justify-content:space-between;align-items:center}
.tp-price{font-size:15px;font-weight:800;color:var(--f)}
.tp-st{font-size:10px;font-weight:700;padding:3px 8px;border-radius:100px;text-transform:uppercase}
.tp-upcoming{background:rgba(45,90,61,.1);color:var(--m)}.tp-completed{background:rgba(107,143,113,.15);color:var(--m)}
.tp-rv{padding:10px 16px;background:rgba(212,168,67,.1);border-radius:10px;font-size:13px;font-weight:600;color:#8B6914;margin-bottom:12px;cursor:pointer;text-align:center}

/* ── Reviews ── */
.rev-sec{margin-top:24px;padding-top:24px;border-top:1px solid rgba(0,0,0,.06)}
.rev-hdr{font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-weight:700;font-size:18px;margin-bottom:16px}
.rev-summary{display:flex;gap:20px;align-items:center;margin-bottom:20px;padding:16px;background:var(--cr);border-radius:14px}
.rev-big{text-align:center;min-width:72px}
.rev-big-n{font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-weight:700;font-size:32px;color:var(--f);line-height:1}
.rev-big-stars{color:var(--gd);font-size:12px;margin:4px 0 2px}
.rev-big-cnt{font-size:11px;color:var(--gy-strong)}
.rev-bars{flex:1;display:flex;flex-direction:column;gap:4px}
.rev-bar-row{display:flex;align-items:center;gap:8px;font-size:11px;color:var(--gy-strong)}
.rev-bar-row span:first-child{width:12px;text-align:right}
.rev-bar{flex:1;height:6px;background:var(--sd);border-radius:3px;overflow:hidden}
.rev-bar-fill{height:100%;background:var(--gd);border-radius:3px}
.rev-bar-row span:last-child{width:24px;font-size:10px}
.rev-card{padding:14px 0;border-bottom:1px solid rgba(0,0,0,.05)}
.rev-card:last-child{border-bottom:none}
.rev-top{display:flex;align-items:center;gap:10px;margin-bottom:6px}
.rev-av{width:32px;height:32px;border-radius:50%;background:var(--m);color:white;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0}
.rev-author{font-size:13px;font-weight:600}
.rev-date{font-size:11px;color:var(--gy-strong)}
.rev-stars{color:var(--gd);font-size:12px;margin-bottom:4px}
.rev-text{font-size:13px;line-height:1.6;color:var(--ch)}
.rev-more{width:100%;padding:12px;border:1.5px solid var(--sd);border-radius:12px;background:none;font-size:13px;font-weight:600;color:var(--gy);cursor:pointer;font-family:inherit;margin-top:12px;transition:.2s;min-height:44px}
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
.rv-cancel{padding:12px 16px;border-radius:12px;background:none;border:1.5px solid var(--sd);font-size:13px;font-weight:600;color:var(--gy-strong);cursor:pointer;font-family:inherit}

/* ── Profile ── */
.pf-page{padding-bottom:120px;overflow-x:hidden}
.pf-hdr{padding:24px 20px;text-align:center;border-bottom:1px solid rgba(0,0,0,.06);margin-bottom:20px}
.pf-av{width:72px;height:72px;border-radius:50%;background:var(--f);color:white;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700;margin:0 auto 12px}
.pf-name{font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-weight:700;font-size:19px;margin-bottom:2px}
.pf-since{font-size:12px;color:var(--gy);margin-bottom:16px}
.pf-stats{display:flex;gap:20px;justify-content:center}
.pf-stat{text-align:center}.pf-stat-v{font-size:20px;font-weight:800;color:var(--f)}.pf-stat-l{font-size:10px;color:var(--gy-strong);text-transform:uppercase;letter-spacing:.5px}
.pf-sec{padding:0 20px;margin-bottom:20px}
.pf-sec-t{font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-weight:700;font-size:16px;margin-bottom:12px}
.pf-field{display:flex;justify-content:space-between;align-items:center;padding:14px 0;border-bottom:1px solid rgba(0,0,0,.04)}
.pf-field:last-child{border-bottom:none}.pf-field-l{font-size:12px;color:var(--gy);font-weight:600;text-transform:uppercase;letter-spacing:.5px}.pf-field-v{font-size:14px;font-weight:600}
.pf-mi{display:flex;align-items:center;gap:14px;padding:16px 20px;border-bottom:1px solid rgba(0,0,0,.04);cursor:pointer;transition:.15s}
.pf-mi:hover{background:var(--cr)}
.pf-mi-ic{width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--f)}
.pf-mi-txt{flex:1}.pf-mi-t{font-size:14px;font-weight:600}.pf-mi-d{font-size:11px;color:var(--gy-strong);margin-top:1px}
.pf-logout{margin:20px;padding:14px;border-radius:14px;background:none;border:2px solid var(--tr);color:var(--tr-text);font-weight:700;font-size:14px;cursor:pointer;font-family:inherit;width:calc(100% - 40px);transition:.2s;text-align:center}
.pf-logout:hover{background:var(--tr);color:white}
.pf-ver{text-align:center;padding:16px;font-size:11px;color:var(--gy-strong)}
.pf-op-card{margin:0 20px 20px;padding:18px 20px;background:var(--f);border-radius:14px;color:white;display:flex;align-items:center;justify-content:space-between;cursor:pointer;transition:.2s;min-height:80px}
.pf-op-card:hover{opacity:.9}
/* Placeholder mientras /api/me resuelve si el usuario es agencia: mismo alto
   que la card real, en gris neutro para no afirmar ni negar nada. */
.pf-op-skel{background:var(--cr);cursor:default}
.pf-op-skel:hover{opacity:1}
.pf-skel-b{background:rgba(0,0,0,.07)}
.pf-skel-l{height:13px;border-radius:6px;background:rgba(0,0,0,.07)}
@media (prefers-reduced-motion:no-preference){
  .pf-op-skel .pf-skel-b,.pf-op-skel .pf-skel-l{animation:pfskel 1.2s ease-in-out infinite}
}
@keyframes pfskel{0%,100%{opacity:1}50%{opacity:.55}}
.pf-op-left{display:flex;align-items:center;gap:12px;min-width:0;flex:1}
.pf-op-left>div:last-child{min-width:0;flex:1}
.pf-op-ic{width:40px;height:40px;border-radius:12px;background:rgba(255,255,255,.15);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:white}
.pf-op-title{font-size:14px;font-weight:700;white-space:nowrap}
.pf-op-desc{font-size:11px;opacity:.7;margin-top:1px;text-overflow:ellipsis;overflow:hidden}

/* ═══ DASHBOARD ═══ */
.dsh{padding-bottom:100px}
.dsh-h{padding:20px;background:linear-gradient(135deg,var(--f) 0%,#1a4a35 100%);color:white}
.dsh-gr{font-size:14px;opacity:.8}.dsh-nm{font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-weight:700;font-size:var(--fs-d2);margin:4px 0 6px}
.dsh-sts{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.dsh-s{background:rgba(255,255,255,.12);border-radius:14px;padding:12px;text-align:center}
.dsh-s-v{font-size:22px;font-weight:800}.dsh-s-l{font-size:10px;opacity:.7;text-transform:uppercase;letter-spacing:.5px;margin-top:2px}
.dsh-tabs{display:flex;border-bottom:2px solid var(--sd);padding:0 20px;margin-bottom:16px;overflow-x:auto;scrollbar-width:none}
.dsh-tabs::-webkit-scrollbar{display:none}
.dsh-tab{padding:14px 14px;font-size:12px;font-weight:600;color:var(--gy);cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-2px;white-space:nowrap;background:none;border-top:none;border-left:none;border-right:none;font-family:inherit;transition:.2s;min-height:44px}
.dsh-tab.on{color:var(--f);border-bottom-color:var(--f)}
.dsh-bk{margin:0 0 10px;padding:16px;background:white;border-radius:14px;border:1px solid rgba(0,0,0,.06);display:flex;align-items:center;gap:14px;cursor:pointer;transition:.2s;width:100%}
.dsh-bk:hover{box-shadow:0 1px 3px rgba(0,0,0,.06)}
.dsh-bk-av{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:16px;color:white;flex-shrink:0}
.dsh-bk-i{flex:1;min-width:0}.dsh-bk-n{font-size:14px;font-weight:700}.dsh-bk-d{font-size:12px;color:var(--gy);margin-top:2px}
.dsh-bk-r{text-align:right;flex-shrink:0}.dsh-bk-a{font-size:15px;font-weight:800;color:var(--f)}
.dsh-bk-s{display:inline-block;padding:3px 10px;border-radius:100px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;margin-top:4px}
.st-confirmed{background:rgba(45,90,61,.1);color:var(--m)}.st-pending{background:rgba(212,168,67,.15);color:var(--gd-text)}.st-completed{background:rgba(107,143,113,.15);color:var(--m)}.st-cancelled{background:rgba(199,97,58,.1);color:var(--tr-text)}
/* Salidas agrupadas (panel de la agencia) */
.sal-card{margin:0 0 12px;padding:16px;background:white;border-radius:14px;border:1px solid rgba(0,0,0,.06);text-align:left}
.sal-date{font-size:14px;font-weight:800;color:var(--ch)}
.sal-tour{font-size:12.5px;color:var(--gy-strong);margin-top:2px}
.sal-line{font-size:12.5px;color:var(--ch);margin-top:8px;font-weight:600}
.sal-meta{font-size:12px;color:var(--gy-strong);margin-top:4px}
.sal-actions{display:flex;gap:8px;margin-top:12px}
.sal-btn{flex:1;padding:11px 0;border-radius:12px;font-weight:700;font-size:13px;cursor:pointer;font-family:inherit;border:none;transition:.2s;min-width:0}
.sal-btn.pri{background:var(--f);color:white}
.sal-btn.sec{background:none;border:1.5px solid var(--lg);color:var(--ch)}
.sal-btn:disabled{opacity:.55;cursor:default}
.sal-toggle{display:flex;align-items:center;gap:6px;background:none;border:none;color:var(--f);font-weight:700;font-size:13px;cursor:pointer;font-family:inherit;padding:10px 0 0}
.sal-bk{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 0;border-top:1px solid rgba(0,0,0,.05);cursor:pointer}
.sal-sec-t{font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.8px;color:var(--gy);margin:18px 0 10px}
.sal-q{font-size:13px;font-weight:700;color:var(--ch);margin-bottom:8px}
/* Rechazo de una solicitud suelta: acción secundaria, no compite con las de la salida. */
.sal-bk-rej{display:block;margin:0 0 10px auto;padding:2px 0;background:none;border:none;color:var(--gy);font-size:12px;font-weight:700;text-decoration:underline;cursor:pointer;font-family:inherit}
/* La pregunta se lee como parte de SU fila, no como un bloque suelto al final
   de la card: borde izquierdo + fondo suave la atan a la reserva de arriba. */
.sal-bk-q-box{margin:0 0 12px;padding:10px 12px;border-left:3px solid var(--tr);background:var(--cr);border-radius:0 10px 10px 0}
.sal-bk-q{font-size:12.5px;font-weight:700;color:var(--ch);margin-bottom:9px}
/* Botones deliberadamente más chicos que los de la salida (que son flex:1,
   13px, padding 11px): el alcance de la acción es menor y se tiene que ver. */
.sal-bk-actions{display:flex;gap:8px}
.sal-bk-actions .sal-btn{flex:0 0 auto;padding:7px 14px;font-size:12px;border-radius:9px}
/* Cuenta regresiva para confirmar: gris → oro (suave) → terracota (fuerte).
   El oro va oscurecido respecto de --gd para tener contraste sobre blanco. */
.sal-plazo.soft{color:#8A6A12;font-weight:700}
.sal-plazo.hard{color:var(--tr-text);font-weight:800}
/* Aviso informativo de reglas dentro del bloque de confirmación manual. */
.sale-note{margin-top:-4px;margin-bottom:16px;padding:11px 13px;border-radius:10px;background:var(--cr);color:var(--ch);font-size:11.5px}

/* AI Content Creator */
.ai-cc{margin:0 0 16px 0;padding:20px;background:linear-gradient(135deg,rgba(45,90,61,.06),rgba(45,90,61,.02));border:1.5px solid rgba(45,90,61,.15);border-radius:16px}
.ai-cc-h{display:flex;align-items:center;gap:8px;margin-bottom:12px}
.ai-cc-h span{font-size:18px}
.ai-cc-h h3{font-size:15px;font-weight:700;color:var(--f)}
.ai-cc-desc{font-size:12px;color:var(--gy);margin-bottom:14px}
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
.biz-badge.pending{background:rgba(212,168,67,.15);color:var(--gd-text)}
.biz-badge.no{background:rgba(199,97,58,.1);color:var(--tr-text)}
.biz-note{font-size:12px;color:var(--gy-strong);padding:12px;background:var(--cr);border-radius:10px;margin-top:12px}
.biz-radio{display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap}
.biz-radio label{display:flex;align-items:center;gap:6px;padding:10px 16px;border-radius:10px;border:2px solid var(--sd);cursor:pointer;font-size:13px;font-weight:600;transition:.2s}
.biz-radio label.on{border-color:var(--f);background:rgba(45,90,61,.04)}
.biz-doc{display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid rgba(0,0,0,.04)}
.biz-doc:last-child{border-bottom:none}
.biz-doc-name{font-size:13px;font-weight:600;color:var(--ch)}
.biz-doc-r{display:flex;align-items:center;gap:8px}
.biz-doc-btn{padding:6px 12px;border-radius:8px;border:1.5px solid var(--sd);background:white;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;color:var(--gy-strong);transition:.2s}
.biz-doc-btn:hover{border-color:var(--m);color:var(--f)}
.biz-saved{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:var(--m);margin-top:8px}

.earn-tot{margin:0 0 12px;padding:20px;background:var(--f);color:white;border-radius:14px;display:flex;justify-content:space-between;align-items:center;width:100%;box-sizing:border-box}
.earn-chart{margin:0 0 20px;padding:20px;background:white;border-radius:14px;border:1px solid rgba(0,0,0,.06);width:100%;box-sizing:border-box}
.earn-bars{display:flex;align-items:flex-end;gap:12px;height:140px;margin-top:16px}
.earn-bg{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px}
.earn-bc{width:100%;display:flex;gap:3px;align-items:flex-end;height:120px}
.earn-b{flex:1;border-radius:4px 4px 0 0;transition:height .5s;min-height:2px}
.earn-bl{font-size:10px;font-weight:600;color:var(--gy-strong)}
.earn-leg{display:flex;gap:16px;margin-top:16px;padding-top:12px;border-top:1px solid var(--sd)}
.earn-li{display:flex;align-items:center;gap:6px;font-size:11px;color:var(--gy-strong)}.earn-dt{width:8px;height:8px;border-radius:3px}
.earn-rows{margin:0;display:flex;flex-direction:column;gap:8px;width:100%}
.earn-row{display:flex;justify-content:space-between;align-items:center;padding:14px 16px;background:white;border-radius:14px;border:1px solid rgba(0,0,0,.04);width:100%;box-sizing:border-box}

/* ══ DESKTOP NAV LINKS (hidden on mobile) ═══════════ */
.tn-links{display:none;gap:2px;align-items:center}
.tn-link{padding:8px 16px;border-radius:10px;font-size:14px;font-weight:600;color:var(--gy);background:none;border:none;cursor:pointer;font-family:inherit;transition:.2s;position:relative;min-height:44px}
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
  .hero-t{max-width:500px}
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

  /* Notificaciones: dropdown anclado a la campana (mobile usa bottom sheet) */
  .notif-backdrop{background:transparent}
  .notif-sheet{position:absolute;left:auto;right:0;bottom:auto;top:calc(100% + 6px);width:340px;max-height:min(70vh,420px);border-radius:14px;padding:8px 0;animation:fadeUp .15s ease-out;box-shadow:0 10px 32px rgba(0,0,0,.15);border:1px solid var(--sd)}
  .notif-sheet-grip{display:none}
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
  .hero-t{max-width:700px;text-align:center}
  .hero-sub{text-align:center;font-size:16px}

  .home-pg{margin-top:-40px;position:relative;z-index:10}
  .home-pg .ai-sb{margin-bottom:40px;background:white;border-radius:50px;
                  box-shadow:0 8px 48px rgba(0,0,0,.16);padding:0}
  .home-pg .ai-sb input{border:none;border-radius:50px;padding:18px 56px;
                         font-size:16px;height:60px}
  .home-pg .ai-sb input:focus{border:none;box-shadow:none}
  .home-pg .ai-sb .ai-sb-ic{left:22px;font-size:18px}
  .home-pg .ai-sb .ai-sb-tag{right:22px}

  .cats{padding:0 0 28px}

  .tscr{grid-template-columns:repeat(4,1fr);gap:20px;padding:0 0 40px}

  .sh{margin-bottom:24px}
  /* .st y .gc-t ya no declaran tamano aca: lo manda el token, que tiene su
     propio escalon de escritorio. Ver la Fase 6A, paso 2. */

  .tg{grid-template-columns:repeat(3,1fr);gap:24px;padding:0 0 48px}
  .gc:hover{transform:translateY(-5px);box-shadow:0 16px 40px rgba(0,0,0,.1)}
  .gc-img{height:200px}

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
  .det-hero .det-tl{font-size:34px;max-width:92%}
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

// Popover de notificaciones anclado a la campana (espeja CitySelector):
// bottom-sheet en mobile, dropdown anclado a la derecha en desktop. La campana
// TOGGLEA el popover (ya no navega). La página full-page (NotifsView) sigue
// disponible como fallback vía el Footer.
function NotifBell({ notifs, unread, onSelect, onMarkAll }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const sheetRef = useRef(null);
  // En mobile (<640px) el sheet se portaliza a document.body para escapar el
  // containing block que crea el backdrop-filter de .tn (rompería el fixed).
  const [isMobile, setIsMobile] = useState(() => window.matchMedia("(max-width:639px)").matches);

  useEffect(() => {
    const mq = window.matchMedia("(max-width:639px)");
    const update = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    const onClick = (e) => {
      const t = e.target;
      // El sheet puede vivir fuera del wrapper (portal en mobile): chequear ambos.
      if (ref.current && ref.current.contains(t)) return;
      if (sheetRef.current && sheetRef.current.contains(t)) return;
      setOpen(false);
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

  // Abrir el popover ya NO marca nada: los puntos de las no leídas quedan
  // visibles. Cada notif baja su punto al clickearla (handleNotifSelect →
  // markNotifsSeen([id])); "Marcar todo" baja todas de una.
  const handleSelect = (n) => { onSelect(n); setOpen(false); };
  // Marcar todas como leídas + cerrar el popover.
  const handleMarkAll = () => { onMarkAll(); setOpen(false); };

  const popover = (
    <>
      <div className="notif-backdrop" onClick={() => setOpen(false)} />
      <div className="notif-sheet" ref={sheetRef} role="dialog" aria-label="Notificaciones">
        <div className="notif-sheet-grip" />
        <div className="notif-sheet-h">
          <span className="notif-sheet-title">Notificaciones</span>
          <button type="button" className="notif-sheet-mark" onClick={handleMarkAll}>Marcar todo como leído</button>
        </div>
        <div className="notif-sheet-list">
          <NotifList notifs={notifs} onSelect={handleSelect} />
        </div>
      </div>
    </>
  );

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        className="tn-btn"
        onClick={() => setOpen((v) => !v)}
        aria-label={unread > 0 ? `Notificaciones, ${unread} sin leer` : "Notificaciones"}
        aria-haspopup="dialog"
        aria-expanded={open}
        type="button"
      >
        {unread > 0 && <span className="ndot" />}
        <Bell size={18} strokeWidth={1.5} />
      </button>
      {open && (isMobile ? createPortal(popover, document.body) : popover)}
    </div>
  );
}

function TopNav({ onHome, onDash, notifs, unread, onNotifSelect, onMarkAll, view, isOperator, operatorResolved, navActive, onNavClick }) {
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
          {[{id:"explore",l:"Explorar"},{id:"search",l:"Buscar"},{id:"trips",l:"Mis reservas"}].map(i => (
            <button key={i.id} className={`tn-link ${navActive===i.id?"on":""}`} onClick={() => onNavClick(i.id)}>{i.l}</button>
          ))}
        </div>
        <div className="tn-r">
          <button className={`tn-btn ${view === "dashboard" ? "on" : ""}`} onClick={onDash} aria-label={view === "dashboard" || view === "new-tour" ? "Inicio" : "Dashboard"} type="button" style={{ visibility: operatorResolved && isOperator ? 'visible' : 'hidden' }}>{view === "dashboard" || view === "new-tour" ? <Home size={18} strokeWidth={1.5} /> : <BarChart3 size={18} strokeWidth={1.5} />}</button>
          <NotifBell notifs={notifs} unread={unread} onSelect={onNotifSelect} onMarkAll={onMarkAll} />
          <button className="tn-btn tn-profile" onClick={() => onNavClick("profile")} aria-label="Perfil" type="button"><User size={18} strokeWidth={1.5} /></button>
        </div>
      </div>
    </div>
  );
}

function BNav({ active, go }) {
  return (
    <nav className="bn" aria-label="Navegación principal">
      {[{ id: "explore", ic: Compass, l: "Explorar" }, { id: "search", ic: Search, l: "Buscar" }, { id: "trips", ic: Ticket, l: "Mis reservas" }, { id: "profile", ic: User, l: "Perfil" }].map((i) => (
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
            <div className="site-footer-tagline">Tours con agencias verificadas en todo el Perú.</div>
          </div>
          <div className="site-footer-col">
            <div className="site-footer-col-t">Explorar</div>
            <button onClick={() => go("home")}>Inicio</button>
            <button onClick={() => go("catalog")}>Buscar tours</button>
            <button onClick={() => go("trips")}>Mis reservas</button>
            <button onClick={() => go("notifications")}>Notificaciones</button>
          </div>
          <div className="site-footer-col">
            <div className="site-footer-col-t">Empresa</div>
            <button>Sobre Finde</button>
            <button>Para agencias</button>
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
  const hasReviews = t.reviews > 0;
  return (
    <div className="tc" onClick={onClick}>
      <div className="tc-img" style={imgBg(t.image)}>
        {t.verified && <span className="tc-ver"><Check size={12} strokeWidth={2} /> Finde Verificado</span>}
      </div>
      <div className="tc-b">
        <div className="tc-loc">{t.location}</div>
        <div className="tc-tl">{t.title}</div>
        <div className="tc-m">
          {hasReviews ? (
            <><span className="rt"><Star size={12} strokeWidth={1.5} fill="currentColor" /> {t.rating}</span><span>({t.reviews})</span></>
          ) : (
            <span className="rt">Nuevo</span>
          )}
          {t.duration && <><span>·</span><span>{t.duration}</span></>}
        </div>
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
        {t.verified && <span className="gc-ver"><Check size={10} strokeWidth={2} /> Finde Verificado</span>}
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
        <div className="gc-p">S/ {t.price} <span>por persona</span></div>
      </div>
    </div>
  );
}

// Traduce los errores de Supabase Auth a algo que el viajero entienda. Vive a
// nivel de módulo porque lo usan los DOS lados que muestran el formulario: la
// pantalla de login y el modal de cuenta.
function translateAuthError(message) {
  const m = (message || "").toLowerCase();
  if (m.includes("invalid login credentials")) return "Email o contraseña incorrectos.";
  if (m.includes("already registered")) return "Ya existe una cuenta con ese email. Intenta iniciar sesión.";
  if (m.includes("email not confirmed")) return "Confirma tu email antes de iniciar sesión.";
  if (m.includes("password should be at least")) return "La contraseña debe tener al menos 6 caracteres.";
  if (m.includes("rate limit") || m.includes("too many")) return "Demasiados intentos. Espera un momento.";
  if (m.includes("invalid email") || m.includes("not a valid email")) return "Email inválido.";
  return "No pudimos completar la operación. Intenta de nuevo.";
}

// El formulario de correo y contraseña, solo, y SIN NAVEGAR.
//
// Está extraído a propósito. LoginView terminaba con go("home") o
// go("welcome"), y el modal de cuenta necesita exactamente lo contrario: que el
// viajero se quede donde estaba, con su fecha y sus cupos. Reusar LoginView tal
// cual lo habría sacado del flujo de reserva.
//
// `mode` viene de afuera porque la pantalla de login muestra un título que
// depende de él ("Inicia sesión" contra "Crea tu cuenta") y el modal no: el
// modal ya tiene su propio encabezado y repetirlo sería decir dos veces lo
// mismo. Ese título entra por `heading`, entre las pestañas y los campos, que
// es donde estaba. onSuccess({ isSignIn }) decide qué pasa después, y es lo
// único que cambia entre los dos usos.
// El modo "recuperar" es un TERCER modo del mismo formulario, y no una ruta, a
// proposito. AuthForm lo renderizan LoginView y AccountModal: en el login
// navegar estaria bien, pero en el modal navegar es romperlo, porque el modal
// existe justamente para que el viajero no se vaya del checkout. Un modo
// interno funciona igual en los dos lados con un solo cambio.
function AuthForm({ mode, onModeChange, onSuccess, heading = null }) {
  const { signInWithPassword, signUpWithPassword, resetPasswordForEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [busy, setBusy] = useState(false);

  const isRecuperar = mode === "recuperar";
  const isSignIn = mode === "signin";
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const validPassword = password.length >= 6;
  const canSubmit = !busy && validEmail && (isRecuperar || validPassword);

  async function handleRecuperar() {
    if (!canSubmit) return;
    setError("");
    setAviso("");
    setBusy(true);
    // La URL absoluta se arma con toPath() y NUNCA escribiendo "/demo" a mano:
    // es la regla de src/lib/routes.js, y es lo que hace que el dia del switch
    // siga siendo el cambio de una linea.
    const destino = `${window.location.origin}${toPath("reset-password")}`;
    const { error: authError } = await resetPasswordForEmail(email.trim(), destino);
    setBusy(false);
    if (authError) {
      setError(translateAuthError(authError.message));
      return;
    }
    // Respuesta IGUAL exista o no la cuenta: si dijera "ese correo no existe",
    // cualquiera podria averiguar quien tiene cuenta en Finde probando correos.
    setAviso("Si ese correo tiene una cuenta en Finde, te mandamos un enlace para cambiar la contraseña. Revisa tu bandeja y también el spam.");
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    setError("");
    setAviso("");
    setBusy(true);
    const fn = isSignIn ? signInWithPassword : signUpWithPassword;
    const { data, error: authError } = await fn({ email: email.trim(), password });
    setBusy(false);
    if (authError) {
      setError(translateAuthError(authError.message));
      return;
    }
    // Alta SIN sesión de vuelta = "Confirm email" está prendido en Supabase.
    // Hoy está APAGADO (mailer_autoconfirm), así que este camino no corre; la
    // guarda existe para el día que se reactive, que es un pendiente de
    // lanzamiento anotado en docs/pendientes-producto.md. Sin ella, onSuccess
    // avanzaría el checkout con el viajero todavía sin sesión y el POST moriría
    // con 401 tres pantallas después, sin explicar nada.
    if (!isSignIn && data && !data.session) {
      setAviso("Te enviamos un correo para confirmar tu cuenta. Ábrelo y vuelve aquí para continuar.");
      return;
    }
    onSuccess({ isSignIn });
  }

  function toggleMode() {
    onModeChange(isSignIn ? "signup" : "signin");
    setError("");
    setAviso("");
  }

  function irA(m) {
    onModeChange(m);
    setError("");
    setAviso("");
  }

  return (
    <>
      {!isRecuperar && (
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
      )}

      {heading}

      <input
        className="login-input"
        type="email"
        autoComplete="email"
        placeholder="tucorreo@ejemplo.com"
        value={email}
        onChange={(e) => { setEmail(e.target.value); if (error) setError(""); }}
        style={{ marginBottom: 10 }}
      />

      {!isRecuperar && (
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
      )}

      {isSignIn && (
        <div style={{ textAlign: "right", marginBottom: 12, marginTop: -2 }}>
          <button
            type="button"
            onClick={() => irA("recuperar")}
            style={{ background: "transparent", border: 0, padding: 0, cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600, color: "var(--tr-text)", textDecoration: "underline" }}
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>
      )}

      {error && (
        <div className="login-banner" style={{ background: "rgba(199,97,58,0.12)", color: "#C7613A" }}>
          {error}
        </div>
      )}
      {aviso && (
        <div className="login-banner" role="status">
          <Info size={16} strokeWidth={2} aria-hidden="true" />
          <span>{aviso}</span>
        </div>
      )}

      <button
        className="login-btn"
        disabled={!canSubmit}
        onClick={isRecuperar ? handleRecuperar : handleSubmit}
      >
        {busy ? "..." : isRecuperar ? "Enviar enlace" : isSignIn ? "Entrar" : "Crear cuenta"}
      </button>

      {isRecuperar && (
        <button
          type="button"
          onClick={() => irA("signin")}
          style={{ background: "transparent", border: 0, padding: "10px 0 0", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600, color: "var(--gy-strong)", width: "100%" }}
        >
          Volver a iniciar sesión
        </button>
      )}
    </>
  );
}

// Una sola definición del texto legal. Lo muestran la pantalla de login y el
// modal de cuenta, y tienen que decir lo mismo: si vive en dos lugares, tarde o
// temprano dicen cosas distintas.
function TermsLine({ style }) {
  return (
    <div className="login-terms" style={style}>
      Al continuar, aceptas los <a href="#">Términos de uso</a> y la <a href="#">Política de privacidad</a> de Finde
    </div>
  );
}

// Por qué se pide la cuenta, según por dónde entró el viajero. El copy dice el
// MOTIVO y no solo pide: alguien a quien esto le aparece en el medio de una
// reserva tiene que entender qué gana y, sobre todo, que no pierde lo que ya
// eligió.
const ACCOUNT_REASONS = {
  booking: {
    motivo: "Para reservar necesitas una cuenta. Ahí queda tu reserva, con su código y los datos de la agencia.",
    calma: "No pierdes la fecha ni los cupos que elegiste.",
  },
  trips: {
    motivo: "Tus reservas viven en tu cuenta. Inicia sesión y las tienes todas aquí, con su código y su voucher.",
    calma: null,
  },
  profile: {
    motivo: "Tu perfil vive en tu cuenta. Y si tienes una agencia de turismo, desde ahí activas tu panel.",
    calma: null,
  },
  notifications: {
    // "Salida" es como la agencia ve la fecha en su panel. El viajero hizo una
    // RESERVA, y ese es el vocabulario que le toca (mismo criterio que
    // "confirmación automática" en vez de "cupo fijo", ver
    // .claude/rules/reservas.md).
    motivo: "Tus avisos viven en tu cuenta. Ahí te avisamos cuando la agencia confirma tu reserva.",
    calma: null,
  },
  default: {
    motivo: "Esta parte de Finde es tuya, así que necesitas una cuenta para verla.",
    calma: null,
  },
};

// El modal de cuenta. UNO SOLO para los tres puntos de entrada: el checkout,
// "Mis reservas" y "Perfil". Se escribe una vez y se pide la cuenta siempre
// igual, en vez de un modal por un lado y una pantalla completa por el otro.
//
// Va montado dentro de .app, no portalizado: ver el comentario del CSS.
function AccountModal({ reason, onClose, onSuccess }) {
  const [mode, setMode] = useState("signin");
  const r = ACCOUNT_REASONS[reason] || ACCOUNT_REASONS.default;

  // onClose en un ref. El modal se abre desde dos lados (un click o la URL) y
  // cada uno pasa un handler distinto, así que exigir que sean estables para
  // que el efecto de abajo no se re-suscriba sería una condición escondida
  // sobre quien lo usa. Con el ref, el efecto corre UNA vez y siempre llama al
  // handler vigente.
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onCloseRef.current(); };
    window.addEventListener("keydown", onKey);
    // El fondo no scrollea mientras el modal está abierto: en el checkout,
    // debajo hay un calendario y perder la posición al cerrar sería justo lo
    // que este modal viene a evitar.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <>
      <div className="acc-backdrop" onClick={onClose} />
      <div className="acc-modal" role="dialog" aria-modal="true" aria-labelledby="acc-modal-t">
        <button type="button" className="acc-close" onClick={onClose} aria-label="Cerrar">
          <X size={18} strokeWidth={1.5} />
        </button>
        <div className="acc-modal-h">
          {/* "Inicia sesión o regístrate", nunca "Crea tu cuenta": no presume
              que el viajero sea nuevo. Quien ya tiene cuenta no tiene que leer
              una invitación a crear otra. */}
          <div className="acc-t" id="acc-modal-t">Inicia sesión o regístrate</div>
          <div className="acc-d">{r.motivo}</div>
          {r.calma && (
            <div className="acc-calma">
              <Lock size={14} strokeWidth={1.5} /> {r.calma}
            </div>
          )}
        </div>
        <AuthForm mode={mode} onModeChange={setMode} onSuccess={onSuccess} />
        <TermsLine style={{ marginTop: 4, paddingTop: 4 }} />
      </div>
    </>
  );
}

// La pantalla donde se elige la contraseña nueva. Solo se llega por el enlace
// del correo.
//
// LO QUE HAY QUE ENTENDER ANTES DE TOCARLA: el enlace del correo ES UN INICIO
// DE SESIÓN. Supabase le crea sesión al usuario y dispara PASSWORD_RECOVERY
// (ver el comentario de recoveryMode en AuthContext). Por eso esta pantalla NO
// se protege con "no hay sesión", que es lo intuitivo y sería siempre falso:
// se protege con recoveryMode.
//
// Los cuatro estados posibles están medidos, no supuestos (2026-08-19, contra
// @supabase/auth-js 2.104.1 y pegándole al endpoint de verificación con un
// token inválido, sin mandar correos):
//
//   1. Enlace vencido o ya usado -> el hash trae error_code=otp_expired y el
//      cliente NO lo limpia, así que se puede leer.
//   2. Enlace válido, evento todavía sin llegar -> el cliente limpia el hash y
//      emite PASSWORD_RECOVERY en un setTimeout(0), o sea DESPUÉS de que esta
//      pantalla montó. Sin el estado "verificando" echaríamos al usuario justo
//      en el caso bueno.
//   3. Enlace válido, evento llegado -> el formulario.
//   4. Alguien entró a la URL de memoria, sin enlace -> no hay nada que hacer.
//
// BORDE CONOCIDO Y ACEPTADO: si el usuario RECARGA esta pantalla, el hash ya no
// está y PASSWORD_RECOVERY no se vuelve a emitir (la sesión se restaura desde
// el storage como una sesión normal), así que cae en el caso 4 y tiene que
// pedir otro enlace. Es el fallo seguro: molesta, pero no deja a nadie creyendo
// que cambió una contraseña que no cambió.
function ResetPasswordView({ go }) {
  const { recoveryMode, recoveryPending, recoveryLinkError, updatePassword, endRecovery } = useAuth();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [listo, setListo] = useState(false);
  const [draft] = useState(() => readBookingDraft());

  const valido = password.length >= 6;

  async function guardar() {
    if (!valido || busy) return;
    setError("");
    setBusy(true);
    const { error: authError } = await updatePassword(password);
    setBusy(false);
    if (authError) {
      setError(translateAuthError(authError.message));
      return;
    }
    endRecovery();
    setListo(true);
  }

  const marco = (titulo, cuerpo) => (
    <div className="bkf fu">
      <div className="bkf-t" style={{ marginBottom: 6 }}>{titulo}</div>
      {cuerpo}
    </div>
  );

  if (listo) {
    return marco("Listo, tu contraseña quedó cambiada", (
      <>
        <div className="bkf-sub" style={{ marginBottom: 20 }}>
          Ya puedes usarla para entrar. Tu sesión de ahora sigue abierta.
        </div>
        {draft?.path ? (
          <button className="mbtn" onClick={() => { window.location.assign(draft.path); }}>
            Volver a tu reserva
          </button>
        ) : (
          <button className="mbtn" onClick={() => go("home")}>Ir al inicio</button>
        )}
      </>
    ));
  }

  if (recoveryLinkError) {
    return marco("Ese enlace ya no sirve", (
      <>
        <div className="bkf-sub" style={{ marginBottom: 20 }}>
          Los enlaces para cambiar la contraseña vencen, y también dejan de
          funcionar después de usarlos una vez. Pide uno nuevo y vuelve a
          intentarlo.
        </div>
        <button className="mbtn" onClick={() => go("login")}>Pedir un enlace nuevo</button>
      </>
    ));
  }

  if (recoveryPending) {
    return marco("Verificando el enlace…", (
      <div className="bkf-sub">Un segundo.</div>
    ));
  }

  if (!recoveryMode) {
    return marco("Aquí no hay nada que cambiar", (
      <>
        <div className="bkf-sub" style={{ marginBottom: 20 }}>
          A esta pantalla se llega desde el enlace que te mandamos por correo.
          Si quieres cambiar tu contraseña, pide el enlace desde el inicio de
          sesión.
        </div>
        <button className="mbtn" onClick={() => go("login")}>Ir a iniciar sesión</button>
      </>
    ));
  }

  return marco("Elige tu contraseña nueva", (
    <>
      <div className="bkf-sub" style={{ marginBottom: 16 }}>
        Mínimo 6 caracteres. Al guardarla, esta pantalla se cierra sola.
      </div>
      <div style={{ position: "relative", marginBottom: 12 }}>
        <input
          className="login-input"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          placeholder="Contraseña nueva (mínimo 6 caracteres)"
          value={password}
          onChange={(e) => { setPassword(e.target.value); if (error) setError(""); }}
          onKeyDown={(e) => { if (e.key === "Enter" && valido) guardar(); }}
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
      <button className="mbtn" disabled={!valido || busy} onClick={guardar}>
        {busy ? "..." : "Guardar contraseña"}
      </button>
      {draft?.date && (
        <div className="bkf-sub" style={{ marginTop: 14, fontSize: 13 }}>
          Tu reserva quedó guardada: al terminar puedes volver a ella.
        </div>
      )}
    </>
  ));
}

function LoginView({ go, loginMsg, onGuest }) {
  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const isSignIn = mode === "signin";

  return (
    <div className="login fu">
      <div className="login-hero">
        <div className="login-hero-tex" />
        <div className="login-hero-logo">finde<span>.</span></div>
        <div className="login-hero-tagline">El marketplace de tours para descubrir el Perú</div>
        <div className="login-hero-stat">
          <div className="login-hero-stat-i"><div className="login-hero-stat-v">Agencias</div><div className="login-hero-stat-l">verificadas</div></div>
          <div className="login-hero-stat-i"><div className="login-hero-stat-v">Pago</div><div className="login-hero-stat-l">protegido</div></div>
          <div className="login-hero-stat-i"><div className="login-hero-stat-v">Búsqueda</div><div className="login-hero-stat-l">con IA</div></div>
        </div>
      </div>
      <div className="login-body">
        {loginMsg && (
          <div className="login-banner" role="status">
            <Info size={16} strokeWidth={2} aria-hidden="true" />
            <span>{loginMsg}</span>
          </div>
        )}

        {/* El título depende del modo y va entre las pestañas y los campos, por
            eso `mode` vive acá y entra al formulario como `heading`. El modal
            no lo pasa: ya tiene su propio encabezado. */}
        <AuthForm
          mode={mode}
          onModeChange={setMode}
          onSuccess={({ isSignIn: entro }) => go(entro ? "home" : "welcome")}
          heading={
            <>
              <div className="login-title">
                {mode === "recuperar" ? "Recupera tu contraseña" : isSignIn ? "Inicia sesión" : "Crea tu cuenta"}
              </div>
              <div className="login-sub">
                {mode === "recuperar"
                  ? "Escribe tu correo y te mandamos un enlace para elegir una nueva"
                  : isSignIn
                  ? "Ingresa con tu email y contraseña"
                  : "Regístrate con email y contraseña para empezar"}
              </div>
            </>
          }
        />

        <div className="login-divider">o</div>
        <button className="login-skip" onClick={onGuest}>Explorar sin cuenta</button>

        {/* TODO(M1 sub-paso 8): enlace "¿Eres agencia de turismo?" para onboarding de operador. */}

        <TermsLine />
      </div>
    </div>
  );
}

function WelcomeView({ go }) {
  return (
    <div className="welcome fu">
      <div className="welcome-check"><Check size={24} strokeWidth={2.5} /></div>
      {/* Sin nombre: el registro solo pide email, así que no hay nombre real
          que saludar (el mock USER era un residuo pre-auth). */}
      <div className="welcome-title">¡Bienvenido a Finde!</div>
      <div className="welcome-sub">Tu cuenta está lista. Esto es lo que puedes hacer en Finde:</div>
      <div className="welcome-features">
        <div className="welcome-feat"><div className="welcome-feat-ic" style={{ background: "rgba(45,90,61,.1)" }}><Search size={20} strokeWidth={1.5} /></div><div className="welcome-feat-txt">Buscar tours con inteligencia artificial</div></div>
        {/* El pago sigue al flag maestro, como el resto de la copy de pago
            (ver BookingView): con el flujo demo el pago pasa por Finde; en el
            piloto se coordina con la agencia por WhatsApp. */}
        {DEMO_PAYMENT_FLOW
          ? <div className="welcome-feat"><div className="welcome-feat-ic" style={{ background: "rgba(45,90,61,.1)" }}><ShieldCheck size={20} strokeWidth={1.5} /></div><div className="welcome-feat-txt">Tu pago protegido por Finde hasta completar el tour</div></div>
          : <div className="welcome-feat"><div className="welcome-feat-ic" style={{ background: "rgba(107,42,160,.1)" }}><Heart size={20} strokeWidth={1.5} /></div><div className="welcome-feat-txt">Coordina y paga con la agencia por WhatsApp</div></div>}
        <div className="welcome-feat"><div className="welcome-feat-ic" style={{ background: "rgba(37,211,102,.1)" }}><MessageCircle size={20} strokeWidth={1.5} /></div><div className="welcome-feat-txt">Recibir confirmaciones por WhatsApp</div></div>
        <div className="welcome-feat"><div className="welcome-feat-ic" style={{ background: "rgba(212,168,67,.1)" }}><Languages size={20} strokeWidth={1.5} /></div><div className="welcome-feat-txt">Tours disponibles en quechua</div></div>
      </div>
      <button className="login-btn" onClick={() => go("home")}>Empezar a explorar</button>
    </div>
  );
}

function CitySelector({ selectedDept, opciones, onPick }) {
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
      {/* El nombre accesible dice que esto CAMBIA algo. Sin él, el lector de
          pantalla anunciaba solo "Lima", que suena a etiqueta y no a control, y
          es justo el control que el viajero necesita cuando la ciudad elegida
          no es la suya. */}
      <button
        type="button"
        className={`city-btn ${open ? "open" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Cambiar ciudad, ahora ${displayName(selectedDept)}`}
      >
        <MapPin size={14} strokeWidth={1.5} />
        {displayName(selectedDept)}
        <ChevronDown className="city-btn-chev" size={14} strokeWidth={1.5} />
      </button>
      {open && (
        <>
          <div className="city-backdrop" onClick={() => setOpen(false)} />
          <div className="city-sheet" role="listbox" aria-label="Elegir ciudad">
            <div className="city-sheet-grip" />
            <div className="city-sheet-title">Elige tu ciudad</div>
            {opciones.map((c) => (
              <button
                key={c}
                type="button"
                role="option"
                aria-selected={c === selectedDept}
                className={`city-sheet-opt ${c === selectedDept ? "on" : ""}`}
                onClick={() => handlePick(c)}
              >
                <span>{displayName(c)}</span>
                {c === selectedDept && (
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

function HomeView({ go, cat, setCat, tours, toursLoading, selectedDept, setSelectedDept, yaEligio, sugerenciaCambio }) {
  const [cityExpanded, setCityExpanded] = useState(false);
  const filt = cat === "all" ? tours : tours.filter((t) => t.category === cat);
  // Destacados: los 4 más recientes (createdAt desc). Antes ordenaba por rating,
  // pero sin ratings fabricados eso queda plano (todos en 0).
  const feat = [...filt].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")).slice(0, 4);
  // Todos los tours de la ciudad ordenados por recencia (createdAt desc).
  // Renderizamos siempre todos: en mobile el .tscr es carrusel horizontal y
  // muestra todos por swipe natural. En ≥640px el CSS oculta las cards 5+
  // cuando .city-tscr no tiene la clase .expanded.
  // Los departamentos que se ofrecen salen de los tours que EXISTEN, no de una
  // lista escrita a mano. Ver lib/cities.js: una lista a mano quedaba corta cada
  // vez que entraba una agencia nueva, y con 42 tours ya dejaba siete afuera.
  const deptsConTours = departmentsWithTours(tours);
  const allCityTours = toursByDepartment(filt, selectedDept)
    .slice()
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  // Cambiar de ciudad colapsa la sección para que el usuario no aterrice
  // expandido en una ciudad nueva. Aplica tanto al CitySelector como al
  // botón "Ver tours en Lima" del empty state.
  const handleCityChange = (c) => {
    setCityExpanded(false);
    setSelectedDept(c);
  };
  return (
    <div>
      <div className="hero fu"><div className="hero-tex" /><div className="hero-c">
        <div><div className="hero-tag"><Sparkles size={12} strokeWidth={1.5} style={{display:"inline",verticalAlign:"middle",marginRight:4}} />PRÓXIMO FERIADO LARGO · 28-29 JUL</div></div>
        <div><div className="hero-t">Descubre el Perú que no conoces</div><div className="hero-sub">Agencias formales y verificadas en todo el Perú</div></div>
      </div></div>
      <div className="home-pg pg">
        <div className="ai-sb fd1">
          <span className="ai-sb-ic"><Search size={16} strokeWidth={1.5} /></span>
          <input placeholder="Ej: algo tranquilo cerca de Lima" readOnly onFocus={() => go("catalog")} />
          <span className="ai-sb-tag"><Sparkles size={12} strokeWidth={1.5} /> IA</span>
        </div>
        <div className="cats fd2">{CATS.map((c) => <button key={c.id} className={`chip ${cat === c.id ? "on" : ""}`} onClick={() => setCat(c.id)}><c.ic size={16} strokeWidth={1.5} /> {c.n}</button>)}</div>
        <div className="sh fd2"><div className="st">Recién publicados</div><button className="sl" onClick={() => go("catalog")}>Ver todos <ArrowRight size={12} strokeWidth={1.5} style={{verticalAlign:"middle"}} /></button></div>
        <div className="tscr fd3">{toursLoading ? Array.from({ length: 4 }).map((_, i) => <TCardSkeleton key={i} />) : feat.map((t) => <TCard key={t.id} t={t} onClick={() => { go("detail", { tour: t }); }} />)}</div>
        <div className="sh city-sh" style={{ marginTop: 8 }}>
          {/* ESTE TÍTULO DICE QUÉ ESTÁS VIENDO, NO DÓNDE ESTÁS. La distinción
              parece de redacción y es la única cosa que la app puede afirmar
              con certeza.

              Acá vivían dos frases y las dos se fueron el 2026-08-19:

              " · cerca de ti", que aparecía cuando la geo IP había matcheado.
              Es la única frase donde la app decía SABER dónde estaba el
              viajero, y se midió equivocada: desde una máquina en Lima, sin
              VPN, /api/geo devolvió "Arequipa" con source "geo" de forma
              estable. O sea que la pantalla decía "Tours en Arequipa · cerca
              de ti" a alguien que estaba en Lima. No es que no supiera: es que
              afirmó, y se equivocó.

              " · no detectamos tu ciudad", que se había agregado ese mismo día
              para el caso contrario. Era honesta, pero sostenía el marco
              equivocado: hablaba de un intento de detectarte. Si el título ya
              no afirma dónde estás, no hay nada que desmentir.

              NO SE VUELVEN A PONER, y el motivo no es la tasa de error, que no
              está medida (dos casos no miden una tasa). Es la asimetría:
              acertar le ahorra al viajero UN toque en el selector, y errar lo
              manda a otro catálogo diciéndole que es el suyo. Con esa cuenta,
              aunque acertara casi siempre, seguiría sin convenir afirmar.

              La geo IP sigue eligiendo la ciudad inicial, y está bien: es una
              sugerencia. Lo que no hace es anunciarse como conocimiento. El
              control para cambiarla está al lado, y es el que manda. */}
          <div className="st">Tours en {displayName(selectedDept)}</div>
          <div className="city-actions">
            {allCityTours.length > 4 && (
              <button className="sl" onClick={() => setCityExpanded((v) => !v)}>
                {cityExpanded ? "Ver menos" : (
                  <>Ver todos <ArrowRight size={12} strokeWidth={1.5} style={{verticalAlign:"middle"}} /></>
                )}
              </button>
            )}
            <CitySelector selectedDept={selectedDept} opciones={deptsConTours} onPick={handleCityChange} />
          </div>
        </div>

        {/* LA PREGUNTA VIVE ACÁ, DENTRO DE LA SECCIÓN DE CIUDAD, Y NO ARRIBA.
            El motivo NO es el espacio, es el ALCANCE, y conviene tenerlo claro
            antes de "mejorar" la ubicación:

            el filtro por ciudad afecta EXCLUSIVAMENTE a este carrusel. Está
            medido: `CatalogView` nunca recibió la ciudad, y "Recién publicados"
            tampoco se filtra. O sea que preguntar más arriba interrumpiría a
            TODOS, incluido al que llegó buscando otra cosa, para decidir algo
            que no cambia nada de lo que está viendo en ese momento.

            El costo de subirla también está medido, a 390px: la fila mide 98px
            y empujaría la primera tarjeta de y=489 a y=587, dejando 113px de
            ella visibles con un viewport útil de unos 700. Pero ese es el
            argumento chico. El grande es el de arriba.

            Y DE ACÁ SALE GRATIS EL CASO DEL DEEP LINK. A alguien que llega de
            Google a una ficha de tour NO se le pregunta la ciudad, porque el
            filtro no afecta a esa pantalla en absoluto: sería pedirle una
            decisión que no cambia ni un píxel de lo que está mirando. No hizo
            falta escribir "si es deep link, no preguntes": la fila no está ahí
            porque esta sección no está ahí. Si algún día alguien mueve esta
            fila a un lugar común a todas las vistas, esa condición pasa a
            existir y hay que escribirla a mano. */}
        {!yaEligio && !toursLoading && (
          <div className="city-ask">
            <div className="city-ask-t">¿Desde dónde viajas?</div>
            <div className="city-ask-row">
              {deptsConTours.map((d) => (
                <button
                  key={d}
                  type="button"
                  className={`city-ask-chip ${d === selectedDept ? "on" : ""}`}
                  onClick={() => handleCityChange(d)}
                >
                  {displayName(d)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* La oferta de cambio: solo si la IP dice algo distinto de lo que
            decía cuando el viajero eligió. Es una línea descartable y no un
            modal, a propósito: si el supuesto de que la detección es estable
            por conexión resulta falso, esto molesta pero no rompe. */}
        {sugerenciaCambio && (
          <div className="city-ask city-ask-move">
            <span>¿Estás en {displayName(sugerenciaCambio)}?</span>
            <button
              type="button"
              className="city-ask-chip on"
              onClick={() => handleCityChange(sugerenciaCambio)}
            >
              Ver tours de {displayName(sugerenciaCambio)}
            </button>
          </div>
        )}
        {toursLoading ? (
          <div className="tscr">
            {Array.from({ length: 4 }).map((_, i) => <TCardSkeleton key={i} />)}
          </div>
        ) : allCityTours.length > 0 ? (
          <div className={`tscr city-tscr${cityExpanded ? " expanded" : ""}`}>
            {allCityTours.map((t) => (
              <TCard key={t.id} t={t} onClick={() => { go("detail", { tour: t }); }} />
            ))}
          </div>
        ) : (
          <div className="city-empty">
            <div className="city-empty-ic"><MapPin size={22} strokeWidth={1.5} /></div>
            <div className="city-empty-tl">Pronto tendremos tours en {displayName(selectedDept)}</div>
            <div className="city-empty-sub">Estamos sumando agencias verificadas de todo el Perú.</div>
            <button type="button" className="city-empty-btn" onClick={() => handleCityChange("Lima")}>
              Ver tours en Lima
            </button>
          </div>
        )}
        <div className="sh" style={{ marginTop: 8 }}><div className="st">Explora tours</div></div>
        <div className="tg">{toursLoading ? Array.from({ length: 8 }).map((_, i) => <GCardSkeleton key={i} />) : filt.map((t) => <GCard key={t.id} t={t} onClick={() => { go("detail", { tour: t }); }} />)}</div>
      </div>
    </div>
  );
}

function CatalogView({ go, cat, setCat, tours, toursLoading }) {
  const [q, setQ] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [localResults, setLocalResults] = useState([]);
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [geminiIds, setGeminiIds] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [apiReasoning, setApiReasoning] = useState("");
  // Carga de la fase 2 (reasoning). Las tarjetas ya están visibles mientras.
  const [reasoningLoading, setReasoningLoading] = useState(false);
  // hasSearched evita que aparezca "No se encontraron resultados" en la
  // pantalla vacía inicial. Se prende con la primera búsqueda real (Enter,
  // dispatch IA, o sugerencia clickeada) y se apaga al limpiar el query.
  const [hasSearched, setHasSearched] = useState(false);
  const geminiTimer = useRef(null);
  const searchRef = useRef(null);
  // Número de secuencia de búsqueda IA: descarta respuestas de fase 2 que
  // lleguen tarde cuando el usuario ya buscó otra cosa o limpió el resultado.
  const aiSeq = useRef(0);
  const fullSearch = q.length >= 2 ? searchTours(tours, q, cat) : null;
  const filt = aiResult
    ? aiResult.results.map(id => tours.find(t => t.id === id)).filter(Boolean)
    : geminiIds
      ? geminiIds.map(id => tours.find(t => t.id === id)).filter(Boolean)
      : fullSearch
        ? fullSearch.results
        : cat === "all" ? tours : tours.filter(t => t.category === cat);
  const handleAiSearch = (suggestion) => { setQ(suggestion.query); setShowDropdown(false); setAiResult(suggestion); setGeminiIds(null); setHasSearched(true); };

  // Búsqueda IA reusable: la llama el debounce desde handleChange y también
  // Enter (que cancela el timer pendiente y dispara la búsqueda al toque).
  // La grilla muestra EXACTAMENTE los tours que la IA eligió, en su orden
  // (api/search devuelve top_3_ids rankeados). No se mezclan extras locales:
  // eso inflaba la grilla y contradecía el reasoning ("los tres").
  const runAiSearch = async (value) => {
    const seq = ++aiSeq.current;
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
        if (apiIds.length > 0) {
          // Solo los tours de la IA, en su orden de ranking.
          const apiTours = apiIds.map(id => tours.find(t => t.id === id)).filter(Boolean);
          // Setear todo ANTES de bajar geminiLoading para evitar frame con
          // loading=false + grid vacía.
          setGeminiIds(apiIds);
          setLocalResults(apiTours);
          if (data.reasoning != null) {
            // Cache HIT o fallback: llegó todo junto y no hay fase 2.
            setApiReasoning(data.reasoning || "");
          } else {
            // Fase 2 en background, con las tarjetas ya en pantalla. Si falla,
            // las tarjetas se quedan y el bloque de análisis no aparece.
            setApiReasoning("");
            setReasoningLoading(true);
            fetch("/api/search-reasoning", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              // phase2Tours va de vuelta VERBATIM: la firma cubre esos datos y
              // cualquier cambio la invalida (la fase 2 rehidrataria de DB).
              body: JSON.stringify({ query: value, ids: apiIds, sig: data.sig, tours: data.phase2Tours }),
            })
              .then((r2) => (r2.ok ? r2.json() : null))
              .then((d2) => {
                if (aiSeq.current !== seq) return;
                if (d2 && d2.reasoning) setApiReasoning(d2.reasoning);
              })
              .catch(() => { /* sin reasoning: no rompemos la pantalla */ })
              .finally(() => {
                if (aiSeq.current === seq) setReasoningLoading(false);
              });
          }
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
    aiSeq.current += 1;
    setGeminiIds(null);
    setAiResult(null);
    setReasoningLoading(false);
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
          <input placeholder="Ej: algo tranquilo cerca de Lima"
            value={q}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown} />
          <span className="ai-sb-tag"><Sparkles size={12} strokeWidth={1.5} /> IA</span>
          {dropdownOpen && (
            <div className="ai-suggest">
              {isPopular && hasResults && <div className="ai-suggest-h">Búsquedas populares</div>}
              {!isPopular && geminiLoading && <div className="sr-ai-hint"><Sparkles size={12} strokeWidth={1.5} /> Buscando…</div>}
              {hasResults ? localResults.map(t => (
                <div key={t.id} className="sr-item" onMouseDown={(e) => { e.preventDefault(); go("detail", { tour: t }); }}>
                  <div className="sr-thumb" style={imgBg(t.image)} />
                  <div className="sr-info"><div className="sr-name">{t.title}</div><div className="sr-loc">{t.location}</div></div>
                  <div className="sr-meta"><div className="sr-price">S/ {t.price}</div><div className="sr-rating">{t.reviews > 0 ? (<>{Array.from({length: Math.round(t.rating)}, (_,i) => <Star key={i} size={10} strokeWidth={1.5} fill="currentColor" />)} {t.rating}</>) : "Nuevo"}</div></div>
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
            <div><div className="ai-result-t">Encontramos {filt.length} tours</div><div className="ai-result-b">&ldquo;{aiResult.query}&rdquo;. {aiResult.reason}</div></div>
            <button className="sr-clear" onClick={() => { setAiResult(null); setQ(""); }}><X size={16} strokeWidth={1.5} /></button>
          </div>
        )}
        {geminiIds && !aiResult && (
          <div className="ai-result">
            <div className="ai-result-ic"><Sparkles size={16} strokeWidth={1.5} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="ai-result-t">Encontramos {filt.length} tours</div>
              <div className="ai-result-b">para &ldquo;{q}&rdquo;</div>
              {apiReasoning
                ? <div className="ai-result-x">{apiReasoning}</div>
                : reasoningLoading && <div className="ai-result-x">Analizando los mejores tours…</div>}
            </div>
            <button className="sr-clear" onClick={() => { aiSeq.current += 1; setGeminiIds(null); setApiReasoning(""); setReasoningLoading(false); }}><X size={16} strokeWidth={1.5} /></button>
          </div>
        )}
        <div className="cats">{CATS.map((c) => <button key={c.id} className={`chip ${cat === c.id ? "on" : ""}`} onClick={() => { setCat(c.id); setQ(""); setGeminiIds(null); setAiResult(null); setLocalResults([]); setHasSearched(false); }}><c.ic size={16} strokeWidth={1.5} /> {c.n}</button>)}</div>
        {geminiLoading && (
          <div className="ai-result loading">
            <div className="ai-result-ic"><Sparkles size={16} strokeWidth={1.5} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="ai-result-t">Buscando entre tours verificados…</div>
              <div className="ai-result-b">Estamos viendo cuáles encajan con lo que buscas</div>
            </div>
          </div>
        )}
        {!geminiLoading && hasSearched && filt.length === 0 && apiReasoning && (
          <div className="ai-result">
            <div className="ai-result-ic"><Sparkles size={16} strokeWidth={1.5} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="ai-result-t">No encontramos tours para esa búsqueda</div>
              <div className="ai-result-b">para &ldquo;{q}&rdquo;</div>
              <div className="ai-result-x">{apiReasoning}</div>
            </div>
            <button className="sr-clear" onClick={() => { setApiReasoning(""); }}><X size={16} strokeWidth={1.5} /></button>
          </div>
        )}
        {toursLoading ? (
          <>
            <div style={{ paddingBottom: 12, fontSize: 13, color: "var(--gy)" }}>Cargando tours…</div>
            <div className="tg">{Array.from({ length: 8 }).map((_, i) => <GCardSkeleton key={i} />)}</div>
          </>
        ) : !geminiLoading && !(hasSearched && filt.length === 0 && apiReasoning) && (hasSearched && filt.length === 0 ? (
          <div style={{ padding: "32px 16px 24px", textAlign: "center", color: "var(--gy)", minHeight: 180 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ch)", marginBottom: 6 }}>Todavía no tenemos tours para esa búsqueda</div>
            <div style={{ fontSize: 12 }}>Prueba con otras palabras o mira las categorías.</div>
          </div>
        ) : (
          <>
            {!(aiResult || geminiIds) && <div style={{ paddingBottom: 12, fontSize: 13, color: "var(--gy)" }}>{filt.length} tours disponibles</div>}
            <div className="tg">{filt.map((t) => <GCard key={t.id} t={t} onClick={() => { go("detail", { tour: t }); }} />)}</div>
          </>
        ))}
      </div>
    </div>
  );
}

// Carrusel del hero del detalle (sub-paso 2 galería). Capa absoluta DENTRO del
// .det-hero: NO altera el flex del hero, así el título y el botón de volver
// quedan EXACTAMENTE donde estaban. Swipe nativo (scroll-snap) en móvil +
// flechas/puntos en desktop. Solo se monta con 2+ fotos (el caso 0/1 conserva
// el hero de hoy con background inline). Reusa imgBg() por slide.
function DetHeroGallery({ images }) {
  const [idx, setIdx] = useState(0);
  const trackRef = useRef(null);
  const onScroll = () => {
    const el = trackRef.current;
    if (!el || el.clientWidth === 0) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== idx) setIdx(i);
  };
  const goTo = (i) => {
    const el = trackRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(images.length - 1, i));
    el.scrollTo({ left: clamped * el.clientWidth, behavior: "smooth" });
  };
  return (
    <div className="det-gal">
      <div className="det-gal-track" ref={trackRef} onScroll={onScroll}>
        {images.map((src, i) => (
          <div key={i} className="det-gal-slide" style={imgBg(src)} />
        ))}
      </div>
      <button
        className="det-gal-arr det-gal-arr-l"
        onClick={() => goTo(idx - 1)}
        disabled={idx === 0}
        aria-label="Foto anterior"
        type="button"
      ><ChevronLeft size={18} strokeWidth={2} /></button>
      <button
        className="det-gal-arr det-gal-arr-r"
        onClick={() => goTo(idx + 1)}
        disabled={idx === images.length - 1}
        aria-label="Foto siguiente"
        type="button"
      ><ChevronRight size={18} strokeWidth={2} /></button>
      <div className="det-gal-dots">
        {images.map((_, i) => (
          <span key={i} className={`det-gal-dot ${i === idx ? "on" : ""}`} />
        ))}
      </div>
    </div>
  );
}

function DetailView({ tour, go, onBook, reviews }) {
  const [lang, setLang] = useState("es");
  const [langOpen, setLangOpen] = useState(false);
  const [showAllRevs, setShowAllRevs] = useState(false);
  // Quechua: las traducciones (titleQu/descQu/includedQu/excludedQu) se sirven
  // desde la DB vía DETAIL_SELECT. El toggle QU lee esos campos con fallback a
  // español si están vacíos. Ya no hay traducción on-the-fly.

  // Pre-carga de disponibilidad del mes actual (solo CUPO_FIJO): mientras el
  // viajero lee el detalle, el dato llega al cache de módulo y el calendario
  // del flujo de reserva abre con las celdas ya pintadas, sin demora.
  const dtTourId = tour?.id;
  const dtSalesMode = tour?.salesMode;
  useEffect(() => {
    if (dtSalesMode !== "CUPO_FIJO" || !dtTourId) return;
    const { y, m } = limaCurrentYM();
    const run = async () => { await fetchMonthAvailability(dtTourId, y, m); };
    run();
  }, [dtTourId, dtSalesMode]);

  if (!tour) return null;
  const isQu = lang === "qu";
  const langLabels = { es: "Español", qu: "Quechua", en: "English" };
  const langFlags = { es: "PE", qu: "QU", en: "EN" };
  // Galería del hero (sub-paso 2). La portada (tour.image = imageUrl) SIEMPRE
  // lidera la slide 0, así coincide con el card; el resto de images[] sigue en
  // orden de subida (sin la portada, ya posicionada al frente). Cubre el caso
  // límite imageUrl ∉ images (la incluye igual). 0 fotos → gradiente de imgBg
  // (como hoy); 1 → hero estático sin chrome; 2+ → carrusel.
  const cover = tour.image;
  const gallery = cover
    ? [cover, ...(tour.images || []).filter(u => u && u !== cover)]
    : (tour.images || []);
  const isCarousel = gallery.length >= 2;
  // Solo reseñas REALES: las que deja el viajero en sesión (estado `reviews`,
  // vía handleReview). Sin mock: si no hay reseñas, no se renderiza el bloque.
  const tourRevs = reviews[tour.id] || [];
  const visibleRevs = showAllRevs ? tourRevs : tourRevs.slice(0, 3);
  // Todo se calcula sobre las reseñas reales presentes (no sobre tour.reviews):
  // el conteo, la distribución de estrellas y el promedio coinciden con lo que
  // realmente se muestra.
  const totalReviews = tourRevs.length;
  const starCounts = [5, 4, 3, 2, 1].map(s => ({ star: s, count: tourRevs.filter(r => r.rating === s).length }));
  const maxCount = Math.max(...starCounts.map(s => s.count), 1);
  return (
    <div className="det">
      <div className="det-hero" style={isCarousel ? undefined : imgBg(gallery[0] || tour.image)}>
        {isCarousel && <DetHeroGallery images={gallery} />}
        <div className="det-ov" />
        <button className="bk-btn" onClick={() => go("home")} aria-label="Volver al inicio" type="button"><ArrowLeft size={20} strokeWidth={1.5} /></button>
        <div className="det-nfo">
          <div className="det-tl">{isQu ? (tour.titleQu || tour.title) : tour.title}</div>
        </div>
      </div>
      <div className="det-c fu">
        <h1 className="det-tl-desktop">{isQu ? (tour.titleQu || tour.title) : tour.title}</h1>
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
        {totalReviews > 0 && (
          <div className="ai-sum">
            <div className="ai-sum-h"><Sparkles size={14} strokeWidth={1.5} /> Resumen de {totalReviews} reseña{totalReviews === 1 ? "" : "s"}</div>
            <div className="ai-sum-t">{tour.aiSummary}</div>
          </div>
        )}
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
              <div className="det-mi"><span className="mic"><Timer size={14} strokeWidth={1.5} /></span>Duración {tour.duration}</div>
              {tour.startTime && (
                <div className="det-mi"><span className="mic"><Clock size={14} strokeWidth={1.5} /></span>Salida {tour.startTime}</div>
              )}
              {totalReviews > 0 && (
                <div className="det-mi"><span className="mic"><Star size={14} strokeWidth={1.5} fill="currentColor" /></span>{tour.rating} ({totalReviews})</div>
              )}
              {hasAltitude && (
                <div className="det-mi"><span className="mic"><ArrowUp size={14} strokeWidth={1.5} /></span>{tour.altitude} m</div>
              )}
              <div className="det-mi"><span className="mic"><Users size={14} strokeWidth={1.5} /></span>Max {tour.capacity}</div>
              <div className="det-mi"><span className="mic"><Dumbbell size={14} strokeWidth={1.5} /></span>{tour.difficulty}</div>
            </div>
          );
        })()}
        <p className="det-ds">
          {isQu ? (tour.descQu || tour.desc) : tour.desc}
        </p>
        <div className="det-op">
          <div className="det-op-av">{tour.operator[0]}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="det-op-n">{tour.operator}</div>
            {tour.verified && (
              <div className="det-op-d">
                <ShieldCheck size={14} strokeWidth={1.5} /> Finde Verificado
              </div>
            )}
            {/* N° MINCETUR real, solo si verificado (el backend ya lo anula para
                no verificados). Credencial pública consultable. El RUC sigue fuera
                de los selects públicos (dato privado). */}
            {tour.verified && tour.operatorMincetur && (
              <div style={{ fontSize: 11, color: "var(--gy)", marginTop: 4 }}>Registro MINCETUR · {tour.operatorMincetur}</div>
            )}
          </div>
        </div>
        <div className="det-st">{isQu ? "Imapas chaypi kan" : "Incluye"}</div>
        <div className="det-incs">
          {(() => {
            // En QU usa las listas traducidas si existen; si están vacías (tour
            // sin traducir), cae a las españolas. En ES, siempre español.
            const inc = isQu && tour.includedQu?.length ? tour.includedQu : tour.included;
            const exc = isQu && tour.excludedQu?.length ? tour.excludedQu : tour.excluded;
            return (
              <>
                {(Array.isArray(inc) ? inc : []).map((x, i) => <div key={`i${i}`} className="det-inc"><div className="det-ic iy"><Check size={14} strokeWidth={2} /></div>{x}</div>)}
                {(Array.isArray(exc) ? exc : []).map((x, i) => <div key={`e${i}`} className="det-inc"><div className="det-ic in"><X size={14} strokeWidth={2} /></div>{x}</div>)}
              </>
            );
          })()}
        </div>
        {SHOW_CANCELLATION_POLICY && (() => {
          const pol = getCancelPolicy(tour.cancellation);
          return (
            <div style={{ padding: 14, background: "var(--cr)", borderRadius: 12, marginBottom: 20, borderLeft: "3px solid var(--f)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--f)", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                <ShieldCheck size={14} strokeWidth={1.5} /> Política de cancelación: {pol.label}
              </div>
              <div style={{ fontSize: 12, color: "var(--gy)" }}>{pol.short}</div>
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
      <div className="bb">
        {/* Modo de venta, sin detalle operativo (decisión de producto): el
            viajero sabe QUÉ esperar, no cuándo cierra la agencia. Sin
            salesMode (dato ausente) no se muestra nada. */}
        {tour.salesMode === "CUPO_FIJO" && (
          <div className="bb-mode"><Check size={13} strokeWidth={2.5} style={{ color: "var(--m)" }} /> Confirmación inmediata</div>
        )}
        {tour.salesMode === "SOLICITUD" && (
          <div className="bb-mode">La agencia confirma tu reserva</div>
        )}
        <div className="bb-p">S/ {tour.price}<span>por persona</span></div><button className="bb-bt" onClick={onBook}>Reservar ahora</button>
      </div>
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
// Normaliza un teléfono a formato internacional para armar links wa.me.
// Acepta cualquier número de 8 a 15 dígitos, la misma ventana que validan el
// formulario y el backend (/^\d{8,15}$/). La versión anterior solo aceptaba 9
// u 11+, así que los de 8 y 10 dígitos (fijos, extranjeros) morían acá y el
// panel decía "El viajero no dejó un teléfono" teniéndolo guardado.
// Solo se prefija 51 al celular peruano de 9 dígitos; el resto va tal cual,
// porque adivinar el país de un número ajeno genera links a otra persona.
// 15 es el máximo de E.164: por encima no hay número marcable, así que null.
function toIntlPhone(raw) {
  if (!raw) return null;
  const digits = String(raw).replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) return null;
  if (digits.startsWith("51") && digits.length >= 11) return digits;
  if (digits.length === 9) return `51${digits}`;
  return digits;
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
    "Tengo una consulta sobre mi reserva.",
  ].filter(Boolean);
  return `https://wa.me/${phone}?text=${encodeURIComponent(lines.join(" "))}`;
}

const PAYMENT_LABELS = { yape: "Yape", plin: "Plin", card: "Tarjeta" };

// VoucherDetail — comprobante completo del viaje. Único componente compartido
// entre la pantalla de éxito post-pago y el detalle del viaje en Mis Viajes,
// para que el viajero vea exactamente la misma información en ambos lados.
function VoucherDetail({ trip }) {
  if (!trip || !trip.tour) return null;
  const tour = trip.tour;
  const iso = tripDateISO(trip);
  const dateLabel = iso ? formatLongDate(iso) : (trip.date || "");
  // Hora/duración etiquetadas, sin inventar default. La fila no se muestra si no
  // hay ni startTime ni duración (ver render de timeRange más abajo).
  const timeRange = [
    tour.startTime ? `Salida ${tour.startTime}` : "",
    tour.duration ? `Duración ${tour.duration}` : "",
  ].filter(Boolean).join(" · ");
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
        {timeRange && (
          <div className="voucher-row">
            <span className="ic"><Clock size={14} strokeWidth={1.5} /></span>
            <span>{timeRange}</span>
          </div>
        )}
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
          {tour.operator || "Agencia"}
          {tour.verified && (
            <span className="voucher-verified"><ShieldCheck size={11} strokeWidth={1.5} /> Finde Verificado</span>
          )}
        </div>
        {/* N° MINCETUR real, solo si verificado (backend ya lo anula para no
            verificados). El RUC sigue fuera de los selects públicos (privado). */}
        {tour.verified && tour.operatorMincetur && (
          <div className="voucher-agency-d">Registro MINCETUR · {tour.operatorMincetur}</div>
        )}
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

      {/* 7 — Resumen. El pago del demo pasa por Finde; no se muestra método ni
          "total pagado" (sería falso en el mock), solo código y total de la
          reserva, más la nota de que Finde protege el pago. */}
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
        <div className="voucher-note">Tu pago está protegido por Finde.</div>
      </div>
    </div>
  );
}

function BookingView({ tour, go, onLocalBookingSuccess, onNeedAccount }) {
  const { user } = useAuth();

  // El borrador se lee UNA vez, en el primer render, y siembra los useState de
  // abajo. Restaurarlo desde un efecto haría dos renders y un parpadeo: el
  // calendario abriría sin fecha y saltaría después a la guardada. Solo se
  // acepta si es de ESTE tour: volver de un correo con la fecha de otro tour
  // sería peor que no restaurar nada.
  const [draftInicial] = useState(() => {
    const d = readBookingDraft();
    return d && d.tourId === tour?.id ? d : null;
  });

  // El paso se restaura hasta el 2 nomás. Del 3 en adelante son pago y voucher,
  // y ahí no se vuelve con un borrador: se vuelve con una reserva.
  const [step, setStep] = useState(draftInicial?.step === 2 ? 2 : 1);
  // Numeración derivada del flag: en modo demo el pago es el paso 3 y el voucher
  // se corre al 4; en modo honesto el voucher sigue siendo el paso 3 (sin pago).
  const VOUCHER_STEP = DEMO_PAYMENT_FLOW ? 4 : 3;
  const PAYMENT_STEP = 3;
  const [pay, setPay] = useState("yape");
  const [guests, setGuests] = useState(
    Number.isFinite(draftInicial?.guests) && draftInicial.guests >= 1 ? draftInicial.guests : 2
  );
  // Sin fecha preseleccionada: el viajero elige el día explícitamente y
  // "Continuar" queda deshabilitado hasta entonces.
  const [date, setDate] = useState(draftInicial?.date || "");
  // Sin prefill del mock USER: el viajero escribe su identidad real, así cada
  // reserva guarda su userName/userPhone reales (antes todas salían iguales).
  // El email sí se prefilla del token (real) más abajo.
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  // El email sale de la CUENTA y se DERIVA, no se copia a estado.
  //
  // Antes era un useState prellenado con user?.email, y ese prefill corre una
  // sola vez, al montar. Desde que la navegación se abrió, el visitante entra a
  // reservar SIN cuenta: montaba con el campo vacío, se logueaba después en el
  // modal, y el campo se quedaba con lo que él escribiera. O sea que veía un
  // correo que no es al que le llega nada, porque el backend usa el del token y
  // descarta este (api/bookings.ts). Un dato que parece dato y no lo es.
  //
  // Derivarlo lo arregla de raíz en vez de re-sincronizarlo: con cuenta, el
  // campo muestra SIEMPRE el correo real y va de solo lectura, así lo que se ve
  // es lo que el backend va a usar. `emailTipeado` queda como respaldo para el
  // caso sin cuenta, que hoy no llega hasta acá.
  const accountEmail = user?.email || "";
  const [emailTipeado, setEmailTipeado] = useState("");
  const email = accountEmail || emailTipeado;
  const [docId, setDocId] = useState("");
  // Touched por campo: el error de cada campo aparece al abandonarlo (onBlur)
  // inválido; el botón de continuar queda deshabilitado hasta que todo valide.
  const [touched, setTouched] = useState({ name: false, phone: false, email: false, doc: false });
  const [bookingCode] = useState(() => Math.random().toString(36).substring(2, 8).toUpperCase());
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  // Carrera de cupos: alguien tomó asientos mientras el viajero llenaba sus
  // datos. Es el ÚNICO error del paso 3 que ninguna validación de cliente puede
  // evitar, así que se maneja aparte del resto (que son fallos de escritura o
  // de red) y con la jerarquía que le corresponde: el viajero ya invirtió tres
  // pantallas. { seatsLeft, message }.
  const [availError, setAvailError] = useState(null);
  const [serverBooking, setServerBooking] = useState(null);

  // ── Borrador: guardar y limpiar ──
  // El porqué está arriba, en readBookingDraft. La restauración no vive acá:
  // siembra los useState del principio del componente.

  // Guardar en cada cambio de lo que vale la pena. No se guarda nada hasta que
  // el viajero eligió una fecha: un borrador vacío no ayuda a nadie.
  useEffect(() => {
    if (!tour?.id || !date) return;
    if (step >= PAYMENT_STEP) return;
    writeBookingDraft({ tourId: tour.id, path: window.location.pathname, date, guests, step });
  }, [tour?.id, date, guests, step, PAYMENT_STEP]);

  // Limpiar al llegar al voucher. Va en UN efecto y no en los dos lugares que
  // llaman a setStep(VOUCHER_STEP), para que un tercer camino futuro no se
  // olvide de limpiar.
  useEffect(() => {
    if (step === VOUCHER_STEP) clearBookingDraft();
  }, [step, VOUCHER_STEP]);
  // Disponibilidad de cupos por mes visible (solo CUPO_FIJO): fechas llenas se
  // deshabilitan en el calendario y 1-3 restantes muestran el aviso en la
  // celda. El fetch/caching vive a nivel módulo (fetchMonthAvailability); el
  // detalle del tour ya pre-cargó el mes actual, así que el estado inicial se
  // SIEMBRA sincrónico del cache y el calendario abre pintado, sin demora.
  // En SOLICITUD no se consulta nada; el payload público solo trae números
  // 0-3: el allotment total jamás viaja.
  const [avail, setAvail] = useState(() => {
    const seed = { full: new Set(), low: {}, base: null };
    if (tour?.salesMode === "CUPO_FIJO" && tour?.id) {
      const { y, m } = limaCurrentYM();
      const cached = AVAIL_CACHE.get(`${tour.id}:${y}-${m}`);
      if (cached) {
        (cached.full || []).forEach((dt) => seed.full.add(dt));
        Object.assign(seed.low, cached.low || {});
        seed.base = cached.base ?? null;
      }
    }
    return seed;
  });
  // Deps planas (sin optional chaining) para que el compilador de React pueda
  // preservar la memoización del callback.
  const availTourId = tour?.id;
  const availSalesMode = tour?.salesMode;
  const loadMonthAvailability = useCallback(async (y, m) => {
    if (availSalesMode !== "CUPO_FIJO" || !availTourId) return;
    const a = await fetchMonthAvailability(availTourId, y, m);
    if (!a) return;
    // Merge acumulativo entre meses (cada uno aporta fechas disjuntas) pero
    // AUTORITATIVO dentro del mes que acaba de llegar: sus fechas se descartan
    // primero y se re-siembran con lo que dijo el servidor. Sin eso una fecha
    // que se liberó seguiría marcada como llena para siempre, que es la cara
    // opuesta del bug que arregla este viaje.
    const pref = `${y}-${String(m).padStart(2, "0")}-`;
    setAvail((prev) => {
      const full = new Set([...prev.full].filter((dt) => !dt.startsWith(pref)));
      (a.full || []).forEach((dt) => full.add(dt));
      const low = Object.fromEntries(
        Object.entries(prev.low).filter(([dt]) => !dt.startsWith(pref))
      );
      return { full, low: { ...low, ...(a.low || {}) }, base: a.base ?? prev.base };
    });
  }, [availTourId, availSalesMode]);

  // Carrera: si la fecha ya elegida llega marcada como llena (alguien reservó
  // en el medio), se limpia la selección y Continuar queda deshabilitado.
  useEffect(() => {
    if (!date || !avail.full.has(date)) return;
    const run = async () => { setDate(""); };
    run();
  }, [date, avail]);

  // Cupo conocido (1-3) de la fecha elegida: tope del selector de personas
  // (solo CUPO_FIJO; en manual no hay límite). Con más de 3 restantes no hay
  // dato (a propósito) y rige la capacidad del tour, como siempre.
  const cupoFecha = availSalesMode === "CUPO_FIJO" && date
    ? (avail.low[date] ?? (avail.full.has(date) ? 0 : avail.base))
    : null;
  const maxGuests = cupoFecha != null && cupoFecha >= 1 && cupoFecha <= 3
    ? Math.min(cupoFecha, tour.capacity)
    : tour.capacity;

  // Si al cambiar de fecha el valor elegido supera el cupo, baja solo al máximo.
  useEffect(() => {
    if (maxGuests >= 1 && guests > maxGuests) {
      const run = async () => { setGuests(maxGuests); };
      run();
    }
  }, [guests, maxGuests]);

  useEffect(() => {
    if (typeof window !== "undefined") window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [step]);

  // El muro de cuenta vive ACÁ, y este es el punto exacto: el viajero ya eligió
  // fecha y cupos y tiene el total a la vista, así que entiende por qué se le
  // pide. El modal se abre encima, BookingView no se desmonta y no hay ninguna
  // navegación, así que al volver el paso, la fecha y los cupos siguen puestos.
  const continuarADatos = () => {
    if (!user && onNeedAccount) { onNeedAccount(() => setStep(2)); return; }
    setStep(2);
  };

  const submitBooking = async () => {
    setSubmitting(true);
    setSubmitError("");
    setAvailError(null);
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
      setStep(VOUCHER_STEP);
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
          // El backend ignora el email del body y usa el del token (requireAuth);
          // por eso no se envía userEmail.
          tourId: tour.id,
          userName: name,
          userPhone: phoneClean,
          // Documento del viajero: hasta ahora el formulario lo pedía, lo
          // validaba y lo descartaba (nunca salía del navegador).
          userDocument: docId.trim(),
          guests,
          scheduledAt,
        }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        // El servidor rechazó: el dato local de cupos ya no es confiable, sea
        // cual sea el motivo. Tirar el mes de esa fecha antes de mostrar nada,
        // para que volver al paso 1 muestre números reales y no los que
        // acaban de fallar.
        invalidateMonthAvailability(tour.id, date);
        // Y re-pedirlo, sin bloquear el mensaje de error: para cuando el
        // viajero vuelva al paso 1 el calendario ya tiene el número real.
        const [ey, em] = date.split("-").map(Number);
        void loadMonthAvailability(ey, em);
        // El backend manda seatsLeft SOLO cuando el rechazo es por cupo
        // (AvailabilityError de takeSeats). Ese número es la verdad más fresca
        // que existe sobre esa fecha, así que se aplica al calendario sin pedir
        // nada, y decide qué salida se le ofrece al viajero.
        if (r.status === 409 && typeof err.seatsLeft === "number") {
          const left = err.seatsLeft;
          setAvail((prev) => {
            const full = new Set(prev.full);
            const low = { ...prev.low };
            if (left <= 0) { full.add(date); delete low[date]; }
            else { full.delete(date); if (left <= 3) low[date] = left; else delete low[date]; }
            return { ...prev, full, low };
          });
          // Se guarda la combinación a la que el aviso pertenece (fecha y
          // personas). Al render se compara: si el viajero ya cambió alguna de
          // las dos, el aviso deja de aplicar y desaparece solo. Así no hace
          // falta un efecto que lo limpie, que además dispara renders en
          // cascada (regla react-hooks del proyecto).
          // El finally de abajo apaga `submitting` también en este return.
          setAvailError({ seatsLeft: left, forDate: date, forGuests: guests });
          return;
        }
        throw new Error(err.error || `HTTP ${r.status}`);
      }
      const data = await r.json();
      // Reserva creada: el cupo de esa fecha bajó. Sin esto el calendario sigue
      // mostrando el número previo durante toda la sesión de la página.
      invalidateMonthAvailability(tour.id, date);
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
      setStep(VOUCHER_STEP);
    } catch (e) {
      setSubmitError(e.message || "Error creando la reserva");
    } finally {
      setSubmitting(false);
    }
  };

  if (!tour) return null;
  const total = tour.price * guests;
  // Disponibilidad en los próximos 90 días: decide si se muestra el aviso de
  // "sin fechas disponibles" ahora que date arranca vacía.
  const bookingT0 = minBookingISO(tour);
  const hasAvailableDates = getAvailableDatesInRange(tour, bookingT0, addDaysISO(bookingT0, 90)).length > 0;
  // Validación de formato (no sólo trim) para evitar confirmar con datos que el
  // backend rechazará (api/bookings.ts: email format, phone /^\d{8,15}$/).
  const nameValid = name.trim().length >= 3;
  const phoneValid = /^\d{8,15}$/.test(phone.replace(/\s/g, ""));
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  // MISMA regla que api/bookings.ts (userDocument): alfanumérico de 6 a 20.
  // Antes era solo length >= 6, así que un documento con espacios o símbolos
  // pasaba el formulario y moría con 400 en el backend. Mismo error de capas
  // desalineadas que tenía el teléfono.
  const docIdValid = /^[A-Za-z0-9-]{6,20}$/.test(docId.trim());
  const step2Valid = nameValid && phoneValid && emailValid && docIdValid;

  // El aviso de carrera de cupos va DONDE SE PUEDE DISPARAR EL POST, no en un
  // paso concreto. Estaba escrito adentro del paso de pago, y ese es el error de
  // siempre: la guarda quedó atada al camino donde se pensó y no al estado que
  // protege (ver .claude/rules/api-y-schema.md).
  //
  // Concretamente, submitBooking se invoca desde DOS lugares según el flag: el
  // paso de pago (DEMO_PAYMENT_FLOW en true) y el botón "Confirmar reserva" del
  // paso 2 (en false). Por el segundo camino el 409 por cupo no tenía dónde
  // mostrarse, y el fallo es MUDO: submitBooking hace `return` sin lanzar, así
  // que submitError queda vacío y lo único que se ve es que el botón apaga su
  // "Procesando reserva…". La pantalla deja de responder sin decir por qué.
  //
  // Se define una vez y se renderiza en los dos pasos. Solo aparece si el aviso
  // sigue aplicando a lo elegido: si el viajero ya cambió la fecha o la cantidad
  // de personas, deja de aplicar y desaparece solo, sin efecto que lo limpie.
  const avisoCupos = availError && availError.forDate === date && availError.forGuests === guests ? (
    <div className="notice">
      <div className="notice-t">
        {availError.seatsLeft <= 0
          ? "Se agotaron los cupos de esa fecha"
          : "Alguien acaba de tomar cupos"}
      </div>
      <div className="notice-d">
        {availError.seatsLeft <= 0
          // "Se ocuparon" cuelga de "los cupos" del título de arriba, así que no
          // repite. Y no dice QUIÉN los tomó a propósito: seatsLeft <= 0 también
          // da cero si la agencia bajó el cupo con allotmentOverride, así que
          // culpar a otro viajero sería inventar un hecho, justo en la pantalla
          // donde la persona ya está molesta.
          ? "Se ocuparon mientras completabas tus datos. Tus datos quedan guardados."
          : `Quedan ${availError.seatsLeft} para el ${formatLongDate(date)}. Tus datos quedan guardados.`}
      </div>
      {availError.seatsLeft <= 0 ? (
        <button type="button" className="notice-b" onClick={() => { setAvailError(null); setDate(""); setStep(1); }}>
          Elegir otra fecha
        </button>
      ) : availError.seatsLeft < guests ? (
        <button type="button" className="notice-b" onClick={() => { setGuests(availError.seatsLeft); setAvailError(null); }}>
          Reservar para {availError.seatsLeft} {availError.seatsLeft === 1 ? "persona" : "personas"}
        </button>
      ) : (
        // seatsLeft >= guests: con el paso 1 aplicado esto ya no debería pasar
        // (el cupo alcanzaba). Queda el reintento en vez de un callejón sin
        // salida.
        <button type="button" className="notice-b" onClick={() => { setAvailError(null); submitBooking(); }}>
          Volver a intentar
        </button>
      )}
    </div>
  ) : null;

  if (step === VOUCHER_STEP) {
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
      <div className="suc fu" style={{ alignItems: "stretch", padding: "16px 16px 100px", textAlign: "left" }}>
        {/* La vista "booking" oculta el header/nav global (App ~showHeader), así
            que el voucher necesita su propia salida al inicio: sin esto, el
            viajero solo podía ir a "Mis Viajes". "Explorar" del nav = go("home"). */}
        <button
          type="button"
          onClick={() => go("home")}
          aria-label="Volver al inicio"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, alignSelf: "flex-start", marginBottom: 16, padding: "6px 4px", background: "none", border: "none", color: "var(--f)", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}
        >
          <ArrowLeft size={18} strokeWidth={1.5} /> Volver al inicio
        </button>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginBottom: 20 }}>
          <div className="suc-chk"><Check size={28} strokeWidth={2.5} /></div>
          {/* El estado REAL del POST decide el texto: en modo manual la reserva
              nace como SOLICITUD y decir "confirmada" sería falso. Sin
              bookingState (legacy/mock) se conserva el texto de siempre. */}
          {serverBooking?.bookingState === "SOLICITUD" ? (
            <>
              <div className="suc-t">Solicitud enviada</div>
              <div className="suc-sub">Te avisamos por correo cuando la agencia confirme.</div>
            </>
          ) : (
            <>
              <div className="suc-t">¡Reserva confirmada!</div>
              <div className="suc-sub">Tu voucher está listo. Toda la información que necesitas está aquí abajo.</div>
            </>
          )}
        </div>
        <VoucherDetail trip={successTrip} />
        <button
          className="bk-btn"
          onClick={() => go("trips")}
          style={{ position: "relative", width: "100%", marginTop: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "none", border: "none", color: "var(--f)", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}
        >
          <Ticket size={16} strokeWidth={1.5} /> Ver en Mis reservas
        </button>
        {/* CTA secundario al FINAL: link discreto para dudas con la agencia (el
            pago ya pasa por Finde, no se coordina por acá). El número real va en el
            href, nunca visible como texto. Fallback si el operador no tiene
            teléfono → sin link roto. */}
        {(() => {
          const wa = buildWhatsAppLink(successTrip);
          return wa ? (
            <a className="voucher-wa" href={wa} target="_blank" rel="noopener noreferrer">
              <Smartphone size={14} strokeWidth={1.5} /> ¿Tienes consultas? Escríbele a la agencia <ArrowRight size={12} strokeWidth={1.5} />
            </a>
          ) : (
            <div className="voucher-wa" style={{ opacity: .6, cursor: "default", pointerEvents: "none" }}>
              <Smartphone size={14} strokeWidth={1.5} /> Contacto por WhatsApp no disponible
            </div>
          );
        })()}
      </div>
    );
  }

  return (
    <div className="bkf fu">
      <button className="bk-btn" onClick={() => step === 1 ? go("detail", { tour }) : setStep(step - 1)} style={{ position: "relative", marginBottom: 16 }} aria-label={step === 1 ? "Volver al tour" : "Paso anterior"} type="button"><ArrowLeft size={20} strokeWidth={1.5} /></button>
      {/* 3 etapas: Fecha/Viajeros → Datos → Reserva lista (la final es step 3,
          que se renderiza arriba; aquí solo se ven las etapas 1 y 2). */}
      <div className="bkf-st"><div className={`bkf-s ${step >= 1 ? "on" : ""}`} /><div className={`bkf-s ${step >= 2 ? "on" : ""}`} /><div className={`bkf-s ${step >= 3 ? "on" : ""}`} />{DEMO_PAYMENT_FLOW && <div className={`bkf-s ${step >= 4 ? "on" : ""}`} />}</div>

      <div className="bkf-steps">
      {step === 1 && <div className="fu">
        <div className="bkf-t">Elige fecha y viajeros</div>
        <div className="bkf-sub" style={{ marginBottom: 10 }}>{tour.title}</div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", background: "var(--cr)", borderRadius: 100, fontSize: 12, color: "var(--gy)", fontWeight: 600, marginBottom: 24 }}>
          <Clock size={13} strokeWidth={1.5} /> Duración: {tour.duration}{tour.startTime ? ` · Salida ${tour.startTime}` : ""}
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
            minDate={bookingT0}
            minDateNote={bookingT0 > addDaysISO(limaNow().date, MIN_BOOKING_LEAD_DAYS)
              ? "Ya pasó la hora límite para reservar esta fecha"
              : undefined}
            fullDates={tour.salesMode === "CUPO_FIJO" ? avail.full : undefined}
            lowDates={tour.salesMode === "CUPO_FIJO" ? avail.low : undefined}
            lowBase={tour.salesMode === "CUPO_FIJO" ? avail.base : undefined}
            onMonthChange={tour.salesMode === "CUPO_FIJO" ? loadMonthAvailability : undefined}
          />
          {(() => {
            // Línea informativa solo si el tour NO opera todos los días.
            const opDays = tour.days || DEFAULT_DAYS;
            if (opDays.length >= 7) return null;
            const order = ["lun", "mar", "mie", "jue", "vie", "sab", "dom"];
            const plural = { sab: "sábados", dom: "domingos" };
            const names = order.filter(c => opDays.includes(c)).map(c => plural[c] || DAY_LABEL_LONG[c]);
            if (names.length === 0) return null;
            const list = names.length > 1 ? `${names.slice(0, -1).join(", ")} y ${names[names.length - 1]}` : names[0];
            return (
              <div style={{ marginTop: 8, fontSize: 12, color: "var(--gy)" }}>
                Este tour solo sale los {list}.
              </div>
            );
          })()}
          {date ? (
            <div style={{ marginTop: 10, fontSize: 12, color: "var(--gy)" }}>
              {/* Sin refuerzo de cupos acá: la señal vive EN la celda (revisión
                  de diseño); repetirla debajo era ruido entre tres líneas. */}
              Fecha seleccionada: <strong style={{ color: "var(--f)" }}>{formatLongDate(date)}</strong>
            </div>
          ) : !hasAvailableDates ? (
            <div style={{ marginTop: 10, padding: 10, background: "rgba(199,97,58,.08)", borderRadius: 10, fontSize: 12, color: "var(--tr)" }}>
              Sin fechas disponibles próximamente. Escríbele a la agencia por WhatsApp.
            </div>
          ) : null}
        </div>
        {/* El "+" respeta el cupo conocido de la fecha (maxGuests): con 1 cupo
            no se puede armar una reserva de 2 que después falla en el POST. */}
        <div className="fg"><label className="lbl">Personas</label><div className="gctr" role="group" aria-label="Cantidad de personas"><button type="button" className="gbtn" onClick={() => setGuests(Math.max(1, guests - 1))} disabled={guests <= 1} aria-label="Disminuir número de personas">−</button><div className="gcnt" aria-live="polite">{guests}</div><button type="button" className="gbtn" onClick={() => setGuests(Math.min(maxGuests, guests + 1))} disabled={guests >= maxGuests} aria-label="Aumentar número de personas">+</button></div></div>
        <div className="sum"><div className="sum-r"><span>S/ {tour.price} × {guests}</span><span>S/ {total.toFixed(2)}</span></div><div className="sum-t"><span>Total</span><span>S/ {total.toFixed(2)}</span></div></div>
        {SHOW_CANCELLATION_POLICY && !DEMO_PAYMENT_FLOW && (() => {
          const pol = getCancelPolicy(tour.cancellation);
          return (
            <div style={{ padding: 12, background: "var(--cr)", borderRadius: 12, marginBottom: 16, borderLeft: "3px solid var(--f)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--f)", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                <ShieldCheck size={14} strokeWidth={1.5} /> Política de cancelación: {pol.label}
              </div>
              <div style={{ fontSize: 12, color: "var(--gy)" }}>{pol.short}</div>
            </div>
          );
        })()}
        <button className="mbtn" disabled={!date} onClick={continuarADatos}>Continuar</button>
      </div>}

      {step === 2 && <div className="fu">
        <div className="bkf-t">Datos del viajero</div><div className="bkf-sub">{tour.title}</div>
        <div className="fg">
          <label className="lbl" htmlFor="bkf-name">Nombre completo</label>
          <input id="bkf-name" className={`inp${touched.name && !nameValid ? " inp-err" : ""}`} placeholder="Tu nombre completo" value={name} onChange={(e) => setName(e.target.value)} onBlur={() => setTouched(t => ({ ...t, name: true }))} />
          {touched.name && !nameValid && <div className="field-err">Escribe tu nombre completo</div>}
        </div>
        <div className="fg">
          <label className="lbl" htmlFor="bkf-phone">Teléfono</label>
          <input id="bkf-phone" className={`inp${touched.phone && !phoneValid ? " inp-err" : ""}`} placeholder="987 654 321" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^0-9\s]/g, ""))} onBlur={() => setTouched(t => ({ ...t, phone: true }))} type="tel" maxLength={11} />
          {touched.phone && !phoneValid && <div className="field-err">Necesitamos un celular de 9 dígitos</div>}
        </div>
        <div className="fg">
          <label className="lbl" htmlFor="bkf-email">Email</label>
          <input id="bkf-email" className={`inp${touched.email && !emailValid ? " inp-err" : ""}`} placeholder="tu@email.com" value={email} onChange={(e) => setEmailTipeado(e.target.value)} onBlur={() => setTouched(t => ({ ...t, email: true }))} type="email" readOnly={!!accountEmail} style={accountEmail ? { background: "var(--cr)", color: "var(--gy-strong)" } : undefined} />
          {accountEmail && <div style={{ fontSize: 11, color: "var(--gy)", marginTop: 6 }}>Es el correo de tu cuenta. Ahí te escribimos sobre esta reserva.</div>}
          {touched.email && !emailValid && <div className="field-err">Revisa tu email: ahí te enviamos el voucher</div>}
        </div>
        <div className="fg">
          <label className="lbl" htmlFor="bkf-doc">DNI, Pasaporte o CE</label>
          {/* inputMode text, no numeric: el label ofrece pasaporte y CE, que
              llevan letras, y un teclado numérico las escondía. */}
          <input id="bkf-doc" className={`inp${touched.doc && !docIdValid ? " inp-err" : ""}`} placeholder="DNI, pasaporte o carnet de extranjería" value={docId} onChange={(e) => setDocId(e.target.value)} onBlur={() => setTouched(t => ({ ...t, doc: true }))} maxLength={20} inputMode="text" />
          {/* Finalidad declarada del dato (Ley 29733): se pide porque se usa. */}
          <div style={{ fontSize: 11, color: "var(--gy)", marginTop: 6 }}>La agencia lo necesita para registrarte como pasajero del tour.</div>
          {touched.doc && !docIdValid && <div className="field-err">Revisa tu número de documento</div>}
        </div>
        {/* Resumen + política movidos aquí desde el ex-step de pago: el viajero
            confirma con contexto completo y crea la reserva directamente. En modo
            demo el resumen vive dentro del paso de pago, así que aquí se oculta. */}
        {!DEMO_PAYMENT_FLOW && (
        <div className="sum" style={{ marginTop: 8, marginBottom: 16 }}>
          <div className="bk-sum-tour">{tour.title}</div>
          <div className="bk-sum-meta"><Calendar size={14} strokeWidth={1.5} /> {formatLongDate(date) || date} · <Users size={14} strokeWidth={1.5} /> {guests} persona{guests > 1 ? "s" : ""}</div>
          <div className="sum-r"><span>S/ {tour.price} × {guests}</span><span>S/ {total.toFixed(2)}</span></div>
          <div className="sum-t"><span>Total</span><span>S/ {total.toFixed(2)}</span></div>
        </div>
        )}
        {SHOW_CANCELLATION_POLICY && !DEMO_PAYMENT_FLOW && (() => {
          const pol = getCancelPolicy(tour.cancellation);
          return (
            <div style={{ padding: 12, background: "var(--cr)", borderRadius: 12, marginBottom: 16, borderLeft: "3px solid var(--f)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--f)", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                <ShieldCheck size={14} strokeWidth={1.5} /> Política de cancelación: {pol.label}
              </div>
              <div style={{ fontSize: 12, color: "var(--gy)" }}>{pol.short}</div>
            </div>
          );
        })()}
        {!DEMO_PAYMENT_FLOW && (
        <div style={{ fontSize: 12, color: "var(--gy)", marginBottom: 14, textAlign: "center" }}>
          Al confirmar, coordinarás el pago y los detalles directamente con la agencia por WhatsApp.
        </div>
        )}
        {/* En el flujo sin pago el POST sale de ESTE paso, así que el aviso de
            carrera de cupos tiene que existir acá. Con DEMO_PAYMENT_FLOW en true
            nunca se llena desde este botón y no se ve: no molesta, y el día que
            el flag se apague la falla deja de ser muda. */}
        {avisoCupos}
        {submitError && <div className="field-err" style={{ marginBottom: 12 }}>{submitError}</div>}
        {DEMO_PAYMENT_FLOW ? (
          <button className="mbtn" disabled={submitting || !step2Valid} onClick={() => { if (!step2Valid) return; setStep(PAYMENT_STEP); }}>
            Continuar al pago
          </button>
        ) : (
          <button className="mbtn" disabled={submitting || !step2Valid} onClick={() => { if (!step2Valid) return; submitBooking(); }}>
            {submitting ? "Procesando reserva…" : "Confirmar reserva"}
          </button>
        )}
      </div>}

      {/* Paso de pago mock (solo modo demo). Recuperado de 3506c0a; NO cobra real:
          el botón llama submitBooking, que lleva al voucher (setStep(VOUCHER_STEP)).
          La política de cancelación va gateada por SHOW_CANCELLATION_POLICY (oculta
          en el piloto), así que en este paso todavía no se ve. */}
      {DEMO_PAYMENT_FLOW && step === PAYMENT_STEP && <div className="fu">
        <div className="bkf-t">Método de pago</div><div className="bkf-sub">Revisa tu reserva y elige cómo pagar</div>
        <div className="sum" style={{ marginBottom: 16 }}>
          <div className="bk-sum-tour">{tour.title}</div>
          <div className="bk-sum-meta"><Calendar size={14} strokeWidth={1.5} /> {formatLongDate(date) || date} · <Users size={14} strokeWidth={1.5} /> {guests} persona{guests > 1 ? "s" : ""}</div>
          <div className="sum-r"><span>S/ {tour.price} × {guests}</span><span>S/ {total.toFixed(2)}</span></div>
          <div className="sum-t"><span>Total</span><span>S/ {total.toFixed(2)}</span></div>
        </div>
        {SHOW_CANCELLATION_POLICY && (() => {
          const pol = getCancelPolicy(tour.cancellation);
          return (
            <div style={{ padding: 12, background: "var(--cr)", borderRadius: 12, marginBottom: 24, borderLeft: "3px solid var(--f)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--f)", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                <ShieldCheck size={14} strokeWidth={1.5} /> Política de cancelación: {pol.label}
              </div>
              <div style={{ fontSize: 12, color: "var(--gy)" }}>{pol.short}</div>
            </div>
          );
        })()}
        <label className="lbl" style={{ marginBottom: 12 }}>Método de pago</label>
        <div className="pms">
          {[{ id: "yape", n: "Yape", c: "var(--yp)", tg: "Popular" }, { id: "plin", n: "Plin", c: "var(--pl)" }, { id: "card", n: "Tarjeta", c: "var(--ch)", ic: CreditCard }].map((m) => (
            <div key={m.id} className={`pm ${pay === m.id ? "sel" : ""}`} onClick={() => setPay(m.id)}>
              <div className="pm-rd" /><div className="pm-ic" style={{ background: m.c }}>{m.ic ? <m.ic size={16} strokeWidth={1.5} /> : m.n[0]}</div><div className="pm-n">{m.n}</div>{m.tg && <div className="pm-tg">{m.tg}</div>}
            </div>
          ))}
        </div>
        {/* Carrera de cupos: no es un error de formulario, así que no usa el
            mismo aviso chico de 12px que "el teléfono es inválido". Dice qué
            pasó y OFRECE LA SALIDA, que es lo que faltaba: hasta ahora el
            viajero leía "solo quedan N" y tenía que deducir solo que había que
            volver dos pasos y bajar el número. Se define arriba (avisoCupos) y
            se renderiza también en el paso 2, porque el POST sale de los dos. */}
        {avisoCupos}
        {submitError && <div className="field-err" style={{ marginBottom: 12 }}>{submitError}</div>}
        <button className={`mbtn ${pay === "yape" ? "yp" : ""}`} disabled={submitting} onClick={submitBooking}>
          {submitting
            ? "Procesando reserva…"
            : `Pagar S/ ${total.toFixed(2)} con ${PAYMENT_LABELS[pay]}`}
        </button>
      </div>}
      </div>
    </div>
  );
}

// Notificaciones derivadas (sin modelo en DB). `notifs` ya trae `read` calculado.
// onSelect(n) (en App scope) marca la notif como vista y la navega a su destino
// (n.target: "trips" → Mis Viajes; "dashboard" → pestaña Reservas). onMarkAll
// marca todas como leídas.
// Lista reusable de notificaciones (estado vacío + ítems .ni-item). La comparten
// la página full-page (NotifsView) y el popover anclado a la campana (NotifBell).
function NotifList({ notifs, onSelect }) {
  return (
    <>
      {notifs.length === 0 && (
        <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--gy)" }}>
          <Bell size={32} strokeWidth={1.5} color="var(--lg)" />
          <div style={{ marginTop: 12, fontSize: 14 }}>No tienes notificaciones por ahora.</div>
        </div>
      )}
      {notifs.map((n) => (
        <div key={n.id} className={`ni-item ${!n.read ? "unread" : ""}`} onClick={() => onSelect(n)}>
          <div className={`ni-ic ${n.type}`}>{(() => { const Ic = n.icon; return <Ic size={18} strokeWidth={1.5} color="#2D5A3D" />; })()}</div>
          <div className="ni-body"><div className="ni-title">{n.title}</div><div className="ni-text">{n.body}</div><div className="ni-time">{n.time}</div></div>
          {!n.read && <div className="ni-dot" />}
        </div>
      ))}
    </>
  );
}

function NotifsView({ notifs, onSelect, onMarkAll }) {
  return (
    <div className="npage fu">
      <div className="npage-h"><h2>Notificaciones</h2><button onClick={onMarkAll}>Marcar leído</button></div>
      <NotifList notifs={notifs} onSelect={onSelect} />
    </div>
  );
}

function TripsView({ go, onSelectTrip, trips }) {
  const [f, setF] = useState("all");
  const list = f === "all" ? trips : trips.filter((t) => t.status === f);
  return (
    <div className="tp-page fu">
      <div className="tp-h"><h2>Mis reservas</h2><p>{trips.length} reservas</p></div>
      <div className="tp-tabs">{[{ id: "all", l: "Todos" }, { id: "upcoming", l: "Próximos" }, { id: "completed", l: "Completados" }].map((x) => <button key={x.id} className={`tp-tab ${f === x.id ? "on" : ""}`} onClick={() => setF(x.id)}>{x.l}</button>)}</div>
      {list.map((trip) => (
        <div key={trip.id}>
          <div className="tp-card" onClick={() => { onSelectTrip(trip); go("trip-detail", { code: trip.code }); }}>
            <div className="tp-img" style={imgBg(trip.tour.image)} />
            <div className="tp-info"><div className="tp-name">{trip.tour.title}</div><div className="tp-det">{trip.date} · {trip.guests} pers</div><div className="tp-code">{trip.code}</div>
              <div className="tp-foot"><div className="tp-price">S/ {trip.total}</div>{(() => {
                // Estado real del inventario si existe; sin él (trips locales
                // del demo, legacy) se conserva el badge temporal de siempre.
                const st = TRIP_STATE_UI[trip.bookingState];
                // textTransform none: los textos de estado van tal cual
                // ("Confirmada", no "CONFIRMADA"); el pill los uppercaseaba.
                return st
                  ? <div className="tp-st" style={{ background: st.bg, color: st.color, textTransform: "none" }}>{st.label}</div>
                  : <div className={`tp-st tp-${trip.status}`}>{trip.status === "upcoming" ? "Próximo" : "Completado"}</div>;
              })()}</div>
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
      <button className="bk-btn tdet-back" onClick={() => go("trips")} aria-label="Volver a Mis reservas" type="button"><ArrowLeft size={20} strokeWidth={1.5} /></button>
      <h2 className="tdet-h">Tu reserva</h2>
      <VoucherDetail trip={trip} />
      {/* CTA secundario al FINAL, consistente con el voucher post-reserva: link
          discreto para dudas con la agencia (el pago pasa por Finde). Mismo link
          (buildWhatsAppLink) cableado para el trip; fallback si no hay teléfono. */}
      {(() => {
        const wa = buildWhatsAppLink(trip);
        return wa ? (
          <a className="voucher-wa" href={wa} target="_blank" rel="noopener noreferrer">
            <Smartphone size={14} strokeWidth={1.5} /> ¿Tienes consultas? Escríbele a la agencia <ArrowRight size={12} strokeWidth={1.5} />
          </a>
        ) : (
          <div className="voucher-wa" style={{ opacity: .6, cursor: "default", pointerEvents: "none" }}>
            <Smartphone size={14} strokeWidth={1.5} /> Contacto por WhatsApp no disponible
          </div>
        );
      })()}
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
    </div>
  );
}

function ProfileView({ go, onLogout }) {
  // operatorResolved, NO solo isOperator: mientras /api/me está en vuelo
  // isOperator es false y el ternario de abajo caía en "¿Ofreces tours?",
  // invitando a registrarse a quien YA es agencia. Un estado falso que parece
  // legítimo es peor que esperar, y por eso la agencia recargaba.
  const { user, isOperator, operatorResolved, refreshOperator } = useAuth();
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
  // Mismas reglas que el backend (api/operators.ts bodySchema): name 3-100,
  // phone /^\d{8,15}$/, city 2-50, ruc 11 dígitos. Evita que el front mande un
  // alta que el server rechazará con 400 genérico.
  const opNameValid = opForm.name.trim().length >= 3 && opForm.name.trim().length <= 100;
  const opEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(opForm.email.trim());
  const opPhoneValid = /^\d{8,15}$/.test(opForm.phone.trim());
  const opCityValid = opForm.city.trim().length >= 2 && opForm.city.trim().length <= 50;
  const opRucValid = /^\d{11}$/.test(opForm.ruc);
  const opFormValid = opNameValid && opEmailValid && opPhoneValid && opCityValid && opRucValid && opAcceptTerms;

  const submitOperator = async () => {
    if (!opRucValid) { setOpError("El RUC tiene 11 dígitos"); return; }
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
        if (r.status === 400) throw new Error("Revisa los datos: nombre, teléfono (8-15 dígitos), ciudad y RUC (11 dígitos).");
        if (r.status === 429) throw new Error("Demasiados intentos. Espera un momento.");
        throw new Error(err.error || "No pudimos registrar tu agencia. Intenta de nuevo.");
      }
      // Re-consulta /api/me para actualizar isOperator global (en vez de
      // setear estado local, que ya no existe).
      await refreshOperator();
      setShowOpForm(false);
    } catch (e) {
      setOpError(e.message || "Error registrando la agencia");
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
      {!operatorResolved ? (
        // Placeholder neutro del MISMO alto que la card real: sin él, resolver
        // el operador empuja el resto del perfil hacia abajo.
        <div className="pf-op-card pf-op-skel" aria-busy="true" aria-label="Cargando tu perfil de agencia">
          <div className="pf-op-left">
            <div className="pf-op-ic pf-skel-b" />
            <div>
              <div className="pf-skel-l" style={{ width: 120 }} />
              <div className="pf-skel-l" style={{ width: 168, height: 10, marginTop: 6 }} />
            </div>
          </div>
        </div>
      ) : !isOperator && !showOpForm ? (
        <div className="pf-op-card" onClick={() => setShowOpForm(true)}>
          <div className="pf-op-left">
            <div className="pf-op-ic">
              <MountainSnow size={20} strokeWidth={1.5} color="white" />
            </div>
            <div>
              <div className="pf-op-title">¿Ofreces tours?</div>
              <div className="pf-op-desc">Activa tu perfil de agencia</div>
            </div>
          </div>
          <ChevronRight size={16} strokeWidth={1.5} style={{ color: "var(--lg)" }} />
        </div>
      ) : !isOperator && showOpForm ? (
        <div className="pf-sec">
          <div className="pf-sec-t">Registrar mi agencia</div>
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
            <input className={`inp${opForm.ruc && !opRucValid ? " inp-err" : ""}`} value={opForm.ruc} onChange={(e) => updOp("ruc", e.target.value.replace(/\D/g, ""))} maxLength={11} placeholder="11 dígitos" inputMode="numeric" />
            {opForm.ruc && !opRucValid && <div className="field-err">El RUC tiene 11 dígitos</div>}
            <div style={{ fontSize: 11, color: "var(--gy)", marginTop: 6 }}>
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
            <span style={{ fontSize: 12, color: "var(--ch)" }}>
              Acepto los <span style={{ color: "var(--f)", fontWeight: 700, textDecoration: "underline" }}>Términos y Condiciones</span> de Finde y confirmo que la información proporcionada es verídica.
            </span>
          </label>
          {opError && <div className="field-err" style={{ marginBottom: 12 }}>{opError}</div>}
          <button className="mbtn" disabled={opLoading || !opFormValid} onClick={submitOperator}>
            {opLoading ? "Registrando…" : "Registrar mi agencia"}
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
              <div className="pf-op-title">Panel de agencia</div>
              <div className="pf-op-desc">Gestiona tus reservas y tus tours</div>
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
      <button className="pf-logout" onClick={() => onLogout()}>Cerrar sesión</button>
      <div className="pf-ver">finde. AI v3.0 · Hecho en Perú</div>
    </div>
  );
}

function DashView({ go, opTours, opDepartures, depsLoading, depsError, onReloadDepartures, onDepartureAction, onEditTour, onDeleteTour, onToggleActive, initialTab = "bookings", onTabConsumed, onBusinessSaved }) {
  const [tab, setTab] = useState(initialTab);
  useEffect(() => { if (onTabConsumed) onTabConsumed(); }, []);
  // Reservas reales del operador (GET /api/operators/me/bookings), hidratadas en
  // AppDemo y pasadas como prop. Etapa piloto: solo lectura (sin cambio de estado).
  // Nombre real del operador logueado (de GET /api/me vía AuthContext), en vez
  // del mock "Andes Trek Perú". DashView solo se renderiza para operadores, así
  // que operator suele estar presente; fallback defensivo por si aún no hidrata.
  const { user, operator, refreshOperator } = useAuth();
  const operatorName = operator?.name || "Mi negocio";
  const initials = (name) => (name || "?").trim().split(/\s+/).map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  const [selectedBooking, setSelectedBooking] = useState(null);

  // ── Salidas agrupadas (tab Reservas) ──
  const [expandedDeps, setExpandedDeps] = useState({});
  const [showPast, setShowPast] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // { depId, action }
  const [actionBusy, setActionBusy] = useState(null);       // depId en vuelo
  const [actionError, setActionError] = useState(null);     // { depId, msg }
  // Rechazo de UNA solicitud dentro del expandible. Estado propio (no el de la
  // salida) para que la fila muestre su pregunta, su "Rechazando…" y su error
  // sin bloquear el resto de la card.
  const [pendingBk, setPendingBk] = useState(null);         // { depId, bookingId }
  const [bkBusy, setBkBusy] = useState(null);               // bookingId en vuelo
  const [bkError, setBkError] = useState(null);             // { bookingId, msg }

  const nowIso = new Date().toISOString();
  const nowMs = Date.parse(nowIso);
  const hoy = todayISO();
  // Vigentes client-side (mismo criterio que el backend): SOLICITUD sin vencer.
  const salidas = (opDepartures || []).map((d) => ({
    ...d,
    vigentes: (d.bookings || []).filter((b) => b.bookingState === "SOLICITUD" && (!b.expiresAt || b.expiresAt > nowIso)),
    confBk: (d.bookings || []).filter((b) => b.bookingState === "CONFIRMADA"),
  }));
  const pasadas = salidas.filter((d) => d.date < hoy);
  const futuras = salidas.filter((d) => d.date >= hoy);
  // "Todo confirmado" = sin solicitudes vigentes y con confirmadas → sección
  // aparte debajo. El resto (pendientes, o solo vencidas) va arriba.
  const confirmadasSec = futuras.filter((d) => d.status === "CONFIRMADA" && d.vigentes.length === 0 && d.confBk.length > 0);
  const pendientesSec = futuras.filter((d) => !confirmadasSec.includes(d));

  const fireAction = async (d, action) => {
    setActionBusy(d.id);
    setActionError(null);
    const r = await onDepartureAction(d.id, action);
    setActionBusy(null);
    setPendingAction(null);
    if (!r?.ok) setActionError({ depId: d.id, msg: r?.error || "No se pudo completar la acción. Intenta de nuevo." });
  };

  // Rechazo individual: la misma acción "reject" acotada a una reserva. La
  // salida queda ABIERTA; si era la última vigente, los botones de salida
  // desaparecen solos porque `vig` se recalcula de d.bookings.
  const fireRejectBooking = async (d, b) => {
    setBkBusy(b.id);
    setBkError(null);
    const r = await onDepartureAction(d.id, "reject", b.id);
    setBkBusy(null);
    setPendingBk(null);
    if (!r?.ok) setBkError({ bookingId: b.id, msg: r?.error || "No se pudo rechazar la solicitud. Intenta de nuevo." });
  };

  // Reserva de una salida → shape del detalle individual (reusa la vista con
  // WhatsApp del panel; el estado real reemplaza a la etiqueta fija).
  const depBookingToDetail = (d, b) => ({
    id: b.bookingCode,
    customer: b.userName,
    phone: b.userPhone || null,
    // El backend ya mandaba userEmail y este aplanado lo tiraba: es el canal
    // alternativo cuando el teléfono no sirve para WhatsApp.
    email: b.userEmail || null,
    // null en las reservas anteriores a la columna: el detalle omite la fila.
    document: b.userDocument || null,
    date: fmtBookingDate(b.scheduledAt),
    startTime: d.startTime ?? null,
    createdAt: b.createdAt ?? null,
    guests: b.guests,
    amount: (b.totalSoles || 0) / 100,
    tour: d.tour?.title || "",
    bookingState: b.bookingState,
    status: b.status,
  });

  const renderSalida = (d) => {
    const esPasada = d.date < hoy;
    const vig = d.vigentes;
    const vigPersonas = vig.reduce((s, b) => s + (b.guests || 0), 0);
    const vigTotal = vig.reduce((s, b) => s + (b.totalSoles || 0), 0) / 100;
    const confPersonas = d.confBk.reduce((s, b) => s + (b.guests || 0), 0);
    const confTotal = d.confBk.reduce((s, b) => s + (b.totalSoles || 0), 0) / 100;
    // expiresAt más próximo entre las vigentes: es el plazo real que le queda a
    // la agencia para decidir la salida entera (comparación lexicográfica de
    // ISO, que ordena igual que cronológicamente).
    const proxExpira = vig.reduce(
      (min, b) => (b.expiresAt && (!min || b.expiresAt < min) ? b.expiresAt : min),
      null
    );
    const esCupoFijo = d.tour?.salesMode === "CUPO_FIJO";
    const cupoEfectivo = d.allotmentOverride ?? d.tour?.allotment ?? null;
    const quorum = !esCupoFijo ? (d.tour?.minQuorum ?? null) : null;
    // Personas que viajarían si la agencia confirma hoy: confirmadas + vigentes.
    const personasQuorum = (d.seatsTaken || 0) + vigPersonas;
    const expanded = !!expandedDeps[d.id];
    const pend = pendingAction && pendingAction.depId === d.id ? pendingAction : null;
    // Exclusividad de decisión: una sola pregunta abierta en pantalla a la vez.
    // Con la pregunta de una reserva abierta se ocultan las acciones de la
    // SALIDA, y con la de la salida abierta se ocultan las de cada fila. Sin
    // esto quedaban cuatro botones juntos sin decir a qué alcance pertenece
    // cada uno, y rechazar la salida entera creyendo rechazar una sola reserva
    // es un error irreversible que dispara correos a todos los viajeros.
    const pendBkCard = pendingBk && pendingBk.depId === d.id ? pendingBk : null;
    const busy = actionBusy === d.id;
    const err = actionError && actionError.depId === d.id ? actionError.msg : "";
    const n = (d.bookings || []).length;
    return (
      <div className="sal-card" key={d.id}>
        <div className="sal-date">{cap1(formatLongDate(d.date))}{d.startTime ? ` · ${d.startTime}` : ""}</div>
        <div className="sal-tour">{d.tour?.title || ""}</div>
        {vig.length > 0 && (
          <div className="sal-line">{vig.length} solicitud{vig.length === 1 ? "" : "es"} · {vigPersonas} persona{vigPersonas === 1 ? "" : "s"} · S/ {vigTotal.toLocaleString("es-PE")}</div>
        )}
        {d.confBk.length > 0 && (
          <div className={vig.length > 0 ? "sal-meta" : "sal-line"}>{d.confBk.length} reserva{d.confBk.length === 1 ? "" : "s"} confirmada{d.confBk.length === 1 ? "" : "s"} · {confPersonas} persona{confPersonas === 1 ? "" : "s"} · S/ {confTotal.toLocaleString("es-PE")}</div>
        )}
        {esCupoFijo ? (cupoEfectivo != null && (
          <div className="sal-meta" style={d.isFull ? { color: "var(--tr)", fontWeight: 700 } : undefined}>
            {d.isFull ? "Salida llena · " : ""}{d.seatsTaken} de {cupoEfectivo} cupos tomados
          </div>
        )) : (proxExpira && (() => {
          // Cuenta regresiva del plazo para confirmar: siempre visible mientras
          // haya solicitudes vigentes, no solo cuando está por vencer.
          const p = plazoConfirmacion(proxExpira, nowMs);
          if (!p) return null;
          return <div className={`sal-meta${p.level ? ` sal-plazo ${p.level}` : ""}`}>{p.text}</div>;
        })())}
        {quorum != null && personasQuorum < quorum && (
          <div className="sal-meta">Tienes {personasQuorum} de {quorum} personas para el mínimo</div>
        )}
        {err && <div className="field-err" style={{ marginTop: 10 }}>{err}</div>}
        {vig.length > 0 && !esPasada && (pend ? (
          <div style={{ marginTop: 12 }}>
            {/* Confirmar habla de PERSONAS (el dato con el que la agencia
                consigue el bus), no de reservas. Rechazar habla de solicitudes,
                que es lo que realmente se rechaza. */}
            <div className="sal-q">{pend.action === "confirm"
              ? `¿Confirmas la salida del ${fmtDiaFecha(d.date)} con ${vigPersonas} persona${vigPersonas === 1 ? "" : "s"}?`
              : `¿Rechazas ${vig.length === 1 ? "la solicitud" : `las ${vig.length} solicitudes`} de la salida del ${fmtDiaFecha(d.date)}?`}</div>
            <div className="sal-actions" style={{ marginTop: 0 }}>
              <button className={`sal-btn ${pend.action === "confirm" ? "pri" : "sec"}`} disabled={busy} onClick={() => fireAction(d, pend.action)}>
                {busy ? (pend.action === "confirm" ? "Confirmando…" : "Rechazando…") : (pend.action === "confirm" ? "Sí, confirmar" : "Sí, rechazar")}
              </button>
              <button className="sal-btn sec" disabled={busy} onClick={() => setPendingAction(null)}>Volver</button>
            </div>
          </div>
        ) : !pendBkCard && (
          <div className="sal-actions">
            <button className="sal-btn pri" onClick={() => { setActionError(null); setPendingBk(null); setPendingAction({ depId: d.id, action: "confirm" }); }}>Confirmar salida</button>
            <button className="sal-btn sec" onClick={() => { setActionError(null); setPendingBk(null); setPendingAction({ depId: d.id, action: "reject" }); }}>Rechazar</button>
          </div>
        ))}
        {n > 0 && (
          <button className="sal-toggle" onClick={() => setExpandedDeps((p) => ({ ...p, [d.id]: !p[d.id] }))}>
            <span style={{ fontSize: 10 }}>{expanded ? "▾" : "▸"}</span> {n === 1 ? "Ver la reserva" : `Ver las ${n} reservas`}
          </button>
        )}
        {expanded && (d.bookings || []).map((b) => {
          const st = bookingStateUI(b);
          // Solo las VIGENTES se pueden rechazar de a una (mismo criterio que
          // usa la card y que aplica el backend). Las confirmadas, vencidas,
          // rechazadas y canceladas no muestran el botón.
          const esVigente = vig.some((v) => v.id === b.id);
          const pendB = pendingBk && pendingBk.bookingId === b.id ? pendingBk : null;
          const bBusy = bkBusy === b.id;
          const bErr = bkError && bkError.bookingId === b.id ? bkError.msg : "";
          return (
            <div key={b.id}>
              <div className="sal-bk" onClick={() => setSelectedBooking(depBookingToDetail(d, b))}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.userName}</div>
                  <div style={{ fontSize: 11, color: "var(--gy)", marginTop: 1 }}>{b.bookingCode} · {b.guests} pers</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "var(--f)" }}>S/ {((b.totalSoles || 0) / 100).toLocaleString("es-PE")}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: st.color, marginTop: 1 }}>{st.label}</div>
                </div>
              </div>
              {bErr && <div className="field-err" style={{ marginBottom: 8 }}>{bErr}</div>}
              {esVigente && !esPasada && !pend && (pendB ? (
                <div className="sal-bk-q-box">
                  <div className="sal-bk-q">¿Rechazas la solicitud de {b.userName}?</div>
                  <div className="sal-bk-actions">
                    <button className="sal-btn sec" disabled={bBusy} onClick={() => fireRejectBooking(d, b)}>
                      {bBusy ? "Rechazando…" : "Sí, rechazar"}
                    </button>
                    <button className="sal-btn sec" disabled={bBusy} onClick={() => setPendingBk(null)}>Volver</button>
                  </div>
                </div>
              ) : (
                <button className="sal-bk-rej" onClick={() => { setBkError(null); setPendingAction(null); setPendingBk({ depId: d.id, bookingId: b.id }); }}>
                  Rechazar esta solicitud
                </button>
              ))}
            </div>
          );
        })}
      </div>
    );
  };

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
        if (r.status === 404) throw new Error("No encontramos tu perfil de agencia.");
        if (r.status === 429) throw new Error("Demasiados intentos. Espera un momento.");
        if (r.status === 400) throw new Error("Revisa los datos: RUC de 11 dígitos y teléfono de 8 a 15.");
        throw new Error("No pudimos guardar los cambios. Intenta de nuevo.");
      }
      await refreshOperator();
      // Refrescar catálogos: el nombre del operador se lee por join vivo pero el
      // front lo aplana y cachea en `tours` (detalle/voucher del viajero) y
      // `opTours` (cards del dashboard). Sin esto, el nombre nuevo no aparece
      // hasta un reload. Solo en el camino de éxito (tras PATCH ok).
      await onBusinessSaved?.();
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
        if (r.status === 404) throw new Error("No encontramos tu perfil de agencia.");
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
  // Cuál tour tiene un PATCH en vuelo. Es el mismo patrón de bizBusy/mincBusy y
  // faltaba solo acá: sin esto, un segundo clic sobre el interruptor lee el
  // estado que la actualización optimista YA cambió y manda el cuerpo CONTRARIO,
  // así que salen dos peticiones opuestas y gana la que responda última.
  const [togglingId, setTogglingId] = useState(null);
  const handleToggle = async (t) => {
    if (togglingId !== null) return;
    setToggleErr("");
    setTogglingId(t.id);
    try {
      const r = await onToggleActive(t);
      if (!r?.ok) setToggleErr(r?.error || "No pudimos actualizar el estado del tour.");
    } finally {
      setTogglingId(null);
    }
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
        <div className="dsh-gr">Panel de agencia <Hand size={18} strokeWidth={1.5} style={{display:"inline",verticalAlign:"middle"}} /></div>
        <div className="dsh-nm">{operatorName}</div>
        <div className="dsh-sts">
          <div className="dsh-s"><div className="dsh-s-v">{opTours.filter((t) => t.active).length}</div><div className="dsh-s-l">Tours activos</div></div>
          {/* Total de reservas del panel: suma sobre las salidas (toda reserva
              vive en una salida; ver verificación de la fase de inventario). */}
          <div className="dsh-s"><div className="dsh-s-v">{salidas.reduce((s, d) => s + (d.bookings || []).length, 0)}</div><div className="dsh-s-l">Reservas</div></div>
          {/* Stat "Rating" oculto en la etapa piloto: no hay modelo Review ni ratings
              reales (los del seed son siembra). Reactivar cuando exista reseñas reales. */}
        </div>
      </div>

      <div className="dsh-tabs fd1">
        {/* Tab "Ingresos" oculta en la etapa piloto: sin gateway de pago no hay
            ingresos reales que mostrar (los datos eran mock). Reactivar cuando se cobre. */}
        {[{ id: "bookings", l: "Reservas" }, { id: "business", l: "Mi negocio" }, { id: "listings", l: "Mis tours" }].map((t) => (
          <button key={t.id} className={`dsh-tab ${tab === t.id ? "on" : ""}`} onClick={() => { setTab(t.id); setSelectedBooking(null); }}>{t.l}</button>
        ))}
      </div>

      {/* ── RESERVAS (agrupadas por salida) ── */}
      {tab === "bookings" && !selectedBooking && <div className="fu">
        {depsLoading ? (
          <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--gy)", fontSize: 13 }}>Cargando tus salidas…</div>
        ) : depsError ? (
          <div style={{ textAlign: "center", padding: "48px 24px" }}>
            <div style={{ fontSize: 13, color: "var(--tr)", marginBottom: 12 }}>{depsError}</div>
            <button className="sal-btn sec" style={{ flex: "none", padding: "10px 18px" }} onClick={() => onReloadDepartures?.()}>Reintentar</button>
          </div>
        ) : salidas.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--gy)" }}>
            <Smartphone size={28} strokeWidth={1.5} style={{ color: "var(--lg)", marginBottom: 12 }} />
            <div style={{ fontWeight: 700, fontSize: 15, color: "var(--ch)", marginBottom: 6 }}>Aún no tienes reservas</div>
            <div style={{ fontSize: 13 }}>Cuando un viajero reserve uno de tus tours, aparecerá aquí y podrás coordinar con él por WhatsApp.</div>
          </div>
        ) : (
          <>
            {pendientesSec.map(renderSalida)}
            {confirmadasSec.length > 0 && (
              <>
                <div className="sal-sec-t">Confirmadas</div>
                {confirmadasSec.map(renderSalida)}
              </>
            )}
            {pasadas.length > 0 && (
              <button className="sal-toggle" style={{ paddingTop: 14 }} onClick={() => setShowPast((v) => !v)}>
                <span style={{ fontSize: 10 }}>{showPast ? "▾" : "▸"}</span> {showPast ? "Ocultar salidas pasadas" : `Ver pasadas (${pasadas.length})`}
              </button>
            )}
            {showPast && pasadas.map(renderSalida)}
          </>
        )}
      </div>}

      {/* ── DETALLE DE RESERVA ── */}
      {tab === "bookings" && selectedBooking && (() => {
        // El objeto ya llega completo desde la fila de la salida (no hay lista
        // plana que buscar); el estado real reemplaza a la etiqueta fija.
        const b = selectedBooking;
        const st = bookingStateUI(b);
        return (
          <div className="fu" style={{ padding: "0 16px 32px" }}>
            <button onClick={() => setSelectedBooking(null)}
              style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", padding: "12px 0", display: "block", color: "var(--ch)" }}><ArrowLeft size={20} strokeWidth={1.5} /></button>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginBottom: 24 }}>
              <div className="dsh-bk-av" style={{ width: 64, height: 64, fontSize: 22, background: "var(--m)" }}>
                {initials(b.customer)}
              </div>
              <div style={{ fontWeight: 800, fontSize: 18, lineHeight: 1.35 }}>{b.customer}</div>
              {/* textTransform none: los textos de estado van tal cual
                  ("Confirmada", no "CONFIRMADA"); el pill los uppercaseaba. */}
              <div className="dsh-bk-s" style={{ color: st.color, textTransform: "none", letterSpacing: 0, fontSize: 12 }}>{st.label}</div>
            </div>
            <div className="sum">
              {/* Tres bloques: la salida, quién viaja, y el registro/pago.
                  Los datos del viajero van juntos y rotulados porque son los
                  que la agencia copia al registro de pasajeros. Toda fila sin
                  dato se omite (reservas anteriores a la columna documento). */}
              {[
                { rows: [
                  ["Código", b.id],
                  ["Tour", b.tour],
                  ["Fecha", b.date],
                  ...(b.startTime ? [["Hora de salida", b.startTime]] : []),
                  ["Personas", `${b.guests} personas`],
                ] },
                { title: "Datos del viajero", rows: [
                  ...(b.customer ? [["Nombre completo", b.customer]] : []),
                  ...(b.document ? [["Documento", b.document]] : []),
                  // Tal cual lo escribió el viajero: el normalizado con
                  // prefijo de país existe solo para el enlace de wa.me.
                  ...(b.phone ? [["Teléfono", b.phone]] : []),
                  ...(b.email ? [["Email", b.email]] : []),
                ] },
                { rows: [
                  ...(b.createdAt ? [["Reservado el", fmtDateTime(b.createdAt)]] : []),
                ] },
              ].filter((g) => g.rows.length > 0).map((g, gi) => (
                <div key={g.title || gi} className={gi > 0 ? "sum-g" : undefined}>
                  {g.title && <div className="sum-h">{g.title}</div>}
                  {g.rows.map(([l, v]) => (
                    <div key={l} className="sum-r">
                      <span style={{ color: "var(--gy)", flexShrink: 0, marginRight: 12 }}>{l}</span>
                      {/* break-word + minWidth 0: un email o documento largo
                          envuelve dentro de la fila en vez de empujarla fuera
                          del ancho del móvil. */}
                      <span style={{ fontWeight: 600, minWidth: 0, textAlign: "right", wordBreak: "break-word" }}>{v}</span>
                    </div>
                  ))}
                </div>
              ))}
              <div className="sum-t"><span>Total</span><span>S/ {b.amount.toLocaleString("es-PE")}</span></div>
            </div>
            {toIntlPhone(b.phone) ? (
              <a href={`https://wa.me/${toIntlPhone(b.phone)}`}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  padding: "13px 0", borderRadius: 14, background: "#25D366", color: "white",
                  fontWeight: 700, fontSize: 14, textDecoration: "none", marginBottom: 10 }}>
                <Smartphone size={16} strokeWidth={1.5} /> Contactar por WhatsApp
              </a>
            ) : (
              <div style={{ textAlign: "center", padding: "12px 0", color: "var(--gy)", fontSize: 13 }}>
                {/* Describe lo que pasó sin culpar al dato del viajero, y
                    deriva al canal que sí existe (el email está arriba). */}
                {b.phone
                  ? "No pudimos abrir WhatsApp con este número. Escríbele por email."
                  : "Esta reserva no tiene teléfono. Escríbele por email."}
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
              <div style={{ fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif", fontSize: 18, color: "var(--ch)", fontWeight: 700, lineHeight: 1.15 }}>{operator?.name || "Mi negocio"}</div>
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
                <div style={{ fontSize: 11, color: "var(--gy)", marginTop: 4 }}>Email de tu cuenta · no editable.</div>
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
                <span className="biz-badge ok"><Check size={12} strokeWidth={2} /> Finde Verificado</span>
              </div>
              <div style={{ fontSize: 13, color: "var(--ch)" }}>Tu negocio está verificado. Tus tours muestran el sello “Finde Verificado”.</div>
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
              <div style={{ fontSize: 13, color: "var(--ch)" }}>Recibimos tu N° MINCETUR y lo estamos validando. Te avisaremos cuando la verificación esté lista; mientras tanto tus tours ya pueden publicarse.</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--sd)" }}>
                <div style={{ fontSize: 12, color: "var(--gy)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>N° MINCETUR: <strong style={{ color: "var(--ch)" }}>{operator.mincetur}</strong></div>
                <button onClick={startMincInput} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", color: "var(--f)", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}><Pencil size={13} strokeWidth={1.5} /> Editar</button>
              </div>
            </div>
          ) : (
            // ── Sin enviar (o editando): CTA + input ──
            <div style={{ padding: 14, borderRadius: 12, background: "rgba(212,168,67,.08)", borderLeft: "3px solid var(--gd)" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ch)", marginBottom: 6 }}>Verifica tu agencia</div>
              <div style={{ fontSize: 13, color: "var(--ch)", marginBottom: 12 }}>Envía tu N° de registro MINCETUR para que Finde verifique tu agencia. Al verificarte, tus tours muestran el sello “Finde Verificado”.</div>
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
        {opTours.map((t) => {
          // OJO CON EL NOMBRE DE LA PORTADA. El objeto de esta tarjeta la llama
          // `image`, no `imageUrl`: el payload del API pasa por mapTourFromApi
          // (imageUrl -> image) y el mapeo del dashboard mantiene `image`. Si
          // se le pasara `t.imageUrl` llegaría undefined y el aviso diría que
          // falta la foto en tours que sí la tienen. Verificado contra la
          // respuesta real de /api/operators/me/tours el 2026-08-17.
          const falta = faltaParaPublicar({
            shortPitch: t.shortPitch,
            description: t.description,
            imageUrl: t.image,
          });
          // Solo estorba para PUBLICAR. Un tour ya publicado se puede pausar
          // siempre, igual que la guarda del servidor, que solo mira el pedido
          // de active:true.
          const bloqueado = !t.active && falta.length > 0;
          const ocupado = togglingId === t.id;
          return (
          <div key={t.id} className="dsh-ls" style={{ flexDirection: "column", gap: 0, padding: 0, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 12 }}>
              <div className="dsh-ls-img" style={{ ...imgBg(t.image), flexShrink: 0 }} />
              <div className="dsh-ls-i" style={{ flex: 1, minWidth: 0 }}>
                <div className="dsh-ls-t" style={{ opacity: t.active ? 1 : 0.45 }}>{t.title}</div>
                <div className="dsh-ls-m">{t.location} · {t.duration}</div>
                <div className="dsh-ls-sts">
                  {t.reviews > 0 ? (
                    <>
                      <div className="dsh-ls-st"><Star size={13} strokeWidth={1.5} fill="currentColor" /> <span className="v">{t.rating}</span></div>
                      <div className="dsh-ls-st"><MessageCircle size={13} strokeWidth={1.5} /> <span className="v">{t.reviews}</span></div>
                    </>
                  ) : (
                    <div className="dsh-ls-st"><span className="v">Nuevo</span></div>
                  )}
                  <div className="dsh-ls-st">S/ <span className="v">{t.price}</span></div>
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleToggle(t); }}
                disabled={bloqueado || ocupado}
                aria-label={bloqueado
                  ? "No se puede publicar: al tour le falta información"
                  : t.active ? "Pausar este tour" : "Publicar este tour"}
                style={{
                  width: 44, height: 24, borderRadius: 12, flexShrink: 0, border: "none", padding: 0,
                  background: t.active ? "var(--f)" : "var(--lg)",
                  position: "relative", transition: "background .2s, opacity .2s",
                  cursor: bloqueado ? "not-allowed" : ocupado ? "wait" : "pointer",
                  opacity: bloqueado ? 0.45 : ocupado ? 0.6 : 1
                }}>
                <div style={{
                  position: "absolute", top: 3, width: 18, height: 18, borderRadius: "50%",
                  background: "white", transition: "left .2s", pointerEvents: "none",
                  left: t.active ? 23 : 3
                }} />
              </button>
            </div>
            {/* El motivo va VISIBLE en la tarjeta, no en un tooltip: en un
                celular no hay hover, y el control es un interruptor sin
                etiqueta donde no habría dónde colgarlo. Mismo criterio que el
                aviso de solicitudes pendientes del paso 3 del formulario.
                Se listan TODAS las condiciones que fallan, no la primera: un
                tour puede fallar las tres y la agencia tiene que verlas juntas
                en vez de descubrirlas de a una. */}
            {bloqueado && (
              <div className="notice" style={{ margin: "0 12px 12px" }}>
                <div className="notice-t">Para publicarlo falta:</div>
                <div className="notice-d">
                  <ul style={{ margin: "4px 0 0", paddingLeft: 16 }}>
                    {falta.map((f) => <li key={f}>{f}</li>)}
                  </ul>
                  <div style={{ marginTop: 6 }}>Edítalo para completarlo.</div>
                </div>
              </div>
            )}
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
          );
        })}
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
            <div style={{ fontSize: 13, color: "var(--gy)", marginBottom: 16 }}>
              "{confirmDel.title}" se eliminará de forma permanente. Esta acción no se puede deshacer.
              {" "}Si el tour tiene reservas no se podrá borrar: en ese caso, pausalo para ocultarlo del catálogo sin perder las reservas.
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
  // Galería (sub-paso 3). Coerciona un valor de imagen (URL cruda o "url(...)"
  // del display) a URL http(s); null si no es válida.
  const rawImageUrl = (s) => {
    if (typeof s !== "string") return null;
    const m = s.match(/^url\((.*)\)$/);
    const v = (m ? m[1] : s).trim();
    return /^https?:\/\//i.test(v) ? v : null;
  };
  // Galería inicial: si el tour ya trae images[], se usan; si no, su portada
  // suelta (tours legacy con una sola foto). Portada inicial = imageUrl del
  // tour, garantizada dentro de la galería; por defecto, la primera.
  const initCover = isEditing
    ? (rawImageUrl(editingTour.photo) || rawImageUrl(editingTour.image))
    : null;
  const initImages = isEditing
    ? (Array.isArray(editingTour.images) && editingTour.images.length
        ? editingTour.images.filter((url) => /^https?:\/\//i.test(url))
        : (initCover ? [initCover] : []))
    : [];
  const initPhoto =
    initCover && initImages.includes(initCover) ? initCover : (initImages[0] ?? null);
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
    shortPitch: editingTour.shortPitch || "",
    included: editingTour.included || "",
    excluded: editingTour.excluded || "",
    days: editingTour.days || [],
    excludedDates: editingTour.excludedDates || [],
    addedDates: editingTour.addedDates || [],
    startTime: editingTour.startTime || "08:00",
    cancellation: editingTour.cancellation || "flexible",
    // Config de venta (fase panel de salidas): prefill con los valores reales
    // del tour; los numéricos van como string (patrón price/capacity).
    salesMode: editingTour.salesMode || "SOLICITUD",
    allotment: editingTour.allotment != null ? String(editingTour.allotment) : "",
    closeTime: editingTour.closeTime || "20:00",
    minQuorum: editingTour.minQuorum != null ? String(editingTour.minQuorum) : "",
    // Galería (sub-paso 3): images[] = fotos en orden; photo = portada (una de
    // ellas). Se cargan del tour existente para que el editor muestre la galería
    // actual con su portada marcada y, si no se toca, el backend la preserve.
    images: initImages,
    photo: initPhoto,
  } : {
    title: "", location: "", meetingPoint: "", category: "adventure", duration: "", price: "",
    capacity: "", difficulty: "Moderada", description: "", shortPitch: "", included: "", excluded: "",
    days: [], excludedDates: [], addedDates: [], startTime: "08:00", cancellation: "flexible",
    // Default de venta para tour NUEVO: confirmación automática (CUPO_FIJO).
    // No coincide con el default del motor (SOLICITUD) a propósito: ese sigue
    // rigiendo a los tours existentes, que no cambian de modo. closeTime 20:00
    // queda precargado por si la agencia elige confirmación manual.
    salesMode: "CUPO_FIJO", allotment: "", closeTime: "20:00", minQuorum: "",
    images: [], photo: null
  });
  // { description, shortPitch }. Antes acá solo se guardaba la descripción y el
  // shortPitch que el endpoint ya devolvía se tiraba, que es la razón de fondo
  // por la que ningún tour cargado por formulario lo tiene.
  const [aiDesc, setAiDesc] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [published, setPublished] = useState(false);
  // Sub-paso 2.5: estado del submit de creación (POST /api/tours es async; el
  // embedding agrega 1-2s). El modo edición (2.6) sigue siendo síncrono.
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  // Si el POST creó el tour pero falló el PATCH de la config de venta, acá
  // queda el id creado: el reintento hace solo el PATCH (nunca duplica el POST).
  const [createdTourId, setCreatedTourId] = useState(null);
  // Sub-paso 3: subida MÚLTIPLE de fotos (Flujo A — cada archivo va directo a
  // Supabase Storage con su propia signed URL que emite el backend). `progress`
  // surfacea "Subiendo X/Y…".
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  // Aviso, no error: la foto entró igual. Ver handlePhotoUpload.
  const [fotoChicaAviso, setFotoChicaAviso] = useState("");
  const [uploadProgress, setUploadProgress] = useState(null); // { done, total } | null
  const [dragOver, setDragOver] = useState(false); // feedback visual del drag-and-drop
  // Solicitudes vigentes del tour que se está editando. Viene en el payload de
  // GET /api/operators/me/tours, así que no cuesta una llamada extra. En un
  // tour nuevo no hay reservas: 0, y la opción nunca se bloquea.
  const pendientes = editingTour?.pendingRequests ?? 0;
  const u = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const MAX_GALLERY = 8; // tope de fotos por tour.
  // El tope de tamaño y los tipos admitidos viven en lib/image-resize.js: como
  // la foto se achica ANTES de subir, el límite que importa es el de ENTRADA
  // (25 MB, para no colgar el navegador decodificando), no el del bucket.
  const mbs = (bytes) => (bytes / 1048576).toFixed(1);

  // Sube una sola foto y devuelve su URL pública (reusa el endpoint de signed
  // URL; el archivo nunca pasa por la function → esquiva el límite de Vercel).
  // Antes de subir, la achica a 1600 px y la recomprime: lo que viaja son ~150 kB
  // en vez de los 4 MB que salen del celular. Ver lib/image-resize.js.
  const uploadOnePhoto = async (file) => {
    const img = await resizeImageForUpload(file);
    const r = await authFetch("/api/uploads/tour-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // El contentType es el de SALIDA, no el del archivo elegido: un PNG que se
      // recomprimió sale como image/jpeg y la extensión del bucket se deriva de
      // acá. Mandar el de entrada guardaría un JPEG con nombre .png.
      body: JSON.stringify({ contentType: img.contentType }),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${r.status}`);
    }
    const { token, path, publicUrl } = await r.json();
    const { error: upErr } = await supabase.storage
      .from("tour-images")
      // contentType explícito: un Blob sin tipo declarado se guarda como
      // application/octet-stream (hay uno así en el bucket, de antes de esto).
      .uploadToSignedUrl(path, token, img.blob, { contentType: img.contentType });
    if (upErr) throw new Error(upErr.message || "No se pudo subir la imagen");
    // Devuelve también si quedó por debajo del piso de la tarjeta grande: el
    // dato lo tiene el redimensionado, y el aviso lo arma el llamador, que es
    // el que conoce el lote entero.
    return { url: publicUrl, chica: img.chicaParaCompartir };
  };

  // Sube N archivos en LOOP y los acumula en form.images. Si no había portada,
  // la primera foto subida queda como portada (form.photo). Respeta el tope
  // MAX_GALLERY y valida tipo/tamaño de cada archivo ANTES de subir.
  const handlePhotoUpload = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    setUploadError("");
    setFotoChicaAviso("");
    // Las que quedan por debajo del piso de la tarjeta grande. Se juntan acá
    // porque uploadOnePhoto sube de a una y el aviso es del lote.
    const fotosChicas = [];
    const remaining = MAX_GALLERY - form.images.length;
    if (remaining <= 0) {
      setUploadError(`Ya alcanzaste el máximo de ${MAX_GALLERY} fotos.`);
      return;
    }
    const toUpload = files.slice(0, remaining);
    const overflow = files.length - toUpload.length;
    // Validar TODO el lote antes de subir nada (UX: no subir a medias por uno malo).
    // Los mensajes NOMBRAN el archivo: antes decían "una imagen" y la agencia
    // tenía que adivinar cuál de las cinco era.
    for (const file of toUpload) {
      if (!ALLOWED_INPUT_TYPES.includes(file.type)) {
        setUploadError(`"${file.name}" no es JPG ni PNG. Quítala y vuelve a intentar.`);
        return;
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        setUploadError(`"${file.name}" pesa ${mbs(file.size)} MB y el máximo es ${mbs(MAX_UPLOAD_BYTES)} MB. Quítala y vuelve a intentar.`);
        return;
      }
    }
    setUploading(true);
    const uploaded = [];
    try {
      for (let i = 0; i < toUpload.length; i++) {
        setUploadProgress({ done: i, total: toUpload.length });
        const subida = await uploadOnePhoto(toUpload[i]);
        uploaded.push(subida.url);
        if (subida.chica) fotosChicas.push(toUpload[i].name);
      }
    } catch (e) {
      setUploadError(e.message || "No pudimos subir algunas fotos. Intenta de nuevo.");
    } finally {
      // Persistir lo que SÍ subió (subida parcial no se pierde).
      if (uploaded.length) {
        setForm(prev => {
          const images = [...prev.images, ...uploaded];
          return { ...prev, images, photo: prev.photo || images[0] || null };
        });
      }
      if (overflow > 0) {
        setUploadError(`Solo se subieron ${toUpload.length}: el máximo es ${MAX_GALLERY} fotos.`);
      }
      // AVISO, no error: la foto se subió y el tour se puede publicar igual. Lo
      // único que pasa es que la tarjeta de WhatsApp va a salir chica, y eso la
      // agencia lo puede decidir. Bloquear acá sería trabar por algo que no
      // rompe nada.
      if (fotosChicas.length > 0) {
        const una = fotosChicas.length === 1;
        setFotoChicaAviso(
          `${una ? "La foto" : `${fotosChicas.length} fotos`} ${una ? `"${fotosChicas[0]}" mide` : "miden"} menos de ${OG_MIN_WIDTH}x${OG_MIN_HEIGHT}. ` +
          `Se ${una ? "subió" : "subieron"} igual, pero al compartir el tour la vista previa va a salir chica. Una foto más grande se ve mejor.`
        );
      }
      setUploading(false);
      setUploadProgress(null);
    }
  };

  // Quita una foto de la galería. Si era la portada, la portada pasa a la
  // primera restante (o null si no quedan).
  const removePhoto = (url) => setForm(prev => {
    const images = prev.images.filter((x) => x !== url);
    const photo = prev.photo === url ? (images[0] || null) : prev.photo;
    return { ...prev, images, photo };
  });

  // Marca una foto como portada (debe ser una de form.images).
  const makeCover = (url) => setForm(prev => ({ ...prev, photo: url }));

  const generateAiDesc = async () => {
    if (!form.title || !form.location) return;
    setAiLoading(true);
    setAiError("");
    setAiDesc(null);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
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
      // authFetch, no fetch: el endpoint pasó a exigir perfil de agencia
      // (es una llamada paga a Claude). Sin el header Authorization responde
      // 401 y el botón dejaría de funcionar.
      const r = await authFetch("/api/ai/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (!r.ok) {
        // 401/403 con texto propio: el del backend dice "operador", que no
        // existe en la interfaz. Con la sesión vencida el mensaje tiene que
        // decir qué hacer, no repetir el código de estado.
        if (r.status === 401) throw new Error("Tu sesión venció. Vuelve a entrar y genera la descripción de nuevo.");
        if (r.status === 403) throw new Error("Necesitas un perfil de agencia para usar el generador.");
        const err = await r.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${r.status}`);
      }
      const data = await r.json();
      setAiDesc({ description: data.description || "", shortPitch: data.shortPitch || "" });
    } catch (e) {
      setAiError(e.name === "AbortError"
        ? "La generación tardó demasiado. Intenta de nuevo."
        : e.message || "No pudimos generar la descripción. Intenta de nuevo.");
    } finally {
      clearTimeout(timeoutId);
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
  // Mismo rango que lib/tour-input.ts. El tope de 80 es además el que ya valida
  // el generador de IA, así que "Usar esta" nunca produce un valor inválido.
  const pitchLen = (form.shortPitch || "").trim().length;
  const pitchValid = pitchLen >= PITCH_MIN && pitchLen <= PITCH_MAX;

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
          <label className="lbl" htmlFor="nt-title">Nombre del tour <span style={{ color: "var(--tr)" }}>*</span></label>
          <input
            id="nt-title"
            className={`inp${(form.title || "").trim().length > 0 && (form.title || "").trim().length < 3 ? " inp-err" : ""}`}
            placeholder="Ej: Trekking al Nevado Pastoruri"
            value={form.title}
            onChange={(e) => u("title", e.target.value)}
          />
          {(form.title || "").trim().length > 0 && (form.title || "").trim().length < 3 && (
            <div className="field-err">El nombre debe tener al menos 3 caracteres</div>
          )}
          {/* AVISO y no bloqueo, a propósito. "Namora" y "Otuzco" tienen 6
              letras y son nombres reales de distritos: exigir un largo mínimo
              obligaría a la agencia a inventarle un nombre al tour, que es peor
              que el problema. El título de la página ya suma la ciudad
              ("Namora en Cajamarca | Finde"), así que esto solo sugiere. */}
          {(form.title || "").trim().length >= 3 && (form.title || "").trim().length < 15 && (
            // El ejemplo NO se arma con el título real de la agencia ni con un
            // lugar concreto. La versión anterior interpolaba su título y le
            // pegaba "bosque de piedras cerca de Cajamarca": alguien la copió tal
            // cual como título de verdad y quedó una URL huérfana en producción.
            // Un ejemplo que se lee como un dato invita a usarlo de dato.
            <div style={{ fontSize: 11, color: "var(--gy)", marginTop: 6 }}>
              Un nombre más descriptivo se encuentra mejor en Google. Súmale qué se hace o dónde queda: el lugar, la actividad y la ciudad.
            </div>
          )}
        </div>
        <div className="fg">
          <label className="lbl" htmlFor="nt-location">Ubicación <span style={{ color: "var(--tr)" }}>*</span></label>
          <input id="nt-location" className="inp" placeholder="Ej: Huaraz, Áncash" value={form.location} onChange={(e) => u("location", e.target.value)} />
        </div>
        <div className="fg">
          <label className="lbl" htmlFor="nt-meeting">Punto de encuentro <span style={{ color: "var(--tr)" }}>*</span></label>
          <div style={{ fontSize: 11, color: "var(--gy)", marginBottom: 8 }}>
            Lugar exacto donde tus viajeros te encontrarán (ej. "Frente a Larcomar, tienda Inkawasi, segundo piso")
          </div>
          <input
            id="nt-meeting"
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
          <label className="lbl" htmlFor="nt-photos">Fotos del tour <span style={{ color: "var(--gy)", fontWeight: 500 }}>(opcional)</span></label>
          <div style={{ fontSize: 11, color: "var(--gy)", marginBottom: 10 }}>
            La portada (marcada con <Star size={10} strokeWidth={2} fill="currentColor" style={{ display: "inline", verticalAlign: "middle", color: "var(--gd)" }} />) se muestra en el listado. Puedes subir hasta {MAX_GALLERY}; el orden de la galería es el de subida.
          </div>
          {/* Grilla de miniaturas: portada marcada, X para quitar, "Hacer portada". */}
          {form.images.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 10 }}>
              {form.images.map((url) => {
                const isCover = url === form.photo;
                return (
                  <div key={url} style={{
                    position: "relative", height: 90, borderRadius: 12, overflow: "hidden",
                    ...imgBg(url), border: isCover ? "2px solid var(--gd)" : "2px solid transparent"
                  }}>
                    {isCover && (
                      <span style={{
                        position: "absolute", top: 6, left: 6, display: "inline-flex", alignItems: "center", gap: 3,
                        padding: "2px 7px", borderRadius: 100, background: "var(--gd)", color: "white",
                        fontSize: 9, fontWeight: 700
                      }}><Star size={9} strokeWidth={2} fill="currentColor" /> Portada</span>
                    )}
                    <button onClick={(e) => { e.preventDefault(); removePhoto(url); }} aria-label="Quitar foto" type="button" style={{
                      position: "absolute", top: 6, right: 6, width: 22, height: 22, borderRadius: "50%",
                      background: "rgba(0,0,0,.55)", border: "none", color: "white", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit"
                    }}><X size={12} strokeWidth={2} /></button>
                    {!isCover && (
                      <button onClick={(e) => { e.preventDefault(); makeCover(url); }} type="button" style={{
                        position: "absolute", left: 0, right: 0, bottom: 0, padding: "5px 0",
                        background: "rgba(0,0,0,.55)", border: "none", color: "white", cursor: "pointer",
                        fontSize: 10, fontWeight: 700, fontFamily: "inherit",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 4
                      }}><Star size={10} strokeWidth={2} /> Hacer portada</button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {/* Subida múltiple / progreso / tope alcanzado. */}
          {uploading ? (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: 8, padding: 24, borderRadius: 16, border: "2px dashed var(--lg)", background: "var(--cr)"
            }}>
              <Camera size={28} strokeWidth={1.5} style={{ color: "var(--f)", opacity: .5 }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--f)" }}>
                {uploadProgress ? `Subiendo ${uploadProgress.done + 1}/${uploadProgress.total}…` : "Subiendo…"}
              </span>
              <span style={{ fontSize: 11, color: "var(--gy)", textAlign: "center" }}>No cierres esta pantalla.</span>
            </div>
          ) : form.images.length < MAX_GALLERY ? (
            // Zona de drop + click. El drag-and-drop es ADITIVO: reusa el mismo
            // handlePhotoUpload (valida tipo/tamaño/tope y sube en loop) que el
            // input. dragOver solo controla el feedback visual.
            <div
              role="button"
              tabIndex={0}
              aria-label="Subir fotos del tour"
              onClick={(e) => { const inp = e.currentTarget.querySelector('input[type="file"]'); if (inp && e.target !== inp) inp.click(); }}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.currentTarget.querySelector('input[type="file"]')?.click(); } }}
              onDragEnter={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handlePhotoUpload(e.dataTransfer.files); }}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                gap: 8, padding: 24, borderRadius: 16,
                border: dragOver ? "2px dashed var(--f)" : "2px dashed var(--lg)",
                cursor: "pointer", background: dragOver ? "rgba(27,58,45,.06)" : "var(--cr)",
                transition: "background .15s, border-color .15s"
              }}>
              <Camera size={28} strokeWidth={1.5} style={{ color: "var(--f)" }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--f)" }}>{form.images.length ? "Agregar más fotos" : "Subir fotos"}</span>
              {/* El tope pasa de 5 a 25 MB porque la foto se achica en el
                  navegador antes de subir: la agencia puede elegir lo que salió
                  del celular sin pensar en el tamaño. */}
              <span style={{ fontSize: 11, color: "var(--gy)", textAlign: "center" }}>Arrastra fotos aquí o haz click para elegir · hasta {MAX_GALLERY} · JPG o PNG · las achicamos por ti</span>
              {form.images.length === 0 && (
                <span style={{ fontSize: 11, color: "var(--gy)", textAlign: "center" }}>Opcional por ahora. Sin foto usamos un diseño por defecto.</span>
              )}
              <input id="nt-photos" type="file" accept="image/jpeg,image/png" multiple style={{ display: "none" }}
                onChange={(e) => { handlePhotoUpload(e.target.files); e.target.value = ""; }} />
            </div>
          ) : (
            <div style={{ fontSize: 11, color: "var(--gy)", textAlign: "center", padding: "8px 0" }}>
              Máximo de {MAX_GALLERY} fotos alcanzado. Quita alguna para subir otra.
            </div>
          )}
          {uploadError && (
            <div style={{ marginTop: 8, fontSize: 12, fontWeight: 600, color: "var(--tr)" }}>{uploadError}</div>
          )}
          {fotoChicaAviso && (
            <div className="notice" style={{ marginTop: 10, marginBottom: 0 }}>
              <div className="notice-t">Esta foto se va a ver chica al compartir</div>
              <div className="notice-d">{fotoChicaAviso}</div>
            </div>
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
          <label className="lbl" htmlFor="nt-duration">Duración <span style={{ color: "var(--tr)" }}>*</span></label>
          <input
            id="nt-duration"
            className="inp"
            placeholder="Ej: 8 horas, Full day, 2 días"
            value={form.duration}
            onChange={(e) => u("duration", e.target.value)}
          />
          <div style={{ fontSize: 11, color: "var(--gy)", marginTop: 4 }}>Ej: 8 horas, Full day o 2 días</div>
        </div>
        <div className="fg">
          <label className="lbl" htmlFor="nt-price">Precio por persona (S/) <span style={{ color: "var(--tr)" }}>*</span></label>
          <input
            id="nt-price"
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
          <label className="lbl" htmlFor="nt-capacity">Cantidad de personas <span style={{ color: "var(--tr)" }}>*</span></label>
          <input
            id="nt-capacity"
            className={`inp${capacityRaw !== "" && !capacityInRange ? " inp-err" : ""}`}
            placeholder="12"
            type="number"
            value={form.capacity}
            onChange={(e) => u("capacity", e.target.value)}
          />
          {capacityRaw !== "" && !capacityInRange
            ? <div className="field-err">Ingresa un número entero válido (mínimo 1)</div>
            : <div style={{ fontSize: 11, color: "var(--gy)", marginTop: 4 }}>Personas por salida</div>}
        </div>
        <div className="fg">
          <label className="lbl" htmlFor="nt-included">Qué incluye (separado por comas)</label>
          <input id="nt-included" className="inp" placeholder="Transporte, guía, almuerzo, entrada" value={form.included} onChange={(e) => u("included", e.target.value)} />
        </div>
        <div className="fg">
          <label className="lbl" htmlFor="nt-excluded">Qué no incluye (separado por comas)</label>
          <input id="nt-excluded" className="inp" placeholder="Propinas, snacks, seguro" value={form.excluded} onChange={(e) => u("excluded", e.target.value)} />
        </div>
        <button className="mbtn" style={{ marginTop: 8 }} disabled={!durationValid || !priceValid || !capacityValid} onClick={() => setStep(3)}>Siguiente</button>
      </div>}

      {/* Step 3: Disponibilidad */}
      {step === 3 && <div className="fu">
        <div className="bkf-t">Disponibilidad</div>
        <div className="bkf-sub">Paso 3 de 5 · {SHOW_CANCELLATION_POLICY ? "Días, horario y cancelación" : "Días y horario"}</div>
        {/* Modo de venta (fase panel de salidas): arriba de los días, por diseño.
            La config viaja por PATCH aparte del POST/PUT (ver patchSaleConfig). */}
        <div className="fg">
          <label className="lbl">¿Cómo vendes este tour?</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { id: "CUPO_FIJO", label: "Confirmación automática", desc: "Defines cuántos cupos ofreces y las reservas se confirman solas. El tour sale en la fecha reservada." },
              { id: "SOLICITUD", label: "Confirmación manual", desc: "Las reservas te llegan como solicitudes y tú decides si la salida se confirma." },
            ].map((opt) => {
              // Confirmación automática no está disponible mientras haya
              // solicitudes sin responder: esos asientos dejan de contar para el
              // cupo y el tour podría vender el lugar de gente que ya está
              // esperando. El backend lo rechaza con 409 igual (esa es la guarda
              // real); acá se avisa ANTES, en el paso donde se elige el modo, en
              // vez de al guardar tres pantallas después.
              //
              // Se muestra deshabilitada en vez de dejar tocarla y revertir: el
              // motivo se lee sin tener que provocar un error. Si el tour YA
              // está en automática no se bloquea nunca, porque el 409 solo mira
              // el cambio de modo, no el estado actual.
              const bloqueada =
                opt.id === "CUPO_FIJO" &&
                pendientes > 0 &&
                editingTour?.salesMode !== "CUPO_FIJO";
              return (
              <div key={opt.id} onClick={() => { if (!bloqueada) u("salesMode", opt.id); }} style={{
                padding: "12px 14px", borderRadius: 12, border: "2px solid",
                borderColor: form.salesMode === opt.id ? "var(--f)" : "var(--lg)",
                background: form.salesMode === opt.id ? "rgba(27,58,45,.05)" : "transparent",
                cursor: bloqueada ? "not-allowed" : "pointer", opacity: bloqueada ? 0.55 : 1,
                display: "flex", alignItems: "flex-start", gap: 10
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: "50%",
                  background: form.salesMode === opt.id ? "var(--f)" : "var(--lg)",
                  color: "white", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 700, flexShrink: 0, marginTop: 1
                }}>{form.salesMode === opt.id ? "●" : ""}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ch)" }}>{opt.label}</div>
                  <div style={{ fontSize: 11, color: "var(--gy)", marginTop: 2 }}>{opt.desc}</div>
                </div>
              </div>
              );
            })}
          </div>
          {/* El texto NO dice "para poder cambiar a confirmación automática":
              el aviso está pegado a esa opción, en el momento de elegirla. */}
          {pendientes > 0 && editingTour?.salesMode !== "CUPO_FIJO" && (
            <div className="notice" style={{ marginTop: 10, marginBottom: 0 }}>
              <div className="notice-t">
                {pendientes === 1
                  ? "Tienes 1 solicitud sin responder"
                  : `Tienes ${pendientes} solicitudes sin responder`}
              </div>
              <div className="notice-d">
                {pendientes === 1 ? "Resuélvela" : "Resuélvelas"} en Reservas y vuelve.
                Mientras tanto este tour sigue con confirmación manual.
              </div>
            </div>
          )}
        </div>
        {form.salesMode === "CUPO_FIJO" && (
          <div className="fg">
            <label className="lbl" htmlFor="nt-allotment">Cupos por salida</label>
            <input id="nt-allotment" className="inp" type="number" min="1" inputMode="numeric" placeholder="Ej. 12" value={form.allotment} onChange={(e) => u("allotment", e.target.value)} />
          </div>
        )}
        {form.salesMode === "SOLICITUD" && (<>
          <div className="fg">
            <label className="lbl" htmlFor="nt-close-time">Hora límite para confirmar</label>
            <input id="nt-close-time" className="inp" type="time" value={form.closeTime} onChange={(e) => u("closeTime", e.target.value)} />
            <div style={{ fontSize: 11, color: "var(--gy)", marginTop: 6 }}>El día anterior a la salida, a esta hora, vence tu plazo para confirmar. Las solicitudes también vencen a los 3 días de recibidas, y siempre antes de la medianoche previa a la salida.</div>
          </div>
          <div className="fg">
            <label className="lbl" htmlFor="nt-min-quorum">Mínimo de personas (opcional)</label>
            <input id="nt-min-quorum" className="inp" type="number" min="1" inputMode="numeric" placeholder="Ej. 4" value={form.minQuorum} onChange={(e) => u("minQuorum", e.target.value)} />
            <div style={{ fontSize: 11, color: "var(--gy)", marginTop: 6 }}>Solo informativo: te avisamos si no llegas al mínimo, tú decides si sales</div>
          </div>
          {/* Aviso de reglas de vencimiento: informativo (no error), solo bajo
              confirmación manual, junto a los campos que las gobiernan. */}
          <div className="sale-note">
            Tienes hasta 3 días para confirmar cada solicitud, y siempre antes de la medianoche previa a la salida. Si no confirmas, la solicitud vence y el viajero recibe un aviso.
          </div>
        </>)}
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
              ? "Sin días recurrentes. Usa el calendario de abajo para fechas específicas."
              : `Opera: ${form.days.map(d => DAY_LABEL_LONG[d] || d).join(", ")}`}
          </div>
        </div>
        {/* Calendario de excepciones — Reglas v1.2 §3.2 */}
        <div className="fg" style={{ marginTop: 4 }}>
          <label className="lbl">Calendario de excepciones</label>
          <div style={{ fontSize: 11, color: "var(--gy)", marginBottom: 12 }}>
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
          <label className="lbl" htmlFor="nt-start-time">Hora de salida</label>
          <input id="nt-start-time" className="inp" type="time" value={form.startTime} onChange={(e) => u("startTime", e.target.value)} />
        </div>
        {/* Campo de política de cancelación oculto en el piloto vía flag. El
            estado form.cancellation conserva su default ("flexible") aunque el
            input no se muestre → el submit sigue mandando un valor válido. */}
        {SHOW_CANCELLATION_POLICY && (
        <div className="fg">
          <label className="lbl">Política de cancelación</label>
          <div style={{ fontSize: 11, color: "var(--gy)", marginBottom: 8 }}>
            Elige la que aplica a este tour. Recomendamos <strong>Flexible</strong> para tours cortos.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { id: "flexible", label: "Flexible", desc: "Devuelves el 100% si cancelan con 24 horas o más. Sin devolución con menos de 24 horas." },
              { id: "moderada", label: "Moderada", desc: "Devuelves el 100% si cancelan con 72 horas o más, y el 50% entre 72 y 24 horas. Sin devolución con menos de 24 horas." },
              { id: "estricta", label: "Estricta", desc: "Devuelves el 100% si cancelan con 30 días o más, y el 50% entre 30 y 15 días. Sin devolución con menos de 15 días." },
              { id: "no_reembolsable", label: "No reembolsable", desc: "Sin devolución desde el momento del pago. Solo para tours con permisos prepagados." },
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
                  <div style={{ fontSize: 11, color: "var(--gy)", marginTop: 2 }}>{opt.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        )}
        {form.days.length === 0 && form.addedDates.length === 0 && (
          <div style={{ padding: 10, background: "rgba(199,97,58,.08)", borderRadius: 10, fontSize: 12, color: "var(--tr)", marginTop: 8, marginBottom: 8 }}>
            Configura al menos un día recurrente o agrega fechas específicas en el calendario
          </div>
        )}
        <button className="mbtn" style={{ marginTop: 8 }} disabled={(form.days.length === 0 && form.addedDates.length === 0) || (form.salesMode === "CUPO_FIJO" && !(Number(form.allotment) >= 1))} onClick={() => setStep(4)}>Siguiente</button>
      </div>}

      {/* Step 4: Descripción con IA */}
      {step === 4 && <div className="fu">
        <div className="bkf-t">Descripción</div>
        <div className="bkf-sub">Paso 4 de 5 · Escríbela tú o usa la IA</div>
        <div className="fg">
          <label className="lbl" htmlFor="nt-pitch">Frase de gancho <span style={{ color: "var(--tr)" }}>*</span></label>
          <div style={{ fontSize: 11, color: "var(--gy)", marginBottom: 8 }}>
            Una línea que resuma el tour. Es lo primero que se lee cuando alguien comparte tu tour por WhatsApp o lo encuentra en Google.
          </div>
          <input
            id="nt-pitch"
            className={`inp${(form.shortPitch || "").trim().length > 0 && !pitchValid ? " inp-err" : ""}`}
            placeholder="Ej: Camina entre bosques de piedra a 3.500 metros, a una hora de Cajamarca"
            maxLength={PITCH_MAX}
            value={form.shortPitch}
            onChange={(e) => u("shortPitch", e.target.value)}
          />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
            {(form.shortPitch || "").trim().length > 0 && !pitchValid
              ? <span className="field-err">Entre {PITCH_MIN} y {PITCH_MAX} caracteres</span>
              : <span style={{ fontSize: 11, color: "var(--gy)", fontWeight: 600 }}>Entre {PITCH_MIN} y {PITCH_MAX} caracteres</span>}
            <span style={{ fontSize: 11, fontWeight: 600, color: pitchValid ? "var(--m)" : "var(--gy)" }}>
              {(form.shortPitch || "").trim().length}/{PITCH_MAX}
            </span>
          </div>
        </div>
        <div className="fg">
          <label className="lbl" htmlFor="nt-description">Descripción del tour <span style={{ color: "var(--tr)" }}>*</span></label>
          <textarea id="nt-description" className="ai-cc-input" style={{ minHeight: 100 }} placeholder="Describe tu tour con detalle: qué verán los viajeros, qué lo hace especial y qué pueden esperar…"
            value={form.description} onChange={(e) => u("description", e.target.value)} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
            {(form.description || "").trim().length > 0 && (form.description || "").trim().length < DESC_MIN
              ? <span className="field-err">Mínimo {DESC_MIN} caracteres</span>
              : <span style={{ fontSize: 11, color: "var(--gy)", fontWeight: 600 }}>Mínimo {DESC_MIN} caracteres</span>}
            <span style={{ fontSize: 11, fontWeight: 600, color: (form.description || "").trim().length >= DESC_MIN ? "var(--m)" : "var(--gy)" }}>
              {(form.description || "").trim().length}/{DESC_MIN}
            </span>
          </div>
        </div>
        <div style={{ padding: 14, background: "var(--cr)", borderRadius: 12, marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--f)", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}><Sparkles size={12} strokeWidth={1.5} /> Generador IA</div>
          <div style={{ fontSize: 11, color: "var(--gy)", marginBottom: 10 }}>Genera una descripción profesional basada en los datos que ya ingresaste</div>
          <button className="ai-cc-btn" onClick={generateAiDesc} disabled={aiLoading || !form.title || !form.location}>
            <Sparkles size={12} strokeWidth={1.5} /> {aiLoading ? "Generando…" : "Generar descripción"}
          </button>
          {aiLoading && <div style={{ fontSize: 11, color: "var(--gy)", marginTop: 8 }}>Estamos escribiendo tu descripción. Toma unos segundos.</div>}
          {aiError && <div className="field-err" style={{ marginTop: 8 }}>{aiError}</div>}
          {aiDesc && (
            <div style={{ marginTop: 12, padding: 12, background: "white", borderRadius: 10, fontSize: 13, lineHeight: 1.6, color: "var(--ch)" }}>
              {aiDesc.shortPitch && (
                <div style={{ fontWeight: 700, marginBottom: 8 }}>{aiDesc.shortPitch}</div>
              )}
              {aiDesc.description}
              <div style={{ fontSize: 11, color: "var(--gy)", marginTop: 8 }}>Revisa y edita antes de publicar. La IA puede agregar detalles que tu tour no incluye.</div>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button style={{ padding: "10px 18px", borderRadius: 8, background: "var(--f)", color: "white", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                  onClick={() => { u("description", aiDesc.description); if (aiDesc.shortPitch) u("shortPitch", aiDesc.shortPitch); }}>Usar esta</button>
                <button style={{ padding: "6px 14px", borderRadius: 8, background: "var(--sd)", color: "var(--ch)", border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                  onClick={generateAiDesc}>Regenerar</button>
              </div>
            </div>
          )}
        </div>
        <button className="mbtn" disabled={(form.description || "").trim().length < DESC_MIN || !pitchValid} onClick={() => setStep(5)}>Siguiente</button>
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

        <div style={{ padding: 12, background: "rgba(45,90,61,.05)", borderRadius: 12, marginBottom: 16, fontSize: 12, color: "var(--gy)" }}>
          Al publicar, tu tour quedará visible de inmediato en Finde.
        </div>
        {submitError && (
          <div className="field-err" style={{ marginBottom: 10, textAlign: "center" }}>{submitError}</div>
        )}
        {!form.photo && !isEditing && (
          <div className="notice" style={{ marginBottom: 12 }}>
            <div className="notice-t">Falta la foto de portada</div>
            <div className="notice-d">Es la que se ve cuando alguien comparte tu tour por WhatsApp. Sin foto, el enlace sale sin imagen. Vuelve al paso 1 para subirla.</div>
          </div>
        )}
        <button className="mbtn" disabled={submitting || (!form.photo && !isEditing)} onClick={async () => {
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
          const result = await onCreateTour(form, createdTourId);
          setSubmitting(false);
          if (result?.ok) {
            setPublished(true);
          } else {
            if (result?.createdTourId) setCreatedTourId(result.createdTourId);
            setSubmitError(result?.error || "No pudimos publicar el tour. Intenta de nuevo.");
          }
        }}>{submitting ? "Guardando…" : (isEditing ? "Guardar cambios" : "Publicar tour")}</button>
      </div>}
    </div>
  );
}

// Pantalla de "no encontrado". Hasta ahora la app no tenía concepto de 404: una
// ficha sin tour devolvía null y quedaba un cuadro en blanco. Con URLs esto pasa
// a ser un caso real y frecuente, porque Google va a tener indexadas URLs de
// tours que después salen del catálogo (acaba de pasar con siete).
//
// Dos textos, según lo que sabemos:
//   · deTour: la URL era una ficha bien formada que no resolvió. Puede ser que
//     el tour no exista o que esté fuera del catálogo. NO se distingue, y es a
//     propósito: el API responde 404 en los dos casos desde M-2, y al viajero la
//     diferencia no le sirve de nada.
//   · si no, la URL directamente no corresponde a ninguna pantalla.
function NotFoundView({ go, deTour }) {
  return (
    <div className="pg fu" style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "48px 24px" }}>
      <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--cr)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
        <Compass size={26} strokeWidth={1.5} style={{ color: "var(--f)" }} />
      </div>
      <div style={{ fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif", fontSize: 21, color: "var(--ch)", fontWeight: 700, marginBottom: 8 }}>
        {deTour ? "Este tour ya no está disponible" : "No encontramos esta página"}
      </div>
      <div style={{ fontSize: 14, color: "var(--gy)", maxWidth: 420, marginBottom: 24 }}>
        {deTour
          ? "Puede que la agencia lo haya dado de baja o que el enlace esté vencido. Hay muchos otros tours para ver."
          : "El enlace puede estar incompleto o haber cambiado. Empieza por el catálogo."}
      </div>
      <button className="mbtn" style={{ maxWidth: 280, marginTop: 0 }} onClick={() => go("catalog")}>
        Ver todos los tours
      </button>
      <button className="rv-cancel" style={{ maxWidth: 280, marginTop: 8, width: "100%" }} onClick={() => go("home")}>
        Ir al inicio
      </button>
    </div>
  );
}

// Las vistas que se ven SIN CUENTA. Desde la tanda 3 esto no es un "modo
// invitado" que haya que prender: es el estado normal de quien entra a Finde.
//
// "booking" está en la lista A PROPÓSITO. El muro de cuenta se movió al
// checkout: el viajero elige fecha y cupos y ve el total, y recién ahí se le
// pide la cuenta. Si "booking" no estuviera acá, el guard de effectiveView
// rebotaría la vista ANTES de que BookingView se monte, así que no habría
// dónde mostrar ese pedido.
//
// Lo que sigue siendo privado y cae al login: trips, trip-detail, profile,
// dashboard, new-tour y notifications.
const GUEST_VIEWS = ["home", "catalog", "detail", "booking", "login", "welcome", "not-found", "reset-password"];

// Las vistas que EXIGEN cuenta. Es el complemento de GUEST_VIEWS, y existe
// aparte porque la guarda no se hace en cada botón sino en go(), que es el
// único embudo por donde pasa toda la navegación de la app.
//
// Eso no es prolijidad: escribir la guarda en la barra de abajo habría dejado
// abierto el pie de página, que también manda a "Mis reservas" y a
// notificaciones, y los destinos de las notificaciones. Es la misma lección que
// ya costó dos veces en el backend (ver .claude/rules/api-y-schema.md): la
// guarda va en el estado que se protege, no en el camino que la descubrió.
//
// "booking" NO está acá a propósito: a reservar se entra sin cuenta, y la
// cuenta se pide adentro, cuando el viajero ya eligió fecha y cupos.
const ACCOUNT_VIEWS = ["trips", "trip-detail", "profile", "notifications", "dashboard", "new-tour"];

// La vista con la que arranca la app, leída de la URL DURANTE el render.
// Mismo criterio que src/App.jsx: leer la URL no necesita estado ni efecto, es
// un dato del documento que ya existe cuando React monta.
//
// El respaldo sin window es "home" y no "login" desde la tanda 3: la app ya no
// arranca en el login por defecto.
function initialRoute() {
  if (typeof window === "undefined") return { view: "home", params: {} };
  return fromPath(window.location.pathname);
}

// La pestaña de la barra que le corresponde a una vista. Existe porque `nav`
// arrancaba SIEMPRE en "explore", aunque la URL apuntara a otra cosa: abrir
// /demo/mis-reservas dejaba marcado "Explorar" sobre la pantalla de reservas.
// Se nota más ahora, porque entrar desde el modal aterriza en la vista pedida
// sin pasar por navigateTo.
function navFor(view) {
  if (view === "catalog") return "search";
  if (view === "trips" || view === "trip-detail") return "trips";
  if (view === "profile") return "profile";
  return "explore";
}

// Acá vivía isPublicDeepLink, que prendía el modo invitado SOLO para un deep
// link a una vista pública y dejaba el /demo pelado en el login. Era la mitad
// que la tanda 2 podía abrir sin abrir la navegación entera. La tanda 3 la
// abrió, así que la excepción sobra: ya no hay ningún modo que prender.

// ── MAIN ──────────────────────────────────────────────
export default function AppDemo() {
  const { user, loading, isOperator, operatorResolved, signOut } = useAuth();
  // Ruta inicial: de la URL, no de un default fijo. Un link compartido tiene que
  // abrir donde apunta.
  const [route0] = useState(initialRoute);
  const [view, setView] = useState(route0.view);
  // Parámetros de la ruta actual (el segmento de la ficha, el código del viaje).
  const [routeParams, setRouteParams] = useState(route0.params);
  const [tour, setTour] = useState(null);
  // Hidratación de un link frío: el tour que se pide al servidor por su sufijo
  // cuando alguien abre /tour/<slug>-<sufijo> sin haber pasado por el catálogo.
  //
  // Se guarda el RESULTADO junto al sufijo que lo pidió, y el estado visible se
  // deriva de comparar los dos. Así "cargando" no es un setState más (que además
  // dispara renders en cascada y lo marca ESLint): es simplemente que todavía no
  // llegó la respuesta de ESTE sufijo.
  const [deepFetch, setDeepFetch] = useState({ suffix: null, tour: null, failed: false });
  const [nav, setNav] = useState(() => navFor(route0.view));
  const [cat, setCat] = useState("all");
  // IDs de notificaciones ya vistas (persisten en localStorage). El read de cada
  // notificación derivada se calcula contra este set (no hay modelo Notification).
  const [seenNotifs, setSeenNotifs] = useState(() => loadSeenNotifs());
  const [tours, setTours] = useState([]);
  const [toursLoading, setToursLoading] = useState(true);
  // Feature "Tours en [ciudad]": ciudad mostrada en la sección. Arranca en
  // Lima para evitar flash/CLS antes de que llegue /api/geo. geoSource permite
  // ignorar respuestas tardías de la geo si el usuario ya eligió manualmente.
  // Guarda un DEPARTAMENTO, no una ciudad. El nombre que se muestra sale de
  // displayName(): en seis casos el destino no se llama como el departamento
  // (Loreto se muestra como Iquitos, y así). Ver lib/cities.js.
  //
  // PRECEDENCIA, de más fuerte a más débil:
  //   1. el override de desarrollo (?city= en localhost)
  //   2. LO QUE EL VIAJERO ELIGIÓ y quedó guardado
  //   3. "Lima", hasta que conteste /api/geo
  // La detección nunca pisa una elección: por eso, si hay elección guardada,
  // el ref de abajo arranca en "manual".
  const [choice, setChoice] = useState(() => readCityChoice());
  const [selectedDept, setSelectedDept] = useState(
    () => readDevCityOverride() || readCityChoice()?.dept || "Lima"
  );
  // Lo que la IP dice AHORA. Va duplicado en estado Y en ref a propósito: el
  // estado porque la oferta de cambio se renderiza a partir de esto, y el ref
  // porque `pickDept` es un useCallback estable y leería un valor viejo.
  const [detectedDept, setDetectedDept] = useState(null);
  const detectedDeptRef = useRef(null);
  // De dónde salió el departamento elegido. NO SE RENDERIZA: desde que el
  // título dejó de afirmar ubicación (2026-08-19) su único trabajo es que una
  // respuesta tardía de /api/geo no pise una elección manual. Por eso es un ref
  // y no estado: cambiarlo no tiene que re-renderizar nada.
  // Si hay override en localhost arranca en "manual", para que la respuesta
  // tardía (siempre fallback en localhost) tampoco lo pise.
  const geoSourceRef = useRef(readDevCityOverride() || readCityChoice() ? "manual" : "auto");
  // NO hay estado para el `reason` de /api/geo, y es a propósito. El endpoint
  // lo devuelve siempre (ver api/geo.ts) porque ahí es lo que permite
  // diagnosticar sin adivinar, pero la interfaz no lo muestra: mostrarlo
  // obligaba a hablar de detección, y el título dejó de afirmar ubicación el
  // 2026-08-19. Si vuelve a hacer falta (por ejemplo para preseleccionar una
  // sugerencia al preguntar la ciudad la primera vez), se agrega ahí.
  const pickDept = useCallback((dept) => {
    setSelectedDept(dept);
    geoSourceRef.current = "manual";
    // Se guarda junto con lo que la IP decía EN ESTE MOMENTO. Ver el comentario
    // largo de readCityChoice: es lo que después permite distinguir "se movió"
    // de "la IP siempre se equivoca igual".
    const nueva = { dept, detectedAtChoice: detectedDeptRef.current, ts: Date.now() };
    writeCityChoice(dept, detectedDeptRef.current);
    setChoice(nueva);
  }, []);

  // ── Lo que decide qué se ve en la sección de ciudad ──
  // `yaEligio` distingue "nunca contestó" de "ya contestó", que es lo único que
  // enciende la fila de chips.
  const yaEligio = !!choice;
  // La oferta de cambio aparece SOLO si lo que la IP dice ahora es distinto de
  // lo que decía cuando el viajero eligió. Ver el comentario largo de
  // readCityChoice: comparar contra su elección lo castigaría en cada visita
  // por un error nuestro.
  const sugerenciaCambio =
    choice && detectedDept &&
    detectedDept !== choice.detectedAtChoice &&
    detectedDept !== selectedDept
      ? detectedDept
      : null;

  // opTours (dashboard del operador) se hidrata aparte, desde
  // /api/operators/me/tours (ver efecto más abajo). Arranca vacío.
  const [opTours, setOpTours] = useState([]);
  // Salidas agrupadas del panel (GET /api/operators/me/departures) + su
  // loading/error y el contador que re-hidrata opBookings tras una acción.
  const [opDepartures, setOpDepartures] = useState([]);
  const [depsLoading, setDepsLoading] = useState(true);
  const [depsError, setDepsError] = useState("");
  const [bkRefresh, setBkRefresh] = useState(0);

  // M3 Sub-paso B: reservas reales del operador, desde /api/operators/me/bookings
  // (filtrado por operatorId del token). Reemplaza el mock OP_BK. Arranca vacío.
  const [opBookings, setOpBookings] = useState([]);

  // "Mis Viajes": reservas reales del viajero (hidratadas desde /api/me más
  // abajo). Declarado antes del efecto de hidratación que usa setTrips.
  const [trips, setTrips] = useState([]);

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
  // - No operador → opTours vacío (no dashboard de tours).
  // - tourId conserva el CUID real → handleSaveTour (2.6) edita el tour correcto
  //   y, al ser propio, el PUT responde 200.
  // Loader reusable (useCallback): extraído del useEffect de montaje para poder
  // re-invocarlo tras editar el negocio (saveBiz) y reflejar el nombre nuevo sin
  // recargar. Devuelve activos e inactivos.
  // opToursSeq: guard de respuesta vieja. loadOperatorTours se invoca desde el
  // efecto Y desde onBusinessSaved; dos corridas cercanas podían aterrizar
  // fuera de orden (la respuesta lenta pisaba a la nueva).
  const opToursSeq = useRef(0);
  const loadOperatorTours = useCallback(async () => {
    const seq = ++opToursSeq.current;
    if (!isOperator) {
      setOpTours([]);
      return;
    }
    try {
      const r = await authFetch("/api/operators/me/tours");
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      if (seq !== opToursSeq.current) return;
      // mapTourFromApi ya normaliza (incl. days/cancellation reales vía
      // LIST_SELECT ampliado); de ahí a la forma que espera el dashboard.
      const mine = (data.tours || []).map(mapTourFromApi);
      setOpTours(mine.map((t, i) => ({
        id: i + 1,
        tourId: t.id,
        // Estado real del API (M2.3); me/tours devuelve activos e inactivos.
        active: t.active ?? true,
        image: t.image,
        // Galería real del API (sub-paso 3): el editor la carga para mostrar
        // las fotos actuales y, si no se tocan, preservarlas al guardar.
        images: Array.isArray(t.images) ? t.images : [],
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
        shortPitch: t.shortPitch || "",
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
        // Config de venta real (OPERATOR_LIST_SELECT): prefill del form de
        // edición. SOLICITUD es el default del motor para tours sin config.
        salesMode: t.salesMode || "SOLICITUD",
        allotment: t.allotment ?? null,
        minQuorum: t.minQuorum ?? null,
        closeTime: t.closeTime ?? null,
        // Solicitudes vigentes del tour. Viene en el MISMO payload, sin llamada
        // extra, y es lo que deja avisar en el paso de disponibilidad en vez de
        // al guardar. Ver el 409 de PATCH /api/tours/:id, que es la guarda real.
        pendingRequests: t.pendingRequests ?? 0,
        photo: null,
      })));
    } catch (err) {
      console.error("Error cargando tours del operador:", err);
      if (seq === opToursSeq.current) setOpTours([]);
    }
  }, [isOperator]);

  // Sub-paso 2.7: opTours = los tours REALES del operador autenticado. Espera a
  // que useAuth resuelva la sesión (loading) Y el perfil de operador
  // (operatorResolved) antes de decidir: sin lo segundo, corría con el
  // isOperator=false transitorio y vaciaba/duplicaba trabajo. El loader vive
  // fuera del efecto para reusarse tras editar el negocio (saveBiz).
  useEffect(() => {
    if (loading || !operatorResolved) return;
    const run = async () => { await loadOperatorTours(); };
    run();
  }, [loading, operatorResolved, loadOperatorTours]);

  // M3 Sub-paso B: hidrata las reservas del operador (GET /api/operators/me/bookings,
  // filtrado por operatorId del token). Mismo patrón que opTours: espera a que
  // useAuth resuelva sesión Y operador, no operador → vacío, !r.ok → loguea y
  // deja []. Adapta la forma del API a lo que renderiza la tab.
  useEffect(() => {
    if (loading || !operatorResolved) return;
    // AbortController por ejecución: el cleanup (doble-mount de StrictMode en
    // dev, cambio de deps) aborta el request en vuelo de verdad, en vez de
    // solo descartar la respuesta como hacía el flag `cancel`.
    const ctrl = new AbortController();
    // fmtBookingDate vive a nivel módulo (la vista de salidas también la usa).
    const hydrateOpBookings = async () => {
      if (!isOperator) {
        if (!ctrl.signal.aborted) setOpBookings([]);
        return;
      }
      try {
        const r = await authFetch("/api/operators/me/bookings", { signal: ctrl.signal });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = await r.json();
        if (ctrl.signal.aborted) return;
        // Adaptador API → shape de la tab. El API da CÉNTIMOS: amount en soles.
        // note y pay NO existen en el modelo real → no se mapean.
        setOpBookings((data.bookings || []).map((b) => ({
          id: b.bookingCode,
          customer: b.userName,
          phone: b.userPhone || null,
          date: fmtBookingDate(b.scheduledAt),
          startTime: b.tour?.startTime ?? null,
          createdAt: b.createdAt ?? null,
          guests: b.guests,
          amount: (b.totalSoles || 0) / 100,
          tour: b.tour?.title || "",
          status: b.status,
        })));
      } catch (err) {
        // El abort no es un error: es el cleanup cancelando este run.
        if (err.name === "AbortError") return;
        console.error("Error cargando reservas del operador:", err);
        if (!ctrl.signal.aborted) setOpBookings([]);
      }
    };
    hydrateOpBookings();
    return () => ctrl.abort();
    // bkRefresh: contador que fuerza re-hidratar tras confirmar/rechazar una
    // salida (las notificaciones derivan de opBookings y deben reflejarlo).
  }, [isOperator, loading, operatorResolved, bkRefresh]);

  // ── Salidas agrupadas del panel (GET /api/operators/me/departures) ──
  // Un solo fetch con scope=all: el filtro futuras/pasadas y el toggle
  // "Ver pasadas" son client-side. Guard de secuencia (patrón opToursSeq);
  // silent = reconciliación en background sin loading visible.
  const depsSeq = useRef(0);
  // Un refetch silencioso en vuelo bloquea a otro silencioso: los disparos de
  // background (entrar al panel, volver el foco) pueden coincidir y cada
  // request cuesta ~870ms. Los NO silenciosos (carga inicial, reintento
  // manual) siempre pasan: son intencionales del usuario.
  const depsSilentInFlight = useRef(false);
  const loadDepartures = useCallback(async (opts = {}) => {
    if (opts.silent && depsSilentInFlight.current) return;
    const seq = ++depsSeq.current;
    if (!isOperator) {
      setOpDepartures([]);
      setDepsLoading(false);
      return;
    }
    if (!opts.silent) {
      setDepsLoading(true);
      setDepsError("");
    } else {
      depsSilentInFlight.current = true;
    }
    try {
      const r = await authFetch("/api/operators/me/departures?scope=all");
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      if (seq !== depsSeq.current) return;
      setOpDepartures(data.departures || []);
      setDepsError("");
    } catch (err) {
      console.error("Error cargando salidas de la agencia:", err);
      if (seq === depsSeq.current && !opts.silent) {
        setDepsError("No pudimos cargar tus salidas. Revisa tu conexión.");
      }
    } finally {
      if (opts.silent) depsSilentInFlight.current = false;
      // El run MÁS RECIENTE (silencioso o no) apaga el loading. Si solo lo
      // apagara el no-silencioso, un refetch silencioso que le robó el seq a
      // una carga visible lenta dejaría el spinner eterno sobre datos ya
      // frescos (lo cazó el QA de esta tanda con el server frío).
      if (seq === depsSeq.current) setDepsLoading(false);
    }
  }, [isOperator]);

  useEffect(() => {
    if (loading || !operatorResolved) return;
    // Wrapper async (patrón del efecto de opTours): el setState del loader no
    // corre sincrónico en el cuerpo del efecto.
    const run = async () => { await loadDepartures(); };
    run();
  }, [loading, operatorResolved, loadDepartures]);

  // Refetch al ENTRAR al panel. Sin esto las salidas solo se cargaban al montar
  // la app: una solicitud nueva no aparecía hasta recargar la página, porque
  // DashView se monta y desmuta pero los datos viven acá y llegan por props.
  // Silencioso: reconcilia bajo datos ya en pantalla, sin spinner ni parpadeo.
  // Dispara al TRANSICIONAR a "dashboard" (el guard de view), no en cada
  // render; el resto de las deps ya está estable cuando el operador resolvió.
  useEffect(() => {
    if (view !== "dashboard") return;
    if (loading || !operatorResolved || !isOperator) return;
    // Wrapper async (patrón del efecto de opTours): sin setState sincrónico
    // en el cuerpo del efecto.
    const run = async () => { await loadDepartures({ silent: true }); };
    run();
  }, [view, loading, operatorResolved, isOperator, loadDepartures]);

  // Refetch al volver el foco a la pestaña, para la agencia que deja el panel
  // abierto: sin esto nunca ve una solicitud nueva. Solo si está parada en el
  // panel; en otras vistas las salidas no se muestran y el request sobraría.
  useEffect(() => {
    if (view !== "dashboard" || !isOperator) return;
    const onVisible = () => {
      if (document.visibilityState === "visible") loadDepartures({ silent: true });
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [view, isOperator, loadDepartures]);

  // Confirmar/rechazar una salida en lote. Al éxito la card se actualiza SIN
  // recargar: contadores/estado del response + transición local de las
  // vigentes (mismas reglas que el backend); después, refetch silencioso para
  // reconciliar y re-hidratación de opBookings (notificaciones).
  // bookingId opcional: rechazo de UNA solicitud (la confirmación siempre es de
  // la salida entera; el backend responde 400 si se intenta confirmar una sola).
  const handleDepartureAction = async (departureId, action, bookingId) => {
    let res;
    try {
      res = await authFetch("/api/operators/me/departures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ departureId, action, ...(bookingId ? { bookingId } : {}) }),
      });
    } catch {
      return { ok: false, error: "No pudimos conectar. Revisa tu conexión e intenta de nuevo." };
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data.error || "No se pudo completar la acción. Intenta de nuevo." };
    }
    const nowIso = new Date().toISOString();
    const target = action === "confirm" ? "CONFIRMADA" : "RECHAZADA";
    const legacy = action === "confirm" ? "confirmed" : "cancelled";
    setOpDepartures((prev) => prev.map((d) => {
      if (d.id !== departureId) return d;
      // transitionedIds del backend = lo que realmente cambió. Se usa como
      // fuente cuando viene (rechazo individual: una sola fila); si faltara,
      // se cae a la misma regla de vigentes que aplica el backend en lote.
      const ids = Array.isArray(data.transitionedIds) ? new Set(data.transitionedIds) : null;
      const cambia = (b) => ids
        ? ids.has(b.id)
        : b.bookingState === "SOLICITUD" && (!b.expiresAt || b.expiresAt > nowIso);
      const bookings = (d.bookings || []).map((b) =>
        cambia(b) ? { ...b, bookingState: target, status: legacy, expiresAt: null } : b
      );
      const fresh = data.departure || {};
      const cupoEf = (fresh.allotmentOverride ?? d.tour?.allotment) ?? null;
      return {
        ...d,
        ...fresh,
        bookings,
        counts: recountDeparture(bookings),
        isFull: d.tour?.salesMode === "CUPO_FIJO" && cupoEf != null && (fresh.seatsTaken ?? 0) >= cupoEf,
      };
    }));
    loadDepartures({ silent: true });
    setBkRefresh((n) => n + 1);
    // Y la lista de tours, porque ahí vive `pendingRequests`: resolver una
    // solicitud es justo lo que desbloquea la confirmación automática de ese
    // tour, y sin esto el formulario seguiría mostrando el conteo viejo hasta
    // recargar la página. Misma lección que el cache de disponibilidad.
    loadOperatorTours();
    return { ok: true };
  };

  // M3 Sub-paso 1: hidrata "Mis Viajes" con las reservas REALES del viajero
  // (GET /api/me → bookings, filtradas por userEmail del token). Reemplaza el
  // seed mock MY_TRIPS. Espera a que useAuth resuelva (loading); sin sesión → [].
  // Siembra solo al montar / cambiar de usuario, así los appends optimistas de
  // handleAddLocalTrip (reserva recién hecha) no se pisan; al recargar, esa
  // reserva ya vendrá de /api/me. (AuthContext ya llama /api/me para isOperator,
  // pero no expone bookings y no podemos tocarlo aquí → segunda llamada GET.)
  useEffect(() => {
    if (loading) return;
    let cancel = false;
    const hydrateTrips = async () => {
      if (!user) {
        if (!cancel) setTrips([]);
        return;
      }
      try {
        const r = await authFetch("/api/me");
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = await r.json();
        if (cancel) return;
        setTrips((data.bookings || []).map(mapBookingToTrip).filter(Boolean));
      } catch (err) {
        console.error("Error cargando los viajes del usuario:", err);
        if (!cancel) setTrips([]);
      }
    };
    hydrateTrips();
    return () => { cancel = true; };
  }, [user, loading]);

  // Resolución del departamento vía /api/geo. Si el usuario ya eligió a mano
  // cuando llega la respuesta, se ignora (race condition R2). En localhost el
  // override de desarrollo ya dejó el ref en "manual", así que esta respuesta
  // tardía tampoco lo pisa.
  //
  // La sugerencia de la IP se sigue aplicando, y está bien: es un punto de
  // partida. Lo que NO se hace es anunciarla como si supiéramos dónde está el
  // viajero, porque se midió equivocada. Ver el comentario del título en
  // HomeView.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/geo")
      .then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
      .then(data => {
        if (cancelled) return;
        // Lo detectado se guarda SIEMPRE, aunque no se aplique: es lo que se
        // compara contra `detectedAtChoice` para saber si el viajero se movió.
        if (data?.department && DEPARTMENTS.includes(data.department)) {
          detectedDeptRef.current = data.department;
          setDetectedDept(data.department);
          if (geoSourceRef.current !== "manual") setSelectedDept(data.department);
        }
      })
      .catch(() => {
        // Silencioso: ya tenemos Lima por defecto.
      });
    return () => { cancelled = true; };
  }, []);

  const [editingTour, setEditingTour] = useState(null);
  const [dashTab, setDashTab] = useState("bookings");
  const [loginMsg, setLoginMsg] = useState("");
  // Modal de cuenta: UNO SOLO para los tres puntos de entrada (el checkout,
  // "Mis reservas" y "Perfil"). Guarda el motivo, que es lo que decide el copy,
  // y qué hacer cuando el viajero ya entró.
  //
  // `onDone` es la clave del pedido: la acción que se estaba intentando queda
  // pendiente y se ejecuta al terminar, así el viajero retoma exactamente donde
  // estaba. En el checkout eso es avanzar al paso 2, con la fecha, los cupos y
  // el total intactos, porque el modal se monta ENCIMA y BookingView nunca se
  // desmonta.
  const [accountAsk, setAccountAsk] = useState(null);
  const askAccount = useCallback((reason, onDone) => setAccountAsk({ reason, onDone }), []);
  // Estable a propósito: AccountModal lo usa dentro de un efecto (Escape).
  const closeAccountAsk = useCallback(() => setAccountAsk(null), []);
  const handleAccountSuccess = () => {
    const done = accountAsk?.onDone;
    setAccountAsk(null);
    done?.();
  };
  const [reviews, setReviews] = useState({});
  const [currentTrip, setCurrentTrip] = useState(null);
  const ref = useRef(null);
  // Notificaciones combinadas: viajero (sub-paso 2) + operador (sub-paso 3). Un
  // usuario puede ser ambos. Los reminders del viajero (urgentes: hoy/mañana) van
  // arriba; el resto —confirmadas del viajero + reservas recibidas del operador—
  // se intercala por recencia (createdAt, vía `ts`).
  const derivedNotifs = useMemo(() => {
    const traveler = buildTravelerNotifs(trips);
    const operator = buildOperatorNotifs(opBookings);
    const reminders = traveler.filter((n) => n.type === "reminder");
    const activity = [...traveler.filter((n) => n.type !== "reminder"), ...operator]
      .sort((a, b) => (b.ts || 0) - (a.ts || 0));
    return [...reminders, ...activity];
  }, [trips, opBookings]);
  const notifs = useMemo(
    () => derivedNotifs.map((n) => ({ ...n, read: seenNotifs.has(n.id) })),
    [derivedNotifs, seenNotifs]
  );
  const unread = notifs.filter((n) => !n.read).length;
  // Marca como vistos (persistente) uno o varios IDs de notificación.
  const markNotifsSeen = useCallback((ids) => {
    setSeenNotifs((prev) => {
      const next = new Set(prev);
      let changed = false;
      ids.forEach((id) => { if (!next.has(id)) { next.add(id); changed = true; } });
      if (!changed) return prev;
      persistSeenNotifs(next);
      return next;
    });
  }, []);

  // SPA fix: cambiar de vista no es navegación real, así que reseteamos
  // manualmente el scroll de window y del contenedor principal en cada
  // cambio de view para que el usuario aterrice arriba en la nueva pantalla.
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = 0;
    if (typeof window !== "undefined") window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [view]);

  // go() ya era el único punto por donde pasa toda la navegación de la app, así
  // que el router se enchufa acá y NO en cada botón. Esa centralización es lo
  // que hace que esta tanda sea chica.
  //
  // params: { tour } para la ficha y la reserva, { code } para el detalle de un
  // viaje. Se guardan en estado porque el render los necesita antes de que
  // llegue el dato del servidor.
  // La navegación de verdad, sin guarda. go() la envuelve.
  const navigateTo = (v, params = {}) => {
    if (v !== "login") setLoginMsg("");
    if (params.tour) setTour(params.tour);
    setView(v);
    setRouteParams(params);
    if (typeof window !== "undefined") {
      const url = toPath(v, params);
      // replace y no push cuando la URL no cambia: evita apilar entradas
      // idénticas y que el botón de atrás no haga nada visible.
      if (url !== window.location.pathname) window.history.pushState({ view: v }, "", url);
    }
    if (v === "home") setNav("explore");
    if (v === "catalog") setNav("search");
    if (v === "trips") setNav("trips");
    if (v === "profile") setNav("profile");
  };

  // Y acá la guarda, en el embudo. Una vista que exige cuenta, sin sesión, abre
  // el MISMO modal que el checkout en vez de mandar a una pantalla completa de
  // login: pedir la cuenta de dos formas distintas según por dónde entraste es
  // justo lo que esto evita. Si el viajero entra, se completa la navegación que
  // había pedido; si cierra el modal, se queda donde estaba.
  //
  // El respaldo de effectiveView sigue existiendo y NO sobra: cubre el caso de
  // escribir /demo/perfil en la barra sin sesión, donde no hay ninguna pantalla
  // debajo sobre la cual poner un modal.
  const go = (v, params = {}) => {
    if (!user && ACCOUNT_VIEWS.includes(v)) {
      askAccount(v, () => navigateTo(v, params));
      return;
    }
    navigateTo(v, params);
  };

  // El botón de atrás del navegador. Sin esto saca al usuario de la app entera,
  // que es lo que pasa hoy: cambiar de vista no dejaba entrada en el historial.
  useEffect(() => {
    const onPop = () => {
      const r = fromPath(window.location.pathname);
      setView(r.view);
      setRouteParams(r.params);
      if (r.view === "home") setNav("explore");
      else if (r.view === "catalog") setNav("search");
      else if (r.view === "trips") setNav("trips");
      else if (r.view === "profile") setNav("profile");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Hidratación de un link frío a una ficha o a una reserva.
  //
  // Es el único trabajo de verdad del router: hasta ahora la ficha SIEMPRE salía
  // del array del catálogo, porque no había forma de llegar sin pasar por él.
  // Con URLs, alguien abre /tour/<slug>-<sufijo> en una pestaña nueva y ese
  // array todavía está vacío. Se pide el tour por su sufijo, que es exactamente
  // lo que GET /api/tours/:id aprendió a resolver.
  //
  // No se espera al catálogo aunque esté cargando: son dos pedidos en paralelo y
  // el que gana pinta la ficha. En 4G eso es casi un segundo de diferencia.
  const deepSeg = routeParams.seg;
  const necesitaTour = (view === "detail" || view === "booking") && !tour;
  const segParsed = necesitaTour ? parseTourSegment(deepSeg) : null;
  const deepSuffix = segParsed ? segParsed.suffix : null;
  const deepSlug = segParsed ? segParsed.slug : "";
  useEffect(() => {
    if (!deepSuffix) return;
    let cancel = false;
    const run = async () => {
      try {
        const q = deepSlug ? `?slug=${encodeURIComponent(deepSlug)}` : "";
        const r = await fetch(`/api/tours/${deepSuffix}${q}`);
        if (cancel) return;
        // 404 cubre los dos casos, y es a propósito: el tour no existe, o existe
        // pero está fuera del catálogo. El API no los distingue (active:false
        // responde 404 desde M-2) y al viajero no le sirve la diferencia.
        if (!r.ok) { setDeepFetch({ suffix: deepSuffix, tour: null, failed: true }); return; }
        const data = await r.json();
        if (cancel) return;
        setDeepFetch({ suffix: deepSuffix, tour: ensureAvailabilityFields(mapTourFromApi(data.tour)), failed: false });
      } catch {
        if (!cancel) setDeepFetch({ suffix: deepSuffix, tour: null, failed: true });
      }
    };
    run();
    return () => { cancel = true; };
  }, [deepSuffix, deepSlug]);

  // El estado visible, derivado. "loading" es "la respuesta de este sufijo
  // todavía no llegó", no un estado que alguien tenga que setear.
  //
  const resuelto = deepFetch.suffix && deepFetch.suffix === deepSuffix;
  const deepState = !necesitaTour ? "idle"
    : !segParsed ? "missing"
      : !resuelto ? "loading"
        : deepFetch.failed ? "missing" : "ready";
  const deepTour = resuelto && !deepFetch.failed ? deepFetch.tour : null;
  const handleGuest = () => go("home");
  // Cerrar sesión deja al usuario navegando como visitante, no contra un muro.
  // Antes apagaba el modo invitado y lo mandaba al login, que era coherente
  // cuando el /demo pelado también pedía cuenta. Ya no la pide, así que dejarlo
  // en el login sería un muro que desaparece con solo recargar.
  const handleLogout = async () => { await signOut(); go("home"); };
  // El muro de cuenta YA NO ESTÁ ACÁ. Entrar a reservar es navegación normal: el
  // viajero elige fecha y cupos y ve el total, y la cuenta se le pide recién en
  // el checkout. Ese pedido es el modal del paso 3 de la tanda, que todavía no
  // existe: hasta que exista, un visitante sin cuenta llega hasta el final del
  // formulario y el POST le responde 401.
  const handleBook = () => go("booking", { tour: currentTour });
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
  // Sin setNav propio: navigateTo ya sincroniza la pestaña activa, y hacerlo
  // acá además la prendía ANTES de navegar. Con el modal en el medio eso se
  // veía: tocabas "Mis reservas" sin cuenta y la pestaña quedaba marcada sobre
  // la pantalla anterior aunque cerraras el modal sin entrar.
  const navGo = (id) => {
    if (id === "explore") go("home");
    else if (id === "search") go("catalog");
    else if (id === "trips") go("trips");
    else if (id === "profile") go("profile");
  };

  // Tocar una notificación: marca vista (persistente) + navega a su destino. El
  // target "dashboard" (notif del operador) abre la pestaña Reservas; el resto
  // (ej. "trips") va por go normal (que ya sincroniza el tab del nav).
  const handleNotifSelect = (n) => {
    markNotifsSeen([n.id]);
    if (n.target === "dashboard") { setDashTab("bookings"); go("dashboard"); }
    else if (n.target) go(n.target);
  };

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
    // 409 = el tour tiene reservas → el backend rechaza el borrado. NO quitamos
    // el tour de la lista; surfaceamos el mensaje (invita a pausar) en el diálogo.
    if (res.status === 409) {
      const data = await res.json().catch(() => ({}));
      return { ok: false, error: data?.error || "Este tour tiene reservas. Púsalo en pausa en lugar de borrarlo." };
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
      // El mensaje del servidor SE USA, no se tira. Cuando activar se bloquea
      // por metadata faltante, el backend responde qué falta y en qué paso del
      // formulario se arregla; antes ese texto se descartaba y la agencia leía
      // "no pudimos actualizar", que no dice qué hacer. El cartel que lo muestra
      // ya existe en DashView (toggleErr).
      const delServidor = await res.json().then(d => d?.error).catch(() => null);
      return { ok: false, error: delServidor || "No pudimos actualizar el estado del tour. Intenta de nuevo." };
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
  // Config de venta del form → PATCH /api/tours/:id (POST/PUT no la aceptan).
  // CUPO_FIJO manda el cupo y limpia el quórum; SOLICITUD limpia el cupo y
  // manda hora de cierre + quórum opcional. closeDaysBefore no se toca (el
  // motor usa su default: la víspera). Devuelve el tour completo del operador.
  const patchSaleConfig = async (tourId, f) => {
    const body = f.salesMode === "CUPO_FIJO"
      ? { salesMode: "CUPO_FIJO", allotment: Number(f.allotment), minQuorum: null }
      : {
          salesMode: "SOLICITUD",
          allotment: null,
          closeTime: f.closeTime || "20:00",
          minQuorum: Number(f.minQuorum) >= 1 ? Number(f.minQuorum) : null,
        };
    let res;
    try {
      res = await authFetch(`/api/tours/${tourId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch {
      return { ok: false, error: "No pudimos conectar. Revisa tu conexión." };
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.error || "No se pudo guardar el modo de venta." };
    return { ok: true, tour: data.tour };
  };

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

    // Config de venta vía PATCH (el PUT no la acepta). Si falla (p. ej. 409
    // por cupo menor a lo ya tomado en salidas vivas), el form queda abierto
    // con el error inline; reintentar re-ejecuta PUT+PATCH (idempotente).
    const cfg = await patchSaleConfig(cuid, updated);
    if (!cfg.ok) return { ok: false, error: cfg.error };

    // Éxito. mapTourFromApi normaliza el tour real; la respuesta del PATCH
    // (OPERATOR_DETAIL_SELECT) trae el shape completo, config incluida.
    const apiTour = ensureAvailabilityFields(mapTourFromApi(cfg.tour));

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
      // La frase de gancho, del API y no del form: es la que quedó guardada,
      // ya recortada por el backend.
      //
      // FALTABA, y ese era el bug del 2026-08-18: este objeto se arma campo por
      // campo sobre `...t`, así que un campo que no se enumera CONSERVA EL VALOR
      // VIEJO en vez de quedar vacío. El gancho se guardaba bien en la base y el
      // panel seguía diciendo que faltaba, porque leía el de antes de guardar.
      // La descripción no tenía el problema solo porque sí estaba en la lista.
      shortPitch: apiTour.shortPitch || "",
      included: updated.included || "",
      excluded: updated.excluded || "",
      days: Array.isArray(updated.days) ? updated.days : DEFAULT_DAYS,
      excludedDates: updated.excludedDates || [],
      addedDates: updated.addedDates || [],
      meetingPoint: apiTour.meetingPoint || updated.meetingPoint || "",
      cancellation: apiTour.cancellation || updated.cancellation || "flexible",
      startTime: updated.startTime || "08:00",
      // Config de venta fresca del PATCH (prefill del próximo editar).
      salesMode: apiTour.salesMode || "SOLICITUD",
      allotment: apiTour.allotment ?? null,
      minQuorum: apiTour.minQuorum ?? null,
      closeTime: apiTour.closeTime ?? null,
      // El PATCH no devuelve el conteo (no es config del tour): se conserva el
      // que ya estaba. Se refresca solo en la próxima carga de la lista.
      pendingRequests: t.pendingRequests ?? 0,
      photo: updated.photo || null,
      images: Array.isArray(updated.images) ? updated.images : [],
    } : t));

    // La config afecta lo que muestran las cards de salidas (cierre/cupos).
    loadDepartures({ silent: true });

    // ── Y además se recarga la lista entera, a propósito ──
    //
    // El merge de arriba ya deja la tarjeta correcta, así que esto NO es lo que
    // arregla el bug del gancho: es la red para el PRÓXIMO campo.
    //
    // Van tres veces el mismo patrón (pendingRequests en la lista blanca de
    // mapTourFromApi, y el gancho acá y en crear): un campo nuevo aparece en el
    // API, se agrega en el endpoint y en el consumidor, y se pierde en un
    // eslabón del medio que lo enumera a mano. Agregar dos líneas cada vez que
    // pasa es aceptar que va a volver a pasar.
    //
    // NO se espera (sin await), igual que loadDepartures: el usuario ya navegó
    // al panel con los datos correctos y esto aterriza detrás. Costo percibido
    // al guardar: cero. Medido el 2026-08-18 contra dev.finde.pe: el piso de la
    // función es 243 ms y la versión pesada del mismo query (los 42 tours
    // públicos, 66 kB) tarda 1.284 ms; el panel son 5 tours y 18 kB.
    //
    // El arreglo de raíz es que este objeto se arma en TRES lugares sin
    // compartir código. Está anotado en docs/pendientes-producto.md.
    loadOperatorTours();

    setEditingTour(null);
    setDashTab("listings");
    go("dashboard");
    return { ok: true };
  };
  // Sub-paso 2.5: crea el tour en el backend real (POST /api/tours) en vez de
  // un tour local con id numérico. Devuelve { ok } / { ok:false, error } para
  // que NewTourView muestre "Guardando…" y maneje el error sin navegar.
  const handleCreateTour = async (formData, retryTourId = null) => {
    // retryTourId: un intento anterior YA creó el tour pero falló el PATCH de
    // la config de venta → el reintento hace SOLO el PATCH, jamás un segundo
    // POST (evita tours duplicados).
    let createdId = retryTourId;
    if (!createdId) {
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
        return { ok: false, error: "Necesitas un perfil de agencia para publicar tours." };
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { ok: false, error: describeTourApiError(data, "No pudimos publicar el tour. Revisa los datos.") };
      }
      createdId = data.tour?.id;
    }

    // Config de venta vía PATCH (el POST no la acepta). Su respuesta
    // (OPERATOR_DETAIL_SELECT: tour completo, config incluida) alimenta el
    // merge de abajo, así el display no depende del shape del POST.
    const cfg = await patchSaleConfig(createdId, formData);
    if (!cfg.ok) {
      return {
        ok: false,
        createdTourId: createdId,
        error: `El tour se publicó, pero no pudimos guardar el modo de venta: ${cfg.error} Reintenta.`,
      };
    }
    const apiTour = ensureAvailabilityFields(mapTourFromApi(cfg.tour));
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
      // Mismo caso que en handleSaveTour, y acá era peor: este objeto se arma
      // DESDE CERO, sin heredar nada, así que el gancho no quedaba viejo sino
      // en undefined. No se notaba por casualidad: un tour recién creado nace
      // activo y el aviso de "falta para publicar" solo se muestra en tours
      // pausados. La primera vez que alguien pausara uno recién creado sin
      // recargar la página, veía el mismo mensaje falso.
      shortPitch: merged.shortPitch || "",
      included: formData.included || "",
      excluded: formData.excluded || "",
      days: Array.isArray(formData.days) ? formData.days : DEFAULT_DAYS,
      excludedDates: formData.excludedDates || [],
      addedDates: formData.addedDates || [],
      startTime: formData.startTime || "08:00",
      cancellation: formData.cancellation || "flexible",
      // Config de venta fresca del PATCH (prefill del próximo editar).
      salesMode: apiTour.salesMode || "SOLICITUD",
      allotment: apiTour.allotment ?? null,
      minQuorum: apiTour.minQuorum ?? null,
      closeTime: apiTour.closeTime ?? null,
      // Un tour recién creado no tiene reservas, así que 0 es el valor real y
      // no un default de relleno. Faltaba, y el `?? 0` del consumidor lo tapaba:
      // es el mismo mecanismo por el que pendingRequests se perdió la primera
      // vez, un undefined que se lee igual que un dato.
      pendingRequests: 0,
      photo: formData.photo || null,
      images: Array.isArray(formData.images) ? formData.images : [],
    }]);

    // La config afecta lo que muestran las cards de salidas (cierre/cupos).
    loadDepartures({ silent: true });

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
  // - sin sesión → se ven las vistas de GUEST_VIEWS, siempre y sin prender
  //   ningún modo. Hasta la tanda 3 esto dependía de un flag `guest` que
  //   arrancaba apagado, y por eso el /demo pelado caía al login; ya no existe.
  // - sin sesión y con la URL apuntando a una vista que exige cuenta → el
  //   INICIO con el modal encima (ver pideCuentaPorUrl, abajo).
  const allowedWithoutSession = GUEST_VIEWS;

  // Alguien escribió /demo/perfil, o abrió un link viejo, y no tiene sesión.
  //
  // Antes esto caía en la pantalla completa de login, y el problema no era la
  // incoherencia con el modal: era que SE PERDÍA LA INTENCIÓN. El viajero
  // entraba y aterrizaba en el inicio, no en el perfil que había pedido.
  //
  // La salida es mostrar el inicio con el modal encima, y lo bueno es que no
  // hay que recordar a dónde iba: `view` NUNCA cambia, así que en cuanto hay
  // sesión esta condición se apaga sola y la vista pedida se renderiza. El
  // destino no se guarda en ningún lado porque ya está en la URL.
  const pideCuentaPorUrl = !user && ACCOUNT_VIEWS.includes(view);
  // El panel expulsa a "home" SOLO cuando el perfil de operador ya está
  // resuelto y dice que no es operador. Mientras resuelve (operatorResolved
  // false), el render de "dashboard" muestra "Cargando tu panel…" en vez de
  // decidir con el isOperator=false transitorio (guard derivado, sin flash).
  const effectiveView =
    user && view === "login" ? "home"
      : pideCuentaPorUrl ? "home"
        // Respaldo, y hoy es SOLO respaldo: GUEST_VIEWS y ACCOUNT_VIEWS cubren
        // las 13 vistas del router entre las dos, así que por acá no pasa
        // nadie. Se queda para que una vista nueva sin clasificar caiga en el
        // login en vez de renderizarse sin sesión.
        : !user && !allowedWithoutSession.includes(view) ? "login"
          : view === "dashboard" && operatorResolved && !isOperator ? "home"
            : view;
  const isAuth = !["login", "welcome"].includes(effectiveView);
  const showNav = isAuth && !["booking", "detail", "new-tour", "trip-detail"].includes(effectiveView);
  const showHeader = isAuth && !["booking", "new-tour"].includes(effectiveView);
  const showFooter = isAuth && !["booking", "detail", "new-tour", "dashboard", "trip-detail"].includes(effectiveView);
  // La ficha sale del estado si el usuario llegó navegando, y del SUFIJO DE LA
  // URL si llegó por un link. Sin lo segundo, abrir /tour/algo-abc123 en una
  // pestaña nueva mostraba una pantalla vacía.
  const currentTour = (() => {
    if (tour) return tours.find(t => t.id === tour.id) || tour;
    const seg = parseTourSegment(routeParams.seg);
    if (!seg) return null;
    return tours.find(t => t.id.endsWith(seg.suffix)) || deepTour;
  })();

  // ── Canonicalización, que reemplaza al 301 que la decisión pedía ──
  //
  // Un 301 es una respuesta HTTP y en una SPA pura NO HAY SERVIDOR que la emita:
  // los redirects de vercel.json son patrones estáticos y no pueden conocer el
  // slug canónico de un tour, que sale de la base. Ver docs/decisiones.md, que
  // se corrigió por esto.
  //
  // En su lugar, dos cosas que sí se pueden y cuestan cero:
  //   1. rel=canonical, que es el instrumento que Google define para consolidar
  //      señal entre URLs equivalentes. Es lo que evita el contenido duplicado
  //      cuando una agencia edita el título y la URL vieja sigue circulando.
  //   2. replaceState al canónico, para que la barra se autocorrija sin recargar
  //      y sin ensuciar el historial (replace y no push: el usuario no navegó).
  //
  // Y noindex en la pantalla de "no encontrado": sin eso Google indexaría los
  // 404 como páginas normales, porque el servidor responde 200 con la cáscara
  // de la SPA. Es un soft 404 y esto es lo que lo evita.
  const canonPath = effectiveView === "detail" && currentTour
    ? canonicalTourPath(currentTour)
    : null;
  const noindex = effectiveView === "not-found" || deepState === "missing";
  useEffect(() => {
    if (typeof document === "undefined") return;
    let link = document.querySelector('link[rel="canonical"]');
    if (canonPath) {
      if (!link) {
        link = document.createElement("link");
        link.rel = "canonical";
        document.head.appendChild(link);
      }
      link.href = window.location.origin + canonPath;
      if (window.location.pathname !== canonPath) {
        window.history.replaceState(window.history.state, "", canonPath);
      }
    } else if (link && !link.dataset.prerender) {
      // Solo se saca el canonical que puso ESTA app. El que trae el HTML
      // estático del prerender lleva data-prerender y se respeta.
      link.remove();
    }
    let robots = document.querySelector('meta[name="robots"]');
    if (noindex) {
      if (!robots) {
        robots = document.createElement("meta");
        robots.name = "robots";
        // Marca de propiedad: este efecto SOLO borra lo que él mismo creó.
        robots.dataset.spa = "1";
        document.head.appendChild(robots);
      }
      robots.content = "noindex";
    } else if (robots && robots.dataset.spa === "1") {
      // ESTA CONDICIÓN ES LA QUE IMPORTA, y ya falló DOS VECES, una por cada
      // lado. El efecto no puede borrar una etiqueta `robots` que venía en el
      // HTML: solo la suya.
      //
      // 1º: las fichas prerenderizadas traen `noindex` en el HTML. El efecto lo
      //     borraba al montar, así que sobrevivía solo hasta que arrancaba el
      //     JavaScript. Se tapó con `!robots.dataset.prerender`.
      // 2º: el 2026-08-17 se agregó el `noindex` general a index.html, que NO
      //     lleva ese atributo, así que la excepción anterior no lo cubría y el
      //     efecto volvía a borrarlo en la portada y el buscador. Justo las dos
      //     pantallas que esa línea venía a proteger.
      //
      // Preguntar "¿de quién es esta etiqueta?" en vez de ir listando las que
      // hay que respetar cierra la familia entera: cualquier `robots` que se
      // agregue al HTML mañana queda a salvo sin tocar esto.
      robots.remove();
    }
  }, [canonPath, noindex]);
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
        {showHeader && <TopNav onHome={() => go("home")} onDash={() => go(view === "dashboard" ? "home" : "dashboard")} notifs={notifs} unread={unread} onNotifSelect={handleNotifSelect} onMarkAll={() => markNotifsSeen(notifs.map((n) => n.id))} view={view} isOperator={isOperator} operatorResolved={operatorResolved} navActive={nav} onNavClick={navGo} />}
        {effectiveView === "login" && <LoginView go={go} loginMsg={loginMsg} onGuest={handleGuest} />}
        {effectiveView === "welcome" && <WelcomeView go={go} />}
        {effectiveView === "not-found" && <NotFoundView go={go} />}
        {effectiveView === "reset-password" && <ResetPasswordView go={go} />}
        {effectiveView === "home" && <HomeView go={go} cat={cat} setCat={setCat} tours={tours} toursLoading={toursLoading} selectedDept={selectedDept} setSelectedDept={pickDept} yaEligio={yaEligio} sugerenciaCambio={sugerenciaCambio} />}
        {effectiveView === "catalog" && <CatalogView go={go} cat={cat} setCat={setCat} tours={tours} toursLoading={toursLoading} />}
        {effectiveView === "detail" && (currentTour
          ? <DetailView tour={currentTour} go={go} onBook={handleBook} reviews={reviews} />
          : deepState === "missing"
            ? <NotFoundView go={go} deTour />
            : <div className="fu" style={{ minHeight: "50vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--gy)", fontSize: 14, fontWeight: 600 }}>Cargando el tour…</div>)}
        {effectiveView === "booking" && (currentTour
          ? <BookingView tour={currentTour} go={go} onLocalBookingSuccess={handleAddLocalTrip} onNeedAccount={(onDone) => askAccount("booking", onDone)} />
          : deepState === "missing"
            ? <NotFoundView go={go} deTour />
            : <div className="fu" style={{ minHeight: "50vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--gy)", fontSize: 14, fontWeight: 600 }}>Cargando el tour…</div>)}
        {effectiveView === "notifications" && <NotifsView notifs={notifs} onSelect={handleNotifSelect} onMarkAll={() => markNotifsSeen(notifs.map((n) => n.id))} />}
        {effectiveView === "trips" && <TripsView go={go} onSelectTrip={setCurrentTrip} trips={trips} />}
        {effectiveView === "trip-detail" && <TripDetailView trip={currentTrip} go={go} onReview={handleReview} />}
        {effectiveView === "profile" && <ProfileView go={go} onLogout={handleLogout} />}
        {effectiveView === "dashboard" && (operatorResolved
          ? <DashView go={go} opTours={opTours} opDepartures={opDepartures} depsLoading={depsLoading} depsError={depsError} onReloadDepartures={loadDepartures} onDepartureAction={handleDepartureAction} onEditTour={handleEditTour} onDeleteTour={handleDeleteTour} onToggleActive={handleToggleTourActive} initialTab={dashTab} onTabConsumed={() => setDashTab("bookings")} onBusinessSaved={async () => { await loadPublicTours(); await loadOperatorTours(); }} />
          : <div className="fu" style={{ minHeight: "50vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--gy)", fontSize: 14, fontWeight: 600 }}>Cargando tu panel…</div>)}
        {effectiveView === "new-tour" && <NewTourView go={go} editingTour={editingTour} onSaveTour={handleSaveTour} onCreateTour={handleCreateTour} onCancel={handleCancelTour} />}
        {showFooter && <Footer go={go} />}
        {showNav && <BNav active={nav} go={navGo} />}
        {/* Dentro de .app y no portalizado: ahí viven las variables de marca.
            El modal se abre por dos caminos y cada uno cierra distinto:
            - por un click (accountAsk): al entrar se completa la navegación que
              se había pedido, y cerrar simplemente lo saca.
            - por la URL (pideCuentaPorUrl): al entrar no hay nada que hacer,
              porque `view` ya apunta al destino y la condición se apaga sola.
              Cerrar SÍ tiene que navegar al inicio: si no, `view` seguiría
              siendo la vista privada y el modal se reabriría solo. */}
        {accountAsk ? (
          <AccountModal
            reason={accountAsk.reason}
            onClose={closeAccountAsk}
            onSuccess={handleAccountSuccess}
          />
        ) : pideCuentaPorUrl ? (
          <AccountModal
            reason={view}
            onClose={() => navigateTo("home")}
            onSuccess={closeAccountAsk}
          />
        ) : null}
      </div>
    </>
  );
}