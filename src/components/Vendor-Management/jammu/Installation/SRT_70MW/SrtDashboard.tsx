import { lazy, Suspense, useCallback, useEffect, useMemo, useState, useDeferredValue, type ReactNode } from 'react';
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
  jammuSrt70mwAdminService,
  type DashboardData,
  type DashboardDistrictWiseItem,
  type DashboardVendorWiseItem,
  type DashboardMonthlyInstallation,
} from './jammuSrt70mwAdminService';

// Code-split ApexCharts so Jammu SRT 70MW Dashboard shell renders instantly
const ApexChart = lazy(() => import('../../../../charts/ApexChart').then((m) => ({ default: m.ApexChart })));

// Palette constants matching Solar ERP design language
const LIGHT_BLUE = '#2563eb';
const LIGHT_GREEN = '#10b981';
const LIGHT_CYAN = '#0891b2';
const LIGHT_AMBER = '#f59e0b';
const LIGHT_VIOLET = '#7c3aed';
const LIGHT_RED = '#ef4444';
const LIGHT_PINK = '#db2777';

const num = (x: number | string | undefined | null) => (Number(x || 0)).toLocaleString('en-IN');
const pctOf = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : 0);
const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Responsive chart height hook matching Solar ERP standard
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

  /* ───── Card header (desktop): prioritize title width, condense actions ───── */
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

  /* Tables: responsive scroll container - NO fixed/sticky columns */
  .solar-erp-page .ax-table-wrap,
  .solar-erp-page .ax-table-wrapper {
    width: 100%;
    max-width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  .solar-erp-page .ax-table { min-width: 950px; }
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

  /* Section header title badge */
  .asw-kpi-group-header {
    margin-top: 18px;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
  }

  /* ───── Tablet (<=1100px) ───── */
  @media (max-width: 1100px) {
    .solar-erp-page .ax-col--8,
    .solar-erp-page .ax-col--6,
    .solar-erp-page .ax-col--4 {
      flex: 0 0 100% !important;
      max-width: 100% !important;
    }
  }

  /* ───── Mobile (<=640px) ───── */
  @media (max-width: 640px) {
    .solar-erp-page .ax-card__header {
      flex-direction: column;
      align-items: stretch;
      gap: 10px;
    }
    .solar-erp-page .ax-card__titles {
      flex: 1 1 auto;
      min-width: 0;
    }
    .solar-erp-page .ax-card__actions {
      margin-left: 0;
      width: 100%;
      flex-wrap: wrap;
      justify-content: stretch;
      gap: 8px;
    }
    .solar-erp-page .ax-card__actions .ax-cluster {
      width: 100%;
      flex-wrap: wrap !important;
      justify-content: space-between;
    }
    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] {
      flex: 1 1 100%;
      max-width: 100%;
    }
    .solar-erp-page .ax-card__actions .ax-export-toolbar,
    .solar-erp-page .ax-card__actions [class*="export-toolbar"] {
      flex: 1 1 auto;
      justify-content: flex-end;
    }
    .solar-erp-page .asw-filter-item {
      width: 100%;
      flex-direction: column;
      align-items: flex-start;
    }
    .solar-erp-page .asw-filter-item select {
      width: 100%;
    }
  }
`;

/* ───────── SVG Icons matching Solar ERP design language ───────── */
const svg = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const I_PIN = svg(<><path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /><path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0" /></>);
const I_USER_CHECK = svg(<><path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" /><path d="M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" /><path d="M16 11l2 2l4 -4" /></>);
const I_USER_X = svg(<><path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" /><path d="M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" /><path d="M17 9l4 4m0 -4l-4 4" /></>);
const I_TRUCK = svg(<><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></>);
const I_PACKAGE = svg(<><line x1="16.5" y1="9.4" x2="7.5" y2="4.21" /><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></>);
const I_BOLT = svg(<path d="M13 3l0 7l6 0l-8 11l0 -7l-6 0l8 -11" />);
const I_CLOCK = svg(<><path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M12 7v5l3 3" /></>);
const I_DONE = svg(<><path d="M7 12l5 5l10 -10" /><path d="M2 12l5 5m5 -5l5 -5" /></>);
const I_X = svg(<><path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M10 10l4 4m0 -4l-4 4" /></>);
const I_SHIELD = svg(<><path d="M12 3a12 12 0 0 0 8.5 3a12 12 0 0 1 -8.5 15a12 12 0 0 1 -8.5 -15a12 12 0 0 0 8.5 -3" /><path d="M9 12l2 2l4 -4" /></>);
const I_DOC = svg(<><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" /><path d="M9 9l1 0" /><path d="M9 13l6 0" /><path d="M9 17l6 0" /></>);
const I_CREDIT = svg(<><rect x="3" y="5" width="18" height="14" rx="3" /><line x1="3" y1="10" x2="21" y2="10" /><line x1="7" y1="15" x2="7.01" y2="15" /><line x1="11" y1="15" x2="13" y2="15" /></>);
const I_AWARD = svg(<><circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" /></>);
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
  colSpan?: 'ax-col--2' | 'ax-col--3' | 'ax-col--4';
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

function KpiCard({ icon, tone, label, value, unit, sub, badge, spark, sparkType = 'line', onClick, colSpan = 'ax-col--2' }: KpiProps) {
  const t = TONE[tone];
  const hasSpark = Array.isArray(spark) && spark.length > 1;

  return (
    <div
      className={`ax-card ${colSpan} ${onClick ? 'asw-interactive-kpi' : ''}`}
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
            <div style={{ width: 56, height: 24, overflow: 'hidden', flexShrink: 0 }}>
              <Suspense fallback={<div style={{ width: 56, height: 24 }} />}>
                <ApexChart
                  key={`${label}-${spark!.join(',')}-${sparkType}`}
                  type={sparkType}
                  sparkline
                  tooltip={false}
                  height={24}
                  color={t.apex}
                  series={[{ name: label, data: spark! }]}
                  style={{ minHeight: 24, width: 56 }}
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

export function SrtDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  // Filter states
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [tableQuery, setTableQuery] = useState<string>('');
  const [vendorTableQuery, setVendorTableQuery] = useState<string>('');

  // Chart heights
  const chartH = useChartHeight(320, 260);
  const donutH = useChartHeight(230, 210);

  // 1. Load Live Dashboard Data (Strictly live API - zero fake fallback)
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const res = await jammuSrt70mwAdminService.getDashboard();
      setData(res || null);
      setUpdatedAt(new Date());
    } catch (err: any) {
      console.error('Jammu SRT Dashboard fetch error:', err);
      setApiError(err?.message || 'Failed to fetch dynamic dashboard data');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // ── Status Drill-down Navigation to StatusView ──
  const openDrillDown = (statusKey: string, _label?: string, district?: string, vendor?: string | number) => {
    const targetDistrict = district && district !== 'All' ? district : (selectedDistrict !== 'All' ? selectedDistrict : undefined);
    const params = new URLSearchParams();
    params.set('status', statusKey);
    if (targetDistrict) {
      params.set('district', targetDistrict);
      params.set('mode', 'district');
      params.set('value', targetDistrict);
    }
    if (vendor !== undefined && vendor !== null && vendor !== '') {
      params.set('vendor', String(vendor));
      params.set('mode', 'vendor');
      params.set('value', String(vendor));
    }
    navigate(`/vendor-management/jammu/installation/srt-70mw/status-view?${params.toString()}`);
  };

  // Vendor Lookup map
  const vendorMap = useMemo(() => {
    const map = new Map<string, string>();
    (data?.vendors || []).forEach((v) => {
      const id = v.inst_vendor !== undefined && v.inst_vendor !== null ? String(v.inst_vendor) : String(v.vendor ?? '');
      if (id && v.name) {
        map.set(id, v.name);
      }
    });
    return map;
  }, [data?.vendors]);

  // Vendor Today Installation map
  const todayInstallMap = useMemo(() => {
    const map = new Map<string, number>();
    (data?.vendor_today_installation || []).forEach((t) => {
      map.set(String(t.inst_vendor), Number(t.today_install || 0));
    });
    return map;
  }, [data?.vendor_today_installation]);

  // Total Today Installations
  const totalTodayInstall = useMemo(() => {
    return (data?.vendor_today_installation || []).reduce((acc, t) => acc + Number(t.today_install || 0), 0);
  }, [data?.vendor_today_installation]);

  // Normalized Districtwise data
  const districtwise: (DashboardDistrictWiseItem & { site_not_assigned: number })[] = useMemo(() => {
    return (data?.districtwise || []).map((d) => {
      const siteCount = Number(d.site_count || 0);
      const totalAssigned = Number(d.total_assigned || 0);
      return {
        district: d.district || 'Unknown',
        site_count: siteCount,
        total_assigned: totalAssigned,
        site_not_assigned: Math.max(0, siteCount - totalAssigned),
        material_dispatch: Number(d.material_dispatch || 0),
        material_pending: Number(d.material_pending || 0),
        inst_complete: Number(d.inst_complete || 0),
        inst_pending: Number(d.inst_pending || 0),
        verify_approved: Number(d.verify_approved || 0),
        verify_pending: Number(d.verify_pending || 0),
        verify_reject: Number(d.verify_reject || 0),
        inst_pay80_complete: Number(d.inst_pay80_complete || 0),
        inst_pay20_complete: Number(d.inst_pay20_complete || 0),
        inst_pay80_pending: Number(d.inst_pay80_pending || 0),
        inst_pay20_pending: Number(d.inst_pay20_pending || 0),
      };
    });
  }, [data]);

  // Normalized Vendorswise data
  const vendorswise: (DashboardVendorWiseItem & { name: string; today_install: number })[] = useMemo(() => {
    return (data?.vendorswise || []).map((v) => {
      const vId = String(v.inst_vendor ?? '');
      return {
        ...v,
        name: vendorMap.get(vId) || (v as any).name || (vId === 'NA' ? 'Unknown' : `Vendor #${vId}`),
        today_install: todayInstallMap.get(vId) ?? Number((v as any).today_install || 0),
        site_count: Number(v.site_count || 0),
        material_dispatch: Number(v.material_dispatch || 0),
        material_pending: Number(v.material_pending || 0),
        inst_complete: Number(v.inst_complete || 0),
        inst_pending: Number(v.inst_pending || 0),
        verify_approved: Number(v.verify_approved || 0),
        verify_pending: Number(v.verify_pending || 0),
        verify_reject: Number(v.verify_reject || 0),
        inst_pay80_complete: Number(v.inst_pay80_complete || 0),
        inst_pay20_complete: Number(v.inst_pay20_complete || 0),
        inst_pay80_pending: Number(v.inst_pay80_pending || 0),
        inst_pay20_pending: Number(v.inst_pay20_pending || 0),
      };
    });
  }, [data, vendorMap, todayInstallMap]);

  // Monthly installation timeline sorted chronologically
  const monthlyInstallations: DashboardMonthlyInstallation[] = useMemo(() => {
    const list = (data?.vendor_installation_month || []).map((m) => ({
      month_year: m.month_year || '',
      monthly_installations: Number(m.monthly_installations || 0),
    }));
    // Sort oldest to newest for chronological left-to-right area chart
    return list.sort((a, b) => a.month_year.localeCompare(b.month_year));
  }, [data]);

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
      if (selectedStatus === 'Complete') matchStatus = (d.inst_complete || 0) > 0;
      else if (selectedStatus === 'Pending') matchStatus = (d.inst_pending || 0) > 0;
      else if (selectedStatus === 'VerifyApproved') matchStatus = (d.verify_approved || 0) > 0;
      else if (selectedStatus === 'VerifyPending') matchStatus = (d.verify_pending || 0) > 0;
      else if (selectedStatus === 'VerifyReject') matchStatus = (d.verify_reject || 0) > 0;
      else if (selectedStatus === 'MaterialDispatch') matchStatus = (d.material_dispatch || 0) > 0;
      else if (selectedStatus === 'MaterialPending') matchStatus = (d.material_pending || 0) > 0;
      else if (selectedStatus === 'Pay80Complete') matchStatus = (d.inst_pay80_complete || 0) > 0;
      else if (selectedStatus === 'Pay20Complete') matchStatus = (d.inst_pay20_complete || 0) > 0;
      return matchDistrict && matchStatus;
    });
  }, [districtwise, selectedDistrict, selectedStatus]);

  // Raw overview directly from API
  const rawSrt = useMemo(() => {
    const s = data?.jammu_srt70mws;
    return {
      site_count: Number(s?.site_count || 0),
      material_dispatch: Number(s?.material_dispatch || 0),
      material_pending: Number(s?.material_pending || 0),
      site_assigned: Number(s?.site_assigned || 0),
      site_not_assigned: Number(s?.site_not_assigned || 0),
      complete: Number(s?.complete || 0),
      pending: Number(s?.pending || 0),
      verify_pending: Number(s?.verify_pending || 0),
      verify_approved: Number(s?.verify_approved || 0),
      verify_reject: Number(s?.verify_reject || 0),
      claim_applicable: Number(s?.claim_applicable || 0),
      claim_raised: Number(s?.claim_raised || 0),
      inst_doc_complete: Number(s?.inst_doc_complete || 0),
      inst_doc_pending: Number(s?.inst_doc_pending || 0),
      inst_pay80_complete: Number(s?.inst_pay80_complete || 0),
      inst_pay20_complete: Number(s?.inst_pay20_complete || 0),
      inst_pay80_pending: Number(s?.inst_pay80_pending || 0),
      inst_pay20_pending: Number(s?.inst_pay20_pending || 0),
      inst_pay80_amount: Number(s?.inst_pay80_amount || 0),
      inst_pay20_amount: Number(s?.inst_pay20_amount || 0),
    };
  }, [data]);

  // Dynamic srt metrics: aggregates from filteredDistricts when any filter is selected
  const srt = useMemo(() => {
    if (selectedDistrict === 'All' && selectedStatus === 'All') {
      return rawSrt;
    }
    if (filteredDistricts.length === 0) {
      return {
        site_count: 0,
        material_dispatch: 0,
        material_pending: 0,
        site_assigned: 0,
        site_not_assigned: 0,
        complete: 0,
        pending: 0,
        verify_pending: 0,
        verify_approved: 0,
        verify_reject: 0,
        claim_applicable: 0,
        claim_raised: 0,
        inst_doc_complete: 0,
        inst_doc_pending: 0,
        inst_pay80_complete: 0,
        inst_pay20_complete: 0,
        inst_pay80_pending: 0,
        inst_pay20_pending: 0,
        inst_pay80_amount: 0,
        inst_pay20_amount: 0,
      };
    }
    return filteredDistricts.reduce(
      (acc, d) => ({
        site_count: acc.site_count + (Number(d.site_count) || 0),
        material_dispatch: acc.material_dispatch + (Number(d.material_dispatch) || 0),
        material_pending: acc.material_pending + (Number(d.material_pending) || 0),
        site_assigned: acc.site_assigned + (Number(d.total_assigned) || 0),
        site_not_assigned: acc.site_not_assigned + (Number(d.site_not_assigned) || 0),
        complete: acc.complete + (Number(d.inst_complete) || 0),
        pending: acc.pending + (Number(d.inst_pending) || 0),
        verify_pending: acc.verify_pending + (Number(d.verify_pending) || 0),
        verify_approved: acc.verify_approved + (Number(d.verify_approved) || 0),
        verify_reject: acc.verify_reject + (Number(d.verify_reject) || 0),
        claim_applicable: acc.claim_applicable,
        claim_raised: acc.claim_raised,
        inst_doc_complete: acc.inst_doc_complete,
        inst_doc_pending: acc.inst_doc_pending,
        inst_pay80_complete: acc.inst_pay80_complete + (Number(d.inst_pay80_complete) || 0),
        inst_pay20_complete: acc.inst_pay20_complete + (Number(d.inst_pay20_complete) || 0),
        inst_pay80_pending: acc.inst_pay80_pending + (Number(d.inst_pay80_pending) || 0),
        inst_pay20_pending: acc.inst_pay20_pending + (Number(d.inst_pay20_pending) || 0),
        inst_pay80_amount: acc.inst_pay80_amount,
        inst_pay20_amount: acc.inst_pay20_amount,
      }),
      {
        site_count: 0,
        material_dispatch: 0,
        material_pending: 0,
        site_assigned: 0,
        site_not_assigned: 0,
        complete: 0,
        pending: 0,
        verify_pending: 0,
        verify_approved: 0,
        verify_reject: 0,
        claim_applicable: rawSrt.claim_applicable,
        claim_raised: rawSrt.claim_raised,
        inst_doc_complete: rawSrt.inst_doc_complete,
        inst_doc_pending: rawSrt.inst_doc_pending,
        inst_pay80_complete: 0,
        inst_pay20_complete: 0,
        inst_pay80_pending: 0,
        inst_pay20_pending: 0,
        inst_pay80_amount: 0,
        inst_pay20_amount: 0,
      }
    );
  }, [rawSrt, filteredDistricts, selectedDistrict, selectedStatus]);

  const filtersActive = selectedDistrict !== 'All' || selectedStatus !== 'All';

  // Table search & pagination matching Solar ERP standards (Initial 25 so all 19 districts visible immediately)
  const deferredQuery = useDeferredValue(tableQuery);
  const tableDistricts = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return filteredDistricts.filter(
      (d) => !q || d.district.toLowerCase().includes(q)
    );
  }, [filteredDistricts, deferredQuery]);

  const {
    paginatedData: pagedDistricts,
    currentPage,
    pageSize,
    totalItems,
    setPage,
    setPageSize,
  } = usePagination({ data: tableDistricts, initialPageSize: 25 });

  useEffect(() => {
    setPage(1);
  }, [tableQuery, selectedDistrict, selectedStatus, setPage]);

  // Vendor Table search & pagination (Initial 15 so all vendors visible immediately)
  const deferredVendorQuery = useDeferredValue(vendorTableQuery);
  const tableVendors = useMemo(() => {
    const q = deferredVendorQuery.trim().toLowerCase();
    return vendorswise.filter((v) => !q || v.name.toLowerCase().includes(q));
  }, [vendorswise, deferredVendorQuery]);

  const {
    paginatedData: pagedVendors,
    currentPage: vendorCurrentPage,
    pageSize: vendorPageSize,
    totalItems: vendorTotalItems,
    setPage: setVendorPage,
    setPageSize: setVendorPageSize,
  } = usePagination({ data: tableVendors, initialPageSize: 15 });

  useEffect(() => {
    setVendorPage(1);
  }, [vendorTableQuery, setVendorPage]);

  // Percentages & Rates
  const pctComplete = pctOf(srt.complete, srt.site_count);
  const pctPending = pctOf(srt.pending, srt.site_count);
  const pctAssigned = pctOf(srt.site_assigned, srt.site_count);
  const pctMaterialDispatch = pctOf(srt.material_dispatch, srt.site_count);
  const pctVerified = pctOf(srt.verify_approved, srt.complete || 1);
  const pctPay80 = pctOf(srt.inst_pay80_complete, srt.complete || 1);
  const pctPay20 = pctOf(srt.inst_pay20_complete, srt.complete || 1);

  // Milestones list matching Jammu SRT 70MW Lifecycle
  const milestones = [
    { label: '1. Allocated Rooftop Sites', v: srt.site_count, of: srt.site_count || 1, color: LIGHT_BLUE },
    { label: '2. Assigned Sites', v: srt.site_assigned, of: srt.site_count || 1, color: LIGHT_CYAN },
    { label: '3. Material Dispatched to Sites', v: srt.material_dispatch, of: srt.site_count || 1, color: LIGHT_AMBER },
    { label: '4. Equipment Installed & Live', v: srt.complete, of: srt.site_count || 1, color: LIGHT_GREEN },
    { label: '5. Field Verification Approved', v: srt.verify_approved, of: srt.complete || srt.site_count || 1, color: LIGHT_VIOLET },
    { label: '6. Installation Claims Raised', v: srt.claim_raised, of: srt.complete || srt.site_count || 1, color: LIGHT_PINK },
    { label: '7. Payment 80% Disbursed', v: srt.inst_pay80_complete, of: srt.complete || srt.site_count || 1, color: LIGHT_GREEN },
    { label: '8. Payment 20% Disbursed', v: srt.inst_pay20_complete, of: srt.complete || srt.site_count || 1, color: LIGHT_BLUE },
  ];

  // Top districts for bar chart matching filters
  const chartDistricts = useMemo(
    () => [...filteredDistricts].sort((a, b) => (b.inst_complete || 0) - (a.inst_complete || 0)).slice(0, 15),
    [filteredDistricts]
  );

  // Sparklines datasets derived from real filtered data
  const siteSpark = filteredDistricts.length > 1 ? filteredDistricts.slice(0, 10).map((d) => d.site_count || 0) : undefined;
  const completeSpark = filteredDistricts.length > 1 ? filteredDistricts.slice(0, 10).map((d) => d.inst_complete || 0) : undefined;
  const pendingSpark = filteredDistricts.length > 1 ? filteredDistricts.slice(0, 10).map((d) => d.inst_pending || 0) : undefined;
  const verifySpark = filteredDistricts.length > 1 ? filteredDistricts.slice(0, 10).map((d) => d.verify_approved || 0) : undefined;

  // Export Columns definition for District Table
  const districtCols: ExportColumn<DashboardDistrictWiseItem & { site_not_assigned: number }>[] = useMemo(() => [
    { header: 'District', accessor: 'district' },
    { header: 'Allocated Sites', accessor: 'site_count' },
    { header: 'Assigned Sites', accessor: 'total_assigned' },
    { header: 'Material Dispatched', accessor: 'material_dispatch' },
    { header: 'Material Pending', accessor: 'material_pending' },
    { header: 'Installed Sites', accessor: 'inst_complete' },
    { header: 'Pending Sites', accessor: 'inst_pending' },
    { header: 'Verify Approved', accessor: 'verify_approved' },
    { header: 'Verify Pending', accessor: 'verify_pending' },
    { header: 'Payment 80% Done', accessor: 'inst_pay80_complete' },
    { header: 'Payment 80% Pending', accessor: 'inst_pay80_pending' },
    { header: 'Payment 20% Done', accessor: 'inst_pay20_complete' },
    { header: 'Payment 20% Pending', accessor: 'inst_pay20_pending' },
  ], []);

  // Export Columns definition for Vendor Table
  const vendorCols: ExportColumn<DashboardVendorWiseItem & { name: string; today_install: number }>[] = useMemo(() => [
    { header: 'Vendor Name', accessor: 'name' },
    { header: 'Today Installed', accessor: 'today_install' },
    { header: 'Allocated Sites', accessor: 'site_count' },
    { header: 'Material Dispatched', accessor: 'material_dispatch' },
    { header: 'Material Pending', accessor: 'material_pending' },
    { header: 'Installed Sites', accessor: 'inst_complete' },
    { header: 'Pending Sites', accessor: 'inst_pending' },
    { header: 'Verify Approved', accessor: 'verify_approved' },
    { header: 'Verify Pending', accessor: 'verify_pending' },
    { header: 'Payment 80% Done', accessor: 'inst_pay80_complete' },
    { header: 'Payment 80% Pending', accessor: 'inst_pay80_pending' },
    { header: 'Payment 20% Done', accessor: 'inst_pay20_complete' },
    { header: 'Payment 20% Pending', accessor: 'inst_pay20_pending' },
  ], []);

  const stamp = new Date().toISOString().slice(0, 10);
  const distFileBase = 'Jammu_SRT_70MW_District_Overview';
  const distFileTitle = 'Jammu SRT 70MW District-Wise Installation Performance';
  const vendorFileBase = 'Jammu_SRT_70MW_Vendor_Overview';
  const vendorFileTitle = 'Jammu SRT 70MW Vendor-Wise Performance Breakdown';

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
    const csv = out.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
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
        title="Jammu SRT 70MW Dashboard"
        subtitle={
          <span style={{ display: 'inline-block', fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>
            Solar Rooftop (SRT 70MW) Operations, District Analysis & Execution Throughput
            {updatedAt ? ` · Last updated ${updatedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}` : ''}
          </span>
        }
        breadcrumbs={[
          { label: 'ERP Dashboard', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Jammu' },
          { label: 'Installation' },
          { label: 'SRT 70MW' },
          { label: 'Dashboard' },
        ]}
        actions={
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill" style={{ fontWeight: 600, paddingInline: 'var(--ax-space-3)' }}>
              <span className="ax-badge__dot" /> State: Jammu
            </span>
            <Link to="/vendor-management/jammu/installation/srt-70mw/status-view?status=complete" className="ax-btn ax-btn--primary ax-btn--sm">
              Status Register
            </Link>
            <Link to="/vendor-management/jammu/installation/srt-70mw/view-assign" className="ax-btn ax-btn--primary ax-btn--sm">
              Assigned Requests
            </Link>
            <Link to="/vendor-management/jammu/installation/srt-70mw/verify-installation" className="ax-btn ax-btn--primary ax-btn--sm">
              View Installations
            </Link>
            <Link to="/vendor-management/jammu/installation/srt-70mw/view-claim" className="ax-btn ax-btn--primary ax-btn--sm">
              View Claims
            </Link>
            <Link to="/vendor-management/jammu/installation/srt-70mw/view-payment" className="ax-btn ax-btn--primary ax-btn--sm">
              View Payments
            </Link>
            <Link to="/vendor-management/jammu/installation/srt-70mw/assign-sites" className="ax-btn ax-btn--primary ax-btn--sm">
              <span className="ax-btn__label">+ Assign SRT Site</span>
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
          aria-label="Jammu SRT 70MW Dashboard Filters"
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
                <label htmlFor="jammu-district-select" style={labelStyle}>District:</label>
                <select
                  id="jammu-district-select"
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
                <label htmlFor="jammu-status-select" style={labelStyle}>Status:</label>
                <select
                  id="jammu-status-select"
                  className="ax-input ax-input--sm"
                  style={{ height: 30, fontSize: 'var(--ax-text-xs)', paddingInline: '8px' }}
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="All">All Operations</option>
                  <option value="Complete">Installed Sites</option>
                  <option value="Pending">Pending Installation</option>
                  <option value="VerifyApproved">Verify Approved</option>
                  <option value="VerifyPending">Verification Pending</option>
                  <option value="VerifyReject">Verification Rejected</option>
                  <option value="MaterialDispatch">Material Dispatched</option>
                  <option value="MaterialPending">Material Pending</option>
                  <option value="Pay80Complete">Payment 80% Settled</option>
                  <option value="Pay20Complete">Payment 20% Settled</option>
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
                Showing <b style={{ color: 'var(--ax-text-strong)' }}>{num(srt.site_count)}</b> Total Sites across <b style={{ color: 'var(--ax-text-strong)' }}>{filteredDistricts.length}</b> {filteredDistricts.length === 1 ? 'District' : 'Districts'}
              </span>
            </div>
          </div>

          {/* Quick Filter Status Tabs */}
          <div className="ax-cluster ax-quick-filter-strip" style={{ gap: 6, flexWrap: 'wrap', width: '100%', marginTop: 8, paddingTop: 8, borderTop: '1px dashed var(--ax-border, #e2e8f0)' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ax-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Quick Filter:</span>
            {[
              { key: 'All', label: 'All Operations' },
              { key: 'Complete', label: 'Installed' },
              { key: 'Pending', label: 'Pending' },
              { key: 'VerifyApproved', label: 'Verify Approved' },
              { key: 'VerifyPending', label: 'In Audit' },
              { key: 'MaterialDispatch', label: 'Material Dispatched' },
              { key: 'Pay80Complete', label: 'Payment 80%' },
              { key: 'Pay20Complete', label: 'Payment 20%' },
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
        <section className="ax-card ax-welcome ax-col--12" role="region" aria-label="Jammu SRT 70MW Operations Overview">
          <div className="ax-welcome__body">
            <div className="ax-welcome__text">
              <p className="ax-welcome__eyebrow">Jammu Solar Rooftop System</p>
              <h2 className="ax-card__title">Welcome to Jammu SRT 70MW Operations Dashboard</h2>
              <p className="ax-welcome__lede">
                {selectedDistrict !== 'All' ? (
                  <>
                    Jammu SRT 70MW execution overview for <b>{selectedDistrict}</b>: <b>{num(srt.site_count)} rooftop sites</b> allocated.
                    <b> {num(srt.complete)} ({pctComplete}%)</b> installed, with <b>{num(srt.verify_approved)}</b> verified approved, <b>{num(srt.claim_raised)}</b> claims raised, and <b>{num(srt.inst_pay80_complete)}</b> 80% payments settled.
                  </>
                ) : (
                  <>
                    Jammu SRT 70MW execution overview: <b>{num(srt.site_count)} rooftop sites</b> allocated across <b>{districtOptions.length} districts</b> in Jammu.
                    <b> {num(srt.complete)} ({pctComplete}%)</b> installed, with <b>{num(srt.verify_approved)}</b> verified approved, <b>{num(srt.claim_raised)}</b> claims raised, and <b>{num(srt.inst_pay80_complete)}</b> 80% payments settled.
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
                  {selectedDistrict !== 'All' ? 'Active Filter Scope' : 'Jammu Operational Scope'}
                </small>
              </div>
              <div className="ax-welcome__stat">
                <dt>Allocated Sites</dt>
                <dd className="ax-num">{num(srt.site_count)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--asw-primary)' }}>Total RTS Capacity</small>
              </div>
              <div className="ax-welcome__stat">
                <dt>Installed Sites</dt>
                <dd className="ax-num">{num(srt.complete)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-emerald, #10b981)' }}>{pctComplete}% Complete</small>
              </div>
              <div className="ax-welcome__stat">
                <dt>Verify Approved</dt>
                <dd className="ax-num">{num(srt.verify_approved)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-amber, #f59e0b)' }}>{num(srt.verify_pending)} In Audit</small>
              </div>
            </dl>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            4. COMPREHENSIVE KPI SECTION 1: SITE ALLOCATION & LOGISTICS
            ═══════════════════════════════════════════════════════════ */}
 

        <KpiCard
          icon={I_PIN}
          tone="accent"
          label="Total Allocated Sites"
          value={num(srt.site_count)}
          unit="Sites"
          sub="Total allocated rooftop sites"
          spark={siteSpark}
          onClick={() => openDrillDown('total', 'Total Allocated Sites')}
        />

        <KpiCard
          icon={I_USER_CHECK}
          tone="emerald"
          label="Assigned Sites"
          value={num(srt.site_assigned)}
          unit="Sites"
          sub="Assigned to field vendors"
          badge={`${pctAssigned}%`}
          onClick={() => openDrillDown('site-assigned', 'Assigned Sites')}
        />

        <KpiCard
          icon={I_USER_X}
          tone="amber"
          label="Unassigned Sites"
          value={num(srt.site_not_assigned)}
          unit="Sites"
          sub="Pending vendor allocation"
          badge={`${pctOf(srt.site_not_assigned, srt.site_count)}%`}
          onClick={() => openDrillDown('site-not-assigned', 'Unassigned Sites')}
        />

        <KpiCard
          icon={I_TRUCK}
          tone="cyan"
          label="Material Dispatched"
          value={num(srt.material_dispatch)}
          unit="Sites"
          sub="Solar equipment dispatched"
          badge={`${pctMaterialDispatch}%`}
          onClick={() => openDrillDown('material-dispatch', 'Material Dispatched Sites')}
        />

        <KpiCard
          icon={I_PACKAGE}
          tone="amber"
          label="Material Pending"
          value={num(srt.material_pending)}
          unit="Sites"
          sub="Dispatch awaiting release"
          badge={`${pctOf(srt.material_pending, srt.site_count)}%`}
          onClick={() => openDrillDown('material-pending', 'Material Pending Sites')}
        />

        <KpiCard
          icon={I_BOLT}
          tone="pink"
          label="Today's Installed"
          value={num(totalTodayInstall)}
          unit="Sites"
          sub="Installations logged today"
          onClick={() => openDrillDown('complete', "Today's Installations")}
        />

        {/* ═══════════════════════════════════════════════════════════
            5. COMPREHENSIVE KPI SECTION 2: INSTALLATION & AUDIT
            ═══════════════════════════════════════════════════════════ */}

        <KpiCard
          icon={I_DONE}
          tone="emerald"
          label="Installed Sites"
          value={num(srt.complete)}
          unit="Sites"
          sub="Solar equipment mounted"
          badge={`${pctComplete}%`}
          spark={completeSpark}
          onClick={() => openDrillDown('complete', 'Completed Installations')}
        />

        <KpiCard
          icon={I_CLOCK}
          tone="amber"
          label="Pending Installation"
          value={num(srt.pending)}
          unit="Sites"
          sub="Awaiting field execution"
          badge={`${pctPending}%`}
          spark={pendingSpark}
          onClick={() => openDrillDown('pending', 'Pending Installations')}
        />

        <KpiCard
          icon={I_SHIELD}
          tone="cyan"
          label="Verify Approved"
          value={num(srt.verify_approved)}
          unit="Sites"
          sub={`${num(srt.verify_pending)} audit in progress`}
          badge={`${pctVerified}%`}
          spark={verifySpark}
          onClick={() => openDrillDown('verify-approved', 'Verified Approved Sites')}
        />

        <KpiCard
          icon={I_CLOCK}
          tone="amber"
          label="Verification Pending"
          value={num(srt.verify_pending)}
          unit="Sites"
          sub="Field audit pending review"
          onClick={() => openDrillDown('verify-pending', 'Verification Pending Sites')}
        />

        <KpiCard
          icon={I_X}
          tone="red"
          label="Verification Rejected"
          value={num(srt.verify_reject)}
          unit="Sites"
          sub="Requires vendor rework"
          onClick={() => openDrillDown('verify-reject', 'Verification Rejected Sites')}
        />

        <KpiCard
          icon={I_DOC}
          tone="violet"
          label="Documents Complete"
          value={num(srt.inst_doc_complete)}
          unit="Sites"
          sub={`${num(srt.inst_doc_pending)} doc pending`}
          onClick={() => openDrillDown('inst-doc-complete', 'Documents Complete')}
        />

        {/* ═══════════════════════════════════════════════════════════
            6. COMPREHENSIVE KPI SECTION 3: CLAIMS & 80/20 PAYMENTS
            ═══════════════════════════════════════════════════════════ */}
  

        <KpiCard
          icon={I_AWARD}
          tone="accent"
          label="Claims Applicable"
          value={num(srt.claim_applicable)}
          unit="Sites"
          sub="Eligible for claim raising"
          onClick={() => openDrillDown('claim-applicable', 'Claims Applicable')}
        />

        <KpiCard
          icon={I_DOC}
          tone="pink"
          label="Claims Raised"
          value={num(srt.claim_raised)}
          unit="Sites"
          sub="Invoices submitted by vendors"
          onClick={() => openDrillDown('claim-raised', 'Claims Raised')}
        />

        <KpiCard
          icon={I_CREDIT}
          tone="emerald"
          label="Payment 80% Settled"
          value={num(srt.inst_pay80_complete)}
          unit="Sites"
          sub={`${num(srt.inst_pay80_pending)} 80% pending`}
          badge={`${pctPay80}%`}
          onClick={() => openDrillDown('inst-pay80-complete', 'Payment 80% Settled Sites')}
        />

        <KpiCard
          icon={I_CLOCK}
          tone="amber"
          label="Payment 80% Pending"
          value={num(srt.inst_pay80_pending)}
          unit="Sites"
          sub="80% tranche in clearance"
          onClick={() => openDrillDown('inst-pay80-pending', 'Payment 80% Pending Sites')}
        />

        <KpiCard
          icon={I_CREDIT}
          tone="violet"
          label="Payment 20% Settled"
          value={num(srt.inst_pay20_complete)}
          unit="Sites"
          sub={`${num(srt.inst_pay20_pending)} 20% pending`}
          badge={`${pctPay20}%`}
          onClick={() => openDrillDown('inst-pay20-complete', 'Payment 20% Settled Sites')}
        />

        <KpiCard
          icon={I_CLOCK}
          tone="amber"
          label="Payment 20% Pending"
          value={num(srt.inst_pay20_pending)}
          unit="Sites"
          sub="20% tranche in clearance"
          onClick={() => openDrillDown('inst-pay20-pending', 'Payment 20% Pending Sites')}
        />

        {/* 7. State Operations Executive Card */}
        <section className="ax-card ax-col--12" role="region" aria-label="Jammu SRT 70MW Operations Overview">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow" style={{ color: 'var(--asw-primary)' }}>State Operations</span>
              <h3 className="ax-card__title">Jammu · Solar Rooftop (SRT 70MW) Operations</h3>
              <p className="ax-card__subtitle">{num(srt.complete)} rooftop installations across {districtOptions.length} districts in Jammu</p>
            </div>
            <Link to="/vendor-management/jammu/installation/srt-70mw/verify-installation" className="ax-btn ax-btn--sm ax-btn--primary">
              View Installation Register →
            </Link>
          </div>
          <div className="ax-card__body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-3)' }}>
            <div className="ax-grid ax-grid--2" style={{ gap: 'var(--ax-space-2)' }}>
              <div style={{ padding: '10px 12px', background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 'var(--ax-radius-md, 8px)' }}>
                <small style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-xs)' }}>Installed & Operational</small>
                <div style={{ fontSize: 'var(--ax-text-lg)', fontWeight: 700, color: 'var(--ax-viz-emerald, #10b981)' }}>
                  {num(srt.complete)} <span style={{ fontSize: 'var(--ax-text-xs)', fontWeight: 500 }}>({pctComplete}%)</span>
                </div>
              </div>
              <div style={{ padding: '10px 12px', background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 'var(--ax-radius-md, 8px)' }}>
                <small style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-xs)' }}>Pending Execution</small>
                <div style={{ fontSize: 'var(--ax-text-lg)', fontWeight: 700, color: 'var(--ax-viz-amber, #f59e0b)' }}>
                  {num(srt.pending)} <span style={{ fontSize: 'var(--ax-text-xs)', fontWeight: 500 }}>({pctPending}%)</span>
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
              <b>Verification & Compliance:</b> {num(srt.verify_approved)} sites approved by auditor ({pctVerified}%) · {num(srt.claim_raised)} claims raised · {num(srt.inst_pay80_complete)} 80% payments and {num(srt.inst_pay20_complete)} 20% payments settled.
            </div>
          </div>
        </section>

        {/* 8. Charts: District Wise Installations + Status Donut */}
        <section className="ax-card ax-card--chart ax-col--8" role="region" aria-label="District wise installations">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Geographic Breakdown</span>
              <h2 className="ax-card__title">District Wise Installations</h2>
              <p className="ax-card__subtitle">{num(srt.complete)} installed of {num(srt.site_count)} allocated across {districtOptions.length} districts</p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)' }}>
                {[
                  { l: 'Installed Sites', c: LIGHT_GREEN },
                  { l: 'Allocated Sites', c: LIGHT_BLUE },
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
                  key={`dist-chart-${chartH}-${chartDistricts.map((d) => `${d.district}-${d.inst_complete}-${d.site_count}`).join('-')}`}
                  type="bar"
                  height={chartH}
                  legend="none"
                  ariaLabel="District-wise installation comparison"
                  series={[
                    { name: 'Installed Sites', data: chartDistricts.map((d) => d.inst_complete || 0) },
                    { name: 'Allocated Sites', data: chartDistricts.map((d) => d.site_count || 0) },
                  ]}
                  apex={{
                    colors: [LIGHT_GREEN, LIGHT_BLUE],
                    plotOptions: { bar: { horizontal: false, borderRadius: 4, columnWidth: '35%' } },
                    xaxis: { categories: chartDistricts.map((d) => d.district), labels: { style: { fontSize: '11px' }, rotate: -35 } },
                    yaxis: { title: { text: 'Rooftop Sites (Nos.)', style: { color: 'var(--ax-text-muted)' } } },
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
              <p className="ax-card__subtitle">Total {num(srt.site_count)} Rooftop Sites</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <Suspense fallback={<div className="ax-skeleton" style={{ height: donutH }} />}>
              <ApexChart
                key={`donut-${donutH}-${srt.complete}-${srt.pending}-${srt.verify_reject}`}
                type="donut"
                height={donutH}
                legend="none"
                ariaLabel="Installed, pending and rejected distribution"
                series={[srt.complete, srt.pending, srt.verify_reject]}
                apex={{
                  labels: ['Installed', 'Pending', 'Rework Required'],
                  colors: [LIGHT_GREEN, LIGHT_AMBER, LIGHT_RED],
                  stroke: { width: 0 },
                  chart: {
                    events: {
                      dataPointSelection: (_event: unknown, _chart: unknown, opts: any) => {
                        const labels = ['complete', 'pending', 'verify-reject'];
                        const key = labels[opts?.dataPointIndex];
                        if (key) openDrillDown(key, 'Sites Drilldown');
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
                          total: { show: true, label: 'Sites', formatter: () => num(srt.site_count) },
                        },
                      },
                    },
                  },
                }}
              />
            </Suspense>
            <ul className="ax-list ax-list--compact" style={{ marginTop: 'var(--ax-space-3)' }}>
              {[
                { label: 'Installed', sub: 'Completed sites', v: srt.complete, p: pctComplete, color: LIGHT_GREEN, key: 'complete' },
                { label: 'Pending', sub: 'Awaiting execution', v: srt.pending, p: pctPending, color: LIGHT_AMBER, key: 'pending' },
                { label: 'Rework Required', sub: 'Audit rejected', v: srt.verify_reject, p: pctOf(srt.verify_reject, srt.site_count), color: LIGHT_RED, key: 'verify-reject' },
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

        {/* 9. Monthly Installation Throughput + Milestones */}
        <section className="ax-card ax-card--chart ax-col--8" role="region" aria-label="Monthly installation throughput">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Monthly Execution</span>
              <h2 className="ax-card__title">Monthly Installation Trend</h2>
              <p className="ax-card__subtitle">Installation pace and throughput across chronological timeline</p>
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
                      name: 'Monthly Installed Sites',
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
                      labels: { style: { fontSize: '11px' } },
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

        {/* SRT Workflow Milestones */}
        <section className="ax-card ax-col--4" role="region" aria-label="Jammu SRT Workflow Milestones">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Workflow Lifecycle</span>
              <h2 className="ax-card__title">SRT 70MW Milestones</h2>
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

        {/* 10. District Wise Detailed Table (All 19 districts and all response fields) */}
        <section className="ax-card ax-col--12" role="region" aria-label="District wise summary table">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Geographic Breakdown</span>
              <h2 className="ax-card__title">District Wise SRT Summary ({filteredDistricts.length} Districts)</h2>
              <p className="ax-card__subtitle">Allocated, assigned, dispatched, installed, verification & payment metrics per district</p>
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
                  onExportCSV={() => exportToCSV(tableDistricts, districtCols, `${distFileBase}_${stamp}`)}
                  onExportExcel={() => exportToExcel(tableDistricts, districtCols, `${distFileBase}_${stamp}`)}
                  onExportPDF={() => exportToPDF(tableDistricts, districtCols, distFileTitle)}
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
                  <th className="ax-table__th ax-table__th--num" scope="col">Dispatched</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Mat. Pending</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Installed</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Pending</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Verify Approved</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Verify Pending</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Pay 80% Done</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Pay 80% Pending</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Pay 20% Done</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Pay 20% Pending</th>
                </tr>
              </thead>
              <tbody>
                {pagedDistricts.map((d) => (
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
                      title={`View all allocated sites in ${d.district}`}
                      onClick={(e) => { e.stopPropagation(); openDrillDown('total', 'Allocated Sites', d.district); }}
                    >
                      {num(d.site_count || 0)}
                    </td>
                    <td
                      className="ax-table__td ax-table__td--num ax-num"
                      style={{ color: 'var(--asw-primary)', fontWeight: 600, cursor: 'pointer' }}
                      title={`View assigned sites in ${d.district}`}
                      onClick={(e) => { e.stopPropagation(); openDrillDown('site-assigned', 'Assigned Sites', d.district); }}
                    >
                      {num(d.total_assigned || 0)}
                    </td>
                    <td
                      className="ax-table__td ax-table__td--num ax-num"
                      style={{ color: 'var(--ax-viz-cyan, #0891b2)', fontWeight: 600, cursor: 'pointer' }}
                      title={`View material dispatched sites in ${d.district}`}
                      onClick={(e) => { e.stopPropagation(); openDrillDown('material-dispatch', 'Dispatched Sites', d.district); }}
                    >
                      {num(d.material_dispatch || 0)}
                    </td>
                    <td
                      className="ax-table__td ax-table__td--num ax-num"
                      style={{ color: 'var(--ax-viz-amber, #f59e0b)', fontWeight: 600, cursor: 'pointer' }}
                      title={`View material pending sites in ${d.district}`}
                      onClick={(e) => { e.stopPropagation(); openDrillDown('material-pending', 'Material Pending Sites', d.district); }}
                    >
                      {num(d.material_pending || 0)}
                    </td>
                    <td
                      className="ax-table__td ax-table__td--num ax-num"
                      style={{ color: 'var(--ax-viz-emerald, #10b981)', fontWeight: 600, cursor: 'pointer' }}
                      title={`View completed sites in ${d.district}`}
                      onClick={(e) => { e.stopPropagation(); openDrillDown('complete', 'Installed Sites', d.district); }}
                    >
                      {num(d.inst_complete || 0)}
                    </td>
                    <td
                      className="ax-table__td ax-table__td--num ax-num"
                      style={{ color: 'var(--ax-viz-amber, #f59e0b)', fontWeight: 600, cursor: 'pointer' }}
                      title={`View pending sites in ${d.district}`}
                      onClick={(e) => { e.stopPropagation(); openDrillDown('pending', 'Pending Sites', d.district); }}
                    >
                      {num(d.inst_pending || 0)}
                    </td>
                    <td
                      className="ax-table__td ax-table__td--num ax-num"
                      style={{ color: 'var(--ax-viz-cyan, #0891b2)', fontWeight: 600, cursor: 'pointer' }}
                      title={`View verify approved sites in ${d.district}`}
                      onClick={(e) => { e.stopPropagation(); openDrillDown('verify-approved', 'Verify Approved Sites', d.district); }}
                    >
                      {num(d.verify_approved || 0)}
                    </td>
                    <td
                      className="ax-table__td ax-table__td--num ax-num"
                      style={{ color: 'var(--ax-viz-amber, #f59e0b)', fontWeight: 600, cursor: 'pointer' }}
                      title={`View verify pending sites in ${d.district}`}
                      onClick={(e) => { e.stopPropagation(); openDrillDown('verify-pending', 'Verify Pending Sites', d.district); }}
                    >
                      {num(d.verify_pending || 0)}
                    </td>
                    <td
                      className="ax-table__td ax-table__td--num ax-num"
                      style={{ color: 'var(--ax-viz-emerald, #10b981)', fontWeight: 600, cursor: 'pointer' }}
                      title={`View payment 80% settled sites in ${d.district}`}
                      onClick={(e) => { e.stopPropagation(); openDrillDown('inst-pay80-complete', 'Payment 80% Settled Sites', d.district); }}
                    >
                      {num(d.inst_pay80_complete || 0)}
                    </td>
                    <td
                      className="ax-table__td ax-table__td--num ax-num"
                      style={{ color: 'var(--ax-viz-amber, #f59e0b)', fontWeight: 600, cursor: 'pointer' }}
                      title={`View payment 80% pending sites in ${d.district}`}
                      onClick={(e) => { e.stopPropagation(); openDrillDown('inst-pay80-pending', 'Payment 80% Pending Sites', d.district); }}
                    >
                      {num(d.inst_pay80_pending || 0)}
                    </td>
                    <td
                      className="ax-table__td ax-table__td--num ax-num"
                      style={{ color: 'var(--ax-viz-violet, #7c3aed)', fontWeight: 600, cursor: 'pointer' }}
                      title={`View payment 20% settled sites in ${d.district}`}
                      onClick={(e) => { e.stopPropagation(); openDrillDown('inst-pay20-complete', 'Payment 20% Settled Sites', d.district); }}
                    >
                      {num(d.inst_pay20_complete || 0)}
                    </td>
                    <td
                      className="ax-table__td ax-table__td--num ax-num"
                      style={{ color: 'var(--ax-viz-amber, #f59e0b)', fontWeight: 600, cursor: 'pointer' }}
                      title={`View payment 20% pending sites in ${d.district}`}
                      onClick={(e) => { e.stopPropagation(); openDrillDown('inst-pay20-pending', 'Payment 20% Pending Sites', d.district); }}
                    >
                      {num(d.inst_pay20_pending || 0)}
                    </td>
                  </tr>
                ))}
                {!loading && pagedDistricts.length === 0 && (
                  <tr>
                    <td className="ax-table__td" colSpan={13} style={{ textAlign: 'center', color: 'var(--ax-text-muted)', padding: 24 }}>
                      No districts match the filter criteria.
                    </td>
                  </tr>
                )}
                {pagedDistricts.length > 0 && (
                  <tr className="ax-table__row" style={{ background: 'var(--ax-surface-subtle, #f8fafc)', fontWeight: 'var(--ax-weight-bold)' }}>
                    <td className="ax-table__td" style={{ color: 'var(--ax-text-strong)' }}>Total ({filteredDistricts.length} Districts)</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ cursor: 'pointer' }} onClick={() => openDrillDown('total', 'Total Allocated Sites')}>{num(srt.site_count)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--asw-primary)', cursor: 'pointer' }} onClick={() => openDrillDown('site-assigned', 'Total Assigned Sites')}>{num(srt.site_assigned)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-cyan, #0891b2)', cursor: 'pointer' }} onClick={() => openDrillDown('material-dispatch', 'Total Dispatched Sites')}>{num(srt.material_dispatch)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-amber, #f59e0b)', cursor: 'pointer' }} onClick={() => openDrillDown('material-pending', 'Total Material Pending Sites')}>{num(srt.material_pending)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-emerald, #10b981)', cursor: 'pointer' }} onClick={() => openDrillDown('complete', 'Total Installed Sites')}>{num(srt.complete)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-amber, #f59e0b)', cursor: 'pointer' }} onClick={() => openDrillDown('pending', 'Total Pending Sites')}>{num(srt.pending)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-cyan, #0891b2)', cursor: 'pointer' }} onClick={() => openDrillDown('verify-approved', 'Total Verify Approved Sites')}>{num(srt.verify_approved)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-amber, #f59e0b)', cursor: 'pointer' }} onClick={() => openDrillDown('verify-pending', 'Total Verify Pending Sites')}>{num(srt.verify_pending)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-emerald, #10b981)', cursor: 'pointer' }} onClick={() => openDrillDown('inst-pay80-complete', 'Total Payment 80% Settled')}>{num(srt.inst_pay80_complete)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-amber, #f59e0b)', cursor: 'pointer' }} onClick={() => openDrillDown('inst-pay80-pending', 'Total Payment 80% Pending')}>{num(srt.inst_pay80_pending)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-violet, #7c3aed)', cursor: 'pointer' }} onClick={() => openDrillDown('inst-pay20-complete', 'Total Payment 20% Settled')}>{num(srt.inst_pay20_complete)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-amber, #f59e0b)', cursor: 'pointer' }} onClick={() => openDrillDown('inst-pay20-pending', 'Total Payment 20% Pending')}>{num(srt.inst_pay20_pending)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="ax-card__footer" style={footerStyle}>
            <div className="ula-pagination-left">
              <Pagination
                currentPage={currentPage}
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                pageSizeOptions={[10, 25, 50, 100, 200]}
              />
            </div>
          </div>
        </section>

        {/* 11. Vendor-Wise Detailed Analytics Table (All 5 vendors, today's install, dispatched, payments) */}
        <section className="ax-card ax-col--12" role="region" aria-label="Vendor wise performance table">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Field Partner Analytics</span>
              <h2 className="ax-card__title">Vendor-Wise Installation & Payment Breakdown ({vendorswise.length} Partners)</h2>
              <p className="ax-card__subtitle">Field partner throughput, material dispatch, verification and payment clearance</p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                <SearchInput
                  value={vendorTableQuery}
                  onChange={setVendorTableQuery}
                  placeholder="Search vendor name…"
                  ariaLabel="Search vendors"
                />
                <TableExportToolbar
                  onCopy={() => copyToClipboard(tableVendors, vendorCols)}
                  onExportCSV={() => exportToCSV(tableVendors, vendorCols, `${vendorFileBase}_${stamp}`)}
                  onExportExcel={() => exportToExcel(tableVendors, vendorCols, `${vendorFileBase}_${stamp}`)}
                  onExportPDF={() => exportToPDF(tableVendors, vendorCols, vendorFileTitle)}
                />
              </div>
            </div>
          </div>

          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover">
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">Vendor Name</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Today Installed</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Allocated Sites</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Dispatched</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Mat. Pending</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Installed</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Pending</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Verify Approved</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Verify Pending</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Pay 80% Done</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Pay 80% Pending</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Pay 20% Done</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Pay 20% Pending</th>
                </tr>
              </thead>
              <tbody>
                {pagedVendors.map((v) => (
                  <tr
                    key={String(v.inst_vendor)}
                    className="ax-table__row"
                    role="button"
                    tabIndex={0}
                    onClick={() => openDrillDown('complete', 'Vendor Installations', undefined, v.inst_vendor)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDrillDown('complete', 'Vendor Installations', undefined, v.inst_vendor); } }}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="ax-table__td" style={{ fontWeight: 'var(--ax-weight-semibold)', color: 'var(--ax-text-strong)' }}>
                      <b>{v.name}</b>
                    </td>
                    <td
                      className="ax-table__td ax-table__td--num ax-num"
                      style={{ color: 'var(--ax-viz-pink, #db2777)', fontWeight: 600 }}
                    >
                      {num(v.today_install || 0)}
                    </td>
                    <td
                      className="ax-table__td ax-table__td--num ax-num"
                      style={{ fontWeight: 600, cursor: 'pointer' }}
                      title={`View all allocated sites for ${v.name}`}
                      onClick={(e) => { e.stopPropagation(); openDrillDown('total', 'Allocated Sites', undefined, v.inst_vendor); }}
                    >
                      {num(v.site_count || 0)}
                    </td>
                    <td
                      className="ax-table__td ax-table__td--num ax-num"
                      style={{ color: 'var(--ax-viz-cyan, #0891b2)', fontWeight: 600, cursor: 'pointer' }}
                      title={`View material dispatched sites for ${v.name}`}
                      onClick={(e) => { e.stopPropagation(); openDrillDown('material-dispatch', 'Dispatched Sites', undefined, v.inst_vendor); }}
                    >
                      {num(v.material_dispatch || 0)}
                    </td>
                    <td
                      className="ax-table__td ax-table__td--num ax-num"
                      style={{ color: 'var(--ax-viz-amber, #f59e0b)', fontWeight: 600, cursor: 'pointer' }}
                      title={`View material pending sites for ${v.name}`}
                      onClick={(e) => { e.stopPropagation(); openDrillDown('material-pending', 'Material Pending Sites', undefined, v.inst_vendor); }}
                    >
                      {num(v.material_pending || 0)}
                    </td>
                    <td
                      className="ax-table__td ax-table__td--num ax-num"
                      style={{ color: 'var(--ax-viz-emerald, #10b981)', fontWeight: 600, cursor: 'pointer' }}
                      title={`View completed sites for ${v.name}`}
                      onClick={(e) => { e.stopPropagation(); openDrillDown('complete', 'Installed Sites', undefined, v.inst_vendor); }}
                    >
                      {num(v.inst_complete || 0)}
                    </td>
                    <td
                      className="ax-table__td ax-table__td--num ax-num"
                      style={{ color: 'var(--ax-viz-amber, #f59e0b)', fontWeight: 600, cursor: 'pointer' }}
                      title={`View pending sites for ${v.name}`}
                      onClick={(e) => { e.stopPropagation(); openDrillDown('pending', 'Pending Sites', undefined, v.inst_vendor); }}
                    >
                      {num(v.inst_pending || 0)}
                    </td>
                    <td
                      className="ax-table__td ax-table__td--num ax-num"
                      style={{ color: 'var(--ax-viz-cyan, #0891b2)', fontWeight: 600, cursor: 'pointer' }}
                      title={`View verify approved sites for ${v.name}`}
                      onClick={(e) => { e.stopPropagation(); openDrillDown('verify-approved', 'Verify Approved Sites', undefined, v.inst_vendor); }}
                    >
                      {num(v.verify_approved || 0)}
                    </td>
                    <td
                      className="ax-table__td ax-table__td--num ax-num"
                      style={{ color: 'var(--ax-viz-amber, #f59e0b)', fontWeight: 600, cursor: 'pointer' }}
                      title={`View verify pending sites for ${v.name}`}
                      onClick={(e) => { e.stopPropagation(); openDrillDown('verify-pending', 'Verify Pending Sites', undefined, v.inst_vendor); }}
                    >
                      {num(v.verify_pending || 0)}
                    </td>
                    <td
                      className="ax-table__td ax-table__td--num ax-num"
                      style={{ color: 'var(--ax-viz-emerald, #10b981)', fontWeight: 600, cursor: 'pointer' }}
                      title={`View payment 80% settled sites for ${v.name}`}
                      onClick={(e) => { e.stopPropagation(); openDrillDown('inst-pay80-complete', 'Payment 80% Settled Sites', undefined, v.inst_vendor); }}
                    >
                      {num(v.inst_pay80_complete || 0)}
                    </td>
                    <td
                      className="ax-table__td ax-table__td--num ax-num"
                      style={{ color: 'var(--ax-viz-amber, #f59e0b)', fontWeight: 600, cursor: 'pointer' }}
                      title={`View payment 80% pending sites for ${v.name}`}
                      onClick={(e) => { e.stopPropagation(); openDrillDown('inst-pay80-pending', 'Payment 80% Pending Sites', undefined, v.inst_vendor); }}
                    >
                      {num(v.inst_pay80_pending || 0)}
                    </td>
                    <td
                      className="ax-table__td ax-table__td--num ax-num"
                      style={{ color: 'var(--ax-viz-violet, #7c3aed)', fontWeight: 600, cursor: 'pointer' }}
                      title={`View payment 20% settled sites for ${v.name}`}
                      onClick={(e) => { e.stopPropagation(); openDrillDown('inst-pay20-complete', 'Payment 20% Settled Sites', undefined, v.inst_vendor); }}
                    >
                      {num(v.inst_pay20_complete || 0)}
                    </td>
                    <td
                      className="ax-table__td ax-table__td--num ax-num"
                      style={{ color: 'var(--ax-viz-amber, #f59e0b)', fontWeight: 600, cursor: 'pointer' }}
                      title={`View payment 20% pending sites for ${v.name}`}
                      onClick={(e) => { e.stopPropagation(); openDrillDown('inst-pay20-pending', 'Payment 20% Pending Sites', undefined, v.inst_vendor); }}
                    >
                      {num(v.inst_pay20_pending || 0)}
                    </td>
                  </tr>
                ))}
                {!loading && pagedVendors.length === 0 && (
                  <tr>
                    <td className="ax-table__td" colSpan={13} style={{ textAlign: 'center', color: 'var(--ax-text-muted)', padding: 24 }}>
                      No vendors match the search criteria.
                    </td>
                  </tr>
                )}
                {pagedVendors.length > 0 && (
                  <tr className="ax-table__row" style={{ background: 'var(--ax-surface-subtle, #f8fafc)', fontWeight: 'var(--ax-weight-bold)' }}>
                    <td className="ax-table__td" style={{ color: 'var(--ax-text-strong)' }}>Total ({vendorswise.length} Vendors)</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-pink, #db2777)' }}>{num(totalTodayInstall)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num">{num(vendorswise.reduce((a, v) => a + v.site_count, 0))}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-cyan, #0891b2)' }}>{num(vendorswise.reduce((a, v) => a + v.material_dispatch, 0))}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-amber, #f59e0b)' }}>{num(vendorswise.reduce((a, v) => a + v.material_pending, 0))}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-emerald, #10b981)' }}>{num(vendorswise.reduce((a, v) => a + v.inst_complete, 0))}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-amber, #f59e0b)' }}>{num(vendorswise.reduce((a, v) => a + v.inst_pending, 0))}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-cyan, #0891b2)' }}>{num(vendorswise.reduce((a, v) => a + v.verify_approved, 0))}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-amber, #f59e0b)' }}>{num(vendorswise.reduce((a, v) => a + v.verify_pending, 0))}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-emerald, #10b981)' }}>{num(vendorswise.reduce((a, v) => a + v.inst_pay80_complete, 0))}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-amber, #f59e0b)' }}>{num(vendorswise.reduce((a, v) => a + v.inst_pay80_pending, 0))}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-violet, #7c3aed)' }}>{num(vendorswise.reduce((a, v) => a + v.inst_pay20_complete, 0))}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-amber, #f59e0b)' }}>{num(vendorswise.reduce((a, v) => a + v.inst_pay20_pending, 0))}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="ax-card__footer" style={footerStyle}>
            <div className="ula-pagination-left">
              <Pagination
                currentPage={vendorCurrentPage}
                totalItems={vendorTotalItems}
                pageSize={vendorPageSize}
                onPageChange={setVendorPage}
                onPageSizeChange={setVendorPageSize}
                pageSizeOptions={[10, 15, 25, 50, 100]}
              />
            </div>
          </div>
        </section>
      </div>

      <footer style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--ax-border, #e2e8f0)', textAlign: 'center', color: 'var(--ax-text-muted)', fontSize: 13 }}>
        Copyright © ETS NETWORKS. All rights reserved.
      </footer>
    </div>
  );
}

export default SrtDashboard;
