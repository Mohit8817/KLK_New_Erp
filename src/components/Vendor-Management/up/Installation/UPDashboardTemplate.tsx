import { lazy, Suspense, useDeferredValue, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { PageHead } from '../../../shell/PageHead';
import {
  Pagination,
  usePagination,
  SearchInput,
  TableExportToolbar,
  type ExportColumn,
} from '../../../../common';
import {
  copyRowsToClipboard,
  exportRowsCSV,
  exportRowsExcel,
  exportRowsPDF,
} from './upInstallationShared';

const ApexChart = lazy(() => import('../../../charts/ApexChart').then((m) => ({ default: m.ApexChart })));

export const DASH_COLORS = {
  BLUE: '#2563eb',
  GREEN: '#10b981',
  CYAN: '#0891b2',
  AMBER: '#f59e0b',
  VIOLET: '#7c3aed',
  RED: '#ef4444',
  PINK: '#ec4899',
};

export const dashNum = (x: number | string | undefined | null) => {
  const n = Number(x);
  return isNaN(n) ? '0' : n.toLocaleString('en-IN');
};

export const dashPct = (a: number | string | undefined | null, b: number | string | undefined | null) => {
  const numA = Number(a) || 0;
  const numB = Number(b) || 0;
  return numB ? Math.round((numA / numB) * 1000) / 10 : 0;
};

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

/* ───────── Exact AssamSwpDashboard / Solar ERP Responsive CSS ───────── */
export const DASHBOARD_PAGE_CSS = `
  .solar-erp-page {
    --asw-primary: var(--ax-accent, #2563eb);
    --asw-primary-rgb: var(--ax-accent-rgb, 37, 99, 235);
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
  .solar-erp-page .ax-card__actions .ax-search,
  .solar-erp-page .ax-card__actions [class*="search"] {
    flex: 1 1 140px;
    min-width: 90px;
    max-width: 260px;
  }
  .solar-erp-page .ax-card__actions input { min-width: 0; width: 100%; }
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
  .solar-erp-page .ax-table-wrap,
  .solar-erp-page .ax-table-wrapper {
    width: 100%;
    max-width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  .solar-erp-page .ax-table { min-width: 900px; }
  .solar-erp-page .ax-welcome__lede { max-width: 860px; }

  .solar-erp-page .asw-filter-item { display: flex; align-items: center; gap: 6px; }
  .solar-erp-page .asw-filter-item select { width: 165px; }

  .asw-interactive-kpi {
    cursor: pointer;
    transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
  }
  .asw-interactive-kpi:hover {
    transform: translateY(-2px);
    box-shadow: var(--ax-shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
    border-color: rgba(var(--asw-primary-rgb), 0.35) !important;
  }

  @media (max-width: 1100px) {
    .solar-erp-page .ax-col--8,
    .solar-erp-page .ax-col--6,
    .solar-erp-page .ax-col--4 { grid-column: span 12; }
    .solar-erp-page .ax-col--3 { grid-column: span 6; }

    .solar-erp-page .ax-export-toolbar__button {
      font-size: 0; gap: 0; padding: 0 8px !important; justify-content: center;
    }
    .solar-erp-page .ax-export-toolbar__button svg { width: 16px; height: 16px; flex-shrink: 0; }
    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] { max-width: 200px; }
  }

  @media (max-width: 760px) {
    .solar-erp-page { width: 100%; max-width: 100%; overflow-x: hidden; box-sizing: border-box; }
    .solar-erp-page .ax-welcome__stats { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
    .solar-erp-page .ax-grid--2 { grid-template-columns: 1fr !important; }
    .solar-erp-page .asw-filter-item { width: 100%; justify-content: space-between; }
    .solar-erp-page .asw-filter-item select { flex: 1; width: auto; max-width: 100%; }

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

const svg = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

export const DASH_ICONS = {
  PIN: svg(<><path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /><path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0" /></>),
  BOLT: svg(<path d="M13 3l0 7l6 0l-8 11l0 -7l-6 0l8 -11" />),
  CLOCK: svg(<><path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M12 7v5l3 3" /></>),
  DONE: svg(<><path d="M7 12l5 5l10 -10" /><path d="M2 12l5 5m5 -5l5 -5" /></>),
  X: svg(<><path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M10 10l4 4m0 -4l-4 4" /></>),
  SHIELD: svg(<><path d="M12 3a12 12 0 0 0 8.5 3a12 12 0 0 1 -8.5 15a12 12 0 0 1 -8.5 -15a12 12 0 0 0 8.5 -3" /><path d="M9 12l2 2l4 -4" /></>),
  DOC: svg(<><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" /><path d="M9 9l1 0" /><path d="M9 13l6 0" /><path d="M9 17l6 0" /></>),
  CREDIT: svg(<><rect x="3" y="5" width="18" height="14" rx="3" /><line x1="3" y1="10" x2="21" y2="10" /><line x1="7" y1="15" x2="7.01" y2="15" /><line x1="11" y1="15" x2="13" y2="15" /></>),
  USER: svg(<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>),
  FILTER: (
    <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 4h16v2.172a2 2 0 0 1 -.586 1.414l-4.828 4.828v7.586l-4 -2v-5.586l-4.828 -4.828a2 2 0 0 1 -.586 -1.414v-2.172z" />
    </svg>
  ),
};

export interface DashKpiProps {
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

const KPI_TONE: Record<DashKpiProps['tone'], { bg: string; fg: string; apex: string }> = {
  accent: { bg: 'rgba(37, 99, 235, 0.12)', fg: '#2563eb', apex: '#2563eb' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan, #06b6d4) 14%, transparent)', fg: '#0891b2', apex: '#0891b2' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald, #10b981) 14%, transparent)', fg: '#16a34a', apex: '#16a34a' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber, #f59e0b) 14%, transparent)', fg: '#d97706', apex: '#d97706' },
  violet: { bg: 'color-mix(in oklab, var(--ax-viz-violet, #8b5cf6) 14%, transparent)', fg: '#7c3aed', apex: '#7c3aed' },
  pink: { bg: 'color-mix(in oklab, var(--ax-viz-pink, #ec4899) 14%, transparent)', fg: '#db2777', apex: '#db2777' },
  red: { bg: 'color-mix(in oklab, var(--ax-viz-red, #ef4444) 14%, transparent)', fg: '#dc2626', apex: '#dc2626' },
};

export function DashKpiCard({ icon, tone, label, value, unit, sub, badge, spark, sparkType = 'line', onClick }: DashKpiProps) {
  const t = KPI_TONE[tone];
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

/* ───────── Normalized Data Contract for All 3 UP Dashboards ───────── */
export interface NormalizedUpTotals {
  total: number;
  assigned: number;
  accepted: number;
  not_assigned: number;
  complete: number;
  pending: number;
  verify_approved: number;
  verify_pending: number;
  verify_reject: number;
  claim_applicable: number;
  claim_raised: number;
  claim_approved: number;
  claim_pending: number;
  claim_reject: number;
  pay_complete: number;
  pay_partially: number;
  pay_pending: number;
}

export interface NormalizedDistrictRow {
  district: string;
  total: number;
  assigned: number;
  not_assigned: number;
  complete: number;
  pending: number;
  verify_approved: number;
  verify_pending: number;
  verify_reject: number;
  claim_raised: number;
  claim_approved: number;
  claim_reject: number;
  pay_complete: number;
  pay_partially: number;
  pay_pending: number;
}

export interface NormalizedVendorRow {
  vendor_id: string | number;
  vendor_name: string;
  today_install: number;
  site_count: number;
  complete: number;
  pending: number;
  verify_approved: number;
  verify_pending: number;
  verify_reject: number;
  claim_raised: number;
  claim_approved: number;
  claim_reject: number;
  pay_complete: number;
  pay_partially: number;
  pay_pending: number;
}

export interface NormalizedMonthRow {
  month_year: string;
  monthly_installations: number;
}

export interface UPDashboardTemplateProps {
  pageTitle: string;
  pageSubtitle: string;
  moduleName: string; // e.g. 'Kusum C' | 'Resco' | 'SSL 18W'
  programEyebrow: string;
  welcomeHeading: string;
  unitLabel: string; // 'Sites' | 'Lights'
  unitShort: string; // 'pumps' | 'sites' | 'lights'
  fileBase: string;
  updatedAt: Date | null;
  loading: boolean;
  apiError: string | null;
  totals: NormalizedUpTotals;
  districts: NormalizedDistrictRow[];
  vendors: NormalizedVendorRow[];
  monthly: NormalizedMonthRow[];
  extraWelcomeStat?: { label: string; value: string; sub: string; color?: string };
  routes: {
    statusRegister: string;
    assign: string;
    viewAssign: string;
    verify: string;
    viewClaim: string;
    viewPayment: string;
  };
  onDrillDown?: (statusKey: string, extra?: { district?: string; vendor?: string | number }) => void;
  extraBottomSection?: ReactNode;
  extraTopSection?: ReactNode;
}

const actionsRowStyle = { gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', width: '100%' } as const;
const labelStyle = { fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)', fontWeight: 500 } as const;
const footerStyle = { borderTop: '1px solid var(--ax-border, #e2e8f0)', padding: 'var(--ax-space-3) var(--ax-space-4)' } as const;

export function UPDashboardTemplate({
  pageTitle,
  pageSubtitle,
  moduleName,
  programEyebrow,
  welcomeHeading,
  unitLabel,
  unitShort,
  fileBase,
  updatedAt,
  loading,
  apiError,
  totals: rawTotals,
  districts,
  vendors,
  monthly,
  extraWelcomeStat,
  routes,
  onDrillDown,
  extraBottomSection,
  extraTopSection,
}: UPDashboardTemplateProps) {
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [tableQuery, setTableQuery] = useState<string>('');
  const [vendorQuery, setVendorQuery] = useState<string>('');

  const chartH = useChartHeight(320, 260);
  const donutH = useChartHeight(230, 210);

  const districtOptions = useMemo(
    () => [...new Set(districts.map((d) => d.district).filter(Boolean))].sort(),
    [districts]
  );

  const filteredDistricts = useMemo(() => {
    return districts.filter((d) => {
      const matchDistrict = selectedDistrict === 'All' || d.district.toLowerCase() === selectedDistrict.toLowerCase();
      let matchStatus = true;
      if (selectedStatus === 'Complete') matchStatus = d.complete > 0;
      else if (selectedStatus === 'Pending') matchStatus = d.pending > 0;
      else if (selectedStatus === 'Assigned') matchStatus = d.assigned > 0;
      else if (selectedStatus === 'NotAssigned') matchStatus = d.not_assigned > 0;
      else if (selectedStatus === 'VerifyApproved') matchStatus = d.verify_approved > 0;
      else if (selectedStatus === 'VerifyPending') matchStatus = d.verify_pending > 0;
      else if (selectedStatus === 'VerifyReject') matchStatus = d.verify_reject > 0;
      else if (selectedStatus === 'ClaimRaised') matchStatus = d.claim_raised > 0;
      else if (selectedStatus === 'ClaimApproved') matchStatus = d.claim_approved > 0;
      else if (selectedStatus === 'PayComplete') matchStatus = d.pay_complete > 0;
      else if (selectedStatus === 'PayPending') matchStatus = d.pay_pending > 0;
      return matchDistrict && matchStatus;
    });
  }, [districts, selectedDistrict, selectedStatus]);

  const totals: NormalizedUpTotals = useMemo(() => {
    if (selectedDistrict === 'All' && selectedStatus === 'All') return rawTotals;
    if (filteredDistricts.length === 0) {
      return {
        total: 0, assigned: 0, accepted: 0, not_assigned: 0, complete: 0, pending: 0,
        verify_approved: 0, verify_pending: 0, verify_reject: 0,
        claim_applicable: 0, claim_raised: 0, claim_approved: 0, claim_pending: 0, claim_reject: 0,
        pay_complete: 0, pay_partially: 0, pay_pending: 0,
      };
    }
    return filteredDistricts.reduce<NormalizedUpTotals>(
      (acc, d) => ({
        total: acc.total + d.total,
        assigned: acc.assigned + d.assigned,
        accepted: acc.accepted + d.assigned,
        not_assigned: acc.not_assigned + d.not_assigned,
        complete: acc.complete + d.complete,
        pending: acc.pending + d.pending,
        verify_approved: acc.verify_approved + d.verify_approved,
        verify_pending: acc.verify_pending + d.verify_pending,
        verify_reject: acc.verify_reject + d.verify_reject,
        claim_applicable: acc.claim_applicable,
        claim_raised: acc.claim_raised + d.claim_raised,
        claim_approved: acc.claim_approved + d.claim_approved,
        claim_pending: acc.claim_pending,
        claim_reject: acc.claim_reject + d.claim_reject,
        pay_complete: acc.pay_complete + d.pay_complete,
        pay_partially: acc.pay_partially + d.pay_partially,
        pay_pending: acc.pay_pending + d.pay_pending,
      }),
      {
        total: 0, assigned: 0, accepted: 0, not_assigned: 0, complete: 0, pending: 0,
        verify_approved: 0, verify_pending: 0, verify_reject: 0,
        claim_applicable: 0, claim_raised: 0, claim_approved: 0, claim_pending: 0, claim_reject: 0,
        pay_complete: 0, pay_partially: 0, pay_pending: 0,
      }
    );
  }, [rawTotals, filteredDistricts, selectedDistrict, selectedStatus]);

  const filtersActive = selectedDistrict !== 'All' || selectedStatus !== 'All';

  const deferredDistrictQuery = useDeferredValue(tableQuery);
  const tableDistricts = useMemo(() => {
    const q = deferredDistrictQuery.trim().toLowerCase();
    return filteredDistricts.filter((d) => !q || d.district.toLowerCase().includes(q));
  }, [filteredDistricts, deferredDistrictQuery]);

  const districtPagination = usePagination(tableDistricts, { initialPageSize: 100 });
  useEffect(() => {
    districtPagination.setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableQuery, selectedDistrict, selectedStatus]);

  const deferredVendorQuery = useDeferredValue(vendorQuery);
  const tableVendors = useMemo(() => {
    const q = deferredVendorQuery.trim().toLowerCase();
    return vendors.filter((v) => !q || v.vendor_name.toLowerCase().includes(q) || String(v.vendor_id).includes(q));
  }, [vendors, deferredVendorQuery]);

  const vendorPagination = usePagination(tableVendors, { initialPageSize: 10 });
  useEffect(() => {
    vendorPagination.setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorQuery]);

  const sortedMonthly = useMemo(
    () => [...monthly].sort((a, b) => (a.month_year || '').localeCompare(b.month_year || '')),
    [monthly]
  );

  const pctComplete = dashPct(totals.complete, totals.total);
  const pctPending = dashPct(totals.pending, totals.total);
  const pctVerified = dashPct(totals.verify_approved, totals.complete || 1);
  const pctClaimApproved = dashPct(totals.claim_approved, totals.claim_raised || totals.complete || 1);
  const pctPaid = dashPct(totals.pay_complete, totals.complete || 1);

  const chartDistricts = useMemo(
    () => [...filteredDistricts].sort((a, b) => b.complete - a.complete).slice(0, 15),
    [filteredDistricts]
  );

  const siteSpark = filteredDistricts.length > 1 ? filteredDistricts.slice(0, 10).map((d) => d.total) : undefined;
  const completeSpark = filteredDistricts.length > 1 ? filteredDistricts.slice(0, 10).map((d) => d.complete) : undefined;
  const pendingSpark = filteredDistricts.length > 1 ? filteredDistricts.slice(0, 10).map((d) => d.pending) : undefined;
  const verifySpark = filteredDistricts.length > 1 ? filteredDistricts.slice(0, 10).map((d) => d.verify_approved) : undefined;
  const paySpark = filteredDistricts.length > 1 ? filteredDistricts.slice(0, 10).map((d) => dashPct(d.pay_complete, d.complete || 1)) : undefined;

  const milestones = [
    { label: `1. Total Allocated ${unitLabel}`, v: totals.total, of: totals.total || 1, color: DASH_COLORS.BLUE },
    { label: `2. Installed & Commissioned`, v: totals.complete, of: totals.total || 1, color: DASH_COLORS.GREEN },
    { label: `3. Field Verification Approved`, v: totals.verify_approved, of: totals.complete || totals.total || 1, color: DASH_COLORS.CYAN },
    { label: `4. Claims Approved`, v: totals.claim_approved, of: totals.claim_raised || totals.complete || 1, color: DASH_COLORS.VIOLET },
    { label: `5. Payment Disbursement Settled`, v: totals.pay_complete, of: totals.complete || totals.total || 1, color: DASH_COLORS.AMBER },
  ];

  const drill = (statusKey: string, extra?: { district?: string; vendor?: string | number }) => {
    if (!onDrillDown) return;
    const dist = extra?.district ?? (selectedDistrict !== 'All' ? selectedDistrict : undefined);
    onDrillDown(statusKey, { district: dist, vendor: extra?.vendor });
  };

  const districtCols = useMemo<ExportColumn<NormalizedDistrictRow>[]>(
    () => [
      { header: 'District', accessor: 'district' },
      { header: 'Total', accessor: 'total' },
      { header: 'Assigned', accessor: 'assigned' },
      { header: 'Unassigned', accessor: 'not_assigned' },
      { header: 'Installed', accessor: 'complete' },
      { header: 'Pending', accessor: 'pending' },
      { header: 'Verify Approved', accessor: 'verify_approved' },
      { header: 'Verify Pending', accessor: 'verify_pending' },
      { header: 'Verify Reject', accessor: 'verify_reject' },
      { header: 'Claims Raised', accessor: 'claim_raised' },
      { header: 'Claims Approved', accessor: 'claim_approved' },
      { header: 'Pay Settled', accessor: 'pay_complete' },
      { header: 'Pay Partial', accessor: 'pay_partially' },
      { header: 'Pay Pending', accessor: 'pay_pending' },
    ],
    []
  );

  const vendorCols = useMemo<ExportColumn<NormalizedVendorRow>[]>(
    () => [
      { header: 'Vendor Name', accessor: 'vendor_name' },
      { header: 'Vendor ID', accessor: 'vendor_id' },
      { header: 'Today', accessor: 'today_install' },
      { header: 'Allocated', accessor: 'site_count' },
      { header: 'Installed', accessor: 'complete' },
      { header: 'Pending', accessor: 'pending' },
      { header: 'Verify Approved', accessor: 'verify_approved' },
      { header: 'Verify Pending', accessor: 'verify_pending' },
      { header: 'Verify Reject', accessor: 'verify_reject' },
      { header: 'Claims Raised', accessor: 'claim_raised' },
      { header: 'Pay Settled', accessor: 'pay_complete' },
    ],
    []
  );

  const stamp = new Date().toISOString().slice(0, 10);

  return (
    <div className="solar-erp-page">
      <style>{DASHBOARD_PAGE_CSS}</style>

      {/* 1. Page Header (Exact AssamSwpDashboard layout) */}
      <PageHead
        title={pageTitle}
        subtitle={
          <span style={{ display: 'inline-block', fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>
            {pageSubtitle}
            {updatedAt ? ` · Last updated ${updatedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}` : ''}
          </span>
        }
        breadcrumbs={[
          { label: 'ERP Dashboard', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Uttar Pradesh', href: '/vendor-management/up' },
          { label: 'Installation' },
          { label: moduleName },
          { label: 'Dashboard' },
        ]}
        actions={
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill" style={{ fontWeight: 600, paddingInline: 'var(--ax-space-3)' }}>
              <span className="ax-badge__dot" /> State: Uttar Pradesh
            </span>
            <Link to={routes.statusRegister} className="ax-btn ax-btn--primary ax-btn--sm">
              Status Register
            </Link>
            <Link to={routes.viewAssign} className="ax-btn ax-btn--primary ax-btn--sm">
              Assigned Requests
            </Link>
            <Link to={routes.verify} className="ax-btn ax-btn--primary ax-btn--sm">
              Verify Installations
            </Link>
            <Link to={routes.assign} className="ax-btn ax-btn--primary ax-btn--sm">
              <span className="ax-btn__label">+ Assign {moduleName}</span>
            </Link>
          </div>
        }
      />

      <div className="ax-dash-grid mt-0 pt-0">
        {extraTopSection && (
          <div className="ax-col--12" style={{ marginBottom: 4 }}>
            {extraTopSection}
          </div>
        )}
        {apiError && (
          <div
            className="ax-col--12"
            style={{
              padding: '10px 14px',
              background: 'color-mix(in oklab, var(--ax-viz-red, #ef4444) 12%, transparent)',
              color: 'var(--ax-viz-red, #dc2626)',
              borderRadius: 'var(--ax-radius-md, 8px)',
              fontSize: 'var(--ax-text-xs)',
            }}
          >
            <b>Error loading dashboard data:</b> {apiError}
          </div>
        )}

        {/* 2. Operations Filter Bar */}
        <section
          className="ax-card ax-card--flat ax-col--12"
          role="region"
          aria-label={`${pageTitle} Filters`}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--ax-radius-lg, 12px)',
            border: '1px solid var(--ax-border-subtle, #f1f5f9)',
            background: 'var(--ax-bg-surface, #ffffff)',
          }}
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
                  background: 'rgba(37, 99, 235, 0.08)',
                  borderRadius: 'var(--ax-radius-pill, 9999px)',
                  border: '1px solid rgba(37, 99, 235, 0.2)',
                }}
              >
                {DASH_ICONS.FILTER} Filter Operations
              </span>

              <div className="ax-cluster asw-filter-item">
                <label htmlFor={`${fileBase}-dist`} style={labelStyle}>District:</label>
                <select
                  id={`${fileBase}-dist`}
                  className="ax-input ax-input--sm"
                  style={{ height: 30, fontSize: 'var(--ax-text-xs)', paddingInline: '8px' }}
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                >
                  <option value="All">All Districts ({districtOptions.length})</option>
                  {districtOptions.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div className="ax-cluster asw-filter-item">
                <label htmlFor={`${fileBase}-status`} style={labelStyle}>Status:</label>
                <select
                  id={`${fileBase}-status`}
                  className="ax-input ax-input--sm"
                  style={{ height: 30, fontSize: 'var(--ax-text-xs)', paddingInline: '8px' }}
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="All">All Operations</option>
                  <option value="Complete">Installed {unitLabel}</option>
                  <option value="Pending">Pending Installation</option>
                  <option value="Assigned">Assigned to Vendors</option>
                  <option value="NotAssigned">Unassigned {unitLabel}</option>
                  <option value="VerifyApproved">Verify Approved</option>
                  <option value="VerifyPending">Verification Pending</option>
                  <option value="VerifyReject">Verification Rejected</option>
                  <option value="ClaimRaised">Claim Raised</option>
                  <option value="ClaimApproved">Claim Approved</option>
                  <option value="PayComplete">Payment Settled</option>
                  <option value="PayPending">Payment Pending</option>
                </select>
              </div>

              {filtersActive && (
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--sm"
                  style={{ height: 28, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }}
                  onClick={() => { setSelectedDistrict('All'); setSelectedStatus('All'); setTableQuery(''); }}
                >
                  Reset Filters
                </button>
              )}
            </div>

            <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>
                Showing <b style={{ color: 'var(--ax-text-strong)' }}>{dashNum(totals.total)}</b> Total {unitLabel} across <b style={{ color: 'var(--ax-text-strong)' }}>{filteredDistricts.length}</b> {filteredDistricts.length === 1 ? 'District' : 'Districts'}
              </span>
            </div>
          </div>

          <div className="ax-cluster" style={{ gap: 6, flexWrap: 'wrap', width: '100%', marginTop: 8, paddingTop: 8, borderTop: '1px dashed var(--ax-border, #e2e8f0)' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ax-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Quick Filter:</span>
            {[
              { key: 'All', label: 'All Operations' },
              { key: 'Complete', label: 'Installed' },
              { key: 'Pending', label: 'Pending' },
              { key: 'VerifyApproved', label: 'Verify Approved' },
              { key: 'VerifyPending', label: 'In Audit' },
              { key: 'ClaimRaised', label: 'Claims Raised' },
              { key: 'PayComplete', label: 'Payment Settled' },
            ].map((p) => {
              const isActive = selectedStatus === p.key;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setSelectedStatus(p.key)}
                  className={`ax-btn ax-btn--xs ${isActive ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
                  style={{ height: 24, fontSize: '11px', padding: '0 8px', borderRadius: 12, fontWeight: isActive ? 700 : 500 }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* 3. Executive Welcome Banner */}
        <section className="ax-card ax-welcome ax-col--12" role="region" aria-label={`${pageTitle} Overview`}>
          <div className="ax-welcome__body">
            <div className="ax-welcome__text">
              <p className="ax-welcome__eyebrow">{programEyebrow}</p>
              <h2 className="ax-card__title">{welcomeHeading}</h2>
              <p className="ax-welcome__lede">
                {selectedDistrict !== 'All' ? (
                  <>
                    UP {moduleName} execution overview for <b>{selectedDistrict}</b>: <b>{dashNum(totals.total)} {unitShort}</b> allocated.
                    <b> {dashNum(totals.complete)} ({pctComplete}%)</b> installed, with <b>{dashNum(totals.verify_approved)}</b> verified approved, <b>{dashNum(totals.claim_raised)}</b> claims raised, and <b>{dashNum(totals.pay_complete)}</b> payment settlements.
                  </>
                ) : (
                  <>
                    Uttar Pradesh {moduleName} execution overview: <b>{dashNum(totals.total)} {unitShort}</b> allocated across <b>{districtOptions.length} districts</b>.
                    <b> {dashNum(totals.complete)} ({pctComplete}%)</b> installed, with <b>{dashNum(totals.verify_approved)}</b> verified approved, <b>{dashNum(totals.claim_raised)}</b> claims raised, and <b>{dashNum(totals.pay_complete)}</b> payment settlements.
                  </>
                )}
              </p>
            </div>

            <dl className="ax-welcome__stats">
              <div className="ax-welcome__stat">
                <dt>{selectedDistrict !== 'All' ? 'District' : 'Total Districts'}</dt>
                <dd className="ax-num" style={{ fontSize: selectedDistrict !== 'All' ? '1.1rem' : undefined }}>
                  {selectedDistrict !== 'All' ? selectedDistrict : dashNum(districtOptions.length)}
                </dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-emerald, #10b981)' }}>
                  {selectedDistrict !== 'All' ? 'Active Filter Scope' : 'UP Operational Scope'}
                </small>
              </div>
              <div className="ax-welcome__stat">
                <dt>Allocated {unitLabel}</dt>
                <dd className="ax-num">{dashNum(totals.total)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--asw-primary)' }}>Assigned: {dashNum(totals.assigned)}</small>
              </div>
              <div className="ax-welcome__stat">
                <dt>Installed {unitLabel}</dt>
                <dd className="ax-num">{dashNum(totals.complete)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-emerald, #10b981)' }}>{pctComplete}% Complete</small>
              </div>
              <div className="ax-welcome__stat">
                <dt>{extraWelcomeStat ? extraWelcomeStat.label : 'Verify Approved'}</dt>
                <dd className="ax-num" style={extraWelcomeStat ? { fontSize: '1.1rem' } : undefined}>
                  {extraWelcomeStat ? extraWelcomeStat.value : dashNum(totals.verify_approved)}
                </dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: extraWelcomeStat?.color || 'var(--ax-viz-amber, #f59e0b)' }}>
                  {extraWelcomeStat ? extraWelcomeStat.sub : `${dashNum(totals.verify_pending)} In Audit`}
                </small>
              </div>
            </dl>
          </div>
        </section>

        {/* 4. Core 8 KPI Cards (Exact AssamSwpDashboard 2x4 grid) */}
        <DashKpiCard
          icon={DASH_ICONS.PIN}
          tone="accent"
          label={`Total Allocated ${unitLabel}`}
          value={dashNum(totals.total)}
          unit={unitLabel}
          sub={`Allocated UP ${moduleName} ${unitShort}`}
          spark={siteSpark}
          onClick={onDrillDown ? () => drill('total') : undefined}
        />
        <DashKpiCard
          icon={DASH_ICONS.DONE}
          tone="emerald"
          label={`Installed ${unitLabel}`}
          value={dashNum(totals.complete)}
          unit={unitLabel}
          sub="Equipment & photos uploaded"
          badge={`${pctComplete}%`}
          spark={completeSpark}
          onClick={onDrillDown ? () => drill('complete') : undefined}
        />
        <DashKpiCard
          icon={DASH_ICONS.CLOCK}
          tone="amber"
          label="Pending Installation"
          value={dashNum(totals.pending)}
          unit={unitLabel}
          sub="Awaiting field execution"
          badge={`${pctPending}%`}
          spark={pendingSpark}
          onClick={onDrillDown ? () => drill('pending') : undefined}
        />
        <DashKpiCard
          icon={DASH_ICONS.SHIELD}
          tone="cyan"
          label="Verify Approved"
          value={dashNum(totals.verify_approved)}
          unit={unitLabel}
          sub={`${dashNum(totals.verify_pending)} Audit in progress`}
          badge={`${pctVerified}%`}
          spark={verifySpark}
          onClick={onDrillDown ? () => drill('verify-approved') : undefined}
        />
        <DashKpiCard
          icon={DASH_ICONS.CLOCK}
          tone="amber"
          label="Verification Pending"
          value={dashNum(totals.verify_pending)}
          unit={unitLabel}
          sub="Field audit pending review"
          onClick={onDrillDown ? () => drill('verify-pending') : undefined}
        />
        <DashKpiCard
          icon={DASH_ICONS.X}
          tone="red"
          label="Verification Rejected"
          value={dashNum(totals.verify_reject)}
          unit={unitLabel}
          sub="Requires vendor rework"
          onClick={onDrillDown ? () => drill('verify-reject') : undefined}
        />
        <DashKpiCard
          icon={DASH_ICONS.DOC}
          tone="violet"
          label="Claims Approved"
          value={dashNum(totals.claim_approved)}
          unit={unitLabel}
          sub={`${dashNum(totals.claim_raised)} Raised · ${dashNum(totals.claim_applicable)} Applicable`}
          badge={`${pctClaimApproved}%`}
          onClick={onDrillDown ? () => drill('claim-approved') : undefined}
        />
        <DashKpiCard
          icon={DASH_ICONS.CREDIT}
          tone="emerald"
          label="Payment Settled"
          value={dashNum(totals.pay_complete)}
          unit={unitLabel}
          sub={`${dashNum(totals.pay_partially)} Partially paid`}
          badge={`${pctPaid}%`}
          onClick={onDrillDown ? () => drill('pay-complete') : undefined}
        />

        {/* 5. Secondary Operations & Quality Performance Section */}
        <div className="ax-col--12" style={{ marginTop: 'var(--ax-space-3)', marginBottom: 'var(--ax-space-1)' }}>
          <div className="ax-cluster" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--ax-space-2)' }}>
            <div>
              <span className="ax-card__eyebrow" style={{ color: 'var(--asw-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                Operations & Quality Performance
              </span>
              <h2 className="ax-card__title" style={{ fontSize: 'var(--ax-text-lg)', margin: 0 }}>
                Full Operational Metrics & Governance
              </h2>
            </div>
            <span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--pill" style={{ fontSize: 'var(--ax-text-xs)' }}>
              UP {moduleName} Full Response Tracker
            </span>
          </div>
        </div>

        <DashKpiCard
          icon={DASH_ICONS.USER}
          tone="accent"
          label={`Assigned ${unitLabel}`}
          value={dashNum(totals.assigned)}
          unit={unitLabel}
          sub={`${dashNum(totals.not_assigned)} unassigned · ${dashNum(totals.accepted)} accepted`}
          badge={`${dashPct(totals.assigned, totals.total || 1)}%`}
          spark={siteSpark}
          onClick={onDrillDown ? () => drill('assigned') : undefined}
        />
        <DashKpiCard
          icon={DASH_ICONS.DOC}
          tone="violet"
          label="Claim Applicable"
          value={dashNum(totals.claim_applicable)}
          unit={unitLabel}
          sub={`${dashNum(totals.claim_pending)} claim verify pending`}
          onClick={onDrillDown ? () => drill('claim-applicable') : undefined}
        />
        <DashKpiCard
          icon={DASH_ICONS.CREDIT}
          tone="cyan"
          label="Payment Claims"
          value={dashNum(totals.claim_raised)}
          unit="Claims"
          sub={`${dashNum(totals.claim_approved)} Approved · ${dashNum(totals.claim_reject)} Rejected`}
          badge="Invoices"
          onClick={onDrillDown ? () => drill('claim-raised') : undefined}
        />
        <DashKpiCard
          icon={DASH_ICONS.CLOCK}
          tone="amber"
          label="Pending Disbursement"
          value={dashNum(totals.pay_pending)}
          unit={unitLabel}
          sub={`${dashNum(totals.pay_partially)} Partially settled`}
          spark={paySpark}
          onClick={onDrillDown ? () => drill('pay-pending') : undefined}
        />

        {/* State Operations Executive Card */}
        <section className="ax-card ax-col--12" role="region" aria-label={`UP ${moduleName} Operations Overview`}>
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow" style={{ color: 'var(--asw-primary)' }}>State Operations</span>
              <h3 className="ax-card__title">Uttar Pradesh · {moduleName} Installation Operations</h3>
              <p className="ax-card__subtitle">{dashNum(totals.complete)} {unitShort} installed across {districtOptions.length} districts in Uttar Pradesh</p>
            </div>
            <Link to={routes.verify} className="ax-btn ax-btn--sm ax-btn--primary">
              View Installation Register →
            </Link>
          </div>
          <div className="ax-card__body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-3)' }}>
            <div className="ax-grid ax-grid--2" style={{ gap: 'var(--ax-space-2)' }}>
              <div style={{ padding: '10px 12px', background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 'var(--ax-radius-md, 8px)' }}>
                <small style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-xs)' }}>Installed & Operational</small>
                <div style={{ fontSize: 'var(--ax-text-lg)', fontWeight: 700, color: 'var(--ax-viz-emerald, #10b981)' }}>
                  {dashNum(totals.complete)} <span style={{ fontSize: 'var(--ax-text-xs)', fontWeight: 500 }}>({pctComplete}%)</span>
                </div>
              </div>
              <div style={{ padding: '10px 12px', background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 'var(--ax-radius-md, 8px)' }}>
                <small style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-xs)' }}>Pending Execution</small>
                <div style={{ fontSize: 'var(--ax-text-lg)', fontWeight: 700, color: 'var(--ax-viz-amber, #f59e0b)' }}>
                  {dashNum(totals.pending)} <span style={{ fontSize: 'var(--ax-text-xs)', fontWeight: 500 }}>({pctPending}%)</span>
                </div>
              </div>
            </div>

            <div>
              <div className="ax-cluster" style={{ justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>Overall Installation Execution Efficiency</span>
                <b className="ax-num" style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-emerald, #10b981)' }}>
                  {pctComplete}%
                </b>
              </div>
              <div className="ax-progress ax-progress--sm">
                <div className="ax-progress__track">
                  <div className="ax-progress__fill" style={{ width: `${pctComplete}%`, background: 'var(--ax-viz-emerald, #10b981)' }} />
                </div>
              </div>
            </div>

            <div style={{ paddingTop: 'var(--ax-space-2)', borderTop: '1px solid var(--ax-border-subtle, #f1f5f9)', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
              <b>Verification & Compliance Summary:</b> {dashNum(totals.assigned)} assigned ({dashNum(totals.not_assigned)} unassigned) · {dashNum(totals.verify_approved)} verified approved ({dashNum(totals.verify_pending)} QA pending, {dashNum(totals.verify_reject)} rejected) · {dashNum(totals.claim_raised)} claims raised ({dashNum(totals.claim_approved)} approved) · {dashNum(totals.pay_complete)} payments settled ({dashNum(totals.pay_partially)} partial, {dashNum(totals.pay_pending)} pending).
            </div>
          </div>
        </section>

        {/* 6. Charts Row: District Wise Bar Chart (8 col) + Status Distribution Donut (4 col) */}
        <section className="ax-card ax-card--chart ax-col--8" role="region" aria-label="District wise installations">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Geographic Breakdown</span>
              <h2 className="ax-card__title">District Wise Installations</h2>
              <p className="ax-card__subtitle">{dashNum(totals.complete)} installed of {dashNum(totals.total)} allocated across {districtOptions.length} districts</p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)' }}>
                {[
                  { l: `Installed ${unitLabel}`, c: DASH_COLORS.GREEN },
                  { l: `Allocated ${unitLabel}`, c: DASH_COLORS.BLUE },
                ].map((i) => (
                  <span key={i.l} className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}>
                    <i style={{ width: 10, height: 10, borderRadius: 2, background: i.c, display: 'inline-block' }} />
                    <small style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-xs)' }}>{i.l}</small>
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            {chartDistricts.length > 0 ? (
              <Suspense fallback={<div className="ax-skeleton" style={{ height: chartH }} />}>
                <ApexChart
                  key={`dist-chart-${chartH}-${chartDistricts.map((d) => `${d.district}-${d.complete}-${d.total}`).join('-')}`}
                  type="bar"
                  height={chartH}
                  legend="none"
                  ariaLabel="District-wise installation comparison"
                  series={[
                    { name: `Installed ${unitLabel}`, data: chartDistricts.map((d) => d.complete) },
                    { name: `Allocated ${unitLabel}`, data: chartDistricts.map((d) => d.total) },
                  ]}
                  apex={{
                    colors: [DASH_COLORS.GREEN, DASH_COLORS.BLUE],
                    plotOptions: { bar: { horizontal: false, borderRadius: 4, columnWidth: '35%' } },
                    xaxis: { categories: chartDistricts.map((d) => d.district), labels: { style: { fontSize: '11px' }, rotate: -35 } },
                    yaxis: { title: { text: `${unitLabel} (Nos.)`, style: { color: 'var(--ax-text-muted)' } } },
                    chart: {
                      events: {
                        dataPointSelection: (_event: unknown, _chart: unknown, opts: any) => {
                          const dist = chartDistricts[opts?.dataPointIndex]?.district;
                          if (dist) drill('complete', { district: dist });
                        },
                      },
                    },
                  }}
                />
              </Suspense>
            ) : (
              <div style={{ height: chartH, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--ax-text-muted)', gap: 8 }}>
                <span style={{ fontSize: 'var(--ax-text-sm)', fontWeight: 500 }}>
                  {loading ? 'Loading district data…' : 'No district data returned by server.'}
                </span>
              </div>
            )}
          </div>
        </section>

        <section className="ax-card ax-col--4" role="region" aria-label="Installation status split">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Execution Distribution</span>
              <h2 className="ax-card__title">Status Breakdown</h2>
              <p className="ax-card__subtitle">Total {dashNum(totals.total)} {unitLabel}</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <Suspense fallback={<div className="ax-skeleton" style={{ height: donutH }} />}>
              <ApexChart
                key={`donut-${donutH}-${totals.complete}-${totals.pending}-${totals.verify_reject}`}
                type="donut"
                height={donutH}
                legend="none"
                ariaLabel="Installed, pending and rejected distribution"
                series={[totals.complete, totals.pending, totals.verify_reject]}
                apex={{
                  labels: ['Installed', 'Pending', 'Rework Required'],
                  colors: [DASH_COLORS.GREEN, DASH_COLORS.AMBER, DASH_COLORS.RED],
                  stroke: { width: 0 },
                  chart: {
                    events: {
                      dataPointSelection: (_event: unknown, _chart: unknown, opts: any) => {
                        const keys = ['complete', 'pending', 'verify-reject'];
                        const key = keys[opts?.dataPointIndex];
                        if (key) drill(key);
                      },
                    },
                  },
                  plotOptions: {
                    pie: {
                      donut: {
                        size: '72%',
                        labels: {
                          show: true,
                          name: { fontFamily: 'var(--ax-font-sans)' },
                          value: { fontFamily: 'var(--ax-font-mono)', fontWeight: 600 },
                          total: { show: true, label: unitLabel, formatter: () => dashNum(totals.total) },
                        },
                      },
                    },
                  },
                }}
              />
            </Suspense>
            <ul className="ax-list ax-list--compact" style={{ marginTop: 'var(--ax-space-3)' }}>
              {[
                { label: 'Installed', sub: `Completed ${unitShort}`, v: totals.complete, p: pctComplete, color: DASH_COLORS.GREEN, key: 'complete' },
                { label: 'Pending', sub: 'Awaiting execution', v: totals.pending, p: pctPending, color: DASH_COLORS.AMBER, key: 'pending' },
                { label: 'Rework Required', sub: 'Audit rejected', v: totals.verify_reject, p: dashPct(totals.verify_reject, totals.total), color: DASH_COLORS.RED, key: 'verify-reject' },
              ].map((s) => (
                <li
                  key={s.label}
                  className="ax-list__row"
                  style={{ border: 0, paddingInline: 0, cursor: onDrillDown ? 'pointer' : 'default' }}
                  onClick={() => drill(s.key)}
                >
                  <span className="ax-list__leading"><i style={{ width: 9, height: 9, borderRadius: 3, background: s.color, display: 'inline-block' }} /></span>
                  <span className="ax-list__content">
                    <span className="ax-list__title" style={{ fontWeight: 'var(--ax-weight-medium)' }}>{s.label}</span>
                    <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>{s.sub}</span>
                  </span>
                  <span className="ax-list__trailing ax-num" style={{ color: 'var(--ax-text-strong)', fontWeight: 600 }}>{dashNum(s.v)} ({s.p}%)</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 7. Monthly Trend (8 col) + Workflow Milestones (4 col) */}
        <section className="ax-card ax-card--chart ax-col--8" role="region" aria-label="Monthly installation throughput">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Monthly Execution</span>
              <h2 className="ax-card__title">Monthly Installation Trend</h2>
              <p className="ax-card__subtitle">Installation pace and throughput across recent months</p>
            </div>
            <div className="ax-card__actions">
              <span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--pill">
                {sortedMonthly.length} Months Tracked
              </span>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            {sortedMonthly.length > 0 ? (
              <Suspense fallback={<div className="ax-skeleton" style={{ height: chartH }} />}>
                <ApexChart
                  key={`monthly-${chartH}-${sortedMonthly.map((m) => `${m.month_year}-${m.monthly_installations}`).join('-')}`}
                  type="area"
                  height={chartH}
                  legend="top"
                  ariaLabel="Monthly installations area chart"
                  series={[{ name: `Monthly Installed ${unitLabel}`, data: sortedMonthly.map((m) => m.monthly_installations) }]}
                  apex={{
                    colors: [DASH_COLORS.BLUE],
                    stroke: { curve: 'smooth', width: 2 },
                    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.05, stops: [0, 90, 100] } },
                    markers: { size: 4, strokeWidth: 0, hover: { size: 6 } },
                    xaxis: { categories: sortedMonthly.map((m) => m.month_year) },
                    yaxis: { title: { text: 'Installed (Nos.)', style: { color: 'var(--ax-text-muted)' } } },
                  }}
                />
              </Suspense>
            ) : (
              <div style={{ height: chartH, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--ax-text-muted)', gap: 8 }}>
                <svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} style={{ opacity: 0.4 }}>
                  <path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" />
                </svg>
                <span style={{ fontSize: 'var(--ax-text-sm)', fontWeight: 500 }}>
                  {loading ? 'Loading monthly trend…' : 'No monthly installation timeline data returned by server.'}
                </span>
              </div>
            )}
          </div>
        </section>

        <section className="ax-card ax-col--4" role="region" aria-label={`${moduleName} Workflow Milestones`}>
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Workflow Lifecycle</span>
              <h2 className="ax-card__title">{moduleName} Milestones</h2>
              <p className="ax-card__subtitle">Progress across installation stages</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0, display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-4)' }}>
            {milestones.map((m) => {
              const p = dashPct(m.v, m.of);
              return (
                <div key={m.label}>
                  <div className="ax-cluster" style={{ justifyContent: 'space-between', marginBottom: 4, flexWrap: 'wrap', gap: 4 }}>
                    <span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-strong)', fontWeight: 500 }}>{m.label}</span>
                    <b className="ax-num" style={{ color: m.color, fontSize: 'var(--ax-text-xs)' }}>{dashNum(m.v)} / {dashNum(m.of)} ({p}%)</b>
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

        {/* 8. District Wise Detailed Table */}
        <section className="ax-card ax-col--12" role="region" aria-label="District wise summary table">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Geographic Breakdown</span>
              <h2 className="ax-card__title">District Wise {moduleName} Summary</h2>
              <p className="ax-card__subtitle">Allocated, assigned, verification, claims & payment metrics across all UP districts</p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                <SearchInput value={tableQuery} onChange={setTableQuery} placeholder="Search district…" ariaLabel="Search districts" />
                <TableExportToolbar
                  onCopy={() => copyRowsToClipboard(tableDistricts, districtCols)}
                  onExportCSV={() => exportRowsCSV(tableDistricts, districtCols, `${fileBase}_Districts_${stamp}`)}
                  onExportExcel={() => exportRowsExcel(tableDistricts, districtCols, `${fileBase}_Districts_${stamp}`)}
                  onExportPDF={() => exportRowsPDF(tableDistricts, districtCols, `UP ${moduleName} District-Wise Summary`)}
                />
              </div>
            </div>
          </div>

          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover" style={{ minWidth: 1450, whiteSpace: 'nowrap' }}>
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th">District</th>
                  <th className="ax-table__th ax-table__th--num">Allocated</th>
                  <th className="ax-table__th ax-table__th--num">Assigned</th>
                  <th className="ax-table__th ax-table__th--num">Unassigned</th>
                  <th className="ax-table__th ax-table__th--num">Installed</th>
                  <th className="ax-table__th ax-table__th--num">Pending</th>
                  <th className="ax-table__th ax-table__th--num">Verify Approved</th>
                  <th className="ax-table__th ax-table__th--num">Verify Pending</th>
                  <th className="ax-table__th ax-table__th--num">Verify Reject</th>
                  <th className="ax-table__th ax-table__th--num">Claims Raised</th>
                  <th className="ax-table__th ax-table__th--num">Claims Approved</th>
                  <th className="ax-table__th ax-table__th--num">Pay Settled</th>
                  <th className="ax-table__th ax-table__th--num">Pay Pending</th>
                  <th className="ax-table__th" style={{ width: 140 }}>Progress</th>
                </tr>
              </thead>
              <tbody>
                {districtPagination.paged.map((d) => {
                  const pct = dashPct(d.complete, d.total);
                  return (
                    <tr
                      key={d.district}
                      className="ax-table__row"
                      onClick={() => drill('complete', { district: d.district })}
                      style={{ cursor: onDrillDown ? 'pointer' : 'default' }}
                    >
                      <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}><b>{d.district}</b></td>
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ fontWeight: 600 }} onClick={(e) => { e.stopPropagation(); drill('total', { district: d.district }); }}>{dashNum(d.total)}</td>
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ color: '#0891b2', fontWeight: 600 }} onClick={(e) => { e.stopPropagation(); drill('assigned', { district: d.district }); }}>{dashNum(d.assigned)}</td>
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-text-muted)' }}>{dashNum(d.not_assigned)}</td>
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ color: '#10b981', fontWeight: 600 }} onClick={(e) => { e.stopPropagation(); drill('complete', { district: d.district }); }}>{dashNum(d.complete)}</td>
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ color: '#f59e0b', fontWeight: 600 }} onClick={(e) => { e.stopPropagation(); drill('pending', { district: d.district }); }}>{dashNum(d.pending)}</td>
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ color: '#0891b2', fontWeight: 600 }} onClick={(e) => { e.stopPropagation(); drill('verify-approved', { district: d.district }); }}>{dashNum(d.verify_approved)}</td>
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ color: '#f59e0b', fontWeight: 600 }} onClick={(e) => { e.stopPropagation(); drill('verify-pending', { district: d.district }); }}>{dashNum(d.verify_pending)}</td>
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ color: '#dc2626', fontWeight: 600 }} onClick={(e) => { e.stopPropagation(); drill('verify-reject', { district: d.district }); }}>{dashNum(d.verify_reject)}</td>
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ color: '#2563eb', fontWeight: 600 }} onClick={(e) => { e.stopPropagation(); drill('claim-raised', { district: d.district }); }}>{dashNum(d.claim_raised)}</td>
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ color: '#10b981', fontWeight: 600 }} onClick={(e) => { e.stopPropagation(); drill('claim-approved', { district: d.district }); }}>{dashNum(d.claim_approved)}</td>
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ color: '#10b981', fontWeight: 600 }} onClick={(e) => { e.stopPropagation(); drill('pay-complete', { district: d.district }); }}>{dashNum(d.pay_complete)}</td>
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ color: '#f59e0b', fontWeight: 600 }} onClick={(e) => { e.stopPropagation(); drill('pay-pending', { district: d.district }); }}>{dashNum(d.pay_pending)}</td>
                      <td className="ax-table__td">
                        <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', flexWrap: 'nowrap', alignItems: 'center' }}>
                          <div className="ax-progress ax-progress--sm" style={{ minWidth: 60, width: 60 }}>
                            <div className="ax-progress__track">
                              <div className="ax-progress__fill" style={{ width: `${pct}%`, background: pct >= 90 ? '#10b981' : '#2563eb' }} />
                            </div>
                          </div>
                          <span className="ax-num" style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)', minWidth: 36 }}>{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!loading && districtPagination.paged.length === 0 && (
                  <tr>
                    <td className="ax-table__td" colSpan={14} style={{ textAlign: 'center', color: 'var(--ax-text-muted)', padding: 24 }}>
                      No districts match the filter criteria.
                    </td>
                  </tr>
                )}
                {districtPagination.paged.length > 0 && (
                  <tr className="ax-table__row" style={{ background: 'var(--ax-surface-subtle, #f8fafc)', fontWeight: 700 }}>
                    <td className="ax-table__td">Total (All Districts)</td>
                    <td className="ax-table__td ax-table__td--num ax-num">{dashNum(totals.total)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: '#0891b2' }}>{dashNum(totals.assigned)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-text-muted)' }}>{dashNum(totals.not_assigned)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: '#10b981' }}>{dashNum(totals.complete)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: '#f59e0b' }}>{dashNum(totals.pending)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: '#0891b2' }}>{dashNum(totals.verify_approved)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: '#f59e0b' }}>{dashNum(totals.verify_pending)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: '#dc2626' }}>{dashNum(totals.verify_reject)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: '#2563eb' }}>{dashNum(totals.claim_raised)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: '#10b981' }}>{dashNum(totals.claim_approved)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: '#10b981' }}>{dashNum(totals.pay_complete)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: '#f59e0b' }}>{dashNum(totals.pay_pending)}</td>
                    <td className="ax-table__td"><b className="ax-num" style={{ color: '#10b981' }}>{pctComplete}%</b></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="ax-card__footer" style={footerStyle}>
            <div className="ula-pagination-left">
              <Pagination
                currentPage={districtPagination.curPage}
                totalItems={districtPagination.totalItems}
                pageSize={districtPagination.pageSize}
                onPageChange={districtPagination.setPage}
                onPageSizeChange={districtPagination.setPageSize}
                pageSizeOptions={[10, 25, 50, 100, 200]}
              />
            </div>
          </div>
        </section>

        {/* 9. Vendor-Wise Installation Performance Table */}
        <section className="ax-card ax-col--12" role="region" aria-label="Vendor Wise Performance">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Contractor & Vendor Execution</span>
              <h2 className="ax-card__title">Vendor-Wise Installation Performance</h2>
              <p className="ax-card__subtitle">Field throughput, today&apos;s installations, audit approvals and claim status per contractor</p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                <SearchInput value={vendorQuery} onChange={setVendorQuery} placeholder="Search vendor…" ariaLabel="Search vendors" />
                <TableExportToolbar
                  onCopy={() => copyRowsToClipboard(tableVendors, vendorCols)}
                  onExportCSV={() => exportRowsCSV(tableVendors, vendorCols, `${fileBase}_Vendors_${stamp}`)}
                  onExportExcel={() => exportRowsExcel(tableVendors, vendorCols, `${fileBase}_Vendors_${stamp}`)}
                  onExportPDF={() => exportRowsPDF(tableVendors, vendorCols, `UP ${moduleName} Vendor-Wise Performance`)}
                />
              </div>
            </div>
          </div>

          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover" style={{ minWidth: 1200, whiteSpace: 'nowrap' }}>
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th">Vendor</th>
                  <th className="ax-table__th ax-table__th--num">Today</th>
                  <th className="ax-table__th ax-table__th--num">Allocated</th>
                  <th className="ax-table__th ax-table__th--num">Installed</th>
                  <th className="ax-table__th ax-table__th--num">Pending</th>
                  <th className="ax-table__th ax-table__th--num">Verify Approved</th>
                  <th className="ax-table__th ax-table__th--num">Verify Pending</th>
                  <th className="ax-table__th ax-table__th--num">Verify Reject</th>
                  <th className="ax-table__th ax-table__th--num">Claims Raised</th>
                  <th className="ax-table__th ax-table__th--num">Pay Settled</th>
                  <th className="ax-table__th" style={{ width: 140 }}>Progress</th>
                </tr>
              </thead>
              <tbody>
                {vendorPagination.paged.map((v) => {
                  const pct = dashPct(v.complete, v.site_count);
                  return (
                    <tr
                      key={String(v.vendor_id)}
                      className="ax-table__row"
                      onClick={() => drill('complete', { vendor: v.vendor_id })}
                      style={{ cursor: onDrillDown ? 'pointer' : 'default' }}
                    >
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <b>{v.vendor_name}</b>
                          <small style={{ color: 'var(--ax-text-muted)', fontSize: '11px' }}>ID: #{v.vendor_id}</small>
                        </div>
                      </td>
                      <td className="ax-table__td ax-table__td--num ax-num">
                        <span className="ax-badge ax-badge--soft ax-badge--info">{dashNum(v.today_install)}</span>
                      </td>
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ fontWeight: 600 }}>{dashNum(v.site_count)}</td>
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ color: '#10b981', fontWeight: 600 }}>{dashNum(v.complete)}</td>
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ color: '#f59e0b', fontWeight: 600 }}>{dashNum(v.pending)}</td>
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ color: '#0891b2', fontWeight: 600 }}>{dashNum(v.verify_approved)}</td>
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ color: '#f59e0b', fontWeight: 600 }}>{dashNum(v.verify_pending)}</td>
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ color: '#dc2626', fontWeight: 600 }}>{dashNum(v.verify_reject)}</td>
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ color: '#2563eb', fontWeight: 600 }}>{dashNum(v.claim_raised)}</td>
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ color: '#10b981', fontWeight: 600 }}>{dashNum(v.pay_complete)}</td>
                      <td className="ax-table__td">
                        <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', flexWrap: 'nowrap', alignItems: 'center' }}>
                          <div className="ax-progress ax-progress--sm" style={{ minWidth: 60, width: 60 }}>
                            <div className="ax-progress__track">
                              <div className="ax-progress__fill" style={{ width: `${pct}%`, background: pct >= 90 ? '#10b981' : '#2563eb' }} />
                            </div>
                          </div>
                          <span className="ax-num" style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)', minWidth: 36 }}>{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!loading && vendorPagination.paged.length === 0 && (
                  <tr>
                    <td className="ax-table__td" colSpan={11} style={{ textAlign: 'center', color: 'var(--ax-text-muted)', padding: 24 }}>
                      No vendor performance records match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="ax-card__footer" style={footerStyle}>
            <div className="ula-pagination-left">
              <Pagination
                currentPage={vendorPagination.curPage}
                totalItems={vendorPagination.totalItems}
                pageSize={vendorPagination.pageSize}
                onPageChange={vendorPagination.setPage}
                onPageSizeChange={vendorPagination.setPageSize}
                pageSizeOptions={[5, 10, 25, 50]}
              />
            </div>
          </div>
        </section>

        {/* Optional Extra Section (e.g., Kusum C Phase-Wise table) */}
        {extraBottomSection}

        {/* 10. Top Execution Districts Leaderboard (6 col) */}
        <section className="ax-card ax-col--6" role="region" aria-label="District Status & Quick Navigation">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">District Operations</span>
              <h2 className="ax-card__title">Top Execution Districts (Leaderboard)</h2>
              <p className="ax-card__subtitle">Highest installation completion across Uttar Pradesh</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <div>
              <div className="ax-cluster" style={{ justifyContent: 'space-between', marginBottom: 'var(--ax-space-2)' }}>
                <span style={{ fontSize: 'var(--ax-text-sm)', fontWeight: 600, color: 'var(--ax-text-strong)' }}>Installation Ranking</span>
                <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill">{dashNum(totals.complete)} Installed</span>
              </div>
              <div className="ax-statgroup ax-statgroup--stack" style={{ gap: 'var(--ax-space-2)' }}>
                {filteredDistricts
                  .slice()
                  .sort((a, b) => b.complete - a.complete)
                  .slice(0, 10)
                  .map((d) => {
                    const pct = dashPct(d.complete, d.total);
                    return (
                      <button
                        key={d.district}
                        type="button"
                        className="ax-cluster"
                        onClick={() => drill('complete', { district: d.district })}
                        style={{
                          width: '100%',
                          justifyContent: 'space-between',
                          fontSize: 'var(--ax-text-xs)',
                          border: 0,
                          background: 'transparent',
                          padding: '6px 0',
                          cursor: onDrillDown ? 'pointer' : 'default',
                          textAlign: 'left',
                          borderBottom: '1px solid var(--ax-border-subtle, #f1f5f9)',
                        }}
                      >
                        <span style={{ color: 'var(--ax-text-muted)', fontWeight: 500 }}>{d.district}</span>
                        <b className="ax-num" style={{ color: 'var(--ax-viz-emerald, #10b981)' }}>
                          {dashNum(d.complete)} / {dashNum(d.total)} ({pct}%)
                        </b>
                      </button>
                    );
                  })}
                {filteredDistricts.length === 0 && (
                  <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
                    {loading ? 'Loading districts…' : 'No district data.'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 11. Quick Module Actions (6 col) */}
        <section className="ax-card ax-col--6" role="region" aria-label="Quick Module Actions">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Workflows & Portals</span>
              <h2 className="ax-card__title">Quick Module Actions</h2>
              <p className="ax-card__subtitle">Shortcuts to manage UP {moduleName} assignments, audits and vendor disbursements</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link to={routes.viewAssign} className="ax-btn ax-btn--primary ax-btn--sm" style={{ justifyContent: 'space-between', padding: '10px 14px' }}>
                <span>View Assigned {moduleName} Requests</span>
                <span>→</span>
              </Link>
              <Link to={routes.assign} className="ax-btn ax-btn--primary ax-btn--sm" style={{ justifyContent: 'space-between', padding: '10px 14px' }}>
                <span>Assign New {moduleName} Installation</span>
                <span>+</span>
              </Link>
              <Link to={routes.verify} className="ax-btn ax-btn--primary ax-btn--sm" style={{ justifyContent: 'space-between', padding: '10px 14px' }}>
                <span>Verify Master Installation Registry</span>
                <span>📋</span>
              </Link>
              <Link to={routes.viewPayment} className="ax-btn ax-btn--primary ax-btn--sm" style={{ justifyContent: 'space-between', padding: '10px 14px' }}>
                <span>Review Claims & Disburse Payments</span>
                <span>₹</span>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
