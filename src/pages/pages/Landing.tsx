/*
 * KLK Ventures ERP — Landing / Overview page (route "pages/landing").
 *
 * Showcases KLK Ventures Private Limited manufacturing & enterprise operations:
 * - 6 Core Manufacturing Lines:
 *   1. Lithium Battery Packs
 *   2. Solar Water Pumps
 *   3. Solar Street Lights
 *   4. Solar Panels
 *   5. Rooftop Systems
 *   6. Metal Structure
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHead } from '../../components/shell/PageHead';
import { ApexChart } from '../../components/charts/ApexChart';
import { useCustomizer } from '../../context/CustomizerContext';

const CHECK = (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--ax-viz-emerald)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5l10 -10" /></svg>
);

const ACCENTS = ['verdigris', 'cobalt', 'indigo', 'amethyst', 'magenta', 'terracotta', 'amber', 'olive', 'forest', 'teal', 'slate', 'graphite'];

const CORE_LINES = [
  {
    id: 'lithium-batteries',
    title: 'Lithium Battery Packs',
    badge: 'Energy Storage',
    tagline: 'High-density LiFePO4 & NMC Battery Pack Assembly',
    desc: 'State-of-the-art automated cell testing, cell grading, ultrasonic wire bonding, laser welding, and active BMS integration for solar pumps, energy storage systems (BESS), and electric mobility.',
    metrics: [
      { label: 'Cycle Life', val: '4,000+ Cycles' },
      { label: 'Assembly Capacity', val: '120 MWh / Year' },
      { label: 'BMS Protection', val: 'Smart CAN / RS485' },
    ],
    features: ['Grade-A Prismatic & Cylindrical Cells', 'Multi-tier Thermal & Overcurrent Protection', 'Custom Form Factors for Solar & Telecom'],
  },
  {
    id: 'solar-pumps',
    title: 'Solar Water Pumps',
    badge: 'Agriculture & PM-KUSUM',
    tagline: 'High-Efficiency BLDC & AC Submersible / Surface Solar Pumps',
    desc: 'Empowering farmers under PM-KUSUM schemes with MNRE-approved solar irrigation pumping systems, MPPT smart controllers, remote monitoring (RMS), and solar PV arrays.',
    metrics: [
      { label: 'Pumping Capacity', val: '1 HP to 10 HP' },
      { label: 'Discharge Output', val: 'Up to 3,50,000 LPD' },
      { label: 'MNRE Certified', val: '100% Compliant' },
    ],
    features: ['Stainless Steel 304/316 Impellers', 'Vector Control Smart MPPT Inverters', 'Integrated GPRS/GSM Telemetry & GPS Tracking'],
  },
  {
    id: 'solar-street-lights',
    title: 'Solar Street Lights',
    badge: 'Smart Lighting',
    tagline: 'All-in-One & Split Luminary Solar Street Lighting Solutions',
    desc: 'High-lumen LED street lights with built-in high-efficiency MPPT charge controllers, LiFePO4 battery enclosures, optical PIR motion sensors, and automated dusk-to-dawn dimming profiles.',
    metrics: [
      { label: 'Luminaire Efficacy', val: '> 160 lm/W' },
      { label: 'Autonomy', val: '3+ Rain/Cloudy Days' },
      { label: 'Operating Life', val: '50,000+ Hours' },
    ],
    features: ['IP66 Die-Cast Aluminum Enclosures', 'High-Lumen Lumileds/Bridgelux Chips', 'Smart IoT Mesh Remote Dimming & Monitoring'],
  },
  {
    id: 'solar-panels',
    title: 'Solar Panels',
    badge: 'PV Modules',
    tagline: 'High-Efficiency Mono PERC & TOPCon Solar PV Modules',
    desc: 'Precision manufacturing line producing ALMM-listed, BIS-certified mono-crystalline PERC and bifacial glass-to-glass PV modules engineered for extreme weather resilience and maximum yield.',
    metrics: [
      { label: 'Module Output', val: 'Up to 590 Wp' },
      { label: 'Module Efficiency', val: '21.8% Peak' },
      { label: 'Linear Warranty', val: '25 Years Performance' },
    ],
    features: ['Multi-Busbar (MBB) & Half-Cut Cell Architecture', 'Anti-Reflective ARC Tempered Glass', 'Positive Power Tolerance (0 to +5W)'],
  },
  {
    id: 'rooftop-systems',
    title: 'Rooftop Systems',
    badge: 'Turnkey Solar',
    tagline: 'End-to-End On-Grid, Off-Grid & Hybrid Solar Solutions',
    desc: 'Comprehensive engineering, procurement, and construction (EPC) for residential, commercial & industrial rooftop installations with net-metering liaison and zero-export controllers.',
    metrics: [
      { label: 'Installed Base', val: '70+ MW Portfolio' },
      { label: 'Typical Payback', val: '3.5 - 4.5 Years' },
      { label: 'Subsidy Enabled', val: 'Direct National Portal' },
    ],
    features: ['Shadow Analysis & 3D Engineering Design', 'Grid Synchronized Inverters with Dual MPPT', 'Live Generation & Net-Export Mobile App'],
  },
  {
    id: 'metal-structure',
    title: 'Metal Structure',
    badge: 'Fabrication Line',
    tagline: 'Hot-Dip Galvanized & PosMAC Solar Mounting Structures',
    desc: 'Heavy-duty roll forming and fabrication facility producing ground-mounted MMS, ballasted rooftop non-penetrating structures, seasonal tilt frames, and solar tracker components.',
    metrics: [
      { label: 'Zinc Coating', val: '80 - 120 Microns' },
      { label: 'Wind Resistance', val: 'Up to 180 km/h' },
      { label: 'Structural Grade', val: 'IS 2062 / YS 350 MPa' },
    ],
    features: ['Hot-Dip Galvanization to IS 4759 Standards', 'Pre-Galvanized & Anodized Aluminum Clamps', 'Precision CNC Punched & Slot-Aligned Members'],
  },
];

const FAQS = [
  { q: 'What are KLK Ventures core manufacturing capabilities?', a: 'KLK Ventures operates dedicated manufacturing facilities for Lithium Battery Packs, Solar Water Pumps, Solar Street Lights, Mono PERC Solar PV Panels, Rooftop Systems, and Hot-Dip Galvanized Metal Mounting Structures.' },
  { q: 'Are KLK products approved by government bodies & schemes?', a: 'Yes. All solar modules, pumps, and lights conform to MNRE, BIS, IEC standards and are approved under national initiatives including PM-KUSUM, Rooftop Solar Schemes, and ALMM listings.' },
  { q: 'How does the KLK ERP system streamline operations?', a: 'KLK ERP coordinates inventory tracking, production bill of materials (BOM), quality test logs, dispatch manifests, warranty telemetry, and vendor management across all 6 manufacturing lines.' },
  { q: 'What warranties and service support does KLK provide?', a: 'Solar panels come with a 25-year linear performance warranty, lithium battery packs with 3-5 years warranty, solar pumps with 5 years warranty, and a nationwide on-ground service network.' },
];

const CERTIFICATIONS = [
  { name: 'MNRE Approved', icon: '☀️' },
  { name: 'BIS Certified', icon: '✓' },
  { name: 'ALMM Enlisted', icon: '⚡' },
  { name: 'ISO 9001:2015', icon: '★' },
  { name: 'Make In India', icon: '🇮🇳' },
];

const navLinkStyle: React.CSSProperties = { color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-sm)', fontWeight: 'var(--ax-weight-medium)' };
const footLinkStyle: React.CSSProperties = { fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' };
const footHeadStyle: React.CSSProperties = { margin: '0 0 var(--ax-space-3)', fontSize: 'var(--ax-text-xs)', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--ax-text-subtle)' };

export function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const { accent, setAccent, toggleTheme, themeResolved } = useCustomizer();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll);
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const smoothTo = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const t = document.getElementById(id);
    if (!t) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  };

  return (
    <>
      <PageHead title="KLK Ventures ERP" subtitle="Enterprise Manufacturing & Operations Portal" />

      {/* STICKY GLASS NAVBAR */}
      <header className={`ax-glass${scrolled ? ' is-scrolled' : ''}`} role="banner" style={{ position: 'sticky', top: 0, zIndex: 40, borderRadius: 0, borderInline: 0, borderBlockStart: 0, transition: 'background-color var(--ax-motion-base) var(--ax-ease-standard),box-shadow var(--ax-motion-base) var(--ax-ease-standard),border-color var(--ax-motion-base) var(--ax-ease-standard)', ...(scrolled ? { borderBlockEnd: '1px solid var(--ax-border)' } : { borderBlockEnd: '1px solid transparent', background: 'transparent', boxShadow: 'none' }) }}>
        <nav className="ax-cluster" aria-label="Primary" style={{ maxWidth: 1200, marginInline: 'auto', padding: 'var(--ax-space-3) var(--ax-space-6)', justifyContent: 'space-between', flexWrap: 'nowrap' }}>
          <Link to="/jammu/dashboard" className="ax-cluster" aria-label="KLK Ventures home" style={{ gap: 'var(--ax-space-3)', textDecoration: 'none', flexWrap: 'nowrap' }}>
            <img
              src="/logo-abbr.png"
              alt="KLK"
              style={{ width: 34, height: 34, objectFit: 'contain' }}
            />
            <span style={{ fontFamily: 'var(--ax-font-display)', fontWeight: 700, fontSize: 'var(--ax-text-lg)', color: 'var(--ax-text-strong)', letterSpacing: '.02em' }}>
              KLK VENTURES
            </span>
          </Link>

          <div className="ax-cluster ax-nav-desktop" style={{ gap: 'var(--ax-space-5)' }}>
            <a className="ax-link" href="#lines" style={navLinkStyle} onClick={(e) => smoothTo(e, 'lines')}>Manufacturing Lines</a>
            <a className="ax-link" href="#stats" style={navLinkStyle} onClick={(e) => smoothTo(e, 'stats')}>Scale &amp; Metrics</a>
            <a className="ax-link" href="#certifications" style={navLinkStyle} onClick={(e) => smoothTo(e, 'certifications')}>Certifications</a>
            <a className="ax-link" href="#faq" style={navLinkStyle} onClick={(e) => smoothTo(e, 'faq')}>FAQ</a>
          </div>

          <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', flexWrap: 'nowrap' }}>
            <button type="button" className="ax-btn ax-btn--ghost ax-btn--icon" onClick={() => toggleTheme()} aria-pressed={themeResolved === 'dark'} aria-label="Toggle dark mode">
              {themeResolved === 'dark'
                ? <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 12a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" /><path d="M3 12h1m8 -9v1m8 8h1m-9 8v1m-6.4 -15.4l.7 .7m12.1 -.7l-.7 .7m0 11.4l.7 .7m-12.1 -.7l-.7 .7" /></svg>
                : <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454l0 .008" /></svg>}
            </button>
            <Link className="ax-btn ax-btn--ghost ax-btn--sm ax-lp-signin" to="/login"><span className="ax-btn__label">Login</span></Link>
            <Link className="ax-btn ax-btn--primary ax-btn--sm" to="/jammu/dashboard"><span className="ax-btn__label">Go to ERP</span></Link>
          </div>
        </nav>
      </header>

      <main id="ax-main" style={{ position: 'relative', zIndex: 1 }}>

        {/* HERO SECTION */}
        <section style={{ maxWidth: 1200, marginInline: 'auto', padding: 'var(--ax-space-10) var(--ax-space-6) var(--ax-space-8)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--ax-space-5)' }}>
          <span className="ax-badge ax-badge--soft ax-badge--accent ax-badge--pill">
            <span className="ax-badge__dot" />KLK Ventures Private Limited · Operations Hub
          </span>
          <h1 style={{ margin: 0, maxWidth: '24ch', fontFamily: 'var(--ax-font-display)', fontSize: 'var(--ax-text-3xl)', fontWeight: 800, lineHeight: 1.12, letterSpacing: '-.02em', color: 'var(--ax-text-strong)' }}>
            Powering Clean Energy with <span style={{ position: 'relative', whiteSpace: 'nowrap', color: 'var(--ax-accent)' }}>6 Core Manufacturing Lines<svg viewBox="0 0 200 12" preserveAspectRatio="none" aria-hidden="true" style={{ position: 'absolute', left: 0, bottom: -6, width: '100%', height: 10 }}><path d="M2 8 Q 50 2 100 6 T 198 5" fill="none" stroke="var(--ax-accent)" strokeWidth={3} strokeLinecap="round" /></svg></span>.
          </h1>
          <p style={{ margin: 0, maxWidth: '64ch', fontSize: 'var(--ax-text-md)', color: 'var(--ax-text-muted)', lineHeight: 1.6 }}>
            Comprehensive enterprise operations, supply chain coordination, and quality engineering across Lithium Battery Packs, Solar Water Pumps, Solar Street Lights, Solar Panels, Rooftop Systems, and Metal Structures.
          </p>
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)', justifyContent: 'center' }}>
            <Link className="ax-btn ax-btn--primary ax-btn--lg" to="/jammu/dashboard">
              <span className="ax-btn__label">Enter ERP Dashboard</span>
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l14 0" /><path d="M13 18l6 -6" /><path d="M13 6l6 6" /></svg>
            </Link>
            <a className="ax-btn ax-btn--secondary ax-btn--lg" href="#lines" onClick={(e) => smoothTo(e, 'lines')}>
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 9l-7 7l-7 -7" /></svg>
              <span className="ax-btn__label">Explore Manufacturing</span>
            </a>
          </div>

          {/* MINI OVERVIEW CARD */}
          <div className="ax-glass" style={{ marginTop: 'var(--ax-space-6)', width: '100%', maxWidth: 980, borderRadius: 'var(--ax-radius-xl)', overflow: 'hidden', boxShadow: 'var(--ax-shadow-card)' }}>
            <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', padding: 'var(--ax-space-3) var(--ax-space-4)', borderBlockEnd: '1px solid var(--ax-border)' }}>
              <span style={{ width: 11, height: 11, borderRadius: '50%', background: 'var(--ax-viz-red)' }} />
              <span style={{ width: 11, height: 11, borderRadius: '50%', background: 'var(--ax-viz-amber)' }} />
              <span style={{ width: 11, height: 11, borderRadius: '50%', background: 'var(--ax-viz-emerald)' }} />
              <span className="ax-num" style={{ marginInlineStart: 'var(--ax-space-3)', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)', fontFamily: 'var(--ax-font-mono)' }}>klkindia.com · Manufacturing Telemetry</span>
            </div>
            <div style={{ padding: 'var(--ax-space-5)', background: 'var(--ax-canvas)' }}>
              <div className="ax-lp-kpis" style={{ display: 'grid', gap: 'var(--ax-space-3)', marginBottom: 'var(--ax-space-4)' }}>
                {[['Installed Capacity', '70+ MW'], ['Lithium Packs', '45,000+ Units'], ['Solar Pumps', '18,500+ Installed'], ['Structures Fabricated', '32,000 MT']].map(([k, v]) => (
                  <div key={k} className="ax-card" style={{ padding: 'var(--ax-space-3)' }}>
                    <div style={{ fontSize: 'var(--ax-text-2xs)', color: 'var(--ax-text-subtle)' }}>{k}</div>
                    <div className="ax-num" style={{ fontFamily: 'var(--ax-font-display)', fontWeight: 700, fontSize: 'var(--ax-text-lg)', color: 'var(--ax-text-strong)' }}>{v}</div>
                  </div>
                ))}
              </div>
              <div className="ax-card" style={{ padding: 'var(--ax-space-4)' }}>
                <ApexChart
                  type="area"
                  height={200}
                  legend="none"
                  color="--ax-accent"
                  ariaLabel="Monthly manufacturing output"
                  series={[{ name: 'Production Units (KW)', data: [4200, 5100, 6800, 7400, 8900, 9200, 11400, 12800, 13900, 15400, 16800, 18500] }]}
                  apex={{ stroke: { width: 2.5 } }}
                  style={{ minHeight: 200 }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* CERTIFICATIONS STRIP */}
        <section id="certifications" aria-label="Certifications & Standards" style={{ maxWidth: 1100, marginInline: 'auto', padding: '0 var(--ax-space-6) var(--ax-space-8)', textAlign: 'center' }}>
          <p style={{ margin: '0 0 var(--ax-space-4)', fontSize: 'var(--ax-text-xs)', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--ax-text-subtle)' }}>Certified by &amp; Complying with National Energy Standards</p>
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-6)', justifyContent: 'center', flexWrap: 'wrap', color: 'var(--ax-text-strong)' }}>
            {CERTIFICATIONS.map((c) => (
              <span key={c.name} className="ax-cluster" style={{ gap: 'var(--ax-space-2)', fontFamily: 'var(--ax-font-display)', fontWeight: 600, fontSize: 'var(--ax-text-sm)', background: 'var(--ax-surface-subtle)', padding: '6px 14px', borderRadius: 'var(--ax-radius-pill)', border: '1px solid var(--ax-border)' }}>
                <span>{c.icon}</span>{c.name}
              </span>
            ))}
          </div>
        </section>

        {/* CORE MANUFACTURING LINES SECTION */}
        <section id="lines" style={{ maxWidth: 1200, marginInline: 'auto', padding: 'var(--ax-space-8) var(--ax-space-6)', scrollMarginTop: 80 }}>
          <div style={{ textAlign: 'center', marginBottom: 'var(--ax-space-8)' }}>
            <span className="ax-eyebrow" style={{ display: 'block', marginBottom: 'var(--ax-space-2)' }}>Manufacturing Excellence</span>
            <h2 style={{ margin: 0, fontFamily: 'var(--ax-font-display)', fontSize: 'var(--ax-text-2xl)', fontWeight: 800, color: 'var(--ax-text-strong)', letterSpacing: '-.015em' }}>
              KLK Ventures Core Manufacturing Lines
            </h2>
            <p style={{ margin: 'var(--ax-space-2) auto 0', maxWidth: '58ch', fontSize: 'var(--ax-text-md)', color: 'var(--ax-text-muted)' }}>
              Engineered with precision testing, automated assembly lines, and rigorous ISO quality assurance.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 'var(--ax-space-6)' }}>
            {CORE_LINES.map((line, idx) => (
              <div key={line.id} className="ax-card ax-card--accent-edge" style={{ display: 'flex', flexDirection: 'column', height: '100%', margin: 0 }}>
                <div className="ax-card__header" style={{ paddingBottom: 'var(--ax-space-2)' }}>
                  <div className="ax-card__titles">
                    <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', marginBottom: 'var(--ax-space-2)' }}>
                      <span className="ax-badge ax-badge--soft ax-badge--accent ax-badge--pill">0{idx + 1}</span>
                      <span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--pill">{line.badge}</span>
                    </div>
                    <h3 style={{ margin: 0, fontFamily: 'var(--ax-font-display)', fontSize: 'var(--ax-text-lg)', fontWeight: 700, color: 'var(--ax-text-strong)' }}>
                      {line.title}
                    </h3>
                    <p style={{ margin: '4px 0 0', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-accent)', fontWeight: 600 }}>
                      {line.tagline}
                    </p>
                  </div>
                </div>
                <div className="ax-card__body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-4)', flex: '1 1 auto', paddingTop: 0 }}>
                  <p style={{ margin: 0, fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)', lineHeight: 1.6 }}>
                    {line.desc}
                  </p>

                  {/* Metrics grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, padding: 'var(--ax-space-3)', background: 'var(--ax-surface-subtle)', borderRadius: 'var(--ax-radius-md)' }}>
                    {line.metrics.map((m) => (
                      <div key={m.label} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 'var(--ax-text-2xs)', color: 'var(--ax-text-subtle)', textTransform: 'uppercase', letterSpacing: '.04em' }}>{m.label}</div>
                        <div className="ax-num" style={{ fontFamily: 'var(--ax-font-display)', fontWeight: 700, fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-strong)', marginTop: 2 }}>{m.val}</div>
                      </div>
                    ))}
                  </div>

                  {/* Feature checklist */}
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-2)', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text)' }}>
                    {line.features.map((f) => (
                      <li key={f} className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}>
                        {CHECK}<span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <div style={{ marginTop: 'auto', paddingTop: 'var(--ax-space-2)' }}>
                    <Link className="ax-btn ax-btn--secondary ax-btn--block ax-btn--sm" to="/ecommerce/products">
                      <span>View Specifications</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* STATS BAND */}
        <section id="stats" aria-label="Manufacturing Scale" style={{ borderBlock: '1px solid var(--ax-border)', scrollMarginTop: 80, background: 'var(--ax-surface-subtle)' }}>
          <div style={{ maxWidth: 1100, marginInline: 'auto', padding: 'var(--ax-space-8) var(--ax-space-6)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 'var(--ax-space-6)', textAlign: 'center' }}>
            {[
              ['6', 'Core Manufacturing Lines'],
              ['70+ MW', 'Solar Installation Track Record'],
              ['45,000+', 'Battery Packs Deployed'],
              ['100%', 'Make In India Indigenous Assembly'],
            ].map(([n, l]) => (
              <div key={l}>
                <div className="ax-num" style={{ fontFamily: 'var(--ax-font-display)', fontSize: 'var(--ax-text-3xl)', fontWeight: 800, color: 'var(--ax-accent)' }}>{n}</div>
                <div style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)', marginTop: 4 }}>{l}</div>
              </div>
            ))}
          </div>
        </section>

        {/* LIVE ACCENT PICKER PREVIEW */}
        <section style={{ maxWidth: 1100, marginInline: 'auto', padding: 'var(--ax-space-8) var(--ax-space-6)' }}>
          <div className="ax-card" style={{ padding: 'var(--ax-space-6)', borderRadius: 'var(--ax-radius-xl)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--ax-space-6)', alignItems: 'center' }}>
              <div>
                <span className="ax-eyebrow" style={{ display: 'block', marginBottom: 'var(--ax-space-2)' }}>Dynamic ERP Theme</span>
                <h3 style={{ margin: 0, fontFamily: 'var(--ax-font-display)', fontSize: 'var(--ax-text-xl)', fontWeight: 700, color: 'var(--ax-text-strong)' }}>
                  Tailored Operations Experience
                </h3>
                <p style={{ margin: 'var(--ax-space-2) 0 0', fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)', lineHeight: 1.6 }}>
                  Select an accent to customize your KLK ERP dashboard interface live across all production monitors and field devices.
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-3)' }}>
                <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', flexWrap: 'wrap' }} role="group" aria-label="Accent preset picker">
                  {ACCENTS.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setAccent(a)}
                      aria-pressed={accent === a}
                      aria-label={`Use ${a} accent`}
                      data-ax-accent={a}
                      style={{ position: 'relative', width: 36, height: 36, borderRadius: 'var(--ax-radius-md)', cursor: 'pointer', border: '1px solid var(--ax-border)', background: 'var(--ax-accent)' }}
                    >
                      {accent === a && <span className="ax-grid" aria-hidden="true" style={{ position: 'absolute', inset: 0, placeItems: 'center', color: 'var(--ax-on-accent)' }}><svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5l10 -10" /></svg></span>}
                    </button>
                  ))}
                </div>
                <span className="ax-num" style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>Current accent: {accent} · Dark / Light auto-switching</span>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section id="faq" style={{ maxWidth: 780, marginInline: 'auto', padding: 'var(--ax-space-8) var(--ax-space-6)', scrollMarginTop: 80 }}>
          <div style={{ textAlign: 'center', marginBottom: 'var(--ax-space-6)' }}>
            <span className="ax-eyebrow" style={{ display: 'block', marginBottom: 'var(--ax-space-2)' }}>Frequently Asked Questions</span>
            <h2 style={{ margin: 0, fontFamily: 'var(--ax-font-display)', fontSize: 'var(--ax-text-2xl)', fontWeight: 700, color: 'var(--ax-text-strong)', letterSpacing: '-.015em' }}>
              Manufacturing &amp; Deployment Queries
            </h2>
          </div>
          <div className="ax-accordion ax-accordion--bordered">
            {FAQS.map((q, i) => (
              <div key={i} className="ax-accordion__item">
                <button type="button" className="ax-accordion__header" aria-expanded={openFaq === i} onClick={() => setOpenFaq(openFaq === i ? -1 : i)} aria-controls={`faq-panel-${i}`}>
                  <span className="ax-accordion__title">{q.q}</span>
                  <svg className="ax-accordion__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6l6 -6" /></svg>
                </button>
                {openFaq === i && (
                  <div className="ax-accordion__panel" id={`faq-panel-${i}`}>
                    <p style={{ margin: 0, lineHeight: 1.6 }}>{q.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* CTA CALLOUT */}
        <section aria-label="Access ERP" style={{ maxWidth: 1100, marginInline: 'auto', padding: '0 var(--ax-space-6) var(--ax-space-10)' }}>
          <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 'var(--ax-radius-xl)', padding: 'var(--ax-space-8) var(--ax-space-6)', textAlign: 'center', background: 'var(--ax-gradient-accent)', color: 'var(--ax-on-accent)', boxShadow: '0 24px 60px -24px rgba(var(--ax-accent-rgb),.6)' }}>
            <h2 style={{ margin: 0, position: 'relative', fontFamily: 'var(--ax-font-display)', fontSize: 'var(--ax-text-2xl)', fontWeight: 800, letterSpacing: '-.015em', color: 'var(--ax-on-accent)' }}>
              KLK Ventures ERP Portal
            </h2>
            <p style={{ margin: 'var(--ax-space-3) auto var(--ax-space-5)', position: 'relative', maxWidth: '52ch', fontSize: 'var(--ax-text-md)', opacity: 0.95 }}>
              Access operations dashboards, material tracking, vendor submissions, and daily production reports.
            </p>
            <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)', justifyContent: 'center', position: 'relative' }}>
              <Link className="ax-btn ax-btn--solid ax-btn--lg" to="/login">
                <span className="ax-btn__label">Sign In to ERP</span>
              </Link>
              <Link className="ax-btn ax-btn--lg" to="/jammu/dashboard" style={{ background: 'rgba(255,255,255,.16)', color: 'var(--ax-on-accent)', borderColor: 'rgba(255,255,255,.28)' }}>
                <span className="ax-btn__label">Jammu Operations</span>
              </Link>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer role="contentinfo" style={{ borderBlockStart: '1px solid var(--ax-border)' }}>
          <div style={{ maxWidth: 1100, marginInline: 'auto', padding: 'var(--ax-space-8) var(--ax-space-6) var(--ax-space-6)' }}>
            <div className="ax-lp-footer" style={{ display: 'grid', gap: 'var(--ax-space-6)', alignItems: 'start' }}>
              <div>
                <Link to="/" className="ax-cluster" aria-label="KLK Ventures home" style={{ gap: 'var(--ax-space-3)', textDecoration: 'none', marginBottom: 'var(--ax-space-3)' }}>
                  <img src="/logo-abbr.png" alt="KLK" style={{ width: 34, height: 34, objectFit: 'contain' }} />
                  <span style={{ fontFamily: 'var(--ax-font-display)', fontWeight: 700, fontSize: 'var(--ax-text-md)', color: 'var(--ax-text-strong)' }}>
                    KLK VENTURES
                  </span>
                </Link>
                <p style={{ margin: 0, maxWidth: '34ch', fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>
                  KLK Ventures Private Limited — Core Manufacturing in Solar Panels, Lithium Batteries, Pumps, Lights, Rooftop &amp; Structures.
                </p>
                <p style={{ margin: 'var(--ax-space-2) 0 0', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>
                  Regd. Office: 1517, Hemkunt Chambers 89, Nehru Place, New Delhi 110019<br />
                  Corporate Office: A 52, Sector 58, Noida, UP 201301
                </p>
              </div>
              <nav aria-label="Manufacturing Lines">
                <h3 style={footHeadStyle}>Core Lines</h3>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-2)' }}>
                  <li><a className="ax-link" href="#lines" onClick={(e) => smoothTo(e, 'lines')} style={footLinkStyle}>Lithium Battery Packs</a></li>
                  <li><a className="ax-link" href="#lines" onClick={(e) => smoothTo(e, 'lines')} style={footLinkStyle}>Solar Water Pumps</a></li>
                  <li><a className="ax-link" href="#lines" onClick={(e) => smoothTo(e, 'lines')} style={footLinkStyle}>Solar Street Lights</a></li>
                  <li><a className="ax-link" href="#lines" onClick={(e) => smoothTo(e, 'lines')} style={footLinkStyle}>Solar Panels</a></li>
                  <li><a className="ax-link" href="#lines" onClick={(e) => smoothTo(e, 'lines')} style={footLinkStyle}>Rooftop Systems</a></li>
                  <li><a className="ax-link" href="#lines" onClick={(e) => smoothTo(e, 'lines')} style={footLinkStyle}>Metal Structure</a></li>
                </ul>
              </nav>
              <nav aria-label="Operations">
                <h3 style={footHeadStyle}>Operations</h3>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-2)' }}>
                  <li><Link className="ax-link" to="/jammu/dashboard" style={footLinkStyle}>Jammu Dashboard</Link></li>
                  <li><Link className="ax-link" to="/ecommerce/products" style={footLinkStyle}>Products &amp; Inventory</Link></li>
                  <li><Link className="ax-link" to="/ecommerce/invoices" style={footLinkStyle}>Invoices &amp; Billing</Link></li>
                  <li><Link className="ax-link" to="/apps/contacts" style={footLinkStyle}>Vendor Directory</Link></li>
                </ul>
              </nav>
              <nav aria-label="Support">
                <h3 style={footHeadStyle}>Support</h3>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-2)' }}>
                  <li><a className="ax-link" href="mailto:info@klkindia.com" style={footLinkStyle}>info@klkindia.com</a></li>
                  <li><a className="ax-link" href="tel:+911204549038" style={footLinkStyle}>+91 120 4549038</a></li>
                  <li><Link className="ax-link" to="/pages/terms" style={footLinkStyle}>Terms of Service</Link></li>
                  <li><Link className="ax-link" to="/pages/privacy" style={footLinkStyle}>Privacy Policy</Link></li>
                </ul>
              </nav>
            </div>
            <hr className="ax-divider" style={{ marginBlock: 'var(--ax-space-6)' }} aria-hidden="true" />
            <div className="ax-cluster" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--ax-space-3)' }}>
              <span className="ax-num" style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>
                © 2026 KLK Ventures Private Limited · CIN: U74110DL1995PTC069526
              </span>
              <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>
                www.klkindia.com
              </span>
            </div>
          </div>
        </footer>
      </main>

      <style>{`
        .ax-lp-kpis { grid-template-columns: repeat(4, minmax(0, 1fr)); }
        .ax-lp-footer { grid-template-columns: 1.6fr repeat(3, minmax(0, 1fr)); }
        @media (max-width: 992px) {
          .ax-lp-footer { grid-template-columns: 1fr 1fr; }
          .ax-lp-footer > :first-child { grid-column: 1 / -1; }
        }
        @media (max-width: 768px) { .ax-nav-desktop { display: none !important; } }
        @media (max-width: 640px) {
          .ax-lp-kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .ax-lp-footer { grid-template-columns: 1fr; }
        }
        @media (max-width: 380px) { .ax-lp-signin { display: none; } }
        @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto !important; } }
      `}</style>
    </>
  );
}

export default Landing;
