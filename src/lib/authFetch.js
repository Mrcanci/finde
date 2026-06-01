import { supabase } from "./supabase.js";

// Wrapper de fetch para llamadas autenticadas al backend.
// Obtiene el access token de la sesión actual y lo agrega como
// Authorization: Bearer <token>. Si no hay sesión, no agrega el header
// y el backend responde 401. getSession() auto-refresca el token si está
// por vencer, así que no servimos tokens stale.
export async function authFetch(url, options = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const headers = new Headers(options.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);

  return fetch(url, { ...options, headers });
}
