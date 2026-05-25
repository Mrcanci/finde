import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAuth } from "../lib/auth.js";

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

  // TODO(M1 sub-paso 8): incluir operator { id, verified, businessName } cuando exista Operator.userId.
  res.status(200).json({
    user: {
      id: user.id,
      email: user.email,
    },
  });
}
