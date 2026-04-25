import { useState, useEffect } from "react";
import Landing from "./Landing";
import AppDemo from "./AppDemo";
 
export default function App() {
  const [showDemo, setShowDemo] = useState(false);
  const [demoAuth, setDemoAuth] = useState(false);
  const [pass, setPass] = useState("");
 
  useEffect(() => {
    // Si la URL tiene /demo o ?demo, muestra la app completa
    const isDemo =
      window.location.pathname.includes("/demo") ||
      window.location.search.includes("demo");
    setShowDemo(isDemo);
  }, []);
 
  // Ruta normal: mostrar landing de pre-registro
  if (!showDemo) return <Landing />;
 
  // Ruta /demo: pedir contraseña antes de mostrar la app
  if (!demoAuth) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", height: "100vh", gap: 16,
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        background: "#FAFAF7",
      }}>
        <div style={{
          fontFamily: "'DM Serif Display', Georgia, serif",
          fontSize: 32, color: "#1B3A2D", marginBottom: 8,
        }}>
          finde<span style={{ color: "#C7613A" }}>.</span>
        </div>
        <p style={{ fontSize: 14, color: "#8A8A85", marginBottom: 12 }}>
          Ingresa la contraseña para acceder al demo
        </p>
        <input
          type="password"
          placeholder="Contraseña"
          value={pass}
          onChange={e => setPass(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && pass === "finde2026") setDemoAuth(true); }}
          style={{
            padding: "14px 18px", borderRadius: 12, border: "2px solid #E8DDD3",
            fontSize: 15, width: 280, fontFamily: "inherit", outline: "none",
            textAlign: "center", letterSpacing: 2,
          }}
        />
        <button
          onClick={() => { if (pass === "finde2026") setDemoAuth(true); }}
          style={{
            padding: "14px 32px", borderRadius: 12, background: "#1B3A2D",
            color: "white", border: "none", fontSize: 15, fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit", width: 280,
          }}
        >
          Entrar al demo
        </button>
        <p style={{ fontSize: 11, color: "#D4D0C8", marginTop: 8 }}>
          Acceso restringido · Solo para evaluadores autorizados
        </p>
      </div>
    );
  }
 
  // Demo autenticado: mostrar la app completa
  return <AppDemo />;
}