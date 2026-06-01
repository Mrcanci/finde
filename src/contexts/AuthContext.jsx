import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase.js";
import { authFetch } from "../lib/authFetch.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [operator, setOperator] = useState(null);

  // Resuelve el perfil de operador del usuario actual vía /api/me.
  // Estable (sin deps): lee el token a través de authFetch, no del closure.
  // Cualquier fallo (incluido 401 sin sesión) deja operator=null.
  const fetchOperator = useCallback(async () => {
    try {
      const r = await authFetch("/api/me");
      if (!r.ok) {
        setOperator(null);
        return;
      }
      const data = await r.json();
      setOperator(data.operator ?? null);
    } catch {
      setOperator(null);
    }
  }, []);

  useEffect(() => {
    let active = true;

    // Restaurar sesión desde localStorage al montar.
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
      if (data.session?.user) fetchOperator();
      else setOperator(null);
    });

    // Reaccionar a SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, INITIAL_SESSION.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) fetchOperator();
        else setOperator(null);
      }
    );

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [fetchOperator]);

  const value = {
    user,
    session,
    loading,
    operator,
    isOperator: !!operator,
    refreshOperator: fetchOperator,
    signInWithPassword: ({ email, password }) =>
      supabase.auth.signInWithPassword({ email, password }),
    signUpWithPassword: ({ email, password }) =>
      supabase.auth.signUp({ email, password }),
    signOut: () => supabase.auth.signOut(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  }
  return ctx;
}
