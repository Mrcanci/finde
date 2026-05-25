import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    // Restaurar sesión desde localStorage al montar.
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    // Reaccionar a SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, INITIAL_SESSION.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
      }
    );

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  // TODO(M1 sub-paso 8): exponer isOperator consultando /api/me cuando
  // el endpoint devuelva info de Operator (requiere Operator.userId en schema).

  const value = {
    user,
    session,
    loading,
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
