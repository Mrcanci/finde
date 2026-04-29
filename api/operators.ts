// api/operators.ts
// POST /api/operators — onboarding de operadores turísticos.
// Crea una cuenta sin verificar (verified: false) y devuelve un sessionToken
// que también se setea como cookie HttpOnly. La verificación manual ocurre
// off-platform en el sprint; la columna `verified` se marca true a mano.
//
// El sessionToken NO se persiste en DB en este sprint: la cookie firmada por
// el dominio es suficiente para mostrar el dashboard demo. En producción
// (Pista B) se agrega tabla Sessions con expiración y revocación.

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { db } from "../lib/db.js";
import { rateLimit, ipFromRequest } from "../lib/rate-limit.js";

const SESSION_COOKIE = "finde_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 días

const bodySchema = z.object({
  name: z.string().trim().min(3).max(100),
  email: z.string().trim().toLowerCase().email().max(150),
  phone: z
    .string()
    .trim()
    .regex(/^\d{8,15}$/, "phone debe tener entre 8 y 15 dígitos numéricos"),
  city: z.string().trim().min(2).max(50),
  ruc: z
    .string()
    .trim()
    .regex(/^\d{11}$/, "ruc debe tener exactamente 11 dígitos numéricos")
    .optional(),
});

function buildSessionCookie(token: string): string {
  const parts = [
    `${SESSION_COOKIE}=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${SESSION_MAX_AGE_SECONDS}`,
  ];
  if (process.env.NODE_ENV === "production") {
    parts.push("Secure");
  }
  return parts.join("; ");
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Método no permitido" });
    return;
  }

  // Rate limit anti-spam de cuentas: 3/min por IP.
  const ip = ipFromRequest(req.headers["x-forwarded-for"]);
  const rl = rateLimit(ip, "operators", 3);
  if (!rl.allowed) {
    const seconds = rl.retryAfterSeconds ?? 60;
    res.setHeader("Retry-After", String(seconds));
    res.status(429).json({
      error: `Demasiadas peticiones, intenta en ${seconds} segundos`,
    });
    return;
  }

  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "Cuerpo inválido",
      details: parsed.error.issues,
    });
    return;
  }

  const { name, email, phone, city } = parsed.data;
  // TODO: persistir ruc cuando agreguemos la columna en Pista B (Fase Producción).
  // Por ahora validamos formato pero no lo guardamos.

  let operador;
  try {
    operador = await db.operator.create({
      data: { name, email, phone, city, verified: false },
      select: {
        id: true,
        name: true,
        email: true,
        city: true,
        verified: true,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      res.status(409).json({ error: "Ya existe una cuenta con ese email" });
      return;
    }
    console.error("Error creando operador:", error);
    res.status(500).json({ error: "Error creando la cuenta" });
    return;
  }

  const sessionToken = randomUUID();
  res.setHeader("Set-Cookie", buildSessionCookie(sessionToken));

  res.status(200).json({ operator: operador, sessionToken });
}
