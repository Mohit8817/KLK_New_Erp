import { lazy, Suspense, useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  upInstallationService,
  type UpSsl18wDashboardData,
  type UpSsl18wInstallDetailsCount,
} from '../../up-services';
import {
  Pagination,
  usePagination,
  SearchInput,
  TableExportToolbar,
  TableEmptyState,
  type ExportColumn,
} from '../../../../../common';

/* ───────── Dashboard UI blocks (ULA design) ───────── */
const ApexChart = lazy(() => import('../../../../charts/ApexChart').then((m) => ({ default: m.ApexChart })));

/* ───────── Colors ───────── */
const LIGHT_BLUE = '#4992ff';
const LIGHT_GREEN = '#86DDB2';
const LIGHT_AMBER = '#F6D68A';
const LIGHT_RED = '#ef6a6a';

/* ───────── Helpers ───────── */
const num = (x: number) => (x ?? 0).toLocaleString('en-IN');
const pctOf = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : 0);
const n = (v: unknown) => Number(v ?? 0) || 0;
const pad = (x: number) => String(x).padStart(2, '0');
const fmtDate = (d: Date | null) => (d ? `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}` : '—');
const fmtTime = (d: Date) => d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();
const cv = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const fmtMonth = (s: string) => {
  const [y, m] = String(s || '').split('-');
  const mi = Number(m);
  if (!y || !mi) return s || '';
  return `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][mi - 1]} ${y}`;
};

const onActivate = (fn: () => void) => (e: React.KeyboardEvent) => {
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

/* ───────── Layout CSS ───────── */
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

  .solar-erp-page .ax-card__header {
    display: flex; flex-wrap: nowrap; align-items: flex-start; justify-content: space-between; gap: 12px;
  }
  .solar-erp-page .ax-card__titles { flex: 0 0 auto; min-width: max-content; max-width: 55%; }
  .solar-erp-page .ax-card__title {
    max-width: none; white-space: normal; word-break: normal; overflow-wrap: normal; hyphens: none;
  }
  .solar-erp-page .ax-card__eyebrow,
  .solar-erp-page .ax-card__subtitle { word-break: normal; overflow-wrap: normal; line-height: 1.45; }

  .solar-erp-page .ax-card__actions {
    flex: 1 1 0; min-width: 0; margin-left: auto; display: flex; align-items: center; justify-content: flex-end; gap: 8px;
  }
  .solar-erp-page .ax-card__actions .ax-cluster {
    flex-wrap: wrap !important; min-width: 0; width: 100%; justify-content: flex-end;
  }
  .solar-erp-page .ax-card__actions .ax-search,
  .solar-erp-page .ax-card__actions [class*="search"] { flex: 1 1 120px; min-width: 90px; max-width: 260px; }
  .solar-erp-page .ax-card__actions input { min-width: 0; width: 100%; }
  .solar-erp-page .ax-card__actions .ax-export-toolbar,
  .solar-erp-page .ax-card__actions [class*="export"] { flex: 0 1 auto; min-width: 0; flex-wrap: nowrap; gap: 4px; }
  .solar-erp-page .ax-card__actions .ax-export-toolbar .ax-btn,
  .solar-erp-page .ax-card__actions [class*="export"] .ax-btn { padding-inline: 8px; min-width: 0; }

  .solar-erp-page .ax-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .solar-erp-page .ula-table--sm { min-width: 540px; }
  .solar-erp-page .ula-table--md { min-width: 720px; }
  .solar-erp-page .ax-welcome__lede { max-width: 780px; }

  .solar-erp-page .ula-filter-item { display: flex; align-items: center; gap: 6px; }
  .solar-erp-page .ula-filter-item select { width: 170px; }

  @media (min-width: 641px) {
    .solar-erp-page .ax-card__actions .ax-export-toolbar { width: auto; }
  }
  @media (max-width: 1100px) {
    .solar-erp-page .ax-col--8,
    .solar-erp-page .ax-col--4 { grid-column: span 12; }
    .solar-erp-page .ax-col--3 { grid-column: span 6; }
    .solar-erp-page .ax-card__actions .ax-export-toolbar .ax-btn span:not([class*="icon"]),
    .solar-erp-page .ax-card__actions [class*="export"] .ax-btn span:not([class*="icon"]) { display: none; }
    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] { max-width: 180px; }
  }
  @media (max-width: 760px) {
    .solar-erp-page { width: 100%; max-width: 100%; overflow-x: hidden; box-sizing: border-box; }
    .solar-erp-page .ax-welcome__stats { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
    .solar-erp-page .ula-filter-item { width: 100%; justify-content: space-between; }
    .solar-erp-page .ula-filter-item select { flex: 1; width: auto; max-width: 100%; }
    .solar-erp-page .ula-filter-scope { width: 100%; }
    .solar-erp-page .ax-card__header { gap: 10px; }
    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] { max-width: 130px; }
  }
  @media (max-width: 480px) {
    .solar-erp-page .ax-card__header { flex-wrap: wrap; }
    .solar-erp-page .ax-card__titles { min-width: 0; max-width: 100%; flex: 1 1 100%; }
    .solar-erp-page .ax-card__actions { flex: 1 1 100%; }
    .solar-erp-page .ax-card__actions .ax-cluster { justify-content: flex-start; }
    .solar-erp-page .ax-card__title {
      font-family: var(--ax-font-display); font-size: var(--ax-text-md); line-height: var(--ax-leading-md);
    }
    .solar-erp-page .ax-col--3 { grid-column: span 12; }
  }
`;

/* ───────── Icons ───────── */
const ICON_REFRESH = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" /><path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" /></svg>
);
const ICON_PLUS = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5l0 14" /><path d="M5 12l14 0" /></svg>
);
const ICON_FILTER = (
  <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 4h16v2.172a2 2 0 0 1 -.586 1.414l-4.828 4.828v7.586l-4 -2v-5.586l-4.828 -4.828a2 2 0 0 1 -.586 -1.414v-2.172z" /></svg>
);
const ARROW_UP = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 15l6 -6l6 6" /></svg>
);
const ICON_EYE = (
  <svg style={{ width: 13, height: 13 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="2" />
    <path d="M22 12c-2.667 4.667 -6 7 -10 7s-7.333 -2.333 -10 -7c2.667 -4.667 6 -7 10 -7s7.333 2.333 10 7" />
  </svg>
);
const svg = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const I_PIN = svg(<><path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /><path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0" /></>);
const I_BOLT = svg(<path d="M13 3l0 7l6 0l-8 11l0 -7l-6 0l8 -11" />);
const I_DONE = svg(<><path d="M7 12l5 5l10 -10" /><path d="M2 12l5 5m5 -5l5 -5" /></>);
const I_COIN = svg(<><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M14.8 9a2 2 0 0 0 -1.8 -1h-2a2 2 0 1 0 0 4h2a2 2 0 1 1 0 4h-2a2 2 0 0 1 -1.8 -1" /><path d="M12 7v10" /></>);
const I_LIST = svg(<><path d="M9 6l11 0" /><path d="M9 12l11 0" /><path d="M9 18l11 0" /><path d="M5 6l0 .01" /><path d="M5 12l0 .01" /><path d="M5 18l0 .01" /></>);

/* ───────── Shared inline styles ───────── */
const labelStyle = { fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)', fontWeight: 500 } as const;
const selectStyle = { height: 30, fontSize: 'var(--ax-text-xs)', paddingInline: '8px' } as const;
const actionsRowStyle = { gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'end', justifyContent: 'flex-end', width: '100%' } as const;
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


/* ───────── KPI card ───────── */
interface KpiProps {
  icon: ReactNode;
  tone: 'accent' | 'cyan' | 'emerald' | 'amber' | 'violet' | 'pink' | 'red';
  label: string;
  value: string;
  unit?: string;
  sub: string;
  badge?: string;
  spark?: number[];
  sparkType?: 'line' | 'bar' | 'area';
  onClick?: () => void;
}
const TONE: Record<KpiProps['tone'], { bg: string; fg: string; apex: string }> = {
  accent: { bg: 'rgba(var(--ax-accent-rgb), 0.12)', fg: 'var(--ax-accent)', apex: '--ax-accent' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan) 14%, transparent)', fg: 'var(--ax-viz-cyan)', apex: '--ax-viz-cyan' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald) 14%, transparent)', fg: 'var(--ax-viz-emerald)', apex: '--ax-viz-emerald' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber) 14%, transparent)', fg: 'var(--ax-viz-amber)', apex: '--ax-viz-amber' },
  violet: { bg: 'color-mix(in oklab, var(--ax-viz-violet) 14%, transparent)', fg: 'var(--ax-viz-violet)', apex: '--ax-viz-violet' },
  pink: { bg: 'color-mix(in oklab, var(--ax-viz-pink) 14%, transparent)', fg: 'var(--ax-viz-pink)', apex: '--ax-viz-pink' },
  red: { bg: 'color-mix(in oklab, var(--ax-viz-red) 14%, transparent)', fg: 'var(--ax-viz-red)', apex: '--ax-viz-red' },
};

function KpiCard({ icon, tone, label, value, unit, sub, badge, spark, sparkType = 'line', onClick }: KpiProps) {
  const t = TONE[tone];
  const hasSpark = Array.isArray(spark) && spark.length > 1;
  const allZeros = hasSpark && spark!.every((v) => v === 0);
  const safeSpark = allZeros ? [0, 1, 0, 1, 0, 0, 1] : spark;

  return (
    <div
      className="ax-card ax-col--3"
      style={{ cursor: onClick ? 'pointer' : 'default', transition: 'transform 0.15s ease' }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? onActivate(onClick) : undefined}
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
              {ARROW_UP} {badge}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--ax-font-display)', fontSize: '1.35rem', fontWeight: 700, lineHeight: 1.1, color: 'var(--ax-text-strong)', fontVariantNumeric: 'tabular-nums' }}>
              {value} {unit && <small style={{ fontSize: '11px', fontWeight: 500, color: 'var(--ax-text-muted)' }}>{unit}</small>}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--ax-text-muted)', marginTop: '2px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</div>
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

/* ───────── Progress bar ───────── */
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

/* ───────── Filter bar ───────── */
function FilterBar({
  ariaLabel, districts, selected, onChange, shown,
}: {
  ariaLabel: string;
  districts: string[];
  selected: string;
  onChange: (v: string) => void;
  shown: ReactNode;
}) {
  const active = selected !== 'All';
  return (
    <section
      className="ax-card ax-card--flat ax-col--12"
      role="region"
      aria-label={ariaLabel}
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
            {ICON_FILTER} Filter Operations
          </span>
          <div className="ax-cluster ula-filter-item" style={{ alignItems: 'center' }}>
            <label htmlFor="district-select" style={labelStyle}>District:</label>
            <select id="district-select" className="ax-input ax-input--sm" style={selectStyle} value={selected} onChange={(e) => onChange(e.target.value)}>
              <option value="All">All Districts ({districts.length})</option>
              {districts.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          {active && (
            <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" style={{ height: 28, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }} onClick={() => onChange('All')}>
              Reset Filters
            </button>
          )}
        </div>
        <div className="ax-cluster ula-filter-scope" style={{ gap: 'var(--ax-space-2)', alignItems: 'center' }}>
          <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>{shown}</span>
        </div>
      </div>
    </section>
  );
}

/* ───────── Welcome banner ───────── */
function WelcomeBanner({
  ariaLabel, eyebrow, title, lede, stats,
}: {
  ariaLabel: string;
  eyebrow: string;
  title: string;
  lede: ReactNode;
  stats: { label: string; value: string; sub: string; color: string }[];
}) {
  return (
    <section className="ax-card ax-welcome ax-col--12" role="region" aria-label={ariaLabel}>
      <div className="ax-welcome__body">
        <div className="ax-welcome__text">
          <p className="ax-welcome__eyebrow">{eyebrow}</p>
          <h2 className="ax-card__title">{title}</h2>
          <p className="ax-welcome__lede">{lede}</p>
        </div>
        <dl className="ax-welcome__stats">
          {stats.map((s) => (
            <div key={s.label} className="ax-welcome__stat">
              <dt>{s.label}</dt>
              <dd className="ax-num">{s.value}</dd>
              <small style={{ fontSize: 'var(--ax-text-xs)', color: s.color }}>{s.sub}</small>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}



/* ───────── Monthly trend (8 col) ───────── */
function MonthlyCard({
  eyebrow, title, subtitle, legend, months, chartH, emptyTitle, emptyMessage,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  legend: string;
  months: { month_year: string; value: number }[];
  chartH: number;
  emptyTitle: string;
  emptyMessage: string;
}) {
  return (
    <section className="ax-card ax-card--chart ax-col--8" role="region" aria-label={title}>
      <div className="ax-card__header">
        <div className="ax-card__titles">
          <span className="ax-card__eyebrow">{eyebrow}</span>
          <h2 className="ax-card__title">{title}</h2>
          <p className="ax-card__subtitle">{subtitle}</p>
        </div>
        <div className="ax-card__actions">
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)' }}>
            <span className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}>
              <i style={{ width: 10, height: 10, borderRadius: 2, background: LIGHT_GREEN }} />
              <small style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-xs)' }}>{legend}</small>
            </span>
          </div>
        </div>
      </div>
      <div className="ax-card__body" style={{ paddingTop: 0, minHeight: chartH }}>
        {months.length > 0 ? (
          <Suspense fallback={<div className="ax-skeleton" style={{ height: chartH }} />}>
            <ApexChart
              key={`month-${chartH}-${months.map((m) => `${m.month_year}${m.value}`).join('-')}`}
              type="area"
              height={chartH}
              legend="none"
              ariaLabel={title}
              series={[{ name: legend, data: months.map((m) => n(m.value)) }]}
              apex={{
                colors: [LIGHT_GREEN],
                stroke: { curve: 'smooth', width: 2 },
                fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.05, stops: [0, 90, 100] } },
                markers: { size: 4, strokeWidth: 0, hover: { size: 6 } },
                dataLabels: { enabled: false },
                xaxis: { categories: months.map((m) => fmtMonth(m.month_year)) },
                yaxis: { min: 0, forceNiceScale: true, labels: { formatter: (v: number) => `${Math.round(v)}` }, title: { text: 'Count', style: { color: 'var(--ax-text-muted)' } } },
                tooltip: { y: { formatter: (v: number) => `${v}` } },
              }}
            />
          </Suspense>
        ) : (
          <TableEmpty title={emptyTitle} message={emptyMessage} />
        )}
      </div>
    </section>
  );
}

// local empty-state wrapper
const TableEmpty = (p: { title: string; message: string }) => <TableEmptyState title={p.title} message={p.message} />;

/* ───────── Donut split (4 col) ───────── */
function StatusDonutCard({
  eyebrow, title, totalLabel, total, labels, series, colors, items, donutH,
}: {
  eyebrow: string;
  title: string;
  totalLabel: string;
  total: number;
  labels: string[];
  series: number[];
  colors: string[];
  items: { label: string; sub: string; v: number; color: string }[];
  donutH: number;
}) {
  return (
    <section className="ax-card ax-col--4" role="region" aria-label={title}>
      <div className="ax-card__header">
        <div className="ax-card__titles">
          <span className="ax-card__eyebrow">{eyebrow}</span>
          <h2 className="ax-card__title">{title}</h2>
          <p className="ax-card__subtitle">Total {num(total)} {totalLabel}</p>
        </div>
      </div>
      <div className="ax-card__body" style={{ paddingTop: 0 }}>
        <Suspense fallback={<div className="ax-skeleton" style={{ height: donutH }} />}>
          <ApexChart
            key={`donut-${donutH}-${series.join('-')}`}
            type="donut"
            height={donutH}
            legend="none"
            ariaLabel={title}
            series={series}
            apex={{
              labels,
              colors,
              stroke: { width: 0 },
              plotOptions: {
                pie: {
                  donut: {
                    size: '72%',
                    labels: {
                      show: true,
                      name: { fontFamily: cv('--ax-font-sans') },
                      value: { fontFamily: cv('--ax-font-mono'), fontWeight: 600 },
                      total: { show: true, label: totalLabel, formatter: () => num(total) },
                    },
                  },
                },
              },
            }}
          />
        </Suspense>
        <ul className="ax-list ax-list--compact" style={{ marginTop: 'var(--ax-space-3)' }}>
          {items.map((s) => (
            <li key={s.label} className="ax-list__row" style={{ border: 0, paddingInline: 0 }}>
              <span className="ax-list__leading"><i style={{ width: 9, height: 9, borderRadius: 3, background: s.color, display: 'inline-block' }} /></span>
              <span className="ax-list__content">
                <span className="ax-list__title" style={{ fontWeight: 'var(--ax-weight-medium)' }}>{s.label}</span>
                <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>{s.sub}</span>
              </span>
              <span className="ax-list__trailing ax-num" style={{ color: 'var(--ax-text-strong)', fontWeight: 600 }}>{num(s.v)}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ───────── District stacked bar (8 col) ───────── */
function DistrictChartCard({
  subtitle, count, categories, series, colors, height, isMobile, onSelect,
}: {
  subtitle: string;
  count: string;
  categories: string[];
  series: { name: string; data: number[] }[];
  colors: string[];
  height: number;
  isMobile: boolean;
  onSelect: (district: string) => void;
}) {
  return (
    <section className="ax-card ax-card--chart ax-col--8" role="region" aria-label="District wise installations">
      <div className="ax-card__header">
        <div className="ax-card__titles">
          <span className="ax-card__eyebrow">Geographic Breakdown</span>
          <h2 className="ax-card__title">District-wise Installation Statistics</h2>
          <p className="ax-card__subtitle">{subtitle}</p>
        </div>
        <div className="ax-card__actions">
          <span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--pill">{count} Districts</span>
        </div>
      </div>
      <div className="ax-card__body" style={{ paddingTop: 0 }}>
        {categories.length > 0 ? (
          <Suspense fallback={<div className="ax-skeleton" style={{ height }} />}>
            <ApexChart
              key={`bar-${height}-${categories.length}-${series.map((s) => s.data.join(',')).join('|')}`}
              type="bar"
              height={height}
              legend="top"
              stacked
              ariaLabel="Horizontal stacked bar of installations per district by progress"
              series={series}
              apex={{
                colors,
                plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: '58%' } },
                xaxis: { categories, labels: { style: { fontSize: '11px' } } },
                yaxis: { labels: { maxWidth: isMobile ? 90 : 160, style: { fontSize: '11px' } } },
                chart: {
                  events: {
                    dataPointSelection: (_e: unknown, _c: unknown, opts: any) => {
                      const dist = categories[opts?.dataPointIndex];
                      if (dist) onSelect(dist);
                    },
                  },
                },
              }}
            />
          </Suspense>
        ) : (
          <TableEmpty title="No district records" message="District progress appears once sites are allocated." />
        )}
      </div>
    </section>
  );
}

/* ───────── Milestones (4 col) ───────── */
function MilestonesCard({ milestones }: { milestones: { label: string; v: number; of: number; color: string }[] }) {
  return (
    <section className="ax-card ax-col--4" role="region" aria-label="Installation Progress">
      <div className="ax-card__header">
        <div className="ax-card__titles">
          <span className="ax-card__eyebrow">Workflow Lifecycle</span>
          <h2 className="ax-card__title">Installation Milestones</h2>
          <p className="ax-card__subtitle">Progress across execution stages</p>
        </div>
      </div>
      <div className="ax-card__body" style={{ paddingTop: 0, display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-4)' }}>
        {milestones.map((m) => {
          const p = pctOf(m.v, m.of);
          return (
            <div key={m.label}>
              <div className="ax-cluster" style={{ justifyContent: 'space-between', marginBottom: 4, flexWrap: 'wrap', gap: 4 }}>
                <span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-strong)', fontWeight: 500 }}>{m.label}</span>
                <b className="ax-num" style={{ color: m.color, fontSize: 'var(--ax-text-xs)' }}>{num(m.v)} / {num(m.of)} ({p}%)</b>
              </div>
              <div className="ax-progress ax-progress--sm"><div className="ax-progress__track"><div className="ax-progress__fill" style={{ width: `${p}%`, background: m.color }} /></div></div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ───────── Export helpers ───────── */
const getExportValue = <T,>(row: T, column: ExportColumn<T>) => {
  if (typeof column.accessor === 'function') return (column.accessor as any)(row);
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
  const csv = rows.map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\r\n');
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

const makeToolbarColumns = <T,>(columns: ExportColumn<T>[], hidden: string[]) =>
  columns.map((c, i) => ({ key: `${c.header}-${i}`, label: c.header, visible: !hidden.includes(`${c.header}-${i}`) }));

const visibleColumns = <T,>(columns: ExportColumn<T>[], hidden: string[]) =>
  columns.filter((c, i) => !hidden.includes(`${c.header}-${i}`));

const toggleIn = (setter: Dispatch<SetStateAction<string[]>>) => (key: string) =>
  setter((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));


interface DistrictRow {
  district: string;
  total: number;
  assigned: number;
  accept: number;
  complete: number;
  pending: number;
  verify_approved: number;
  claim_applicable: number;
  payment_complete: number;
}

export function UP_Installation_SSL_Dashboard() {
  const navigate = useNavigate();
  const isMobile = useIsMobile(640);
  const [data, setData] = useState<UpSsl18wDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState('All');
  const [qDistrict, setQDistrict] = useState('');
  const [hiddenCols, setHiddenCols] = useState<string[]>([]);

  const chartH = isMobile ? 260 : 320;
  const donutH = isMobile ? 210 : 230;

  const loadDashboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setLoading(true);
    setApiError(null);
    try {
      const resp = await upInstallationService.getSsl18wDashboardData();
      if (resp) {
        setData(resp);
        setUpdatedAt(new Date());
      } else {
        setApiError('Unable to load UP SSL 18W installation dashboard from server.');
      }
    } catch (err: any) {
      console.error(err);
      setApiError(err?.message || 'Failed to fetch dashboard data.');
    } finally {
      setLoading(false);
      if (isRefresh) setTimeout(() => setIsRefreshing(false), 400);
    }
  }, []);

  useEffect(() => { loadDashboardData(); }, [loadDashboardData]);

  const initialLoad = loading && !data;
  const dash = (v: number) => (initialLoad ? '…' : num(v));

  const rawDetail: UpSsl18wInstallDetailsCount = data?.install_detail || {
    total: 0, accept: 0, complete: 0, pending: 0,
    verify_approved: 0, verify_pending: 0, verify_reject: 0,
    claim_applicable: 0, claim_raised: 0, claim_not_applicable: 0,
    claim_verify_approved: 0, claim_verify_pending: 0, claim_verify_reject: 0,
    payment_complete: 0, payment_pending: 0, payment_partially: 0,
  };

  const districtwise: DistrictRow[] = useMemo(
    () => (data?.districtwise || []).map((d: any) => ({
      district: d.district || '',
      total: n(d.total),
      assigned: n(d.assigned ?? d.total),
      accept: n(d.accept),
      complete: n(d.complete),
      pending: n(d.pending),
      verify_approved: n(d.verify_approved),
      claim_applicable: n(d.claim_applicable),
      payment_complete: n(d.payment_complete),
    })),
    [data]
  );

  // oldest → newest
  const monthly = useMemo(
    () => [...(data?.vendor_installation_month || [])].reverse().map((m: any) => ({ month_year: m.month_year, value: n(m.monthly_installations) })),
    [data]
  );
  const monthTotal = monthly.reduce((a, m) => a + m.value, 0);

  const filtersActive = selectedDistrict !== 'All';
  const filteredRows = useMemo(
    () => (filtersActive ? districtwise.filter((d) => d.district.toLowerCase() === selectedDistrict.toLowerCase()) : districtwise),
    [districtwise, selectedDistrict, filtersActive]
  );

  const deferredQuery = useDeferredValue(qDistrict);
  const tableRows = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return filteredRows.filter((d) => !q || d.district.toLowerCase().includes(q));
  }, [filteredRows, deferredQuery]);

  const pD = usePagination({ data: tableRows, initialPageSize: 15 });
  useEffect(() => { pD.setPage(1); }, [qDistrict, selectedDistrict]);

  const totals = useMemo(
    () => filteredRows.reduce(
      (a, d) => ({
        total: a.total + d.total, assigned: a.assigned + d.assigned, accept: a.accept + d.accept,
        complete: a.complete + d.complete, pending: a.pending + d.pending,
        verify_approved: a.verify_approved + d.verify_approved, claim_applicable: a.claim_applicable + d.claim_applicable,
      }),
      { total: 0, assigned: 0, accept: 0, complete: 0, pending: 0, verify_approved: 0, claim_applicable: 0 }
    ),
    [filteredRows]
  );

  const spk = (pick: (d: DistrictRow) => number) => {
    const arr = districtwise.slice(0, 10).map(pick);
    return arr.length > 1 ? arr : undefined;
  };

  const chartDistricts = useMemo(() => [...filteredRows].sort((a, b) => b.total - a.total).slice(0, 15), [filteredRows]);
  const districtChartH = Math.min(560, Math.max(isMobile ? 280 : 320, chartDistricts.length * (isMobile ? 38 : 44)));

  const totalLights = rawDetail.total || 0;
  const completedLights = rawDetail.complete || 0;
  const approvedLights = rawDetail.verify_approved || 0;
  const compPct = pctOf(completedLights, totalLights);
  const appPct = pctOf(approvedLights, totalLights);

  const navigateToStatus = (status: string, dist?: string) => {
    const d = dist || (filtersActive ? selectedDistrict : '');
    const q = new URLSearchParams();
    q.set('status', status);
    if (d) q.set('district', d);
    navigate(`/v/up/ssl-18w-installation-dashboard-status?${q.toString()}`);
  };

  /* ───────── Export ───────── */
  const cols: ExportColumn<DistrictRow>[] = useMemo(
    () => [
      { header: 'District', accessor: (r) => r.district },
      { header: 'Total Lights', accessor: (r) => r.total },
      { header: 'Assigned', accessor: (r) => r.assigned },
      { header: 'Accepted', accessor: (r) => r.accept },
      { header: 'Complete', accessor: (r) => r.complete },
      { header: 'Pending', accessor: (r) => r.pending },
      { header: 'Verified Approved', accessor: (r) => r.verify_approved },
      { header: 'Claim Applicable', accessor: (r) => r.claim_applicable },
      { header: 'Payment Done', accessor: (r) => r.payment_complete },
      { header: 'Completion %', accessor: (r) => `${pctOf(r.complete, r.total)}%` },
    ],
    []
  );
  const stamp = new Date().toISOString().slice(0, 10);
  const toolbarCols = makeToolbarColumns(cols, hiddenCols);

  const donutSeries = [rawDetail.verify_approved, rawDetail.verify_pending, rawDetail.verify_reject, rawDetail.pending].map(n);

  const milestones = [
    { label: '1. Total Lights', v: totalLights, of: totalLights, color: 'var(--ax-viz-cyan)' },
    { label: '2. Assignment Accepted', v: n(rawDetail.accept), of: totalLights, color: 'var(--ax-accent)' },
    { label: '3. Installation Complete', v: completedLights, of: totalLights, color: 'var(--ax-viz-violet)' },
    { label: '4. Verification Approved', v: approvedLights, of: totalLights, color: 'var(--ax-viz-emerald)' },
    { label: '5. Claims Raised', v: n(rawDetail.claim_raised), of: totalLights, color: 'var(--ax-viz-amber)' },
    { label: '6. Payment Complete', v: n(rawDetail.payment_complete), of: totalLights, color: 'var(--ax-viz-emerald)' },
  ];

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      <PageHead
        title="UP SSL 18W - Installation Dashboard"
        subtitle={
          <span style={{ display: 'inline-block', fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>
            Uttar Pradesh Operations · SSL 18W installation tracking — last updated {updatedAt ? fmtTime(updatedAt) : '—'}
          </span>
        }
        breadcrumbs={[
          { label: 'Home', href: '/v' },
          { label: 'Uttar Pradesh' },
          { label: 'Installation' },
          { label: 'SSL 18W Dashboard' },
        ]}
        actions={
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill" style={{ fontWeight: 600, paddingInline: 'var(--ax-space-3)' }}>
              <span className="ax-badge__dot" /> State: Uttar Pradesh
            </span>
            <button type="button" className="ax-btn ax-btn--ghost ax-btn--icon" aria-label="Refresh dashboard" onClick={() => loadDashboardData(true)} disabled={isRefreshing}>
              <span className={isRefreshing ? 'ax-spinner' : ''}>{ICON_REFRESH}</span>
            </button>
            <Link to="/v/up/view-18w-assign-installation-sites" className="ax-btn ax-btn--secondary ax-btn--sm">
              <span className="ax-btn__label">Assigned Lights</span>
            </Link>
            <Link to="/v/up/ssl-install-18w-light" className="ax-btn ax-btn--primary ax-btn--sm">
              {ICON_PLUS}
              <span className="ax-btn__label">Install Light</span>
            </Link>
          </div>
        }
      />

      <div className="ax-dash-grid mt-0 pt-0">
        {apiError && (
          <div className="ax-col--12" style={{ padding: '10px 14px', background: 'color-mix(in oklab, var(--ax-viz-red) 12%, transparent)', color: 'var(--ax-viz-red)', borderRadius: 'var(--ax-radius-md)', fontSize: 'var(--ax-text-sm)' }}>
            <b>Error:</b> {apiError}{' '}
            <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" onClick={() => loadDashboardData(true)}>Retry</button>
          </div>
        )}

        <FilterBar
          ariaLabel="SSL 18W Dashboard Filters"
          districts={districtwise.map((d) => d.district)}
          selected={selectedDistrict}
          onChange={setSelectedDistrict}
          shown={<>Showing <b style={{ color: 'var(--ax-text-strong)' }}>{dash(totalLights)}</b> lights · Live: <b style={{ color: 'var(--ax-text-strong)' }}>{fmtDate(new Date())}</b></>}
        />

        <WelcomeBanner
          ariaLabel="UP SSL 18W Installation Overview"
          eyebrow="UP SSL 18W Solar Street Light Project · State Hub"
          title="Welcome to UP SSL 18W Installation Dashboard"
          lede={
            <>
              Comprehensive installation monitoring across Uttar Pradesh: <b>{dash(totalLights)} lights</b> tracked across <b>{dash(districtwise.length)} districts</b>.
              <b> {dash(completedLights)} ({compPct}%)</b> installations completed, with <b>{dash(approvedLights)} ({appPct}%)</b> physically verified and approved.
            </>
          }
          stats={[
            { label: 'Total Lights', value: dash(totalLights), sub: `${districtwise.length} Districts`, color: 'var(--ax-viz-emerald)' },
            { label: 'Accepted', value: dash(n(rawDetail.accept)), sub: 'Ready to install', color: 'var(--ax-accent)' },
            { label: 'Completed', value: dash(completedLights), sub: `${compPct}% Installed`, color: 'var(--ax-viz-cyan)' },
            { label: 'Verified Approved', value: dash(approvedLights), sub: `${appPct}% Approved`, color: 'var(--ax-viz-emerald)' },
          ]}
        />



        <KpiCard
          icon={I_PIN} tone="accent" label="Total Lights"
          value={initialLoad ? '…' : num(rawDetail.total)} sub="Click to view all"
          spark={spk((d) => d.total)} onClick={() => navigateToStatus('total')}
        />
        <KpiCard
          icon={I_DONE} tone="emerald" label="Accepted Lights"
          value={initialLoad ? '…' : num(rawDetail.accept || 0)} sub="Assignment accepted"
          spark={spk((d) => d.accept)} onClick={() => navigateToStatus('accept')}
        />
        <KpiCard
          icon={I_BOLT} tone="cyan" label="Installation Status"
          value={initialLoad ? '…' : `${num(rawDetail.complete)} / ${num(rawDetail.pending)}`} sub="Complete / Pending"
          badge={`${compPct}% Done`} spark={spk((d) => d.complete)} onClick={() => navigateToStatus('complete')}
        />
        <KpiCard
          icon={I_DONE} tone="emerald" label="Verification Status"
          value={initialLoad ? '…' : `${num(rawDetail.verify_approved)} / ${num(rawDetail.verify_pending)} / ${num(rawDetail.verify_reject)}`} sub="Approved / Pending / Rejected"
          badge={`${appPct}% Approved`} spark={spk((d) => d.verify_approved)} onClick={() => navigateToStatus('verify-approved')}
        />
        <KpiCard
          icon={I_LIST} tone="amber" label="Claim Status"
          value={initialLoad ? '…' : `${num(rawDetail.claim_applicable)} / ${num(rawDetail.claim_raised)} / ${num(rawDetail.claim_not_applicable)}`} sub="Applicable / Raised / N/A"
          badge={n(rawDetail.claim_raised) > 0 ? `${num(rawDetail.claim_raised)} Raised` : undefined}
          spark={spk((d) => d.claim_applicable)} onClick={() => navigateToStatus('claim-applicable')}
        />
        <KpiCard
          icon={I_DONE} tone="violet" label="Claim Verification"
          value={initialLoad ? '…' : `${num(rawDetail.claim_verify_approved)} / ${num(rawDetail.claim_verify_pending)} / ${num(rawDetail.claim_verify_reject)}`} sub="Approved / Pending / Rejected"
          badge={n(rawDetail.claim_verify_approved) > 0 ? 'Approved' : undefined} onClick={() => navigateToStatus('claim-verify-approved')}
        />
        <KpiCard
          icon={I_COIN} tone="cyan" label="Payment Status"
          value={initialLoad ? '…' : `${num(rawDetail.payment_complete)} / ${num(rawDetail.payment_pending)}`} sub="Complete / Pending"
          badge={n(rawDetail.payment_complete) > 0 ? 'Disbursed' : undefined}
          spark={spk((d) => d.payment_complete)} onClick={() => navigateToStatus('payment-complete')}
        />

        <MonthlyCard
          eyebrow="Execution Throughput"
          title="Monthly Installation Velocity"
          subtitle={`${num(monthTotal)} lights installed across ${monthly.length} month${monthly.length === 1 ? '' : 's'} (last 10 months)`}
          legend="Installations"
          months={monthly}
          chartH={chartH}
          emptyTitle="No installation trend yet"
          emptyMessage="The monthly trend appears once installations are completed."
        />

        <StatusDonutCard
          eyebrow="Light Distribution"
          title="Installation Status"
          totalLabel="Lights"
          total={totalLights}
          labels={['Approved', 'Verify Pending', 'Rejected', 'Install Pending']}
          series={donutSeries}
          colors={[LIGHT_GREEN, LIGHT_BLUE, LIGHT_RED, LIGHT_AMBER]}
          donutH={donutH}
          items={[
            { label: 'Approved', sub: `${appPct}% of total`, v: donutSeries[0], color: LIGHT_GREEN },
            { label: 'Verify Pending', sub: 'Awaiting verification', v: donutSeries[1], color: LIGHT_BLUE },
            { label: 'Rejected', sub: 'Correction needed', v: donutSeries[2], color: LIGHT_RED },
            { label: 'Install Pending', sub: 'In progress', v: donutSeries[3], color: LIGHT_AMBER },
          ]}
        />

        <DistrictChartCard
          subtitle="Completed vs pending lights across districts · click bar to filter"
          count={dash(districtwise.length)}
          categories={chartDistricts.map((d) => d.district)}
          series={[
            { name: 'Installed', data: chartDistricts.map((d) => d.complete) },
            { name: 'Pending', data: chartDistricts.map((d) => d.pending) },
          ]}
          colors={[LIGHT_GREEN, LIGHT_AMBER]}
          height={districtChartH}
          isMobile={isMobile}
          onSelect={setSelectedDistrict}
        />

        <MilestonesCard milestones={milestones} />

        {/* District table */}
        <section className="ax-card ax-col--12" role="region" aria-label="District wise data">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Enterprise Data Analytics</span>
              <h2 className="ax-card__title">District-Wise Installation Progress</h2>
              <p className="ax-card__subtitle">Aggregated installation, verification &amp; payment counts per district</p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                <SearchInput value={qDistrict} onChange={setQDistrict} placeholder="Search district..." size="sm" />
                <TableExportToolbar
                  onCopy={() => copyToClipboard(tableRows, visibleColumns(cols, hiddenCols))}
                  onExportCSV={() => exportToCSV(tableRows, visibleColumns(cols, hiddenCols), `UP_SSL_18W_District_Wise_${stamp}`)}
                  onExportExcel={() => exportToExcel(tableRows, visibleColumns(cols, hiddenCols), `UP_SSL_18W_District_Wise_${stamp}`)}
                  onExportPDF={() => exportToPDF(tableRows, visibleColumns(cols, hiddenCols), 'UP SSL 18W - District-Wise Progress')}
                  columns={toolbarCols}
                  onToggleColumn={toggleIn(setHiddenCols)}
                />
              </div>
            </div>
          </div>
          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover ula-table--md">
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">Sr. No.</th>
                  <th className="ax-table__th" scope="col">District</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Total</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Assigned</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Accepted</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Install (Done / Pend)</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Verified</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Claim Applicable</th>
                  <th className="ax-table__th" scope="col">Progress</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {initialLoad ? (
                  <tr><td className="ax-table__td" colSpan={10} style={emptyCellStyle}><span className="ax-spinner" /> Loading district records…</td></tr>
                ) : pD.paginatedData.length === 0 ? (
                  <tr><td className="ax-table__td" colSpan={10} style={{ padding: 0 }}>
                    <TableEmptyState title="No districts found" message={qDistrict ? 'Try adjusting your search query' : 'No district records available'} />
                  </td></tr>
                ) : (
                  pD.paginatedData.map((d: DistrictRow, idx: number) => {
                    const isSelected = filtersActive && selectedDistrict.toLowerCase() === d.district.toLowerCase();
                    return (
                      <tr key={d.district || idx} className="ax-table__row" style={{ background: isSelected ? 'rgba(var(--ax-accent-rgb), 0.05)' : undefined }}>
                        <td className="ax-table__td" style={{ color: 'var(--ax-text-muted)' }}>{(pD.currentPage - 1) * pD.pageSize + idx + 1}</td>
                        <td className="ax-table__td" style={{ fontWeight: 'var(--ax-weight-semibold)', color: 'var(--ax-text-strong)' }}>{d.district}</td>
                        <td className="ax-table__td ax-table__td--num ax-num" style={{ fontWeight: 600 }}>{num(d.total)}</td>
                        <td className="ax-table__td ax-table__td--num ax-num">{num(d.assigned)}</td>
                        <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-emerald)', fontWeight: 600 }}>{num(d.accept)}</td>
                        <td className="ax-table__td ax-table__td--num">
                          <div className="ax-cluster" style={{ justifyContent: 'flex-end', gap: '4px' }}>
                            <span className="ax-badge ax-badge--soft ax-badge--success" style={{ fontWeight: 600, padding: '2px 7px' }}>{num(d.complete)}</span>
                            <span style={{ color: 'var(--ax-text-muted)', fontSize: '11px' }}>/</span>
                            <span className="ax-badge ax-badge--soft ax-badge--warning" style={{ fontWeight: 600, padding: '2px 7px' }}>{num(d.pending)}</span>
                          </div>
                        </td>
                        <td className="ax-table__td ax-table__td--num ax-num">{num(d.verify_approved)}</td>
                        <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-accent)' }}>{num(d.claim_applicable)}</td>
                        <td className="ax-table__td"><Bar pct={pctOf(d.complete, d.total)} /></td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="ax-btn ax-btn--secondary ax-btn--sm"
                            style={{ height: 26, padding: '0 8px', fontSize: '11px', gap: '4px' }}
                            onClick={() => navigateToStatus('total', d.district)}
                            title={`Inspect lights in ${d.district}`}
                          >
                            {ICON_EYE}
                            <span className="ax-btn__label">View Lights</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
                {tableRows.length > 0 && (
                  <tr className="ax-table__row" style={{ background: 'var(--ax-surface-subtle)', fontWeight: 'var(--ax-weight-bold)' }}>
                    <td className="ax-table__td" style={{ background: 'var(--ax-surface-subtle)' }} />
                    <td className="ax-table__td" style={{ color: 'var(--ax-text-strong)', background: 'var(--ax-surface-subtle)' }}>Total ({filteredRows.length} Districts)</td>
                    <td className="ax-table__td ax-table__td--num ax-num">{num(totals.total)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num">{num(totals.assigned)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num">{num(totals.accept)}</td>
                    <td className="ax-table__td ax-table__td--num">
                      <div className="ax-cluster" style={{ justifyContent: 'flex-end', gap: '4px' }}>
                        <span className="ax-badge ax-badge--soft ax-badge--success" style={{ fontWeight: 700 }}>{num(totals.complete)}</span>
                        <span>/</span>
                        <span className="ax-badge ax-badge--soft ax-badge--warning" style={{ fontWeight: 700 }}>{num(totals.pending)}</span>
                      </div>
                    </td>
                    <td className="ax-table__td ax-table__td--num ax-num">{num(totals.verify_approved)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num">{num(totals.claim_applicable)}</td>
                    <td className="ax-table__td"><Bar pct={Math.round(pctOf(totals.complete, totals.total))} /></td>
                    <td />
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="ax-card__footer" style={footerStyle}>
            <div className="ula-pagination-left">
              <Pagination
                currentPage={pD.currentPage}
                totalItems={pD.totalItems}
                pageSize={pD.pageSize}
                onPageChange={pD.setPage}
                onPageSizeChange={pD.setPageSize}
                pageSizeOptions={[10, 15, 25, 50, 100]}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default UP_Installation_SSL_Dashboard;