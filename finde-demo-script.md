# Finde — Script de Video Demo (90s)

> Para postulación a concursos: Emprende TEC, ProInnóvate, Startup Perú.  
> URL del demo en vivo: **finde-two.vercel.app/demo** (password: `finde2026`)  
> Duración total: **90 segundos exactos**

---

## Beat 1 — Hook + Problema (0–15s)

**Visual (15s):**
- 0–1s: pantalla negra, logo Finde fade-in.
- 1–6s: split-screen — izquierda mockup TripAdvisor con resultados de Cusco, derecha screenshots de anuncios de tours en Facebook Marketplace e Instagram Stories.
- 6–15s: ambos lados se separan, queda un espacio negro al medio. Texto blanco grande aparece centrado: **"No hay puente."**

**Narrador (≈14s, ritmo pausado):**
> "El turismo peruano mueve miles de millones de dólares al año. Hay miles de operadores con experiencias increíbles en todo el país.  
> Pero los viajeros buscan en TripAdvisor. Y los operadores publican en Facebook.  
> No hay puente."

**Frase clave overlay:** *"No hay puente."*

---

## Beat 2 — Búsqueda con IA en acción (15–30s)

**Visual (15s):**
- Cut al app mockup mobile, vista home con grid de tours.
- 16s: cursor toca la barra de búsqueda; el grid se desenfoca.
- 16–22s: typing humano de la query: **"quiero algo tranquilo en familia con mis hijos pequeños"**.
- 22–24s: spinner breve (~1.3s, query cacheado).
- 24–27s: aparece el bloque de **reasoning IA** (texto en peruano cálido) sobre fondo claro.
- 27–30s: los 3 cards entran de abajo hacia arriba, secuencialmente.

**Narrador (≈15s):**
> "Olvida los filtros de precio y categoría. En Finde, le hablas como le hablarías a un amigo peruano.  
> Detrás, Claude entiende que viajas con niños, descarta ayahuasca y trekking extremo, y te muestra tres opciones que calzan de verdad."

**Frase clave overlay:** *"Le hablas como a un amigo."*

**Tip de producción crítico:** USAR EXCLUSIVAMENTE una de las 5 queries cacheadas (responden en ~1.3s vs ~10s):
1. `quiero algo tranquilo en familia con mis hijos pequeños`
2. `busco una ceremonia espiritual auténtica`
3. `voy a estar 3 días en Arequipa qué me recomiendas`
4. `soy foodie y quiero conocer la cocina peruana de verdad`
5. `primera vez en Perú qué no me puedo perder`

---

## Beat 3 — Generador IA para operadores (30–50s)

**Visual (20s):**
- 30–32s: bottom nav → Perfil → "Trabajar como operador" → form mínimo → Submit.
- 32–34s: transición al Dashboard de María Quispe (3 tours visibles: Sacsayhuamán, Tambomachay, Humantay).
- 34–36s: click en **"Nuevo tour"**.
- 36–42s: el operador tipea solamente:
  - **Título:** *"Caminata al Inti Punku"*
  - **Highlights:** *"vistas a Machu Picchu, sin multitudes, guía local"*
- 42–43s: click **"Generar con IA"**.
- 43–48s: spinner ~3s; aparece descripción de 200–300 palabras + shortPitch + keywords SEO, animadas en cascada.
- 48–50s: zoom suave al texto generado.

**Narrador (≈19s):**
> "Los operadores reales en Perú son guías, no copywriters. María Quispe sube su tour en quince segundos: solo título y tres highlights.  
> Claude redacta la descripción profesional, el pitch corto y las keywords para Google. Texto que vende, en su voz, sin que ella escriba una línea."

**Frase clave overlay:** *"El operador no escribe marketing. Lo escribe Claude por él."*

---

## Beat 4 — Toggle a Quechua (50–65s)

**Visual (15s):**
- 50–52s: cut a un Tour Detail (cualquiera de los 3 de María, recomendado Sacsayhuamán por nombre evocativo).
- 52–54s: highlight visual al botón toggle **"Es ↔ Qu"** en el header.
- 54–55s: click.
- 55–62s: la ficha entera (título + descripción + included) se anima a quechua sureño con un crossfade. Mostrar título quechua bien grande.
- 62–65s: cierre del beat con la frase overlay sobre la ficha en quechua.

**Narrador (≈14s):**
> "El quechua sureño tiene cuatro millones de hablantes. Ningún marketplace turístico en Latinoamérica los atiende.  
> Finde es el primero. Un toggle, y toda la ficha viene en quechua sureño. Generada por Claude, lista para validación con hablantes nativos."

**Frase clave overlay:** *"Único marketplace en LATAM con contenido en quechua."*

---

## Beat 5 — Reserva end-to-end (65–80s)

**Visual (15s):**
- 65–66s: cut al home, click en un tour (ej. Humantay).
- 66–68s: click **"Reservar"**.
- 68–74s: form rápido — nombre `Carlos R.`, email `carlos@example.com`, fecha del calendario (a 2 semanas), guests = 2.
- 74–75s: click **"Confirmar"**.
- 75–80s: pantalla de éxito, código `FND-8FF694` grande con animación de check verde.

**Narrador (≈14s):**
> "De búsqueda a reserva confirmada, en tres taps. El operador recibe el booking, el viajero recibe su código.  
> Todo dentro de la plataforma. Sin Excel, sin WhatsApp, sin fricción."

**Frase clave overlay:** *"Sin Excel, sin WhatsApp, sin fricción."*

---

## Beat 6 — Cierre (80–90s)

**Visual (10s):**
- 80–82s: fade a fondo marca (verde Finde `#1B3A2D`).
- 82–85s: logo Finde grande con animación de entrada.
- 85–88s: bajo el logo, en DM Serif Display:  
  *Tu próxima experiencia peruana, encontrada.*
- 88–90s: aparece la URL **`finde-two.vercel.app/demo`** y, en pie de pantalla, el stack: *"Claude Sonnet 4.6 · Voyage embeddings · Vercel · Supabase pgvector"*.
- 90s: corte.

**Narrador (≈9s):**
> "Finde. Listo para escalar.  
> Buscando el partnership que nos lleve a producción.  
> Demo en vivo: finde-two.vercel.app, slash, demo."

**Frase clave overlay:** *"Listo para escalar."*

---

## Notas para grabación

### Setup técnico
- Navegador en **fullscreen**, sin tabs visibles, sin barra de favoritos, sin extensiones a la vista.
- Resolución de captura mínima **1920×1080**; idealmente 2560×1440 a 60fps para que el typing se vea fluido.
- Chrome o Safari (Safari renderiza mejor los blurs y los gradients del proyecto).
- Cursor **visible**, sin halos ni highlights de click excesivos.

### Cadencia
- Velocidad de typing **humana** (~4–5 caracteres/segundo). Nada robótico.
- Esperar **1–2 segundos** entre cada acción para que el espectador procese antes del siguiente click.
- Si el cache responde demasiado rápido (<1s) y rompe el ritmo, el productor puede agregar un fade artificial de 0.5s en post.

### Queries IA — crítico
- En el Beat 2, **solo** una de las 5 queries pre-cacheadas. Cualquier otra dispara el flujo completo (Voyage + Claude) y tarda 8–10s. Eso rompe el ritmo del video.
- Si por alguna razón el cache no respondió, abortar la toma y revisar que `prebuild-featured-searches.ts` corrió.

### Texto en pantalla
- Las frases clave aparecen como overlay grande **2–3s**, no permanente, fade-in/out suave.
- Tipografía de overlays: **DM Serif Display** (la misma del proyecto).
- Color de overlays sobre fondo claro: `#1B3A2D` (verde Finde).

### Audio
- Voz en off recomendada: peruana neutra, adulta, ritmo pausado pero con energía.
- Sin charango ni zampoña como música de fondo (cliché). Música instrumental ambiental, sutil.
- Levels: voz al frente (-3 dB), música de fondo (-18 dB).

### Backup plan durante grabación
- Tener `vercel dev` corriendo en local como respaldo si producción tiene un hipo.
- Tener `pg_dump` reciente del backup en `backups/` por si hay que restaurar la DB demo.
- Antes de grabar: hacer una corrida completa (las 5 queries, el flujo de operador, la reserva) para verificar que todo funciona end-to-end.

### Toma alternativa
- Si el Beat 4 (quechua) no se ve bien grabado en vivo, está OK reemplazarlo con un screenshot estático bien compuesto + animación de fade en post. El contenido importa más que el motion.
