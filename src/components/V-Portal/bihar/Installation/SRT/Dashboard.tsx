import { lazy, Suspense, useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  biharSrtInstallationService,
  type SrtDashboardData,
  type SrtDashboardSummary,
  type SrtDistrictRow,
} from '../../bihar-services/biharSrtInstallationService';
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

const EMPTY_SUMMARY: SrtDashboardSummary = {
  site_count: 0,
  complete: 0,
  pending: 0,
  inpection_pending: 0,
  inpection_complete: 0,
  verify_pending: 0,
  verify_approved: 0,
  verify_reject: 0,
  claim_applicable: 0,
  claim_raised: 0,
  inst_doc_complete: 0,
  inst_doc_pending: 0,
  inst_pay1: 0,
  inst_pay2: 0,
  inst_pay3: 0,
  inst_pay1_amount: '0.00',
  inst_pay2_amount: '0.00',
  inst_pay3_amount: '0.00',
};

/* ───────── Helpers ───────── */
const num = (x: unknown) => Number(x ?? 0).toLocaleString('en-IN');
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

/* ───────── Layout CSS (same as ULA dashboard) ───────── */
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
    display: flex;
    flex-wrap: nowrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }
  .solar-erp-page .ax-card__titles {
    flex: 0 0 auto;
    min-width: max-content;
    max-width: 55%;
  }
  .solar-erp-page .ax-card__title {
    max-width: none;
    white-space: normal;
    word-break: normal;
    overflow-wrap: normal;
    hyphens: none;
  }
  .solar-erp-page .ax-card__eyebrow,
  .solar-erp-page .ax-card__subtitle {
    word-break: normal;
    overflow-wrap: normal;
    line-height: 1.45;
  }
  .solar-erp-page .ax-card__actions {
    flex: 1 1 0;
    min-width: 0;
    margin-left: auto;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
  }
  .solar-erp-page .ax-card__actions .ax-cluster {
    flex-wrap: wrap !important;
    min-width: 0;
    width: 100%;
    justify-content: flex-end;
  }
  .solar-erp-page .ax-card__actions .ax-search,
  .solar-erp-page .ax-card__actions [class*="search"] {
    flex: 1 1 120px;
    min-width: 90px;
    max-width: 260px;
  }
  .solar-erp-page .ax-card__actions input { min-width: 0; width: 100%; }
  .solar-erp-page .ax-card__actions .ax-export-toolbar,
  .solar-erp-page .ax-card__actions [class*="export"] {
    flex: 0 1 auto;
    min-width: 0;
    flex-wrap: nowrap;
    gap: 4px;
  }
  .solar-erp-page .ax-card__actions .ax-export-toolbar .ax-btn,
  .solar-erp-page .ax-card__actions [class*="export"] .ax-btn {
    padding-inline: 8px;
    min-width: 0;
  }

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
    .solar-erp-page .ax-card__actions [class*="export"] .ax-btn span:not([class*="icon"]) {
      display: none;
    }
    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] {
      max-width: 180px;
    }
  }

  @media (max-width: 760px) {
    .solar-erp-page { width: 100%; max-width: 100%; overflow-x: hidden; box-sizing: border-box; }
    .solar-erp-page .ax-welcome__stats {
      display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px;
    }
    .solar-erp-page .ula-filter-item { width: 100%; justify-content: space-between; }
    .solar-erp-page .ula-filter-item select { flex: 1; width: auto; max-width: 100%; }
    .solar-erp-page .ula-filter-scope { width: 100%; }
    .solar-erp-page .ax-card__header { gap: 10px; }
    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] {
      max-width: 130px;
    }
    .solar-erp-page .ula-sticky-first th:first-child,
    .solar-erp-page .ula-sticky-first td:first-child {
      position: sticky; left: 0; z-index: 1;
      background: var(--ax-bg-surface);
      box-shadow: 1px 0 0 var(--ax-border-subtle, #e2e8f0);
    }
  }

  @media (max-width: 480px) {
    .solar-erp-page .ax-card__header { flex-wrap: wrap; }
    .solar-erp-page .ax-card__titles { min-width: 0; max-width: 100%; flex: 1 1 100%; }
    .solar-erp-page .ax-card__actions { flex: 1 1 100%; }
    .solar-erp-page .ax-card__actions .ax-cluster { justify-content: flex-start; }
    .solar-erp-page .ax-card__title {
      font-family: var(--ax-font-display);
      font-size: var(--ax-text-md);
      line-height: var(--ax-leading-md);
    }
    .solar-erp-page .ax-col--3 { grid-column: span 12; }
  }
`;

/* ───────── Icons (Tabler design) ───────── */
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

const svg = (children: React.ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const I_BOLT = svg(<path d="M13 3l0 7l6 0l-8 11l0 -7l-6 0l8 -11" />);
const I_DONE = svg(<><path d="M7 12l5 5l10 -10" /><path d="M2 12l5 5m5 -5l5 -5" /></>);
const I_DOC = svg(<><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2" /><path d="M9 13l2 2l4 -4" /></>);
const I_COIN = svg(<><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M14.8 9a2 2 0 0 0 -1.8 -1h-2a2 2 0 1 0 0 4h2a2 2 0 1 1 0 4h-2a2 2 0 0 1 -1.8 -1" /><path d="M12 7v10" /></>);
const I_LIST = svg(<><path d="M9 6l11 0" /><path d="M9 12l11 0" /><path d="M9 18l11 0" /><path d="M5 6l0 .01" /><path d="M5 12l0 .01" /><path d="M5 18l0 .01" /></>);
const I_SEARCH = svg(<><path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" /><path d="M21 21l-6 -6" /></>);

/* ───────── KPI Card (same as ULA) ───────── */
interface KpiProps {
  icon: React.ReactNode;
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
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? onActivate(onClick) : undefined}
      style={{ cursor: onClick ? 'pointer' : undefined }}
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
const sectionHeadStyle = { margin: 'var(--ax-space-3) 0 var(--ax-space-1) 0', fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' } as const;

export function Bihar_Installation_SRT_Dashboard() {
  const isMobile = useIsMobile(640);
  const [data, setData] = useState<SrtDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [qDistrict, setQDistrict] = useState<string>('');

  // Status drill-down modal
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusModalTitle, setStatusModalTitle] = useState('');
  const [statusModalSites, setStatusModalSites] = useState<any[]>([]);
  const [statusModalLoading, setStatusModalLoading] = useState(false);
  const [modalSearch, setModalSearch] = useState('');

  const chartH = isMobile ? 260 : 320;
  const donutH = isMobile ? 210 : 230;

  const loadDashboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setLoading(true);
    setApiError(null);
    try {
      const resp = await biharSrtInstallationService.getDashboardData();
      if (resp) {
        setData(resp);
        setUpdatedAt(new Date());
      } else {
        setApiError('Unable to load Bihar SRT dashboard data from server.');
      }
    } catch (err: any) {
      console.warn('[SRT Dashboard] load error:', err);
      setApiError(err?.message || 'Failed to load Bihar SRT installation dashboard.');
    } finally {
      setLoading(false);
      if (isRefresh) setTimeout(() => setIsRefreshing(false), 400);
    }
  }, []);

  useEffect(() => { loadDashboardData(); }, [loadDashboardData]);

  /* ───────── Data resolution ───────── */
  const summary: SrtDashboardSummary = data?.srtdatas || EMPTY_SUMMARY;
  const districtwise: SrtDistrictRow[] = useMemo(
    () => (Array.isArray(data?.districtwise) ? (data!.districtwise as SrtDistrictRow[]) : []),
    [data]
  );
  const monthly: Array<{ month_year: string; monthly_installations: number }> = useMemo(
    () => (Array.isArray((data as any)?.district_installation_month) ? (data as any).district_installation_month : []),
    [data]
  );

  const filtersActive = selectedDistrict !== 'All';

  const filteredDistrictRows = useMemo(
    () => (filtersActive ? districtwise.filter((d) => d.district?.toLowerCase() === selectedDistrict.toLowerCase()) : districtwise),
    [districtwise, selectedDistrict, filtersActive]
  );

  const districtTotals = useMemo(
    () =>
      filteredDistrictRows.reduce(
        (acc, d) => ({
          site_count: acc.site_count + n(d.site_count),
          inst_complete: acc.inst_complete + n(d.inst_complete),
          inst_pending: acc.inst_pending + n(d.inst_pending),
          inst_pay1: acc.inst_pay1 + n(d.inst_pay1),
        }),
        { site_count: 0, inst_complete: 0, inst_pending: 0, inst_pay1: 0 }
      ),
    [filteredDistrictRows]
  );

  const deferredQuery = useDeferredValue(qDistrict);
  const tableDistricts = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return filteredDistrictRows.filter((d) => !q || (d.district || '').toLowerCase().includes(q));
  }, [filteredDistrictRows, deferredQuery]);

  const pD = usePagination({ data: tableDistricts, initialPageSize: 15 });

  useEffect(() => {
    pD.setPage(1);
  }, [qDistrict, selectedDistrict]);

  /* ───────── Derived Values ───────── */
  const dash = (v: unknown) => (loading && !data ? '…' : num(v));
  const total = n(summary.site_count);
  const instPct = pctOf(n(summary.complete), total);
  const approvedPct = pctOf(n(summary.verify_approved), total);
  const inspPct = pctOf(n(summary.inpection_complete), total);
  const monthTotal = monthly.reduce((a, m) => a + n(m.monthly_installations), 0);
  const todayLabel = fmtDate(new Date());

  const spk = (pickFn: (d: SrtDistrictRow) => number) => {
    const arr = districtwise.slice(0, 10).map(pickFn);
    return arr.length > 1 ? arr : undefined;
  };

  const chartDistricts = useMemo(
    () => [...filteredDistrictRows].sort((a, b) => n(b.site_count) - n(a.site_count)).slice(0, 15),
    [filteredDistrictRows]
  );
  const districtChartH = Math.min(560, Math.max(isMobile ? 280 : 320, chartDistricts.length * (isMobile ? 38 : 44)));

  /* ───────── Drill-down Modal ───────── */
  const handleOpenStatusDrill = async (statusKey: string, title: string, district?: string) => {
    setStatusModalTitle(title);
    setStatusModalOpen(true);
    setStatusModalLoading(true);
    setStatusModalSites([]);
    setModalSearch('');
    try {
      let sites: any[] = [];
      if (district) {
        sites = await biharSrtInstallationService.getDashboardSitesByDistrict(statusKey, district);
      } else {
        sites = await biharSrtInstallationService.getDashboardSitesByStatus(statusKey);
      }
      setStatusModalSites(sites || []);
    } catch (e) {
      console.warn('[SRT Dashboard] drill-down error:', e);
      setStatusModalSites([]);
    } finally {
      setStatusModalLoading(false);
    }
  };

  const drill = (key: string, title: string) => () => handleOpenStatusDrill(key, title);

  const modalFiltered = useMemo(() => {
    const q = modalSearch.trim().toLowerCase();
    if (!q) return statusModalSites;
    return statusModalSites.filter(
      (s) =>
        String(s.id || '').toLowerCase().includes(q) ||
        String(s.site_name || '').toLowerCase().includes(q) ||
        String(s.district || '').toLowerCase().includes(q)
    );
  }, [statusModalSites, modalSearch]);

  /* ───────── Export Columns & Helpers ───────── */
  const [hiddenDistrictColumns, setHiddenDistrictColumns] = useState<string[]>([]);

  const districtCols: ExportColumn<SrtDistrictRow>[] = useMemo(
    () => [
      { header: 'District', accessor: (r) => r.district || '' },
      { header: 'Allocated Sites', accessor: (r) => n(r.site_count) },
      { header: 'Installed Complete', accessor: (r) => n(r.inst_complete) },
      { header: 'Pending Installation', accessor: (r) => n(r.inst_pending) },
      { header: 'Payment 1 Paid', accessor: (r) => n(r.inst_pay1) },
      { header: 'Completion %', accessor: (r) => `${pctOf(n(r.inst_complete), n(r.site_count))}%` },
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

  /* ───────── Chart data ───────── */
  const instStatusSeries = [n(summary.complete), n(summary.pending)];
  const instStatusLabels = ['Installed', 'Pending'];

  const milestones = [
    { label: '1. Allocated Sites', v: n(summary.site_count), of: total, color: 'var(--ax-viz-cyan)' },
    { label: '2. Installation Complete', v: n(summary.complete), of: total, color: 'var(--ax-accent)' },
    { label: '3. Inspection Complete', v: n(summary.inpection_complete), of: total, color: 'var(--ax-viz-violet)' },
    { label: '4. Installation Approved', v: n(summary.verify_approved), of: total, color: 'var(--ax-viz-emerald)' },
    { label: '5. Documents Uploaded', v: n(summary.inst_doc_complete), of: total, color: 'var(--ax-viz-amber)' },
    { label: '6. Payment 1 Paid', v: n(summary.inst_pay1), of: total, color: 'var(--ax-viz-emerald)' },
  ];

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      {/* 1. Page Header */}
      <PageHead
        title="SRT Installation Dashboard"
        subtitle={
          <span style={{ display: 'inline-block', fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>
            Bihar State Operations · SRT installation tracking — last updated {updatedAt ? fmtTime(updatedAt) : '—'}
          </span>
        }
        breadcrumbs={[{ label: 'Bihar' }, { label: 'Installation' }, { label: 'SRT' }, { label: 'Dashboard' }]}
        actions={
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill" style={{ fontWeight: 600, paddingInline: 'var(--ax-space-3)' }}>
              <span className="ax-badge__dot" /> State: Bihar
            </span>
            <button type="button" className="ax-btn ax-btn--ghost ax-btn--icon" aria-label="Refresh dashboard" onClick={() => loadDashboardData(true)} disabled={isRefreshing}>
              <span className={isRefreshing ? 'ax-spinner' : ''}>{ICON_REFRESH}</span>
            </button>
            <Link to="/v/srt/allassignsite" className="ax-btn ax-btn--primary ax-btn--sm">
              <span className="ax-btn__label">View Installed Sites</span>
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

        {/* 2. Operations Filter Bar */}
        <section
          className="ax-card ax-card--flat ax-col--12"
          role="region"
          aria-label="SRT Dashboard Filters"
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
                Showing <b style={{ color: 'var(--ax-text-strong)' }}>{dash(summary.site_count)}</b> installations · Live: <b style={{ color: 'var(--ax-text-strong)' }}>{todayLabel}</b>
              </span>
            </div>
          </div>
        </section>

        {/* 3. Executive Welcome Banner */}
        <section className="ax-card ax-welcome ax-col--12" role="region" aria-label="Bihar SRT Installation Overview">
          <div className="ax-welcome__body">
            <div className="ax-welcome__text">
              <p className="ax-welcome__eyebrow">SRT Installation Management System · State Hub</p>
              <h2 className="ax-card__title">Welcome to Bihar SRT Installation Dashboard</h2>
              <p className="ax-welcome__lede">
                Bihar solar rooftop (SRT) overview: <b>{dash(summary.site_count)} sites</b> allocated across <b>{dash(districtwise.length)} districts</b>.
                <b> {dash(summary.complete)} ({instPct}%)</b> installations completed, with <b>{dash(summary.verify_approved)} ({approvedPct}%)</b> verified and approved.
              </p>
            </div>

            <dl className="ax-welcome__stats">
              <div className="ax-welcome__stat" role="button" tabIndex={0} style={{ cursor: 'pointer' }} onClick={drill('total', 'All Assigned SRT Sites')} onKeyDown={onActivate(drill('total', 'All Assigned SRT Sites'))}>
                <dt>Total Allocated</dt>
                <dd className="ax-num">{dash(summary.site_count)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-emerald)' }}>{dash(districtwise.length)} Districts</small>
              </div>
              <div className="ax-welcome__stat" role="button" tabIndex={0} style={{ cursor: 'pointer' }} onClick={drill('inst-complete', 'Completed SRT Installations')} onKeyDown={onActivate(drill('inst-complete', 'Completed SRT Installations'))}>
                <dt>Installed</dt>
                <dd className="ax-num">{dash(summary.complete)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-accent)' }}>{instPct}% Done</small>
              </div>
              <div className="ax-welcome__stat" role="button" tabIndex={0} style={{ cursor: 'pointer' }} onClick={drill('inst-pending', 'Pending SRT Installations')} onKeyDown={onActivate(drill('inst-pending', 'Pending SRT Installations'))}>
                <dt>Pending</dt>
                <dd className="ax-num">{dash(summary.pending)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-cyan)' }}>{pctOf(n(summary.pending), total)}% Pending</small>
              </div>
              <div className="ax-welcome__stat" role="button" tabIndex={0} style={{ cursor: 'pointer' }} onClick={drill('verify-approved', 'Verified & Approved Installations')} onKeyDown={onActivate(drill('verify-approved', 'Verified & Approved Installations'))}>
                <dt>Verified Approved</dt>
                <dd className="ax-num">{dash(summary.verify_approved)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-emerald)' }}>{approvedPct}% Approved</small>
              </div>
            </dl>
          </div>
        </section>

        {/* 4. KPI cards */}
        <div className="ax-col--12">
          <div className="ax-cluster" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={sectionHeadStyle}>SRT Operational Metrics &amp; Approval Status</h4>
            <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>Click card to inspect matching sites</span>
          </div>
        </div>

        <KpiCard
          icon={I_BOLT}
          tone="cyan"
          label="Installation Status"
          value={loading && !data ? '…' : `${num(summary.complete)} / ${num(summary.pending)}`}
          sub="Installed / Pending"
          badge={`${instPct}% Done`}
          spark={spk((d) => n(d.inst_complete))}
          onClick={drill('inst-complete', 'Installation Completed Sites')}
        />

        <KpiCard
          icon={I_SEARCH}
          tone="accent"
          label="Inspection Status"
          value={loading && !data ? '…' : `${num(summary.inpection_complete)} / ${num(summary.inpection_pending)}`}
          sub="Complete / Pending"
          badge={n(summary.inpection_complete) > 0 ? `${inspPct}% Done` : undefined}
          onClick={drill('inpection-complete', 'Inspection Completed Sites')}
        />

        <KpiCard
          icon={I_DONE}
          tone="emerald"
          label="Verification Status"
          value={loading && !data ? '…' : `${num(summary.verify_approved)} / ${num(summary.verify_pending)} / ${num(summary.verify_reject)}`}
          sub="Approved / Pending / Rejected"
          badge={`${approvedPct}% Approved`}
          onClick={drill('verify-approved', 'Installation Approved Sites')}
        />

        <KpiCard
          icon={I_DOC}
          tone="violet"
          label="Documents Status"
          value={loading && !data ? '…' : `${num(summary.inst_doc_complete)} / ${num(summary.inst_doc_pending)}`}
          sub="Submitted / Pending"
          badge={n(summary.inst_doc_complete) > 0 ? `${pctOf(n(summary.inst_doc_complete), total)}%` : undefined}
          onClick={drill('inst-doc-complete', 'Documents Submitted Sites')}
        />

        <KpiCard
          icon={I_LIST}
          tone="amber"
          label="Claim Status"
          value={loading && !data ? '…' : `${num(summary.claim_applicable)} / ${num(summary.claim_raised)}`}
          sub="Applicable / Raised"
          badge={n(summary.claim_raised) > 0 ? `${num(summary.claim_raised)} Raised` : undefined}
          onClick={drill('claim-applicable', 'Claim Applicable Sites')}
        />

        <KpiCard
          icon={I_COIN}
          tone="cyan"
          label="Payment 1 Paid"
          value={loading && !data ? '…' : num(summary.inst_pay1)}
          sub={`Amount ₹${num(summary.inst_pay1_amount)}`}
          badge={n(summary.inst_pay1) > 0 ? 'Disbursed' : undefined}
          spark={spk((d) => n(d.inst_pay1))}
          onClick={drill('inst-pay1', 'Payment 1 Sites')}
        />

        <KpiCard
          icon={I_COIN}
          tone="amber"
          label="Payment 2 Paid"
          value={loading && !data ? '…' : num(summary.inst_pay2)}
          sub={`Amount ₹${num(summary.inst_pay2_amount)}`}
          badge={n(summary.inst_pay2) > 0 ? 'Disbursed' : undefined}
          onClick={drill('inst-pay2', 'Payment 2 Sites')}
        />

        <KpiCard
          icon={I_COIN}
          tone="violet"
          label="Payment 3 Paid"
          value={loading && !data ? '…' : num(summary.inst_pay3)}
          sub={`Amount ₹${num(summary.inst_pay3_amount)}`}
          badge={n(summary.inst_pay3) > 0 ? 'Disbursed' : undefined}
          onClick={drill('inst-pay3', 'Payment 3 Sites')}
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
                {[{ l: 'Monthly Completed', c: LIGHT_GREEN }].map((i) => (
                  <span key={i.l} className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}>
                    <i style={{ width: 10, height: 10, borderRadius: 2, background: i.c }} />
                    <small style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-xs)' }}>{i.l}</small>
                  </span>
                ))}
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

        <section className="ax-card ax-col--4" role="region" aria-label="Installation status split">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Completion Ratio</span>
              <h2 className="ax-card__title">Installation Status</h2>
              <p className="ax-card__subtitle">Total {dash(summary.site_count)} sites</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            {total > 0 ? (
              <Suspense fallback={<div className="ax-skeleton" style={{ height: donutH }} />}>
                <ApexChart
                  key={`donut-${donutH}-${instStatusSeries.join('-')}`}
                  type="donut"
                  height={donutH}
                  legend="none"
                  ariaLabel="Installation status split"
                  series={instStatusSeries}
                  apex={{
                    labels: instStatusLabels,
                    colors: [LIGHT_GREEN, LIGHT_AMBER],
                    stroke: { width: 0 },
                    plotOptions: {
                      pie: {
                        donut: {
                          size: '72%',
                          labels: {
                            show: true,
                            name: { fontFamily: cv('--ax-font-sans') },
                            value: { fontFamily: cv('--ax-font-mono'), fontWeight: 600 },
                            total: { show: true, label: 'Sites', formatter: () => num(summary.site_count) },
                          },
                        },
                      },
                    },
                  }}
                />
              </Suspense>
            ) : (
              <TableEmptyState title="No installation data" message="Status split appears once sites are allocated." />
            )}
            <ul className="ax-list ax-list--compact" style={{ marginTop: 'var(--ax-space-3)' }}>
              {[
                { label: 'Installed', sub: `${instPct}% of total`, v: n(summary.complete), color: LIGHT_GREEN },
                { label: 'Pending', sub: 'Installation in progress', v: n(summary.pending), color: LIGHT_AMBER },
                { label: 'Verify Approved', sub: `${approvedPct}% of total`, v: n(summary.verify_approved), color: LIGHT_BLUE },
                { label: 'Verify Rejected', sub: 'Correction needed', v: n(summary.verify_reject), color: '#ef6a6a' },
              ].map((s) => (
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

        {/* 6. District Chart (8) + Milestones (4) */}
        <section className="ax-card ax-card--chart ax-col--8" role="region" aria-label="District wise installations">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Geographic Breakdown</span>
              <h2 className="ax-card__title">District-wise Installation Statistics</h2>
              <p className="ax-card__subtitle">Installations by progress across Bihar districts · click bar to filter</p>
            </div>
            <div className="ax-card__actions">
              <span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--pill">{dash(districtwise.length)} Districts</span>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            {chartDistricts.length > 0 ? (
              <Suspense fallback={<div className="ax-skeleton" style={{ height: districtChartH }} />}>
                <ApexChart
                  key={`bar-${districtChartH}-${chartDistricts.length}-${total}`}
                  type="bar"
                  height={districtChartH}
                  legend="top"
                  stacked
                  ariaLabel="Horizontal stacked bar of installations per district by progress"
                  series={[
                    { name: 'Installed', data: chartDistricts.map((d) => n(d.inst_complete)) },
                    { name: 'Pending', data: chartDistricts.map((d) => n(d.inst_pending)) },
                  ]}
                  apex={{
                    colors: [LIGHT_GREEN, LIGHT_AMBER],
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

        {/* 7. District wise data table */}
        <section className="ax-card ax-col--12" role="region" aria-label="District wise data">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Enterprise Data Analytics</span>
              <h2 className="ax-card__title">District Wise Installation Breakdown</h2>
              <p className="ax-card__subtitle">Site allocation, installation completion and payment progress across Bihar districts</p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                <SearchInput value={qDistrict} onChange={setQDistrict} placeholder="Search district..." size="sm" />
                <TableExportToolbar
                  onCopy={() => copyToClipboard(tableDistricts, visibleColumns(districtCols, hiddenDistrictColumns))}
                  onExportCSV={() => exportToCSV(tableDistricts, visibleColumns(districtCols, hiddenDistrictColumns), `Bihar_SRT_District_Wise_${stamp}`)}
                  onExportExcel={() => exportToExcel(tableDistricts, visibleColumns(districtCols, hiddenDistrictColumns), `Bihar_SRT_District_Wise_${stamp}`)}
                  onExportPDF={() => exportToPDF(tableDistricts, visibleColumns(districtCols, hiddenDistrictColumns), 'Bihar SRT District Wise Installation Breakdown')}
                  columns={districtToolbarColumns}
                  onToggleColumn={toggleIn(setHiddenDistrictColumns)}
                />
              </div>
            </div>
          </div>
          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover ula-table--md ula-sticky-first">
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">District</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Allocated</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Install (Done / Pend)</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Payment 1 Paid</th>
                  <th className="ax-table__th" scope="col">Progress</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading && !data ? (
                  <tr><td className="ax-table__td" colSpan={6} style={emptyCellStyle}><span className="ax-spinner" /> Loading district records…</td></tr>
                ) : pD.paginatedData.length === 0 ? (
                  <tr><td className="ax-table__td" colSpan={6} style={emptyCellStyle}>No districts match the filters.</td></tr>
                ) : (
                  pD.paginatedData.map((d) => {
                    const rowTotal = n(d.site_count);
                    const rowPct = pctOf(n(d.inst_complete), rowTotal);
                    const isSelected = selectedDistrict.toLowerCase() === d.district.toLowerCase();

                    return (
                      <tr
                        key={d.district}
                        className="ax-table__row"
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedDistrict(d.district)}
                        onKeyDown={onActivate(() => setSelectedDistrict(d.district))}
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
                        <td className="ax-table__td ax-table__td--num ax-num" style={{ fontWeight: 600 }}>{num(rowTotal)}</td>
                        <td className="ax-table__td ax-table__td--num">
                          <div className="ax-cluster" style={{ justifyContent: 'flex-end', gap: '4px' }}>
                            <span className="ax-badge ax-badge--soft ax-badge--success" style={{ fontWeight: 600, padding: '2px 7px' }}>{num(d.inst_complete)}</span>
                            <span style={{ color: 'var(--ax-text-muted)', fontSize: '11px' }}>/</span>
                            <span className="ax-badge ax-badge--soft ax-badge--neutral" style={{ fontWeight: 600, padding: '2px 7px' }}>{num(d.inst_pending)}</span>
                          </div>
                        </td>
                        <td className="ax-table__td ax-table__td--num ax-num" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>{num(d.inst_pay1)}</td>
                        <td className="ax-table__td">
                          <Bar pct={rowPct} />
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="ax-btn ax-btn--secondary ax-btn--sm"
                            style={{ height: 26, padding: '0 8px', fontSize: '11px', gap: '4px' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenStatusDrill('total', `${d.district} — All Sites`, d.district);
                            }}
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
                {tableDistricts.length > 0 && (
                  <tr className="ax-table__row" style={{ background: 'var(--ax-surface-subtle)', fontWeight: 'var(--ax-weight-bold)' }}>
                    <td className="ax-table__td" style={{ color: 'var(--ax-text-strong)', background: 'var(--ax-surface-subtle)' }}>Total ({filteredDistrictRows.length} Districts)</td>
                    <td className="ax-table__td ax-table__td--num ax-num">{num(districtTotals.site_count)}</td>
                    <td className="ax-table__td ax-table__td--num">
                      <div className="ax-cluster" style={{ justifyContent: 'flex-end', gap: '4px' }}>
                        <span className="ax-badge ax-badge--soft ax-badge--success" style={{ fontWeight: 700 }}>{num(districtTotals.inst_complete)}</span>
                        <span>/</span>
                        <span className="ax-badge ax-badge--soft ax-badge--neutral" style={{ fontWeight: 700 }}>{num(districtTotals.inst_pending)}</span>
                      </div>
                    </td>
                    <td className="ax-table__td ax-table__td--num ax-num">{num(districtTotals.inst_pay1)}</td>
                    <td className="ax-table__td">
                      <Bar pct={Math.round(pctOf(districtTotals.inst_complete, districtTotals.site_count))} />
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

      {/* ── Status Drill-Down Modal ── */}
      {statusModalOpen && (
        <div className="ax-modal-backdrop" onClick={() => setStatusModalOpen(false)}>
          <div className="ax-modal" style={{ maxWidth: 850 }} onClick={(e) => e.stopPropagation()}>
            <div className="ax-modal__header">
              <div>
                <h4 className="ax-modal__title">{statusModalTitle}</h4>
                <p style={{ margin: 0, fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
                  Total {statusModalSites.length} site{statusModalSites.length === 1 ? '' : 's'}
                </p>
              </div>
              <button type="button" className="ax-btn ax-btn--ghost ax-btn--icon" aria-label="Close" onClick={() => setStatusModalOpen(false)}>✕</button>
            </div>
            <div className="ax-modal__body" style={{ maxHeight: 450, overflowY: 'auto' }}>
              {!statusModalLoading && statusModalSites.length > 0 && (
                <div style={{ marginBottom: 'var(--ax-space-3)' }}>
                  <SearchInput value={modalSearch} onChange={setModalSearch} placeholder="Search by site name, district, ID..." size="sm" />
                </div>
              )}
              {statusModalLoading ? (
                <div style={{ textAlign: 'center', padding: 'var(--ax-space-6)' }}><span className="ax-spinner" /> Fetching sites…</div>
              ) : modalFiltered.length === 0 ? (
                <TableEmptyState title="No sites found" message="No sites currently match this status filter." />
              ) : (
                <div className="ax-table-wrap">
                  <table className="ax-table ax-table--hover">
                    <thead>
                      <tr>
                        <th>Sr.</th>
                        <th>ID</th>
                        <th>Site Name</th>
                        <th>District</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modalFiltered.map((s, idx) => (
                        <tr key={s.id || idx}>
                          <td>{idx + 1}</td>
                          <td style={{ fontWeight: 600 }}>#{s.id}</td>
                          <td>{s.site_name || '—'}</td>
                          <td>{s.district || '—'}</td>
                          <td>
                            {s.site_inst_status === 1 ? (
                              <span className="ax-badge ax-badge--soft ax-badge--success">Installed</span>
                            ) : (
                              <span className="ax-badge ax-badge--soft ax-badge--warning">Pending</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="ax-modal__footer">
              <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={() => setStatusModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Bihar_Installation_SRT_Dashboard;