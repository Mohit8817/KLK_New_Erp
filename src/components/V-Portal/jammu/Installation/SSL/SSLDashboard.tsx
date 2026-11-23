import { lazy, Suspense, useCallback, useDeferredValue, useEffect, useMemo, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  jammuSslService,
  normalizeJammuSslStatus,
  type JammuSslDashboardData,
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
interface JammuSslSummary {
  site_count: number;
  complete: number;
  pending: number;
  verify_approved: number;
  verify_pending: number;
  verify_reject: number;
  claim_applicable: number;
  claim_raised: number;
  claim_approved: number;
  pay_done: number;
  pay_partial: number;
  pay_pending: number;
}

interface DistrictRow extends JammuSslSummary {
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
const toSummary = (o: any): JammuSslSummary => {
  const src = o?.ssl || o?.data?.ssl || o?.data || o || {};
  return {
    site_count: n(src?.site_count),
    complete: n(src?.complete ?? src?.inst_complete),
    pending: n(src?.pending ?? (src?.site_count ? Math.max(0, n(src.site_count) - n(src?.complete ?? src?.inst_complete)) : 0)),
    verify_approved: n(src?.verify_approved),
    verify_pending: n(src?.verify_pending),
    verify_reject: n(src?.verify_reject),
    claim_applicable: n(src?.claim_applicable),
    claim_raised: n(src?.claim_raised),
    claim_approved: n(src?.claim_approved),
    pay_done: n(src?.pay_done),
    pay_partial: n(src?.pay_partial ?? src?.pay_partially),
    pay_pending: n(src?.pay_pending),
  };
};

/* ───────── Layout CSS (SRT 70MW match) ───────── */
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
    .solar-erp-page .ax-col--4 { grid-column: span 12; }
    .solar-erp-page .ax-col--3 { grid-column: span 6; }
    .solar-erp-page .ax-export-toolbar__button { font-size: 0; gap: 0; padding: 0 8px !important; justify-content: center; }
    .solar-erp-page .ax-export-toolbar__button svg { width: 16px; height: 16px; flex-shrink: 0; }
    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] { max-width: 180px; }
  }

  @media (max-width: 760px) {
    .solar-erp-page { width: 100%; max-width: 100%; overflow-x: hidden; box-sizing: border-box; }
    .solar-erp-page .ax-welcome__stats {
      display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px;
    }
    .solar-erp-page .ula-filter-item { width: 100%; justify-content: space-between; }
    .solar-erp-page .ula-filter-item select { flex: 1; width: auto; max-width: 100%; }
    .solar-erp-page .ax-card__header { flex-direction: column; flex-wrap: nowrap; align-items: stretch; gap: 10px; }
    .solar-erp-page .ax-card__titles { flex: 0 0 auto; min-width: 0; width: 100%; max-width: 100%; }
    .solar-erp-page .ax-card__actions { flex: 0 0 auto; width: 100%; margin-left: 0; flex-wrap: wrap; justify-content: flex-start; }
    .solar-erp-page .ax-card__actions .ax-cluster { flex-wrap: wrap !important; width: 100%; justify-content: flex-start; gap: 8px; }
    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] { flex: 1 1 100%; width: 100%; max-width: 100%; min-width: 0; }
    .solar-erp-page .ax-card__actions .ax-export-toolbar,
    .solar-erp-page .ax-card__actions [class*="export-toolbar"] { flex: 1 1 100%; flex-wrap: wrap; justify-content: flex-start; gap: 6px; }
    .solar-erp-page .ax-export-toolbar__button { font-size: 12px; gap: 4px; height: 30px; padding: 0 8px !important; }
  }

  @media (max-width: 480px) {
    .solar-erp-page .ax-col--3 { grid-column: span 12; }
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
const svg = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const I_BOLT = svg(<path d="M13 3l0 7l6 0l-8 11l0 -7l-6 0l8 -11" />);
const I_DONE = svg(<><path d="M7 12l5 5l10 -10" /><path d="M2 12l5 5m5 -5l5 -5" /></>);
const I_COIN = svg(<><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M14.8 9a2 2 0 0 0 -1.8 -1h-2a2 2 0 1 0 0 4h2a2 2 0 1 1 0 4h-2a2 2 0 0 1 -1.8 -1" /><path d="M12 7v10" /></>);
const I_LIST = svg(<><path d="M9 6l11 0" /><path d="M9 12l11 0" /><path d="M9 18l11 0" /><path d="M5 6l0 .01" /><path d="M5 12l0 .01" /><path d="M5 18l0 .01" /></>);
const I_EYE = svg(<><circle cx="12" cy="12" r="2" /><path d="M22 12c-2.667 4.667 -6 7 -10 7s-7.333 -2.333 -10 -7c2.667 -4.667 6 -7 10 -7s7.333 2.333 10 7" /></>);

/* ───────── KPI Card ───────── */
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
              {ARROW_UP} {badge}
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
                        title={seg.onClick ? `View ${seg.label} lights` : undefined}
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

export function SSLDashboard() {
  const navigate = useNavigate();
  const isMobile = useIsMobile(640);
  const [data, setData] = useState<JammuSslDashboardData | null>(null);
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
      const resp = await jammuSslService.getInstallationDashboard();
      if (resp) {
        setData(resp);
        setUpdatedAt(new Date());
      } else {
        setApiError('Unable to load Jammu SSL dashboard data.');
      }
    } catch (err: any) {
      console.warn('[Jammu SSL Dashboard] load error:', err);
      setApiError(err?.message || 'Failed to load Jammu SSL installation dashboard.');
    } finally {
      setLoading(false);
      if (isRefresh) setTimeout(() => setIsRefreshing(false), 400);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  /* ───────── Data resolution ───────── */
  const rawSummary: JammuSslSummary = useMemo(() => toSummary(data), [data]);

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

  const s: JammuSslSummary = useMemo(() => {
    if (!filtersActive) return rawSummary;
    const d = districtwise.find((x) => x.district.toLowerCase() === selectedDistrict.toLowerCase());
    return d ? toSummary(d) : rawSummary;
  }, [rawSummary, districtwise, selectedDistrict, filtersActive]);

  const filteredDistrictRows = useMemo(
    () => (filtersActive ? districtwise.filter((d) => d.district.toLowerCase() === selectedDistrict.toLowerCase()) : districtwise),
    [districtwise, selectedDistrict, filtersActive]
  );

  const districtTotals = useMemo(() => {
    const keys = Object.keys(toSummary({})) as Array<keyof JammuSslSummary>;
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
  }, [qDistrict, selectedDistrict]);

  /* ───────── Derived ───────── */
  const dash = (v: number) => (loading && !data ? '…' : num(v));
  const instPct = pctOf(s.complete, s.site_count);
  const approvedPct = pctOf(s.verify_approved, s.site_count);
  const monthTotal = monthly.reduce((a, m) => a + n(m.monthly_installations), 0);
  const todayLabel = fmtDate(new Date());

  const goStatus = (st: string, district?: string) => {
    const norm = normalizeJammuSslStatus(st);
    const targetDistrict = district || (filtersActive ? selectedDistrict : '');
    const distParam = targetDistrict && targetDistrict !== 'All' ? `&district=${encodeURIComponent(targetDistrict)}` : '';
    navigate(`/v/jammu/installation/ssl/status-view?status=${encodeURIComponent(norm)}${distParam}`);
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

  /* ───────── Export Columns ───────── */
  const districtCols: ExportColumn<DistrictRow>[] = useMemo(
    () => [
      { header: 'District', accessor: (r) => r.district || '' },
      { header: 'Total Lights', accessor: (r) => n(r.site_count) },
      { header: 'Install Done', accessor: (r) => n(r.complete) },
      { header: 'Install Pending', accessor: (r) => n(r.pending) },
      { header: 'Approved', accessor: (r) => n(r.verify_approved) },
      { header: 'Verify Pending', accessor: (r) => n(r.verify_pending) },
      { header: 'Verify Rejected', accessor: (r) => n(r.verify_reject) },
      { header: 'Claim Applicable', accessor: (r) => n(r.claim_applicable) },
      { header: 'Claim Raised', accessor: (r) => n(r.claim_raised) },
      { header: 'Payment Done', accessor: (r) => n(r.pay_done) },
      { header: 'Payment Pending', accessor: (r) => n(r.pay_pending) },
      { header: 'Completion %', accessor: (r) => `${pctOf(n(r.complete), n(r.site_count))}%` },
    ],
    []
  );

  const stamp = new Date().toISOString().slice(0, 10);
  const pageTitle = 'Jammu SSL District Wise Installation Breakdown';

  /* ───────── Chart data ───────── */
  const statusSeries = [s.verify_approved, s.verify_pending, s.verify_reject, s.pending];
  const statusLabels = ['Approved', 'Verify Pending', 'Rejected', 'Install Pending'];

  const milestones = [
    { label: '1. Allocated Street Lights', v: s.site_count, of: s.site_count, color: 'var(--ax-viz-cyan, #06b6d4)', key: 'total' },
    { label: '2. Installation Done', v: s.complete, of: s.site_count, color: 'var(--ax-accent, #2563eb)', key: 'completed' },
    { label: '3. Installation Approved', v: s.verify_approved, of: s.site_count, color: 'var(--ax-viz-emerald, #10b981)', key: 'verify-approved' },
    { label: '4. Claim Applicable', v: s.claim_applicable, of: s.complete, color: 'var(--ax-viz-violet, #8b5cf6)', key: 'claim-applicable' },
    { label: '5. Claim Raised', v: s.claim_raised, of: s.claim_applicable, color: 'var(--ax-viz-pink, #ec4899)', key: 'claim-raised' },
    { label: '6. Payment Settled', v: s.pay_done, of: s.complete, color: 'var(--ax-viz-emerald, #10b981)', key: 'pay-done' },
  ];

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      {/* 1. Page Header */}
      <PageHead
        title="Jammu SSL Installation Dashboard"
        subtitle={
          <span style={{ display: 'inline-block', fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>
            Jammu &amp; Kashmir Operations · Solar Street Light (SSL) installation tracking — last updated {updatedAt ? `${fmtDate(updatedAt)} ${fmtTime(updatedAt)}` : '—'}
          </span>
        }
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Jammu & Kashmir' },
          { label: 'Installation' },
          { label: 'SSL' },
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
            <Link to="/v/jammu/installation/ssl/status-view?status=total" className="ax-btn ax-btn--secondary ax-btn--sm">
              View Status Register
            </Link>
            <button
              type="button"
              className="ax-btn ax-btn--primary ax-btn--sm"
              onClick={() => navigate('/v/jammu/installation/ssl/install-lights')}
            >
              <span className="ax-btn__label">+ Install Light</span>
            </button>
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
          aria-label="Jammu SSL Dashboard Filters"
          style={{ padding: '8px 16px', borderRadius: 'var(--ax-radius-lg)', border: '1px solid var(--ax-border, #e2e8f0)', background: 'var(--ax-bg-surface, #ffffff)' }}
        >
          <div className="ax-cluster" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--ax-space-3)', alignItems: 'center' }}>
            <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
              <span
                className="ax-cluster"
                style={{
                  gap: '6px',
                  color: 'var(--ax-text-strong)',
                  fontSize: 'var(--ax-text-xs)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  padding: '4px 10px',
                  background: 'rgba(var(--asw-primary-rgb), 0.08)',
                  borderRadius: 'var(--ax-radius-pill)',
                  border: '1px solid rgba(var(--asw-primary-rgb), 0.18)',
                }}
              >
                {ICON_FILTER} Filter Operations
              </span>

              <div className="ax-cluster ula-filter-item" style={{ alignItems: 'center' }}>
                <label htmlFor="jammu-ssl-district-select" style={labelStyle}>District:</label>
                <select
                  id="jammu-ssl-district-select"
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
              <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
                Showing <b style={{ color: 'var(--ax-text-strong)' }}>{dash(s.site_count)}</b> lights · Live: <b style={{ color: 'var(--ax-text-strong)' }}>{todayLabel}</b>
              </span>
            </div>
          </div>
        </section>

        {/* 3. Welcome Banner with Interactive Clickable Tiles */}
        <section className="ax-card ax-welcome ax-col--12" role="region" aria-label="Jammu SSL Installation Overview">
          <div className="ax-welcome__body">
            <div className="ax-welcome__text">
              <p className="ax-welcome__eyebrow">SSL Installation Management System · State Hub</p>
              <h2 className="ax-card__title">Welcome to Jammu SSL Installation Dashboard</h2>
              <p className="ax-welcome__lede">
                Jammu &amp; Kashmir state installation overview: <b>{dash(s.site_count)} street lights</b> tracked across <b>{dash(filtersActive ? 1 : districtwise.length)} districts</b>.
                <b> {dash(s.complete)} ({instPct}%)</b> installations completed, with <b>{dash(s.verify_approved)} ({approvedPct}%)</b> verified and approved.
              </p>
            </div>

            <dl className="ax-welcome__stats">
              <div
                className="ax-welcome__stat asw-interactive-kpi"
                role="button"
                tabIndex={0}
                onClick={() => goStatus('total')}
                onKeyDown={onActivate(() => goStatus('total'))}
                title="View All Street Lights"
              >
                <dt>Total Street Lights</dt>
                <dd className="ax-num">{dash(s.site_count)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-emerald)' }}>{dash(districtwise.length)} Districts ↗</small>
              </div>
              <div
                className="ax-welcome__stat asw-interactive-kpi"
                role="button"
                tabIndex={0}
                onClick={() => goStatus('completed')}
                onKeyDown={onActivate(() => goStatus('completed'))}
                title="View Installed Street Lights"
              >
                <dt>Installation Done</dt>
                <dd className="ax-num">{dash(s.complete)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-accent)' }}>{instPct}% Done ↗</small>
              </div>
              <div
                className="ax-welcome__stat asw-interactive-kpi"
                role="button"
                tabIndex={0}
                onClick={() => goStatus('verify-approved')}
                onKeyDown={onActivate(() => goStatus('verify-approved'))}
                title="View Approved Street Lights"
              >
                <dt>Approved</dt>
                <dd className="ax-num">{dash(s.verify_approved)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-emerald)' }}>{approvedPct}% Approved ↗</small>
              </div>
              <div
                className="ax-welcome__stat asw-interactive-kpi"
                role="button"
                tabIndex={0}
                onClick={() => goStatus('claim-applicable')}
                onKeyDown={onActivate(() => goStatus('claim-applicable'))}
                title="View Claim Eligible Street Lights"
              >
                <dt>Claim Applicable</dt>
                <dd className="ax-num">{dash(s.claim_applicable)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-cyan)' }}>{pctOf(s.claim_applicable, s.complete)}% Eligible ↗</small>
              </div>
            </dl>
          </div>
        </section>

        {/* 4. 8 KPI Cards with Clickable Segments (Pills) */}
        <KpiCard
          icon={I_BOLT}
          tone="accent"
          label="Total Street Lights"
          value={loading && !data ? '…' : num(s.site_count)}
          sub="Total allocated street light sites"
          badge={s.site_count ? `${instPct}% installed` : undefined}
          spark={spk((d) => n(d.site_count))}
          onClick={() => goStatus('total')}
        />

        <KpiCard
          icon={I_DONE}
          tone="emerald"
          label="Installation Status"
          value=""
          pills={[
            { label: 'Installed', count: loading && !data ? '…' : num(s.complete), onClick: () => goStatus('completed') },
            { label: 'Pending', count: loading && !data ? '…' : num(s.pending), onClick: () => goStatus('pending') },
          ]}
          sub="Installed / Pending"
          badge={`${instPct}% Done`}
          spark={spk((d) => n(d.complete))}
          onClick={() => goStatus('completed')}
        />

        <KpiCard
          icon={I_DONE}
          tone="amber"
          label="Verification Status"
          value=""
          pills={[
            { label: 'Approved', count: loading && !data ? '…' : num(s.verify_approved), onClick: () => goStatus('verify-approved') },
            { label: 'Pending', count: loading && !data ? '…' : num(s.verify_pending), onClick: () => goStatus('verify-pending') },
            { label: 'Rejected', count: loading && !data ? '…' : num(s.verify_reject), onClick: () => goStatus('verify-reject') },
          ]}
          sub="Approved / Pending / Rejected"
          badge={s.verify_approved > 0 ? `${approvedPct}% Approved` : undefined}
          spark={spk((d) => n(d.verify_approved))}
          onClick={() => goStatus('verify-approved')}
        />

        <KpiCard
          icon={I_EYE}
          tone="violet"
          label="Verification Pending"
          value={loading && !data ? '…' : num(s.verify_pending)}
          sub="Awaiting verification"
          badge={s.verify_pending > 0 ? `${num(s.verify_pending)} Lights` : undefined}
          spark={spk((d) => n(d.verify_pending))}
          onClick={() => goStatus('verify-pending')}
        />

        <KpiCard
          icon={I_EYE}
          tone="red"
          label="Verification Rejected"
          value={loading && !data ? '…' : num(s.verify_reject)}
          sub="Correction needed"
          badge={s.verify_reject > 0 ? `${num(s.verify_reject)} Rejected` : undefined}
          onClick={() => goStatus('verify-reject')}
        />

        <KpiCard
          icon={I_LIST}
          tone="pink"
          label="Claim Status"
          value=""
          pills={[
            { label: 'Applicable', count: loading && !data ? '…' : num(s.claim_applicable), onClick: () => goStatus('claim-applicable') },
            { label: 'Raised', count: loading && !data ? '…' : num(s.claim_raised), onClick: () => goStatus('claim-raised') },
          ]}
          sub="Applicable / Raised"
          badge={s.claim_raised > 0 ? `${num(s.claim_raised)} Raised` : undefined}
          spark={spk((d) => n(d.claim_raised))}
          onClick={() => goStatus('claim-raised')}
        />

        <KpiCard
          icon={I_COIN}
          tone="emerald"
          label="Payment Done"
          value={loading && !data ? '…' : `${num(s.pay_done)} Lights`}
          sub="Disbursed & settled"
          badge={s.pay_done > 0 ? 'Disbursed' : undefined}
          onClick={() => goStatus('pay-done')}
        />

        <KpiCard
          icon={I_COIN}
          tone="amber"
          label="Payment Pending"
          value=""
          pills={[
            { label: 'Partial', count: loading && !data ? '…' : num(s.pay_partial), onClick: () => goStatus('pay-partially') },
            { label: 'Pending', count: loading && !data ? '…' : num(s.pay_pending), onClick: () => goStatus('pay-pending') },
          ]}
          sub="Partial / Pending Disbursement"
          badge={s.pay_pending > 0 ? 'Pending' : undefined}
          onClick={() => goStatus('pay-pending')}
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
              <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)' }}>
                <span className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}>
                  <i style={{ width: 10, height: 10, borderRadius: 2, background: LIGHT_GREEN }} />
                  <small style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-xs)' }}>Monthly Completed</small>
                </span>
              </div>
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
                  series={[{ name: 'Street Lights Installed', data: monthly.map((m) => n(m.monthly_installations)) }]}
                  apex={{
                    colors: [LIGHT_GREEN],
                    stroke: { curve: 'smooth', width: 2 },
                    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.05, stops: [0, 90, 100] } },
                    markers: { size: 4, strokeWidth: 0, hover: { size: 6 } },
                    dataLabels: { enabled: false },
                    xaxis: { categories: monthly.map((m) => fmtMonth(m.month_year)) },
                    yaxis: { min: 0, forceNiceScale: true, labels: { formatter: (v: number) => `${Math.round(v)}` }, title: { text: 'Lights', style: { color: 'var(--ax-text-muted)' } } },
                    tooltip: { y: { formatter: (v: number) => `${v} Lights` } },
                  }}
                />
              </Suspense>
            ) : (
              <TableEmptyState title="No installation trend yet" message="The monthly trend appears once installations are completed." />
            )}
          </div>
        </section>

        <section className="ax-card ax-col--4" role="region" aria-label="Installation status split">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Status Distribution</span>
              <h2 className="ax-card__title">Installation Status</h2>
              <p className="ax-card__subtitle">Total {dash(s.site_count)} lights · Click slice to filter</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <Suspense fallback={<div className="ax-skeleton" style={{ height: donutH }} />}>
              <ApexChart
                key={`donut-${donutH}-${statusSeries.join('-')}`}
                type="donut"
                height={donutH}
                legend="none"
                ariaLabel="Installation status split"
                series={statusSeries}
                apex={{
                  labels: statusLabels,
                  colors: [LIGHT_GREEN, LIGHT_BLUE, LIGHT_RED, LIGHT_AMBER],
                  stroke: { width: 0 },
                  chart: {
                    events: {
                      dataPointSelection: (_event: unknown, _chart: unknown, opts: any) => {
                        const idx = opts?.dataPointIndex;
                        const map = ['verify-approved', 'verify-pending', 'verify-reject', 'pending'];
                        if (idx !== undefined && map[idx]) goStatus(map[idx]);
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
                          total: { show: true, label: 'Lights', formatter: () => num(s.site_count) },
                        },
                      },
                    },
                  },
                }}
              />
            </Suspense>
            <ul className="ax-list ax-list--compact" style={{ marginTop: 'var(--ax-space-3)' }}>
              {[
                { label: 'Approved', sub: `${approvedPct}% of total`, v: s.verify_approved, color: LIGHT_GREEN, key: 'verify-approved' },
                { label: 'Verify Pending', sub: 'Awaiting verification', v: s.verify_pending, color: LIGHT_BLUE, key: 'verify-pending' },
                { label: 'Rejected', sub: 'Correction needed', v: s.verify_reject, color: LIGHT_RED, key: 'verify-reject' },
                { label: 'Install Pending', sub: 'In progress', v: s.pending, color: LIGHT_AMBER, key: 'pending' },
              ].map((r) => (
                <li
                  key={r.label}
                  className="ax-list__row asw-interactive-kpi"
                  role="button"
                  tabIndex={0}
                  onClick={() => goStatus(r.key)}
                  onKeyDown={onActivate(() => goStatus(r.key))}
                  style={{ border: 0, paddingInline: 6, borderRadius: 6 }}
                  title={`View ${r.label} street lights`}
                >
                  <span className="ax-list__leading"><i style={{ width: 9, height: 9, borderRadius: 3, background: r.color, display: 'inline-block' }} /></span>
                  <span className="ax-list__content">
                    <span className="ax-list__title" style={{ fontWeight: 500 }}>{r.label}</span>
                    <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>{r.sub}</span>
                  </span>
                  <span className="ax-list__trailing ax-num" style={{ color: 'var(--ax-text-strong)', fontWeight: 600 }}>{num(r.v)} ↗</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 6. District Chart (8) + Milestones (4) */}
        <section className="ax-card ax-card--chart ax-col--8" role="region" aria-label="District wise installations">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Geographic Breakdown</span>
              <h2 className="ax-card__title">District-wise Installation Statistics</h2>
              <p className="ax-card__subtitle">Installations by progress across Jammu &amp; Kashmir districts · click bar to filter</p>
            </div>
            <div className="ax-card__actions">
              <span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--pill">{dash(districtwise.length)} Districts</span>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            {chartDistricts.length > 0 ? (
              <Suspense fallback={<div className="ax-skeleton" style={{ height: districtChartH }} />}>
                <ApexChart
                  key={`bar-${districtChartH}-${chartDistricts.length}-${s.site_count}`}
                  type="bar"
                  height={districtChartH}
                  legend="top"
                  stacked
                  ariaLabel="Horizontal stacked bar of installations per district by progress"
                  series={[
                    { name: 'Installed', data: chartDistricts.map((d) => n(d.complete)) },
                    { name: 'Claim Raised', data: chartDistricts.map((d) => n(d.claim_raised)) },
                    { name: 'Pending', data: chartDistricts.map((d) => Math.max(0, n(d.site_count) - n(d.complete))) },
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
                          if (dist) setSelectedDistrict(dist);
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
                  className="asw-interactive-kpi"
                  role="button"
                  tabIndex={0}
                  onClick={() => goStatus(m.key)}
                  onKeyDown={onActivate(() => goStatus(m.key))}
                  style={{ padding: '4px 6px', borderRadius: 6 }}
                  title={`View ${m.label} lights`}
                >
                  <div className="ax-cluster" style={{ justifyContent: 'space-between', marginBottom: 4, flexWrap: 'wrap', gap: 4 }}>
                    <span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-strong)', fontWeight: 500 }}>{m.label}</span>
                    <b className="ax-num" style={{ color: m.color, fontSize: 'var(--ax-text-xs)' }}>{num(m.v)} / {num(m.of)} ({p}%) ↗</b>
                  </div>
                  <div className="ax-progress ax-progress--sm"><div className="ax-progress__track"><div className="ax-progress__fill" style={{ width: `${p}%`, background: m.color }} /></div></div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 7. District Wise Table with Click-Cell Drilldown */}
        <section className="ax-card ax-col--12" role="region" aria-label="District wise data">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Enterprise Data Analytics</span>
              <h2 className="ax-card__title">District Wise Installation Breakdown</h2>
              <p className="ax-card__subtitle">Installation, verification, claims and payment progress across districts · click cells to drill down</p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                <SearchInput value={qDistrict} onChange={setQDistrict} placeholder="Search district..." size="sm" />
                <TableExportToolbar
                  onCopy={() => copyTableDataToClipboard(tableDistricts, districtCols)}
                  onExportCSV={() => exportDataToCSV(`Jammu_SSL_District_Wise_${stamp}`, tableDistricts, districtCols)}
                  onExportExcel={() => exportDataToExcel(`Jammu_SSL_District_Wise_${stamp}`, tableDistricts, districtCols)}
                  onExportPDF={() => printTableData(pageTitle, tableDistricts, districtCols)}
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
                  <th className="ax-table__th ax-table__th--num" scope="col">Install (Done / Pend)</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Verification (App / Pend / Rej)</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Claim (Appl / Raised)</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Payments (Done / Pending)</th>
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
                    const rowPct = pctOf(n(d.complete), total);
                    const isSelected = selectedDistrict.toLowerCase() === d.district.toLowerCase();
                    const go = (key: string) => (e: React.MouseEvent) => { e.stopPropagation(); goStatus(key, d.district); };
                    return (
                      <tr
                        key={d.district}
                        className="ax-table__row"
                        role="button"
                        tabIndex={0}
                        onClick={() => goStatus('total', d.district)}
                        onKeyDown={onActivate(() => goStatus('total', d.district))}
                        style={{ cursor: 'pointer', background: isSelected ? 'rgba(var(--asw-primary-rgb), 0.05)' : undefined }}
                      >
                        <td className="ax-table__td">
                          <div className="ax-cluster" style={{ gap: '6px', alignItems: 'center' }}>
                            <span style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>{d.district}</span>
                            {isSelected && (
                              <span className="ax-badge ax-badge--soft ax-badge--accent ax-badge--pill" style={{ fontSize: '10px', padding: '1px 6px' }}>Active</span>
                            )}
                          </div>
                        </td>
                        <td className="ax-table__td ax-table__td--num ax-num click-cell" style={{ fontWeight: 600 }} onClick={go('total')} title={`View all lights in ${d.district}`}>
                          {num(total)}
                        </td>
                        <td className="ax-table__td ax-table__td--num">
                          <div className="ax-cluster" style={{ justifyContent: 'flex-end', gap: '4px' }}>
                            <span className="ax-badge ax-badge--soft ax-badge--success click-cell" style={{ fontWeight: 600, padding: '2px 7px' }} onClick={go('completed')} title={`View installed in ${d.district}`}>
                              {num(d.complete)}
                            </span>
                            <span style={{ color: 'var(--ax-text-muted)', fontSize: '11px' }}>/</span>
                            <span className="ax-badge ax-badge--soft ax-badge--neutral click-cell" style={{ fontWeight: 600, padding: '2px 7px' }} onClick={go('pending')} title={`View pending in ${d.district}`}>
                              {num(d.pending)}
                            </span>
                          </div>
                        </td>
                        <td className="ax-table__td ax-table__td--num">
                          <div className="ax-cluster" style={{ justifyContent: 'flex-end', gap: '4px' }}>
                            <span className="ax-badge ax-badge--soft ax-badge--success click-cell" style={{ padding: '2px 6px', fontSize: '11px' }} onClick={go('verify-approved')} title="Approved">
                              <span className="ax-badge__dot" />{num(d.verify_approved)}
                            </span>
                            <span className="ax-badge ax-badge--soft ax-badge--warning click-cell" style={{ padding: '2px 6px', fontSize: '11px' }} onClick={go('verify-pending')} title="Pending Verify">
                              {num(d.verify_pending)}
                            </span>
                            <span className="ax-badge ax-badge--soft ax-badge--danger click-cell" style={{ padding: '2px 6px', fontSize: '11px' }} onClick={go('verify-reject')} title="Rejected">
                              {num(d.verify_reject)}
                            </span>
                          </div>
                        </td>
                        <td className="ax-table__td ax-table__td--num">
                          <div className="ax-cluster" style={{ justifyContent: 'flex-end', gap: '4px' }}>
                            <span className="ax-badge ax-badge--soft ax-badge--accent click-cell" style={{ fontWeight: 600, padding: '2px 6px' }} onClick={go('claim-applicable')} title="Claim Applicable">
                              {num(d.claim_applicable)}
                            </span>
                            <span style={{ color: 'var(--ax-text-muted)' }}>/</span>
                            <span className="ax-badge ax-badge--soft ax-badge--pink click-cell" style={{ padding: '2px 6px' }} onClick={go('claim-raised')} title="Claim Raised">
                              {num(d.claim_raised)}
                            </span>
                          </div>
                        </td>
                        <td className="ax-table__td ax-table__td--num ax-num">
                          <div className="ax-cluster" style={{ justifyContent: 'flex-end', gap: '4px' }}>
                            <span className="ax-badge ax-badge--soft ax-badge--success click-cell" style={{ fontWeight: 600, padding: '2px 7px' }} onClick={go('pay-done')} title="Payment Done">
                              {num(d.pay_done)}
                            </span>
                            <span style={{ color: 'var(--ax-text-muted)', fontSize: '11px' }}>/</span>
                            <span className="ax-badge ax-badge--soft ax-badge--warning click-cell" style={{ fontWeight: 600, padding: '2px 7px' }} onClick={go('pay-pending')} title="Payment Pending">
                              {num(d.pay_pending)}
                            </span>
                          </div>
                        </td>
                        <td className="ax-table__td"><Bar pct={rowPct} /></td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="ax-btn ax-btn--ghost ax-btn--xs"
                            onClick={go('total')}
                            title={`Open status view for ${d.district}`}
                          >
                            View →
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
                {tableDistricts.length > 0 && (
                  <tr className="ax-table__row" style={{ background: 'var(--ax-surface-subtle)', fontWeight: 700 }}>
                    <td className="ax-table__td" style={{ color: 'var(--ax-text-strong)' }}>Total ({filteredDistrictRows.length} Districts)</td>
                    <td className="ax-table__td ax-table__td--num ax-num click-cell" onClick={() => goStatus('total')}>{num(districtTotals.site_count)}</td>
                    <td className="ax-table__td ax-table__td--num">
                      <div className="ax-cluster" style={{ justifyContent: 'flex-end', gap: '4px' }}>
                        <span className="ax-badge ax-badge--soft ax-badge--success click-cell" style={{ fontWeight: 700 }} onClick={() => goStatus('completed')}>{num(districtTotals.complete)}</span>
                        <span>/</span>
                        <span className="ax-badge ax-badge--soft ax-badge--neutral click-cell" style={{ fontWeight: 700 }} onClick={() => goStatus('pending')}>{num(districtTotals.pending)}</span>
                      </div>
                    </td>
                    <td className="ax-table__td ax-table__td--num">
                      <div className="ax-cluster" style={{ justifyContent: 'flex-end', gap: '4px' }}>
                        <span className="ax-badge ax-badge--soft ax-badge--success click-cell" onClick={() => goStatus('verify-approved')}>{num(districtTotals.verify_approved)}</span>
                        <span className="ax-badge ax-badge--soft ax-badge--warning click-cell" onClick={() => goStatus('verify-pending')}>{num(districtTotals.verify_pending)}</span>
                        <span className="ax-badge ax-badge--soft ax-badge--danger click-cell" onClick={() => goStatus('verify-reject')}>{num(districtTotals.verify_reject)}</span>
                      </div>
                    </td>
                    <td className="ax-table__td ax-table__td--num">
                      <div className="ax-cluster" style={{ justifyContent: 'flex-end', gap: '4px' }}>
                        <span className="ax-badge ax-badge--soft ax-badge--accent click-cell" style={{ fontWeight: 700 }} onClick={() => goStatus('claim-applicable')}>{num(districtTotals.claim_applicable)}</span>
                        <span>/</span>
                        <span className="ax-badge ax-badge--soft ax-badge--pink click-cell" onClick={() => goStatus('claim-raised')}>{num(districtTotals.claim_raised)}</span>
                      </div>
                    </td>
                    <td className="ax-table__td ax-table__td--num ax-num">
                      <div className="ax-cluster" style={{ justifyContent: 'flex-end', gap: '4px' }}>
                        <span className="ax-badge ax-badge--soft ax-badge--success click-cell" style={{ fontWeight: 700 }} onClick={() => goStatus('pay-done')}>{num(districtTotals.pay_done)}</span>
                        <span>/</span>
                        <span className="ax-badge ax-badge--soft ax-badge--warning click-cell" style={{ fontWeight: 700 }} onClick={() => goStatus('pay-pending')}>{num(districtTotals.pay_pending)}</span>
                      </div>
                    </td>
                    <td className="ax-table__td">
                      <Bar pct={Math.round(pctOf(districtTotals.complete, districtTotals.site_count))} />
                    </td>
                    <td className="ax-table__td" style={{ textAlign: 'center' }}>
                      <button type="button" className="ax-btn ax-btn--ghost ax-btn--xs" onClick={() => goStatus('total')}>All →</button>
                    </td>
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
                setPage={pD.setPage}
                onPageChange={pD.setPage}
                onPageSizeChange={pD.setPageSize}
                pageSizeOptions={[25, 50, 100, 200]}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export { SSLDashboard as SolarErp };
export default SSLDashboard;
