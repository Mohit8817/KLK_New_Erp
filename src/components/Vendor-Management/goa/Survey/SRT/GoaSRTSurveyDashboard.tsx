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
  goaAdminService,
  normalizeGoaSurveyStatus,
  type GoaSurveyDashboardData,
  type GoaSurveyDistrictwiseRow,
  type GoaSurveyVendorwiseRow,
} from '../../goa-services';

// Code-split ApexCharts so Goa SRT Survey Dashboard renders instantly
const ApexChart = lazy(() => import('../../../../charts/ApexChart').then((m) => ({ default: m.ApexChart })));

// Palette constants matching Solar ERP design language
const LIGHT_BLUE = '#2563eb';
const LIGHT_GREEN = '#10b981';
const LIGHT_CYAN = '#0891b2';
const LIGHT_AMBER = '#f59e0b';
const LIGHT_VIOLET = '#7c3aed';
const LIGHT_RED = '#ef4444';

const num = (x: number | string | undefined | null) => (Number(x) || 0).toLocaleString('en-IN');
const pctOf = (a: number | string | undefined | null, b: number | string | undefined | null) => {
  const an = Number(a) || 0;
  const bn = Number(b) || 0;
  return bn ? Math.round((an / bn) * 1000) / 10 : 0;
};
const escapeHtml = (s: string) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

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

/* ───────── Responsive page CSS (Exact Reference Layout) ───────── */
const PAGE_CSS = `
  .solar-erp-page {
    --asw-primary: var(--ax-accent, #2563eb);
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

  /* Filter bar matching reference */
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

  /* ───── Tablet (<=1100px) ───── */
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

  /* ───── Mobile (<=760px): Stack and full width ───── */
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
    .solar-erp-page .ax-card__title {
      font-family: var(--ax-font-display);
      font-size: var(--ax-text-md);
      line-height: var(--ax-leading-md);
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

  /* ───── Small phones (<=490px) ───── */
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
const I_USER = svg(<><circle cx="12" cy="7" r="4" /><path d="M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" /></>);
const ICON_FILTER = (
  <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 4h16v2.172a2 2 0 0 1 -.586 1.414l-4.828 4.828v7.586l-4 -2v-5.586l-4.828 -4.828a2 2 0 0 1 -.586 -1.414v-2.172z" /></svg>
);

/* ───────── KPI card Component matching Installation Reference ───────── */
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
  accent: { bg: 'rgba(var(--asw-primary-rgb), 0.12)', fg: 'var(--ax-accent, #2563eb)', apex: '#2563eb' },
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

export function GoaSRTSurveyDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<GoaSurveyDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  // Filter states matching Installation Dashboard
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [districtQuery, setDistrictQuery] = useState<string>('');
  const [vendorQuery, setVendorQuery] = useState<string>('');

  // Chart heights
  const chartH = useChartHeight(320, 260);
  const donutH = useChartHeight(230, 210);

  // Load Survey Dashboard Data from API: GET /goa/srt/survey/dashboard
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const res = await goaAdminService.getSurveyDashboard();
      setData(res);
      setUpdatedAt(new Date());
    } catch (err: any) {
      console.error('Goa SRT Survey Dashboard fetch error:', err);
      setApiError(err?.message || 'Failed to fetch dynamic survey dashboard data from server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Navigate to status view drilldown
  const openDrillDown = (statusKey: string, district?: string, vendor?: string | number) => {
    const normalizedStatus = normalizeGoaSurveyStatus(statusKey);
    const params = new URLSearchParams();
    if (normalizedStatus) params.set('status', normalizedStatus);
    if (district && district !== 'All') params.set('district', district);
    if (vendor && vendor !== 'All') params.set('vendor', String(vendor));
    navigate(`/vendor-management/goa/srt/survey/status-view?${params.toString()}`);
  };

  const rawDistricts = useMemo(() => (Array.isArray(data?.districtwise) ? data!.districtwise : []), [data]);
  const rawVendors = useMemo(() => (Array.isArray(data?.vendorwises) ? data!.vendorwises : []), [data]);

  const districtOptions = useMemo(
    () => [...new Set(rawDistricts.map((d) => d.district).filter(Boolean))].sort(),
    [rawDistricts]
  );

  // Filtered district rows based on selectedDistrict and selectedStatus
  const filteredDistricts = useMemo(() => {
    return rawDistricts.filter((d: any) => {
      const matchDistrict = selectedDistrict === 'All' || d.district?.toLowerCase() === selectedDistrict.toLowerCase();
      let matchStatus = true;
      if (selectedStatus === 'Done') matchStatus = (d.survey_done || 0) > 0;
      else if (selectedStatus === 'Pending') matchStatus = (d.survey_pending || 0) > 0;
      else if (selectedStatus === 'VerifyApproved') matchStatus = (d.survey_verify_complete || 0) > 0;
      else if (selectedStatus === 'VerifyPending') matchStatus = (d.survey_verify_pending || 0) > 0;
      else if (selectedStatus === 'VerifyReject') matchStatus = (d.survey_verify_reject || 0) > 0;
      else if (selectedStatus === 'Assigned') matchStatus = (d.assigned || 0) > 0;
      else if (selectedStatus === 'NotAssigned') matchStatus = (d.not_assigned || 0) > 0;
      return matchDistrict && matchStatus;
    });
  }, [rawDistricts, selectedDistrict, selectedStatus]);

  const rawStats = useMemo(() => {
    const s = data?.survey_detail || ({} as any);
    return {
      total: Number(s.total || 0),
      assigned: Number(s.assigned || 0),
      not_assigned: Number(s.not_assigned || 0),
      survey_done: Number(s.survey_done || 0),
      survey_pending: Number(s.survey_pending || 0),
      survey_verify_pending: Number(s.survey_verify_pending || 0),
      survey_verify_complete: Number(s.survey_verify_complete || 0),
      survey_verify_reject: Number(s.survey_verify_reject || 0),
    };
  }, [data]);

  // Dynamic metrics: aggregates from filteredDistricts when any filter is selected
  const stats = useMemo(() => {
    if (selectedDistrict === 'All' && selectedStatus === 'All') {
      return rawStats;
    }
    if (filteredDistricts.length === 0) {
      return {
        total: 0,
        assigned: 0,
        not_assigned: 0,
        survey_done: 0,
        survey_pending: 0,
        survey_verify_pending: 0,
        survey_verify_complete: 0,
        survey_verify_reject: 0,
      };
    }
    return filteredDistricts.reduce(
      (acc: any, d: any) => ({
        total: acc.total + (Number(d.total) || 0),
        assigned: acc.assigned + (Number(d.assigned) || 0),
        not_assigned: acc.not_assigned + (Number(d.not_assigned) || 0),
        survey_done: acc.survey_done + (Number(d.survey_done) || 0),
        survey_pending: acc.survey_pending + (Number(d.survey_pending) || 0),
        survey_verify_pending: acc.survey_verify_pending + (Number(d.survey_verify_pending) || 0),
        survey_verify_complete: acc.survey_verify_complete + (Number(d.survey_verify_complete) || 0),
        survey_verify_reject: acc.survey_verify_reject + (Number(d.survey_verify_reject) || 0),
      }),
      {
        total: 0,
        assigned: 0,
        not_assigned: 0,
        survey_done: 0,
        survey_pending: 0,
        survey_verify_pending: 0,
        survey_verify_complete: 0,
        survey_verify_reject: 0,
      }
    );
  }, [rawStats, filteredDistricts, selectedDistrict, selectedStatus]);

  const filtersActive = selectedDistrict !== 'All' || selectedStatus !== 'All';

  // Table search & pagination for Districts
  const deferredDistrictQuery = useDeferredValue(districtQuery);
  const tableDistricts = useMemo(() => {
    const q = deferredDistrictQuery.trim().toLowerCase();
    return filteredDistricts.filter(
      (d) => !q || (d.district || '').toLowerCase().includes(q)
    );
  }, [filteredDistricts, deferredDistrictQuery]);

  const {
    paginatedData: pagedDistricts,
    currentPage: currentDistPage,
    pageSize: distPageSize,
    totalItems: totalDistItems,
    setPage: setDistPage,
    setPageSize: setDistPageSize,
  } = usePagination({ data: tableDistricts, initialPageSize: 100 });

  useEffect(() => {
    setDistPage(1);
  }, [districtQuery, selectedDistrict, selectedStatus, setDistPage]);

  // Table search & pagination for Vendors
  const deferredVendorQuery = useDeferredValue(vendorQuery);
  const tableVendors = useMemo(() => {
    const q = deferredVendorQuery.trim().toLowerCase();
    return rawVendors.filter((v) => {
      const vId = String(v.survey_vendor ?? '');
      const vName = String(v.vendor_name ?? `Vendor ${vId}`);
      return !q || vName.toLowerCase().includes(q) || vId.toLowerCase().includes(q);
    });
  }, [rawVendors, deferredVendorQuery]);

  const {
    paginatedData: pagedVendors,
    currentPage: currentVendorPage,
    pageSize: vendorPageSize,
    totalItems: totalVendorItems,
    setPage: setVendorPage,
    setPageSize: setVendorPageSize,
  } = usePagination({ data: tableVendors, initialPageSize: 100 });

  useEffect(() => {
    setVendorPage(1);
  }, [vendorQuery, setVendorPage]);

  // Percentages & Rates
  const pctComplete = pctOf(stats.survey_done, stats.total);
  const pctPending = pctOf(stats.survey_pending, stats.total);
  const pctVerified = pctOf(stats.survey_verify_complete, stats.survey_done || 1);
  const pctAssigned = pctOf(stats.assigned, stats.total || 1);

  // Workflow Milestones
  const milestones = [
    { label: '1. Total Sanctioned Sites', v: stats.total, of: stats.total || 1, color: LIGHT_BLUE },
    { label: '2. Sites Assigned to Surveyors', v: stats.assigned, of: stats.total || 1, color: LIGHT_CYAN },
    { label: '3. Field Surveys Done on Ground', v: stats.survey_done, of: stats.total || 1, color: LIGHT_GREEN },
    { label: '4. Feasibility Audited & Approved', v: stats.survey_verify_complete, of: stats.survey_done || stats.total || 1, color: LIGHT_CYAN },
    { label: '5. Verification Under Audit', v: stats.survey_verify_pending, of: stats.survey_done || stats.total || 1, color: LIGHT_AMBER },
    { label: '6. Sites Flagged / Rework Required', v: stats.survey_verify_reject, of: stats.survey_done || stats.total || 1, color: LIGHT_RED },
  ];

  // Top districts for bar chart
  const chartDistricts = useMemo(
    () => [...filteredDistricts].sort((a, b) => (Number(b.survey_done) || 0) - (Number(a.survey_done) || 0)).slice(0, 15),
    [filteredDistricts]
  );

  // Sparklines datasets
  const totalSpark = filteredDistricts.length > 1 ? filteredDistricts.slice(0, 10).map((d) => Number(d.total) || 0) : undefined;
  const doneSpark = filteredDistricts.length > 1 ? filteredDistricts.slice(0, 10).map((d) => Number(d.survey_done) || 0) : undefined;
  const pendingSpark = filteredDistricts.length > 1 ? filteredDistricts.slice(0, 10).map((d) => Number(d.survey_pending) || 0) : undefined;
  const verifySpark = filteredDistricts.length > 1 ? filteredDistricts.slice(0, 10).map((d) => Number(d.survey_verify_complete) || 0) : undefined;

  // Export Columns definition for District Table
  const districtCols: ExportColumn<GoaSurveyDistrictwiseRow>[] = useMemo(
    () => [
      { header: 'District', accessor: 'district' },
      { header: 'Allocated Sites', accessor: 'total' },
      { header: 'Assigned Sites', accessor: 'assigned' },
      { header: 'Unassigned Sites', accessor: 'not_assigned' },
      { header: 'Survey Done', accessor: 'survey_done' },
      { header: 'Survey Pending', accessor: 'survey_pending' },
      { header: 'Verify Approved', accessor: 'survey_verify_complete' },
      { header: 'Verify Pending', accessor: 'survey_verify_pending' },
      { header: 'Verify Rejected', accessor: 'survey_verify_reject' },
    ],
    []
  );

  // Export Columns definition for Vendor Table
  const vendorCols: ExportColumn<GoaSurveyVendorwiseRow>[] = useMemo(
    () => [
      { header: 'Surveyor Vendor', accessor: (r) => (r.vendor_name ? `${r.vendor_name} (ID: ${r.survey_vendor})` : `Vendor ${r.survey_vendor}`) },
      { header: 'Total Sites', accessor: 'total' },
      { header: 'Assigned Sites', accessor: 'assigned' },
      { header: 'Survey Done', accessor: 'survey_done' },
      { header: 'Survey Pending', accessor: 'survey_pending' },
      { header: 'Verify Approved', accessor: 'survey_verify_complete' },
      { header: 'Verify Pending', accessor: 'survey_verify_pending' },
      { header: 'Verify Rejected', accessor: 'survey_verify_reject' },
    ],
    []
  );

  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = 'Goa_SRT_Survey_Performance';
  const fileTitle = 'Goa SRT District-Wise Survey Performance';

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

      {/* 1. Page Header matching Installation PageHead */}
      <PageHead
        title="Goa SRT Survey Dashboard"
        subtitle={
          <span style={{ display: 'inline-block', fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>
            Goa Solar Rooftop (SRT) Pre-Installation Surveys, Feasibility Audits & Surveyor Allotments
            {updatedAt ? ` · Last updated ${updatedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}` : ''}
          </span>
        }
        breadcrumbs={[
          { label: 'ERP Dashboard', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Goa' },
          { label: 'Survey' },
          { label: 'SRT Survey' },
          { label: 'Dashboard' },
        ]}
        actions={
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill" style={{ fontWeight: 600, paddingInline: 'var(--ax-space-3)' }}>
              <span className="ax-badge__dot" /> State: Goa
            </span>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={loadDashboardData}
              disabled={loading}
              title="Refresh Survey Dashboard"
            >
              ↻ Refresh
            </button>
            <Link to="/vendor-management/goa/srt/survey/assign-view" className="ax-btn ax-btn--secondary ax-btn--sm">
              Assigned Surveys
            </Link>
            <Link to="/vendor-management/goa/srt/survey/verify" className="ax-btn ax-btn--secondary ax-btn--sm">
              Verify Surveys
            </Link>
            <Link to="/vendor-management/goa/srt/survey/status-view" className="ax-btn ax-btn--secondary ax-btn--sm">
              Status Register
            </Link>
            <Link to="/vendor-management/goa/srt/survey/assign" className="ax-btn ax-btn--primary ax-btn--sm">
              <span className="ax-btn__label">+ Assign Survey</span>
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

        {/* 2. Operations Filter Bar matching Goa Installation Filter Bar */}
        <section
          className="ax-card ax-card--flat ax-col--12"
          role="region"
          aria-label="Goa SRT Survey Dashboard Filters"
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
                <label htmlFor="goa-survey-district-select" style={labelStyle}>District / Taluka:</label>
                <select
                  id="goa-survey-district-select"
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
                <label htmlFor="goa-survey-status-select" style={labelStyle}>Status:</label>
                <select
                  id="goa-survey-status-select"
                  className="ax-input ax-input--sm"
                  style={{ height: 30, fontSize: 'var(--ax-text-xs)', paddingInline: '8px' }}
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="All">All Operations</option>
                  <option value="Done">Survey Done</option>
                  <option value="Pending">Pending Survey</option>
                  <option value="VerifyApproved">Verify Approved</option>
                  <option value="VerifyPending">Verification Pending</option>
                  <option value="VerifyReject">Verification Rejected</option>
                  <option value="Assigned">Assigned Sites</option>
                  <option value="NotAssigned">Unassigned Sites</option>
                </select>
              </div>

              {filtersActive && (
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--sm"
                  style={{ height: 28, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }}
                  onClick={() => { setSelectedDistrict('All'); setSelectedStatus('All'); setDistrictQuery(''); setVendorQuery(''); }}
                >
                  Reset Filters
                </button>
              )}
            </div>

            <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>
                Showing <b style={{ color: 'var(--ax-text-strong)' }}>{num(stats.total)}</b> Total Sites across <b style={{ color: 'var(--ax-text-strong)' }}>{filteredDistricts.length}</b> {filteredDistricts.length === 1 ? 'District' : 'Districts'}
              </span>
            </div>
          </div>

          {/* Quick Filter Status Tabs */}
          <div className="ax-cluster ax-quick-filter-strip" style={{ gap: 6, flexWrap: 'wrap', width: '100%', marginTop: 8, paddingTop: 8, borderTop: '1px dashed var(--ax-border, #e2e8f0)' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ax-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Quick Filter:</span>
            {[
              { key: 'All', label: 'All Operations' },
              { key: 'Done', label: 'Survey Done' },
              { key: 'Pending', label: 'Pending Survey' },
              { key: 'VerifyApproved', label: 'Verify Approved' },
              { key: 'VerifyPending', label: 'In Audit' },
              { key: 'Assigned', label: 'Assigned' },
              { key: 'NotAssigned', label: 'Unassigned' },
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

        {/* 3. Executive Welcome Banner matching Installation Welcome Banner */}
        <section className="ax-card ax-welcome ax-col--12" role="region" aria-label="Goa SRT Survey Operations Overview">
          <div className="ax-welcome__body">
            <div className="ax-welcome__text">
              <p className="ax-welcome__eyebrow">Goa Solar Energy Development Agency (GEDA)</p>
              <h2 className="ax-card__title">Welcome to Goa SRT Survey Operations Dashboard</h2>
              <p className="ax-welcome__lede">
                {selectedDistrict !== 'All' ? (
                  <>
                    Goa rooftop solar feasibility survey overview for <b>{selectedDistrict}</b>: <b>{num(stats.total)} rooftop sites</b> allocated.
                    <b> {num(stats.survey_done)} ({pctComplete}%)</b> surveys completed, with <b>{num(stats.survey_verify_complete)}</b> technical feasibility audits approved, and <b>{num(stats.assigned)} ({pctAssigned}%)</b> allotted to surveyors.
                  </>
                ) : (
                  <>
                    Goa rooftop solar feasibility survey overview: <b>{num(stats.total)} rooftop sites</b> allocated across <b>{districtOptions.length} districts / talukas</b>.
                    <b> {num(stats.survey_done)} ({pctComplete}%)</b> surveys completed, with <b>{num(stats.survey_verify_complete)}</b> technical feasibility audits approved, and <b>{num(stats.assigned)} ({pctAssigned}%)</b> allotted to surveyors.
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
                  {selectedDistrict !== 'All' ? 'Active Filter Scope' : 'Goa Operational Scope'}
                </small>
              </div>
              <div className="ax-welcome__stat">
                <dt>Allocated Sites</dt>
                <dd className="ax-num">{num(stats.total)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--asw-primary)' }}>Total Beneficiaries</small>
              </div>
              <div className="ax-welcome__stat">
                <dt>Surveys Done</dt>
                <dd className="ax-num">{num(stats.survey_done)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-emerald, #10b981)' }}>{pctComplete}% Complete</small>
              </div>
              <div className="ax-welcome__stat">
                <dt>Verify Approved</dt>
                <dd className="ax-num">{num(stats.survey_verify_complete)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-amber, #f59e0b)' }}>{num(stats.survey_verify_pending)} In Audit</small>
              </div>
            </dl>
          </div>
        </section>

        {/* 4. Core KPI Cards (interactive with sparklines) matching Installation */}
        <KpiCard
          icon={I_PIN}
          tone="accent"
          label="Total Survey Sites"
          value={num(stats.total)}
          unit="Sites"
          sub="Sanctioned survey allocations"
          spark={totalSpark}
          onClick={() => openDrillDown('total-site', selectedDistrict)}
        />

        <KpiCard
          icon={I_DONE}
          tone="emerald"
          label="Surveys Completed"
          value={num(stats.survey_done)}
          unit="Sites"
          sub="Feasibility reports uploaded"
          badge={`${pctComplete}%`}
          spark={doneSpark}
          onClick={() => openDrillDown('survey-done', selectedDistrict)}
        />

        <KpiCard
          icon={I_CLOCK}
          tone="amber"
          label="Pending Survey"
          value={num(stats.survey_pending)}
          unit="Sites"
          sub="Awaiting field visit"
          badge={`${pctPending}%`}
          spark={pendingSpark}
          onClick={() => openDrillDown('survey-pending', selectedDistrict)}
        />

        <KpiCard
          icon={I_SHIELD}
          tone="cyan"
          label="Verify Approved"
          value={num(stats.survey_verify_complete)}
          unit="Sites"
          sub={`${num(stats.survey_verify_pending)} Audit in progress`}
          badge={`${pctVerified}%`}
          spark={verifySpark}
          onClick={() => openDrillDown('verify-done', selectedDistrict)}
        />

        <KpiCard
          icon={I_CLOCK}
          tone="amber"
          label="Verification Pending"
          value={num(stats.survey_verify_pending)}
          unit="Sites"
          sub="Field feasibility awaiting review"
          onClick={() => openDrillDown('verify-pending', selectedDistrict)}
        />

        <KpiCard
          icon={I_X}
          tone="red"
          label="Verification Rejected"
          value={num(stats.survey_verify_reject)}
          unit="Sites"
          sub="Requires surveyor rework"
          onClick={() => openDrillDown('verify-reject', selectedDistrict)}
        />

        <KpiCard
          icon={I_USER}
          tone="violet"
          label="Assigned to Surveyors"
          value={num(stats.assigned)}
          unit="Sites"
          sub={`${pctAssigned}% of total allocated`}
          badge={`${pctAssigned}%`}
          onClick={() => openDrillDown('assigned', selectedDistrict)}
        />

        <KpiCard
          icon={I_BOLT}
          tone="cyan"
          label="Unassigned Sites"
          value={num(stats.not_assigned)}
          unit="Sites"
          sub="Pending surveyor assignment"
          onClick={() => openDrillDown('not-assigned', selectedDistrict)}
        />

        {/* 5. Operational Highlights & Execution Charts Row */}
        <section className="ax-card ax-col--8" role="region" aria-label="District-Wise Survey Execution">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h3 className="ax-card__title">District-Wise Survey Performance</h3>
              <p className="ax-card__subtitle">Comparison of Total Allocated vs Surveys Done vs Surveys Pending</p>
            </div>
            <div className="ax-card__actions">
              <span className="ax-badge ax-badge--soft ax-badge--info" style={{ fontSize: 11 }}>
                Top {chartDistricts.length} Districts
              </span>
            </div>
          </div>
          <div style={{ padding: '12px 16px', minHeight: chartH }}>
            {chartDistricts.length > 0 ? (
              <Suspense fallback={<div style={{ height: chartH }} />}>
                <ApexChart
                  type="bar"
                  height={chartH}
                  series={[
                    { name: 'Total Sites', data: chartDistricts.map((d) => Number(d.total) || 0) },
                    { name: 'Survey Done', data: chartDistricts.map((d) => Number(d.survey_done) || 0) },
                    { name: 'Survey Pending', data: chartDistricts.map((d) => Number(d.survey_pending) || 0) },
                  ]}
                  apex={{
                    colors: [LIGHT_BLUE, LIGHT_GREEN, LIGHT_AMBER],
                    plotOptions: {
                      bar: {
                        horizontal: false,
                        columnWidth: '55%',
                        borderRadius: 3,
                      },
                    },
                    xaxis: {
                      categories: chartDistricts.map((d) => d.district || 'Unknown'),
                      labels: { rotate: -25, style: { fontSize: '11px' } },
                    },
                    yaxis: { forceNiceScale: true },
                    legend: { position: 'top', horizontalAlign: 'right' },
                    dataLabels: { enabled: false },
                  }}
                />
              </Suspense>
            ) : (
              <div style={{ height: chartH, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ax-text-muted)' }}>
                No district records available for chart rendering.
              </div>
            )}
          </div>
        </section>

        <section className="ax-card ax-col--4" role="region" aria-label="Survey Execution Distribution">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h3 className="ax-card__title">Survey Execution Distribution</h3>
              <p className="ax-card__subtitle">Status breakdown across active filter scope</p>
            </div>
          </div>
          <div style={{ padding: '16px', minHeight: donutH, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {stats.total > 0 ? (
              <Suspense fallback={<div style={{ height: donutH }} />}>
                <ApexChart
                  type="donut"
                  height={donutH}
                  series={[
                    stats.survey_done,
                    stats.survey_pending,
                    stats.survey_verify_complete,
                    stats.survey_verify_pending,
                    stats.survey_verify_reject,
                  ]}
                  apex={{
                    labels: ['Survey Done', 'Survey Pending', 'Verify Approved', 'Verify Pending', 'Verify Rejected'],
                    colors: [LIGHT_GREEN, LIGHT_AMBER, LIGHT_CYAN, LIGHT_VIOLET, LIGHT_RED],
                    legend: { position: 'bottom', fontSize: '11px' },
                    dataLabels: { enabled: false },
                    plotOptions: {
                      pie: {
                        donut: {
                          size: '68%',
                          labels: {
                            show: true,
                            total: {
                              show: true,
                              label: 'Total Sites',
                              formatter: () => num(stats.total),
                            },
                          },
                        },
                      },
                    },
                  }}
                />
              </Suspense>
            ) : (
              <div style={{ height: donutH, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ax-text-muted)' }}>
                No survey distribution data available.
              </div>
            )}
          </div>
        </section>

        {/* 6. Milestones Lifecycle Card matching Goa Installation Workflow Milestones */}
        <section className="ax-card ax-col--12" role="region" aria-label="Survey Workflow Lifecycle">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h3 className="ax-card__title">Goa SRT Survey Lifecycle Progress</h3>
              <p className="ax-card__subtitle">Progressive throughput from site allocation to engineering audit handoff</p>
            </div>
          </div>
          <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            {milestones.map((m, idx) => {
              const pct = pctOf(m.v, m.of);
              return (
                <div key={idx} style={{ padding: '12px 14px', borderRadius: '10px', background: 'var(--ax-surface-subtle, #f8fafc)', border: '1px solid var(--ax-border, #e2e8f0)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ax-text-strong)' }}>{m.label}</span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: m.color }}>{num(m.v)}</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: '#e2e8f0', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: m.color, borderRadius: 3, transition: 'width 0.3s ease' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                    <small style={{ fontSize: '10.5px', color: 'var(--ax-text-muted)' }}>{pct}%</small>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 7. District Summary Table Card matching Installation District Table */}
        <section className="ax-card ax-col--12" role="region" aria-label="District Performance Summary">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">District-Wise Survey Performance</h2>
              <p className="ax-card__subtitle">
                Showing {tableDistricts.length} districts in Goa · Click numbers to view categorized records
              </p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                <SearchInput
                  value={districtQuery}
                  onChange={setDistrictQuery}
                  placeholder="Search district…"
                  size="sm"
                  ariaLabel="Search district table"
                />
                <TableExportToolbar
                  onCopy={() => copyToClipboard(tableDistricts, districtCols)}
                  onExportCSV={() => exportToCSV(tableDistricts, districtCols, `${fileBase}_District_${stamp}`)}
                  onExportExcel={() => exportToExcel(tableDistricts, districtCols, `${fileBase}_District_${stamp}`)}
                  onExportPDF={() => exportToPDF(tableDistricts, districtCols, fileTitle)}
                />
              </div>
            </div>
          </div>

          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover">
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th">District</th>
                  <th className="ax-table__th ax-table__th--num">Total Sites</th>
                  <th className="ax-table__th ax-table__th--num">Assigned</th>
                  <th className="ax-table__th ax-table__th--num">Unassigned</th>
                  <th className="ax-table__th ax-table__th--num">Survey Done</th>
                  <th className="ax-table__th ax-table__th--num">Survey Pending</th>
                  <th className="ax-table__th ax-table__th--num">Verify Approved</th>
                  <th className="ax-table__th ax-table__th--num">Verify Pending</th>
                  <th className="ax-table__th ax-table__th--num">Verify Rejected</th>
                  <th className="ax-table__th ax-table__th--num">Completion Rate</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', padding: '36px' }}>
                      <span className="ax-spinner" /> Loading district performance…
                    </td>
                  </tr>
                ) : pagedDistricts.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ padding: 0 }}>
                      <TableEmptyState
                        title="No District Records"
                        message="No districts match your filter or search query."
                      />
                    </td>
                  </tr>
                ) : (
                  pagedDistricts.map((d: any) => {
                    const doneRate = pctOf(d.survey_done, d.total);
                    return (
                      <tr key={d.district} className="ax-table__row">
                        <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                          {d.district}
                        </td>
                        <td className="ax-table__td ax-table__td--num">
                          <button
                            type="button"
                            className="ax-btn ax-btn--ghost ax-btn--xs"
                            onClick={() => openDrillDown('total-site', d.district)}
                            style={{ fontWeight: 700, color: LIGHT_BLUE }}
                          >
                            {num(d.total)}
                          </button>
                        </td>
                        <td className="ax-table__td ax-table__td--num">
                          <button
                            type="button"
                            className="ax-btn ax-btn--ghost ax-btn--xs"
                            onClick={() => openDrillDown('assigned', d.district)}
                            style={{ color: LIGHT_VIOLET }}
                          >
                            {num(d.assigned)}
                          </button>
                        </td>
                        <td className="ax-table__td ax-table__td--num">
                          <button
                            type="button"
                            className="ax-btn ax-btn--ghost ax-btn--xs"
                            onClick={() => openDrillDown('not-assigned', d.district)}
                            style={{ color: LIGHT_AMBER }}
                          >
                            {num(d.not_assigned)}
                          </button>
                        </td>
                        <td className="ax-table__td ax-table__td--num">
                          <button
                            type="button"
                            className="ax-btn ax-btn--ghost ax-btn--xs"
                            onClick={() => openDrillDown('survey-done', d.district)}
                            style={{ fontWeight: 700, color: LIGHT_GREEN }}
                          >
                            {num(d.survey_done)}
                          </button>
                        </td>
                        <td className="ax-table__td ax-table__td--num">
                          <button
                            type="button"
                            className="ax-btn ax-btn--ghost ax-btn--xs"
                            onClick={() => openDrillDown('survey-pending', d.district)}
                            style={{ color: LIGHT_AMBER }}
                          >
                            {num(d.survey_pending)}
                          </button>
                        </td>
                        <td className="ax-table__td ax-table__td--num">
                          <button
                            type="button"
                            className="ax-btn ax-btn--ghost ax-btn--xs"
                            onClick={() => openDrillDown('verify-done', d.district)}
                            style={{ fontWeight: 700, color: LIGHT_CYAN }}
                          >
                            {num(d.survey_verify_complete)}
                          </button>
                        </td>
                        <td className="ax-table__td ax-table__td--num">
                          <button
                            type="button"
                            className="ax-btn ax-btn--ghost ax-btn--xs"
                            onClick={() => openDrillDown('verify-pending', d.district)}
                            style={{ color: LIGHT_AMBER }}
                          >
                            {num(d.survey_verify_pending)}
                          </button>
                        </td>
                        <td className="ax-table__td ax-table__td--num">
                          <button
                            type="button"
                            className="ax-btn ax-btn--ghost ax-btn--xs"
                            onClick={() => openDrillDown('verify-reject', d.district)}
                            style={{ color: LIGHT_RED }}
                          >
                            {num(d.survey_verify_reject)}
                          </button>
                        </td>
                        <td className="ax-table__td ax-table__td--num">
                          <span className="ax-badge ax-badge--soft ax-badge--success" style={{ fontWeight: 700 }}>
                            {doneRate}%
                          </span>
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
                currentPage={currentDistPage}
                totalItems={totalDistItems}
                pageSize={distPageSize}
                onPageChange={setDistPage}
                onPageSizeChange={setDistPageSize}
                pageSizeOptions={[10, 25, 50, 100]}
              />
            </div>
          </div>
        </section>

        {/* 8. Vendor Performance Table Card matching Installation Vendor Table */}
        <section className="ax-card ax-col--12" role="region" aria-label="Vendor Allotment & Field Audit Overview">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">Surveyor Vendor Allotment & Field Audit Overview</h2>
              <p className="ax-card__subtitle">
                Showing {tableVendors.length} vendors in Goa · Click numbers to view categorized records
              </p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                <SearchInput
                  value={vendorQuery}
                  onChange={setVendorQuery}
                  placeholder="Search vendor…"
                  size="sm"
                  ariaLabel="Search vendor table"
                />
                <TableExportToolbar
                  onCopy={() => copyToClipboard(tableVendors, vendorCols)}
                  onExportCSV={() => exportToCSV(tableVendors, vendorCols, `${fileBase}_Vendor_${stamp}`)}
                  onExportExcel={() => exportToExcel(tableVendors, vendorCols, `${fileBase}_Vendor_${stamp}`)}
                  onExportPDF={() => exportToPDF(tableVendors, vendorCols, 'Goa SRT Surveyor Vendor Performance')}
                />
              </div>
            </div>
          </div>

          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover">
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th">Surveyor Vendor</th>
                  <th className="ax-table__th ax-table__th--num">Total Sites</th>
                  <th className="ax-table__th ax-table__th--num">Assigned</th>
                  <th className="ax-table__th ax-table__th--num">Unassigned</th>
                  <th className="ax-table__th ax-table__th--num">Survey Done</th>
                  <th className="ax-table__th ax-table__th--num">Survey Pending</th>
                  <th className="ax-table__th ax-table__th--num">Verify Approved</th>
                  <th className="ax-table__th ax-table__th--num">Verify Pending</th>
                  <th className="ax-table__th ax-table__th--num">Verify Rejected</th>
                  <th className="ax-table__th ax-table__th--num">Done Rate</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', padding: '36px' }}>
                      <span className="ax-spinner" /> Loading vendor allotments…
                    </td>
                  </tr>
                ) : pagedVendors.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ padding: 0 }}>
                      <TableEmptyState
                        title="No Vendor Records"
                        message="No surveyor vendors match your search criteria."
                      />
                    </td>
                  </tr>
                ) : (
                  pagedVendors.map((v: any) => {
                    const vName = v.vendor_name || `Vendor ${v.survey_vendor}`;
                    const doneRate = pctOf(v.survey_done, v.total);
                    return (
                      <tr key={String(v.survey_vendor)} className="ax-table__row">
                        <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                          {vName}
                        </td>
                        <td className="ax-table__td ax-table__td--num">
                          <button
                            type="button"
                            className="ax-btn ax-btn--ghost ax-btn--xs"
                            onClick={() => openDrillDown('total-site', undefined, v.survey_vendor)}
                            style={{ fontWeight: 700, color: LIGHT_BLUE }}
                          >
                            {num(v.total)}
                          </button>
                        </td>
                        <td className="ax-table__td ax-table__td--num">
                          <button
                            type="button"
                            className="ax-btn ax-btn--ghost ax-btn--xs"
                            onClick={() => openDrillDown('assigned', undefined, v.survey_vendor)}
                            style={{ color: LIGHT_VIOLET }}
                          >
                            {num(v.assigned)}
                          </button>
                        </td>
                        <td className="ax-table__td ax-table__td--num">
                          <button
                            type="button"
                            className="ax-btn ax-btn--ghost ax-btn--xs"
                            onClick={() => openDrillDown('not-assigned', undefined, v.survey_vendor)}
                            style={{ color: LIGHT_AMBER }}
                          >
                            {num(v.not_assigned)}
                          </button>
                        </td>
                        <td className="ax-table__td ax-table__td--num">
                          <button
                            type="button"
                            className="ax-btn ax-btn--ghost ax-btn--xs"
                            onClick={() => openDrillDown('survey-done', undefined, v.survey_vendor)}
                            style={{ fontWeight: 700, color: LIGHT_GREEN }}
                          >
                            {num(v.survey_done)}
                          </button>
                        </td>
                        <td className="ax-table__td ax-table__td--num">
                          <button
                            type="button"
                            className="ax-btn ax-btn--ghost ax-btn--xs"
                            onClick={() => openDrillDown('survey-pending', undefined, v.survey_vendor)}
                            style={{ color: LIGHT_AMBER }}
                          >
                            {num(v.survey_pending)}
                          </button>
                        </td>
                        <td className="ax-table__td ax-table__td--num">
                          <button
                            type="button"
                            className="ax-btn ax-btn--ghost ax-btn--xs"
                            onClick={() => openDrillDown('verify-done', undefined, v.survey_vendor)}
                            style={{ fontWeight: 700, color: LIGHT_CYAN }}
                          >
                            {num(v.survey_verify_complete)}
                          </button>
                        </td>
                        <td className="ax-table__td ax-table__td--num">
                          <button
                            type="button"
                            className="ax-btn ax-btn--ghost ax-btn--xs"
                            onClick={() => openDrillDown('verify-pending', undefined, v.survey_vendor)}
                            style={{ color: LIGHT_AMBER }}
                          >
                            {num(v.survey_verify_pending)}
                          </button>
                        </td>
                        <td className="ax-table__td ax-table__td--num">
                          <button
                            type="button"
                            className="ax-btn ax-btn--ghost ax-btn--xs"
                            onClick={() => openDrillDown('verify-reject', undefined, v.survey_vendor)}
                            style={{ color: LIGHT_RED }}
                          >
                            {num(v.survey_verify_reject)}
                          </button>
                        </td>
                        <td className="ax-table__td ax-table__td--num">
                          <span className="ax-badge ax-badge--soft ax-badge--success" style={{ fontWeight: 700 }}>
                            {doneRate}%
                          </span>
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
                currentPage={currentVendorPage}
                totalItems={totalVendorItems}
                pageSize={vendorPageSize}
                onPageChange={setVendorPage}
                onPageSizeChange={setVendorPageSize}
                pageSizeOptions={[10, 25, 50, 100]}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
