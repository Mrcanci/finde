import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAuth } from "../lib/auth.js";
import { db } from "../lib/db.js";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  let user;
  try {
    user = await requireAuth(req, res);
  } catch {
    return; // requireAuth ya respondió 401
  }

  // Resolver si el usuario tiene un perfil de operador asociado.
  const operator = await db.operator.findUnique({
    where: { userId: user.id },
    select: { id: true, name: true, verified: true, city: true, ruc: true, phone: true, email: true, mincetur: true },
  });

  res.status(200).json({
    user: {
      id: user.id,
      email: user.email,
    },
    operator: operator ?? null,
  });
}
