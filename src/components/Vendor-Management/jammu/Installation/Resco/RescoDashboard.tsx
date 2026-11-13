import { lazy, Suspense, useCallback, useDeferredValue, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  jammuRescoService,
  type JammuRescoDashboardData,
  type JammuRescoDistrictInstallItem,
  type JammuRescoMonthlyItem,
} from '../../../../V-Portal/jammu/jammu-services';
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

// Palette constants matching Solar ERP design language
const LIGHT_BLUE = '#2563eb';
const LIGHT_GREEN = '#10b981';
const LIGHT_CYAN = '#0891b2';
const LIGHT_AMBER = '#f59e0b';
const LIGHT_VIOLET = '#7c3aed';
const LIGHT_RED = '#ef4444';

interface JammuRescoSummary {
  site_count: number;
  complete: number;
  pending: number;
  material_dispatch: number;
  material_pending: number;
  verify_approved: number;
  verify_pending: number;
  verify_reject: number;
  claim_applicable: number;
  claim_raised: number;
  inst_pay80_done: number;
  inst_pay20_done: number;
}

interface DistrictRow extends JammuRescoSummary {
  district: string;
}

const n = (v: unknown) => Number(v ?? 0) || 0;
const num = (x: unknown) => n(x).toLocaleString('en-IN');
const pctOf = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : 0);
const pad = (x: number) => String(x).padStart(2, '0');
const fmtDate = (d: Date | null) => (d ? `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}` : '—');
const fmtTime = (d: Date) => d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
const escapeHtml = (s: string) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const fmtMonth = (s: string) => {
  const [y, m] = String(s || '').split('-');
  const mi = Number(m);
  if (!y || !mi) return s || '';
  return `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][mi - 1]} ${y}`;
};

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

const toSummary = (o: any): JammuRescoSummary => {
  const src = o?.resco || o?.data?.resco || o?.data || o || {};
  const total = n(src?.total ?? src?.site_count);
  const complete = n(src?.complete ?? src?.inst_complete);
  const pending = n(src?.pending ?? (total ? Math.max(0, total - complete) : 0));
  const matDisp = n(src?.material_dispatch);
  const matPend = n(src?.material_pending ?? (total && matDisp ? Math.max(0, total - matDisp) : 0));
  const vApp = n(src?.verify_approved);
  const vPend = n(src?.verify_pending);
  const vRej = n(src?.verify_reject);
  const cApp = n(src?.claim_applicable ?? complete);
  const c1 = n(src?.inst_claim1_approved);
  const c2 = n(src?.inst_claim2_approved);
  const c3 = n(src?.inst_claim3_approved);
  const cRaised = n(src?.claim_raised ?? c1 + c2 + c3);
  const pay80 = n(src?.inst_pay80_done ?? c1);
  const pay20 = n(src?.inst_pay20_done ?? c2);

  return {
    site_count: total,
    complete,
    pending,
    material_dispatch: matDisp,
    material_pending: matPend,
    verify_approved: vApp,
    verify_pending: vPend,
    verify_reject: vRej,
    claim_applicable: cApp,
    claim_raised: cRaised,
    inst_pay80_done: pay80,
    inst_pay20_done: pay20,
  };
};

/* ───────── Responsive page CSS (Solar ERP reference, all columns scrollable) ───────── */
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

  /* Card header */
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
  .solar-erp-page .ax-table { min-width: 850px; }
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

  .admin-quick-links-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: var(--ax-space-5, 20px);
  }
  @media (max-width: 1024px) {
    .admin-quick-links-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
  @media (max-width: 600px) {
    .admin-quick-links-grid { grid-template-columns: 1fr; }
  }

  .admin-quick-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-radius: 12px;
    background: var(--ax-surface-solid, #ffffff);
    border: 1px solid var(--ax-border, #e2e8f0);
    text-decoration: none;
    color: var(--ax-text, #1e293b);
    transition: all 0.15s ease;
  }
  .admin-quick-card:hover {
    transform: translateY(-1px);
    border-color: #2563eb;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.08);
  }
  .admin-quick-card__icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

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
const I_DOC = svg(<><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" /><path d="M9 9l1 0" /><path d="M9 13l6 0" /><path d="M9 17l6 0" /></>);
const I_CREDIT = svg(<><rect x="3" y="5" width="18" height="14" rx="3" /><line x1="3" y1="10" x2="21" y2="10" /><line x1="7" y1="15" x2="7.01" y2="15" /><line x1="11" y1="15" x2="13" y2="15" /></>);
const I_TRUCK = svg(<><path d="M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /><path d="M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /><path d="M5 17h-2v-11a1 1 0 0 1 1 -1h9v12m-4 0h6m4 0h2v-6h-4l-2 -3h-4v9" /></>);
const ICON_REFRESH = (
  <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" /><path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" /></svg>
);

/* ───────── KPI Card Component ───────── */
interface KpiProps {
  icon: ReactNode;
  tone: 'accent' | 'cyan' | 'emerald' | 'amber' | 'violet' | 'red';
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
  red: { bg: 'color-mix(in oklab, var(--ax-danger, #ef4444) 14%, transparent)', fg: '#dc2626', apex: '#ef4444' },
};

function Kpi({ icon, tone, label, value, unit, sub, badge, spark, sparkType = 'line', onClick }: KpiProps) {
  const t = TONE[tone];
  const isInteractive = Boolean(onClick);

  return (
    <div
      className={`ax-card ax-kpi ax-col--3 ${isInteractive ? 'asw-interactive-kpi' : ''}`}
      onClick={onClick}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={isInteractive ? (e) => (e.key === 'Enter' || e.key === ' ' ? onClick!() : null) : undefined}
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        minHeight: 140,
        padding: '16px 20px',
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span className="ax-kpi__label" style={{ fontWeight: 600, color: 'var(--ax-text-muted)' }}>{label}</span>
          <span
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: t.bg,
              color: t.fg,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <span style={{ width: 17, height: 17, display: 'inline-flex' }}>{icon}</span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span className="ax-kpi__value" style={{ fontSize: 26, fontWeight: 800, color: t.fg, fontFamily: 'var(--ax-font-display)' }}>
            {value}
          </span>
          {unit && <span style={{ fontSize: 13, color: 'var(--ax-text-muted)', fontWeight: 500 }}>{unit}</span>}
          {badge && (
            <span className={`ax-badge ax-badge--soft ax-badge--${tone === 'red' ? 'danger' : tone === 'emerald' ? 'success' : 'info'}`} style={{ marginLeft: 'auto', fontSize: 11 }}>
              {badge}
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
        <span style={{ fontSize: 12, color: 'var(--ax-text-muted)' }}>{sub}</span>
        {spark && spark.length > 1 && (
          <div style={{ width: 68, height: 26 }}>
            <Suspense fallback={null}>
              <ApexChart
                type={sparkType}
                height={26}
                width={68}
                series={[{ name: label, data: spark }]}
                options={{
                  chart: { sparkline: { enabled: true }, animations: { enabled: false } },
                  stroke: { curve: 'smooth', width: 2 },
                  colors: [t.apex],
                  tooltip: { enabled: false },
                }}
              />
            </Suspense>
          </div>
        )}
      </div>
    </div>
  );
}

export const RescoDashboard: React.FC = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<JammuRescoDashboardData | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  // Filters
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);

  // Chart responsive height
  const chartHeight = useChartHeight(280, 220);

  // Load Dashboard Data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await jammuRescoService.getDashboard();
      setData(res);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('[Admin Jammu RESCO Dashboard] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Overall Project Summary
  const summary = useMemo<JammuRescoSummary>(() => {
    return toSummary(data);
  }, [data]);

  // District Breakdown Rows
  const districtRows = useMemo<DistrictRow[]>(() => {
    const list: JammuRescoDistrictInstallItem[] = data?.district_inst_complete || [];
    return list.map((item) => {
      const distName = item.district || 'Unassigned';
      const sum = toSummary(item);
      return {
        district: distName,
        ...sum,
      };
    });
  }, [data]);

  // Unique Districts List
  const districtOptions = useMemo(() => {
    return districtRows.map((r) => r.district).sort();
  }, [districtRows]);

  // Filtered District Table
  const filteredDistricts = useMemo(() => {
    let out = districtRows;
    if (selectedDistrict !== 'all') {
      out = out.filter((d) => d.district.toLowerCase() === selectedDistrict.toLowerCase());
    }
    if (deferredSearch.trim()) {
      const q = deferredSearch.trim().toLowerCase();
      out = out.filter((d) => d.district.toLowerCase().includes(q));
    }
    return out;
  }, [districtRows, selectedDistrict, deferredSearch]);

  const { paginatedData, currentPage, pageSize, totalItems, setPage, setPageSize } = usePagination({
    data: filteredDistricts,
    initialPageSize: 10,
  });

  // Monthly Trend Data
  const monthlyData: JammuRescoMonthlyItem[] = useMemo(() => {
    return data?.monthly_data || [];
  }, [data]);

  // Sparklines for KPI Cards
  const sparkTotals = useMemo(() => monthlyData.map((m) => n(m.count)), [monthlyData]);
  const sparkComplete = useMemo(() => monthlyData.map((m) => n(m.inst_complete)), [monthlyData]);

  // Export Columns definition
  const exportCols: ExportColumn<DistrictRow>[] = useMemo(
    () => [
      { header: 'District', accessor: 'district' },
      { header: 'Allocated Sites', accessor: 'site_count' },
      { header: 'Completed', accessor: 'complete' },
      { header: 'Pending', accessor: 'pending' },
      { header: 'Material Dispatched', accessor: 'material_dispatch' },
      { header: 'Verify Approved', accessor: 'verify_approved' },
      { header: 'Verify Pending', accessor: 'verify_pending' },
      { header: 'Stage 1 (80%) Paid', accessor: 'inst_pay80_done' },
      { header: 'Stage 2 (20%) Paid', accessor: 'inst_pay20_done' },
    ],
    []
  );

  const getExportValue = <T,>(row: T, column: ExportColumn<T>, index: number) => {
    if (typeof column.accessor === 'function') return column.accessor(row, index);
    return (row as Record<string, any>)[column.accessor as string] ?? '';
  };
  const escapeExportValue = (value: unknown): string => (value === null || value === undefined ? '' : String(value));

  const downloadTextFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
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
    const headerRow = columns.map((c) => `"${escapeExportValue(c.header)}"`).join(',');
    const rows = list.map((row, index) =>
      columns.map((c) => `"${escapeExportValue(getExportValue(row, c, index)).replace(/"/g, '""')}"`).join(',')
    );
    const csv = [headerRow, ...rows].join('\r\n');
    downloadTextFile(`\ufeff${csv}`, `${filename}.csv`, 'text/csv');
  };

  const exportToExcel = <T,>(list: T[], columns: ExportColumn<T>[], filename: string) => {
    if (!list.length || !columns.length) return;
    const tableHtml = `<table border="1"><thead><tr>${columns.map((c) => `<th>${escapeHtml(escapeExportValue(c.header))}</th>`).join('')}</tr></thead><tbody>${list.map((row, idx) => `<tr>${columns.map((c) => `<td>${escapeHtml(escapeExportValue(getExportValue(row, c, idx)))}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8" /></head><body>${tableHtml}</body></html>`;
    downloadTextFile(`\ufeff${html}`, `${filename}.xls`, 'application/vnd.ms-excel');
  };

  const exportToPDF = <T,>(list: T[], columns: ExportColumn<T>[], title: string) => {
    if (!list.length || !columns.length) return;
    const body = list.map((row, idx) => columns.map((c) => escapeHtml(escapeExportValue(getExportValue(row, c, idx)))));
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

  const copyToClipboard = async <T,>(list: T[], columns: ExportColumn<T>[]) => {
    if (!list.length || !columns.length) return;
    const t = [
      columns.map((c) => c.header).join('\t'),
      ...list.map((row, idx) => columns.map((c) => escapeExportValue(getExportValue(row, c, idx))).join('\t')),
    ].join('\n');
    try {
      await navigator.clipboard.writeText(t);
    } catch {}
  };

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="Jammu RESCO - Installation Dashboard"
        subtitle="Executive administrative overview of rooftop solar RESCO projects, district distribution, verification progress, and milestone payments"
        breadcrumbs={[
          { label: 'Home', href: '/vendor-management' },
          { label: 'Jammu' },
          { label: 'Installation' },
          { label: 'RESCO' },
          { label: 'Dashboard' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--ax-space-2, 8px)' }}>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={loadData}
              disabled={loading}
              title="Refresh dashboard metrics"
            >
              {ICON_REFRESH}
              <span>{loading ? 'Refreshing…' : 'Refresh'}</span>
            </button>
            <Link
              to="/vendor-management/jammu/installation/resco/assign-installation"
              className="ax-btn ax-btn--primary ax-btn--sm"
            >
              + Assign Installation
            </Link>
          </div>
        }
      />

      {/* ── Admin Submodule Quick Navigation Grid ── */}
      <div className="admin-quick-links-grid">
        <Link to="/vendor-management/jammu/installation/resco/assign-installation" className="admin-quick-card">
          <div className="admin-quick-card__icon" style={{ background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb' }}>
            {I_BOLT}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>Assign Installation</div>
            <div style={{ fontSize: 11, color: 'var(--ax-text-muted)' }}>Create site work orders</div>
          </div>
        </Link>

        <Link to="/vendor-management/jammu/installation/resco/view-assign-installation" className="admin-quick-card">
          <div className="admin-quick-card__icon" style={{ background: 'rgba(8, 145, 178, 0.1)', color: '#0891b2' }}>
            {I_PIN}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>View Assigned</div>
            <div style={{ fontSize: 11, color: 'var(--ax-text-muted)' }}>Track vendor allocations</div>
          </div>
        </Link>

        <Link to="/vendor-management/jammu/installation/resco/view-assign-vendor-installation" className="admin-quick-card">
          <div className="admin-quick-card__icon" style={{ background: 'rgba(217, 119, 6, 0.1)', color: '#d97706' }}>
            {I_TRUCK}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>Vendor Installation</div>
            <div style={{ fontSize: 11, color: 'var(--ax-text-muted)' }}>Equipment & serial capture</div>
          </div>
        </Link>

        <Link to="/vendor-management/jammu/installation/resco/verify-installation" className="admin-quick-card">
          <div className="admin-quick-card__icon" style={{ background: 'rgba(22, 163, 74, 0.1)', color: '#16a34a' }}>
            {I_DONE}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>Verify Installation</div>
            <div style={{ fontSize: 11, color: 'var(--ax-text-muted)' }}>Approve or reject QA checks</div>
          </div>
        </Link>

        <Link to="/vendor-management/jammu/installation/resco/verify-document" className="admin-quick-card">
          <div className="admin-quick-card__icon" style={{ background: 'rgba(124, 58, 237, 0.1)', color: '#7c3aed' }}>
            {I_DOC}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>Verify Documents</div>
            <div style={{ fontSize: 11, color: 'var(--ax-text-muted)' }}>CEIG, net-metering & commissioning</div>
          </div>
        </Link>

        <Link to="/vendor-management/jammu/installation/resco/view-claim" className="admin-quick-card">
          <div className="admin-quick-card__icon" style={{ background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb' }}>
            {I_CREDIT}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>View Claims</div>
            <div style={{ fontSize: 11, color: 'var(--ax-text-muted)' }}>Milestone claim audit (40/30/30)</div>
          </div>
        </Link>

        <Link to="/vendor-management/jammu/installation/resco/view-payment" className="admin-quick-card">
          <div className="admin-quick-card__icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            {I_SHIELD}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>View Payments</div>
            <div style={{ fontSize: 11, color: 'var(--ax-text-muted)' }}>Disbursements & UTR tracking</div>
          </div>
        </Link>

        <Link to="/vendor-management/jammu/installation/resco/view-bills" className="admin-quick-card">
          <div className="admin-quick-card__icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
            {I_CLOCK}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>Monthly Bills</div>
            <div style={{ fontSize: 11, color: 'var(--ax-text-muted)' }}>Generation & billing records</div>
          </div>
        </Link>
      </div>

      {/* ── Top Metric KPI Cards Row 1 ── */}
      <div className="ax-grid ax-dash-grid" style={{ marginBottom: 'var(--ax-space-4, 16px)' }}>
        <Kpi
          tone="accent"
          label="Total Allocated Sites"
          value={num(summary.site_count)}
          sub="Rooftop RESCO projects"
          icon={I_BOLT}
          spark={sparkTotals}
          sparkType="bar"
          onClick={() => navigate('/vendor-management/jammu/installation/resco/view-assign-installation')}
        />

        <Kpi
          tone="emerald"
          label="Installation Completed"
          value={num(summary.complete)}
          unit={`(${pctOf(summary.complete, summary.site_count)}%)`}
          sub="Plant executed with evidence"
          icon={I_DONE}
          spark={sparkComplete}
          sparkType="line"
          onClick={() => navigate('/vendor-management/jammu/installation/resco/verify-installation')}
        />

        <Kpi
          tone="amber"
          label="Pending Installation"
          value={num(summary.pending)}
          unit={`(${pctOf(summary.pending, summary.site_count)}%)`}
          sub="Awaiting site completion"
          icon={I_CLOCK}
          onClick={() => navigate('/vendor-management/jammu/installation/resco/view-assign-installation')}
        />

        <Kpi
          tone="cyan"
          label="Material Dispatched"
          value={num(summary.material_dispatch)}
          unit={`(${pctOf(summary.material_dispatch, summary.site_count)}%)`}
          sub="Modules & BOS at site"
          icon={I_TRUCK}
          onClick={() => navigate('/vendor-management/jammu/installation/resco/verify-document')}
        />
      </div>

      {/* ── Top Metric KPI Cards Row 2 ── */}
      <div className="ax-grid ax-dash-grid" style={{ marginBottom: 'var(--ax-space-5, 20px)' }}>
        <Kpi
          tone="emerald"
          label="Verification Approved"
          value={num(summary.verify_approved)}
          unit={`(${pctOf(summary.verify_approved, summary.complete)}%)`}
          sub="Audited & authorized"
          icon={I_SHIELD}
          onClick={() => navigate('/vendor-management/jammu/installation/resco/verify-installation')}
        />

        <Kpi
          tone="amber"
          label="Verification Pending"
          value={num(summary.verify_pending)}
          sub="Inspection desk queue"
          icon={I_CLOCK}
          onClick={() => navigate('/vendor-management/jammu/installation/resco/verify-installation')}
        />

        <Kpi
          tone="violet"
          label="Stage 1 (80%) Paid"
          value={num(summary.inst_pay80_done)}
          sub="Milestone 1 settled"
          icon={I_CREDIT}
          onClick={() => navigate('/vendor-management/jammu/installation/resco/view-payment')}
        />

        <Kpi
          tone="emerald"
          label="Stage 2 (20%) Paid"
          value={num(summary.inst_pay20_done)}
          sub="Final release completed"
          icon={I_DONE}
          onClick={() => navigate('/vendor-management/jammu/installation/resco/view-payment')}
        />
      </div>

      {/* ── Monthly Progress Analytics & Trends ── */}
      {monthlyData.length > 0 && (
        <section className="ax-card ax-col--12" style={{ marginBottom: 'var(--ax-space-5, 20px)' }}>
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">Monthly Installation Execution Trends</h2>
              <p className="ax-card__subtitle">Allocated sites vs field installations completed across months</p>
            </div>
          </div>
          <div className="ax-card__body">
            <Suspense
              fallback={
                <div style={{ height: chartHeight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="ax-spinner" />
                </div>
              }
            >
              <ApexChart
                type="area"
                height={chartHeight}
                series={[
                  { name: 'Allocated Sites', data: monthlyData.map((m) => n(m.count)) },
                  { name: 'Completed Installations', data: monthlyData.map((m) => n(m.inst_complete)) },
                ]}
                options={{
                  chart: { toolbar: { show: false }, fontFamily: 'inherit' },
                  dataLabels: { enabled: false },
                  stroke: { curve: 'smooth', width: 2 },
                  colors: [LIGHT_BLUE, LIGHT_GREEN],
                  fill: {
                    type: 'gradient',
                    gradient: { opacityFrom: 0.45, opacityTo: 0.05 },
                  },
                  xaxis: {
                    categories: monthlyData.map((m) => fmtMonth(m.month)),
                  },
                  yaxis: {
                    labels: { formatter: (v: number) => num(v) },
                  },
                  legend: { position: 'top', horizontalAlign: 'right' },
                }}
              />
            </Suspense>
          </div>
        </section>
      )}

      {/* ── District Breakdown Table ── */}
      <section className="ax-card ax-col--12" role="region" aria-label="District RESCO Progress Table">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">District RESCO Installation Progress</h2>
            <p className="ax-card__subtitle">
              <span className="ax-num">{filteredDistricts.length}</span> of <span className="ax-num">{districtRows.length}</span> districts
              {lastRefreshed && (
                <span style={{ marginLeft: 8 }}>· Refreshed {fmtDate(lastRefreshed)} at {fmtTime(lastRefreshed)}</span>
              )}
            </p>
          </div>

          <div className="ax-card__actions">
            <div className="ax-cluster" style={{ gap: 8, flexWrap: 'nowrap' }}>
              {districtOptions.length > 0 && (
                <select
                  className="ax-input ax-input--sm"
                  style={{ width: 150, height: 32 }}
                  value={selectedDistrict}
                  onChange={(e) => {
                    setSelectedDistrict(e.target.value);
                    setPage(1);
                  }}
                  aria-label="Filter by district"
                >
                  <option value="all">All Districts ({districtOptions.length})</option>
                  {districtOptions.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              )}

              <SearchInput
                value={search}
                onChange={(v) => {
                  setSearch(v);
                  setPage(1);
                }}
                placeholder="Search district…"
                size="sm"
                ariaLabel="Search district table"
              />

              <TableExportToolbar
                onCopy={() => copyToClipboard(filteredDistricts, exportCols)}
                onExportCSV={() => exportToCSV(filteredDistricts, exportCols, 'Jammu_RESCO_District_Progress')}
                onExportExcel={() => exportToExcel(filteredDistricts, exportCols, 'Jammu_RESCO_District_Progress')}
                onExportPDF={() => exportToPDF(filteredDistricts, exportCols, 'Jammu RESCO District Progress Report')}
              />
            </div>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap' }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th" scope="col">Sr. No.</th>
                <th className="ax-table__th" scope="col">District</th>
                <th className="ax-table__th" scope="col" style={{ textAlign: 'right' }}>Allocated Sites</th>
                <th className="ax-table__th" scope="col" style={{ textAlign: 'right' }}>Installed</th>
                <th className="ax-table__th" scope="col" style={{ textAlign: 'right' }}>Pending</th>
                <th className="ax-table__th" scope="col" style={{ textAlign: 'right' }}>Material Disp.</th>
                <th className="ax-table__th" scope="col" style={{ textAlign: 'right' }}>Verify Appr.</th>
                <th className="ax-table__th" scope="col" style={{ textAlign: 'right' }}>Verify Pend.</th>
                <th className="ax-table__th" scope="col" style={{ textAlign: 'right' }}>Stage 1 (80%)</th>
                <th className="ax-table__th" scope="col" style={{ textAlign: 'right' }}>Stage 2 (20%)</th>
                <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody aria-busy={loading}>
              {loading && (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: 24 }}>
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading Jammu RESCO installation progress…
                  </td>
                </tr>
              )}
              {!loading && filteredDistricts.length === 0 && (
                <tr>
                  <td colSpan={11} style={{ padding: 0 }}>
                    <TableEmptyState
                      title="No district records found"
                      message={search || selectedDistrict !== 'all' ? 'Try clearing your district filter or search query.' : 'No district progress records available.'}
                      onClear={() => {
                        setSearch('');
                        setSelectedDistrict('all');
                      }}
                    />
                  </td>
                </tr>
              )}
              {!loading &&
                paginatedData.map((row, idx) => (
                  <tr key={row.district || idx} className="ax-table__row">
                    <td className="ax-table__td ax-num">{(currentPage - 1) * pageSize + idx + 1}</td>
                    <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                      {row.district}
                    </td>
                    <td className="ax-table__td ax-num" style={{ textAlign: 'right', fontWeight: 700 }}>
                      {num(row.site_count)}
                    </td>
                    <td className="ax-table__td ax-num" style={{ textAlign: 'right', color: '#16a34a', fontWeight: 600 }}>
                      {num(row.complete)}
                    </td>
                    <td className="ax-table__td ax-num" style={{ textAlign: 'right', color: '#d97706' }}>
                      {num(row.pending)}
                    </td>
                    <td className="ax-table__td ax-num" style={{ textAlign: 'right' }}>
                      {num(row.material_dispatch)}
                    </td>
                    <td className="ax-table__td ax-num" style={{ textAlign: 'right', color: '#16a34a' }}>
                      {num(row.verify_approved)}
                    </td>
                    <td className="ax-table__td ax-num" style={{ textAlign: 'right', color: '#d97706' }}>
                      {num(row.verify_pending)}
                    </td>
                    <td className="ax-table__td ax-num" style={{ textAlign: 'right', color: '#7c3aed' }}>
                      {num(row.inst_pay80_done)}
                    </td>
                    <td className="ax-table__td ax-num" style={{ textAlign: 'right', color: '#16a34a' }}>
                      {num(row.inst_pay20_done)}
                    </td>
                    <td className="ax-table__td" style={{ textAlign: 'center' }}>
                      <Link
                        to={`/vendor-management/jammu/installation/resco/verify-installation`}
                        className="ax-btn ax-btn--ghost ax-btn--sm"
                        style={{ padding: '2px 8px', fontSize: 11 }}
                      >
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* ── Pagination (Left-aligned) ── */}
        <div className="ax-card__footer">
          <div className="ula-pagination-left">
            <Pagination
              currentPage={currentPage}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default RescoDashboard;
