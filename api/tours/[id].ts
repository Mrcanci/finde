// api/tours/[id].ts
// GET /api/tours/:id
// Detalle público de un tour, con operador extendido.

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { db } from "../../lib/db.js";
import {
  DETAIL_SELECT,
  OPERATOR_DETAIL_SELECT,
  gateOperatorMincetur,
} from "../../lib/tour-select.js";
import { requireOperator } from "../../lib/auth.js";
import { limaDateISO } from "../../lib/inventory.js";
import {
  parseTourInput,
  embedTourSafe,
  faltaParaPublicar,
  mensajeFaltaParaPublicar,
} from "../../lib/tour-input.js";
import { supabaseAdmin } from "../../lib/supabase-admin.js";

const STORAGE_BUCKET = "tour-images";
// Marca de las URLs públicas de NUESTRO bucket. Solo borramos de Storage las
// imágenes que viven aquí; URLs externas (p.ej. unsplash del seed) se ignoran.
const PUBLIC_PREFIX = `/storage/v1/object/public/${STORAGE_BUCKET}/`;

// De una imageUrl pública de tour-images, extrae el path del archivo
// (${operatorId}/${uuid}.${ext}). Devuelve null si la URL no es de nuestro
// bucket (no se debe tocar Storage en ese caso).
function storagePathFromImageUrl(imageUrl: string | null): string | null {
  if (!imageUrl) return null;
  const idx = imageUrl.indexOf(PUBLIC_PREFIX);
  if (idx === -1) return null;
  const path = imageUrl.slice(idx + PUBLIC_PREFIX.length);
  return path.length > 0 ? path : null;
}

// Mensaje 409 al intentar borrar un tour que tiene reservas: invita a PAUSAR
// (active:false) en su lugar, que lo oculta del catálogo conservando tour y
// reservas. Mismo texto para el chequeo previo y la red de seguridad P2003.
function bookingsBlockedMessage(n: number): string {
  return `Este tour tiene ${n} reserva${n === 1 ? "" : "s"}. Púsalo en pausa en lugar de borrarlo.`;
}

const paramsSchema = z.object({
  id: z.string().min(1),
});

// ── Resolución por SUFIJO del cuid (para la URL pública del tour) ──
//
// La ruta pública es /tour/<slug>-<sufijo>, y el sufijo son los 6 últimos
// caracteres del cuid (ver docs/decisiones.md). Este GET acepta las dos formas:
// el cuid entero de 25 caracteres, como siempre, o el sufijo de 6.
//
// Va acá y NO en un endpoint nuevo porque Vercel Hobby permite 12 funciones y
// hay exactamente 12. Este archivo ya existe, así que la ruta pública sale
// gratis en slots.
const SUFFIX_RE = /^[a-z0-9]{6}$/;

// Encuentra el tour por sufijo. Devuelve el id, o null si no hay ninguno.
//
// La colisión de sufijos es improbable (el 1% se alcanza recién a los 6.615
// tours) pero no imposible, así que hay red: si aparece más de uno, se desempata
// con el slug que venía en la URL. Si sigue ambiguo, null. Una colisión DEGRADA
// en vez de romper.
//
// El LIKE '%sufijo' no usa índice: es un barrido secuencial. Medido con 49
// tours son 0,065 ms, más rápido que el índice por id porque la tabla entra en
// una página. Si algún día molesta, la salida es un índice por expresión
// right(id, 6), que Prisma no sabe expresar y hay que crear con SQL crudo.
async function resolveBySuffix(
  suffix: string,
  slug: string | null
): Promise<string | null> {
  const candidatos = await db.tour.findMany({
    where: { id: { endsWith: suffix } },
    select: { id: true, title: true, city: true },
  });
  if (candidatos.length === 0) return null;
  if (candidatos.length === 1) return candidatos[0].id;
  console.warn(`[tours] colisión de sufijo "${suffix}": ${candidatos.length} tours`);
  if (!slug) return null;
  // Mismo slugify que src/lib/routes.js. Está duplicado a propósito: el backend
  // no importa del frontend, y son cinco líneas. Si alguna vez divergen, el
  // único efecto es que un desempate falle y responda 404, no un dato erróneo.
  const norm = (t: string): string =>
    (t || "")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/ñ/gi, "n")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/-{2,}/g, "-")
      .replace(/^-+|-+$/g, "");
  const exactos = candidatos.filter(
    (c) => norm(c.title).startsWith(slug) || norm(c.city).startsWith(slug)
  );
  return exactos.length === 1 ? exactos[0].id : null;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method === "PUT") {
    await handlePut(req, res);
    return;
  }
  if (req.method === "DELETE") {
    await handleDelete(req, res);
    return;
  }
  if (req.method === "PATCH") {
    await handlePatch(req, res);
    return;
  }
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET, PUT, DELETE, PATCH");
    res.status(405).json({ error: "Método no permitido" });
    return;
  }

  const parsed = paramsSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({
      error: "Parámetros inválidos",
      details: parsed.error.issues,
    });
    return;
  }

  const { id: param } = parsed.data;

  // El parámetro puede ser el cuid entero (25 chars, como siempre) o el sufijo
  // de 6 que usa la URL pública. ?slug= es opcional y solo sirve para desempatar
  // una colisión de sufijos.
  let id = param;
  if (SUFFIX_RE.test(param)) {
    const sq = req.query.slug;
    const slug = (Array.isArray(sq) ? sq[0] : sq) ?? null;
    const resuelto = await resolveBySuffix(param, slug);
    if (!resuelto) {
      res.status(404).json({ error: "Tour no encontrado" });
      return;
    }
    id = resuelto;
  }

  // Rango opcional ?from=&to= (YYYY-MM-DD, máx 62 días): disponibilidad de
  // cupos para el calendario del viajero. Ambos o ninguno.
  const fq = req.query.from;
  const tq = req.query.to;
  const from = Array.isArray(fq) ? fq[0] : fq;
  const to = Array.isArray(tq) ? tq[0] : tq;
  let range: { from: string; to: string } | null = null;
  if (from || to) {
    const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
    if (!from || !to || !DATE_RE.test(from) || !DATE_RE.test(to) || to < from) {
      res.status(400).json({ error: "Rango de fechas inválido (from y to en formato YYYY-MM-DD)" });
      return;
    }
    const days =
      (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000;
    if (days > 62) {
      res.status(400).json({ error: "El rango máximo es de 62 días" });
      return;
    }
    range = { from, to };
  }

  try {
    const tour = await db.tour.findUnique({
      where: { id },
      select: DETAIL_SELECT,
    });

    // Pausado (active:false) → 404 público: un link directo no debe mostrarlo
    // (M-2). El dueño gestiona sus pausados vía GET /api/operators/me/tours.
    if (!tour || !tour.active) {
      res.status(404).json({ error: "Tour no encontrado" });
      return;
    }

    const availability = range
      ? await computeAvailability(id, range.from, range.to)
      : null;

    // Gateo: el mincetur de un operador no verificado nunca sale en el payload.
    gateOperatorMincetur(tour);
    res.status(200).json(availability ? { tour, availability } : { tour });
  } catch (error) {
    console.error(`Error en GET /api/tours/${id}:`, error);
    res.status(500).json({ error: "Error interno" });
  }
}

// Disponibilidad pública de un rango: fechas SIN cupo (full) y fechas con 1-3
// restantes (low). El allotment se consulta ACÁ server-side y JAMÁS viaja en
// el payload: la respuesta solo revela números cuando son 0-3, que es la
// información de escasez permitida ("Sin cupos" / "Últimos N cupos"). base =
// restante por defecto para fechas sin salida materializada, solo cuando el
// cupo total del tour ya es <= 3 (si no, null y el total es indeducible).
// Solo aplica a CUPO_FIJO con cupo configurado; en SOLICITUD devuelve null y
// el campo no viaja.
async function computeAvailability(
  tourId: string,
  from: string,
  to: string
): Promise<{ from: string; to: string; full: string[]; low: Record<string, number>; base: number | null } | null> {
  const config = await db.tour.findUnique({
    where: { id: tourId },
    select: { salesMode: true, allotment: true },
  });
  if (!config || config.salesMode !== "CUPO_FIJO" || config.allotment == null) {
    return null;
  }
  const departures = await db.departure.findMany({
    where: { tourId, date: { gte: from, lte: to } },
    select: { date: true, status: true, seatsTaken: true, allotmentOverride: true },
  });
  const full: string[] = [];
  const low: Record<string, number> = {};
  for (const dep of departures) {
    const cupo = dep.allotmentOverride ?? config.allotment;
    const left = dep.status === "CANCELADA" ? 0 : Math.max(cupo - dep.seatsTaken, 0);
    if (left <= 0) full.push(dep.date);
    else if (left <= 3) low[dep.date] = left;
  }
  return { from, to, full, low, base: config.allotment <= 3 ? config.allotment : null };
}

// ── PUT /api/tours/:id — editar un tour propio del operador autenticado ──
// Verifica propiedad (tour.operatorId === operator.id) antes de tocar nada.
// El mapeo form→schema y el embedding on-write viven en lib/tour-input.js,
// compartidos con POST /api/tours (api/tours/index.ts).

async function handlePut(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  let operator: { id: string; name: string; verified: boolean };
  try {
    ({ operator } = await requireOperator(req, res));
  } catch {
    return; // requireOperator ya respondió 401 (sin sesión) o 403 (no operador)
  }

  const id = typeof req.query.id === "string" ? req.query.id : "";
  if (!id) {
    res.status(400).json({ error: "id inválido" });
    return;
  }

  // Verificación de PROPIEDAD: solo el dueño puede editar su tour.
  const existing = await db.tour.findUnique({
    where: { id },
    select: { id: true, operatorId: true },
  });
  if (!existing) {
    res.status(404).json({ error: "Tour no encontrado" });
    return;
  }
  if (existing.operatorId !== operator.id) {
    res.status(403).json({ error: "No puedes editar este tour" });
    return;
  }

  const input = parseTourInput(req.body);
  if (!input.ok) {
    res.status(input.status).json({ error: input.error, details: input.details });
    return;
  }

  let tour: Prisma.TourGetPayload<{ select: typeof DETAIL_SELECT }>;
  try {
    tour = await db.tour.update({
      where: { id },
      // operatorId NO se toca (el tour sigue siendo del mismo operador).
      // language se OMITE a propósito: el form no lo captura y resetearlo a
      // ["es"] clobbearía tours multi-idioma; se preserva el valor existente.
      data: input.data,
      select: DETAIL_SELECT,
    });
  } catch (error) {
    console.error("Error actualizando tour:", error);
    res.status(500).json({ error: "Error actualizando el tour" });
    return;
  }

  // Re-embed SIEMPRE (Opción A): si Voyage falla, el update igual persiste y
  // embedding queda NULL (backfill pendiente).
  await embedTourSafe(tour.id, input.embeddingText);

  res.status(200).json({ tour });
}

// ── DELETE /api/tours/:id — borrar un tour propio (hard delete) + su foto ──
// Verifica propiedad (mismo patrón que PUT). Orden de borrado: DB primero,
// Storage después. Si el borrado de la foto falla, NO rompe la request: el
// tour ya está borrado y una foto huérfana es un problema menor (se loguea).
// Solo se intenta borrar de Storage si la imageUrl pertenece a nuestro bucket
// tour-images; las URLs externas (unsplash del seed) se dejan intactas.

async function handleDelete(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  let operator: { id: string; name: string; verified: boolean };
  try {
    ({ operator } = await requireOperator(req, res));
  } catch {
    return; // requireOperator ya respondió 401 (sin sesión) o 403 (no operador)
  }

  const id = typeof req.query.id === "string" ? req.query.id : "";
  if (!id) {
    res.status(400).json({ error: "id inválido" });
    return;
  }

  // Verificación de PROPIEDAD: solo el dueño puede borrar su tour.
  const existing = await db.tour.findUnique({
    where: { id },
    select: { id: true, operatorId: true, imageUrl: true, images: true },
  });
  if (!existing) {
    res.status(404).json({ error: "Tour no encontrado" });
    return;
  }
  if (existing.operatorId !== operator.id) {
    res.status(403).json({ error: "No puedes borrar este tour" });
    return;
  }

  // Protección de reservas: borrar un tour con reservas las destruiría. Si tiene
  // CUALQUIER reserva (futura o pasada), se rechaza con 409 e invita a PAUSAR el
  // tour (active:false), que lo oculta del catálogo conservando tour y reservas.
  const bookingsCount = await db.booking.count({ where: { tourId: id } });
  if (bookingsCount > 0) {
    res
      .status(409)
      .json({ error: bookingsBlockedMessage(bookingsCount), bookingsCount });
    return;
  }

  // (a) Borrar el tour de la DB PRIMERO. Si falla, no tocamos Storage.
  try {
    await db.tour.delete({ where: { id } });
  } catch (error) {
    // Red de seguridad: si una reserva entró entre el count y el delete, el FK
    // Restrict (Booking.tour) hace fallar el delete con P2003. Lo traducimos al
    // MISMO 409 limpio en vez de un 500 (re-contamos para el conteo actual).
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      const n = await db.booking.count({ where: { tourId: id } });
      res.status(409).json({ error: bookingsBlockedMessage(n), bookingsCount: n });
      return;
    }
    console.error("Error borrando tour:", error);
    res.status(500).json({ error: "Error borrando el tour" });
    return;
  }

  // (b) Borrar las fotos de Storage DESPUÉS, solo las que viven en nuestro
  // bucket. Con galería hay que limpiar portada (imageUrl) Y galería (images[]),
  // o quedan huérfanas. La portada suele estar también en images[] → DEDUP.
  // Un fallo aquí se loguea pero NO rompe la request: el tour ya se borró.
  const paths = [
    ...new Set(
      [existing.imageUrl, ...(existing.images || [])]
        .map(storagePathFromImageUrl)
        .filter((p): p is string => p !== null)
    ),
  ];
  if (paths.length > 0) {
    try {
      const { error } = await supabaseAdmin.storage
        .from(STORAGE_BUCKET)
        .remove(paths);
      if (error) {
        console.error(
          "Tour borrado, pero falló borrar fotos de Storage (huérfanas):",
          paths,
          error
        );
      } else {
        console.log(`Tour borrado: ${paths.length} foto(s) limpiada(s) de Storage`);
      }
    } catch (error) {
      console.error(
        "Tour borrado, pero error inesperado borrando fotos de Storage:",
        paths,
        error
      );
    }
  }

  res.status(200).json({ ok: true, id });
}

// ── PATCH /api/tours/:id — pausar/reanudar + config de venta (fase panel) ──
// Body parcial: { active } sigue funcionando idéntico (contrato por adición), y
// ahora acepta la config del sistema de salidas: salesMode, allotment,
// minQuorum, closeTime, closeDaysBefore (null = volver al default). Las
// validaciones corren sobre el estado RESULTANTE (valor entrante ?? actual).
// Mismo patrón de propiedad que PUT/DELETE.
//
// Este PATCH NO mueve contadores de Departure: seatsTaken/seatsRequested los
// mueven SOLO la creación de reservas, la confirmación/rechazo en lote y la
// cancelación del motor (lib/inventory.ts).

const patchBodySchema = z
  .object({
    active: z.boolean().optional(),
    salesMode: z.enum(["CUPO_FIJO", "SOLICITUD"]).optional(),
    allotment: z.number().int().min(1).max(3000).nullable().optional(),
    minQuorum: z.number().int().min(1).max(3000).nullable().optional(),
    closeTime: z
      .string()
      .regex(
        /^([01]\d|2[0-3]):[0-5]\d$/,
        "closeTime debe tener formato HH:MM (24 horas)"
      )
      .nullable()
      .optional(),
    closeDaysBefore: z.number().int().min(0).max(30).nullable().optional(),
  })
  .refine((b) => Object.values(b).some((v) => v !== undefined), {
    message: "El cuerpo debe incluir al menos un campo para actualizar",
  });

async function handlePatch(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  let operator: { id: string; name: string; verified: boolean };
  try {
    ({ operator } = await requireOperator(req, res));
  } catch {
    return; // requireOperator ya respondió 401 (sin sesión) o 403 (no operador)
  }

  const id = typeof req.query.id === "string" ? req.query.id : "";
  if (!id) {
    res.status(400).json({ error: "id inválido" });
    return;
  }

  const parsed = patchBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Cuerpo inválido", details: parsed.error.issues });
    return;
  }

  // Verificación de PROPIEDAD: solo el dueño puede cambiar el estado. El select
  // trae la config de venta actual para validar el estado RESULTANTE.
  const existing = await db.tour.findUnique({
    where: { id },
    select: {
      id: true,
      operatorId: true,
      salesMode: true,
      allotment: true,
      minQuorum: true,
      closeTime: true,
      closeDaysBefore: true,
      // Para la guarda de publicación de más abajo.
      shortPitch: true,
      description: true,
      imageUrl: true,
    },
  });
  if (!existing) {
    res.status(404).json({ error: "Tour no encontrado" });
    return;
  }
  if (existing.operatorId !== operator.id) {
    res.status(403).json({ error: "No puedes modificar este tour" });
    return;
  }

  const body = parsed.data;

  // ── Publicar exige la metadata mínima ──
  //
  // La barrera del formulario (POST y PUT pasan por parseTourInput) NO cubría
  // este camino: el PATCH tiene su propio schema, pensado para la config de
  // venta, y nunca miraba el contenido. Así se podía apretar "activar" en el
  // panel y devolver al catálogo público un tour sin gancho, que es lo que se
  // comparte por WhatsApp y lo que Google usa de snippet.
  //
  // Es el mismo patrón que ya apareció con el motor de inventario: la guarda
  // puesta en un camino y no en el otro. Por eso la condición vive en
  // lib/tour-input.ts, junto a los números que valida el formulario, y no acá.
  //
  // Se dispara cuando el cuerpo PIDE active:true, no cuando el tour ya lo está.
  // Así pausar nunca se bloquea, y cambiar el modo de venta de un tour ya
  // publicado tampoco: lo único que se impide es que uno incompleto ENTRE al
  // catálogo. Los 5 tours de MEGATOURS que hoy están activos sin gancho siguen
  // publicados; solo tendrán que completarlo si alguna vez los pausan.
  if (body.active === true) {
    const falta = faltaParaPublicar(existing);
    if (falta.length > 0) {
      res.status(400).json({
        error: mensajeFaltaParaPublicar(falta),
        missing: falta,
      });
      return;
    }
  }

  // Estado resultante = entrante ?? actual (undefined preserva; null limpia y
  // vuelve al default del motor).
  const next = {
    salesMode: body.salesMode ?? existing.salesMode,
    allotment: body.allotment === undefined ? existing.allotment : body.allotment,
    minQuorum: body.minQuorum === undefined ? existing.minQuorum : body.minQuorum,
  };

  if (next.salesMode === "CUPO_FIJO" && next.allotment == null) {
    res
      .status(400)
      .json({
        error:
          "Configura los cupos por salida para usar confirmación automática.",
      });
    return;
  }
  if (next.salesMode === "CUPO_FIJO" && next.minQuorum != null) {
    res.status(400).json({
      error:
        "El mínimo de personas solo aplica con confirmación manual. Quítalo para usar confirmación automática.",
    });
    return;
  }

  // ── Pasar a CUPO_FIJO con solicitudes pendientes: 409 ──
  //
  // Solo esta dirección, y solo con solicitudes VIGENTES. El motivo es concreto
  // y no simetría: una solicitud pendiente retiene `seatsRequested`, y takeSeats
  // (el que decide la venta en CUPO_FIJO) **no mira ese contador**, solo
  // seatsTaken. Los asientos quedarían invisibles y el tour podría vender su
  // cupo entero encima de gente que ya está esperando respuesta. Es la
  // sobreventa que costó un backfill en agosto de 2026.
  //
  // Lo que NO se bloquea, a propósito:
  //   · pasar a SOLICITUD. Ese modo no tiene tope de cupo por diseño, así que
  //     los asientos confirmados que vienen de la etapa CUPO_FIJO siguen
  //     contando en seatsTaken y no hay contador invisible. Y si más adelante
  //     se vuelve a CUPO_FIJO, la validación de abajo (allotment contra
  //     seatsTaken) cubre ese caso.
  //   · las reservas CONFIRMADAS. Viven en seatsTaken, que takeSeats SÍ mira:
  //     el cupo ya las descuenta. Bloquear por ellas trabaría la configuración
  //     sin ningún riesgo detrás.
  //
  // "Vigente" se define igual que en el panel (api/operators/me/[resource].ts):
  // SOLICITUD con expiresAt null o todavía en el futuro. Y de esa definición
  // sale la propiedad que hace que este bloqueo SIEMPRE tenga salida: como
  // expiresAt = min(cierre, creación+72h, medianoche del día de salida), una
  // solicitud que no venció pertenece por fuerza a una salida futura, y en las
  // salidas futuras el panel sí ofrece confirmar y rechazar. La agencia se
  // desbloquea sola, sin que nadie toque la base.
  //
  // La rama `expiresAt: null` es DEFENSIVA Y ESTÁ MUERTA, y eso es lo que
  // vuelve estructural a la garantía de arriba. Verificado el 2026-08-15
  // recorriendo el código entero: **hay un solo lugar que crea una reserva**,
  // api/bookings.ts, y ahí `expiresAt` es null si y solo si el modo es
  // CUPO_FIJO (o sea, si NO nace como SOLICITUD); en el otro camino siempre
  // sale de solicitudExpiresAt, que devuelve una fecha, nunca null. Los dos
  // únicos lugares que escriben `expiresAt: null` (la decisión de la agencia y
  // la cancelación interna) lo hacen en la misma operación en que mandan la
  // reserva a un estado terminal, así que un null jamás convive con SOLICITUD.
  // Y el backfill viejo que originó las 19 inmortales solo tocaba reservas con
  // statusNew NULL, de las que ya no queda ninguna.
  //
  // Consecuencia: en el peor de los casos este bloqueo se resuelve SOLO, por
  // vencimiento, en la medianoche del día de salida como tope duro. No puede
  // volver a existir una solicitud que no venza nunca y trabe la configuración
  // para siempre. Si algún día aparece otro camino que cree reservas, esa
  // propiedad hay que volver a verificarla acá.
  if (
    body.salesMode !== undefined &&
    body.salesMode !== existing.salesMode &&
    body.salesMode === "CUPO_FIJO"
  ) {
    const ahora = new Date();
    const pendientes = await db.booking.findMany({
      where: {
        tourId: id,
        statusNew: "SOLICITUD",
        OR: [{ expiresAt: null }, { expiresAt: { gt: ahora } }],
      },
      select: {
        guests: true,
        // startTime sale de la SALIDA y no del tour: se copia al materializar
        // (pin), así que editar el tour no mueve las salidas ya vendidas y es
        // el único valor que describe de verdad esa salida.
        departure: { select: { date: true, startTime: true } },
      },
    });
    if (pendientes.length > 0) {
      const personas = pendientes.reduce((n, b) => n + b.guests, 0);
      const salidas = [
        ...new Map(
          pendientes
            .filter((b) => b.departure)
            .map((b) => [b.departure!.date, b.departure!])
        ).values(),
      ].sort((a, b) => a.date.localeCompare(b.date));
      const fechas = salidas.map((d) => d.date);

      // "23 de agosto a las 08:00". Mediodía UTC para que el formateo en hora
      // de Lima nunca caiga en el día anterior.
      const legible = (d: { date: string; startTime: string | null }): string => {
        const [y, m, dd] = d.date.split("-").map(Number);
        const txt = new Intl.DateTimeFormat("es-PE", {
          timeZone: "America/Lima",
          day: "numeric",
          month: "long",
        }).format(new Date(Date.UTC(y, m - 1, dd, 12)));
        return d.startTime ? `${txt} a las ${d.startTime}` : txt;
      };
      // Con muchas salidas la enumeración deja de ayudar: el detalle viaja
      // igual en `departures` para que la UI lo use como quiera.
      const partes = salidas.map(legible);
      const cuando =
        partes.length === 0
          ? ""
          : partes.length > 3
            ? ` en ${partes.length} salidas`
            : partes.length === 1
              ? ` para el ${partes[0]}`
              : ` para el ${partes.slice(0, -1).join(", el ")} y el ${partes[partes.length - 1]}`;

      // El mensaje dice QUÉ HACER, no por qué el sistema no puede. El mecanismo
      // (que esos asientos dejarían de contar para el cupo) es problema nuestro.
      // "Reservas" es el nombre EXACTO de la pestaña del panel, y "automática"
      // es como la interfaz llama a CUPO_FIJO: los nombres internos no salen.
      const una = pendientes.length === 1;
      res.status(409).json({
        error:
          `Tienes ${pendientes.length} solicitud${una ? "" : "es"} sin responder${cuando}. ` +
          `${una ? "Resuélvela" : "Resuélvelas"} en Reservas para poder cambiar a confirmación automática.`,
        pendingRequests: pendientes.length,
        pendingGuests: personas,
        departures: fechas,
      });
      return;
    }
  }

  // Con CUPO_FIJO, el cupo debe cubrir los asientos YA confirmados de las
  // salidas vivas (futuras, no canceladas, sin override propio). Cubre tanto
  // el cambio de modo como bajar el allotment con ventas hechas.
  if (next.salesMode === "CUPO_FIJO" && next.allotment != null) {
    const agg = await db.departure.aggregate({
      _max: { seatsTaken: true },
      where: {
        tourId: id,
        date: { gte: limaDateISO(new Date()) },
        status: { not: "CANCELADA" },
        allotmentOverride: null,
      },
    });
    const maxTaken = agg._max.seatsTaken ?? 0;
    if (next.allotment < maxTaken) {
      res.status(409).json({
        error: `Hay salidas próximas con ${maxTaken} asiento${maxTaken === 1 ? "" : "s"} confirmado${maxTaken === 1 ? "" : "s"}. El cupo no puede ser menor a eso.`,
        maxSeatsTaken: maxTaken,
      });
      return;
    }
  }

  let tour: Prisma.TourGetPayload<{ select: typeof OPERATOR_DETAIL_SELECT }>;
  try {
    tour = await db.tour.update({
      where: { id },
      // Solo los campos presentes en el body: lo demás se preserva.
      data: {
        ...(body.active !== undefined && { active: body.active }),
        ...(body.salesMode !== undefined && { salesMode: body.salesMode }),
        ...(body.allotment !== undefined && { allotment: body.allotment }),
        ...(body.minQuorum !== undefined && { minQuorum: body.minQuorum }),
        ...(body.closeTime !== undefined && { closeTime: body.closeTime }),
        ...(body.closeDaysBefore !== undefined && {
          closeDaysBefore: body.closeDaysBefore,
        }),
      },
      select: OPERATOR_DETAIL_SELECT,
    });
  } catch (error) {
    console.error("Error actualizando estado del tour:", error);
    res.status(500).json({ error: "Error actualizando el tour" });
    return;
  }

  res.status(200).json({ tour });
}
