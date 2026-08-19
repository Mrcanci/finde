import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url) {
  throw new Error("Falta VITE_SUPABASE_URL en el entorno (revisar .env.local)");
}
if (!anonKey) {
  throw new Error("Falta VITE_SUPABASE_ANON_KEY en el entorno (revisar .env.local)");
}

// EL HASH SE LEE ACA, ANTES DE createClient, Y NO ES UN DETALLE DE ORDEN.
// Cuando el enlace de recuperacion es valido, supabase-js saca los tokens de la
// URL haciendo `window.location.hash = ""`. Si lo leyeramos despues, la pantalla
// de contrasena nueva no tendria forma de saber que llego por un enlace de
// recuperacion, porque para cuando React monta el hash ya no existe.
//
// Medido el 2026-08-19 contra @supabase/auth-js de la version instalada (2.104.1),
// pegandole al endpoint de verificacion con un token invalido, sin mandar correos:
//
//   enlace VALIDO   -> #access_token=...&type=recovery&...   y el hash SE BORRA
//   enlace VENCIDO  -> #error=access_denied&error_code=otp_expired
//                      &error_description=Email+link+is+invalid+or+has+expired
//                      y el hash NO se borra, porque el cliente tira antes de
//                      llegar a la linea que lo limpia
//
// De ahi salen las dos cosas que exporta este archivo.
function leerHashDeAuth() {
  if (typeof window === "undefined") return {};
  const crudo = window.location.hash.replace(/^#/, "");
  if (!crudo) return {};
  const out = {};
  for (const [k, v] of new URLSearchParams(crudo)) out[k] = v;
  return out;
}

/** Los parametros del hash tal como llegaron, antes de que el cliente los limpie. */
export const initialAuthHash = leerHashDeAuth();

/** true si esta carga de pagina viene de un enlace de recuperacion, valido o no. */
export const llegoPorRecuperacion =
  initialAuthHash.type === "recovery" || !!initialAuthHash.error_code;

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
