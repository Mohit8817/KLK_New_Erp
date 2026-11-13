import { lazy, Suspense, useCallback, useDeferredValue, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  jammuRescoService,
  normalizeRescoStatus,
  type JammuRescoDashboardData,
  type JammuRescoDistrictInstallItem,
  type JammuRescoMonthlyItem,
} from '../../jammu-services';
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

/* ───────── SVG Icons matching Reference ───────── */
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
const ICON_FILTER = (
  <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 4h16v2.172a2 2 0 0 1 -.586 1.414l-4.828 4.828v7.586l-4 -2v-5.586l-4.828 -4.828a2 2 0 0 1 -.586 -1.414v-2.172z" /></svg>
);
const ICON_REFRESH = (
  <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" /><path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" /></svg>
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

export function RescoDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<JammuRescoDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  // Filter states
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [tableQuery, setTableQuery] = useState<string>('');

  // Responsive chart heights
  const chartH = useChartHeight(320, 260);
  const donutH = useChartHeight(230, 210);

  // Load live data
  const loadDashboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setLoading(true);
    setApiError(null);
    try {
      const resp = await jammuRescoService.getDashboard();
      if (resp) {
        setData(resp);
        setUpdatedAt(new Date());
      } else {
        setApiError('Unable to load Jammu RESCO dashboard data.');
      }
    } catch (err: any) {
      console.warn('[Jammu RESCO Dashboard] load error:', err);
      setApiError(err?.message || 'Failed to fetch Jammu RESCO installation dashboard data.');
    } finally {
      setLoading(false);
      if (isRefresh) setTimeout(() => setIsRefreshing(false), 300);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Drilldown navigation
  const openDrillDown = (statusKey: string, district?: string) => {
    const norm = normalizeRescoStatus(statusKey);
    const targetDistrict = district && district !== 'All' ? district : (selectedDistrict !== 'All' ? selectedDistrict : undefined);
    const params = new URLSearchParams();
    params.set('status', norm);
    if (targetDistrict) {
      params.set('district', String(targetDistrict));
    }
    navigate(`/v/jammu/installation/resco/status-view?${params.toString()}`);
  };

  /* ───────── District rows resolution ───────── */
  const districtwise: DistrictRow[] = useMemo(() => {
    const map = new Map<string, any>();

    const dInstall = Array.isArray(data?.district_install) ? data!.district_install : [];
    dInstall.forEach((item: any) => {
      const dist = String(item?.district || '').trim();
      if (!dist) return;
      map.set(dist.toLowerCase(), { ...item, district: dist });
    });

    const dWise = Array.isArray(data?.districtwise) ? data!.districtwise : [];
    dWise.forEach((item: any) => {
      const dist = String(item?.district || '').trim();
      if (!dist) return;
      const key = dist.toLowerCase();
      const existing = map.get(key) || { district: dist };
      map.set(key, { ...existing, ...item, district: dist });
    });

    const list = Array.from(map.values());
    if (list.length === 0 && Array.isArray((data as any)?.districts)) {
      (data as any).districts.forEach((d: any) => {
        const dist = String(d?.district || '').trim();
        if (dist) list.push({ district: dist, ...toSummary(d) });
      });
    }

    return list.map((d: any) => {
      const summary = toSummary(d);
      return {
        district: String(d?.district ?? ''),
        ...summary,
        site_count: summary.site_count || n(d?.total),
        complete: summary.complete || n(d?.complete),
        pending: summary.pending || n(d?.pending),
      };
    });
  }, [data]);

  const monthlyInstallations: JammuRescoMonthlyItem[] = useMemo(() => {
    const list =
      (data as any)?.district_installation_month ||
      (data as any)?.monthly_installations ||
      (data as any)?.monthly;
    if (Array.isArray(list)) {
      return list.map((m: any) => ({
        month_year: String(m?.month_year || m?.month || ''),
        monthly_installations: n(m?.monthly_installations ?? m?.count),
      }));
    }
    return [];
  }, [data]);

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
      else if (selectedStatus === 'MaterialDispatch') matchStatus = (d.material_dispatch || 0) > 0;
      else if (selectedStatus === 'VerifyApproved') matchStatus = (d.verify_approved || 0) > 0;
      else if (selectedStatus === 'VerifyPending') matchStatus = (d.verify_pending || 0) > 0;
      else if (selectedStatus === 'VerifyReject') matchStatus = (d.verify_reject || 0) > 0;
      else if (selectedStatus === 'ClaimApproved') matchStatus = (d.claim_raised || 0) > 0;
      else if (selectedStatus === 'PayDone') matchStatus = (d.inst_pay80_done || 0) > 0 || (d.inst_pay20_done || 0) > 0;
      return matchDistrict && matchStatus;
    });
  }, [districtwise, selectedDistrict, selectedStatus]);

  const rawSummary: JammuRescoSummary = useMemo(() => toSummary(data), [data]);

  // Dynamic metrics: aggregate from filtered districts when any filter is active
  const s: JammuRescoSummary = useMemo(() => {
    if (selectedDistrict === 'All' && selectedStatus === 'All') {
      return rawSummary;
    }
    if (filteredDistricts.length === 0) {
      return {
        site_count: 0,
        complete: 0,
        pending: 0,
        material_dispatch: 0,
        material_pending: 0,
        verify_approved: 0,
        verify_pending: 0,
        verify_reject: 0,
        claim_applicable: 0,
        claim_raised: 0,
        inst_pay80_done: 0,
        inst_pay20_done: 0,
      };
    }
    return filteredDistricts.reduce(
      (acc, d) => ({
        site_count: acc.site_count + (Number(d.site_count) || 0),
        complete: acc.complete + (Number(d.complete) || 0),
        pending: acc.pending + (Number(d.pending) || 0),
        material_dispatch: acc.material_dispatch + (Number(d.material_dispatch) || 0),
        material_pending: acc.material_pending + (Number(d.material_pending) || 0),
        verify_approved: acc.verify_approved + (Number(d.verify_approved) || 0),
        verify_pending: acc.verify_pending + (Number(d.verify_pending) || 0),
        verify_reject: acc.verify_reject + (Number(d.verify_reject) || 0),
        claim_applicable: acc.claim_applicable + (Number(d.claim_applicable) || 0),
        claim_raised: acc.claim_raised + (Number(d.claim_raised) || 0),
        inst_pay80_done: acc.inst_pay80_done + (Number(d.inst_pay80_done) || 0),
        inst_pay20_done: acc.inst_pay20_done + (Number(d.inst_pay20_done) || 0),
      }),
      {
        site_count: 0,
        complete: 0,
        pending: 0,
        material_dispatch: 0,
        material_pending: 0,
        verify_approved: 0,
        verify_pending: 0,
        verify_reject: 0,
        claim_applicable: 0,
        claim_raised: 0,
        inst_pay80_done: 0,
        inst_pay20_done: 0,
      }
    );
  }, [rawSummary, filteredDistricts, selectedDistrict, selectedStatus]);

  const filtersActive = selectedDistrict !== 'All' || selectedStatus !== 'All';

  // Table search & pagination for District Table
  const deferredDistrictQuery = useDeferredValue(tableQuery);
  const tableDistricts = useMemo(() => {
    const q = deferredDistrictQuery.trim().toLowerCase();
    return filteredDistricts.filter((d) => !q || d.district.toLowerCase().includes(q));
  }, [filteredDistricts, deferredDistrictQuery]);

  const {
    paginatedData: pagedDistricts,
    currentPage: districtCurrentPage,
    pageSize: districtPageSize,
    totalItems: districtTotalItems,
    setPage: setDistrictPage,
    setPageSize: setDistrictPageSize,
  } = usePagination({ data: tableDistricts, initialPageSize: 10 });

  useEffect(() => {
    setDistrictPage(1);
  }, [tableQuery, selectedDistrict, selectedStatus]);

  // Rates & percentages
  const pctComplete = pctOf(s.complete, s.site_count);
  const pctPending = pctOf(s.pending, s.site_count);
  const pctVerified = pctOf(s.verify_approved, s.complete || 1);
  const pctMat = pctOf(s.material_dispatch, s.site_count);
  const pctClaimApproved = pctOf(s.claim_raised, s.complete || 1);
  const pctPaid = pctOf(s.inst_pay80_done + s.inst_pay20_done, s.complete * 2 || 1);

  // Workflow Milestones
  const milestones = [
    { label: '1. Allocated Rooftop Solar Sites', v: s.site_count, of: s.site_count || 1, color: LIGHT_BLUE },
    { label: '2. Material Dispatched & Received', v: s.material_dispatch, of: s.site_count || 1, color: LIGHT_CYAN },
    { label: '3. Equipment Installed & Photos', v: s.complete, of: s.site_count || 1, color: LIGHT_GREEN },
    { label: '4. Field Verification Approved', v: s.verify_approved, of: s.complete || s.site_count || 1, color: LIGHT_VIOLET },
    { label: '5. Compliance Claims Approved', v: s.claim_raised, of: s.complete || s.site_count || 1, color: LIGHT_AMBER },
    { label: '6. Payment Disbursement Settled', v: s.inst_pay80_done + s.inst_pay20_done, of: (s.complete * 2) || 1, color: LIGHT_GREEN },
  ];

  // Top districts for bar chart
  const chartDistricts = useMemo(
    () => [...filteredDistricts].sort((a, b) => (b.complete || 0) - (a.complete || 0)).slice(0, 15),
    [filteredDistricts]
  );

  // Real Sparklines datasets
  const siteSpark = filteredDistricts.length > 1 ? filteredDistricts.slice(0, 10).map((d) => d.site_count || 0) : undefined;
  const completeSpark = filteredDistricts.length > 1 ? filteredDistricts.slice(0, 10).map((d) => d.complete || 0) : undefined;
  const pendingSpark = filteredDistricts.length > 1 ? filteredDistricts.slice(0, 10).map((d) => d.pending || 0) : undefined;
  const matSpark = filteredDistricts.length > 1 ? filteredDistricts.slice(0, 10).map((d) => d.material_dispatch || 0) : undefined;
  const verifySpark = filteredDistricts.length > 1 ? filteredDistricts.slice(0, 10).map((d) => d.verify_approved || 0) : undefined;

  const execRateSpark = filteredDistricts.length > 1 ? filteredDistricts.slice(0, 10).map((d) => pctOf(d.complete, d.site_count)) : undefined;
  const auditPassSpark = filteredDistricts.length > 1 ? filteredDistricts.slice(0, 10).map((d) => pctOf(d.verify_approved, (d.verify_approved + d.verify_reject) || 1)) : undefined;
  const claimSpark = filteredDistricts.length > 1 ? filteredDistricts.slice(0, 10).map((d) => pctOf(d.claim_raised, d.complete || 1)) : undefined;
  const paySpark = filteredDistricts.length > 1 ? filteredDistricts.slice(0, 10).map((d) => pctOf(d.inst_pay80_done, d.complete || 1)) : undefined;

  // Export definitions for District Table
  const districtCols: ExportColumn<DistrictRow>[] = useMemo(
    () => [
      { header: 'District', accessor: 'district' },
      { header: 'Allocated Sites', accessor: 'site_count' },
      { header: 'Installed Sites', accessor: 'complete' },
      { header: 'Pending Sites', accessor: 'pending' },
      { header: 'Material Dispatched', accessor: 'material_dispatch' },
      { header: 'Verify Approved', accessor: 'verify_approved' },
      { header: 'Verify Pending', accessor: 'verify_pending' },
      { header: 'Claims Approved', accessor: 'claim_raised' },
      { header: '80% Paid', accessor: 'inst_pay80_done' },
      { header: '20% Paid', accessor: 'inst_pay20_done' },
    ],
    []
  );

  const stamp = new Date().toISOString().slice(0, 10);

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
      columns.map((c) => String(c.header ?? '')),
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
      alert(`${label} copied to clipboard!`);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = t;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      alert(`${label} copied to clipboard!`);
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
        title="Jammu RESCO Installation Dashboard"
        subtitle={
          <span style={{ display: 'inline-block', fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>
            Jammu &amp; Kashmir Operations · Rooftop Solar RESCO Operations, District Analytics &amp; Execution Throughput
            {updatedAt ? ` · Last updated ${fmtDate(updatedAt)} ${fmtTime(updatedAt)}` : ''}
          </span>
        }
        breadcrumbs={[
          { label: 'Home', href: '/vendor-management' },
          { label: 'Jammu' },
          { label: 'Installation' },
          { label: 'RESCO' },
          { label: 'Dashboard' },
        ]}
        actions={
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill" style={{ fontWeight: 600, paddingInline: 'var(--ax-space-3)' }}>
              <span className="ax-badge__dot" /> State: Jammu &amp; Kashmir
            </span>
            <button
              type="button"
              className="ax-btn ax-btn--ghost ax-btn--icon"
              aria-label="Refresh dashboard"
              onClick={() => loadDashboardData(true)}
              disabled={loading || isRefreshing}
              title="Refresh live data"
            >
              <span className={isRefreshing ? 'ax-spinner' : ''}>{ICON_REFRESH}</span>
            </button>
            <Link to="/v/jammu/installation/resco/status-view?status=complete" className="ax-btn ax-btn--secondary ax-btn--sm">
              Status Register
            </Link>
            <Link to="/vendor-management/jammu/installation/resco/assign-installation" className="ax-btn ax-btn--secondary ax-btn--sm">
              Assign Sites
            </Link>
            <Link to="/v/jammu/installation/resco/assigned-sites" className="ax-btn ax-btn--secondary ax-btn--sm">
              View Assign Sites
            </Link>
            <Link to="/v/jammu/installation/resco/installation-details" className="ax-btn ax-btn--primary ax-btn--sm">
              <span className="ax-btn__label">Verify Sites</span>
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
            <b>Error loading dashboard data:</b> {apiError}
          </div>
        )}

        {/* 2. Operations Filter Bar */}
        <section
          className="ax-card ax-card--flat ax-col--12"
          role="region"
          aria-label="Jammu RESCO Dashboard Filters"
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
                <label htmlFor="resco-district-select" style={labelStyle}>District:</label>
                <select
                  id="resco-district-select"
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
                <label htmlFor="resco-status-select" style={labelStyle}>Status:</label>
                <select
                  id="resco-status-select"
                  className="ax-input ax-input--sm"
                  style={{ height: 30, fontSize: 'var(--ax-text-xs)', paddingInline: '8px' }}
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="All">All Operations</option>
                  <option value="Complete">Installed Sites</option>
                  <option value="Pending">Pending Installation</option>
                  <option value="MaterialDispatch">Material Dispatched</option>
                  <option value="VerifyApproved">Verify Approved</option>
                  <option value="VerifyPending">Verification Pending</option>
                  <option value="VerifyReject">Verification Rejected</option>
                  <option value="ClaimApproved">Claims Approved</option>
                  <option value="PayDone">Payment Settled</option>
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
                Showing <b style={{ color: 'var(--ax-text-strong)' }}>{num(s.site_count)}</b> Total Sites across <b style={{ color: 'var(--ax-text-strong)' }}>{filteredDistricts.length}</b> {filteredDistricts.length === 1 ? 'District' : 'Districts'}
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
              { key: 'MaterialDispatch', label: 'Dispatched' },
              { key: 'VerifyApproved', label: 'Verify Approved' },
              { key: 'VerifyPending', label: 'In Audit' },
              { key: 'ClaimApproved', label: 'Claims Approved' },
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
        <section className="ax-card ax-welcome ax-col--12" role="region" aria-label="Jammu RESCO Operations Overview">
          <div className="ax-welcome__body">
            <div className="ax-welcome__text">
              <p className="ax-welcome__eyebrow">Jammu &amp; Kashmir Rooftop Solar RESCO Program</p>
              <h2 className="ax-card__title">Welcome to Jammu RESCO Installation Operations Dashboard</h2>
              <p className="ax-welcome__lede">
                {selectedDistrict !== 'All' ? (
                  <>
                    Jammu &amp; Kashmir RESCO execution overview for <b>{selectedDistrict}</b>: <b>{num(s.site_count)} rooftop solar sites</b> allocated.
                    <b> {num(s.complete)} ({pctComplete}%)</b> installed, with <b>{num(s.verify_approved)}</b> verified approved, <b>{num(s.claim_raised)}</b> claims settled, and <b>{num(s.inst_pay80_done + s.inst_pay20_done)}</b> payment disbursements.
                  </>
                ) : (
                  <>
                    Jammu &amp; Kashmir RESCO execution overview: <b>{num(s.site_count)} rooftop solar sites</b> allocated across <b>{districtOptions.length} districts</b>.
                    <b> {num(s.complete)} ({pctComplete}%)</b> installed, with <b>{num(s.verify_approved)}</b> verified approved, <b>{num(s.claim_raised)}</b> claims settled, and <b>{num(s.inst_pay80_done + s.inst_pay20_done)}</b> payment disbursements.
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
                  {selectedDistrict !== 'All' ? 'Active Filter Scope' : 'Operational Scope'}
                </small>
              </div>
              <div className="ax-welcome__stat">
                <dt>Allocated Sites</dt>
                <dd className="ax-num">{num(s.site_count)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--asw-primary)' }}>Total Scope</small>
              </div>
              <div className="ax-welcome__stat">
                <dt>Installed Sites</dt>
                <dd className="ax-num">{num(s.complete)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-emerald, #10b981)' }}>{pctComplete}% Complete</small>
              </div>
              <div className="ax-welcome__stat">
                <dt>Verify Approved</dt>
                <dd className="ax-num">{num(s.verify_approved)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-amber, #f59e0b)' }}>{num(s.verify_pending)} In Audit</small>
              </div>
            </dl>
          </div>
        </section>

        {/* 4. Core KPI Cards */}
        <KpiCard
          icon={I_PIN}
          tone="accent"
          label="Total Allocated Sites"
          value={num(s.site_count)}
          unit="Sites"
          sub="Allocated rooftop solar RESCO projects"
          spark={siteSpark}
          onClick={() => openDrillDown('total', 'Total Allocated Sites')}
        />

        <KpiCard
          icon={I_DONE}
          tone="emerald"
          label="Installed Sites"
          value={num(s.complete)}
          unit="Sites"
          sub="Commissioned equipment & evidence"
          badge={`${pctComplete}%`}
          spark={completeSpark}
          onClick={() => openDrillDown('complete', 'Completed Installations')}
        />

        <KpiCard
          icon={I_CLOCK}
          tone="amber"
          label="Pending Installation"
          value={num(s.pending)}
          unit="Sites"
          sub="Awaiting field erection & testing"
          badge={`${pctPending}%`}
          spark={pendingSpark}
          onClick={() => openDrillDown('pending', 'Pending Installations')}
        />

        <KpiCard
          icon={I_TRUCK}
          tone="cyan"
          label="Material Dispatched"
          value={num(s.material_dispatch)}
          unit="Sites"
          sub={`${num(s.material_pending)} Material dispatch pending`}
          badge={`${pctMat}%`}
          spark={matSpark}
          onClick={() => openDrillDown('material_dispatch', 'Material Dispatched Sites')}
        />

        <KpiCard
          icon={I_SHIELD}
          tone="emerald"
          label="Verify Approved"
          value={num(s.verify_approved)}
          unit="Sites"
          sub={`${num(s.verify_pending)} Audit in progress`}
          badge={`${pctVerified}%`}
          spark={verifySpark}
          onClick={() => openDrillDown('verify_approved', 'Verified Approved Sites')}
        />

        <KpiCard
          icon={I_CLOCK}
          tone="amber"
          label="Verification Pending"
          value={num(s.verify_pending)}
          unit="Sites"
          sub="Field audit pending review"
          onClick={() => openDrillDown('verify_pending', 'Verification Pending Sites')}
        />

        <KpiCard
          icon={I_X}
          tone="red"
          label="Verification Rejected"
          value={num(s.verify_reject)}
          unit="Sites"
          sub="Requires vendor rework"
          onClick={() => openDrillDown('verify_reject', 'Verification Rejected Sites')}
        />

        <KpiCard
          icon={I_DOC}
          tone="violet"
          label="Claims Approved"
          value={num(s.claim_raised)}
          unit="Claims"
          sub={`${num(s.claim_applicable)} Claims applicable`}
          badge={`${pctClaimApproved}%`}
          onClick={() => openDrillDown('claim1_approved', 'Claims Approved Sites')}
        />

        <KpiCard
          icon={I_CREDIT}
          tone="emerald"
          label="Payment Settled"
          value={num(s.inst_pay80_done + s.inst_pay20_done)}
          unit="Disbursed"
          sub={`Stage 1: ${num(s.inst_pay80_done)} · Stage 2: ${num(s.inst_pay20_done)}`}
          badge={`${pctPaid}%`}
          onClick={() => openDrillDown('claim1_approved', 'Payment Settled Sites')}
        />

        {/* 5. Operational Highlights & Execution Tracker */}
        <div className="ax-col--12" style={{ marginTop: 'var(--ax-space-3)', marginBottom: 'var(--ax-space-1)' }}>
          <div className="ax-cluster" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--ax-space-2)' }}>
            <div>
              <span className="ax-card__eyebrow" style={{ color: 'var(--asw-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                Operations &amp; Quality Performance
              </span>
              <h2 className="ax-card__title" style={{ fontSize: 'var(--ax-text-lg)', margin: 0 }}>
                Execution Throughput &amp; Quality Health
              </h2>
            </div>
            <span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--pill" style={{ fontSize: 'var(--ax-text-xs)' }}>
              Super Admin Management
            </span>
          </div>
        </div>

        {/* Operational Highlights Cards */}
        <KpiCard
          icon={I_BOLT}
          tone="emerald"
          label="Execution Rate"
          value={`${pctComplete}%`}
          sub={`${num(s.complete)} of ${num(s.site_count)} sites installed`}
          badge="Installed"
          spark={execRateSpark}
          onClick={() => openDrillDown('complete', 'Completed Sites')}
        />

        <KpiCard
          icon={I_SHIELD}
          tone="cyan"
          label="Audit Pass Rate"
          value={`${pctOf(s.verify_approved, (s.verify_approved + s.verify_reject) || 1)}%`}
          sub={`${num(s.verify_approved)} Passed · ${num(s.verify_reject)} Rejected`}
          badge="Quality"
          spark={auditPassSpark}
          onClick={() => openDrillDown('verify_approved', 'Approved Audits')}
        />

        <KpiCard
          icon={I_DOC}
          tone="violet"
          label="Claim Approved"
          value={`${pctClaimApproved}%`}
          sub={`${num(s.claim_raised)} claims processed`}
          spark={claimSpark}
          onClick={() => openDrillDown('claim1_approved', 'Approved Claims')}
        />

        <KpiCard
          icon={I_CREDIT}
          tone="accent"
          label="Payment Settlement"
          value={`${pctPaid}%`}
          sub={`${num(s.inst_pay80_done + s.inst_pay20_done)} disbursements`}
          spark={paySpark}
          onClick={() => openDrillDown('claim1_approved', 'Settled Payments')}
        />

        {/* State Operations Executive Card */}
        <section className="ax-card ax-col--12" role="region" aria-label="Jammu RESCO Operations Overview">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow" style={{ color: 'var(--asw-primary)' }}>State Operations</span>
              <h3 className="ax-card__title">Jammu &amp; Kashmir · RESCO Rooftop Solar Operations</h3>
              <p className="ax-card__subtitle">{num(s.complete)} solar rooftop sites installed across {districtOptions.length} districts in Jammu &amp; Kashmir</p>
            </div>
            <Link to="/v/jammu/installation/resco/installation-details" className="ax-btn ax-btn--sm ax-btn--primary">
              View Installation Register →
            </Link>
          </div>
          <div className="ax-card__body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-3)' }}>
            <div className="ax-grid ax-grid--2" style={{ gap: 'var(--ax-space-2)' }}>
              <div style={{ padding: '10px 12px', background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 'var(--ax-radius-md, 8px)' }}>
                <small style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-xs)' }}>Installed &amp; Operational</small>
                <div style={{ fontSize: 'var(--ax-text-lg)', fontWeight: 700, color: 'var(--ax-viz-emerald, #10b981)' }}>
                  {num(s.complete)} <span style={{ fontSize: 'var(--ax-text-xs)', fontWeight: 500 }}>({pctComplete}%)</span>
                </div>
              </div>
              <div style={{ padding: '10px 12px', background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 'var(--ax-radius-md, 8px)' }}>
                <small style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-xs)' }}>Pending Execution</small>
                <div style={{ fontSize: 'var(--ax-text-lg)', fontWeight: 700, color: 'var(--ax-viz-amber, #f59e0b)' }}>
                  {num(s.pending)} <span style={{ fontSize: 'var(--ax-text-xs)', fontWeight: 500 }}>({pctPending}%)</span>
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
              <b>Verification &amp; Compliance:</b> {num(s.verify_approved)} sites approved by auditor ({pctVerified}%) · {num(s.claim_raised)} claims approved · {num(s.inst_pay80_done + s.inst_pay20_done)} payment settlements confirmed.
            </div>
          </div>
        </section>

        {/* 6. Charts: District Wise Installations + Status Donut */}
        <section className="ax-card ax-card--chart ax-col--8" role="region" aria-label="District wise installations">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Geographic Breakdown</span>
              <h2 className="ax-card__title">District Wise Installations</h2>
              <p className="ax-card__subtitle">{num(s.complete)} installed of {num(s.site_count)} allocated across {districtOptions.length} districts</p>
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
                  key={`dist-chart-${chartH}-${chartDistricts.map((d) => `${d.district}-${d.complete}-${d.site_count}`).join('-')}`}
                  type="bar"
                  height={chartH}
                  legend="none"
                  ariaLabel="District-wise installation comparison"
                  series={[
                    { name: 'Installed Sites', data: chartDistricts.map((d) => d.complete || 0) },
                    { name: 'Allocated Sites', data: chartDistricts.map((d) => d.site_count || 0) },
                  ]}
                  apex={{
                    colors: [LIGHT_GREEN, LIGHT_BLUE],
                    plotOptions: { bar: { horizontal: false, borderRadius: 4, columnWidth: '35%' } },
                    xaxis: { categories: chartDistricts.map((d) => d.district), labels: { style: { fontSize: '11px' }, rotate: -35 } },
                    yaxis: { title: { text: 'Solar Sites (Nos.)', style: { color: 'var(--ax-text-muted)' } } },
                    chart: {
                      events: {
                        dataPointSelection: (_event: unknown, _chart: unknown, opts: any) => {
                          const dist = chartDistricts[opts?.dataPointIndex]?.district;
                          if (dist) openDrillDown('complete', dist);
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
              <p className="ax-card__subtitle">Total {num(s.site_count)} RESCO Sites</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <Suspense fallback={<div className="ax-skeleton" style={{ height: donutH }} />}>
              <ApexChart
                key={`donut-${donutH}-${s.complete}-${s.pending}-${s.verify_reject}-${s.material_dispatch}`}
                type="donut"
                height={donutH}
                legend="none"
                ariaLabel="Installed, pending, material dispatched, and rejected distribution"
                series={[s.complete, s.pending, s.material_dispatch, s.verify_reject]}
                apex={{
                  labels: ['Installed', 'Pending', 'Dispatched', 'Rework Required'],
                  colors: [LIGHT_GREEN, LIGHT_AMBER, LIGHT_CYAN, LIGHT_RED],
                  stroke: { width: 0 },
                  chart: {
                    events: {
                      dataPointSelection: (_event: unknown, _chart: unknown, opts: any) => {
                        const labels = ['complete', 'pending', 'material_dispatch', 'verify_reject'];
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
                          total: { show: true, label: 'Sites', formatter: () => num(s.site_count) },
                        },
                      },
                    },
                  },
                }}
              />
            </Suspense>
            <ul className="ax-list ax-list--compact" style={{ marginTop: 'var(--ax-space-3)' }}>
              {[
                { label: 'Installed', sub: 'Completed sites', v: s.complete, p: pctComplete, color: LIGHT_GREEN, key: 'complete' },
                { label: 'Pending', sub: 'Awaiting execution', v: s.pending, p: pctPending, color: LIGHT_AMBER, key: 'pending' },
                { label: 'Material Dispatched', sub: 'En route / Delivered', v: s.material_dispatch, p: pctMat, color: LIGHT_CYAN, key: 'material_dispatch' },
                { label: 'Rework Required', sub: 'Audit rejected', v: s.verify_reject, p: pctOf(s.verify_reject, s.site_count), color: LIGHT_RED, key: 'verify_reject' },
              ].map((item) => (
                <li
                  key={item.label}
                  className="ax-list__row"
                  style={{ border: 0, paddingInline: 0, cursor: 'pointer' }}
                  onClick={() => openDrillDown(item.key)}
                >
                  <span className="ax-list__leading"><i style={{ width: 9, height: 9, borderRadius: 3, background: item.color, display: 'inline-block' }} /></span>
                  <span className="ax-list__content">
                    <span className="ax-list__title" style={{ fontWeight: 'var(--ax-weight-medium)' }}>{item.label}</span>
                    <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>{item.sub}</span>
                  </span>
                  <span className="ax-list__trailing ax-num" style={{ color: 'var(--ax-text-strong)', fontWeight: 600 }}>{num(item.v)} ({item.p}%)</span>
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
                      categories: monthlyInstallations.map((m) => fmtMonth(m.month_year)),
                    },
                    yaxis: { title: { text: 'Installed Sites', style: { color: 'var(--ax-text-muted)' } } },
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

        {/* RESCO Workflow Milestones */}
        <section className="ax-card ax-col--4" role="region" aria-label="RESCO Workflow Milestones">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Workflow Lifecycle</span>
              <h2 className="ax-card__title">RESCO Milestones</h2>
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
              <h2 className="ax-card__title">District Wise RESCO Summary</h2>
              <p className="ax-card__subtitle">Allocated, installed, verification &amp; payment metrics per district</p>
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
                  onCopy={() => copyToClipboard(tableDistricts, districtCols, 'District overview data')}
                  onExportCSV={() => exportToCSV(tableDistricts, districtCols, `Jammu_RESCO_District_${stamp}`)}
                  onExportExcel={() => exportToExcel(tableDistricts, districtCols, `Jammu_RESCO_District_${stamp}`)}
                  onExportPDF={() => exportToPDF(tableDistricts, districtCols, 'Jammu & Kashmir RESCO District Summary')}
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
                  <th className="ax-table__th ax-table__th--num" scope="col">Installed</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Pending</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Material Disp.</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Verify Approved</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Claims Approved</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Payment Settled</th>
                </tr>
              </thead>
              <tbody>
                {pagedDistricts.map((d) => (
                  <tr
                    key={d.district}
                    className="ax-table__row"
                    role="button"
                    tabIndex={0}
                    onClick={() => openDrillDown('complete', d.district)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDrillDown('complete', d.district); } }}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="ax-table__td" style={{ fontWeight: 'var(--ax-weight-semibold)', color: 'var(--ax-text-strong)' }}>
                      <b>{d.district}</b>
                    </td>
                    <td
                      className="ax-table__td ax-table__td--num ax-num"
                      style={{ fontWeight: 600, cursor: 'pointer' }}
                      title={`View all allocated sites in ${d.district}`}
                      onClick={(e) => { e.stopPropagation(); openDrillDown('total', d.district); }}
                    >
                      {num(d.site_count || 0)}
                    </td>
                    <td
                      className="ax-table__td ax-table__td--num ax-num"
                      style={{ color: 'var(--ax-viz-emerald, #10b981)', fontWeight: 600, cursor: 'pointer' }}
                      title={`View completed sites in ${d.district}`}
                      onClick={(e) => { e.stopPropagation(); openDrillDown('complete', d.district); }}
                    >
                      {num(d.complete || 0)}
                    </td>
                    <td
                      className="ax-table__td ax-table__td--num ax-num"
                      style={{ color: 'var(--ax-viz-amber, #f59e0b)', fontWeight: 600, cursor: 'pointer' }}
                      title={`View pending sites in ${d.district}`}
                      onClick={(e) => { e.stopPropagation(); openDrillDown('pending', d.district); }}
                    >
                      {num(d.pending || 0)}
                    </td>
                    <td
                      className="ax-table__td ax-table__td--num ax-num"
                      style={{ color: 'var(--ax-viz-cyan, #0891b2)', fontWeight: 600, cursor: 'pointer' }}
                      title={`View dispatched sites in ${d.district}`}
                      onClick={(e) => { e.stopPropagation(); openDrillDown('material_dispatch', d.district); }}
                    >
                      {num(d.material_dispatch || 0)}
                    </td>
                    <td
                      className="ax-table__td ax-table__td--num ax-num"
                      style={{ color: 'var(--ax-viz-emerald, #10b981)', fontWeight: 600, cursor: 'pointer' }}
                      title={`View verify approved sites in ${d.district}`}
                      onClick={(e) => { e.stopPropagation(); openDrillDown('verify_approved', d.district); }}
                    >
                      {num(d.verify_approved || 0)}
                    </td>
                    <td
                      className="ax-table__td ax-table__td--num ax-num"
                      style={{ color: 'var(--ax-viz-violet, #7c3aed)', fontWeight: 600, cursor: 'pointer' }}
                      title={`View claim approved sites in ${d.district}`}
                      onClick={(e) => { e.stopPropagation(); openDrillDown('claim1_approved', d.district); }}
                    >
                      {num(d.claim_raised || 0)}
                    </td>
                    <td
                      className="ax-table__td ax-table__td--num ax-num"
                      style={{ color: 'var(--ax-viz-emerald, #10b981)', fontWeight: 600, cursor: 'pointer' }}
                      title={`View payment settled sites in ${d.district}`}
                      onClick={(e) => { e.stopPropagation(); openDrillDown('claim1_approved', d.district); }}
                    >
                      {num((d.inst_pay80_done || 0) + (d.inst_pay20_done || 0))}
                    </td>
                  </tr>
                ))}
                {!loading && pagedDistricts.length === 0 && (
                  <tr>
                    <td className="ax-table__td" colSpan={8} style={{ textAlign: 'center', color: 'var(--ax-text-muted)', padding: 24 }}>
                      No districts match the filter criteria.
                    </td>
                  </tr>
                )}
                {pagedDistricts.length > 0 && (
                  <tr className="ax-table__row" style={{ background: 'var(--ax-surface-subtle, #f8fafc)', fontWeight: 'var(--ax-weight-bold)' }}>
                    <td className="ax-table__td" style={{ color: 'var(--ax-text-strong)' }}>Total (All Districts)</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ cursor: 'pointer' }} title="View all allocated sites" onClick={() => openDrillDown('total')}>{num(s.site_count)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-emerald, #10b981)', cursor: 'pointer' }} title="View completed sites" onClick={() => openDrillDown('complete')}>{num(s.complete)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-amber, #f59e0b)', cursor: 'pointer' }} title="View pending sites" onClick={() => openDrillDown('pending')}>{num(s.pending)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-cyan, #0891b2)', cursor: 'pointer' }} title="View material dispatched sites" onClick={() => openDrillDown('material_dispatch')}>{num(s.material_dispatch)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-emerald, #10b981)', cursor: 'pointer' }} title="View verify approved sites" onClick={() => openDrillDown('verify_approved')}>{num(s.verify_approved)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-violet, #7c3aed)', cursor: 'pointer' }} title="View claim approved sites" onClick={() => openDrillDown('claim1_approved')}>{num(s.claim_raised)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-emerald, #10b981)', cursor: 'pointer' }} title="View payment settled sites" onClick={() => openDrillDown('claim1_approved')}>{num(s.inst_pay80_done + s.inst_pay20_done)}</td>
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
                <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill">{num(s.complete)} Installed</span>
              </div>
              <div className="ax-statgroup ax-statgroup--stack" style={{ gap: 'var(--ax-space-2)' }}>
                {(filteredDistricts.length > 0 ? filteredDistricts : districtwise).slice(0, 8).map((d) => (
                  <button
                    key={d.district}
                    type="button"
                    className="ax-cluster"
                    onClick={() => openDrillDown('complete', d.district)}
                    style={{ width: '100%', justifyContent: 'space-between', fontSize: 'var(--ax-text-xs)', border: 0, background: 'transparent', padding: '6px 0', cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid var(--ax-border-subtle, #f1f5f9)' }}
                  >
                    <span style={{ color: 'var(--ax-text-muted)', fontWeight: 500 }}>{d.district}</span>
                    <b className="ax-num" style={{ color: 'var(--ax-viz-emerald, #10b981)' }}>
                      {num(d.complete || 0)} / {num(d.site_count || 0)} ({pctOf(d.complete || 0, d.site_count || 1)}%)
                    </b>
                  </button>
                ))}
                {districtwise.length === 0 && <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>{loading ? 'Loading districts…' : 'No district data.'}</span>}
              </div>
            </div>

            <div className="ax-divider" style={{ marginBlock: 'var(--ax-space-4)' }} />

            {/* Quick Actions Links */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 'var(--ax-text-xs)', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)', letterSpacing: '0.04em' }}>
                Quick Module Actions
              </span>
              <Link to="/vendor-management/jammu/installation/resco/assign-installation" className="ax-btn ax-btn--secondary ax-btn--sm" style={{ justifyContent: 'space-between' }}>
                <span>Assign RESCO Batches</span>
                <span>→</span>
              </Link>
              <Link to="/v/jammu/installation/resco/assigned-sites" className="ax-btn ax-btn--secondary ax-btn--sm" style={{ justifyContent: 'space-between' }}>
                <span>View Assigned Sites</span>
                <span>→</span>
              </Link>
              <Link to="/v/jammu/installation/resco/install-site" className="ax-btn ax-btn--secondary ax-btn--sm" style={{ justifyContent: 'space-between' }}>
                <span>Install Live Site</span>
                <span>→</span>
              </Link>
              <Link to="/v/jammu/installation/resco/installation-details" className="ax-btn ax-btn--primary ax-btn--sm" style={{ justifyContent: 'space-between' }}>
                <span>Verify Installed Sites</span>
                <span>→</span>
              </Link>
              <Link to="/v/jammu/installation/resco/claim-request" className="ax-btn ax-btn--secondary ax-btn--sm" style={{ justifyContent: 'space-between' }}>
                <span>View Claims &amp; Invoices</span>
                <span>→</span>
              </Link>
              <Link to="/vendor-management/jammu/installation/resco/view-bills" className="ax-btn ax-btn--secondary ax-btn--sm" style={{ justifyContent: 'space-between' }}>
                <span>Energy Generation Bills</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export { RescoDashboard as SolarErp };
export default RescoDashboard;
