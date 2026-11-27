import { lazy, Suspense, useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  upInstallationService,
  type UpKusumCDashboardData,
  type UpKusumCDashboardCounts,
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

  /* Interactive KPI cursor & hover */
  .asw-interactive-kpi {
    cursor: pointer;
    transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
  }
  .asw-interactive-kpi:hover {
    transform: translateY(-2px);
    box-shadow: var(--ax-shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
    border-color: rgba(var(--ax-accent-rgb, 37, 99, 235), 0.35) !important;
  }
`;

/* ───────── Icons ───────── */
const ICON_REFRESH = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" /><path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" /></svg>
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
const I_DOC = svg(<><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2" /><path d="M9 13l2 2l4 -4" /></>);
const I_COIN = svg(<><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M14.8 9a2 2 0 0 0 -1.8 -1h-2a2 2 0 1 0 0 4h2a2 2 0 1 1 0 4h-2a2 2 0 0 1 -1.8 -1" /><path d="M12 7v10" /></>);
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
interface KpiPart {
  label?: string;
  value: number;
  to: string;
}

interface KpiProps {
  icon: ReactNode;
  tone: 'accent' | 'cyan' | 'emerald' | 'amber' | 'violet' | 'pink' | 'red';
  label: string;
  value: string;
  unit?: string;
  sub: string;
  badge?: string;
  spark?: number[];
  parts?: KpiPart[];
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

function KpiCard({ icon, tone, label, value, unit, sub, badge, spark, parts, sparkType = 'line', onClick }: KpiProps) {
  const t = TONE[tone];
  const hasSpark = Array.isArray(spark) && spark.length > 1 && spark.some((v) => v > 0);
  const safeSpark = spark;
  const isMultiPart = Boolean(parts && parts.length > 1);
  const cardClickable = Boolean(onClick && !isMultiPart);

  return (
    <div
      className={`ax-card ax-col--3 ${cardClickable ? 'asw-interactive-kpi' : ''}`}
      style={{ cursor: cardClickable ? 'pointer' : 'default', transition: 'transform 0.15s ease' }}
      onClick={cardClickable ? onClick : undefined}
      role={cardClickable ? 'button' : undefined}
      tabIndex={cardClickable ? 0 : undefined}
      onKeyDown={cardClickable && onClick ? onActivate(onClick) : undefined}
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
            <div style={{ fontFamily: 'var(--ax-font-display)', fontSize: parts && parts.length > 2 ? '1.1rem' : '1.35rem', fontWeight: 700, lineHeight: 1.1, color: 'var(--ax-text-strong)', fontVariantNumeric: 'tabular-nums' }}>
              {parts ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap', gap: '2px' }}>
                  {parts.map((p, i) => (
                    <span key={i} style={{ display: 'inline-flex', alignItems: 'center' }}>
                      {i > 0 && <span style={{ color: 'var(--ax-text-muted)', fontWeight: 500, marginInline: '3px' }}>/</span>}
                      <Link
                        to={p.to}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          color: 'inherit',
                          textDecoration: 'none',
                          padding: '1px 3px',
                          borderRadius: '4px',
                          transition: 'all 0.15s ease',
                        }}
                        title={p.label ? `View ${p.label}: ${num(p.value)} sites` : `View: ${num(p.value)} sites`}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = t.bg;
                          e.currentTarget.style.color = t.fg;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = 'inherit';
                        }}
                      >
                        {num(p.value)}
                      </Link>
                    </span>
                  ))}
                </span>
              ) : (
                <span>
                  {value} {unit && <small style={{ fontSize: '11px', fontWeight: 500, color: 'var(--ax-text-muted)' }}>{unit}</small>}
                </span>
              )}
            </div>
            {parts && parts.some((p) => p.label) ? (
              <div style={{ fontSize: '11px', color: 'var(--ax-text-muted)', marginTop: '3px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {parts.map((p, i) => (
                  <span key={i}>
                    {i > 0 && <span style={{ opacity: 0.6 }}> / </span>}
                    {p.label ? (
                      <Link
                        to={p.to}
                        onClick={(e) => e.stopPropagation()}
                        style={{ color: 'inherit', textDecoration: 'none' }}
                        title={`View ${p.label} sites`}
                        onMouseEnter={(e) => (e.currentTarget.style.color = t.fg)}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'inherit')}
                      >
                        {p.label}
                      </Link>
                    ) : (
                      sub
                    )}
                  </span>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '11px', color: 'var(--ax-text-muted)', marginTop: '2px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</div>
            )}
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
  stats: { label: string; value: string; sub: string; color: string; onClick?: () => void }[];
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
            <div
              key={s.label}
              className={`ax-welcome__stat ${s.onClick ? 'asw-interactive-kpi' : ''}`}
              style={{ cursor: s.onClick ? 'pointer' : undefined }}
              onClick={s.onClick}
              role={s.onClick ? 'button' : undefined}
              tabIndex={s.onClick ? 0 : undefined}
            >
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
  eyebrow, title, totalLabel, total, labels, series, colors, items, donutH, onDrillDown,
}: {
  eyebrow: string;
  title: string;
  totalLabel: string;
  total: number;
  labels: string[];
  series: number[];
  colors: string[];
  items: { label: string; sub: string; v: number; color: string; slug?: string }[];
  donutH: number;
  onDrillDown?: (slug: string) => void;
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
              chart: {
                events: {
                  dataPointSelection: (_e: unknown, _c: unknown, opts: any) => {
                    const it = items[opts?.dataPointIndex];
                    if (it?.slug && onDrillDown) onDrillDown(it.slug);
                  },
                },
              },
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
            <li
              key={s.label}
              className={`ax-list__row ${onDrillDown && s.slug ? 'asw-interactive-kpi' : ''}`}
              style={{ border: 0, paddingInline: 0, cursor: onDrillDown && s.slug ? 'pointer' : undefined }}
              onClick={() => onDrillDown && s.slug && onDrillDown(s.slug)}
            >
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
function MilestonesCard({
  milestones,
  onDrillDown,
}: {
  milestones: { label: string; v: number; of: number; color: string; slug?: string }[];
  onDrillDown?: (slug: string) => void;
}) {
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
            <div
              key={m.label}
              className={onDrillDown && m.slug ? 'asw-interactive-kpi' : ''}
              style={{ cursor: onDrillDown && m.slug ? 'pointer' : undefined, padding: '4px 6px', borderRadius: 6 }}
              onClick={() => onDrillDown && m.slug && onDrillDown(m.slug)}
              title={onDrillDown && m.slug ? `Drilldown to ${m.label}` : undefined}
            >
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
  columns.map((c, i) => ({ key: `${c.header ?? c.label ?? ''}-${i}`, label: c.header ?? c.label ?? '', visible: !hidden.includes(`${c.header ?? c.label ?? ''}-${i}`) }));

const visibleColumns = <T,>(columns: ExportColumn<T>[], hidden: string[]) =>
  columns.filter((c, i) => !hidden.includes(`${c.header}-${i}`));

const toggleIn = (setter: Dispatch<SetStateAction<string[]>>) => (key: string) =>
  setter((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));


interface DistrictRow {
  district: string;
  total: number;
  total_assigned: number;
  complete: number;
  pending: number;
  verify_approved: number;
  verify_pending: number;
  verify_reject: number;
  claim_raised: number;
  claim_approved: number;
  claim_reject: number;
  payment_done: number;
  payment_partially: number;
  payment_pending: number;
}

export function UP_Installation_KusumC_Dashboard() {
  const navigate = useNavigate();
  const isMobile = useIsMobile(640);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dashData, setDashData] = useState<UpKusumCDashboardData | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState('All');
  const [qDistrict, setQDistrict] = useState('');
  const [apiError, setApiError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [hiddenCols, setHiddenCols] = useState<string[]>([]);

  const chartH = isMobile ? 260 : 320;
  const donutH = isMobile ? 210 : 230;

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setLoading(true);
    setApiError(null);
    try {
      const res = await upInstallationService.getKusumCDashboard();
      setDashData(res);
      setUpdatedAt(new Date());
    } catch (err: any) {
      console.warn('Dashboard load error:', err);
      setApiError(err?.message || 'Failed to load Kusum-C dashboard data.');
    } finally {
      setLoading(false);
      if (isRefresh) setTimeout(() => setIsRefreshing(false), 400);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const initialLoad = loading && !dashData;
  const dash = (v: number) => (initialLoad ? '…' : num(v));

  const k: UpKusumCDashboardCounts = dashData?.kusumc || {
    site_count: 0, complete: 0, pending: 0, site_assigned: 0, accept_pending: 0, site_not_assigned: 0,
    verify_pending: 0, verify_approved: 0, verify_reject: 0, doc_approved: 0, doc_pending: 0, doc_reject: 0,
    claim_applicable: 0, claim_raised: 0, claim_approved: 0, claim_pending: 0,
    inst_pay_done: 0, inst_pay_partially: 0, inst_pay_pending: 0,
  };

  const totalSites = k.site_count || k.complete + k.pending || 0;
  const completedSites = k.complete || 0;
  const pendingSites = k.pending || (totalSites - completedSites);
  const verifiedSites = k.verify_approved || 0;
  const docVerified = k.doc_approved || 0;
  const compPct = pctOf(completedSites, totalSites);
  const verPct = pctOf(verifiedSites, totalSites);

  /* ───────── Monthly + district data ───────── */
  const monthly = useMemo(
    () => (dashData?.$districtInstaMonth || []).map((m: any) => ({ month_year: m.month_year || '', value: n(m.monthly_installations) })),
    [dashData]
  );
  const monthTotal = monthly.reduce((a, m) => a + m.value, 0);

  const districtwise: DistrictRow[] = useMemo(
    () => (dashData?.districtwise || []).map((r: any) => ({
      district: r.f_district || r.district || '',
      total: n(r.total),
      total_assigned: n(r.total_assigned ?? r.total),
      complete: n(r.inst_complete ?? r.complete),
      pending: n(r.inst_pending ?? r.pending),
      verify_approved: n(r.verify_approved),
      verify_pending: n(r.verify_pending),
      verify_reject: n(r.verify_reject),
      claim_raised: n(r.claim_raised),
      claim_approved: n(r.claim_approved),
      claim_reject: n(r.claim_reject),
      payment_done: n(r.payment_done),
      payment_partially: n(r.payment_partially),
      payment_pending: n(r.payment_pending),
    })),
    [dashData]
  );

  const filtersActive = selectedDistrict !== 'All';
  const filteredRows = useMemo(
    () => (filtersActive ? districtwise.filter((d) => d.district === selectedDistrict) : districtwise),
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
        total: a.total + d.total,
        total_assigned: a.total_assigned + d.total_assigned,
        complete: a.complete + d.complete,
        pending: a.pending + d.pending,
        verify_approved: a.verify_approved + d.verify_approved,
        verify_pending: a.verify_pending + d.verify_pending,
        verify_reject: a.verify_reject + d.verify_reject,
        claim_raised: a.claim_raised + d.claim_raised,
        claim_approved: a.claim_approved + d.claim_approved,
        claim_reject: a.claim_reject + d.claim_reject,
        payment_done: a.payment_done + d.payment_done,
        payment_partially: a.payment_partially + d.payment_partially,
        payment_pending: a.payment_pending + d.payment_pending,
      }),
      {
        total: 0,
        total_assigned: 0,
        complete: 0,
        pending: 0,
        verify_approved: 0,
        verify_pending: 0,
        verify_reject: 0,
        claim_raised: 0,
        claim_approved: 0,
        claim_reject: 0,
        payment_done: 0,
        payment_partially: 0,
        payment_pending: 0,
      }
    ),
    [filteredRows]
  );

  const spk = (pick: (d: DistrictRow) => number) => {
    const arr = districtwise.slice(0, 10).map(pick);
    return arr.length > 1 ? arr : undefined;
  };

  const chartDistricts = useMemo(() => [...filteredRows].sort((a, b) => b.total - a.total).slice(0, 15), [filteredRows]);
  const districtChartH = Math.min(560, Math.max(isMobile ? 280 : 320, chartDistricts.length * (isMobile ? 38 : 44)));

  /* ───────── Export ───────── */
  const cols: ExportColumn<DistrictRow>[] = useMemo(
    () => [
      { header: 'District', accessor: (r) => r.district },
      { header: 'Total Sites', accessor: (r) => r.total },
      { header: 'Total Assigned', accessor: (r) => r.total_assigned },
      { header: 'Total Installed', accessor: (r) => r.complete },
      { header: 'Pending Installation', accessor: (r) => r.pending },
      { header: 'Verify Approved', accessor: (r) => r.verify_approved },
      { header: 'Verify Pending', accessor: (r) => r.verify_pending },
      { header: 'Verify Reject', accessor: (r) => r.verify_reject },
      { header: 'Claim Raised', accessor: (r) => r.claim_raised },
      { header: 'Claim Approved', accessor: (r) => r.claim_approved },
      { header: 'Claim Reject', accessor: (r) => r.claim_reject },
      { header: 'Payment Done', accessor: (r) => r.payment_done },
      { header: 'Payment Partially', accessor: (r) => r.payment_partially },
      { header: 'Payment Pending', accessor: (r) => r.payment_pending },
    ],
    []
  );
  const stamp = new Date().toISOString().slice(0, 10);
  const toolbarCols = makeToolbarColumns(cols, hiddenCols);

  const donutSeries = [k.verify_approved || 0, k.verify_pending || 0, k.verify_reject || 0, pendingSites];

  const milestones = [
    { label: '1. Total Pumps', v: totalSites, of: totalSites, color: 'var(--ax-viz-cyan)', slug: 'total' },
    { label: '2. Installation Complete', v: completedSites, of: totalSites, color: 'var(--ax-accent)', slug: 'complete' },
    { label: '3. Verification Approved', v: verifiedSites, of: totalSites, color: 'var(--ax-viz-emerald)', slug: 'verify-approved' },
    { label: '4. HOC Approved', v: docVerified, of: totalSites, color: 'var(--ax-viz-violet)', slug: 'doc-approved' },
    { label: '5. Claims Raised', v: k.claim_raised || 0, of: totalSites, color: 'var(--ax-viz-amber)', slug: 'claim-raised' },
    { label: '6. Payment Done', v: k.inst_pay_done || 0, of: totalSites, color: 'var(--ax-viz-emerald)', slug: 'pay-done' },
  ];

  const BASE = '/v/up/kusum-c-installation-view-dashboard/';
  const openDrillDown = (slug: string, district?: string) => {
    const dist = district && district !== 'All' ? district : (selectedDistrict !== 'All' ? selectedDistrict : undefined);
    const q = dist ? `?district=${encodeURIComponent(dist)}` : '';
    navigate(`${BASE}${slug}${q}`);
  };
  const P = (slug: string, value: number, label?: string) => {
    const dist = selectedDistrict !== 'All' ? selectedDistrict : undefined;
    const q = dist ? `?district=${encodeURIComponent(dist)}` : '';
    return { label, value, to: `${BASE}${slug}${q}` };
  };

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      <PageHead
        title="UP Kusum-C Installation Dashboard"
        subtitle={
          <span style={{ display: 'inline-block', fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>
            Uttar Pradesh Operations · Kusum-C solar pump tracking — last updated {updatedAt ? fmtTime(updatedAt) : '—'}
          </span>
        }
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Uttar Pradesh' },
          { label: 'Installation' },
          { label: 'Kusum-C Dashboard' },
        ]}
        actions={
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill" style={{ fontWeight: 600, paddingInline: 'var(--ax-space-3)' }}>
              <span className="ax-badge__dot" /> State: Uttar Pradesh
            </span>
            <button type="button" className="ax-btn ax-btn--ghost ax-btn--icon" aria-label="Refresh dashboard" onClick={() => loadData(true)} disabled={isRefreshing}>
              <span className={isRefreshing ? 'ax-spinner' : ''}>{ICON_REFRESH}</span>
            </button>
            <Link to="/v/up/kusum-c-installation-view-dashboard/total" className="ax-btn ax-btn--secondary ax-btn--sm">
              <span className="ax-btn__label">Status View</span>
            </Link>
            <Link to="/v/up/view-kusum-c-install-site" className="ax-btn ax-btn--primary ax-btn--sm">
              <span className="ax-btn__label">View Installations</span>
            </Link>
          </div>
        }
      />

      <div className="ax-dash-grid mt-0 pt-0">
        {apiError && (
          <div className="ax-col--12" style={{ padding: '10px 14px', background: 'color-mix(in oklab, var(--ax-viz-red) 12%, transparent)', color: 'var(--ax-viz-red)', borderRadius: 'var(--ax-radius-md)', fontSize: 'var(--ax-text-sm)' }}>
            <b>Error:</b> {apiError}{' '}
            <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" onClick={() => loadData(true)}>Retry</button>
          </div>
        )}

        <FilterBar
          ariaLabel="Kusum-C Dashboard Filters"
          districts={districtwise.map((d) => d.district)}
          selected={selectedDistrict}
          onChange={setSelectedDistrict}
          shown={<>Showing <b style={{ color: 'var(--ax-text-strong)' }}>{dash(totalSites)}</b> pumps · Live: <b style={{ color: 'var(--ax-text-strong)' }}>{fmtDate(new Date())}</b></>}
        />

        <WelcomeBanner
          ariaLabel="UP Kusum-C Installation Overview"
          eyebrow="PM-KUSUM Component-C · Uttar Pradesh · State Hub"
          title="Welcome to UP Kusum-C Installation Dashboard"
          lede={
            <>
              Solar pump feeder solarization overview: <b>{dash(totalSites)} pumps</b> tracked across <b>{dash(districtwise.length)} districts</b>.
              <b> {dash(completedSites)} ({compPct}%)</b> installations completed, with <b>{dash(verifiedSites)} ({verPct}%)</b> physically verified and approved.
            </>
          }
          stats={[
            { label: 'Total Pumps', value: dash(totalSites), sub: `${districtwise.length} Districts`, color: 'var(--ax-viz-emerald)', onClick: () => openDrillDown('total') },
            { label: 'Completed', value: dash(completedSites), sub: `${compPct}% Done`, color: 'var(--ax-viz-cyan)', onClick: () => openDrillDown('complete') },
            { label: 'Verified Approved', value: dash(verifiedSites), sub: `${verPct}% Approved`, color: 'var(--ax-viz-emerald)', onClick: () => openDrillDown('verify-approved') },
            { label: 'HOC Approved', value: dash(docVerified), sub: 'Certificates', color: 'var(--ax-accent)', onClick: () => openDrillDown('doc-approved') },
          ]}
        />

        <KpiCard
          icon={I_PIN}
          tone="accent"
          label="Total Sites"
          value=""
          sub="Total assigned pumps"
          parts={[P('total', totalSites, 'Total')]}
          spark={spk((d) => d.total)}
          onClick={() => openDrillDown('total')}
        />
        <KpiCard
          icon={I_PIN}
          tone="violet"
          label="Assigned Status"
          value=""
          sub="Assigned / Acceptance Pending / Pending"
          parts={[
            P('site-assigned', k.site_assigned || 0, 'Assigned'),
            P('accept-pending', k.accept_pending || 0, 'Acceptance Pending'),
            P('site-not-assigned', k.site_not_assigned || 0, 'Not Assigned'),
          ]}
        />
        <KpiCard
          icon={I_BOLT}
          tone="cyan"
          label="Installation Status"
          value=""
          sub="Installed / Pending"
          parts={[
            P('complete', completedSites, 'Installed'),
            P('pending', pendingSites, 'Pending'),
          ]}
          badge={`${compPct}% Done`}
          spark={spk((d) => d.complete)}
        />
        <KpiCard
          icon={I_DONE}
          tone="emerald"
          label="Verification Status"
          value=""
          sub="Approved / Pending / Rejected"
          parts={[
            P('verify-approved', verifiedSites, 'Approved'),
            P('verify-pending', k.verify_pending || 0, 'Pending'),
            P('verify-reject', k.verify_reject || 0, 'Rejected'),
          ]}
          badge={verifiedSites > 0 ? `${verPct}% Approved` : undefined}
          spark={spk((d) => d.verify_approved)}
        />
        <KpiCard
          icon={I_DOC}
          tone="violet"
          label="Document Status"
          value=""
          sub="Approved / Pending / Rejected"
          parts={[
            P('doc-approved', docVerified, 'Approved'),
            P('doc-pending', k.doc_pending || 0, 'Pending'),
            P('doc-reject', k.doc_reject || 0, 'Rejected'),
          ]}
        />
        <KpiCard
          icon={I_DOC}
          tone="amber"
          label="Claim Status"
          value=""
          sub="Applicable / Raised"
          parts={[
            P('claim-applicable', k.claim_applicable || 0, 'Applicable'),
            P('claim-raised', k.claim_raised || 0, 'Raised'),
          ]}
          badge={(k.claim_raised || 0) > 0 ? `${num(k.claim_raised || 0)} Raised` : undefined}
          spark={spk((d) => d.claim_raised)}
        />
        <KpiCard
          icon={I_DONE}
          tone="emerald"
          label="Claim Verify Status"
          value=""
          sub="Approved / Pending"
          parts={[
            P('claim-approved', k.claim_approved || 0, 'Approved'),
            P('claim-pending', k.claim_pending || 0, 'Pending'),
          ]}
        />
        <KpiCard
          icon={I_COIN}
          tone="cyan"
          label="Payment Status"
          value=""
          sub="Paid / Partially / Pending"
          parts={[
            P('pay-done', k.inst_pay_done || 0, 'Paid'),
            P('pay-partially', k.inst_pay_partially || 0, 'Partially'),
            P('pay-pending', k.inst_pay_pending || 0, 'Pending'),
          ]}
          badge={(k.inst_pay_done || 0) > 0 ? 'Disbursed' : undefined}
          spark={spk((d) => d.payment_done)}
        />

        <MonthlyCard
          eyebrow="Execution Throughput"
          title="Monthly Solar Pump Installations"
          subtitle={`${num(monthTotal)} pumps commissioned across ${monthly.length} month${monthly.length === 1 ? '' : 's'}`}
          legend="Installed Pumps"
          months={monthly}
          chartH={chartH}
          emptyTitle="No installation trend yet"
          emptyMessage="The monthly trend appears once pumps are commissioned."
        />

        <StatusDonutCard
          eyebrow="Pump Distribution"
          title="Installation Status"
          totalLabel="Pumps"
          total={totalSites}
          labels={['Approved', 'Verify Pending', 'Rejected', 'Install Pending']}
          series={donutSeries}
          colors={[LIGHT_GREEN, LIGHT_BLUE, LIGHT_RED, LIGHT_AMBER]}
          donutH={donutH}
          onDrillDown={openDrillDown}
          items={[
            { label: 'Approved', sub: `${verPct}% of total`, v: donutSeries[0], color: LIGHT_GREEN, slug: 'verify-approved' },
            { label: 'Verify Pending', sub: 'Awaiting verification', v: donutSeries[1], color: LIGHT_BLUE, slug: 'verify-pending' },
            { label: 'Rejected', sub: 'Correction needed', v: donutSeries[2], color: LIGHT_RED, slug: 'verify-reject' },
            { label: 'Install Pending', sub: 'In progress', v: donutSeries[3], color: LIGHT_AMBER, slug: 'pending' },
          ]}
        />

        <DistrictChartCard
          subtitle="Installed vs pending pumps across districts · click bar to filter"
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

        <MilestonesCard milestones={milestones} onDrillDown={openDrillDown} />

        {/* District table */}
        <section className="ax-card ax-col--12" role="region" aria-label="District wise data">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Enterprise Data Analytics</span>
              <h2 className="ax-card__title">District-wise Kusum-C Installation Summary</h2>
              <p className="ax-card__subtitle">Installation, verification, claim and payment progress by district</p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                <SearchInput value={qDistrict} onChange={setQDistrict} placeholder="Search district..." size="sm" />
                <TableExportToolbar
                  onCopy={() => copyToClipboard(tableRows, visibleColumns(cols, hiddenCols))}
                  onExportCSV={() => exportToCSV(tableRows, visibleColumns(cols, hiddenCols), `UP_KusumC_Districts_${stamp}`)}
                  onExportExcel={() => exportToExcel(tableRows, visibleColumns(cols, hiddenCols), `UP_KusumC_Districts_${stamp}`)}
                  onExportPDF={() => exportToPDF(tableRows, visibleColumns(cols, hiddenCols), 'UP Kusum-C District Installations')}
                  columns={toolbarCols}
                  onToggleColumn={toggleIn(setHiddenCols)}
                />
              </div>
            </div>
          </div>
          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover" style={{ minWidth: 1680 }}>
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col" style={{ width: 60 }}>Sr. No.</th>
                  <th className="ax-table__th" scope="col" style={{ minWidth: 140 }}>District</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Total Sites</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Total Assigned</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Total Installed</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Pending Installation</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Verify Approved</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Verify Pending</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Verify Reject</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Claim Raised</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Claim Approved</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Claim Reject</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Payment Done</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Payment Partially</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Payment Pending</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center', minWidth: 90 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {initialLoad ? (
                  <tr><td className="ax-table__td" colSpan={16} style={emptyCellStyle}><span className="ax-spinner" /> Loading district records…</td></tr>
                ) : pD.paginatedData.length === 0 ? (
                  <tr><td className="ax-table__td" colSpan={16} style={{ padding: 0 }}>
                    <TableEmptyState title="No district records" message="District breakdown data will appear here." />
                  </td></tr>
                ) : (
                  pD.paginatedData.map((d: DistrictRow, idx: number) => {
                    const isSelected = filtersActive && selectedDistrict === d.district;
                    return (
                      <tr key={d.district || idx} className="ax-table__row" style={{ background: isSelected ? 'rgba(var(--ax-accent-rgb), 0.05)' : undefined }}>
                        <td className="ax-table__td" style={{ color: 'var(--ax-text-muted)' }}>{(pD.currentPage - 1) * pD.pageSize + idx + 1}</td>
                        <td
                          className="ax-table__td"
                          style={{ fontWeight: 'var(--ax-weight-semibold)', color: 'var(--ax-text-strong)', cursor: 'pointer' }}
                          onClick={() => openDrillDown('total', d.district)}
                          title={`View all sites in ${d.district}`}
                        >
                          <b>{d.district}</b>
                        </td>
                        <td className="ax-table__td ax-table__td--num ax-num" style={{ fontWeight: 600 }}>
                          <span
                            style={{ cursor: 'pointer', color: 'var(--ax-text-strong)' }}
                            onClick={() => openDrillDown('total', d.district)}
                            title={`View total sites in ${d.district}`}
                          >
                            {num(d.total)}
                          </span>
                        </td>
                        <td className="ax-table__td ax-table__td--num ax-num">
                          <span
                            className="ax-badge ax-badge--soft ax-badge--info"
                            style={{ cursor: 'pointer', fontWeight: 600, padding: '2px 7px' }}
                            onClick={() => openDrillDown('site-assigned', d.district)}
                            title={`View assigned sites in ${d.district}`}
                          >
                            {num(d.total_assigned)}
                          </span>
                        </td>
                        <td className="ax-table__td ax-table__td--num ax-num">
                          <span
                            className="ax-badge ax-badge--soft ax-badge--success"
                            style={{ cursor: 'pointer', fontWeight: 600, padding: '2px 7px' }}
                            onClick={() => openDrillDown('complete', d.district)}
                            title={`View installed sites in ${d.district}`}
                          >
                            {num(d.complete)}
                          </span>
                        </td>
                        <td className="ax-table__td ax-table__td--num ax-num">
                          <span
                            className="ax-badge ax-badge--soft ax-badge--warning"
                            style={{ cursor: 'pointer', fontWeight: 600, padding: '2px 7px' }}
                            onClick={() => openDrillDown('pending', d.district)}
                            title={`View pending installation sites in ${d.district}`}
                          >
                            {num(d.pending)}
                          </span>
                        </td>
                        <td className="ax-table__td ax-table__td--num ax-num">
                          <span
                            className="ax-badge ax-badge--soft ax-badge--success"
                            style={{ cursor: 'pointer', fontWeight: 600, padding: '2px 7px' }}
                            onClick={() => openDrillDown('verify-approved', d.district)}
                            title={`View verified approved sites in ${d.district}`}
                          >
                            {num(d.verify_approved)}
                          </span>
                        </td>
                        <td className="ax-table__td ax-table__td--num ax-num">
                          <span
                            className="ax-badge ax-badge--soft ax-badge--warning"
                            style={{ cursor: 'pointer', fontWeight: 600, padding: '2px 7px' }}
                            onClick={() => openDrillDown('verify-pending', d.district)}
                            title={`View verification pending sites in ${d.district}`}
                          >
                            {num(d.verify_pending)}
                          </span>
                        </td>
                        <td className="ax-table__td ax-table__td--num ax-num">
                          <span
                            className="ax-badge ax-badge--soft ax-badge--danger"
                            style={{ cursor: 'pointer', fontWeight: 600, padding: '2px 7px' }}
                            onClick={() => openDrillDown('verify-reject', d.district)}
                            title={`View verification rejected sites in ${d.district}`}
                          >
                            {num(d.verify_reject)}
                          </span>
                        </td>
                        <td className="ax-table__td ax-table__td--num ax-num">
                          <span
                            className="ax-badge ax-badge--soft ax-badge--accent"
                            style={{ cursor: 'pointer', fontWeight: 600, padding: '2px 7px' }}
                            onClick={() => openDrillDown('claim-raised', d.district)}
                            title={`View claims raised in ${d.district}`}
                          >
                            {num(d.claim_raised)}
                          </span>
                        </td>
                        <td className="ax-table__td ax-table__td--num ax-num">
                          <span
                            className="ax-badge ax-badge--soft ax-badge--success"
                            style={{ cursor: 'pointer', fontWeight: 600, padding: '2px 7px' }}
                            onClick={() => openDrillDown('claim-approved', d.district)}
                            title={`View claims approved in ${d.district}`}
                          >
                            {num(d.claim_approved)}
                          </span>
                        </td>
                        <td className="ax-table__td ax-table__td--num ax-num">
                          <span
                            className="ax-badge ax-badge--soft ax-badge--danger"
                            style={{ cursor: 'pointer', fontWeight: 600, padding: '2px 7px' }}
                            onClick={() => openDrillDown('claim-pending', d.district)}
                            title={`View claims rejected in ${d.district}`}
                          >
                            {num(d.claim_reject)}
                          </span>
                        </td>
                        <td className="ax-table__td ax-table__td--num ax-num">
                          <span
                            className="ax-badge ax-badge--soft ax-badge--success"
                            style={{ cursor: 'pointer', fontWeight: 700, padding: '2px 7px' }}
                            onClick={() => openDrillDown('pay-done', d.district)}
                            title={`View payment done sites in ${d.district}`}
                          >
                            {num(d.payment_done)}
                          </span>
                        </td>
                        <td className="ax-table__td ax-table__td--num ax-num">
                          <span
                            className="ax-badge ax-badge--soft ax-badge--cyan"
                            style={{ cursor: 'pointer', fontWeight: 600, padding: '2px 7px' }}
                            onClick={() => openDrillDown('pay-partially', d.district)}
                            title={`View partially paid sites in ${d.district}`}
                          >
                            {num(d.payment_partially)}
                          </span>
                        </td>
                        <td className="ax-table__td ax-table__td--num ax-num">
                          <span
                            className="ax-badge ax-badge--soft ax-badge--warning"
                            style={{ cursor: 'pointer', fontWeight: 600, padding: '2px 7px' }}
                            onClick={() => openDrillDown('pay-pending', d.district)}
                            title={`View payment pending sites in ${d.district}`}
                          >
                            {num(d.payment_pending)}
                          </span>
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="ax-btn ax-btn--secondary ax-btn--sm"
                            style={{ height: 26, padding: '0 8px', fontSize: '11px', gap: '4px' }}
                            onClick={() => openDrillDown('total', d.district)}
                            title={`Inspect sites in ${d.district}`}
                          >
                            {ICON_EYE}
                            <span className="ax-btn__label">Sites</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
                {tableRows.length > 0 && (
                  <tr className="ax-table__row" style={{ background: 'var(--ax-surface-subtle)', fontWeight: 'var(--ax-weight-bold)' }}>
                    <td className="ax-table__td" style={{ background: 'var(--ax-surface-subtle)' }} />
                    <td className="ax-table__td" style={{ color: 'var(--ax-text-strong)', background: 'var(--ax-surface-subtle)', cursor: 'pointer' }} onClick={() => openDrillDown('total')}>Total ({filteredRows.length} Districts)</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ cursor: 'pointer' }} onClick={() => openDrillDown('total')}>{num(totals.total)}</td>
                    <td className="ax-table__td ax-table__td--num">
                      <span className="ax-badge ax-badge--soft ax-badge--info" style={{ fontWeight: 700, cursor: 'pointer' }} onClick={() => openDrillDown('site-assigned')}>{num(totals.total_assigned)}</span>
                    </td>
                    <td className="ax-table__td ax-table__td--num">
                      <span className="ax-badge ax-badge--soft ax-badge--success" style={{ fontWeight: 700, cursor: 'pointer' }} onClick={() => openDrillDown('complete')}>{num(totals.complete)}</span>
                    </td>
                    <td className="ax-table__td ax-table__td--num">
                      <span className="ax-badge ax-badge--soft ax-badge--warning" style={{ fontWeight: 700, cursor: 'pointer' }} onClick={() => openDrillDown('pending')}>{num(totals.pending)}</span>
                    </td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ cursor: 'pointer' }} onClick={() => openDrillDown('verify-approved')}>
                      <span className="ax-badge ax-badge--soft ax-badge--success" style={{ fontWeight: 700 }}>{num(totals.verify_approved)}</span>
                    </td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ cursor: 'pointer' }} onClick={() => openDrillDown('verify-pending')}>
                      <span className="ax-badge ax-badge--soft ax-badge--warning" style={{ fontWeight: 700 }}>{num(totals.verify_pending)}</span>
                    </td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ cursor: 'pointer' }} onClick={() => openDrillDown('verify-reject')}>
                      <span className="ax-badge ax-badge--soft ax-badge--danger" style={{ fontWeight: 700 }}>{num(totals.verify_reject)}</span>
                    </td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ cursor: 'pointer' }} onClick={() => openDrillDown('claim-raised')}>
                      <span className="ax-badge ax-badge--soft ax-badge--accent" style={{ fontWeight: 700 }}>{num(totals.claim_raised)}</span>
                    </td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ cursor: 'pointer' }} onClick={() => openDrillDown('claim-approved')}>
                      <span className="ax-badge ax-badge--soft ax-badge--success" style={{ fontWeight: 700 }}>{num(totals.claim_approved)}</span>
                    </td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ cursor: 'pointer' }} onClick={() => openDrillDown('claim-pending')}>
                      <span className="ax-badge ax-badge--soft ax-badge--danger" style={{ fontWeight: 700 }}>{num(totals.claim_reject)}</span>
                    </td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ cursor: 'pointer' }} onClick={() => openDrillDown('pay-done')}>
                      <span className="ax-badge ax-badge--soft ax-badge--success" style={{ fontWeight: 700 }}>{num(totals.payment_done)}</span>
                    </td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ cursor: 'pointer' }} onClick={() => openDrillDown('pay-partially')}>
                      <span className="ax-badge ax-badge--soft ax-badge--cyan" style={{ fontWeight: 700 }}>{num(totals.payment_partially)}</span>
                    </td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ cursor: 'pointer' }} onClick={() => openDrillDown('pay-pending')}>
                      <span className="ax-badge ax-badge--soft ax-badge--warning" style={{ fontWeight: 700 }}>{num(totals.payment_pending)}</span>
                    </td>
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

export default UP_Installation_KusumC_Dashboard;