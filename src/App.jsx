import { useState, useEffect } from "react";
import Landing from "./Landing";
import AppDemo from "./AppDemo";

export default function App() {
  const [showDemo, setShowDemo] = useState(false);

  useEffect(() => {
    // Si la URL tiene /demo o ?demo, muestra la app completa
    const isDemo =
      window.location.pathname.includes("/demo") ||
      window.location.search.includes("demo");
    setShowDemo(isDemo);
  }, []);

  // Ruta normal: mostrar landing de pre-registro
  if (!showDemo) return <Landing />;

  // Ruta /demo: mostrar la app completa
  return <AppDemo />;
}
