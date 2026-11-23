import { lazy, Suspense, useCallback, useDeferredValue, useEffect, useMemo, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  kashmirSrtService,
  type KashmirSrtDashboardData,
} from '../../kashmir-services';
import {
  TableExportToolbar,
  SearchInput,
  Pagination,
  TableEmptyState,
  usePagination,
  type ExportColumn,
} from '../../../../../common';

// Code-split ApexCharts
const ApexChart = lazy(() => import('../../../../charts/ApexChart').then((m) => ({ default: m.ApexChart })));

/* ───────── Colors ───────── */
const LIGHT_BLUE = '#4992ff';
const LIGHT_GREEN = '#86DDB2';
const LIGHT_AMBER = '#F6D68A';
const LIGHT_RED = '#ef6a6a';

/* ───────── Summary & District Types ───────── */
interface SrtSummary {
  site_count: number;
  material_dispatch: number;
  material_pending: number;
  complete: number;
  pending: number;
  verify_pending: number;
  verify_approved: number;
  verify_reject: number;
  claim_applicable: number;
  claim_raised: number;
  claim_approved: number;
  inst_pay80_done: number;
  inst_pay80_pending: number;
  inst_pay80_partially: number;
  inst_pay20_done: number;
  inst_pay20_pending: number;
  inst_pay20_partially: number;
}

interface DistrictRow {
  district: string;
  site_count: number;
  complete: number;
  pending: number;
  verify_pending: number;
  verify_approved: number;
  verify_reject: number;
  claim_applicable: number;
  claim_raised: number;
  claim_approved: number;
  inst_pay80_done: number;
  inst_pay80_pending: number;
  inst_pay80_partially: number;
  inst_pay20_done: number;
  inst_pay20_pending: number;
  inst_pay20_partially: number;
}

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

/* ───────── Layout CSS (Bihar pattern) ───────── */
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
  .solar-erp-page .ula-table--sm { min-width: 540px; }
  .solar-erp-page .ula-table--md { min-width: 860px; }
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
    .solar-erp-page .ax-card__title {
      font-family: var(--ax-font-display); font-size: var(--ax-text-md); line-height: var(--ax-leading-md);
    }
    .solar-erp-page .ax-card__actions { flex: 0 0 auto; width: 100%; margin-left: 0; flex-wrap: wrap; justify-content: flex-start; }
    .solar-erp-page .ax-card__actions .ax-cluster { flex-wrap: wrap !important; width: 100%; justify-content: flex-start; gap: 8px; }
    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] { flex: 1 1 100%; width: 100%; max-width: 100%; min-width: 0; }
    .solar-erp-page .ax-card__actions .ax-export-toolbar,
    .solar-erp-page .ax-card__actions [class*="export-toolbar"] {
      flex: 1 1 100%; flex-wrap: wrap; justify-content: flex-start; gap: 6px;
    }
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
const I_BOLT = svg(<path d="M13 3l0 7l6 0l-8 11l0 -7l-6 0l8 -11" />);
const I_DONE = svg(<><path d="M7 12l5 5l10 -10" /><path d="M2 12l5 5m5 -5l5 -5" /></>);
const I_SHIELD = svg(<><path d="M12 3a12 12 0 0 0 8.5 3a12 12 0 0 1 -8.5 15a12 12 0 0 1 -8.5 -15a12 12 0 0 0 8.5 -3" /><path d="M9 12l2 2l4 -4" /></>);
const I_LIST = svg(<><path d="M9 6l11 0" /><path d="M9 12l11 0" /><path d="M9 18l11 0" /><path d="M5 6l0 .01" /><path d="M5 12l0 .01" /><path d="M5 18l0 .01" /></>);
const I_COIN = svg(<><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M14.8 9a2 2 0 0 0 -1.8 -1h-2a2 2 0 1 0 0 4h2a2 2 0 1 1 0 4h-2a2 2 0 0 1 -1.8 -1" /><path d="M12 7v10" /></>);

/* ───────── KPI Card (Bihar design: clickable card + clickable number segments) ───────── */
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

export function Kashmir_Installation_SRT_Dashboard() {
  const navigate = useNavigate();
  const isMobile = useIsMobile(640);
  const [data, setData] = useState<KashmirSrtDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [qDistrict, setQDistrict] = useState<string>('');

  // ── Status drill-down navigation (same click system everywhere) ──
  const navigateToStatus = (statusKey: string, dist?: string) => {
    const d = dist || (selectedDistrict !== 'All' ? selectedDistrict : '');
    if (d) {
      navigate(`/v/kashmir/srt/70mw-installation-districtwise/${statusKey}/${encodeURIComponent(d)}`);
    } else {
      navigate(`/v/kashmir/srt/70mw-installation-view-dashboard/${statusKey}`);
    }
  };

  const chartH = isMobile ? 260 : 320;
  const donutH = isMobile ? 210 : 230;

  const loadDashboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setLoading(true);
    setApiError(null);
    try {
      const resp: any = await kashmirSrtService.getDashboard();
      if (resp) {
        setData((resp?.data && (resp.data.srt || resp.data.districtwise) ? resp.data : resp) as KashmirSrtDashboardData);
        setUpdatedAt(new Date());
      } else {
        setApiError('Unable to load Kashmir SRT dashboard data from server.');
      }
    } catch (err: any) {
      console.warn('Dashboard fetch error:', err);
      setApiError(err?.message || 'Failed to load Kashmir SRT installation dashboard.');
    } finally {
      setLoading(false);
      if (isRefresh) setTimeout(() => setIsRefreshing(false), 400);
    }
  }, []);

  useEffect(() => { loadDashboardData(); }, [loadDashboardData]);

  const rawApiSrt: any = (data as any)?.srt || {};
  const pickVal = (...keys: string[]) => {
    for (const k of keys) {
      if (rawApiSrt[k] !== undefined && rawApiSrt[k] !== null) return n(rawApiSrt[k]);
    }
    return 0;
  };

  const rawSrt: SrtSummary = useMemo(() => {
    return {
      site_count: pickVal('site_count', 'total_sites', 'total') || 1,
      material_dispatch: pickVal('material_dispatch'),
      material_pending: pickVal('material_pending'),
      complete: pickVal('complete', 'inst_complete', 'installed'),
      pending: pickVal('pending', 'inst_pending'),
      verify_pending: pickVal('verify_pending', 'inst_verify_pending'),
      verify_approved: pickVal('verify_approved', 'inst_verify_approved', 'approved'),
      verify_reject: pickVal('verify_reject', 'inst_verify_reject', 'rejected'),
      claim_applicable: pickVal('claim_applicable'),
      claim_raised: pickVal('claim_raised'),
      claim_approved: pickVal('claim_approved'),
      inst_pay80_done: pickVal('inst_pay80_done', 'pay80_done'),
      inst_pay80_pending: pickVal('inst_pay80_pending', 'pay80_pending'),
      inst_pay80_partially: pickVal('inst_pay80_partially', 'pay80_partial'),
      inst_pay20_done: pickVal('inst_pay20_done', 'pay20_done'),
      inst_pay20_pending: pickVal('inst_pay20_pending', 'pay20_pending'),
      inst_pay20_partially: pickVal('inst_pay20_partially', 'pay20_partial'),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const districtwise: DistrictRow[] = useMemo(
    () => (Array.isArray((data as any)?.districtwise) ? (data as any).districtwise : []),
    [data]
  );
  const monthly: Array<{ month_year: string; monthly_installations: number }> = useMemo(
    () => (Array.isArray((data as any)?.district_installation_month) ? (data as any).district_installation_month : []),
    [data]
  );

  const filtersActive = selectedDistrict !== 'All';

  const srt: SrtSummary = useMemo(() => {
    if (!filtersActive) return rawSrt;
    const d = districtwise.find((x) => x.district?.toLowerCase() === selectedDistrict.toLowerCase());
    if (!d) return rawSrt;
    return {
      ...rawSrt,
      site_count: n(d.site_count),
      material_dispatch: n(d.complete),
      material_pending: n(d.pending),
      complete: n(d.complete),
      pending: n(d.pending),
      verify_pending: n(d.verify_pending),
      verify_approved: n(d.verify_approved),
      verify_reject: n(d.verify_reject),
      claim_applicable: n(d.claim_applicable),
      claim_raised: n(d.claim_raised),
      claim_approved: n(d.claim_approved),
      inst_pay80_done: n(d.inst_pay80_done),
      inst_pay80_pending: n(d.inst_pay80_pending),
      inst_pay80_partially: n(d.inst_pay80_partially),
      inst_pay20_done: n(d.inst_pay20_done),
      inst_pay20_pending: n(d.inst_pay20_pending),
      inst_pay20_partially: n(d.inst_pay20_partially),
    };
  }, [rawSrt, districtwise, selectedDistrict, filtersActive]);

  const filteredDistrictRows = useMemo(
    () => (filtersActive ? districtwise.filter((d) => d.district?.toLowerCase() === selectedDistrict.toLowerCase()) : districtwise),
    [districtwise, selectedDistrict, filtersActive]
  );

  const districtTotals = useMemo(() => {
    return filteredDistrictRows.reduce(
      (acc, d) => ({
        site_count: acc.site_count + n(d.site_count),
        complete: acc.complete + n(d.complete),
        pending: acc.pending + n(d.pending),
        verify_approved: acc.verify_approved + n(d.verify_approved),
        verify_pending: acc.verify_pending + n(d.verify_pending),
        verify_reject: acc.verify_reject + n(d.verify_reject),
        claim_approved: acc.claim_approved + n(d.claim_approved),
        claim_raised: acc.claim_raised + n(d.claim_raised),
        inst_pay80_done: acc.inst_pay80_done + n(d.inst_pay80_done),
        inst_pay20_done: acc.inst_pay20_done + n(d.inst_pay20_done),
      }),
      {
        site_count: 0,
        complete: 0,
        pending: 0,
        verify_approved: 0,
        verify_pending: 0,
        verify_reject: 0,
        claim_approved: 0,
        claim_raised: 0,
        inst_pay80_done: 0,
        inst_pay20_done: 0,
      }
    );
  }, [filteredDistrictRows]);

  const deferredQuery = useDeferredValue(qDistrict);
  const tableDistricts = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return filteredDistrictRows.filter((d) => !q || (d.district || '').toLowerCase().includes(q));
  }, [filteredDistrictRows, deferredQuery]);

  const pD = usePagination({ data: tableDistricts, initialPageSize: 15 });

  useEffect(() => {
    pD.setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qDistrict, selectedDistrict]);

  const dash = (v: number) => (loading && !data ? '…' : num(v));
  const materialPct = pctOf(srt.material_dispatch, srt.site_count);
  const instPct = pctOf(srt.complete, srt.site_count);
  const approvedPct = pctOf(srt.verify_approved, srt.site_count);
  const monthTotal = monthly.reduce((a, m) => a + n(m.monthly_installations), 0);
  const todayLabel = fmtDate(new Date());
  const claimPending = Math.max(0, srt.claim_raised - srt.claim_approved);

  const spk = (pickFn: (d: DistrictRow) => number) => {
    const arr = districtwise.slice(0, 10).map(pickFn);
    return arr.length > 1 ? arr : undefined;
  };

  const chartDistricts = useMemo(
    () => [...filteredDistrictRows].sort((a, b) => n(b.site_count) - n(a.site_count)).slice(0, 15),
    [filteredDistrictRows]
  );
  const districtChartH = Math.min(560, Math.max(isMobile ? 280 : 320, chartDistricts.length * (isMobile ? 38 : 44)));

  const [hiddenDistrictColumns, setHiddenDistrictColumns] = useState<string[]>([]);

  const districtCols: ExportColumn<DistrictRow>[] = useMemo(
    () => [
      { header: 'District', accessor: (r) => r.district || '' },
      { header: 'Total Sites', accessor: (r) => n(r.site_count) },
      { header: 'Installation Complete', accessor: (r) => n(r.complete) },
      { header: 'Installation Pending', accessor: (r) => n(r.pending) },
      { header: 'Approved', accessor: (r) => n(r.verify_approved) },
      { header: 'Verify Pending', accessor: (r) => n(r.verify_pending) },
      { header: 'Verify Rejected', accessor: (r) => n(r.verify_reject) },
      { header: 'Claim Approved', accessor: (r) => n(r.claim_approved) },
      { header: 'Claim Raised', accessor: (r) => n(r.claim_raised) },
      { header: '80% Paid', accessor: (r) => n(r.inst_pay80_done) },
      { header: '20% Paid', accessor: (r) => n(r.inst_pay20_done) },
      { header: 'Completion %', accessor: (r) => `${pctOf(n(r.complete), n(r.site_count))}%` },
    ],
    []
  );

  const stamp = new Date().toISOString().slice(0, 10);

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
      columns.map((column) => column.header),
      ...dataToExport.map((row) => columns.map((column) => escapeExportValue(getExportValue(row, column)))),
    ];
    const csv = rows.map((row) => row.map((value) => `"${value.replace(/"/g, '""')}"`).join(',')).join('\r\n');
    downloadTextFile(`\ufeff${csv}`, `${filename}.csv`, 'text/csv');
  };

  const copyToClipboard = async <T,>(dataToCopy: T[], columns: ExportColumn<T>[]) => {
    if (!dataToCopy.length || !columns.length) return;
    const textToCopy = [
      columns.map((column) => column.header).join('\t'),
      ...dataToCopy.map((row) => columns.map((column) => escapeExportValue(getExportValue(row, column))).join('\t')),
    ].join('\n');
    try {
      await navigator.clipboard.writeText(textToCopy);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = textToCopy;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
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
    const rows = dataToExport.map((row) => columns.map((column) => escapeHtml(escapeExportValue(getExportValue(row, column)))));
    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    if (!printWindow) return;
    printWindow.document.write(`<!doctype html><html><head><meta charset="UTF-8" /><title>${escapeHtml(title)}</title><style>
      *{box-sizing:border-box}body{font-family:Arial,sans-serif;padding:24px;color:#222}h1{font-size:20px;margin:0 0 16px}
      table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #d8dee6;padding:7px 8px;text-align:left;vertical-align:top}
      th{background:#f3f5f7;font-weight:700}@media print{body{padding:0}@page{size:landscape;margin:12mm}}
    </style></head><body><h1>${escapeHtml(title)}</h1><table><thead><tr>${columns.map((c) => `<th>${escapeHtml(escapeExportValue(c.header))}</th>`).join('')}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((v) => `<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table><script>window.onload=function(){window.print();};</script></body></html>`);
    printWindow.document.close();
    printWindow.focus();
  };

  const makeToolbarColumns = <T,>(columns: ExportColumn<T>[], hidden: string[]) =>
    columns.map((column, index) => ({
      key: `${column.header}-${index}`,
      label: column.header,
      visible: !hidden.includes(`${column.header}-${index}`),
    }));

  const visibleColumns = <T,>(columns: ExportColumn<T>[], hidden: string[]) =>
    columns.filter((column, index) => !hidden.includes(`${column.header}-${index}`));

  const districtToolbarColumns = makeToolbarColumns(districtCols, hiddenDistrictColumns);
  const toggleIn = (setter: React.Dispatch<React.SetStateAction<string[]>>) => (key: string) =>
    setter((prev) => (prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]));

  /* ───────── Donut items (clickable) ───────── */
  const donutItems = [
    { label: 'Approved', sub: `${approvedPct}% of total`, v: srt.verify_approved, color: LIGHT_GREEN, key: 'verify-approved' },
    { label: 'Verify Pending', sub: 'Awaiting verification', v: srt.verify_pending, color: LIGHT_BLUE, key: 'verify-pending' },
    { label: 'Rejected', sub: 'Correction needed', v: srt.verify_reject, color: LIGHT_RED, key: 'verify-reject' },
    { label: 'Install Pending', sub: 'In progress', v: srt.pending, color: LIGHT_AMBER, key: 'inst-pending' },
  ];

  const milestones = [
    { label: '1. Allocated Sites', v: srt.site_count, of: srt.site_count, color: 'var(--ax-viz-cyan)', key: 'total' },
    { label: '2. Material Dispatched', v: srt.material_dispatch, of: srt.site_count, color: 'var(--ax-accent)', key: 'material-dispatch' },
    { label: '3. Installation Complete', v: srt.complete, of: srt.site_count, color: 'var(--ax-viz-emerald)', key: 'inst-complete' },
    { label: '4. Installation Approved', v: srt.verify_approved, of: srt.site_count, color: 'var(--ax-viz-emerald)', key: 'verify-approved' },
    { label: '5. Claim Raised', v: srt.claim_raised, of: srt.site_count, color: 'var(--ax-viz-amber)', key: 'claim-raised' },
    { label: '6. Claim Approved', v: srt.claim_approved, of: srt.site_count, color: 'var(--ax-viz-emerald)', key: 'claim-approved' },
  ];

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      <PageHead
        title="Kashmir SRT 70MW Installation Dashboard"
        subtitle={
          <span style={{ display: 'inline-block', fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>
            Kashmir State Operations · SRT installation tracking — last updated {updatedAt ? fmtTime(updatedAt) : '—'}
          </span>
        }
        breadcrumbs={[{ label: 'Home', href: '/v-dashboard' }, { label: 'Kashmir' }, { label: 'Installation' }, { label: 'SRT 70MW' }, { label: 'Dashboard' }]}
        actions={
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill" style={{ fontWeight: 600, paddingInline: 'var(--ax-space-3)' }}>
              <span className="ax-badge__dot" /> Project: SRT 70MW
            </span>
            <button type="button" className="ax-btn ax-btn--ghost ax-btn--icon" aria-label="Refresh dashboard" onClick={() => loadDashboardData(true)} disabled={isRefreshing}>
              <span className={isRefreshing ? 'ax-spinner' : ''}>{ICON_REFRESH}</span>
            </button>
            <Link to="/v/kashmir/srt/70mw-installation-view-dashboard/total" className="ax-btn ax-btn--secondary ax-btn--sm">
              Status Register
            </Link>
            <Link to="/v/kashmir/srt/70mw/view-install-sites" className="ax-btn ax-btn--primary ax-btn--sm">
              <span className="ax-btn__label">View Installations</span>
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

        {/* Filter bar */}
        <section
          className="ax-card ax-card--flat ax-col--12"
          role="region"
          aria-label="SRT Dashboard Filters"
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
                <label htmlFor="district-select" style={labelStyle}>District:</label>
                <select id="district-select" className="ax-input ax-input--sm" style={selectStyle} value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)}>
                  <option value="All">All Districts ({districtwise.length})</option>
                  {districtwise.map((d) => <option key={d.district} value={d.district}>{d.district}</option>)}
                </select>
              </div>

              {filtersActive && (
                <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" style={{ height: 28, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }} onClick={() => setSelectedDistrict('All')}>
                  Reset Filters
                </button>
              )}
            </div>

            <div className="ax-cluster ula-filter-scope" style={{ gap: 'var(--ax-space-2)', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>
                Showing <b style={{ color: 'var(--ax-text-strong)' }}>{dash(srt.site_count)}</b> installations · Live: <b style={{ color: 'var(--ax-text-strong)' }}>{todayLabel}</b>
              </span>
            </div>
          </div>
        </section>

        {/* Welcome banner */}
        <section className="ax-card ax-welcome ax-col--12" role="region" aria-label="Kashmir SRT Installation Overview">
          <div className="ax-welcome__body">
            <div className="ax-welcome__text">
              <p className="ax-welcome__eyebrow">SRT 70MW Installation Management System · Kashmir Project Hub</p>
              <h2 className="ax-card__title">Welcome to Kashmir SRT Installation Dashboard</h2>
              <p className="ax-welcome__lede">
                Kashmir SRT 70MW project overview: <b>{dash(srt.site_count)} installations</b> tracked across <b>{dash(filtersActive ? 1 : districtwise.length)} districts</b>.
                <b> {dash(srt.complete)} ({instPct}%)</b> installations completed, with <b>{dash(srt.verify_approved)} ({approvedPct}%)</b> physically verified and approved.
              </p>
            </div>

            <dl className="ax-welcome__stats">
              <div className="ax-welcome__stat asw-interactive-kpi" role="button" tabIndex={0} onClick={() => navigateToStatus('total')} onKeyDown={onActivate(() => navigateToStatus('total'))} title="Click to view all sites">
                <dt>Total Installations</dt>
                <dd className="ax-num">{dash(srt.site_count)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-emerald)' }}>{dash(districtwise.length)} Districts ↗</small>
              </div>
              <div className="ax-welcome__stat asw-interactive-kpi" role="button" tabIndex={0} onClick={() => navigateToStatus('material-dispatch')} onKeyDown={onActivate(() => navigateToStatus('material-dispatch'))} title="Click to view dispatched sites">
                <dt>Material Dispatched</dt>
                <dd className="ax-num">{dash(srt.material_dispatch)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-accent)' }}>{materialPct}% Done ↗</small>
              </div>
              <div className="ax-welcome__stat asw-interactive-kpi" role="button" tabIndex={0} onClick={() => navigateToStatus('inst-complete')} onKeyDown={onActivate(() => navigateToStatus('inst-complete'))} title="Click to view completed sites">
                <dt>Installation Complete</dt>
                <dd className="ax-num">{dash(srt.complete)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-cyan)' }}>{instPct}% Done ↗</small>
              </div>
              <div className="ax-welcome__stat asw-interactive-kpi" role="button" tabIndex={0} onClick={() => navigateToStatus('verify-approved')} onKeyDown={onActivate(() => navigateToStatus('verify-approved'))} title="Click to view approved sites">
                <dt>Approved</dt>
                <dd className="ax-num">{dash(srt.verify_approved)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-emerald)' }}>{approvedPct}% Approved ↗</small>
              </div>
            </dl>
          </div>
        </section>

        {/* ───────── 8 KPI cards (2 rows × 4) — click card or any number ───────── */}
        <KpiCard
          icon={I_PIN}
          tone="accent"
          label="Total Allocated Sites"
          value={dash(srt.site_count)}
          unit="Sites"
          sub="Sanctioned SRT sites"
          badge={`${dash(filtersActive ? 1 : districtwise.length)} Districts`}
          spark={spk((d) => n(d.site_count))}
          onClick={() => navigateToStatus('total')}
        />

        <KpiCard
          icon={I_BOLT}
          tone="cyan"
          label="Material Dispatch Status"
          sub="Dispatched / Pending"
          badge={`${materialPct}%`}
          onClick={() => navigateToStatus('material-dispatch')}
          pills={[
            { label: 'Dispatched', count: dash(srt.material_dispatch), onClick: () => navigateToStatus('material-dispatch') },
            { label: 'Pending', count: dash(srt.material_pending), onClick: () => navigateToStatus('material-pending') },
          ]}
        />

        <KpiCard
          icon={I_DONE}
          tone="emerald"
          label="Installation Status"
          sub="Complete / Pending"
          badge={`${instPct}%`}
          spark={spk((d) => n(d.complete))}
          onClick={() => navigateToStatus('inst-complete')}
          pills={[
            { label: 'Complete', count: dash(srt.complete), onClick: () => navigateToStatus('inst-complete') },
            { label: 'Pending', count: dash(srt.pending), onClick: () => navigateToStatus('inst-pending') },
          ]}
        />

        <KpiCard
          icon={I_SHIELD}
          tone="violet"
          label="Verification Status"
          sub="Approved / Pending / Rejected"
          badge={`${approvedPct}%`}
          spark={spk((d) => n(d.verify_approved))}
          onClick={() => navigateToStatus('verify-approved')}
          pills={[
            { label: 'Approved', count: dash(srt.verify_approved), onClick: () => navigateToStatus('verify-approved') },
            { label: 'Verify Pending', count: dash(srt.verify_pending), onClick: () => navigateToStatus('verify-pending') },
            { label: 'Rejected', count: dash(srt.verify_reject), onClick: () => navigateToStatus('verify-reject') },
          ]}
        />

        <KpiCard
          icon={I_LIST}
          tone="amber"
          label="Claim Status"
          sub="Applicable / Raised"
          badge={srt.claim_raised > 0 ? `${num(srt.claim_raised)} Raised` : undefined}
          spark={spk((d) => n(d.claim_raised))}
          onClick={() => navigateToStatus('claim-raised')}
          pills={[
            { label: 'Applicable', count: dash(srt.claim_applicable), onClick: () => navigateToStatus('claim-applicable') },
            { label: 'Raised', count: dash(srt.claim_raised), onClick: () => navigateToStatus('claim-raised') },
          ]}
        />

        <KpiCard
          icon={I_DONE}
          tone="emerald"
          label="Claim Approval"
          sub="Approved / Pending"
          badge={srt.claim_approved > 0 ? 'Approved' : undefined}
          spark={spk((d) => n(d.claim_approved))}
          onClick={() => navigateToStatus('claim-approved')}
          pills={[
            { label: 'Approved', count: dash(srt.claim_approved), onClick: () => navigateToStatus('claim-approved') },
            { label: 'Pending', count: dash(claimPending), onClick: () => navigateToStatus('claim-raised') },
          ]}
        />

        <KpiCard
          icon={I_COIN}
          tone="cyan"
          label="Payment 80% Status"
          sub="Paid / Pending"
          badge={srt.inst_pay80_done > 0 ? 'Disbursed' : undefined}
          spark={spk((d) => n(d.inst_pay80_done))}
          onClick={() => navigateToStatus('inst-pay80-done')}
          pills={[
            { label: 'Paid', count: dash(srt.inst_pay80_done), onClick: () => navigateToStatus('inst-pay80-done') },
            { label: 'Pending', count: dash(srt.inst_pay80_pending), onClick: () => navigateToStatus('inst-pay80-pending') },
          ]}
        />

        <KpiCard
          icon={I_COIN}
          tone="amber"
          label="Payment 20% Status"
          sub="Paid / Pending"
          badge={srt.inst_pay20_done > 0 ? 'Disbursed' : undefined}
          spark={spk((d) => n(d.inst_pay20_done))}
          onClick={() => navigateToStatus('inst-pay20-done')}
          pills={[
            { label: 'Paid', count: dash(srt.inst_pay20_done), onClick: () => navigateToStatus('inst-pay20-done') },
            { label: 'Pending', count: dash(srt.inst_pay20_pending), onClick: () => navigateToStatus('inst-pay20-pending') },
          ]}
        />

        {/* Monthly trend (8) */}
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
              <TableEmptyState title="No installation trend yet" message="The monthly trend appears once installations are completed." />
            )}
          </div>
        </section>

        {/* Status donut (4) — click slice or row */}
        <section className="ax-card ax-col--4" role="region" aria-label="Installation status split">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Execution Distribution</span>
              <h2 className="ax-card__title">Installation Status</h2>
              <p className="ax-card__subtitle">Total {dash(srt.site_count)} sites</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <Suspense fallback={<div className="ax-skeleton" style={{ height: donutH }} />}>
              <ApexChart
                key={`donut-${donutH}-${donutItems.map((s) => s.v).join('-')}`}
                type="donut"
                height={donutH}
                legend="none"
                ariaLabel="Installation status split"
                series={donutItems.map((s) => s.v || 0)}
                apex={{
                  labels: donutItems.map((s) => s.label),
                  colors: donutItems.map((s) => s.color),
                  stroke: { width: 0 },
                  chart: {
                    events: {
                      dataPointSelection: (_event: unknown, _chart: unknown, opts: any) => {
                        const key = donutItems[opts?.dataPointIndex]?.key;
                        if (key) navigateToStatus(key);
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
                          total: { show: true, label: 'Sites', formatter: () => num(srt.site_count) },
                        },
                      },
                    },
                  },
                }}
              />
            </Suspense>
            <ul className="ax-list ax-list--compact" style={{ marginTop: 'var(--ax-space-3)' }}>
              {donutItems.map((s) => (
                <li
                  key={s.label}
                  className="ax-list__row"
                  role="button"
                  tabIndex={0}
                  style={{ border: 0, paddingInline: 0, cursor: 'pointer' }}
                  onClick={() => navigateToStatus(s.key)}
                  onKeyDown={onActivate(() => navigateToStatus(s.key))}
                >
                  <span className="ax-list__leading"><i style={{ width: 9, height: 9, borderRadius: 3, background: s.color, display: 'inline-block' }} /></span>
                  <span className="ax-list__content">
                    <span className="ax-list__title" style={{ fontWeight: 'var(--ax-weight-medium)' }}>{s.label}</span>
                    <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>{s.sub}</span>
                  </span>
                  <span className="ax-list__trailing ax-num" style={{ color: 'var(--ax-text-strong)', fontWeight: 600 }}>
                    {num(s.v)} ({pctOf(s.v, srt.site_count)}%)
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* District chart (8) — click bar to open that district */}
        <section className="ax-card ax-card--chart ax-col--8" role="region" aria-label="District wise installations">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Geographic Breakdown</span>
              <h2 className="ax-card__title">District-wise Installation Statistics</h2>
              <p className="ax-card__subtitle">Installations by progress across Kashmir districts</p>
            </div>
            <div className="ax-card__actions">
              <span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--pill">{dash(districtwise.length)} Districts</span>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            {chartDistricts.length > 0 ? (
              <Suspense fallback={<div className="ax-skeleton" style={{ height: districtChartH }} />}>
                <ApexChart
                  key={`bar-${districtChartH}-${chartDistricts.length}-${srt.site_count}`}
                  type="bar"
                  height={districtChartH}
                  legend="top"
                  stacked
                  ariaLabel="Horizontal stacked bar of installations per district by progress"
                  series={[
                    { name: 'Complete', data: chartDistricts.map((d) => n(d.complete)) },
                    { name: 'Dispatched', data: chartDistricts.map((d) => Math.max(0, n(d.site_count) - n(d.complete))) },
                    { name: 'Pending', data: chartDistricts.map((d) => n(d.pending)) },
                  ]}
                  apex={{
                    colors: [LIGHT_GREEN, LIGHT_AMBER, LIGHT_BLUE],
                    plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: '58%' } },
                    xaxis: { categories: chartDistricts.map((d) => d.district), labels: { style: { fontSize: '11px' } } },
                    yaxis: { labels: { maxWidth: isMobile ? 90 : 160, style: { fontSize: '11px' } } },
                    chart: {
                      events: {
                        dataPointSelection: (_event: unknown, _chart: unknown, opts: any) => {
                          const dist = chartDistricts[opts?.dataPointIndex]?.district;
                          if (dist) navigateToStatus('inst-complete', dist);
                        },
                      },
                    },
                  }}
                />
              </Suspense>
            ) : (
              <TableEmptyState title="No district records" message="District progress appears once sites are allocated." />
            )}
          </div>
        </section>

        {/* Milestones (4) — clickable */}
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
                  role="button"
                  tabIndex={0}
                  className="asw-interactive-kpi"
                  onClick={() => navigateToStatus(m.key)}
                  onKeyDown={onActivate(() => navigateToStatus(m.key))}
                  style={{ padding: '6px 8px', borderRadius: 'var(--ax-radius-sm, 6px)' }}
                  title={`Drill down to ${m.label}`}
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

        {/* District table (12) */}
        <section className="ax-card ax-col--12" role="region" aria-label="District wise data">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Enterprise Data Analytics</span>
              <h2 className="ax-card__title">District Wise Installation Breakdown</h2>
              <p className="ax-card__subtitle">Progress across material dispatch, installation, verification, and payment status</p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                <SearchInput value={qDistrict} onChange={setQDistrict} placeholder="Search district..." size="sm" />
                <TableExportToolbar
                  onCopy={() => copyToClipboard(tableDistricts, visibleColumns(districtCols, hiddenDistrictColumns))}
                  onExportCSV={() => exportToCSV(tableDistricts, visibleColumns(districtCols, hiddenDistrictColumns), `Kashmir_SRT_District_Wise_${stamp}`)}
                  onExportExcel={() => exportToExcel(tableDistricts, visibleColumns(districtCols, hiddenDistrictColumns), `Kashmir_SRT_District_Wise_${stamp}`)}
                  onExportPDF={() => exportToPDF(tableDistricts, visibleColumns(districtCols, hiddenDistrictColumns), 'Kashmir SRT District Wise Installation Breakdown')}
                  columns={districtToolbarColumns}
                  onToggleColumn={toggleIn(setHiddenDistrictColumns)}
                />
              </div>
            </div>
          </div>
          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover ula-table--md">
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">District</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Allocated</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Complete / Pend</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Verification (App / Pend / Rej)</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Claims (Appr / Raised)</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">80% Paid / 20% Paid</th>
                  <th className="ax-table__th" scope="col">Progress</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading && !data ? (
                  <tr><td className="ax-table__td" colSpan={8} style={emptyCellStyle}><span className="ax-spinner" /> Loading district records…</td></tr>
                ) : pD.paginatedData.length === 0 ? (
                  <tr><td className="ax-table__td" colSpan={8} style={emptyCellStyle}>No districts match the filters.</td></tr>
                ) : (
                  pD.paginatedData.map((d) => {
                    const total = n(d.site_count);
                    const completed = n(d.complete);
                    const rowPct = pctOf(completed, total);
                    const isSelected = selectedDistrict.toLowerCase() === d.district.toLowerCase();
                    const go = (key: string) => (e: React.MouseEvent) => { e.stopPropagation(); navigateToStatus(key, d.district); };

                    return (
                      <tr
                        key={d.district}
                        className="ax-table__row"
                        role="button"
                        tabIndex={0}
                        onClick={() => navigateToStatus('total', d.district)}
                        onKeyDown={onActivate(() => navigateToStatus('total', d.district))}
                        style={{ cursor: 'pointer', background: isSelected ? 'rgba(var(--ax-accent-rgb), 0.05)' : undefined }}
                      >
                        <td className="ax-table__td">
                          <div className="ax-cluster" style={{ gap: '6px', alignItems: 'center' }}>
                            <span style={{ fontWeight: 'var(--ax-weight-semibold)', color: 'var(--ax-text-strong)' }}>{d.district}</span>
                            {isSelected && (
                              <span className="ax-badge ax-badge--soft ax-badge--accent ax-badge--pill" style={{ fontSize: '10px', padding: '1px 6px' }}>Active</span>
                            )}
                          </div>
                        </td>
                        <td className="ax-table__td ax-table__td--num ax-num click-cell" style={{ fontWeight: 600 }} onClick={go('total')} title={`View all sites in ${d.district}`}>{num(total)}</td>
                        <td className="ax-table__td ax-table__td--num">
                          <div className="ax-cluster" style={{ justifyContent: 'flex-end', gap: '4px' }}>
                            <span className="ax-badge ax-badge--soft ax-badge--success click-cell" style={{ fontWeight: 600, padding: '2px 7px' }} onClick={go('inst-complete')} title={`View complete installations in ${d.district}`}>{num(d.complete)}</span>
                            <span style={{ color: 'var(--ax-text-muted)', fontSize: '11px' }}>/</span>
                            <span className="ax-badge ax-badge--soft ax-badge--neutral click-cell" style={{ fontWeight: 600, padding: '2px 7px' }} onClick={go('inst-pending')} title={`View pending installations in ${d.district}`}>{num(d.pending)}</span>
                          </div>
                        </td>
                        <td className="ax-table__td ax-table__td--num">
                          <div className="ax-cluster" style={{ justifyContent: 'flex-end', gap: '4px' }}>
                            <span className="ax-badge ax-badge--soft ax-badge--success click-cell" style={{ padding: '2px 6px', fontSize: '11px' }} onClick={go('verify-approved')} title={`View verified approved in ${d.district}`}>
                              <span className="ax-badge__dot" />{num(d.verify_approved)}
                            </span>
                            <span className="ax-badge ax-badge--soft ax-badge--warning click-cell" style={{ padding: '2px 6px', fontSize: '11px' }} onClick={go('verify-pending')} title={`View verify pending in ${d.district}`}>
                              {num(d.verify_pending)}
                            </span>
                            <span className="ax-badge ax-badge--soft ax-badge--danger click-cell" style={{ padding: '2px 6px', fontSize: '11px' }} onClick={go('verify-reject')} title={`View rejected in ${d.district}`}>
                              {num(d.verify_reject)}
                            </span>
                          </div>
                        </td>
                        <td className="ax-table__td ax-table__td--num">
                          <span className="click-cell" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }} onClick={go('claim-approved')} title="View approved claims">{num(d.claim_approved)}</span>
                          <span style={{ color: 'var(--ax-text-muted)' }}> / </span>
                          <span className="click-cell" style={{ color: 'var(--ax-text-muted)' }} onClick={go('claim-raised')} title="View raised claims">{num(d.claim_raised)}</span>
                        </td>
                        <td className="ax-table__td ax-table__td--num">
                          <span className="click-cell" style={{ fontWeight: 600, color: 'var(--ax-text-strong)', marginRight: '4px' }} onClick={go('inst-pay80-done')} title="View 80% paid">{num(d.inst_pay80_done)}</span>
                          <span style={{ color: 'var(--ax-text-muted)' }}>/</span>
                          <span className="click-cell" style={{ fontWeight: 600, color: 'var(--ax-text-strong)', marginLeft: '4px' }} onClick={go('inst-pay20-done')} title="View 20% paid">{num(d.inst_pay20_done)}</span>
                        </td>
                        <td className="ax-table__td">
                          <Bar pct={rowPct} />
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
                            <button
                              type="button"
                              className="ax-btn ax-btn--secondary ax-btn--xs"
                              style={{ height: 26, padding: '0 8px', fontSize: '11px', gap: '4px' }}
                              onClick={go('total')}
                              title={`View status breakdown in ${d.district}`}
                            >
                              Status ↗
                            </button>
                            <Link
                              to={`/v/kashmir/srt/70mw/view-install-sites?district=${encodeURIComponent(d.district)}`}
                              className="ax-btn ax-btn--ghost ax-btn--xs"
                              style={{ height: 26, padding: '0 6px', fontSize: '11px' }}
                              title={`Inspect installed details in ${d.district}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              Details
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
                {tableDistricts.length > 0 && (
                  <tr className="ax-table__row" style={{ background: 'var(--ax-surface-subtle)', fontWeight: 'var(--ax-weight-bold)' }}>
                    <td className="ax-table__td" style={{ color: 'var(--ax-text-strong)', background: 'var(--ax-surface-subtle)' }}>Total ({filteredDistrictRows.length} Districts)</td>
                    <td className="ax-table__td ax-table__td--num ax-num click-cell" onClick={() => navigateToStatus('total')}>{num(districtTotals.site_count)}</td>
                    <td className="ax-table__td ax-table__td--num">
                      <div className="ax-cluster" style={{ justifyContent: 'flex-end', gap: '4px' }}>
                        <span className="ax-badge ax-badge--soft ax-badge--success click-cell" style={{ fontWeight: 700 }} onClick={() => navigateToStatus('inst-complete')}>{num(districtTotals.complete)}</span>
                        <span>/</span>
                        <span className="ax-badge ax-badge--soft ax-badge--neutral click-cell" style={{ fontWeight: 700 }} onClick={() => navigateToStatus('inst-pending')}>{num(districtTotals.pending)}</span>
                      </div>
                    </td>
                    <td className="ax-table__td ax-table__td--num">
                      <div className="ax-cluster" style={{ justifyContent: 'flex-end', gap: '4px' }}>
                        <span className="ax-badge ax-badge--soft ax-badge--success click-cell" onClick={() => navigateToStatus('verify-approved')}>{num(districtTotals.verify_approved)}</span>
                        <span className="ax-badge ax-badge--soft ax-badge--warning click-cell" onClick={() => navigateToStatus('verify-pending')}>{num(districtTotals.verify_pending)}</span>
                        <span className="ax-badge ax-badge--soft ax-badge--danger click-cell" onClick={() => navigateToStatus('verify-reject')}>{num(districtTotals.verify_reject)}</span>
                      </div>
                    </td>
                    <td className="ax-table__td ax-table__td--num">
                      <span className="click-cell" style={{ fontWeight: 700 }} onClick={() => navigateToStatus('claim-approved')}>{num(districtTotals.claim_approved)}</span>
                      <span> / </span>
                      <span className="click-cell" onClick={() => navigateToStatus('claim-raised')}>{num(districtTotals.claim_raised)}</span>
                    </td>
                    <td className="ax-table__td ax-table__td--num">
                      <span className="click-cell" style={{ fontWeight: 700 }} onClick={() => navigateToStatus('inst-pay80-done')}>{num(districtTotals.inst_pay80_done)}</span>
                      <span> / </span>
                      <span className="click-cell" onClick={() => navigateToStatus('inst-pay20-done')}>{num(districtTotals.inst_pay20_done)}</span>
                    </td>
                    <td className="ax-table__td">
                      <Bar pct={Math.round(pctOf(districtTotals.complete, districtTotals.site_count))} />
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
                setPage={pD.setPage}
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

export default Kashmir_Installation_SRT_Dashboard;