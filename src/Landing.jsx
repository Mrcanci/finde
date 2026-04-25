import { useState, useEffect, useRef } from "react";
 
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FINDE — Pre-Launch Landing (v3, lightweight)
// Enfoque: capturar pre-registros. Menos secciones, form en el hero.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 
// Rutas locales esperadas en /public/destinations/
// Ver README_IMAGES.md para especificaciones. Mientras no estén las imágenes,
// el gradiente "fallback" se muestra como background detrás.
const DESTINATIONS = [
  { name: "Paracas",     tag: "Clásico",     image: "/destinations/paracas.jpg",     fallback: "linear-gradient(135deg,#004D6B 0%,#0288D1 50%,#7BC7E8 100%)" },
  { name: "Chachapoyas", tag: "Alternativo", image: "/destinations/chachapoyas.jpg", fallback: "linear-gradient(135deg,#1B3A2D 0%,#3D6B4E 50%,#7FA985 100%)" },
  { name: "Rajuntay",    tag: "Alternativo", image: "/destinations/rajuntay.jpg",    fallback: "linear-gradient(135deg,#3E2723 0%,#6D4C41 50%,#BCA18D 100%)" },
  { name: "Colca",       tag: "Alternativo", image: "/destinations/colca.jpg",       fallback: "linear-gradient(135deg,#8B3A1F 0%,#C7613A 50%,#E8A574 100%)" },
  { name: "Oxapampa",    tag: "Alternativo", image: "/destinations/oxapampa.jpg",    fallback: "linear-gradient(135deg,#2D3E1F 0%,#5E7A3F 50%,#A3B97A 100%)" },
  { name: "Kuélap",      tag: "Alternativo", image: "/destinations/kuelap.jpg",      fallback: "linear-gradient(135deg,#2D3E1F 0%,#5E7A3F 50%,#A3B97A 100%)" },
];
 
const Icon = ({ name, className = "" }) => {
  const c = { fill: "none", stroke: "currentColor", strokeWidth: 1.75, strokeLinecap: "round", strokeLinejoin: "round" };
  const paths = {
    search: <><circle cx="11" cy="11" r="7" {...c} /><path d="m20 20-3.5-3.5" {...c} /></>,
    shield: <><path d="M12 3l8 3v6c0 4.5-3.5 8.5-8 9-4.5-.5-8-4.5-8-9V6l8-3z" {...c} /><path d="m8.5 12 2.5 2.5L15.5 10" {...c} /></>,
    wallet: <><rect x="3" y="7" width="18" height="12" rx="2" {...c} /><path d="M16 12h2" {...c} /><path d="M3 10h18" {...c} /></>,
    mountain: <><path d="M3 20l5-10 3 5 3-7 7 12H3z" {...c} /><circle cx="16" cy="6" r="1.5" {...c} /></>,
    check: <><circle cx="12" cy="12" r="9" {...c} /><path d="m8 12 3 3 5-6" {...c} /></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" {...c} /></>,
  };
  return <svg viewBox="0 0 24 24" className={className} width="24" height="24">{paths[name]}</svg>;
};
 
const TRAVELER_BENEFITS = [
  { icon: "search", title: "Búsqueda con IA", desc: "Dile qué tipo de experiencia buscas y la inteligencia artificial te sugiere destinos y tours que encajan contigo — incluso los menos conocidos." },
  { icon: "shield", title: "Agencias verificadas", desc: "Agencias de viaje formalizadas y guías certificados. Sin sorpresas en ruta." },
  { icon: "wallet", title: "Paga en soles con Yape", desc: "Precios transparentes. Yape, Plin, tarjeta o transferencia." },
];
 
const MOCKUP_TABS = [
  { id: "search", label: "Buscar" },
  { id: "detail", label: "Tour" },
  { id: "pay", label: "Pagar con Yape" },
];
 
const FAQ = [
  // ── Para viajeros
  { q: "¿Cuándo lanzan?", a: "Planeamos abrir beta cerrada en el segundo semestre de 2026. Los primeros 500 pre-registrados acceden 48h antes." },
  { q: "¿Es gratis para viajeros?", a: "Sí. Para el viajero, usar finde no cuesta nada. Pagas únicamente el precio del tour a la agencia. Sin comisiones ocultas ni cargos por servicio." },
  { q: "¿Aceptan Yape y Plin?", a: "Sí. Yape y Plin son métodos de pago nativos en finde desde el día uno. También aceptamos tarjeta de crédito/débito y PagoEfectivo." },
  { q: "¿Los tours están verificados?", a: "Sí. Trabajamos exclusivamente con agencias formalizadas y guías con certificación vigente (MINCETUR, SERNANP o colegiados). Además, todos los tours tienen reseñas de viajeros reales." },
  { q: "¿Puedo reservar para un grupo?", a: "Sí. Al momento de reservar puedes indicar cuántas personas van. Muchas experiencias ofrecen precios especiales para grupos de 4 o más." },
  // ── Para agencias
  { q: "Soy agencia, ¿cuánto me cobran?", a: "Cero costo de alta y cero mensualidad. Los detalles comerciales los compartimos directamente contigo en el onboarding cuando te contactemos por WhatsApp." },
  { q: "¿Qué beneficio tengo por registrarme ahora?", a: "Las agencias que se pre-registran antes del lanzamiento obtienen prioridad en los resultados de búsqueda durante la etapa inicial. Es nuestra forma de agradecer a quienes confían en finde desde el principio." },
  { q: "¿Puedo seguir usando mis otros canales de venta?", a: "Por supuesto. finde es un canal adicional, no un reemplazo. Tú decides qué tours listar, a qué precios, y con qué disponibilidad. No pedimos exclusividad." },
  { q: "¿Mis datos están protegidos?", a: "Sí. Cumplimos la Ley 29733 de Protección de Datos Personales del Perú. Solo usamos tus datos para contactarte por el lanzamiento y, si lo autorizas, enviarte novedades." },
];
 
export default function FindeLanding() {
  const [mode, setMode] = useState("traveler");
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", businessName: "", consent: false });
  const [submitted, setSubmitted] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [activeMockup, setActiveMockup] = useState("search");
  const [referralCode, setReferralCode] = useState("");
  const [copiedRef, setCopiedRef] = useState(false);
 
  useEffect(() => {
    const h = () => setScrollY(window.scrollY || 0);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);
 
  const generateRefCode = () => {
    const base = (formData.name || "finde").replace(/\s/g, "").slice(0, 6).toLowerCase();
    return `${base}-${Math.random().toString(36).slice(2, 6)}`;
  };
 
  // Validación email simple pero suficiente
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
 
  const handleSubmit = () => {
    if (!formData.consent) return;
    if (!isValidEmail(formData.email)) return;
    if (mode === "operator" && !formData.businessName.trim()) return;

    const code = generateRefCode();
    setReferralCode(code);

    const params = new URLSearchParams({
      type: mode === "operator" ? "Agencia" : "Viajero",
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      businessName: formData.businessName,
      referralCode: code,
    });

    const url = "https://script.google.com/macros/s/AKfycbxgW7R-djQ0dE_SFhNgPykemzNSMkimFJS4KKnrEci5sjPCYO2-4PwHSJu-KDDK8NZTzA/exec?" + params.toString();

    const img = new Image();
    img.src = url;

    setTimeout(() => {
      setSubmitted(true);
    }, 1500);
  };
 
  const canSubmit =
    formData.consent &&
    isValidEmail(formData.email) &&
    (mode === "traveler" || formData.businessName.trim());
 
  return (
    <>
      <style>{CSS}</style>
      <div className="landing">
 
        {/* ── NAV ── */}
        <nav className={`nav ${scrollY > 50 ? "nav-scrolled" : ""}`}>
          <div className="nav-inner">
            <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="nav-logo">finde<span>.</span></a>
            <div className="nav-links">
              <a href="#faq" onClick={(e) => { e.preventDefault(); document.getElementById("faq")?.scrollIntoView({ behavior: "smooth" }); }}>FAQ</a>
            </div>
            <button className="nav-cta" onClick={() => document.getElementById("registro")?.scrollIntoView({ behavior: "smooth", block: "center" })}>
              Pre-registrarme
            </button>
          </div>
        </nav>
 
        {/* ═══════════ HERO CON FORMULARIO ═══════════ */}
        <section className="hero">
          <div className="hero-texture" />
 
          <div className="hero-grid">
            {/* Columna izquierda: pitch */}
            <div className="hero-pitch">
              <h1 className="hero-title fd0">
                Descubre el Perú real<span className="hero-dot">.</span>
                <br />
                <em>Reserva en soles, paga con Yape o Plin</em><span className="hero-dot">.</span>
              </h1>
              <p className="hero-sub fd1">
                El primer marketplace peruano de tours y experiencias.
                Agencias verificadas, búsqueda con inteligencia artificial, precios en soles, Yape y Plin nativos.
              </p>
 
              <div className="hero-proof fd2">
                <div className="hero-proof-item">
                  <Icon name="check" className="hero-proof-icon" />
                  <span>Agencias de viaje locales verificadas</span>
                </div>
                <div className="hero-proof-item">
                  <Icon name="check" className="hero-proof-icon" />
                  <span>Búsqueda inteligente con IA</span>
                </div>
                <div className="hero-proof-item">
                  <Icon name="check" className="hero-proof-icon" />
                  <span>Destinos alternativos menos masificados</span>
                </div>
                <div className="hero-proof-item">
                  <Icon name="check" className="hero-proof-icon" />
                  <span>Soporte y recomendaciones por WhatsApp con IA</span>
                </div>
              </div>
 
              <div className="hero-destinations fd3">
                {DESTINATIONS.slice(0, 6).map((d, i) => (
                  <div key={i} className="hero-dest" style={{ background: d.fallback }} title={d.name}>
                    <img
                      src={d.image}
                      alt={`${d.name}, Perú`}
                      className="hero-dest-img"
                      loading="lazy"
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                    />
                    <div className="hero-dest-overlay" />
                    <div className="hero-dest-name">{d.name}</div>
                  </div>
                ))}
              </div>
            </div>
 
            {/* Columna derecha: formulario ya visible */}
            <div className="hero-form fd3" id="registro">
              {!submitted ? (
                <>
                  <div className="form-head">
                    <div className="form-badge">Oferta fundador</div>
                    <h3 className="form-title">
                      Acceso anticipado <span className="form-title-dot">+</span> experiencia gratis
                    </h3>
                    <p className="form-sub">
                      {mode === "operator"
                        ? "Las agencias que se registren antes del lanzamiento reciben prioridad en resultados de búsqueda durante la etapa inicial."
                        : "Los primeros 500 viajeros reciben acceso 48h antes del lanzamiento y una experiencia exclusiva sin costo con una de nuestras agencias validadas."
                      }
                    </p>
                  </div>
 
                  <div className="mode-tabs">
                    <button
                      className={`mode-tab ${mode === "traveler" ? "mode-tab-active" : ""}`}
                      onClick={() => setMode("traveler")}
                    >
                      Viajero
                    </button>
                    <button
                      className={`mode-tab ${mode === "operator" ? "mode-tab-active" : ""}`}
                      onClick={() => setMode("operator")}
                    >
                      Agencia
                    </button>
                  </div>
 
                  <div className="form-fields">
                    <div className="field">
                      <input
                        type="text"
                        placeholder="Tu nombre"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
 
                    <div className="field">
                      <input
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        placeholder="Tu email *"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
 
                    <div className="field">
                      <div className="phone-row">
                        <div className="phone-prefix">+51</div>
                        <input
                          type="tel"
                          inputMode="tel"
                          autoComplete="tel-national"
                          placeholder="Celular (opcional) — 9XX XXX XXX"
                          value={formData.phone}
                          onChange={e => setFormData({ ...formData, phone: e.target.value })}
                          maxLength={11}
                        />
                      </div>
                      <div className="field-hint">Opcional — te avisamos por WhatsApp si nos dejas tu celular</div>
                    </div>
 
                    {mode === "operator" && (
                      <div className="field">
                        <input
                          type="text"
                          placeholder="Nombre de tu agencia *"
                          value={formData.businessName}
                          onChange={e => setFormData({ ...formData, businessName: e.target.value })}
                        />
                      </div>
                    )}
 
                    <label className="consent">
                      <input
                        type="checkbox"
                        checked={formData.consent}
                        onChange={e => setFormData({ ...formData, consent: e.target.checked })}
                      />
                      <span>
                        Acepto que finde me contacte por el lanzamiento.
                      </span>
                    </label>
                  </div>
 
                  <button
                    className="btn-primary btn-full"
                    disabled={!canSubmit}
                    onClick={handleSubmit}
                  >
                    {mode === "operator" ? "Registrar mi agencia" : "Quiero acceso anticipado"}
                    <Icon name="arrow" className="btn-icon" />
                  </button>
 
                  <div className="form-foot">
                    Te avisamos por email cuando lancemos. Sin spam, sin letra chica.
                  </div>
                </>
              ) : (
                <div className="success">
                  <div className="success-check">
                    <Icon name="check" className="success-icon" />
                  </div>
                  <h3 className="success-title">
                    {mode === "operator" ? "¡Tu agencia está registrada!" : "¡Listo, estás adentro!"}
                  </h3>
                  <p className="success-desc">
                    {mode === "operator"
                      ? "Te contactaremos por WhatsApp en los próximos días para coordinar tu onboarding."
                      : <>Eres parte de los primeros 500. Acceso anticipado <strong>48h antes</strong> + experiencia exclusiva sin costo al lanzar.</>
                    }
                  </p>
 
                  <button
                    className="share-wa"
                    onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent("Mira esto: finde es el primer marketplace peruano de tours con Yape y Plin. Pre-regístrate acá: https://finde-two.vercel.app")}`, "_blank")}
                  >
                    Compartir por WhatsApp
                  </button>
                </div>
              )}
            </div>
          <div className="hero-mincetur">En proceso de postulación al concurso de innovación turística — MINCETUR</div>
          </div>
        </section>

        {/* ═══════════ PROBLEMA (corto) ═══════════ */}
        <section className="problem">
          <div className="section-inner">
            <div className="problem-stats">
              <div className="problem-stat">
                <div className="problem-num">5,800+</div>
                <div className="problem-lbl">agencias de viajes en el Perú<sup>1</sup></div>
              </div>
              <div className="problem-divider" />
              <div className="problem-stat">
                <div className="problem-num">~40%</div>
                <div className="problem-lbl">del sector opera en informalidad<sup>2</sup></div>
              </div>
              <div className="problem-divider" />
              <div className="problem-stat">
                <div className="problem-num">17M+</div>
                <div className="problem-lbl">peruanos usan Yape — nadie los acepta<sup>3</sup></div>
              </div>
            </div>
            <div className="problem-sources">
              <sup>1</sup> MINCETUR · <sup>2</sup> ComexPerú · <sup>3</sup> BCRP / Credicorp
            </div>
          </div>
        </section>
 
        {/* ═══════════ VALUE PROP (3 beneficios) ═══════════ */}
        <section className="value">
          <div className="section-inner">
            <h2 className="section-title">
              Hecho para cómo viaja el peruano<span className="dot-accent">.</span>
            </h2>
            <div className="benefits">
              {TRAVELER_BENEFITS.map((b, i) => (
                <div key={i} className="benefit">
                  <div className="benefit-icon-wrap"><Icon name={b.icon} className="benefit-icon" /></div>
                  <div className="benefit-title">{b.title}</div>
                  <div className="benefit-desc">{b.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
 
        {/* ═══════════ MOCKUP (vista previa) ═══════════ */}
        <section className="mockup">
          <div className="section-inner">
            <div className="section-label">Vista previa</div>
            <h2 className="section-title">
              Así se ve usar finde<span className="dot-accent">.</span>
            </h2>
 
            <div className="mockup-tabs">
              {MOCKUP_TABS.map(t => (
                <button
                  key={t.id}
                  className={`mockup-tab ${activeMockup === t.id ? "mockup-tab-active" : ""}`}
                  onClick={() => setActiveMockup(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
 
            <div className="mockup-stage">
              <div className="mockup-phone">
                <div className="mockup-notch" />
                <div className="mockup-frame">
                  <img src={`/mockups/mockup-${activeMockup === "search" ? "home" : activeMockup}.png`} alt={activeMockup === "search" ? "finde — pantalla de búsqueda" : activeMockup === "detail" ? "finde — detalle de experiencia" : "finde — pago con Yape"} className="mockup-img" loading="lazy" />
                </div>
                <div className="mockup-home-bar" />
              </div>
            </div>
          </div>
        </section>
 
        {/* ═══════════ FAQ ═══════════ */}
        <section className="faq" id="faq">
          <div className="section-inner section-inner-narrow">
            <h2 className="section-title">Preguntas frecuentes<span className="dot-accent">.</span></h2>
            <div className="faq-list">
              {FAQ.map((f, i) => (
                <details key={i} className="faq-item">
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
 
            <div className="faq-cta">
              <button className="btn-primary" onClick={() => document.getElementById("registro")?.scrollIntoView({ behavior: "smooth", block: "center" })}>
                Pre-registrarme ahora
              </button>
            </div>
          </div>
        </section>
 
        {/* ═══════════ EQUIPO ═══════════ */}
        <section className="team" id="equipo">
          <div className="section-inner section-inner-narrow">
            <h2 className="section-title">
              Quiénes estamos detrás<span className="dot-accent">.</span>
            </h2>
            <p className="team-intro">
              Somos un equipo peruano de profesionales en producto digital, ingeniería y turismo.
              Viajamos mucho por el Perú y nos cansamos de que las plataformas globales nos ignoren:
              precios en dólares, cero Yape, cero operadores locales. Así nació finde.
            </p>
 
            <div className="team-pillars">
              <div className="team-pillar">
                <div className="team-pillar-num">01</div>
                <div className="team-pillar-title">Producto e ingeniería</div>
                <div className="team-pillar-desc">Plataforma mobile-first con inteligencia artificial para búsqueda, pensada para Android de gama media, pagos locales y conexiones variables.</div>
              </div>
              <div className="team-pillar">
                <div className="team-pillar-num">02</div>
                <div className="team-pillar-title">Operaciones y turismo</div>
                <div className="team-pillar-desc">Trabajo directo con agencias, guías certificados y gobiernos locales en 6 regiones.</div>
              </div>
              <div className="team-pillar">
                <div className="team-pillar-num">03</div>
                <div className="team-pillar-title">Diseño y contenido</div>
                <div className="team-pillar-desc">Experiencia cálida y bilingüe que celebra la diversidad del Perú.</div>
              </div>
            </div>
          </div>
        </section>
 
        {/* ═══════════ FOOTER ═══════════ */}
        <footer className="footer">
          <div className="footer-inner">
            <div className="footer-top">
              <div className="footer-logo">finde<span>.</span></div>
              <p className="footer-tagline">El marketplace de tours y experiencias para descubrir el Perú.</p>
            </div>
            <div className="footer-links">
              <a href="mailto:hola@finde.pe">hola@finde.pe</a>
              <span>·</span>
              <a href="https://wa.me/51900000000" target="_blank" rel="noopener noreferrer">WhatsApp</a>
              <span>·</span>
              <span>Lima, Perú</span>
            </div>
            <div className="footer-legal">
              finde — proyecto en etapa pre-lanzamiento. En proceso de postulación al concurso de innovación turística de MINCETUR.
              Tus datos se tratan bajo la Ley 29733 de Protección de Datos Personales.
            </div>
            <div className="footer-copy">© 2026 finde. Hecho en el Perú.</div>
          </div>
        </footer>
      </div>
    </>
  );
}
 
 
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
 
.landing {
  --f: #1B3A2D; --m: #2D5A3D; --sg: #6B8F71; --sd: #E8DDD3;
  --cr: #F5F0EA; --wh: #FAFAF7; --tr: #C7613A; --trl: #E8845A;
  --gd: #D4A843; --ch: #2C2C2A; --gy: #8A8A85; --lg: #D4D0C8;
}
 
.landing * { margin: 0; padding: 0; box-sizing: border-box; }
.landing { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; background: var(--wh); color: var(--ch); -webkit-font-smoothing: antialiased; }
 
/* Reset: neutralizar estilos globales de App.css / index.css que pisan la landing */
.landing { overflow-x: hidden; width: 100vw; max-width: 100%; margin: 0; padding: 0; text-align: left; border: none; display: block; font: 16px/1.5 'Plus Jakarta Sans', system-ui, sans-serif; letter-spacing: normal; color: var(--ch); }
.landing h1, .landing h2, .landing h3, .landing h4 { font-family: 'DM Serif Display', Georgia, serif; margin: 0; font-weight: 400; letter-spacing: -0.5px; }
.landing p, .landing span, .landing div, .landing a, .landing button, .landing input, .landing label { letter-spacing: normal; }
 
@keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
.fd0 { animation: fadeUp .5s ease forwards; }
.fd1 { animation: fadeUp .5s ease .1s forwards; opacity: 0; }
.fd2 { animation: fadeUp .5s ease .2s forwards; opacity: 0; }
.fd3 { animation: fadeUp .5s ease .35s forwards; opacity: 0; }
@keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }
 
/* NAV */
.nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; padding: 18px 40px; transition: all .3s ease; }
.nav-scrolled { background: rgba(250, 250, 247, .92); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(0,0,0,.05); padding: 14px 40px; }
.nav-inner { max-width: 1280px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 24px; }
.nav-logo { font-family: 'DM Serif Display', Georgia, serif; font-size: 30px; color: var(--f); letter-spacing: -.5px; text-decoration: none; }
.nav-logo span { color: var(--tr); }
.nav-links { display: flex; gap: 28px; flex: 1; justify-content: flex-end; padding-right: 16px; }
.nav-links a { font-size: 14px; font-weight: 600; color: var(--ch); text-decoration: none; transition: color .2s; }
.nav-links a:hover { color: var(--tr); }
.nav-cta { padding: 10px 24px; border-radius: 100px; background: var(--f); color: white; font-weight: 700; font-size: 14px; border: none; cursor: pointer; font-family: inherit; transition: all .2s; }
.nav-cta:hover { background: var(--m); transform: translateY(-1px); }
 
/* HERO */
.hero { min-height: 100vh; padding: 100px 48px 40px; position: relative; overflow: hidden; background: linear-gradient(170deg, var(--wh) 0%, var(--cr) 40%, var(--sd) 100%); display: flex; align-items: center; justify-content: center; }
.hero-texture { position: absolute; inset: 0; background: repeating-linear-gradient(45deg, transparent, transparent 12px, rgba(27,58,45,.018) 12px, rgba(27,58,45,.018) 24px); pointer-events: none; }
.hero-grid { max-width: 1200px; width: 100%; margin: 0 auto; display: grid; grid-template-columns: 1.15fr 1fr; gap: 56px; align-items: center; position: relative; z-index: 2; }
 
.hero-title { font-family: 'DM Serif Display', Georgia, serif; font-size: clamp(42px, 4.2vw, 64px); line-height: 1.1; margin-bottom: 24px; color: var(--ch); letter-spacing: -.5px; }
.hero-title em { font-style: italic; color: var(--f); }
.hero-dot, .dot-accent { color: var(--tr); }
.hero-sub { font-size: clamp(16px, 1.3vw, 19px); line-height: 1.7; color: var(--gy); max-width: 480px; margin-bottom: 28px; }
 
.hero-proof { display: flex; flex-direction: column; gap: 10px; margin-bottom: 36px; }
.hero-proof-item { display: flex; align-items: center; gap: 10px; font-size: 16px; color: var(--ch); font-weight: 500; }
.hero-proof-icon { width: 18px; height: 18px; color: var(--f); flex-shrink: 0; }
 
.hero-destinations { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; max-width: 100%; }
.hero-dest { aspect-ratio: 3/2; border-radius: 14px; display: flex; align-items: flex-end; padding: 14px; transition: transform .3s; cursor: default; position: relative; overflow: hidden; background-size: cover; background-position: center; }
.hero-dest:hover { transform: translateY(-3px); }
.hero-dest:hover .hero-dest-img { transform: scale(1.05); }
.hero-dest-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform .4s ease; }
.hero-dest-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,.6) 0%, rgba(0,0,0,.2) 40%, transparent 100%); pointer-events: none; }
.hero-dest-name { font-size: 16px; font-weight: 800; color: white; line-height: 1; text-shadow: 0 1px 3px rgba(0,0,0,.5); position: relative; z-index: 2; }
.hero-mincetur { grid-column: 1 / -1; text-align: center; font-size: 15px; font-weight: 600; color: var(--gy); letter-spacing: 0.3px; padding-top: 24px; }
 
/* FORM IN HERO */
.hero-form { background: white; border-radius: 24px; padding: 40px; border: 1px solid rgba(0,0,0,.06); box-shadow: 0 16px 48px rgba(27,58,45,.1); max-width: 520px; width: 100%; justify-self: end; }
.form-head { margin-bottom: 24px; text-align: center; }
.form-badge { display: inline-block; padding: 5px 12px; border-radius: 100px; background: var(--gd); color: var(--f); font-size: 10px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 12px; }
.form-title { font-family: 'DM Serif Display', Georgia, serif; font-size: 26px; line-height: 1.25; margin-bottom: 10px; color: var(--ch); }
.form-title-dot { color: var(--tr); }
.form-sub { font-size: 14px; line-height: 1.6; color: var(--gy); }
 
.mode-tabs { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; padding: 4px; background: var(--cr); border-radius: 10px; margin-bottom: 20px; }
.mode-tab { padding: 12px 16px; border-radius: 7px; background: transparent; border: none; font-family: inherit; font-size: 14px; font-weight: 700; color: var(--gy); cursor: pointer; transition: all .2s; }
.mode-tab-active { background: white; color: var(--f); box-shadow: 0 1px 3px rgba(0,0,0,.08); }
 
.form-fields { display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px; }
.field input { width: 100%; padding: 16px 18px; border-radius: 11px; border: 1.5px solid var(--sd); font-size: 16px; font-family: inherit; background: white; color: var(--ch); outline: none; transition: border .2s; }
.field input:focus { border-color: var(--m); }
.field input::placeholder { color: var(--lg); }
.field-hint { display: block; font-size: 12px; color: var(--gy); margin-top: 6px; line-height: 1.4; }
.phone-row { display: flex; gap: 6px; }
.phone-prefix { padding: 13px 12px; border-radius: 11px; border: 1.5px solid var(--sd); font-size: 14px; font-family: inherit; text-align: center; background: var(--cr); color: var(--ch); font-weight: 700; }
.phone-row input { flex: 1; letter-spacing: .5px; }
 
.consent { display: flex; gap: 9px; align-items: flex-start; font-size: 12px; color: var(--gy); line-height: 1.5; cursor: pointer; padding-top: 2px; }
.consent input[type="checkbox"] { width: 16px; height: 16px; margin-top: 1px; accent-color: var(--f); cursor: pointer; flex-shrink: 0; }
.consent a { color: var(--f); text-decoration: underline; }
 
.btn-primary { padding: 16px 32px; border-radius: 12px; background: var(--f); color: white; font-weight: 700; font-size: 16px; border: none; cursor: pointer; font-family: inherit; transition: all .2s; display: inline-flex; align-items: center; justify-content: center; gap: 8px; }
.btn-primary:hover:not(:disabled) { background: var(--m); transform: translateY(-1px); box-shadow: 0 6px 20px rgba(27,58,45,.25); }
.btn-primary:disabled { opacity: .45; cursor: not-allowed; }
.btn-full { width: 100%; }
.btn-icon { width: 16px; height: 16px; transition: transform .2s; }
.btn-primary:hover:not(:disabled) .btn-icon { transform: translateX(3px); }
.form-foot { font-size: 11px; color: var(--gy); text-align: center; margin-top: 12px; margin-bottom: 8px; line-height: 1.5; }
 
/* SUCCESS */
.success { text-align: center; padding: 12px 0; }
.success-check { width: 60px; height: 60px; border-radius: 50%; background: var(--f); color: white; display: flex; align-items: center; justify-content: center; margin: 0 auto 18px; animation: pulse .5s ease; }
.success-icon { width: 28px; height: 28px; }
.success-title { font-family: 'DM Serif Display', Georgia, serif; font-size: 24px; margin-bottom: 12px; color: var(--f); }
.success-desc { font-size: 14px; line-height: 1.65; color: var(--ch); margin-bottom: 20px; }
.success-desc strong { color: var(--f); }
.referral { padding: 16px; background: var(--cr); border-radius: 12px; text-align: left; }
.referral-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 800; color: var(--tr); margin-bottom: 8px; }
.referral-sub { font-size: 13px; color: var(--gy); line-height: 1.55; margin-bottom: 16px; }
.referral-row { display: flex; gap: 6px; margin-bottom: 10px; }
.referral-box { flex: 1; padding: 10px 12px; border-radius: 8px; border: 1.5px dashed rgba(212,168,67,.5); background: white; font-size: 12px; font-weight: 600; display: flex; align-items: center; overflow: hidden; white-space: nowrap; }
.referral-domain { color: var(--gy); }
.referral-code { color: var(--f); font-weight: 800; }
.referral-btn { padding: 10px 14px; border-radius: 8px; background: var(--f); color: white; border: none; font-family: inherit; font-weight: 700; font-size: 12px; cursor: pointer; white-space: nowrap; }
.referral-btn:hover { background: var(--m); }
.share-wa { width: 100%; padding: 11px; border-radius: 8px; background: #25D366; color: white; border: none; font-family: inherit; font-weight: 700; font-size: 13px; cursor: pointer; transition: background .2s; }
.share-wa:hover { background: #1eb954; }
 
/* SECTIONS */
.section-inner { max-width: 1100px; margin: 0 auto; padding: 0 40px; }
.section-inner-narrow { max-width: 720px; }
.section-label { font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: var(--tr); margin-bottom: 12px; }
.section-title { font-family: 'DM Serif Display', Georgia, serif; font-size: clamp(28px, 3vw, 40px); line-height: 1.2; margin-bottom: 40px; letter-spacing: -.3px; }
 
/* PROBLEM */
.problem { padding: 56px 40px; background: var(--f); color: white; }
.problem-stats { max-width: 1000px; margin: 0 auto; display: grid; grid-template-columns: 1fr auto 1fr auto 1fr; align-items: center; gap: 32px; }
.problem-stat { text-align: center; }
.problem-num { font-family: 'DM Serif Display', Georgia, serif; font-size: clamp(32px, 3.5vw, 44px); color: var(--gd); line-height: 1; margin-bottom: 8px; }
.problem-lbl { font-size: 14px; color: rgba(255,255,255,.75); line-height: 1.55; max-width: 240px; margin: 0 auto; }
.problem-lbl sup { color: var(--gd); }
.problem-divider { width: 1px; height: 56px; background: rgba(255,255,255,.12); }
.problem-sources { text-align: center; font-size: 11px; color: rgba(255,255,255,.4); margin-top: 28px; }
.problem-sources sup { color: var(--gd); }
 
/* VALUE */
.value { padding: 100px 40px; }
.value .section-title { text-align: center; }
.benefits { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; max-width: 1000px; margin: 0 auto; }
.benefit { background: white; border: 1px solid rgba(0,0,0,.05); border-radius: 18px; padding: 28px; transition: all .3s; }
.benefit:hover { transform: translateY(-3px); box-shadow: 0 10px 28px rgba(0,0,0,.05); border-color: rgba(199,97,58,.2); }
.benefit-icon-wrap { width: 48px; height: 48px; border-radius: 12px; background: rgba(27,58,45,.06); display: flex; align-items: center; justify-content: center; color: var(--f); margin-bottom: 16px; }
.benefit-icon { width: 22px; height: 22px; }
.benefit-title { font-weight: 700; font-size: 16px; margin-bottom: 8px; color: var(--ch); }
.benefit-desc { font-size: 14px; color: var(--gy); line-height: 1.65; }
 
/* MOCKUP */
.mockup { padding: 100px 40px; background: var(--cr); text-align: center; }
.mockup .section-title { text-align: center; }
.mockup-tabs { display: flex; gap: 8px; justify-content: center; margin-bottom: 48px; flex-wrap: wrap; }
.mockup-tab { padding: 10px 20px; border-radius: 100px; background: white; border: 1.5px solid rgba(0,0,0,.08); font-family: inherit; font-size: 13px; font-weight: 700; color: var(--gy); cursor: pointer; transition: all .2s; }
.mockup-tab:hover { border-color: var(--sg); color: var(--f); }
.mockup-tab-active { background: var(--f); color: white; border-color: var(--f); }
.mockup-stage { display: flex; justify-content: center; }
.mockup-phone { width: 300px; margin: 0 auto; background: #000; border-radius: 40px; padding: 8px; position: relative; box-shadow: 0 20px 50px -15px rgba(0,0,0,.25); }
.mockup-notch { display: none; }
.mockup-frame { width: 100%; border-radius: 32px; overflow: hidden; background: white; }
.mockup-img { display: block; width: 100%; height: auto; }
.mockup-home-bar { display: none; }
 
/* FAQ */
.faq { padding: 100px 40px; }
.faq .section-title { text-align: center; }
.faq-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 48px; }
.faq-item { background: white; border: 1px solid rgba(0,0,0,.06); border-radius: 14px; overflow: hidden; }
.faq-item summary { padding: 18px 24px; font-weight: 700; font-size: 15px; cursor: pointer; list-style: none; color: var(--ch); display: flex; justify-content: space-between; align-items: center; }
.faq-item summary::-webkit-details-marker { display: none; }
.faq-item summary::after { content: "+"; font-size: 22px; color: var(--tr); font-weight: 400; transition: transform .2s; }
.faq-item[open] summary::after { content: "−"; transform: none; }
.faq-item p { padding: 0 24px 20px; font-size: 14px; line-height: 1.75; color: var(--gy); }
.faq-cta { text-align: center; }
 
/* TEAM */
.team { padding: 100px 40px; background: var(--cr); }
.team .section-title { text-align: center; }
.team-intro { font-size: 15px; line-height: 1.75; color: var(--ch); text-align: center; max-width: 640px; margin: 0 auto 48px; }
.team-pillars { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; max-width: 900px; margin: 0 auto; }
.team-pillar { background: white; border: 1px solid rgba(0,0,0,.05); border-radius: 16px; padding: 28px; }
.team-pillar-num { font-family: 'DM Serif Display', Georgia, serif; font-size: 28px; color: var(--tr); line-height: 1; margin-bottom: 12px; }
.team-pillar-title { font-weight: 700; font-size: 15px; margin-bottom: 8px; color: var(--ch); }
.team-pillar-desc { font-size: 13px; color: var(--gy); line-height: 1.6; }
 
/* FOOTER */
.footer { padding: 56px 40px 32px; background: var(--f); color: rgba(255,255,255,.7); text-align: center; }
.footer-inner { max-width: 720px; margin: 0 auto; }
.footer-top { margin-bottom: 24px; }
.footer-logo { font-family: 'DM Serif Display', Georgia, serif; font-size: 32px; color: white; margin-bottom: 6px; }
.footer-logo span { color: var(--tr); }
.footer-tagline { font-size: 14px; line-height: 1.55; max-width: 400px; margin: 0 auto; }
.footer-links { display: flex; gap: 12px; justify-content: center; font-size: 13px; margin-bottom: 24px; flex-wrap: wrap; }
.footer-links a { color: rgba(255,255,255,.7); text-decoration: none; transition: color .2s; }
.footer-links a:hover { color: white; }
.footer-links span { color: rgba(255,255,255,.3); }
.footer-legal { font-size: 11px; line-height: 1.65; color: rgba(255,255,255,.4); max-width: 520px; margin: 0 auto 14px; }
.footer-copy { font-size: 10px; color: rgba(255,255,255,.3); }
 
/* ══════ RESPONSIVE ══════ */
@media (max-width: 1100px) {
  .hero { padding: 0 32px; }
  .hero-grid { gap: 48px; }
}
@media (max-width: 960px) {
  .nav { padding: 16px 24px; }
  .nav-scrolled { padding: 12px 24px; }
  .hero { padding: 100px 24px 60px; min-height: auto; }
  .hero-grid { grid-template-columns: 1fr; gap: 40px; max-width: 540px; }
  .hero-form { max-width: 100%; justify-self: center; }
  .hero-destinations { max-width: 100%; }
  .section-inner { padding: 0 24px; }
  .value, .mockup, .faq, .team { padding: 72px 24px; }
  .problem { padding: 48px 24px; }
  .benefits { grid-template-columns: 1fr; max-width: 480px; margin: 0 auto; }
  .team-pillars { grid-template-columns: 1fr; max-width: 480px; margin: 0 auto; }
}
@media (max-width: 768px) {
  .nav-links { display: none; }
}
@media (max-width: 640px) {
  .hero { padding: 90px 16px 40px; }
  .hero-title { font-size: 32px; }
  .hero-form { padding: 22px; border-radius: 18px; }
  .hero-destinations { grid-template-columns: repeat(2, 1fr); }
  .problem-stats { grid-template-columns: 1fr; gap: 24px; }
  .problem-divider { display: none; }
  .problem { padding: 40px 16px; }
  .mockup-phone { width: 260px; border-radius: 36px; padding: 7px; }
  .mockup-frame { border-radius: 28px; }
  .referral-row { flex-direction: column; }
  .referral-btn { width: 100%; }
  .footer { padding: 40px 16px 24px; }
  .hero-mincetur { font-size: 12px; padding-top: 16px; }
}
 
`;