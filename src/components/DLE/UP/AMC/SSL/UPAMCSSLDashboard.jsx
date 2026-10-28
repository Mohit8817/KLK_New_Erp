import { lazy, Suspense, useCallback, useEffect, useMemo, useState, useDeferredValue } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';

// Code-split ApexCharts so UP AMC SSL Dashboard shell and data tables render instantly
const ApexChart = lazy(() => import('../../../../charts/ApexChart').then((m) => ({ default: m.ApexChart })));
import { Pagination, usePagination, SearchInput, TableExportToolbar } from '../../../../../common';

// ─── Theme Colors ─────────────────────────────────────────────────────────────
const LIGHT_BLUE = '#2f7df2';
const LIGHT_GREEN = '#86DDB2';
const LIGHT_AMBER = '#F6D68A';
const LIGHT_RED = '#f87171';
const LIGHT_VIOLET = '#a78bfa';

// ─── Responsive Chart Height Hook ─────────────────────────────────────────────
const useChartHeight = (desktop, mobile) => {
  const pick = () => (typeof window !== 'undefined' && window.innerWidth < 640 ? mobile : desktop);
  const [h, setH] = useState(pick);
  useEffect(() => {
    const onResize = () => setH(pick());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [desktop, mobile]);
  return h;
};

// ─── Helper Functions ─────────────────────────────────────────────────────────
const cv = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const num = (x) => (x ?? 0).toLocaleString('en-IN');
const pad = (x) => String(x).padStart(2, '0');
const pctOf = (a, b) => (b ? Math.round((a / b) * 1000) / 10 : 0);
const fmtTime = (d) => d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();
const escapeHtml = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ─── Scoped Styling Matching DLE Template ─────────────────────────────────────
const PAGE_CSS = `
  .solar-erp-page .ax-page-head { margin-block-end: 10px; }
  .solar-erp-page .ax-page-head .ax-breadcrumb { margin-block-end: 4px; }
  .solar-erp-page .ax-dash-grid { margin-top: 0; }
  .solar-erp-page .ax-card { min-width: 0; }
  .solar-erp-page .ax-card__footer { width: 100%; box-sizing: border-box; }
  .solar-erp-page .ula-pagination-left {
    width: 100%; display: flex; justify-content: flex-start; align-items: center; margin: 0; overflow-x: auto;
  }
  .solar-erp-page .ula-pagination-left > * { margin-left: 0 !important; margin-right: 0 !important; }

  /* Card header: desktop layout */
  .solar-erp-page .ax-card__header {
    display: flex;
    flex-wrap: nowrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }
  .solar-erp-page .ax-card__titles {
    flex: 1 1 220px;
    min-width: 220px;
    max-width: 100%;
  }
  .solar-erp-page .ax-card__title,
  .solar-erp-page .ax-card__eyebrow,
  .solar-erp-page .ax-card__subtitle {
    max-width: none;
    word-break: normal;
    overflow-wrap: normal;
    hyphens: none;
  }
  .solar-erp-page .ax-card__subtitle { line-height: 1.45; }

  .solar-erp-page .ax-card__actions {
    flex: 0 1 auto;
    min-width: 0;
    margin-left: auto;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex-wrap: nowrap;
    gap: 8px;
  }
  .solar-erp-page .ax-card__actions .ax-cluster {
    flex-wrap: nowrap !important;
    min-width: 0;
    justify-content: flex-end;
  }

  /* Search input responsiveness */
  .solar-erp-page .ax-card__actions .ax-search,
  .solar-erp-page .ax-card__actions [class*="search"] {
    flex: 1 1 140px;
    min-width: 90px;
    max-width: 260px;
  }
  .solar-erp-page .ax-card__actions input { min-width: 0; width: 100%; }

  /* Export toolbar */
  .solar-erp-page .ax-card__actions .ax-export-toolbar,
  .solar-erp-page .ax-card__actions [class*="export-toolbar"] {
    flex: 0 1 auto;
    min-width: 0;
    flex-wrap: nowrap;
    gap: 4px;
  }
  .solar-erp-page .ax-export-toolbar__button {
    padding-inline: 8px !important;
    min-width: 0;
  }

  /* Tables: responsive scroll container */
  .solar-erp-page .ax-table-wrap,
  .solar-erp-page .ax-table-wrapper {
    width: 100%;
    max-width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  .solar-erp-page .ax-table { min-width: 480px; }
  .solar-erp-page .ax-welcome__lede { max-width: 780px; }

  /* Filter bar items */
  .solar-erp-page .dle-filter-item { display: flex; align-items: center; gap: 6px; }
  .solar-erp-page .dle-filter-item select { width: 145px; }

  /* Tablet (<=1100px) */
  @media (max-width: 1100px) {
    .solar-erp-page .ax-col--8,
    .solar-erp-page .ax-col--6,
    .solar-erp-page .ax-col--4 { grid-column: span 12; }
    .solar-erp-page .ax-col--3 { grid-column: span 6; }

    .solar-erp-page .ax-export-toolbar__button {
      font-size: 0;
      gap: 0;
      padding: 0 8px !important;
      justify-content: center;
    }
    .solar-erp-page .ax-export-toolbar__button svg {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
    }
    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] { max-width: 200px; }
  }

  /* Mobile (<=760px) */
  @media (max-width: 760px) {
    .solar-erp-page {
      width: 100%;
      max-width: 100%;
      overflow-x: hidden;
      box-sizing: border-box;
    }
    .solar-erp-page .ax-welcome__stats {
      display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px;
    }
    .solar-erp-page .ax-grid--2 {
      grid-template-columns: 1fr !important;
    }
    .solar-erp-page .dle-filter-item { width: 100%; justify-content: space-between; }
    .solar-erp-page .dle-filter-item select { flex: 1; width: auto; max-width: 100%; }

    .solar-erp-page .ax-card__header {
      flex-direction: column;
      flex-wrap: nowrap;
      align-items: stretch;
      gap: 10px;
    }
    .solar-erp-page .ax-card__titles {
      flex: 0 0 auto;
      min-width: 0;
      width: 100%;
      max-width: 100%;
    }
    .solar-erp-page .ax-card__title {
      font-family: var(--ax-font-display);
      font-size: var(--ax-text-md);
      line-height: var(--ax-leading-md);
    }
    .solar-erp-page .ax-card__actions {
      flex: 0 0 auto;
      width: 100%;
      margin-left: 0;
      flex-wrap: wrap;
      justify-content: flex-start;
    }
    .solar-erp-page .ax-card__actions .ax-cluster {
      flex-wrap: wrap !important;
      width: 100%;
      justify-content: flex-start;
      gap: 8px;
    }
    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] {
      flex: 1 1 100%;
      width: 100%;
      max-width: 100%;
      min-width: 0;
    }
    .solar-erp-page .ax-card__actions .ax-export-toolbar,
    .solar-erp-page .ax-card__actions [class*="export-toolbar"] {
      flex: 1 1 100%;
      flex-wrap: wrap;
      justify-content: flex-start;
      gap: 6px;
    }
    .solar-erp-page .ax-export-toolbar__button {
      font-size: 12px;
      gap: 4px;
      height: 30px;
      padding: 0 8px !important;
    }
  }

  /* Small phones (<=490px) */
  @media (max-width: 490px) {
    .solar-erp-page .ax-welcome__stats {
      grid-template-columns: 1fr !important;
    }
    .solar-erp-page .ax-col--3 { grid-column: span 12; }
    .solar-erp-page .ax-export-toolbar__button {
      font-size: 11px;
      height: 28px;
      padding: 0 6px !important;
    }
  }
`;

// ─── SVG Icons (Template Tabler Style) ─────────────────────────────────────────
const svg = (children) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);
const I_REFRESH = svg(<><path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" /><path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" /></>);
const I_FILTER = (
  <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 4h16v2.172a2 2 0 0 1 -.586 1.414l-4.828 4.828v7.586l-4 -2v-5.586l-4.828 -4.828a2 2 0 0 1 -.586 -1.414v-2.172z" /></svg>
);const I_PIN = svg(<><path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /><path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0" /></>);
const I_USERS = svg(<><path d="M9 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" /><path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /><path d="M21 21v-2a4 4 0 0 0 -3 -3.85" /></>);
const I_BOLT = svg(<path d="M13 3l0 7l6 0l-8 11l0 -7l-6 0l8 -11" />);
const I_LIST = svg(<><path d="M9 6l11 0" /><path d="M9 12l11 0" /><path d="M9 18l11 0" /><path d="M5 6l0 .01" /><path d="M5 12l0 .01" /><path d="M5 18l0 .01" /></>);
const I_CLOCK = svg(<><path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M12 7v5l3 3" /></>);
const I_DONE = svg(<><path d="M7 12l5 5l10 -10" /><path d="M2 12l5 5m5 -5l5 -5" /></>);
const I_X = svg(<><path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M10 10l4 4m0 -4l-4 4" /></>);
const I_SUN = svg(<><circle cx="12" cy="12" r="4" /><path d="M3 12h1m8 -9v1m8 8h1m-9 8v1M5.6 5.6l.7 .7m12.1 -.7l-.7 .7m0 11.4l.7 .7m-12.1 -.7l-.7 .7" /></>);

// ─── KPI Card Component (Matching DLEDashboard) ──────────────────────────────
const TONE = {
  accent: { bg: 'rgba(var(--ax-accent-rgb), 0.12)', fg: 'var(--ax-accent)', apex: '--ax-accent' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan) 14%, transparent)', fg: 'var(--ax-viz-cyan)', apex: '--ax-viz-cyan' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald) 14%, transparent)', fg: 'var(--ax-viz-emerald)', apex: '--ax-viz-emerald' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber) 14%, transparent)', fg: 'var(--ax-viz-amber)', apex: '--ax-viz-amber' },
  violet: { bg: 'color-mix(in oklab, var(--ax-viz-violet) 14%, transparent)', fg: 'var(--ax-viz-violet)', apex: '--ax-viz-violet' },
  pink: { bg: 'color-mix(in oklab, var(--ax-viz-pink) 14%, transparent)', fg: 'var(--ax-viz-pink)', apex: '--ax-viz-pink' },
  red: { bg: 'color-mix(in oklab, var(--ax-viz-red) 14%, transparent)', fg: 'var(--ax-viz-red)', apex: '--ax-viz-red' },
};

function KpiCard({ icon, tone = 'accent', label, value, unit, sub, badge, spark, sparkType = 'line', onClick }) {
  const t = TONE[tone] || TONE.accent;
  const hasSpark = Array.isArray(spark) && spark.length > 1;
  const allZeros = hasSpark && spark.every((v) => v === 0);
  const safeSpark = allZeros ? [0, 1, 0, 1, 0, 0, 1] : spark;

  return (
    <div
      className="ax-card ax-col--3"
      role={onClick ? 'button' : 'region'}
      tabIndex={onClick ? 0 : undefined}
      aria-label={label}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
      style={{
        borderRadius: 'var(--ax-radius-lg)',
        background: 'var(--ax-bg-surface)',
        cursor: onClick ? 'pointer' : undefined,
        transition: 'transform 160ms ease, box-shadow 160ms ease',
      }}
    >
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <span style={{ width: 28, height: 28, borderRadius: 'var(--ax-radius-md)', background: t.bg, color: t.fg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ width: 16, height: 16, display: 'inline-flex' }}>{icon}</span>
            </span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ax-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
          </div>
          {badge && (
            <span className="ax-kpi__delta ax-kpi__delta--up" style={{ fontSize: '11px', padding: '1px 6px', flexShrink: 0 }}>
              {badge}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--ax-font-display)', fontSize: '1.35rem', fontWeight: 700, lineHeight: 1.1, color: 'var(--ax-text-strong)', fontVariantNumeric: 'tabular-nums' }}>
              {value} {unit && <small style={{ fontSize: '11px', fontWeight: 500, color: 'var(--ax-text-muted)' }}>{unit}</small>}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--ax-text-muted)', marginTop: '2px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div>
          </div>
          {hasSpark && (
            <div style={{ width: 68, height: 26, overflow: 'hidden', flexShrink: 0 }}>
              <Suspense fallback={<div style={{ width: 68, height: 26 }} />}>
                <ApexChart
                  key={`${label}-${safeSpark.join(',')}-${sparkType}`}
                  type={sparkType}
                  sparkline
                  tooltip={false}
                  height={26}
                  color={t.apex}
                  series={[{ name: label, data: safeSpark }]}
                  style={{ minHeight: 26, width: 68 }}
                  apex={{
                    yaxis: { min: 0, forceNiceScale: true },
                    plotOptions: { bar: { columnWidth: '60%', borderRadius: 2 } },
                  }}
                />
              </Suspense>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Static Mock Data: Uttar Pradesh AMC SSL Operations ───────────────────────
const UP_DISTRICTS_STATIC = [
  { district: 'LUCKNOW', totalLights: 1420, working: 1328, faulty: 92, inspected: 1210, pending: 210, activeDles: 6, blocks: ['Bakshi Ka Talab', 'Malihabad', 'Sarojini Nagar', 'Mohanlalganj', 'Chinhat', 'Gosainganj'] },
  { district: 'VARANASI', totalLights: 1280, working: 1195, faulty: 85, inspected: 1080, pending: 200, activeDles: 5, blocks: ['Kashi Vidyapeeth', 'Pindra', 'Cholapur', 'Araziline', 'Sewapuri', 'Harahua'] },
  { district: 'PRAYAGRAJ', totalLights: 1350, working: 1240, faulty: 110, inspected: 1110, pending: 240, activeDles: 6, blocks: ['Soraon', 'Phulpur', 'Karchhana', 'Bahria', 'Mauaima', 'Shankargarh'] },
  { district: 'GORAKHPUR', totalLights: 1150, working: 1068, faulty: 82, inspected: 960, pending: 190, activeDles: 5, blocks: ['Chargawan', 'Pipraich', 'Sahjanwa', 'Bansgaon', 'Campierganj'] },
  { district: 'AYODHYA', totalLights: 980, working: 915, faulty: 65, inspected: 840, pending: 140, activeDles: 4, blocks: ['Sohawal', 'Milkipur', 'Pura Bazar', 'Rudauli', 'Bikapur'] },
  { district: 'KANPUR NAGAR', totalLights: 1120, working: 1025, faulty: 95, inspected: 910, pending: 210, activeDles: 5, blocks: ['Kalyanpur', 'Bilhaur', 'Chaubeypur', 'Ghatampur', 'Sarsaul'] },
  { district: 'MEERUT', totalLights: 860, working: 792, faulty: 68, inspected: 720, pending: 140, activeDles: 4, blocks: ['Daurala', 'Sardhana', 'Mawana', 'Hastinapur', 'Rohta'] },
  { district: 'BAREILLY', totalLights: 940, working: 860, faulty: 80, inspected: 780, pending: 160, activeDles: 4, blocks: ['Bhojipura', 'Faridpur', 'Nawabganj', 'Mirganj', 'Baheri'] },
  { district: 'JHANSI', totalLights: 780, working: 710, faulty: 70, inspected: 640, pending: 140, activeDles: 3, blocks: ['Badagaon', 'Mauranipur', 'Babina', 'Moth', 'Gursarai'] },
  { district: 'ALIGARH', totalLights: 820, working: 755, faulty: 65, inspected: 670, pending: 150, activeDles: 4, blocks: ['Khair', 'Iglas', 'Atrauli', 'Gonda', 'Jawan'] },
  { district: 'AGRA', totalLights: 910, working: 835, faulty: 75, inspected: 740, pending: 170, activeDles: 4, blocks: ['Fatehabad', 'Bah', 'Khandauli', 'Achhnera', 'Barauli Ahir'] },
  { district: 'MORADABAD', totalLights: 720, working: 662, faulty: 58, inspected: 590, pending: 130, activeDles: 3, blocks: ['Kanth', 'Bilari', 'Moradabad', 'Thakurdwara', 'Kundarki'] },
  { district: 'AZAMGARH', totalLights: 850, working: 778, faulty: 72, inspected: 680, pending: 170, activeDles: 4, blocks: ['Palhana', 'Bilariyaganj', 'Lalganj', 'Phoolpur', 'Mehnagar'] },
  { district: 'GHAZIPUR', totalLights: 680, working: 622, faulty: 58, inspected: 550, pending: 130, activeDles: 3, blocks: ['Mohammadabad', 'Zamania', 'Saidpur', 'Karanda', 'Sadat'] },
  { district: 'MIRZAPUR', totalLights: 540, working: 494, faulty: 46, inspected: 440, pending: 100, activeDles: 3, blocks: ['Chunar', 'Marihan', 'City', 'Kalyanpur', 'Pahara'] },
  { district: 'BASTI', totalLights: 490, working: 448, faulty: 42, inspected: 400, pending: 90, activeDles: 2, blocks: ['Harraiya', 'Rudhauli', 'Basti Sadar', 'Kaptanganj'] },
  { district: 'HARDOI', totalLights: 460, working: 420, faulty: 40, inspected: 370, pending: 90, activeDles: 2, blocks: ['Bilgram', 'Sandila', 'Sandi', 'Kachhauna'] },
  { district: 'SITAPUR', totalLights: 500, working: 456, faulty: 44, inspected: 400, pending: 100, activeDles: 2, blocks: ['Biswan', 'Laharpur', 'Maholi', 'Sidhauli'] },
];

const RECENT_SURVEYS_STATIC = [
  { id: '1', sslId: 'UP-SSL-LKO-001', district: 'LUCKNOW', block: 'Bakshi Ka Talab', panchayat: 'Itaunja', pole: 'Pole #14', beneficiary: 'Ram Prasad Sharma', amcDate: '20-10-2026', nextAmcDate: '20-01-2027', quarter: 'Q3 2026-27', lightWorking: true, complaint: 'No', approval: 'Approved', surveyor: 'Sunil Verma', remarks: 'Luminary clean, battery 12.8V, dusk-to-dawn sensor checked.' },
  { id: '2', sslId: 'UP-SSL-LKO-002', district: 'LUCKNOW', block: 'Bakshi Ka Talab', panchayat: 'Itaunja', pole: 'Pole #15', beneficiary: 'Mohan Lal Verma', amcDate: '20-10-2026', nextAmcDate: '20-01-2027', quarter: 'Q3 2026-27', lightWorking: true, complaint: 'No', approval: 'Approved', surveyor: 'Sunil Verma', remarks: 'Normal working condition. Solar panel cleaned.' },
  { id: '3', sslId: 'UP-SSL-VNS-045', district: 'VARANASI', block: 'Kashi Vidyapeeth', panchayat: 'Shivpur', pole: 'Pole #08', beneficiary: 'Santosh Maurya', amcDate: '19-10-2026', nextAmcDate: '19-01-2027', quarter: 'Q3 2026-27', lightWorking: false, complaint: 'Raised', approval: 'Pending', surveyor: 'Ramesh Chandra', remarks: 'LED Driver faulty. Spare requested for replacement.' },
  { id: '4', sslId: 'UP-SSL-VNS-046', district: 'VARANASI', block: 'Kashi Vidyapeeth', panchayat: 'Shivpur', pole: 'Pole #09', beneficiary: 'Kishore Yadav', amcDate: '19-10-2026', nextAmcDate: '19-01-2027', quarter: 'Q3 2026-27', lightWorking: true, complaint: 'No', approval: 'Approved', surveyor: 'Ramesh Chandra', remarks: 'Tested OK. Battery healthy.' },
  { id: '5', sslId: 'UP-SSL-PRY-108', district: 'PRAYAGRAJ', block: 'Soraon', panchayat: 'Phaphamau', pole: 'Pole #22', beneficiary: 'Dinesh Chandra', amcDate: '18-10-2026', nextAmcDate: '18-01-2027', quarter: 'Q3 2026-27', lightWorking: true, complaint: 'No', approval: 'Approved', surveyor: 'Pooja Sharma', remarks: 'Luminary serviced, pole structural check OK.' },
  { id: '6', sslId: 'UP-SSL-PRY-109', district: 'PRAYAGRAJ', block: 'Soraon', panchayat: 'Phaphamau', pole: 'Pole #23', beneficiary: 'Prem Shankar', amcDate: '18-10-2026', nextAmcDate: '18-01-2027', quarter: 'Q3 2026-27', lightWorking: false, complaint: 'Raised', approval: 'Pending', surveyor: 'Pooja Sharma', remarks: 'Battery low voltage (9.4V). Replaced under warranty.' },
  { id: '7', sslId: 'UP-SSL-AYD-012', district: 'AYODHYA', block: 'Sohawal', panchayat: 'Bhadarsa', pole: 'Pole #03', beneficiary: 'Rajesh Mishra', amcDate: '18-10-2026', nextAmcDate: '18-01-2027', quarter: 'Q3 2026-27', lightWorking: true, complaint: 'No', approval: 'Approved', surveyor: 'Amit Kumar', remarks: 'Luminary and solar panel fully cleaned. Verified.' },
  { id: '8', sslId: 'UP-SSL-GKP-088', district: 'GORAKHPUR', block: 'Chargawan', panchayat: 'Maniram', pole: 'Pole #19', beneficiary: 'Virendra Singh', amcDate: '17-10-2026', nextAmcDate: '17-01-2027', quarter: 'Q3 2026-27', lightWorking: true, complaint: 'No', approval: 'Approved', surveyor: 'Deepak Yadav', remarks: 'Wiring tightened. Working normally.' },
  { id: '9', sslId: 'UP-SSL-KNP-034', district: 'KANPUR NAGAR', block: 'Kalyanpur', panchayat: 'Bithoor', pole: 'Pole #05', beneficiary: 'Anil Gupta', amcDate: '17-10-2026', nextAmcDate: '17-01-2027', quarter: 'Q3 2026-27', lightWorking: false, complaint: 'Raised', approval: 'Rejected', surveyor: 'Manoj Pandey', remarks: 'Physical damage on luminary glass. Needs GP endorsement.' },
  { id: '10', sslId: 'UP-SSL-MRT-017', district: 'MEERUT', block: 'Daurala', panchayat: 'Sardhana', pole: 'Pole #11', beneficiary: 'Harish Tyagi', amcDate: '16-10-2026', nextAmcDate: '16-01-2027', quarter: 'Q3 2026-27', lightWorking: true, complaint: 'No', approval: 'Approved', surveyor: 'Arun Chauhan', remarks: 'Light working perfectly.' },
  { id: '11', sslId: 'UP-SSL-BLY-052', district: 'BAREILLY', block: 'Bhojipura', panchayat: 'Faridpur', pole: 'Pole #27', beneficiary: 'Sudhir Saxena', amcDate: '16-10-2026', nextAmcDate: '16-01-2027', quarter: 'Q3 2026-27', lightWorking: true, complaint: 'No', approval: 'Approved', surveyor: 'Mukesh Pal', remarks: 'All parameters normal. Photo geo-tagged.' },
  { id: '12', sslId: 'UP-SSL-JHS-091', district: 'JHANSI', block: 'Badagaon', panchayat: 'Mauranipur', pole: 'Pole #02', beneficiary: 'Raghuveer Bundela', amcDate: '15-10-2026', nextAmcDate: '15-01-2027', quarter: 'Q3 2026-27', lightWorking: true, complaint: 'No', approval: 'Approved', surveyor: 'Naveen Sen', remarks: 'Cleaned solar module, verified illumination lux.' },
  { id: '13', sslId: 'UP-SSL-ALG-063', district: 'ALIGARH', block: 'Khair', panchayat: 'Tappal', pole: 'Pole #16', beneficiary: 'Devendra Singh', amcDate: '15-10-2026', nextAmcDate: '15-01-2027', quarter: 'Q3 2026-27', lightWorking: false, complaint: 'Raised', approval: 'Pending', surveyor: 'Gaurav Sharma', remarks: 'Wire loose from sensor. Reconnected on site.' },
  { id: '14', sslId: 'UP-SSL-AGR-078', district: 'AGRA', block: 'Fatehabad', panchayat: 'Barauli', pole: 'Pole #31', beneficiary: 'Babulal Kushwaha', amcDate: '14-10-2026', nextAmcDate: '14-01-2027', quarter: 'Q3 2026-27', lightWorking: true, complaint: 'No', approval: 'Approved', surveyor: 'Pawan Upadhyay', remarks: 'Quarterly maintenance done. Battery 12.9V.' },
  { id: '15', sslId: 'UP-SSL-MBD-029', district: 'MORADABAD', block: 'Kanth', panchayat: 'Thakurdwara', pole: 'Pole #10', beneficiary: 'Naresh Bishnoi', amcDate: '14-10-2026', nextAmcDate: '14-01-2027', quarter: 'Q3 2026-27', lightWorking: true, complaint: 'No', approval: 'Approved', surveyor: 'Mohd. Aslam', remarks: 'All checks passed. Light operational.' },
  { id: '16', sslId: 'UP-SSL-AZM-044', district: 'AZAMGARH', block: 'Palhana', panchayat: 'Lalganj', pole: 'Pole #04', beneficiary: 'Tribhuvan Yadav', amcDate: '13-10-2026', nextAmcDate: '13-01-2027', quarter: 'Q3 2026-27', lightWorking: true, complaint: 'No', approval: 'Approved', surveyor: 'Shailesh Ram', remarks: 'Battery terminal greased. Solar panel washed.' },
];

// ─── Export Utilities ─────────────────────────────────────────────────────────
const downloadTextFile = (content, filename, mimeType) => {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const exportToCSV = (data, columns, filename) => {
  if (!data?.length || !columns?.length) return;
  const csvRows = [
    columns.map((col) => col.header),
    ...data.map((row) =>
      columns.map((col) => {
        const val = typeof col.accessor === 'function' ? col.accessor(row) : row[col.accessor];
        return `"${String(val ?? '').replace(/"/g, '""')}"`;
      })
    ),
  ];
  const csv = csvRows.map((r) => r.join(',')).join('\r\n');
  downloadTextFile(`\ufeff${csv}`, `${filename}.csv`, 'text/csv');
};

const copyToClipboard = async (data, columns) => {
  if (!data?.length || !columns?.length) return;
  const text = [
    columns.map((c) => c.header).join('\t'),
    ...data.map((row) =>
      columns.map((c) => String(typeof c.accessor === 'function' ? c.accessor(row) : row[c.accessor] ?? '')).join('\t')
    ),
  ].join('\n');
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
};

const exportToExcel = (data, columns, filename) => {
  if (!data?.length || !columns?.length) return;
  const tableHtml = `<table border="1"><thead><tr>${columns.map((c) => `<th>${escapeHtml(c.header)}</th>`).join('')}</tr></thead><tbody>${data.map((row) => `<tr>${columns.map((c) => `<td>${escapeHtml(typeof c.accessor === 'function' ? c.accessor(row) : row[c.accessor])}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8" /></head><body>${tableHtml}</body></html>`;
  downloadTextFile(`\ufeff${html}`, `${filename}.xls`, 'application/vnd.ms-excel');
};

const exportToPDF = (data, columns, title) => {
  if (!data?.length || !columns?.length) return;
  const printWindow = window.open('', '_blank', 'width=1200,height=800');
  if (!printWindow) return;
  const rows = data.map((r) => columns.map((c) => escapeHtml(typeof c.accessor === 'function' ? c.accessor(r) : r[c.accessor])));
  printWindow.document.write(`<!doctype html><html><head><meta charset="UTF-8" /><title>${escapeHtml(title)}</title><style>
    *{box-sizing:border-box}body{font-family:Arial,sans-serif;padding:24px;color:#222}h1{font-size:20px;margin:0 0 16px}
    table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #d8dee6;padding:7px 8px;text-align:left;vertical-align:top}
    th{background:#f3f5f7;font-weight:700}@media print{body{padding:0}@page{size:landscape;margin:12mm}}
  </style></head><body><h1>${escapeHtml(title)}</h1><table><thead><tr>${columns.map((c) => `<th>${escapeHtml(c.header)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((v) => `<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table><script>window.onload=function(){window.print();};</script></body></html>`);
  printWindow.document.close();
  printWindow.focus();
};

// ─── Main Component: UPAMCSSLDashboard ─────────────────────────────────────────
export function UPAMCSSLDashboard() {
  const navigate = useNavigate();

  // Filters State
  const [selectedDistrict, setSelectedDistrict] = useState('All');
  const [selectedBlock, setSelectedBlock] = useState('All');
  const [selectedQuarter, setSelectedQuarter] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [districtSearch, setDistrictSearch] = useState('');
  const [surveySearch, setSurveySearch] = useState('');
  const [hiddenDistCols, setHiddenDistCols] = useState([]);
  const [hiddenSurveyCols, setHiddenSurveyCols] = useState([]);
  const [updatedAt, setUpdatedAt] = useState(() => new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const chartH = useChartHeight(320, 260);
  const donutH = useChartHeight(240, 210);

  // Manual Refresh Simulation
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => {
      setUpdatedAt(new Date());
      setIsRefreshing(false);
    }, 400);
  }, []);

  // Filtered Districts Dataset
  const filteredDistricts = useMemo(() => {
    let list = UP_DISTRICTS_STATIC;
    if (selectedDistrict !== 'All') {
      list = list.filter((d) => d.district === selectedDistrict);
    }
    return list;
  }, [selectedDistrict]);

  // Derived Aggregate KPIs
  const kpis = useMemo(() => {
    const totalLights = filteredDistricts.reduce((acc, d) => acc + d.totalLights, 0);
    const working = filteredDistricts.reduce((acc, d) => acc + d.working, 0);
    const faulty = filteredDistricts.reduce((acc, d) => acc + d.faulty, 0);
    const inspected = filteredDistricts.reduce((acc, d) => acc + d.inspected, 0);
    const pending = filteredDistricts.reduce((acc, d) => acc + d.pending, 0);
    const totalDles = filteredDistricts.reduce((acc, d) => acc + d.activeDles, 0);
    const districtsCount = filteredDistricts.length;
    const workingPct = pctOf(working, totalLights);
    const faultyPct = pctOf(faulty, totalLights);
    const inspectedPct = pctOf(inspected, totalLights);

    return {
      totalLights,
      working,
      faulty,
      inspected,
      pending,
      totalDles,
      districtsCount,
      workingPct,
      faultyPct,
      inspectedPct,
      approvedSurveys: Math.round(inspected * 0.94),
    };
  }, [filteredDistricts]);

  // Block options for current district
  const blockOptions = useMemo(() => {
    if (selectedDistrict === 'All') {
      const allBlocks = UP_DISTRICTS_STATIC.flatMap((d) => d.blocks);
      return [...new Set(allBlocks)].sort();
    }
    const found = UP_DISTRICTS_STATIC.find((d) => d.district === selectedDistrict);
    return found ? found.blocks : [];
  }, [selectedDistrict]);

  // Filtered Survey Records
  const deferredSurveyQuery = useDeferredValue(surveySearch);
  const filteredSurveys = useMemo(() => {
    return RECENT_SURVEYS_STATIC.filter((s) => {
      if (selectedDistrict !== 'All' && s.district !== selectedDistrict) return false;
      if (selectedBlock !== 'All' && s.block !== selectedBlock) return false;
      if (selectedQuarter !== 'All' && s.quarter !== selectedQuarter) return false;
      if (selectedStatus === 'Working' && !s.lightWorking) return false;
      if (selectedStatus === 'Faulty' && s.lightWorking) return false;
      if (selectedStatus === 'Approved' && s.approval !== 'Approved') return false;
      if (selectedStatus === 'Pending' && s.approval !== 'Pending') return false;

      const q = deferredSurveyQuery.trim().toLowerCase();
      if (!q) return true;
      return (
        s.sslId.toLowerCase().includes(q) ||
        s.district.toLowerCase().includes(q) ||
        s.block.toLowerCase().includes(q) ||
        s.panchayat.toLowerCase().includes(q) ||
        s.beneficiary.toLowerCase().includes(q) ||
        s.surveyor.toLowerCase().includes(q)
      );
    });
  }, [selectedDistrict, selectedBlock, selectedQuarter, selectedStatus, deferredSurveyQuery]);

  // Pagination for Surveys Table
  const {
    paged: pagedSurveys,
    curPage,
    pageSize,
    totalItems,
    setPage,
    setPageSize,
  } = usePagination({ data: filteredSurveys, initialPageSize: 10 });

  // Reset page when search or filters change
  useEffect(() => {
    setPage(1);
  }, [surveySearch, selectedDistrict, selectedBlock, selectedQuarter, selectedStatus, setPage]);

  // Filtered District Table with Search
  const deferredDistrictQuery = useDeferredValue(districtSearch);
  const tableDistricts = useMemo(() => {
    const q = deferredDistrictQuery.trim().toLowerCase();
    if (!q) return filteredDistricts;
    return filteredDistricts.filter((d) => d.district.toLowerCase().includes(q));
  }, [filteredDistricts, deferredDistrictQuery]);

  const filtersActive = selectedDistrict !== 'All' || selectedBlock !== 'All' || selectedQuarter !== 'All' || selectedStatus !== 'All';

  // Navigation Click Handlers
  const handleAssignClick = () => navigate('/dle/up/ssl/amc/create-assign-light');
  const handleViewAssignClick = () => navigate('/dle/up/ssl/amc/view-assign-light');
  const handleViewSurveyClick = (params = {}) => {
    const search = new URLSearchParams(params).toString();
    navigate(`/dle/up/ssl/amc/view-verify-light${search ? `?${search}` : ''}`);
  };

  // Sparkline data arrays
  const sparkTotal = [1420, 1435, 1450, 1465, 1480, 1495, 1508];
  const sparkWorking = [1290, 1310, 1325, 1340, 1355, 1365, 1374];
  const sparkFaulty = [130, 125, 125, 125, 125, 130, 134];
  const sparkInspected = [820, 890, 950, 1020, 1090, 1140, 1184];
  const sparkPending = [600, 545, 500, 445, 390, 355, 324];
  const sparkTechs = [52, 54, 56, 60, 62, 65, 68];

  // Milestones Progress
  const milestones = [
    { label: '1. Total SSL Geo-Tagging & Inventory', v: kpis.totalLights, of: kpis.totalLights, color: 'var(--ax-accent)' },
    { label: '2. Q3 Physical AMC Inspection Done', v: kpis.inspected, of: kpis.totalLights, color: 'var(--ax-viz-cyan)' },
    { label: '3. Functional Working Lights Verified', v: kpis.working, of: kpis.totalLights, color: 'var(--ax-viz-emerald)' },
    { label: '4. Survey Verified & Approved by GP', v: kpis.approvedSurveys, of: kpis.inspected, color: 'var(--ax-viz-violet)' },
    { label: '5. Faults Rectified & Repaired', v: Math.round(kpis.faulty * 0.88), of: kpis.faulty, color: 'var(--ax-viz-amber)' },
  ];

  // Export Columns Definition
  const districtExportCols = [
    { header: 'District', accessor: 'district' },
    { header: 'Total SSL', accessor: 'totalLights' },
    { header: 'Working Lights', accessor: 'working' },
    { header: 'Faulty / Breakdown', accessor: 'faulty' },
    { header: 'AMC Inspected', accessor: 'inspected' },
    { header: 'Pending Inspection', accessor: 'pending' },
    { header: 'Active DLEs', accessor: 'activeDles' },
    { header: 'Working %', accessor: (r) => `${pctOf(r.working, r.totalLights)}%` },
  ];

  const surveyExportCols = [
    { header: 'SSL ID', accessor: 'sslId' },
    { header: 'District', accessor: 'district' },
    { header: 'Block', accessor: 'block' },
    { header: 'Panchayat', accessor: 'panchayat' },
    { header: 'Beneficiary / Pole', accessor: 'beneficiary' },
    { header: 'AMC Date', accessor: 'amcDate' },
    { header: 'Quarter', accessor: 'quarter' },
    { header: 'Light Status', accessor: (r) => (r.lightWorking ? 'Working' : 'Faulty') },
    { header: 'Complaint', accessor: 'complaint' },
    { header: 'Surveyor', accessor: 'surveyor' },
    { header: 'Approval', accessor: 'approval' },
  ];

  const stamp = new Date().toISOString().slice(0, 10);

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      {/* ─── 1. Page Header ────────────────────────────────────────────── */}
      <PageHead
        title="UP AMC SSL Dashboard"
        subtitle={
          <span style={{ display: 'inline-block', fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>
            Uttar Pradesh · Solar Street Light (SSL) Annual Maintenance Contract (AMC) Operations
            {updatedAt ? ` · Last updated ${fmtTime(updatedAt)}` : ''}
          </span>
        }
        actions={
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill" style={{ fontWeight: 600, paddingInline: 'var(--ax-space-3)' }}>
              <span className="ax-badge__dot" /> State: Uttar Pradesh ({kpis.districtsCount} Districts)
            </span>
            <button
              type="button"
              className="ax-btn ax-btn--ghost ax-btn--icon"
              aria-label="Refresh dashboard"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              {I_REFRESH}
            </button>
          </div>
        }
      />

      <div className="ax-dash-grid mt-0 pt-0">
        {/* ─── 2. Operations Filter Bar ──────────────────────────────────── */}
        <section
          className="ax-card ax-card--flat ax-col--12"
          role="region"
          aria-label="UP AMC SSL Dashboard Filters"
          style={{ padding: '8px 16px', borderRadius: 'var(--ax-radius-lg)', border: '1px solid var(--ax-border-subtle)', background: 'var(--ax-bg-surface)' }}
        >
          <div className="ax-cluster" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--ax-space-3)', alignItems: 'center' }}>
            <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
              <span
                className="ax-cluster"
                style={{
                  gap: '6px', color: 'var(--ax-text-strong)', fontSize: 'var(--ax-text-xs)', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.04em', padding: '4px 10px',
                  background: 'rgba(var(--ax-accent-rgb), 0.08)', borderRadius: 'var(--ax-radius-pill)',
                  border: '1px solid rgba(var(--ax-accent-rgb), 0.18)',
                }}
              >
                {I_FILTER} Filter UP AMC Operations
              </span>

              {/* District Filter */}
              <div className="ax-cluster dle-filter-item" style={{ gap: '6px', alignItems: 'center' }}>
                <label htmlFor="up-district-select" style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)', fontWeight: 500 }}>District:</label>
                <select
                  id="up-district-select"
                  className="ax-input ax-input--sm"
                  style={{ height: 30, fontSize: 'var(--ax-text-xs)', paddingInline: '8px' }}
                  value={selectedDistrict}
                  onChange={(e) => {
                    setSelectedDistrict(e.target.value);
                    setSelectedBlock('All');
                  }}
                >
                  <option value="All">All Districts ({UP_DISTRICTS_STATIC.length})</option>
                  {UP_DISTRICTS_STATIC.map((d) => (
                    <option key={d.district} value={d.district}>{d.district}</option>
                  ))}
                </select>
              </div>

              {/* Block Filter */}
              <div className="ax-cluster dle-filter-item" style={{ gap: '6px', alignItems: 'center' }}>
                <label htmlFor="up-block-select" style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)', fontWeight: 500 }}>Block:</label>
                <select
                  id="up-block-select"
                  className="ax-input ax-input--sm"
                  style={{ height: 30, fontSize: 'var(--ax-text-xs)', paddingInline: '8px' }}
                  value={selectedBlock}
                  onChange={(e) => setSelectedBlock(e.target.value)}
                >
                  <option value="All">All Blocks ({blockOptions.length})</option>
                  {blockOptions.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              {/* Quarter Filter */}
              <div className="ax-cluster dle-filter-item" style={{ gap: '6px', alignItems: 'center' }}>
                <label htmlFor="up-quarter-select" style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)', fontWeight: 500 }}>Quarter:</label>
                <select
                  id="up-quarter-select"
                  className="ax-input ax-input--sm"
                  style={{ height: 30, fontSize: 'var(--ax-text-xs)', paddingInline: '8px' }}
                  value={selectedQuarter}
                  onChange={(e) => setSelectedQuarter(e.target.value)}
                >
                  <option value="All">All Quarters</option>
                  <option value="Q1 2026-27">Q1 (2026-27)</option>
                  <option value="Q2 2026-27">Q2 (2026-27)</option>
                  <option value="Q3 2026-27">Q3 (2026-27)</option>
                  <option value="Q4 2026-27">Q4 (2026-27)</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="ax-cluster dle-filter-item" style={{ gap: '6px', alignItems: 'center' }}>
                <label htmlFor="up-status-select" style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)', fontWeight: 500 }}>Status:</label>
                <select
                  id="up-status-select"
                  className="ax-input ax-input--sm"
                  style={{ height: 30, fontSize: 'var(--ax-text-xs)', paddingInline: '8px' }}
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="All">All Statuses</option>
                  <option value="Working">Working Lights</option>
                  <option value="Faulty">Faulty / Under Repair</option>
                  <option value="Approved">Approved Verification</option>
                  <option value="Pending">Pending Verification</option>
                </select>
              </div>

              {filtersActive && (
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--sm"
                  style={{ height: 28, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }}
                  onClick={() => {
                    setSelectedDistrict('All');
                    setSelectedBlock('All');
                    setSelectedQuarter('All');
                    setSelectedStatus('All');
                  }}
                >
                  Reset Filters
                </button>
              )}
            </div>

            {/* Quick Navigation Action Buttons */}
            <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', alignItems: 'center' }}>
              <button
                type="button"
                className="ax-btn ax-btn--sm ax-btn--ghost"
                onClick={handleAssignClick}
                style={{ fontSize: 'var(--ax-text-xs)' }}
              >
                + Assign Lights
              </button>
              <button
                type="button"
                className="ax-btn ax-btn--sm ax-btn--ghost"
                onClick={handleViewAssignClick}
                style={{ fontSize: 'var(--ax-text-xs)' }}
              >
                View Assigned
              </button>
              <button
                type="button"
                className="ax-btn ax-btn--sm ax-btn--primary"
                onClick={() => handleViewSurveyClick()}
                style={{ fontSize: 'var(--ax-text-xs)' }}
              >
                View Surveys →
              </button>
            </div>
          </div>
        </section>

        {/* ─── 3. Executive Welcome Banner (DLE Style) ───────────────────── */}
        <section className="ax-card ax-welcome ax-col--12" role="region" aria-label="UP AMC SSL Overview">
          <div className="ax-welcome__body">
            <div className="ax-welcome__text">
              <p className="ax-welcome__eyebrow">UP State AMC Operations · DLE Management System</p>
              <h2 className="ax-card__title">Welcome to UP AMC SSL Dashboard</h2>
              <p className="ax-welcome__lede">
                Solar Street Light (SSL) AMC overview for Uttar Pradesh: Tracking <b>{num(kpis.totalLights)} SSL lights</b> across <b>{kpis.districtsCount} districts</b>.
                Currently <b>{num(kpis.working)} lights ({kpis.workingPct}%)</b> are functional, with <b>{num(kpis.inspected)} ({kpis.inspectedPct}%)</b> physical inspections completed and verified in the active cycle.
              </p>
            </div>

            <dl className="ax-welcome__stats">
              <div className="ax-welcome__stat">
                <dt>Total SSL Lights</dt>
                <dd className="ax-num">{num(kpis.totalLights)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-accent)' }}>{kpis.districtsCount} UP Districts</small>
              </div>
              <div className="ax-welcome__stat">
                <dt>Working Lights</dt>
                <dd className="ax-num">{num(kpis.working)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-emerald)' }}>{kpis.workingPct}% Efficiency</small>
              </div>
              <div className="ax-welcome__stat">
                <dt>Inspected (AMC)</dt>
                <dd className="ax-num">{num(kpis.inspected)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-cyan)' }}>{kpis.inspectedPct}% Coverage</small>
              </div>
              <div className="ax-welcome__stat">
                <dt>Faulty / Pending</dt>
                <dd className="ax-num">{num(kpis.faulty)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-red)' }}>{kpis.faultyPct}% Under Repair</small>
              </div>
            </dl>
          </div>
        </section>

        {/* ─── 4. Primary KPI Cards Grid ─────────────────────────────────── */}
        <KpiCard
          icon={I_SUN}
          tone="accent"
          label="Total SSL Lights"
          value={num(kpis.totalLights)}
          unit="Lights"
          sub="Contracted under AMC"
          spark={sparkTotal}
          onClick={() => handleViewSurveyClick()}
        />

        <KpiCard
          icon={I_DONE}
          tone="emerald"
          label="Working Lights"
          value={num(kpis.working)}
          unit="Lights"
          sub="Illuminating normally"
          badge={`${kpis.workingPct}%`}
          spark={sparkWorking}
          onClick={() => handleViewSurveyClick({ status: 'Working' })}
        />

        <KpiCard
          icon={I_X}
          tone="red"
          label="Faulty / Breakdown"
          value={num(kpis.faulty)}
          unit="Lights"
          sub="Component or battery issue"
          badge={`${kpis.faultyPct}%`}
          spark={sparkFaulty}
          onClick={() => handleViewSurveyClick({ status: 'Faulty' })}
        />

        <KpiCard
          icon={I_BOLT}
          tone="cyan"
          label="AMC Inspected"
          value={num(kpis.inspected)}
          unit="Lights"
          sub="Quarterly physical visit"
          badge={`${kpis.inspectedPct}%`}
          spark={sparkInspected}
          onClick={() => handleViewSurveyClick()}
        />

        <KpiCard
          icon={I_CLOCK}
          tone="amber"
          label="Pending Inspections"
          value={num(kpis.pending)}
          unit="Lights"
          sub="Awaiting quarterly survey"
          badge={`${pctOf(kpis.pending, kpis.totalLights)}%`}
          spark={sparkPending}
        />

        <KpiCard
          icon={I_LIST}
          tone="violet"
          label="Verified Surveys"
          value={num(kpis.approvedSurveys)}
          unit="Surveys"
          sub="Approved by field officers"
          badge="94.4%"
          spark={[780, 840, 890, 960, 1040, 1118]}
        />

        <KpiCard
          icon={I_USERS}
          tone="cyan"
          label="Active Surveyors"
          value={num(kpis.totalDles)}
          unit="DLEs"
          sub="Technicians in field"
          badge="Active"
          spark={sparkTechs}
        />

        <KpiCard
          icon={I_PIN}
          tone="accent"
          label="UP Districts Covered"
          value={num(kpis.districtsCount)}
          unit="Districts"
          sub="Across Uttar Pradesh"
          spark={[12, 14, 15, 16, 17, 18, 18]}
        />

        {/* ─── 5. Integrated Operational Highlights Card ─────────────────── */}
        <div className="ax-col--12" style={{ marginTop: 'var(--ax-space-2)', marginBottom: 'var(--ax-space-1)' }}>
          <div className="ax-cluster" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--ax-space-2)' }}>
            <div>
              <span className="ax-card__eyebrow" style={{ color: 'var(--ax-accent)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                Uttar Pradesh Field AMC Operations & Verification Tracking
              </span>
              <h2 className="ax-card__title" style={{ fontSize: 'var(--ax-text-lg)', margin: 0 }}>
                SSL Maintenance Workflow & Daily Field Execution
              </h2>
            </div>
            <span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--pill" style={{ fontSize: 'var(--ax-text-xs)' }}>
              Operational Cycle: <b>Q3 (2026-27) Active</b>
            </span>
          </div>
        </div>

        {/* Highlights Row */}
        <section className="ax-card ax-col--6" role="region" aria-label="UP Field Operations Summary">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow" style={{ color: 'var(--ax-viz-emerald)' }}>Operational Performance</span>
              <h3 className="ax-card__title">State Health & Uptime Score</h3>
              <p className="ax-card__subtitle">{num(kpis.working)} of {num(kpis.totalLights)} lights operational</p>
            </div>
            <button
              type="button"
              className="ax-btn ax-btn--sm ax-btn--primary"
              onClick={() => handleViewSurveyClick()}
            >
              View Verification Data →
            </button>
          </div>
          <div className="ax-card__body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-3)' }}>
            <div className="ax-grid ax-grid--2" style={{ gap: 'var(--ax-space-2)' }}>
              <div style={{ padding: '10px 12px', background: 'var(--ax-surface-subtle)', borderRadius: 'var(--ax-radius-md)' }}>
                <small style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-xs)' }}>Working Lights</small>
                <div style={{ fontSize: 'var(--ax-text-lg)', fontWeight: 700, color: 'var(--ax-viz-emerald)' }}>
                  {num(kpis.working)} <span style={{ fontSize: 'var(--ax-text-xs)', fontWeight: 500 }}>({kpis.workingPct}%)</span>
                </div>
              </div>
              <div style={{ padding: '10px 12px', background: 'var(--ax-surface-subtle)', borderRadius: 'var(--ax-radius-md)' }}>
                <small style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-xs)' }}>Faulty / Breakdown</small>
                <div style={{ fontSize: 'var(--ax-text-lg)', fontWeight: 700, color: 'var(--ax-viz-red)' }}>
                  {num(kpis.faulty)} <span style={{ fontSize: 'var(--ax-text-xs)', fontWeight: 500 }}>({kpis.faultyPct}%)</span>
                </div>
              </div>
            </div>

            <div>
              <div className="ax-cluster" style={{ justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>SSL Maintenance Efficiency</span>
                <b className="ax-num" style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-emerald)' }}>
                  {kpis.workingPct}%
                </b>
              </div>
              <div className="ax-progress ax-progress--sm">
                <div className="ax-progress__track">
                  <div className="ax-progress__fill" style={{ width: `${kpis.workingPct}%`, background: 'var(--ax-viz-emerald)' }} />
                </div>
              </div>
            </div>

            <div style={{ paddingTop: 'var(--ax-space-2)', borderTop: '1px solid var(--ax-border-subtle)', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
              <b>Active Focus:</b> Lucknow, Varanasi & Prayagraj lead with over 3,900+ SSL lights surveyed with SLA turnaround &lt; 48 hours.
            </div>
          </div>
        </section>

        <section className="ax-card ax-col--6" role="region" aria-label="Field Workforce & Today Progress">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow" style={{ color: 'var(--ax-accent)' }}>Workforce & Activity</span>
              <h3 className="ax-card__title">Daily AMC Service Activity</h3>
              <p className="ax-card__subtitle">{num(kpis.totalDles)} field surveyors deployed across districts</p>
            </div>
            <button
              type="button"
              className="ax-btn ax-btn--sm ax-btn--ghost"
              onClick={handleAssignClick}
            >
              + Assign New Task
            </button>
          </div>
          <div className="ax-card__body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-3)' }}>
            <div className="ax-grid ax-grid--2" style={{ gap: 'var(--ax-space-2)' }}>
              <div style={{ padding: '10px 12px', background: 'var(--ax-surface-subtle)', borderRadius: 'var(--ax-radius-md)' }}>
                <small style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-xs)' }}>Inspected This Cycle</small>
                <div style={{ fontSize: 'var(--ax-text-lg)', fontWeight: 700, color: 'var(--ax-accent)' }}>
                  {num(kpis.inspected)} <span style={{ fontSize: 'var(--ax-text-xs)', fontWeight: 500 }}>({kpis.inspectedPct}%)</span>
                </div>
              </div>
              <div style={{ padding: '10px 12px', background: 'var(--ax-surface-subtle)', borderRadius: 'var(--ax-radius-md)' }}>
                <small style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-xs)' }}>Today Verified</small>
                <div style={{ fontSize: 'var(--ax-text-lg)', fontWeight: 700, color: 'var(--ax-viz-cyan)' }}>
                  142 Lights <span style={{ fontSize: 'var(--ax-text-xs)', fontWeight: 500 }}>(38 Repaired)</span>
                </div>
              </div>
            </div>

            <div>
              <div className="ax-cluster" style={{ justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>Quarterly Inspection Progress</span>
                <b className="ax-num" style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-accent)' }}>
                  {kpis.inspectedPct}%
                </b>
              </div>
              <div className="ax-progress ax-progress--sm">
                <div className="ax-progress__track">
                  <div className="ax-progress__fill" style={{ width: `${kpis.inspectedPct}%`, background: 'var(--ax-accent)' }} />
                </div>
              </div>
            </div>

            <div style={{ paddingTop: 'var(--ax-space-2)', borderTop: '1px solid var(--ax-border-subtle)', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
              <b>Field DLE Network:</b> GPS-tagged inspections with luminary lux testing, battery health check, and solar panel cleaning records.
            </div>
          </div>
        </section>

        {/* ─── 6. Charts: District Distribution + Status Donut ───────────── */}
        <section className="ax-card ax-card--chart ax-col--8" role="region" aria-label="District wise SSL AMC Status">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Geographic Breakdown</span>
              <h2 className="ax-card__title">District Wise SSL AMC Status</h2>
              <p className="ax-card__subtitle">Working vs Faulty lights across UP districts</p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)' }}>
                {[
                  { l: 'Working Lights', c: LIGHT_GREEN },
                  { l: 'Faulty / Breakdown', c: LIGHT_RED },
                ].map((i) => (
                  <span key={i.l} className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}>
                    <i style={{ width: 10, height: 10, borderRadius: 2, background: i.c }} />
                    <small style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-xs)' }}>{i.l}</small>
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <Suspense fallback={<div className="ax-skeleton" style={{ height: chartH }} />}>
              <ApexChart
                key={`dist-chart-${chartH}-${filteredDistricts.length}`}
                type="bar"
                height={chartH}
                legend="none"
                ariaLabel="Working and Faulty SSL lights by district"
                series={[
                  { name: 'Working Lights', data: filteredDistricts.map((d) => d.working) },
                  { name: 'Faulty / Breakdown', data: filteredDistricts.map((d) => d.faulty) },
                ]}
                apex={{
                  colors: [LIGHT_GREEN, LIGHT_RED],
                  plotOptions: {
                    bar: {
                      horizontal: false,
                      columnWidth: '45%',
                      borderRadius: 3,
                    },
                  },
                  dataLabels: { enabled: false },
                  xaxis: {
                    categories: filteredDistricts.map((d) => d.district),
                    labels: { style: { fontSize: '11px' }, rotate: -35 },
                  },
                  yaxis: { title: { text: 'Lights (Nos.)', style: { color: 'var(--ax-text-muted)' } } },
                  chart: {
                    events: {
                      dataPointSelection: (_event, _chart, opts) => {
                        const d = filteredDistricts[opts?.dataPointIndex]?.district;
                        if (d) setSelectedDistrict(d);
                      },
                    },
                  },
                }}
              />
            </Suspense>
          </div>
        </section>

        {/* Approval Status Donut */}
        <section className="ax-card ax-col--4" role="region" aria-label="SSL AMC Health Distribution">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Health Ratio</span>
              <h2 className="ax-card__title">Light Health Distribution</h2>
              <p className="ax-card__subtitle">Total {num(kpis.totalLights)} SSL Lights</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <Suspense fallback={<div className="ax-skeleton" style={{ height: donutH }} />}>
              <ApexChart
                key={`donut-${donutH}-${kpis.working}-${kpis.faulty}-${kpis.pending}`}
                type="donut"
                height={donutH}
                legend="none"
                ariaLabel="Working vs Faulty vs Pending SSL lights"
                series={[kpis.working, kpis.faulty, kpis.pending]}
                apex={{
                  labels: ['Working Lights', 'Faulty / Breakdown', 'Pending Inspection'],
                  colors: [LIGHT_GREEN, LIGHT_RED, LIGHT_AMBER],
                  stroke: { width: 0 },
                  plotOptions: {
                    pie: {
                      donut: {
                        size: '72%',
                        labels: {
                          show: true,
                          name: { fontFamily: 'inherit' },
                          value: { fontFamily: 'inherit', fontWeight: 600, formatter: (val) => num(Number(val)) },
                          total: {
                            show: true,
                            label: 'Total SSL',
                            formatter: () => num(kpis.totalLights),
                          },
                        },
                      },
                    },
                  },
                }}
              />
            </Suspense>
            <ul className="ax-list ax-list--compact" style={{ marginTop: 'var(--ax-space-3)' }}>
              {[
                { label: 'Working Lights', sub: 'Tested & Operational', v: kpis.working, p: kpis.workingPct, color: 'var(--ax-viz-emerald)' },
                { label: 'Faulty / Repair', sub: 'Breakdown / Component Issue', v: kpis.faulty, p: kpis.faultyPct, color: 'var(--ax-viz-red)' },
                { label: 'Pending Inspection', sub: 'Awaiting Q3 physical visit', v: kpis.pending, p: pctOf(kpis.pending, kpis.totalLights), color: 'var(--ax-viz-amber)' },
              ].map((s) => (
                <li key={s.label} className="ax-list__row" style={{ border: 0, paddingInline: 0 }}>
                  <span className="ax-list__leading">
                    <i style={{ width: 9, height: 9, borderRadius: 3, background: s.color, display: 'inline-block' }} />
                  </span>
                  <span className="ax-list__content">
                    <span className="ax-list__title" style={{ fontWeight: 'var(--ax-weight-medium)' }}>{s.label}</span>
                    <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>{s.sub}</span>
                  </span>
                  <span className="ax-list__trailing ax-num" style={{ color: 'var(--ax-text-strong)', fontWeight: 600 }}>
                    {num(s.v)} ({s.p}%)
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ─── 7. Inspection Trend & AMC Milestones ─────────────────────── */}
        <section className="ax-card ax-card--chart ax-col--8" role="region" aria-label="14-Day AMC Inspection Trajectory">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Field Activity Trajectory</span>
              <h2 className="ax-card__title">14-Day AMC Inspection & Servicing Trend</h2>
              <p className="ax-card__subtitle">Daily completed surveys vs faults resolved</p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)' }}>
                {[
                  { l: 'Lights Inspected', c: LIGHT_BLUE },
                  { l: 'Faults Resolved', c: LIGHT_GREEN },
                ].map((i) => (
                  <span key={i.l} className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}>
                    <i style={{ width: 10, height: 10, borderRadius: 2, background: i.c }} />
                    <small style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-xs)' }}>{i.l}</small>
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <Suspense fallback={<div className="ax-skeleton" style={{ height: chartH }} />}>
              <ApexChart
                key={`trend-${chartH}`}
                type="area"
                height={chartH}
                legend="none"
                ariaLabel="Daily AMC Inspection Trend"
                series={[
                  { name: 'Lights Inspected', data: [120, 145, 138, 160, 155, 172, 168, 185, 190, 178, 195, 210, 205, 224] },
                  { name: 'Faults Resolved', data: [18, 22, 20, 26, 24, 30, 28, 35, 34, 31, 36, 40, 37, 42] },
                ]}
                apex={{
                  colors: [LIGHT_BLUE, LIGHT_GREEN],
                  stroke: { curve: 'smooth', width: 2 },
                  fill: {
                    type: 'gradient',
                    gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.05, stops: [0, 90, 100] },
                  },
                  markers: { size: 3, strokeWidth: 0, hover: { size: 6 } },
                  dataLabels: { enabled: false },
                  xaxis: {
                    categories: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7', 'Day 8', 'Day 9', 'Day 10', 'Day 11', 'Day 12', 'Day 13', 'Day 14'],
                  },
                  yaxis: { title: { text: 'Lights Count', style: { color: 'var(--ax-text-muted)' } } },
                }}
              />
            </Suspense>
          </div>
        </section>

        {/* Milestones Card */}
        <section className="ax-card ax-col--4" role="region" aria-label="AMC Maintenance Milestones">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Service Lifecycle</span>
              <h2 className="ax-card__title">AMC Milestones & SLA</h2>
              <p className="ax-card__subtitle">Stage-wise service completion</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0, display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-4)' }}>
            {milestones.map((m) => {
              const p = pctOf(m.v, m.of);
              return (
                <div key={m.label}>
                  <div className="ax-cluster" style={{ justifyContent: 'space-between', marginBottom: 4, flexWrap: 'wrap', gap: 4 }}>
                    <span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-strong)', fontWeight: 500 }}>{m.label}</span>
                    <b className="ax-num" style={{ color: m.color, fontSize: 'var(--ax-text-xs)' }}>
                      {num(m.v)} / {num(m.of)} ({p}%)
                    </b>
                  </div>
                  <div className="ax-progress ax-progress--sm">
                    <div className="ax-progress__track">
                      <div className="ax-progress__fill" style={{ width: `${p}%`, background: m.color }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ─── 8. District Summary Data Table ────────────────────────────── */}
        <section className="ax-card ax-col--12" role="region" aria-label="UP District Wise SSL AMC Summary">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Geographic Summary</span>
              <h2 className="ax-card__title">UP District Wise AMC Performance</h2>
              <p className="ax-card__subtitle">Consolidated Solar Street Light numbers, health and coverage per district</p>
            </div>
            <div className="ax-card__actions">
              <SearchInput
                value={districtSearch}
                onChange={setDistrictSearch}
                placeholder="Search district…"
                ariaLabel="Search UP districts"
              />
              <TableExportToolbar
                onCopy={() => copyToClipboard(tableDistricts, districtExportCols)}
                onExportCSV={() => exportToCSV(tableDistricts, districtExportCols, `UP_SSL_AMC_Districts_${stamp}`)}
                onExportExcel={() => exportToExcel(tableDistricts, districtExportCols, `UP_SSL_AMC_Districts_${stamp}`)}
                onExportPDF={() => exportToPDF(tableDistricts, districtExportCols, 'UP District Wise AMC Performance')}
                columns={districtExportCols.map((c) => ({ key: c.header, label: c.header, visible: !hiddenDistCols.includes(c.header) }))}
                onToggleColumn={(key) =>
                  setHiddenDistCols((prev) => (prev.includes(key) ? prev.filter((i) => i !== key) : [...prev, key]))
                }
              />
            </div>
          </div>
          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover">
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">District</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Total SSL</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Working Lights</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Faulty / Breakdown</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">AMC Inspected</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Pending</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Health %</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Active DLEs</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {tableDistricts.map((d) => {
                  const healthPct = pctOf(d.working, d.totalLights);
                  return (
                    <tr
                      key={d.district}
                      className="ax-table__row"
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedDistrict(d.district)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedDistrict(d.district); } }}
                      style={{ cursor: 'pointer' }}
                    >
                      <td className="ax-table__td" style={{ fontWeight: 'var(--ax-weight-semibold)', color: 'var(--ax-text-strong)' }}>
                        {d.district}
                      </td>
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ fontWeight: 600 }}>{num(d.totalLights)}</td>
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-emerald)', fontWeight: 600 }}>{num(d.working)}</td>
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-red)', fontWeight: 600 }}>{num(d.faulty)}</td>
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-accent)', fontWeight: 600 }}>{num(d.inspected)}</td>
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-amber)' }}>{num(d.pending)}</td>
                      <td className="ax-table__td ax-table__td--num ax-num">
                        <span className={`ax-badge ax-badge--soft ${healthPct >= 90 ? 'ax-badge--success' : 'ax-badge--warning'}`}>
                          {healthPct}%
                        </span>
                      </td>
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-cyan)' }}>{d.activeDles}</td>
                      <td className="ax-table__td" style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="ax-btn ax-btn--ghost ax-btn--sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewSurveyClick({ district: d.district });
                          }}
                        >
                          View Lights →
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {tableDistricts.length === 0 && (
                  <tr>
                    <td className="ax-table__td" colSpan={9} style={{ textAlign: 'center', color: 'var(--ax-text-muted)', padding: 24 }}>
                      No matching UP district records found.
                    </td>
                  </tr>
                )}
                {tableDistricts.length > 0 && (
                  <tr className="ax-table__row" style={{ background: 'var(--ax-surface-subtle)', fontWeight: 'var(--ax-weight-bold)' }}>
                    <td className="ax-table__td" style={{ color: 'var(--ax-text-strong)' }}>Total</td>
                    <td className="ax-table__td ax-table__td--num ax-num">{num(kpis.totalLights)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-emerald)' }}>{num(kpis.working)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-red)' }}>{num(kpis.faulty)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-accent)' }}>{num(kpis.inspected)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-amber)' }}>{num(kpis.pending)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num">{kpis.workingPct}%</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-cyan)' }}>{kpis.totalDles}</td>
                    <td className="ax-table__td" />
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* ─── 9. Recent Inspections & Survey Logs Table ─────────────────── */}
        <section className="ax-card ax-col--12" role="region" aria-label="Recent SSL Field AMC Surveys">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Field Inspections Log</span>
              <h2 className="ax-card__title">Recent SSL AMC Field Surveys & Verifications</h2>
              <p className="ax-card__subtitle">Showing {totalItems} verified survey logs with component status and approval</p>
            </div>
            <div className="ax-card__actions">
              <SearchInput
                value={surveySearch}
                onChange={setSurveySearch}
                placeholder="Search SSL ID, district, surveyor…"
                ariaLabel="Search field survey logs"
              />
              <TableExportToolbar
                onCopy={() => copyToClipboard(filteredSurveys, surveyExportCols)}
                onExportCSV={() => exportToCSV(filteredSurveys, surveyExportCols, `UP_SSL_Surveys_${stamp}`)}
                onExportExcel={() => exportToExcel(filteredSurveys, surveyExportCols, `UP_SSL_Surveys_${stamp}`)}
                onExportPDF={() => exportToPDF(filteredSurveys, surveyExportCols, 'UP SSL AMC Field Surveys')}
                columns={surveyExportCols.map((c) => ({ key: c.header, label: c.header, visible: !hiddenSurveyCols.includes(c.header) }))}
                onToggleColumn={(key) =>
                  setHiddenSurveyCols((prev) => (prev.includes(key) ? prev.filter((i) => i !== key) : [...prev, key]))
                }
              />
            </div>
          </div>
          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover">
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">SSL ID</th>
                  <th className="ax-table__th" scope="col">District</th>
                  <th className="ax-table__th" scope="col">Block / Panchayat</th>
                  <th className="ax-table__th" scope="col">Pole & Beneficiary</th>
                  <th className="ax-table__th" scope="col">AMC Date</th>
                  <th className="ax-table__th" scope="col">Light Status</th>
                  <th className="ax-table__th" scope="col">Complaint</th>
                  <th className="ax-table__th" scope="col">Surveyor</th>
                  <th className="ax-table__th" scope="col">Approval</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedSurveys.map((r) => (
                  <tr key={r.id} className="ax-table__row">
                    <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono)', fontWeight: 600, color: 'var(--ax-accent)' }}>
                      {r.sslId}
                    </td>
                    <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                      {r.district}
                    </td>
                    <td className="ax-table__td">
                      <div style={{ fontWeight: 500 }}>{r.block}</div>
                      <small style={{ color: 'var(--ax-text-muted)', fontSize: '11px' }}>{r.panchayat}</small>
                    </td>
                    <td className="ax-table__td">
                      <div>{r.beneficiary}</div>
                      <small style={{ color: 'var(--ax-text-muted)', fontSize: '11px' }}>{r.pole}</small>
                    </td>
                    <td className="ax-table__td" style={{ whiteSpace: 'nowrap' }}>
                      <div>{r.amcDate}</div>
                      <small style={{ color: 'var(--ax-text-muted)', fontSize: '11px' }}>{r.quarter}</small>
                    </td>
                    <td className="ax-table__td">
                      <span className={`ax-badge ax-badge--soft ${r.lightWorking ? 'ax-badge--success' : 'ax-badge--danger'}`}>
                        {r.lightWorking ? '● Working' : '✕ Faulty'}
                      </span>
                    </td>
                    <td className="ax-table__td">
                      <span className={`ax-badge ax-badge--soft ${r.complaint === 'Raised' ? 'ax-badge--warning' : 'ax-badge--neutral'}`}>
                        {r.complaint}
                      </span>
                    </td>
                    <td className="ax-table__td" style={{ color: 'var(--ax-text-strong)' }}>
                      {r.surveyor}
                    </td>
                    <td className="ax-table__td">
                      <span
                        className={`ax-badge ax-badge--soft ${
                          r.approval === 'Approved'
                            ? 'ax-badge--success'
                            : r.approval === 'Rejected'
                            ? 'ax-badge--danger'
                            : 'ax-badge--warning'
                        }`}
                      >
                        {r.approval}
                      </span>
                    </td>
                    <td className="ax-table__td" style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        type="button"
                        className="ax-btn ax-btn--ghost ax-btn--sm"
                        onClick={() => handleViewSurveyClick({ id: r.sslId })}
                      >
                        Details →
                      </button>
                    </td>
                  </tr>
                ))}
                {pagedSurveys.length === 0 && (
                  <tr>
                    <td className="ax-table__td" colSpan={10} style={{ textAlign: 'center', color: 'var(--ax-text-muted)', padding: 24 }}>
                      No matching survey logs found. Try adjusting your search query or filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer with Universal Pagination */}
          <div className="ax-card__footer ula-pagination-left" style={{ borderTop: '1px solid var(--ax-border, #e2e8f0)', padding: 'var(--ax-space-3) var(--ax-space-4)' }}>
            <Pagination
              curPage={curPage}
              currentPage={curPage}
              total={totalItems}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setPage}
              setPage={setPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[10, 15, 25, 50]}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

export default UPAMCSSLDashboard;
