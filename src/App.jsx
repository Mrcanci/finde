import Landing from "./Landing";
import AppDemo from "./AppDemo";

// La URL se lee DURANTE el render, no en un useEffect.
//
// Antes esto vivía en un useEffect con `showDemo` arrancando en false, así que
// el PRIMER render montaba <Landing /> siempre, incluso en /demo. Ese render
// dura un instante, pero le alcanza al navegador para disparar la descarga de
// las imágenes de la landing: 6,1 MB que en /demo nadie llega a ver, y que
// además compiten por el ancho de banda con lo que el usuario sí está
// esperando. Medido con Lighthouse el 2026-08-16: 6.130 kB de imágenes contra
// 244 kB de todo lo demás.
//
// Leer la URL acá no necesita estado: es un dato del documento que ya existe
// cuando React monta, y sin router todavía no cambia sin recargar. Cuando la
// tanda 2 traiga el router, este es el punto que pasa a consumir BASE_PATH.
function isDemoUrl() {
  if (typeof window === "undefined") return false;
  return (
    window.location.pathname.includes("/demo") ||
    window.location.search.includes("demo")
  );
}

export default function App() {
  // Ruta /demo: la app completa. Ruta normal: la landing de pre-registro.
  return isDemoUrl() ? <AppDemo /> : <Landing />;
}
