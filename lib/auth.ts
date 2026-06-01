import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { User } from "@supabase/supabase-js";
import { supabaseAdmin } from "./supabase-admin.js";
import { db } from "./db.js";

export class AuthRequiredError extends Error {
  constructor(message = "No autorizado") {
    super(message);
    this.name = "AuthRequiredError";
  }
}

function extractBearerToken(req: VercelRequest): string | null {
  const header = req.headers.authorization;
  if (!header || typeof header !== "string") return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match ? match[1].trim() : null;
}

export async function getAuthUser(req: VercelRequest): Promise<User | null> {
  const token = extractBearerToken(req);
  if (!token) return null;

  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) return null;
    return data.user;
  } catch (err) {
    console.error("[auth] Error validando token:", err);
    return null;
  }
}

export async function requireAuth(
  req: VercelRequest,
  res: VercelResponse
): Promise<User> {
  const user = await getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: "No autorizado" });
    throw new AuthRequiredError();
  }
  return user;
}

// requireOperator: sobre requireAuth, resuelve el Operator del usuario.
// 401 si no hay sesión (vía requireAuth), 403 si la cuenta no es operador.
// Lanza AuthRequiredError en ambos casos para que el `catch { return }` de
// los handlers funcione igual que con requireAuth.
export async function requireOperator(
  req: VercelRequest,
  res: VercelResponse
): Promise<{ user: User; operator: { id: string; name: string; verified: boolean } }> {
  const user = await requireAuth(req, res);
  const operator = await db.operator.findUnique({
    where: { userId: user.id },
    select: { id: true, name: true, verified: true },
  });
  if (!operator) {
    res.status(403).json({ error: "Requiere perfil de operador" });
    throw new AuthRequiredError("Requiere perfil de operador");
  }
  return { user, operator };
}
