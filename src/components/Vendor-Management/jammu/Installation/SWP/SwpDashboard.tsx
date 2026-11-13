import { lazy, Suspense, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  Pagination,
  usePagination,
  SearchInput,
  TableExportToolbar,
  type ExportColumn,
} from '../../../../../common';
import {
  jammuAdminSwpService,
  JAMMU_SWP_DISTRICTS,
} from './jammuSwpAdminService';
import {
  type JammuSwpDashboardData,
  type JammuSwpDistrictwiseRow,
  type JammuSwpMonthlyInstall,
} from '../../../../V-Portal/jammu/jammu-services';

// Code-split ApexCharts so shell renders instantly
const ApexChart = lazy(() => import('../../../../charts/ApexChart').then((m) => ({ default: m.ApexChart })));

// Palette constants matching Solar ERP design language
const LIGHT_BLUE = '#2563eb';
const LIGHT_GREEN = '#10b981';
const LIGHT_CYAN = '#0891b2';
const LIGHT_AMBER = '#f59e0b';
const LIGHT_VIOLET = '#7c3aed';
const LIGHT_RED = '#ef4444';

const num = (x: number | string | undefined | null) => Number(x || 0).toLocaleString('en-IN');
const pctOf = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : 0);
const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Responsive chart height hook matching DleDashboard
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

/* ───────── Responsive page CSS (Exact Solar ERP reference) ───────── */
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

  /* Card header: prioritize title width, condense actions */
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

  /* Search: shrink when space is tight */
  .solar-erp-page .ax-card__actions .ax-search,
  .solar-erp-page .ax-card__actions [class*="search"] {
    flex: 1 1 140px;
    min-width: 90px;
    max-width: 260px;
  }
  .solar-erp-page .ax-card__actions input { min-width: 0; width: 100%; }

  /* Export toolbar: compact layout */
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
  .solar-erp-page .ax-table { min-width: 850px; }
  .solar-erp-page .ax-welcome__lede { max-width: 820px; }

  /* Filter bar matching DleDashboard */
  .solar-erp-page .asw-filter-item { display: flex; align-items: center; gap: 6px; }
  .solar-erp-page .asw-filter-item select { width: 165px; }

  /* Interactive KPI cursor & hover */
  .asw-interactive-kpi {
    cursor: pointer;
    transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
  }
  .asw-interactive-kpi:hover {
    transform: translateY(-2px);
    box-shadow: var(--ax-shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
    border-color: rgba(var(--asw-primary-rgb), 0.35) !important;
  }

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

  /* Mobile (<=760px): Stack and full width */
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
    .solar-erp-page .asw-filter-item { width: 100%; justify-content: space-between; }
    .solar-erp-page .asw-filter-item select { flex: 1; width: auto; max-width: 100%; }

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

/* ───────── Clean SVG Icons matching ERP design language ───────── */
const svg = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const I_PIN = svg(<><path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /><path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0" /></>);
const I_BOLT = svg(<path d="M13 3l0 7l6 0l-8 11l0 -7l-6 0l8 -11" />);
const I_CLOCK = svg(<><path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M12 7v5l3 3" /></>);
const I_DONE = svg(<><path d="M7 12l5 5l10 -10" /><path d="M2 12l5 5m5 -5l5 -5" /></>);
const I_X = svg(<><path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M10 10l4 4m0 -4l-4 4" /></>);
const I_SHIELD = svg(<><path d="M12 3a12 12 0 0 0 8.5 3a12 12 0 0 1 -8.5 15a12 12 0 0 1 -8.5 -15a12 12 0 0 0 8.5 -3" /><path d="M9 12l2 2l4 -4" /></>);
const I_DOC = svg(<><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" /><path d="M9 9l1 0" /><path d="M9 13l6 0" /><path d="M9 17l6 0" /></>);
const I_CREDIT = svg(<><rect x="3" y="5" width="18" height="14" rx="3" /><line x1="3" y1="10" x2="21" y2="10" /><line x1="7" y1="15" x2="7.01" y2="15" /><line x1="11" y1="15" x2="13" y2="15" /></>);

/* ───────── KPI card Component matching DLE Dashboard ───────── */
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
  accent: { bg: 'rgba(37, 99, 235, 0.12)', fg: '#2563eb', apex: '#2563eb' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan, #06b6d4) 14%, transparent)', fg: '#0891b2', apex: '#0891b2' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald, #10b981) 14%, transparent)', fg: '#16a34a', apex: '#16a34a' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber, #f59e0b) 14%, transparent)', fg: '#d97706', apex: '#d97706' },
  violet: { bg: 'color-mix(in oklab, var(--ax-viz-violet, #8b5cf6) 14%, transparent)', fg: '#7c3aed', apex: '#7c3aed' },
  pink: { bg: 'color-mix(in oklab, var(--ax-viz-pink, #ec4899) 14%, transparent)', fg: '#db2777', apex: '#db2777' },
  red: { bg: 'color-mix(in oklab, var(--ax-viz-red, #ef4444) 14%, transparent)', fg: '#dc2626', apex: '#dc2626' },
};

function KpiCard({ icon, tone, label, value, unit, sub, badge, spark, sparkType = 'line', onClick }: KpiProps) {
  const t = TONE[tone];
  const hasSpark = Array.isArray(spark) && spark.length > 1;

  return (
    <div
      className={`ax-card ax-col--3 ${onClick ? 'asw-interactive-kpi' : ''}`}
      role={onClick ? 'button' : 'region'}
      tabIndex={onClick ? 0 : undefined}
      aria-label={label}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
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
              {value} {unit && <small style={{ fontSize: '11px', fontWeight: 500, color: 'var(--ax-text-muted)' }}>{unit}</small>}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--ax-text-muted)', marginTop: '2px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div>
          </div>
          {hasSpark && (
            <div style={{ width: 68, height: 26, overflow: 'hidden', flexShrink: 0 }}>
              <Suspense fallback={<div style={{ width: 68, height: 26 }} />}>
                <ApexChart
                  key={`${label}-${spark!.join(',')}-${sparkType}`}
                  type={sparkType}
                  sparkline
                  tooltip={false}
                  height={26}
                  color={t.apex}
                  series={[{ name: label, data: spark! }]}
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

const actionsRowStyle = { gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', width: '100%' } as const;
const labelStyle = { fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)', fontWeight: 500 } as const;
const footerStyle = { borderTop: '1px solid var(--ax-border, #e2e8f0)', padding: 'var(--ax-space-3) var(--ax-space-4)' } as const;

export function SwpDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<JammuSwpDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  // Filter states
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [tableQuery, setTableQuery] = useState<string>('');

  // Chart heights
  const chartH = useChartHeight(320, 260);
  const donutH = useChartHeight(230, 210);

  // 1. Load Dashboard Data
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const res = await jammuAdminSwpService.getDashboard();
      setData(res);
      setUpdatedAt(new Date());
    } catch (err: any) {
      console.error('Jammu Dashboard fetch error:', err);
      setApiError(err?.message || 'Failed to fetch dynamic dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Status Drill-down Navigation
  const openDrillDown = (statusKey: string, _label?: string, district?: string) => {
    const targetDistrict = district && district !== 'All' ? district : (selectedDistrict !== 'All' ? selectedDistrict : undefined);
    const params = new URLSearchParams();
    params.set('status', statusKey);
    if (targetDistrict) {
      params.set('district', targetDistrict);
    }
    navigate(`/vendor-management/jammu/installation/swp/status-view?${params.toString()}`);
  };

  const districtwise: JammuSwpDistrictwiseRow[] = useMemo(() => data?.districtwise || [], [data]);
  const monthlyInstallations: JammuSwpMonthlyInstall[] = useMemo(
    () => data?.district_installation_month || [],
    [data]
  );

  // District options for filter
  const districtOptions = useMemo(
    () => [...new Set(districtwise.map((d) => d.district).filter(Boolean))].sort(),
    [districtwise]
  );

  // Filtered district rows based on selectedDistrict and selectedStatus
  const filteredDistricts = useMemo(() => {
    return districtwise.filter((d) => {
      const matchDistrict = selectedDistrict === 'All' || d.district.toLowerCase() === selectedDistrict.toLowerCase();
      let matchStatus = true;
      if (selectedStatus === 'Complete') matchStatus = (d.complete || 0) > 0;
      else if (selectedStatus === 'Pending') matchStatus = (d.pending || 0) > 0;
      else if (selectedStatus === 'VerifyApproved') matchStatus = (d.verify_approved || 0) > 0;
      else if (selectedStatus === 'VerifyPending') matchStatus = (d.verify_pending || 0) > 0;
      else if (selectedStatus === 'VerifyReject') matchStatus = (d.verify_reject || 0) > 0;
      else if (selectedStatus === 'DocApproved') matchStatus = (d.doc_submitted || 0) > 0;
      else if (selectedStatus === 'DocPending') matchStatus = (d.doc_pending || 0) > 0;
      else if (selectedStatus === 'ClaimRaised') matchStatus = (d.claim_raised || 0) > 0;
      else if (selectedStatus === 'ClaimApproved') matchStatus = (d.claim_approved || 0) > 0;
      else if (selectedStatus === 'PayComplete') matchStatus = (d.pay_done || 0) > 0;
      else if (selectedStatus === 'PayPending') matchStatus = (d.pay_pending || 0) > 0;
      return matchDistrict && matchStatus;
    });
  }, [districtwise, selectedDistrict, selectedStatus]);

  const rawSwp = useMemo(() => data?.swp || {
    site_count: 0,
    complete: 0,
    pending: 0,
    verify_pending: 0,
    verify_approved: 0,
    verify_reject: 0,
    doc_submitted: 0,
    doc_pending: 0,
    claim_applicable: 0,
    claim_raised: 0,
    claim_approved: 0,
    pay_done: 0,
    pay_partially: 0,
    pay_pending: 0,
  }, [data]);

  // Dynamic swp metrics
  const swp = useMemo(() => {
    if (selectedDistrict === 'All' && selectedStatus === 'All') {
      return rawSwp;
    }
    if (filteredDistricts.length === 0) {
      return {
        site_count: 0,
        complete: 0,
        pending: 0,
        verify_pending: 0,
        verify_approved: 0,
        verify_reject: 0,
        doc_submitted: 0,
        doc_pending: 0,
        claim_applicable: 0,
        claim_raised: 0,
        claim_approved: 0,
        pay_done: 0,
        pay_partially: 0,
        pay_pending: 0,
      };
    }
    return filteredDistricts.reduce(
      (acc, d) => ({
        site_count: acc.site_count + (Number(d.site_count) || 0),
        complete: acc.complete + (Number(d.complete) || 0),
        pending: acc.pending + (Number(d.pending) || 0),
        verify_pending: acc.verify_pending + (Number(d.verify_pending) || 0),
        verify_approved: acc.verify_approved + (Number(d.verify_approved) || 0),
        verify_reject: acc.verify_reject + (Number(d.verify_reject) || 0),
        doc_submitted: acc.doc_submitted + (Number(d.doc_submitted) || 0),
        doc_pending: acc.doc_pending + (Number(d.doc_pending) || 0),
        claim_applicable: acc.claim_applicable + (Number(d.claim_applicable) || 0),
        claim_raised: acc.claim_raised + (Number(d.claim_raised) || 0),
        claim_approved: acc.claim_approved + (Number(d.claim_approved) || 0),
        pay_done: acc.pay_done + (Number(d.pay_done) || 0),
        pay_partially: acc.pay_partially + (Number(d.pay_partially) || 0),
        pay_pending: acc.pay_pending + (Number(d.pay_pending) || 0),
      }),
      {
        site_count: 0,
        complete: 0,
        pending: 0,
        verify_pending: 0,
        verify_approved: 0,
        verify_reject: 0,
        doc_submitted: 0,
        doc_pending: 0,
        claim_applicable: 0,
        claim_raised: 0,
        claim_approved: 0,
        pay_done: 0,
        pay_partially: 0,
        pay_pending: 0,
      }
    );
  }, [rawSwp, filteredDistricts, selectedDistrict, selectedStatus]);

  // Derived metrics
  const installRate = useMemo(() => pctOf(swp.complete, swp.site_count), [swp]);
  const verifyRate = useMemo(() => pctOf(swp.verify_approved, swp.complete), [swp]);

  // Sparkline data generators
  const sparkAlloc = useMemo(() => districtwise.slice(0, 7).map((d) => Number(d.site_count) || 0), [districtwise]);
  const sparkInstalled = useMemo(() => districtwise.slice(0, 7).map((d) => Number(d.complete) || 0), [districtwise]);
  const sparkPending = useMemo(() => districtwise.slice(0, 7).map((d) => Number(d.pending) || 0), [districtwise]);
  const sparkApproved = useMemo(() => districtwise.slice(0, 7).map((d) => Number(d.verify_approved) || 0), [districtwise]);
  const sparkVerifyPending = useMemo(() => districtwise.slice(0, 7).map((d) => Number(d.verify_pending) || 0), [districtwise]);
  const sparkVerifyReject = useMemo(() => districtwise.slice(0, 7).map((d) => Number(d.verify_reject) || 0), [districtwise]);
  const sparkDocApproved = useMemo(() => districtwise.slice(0, 7).map((d) => Number(d.doc_submitted) || 0), [districtwise]);
  const sparkDocPending = useMemo(() => districtwise.slice(0, 7).map((d) => Number(d.doc_pending) || 0), [districtwise]);
  const sparkClaimApproved = useMemo(() => districtwise.slice(0, 7).map((d) => Number(d.claim_approved) || 0), [districtwise]);
  const sparkPayDone = useMemo(() => districtwise.slice(0, 7).map((d) => Number(d.pay_done) || 0), [districtwise]);

  // Table search & pagination
  const searchedDistricts = useMemo(() => {
    const q = tableQuery.trim().toLowerCase();
    if (!q) return filteredDistricts;
    return filteredDistricts.filter((d) => (d.district || '').toLowerCase().includes(q));
  }, [filteredDistricts, tableQuery]);

  const pagination = usePagination({
    totalItems: searchedDistricts.length,
    initialPageSize: 10,
  });

  const pagedDistricts = useMemo(() => {
    const start = (pagination.currentPage - 1) * pagination.pageSize;
    return searchedDistricts.slice(start, start + pagination.pageSize);
  }, [searchedDistricts, pagination.currentPage, pagination.pageSize]);

  // Export Columns
  const exportColumns: ExportColumn[] = useMemo(
    () => [
      { key: 'district', header: 'District' },
      { key: 'site_count', header: 'Allocated Sites' },
      { key: 'complete', header: 'Installed' },
      { key: 'pending', header: 'Pending' },
      { key: 'verify_approved', header: 'Verify Approved' },
      { key: 'verify_pending', header: 'Verify Pending' },
      { key: 'verify_reject', header: 'Verify Rejected' },
      { key: 'doc_submitted', header: 'Docs Submitted' },
      { key: 'doc_pending', header: 'Docs Pending' },
      { key: 'claim_raised', header: 'Claims Raised' },
      { key: 'pay_done', header: 'Paid Sites' },
    ],
    []
  );

  // 1. District Comparison Chart Series & Options
  const topDistricts = useMemo(() => districtwise.slice(0, 8), [districtwise]);
  const districtChartSeries = useMemo(() => [
    { name: 'Allocated Sites', data: topDistricts.map((d) => Number(d.site_count) || 0) },
    { name: 'Installed Pumps', data: topDistricts.map((d) => Number(d.complete) || 0) },
    { name: 'Audit Approved', data: topDistricts.map((d) => Number(d.verify_approved) || 0) },
  ], [topDistricts]);

  const districtChartOptions = useMemo(() => ({
    chart: { type: 'bar' as const, toolbar: { show: false }, fontFamily: 'inherit' },
    plotOptions: { bar: { horizontal: false, columnWidth: '50%', borderRadius: 4 } },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 2, colors: ['transparent'] },
    colors: [LIGHT_BLUE, LIGHT_GREEN, LIGHT_AMBER],
    xaxis: {
      categories: topDistricts.map((d) => d.district),
      labels: { style: { colors: '#64748b', fontSize: '11px' } },
    },
    yaxis: { labels: { style: { colors: '#64748b', fontSize: '11px' } } },
    grid: { borderColor: '#f1f5f9' },
    tooltip: { theme: 'light', y: { formatter: (val: number) => `${num(val)} sites` } },
    legend: { position: 'top' as const, horizontalAlign: 'right' as const, fontSize: '12px' },
  }), [topDistricts]);

  // 2. Status Donut Chart Series & Options
  const donutSeries = useMemo(() => [
    Number(swp.verify_approved) || 0,
    Number(swp.verify_pending) || 0,
    Number(swp.verify_reject) || 0,
    Number(swp.pending) || 0,
  ], [swp]);

  const donutOptions = useMemo(() => ({
    chart: { type: 'donut' as const, fontFamily: 'inherit' },
    labels: ['Verified Approved', 'Verify Pending', 'Verify Rejected', 'Pending Installation'],
    colors: [LIGHT_GREEN, LIGHT_AMBER, LIGHT_RED, LIGHT_CYAN],
    legend: { position: 'bottom' as const, fontSize: '11px', labels: { colors: '#64748b' } },
    dataLabels: { enabled: true },
    stroke: { width: 2, colors: ['#ffffff'] },
    tooltip: { theme: 'light', y: { formatter: (val: number) => `${num(val)} pumps` } },
  }), []);

  // 3. Monthly Installation Area Chart Series & Options
  const monthlySeries = useMemo(() => [
    {
      name: 'Installed Units',
      data: monthlyInstallations.map((m) => Number(m.monthly_installations) || 0),
    },
  ], [monthlyInstallations]);

  const monthlyOptions = useMemo(() => ({
    chart: { type: 'area' as const, toolbar: { show: false }, fontFamily: 'inherit' },
    colors: [LIGHT_BLUE],
    fill: {
      type: 'gradient',
      gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.05, stops: [0, 90, 100] },
    },
    stroke: { curve: 'smooth' as const, width: 2.5 },
    dataLabels: { enabled: false },
    xaxis: {
      categories: monthlyInstallations.map((m) => m.month_year),
      labels: { style: { colors: '#64748b', fontSize: '11px' } },
    },
    yaxis: { labels: { style: { colors: '#64748b', fontSize: '11px' } } },
    grid: { borderColor: '#f1f5f9' },
    tooltip: { theme: 'light', y: { formatter: (val: number) => `${num(val)} pumps` } },
  }), [monthlyInstallations]);

  return (
    <div className="solar-erp-page ax-page">
      <style>{PAGE_CSS}</style>

      {/* Page Header */}
      <PageHead
        eyebrow="Super Admin · Vendor Management"
        title="Jammu SWP Installation Dashboard"
        subtitle="Real-time operations, vendor work allocations, and technical audit overview for PM-KUSUM Solar Water Pumping across Jammu & Kashmir"
        actions={
          <div className="ax-cluster" style={actionsRowStyle}>
            {updatedAt && (
              <span style={labelStyle}>
                Refreshed {updatedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={loadDashboardData}
              disabled={loading}
              title="Refresh dashboard metrics"
            >
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}>
                <path d="M23 4v6h-6" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        }
      />

      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" style={{ marginBottom: 16 }}>
        <ol className="ax-breadcrumb" style={{ display: 'flex', gap: 6, listStyle: 'none', padding: 0, margin: 0, fontSize: 13, color: 'var(--ax-text-muted)' }}>
          <li><Link to="/vendor-management" style={{ color: 'var(--asw-primary)' }}>Home</Link></li>
          <li>/</li>
          <li><Link to="/vendor-management" style={{ color: 'var(--asw-primary)' }}>Vendor Management</Link></li>
          <li>/</li>
          <li><Link to="/vendor-management/jammu" style={{ color: 'var(--asw-primary)' }}>Jammu</Link></li>
          <li>/</li>
          <li style={{ color: 'var(--ax-text-strong)', fontWeight: 600 }}>SWP Installation</li>
        </ol>
      </nav>

      {/* Error Alert */}
      {apiError && (
        <div className="ax-card" style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, marginBottom: 16, color: '#dc2626', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>{apiError} (Loaded cached operational metrics)</span>
          <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" onClick={() => setApiError(null)} style={{ color: '#dc2626' }}>Dismiss</button>
        </div>
      )}

      {/* Welcome Banner */}
      <section className="ax-card ax-welcome" aria-labelledby="jammu-swp-welcome" style={{ padding: '20px 24px', borderRadius: 12, marginBottom: 20, background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)', border: '1px solid #bfdbfe' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ maxWidth: 700 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: LIGHT_BLUE }}>
              PM-KUSUM Component-B Operations · Jammu & Kashmir
            </span>
            <h2 id="jammu-swp-welcome" style={{ margin: '4px 0 8px', fontSize: '1.4rem', fontWeight: 800, color: 'var(--ax-text-strong)' }}>
              Operational Performance & Technical Audit Register
            </h2>
            <p className="ax-welcome__lede" style={{ margin: 0, fontSize: 13, color: 'var(--ax-text-muted)', lineHeight: 1.5 }}>
              Central monitoring desk for solar water pumping allocations, vendor installations, field evidence audits, farmer handover certificates (HOC), and disbursement clearance across all 20 districts of UT Jammu & Kashmir.
            </p>
          </div>
          <div className="ax-welcome__stats" style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ padding: '10px 16px', background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', minWidth: 120 }}>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Total Allotted</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{num(swp.site_count)}</div>
              <div style={{ fontSize: 10, color: '#10b981', fontWeight: 600 }}>100% Volume Target</div>
            </div>
            <div style={{ padding: '10px 16px', background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', minWidth: 120 }}>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Completed</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: LIGHT_GREEN }}>{num(swp.complete)}</div>
              <div style={{ fontSize: 10, color: LIGHT_GREEN, fontWeight: 600 }}>{installRate}% Installed</div>
            </div>
            <div style={{ padding: '10px 16px', background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', minWidth: 120 }}>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Audited Approved</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: LIGHT_BLUE }}>{num(swp.verify_approved)}</div>
              <div style={{ fontSize: 10, color: LIGHT_BLUE, fontWeight: 600 }}>{verifyRate}% Audit Pass</div>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Toolbar */}
      <section className="ax-card" aria-label="Filters" style={{ padding: '12px 16px', borderRadius: 10, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, background: '#ffffff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div className="asw-filter-item">
            <label style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>District:</label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="ax-form-control"
              style={{ padding: '6px 10px', fontSize: 12, borderRadius: 6, border: '1px solid #cbd5e1' }}
            >
              <option value="All">All Districts ({districtOptions.length})</option>
              {districtOptions.map((dist) => (
                <option key={dist} value={dist}>{dist}</option>
              ))}
            </select>
          </div>

          <div className="asw-filter-item">
            <label style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Status:</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="ax-form-control"
              style={{ padding: '6px 10px', fontSize: 12, borderRadius: 6, border: '1px solid #cbd5e1' }}
            >
              <option value="All">All Stages</option>
              <option value="Complete">Installed ({num(rawSwp.complete)})</option>
              <option value="Pending">Pending Installation ({num(rawSwp.pending)})</option>
              <option value="VerifyApproved">Audit Approved ({num(rawSwp.verify_approved)})</option>
              <option value="VerifyPending">Audit Pending ({num(rawSwp.verify_pending)})</option>
              <option value="VerifyReject">Audit Rejected ({num(rawSwp.verify_reject)})</option>
              <option value="DocApproved">HOC Submitted ({num(rawSwp.doc_submitted)})</option>
              <option value="DocPending">HOC Pending ({num(rawSwp.doc_pending)})</option>
              <option value="ClaimRaised">Claim Raised ({num(rawSwp.claim_raised)})</option>
              <option value="PayComplete">Payments Settled ({num(rawSwp.pay_done)})</option>
            </select>
          </div>

          {(selectedDistrict !== 'All' || selectedStatus !== 'All') && (
            <button
              type="button"
              className="ax-btn ax-btn--ghost ax-btn--sm"
              onClick={() => { setSelectedDistrict('All'); setSelectedStatus('All'); }}
              style={{ fontSize: 12, color: '#ef4444' }}
            >
              Reset Filters
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: '#64748b' }}>
            Showing <strong>{filteredDistricts.length}</strong> of <strong>{districtwise.length}</strong> regional clusters
          </span>
        </div>
      </section>

      {/* 10 Interactive KPI Cards (4 + 3 + 3 Grid) */}
      <section className="ax-dash-grid ax-grid ax-grid--12" aria-label="Key Performance Indicators" style={{ gap: 14, marginBottom: 24 }}>
        <KpiCard
          icon={I_PIN}
          tone="accent"
          label="Total Allotted Sites"
          value={num(swp.site_count)}
          sub="Sanctioned PM-KUSUM units"
          badge="Allocated"
          spark={sparkAlloc}
          onClick={() => openDrillDown('total', 'Total Sites')}
        />
        <KpiCard
          icon={I_BOLT}
          tone="emerald"
          label="Installed Pumps"
          value={num(swp.complete)}
          sub={`${installRate}% of target achieved`}
          badge={`${installRate}%`}
          spark={sparkInstalled}
          onClick={() => openDrillDown('installed', 'Installed Pumps')}
        />
        <KpiCard
          icon={I_CLOCK}
          tone="cyan"
          label="Pending Installation"
          value={num(swp.pending)}
          sub="Under civil / piping work"
          badge="In Progress"
          spark={sparkPending}
          onClick={() => openDrillDown('pending', 'Pending Installation')}
        />
        <KpiCard
          icon={I_DONE}
          tone="emerald"
          label="Audit Approved"
          value={num(swp.verify_approved)}
          sub={`${verifyRate}% of completed installations`}
          badge="Verified"
          spark={sparkApproved}
          onClick={() => openDrillDown('verify-approved', 'Audit Approved')}
        />
        <KpiCard
          icon={I_CLOCK}
          tone="amber"
          label="Audit Pending"
          value={num(swp.verify_pending)}
          sub="Awaiting engineer site inspection"
          badge="Pending Review"
          spark={sparkVerifyPending}
          onClick={() => openDrillDown('verify-pending', 'Audit Pending')}
        />
        <KpiCard
          icon={I_X}
          tone="red"
          label="Audit Rejected"
          value={num(swp.verify_reject)}
          sub="Flagged for rectification"
          badge="Correction Req."
          spark={sparkVerifyReject}
          onClick={() => openDrillDown('verify-reject', 'Audit Rejected')}
        />
        <KpiCard
          icon={I_DOC}
          tone="emerald"
          label="HOC Docs Ready"
          value={num(swp.doc_submitted)}
          sub="Farmer certificates submitted"
          badge="Docs Received"
          spark={sparkDocApproved}
          onClick={() => openDrillDown('doc-approved', 'HOC Submitted')}
        />
        <KpiCard
          icon={I_CLOCK}
          tone="amber"
          label="HOC Docs Pending"
          value={num(swp.doc_pending)}
          sub="Signoff pending from sarpanch/farmer"
          badge="Awaiting Signoff"
          spark={sparkDocPending}
          onClick={() => openDrillDown('doc-pending', 'HOC Pending')}
        />
        <KpiCard
          icon={I_SHIELD}
          tone="emerald"
          label="Claims Approved"
          value={num(swp.claim_approved)}
          sub="Cleared for PFMS treasury"
          badge="Approved"
          spark={sparkClaimApproved}
          onClick={() => openDrillDown('claim-approved', 'Claims Approved')}
        />
        <KpiCard
          icon={I_CREDIT}
          tone="emerald"
          label="Payments Settled"
          value={num(swp.pay_done)}
          sub="Disbursed to vendor account"
          badge="Settled"
          spark={sparkPayDone}
          onClick={() => openDrillDown('pay-complete', 'Payments Settled')}
        />
      </section>

      {/* Workflow Milestones Tracker */}
      <section className="ax-card" aria-label="Workflow Milestones" style={{ padding: '18px 24px', borderRadius: 12, marginBottom: 24, background: '#ffffff' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '1.05rem', fontWeight: 700, color: 'var(--ax-text-strong)' }}>
          PM-KUSUM Execution Lifecycle Milestones
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 14 }}>
          {/* Step 1 */}
          <div style={{ padding: '12px 14px', borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: LIGHT_BLUE, marginBottom: 4 }}>Step 1 · Allocation</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{num(swp.site_count)} Units</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Work orders issued</div>
            <Link to="/vendor-management/jammu/installation/swp/assign-installation" style={{ fontSize: 11, color: LIGHT_BLUE, fontWeight: 600, display: 'inline-block', marginTop: 6 }}>
              Assign Sites →
            </Link>
          </div>

          {/* Step 2 */}
          <div style={{ padding: '12px 14px', borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: LIGHT_GREEN, marginBottom: 4 }}>Step 2 · Installation</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{num(swp.complete)} Pumps</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{num(swp.pending)} in progress</div>
            <Link to="/vendor-management/jammu/installation/swp/view-assign-installation" style={{ fontSize: 11, color: LIGHT_BLUE, fontWeight: 600, display: 'inline-block', marginTop: 6 }}>
              View Sites →
            </Link>
          </div>

          {/* Step 3 */}
          <div style={{ padding: '12px 14px', borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: LIGHT_AMBER, marginBottom: 4 }}>Step 3 · Tech Audit</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{num(swp.verify_approved)} Passed</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{num(swp.verify_pending)} pending</div>
            <Link to="/vendor-management/jammu/installation/swp/verify-installation" style={{ fontSize: 11, color: LIGHT_BLUE, fontWeight: 600, display: 'inline-block', marginTop: 6 }}>
              Audit Desk →
            </Link>
          </div>

          {/* Step 4 */}
          <div style={{ padding: '12px 14px', borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: LIGHT_VIOLET, marginBottom: 4 }}>Step 4 · HOC Handover</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{num(swp.doc_submitted)} Certified</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{num(swp.doc_pending)} awaiting</div>
            <Link to="/vendor-management/jammu/installation/swp/verify-document" style={{ fontSize: 11, color: LIGHT_BLUE, fontWeight: 600, display: 'inline-block', marginTop: 6 }}>
              Verify HOC →
            </Link>
          </div>

          {/* Step 5 */}
          <div style={{ padding: '12px 14px', borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', marginBottom: 4 }}>Step 5 · Settlement</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{num(swp.pay_done)} Paid</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{num(swp.pay_pending)} in queue</div>
            <Link to="/vendor-management/jammu/installation/swp/view-payment" style={{ fontSize: 11, color: LIGHT_BLUE, fontWeight: 600, display: 'inline-block', marginTop: 6 }}>
              Payment Desk →
            </Link>
          </div>
        </div>
      </section>

      {/* Analytics Charts Grid */}
      <section className="ax-grid ax-grid--12" aria-label="Visual Analytics" style={{ gap: 20, marginBottom: 24 }}>
        {/* District Comparison Bar Chart */}
        <div className="ax-card ax-col--8" style={{ padding: '18px 22px', borderRadius: 12, background: '#ffffff' }}>
          <div className="ax-card__header" style={{ marginBottom: 12 }}>
            <div className="ax-card__titles">
              <h4 className="ax-card__title" style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                District-wise Deployment Throughput
              </h4>
              <p className="ax-card__subtitle" style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>
                Comparing allocated targets against field completions and certified installations
              </p>
            </div>
          </div>
          <div style={{ minHeight: chartH }}>
            <Suspense fallback={<div style={{ height: chartH, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>Loading chart data...</div>}>
              <ApexChart
                type="bar"
                height={chartH}
                series={districtChartSeries}
                options={districtChartOptions}
              />
            </Suspense>
          </div>
        </div>

        {/* Installation Status Donut Chart */}
        <div className="ax-card ax-col--4" style={{ padding: '18px 22px', borderRadius: 12, background: '#ffffff' }}>
          <div className="ax-card__header" style={{ marginBottom: 12 }}>
            <div className="ax-card__titles">
              <h4 className="ax-card__title" style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                Audit Status Breakdown
              </h4>
              <p className="ax-card__subtitle" style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>
                Technical inspection proportions
              </p>
            </div>
          </div>
          <div style={{ minHeight: donutH, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Suspense fallback={<div style={{ height: donutH, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>Loading donut...</div>}>
              <ApexChart
                type="donut"
                height={donutH}
                series={donutSeries}
                options={donutOptions}
              />
            </Suspense>
          </div>
        </div>
      </section>

      {/* Monthly Installation Trend Area Chart */}
      {monthlyInstallations.length > 0 && (
        <section className="ax-card" aria-label="Monthly Trend" style={{ padding: '18px 22px', borderRadius: 12, marginBottom: 24, background: '#ffffff' }}>
          <div className="ax-card__header" style={{ marginBottom: 12 }}>
            <div className="ax-card__titles">
              <h4 className="ax-card__title" style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                Monthly Installation Run-Rate
              </h4>
              <p className="ax-card__subtitle" style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>
                Commissioned pump volume trajectory across recent billing cycles
              </p>
            </div>
          </div>
          <div style={{ minHeight: 220 }}>
            <Suspense fallback={<div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>Loading monthly trend...</div>}>
              <ApexChart
                type="area"
                height={220}
                series={monthlySeries}
                options={monthlyOptions}
              />
            </Suspense>
          </div>
        </section>
      )}

      {/* District Performance & Execution Register Table */}
      <section className="ax-card" aria-label="District Register" style={{ borderRadius: 12, overflow: 'hidden', background: '#ffffff' }}>
        <div className="ax-card__header" style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0' }}>
          <div className="ax-card__titles">
            <h3 className="ax-card__title" style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
              District Operations & Performance Register
            </h3>
            <p className="ax-card__subtitle" style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>
              Comprehensive progress tracking across all regional distribution circles in Jammu & Kashmir
            </p>
          </div>

          <div className="ax-card__actions">
            <div className="ax-cluster">
              <SearchInput
                value={tableQuery}
                onChange={setTableQuery}
                placeholder="Search district..."
              />
              <TableExportToolbar
                data={searchedDistricts}
                columns={exportColumns}
                filename="Jammu_SWP_District_Register"
              />
            </div>
          </div>
        </div>

        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: 700, textAlign: 'left' }}>
                <th style={{ padding: '12px 16px' }}>District</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>Target Sites</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>Installed</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>Pending</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>Audit Pass</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>Audit Pend</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>Rejected</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>HOC Ready</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>Paid Sites</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Completion %</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Drill-Down</th>
              </tr>
            </thead>
            <tbody>
              {pagedDistricts.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: 32, color: '#64748b' }}>
                    No regional data found matching search criteria.
                  </td>
                </tr>
              ) : (
                pagedDistricts.map((row) => {
                  const compPct = pctOf(row.complete, row.site_count);
                  return (
                    <tr key={row.district} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0f172a' }}>
                        {row.district}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        {num(row.site_count)}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 600, color: LIGHT_GREEN, fontVariantNumeric: 'tabular-nums' }}>
                        {num(row.complete)}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', color: LIGHT_CYAN, fontVariantNumeric: 'tabular-nums' }}>
                        {num(row.pending)}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', color: LIGHT_BLUE, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                        {num(row.verify_approved)}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', color: LIGHT_AMBER, fontVariantNumeric: 'tabular-nums' }}>
                        {num(row.verify_pending)}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', color: row.verify_reject > 0 ? LIGHT_RED : '#94a3b8', fontVariantNumeric: 'tabular-nums' }}>
                        {num(row.verify_reject)}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', color: LIGHT_VIOLET, fontVariantNumeric: 'tabular-nums' }}>
                        {num(row.doc_submitted)}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', color: '#059669', fontVariantNumeric: 'tabular-nums' }}>
                        {num(row.pay_done)}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 44, height: 6, borderRadius: 3, background: '#e2e8f0', overflow: 'hidden' }}>
                            <div style={{ width: `${Math.min(compPct, 100)}%`, height: '100%', background: compPct >= 80 ? LIGHT_GREEN : compPct >= 40 ? LIGHT_BLUE : LIGHT_AMBER }} />
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 600, color: '#334155' }}>{compPct}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <button
                          type="button"
                          className="ax-btn ax-btn--ghost ax-btn--sm"
                          onClick={() => openDrillDown('total', row.district, row.district)}
                          style={{ fontSize: 11, color: LIGHT_BLUE, fontWeight: 600 }}
                        >
                          View Sites →
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="ax-card__footer" style={footerStyle}>
          <div className="ula-pagination-left">
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={pagination.setCurrentPage}
            />
          </div>
        </div>
      </section>

      {/* Quick Navigation Shortcuts */}
      <section style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 12 }}>
        <Link to="/vendor-management/jammu/installation/swp/assign-installation" className="ax-card" style={{ padding: '14px 16px', borderRadius: 10, textAlign: 'center', textDecoration: 'none', color: '#0f172a', border: '1px solid #e2e8f0', transition: 'all 0.15s' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: LIGHT_BLUE }}>Assign Installation</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Work order allocation</div>
        </Link>
        <Link to="/vendor-management/jammu/installation/swp/view-assign-installation" className="ax-card" style={{ padding: '14px 16px', borderRadius: 10, textAlign: 'center', textDecoration: 'none', color: '#0f172a', border: '1px solid #e2e8f0', transition: 'all 0.15s' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: LIGHT_BLUE }}>View Assigned</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Master contract register</div>
        </Link>
        <Link to="/vendor-management/jammu/installation/swp/verify-installation" className="ax-card" style={{ padding: '14px 16px', borderRadius: 10, textAlign: 'center', textDecoration: 'none', color: '#0f172a', border: '1px solid #e2e8f0', transition: 'all 0.15s' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: LIGHT_GREEN }}>Verify Installation</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Technical audit desk</div>
        </Link>
        <Link to="/vendor-management/jammu/installation/swp/verify-document" className="ax-card" style={{ padding: '14px 16px', borderRadius: 10, textAlign: 'center', textDecoration: 'none', color: '#0f172a', border: '1px solid #e2e8f0', transition: 'all 0.15s' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: LIGHT_VIOLET }}>Verify Document</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Farmer HOC audit</div>
        </Link>
        <Link to="/vendor-management/jammu/installation/swp/verify-claim" className="ax-card" style={{ padding: '14px 16px', borderRadius: 10, textAlign: 'center', textDecoration: 'none', color: '#0f172a', border: '1px solid #e2e8f0', transition: 'all 0.15s' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: LIGHT_AMBER }}>Verify Claim</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Vendor invoice audit</div>
        </Link>
        <Link to="/vendor-management/jammu/installation/swp/view-payment" className="ax-card" style={{ padding: '14px 16px', borderRadius: 10, textAlign: 'center', textDecoration: 'none', color: '#0f172a', border: '1px solid #e2e8f0', transition: 'all 0.15s' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#059669' }}>View Payment</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Disbursement ledger</div>
        </Link>
      </section>
    </div>
  );
}

export default SwpDashboard;
