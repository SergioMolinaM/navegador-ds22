import { useState, useMemo, useCallback, useRef, useEffect } from "react";

/* ═══════════════════════════════════════════════════════════════════
   NAVEGADOR DS 22/2025 — PILAS Y AEE · LEY REP
   Producto editorial para País Circular (paiscircular.cl)
   
   REGLA DE DATOS: Cada cifra proviene del texto oficial firmado del
   DS 22/2025 (DO 7 mayo 2026) o de fuentes periodísticas con nombre,
   medio y fecha. Cero inferencia, cero estimaciones propias.
   ═══════════════════════════════════════════════════════════════════ */

// ─── DESIGN TOKENS ───────────────────────────────────────────────
const T = {
  accent: "#1D9E75",
  accentDark: "#0F6E56",
  accentLight: "#E8F7F1",
  amber: "#B8860B",
  amberLight: "#FDF6E3",
  purple: "#6C5CE7",
  bg: "#FFFFFF",
  bgAlt: "#F7F8F9",
  bgMuted: "#F1F3F4",
  text: "#1A1D21",
  textSec: "#5F6368",
  textHint: "#9AA0A6",
  border: "#E8EAED",
  borderLight: "#F1F3F4",
  radius: 10,
  radiusSm: 6,
  font: "'Source Serif 4', 'Georgia', serif",
  fontSans: "'DM Sans', 'Helvetica Neue', sans-serif",
  fontMono: "'JetBrains Mono', 'Fira Code', monospace",
};

// ─── METADATA EDITORIAL ─────────────────────────────────────────
const META = {
  version: "1.1",
  reviewedAt: "15 mayo 2026",
  source: "DS 22/2025 (MMA) — Diario Oficial 7 mayo 2026, edición 44.443",
};

// ─── DATA: 100% DS 22/2025 ──────────────────────────────────────

const CATS = [
  { id: "general", label: "Meta general", short: "General", color: T.accent },
  { id: "ait",     label: "AIT",          short: "AIT",     color: T.amber },
  { id: "pfv",     label: "Paneles FV",   short: "PFV",     color: T.purple },
  { id: "pilas",   label: "Pilas",        short: "Pilas",   color: "#E74C3C" },
];

const METAS = {
  general: {
    art: "Art. 21", max: 45,
    desc: "Aplica a todos los productores de pilas y AEE, salvo microempresas (Ley 20.416). Cubre residuos que no correspondan a PFV.",
    formula: { expr: "PG_i = 100 × (RG_i + RCI_i) / TIM_{Prom 3 años}", art: "Art. 22",
      vars: [["PG_i", "Porcentaje de cumplimiento para el año i"], ["RG_i", "Toneladas valorizadas por el sistema de gestión en el año i"], ["RCI_i", "Toneladas valorizadas por consumidores industriales en el año i"], ["TIM", "Promedio de toneladas introducidas al mercado en los 3 años anteriores"]] },
    notes: "Los GRANSIC podrán cumplir con cualquier residuo de pilas y/o AEE (art. 10a). Los sistemas integrados exclusivamente por productores de PFV no están sujetos a esta meta (art. 21 inc. final).",
    rows: [[1,"Primer año",3],[2,"Segundo año",5],[3,"Tercer año",8],[4,"Cuarto año",12],[5,"Quinto año",16],[6,"Sexto año",20],[7,"Séptimo año",24],[8,"Octavo año",30],[9,"Noveno año",37],[10,"Décimo año en adelante",45]],
  },
  ait: {
    art: "Art. 23", max: 30,
    def: { title: "Aparatos de intercambio de temperatura", art: "Art. 2° N°1",
      text: "Aparatos que enfrían, calientan y/o deshumidifican mediante gases refrigerantes, aceites u otras sustancias distintas del agua. Incluye refrigeradores, aires acondicionados, radiadores. Excluye aparatos que generan calor por resistencias eléctricas o combustión." },
    desc: "Meta específica adicional a la meta general. Solo cumplible con residuos de AIT.",
    formula: { expr: "PG_i = 100 × (RG_i + RCI_i) / TIM_{Prom 3 años}", art: "Art. 24",
      vars: [["RG_i", "Toneladas de AIT valorizadas en el año i"], ["RCI_i", "Toneladas de AIT valorizadas por consumidores industriales"], ["TIM", "Promedio de AIT introducidos al mercado en los 3 años anteriores"]] },
    notes: "La gestión de residuos de AIT debe cumplir normas NCh 3241:2017 y NCh 3301:2017 (art. 37 N°1). Los productores de AIT que operen mediante sistemas colectivos exclusivos podrán cumplir con cualquier residuo de AIT (art. 10c).",
    rows: [[1,"Primer año",null,"Sin meta"],[2,"Segundo año",null,"Sin meta"],[3,"Tercer año",6],[4,"Cuarto año",9],[5,"Quinto año",13],[6,"Sexto año",17],[7,"Séptimo año",21],[8,"Octavo año",25],[9,"Noveno año en adelante",30]],
  },
  pfv: {
    art: "Art. 25", max: 50,
    def: { title: "Paneles fotovoltaicos", art: "Art. 2° N°12",
      text: "AEE que genera y suministra electricidad a partir de luz solar. No se consideran PFV los de superficie menor a 0,25 m² (clasifican como «otros AEE»). Los parques solares no son instalaciones fijas de gran envergadura (art. 3° c)." },
    desc: "Meta específica con fórmula diferenciada basada en distribución de Weibull (α=3,5; β=25,0).",
    formula: { expr: "PCpfv_n = 100 × (RVSGpfv_n + RVCIpfv_n) / W_n(PoM,V)", art: "Art. 26",
      vars: [["RVSGpfv_n", "Toneladas de PFV valorizadas por el sistema en el año n"], ["RVCIpfv_n", "Toneladas de PFV valorizadas por consumidores industriales"], ["W_n(PoM,V)", "Residuos estimados usando Weibull (α=3,5; β=25,0)"]] },
    weibull: "VP(t,n) = (α/β^α) × (n−t)^(α−1) × e^(−[(n−t)/β]^α) con α = 3,5 y β = 25,0. El MMA publicará herramienta informática dentro de 6 meses desde la publicación (art. 26 inc. final).",
    notes: "La meta PFV podrá cumplirse a través de cualquier operación de valorización definida en la Ley (art. 27 inc. 2°). Solo cumplible con residuos de PFV.",
    rows: [[1,"Primer año",null,"Sin meta"],[2,"Segundo año",null,"Sin meta"],[3,"Tercer año",10],[4,"Cuarto año",14],[5,"Quinto año",18],[6,"Sexto año",22],[7,"Séptimo año",28],[8,"Octavo año",34],[9,"Noveno año",42],[10,"Décimo año en adelante",50]],
  },
  pilas: {
    art: "Art. 2° N°13, Art. 5°",
    def: { title: "Pilas", art: "Art. 2° N°13",
      text: "Fuente de energía eléctrica por transformación directa de energía química, unidad integrada al uso final, peso menor a 5 kg, no diseñada para incorporarse en baterías mayores. Excluye pilas de composición plomo-ácido." },
    desc: "Las pilas no tienen meta específica propia. Cumplen con la meta general del art. 21 (3% → 45% en 10 años) junto con los demás AEE, excepto PFV.",
    contabilizacion: [
      "Pilas extraíbles manualmente de un AEE → se contabilizan como pilas separadas (art. 5°).",
      "Pilas no extraíbles → se contabilizan como parte del AEE contenedor (art. 5°).",
      "Sustancias peligrosas: mercurio max 0,0005%; cadmio max 0,002% en peso (art. 42). Exceptuadas: pilas para equipos de emergencia, alarmas y aparatos médicos.",
    ],
  },
};

// Definición general de AEE — base para entender el ámbito de aplicación
const DEFINICIONES_AMBITO = [
  {
    id: "aee", title: "Aparatos eléctricos y electrónicos (AEE)", ref: "Art. 2° N°2",
    text: "Aparatos que para funcionar necesitan corriente eléctrica o campos electromagnéticos, así como aparatos para la generación, transferencia y medición de tales corrientes y campos. Categorías reconocidas en el decreto: aparatos de intercambio de temperatura (AIT), paneles fotovoltaicos (PFV) y otros AEE (todos los demás).",
  },
  {
    id: "ait", title: "Aparatos de intercambio de temperatura (AIT)", ref: "Art. 2° N°1",
    text: "Aparatos que enfrían, calientan y/o deshumidifican mediante gases refrigerantes, aceites u otras sustancias distintas del agua. Incluye refrigeradores, aires acondicionados, radiadores. Excluye aparatos que generan calor por resistencias eléctricas o combustión.",
  },
  {
    id: "pfv", title: "Paneles fotovoltaicos (PFV)", ref: "Art. 2° N°12",
    text: "AEE que generan y suministran electricidad a partir de luz solar. No se consideran PFV los de superficie menor a 0,25 m² (que clasifican como «otros AEE»). Los parques solares no califican como instalaciones fijas de gran envergadura (art. 3° c).",
  },
  {
    id: "pilas", title: "Pilas", ref: "Art. 2° N°13",
    text: "Fuente de energía eléctrica por transformación directa de energía química, unidad integrada al uso final, peso menor a 5 kg, no diseñada para incorporarse en baterías mayores. Excluye pilas de composición plomo-ácido.",
  },
];

const ACTORS = [
  { id: "productores", name: "Productores", ref: "Art. 6°, 8°", icon: "🏢",
    text: "La REP aplica a quienes introduzcan pilas y/o AEE en el mercado nacional. Microempresas (Ley 20.416) exentas de metas, pero no de informar (art. 9°). Inscripción en Ventanilla Única RETC dentro de 4 meses desde primera introducción. Permanencia mínima 1 año en el sistema de gestión.",
    tags: ["productor","importador","fabricante","retc","inscripción","microempresa","ventanilla"] },
  { id: "comercializadores", name: "Comercializadores > 400 m²", ref: "Art. 29°", icon: "🛒",
    text: "Deberán convenir con un sistema de gestión el establecimiento de una instalación de recepción y almacenamiento. Se recibirán residuos de pilas y AEE sin costo, sin importar composición ni antigüedad.",
    tags: ["comercializador","tienda","retail","punto","recepción","almacenamiento","400","superficie"] },
  { id: "gransic", name: "GRANSIC", ref: "Art. 30°–32°", icon: "👥",
    text: "Sistemas colectivos de 20+ productores no relacionados (art. 2° N°7). Recolectar residuos de comercializadores. Instalar puntos de recepción según calendario art. 31. Campañas domiciliarias mínimo 2/año, cobertura 10%→80% viviendas en 5 años (art. 32). Publicar sitio web actualizado con listado de productores, instalaciones, horarios y campañas (art. 33).",
    tags: ["gransic","colectivo","sistema","punto limpio","punto verde","recolección","domiciliaria","campaña","20 productores"] },
  { id: "gestores", name: "Gestores", ref: "Art. 36°–38°", icon: "♻️",
    text: "Inscripción en Ventanilla Única RETC (art. 36). Normas NCh 3241:2017 y NCh 3301:2017 para AIT. Requisitos de reutilización. Identificación de contaminantes orgánicos persistentes. Al menos 75% de productos post-valorización deben aprovecharse como materia prima o insumo (art. 38).",
    tags: ["gestor","valorizador","reciclador","planta","nch","contaminante","reutilización","pretratamiento","75%"] },
  { id: "consumidores_ind", name: "Consumidores industriales", ref: "Art. 20°", icon: "🏭",
    text: "Optar por: a) entregar residuos a un sistema de gestión, o b) valorizar por sí mismos vía gestores autorizados (informando al MMA). Las toneladas valorizadas se imputan al sistema de gestión correspondiente.",
    tags: ["consumidor industrial","industrial","valorizar","autogestión","imputar"] },
  { id: "consumidores", name: "Consumidores", ref: "Art. 46°", icon: "🏠",
    text: "Obligados a entregar residuos de pilas y AEE a un sistema de gestión, a través de los mecanismos de recolección ofrecidos, bajo las condiciones informadas públicamente.",
    tags: ["consumidor","persona","ciudadano","entregar","domiciliario","obligación"] },
  { id: "recicladores_base", name: "Recicladores de base", ref: "Título V", icon: "👷",
    text: "Reconocidos por la Ley 20.920 como gestores cuando estén certificados (art. 38 Ley REP). El Título V del decreto promueve su integración a los sistemas de gestión. La articulación operativa con recicladores de base debe definirse en los planes de gestión presentados al MMA.",
    tags: ["reciclador","base","informal","economía circular","social","certificación"] },
  { id: "municipalidades", name: "Municipalidades", ref: "Título V", icon: "🏛️",
    text: "Pueden suscribir convenios con los sistemas de gestión para la instalación de puntos limpios, campañas de recolección y educación ambiental en su territorio. Su rol es voluntario-colaborativo, no son sujetos obligados por el decreto. La cobertura GRANSIC del art. 31 se mide a nivel comunal.",
    tags: ["municipalidad","municipio","comuna","convenio","punto limpio","educación"] },
];

const EXCLUSIONS = [
  { text: "AEE para seguridad nacional (armas, municiones, material militar)", ref: "Art. 3° a", tags: ["militar","seguridad","armas","municiones"] },
  { text: "Herramientas industriales fijas de gran envergadura (>2 ton o >15 m³, o grúas pesadas para instalación)", ref: "Art. 3° b", tags: ["herramienta","industrial","gran envergadura","fija","2 toneladas","15 metros"] },
  { text: "Instalaciones fijas de gran envergadura (4 requisitos copulativos). Parques solares FV no califican.", ref: "Art. 3° c", tags: ["instalación fija","parque solar","envergadura"] },
  { text: "Medios de transporte con permiso de circulación", ref: "Art. 3° d", tags: ["transporte","vehículo","circulación"] },
  { text: "Maquinaria móvil fuera de ruta de uso exclusivamente profesional", ref: "Art. 3° e", tags: ["maquinaria","fuera de ruta","profesional"] },
  { text: "AEE exclusivamente para I+D de uso profesional", ref: "Art. 3° f", tags: ["investigación","desarrollo","i+d","profesional"] },
  { text: "AEE instalados como componente de un aparato excluido del ámbito", ref: "Art. 3° g", tags: ["componente","aparato excluido"] },
  { text: "Fuentes de energía eléctrica destinadas a celdas/módulos de baterías mayores", ref: "Art. 3° h", tags: ["celda","batería","módulo","fuente de energía"] },
  { text: "Microempresas (Ley 20.416): exentas de metas y obligaciones asociadas, pero deben informar (art. 9°)", ref: "Art. 6° inc. 2°", tags: ["microempresa","pyme","pequeña","exenta"] },
  { text: "Pilas de composición plomo-ácido", ref: "Art. 2° N°13", tags: ["plomo","ácido","batería plomo"] },
];

const TIMELINE = [
  { date: "17 julio 2025", text: "Firma del decreto por el Presidente de la República", done: true },
  { date: "27 agosto 2025", text: "Primer envío del decreto a la Contraloría General de la República (con observaciones)", done: true },
  { date: "18 marzo 2026", text: "Aplazamiento de la toma de razón — cobertura País Circular", done: true },
  { date: "23 abril 2026", text: "Toma de razón definitiva, Contraloría General de la República", done: true },
  { date: "7 mayo 2026", text: "Publicación en el Diario Oficial — vigencia inmediata Títulos I, II, V y VI", done: true },
  { date: "~noviembre 2026", text: "Herramienta informática del MMA para cálculo Weibull PFV (6 meses desde DO, art. 26 inc. final)", done: false },
  { date: "~agosto 2027", text: "Plazo para presentar planes de gestión (15 meses desde DO, art. 5° transitorio)", done: false },
  { date: "~noviembre 2027", text: "Primera declaración de consumidores industriales (18 meses desde DO, art. 6° transitorio)", done: false },
  { date: "7 mayo 2028", text: "Entrada en vigencia de Títulos III y IV — metas y obligaciones asociadas exigibles", done: false, highlight: true },
];

const COBERTURA = [
  { plazo: "Primer año", criterio: "Comunas > 500.000 hab" },
  { plazo: "Segundo año", criterio: "Comunas > 250.000 hab" },
  { plazo: "Tercer año", criterio: "Todas las capitales regionales" },
  { plazo: "Cuarto año+", criterio: "Comunas > 150.000 hab" },
];

const RECOLECCION = [
  { plazo: "Año 1", pct: 10 }, { plazo: "Año 2", pct: 30 }, { plazo: "Año 3", pct: 50 },
  { plazo: "Año 4", pct: 70 }, { plazo: "Año 5+", pct: 80 },
];

const QUOTES = [
  { text: "Se habla de un universo que alcanza alrededor de los 17.000 productores en AEE y unos 3.500 en Pilas. En total, unas 20.500 empresas van a estar reguladas.", who: "Paz Maluenda, Oficina de Economía Circular, MMA", src: "País Circular, 15 jun 2025", cat: "general" },
  { text: "Son residuos con alto potencial de valorización, pero se estima que la tasa de reciclaje en Chile alcanza apenas un 4,1%.", who: "Tomás Saieg, jefe OEC, MMA", src: "País Circular, 9 jun 2025", cat: "general" },
  { text: "Acá empieza a correr el reloj de la REP. Solo tenemos 24 meses para conformar el Sistema de Gestión.", who: "Romina Reyes, gerenta de TRAEE", src: "País Circular, 23 abr 2026", cat: "plazos" },
  { text: "Esta es la luz verde para la organización estratégica de los regulados; lo técnico va a venir en 2027.", who: "Rodrigo Sagaceta, Wee Chile", src: "País Circular, 23 abr 2026", cat: "plazos" },
  { text: "La empresa cuenta con un plan de crecimiento 2025-2030 que incluye aumento de capacidad instalada.", who: "Mitzy Lagos, Economía Circular, Midas Chile", src: "El Desconcierto, 23 abr 2026", cat: "actores" },
  { text: "Falta una guía que permita interpretar cuáles aparatos van a estar afectos y cuáles excluidos. Los AIT son peligrosos cuando se intervienen por los gases refrigerantes.", who: "Mitzy Lagos, Midas Chile", src: "País Circular, 15 jun 2025", cat: "ait" },
  { text: "Existen al menos dos Sistemas de Gestión colectivos en desarrollo: TRAEE (CCS) y Wee Chile (NHE).", who: "", src: "El Desconcierto, 23 abr 2026", cat: "plazos" },
  { text: "Se estima que en 2025 se introdujeron ~3.000 t de pilas y ~279.600 t de AEE al mercado. Se generaron ~2.600 t de residuos de pilas y ~220.700 t de RAEE.", who: "Considerandos 3°–4°", src: "DS 22/2025, texto oficial", cat: "general" },
  { text: "Al año 2024 se habían introducido al mercado nacional más de un millón de toneladas de paneles fotovoltaicos, con un fuerte crecimiento sostenido en el período 2012–2024.", who: "Considerando 23°", src: "DS 22/2025, texto oficial", cat: "pfv" },
  { text: "Cerca del 90% de un panel fotovoltaico está compuesto por materiales reciclables, como vidrio y aluminio.", who: "Considerando 25°", src: "DS 22/2025, texto oficial", cat: "pfv" },
  { text: "Los beneficios económicos y sociales de la regulación propuesta equivalen a 0,64 veces sus costos.", who: "Considerando 47° (AGIES actualizado)", src: "DS 22/2025, texto oficial", cat: "general" },
];

// ─── COBERTURA EDITORIAL PAÍS CIRCULAR ──────────────────────────
const COBERTURA_PC = [
  { date: "9 jun 2025", title: "Decreto P+AEE entra en la recta final",
    url: "https://www.paiscircular.cl/economia-circular/luego-de-4-anos-de-tramitacion-decreto-de-metas-para-pilas-y-aparatos-electricos-y-electronicos-entra-en-la-recta-final-para-ser-implementado/" },
  { date: "15 jun 2025", title: "Expertos analizan ejes del decreto",
    url: "https://www.paiscircular.cl/economia-circular/expertos-analizan-los-ejes-del-decreto-de-metas-para-pilas-y-aparatos-electricos-y-electronicos/" },
  { date: "22 jul 2025", title: "Categorías y excepciones del decreto",
    url: "https://www.paiscircular.cl/economia-circular/especialistas-explican-los-porque-de-las-categorias-y-excepciones-del-decreto-de-metas-para-residuos-de-aparatos-electricos-y-electronicos-pilas/" },
  { date: "18 mar 2026", title: "Aplazamiento toma de razón",
    url: "https://www.paiscircular.cl/economia-circular/cuanto-puede-afectar-al-avance-de-la-ley-rep-el-aplazamiento-de-la-toma-de-razon-del-decreto-de-metas-para-pilas-aparatos-electricos-y-electronicos/" },
  { date: "23 abr 2026", title: "Contraloría tomó razón del decreto",
    url: "https://www.paiscircular.cl/economia-circular/contraloria-tomo-razon-del-decreto-de-metas-para-pilas-aparatos-electricos-y-electronicos-enviando-positiva-senal-a-los-regulados/" },
];

const WEBINAR_PC = {
  title: "Residuos de AEE: Claves del nuevo reglamento REP",
  desc: "Seminario web organizado por País Circular para analizar el alcance, las metas y las obligaciones del DS 22/2025.",
  moderador: "Pablo Badenier",
  panelistas: [
    "Paz Maluenda — Oficina de Economía Circular, MMA",
    "Mitzy Lagos — Economía Circular, Midas Chile",
    "Víctor Hugo Moncada — Hisense Gorenje",
  ],
};

// Perfiles de productor: qué metas aplican según arts. 21–25.
// PFV: cumple meta PFV; los sistemas integrados exclusivamente por productores
// de PFV NO están sujetos a la meta general (art. 21 inc. final).
const PERFILES_PRODUCTOR = [
  { id: "pilas",  label: "Pilas (no plomo-ácido)",
    metas: ["general"],
    ref: "Art. 21",
    note: "Cumple la meta general junto con los demás AEE (excepto PFV). Pilas extraíbles se contabilizan separadas; no extraíbles, como parte del AEE (art. 5°)." },
  { id: "ait",    label: "Refrigeradores · A/C · AIT",
    metas: ["general", "ait"],
    ref: "Arts. 21, 23",
    note: "Cumple meta general + meta específica AIT. Gestión sujeta a NCh 3241:2017 y NCh 3301:2017 (art. 37 N°1)." },
  { id: "pfv",    label: "Paneles fotovoltaicos",
    metas: ["pfv"],
    ref: "Art. 25 · Art. 21 inc. final",
    note: "Solo cumple meta PFV. Los sistemas integrados exclusivamente por productores de PFV NO están sujetos a la meta general (art. 21 inc. final)." },
  { id: "general",label: "Celulares · Computadores · Electrodomésticos",
    metas: ["general"],
    ref: "Art. 21",
    note: "Cumple la meta general del art. 21 (3% → 45% en 10 años). Sin meta específica adicional." },
];

// ─── SECTIONS ────────────────────────────────────────────────────
const PAGES = [
  { id: "inicio",      label: "Resumen",       icon: "📋" },
  { id: "metas",       label: "Metas",         icon: "📊" },
  { id: "actores",     label: "Obligaciones",  icon: "👤" },
  { id: "plazos",      label: "Plazos",        icon: "📅" },
  { id: "exclusiones", label: "Exclusiones",   icon: "🚫" },
  { id: "contexto",    label: "Contexto",      icon: "💬" },
];

// ─── UTILITY COMPONENTS ──────────────────────────────────────────

const s = {
  card: { background: T.bg, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: "16px 18px", marginBottom: 12 },
  label: { fontSize: 11, fontWeight: 600, color: T.textHint, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 8 },
  artRef: { fontSize: 11, color: T.accent, fontWeight: 600, marginLeft: 6 },
  p: { fontSize: 14, color: T.textSec, lineHeight: 1.75, marginBottom: 12, fontFamily: T.font },
  h3: { fontSize: 15, fontWeight: 600, marginBottom: 10, fontFamily: T.fontSans },
};

function Chip({ active, onClick, children, color }) {
  return (
    <button onClick={onClick} className={active ? "pc-chip-active" : "pc-chip"} style={{
      padding: "7px 14px", fontSize: 12, fontWeight: 600, borderRadius: 20, cursor: "pointer",
      border: active ? "1px solid transparent" : `1.5px solid ${T.border}`,
      background: active ? (color || T.accent) : T.bg,
      color: active ? "#fff" : T.textSec, transition: "all 0.18s", fontFamily: T.fontSans,
      boxShadow: active ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
    }}>{children}</button>
  );
}

function SearchBox({ value, onChange, placeholder }) {
  return (
    <div style={{ position: "relative", marginBottom: 16 }}>
      <span style={{ position: "absolute", left: 12, top: 10, fontSize: 15, opacity: 0.4 }}>🔍</span>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{
          width: "100%", padding: "10px 14px 10px 36px", fontSize: 13, border: `1px solid ${T.border}`,
          borderRadius: T.radius, outline: "none", background: T.bgAlt, fontFamily: T.fontSans,
          color: T.text, transition: "border 0.2s",
        }}
        onFocus={e => e.target.style.borderColor = T.accent}
        onBlur={e => e.target.style.borderColor = T.border}
      />
    </div>
  );
}

function NoteBox({ children, type = "info" }) {
  const colors = { info: T.accent, warn: T.amber, def: "#6C5CE7" };
  const bgs = { info: T.accentLight, warn: T.amberLight, def: "#F3F0FF" };
  return (
    <div style={{ padding: "12px 16px", borderLeft: `3px solid ${colors[type]}`, background: bgs[type],
      borderRadius: `0 ${T.radiusSm}px ${T.radiusSm}px 0`, marginBottom: 14, fontSize: 13, color: T.text,
      lineHeight: 1.7, fontFamily: T.font }}>
      {children}
    </div>
  );
}

function MetaBar({ pct, max, color }) {
  if (pct == null) return null;
  return (
    <div style={{ height: 6, background: T.bgMuted, borderRadius: 3, overflow: "hidden", flex: 1 }}>
      <div style={{ height: "100%", width: `${Math.round((pct / max) * 100)}%`, background: color || T.accent,
        borderRadius: 3, transition: "width 0.4s ease" }} />
    </div>
  );
}

function Onboarding({ onStart }) {
  return (
    <div style={{
      maxWidth: 800, margin: "0 auto", fontFamily: T.fontSans, color: T.text,
      border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden", background: T.bg,
    }}>
      <div style={{
        position: "relative",
        background: "linear-gradient(135deg, #1B4332 0%, #2D6A4F 50%, #1D9E75 100%)",
        padding: "56px 32px 48px", color: "#fff", textAlign: "center",
      }}>
        <div style={{
          position: "absolute", inset: 0, opacity: 0.08,
          backgroundImage: "radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)",
          backgroundSize: "22px 22px", pointerEvents: "none",
        }} />
        <img src="https://www.paiscircular.cl/wp-content/uploads/2022/08/cropped-Logo-Pais-Letras-Negras-270x270.png"
          alt="País Circular" style={{
            height: 64, width: 64, objectFit: "contain", background: "#fff",
            borderRadius: 12, padding: 8, marginBottom: 18,
            boxShadow: "0 6px 20px rgba(0,0,0,0.18)",
          }} />
        <div style={{
          fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase",
          opacity: 0.85, marginBottom: 12, fontWeight: 600,
        }}>País Circular presenta</div>
        <h1 style={{
          fontSize: 28, fontWeight: 700, lineHeight: 1.25, margin: "0 0 14px",
          fontFamily: T.font, letterSpacing: "-0.02em", maxWidth: 560, marginLeft: "auto", marginRight: "auto",
        }}>
          El primer navegador interactivo de un decreto de metas de la Ley REP en Chile
        </h1>
        <p style={{
          fontSize: 15, lineHeight: 1.65, margin: "0 auto 28px", maxWidth: 520,
          opacity: 0.94, fontFamily: T.font,
        }}>
          Explore el DS 22/2025: qué productos regula, qué metas establece, qué obligaciones impone y a quién afecta.
        </p>
        <button onClick={onStart} className="pc-cta" style={{
          padding: "13px 26px", fontSize: 14, fontWeight: 700, borderRadius: 10,
          border: "none", background: "#fff", color: "#1B4332", cursor: "pointer",
          fontFamily: T.fontSans, letterSpacing: "0.01em",
          boxShadow: "0 4px 14px rgba(0,0,0,0.18)", transition: "all 0.2s",
        }}>
          Explorar el decreto →
        </button>
      </div>
      <div style={{
        padding: "18px 24px", fontSize: 11, color: T.textHint, textAlign: "center",
        borderTop: `1px solid ${T.border}`, lineHeight: 1.6, fontFamily: T.fontSans,
      }}>
        Decreto Supremo N° 22/2025 · Ministerio del Medio Ambiente · Diario Oficial 7 mayo 2026
      </div>
    </div>
  );
}

function QuoteCard({ q }) {
  return (
    <div style={{ borderLeft: `2px solid ${T.accent}`, padding: "10px 16px", marginBottom: 12,
      borderRadius: `0 ${T.radiusSm}px ${T.radiusSm}px 0`, background: T.bgAlt }}>
      <p style={{ fontSize: 13, color: T.text, lineHeight: 1.7, fontStyle: "italic", margin: 0, fontFamily: T.font }}>
        "{q.text}"
      </p>
      <p style={{ fontSize: 11, color: T.textHint, marginTop: 6, margin: "6px 0 0" }}>
        {q.who && <>— {q.who}. </>}{q.src}
      </p>
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────

export default function NavegadorDS22() {
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [page, setPage] = useState("inicio");
  const [search, setSearch] = useState("");
  const [metaCat, setMetaCat] = useState("comparativa");
  const [actorFilter, setActorFilter] = useState("todos");
  const [perfil, setPerfil] = useState(null);
  const contentRef = useRef(null);

  const navigate = useCallback((p) => {
    setPage(p); setSearch(""); setMetaCat("comparativa"); setActorFilter("todos"); setPerfil(null);
  }, []);

  useEffect(() => {
    if (contentRef.current) contentRef.current.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  // Auto-resize del iframe en embed (postMessage al parent).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const send = () => {
      const h = document.getElementById("root")?.scrollHeight || document.body.scrollHeight;
      try { window.parent.postMessage({ type: "resize", height: h }, "*"); } catch (_) {}
    };
    send();
    const obs = new ResizeObserver(send);
    obs.observe(document.body);
    return () => obs.disconnect();
  }, [page, showOnboarding, metaCat, actorFilter, perfil]);

  if (showOnboarding) {
    return <Onboarding onStart={() => setShowOnboarding(false)} />;
  }

  const q = search.toLowerCase().trim();

  const filteredActors = useMemo(() => {
    let list = ACTORS;
    if (actorFilter !== "todos") list = list.filter(a => a.id === actorFilter);
    if (q) list = list.filter(a => a.name.toLowerCase().includes(q) || a.text.toLowerCase().includes(q) || a.tags.some(t => t.includes(q)));
    return list;
  }, [actorFilter, q]);

  const filteredExcl = useMemo(() => {
    if (!q) return EXCLUSIONS;
    return EXCLUSIONS.filter(e => e.text.toLowerCase().includes(q) || e.tags.some(t => t.includes(q)));
  }, [q]);

  const filteredQuotes = useMemo(() => {
    if (!q) return QUOTES;
    return QUOTES.filter(x => x.text.toLowerCase().includes(q) || x.who.toLowerCase().includes(q) || x.cat.includes(q));
  }, [q]);

  // ─── RENDER ──────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", fontFamily: T.fontSans, color: T.text,
      border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden", background: T.bg }}>

      {/* INLINE HOVER STYLES */}
      <style>{`
        .pc-tab:hover { color: #2D6A4F !important; background: #F1F8F4 !important; }
        .pc-chip:hover { border-color: #2D6A4F !important; color: #1B4332 !important; background: #F1F8F4 !important; box-shadow: 0 1px 4px rgba(45,106,79,0.10); }
        .pc-chip-active:hover { filter: brightness(0.96); box-shadow: 0 2px 8px rgba(0,0,0,0.10); }
        .pc-btn:hover { border-color: #2D6A4F !important; box-shadow: 0 2px 8px rgba(45,106,79,0.12); transform: translateY(-1px); }
        .pc-cta:hover { transform: translateY(-1px); box-shadow: 0 8px 22px rgba(0,0,0,0.22) !important; }
        .pc-link:hover { color: #0F6E56 !important; border-bottom-color: #0F6E56 !important; }
        .pc-card-link:hover { border-color: #2D6A4F !important; box-shadow: 0 6px 18px rgba(27,67,50,0.10); transform: translateY(-2px); }
        .pc-sponsor:hover { filter: brightness(1.04); }
        @media (max-width: 520px) {
          .pc-header-top { flex-direction: column; align-items: flex-start !important; }
          .pc-header-top > div:last-child { text-align: left !important; }
          .pc-title-h1 { font-size: 21px !important; }
        }
      `}</style>

      {/* SPONSOR BANNER */}
      <a href="mailto:info@paiscircular.cl?subject=Auspicio%20navegador%20DS%2022%2F2025"
        className="pc-sponsor"
        style={{
          display: "block", position: "relative", textDecoration: "none",
          background: "linear-gradient(90deg, #1B4332 0%, #2D6A4F 100%)",
          color: "#fff", padding: "12px 22px", borderBottom: `1px solid ${T.border}`,
          transition: "filter 0.2s", overflow: "hidden",
        }}>
        <span style={{
          position: "absolute", inset: 0, opacity: 0.08,
          backgroundImage: "radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)",
          backgroundSize: "16px 16px", pointerEvents: "none",
        }} />
        <div style={{
          position: "relative", display: "flex", alignItems: "center", justifyContent: "center",
          gap: 12, flexWrap: "wrap", fontFamily: T.fontSans,
        }}>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase",
            background: "rgba(255,255,255,0.16)", padding: "3px 8px", borderRadius: 4,
          }}>
            Espacio disponible
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.01em" }}>
            Auspicie este espacio
          </span>
          <span style={{ fontSize: 12, opacity: 0.85 }}>
            info@paiscircular.cl →
          </span>
        </div>
      </a>

      {/* HEADER */}
      <div style={{ padding: "26px 28px 22px", borderBottom: `1px solid ${T.border}`, background: T.bg }}>
        <div className="pc-header-top" style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 16, marginBottom: 22, flexWrap: "wrap",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <img src="https://www.paiscircular.cl/wp-content/uploads/2022/08/cropped-Logo-Pais-Letras-Negras-270x270.png"
              alt="País Circular" style={{ height: 56, width: 56, objectFit: "contain" }} />
            <div>
              <div style={{
                fontWeight: 700, fontSize: 19, color: T.text, letterSpacing: "-0.015em",
                fontFamily: T.fontSans, lineHeight: 1.15,
              }}>País Circular</div>
              <div style={{
                fontSize: 12, color: T.textSec, marginTop: 3, fontFamily: T.font, fontStyle: "italic",
              }}>Una herramienta de País Circular</div>
            </div>
          </div>
          <div style={{ textAlign: "right", fontSize: 11, color: T.textHint, lineHeight: 1.6 }}>
            <div><strong style={{ color: T.textSec, fontWeight: 600 }}>DO:</strong> 7 mayo 2026</div>
            <div><strong style={{ color: T.textSec, fontWeight: 600 }}>Metas:</strong> mayo 2028</div>
            <a href="https://www.diariooficial.interior.gob.cl/edicionelectronica/index.php?date=07-05-2026&edition=44443"
              target="_blank" rel="noopener noreferrer" className="pc-link"
              style={{
                display: "inline-block", marginTop: 6, fontSize: 11, fontWeight: 600,
                color: T.accent, textDecoration: "none", borderBottom: `1px solid ${T.accentLight}`,
                paddingBottom: 1, transition: "all 0.15s",
              }}>
              Ver en Diario Oficial ↗
            </a>
            <div style={{ fontSize: 10, color: T.textHint, marginTop: 2, fontStyle: "italic" }}>
              (edición 7 mayo 2026)
            </div>
          </div>
        </div>
        <div style={{
          fontSize: 11, color: T.accent, fontWeight: 700, letterSpacing: "0.06em",
          textTransform: "uppercase", marginBottom: 10,
        }}>
          Decreto Supremo N° 22/2025 · Ministerio del Medio Ambiente
        </div>
        <h1 style={{
          fontSize: 26, fontWeight: 700, lineHeight: 1.22, margin: "0 0 10px",
          fontFamily: T.font, letterSpacing: "-0.025em", color: T.text,
        }}>
          Productos prioritarios de la Ley REP: pilas y aparatos eléctricos y electrónicos
        </h1>
        <p style={{ fontSize: 14, color: T.textSec, lineHeight: 1.6, margin: 0, fontFamily: T.font }}>
          Navegador interactivo del DS 22/2025 — Metas, obligaciones, plazos y exclusiones.
        </p>
        <p style={{ fontSize: 11, color: T.textHint, lineHeight: 1.55, margin: "10px 0 0", fontStyle: "italic" }}>
          Nota: el Diario Oficial redirige a la edición vigente del día. Si el enlace no muestra la edición del 7 de mayo de 2026,
          búsquela manualmente en «Ediciones Anteriores».
        </p>
      </div>

      {/* NAV TABS (sticky) */}
      <div style={{
        display: "flex", borderBottom: `1px solid ${T.border}`, overflowX: "auto",
        background: T.bg, position: "sticky", top: 0, zIndex: 10,
        boxShadow: "0 1px 0 rgba(0,0,0,0.02)",
      }}>
        {PAGES.map(p => (
          <button key={p.id} onClick={() => navigate(p.id)} className={page === p.id ? undefined : "pc-tab"} style={{
            padding: "13px 18px", fontSize: 12.5, fontWeight: 600, cursor: "pointer", border: "none",
            background: "transparent", whiteSpace: "nowrap", fontFamily: T.fontSans, display: "flex",
            alignItems: "center", gap: 5,
            color: page === p.id ? T.accent : T.textSec,
            borderBottom: page === p.id ? `2.5px solid ${T.accent}` : "2.5px solid transparent",
            transition: "all 0.15s",
          }}>
            <span style={{ fontSize: 14 }}>{p.icon}</span> {p.label}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div ref={contentRef} style={{ padding: 24, minHeight: 420, maxHeight: 700, overflowY: "auto" }}>

        {/* ═══ INICIO ═══ */}
        {page === "inicio" && (
          <div>
            <p style={s.p}>
              El Decreto Supremo N° 22/2025 establece metas de recolección y valorización y otras obligaciones asociadas
              a los productos prioritarios <strong>pilas</strong> y <strong>aparatos eléctricos y electrónicos (AEE)</strong>,
              en el marco de la Ley N° 20.920 de Responsabilidad Extendida del Productor.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))", gap: 10, marginBottom: 16 }}>
              {[
                { l: "Publicación DO", v: "7 mayo 2026", sub: "Vigencia inmediata (Títulos I, II, V, VI)" },
                { l: "Metas exigibles", v: "Mayo 2028", sub: "24 meses desde publicación" },
                { l: "Artículos", v: "49 + 6 trans.", sub: "6 títulos" },
                { l: "Categorías AEE", v: "3", sub: "AIT · PFV · Otros" },
              ].map((k, i) => (
                <div key={i} style={{ background: T.bgAlt, borderRadius: T.radius, padding: "14px 16px" }}>
                  <div style={{ fontSize: 11, color: T.textHint, marginBottom: 4 }}>{k.l}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, fontFamily: T.fontSans }}>{k.v}</div>
                  <div style={{ fontSize: 11, color: T.textSec, marginTop: 3 }}>{k.sub}</div>
                </div>
              ))}
            </div>

            {/* DESTACADO EDITORIAL: AGIES */}
            <div style={{
              display: "grid", gridTemplateColumns: "auto 1fr", gap: 16, alignItems: "center",
              background: "linear-gradient(135deg, #FDF6E3 0%, #FFFBEE 100%)",
              border: `1px solid ${T.amber}33`, borderLeft: `4px solid ${T.amber}`,
              borderRadius: T.radius, padding: "16px 20px", marginBottom: 20,
            }}>
              <div style={{ textAlign: "center", minWidth: 100 }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: T.amber, fontFamily: T.fontSans, letterSpacing: "-0.03em", lineHeight: 1 }}>
                  0,64×
                </div>
                <div style={{ fontSize: 10, color: T.textHint, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 4 }}>
                  Beneficios / Costos
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: T.amber, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>
                  Dato clave del AGIES
                </div>
                <div style={{ fontSize: 14, color: T.text, lineHeight: 1.55, fontFamily: T.font }}>
                  Según el Análisis General de Impacto Económico y Social actualizado, los beneficios económicos y sociales
                  de la regulación equivalen a <strong>0,64 veces sus costos</strong>. Es decir, el VAN proyectado del decreto
                  es negativo en la estimación oficial.
                </div>
                <div style={{ fontSize: 11, color: T.textHint, marginTop: 6, fontStyle: "italic" }}>
                  Considerando 47°, DS 22/2025
                </div>
              </div>
            </div>

            <div style={s.label}>¿Qué se considera dentro del ámbito?</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10, marginBottom: 20 }}>
              {DEFINICIONES_AMBITO.map(d => (
                <div key={d.id} style={{
                  background: T.bg, border: `1px solid ${T.border}`, borderRadius: T.radius,
                  padding: "12px 14px",
                }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 6 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.text, fontFamily: T.fontSans }}>{d.title}</div>
                    <span style={s.artRef}>{d.ref}</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: T.textSec, lineHeight: 1.6, fontFamily: T.font }}>
                    {d.text}
                  </div>
                </div>
              ))}
            </div>

            <div style={s.label}>Estructura del decreto</div>
            <div style={{ fontSize: 13, color: T.textSec, lineHeight: 1.85, fontFamily: T.font }}>
              <strong>Título I</strong> — Disposiciones generales: objeto, definiciones, ámbito, categorías, contabilización de pilas.<br />
              <strong>Título II</strong> — Obligaciones de productores y sistemas de gestión: inscripción, planes, informes, garantías, tarifas.<br />
              <strong>Título III</strong> — Metas: meta general (pilas + AEE), meta específica AIT, meta específica PFV, reglas comunes.<br />
              <strong>Título IV</strong> — Obligaciones asociadas: comercializadores, GRANSIC, gestores, consumidores industriales, sustancias peligrosas.<br />
              <strong>Título V</strong> — Otros actores: recicladores de base, municipalidades, permisos no precarios.<br />
              <strong>Título VI</strong> — Otras disposiciones: consumidores, fiscalización (SMA), interpretación (MMA), vigencia.
            </div>

            <NoteBox>
              <strong>Vigencia:</strong> Títulos I, II, V y VI rigieron desde el 7 de mayo de 2026. Los Títulos III (metas) y IV (obligaciones asociadas) entrarán en vigencia 24 meses después: <strong>mayo 2028</strong>. <span style={s.artRef}>Art. 49</span>
            </NoteBox>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
              {PAGES.filter(p => p.id !== "inicio").map(p => (
                <button key={p.id} onClick={() => navigate(p.id)} className="pc-btn" style={{
                  padding: "10px 18px", fontSize: 13, fontWeight: 600, borderRadius: T.radius,
                  border: `1.5px solid ${T.border}`, background: T.bg, cursor: "pointer",
                  fontFamily: T.fontSans, color: T.text, display: "flex", alignItems: "center", gap: 6,
                  transition: "all 0.18s",
                }}>
                  <span>{p.icon}</span> Explorar {p.label.toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ═══ METAS ═══ */}
        {page === "metas" && (
          <div>
            {/* Filtro: ¿Qué me toca a mí? */}
            <div style={{
              background: T.bgAlt, border: `1px solid ${T.border}`, borderRadius: T.radius,
              padding: "14px 16px", marginBottom: 18,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <span style={{ fontSize: 14 }}>🎯</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: T.text, fontFamily: T.fontSans }}>
                  ¿Qué me toca a mí?
                </span>
                {perfil && (
                  <button onClick={() => setPerfil(null)} className="pc-link" style={{
                    marginLeft: "auto", background: "transparent", border: "none", cursor: "pointer",
                    fontSize: 11, color: T.accent, fontWeight: 600, fontFamily: T.fontSans,
                  }}>Limpiar ✕</button>
                )}
              </div>
              <div style={{ fontSize: 12, color: T.textSec, marginBottom: 12, lineHeight: 1.55, fontFamily: T.font }}>
                Seleccione el tipo de producto que introduce al mercado para ver las metas que le aplican según los arts. 21–25.
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {PERFILES_PRODUCTOR.map(p => (
                  <Chip key={p.id} active={perfil === p.id} onClick={() => {
                    setPerfil(p.id);
                    setMetaCat(p.metas[0] === "general" ? "comparativa" : p.metas[0]);
                  }}>Soy productor de {p.label}</Chip>
                ))}
              </div>
              {perfil && (() => {
                const sel = PERFILES_PRODUCTOR.find(x => x.id === perfil);
                return (
                  <div style={{
                    marginTop: 14, padding: "12px 14px",
                    background: T.bg, border: `1px solid ${T.border}`, borderRadius: T.radiusSm,
                  }}>
                    <div style={{ fontSize: 12, color: T.textHint, marginBottom: 6, fontFamily: T.fontSans }}>
                      Metas aplicables <span style={s.artRef}>{sel.ref}</span>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                      {sel.metas.map(mid => {
                        const c = CATS.find(x => x.id === mid) || { label: "Meta general", color: T.accent };
                        return (
                          <span key={mid} style={{
                            display: "inline-flex", alignItems: "center", gap: 5,
                            padding: "4px 10px", borderRadius: 14, fontSize: 11, fontWeight: 700,
                            background: c.color, color: "#fff", fontFamily: T.fontSans,
                          }}>✓ {c.label}</span>
                        );
                      })}
                      {!sel.metas.includes("general") && (
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 5,
                          padding: "4px 10px", borderRadius: 14, fontSize: 11, fontWeight: 600,
                          background: T.bgMuted, color: T.textHint, fontFamily: T.fontSans,
                          textDecoration: "line-through",
                        }}>Meta general</span>
                      )}
                    </div>
                    <div style={{ fontSize: 12.5, color: T.textSec, lineHeight: 1.65, fontFamily: T.font }}>
                      {sel.note}
                    </div>
                  </div>
                );
              })()}
            </div>

            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 18 }}>
              <Chip active={metaCat === "comparativa"} onClick={() => setMetaCat("comparativa")}>Comparativa</Chip>
              {CATS.map(c => (
                <Chip key={c.id} active={metaCat === c.id} onClick={() => setMetaCat(c.id)} color={c.color}>{c.short}</Chip>
              ))}
            </div>

            {metaCat === "comparativa" && (
              <div>
                <p style={s.p}>El decreto establece una meta general para pilas y AEE (excepto PFV) y dos metas específicas adicionales para AIT y PFV.<span style={s.artRef}>Arts. 21, 23, 25</span></p>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginBottom: 16 }}>
                  <thead>
                    <tr>{["Año", "General", "AIT", "PFV"].map((h, i) => (
                      <th key={i} style={{ textAlign: i === 0 ? "left" : "right", padding: "8px 10px", fontWeight: 600,
                        fontSize: 11, color: T.textHint, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map(yr => {
                      const gv = METAS.general.rows.find(r => r[0] === yr)?.[2];
                      const av = METAS.ait.rows.find(r => r[0] === yr)?.[2];
                      const pv = METAS.pfv.rows.find(r => r[0] === yr)?.[2];
                      return (
                        <tr key={yr}>
                          <td style={{ padding: "6px 10px", fontWeight: 600, borderBottom: `1px solid ${T.borderLight}` }}>{yr}°</td>
                          <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: 600, color: T.accent, borderBottom: `1px solid ${T.borderLight}` }}>{gv != null ? gv + "%" : "—"}</td>
                          <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: 600, color: av != null ? T.amber : T.textHint, borderBottom: `1px solid ${T.borderLight}` }}>{av != null ? av + "%" : "—"}</td>
                          <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: 600, color: pv != null ? T.purple : T.textHint, borderBottom: `1px solid ${T.borderLight}` }}>{pv != null ? pv + "%" : "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div style={{ display: "flex", gap: 16, fontSize: 11, color: T.textHint, marginBottom: 12 }}>
                  {[{ c: T.accent, l: "General (art. 21)" }, { c: T.amber, l: "AIT (art. 23)" }, { c: T.purple, l: "PFV (art. 25)" }].map(x => (
                    <span key={x.l} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: x.c, display: "inline-block" }} />{x.l}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {metaCat !== "comparativa" && METAS[metaCat] && (() => {
              const m = METAS[metaCat]; const cat = CATS.find(c => c.id === metaCat);
              return (
                <div>
                  {m.def && (
                    <NoteBox type="def">
                      <strong>{m.def.title}</strong> <span style={s.artRef}>{m.def.art}</span><br />{m.def.text}
                    </NoteBox>
                  )}
                  <p style={s.p}>{m.desc}<span style={s.artRef}>{m.art}</span></p>

                  {m.rows && (
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginBottom: 14 }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: "left", padding: "7px 10px", fontWeight: 600, fontSize: 11, color: T.textHint, borderBottom: `1px solid ${T.border}` }}>Año</th>
                          <th style={{ textAlign: "right", padding: "7px 10px", fontWeight: 600, fontSize: 11, color: T.textHint, borderBottom: `1px solid ${T.border}`, width: 70 }}>Meta</th>
                          <th style={{ padding: "7px 10px", borderBottom: `1px solid ${T.border}`, width: "38%" }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {m.rows.map((r, i) => (
                          <tr key={i}>
                            <td style={{ padding: "6px 10px", fontWeight: 600, borderBottom: `1px solid ${T.borderLight}` }}>{r[1]}</td>
                            <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: 600, borderBottom: `1px solid ${T.borderLight}`,
                              color: r[2] != null ? cat.color : T.textHint, fontVariantNumeric: "tabular-nums" }}>
                              {r[2] != null ? r[2] + "%" : (r[3] || "—")}
                            </td>
                            <td style={{ padding: "6px 10px", borderBottom: `1px solid ${T.borderLight}` }}>
                              <MetaBar pct={r[2]} max={m.max} color={cat.color} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {m.formula && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={s.h3}>Fórmula de cumplimiento<span style={s.artRef}>{m.formula.art}</span></div>
                      <div style={{ background: T.bgAlt, borderRadius: T.radius, padding: "12px 16px", fontFamily: T.fontMono,
                        fontSize: 13, lineHeight: 1.8, marginBottom: 8, color: T.accent, fontWeight: 600 }}>
                        {m.formula.expr}
                      </div>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <tbody>
                          {m.formula.vars.map((v, i) => (
                            <tr key={i}>
                              <td style={{ padding: "4px 10px", fontFamily: T.fontMono, fontSize: 12, color: T.accent, verticalAlign: "top", width: 110, fontWeight: 600 }}>{v[0]}</td>
                              <td style={{ padding: "4px 10px", fontSize: 12, color: T.textSec }}>{v[1]}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {m.weibull && <NoteBox type="def"><strong>Weibull:</strong> {m.weibull}</NoteBox>}

                  {metaCat === "pilas" && m.contabilizacion && (
                    <div>
                      <div style={s.h3}>Reglas de contabilización<span style={s.artRef}>Art. 5°</span></div>
                      {m.contabilizacion.map((r, i) => <p key={i} style={{ ...s.p, paddingLeft: 14, borderLeft: `2px solid ${T.borderLight}` }}>{r}</p>)}
                    </div>
                  )}

                  {m.notes && <NoteBox>{m.notes}</NoteBox>}

                  {QUOTES.filter(x => x.cat === metaCat).length > 0 && (
                    <div style={{ marginTop: 20 }}>
                      <ContextDivider />
                      {QUOTES.filter(x => x.cat === metaCat).map((x, i) => <QuoteCard key={i} q={x} />)}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* ═══ ACTORES ═══ */}
        {page === "actores" && (
          <div>
            <SearchBox value={search} onChange={setSearch} placeholder="Buscar por actor, obligación o palabra clave..." />
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
              <Chip active={actorFilter === "todos"} onClick={() => setActorFilter("todos")}>Todos</Chip>
              {ACTORS.map(a => (
                <Chip key={a.id} active={actorFilter === a.id} onClick={() => setActorFilter(a.id)}>{a.name.split(" ")[0]}</Chip>
              ))}
            </div>
            {filteredActors.length === 0 && <p style={{ textAlign: "center", color: T.textHint, padding: 32 }}>Sin resultados para "{search}"</p>}
            {filteredActors.map(a => (
              <div key={a.id} style={s.card}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 20 }}>{a.icon}</span>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>{a.name}</span>
                  <span style={s.artRef}>{a.ref}</span>
                </div>
                <p style={{ fontSize: 13, color: T.textSec, lineHeight: 1.75, margin: 0, fontFamily: T.font }}>{a.text}</p>
              </div>
            ))}
            <div style={{ marginTop: 20 }}>
              <ContextDivider />
              {QUOTES.filter(x => x.cat === "plazos" || x.cat === "actores").map((x, i) => <QuoteCard key={i} q={x} />)}
            </div>
          </div>
        )}

        {/* ═══ PLAZOS ═══ */}
        {page === "plazos" && (
          <div>
            <div style={s.h3}>Línea temporal del decreto</div>
            <div style={{ paddingLeft: 20, position: "relative", marginBottom: 28 }}>
              <div style={{ position: "absolute", left: 6, top: 8, bottom: 8, width: 1.5, background: T.border }} />
              {TIMELINE.map((t, i) => (
                <div key={i} style={{ position: "relative", padding: "10px 0 10px 20px" }}>
                  <div style={{
                    position: "absolute", left: -18, top: 16, width: 12, height: 12, borderRadius: "50%",
                    border: `2.5px solid ${T.accent}`, background: t.done ? T.accent : T.bg,
                    boxShadow: t.highlight ? `0 0 0 4px ${T.accentLight}` : "none",
                  }} />
                  <div style={{ fontWeight: 700, fontSize: 13, color: t.highlight ? T.accent : T.text }}>{t.date}</div>
                  <div style={{ fontSize: 13, color: T.textSec, marginTop: 2, fontFamily: T.font }}>{t.text}</div>
                </div>
              ))}
            </div>

            <div style={s.h3}>Cobertura territorial GRANSIC<span style={s.artRef}>Art. 31</span></div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginBottom: 20 }}>
              <tbody>
                {COBERTURA.map((c, i) => (
                  <tr key={i}>
                    <td style={{ padding: "8px 10px", fontWeight: 600, borderBottom: `1px solid ${T.borderLight}`, width: "35%" }}>{c.plazo}</td>
                    <td style={{ padding: "8px 10px", color: T.textSec, borderBottom: `1px solid ${T.borderLight}`, fontFamily: T.font }}>{c.criterio}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={s.h3}>Recolección domiciliaria<span style={s.artRef}>Art. 32</span></div>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 8 }}>
              {RECOLECCION.map((r, i) => (
                <div key={i} style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ height: Math.round(r.pct * 1.4), background: T.accent, borderRadius: "4px 4px 0 0",
                    opacity: 0.15 + (r.pct / 100) * 0.85, transition: "height 0.3s" }} />
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.accent, marginTop: 4 }}>{r.pct}%</div>
                  <div style={{ fontSize: 10, color: T.textHint }}>{r.plazo}</div>
                </div>
              ))}
            </div>
            <NoteBox>Mínimo dos campañas al año. Deben aceptar residuos de cualquier categoría, composición y antigüedad. Porcentaje sobre el total de viviendas del país.</NoteBox>

            <div style={{ marginTop: 20 }}>
              <ContextDivider />
              {QUOTES.filter(x => x.cat === "plazos").map((x, i) => <QuoteCard key={i} q={x} />)}
            </div>
          </div>
        )}

        {/* ═══ EXCLUSIONES ═══ */}
        {page === "exclusiones" && (
          <div>
            <SearchBox value={search} onChange={setSearch} placeholder="Buscar exclusión (ej: microempresa, transporte, plomo...)" />
            <p style={s.p}>A las siguientes pilas y AEE no les será aplicable la responsabilidad extendida del productor:</p>
            {filteredExcl.length === 0 && <p style={{ textAlign: "center", color: T.textHint, padding: 32 }}>Sin resultados para "{search}"</p>}
            {filteredExcl.map((e, i) => (
              <div key={i} style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: `1px solid ${T.borderLight}` }}>
                <span style={{ fontSize: 11, color: T.accent, fontWeight: 700, minWidth: 80, paddingTop: 2, fontFamily: T.fontMono }}>{e.ref}</span>
                <span style={{ fontSize: 13, color: T.textSec, lineHeight: 1.65, fontFamily: T.font }}>{e.text}</span>
              </div>
            ))}
          </div>
        )}

        {/* ═══ CONTEXTO ═══ */}
        {page === "contexto" && (
          <div>
            <SearchBox value={search} onChange={setSearch} placeholder="Buscar en citas y declaraciones..." />
            <div style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700,
              color: T.amber, background: T.amberLight, padding: "5px 12px", borderRadius: 20, marginBottom: 14 }}>
              Fuentes periodísticas verificadas
            </div>
            <p style={s.p}>
              Las siguientes declaraciones provienen de notas publicadas en medios especializados y del texto oficial del decreto.
              Las cifras de los Considerandos son estimaciones del MMA consignadas en el decreto, no datos de cumplimiento.
            </p>
            {filteredQuotes.length === 0 && <p style={{ textAlign: "center", color: T.textHint, padding: 32 }}>Sin resultados para "{search}"</p>}
            {filteredQuotes.map((x, i) => <QuoteCard key={i} q={x} />)}

            {/* Cobertura editorial País Circular */}
            <div style={{ marginTop: 28 }}>
              <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 18, marginBottom: 14 }}>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700,
                  color: T.accentDark, background: T.accentLight, padding: "4px 12px", borderRadius: 20,
                  letterSpacing: "0.02em",
                }}>
                  📰 Cobertura de País Circular
                </div>
              </div>
              <p style={s.p}>
                Seguimiento editorial del DS 22/2025 publicado en paiscircular.cl, desde los borradores en consulta hasta la toma de razón.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
                {COBERTURA_PC.map((c, i) => (
                  <a key={i} href={c.url} target="_blank" rel="noopener noreferrer" className="pc-card-link" style={{
                    display: "block", padding: "14px 16px", borderRadius: T.radius,
                    border: `1px solid ${T.border}`, background: T.bg, textDecoration: "none",
                    transition: "all 0.18s",
                  }}>
                    <div style={{
                      fontSize: 10, color: T.textHint, fontWeight: 600, letterSpacing: "0.04em",
                      textTransform: "uppercase", marginBottom: 6, fontFamily: T.fontSans,
                    }}>{c.date}</div>
                    <div style={{
                      fontSize: 13, fontWeight: 600, color: T.text, lineHeight: 1.4,
                      marginBottom: 10, fontFamily: T.fontSans,
                    }}>{c.title}</div>
                    <div style={{ fontSize: 11, color: T.accent, fontWeight: 600, fontFamily: T.fontSans }}>
                      Leer en País Circular →
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Webinar */}
            <div style={{ marginTop: 28 }}>
              <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 18, marginBottom: 14 }}>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700,
                  color: T.purple, background: "#F3F0FF", padding: "4px 12px", borderRadius: 20,
                  letterSpacing: "0.02em",
                }}>
                  🎥 Seminario web País Circular
                </div>
              </div>
              <div style={{
                border: `1px solid ${T.border}`, borderRadius: T.radius, padding: "16px 18px",
                background: T.bgAlt,
              }}>
                <div style={{
                  fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 6,
                  fontFamily: T.font, lineHeight: 1.3,
                }}>
                  {WEBINAR_PC.title}
                </div>
                <p style={{
                  fontSize: 13, color: T.textSec, lineHeight: 1.7, margin: "0 0 12px",
                  fontFamily: T.font,
                }}>
                  {WEBINAR_PC.desc}
                </p>
                <div style={{ fontSize: 11, color: T.textHint, fontWeight: 600, letterSpacing: "0.04em",
                  textTransform: "uppercase", marginBottom: 4, fontFamily: T.fontSans }}>
                  Moderador
                </div>
                <div style={{ fontSize: 13, color: T.text, marginBottom: 10, fontFamily: T.font }}>
                  {WEBINAR_PC.moderador}
                </div>
                <div style={{ fontSize: 11, color: T.textHint, fontWeight: 600, letterSpacing: "0.04em",
                  textTransform: "uppercase", marginBottom: 4, fontFamily: T.fontSans }}>
                  Panelistas
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: T.textSec,
                  lineHeight: 1.75, fontFamily: T.font }}>
                  {WEBINAR_PC.panelistas.map((p, i) => <li key={i}>{p}</li>)}
                </ul>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* FOOTER */}
      <div style={{ background: T.bgAlt, padding: "18px 24px", borderTop: `1px solid ${T.border}`, fontSize: 11,
        color: T.textHint, lineHeight: 1.75 }}>
        <strong style={{ color: T.textSec }}>Sección normativa:</strong> DS N° 22, de 17 julio 2025, MMA. Diario Oficial 7 mayo 2026. Todas las cifras y plazos provienen del texto oficial firmado.<br />
        <strong style={{ color: T.textSec }}>Sección editorial:</strong> Cifras de Considerandos son estimaciones del MMA. Declaraciones de País Circular, El Desconcierto, Carey, JDF Abogados.<br />
        <div style={{
          marginTop: 14, paddingTop: 12, borderTop: `1px solid ${T.borderLight}`,
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <img src="https://www.paiscircular.cl/wp-content/uploads/2022/08/cropped-Logo-Pais-Letras-Negras-270x270.png"
              alt="País Circular" style={{ height: 20, width: 20, objectFit: "contain" }} />
            <span>Elaborado por <strong style={{ color: T.text }}>País Circular</strong> · paiscircular.cl</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 10.5, color: T.textHint }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "3px 10px", borderRadius: 12,
              background: T.accentLight, color: T.accentDark, fontWeight: 600, letterSpacing: "0.02em",
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: "50%", background: T.accent, display: "inline-block",
              }} />
              v{META.version} · Última verificación: {META.reviewedAt}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ContextDivider() {
  return (
    <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 16, marginBottom: 14 }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700,
        color: T.amber, background: T.amberLight, padding: "4px 10px", borderRadius: 20 }}>
        💬 Contexto y voces del sector
      </div>
    </div>
  );
}
