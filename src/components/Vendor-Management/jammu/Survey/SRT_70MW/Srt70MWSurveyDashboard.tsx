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
  jammuSurveyAdminService,
  type JammuSrt70SurveyDashboardData,
  type JammuSrt70SurveyDistrictwise,
  type JammuSrt70SurveyVendorwise,
} from '../jammuSurveyAdminService';

// Lazy-load ApexCharts
const ApexChart = lazy(() => import('../../../../charts/ApexChart').then((m) => ({ default: m.ApexChart })));

// Color Palette matching Solar ERP design standard
const LIGHT_BLUE = '#2563eb';
const LIGHT_GREEN = '#10b981';
const LIGHT_CYAN = '#0891b2';
const LIGHT_AMBER = '#f59e0b';
const LIGHT_VIOLET = '#7c3aed';
const LIGHT_RED = '#ef4444';
const LIGHT_PINK = '#db2777';

const num = (x: number | string | undefined | null) => Number(x || 0).toLocaleString('en-IN');
const pctOf = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : 0);
const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

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
  .solar-erp-page .ax-table { min-width: 950px; }
  .solar-erp-page .ax-welcome__lede { max-width: 820px; }

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

  .asw-title-badge {
    font-size: 11px;
    padding: 2px 7px;
    font-weight: 600;
    border-radius: 999px;
    background: #e2e8f0;
    color: #475569;
    letter-spacing: 0.02em;
    vertical-align: middle;
  }

  @media (max-width: 992px) {
    .solar-erp-page .ax-card__header {
      flex-wrap: wrap;
    }
    .solar-erp-page .ax-card__actions {
      width: 100%;
      justify-content: flex-start;
      margin-left: 0;
    }
    .solar-erp-page .asw-filter-item select {
      width: 100%;
    }
  }
`;

/* SVG Icons */
const svg = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const I_PIN = svg(<><path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /><path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0" /></>);
const I_USER_CHECK = svg(<><path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" /><path d="M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" /><path d="M16 11l2 2l4 -4" /></>);
const I_USER_X = svg(<><path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" /><path d="M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" /><path d="M17 9l4 4m0 -4l-4 4" /></>);
const I_DONE = svg(<><path d="M7 12l5 5l10 -10" /><path d="M2 12l5 5m5 -5l5 -5" /></>);
const I_CLOCK = svg(<><path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M12 7v5l3 3" /></>);
const I_SHIELD = svg(<><path d="M12 3a12 12 0 0 0 8.5 3a12 12 0 0 1 -8.5 15a12 12 0 0 1 -8.5 -15a12 12 0 0 0 8.5 -3" /><path d="M9 12l2 2l4 -4" /></>);
const I_X = svg(<><path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M10 10l4 4m0 -4l-4 4" /></>);
const I_AWARD = svg(<><circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" /></>);

/* KPI Card Component */
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

function KpiCardItem({ icon, tone, label, value, unit, sub, badge, spark, sparkType = 'line', onClick, colSpan = 'ax-col--3' }: KpiProps) {
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
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ax-text-muted, #64748b)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
          </div>
          {badge && (
            <span className="ax-kpi__delta ax-kpi__delta--up" style={{ fontSize: '11px', padding: '1px 6px', flexShrink: 0 }}>
              {badge}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--ax-font-display)', fontSize: '1.35rem', fontWeight: 700, lineHeight: 1.1, color: 'var(--ax-text-strong, #0f172a)', fontVariantNumeric: 'tabular-nums' }}>
              {value} {unit && <small style={{ fontSize: '11px', fontWeight: 500, color: 'var(--ax-text-muted)' }}>{unit}</small>}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--ax-text-muted, #64748b)', marginTop: '2px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div>
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

const actionsRowStyle = { gap: 'var(--ax-space-2, 8px)', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', width: '100%' } as const;
const footerStyle = { borderTop: '1px solid var(--ax-border, #e2e8f0)', padding: 'var(--ax-space-3, 12px) var(--ax-space-4, 16px)' } as const;

export function Srt70MWSurveyDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<JammuSrt70SurveyDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  // Filters
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [tableQuery, setTableQuery] = useState<string>('');
  const [vendorTableQuery, setVendorTableQuery] = useState<string>('');

  const chartH = useChartHeight(320, 260);
  const donutH = useChartHeight(230, 210);

  // 1. Fetch live survey dashboard data
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const res = await jammuSurveyAdminService.getSrt70SurveyDashboard();
      setData(res || null);
      setUpdatedAt(new Date());
    } catch (err: any) {
      console.error('Jammu SRT Survey Dashboard fetch error:', err);
      setApiError(err?.message || 'Failed to fetch Jammu SRT 70MW Survey dashboard data.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Status drill-down helper
  const openDrillDown = (statusTab: 'pending' | 'verify' | 'all') => {
    navigate(`/vendor-management/jammu/survey/srt-70mw/verify?tab=${statusTab}`);
  };

  // Raw survey stats
  const detail = useMemo(() => {
    const d = data?.survey_detail || {};
    return {
      total: Number(d.total ?? d.totalsite ?? 0),
      assigned: Number(d.assigned ?? d.assignsite ?? 0),
      not_assigned: Number(d.not_assigned ?? d.not_assign ?? 0),
      survey_done: Number(d.survey_done ?? d.complete_survey ?? 0),
      survey_pending: Number(d.survey_pending ?? d.pending_survey ?? 0),
      survey_verify_pending: Number(d.survey_verify_pending ?? 0),
      survey_verify_complete: Number(d.survey_verify_complete ?? d.survey_verify ?? 0),
      survey_verify_reject: Number(d.survey_verify_reject ?? 0),
    };
  }, [data]);

  // Districtwise normalized array
  const rawDistricts = useMemo(() => {
    return Array.isArray(data?.districtwise) ? data!.districtwise! : [];
  }, [data]);

  // Vendorwise normalized array
  const rawVendors = useMemo(() => {
    return Array.isArray(data?.vendor_wises) ? data!.vendor_wises! : [];
  }, [data]);

  // District options
  const districtOptions = useMemo(
    () => [...new Set(rawDistricts.map((d) => d.district).filter(Boolean))].sort(),
    [rawDistricts]
  );

  // Filtered districts
  const filteredDistricts = useMemo(() => {
    return rawDistricts.filter((d) => {
      const matchDistrict = selectedDistrict === 'All' || d.district.toLowerCase() === selectedDistrict.toLowerCase();
      let matchStatus = true;
      if (selectedStatus === 'Done') matchStatus = (d.survey_done || 0) > 0;
      else if (selectedStatus === 'Pending') matchStatus = (d.survey_pending || 0) > 0;
      else if (selectedStatus === 'Verified') matchStatus = (d.survey_verify_complete || 0) > 0;
      return matchDistrict && matchStatus;
    });
  }, [rawDistricts, selectedDistrict, selectedStatus]);

  // Filtered district table rows with search
  const deferredDistrictQuery = useDeferredValue(tableQuery);
  const tableDistricts = useMemo(() => {
    const q = deferredDistrictQuery.trim().toLowerCase();
    return filteredDistricts.filter((d) => !q || d.district.toLowerCase().includes(q));
  }, [filteredDistricts, deferredDistrictQuery]);

  const {
    paginatedData: pagedDistricts,
    currentPage,
    pageSize,
    totalItems,
    setPage,
    setPageSize,
  } = usePagination({ data: tableDistricts, initialPageSize: 10 });

  useEffect(() => {
    setPage(1);
  }, [tableQuery, selectedDistrict, selectedStatus, setPage]);

  // Filtered vendor table rows with search
  const deferredVendorQuery = useDeferredValue(vendorTableQuery);
  const tableVendors = useMemo(() => {
    const q = deferredVendorQuery.trim().toLowerCase();
    return rawVendors.filter((v) => {
      const name = String(v.vendor_name || (v as any).vendor || v.survey_vendor || '');
      return !q || name.toLowerCase().includes(q);
    });
  }, [rawVendors, deferredVendorQuery]);

  const {
    paginatedData: pagedVendors,
    currentPage: vendorCurrentPage,
    pageSize: vendorPageSize,
    totalItems: vendorTotalItems,
    setPage: setVendorPage,
    setPageSize: setVendorPageSize,
  } = usePagination({ data: tableVendors, initialPageSize: 10 });

  useEffect(() => {
    setVendorPage(1);
  }, [vendorTableQuery, setVendorPage]);

  // Milestones
  const pctAssigned = pctOf(detail.assigned, detail.total);
  const pctDone = pctOf(detail.survey_done, detail.assigned || detail.total);
  const pctVerified = pctOf(detail.survey_verify_complete, detail.survey_done || 1);

  const milestones = [
    { label: '1. Total Allocated Sites', v: detail.total, of: detail.total || 1, color: LIGHT_BLUE },
    { label: '2. Assigned to Vendors', v: detail.assigned, of: detail.total || 1, color: LIGHT_CYAN },
    { label: '3. Field Surveys Done', v: detail.survey_done, of: detail.total || 1, color: LIGHT_AMBER },
    { label: '4. Survey Verified / Approved', v: detail.survey_verify_complete, of: detail.total || 1, color: LIGHT_GREEN },
  ];

  // Chart datasets
  const chartDistricts = useMemo(
    () => [...filteredDistricts].sort((a, b) => (b.survey_done || 0) - (a.survey_done || 0)).slice(0, 10),
    [filteredDistricts]
  );

  const barCategories = chartDistricts.map((d) => d.district);
  const barSeries = [
    { name: 'Total Sites', data: chartDistricts.map((d) => d.total || 0) },
    { name: 'Survey Done', data: chartDistricts.map((d) => d.survey_done || 0) },
    { name: 'Verified', data: chartDistricts.map((d) => d.survey_verify_complete || 0) },
  ];

  const donutSeries = [
    detail.survey_verify_complete,
    detail.survey_verify_pending,
    detail.survey_verify_reject,
    detail.survey_pending,
  ];
  const donutLabels = ['Approved', 'Verification Pending', 'Rejected', 'Survey Pending'];

  // Export Columns definition
  const districtExportCols: ExportColumn<JammuSrt70SurveyDistrictwise>[] = useMemo(() => [
    { header: 'District', accessor: 'district' },
    { header: 'Total Sites', accessor: 'total' },
    { header: 'Assigned Sites', accessor: 'assigned' },
    { header: 'Unassigned Sites', accessor: 'not_assigned' },
    { header: 'Survey Done', accessor: 'survey_done' },
    { header: 'Survey Pending', accessor: 'survey_pending' },
    { header: 'Verify Pending', accessor: 'survey_verify_pending' },
    { header: 'Verify Complete', accessor: 'survey_verify_complete' },
    { header: 'Verify Reject', accessor: 'survey_verify_reject' },
  ], []);

  const vendorExportCols: ExportColumn<JammuSrt70SurveyVendorwise>[] = useMemo(() => [
    { header: 'Vendor Name', accessor: (v) => String(v.vendor_name || (v as any).vendor || v.survey_vendor || '') },
    { header: 'Total Sites', accessor: 'total' },
    { header: 'Survey Done', accessor: 'survey_done' },
    { header: 'Survey Pending', accessor: 'survey_pending' },
    { header: 'Verify Pending', accessor: 'survey_verify_pending' },
    { header: 'Verify Complete', accessor: 'survey_verify_complete' },
    { header: 'Verify Reject', accessor: 'survey_verify_reject' },
  ], []);

  return (
    <div className="ax-page solar-erp-page">
      <style>{PAGE_CSS}</style>

      <PageHead
        title="Jammu SRT 70MW Survey Dashboard"
        subtitle="Executive operational tracking, vendor performance, and district-level survey analytics"
        breadcrumbs={[
          { label: 'ERP Dashboard', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Jammu' },
          { label: 'Survey' },
          { label: 'SRT 70MW' },
        ]}
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <Link
              to="/vendor-management/jammu/survey/srt-70mw/assign"
              className="ax-btn ax-btn--primary ax-btn--sm"
            >
              + Assign Survey Sites
            </Link>
            <Link
              to="/vendor-management/jammu/survey/srt-70mw/view-assign"
              className="ax-btn ax-btn--secondary ax-btn--sm"
            >
              Assigned Batches
            </Link>
            <Link
              to="/vendor-management/jammu/survey/srt-70mw/verify"
              className="ax-btn ax-btn--secondary ax-btn--sm"
            >
              Verify Surveys
            </Link>
          </div>
        }
      />

      {/* Executive Welcome Banner */}
      <div
        className="ax-card"
        style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #3b82f6 100%)',
          color: '#ffffff',
          borderRadius: 12,
          padding: '20px 24px',
          marginBottom: 20,
          boxShadow: '0 4px 12px rgba(37, 99, 235, 0.15)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', background: 'rgba(255,255,255,0.2)', padding: '3px 10px', borderRadius: 999 }}>
              Jammu SRT 70MW Rooftop Solar Phase
            </span>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '8px 0 4px', color: '#ffffff' }}>
              Welcome back, {data?.role ? `Super Admin` : 'Administrator'}
            </h1>
            <p className="ax-welcome__lede" style={{ fontSize: '0.875rem', opacity: 0.9, margin: 0 }}>
              Live real-time monitoring across <b>{detail.total}</b> survey sites in Jammu division.
              {updatedAt && (
                <span style={{ marginLeft: 8, opacity: 0.8 }}>
                  Last synced: {updatedAt.toLocaleTimeString('en-IN')}
                </span>
              )}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              type="button"
              className="ax-btn ax-btn--sm"
              onClick={loadDashboardData}
              disabled={loading}
              style={{ background: 'rgba(255,255,255,0.15)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.3)' }}
            >
              {loading ? 'Syncing...' : '↻ Refresh Data'}
            </button>
            <Link
              to="/vendor-management/jammu/survey/srt-70mw/verify"
              className="ax-btn ax-btn--sm"
              style={{ background: '#ffffff', color: '#1e3a8a', fontWeight: 700 }}
            >
              Audit & Verification Queue ({detail.survey_verify_pending})
            </Link>
          </div>
        </div>
      </div>

      {apiError && (
        <div style={{ padding: '12px 16px', background: '#fee2e2', border: '1px solid #ef4444', borderRadius: 8, color: '#b91c1c', marginBottom: 20, fontSize: 13 }}>
          <b>API Notice:</b> {apiError}
        </div>
      )}

      {/* Filter Bar */}
      <div
        className="ax-card"
        style={{
          padding: '12px 18px',
          marginBottom: 20,
          background: '#ffffff',
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div className="asw-filter-item">
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>District:</span>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="ax-input ax-input--sm"
              style={{ height: 34, fontSize: 13, borderRadius: 6 }}
            >
              <option value="All">All Districts ({districtOptions.length})</option>
              {districtOptions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="asw-filter-item">
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Survey Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="ax-input ax-input--sm"
              style={{ height: 34, fontSize: 13, borderRadius: 6 }}
            >
              <option value="All">All Statuses</option>
              <option value="Done">Survey Done</option>
              <option value="Pending">Survey Pending</option>
              <option value="Verified">Verified Approved</option>
            </select>
          </div>

          {(selectedDistrict !== 'All' || selectedStatus !== 'All') && (
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--xs"
              onClick={() => {
                setSelectedDistrict('All');
                setSelectedStatus('All');
              }}
            >
              Reset Filters
            </button>
          )}
        </div>

        <div style={{ fontSize: 12, color: '#64748b' }}>
          Showing <b>{filteredDistricts.length}</b> active district(s)
        </div>
      </div>

      {/* KPI Metric Cards Grid (8 Core Lifecycle Cards) */}
      <div className="ax-dash-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 20 }}>
        <KpiCardItem
          icon={I_PIN}
          tone="accent"
          label="Total Survey Sites"
          value={num(detail.total)}
          sub="100% Allocated"
          badge="100%"
          colSpan="ax-col--3"
          onClick={() => openDrillDown('all')}
        />
        <KpiCardItem
          icon={I_USER_CHECK}
          tone="cyan"
          label="Sites Assigned"
          value={num(detail.assigned)}
          sub={`${pctAssigned}% of total allocated`}
          badge={`${pctAssigned}%`}
          colSpan="ax-col--3"
          onClick={() => navigate('/vendor-management/jammu/survey/srt-70mw/view-assign')}
        />
        <KpiCardItem
          icon={I_USER_X}
          tone="red"
          label="Unassigned Sites"
          value={num(detail.not_assigned)}
          sub="Pending vendor dispatch"
          colSpan="ax-col--3"
          onClick={() => navigate('/vendor-management/jammu/survey/srt-70mw/assign')}
        />
        <KpiCardItem
          icon={I_DONE}
          tone="emerald"
          label="Survey Completed"
          value={num(detail.survey_done)}
          sub={`${pctDone}% of assigned`}
          badge={`${pctDone}%`}
          colSpan="ax-col--3"
          onClick={() => openDrillDown('all')}
        />
        <KpiCardItem
          icon={I_CLOCK}
          tone="amber"
          label="Survey Pending"
          value={num(detail.survey_pending)}
          sub="Awaiting vendor inspection"
          colSpan="ax-col--3"
          onClick={() => openDrillDown('pending')}
        />
        <KpiCardItem
          icon={I_SHIELD}
          tone="violet"
          label="Verification Pending"
          value={num(detail.survey_verify_pending)}
          sub="Pending admin sign-off"
          badge="Audit Queue"
          colSpan="ax-col--3"
          onClick={() => openDrillDown('pending')}
        />
        <KpiCardItem
          icon={I_AWARD}
          tone="emerald"
          label="Verified / Approved"
          value={num(detail.survey_verify_complete)}
          sub={`${pctVerified}% survey approval rate`}
          badge={`${pctVerified}%`}
          colSpan="ax-col--3"
          onClick={() => openDrillDown('verify')}
        />
        <KpiCardItem
          icon={I_X}
          tone="red"
          label="Verification Rejected"
          value={num(detail.survey_verify_reject)}
          sub="Requires re-survey visit"
          colSpan="ax-col--3"
          onClick={() => openDrillDown('verify')}
        />
      </div>

      {/* Analytics Charts & Milestones Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16, marginBottom: 20 }}>
        {/* District Distribution Bar Chart */}
        <div className="ax-card" style={{ gridColumn: 'span 2' }}>
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h3 className="ax-card__title" style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                District-Wise Survey Progress
              </h3>
              <p className="ax-card__subtitle" style={{ fontSize: '0.8rem', color: '#64748b', margin: '2px 0 0' }}>
                Comparison of total sites, completed surveys, and approved records
              </p>
            </div>
            <span className="asw-title-badge">Top {chartDistricts.length} Districts</span>
          </div>
          <div className="ax-card__body" style={{ padding: '12px 16px' }}>
            {barCategories.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
                No district records available to plot.
              </div>
            ) : (
              <Suspense fallback={<div style={{ height: chartH }} />}>
                <ApexChart
                  type="bar"
                  height={chartH}
                  series={barSeries}
                  color={LIGHT_BLUE}
                  apex={{
                    chart: { stacked: false, toolbar: { show: false } },
                    xaxis: { categories: barCategories },
                    yaxis: { min: 0, forceNiceScale: true },
                    plotOptions: { bar: { columnWidth: '50%', borderRadius: 3 } },
                    colors: [LIGHT_BLUE, LIGHT_AMBER, LIGHT_GREEN],
                    legend: { position: 'top', horizontalAlign: 'right' },
                    dataLabels: { enabled: false },
                  }}
                />
              </Suspense>
            )}
          </div>
        </div>

        {/* Survey Status Donut Chart */}
        <div className="ax-card">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h3 className="ax-card__title" style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                Survey Status Breakdown
              </h3>
              <p className="ax-card__subtitle" style={{ fontSize: '0.8rem', color: '#64748b', margin: '2px 0 0' }}>
                Distribution across lifecycle stages
              </p>
            </div>
          </div>
          <div className="ax-card__body" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Suspense fallback={<div style={{ height: donutH }} />}>
              <ApexChart
                type="donut"
                height={donutH}
                series={donutSeries}
                color={LIGHT_GREEN}
                apex={{
                  labels: donutLabels,
                  colors: [LIGHT_GREEN, LIGHT_VIOLET, LIGHT_RED, LIGHT_AMBER],
                  legend: { position: 'bottom' },
                  dataLabels: { enabled: true },
                }}
              />
            </Suspense>
          </div>
        </div>
      </div>

      {/* Survey Milestones Progress Card */}
      <div className="ax-card" style={{ marginBottom: 20 }}>
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h3 className="ax-card__title" style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
              SRT 70MW Survey Lifecycle Progress
            </h3>
            <p className="ax-card__subtitle" style={{ fontSize: '0.8rem', color: '#64748b', margin: '2px 0 0' }}>
              Sequential achievement milestones for Jammu rooftop solar sites
            </p>
          </div>
        </div>
        <div className="ax-card__body" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {milestones.map((m) => {
              const pct = pctOf(m.v, m.of);
              return (
                <div key={m.label} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ fontWeight: 600, color: '#334155' }}>{m.label}</span>
                    <span style={{ fontWeight: 700, color: m.color }}>{num(m.v)} ({pct}%)</span>
                  </div>
                  <div style={{ height: 8, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', background: m.color, borderRadius: 999 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* District-Wise Performance Table Card */}
      <div className="ax-card" style={{ marginBottom: 20 }}>
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h3 className="ax-card__title" style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--ax-text-strong, #0f172a)' }}>
              District-Wise Operational Register
            </h3>
            <p className="ax-card__subtitle" style={{ fontSize: '0.825rem', color: '#64748b', margin: '2px 0 0' }}>
              Showing {tableDistricts.length} district record{tableDistricts.length === 1 ? '' : 's'}
            </p>
          </div>

          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              <SearchInput
                value={tableQuery}
                onChange={setTableQuery}
                placeholder="Search district..."
              />
              <TableExportToolbar
                onExportCSV={() => {
                  const rows = tableDistricts.map((d) => ({
                    district: d.district,
                    total: d.total || 0,
                    assigned: d.assigned || 0,
                    not_assigned: d.not_assigned || 0,
                    survey_done: d.survey_done || 0,
                    survey_pending: d.survey_pending || 0,
                    survey_verify_pending: d.survey_verify_pending || 0,
                    survey_verify_complete: d.survey_verify_complete || 0,
                    survey_verify_reject: d.survey_verify_reject || 0,
                  }));
                  exportRowsCSV(districtExportCols as any, rows, 'jammu_srt_district_survey.csv');
                }}
                onExportExcel={() => {
                  const rows = tableDistricts.map((d) => ({
                    district: d.district,
                    total: d.total || 0,
                    assigned: d.assigned || 0,
                    not_assigned: d.not_assigned || 0,
                    survey_done: d.survey_done || 0,
                    survey_pending: d.survey_pending || 0,
                    survey_verify_pending: d.survey_verify_pending || 0,
                    survey_verify_complete: d.survey_verify_complete || 0,
                    survey_verify_reject: d.survey_verify_reject || 0,
                  }));
                  exportRowsExcel(districtExportCols as any, rows, 'jammu_srt_district_survey.xlsx');
                }}
                onExportPDF={() => {
                  const rows = tableDistricts.map((d) => ({
                    district: d.district,
                    total: d.total || 0,
                    assigned: d.assigned || 0,
                    not_assigned: d.not_assigned || 0,
                    survey_done: d.survey_done || 0,
                    survey_pending: d.survey_pending || 0,
                    survey_verify_pending: d.survey_verify_pending || 0,
                    survey_verify_complete: d.survey_verify_complete || 0,
                    survey_verify_reject: d.survey_verify_reject || 0,
                  }));
                  exportRowsPDF(districtExportCols as any, rows, 'Jammu SRT 70MW District Survey Progress');
                }}
                onCopy={() => {
                  const rows = tableDistricts.map((d) => ({
                    district: d.district,
                    total: d.total || 0,
                    assigned: d.assigned || 0,
                    not_assigned: d.not_assigned || 0,
                    survey_done: d.survey_done || 0,
                    survey_pending: d.survey_pending || 0,
                    survey_verify_pending: d.survey_verify_pending || 0,
                    survey_verify_complete: d.survey_verify_complete || 0,
                    survey_verify_reject: d.survey_verify_reject || 0,
                  }));
                  copyRowsToClipboard(districtExportCols as any, rows);
                }}
              />
            </div>
          </div>
        </div>

        <div className="ax-table-wrap">
          <table className="ax-table">
            <thead>
              <tr>
                <th style={{ width: 50, textAlign: 'center' }}>#</th>
                <th style={{ minWidth: 150 }}>District</th>
                <th style={{ minWidth: 100, textAlign: 'right' }}>Total Sites</th>
                <th style={{ minWidth: 100, textAlign: 'right' }}>Assigned</th>
                <th style={{ minWidth: 100, textAlign: 'right' }}>Unassigned</th>
                <th style={{ minWidth: 100, textAlign: 'right' }}>Survey Done</th>
                <th style={{ minWidth: 100, textAlign: 'right' }}>Pending</th>
                <th style={{ minWidth: 110, textAlign: 'right' }}>Verify Pending</th>
                <th style={{ minWidth: 110, textAlign: 'right' }}>Approved</th>
                <th style={{ minWidth: 90, textAlign: 'right' }}>Rejected</th>
              </tr>
            </thead>
            <tbody>
              {pagedDistricts.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                    No district survey data found.
                  </td>
                </tr>
              ) : (
                pagedDistricts.map((d, i) => (
                  <tr key={d.district || i}>
                    <td style={{ textAlign: 'center' }}>
                      {(currentPage - 1) * pageSize + i + 1}
                    </td>
                    <td>
                      <b style={{ color: '#1e293b' }}>{d.district}</b>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{num(d.total)}</td>
                    <td style={{ textAlign: 'right', color: '#2563eb' }}>{num(d.assigned)}</td>
                    <td style={{ textAlign: 'right', color: '#ef4444' }}>{num(d.not_assigned)}</td>
                    <td style={{ textAlign: 'right', color: '#16a34a', fontWeight: 600 }}>{num(d.survey_done)}</td>
                    <td style={{ textAlign: 'right', color: '#f59e0b' }}>{num(d.survey_pending)}</td>
                    <td style={{ textAlign: 'right', color: '#7c3aed' }}>{num(d.survey_verify_pending)}</td>
                    <td style={{ textAlign: 'right', color: '#10b981', fontWeight: 700 }}>{num(d.survey_verify_complete)}</td>
                    <td style={{ textAlign: 'right', color: '#dc2626' }}>{num(d.survey_verify_reject)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="ax-card__footer" style={footerStyle}>
          <div className="ula-pagination-left">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(totalItems / pageSize) || 1}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        </div>
      </div>

      {/* Vendor-Wise Performance Table Card */}
      <div className="ax-card">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h3 className="ax-card__title" style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--ax-text-strong, #0f172a)' }}>
              Vendor-Wise Performance Register
            </h3>
            <p className="ax-card__subtitle" style={{ fontSize: '0.825rem', color: '#64748b', margin: '2px 0 0' }}>
              Showing {tableVendors.length} survey vendor{tableVendors.length === 1 ? '' : 's'}
            </p>
          </div>

          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              <SearchInput
                value={vendorTableQuery}
                onChange={setVendorTableQuery}
                placeholder="Search vendor..."
              />
              <TableExportToolbar
                onExportCSV={() => {
                  const rows = tableVendors.map((v) => ({
                    vendor_name: String(v.vendor_name || (v as any).vendor || v.survey_vendor || ''),
                    total: v.total || 0,
                    survey_done: v.survey_done || 0,
                    survey_pending: v.survey_pending || 0,
                    survey_verify_pending: v.survey_verify_pending || 0,
                    survey_verify_complete: v.survey_verify_complete || 0,
                    survey_verify_reject: v.survey_verify_reject || 0,
                  }));
                  exportRowsCSV(vendorExportCols as any, rows, 'jammu_srt_vendor_survey.csv');
                }}
                onExportExcel={() => {
                  const rows = tableVendors.map((v) => ({
                    vendor_name: String(v.vendor_name || (v as any).vendor || v.survey_vendor || ''),
                    total: v.total || 0,
                    survey_done: v.survey_done || 0,
                    survey_pending: v.survey_pending || 0,
                    survey_verify_pending: v.survey_verify_pending || 0,
                    survey_verify_complete: v.survey_verify_complete || 0,
                    survey_verify_reject: v.survey_verify_reject || 0,
                  }));
                  exportRowsExcel(vendorExportCols as any, rows, 'jammu_srt_vendor_survey.xlsx');
                }}
                onExportPDF={() => {
                  const rows = tableVendors.map((v) => ({
                    vendor_name: String(v.vendor_name || (v as any).vendor || v.survey_vendor || ''),
                    total: v.total || 0,
                    survey_done: v.survey_done || 0,
                    survey_pending: v.survey_pending || 0,
                    survey_verify_pending: v.survey_verify_pending || 0,
                    survey_verify_complete: v.survey_verify_complete || 0,
                    survey_verify_reject: v.survey_verify_reject || 0,
                  }));
                  exportRowsPDF(vendorExportCols as any, rows, 'Jammu SRT 70MW Vendor Survey Performance');
                }}
                onCopy={() => {
                  const rows = tableVendors.map((v) => ({
                    vendor_name: String(v.vendor_name || (v as any).vendor || v.survey_vendor || ''),
                    total: v.total || 0,
                    survey_done: v.survey_done || 0,
                    survey_pending: v.survey_pending || 0,
                    survey_verify_pending: v.survey_verify_pending || 0,
                    survey_verify_complete: v.survey_verify_complete || 0,
                    survey_verify_reject: v.survey_verify_reject || 0,
                  }));
                  copyRowsToClipboard(vendorExportCols as any, rows);
                }}
              />
            </div>
          </div>
        </div>

        <div className="ax-table-wrap">
          <table className="ax-table">
            <thead>
              <tr>
                <th style={{ width: 50, textAlign: 'center' }}>#</th>
                <th style={{ minWidth: 180 }}>Vendor Name</th>
                <th style={{ minWidth: 100, textAlign: 'right' }}>Total Assigned</th>
                <th style={{ minWidth: 100, textAlign: 'right' }}>Survey Done</th>
                <th style={{ minWidth: 100, textAlign: 'right' }}>Survey Pending</th>
                <th style={{ minWidth: 110, textAlign: 'right' }}>Verify Pending</th>
                <th style={{ minWidth: 110, textAlign: 'right' }}>Approved</th>
                <th style={{ minWidth: 90, textAlign: 'right' }}>Rejected</th>
              </tr>
            </thead>
            <tbody>
              {pagedVendors.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                    No vendor survey data found.
                  </td>
                </tr>
              ) : (
                pagedVendors.map((v, i) => {
                  const name = String(v.vendor_name || (v as any).vendor || v.survey_vendor || `Vendor #${i + 1}`);
                  return (
                    <tr key={name || i}>
                      <td style={{ textAlign: 'center' }}>
                        {(vendorCurrentPage - 1) * vendorPageSize + i + 1}
                      </td>
                      <td>
                        <b style={{ color: '#1e293b' }}>{name}</b>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{num(v.total)}</td>
                      <td style={{ textAlign: 'right', color: '#16a34a', fontWeight: 600 }}>{num(v.survey_done)}</td>
                      <td style={{ textAlign: 'right', color: '#f59e0b' }}>{num(v.survey_pending)}</td>
                      <td style={{ textAlign: 'right', color: '#7c3aed' }}>{num(v.survey_verify_pending)}</td>
                      <td style={{ textAlign: 'right', color: '#10b981', fontWeight: 700 }}>{num(v.survey_verify_complete)}</td>
                      <td style={{ textAlign: 'right', color: '#dc2626' }}>{num(v.survey_verify_reject)}</td>
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
              currentPage={vendorCurrentPage}
              totalPages={Math.ceil(vendorTotalItems / vendorPageSize) || 1}
              pageSize={vendorPageSize}
              totalItems={vendorTotalItems}
              onPageChange={setVendorPage}
              onPageSizeChange={setVendorPageSize}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Srt70MWSurveyDashboard;
