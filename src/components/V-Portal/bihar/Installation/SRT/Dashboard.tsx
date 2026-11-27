import { lazy, Suspense, useCallback, useDeferredValue, useEffect, useMemo, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  biharSrtInstallationService,
  type SrtDashboardData,
  type SrtDashboardSummary,
  type SrtDistrictRow,
} from '../../bihar-services/biharSrtInstallationService';
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

/* ───────── Chart colors (existing SRT palette) ───────── */
const LIGHT_BLUE = '#4992ff';
const LIGHT_GREEN = '#86DDB2';
const LIGHT_AMBER = '#F6D68A';
const LIGHT_RED = '#ef6a6a';

const EMPTY_SUMMARY: SrtDashboardSummary = {
  site_count: 0,
  complete: 0,
  pending: 0,
  inpection_pending: 0,
  inpection_complete: 0,
  verify_pending: 0,
  verify_approved: 0,
  verify_reject: 0,
  claim_applicable: 0,
  claim_raised: 0,
  inst_doc_complete: 0,
  inst_doc_pending: 0,
  inst_pay1: 0,
  inst_pay2: 0,
  inst_pay3: 0,
  inst_pay1_amount: '0.00',
  inst_pay2_amount: '0.00',
  inst_pay3_amount: '0.00',
};

/* ───────── Helpers ───────── */
const num = (x: unknown) => Number(x ?? 0).toLocaleString('en-IN');
const cur = (x: unknown) => `₹${(Number(x ?? 0) || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const pctOf = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : 0);
const n = (v: unknown) => Number(v ?? 0) || 0;
const pad = (x: number) => String(x).padStart(2, '0');
const fmtDate = (d: Date) => `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
const fmtTime = (d: Date) => d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();
const cv = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const fmtMonth = (s: string) => {
  const [y, m] = String(s || '').split('-');
  const mi = Number(m);
  if (!y || !mi) return s || '';
  return `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][mi - 1]} ${y}`;
};

const onActivate = (fn: () => void) => (e: KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    fn();
  }
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

/* ───────── Responsive page CSS (same as SSL dashboard) ───────── */
const PAGE_CSS = `
  .solar-erp-page .ax-page-head { margin-block-end: 10px; }
  .solar-erp-page .ax-page-head .ax-breadcrumb { margin-block-end: 4px; }
  .solar-erp-page .ax-dash-grid { margin-top: 0; }
  .solar-erp-page .ax-card { min-width: 0; }
  .solar-erp-page .ax-card__footer { width: 100%; box-sizing: border-box; }
  .solar-erp-page .srt-pagination-left {
    width: 100%; display: flex; justify-content: flex-start; align-items: center; margin: 0; overflow-x: auto;
  }
  .solar-erp-page .srt-pagination-left > * { margin-left: 0 !important; margin-right: 0 !important; }

  .solar-erp-page .ax-card__header {
    display: flex; flex-wrap: nowrap; align-items: flex-start; justify-content: space-between; gap: 12px;
  }
  .solar-erp-page .ax-card__titles { flex: 1 1 220px; min-width: 220px; max-width: 100%; }
  .solar-erp-page .ax-card__title,
  .solar-erp-page .ax-card__eyebrow,
  .solar-erp-page .ax-card__subtitle {
    max-width: none; word-break: normal; overflow-wrap: normal; hyphens: none;
  }
  .solar-erp-page .ax-card__subtitle { line-height: 1.45; }

  .solar-erp-page .ax-card__actions {
    flex: 0 1 auto; min-width: 0; margin-left: auto; display: flex; align-items: center;
    justify-content: flex-end; flex-wrap: nowrap; gap: 8px;
  }
  .solar-erp-page .ax-card__actions .ax-cluster { flex-wrap: nowrap !important; min-width: 0; justify-content: flex-end; }

  .solar-erp-page .ax-card__actions .ax-search,
  .solar-erp-page .ax-card__actions [class*="search"] { flex: 1 1 140px; min-width: 90px; max-width: 260px; }
  .solar-erp-page .ax-card__actions input { min-width: 0; width: 100%; }

  .solar-erp-page .ax-card__actions .ax-export-toolbar,
  .solar-erp-page .ax-card__actions [class*="export-toolbar"] {
    flex: 0 1 auto; min-width: 0; flex-wrap: nowrap; gap: 4px;
  }
  .solar-erp-page .ax-export-toolbar__button { padding-inline: 8px !important; min-width: 0; }

  .solar-erp-page .ax-table-wrap,
  .solar-erp-page .ax-table-wrapper {
    width: 100%; max-width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch;
  }
  .solar-erp-page .ax-table { min-width: 720px; }
  .solar-erp-page .ax-welcome__lede { max-width: 820px; }

  .solar-erp-page .srt-filter-item { display: flex; align-items: center; gap: 6px; }
  .solar-erp-page .srt-filter-item select { width: 165px; }

  .srt-interactive-kpi {
    cursor: pointer;
    transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
  }
  .srt-interactive-kpi:hover {
    transform: translateY(-2px);
    box-shadow: var(--ax-shadow-md);
    border-color: rgba(var(--ax-accent-rgb), 0.35) !important;
  }
  .solar-erp-page .kpi-seg {
    cursor: pointer; border-radius: 4px; padding: 0 2px; transition: background 120ms ease, color 120ms ease;
  }
  .solar-erp-page .kpi-seg:hover { background: rgba(var(--ax-accent-rgb), 0.12); color: var(--ax-accent); text-decoration: underline; }
  .solar-erp-page .kpi-seg:focus-visible { outline: 2px solid var(--ax-accent); outline-offset: 1px; }

  @media (max-width: 1100px) {
    .solar-erp-page .ax-col--8,
    .solar-erp-page .ax-col--6,
    .solar-erp-page .ax-col--4 { grid-column: span 12; }
    .solar-erp-page .ax-col--3 { grid-column: span 6; }
    .solar-erp-page .ax-export-toolbar__button { font-size: 0; gap: 0; padding: 0 8px !important; justify-content: center; }
    .solar-erp-page .ax-export-toolbar__button svg { width: 16px; height: 16px; flex-shrink: 0; }
    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] { max-width: 200px; }
  }

  @media (max-width: 760px) {
    .solar-erp-page { width: 100%; max-width: 100%; overflow-x: hidden; box-sizing: border-box; }
    .solar-erp-page .ax-welcome__stats { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
    .solar-erp-page .ax-grid--2 { grid-template-columns: 1fr !important; }
    .solar-erp-page .srt-filter-item { width: 100%; justify-content: space-between; }
    .solar-erp-page .srt-filter-item select { flex: 1; width: auto; max-width: 100%; }
    .solar-erp-page .ax-card__header { flex-direction: column; flex-wrap: nowrap; align-items: stretch; gap: 10px; }
    .solar-erp-page .ax-card__titles { flex: 0 0 auto; min-width: 0; width: 100%; max-width: 100%; }
    .solar-erp-page .ax-card__title {
      font-family: var(--ax-font-display); font-size: var(--ax-text-md); line-height: var(--ax-leading-md);
    }
    .solar-erp-page .ax-card__actions { flex: 0 0 auto; width: 100%; margin-left: 0; flex-wrap: wrap; justify-content: flex-start; }
    .solar-erp-page .ax-card__actions .ax-cluster { flex-wrap: wrap !important; width: 100%; justify-content: flex-start; gap: 8px; }
    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] { flex: 1 1 100%; width: 100%; max-width: 100%; min-width: 0; }
    .solar-erp-page .ax-card__actions .ax-export-toolbar,
    .solar-erp-page .ax-card__actions [class*="export-toolbar"] {
      flex: 1 1 100%; flex-wrap: wrap; justify-content: flex-start; gap: 6px;
    }
    .solar-erp-page .ax-export-toolbar__button { font-size: 12px; gap: 4px; height: 30px; padding: 0 8px !important; }
  }

  @media (max-width: 490px) {
    .solar-erp-page .ax-welcome__stats { grid-template-columns: 1fr !important; }
    .solar-erp-page .ax-col--3 { grid-column: span 12; }
    .solar-erp-page .ax-export-toolbar__button { font-size: 11px; height: 28px; padding: 0 6px !important; }
  }
`;

/* ───────── SVG Icons ───────── */
const svg = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const I_PIN = svg(<><path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /><path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0" /></>);
const I_BOLT = svg(<path d="M13 3l0 7l6 0l-8 11l0 -7l-6 0l8 -11" />);
const I_SHIELD = svg(<><path d="M12 3a12 12 0 0 0 8.5 3a12 12 0 0 1 -8.5 15a12 12 0 0 1 -8.5 -15a12 12 0 0 0 8.5 -3" /><path d="M9 12l2 2l4 -4" /></>);
const I_DOC = svg(<><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" /><path d="M9 9l1 0" /><path d="M9 13l6 0" /><path d="M9 17l6 0" /></>);
const I_COIN = svg(<><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M14.8 9a2 2 0 0 0 -1.8 -1h-2a2 2 0 1 0 0 4h2a2 2 0 1 1 0 4h-2a2 2 0 0 1 -1.8 -1" /><path d="M12 7v10" /></>);
const I_CREDIT = svg(<><rect x="3" y="5" width="18" height="14" rx="3" /><line x1="3" y1="10" x2="21" y2="10" /><line x1="7" y1="15" x2="7.01" y2="15" /><line x1="11" y1="15" x2="13" y2="15" /></>);
const I_LIST = svg(<><path d="M9 6l11 0" /><path d="M9 12l11 0" /><path d="M9 18l11 0" /><path d="M5 6l0 .01" /><path d="M5 12l0 .01" /><path d="M5 18l0 .01" /></>);
const I_SEARCH = svg(<><path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" /><path d="M21 21l-6 -6" /></>);
const ICON_FILTER = (
  <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 4h16v2.172a2 2 0 0 1 -.586 1.414l-4.828 4.828v7.586l-4 -2v-5.586l-4.828 -4.828a2 2 0 0 1 -.586 -1.414v-2.172z" /></svg>
);
const ICON_REFRESH = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" /><path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" /></svg>
);

/* ───────── KPI card (SSL design) ───────── */
interface KpiProps {
  icon: ReactNode;
  tone: 'accent' | 'cyan' | 'emerald' | 'amber' | 'violet' | 'pink' | 'red';
  label: string;
  value?: string;
  unit?: string;
  sub: string;
  badge?: string;
  spark?: number[];
  sparkType?: 'line' | 'bar' | 'area';
  onClick?: () => void;
  pills?: { label: string; count: number | string; onClick?: () => void }[];
}
const TONE: Record<KpiProps['tone'], { bg: string; fg: string; apex: string }> = {
  accent: { bg: 'rgba(var(--ax-accent-rgb), 0.12)', fg: 'var(--ax-accent)', apex: '--ax-accent' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan) 14%, transparent)', fg: 'var(--ax-viz-cyan)', apex: '--ax-viz-cyan' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald) 14%, transparent)', fg: 'var(--ax-viz-emerald)', apex: '--ax-viz-emerald' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber) 14%, transparent)', fg: 'var(--ax-viz-amber)', apex: '--ax-viz-amber' },
  violet: { bg: 'color-mix(in oklab, var(--ax-viz-violet) 14%, transparent)', fg: 'var(--ax-viz-violet)', apex: '--ax-viz-violet' },
  pink: { bg: 'color-mix(in oklab, var(--ax-viz-pink) 14%, transparent)', fg: 'var(--ax-viz-pink)', apex: '--ax-viz-pink' },
  red: { bg: 'color-mix(in oklab, var(--ax-viz-red) 14%, transparent)', fg: 'var(--ax-viz-red)', apex: '--ax-viz-red' },
};

function KpiCard({ icon, tone, label, value, unit, sub, badge, spark, sparkType = 'line', onClick, pills }: KpiProps) {
  const t = TONE[tone];
  const hasSpark = Array.isArray(spark) && spark.length > 1;
  const allZeros = hasSpark && spark!.every((v) => v === 0);
  const safeSpark = allZeros ? [0, 0, 0, 0, 0] : spark;

  return (
    <div
      className={`ax-card ax-col--3 ${onClick ? 'srt-interactive-kpi' : ''}`}
      role={onClick ? 'button' : 'region'}
      tabIndex={onClick ? 0 : undefined}
      aria-label={label}
      onClick={onClick}
      onKeyDown={onClick ? onActivate(onClick) : undefined}
      style={{ borderRadius: 'var(--ax-radius-lg)', background: 'var(--ax-bg-surface)', border: '1px solid var(--ax-border)' }}
    >
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <span style={{ width: 28, height: 28, borderRadius: 'var(--ax-radius-md)', background: t.bg, color: t.fg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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
              {pills && pills.length > 0
                ? pills.map((seg, i) => (
                    <span key={seg.label}>
                      {i > 0 && <span style={{ color: 'var(--ax-text-muted)', fontWeight: 500, margin: '0 4px' }}>/</span>}
                      <span
                        className={seg.onClick ? 'kpi-seg' : undefined}
                        role={seg.onClick ? 'button' : undefined}
                        tabIndex={seg.onClick ? 0 : undefined}
                        title={seg.onClick ? `View ${seg.label} sites` : undefined}
                        onClick={seg.onClick ? (e) => { e.stopPropagation(); seg.onClick!(); } : undefined}
                        onKeyDown={seg.onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); seg.onClick!(); } } : undefined}
                      >
                        {seg.count}
                      </span>
                    </span>
                  ))
                : value}{' '}
              {unit && <small style={{ fontSize: '11px', fontWeight: 500, color: 'var(--ax-text-muted)' }}>{unit}</small>}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--ax-text-muted)', marginTop: '2px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div>
          </div>
          {hasSpark && (
            <div style={{ width: 68, height: 26, overflow: 'hidden', flexShrink: 0 }}>
              <Suspense fallback={<div style={{ width: 68, height: 26 }} />}>
                <ApexChart
                  key={`${label}-${safeSpark!.join(',')}-${sparkType}`}
                  type={sparkType}
                  sparkline
                  tooltip={false}
                  height={26}
                  color={t.apex}
                  series={[{ name: label, data: safeSpark! }]}
                  style={{ minHeight: 26, width: 68 }}
                  apex={{ yaxis: { min: 0, forceNiceScale: true }, plotOptions: { bar: { columnWidth: '60%', borderRadius: 2 } } }}
                />
              </Suspense>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Bar({ pct }: { pct: number }) {
  return (
    <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', flexWrap: 'wrap' }}>
      <div className="ax-progress ax-progress--sm" style={{ minWidth: 80, width: 80 }}>
        <div className="ax-progress__track">
          <div className="ax-progress__fill" style={{ width: `${pct}%`, background: pct >= 90 ? 'var(--ax-viz-emerald)' : 'var(--ax-accent)' }} />
        </div>
      </div>
      <span className="ax-num" style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>{pct}%</span>
    </div>
  );
}

const actionsRowStyle = { gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', width: '100%' } as const;
const labelStyle = { fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)', fontWeight: 500 } as const;
const selectStyle = { height: 30, fontSize: 'var(--ax-text-xs)', paddingInline: '8px' } as const;
const footerStyle = { borderTop: '1px solid var(--ax-border)', padding: 'var(--ax-space-3) var(--ax-space-4)' } as const;
const emptyCellStyle = { textAlign: 'center', padding: 24, color: 'var(--ax-text-muted)' } as const;

export function Bihar_Installation_SRT_Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<SrtDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  // Filters
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [tableQuery, setTableQuery] = useState<string>('');

  const chartH = useChartHeight(320, 260);
  const donutH = useChartHeight(230, 210);

  // ── Status drill-down navigation ──
  const openStatusView = (statusKey: string, district?: string, hash?: string) => {
    const targetDistrict = district && district !== 'All' ? district : (selectedDistrict !== 'All' ? selectedDistrict : undefined);
    const params = new URLSearchParams();
    params.set('status', statusKey);
    if (targetDistrict) params.set('district', targetDistrict);
    const h = hash
      ? `#${hash}`
      : (statusKey === 'inst-pending' ? '#pending'
        : (statusKey === 'inst-complete' ? '#completed'
          : (statusKey.startsWith('inst-pay') ? '#payment' : '')));
    navigate(`/v/bihar/installation/srt/status-view?${params.toString()}${h}`);
  };

  const loadDashboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setLoading(true);
    setApiError(null);
    try {
      const resp = await biharSrtInstallationService.getDashboardData();
      if (resp) {
        setData(resp);
        setUpdatedAt(new Date());
      } else {
        setApiError('Unable to load Bihar SRT dashboard data from server.');
      }
    } catch (err: any) {
      console.warn('[SRT Dashboard] load error:', err);
      setApiError(err?.message || 'Failed to load Bihar SRT installation dashboard.');
    } finally {
      setLoading(false);
      if (isRefresh) setTimeout(() => setIsRefreshing(false), 400);
    }
  }, []);

  useEffect(() => { loadDashboardData(); }, [loadDashboardData]);

  /* ───────── Data resolution ───────── */
  const rawSummary: SrtDashboardSummary = data?.srtdatas || EMPTY_SUMMARY;
  const districtwise: SrtDistrictRow[] = useMemo(
    () => (Array.isArray(data?.districtwise) ? (data!.districtwise as SrtDistrictRow[]) : []),
    [data]
  );
  const monthly: Array<{ month_year: string; monthly_installations: number }> = useMemo(
    () => (Array.isArray((data as any)?.district_installation_month) ? (data as any).district_installation_month : []),
    [data]
  );

  const districtOptions = useMemo(
    () => [...new Set(districtwise.map((d) => d.district))].filter(Boolean).sort(),
    [districtwise]
  );

  // Filtered district rows (district + status)
  const filteredDistricts = useMemo(() => {
    return districtwise.filter((d) => {
      const matchDistrict = selectedDistrict === 'All' || (d.district || '').toLowerCase() === selectedDistrict.toLowerCase();
      let matchStatus = true;
      if (selectedStatus === 'Complete') matchStatus = n(d.inst_complete) > 0;
      else if (selectedStatus === 'Pending') matchStatus = n(d.inst_pending) > 0;
      else if (selectedStatus === 'Payment1') matchStatus = n(d.inst_pay1) > 0;
      return matchDistrict && matchStatus;
    });
  }, [districtwise, selectedDistrict, selectedStatus]);

  const filtersActive = selectedDistrict !== 'All' || selectedStatus !== 'All';

  // Summary reflecting active filters (only fields available district-wise are overridden)
  const summary: SrtDashboardSummary = useMemo(() => {
    if (!filtersActive) return rawSummary;
    const sum = (pick: (d: SrtDistrictRow) => unknown) => filteredDistricts.reduce((a, d) => a + n(pick(d)), 0);
    return {
      ...rawSummary,
      site_count: sum((d) => d.site_count),
      complete: sum((d) => d.inst_complete),
      pending: sum((d) => d.inst_pending),
      inst_pay1: sum((d) => d.inst_pay1),
    };
  }, [filtersActive, rawSummary, filteredDistricts]);

  // Table search & pagination
  const deferredQuery = useDeferredValue(tableQuery);
  const tableDistricts = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return filteredDistricts.filter((d) => !q || (d.district || '').toLowerCase().includes(q));
  }, [filteredDistricts, deferredQuery]);

  const pD = usePagination({ data: tableDistricts, initialPageSize: 15 });

  useEffect(() => {
    pD.setPage(1);
  }, [tableQuery, selectedDistrict, selectedStatus]);

  /* ───────── Derived Values ───────── */
  const dash = (v: unknown) => (loading && !data ? '…' : num(v));
  const total = n(summary.site_count);
  const instPct = pctOf(n(summary.complete), total);
  const pendingPct = pctOf(n(summary.pending), total);
  const approvedPct = pctOf(n(summary.verify_approved), total);
  const inspPct = pctOf(n(summary.inpection_complete), total);
  const docPct = pctOf(n(summary.inst_doc_complete), total);
  const passRate = pctOf(n(summary.verify_approved), n(summary.verify_approved) + n(summary.verify_reject) || 1);
  const claimRate = pctOf(n(summary.claim_raised), n(summary.claim_applicable) || 1);
  const payRate = pctOf(n(summary.inst_pay1), n(summary.claim_raised) || 1);
  const totalPaidAmount = n(summary.inst_pay1_amount) + n(summary.inst_pay2_amount) + n(summary.inst_pay3_amount);
  const monthTotal = monthly.reduce((a, m) => a + n(m.monthly_installations), 0);
  const todayLabel = fmtDate(new Date());

  const spk = (pickFn: (d: SrtDistrictRow) => number) => {
    const arr = districtwise.slice(0, 10).map(pickFn);
    return arr.length > 1 ? arr : undefined;
  };

  // Districts for bar chart (filtered selection or top 15 by installed)
  const chartDistricts = useMemo(() => {
    if (filtersActive) return filteredDistricts.slice(0, 15);
    return [...districtwise].sort((a, b) => n(b.inst_complete) - n(a.inst_complete)).slice(0, 15);
  }, [districtwise, filteredDistricts, filtersActive]);

  const milestones = [
    { label: '1. Allocated Sites', v: n(summary.site_count), of: total || 1, color: 'var(--ax-viz-cyan)', key: 'total' },
    { label: '2. Installation Complete', v: n(summary.complete), of: total || 1, color: 'var(--ax-accent)', key: 'inst-complete' },
    { label: '3. Inspection Complete', v: n(summary.inpection_complete), of: total || 1, color: 'var(--ax-viz-violet)', key: 'inpection-complete' },
    { label: '4. Installation Approved', v: n(summary.verify_approved), of: total || 1, color: 'var(--ax-viz-emerald)', key: 'verify-approved' },
    { label: '5. Documents Uploaded', v: n(summary.inst_doc_complete), of: total || 1, color: 'var(--ax-viz-amber)', key: 'inst-doc-complete' },
    { label: '6. Payment 1 Paid', v: n(summary.inst_pay1), of: total || 1, color: 'var(--ax-viz-emerald)', key: 'inst-pay1' },
  ];

  const donutItems = [
    { label: 'Installed', sub: `${instPct}% of total`, v: n(summary.complete), color: LIGHT_GREEN, key: 'inst-complete' },
    { label: 'Pending', sub: 'Installation in progress', v: n(summary.pending), color: LIGHT_AMBER, key: 'inst-pending' },
    { label: 'Verify Approved', sub: `${approvedPct}% of total`, v: n(summary.verify_approved), color: LIGHT_BLUE, key: 'verify-approved' },
    { label: 'Verify Rejected', sub: 'Correction needed', v: n(summary.verify_reject), color: LIGHT_RED, key: 'verify-reject' },
  ];

  /* ───────── Export ───────── */
  const [hiddenDistrictColumns, setHiddenDistrictColumns] = useState<string[]>([]);

  const districtCols: ExportColumn<SrtDistrictRow>[] = useMemo(
    () => [
      { header: 'District', accessor: (r) => r.district || '' },
      { header: 'Allocated Sites', accessor: (r) => n(r.site_count) },
      { header: 'Installed Complete', accessor: (r) => n(r.inst_complete) },
      { header: 'Pending Installation', accessor: (r) => n(r.inst_pending) },
      { header: 'Payment 1 Paid', accessor: (r) => n(r.inst_pay1) },
      { header: 'Completion %', accessor: (r) => `${pctOf(n(r.inst_complete), n(r.site_count))}%` },
    ],
    []
  );

  const stamp = new Date().toISOString().slice(0, 10);

  const getExportValue = <T,>(row: T, column: ExportColumn<T>) => {
    if (typeof column.accessor === 'function') return column.accessor(row);
    return (row as unknown as Record<string, unknown>)[column.accessor as string];
  };

  const escapeExportValue = (value: unknown) => (value === null || value === undefined ? '' : String(value));

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

  const exportToCSV = <T,>(dataToExport: T[], columns: ExportColumn<T>[], filename: string) => {
    if (!dataToExport.length || !columns.length) return;
    const rows = [
      columns.map((column) => column.header ?? column.label ?? ''),
      ...dataToExport.map((row) => columns.map((column) => escapeExportValue(getExportValue(row, column)))),
    ];
    const csv = rows.map((row) => row.map((value) => `"${value.replace(/"/g, '""')}"`).join(',')).join('\r\n');
    downloadTextFile(`\ufeff${csv}`, `${filename}.csv`, 'text/csv');
  };

  const copyToClipboard = async <T,>(dataToCopy: T[], columns: ExportColumn<T>[]) => {
    if (!dataToCopy.length || !columns.length) return;
    const textToCopy = [
      columns.map((column) => column.header ?? column.label ?? '').join('\t'),
      ...dataToCopy.map((row) => columns.map((column) => escapeExportValue(getExportValue(row, column))).join('\t')),
    ].join('\n');
    try {
      await navigator.clipboard.writeText(textToCopy);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = textToCopy;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  };

  const exportToExcel = <T,>(dataToExport: T[], columns: ExportColumn<T>[], filename: string) => {
    if (!dataToExport.length || !columns.length) return;
    const tableHtml = `<table border="1"><thead><tr>${columns.map((c) => `<th>${escapeHtml(escapeExportValue(c.header))}</th>`).join('')}</tr></thead><tbody>${dataToExport.map((row) => `<tr>${columns.map((c) => `<td>${escapeHtml(escapeExportValue(getExportValue(row, c)))}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8" /></head><body>${tableHtml}</body></html>`;
    downloadTextFile(`\ufeff${html}`, `${filename}.xls`, 'application/vnd.ms-excel');
  };

  const exportToPDF = <T,>(dataToExport: T[], columns: ExportColumn<T>[], title: string) => {
    if (!dataToExport.length || !columns.length) return;
    const rows = dataToExport.map((row) => columns.map((column) => escapeHtml(escapeExportValue(getExportValue(row, column)))));
    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    if (!printWindow) return;
    printWindow.document.write(`<!doctype html><html><head><meta charset="UTF-8" /><title>${escapeHtml(title)}</title><style>
      *{box-sizing:border-box}body{font-family:Arial,sans-serif;padding:24px;color:#222}h1{font-size:20px;margin:0 0 16px}
      table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #d8dee6;padding:7px 8px;text-align:left;vertical-align:top}
      th{background:#f3f5f7;font-weight:700}@media print{body{padding:0}@page{size:landscape;margin:12mm}}
    </style></head><body><h1>${escapeHtml(title)}</h1><table><thead><tr>${columns.map((c) => `<th>${escapeHtml(escapeExportValue(c.header))}</th>`).join('')}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((v) => `<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table><script>window.onload=function(){window.print();};</script></body></html>`);
    printWindow.document.close();
    printWindow.focus();
  };

  const makeToolbarColumns = <T,>(columns: ExportColumn<T>[], hidden: string[]) =>
    columns.map((column, index) => ({
      key: `${column.header}-${index}`,
      label: column.header ?? column.label ?? '',
      visible: !hidden.includes(`${column.header}-${index}`),
    }));

  const visibleColumns = <T,>(columns: ExportColumn<T>[], hidden: string[]) =>
    columns.filter((column, index) => !hidden.includes(`${column.header}-${index}`));

  const districtToolbarColumns = makeToolbarColumns(districtCols, hiddenDistrictColumns);
  const toggleIn = (setter: React.Dispatch<React.SetStateAction<string[]>>) => (key: string) =>
    setter((prev) => (prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]));

  // Clickable numeric cell used in the district table
  const cell = (color: string | undefined, value: number, title: string, status: string, district?: string, hash?: string) => (
    <td
      className="ax-table__td ax-table__td--num ax-num"
      style={{ color, fontWeight: 600, cursor: 'pointer' }}
      title={title}
      onClick={(e) => { e.stopPropagation(); openStatusView(status, district, hash); }}
    >
      {num(value)}
    </td>
  );

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      {/* 1. Page Header */}
      <PageHead
        title="Bihar SRT Installation Dashboard"
        subtitle={
          <span style={{ display: 'inline-block', fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>
            Solar Rooftop (SRT) Operations, District Analysis & Execution Throughput
            {updatedAt ? ` · Last updated ${fmtTime(updatedAt)}` : ''}
          </span>
        }
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Bihar' },
          { label: 'Installation' },
          { label: 'SRT' },
          { label: 'Dashboard' },
        ]}
        actions={
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill" style={{ fontWeight: 600, paddingInline: 'var(--ax-space-3)' }}>
              <span className="ax-badge__dot" /> State: Bihar
            </span>
            <button type="button" className="ax-btn ax-btn--ghost ax-btn--icon" aria-label="Refresh dashboard" onClick={() => loadDashboardData(true)} disabled={isRefreshing}>
              <span className={isRefreshing ? 'ax-spinner' : ''}>{ICON_REFRESH}</span>
            </button>
            <Link to="/v/bihar/installation/srt/status-view?status=inst-complete#completed" className="ax-btn ax-btn--secondary ax-btn--sm">
              Status Register
            </Link>
            <Link to="/v/srt/allassignsite" className="ax-btn ax-btn--primary ax-btn--sm">
              <span className="ax-btn__label">View Installed Sites</span>
            </Link>
          </div>
        }
      />

      <div className="ax-dash-grid mt-0 pt-0">
        {apiError && (
          <div className="ax-col--12" style={{ padding: '10px 14px', background: 'color-mix(in oklab, var(--ax-viz-red) 12%, transparent)', color: 'var(--ax-viz-red)', borderRadius: 'var(--ax-radius-md)', fontSize: 'var(--ax-text-xs)' }}>
            <b>Error loading dashboard data:</b> {apiError}{' '}
            <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" onClick={() => loadDashboardData(true)}>Retry</button>
          </div>
        )}

        {/* 2. Operations Filter Bar */}
        <section
          className="ax-card ax-card--flat ax-col--12"
          role="region"
          aria-label="Bihar SRT Dashboard Filters"
          style={{ padding: '8px 16px', borderRadius: 'var(--ax-radius-lg)', border: '1px solid var(--ax-border-subtle)', background: 'var(--ax-bg-surface)' }}
        >
          <div className="ax-cluster" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--ax-space-3)', alignItems: 'center' }}>
            <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
              <span
                className="ax-cluster"
                style={{
                  gap: '6px', color: 'var(--ax-text-strong)', fontSize: 'var(--ax-text-xs)', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.04em', padding: '4px 10px',
                  background: 'rgba(var(--ax-accent-rgb), 0.08)', borderRadius: 'var(--ax-radius-pill)',
                  border: '1px solid rgba(var(--ax-accent-rgb), 0.18)',
                }}
              >
                {ICON_FILTER} Filter Operations
              </span>

              <div className="ax-cluster srt-filter-item">
                <label htmlFor="bsrt-district-select" style={labelStyle}>District:</label>
                <select id="bsrt-district-select" className="ax-input ax-input--sm" style={selectStyle} value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)}>
                  <option value="All">All Districts ({districtOptions.length})</option>
                  {districtOptions.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div className="ax-cluster srt-filter-item">
                <label htmlFor="bsrt-status-select" style={labelStyle}>Status:</label>
                <select id="bsrt-status-select" className="ax-input ax-input--sm" style={selectStyle} value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                  <option value="All">All Operations</option>
                  <option value="Complete">Installed Sites</option>
                  <option value="Pending">Pending Installation</option>
                  <option value="Payment1">Payment 1 Paid</option>
                </select>
              </div>

              {filtersActive && (
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--sm"
                  style={{ height: 28, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }}
                  onClick={() => { setSelectedDistrict('All'); setSelectedStatus('All'); }}
                >
                  Reset Filters
                </button>
              )}
            </div>

            <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>
                Showing <b style={{ color: 'var(--ax-text-strong)' }}>{dash(summary.site_count)}</b> Sites across <b style={{ color: 'var(--ax-text-strong)' }}>{filteredDistricts.length}</b> {filteredDistricts.length === 1 ? 'District' : 'Districts'} · Live: <b style={{ color: 'var(--ax-text-strong)' }}>{todayLabel}</b>
              </span>
            </div>
          </div>
        </section>

        {/* 3. Executive Welcome Banner */}
        <section className="ax-card ax-welcome ax-col--12" role="region" aria-label="Bihar SRT Installation Overview">
          <div className="ax-welcome__body">
            <div className="ax-welcome__text">
              <p className="ax-welcome__eyebrow">Bihar Solar Rooftop System</p>
              <h2 className="ax-card__title">Welcome to Bihar SRT Operations Dashboard</h2>
              <p className="ax-welcome__lede">
                Bihar SRT execution overview: <b>{dash(summary.site_count)} sites</b> allocated across <b>{districtOptions.length} districts</b>.
                <b> {dash(summary.complete)} ({instPct}%)</b> installed, with <b>{dash(summary.verify_approved)} ({approvedPct}%)</b> verified and approved, <b>{dash(summary.claim_raised)}</b> claims raised and <b>{dash(summary.inst_pay1)}</b> first payments disbursed.
              </p>
            </div>

            <dl className="ax-welcome__stats">
              <div className="ax-welcome__stat">
                <dt>Total Districts</dt>
                <dd className="ax-num">{num(districtOptions.length)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-emerald)' }}>Bihar Operational Scope</small>
              </div>
              <div className="ax-welcome__stat">
                <dt>Allocated Sites</dt>
                <dd className="ax-num">{dash(summary.site_count)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-accent)' }}>Total Sanctioned</small>
              </div>
              <div className="ax-welcome__stat">
                <dt>Installed Sites</dt>
                <dd className="ax-num">{dash(summary.complete)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-emerald)' }}>{instPct}% Complete</small>
              </div>
              <div className="ax-welcome__stat">
                <dt>Verified Approved</dt>
                <dd className="ax-num">{dash(summary.verify_approved)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-amber)' }}>{num(summary.verify_pending)} In Audit</small>
              </div>
            </dl>
          </div>
        </section>

        {/* 4. Core KPI Cards — click a number to open that status */}
        <KpiCard
          icon={I_PIN}
          tone="accent"
          label="Total Allocated Sites"
          value={dash(summary.site_count)}
          unit="Sites"
          sub="Sanctioned SRT sites"
          spark={spk((d) => n(d.site_count))}
          onClick={() => openStatusView('total')}
        />
        <KpiCard
          icon={I_BOLT}
          tone="emerald"
          label="Installation Status"
          sub="Installed / Pending"
          badge={`${instPct}%`}
          spark={spk((d) => n(d.inst_complete))}
          onClick={() => openStatusView('inst-complete', undefined, 'completed')}
          pills={[
            { label: 'Installed', count: dash(summary.complete), onClick: () => openStatusView('inst-complete', undefined, 'completed') },
            { label: 'Pending', count: dash(summary.pending), onClick: () => openStatusView('inst-pending', undefined, 'pending') },
          ]}
        />
        <KpiCard
          icon={I_SEARCH}
          tone="accent"
          label="Inspection Status"
          sub="Complete / Pending"
          badge={n(summary.inpection_complete) > 0 ? `${inspPct}%` : undefined}
          onClick={() => openStatusView('inpection-complete', undefined, 'completed')}
          pills={[
            { label: 'Complete', count: dash(summary.inpection_complete), onClick: () => openStatusView('inpection-complete', undefined, 'completed') },
            { label: 'Pending', count: dash(summary.inpection_pending), onClick: () => openStatusView('inpection-pending', undefined, 'pending') },
          ]}
        />
        <KpiCard
          icon={I_SHIELD}
          tone="cyan"
          label="Verification Status"
          sub="Approved / Pending / Rejected"
          badge={`${approvedPct}%`}
          onClick={() => openStatusView('verify-approved')}
          pills={[
            { label: 'Approved', count: dash(summary.verify_approved), onClick: () => openStatusView('verify-approved') },
            { label: 'Verify Pending', count: dash(summary.verify_pending), onClick: () => openStatusView('verify-pending', undefined, 'pending') },
            { label: 'Rejected', count: dash(summary.verify_reject), onClick: () => openStatusView('verify-reject') },
          ]}
        />
        <KpiCard
          icon={I_DOC}
          tone="violet"
          label="Documents Status"
          sub="Submitted / Pending"
          badge={n(summary.inst_doc_complete) > 0 ? `${docPct}%` : undefined}
          onClick={() => openStatusView('inst-doc-complete')}
          pills={[
            { label: 'Submitted', count: dash(summary.inst_doc_complete), onClick: () => openStatusView('inst-doc-complete') },
            { label: 'Pending', count: dash(summary.inst_doc_pending), onClick: () => openStatusView('inst-doc-pending', undefined, 'pending') },
          ]}
        />
        <KpiCard
          icon={I_LIST}
          tone="amber"
          label="Claim Status"
          sub="Applicable / Raised"
          badge={n(summary.claim_raised) > 0 ? `${num(summary.claim_raised)} Raised` : undefined}
          onClick={() => openStatusView('claim-raised')}
          pills={[
            { label: 'Applicable', count: dash(summary.claim_applicable), onClick: () => openStatusView('claim-applicable') },
            { label: 'Raised', count: dash(summary.claim_raised), onClick: () => openStatusView('claim-raised') },
          ]}
        />
        <KpiCard
          icon={I_COIN}
          tone="cyan"
          label="Payment Status"
          sub="Payment 1 / 2 / 3 Paid"
          badge={n(summary.inst_pay1) > 0 ? 'Disbursed' : undefined}
          spark={spk((d) => n(d.inst_pay1))}
          onClick={() => openStatusView('inst-pay1', undefined, 'payment')}
          pills={[
            { label: 'Payment 1', count: dash(summary.inst_pay1), onClick: () => openStatusView('inst-pay1', undefined, 'payment') },
            { label: 'Payment 2', count: dash(summary.inst_pay2), onClick: () => openStatusView('inst-pay2', undefined, 'payment') },
            { label: 'Payment 3', count: dash(summary.inst_pay3), onClick: () => openStatusView('inst-pay3', undefined, 'payment') },
          ]}
        />
        <KpiCard
          icon={I_CREDIT}
          tone="violet"
          label="Payment Amounts"
          sub="Payment 1 / 2 / 3 (₹)"
          onClick={() => openStatusView('inst-pay1', undefined, 'payment')}
          pills={[
            { label: 'Amount 1', count: cur(summary.inst_pay1_amount), onClick: () => openStatusView('inst-pay1', undefined, 'payment') },
            { label: 'Amount 2', count: cur(summary.inst_pay2_amount), onClick: () => openStatusView('inst-pay2', undefined, 'payment') },
            { label: 'Amount 3', count: cur(summary.inst_pay3_amount), onClick: () => openStatusView('inst-pay3', undefined, 'payment') },
          ]}
        />

        {/* 5. Operational Highlights */}
        <div className="ax-col--12" style={{ marginTop: 'var(--ax-space-3)', marginBottom: 'var(--ax-space-1)' }}>
          <div className="ax-cluster" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--ax-space-2)' }}>
            <div>
              <span className="ax-card__eyebrow" style={{ color: 'var(--ax-accent)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                Operations & Quality Performance
              </span>
              <h2 className="ax-card__title" style={{ fontSize: 'var(--ax-text-lg)', margin: 0 }}>
                Execution Throughput & Quality Health
              </h2>
            </div>
            <span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--pill" style={{ fontSize: 'var(--ax-text-xs)' }}>
              Bihar SRT Vendor Portal
            </span>
          </div>
        </div>

        <KpiCard
          icon={I_COIN}
          tone="emerald"
          label="Disbursed Billing Amount"
          value={loading && !data ? '…' : cur(totalPaidAmount)}
          sub="Payment 1 + 2 + 3 disbursed"
          badge="Verified"
          onClick={() => openStatusView('inst-pay1', undefined, 'payment')}
        />
        <KpiCard
          icon={I_SHIELD}
          tone="cyan"
          label="Quality Pass Rate"
          value={`${passRate}%`}
          sub={`${num(summary.verify_approved)} Passed · ${num(summary.verify_reject)} Rejected`}
          badge="Verification"
          onClick={() => openStatusView('verify-approved')}
        />
        <KpiCard
          icon={I_CREDIT}
          tone="accent"
          label="Claim Raise Rate"
          value={`${claimRate}%`}
          sub={`${num(summary.claim_raised)} raised of ${num(summary.claim_applicable)} applicable`}
          onClick={() => openStatusView('claim-raised')}
        />
        <KpiCard
          icon={I_BOLT}
          tone="violet"
          label="Payment Settlement"
          value={`${payRate}%`}
          sub={`${num(summary.inst_pay1)} of ${num(summary.claim_raised)} claims paid (P1)`}
          onClick={() => openStatusView('inst-pay1', undefined, 'payment')}
        />

        {/* State Operations Executive Card */}
        <section className="ax-card ax-col--12" role="region" aria-label="Bihar SRT Operations Overview">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow" style={{ color: 'var(--ax-accent)' }}>State Operations</span>
              <h3 className="ax-card__title">Bihar · Solar Rooftop (SRT) Operations</h3>
              <p className="ax-card__subtitle">{num(summary.complete)} sites installed across {districtOptions.length} districts in Bihar · {num(monthTotal)} installed in tracked months</p>
            </div>
            <Link to="/v/srt/allassignsite" className="ax-btn ax-btn--sm ax-btn--primary">
              View Installation Register →
            </Link>
          </div>
          <div className="ax-card__body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-3)' }}>
            <div className="ax-grid ax-grid--2" style={{ gap: 'var(--ax-space-2)' }}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => openStatusView('inst-complete', undefined, 'completed')}
                onKeyDown={onActivate(() => openStatusView('inst-complete', undefined, 'completed'))}
                style={{ padding: '10px 12px', background: 'var(--ax-surface-subtle)', borderRadius: 'var(--ax-radius-md)', cursor: 'pointer' }}
                className="srt-interactive-kpi"
                title="View installed sites in status register"
              >
                <small style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-xs)' }}>Installed &amp; Operational</small>
                <div style={{ fontSize: 'var(--ax-text-lg)', fontWeight: 700, color: 'var(--ax-viz-emerald)' }}>
                  {dash(summary.complete)} <span style={{ fontSize: 'var(--ax-text-xs)', fontWeight: 500 }}>({instPct}%)</span>
                </div>
              </div>
              <div
                role="button"
                tabIndex={0}
                onClick={() => openStatusView('inst-pending', undefined, 'pending')}
                onKeyDown={onActivate(() => openStatusView('inst-pending', undefined, 'pending'))}
                style={{ padding: '10px 12px', background: 'var(--ax-surface-subtle)', borderRadius: 'var(--ax-radius-md)', cursor: 'pointer' }}
                className="srt-interactive-kpi"
                title="View pending sites in status register"
              >
                <small style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-xs)' }}>Pending Execution</small>
                <div style={{ fontSize: 'var(--ax-text-lg)', fontWeight: 700, color: 'var(--ax-viz-amber)' }}>
                  {dash(summary.pending)} <span style={{ fontSize: 'var(--ax-text-xs)', fontWeight: 500 }}>({pendingPct}%)</span>
                </div>
              </div>
            </div>

            <div>
              <div className="ax-cluster" style={{ justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>Overall Installation Execution Efficiency</span>
                <b className="ax-num" style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-emerald)' }}>{instPct}%</b>
              </div>
              <div className="ax-progress ax-progress--sm">
                <div className="ax-progress__track">
                  <div className="ax-progress__fill" style={{ width: `${instPct}%`, background: 'var(--ax-viz-emerald)' }} />
                </div>
              </div>
            </div>

            <div style={{ paddingTop: 'var(--ax-space-2)', borderTop: '1px solid var(--ax-border-subtle)', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
              <b>Verification & Billing:</b> {num(summary.verify_approved)} sites approved ({approvedPct}%) · {num(summary.claim_raised)} claims raised · {num(summary.inst_pay1)} first payments confirmed.
            </div>
          </div>
        </section>

        {/* 6. District Wise Installations (8) + Status Donut (4) */}
        <section className="ax-card ax-card--chart ax-col--8" role="region" aria-label="District wise installations">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Geographic Breakdown</span>
              <h2 className="ax-card__title">District Wise Installations</h2>
              <p className="ax-card__subtitle">{num(summary.complete)} installed of {num(summary.site_count)} allocated across {districtOptions.length} districts</p>
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
            {chartDistricts.length === 0 ? (
              <div style={{ height: chartH, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ax-text-muted)', fontSize: 13 }}>
                {loading ? 'Loading district data from server…' : 'No district installation data available.'}
              </div>
            ) : (
              <Suspense fallback={<div className="ax-skeleton" style={{ height: chartH }} />}>
                <ApexChart
                  key={`dist-chart-${chartH}-${chartDistricts.map((d) => `${d.district}-${d.inst_complete}-${d.site_count}`).join('-')}`}
                  type="bar"
                  height={chartH}
                  legend="none"
                  ariaLabel="District-wise installation comparison"
                  series={[
                    { name: 'Installed Sites', data: chartDistricts.map((d) => n(d.inst_complete)) },
                    { name: 'Allocated Sites', data: chartDistricts.map((d) => n(d.site_count)) },
                  ]}
                  apex={{
                    colors: [LIGHT_GREEN, LIGHT_BLUE],
                    plotOptions: { bar: { horizontal: false, borderRadius: 4, columnWidth: '35%' } },
                    xaxis: { categories: chartDistricts.map((d) => d.district), labels: { style: { fontSize: '11px' }, rotate: -35 } },
                    yaxis: { title: { text: 'Sites (Nos.)', style: { color: 'var(--ax-text-muted)' } } },
                    chart: {
                      events: {
                        dataPointSelection: (_event: unknown, _chart: unknown, opts: any) => {
                          const dist = chartDistricts[opts?.dataPointIndex]?.district;
                          if (dist) openStatusView('inst-complete', dist, 'completed');
                        },
                      },
                    },
                  }}
                />
              </Suspense>
            )}
          </div>
        </section>

        <section className="ax-card ax-col--4" role="region" aria-label="Installation status split">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Execution Distribution</span>
              <h2 className="ax-card__title">Status Breakdown</h2>
              <p className="ax-card__subtitle">Total {dash(summary.site_count)} Sites</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            {total > 0 ? (
              <Suspense fallback={<div className="ax-skeleton" style={{ height: donutH }} />}>
                <ApexChart
                  key={`donut-${donutH}-${donutItems.map((s) => s.v).join('-')}`}
                  type="donut"
                  height={donutH}
                  legend="none"
                  ariaLabel="Installation status split"
                  series={donutItems.map((s) => s.v || 0)}
                  apex={{
                    labels: donutItems.map((s) => s.label),
                    colors: donutItems.map((s) => s.color),
                    stroke: { width: 0 },
                    chart: {
                      events: {
                        dataPointSelection: (_event: unknown, _chart: unknown, opts: any) => {
                          const key = donutItems[opts?.dataPointIndex]?.key;
                          if (key) openStatusView(key);
                        },
                      },
                    },
                    plotOptions: {
                      pie: {
                        donut: {
                          size: '72%',
                          labels: {
                            show: true,
                            name: { fontFamily: cv('--ax-font-sans') },
                            value: { fontFamily: cv('--ax-font-mono'), fontWeight: 600 },
                            total: { show: true, label: 'Sites', formatter: () => num(summary.site_count) },
                          },
                        },
                      },
                    },
                  }}
                />
              </Suspense>
            ) : (
              <TableEmptyState title="No installation data" message="Status split appears once sites are allocated." />
            )}
            <ul className="ax-list ax-list--compact" style={{ marginTop: 'var(--ax-space-3)' }}>
              {donutItems.map((s) => (
                <li
                  key={s.label}
                  className="ax-list__row"
                  style={{ border: 0, paddingInline: 0, cursor: 'pointer' }}
                  onClick={() => openStatusView(s.key)}
                >
                  <span className="ax-list__leading"><i style={{ width: 9, height: 9, borderRadius: 3, background: s.color, display: 'inline-block' }} /></span>
                  <span className="ax-list__content">
                    <span className="ax-list__title" style={{ fontWeight: 'var(--ax-weight-medium)' }}>{s.label}</span>
                    <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>{s.sub}</span>
                  </span>
                  <span className="ax-list__trailing ax-num" style={{ color: 'var(--ax-text-strong)', fontWeight: 600 }}>
                    {num(s.v)} ({pctOf(s.v, total)}%)
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 7. Monthly Installation Trend (8) + Milestones (4) */}
        <section className="ax-card ax-card--chart ax-col--8" role="region" aria-label="Monthly installation throughput">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Monthly Execution</span>
              <h2 className="ax-card__title">Monthly Installation Trend</h2>
              <p className="ax-card__subtitle">{num(monthTotal)} installations across {monthly.length} month{monthly.length === 1 ? '' : 's'}</p>
            </div>
            <div className="ax-card__actions">
              <span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--pill">
                {monthly.length} Months Tracked
              </span>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            {monthly.length === 0 ? (
              <div style={{ height: chartH, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ax-text-muted)', fontSize: 13 }}>
                {loading ? 'Loading trend data…' : 'No monthly installation trend records returned by server.'}
              </div>
            ) : (
              <Suspense fallback={<div className="ax-skeleton" style={{ height: chartH }} />}>
                <ApexChart
                  key={`monthly-${chartH}-${monthly.map((m) => `${m.month_year}-${m.monthly_installations}`).join('-')}`}
                  type="area"
                  height={chartH}
                  legend="top"
                  ariaLabel="Monthly installations area chart"
                  series={[{ name: 'Monthly Installed Sites', data: monthly.map((m) => n(m.monthly_installations)) }]}
                  apex={{
                    colors: [LIGHT_BLUE],
                    stroke: { curve: 'smooth', width: 2 },
                    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.05, stops: [0, 90, 100] } },
                    markers: { size: 4, strokeWidth: 0, hover: { size: 6 } },
                    dataLabels: { enabled: false },
                    xaxis: { categories: monthly.map((m) => fmtMonth(m.month_year)) },
                    yaxis: { min: 0, forceNiceScale: true, labels: { formatter: (v: number) => `${Math.round(v)}` }, title: { text: 'Installed (Nos.)', style: { color: 'var(--ax-text-muted)' } } },
                    tooltip: { y: { formatter: (v: number) => `${v} Sites` } },
                  }}
                />
              </Suspense>
            )}
          </div>
        </section>

        <section className="ax-card ax-col--4" role="region" aria-label="SRT Workflow Milestones">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Workflow Lifecycle</span>
              <h2 className="ax-card__title">SRT Milestones</h2>
              <p className="ax-card__subtitle">Progress across installation stages</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0, display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-4)' }}>
            {milestones.map((m) => {
              const p = pctOf(m.v, m.of);
              return (
                <div
                  key={m.label}
                  role="button"
                  tabIndex={0}
                  onClick={() => openStatusView(m.key)}
                  onKeyDown={onActivate(() => openStatusView(m.key))}
                  style={{ cursor: 'pointer', padding: '6px 8px', borderRadius: 'var(--ax-radius-sm)' }}
                  className="srt-interactive-kpi"
                  title={`Drill down to ${m.label}`}
                >
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

        {/* 8. District Wise Detailed Table (8) */}
        <section className="ax-card ax-col--8" role="region" aria-label="District wise summary table">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Geographic Breakdown</span>
              <h2 className="ax-card__title">District Wise SRT Summary</h2>
              <p className="ax-card__subtitle">Allocated, installed, pending and payment progress per district</p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                <SearchInput value={tableQuery} onChange={setTableQuery} placeholder="Search district…" ariaLabel="Search districts" />
                <TableExportToolbar
                  onCopy={() => copyToClipboard(tableDistricts, visibleColumns(districtCols, hiddenDistrictColumns))}
                  onExportCSV={() => exportToCSV(tableDistricts, visibleColumns(districtCols, hiddenDistrictColumns), `Bihar_SRT_District_Wise_${stamp}`)}
                  onExportExcel={() => exportToExcel(tableDistricts, visibleColumns(districtCols, hiddenDistrictColumns), `Bihar_SRT_District_Wise_${stamp}`)}
                  onExportPDF={() => exportToPDF(tableDistricts, visibleColumns(districtCols, hiddenDistrictColumns), 'Bihar SRT District Wise Installation Breakdown')}
                  columns={districtToolbarColumns}
                  onToggleColumn={toggleIn(setHiddenDistrictColumns)}
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
                  <th className="ax-table__th ax-table__th--num" scope="col">Payment 1 Paid</th>
                  <th className="ax-table__th" scope="col">Progress</th>
                </tr>
              </thead>
              <tbody>
                {loading && !data ? (
                  <tr><td className="ax-table__td" colSpan={6} style={emptyCellStyle}><span className="ax-spinner" /> Loading district records…</td></tr>
                ) : pD.paginatedData.length === 0 ? (
                  <tr><td className="ax-table__td" colSpan={6} style={emptyCellStyle}>{apiError ? 'Could not load districts from server.' : 'No districts match the filter criteria.'}</td></tr>
                ) : (
                  pD.paginatedData.map((d) => (
                    <tr
                      key={d.district}
                      className="ax-table__row"
                      role="button"
                      tabIndex={0}
                      onClick={() => openStatusView('inst-complete', d.district, 'completed')}
                      onKeyDown={onActivate(() => openStatusView('inst-complete', d.district, 'completed'))}
                      style={{ cursor: 'pointer' }}
                    >
                      <td className="ax-table__td" style={{ fontWeight: 'var(--ax-weight-semibold)', color: 'var(--ax-text-strong)' }}>
                        <b>{d.district}</b>
                      </td>
                      {cell(undefined, n(d.site_count), `View all allocated sites in ${d.district}`, 'total', d.district)}
                      {cell('var(--ax-viz-emerald)', n(d.inst_complete), `View installed sites in ${d.district}`, 'inst-complete', d.district, 'completed')}
                      {cell('var(--ax-viz-amber)', n(d.inst_pending), `View pending sites in ${d.district}`, 'inst-pending', d.district, 'pending')}
                      {cell('var(--ax-viz-cyan)', n(d.inst_pay1), `View payment 1 sites in ${d.district}`, 'inst-pay1', d.district, 'payment')}
                      <td className="ax-table__td"><Bar pct={pctOf(n(d.inst_complete), n(d.site_count))} /></td>
                    </tr>
                  ))
                )}
                {pD.paginatedData.length > 0 && (
                  <tr className="ax-table__row" style={{ background: 'var(--ax-surface-subtle)', fontWeight: 'var(--ax-weight-bold)' }}>
                    <td className="ax-table__td" style={{ color: 'var(--ax-text-strong)' }}>Total ({filteredDistricts.length} Districts)</td>
                    {cell(undefined, total, 'View all allocated sites', 'total')}
                    {cell('var(--ax-viz-emerald)', n(summary.complete), 'View installed sites', 'inst-complete', undefined, 'completed')}
                    {cell('var(--ax-viz-amber)', n(summary.pending), 'View pending sites', 'inst-pending', undefined, 'pending')}
                    {cell('var(--ax-viz-cyan)', n(summary.inst_pay1), 'View payment 1 sites', 'inst-pay1', undefined, 'payment')}
                    <td className="ax-table__td"><Bar pct={Math.round(instPct)} /></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="ax-card__footer" style={footerStyle}>
            <div className="srt-pagination-left">
              <Pagination
                currentPage={pD.currentPage}
                totalItems={pD.totalItems}
                pageSize={pD.pageSize}
                onPageChange={pD.setPage}
                onPageSizeChange={pD.setPageSize}
                pageSizeOptions={[10, 15, 25, 50, 100]}
              />
            </div>
          </div>
        </section>

        {/* 9. District Quick Access (4) */}
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
                <span style={{ fontSize: 'var(--ax-text-sm)', fontWeight: 600, color: 'var(--ax-text-strong)' }}>Top Execution Districts</span>
                <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill">{dash(summary.complete)} Installed</span>
              </div>
              <div className="ax-statgroup ax-statgroup--stack" style={{ gap: 'var(--ax-space-2)' }}>
                {chartDistricts.slice(0, 8).map((d) => (
                  <button
                    key={d.district}
                    type="button"
                    className="ax-cluster"
                    onClick={() => openStatusView('inst-complete', d.district, 'completed')}
                    style={{ width: '100%', justifyContent: 'space-between', fontSize: 'var(--ax-text-xs)', border: 0, background: 'transparent', padding: '6px 0', cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid var(--ax-border-subtle)' }}
                  >
                    <span style={{ color: 'var(--ax-text-muted)', fontWeight: 500 }}>{d.district}</span>
                    <b className="ax-num" style={{ color: 'var(--ax-viz-emerald)' }}>
                      {num(n(d.inst_complete))} / {num(n(d.site_count))} ({pctOf(n(d.inst_complete), n(d.site_count) || 1)}%)
                    </b>
                  </button>
                ))}
                {districtwise.length === 0 && (
                  <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>{loading ? 'Loading districts…' : 'No district data returned by server.'}</span>
                )}
              </div>
            </div>

            <div className="ax-divider" style={{ marginBlock: 'var(--ax-space-4)' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 'var(--ax-text-xs)', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)', letterSpacing: '0.04em' }}>
                Quick Module Actions
              </span>
              <Link to="/v/bihar/installation/srt/status-view?status=inst-complete#completed" className="ax-btn ax-btn--secondary ax-btn--sm" style={{ justifyContent: 'space-between' }}>
                <span>Status Register</span>
                <span>→</span>
              </Link>
              <Link to="/v/bihar/installation/srt/status-view?status=inst-pending#pending" className="ax-btn ax-btn--secondary ax-btn--sm" style={{ justifyContent: 'space-between' }}>
                <span>Pending Installations</span>
                <span>→</span>
              </Link>
              <Link to="/v/srt/allassignsite" className="ax-btn ax-btn--primary ax-btn--sm" style={{ justifyContent: 'space-between' }}>
                <span>View Installed Sites</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Bihar_Installation_SRT_Dashboard;