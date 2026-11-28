import { lazy, Suspense, useCallback, useEffect, useMemo, useState, useDeferredValue, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  Pagination,
  usePagination,
  SearchInput,
  TableExportToolbar,
  Modal,
  type ExportColumn,
} from '../../../../../common';
import {
  jammuSurveyAdminService,
  type JKRescoSurveyDashboardData,
  type JKRescoSurveyItem,
  type JKRescoSurveyDistrictwise,
  type JKRescoSurveyVendorwise,
  resolveJammuSurveyMediaUrl,
} from '../jammuSurveyAdminService';

// Code-split ApexCharts so the Jammu RESCO Survey Dashboard shell renders instantly
const ApexChart = lazy(() => import('../../../../charts/ApexChart').then((m) => ({ default: m.ApexChart })));

// Palette constants matching Solar ERP design language
const LIGHT_BLUE = '#2563eb';
const LIGHT_GREEN = '#10b981';
const LIGHT_CYAN = '#0891b2';
const LIGHT_AMBER = '#f59e0b';
const LIGHT_VIOLET = '#7c3aed';
const LIGHT_RED = '#ef4444';

const num = (x: number | undefined | null) => (Number(x) || 0).toLocaleString('en-IN');
const pctOf = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : 0);
const escapeHtml = (s: string) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

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

/* ───────── Responsive page CSS (Exact Solar ERP / Jammu pattern) ───────── */
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
  .solar-erp-page .ax-table { min-width: 850px; }
  .solar-erp-page .ax-welcome__lede { max-width: 820px; }

  /* Filter bar styling */
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

/* ───────── Clean SVG Icons (no emojis) ───────── */
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
const I_USERS = svg(<><path d="M9 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" /><path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /><path d="M21 21v-2a4 4 0 0 0 -3 -3.85" /></>);
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

export interface RescoDistrictWise {
  district: string;
  total_sites: number;
  complete: number;
  pending: number;
  verify_approved: number;
  verify_pending: number;
  verify_reject: number;
  assigned?: number;
  not_assigned?: number;
  bos_cleared: number;
  capacity_kw: number;
}

export interface RescoMonthlySurveyItem {
  month_year: string;
  monthly_surveys: number;
}

const STATUS_SLUG_MAP: Record<string, string | undefined> = {
  All: undefined,
  Complete: 'survey-done',
  Pending: 'survey-pending',
  VerifyApproved: 'survey-verify-complete',
  VerifyPending: 'survey-verify-pending',
  VerifyReject: 'survey-verify-reject',
  Assigned: 'assigned',
  NotAssigned: 'not-assigned',
};

export function RescoDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [, setUpdatedAt] = useState<Date | null>(null);

  // Raw API lists
  const [dashboardData, setDashboardData] = useState<JKRescoSurveyDashboardData | null>(null);
  const [surveyList, setSurveyList] = useState<JKRescoSurveyItem[]>([]);

  // Filter states
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [tableQuery, setTableQuery] = useState<string>('');
  const [surveyQuery, setSurveyQuery] = useState<string>('');

  // Selected site for modal preview
  const [selectedSiteModal, setSelectedSiteModal] = useState<JKRescoSurveyItem | null>(null);

  // Chart heights
  const chartH = useChartHeight(320, 260);
  const donutH = useChartHeight(230, 210);

  // 1. Fetch live data from official JK RESCO survey endpoints
  const loadDashboardData = useCallback(async (statusFilter: string = 'All') => {
    setLoading(true);
    setApiError(null);
    try {
      const statusSlug = STATUS_SLUG_MAP[statusFilter];
      const [dashRes, viewRes] = await Promise.allSettled([
        jammuSurveyAdminService.getRescoSurveyDashboard(),
        jammuSurveyAdminService.getRescoSurveyViewDashboard(statusSlug),
      ]);

      if (dashRes.status === 'fulfilled') {
        setDashboardData(dashRes.value || {});
      }
      if (viewRes.status === 'fulfilled') {
        setSurveyList(Array.isArray(viewRes.value) ? viewRes.value : []);
      }
      setUpdatedAt(new Date());
    } catch (err: any) {
      console.error('Jammu RESCO Dashboard fetch error:', err);
      setApiError(err?.message || 'Failed to fetch dynamic survey dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData(selectedStatus);
  }, [selectedStatus, loadDashboardData]);

  // Compute District-Wise Breakdown from live API response or fallback aggregation
  const districtwise: RescoDistrictWise[] = useMemo(() => {
    if (dashboardData?.districtwise && dashboardData.districtwise.length > 0) {
      return dashboardData.districtwise.map((d: JKRescoSurveyDistrictwise) => ({
        district: String(d.district || 'Jammu').trim(),
        total_sites: Number(d.total || 0),
        complete: Number(d.survey_done || 0),
        pending: Number(d.survey_pending || 0),
        verify_approved: Number(d.survey_verify_complete || 0),
        verify_pending: Number(d.survey_verify_pending || 0),
        verify_reject: Number(d.survey_verify_reject || 0),
        assigned: Number(d.assigned || 0),
        not_assigned: Number(d.not_assigned || 0),
        bos_cleared: 0,
        capacity_kw: 0,
      }));
    }

    if (!surveyList.length) {
      return [];
    }

    const distMap: Record<string, RescoDistrictWise> = {};

    surveyList.forEach((item) => {
      const d = String(item.district || 'Jammu').trim();
      if (!d || d === '-' || d.toLowerCase() === 'select') return;
      if (!distMap[d]) {
        distMap[d] = {
          district: d,
          total_sites: 0,
          complete: 0,
          pending: 0,
          verify_approved: 0,
          verify_pending: 0,
          verify_reject: 0,
          assigned: 0,
          not_assigned: 0,
          bos_cleared: 0,
          capacity_kw: 0,
        };
      }
      distMap[d].total_sites += 1;

      const sDone = Number(item.survey_status) === 1;
      if (sDone) {
        distMap[d].complete += 1;
      } else {
        distMap[d].pending += 1;
      }

      if (item.survey_vendor && item.survey_vendor !== '0' && item.survey_vendor !== 'NA') {
        distMap[d].assigned = (distMap[d].assigned || 0) + 1;
      } else {
        distMap[d].not_assigned = (distMap[d].not_assigned || 0) + 1;
      }

      const vStatus = Number(item.survey_verify_status ?? item.verify_status ?? 0);
      if (vStatus === 1) {
        distMap[d].verify_approved += 1;
      } else if (vStatus === 2) {
        distMap[d].verify_reject += 1;
      } else if (sDone) {
        distMap[d].verify_pending += 1;
      }

      if (Number(item.bos_verify_status) === 1 || item.bos_file) {
        distMap[d].bos_cleared += 1;
      }

      const cap = Number(item.sanction_load || item.connected_load || item.capacity || 0);
      if (!isNaN(cap)) distMap[d].capacity_kw += cap;
    });

    return Object.values(distMap);
  }, [dashboardData, surveyList]);

  // District options
  const districtOptions = useMemo(
    () => [...new Set(districtwise.map((d) => d.district).filter(Boolean))].sort(),
    [districtwise]
  );

  // Vendorwise records from live API
  const vendorwise: JKRescoSurveyVendorwise[] = useMemo(() => {
    return dashboardData?.vendor_wises || [];
  }, [dashboardData]);

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
      else if (selectedStatus === 'Assigned') matchStatus = (d.assigned || 0) > 0;
      else if (selectedStatus === 'NotAssigned') matchStatus = (d.not_assigned || 0) > 0;
      return matchDistrict && matchStatus;
    });
  }, [districtwise, selectedDistrict, selectedStatus]);

  // Aggregated totals directly from dashboardData or filtered list
  const stats = useMemo(() => {
    const detail = dashboardData?.survey_detail;
    if (selectedDistrict === 'All' && detail) {
      const totalSites = Number(detail.total ?? detail.totalsite ?? 0);
      const complete = Number(detail.survey_done ?? detail.complete_survey ?? 0);
      const pending = Number(detail.survey_pending ?? detail.pending_survey ?? 0);
      const verifyApproved = Number(detail.survey_verify_complete ?? 0);
      const verifyPending = Number(detail.survey_verify_pending ?? detail.survey_verify ?? 0);
      const verifyReject = Number(detail.survey_verify_reject ?? 0);
      const assigned = Number(detail.assigned ?? detail.assignsite ?? 0);
      const notAssigned = Number(detail.not_assigned ?? detail.not_assign ?? 0);

      const cap = surveyList.reduce((sum, s) => sum + Number(s.sanction_load || s.connected_load || s.capacity || 0), 0);
      const bos = surveyList.filter((s) => Number(s.bos_verify_status) === 1 || s.bos_file).length;

      return {
        total_sites: totalSites,
        complete,
        pending,
        verify_approved: verifyApproved,
        verify_pending: verifyPending,
        verify_reject: verifyReject,
        assigned,
        not_assigned: notAssigned,
        bos_cleared: bos,
        capacity_kw: cap,
      };
    }

    return filteredDistricts.reduce(
      (acc, d) => ({
        total_sites: acc.total_sites + (d.total_sites || 0),
        complete: acc.complete + (d.complete || 0),
        pending: acc.pending + (d.pending || 0),
        verify_approved: acc.verify_approved + (d.verify_approved || 0),
        verify_pending: acc.verify_pending + (d.verify_pending || 0),
        verify_reject: acc.verify_reject + (d.verify_reject || 0),
        assigned: acc.assigned + (d.assigned || 0),
        not_assigned: acc.not_assigned + (d.not_assigned || 0),
        bos_cleared: acc.bos_cleared + (d.bos_cleared || 0),
        capacity_kw: acc.capacity_kw + (d.capacity_kw || 0),
      }),
      {
        total_sites: 0,
        complete: 0,
        pending: 0,
        verify_approved: 0,
        verify_pending: 0,
        verify_reject: 0,
        assigned: 0,
        not_assigned: 0,
        bos_cleared: 0,
        capacity_kw: 0,
      }
    );
  }, [dashboardData, selectedDistrict, filteredDistricts, surveyList]);

  const filtersActive = selectedDistrict !== 'All' || selectedStatus !== 'All';

  // Navigation Drill-Down Helper
  const openDrillDown = (route: string) => {
    navigate(route);
  };

  // Percentages & Rates
  const pctComplete = pctOf(stats.complete, stats.total_sites);
  const pctPending = pctOf(stats.pending, stats.total_sites);
  const pctVerified = pctOf(stats.verify_approved, stats.complete || 1);
  const pctBos = pctOf(stats.bos_cleared, stats.complete || 1);

  // Workflow Milestones
  const milestones = [
    { label: '1. Technical Survey Sites Allocated', v: stats.total_sites, of: stats.total_sites || 1, color: LIGHT_BLUE },
    { label: '2. Field Survey & Feasibility Conducted', v: stats.complete, of: stats.total_sites || 1, color: LIGHT_GREEN },
    { label: '3. Super Admin Verification Approved', v: stats.verify_approved, of: stats.complete || stats.total_sites || 1, color: LIGHT_CYAN },
    { label: '4. BOS Products & Technical Cleared', v: stats.bos_cleared, of: stats.complete || stats.total_sites || 1, color: LIGHT_VIOLET },
    { label: '5. Ready for Rooftop Solar Installation', v: stats.verify_approved, of: stats.total_sites || 1, color: LIGHT_AMBER },
  ];

  // Top districts for bar chart
  const chartDistricts = useMemo(
    () => [...filteredDistricts].sort((a, b) => (b.complete || 0) - (a.complete || 0)).slice(0, 15),
    [filteredDistricts]
  );

  // Monthly timeline derived dynamically from real survey logs
  const monthlyTimeline: RescoMonthlySurveyItem[] = useMemo(() => {
    if (!surveyList.length) return [];
    const map: Record<string, number> = {};
    surveyList.forEach((s) => {
      const dateStr = s.survey_date || s.created_at;
      if (dateStr) {
        try {
          const d = new Date(dateStr);
          if (!isNaN(d.getTime())) {
            const key = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            map[key] = (map[key] || 0) + 1;
          }
        } catch {}
      }
    });
    return Object.entries(map).map(([month_year, monthly_surveys]) => ({ month_year, monthly_surveys }));
  }, [surveyList]);

  // Sparklines datasets derived from real data
  const siteSpark = filteredDistricts.length > 1 ? filteredDistricts.slice(0, 10).map((d) => d.total_sites || 0) : undefined;
  const completeSpark = filteredDistricts.length > 1 ? filteredDistricts.slice(0, 10).map((d) => d.complete || 0) : undefined;
  const pendingSpark = filteredDistricts.length > 1 ? filteredDistricts.slice(0, 10).map((d) => d.pending || 0) : undefined;
  const verifySpark = filteredDistricts.length > 1 ? filteredDistricts.slice(0, 10).map((d) => d.verify_approved || 0) : undefined;

  const execRateSpark = filteredDistricts.length > 1 ? filteredDistricts.slice(0, 10).map((d) => pctOf(d.complete, d.total_sites)) : undefined;
  const auditPassSpark = filteredDistricts.length > 1 ? filteredDistricts.slice(0, 10).map((d) => pctOf(d.verify_approved, (d.verify_approved + d.verify_reject) || 1)) : undefined;
  const bosSpark = filteredDistricts.length > 1 ? filteredDistricts.slice(0, 10).map((d) => pctOf(d.bos_cleared, d.complete || 1)) : undefined;
  const capSpark = filteredDistricts.length > 1 ? filteredDistricts.slice(0, 10).map((d) => d.capacity_kw || 0) : undefined;

  // ── Table 1: District Summary Search & Pagination ──
  const deferredDistrictQuery = useDeferredValue(tableQuery);
  const tableDistricts = useMemo(() => {
    const q = deferredDistrictQuery.trim().toLowerCase();
    return filteredDistricts.filter((d) => !q || d.district.toLowerCase().includes(q));
  }, [filteredDistricts, deferredDistrictQuery]);

  const {
    paginatedData: pagedDistricts,
    currentPage: districtPage,
    pageSize: districtPageSize,
    totalItems: districtTotalItems,
    setPage: setDistrictPage,
    setPageSize: setDistrictPageSize,
  } = usePagination({ data: tableDistricts, initialPageSize: 25 });

  useEffect(() => {
    setDistrictPage(1);
  }, [tableQuery, selectedDistrict, selectedStatus, setDistrictPage]);

  // ── Table 2: Survey Sites Register Search & Pagination ──
  const deferredSurveyQuery = useDeferredValue(surveyQuery);
  const tableSurveys = useMemo(() => {
    const q = deferredSurveyQuery.trim().toLowerCase();
    let list = surveyList;
    if (selectedDistrict !== 'All') {
      list = list.filter((s) => String(s.district || '').toLowerCase() === selectedDistrict.toLowerCase());
    }
    if (!q) return list;
    return list.filter((s) => {
      const matchName = String(s.site_name || '').toLowerCase().includes(q);
      const matchDist = String(s.district || '').toLowerCase().includes(q);
      const matchVendor = String(s.vendor_name || s.vendor || '').toLowerCase().includes(q);
      const matchDept = String(s.dept_name || '').toLowerCase().includes(q);
      const matchCa = String(s.ca_no || '').toLowerCase().includes(q);
      return matchName || matchDist || matchVendor || matchDept || matchCa;
    });
  }, [surveyList, selectedDistrict, deferredSurveyQuery]);

  const {
    paginatedData: pagedSurveys,
    currentPage: surveyPage,
    pageSize: surveyPageSize,
    totalItems: surveyTotalItems,
    setPage: setSurveyPage,
    setPageSize: setSurveyPageSize,
  } = usePagination({ data: tableSurveys, initialPageSize: 25 });

  useEffect(() => {
    setSurveyPage(1);
  }, [surveyQuery, selectedDistrict, setSurveyPage]);

  // Export Columns definition for District Table
  const districtCols: ExportColumn<RescoDistrictWise>[] = useMemo(() => [
    { header: 'District', accessor: 'district' },
    { header: 'Allocated Sites', accessor: 'total_sites' },
    { header: 'Survey Conducted', accessor: 'complete' },
    { header: 'Pending Survey', accessor: 'pending' },
    { header: 'Verify Approved', accessor: 'verify_approved' },
    { header: 'Verify Pending', accessor: 'verify_pending' },
    { header: 'Verify Rejected', accessor: 'verify_reject' },
    { header: 'Assigned', accessor: (r) => r.assigned ?? 0 },
    { header: 'Unassigned', accessor: (r) => r.not_assigned ?? 0 },
    { header: 'BOS Cleared', accessor: 'bos_cleared' },
    { header: 'Capacity (KW)', accessor: 'capacity_kw' },
  ], []);

  // Export Columns definition for Survey Register Table
  const surveyCols: ExportColumn<JKRescoSurveyItem>[] = useMemo(() => [
    { header: 'ID', accessor: 'id' },
    { header: 'Site Name', accessor: 'site_name' },
    { header: 'Vendor Name', accessor: (r) => r.vendor_name || r.vendor || 'N/A' },
    { header: 'District', accessor: 'district' },
    { header: 'Department', accessor: 'dept_name' },
    { header: 'Proposed Cap (KW)', accessor: (r) => r.proposed_capacity || r.capacity || r.sanction_load || '-' },
    { header: 'Survey Status', accessor: (r) => Number(r.survey_status) === 1 ? 'Conducted' : 'Pending' },
    { header: 'Verify Status', accessor: (r) => Number(r.survey_verify_status ?? r.verify_status) === 1 ? 'Approved' : Number(r.survey_verify_status ?? r.verify_status) === 2 ? 'Rejected' : 'In Review' },
    { header: 'BOS Status', accessor: (r) => (r.bos_file || Number(r.bos_verify_status) === 1) ? 'Cleared' : 'Pending' },
  ], []);

  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = 'Jammu_RESCO_Survey_Overview';
  const fileTitle = 'Jammu RESCO Solar Survey Performance Report';

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

  const copyToClipboard = async <T,>(list: T[], columns: ExportColumn<T>[], label: string) => {
    if (!list.length || !columns.length) return;
    const t = [
      columns.map((c) => c.header).join('\t'),
      ...list.map((row) => columns.map((c) => escapeExportValue(getExportValue(row, c))).join('\t')),
    ].join('\n');
    try {
      await navigator.clipboard.writeText(t);
      alert(`${label} data copied to clipboard!`);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = t;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      alert(`${label} data copied to clipboard!`);
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
        title="Jammu RESCO Survey Dashboard"
        subtitle={
          <span style={{ display: 'inline-block', fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>
            Rooftop Solar (RESCO) Feasibility Surveys, District Bifurcation & Field Audit Throughput
           
          </span>
        }
        breadcrumbs={[
          { label: 'ERP Dashboard', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Jammu' },
          { label: 'Survey' },
          { label: 'RESCO Survey' },
          { label: 'Dashboard' },
        ]}
        actions={
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill" style={{ fontWeight: 600, paddingInline: 'var(--ax-space-3)' }}>
              <span className="ax-badge__dot" /> State: Jammu & Kashmir
            </span>
            <button
              type="button"
              className="ax-btn ax-btn--ghost ax-btn--sm"
              onClick={() => loadDashboardData(selectedStatus)}
              disabled={loading}
            >
              {loading ? 'Refreshing…' : '↻ Refresh'}
            </button>
            <Link to="/vendor-management/jammu/survey/resco/status-view" className="ax-btn ax-btn--secondary ax-btn--sm">
              Status Drill-down
            </Link>
            <Link to="/vendor-management/jammu/survey/resco/assign-survey" className="ax-btn ax-btn--primary ax-btn--sm">
              <span className="ax-btn__label">+ Assign Survey</span>
            </Link>
            <Link to="/vendor-management/jammu/survey/resco/view-assign" className="ax-btn ax-btn--secondary ax-btn--sm">
              Batch Assignments
            </Link>
            <Link to="/vendor-management/jammu/survey/resco/verify-survey" className="ax-btn ax-btn--secondary ax-btn--sm">
              Verify Survey Desk
            </Link>
            <Link to="/vendor-management/jammu/survey/srt-70mw/verify-survey" className="ax-btn ax-btn--ghost ax-btn--sm">
              SRT 70MW Survey
            </Link>
          </div>
        }
      />

      <div className="ax-dash-grid mt-0 pt-0">
        {apiError && (
          <div className="ax-col--12" style={{ padding: '10px 14px', background: 'color-mix(in oklab, var(--ax-viz-red, #ef4444) 12%, transparent)', color: 'var(--ax-viz-red, #dc2626)', borderRadius: 'var(--ax-radius-md, 8px)', fontSize: 'var(--ax-text-xs)' }}>
            <b>Notice:</b> {apiError}
          </div>
        )}

        {/* 2. Operations Filter Bar */}
        <section
          className="ax-card ax-card--flat ax-col--12"
          role="region"
          aria-label="Jammu RESCO Survey Dashboard Filters"
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
                <label htmlFor="jk-district-select" style={labelStyle}>District:</label>
                <select
                  id="jk-district-select"
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
                <label htmlFor="jk-status-select" style={labelStyle}>Status:</label>
                <select
                  id="jk-status-select"
                  className="ax-input ax-input--sm"
                  style={{ height: 30, fontSize: 'var(--ax-text-xs)', paddingInline: '8px' }}
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="All">All Statuses</option>
                  <option value="Complete">Survey Conducted</option>
                  <option value="Pending">Pending Survey</option>
                  <option value="VerifyApproved">Verify Approved</option>
                  <option value="VerifyPending">In Audit Review</option>
                  <option value="VerifyReject">Audit Rejected</option>
                  <option value="Assigned">Assigned Sites</option>
                  <option value="NotAssigned">Not Assigned</option>
                </select>
              </div>

              {filtersActive && (
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--sm"
                  style={{ height: 28, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }}
                  onClick={() => { setSelectedDistrict('All'); setSelectedStatus('All'); setTableQuery(''); setSurveyQuery(''); }}
                >
                  Reset Filters
                </button>
              )}
            </div>

            <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>
                Showing <b style={{ color: 'var(--ax-text-strong)' }}>{num(stats.total_sites)}</b> Allocated Sites across <b style={{ color: 'var(--ax-text-strong)' }}>{filteredDistricts.length}</b> {filteredDistricts.length === 1 ? 'District' : 'Districts'}
              </span>
            </div>
          </div>

          {/* Quick Filter Status Tabs */}
          <div className="ax-cluster ax-quick-filter-strip" style={{ gap: 6, flexWrap: 'wrap', width: '100%', marginTop: 8, paddingTop: 8, borderTop: '1px dashed var(--ax-border, #e2e8f0)' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ax-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Quick Filter:</span>
            {[
              { key: 'All', label: 'All Operations' },
              { key: 'Complete', label: 'Survey Conducted' },
              { key: 'Pending', label: 'Pending Survey' },
              { key: 'VerifyApproved', label: 'Verify Approved' },
              { key: 'VerifyPending', label: 'In Audit Review' },
              { key: 'VerifyReject', label: 'Audit Rejected' },
              { key: 'Assigned', label: 'Assigned Sites' },
              { key: 'NotAssigned', label: 'Not Assigned' },
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
        <section className="ax-card ax-welcome ax-col--12" role="region" aria-label="Jammu RESCO Survey Operations Overview">
          <div className="ax-welcome__body">
            <div className="ax-welcome__text">
              <p className="ax-welcome__eyebrow">Jammu & Kashmir · RESCO Rooftop Solar System</p>
              <h2 className="ax-card__title">Welcome to Jammu RESCO Survey Operations Dashboard</h2>
              <p className="ax-welcome__lede">
                {selectedDistrict !== 'All' ? (
                  <>
                    RESCO Survey technical feasibility overview for <b>{selectedDistrict}</b>: <b>{num(stats.total_sites)} survey sites</b> allocated.
                    <b> {num(stats.complete)} ({pctComplete}%)</b> feasibility completed, with <b>{num(stats.verify_approved)}</b> verified approved, <b>{num(stats.bos_cleared)}</b> technical BOS clearance, and <b>{num(stats.capacity_kw)} KW</b> potential solar capacity.
                  </>
                ) : (
                  <>
                    Jammu & Kashmir RESCO Solar Survey overview: <b>{num(stats.total_sites)} rooftop sites</b> allocated across <b>{districtOptions.length} districts</b>.
                    <b> {num(stats.complete)} ({pctComplete}%)</b> technical surveys completed, with <b>{num(stats.verify_approved)}</b> verified approved, <b>{num(stats.bos_cleared)}</b> technical BOS clearance, and <b>{num(stats.capacity_kw)} KW</b> proposed rooftop capacity.
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
                  {selectedDistrict !== 'All' ? 'Active Filter Scope' : 'J&K Operational Scope'}
                </small>
              </div>
              <div className="ax-welcome__stat">
                <dt>Allocated Sites</dt>
                <dd className="ax-num">{num(stats.total_sites)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--asw-primary)' }}>Rooftop Survey Target</small>
              </div>
              <div className="ax-welcome__stat">
                <dt>Surveys Conducted</dt>
                <dd className="ax-num">{num(stats.complete)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-emerald, #10b981)' }}>{pctComplete}% Complete</small>
              </div>
              <div className="ax-welcome__stat">
                <dt>Verify Approved</dt>
                <dd className="ax-num">{num(stats.verify_approved)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-amber, #f59e0b)' }}>{num(stats.verify_pending)} In Audit</small>
              </div>
            </dl>
          </div>
        </section>

        {/* 4. Core KPI Cards (interactive with sparklines) */}
        <KpiCard
          icon={I_PIN}
          tone="accent"
          label="Total Survey Sites"
          value={num(stats.total_sites)}
          unit="Sites"
          sub="Allocated rooftop survey targets"
          spark={siteSpark}
          onClick={() => openDrillDown('/vendor-management/jammu/survey/resco/status-view?status=total')}
        />

        <KpiCard
          icon={I_DONE}
          tone="emerald"
          label="Surveys Conducted"
          value={num(stats.complete)}
          unit="Sites"
          sub="Technical data & photos logged"
          badge={`${pctComplete}%`}
          spark={completeSpark}
          onClick={() => openDrillDown('/vendor-management/jammu/survey/resco/status-view?status=survey-done')}
        />

        <KpiCard
          icon={I_CLOCK}
          tone="amber"
          label="Pending Surveys"
          value={num(stats.pending)}
          unit="Sites"
          sub="Awaiting field investigation"
          badge={`${pctPending}%`}
          spark={pendingSpark}
          onClick={() => openDrillDown('/vendor-management/jammu/survey/resco/status-view?status=survey-pending')}
        />

        <KpiCard
          icon={I_SHIELD}
          tone="cyan"
          label="Verify Approved"
          value={num(stats.verify_approved)}
          unit="Sites"
          sub={`${num(stats.verify_pending)} Audit in progress`}
          badge={`${pctVerified}%`}
          spark={verifySpark}
          onClick={() => openDrillDown('/vendor-management/jammu/survey/resco/status-view?status=survey-verify-complete')}
        />

        <KpiCard
          icon={I_CLOCK}
          tone="amber"
          label="Verification Pending"
          value={num(stats.verify_pending)}
          unit="Sites"
          sub="Field audit pending Super Admin"
          onClick={() => openDrillDown('/vendor-management/jammu/survey/resco/status-view?status=survey-verify-pending')}
        />

        <KpiCard
          icon={I_X}
          tone="red"
          label="Verification Rejected"
          value={num(stats.verify_reject)}
          unit="Sites"
          sub="Requires vendor re-survey"
          onClick={() => openDrillDown('/vendor-management/jammu/survey/resco/status-view?status=survey-verify-reject')}
        />

        <KpiCard
          icon={I_DOC}
          tone="violet"
          label="BOS Cleared"
          value={num(stats.bos_cleared)}
          unit="Sites"
          sub="Bill of Materials & specs approved"
          badge={`${pctBos}%`}
          onClick={() => openDrillDown('/vendor-management/jammu/survey/resco/status-view?status=total')}
        />

        <KpiCard
          icon={I_BOLT}
          tone="emerald"
          label="Proposed Solar Capacity"
          value={num(stats.capacity_kw)}
          unit="KW"
          sub="Assessed feasible rooftop load"
          badge="Feasible"
          spark={capSpark}
          onClick={() => openDrillDown('/vendor-management/jammu/survey/resco/status-view?status=total')}
        />

        {/* 5. Operational Highlights & Quality Performance */}
        <div className="ax-col--12" style={{ marginTop: 'var(--ax-space-3)', marginBottom: 'var(--ax-space-1)' }}>
          <div className="ax-cluster" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--ax-space-2)' }}>
            <div>
              <span className="ax-card__eyebrow" style={{ color: 'var(--asw-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                Survey Operations & Quality Performance
              </span>
              <h2 className="ax-card__title" style={{ fontSize: 'var(--ax-text-lg)', margin: 0 }}>
                Feasibility Throughput & Quality Health
              </h2>
            </div>
            <span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--pill" style={{ fontSize: 'var(--ax-text-xs)' }}>
              Jammu & Kashmir RESCO System
            </span>
          </div>
        </div>

        {/* Operational Highlights Cards */}
        <KpiCard
          icon={I_BOLT}
          tone="emerald"
          label="Survey Execution Rate"
          value={`${pctComplete}%`}
          sub={`${num(stats.complete)} of ${num(stats.total_sites)} sites assessed`}
          badge="Conducted"
          spark={execRateSpark}
          onClick={() => openDrillDown('/vendor-management/jammu/survey/resco/verify-survey')}
        />

        <KpiCard
          icon={I_SHIELD}
          tone="cyan"
          label="Audit Pass Rate"
          value={`${pctOf(stats.verify_approved, (stats.verify_approved + stats.verify_reject) || 1)}%`}
          sub={`${num(stats.verify_approved)} Passed · ${num(stats.verify_reject)} Rejected`}
          spark={auditPassSpark}
          onClick={() => openDrillDown('/vendor-management/jammu/survey/resco/verify-survey')}
        />

        <KpiCard
          icon={I_DOC}
          tone="violet"
          label="BOS Compliance"
          value={`${pctBos}%`}
          sub={`${num(stats.bos_cleared)} technical specifications logged`}
          spark={bosSpark}
          onClick={() => openDrillDown('/vendor-management/jammu/survey/resco/verify-survey')}
        />

        <KpiCard
          icon={I_USERS}
          tone="accent"
          label="Assigned Vendors"
          value={num(vendorwise.length)}
          unit="Vendors"
          sub="Contracted survey execution teams"
          onClick={() => openDrillDown('/vendor-management/jammu/survey/resco/view-assign')}
        />

        {/* State Operations Executive Card */}
        <section className="ax-card ax-col--12" role="region" aria-label="Jammu RESCO Operations Overview">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow" style={{ color: 'var(--asw-primary)' }}>State Feasibility Benchmark</span>
              <h3 className="ax-card__title">Jammu & Kashmir · RESCO Solar Survey Operations</h3>
              <p className="ax-card__subtitle">{num(stats.complete)} rooftop solar technical audits completed across {districtOptions.length} districts</p>
            </div>
            <Link to="/vendor-management/jammu/survey/resco/verify-survey" className="ax-btn ax-btn--sm ax-btn--primary">
              Open Verification Desk →
            </Link>
          </div>
          <div className="ax-card__body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-3)' }}>
            <div className="ax-grid ax-grid--2" style={{ gap: 'var(--ax-space-2)' }}>
              <div style={{ padding: '10px 12px', background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 'var(--ax-radius-md, 8px)' }}>
                <small style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-xs)' }}>Surveys Conducted & Logged</small>
                <div style={{ fontSize: 'var(--ax-text-lg)', fontWeight: 700, color: 'var(--ax-viz-emerald, #10b981)' }}>
                  {num(stats.complete)} <span style={{ fontSize: 'var(--ax-text-xs)', fontWeight: 500 }}>({pctComplete}%)</span>
                </div>
              </div>
              <div style={{ padding: '10px 12px', background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 'var(--ax-radius-md, 8px)' }}>
                <small style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-xs)' }}>Pending Field Investigation</small>
                <div style={{ fontSize: 'var(--ax-text-lg)', fontWeight: 700, color: 'var(--ax-viz-amber, #f59e0b)' }}>
                  {num(stats.pending)} <span style={{ fontSize: 'var(--ax-text-xs)', fontWeight: 500 }}>({pctPending}%)</span>
                </div>
              </div>
            </div>

            <div>
              <div className="ax-cluster" style={{ justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>Overall Technical Survey Completion Efficiency</span>
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
              <b>Verification & Feasibility:</b> {num(stats.verify_approved)} surveys approved ({pctVerified}%) · {num(stats.bos_cleared)} BOS products & single line diagrams logged · {num(stats.capacity_kw)} KW sanctioned solar capacity.
            </div>
          </div>
        </section>

        {/* 6. Charts: District Wise Surveys + Status Donut */}
        <section className="ax-card ax-card--chart ax-col--8" role="region" aria-label="District wise surveys">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Geographic Breakdown</span>
              <h2 className="ax-card__title">District Wise RESCO Surveys</h2>
              <p className="ax-card__subtitle">{num(stats.complete)} conducted of {num(stats.total_sites)} allocated across {districtOptions.length} districts</p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)' }}>
                {[
                  { l: 'Surveys Conducted', c: LIGHT_GREEN },
                  { l: 'Allocated Targets', c: LIGHT_BLUE },
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
                  key={`dist-chart-${chartH}-${chartDistricts.map((d) => `${d.district}-${d.complete}-${d.total_sites}`).join('-')}`}
                  type="bar"
                  height={chartH}
                  legend="none"
                  ariaLabel="District-wise survey comparison"
                  series={[
                    { name: 'Surveys Conducted', data: chartDistricts.map((d) => d.complete || 0) },
                    { name: 'Allocated Targets', data: chartDistricts.map((d) => d.total_sites || 0) },
                  ]}
                  apex={{
                    colors: [LIGHT_GREEN, LIGHT_BLUE],
                    plotOptions: { bar: { horizontal: false, borderRadius: 4, columnWidth: '35%' } },
                    xaxis: { categories: chartDistricts.map((d) => d.district), labels: { style: { fontSize: '11px' }, rotate: -35 } },
                    yaxis: { title: { text: 'Surveys (Nos.)', style: { color: 'var(--ax-text-muted)' } } },
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
              <div style={{ height: chartH, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--ax-text-muted)', gap: 8 }}>
                <span style={{ fontSize: 'var(--ax-text-sm)', fontWeight: 500 }}>No district data available.</span>
              </div>
            )}
          </div>
        </section>

        {/* Status Distribution Donut Chart */}
        <section className="ax-card ax-col--4" role="region" aria-label="Survey status split">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Audit & Quality Distribution</span>
              <h2 className="ax-card__title">Status Breakdown</h2>
              <p className="ax-card__subtitle">Total {num(stats.total_sites)} Rooftop Sites</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <Suspense fallback={<div className="ax-skeleton" style={{ height: donutH }} />}>
              <ApexChart
                key={`donut-${donutH}-${stats.verify_approved}-${stats.verify_pending}-${stats.verify_reject}-${stats.pending}`}
                type="donut"
                height={donutH}
                legend="none"
                ariaLabel="Approved, audit pending and rejected distribution"
                series={[stats.verify_approved, stats.verify_pending, stats.verify_reject, stats.pending]}
                apex={{
                  labels: ['Verify Approved', 'In Audit Review', 'Rejected / Rework', 'Pending Survey'],
                  colors: [LIGHT_GREEN, LIGHT_AMBER, LIGHT_RED, LIGHT_BLUE],
                  stroke: { width: 0 },
                  plotOptions: {
                    pie: {
                      donut: {
                        size: '72%',
                        labels: {
                          show: true,
                          name: { fontFamily: 'var(--ax-font-sans)' },
                          value: { fontFamily: 'var(--ax-font-mono)', fontWeight: 600 },
                          total: { show: true, label: 'Sites', formatter: () => num(stats.total_sites) },
                        },
                      },
                    },
                  },
                }}
              />
            </Suspense>
            <ul className="ax-list ax-list--compact" style={{ marginTop: 'var(--ax-space-3)' }}>
              {[
                { label: 'Verify Approved', sub: 'Audit cleared', v: stats.verify_approved, p: pctVerified, color: LIGHT_GREEN, route: '/vendor-management/jammu/survey/resco/status-view?status=survey-verify-complete' },
                { label: 'In Audit Review', sub: 'Pending admin approval', v: stats.verify_pending, p: pctOf(stats.verify_pending, stats.total_sites), color: LIGHT_AMBER, route: '/vendor-management/jammu/survey/resco/status-view?status=survey-verify-pending' },
                { label: 'Rejected / Rework', sub: 'Deficiencies found', v: stats.verify_reject, p: pctOf(stats.verify_reject, stats.total_sites), color: LIGHT_RED, route: '/vendor-management/jammu/survey/resco/status-view?status=survey-verify-reject' },
                { label: 'Pending Survey', sub: 'Field survey scheduled', v: stats.pending, p: pctPending, color: LIGHT_BLUE, route: '/vendor-management/jammu/survey/resco/status-view?status=survey-pending' },
              ].map((s) => (
                <li
                  key={s.label}
                  className="ax-list__row"
                  style={{ border: 0, paddingInline: 0, cursor: 'pointer' }}
                  onClick={() => openDrillDown(s.route)}
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

        {/* 7. Monthly Survey Pace + Workflow Milestones */}
        <section className="ax-card ax-card--chart ax-col--8" role="region" aria-label="Monthly survey throughput">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Survey Timeline</span>
              <h2 className="ax-card__title">Monthly Survey Trend</h2>
              <p className="ax-card__subtitle">Feasibility execution throughput logged over time</p>
            </div>
            <div className="ax-card__actions">
              <span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--pill">
                {monthlyTimeline.length} Months Tracked
              </span>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            {monthlyTimeline.length > 0 ? (
              <Suspense fallback={<div className="ax-skeleton" style={{ height: chartH }} />}>
                <ApexChart
                  key={`monthly-${chartH}-${monthlyTimeline.map((m) => `${m.month_year}-${m.monthly_surveys}`).join('-')}`}
                  type="area"
                  height={chartH}
                  legend="top"
                  ariaLabel="Monthly surveys area chart"
                  series={[
                    {
                      name: 'Monthly Completed Surveys',
                      data: monthlyTimeline.map((m) => m.monthly_surveys),
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
                      categories: monthlyTimeline.map((m) => m.month_year),
                    },
                    yaxis: { title: { text: 'Surveys (Nos.)', style: { color: 'var(--ax-text-muted)' } } },
                  }}
                />
              </Suspense>
            ) : (
              <div style={{ height: chartH, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--ax-text-muted)', gap: 8 }}>
                <span style={{ fontSize: 'var(--ax-text-sm)', fontWeight: 500 }}>No monthly timeline logs recorded yet.</span>
              </div>
            )}
          </div>
        </section>

        {/* Workflow Milestones */}
        <section className="ax-card ax-col--4" role="region" aria-label="RESCO Survey Milestones">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Lifecycle Stages</span>
              <h2 className="ax-card__title">Survey Milestones</h2>
              <p className="ax-card__subtitle">Technical audit progression stages</p>
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

        {/* 8. Vendorwise Performance Breakdown (from official dashboard response) */}
        {vendorwise.length > 0 && (
          <section className="ax-card ax-col--12" role="region" aria-label="Vendor wise performance table">
            <div className="ax-card__header">
              <div className="ax-card__titles">
                <span className="ax-card__eyebrow" style={{ color: 'var(--asw-primary)' }}>Vendor Bifurcation</span>
                <h2 className="ax-card__title">Contracted Vendor Survey Performance</h2>
                <p className="ax-card__subtitle">Field throughput, audit status and workload per assigned survey partner</p>
              </div>
            </div>
            <div className="ax-table-wrap">
              <table className="ax-table ax-table--hover">
                <thead className="ax-table__head">
                  <tr>
                    <th className="ax-table__th" scope="col">Vendor Name</th>
                    <th className="ax-table__th ax-table__th--num" scope="col">Allocated Sites</th>
                    <th className="ax-table__th ax-table__th--num" scope="col">Survey Conducted</th>
                    <th className="ax-table__th ax-table__th--num" scope="col">Survey Pending</th>
                    <th className="ax-table__th ax-table__th--num" scope="col">Verify Approved</th>
                    <th className="ax-table__th ax-table__th--num" scope="col">In Audit</th>
                    <th className="ax-table__th ax-table__th--num" scope="col">Audit Rejected</th>
                    <th className="ax-table__th ax-table__th--num" scope="col">Completion Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {vendorwise.map((v, i) => {
                    const total = Number(v.total || 0);
                    const done = Number(v.survey_done || 0);
                    const pending = Number(v.survey_pending || 0);
                    const approved = Number(v.survey_verify_complete || 0);
                    const inAudit = Number(v.survey_verify_pending || 0);
                    const rejected = Number(v.survey_verify_reject || 0);
                    const rate = pctOf(done, total);

                    return (
                      <tr
                        key={v.vendor_name || i}
                        className="ax-table__row"
                        style={{ cursor: 'pointer' }}
                        onClick={() =>
                          openDrillDown(
                            `/vendor-management/jammu/survey/resco/status-view?status=total&mode=vendor&value=${encodeURIComponent(
                              v.vendor_name || v.survey_vendor || ''
                            )}`
                          )
                        }
                      >
                        <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                          {v.vendor_name || 'Vendor Partner'}
                        </td>
                        <td className="ax-table__td ax-table__td--num ax-num" style={{ fontWeight: 600 }}>
                          {num(total)}
                        </td>
                        <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-emerald, #10b981)', fontWeight: 600 }}>
                          {num(done)}
                        </td>
                        <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-amber, #f59e0b)' }}>
                          {num(pending)}
                        </td>
                        <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-emerald, #10b981)' }}>
                          {num(approved)}
                        </td>
                        <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-amber, #f59e0b)' }}>
                          {num(inAudit)}
                        </td>
                        <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-red, #ef4444)' }}>
                          {num(rejected)}
                        </td>
                        <td className="ax-table__td ax-table__td--num ax-num">
                          <span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--pill" style={{ fontWeight: 600 }}>
                            {rate}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* 9. Table 1: District Wise Detailed Summary */}
        <section className="ax-card ax-col--12" role="region" aria-label="District wise summary table">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Geographic Breakdown</span>
              <h2 className="ax-card__title">District Wise RESCO Survey Summary</h2>
              <p className="ax-card__subtitle">Allocated sites, completed feasibility, audit status and capacity per district</p>
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
                  onCopy={() => copyToClipboard(tableDistricts, districtCols, 'District Summary')}
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
                  <th className="ax-table__th ax-table__th--num" scope="col">Allocated Sites</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Survey Conducted</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Pending Survey</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Verify Approved</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">In Audit</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Audit Rejected</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Assigned</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Unassigned</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {pagedDistricts.length > 0 ? (
                  pagedDistricts.map((d) => (
                    <tr
                      key={d.district}
                      className="ax-table__row"
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedDistrict(d.district)}
                    >
                      <td className="ax-table__td" style={{ fontWeight: 'var(--ax-weight-semibold)', color: 'var(--ax-text-strong)' }}>
                        <b>{d.district}</b>
                      </td>
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ fontWeight: 600 }}>
                        {num(d.total_sites)}
                      </td>
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-emerald, #10b981)', fontWeight: 600 }}>
                        {num(d.complete)}
                      </td>
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-amber, #f59e0b)' }}>
                        {num(d.pending)}
                      </td>
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-emerald, #10b981)' }}>
                        {num(d.verify_approved)}
                      </td>
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-amber, #f59e0b)' }}>
                        {num(d.verify_pending)}
                      </td>
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-red, #ef4444)' }}>
                        {num(d.verify_reject)}
                      </td>
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--asw-primary)' }}>
                        {num(d.assigned ?? 0)}
                      </td>
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-text-muted)' }}>
                        {num(d.not_assigned ?? 0)}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <Link
                          to={`/vendor-management/jammu/survey/resco/status-view?status=total&mode=district&value=${encodeURIComponent(d.district)}`}
                          className="ax-btn ax-btn--xs ax-btn--secondary"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Status Drill-down
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', padding: '32px', color: 'var(--ax-text-muted)' }}>
                      No district data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="ax-card__footer" style={{ borderTop: '1px solid var(--ax-border, #e2e8f0)', padding: 'var(--ax-space-3) var(--ax-space-4)' }}>
            <div className="ula-pagination-left">
              <Pagination
                currentPage={districtPage}
                pageSize={districtPageSize}
                totalItems={districtTotalItems}
                onPageChange={setDistrictPage}
                onPageSizeChange={setDistrictPageSize}
                pageSizeOptions={[10, 25, 50, 100]}
              />
            </div>
          </div>
        </section>

        {/* 10. Table 2: Recent Feasibility Surveys & Audit Register */}
        <section className="ax-card ax-col--12" role="region" aria-label="Survey site audit register">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Survey Records</span>
              <h2 className="ax-card__title">Recent Technical Feasibility Surveys</h2>
              <p className="ax-card__subtitle">Field audit submissions, load feasibility, electrical specs and verification state</p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                <SearchInput
                  value={surveyQuery}
                  onChange={setSurveyQuery}
                  placeholder="Search site, vendor, department…"
                  ariaLabel="Search surveys"
                />
                <TableExportToolbar
                  onCopy={() => copyToClipboard(tableSurveys, surveyCols, 'Surveys Register')}
                  onExportCSV={() => exportToCSV(tableSurveys, surveyCols, `Jammu_RESCO_Surveys_${stamp}`)}
                  onExportExcel={() => exportToExcel(tableSurveys, surveyCols, `Jammu_RESCO_Surveys_${stamp}`)}
                  onExportPDF={() => exportToPDF(tableSurveys, surveyCols, 'Jammu RESCO Technical Survey Register')}
                />
              </div>
            </div>
          </div>

          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover">
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">ID</th>
                  <th className="ax-table__th" scope="col">Site Name</th>
                  <th className="ax-table__th" scope="col">Vendor Name</th>
                  <th className="ax-table__th" scope="col">District</th>
                  <th className="ax-table__th" scope="col">Department</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Proposed Cap (KW)</th>
                  <th className="ax-table__th" scope="col">Survey Status</th>
                  <th className="ax-table__th" scope="col">Audit Status</th>
                  <th className="ax-table__th" scope="col">BOS Status</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Quick View</th>
                </tr>
              </thead>
              <tbody>
                {pagedSurveys.length > 0 ? (
                  pagedSurveys.map((s) => {
                    const isSurveyDone = Number(s.survey_status) === 1;
                    const vStatus = Number(s.survey_verify_status ?? s.verify_status ?? 0);
                    const isApproved = vStatus === 1;
                    const isRejected = vStatus === 2;
                    const isBosCleared = Number(s.bos_verify_status) === 1 || Boolean(s.bos_file);

                    return (
                      <tr
                        key={s.id}
                        className="ax-table__row"
                        style={{ cursor: 'pointer' }}
                        onClick={() => setSelectedSiteModal(s)}
                      >
                        <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: '11px', color: 'var(--ax-text-muted)' }}>
                          #{s.id}
                        </td>
                        <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                          {s.site_name || `Site #${s.id}`}
                        </td>
                        <td className="ax-table__td" style={{ color: 'var(--ax-text-muted)' }}>
                          {s.vendor_name || s.vendor || 'Unassigned'}
                        </td>
                        <td className="ax-table__td" style={{ fontWeight: 500 }}>
                          {s.district || 'Jammu'}
                        </td>
                        <td className="ax-table__td" style={{ fontSize: '12px', color: 'var(--ax-text-muted)' }}>
                          {s.dept_name || 'Government / Public'}
                        </td>
                        <td className="ax-table__td ax-table__td--num ax-num" style={{ fontWeight: 600 }}>
                          {s.sanction_load || s.connected_load || s.proposed_capacity || s.capacity || '-'} KW
                        </td>
                        <td className="ax-table__td">
                          {isSurveyDone ? (
                            <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill">Done</span>
                          ) : (
                            <span className="ax-badge ax-badge--soft ax-badge--warning ax-badge--pill">Pending</span>
                          )}
                        </td>
                        <td className="ax-table__td">
                          {isApproved ? (
                            <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill">Approved</span>
                          ) : isRejected ? (
                            <span className="ax-badge ax-badge--soft ax-badge--danger ax-badge--pill">Rejected</span>
                          ) : (
                            <span className="ax-badge ax-badge--soft ax-badge--warning ax-badge--pill">In Review</span>
                          )}
                        </td>
                        <td className="ax-table__td">
                          {isBosCleared ? (
                            <span className="ax-badge ax-badge--soft ax-badge--info ax-badge--pill">Cleared</span>
                          ) : (
                            <span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--pill">Pending</span>
                          )}
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="ax-btn ax-btn--xs ax-btn--secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSiteModal(s);
                            }}
                          >
                            View Audit
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', padding: '32px', color: 'var(--ax-text-muted)' }}>
                      No survey records match the current filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="ax-card__footer" style={{ borderTop: '1px solid var(--ax-border, #e2e8f0)', padding: 'var(--ax-space-3) var(--ax-space-4)' }}>
            <div className="ula-pagination-left">
              <Pagination
                currentPage={surveyPage}
                pageSize={surveyPageSize}
                totalItems={surveyTotalItems}
                onPageChange={setSurveyPage}
                onPageSizeChange={setSurveyPageSize}
                pageSizeOptions={[10, 25, 50, 100]}
              />
            </div>
          </div>
        </section>
      </div>

      {/* Quick Audit Site Preview Modal */}
      {selectedSiteModal && (
        <Modal
          open={true}
          labelledBy="site-preview-modal-title"
          onClose={() => setSelectedSiteModal(null)}
        >
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--ax-border, #e2e8f0)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 id="site-preview-modal-title" style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
              Technical Survey Feasibility: {selectedSiteModal.site_name || `Site #${selectedSiteModal.id}`}
            </h3>
            <button
              type="button"
              onClick={() => setSelectedSiteModal(null)}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18, color: '#64748b' }}
            >
              ✕
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="ax-grid ax-grid--2" style={{ gap: 12 }}>
              <div style={{ padding: 12, background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 8 }}>
                <small style={{ color: 'var(--ax-text-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Site & Location Details</small>
                <div style={{ marginTop: 6, fontSize: 13, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div><b>District:</b> {selectedSiteModal.district || 'Jammu'}</div>
                  <div><b>Department:</b> {selectedSiteModal.dept_name || 'N/A'}</div>
                  <div><b>WO No:</b> {selectedSiteModal.wo_no || 'N/A'}</div>
                  <div><b>CA No:</b> {selectedSiteModal.ca_no || 'N/A'}</div>
                  <div><b>Address:</b> {selectedSiteModal.address || selectedSiteModal.site_address || 'N/A'}</div>
                  <div><b>Contact:</b> {selectedSiteModal.contact_person || '—'} ({selectedSiteModal.contact_number || '—'})</div>
                  <div><b>Coordinates:</b> {selectedSiteModal.latitude || '—'}, {selectedSiteModal.longitude || '—'}</div>
                </div>
              </div>

              <div style={{ padding: 12, background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 8 }}>
                <small style={{ color: 'var(--ax-text-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Electrical & Rooftop Feasibility</small>
                <div style={{ marginTop: 6, fontSize: 13, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div><b>Sanction Load:</b> {selectedSiteModal.sanction_load || '-'} KW</div>
                  <div><b>Connected Load:</b> {selectedSiteModal.connected_load || '-'} KW</div>
                  <div><b>Connection Phase:</b> {selectedSiteModal.connection_phase || '3 Phase'}</div>
                  <div><b>Roof Condition:</b> {selectedSiteModal.roof_condition || 'RCC / Flat'}</div>
                  <div><b>Roof Access:</b> {selectedSiteModal.roof_access || 'Yes'}</div>
                  <div><b>Available Roof Space:</b> {selectedSiteModal.free_space_solar || selectedSiteModal.area_roof || '-'} Sq. Ft.</div>
                  <div><b>Site Feasible:</b> {selectedSiteModal.site_feasible || 'Yes'}</div>
                </div>
              </div>
            </div>

            {/* Media Gallery / Dossier Photos */}
            <div>
              <small style={{ color: 'var(--ax-text-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Site Dossier Images</small>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10, marginTop: 8 }}>
                {[
                  { label: 'Building Front', src: selectedSiteModal.building_image || selectedSiteModal.image1 },
                  { label: 'Roof Overview', src: selectedSiteModal.roof_image || selectedSiteModal.image2 },
                  { label: 'Control Room / LTDB', src: selectedSiteModal.control_room_image || selectedSiteModal.image3 },
                  { label: 'Other Image', src: selectedSiteModal.image4 || selectedSiteModal.other_image },
                ].map((m, idx) => {
                  const resolved = resolveJammuSurveyMediaUrl(m.src);
                  return (
                    <div key={idx} style={{ border: '1px solid var(--ax-border, #e2e8f0)', borderRadius: 6, overflow: 'hidden', background: '#fff' }}>
                      <div style={{ height: 80, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {resolved ? (
                          <img
                            src={resolved}
                            alt={m.label}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <span style={{ fontSize: 10, color: 'var(--ax-text-muted)' }}>No Image</span>
                        )}
                      </div>
                      <div style={{ padding: '4px 6px', fontSize: 11, textAlign: 'center', background: '#fafafa', borderTop: '1px solid #f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {m.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid var(--ax-border, #e2e8f0)' }}>
              <div>
                <span style={{ fontSize: 12, color: 'var(--ax-text-muted)' }}>
                  Audit Status:{' '}
                  <b>
                    {Number(selectedSiteModal.survey_verify_status ?? selectedSiteModal.verify_status) === 1
                      ? 'Approved'
                      : Number(selectedSiteModal.survey_verify_status ?? selectedSiteModal.verify_status) === 2
                      ? 'Rejected'
                      : 'In Review'}
                  </b>
                </span>
              </div>
              <div className="ax-cluster" style={{ gap: 8 }}>
                <Link
                  to="/vendor-management/jammu/survey/resco/verify-survey"
                  className="ax-btn ax-btn--sm ax-btn--primary"
                  onClick={() => setSelectedSiteModal(null)}
                >
                  Open in Verification Desk →
                </Link>
                <button
                  type="button"
                  className="ax-btn ax-btn--sm ax-btn--secondary"
                  onClick={() => setSelectedSiteModal(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default RescoDashboard;
