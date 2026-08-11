// lib/traveler-emails.ts
// Emails al VIAJERO cuando la agencia decide una salida en lote (confirmar o
// rechazar). Agrupados por viajero dentro de la salida: un viajero con varias
// reservas recibe UN solo mensaje listando sus códigos, nunca dos emails
// idénticos. Textos placeholder en español (se pulen en la tanda de UI); el
// rechazo usa mensaje neutro que no culpa a la agencia.
// NUNCA lanza: todos los caminos de error se loguean y retornan (patrón de
// sendOperatorBookingEmail en api/bookings.ts). Pensado para correr vía
// waitUntil, fuera del camino crítico de la respuesta.

export interface TravelerBookingEmail {
  bookingCode: string;
  userName: string;
  userEmail: string;
  guests: number;
}

interface DecisionEmailParams {
  action: "confirm" | "reject";
  tourTitle: string;
  date: string; // "YYYY-MM-DD" de la salida (fecha Lima)
  startTime: string | null;
  bookings: TravelerBookingEmail[];
}

// Fecha larga en español a partir del "YYYY-MM-DD" de la salida. Mediodía Lima
// como ancla para que ninguna zona horaria corra el día.
function fechaLargaLima(date: string): string {
  return new Intl.DateTimeFormat("es-PE", {
    timeZone: "America/Lima",
    dateStyle: "long",
  }).format(new Date(`${date}T12:00:00-05:00`));
}

function personas(n: number): string {
  return `${n} persona${n === 1 ? "" : "s"}`;
}

function buildConfirmEmail(
  group: TravelerBookingEmail[],
  tourTitle: string,
  fecha: string,
  startTime: string | null
): { subject: string; text: string } {
  const [first] = group;
  const hora = startTime ? `\nHora de salida: ${startTime}` : "";
  if (group.length === 1) {
    return {
      subject: `Reserva confirmada ${first.bookingCode}: ${tourTitle}`,
      text: `Hola ${first.userName},

Tu reserva en Finde está confirmada.

Tour: ${tourTitle}
Fecha: ${fecha}${hora}
Personas: ${first.guests}
Código de reserva: ${first.bookingCode}

La agencia te contactará para coordinar los detalles.

El equipo de Finde`,
    };
  }
  const lista = group
    .map((b) => `- ${b.bookingCode}: ${personas(b.guests)}`)
    .join("\n");
  return {
    subject: `Reservas confirmadas: ${tourTitle}`,
    text: `Hola ${first.userName},

Tus reservas en Finde están confirmadas.

Tour: ${tourTitle}
Fecha: ${fecha}${hora}

Reservas confirmadas:
${lista}

La agencia te contactará para coordinar los detalles.

El equipo de Finde`,
  };
}

function buildRejectEmail(
  group: TravelerBookingEmail[],
  tourTitle: string,
  fecha: string
): { subject: string; text: string } {
  const [first] = group;
  if (group.length === 1) {
    return {
      subject: `Sobre tu solicitud ${first.bookingCode}: ${tourTitle}`,
      text: `Hola ${first.userName},

Te escribimos por tu solicitud de reserva ${first.bookingCode} para ${tourTitle} el ${fecha}.

Esta vez no fue posible completar la reserva para esa fecha. Puedes elegir otra fecha del mismo tour o explorar otras experiencias en finde.pe.

Gracias por usar Finde.

El equipo de Finde`,
    };
  }
  const codigos = group.map((b) => b.bookingCode).join(", ");
  return {
    subject: `Sobre tus solicitudes: ${tourTitle}`,
    text: `Hola ${first.userName},

Te escribimos por tus solicitudes de reserva para ${tourTitle} el ${fecha} (códigos ${codigos}).

Esta vez no fue posible completar las reservas para esa fecha. Puedes elegir otra fecha del mismo tour o explorar otras experiencias en finde.pe.

Gracias por usar Finde.

El equipo de Finde`,
  };
}

// Un envío individual vía Resend (fetch nativo, sin SDK), timeout duro de 5s.
async function sendOne(
  apiKey: string,
  to: string,
  subject: string,
  text: string
): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Finde <reservas@finde.pe>",
        to: [to],
        subject,
        text,
      }),
      signal: controller.signal,
    });
    if (!resp.ok) {
      const body = await resp.text().catch(() => "");
      console.error(`[email] Resend respondió ${resp.status} (no bloqueante):`, body);
      return;
    }
    console.log(`[email] decisión de salida enviada a ${to}`);
  } catch (error) {
    console.error("[email] Error enviando decisión al viajero (no bloqueante):", error);
  } finally {
    clearTimeout(timeout);
  }
}

export async function sendDepartureDecisionEmails(
  params: DecisionEmailParams
): Promise<void> {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn("[email] RESEND_API_KEY ausente, skip decisión de salida");
      return;
    }
    if (params.bookings.length === 0) return;

    // Agrupar por viajero (email case-insensitive): un mensaje por persona.
    const grupos = new Map<string, TravelerBookingEmail[]>();
    for (const b of params.bookings) {
      const key = b.userEmail.trim().toLowerCase();
      if (!key) continue;
      const g = grupos.get(key);
      if (g) g.push(b);
      else grupos.set(key, [b]);
    }

    const fecha = fechaLargaLima(params.date);
    await Promise.allSettled(
      [...grupos.values()].map((group) => {
        const { subject, text } =
          params.action === "confirm"
            ? buildConfirmEmail(group, params.tourTitle, fecha, params.startTime)
            : buildRejectEmail(group, params.tourTitle, fecha);
        return sendOne(apiKey, group[0].userEmail, subject, text);
      })
    );
  } catch (error) {
    console.error("[email] Error inesperado en decisión de salida (no bloqueante):", error);
  }
}
