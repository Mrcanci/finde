import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url) {
  throw new Error("Falta SUPABASE_URL (o VITE_SUPABASE_URL) en el entorno");
}
if (!serviceKey) {
  throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY en el entorno");
}

const globalForSupabase = globalThis as unknown as {
  supabaseAdmin: SupabaseClient | undefined;
};

export const supabaseAdmin: SupabaseClient =
  globalForSupabase.supabaseAdmin ??
  createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForSupabase.supabaseAdmin = supabaseAdmin;
}
