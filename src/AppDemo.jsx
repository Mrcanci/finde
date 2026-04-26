import { useState, useEffect, useRef, useCallback } from "react";
import { Sparkles, Mountain, Landmark, UtensilsCrossed, Trees, Umbrella, Footprints, Bell, User, BarChart3, Compass, Search, Ticket, Star, MapPin, Timer, ArrowUp, Users, Dumbbell, Check, X, ChevronRight, ChevronDown, ArrowLeft, ArrowRight, Bot, CheckCircle, Clock, Tag, Languages, ShieldCheck, Building2, CreditCard, Banknote, Smartphone, MessageCircle, Camera, MountainSnow, Hand, CircleDollarSign, FileText, Pencil, HelpCircle, Heart, Home, Calendar } from "lucide-react";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FINDE v3 — AI-Native Marketplace
// Búsqueda semántica · AI Content Creator · Quechua · Anti-overtourism
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const CATS = [
  { id: "all", n: "Todos", ic: Sparkles },
  { id: "adventure", n: "Aventura", ic: Mountain },
  { id: "culture", n: "Cultura", ic: Landmark },
  { id: "gastro", n: "Gastronomía", ic: UtensilsCrossed },
  { id: "nature", n: "Naturaleza", ic: Trees },
  { id: "beach", n: "Playas", ic: Umbrella },
  { id: "trekking", n: "Trekking", ic: Footprints },
];

const TOURS = [
  { id:1, title:"Trekking al Nevado Pastoruri", titleQu:"Pastoruri Ritiq Qaqaman Puriy", location:"Huaraz, Áncash", price:189, rating:4.7, reviews:3, duration:"Full day", image:"https://images.unsplash.com/photo-1522409994346-2682217b9a3e?w=800&h=600&fit=crop", badge:"Más vendido", category:"trekking", operator:"Andes Trek Perú", verified:true, capacity:12, altitude:"5,240", difficulty:"Moderada", included:["Transporte ida y vuelta","Guía certificado","Almuerzo buffet","Entrada al parque","Oxígeno portátil"], excluded:["Propinas","Snacks"], desc:"Camina hasta el glaciar tropical más accesible del mundo a 5,240 msnm. Atraviesa paisajes de puya Raimondi y lagunas turquesa en la Cordillera Blanca.", descQu:"Kay ritiq qaqaqa tukuy pachapi aswan ñawpaq kachkan, 5,240 metrokunapi. Puya Raimondi sachakuna, qucha turquesa ñawinkuna Cordillera Blancapi.", aiSummary:"Los viajeros destacan el paisaje impactante y la buena organización. Algunos mencionan que la altitud puede ser desafiante.", altTour:{ name:"Pastoruri", alt:"Laguna 69 (menos masificada)", reason:"Similar paisaje glaciar con 60% menos visitantes" }, tags:["glaciar","altitud","naturaleza","cordillera"] },
  { id:2, title:"Tour Gastronómico por Lima", titleQu:"Lima Llaqtapi Mikhuy Puriy", location:"Miraflores, Lima", price:145, rating:4.7, reviews:3, duration:"4 horas", image:"https://images.unsplash.com/photo-1535400255456-984241443b29?w=800&h=600&fit=crop", badge:"Top rated", category:"gastro", operator:"Lima Foodie Tours", verified:true, capacity:8, altitude:"0", difficulty:"Fácil", included:["6 paradas gastronómicas","Degustaciones ilimitadas","Pisco sour de bienvenida","Guía bilingüe"], excluded:["Bebidas alcohólicas extra","Transporte al punto"], desc:"Recorre los mercados y huariques secretos de Miraflores y Barranco. Prueba ceviche, anticuchos, causa y picarones con los mejores cocineros locales.", descQu:"Miraflores, Barranco llaqtakunapi mikhuy qhatukunata, pakasqa wasikunata purimuy. Ceviche, anticucho, causa, picarón mikhuykunata llamk'aq wayk'uqkunawan.", aiSummary:"Experiencia altamente recomendada. Destacan la cantidad de comida y el conocimiento del guía. La mejor valorada de Lima.", altTour:null, tags:["comida","lima","ceviche","mercado"] },
  { id:3, title:"Islas Ballestas + Paracas", titleQu:"Ballestas Wat'akunapi + Paracas", location:"Paracas, Ica", price:120, rating:4.5, reviews:2, duration:"Full day", image:"https://images.unsplash.com/photo-1694946733518-8e726bd7df24?w=800&h=600&fit=crop", badge:"Cancelación gratis", category:"nature", operator:"Paracas Explorer", verified:true, capacity:20, altitude:"0", difficulty:"Fácil", included:["Lancha a Islas Ballestas","Tour Reserva Nacional","Guía naturalista","Recojo del hotel"], excluded:["Almuerzo","Entrada a museo"], desc:"Navega entre lobos marinos, pingüinos de Humboldt y El Candelabro.", descQu:"Uywa qucha ukhupi, Humboldt pingüinokunawan, Candelabro rikuyniwan purimuy.", aiSummary:"Muy popular, pero algunos reportan masificación en temporada alta. Recomiendan ir temprano.", altTour:{ name:"Islas Ballestas", alt:"Reserva San Fernando (Nazca)", reason:"Fauna marina similar, casi sin turistas. 95% menos saturación" }, tags:["mar","fauna","lobos marinos","lancha"] },
  { id:4, title:"Valle Sagrado en un Día", titleQu:"Huk P'unchaypi Valle Sagrado", location:"Cusco", price:210, rating:4.5, reviews:4, duration:"10 horas", image:"https://images.unsplash.com/photo-1568729670692-0d2de9a3c027?w=800&h=600&fit=crop", badge:"Más vendido", category:"culture", operator:"Cusco Sacred Tours", verified:true, capacity:15, altitude:"3,400", difficulty:"Fácil", included:["Transporte","Guía profesional","Almuerzo buffet","Entradas Pisac y Ollantaytambo"], excluded:["Boleto turístico","Propinas"], desc:"Visita Pisac, Ollantaytambo y Chinchero en un recorrido por el corazón del imperio Inca.", descQu:"Pisac, Ollantaytambo, Chinchero llaqtakunata watukuy, Inka suyuq sunqunpi.", aiSummary:"Tour clásico bien organizado. Algunos sienten que es apurado para cubrir todo. Guías excelentes.", altTour:{ name:"Valle Sagrado clásico", alt:"Valle Sur de Cusco (Tipón + Pikillacta)", reason:"Ruinas pre-incas sin multitudes. Solo 5% del tráfico del Valle Sagrado" }, tags:["inca","ruinas","cusco","historia"] },
  { id:5, title:"Sandboarding en Huacachina", titleQu:"Huacachina Tiyupi Sandboarding", location:"Ica", price:85, rating:4.5, reviews:2, duration:"3 horas", image:"https://images.unsplash.com/photo-1723134087756-3fdd46625a84?w=800&h=600&fit=crop", badge:"Aventura", category:"adventure", operator:"Desert Adventures Ica", verified:true, capacity:10, altitude:"400", difficulty:"Moderada", included:["Buggy arenero","Tabla de sandboard","Instructor","Fotos y video"], excluded:["Transporte a Huacachina","Bebidas"], desc:"Sube dunas de hasta 100 metros en buggy y deslízate sobre la arena dorada del oasis.", descQu:"Pachak metro tiyukunaman buggy-pi wichay, quri t'iyu patapi uraykamuy.", aiSummary:"Adrenalina pura. Algunos mencionan que el buggy puede ser intenso para niños pequeños.", altTour:null, tags:["aventura","desierto","adrenalina","oasis"] },
  { id:6, title:"Avistamiento de Ballenas", titleQu:"Hatun Challwakunata Qhaway", location:"Los Órganos, Piura", price:160, rating:5.0, reviews:2, duration:"3 horas", image:"https://images.unsplash.com/photo-1723748651613-e24586599f30?w=800&h=600&fit=crop", badge:"Temporada", category:"nature", operator:"Máncora Marine", verified:true, capacity:12, altitude:"0", difficulty:"Fácil", included:["Embarcación equipada","Guía biólogo marino","Chaleco","Snack"], excluded:["Transporte","Protector solar"], desc:"Ballenas jorobadas migran frente a la costa norte del Perú entre agosto y octubre.", descQu:"Agosto-octubre killapi hatun challwakuna Perú wichay qucha patanpi purinku.", aiSummary:"Experiencia inolvidable cuando hay avistamiento. Biólogo muy informativo. Temporada: ago-oct.", altTour:null, tags:["ballenas","mar","piura","naturaleza"] },
  { id:7, title:"Choquequirao: El Otro Machu Picchu", titleQu:"Choquequirao: Huknin Machu Picchu", location:"Apurímac", price:450, rating:5.0, reviews:2, duration:"4 días", image:"https://images.unsplash.com/photo-1664659457566-143cf6d45812?w=800&h=600&fit=crop", badge:"Anti-overtourism", category:"trekking", operator:"Apurímac Treks", verified:true, capacity:8, altitude:"3,033", difficulty:"Alta", included:["Guía profesional","Cocinero","Equipo de camping","3 noches campamento","Todas las comidas","Mulas de carga"], excluded:["Saco de dormir","Bastones"], desc:"Solo 30 visitantes al día vs. 4,500 en Machu Picchu. Ruinas incas espectaculares con 70% sin excavar, a las que solo se llega caminando 2 días.", descQu:"Sapa p'unchay kinsa chunka watukuqkuna Machu Picchu waranqa tawa pachak pichqayuq runa rantipi. Inka llaqta mana riqsisqa, iskay p'unchay puriylla.", aiSummary:"Experiencia transformadora según todos los viajeros. Exigente físicamente pero incomparable. Sin multitudes.", altTour:null, tags:["trekking","ruinas","alternativo","sin turistas"] },
  { id:8, title:"Cañón del Colca 2D/1N", titleQu:"Colca Wayq'opi Iskay P'unchay", location:"Arequipa", price:175, rating:4.3, reviews:3, duration:"2 días", image:"https://images.unsplash.com/photo-1489229185904-38aa7e8f4790?w=800&h=600&fit=crop", badge:"2 días", category:"trekking", operator:"Colca Expedition", verified:true, capacity:12, altitude:"3,270", difficulty:"Alta", included:["Transporte","1 noche Chivay","Desayuno y almuerzo","Guía","Aguas termales"], excluded:["Entrada cañón S/70","Cena"], desc:"El cañón más profundo del mundo y cóndores al amanecer.", descQu:"Tukuy pachapi aswan ukhu wayq'o, kunturkunaq paqarin phaway rikuyninwan.", aiSummary:"Cóndores al amanecer es el highlight absoluto. El trek es exigente. Aguas termales perfectas para recuperarse.", altTour:null, tags:["cañón","cóndor","trekking","arequipa"] },
  { id:9, title:"Sandboarding & Buggy en Paracas", titleQu:"", location:"Paracas, Ica", price:110, rating:4.7, reviews:3, duration:"3 horas", image:"https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&h=600&fit=crop", badge:"Aventura", category:"adventure", operator:"Paracas Adventure Tours", verified:true, capacity:12, altitude:"400", difficulty:"Moderada", included:["Buggy","Sandboard","Instructor","Seguro","Fotos con drone"], excluded:["Transporte desde Lima","Propinas","Bebidas"], desc:"Adrenalina pura en las dunas de Paracas. Recorre el desierto en buggy a toda velocidad y deslízate por las dunas más altas en sandboard. Incluye atardecer en el desierto con vista al océano.", descQu:"", aiSummary:"Los viajeros destacan la adrenalina del buggy y las fotos con drone. El atardecer en las dunas es el momento favorito.", altTour:null, tags:["aventura","desierto","sandboarding","buggy","paracas"] },
  { id:10, title:"Trekking al Nevado Rajuntay", titleQu:"", location:"Marcapomacocha, Lima", price:195, rating:4.7, reviews:3, duration:"Full day", image:"https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=600&fit=crop", badge:"Alta montaña", category:"trekking", operator:"Lima Trek Expeditions", verified:true, capacity:10, altitude:"5,470", difficulty:"Alta", included:["Transporte desde Lima","Guía certificado","Desayuno","Equipo de seguridad","Crampones"], excluded:["Almuerzo","Equipo personal","Seguro de montaña"], desc:"Conquista uno de los nevados más accesibles desde Lima. Camina sobre glaciares a más de 5,000 msnm con vistas panorámicas de la Cordillera Central. Salida desde Lima a las 3am, ideal para montañistas con experiencia en altura.", descQu:"", aiSummary:"Experiencia desafiante pero gratificante. El glaciar a 5,400m es el punto culminante. Solo para personas con buena condición física.", altTour:null, tags:["trekking","nevado","glaciar","lima","alta montaña"] },
  { id:11, title:"Playa La Mina & Reserva de Paracas", titleQu:"", location:"Paracas, Ica", price:85, rating:4.7, reviews:3, duration:"Full day", image:"https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop", badge:"Familiar", category:"beach", operator:"Paracas Beach Tours", verified:true, capacity:20, altitude:"0", difficulty:"Fácil", included:["Transporte desde Paracas","Entrada a la reserva","Guía","Cooler con agua"], excluded:["Almuerzo","Snorkel","Sombrilla"], desc:"Descubre la playa más hermosa de la costa peruana. Aguas turquesa, arena blanca y cero olas. Perfecta para familias. Incluye recorrido por la Reserva Nacional de Paracas con paradas en la Catedral y el mirador de lobos marinos.", descQu:"", aiSummary:"Playa La Mina es el destino favorito para familias. Aguas cristalinas y tranquilas. El recorrido por la reserva complementa perfectamente.", altTour:null, tags:["playa","familia","paracas","naturaleza","lobos marinos"] },
  { id:12, title:"Castillo de Chancay & Puerto", titleQu:"", location:"Chancay, Lima", price:65, rating:4.3, reviews:3, duration:"6 horas", image:"https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=800&h=600&fit=crop", badge:"Cerca de Lima", category:"culture", operator:"Lima Cultural Tours", verified:true, capacity:25, altitude:"43", difficulty:"Fácil", included:["Transporte desde Lima","Entrada al castillo","Guía","Almuerzo de mariscos"], excluded:["Bebidas","Souvenirs","Propinas"], desc:"Visita el icónico Castillo de Chancay, una fortaleza frente al mar construida en los años 20. Recorre sus torres, pasadizos secretos y disfruta de la vista al Pacífico. Incluye parada en el nuevo Puerto de Chancay y almuerzo de mariscos frescos en el malecón.", descQu:"", aiSummary:"El castillo sorprende a todos los visitantes. El almuerzo de mariscos en el puerto es el highlight. Muy accesible desde Lima.", altTour:null, tags:["castillo","chancay","cultura","mariscos","lima"] },
  { id:13, title:"Lima de Noche: Circuito Mágico del Agua", titleQu:"", location:"Lima, Lima", price:55, rating:4.7, reviews:3, duration:"4 horas", image:"https://images.unsplash.com/photo-1555217851-6141535bd771?w=800&h=600&fit=crop", badge:"Nocturno", category:"culture", operator:"Lima Night Tours", verified:true, capacity:30, altitude:"154", difficulty:"Fácil", included:["Transporte","Guía bilingüe","Entrada al Circuito Mágico del Agua"], excluded:["Cena","Bebidas","Propinas"], desc:"Descubre Lima iluminada. Recorre la Plaza Mayor, la Catedral y el Palacio de Gobierno de noche. Termina en el Circuito Mágico del Agua con su espectáculo de luces, música y fuentes danzantes. El tour nocturno más popular de Lima.", descQu:"", aiSummary:"Lima de noche es mágica según los viajeros. Las fuentes del Circuito Mágico son el punto culminante. Perfecto para familias y parejas.", altTour:null, tags:["lima","noche","fuentes","cultura","centro histórico"] },
  { id:14, title:"Lunahuaná: Canotaje + Canopy + Vino", titleQu:"", location:"Lunahuaná, Lima", price:175, rating:4.7, reviews:3, duration:"Full day", image:"https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&h=600&fit=crop", badge:"Combo", category:"adventure", operator:"Lunahuaná Extremo", verified:true, capacity:14, altitude:"479", difficulty:"Moderada", included:["Transporte desde Lima","Rafting","Canopy","Degustación de vinos","Almuerzo campestre"], excluded:["Fotos y videos","Propinas","Compras en bodega"], desc:"El combo perfecto: adrenalina + relax. Baja los rápidos del río Cañete en rafting clase III, cruza el valle en canopy con vistas increíbles, y termina con degustación de vinos y piscos en una bodega artesanal. A solo 3 horas de Lima.", descQu:"", aiSummary:"La combinación de aventura y relax es lo que más destacan. El rafting es emocionante y la degustación de vinos el cierre perfecto.", altTour:null, tags:["aventura","rafting","canopy","vino","lunahuaná","lima"] },
];

const AI_SUGGESTIONS = [
  { query: "algo tranquilo con niños sin mucha altitud", results: [2, 11, 13, 3], reason: "Baja altitud + actividades familiares" },
  { query: "aventura extrema para jóvenes", results: [5, 9, 14, 1, 10], reason: "Alta adrenalina + desafío físico" },
  { query: "tour barato con almuerzo incluido", results: [13, 12, 5, 11, 3], reason: "Precio accesible + almuerzo en inclusiones" },
  { query: "qué hacer en feriado largo de mayo", results: [14, 3, 4, 8, 11], reason: "Multi-día o full day + temporada seca" },
  { query: "sin turistas y naturaleza pura", results: [7, 6, 11, 8], reason: "Baja masificación + naturaleza" },
  { query: "planes cerca de Lima para el fin de semana", results: [12, 13, 14, 2, 11], reason: "Destinos accesibles desde Lima" },
];

const KEYWORD_MAPS = [
  { keywords: ["tranquilo","relajado","familia","niños","familiar"], filters: { difficulty: ["Fácil"], categories: ["nature","beach","culture","gastro"] } },
  { keywords: ["aventura","extremo","adrenalina"], filters: { difficulty: ["Alta","Moderada"], categories: ["adventure","trekking"] } },
  { keywords: ["barato","económico"], filters: { sort: "price_asc" } },
  { keywords: ["full day","1 día"], filters: { durationMatch: "fullday" } },
  { keywords: ["fin de semana"], filters: { durationMatch: "multiday" } },
  { keywords: ["corto"], filters: { durationMatch: "short" } },
  { keywords: ["sin altitud","baja altitud"], filters: { maxAltitude: 3000 } },
];

const CITY_ALIASES = {
  lima: ["Lima","Miraflores"], cusco: ["Cusco"], arequipa: ["Arequipa"],
  ica: ["Ica","Paracas","Huacachina"], huaraz: ["Huaraz","Áncash"],
  piura: ["Piura","Los Órganos","Máncora"], apurímac: ["Apurímac"],
};

function parseAltitude(t) { return parseInt((t.altitude || "").replace(/,/g, ""), 10) || 0; }
function parseDurationDays(t) {
  const d = (t.duration || "").toLowerCase();
  if (d.includes("hora")) return 0.5;
  const m = d.match(/(\d+)\s*d/i);
  if (m) return parseInt(m[1], 10);
  if (d.includes("full day")) return 1;
  return 1;
}

function searchTours(tours, query, categoryFilter) {
  const q = query.toLowerCase().trim();
  if (q.length < 2) return { results: categoryFilter === "all" ? tours : tours.filter(t => t.category === categoryFilter), hasKeywordMatch: false, sort: null };
  let matchedFilters = {};
  let hasKeywordMatch = false;
  let remaining = q;
  for (const map of KEYWORD_MAPS) {
    for (const kw of map.keywords) {
      if (remaining.includes(kw)) {
        hasKeywordMatch = true;
        remaining = remaining.replace(kw, "").trim();
        Object.assign(matchedFilters, map.filters);
      }
    }
  }
  let cityMatch = null;
  for (const [city, aliases] of Object.entries(CITY_ALIASES)) {
    if (remaining.includes(city) || remaining.includes("cerca de " + city)) {
      cityMatch = aliases;
      remaining = remaining.replace("cerca de " + city, "").replace(city, "").trim();
      hasKeywordMatch = true;
    }
  }
  const tokens = remaining.split(/\s+/).filter(t => t.length >= 2);
  const scored = tours.map(t => {
    let score = 0;
    if (matchedFilters.difficulty && !matchedFilters.difficulty.includes(t.difficulty)) return { tour: t, score: 0 };
    if (matchedFilters.categories && !matchedFilters.categories.includes(t.category)) return { tour: t, score: 0 };
    if (matchedFilters.maxAltitude && parseAltitude(t) > matchedFilters.maxAltitude) return { tour: t, score: 0 };
    if (matchedFilters.durationMatch) {
      const days = parseDurationDays(t);
      if (matchedFilters.durationMatch === "fullday" && days !== 1) return { tour: t, score: 0 };
      if (matchedFilters.durationMatch === "multiday" && days < 2) return { tour: t, score: 0 };
      if (matchedFilters.durationMatch === "short" && days > 1) return { tour: t, score: 0 };
    }
    if (cityMatch && !cityMatch.some(a => t.location.includes(a))) return { tour: t, score: 0 };
    if (hasKeywordMatch && tokens.length === 0) score += 10;
    const catName = (CATS.find(c => c.id === t.category) || {}).n || "";
    const incl = (t.included || []).join(" ");
    for (const tk of tokens) {
      if (t.title.toLowerCase().includes(tk)) score += 40;
      if (t.location.toLowerCase().includes(tk)) score += 30;
      if (catName.toLowerCase().includes(tk)) score += 30;
      if ((t.desc || "").toLowerCase().includes(tk)) score += 15;
      if (incl.toLowerCase().includes(tk)) score += 8;
      if ((t.tags || []).some(tag => tag.includes(tk))) score += 20;
    }
    if (categoryFilter !== "all" && t.category !== categoryFilter) return { tour: t, score: 0 };
    return { tour: t, score };
  });
  let results = scored.filter(s => s.score > 0);
  if (matchedFilters.sort === "price_asc") results.sort((a, b) => a.tour.price - b.tour.price);
  else results.sort((a, b) => b.score - a.score);
  return { results: results.map(s => s.tour), hasKeywordMatch, sort: matchedFilters.sort || null };
}

async function callGeminiSearch(tours, query) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey === "your_gemini_api_key_here") return null;
  try {
    const catalog = tours.map(t => ({ id: t.id, title: t.title, location: t.location, category: t.category, price: t.price, difficulty: t.difficulty, altitude: t.altitude, duration: t.duration, desc: t.desc, tags: t.tags, included: t.included }));
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `Eres el buscador inteligente de FINDE, un marketplace de tours en Perú. Dado el catálogo de tours y la búsqueda del usuario, devuelve SOLO un JSON array con los IDs de los tours que mejor coinciden, ordenados por relevancia. Máximo 5 resultados. Si ninguno coincide, devuelve un array vacío [].\n\nCatálogo: ${JSON.stringify(catalog)}\n\nBúsqueda: "${query}"` }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 100 }
      })
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const match = text.match(/\[[\d,\s]*\]/);
    if (!match) return null;
    return JSON.parse(match[0]);
  } catch { return null; }
}

const NOTIFS = [
  { id:1, type:"ai", title:"Finde IA encontró algo para ti", body:"Basado en tu búsqueda de 'aventura sin altitud', te recomendamos Sandboarding en Huacachina.", time:"Hace 1 hora", read:false, icon:Bot },
  { id:2, type:"booking", title:"Reserva confirmada", body:"Tu Trekking al Nevado Pastoruri del 19 May está confirmado.", time:"Hace 3 horas", read:false, icon:CheckCircle },
  { id:3, type:"reminder", title:"Recordatorio: mañana sales", body:"Tour Gastronómico por Lima mañana 10:00 AM. Parque Kennedy.", time:"Hace 5 horas", read:false, icon:Clock },
  { id:4, type:"promo", title:"Feriado largo: 20% OFF", body:"+200 experiencias con descuento para mayo.", time:"Hace 1 día", read:true, icon:Tag },
  { id:5, type:"review", title:"¿Cómo estuvo tu experiencia?", body:"Cuéntanos sobre tu Sandboarding en Huacachina.", time:"Hace 3 días", read:true, icon:Star },
  { id:6, type:"quechua", title:"Nuevo: tours en quechua", body:"3 operadores ahora tienen descripciones en runasimi.", time:"Hace 5 días", read:true, icon:Languages },
];

const MY_TRIPS = [
  { id:101, tour:TOURS[0], date:"19 May 2026", guests:2, total:378, status:"upcoming", code:"FND-8K3M2P" },
  { id:102, tour:TOURS[1], date:"25 Abr 2026", guests:3, total:435, status:"upcoming", code:"FND-4J7N1Q" },
  { id:103, tour:TOURS[4], date:"02 Abr 2026", guests:2, total:170, status:"completed", code:"FND-9R2L5X", reviewed:false },
  { id:104, tour:TOURS[3], date:"15 Mar 2026", guests:4, total:840, status:"completed", code:"FND-1T8W3V", reviewed:true },
];

const REVIEWS = {
  1: [
    { id:1, author:"Carlos M.", avatar:"CM", rating:5, text:"Experiencia increíble. El nevado Pastoruri es impresionante y el guía muy profesional. Recomiendo llevar ropa abrigada y hojas de coca para la altura.", date:"12 Abr 2026" },
    { id:2, author:"Sofía R.", avatar:"SR", rating:4, text:"Hermoso paisaje, pero la altitud me afectó bastante. Lleven agua y vayan preparados.", date:"28 Mar 2026" },
    { id:3, author:"Diego L.", avatar:"DL", rating:5, text:"Lo mejor de Huaraz sin duda. Nuestro guía Jorge fue espectacular explicando sobre el cambio climático y los glaciares.", date:"15 Mar 2026" },
  ],
  2: [
    { id:4, author:"Valentina P.", avatar:"VP", rating:5, text:"La mejor experiencia gastronómica que he tenido. Probamos ceviche, anticuchos, causa y más. El guía conocía cada rincón de Lima.", date:"10 Abr 2026" },
    { id:5, author:"Martín G.", avatar:"MG", rating:5, text:"Increíble recorrido. Mucha comida, muy buenas explicaciones. Perfecto para foodies.", date:"02 Abr 2026" },
    { id:6, author:"Ana B.", avatar:"AB", rating:4, text:"Muy rico todo, pero el grupo era un poco grande. Hubiera preferido algo más íntimo.", date:"20 Mar 2026" },
  ],
  3: [
    { id:7, author:"Pedro C.", avatar:"PC", rating:5, text:"Las Islas Ballestas son impresionantes. Vimos lobos marinos, pingüinos y miles de aves. Ir temprano es clave.", date:"05 Abr 2026" },
    { id:8, author:"Lucía F.", avatar:"LF", rating:4, text:"Bonito tour pero en temporada alta hay demasiada gente. La Reserva de Paracas es hermosa.", date:"22 Mar 2026" },
  ],
  4: [
    { id:9, author:"Alejandra Quispe", avatar:"AQ", rating:5, text:"Increíble recorrido por el Valle Sagrado. Ollantaytambo fue mi parte favorita. Los guías son muy conocedores de la historia inca.", date:"15 Mar 2026" },
    { id:10, author:"Roberto H.", avatar:"RH", rating:4, text:"Buen tour pero algo apurado. Se intenta cubrir mucho en un solo día. Los sitios arqueológicos son espectaculares.", date:"08 Mar 2026" },
    { id:11, author:"Camila S.", avatar:"CS", rating:5, text:"Perfecto para conocer lo esencial del Valle Sagrado. El almuerzo buffet en Urubamba estuvo delicioso.", date:"01 Mar 2026" },
    { id:12, author:"Fernando T.", avatar:"FT", rating:4, text:"Buenos guías y buena organización. Pisac y su mercado artesanal es imperdible.", date:"20 Feb 2026" },
  ],
  5: [
    { id:13, author:"Mateo V.", avatar:"MV", rating:5, text:"Adrenalina pura! El sandboarding y el buggy por las dunas fue lo más divertido del viaje. 100% recomendado.", date:"01 Abr 2026" },
    { id:14, author:"Isabella D.", avatar:"ID", rating:4, text:"Muy divertido pero no apto para personas que se marean fácil. El atardecer desde las dunas es mágico.", date:"25 Mar 2026" },
  ],
  6: [
    { id:15, author:"Gabriela N.", avatar:"GN", rating:5, text:"Ver ballenas jorobadas en su hábitat natural fue emocionante. El biólogo a bordo explicó todo con mucho detalle.", date:"15 Oct 2025" },
    { id:16, author:"Andrés K.", avatar:"AK", rating:5, text:"Una experiencia que no se puede describir con palabras. Tuvimos suerte de ver una madre con su cría.", date:"02 Oct 2025" },
  ],
  7: [
    { id:17, author:"Tomás W.", avatar:"TW", rating:5, text:"La caminata más desafiante que he hecho pero también la más gratificante. Sin turistas, naturaleza pura. Choquequirao es mágico.", date:"10 Mar 2026" },
    { id:18, author:"Paula E.", avatar:"PE", rating:5, text:"Si estás en buena forma física, no lo dudes. Es mejor que Machu Picchu por la soledad y la inmensidad del lugar.", date:"28 Feb 2026" },
  ],
  8: [
    { id:19, author:"Nicolás J.", avatar:"NJ", rating:5, text:"Ver los cóndores al amanecer en Cruz del Cóndor fue el momento más especial de todo mi viaje por Perú.", date:"08 Abr 2026" },
    { id:20, author:"Elena M.", avatar:"EM", rating:4, text:"El trek es exigente pero vale la pena. Las aguas termales al final son la mejor recompensa.", date:"30 Mar 2026" },
    { id:21, author:"Joaquín R.", avatar:"JR", rating:4, text:"Muy buen tour de 2 días. Chivay es un pueblo encantador. Llevar protector solar, el sol es fuerte.", date:"22 Mar 2026" },
  ],
  9: [
    { id:22, author:"Miguel T.", avatar:"MT", rating:5, text:"Increíble experiencia. El buggy es una locura y el sandboarding súper divertido. El atardecer en las dunas fue espectacular.", date:"05 Abr 2026" },
    { id:23, author:"Carla S.", avatar:"CS", rating:4, text:"Muy divertido aunque un poco corto. El instructor fue muy paciente enseñándonos a surfear en la arena.", date:"28 Mar 2026" },
    { id:24, author:"Roberto L.", avatar:"RL", rating:5, text:"Lo mejor que hicimos en Ica. Las fotos con drone quedaron increíbles. Totalmente recomendado.", date:"15 Mar 2026" },
  ],
  10: [
    { id:25, author:"Andrés M.", avatar:"AM", rating:5, text:"Experiencia de otro nivel. Pisar el glaciar a 5,400m fue emocionante. El guía Luis es un crack, muy profesional.", date:"08 Abr 2026" },
    { id:26, author:"Patricia V.", avatar:"PV", rating:4, text:"Durísimo pero vale cada sol. Salimos de Lima a las 3am y valió la pena. Llevar mucha agua y coca.", date:"22 Mar 2026" },
    { id:27, author:"Fernando G.", avatar:"FG", rating:5, text:"El mejor trekking cerca de Lima. Las vistas desde la cumbre son impresionantes. Solo para gente con buena condición física.", date:"10 Mar 2026" },
  ],
  11: [
    { id:28, author:"Lucía R.", avatar:"LR", rating:5, text:"Playa La Mina es un paraíso escondido. El agua es cristalina y tranquila, perfecta para ir con niños.", date:"12 Abr 2026" },
    { id:29, author:"Jorge H.", avatar:"JH", rating:5, text:"No pensé que Perú tenía playas así. El recorrido por la reserva también fue genial, vimos lobos marinos de cerca.", date:"01 Abr 2026" },
    { id:30, author:"Daniela M.", avatar:"DM", rating:4, text:"Hermosa playa pero llevar su propia comida porque no hay restaurantes cerca. El guía muy amable.", date:"20 Mar 2026" },
  ],
  12: [
    { id:31, author:"María E.", avatar:"ME", rating:4, text:"El castillo es hermoso y la historia fascinante. El almuerzo de mariscos en el puerto fue lo mejor.", date:"15 Abr 2026" },
    { id:32, author:"Carlos P.", avatar:"CP", rating:5, text:"No sabía que existía este lugar tan cerca de Lima. El castillo parece sacado de Europa. Muy recomendado para familias.", date:"05 Abr 2026" },
    { id:33, author:"Ana L.", avatar:"AL", rating:4, text:"Bonito paseo de medio día. El guía sabía mucho de la historia de Chancay. El puerto nuevo está impresionante.", date:"25 Mar 2026" },
  ],
  13: [
    { id:34, author:"Sofía K.", avatar:"SK", rating:5, text:"Lima de noche es mágica. Las fuentes del Circuito Mágico son impresionantes, especialmente con niños.", date:"18 Abr 2026" },
    { id:35, author:"David R.", avatar:"DR", rating:4, text:"Buen tour para conocer el centro histórico sin el calor del día. El guía Raúl fue excelente.", date:"08 Abr 2026" },
    { id:36, author:"Isabella M.", avatar:"IM", rating:5, text:"Perfecta primera noche en Lima. Te da una buena perspectiva de la ciudad antes de explorar por tu cuenta.", date:"28 Mar 2026" },
  ],
  14: [
    { id:37, author:"Renato C.", avatar:"RC", rating:5, text:"El mejor full day desde Lima. El rafting es emocionante, el canopy tiene vistas brutales y el vino artesanal riquísimo.", date:"20 Abr 2026" },
    { id:38, author:"Camila B.", avatar:"CB", rating:5, text:"Fui con mis amigos y la pasamos increíble. El almuerzo campestre fue abundante y delicioso. Volveremos seguro.", date:"10 Abr 2026" },
    { id:39, author:"Eduardo S.", avatar:"ES", rating:4, text:"Muy buena combinación de aventura y relax. El único pero es que el viaje de regreso a Lima es largo con tráfico.", date:"01 Abr 2026" },
  ],
};

const USER = { name:"Alejandra Quispe", phone:"+51 987 654 321", email:"ale.quispe@gmail.com", dni:"72345678", city:"Lima", joinDate:"Enero 2026", trips:4, favorites:6, reviews:2, avatar:"AQ" };

const OP_BK = [
  { id:"F-001", customer:"María García", phone:"+51 987 123 456", date:"15 Abr", guests:3, amount:567, status:"confirmed", tour:"Trekking al Nevado Pastoruri", pay:"Yape", note:"" },
  { id:"F-002", customer:"Carlos Mendoza", phone:"+51 991 234 567", date:"15 Abr", guests:2, amount:378, status:"pending", tour:"Trekking al Nevado Pastoruri", pay:"Plin", note:"Somos pareja, ¿hay descuento?" },
  { id:"F-003", customer:"Ana Quispe", phone:"+51 976 345 678", date:"16 Abr", guests:4, amount:756, status:"confirmed", tour:"Trekking al Nevado Pastoruri", pay:"Yape", note:"Un niño de 10 años en el grupo" },
  { id:"F-004", customer:"José Rivera", phone:"+51 982 456 789", date:"17 Abr", guests:1, amount:189, status:"completed", tour:"Trekking al Nevado Pastoruri", pay:"Tarjeta", note:"" },
  { id:"F-005", customer:"Lucia Fernández", phone:"+51 965 567 890", date:"18 Abr", guests:5, amount:945, status:"cancelled", tour:"Trekking al Nevado Pastoruri", pay:"Yape", note:"Canceló por clima" },
  { id:"F-006", customer:"Pedro Huamán", phone:"+51 944 678 901", date:"19 Abr", guests:2, amount:378, status:"confirmed", tour:"Trekking al Nevado Pastoruri", pay:"PagoEfectivo", note:"" },
];

const EARN = [
  { w:"Sem 1", g:4200, f:630, n:3570 },
  { w:"Sem 2", g:5800, f:870, n:4930 },
  { w:"Sem 3", g:3900, f:585, n:3315 },
  { w:"Sem 4", g:7200, f:1080, n:6120 },
];

// Returns a style object for background images that works for both CSS gradients and uploaded photos.
const imgBg = (image) => {
  if (!image) return {};
  if (image.startsWith("http") || image.startsWith("data:")) return { background: `url(${image}) center/cover no-repeat` };
  if (image.startsWith("url(")) return { background: `${image} center/cover no-repeat` };
  return { background: image };
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
html{scrollbar-gutter:stable}
.app{--f:#1B3A2D;--m:#2D5A3D;--sg:#6B8F71;--sd:#E8DDD3;--cr:#F5F0EA;--wh:#FAFAF7;--tr:#C7613A;--trl:#E8845A;--gd:#D4A843;--ch:#2C2C2A;--gy:#737370;--gy-soft:#8A8A85;--lg:#959591;--yp:#6B2FA0;--pl:#00B4D8;--ai:#0EA5E9;--focus:rgba(199,97,58,.4)}
.app *{margin:0;padding:0;box-sizing:border-box}
.app{font-family:'Plus Jakarta Sans',system-ui,sans-serif;background:var(--wh);color:var(--ch);-webkit-font-smoothing:antialiased;overflow-x:hidden}
.app{min-height:100vh;background:var(--wh);position:relative}

/* Focus accesible — solo navegación con teclado */
.app :focus{outline:none}
.app a:focus-visible,.app button:focus-visible,.app summary:focus-visible,.app [role="button"]:focus-visible,.app [tabindex="0"]:focus-visible{outline:2px solid var(--tr);outline-offset:2px;border-radius:4px}
.app input:focus-visible,.app textarea:focus-visible,.app select:focus-visible{outline:none;border-color:var(--m);box-shadow:0 0 0 4px var(--focus)}
.app input[type="checkbox"]:focus-visible,.app input[type="radio"]:focus-visible{outline:2px solid var(--tr);outline-offset:2px;box-shadow:none}

@media (prefers-reduced-motion: reduce){
  .app *,.app *::before,.app *::after{animation-duration:.01ms !important;animation-iteration-count:1 !important;transition-duration:.01ms !important;scroll-behavior:auto !important}
}

/* Hover/active states unificados para botones y elementos interactivos */
.app .chip:hover{border-color:var(--sg);color:var(--f)}
.app .chip.on{background:var(--f);color:white;border-color:var(--f)}
.app .tc:hover{transform:translateY(-3px);box-shadow:0 8px 20px rgba(0,0,0,.08);border-color:rgba(199,97,58,.18)}
.app .tc:active{transform:translateY(-1px)}
.app .gc:hover{transform:translateY(-2px);box-shadow:0 6px 16px rgba(0,0,0,.07);border-color:rgba(199,97,58,.18)}
.app .gc:active{transform:translateY(0)}
.app .bk-btn:hover{background:white;transform:scale(1.05)}
.app .bk-btn:active{transform:scale(.95)}
.app .bn-i:hover{color:var(--ch)}
.app .bn-i.on:hover{color:var(--f)}
.app .tp-tab:hover:not(.on){border-color:var(--sg);color:var(--ch)}
.app .dsh-tab:hover:not(.on){color:var(--ch)}
.app .pm:hover:not(.sel){border-color:var(--sg)}
.app .pm:active{transform:scale(.98)}
.app .login-btn:active:not(:disabled),.app .mbtn:active:not(:disabled),.app .bb-bt:active:not(:disabled){transform:translateY(1px);box-shadow:0 1px 3px rgba(0,0,0,.1)}
.app .login-btn:hover:not(:disabled),.app .mbtn:hover:not(:disabled),.app .bb-bt:hover:not(:disabled){box-shadow:0 4px 12px rgba(27,58,45,.18)}

/* Disabled state visualmente claro */
.app .login-btn:disabled,.app .mbtn:disabled,.app .bb-bt:disabled{background:var(--gy);box-shadow:none}

/* Inputs y textareas con focus mejorado (border + box-shadow) */
.app .inp:focus,.app .login-phone-input:focus,.app .ai-cc-input:focus,.app .rv-textarea:focus,.app .otp-digit:focus{border-color:var(--m);box-shadow:0 0 0 4px var(--focus)}

/* Smooth scroll en contenedores horizontales */
.app .cats,.app .dsh-tabs,.app .tscr{scroll-behavior:smooth;-webkit-overflow-scrolling:touch}
@keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
@keyframes typingDot{0%,100%{opacity:.3}50%{opacity:1}}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
@keyframes glow{0%,100%{box-shadow:0 0 8px rgba(14,165,233,.2)}50%{box-shadow:0 0 20px rgba(14,165,233,.4)}}
.fu{animation:fadeUp .45s ease forwards}.fd1{animation:fadeUp .45s ease .1s forwards;opacity:0}.fd2{animation:fadeUp .45s ease .2s forwards;opacity:0}.fd3{animation:fadeUp .45s ease .3s forwards;opacity:0}

/* ── Login / Onboarding ── */
.login{min-height:100vh;display:flex;flex-direction:column}
.login-hero{flex:0 0 280px;background:linear-gradient(160deg,var(--f) 0%,#1a4a35 40%,var(--m) 100%);position:relative;display:flex;flex-direction:column;justify-content:flex-end;padding:32px 28px;overflow:hidden}
.login-hero-tex{position:absolute;inset:0;background:repeating-linear-gradient(45deg,transparent,transparent 8px,rgba(255,255,255,.02) 8px,rgba(255,255,255,.02) 16px)}
.login-hero-logo{font-family:'DM Serif Display',Georgia,serif;font-size:42px;color:white;position:relative;z-index:2}
.login-hero-logo span{color:var(--tr)}
.login-hero-tagline{font-size:15px;color:rgba(255,255,255,.7);margin-top:6px;position:relative;z-index:2;line-height:1.5}
.login-hero-stat{display:flex;gap:20px;margin-top:20px;position:relative;z-index:2}
.login-hero-stat-i{text-align:center}
.login-hero-stat-v{font-size:18px;font-weight:800;color:white}
.login-hero-stat-l{font-size:10px;color:rgba(255,255,255,.75);text-transform:uppercase;letter-spacing:.5px;margin-top:2px}
.login-body{flex:1;padding:28px 24px;display:flex;flex-direction:column}
.login-title{font-family:'DM Serif Display',Georgia,serif;font-size:24px;margin-bottom:4px}
.login-sub{font-size:13px;color:var(--gy);margin-bottom:24px;line-height:1.5}
.login-phone-row{display:flex;gap:8px;margin-bottom:16px}
.login-prefix{width:72px;padding:14px 10px;border:2px solid var(--sd);border-radius:14px;font-size:15px;font-family:inherit;text-align:center;background:var(--cr);color:var(--ch);font-weight:600;outline:none}
.login-phone-input{flex:1;padding:14px 16px;border:2px solid var(--sd);border-radius:14px;font-size:15px;font-family:inherit;background:white;color:var(--ch);outline:none;transition:.2s;letter-spacing:1px}
.login-phone-input:focus{border-color:var(--m)}
.login-btn{width:100%;padding:16px;border-radius:14px;background:var(--f);color:white;font-weight:700;font-size:15px;border:none;cursor:pointer;font-family:inherit;transition:.2s;margin-bottom:12px}
.login-btn:hover{background:var(--m)}
.login-btn:disabled{opacity:.4;cursor:not-allowed}
.login-google{width:100%;padding:14px;border-radius:14px;background:white;border:1.5px solid var(--sd);color:var(--ch);font-weight:600;font-size:14px;cursor:pointer;font-family:inherit;transition:.2s;display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:12px}
.login-google:hover{border-color:var(--lg);background:var(--cr)}
.login-google svg{flex-shrink:0}
.login-divider{display:flex;align-items:center;gap:14px;margin:16px 0;color:var(--lg);font-size:12px}
.login-divider::before,.login-divider::after{content:'';flex:1;height:1px;background:var(--sd)}
.login-skip{width:100%;padding:14px;border-radius:14px;background:none;border:1.5px solid var(--sd);color:var(--gy);font-weight:600;font-size:13px;cursor:pointer;font-family:inherit;transition:.2s}
.login-skip:hover{border-color:var(--m);color:var(--ch)}
.login-terms{font-size:11px;color:var(--lg);text-align:center;margin-top:auto;padding-top:16px;line-height:1.5}
.login-terms a{color:var(--tr);text-decoration:none;font-weight:600}

/* OTP Input */
.otp-row{display:flex;gap:10px;justify-content:center;margin-bottom:24px}
.otp-digit{width:48px;height:56px;border:2px solid var(--sd);border-radius:12px;font-size:24px;font-weight:700;text-align:center;font-family:inherit;outline:none;transition:.2s;color:var(--ch)}
.otp-digit:focus{border-color:var(--f);background:rgba(45,90,61,.03)}
.otp-resend{font-size:12px;color:var(--gy);text-align:center;margin-bottom:20px}
.otp-resend button{background:none;border:none;color:var(--tr);font-weight:600;cursor:pointer;font-family:inherit;font-size:12px}

/* Welcome screen */
.welcome{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 24px;text-align:center}
.welcome-check{width:72px;height:72px;border-radius:50%;background:var(--f);color:white;display:flex;align-items:center;justify-content:center;font-size:32px;margin-bottom:20px;animation:pulse .6s ease}
.welcome-title{font-family:'DM Serif Display',Georgia,serif;font-size:26px;margin-bottom:8px}
.welcome-sub{font-size:14px;color:var(--gy);margin-bottom:32px;line-height:1.6;max-width:280px}
.welcome-features{display:flex;flex-direction:column;gap:12px;width:100%;margin-bottom:32px}
.welcome-feat{display:flex;align-items:center;gap:12px;padding:14px 16px;background:var(--cr);border-radius:12px;text-align:left}
.welcome-feat-ic{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}
.welcome-feat-txt{font-size:13px;font-weight:600}

/* ── Nav ── */
.tn{position:sticky;top:0;z-index:50;background:rgba(250,250,247,.85);backdrop-filter:blur(20px);box-shadow:0 1px 0 transparent;transition:box-shadow .15s}
.tn.scrolled{box-shadow:0 1px 0 rgba(0,0,0,.06)}
.tn-inner{display:flex;align-items:center;justify-content:space-between;padding:12px 20px}
.logo{font-family:'DM Serif Display',Georgia,serif;font-size:28px;color:var(--f);cursor:pointer;letter-spacing:-.5px}
.logo span{color:var(--tr)}
.logo-ai{font-size:9px;font-weight:700;color:var(--ai);background:rgba(14,165,233,.1);padding:2px 6px;border-radius:4px;margin-left:6px;vertical-align:super;letter-spacing:.5px}
.tn-r{display:flex;gap:8px}
.tn-btn{width:40px;height:40px;border-radius:50%;border:1.5px solid var(--lg);background:white;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:.2s;font-family:inherit;position:relative;color:var(--ch)}
.tn-btn:hover{border-color:var(--f);transform:scale(1.05)}
.tn-btn.on{background:var(--f);border-color:var(--f);color:white}
.ndot{position:absolute;top:6px;right:6px;width:8px;height:8px;border-radius:50%;background:var(--tr);border:2px solid white}

.bn{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:none;background:rgba(250,250,247,.92);backdrop-filter:blur(20px);border-top:1px solid rgba(0,0,0,.06);display:flex;justify-content:space-around;padding:8px 0 max(env(safe-area-inset-bottom),8px);z-index:100}
.bn-i{display:flex;flex-direction:column;align-items:center;gap:2px;font-size:10px;font-weight:600;color:var(--gy);cursor:pointer;padding:6px 16px;border-radius:12px;transition:.2s;background:none;border:none;font-family:inherit}
.bn-i.on{color:var(--f)}.bn-i .ni{font-size:22px;line-height:1}
.bn-i .nd{width:4px;height:4px;border-radius:50%;background:var(--tr);opacity:0;transition:.2s}.bn-i.on .nd{opacity:1}

/* ── Hero ── */
.hero{position:relative;margin:0 16px 20px;border-radius:28px;overflow:hidden;height:220px;background:url(https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=800&h=600&fit=crop) center/cover no-repeat}
.hero-tex{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.35) 0%,rgba(0,0,0,.55) 100%)}
.hero-c{position:relative;z-index:2;padding:28px 24px;display:flex;flex-direction:column;justify-content:space-between;height:100%}
.hero-tag{display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,.15);backdrop-filter:blur(10px);padding:6px 14px;border-radius:100px;font-size:11px;font-weight:600;color:rgba(255,255,255,.9);width:fit-content;letter-spacing:.5px}
.hero-t{font-family:'DM Serif Display',Georgia,serif;font-size:28px;line-height:1.15;color:white;max-width:280px}
.hero-sub{font-size:13px;color:rgba(255,255,255,.7);margin-top:4px}

/* ── AI Search ── */
.ai-sb{margin:0 16px 12px;position:relative;z-index:70}
.ai-sb input{width:100%;padding:14px 48px 14px 44px;border:2px solid var(--sd);border-radius:20px;font-size:14px;font-family:inherit;background:white;color:var(--ch);transition:.3s;outline:none}
.ai-sb input:focus{border-color:var(--m);box-shadow:0 0 0 4px rgba(45,90,61,.08)}
.ai-sb input::placeholder{color:var(--gy)}
.ai-sb-ic{position:absolute;left:16px;top:50%;transform:translateY(-50%);font-size:16px;color:var(--gy)}
.ai-sb-tag{position:absolute;right:14px;top:50%;transform:translateY(-50%);padding:3px 8px;border-radius:6px;font-size:9px;font-weight:700;color:var(--f);background:var(--cr);letter-spacing:.3px}
.ai-suggest{position:absolute;top:calc(100% + 4px);left:0;right:0;background:white;border-radius:12px;box-shadow:0 8px 28px rgba(0,0,0,.12);z-index:200;border:1px solid rgba(0,0,0,.08);max-height:380px;overflow-y:auto;padding:6px 0}
.ai-suggest-h{padding:8px 12px 4px;font-size:10px;font-weight:700;color:var(--f);text-transform:uppercase;letter-spacing:1px;display:flex;align-items:center;gap:6px}
.ai-suggest-i{padding:8px 12px;cursor:pointer;transition:.15s;font-size:13px;color:var(--ch);border-bottom:1px solid rgba(0,0,0,.03)}
.ai-suggest-i:hover{background:var(--cr)}
.ai-suggest-i:last-child{border-bottom:none}
.ai-suggest-q{font-weight:600}
.ai-suggest-r{font-size:11px;color:var(--gy);margin-top:2px}
.sr-item{display:flex;align-items:center;gap:10px;padding:10px 12px;cursor:pointer;transition:.15s;border-bottom:1px solid rgba(0,0,0,.03)}
.sr-item:hover{background:var(--cr)}
.sr-item:last-of-type{border-bottom:none}
.sr-thumb{width:44px;height:44px;border-radius:10px;flex-shrink:0}
.sr-info{flex:1;min-width:0}
.sr-name{font-size:13px;font-weight:700;color:var(--ch);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sr-loc{font-size:11px;color:var(--gy);margin-top:1px}
.sr-meta{text-align:right;flex-shrink:0}
.sr-price{font-size:13px;font-weight:800;color:var(--f)}
.sr-rating{font-size:10px;color:var(--gd)}
.sr-viewall{padding:10px 12px;text-align:center;font-size:13px;font-weight:700;color:var(--tr);cursor:pointer;border-top:1px solid rgba(0,0,0,.06)}
.sr-viewall:hover{background:var(--cr)}
.sr-noresults{padding:16px 12px;font-size:13px;color:var(--gy);text-align:center;line-height:1.5}
.sr-pills{display:flex;flex-wrap:wrap;gap:6px;padding:8px 12px;justify-content:center}
.sr-ai-hint{padding:6px 12px;font-size:11px;color:var(--m);font-weight:600;display:flex;align-items:center;gap:4px}
.sr-clear{background:none;border:none;font-size:16px;color:var(--gy);cursor:pointer;padding:4px 8px;margin-left:auto;flex-shrink:0}
.sr-clear:hover{color:var(--ch)}

/* AI Result banner */
.ai-result{margin:0 16px 16px;padding:14px 16px;background:var(--cr);border:1px solid var(--sd);border-radius:14px;display:flex;align-items:flex-start;gap:10px}
.ai-result-ic{width:28px;height:28px;border-radius:8px;background:rgba(45,90,61,.1);display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;color:var(--f)}
.ai-result-t{font-size:12px;font-weight:600;color:var(--f)}
.ai-result-b{font-size:11px;color:var(--gy);margin-top:2px;line-height:1.4}

/* ── Language Dropdown ── */
.lang-dd{position:relative;display:inline-block}
.lang-dd-btn{padding:5px 12px;border-radius:8px;font-size:11px;font-weight:600;border:1.5px solid var(--sd);background:white;color:var(--ch);cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:4px}
.lang-dd-btn .arr{font-size:8px;color:var(--gy);margin-left:2px}
.lang-dd-menu{position:absolute;top:calc(100% + 4px);right:0;background:white;border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.12);z-index:80;overflow:hidden;min-width:120px;border:1px solid rgba(0,0,0,.06)}
.lang-dd-item{padding:10px 14px;font-size:12px;font-weight:500;cursor:pointer;transition:.15s;display:flex;align-items:center;gap:8px;border-bottom:1px solid rgba(0,0,0,.03)}
.lang-dd-item:last-child{border-bottom:none}
.lang-dd-item:hover{background:var(--cr)}
.lang-dd-item.on{font-weight:700;color:var(--f)}
.lang-dd-item .lang-check{width:14px;font-size:12px;color:var(--f)}

/* ── Chips ── */
.cats{display:flex;gap:8px;padding:0 16px 16px;overflow-x:auto;scrollbar-width:none}
.cats::-webkit-scrollbar{display:none}
.chip{display:flex;align-items:center;gap:6px;padding:8px 16px;border-radius:100px;font-size:13px;font-weight:600;white-space:nowrap;cursor:pointer;transition:.25s;border:1.5px solid var(--sd);background:white;color:var(--ch);font-family:inherit}
.chip.on{background:var(--f);color:white;border-color:var(--f)}

.sh{display:flex;justify-content:space-between;align-items:baseline;padding:0 20px;margin-bottom:14px}
.st{font-family:'DM Serif Display',Georgia,serif;font-size:22px}
.sl{font-size:13px;font-weight:600;color:var(--tr);cursor:pointer;border:none;background:none;font-family:inherit}

/* ── Cards ── */
.tscr{display:flex;gap:14px;padding:0 16px 24px;overflow-x:auto;scrollbar-width:none}
.tscr::-webkit-scrollbar{display:none}
.tc{flex:0 0 260px;border-radius:20px;overflow:hidden;background:white;border:1px solid rgba(0,0,0,.06);cursor:pointer;transition:.25s;box-shadow:0 2px 12px rgba(0,0,0,.06)}
.tc:hover{transform:translateY(-3px);box-shadow:0 8px 24px rgba(0,0,0,.1)}
.tc-img{height:160px;position:relative}
.tc-bdg{position:absolute;top:10px;left:10px;padding:4px 10px;border-radius:100px;font-size:10px;font-weight:700;background:rgba(255,255,255,.95);color:var(--ch);backdrop-filter:blur(10px)}
.tc-bdg.anti{background:var(--f);color:white}
.tc-ver{position:absolute;bottom:10px;left:10px;padding:3px 8px;border-radius:100px;font-size:9px;font-weight:700;background:rgba(45,90,61,.9);color:white}
.tc-b{padding:14px}
.tc-loc{font-size:11px;color:var(--gy);font-weight:600;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px}
.tc-tl{font-size:15px;font-weight:700;margin-bottom:6px;line-height:1.3}
.tc-m{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--gy);margin-bottom:10px}
.tc-m .rt{color:var(--gd);font-weight:700}
.tc-ft{display:flex;justify-content:space-between;align-items:center}
.tc-pr{font-size:16px;font-weight:800;color:var(--f)}.tc-pr span{font-size:11px;font-weight:400;color:var(--gy)}
.tc-du{font-size:11px;color:var(--gy);background:var(--cr);padding:4px 8px;border-radius:6px;font-weight:600}

.tg{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:0 16px 120px}
.gc{border-radius:16px;overflow:hidden;background:white;border:1px solid rgba(0,0,0,.06);cursor:pointer;transition:.2s}
.gc:hover{transform:translateY(-2px);box-shadow:0 4px 16px rgba(0,0,0,.08)}
.gc-img{height:120px;position:relative}
.gc-ver{position:absolute;bottom:6px;right:6px;width:20px;height:20px;border-radius:50%;background:var(--f);color:white;font-size:9px;display:flex;align-items:center;justify-content:center;font-weight:700}
.gc-b{padding:10px}
.gc-loc{font-size:10px;color:var(--gy);font-weight:600;text-transform:uppercase;letter-spacing:.3px;margin-bottom:3px}
.gc-t{font-size:13px;font-weight:700;margin-bottom:6px;line-height:1.3}
.gc-p{font-size:14px;font-weight:800;color:var(--f)}.gc-p span{font-size:10px;font-weight:400;color:var(--gy)}

/* ── Detail ── */
.det{padding-bottom:100px}
.det-hero{height:280px;position:relative;display:flex;flex-direction:column;justify-content:space-between;padding:16px}
.det-ov{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,.2) 0%,rgba(0,0,0,.5) 100%)}
.bk-btn{width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,.9);border:none;cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center;z-index:2;position:relative;backdrop-filter:blur(10px);color:var(--ch)}
.det-nfo{position:relative;z-index:2}
.det-bdg{display:inline-block;padding:4px 12px;border-radius:100px;font-size:10px;font-weight:700;background:rgba(255,255,255,.95);color:var(--ch);margin-bottom:8px}
.det-tl{font-family:'DM Serif Display',Georgia,serif;font-size:26px;color:white;line-height:1.2}
.det-c{padding:20px}
.ai-sum{padding:14px 16px;background:linear-gradient(135deg,rgba(14,165,233,.06),rgba(14,165,233,.02));border:1.5px solid rgba(14,165,233,.15);border-radius:14px;margin-bottom:20px}
.ai-sum-h{display:flex;align-items:center;gap:6px;font-size:10px;font-weight:700;color:var(--ai);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px}
.ai-sum-t{font-size:13px;color:var(--ch);line-height:1.6}
.det-mb{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:20px}
.det-mi{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--ch);font-weight:500}
.mic{font-size:14px;opacity:.7}
.det-ds{font-size:14px;line-height:1.7;color:var(--ch);margin-bottom:20px}
.det-op{display:flex;align-items:center;gap:12px;padding:14px;background:var(--cr);border-radius:14px;margin-bottom:20px}
.det-op-av{width:44px;height:44px;border-radius:12px;background:var(--f);color:white;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:18px;position:relative;flex-shrink:0}
.det-op-n{font-size:14px;font-weight:700}.det-op-d{font-size:11px;color:var(--gy);margin-top:2px}
.det-st{font-size:13px;font-weight:700;color:var(--ch);margin-bottom:10px;text-transform:uppercase;letter-spacing:.5px}
.det-incs{display:flex;flex-direction:column;gap:6px;margin-bottom:20px}
.det-inc{display:flex;align-items:center;gap:10px;font-size:13px}
.det-ic{width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0}
.det-ic.iy{background:rgba(45,90,61,.1);color:var(--m)}.det-ic.in{background:rgba(199,97,58,.1);color:var(--tr)}
.bb{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:none;padding:12px 20px max(env(safe-area-inset-bottom),12px);background:rgba(250,250,247,.95);backdrop-filter:blur(20px);border-top:1px solid rgba(0,0,0,.06);display:flex;align-items:center;gap:14px;z-index:100}
.bb-p{font-size:20px;font-weight:800;color:var(--f);white-space:nowrap}.bb-p span{font-size:12px;font-weight:400;color:var(--gy);display:block}
.bb-bt{flex:1;padding:14px;border-radius:14px;background:var(--f);color:white;font-weight:700;font-size:15px;border:none;cursor:pointer;font-family:inherit;transition:.2s}
.bb-bt:hover{background:var(--m)}

/* ── Booking ── */
.bkf{padding:20px 20px 120px}
.bkf-st{display:flex;gap:6px;margin-bottom:24px}
.bkf-s{flex:1;height:4px;border-radius:2px;background:var(--sd);transition:.3s}
.bkf-s.on{background:var(--f)}
.bkf-t{font-family:'DM Serif Display',Georgia,serif;font-size:24px;margin-bottom:4px}
.bkf-sub{font-size:13px;color:var(--gy);margin-bottom:24px}
.fg{margin-bottom:20px}
.lbl{display:block;font-size:12px;font-weight:700;color:var(--gy);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px}
.inp{width:100%;padding:14px 16px;border:2px solid var(--sd);border-radius:14px;font-size:15px;font-family:inherit;background:white;color:var(--ch);outline:none;transition:.2s}
.inp:focus{border-color:var(--m)}
.gctr{display:flex;align-items:center;gap:0;border:2px solid var(--sd);border-radius:14px;overflow:hidden;width:fit-content}
.gbtn{width:44px;height:44px;background:var(--cr);border:none;font-size:20px;cursor:pointer;font-family:inherit;transition:.2s;color:var(--ch)}
.gbtn:hover:not(:disabled){background:var(--sd)}
.gbtn:active:not(:disabled){background:var(--lg)}
.gbtn:disabled{opacity:.4;cursor:not-allowed;color:var(--gy)}
.gcnt{width:60px;text-align:center;font-size:18px;font-weight:700}
.sum{background:var(--cr);border-radius:16px;padding:16px;margin-bottom:20px}
.sum-r{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(0,0,0,.06);font-size:14px}
.sum-r:last-child{border-bottom:none}
.sum-t{display:flex;justify-content:space-between;padding:12px 0 4px;font-size:16px;font-weight:800;color:var(--f)}
.mbtn{width:100%;padding:16px;border-radius:14px;background:var(--f);color:white;font-weight:700;font-size:15px;border:none;cursor:pointer;font-family:inherit;transition:.2s}
.mbtn:hover{background:var(--m)}
.mbtn:disabled{opacity:.4;cursor:not-allowed}
.mbtn.yp{background:var(--yp)}
.pms{display:flex;flex-direction:column;gap:8px;margin-bottom:16px}
.pm{display:flex;align-items:center;gap:12px;padding:14px;border:2px solid var(--sd);border-radius:14px;cursor:pointer;transition:.2s}
.pm.sel{border-color:var(--f);background:rgba(27,58,45,.03)}
.pm-rd{width:18px;height:18px;border-radius:50%;border:2px solid var(--lg);transition:.2s;flex-shrink:0}
.pm.sel .pm-rd{border-color:var(--f);background:var(--f);box-shadow:inset 0 0 0 3px white}
.pm-ic{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:white;flex-shrink:0}
.pm-n{flex:1;font-size:14px;font-weight:600}
.pm-tg{font-size:10px;font-weight:700;color:var(--yp);background:rgba(107,47,160,.1);padding:2px 8px;border-radius:4px}

/* Success */
.suc{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:80vh;padding:40px 24px;text-align:center}
.suc-chk{width:72px;height:72px;border-radius:50%;background:var(--f);color:white;display:flex;align-items:center;justify-content:center;font-size:32px;margin-bottom:20px;animation:pulse .6s ease}
.suc-t{font-family:'DM Serif Display',Georgia,serif;font-size:26px;margin-bottom:8px}
.suc-sub{font-size:14px;color:var(--gy);margin-bottom:24px;line-height:1.6}
.suc-card{width:100%;background:var(--cr);border-radius:16px;padding:16px;margin-bottom:20px;text-align:left}
.suc-row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(0,0,0,.06);font-size:14px}
.suc-row:last-child{border-bottom:none}
.suc-row .l{color:var(--gy)}
.suc-wa{width:100%;padding:14px;border-radius:14px;background:#25D366;color:white;font-weight:700;font-size:14px;border:none;cursor:pointer;font-family:inherit;margin-bottom:10px;transition:.2s}
.suc-wa:hover{background:#1eb954;box-shadow:0 4px 12px rgba(37,211,102,.3)}
.suc-wa:active{transform:translateY(1px)}

/* Booking extras */
.login-banner{background:var(--f);color:white;padding:12px 16px;text-align:center;font-size:13px;font-weight:600;border-radius:12px;margin:0 0 16px}
.inp-err{border-color:#e53e3e !important;background:rgba(229,62,62,.04) !important}
.inp-err:focus{box-shadow:0 0 0 4px rgba(229,62,62,.18) !important;border-color:#e53e3e !important}
.field-err{font-size:11px;color:#e53e3e;margin-top:4px;font-weight:600;display:flex;align-items:center;gap:4px}
.bk-phone-row{display:flex;gap:0}
.bk-phone-prefix{display:flex;align-items:center;gap:6px;padding:0 12px;border:2px solid var(--sd);border-radius:14px 0 0 14px;font-size:14px;font-weight:600;background:var(--cr);color:var(--ch);border-right:none;white-space:nowrap}
.bk-phone-prefix .wa-ic{color:#25D366;font-size:16px}
.bk-phone-inp{border-radius:0 14px 14px 0 !important}
.bk-sum-tour{font-weight:700;font-size:15px;padding-bottom:4px}
.bk-sum-meta{font-size:13px;color:var(--gy);padding-bottom:8px;border-bottom:1px solid rgba(0,0,0,.06)}

/* ── Notifs ── */
.npage{padding:20px 0 100px}
.npage-h{display:flex;justify-content:space-between;align-items:center;padding:0 20px 16px}
.npage-h h2{font-family:'DM Serif Display',Georgia,serif;font-size:24px}
.npage-h button{font-size:12px;font-weight:600;color:var(--tr);background:none;border:none;cursor:pointer;font-family:inherit}
.ni-item{display:flex;align-items:flex-start;gap:12px;padding:16px 20px;border-bottom:1px solid rgba(0,0,0,.04);cursor:pointer;transition:.15s;position:relative}
.ni-item:hover{background:var(--cr)}
.ni-item.unread{background:rgba(27,58,45,.02)}
.ni-ic{width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--f)}
.ni-ic.ai{background:rgba(14,165,233,.1)}.ni-ic.booking{background:rgba(45,90,61,.1)}.ni-ic.reminder{background:rgba(212,168,67,.1)}.ni-ic.promo{background:rgba(199,97,58,.1)}.ni-ic.review{background:rgba(212,168,67,.1)}.ni-ic.quechua{background:rgba(212,168,67,.1)}
.ni-body{flex:1}
.ni-title{font-size:14px;font-weight:700;margin-bottom:3px}
.ni-text{font-size:12px;color:var(--gy);line-height:1.4}
.ni-time{font-size:11px;color:var(--lg);margin-top:4px}
.ni-dot{width:8px;height:8px;border-radius:50%;background:var(--tr);flex-shrink:0;margin-top:6px}

/* ── Trips ── */
.tp-page{padding:20px 16px 120px}
.tp-h{margin-bottom:20px}.tp-h h2{font-family:'DM Serif Display',Georgia,serif;font-size:28px;color:var(--ch)}.tp-h p{font-size:14px;color:var(--gy);margin-top:4px}
.tp-tabs{display:flex;gap:6px;margin-bottom:16px}
.tp-tab{padding:8px 16px;border-radius:100px;font-size:13px;font-weight:600;border:1.5px solid var(--sd);background:white;color:var(--gy);cursor:pointer;font-family:inherit;transition:.2s}
.tp-tab.on{background:var(--f);color:white;border-color:var(--f)}
.tp-card{display:flex;gap:14px;padding:16px;background:white;border-radius:16px;border:1px solid rgba(0,0,0,.06);margin-bottom:10px;cursor:pointer;transition:.2s;width:100%}
.tp-card:hover{box-shadow:0 2px 12px rgba(0,0,0,.08)}
.tp-img{width:100px;height:100px;border-radius:12px;flex-shrink:0}
.tp-info{flex:1;min-width:0}
.tp-name{font-size:15px;font-weight:700;margin-bottom:4px;color:var(--ch)}
.tp-det{font-size:12px;color:var(--gy);margin-bottom:3px}
.tp-code{font-size:11px;color:var(--lg);font-family:monospace;margin-bottom:6px}
.tp-foot{display:flex;justify-content:space-between;align-items:center}
.tp-price{font-size:15px;font-weight:800;color:var(--f)}
.tp-st{font-size:10px;font-weight:700;padding:3px 8px;border-radius:100px;text-transform:uppercase}
.tp-upcoming{background:rgba(45,90,61,.1);color:var(--m)}.tp-completed{background:rgba(107,143,113,.15);color:var(--sg)}
.tp-rv{padding:10px 16px;background:rgba(212,168,67,.1);border-radius:10px;font-size:13px;font-weight:600;color:#8B6914;margin-bottom:12px;cursor:pointer;text-align:center}

/* ── Reviews ── */
.rev-sec{margin-top:24px;padding-top:24px;border-top:1px solid rgba(0,0,0,.06)}
.rev-hdr{font-family:'DM Serif Display',Georgia,serif;font-size:20px;margin-bottom:16px}
.rev-summary{display:flex;gap:20px;align-items:center;margin-bottom:20px;padding:16px;background:var(--cr);border-radius:14px}
.rev-big{text-align:center;min-width:72px}
.rev-big-n{font-family:'DM Serif Display',Georgia,serif;font-size:36px;color:var(--f);line-height:1}
.rev-big-stars{color:var(--gd);font-size:12px;margin:4px 0 2px}
.rev-big-cnt{font-size:11px;color:var(--gy)}
.rev-bars{flex:1;display:flex;flex-direction:column;gap:4px}
.rev-bar-row{display:flex;align-items:center;gap:8px;font-size:11px;color:var(--gy)}
.rev-bar-row span:first-child{width:12px;text-align:right}
.rev-bar{flex:1;height:6px;background:var(--sd);border-radius:3px;overflow:hidden}
.rev-bar-fill{height:100%;background:var(--gd);border-radius:3px}
.rev-bar-row span:last-child{width:24px;font-size:10px}
.rev-card{padding:14px 0;border-bottom:1px solid rgba(0,0,0,.05)}
.rev-card:last-child{border-bottom:none}
.rev-top{display:flex;align-items:center;gap:10px;margin-bottom:6px}
.rev-av{width:32px;height:32px;border-radius:50%;background:var(--m);color:white;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0}
.rev-author{font-size:13px;font-weight:600}
.rev-date{font-size:11px;color:var(--gy)}
.rev-stars{color:var(--gd);font-size:12px;margin-bottom:4px}
.rev-text{font-size:13px;line-height:1.6;color:var(--ch)}
.rev-more{width:100%;padding:12px;border:1.5px solid var(--sd);border-radius:12px;background:none;font-size:13px;font-weight:600;color:var(--gy);cursor:pointer;font-family:inherit;margin-top:12px;transition:.2s}
.rev-more:hover{border-color:var(--f);color:var(--f)}

/* Review form */
.rv-form{padding:16px;background:var(--cr);border-radius:14px;margin-bottom:12px}
.rv-form-t{font-size:14px;font-weight:700;margin-bottom:12px}
.rv-stars{display:flex;gap:4px;margin-bottom:12px}
.rv-star{width:32px;height:32px;border:none;background:none;font-size:22px;cursor:pointer;padding:0;opacity:.3;transition:.15s}
.rv-star.on{opacity:1}
.rv-textarea{width:100%;padding:12px;border:2px solid var(--sd);border-radius:12px;font-size:13px;font-family:inherit;resize:vertical;min-height:80px;outline:none;transition:.2s}
.rv-textarea:focus{border-color:var(--m)}
.rv-actions{display:flex;gap:8px;margin-top:12px}
.rv-submit{flex:1;padding:12px;border-radius:12px;background:var(--f);color:white;font-weight:700;font-size:13px;border:none;cursor:pointer;font-family:inherit;transition:.2s}
.rv-submit:hover{background:var(--m)}
.rv-submit:disabled{opacity:.4;cursor:not-allowed}
.rv-cancel{padding:12px 16px;border-radius:12px;background:none;border:1.5px solid var(--sd);font-size:13px;font-weight:600;color:var(--gy);cursor:pointer;font-family:inherit}

/* ── Profile ── */
.pf-page{padding-bottom:120px;overflow-x:hidden}
.pf-hdr{padding:24px 20px;text-align:center;border-bottom:1px solid rgba(0,0,0,.06);margin-bottom:20px}
.pf-av{width:72px;height:72px;border-radius:50%;background:var(--f);color:white;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700;margin:0 auto 12px}
.pf-name{font-family:'DM Serif Display',Georgia,serif;font-size:22px;margin-bottom:2px}
.pf-since{font-size:12px;color:var(--gy);margin-bottom:16px}
.pf-stats{display:flex;gap:20px;justify-content:center}
.pf-stat{text-align:center}.pf-stat-v{font-size:20px;font-weight:800;color:var(--f)}.pf-stat-l{font-size:10px;color:var(--gy);text-transform:uppercase;letter-spacing:.5px}
.pf-sec{padding:0 20px;margin-bottom:20px}
.pf-sec-t{font-family:'DM Serif Display',Georgia,serif;font-size:18px;margin-bottom:12px}
.pf-field{display:flex;justify-content:space-between;align-items:center;padding:14px 0;border-bottom:1px solid rgba(0,0,0,.04)}
.pf-field:last-child{border-bottom:none}.pf-field-l{font-size:12px;color:var(--gy);font-weight:600;text-transform:uppercase;letter-spacing:.5px}.pf-field-v{font-size:14px;font-weight:600}
.pf-mi{display:flex;align-items:center;gap:14px;padding:16px 20px;border-bottom:1px solid rgba(0,0,0,.04);cursor:pointer;transition:.15s}
.pf-mi:hover{background:var(--cr)}
.pf-mi-ic{width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--f)}
.pf-mi-txt{flex:1}.pf-mi-t{font-size:14px;font-weight:600}.pf-mi-d{font-size:11px;color:var(--gy);margin-top:1px}
.pf-logout{margin:20px;padding:14px;border-radius:14px;background:none;border:2px solid var(--tr);color:var(--tr);font-weight:700;font-size:14px;cursor:pointer;font-family:inherit;width:calc(100% - 40px);transition:.2s;text-align:center}
.pf-logout:hover{background:var(--tr);color:white}
.pf-ver{text-align:center;padding:16px;font-size:11px;color:var(--lg)}
.pf-op-card{margin:0 20px 20px;padding:18px 20px;background:var(--f);border-radius:14px;color:white;display:flex;align-items:center;justify-content:space-between;cursor:pointer;transition:.2s;min-height:80px}
.pf-op-card:hover{opacity:.9}
.pf-op-left{display:flex;align-items:center;gap:12px;min-width:0;flex:1}
.pf-op-left>div:last-child{min-width:0;flex:1}
.pf-op-ic{width:40px;height:40px;border-radius:12px;background:rgba(255,255,255,.15);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:white}
.pf-op-title{font-size:14px;font-weight:700;white-space:nowrap}
.pf-op-desc{font-size:11px;opacity:.7;margin-top:1px;text-overflow:ellipsis;overflow:hidden}

/* ═══ DASHBOARD ═══ */
.dsh{padding-bottom:100px}
.dsh-h{padding:20px;background:linear-gradient(135deg,var(--f) 0%,#1a4a35 100%);color:white}
.dsh-gr{font-size:14px;opacity:.8}.dsh-nm{font-family:'DM Serif Display',Georgia,serif;font-size:24px;margin:4px 0 6px}
.dsh-sts{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}
.dsh-s{background:rgba(255,255,255,.12);border-radius:14px;padding:12px;text-align:center}
.dsh-s-v{font-size:22px;font-weight:800}.dsh-s-l{font-size:10px;opacity:.7;text-transform:uppercase;letter-spacing:.5px;margin-top:2px}
.dsh-tabs{display:flex;border-bottom:2px solid var(--sd);padding:0 20px;margin-bottom:16px;overflow-x:auto;scrollbar-width:none}
.dsh-tabs::-webkit-scrollbar{display:none}
.dsh-tab{padding:14px 14px;font-size:12px;font-weight:600;color:var(--gy);cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-2px;white-space:nowrap;background:none;border-top:none;border-left:none;border-right:none;font-family:inherit;transition:.2s}
.dsh-tab.on{color:var(--f);border-bottom-color:var(--f)}
.dsh-bk{margin:0 0 10px;padding:16px;background:white;border-radius:14px;border:1px solid rgba(0,0,0,.06);display:flex;align-items:center;gap:14px;cursor:pointer;transition:.2s;width:100%}
.dsh-bk:hover{box-shadow:0 1px 3px rgba(0,0,0,.06)}
.dsh-bk-av{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:16px;color:white;flex-shrink:0}
.dsh-bk-i{flex:1;min-width:0}.dsh-bk-n{font-size:14px;font-weight:700}.dsh-bk-d{font-size:12px;color:var(--gy);margin-top:2px}
.dsh-bk-r{text-align:right;flex-shrink:0}.dsh-bk-a{font-size:15px;font-weight:800;color:var(--f)}
.dsh-bk-s{display:inline-block;padding:3px 10px;border-radius:100px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;margin-top:4px}
.st-confirmed{background:rgba(45,90,61,.1);color:var(--m)}.st-pending{background:rgba(212,168,67,.15);color:#B8860B}.st-completed{background:rgba(107,143,113,.15);color:var(--sg)}.st-cancelled{background:rgba(199,97,58,.1);color:var(--tr)}

/* AI Content Creator */
.ai-cc{margin:0 0 16px 0;padding:20px;background:linear-gradient(135deg,rgba(14,165,233,.06),rgba(14,165,233,.02));border:1.5px solid rgba(14,165,233,.15);border-radius:16px}
.ai-cc-h{display:flex;align-items:center;gap:8px;margin-bottom:12px}
.ai-cc-h span{font-size:18px}
.ai-cc-h h3{font-size:15px;font-weight:700;color:var(--ai)}
.ai-cc-desc{font-size:12px;color:var(--gy);margin-bottom:14px;line-height:1.5}
.ai-cc-input{width:100%;padding:12px;border:1.5px solid rgba(14,165,233,.2);border-radius:10px;font-size:13px;font-family:inherit;background:white;color:var(--ch);outline:none;resize:vertical;min-height:70px;transition:.2s}
.ai-cc-input:focus{border-color:var(--ai)}
.ai-cc-btn{margin-top:10px;padding:10px 20px;border-radius:100px;background:var(--ai);color:white;font-weight:700;font-size:12px;border:none;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:6px}
.ai-cc-result{margin-top:14px;padding:14px;background:white;border-radius:10px;border:1px solid rgba(14,165,233,.1)}
.ai-cc-result-h{font-size:10px;font-weight:700;color:var(--ai);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px}
.ai-cc-result-t{font-size:13px;color:var(--ch);line-height:1.6}
.ai-cc-langs{display:flex;gap:6px;margin-top:10px}
.ai-cc-lang{padding:4px 10px;border-radius:100px;font-size:10px;font-weight:600;border:1px solid var(--sd);background:white;cursor:pointer;font-family:inherit}
.ai-cc-lang.on{background:var(--f);color:white;border-color:var(--f)}
.ai-cc-lang.qu{background:var(--gd);color:white;border-color:var(--gd)}

.dsh-ls{margin:0 0 12px 0;padding:16px;background:white;border-radius:14px;border:1px solid rgba(0,0,0,.06);display:flex;gap:14px;width:100%}
.dsh-ls-img{width:80px;height:80px;border-radius:12px;flex-shrink:0}
.dsh-ls-i{flex:1}.dsh-ls-t{font-size:14px;font-weight:700;margin-bottom:4px}.dsh-ls-m{font-size:12px;color:var(--gy);margin-bottom:8px}
.dsh-ls-sts{display:flex;gap:16px}.dsh-ls-st{font-size:12px;display:flex;align-items:center;gap:4px}.dsh-ls-st .v{font-weight:700;color:var(--f)}
.biz-sec{margin:0 0 16px;padding:20px;background:white;border-radius:14px;border:1px solid rgba(0,0,0,.06)}
.biz-sec-t{font-size:15px;font-weight:700;color:var(--f);margin-bottom:16px;display:flex;align-items:center;gap:8px}
.biz-badge{display:inline-flex;align-items:center;gap:4px;padding:4px 12px;border-radius:100px;font-size:11px;font-weight:700}
.biz-badge.ok{background:rgba(45,90,61,.1);color:var(--m)}
.biz-badge.pending{background:rgba(212,168,67,.15);color:#B8860B}
.biz-badge.no{background:rgba(199,97,58,.1);color:var(--tr)}
.biz-note{font-size:12px;color:var(--gy);line-height:1.5;padding:12px;background:var(--cr);border-radius:10px;margin-top:12px}
.biz-radio{display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap}
.biz-radio label{display:flex;align-items:center;gap:6px;padding:10px 16px;border-radius:10px;border:2px solid var(--sd);cursor:pointer;font-size:13px;font-weight:600;transition:.2s}
.biz-radio label.on{border-color:var(--f);background:rgba(45,90,61,.04)}
.biz-doc{display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid rgba(0,0,0,.04)}
.biz-doc:last-child{border-bottom:none}
.biz-doc-name{font-size:13px;font-weight:600;color:var(--ch)}
.biz-doc-r{display:flex;align-items:center;gap:8px}
.biz-doc-btn{padding:6px 12px;border-radius:8px;border:1.5px solid var(--sd);background:white;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;color:var(--gy);transition:.2s}
.biz-doc-btn:hover{border-color:var(--m);color:var(--f)}
.biz-saved{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:var(--m);margin-top:8px}

.earn-tot{margin:0 0 12px;padding:20px;background:var(--f);color:white;border-radius:14px;display:flex;justify-content:space-between;align-items:center;width:100%;box-sizing:border-box}
.earn-chart{margin:0 0 20px;padding:20px;background:white;border-radius:14px;border:1px solid rgba(0,0,0,.06);width:100%;box-sizing:border-box}
.earn-bars{display:flex;align-items:flex-end;gap:12px;height:140px;margin-top:16px}
.earn-bg{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px}
.earn-bc{width:100%;display:flex;gap:3px;align-items:flex-end;height:120px}
.earn-b{flex:1;border-radius:4px 4px 0 0;transition:height .5s;min-height:2px}
.earn-bl{font-size:10px;font-weight:600;color:var(--gy)}
.earn-leg{display:flex;gap:16px;margin-top:16px;padding-top:12px;border-top:1px solid var(--sd)}
.earn-li{display:flex;align-items:center;gap:6px;font-size:11px;color:var(--gy)}.earn-dt{width:8px;height:8px;border-radius:3px}
.earn-rows{margin:0;display:flex;flex-direction:column;gap:8px;width:100%}
.earn-row{display:flex;justify-content:space-between;align-items:center;padding:14px 16px;background:white;border-radius:14px;border:1px solid rgba(0,0,0,.04);width:100%;box-sizing:border-box}

/* ══ DESKTOP NAV LINKS (hidden on mobile) ═══════════ */
.tn-links{display:none;gap:2px;align-items:center}
.tn-link{padding:8px 16px;border-radius:10px;font-size:14px;font-weight:600;color:var(--gy);background:none;border:none;cursor:pointer;font-family:inherit;transition:.2s;position:relative}
.tn-link::after{content:'';position:absolute;bottom:2px;left:16px;right:16px;height:2px;background:var(--f);border-radius:1px;transform:scaleX(0);transition:transform .15s}
.tn-link:hover{color:var(--f)}
.tn-link.on{color:var(--f)}
.tn-link.on::after{transform:scaleX(1)}
.tn-profile{display:none}

/* ══ SITE FOOTER (hidden on mobile) ═════════════════ */
.site-footer{display:none;background:var(--f);color:rgba(255,255,255,.85);padding:56px 0 0;margin-top:0}
.site-footer-inner{max-width:1080px;margin:0 auto;padding:0 40px}
.site-footer-cols{display:grid;grid-template-columns:1.4fr 1fr 1fr 1fr;gap:40px;padding-bottom:40px}
.site-footer-brand .logo{font-size:24px;color:white;margin-bottom:10px;display:block}
.site-footer-brand .logo span{color:var(--trl)}
.site-footer-tagline{font-size:13px;color:rgba(255,255,255,.55);line-height:1.7;max-width:240px}
.site-footer-col-t{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,.7);margin-bottom:16px}
.site-footer-col a,.site-footer-col button{display:block;font-size:13px;color:rgba(255,255,255,.7);text-decoration:none;margin-bottom:10px;cursor:pointer;transition:.15s;background:none;border:none;font-family:inherit;padding:0;text-align:left}
.site-footer-col a:hover,.site-footer-col button:hover{color:white}
.site-footer-copy{font-size:12px;color:rgba(255,255,255,.55);padding:24px 0;border-top:1px solid rgba(255,255,255,.15);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px}
.site-footer-copy-links{display:flex;gap:20px}
.site-footer-copy-links button{font-size:12px;color:rgba(255,255,255,.55);background:none;border:none;cursor:pointer;font-family:inherit;padding:0;transition:.15s}
.site-footer-copy-links button:hover{color:rgba(255,255,255,.6)}

/* ═══ TABLET ≥640px ═════════════════════════════════ */
@media(min-width:640px){
  .login{max-width:520px;margin:0 auto;border-radius:0;overflow:hidden}
  .welcome{max-width:480px;margin:0 auto}

  .hero{height:300px;margin:0;border-radius:0}
  .hero-t{font-size:36px;max-width:500px}
  .hero-c{padding:32px 32px}

  .tn-inner{padding:12px 32px}

  .pg{padding:0 32px}
  .ai-sb{max-width:680px;margin:0 auto 16px}
  .cats{justify-content:center;flex-wrap:wrap;overflow:visible;padding:0 0 20px;gap:10px}

  .tscr{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;
        padding:0 0 32px;overflow:visible}
  .tc{flex:none}

  .sh{padding:0;margin-bottom:20px}
  .tg{gap:16px;padding:0 0 40px}
  .gc{display:flex;flex-direction:column;height:100%}
  .gc-b{flex:1}
  .gc-img{height:160px}

  .ai-result{max-width:680px;margin:0 auto 16px}
  .bkf{max-width:580px;margin:0 auto;padding:24px 32px 100px}
  .suc{max-width:520px;margin:0 auto}
  .npage{padding:24px 32px 60px}
  .tp-page{padding:24px 32px 60px}
  .pf-page{padding:0 32px 60px}
}

/* ═══ HIDE BOTTOM NAV ≥768px ════════════════════════ */
@media(min-width:768px){
  .bn{display:none !important}
  .tn-links{display:flex}
  .tn-profile{display:flex}
  .tn-inner{padding:12px 40px}
  .bb{left:0;right:0;transform:none;max-width:none;width:auto}
}

/* ═══ DESKTOP ≥1024px ═══════════════════════════════ */
@media(min-width:1024px){
  .login{max-width:none;flex-direction:row;margin:0}
  .login-hero{flex:0 0 50%;max-width:640px;border-radius:0}
  .login-body{flex:1;padding:60px 48px;justify-content:center;max-width:520px;margin:0 auto}
  .welcome{max-width:520px}
  .welcome-features{max-width:400px}

  .tn{height:64px;background:rgba(255,255,255,.98);
      backdrop-filter:blur(20px);margin-left:calc(-50vw + 50%);margin-right:calc(-50vw + 50%);padding-left:calc(50vw - 50%);padding-right:calc(50vw - 50%)}
  .tn-inner{padding:0 48px;max-width:1200px;margin:0 auto;height:100%}
  .tn .logo{font-size:26px}

  .pg{max-width:1080px;margin:0 auto;padding:0 40px}

  .hero{height:400px}
  .hero-c{padding:60px 48px;justify-content:center;align-items:center;
          text-align:center;gap:20px;flex-direction:column}
  .hero-tag{margin:0 auto}
  .hero-t{font-size:48px;max-width:700px;text-align:center}
  .hero-sub{text-align:center;font-size:16px}

  .home-pg{margin-top:-40px;position:relative;z-index:10}
  .home-pg .ai-sb{margin-bottom:40px;background:white;border-radius:50px;
                  box-shadow:0 8px 48px rgba(0,0,0,.16);padding:0}
  .home-pg .ai-sb input{border:none;border-radius:50px;padding:18px 56px;
                         font-size:15px;height:60px}
  .home-pg .ai-sb input:focus{border:none;box-shadow:none}
  .home-pg .ai-sb .ai-sb-ic{left:22px;font-size:18px}
  .home-pg .ai-sb .ai-sb-tag{right:22px}

  .cats{padding:0 0 28px}

  .tscr{grid-template-columns:repeat(4,1fr);gap:20px;padding:0 0 40px}

  .sh{margin-bottom:24px}
  .st{font-size:26px}

  .tg{grid-template-columns:repeat(3,1fr);gap:24px;padding:0 0 48px}
  .gc:hover{transform:translateY(-5px);box-shadow:0 16px 40px rgba(0,0,0,.1)}
  .gc-img{height:200px}
  .gc-t{font-size:14px}

  .ai-result{max-width:680px;margin:0 auto 20px}

  .det{display:grid;grid-template-columns:1fr 1fr;padding-bottom:0;align-items:start;max-width:1280px;margin:0 auto}
  .det-hero{height:100vh;position:sticky;top:64px}
  .det-c{padding:32px 40px 100px;max-height:calc(100vh - 64px);overflow-y:auto}

  .bkf{max-width:640px;margin:0 auto;padding:40px 40px 100px}

  .dsh{display:grid;grid-template-columns:220px 1fr;padding-bottom:0;align-items:start;max-width:1280px;margin:0 auto;width:100%}
  .dsh-h{grid-column:1/-1;grid-row:1}
  .dsh-tabs{grid-column:1;grid-row:2;flex-direction:column;border-bottom:none;
            border-right:2px solid var(--sd);padding:16px 0;margin-bottom:0;
            overflow-x:visible;overflow-y:auto;align-items:stretch;
            position:sticky;top:64px;max-height:calc(100vh - 64px);gap:0}
  .dsh-tab{text-align:left;border-bottom:none;border-left:3px solid transparent;
           margin-bottom:0;padding:13px 20px;width:100%;font-size:13px;transition:background .15s}
  .dsh-tab:hover{background:rgba(27,58,45,.04)}
  .dsh-tab.on{color:var(--f);border-left-color:var(--f);border-bottom-color:transparent;background:rgba(27,58,45,.05)}
  .dsh>.fu:not(.dsh-h){grid-column:2;grid-row:2;padding:20px}
  .biz-sec{margin:0 0 16px 0}

  .npage{padding:32px 40px 48px;max-width:1080px;margin:0 auto}
  .tp-page{padding:32px 40px 48px;max-width:960px;margin:0 auto}
  .pf-page{max-width:680px;margin:0 auto;padding:32px 0 48px}
  .pf-logout{margin-left:auto;margin-right:auto;display:block}

  .site-footer{display:block}
}

/* ═══ WIDE DESKTOP ≥1200px ═══════════════════════════ */
@media(min-width:1200px){
  .tg{grid-template-columns:repeat(4,1fr)}
}
`;

// ── Reusable Components ───────────────────────────────

function TopNav({ onHome, onDash, onNotif, view, unread, isOperator, navActive, onNavClick }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", h, { passive: true });
    h();
    return () => window.removeEventListener("scroll", h);
  }, []);
  return (
    <div className={`tn${scrolled ? " scrolled" : ""}`}>
      <div className="tn-inner">
        <div className="logo" onClick={onHome}>finde<span>.</span></div>
        <div className="tn-links">
          {[{id:"explore",l:"Explorar"},{id:"search",l:"Buscar"},{id:"trips",l:"Mis Viajes"}].map(i => (
            <button key={i.id} className={`tn-link ${navActive===i.id?"on":""}`} onClick={() => onNavClick(i.id)}>{i.l}</button>
          ))}
        </div>
        <div className="tn-r">
          <button className={`tn-btn ${view === "dashboard" ? "on" : ""}`} onClick={onDash} aria-label={view === "dashboard" || view === "new-tour" ? "Inicio" : "Dashboard"} type="button" style={{ visibility: isOperator ? 'visible' : 'hidden' }}>{view === "dashboard" || view === "new-tour" ? <Home size={18} strokeWidth={1.5} /> : <BarChart3 size={18} strokeWidth={1.5} />}</button>
          <button className="tn-btn" onClick={onNotif} aria-label={unread > 0 ? `Notificaciones, ${unread} sin leer` : "Notificaciones"} type="button">{unread > 0 && <span className="ndot" />}<Bell size={18} strokeWidth={1.5} /></button>
          <button className="tn-btn tn-profile" onClick={() => onNavClick("profile")} aria-label="Perfil" type="button"><User size={18} strokeWidth={1.5} /></button>
        </div>
      </div>
    </div>
  );
}

function BNav({ active, go }) {
  return (
    <nav className="bn" aria-label="Navegación principal">
      {[{ id: "explore", ic: Compass, l: "Explorar" }, { id: "search", ic: Search, l: "Buscar" }, { id: "trips", ic: Ticket, l: "Mis Viajes" }, { id: "profile", ic: User, l: "Perfil" }].map((i) => (
        <button key={i.id} className={`bn-i ${active === i.id ? "on" : ""}`} onClick={() => go(i.id)} aria-label={i.l} aria-current={active === i.id ? "page" : undefined} type="button">
          <span className="ni" aria-hidden="true"><i.ic size={20} strokeWidth={1.5} /></span>{i.l}<span className="nd" aria-hidden="true" />
        </button>
      ))}
    </nav>
  );
}

function Footer({ go }) {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-cols">
          <div className="site-footer-brand">
            <div className="logo" onClick={() => go("home")}>finde<span>.</span></div>
            <div className="site-footer-tagline">Descubre experiencias auténticas en todo el Perú. +8,000 tours verificados en 52 destinos.</div>
          </div>
          <div className="site-footer-col">
            <div className="site-footer-col-t">Explorar</div>
            <button onClick={() => go("home")}>Inicio</button>
            <button onClick={() => go("catalog")}>Buscar tours</button>
            <button onClick={() => go("trips")}>Mis viajes</button>
            <button onClick={() => go("notifications")}>Notificaciones</button>
          </div>
          <div className="site-footer-col">
            <div className="site-footer-col-t">Empresa</div>
            <button>Sobre Finde</button>
            <button>Operadores</button>
            <button>Blog</button>
            <button>Contacto</button>
          </div>
          <div className="site-footer-col">
            <div className="site-footer-col-t">Legal</div>
            <button>Términos de uso</button>
            <button>Privacidad</button>
            <button>Cookies</button>
            <button>Centro de ayuda</button>
          </div>
        </div>
        <div className="site-footer-copy">
          <span>© 2026 Finde. Todos los derechos reservados.</span>
          <div className="site-footer-copy-links">
            <button>Hecho en Perú</button>
          </div>
        </div>
      </div>
    </footer>
  );
}

function TCard({ t, onClick }) {
  return (
    <div className="tc" onClick={onClick}>
      <div className="tc-img" style={imgBg(t.image)}>
        {t.verified && <span className="tc-ver"><Check size={12} strokeWidth={2} /> Verificado</span>}
      </div>
      <div className="tc-b">
        <div className="tc-loc">{t.location}</div>
        <div className="tc-tl">{t.title}</div>
        <div className="tc-m"><span className="rt"><Star size={12} strokeWidth={1.5} fill="currentColor" /> {t.rating}</span><span>({t.reviews})</span><span>·</span><span>{t.duration}</span></div>
        <div className="tc-ft"><div className="tc-pr">S/ {t.price} <span>por persona</span></div><div className="tc-du">{t.duration}</div></div>
      </div>
    </div>
  );
}

function GCard({ t, onClick }) {
  return (
    <div className="gc" onClick={onClick}>
      <div className="gc-img" style={imgBg(t.image)}>
        {t.verified && <span className="gc-ver"><Check size={10} strokeWidth={2.5} /></span>}
      </div>
      <div className="gc-b">
        <div className="gc-loc">{t.location}</div>
        <div className="gc-t">{t.title}</div>
        <div className="gc-p">S/ {t.price} <span>/ pers</span></div>
      </div>
    </div>
  );
}

function LoginView({ go, loginMsg }) {
  const [phone, setPhone] = useState("");
  const canContinue = phone.replace(/\s/g, "").length >= 9;
  return (
    <div className="login fu">
      <div className="login-hero">
        <div className="login-hero-tex" />
        <div className="login-hero-logo">finde<span>.</span></div>
        <div className="login-hero-tagline">El marketplace de tours y experiencias para descubrir el Perú</div>
        <div className="login-hero-stat">
          <div className="login-hero-stat-i"><div className="login-hero-stat-v">8,000+</div><div className="login-hero-stat-l">Experiencias</div></div>
          <div className="login-hero-stat-i"><div className="login-hero-stat-v">52</div><div className="login-hero-stat-l">Destinos</div></div>
          <div className="login-hero-stat-i"><div className="login-hero-stat-v">4.7<Star size={12} strokeWidth={1.5} fill="currentColor" style={{display:"inline",verticalAlign:"middle",marginLeft:2}} /></div><div className="login-hero-stat-l">Promedio</div></div>
        </div>
      </div>
      <div className="login-body">
        {loginMsg && <div className="login-banner">{loginMsg}</div>}
        <div className="login-title">Ingresa con tu celular</div>
        <div className="login-sub">Te enviaremos un código de verificación por SMS o WhatsApp</div>
        <div className="login-phone-row">
          <input className="login-prefix" value="+51" readOnly />
          <input className="login-phone-input" placeholder="987 654 321" value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^0-9\s]/g, ""))}
            type="tel" maxLength={11} />
        </div>
        <button className="login-btn" disabled={!canContinue} onClick={() => go("otp")}>Continuar</button>
        <div className="login-divider">o</div>
        <button className="login-google" onClick={() => go("welcome")}>
          <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Continuar con Google
        </button>
        <button className="login-skip" onClick={() => go("home")}>Explorar sin cuenta</button>
        <div className="login-terms">Al continuar, aceptas los <a href="#">Términos de uso</a> y la <a href="#">Política de privacidad</a> de Finde</div>
      </div>
    </div>
  );
}

function OTPView({ go }) {
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [timer, setTimer] = useState(30);
  const refs = [useRef(), useRef(), useRef(), useRef()];
  useEffect(() => {
    if (timer > 0) { const t = setTimeout(() => setTimer(timer - 1), 1000); return () => clearTimeout(t); }
  }, [timer]);
  const handleOtp = (i, val) => {
    if (val.length > 1) val = val.slice(-1);
    const next = [...otp]; next[i] = val; setOtp(next);
    if (val && i < 3) refs[i + 1].current?.focus();
  };
  const handleKey = (i, e) => { if (e.key === "Backspace" && !otp[i] && i > 0) refs[i - 1].current?.focus(); };
  const filled = otp.every((d) => d !== "");
  return (
    <div className="login fu">
      <div className="login-hero" style={{ flex: "0 0 200px" }}>
        <div className="login-hero-tex" />
        <div className="login-hero-logo" style={{ fontSize: 32 }}>finde<span>.</span></div>
        <div className="login-hero-tagline" style={{ fontSize: 13 }}>Verificación de código</div>
      </div>
      <div className="login-body">
        <div className="login-title">Ingresa el código</div>
        <div className="login-sub">Enviamos un código de 4 dígitos a tu número +51 987 *** 321</div>
        <div className="otp-row">
          {otp.map((d, i) => (
            <input key={i} ref={refs[i]} className="otp-digit" value={d} maxLength={1}
              type="tel" inputMode="numeric" autoComplete="one-time-code"
              aria-label={`Dígito ${i + 1} del código de verificación`}
              onChange={(e) => handleOtp(i, e.target.value)}
              onKeyDown={(e) => handleKey(i, e)} />
          ))}
        </div>
        <div className="otp-resend">
          {timer > 0 ? <span>Reenviar código en {timer}s</span> : <button onClick={() => setTimer(30)}>Reenviar código</button>}
        </div>
        <button className="login-btn" disabled={!filled} onClick={() => go("welcome")}>Verificar</button>
        <button className="login-skip" onClick={() => go("login")}><ArrowLeft size={14} strokeWidth={1.5} style={{verticalAlign:"middle",marginRight:4}} />Cambiar número</button>
      </div>
    </div>
  );
}

function WelcomeView({ go }) {
  return (
    <div className="welcome fu">
      <div className="welcome-check"><Check size={24} strokeWidth={2.5} /></div>
      <div className="welcome-title">¡Bienvenida, Alejandra!</div>
      <div className="welcome-sub">Tu cuenta está lista. Esto es lo que puedes hacer en Finde:</div>
      <div className="welcome-features">
        <div className="welcome-feat"><div className="welcome-feat-ic" style={{ background: "rgba(45,90,61,.1)" }}><Search size={20} strokeWidth={1.5} /></div><div className="welcome-feat-txt">Buscar experiencias con inteligencia artificial</div></div>
        <div className="welcome-feat"><div className="welcome-feat-ic" style={{ background: "rgba(107,42,160,.1)" }}><Heart size={20} strokeWidth={1.5} /></div><div className="welcome-feat-txt">Pagar con Yape, Plin o tarjeta</div></div>
        <div className="welcome-feat"><div className="welcome-feat-ic" style={{ background: "rgba(37,211,102,.1)" }}><MessageCircle size={20} strokeWidth={1.5} /></div><div className="welcome-feat-txt">Recibir confirmaciones por WhatsApp</div></div>
        <div className="welcome-feat"><div className="welcome-feat-ic" style={{ background: "rgba(212,168,67,.1)" }}><Languages size={20} strokeWidth={1.5} /></div><div className="welcome-feat-txt">Tours disponibles en quechua</div></div>
      </div>
      <button className="login-btn" onClick={() => go("home")}>Empezar a explorar</button>
    </div>
  );
}

function HomeView({ go, pick, cat, setCat, tours }) {
  const filt = cat === "all" ? tours : tours.filter((t) => t.category === cat);
  const feat = [...filt].sort((a, b) => b.rating - a.rating || b.reviews - a.reviews).slice(0, 4);
  return (
    <div>
      <div className="hero fu"><div className="hero-tex" /><div className="hero-c">
        <div><div className="hero-tag"><Sparkles size={12} strokeWidth={1.5} style={{display:"inline",verticalAlign:"middle",marginRight:4}} />FERIADO LARGO · 1-4 MAYO</div></div>
        <div><div className="hero-t">Descubre el Perú que no conoces</div><div className="hero-sub">+8,000 experiencias verificadas en 52 destinos</div></div>
      </div></div>
      <div className="home-pg pg">
        <div className="ai-sb fd1">
          <span className="ai-sb-ic"><Search size={16} strokeWidth={1.5} /></span>
          <input placeholder="¿A dónde quieres ir?" readOnly onFocus={() => go("catalog")} />
          <span className="ai-sb-tag"><Sparkles size={12} strokeWidth={1.5} /> IA</span>
        </div>
        <div className="cats fd2">{CATS.map((c) => <button key={c.id} className={`chip ${cat === c.id ? "on" : ""}`} onClick={() => setCat(c.id)}><c.ic size={16} strokeWidth={1.5} /> {c.n}</button>)}</div>
        <div className="sh fd2"><div className="st">Populares este mes</div><button className="sl" onClick={() => go("catalog")}>Ver todos <ArrowRight size={12} strokeWidth={1.5} style={{verticalAlign:"middle"}} /></button></div>
        <div className="tscr fd3">{feat.map((t) => <TCard key={t.id} t={t} onClick={() => { pick(t); go("detail"); }} />)}</div>
        <div className="sh" style={{ marginTop: 8 }}><div className="st">Explora experiencias</div></div>
        <div className="tg">{filt.map((t) => <GCard key={t.id} t={t} onClick={() => { pick(t); go("detail"); }} />)}</div>
      </div>
    </div>
  );
}

function CatalogView({ go, pick, cat, setCat, tours }) {
  const [q, setQ] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [localResults, setLocalResults] = useState([]);
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [geminiIds, setGeminiIds] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const geminiTimer = useRef(null);
  const fullSearch = q.length >= 2 ? searchTours(tours, q, cat) : null;
  const filt = aiResult
    ? tours.filter(t => aiResult.results.includes(t.id))
    : geminiIds
      ? geminiIds.map(id => tours.find(t => t.id === id)).filter(Boolean)
      : fullSearch
        ? fullSearch.results
        : cat === "all" ? tours : tours.filter(t => t.category === cat);
  const handleAiSearch = (suggestion) => { setQ(suggestion.query); setShowDropdown(false); setAiResult(suggestion); setGeminiIds(null); };
  const handleChange = (value) => {
    setQ(value);
    setGeminiIds(null);
    setAiResult(null);
    if (geminiTimer.current) clearTimeout(geminiTimer.current);
    if (value.trim().length < 2) { setLocalResults([]); setShowDropdown(false); return; }
    const { results, hasKeywordMatch } = searchTours(tours, value, cat);
    setLocalResults(results.slice(0, 5));
    setShowDropdown(true);
    const wordCount = value.trim().split(/\s+/).length;
    if (wordCount >= 3 && (results.length === 0 || !hasKeywordMatch)) {
      geminiTimer.current = setTimeout(async () => {
        setGeminiLoading(true);
        try {
          const ids = await callGeminiSearch(tours, value);
          if (ids && ids.length > 0) {
            setGeminiIds(ids);
            const geminiTours = ids.map(id => tours.find(t => t.id === id)).filter(Boolean);
            const localNotInGemini = results.filter(t => !ids.includes(t.id));
            setLocalResults([...geminiTours, ...localNotInGemini].slice(0, 5));
          }
        } catch { /* silent fallback */ }
        setGeminiLoading(false);
      }, 800);
    }
  };
  const handleFocus = () => {
    if (q.trim().length === 0) {
      const popular = [...tours].sort((a, b) => b.reviews - a.reviews).slice(0, 3);
      setLocalResults(popular);
    } else if (q.trim().length >= 2) {
      const { results } = searchTours(tours, q, cat);
      setLocalResults(results.slice(0, 5));
    }
    setShowDropdown(true);
  };
  useEffect(() => { return () => { if (geminiTimer.current) clearTimeout(geminiTimer.current); }; }, []);
  const isPopular = q.trim().length < 2;
  const hasResults = localResults.length > 0;
  return (
    <div>
      <div className="pg catalog-pg">
        <div className="ai-sb" style={{ marginTop: 8 }}>
          <span className="ai-sb-ic"><Search size={16} strokeWidth={1.5} /></span>
          <input placeholder="¿Qué quieres hacer? ¿A dónde ir?"
            value={q}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={handleFocus}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)} />
          <span className="ai-sb-tag"><Sparkles size={12} strokeWidth={1.5} /> IA</span>
          {showDropdown && (
            <div className="ai-suggest">
              {isPopular && hasResults && <div className="ai-suggest-h">Búsquedas populares</div>}
              {!isPopular && geminiLoading && <div className="sr-ai-hint"><Sparkles size={12} strokeWidth={1.5} /> Buscando con IA...</div>}
              {hasResults ? localResults.map(t => (
                <div key={t.id} className="sr-item" onMouseDown={(e) => { e.preventDefault(); pick(t); go("detail"); }}>
                  <div className="sr-thumb" style={imgBg(t.image)} />
                  <div className="sr-info"><div className="sr-name">{t.title}</div><div className="sr-loc">{t.location}</div></div>
                  <div className="sr-meta"><div className="sr-price">S/ {t.price}</div><div className="sr-rating">{Array.from({length: Math.round(t.rating)}, (_,i) => <Star key={i} size={10} strokeWidth={1.5} fill="currentColor" />)} {t.rating}</div></div>
                </div>
              )) : !isPopular && !geminiLoading && (
                <>
                  <div className="sr-noresults">No encontramos tours para &ldquo;{q}&rdquo;. Prueba con:</div>
                  <div className="sr-pills">{CATS.filter(c => c.id !== "all").map(c => (
                    <button key={c.id} className="chip" onMouseDown={(e) => { e.preventDefault(); setCat(c.id); setQ(""); setGeminiIds(null); setAiResult(null); setShowDropdown(false); }}><c.ic size={16} strokeWidth={1.5} /> {c.n}</button>
                  ))}</div>
                </>
              )}
              {!isPopular && hasResults && fullSearch && (
                <div className="sr-viewall" onMouseDown={(e) => { e.preventDefault(); setShowDropdown(false); }}>Ver todos los resultados ({fullSearch.results.length})</div>
              )}
              {isPopular && (
                <>
                  <div className="ai-suggest-h" style={{ marginTop: 4 }}><Sparkles size={14} strokeWidth={1.5} /> Sugerencias inteligentes</div>
                  {AI_SUGGESTIONS.map((s, i) => (
                    <div key={i} className="ai-suggest-i" onMouseDown={(e) => { e.preventDefault(); handleAiSearch(s); }}>
                      <div className="ai-suggest-q">{s.query}</div>
                      <div className="ai-suggest-r">{s.reason}</div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
        {aiResult && (
          <div className="ai-result">
            <div className="ai-result-ic"><Sparkles size={16} strokeWidth={1.5} /></div>
            <div><div className="ai-result-t">Finde encontró {filt.length} experiencias</div><div className="ai-result-b">&ldquo;{aiResult.query}&rdquo; — {aiResult.reason}</div></div>
            <button className="sr-clear" onClick={() => { setAiResult(null); setQ(""); }}><X size={16} strokeWidth={1.5} /></button>
          </div>
        )}
        {geminiIds && !aiResult && (
          <div className="ai-result">
            <div className="ai-result-ic"><Sparkles size={16} strokeWidth={1.5} /></div>
            <div><div className="ai-result-t">IA encontró {filt.length} experiencias</div><div className="ai-result-b">&ldquo;{q}&rdquo;</div></div>
            <button className="sr-clear" onClick={() => { setGeminiIds(null); }}><X size={16} strokeWidth={1.5} /></button>
          </div>
        )}
        <div className="cats">{CATS.map((c) => <button key={c.id} className={`chip ${cat === c.id ? "on" : ""}`} onClick={() => { setCat(c.id); setQ(""); setGeminiIds(null); setAiResult(null); setLocalResults([]); }}><c.ic size={16} strokeWidth={1.5} /> {c.n}</button>)}</div>
        <div style={{ paddingBottom: 12, fontSize: 13, color: "var(--gy)" }}>{filt.length} experiencias verificadas</div>
        <div className="tg">{filt.map((t) => <GCard key={t.id} t={t} onClick={() => { pick(t); go("detail"); }} />)}</div>
      </div>
    </div>
  );
}

function DetailView({ tour, go, pick, onBook, reviews }) {
  const [lang, setLang] = useState("es");
  const [langOpen, setLangOpen] = useState(false);
  const [showAllRevs, setShowAllRevs] = useState(false);
  if (!tour) return null;
  const isQu = lang === "qu";
  const langLabels = { es: "Español", qu: "Quechua", en: "English" };
  const langFlags = { es: "PE", qu: "QU", en: "EN" };
  const tourRevs = reviews[tour.id] || [];
  const visibleRevs = showAllRevs ? tourRevs : tourRevs.slice(0, 3);
  const starCounts = [5, 4, 3, 2, 1].map(s => ({ star: s, count: tourRevs.filter(r => r.rating === s).length }));
  const maxCount = Math.max(...starCounts.map(s => s.count), 1);
  return (
    <div className="det">
      <div className="det-hero" style={imgBg(tour.image)}><div className="det-ov" />
        <button className="bk-btn" onClick={() => go("home")} aria-label="Volver al inicio" type="button"><ArrowLeft size={20} strokeWidth={1.5} /></button>
        <div className="det-nfo">
          <div className="det-tl">{isQu ? tour.titleQu : tour.title}</div>
        </div>
      </div>
      <div className="det-c fu">
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
          <div className="lang-dd">
            <button className="lang-dd-btn" onClick={() => setLangOpen(!langOpen)}>
              {langFlags[lang]} {langLabels[lang]} <span className="arr"><ChevronDown size={14} strokeWidth={1.5} /></span>
            </button>
            {langOpen && (
              <div className="lang-dd-menu">
                {[["es", "PE", "Español"], ["qu", "QU", "Quechua"], ["en", "EN", "English"]].map(([id, flag, label]) => (
                  <div key={id} className={`lang-dd-item ${lang === id ? "on" : ""}`} onClick={() => { setLang(id); setLangOpen(false); }}>
                    <span>{flag}</span> {label}<span className="lang-check">{lang === id ? <Check size={12} strokeWidth={2} /> : ""}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="ai-sum">
          <div className="ai-sum-h"><Sparkles size={14} strokeWidth={1.5} /> Resumen de {tour.reviews} reseñas</div>
          <div className="ai-sum-t">{tour.aiSummary}</div>
        </div>
        <div className="det-mb">
          <div className="det-mi"><span className="mic"><MapPin size={14} strokeWidth={1.5} /></span>{tour.location}</div>
          <div className="det-mi"><span className="mic"><Timer size={14} strokeWidth={1.5} /></span>{tour.duration}</div>
          <div className="det-mi"><span className="mic"><Star size={14} strokeWidth={1.5} fill="currentColor" /></span>{tour.rating} ({tour.reviews})</div>
          <div className="det-mi"><span className="mic"><ArrowUp size={14} strokeWidth={1.5} /></span>{tour.altitude}m</div>
          <div className="det-mi"><span className="mic"><Users size={14} strokeWidth={1.5} /></span>Max {tour.capacity}</div>
          <div className="det-mi"><span className="mic"><Dumbbell size={14} strokeWidth={1.5} /></span>{tour.difficulty}</div>
        </div>
        <p className="det-ds">{isQu ? tour.descQu : tour.desc}</p>
        <div className="det-op">
          <div className="det-op-av">{tour.operator[0]}</div>
          <div><div className="det-op-n">{tour.operator}</div><div className="det-op-d">{tour.verified ? <><ShieldCheck size={14} strokeWidth={1.5} /> Verificado MINCETUR</> : "Operador"}</div></div>
        </div>
        <div className="det-st">{isQu ? "Imapas chaypi kan" : "Incluye"}</div>
        <div className="det-incs">
          {tour.included.map((x, i) => <div key={i} className="det-inc"><div className="det-ic iy"><Check size={14} strokeWidth={2} /></div>{x}</div>)}
          {tour.excluded.map((x, i) => <div key={i} className="det-inc"><div className="det-ic in"><X size={14} strokeWidth={2} /></div>{x}</div>)}
        </div>
        {tourRevs.length > 0 && (
          <div className="rev-sec">
            <div className="rev-hdr">Reseñas de viajeros ({tourRevs.length})</div>
            <div className="rev-summary">
              <div className="rev-big">
                <div className="rev-big-n">{tour.rating}</div>
                <div className="rev-big-stars">{Array.from({length:5},(_,i)=><Star key={i} size={14} strokeWidth={1.5} fill={i < Math.round(tour.rating) ? "currentColor" : "none"} />)}</div>
                <div className="rev-big-cnt">{tour.reviews} reseñas</div>
              </div>
              <div className="rev-bars">
                {starCounts.map(s => (
                  <div key={s.star} className="rev-bar-row">
                    <span>{s.star}</span>
                    <div className="rev-bar"><div className="rev-bar-fill" style={{ width: `${(s.count / maxCount) * 100}%` }} /></div>
                    <span>{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
            {visibleRevs.map(r => (
              <div key={r.id} className="rev-card">
                <div className="rev-top">
                  <div className="rev-av">{r.avatar}</div>
                  <div><div className="rev-author">{r.author}</div><div className="rev-date">{r.date}</div></div>
                </div>
                <div className="rev-stars">{Array.from({length:5},(_,i)=><Star key={i} size={12} strokeWidth={1.5} fill={i < r.rating ? "currentColor" : "none"} />)}</div>
                <div className="rev-text">{r.text}</div>
              </div>
            ))}
            {tourRevs.length > 3 && !showAllRevs && (
              <button className="rev-more" onClick={() => setShowAllRevs(true)}>Ver todas las reseñas ({tourRevs.length})</button>
            )}
          </div>
        )}
      </div>
      <div className="bb"><div className="bb-p">S/ {tour.price}<span>por persona</span></div><button className="bb-bt" onClick={onBook}>Reservar ahora</button></div>
    </div>
  );
}

function BookingView({ tour, go }) {
  const [step, setStep] = useState(1);
  const [guests, setGuests] = useState(2);
  const [date, setDate] = useState("2026-05-01");
  const [name, setName] = useState(USER.name || "");
  const [phone, setPhone] = useState(USER.phone ? USER.phone.replace(/^\+51\s*/, "") : "");
  const [email, setEmail] = useState(USER.email || "");
  const [docId, setDocId] = useState("");
  const [pay, setPay] = useState("yape");
  const [touched, setTouched] = useState(false);
  const [bookingCode] = useState(() => Math.random().toString(36).substring(2, 8).toUpperCase());
  if (!tour) return null;
  const total = tour.price * guests;
  const step2Valid = name.trim() && phone.trim() && email.trim() && docId.trim();
  const payLabels = { yape: "Yape", plin: "Plin", card: "Tarjeta", cash: "PagoEfectivo" };

  if (step === 4) return (
    <div className="suc fu">
      <div className="suc-chk"><Check size={28} strokeWidth={2.5} /></div><div className="suc-t">¡Reserva confirmada!</div>
      <div className="suc-sub">Recibirás la confirmación por WhatsApp en minutos.</div>
      <div className="suc-card">
        <div className="suc-row"><span className="l">Tour</span><span style={{ fontWeight: 700 }}>{tour.title}</span></div>
        <div className="suc-row"><span className="l">Fecha</span><span>{date}</span></div>
        <div className="suc-row"><span className="l">Personas</span><span>{guests}</span></div>
        <div className="suc-row"><span className="l">Total</span><span style={{ fontWeight: 800, color: "var(--f)" }}>S/ {total.toFixed(2)}</span></div>
        <div className="suc-row"><span className="l">Código</span><span style={{ fontWeight: 700 }}>FND-{bookingCode}</span></div>
      </div>
      <button className="suc-wa"><Smartphone size={16} strokeWidth={1.5} /> Ver en WhatsApp</button>
      <button className="mbtn" onClick={() => go("home")} style={{ background: "var(--ch)" }}>Volver al inicio</button>
    </div>
  );

  return (
    <div className="bkf fu">
      <button className="bk-btn" onClick={() => step === 1 ? go("detail") : setStep(step - 1)} style={{ position: "relative", marginBottom: 16 }} aria-label={step === 1 ? "Volver al tour" : "Paso anterior"} type="button"><ArrowLeft size={20} strokeWidth={1.5} /></button>
      <div className="bkf-st"><div className={`bkf-s ${step >= 1 ? "on" : ""}`} /><div className={`bkf-s ${step >= 2 ? "on" : ""}`} /><div className={`bkf-s ${step >= 3 ? "on" : ""}`} /><div className="bkf-s" /></div>

      {step === 1 && <div className="fu">
        <div className="bkf-t">Elige fecha y viajeros</div><div className="bkf-sub">{tour.title}</div>
        <div className="fg"><label className="lbl">Fecha</label><input type="date" className="inp" value={date} min={new Date().toISOString().split("T")[0]} onChange={(e) => setDate(e.target.value)} aria-label="Fecha del tour" /></div>
        <div className="fg"><label className="lbl">Personas</label><div className="gctr" role="group" aria-label="Cantidad de personas"><button type="button" className="gbtn" onClick={() => setGuests(Math.max(1, guests - 1))} disabled={guests <= 1} aria-label="Disminuir número de personas">−</button><div className="gcnt" aria-live="polite">{guests}</div><button type="button" className="gbtn" onClick={() => setGuests(Math.min(tour.capacity, guests + 1))} disabled={guests >= tour.capacity} aria-label="Aumentar número de personas">+</button></div></div>
        <div className="sum"><div className="sum-r"><span>S/ {tour.price} × {guests}</span><span>S/ {total.toFixed(2)}</span></div><div className="sum-t"><span>Total</span><span>S/ {total.toFixed(2)}</span></div></div>
        <button className="mbtn" onClick={() => setStep(2)}>Continuar</button>
      </div>}

      {step === 2 && <div className="fu">
        <div className="bkf-t">Datos del viajero</div><div className="bkf-sub">{tour.title}</div>
        <div className="fg">
          <label className="lbl">Nombre completo</label>
          <input className={`inp${touched && !name.trim() ? " inp-err" : ""}`} placeholder="Tu nombre completo" value={name} onChange={(e) => setName(e.target.value)} />
          {touched && !name.trim() && <div className="field-err">Campo obligatorio</div>}
        </div>
        <div className="fg">
          <label className="lbl">Teléfono</label>
          <input className={`inp${touched && !phone.trim() ? " inp-err" : ""}`} placeholder="987 654 321" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^0-9\s]/g, ""))} type="tel" maxLength={11} />
          {touched && !phone.trim() && <div className="field-err">Campo obligatorio</div>}
        </div>
        <div className="fg">
          <label className="lbl">Email</label>
          <input className={`inp${touched && !email.trim() ? " inp-err" : ""}`} placeholder="tu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
          {touched && !email.trim() && <div className="field-err">Campo obligatorio</div>}
        </div>
        <div className="fg">
          <label className="lbl">DNI, Pasaporte o CE</label>
          <input className={`inp${touched && !docId.trim() ? " inp-err" : ""}`} placeholder="DNI, pasaporte o carnet de extranjería" value={docId} onChange={(e) => setDocId(e.target.value)} maxLength={20} />
          {touched && !docId.trim() && <div className="field-err">Campo obligatorio</div>}
        </div>
        <button className="mbtn" onClick={() => { if (!step2Valid) { setTouched(true); return; } setStep(3); }}>Continuar al pago</button>
      </div>}

      {step === 3 && <div className="fu">
        <div className="bkf-t">Método de pago</div><div className="bkf-sub">Revisa tu reserva y elige cómo pagar</div>
        <div className="sum" style={{ marginBottom: 24 }}>
          <div className="bk-sum-tour">{tour.title}</div>
          <div className="bk-sum-meta"><Calendar size={14} strokeWidth={1.5} /> {date} · <Users size={14} strokeWidth={1.5} /> {guests} persona{guests > 1 ? "s" : ""}</div>
          <div className="sum-r"><span>S/ {tour.price} × {guests}</span><span>S/ {total.toFixed(2)}</span></div>
          <div className="sum-t"><span>Total</span><span>S/ {total.toFixed(2)}</span></div>
        </div>
        <label className="lbl" style={{ marginBottom: 12 }}>Método de pago</label>
        <div className="pms">
          {[{ id: "yape", n: "Yape", c: "var(--yp)", tg: "Popular" }, { id: "plin", n: "Plin", c: "var(--pl)" }, { id: "card", n: "Tarjeta", c: "var(--ch)", ic: CreditCard }, { id: "cash", n: "PagoEfectivo", c: "#FF6B00", ic: Banknote }].map((m) => (
            <div key={m.id} className={`pm ${pay === m.id ? "sel" : ""}`} onClick={() => setPay(m.id)}>
              <div className="pm-rd" /><div className="pm-ic" style={{ background: m.c }}>{m.ic ? <m.ic size={16} strokeWidth={1.5} /> : m.n[0]}</div><div className="pm-n">{m.n}</div>{m.tg && <div className="pm-tg">{m.tg}</div>}
            </div>
          ))}
        </div>
        <button className={`mbtn ${pay === "yape" ? "yp" : ""}`} onClick={() => setStep(4)}>
          {pay === "cash" ? "Generar código PagoEfectivo" : `Pagar S/ ${total.toFixed(2)} con ${payLabels[pay]}`}
        </button>
      </div>}
    </div>
  );
}

function NotifsView({ notifs, setNotifs }) {
  return (
    <div className="npage fu">
      <div className="npage-h"><h2>Notificaciones</h2><button onClick={() => setNotifs(notifs.map((n) => ({ ...n, read: true })))}>Marcar leído</button></div>
      {notifs.map((n) => (
        <div key={n.id} className={`ni-item ${!n.read ? "unread" : ""}`} onClick={() => setNotifs(notifs.map((x) => x.id === n.id ? { ...x, read: true } : x))}>
          <div className={`ni-ic ${n.type}`}>{(() => { const Ic = n.icon; return <Ic size={18} strokeWidth={1.5} color="#2D5A3D" />; })()}</div>
          <div className="ni-body"><div className="ni-title">{n.title}</div><div className="ni-text">{n.body}</div><div className="ni-time">{n.time}</div></div>
          {!n.read && <div className="ni-dot" />}
        </div>
      ))}
    </div>
  );
}

function TripsView({ go, pick, onReview, trips, tours }) {
  const [f, setF] = useState("all");
  const [reviewTrip, setReviewTrip] = useState(null);
  const [rvRating, setRvRating] = useState(0);
  const [rvText, setRvText] = useState("");
  const list = f === "all" ? trips : trips.filter((t) => t.status === f);
  const submitReview = () => {
    if (!reviewTrip || rvRating === 0) return;
    onReview(reviewTrip.id, reviewTrip.tour.id, rvRating, rvText);
    setReviewTrip(null);
    setRvRating(0);
    setRvText("");
  };
  return (
    <div className="tp-page fu">
      <div className="tp-h"><h2>Mis Viajes</h2><p>{trips.length} experiencias</p></div>
      <div className="tp-tabs">{[{ id: "all", l: "Todos" }, { id: "upcoming", l: "Próximos" }, { id: "completed", l: "Completados" }].map((x) => <button key={x.id} className={`tp-tab ${f === x.id ? "on" : ""}`} onClick={() => setF(x.id)}>{x.l}</button>)}</div>
      {list.map((trip) => (
        <div key={trip.id}>
          <div className="tp-card" onClick={() => { pick(tours.find(x => x.id === trip.tour.id) || trip.tour); go("detail"); }}>
            <div className="tp-img" style={imgBg(trip.tour.image)} />
            <div className="tp-info"><div className="tp-name">{trip.tour.title}</div><div className="tp-det">{trip.date} · {trip.guests} pers</div><div className="tp-code">{trip.code}</div>
              <div className="tp-foot"><div className="tp-price">S/ {trip.total}</div><div className={`tp-st tp-${trip.status}`}>{trip.status === "upcoming" ? "Próximo" : "Completado"}</div></div>
            </div>
          </div>
          {trip.status === "completed" && !trip.reviewed && reviewTrip?.id !== trip.id && (
            <div className="tp-rv" onClick={() => { setReviewTrip(trip); setRvRating(0); setRvText(""); }}><Star size={14} strokeWidth={1.5} /> Deja tu reseña</div>
          )}
          {reviewTrip?.id === trip.id && (
            <div className="rv-form">
              <div className="rv-form-t">Tu reseña de {trip.tour.title}</div>
              <div className="rv-stars">
                {[1, 2, 3, 4, 5].map(s => (
                  <button key={s} className={`rv-star ${s <= rvRating ? "on" : ""}`} onClick={() => setRvRating(s)}><Star size={22} strokeWidth={1.5} fill={s <= rvRating ? "currentColor" : "none"} /></button>
                ))}
              </div>
              <textarea className="rv-textarea" placeholder="Comparte tu experiencia con otros viajeros..." value={rvText} onChange={(e) => setRvText(e.target.value)} />
              <div className="rv-actions">
                <button className="rv-cancel" onClick={() => setReviewTrip(null)}>Cancelar</button>
                <button className="rv-submit" disabled={rvRating === 0} onClick={submitReview}>Publicar reseña</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ProfileView({ go, isOperator, setIsOperator }) {
  return (
    <div className="pf-page fu">
      <div className="pf-hdr">
        <div className="pf-av">{USER.avatar}</div><div className="pf-name">{USER.name}</div><div className="pf-since">Viajera desde {USER.joinDate}</div>
        <div className="pf-stats"><div className="pf-stat"><div className="pf-stat-v">{USER.trips}</div><div className="pf-stat-l">Viajes</div></div><div className="pf-stat"><div className="pf-stat-v">{USER.reviews}</div><div className="pf-stat-l">Reseñas</div></div></div>
      </div>
      {!isOperator ? (
        <div className="pf-op-card" onClick={() => setIsOperator(true)}>
          <div className="pf-op-left">
            <div className="pf-op-ic">
              <MountainSnow size={20} strokeWidth={1.5} color="white" />
            </div>
            <div>
              <div className="pf-op-title">¿Ofreces tours?</div>
              <div className="pf-op-desc">Activa tu perfil de operador</div>
            </div>
          </div>
          <ChevronRight size={16} strokeWidth={1.5} style={{ color: "var(--lg)" }} />
        </div>
      ) : (
        <div className="pf-op-card" onClick={() => go("dashboard")}>
          <div className="pf-op-left">
            <div className="pf-op-ic">
              <MountainSnow size={20} strokeWidth={1.5} color="white" />
            </div>
            <div>
              <div className="pf-op-title">Panel de operador</div>
              <div className="pf-op-desc">Gestiona reservas e ingresos</div>
            </div>
          </div>
          <ChevronRight size={16} strokeWidth={1.5} style={{ color: "var(--lg)" }} />
        </div>
      )}
      <div className="pf-sec"><div className="pf-sec-t">Datos personales</div>
        {[["Nombre", USER.name], ["Teléfono", USER.phone], ["Email", USER.email], ["Ciudad", USER.city]].map(([l, v]) => (
          <div key={l} className="pf-field"><div><div className="pf-field-l">{l}</div><div className="pf-field-v">{v}</div></div><ChevronRight size={16} strokeWidth={1.5} style={{ color: "var(--lg)" }} /></div>
        ))}
      </div>
      {[
        { ic: Languages, bg: "rgba(212,168,67,.1)", t: "Idioma", d: "Español · Runasimi disponible" },
        { ic: HelpCircle, bg: "rgba(107,143,113,.1)", t: "Ayuda", d: "FAQ, WhatsApp" },
      ].map((i, idx) => (
        <div key={idx} className="pf-mi"><div className="pf-mi-ic" style={{ background: i.bg }}><i.ic size={18} strokeWidth={1.5} color="#2D5A3D" /></div><div className="pf-mi-txt"><div className="pf-mi-t">{i.t}</div><div className="pf-mi-d">{i.d}</div></div><ChevronRight size={16} strokeWidth={1.5} style={{ color: "var(--lg)" }} /></div>
      ))}
      <button className="pf-logout" onClick={() => go("login")}>Cerrar sesión</button>
      <div className="pf-ver">finde. AI v3.0 · Hecho en Perú</div>
    </div>
  );
}

function DashView({ go, opTours, setOpTours, onEditTour, initialTab = "bookings", onTabConsumed }) {
  const [tab, setTab] = useState(initialTab);
  useEffect(() => { if (onTabConsumed) onTabConsumed(); }, []);
  const [bookings, setBookings] = useState(OP_BK);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [payoutState, setPayoutState] = useState("idle");
  const totR = EARN.reduce((s, w) => s + w.n, 0);
  const maxE = Math.max(...EARN.map((w) => w.g));
  const stC = { confirmed: "var(--f)", pending: "#D4A843", completed: "var(--sg)", cancelled: "var(--tr)" };
  const stL = { confirmed: "Confirmado", pending: "Pendiente", completed: "Completado", cancelled: "Cancelado" };

  const [biz, setBiz] = useState({
    ruc: "20612345678", phone: "943 567 890", email: "contacto@andestrekperu.com",
    mincetur: "VER-2024-00891", mincetDate: "2024-03-15", mincetStatus: "verified",
    payMethod: "yape", payPhone: "943 567 890",
    bank: "BCP", accountType: "Ahorros", accountNum: "19112345678901", cci: "00219112345678901234",
  });
  const [bizSaved, setBizSaved] = useState(false);
  const [paySaved, setPaySaved] = useState(false);
  const updateBiz = (k, v) => { setBiz(prev => ({ ...prev, [k]: v })); setBizSaved(false); };
  const updateStatus = (id, newStatus) => setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
  const toggleTour = (id) => setOpTours(prev => prev.map(t => t.id === id ? { ...t, active: !t.active } : t));



  return (
    <div className="dsh">
      <div className="dsh-h fu">
        <div className="dsh-gr">Panel de operador <Hand size={18} strokeWidth={1.5} style={{display:"inline",verticalAlign:"middle"}} /></div>
        <div className="dsh-nm">Andes Trek Perú</div>
        <div className="dsh-sts">
          <div className="dsh-s"><div className="dsh-s-v">S/{(totR / 1000).toFixed(1)}k</div><div className="dsh-s-l">Neto mes</div></div>
          <div className="dsh-s"><div className="dsh-s-v">{bookings.length}</div><div className="dsh-s-l">Reservas</div></div>
          <div className="dsh-s"><div className="dsh-s-v"><Star size={13} strokeWidth={1.5} fill="currentColor" style={{display:"inline",verticalAlign:"middle"}} /> 4.8</div><div className="dsh-s-l">Rating</div></div>
        </div>
      </div>

      <div className="dsh-tabs fd1">
        {[{ id: "bookings", l: "Reservas" }, { id: "earnings", l: "Ingresos" }, { id: "business", l: "Mi Negocio" }, { id: "listings", l: "Mis Tours" }].map((t) => (
          <button key={t.id} className={`dsh-tab ${tab === t.id ? "on" : ""}`} onClick={() => { setTab(t.id); setSelectedBooking(null); }}>{t.l}</button>
        ))}
      </div>

      {/* ── RESERVAS ── */}
      {tab === "bookings" && !selectedBooking && <div className="fu">
        {bookings.map((b) => (
          <div key={b.id} className="dsh-bk" style={{ flexDirection: "column", alignItems: "stretch", gap: 0, cursor: "pointer" }}
            onClick={() => setSelectedBooking(b)}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div className="dsh-bk-av" style={{ background: stC[b.status] }}>{b.customer.split(" ").map((n) => n[0]).join("")}</div>
              <div className="dsh-bk-i"><div className="dsh-bk-n">{b.customer}</div><div className="dsh-bk-d">{b.date} · {b.guests} pers</div></div>
              <div className="dsh-bk-r"><div className="dsh-bk-a">S/ {b.amount}</div><div className={`dsh-bk-s st-${b.status}`}>{stL[b.status]}</div></div>
            </div>
            {b.status === "pending" && (
              <div style={{ display: "flex", gap: 8, marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--cr)" }}
                onClick={(e) => e.stopPropagation()}>
                <button onClick={() => updateStatus(b.id, "confirmed")} style={{
                  flex: 1, padding: "8px 0", borderRadius: 10, border: "none",
                  background: "var(--f)", color: "white", fontWeight: 700,
                  fontSize: 12, cursor: "pointer", fontFamily: "inherit"
                }}><Check size={12} strokeWidth={2} /> Confirmar</button>
                <button onClick={() => updateStatus(b.id, "cancelled")} style={{
                  flex: 1, padding: "8px 0", borderRadius: 10, border: "2px solid var(--lg)",
                  background: "transparent", color: "var(--gy)", fontWeight: 700,
                  fontSize: 12, cursor: "pointer", fontFamily: "inherit"
                }}><X size={12} strokeWidth={2} /> Rechazar</button>
              </div>
            )}
          </div>
        ))}
      </div>}

      {/* ── DETALLE DE RESERVA ── */}
      {tab === "bookings" && selectedBooking && (() => {
        const b = bookings.find(x => x.id === selectedBooking.id);
        return (
          <div className="fu" style={{ padding: "0 16px 32px" }}>
            <button onClick={() => setSelectedBooking(null)}
              style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", padding: "12px 0", display: "block", color: "var(--ch)" }}><ArrowLeft size={20} strokeWidth={1.5} /></button>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginBottom: 24 }}>
              <div className="dsh-bk-av" style={{ width: 64, height: 64, fontSize: 22, background: stC[b.status] }}>
                {b.customer.split(" ").map(n => n[0]).join("")}
              </div>
              <div style={{ fontWeight: 800, fontSize: 18 }}>{b.customer}</div>
              <div className={`dsh-bk-s st-${b.status}`}>{stL[b.status]}</div>
            </div>
            <div className="sum">
              {[["Código", b.id], ["Tour", b.tour], ["Fecha", b.date], ["Personas", `${b.guests} personas`], ["Pago", b.pay]].map(([l, v]) => (
                <div key={l} className="sum-r"><span style={{ color: "var(--gy)" }}>{l}</span><span style={{ fontWeight: 600 }}>{v}</span></div>
              ))}
              <div className="sum-t"><span>Total</span><span>S/ {b.amount}</span></div>
            </div>
            {b.note && (
              <div style={{ padding: 14, background: "rgba(212,168,67,.1)", borderRadius: 12, marginBottom: 16, borderLeft: "3px solid var(--gd)" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--gd)", marginBottom: 4 }}><MessageCircle size={12} strokeWidth={1.5} style={{display:"inline",verticalAlign:"middle",marginRight:4}} />Nota del cliente</div>
                <div style={{ fontSize: 13, color: "var(--ch)", lineHeight: 1.5 }}>{b.note}</div>
              </div>
            )}
            <a href={`https://wa.me/${b.phone.replace(/\s/g,"")}`}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "13px 0", borderRadius: 14, background: "#25D366", color: "white",
                fontWeight: 700, fontSize: 14, textDecoration: "none", marginBottom: 10 }}>
              <Smartphone size={16} strokeWidth={1.5} /> Contactar por WhatsApp
            </a>
            {b.status === "pending" && (
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button onClick={() => { updateStatus(b.id, "confirmed"); setSelectedBooking(null); }} style={{
                  flex: 1, padding: "13px 0", borderRadius: 14, border: "none",
                  background: "var(--f)", color: "white", fontWeight: 700,
                  fontSize: 14, cursor: "pointer", fontFamily: "inherit"
                }}><Check size={14} strokeWidth={2} /> Confirmar</button>
                <button onClick={() => { updateStatus(b.id, "cancelled"); setSelectedBooking(null); }} style={{
                  flex: 1, padding: "13px 0", borderRadius: 14, border: "2px solid var(--lg)",
                  background: "transparent", color: "var(--gy)", fontWeight: 700,
                  fontSize: 14, cursor: "pointer", fontFamily: "inherit"
                }}><X size={14} strokeWidth={2} /> Rechazar</button>
              </div>
            )}
          </div>
        );
      })()}


      {/* ── INGRESOS ── */}
      {tab === "earnings" && <div className="fu">
        <div className="earn-tot">
          <div>
            <div style={{ fontSize: 13, opacity: .8 }}>Ingreso neto</div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>S/ {totR.toLocaleString()}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, opacity: .6 }}>Abril 2026</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,.8)", marginTop: 4 }}>↑ 24%</div>
          </div>
        </div>

        {/* Saldo disponible + solicitar pago */}
        <div style={{ margin: "0 0 16px 0", padding: 16, background: "var(--cr)", borderRadius: 16, border: "1px solid var(--lg)" }}>
          <div style={{ fontSize: 12, color: "var(--gy)", marginBottom: 4 }}>Saldo disponible para retiro</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "var(--f)", marginBottom: 14 }}>
            S/ {payoutState === "success" ? "0.00" : totR.toLocaleString()}
          </div>
          {payoutState === "idle" && (
            <button onClick={() => setPayoutState("confirm")} style={{
              width: "100%", padding: "13px 0", borderRadius: 12, border: "none",
              background: "var(--f)", color: "white", fontWeight: 700,
              fontSize: 14, cursor: "pointer", fontFamily: "inherit"
            }}><CircleDollarSign size={16} strokeWidth={1.5} /> Solicitar pago</button>
          )}
          {payoutState === "confirm" && (
            <div>
              <div style={{ fontSize: 13, color: "var(--ch)", marginBottom: 12, lineHeight: 1.5 }}>
                Se transferirá <strong>S/ {totR.toLocaleString()}</strong> a tu cuenta Yape registrada <strong>+51 987 654 321</strong> en 1-2 días hábiles.
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setPayoutState("success")} style={{
                  flex: 1, padding: "11px 0", borderRadius: 12, border: "none",
                  background: "var(--f)", color: "white", fontWeight: 700,
                  fontSize: 13, cursor: "pointer", fontFamily: "inherit"
                }}><Check size={14} strokeWidth={2} /> Confirmar</button>
                <button onClick={() => setPayoutState("idle")} style={{
                  flex: 1, padding: "11px 0", borderRadius: 12, border: "2px solid var(--lg)",
                  background: "transparent", color: "var(--gy)", fontWeight: 700,
                  fontSize: 13, cursor: "pointer", fontFamily: "inherit"
                }}>Cancelar</button>
              </div>
            </div>
          )}
          {payoutState === "success" && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28, marginBottom: 4 }}><Check size={28} strokeWidth={2.5} style={{color:"var(--f)",margin:"0 auto"}} /></div>
              <div style={{ fontWeight: 700, color: "var(--f)", fontSize: 14 }}>¡Pago solicitado!</div>
              <div style={{ fontSize: 12, color: "var(--gy)", marginTop: 4 }}>Recibirás S/ {totR.toLocaleString()} en tu Yape en 1-2 días hábiles.</div>
            </div>
          )}
        </div>

        <div className="earn-chart">
          <div style={{ fontSize: 14, fontWeight: 700 }}>Ingresos semanales</div>
          <div style={{ fontSize: 11, color: "var(--gy)" }}>Comisión Finde: 15%</div>
          <div className="earn-bars">{EARN.map((w, i) => (<div key={i} className="earn-bg"><div className="earn-bc"><div className="earn-b" style={{ height: `${(w.n / maxE) * 100}%`, background: "var(--f)" }} /><div className="earn-b" style={{ height: `${(w.f / maxE) * 100}%`, background: "var(--tr)", opacity: .6 }} /></div><div className="earn-bl">{w.w}</div></div>))}</div>
          <div className="earn-leg"><div className="earn-li"><div className="earn-dt" style={{ background: "var(--f)" }} />Neto</div><div className="earn-li"><div className="earn-dt" style={{ background: "var(--tr)", opacity: .6 }} />Comisión 15%</div></div>
        </div>
        <div className="earn-rows">{EARN.map((w, i) => (<div key={i} className="earn-row"><div><div style={{ fontWeight: 600, fontSize: 13 }}>{w.w}</div><div style={{ fontSize: 13, color: "var(--gy)" }}>Bruto: S/ {w.g.toLocaleString()}</div></div><div style={{ textAlign: "right" }}><div style={{ fontSize: 15, fontWeight: 700, color: "var(--f)" }}>S/ {w.n.toLocaleString()}</div><div style={{ fontSize: 13, color: "var(--gy)" }}>-S/ {w.f.toLocaleString()}</div></div></div>))}</div>
      </div>}

      {/* ── MI NEGOCIO ── */}
      {tab === "business" && <div className="fu">
        {/* Datos del negocio */}
        <div className="biz-sec">
          <div className="biz-sec-t"><Building2 size={16} strokeWidth={1.5} /> Datos del negocio</div>
          <div className="fg"><label className="lbl">RUC</label><input className="inp" value={biz.ruc} onChange={e => updateBiz("ruc", e.target.value)} /></div>
          <div className="fg"><label className="lbl">Teléfono</label><input className="inp" value={biz.phone} onChange={e => updateBiz("phone", e.target.value)} /></div>
          <div className="fg"><label className="lbl">Email de contacto</label><input className="inp" value={biz.email} onChange={e => updateBiz("email", e.target.value)} /></div>
          <button className="mbtn" onClick={() => { setBizSaved(true); setTimeout(() => setBizSaved(false), 3000); }}>Guardar cambios</button>
          {bizSaved && <div className="biz-saved"><Check size={12} strokeWidth={2} /> Cambios guardados</div>}
        </div>

        {/* Verificación MINCETUR */}
        <div className="biz-sec">
          <div className="biz-sec-t"><ShieldCheck size={16} strokeWidth={1.5} /> Verificación MINCETUR</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <span className="biz-badge ok"><Check size={12} strokeWidth={2} /> Verificado</span>
          </div>
          <div className="fg"><label className="lbl">N° de registro</label><input className="inp" value={biz.mincetur} readOnly style={{ opacity: .7 }} /></div>
          <div className="fg"><label className="lbl">Fecha de verificación</label><input className="inp" value={biz.mincetDate} readOnly style={{ opacity: .7 }} /></div>
          <div className="biz-note">Tu negocio está verificado por MINCETUR. Este estado se actualiza automáticamente con el registro nacional de prestadores de servicios turísticos.</div>
        </div>

        {/* Cuenta de pago */}
        <div className="biz-sec">
          <div className="biz-sec-t"><CreditCard size={16} strokeWidth={1.5} /> Cuenta de pago</div>
          <div className="biz-radio">
            <label className={biz.payMethod === "yape" ? "on" : ""} onClick={() => updateBiz("payMethod", "yape")}>
              <input type="radio" name="pay" checked={biz.payMethod === "yape"} readOnly style={{ display: "none" }} />Yape
            </label>
            <label className={biz.payMethod === "plin" ? "on" : ""} onClick={() => updateBiz("payMethod", "plin")}>
              <input type="radio" name="pay" checked={biz.payMethod === "plin"} readOnly style={{ display: "none" }} />Plin
            </label>
            <label className={biz.payMethod === "bank" ? "on" : ""} onClick={() => updateBiz("payMethod", "bank")}>
              <input type="radio" name="pay" checked={biz.payMethod === "bank"} readOnly style={{ display: "none" }} />Cuenta bancaria
            </label>
          </div>
          {(biz.payMethod === "yape" || biz.payMethod === "plin") && (
            <div className="fg"><label className="lbl">Número de celular</label><input className="inp" value={biz.payPhone} onChange={e => updateBiz("payPhone", e.target.value)} /></div>
          )}
          {biz.payMethod === "bank" && (<>
            <div className="fg"><label className="lbl">Banco</label><input className="inp" value={biz.bank} onChange={e => updateBiz("bank", e.target.value)} /></div>
            <div className="fg"><label className="lbl">Tipo de cuenta</label><input className="inp" value={biz.accountType} onChange={e => updateBiz("accountType", e.target.value)} /></div>
            <div className="fg"><label className="lbl">N° de cuenta</label><input className="inp" value={biz.accountNum} onChange={e => updateBiz("accountNum", e.target.value)} /></div>
            <div className="fg"><label className="lbl">CCI</label><input className="inp" value={biz.cci} onChange={e => updateBiz("cci", e.target.value)} /></div>
          </>)}
          <button className="mbtn" onClick={() => { setPaySaved(true); setTimeout(() => setPaySaved(false), 3000); }}>Guardar cuenta</button>
          {paySaved && <div className="biz-saved"><Check size={12} strokeWidth={2} /> Cuenta guardada</div>}
          <div className="biz-note">Los pagos se procesan en 1-2 días hábiles después de cada experiencia completada. La comisión de Finde es del 15%.</div>
        </div>

        {/* Documentos */}
        <div className="biz-sec">
          <div className="biz-sec-t"><FileText size={16} strokeWidth={1.5} /> Documentos</div>
          <div className="biz-doc">
            <div>
              <div className="biz-doc-name">Póliza de seguro</div>
              <span className="biz-badge pending" style={{ marginTop: 4 }}>Opcional</span>
            </div>
            <div className="biz-doc-r">
              <button className="biz-doc-btn">Subir documento</button>
            </div>
          </div>
        </div>
      </div>}

      {/* ── MIS TOURS ── */}
      {tab === "listings" && <div className="fu">
        {opTours.map((t) => (
          <div key={t.id} className="dsh-ls" style={{ flexDirection: "column", gap: 0, padding: 0, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 12 }}>
              <div className="dsh-ls-img" style={{ ...imgBg(t.image), flexShrink: 0 }} />
              <div className="dsh-ls-i" style={{ flex: 1, minWidth: 0 }}>
                <div className="dsh-ls-t" style={{ opacity: t.active ? 1 : 0.45 }}>{t.title}</div>
                <div className="dsh-ls-m">{t.location} · {t.duration}</div>
                <div className="dsh-ls-sts">
                  <div className="dsh-ls-st"><Star size={13} strokeWidth={1.5} fill="currentColor" /> <span className="v">{t.rating}</span></div>
                  <div className="dsh-ls-st"><MessageCircle size={13} strokeWidth={1.5} /> <span className="v">{t.reviews}</span></div>
                  <div className="dsh-ls-st">S/ <span className="v">{t.price}</span></div>
                </div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); toggleTour(t.id); }} style={{
                width: 44, height: 24, borderRadius: 12, flexShrink: 0, border: "none", padding: 0,
                background: t.active ? "var(--f)" : "var(--lg)",
                position: "relative", cursor: "pointer", transition: "background .2s"
              }}>
                <div style={{
                  position: "absolute", top: 3, width: 18, height: 18, borderRadius: "50%",
                  background: "white", transition: "left .2s", pointerEvents: "none",
                  left: t.active ? 23 : 3
                }} />
              </button>
            </div>
            <div style={{ borderTop: "1px solid var(--cr)", display: "flex" }}>
              <button style={{
                flex: 1, padding: "9px 0", background: "none", border: "none",
                fontSize: 12, fontWeight: 600, color: "var(--f)", cursor: "pointer", fontFamily: "inherit"
              }} onClick={() => onEditTour(t)}><Pencil size={13} strokeWidth={1.5} /> Editar</button>
            </div>
          </div>
        ))}
        <div style={{ padding: 16 }}>
          <button className="mbtn" style={{ background: "var(--tr)" }} onClick={() => go("new-tour")}>+ Agregar nuevo tour</button>
        </div>
      </div>}
    </div>
  );
}

// ── NEW TOUR WIZARD ───────────────────────────────────
function NewTourView({ go, editingTour, onSaveTour, onCreateTour, onCancel }) {
  const isEditing = !!editingTour;
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(isEditing ? {
    title: editingTour.title || "",
    location: editingTour.location || "",
    category: editingTour.category || "adventure",
    duration: editingTour.duration || "",
    price: String(editingTour.price || ""),
    capacity: String(editingTour.capacity || ""),
    difficulty: editingTour.difficulty || "Moderada",
    description: editingTour.description || "",
    included: editingTour.included || "",
    excluded: editingTour.excluded || "",
    days: editingTour.days || [],
    startTime: editingTour.startTime || "08:00",
    cancellation: editingTour.cancellation || "24h",
    photo: editingTour.photo || null,
  } : {
    title: "", location: "", category: "adventure", duration: "", price: "",
    capacity: "", difficulty: "Moderada", description: "", included: "", excluded: "",
    days: [], startTime: "08:00", cancellation: "24h", photo: null
  });
  const [aiDesc, setAiDesc] = useState(null);
  const [published, setPublished] = useState(false);
  const u = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const generateAiDesc = () => {
    if (form.title && form.location) {
      setAiDesc(`Vive una experiencia única con ${form.title} en ${form.location}. Nuestros guías certificados te llevarán por rutas poco conocidas en una aventura de ${form.duration || "varias horas"}. ${form.included ? "Incluye: " + form.included + "." : ""} Ideal para grupos de hasta ${form.capacity || "10"} personas. Dificultad: ${form.difficulty}. Reserva con Yape o Plin y recibe confirmación por WhatsApp.`);
    }
  };

  if (published) {
    return (
      <div className="suc fu">
        <div className="suc-chk"><Check size={28} strokeWidth={2.5} /></div>
        <div className="suc-t">{isEditing ? "¡Tour actualizado!" : "¡Tour publicado!"}</div>
        <div className="suc-sub">"{form.title}" {isEditing ? "ha sido actualizado correctamente." : "ya está visible para miles de viajeros en Finde."}</div>
        <div className="suc-card">
          <div className="suc-row"><span className="l">Tour</span><span style={{ fontWeight: 700 }}>{form.title}</span></div>
          <div className="suc-row"><span className="l">Ubicación</span><span>{form.location}</span></div>
          <div className="suc-row"><span className="l">Precio</span><span style={{ fontWeight: 800, color: "var(--f)" }}>S/ {form.price || "0"}</span></div>
          <div className="suc-row"><span className="l">Capacidad</span><span>{form.capacity || "10"} personas</span></div>
        </div>
        <button className="mbtn" onClick={() => isEditing ? onSaveTour({ ...editingTour, ...form, price: Number(form.price) || editingTour.price, image: form.photo ? `url(${form.photo})` : editingTour.image }) : go("dashboard")}>Volver al panel</button>
      </div>
    );
  }

  return (
    <div className="bkf fu">
      <button className="bk-btn" onClick={() => step === 1 ? onCancel() : setStep(step - 1)} style={{ position: "relative", marginBottom: 16 }} aria-label={step === 1 ? "Cancelar" : "Paso anterior"} type="button"><ArrowLeft size={20} strokeWidth={1.5} /></button>
      <div className="bkf-st">
        {[1, 2, 3, 4, 5].map((s) => <div key={s} className={`bkf-s ${step >= s ? "on" : ""}`} />)}
      </div>

      {/* Step 1: Información básica */}
      {step === 1 && <div className="fu">
        <div className="bkf-t">Información básica</div>
        <div className="bkf-sub">Paso 1 de 5 · Nombre, ubicación y categoría</div>
        <div className="fg">
          <label className="lbl">Nombre del tour <span style={{ color: "var(--tr)" }}>*</span></label>
          <input className="inp" placeholder="Ej: Trekking al Nevado Pastoruri" value={form.title} onChange={(e) => u("title", e.target.value)} />
        </div>
        <div className="fg">
          <label className="lbl">Ubicación <span style={{ color: "var(--tr)" }}>*</span></label>
          <input className="inp" placeholder="Ej: Huaraz, Áncash" value={form.location} onChange={(e) => u("location", e.target.value)} />
        </div>
        <div className="fg">
          <label className="lbl">Categoría</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {CATS.filter((c) => c.id !== "all").map((c) => (
              <button key={c.id} className={`chip ${form.category === c.id ? "on" : ""}`}
                style={{ fontSize: 12, padding: "6px 14px" }}
                onClick={() => u("category", c.id)}><c.ic size={16} strokeWidth={1.5} /> {c.n}</button>
            ))}
          </div>
        </div>
        <div className="fg">
          <label className="lbl">Dificultad</label>
          <div style={{ display: "flex", gap: 6 }}>
            {["Fácil", "Moderada", "Alta"].map((d) => (
              <button key={d} className={`chip ${form.difficulty === d ? "on" : ""}`}
                style={{ fontSize: 12, padding: "6px 14px", flex: 1, justifyContent: "center" }}
                onClick={() => u("difficulty", d)}>{d}</button>
            ))}
          </div>
        </div>
        <div className="fg">
          <label className="lbl">Foto principal del tour <span style={{ color: "var(--tr)" }}>*</span></label>
          {!form.photo && isEditing && editingTour.image && (
            <div style={{ borderRadius: 16, overflow: "hidden", height: 100, marginBottom: 8, ...imgBg(editingTour.image), display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,.7)", fontWeight: 600 }}>Imagen actual · Sube una foto para reemplazarla</span>
            </div>
          )}
          {!form.photo ? (
            <label style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: 8, padding: 24, borderRadius: 16, border: "2px dashed var(--lg)",
              cursor: "pointer", background: "var(--cr)"
            }}>
              <Camera size={28} strokeWidth={1.5} style={{ color: "var(--f)" }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--f)" }}>{isEditing ? "Cambiar foto" : "Subir foto"}</span>
              <span style={{ fontSize: 11, color: "var(--gy)", textAlign: "center" }}>Recomendado: 1200×800px · JPG o PNG · máx 5MB</span>
              <input type="file" accept="image/*" style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => setForm(prev => ({ ...prev, photo: ev.target.result }));
                    reader.readAsDataURL(file);
                  }
                }} />
            </label>
          ) : (
            <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", height: 160 }}>
              <img src={form.photo} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              <button onClick={(e) => { e.preventDefault(); u("photo", null); }} style={{
                position: "absolute", top: 8, right: 8, width: 28, height: 28,
                borderRadius: "50%", background: "rgba(0,0,0,.55)", border: "none",
                color: "white", fontSize: 14, cursor: "pointer", fontFamily: "inherit"
              }}><X size={14} strokeWidth={2} /></button>
            </div>
          )}
        </div>
        <button className="mbtn" style={{ marginTop: 8 }}
          disabled={!form.title || !form.location || (!form.photo && !(isEditing && editingTour.image))}
          onClick={() => setStep(2)}>Siguiente</button>
      </div>}

      {/* Step 2: Detalles */}
      {step === 2 && <div className="fu">
        <div className="bkf-t">Detalles del tour</div>
        <div className="bkf-sub">Paso 2 de 5 · Duración, precio y capacidad</div>
        <div className="fg">
          <label className="lbl">Duración</label>
          <input className="inp" placeholder="Ej: 8 horas, Full day, 2 días" value={form.duration} onChange={(e) => u("duration", e.target.value)} />
        </div>
        <div className="fg">
          <label className="lbl">Precio por persona (S/) <span style={{ color: "var(--tr)" }}>*</span></label>
          <input className="inp" placeholder="150" type="number" value={form.price} onChange={(e) => u("price", e.target.value)} />
        </div>
        <div className="fg">
          <label className="lbl">Capacidad máxima</label>
          <input className="inp" placeholder="12" type="number" value={form.capacity} onChange={(e) => u("capacity", e.target.value)} />
        </div>
        <div className="fg">
          <label className="lbl">Qué incluye (separado por comas)</label>
          <input className="inp" placeholder="Transporte, guía, almuerzo, entrada" value={form.included} onChange={(e) => u("included", e.target.value)} />
        </div>
        <div className="fg">
          <label className="lbl">Qué no incluye (separado por comas)</label>
          <input className="inp" placeholder="Propinas, snacks, seguro" value={form.excluded} onChange={(e) => u("excluded", e.target.value)} />
        </div>
        <button className="mbtn" style={{ marginTop: 8 }} disabled={!form.price} onClick={() => setStep(3)}>Siguiente</button>
      </div>}

      {/* Step 3: Disponibilidad */}
      {step === 3 && <div className="fu">
        <div className="bkf-t">Disponibilidad</div>
        <div className="bkf-sub">Paso 3 de 5 · Días, horario y cancelación</div>
        <div className="fg">
          <label className="lbl">Días que operas</label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[["L","lunes"],["M","martes"],["X","miércoles"],["J","jueves"],["V","viernes"],["S","sábado"],["D","domingo"]].map(([short, full]) => {
              const active = form.days.includes(full);
              return (
                <button key={full}
                  onClick={() => u("days", active ? form.days.filter(d => d !== full) : [...form.days, full])}
                  style={{
                    width: 40, height: 40, borderRadius: "50%", border: "2px solid",
                    borderColor: active ? "var(--f)" : "var(--lg)",
                    background: active ? "var(--f)" : "transparent",
                    color: active ? "white" : "var(--gy)",
                    fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit"
                  }}>{short}</button>
              );
            })}
          </div>
          <div style={{ fontSize: 11, color: "var(--gy)", marginTop: 6 }}>
            {form.days.length === 0 ? "Selecciona al menos un día" : `Opera: ${form.days.join(", ")}`}
          </div>
        </div>
        <div className="fg">
          <label className="lbl">Hora de salida</label>
          <input className="inp" type="time" value={form.startTime} onChange={(e) => u("startTime", e.target.value)} />
        </div>
        <div className="fg">
          <label className="lbl">Política de cancelación</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { id: "24h", label: "Cancelación gratuita hasta 24h antes" },
              { id: "48h", label: "Cancelación gratuita hasta 48h antes" },
              { id: "no", label: "Sin cancelación (no reembolsable)" },
            ].map((opt) => (
              <div key={opt.id} onClick={() => u("cancellation", opt.id)} style={{
                padding: "12px 14px", borderRadius: 12, border: "2px solid",
                borderColor: form.cancellation === opt.id ? "var(--f)" : "var(--lg)",
                background: form.cancellation === opt.id ? "rgba(27,58,45,.05)" : "transparent",
                cursor: "pointer", display: "flex", alignItems: "center", gap: 10
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: "50%",
                  background: form.cancellation === opt.id ? "var(--f)" : "var(--lg)",
                  color: "white", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 700, flexShrink: 0
                }}>{form.cancellation === opt.id ? "●" : ""}</div>
                <span style={{ fontSize: 13, color: "var(--ch)" }}>{opt.label}</span>
              </div>
            ))}
          </div>
        </div>
        <button className="mbtn" style={{ marginTop: 8 }} disabled={form.days.length === 0} onClick={() => setStep(4)}>Siguiente</button>
      </div>}

      {/* Step 4: Descripción con IA */}
      {step === 4 && <div className="fu">
        <div className="bkf-t">Descripción</div>
        <div className="bkf-sub">Paso 4 de 5 · Escríbela tú o usa la IA</div>
        <div className="fg">
          <label className="lbl">Descripción del tour <span style={{ color: "var(--tr)" }}>*</span></label>
          <textarea className="ai-cc-input" style={{ minHeight: 100 }} placeholder="Describe tu experiencia con detalle: qué verán los viajeros, qué hace especial este tour, qué pueden esperar..."
            value={form.description} onChange={(e) => u("description", e.target.value)} />
        </div>
        <div style={{ padding: 14, background: "var(--cr)", borderRadius: 12, marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--f)", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}><Sparkles size={12} strokeWidth={1.5} /> Generador IA</div>
          <div style={{ fontSize: 11, color: "var(--gy)", marginBottom: 10 }}>Genera una descripción profesional basada en los datos que ya ingresaste</div>
          <button className="ai-cc-btn" onClick={generateAiDesc}><Sparkles size={12} strokeWidth={1.5} /> Generar descripción</button>
          {aiDesc && (
            <div style={{ marginTop: 12, padding: 12, background: "white", borderRadius: 10, fontSize: 13, lineHeight: 1.6, color: "var(--ch)" }}>
              {aiDesc}
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button style={{ padding: "6px 14px", borderRadius: 8, background: "var(--f)", color: "white", border: "none", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                  onClick={() => u("description", aiDesc)}>Usar esta</button>
                <button style={{ padding: "6px 14px", borderRadius: 8, background: "var(--sd)", color: "var(--ch)", border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                  onClick={generateAiDesc}>Regenerar</button>
              </div>
            </div>
          )}
        </div>
        <button className="mbtn" disabled={!form.description} onClick={() => setStep(5)}>Siguiente</button>
      </div>}

      {/* Step 5: Revisión y publicar */}
      {step === 5 && <div className="fu">
        <div className="bkf-t">{isEditing ? "Revisar y guardar" : "Revisar y publicar"}</div>
        <div className="bkf-sub">Paso 5 de 5 · Verifica que todo esté correcto</div>

        {form.photo && (
          <div style={{ borderRadius: 16, overflow: "hidden", height: 160, marginBottom: 16 }}>
            <img src={form.photo} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        )}

        <div className="sum">
          <div className="sum-r"><span style={{ color: "var(--gy)" }}>Nombre</span><span style={{ fontWeight: 700 }}>{form.title}</span></div>
          <div className="sum-r"><span style={{ color: "var(--gy)" }}>Ubicación</span><span>{form.location}</span></div>
          <div className="sum-r"><span style={{ color: "var(--gy)" }}>Categoría</span><span>{CATS.find((c) => c.id === form.category)?.n}</span></div>
          <div className="sum-r"><span style={{ color: "var(--gy)" }}>Dificultad</span><span>{form.difficulty}</span></div>
          <div className="sum-r"><span style={{ color: "var(--gy)" }}>Duración</span><span>{form.duration}</span></div>
          <div className="sum-r"><span style={{ color: "var(--gy)" }}>Capacidad</span><span>{form.capacity} personas</span></div>
          <div className="sum-r"><span style={{ color: "var(--gy)" }}>Días</span><span>{form.days.length > 0 ? form.days.map(d => d[0].toUpperCase()).join(", ") : "—"}</span></div>
          <div className="sum-r"><span style={{ color: "var(--gy)" }}>Hora salida</span><span>{form.startTime}</span></div>
          <div className="sum-r"><span style={{ color: "var(--gy)" }}>Cancelación</span><span>{form.cancellation === "24h" ? "Libre hasta 24h" : form.cancellation === "48h" ? "Libre hasta 48h" : "No reembolsable"}</span></div>
          <div className="sum-t"><span>Precio por persona</span><span>S/ {form.price}</span></div>
        </div>

        {form.description && (
          <div style={{ marginBottom: 16 }}>
            <div className="lbl">Descripción</div>
            <div style={{ fontSize: 13, lineHeight: 1.6, color: "#555", padding: 14, background: "var(--cr)", borderRadius: 12 }}>{form.description}</div>
          </div>
        )}
        {form.included && (
          <div style={{ marginBottom: 16 }}>
            <div className="lbl">Incluye</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {form.included.split(",").map((x, i) => <div key={i} className="det-inc"><div className="det-ic iy"><Check size={14} strokeWidth={2} /></div>{x.trim()}</div>)}
            </div>
          </div>
        )}
        {form.excluded && (
          <div style={{ marginBottom: 16 }}>
            <div className="lbl">No incluye</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {form.excluded.split(",").map((x, i) => <div key={i} className="det-inc"><div className="det-ic in"><X size={14} strokeWidth={2} /></div>{x.trim()}</div>)}
            </div>
          </div>
        )}

        <div style={{ padding: 12, background: "rgba(45,90,61,.05)", borderRadius: 12, marginBottom: 16, fontSize: 12, color: "var(--gy)", lineHeight: 1.5 }}>
          Al publicar, tu tour será revisado por el equipo de Finde y estará visible en un máximo de 24 horas. Comisión por reserva: 15%.
        </div>
        <button className="mbtn" onClick={() => {
          if (isEditing) {
            onSaveTour({ ...editingTour, ...form, price: Number(form.price) || editingTour.price, image: form.photo ? `url(${form.photo})` : editingTour.image });
          } else {
            onCreateTour(form);
            setPublished(true);
          }
        }}>{isEditing ? "Guardar cambios" : "Publicar tour"}</button>
      </div>}
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────
export default function AppDemo() {
  const [view, setView] = useState("login");
  const [tour, setTour] = useState(null);
  const [nav, setNav] = useState("explore");
  const [cat, setCat] = useState("all");
  const [notifs, setNotifs] = useState(NOTIFS);
  const [isOperator, setIsOperator] = useState(false);
  const [tours, setTours] = useState(TOURS);
  const [opTours, setOpTours] = useState(() => {
    const fromTour = (id, tourId, active, image) => {
      const t = TOURS.find(x => x.id === tourId) || {};
      return {
        id, tourId, active, image,
        title: t.title || "",
        location: t.location || "",
        duration: t.duration || "",
        price: t.price || 0,
        rating: t.rating || 0,
        reviews: t.reviews || 0,
        category: t.category || "adventure",
        capacity: String(t.capacity || ""),
        difficulty: t.difficulty || "Moderada",
        description: t.desc || "",
        included: Array.isArray(t.included) ? t.included.join(", ") : (t.included || ""),
        excluded: Array.isArray(t.excluded) ? t.excluded.join(", ") : (t.excluded || ""),
        days: [],
        startTime: "08:00",
        cancellation: "24h",
        photo: null,
      };
    };
    return TOURS.map((t, i) => fromTour(i + 1, t.id, true, t.image));
  });
  const [editingTour, setEditingTour] = useState(null);
  const [dashTab, setDashTab] = useState("bookings");
  const [loggedIn, setLoggedIn] = useState(false);
  const [loginMsg, setLoginMsg] = useState("");
  const [reviews, setReviews] = useState(REVIEWS);
  const [trips, setTrips] = useState(MY_TRIPS);
  const ref = useRef(null);
  const unread = notifs.filter((n) => !n.read).length;

  useEffect(() => { if (ref.current) ref.current.scrollTop = 0; }, [view]);

  const go = (v) => {
    if (v === "home" && view === "welcome") setLoggedIn(true);
    if (v === "login") setLoggedIn(false);
    if (v !== "login") setLoginMsg("");
    setView(v);
    if (v === "home") setNav("explore");
    if (v === "catalog") setNav("search");
  };
  const handleBook = () => {
    if (!loggedIn) { setLoginMsg("Inicia sesión o regístrate para reservar tu experiencia"); go("login"); }
    else go("booking");
  };
  const handleReview = (tripId, tourId, rating, text) => {
    const newReview = { id: Date.now(), author: USER.name, avatar: USER.avatar, rating, text, date: "Hoy" };
    setReviews(prev => ({ ...prev, [tourId]: [newReview, ...(prev[tourId] || [])] }));
    setTrips(prev => prev.map(t => t.id === tripId ? { ...t, reviewed: true } : t));
    setTours(prev => prev.map(t => {
      if (t.id !== tourId) return t;
      const newCount = t.reviews + 1;
      const newRating = Math.round(((t.rating * t.reviews + rating) / newCount) * 10) / 10;
      return { ...t, reviews: newCount, rating: newRating };
    }));
    setOpTours(prev => prev.map(t => {
      if (t.tourId !== tourId) return t;
      const src = tours.find(x => x.id === tourId);
      if (!src) return t;
      const newCount = src.reviews + 1;
      const newRating = Math.round(((src.rating * src.reviews + rating) / newCount) * 10) / 10;
      return { ...t, reviews: newCount, rating: newRating };
    }));
  };
  const navGo = (id) => { setNav(id); if (id === "explore") go("home"); else if (id === "search") go("catalog"); else if (id === "trips") go("trips"); else if (id === "profile") go("profile"); };

  const handleEditTour = (t) => { setEditingTour(t); go("new-tour"); };
  const handleSaveTour = (updated) => {
    setOpTours(prev => prev.map(t => t.id === updated.id ? updated : t));
    if (updated.tourId) {
      setTours(prev => prev.map(t => t.id === updated.tourId ? {
        ...t,
        title: updated.title,
        location: updated.location,
        duration: updated.duration,
        price: updated.price,
        image: updated.image,
        ...(updated.description && { desc: updated.description }),
        ...(updated.included && { included: updated.included.split(",").map(s => s.trim()).filter(Boolean) }),
        ...(updated.excluded && { excluded: updated.excluded.split(",").map(s => s.trim()).filter(Boolean) }),
        ...(updated.capacity && { capacity: Number(updated.capacity) }),
        ...(updated.category && { category: updated.category }),
        ...(updated.difficulty && { difficulty: updated.difficulty }),
      } : t));
    }
    setEditingTour(null);
    setDashTab("listings");
    go("dashboard");
  };
  const handleCreateTour = (formData) => {
    const newTourId = Date.now();
    const cssImage = formData.photo ? `url(${formData.photo})` : "linear-gradient(135deg,#1B3A2D 0%,#2D5A3D 100%)";
    const newOpTour = {
      id: newTourId, tourId: newTourId,
      title: formData.title, location: formData.location, duration: formData.duration,
      price: Number(formData.price) || 0, rating: 0, reviews: 0, active: true,
      image: cssImage, category: formData.category, capacity: formData.capacity,
      difficulty: formData.difficulty, description: formData.description,
      included: formData.included, excluded: formData.excluded,
      days: formData.days, startTime: formData.startTime, cancellation: formData.cancellation,
      photo: formData.photo,
    };
    setOpTours(prev => [...prev, newOpTour]);
    setTours(prev => [...prev, {
      id: newTourId,
      title: formData.title,
      titleQu: "",
      location: formData.location,
      price: Number(formData.price) || 0,
      rating: 0,
      reviews: 0,
      duration: formData.duration,
      image: cssImage,
      badge: "Nuevo",
      category: formData.category,
      operator: "Andes Trek Perú",
      verified: false,
      capacity: Number(formData.capacity) || 10,
      altitude: "",
      difficulty: formData.difficulty,
      included: formData.included ? formData.included.split(",").map(s => s.trim()).filter(Boolean) : [],
      excluded: formData.excluded ? formData.excluded.split(",").map(s => s.trim()).filter(Boolean) : [],
      desc: formData.description,
      descQu: "",
      aiSummary: "",
      altTour: null,
      tags: [],
    }]);
    setDashTab("listings");
  };
  const handleCancelTour = () => { setEditingTour(null); setDashTab("bookings"); go("dashboard"); };

  const isAuth = !["login", "otp", "welcome"].includes(view);
  const showNav = isAuth && !["booking", "detail", "new-tour"].includes(view);
  const showHeader = isAuth && !["booking", "new-tour"].includes(view);
  const showFooter = isAuth && !["booking", "detail", "new-tour", "dashboard"].includes(view);
  const currentTour = tour ? tours.find(t => t.id === tour.id) || tour : null;
  const activeTours = tours.filter(t => { const op = opTours.find(o => o.tourId === t.id); return !op || op.active; });

  return (
    <>
      <style>{CSS}</style>
      <div className="app app-demo" ref={ref}>
        {showHeader && <TopNav onHome={() => go("home")} onDash={() => go(view === "dashboard" ? "home" : "dashboard")} onNotif={() => go("notifications")} view={view} unread={unread} isOperator={isOperator} navActive={nav} onNavClick={navGo} />}
        {view === "login" && <LoginView go={go} loginMsg={loginMsg} />}
        {view === "otp" && <OTPView go={go} />}
        {view === "welcome" && <WelcomeView go={go} />}
        {view === "home" && <HomeView go={go} pick={setTour} cat={cat} setCat={setCat} tours={activeTours} />}
        {view === "catalog" && <CatalogView go={go} pick={setTour} cat={cat} setCat={setCat} tours={activeTours} />}
        {view === "detail" && <DetailView tour={currentTour} go={go} pick={setTour} onBook={handleBook} reviews={reviews} />}
        {view === "booking" && <BookingView tour={currentTour} go={go} />}
        {view === "notifications" && <NotifsView notifs={notifs} setNotifs={setNotifs} />}
        {view === "trips" && <TripsView go={go} pick={setTour} onReview={handleReview} trips={trips} tours={tours} />}
        {view === "profile" && <ProfileView go={go} isOperator={isOperator} setIsOperator={setIsOperator} />}
        {view === "dashboard" && <DashView go={go} opTours={opTours} setOpTours={setOpTours} onEditTour={handleEditTour} initialTab={dashTab} onTabConsumed={() => setDashTab("bookings")} />}
        {view === "new-tour" && <NewTourView go={go} editingTour={editingTour} onSaveTour={handleSaveTour} onCreateTour={handleCreateTour} onCancel={handleCancelTour} />}
        {showFooter && <Footer go={go} />}
        {showNav && <BNav active={nav} go={navGo} />}
      </div>
    </>
  );
}