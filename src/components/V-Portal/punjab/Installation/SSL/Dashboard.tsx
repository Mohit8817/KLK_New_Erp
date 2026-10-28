import { lazy, Suspense, useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  punjabSslInstallationService,
  getCompanyId,
  type PunjabDashboardData,
  type PunjabDistrictwise,
  type PunjabStatusDrillRow,
} from '../../punjab-services';
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

/* ───────── Summary Type ───────── */
interface SslSummary {
  site_count: number;
  complete: number;
  pending: number;
  site_assigned: number;
  site_not_assigned: number;
  verify_pending: number;
  verify_approved: number;
  verify_reject: number;
  claim_applicable: number;
  claim_raised: number;
  claim_approved: number;
  claim_pending: number;
  claim_reject: number;
  inst_pay_done: number;
  inst_pay_pending: number;
  payment_amount: number;
}

/* ───────── Helpers ───────── */
const num = (x: number) => (x ?? 0).toLocaleString('en-IN');
const cur = (x: number) => `₹${(x ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const pctOf = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : 0);
const n = (v: unknown) => Number(v ?? 0) || 0;
const pad = (x: number) => String(x).padStart(2, '0');
const fmtDate = (d: Date | null) => (d ? `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}` : '—');
const fmtTime = (d: Date) => d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();
const cv = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const initials = (s: string) => s.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';

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

const STATUS_LABELS: Record<string, string> = {
  'total-light': 'Total Lights',
  'assign-light': 'Assigned Lights',
  'not-assign-light': 'Not Assigned Lights',
  'installed-light': 'Installed Lights',
  'not-installed-light': 'Install Pending',
  'verify-light': 'Verified & Approved',
  'verify-pending-light': 'Verification Pending',
  'verify-reject-light': 'Verification Rejected',
  'claim-applicable': 'Claim Applicable',
  'claim-raised': 'Claims Raised',
  'claim-approved': 'Claims Approved',
  'claim-pending': 'Claims Pending',
  'pay-done': 'Payment Done',
  'pay-pending': 'Payment Pending',
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

/* ───────── DLE Layout CSS (same as ULA) ───────── */
const PAGE_CSS = `
  .solar-erp-page .ax-page-head { margin-block-end: 10px; }
  .solar-erp-page .ax-page-head .ax-breadcrumb { margin-block-end: 4px; }
  .solar-erp-page .ax-dash-grid { margin-top: 0; }
  .solar-erp-page .ax-card { min-width: 0; }
  .solar-erp-page .ax-card__footer { width: 100%; box-sizing: border-box; }
  .solar-erp-page .ssl-pagination-left {
    width: 100%; display: flex; justify-content: flex-start; align-items: center; margin: 0; overflow-x: auto;
  }
  .solar-erp-page .ssl-pagination-left > * { margin-left: 0 !important; margin-right: 0 !important; }

  .solar-erp-page .ax-card__header {
    display: flex;
    flex-wrap: nowrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
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
  .solar-erp-page .ssl-table--sm { min-width: 540px; }
  .solar-erp-page .ssl-table--md { min-width: 820px; }
  .solar-erp-page .ax-welcome__lede { max-width: 780px; }

  .solar-erp-page .ssl-filter-item { display: flex; align-items: center; gap: 6px; }
  .solar-erp-page .ssl-filter-item select { width: 170px; }

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
    .solar-erp-page .ssl-filter-item { width: 100%; justify-content: space-between; }
    .solar-erp-page .ssl-filter-item select { flex: 1; width: auto; max-width: 100%; }
    .solar-erp-page .ssl-filter-scope { width: 100%; }
    .solar-erp-page .ax-card__header { gap: 10px; }
    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] { max-width: 130px; }
    .solar-erp-page .ssl-sticky-first th:first-child,
    .solar-erp-page .ssl-sticky-first td:first-child {
      position: sticky; left: 0; z-index: 1; background: var(--ax-bg-surface);
      box-shadow: 1px 0 0 var(--ax-border-subtle, #e2e8f0);
    }
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
const I_PIN = svg(<><path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /><path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0" /></>);
const I_BOLT = svg(<path d="M13 3l0 7l6 0l-8 11l0 -7l-6 0l8 -11" />);
const I_DONE = svg(<><path d="M7 12l5 5l10 -10" /><path d="M2 12l5 5m5 -5l5 -5" /></>);
const I_DOC = svg(<><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2" /><path d="M9 13l2 2l4 -4" /></>);
const I_COIN = svg(<><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M14.8 9a2 2 0 0 0 -1.8 -1h-2a2 2 0 1 0 0 4h2a2 2 0 1 1 0 4h-2a2 2 0 0 1 -1.8 -1" /><path d="M12 7v10" /></>);
const I_LIST = svg(<><path d="M9 6l11 0" /><path d="M9 12l11 0" /><path d="M9 18l11 0" /><path d="M5 6l0 .01" /><path d="M5 12l0 .01" /><path d="M5 18l0 .01" /></>);

/* ───────── DLE Exact KPI Card ───────── */
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

const AVATAR_COLORS = ['var(--ax-accent)', 'var(--ax-viz-cyan)', 'var(--ax-viz-violet)', 'var(--ax-viz-amber)', 'var(--ax-viz-pink)'];
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

export function Punjab_Installation_SSL_Dashboard() {
  const navigate = useNavigate();
  const isMobile = useIsMobile(640);
  const [data, setData] = useState<PunjabDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [qDistrict, setQDistrict] = useState<string>('');

  // Status Drilldown Modal State (APIs 10 & 11)
  const [drillModalOpen, setDrillModalOpen] = useState(false);
  const [drillStatus, setDrillStatus] = useState<string>('');
  const [drillDistrict, setDrillDistrict] = useState<string>('');
  const [drillLoading, setDrillLoading] = useState(false);
  const [drillRows, setDrillRows] = useState<PunjabStatusDrillRow[]>([]);
  const [drillSearch, setDrillSearch] = useState('');

  const activeCompanyId = useMemo(() => getCompanyId(), []);

  const chartH = isMobile ? 260 : 320;
  const donutH = isMobile ? 210 : 230;

  const loadDashboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setLoading(true);
    setApiError(null);
    try {
      const resp: any = await punjabSslInstallationService.getDashboardData();
      if (resp) {
        setData((resp?.data && (resp.data.ssl || resp.data.districtwise) ? resp.data : resp) as PunjabDashboardData);
        setUpdatedAt(new Date());
      } else {
        setApiError('Unable to load Punjab SSL dashboard data from server.');
      }
    } catch (err: any) {
      console.warn('Dashboard fetch error:', err);
      setApiError(err?.message || 'Failed to load Punjab SSL installation dashboard.');
    } finally {
      setLoading(false);
      if (isRefresh) setTimeout(() => setIsRefreshing(false), 400);
    }
  }, []);

  useEffect(() => { loadDashboardData(); }, [loadDashboardData]);

  // Status drilldown (API 10 = overall, API 11 = district-wise)
  const openStatusDrilldown = useCallback(async (status: string, district = '') => {
    setDrillStatus(status);
    setDrillDistrict(district);
    setDrillModalOpen(true);
    setDrillLoading(true);
    setDrillSearch('');
    try {
      const rows: any = district
        ? await punjabSslInstallationService.getDashboardByDistrictStatus(status, district)
        : await punjabSslInstallationService.getDashboardByStatus(status);
      setDrillRows(Array.isArray(rows) ? rows : Array.isArray(rows?.data) ? rows.data : []);
    } catch (err) {
      console.error('[Dashboard] drilldown error:', err);
      setDrillRows([]);
    } finally {
      setDrillLoading(false);
    }
  }, []);

  /* ───────── Raw API resolution ───────── */
  const rawApiSsl: any = (data as any)?.ssl || {};
  const pickVal = (...keys: string[]) => {
    for (const k of keys) {
      if (rawApiSsl[k] !== undefined && rawApiSsl[k] !== null) return n(rawApiSsl[k]);
    }
    return 0;
  };

  const rawSsl: SslSummary = useMemo(() => {
    return {
      site_count: pickVal('light_count', 'site_assigned', 'total'),
      complete: pickVal('complete', 'inst_complete'),
      pending: pickVal('pending', 'inst_pending'),
      site_assigned: pickVal('site_assigned', 'assigned'),
      site_not_assigned: pickVal('site_not_assigned', 'not_assigned'),
      verify_pending: pickVal('verify_pending', 'inst_verify_pending'),
      verify_approved: pickVal('verify_approved', 'inst_verify_approved'),
      verify_reject: pickVal('verify_reject', 'inst_verify_reject'),
      claim_applicable: pickVal('claim_applicable'),
      claim_raised: pickVal('claim_raised'),
      claim_approved: pickVal('claim_approved'),
      claim_pending: pickVal('claim_pending'),
      claim_reject: pickVal('claim_reject'),
      inst_pay_done: pickVal('inst_pay_done', 'payment_done'),
      inst_pay_pending: pickVal('inst_pay_pending', 'payment_pending'),
      payment_amount: n((data as any)?.payment_amount),
    };
  }, [data]);

  const districtwise: PunjabDistrictwise[] = useMemo(
    () => (Array.isArray((data as any)?.districtwise) ? (data as any).districtwise : []),
    [data]
  );

  // API returns months in DESCENDING order → reverse so the chart reads oldest → newest
  const monthly: Array<{ month_year: string; monthly_installations: number }> = useMemo(() => {
    const arr = Array.isArray((data as any)?.district_installation_month) ? (data as any).district_installation_month : [];
    return [...arr].reverse();
  }, [data]);

  const topDistricts: Array<{ district: string; inst_complete: number }> = useMemo(() => {
    const arr = Array.isArray((data as any)?.district_install) ? (data as any).district_install : [];
    return [...arr].sort((a, b) => n(b.inst_complete) - n(a.inst_complete));
  }, [data]);

  const filtersActive = selectedDistrict !== 'All';

  const ssl: SslSummary = useMemo(() => {
    if (!filtersActive) return rawSsl;
    const d = districtwise.find((x) => x.district?.toLowerCase() === selectedDistrict.toLowerCase());
    if (!d) return rawSsl;
    return {
      ...rawSsl,
      site_count: n(d.light_count),
      site_assigned: n((d as any).site_assigned),
      site_not_assigned: n((d as any).site_not_assigned),
      complete: n(d.complete),
      pending: n(d.pending),
      verify_approved: n(d.verify_approved),
      verify_pending: n(d.verify_pending),
      verify_reject: n(d.verify_reject),
      claim_applicable: n(d.claim_applicable),
      claim_raised: n(d.claim_raised),
      claim_approved: n(d.claim_approved),
      claim_pending: n(d.claim_pending),
      claim_reject: n((d as any).claim_reject),
      inst_pay_done: n(d.inst_pay_done),
      inst_pay_pending: n(d.inst_pay_pending),
    };
  }, [rawSsl, districtwise, selectedDistrict, filtersActive]);

  const filteredDistrictRows = useMemo(
    () => (filtersActive ? districtwise.filter((d) => d.district?.toLowerCase() === selectedDistrict.toLowerCase()) : districtwise),
    [districtwise, selectedDistrict, filtersActive]
  );

  const districtTotals = useMemo(() => {
    return filteredDistrictRows.reduce(
      (acc, d) => ({
        light_count: acc.light_count + n(d.light_count),
        complete: acc.complete + n(d.complete),
        pending: acc.pending + n(d.pending),
        verify_approved: acc.verify_approved + n(d.verify_approved),
        verify_pending: acc.verify_pending + n(d.verify_pending),
        verify_reject: acc.verify_reject + n(d.verify_reject),
        claim_raised: acc.claim_raised + n(d.claim_raised),
        claim_approved: acc.claim_approved + n(d.claim_approved),
        inst_pay_done: acc.inst_pay_done + n(d.inst_pay_done),
        inst_pay_pending: acc.inst_pay_pending + n(d.inst_pay_pending),
      }),
      { light_count: 0, complete: 0, pending: 0, verify_approved: 0, verify_pending: 0, verify_reject: 0, claim_raised: 0, claim_approved: 0, inst_pay_done: 0, inst_pay_pending: 0 }
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
  }, [qDistrict, selectedDistrict]);

  /* ───────── Derived Values ───────── */
  const dash = (v: number) => (loading && !data ? '…' : num(v));
  const instPct = pctOf(ssl.complete, ssl.site_count);
  const approvedPct = pctOf(ssl.verify_approved, ssl.site_count);
  const claimPct = pctOf(ssl.claim_raised, ssl.complete);
  const payPct = pctOf(ssl.inst_pay_done, ssl.claim_approved || ssl.claim_raised);
  const monthTotal = monthly.reduce((a, m) => a + n(m.monthly_installations), 0);
  const todayLabel = fmtDate(new Date());

  const spk = (pickFn: (d: PunjabDistrictwise) => number) => {
    const arr = districtwise.slice(0, 10).map(pickFn);
    return arr.length > 1 ? arr : undefined;
  };

  const chartDistricts = useMemo(
    () => [...filteredDistrictRows].sort((a, b) => n(b.light_count) - n(a.light_count)).slice(0, 15),
    [filteredDistrictRows]
  );
  const districtChartH = Math.min(560, Math.max(isMobile ? 280 : 320, chartDistricts.length * (isMobile ? 38 : 44)));

  /* ───────── Export Columns & Helpers ───────── */
  const [hiddenDistrictColumns, setHiddenDistrictColumns] = useState<string[]>([]);

  const districtCols: ExportColumn<PunjabDistrictwise>[] = useMemo(
    () => [
      { header: 'District', accessor: (r) => r.district || '' },
      { header: 'Total Lights', accessor: (r) => n(r.light_count) },
      { header: 'Installed Done', accessor: (r) => n(r.complete) },
      { header: 'Install Pending', accessor: (r) => n(r.pending) },
      { header: 'Approved', accessor: (r) => n(r.verify_approved) },
      { header: 'Verify Pending', accessor: (r) => n(r.verify_pending) },
      { header: 'Verify Rejected', accessor: (r) => n(r.verify_reject) },
      { header: 'Claim Raised', accessor: (r) => n(r.claim_raised) },
      { header: 'Claim Approved', accessor: (r) => n(r.claim_approved) },
      { header: 'Payment Done', accessor: (r) => n(r.inst_pay_done) },
      { header: 'Payment Pending', accessor: (r) => n(r.inst_pay_pending) },
      { header: 'Completion %', accessor: (r) => `${pctOf(n(r.complete), n(r.light_count))}%` },
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

  /* ───────── Drilldown Table Filtering ───────── */
  const filteredDrillRows = useMemo(() => {
    const q = drillSearch.trim().toLowerCase();
    if (!q) return drillRows;
    return drillRows.filter((r: any) =>
      String(r.id || '').includes(q) ||
      String(r.unique_id || '').toLowerCase().includes(q) ||
      String(r.district || '').toLowerCase().includes(q) ||
      String(r.block || '').toLowerCase().includes(q) ||
      String(r.panchayat || '').toLowerCase().includes(q)
    );
  }, [drillRows, drillSearch]);

  const pDrill = usePagination({ data: filteredDrillRows, initialPageSize: 10 });

  useEffect(() => {
    pDrill.setPage(1);
  }, [drillSearch, drillRows]);

  /* ───────── Chart Options ───────── */
  const instStatusSeries = [ssl.verify_approved, ssl.verify_pending, ssl.verify_reject, ssl.pending];
  const instStatusLabels = ['Approved', 'Verify Pending', 'Rejected', 'Install Pending'];

  const milestones = [
    { label: '1. Sanctioned SSL Lights', v: ssl.site_count, of: ssl.site_count, color: 'var(--ax-viz-cyan)' },
    { label: '2. Installed & Commissioned', v: ssl.complete, of: ssl.site_count, color: 'var(--ax-accent)' },
    { label: '3. Physically Verified', v: ssl.verify_approved, of: ssl.site_count, color: 'var(--ax-viz-violet)' },
    { label: '4. Claim Raised', v: ssl.claim_raised, of: ssl.site_count, color: 'var(--ax-viz-amber)' },
    { label: '5. Claim Approved', v: ssl.claim_approved, of: ssl.site_count, color: 'var(--ax-viz-emerald)' },
    { label: '6. Payment Disbursed', v: ssl.inst_pay_done, of: ssl.site_count, color: 'var(--ax-viz-emerald)' },
  ];

  const pipeline = [
    { label: 'Claim Applicable', v: ssl.claim_applicable, of: ssl.complete, status: 'claim-applicable', tone: 'violet' },
    { label: 'Claim Raised', v: ssl.claim_raised, of: ssl.claim_applicable, status: 'claim-raised', tone: 'amber' },
    { label: 'Claim Approved', v: ssl.claim_approved, of: ssl.claim_raised, status: 'claim-approved', tone: 'success' },
    { label: 'Claim Pending', v: ssl.claim_pending, of: ssl.claim_raised, status: 'claim-pending', tone: 'warning' },
    { label: 'Payment Done', v: ssl.inst_pay_done, of: ssl.claim_approved, status: 'pay-done', tone: 'success' },
    { label: 'Payment Pending', v: ssl.inst_pay_pending, of: ssl.claim_approved, status: 'pay-pending', tone: 'neutral' },
  ];

  const drillTitle = STATUS_LABELS[drillStatus] || drillStatus;

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      {/* 1. Page Header */}
      <PageHead
        title="SSL Installation Dashboard"
        subtitle={
          <span style={{ display: 'inline-block', fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>
            Punjab State Operations · SSL installation tracking — last updated {updatedAt ? fmtTime(updatedAt) : '—'}
          </span>
        }
        breadcrumbs={[{ label: 'Punjab' }, { label: 'Installation' }, { label: 'SSL' }, { label: 'Dashboard' }]}
        actions={
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill" style={{ fontWeight: 600, paddingInline: 'var(--ax-space-3)' }}>
              <span className="ax-badge__dot" /> State: Punjab
            </span>
            <button type="button" className="ax-btn ax-btn--ghost ax-btn--icon" aria-label="Refresh dashboard" onClick={() => loadDashboardData(true)} disabled={isRefreshing}><span className={isRefreshing ? "ax-spinner" : ""}>{ICON_REFRESH}</span></button>
            <button type="button" className="ax-btn ax-btn--primary ax-btn--sm" onClick={() => navigate("/v/punjab/ssl/installation/update-light-deatils")}>+ Install Light</button>
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
          aria-label="SSL Dashboard Filters"
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

              <div className="ax-cluster ssl-filter-item" style={{ alignItems: 'center' }}>
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

            <div className="ax-cluster ssl-filter-scope" style={{ gap: 'var(--ax-space-2)', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>
                Showing <b style={{ color: 'var(--ax-text-strong)' }}>{dash(ssl.site_count)}</b> lights · Company <b style={{ color: 'var(--ax-accent)' }}>#{activeCompanyId}</b> · Live: <b style={{ color: 'var(--ax-text-strong)' }}>{todayLabel}</b>
              </span>
            </div>
          </div>
        </section>

        {/* 3. Executive Welcome Banner */}
        <section className="ax-card ax-welcome ax-col--12" role="region" aria-label="Punjab SSL Installation Overview">
          <div className="ax-welcome__body">
            <div className="ax-welcome__text">
              <p className="ax-welcome__eyebrow">SSL Installation Management System · State Hub</p>
              <h2 className="ax-card__title">Welcome to Punjab SSL Installation Dashboard</h2>
              <p className="ax-welcome__lede">
                Punjab state installation overview: <b>{dash(ssl.site_count)} lights</b> tracked across <b>{dash(filtersActive ? 1 : districtwise.length)} districts</b>.
                <b> {dash(ssl.complete)} ({instPct}%)</b> lights installed, with <b>{dash(ssl.verify_approved)} ({approvedPct}%)</b> physically verified and approved.
              </p>
            </div>

            <dl className="ax-welcome__stats">
              <div className="ax-welcome__stat">
                <dt>Total Lights</dt>
                <dd className="ax-num">{dash(ssl.site_count)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-emerald)' }}>{dash(filtersActive ? 1 : districtwise.length)} Districts</small>
              </div>
              <div className="ax-welcome__stat">
                <dt>Installation Done</dt>
                <dd className="ax-num">{dash(ssl.complete)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-accent)' }}>{instPct}% Done</small>
              </div>
              <div className="ax-welcome__stat">
                <dt>Approved</dt>
                <dd className="ax-num">{dash(ssl.verify_approved)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-cyan)' }}>{approvedPct}% Approved</small>
              </div>
              <div className="ax-welcome__stat">
                <dt>Payment Disbursed</dt>
                <dd className="ax-num">{dash(ssl.inst_pay_done)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-emerald)' }}>{payPct}% Paid</small>
              </div>
            </dl>
          </div>
        </section>

        {/* 4. KPI Cards */}
        <div className="ax-col--12">
          <div className="ax-cluster" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={sectionHeadStyle}>SSL Operational Metrics &amp; Approval Status</h4>
            <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>Click card to inspect matching lights</span>
          </div>
        </div>

        <KpiCard
          icon={I_PIN} tone="accent" label="Total SSL Lights"
          value={dash(ssl.site_count)} sub="Sanctioned Site Count"
          spark={spk((d) => n(d.light_count))}
          onClick={() => openStatusDrilldown('total-light', filtersActive ? selectedDistrict : '')}
        />
        <KpiCard
          icon={I_PIN} tone="violet" label="Site Allocation"
          value={loading && !data ? '…' : `${ssl.site_assigned} / ${ssl.site_not_assigned}`}
          sub="Assigned / Not Assigned"
          onClick={() => openStatusDrilldown('assign-light', filtersActive ? selectedDistrict : '')}
        />
        <KpiCard
          icon={I_BOLT} tone="cyan" label="Installation Status"
          value={loading && !data ? '…' : `${ssl.complete} / ${ssl.pending}`}
          sub="Installed / Pending" badge={`${instPct}% Done`}
          spark={spk((d) => n(d.complete))}
          onClick={() => openStatusDrilldown('installed-light', filtersActive ? selectedDistrict : '')}
        />
        <KpiCard
          icon={I_DONE} tone="emerald" label="Verification Status"
          value={loading && !data ? '…' : `${ssl.verify_approved} / ${ssl.verify_pending} / ${ssl.verify_reject}`}
          sub="Approved / Pending / Rejected" badge={`${approvedPct}% Approved`}
          spark={spk((d) => n(d.verify_approved))}
          onClick={() => openStatusDrilldown('verify-light', filtersActive ? selectedDistrict : '')}
        />
        <KpiCard
          icon={I_DOC} tone="red" label="Verification Rejected"
          value={dash(ssl.verify_reject)} sub="Needs Rectification"
          onClick={() => openStatusDrilldown('verify-reject-light', filtersActive ? selectedDistrict : '')}
        />
        <KpiCard
          icon={I_LIST} tone="violet" label="Claim Applicable"
          value={dash(ssl.claim_applicable)} sub="Eligible for Invoice"
          onClick={() => openStatusDrilldown('claim-applicable', filtersActive ? selectedDistrict : '')}
        />
        <KpiCard
          icon={I_LIST} tone="amber" label="Claim Status"
          value={loading && !data ? '…' : `${ssl.claim_raised} / ${ssl.claim_pending}`}
          sub="Raised / Pending" badge={ssl.claim_raised > 0 ? `${claimPct}% Claimed` : undefined}
          spark={spk((d) => n(d.claim_raised))}
          onClick={() => openStatusDrilldown('claim-raised', filtersActive ? selectedDistrict : '')}
        />
        <KpiCard
          icon={I_DONE} tone="emerald" label="Claim Approval"
          value={loading && !data ? '…' : `${ssl.claim_approved} / ${ssl.claim_pending} / ${ssl.claim_reject}`}
          sub="Approved / Pending / Rejected"
          badge={ssl.claim_approved > 0 ? 'Approved' : undefined}
          onClick={() => openStatusDrilldown('claim-approved', filtersActive ? selectedDistrict : '')}
        />
        <KpiCard
          icon={I_COIN} tone="emerald" label="Payment Done"
          value={dash(ssl.inst_pay_done)} sub="Disbursed to Vendor"
          badge={ssl.inst_pay_done > 0 ? `${payPct}% Paid` : undefined}
          spark={spk((d) => n(d.inst_pay_done))}
          onClick={() => openStatusDrilldown('pay-done', filtersActive ? selectedDistrict : '')}
        />
        <KpiCard
          icon={I_COIN} tone="cyan" label="Payment Pending"
          value={dash(ssl.inst_pay_pending)} sub="Awaiting Release"
          onClick={() => openStatusDrilldown('pay-pending', filtersActive ? selectedDistrict : '')}
        />
        <KpiCard
          icon={I_COIN} tone="amber" label="Total Payment Amount"
          value={loading && !data ? '…' : cur(rawSsl.payment_amount)}
          sub="Disbursed Settlement (All Districts)"
          badge={rawSsl.payment_amount > 0 ? 'Disbursed' : undefined}
        />
        <KpiCard
          icon={I_BOLT} tone="pink" label="Install Pending"
          value={dash(ssl.pending)} sub="Yet to be installed"
          onClick={() => openStatusDrilldown('not-installed-light', filtersActive ? selectedDistrict : '')}
        />

        {/* 5. Monthly trend (8) + Donut (4) */}
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
              <p className="ax-card__subtitle">Total {dash(ssl.site_count)} lights</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
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
                  colors: [LIGHT_GREEN, LIGHT_BLUE, LIGHT_RED, LIGHT_AMBER],
                  stroke: { width: 0 },
                  plotOptions: {
                    pie: {
                      donut: {
                        size: '72%',
                        labels: {
                          show: true,
                          name: { fontFamily: cv('--ax-font-sans') },
                          value: { fontFamily: cv('--ax-font-mono'), fontWeight: 600 },
                          total: { show: true, label: 'Lights', formatter: () => num(ssl.site_count) },
                        },
                      },
                    },
                  },
                }}
              />
            </Suspense>
            <ul className="ax-list ax-list--compact" style={{ marginTop: 'var(--ax-space-3)' }}>
              {[
                { label: 'Approved', sub: `${approvedPct}% of total`, v: ssl.verify_approved, color: LIGHT_GREEN },
                { label: 'Verify Pending', sub: 'Awaiting verification', v: ssl.verify_pending, color: LIGHT_BLUE },
                { label: 'Rejected', sub: 'Correction needed', v: ssl.verify_reject, color: LIGHT_RED },
                { label: 'Install Pending', sub: 'In progress', v: ssl.pending, color: LIGHT_AMBER },
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

        {/* 6. District chart (8) + Milestones (4) */}
        <section className="ax-card ax-card--chart ax-col--8" role="region" aria-label="District wise installations">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Geographic Breakdown</span>
              <h2 className="ax-card__title">District-wise Installation Statistics</h2>
              <p className="ax-card__subtitle">Lights by progress across Punjab districts · click bar to filter</p>
            </div>
            <div className="ax-card__actions">
              <span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--pill">{dash(districtwise.length)} Districts</span>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            {chartDistricts.length > 0 ? (
              <Suspense fallback={<div className="ax-skeleton" style={{ height: districtChartH }} />}>
                <ApexChart
                  key={`bar-${districtChartH}-${chartDistricts.length}-${ssl.site_count}`}
                  type="bar"
                  height={districtChartH}
                  legend="top"
                  stacked
                  ariaLabel="Horizontal stacked bar of lights per district by progress"
                  series={[
                    { name: 'Installed', data: chartDistricts.map((d) => n(d.complete)) },
                    { name: 'Pending', data: chartDistricts.map((d) => Math.max(0, n(d.light_count) - n(d.complete))) },
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
              <TableEmptyState title="No district records" message="District progress appears once lights are allocated." />
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

        {/* 7. District-wise table */}
        <section className="ax-card ax-col--12" role="region" aria-label="District wise data">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Enterprise Data Analytics</span>
              <h2 className="ax-card__title">District Wise Installation Breakdown</h2>
              <p className="ax-card__subtitle">Progress across installation, physical verification, claims and payments</p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                <SearchInput value={qDistrict} onChange={setQDistrict} placeholder="Search district..." size="sm" />
                <TableExportToolbar
                  onCopy={() => copyToClipboard(tableDistricts, visibleColumns(districtCols, hiddenDistrictColumns))}
                  onExportCSV={() => exportToCSV(tableDistricts, visibleColumns(districtCols, hiddenDistrictColumns), `Punjab_SSL_District_Wise_${stamp}`)}
                  onExportExcel={() => exportToExcel(tableDistricts, visibleColumns(districtCols, hiddenDistrictColumns), `Punjab_SSL_District_Wise_${stamp}`)}
                  onExportPDF={() => exportToPDF(tableDistricts, visibleColumns(districtCols, hiddenDistrictColumns), 'Punjab SSL District Wise Installation Breakdown')}
                  columns={districtToolbarColumns}
                  onToggleColumn={toggleIn(setHiddenDistrictColumns)}
                />
              </div>
            </div>
          </div>
          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover ssl-table--md ssl-sticky-first">
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">District</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Total Lights</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Install (Done / Pend)</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Verification (App / Pend / Rej)</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Claims (Raised / Appr)</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Payment (Done / Pend)</th>
                  <th className="ax-table__th" scope="col">Progress</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody aria-busy={loading}>
                {loading && !data ? (
                  <tr><td className="ax-table__td" colSpan={8} style={emptyCellStyle}><span className="ax-spinner" /> Loading district records…</td></tr>
                ) : pD.paginatedData.length === 0 ? (
                  <tr><td className="ax-table__td" colSpan={8} style={emptyCellStyle}>No districts match the filters.</td></tr>
                ) : (
                  pD.paginatedData.map((d) => {
                    const total = n(d.light_count);
                    const rowPct = pctOf(n(d.complete), total);
                    const isSelected = selectedDistrict.toLowerCase() === d.district.toLowerCase();
                    const open = (status: string) => () => {
                      setSelectedDistrict(d.district);
                      openStatusDrilldown(status, d.district);
                    };

                    return (
                      <tr
                        key={d.district}
                        className="ax-table__row"
                        role="button"
                        tabIndex={0}
                        onClick={open('total-light')}
                        onKeyDown={onActivate(open('total-light'))}
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
                            <span className="ax-badge ax-badge--soft ax-badge--success" style={{ fontWeight: 600, padding: '2px 7px' }}>{num(n(d.complete))}</span>
                            <span style={{ color: 'var(--ax-text-muted)', fontSize: '11px' }}>/</span>
                            <span className="ax-badge ax-badge--soft ax-badge--neutral" style={{ fontWeight: 600, padding: '2px 7px' }}>{num(n(d.pending))}</span>
                          </div>
                        </td>
                        <td className="ax-table__td ax-table__td--num">
                          <div className="ax-cluster" style={{ justifyContent: 'flex-end', gap: '4px' }}>
                            <span className="ax-badge ax-badge--soft ax-badge--success" style={{ padding: '2px 6px', fontSize: '11px' }} title="Approved">
                              <span className="ax-badge__dot" />{num(n(d.verify_approved))}
                            </span>
                            <span className="ax-badge ax-badge--soft ax-badge--warning" style={{ padding: '2px 6px', fontSize: '11px' }} title="Pending Verify">
                              {num(n(d.verify_pending))}
                            </span>
                            <span className="ax-badge ax-badge--soft ax-badge--danger" style={{ padding: '2px 6px', fontSize: '11px' }} title="Rejected">
                              {num(n(d.verify_reject))}
                            </span>
                          </div>
                        </td>
                        <td className="ax-table__td ax-table__td--num">
                          <span style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>{num(n(d.claim_raised))}</span>
                          <span style={{ color: 'var(--ax-text-muted)' }}> / </span>
                          <span style={{ color: 'var(--ax-text-muted)' }}>{num(n(d.claim_approved))}</span>
                        </td>
                        <td className="ax-table__td ax-table__td--num">
                          <span style={{ fontWeight: 600, color: 'var(--ax-viz-emerald)' }}>{num(n(d.inst_pay_done))}</span>
                          <span style={{ color: 'var(--ax-text-muted)' }}> / </span>
                          <span style={{ color: 'var(--ax-text-muted)' }}>{num(n(d.inst_pay_pending))}</span>
                        </td>
                        <td className="ax-table__td">
                          <Bar pct={rowPct} />
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="ax-btn ax-btn--secondary ax-btn--sm"
                            style={{ height: 26, padding: '0 8px', fontSize: '11px', gap: '4px' }}
                            onClick={(e) => { e.stopPropagation(); open('total-light')(); }}
                            title={`Inspect lights in ${d.district}`}
                          >
                            {ICON_EYE}
                            <span className="ax-btn__label">Lights</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
                {tableDistricts.length > 0 && (
                  <tr className="ax-table__row" style={{ background: 'var(--ax-surface-subtle)', fontWeight: 'var(--ax-weight-bold)' }}>
                    <td className="ax-table__td" style={{ color: 'var(--ax-text-strong)', background: 'var(--ax-surface-subtle)' }}>Total ({filteredDistrictRows.length} Districts)</td>
                    <td className="ax-table__td ax-table__td--num ax-num">{num(districtTotals.light_count)}</td>
                    <td className="ax-table__td ax-table__td--num">
                      <div className="ax-cluster" style={{ justifyContent: 'flex-end', gap: '4px' }}>
                        <span className="ax-badge ax-badge--soft ax-badge--success" style={{ fontWeight: 700 }}>{num(districtTotals.complete)}</span>
                        <span>/</span>
                        <span className="ax-badge ax-badge--soft ax-badge--neutral" style={{ fontWeight: 700 }}>{num(districtTotals.pending)}</span>
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
                      <span style={{ fontWeight: 700 }}>{num(districtTotals.claim_raised)}</span>
                      <span> / </span>
                      <span>{num(districtTotals.claim_approved)}</span>
                    </td>
                    <td className="ax-table__td ax-table__td--num">
                      <span style={{ fontWeight: 700 }}>{num(districtTotals.inst_pay_done)}</span>
                      <span> / </span>
                      <span>{num(districtTotals.inst_pay_pending)}</span>
                    </td>
                    <td className="ax-table__td">
                      <Bar pct={Math.round(pctOf(districtTotals.complete, districtTotals.light_count))} />
                    </td>
                    <td />
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="ax-card__footer" style={footerStyle}>
            <div className="ssl-pagination-left">
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

      {/* 9. Status drilldown modal (APIs 10 & 11) */}
      {drillModalOpen && (
        <div className="ax-modal" role="dialog" aria-modal="true" aria-label="Status drilldown" style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={() => setDrillModalOpen(false)} />
          <div
            className="ax-card"
            style={{
              position: 'relative', width: '92%', maxWidth: 960, maxHeight: '85vh', display: 'flex', flexDirection: 'column',
              background: 'var(--ax-bg-surface)', borderRadius: 'var(--ax-radius-xl)', boxShadow: 'var(--ax-shadow-2xl)', overflow: 'hidden', zIndex: 10,
            }}
          >
            <div className="ax-card__header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--ax-border-subtle)', background: 'var(--ax-surface-subtle)' }}>
              <div className="ax-card__titles" style={{ maxWidth: '85%' }}>
                <span className="ax-card__eyebrow">Punjab SSL · Status Drilldown</span>
                <h2 className="ax-card__title">
                  {drillTitle} {drillDistrict && <span style={{ color: 'var(--ax-accent)' }}>· {drillDistrict}</span>}{' '}
                  <span style={{ color: 'var(--ax-text-muted)', fontWeight: 500 }}>({drillLoading ? '…' : drillRows.length})</span>
                </h2>
              </div>
              <button type="button" className="ax-btn ax-btn--ghost ax-btn--icon" onClick={() => setDrillModalOpen(false)} aria-label="Close modal">✕</button>
            </div>

            <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--ax-border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ width: 280, maxWidth: '100%' }}>
                <SearchInput value={drillSearch} onChange={setDrillSearch} placeholder="Filter lights..." size="sm" />
              </div>
              <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
                Showing {pDrill.paginatedData.length} of {filteredDrillRows.length} records
              </span>
            </div>

            <div className="ax-table-wrap" style={{ flex: 1, overflowY: 'auto' }}>
              <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap', width: '100%' }}>
                <thead className="ax-table__head">
                  <tr>
                    <th className="ax-table__th" scope="col">Sr.</th>
                    <th className="ax-table__th" scope="col">ID</th>
                    <th className="ax-table__th" scope="col">Unique ID</th>
                    <th className="ax-table__th" scope="col">District</th>
                    <th className="ax-table__th" scope="col">Block</th>
                    <th className="ax-table__th" scope="col">Panchayat</th>
                    <th className="ax-table__th" scope="col">Install Status</th>
                  </tr>
                </thead>
                <tbody aria-busy={drillLoading}>
                  {drillLoading ? (
                    <tr><td colSpan={7} style={emptyCellStyle}><span className="ax-spinner" style={{ marginRight: 8 }} /> Loading lights from server…</td></tr>
                  ) : pDrill.paginatedData.length === 0 ? (
                    <tr><td colSpan={7} style={emptyCellStyle}>No lights found for this status.</td></tr>
                  ) : (
                    pDrill.paginatedData.map((row: any, idx: number) => (
                      <tr key={row.id || idx} className="ax-table__row">
                        <td className="ax-table__td" style={{ color: 'var(--ax-text-muted)' }}>{(pDrill.currentPage - 1) * pDrill.pageSize + idx + 1}</td>
                        <td className="ax-table__td ax-num" style={{ fontWeight: 600 }}>#{row.id}</td>
                        <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: '12px', fontWeight: 600, color: 'var(--ax-accent)' }}>{row.unique_id || '—'}</td>
                        <td className="ax-table__td">{row.district || '—'}</td>
                        <td className="ax-table__td">{row.block || '—'}</td>
                        <td className="ax-table__td">{row.panchayat || '—'}</td>
                        <td className="ax-table__td">
                          {Number(row.inst_status) === 1 ? (
                            <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill">Installed</span>
                          ) : (
                            <span className="ax-badge ax-badge--soft ax-badge--warning ax-badge--pill">Pending</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="ax-card__footer" style={footerStyle}>
              <div className="ssl-pagination-left">
                <Pagination
                  currentPage={pDrill.currentPage}
                  totalItems={pDrill.totalItems}
                  pageSize={pDrill.pageSize}
                  onPageChange={pDrill.setPage}
                  onPageSizeChange={pDrill.setPageSize}
                  pageSizeOptions={[10, 25, 50, 100]}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Punjab_Installation_SSL_Dashboard;
