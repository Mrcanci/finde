import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'

// Vercel Web Analytics. Va acá y no dentro de App para cubrir las DOS pantallas
// (la landing de finde.pe y el demo) con un solo montaje, sin tocar Landing.jsx.
// Solo mide páginas vistas y de dónde viene la visita: sin cookies y sin dato
// identificable, que es lo que lo hace compatible con la Ley 29733.
//
// No inyecta nada al bundle: el script real lo sirve Vercel en
// /_vercel/insights/script.js, así que en local y en `vite preview` ese pedido
// da 404 y no pasa nada. Se activa desde el dashboard de Vercel, por proyecto.
// Vercel Analytics guarda la URL de cada visita, y desde que existen rutas de
// verdad esa URL puede llevar un dato del viajero: /mis-reservas/FND-XXXXXX es
// su código de reserva. beforeSend lo reemplaza por un marcador ANTES de que el
// evento salga del navegador, así el panel sigue contando la página sin recibir
// el identificador. Ley 29733, mismo criterio que api/search.ts, que loguea el
// largo de la consulta y nunca el texto.
function redactar(evento) {
  try {
    const u = new URL(evento.url);
    u.pathname = u.pathname.replace(/(\/mis-reservas)\/[^/]+/, "$1/[code]");
    // Ningún query param de la app lleva datos hoy, pero se descartan igual: es
    // más barato que revisarlos de a uno cada vez que se agrega uno.
    u.search = "";
    return { ...evento, url: u.toString() };
  } catch {
    return evento;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
    <Analytics beforeSend={redactar} />
  </StrictMode>,
)
