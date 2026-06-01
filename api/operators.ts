// api/operators.ts
// POST /api/operators — onboarding de operadores turísticos.
// Requiere sesión: liga el operador al usuario autenticado (Operator.userId)
// y toma el email del token, no del body. Crea la cuenta sin verificar
// (verified: false); la verificación manual ocurre off-platform en el sprint
// y la columna `verified` se marca true a mano.

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { db } from "../lib/db.js";
import { rateLimit, ipFromRequest } from "../lib/rate-limit.js";
import { requireAuth } from "../lib/auth.js";

// email NO va en el schema: la identidad sale del token (requireAuth →
// user.email), no del body. Consistente con POST /api/bookings.
const bodySchema = z.object({
  name: z.string().trim().min(3).max(100),
  phone: z
    .string()
    .trim()
    .regex(/^\d{8,15}$/, "phone debe tener entre 8 y 15 dígitos numéricos"),
  city: z.string().trim().min(2).max(50),
  // Reglas v1.2 §6.3: solo agencias con RUC pueden vender en Finde.
  ruc: z
    .string()
    .trim()
    .regex(/^\d{11}$/, "ruc debe tener exactamente 11 dígitos numéricos"),
});

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Método no permitido" });
    return;
  }

  // El onboarding requiere sesión: el operador se liga al usuario autenticado.
  let user;
  try {
    user = await requireAuth(req, res);
  } catch {
    return; // requireAuth ya respondió 401
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

  const { name, phone, city, ruc } = parsed.data;
  // Identidad desde el token, no del body.
  const email = user.email;
  if (!email) {
    res.status(400).json({ error: "La cuenta no tiene email asociado" });
    return;
  }

  // Un usuario solo puede tener un perfil de operador.
  const existing = await db.operator.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (existing) {
    res.status(409).json({ error: "Ya eres operador" });
    return;
  }

  let operador;
  try {
    operador = await db.operator.create({
      data: { name, email, phone, city, ruc, userId: user.id, verified: false },
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

  res.status(200).json({ operator: operador });
}
