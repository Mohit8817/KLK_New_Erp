import { lazy, Suspense, useCallback, useDeferredValue, useEffect, useMemo, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  jammuRescoService,
  normalizeRescoStatus,
  type JammuRescoDashboardData,
} from '../../jammu-services';
import {
  TableExportToolbar,
  SearchInput,
  Pagination,
  TableEmptyState,
  usePagination,
  type ExportColumn,
} from '../../../../../common';

// Code-split ApexCharts so the shell and tables render instantly
const ApexChart = lazy(() => import('../../../../charts/ApexChart').then((m) => ({ default: m.ApexChart })));

/* ───────── Colors ───────── */
const LIGHT_BLUE = '#4992ff';
const LIGHT_GREEN = '#86DDB2';
const LIGHT_AMBER = '#F6D68A';
const LIGHT_RED = '#ef6a6a';

/* ───────── Types ───────── */
interface JammuRescoSummary {
  site_count: number;
  complete: number;
  pending: number;
  verify_approved: number;
  verify_pending: number;
  verify_reject: number;
  doc_approved: number;
  doc_pending: number;
  doc_reject: number;
  inst_claim1_applicable: number;
  inst_claim1_raised: number;
  inst_claim1_approved: number;
  inst_claim1_pending: number;
  inst_claim1_reject: number;
  inst_claim2_applicable: number;
  inst_claim2_raised: number;
  inst_claim2_approved: number;
  inst_claim2_pending: number;
  inst_claim2_reject: number;
  inst_claim3_applicable: number;
  inst_claim3_raised: number;
  inst_claim3_approved: number;
  inst_claim3_pending: number;
  inst_claim3_reject: number;
  inst_pay1_complete: number;
  inst_pay1_partially: number;
  inst_pay1_pending: number;
  inst_pay2_complete: number;
  inst_pay2_partially: number;
  inst_pay2_pending: number;
  inst_pay3_complete: number;
  inst_pay3_partially: number;
  inst_pay3_pending: number;
  material_dispatch?: number;
  material_pending?: number;
}

interface DistrictRow extends JammuRescoSummary {
  district: string;
}

/* ───────── Helpers ───────── */
const n = (v: unknown) => Number(v ?? 0) || 0;
const num = (x: unknown) => n(x).toLocaleString('en-IN');
const pctOf = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : 0);
const pad = (x: number) => String(x).padStart(2, '0');
const fmtDate = (d: Date | null) => (d ? `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}` : '—');
const fmtTime = (d: Date) => d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();
const cv = (name: string) => (typeof window !== 'undefined' ? getComputedStyle(document.documentElement).getPropertyValue(name).trim() : '');
const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const fmtMonth = (s: string) => {
  const [y, m] = String(s || '').split('-');
  const mi = Number(m);
  if (!y || !mi) return s || '';
  return `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][mi - 1]} ${y}`;
};

const onActivate = (fn: () => void) => (e: KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    fn();
  }
};

const useIsMobile = (breakpoint = 640) => {
  const get = () => typeof window !== 'undefined' && window.innerWidth < breakpoint;
  const [m, setM] = useState(get);
  useEffect(() => {
    const onResize = () => setM(get());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [breakpoint]);
  return m;
};

// API ke raw object ko number-safe summary me convert karta hai (null => 0)
const toSummary = (o: any): JammuRescoSummary => {
  const src = o?.resco || o?.data?.resco || o?.data || o || {};
  const total = n(src?.site_count ?? src?.total);
  const complete = n(src?.complete ?? src?.inst_complete);
  const pending = n(src?.pending);

  return {
    site_count: total,
    complete,
    pending,
    verify_approved: n(src?.verify_approved),
    verify_pending: n(src?.verify_pending),
    verify_reject: n(src?.verify_reject),
    doc_approved: n(src?.doc_approved),
    doc_pending: n(src?.doc_pending),
    doc_reject: n(src?.doc_reject),
    inst_claim1_applicable: n(src?.inst_claim1_applicable),
    inst_claim1_raised: n(src?.inst_claim1_raised),
    inst_claim1_approved: n(src?.inst_claim1_approved),
    inst_claim1_pending: n(src?.inst_claim1_pending),
    inst_claim1_reject: n(src?.inst_claim1_reject),
    inst_claim2_applicable: n(src?.inst_claim2_applicable),
    inst_claim2_raised: n(src?.inst_claim2_raised),
    inst_claim2_approved: n(src?.inst_claim2_approved),
    inst_claim2_pending: n(src?.inst_claim2_pending),
    inst_claim2_reject: n(src?.inst_claim2_reject),
    inst_claim3_applicable: n(src?.inst_claim3_applicable),
    inst_claim3_raised: n(src?.inst_claim3_raised),
    inst_claim3_approved: n(src?.inst_claim3_approved),
    inst_claim3_pending: n(src?.inst_claim3_pending),
    inst_claim3_reject: n(src?.inst_claim3_reject),
    inst_pay1_complete: n(src?.inst_pay1_complete),
    inst_pay1_partially: n(src?.inst_pay1_partially),
    inst_pay1_pending: n(src?.inst_pay1_pending),
    inst_pay2_complete: n(src?.inst_pay2_complete),
    inst_pay2_partially: n(src?.inst_pay2_partially),
    inst_pay2_pending: n(src?.inst_pay2_pending),
    inst_pay3_complete: n(src?.inst_pay3_complete),
    inst_pay3_partially: n(src?.inst_pay3_partially),
    inst_pay3_pending: n(src?.inst_pay3_pending),
    material_dispatch: n(src?.material_dispatch),
    material_pending: n(src?.material_pending),
  };
};

/* ───────── Layout CSS (Matches Jammu SRT 70MW Dashboard) ───────── */
const PAGE_CSS = `
  .solar-erp-page {
    --asw-primary: #2563eb;
    --asw-primary-rgb: 37, 99, 235;
  }
  .solar-erp-page .ax-page-head { margin-block-end: 10px; }
  .solar-erp-page .ax-page-head .ax-breadcrumb { margin-block-end: 4px; }
  .solar-erp-page .ax-dash-grid { margin-top: 0; }
  .solar-erp-page .ax-card { min-width: 0; }
  .solar-erp-page .ax-card__footer { width: 100%; box-sizing: border-box; }
  .solar-erp-page .ula-pagination-left {
    width: 100%; display: flex; justify-content: flex-start; align-items: center; margin: 0; overflow-x: auto;
  }
  .solar-erp-page .ula-pagination-left > * { margin-left: 0 !important; margin-right: 0 !important; }

  .solar-erp-page .ax-card__header {
    display: flex; flex-wrap: nowrap; align-items: flex-start; justify-content: space-between; gap: 12px;
  }
  .solar-erp-page .ax-card__titles { flex: 1 1 220px; min-width: 220px; max-width: 100%; }
  .solar-erp-page .ax-card__title,
  .solar-erp-page .ax-card__eyebrow,
  .solar-erp-page .ax-card__subtitle {
    max-width: none; word-break: normal; overflow-wrap: normal; hyphens: none;
  }
  .solar-erp-page .ax-card__subtitle { line-height: 1.45; }

  .solar-erp-page .ax-card__actions {
    flex: 0 1 auto; min-width: 0; margin-left: auto; display: flex; align-items: center;
    justify-content: flex-end; flex-wrap: nowrap; gap: 8px;
  }
  .solar-erp-page .ax-card__actions .ax-cluster { flex-wrap: nowrap !important; min-width: 0; justify-content: flex-end; }
  .solar-erp-page .ax-card__actions .ax-search,
  .solar-erp-page .ax-card__actions [class*="search"] { flex: 1 1 140px; min-width: 90px; max-width: 260px; }
  .solar-erp-page .ax-card__actions input { min-width: 0; width: 100%; }
  .solar-erp-page .ax-card__actions .ax-export-toolbar,
  .solar-erp-page .ax-card__actions [class*="export-toolbar"] {
    flex: 0 1 auto; min-width: 0; flex-wrap: nowrap; gap: 4px;
  }
  .solar-erp-page .ax-export-toolbar__button { padding-inline: 8px !important; min-width: 0; }

  .solar-erp-page .ax-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; width: 100%; max-width: 100%; }
  .solar-erp-page .ula-table--md { min-width: 960px; }
  .solar-erp-page .ax-welcome__lede { max-width: 780px; }
  .solar-erp-page .ula-filter-item { display: flex; align-items: center; gap: 6px; }
  .solar-erp-page .ula-filter-item select { width: 170px; }

  .asw-interactive-kpi {
    cursor: pointer;
    transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
  }
  .asw-interactive-kpi:hover {
    transform: translateY(-2px);
    box-shadow: var(--ax-shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
    border-color: rgba(var(--asw-primary-rgb), 0.35) !important;
  }
  .solar-erp-page .kpi-seg {
    cursor: pointer; border-radius: 4px; padding: 0 2px; transition: background 120ms ease, color 120ms ease;
  }
  .solar-erp-page .kpi-seg:hover { background: rgba(var(--asw-primary-rgb), 0.12); color: var(--asw-primary); text-decoration: underline; }
  .solar-erp-page .kpi-seg:focus-visible { outline: 2px solid var(--asw-primary); outline-offset: 1px; }
  .solar-erp-page .click-cell { cursor: pointer; }
  .solar-erp-page .click-cell:hover { text-decoration: underline; }

  @media (max-width: 1100px) {
    .solar-erp-page .ax-col--8,
    .solar-erp-page .ax-col--6,
    .solar-erp-page .ax-col--4 { grid-column: span 12; }
    .solar-erp-page .ax-col--3 { grid-column: span 6; }
    .solar-erp-page .ax-export-toolbar__button { font-size: 0; gap: 0; padding: 0 8px !important; justify-content: center; }
    .solar-erp-page .ax-export-toolbar__button svg { width: 16px; height: 16px; flex-shrink: 0; }
    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] { max-width: 200px; }
  }

  @media (max-width: 760px) {
    .solar-erp-page { width: 100%; max-width: 100%; overflow-x: hidden; box-sizing: border-box; }
    .solar-erp-page .ax-welcome__stats { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
    .solar-erp-page .ula-filter-item { width: 100%; justify-content: space-between; }
    .solar-erp-page .ula-filter-item select { flex: 1; width: auto; max-width: 100%; }
    .solar-erp-page .ula-filter-scope { width: 100%; }
    .solar-erp-page .ax-card__header { flex-direction: column; flex-wrap: nowrap; align-items: stretch; gap: 10px; }
    .solar-erp-page .ax-card__titles { flex: 0 0 auto; min-width: 0; width: 100%; max-width: 100%; }
    .solar-erp-page .ax-card__title { font-family: var(--ax-font-display); font-size: var(--ax-text-md); line-height: var(--ax-leading-md); }
    .solar-erp-page .ax-card__actions { flex: 0 0 auto; width: 100%; margin-left: 0; flex-wrap: wrap; justify-content: flex-start; }
    .solar-erp-page .ax-card__actions .ax-cluster { flex-wrap: wrap !important; width: 100%; justify-content: flex-start; gap: 8px; }
    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] { flex: 1 1 100%; width: 100%; max-width: 100%; min-width: 0; }
    .solar-erp-page .ax-card__actions .ax-export-toolbar,
    .solar-erp-page .ax-card__actions [class*="export-toolbar"] { flex: 1 1 100%; flex-wrap: wrap; justify-content: flex-start; gap: 6px; }
    .solar-erp-page .ax-export-toolbar__button { font-size: 12px; gap: 4px; height: 30px; padding: 0 8px !important; }
  }

  @media (max-width: 490px) {
    .solar-erp-page .ax-welcome__stats { grid-template-columns: 1fr !important; }
    .solar-erp-page .ax-col--3 { grid-column: span 12; }
    .solar-erp-page .ax-export-toolbar__button { font-size: 11px; height: 28px; padding: 0 6px !important; }
  }
`;

/* ───────── Icons ───────── */
const ICON_REFRESH = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" /><path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" /></svg>
);
const ICON_FILTER = (
  <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 4h16v2.172a2 2 0 0 1 -.586 1.414l-4.828 4.828v7.586l-4 -2v-5.586l-4.828 -4.828a2 2 0 0 1 -.586 -1.414v-2.172z" /></svg>
);
const svg = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const I_PIN = svg(<><path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /><path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0" /></>);
const I_DONE = svg(<><path d="M7 12l5 5l10 -10" /><path d="M2 12l5 5m5 -5l5 -5" /></>);
const I_COIN = svg(<><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M14.8 9a2 2 0 0 0 -1.8 -1h-2a2 2 0 1 0 0 4h2a2 2 0 1 1 0 4h-2a2 2 0 0 1 -1.8 -1" /><path d="M12 7v10" /></>);
const I_LIST = svg(<><path d="M9 6l11 0" /><path d="M9 12l11 0" /><path d="M9 18l11 0" /><path d="M5 6l0 .01" /><path d="M5 12l0 .01" /><path d="M5 18l0 .01" /></>);
const I_EYE = svg(<><circle cx="12" cy="12" r="2" /><path d="M22 12c-2.667 4.667 -6 7 -10 7s-7.333 -2.333 -10 -7c2.667 -4.667 6 -7 10 -7s7.333 2.333 10 7" /></>);
const I_SHIELD = svg(<><path d="M12 3a12 12 0 0 0 8.5 3a12 12 0 0 1 -8.5 15a12 12 0 0 1 -8.5 -15a12 12 0 0 0 8.5 -3" /><path d="M9 12l2 2l4 -4" /></>);
const I_TRUCK = svg(<><path d="M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /><path d="M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /><path d="M5 17h-2v-11a1 1 0 0 1 1 -1h9v12m-4 0h6m4 0h2v-6h-4l-2 -3h-4v9" /></>);

/* ───────── KPI Card (clickable card + clickable number segments) ───────── */
interface KpiProps {
  icon: ReactNode;
  tone: 'accent' | 'cyan' | 'emerald' | 'amber' | 'violet' | 'pink' | 'red';
  label: string;
  value?: string;
  unit?: string;
  sub: string;
  badge?: string;
  spark?: number[];
  sparkType?: 'line' | 'bar' | 'area';
  onClick?: () => void;
  pills?: { label: string; count: number | string; onClick?: () => void }[];
}
const TONE: Record<KpiProps['tone'], { bg: string; fg: string; apex: string }> = {
  accent: { bg: 'rgba(37, 99, 235, 0.12)', fg: '#2563eb', apex: '#2563eb' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan, #06b6d4) 14%, transparent)', fg: '#0891b2', apex: '#0891b2' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald, #10b981) 14%, transparent)', fg: '#16a34a', apex: '#16a34a' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber, #f59e0b) 14%, transparent)', fg: '#d97706', apex: '#d97706' },
  violet: { bg: 'color-mix(in oklab, var(--ax-viz-violet, #8b5cf6) 14%, transparent)', fg: '#7c3aed', apex: '#7c3aed' },
  pink: { bg: 'color-mix(in oklab, var(--ax-viz-pink, #ec4899) 14%, transparent)', fg: '#db2777', apex: '#db2777' },
  red: { bg: 'color-mix(in oklab, var(--ax-viz-red, #ef4444) 14%, transparent)', fg: '#dc2626', apex: '#dc2626' },
};

function KpiCard({ icon, tone, label, value, unit, sub, badge, spark, sparkType = 'line', onClick, pills }: KpiProps) {
  const t = TONE[tone];
  const hasSpark = Array.isArray(spark) && spark.length > 1;
  const allZeros = hasSpark && spark!.every((v) => v === 0);
  const safeSpark = allZeros ? [0, 0, 0, 0, 0] : spark;

  return (
    <div
      className={`ax-card ax-col--3 ${onClick ? 'asw-interactive-kpi' : ''}`}
      role={onClick ? 'button' : 'region'}
      tabIndex={onClick ? 0 : undefined}
      aria-label={label}
      onClick={onClick}
      onKeyDown={onClick ? onActivate(onClick) : undefined}
      style={{
        borderRadius: 'var(--ax-radius-lg, 12px)',
        background: 'var(--ax-bg-surface, #ffffff)',
        border: '1px solid var(--ax-border, #e2e8f0)',
      }}
    >
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <span style={{ width: 28, height: 28, borderRadius: 'var(--ax-radius-md, 8px)', background: t.bg, color: t.fg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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
              {pills && pills.length > 0
                ? pills.map((seg, i) => (
                    <span key={seg.label}>
                      {i > 0 && <span style={{ color: 'var(--ax-text-muted)', fontWeight: 500, margin: '0 4px' }}>/</span>}
                      <span
                        className={seg.onClick ? 'kpi-seg' : undefined}
                        role={seg.onClick ? 'button' : undefined}
                        tabIndex={seg.onClick ? 0 : undefined}
                        title={seg.onClick ? `View ${seg.label} sites` : undefined}
                        onClick={seg.onClick ? (e) => { e.stopPropagation(); seg.onClick!(); } : undefined}
                        onKeyDown={seg.onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); seg.onClick!(); } } : undefined}
                      >
                        {seg.count}
                      </span>
                    </span>
                  ))
                : value}{' '}
              {unit && <small style={{ fontSize: '11px', fontWeight: 500, color: 'var(--ax-text-muted)' }}>{unit}</small>}
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
                  apex={{ yaxis: { min: 0, forceNiceScale: true }, plotOptions: { bar: { columnWidth: '60%', borderRadius: 2 } } }}
                />
              </Suspense>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Bar({ pct }: { pct: number }) {
  return (
    <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', flexWrap: 'wrap' }}>
      <div className="ax-progress ax-progress--sm" style={{ minWidth: 80, width: 80 }}>
        <div className="ax-progress__track">
          <div className="ax-progress__fill" style={{ width: `${pct}%`, background: pct >= 90 ? 'var(--ax-viz-emerald)' : 'var(--ax-accent)' }} />
        </div>
      </div>
      <span className="ax-num" style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>{pct}%</span>
    </div>
  );
}

const labelStyle = { fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)', fontWeight: 500 } as const;
const selectStyle = { height: 30, fontSize: 'var(--ax-text-xs)', paddingInline: '8px' } as const;
const actionsRowStyle = { gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', width: '100%' } as const;
const footerStyle = {
  borderTop: '1px solid var(--ax-border, #e2e8f0)',
  padding: 'var(--ax-space-3) var(--ax-space-4)',
  display: 'flex',
  justifyContent: 'flex-start',
  alignItems: 'center',
  width: '100%',
  boxSizing: 'border-box',
} as const;
const emptyCellStyle = { textAlign: 'center', padding: 24, color: 'var(--ax-text-muted)' } as const;

export function RescoDashboard() {
  const navigate = useNavigate();
  const isMobile = useIsMobile(640);
  const [data, setData] = useState<JammuRescoDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [qDistrict, setQDistrict] = useState<string>('');

  const chartH = isMobile ? 260 : 320;
  const donutH = isMobile ? 210 : 230;

  const loadDashboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setLoading(true);
    setApiError(null);
    try {
      const resp = await jammuRescoService.getDashboard();
      if (resp) {
        setData(resp);
        setUpdatedAt(new Date());
      } else {
        setApiError('Unable to load Jammu RESCO dashboard data.');
      }
    } catch (err: any) {
      console.warn('[Jammu RESCO Dashboard] load error:', err);
      setApiError(err?.message || 'Failed to load Jammu RESCO installation dashboard.');
    } finally {
      setLoading(false);
      if (isRefresh) setTimeout(() => setIsRefreshing(false), 400);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  /* ───────── Data resolution ───────── */
  const rawSummary: JammuRescoSummary = useMemo(() => toSummary(data), [data]);

  const districtwise: DistrictRow[] = useMemo(() => {
    const list = Array.isArray(data?.districtwise) && data!.districtwise.length > 0
      ? data!.districtwise
      : Array.isArray((data as any)?.district_install)
      ? (data as any).district_install
      : [];
    return list.map((d: any) => ({
      district: String(d?.district ?? ''),
      ...toSummary(d),
      complete: n(d?.complete ?? d?.inst_complete),
    }));
  }, [data]);

  const monthly: Array<{ month_year: string; monthly_installations: number }> = useMemo(() => {
    const list = (data as any)?.district_installation_month || (data as any)?.monthly_installations;
    if (Array.isArray(list)) {
      return list.map((m: any) => ({
        month_year: String(m?.month_year || m?.month || ''),
        monthly_installations: n(m?.monthly_installations ?? m?.count),
      }));
    }
    return [];
  }, [data]);

  const filtersActive = selectedDistrict !== 'All';

  const s: JammuRescoSummary = useMemo(() => {
    if (!filtersActive) return rawSummary;
    const d = districtwise.find((x) => x.district.toLowerCase() === selectedDistrict.toLowerCase());
    return d ? toSummary(d) : rawSummary;
  }, [rawSummary, districtwise, selectedDistrict, filtersActive]);

  const filteredDistrictRows = useMemo(
    () => (filtersActive ? districtwise.filter((d) => d.district.toLowerCase() === selectedDistrict.toLowerCase()) : districtwise),
    [districtwise, selectedDistrict, filtersActive]
  );

  const districtTotals = useMemo(() => {
    const keys = Object.keys(toSummary({})) as Array<keyof JammuRescoSummary>;
    const acc = toSummary({});
    filteredDistrictRows.forEach((d) => {
      keys.forEach((k) => {
        acc[k] += n(d[k]);
      });
    });
    return acc;
  }, [filteredDistrictRows]);

  const deferredQuery = useDeferredValue(qDistrict);
  const tableDistricts = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return filteredDistrictRows.filter((d) => !q || d.district.toLowerCase().includes(q));
  }, [filteredDistrictRows, deferredQuery]);

  const pD = usePagination({ data: tableDistricts, initialPageSize: 100 });

  useEffect(() => {
    pD.setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qDistrict, selectedDistrict]);

  /* ───────── Derived ───────── */
  const dash = (v: number) => (loading && !data ? '…' : num(v));
  const instPct = pctOf(s.complete, s.site_count);
  const approvedPct = pctOf(s.verify_approved, s.site_count);
  const matPct = pctOf(s.material_dispatch, s.site_count);
  const monthTotal = monthly.reduce((a, m) => a + n(m.monthly_installations), 0);
  const todayLabel = fmtDate(new Date());

  // Status drill-down navigation (consistent pattern across dashboards)
  const goStatus = (st: string, dist?: string) => {
    const norm = normalizeRescoStatus(st);
    const d = dist || (filtersActive ? selectedDistrict : '');
    const distParam = d && d.toLowerCase() !== 'all' ? `?district=${encodeURIComponent(d)}` : '';
    navigate(`/v/jk/resco-installation-view-data/${encodeURIComponent(norm)}${distParam}`);
  };

  const spk = (pickFn: (d: DistrictRow) => number) => {
    const arr = districtwise.slice(0, 10).map(pickFn);
    return arr.length > 1 ? arr : undefined;
  };

  const chartDistricts = useMemo(
    () => [...filteredDistrictRows].sort((a, b) => n(b.site_count) - n(a.site_count)).slice(0, 15),
    [filteredDistrictRows]
  );
  const districtChartH = Math.min(560, Math.max(isMobile ? 280 : 320, chartDistricts.length * (isMobile ? 38 : 44)));

  /* ───────── Export ───────── */
  const [hiddenDistrictColumns, setHiddenDistrictColumns] = useState<string[]>([]);

  const districtCols: ExportColumn<DistrictRow>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r: DistrictRow, idx?: number) => (idx !== undefined ? idx + 1 : '') } as any,
      { header: 'District', accessor: (r) => r.district || '' },
      { header: 'Total allocation', accessor: (r) => n(r.site_count) },
      { header: 'Total Installed', accessor: (r) => n(r.complete) },
      { header: 'Pending Installation', accessor: (r) => n(r.pending) },
      { header: 'Verify Approved', accessor: (r) => n(r.verify_approved) },
      { header: 'Verify Pending', accessor: (r) => n(r.verify_pending) },
      { header: 'Verify Reject', accessor: (r) => n(r.verify_reject) },
      { header: 'Document Approved', accessor: (r) => n(r.doc_approved) },
      { header: 'Document Pending', accessor: (r) => n(r.doc_pending) },
      { header: 'Document Reject', accessor: (r) => n(r.doc_reject) },
      { header: 'Claim 1 Applicable', accessor: (r) => n(r.inst_claim1_applicable) },
      { header: 'Claim 1 Submitted', accessor: (r) => n(r.inst_claim1_raised) },
      { header: 'Claim 1 Approved', accessor: (r) => n(r.inst_claim1_approved) },
      { header: 'Claim 1 Pending', accessor: (r) => n(r.inst_claim1_pending) },
      { header: 'Claim 1 Reject', accessor: (r) => n(r.inst_claim1_reject) },
      { header: 'Claim 2 Applicable', accessor: (r) => n(r.inst_claim2_applicable) },
      { header: 'Claim 2 Submitted', accessor: (r) => n(r.inst_claim2_raised) },
      { header: 'Claim 2 Approved', accessor: (r) => n(r.inst_claim2_approved) },
      { header: 'Claim 2 Pending', accessor: (r) => n(r.inst_claim2_pending) },
      { header: 'Claim 2 Reject', accessor: (r) => n(r.inst_claim2_reject) },
      { header: 'Claim 3 Applicable', accessor: (r) => n(r.inst_claim3_applicable) },
      { header: 'Claim 3 Submitted', accessor: (r) => n(r.inst_claim3_raised) },
      { header: 'Claim 3 Approved', accessor: (r) => n(r.inst_claim3_approved) },
      { header: 'Claim 3 Pending', accessor: (r) => n(r.inst_claim3_pending) },
      { header: 'Claim 3 Reject', accessor: (r) => n(r.inst_claim3_reject) },
      { header: 'Pay1 Complete', accessor: (r) => n(r.inst_pay1_complete) },
      { header: 'Pay1 Partially', accessor: (r) => n(r.inst_pay1_partially) },
      { header: 'Pay1 Pending', accessor: (r) => n(r.inst_pay1_pending) },
      { header: 'Pay2 Complete', accessor: (r) => n(r.inst_pay2_complete) },
      { header: 'Pay2 Partially', accessor: (r) => n(r.inst_pay2_partially) },
      { header: 'Pay2 Pending', accessor: (r) => n(r.inst_pay2_pending) },
      { header: 'Pay3 Complete', accessor: (r) => n(r.inst_pay3_complete) },
      { header: 'Pay3 Partially', accessor: (r) => n(r.inst_pay3_partially) },
      { header: 'Pay3 Pending', accessor: (r) => n(r.inst_pay3_pending) },
    ],
    []
  );

  const getExportValue = <T,>(row: T, column: ExportColumn<T>) => {
    if (typeof column.accessor === 'function') return column.accessor(row);
    return (row as unknown as Record<string, unknown>)[column.accessor as string];
  };
  const escapeExportValue = (value: unknown) => (value === null || value === undefined ? '' : String(value));

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

  const exportToCSV = <T,>(dataToExport: T[], columns: ExportColumn<T>[], filename: string) => {
    if (!dataToExport.length || !columns.length) return;
    const rows = [
      columns.map((c) => c.header),
      ...dataToExport.map((row) => columns.map((c) => escapeExportValue(getExportValue(row, c)))),
    ];
    const csv = rows.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(',')).join('\r\n');
    downloadTextFile(`\ufeff${csv}`, `${filename}.csv`, 'text/csv');
  };

  const copyToClipboard = async <T,>(dataToCopy: T[], columns: ExportColumn<T>[]) => {
    if (!dataToCopy.length || !columns.length) return;
    const text = [
      columns.map((c) => c.header).join('\t'),
      ...dataToCopy.map((row) => columns.map((c) => escapeExportValue(getExportValue(row, c))).join('\t')),
    ].join('\n');
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
  };

  const exportToExcel = <T,>(dataToExport: T[], columns: ExportColumn<T>[], filename: string) => {
    if (!dataToExport.length || !columns.length) return;
    const tableHtml = `<table border="1"><thead><tr>${columns.map((c) => `<th>${escapeHtml(escapeExportValue(c.header))}</th>`).join('')}</tr></thead><tbody>${dataToExport.map((row) => `<tr>${columns.map((c) => `<td>${escapeHtml(escapeExportValue(getExportValue(row, c)))}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8" /></head><body>${tableHtml}</body></html>`;
    downloadTextFile(`\ufeff${html}`, `${filename}.xls`, 'application/vnd.ms-excel');
  };

  const exportToPDF = <T,>(dataToExport: T[], columns: ExportColumn<T>[], title: string) => {
    if (!dataToExport.length || !columns.length) return;
    const rows = dataToExport.map((row) => columns.map((c) => escapeHtml(escapeExportValue(getExportValue(row, c)))));
    const w = window.open('', '_blank', 'width=1200,height=800');
    if (!w) return;
    w.document.write(`<!doctype html><html><head><meta charset="UTF-8" /><title>${escapeHtml(title)}</title><style>
      *{box-sizing:border-box}body{font-family:Arial,sans-serif;padding:24px;color:#222}h1{font-size:20px;margin:0 0 16px}
      table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #d8dee6;padding:7px 8px;text-align:left;vertical-align:top}
      th{background:#f3f5f7;font-weight:700}@media print{body{padding:0}@page{size:landscape;margin:12mm}}
    </style></head><body><h1>${escapeHtml(title)}</h1><table><thead><tr>${columns.map((c) => `<th>${escapeHtml(escapeExportValue(c.header))}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((v) => `<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table><script>window.onload=function(){window.print();};</script></body></html>`);
    w.document.close();
    w.focus();
  };

  const makeToolbarColumns = <T,>(columns: ExportColumn<T>, hidden: string[]) =>
    (columns as any).map((c: any, i: number) => ({ key: `${c.header}-${i}`, label: c.header, visible: !hidden.includes(`${c.header}-${i}`) }));
  const visibleColumns = <T,>(columns: ExportColumn<T>[], hidden: string[]) =>
    columns.filter((c, i) => !hidden.includes(`${c.header}-${i}`));

  const districtToolbarColumns = makeToolbarColumns(districtCols as any, hiddenDistrictColumns);
  const toggleIn = (setter: React.Dispatch<React.SetStateAction<string[]>>) => (key: string) =>
    setter((prev) => (prev.includes(key) ? prev.filter((i) => i !== key) : [...prev, key]));

  /* ───────── Chart data (clickable) ───────── */
  const donutItems = [
    { label: 'Approved', sub: `${approvedPct}% of total`, v: s.verify_approved, color: LIGHT_GREEN, key: 'verify_approved' },
    { label: 'Verify Pending', sub: 'Awaiting verification', v: s.verify_pending, color: LIGHT_BLUE, key: 'verify_pending' },
    { label: 'Rejected', sub: 'Correction needed', v: s.verify_reject, color: LIGHT_RED, key: 'verify_reject' },
    { label: 'Install Pending', sub: 'In progress', v: s.pending, color: LIGHT_AMBER, key: 'pending' },
  ];

  const milestones = [
    { label: '1. Allocated Sites', v: s.site_count, of: s.site_count, color: 'var(--ax-viz-cyan)', key: 'total' },
    { label: '2. Material Dispatched', v: s.material_dispatch, of: s.site_count, color: 'var(--ax-viz-amber)', key: 'material_dispatch' },
    { label: '3. Installation Complete', v: s.complete, of: s.site_count, color: 'var(--ax-accent)', key: 'complete' },
    { label: '4. Installation Approved', v: s.verify_approved, of: s.site_count, color: 'var(--ax-viz-emerald)', key: 'verify_approved' },
    { label: '5. Claim Raised', v: s.claim_raised, of: s.claim_applicable, color: 'var(--ax-viz-pink)', key: 'claim_raised' },
    { label: '6. 80% Payment Disbursed', v: s.inst_pay80_done, of: s.complete, color: 'var(--ax-viz-emerald)', key: 'inst_pay80_done' },
    { label: '7. 20% Final Payment Disbursed', v: s.inst_pay20_done, of: s.complete, color: 'var(--ax-viz-violet)', key: 'inst_pay20_done' },
  ];

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      {/* 1. Page Header */}
      <PageHead
        title="Jammu Resco Installation Dashboard"
        subtitle={
          <span style={{ display: 'inline-block', fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>
            Jammu &amp; Kashmir Operations · Resco installation tracking — last updated {updatedAt ? `${fmtDate(updatedAt)} ${fmtTime(updatedAt)}` : '—'}
          </span>
        }
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Jammu' },
          { label: 'Installation' },
          { label: 'Resco' },
          { label: 'Dashboard' },
        ]}
        actions={
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill" style={{ fontWeight: 600, paddingInline: 'var(--ax-space-3)' }}>
              <span className="ax-badge__dot" /> State: Jammu &amp; Kashmir
            </span>
            <button
              type="button"
              className="ax-btn ax-btn--ghost ax-btn--icon"
              aria-label="Refresh dashboard"
              onClick={() => loadDashboardData(true)}
              disabled={loading || isRefreshing}
            >
              <span className={isRefreshing ? 'ax-spinner' : ''}>{ICON_REFRESH}</span>
            </button>
            <Link to="/v/jammu/installation/resco/status-view?status=total" className="ax-btn ax-btn--secondary ax-btn--sm">
              Status Register
            </Link>
          </div>
        }
      />

      <div className="ax-dash-grid mt-0 pt-0">
        {apiError && (
          <div
            className="ax-col--12"
            style={{
              padding: '10px 14px',
              background: 'color-mix(in oklab, var(--ax-viz-red) 12%, transparent)',
              color: 'var(--ax-viz-red)',
              borderRadius: 'var(--ax-radius-md)',
              fontSize: 'var(--ax-text-sm)',
            }}
          >
            <b>Error:</b> {apiError}{' '}
            <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" onClick={() => loadDashboardData(true)}>
              Retry
            </button>
          </div>
        )}

        {/* 2. Filter Bar */}
        <section
          className="ax-card ax-card--flat ax-col--12"
          role="region"
          aria-label="Jammu RESCO Dashboard Filters"
          style={{ padding: '8px 16px', borderRadius: 'var(--ax-radius-lg, 12px)', border: '1px solid var(--ax-border-subtle, #f1f5f9)', background: 'var(--ax-bg-surface, #ffffff)' }}
        >
          <div className="ax-cluster" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--ax-space-3)', alignItems: 'center' }}>
            <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
              <span
                className="ax-cluster"
                style={{
                  gap: '6px', color: 'var(--ax-text-strong)', fontSize: 'var(--ax-text-xs)', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.04em', padding: '4px 10px',
                  background: 'rgba(37, 99, 235, 0.08)', borderRadius: 'var(--ax-radius-pill, 9999px)',
                  border: '1px solid rgba(37, 99, 235, 0.2)',
                }}
              >
                {ICON_FILTER} Filter Operations
              </span>

              <div className="ax-cluster ula-filter-item" style={{ alignItems: 'center' }}>
                <label htmlFor="resco-district-select" style={labelStyle}>District:</label>
                <select
                  id="resco-district-select"
                  className="ax-input ax-input--sm"
                  style={selectStyle}
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                >
                  <option value="All">All Districts ({districtwise.length})</option>
                  {districtwise.map((d) => (
                    <option key={d.district} value={d.district}>{d.district}</option>
                  ))}
                </select>
              </div>

              {filtersActive && (
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--sm"
                  style={{ height: 28, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }}
                  onClick={() => setSelectedDistrict('All')}
                >
                  Reset Filters
                </button>
              )}
            </div>

            <div className="ax-cluster ula-filter-scope" style={{ gap: 'var(--ax-space-2)', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>
                Showing <b style={{ color: 'var(--ax-text-strong)' }}>{dash(s.site_count)}</b> installations · Live: <b style={{ color: 'var(--ax-text-strong)' }}>{todayLabel}</b>
              </span>
            </div>
          </div>
        </section>

        {/* 3. Welcome Banner (clickable stats) */}
        <section className="ax-card ax-welcome ax-col--12" role="region" aria-label="Jammu RESCO Installation Overview">
          <div className="ax-welcome__body">
            <div className="ax-welcome__text">
              <p className="ax-welcome__eyebrow">RESCO Installation Management System · State Hub</p>
              <h2 className="ax-card__title">Welcome to Jammu Resco Installation Dashboard</h2>
              <p className="ax-welcome__lede">
                Jammu &amp; Kashmir state installation overview: <b>{dash(s.site_count)} sites</b> tracked across <b>{dash(filtersActive ? 1 : districtwise.length)} districts</b>.
                <b> {dash(s.complete)} ({instPct}%)</b> installations completed, with <b>{dash(s.verify_approved)} ({approvedPct}%)</b> verified and approved.
              </p>
            </div>

            <dl className="ax-welcome__stats">
              <div className="ax-welcome__stat asw-interactive-kpi" role="button" tabIndex={0} onClick={() => goStatus('total')} onKeyDown={onActivate(() => goStatus('total'))} title="Click to view all sites">
                <dt>Total Sites</dt>
                <dd className="ax-num">{dash(s.site_count)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-emerald)' }}>{dash(districtwise.length)} Districts ↗</small>
              </div>
              <div className="ax-welcome__stat asw-interactive-kpi" role="button" tabIndex={0} onClick={() => goStatus('complete')} onKeyDown={onActivate(() => goStatus('complete'))} title="Click to view installed sites">
                <dt>Installation Done</dt>
                <dd className="ax-num">{dash(s.complete)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-accent)' }}>{instPct}% Done ↗</small>
              </div>
              <div className="ax-welcome__stat asw-interactive-kpi" role="button" tabIndex={0} onClick={() => goStatus('verify-approved')} onKeyDown={onActivate(() => goStatus('verify-approved'))} title="Click to view approved sites">
                <dt>Verify Approved</dt>
                <dd className="ax-num">{dash(s.verify_approved)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-emerald)' }}>{approvedPct}% Approved ↗</small>
              </div>
              <div className="ax-welcome__stat asw-interactive-kpi" role="button" tabIndex={0} onClick={() => goStatus('doc-approved')} onKeyDown={onActivate(() => goStatus('doc-approved'))} title="Click to view doc approved sites">
                <dt>Document Approved</dt>
                <dd className="ax-num">{dash(s.doc_approved)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-emerald)' }}>{dash(s.doc_approved)} Sites ↗</small>
              </div>
            </dl>
          </div>
        </section>

        {/* 4. 11 KPI Cards — click card or any individual status link */}
        {/* 1. Total Sites */}
        <KpiCard
          icon={I_PIN}
          tone="accent"
          label="Total"
          value={dash(s.site_count)}
          unit="Sites"
          sub="Total Sites"
          spark={spk((d) => n(d.site_count))}
          onClick={() => goStatus('total')}
        />

        {/* 2. Installation Status */}
        <KpiCard
          icon={I_DONE}
          tone="emerald"
          label="Installation Status"
          sub="Complete / Pending"
          badge={`${instPct}%`}
          spark={spk((d) => n(d.complete))}
          onClick={() => goStatus('complete')}
          pills={[
            { label: 'Complete', count: dash(s.complete), onClick: () => goStatus('complete') },
            { label: 'Pending', count: dash(s.pending), onClick: () => goStatus('pending') },
          ]}
        />

        {/* 3. Verification Status */}
        <KpiCard
          icon={I_SHIELD}
          tone="cyan"
          label="Verification Status"
          sub="Approved / Pending / Rejected"
          badge={s.verify_approved > 0 ? `${approvedPct}%` : undefined}
          spark={spk((d) => n(d.verify_approved))}
          onClick={() => goStatus('verify-approved')}
          pills={[
            { label: 'Approved', count: dash(s.verify_approved), onClick: () => goStatus('verify-approved') },
            { label: 'Pending', count: dash(s.verify_pending), onClick: () => goStatus('verify-pending') },
            { label: 'Rejected', count: dash(s.verify_reject), onClick: () => goStatus('verify-reject') },
          ]}
        />

        {/* 4. Document Status */}
        <KpiCard
          icon={I_EYE}
          tone="amber"
          label="Document Status"
          sub="Approved / Pending / Rejected"
          spark={spk((d) => n(d.doc_approved))}
          onClick={() => goStatus('doc-approved')}
          pills={[
            { label: 'Approved', count: dash(s.doc_approved), onClick: () => goStatus('doc-approved') },
            { label: 'Pending', count: dash(s.doc_pending), onClick: () => goStatus('doc-pending') },
            { label: 'Rejected', count: dash(s.doc_reject), onClick: () => goStatus('doc-reject') },
          ]}
        />

        {/* 5. Claim Applicable Status */}
        <KpiCard
          icon={I_LIST}
          tone="violet"
          label="Claim Applicable Status"
          sub="Claim1 / Claim2 / Claim3"
          spark={spk((d) => n(d.inst_claim1_applicable))}
          onClick={() => goStatus('inst-claim1-applicable')}
          pills={[
            { label: 'Claim1', count: dash(s.inst_claim1_applicable), onClick: () => goStatus('inst-claim1-applicable') },
            { label: 'Claim2', count: dash(s.inst_claim2_applicable), onClick: () => goStatus('inst-claim2-applicable') },
            { label: 'Claim3', count: dash(s.inst_claim3_applicable), onClick: () => goStatus('inst-claim3-applicable') },
          ]}
        />

        {/* 6. Claim 1st */}
        <KpiCard
          icon={I_COIN}
          tone="pink"
          label="Claim 1st"
          sub="Submitted / Approved / Pending / Reject"
          spark={spk((d) => n(d.inst_claim1_raised))}
          onClick={() => goStatus('inst-claim1-raised')}
          pills={[
            { label: 'Submitted', count: dash(s.inst_claim1_raised), onClick: () => goStatus('inst-claim1-raised') },
            { label: 'Approved', count: dash(s.inst_claim1_approved), onClick: () => goStatus('inst-claim1-approved') },
            { label: 'Pending', count: dash(s.inst_claim1_pending), onClick: () => goStatus('inst-claim1-pending') },
            { label: 'Reject', count: dash(s.inst_claim1_reject), onClick: () => goStatus('inst-claim1-reject') },
          ]}
        />

        {/* 7. Claim 2nd */}
        <KpiCard
          icon={I_COIN}
          tone="pink"
          label="Claim 2nd"
          sub="Submitted / Approved / Pending / Reject"
          spark={spk((d) => n(d.inst_claim2_raised))}
          onClick={() => goStatus('inst-claim2-raised')}
          pills={[
            { label: 'Submitted', count: dash(s.inst_claim2_raised), onClick: () => goStatus('inst-claim2-raised') },
            { label: 'Approved', count: dash(s.inst_claim2_approved), onClick: () => goStatus('inst-claim2-approved') },
            { label: 'Pending', count: dash(s.inst_claim2_pending), onClick: () => goStatus('inst-claim2-pending') },
            { label: 'Reject', count: dash(s.inst_claim2_reject), onClick: () => goStatus('inst-claim2-reject') },
          ]}
        />

        {/* 8. Claim 3rd */}
        <KpiCard
          icon={I_COIN}
          tone="pink"
          label="Claim 3rd"
          sub="Submitted / Approved / Pending / Reject"
          spark={spk((d) => n(d.inst_claim3_raised))}
          onClick={() => goStatus('inst-claim3-raised')}
          pills={[
            { label: 'Submitted', count: dash(s.inst_claim3_raised), onClick: () => goStatus('inst-claim3-raised') },
            { label: 'Approved', count: dash(s.inst_claim3_approved), onClick: () => goStatus('inst-claim3-approved') },
            { label: 'Pending', count: dash(s.inst_claim3_pending), onClick: () => goStatus('inst-claim3-pending') },
            { label: 'Reject', count: dash(s.inst_claim3_reject), onClick: () => goStatus('inst-claim3-reject') },
          ]}
        />

        {/* 9. Payment 1st */}
        <KpiCard
          icon={I_COIN}
          tone="emerald"
          label="Payment 1st"
          sub="Complete / Partially / Pending"
          spark={spk((d) => n(d.inst_pay1_complete))}
          onClick={() => goStatus('inst-pay1-complete')}
          pills={[
            { label: 'Complete', count: dash(s.inst_pay1_complete), onClick: () => goStatus('inst-pay1-complete') },
            { label: 'Partially', count: dash(s.inst_pay1_partially), onClick: () => goStatus('inst-pay1-partially') },
            { label: 'Pending', count: dash(s.inst_pay1_pending), onClick: () => goStatus('inst-pay1-pending') },
          ]}
        />

        {/* 10. Payment 2nd */}
        <KpiCard
          icon={I_COIN}
          tone="emerald"
          label="Payment 2nd"
          sub="Complete / Partially / Pending"
          spark={spk((d) => n(d.inst_pay2_complete))}
          onClick={() => goStatus('inst-pay2-complete')}
          pills={[
            { label: 'Complete', count: dash(s.inst_pay2_complete), onClick: () => goStatus('inst-pay2-complete') },
            { label: 'Partially', count: dash(s.inst_pay2_partially), onClick: () => goStatus('inst-pay2-partially') },
            { label: 'Pending', count: dash(s.inst_pay2_pending), onClick: () => goStatus('inst-pay2-pending') },
          ]}
        />

        {/* 11. Payment 3rd */}
        <KpiCard
          icon={I_COIN}
          tone="emerald"
          label="Payment 3rd"
          sub="Complete / Partially / Pending"
          spark={spk((d) => n(d.inst_pay3_complete))}
          onClick={() => goStatus('inst-pay3-complete')}
          pills={[
            { label: 'Complete', count: dash(s.inst_pay3_complete), onClick: () => goStatus('inst-pay3-complete') },
            { label: 'Partially', count: dash(s.inst_pay3_partially), onClick: () => goStatus('inst-pay3-partially') },
            { label: 'Pending', count: dash(s.inst_pay3_pending), onClick: () => goStatus('inst-pay3-pending') },
          ]}
        />

        {/* 5. Monthly Trend (8) + Donut (4) */}
        <section className="ax-card ax-card--chart ax-col--8" role="region" aria-label="Monthly installation trend">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Execution Throughput</span>
              <h2 className="ax-card__title">Monthly Installation Trend</h2>
              <p className="ax-card__subtitle">{num(monthTotal)} installations across {monthly.length} month{monthly.length === 1 ? '' : 's'}</p>
            </div>
            <div className="ax-card__actions">
              <span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--pill">{monthly.length} Months Tracked</span>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0, minHeight: chartH }}>
            {monthly.length > 0 ? (
              <Suspense fallback={<div className="ax-skeleton" style={{ height: chartH }} />}>
                <ApexChart
                  key={`month-${chartH}-${monthly.map((m) => `${m.month_year}${m.monthly_installations}`).join('-')}`}
                  type="area"
                  height={chartH}
                  legend="none"
                  ariaLabel="Monthly installations"
                  series={[{ name: 'Installations', data: monthly.map((m) => n(m.monthly_installations)) }]}
                  apex={{
                    colors: [LIGHT_GREEN],
                    stroke: { curve: 'smooth', width: 2 },
                    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.05, stops: [0, 90, 100] } },
                    markers: { size: 4, strokeWidth: 0, hover: { size: 6 } },
                    dataLabels: { enabled: false },
                    xaxis: { categories: monthly.map((m) => fmtMonth(m.month_year)) },
                    yaxis: { min: 0, forceNiceScale: true, labels: { formatter: (v: number) => `${Math.round(v)}` }, title: { text: 'Sites', style: { color: 'var(--ax-text-muted)' } } },
                    tooltip: { y: { formatter: (v: number) => `${v} Sites` } },
                  }}
                />
              </Suspense>
            ) : (
              <div style={{ height: chartH, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ax-text-muted)' }}>
                No monthly data recorded yet
              </div>
            )}
          </div>
        </section>

        {/* Verification Status Donut (4) */}
        <section className="ax-card ax-card--chart ax-col--4" role="region" aria-label="Verification distribution">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Audit &amp; Inspection</span>
              <h2 className="ax-card__title">Verification Status</h2>
              <p className="ax-card__subtitle">{num(s.site_count)} total portfolio sites</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0, minHeight: donutH, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Suspense fallback={<div className="ax-skeleton" style={{ height: donutH }} />}>
              <ApexChart
                key={`donut-${donutH}-${s.verify_approved}-${s.verify_pending}-${s.verify_reject}-${s.pending}`}
                type="donut"
                height={donutH}
                legend="none"
                ariaLabel="Verification status breakdown"
                series={[s.verify_approved, s.verify_pending, s.verify_reject, s.pending]}
                apex={{
                  colors: [LIGHT_GREEN, LIGHT_BLUE, LIGHT_RED, LIGHT_AMBER],
                  labels: ['Approved', 'Verify Pending', 'Rejected', 'Install Pending'],
                  dataLabels: { enabled: false },
                  stroke: { width: 2, colors: ['var(--ax-bg-surface, #ffffff)'] },
                  plotOptions: {
                    pie: {
                      donut: {
                        size: '72%',
                        labels: {
                          show: true,
                          total: {
                            show: true,
                            label: 'Approved',
                            formatter: () => `${approvedPct}%`,
                            color: 'var(--ax-text-strong)',
                          },
                        },
                      },
                    },
                  },
                  tooltip: { y: { formatter: (v: number) => `${v} Sites` } },
                }}
              />
            </Suspense>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px 12px', marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--ax-border-subtle, #f1f5f9)' }}>
              {donutItems.map((item) => (
                <div
                  key={item.label}
                  className="asw-interactive-kpi"
                  role="button"
                  tabIndex={0}
                  onClick={() => goStatus(item.key)}
                  onKeyDown={onActivate(() => goStatus(item.key))}
                  title={`View ${item.label} sites`}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 6px', borderRadius: 6 }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                  <div style={{ minWidth: 0, overflow: 'hidden' }}>
                    <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{item.label}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ax-text-strong)' }}>{num(item.v)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6. Status Register: Milestones + Performance (12) */}
        <section className="ax-card ax-col--12" role="region" aria-label="District Performance and Milestones">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">District Milestones &amp; Execution</span>
              <h2 className="ax-card__title">Status Register &amp; Performance Funnel</h2>
              <p className="ax-card__subtitle">Field progress comparison across {districtwise.length} administrative districts</p>
            </div>
            <div className="ax-card__actions">
              <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill">All Targets Active</span>
            </div>
          </div>
          <div className="ax-card__body">
            <div className="ax-dash-grid mt-0 pt-0">
              {/* Funnel Progress (5 cols) */}
              <div className="ax-col--5" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--ax-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Execution Lifecycle Funnel
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {milestones.map((m) => {
                    const pct = pctOf(m.v, m.of || 1);
                    return (
                      <div
                        key={m.label}
                        className="asw-interactive-kpi"
                        role="button"
                        tabIndex={0}
                        onClick={() => goStatus(m.key)}
                        onKeyDown={onActivate(() => goStatus(m.key))}
                        style={{ padding: '6px 8px', borderRadius: 8, border: '1px solid var(--ax-border-subtle, #f1f5f9)', background: 'var(--ax-surface-subtle, #f8fafc)' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ax-text-strong)' }}>{m.label}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: m.color }}>{num(m.v)} <small style={{ fontWeight: 500, color: 'var(--ax-text-muted)' }}>({pct}%)</small></span>
                        </div>
                        <div className="ax-progress ax-progress--sm" style={{ width: '100%' }}>
                          <div className="ax-progress__track">
                            <div className="ax-progress__fill" style={{ width: `${Math.min(100, pct)}%`, background: m.color }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* District Horizontal Bar Chart (7 cols) */}
              <div className="ax-col--7">
                <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: 'var(--ax-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Top Districts by Capacity Allocation
                </h4>
                {chartDistricts.length > 0 ? (
                  <Suspense fallback={<div className="ax-skeleton" style={{ height: districtChartH }} />}>
                    <ApexChart
                      key={`dist-bar-${districtChartH}-${chartDistricts.map((d) => d.district).join('-')}`}
                      type="bar"
                      height={districtChartH}
                      legend="none"
                      ariaLabel="District installations comparison"
                      series={[
                        { name: 'Total Sites', data: chartDistricts.map((d) => n(d.site_count)) },
                        { name: 'Installed', data: chartDistricts.map((d) => n(d.complete)) },
                      ]}
                      apex={{
                        colors: ['var(--ax-accent)', LIGHT_GREEN],
                        plotOptions: { bar: { horizontal: true, barHeight: '55%', borderRadius: 3 } },
                        dataLabels: { enabled: false },
                        xaxis: { categories: chartDistricts.map((d) => d.district) },
                        yaxis: { labels: { style: { fontSize: '11px', fontWeight: 600 } } },
                        tooltip: { y: { formatter: (v: number) => `${v} Sites` } },
                      }}
                    />
                  </Suspense>
                ) : (
                  <div style={{ height: districtChartH, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ax-text-muted)' }}>
                    No district breakdown records
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 7. District-wise Installation Breakdown Table */}
        <section className="ax-card ax-col--12" role="region" aria-labelledby="district-table-title">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow" style={{ color: 'var(--asw-primary)' }}>DISTRICT DIRECTORY</span>
              <h2 id="district-table-title" className="ax-card__title">District-wise Installation Breakdown</h2>
              <p className="ax-card__subtitle ax-num" style={{ fontFamily: 'var(--ax-font-mono)' }}>
                {tableDistricts.length} of {districtwise.length} administrative districts
              </p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                <SearchInput
                  value={qDistrict}
                  onChange={setQDistrict}
                  placeholder="Filter district name…"
                  size="sm"
                  ariaLabel="Search district"
                />
                <TableExportToolbar
                  columns={districtToolbarColumns}
                  onToggleColumn={toggleIn(setHiddenDistrictColumns)}
                  onExportCSV={() => exportToCSV(tableDistricts, visibleColumns(districtCols, hiddenDistrictColumns), `Jammu_RESCO_Districtwise_${stamp}`)}
                  onExportExcel={() => exportToExcel(tableDistricts, visibleColumns(districtCols, hiddenDistrictColumns), `Jammu_RESCO_Districtwise_${stamp}`)}
                  onExportPDF={() => exportToPDF(tableDistricts, visibleColumns(districtCols, hiddenDistrictColumns), 'Jammu RESCO Installation - District-wise Summary')}
                  onCopy={() => copyToClipboard(tableDistricts, visibleColumns(districtCols, hiddenDistrictColumns))}
                />
              </div>
            </div>
          </div>

          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap', minWidth: 3200 }}>
              <caption className="ax-visually-hidden">District-wise Installation Breakdown</caption>
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col" style={{ width: 60 }}>Sr. No.</th>
                  <th className="ax-table__th" scope="col" style={{ minWidth: 160 }}>District</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'right' }}>Total allocation</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'right' }}>Total Installed</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'right' }}>Pending Installation</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'right' }}>Verify Approved</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'right' }}>Verify Pending</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'right' }}>Verify Reject</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'right' }}>Document Approved</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'right' }}>Document Pending</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'right' }}>Document Reject</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'right' }}>Claim 1 Applicable</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'right' }}>Claim 1 Submitted</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'right' }}>Claim 1 Approved</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'right' }}>Claim 1 Pending</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'right' }}>Claim 1 Reject</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'right' }}>Claim 2 Applicable</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'right' }}>Claim 2 Submitted</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'right' }}>Claim 2 Approved</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'right' }}>Claim 2 Pending</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'right' }}>Claim 2 Reject</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'right' }}>Claim 3 Applicable</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'right' }}>Claim 3 Submitted</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'right' }}>Claim 3 Approved</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'right' }}>Claim 3 Pending</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'right' }}>Claim 3 Reject</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'right' }}>Pay1 Complete</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'right' }}>Pay1 Partially</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'right' }}>Pay1 Pending</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'right' }}>Pay2 Complete</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'right' }}>Pay2 Partially</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'right' }}>Pay2 Pending</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'right' }}>Pay3 Complete</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'right' }}>Pay3 Partially</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'right' }}>Pay3 Pending</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading && !data ? (
                  <tr>
                    <td className="ax-table__td" colSpan={36} style={emptyCellStyle}>
                      <span className="ax-spinner" /> Loading district installation metrics…
                    </td>
                  </tr>
                ) : pD.paginatedData.length === 0 ? (
                  <tr>
                    <td className="ax-table__td" colSpan={36} style={emptyCellStyle}>
                      <TableEmptyState title="No district records" message="Try clearing your search query" />
                    </td>
                  </tr>
                ) : (
                  pD.paginatedData.map((row, idx) => {
                    const srNo = (pD.currentPage - 1) * pD.pageSize + idx + 1;
                    return (
                      <tr key={row.district || idx}>
                        <td className="ax-table__td ax-num">{srNo}</td>
                        <td className="ax-table__td" style={{ fontWeight: 700, color: 'var(--ax-text-strong)' }}>
                          {row.district}
                        </td>
                        <td className="ax-table__td click-cell" style={{ textAlign: 'right', fontWeight: 600 }} onClick={() => goStatus('total', row.district)} title="Click to view total sites">
                          {num(row.site_count)}
                        </td>
                        <td className="ax-table__td click-cell" style={{ textAlign: 'right', fontWeight: 600, color: 'var(--ax-viz-emerald)' }} onClick={() => goStatus('complete', row.district)} title="Click to view completed sites">
                          {num(row.complete)}
                        </td>
                        <td className="ax-table__td click-cell" style={{ textAlign: 'right', color: 'var(--ax-viz-amber)' }} onClick={() => goStatus('pending', row.district)} title="Click to view pending sites">
                          {num(row.pending)}
                        </td>
                        <td className="ax-table__td click-cell" style={{ textAlign: 'right', color: 'var(--ax-viz-emerald)', fontWeight: 600 }} onClick={() => goStatus('verify-approved', row.district)}>
                          {num(row.verify_approved)}
                        </td>
                        <td className="ax-table__td click-cell" style={{ textAlign: 'right', color: 'var(--ax-viz-amber)' }} onClick={() => goStatus('verify-pending', row.district)}>
                          {num(row.verify_pending)}
                        </td>
                        <td className="ax-table__td click-cell" style={{ textAlign: 'right', color: 'var(--ax-viz-red)' }} onClick={() => goStatus('verify-reject', row.district)}>
                          {num(row.verify_reject)}
                        </td>
                        <td className="ax-table__td click-cell" style={{ textAlign: 'right', color: 'var(--ax-viz-emerald)', fontWeight: 600 }} onClick={() => goStatus('doc-approved', row.district)}>
                          {num(row.doc_approved)}
                        </td>
                        <td className="ax-table__td click-cell" style={{ textAlign: 'right', color: 'var(--ax-viz-amber)' }} onClick={() => goStatus('doc-pending', row.district)}>
                          {num(row.doc_pending)}
                        </td>
                        <td className="ax-table__td click-cell" style={{ textAlign: 'right', color: 'var(--ax-viz-red)' }} onClick={() => goStatus('doc-reject', row.district)}>
                          {num(row.doc_reject)}
                        </td>
                        <td className="ax-table__td click-cell" style={{ textAlign: 'right' }} onClick={() => goStatus('inst-claim1-applicable', row.district)}>
                          {num(row.inst_claim1_applicable)}
                        </td>
                        <td className="ax-table__td click-cell" style={{ textAlign: 'right' }} onClick={() => goStatus('inst-claim1-raised', row.district)}>
                          {num(row.inst_claim1_raised)}
                        </td>
                        <td className="ax-table__td click-cell" style={{ textAlign: 'right', color: 'var(--ax-viz-emerald)' }} onClick={() => goStatus('inst-claim1-approved', row.district)}>
                          {num(row.inst_claim1_approved)}
                        </td>
                        <td className="ax-table__td click-cell" style={{ textAlign: 'right', color: 'var(--ax-viz-amber)' }} onClick={() => goStatus('inst-claim1-pending', row.district)}>
                          {num(row.inst_claim1_pending)}
                        </td>
                        <td className="ax-table__td click-cell" style={{ textAlign: 'right', color: 'var(--ax-viz-red)' }} onClick={() => goStatus('inst-claim1-reject', row.district)}>
                          {num(row.inst_claim1_reject)}
                        </td>
                        <td className="ax-table__td click-cell" style={{ textAlign: 'right' }} onClick={() => goStatus('inst-claim2-applicable', row.district)}>
                          {num(row.inst_claim2_applicable)}
                        </td>
                        <td className="ax-table__td click-cell" style={{ textAlign: 'right' }} onClick={() => goStatus('inst-claim2-raised', row.district)}>
                          {num(row.inst_claim2_raised)}
                        </td>
                        <td className="ax-table__td click-cell" style={{ textAlign: 'right', color: 'var(--ax-viz-emerald)' }} onClick={() => goStatus('inst-claim2-approved', row.district)}>
                          {num(row.inst_claim2_approved)}
                        </td>
                        <td className="ax-table__td click-cell" style={{ textAlign: 'right', color: 'var(--ax-viz-amber)' }} onClick={() => goStatus('inst-claim2-pending', row.district)}>
                          {num(row.inst_claim2_pending)}
                        </td>
                        <td className="ax-table__td click-cell" style={{ textAlign: 'right', color: 'var(--ax-viz-red)' }} onClick={() => goStatus('inst-claim2-reject', row.district)}>
                          {num(row.inst_claim2_reject)}
                        </td>
                        <td className="ax-table__td click-cell" style={{ textAlign: 'right' }} onClick={() => goStatus('inst-claim3-applicable', row.district)}>
                          {num(row.inst_claim3_applicable)}
                        </td>
                        <td className="ax-table__td click-cell" style={{ textAlign: 'right' }} onClick={() => goStatus('inst-claim3-raised', row.district)}>
                          {num(row.inst_claim3_raised)}
                        </td>
                        <td className="ax-table__td click-cell" style={{ textAlign: 'right', color: 'var(--ax-viz-emerald)' }} onClick={() => goStatus('inst-claim3-approved', row.district)}>
                          {num(row.inst_claim3_approved)}
                        </td>
                        <td className="ax-table__td click-cell" style={{ textAlign: 'right', color: 'var(--ax-viz-amber)' }} onClick={() => goStatus('inst-claim3-pending', row.district)}>
                          {num(row.inst_claim3_pending)}
                        </td>
                        <td className="ax-table__td click-cell" style={{ textAlign: 'right', color: 'var(--ax-viz-red)' }} onClick={() => goStatus('inst-claim3-reject', row.district)}>
                          {num(row.inst_claim3_reject)}
                        </td>
                        <td className="ax-table__td click-cell" style={{ textAlign: 'right', color: 'var(--ax-viz-emerald)' }} onClick={() => goStatus('inst-pay1-complete', row.district)}>
                          {num(row.inst_pay1_complete)}
                        </td>
                        <td className="ax-table__td click-cell" style={{ textAlign: 'right', color: 'var(--ax-viz-amber)' }} onClick={() => goStatus('inst-pay1-partially', row.district)}>
                          {num(row.inst_pay1_partially)}
                        </td>
                        <td className="ax-table__td click-cell" style={{ textAlign: 'right', color: 'var(--ax-viz-red)' }} onClick={() => goStatus('inst-pay1-pending', row.district)}>
                          {num(row.inst_pay1_pending)}
                        </td>
                        <td className="ax-table__td click-cell" style={{ textAlign: 'right', color: 'var(--ax-viz-emerald)' }} onClick={() => goStatus('inst-pay2-complete', row.district)}>
                          {num(row.inst_pay2_complete)}
                        </td>
                        <td className="ax-table__td click-cell" style={{ textAlign: 'right', color: 'var(--ax-viz-amber)' }} onClick={() => goStatus('inst-pay2-partially', row.district)}>
                          {num(row.inst_pay2_partially)}
                        </td>
                        <td className="ax-table__td click-cell" style={{ textAlign: 'right', color: 'var(--ax-viz-red)' }} onClick={() => goStatus('inst-pay2-pending', row.district)}>
                          {num(row.inst_pay2_pending)}
                        </td>
                        <td className="ax-table__td click-cell" style={{ textAlign: 'right', color: 'var(--ax-viz-emerald)' }} onClick={() => goStatus('inst-pay3-complete', row.district)}>
                          {num(row.inst_pay3_complete)}
                        </td>
                        <td className="ax-table__td click-cell" style={{ textAlign: 'right', color: 'var(--ax-viz-amber)' }} onClick={() => goStatus('inst-pay3-partially', row.district)}>
                          {num(row.inst_pay3_partially)}
                        </td>
                        <td className="ax-table__td click-cell" style={{ textAlign: 'right', color: 'var(--ax-viz-red)' }} onClick={() => goStatus('inst-pay3-pending', row.district)}>
                          {num(row.inst_pay3_pending)}
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="ax-btn ax-btn--secondary ax-btn--xs"
                            onClick={() => goStatus('total', row.district)}
                            style={{ padding: '3px 8px', fontSize: '11px', whiteSpace: 'nowrap' }}
                          >
                            View Sites
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {tableDistricts.length > 0 && (
                <tfoot className="ax-table__foot" style={{ background: 'var(--ax-surface-subtle, #f8fafc)', fontWeight: 700 }}>
                  <tr>
                    <td className="ax-table__td" colSpan={2}>Total ({tableDistricts.length} Districts)</td>
                    <td className="ax-table__td click-cell" style={{ textAlign: 'right' }} onClick={() => goStatus('total')}>
                      {num(districtTotals.site_count)}
                    </td>
                    <td className="ax-table__td click-cell" style={{ textAlign: 'right', color: 'var(--ax-viz-emerald)' }} onClick={() => goStatus('complete')}>
                      {num(districtTotals.complete)}
                    </td>
                    <td className="ax-table__td click-cell" style={{ textAlign: 'right', color: 'var(--ax-viz-amber)' }} onClick={() => goStatus('pending')}>
                      {num(districtTotals.pending)}
                    </td>
                    <td className="ax-table__td click-cell" style={{ textAlign: 'right', color: 'var(--ax-viz-emerald)' }} onClick={() => goStatus('verify-approved')}>
                      {num(districtTotals.verify_approved)}
                    </td>
                    <td className="ax-table__td click-cell" style={{ textAlign: 'right', color: 'var(--ax-viz-amber)' }} onClick={() => goStatus('verify-pending')}>
                      {num(districtTotals.verify_pending)}
                    </td>
                    <td className="ax-table__td click-cell" style={{ textAlign: 'right', color: 'var(--ax-viz-red)' }} onClick={() => goStatus('verify-reject')}>
                      {num(districtTotals.verify_reject)}
                    </td>
                    <td className="ax-table__td click-cell" style={{ textAlign: 'right', color: 'var(--ax-viz-emerald)' }} onClick={() => goStatus('doc-approved')}>
                      {num(districtTotals.doc_approved)}
                    </td>
                    <td className="ax-table__td click-cell" style={{ textAlign: 'right', color: 'var(--ax-viz-amber)' }} onClick={() => goStatus('doc-pending')}>
                      {num(districtTotals.doc_pending)}
                    </td>
                    <td className="ax-table__td click-cell" style={{ textAlign: 'right', color: 'var(--ax-viz-red)' }} onClick={() => goStatus('doc-reject')}>
                      {num(districtTotals.doc_reject)}
                    </td>
                    <td className="ax-table__td click-cell" style={{ textAlign: 'right' }} onClick={() => goStatus('inst-claim1-applicable')}>
                      {num(districtTotals.inst_claim1_applicable)}
                    </td>
                    <td className="ax-table__td click-cell" style={{ textAlign: 'right' }} onClick={() => goStatus('inst-claim1-raised')}>
                      {num(districtTotals.inst_claim1_raised)}
                    </td>
                    <td className="ax-table__td click-cell" style={{ textAlign: 'right', color: 'var(--ax-viz-emerald)' }} onClick={() => goStatus('inst-claim1-approved')}>
                      {num(districtTotals.inst_claim1_approved)}
                    </td>
                    <td className="ax-table__td click-cell" style={{ textAlign: 'right', color: 'var(--ax-viz-amber)' }} onClick={() => goStatus('inst-claim1-pending')}>
                      {num(districtTotals.inst_claim1_pending)}
                    </td>
                    <td className="ax-table__td click-cell" style={{ textAlign: 'right', color: 'var(--ax-viz-red)' }} onClick={() => goStatus('inst-claim1-reject')}>
                      {num(districtTotals.inst_claim1_reject)}
                    </td>
                    <td className="ax-table__td click-cell" style={{ textAlign: 'right' }} onClick={() => goStatus('inst-claim2-applicable')}>
                      {num(districtTotals.inst_claim2_applicable)}
                    </td>
                    <td className="ax-table__td click-cell" style={{ textAlign: 'right' }} onClick={() => goStatus('inst-claim2-raised')}>
                      {num(districtTotals.inst_claim2_raised)}
                    </td>
                    <td className="ax-table__td click-cell" style={{ textAlign: 'right', color: 'var(--ax-viz-emerald)' }} onClick={() => goStatus('inst-claim2-approved')}>
                      {num(districtTotals.inst_claim2_approved)}
                    </td>
                    <td className="ax-table__td click-cell" style={{ textAlign: 'right', color: 'var(--ax-viz-amber)' }} onClick={() => goStatus('inst-claim2-pending')}>
                      {num(districtTotals.inst_claim2_pending)}
                    </td>
                    <td className="ax-table__td click-cell" style={{ textAlign: 'right', color: 'var(--ax-viz-red)' }} onClick={() => goStatus('inst-claim2-reject')}>
                      {num(districtTotals.inst_claim2_reject)}
                    </td>
                    <td className="ax-table__td click-cell" style={{ textAlign: 'right' }} onClick={() => goStatus('inst-claim3-applicable')}>
                      {num(districtTotals.inst_claim3_applicable)}
                    </td>
                    <td className="ax-table__td click-cell" style={{ textAlign: 'right' }} onClick={() => goStatus('inst-claim3-raised')}>
                      {num(districtTotals.inst_claim3_raised)}
                    </td>
                    <td className="ax-table__td click-cell" style={{ textAlign: 'right', color: 'var(--ax-viz-emerald)' }} onClick={() => goStatus('inst-claim3-approved')}>
                      {num(districtTotals.inst_claim3_approved)}
                    </td>
                    <td className="ax-table__td click-cell" style={{ textAlign: 'right', color: 'var(--ax-viz-amber)' }} onClick={() => goStatus('inst-claim3-pending')}>
                      {num(districtTotals.inst_claim3_pending)}
                    </td>
                    <td className="ax-table__td click-cell" style={{ textAlign: 'right', color: 'var(--ax-viz-red)' }} onClick={() => goStatus('inst-claim3-reject')}>
                      {num(districtTotals.inst_claim3_reject)}
                    </td>
                    <td className="ax-table__td click-cell" style={{ textAlign: 'right', color: 'var(--ax-viz-emerald)' }} onClick={() => goStatus('inst-pay1-complete')}>
                      {num(districtTotals.inst_pay1_complete)}
                    </td>
                    <td className="ax-table__td click-cell" style={{ textAlign: 'right', color: 'var(--ax-viz-amber)' }} onClick={() => goStatus('inst-pay1-partially')}>
                      {num(districtTotals.inst_pay1_partially)}
                    </td>
                    <td className="ax-table__td click-cell" style={{ textAlign: 'right', color: 'var(--ax-viz-red)' }} onClick={() => goStatus('inst-pay1-pending')}>
                      {num(districtTotals.inst_pay1_pending)}
                    </td>
                    <td className="ax-table__td click-cell" style={{ textAlign: 'right', color: 'var(--ax-viz-emerald)' }} onClick={() => goStatus('inst-pay2-complete')}>
                      {num(districtTotals.inst_pay2_complete)}
                    </td>
                    <td className="ax-table__td click-cell" style={{ textAlign: 'right', color: 'var(--ax-viz-amber)' }} onClick={() => goStatus('inst-pay2-partially')}>
                      {num(districtTotals.inst_pay2_partially)}
                    </td>
                    <td className="ax-table__td click-cell" style={{ textAlign: 'right', color: 'var(--ax-viz-red)' }} onClick={() => goStatus('inst-pay2-pending')}>
                      {num(districtTotals.inst_pay2_pending)}
                    </td>
                    <td className="ax-table__td click-cell" style={{ textAlign: 'right', color: 'var(--ax-viz-emerald)' }} onClick={() => goStatus('inst-pay3-complete')}>
                      {num(districtTotals.inst_pay3_complete)}
                    </td>
                    <td className="ax-table__td click-cell" style={{ textAlign: 'right', color: 'var(--ax-viz-amber)' }} onClick={() => goStatus('inst-pay3-partially')}>
                      {num(districtTotals.inst_pay3_partially)}
                    </td>
                    <td className="ax-table__td click-cell" style={{ textAlign: 'right', color: 'var(--ax-viz-red)' }} onClick={() => goStatus('inst-pay3-pending')}>
                      {num(districtTotals.inst_pay3_pending)}
                    </td>
                    <td className="ax-table__td" style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        className="ax-btn ax-btn--primary ax-btn--xs"
                        onClick={() => goStatus('total')}
                        style={{ padding: '3px 8px', fontSize: '11px', whiteSpace: 'nowrap' }}
                      >
                        All Sites
                      </button>
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          <div className="ax-card__footer" style={footerStyle}>
            <div className="ula-pagination-left">
              <Pagination
                currentPage={pD.currentPage}
                pageSize={pD.pageSize}
                totalItems={tableDistricts.length}
                onPageChange={pD.setPage}
                setPage={pD.setPage}
                onPageSizeChange={pD.setPageSize}
                pageSizeOptions={[100, 200, 300]}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export { RescoDashboard as SolarErp };
export default RescoDashboard;

