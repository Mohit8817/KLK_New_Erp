import { lazy, Suspense, useCallback, useDeferredValue, useEffect, useMemo, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  biharUlaInstallationService,
  type UlaInstallationDashboardData,
} from '../../bihar-services';
import {
  Pagination,
  usePagination,
  SearchInput,
  TableExportToolbar,
  type ExportColumn,
} from '../../../../../common';

// Code-split ApexCharts so the dashboard shell renders instantly
const ApexChart = lazy(() => import('../../../../charts/ApexChart').then((m) => ({ default: m.ApexChart })));

// Palette constants matching Karnataka SWP / DLE / Solar ERP design language
const LIGHT_BLUE = '#2563eb';
const LIGHT_GREEN = '#10b981';
const LIGHT_CYAN = '#0891b2';
const LIGHT_AMBER = '#f59e0b';
const LIGHT_VIOLET = '#7c3aed';
const LIGHT_RED = '#ef4444';

/* ───────── Types ───────── */
interface UlaSummary {
  site_count: number;
  structure_complete: number;
  structure_pending: number;
  structure_verify_pending: number;
  structure_verify_approved: number;
  structure_verify_reject: number;
  complete: number;
  pending: number;
  verify_pending: number;
  verify_approved: number;
  verify_reject: number;
  inst_doc_complete: number;
  inst_doc_pending: number;
  doc_verify_approve: number;
  doc_verify_pending: number;
  doc_verify_reject: number;
  claim50_applicable: number;
  claim50_raised: number;
  inst_claim50_verify_papprove: number;
  inst_claim50_verify_pending: number;
  inst_claim50_verify_reject: number;
  claim30_applicable: number;
  claim30_raised: number;
  inst_claim30_verify_papprove: number;
  inst_claim30_verify_pending: number;
  inst_claim30_verify_reject: number;
  inst_pay50_partially: number;
  inst_pay50_paid: number;
  inst_pay50_pending: number;
  inst_pay30_partially: number;
  inst_pay30_paid: number;
  inst_pay30_pending: number;
}

interface DistrictRow {
  district: string;
  site_count: number;
  structure_complete: number;
  structure_pending: number;
  structure_verify_pending: number;
  structure_verify_approved: number;
  structure_verify_reject: number;
  inst_complete: number;
  inst_pending: number;
  verify_pending: number;
  verify_approved: number;
  verify_reject: number;
  inst_doc_complete: number;
  inst_doc_pending: number;
  doc_verify_approved: number;
  doc_verify_pending: number;
  doc_verify_reject: number;
}

/* ───────── Helpers ───────── */
const num = (x: number) => (x || 0).toLocaleString('en-IN');
const pctOf = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : 0);
const n = (v: unknown) => Number(v ?? 0) || 0;
const pad = (x: number) => String(x).padStart(2, '0');
const fmtDate = (d: Date) => `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const initials = (s: string) => s.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';
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

// Responsive chart height hook matching Karnataka dashboard
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

/* ───────── Responsive page CSS (same as Karnataka SWP dashboard) ───────── */
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
  .solar-erp-page .ax-table { min-width: 850px; }
  .solar-erp-page .ula-table--sm { min-width: 540px; }
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
  .solar-erp-page .kpi-seg {
    cursor: pointer; border-radius: 4px; padding: 0 2px; transition: background 120ms ease, color 120ms ease;
  }
  .solar-erp-page .kpi-seg:hover { background: rgba(var(--asw-primary-rgb), 0.12); color: var(--asw-primary); text-decoration: underline; }
  .solar-erp-page .kpi-seg:focus-visible { outline: 2px solid var(--asw-primary); outline-offset: 1px; }

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
    .solar-erp-page .asw-filter-item { width: 100%; justify-content: space-between; }
    .solar-erp-page .asw-filter-item select { flex: 1; width: auto; max-width: 100%; }
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
const I_DONE = svg(<><path d="M7 12l5 5l10 -10" /><path d="M2 12l5 5m5 -5l5 -5" /></>);
const I_SHIELD = svg(<><path d="M12 3a12 12 0 0 0 8.5 3a12 12 0 0 1 -8.5 15a12 12 0 0 1 -8.5 -15a12 12 0 0 0 8.5 -3" /><path d="M9 12l2 2l4 -4" /></>);
const I_DOC = svg(<><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" /><path d="M9 9l1 0" /><path d="M9 13l6 0" /><path d="M9 17l6 0" /></>);
const I_COIN = svg(<><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M14.8 9a2 2 0 0 0 -1.8 -1h-2a2 2 0 1 0 0 4h2a2 2 0 1 1 0 4h-2a2 2 0 0 1 -1.8 -1" /><path d="M12 7v10" /></>);
const I_CREDIT = svg(<><rect x="3" y="5" width="18" height="14" rx="3" /><line x1="3" y1="10" x2="21" y2="10" /><line x1="7" y1="15" x2="7.01" y2="15" /><line x1="11" y1="15" x2="13" y2="15" /></>);
const I_LIST = svg(<><path d="M9 6l11 0" /><path d="M9 12l11 0" /><path d="M9 18l11 0" /><path d="M5 6l0 .01" /><path d="M5 12l0 .01" /><path d="M5 18l0 .01" /></>);
const ICON_FILTER = (
  <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 4h16v2.172a2 2 0 0 1 -.586 1.414l-4.828 4.828v7.586l-4 -2v-5.586l-4.828 -4.828a2 2 0 0 1 -.586 -1.414v-2.172z" /></svg>
);
const ICON_REFRESH = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" /><path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" /></svg>
);

/* ───────── KPI card (Karnataka design) ───────── */
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
  pills?: { label: string; count: number | string; tone?: string; onClick: () => void }[];
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

function KpiCard({ icon, tone, label, value, unit, sub, badge, spark, sparkType = 'line', onClick, pills }: KpiProps) {
  const t = TONE[tone];
  const hasSpark = Array.isArray(spark) && spark.length > 1;
  const allZeros = hasSpark && spark!.every((v) => v === 0);
  const safeSpark = allZeros ? [0, 0, 0, 0, 0] : spark;

  return (
    <div
      className={`ax-card ax-col--3 ${onClick ? 'asw-interactive-kpi' : ''}`}
      role={onClick ? 'button' : 'region'}
      tabIndex={onClick ? 0 : undefined}
      aria-label={label}
      onClick={onClick}
      onKeyDown={onClick ? onActivate(onClick) : undefined}
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
              {pills && pills.length > 0
                ? pills.map((seg, i) => (
                    <span key={seg.label}>
                      {i > 0 && <span style={{ color: 'var(--ax-text-muted)', fontWeight: 500, margin: '0 4px' }}>/</span>}
                      <span
                        className="kpi-seg"
                        role="button"
                        tabIndex={0}
                        title={`View ${seg.label} sites`}
                        onClick={(e) => { e.stopPropagation(); seg.onClick(); }}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); seg.onClick(); } }}
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
const AVATAR_COLORS = [LIGHT_BLUE, LIGHT_CYAN, LIGHT_VIOLET, LIGHT_AMBER, '#db2777'];

export function Bihar_Installation_ULA_Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<UlaInstallationDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  // Filter states
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [tableQuery, setTableQuery] = useState<string>('');

  // Chart heights
  const chartH = useChartHeight(320, 260);
  const donutH = useChartHeight(230, 210);

  const loadDashboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setLoading(true);
    setApiError(null);
    try {
      const resp: any = await biharUlaInstallationService.getDashboardData();
      if (resp) {
        setData((resp?.data && (resp.data.ula || resp.data.districtwise) ? resp.data : resp) as UlaInstallationDashboardData);
        setUpdatedAt(new Date());
      } else {
        setApiError('Unable to load Bihar ULA dashboard data from server.');
      }
    } catch (err: any) {
      console.error('Bihar ULA Dashboard fetch error:', err);
      setApiError(err?.message || 'Failed to load Bihar ULA installation dashboard.');
    } finally {
      setLoading(false);
      if (isRefresh) setTimeout(() => setIsRefreshing(false), 400);
    }
  }, []);

  useEffect(() => { loadDashboardData(); }, [loadDashboardData]);

  // ── Status drill-down navigation ──
  const openStatusView = (statusKey: string, district?: string, hash?: string) => {
    const targetDistrict = district && district !== 'All' ? district : (selectedDistrict !== 'All' ? selectedDistrict : undefined);
    const params = new URLSearchParams();
    params.set('status', statusKey);
    if (targetDistrict) params.set('district', targetDistrict);
    const h = hash
      ? `#${hash}`
      : (statusKey === 'pending' || statusKey === 'structure-pending' ? '#pending'
        : (statusKey === 'complete' || statusKey === 'structure-complete' ? '#completed' : ''));
    navigate(`/v/bihar/installation/ula/status-view?${params.toString()}${h}`);
  };

  /* ───────── Raw API resolution ───────── */
  const rawApiUla: any = (data as any)?.ula || {};
  const pickVal = (...keys: string[]) => {
    for (const k of keys) {
      if (rawApiUla[k] !== undefined && rawApiUla[k] !== null) return n(rawApiUla[k]);
    }
    return 0;
  };

  const rawUla: UlaSummary = useMemo(() => ({
    site_count: pickVal('site_count', 'total_sites', 'total'),
    structure_complete: pickVal('structure_complete', 'structure_installed', 'structure_done'),
    structure_pending: pickVal('structure_pending'),
    structure_verify_pending: pickVal('structure_verify_pending'),
    structure_verify_approved: pickVal('structure_verify_approved', 'structure_approved'),
    structure_verify_reject: pickVal('structure_verify_reject', 'structure_rejected'),
    complete: pickVal('complete', 'inst_complete', 'installed'),
    pending: pickVal('pending', 'inst_pending'),
    verify_pending: pickVal('verify_pending', 'inst_verify_pending'),
    verify_approved: pickVal('verify_approved', 'inst_verify_approved', 'approved'),
    verify_reject: pickVal('verify_reject', 'inst_verify_reject', 'rejected'),
    inst_doc_complete: pickVal('inst_doc_complete', 'doc_complete', 'documents_submitted'),
    inst_doc_pending: pickVal('inst_doc_pending', 'doc_pending', 'documents_pending'),
    doc_verify_approve: pickVal('doc_verify_approve', 'doc_verify_approved', 'doc_approved', 'inst_doc_approved'),
    doc_verify_pending: pickVal('doc_verify_pending', 'doc_pending_approval', 'inst_doc_pending_approval'),
    doc_verify_reject: pickVal('doc_verify_reject', 'doc_rejected', 'inst_doc_reject'),
    claim50_applicable: pickVal('claim50_applicable', 'claim_50_applicable'),
    claim50_raised: pickVal('claim50_raised', 'claim_50_raised'),
    inst_claim50_verify_papprove: pickVal('inst_claim50_verify_papprove', 'claim50_approved', 'claim_50_approved', 'inst_claim50_approved'),
    inst_claim50_verify_pending: pickVal('inst_claim50_verify_pending', 'claim50_pending', 'claim_50_pending', 'inst_claim50_pending'),
    inst_claim50_verify_reject: pickVal('inst_claim50_verify_reject', 'claim50_reject', 'claim_50_reject', 'inst_claim50_rejected'),
    claim30_applicable: pickVal('claim30_applicable', 'claim_30_applicable'),
    claim30_raised: pickVal('claim30_raised', 'claim_30_raised'),
    inst_claim30_verify_papprove: pickVal('inst_claim30_verify_papprove', 'claim30_approved', 'claim_30_approved', 'inst_claim30_approved'),
    inst_claim30_verify_pending: pickVal('inst_claim30_verify_pending', 'claim30_pending', 'claim_30_pending', 'inst_claim30_pending'),
    inst_claim30_verify_reject: pickVal('inst_claim30_verify_reject', 'claim30_reject', 'claim_30_reject', 'inst_claim30_rejected'),
    inst_pay50_partially: pickVal('inst_pay50_partially', 'inst_pay50_partial', 'pay50_partial', 'payment50_partial'),
    inst_pay50_paid: pickVal('inst_pay50_paid', 'pay50_paid', 'payment50_paid'),
    inst_pay50_pending: pickVal('inst_pay50_pending', 'pay50_pending', 'payment50_pending'),
    inst_pay30_partially: pickVal('inst_pay30_partially', 'inst_pay30_partial', 'pay30_partial', 'payment30_partial'),
    inst_pay30_paid: pickVal('inst_pay30_paid', 'pay30_paid', 'payment30_paid'),
    inst_pay30_pending: pickVal('inst_pay30_pending', 'pay30_pending', 'payment30_pending'),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [data]);

  const districtwise: DistrictRow[] = useMemo(
    () => (Array.isArray((data as any)?.districtwise) ? (data as any).districtwise : []),
    [data]
  );
  const monthly: Array<{ month_year: string; monthly_installations: number }> = useMemo(
    () => (Array.isArray((data as any)?.vendor_installation_month) ? (data as any).vendor_installation_month : []),
    [data]
  );
  const today: Array<{ inst_vendor: number; name: string; today_install: number }> = useMemo(
    () => (Array.isArray((data as any)?.vendor_today_installation) ? (data as any).vendor_today_installation : []),
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
      if (selectedStatus === 'StructureDone') matchStatus = n(d.structure_complete) > 0;
      else if (selectedStatus === 'Complete') matchStatus = n(d.inst_complete) > 0;
      else if (selectedStatus === 'Pending') matchStatus = n(d.inst_pending) > 0;
      else if (selectedStatus === 'VerifyApproved') matchStatus = n(d.verify_approved) > 0;
      else if (selectedStatus === 'VerifyPending') matchStatus = n(d.verify_pending) > 0;
      else if (selectedStatus === 'VerifyRejected') matchStatus = n(d.verify_reject) > 0;
      else if (selectedStatus === 'DocComplete') matchStatus = n(d.inst_doc_complete) > 0;
      return matchDistrict && matchStatus;
    });
  }, [districtwise, selectedDistrict, selectedStatus]);

  const filtersActive = selectedDistrict !== 'All' || selectedStatus !== 'All';

  // Dynamic ULA statistics reflecting active filters
  const ula: UlaSummary = useMemo(() => {
    if (!filtersActive) return rawUla;
    const sum = (pick: (d: DistrictRow) => unknown) => filteredDistricts.reduce((a, d) => a + n(pick(d)), 0);
    return {
      ...rawUla,
      site_count: sum((d) => d.site_count),
      structure_complete: sum((d) => d.structure_complete),
      structure_pending: sum((d) => d.structure_pending),
      structure_verify_pending: sum((d) => d.structure_verify_pending),
      structure_verify_approved: sum((d) => d.structure_verify_approved),
      structure_verify_reject: sum((d) => d.structure_verify_reject),
      complete: sum((d) => d.inst_complete),
      pending: sum((d) => d.inst_pending),
      verify_pending: sum((d) => d.verify_pending),
      verify_approved: sum((d) => d.verify_approved),
      verify_reject: sum((d) => d.verify_reject),
      inst_doc_complete: sum((d) => d.inst_doc_complete),
      inst_doc_pending: sum((d) => d.inst_doc_pending),
      doc_verify_approve: sum((d) => d.doc_verify_approved),
      doc_verify_pending: sum((d) => d.doc_verify_pending),
      doc_verify_reject: sum((d) => d.doc_verify_reject),
    };
  }, [filtersActive, rawUla, filteredDistricts]);

  // Table search & pagination
  const deferredQuery = useDeferredValue(tableQuery);
  const tableDistricts = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return filteredDistricts.filter((d) => !q || (d.district || '').toLowerCase().includes(q));
  }, [filteredDistricts, deferredQuery]);

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
  }, [tableQuery, selectedDistrict, selectedStatus]);

  /* ───────── Derived values ───────── */
  const dash = (v: number) => (loading && !data ? '…' : num(v));
  const structPct = pctOf(ula.structure_complete, ula.site_count);
  const instPct = pctOf(ula.complete, ula.site_count);
  const pendingPct = pctOf(ula.pending, ula.site_count);
  const approvedPct = pctOf(ula.verify_approved, ula.site_count);
  const pctVerified = pctOf(ula.verify_approved, ula.complete || 1);
  const pctDocCleared = pctOf(ula.doc_verify_approve, ula.inst_doc_complete || 1);
  const todayTotal = today.reduce((a, t) => a + n(t.today_install), 0);
  const monthTotal = monthly.reduce((a, m) => a + n(m.monthly_installations), 0);
  const todayLabel = fmtDate(new Date());
  const val = (s: string) => (loading && !data ? '…' : s);

  const spk = (pick: (d: DistrictRow) => number) => {
    const arr = districtwise.slice(0, 10).map(pick);
    return arr.length > 1 ? arr : undefined;
  };

  // Districts for bar chart (selected district(s) or top 15 by installed)
  const chartDistricts = useMemo(() => {
    if (filtersActive) return filteredDistricts.slice(0, 15);
    return [...districtwise].sort((a, b) => n(b.inst_complete) - n(a.inst_complete)).slice(0, 15);
  }, [districtwise, filteredDistricts, filtersActive]);

  const milestones = [
    { label: '1. Allocated Sites', v: ula.site_count, of: ula.site_count || 1, color: LIGHT_BLUE, key: 'total' },
    { label: '2. Structure Erected', v: ula.structure_complete, of: ula.site_count || 1, color: LIGHT_CYAN, key: 'structure-complete' },
    { label: '3. Structure Approved', v: ula.structure_verify_approved, of: ula.structure_complete || ula.site_count || 1, color: LIGHT_VIOLET, key: 'structure-verify-approved' },
    { label: '4. Installation Complete', v: ula.complete, of: ula.site_count || 1, color: LIGHT_GREEN, key: 'complete' },
    { label: '5. Installation Approved', v: ula.verify_approved, of: ula.complete || ula.site_count || 1, color: LIGHT_GREEN, key: 'verify-approved' },
    { label: '6. Documents Uploaded', v: ula.inst_doc_complete, of: ula.complete || ula.site_count || 1, color: LIGHT_AMBER, key: 'doc-complete' },
  ];

  const donutItems = [
    { label: 'Approved', sub: `${approvedPct}% of total`, v: ula.verify_approved, color: LIGHT_GREEN, key: 'verify-approved' },
    { label: 'Verify Pending', sub: 'Awaiting verification', v: ula.verify_pending, color: LIGHT_BLUE, key: 'verify-pending' },
    { label: 'Rejected', sub: 'Correction needed', v: ula.verify_reject, color: LIGHT_RED, key: 'verify-reject' },
    { label: 'Install Pending', sub: 'In progress', v: ula.pending, color: LIGHT_AMBER, key: 'pending' },
  ];

  /* ───────── Export ───────── */
  const districtCols: ExportColumn<DistrictRow>[] = useMemo(() => [
    { header: 'District', accessor: (r) => r.district || '' },
    { header: 'Allocated Sites', accessor: (r) => n(r.site_count) },
    { header: 'Structure Done', accessor: (r) => n(r.structure_complete) },
    { header: 'Structure Pending', accessor: (r) => n(r.structure_pending) },
    { header: 'Installed Sites', accessor: (r) => n(r.inst_complete) },
    { header: 'Install Pending', accessor: (r) => n(r.inst_pending) },
    { header: 'Verify Approved', accessor: (r) => n(r.verify_approved) },
    { header: 'Verify Pending', accessor: (r) => n(r.verify_pending) },
    { header: 'Verify Rejected', accessor: (r) => n(r.verify_reject) },
    { header: 'Doc Submitted', accessor: (r) => n(r.inst_doc_complete) },
    { header: 'Doc Pending', accessor: (r) => n(r.inst_doc_pending) },
    { header: 'Completion %', accessor: (r) => `${pctOf(n(r.inst_complete), n(r.site_count))}%` },
  ], []);

  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = 'Bihar_ULA_District_Overview';
  const fileTitle = 'Bihar ULA District-Wise Installation Performance';

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
      alert('District overview data copied to clipboard!');
    } catch {
      const ta = document.createElement('textarea');
      ta.value = t;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      alert('District overview data copied to clipboard!');
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

  // Clickable numeric cell used in the district table
  const cell = (color: string | undefined, value: number, title: string, status: string, district?: string) => (
    <td
      className="ax-table__td ax-table__td--num ax-num"
      style={{ color, fontWeight: 600, cursor: 'pointer' }}
      title={title}
      onClick={(e) => { e.stopPropagation(); openStatusView(status, district); }}
    >
      {num(value)}
    </td>
  );

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      {/* 1. Page Header */}
      <PageHead
        title="Bihar ULA Installation Dashboard"
        subtitle={
          <span style={{ display: 'inline-block', fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>
            Underground Line Assembly (ULA) Operations, District Analysis & Execution Throughput
            {updatedAt ? ` · Last updated ${updatedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}` : ''}
          </span>
        }
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Bihar' },
          { label: 'Installation' },
          { label: 'ULA' },
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
            <Link to="/v/bihar/installation/ula/status-view?status=complete" className="ax-btn ax-btn--secondary ax-btn--sm">
              Status Register
            </Link>
            <Link to="/v/bihar/ula-installation-view-site" className="ax-btn ax-btn--primary ax-btn--sm">
              <span className="ax-btn__label">View Installations</span>
            </Link>
          </div>
        }
      />

      <div className="ax-dash-grid mt-0 pt-0">
        {apiError && (
          <div className="ax-col--12" style={{ padding: '10px 14px', background: 'color-mix(in oklab, var(--ax-viz-red, #ef4444) 12%, transparent)', color: 'var(--ax-viz-red, #dc2626)', borderRadius: 'var(--ax-radius-md, 8px)', fontSize: 'var(--ax-text-xs)' }}>
            <b>Error loading dashboard data:</b> {apiError}{' '}
            <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" onClick={() => loadDashboardData(true)}>Retry</button>
          </div>
        )}

        {/* 2. Operations Filter Bar */}
        <section
          className="ax-card ax-card--flat ax-col--12"
          role="region"
          aria-label="Bihar ULA Dashboard Filters"
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
                <label htmlFor="bula-district-select" style={labelStyle}>District:</label>
                <select
                  id="bula-district-select"
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
                <label htmlFor="bula-status-select" style={labelStyle}>Status:</label>
                <select
                  id="bula-status-select"
                  className="ax-input ax-input--sm"
                  style={{ height: 30, fontSize: 'var(--ax-text-xs)', paddingInline: '8px' }}
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="All">All Operations</option>
                  <option value="StructureDone">Structure Done</option>
                  <option value="Complete">Installed Sites</option>
                  <option value="Pending">Pending Installation</option>
                  <option value="VerifyApproved">Verify Approved</option>
                  <option value="VerifyPending">Verify Pending</option>
                  <option value="VerifyRejected">Verify Rejected</option>
                  <option value="DocComplete">Document Submitted</option>
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
                Showing <b style={{ color: 'var(--ax-text-strong)' }}>{dash(ula.site_count)}</b> Sites across <b style={{ color: 'var(--ax-text-strong)' }}>{filteredDistricts.length}</b> {filteredDistricts.length === 1 ? 'District' : 'Districts'} · Live: <b style={{ color: 'var(--ax-text-strong)' }}>{todayLabel}</b>
              </span>
            </div>
          </div>
        </section>

        {/* 3. Executive Welcome Banner */}
        <section className="ax-card ax-welcome ax-col--12" role="region" aria-label="Bihar ULA Installation Overview">
          <div className="ax-welcome__body">
            <div className="ax-welcome__text">
              <p className="ax-welcome__eyebrow">Bihar Underground Line Assembly System</p>
              <h2 className="ax-card__title">Welcome to Bihar ULA Operations Dashboard</h2>
              <p className="ax-welcome__lede">
                Bihar ULA execution overview: <b>{dash(ula.site_count)} sites</b> allocated across <b>{districtOptions.length} districts</b>.
                <b> {dash(ula.complete)} ({instPct}%)</b> installed, with <b>{dash(ula.verify_approved)}</b> verified approved, <b>{dash(ula.doc_verify_approve)}</b> documentation cleared, and <b>{dash(ula.inst_pay50_paid + ula.inst_pay30_paid)}</b> payment settlements.
              </p>
            </div>

            <dl className="ax-welcome__stats">
              <div className="ax-welcome__stat">
                <dt>Total Districts</dt>
                <dd className="ax-num">{num(districtOptions.length)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-emerald, #10b981)' }}>Bihar Operational Scope</small>
              </div>
              <div className="ax-welcome__stat">
                <dt>Allocated Sites</dt>
                <dd className="ax-num">{dash(ula.site_count)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--asw-primary)' }}>Total Installations</small>
              </div>
              <div className="ax-welcome__stat">
                <dt>Installed Sites</dt>
                <dd className="ax-num">{dash(ula.complete)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-emerald, #10b981)' }}>{instPct}% Complete</small>
              </div>
              <div className="ax-welcome__stat">
                <dt>Verify Approved</dt>
                <dd className="ax-num">{dash(ula.verify_approved)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-amber, #f59e0b)' }}>{num(ula.verify_pending)} In Audit</small>
              </div>
            </dl>
          </div>
        </section>

        {/* 4. Core KPI Cards */}
        <KpiCard
          icon={I_PIN}
          tone="accent"
          label="Total Allocated Sites"
          value={dash(ula.site_count)}
          unit="Sites"
          sub="Allocated ULA sites"
          spark={spk((d) => n(d.site_count))}
          onClick={() => openStatusView('total')}
        />
        <KpiCard
          icon={I_BOLT}
          tone="cyan"
          label="Structure Status"
          sub="Installed / Pending"
          badge={`${structPct}%`}
          spark={spk((d) => n(d.structure_complete))}
          onClick={() => openStatusView('structure-complete')}
          pills={[
            { label: 'Installed', count: num(ula.structure_complete), tone: 'success', onClick: () => openStatusView('structure-complete') },
            { label: 'Pending', count: num(ula.structure_pending), tone: 'warning', onClick: () => openStatusView('structure-pending') },
          ]}
        />
        <KpiCard
          icon={I_DONE}
          tone="violet"
          label="Structure Verification"
          sub="Approved / Pending / Rejected"
          spark={spk((d) => n(d.structure_verify_approved))}
          onClick={() => openStatusView('structure-verify-approved')}
          pills={[
            { label: 'Approved', count: num(ula.structure_verify_approved), tone: 'success', onClick: () => openStatusView('structure-verify-approved') },
            { label: 'Pending', count: num(ula.structure_verify_pending), tone: 'warning', onClick: () => openStatusView('structure-verify-pending') },
            { label: 'Reject', count: num(ula.structure_verify_reject), tone: 'danger', onClick: () => openStatusView('structure-verify-reject') },
          ]}
        />
        <KpiCard
          icon={I_DONE}
          tone="emerald"
          label="Installation Status"
          sub="Installed / Pending"
          badge={`${instPct}%`}
          spark={spk((d) => n(d.inst_complete))}
          onClick={() => openStatusView('complete')}
          pills={[
            { label: 'Installed', count: num(ula.complete), tone: 'success', onClick: () => openStatusView('complete') },
            { label: 'Pending', count: num(ula.pending), tone: 'warning', onClick: () => openStatusView('pending') },
          ]}
        />
        <KpiCard
          icon={I_SHIELD}
          tone="cyan"
          label="Installation Verification"
          sub="Approved / Pending / Rejected"
          badge={`${pctVerified}%`}
          spark={spk((d) => n(d.verify_approved))}
          onClick={() => openStatusView('verify-approved')}
          pills={[
            { label: 'Approved', count: num(ula.verify_approved), tone: 'success', onClick: () => openStatusView('verify-approved') },
            { label: 'Pending', count: num(ula.verify_pending), tone: 'warning', onClick: () => openStatusView('verify-pending') },
            { label: 'Reject', count: num(ula.verify_reject), tone: 'danger', onClick: () => openStatusView('verify-reject') },
          ]}
        />
        <KpiCard
          icon={I_DOC}
          tone="violet"
          label="Documents Status"
          sub="Submitted / Pending"
          badge={ula.inst_doc_complete > 0 ? `${pctOf(ula.inst_doc_complete, ula.site_count)}%` : undefined}
          spark={spk((d) => n(d.inst_doc_complete))}
          onClick={() => openStatusView('doc-complete')}
          pills={[
            { label: 'Submitted', count: num(ula.inst_doc_complete), tone: 'success', onClick: () => openStatusView('doc-complete') },
            { label: 'Pending', count: num(ula.inst_doc_pending), tone: 'warning', onClick: () => openStatusView('doc-pending') },
          ]}
        />
        <KpiCard
          icon={I_DOC}
          tone="violet"
          label="Document Approval"
          sub="Approved / Pending / Rejected"
          spark={spk((d) => n(d.doc_verify_approved))}
          onClick={() => openStatusView('doc-verify-approved')}
          pills={[
            { label: 'Approved', count: num(ula.doc_verify_approve), tone: 'success', onClick: () => openStatusView('doc-verify-approved') },
            { label: 'Pending', count: num(ula.doc_verify_pending), tone: 'warning', onClick: () => openStatusView('doc-verify-pending') },
            { label: 'Reject', count: num(ula.doc_verify_reject), tone: 'danger', onClick: () => openStatusView('doc-verify-reject') },
          ]}
        />
        <KpiCard
          icon={I_LIST}
          tone="amber"
          label="Claim 50% Status"
          sub="Applicable / Raised"
          badge={ula.claim50_raised > 0 ? `${num(ula.claim50_raised)} Raised` : undefined}
          onClick={() => openStatusView('claim50-raised')}
          pills={[
            { label: 'Applicable', count: num(ula.claim50_applicable), tone: 'info', onClick: () => openStatusView('claim50-applicable') },
            { label: 'Raised', count: num(ula.claim50_raised), tone: 'accent', onClick: () => openStatusView('claim50-raised') },
          ]}
        />
        <KpiCard
          icon={I_DONE}
          tone="emerald"
          label="Claim 50% Approval"
          sub="Approved / Pending / Rejected"
          onClick={() => openStatusView('claim50-verify-papprove')}
          pills={[
            { label: 'Approved', count: num(ula.inst_claim50_verify_papprove), tone: 'success', onClick: () => openStatusView('claim50-verify-papprove') },
            { label: 'Pending', count: num(ula.inst_claim50_verify_pending), tone: 'warning', onClick: () => openStatusView('claim50-verify-pending') },
            { label: 'Reject', count: num(ula.inst_claim50_verify_reject), tone: 'danger', onClick: () => openStatusView('claim50-verify-reject') },
          ]}
        />
        <KpiCard
          icon={I_LIST}
          tone="amber"
          label="Claim 30% Status"
          sub="Applicable / Raised"
          badge={ula.claim30_raised > 0 ? `${num(ula.claim30_raised)} Raised` : undefined}
          onClick={() => openStatusView('claim-raised')}
          pills={[
            { label: 'Applicable', count: num(ula.claim30_applicable), tone: 'info', onClick: () => openStatusView('claim-applicable') },
            { label: 'Raised', count: num(ula.claim30_raised), tone: 'accent', onClick: () => openStatusView('claim-raised') },
          ]}
        />
        <KpiCard
          icon={I_DONE}
          tone="emerald"
          label="Claim 30% Approval"
          sub="Approved / Pending / Rejected"
          onClick={() => openStatusView('claim-verify-papprove')}
          pills={[
            { label: 'Approved', count: num(ula.inst_claim30_verify_papprove), tone: 'success', onClick: () => openStatusView('claim-verify-papprove') },
            { label: 'Pending', count: num(ula.inst_claim30_verify_pending), tone: 'warning', onClick: () => openStatusView('claim-verify-pending') },
            { label: 'Reject', count: num(ula.inst_claim30_verify_reject), tone: 'danger', onClick: () => openStatusView('claim-verify-reject') },
          ]}
        />
        <KpiCard
          icon={I_COIN}
          tone="cyan"
          label="Payment 50% Status"
          sub="Partially Paid / Paid / Pending"
          badge={ula.inst_pay50_paid > 0 ? 'Disbursed' : undefined}
          onClick={() => openStatusView('inst-pay50-paid')}
          pills={[
            { label: 'Partial', count: num(ula.inst_pay50_partially), tone: 'warning', onClick: () => openStatusView('inst-pay50-partially') },
            { label: 'Paid', count: num(ula.inst_pay50_paid), tone: 'success', onClick: () => openStatusView('inst-pay50-paid') },
            { label: 'Pending', count: num(ula.inst_pay50_pending), tone: 'danger', onClick: () => openStatusView('inst-pay50-pending') },
          ]}
        />
        <KpiCard
          icon={I_COIN}
          tone="amber"
          label="Payment 30% Status"
          sub="Partially Paid / Paid / Pending"
          badge={ula.inst_pay30_paid > 0 ? 'Disbursed' : undefined}
          onClick={() => openStatusView('inst-pay-paid')}
          pills={[
            { label: 'Partial', count: num(ula.inst_pay30_partially), tone: 'warning', onClick: () => openStatusView('inst-pay-partially') },
            { label: 'Paid', count: num(ula.inst_pay30_paid), tone: 'success', onClick: () => openStatusView('inst-pay-paid') },
            { label: 'Pending', count: num(ula.inst_pay30_pending), tone: 'danger', onClick: () => openStatusView('inst-pay-pending') },
          ]}
        />

        {/* 5. Operational Highlights */}
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
              Bihar ULA Vendor Portal
            </span>
          </div>
        </div>

        <KpiCard
          icon={I_BOLT}
          tone="emerald"
          label="Execution Rate"
          value={`${instPct}%`}
          sub={`${num(ula.complete)} of ${num(ula.site_count)} sites installed`}
          badge="Installed"
          onClick={() => openStatusView('complete')}
        />
        <KpiCard
          icon={I_SHIELD}
          tone="cyan"
          label="Audit Pass Rate"
          value={`${pctOf(ula.verify_approved, (ula.verify_approved + ula.verify_reject) || 1)}%`}
          sub={`${num(ula.verify_approved)} Passed · ${num(ula.verify_reject)} Rejected`}
          onClick={() => openStatusView('verify-approved')}
        />
        <KpiCard
          icon={I_DOC}
          tone="violet"
          label="Document Cleared"
          value={`${pctDocCleared}%`}
          sub={`${num(ula.doc_verify_approve)} compliance docs accepted`}
          onClick={() => openStatusView('doc-verify-approved')}
        />
        <KpiCard
          icon={I_CREDIT}
          tone="accent"
          label="Claim Settlement"
          value={`${pctOf(ula.inst_pay50_paid, ula.claim50_raised || 1)}%`}
          sub={`${num(ula.inst_pay50_paid)} of ${num(ula.claim50_raised)} 50% claims paid`}
          onClick={() => openStatusView('inst-pay50-paid')}
        />

        {/* State Operations Executive Card */}
        <section className="ax-card ax-col--12" role="region" aria-label="Bihar ULA Operations Overview">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow" style={{ color: 'var(--asw-primary)' }}>State Operations</span>
              <h3 className="ax-card__title">Bihar · Underground Line Assembly (ULA) Operations</h3>
              <p className="ax-card__subtitle">{num(ula.complete)} sites installed across {districtOptions.length} districts in Bihar</p>
            </div>
            <Link to="/v/bihar/ula-installation-view-site" className="ax-btn ax-btn--sm ax-btn--primary">
              View Installation Register →
            </Link>
          </div>
          <div className="ax-card__body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-3)' }}>
            <div className="ax-grid ax-grid--2" style={{ gap: 'var(--ax-space-2)' }}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => openStatusView('complete')}
                onKeyDown={onActivate(() => openStatusView('complete'))}
                style={{ padding: '10px 12px', background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 'var(--ax-radius-md, 8px)', cursor: 'pointer' }}
                className="asw-interactive-kpi"
                title="View completed installed sites in status register"
              >
                <small style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-xs)' }}>Installed &amp; Operational</small>
                <div style={{ fontSize: 'var(--ax-text-lg)', fontWeight: 700, color: 'var(--ax-viz-emerald, #10b981)' }}>
                  {dash(ula.complete)} <span style={{ fontSize: 'var(--ax-text-xs)', fontWeight: 500 }}>({instPct}%)</span>
                </div>
              </div>
              <div
                role="button"
                tabIndex={0}
                onClick={() => openStatusView('pending')}
                onKeyDown={onActivate(() => openStatusView('pending'))}
                style={{ padding: '10px 12px', background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 'var(--ax-radius-md, 8px)', cursor: 'pointer' }}
                className="asw-interactive-kpi"
                title="View pending installation sites in status register"
              >
                <small style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-xs)' }}>Pending Execution</small>
                <div style={{ fontSize: 'var(--ax-text-lg)', fontWeight: 700, color: 'var(--ax-viz-amber, #f59e0b)' }}>
                  {dash(ula.pending)} <span style={{ fontSize: 'var(--ax-text-xs)', fontWeight: 500 }}>({pendingPct}%)</span>
                </div>
              </div>
            </div>

            <div>
              <div className="ax-cluster" style={{ justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>Overall Installation Execution Efficiency</span>
                <b className="ax-num" style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-emerald, #10b981)' }}>{instPct}%</b>
              </div>
              <div className="ax-progress ax-progress--sm">
                <div className="ax-progress__track">
                  <div className="ax-progress__fill" style={{ width: `${instPct}%`, background: 'var(--ax-viz-emerald, #10b981)' }} />
                </div>
              </div>
            </div>

            <div style={{ paddingTop: 'var(--ax-space-2)', borderTop: '1px solid var(--ax-border-subtle, #f1f5f9)', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
              <b>Verification & Compliance:</b> {num(ula.verify_approved)} sites approved by auditor ({pctVerified}%) · {num(ula.doc_verify_approve)} documents approved · {num(ula.inst_pay50_paid)} 50% and {num(ula.inst_pay30_paid)} 30% payments confirmed.
            </div>
          </div>
        </section>

        {/* 6. District Wise Installations (8) + Status Donut (4) */}
        <section className="ax-card ax-card--chart ax-col--8" role="region" aria-label="District wise installations">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Geographic Breakdown</span>
              <h2 className="ax-card__title">District Wise Installations</h2>
              <p className="ax-card__subtitle">{num(ula.complete)} installed of {num(ula.site_count)} allocated across {districtOptions.length} districts</p>
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
                          if (dist) openStatusView('complete', dist);
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
              <p className="ax-card__subtitle">Total {dash(ula.site_count)} ULA Sites</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
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
                          name: { fontFamily: 'var(--ax-font-sans)' },
                          value: { fontFamily: 'var(--ax-font-mono)', fontWeight: 600 },
                          total: { show: true, label: 'Sites', formatter: () => num(ula.site_count) },
                        },
                      },
                    },
                  },
                }}
              />
            </Suspense>
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
                    {num(s.v)} ({pctOf(s.v, ula.site_count)}%)
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
              <p className="ax-card__subtitle">{num(monthTotal)} installations across {monthly.length} month{monthly.length === 1 ? '' : 's'} · {num(todayTotal)} today</p>
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
                    fill: {
                      type: 'gradient',
                      gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.05, stops: [0, 90, 100] },
                    },
                    markers: { size: 4, strokeWidth: 0, hover: { size: 6 } },
                    dataLabels: { enabled: false },
                    xaxis: { categories: monthly.map((m) => fmtMonth(m.month_year)) },
                    yaxis: { min: 0, forceNiceScale: true, labels: { formatter: (v: number) => `${Math.round(v)}` }, title: { text: 'Installed (Nos.)', style: { color: 'var(--ax-text-muted)' } } },
                  }}
                />
              </Suspense>
            )}
          </div>
        </section>

        <section className="ax-card ax-col--4" role="region" aria-label="ULA Workflow Milestones">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Workflow Lifecycle</span>
              <h2 className="ax-card__title">ULA Milestones</h2>
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
                  style={{ cursor: 'pointer', padding: '6px 8px', borderRadius: 'var(--ax-radius-sm, 6px)', transition: 'background 120ms ease' }}
                  className="asw-interactive-kpi"
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
              <h2 className="ax-card__title">District Wise ULA Summary</h2>
              <p className="ax-card__subtitle">Allocated, structure, installed, verification & document metrics per district</p>
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
                  <th className="ax-table__th ax-table__th--num" scope="col">Structure Done</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Installed</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Pending</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Verify Approved</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Doc Submitted</th>
                </tr>
              </thead>
              <tbody>
                {pagedDistricts.map((d) => (
                  <tr
                    key={d.district}
                    className="ax-table__row"
                    role="button"
                    tabIndex={0}
                    onClick={() => openStatusView('complete', d.district)}
                    onKeyDown={onActivate(() => openStatusView('complete', d.district))}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="ax-table__td" style={{ fontWeight: 'var(--ax-weight-semibold)', color: 'var(--ax-text-strong)' }}>
                      <b>{d.district}</b>
                    </td>
                    {cell(undefined, n(d.site_count), `View all allocated sites in ${d.district}`, 'total', d.district)}
                    {cell(LIGHT_CYAN, n(d.structure_complete), `View structure complete sites in ${d.district}`, 'structure-complete', d.district)}
                    {cell('var(--ax-viz-emerald, #10b981)', n(d.inst_complete), `View installed sites in ${d.district}`, 'complete', d.district)}
                    {cell('var(--ax-viz-amber, #f59e0b)', n(d.inst_pending), `View pending sites in ${d.district}`, 'pending', d.district)}
                    {cell('var(--ax-viz-cyan, #0891b2)', n(d.verify_approved), `View verify approved sites in ${d.district}`, 'verify-approved', d.district)}
                    {cell('var(--ax-viz-violet, #7c3aed)', n(d.inst_doc_complete), `View document submitted sites in ${d.district}`, 'doc-complete', d.district)}
                  </tr>
                ))}
                {!loading && pagedDistricts.length === 0 && (
                  <tr>
                    <td className="ax-table__td" colSpan={7} style={{ textAlign: 'center', color: 'var(--ax-text-muted)', padding: 24 }}>
                      {apiError ? 'Could not load districts from server.' : 'No districts match the filter criteria.'}
                    </td>
                  </tr>
                )}
                {pagedDistricts.length > 0 && (
                  <tr className="ax-table__row" style={{ background: 'var(--ax-surface-subtle, #f8fafc)', fontWeight: 'var(--ax-weight-bold)' }}>
                    <td className="ax-table__td" style={{ color: 'var(--ax-text-strong)' }}>Total ({filteredDistricts.length} Districts)</td>
                    {cell(undefined, ula.site_count, 'View all allocated sites', 'total')}
                    {cell(LIGHT_CYAN, ula.structure_complete, 'View structure complete sites', 'structure-complete')}
                    {cell('var(--ax-viz-emerald, #10b981)', ula.complete, 'View installed sites', 'complete')}
                    {cell('var(--ax-viz-amber, #f59e0b)', ula.pending, 'View pending sites', 'pending')}
                    {cell('var(--ax-viz-cyan, #0891b2)', ula.verify_approved, 'View verify approved sites', 'verify-approved')}
                    {cell('var(--ax-viz-violet, #7c3aed)', ula.inst_doc_complete, 'View document submitted sites', 'doc-complete')}
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
                setPage={setPage}
                onPageSizeChange={setPageSize}
                pageSizeOptions={[25, 50, 100, 200]}
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
                <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill">{dash(ula.complete)} Installed</span>
              </div>
              <div className="ax-statgroup ax-statgroup--stack" style={{ gap: 'var(--ax-space-2)' }}>
                {chartDistricts.slice(0, 8).map((d) => (
                  <button
                    key={d.district}
                    type="button"
                    className="ax-cluster"
                    onClick={() => openStatusView('complete', d.district)}
                    style={{ width: '100%', justifyContent: 'space-between', fontSize: 'var(--ax-text-xs)', border: 0, background: 'transparent', padding: '6px 0', cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid var(--ax-border-subtle, #f1f5f9)' }}
                  >
                    <span style={{ color: 'var(--ax-text-muted)', fontWeight: 500 }}>{d.district}</span>
                    <b className="ax-num" style={{ color: 'var(--ax-viz-emerald, #10b981)' }}>
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
              <Link to="/v/bihar/installation/ula/status-view?status=complete" className="ax-btn ax-btn--secondary ax-btn--sm" style={{ justifyContent: 'space-between' }}>
                <span>Status Register</span>
                <span>→</span>
              </Link>
              <Link to="/v/bihar/installation/ula/status-view?status=pending" className="ax-btn ax-btn--secondary ax-btn--sm" style={{ justifyContent: 'space-between' }}>
                <span>Pending Installations</span>
                <span>→</span>
              </Link>
              <Link to="/v/bihar/ula-installation-view-site" className="ax-btn ax-btn--primary ax-btn--sm" style={{ justifyContent: 'space-between' }}>
                <span>View Installations</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </section>

        {/* 10. Today's Installation Activity */}
        <section className="ax-card ax-col--12" role="region" aria-label="Today's installations">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Site Operations · Live {todayLabel}</span>
              <h2 className="ax-card__title">Today&apos;s Installation Activity</h2>
              <p className="ax-card__subtitle">{num(todayTotal)} installations completed today across {today.length} execution partner{today.length === 1 ? '' : 's'}</p>
            </div>
            <div className="ax-card__actions">
              <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill">{today.length} Active Today</span>
            </div>
          </div>
          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover ula-table--sm" style={{ minWidth: 540 }}>
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">Sr.</th>
                  <th className="ax-table__th" scope="col">Installation Partner</th>
                  <th className="ax-table__th" scope="col">Role</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Today Installed</th>
                </tr>
              </thead>
              <tbody>
                {today.length === 0 ? (
                  <tr>
                    <td className="ax-table__td" colSpan={4} style={{ textAlign: 'center', color: 'var(--ax-text-muted)', padding: 24 }}>
                      {loading ? 'Loading…' : 'No installations reported today yet.'}
                    </td>
                  </tr>
                ) : (
                  today.map((t, idx) => {
                    const name = t.name || `Vendor #${t.inst_vendor}`;
                    const c = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                    return (
                      <tr key={idx} className="ax-table__row">
                        <td className="ax-table__td" style={{ color: 'var(--ax-text-muted)' }}>{idx + 1}</td>
                        <td className="ax-table__td" style={{ fontWeight: 'var(--ax-weight-semibold)', color: 'var(--ax-text-strong)' }}>
                          <span className="ax-cluster" style={{ gap: 8, flexWrap: 'nowrap' }}>
                            <span className="ax-avatar ax-avatar--sm" style={{ background: `color-mix(in oklab, ${c} 22%, transparent)`, color: c, fontWeight: 600 }}>{initials(name)}</span>
                            {name}
                          </span>
                        </td>
                        <td className="ax-table__td"><span className="ax-badge ax-badge--soft ax-badge--info ax-badge--pill">Installation Partner</span></td>
                        <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-emerald, #10b981)', fontWeight: 700 }}>
                          +{num(n(t.today_install))} Sites
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Bihar_Installation_ULA_Dashboard;