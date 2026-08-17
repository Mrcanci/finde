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
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
    <Analytics />
  </StrictMode>,
)
