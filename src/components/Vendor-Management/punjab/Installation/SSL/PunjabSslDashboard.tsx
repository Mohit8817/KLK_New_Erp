import { lazy, Suspense, useCallback, useEffect, useMemo, useState, useDeferredValue, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  Pagination,
  usePagination,
  SearchInput,
  TableExportToolbar,
  TableEmptyState,
  type ExportColumn,
} from '../../../../../common';
import {
  punjabAdminService,
  normalizePunjabDashboardStatus,
  type SslDashboardData,
  type DistrictWiseItem,
  type VendorWiseItem,
  type MonthInstallationItem,
  DEFAULT_PUNJAB_SUMMARY,
} from '../../punjab-services';

// Code-split ApexCharts so Punjab SSL Dashboard shell renders instantly
const ApexChart = lazy(() => import('../../../../charts/ApexChart').then((m) => ({ default: m.ApexChart })));

// Palette constants matching Solar ERP design language
const LIGHT_BLUE = '#2563eb';
const LIGHT_GREEN = '#10b981';
const LIGHT_CYAN = '#0891b2';
const LIGHT_AMBER = '#f59e0b';
const LIGHT_VIOLET = '#7c3aed';
const LIGHT_RED = '#ef4444';

const num = (x: number) => Number(x || 0).toLocaleString('en-IN');
const pctOf = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : 0);
const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Responsive chart height hook
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

/* ───────── Responsive page CSS matching Solar ERP standard ───────── */
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

  /* ───── Card header: prioritize title width, condense actions ───── */
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

  /* Search */
  .solar-erp-page .ax-card__actions .ax-search,
  .solar-erp-page .ax-card__actions [class*="search"] {
    flex: 1 1 140px;
    min-width: 90px;
    max-width: 260px;
  }
  .solar-erp-page .ax-card__actions input { min-width: 0; width: 100%; }

  /* Export toolbar */
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

  /* Filter bar */
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

  /* Mobile (<=760px) */
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
  }

  /* Small phones (<=490px) */
  @media (max-width: 490px) {
    .solar-erp-page .ax-welcome__stats {
      grid-template-columns: 1fr !important;
    }
    .solar-erp-page .ax-col--3 { grid-column: span 12; }
  }
`;

/* ───────── SVG Icons ───────── */
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
const ICON_FILTER = (
  <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 4h16v2.172a2 2 0 0 1 -.586 1.414l-4.828 4.828v7.586l-4 -2v-5.586l-4.828 -4.828a2 2 0 0 1 -.586 -1.414v-2.172z" /></svg>
);

/* ───────── KPI Card Component ───────── */
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

export function PunjabSslDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<SslDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [vendorMap, setVendorMap] = useState<Record<string, string>>({});

  // Filter states
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedVendor, setSelectedVendor] = useState<string>('All');
  const [selectedVolume, setSelectedVolume] = useState<string>('All');
  const [tableQuery, setTableQuery] = useState<string>('');
  const [vendorQuery, setVendorQuery] = useState<string>('');

  // Chart heights
  const chartH = useChartHeight(320, 260);
  const donutH = useChartHeight(230, 210);

  // Load Dashboard Data
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const [res, vMap] = await Promise.all([
        punjabAdminService.getDashboard(),
        punjabAdminService.getVendorMap(),
      ]);
      setData(res);
      if (vMap) setVendorMap(vMap);
      setUpdatedAt(new Date());
    } catch (err: any) {
      console.error('Punjab Dashboard fetch error:', err);
      setApiError(err?.message || 'Failed to fetch dynamic dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Drill-down Navigation to StatusView
  const openDrillDown = (statusKey: string, _label?: string, district?: string, vendor?: number | string) => {
    const normalizedStatus = normalizePunjabDashboardStatus(statusKey);
    const targetDistrict = district && district !== 'All' ? district : (selectedDistrict !== 'All' ? selectedDistrict : undefined);
    const targetVendor = vendor && vendor !== 'All' ? vendor : (selectedVendor !== 'All' ? selectedVendor : undefined);
    const params = new URLSearchParams();
    params.set('status', normalizedStatus);
    if (targetDistrict) params.set('district', targetDistrict);
    if (targetVendor) params.set('vendor', String(targetVendor));
    if (selectedVolume !== 'All') params.set('volume', selectedVolume);
    navigate(`/vendor-management/punjab/ssl/status-view?${params.toString()}`);
  };

  const districtwise: DistrictWiseItem[] = useMemo(() => data?.districtwise || [], [data]);
  const vendorswise: VendorWiseItem[] = useMemo(() => data?.vendorswise || [], [data]);
  const monthlyInstallations: MonthInstallationItem[] = useMemo(
    () => {
      const list = [...(data?.vendor_installation_month || [])];
      return list.sort((a, b) => String(a.month_year || '').localeCompare(String(b.month_year || '')));
    },
    [data]
  );
  const todayInstallations: TodayInstallationItem[] = useMemo(
    () => data?.vendor_today_installation || [],
    [data]
  );
  const totalTodayInstalled = useMemo(
    () => todayInstallations.reduce((sum, t) => sum + (t.today_install || 0), 0),
    [todayInstallations]
  );
  const volOptions = useMemo(
    () => (data?.vol && data.vol.length > 0 ? data.vol : ['1', '2', '5', '6', '10']),
    [data]
  );

  // District options
  const districtOptions = useMemo(
    () => [...new Set(districtwise.map((d) => d.district).filter(Boolean))].sort(),
    [districtwise]
  );

  // Vendor options
  const vendorOptions = useMemo(
    () =>
      vendorswise.map((v) => ({
        id: v.inst_vendor,
        name:
          v.vendor_name ||
          vendorMap[String(v.inst_vendor)] ||
          (v.inst_vendor ? `Vendor ${v.inst_vendor}` : '—'),
      })),
    [vendorswise, vendorMap]
  );

  // Filtered district rows
  const filteredDistricts = useMemo(() => {
    return districtwise.filter((d) => {
      const matchDistrict = selectedDistrict === 'All' || d.district.toLowerCase() === selectedDistrict.toLowerCase();
      let matchStatus = true;
      if (selectedStatus === 'Complete') matchStatus = (d.inst_complete || 0) > 0;
      else if (selectedStatus === 'Pending') matchStatus = (d.inst_pending || 0) > 0;
      else if (selectedStatus === 'VerifyApproved') matchStatus = (d.verify_approved || 0) > 0;
      else if (selectedStatus === 'VerifyPending') matchStatus = (d.verify_pending || 0) > 0;
      else if (selectedStatus === 'VerifyReject') matchStatus = (d.verify_reject || 0) > 0;
      else if (selectedStatus === 'ClaimApproved') matchStatus = (d.claim_approved || 0) > 0;
      else if (selectedStatus === 'PayComplete') matchStatus = (d.payment_done || 0) > 0;
      return matchDistrict && matchStatus;
    });
  }, [districtwise, selectedDistrict, selectedStatus]);

  // Filtered vendor rows
  const filteredVendors = useMemo(() => {
    return vendorswise.filter((v) => {
      const matchVendor = selectedVendor === 'All' || String(v.inst_vendor) === String(selectedVendor);
      let matchStatus = true;
      if (selectedStatus === 'Complete') matchStatus = (v.inst_complete || 0) > 0;
      else if (selectedStatus === 'Pending') matchStatus = (v.inst_pending || 0) > 0;
      else if (selectedStatus === 'VerifyApproved') matchStatus = (v.verify_approved || 0) > 0;
      else if (selectedStatus === 'VerifyPending') matchStatus = (v.verify_pending || 0) > 0;
      else if (selectedStatus === 'VerifyReject') matchStatus = (v.verify_reject || 0) > 0;
      else if (selectedStatus === 'ClaimApproved') matchStatus = (v.claim_approved || 0) > 0;
      else if (selectedStatus === 'PayComplete') matchStatus = (v.payment_done || 0) > 0;
      return matchVendor && matchStatus;
    });
  }, [vendorswise, selectedVendor, selectedStatus]);

  const rawSsl = useMemo(
    () =>
      data?.ssldatas || {
        site_count: 0,
        site_assigned: 0,
        site_not_assigned: 0,
        complete: 0,
        pending: 0,
        verify_pending: 0,
        verify_approved: 0,
        verify_reject: 0,
        claim_applicable: 0,
        claim_raised: 0,
        claim_approved: 0,
        claim_pending: 0,
        inst_pay_done: 0,
        inst_pay_pending: 0,
      },
    [data]
  );

  // Dynamic SSL metrics aggregate
  const ssl = useMemo(() => {
    if (selectedDistrict === 'All' && selectedStatus === 'All' && selectedVendor === 'All') {
      return rawSsl;
    }
    if (filteredDistricts.length === 0) {
      return {
        site_count: 0,
        site_assigned: 0,
        site_not_assigned: 0,
        complete: 0,
        pending: 0,
        verify_pending: 0,
        verify_approved: 0,
        verify_reject: 0,
        claim_applicable: 0,
        claim_raised: 0,
        claim_approved: 0,
        claim_pending: 0,
        inst_pay_done: 0,
        inst_pay_pending: 0,
      };
    }
    return filteredDistricts.reduce(
      (acc, d) => ({
        site_count: acc.site_count + (Number(d.light_count) || 0),
        site_assigned: acc.site_assigned + (Number(d.light_count) || 0),
        site_not_assigned: 0,
        complete: acc.complete + (Number(d.inst_complete) || 0),
        pending: acc.pending + (Number(d.inst_pending) || 0),
        verify_pending: acc.verify_pending + (Number(d.verify_pending) || 0),
        verify_approved: acc.verify_approved + (Number(d.verify_approved) || 0),
        verify_reject: acc.verify_reject + (Number(d.verify_reject) || 0),
        claim_applicable: acc.claim_applicable + (Number(d.claim_raised) || 0),
        claim_raised: acc.claim_raised + (Number(d.claim_raised) || 0),
        claim_approved: acc.claim_approved + (Number(d.claim_approved) || 0),
        claim_pending: 0,
        inst_pay_done: acc.inst_pay_done + (Number(d.payment_done) || 0),
        inst_pay_pending: 0,
      }),
      {
        site_count: 0,
        site_assigned: 0,
        site_not_assigned: 0,
        complete: 0,
        pending: 0,
        verify_pending: 0,
        verify_approved: 0,
        verify_reject: 0,
        claim_applicable: 0,
        claim_raised: 0,
        claim_approved: 0,
        claim_pending: 0,
        inst_pay_done: 0,
        inst_pay_pending: 0,
      }
    );
  }, [rawSsl, filteredDistricts, selectedDistrict, selectedStatus, selectedVendor]);

  const filtersActive = selectedDistrict !== 'All' || selectedStatus !== 'All' || selectedVendor !== 'All';

  // Table search & pagination for District Table
  const deferredQuery = useDeferredValue(tableQuery);
  const tableDistricts = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return filteredDistricts.filter(
      (d) => !q || (d.district && d.district.toLowerCase().includes(q))
    );
  }, [filteredDistricts, deferredQuery]);

  const {
    paginatedData: pagedDistricts,
    currentPage: districtCurrentPage,
    pageSize: districtPageSize,
    totalItems: districtTotalItems,
    setPage: setDistrictPage,
    setPageSize: setDistrictPageSize,
  } = usePagination({ data: tableDistricts, initialPageSize: 100 });

  useEffect(() => {
    setDistrictPage(1);
  }, [tableQuery, selectedDistrict, selectedStatus]);

  // Table search & pagination for Vendor Table
  const deferredVendorQuery = useDeferredValue(vendorQuery);
  const tableVendors = useMemo(() => {
    const q = deferredVendorQuery.trim().toLowerCase();
    return filteredVendors.filter((v) => {
      const vName = (
        v.vendor_name ||
        vendorMap[String(v.inst_vendor)] ||
        (v.inst_vendor ? `Vendor ${v.inst_vendor}` : '—')
      ).toLowerCase();
      return !q || vName.includes(q);
    });
  }, [filteredVendors, deferredVendorQuery, vendorMap]);

  const {
    paginatedData: pagedVendors,
    currentPage: vendorCurrentPage,
    pageSize: vendorPageSize,
    totalItems: vendorTotalItems,
    setPage: setVendorPage,
    setPageSize: setVendorPageSize,
  } = usePagination({ data: tableVendors, initialPageSize: 100 });

  useEffect(() => {
    setVendorPage(1);
  }, [vendorQuery, selectedVendor, selectedStatus]);

  // Percentages & Rates
  const pctComplete = pctOf(ssl.complete, ssl.site_count);
  const pctPending = pctOf(ssl.pending, ssl.site_count);
  const pctVerified = pctOf(ssl.verify_approved, ssl.complete || 1);
  const pctClaimApproved = pctOf(ssl.claim_approved, ssl.complete || 1);
  const pctPaid = pctOf(ssl.inst_pay_done, ssl.complete || 1);

  // Milestones list
  const milestones = [
    { label: '1. Allocated Solar Street Lights', v: ssl.site_count, of: ssl.site_count || 1, color: LIGHT_BLUE },
    { label: '2. Equipment Installed & Photos', v: ssl.complete, of: ssl.site_count || 1, color: LIGHT_GREEN },
    { label: '3. Field Verification Approved', v: ssl.verify_approved, of: ssl.complete || ssl.site_count || 1, color: LIGHT_CYAN },
    { label: '4. Claim Approved / Raised', v: ssl.claim_approved, of: ssl.complete || ssl.site_count || 1, color: LIGHT_VIOLET },
    { label: '5. Payment Disbursement Settled', v: ssl.inst_pay_done, of: ssl.complete || ssl.site_count || 1, color: LIGHT_AMBER },
  ];

  // Top districts for bar chart
  const chartDistricts = useMemo(
    () => [...filteredDistricts].sort((a, b) => (b.inst_complete || 0) - (a.inst_complete || 0)).slice(0, 15),
    [filteredDistricts]
  );

  // Sparklines datasets
  const siteSpark = filteredDistricts.length > 1 ? filteredDistricts.slice(0, 10).map((d) => d.light_count || 0) : undefined;
  const completeSpark = filteredDistricts.length > 1 ? filteredDistricts.slice(0, 10).map((d) => d.inst_complete || 0) : undefined;
  const pendingSpark = filteredDistricts.length > 1 ? filteredDistricts.slice(0, 10).map((d) => d.inst_pending || 0) : undefined;
  const verifySpark = filteredDistricts.length > 1 ? filteredDistricts.slice(0, 10).map((d) => d.verify_approved || 0) : undefined;

  const execRateSpark = filteredDistricts.length > 1 ? filteredDistricts.slice(0, 10).map((d) => pctOf(d.inst_complete, d.light_count)) : undefined;
  const auditPassSpark = filteredDistricts.length > 1 ? filteredDistricts.slice(0, 10).map((d) => pctOf(d.verify_approved, (d.verify_approved + d.verify_reject) || 1)) : undefined;
  const claimSpark = filteredDistricts.length > 1 ? filteredDistricts.slice(0, 10).map((d) => pctOf(d.payment_done, d.inst_complete || 1)) : undefined;

  // Export Columns definition for District Table
  const districtCols: ExportColumn<DistrictWiseItem>[] = useMemo(() => [
    { header: 'District', accessor: 'district' },
    { header: 'Allocated Lights', accessor: 'light_count' },
    { header: 'Assigned Lights', accessor: (d) => d.site_assigned ?? (Number(d.light_count) - Number(d.site_not_assigned ?? 0)) },
    { header: 'Unassigned Lights', accessor: (d) => d.site_not_assigned ?? 0 },
    { header: 'Installed Lights', accessor: 'inst_complete' },
    { header: 'Pending Lights', accessor: 'inst_pending' },
    { header: 'Verify Approved', accessor: 'verify_approved' },
    { header: 'Verify Pending', accessor: 'verify_pending' },
    { header: 'Rejected', accessor: 'verify_reject' },
    { header: 'Claim Approved', accessor: 'claim_approved' },
    { header: 'Payment Settled', accessor: 'payment_done' },
  ], []);

  // Export Columns definition for Vendor Table
  const vendorCols: ExportColumn<VendorWiseItem>[] = useMemo(() => [
    {
      header: 'Vendor Name',
      accessor: (v) =>
        v.vendor_name ||
        vendorMap[String(v.inst_vendor)] ||
        (v.inst_vendor ? `Vendor ${v.inst_vendor}` : '—'),
    },
    { header: 'Allocated Lights', accessor: 'light_count' },
    { header: 'Assigned Lights', accessor: (v) => v.site_assigned ?? (Number(v.light_count) - Number(v.site_not_assigned ?? 0)) },
    { header: 'Installed Lights', accessor: 'inst_complete' },
    { header: 'Today Installed', accessor: (v) => v.today_install ?? 0 },
    { header: 'Pending Lights', accessor: 'inst_pending' },
    { header: 'Verify Approved', accessor: 'verify_approved' },
    { header: 'Verify Pending', accessor: 'verify_pending' },
    { header: 'Rejected', accessor: 'verify_reject' },
    { header: 'Claim Approved', accessor: 'claim_approved' },
    { header: 'Payment Settled', accessor: 'payment_done' },
  ], [vendorMap]);

  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = 'Punjab_SSL_District_Overview';
  const fileTitle = 'Punjab SSL District-Wise Installation Performance';

  const getExportValue = <T,>(row: T, column: ExportColumn<T>) =>
    typeof column.accessor === 'function'
      ? (column.accessor as any)(row)
      : (row as Record<string, unknown>)[column.accessor as string];

  const escapeExportValue = (value: unknown) => String(value ?? '');

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

  const exportToCSV = <T,>(list: T[], columns: ExportColumn<T>[], filename: string) => {
    if (!list.length || !columns.length) return;
    const out = [
      columns.map((c) => c.header),
      ...list.map((row) => columns.map((c) => escapeExportValue(getExportValue(row, c)))),
    ];
    const csv = out.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(',')).join('\r\n');
    downloadTextFile(`\ufeff${csv}`, `${filename}.csv`, 'text/csv');
  };

  const copyToClipboard = async <T,>(list: T[], columns: ExportColumn<T>[]) => {
    if (!list.length || !columns.length) return;
    const t = [
      columns.map((c) => c.header).join('\t'),
      ...list.map((row) => columns.map((c) => escapeExportValue(getExportValue(row, c))).join('\t')),
    ].join('\n');
    try {
      await navigator.clipboard.writeText(t);
      alert('Data copied to clipboard!');
    } catch {
      const ta = document.createElement('textarea');
      ta.value = t;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      alert('Data copied to clipboard!');
    }
  };

  const exportToExcel = <T,>(list: T[], columns: ExportColumn<T>[], filename: string) => {
    if (!list.length || !columns.length) return;
    const tableHtml = `<table border="1"><thead><tr>${columns.map((c) => `<th>${escapeHtml(escapeExportValue(c.header))}</th>`).join('')}</tr></thead><tbody>${list.map((row) => `<tr>${columns.map((c) => `<td>${escapeHtml(escapeExportValue(getExportValue(row, c)))}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8" /></head><body>${tableHtml}</body></html>`;
    downloadTextFile(`\ufeff${html}`, `${filename}.xls`, 'application/vnd.ms-excel');
  };

  const exportToPDF = <T,>(list: T[], columns: ExportColumn<T>[], title: string) => {
    if (!list.length || !columns.length) return;
    const body = list.map((row) => columns.map((c) => escapeHtml(escapeExportValue(getExportValue(row, c)))));
    const w = window.open('', '_blank', 'width=1200,height=800');
    if (!w) return;
    w.document.write(`<!doctype html><html><head><meta charset="UTF-8" /><title>${escapeHtml(title)}</title><style>
      *{box-sizing:border-box}body{font-family:Arial,sans-serif;padding:24px;color:#222}h1{font-size:20px;margin:0 0 16px}
      table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #d8dee6;padding:6px 8px;text-align:left;vertical-align:top}
      th{background:#f3f5f7;font-weight:700}@media print{body{padding:0}@page{size:landscape;margin:10mm}}
    </style></head><body><h1>${escapeHtml(title)}</h1><table><thead><tr>${columns.map((c) => `<th>${escapeHtml(escapeExportValue(c.header))}</th>`).join('')}</tr></thead><tbody>${body.map((r) => `<tr>${r.map((v) => `<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table><script>window.onload=function(){window.print();};</script></body></html>`);
    w.document.close();
    w.focus();
  };

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      {/* 1. Page Header */}
      <PageHead
        title="Punjab SSL Dashboard"
        subtitle={
          <span style={{ display: 'inline-block', fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>
            Solar Street Light (SSL) Operations, District Analysis & Execution Throughput
            {updatedAt ? ` · Last updated ${updatedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}` : ''}
          </span>
        }
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Punjab' },
          { label: 'SSL' },
          { label: 'Dashboard' },
        ]}
        actions={
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill" style={{ fontWeight: 600, paddingInline: 'var(--ax-space-3)' }}>
              <span className="ax-badge__dot" /> State: Punjab
            </span>
            <Link to="/vendor-management/punjab/ssl/status-view?status=complete" className="ax-btn ax-btn--secondary ax-btn--sm">
              Status Register
            </Link>
            <Link to="/vendor-management/punjab/ssl/view-assign" className="ax-btn ax-btn--secondary ax-btn--sm">
              View Assigned Lights
            </Link>
            <Link to="/vendor-management/punjab/ssl/assign-installation" className="ax-btn ax-btn--primary ax-btn--sm">
              <span className="ax-btn__label">+ Assign SSL Lights</span>
            </Link>
          </div>
        }
      />

      <div className="ax-dash-grid mt-0 pt-0">
        {apiError && (
          <div className="ax-col--12" style={{ padding: '10px 14px', background: 'color-mix(in oklab, var(--ax-viz-red, #ef4444) 12%, transparent)', color: 'var(--ax-viz-red, #dc2626)', borderRadius: 'var(--ax-radius-md, 8px)', fontSize: 'var(--ax-text-xs)' }}>
            <b>Error loading dashboard data:</b> {apiError}
          </div>
        )}

        {/* 2. Operations Filter Bar */}
        <section
          className="ax-card ax-card--flat ax-col--12"
          role="region"
          aria-label="Punjab SSL Dashboard Filters"
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

              <div className="ax-cluster asw-filter-item">
                <label htmlFor="asw-district-select" style={labelStyle}>District:</label>
                <select
                  id="asw-district-select"
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
                <label htmlFor="asw-vendor-select" style={labelStyle}>Vendor:</label>
                <select
                  id="asw-vendor-select"
                  className="ax-input ax-input--sm"
                  style={{ height: 30, fontSize: 'var(--ax-text-xs)', paddingInline: '8px' }}
                  value={selectedVendor}
                  onChange={(e) => setSelectedVendor(e.target.value)}
                >
                  <option value="All">All Vendors ({vendorOptions.length})</option>
                  {vendorOptions.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>

              <div className="ax-cluster asw-filter-item">
                <label htmlFor="asw-volume-select" style={labelStyle}>Volume:</label>
                <select
                  id="asw-volume-select"
                  className="ax-input ax-input--sm"
                  style={{ height: 30, fontSize: 'var(--ax-text-xs)', paddingInline: '8px' }}
                  value={selectedVolume}
                  onChange={(e) => setSelectedVolume(e.target.value)}
                >
                  <option value="All">All Volumes ({volOptions.length})</option>
                  {volOptions.map((v) => <option key={v} value={v}>Volume {v}</option>)}
                </select>
              </div>

              <div className="ax-cluster asw-filter-item">
                <label htmlFor="asw-status-select" style={labelStyle}>Status:</label>
                <select
                  id="asw-status-select"
                  className="ax-input ax-input--sm"
                  style={{ height: 30, fontSize: 'var(--ax-text-xs)', paddingInline: '8px' }}
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="All">All Operations</option>
                  <option value="Complete">Installed Lights</option>
                  <option value="Pending">Pending Installation</option>
                  <option value="VerifyApproved">Verify Approved</option>
                  <option value="VerifyPending">Verification Pending</option>
                  <option value="VerifyReject">Verification Rejected</option>
                  <option value="ClaimApproved">Claim Approved</option>
                  <option value="PayDone">Payment Settled</option>
                </select>
              </div>

              {filtersActive && (
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--sm"
                  style={{ height: 28, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }}
                  onClick={() => { setSelectedDistrict('All'); setSelectedStatus('All'); setSelectedVendor('All'); setSelectedVolume('All'); setTableQuery(''); setVendorQuery(''); }}
                >
                  Reset Filters
                </button>
              )}
            </div>

            <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>
                Showing <b style={{ color: 'var(--ax-text-strong)' }}>{num(ssl.site_count)}</b> Total Lights ({num(ssl.site_assigned)} Assigned · {num(ssl.site_not_assigned)} Open) across <b style={{ color: 'var(--ax-text-strong)' }}>{filteredDistricts.length}</b> {filteredDistricts.length === 1 ? 'District' : 'Districts'}
              </span>
            </div>
          </div>

          {/* Quick Filter Status Tabs */}
          <div className="ax-cluster" style={{ gap: 6, flexWrap: 'wrap', width: '100%', marginTop: 8, paddingTop: 8, borderTop: '1px dashed var(--ax-border, #e2e8f0)' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ax-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Quick Filter:</span>
            {[
              { key: 'All', label: 'All Operations' },
              { key: 'Complete', label: 'Installed' },
              { key: 'Pending', label: 'Pending' },
              { key: 'VerifyApproved', label: 'Verify Approved' },
              { key: 'VerifyPending', label: 'In Audit' },
              { key: 'ClaimApproved', label: 'Claim Approved' },
              { key: 'PayDone', label: 'Payment Settled' },
            ].map((p) => {
              const isActive = selectedStatus === p.key;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setSelectedStatus(p.key)}
                  className={`ax-btn ax-btn--xs ${isActive ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
                  style={{
                    height: 24,
                    fontSize: '11px',
                    padding: '0 8px',
                    borderRadius: 12,
                    fontWeight: isActive ? 700 : 500,
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* 3. Executive Welcome Banner */}
        <section className="ax-card ax-welcome ax-col--12" role="region" aria-label="Punjab SSL Operations Overview">
          <div className="ax-welcome__body">
            <div className="ax-welcome__text">
              <p className="ax-welcome__eyebrow">
                Punjab Solar Street Light System {data?.company_id ? `· ${data.company_id}` : ''}
              </p>
              <h2 className="ax-card__title">
                Welcome, {data?.loginName || 'Manish Yadav'}
              </h2>
              <p className="ax-welcome__lede">
                {selectedDistrict !== 'All' ? (
                  <>
                    Punjab SSL execution overview for <b>{selectedDistrict}</b>: <b>{num(ssl.site_count)} solar street lights</b> allocated (<b>{num(ssl.site_assigned)}</b> assigned, <b>{num(ssl.site_not_assigned)}</b> unassigned).
                    <b> {num(ssl.complete)} ({pctComplete}%)</b> installed, with <b>{num(ssl.verify_approved)}</b> verified approved, <b>{num(ssl.claim_applicable)}</b> claim eligible, and <b>{num(ssl.inst_pay_done)}</b> payment settlements.
                  </>
                ) : (
                  <>
                    Punjab SSL execution overview: <b>{num(ssl.site_count)} solar street lights</b> allocated across <b>{districtOptions.length} districts</b> (<b>{num(ssl.site_assigned)}</b> assigned, <b>{num(ssl.site_not_assigned)}</b> unassigned).
                    <b> {num(ssl.complete)} ({pctComplete}%)</b> installed, with <b>{num(ssl.verify_approved)}</b> verified approved, <b>{num(ssl.claim_applicable)}</b> claim eligible, and <b>{num(ssl.inst_pay_done)}</b> payment settlements.
                  </>
                )}
              </p>
            </div>

            <dl className="ax-welcome__stats">
              <div className="ax-welcome__stat">
                <dt>{selectedDistrict !== 'All' ? 'District' : 'Total Districts'}</dt>
                <dd className="ax-num" style={{ fontSize: selectedDistrict !== 'All' ? '1.1rem' : undefined }}>
                  {selectedDistrict !== 'All' ? selectedDistrict : num(districtOptions.length)}
                </dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-emerald, #10b981)' }}>
                  {selectedDistrict !== 'All' ? 'Active Filter Scope' : `${volOptions.length} Volumes (${volOptions.join(', ')})`}
                </small>
              </div>
              <div className="ax-welcome__stat">
                <dt>Total / Assigned</dt>
                <dd className="ax-num">{num(ssl.site_count)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--asw-primary)' }}>{num(ssl.site_assigned)} Assigned · {num(ssl.site_not_assigned)} Open</small>
              </div>
              <div className="ax-welcome__stat">
                <dt>Installed Lights</dt>
                <dd className="ax-num">{num(ssl.complete)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-emerald, #10b981)' }}>{pctComplete}% Complete</small>
              </div>
              <div className="ax-welcome__stat">
                <dt>Verify Approved</dt>
                <dd className="ax-num">{num(ssl.verify_approved)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-amber, #f59e0b)' }}>{num(ssl.verify_pending)} In Audit</small>
              </div>
            </dl>
          </div>
        </section>

        {/* 4. Core KPI Cards */}
        <KpiCard
          icon={I_PIN}
          tone="accent"
          label="Total Allocated Lights"
          value={num(ssl.site_count)}
          unit="Lights"
          sub={`${num(ssl.site_assigned)} Assigned · ${num(ssl.site_not_assigned)} Unassigned`}
          spark={siteSpark}
          onClick={() => openDrillDown('total', 'Total Allocated Lights')}
        />

        <KpiCard
          icon={I_DONE}
          tone="emerald"
          label="Installed Lights"
          value={num(ssl.complete)}
          unit="Lights"
          sub="Equipment & photos uploaded"
          badge={`${pctComplete}%`}
          spark={completeSpark}
          onClick={() => openDrillDown('complete', 'Completed Installations')}
        />

        <KpiCard
          icon={I_CLOCK}
          tone="amber"
          label="Pending Installation"
          value={num(ssl.pending)}
          unit="Lights"
          sub="Awaiting field execution"
          badge={`${pctPending}%`}
          spark={pendingSpark}
          onClick={() => openDrillDown('pending', 'Pending Installations')}
        />

        <KpiCard
          icon={I_SHIELD}
          tone="cyan"
          label="Verify Approved"
          value={num(ssl.verify_approved)}
          unit="Lights"
          sub={`${num(ssl.verify_pending)} Audit in progress`}
          badge={`${pctVerified}%`}
          spark={verifySpark}
          onClick={() => openDrillDown('verify-approved', 'Verified Approved Lights')}
        />

        <KpiCard
          icon={I_CLOCK}
          tone="amber"
          label="Verification Pending"
          value={num(ssl.verify_pending)}
          unit="Lights"
          sub="Field audit pending review"
          onClick={() => openDrillDown('verify-pending', 'Verification Pending Lights')}
        />

        <KpiCard
          icon={I_X}
          tone="red"
          label="Verification Rejected"
          value={num(ssl.verify_reject)}
          unit="Lights"
          sub="Requires vendor rework"
          onClick={() => openDrillDown('verify-reject', 'Verification Rejected Lights')}
        />

        <KpiCard
          icon={I_DOC}
          tone="violet"
          label="Claim Applicable"
          value={num(ssl.claim_applicable)}
          unit="Lights"
          sub={`${num(ssl.claim_approved)} Approved · ${num(ssl.claim_pending)} Pending`}
          badge={`${pctClaimApproved}%`}
          onClick={() => openDrillDown('claim-applicable', 'Claim Applicable Lights')}
        />

        <KpiCard
          icon={I_CREDIT}
          tone="emerald"
          label="Payment Settled"
          value={num(ssl.inst_pay_done)}
          unit="Lights"
          sub={Number(data?.payment_amount) > 0 ? `₹${data?.payment_amount} settled` : '₹0.00 disbursement confirmed'}
          badge={`${pctPaid}%`}
          onClick={() => openDrillDown('pay-done', 'Payment Settled Lights')}
        />

        {/* 5. Operational Highlights & Execution Tracker */}
        <div className="ax-col--12" style={{ marginTop: 'var(--ax-space-3)', marginBottom: 'var(--ax-space-1)' }}>
          <div className="ax-cluster" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--ax-space-2)' }}>
            <div>
              <span className="ax-card__eyebrow" style={{ color: 'var(--asw-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                Operations & Quality Performance
              </span>
              <h2 className="ax-card__title" style={{ fontSize: 'var(--ax-text-lg)', margin: 0 }}>
                Execution Throughput & Quality Health
              </h2>
            </div>
            <span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--pill" style={{ fontSize: 'var(--ax-text-xs)' }}>
              Punjab SSL Vendor Portal
            </span>
          </div>
        </div>

        {/* Operational Highlights Cards */}
        <KpiCard
          icon={I_BOLT}
          tone="emerald"
          label="Execution Rate"
          value={`${pctComplete}%`}
          sub={`${num(ssl.complete)} of ${num(ssl.site_count)} lights installed`}
          badge="Installed"
          spark={execRateSpark}
          onClick={() => openDrillDown('complete', 'Completed Lights')}
        />

        <KpiCard
          icon={I_SHIELD}
          tone="cyan"
          label="Audit Pass Rate"
          value={`${pctOf(ssl.verify_approved, (ssl.verify_approved + ssl.verify_reject) || 1)}%`}
          sub={`${num(ssl.verify_approved)} Passed · ${num(ssl.verify_reject)} Rejected`}
          spark={auditPassSpark}
          onClick={() => openDrillDown('verify-approved', 'Approved Audits')}
        />

        <KpiCard
          icon={I_DOC}
          tone="violet"
          label="Claim Clearance"
          value={`${pctClaimApproved}%`}
          sub={`${num(ssl.claim_approved)} claims authorized`}
          onClick={() => openDrillDown('claim-approved', 'Claim Authorized Lights')}
        />

        <KpiCard
          icon={I_CREDIT}
          tone="accent"
          label="Claim Settlement"
          value={`${pctPaid}%`}
          sub={`${num(ssl.inst_pay_done)} lights disbursed`}
          spark={claimSpark}
          onClick={() => openDrillDown('pay-done', 'Settled Claims')}
        />

        {/* State Operations Executive Card */}
        <section className="ax-card ax-col--12" role="region" aria-label="Punjab SSL Operations Overview">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow" style={{ color: 'var(--asw-primary)' }}>State Operations</span>
              <h3 className="ax-card__title">Punjab · Solar Street Light (SSL) Operations</h3>
              <p className="ax-card__subtitle">{num(ssl.complete)} lights installed across {districtOptions.length} districts in Punjab</p>
            </div>
            <Link to="/vendor-management/punjab/ssl/view-assign" className="ax-btn ax-btn--sm ax-btn--primary">
              View Installation Register →
            </Link>
          </div>
          <div className="ax-card__body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-3)' }}>
            <div className="ax-grid ax-grid--2" style={{ gap: 'var(--ax-space-2)' }}>
              <div style={{ padding: '10px 12px', background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 'var(--ax-radius-md, 8px)' }}>
                <small style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-xs)' }}>Installed & Operational</small>
                <div style={{ fontSize: 'var(--ax-text-lg)', fontWeight: 700, color: 'var(--ax-viz-emerald, #10b981)' }}>
                  {num(ssl.complete)} <span style={{ fontSize: 'var(--ax-text-xs)', fontWeight: 500 }}>({pctComplete}%)</span>
                </div>
              </div>
              <div style={{ padding: '10px 12px', background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 'var(--ax-radius-md, 8px)' }}>
                <small style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-xs)' }}>Pending Execution</small>
                <div style={{ fontSize: 'var(--ax-text-lg)', fontWeight: 700, color: 'var(--ax-viz-amber, #f59e0b)' }}>
                  {num(ssl.pending)} <span style={{ fontSize: 'var(--ax-text-xs)', fontWeight: 500 }}>({pctPending}%)</span>
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
              <b>Verification & Compliance:</b> {num(ssl.verify_approved)} lights approved by auditor ({pctVerified}%) · {num(ssl.claim_approved)} claims approved · {num(ssl.inst_pay_done)} payment settlements confirmed.
            </div>
          </div>
        </section>

        {/* 6. Charts: District Wise Installations + Status Donut */}
        <section className="ax-card ax-card--chart ax-col--8" role="region" aria-label="District wise installations">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Geographic Breakdown</span>
              <h2 className="ax-card__title">District Wise Installations</h2>
              <p className="ax-card__subtitle">{num(ssl.complete)} installed of {num(ssl.site_count)} allocated across {districtOptions.length} districts</p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)' }}>
                {[
                  { l: 'Installed Lights', c: LIGHT_GREEN },
                  { l: 'Allocated Lights', c: LIGHT_BLUE },
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
                  key={`dist-chart-${chartH}-${chartDistricts.map((d) => `${d.district}-${d.inst_complete}-${d.light_count}`).join('-')}`}
                  type="bar"
                  height={chartH}
                  legend="none"
                  ariaLabel="District-wise installation comparison"
                  series={[
                    { name: 'Installed Lights', data: chartDistricts.map((d) => d.inst_complete || 0) },
                    { name: 'Allocated Lights', data: chartDistricts.map((d) => d.light_count || 0) },
                  ]}
                  apex={{
                    colors: [LIGHT_GREEN, LIGHT_BLUE],
                    plotOptions: { bar: { horizontal: false, borderRadius: 4, columnWidth: '35%' } },
                    xaxis: { categories: chartDistricts.map((d) => d.district), labels: { style: { fontSize: '11px' }, rotate: -35 } },
                    yaxis: { title: { text: 'Solar Lights (Nos.)', style: { color: 'var(--ax-text-muted)' } } },
                    chart: {
                      events: {
                        dataPointSelection: (_event: unknown, _chart: unknown, opts: any) => {
                          const dist = chartDistricts[opts?.dataPointIndex]?.district;
                          if (dist) openDrillDown('complete', 'Completed Installations', dist);
                        },
                      },
                    },
                  }}
                />
              </Suspense>
            ) : (
              <div style={{ height: chartH, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--ax-text-muted)', gap: 8 }}>
                <span style={{ fontSize: 'var(--ax-text-sm)', fontWeight: 500 }}>No district data returned by server.</span>
              </div>
            )}
          </div>
        </section>

        {/* Status Distribution Donut Chart */}
        <section className="ax-card ax-col--4" role="region" aria-label="Installation status split">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Execution Distribution</span>
              <h2 className="ax-card__title">Status Breakdown</h2>
              <p className="ax-card__subtitle">Total {num(ssl.site_count)} Solar Street Lights</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <Suspense fallback={<div className="ax-skeleton" style={{ height: donutH }} />}>
              <ApexChart
                key={`donut-${donutH}-${ssl.complete}-${ssl.pending}-${ssl.verify_reject}`}
                type="donut"
                height={donutH}
                legend="none"
                ariaLabel="Installed, pending and rejected distribution"
                series={[ssl.complete, ssl.pending, ssl.verify_reject]}
                apex={{
                  labels: ['Installed', 'Pending', 'Rework Required'],
                  colors: [LIGHT_GREEN, LIGHT_AMBER, LIGHT_RED],
                  stroke: { width: 0 },
                  chart: {
                    events: {
                      dataPointSelection: (_event: unknown, _chart: unknown, opts: any) => {
                        const labels = ['complete', 'pending', 'verify-reject'];
                        const key = labels[opts?.dataPointIndex];
                        if (key) openDrillDown(key, 'Lights Drilldown');
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
                { label: 'Installed', sub: 'Completed lights', v: ssl.complete, p: pctComplete, color: LIGHT_GREEN, key: 'complete' },
                { label: 'Pending', sub: 'Awaiting execution', v: ssl.pending, p: pctPending, color: LIGHT_AMBER, key: 'pending' },
                { label: 'Rework Required', sub: 'Audit rejected', v: ssl.verify_reject, p: pctOf(ssl.verify_reject, ssl.site_count), color: LIGHT_RED, key: 'verify-reject' },
              ].map((s) => (
                <li
                  key={s.label}
                  className="ax-list__row"
                  style={{ border: 0, paddingInline: 0, cursor: 'pointer' }}
                  onClick={() => openDrillDown(s.key, s.label)}
                >
                  <span className="ax-list__leading"><i style={{ width: 9, height: 9, borderRadius: 3, background: s.color, display: 'inline-block' }} /></span>
                  <span className="ax-list__content">
                    <span className="ax-list__title" style={{ fontWeight: 'var(--ax-weight-medium)' }}>{s.label}</span>
                    <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>{s.sub}</span>
                  </span>
                  <span className="ax-list__trailing ax-num" style={{ color: 'var(--ax-text-strong)', fontWeight: 600 }}>{num(s.v)} ({s.p}%)</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 7. Monthly Installation Throughput + Milestones */}
        <section className="ax-card ax-card--chart ax-col--8" role="region" aria-label="Monthly installation throughput">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Monthly Execution</span>
              <h2 className="ax-card__title">Monthly Installation Trend</h2>
              <p className="ax-card__subtitle">Installation pace and throughput across recent months</p>
            </div>
            <div className="ax-card__actions">
              <span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--pill">
                {monthlyInstallations.length} Months Tracked
              </span>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            {monthlyInstallations.length > 0 ? (
              <Suspense fallback={<div className="ax-skeleton" style={{ height: chartH }} />}>
                <ApexChart
                  key={`monthly-${chartH}-${monthlyInstallations.map((m) => `${m.month_year}-${m.monthly_installations}`).join('-')}`}
                  type="area"
                  height={chartH}
                  legend="top"
                  ariaLabel="Monthly installations area chart"
                  series={[
                    {
                      name: 'Monthly Installed Lights',
                      data: monthlyInstallations.map((m) => m.monthly_installations || 0),
                    },
                  ]}
                  apex={{
                    colors: [LIGHT_BLUE],
                    stroke: { curve: 'smooth', width: 2 },
                    fill: {
                      type: 'gradient',
                      gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.05, stops: [0, 90, 100] },
                    },
                    markers: { size: 4, strokeWidth: 0, hover: { size: 6 } },
                    xaxis: {
                      categories: monthlyInstallations.map((m) => m.month_year),
                    },
                    yaxis: { title: { text: 'Installed (Nos.)', style: { color: 'var(--ax-text-muted)' } } },
                  }}
                />
              </Suspense>
            ) : (
              <div style={{ height: chartH, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--ax-text-muted)', gap: 8 }}>
                <svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
                  <path d="M3 3v18h18" />
                  <path d="m19 9-5 5-4-4-3 3" />
                </svg>
                <span style={{ fontSize: 'var(--ax-text-sm)', fontWeight: 500 }}>No monthly installation timeline data returned by server.</span>
              </div>
            )}
          </div>
        </section>

        {/* SSL Workflow Milestones */}
        <section className="ax-card ax-col--4" role="region" aria-label="SSL Workflow Milestones">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Workflow Lifecycle</span>
              <h2 className="ax-card__title">SSL Milestones</h2>
              <p className="ax-card__subtitle">Progress across installation stages</p>
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
        <section className="ax-card ax-col--8" role="region" aria-label="District wise summary table">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Geographic Breakdown</span>
              <h2 className="ax-card__title">District Wise SSL Summary</h2>
              <p className="ax-card__subtitle">Allocated, installed, verification & payment metrics per district</p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                <SearchInput
                  value={tableQuery}
                  onChange={setTableQuery}
                  placeholder="Search district…"
                  ariaLabel="Search districts"
                />
                <TableExportToolbar
                  onCopy={() => copyToClipboard(tableDistricts, districtCols)}
                  onExportCSV={() => exportToCSV(tableDistricts, districtCols, `${fileBase}_${stamp}`)}
                  onExportExcel={() => exportToExcel(tableDistricts, districtCols, `${fileBase}_${stamp}`)}
                  onExportPDF={() => exportToPDF(tableDistricts, districtCols, fileTitle)}
                />
              </div>
            </div>
          </div>

          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover">
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">District</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Allocated</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Assigned</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Unassigned</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Installed</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Pending</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Verify Approved</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">In Audit</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Rejected</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Claim Approved</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Payment Settled</th>
                </tr>
              </thead>
              <tbody>
                {pagedDistricts.map((d) => {
                  const assignedCount = d.site_assigned !== undefined ? d.site_assigned : (Number(d.light_count || 0) - Number(d.site_not_assigned || 0));
                  const unassignedCount = Number(d.site_not_assigned || 0);

                  return (
                    <tr
                      key={d.district}
                      className="ax-table__row"
                      role="button"
                      tabIndex={0}
                      onClick={() => openDrillDown('complete', 'District Installations', d.district)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDrillDown('complete', 'District Installations', d.district); } }}
                      style={{ cursor: 'pointer' }}
                    >
                      <td className="ax-table__td" style={{ fontWeight: 'var(--ax-weight-semibold)', color: 'var(--ax-text-strong)' }}>
                        <b>{d.district}</b>
                      </td>
                      <td
                        className="ax-table__td ax-table__td--num ax-num"
                        style={{ fontWeight: 600, cursor: 'pointer' }}
                        title={`View all allocated lights in ${d.district}`}
                        onClick={(e) => { e.stopPropagation(); openDrillDown('total', 'Allocated Lights', d.district); }}
                      >
                        {num(d.light_count || 0)}
                      </td>
                      <td
                        className="ax-table__td ax-table__td--num ax-num"
                        style={{ color: '#2563eb', fontWeight: 600 }}
                        title={`Assigned lights in ${d.district}`}
                      >
                        {num(assignedCount)}
                      </td>
                      <td
                        className="ax-table__td ax-table__td--num ax-num"
                        style={{ color: unassignedCount > 0 ? 'var(--ax-viz-amber, #f59e0b)' : 'var(--ax-text-muted)', fontWeight: 600 }}
                        title={`Unassigned lights in ${d.district}`}
                      >
                        {num(unassignedCount)}
                      </td>
                      <td
                        className="ax-table__td ax-table__td--num ax-num"
                        style={{ color: 'var(--ax-viz-emerald, #10b981)', fontWeight: 600, cursor: 'pointer' }}
                        title={`View completed lights in ${d.district}`}
                        onClick={(e) => { e.stopPropagation(); openDrillDown('complete', 'Installed Lights', d.district); }}
                      >
                        {num(d.inst_complete || 0)}
                      </td>
                      <td
                        className="ax-table__td ax-table__td--num ax-num"
                        style={{ color: 'var(--ax-viz-amber, #f59e0b)', fontWeight: 600, cursor: 'pointer' }}
                        title={`View pending lights in ${d.district}`}
                        onClick={(e) => { e.stopPropagation(); openDrillDown('pending', 'Pending Lights', d.district); }}
                      >
                        {num(d.inst_pending || 0)}
                      </td>
                      <td
                        className="ax-table__td ax-table__td--num ax-num"
                        style={{ color: 'var(--ax-viz-cyan, #0891b2)', fontWeight: 600, cursor: 'pointer' }}
                        title={`View verify approved lights in ${d.district}`}
                        onClick={(e) => { e.stopPropagation(); openDrillDown('verify-approved', 'Verify Approved Lights', d.district); }}
                      >
                        {num(d.verify_approved || 0)}
                      </td>
                      <td
                        className="ax-table__td ax-table__td--num ax-num"
                        style={{ color: 'var(--ax-viz-violet, #7c3aed)', fontWeight: 600, cursor: 'pointer' }}
                        title={`View in-audit lights in ${d.district}`}
                        onClick={(e) => { e.stopPropagation(); openDrillDown('verify-pending', 'In Audit Lights', d.district); }}
                      >
                        {num(d.verify_pending || 0)}
                      </td>
                      <td
                        className="ax-table__td ax-table__td--num ax-num"
                        style={{ color: 'var(--ax-viz-red, #ef4444)', fontWeight: 600, cursor: 'pointer' }}
                        title={`View rejected lights in ${d.district}`}
                        onClick={(e) => { e.stopPropagation(); openDrillDown('verify-reject', 'Rejected Lights', d.district); }}
                      >
                        {num(d.verify_reject || 0)}
                      </td>
                      <td
                        className="ax-table__td ax-table__td--num ax-num"
                        style={{ color: 'var(--ax-viz-violet, #7c3aed)', fontWeight: 600, cursor: 'pointer' }}
                        title={`View claim approved lights in ${d.district}`}
                        onClick={(e) => { e.stopPropagation(); openDrillDown('claim-approved', 'Claim Approved Lights', d.district); }}
                      >
                        {num(d.claim_approved || 0)}
                      </td>
                      <td
                        className="ax-table__td ax-table__td--num ax-num"
                        style={{ color: 'var(--ax-viz-emerald, #10b981)', fontWeight: 600, cursor: 'pointer' }}
                        title={`View payment settled lights in ${d.district}`}
                        onClick={(e) => { e.stopPropagation(); openDrillDown('pay-done', 'Payment Settled Lights', d.district); }}
                      >
                        {num(d.payment_done || 0)}
                      </td>
                    </tr>
                  );
                })}
                {!loading && pagedDistricts.length === 0 && (
                  <tr>
                    <td className="ax-table__td" colSpan={11} style={{ textAlign: 'center', color: 'var(--ax-text-muted)', padding: 24 }}>
                      No districts match the filter criteria.
                    </td>
                  </tr>
                )}
                {pagedDistricts.length > 0 && (
                  <tr className="ax-table__row" style={{ background: 'var(--ax-surface-subtle, #f8fafc)', fontWeight: 'var(--ax-weight-bold)' }}>
                    <td className="ax-table__td" style={{ color: 'var(--ax-text-strong)' }}>Total (All Districts)</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ cursor: 'pointer' }} title="View all allocated lights" onClick={() => openDrillDown('total', 'Total Allocated Lights')}>{num(ssl.site_count)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: '#2563eb' }}>{num(ssl.site_assigned)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: ssl.site_not_assigned > 0 ? 'var(--ax-viz-amber, #f59e0b)' : 'var(--ax-text-muted)' }}>{num(ssl.site_not_assigned)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-emerald, #10b981)', cursor: 'pointer' }} title="View completed lights" onClick={() => openDrillDown('complete', 'Total Installed Lights')}>{num(ssl.complete)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-amber, #f59e0b)', cursor: 'pointer' }} title="View pending lights" onClick={() => openDrillDown('pending', 'Total Pending Lights')}>{num(ssl.pending)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-cyan, #0891b2)', cursor: 'pointer' }} title="View verify approved lights" onClick={() => openDrillDown('verify-approved', 'Total Verify Approved Lights')}>{num(ssl.verify_approved)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-violet, #7c3aed)', cursor: 'pointer' }} title="View in audit lights" onClick={() => openDrillDown('verify-pending', 'Total In-Audit Lights')}>{num(ssl.verify_pending)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-red, #ef4444)', cursor: 'pointer' }} title="View rejected lights" onClick={() => openDrillDown('verify-reject', 'Total Rejected Lights')}>{num(ssl.verify_reject)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-violet, #7c3aed)', cursor: 'pointer' }} title="View claim approved lights" onClick={() => openDrillDown('claim-approved', 'Total Claim Approved Lights')}>{num(ssl.claim_approved)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-emerald, #10b981)', cursor: 'pointer' }} title="View payment settled lights" onClick={() => openDrillDown('pay-done', 'Total Payment Settled Lights')}>{num(ssl.inst_pay_done)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="ax-card__footer" style={footerStyle}>
            <div className="ula-pagination-left">
              <Pagination
                currentPage={districtCurrentPage}
                curPage={districtCurrentPage}
                totalItems={districtTotalItems}
                total={districtTotalItems}
                pageSize={districtPageSize}
                onPageChange={setDistrictPage}
                setPage={setDistrictPage}
                onPageSizeChange={setDistrictPageSize}
                pageSizeOptions={[10, 25, 50, 100, 200]}
              />
            </div>
          </div>
        </section>

        {/* 9. District Quick-Access & Recent Activity */}
        <section className="ax-card ax-col--4" role="region" aria-label="District Status & Quick Navigation">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">District Operations</span>
              <h2 className="ax-card__title">District Quick Access</h2>
              <p className="ax-card__subtitle">Installation progress by district</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <div>
              <div className="ax-cluster" style={{ justifyContent: 'space-between', marginBottom: 'var(--ax-space-2)' }}>
                <span style={{ fontSize: 'var(--ax-text-sm)', fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                  Top Execution Districts
                </span>
                <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill">{num(ssl.complete)} Installed</span>
              </div>
              <div className="ax-statgroup ax-statgroup--stack" style={{ gap: 'var(--ax-space-2)' }}>
                {(filteredDistricts.length > 0 ? filteredDistricts : districtwise).slice(0, 8).map((d) => (
                  <button
                    key={d.district}
                    type="button"
                    className="ax-cluster"
                    onClick={() => openDrillDown('complete', 'District Installations', d.district)}
                    style={{ width: '100%', justifyContent: 'space-between', fontSize: 'var(--ax-text-xs)', border: 0, background: 'transparent', padding: '6px 0', cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid var(--ax-border-subtle, #f1f5f9)' }}
                  >
                    <span style={{ color: 'var(--ax-text-muted)', fontWeight: 500 }}>{d.district}</span>
                    <b className="ax-num" style={{ color: 'var(--ax-viz-emerald, #10b981)' }}>
                      {num(d.inst_complete || 0)} / {num(d.light_count || 0)} ({pctOf(d.inst_complete || 0, d.light_count || 1)}%)
                    </b>
                  </button>
                ))}
                {districtwise.length === 0 && <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>{loading ? 'Loading districts…' : 'No district data.'}</span>}
              </div>
            </div>

            <div className="ax-divider" style={{ marginBlock: 'var(--ax-space-3)' }} />

            {/* Today's Field Execution Activity from vendor_today_installation */}
            <div>
              <div className="ax-cluster" style={{ justifyContent: 'space-between', marginBottom: 'var(--ax-space-2)' }}>
                <span style={{ fontSize: 'var(--ax-text-sm)', fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                  Today's Field Execution
                </span>
                <span className="ax-badge ax-badge--soft ax-badge--primary ax-badge--pill">
                  {num(totalTodayInstalled)} Today
                </span>
              </div>
              <div className="ax-statgroup ax-statgroup--stack" style={{ gap: 'var(--ax-space-2)' }}>
                {todayInstallations.map((t) => (
                  <div
                    key={t.inst_vendor}
                    className="ax-cluster"
                    style={{ width: '100%', justifyContent: 'space-between', fontSize: 'var(--ax-text-xs)', padding: '5px 0', borderBottom: '1px solid var(--ax-border-subtle, #f1f5f9)' }}
                  >
                    <span style={{ color: 'var(--ax-text-muted)', fontWeight: 500 }}>
                      {t.vendor_name || vendorMap[String(t.inst_vendor)] || `Vendor ${t.inst_vendor}`}
                    </span>
                    <b className="ax-num" style={{ color: t.today_install > 0 ? 'var(--ax-viz-emerald, #10b981)' : 'var(--ax-text-muted)' }}>
                      {num(t.today_install)} Installed
                    </b>
                  </div>
                ))}
                {todayInstallations.length === 0 && (
                  <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
                    No vendor installation logged today.
                  </span>
                )}
              </div>
            </div>

            <div className="ax-divider" style={{ marginBlock: 'var(--ax-space-4)' }} />

            {/* Quick Actions Links */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 'var(--ax-text-xs)', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)', letterSpacing: '0.04em' }}>
                Quick Module Actions
              </span>
              <Link to="/vendor-management/punjab/ssl/view-assign" className="ax-btn ax-btn--secondary ax-btn--sm" style={{ justifyContent: 'space-between' }}>
                <span>View Assigned Lights</span>
                <span>→</span>
              </Link>
              <Link to="/vendor-management/punjab/ssl/assign-installation" className="ax-btn ax-btn--primary ax-btn--sm" style={{ justifyContent: 'space-between' }}>
                <span>Assign SSL Installation Lights</span>
                <span>+</span>
              </Link>
              <Link to="/vendor-management/punjab/ssl/verify-installation" className="ax-btn ax-btn--secondary ax-btn--sm" style={{ justifyContent: 'space-between' }}>
                <span>Verify Installation Lights</span>
                <span>✓</span>
              </Link>
            </div>
          </div>
        </section>

        {/* 10. Vendor Wise Detailed Table */}
        <section className="ax-card ax-col--12" role="region" aria-label="Vendor wise summary table">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Vendor Performance</span>
              <h2 className="ax-card__title">Vendor Wise SSL Summary</h2>
              <p className="ax-card__subtitle">Allocated, assigned, installed, daily pace & audit metrics per vendor in Punjab</p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                <SearchInput
                  value={vendorQuery}
                  onChange={setVendorQuery}
                  placeholder="Search vendor…"
                  ariaLabel="Search vendors"
                />
                <TableExportToolbar
                  onCopy={() => copyToClipboard(tableVendors, vendorCols)}
                  onExportCSV={() => exportToCSV(tableVendors, vendorCols, `Punjab_SSL_Vendor_Overview_${stamp}`)}
                  onExportExcel={() => exportToExcel(tableVendors, vendorCols, `Punjab_SSL_Vendor_Overview_${stamp}`)}
                  onExportPDF={() => exportToPDF(tableVendors, vendorCols, 'Punjab SSL Vendor Performance')}
                />
              </div>
            </div>
          </div>

          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover">
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">Vendor Name</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Allocated</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Assigned</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Installed</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Today Installed</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Pending</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Verify Approved</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">In Audit</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Rejected</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Claim Approved</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Payment Settled</th>
                </tr>
              </thead>
              <tbody>
                {pagedVendors.map((v) => {
                  const resolvedVendorName =
                    v.vendor_name ||
                    vendorMap[String(v.inst_vendor)] ||
                    (v.inst_vendor ? `Vendor ${v.inst_vendor}` : '—');
                  const assignedCount = v.site_assigned !== undefined ? v.site_assigned : (Number(v.light_count || 0) - Number(v.site_not_assigned || 0));

                  return (
                    <tr
                      key={v.inst_vendor}
                      className="ax-table__row"
                      role="button"
                      tabIndex={0}
                      onClick={() => openDrillDown('complete', 'Vendor Installations', undefined, v.inst_vendor)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td className="ax-table__td" style={{ fontWeight: 'var(--ax-weight-semibold)', color: 'var(--ax-text-strong)' }}>
                        <b>{resolvedVendorName}</b>
                      </td>
                      <td
                        className="ax-table__td ax-table__td--num ax-num"
                        style={{ fontWeight: 600, cursor: 'pointer' }}
                        title={`View all allocated lights for ${resolvedVendorName}`}
                        onClick={(e) => { e.stopPropagation(); openDrillDown('total', 'Allocated Lights', undefined, v.inst_vendor); }}
                      >
                        {num(v.light_count || 0)}
                      </td>
                      <td
                        className="ax-table__td ax-table__td--num ax-num"
                        style={{ color: '#2563eb', fontWeight: 600 }}
                        title={`Assigned lights for ${resolvedVendorName}`}
                      >
                        {num(assignedCount)}
                      </td>
                      <td
                        className="ax-table__td ax-table__td--num ax-num"
                        style={{ color: 'var(--ax-viz-emerald, #10b981)', fontWeight: 600, cursor: 'pointer' }}
                        title={`View completed lights for ${resolvedVendorName}`}
                        onClick={(e) => { e.stopPropagation(); openDrillDown('complete', 'Installed Lights', undefined, v.inst_vendor); }}
                      >
                        {num(v.inst_complete || 0)}
                      </td>
                      <td
                        className="ax-table__td ax-table__td--num ax-num"
                        style={{ color: (v.today_install || 0) > 0 ? 'var(--ax-viz-emerald, #10b981)' : 'var(--ax-text-muted)', fontWeight: 600 }}
                        title={`Installed today by ${resolvedVendorName}`}
                      >
                        {num(v.today_install || 0)}
                      </td>
                      <td
                        className="ax-table__td ax-table__td--num ax-num"
                        style={{ color: 'var(--ax-viz-amber, #f59e0b)', fontWeight: 600, cursor: 'pointer' }}
                        title={`View pending lights for ${resolvedVendorName}`}
                        onClick={(e) => { e.stopPropagation(); openDrillDown('pending', 'Pending Lights', undefined, v.inst_vendor); }}
                      >
                        {num(v.inst_pending || 0)}
                      </td>
                      <td
                        className="ax-table__td ax-table__td--num ax-num"
                        style={{ color: 'var(--ax-viz-cyan, #0891b2)', fontWeight: 600, cursor: 'pointer' }}
                        title={`View verify approved lights for ${resolvedVendorName}`}
                        onClick={(e) => { e.stopPropagation(); openDrillDown('verify-approved', 'Verify Approved Lights', undefined, v.inst_vendor); }}
                      >
                        {num(v.verify_approved || 0)}
                      </td>
                      <td
                        className="ax-table__td ax-table__td--num ax-num"
                        style={{ color: 'var(--ax-viz-violet, #7c3aed)', fontWeight: 600, cursor: 'pointer' }}
                        title={`View verify pending lights for ${resolvedVendorName}`}
                        onClick={(e) => { e.stopPropagation(); openDrillDown('verify-pending', 'Verify Pending Lights', undefined, v.inst_vendor); }}
                      >
                        {num(v.verify_pending || 0)}
                      </td>
                      <td
                        className="ax-table__td ax-table__td--num ax-num"
                        style={{ color: 'var(--ax-viz-red, #ef4444)', fontWeight: 600, cursor: 'pointer' }}
                        title={`View rejected lights for ${resolvedVendorName}`}
                        onClick={(e) => { e.stopPropagation(); openDrillDown('verify-reject', 'Rejected Lights', undefined, v.inst_vendor); }}
                      >
                        {num(v.verify_reject || 0)}
                      </td>
                      <td
                        className="ax-table__td ax-table__td--num ax-num"
                        style={{ color: 'var(--ax-viz-violet, #7c3aed)', fontWeight: 600, cursor: 'pointer' }}
                        title={`View claim approved lights for ${resolvedVendorName}`}
                        onClick={(e) => { e.stopPropagation(); openDrillDown('claim-approved', 'Claim Approved Lights', undefined, v.inst_vendor); }}
                      >
                        {num(v.claim_approved || 0)}
                      </td>
                      <td
                        className="ax-table__td ax-table__td--num ax-num"
                        style={{ color: 'var(--ax-viz-emerald, #10b981)', fontWeight: 600, cursor: 'pointer' }}
                        title={`View payment settled lights for ${resolvedVendorName}`}
                        onClick={(e) => { e.stopPropagation(); openDrillDown('pay-done', 'Payment Settled Lights', undefined, v.inst_vendor); }}
                      >
                        {num(v.payment_done || 0)}
                      </td>
                    </tr>
                  );
                })}
                {!loading && pagedVendors.length === 0 && (
                  <tr>
                    <td className="ax-table__td" colSpan={11} style={{ textAlign: 'center', color: 'var(--ax-text-muted)', padding: 24 }}>
                      No vendors match the filter criteria.
                    </td>
                  </tr>
                )}
                {pagedVendors.length > 0 && (
                  <tr className="ax-table__row" style={{ background: 'var(--ax-surface-subtle, #f8fafc)', fontWeight: 'var(--ax-weight-bold)' }}>
                    <td className="ax-table__td" style={{ color: 'var(--ax-text-strong)' }}>Total (All Vendors)</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ cursor: 'pointer' }} title="View all allocated lights" onClick={() => openDrillDown('total', 'Total Allocated Lights')}>{num(ssl.site_count)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: '#2563eb' }}>{num(ssl.site_assigned)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-emerald, #10b981)', cursor: 'pointer' }} title="View completed lights" onClick={() => openDrillDown('complete', 'Total Installed Lights')}>{num(ssl.complete)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-emerald, #10b981)' }}>{num(totalTodayInstalled)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-amber, #f59e0b)', cursor: 'pointer' }} title="View pending lights" onClick={() => openDrillDown('pending', 'Total Pending Lights')}>{num(ssl.pending)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-cyan, #0891b2)', cursor: 'pointer' }} title="View verify approved lights" onClick={() => openDrillDown('verify-approved', 'Total Verify Approved Lights')}>{num(ssl.verify_approved)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-violet, #7c3aed)', cursor: 'pointer' }} title="View in audit lights" onClick={() => openDrillDown('verify-pending', 'Total In-Audit Lights')}>{num(ssl.verify_pending)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-red, #ef4444)', cursor: 'pointer' }} title="View rejected lights" onClick={() => openDrillDown('verify-reject', 'Total Rejected Lights')}>{num(ssl.verify_reject)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-violet, #7c3aed)', cursor: 'pointer' }} title="View claim approved lights" onClick={() => openDrillDown('claim-approved', 'Total Claim Approved Lights')}>{num(ssl.claim_approved)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-emerald, #10b981)', cursor: 'pointer' }} title="View payment settled lights" onClick={() => openDrillDown('pay-done', 'Total Payment Settled Lights')}>{num(ssl.inst_pay_done)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="ax-card__footer" style={footerStyle}>
            <div className="ula-pagination-left">
              <Pagination
                currentPage={vendorCurrentPage}
                curPage={vendorCurrentPage}
                totalItems={vendorTotalItems}
                total={vendorTotalItems}
                pageSize={vendorPageSize}
                onPageChange={setVendorPage}
                setPage={setVendorPage}
                onPageSizeChange={setVendorPageSize}
                pageSizeOptions={[10, 25, 50, 100, 200]}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default PunjabSslDashboard;
