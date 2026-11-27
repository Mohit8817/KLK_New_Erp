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
  upRescoSurveyAdminService,
  type UpRescoSurveyDashboardData,
  type UpVendorItem,
} from '../../up-services';
import { normalizeUpSurveyStatus } from './UPRescoSurveyStatusView';

// Code-split ApexCharts so UP Resco Survey Dashboard shell renders instantly
const ApexChart = lazy(() => import('../../../../charts/ApexChart').then((m) => ({ default: m.ApexChart })));

// Palette constants matching DLE & Solar ERP design language
const LIGHT_BLUE = '#2563eb';
const LIGHT_GREEN = '#10b981';
const LIGHT_CYAN = '#0891b2';
const LIGHT_AMBER = '#f59e0b';
const LIGHT_RED = '#ef4444';

const num = (x: number | string | undefined | null) => {
  const n = Number(x);
  return isNaN(n) ? '0' : n.toLocaleString('en-IN');
};

const pctOf = (a: number | string | undefined | null, b: number | string | undefined | null) => {
  const numA = Number(a) || 0;
  const numB = Number(b) || 0;
  return numB ? Math.round((numA / numB) * 1000) / 10 : 0;
};

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

/* ───────── Responsive page CSS (Exact DLE Dashboard & Solar ERP reference, all columns scrollable) ───────── */
const PAGE_CSS = `
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
  .solar-erp-page .ax-table { min-width: 900px; }
  .solar-erp-page .ax-welcome__lede { max-width: 860px; }

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
const I_DONE = svg(<><path d="M7 12l5 5l10 -10" /><path d="M2 12l5 5m5 -5l5 -5" /></>);
const I_CLOCK = svg(<><path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M12 7v5l3 3" /></>);
const I_SHIELD = svg(<><path d="M12 3a12 12 0 0 0 8.5 3a12 12 0 0 1 -8.5 15a12 12 0 0 1 -8.5 -15a12 12 0 0 0 8.5 -3" /><path d="M9 12l2 2l4 -4" /></>);
const I_X = svg(<><path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M10 10l4 4m0 -4l-4 4" /></>);
const I_USER = svg(<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>);
const I_DOC = svg(<><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" /><path d="M9 9l1 0" /><path d="M9 13l6 0" /><path d="M9 17l6 0" /></>);
const ICON_FILTER = (
  <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 4h16v2.172a2 2 0 0 1 -.586 1.414l-4.828 4.828v7.586l-4 -2v-5.586l-4.828 -4.828a2 2 0 0 1 -.586 -1.414v-2.172z" /></svg>
);

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

export interface DistrictSurveyRow {
  district: string;
  total: number;
  assigned: number;
  not_assigned: number;
  survey_done: number;
  survey_pending: number;
  survey_verify_pending: number;
  survey_verify_complete: number;
  survey_verify_reject: number;
}

export interface VendorSurveyRow {
  survey_vendor: string | number;
  vendor_name?: string;
  assigned: number;
  not_assigned: number;
  survey_done: number;
  survey_pending: number;
  survey_verify_pending: number;
  survey_verify_complete: number;
  survey_verify_reject: number;
}

export function UPRescoSurveyDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<UpRescoSurveyDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  // Vendor master metadata
  const [vendorsList, setVendorsList] = useState<UpVendorItem[]>([]);

  // Filter states
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [tableQuery, setTableQuery] = useState<string>('');
  const [vendorQuery, setVendorQuery] = useState<string>('');

  // Chart heights
  const chartH = useChartHeight(320, 260);
  const donutH = useChartHeight(230, 210);

  // Load Dashboard Data (API 10: GET /up/resco/survey/dashboard) + Vendors
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const [res, formRes] = await Promise.allSettled([
        upRescoSurveyAdminService.getDashboard(),
        upRescoSurveyAdminService.getAssignFormData(),
      ]);

      if (res.status === 'fulfilled') {
        setData(res.value);
        setUpdatedAt(new Date());
      } else {
        throw res.reason;
      }

      if (formRes.status === 'fulfilled' && Array.isArray(formRes.value?.vendors)) {
        setVendorsList(formRes.value.vendors);
      }
    } catch (err: any) {
      console.error('UP Resco Survey Dashboard fetch error:', err);
      setApiError(err?.message || 'Failed to fetch dynamic survey dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Vendor Lookup Map
  const vendorMap = useMemo(() => {
    const map = new Map<string, string>();
    vendorsList.forEach((v) => {
      map.set(String(v.id), v.name);
    });
    return map;
  }, [vendorsList]);

  const getVendorName = useCallback(
    (vendorId: string | number) => {
      const key = String(vendorId ?? '');
      return vendorMap.get(key) || `Vendor #${key}`;
    },
    [vendorMap]
  );

  // ── Status Drill-down Navigation to Status View ──
  const openDrillDown = (statusKey: string, district?: string, vendor?: string | number) => {
    const normalizedStatus = normalizeUpSurveyStatus(statusKey);
    const targetDistrict =
      district && district !== 'All' ? district : selectedDistrict !== 'All' ? selectedDistrict : undefined;
    const params = new URLSearchParams();
    params.set('status', normalizedStatus);
    if (targetDistrict) {
      params.set('district', targetDistrict);
    }
    if (vendor) {
      params.set('vendor', String(vendor));
    }
    navigate(`/vendor-management/up/resco/survey/status-view?${params.toString()}`);
  };

  const districtwise: DistrictSurveyRow[] = useMemo(() => (data?.districtwise || []) as DistrictSurveyRow[], [data]);
  const vendorwises: VendorSurveyRow[] = useMemo(() => (data?.vendor_wises || []) as VendorSurveyRow[], [data]);

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
      if (selectedStatus === 'Done') matchStatus = (d.survey_done || 0) > 0;
      else if (selectedStatus === 'Pending') matchStatus = (d.survey_pending || 0) > 0;
      else if (selectedStatus === 'Assigned') matchStatus = (d.assigned || 0) > 0;
      else if (selectedStatus === 'NotAssigned') matchStatus = (d.not_assigned || 0) > 0;
      else if (selectedStatus === 'VerifyApproved') matchStatus = (d.survey_verify_complete || 0) > 0;
      else if (selectedStatus === 'VerifyPending') matchStatus = (d.survey_verify_pending || 0) > 0;
      else if (selectedStatus === 'VerifyReject') matchStatus = (d.survey_verify_reject || 0) > 0;
      return matchDistrict && matchStatus;
    });
  }, [districtwise, selectedDistrict, selectedStatus]);

  const rawDetail = useMemo(
    () =>
      data?.survey_detail || {
        total: 0,
        assigned: 0,
        not_assigned: 0,
        survey_done: 0,
        survey_pending: 0,
        survey_verify_pending: 0,
        survey_verify_complete: 0,
        survey_verify_reject: 0,
      },
    [data]
  );

  // Dynamic metrics: aggregates from filteredDistricts when any filter is selected
  const detail = useMemo(() => {
    if (selectedDistrict === 'All' && selectedStatus === 'All') {
      return rawDetail;
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
      (acc, d) => ({
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
  }, [rawDetail, filteredDistricts, selectedDistrict, selectedStatus]);

  const filtersActive = selectedDistrict !== 'All' || selectedStatus !== 'All';

  // Table search & pagination for Districts
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
  } = usePagination({ data: tableDistricts, initialPageSize: 100 });

  useEffect(() => {
    setPage(1);
  }, [tableQuery, selectedDistrict, selectedStatus, setPage]);

  // Table search & pagination for Vendors
  const deferredVendorQuery = useDeferredValue(vendorQuery);
  const tableVendors = useMemo(() => {
    const q = deferredVendorQuery.trim().toLowerCase();
    return vendorwises.filter((v) => {
      if (!q) return true;
      const vName = (v.vendor_name || getVendorName(v.survey_vendor)).toLowerCase();
      const vId = String(v.survey_vendor || '').toLowerCase();
      return vName.includes(q) || vId.includes(q);
    });
  }, [vendorwises, deferredVendorQuery, getVendorName]);

  const {
    paginatedData: pagedVendors,
    currentPage: currentVendorPage,
    pageSize: vendorPageSize,
    totalItems: totalVendorItems,
    setPage: setVendorPage,
    setPageSize: setVendorPageSize,
  } = usePagination({ data: tableVendors, initialPageSize: 10 });

  useEffect(() => {
    setVendorPage(1);
  }, [vendorQuery, setVendorPage]);

  // Percentages & Rates
  const pctDone = pctOf(detail.survey_done, detail.total);
  const pctPending = pctOf(detail.survey_pending, detail.total);
  const pctAssigned = pctOf(detail.assigned, detail.total);
  const pctVerifyApproved = pctOf(detail.survey_verify_complete, detail.survey_done || 1);

  // Workflow Milestones
  const milestones = [
    { label: '1. Sanctioned Rooftop Solar Sites', v: detail.total, of: detail.total || 1, color: LIGHT_BLUE },
    { label: '2. Allotted to Survey Vendors', v: detail.assigned, of: detail.total || 1, color: LIGHT_CYAN },
    { label: '3. Feasibility Survey Completed', v: detail.survey_done, of: detail.total || 1, color: LIGHT_GREEN },
    { label: '4. Engineering Verification Approved', v: detail.survey_verify_complete, of: detail.survey_done || detail.total || 1, color: LIGHT_AMBER },
  ];

  // Top districts for bar chart
  const chartDistricts = useMemo(
    () => [...filteredDistricts].sort((a, b) => (Number(b.survey_done) || 0) - (Number(a.survey_done) || 0)).slice(0, 15),
    [filteredDistricts]
  );

  // Sparklines datasets
  const totalSpark = filteredDistricts.length > 1 ? filteredDistricts.slice(0, 10).map((d) => d.total || 0) : undefined;
  const doneSpark = filteredDistricts.length > 1 ? filteredDistricts.slice(0, 10).map((d) => d.survey_done || 0) : undefined;
  const pendingSpark = filteredDistricts.length > 1 ? filteredDistricts.slice(0, 10).map((d) => d.survey_pending || 0) : undefined;
  const verifySpark = filteredDistricts.length > 1 ? filteredDistricts.slice(0, 10).map((d) => d.survey_verify_complete || 0) : undefined;

  // Export Columns definition for District Table
  const districtCols: ExportColumn<DistrictSurveyRow>[] = useMemo(
    () => [
      { header: 'District', accessor: 'district' },
      { header: 'Sanctioned Sites', accessor: 'total' },
      { header: 'Assigned Sites', accessor: 'assigned' },
      { header: 'Unassigned', accessor: 'not_assigned' },
      { header: 'Survey Done', accessor: 'survey_done' },
      { header: 'Survey Pending', accessor: 'survey_pending' },
      { header: 'Verify Approved', accessor: 'survey_verify_complete' },
      { header: 'Verify Pending', accessor: 'survey_verify_pending' },
      { header: 'Verify Rejected', accessor: 'survey_verify_reject' },
    ],
    []
  );

  // Export Columns definition for Vendor Performance Table
  const vendorCols: ExportColumn<VendorSurveyRow>[] = useMemo(
    () => [
      { header: 'Vendor Name', accessor: (v) => v.vendor_name || getVendorName(v.survey_vendor) },
      { header: 'Vendor ID', accessor: 'survey_vendor' },
      { header: 'Assigned Sites', accessor: 'assigned' },
      { header: 'Survey Done', accessor: 'survey_done' },
      { header: 'Survey Pending', accessor: 'survey_pending' },
      { header: 'Verify Approved', accessor: 'survey_verify_complete' },
      { header: 'Verify Pending', accessor: 'survey_verify_pending' },
      { header: 'Verify Rejected', accessor: 'survey_verify_reject' },
    ],
    [getVendorName]
  );

  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = 'UP_Resco_Survey_District_Overview';
  const fileTitle = 'UP Resco Survey District-Wise Performance';

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

  const copyToClipboard = async <T,>(list: T[], columns: ExportColumn<T>[], msg = 'Data copied to clipboard!') => {
    if (!list.length || !columns.length) return;
    const t = [
      columns.map((c) => c.header).join('\t'),
      ...list.map((row) => columns.map((c) => escapeExportValue(getExportValue(row, c))).join('\t')),
    ].join('\n');
    try {
      await navigator.clipboard.writeText(t);
      alert(msg);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = t;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      alert(msg);
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
        title="UP Resco Survey Dashboard"
        subtitle={
          <span style={{ display: 'inline-block', fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>
            Uttar Pradesh Resco Rooftop Solar Pre-Installation Surveys, District Analysis & Surveyor Throughput
            {updatedAt ? ` · Last updated ${updatedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}` : ''}
          </span>
        }
        breadcrumbs={[
          { label: 'ERP Dashboard', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Uttar Pradesh', href: '/vendor-management/up' },
          { label: 'Survey' },
          { label: 'Resco Survey' },
          { label: 'Dashboard' },
        ]}
        actions={
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill" style={{ fontWeight: 600, paddingInline: 'var(--ax-space-3)' }}>
              <span className="ax-badge__dot" /> State: Uttar Pradesh
            </span>
            <Link to="/vendor-management/up/resco/survey/status-view?status=survey-done" className="ax-btn ax-btn--primary ax-btn--sm">
              Status Register
            </Link>
            <Link to="/vendor-management/up/resco/survey/assign" className="ax-btn ax-btn--primary ax-btn--sm">
              + Assign Survey
            </Link>
            <Link to="/vendor-management/up/resco/survey/assign-view" className="ax-btn ax-btn--primary ax-btn--sm">
              View Assigned
            </Link>
            <Link to="/vendor-management/up/resco/survey/verify" className="ax-btn ax-btn--primary ax-btn--sm">
              Verify Surveys ↗
            </Link>
          </div>
        }
      />

      <div className="ax-dash-grid mt-0 pt-0">
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
            <b>Error loading survey dashboard data:</b> {apiError}
          </div>
        )}

        {/* 2. Operations Filter Bar */}
        <section
          className="ax-card ax-card--flat ax-col--12"
          role="region"
          aria-label="UP Resco Survey Dashboard Filters"
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
                <label htmlFor="asw-status-select" style={labelStyle}>Status:</label>
                <select
                  id="asw-status-select"
                  className="ax-input ax-input--sm"
                  style={{ height: 30, fontSize: 'var(--ax-text-xs)', paddingInline: '8px' }}
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="All">All Operations</option>
                  <option value="Done">Survey Done</option>
                  <option value="Pending">Survey Pending</option>
                  <option value="Assigned">Assigned to Vendors</option>
                  <option value="NotAssigned">Unassigned Sites</option>
                  <option value="VerifyApproved">Verify Approved</option>
                  <option value="VerifyPending">Verification Pending</option>
                  <option value="VerifyReject">Verification Rejected</option>
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
                Showing <b style={{ color: 'var(--ax-text-strong)' }}>{num(detail.total)}</b> Total Sites across <b style={{ color: 'var(--ax-text-strong)' }}>{filteredDistricts.length}</b> {filteredDistricts.length === 1 ? 'District' : 'Districts'}
              </span>
            </div>
          </div>

          {/* Quick Filter Status Tabs */}
          <div className="ax-cluster" style={{ gap: 6, flexWrap: 'wrap', width: '100%', marginTop: 8, paddingTop: 8, borderTop: '1px dashed var(--ax-border, #e2e8f0)' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ax-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Quick Filter:</span>
            {[
              { key: 'All', label: 'All Operations' },
              { key: 'Done', label: 'Survey Done' },
              { key: 'Pending', label: 'Survey Pending' },
              { key: 'VerifyApproved', label: 'Verify Approved' },
              { key: 'VerifyPending', label: 'In Audit' },
              { key: 'VerifyReject', label: 'Audit Rejected' },
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
        <section className="ax-card ax-welcome ax-col--12" role="region" aria-label="UP Resco Survey Operations Overview">
          <div className="ax-welcome__body">
            <div className="ax-welcome__text">
              <p className="ax-welcome__eyebrow">Uttar Pradesh Resco Rooftop Solar Survey System</p>
              <h2 className="ax-card__title">Welcome to UP Resco Survey Operations Dashboard</h2>
              <p className="ax-welcome__lede">
                {selectedDistrict !== 'All' ? (
                  <>
                    UP Resco rooftop solar survey execution overview for <b>{selectedDistrict}</b>: <b>{num(detail.total)} rooftop sites</b> sanctioned.
                    <b> {num(detail.survey_done)} ({pctDone}%)</b> surveys completed, with <b>{num(detail.survey_verify_complete)}</b> verified approved, and <b>{num(detail.survey_verify_pending)}</b> currently in audit review.
                  </>
                ) : (
                  <>
                    UP Resco rooftop solar survey execution overview: <b>{num(detail.total)} rooftop sites</b> sanctioned across <b>{districtOptions.length} districts</b>.
                    <b> {num(detail.survey_done)} ({pctDone}%)</b> surveys completed, with <b>{num(detail.survey_verify_complete)}</b> verified approved, and <b>{num(detail.survey_verify_pending)}</b> currently in audit review.
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
                  {selectedDistrict !== 'All' ? 'Active Filter Scope' : 'UP Operational Scope'}
                </small>
              </div>
              <div className="ax-welcome__stat">
                <dt>Sanctioned Sites</dt>
                <dd className="ax-num">{num(detail.total)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--asw-primary)' }}>Total Scope</small>
              </div>
              <div className="ax-welcome__stat">
                <dt>Survey Completed</dt>
                <dd className="ax-num">{num(detail.survey_done)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-emerald, #10b981)' }}>{pctDone}% Complete</small>
              </div>
              <div className="ax-welcome__stat">
                <dt>Verify Approved</dt>
                <dd className="ax-num">{num(detail.survey_verify_complete)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-amber, #f59e0b)' }}>{num(detail.survey_verify_pending)} In Audit</small>
              </div>
            </dl>
          </div>
        </section>

        {/* 4. Core 8 KPI Cards */}
        <KpiCard
          icon={I_PIN}
          tone="accent"
          label="Total Survey Sites"
          value={num(detail.total)}
          unit="Sites"
          sub="Sanctioned UP Resco sites"
          spark={totalSpark}
          onClick={() => openDrillDown('all')}
        />

        <KpiCard
          icon={I_DONE}
          tone="emerald"
          label="Survey Completed"
          value={num(detail.survey_done)}
          unit="Sites"
          sub="Feasibility reports submitted"
          badge={`${pctDone}%`}
          spark={doneSpark}
          onClick={() => openDrillDown('survey-done')}
        />

        <KpiCard
          icon={I_CLOCK}
          tone="amber"
          label="Survey Pending"
          value={num(detail.survey_pending)}
          unit="Sites"
          sub="Assigned awaiting site survey"
          badge={`${pctPending}%`}
          spark={pendingSpark}
          onClick={() => openDrillDown('survey-pending')}
        />

        <KpiCard
          icon={I_SHIELD}
          tone="cyan"
          label="Verify Approved"
          value={num(detail.survey_verify_complete)}
          unit="Sites"
          sub={`${num(detail.survey_verify_pending)} Technical audits pending`}
          badge={`${pctVerifyApproved}%`}
          spark={verifySpark}
          onClick={() => openDrillDown('survey-verify-complete')}
        />

        <KpiCard
          icon={I_CLOCK}
          tone="amber"
          label="Verification Pending"
          value={num(detail.survey_verify_pending)}
          unit="Sites"
          sub="Engineering audit pending"
          onClick={() => openDrillDown('survey-verify-pending')}
        />

        <KpiCard
          icon={I_X}
          tone="red"
          label="Verification Rejected"
          value={num(detail.survey_verify_reject)}
          unit="Sites"
          sub="Requires surveyor rework"
          onClick={() => openDrillDown('survey-verify-reject')}
        />

        <KpiCard
          icon={I_USER}
          tone="accent"
          label="Assigned Sites"
          value={num(detail.assigned)}
          unit="Sites"
          sub={`${num(detail.not_assigned)} Unassigned sites`}
          badge={`${pctAssigned}%`}
          spark={totalSpark}
          onClick={() => openDrillDown('assigned')}
        />

        <KpiCard
          icon={I_DOC}
          tone="amber"
          label="Unassigned Sites"
          value={num(detail.not_assigned)}
          unit="Sites"
          sub="Ready for survey allocation"
          badge={`${pctOf(detail.not_assigned, detail.total)}%`}
          onClick={() => openDrillDown('not-assigned')}
        />

        {/* 5. Additional Operational Highlights Card */}
        <section className="ax-card ax-col--12" role="region" aria-label="UP Resco Survey Operational Highlights">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow" style={{ color: 'var(--asw-primary)' }}>State Operations</span>
              <h3 className="ax-card__title">Uttar Pradesh · Resco Rooftop Solar Surveys</h3>
              <p className="ax-card__subtitle">{num(detail.survey_done)} feasibility surveys completed across {districtOptions.length} districts in UP</p>
            </div>
            <Link to="/vendor-management/up/resco/survey/verify" className="ax-btn ax-btn--sm ax-btn--primary">
              Review Survey Audits →
            </Link>
          </div>
          <div className="ax-card__body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-3)' }}>
            <div className="ax-grid ax-grid--2" style={{ gap: 'var(--ax-space-2)' }}>
              <div style={{ padding: '10px 12px', background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 'var(--ax-radius-md, 8px)' }}>
                <small style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-xs)' }}>Survey Completed & Uploaded</small>
                <div style={{ fontSize: 'var(--ax-text-lg)', fontWeight: 700, color: 'var(--ax-viz-emerald, #10b981)' }}>
                  {num(detail.survey_done)} <span style={{ fontSize: 'var(--ax-text-xs)', fontWeight: 500 }}>({pctDone}%)</span>
                </div>
              </div>
              <div style={{ padding: '10px 12px', background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 'var(--ax-radius-md, 8px)' }}>
                <small style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-xs)' }}>Pending Physical Survey</small>
                <div style={{ fontSize: 'var(--ax-text-lg)', fontWeight: 700, color: 'var(--ax-viz-amber, #f59e0b)' }}>
                  {num(detail.survey_pending)} <span style={{ fontSize: 'var(--ax-text-xs)', fontWeight: 500 }}>({pctPending}%)</span>
                </div>
              </div>
            </div>

            <div>
              <div className="ax-cluster" style={{ justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>Overall Pre-Installation Survey Completion Rate</span>
                <b className="ax-num" style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-emerald, #10b981)' }}>
                  {pctDone}%
                </b>
              </div>
              <div className="ax-progress ax-progress--sm">
                <div className="ax-progress__track">
                  <div className="ax-progress__fill" style={{ width: `${pctDone}%`, background: 'var(--ax-viz-emerald, #10b981)' }} />
                </div>
              </div>
            </div>

            <div style={{ paddingTop: 'var(--ax-space-2)', borderTop: '1px solid var(--ax-border-subtle, #f1f5f9)', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
              <b>Technical Audit & Sanctions Summary:</b> {num(detail.assigned)} assigned ({num(detail.not_assigned)} unassigned) · {num(detail.survey_verify_complete)} verified approved ({num(detail.survey_verify_pending)} pending review, {num(detail.survey_verify_reject)} rejected).
            </div>
          </div>
        </section>

        {/* 6. Charts: District Wise Surveys + Status Donut */}
        <section className="ax-card ax-card--chart ax-col--8" role="region" aria-label="District wise surveys">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Geographic Breakdown</span>
              <h2 className="ax-card__title">District Wise Surveys</h2>
              <p className="ax-card__subtitle">{num(detail.survey_done)} completed of {num(detail.total)} sanctioned across {districtOptions.length} districts</p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)' }}>
                {[
                  { l: 'Survey Done', c: LIGHT_GREEN },
                  { l: 'Sanctioned Sites', c: LIGHT_BLUE },
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
                  key={`dist-chart-${chartH}-${chartDistricts.map((d) => `${d.district}-${d.survey_done}-${d.total}`).join('-')}`}
                  type="bar"
                  height={chartH}
                  legend="none"
                  ariaLabel="District-wise survey comparison"
                  series={[
                    { name: 'Survey Done', data: chartDistricts.map((d) => d.survey_done || 0) },
                    { name: 'Sanctioned Sites', data: chartDistricts.map((d) => d.total || 0) },
                  ]}
                  apex={{
                    colors: [LIGHT_GREEN, LIGHT_BLUE],
                    plotOptions: { bar: { horizontal: false, borderRadius: 4, columnWidth: '35%' } },
                    xaxis: { categories: chartDistricts.map((d) => d.district), labels: { style: { fontSize: '11px' }, rotate: -35 } },
                    yaxis: { title: { text: 'Survey Sites (Nos.)', style: { color: 'var(--ax-text-muted)' } } },
                    chart: {
                      events: {
                        dataPointSelection: (_event: unknown, _chart: unknown, opts: any) => {
                          const dist = chartDistricts[opts?.dataPointIndex]?.district;
                          if (dist) openDrillDown('survey-done', dist);
                        },
                      },
                    },
                  }}
                />
              </Suspense>
            ) : (
              <div style={{ height: chartH, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--ax-text-muted)', gap: 8 }}>
                <span style={{ fontSize: 'var(--ax-text-sm)', fontWeight: 500 }}>No district survey data returned by server.</span>
              </div>
            )}
          </div>
        </section>

        {/* Status Distribution Donut Chart */}
        <section className="ax-card ax-col--4" role="region" aria-label="Survey status split">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Execution Distribution</span>
              <h2 className="ax-card__title">Status Breakdown</h2>
              <p className="ax-card__subtitle">Total {num(detail.total)} Rooftop Sites</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <Suspense fallback={<div className="ax-skeleton" style={{ height: donutH }} />}>
              <ApexChart
                key={`donut-${donutH}-${detail.survey_done}-${detail.survey_pending}-${detail.survey_verify_reject}`}
                type="donut"
                height={donutH}
                legend="none"
                ariaLabel="Completed, pending and rejected distribution"
                series={[detail.survey_done, detail.survey_pending, detail.survey_verify_reject]}
                apex={{
                  labels: ['Survey Completed', 'Survey Pending', 'Rework Required'],
                  colors: [LIGHT_GREEN, LIGHT_AMBER, LIGHT_RED],
                  stroke: { width: 0 },
                  chart: {
                    events: {
                      dataPointSelection: (_event: unknown, _chart: unknown, opts: any) => {
                        const labels = ['survey-done', 'survey-pending', 'survey-verify-reject'];
                        const key = labels[opts?.dataPointIndex];
                        if (key) openDrillDown(key);
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
                          total: { show: true, label: 'Sites', formatter: () => num(detail.total) },
                        },
                      },
                    },
                  },
                }}
              />
            </Suspense>
            <ul className="ax-list ax-list--compact" style={{ marginTop: 'var(--ax-space-3)' }}>
              {[
                { label: 'Survey Done', sub: 'Completed feasibility', v: detail.survey_done, p: pctDone, color: LIGHT_GREEN, key: 'survey-done' },
                { label: 'Survey Pending', sub: 'Awaiting execution', v: detail.survey_pending, p: pctPending, color: LIGHT_AMBER, key: 'survey-pending' },
                { label: 'Rework Required', sub: 'Audit rejected', v: detail.survey_verify_reject, p: pctOf(detail.survey_verify_reject, detail.total), color: LIGHT_RED, key: 'survey-verify-reject' },
              ].map((s) => (
                <li
                  key={s.label}
                  className="ax-list__row"
                  style={{ border: 0, paddingInline: 0, cursor: 'pointer' }}
                  onClick={() => openDrillDown(s.key)}
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

        {/* 7. Survey Workflow Milestones */}
        <section className="ax-card ax-col--12" role="region" aria-label="Survey Workflow Milestones">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Workflow Lifecycle</span>
              <h2 className="ax-card__title">Resco Survey Milestones</h2>
              <p className="ax-card__subtitle">Progress across survey allocation, on-site feasibility and engineering audit stages</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <div className="ax-grid ax-grid--4" style={{ gap: 'var(--ax-space-4)' }}>
              {milestones.map((m) => {
                const p = pctOf(m.v, m.of);
                return (
                  <div key={m.label} style={{ background: 'var(--ax-surface-subtle, #f8fafc)', padding: '14px', borderRadius: '10px' }}>
                    <div className="ax-cluster" style={{ justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 4 }}>
                      <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-strong)', fontWeight: 600 }}>{m.label}</span>
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
          </div>
        </section>

        {/* 8. District Wise Detailed Table */}
        <section className="ax-card ax-col--12" role="region" aria-label="District wise survey summary table">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Geographic Breakdown</span>
              <h2 className="ax-card__title">District Wise Survey Performance</h2>
              <p className="ax-card__subtitle">Allocated, assigned, completed feasibility, verification and rejection metrics per district</p>
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
                  onCopy={() => copyToClipboard(tableDistricts, districtCols, 'District summary data copied to clipboard!')}
                  onExportCSV={() => exportToCSV(tableDistricts, districtCols, `${fileBase}_${stamp}`)}
                  onExportExcel={() => exportToExcel(tableDistricts, districtCols, `${fileBase}_${stamp}`)}
                  onExportPDF={() => exportToPDF(tableDistricts, districtCols, fileTitle)}
                />
              </div>
            </div>
          </div>

          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover" style={{ minWidth: 1200, whiteSpace: 'nowrap' }}>
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">District</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Sanctioned</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Assigned</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Unassigned</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Survey Done</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Survey Pending</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Verify Approved</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Verify Pending</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Verify Rejected</th>
                  <th className="ax-table__th" scope="col" style={{ width: 140 }}>Progress</th>
                </tr>
              </thead>
              <tbody>
                {pagedDistricts.map((d) => {
                  const pct = pctOf(d.survey_done, d.total);
                  return (
                    <tr
                      key={d.district}
                      className="ax-table__row"
                      role="button"
                      tabIndex={0}
                      onClick={() => openDrillDown('survey-done', d.district)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDrillDown('survey-done', d.district); } }}
                      style={{ cursor: 'pointer' }}
                    >
                      <td className="ax-table__td" style={{ fontWeight: 'var(--ax-weight-semibold)', color: 'var(--ax-text-strong)' }}>
                        <b>{d.district}</b>
                      </td>
                      <td
                        className="ax-table__td ax-table__td--num ax-num"
                        style={{ fontWeight: 600, cursor: 'pointer' }}
                        title={`View all sanctioned sites in ${d.district}`}
                        onClick={(e) => { e.stopPropagation(); openDrillDown('all', d.district); }}
                      >
                        {num(d.total || 0)}
                      </td>
                      <td
                        className="ax-table__td ax-table__td--num ax-num"
                        style={{ color: 'var(--ax-viz-cyan, #0891b2)', fontWeight: 600, cursor: 'pointer' }}
                        title={`View assigned sites in ${d.district}`}
                        onClick={(e) => { e.stopPropagation(); openDrillDown('assigned', d.district); }}
                      >
                        {num(d.assigned || 0)}
                      </td>
                      <td
                        className="ax-table__td ax-table__td--num ax-num"
                        style={{ color: 'var(--ax-text-muted)', fontWeight: 500 }}
                      >
                        {num(d.not_assigned || 0)}
                      </td>
                      <td
                        className="ax-table__td ax-table__td--num ax-num"
                        style={{ color: 'var(--ax-viz-emerald, #10b981)', fontWeight: 600, cursor: 'pointer' }}
                        title={`View completed surveys in ${d.district}`}
                        onClick={(e) => { e.stopPropagation(); openDrillDown('survey-done', d.district); }}
                      >
                        {num(d.survey_done || 0)}
                      </td>
                      <td
                        className="ax-table__td ax-table__td--num ax-num"
                        style={{ color: 'var(--ax-viz-amber, #f59e0b)', fontWeight: 600, cursor: 'pointer' }}
                        title={`View pending surveys in ${d.district}`}
                        onClick={(e) => { e.stopPropagation(); openDrillDown('survey-pending', d.district); }}
                      >
                        {num(d.survey_pending || 0)}
                      </td>
                      <td
                        className="ax-table__td ax-table__td--num ax-num"
                        style={{ color: 'var(--ax-viz-cyan, #0891b2)', fontWeight: 600, cursor: 'pointer' }}
                        title={`View verify approved sites in ${d.district}`}
                        onClick={(e) => { e.stopPropagation(); openDrillDown('survey-verify-complete', d.district); }}
                      >
                        {num(d.survey_verify_complete || 0)}
                      </td>
                      <td
                        className="ax-table__td ax-table__td--num ax-num"
                        style={{ color: 'var(--ax-viz-amber, #f59e0b)', fontWeight: 600, cursor: 'pointer' }}
                        title={`View audit pending surveys in ${d.district}`}
                        onClick={(e) => { e.stopPropagation(); openDrillDown('survey-verify-pending', d.district); }}
                      >
                        {num(d.survey_verify_pending || 0)}
                      </td>
                      <td
                        className="ax-table__td ax-table__td--num ax-num"
                        style={{ color: 'var(--ax-viz-red, #dc2626)', fontWeight: 600, cursor: 'pointer' }}
                        title={`View rejected surveys in ${d.district}`}
                        onClick={(e) => { e.stopPropagation(); openDrillDown('survey-verify-reject', d.district); }}
                      >
                        {num(d.survey_verify_reject || 0)}
                      </td>
                      <td className="ax-table__td">
                        <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', flexWrap: 'nowrap', alignItems: 'center' }}>
                          <div className="ax-progress ax-progress--sm" style={{ minWidth: 60, width: 60 }}>
                            <div className="ax-progress__track">
                              <div className="ax-progress__fill" style={{ width: `${pct}%`, background: pct >= 90 ? 'var(--ax-viz-emerald, #10b981)' : 'var(--asw-primary)' }} />
                            </div>
                          </div>
                          <span className="ax-num" style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)', minWidth: 36 }}>{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!loading && pagedDistricts.length === 0 && (
                  <tr>
                    <td className="ax-table__td" colSpan={10} style={{ textAlign: 'center', color: 'var(--ax-text-muted)', padding: 24 }}>
                      No districts match the filter criteria.
                    </td>
                  </tr>
                )}
                {pagedDistricts.length > 0 && (
                  <tr className="ax-table__row" style={{ background: 'var(--ax-surface-subtle, #f8fafc)', fontWeight: 'var(--ax-weight-bold)' }}>
                    <td className="ax-table__td" style={{ color: 'var(--ax-text-strong)' }}>Total (All Districts)</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ cursor: 'pointer' }} onClick={() => openDrillDown('all')}>{num(detail.total)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-cyan, #0891b2)', cursor: 'pointer' }} onClick={() => openDrillDown('assigned')}>{num(detail.assigned)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-text-muted)' }}>{num(detail.not_assigned)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-emerald, #10b981)', cursor: 'pointer' }} onClick={() => openDrillDown('survey-done')}>{num(detail.survey_done)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-amber, #f59e0b)', cursor: 'pointer' }} onClick={() => openDrillDown('survey-pending')}>{num(detail.survey_pending)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-cyan, #0891b2)', cursor: 'pointer' }} onClick={() => openDrillDown('survey-verify-complete')}>{num(detail.survey_verify_complete)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-amber, #f59e0b)', cursor: 'pointer' }} onClick={() => openDrillDown('survey-verify-pending')}>{num(detail.survey_verify_pending)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-red, #dc2626)', cursor: 'pointer' }} onClick={() => openDrillDown('survey-verify-reject')}>{num(detail.survey_verify_reject)}</td>
                    <td className="ax-table__td">
                      <b className="ax-num" style={{ color: 'var(--ax-viz-emerald, #10b981)' }}>{pctDone}%</b>
                    </td>
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

        {/* 9. Vendor-Wise Performance Table */}
        <section className="ax-card ax-col--12" role="region" aria-label="Vendor Wise Performance">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Survey Partner Agencies</span>
              <h2 className="ax-card__title">Vendor-Wise Survey Allocation & Performance</h2>
              <p className="ax-card__subtitle">Field throughput, feasibility approvals and verification audit status per vendor contractor</p>
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
                  onCopy={() => copyToClipboard(tableVendors, vendorCols, 'Vendor performance data copied to clipboard!')}
                  onExportCSV={() => exportToCSV(tableVendors, vendorCols, `UP_Resco_Survey_Vendor_Performance_${stamp}`)}
                  onExportExcel={() => exportToExcel(tableVendors, vendorCols, `UP_Resco_Survey_Vendor_Performance_${stamp}`)}
                  onExportPDF={() => exportToPDF(tableVendors, vendorCols, 'UP Resco Survey Vendor Performance')}
                />
              </div>
            </div>
          </div>

          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover" style={{ minWidth: 1100, whiteSpace: 'nowrap' }}>
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">Vendor Agency</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Assigned Sites</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Survey Done</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Survey Pending</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Verify Approved</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Verify Pending</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Verify Rejected</th>
                  <th className="ax-table__th" scope="col" style={{ width: 140 }}>Progress</th>
                </tr>
              </thead>
              <tbody>
                {pagedVendors.map((v) => {
                  const pct = pctOf(v.survey_done, v.assigned);
                  const vName = v.vendor_name || getVendorName(v.survey_vendor);
                  return (
                    <tr
                      key={String(v.survey_vendor)}
                      className="ax-table__row"
                      role="button"
                      tabIndex={0}
                      onClick={() => openDrillDown('survey-done', undefined, v.survey_vendor)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDrillDown('survey-done', undefined, v.survey_vendor); } }}
                      style={{ cursor: 'pointer' }}
                    >
                      <td className="ax-table__td" style={{ fontWeight: 'var(--ax-weight-semibold)', color: 'var(--ax-text-strong)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <b>{vName}</b>
                          <small style={{ color: 'var(--ax-text-muted)', fontSize: '11px' }}>ID: #{v.survey_vendor}</small>
                        </div>
                      </td>
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ fontWeight: 600 }}>
                        {num(v.assigned || 0)}
                      </td>
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-emerald, #10b981)', fontWeight: 600 }}>
                        {num(v.survey_done || 0)}
                      </td>
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-amber, #f59e0b)', fontWeight: 600 }}>
                        {num(v.survey_pending || 0)}
                      </td>
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-cyan, #0891b2)', fontWeight: 600 }}>
                        {num(v.survey_verify_complete || 0)}
                      </td>
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-amber, #f59e0b)', fontWeight: 600 }}>
                        {num(v.survey_verify_pending || 0)}
                      </td>
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-red, #dc2626)', fontWeight: 600 }}>
                        {num(v.survey_verify_reject || 0)}
                      </td>
                      <td className="ax-table__td">
                        <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', flexWrap: 'nowrap', alignItems: 'center' }}>
                          <div className="ax-progress ax-progress--sm" style={{ minWidth: 60, width: 60 }}>
                            <div className="ax-progress__track">
                              <div className="ax-progress__fill" style={{ width: `${pct}%`, background: pct >= 90 ? 'var(--ax-viz-emerald, #10b981)' : 'var(--asw-primary)' }} />
                            </div>
                          </div>
                          <span className="ax-num" style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)', minWidth: 36 }}>{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!loading && pagedVendors.length === 0 && (
                  <tr>
                    <td className="ax-table__td" colSpan={8} style={{ textAlign: 'center', color: 'var(--ax-text-muted)', padding: 24 }}>
                      No vendor performance records match your search.
                    </td>
                  </tr>
                )}
                {pagedVendors.length > 0 && (
                  <tr className="ax-table__row" style={{ background: 'var(--ax-surface-subtle, #f8fafc)', fontWeight: 'var(--ax-weight-bold)' }}>
                    <td className="ax-table__td" style={{ color: 'var(--ax-text-strong)' }}>Total (All Vendors)</td>
                    <td className="ax-table__td ax-table__td--num ax-num">{num(vendorwises.reduce((s, v) => s + (Number(v.assigned) || 0), 0))}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-emerald, #10b981)' }}>{num(vendorwises.reduce((s, v) => s + (Number(v.survey_done) || 0), 0))}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-amber, #f59e0b)' }}>{num(vendorwises.reduce((s, v) => s + (Number(v.survey_pending) || 0), 0))}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-cyan, #0891b2)' }}>{num(vendorwises.reduce((s, v) => s + (Number(v.survey_verify_complete) || 0), 0))}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-amber, #f59e0b)' }}>{num(vendorwises.reduce((s, v) => s + (Number(v.survey_verify_pending) || 0), 0))}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-red, #dc2626)' }}>{num(vendorwises.reduce((s, v) => s + (Number(v.survey_verify_reject) || 0), 0))}</td>
                    <td className="ax-table__td">
                      <b className="ax-num" style={{ color: 'var(--ax-viz-emerald, #10b981)' }}>
                        {pctOf(vendorwises.reduce((s, v) => s + (Number(v.survey_done) || 0), 0), vendorwises.reduce((s, v) => s + (Number(v.assigned) || 0), 1))}%
                      </b>
                    </td>
                  </tr>
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
                pageSizeOptions={[5, 10, 25, 50]}
              />
            </div>
          </div>
        </section>

        {/* 10. District Leaderboard & Quick Module Actions */}
        <section className="ax-card ax-col--6" role="region" aria-label="District Status & Quick Navigation">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">District Operations</span>
              <h2 className="ax-card__title">Top Survey Districts (Leaderboard)</h2>
              <p className="ax-card__subtitle">Highest survey completion across UP districts</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <div>
              <div className="ax-cluster" style={{ justifyContent: 'space-between', marginBottom: 'var(--ax-space-2)' }}>
                <span style={{ fontSize: 'var(--ax-text-sm)', fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                  Survey Completion Ranking
                </span>
                <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill">{num(detail.survey_done)} Completed</span>
              </div>
              <div className="ax-statgroup ax-statgroup--stack" style={{ gap: 'var(--ax-space-2)' }}>
                {districtwise
                  .slice()
                  .sort((a, b) => (Number(b.survey_done) || 0) - (Number(a.survey_done) || 0))
                  .slice(0, 10)
                  .map((d) => {
                    const doneVal = Number(d.survey_done) || 0;
                    const totalVal = Number(d.total) || doneVal;
                    const pct = pctOf(doneVal, totalVal);
                    return (
                      <button
                        key={d.district}
                        type="button"
                        className="ax-cluster"
                        onClick={() => openDrillDown('survey-done', d.district)}
                        style={{
                          width: '100%',
                          justifyContent: 'space-between',
                          fontSize: 'var(--ax-text-xs)',
                          border: 0,
                          background: 'transparent',
                          padding: '6px 0',
                          cursor: 'pointer',
                          textAlign: 'left',
                          borderBottom: '1px solid var(--ax-border-subtle, #f1f5f9)',
                        }}
                      >
                        <span style={{ color: 'var(--ax-text-muted)', fontWeight: 500 }}>{d.district}</span>
                        <b className="ax-num" style={{ color: 'var(--ax-viz-emerald, #10b981)' }}>
                          {num(doneVal)} / {num(totalVal)} ({pct}%)
                        </b>
                      </button>
                    );
                  })}
                {districtwise.length === 0 && <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>{loading ? 'Loading districts…' : 'No district survey data.'}</span>}
              </div>
            </div>
          </div>
        </section>

        {/* 11. Quick Module Actions */}
        <section className="ax-card ax-col--6" role="region" aria-label="Quick Module Actions">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Workflows & Portals</span>
              <h2 className="ax-card__title">Quick Module Actions</h2>
              <p className="ax-card__subtitle">Shortcuts to manage survey assignments, verifications and surveyor desk</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link to="/vendor-management/up/resco/survey/assign" className="ax-btn ax-btn--primary ax-btn--sm" style={{ justifyContent: 'space-between', padding: '10px 14px' }}>
                <span>Assign New Surveys</span>
                <span>+</span>
              </Link>
              <Link to="/vendor-management/up/resco/survey/assign-view" className="ax-btn ax-btn--primary ax-btn--sm" style={{ justifyContent: 'space-between', padding: '10px 14px' }}>
                <span>View Assigned Surveys</span>
                <span>→</span>
              </Link>
              <Link to="/vendor-management/up/resco/survey/verify" className="ax-btn ax-btn--primary ax-btn--sm" style={{ justifyContent: 'space-between', padding: '10px 14px' }}>
                <span>Review & Verify Site Surveys</span>
                <span>📋</span>
              </Link>
              <Link to="/vendor-management/up/resco/survey/assign-vendor" className="ax-btn ax-btn--primary ax-btn--sm" style={{ justifyContent: 'space-between', padding: '10px 14px' }}>
                <span>Update Assigned Sites / Desk</span>
                <span>⚙</span>
              </Link>
              <Link to="/vendor-management/up/resco/survey/status-view?status=survey-done" className="ax-btn ax-btn--secondary ax-btn--sm" style={{ justifyContent: 'space-between', padding: '10px 14px' }}>
                <span>Open Full Survey Status Register</span>
                <span>↗</span>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default UPRescoSurveyDashboard;
