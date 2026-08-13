import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "../lib/supabase.js";
import { authFetch } from "../lib/authFetch.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [operator, setOperator] = useState(null);
  // false mientras el perfil de operador del usuario actual está sin resolver;
  // true cuando /api/me respondió (éxito O fallo) o cuando no hay usuario.
  // Los gates que dependen del operador (panel) esperan esto, NO `loading`:
  // la sesión resuelve al instante, el operador tarda un roundtrip más.
  const [operatorResolved, setOperatorResolved] = useState(false);

  // Guards de concurrencia de la resolución de operador:
  // - opSeq (latest-wins): solo la llamada más reciente setea estado. Sin esto,
  //   los /api/me concurrentes de una recarga resolvían fuera de orden y un
  //   fallo tardío pisaba al operador ya resuelto (el panel se vaciaba).
  // - opInFlight (dedupe): los 3 eventos de auth de una recarga (SIGNED_IN +
  //   getSession + INITIAL_SESSION) colapsan en UN solo request.
  // - opUserId: dueño del estado actual; al cambiar de usuario se resetea.
  const opSeq = useRef(0);
  const opInFlight = useRef(null);
  const opUserId = useRef(null);

  // Resuelve el perfil de operador vía /api/me, con UN reintento (backoff 2s)
  // para hipos transitorios del backend. Un fallo definitivo NO degrada un
  // operador ya conocido (un fallo del refresh horario de token no debe vaciar
  // el panel); si nunca hubo operador, queda null y el usuario navega como
  // viajero. operatorResolved se setea SIEMPRE en finally: nunca colgado.
  // force=true salta el dedupe (tras el onboarding, el request en vuelo puede
  // ser anterior a la creación del Operator y traería null).
  const fetchOperator = useCallback((force = false) => {
    if (!force && opInFlight.current) return opInFlight.current;
    const seq = ++opSeq.current;
    const attempt = async () => {
      // scope=operator: camino liviano del backend (auth + findUnique), sin la
      // query pesada de bookings ni el vencimiento perezoso. El botón del
      // panel deja de esperar datos que no necesita; "Mis viajes" sigue con
      // /api/me completo.
      const r = await authFetch("/api/me?scope=operator");
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    };
    const run = (async () => {
      try {
        let data;
        try {
          data = await attempt();
        } catch {
          await new Promise((res) => setTimeout(res, 2000));
          if (seq !== opSeq.current) return;
          data = await attempt();
        }
        if (seq !== opSeq.current) return;
        // Un 200 con operator null NO degrada un operador ya resuelto: solo
        // escribe null si no había ninguno. El catch de abajo ya cubría el
        // fallo duro, pero esta rama (éxito con payload vacío) lo esquivaba y
        // podía vaciar el panel de una agencia real.
        // El reset legítimo (logout, cambio de usuario) NO pasa por acá: lo
        // hace resolveOperatorFor con setOperator(null) antes de refetchear.
        setOperator((prev) => data.operator ?? prev ?? null);
      } catch {
        // Falla definitiva: conservar el último operador bueno (o null).
      } finally {
        if (seq === opSeq.current) {
          setOperatorResolved(true);
          opInFlight.current = null;
        }
      }
    })();
    opInFlight.current = run;
    return run;
  }, []);

  // Sincroniza el estado de operador con el usuario de cada evento de auth.
  const resolveOperatorFor = useCallback((newUser) => {
    if (!newUser) {
      opUserId.current = null;
      opSeq.current++; // invalida requests en vuelo
      opInFlight.current = null;
      setOperator(null);
      setOperatorResolved(true); // sin usuario no hay nada que resolver
      return;
    }
    if (opUserId.current !== newUser.id) {
      opUserId.current = newUser.id;
      opSeq.current++;
      opInFlight.current = null;
      setOperator(null);
      setOperatorResolved(false);
    }
    fetchOperator();
  }, [fetchOperator]);

  useEffect(() => {
    let active = true;

    // Restaurar sesión desde localStorage al montar.
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
      resolveOperatorFor(data.session?.user ?? null);
    });

    // Reaccionar a SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, INITIAL_SESSION.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        resolveOperatorFor(newSession?.user ?? null);
      }
    );

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [resolveOperatorFor]);

  const value = {
    user,
    session,
    loading,
    operator,
    isOperator: !!operator,
    operatorResolved,
    refreshOperator: () => fetchOperator(true),
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
