// api/uploads/tour-image.ts
// POST /api/uploads/tour-image — emite una signed upload URL para subir la
// foto de un tour a Supabase Storage (bucket "tour-images").
//
// Flujo A: el backend (service role) genera la URL firmada tras requireOperator;
// el navegador sube el archivo DIRECTO a Storage con ella (sub-paso 3.2). El
// archivo NUNCA pasa por esta función, así que esquivamos el límite ~4.5MB de
// Vercel. Como no vemos los bytes, la validación de este endpoint es de
// identidad/intención: solo operadores, y solo contentType JPG/PNG declarado.
// Ver docs/tour-image-upload-plan.md (sub-paso 3.1).

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { supabaseAdmin } from "../../lib/supabase-admin.js";
import { requireOperator } from "../../lib/auth.js";

const BUCKET = "tour-images";

// Allowlist alineada con la config del bucket (MIME image/jpeg + image/png) y
// con lo que el form promete ("JPG o PNG"). La extensión final se deriva de aquí.
const CONTENT_TYPE_TO_EXT = {
  "image/jpeg": "jpg",
  "image/png": "png",
} as const;

const bodySchema = z.object({
  contentType: z.enum(["image/jpeg", "image/png"]),
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

  // (a) Solo operadores obtienen URL de subida. 401 sin sesión, 403 si no es
  // operador — requireOperator ya respondió en ambos casos.
  let operator: { id: string; name: string; verified: boolean };
  try {
    ({ operator } = await requireOperator(req, res));
  } catch {
    return;
  }

  // (b) Validar el contentType declarado contra la allowlist.
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "contentType inválido (solo image/jpeg o image/png)",
      details: parsed.error.issues,
    });
    return;
  }

  // (c) Ruta namespaceada por operador: evita colisiones y mantiene orden.
  // randomUUID() garantiza nombre único; la ext sale del contentType validado.
  const ext = CONTENT_TYPE_TO_EXT[parsed.data.contentType];
  const path = `${operator.id}/${randomUUID()}.${ext}`;

  // (d) Generar la signed upload URL (service role; bypassa RLS de Storage).
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUploadUrl(path);

  if (error || !data) {
    console.error("Error creando signed upload URL:", error);
    res.status(500).json({ error: "No se pudo preparar la subida" });
    return;
  }

  // (e) La URL pública final del archivo (bucket público) la calculamos ya:
  // el frontend la mete en form.photo tras subir con éxito (sub-paso 3.2).
  const { data: publicData } = supabaseAdmin.storage
    .from(BUCKET)
    .getPublicUrl(path);

  // token + path: lo que el navegador necesita para uploadToSignedUrl.
  res.status(200).json({
    token: data.token,
    path: data.path,
    publicUrl: publicData.publicUrl,
  });
}
