import { lazy, Suspense, useCallback, useEffect, useMemo, useState, useDeferredValue } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';

// Code-split ApexCharts so UP AMC KUSUM-C Dashboard shell and data tables render instantly
const ApexChart = lazy(() => import('../../../../charts/ApexChart').then((m) => ({ default: m.ApexChart })));
import { Pagination, usePagination, SearchInput, TableExportToolbar } from '../../../../../common';

// ─── Theme Colors ─────────────────────────────────────────────────────────────
const LIGHT_BLUE = '#2f7df2';
const LIGHT_GREEN = '#86DDB2';
const LIGHT_AMBER = '#F6D68A';
const LIGHT_RED = '#f87171';
const LIGHT_VIOLET = '#a78bfa';

// ─── Responsive Chart Height Hook ─────────────────────────────────────────────
const useChartHeight = (desktop: number, mobile: number) => {
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
const cv = (n: string) => (typeof window !== 'undefined' ? getComputedStyle(document.documentElement).getPropertyValue(n).trim() : '');
const num = (x: number | undefined | null) => (x ?? 0).toLocaleString('en-IN');
const pctOf = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : 0);
const fmtTime = (d: Date) => d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();
const escapeHtml = (s: unknown) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ─── Scoped Styling Matching DLE / UP AMC SSL Template ────────────────────────
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
const svg = (children: React.ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);
const I_REFRESH = svg(<><path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" /><path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" /></>);
const I_FILTER = (
  <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 4h16v2.172a2 2 0 0 1 -.586 1.414l-4.828 4.828v7.586l-4 -2v-5.586l-4.828 -4.828a2 2 0 0 1 -.586 -1.414v-2.172z" /></svg>
);
const I_PIN = svg(<><path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /><path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0" /></>);
const I_USERS = svg(<><path d="M9 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" /><path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /><path d="M21 21v-2a4 4 0 0 0 -3 -3.85" /></>);
const I_BOLT = svg(<path d="M13 3l0 7l6 0l-8 11l0 -7l-6 0l8 -11" />);
const I_LIST = svg(<><path d="M9 6l11 0" /><path d="M9 12l11 0" /><path d="M9 18l11 0" /><path d="M5 6l0 .01" /><path d="M5 12l0 .01" /><path d="M5 18l0 .01" /></>);
const I_CLOCK = svg(<><path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M12 7v5l3 3" /></>);
const I_DONE = svg(<><path d="M7 12l5 5l10 -10" /><path d="M2 12l5 5m5 -5l5 -5" /></>);
const I_X = svg(<><path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M10 10l4 4m0 -4l-4 4" /></>);
const I_PUMP = svg(
  <>
    <path d="M4 14a4 4 0 0 1 4 -4h8a4 4 0 0 1 4 4v4a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z" />
    <path d="M12 4v6" />
    <path d="M9 7l6 0" />
    <path d="M8 14l0 .01" />
    <path d="M12 14l0 .01" />
    <path d="M16 14l0 .01" />
  </>
);

// ─── KPI Card Component (Matching DLEDashboard & UPAMCSSLDashboard) ───────────
const TONE: Record<string, { bg: string; fg: string; apex: string }> = {
  accent: { bg: 'rgba(var(--ax-accent-rgb), 0.12)', fg: 'var(--ax-accent)', apex: '--ax-accent' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan) 14%, transparent)', fg: 'var(--ax-viz-cyan)', apex: '--ax-viz-cyan' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald) 14%, transparent)', fg: 'var(--ax-viz-emerald)', apex: '--ax-viz-emerald' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber) 14%, transparent)', fg: 'var(--ax-viz-amber)', apex: '--ax-viz-amber' },
  violet: { bg: 'color-mix(in oklab, var(--ax-viz-violet) 14%, transparent)', fg: 'var(--ax-viz-violet)', apex: '--ax-viz-violet' },
  pink: { bg: 'color-mix(in oklab, var(--ax-viz-pink) 14%, transparent)', fg: 'var(--ax-viz-pink)', apex: '--ax-viz-pink' },
  red: { bg: 'color-mix(in oklab, var(--ax-viz-red) 14%, transparent)', fg: 'var(--ax-viz-red)', apex: '--ax-viz-red' },
};

interface KpiProps {
  icon: React.ReactNode;
  tone?: 'accent' | 'cyan' | 'emerald' | 'amber' | 'violet' | 'pink' | 'red';
  label: string;
  value: string;
  unit?: string;
  sub: string;
  badge?: string;
  spark?: number[];
  sparkType?: 'line' | 'bar' | 'area';
  onClick?: () => void;
}

function KpiCard({ icon, tone = 'accent', label, value, unit, sub, badge, spark, sparkType = 'line', onClick }: KpiProps) {
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
                  key={`${label}-${safeSpark!.join(',')}-${sparkType}`}
                  type={sparkType}
                  sparkline
                  tooltip={false}
                  height={26}
                  color={t.apex}
                  series={[{ name: label, data: safeSpark! }]}
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

// ─── Static Mock Data: Uttar Pradesh AMC KUSUM-C Solar Pumps Operations ─────────
interface DistrictItem {
  district: string;
  totalPumps: number;
  working: number;
  faulty: number;
  inspected: number;
  pending: number;
  activeDles: number;
  blocks: string[];
}

const UP_DISTRICTS_STATIC: DistrictItem[] = [
  { district: 'GORAKHPUR', totalPumps: 420, working: 395, faulty: 25, inspected: 380, pending: 40, activeDles: 8, blocks: ['Chargawan', 'Pipraich', 'Sahjanwa', 'Bansgaon', 'Campierganj', 'Bhadahawa'] },
  { district: 'VARANASI', totalPumps: 385, working: 362, faulty: 23, inspected: 345, pending: 40, activeDles: 7, blocks: ['Kashi Vidyapeeth', 'Pindra', 'Cholapur', 'Araziline', 'Sewapuri', 'Harahua'] },
  { district: 'PRAYAGRAJ', totalPumps: 360, working: 334, faulty: 26, inspected: 320, pending: 40, activeDles: 7, blocks: ['Soraon', 'Phulpur', 'Karchhana', 'Bahria', 'Mauaima', 'Koraon'] },
  { district: 'LUCKNOW', totalPumps: 310, working: 298, faulty: 12, inspected: 290, pending: 20, activeDles: 6, blocks: ['Bakshi Ka Talab', 'Malihabad', 'Sarojini Nagar', 'Mohanlalganj', 'Chinhat', 'Gosainganj'] },
  { district: 'AYODHYA', totalPumps: 295, working: 278, faulty: 17, inspected: 265, pending: 30, activeDles: 6, blocks: ['Sohawal', 'Milkipur', 'Pura Bazar', 'Rudauli', 'Bikapur'] },
  { district: 'KANPUR NAGAR', totalPumps: 280, working: 260, faulty: 20, inspected: 250, pending: 30, activeDles: 5, blocks: ['Kalyanpur', 'Bilhaur', 'Chaubeypur', 'Ghatampur', 'Sarsaul'] },
  { district: 'MEERUT', totalPumps: 240, working: 226, faulty: 14, inspected: 220, pending: 20, activeDles: 5, blocks: ['Daurala', 'Sardhana', 'Mawana', 'Hastinapur', 'Rohta'] },
  { district: 'BAREILLY', totalPumps: 230, working: 215, faulty: 15, inspected: 205, pending: 25, activeDles: 5, blocks: ['Bhojipura', 'Faridpur', 'Nawabganj', 'Mirganj', 'Baheri'] },
  { district: 'JHANSI', totalPumps: 210, working: 196, faulty: 14, inspected: 190, pending: 20, activeDles: 4, blocks: ['Badagaon', 'Mauranipur', 'Babina', 'Moth', 'Gursarai'] },
  { district: 'ALIGARH', totalPumps: 200, working: 188, faulty: 12, inspected: 180, pending: 20, activeDles: 4, blocks: ['Khair', 'Iglas', 'Atrauli', 'Gonda', 'Jawan'] },
  { district: 'AGRA', totalPumps: 225, working: 210, faulty: 15, inspected: 200, pending: 25, activeDles: 4, blocks: ['Fatehabad', 'Bah', 'Khandauli', 'Achhnera', 'Barauli Ahir'] },
  { district: 'MORADABAD', totalPumps: 190, working: 178, faulty: 12, inspected: 170, pending: 20, activeDles: 4, blocks: ['Kanth', 'Bilari', 'Moradabad', 'Thakurdwara', 'Kundarki'] },
  { district: 'AZAMGARH', totalPumps: 250, working: 231, faulty: 19, inspected: 225, pending: 25, activeDles: 5, blocks: ['Palhana', 'Bilariyaganj', 'Lalganj', 'Phoolpur', 'Mehnagar'] },
  { district: 'GHAZIPUR', totalPumps: 225, working: 210, faulty: 15, inspected: 200, pending: 25, activeDles: 4, blocks: ['Mohammadabad', 'Zamania', 'Saidpur', 'Karanda', 'Sadat'] },
  { district: 'MIRZAPUR', totalPumps: 240, working: 220, faulty: 20, inspected: 210, pending: 30, activeDles: 5, blocks: ['Chunar', 'Marihan', 'City', 'Kalyanpur', 'Pahara'] },
  { district: 'BASTI', totalPumps: 280, working: 259, faulty: 21, inspected: 245, pending: 35, activeDles: 5, blocks: ['Harraiya', 'Rudhauli', 'Basti Sadar', 'Kaptanganj'] },
  { district: 'DEORIA', totalPumps: 275, working: 255, faulty: 20, inspected: 245, pending: 30, activeDles: 5, blocks: ['Salempur', 'Bhatpar Rani', 'Rudrapur', 'Deoria Sadar'] },
  { district: 'KUSHINAGAR', totalPumps: 260, working: 242, faulty: 18, inspected: 235, pending: 25, activeDles: 5, blocks: ['Padrauna', 'Kasia', 'Hata', 'Tamkuhi Raj'] },
  { district: 'HARDOI', totalPumps: 185, working: 172, faulty: 13, inspected: 160, pending: 25, activeDles: 4, blocks: ['Bilgram', 'Sandila', 'Sandi', 'Kachhauna'] },
  { district: 'SITAPUR', totalPumps: 190, working: 178, faulty: 12, inspected: 165, pending: 25, activeDles: 4, blocks: ['Biswan', 'Laharpur', 'Maholi', 'Sidhauli'] },
];

interface SurveyItem {
  id: string;
  pumpId: string;
  district: string;
  block: string;
  panchayat: string;
  farmer: string;
  capacity: string;
  amcDate: string;
  nextAmcDate: string;
  quarter: string;
  pumpWorking: boolean;
  vfdStatus: 'Normal' | 'Trip / Alert' | 'Offline';
  complaint: string;
  approval: 'Approved' | 'Pending' | 'Rejected';
  surveyor: string;
  remarks: string;
}

const RECENT_SURVEYS_STATIC: SurveyItem[] = [
  { id: '1', pumpId: 'UP-KC-GKP-0104', district: 'GORAKHPUR', block: 'Bhadahawa', panchayat: 'Gauri Bazar', farmer: 'Rameshwar Yadav', capacity: '7.5 HP Submersible', amcDate: '22-10-2026', nextAmcDate: '22-01-2027', quarter: 'Q3 2026-27', pumpWorking: true, vfdStatus: 'Normal', complaint: 'No', approval: 'Approved', surveyor: 'Anand Kumar', remarks: 'Routine AMC check. Solar array clean, discharge 24,500 LPH optimal.' },
  { id: '2', pumpId: 'UP-KC-VNS-0219', district: 'VARANASI', block: 'Pindra', panchayat: 'Karoma', farmer: 'Shiv Kumar Maurya', capacity: '5 HP Submersible', amcDate: '22-10-2026', nextAmcDate: '22-01-2027', quarter: 'Q3 2026-27', pumpWorking: true, vfdStatus: 'Normal', complaint: 'No', approval: 'Approved', surveyor: 'Rajesh Mishra', remarks: 'Earthing pit watered, terminal lugs tightened, normal run.' },
  { id: '3', pumpId: 'UP-KC-PRY-0341', district: 'PRAYAGRAJ', block: 'Koraon', panchayat: 'Lediari', farmer: 'Dharmendra Singh', capacity: '10 HP Submersible', amcDate: '21-10-2026', nextAmcDate: '21-01-2027', quarter: 'Q3 2026-27', pumpWorking: false, vfdStatus: 'Trip / Alert', complaint: 'Raised', approval: 'Pending', surveyor: 'Vikas Tiwari', remarks: 'VFD phase imbalance error. Inverter fuse replaced.' },
  { id: '4', pumpId: 'UP-KC-LKO-0412', district: 'LUCKNOW', block: 'Bakshi Ka Talab', panchayat: 'Kathwara', farmer: 'Kamlesh Verma', capacity: '5 HP Submersible', amcDate: '21-10-2026', nextAmcDate: '21-01-2027', quarter: 'Q3 2026-27', pumpWorking: true, vfdStatus: 'Normal', complaint: 'No', approval: 'Approved', surveyor: 'Sunil Rawat', remarks: 'RMS telemetry verified online with central server.' },
  { id: '5', pumpId: 'UP-KC-AYD-0520', district: 'AYODHYA', block: 'Sohawal', panchayat: 'Raunahi', farmer: 'Ram Dulare Pandey', capacity: '7.5 HP Submersible', amcDate: '20-10-2026', nextAmcDate: '20-01-2027', quarter: 'Q3 2026-27', pumpWorking: true, vfdStatus: 'Normal', complaint: 'No', approval: 'Approved', surveyor: 'Deepak Shukla', remarks: 'Quarterly grease check done on pump thrust bearings.' },
  { id: '6', pumpId: 'UP-KC-BST-0611', district: 'BASTI', block: 'Harraiya', panchayat: 'Khesraha', farmer: 'Harishchandra Pal', capacity: '3 HP Submersible', amcDate: '20-10-2026', nextAmcDate: '20-01-2027', quarter: 'Q3 2026-27', pumpWorking: true, vfdStatus: 'Normal', complaint: 'No', approval: 'Approved', surveyor: 'Manoj Chaudhari', remarks: 'Farmer trained on morning auto-start operation.' },
  { id: '7', pumpId: 'UP-KC-DEO-0745', district: 'DEORIA', block: 'Salempur', panchayat: 'Lar Road', farmer: 'Brijesh Tripathi', capacity: '7.5 HP Submersible', amcDate: '19-10-2026', nextAmcDate: '19-01-2027', quarter: 'Q3 2026-27', pumpWorking: false, vfdStatus: 'Trip / Alert', complaint: 'Raised', approval: 'Pending', surveyor: 'Alok Gupta', remarks: 'Solar module cracked due to hailstorm. Claim raised.' },
  { id: '8', pumpId: 'UP-KC-KSH-0822', district: 'KUSHINAGAR', block: 'Padrauna', panchayat: 'Kasia Rural', farmer: 'Md. Qasim Ansari', capacity: '5 HP Submersible', amcDate: '19-10-2026', nextAmcDate: '19-01-2027', quarter: 'Q3 2026-27', pumpWorking: true, vfdStatus: 'Normal', complaint: 'No', approval: 'Approved', surveyor: 'Praveen Yadav', remarks: 'Pressure gauge calibrated, flow test successful.' },
  { id: '9', pumpId: 'UP-KC-AZM-0914', district: 'AZAMGARH', block: 'Phoolpur', panchayat: 'Pawai', farmer: 'Suraj Bhan Chauhan', capacity: '7.5 HP Submersible', amcDate: '18-10-2026', nextAmcDate: '18-01-2027', quarter: 'Q3 2026-27', pumpWorking: false, vfdStatus: 'Offline', complaint: 'Raised', approval: 'Rejected', surveyor: 'Vijay Prajapati', remarks: 'Lightning arrester damaged by thunder. Controller reboot failed.' },
  { id: '10', pumpId: 'UP-KC-MZP-1033', district: 'MIRZAPUR', block: 'Chunar', panchayat: 'Narayanpur', farmer: 'Tribhuvan Bind', capacity: '10 HP Submersible', amcDate: '18-10-2026', nextAmcDate: '18-01-2027', quarter: 'Q3 2026-27', pumpWorking: true, vfdStatus: 'Normal', complaint: 'No', approval: 'Approved', surveyor: 'Gaurav Patel', remarks: 'Dual axis manual tracking adjusted for winter tilt angle.' },
  { id: '11', pumpId: 'UP-KC-JNP-1108', district: 'JAUNPUR', block: 'Kerakat', panchayat: 'Dobhi', farmer: 'Avinash Srivastava', capacity: '5 HP Submersible', amcDate: '17-10-2026', nextAmcDate: '17-01-2027', quarter: 'Q3 2026-27', pumpWorking: true, vfdStatus: 'Normal', complaint: 'No', approval: 'Approved', surveyor: 'Amit Maurya', remarks: 'Cable junction box sealed against moisture ingress.' },
  { id: '12', pumpId: 'UP-KC-GZP-1215', district: 'GHAZIPUR', block: 'Zamania', panchayat: 'Dildarnagar', farmer: 'Radhe Shyam Kushwaha', capacity: '7.5 HP Submersible', amcDate: '17-10-2026', nextAmcDate: '17-01-2027', quarter: 'Q3 2026-27', pumpWorking: true, vfdStatus: 'Normal', complaint: 'No', approval: 'Approved', surveyor: 'Sanjay Rai', remarks: 'Full load test completed at 12:30 PM peak irradiance.' },
  { id: '13', pumpId: 'UP-KC-JHS-1419', district: 'JHANSI', block: 'Moth', panchayat: 'Garautha', farmer: 'Devendra Bundela', capacity: '10 HP Submersible', amcDate: '16-10-2026', nextAmcDate: '16-01-2027', quarter: 'Q3 2026-27', pumpWorking: true, vfdStatus: 'Normal', complaint: 'No', approval: 'Approved', surveyor: 'Rohit Sengar', remarks: 'Deep tubewell water level stable. RMS data active.' },
  { id: '14', pumpId: 'UP-KC-ALI-1521', district: 'ALIGARH', block: 'Khair', panchayat: 'Tappal', farmer: 'Mahesh Chandra Sharma', capacity: '7.5 HP Submersible', amcDate: '16-10-2026', nextAmcDate: '16-01-2027', quarter: 'Q3 2026-27', pumpWorking: true, vfdStatus: 'Normal', complaint: 'No', approval: 'Approved', surveyor: 'Naveen Kumar', remarks: 'Annual maintenance certificate issued to farmer.' },
  { id: '15', pumpId: 'UP-KC-KNP-034', district: 'KANPUR NAGAR', block: 'Kalyanpur', panchayat: 'Bithoor', farmer: 'Anil Gupta', capacity: '5 HP Submersible', amcDate: '15-10-2026', nextAmcDate: '15-01-2027', quarter: 'Q3 2026-27', pumpWorking: false, vfdStatus: 'Trip / Alert', complaint: 'Raised', approval: 'Pending', surveyor: 'Manoj Pandey', remarks: 'VFD controller display flickering. Capacitor checked.' },
  { id: '16', pumpId: 'UP-KC-MRT-017', district: 'MEERUT', block: 'Daurala', panchayat: 'Sardhana', farmer: 'Harish Tyagi', capacity: '7.5 HP Submersible', amcDate: '15-10-2026', nextAmcDate: '15-01-2027', quarter: 'Q3 2026-27', pumpWorking: true, vfdStatus: 'Normal', complaint: 'No', approval: 'Approved', surveyor: 'Arun Chauhan', remarks: 'Water discharge 25,200 LPH verified. All OK.' },
];

// ─── Export Utilities ─────────────────────────────────────────────────────────
const downloadTextFile = (content: string, filename: string, mimeType: string) => {
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

const exportToCSV = (data: any[], columns: any[], filename: string) => {
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

const copyToClipboard = async (data: any[], columns: any[]) => {
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

const exportToExcel = (data: any[], columns: any[], filename: string) => {
  if (!data?.length || !columns?.length) return;
  const tableHtml = `<table border="1"><thead><tr>${columns.map((c: any) => `<th>${escapeHtml(c.header)}</th>`).join('')}</tr></thead><tbody>${data.map((row: any) => `<tr>${columns.map((c: any) => `<td>${escapeHtml(typeof c.accessor === 'function' ? c.accessor(row) : row[c.accessor])}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8" /></head><body>${tableHtml}</body></html>`;
  downloadTextFile(`\ufeff${html}`, `${filename}.xls`, 'application/vnd.ms-excel');
};

const exportToPDF = (data: any[], columns: any[], title: string) => {
  if (!data?.length || !columns?.length) return;
  const printWindow = window.open('', '_blank', 'width=1200,height=800');
  if (!printWindow) return;
  const rows = data.map((r: any) => columns.map((c: any) => escapeHtml(typeof c.accessor === 'function' ? c.accessor(r) : r[c.accessor])));
  printWindow.document.write(`<!doctype html><html><head><meta charset="UTF-8" /><title>${escapeHtml(title)}</title><style>
    *{box-sizing:border-box}body{font-family:Arial,sans-serif;padding:24px;color:#222}h1{font-size:20px;margin:0 0 16px}
    table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #d8dee6;padding:7px 8px;text-align:left;vertical-align:top}
    th{background:#f3f5f7;font-weight:700}@media print{body{padding:0}@page{size:landscape;margin:12mm}}
  </style></head><body><h1>${escapeHtml(title)}</h1><table><thead><tr>${columns.map((c: any) => `<th>${escapeHtml(c.header)}</th>`).join('')}</tr></thead><tbody>${rows.map((r: any) => `<tr>${r.map((v: any) => `<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table><script>window.onload=function(){window.print();};</script></body></html>`);
  printWindow.document.close();
  printWindow.focus();
};

// ─── Main Component: UPAMCKusumCDashboard ─────────────────────────────────────
export function UPAMCKusumCDashboard() {
  const navigate = useNavigate();

  // Filters State
  const [selectedDistrict, setSelectedDistrict] = useState('All');
  const [selectedBlock, setSelectedBlock] = useState('All');
  const [selectedQuarter, setSelectedQuarter] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [districtSearch, setDistrictSearch] = useState('');
  const [surveySearch, setSurveySearch] = useState('');
  const [hiddenDistCols, setHiddenDistCols] = useState<string[]>([]);
  const [hiddenSurveyCols, setHiddenSurveyCols] = useState<string[]>([]);
  const [updatedAt, setUpdatedAt] = useState<Date>(() => new Date());
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
    const totalPumps = filteredDistricts.reduce((acc, d) => acc + d.totalPumps, 0);
    const working = filteredDistricts.reduce((acc, d) => acc + d.working, 0);
    const faulty = filteredDistricts.reduce((acc, d) => acc + d.faulty, 0);
    const inspected = filteredDistricts.reduce((acc, d) => acc + d.inspected, 0);
    const pending = filteredDistricts.reduce((acc, d) => acc + d.pending, 0);
    const totalDles = filteredDistricts.reduce((acc, d) => acc + d.activeDles, 0);
    const districtsCount = filteredDistricts.length;
    const workingPct = pctOf(working, totalPumps);
    const faultyPct = pctOf(faulty, totalPumps);
    const inspectedPct = pctOf(inspected, totalPumps);

    return {
      totalPumps,
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
      if (selectedStatus === 'Working' && !s.pumpWorking) return false;
      if (selectedStatus === 'Faulty' && s.pumpWorking) return false;
      if (selectedStatus === 'Approved' && s.approval !== 'Approved') return false;
      if (selectedStatus === 'Pending' && s.approval !== 'Pending') return false;

      const q = deferredSurveyQuery.trim().toLowerCase();
      if (!q) return true;
      return (
        s.pumpId.toLowerCase().includes(q) ||
        s.district.toLowerCase().includes(q) ||
        s.block.toLowerCase().includes(q) ||
        s.panchayat.toLowerCase().includes(q) ||
        s.farmer.toLowerCase().includes(q) ||
        s.surveyor.toLowerCase().includes(q)
      );
    });
  }, [selectedDistrict, selectedBlock, selectedQuarter, selectedStatus, deferredSurveyQuery]);

  // Pagination for Surveys Table
  const {
    paginatedData: pagedSurveys,
    currentPage: curPage,
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
  const handleAssignClick = () => navigate('/dle/up/kusumc/amc/create-assign');
  const handleViewAssignClick = () => navigate('/dle/up/kusumc/amc/view-assign');
  const handleViewSurveyClick = (_params: Record<string, string> = {}) => {
    navigate('/dle/up/kusumc/amc/view-assign');
  };

  // Sparkline data arrays
  const sparkTotal = [4200, 4350, 4500, 4650, 4750, 4820, 4850];
  const sparkWorking = [3850, 3980, 4120, 4240, 4320, 4380, 4392];
  const sparkFaulty = [350, 370, 380, 410, 430, 440, 458];
  const sparkInspected = [3100, 3280, 3450, 3620, 3780, 3890, 3940];
  const sparkPending = [1100, 1070, 1050, 1030, 970, 930, 910];
  const sparkTechs = [85, 92, 98, 110, 122, 134, 142];

  // Milestones Progress
  const milestones = [
    { label: '1. Total KUSUM-C Solar Pump Geo-Tagging', v: kpis.totalPumps, of: kpis.totalPumps, color: 'var(--ax-accent)' },
    { label: '2. Q3 Physical AMC Inspection Done', v: kpis.inspected, of: kpis.totalPumps, color: 'var(--ax-viz-cyan)' },
    { label: '3. Functional Working Pumps Verified', v: kpis.working, of: kpis.totalPumps, color: 'var(--ax-viz-emerald)' },
    { label: '4. Survey Verified & Approved by GP', v: kpis.approvedSurveys, of: kpis.inspected, color: 'var(--ax-viz-violet)' },
    { label: '5. Faults & VFD Trips Rectified', v: Math.round(kpis.faulty * 0.88), of: kpis.faulty, color: 'var(--ax-viz-amber)' },
  ];

  // Export Columns Definition
  const districtExportCols = [
    { header: 'District', accessor: 'district' },
    { header: 'Total Pumps', accessor: 'totalPumps' },
    { header: 'Working Pumps', accessor: 'working' },
    { header: 'Faulty / Breakdown', accessor: 'faulty' },
    { header: 'AMC Inspected', accessor: 'inspected' },
    { header: 'Pending Inspection', accessor: 'pending' },
    { header: 'Active DLEs', accessor: 'activeDles' },
    { header: 'Working %', accessor: (r: any) => `${pctOf(r.working, r.totalPumps)}%` },
  ];

  const surveyExportCols = [
    { header: 'Pump ID', accessor: 'pumpId' },
    { header: 'District', accessor: 'district' },
    { header: 'Block', accessor: 'block' },
    { header: 'Panchayat', accessor: 'panchayat' },
    { header: 'Farmer / Beneficiary', accessor: 'farmer' },
    { header: 'Capacity', accessor: 'capacity' },
    { header: 'AMC Date', accessor: 'amcDate' },
    { header: 'Quarter', accessor: 'quarter' },
    { header: 'Pump Status', accessor: (r: any) => (r.pumpWorking ? 'Working' : 'Faulty') },
    { header: 'VFD Status', accessor: 'vfdStatus' },
    { header: 'Surveyor', accessor: 'surveyor' },
    { header: 'Approval', accessor: 'approval' },
  ];

  const stamp = new Date().toISOString().slice(0, 10);

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      {/* ─── 1. Page Header ────────────────────────────────────────────── */}
      <PageHead
        title="UP AMC KUSUM-C Dashboard"
        subtitle={
          <span style={{ display: 'inline-block', fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>
            Uttar Pradesh · PM-KUSUM Component-C Solar Water Pump Annual Maintenance Contract (AMC) Operations
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
          aria-label="UP AMC KUSUM-C Dashboard Filters"
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
                  <option value="Working">Working Pumps</option>
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
              {/* <button
                type="button"
                className="ax-btn ax-btn--sm ax-btn--ghost"
                onClick={handleAssignClick}
                style={{ fontSize: 'var(--ax-text-xs)' }}
              >
                + Assign Pumps
              </button> */}
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

        {/* ─── 3. Executive Welcome Banner (Exact match to "Welcome to UP AMC SSL Dashboard") ─── */}
        <section className="ax-card ax-welcome ax-col--12" role="region" aria-label="UP AMC KUSUM-C Overview">
          <div className="ax-welcome__body">
            <div className="ax-welcome__text">
              <p className="ax-welcome__eyebrow">UP State AMC Operations · DLE Management System</p>
              <h2 className="ax-card__title">Welcome to UP AMC KUSUM-C Dashboard</h2>
              <p className="ax-welcome__lede">
                Solar Water Pump (PM-KUSUM Component-C) AMC overview for Uttar Pradesh: Tracking <b>{num(kpis.totalPumps)} solar pumps</b> across <b>{kpis.districtsCount} districts</b>.
                Currently <b>{num(kpis.working)} pumps ({kpis.workingPct}%)</b> are functional, with <b>{num(kpis.inspected)} ({kpis.inspectedPct}%)</b> physical inspections completed and verified in the active cycle.
              </p>
            </div>

            <dl className="ax-welcome__stats">
              <div className="ax-welcome__stat">
                <dt>Total KUSUM-C Pumps</dt>
                <dd className="ax-num">{num(kpis.totalPumps)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-accent)' }}>{kpis.districtsCount} UP Districts</small>
              </div>
              <div className="ax-welcome__stat">
                <dt>Working Pumps</dt>
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

        {/* ─── 4. Primary KPI Cards Grid (8 Cards with live sparklines) ──── */}
        <KpiCard
          icon={I_PUMP}
          tone="accent"
          label="Total KUSUM-C Pumps"
          value={num(kpis.totalPumps)}
          unit="Pumps"
          sub="Contracted under AMC"
          spark={sparkTotal}
          onClick={() => handleViewSurveyClick()}
        />

        <KpiCard
          icon={I_DONE}
          tone="emerald"
          label="Working Pumps"
          value={num(kpis.working)}
          unit="Pumps"
          sub="Pumping water normally"
          badge={`${kpis.workingPct}%`}
          spark={sparkWorking}
          onClick={() => handleViewSurveyClick({ status: 'Working' })}
        />

        <KpiCard
          icon={I_X}
          tone="red"
          label="Faulty / Breakdown"
          value={num(kpis.faulty)}
          unit="Pumps"
          sub="VFD or motor issue"
          badge={`${kpis.faultyPct}%`}
          spark={sparkFaulty}
          onClick={() => handleViewSurveyClick({ status: 'Faulty' })}
        />

        <KpiCard
          icon={I_BOLT}
          tone="cyan"
          label="AMC Inspected"
          value={num(kpis.inspected)}
          unit="Pumps"
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
          unit="Pumps"
          sub="Awaiting quarterly survey"
          badge={`${pctOf(kpis.pending, kpis.totalPumps)}%`}
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
          spark={[12, 14, 15, 16, 17, 18, 20]}
        />

        {/* ─── 5. Integrated Operational Highlights Card Row ─────────────── */}
        <div className="ax-col--12" style={{ marginTop: 'var(--ax-space-2)', marginBottom: 'var(--ax-space-1)' }}>
          <div className="ax-cluster" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--ax-space-2)' }}>
            <div>
              <span className="ax-card__eyebrow" style={{ color: 'var(--ax-accent)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                Uttar Pradesh Field AMC Operations & Verification Tracking
              </span>
              <h2 className="ax-card__title" style={{ fontSize: 'var(--ax-text-lg)', margin: 0 }}>
                KUSUM-C Maintenance Workflow & Daily Field Execution
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
              <p className="ax-card__subtitle">{num(kpis.working)} of {num(kpis.totalPumps)} solar pumps operational</p>
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
                <small style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-xs)' }}>Working Pumps</small>
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
                <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>Pump Maintenance Efficiency</span>
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
              <b>Active Focus:</b> Gorakhpur, Varanasi & Prayagraj lead with over 1,100+ solar pumps surveyed with SLA turnaround &lt; 48 hours.
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
            {/* <button
              type="button"
              className="ax-btn ax-btn--sm ax-btn--ghost"
              onClick={handleAssignClick}
            > 
              + Assign New Task
            </button> */}
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
                  84 Pumps <span style={{ fontSize: 'var(--ax-text-xs)', fontWeight: 500 }}>(16 Repaired)</span>
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
              <b>Field DLE Network:</b> GPS-tagged solar pump inspections with VFD controller parameter testing, submersible motor load, and module cleaning logs.
            </div>
          </div>
        </section>

        {/* ─── 6. Charts: District Distribution + Status Donut ───────────── */}
        <section className="ax-card ax-card--chart ax-col--8" role="region" aria-label="District wise KUSUM-C AMC Status">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Geographic Breakdown</span>
              <h2 className="ax-card__title">District Wise KUSUM-C AMC Status</h2>
              <p className="ax-card__subtitle">Working vs Faulty solar water pumps across UP districts</p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)' }}>
                {[
                  { l: 'Working Pumps', c: LIGHT_GREEN },
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
                key={`kc-dist-chart-${chartH}-${filteredDistricts.length}`}
                type="bar"
                height={chartH}
                legend="none"
                ariaLabel="Working and Faulty solar pumps by district"
                series={[
                  { name: 'Working Pumps', data: filteredDistricts.map((d) => d.working) },
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
                  yaxis: { title: { text: 'Pumps (Nos.)', style: { color: 'var(--ax-text-muted)' } } },
                  chart: {
                    events: {
                      dataPointSelection: (_event: any, _chart: any, opts: any) => {
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
        <section className="ax-card ax-col--4" role="region" aria-label="KUSUM-C AMC Health Distribution">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Health Ratio</span>
              <h2 className="ax-card__title">Pump Health Distribution</h2>
              <p className="ax-card__subtitle">Total {num(kpis.totalPumps)} Solar Pumps</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <Suspense fallback={<div className="ax-skeleton" style={{ height: donutH }} />}>
              <ApexChart
                key={`kc-donut-${donutH}-${kpis.working}-${kpis.faulty}-${kpis.pending}`}
                type="donut"
                height={donutH}
                legend="none"
                ariaLabel="Working vs Faulty vs Pending solar pumps"
                series={[kpis.working, kpis.faulty, kpis.pending]}
                apex={{
                  labels: ['Working Pumps', 'Faulty / Breakdown', 'Pending Inspection'],
                  colors: [LIGHT_GREEN, LIGHT_RED, LIGHT_AMBER],
                  stroke: { width: 0 },
                  plotOptions: {
                    pie: {
                      donut: {
                        size: '72%',
                        labels: {
                          show: true,
                          name: { fontFamily: 'inherit' },
                          value: { fontFamily: 'inherit', fontWeight: 600, formatter: (val: any) => num(Number(val)) },
                          total: {
                            show: true,
                            label: 'Total Pumps',
                            formatter: () => num(kpis.totalPumps),
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
                { label: 'Working Pumps', sub: 'Tested & Operational', v: kpis.working, p: kpis.workingPct, color: 'var(--ax-viz-emerald)' },
                { label: 'Faulty / Repair', sub: 'VFD / Motor / Cable Issue', v: kpis.faulty, p: kpis.faultyPct, color: 'var(--ax-viz-red)' },
                { label: 'Pending Inspection', sub: 'Awaiting Q3 physical visit', v: kpis.pending, p: pctOf(kpis.pending, kpis.totalPumps), color: 'var(--ax-viz-amber)' },
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
              <p className="ax-card__subtitle">Daily completed pump surveys vs faults resolved</p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)' }}>
                {[
                  { l: 'Pumps Inspected', c: LIGHT_BLUE },
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
                key={`kc-trend-${chartH}`}
                type="area"
                height={chartH}
                legend="none"
                ariaLabel="Daily AMC Inspection Trend"
                series={[
                  { name: 'Pumps Inspected', data: [75, 88, 82, 95, 90, 105, 100, 115, 118, 110, 122, 130, 125, 138] },
                  { name: 'Faults Resolved', data: [12, 16, 14, 18, 17, 22, 20, 25, 24, 21, 26, 28, 27, 31] },
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
                  yaxis: { title: { text: 'Pumps Count', style: { color: 'var(--ax-text-muted)' } } },
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
              <p className="ax-card__subtitle">Stage-wise pump service completion</p>
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
        <section className="ax-card ax-col--12" role="region" aria-label="UP District Wise KUSUM-C AMC Summary">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Geographic Summary</span>
              <h2 className="ax-card__title">UP District Wise AMC Performance</h2>
              <p className="ax-card__subtitle">Consolidated KUSUM-C solar pumps, health status and coverage per district</p>
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
                onExportCSV={() => exportToCSV(tableDistricts, districtExportCols, `UP_KUSUMC_AMC_Districts_${stamp}`)}
                onExportExcel={() => exportToExcel(tableDistricts, districtExportCols, `UP_KUSUMC_AMC_Districts_${stamp}`)}
                onExportPDF={() => exportToPDF(tableDistricts, districtExportCols, 'UP District Wise KUSUM-C AMC Performance')}
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
                  <th className="ax-table__th ax-table__th--num" scope="col">Total Pumps</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Working Pumps</th>
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
                  const healthPct = pctOf(d.working, d.totalPumps);
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
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ fontWeight: 600 }}>{num(d.totalPumps)}</td>
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
                          View Pumps →
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
                    <td className="ax-table__td ax-table__td--num ax-num">{num(kpis.totalPumps)}</td>
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
        <section className="ax-card ax-col--12" role="region" aria-label="Recent KUSUM-C Field AMC Surveys">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Field Inspections Log</span>
              <h2 className="ax-card__title">Recent KUSUM-C AMC Field Surveys & Verifications</h2>
              <p className="ax-card__subtitle">Showing {totalItems} verified survey logs with pump status and approval</p>
            </div>
            <div className="ax-card__actions">
              <SearchInput
                value={surveySearch}
                onChange={setSurveySearch}
                placeholder="Search Pump ID, district, surveyor…"
                ariaLabel="Search field survey logs"
              />
              <TableExportToolbar
                onCopy={() => copyToClipboard(filteredSurveys, surveyExportCols)}
                onExportCSV={() => exportToCSV(filteredSurveys, surveyExportCols, `UP_KUSUMC_Surveys_${stamp}`)}
                onExportExcel={() => exportToExcel(filteredSurveys, surveyExportCols, `UP_KUSUMC_Surveys_${stamp}`)}
                onExportPDF={() => exportToPDF(filteredSurveys, surveyExportCols, 'UP KUSUM-C AMC Field Surveys')}
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
                  <th className="ax-table__th" scope="col">Pump ID</th>
                  <th className="ax-table__th" scope="col">District</th>
                  <th className="ax-table__th" scope="col">Block / Panchayat</th>
                  <th className="ax-table__th" scope="col">Farmer & Capacity</th>
                  <th className="ax-table__th" scope="col">AMC Date</th>
                  <th className="ax-table__th" scope="col">Pump Status</th>
                  <th className="ax-table__th" scope="col">VFD Status</th>
                  <th className="ax-table__th" scope="col">Surveyor</th>
                  <th className="ax-table__th" scope="col">Approval</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedSurveys.map((r) => (
                  <tr key={r.id} className="ax-table__row">
                    <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono)', fontWeight: 600, color: 'var(--ax-accent)' }}>
                      {r.pumpId}
                    </td>
                    <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                      {r.district}
                    </td>
                    <td className="ax-table__td">
                      <div style={{ fontWeight: 500 }}>{r.block}</div>
                      <small style={{ color: 'var(--ax-text-muted)', fontSize: '11px' }}>{r.panchayat}</small>
                    </td>
                    <td className="ax-table__td">
                      <div>{r.farmer}</div>
                      <small style={{ color: 'var(--ax-text-muted)', fontSize: '11px' }}>{r.capacity}</small>
                    </td>
                    <td className="ax-table__td" style={{ whiteSpace: 'nowrap' }}>
                      <div>{r.amcDate}</div>
                      <small style={{ color: 'var(--ax-text-muted)', fontSize: '11px' }}>{r.quarter}</small>
                    </td>
                    <td className="ax-table__td">
                      <span className={`ax-badge ax-badge--soft ${r.pumpWorking ? 'ax-badge--success' : 'ax-badge--danger'}`}>
                        {r.pumpWorking ? '● Working' : '✕ Faulty'}
                      </span>
                    </td>
                    <td className="ax-table__td">
                      <span
                        className={`ax-badge ax-badge--soft ${
                          r.vfdStatus === 'Normal' ? 'ax-badge--success' : r.vfdStatus === 'Trip / Alert' ? 'ax-badge--warning' : 'ax-badge--danger'
                        }`}
                      >
                        {r.vfdStatus}
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
                        onClick={() => handleViewSurveyClick({ id: r.pumpId })}
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

export default UPAMCKusumCDashboard;
