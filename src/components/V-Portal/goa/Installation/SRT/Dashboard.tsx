import { lazy, Suspense, useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { goaSrtInstallationService } from '../../goa-services/goaSrtInstallationService';
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

/* ───────── Types (API shape: data.goa_srts / data.districtwise) ───────── */
interface GoaSummary {
  site_count: number;
  complete: number;
  pending: number;
  inpection_pending: number;
  inpection_complete: number;
  verify_pending: number;
  verify_approved: number;
  verify_reject: number;
  claim_applicable: number;
  claim_raised: number;
  inst_doc_complete: number;
  inst_doc_pending: number;
  inst_pay1: number;
  inst_pay2: number;
  inst_pay3: number;
  inst_pay1_amount: number;
  inst_pay2_amount: number;
  inst_pay3_amount: number;
}

interface DistrictRow extends GoaSummary {
  district: string;
}

/* ───────── Helpers ───────── */
const n = (v: unknown) => Number(v ?? 0) || 0;
const num = (x: unknown) => n(x).toLocaleString('en-IN');
const pctOf = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : 0);
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

// API ke raw object ko number-safe summary me convert karta hai (null => 0)
const toSummary = (o: any): GoaSummary => ({
  site_count: n(o?.site_count),
  complete: n(o?.complete),
  pending: n(o?.pending),
  inpection_pending: n(o?.inpection_pending),
  inpection_complete: n(o?.inpection_complete),
  verify_pending: n(o?.verify_pending),
  verify_approved: n(o?.verify_approved),
  verify_reject: n(o?.verify_reject),
  claim_applicable: n(o?.claim_applicable),
  claim_raised: n(o?.claim_raised),
  inst_doc_complete: n(o?.inst_doc_complete),
  inst_doc_pending: n(o?.inst_doc_pending),
  inst_pay1: n(o?.inst_pay1),
  inst_pay2: n(o?.inst_pay2),
  inst_pay3: n(o?.inst_pay3),
  inst_pay1_amount: n(o?.inst_pay1_amount),
  inst_pay2_amount: n(o?.inst_pay2_amount),
  inst_pay3_amount: n(o?.inst_pay3_amount),
});

/* ───────── Layout CSS (same as ULA Dashboard) ───────── */
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
  .solar-erp-page .ula-table--md { min-width: 900px; }
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
    .solar-erp-page .ax-card__actions [class*="search"] { max-width: 180px; }
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
    .solar-erp-page .ax-card__actions [class*="search"] { max-width: 130px; }
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
const svg = (children: React.ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const I_BOLT = svg(<path d="M13 3l0 7l6 0l-8 11l0 -7l-6 0l8 -11" />);
const I_DONE = svg(<><path d="M7 12l5 5l10 -10" /><path d="M2 12l5 5m5 -5l5 -5" /></>);
const I_DOC = svg(<><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2" /><path d="M9 13l2 2l4 -4" /></>);
const I_COIN = svg(<><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M14.8 9a2 2 0 0 0 -1.8 -1h-2a2 2 0 1 0 0 4h2a2 2 0 1 1 0 4h-2a2 2 0 0 1 -1.8 -1" /><path d="M12 7v10" /></>);
const I_LIST = svg(<><path d="M9 6l11 0" /><path d="M9 12l11 0" /><path d="M9 18l11 0" /><path d="M5 6l0 .01" /><path d="M5 12l0 .01" /><path d="M5 18l0 .01" /></>);
const I_EYE = svg(<><circle cx="12" cy="12" r="2" /><path d="M22 12c-2.667 4.667 -6 7 -10 7s-7.333 -2.333 -10 -7c2.667 -4.667 6 -7 10 -7s7.333 2.333 10 7" /></>);

/* ───────── KPI Card ───────── */
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
      style={{ cursor: onClick ? 'pointer' : 'default', transition: 'transform 0.15s ease' }}
      onClick={onClick}
      onKeyDown={onClick ? onActivate(onClick) : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
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

export function Goa_Installation_SRT_Dashboard() {
  const navigate = useNavigate();
  const isMobile = useIsMobile(640);
  const [data, setData] = useState<any>(null);
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
      const resp: any = await goaSrtInstallationService.getDashboardData();
      if (resp) {
        // API response: { status, message, data: { goa_srts, districtwise, ... } }
        setData(resp?.data && (resp.data.goa_srts || resp.data.districtwise) ? resp.data : resp);
        setUpdatedAt(new Date());
      } else {
        setApiError('Unable to load Goa SRT dashboard data from server.');
      }
    } catch (err: any) {
      console.warn('[Goa SRT Dashboard] load error:', err);
      setApiError(err?.message || 'Failed to load Goa SRT installation dashboard.');
    } finally {
      setLoading(false);
      if (isRefresh) setTimeout(() => setIsRefreshing(false), 400);
    }
  }, []);

  useEffect(() => { loadDashboardData(); }, [loadDashboardData]);

  /* ───────── Data resolution (sirf API se) ───────── */
  const rawSummary: GoaSummary = useMemo(() => toSummary(data?.goa_srts), [data]);

  const districtwise: DistrictRow[] = useMemo(
    () => (Array.isArray(data?.districtwise) ? data.districtwise.map((d: any) => ({ district: String(d?.district ?? ''), ...toSummary(d) })) : []),
    [data]
  );

  const monthly: Array<{ month_year: string; monthly_installations: number }> = useMemo(
    () => (Array.isArray(data?.district_installation_month) ? data.district_installation_month : []),
    [data]
  );

  const filtersActive = selectedDistrict !== 'All';

  const s: GoaSummary = useMemo(() => {
    if (!filtersActive) return rawSummary;
    const d = districtwise.find((x) => x.district.toLowerCase() === selectedDistrict.toLowerCase());
    return d ? toSummary(d) : rawSummary;
  }, [rawSummary, districtwise, selectedDistrict, filtersActive]);

  const filteredDistrictRows = useMemo(
    () => (filtersActive ? districtwise.filter((d) => d.district.toLowerCase() === selectedDistrict.toLowerCase()) : districtwise),
    [districtwise, selectedDistrict, filtersActive]
  );

  const districtTotals = useMemo(() => {
    const keys = Object.keys(toSummary({})) as Array<keyof GoaSummary>;
    const acc = toSummary({});
    filteredDistrictRows.forEach((d) => keys.forEach((k) => { acc[k] += n(d[k]); }));
    return acc;
  }, [filteredDistrictRows]);

  const deferredQuery = useDeferredValue(qDistrict);
  const tableDistricts = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return filteredDistrictRows.filter((d) => !q || d.district.toLowerCase().includes(q));
  }, [filteredDistrictRows, deferredQuery]);

  const pD = usePagination({ data: tableDistricts, initialPageSize: 15 });

  useEffect(() => { pD.setPage(1); }, [qDistrict, selectedDistrict]);

  /* ───────── Derived ───────── */
  const dash = (v: number) => (loading && !data ? '…' : num(v));
  const instPct = pctOf(s.complete, s.site_count);
  const approvedPct = pctOf(s.verify_approved, s.site_count);
  const inspPct = pctOf(s.inpection_complete, s.site_count);
  const monthTotal = monthly.reduce((a, m) => a + n(m.monthly_installations), 0);
  const todayLabel = fmtDate(new Date());

  const goStatus = (st: string) => navigate(`/v/goa/srt/installation/status-view?status=${encodeURIComponent(st)}`);

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
      { header: 'District', accessor: (r) => r.district || '' },
      { header: 'Total Sites', accessor: (r) => n(r.site_count) },
      { header: 'Install Done', accessor: (r) => n(r.complete) },
      { header: 'Install Pending', accessor: (r) => n(r.pending) },
      { header: 'Inspection Done', accessor: (r) => n(r.inpection_complete) },
      { header: 'Inspection Pending', accessor: (r) => n(r.inpection_pending) },
      { header: 'Approved', accessor: (r) => n(r.verify_approved) },
      { header: 'Verify Pending', accessor: (r) => n(r.verify_pending) },
      { header: 'Verify Rejected', accessor: (r) => n(r.verify_reject) },
      { header: 'Doc Complete', accessor: (r) => n(r.inst_doc_complete) },
      { header: 'Doc Pending', accessor: (r) => n(r.inst_doc_pending) },
      { header: 'Claim Applicable', accessor: (r) => n(r.claim_applicable) },
      { header: 'Claim Raised', accessor: (r) => n(r.claim_raised) },
      { header: 'Pay1', accessor: (r) => n(r.inst_pay1) },
      { header: 'Pay2', accessor: (r) => n(r.inst_pay2) },
      { header: 'Pay3', accessor: (r) => n(r.inst_pay3) },
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

  const makeToolbarColumns = <T,>(columns: ExportColumn<T>[], hidden: string[]) =>
    columns.map((c, i) => ({ key: `${c.header}-${i}`, label: c.header, visible: !hidden.includes(`${c.header}-${i}`) }));
  const visibleColumns = <T,>(columns: ExportColumn<T>[], hidden: string[]) =>
    columns.filter((c, i) => !hidden.includes(`${c.header}-${i}`));

  const districtToolbarColumns = makeToolbarColumns(districtCols, hiddenDistrictColumns);
  const toggleIn = (setter: React.Dispatch<React.SetStateAction<string[]>>) => (key: string) =>
    setter((prev) => (prev.includes(key) ? prev.filter((i) => i !== key) : [...prev, key]));

  /* ───────── Chart data ───────── */
  const statusSeries = [s.verify_approved, s.verify_pending, s.verify_reject, s.pending];
  const statusLabels = ['Approved', 'Verify Pending', 'Rejected', 'Install Pending'];

  const milestones = [
    { label: '1. Allocated Sites', v: s.site_count, of: s.site_count, color: 'var(--ax-viz-cyan)' },
    { label: '2. Installation Complete', v: s.complete, of: s.site_count, color: 'var(--ax-accent)' },
    { label: '3. Site Inspection Done', v: s.inpection_complete, of: s.site_count, color: 'var(--ax-viz-violet)' },
    { label: '4. Installation Approved', v: s.verify_approved, of: s.site_count, color: 'var(--ax-viz-emerald)' },
    { label: '5. Documents Submitted', v: s.inst_doc_complete, of: s.site_count, color: 'var(--ax-viz-amber)' },
    { label: '6. Claim Raised', v: s.claim_raised, of: s.claim_applicable, color: 'var(--ax-viz-pink)' },
  ];

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      {/* 1. Page Header */}
      <PageHead
        title="Goa SRT Installation Dashboard"
        subtitle={
          <span style={{ display: 'inline-block', fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>
            Goa State Operations · SRT installation tracking — last updated {updatedAt ? `${fmtDate(updatedAt)} ${fmtTime(updatedAt)}` : '—'}
          </span>
        }
        breadcrumbs={[{ label: 'Home', href: '/v-dashboard' }, { label: 'Goa' }, { label: 'Installation' }, { label: 'SRT' }, { label: 'Dashboard' }]}
        actions={
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill" style={{ fontWeight: 600, paddingInline: 'var(--ax-space-3)' }}>
              <span className="ax-badge__dot" /> State: Goa
            </span>
            <button type="button" className="ax-btn ax-btn--ghost ax-btn--icon" aria-label="Refresh dashboard" onClick={() => loadDashboardData(true)} disabled={loading || isRefreshing}>
              <span className={isRefreshing ? 'ax-spinner' : ''}>{ICON_REFRESH}</span>
            </button>
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

        {/* 2. Filter Bar */}
        <section
          className="ax-card ax-card--flat ax-col--12"
          role="region"
          aria-label="Goa SRT Dashboard Filters"
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
                <label htmlFor="goa-district-select" style={labelStyle}>District:</label>
                <select id="goa-district-select" className="ax-input ax-input--sm" style={selectStyle} value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)}>
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
                Showing <b style={{ color: 'var(--ax-text-strong)' }}>{dash(s.site_count)}</b> installations · Live: <b style={{ color: 'var(--ax-text-strong)' }}>{todayLabel}</b>
              </span>
            </div>
          </div>
        </section>

        {/* 3. Welcome Banner */}
        <section className="ax-card ax-welcome ax-col--12" role="region" aria-label="Goa SRT Installation Overview">
          <div className="ax-welcome__body">
            <div className="ax-welcome__text">
              <p className="ax-welcome__eyebrow">SRT Installation Management System · State Hub</p>
              <h2 className="ax-card__title">Welcome to Goa SRT Installation Dashboard</h2>
              <p className="ax-welcome__lede">
                Goa state installation overview: <b>{dash(s.site_count)} sites</b> tracked across <b>{dash(filtersActive ? 1 : districtwise.length)} districts</b>.
                <b> {dash(s.complete)} ({instPct}%)</b> installations completed, with <b>{dash(s.verify_approved)} ({approvedPct}%)</b> verified and approved.
              </p>
            </div>

            <dl className="ax-welcome__stats">
              <div className="ax-welcome__stat">
                <dt>Total Sites</dt>
                <dd className="ax-num">{dash(s.site_count)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-emerald)' }}>{dash(districtwise.length)} Districts</small>
              </div>
              <div className="ax-welcome__stat">
                <dt>Installation Done</dt>
                <dd className="ax-num">{dash(s.complete)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-accent)' }}>{instPct}% Done</small>
              </div>
              <div className="ax-welcome__stat">
                <dt>Inspection Done</dt>
                <dd className="ax-num">{dash(s.inpection_complete)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-cyan)' }}>{inspPct}% Inspected</small>
              </div>
              <div className="ax-welcome__stat">
                <dt>Approved</dt>
                <dd className="ax-num">{dash(s.verify_approved)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-emerald)' }}>{approvedPct}% Approved</small>
              </div>
            </dl>
          </div>
        </section>



        <KpiCard
          icon={I_BOLT}
          tone="accent"
          label="Total Sites"
          value={loading && !data ? '…' : num(s.site_count)}
          sub="Total assigned rooftop sites"
          badge={s.site_count ? `${instPct}% installed` : undefined}
          spark={spk((d) => n(d.site_count))}
          onClick={() => goStatus('total')}
        />

        <KpiCard
          icon={I_DONE}
          tone="emerald"
          label="Installation Status"
          value={loading && !data ? '…' : `${num(s.complete)} / ${num(s.pending)}`}
          sub="Installed / Pending"
          badge={`${instPct}% Done`}
          spark={spk((d) => n(d.complete))}
          onClick={() => goStatus('complete')}
        />

        <KpiCard
          icon={I_EYE}
          tone="pink"
          label="Inspection Status"
          value={loading && !data ? '…' : `${num(s.inpection_complete)} / ${num(s.inpection_pending)}`}
          sub="Inspected / Pending"
          badge={s.inpection_complete > 0 ? `${inspPct}% Done` : undefined}
          spark={spk((d) => n(d.inpection_complete))}
          onClick={() => goStatus('inspection-complete')}
        />

        <KpiCard
          icon={I_DONE}
          tone="amber"
          label="Verification Status"
          value={loading && !data ? '…' : `${num(s.verify_approved)} / ${num(s.verify_pending)} / ${num(s.verify_reject)}`}
          sub="Approved / Pending / Rejected"
          badge={s.verify_approved > 0 ? `${approvedPct}% Approved` : undefined}
          spark={spk((d) => n(d.verify_approved))}
          onClick={() => goStatus('verify-approved')}
        />

        <KpiCard
          icon={I_DOC}
          tone="violet"
          label="Documents Status"
          value={loading && !data ? '…' : `${num(s.inst_doc_complete)} / ${num(s.inst_doc_pending)}`}
          sub="Submitted / Pending"
          badge={s.inst_doc_complete > 0 ? `${pctOf(s.inst_doc_complete, s.site_count)}%` : undefined}
          spark={spk((d) => n(d.inst_doc_complete))}
          onClick={() => goStatus('doc-complete')}
        />

        <KpiCard
          icon={I_LIST}
          tone="cyan"
          label="Claim Status"
          value={loading && !data ? '…' : `${num(s.claim_applicable)} / ${num(s.claim_raised)}`}
          sub="Applicable / Raised"
          badge={s.claim_raised > 0 ? `${num(s.claim_raised)} Raised` : undefined}
          spark={spk((d) => n(d.claim_raised))}
          onClick={() => goStatus('claim-raised')}
        />

        <KpiCard
          icon={I_COIN}
          tone="emerald"
          label="Payment Claimed Status"
          value={loading && !data ? '…' : `${num(s.inst_pay1)} / ${num(s.inst_pay2)} / ${num(s.inst_pay3)}`}
          sub="1st / 2nd / 3rd Stages"
          badge={s.inst_pay1 + s.inst_pay2 + s.inst_pay3 > 0 ? 'Claimed' : undefined}
          onClick={() => goStatus('inst-pay1')}
        />

        <KpiCard
          icon={I_COIN}
          tone="amber"
          label="Payment Amount Claimed"
          value={loading && !data ? '…' : `₹${num(s.inst_pay1_amount)}`}
          sub={`2nd: ₹${num(s.inst_pay2_amount)} · 3rd: ₹${num(s.inst_pay3_amount)}`}
          badge={s.inst_pay1_amount + s.inst_pay2_amount + s.inst_pay3_amount > 0 ? 'Invoiced' : undefined}
          onClick={() => goStatus('pay1-amount')}
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
              <span className="ax-card__eyebrow">Status Distribution</span>
              <h2 className="ax-card__title">Installation Status</h2>
              <p className="ax-card__subtitle">Total {dash(s.site_count)} sites</p>
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
                  colors: [LIGHT_GREEN, LIGHT_BLUE, '#ef6a6a', LIGHT_AMBER],
                  stroke: { width: 0 },
                  plotOptions: {
                    pie: {
                      donut: {
                        size: '72%',
                        labels: {
                          show: true,
                          name: { fontFamily: cv('--ax-font-sans') },
                          value: { fontFamily: cv('--ax-font-mono'), fontWeight: 600 },
                          total: { show: true, label: 'Sites', formatter: () => num(s.site_count) },
                        },
                      },
                    },
                  },
                }}
              />
            </Suspense>
            <ul className="ax-list ax-list--compact" style={{ marginTop: 'var(--ax-space-3)' }}>
              {[
                { label: 'Approved', sub: `${approvedPct}% of total`, v: s.verify_approved, color: LIGHT_GREEN },
                { label: 'Verify Pending', sub: 'Awaiting verification', v: s.verify_pending, color: LIGHT_BLUE },
                { label: 'Rejected', sub: 'Correction needed', v: s.verify_reject, color: '#ef6a6a' },
                { label: 'Install Pending', sub: 'In progress', v: s.pending, color: LIGHT_AMBER },
              ].map((r) => (
                <li key={r.label} className="ax-list__row" style={{ border: 0, paddingInline: 0 }}>
                  <span className="ax-list__leading"><i style={{ width: 9, height: 9, borderRadius: 3, background: r.color, display: 'inline-block' }} /></span>
                  <span className="ax-list__content">
                    <span className="ax-list__title" style={{ fontWeight: 'var(--ax-weight-medium)' }}>{r.label}</span>
                    <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>{r.sub}</span>
                  </span>
                  <span className="ax-list__trailing ax-num" style={{ color: 'var(--ax-text-strong)', fontWeight: 600 }}>{num(r.v)}</span>
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
              <p className="ax-card__subtitle">Installations by progress across Goa districts · click bar to filter</p>
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
                    { name: 'Inspection Done', data: chartDistricts.map((d) => n(d.inpection_complete)) },
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

        {/* 7. District Wise Table */}
        <section className="ax-card ax-col--12" role="region" aria-label="District wise data">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Enterprise Data Analytics</span>
              <h2 className="ax-card__title">District Wise Installation Breakdown</h2>
              <p className="ax-card__subtitle">Installation, inspection, verification, documents, claims and payment progress</p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                <SearchInput value={qDistrict} onChange={setQDistrict} placeholder="Search district..." size="sm" />
                <TableExportToolbar
                  onCopy={() => copyToClipboard(tableDistricts, visibleColumns(districtCols, hiddenDistrictColumns))}
                  onExportCSV={() => exportToCSV(tableDistricts, visibleColumns(districtCols, hiddenDistrictColumns), `Goa_SRT_District_Wise_${stamp}`)}
                  onExportExcel={() => exportToExcel(tableDistricts, visibleColumns(districtCols, hiddenDistrictColumns), `Goa_SRT_District_Wise_${stamp}`)}
                  onExportPDF={() => exportToPDF(tableDistricts, visibleColumns(districtCols, hiddenDistrictColumns), 'Goa SRT District Wise Installation Breakdown')}
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
                  <th className="ax-table__th ax-table__th--num" scope="col">Install (Done / Pend)</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Inspection (Done / Pend)</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Verification (App / Pend / Rej)</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Documents</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Claim (Appl / Raised)</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Payments (1 / 2 / 3)</th>
                  <th className="ax-table__th" scope="col">Progress</th>
                </tr>
              </thead>
              <tbody>
                {loading && !data ? (
                  <tr><td className="ax-table__td" colSpan={9} style={emptyCellStyle}><span className="ax-spinner" /> Loading district records…</td></tr>
                ) : pD.paginatedData.length === 0 ? (
                  <tr><td className="ax-table__td" colSpan={9} style={emptyCellStyle}>No districts match the filters.</td></tr>
                ) : (
                  pD.paginatedData.map((d) => {
                    const total = n(d.site_count);
                    const rowPct = pctOf(n(d.complete), total);
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
                        <td className="ax-table__td ax-table__td--num ax-num" style={{ fontWeight: 600 }}>{num(total)}</td>
                        <td className="ax-table__td ax-table__td--num">
                          <div className="ax-cluster" style={{ justifyContent: 'flex-end', gap: '4px' }}>
                            <span className="ax-badge ax-badge--soft ax-badge--success" style={{ fontWeight: 600, padding: '2px 7px' }}>{num(d.complete)}</span>
                            <span style={{ color: 'var(--ax-text-muted)', fontSize: '11px' }}>/</span>
                            <span className="ax-badge ax-badge--soft ax-badge--neutral" style={{ fontWeight: 600, padding: '2px 7px' }}>{num(d.pending)}</span>
                          </div>
                        </td>
                        <td className="ax-table__td ax-table__td--num">
                          <div className="ax-cluster" style={{ justifyContent: 'flex-end', gap: '4px' }}>
                            <span className="ax-badge ax-badge--soft ax-badge--info" style={{ fontWeight: 600, padding: '2px 7px' }}>{num(d.inpection_complete)}</span>
                            <span style={{ color: 'var(--ax-text-muted)', fontSize: '11px' }}>/</span>
                            <span className="ax-badge ax-badge--soft ax-badge--warning" style={{ fontWeight: 600, padding: '2px 7px' }}>{num(d.inpection_pending)}</span>
                          </div>
                        </td>
                        <td className="ax-table__td ax-table__td--num">
                          <div className="ax-cluster" style={{ justifyContent: 'flex-end', gap: '4px' }}>
                            <span className="ax-badge ax-badge--soft ax-badge--success" style={{ padding: '2px 6px', fontSize: '11px' }} title="Approved">
                              <span className="ax-badge__dot" />{num(d.verify_approved)}
                            </span>
                            <span className="ax-badge ax-badge--soft ax-badge--warning" style={{ padding: '2px 6px', fontSize: '11px' }} title="Pending Verify">{num(d.verify_pending)}</span>
                            <span className="ax-badge ax-badge--soft ax-badge--danger" style={{ padding: '2px 6px', fontSize: '11px' }} title="Rejected">{num(d.verify_reject)}</span>
                          </div>
                        </td>
                        <td className="ax-table__td ax-table__td--num">
                          <span style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>{num(d.inst_doc_complete)}</span>
                          <span style={{ color: 'var(--ax-text-muted)' }}> / </span>
                          <span style={{ color: 'var(--ax-text-muted)' }}>{num(d.inst_doc_pending)}</span>
                        </td>
                        <td className="ax-table__td ax-table__td--num">
                          <span style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>{num(d.claim_applicable)}</span>
                          <span style={{ color: 'var(--ax-text-muted)' }}> / </span>
                          <span style={{ color: 'var(--ax-text-muted)' }}>{num(d.claim_raised)}</span>
                        </td>
                        <td className="ax-table__td ax-table__td--num ax-num">
                          {num(d.inst_pay1)} / {num(d.inst_pay2)} / {num(d.inst_pay3)}
                        </td>
                        <td className="ax-table__td"><Bar pct={rowPct} /></td>
                      </tr>
                    );
                  })
                )}
                {tableDistricts.length > 0 && (
                  <tr className="ax-table__row" style={{ background: 'var(--ax-surface-subtle)', fontWeight: 'var(--ax-weight-bold)' }}>
                    <td className="ax-table__td" style={{ color: 'var(--ax-text-strong)' }}>Total ({filteredDistrictRows.length} Districts)</td>
                    <td className="ax-table__td ax-table__td--num ax-num">{num(districtTotals.site_count)}</td>
                    <td className="ax-table__td ax-table__td--num">
                      <div className="ax-cluster" style={{ justifyContent: 'flex-end', gap: '4px' }}>
                        <span className="ax-badge ax-badge--soft ax-badge--success" style={{ fontWeight: 700 }}>{num(districtTotals.complete)}</span>
                        <span>/</span>
                        <span className="ax-badge ax-badge--soft ax-badge--neutral" style={{ fontWeight: 700 }}>{num(districtTotals.pending)}</span>
                      </div>
                    </td>
                    <td className="ax-table__td ax-table__td--num">
                      <div className="ax-cluster" style={{ justifyContent: 'flex-end', gap: '4px' }}>
                        <span className="ax-badge ax-badge--soft ax-badge--info" style={{ fontWeight: 700 }}>{num(districtTotals.inpection_complete)}</span>
                        <span>/</span>
                        <span className="ax-badge ax-badge--soft ax-badge--warning" style={{ fontWeight: 700 }}>{num(districtTotals.inpection_pending)}</span>
                      </div>
                    </td>
                    <td className="ax-table__td ax-table__td--num">
                      <div className="ax-cluster" style={{ justifyContent: 'flex-end', gap: '4px' }}>
                        <span className="ax-badge ax-badge--soft ax-badge--success">{num(districtTotals.verify_approved)}</span>
                        <span className="ax-badge ax-badge--soft ax-badge--warning">{num(districtTotals.verify_pending)}</span>
                        <span className="ax-badge ax-badge--soft ax-badge--danger">{num(districtTotals.verify_reject)}</span>
                      </div>
                    </td>
                    <td className="ax-table__td ax-table__td--num">
                      <span style={{ fontWeight: 700 }}>{num(districtTotals.inst_doc_complete)}</span>
                      <span> / </span>
                      <span>{num(districtTotals.inst_doc_pending)}</span>
                    </td>
                    <td className="ax-table__td ax-table__td--num">
                      <span style={{ fontWeight: 700 }}>{num(districtTotals.claim_applicable)}</span>
                      <span> / </span>
                      <span>{num(districtTotals.claim_raised)}</span>
                    </td>
                    <td className="ax-table__td ax-table__td--num ax-num">
                      {num(districtTotals.inst_pay1)} / {num(districtTotals.inst_pay2)} / {num(districtTotals.inst_pay3)}
                    </td>
                    <td className="ax-table__td">
                      <Bar pct={Math.round(pctOf(districtTotals.complete, districtTotals.site_count))} />
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

export default Goa_Installation_SRT_Dashboard;