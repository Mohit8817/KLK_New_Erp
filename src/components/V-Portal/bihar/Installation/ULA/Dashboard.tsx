import { lazy, Suspense, useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  biharUlaInstallationService,
  type UlaInstallationDashboardData,
} from '../../bihar-services';
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

/* ───────── Colors ───────── */
const LIGHT_BLUE = '#4992ff';
const LIGHT_GREEN = '#86DDB2';
const LIGHT_AMBER = '#F6D68A';

/* ───────── Summary & District Types ───────── */
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
const num = (x: number) => (x ?? 0).toLocaleString('en-IN');
const pctOf = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : 0);
const n = (v: unknown) => Number(v ?? 0) || 0;
const pad = (x: number) => String(x).padStart(2, '0');
const fmtDate = (d: Date | null) => (d ? `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}` : '—');
const fmtTime = (d: Date) => d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();
const cv = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const initials = (s: string) => s.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';

const fmtMonth = (s: string) => {
  const [y, m] = String(s || '').split('-');
  const mi = Number(m);
  if (!y || !mi) return s || '';
  return `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][mi - 1]} ${y}`;
};

const onActivate = (fn: () => void) => (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    fn();
  }
};

const useIsMobile = (breakpoint = 640) => {
  const get = () => typeof window !== 'undefined' && window.innerWidth < breakpoint;
  const [m, setM] = useState(get);
  useEffect(() => {
    const onResize = () => setM(get());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [breakpoint]);
  return m;
};

/* ───────── DLE Layout CSS ───────── */
const PAGE_CSS = `
  .solar-erp-page .ax-page-head { margin-block-end: 10px; }
  .solar-erp-page .ax-page-head .ax-breadcrumb { margin-block-end: 4px; }
  .solar-erp-page .ax-dash-grid { margin-top: 0; }
  .solar-erp-page .ax-card { min-width: 0; }
  .solar-erp-page .ax-card__footer { width: 100%; box-sizing: border-box; }
  .solar-erp-page .ula-pagination-left {
    width: 100%; display: flex; justify-content: flex-start; align-items: center; margin: 0; overflow-x: auto;
  }
  .solar-erp-page .ula-pagination-left > * { margin-left: 0 !important; margin-right: 0 !important; }

  /* ───── Card header: title fixed, actions squeeze ───── */
  .solar-erp-page .ax-card__header {
    display: flex;
    flex-wrap: nowrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  .solar-erp-page .ax-card__titles {
    flex: 0 0 auto;
    min-width: max-content;
    max-width: 55%;
  }
  .solar-erp-page .ax-card__title {
    max-width: none;
    white-space: normal;
    word-break: normal;
    overflow-wrap: normal;
    hyphens: none;
  }
  .solar-erp-page .ax-card__eyebrow,
  .solar-erp-page .ax-card__subtitle {
    word-break: normal;
    overflow-wrap: normal;
    line-height: 1.45;
  }

  .solar-erp-page .ax-card__actions {
    flex: 1 1 0;
    min-width: 0;
    margin-left: auto;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
  }
  .solar-erp-page .ax-card__actions .ax-cluster {
    flex-wrap: wrap !important;
    min-width: 0;
    width: 100%;
    justify-content: flex-end;
  }

  .solar-erp-page .ax-card__actions .ax-search,
  .solar-erp-page .ax-card__actions [class*="search"] {
    flex: 1 1 120px;
    min-width: 90px;
    max-width: 260px;
  }
  .solar-erp-page .ax-card__actions input { min-width: 0; width: 100%; }

  .solar-erp-page .ax-card__actions .ax-export-toolbar,
  .solar-erp-page .ax-card__actions [class*="export"] {
    flex: 0 1 auto;
    min-width: 0;
    flex-wrap: nowrap;
    gap: 4px;
  }
  .solar-erp-page .ax-card__actions .ax-export-toolbar .ax-btn,
  .solar-erp-page .ax-card__actions [class*="export"] .ax-btn {
    padding-inline: 8px;
    min-width: 0;
  }

  .solar-erp-page .ax-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .solar-erp-page .ula-table--sm { min-width: 540px; }
  .solar-erp-page .ula-table--md { min-width: 720px; }
  .solar-erp-page .ax-welcome__lede { max-width: 780px; }

  /* Filter bar */
  .solar-erp-page .ula-filter-item { display: flex; align-items: center; gap: 6px; }
  .solar-erp-page .ula-filter-item select { width: 170px; }

  @media (min-width: 641px) {
    .solar-erp-page .ax-card__actions .ax-export-toolbar { width: auto; }
  }

  @media (max-width: 1100px) {
    .solar-erp-page .ax-col--8,
    .solar-erp-page .ax-col--4 { grid-column: span 12; }
    .solar-erp-page .ax-col--3 { grid-column: span 6; }

    .solar-erp-page .ax-card__actions .ax-export-toolbar .ax-btn span:not([class*="icon"]),
    .solar-erp-page .ax-card__actions [class*="export"] .ax-btn span:not([class*="icon"]) {
      display: none;
    }
    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] {
      max-width: 180px;
    }
  }

  @media (max-width: 760px) {
    .solar-erp-page { width: 100%; max-width: 100%; overflow-x: hidden; box-sizing: border-box; }
    .solar-erp-page .ax-welcome__stats {
      display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px;
    }
    .solar-erp-page .ula-filter-item { width: 100%; justify-content: space-between; }
    .solar-erp-page .ula-filter-item select { flex: 1; width: auto; max-width: 100%; }
    .solar-erp-page .ula-filter-scope { width: 100%; }
    .solar-erp-page .ax-card__header { gap: 10px; }

    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] {
      max-width: 130px;
    }

    .solar-erp-page .ula-sticky-first th:first-child,
    .solar-erp-page .ula-sticky-first td:first-child {
      position: sticky; left: 0; z-index: 1;
      background: var(--ax-bg-surface);
      box-shadow: 1px 0 0 var(--ax-border-subtle, #e2e8f0);
    }
  }

  @media (max-width: 480px) {
    .solar-erp-page .ax-card__header { flex-wrap: wrap; }
    .solar-erp-page .ax-card__titles { min-width: 0; max-width: 100%; flex: 1 1 100%; }
    .solar-erp-page .ax-card__actions { flex: 1 1 100%; }
    .solar-erp-page .ax-card__actions .ax-cluster { justify-content: flex-start; }
    .solar-erp-page .ax-card__title {
      font-family: var(--ax-font-display);
      font-size: var(--ax-text-md);
      line-height: var(--ax-leading-md);
    }
    .solar-erp-page .ax-col--3 { grid-column: span 12; }
  }
`;

/* ───────── Icons (Tabler design) ───────── */
const ICON_REFRESH = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" /><path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" /></svg>
);
const ICON_PLUS = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5l0 14" /><path d="M5 12l14 0" /></svg>
);
const ICON_FILTER = (
  <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 4h16v2.172a2 2 0 0 1 -.586 1.414l-4.828 4.828v7.586l-4 -2v-5.586l-4.828 -4.828a2 2 0 0 1 -.586 -1.414v-2.172z" /></svg>
);
const ARROW_UP = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 15l6 -6l6 6" /></svg>
);
const ICON_EYE = (
  <svg style={{ width: 13, height: 13 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="2" />
    <path d="M22 12c-2.667 4.667 -6 7 -10 7s-7.333 -2.333 -10 -7c2.667 -4.667 6 -7 10 -7s7.333 2.333 10 7" />
  </svg>
);

const svg = (children: React.ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const I_PIN = svg(<><path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /><path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0" /></>);
const I_BOLT = svg(<path d="M13 3l0 7l6 0l-8 11l0 -7l-6 0l8 -11" />);
const I_DONE = svg(<><path d="M7 12l5 5l10 -10" /><path d="M2 12l5 5m5 -5l5 -5" /></>);
const I_DOC = svg(<><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2" /><path d="M9 13l2 2l4 -4" /></>);
const I_COIN = svg(<><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M14.8 9a2 2 0 0 0 -1.8 -1h-2a2 2 0 1 0 0 4h2a2 2 0 1 1 0 4h-2a2 2 0 0 1 -1.8 -1" /><path d="M12 7v10" /></>);
const I_LIST = svg(<><path d="M9 6l11 0" /><path d="M9 12l11 0" /><path d="M9 18l11 0" /><path d="M5 6l0 .01" /><path d="M5 12l0 .01" /><path d="M5 18l0 .01" /></>);

/* ───────── DLE Exact KPI Card ───────── */
interface KpiProps {
  icon: React.ReactNode;
  tone: 'accent' | 'cyan' | 'emerald' | 'amber' | 'violet' | 'pink' | 'red';
  label: string;
  value: string;
  unit?: string;
  sub: string;
  badge?: string;
  spark?: number[];
  sparkType?: 'line' | 'bar' | 'area';
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

function KpiCard({ icon, tone, label, value, unit, sub, badge, spark, sparkType = 'line',  }: KpiProps) {
  const t = TONE[tone];
  const hasSpark = Array.isArray(spark) && spark.length > 1;
  const allZeros = hasSpark && spark!.every((v) => v === 0);
  const safeSpark = allZeros ? [0, 1, 0, 1, 0, 0, 1] : spark;

  return (
    <div
      className="ax-card ax-col--3"
 
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
              {ARROW_UP} {badge}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--ax-font-display)', fontSize: '1.35rem', fontWeight: 700, lineHeight: 1.1, color: 'var(--ax-text-strong)', fontVariantNumeric: 'tabular-nums' }}>
              {value} {unit && <small style={{ fontSize: '11px', fontWeight: 500, color: 'var(--ax-text-muted)' }}>{unit}</small>}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--ax-text-muted)', marginTop: '2px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</div>
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

const AVATAR_COLORS = ['var(--ax-accent)', 'var(--ax-viz-cyan)', 'var(--ax-viz-violet)', 'var(--ax-viz-amber)', 'var(--ax-viz-pink)'];
const labelStyle = { fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)', fontWeight: 500 } as const;
const selectStyle = { height: 30, fontSize: 'var(--ax-text-xs)', paddingInline: '8px' } as const;
const actionsRowStyle = { gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'end', justifyContent: 'flex-end', width: '100%' } as const;
const footerStyle = {
  borderTop: '1px solid var(--ax-border, #e2e8f0)',
  padding: 'var(--ax-space-3) var(--ax-space-4)',
  display: 'flex',
  justifyContent: 'flex-start',
  alignItems: 'center',
  width: '100%',
  boxSizing: 'border-box',
} as const;
const emptyCellStyle = { textAlign: 'center', padding: 24, color: 'var(--ax-text-muted)' } as const;
const sectionHeadStyle = { margin: 'var(--ax-space-3) 0 var(--ax-space-1) 0', fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' } as const;

export function Bihar_Installation_ULA_Dashboard() {
  const navigate = useNavigate();
  const isMobile = useIsMobile(640);
  const [data, setData] = useState<UlaInstallationDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [qDistrict, setQDistrict] = useState<string>('');

  // Status drill-down modal
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusModalTitle, setStatusModalTitle] = useState('');
  const [statusModalSites, setStatusModalSites] = useState<any[]>([]);
  const [statusModalLoading, setStatusModalLoading] = useState(false);

  const chartH = isMobile ? 260 : 320;
  const donutH = isMobile ? 210 : 230;

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
      console.warn('Dashboard fetch error:', err);
      setApiError(err?.message || 'Failed to load Bihar ULA installation dashboard.');
    } finally {
      setLoading(false);
      if (isRefresh) setTimeout(() => setIsRefreshing(false), 400);
    }
  }, []);

  useEffect(() => { loadDashboardData(); }, [loadDashboardData]);

  /* ───────── Raw API resolution ───────── */
  const rawApiUla: any = (data as any)?.ula || {};
  const pickVal = (...keys: string[]) => {
    for (const k of keys) {
      if (rawApiUla[k] !== undefined && rawApiUla[k] !== null) return n(rawApiUla[k]);
    }
    return 0;
  };

  const rawUla: UlaSummary = useMemo(() => {
    return {
      site_count: pickVal('site_count', 'total_sites', 'total') || 1,
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
    };
  }, [data]);

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

  const filtersActive = selectedDistrict !== 'All';

  const ula: UlaSummary = useMemo(() => {
    if (!filtersActive) return rawUla;
    const d = districtwise.find((x) => x.district?.toLowerCase() === selectedDistrict.toLowerCase());
    if (!d) return rawUla;
    return {
      ...rawUla,
      site_count: n(d.site_count),
      structure_complete: n(d.structure_complete),
      structure_pending: n(d.structure_pending),
      structure_verify_pending: n(d.structure_verify_pending),
      structure_verify_approved: n(d.structure_verify_approved),
      structure_verify_reject: n(d.structure_verify_reject),
      complete: n(d.inst_complete),
      pending: n(d.inst_pending),
      verify_pending: n(d.verify_pending),
      verify_approved: n(d.verify_approved),
      verify_reject: n(d.verify_reject),
      inst_doc_complete: n(d.inst_doc_complete),
      inst_doc_pending: n(d.inst_doc_pending),
      doc_verify_approve: n(d.doc_verify_approved),
      doc_verify_pending: n(d.doc_verify_pending),
      doc_verify_reject: n(d.doc_verify_reject),
    };
  }, [rawUla, districtwise, selectedDistrict, filtersActive]);

  const filteredDistrictRows = useMemo(
    () => (filtersActive ? districtwise.filter((d) => d.district?.toLowerCase() === selectedDistrict.toLowerCase()) : districtwise),
    [districtwise, selectedDistrict, filtersActive]
  );

  const districtTotals = useMemo(() => {
    return filteredDistrictRows.reduce(
      (acc, d) => ({
        site_count: acc.site_count + n(d.site_count),
        structure_complete: acc.structure_complete + n(d.structure_complete),
        structure_pending: acc.structure_pending + n(d.structure_pending),
        inst_complete: acc.inst_complete + n(d.inst_complete),
        inst_pending: acc.inst_pending + n(d.inst_pending),
        verify_approved: acc.verify_approved + n(d.verify_approved),
        verify_pending: acc.verify_pending + n(d.verify_pending),
        verify_reject: acc.verify_reject + n(d.verify_reject),
        inst_doc_complete: acc.inst_doc_complete + n(d.inst_doc_complete),
        inst_doc_pending: acc.inst_doc_pending + n(d.inst_doc_pending),
      }),
      {
        site_count: 0,
        structure_complete: 0,
        structure_pending: 0,
        inst_complete: 0,
        inst_pending: 0,
        verify_approved: 0,
        verify_pending: 0,
        verify_reject: 0,
        inst_doc_complete: 0,
        inst_doc_pending: 0,
      }
    );
  }, [filteredDistrictRows]);

  const deferredQuery = useDeferredValue(qDistrict);
  const tableDistricts = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return filteredDistrictRows.filter((d) => !q || (d.district || '').toLowerCase().includes(q));
  }, [filteredDistrictRows, deferredQuery]);

  const pD = usePagination({ data: tableDistricts, initialPageSize: 15 });

  useEffect(() => {
    pD.setPage(1);
  }, [qDistrict, selectedDistrict]);

  /* ───────── Derived Values ───────── */
  const dash = (v: number) => (loading && !data ? '…' : num(v));
  const structPct = pctOf(ula.structure_complete, ula.site_count);
  const instPct = pctOf(ula.complete, ula.site_count);
  const approvedPct = pctOf(ula.verify_approved, ula.site_count);
  const todayTotal = today.reduce((a, t) => a + n(t.today_install), 0);
  const monthTotal = monthly.reduce((a, m) => a + n(m.monthly_installations), 0);
  const todayLabel = fmtDate(new Date());

  const spk = (pickFn: (d: DistrictRow) => number) => {
    const arr = districtwise.slice(0, 10).map(pickFn);
    return arr.length > 1 ? arr : undefined;
  };

  const chartDistricts = useMemo(
    () => [...filteredDistrictRows].sort((a, b) => n(b.site_count) - n(a.site_count)).slice(0, 15),
    [filteredDistrictRows]
  );
  const districtChartH = Math.min(560, Math.max(isMobile ? 280 : 320, chartDistricts.length * (isMobile ? 38 : 44)));

  /* ───────── Drill-down Modal ───────── */
  const handleOpenStatusDrill = async (statusKey: string, title: string, districtParam?: string) => {
    const targetDistrict = districtParam || (filtersActive ? selectedDistrict : undefined);
    setStatusModalTitle(title);
    setStatusModalOpen(true);
    setStatusModalLoading(true);
    try {
      let sites = [];
      if (targetDistrict && targetDistrict !== 'All') {
        sites = await biharUlaInstallationService.getDashboardSitesByDistrict(statusKey, targetDistrict);
      } else {
        sites = await biharUlaInstallationService.getDashboardSitesByStatus(statusKey);
      }
      setStatusModalSites(sites || []);
    } catch {
      setStatusModalSites([]);
    } finally {
      setStatusModalLoading(false);
    }
  };

  const drill = (key: string, title: string) => () => handleOpenStatusDrill(key, title);

  /* ───────── Export Columns & Helpers ───────── */
  const [hiddenDistrictColumns, setHiddenDistrictColumns] = useState<string[]>([]);

  const districtCols: ExportColumn<DistrictRow>[] = useMemo(
    () => [
      { header: 'District', accessor: (r) => r.district || '' },
      { header: 'Total Sites', accessor: (r) => n(r.site_count) },
      { header: 'Structure Done', accessor: (r) => n(r.structure_complete) },
      { header: 'Structure Pending', accessor: (r) => n(r.structure_pending) },
      { header: 'Install Done', accessor: (r) => n(r.inst_complete) },
      { header: 'Install Pending', accessor: (r) => n(r.inst_pending) },
      { header: 'Approved', accessor: (r) => n(r.verify_approved) },
      { header: 'Verify Pending', accessor: (r) => n(r.verify_pending) },
      { header: 'Verify Rejected', accessor: (r) => n(r.verify_reject) },
      { header: 'Doc Complete', accessor: (r) => n(r.inst_doc_complete) },
      { header: 'Doc Pending', accessor: (r) => n(r.inst_doc_pending) },
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
      columns.map((column) => column.header),
      ...dataToExport.map((row) => columns.map((column) => escapeExportValue(getExportValue(row, column)))),
    ];
    const csv = rows.map((row) => row.map((value) => `"${value.replace(/"/g, '""')}"`).join(',')).join('\r\n');
    downloadTextFile(`\ufeff${csv}`, `${filename}.csv`, 'text/csv');
  };

  const copyToClipboard = async <T,>(dataToCopy: T[], columns: ExportColumn<T>[]) => {
    if (!dataToCopy.length || !columns.length) return;
    const textToCopy = [
      columns.map((column) => column.header).join('\t'),
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
      label: column.header,
      visible: !hidden.includes(`${column.header}-${index}`),
    }));

  const visibleColumns = <T,>(columns: ExportColumn<T>[], hidden: string[]) =>
    columns.filter((column, index) => !hidden.includes(`${column.header}-${index}`));

  const districtToolbarColumns = makeToolbarColumns(districtCols, hiddenDistrictColumns);
  const toggleIn = (setter: React.Dispatch<React.SetStateAction<string[]>>) => (key: string) =>
    setter((prev) => (prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]));

  /* ───────── Chart Options ───────── */
  const instStatusSeries = [ula.verify_approved, ula.verify_pending, ula.verify_reject, ula.pending];
  const instStatusLabels = ['Approved', 'Verify Pending', 'Rejected', 'Install Pending'];

  const milestones = [
    { label: '1. Allocated Sites', v: ula.site_count, of: ula.site_count, color: 'var(--ax-viz-cyan)' },
    { label: '2. Structure Erected', v: ula.structure_complete, of: ula.site_count, color: 'var(--ax-accent)' },
    { label: '3. Structure Approved', v: ula.structure_verify_approved, of: ula.site_count, color: 'var(--ax-viz-violet)' },
    { label: '4. Installation Complete', v: ula.complete, of: ula.site_count, color: 'var(--ax-viz-emerald)' },
    { label: '5. Installation Approved', v: ula.verify_approved, of: ula.site_count, color: 'var(--ax-viz-emerald)' },
    { label: '6. Documents Uploaded', v: ula.inst_doc_complete, of: ula.site_count, color: 'var(--ax-viz-amber)' },
  ];

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      {/* 1. Page Header (Exact DLE style) */}
      <PageHead
        title="ULA Installation Dashboard"
        subtitle={
          <span style={{ display: 'inline-block', fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>
            Bihar State Operations · ULA installation tracking — last updated {updatedAt ? fmtTime(updatedAt) : '—'}
          </span>
        }
        breadcrumbs={[{ label: 'Bihar' }, { label: 'Installation' }, { label: 'ULA' }, { label: 'Dashboard' }]}
        actions={
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill" style={{ fontWeight: 600, paddingInline: 'var(--ax-space-3)' }}>
              <span className="ax-badge__dot" /> State: Bihar
            </span>
            <button type="button" className="ax-btn ax-btn--ghost ax-btn--icon" aria-label="Refresh dashboard" onClick={() => loadDashboardData(true)} disabled={isRefreshing}>
              <span className={isRefreshing ? 'ax-spinner' : ''}>{ICON_REFRESH}</span>
            </button>
            {/* <Link to="/v/bihar/ula-installation-pending-structure-site" className="ax-btn ax-btn--primary ax-btn--sm">
              {ICON_PLUS}
              <span className="ax-btn__label">Add Installation</span>
            </Link> */}
          </div>
        }
      />

      <div className="ax-dash-grid mt-0 pt-0">
        {apiError && (
          <div className="ax-col--12" style={{ padding: '10px 14px', background: 'color-mix(in oklab, var(--ax-viz-red) 12%, transparent)', color: 'var(--ax-viz-red)', borderRadius: 'var(--ax-radius-md)', fontSize: 'var(--ax-text-sm)' }}>
            <b>Error:</b> {apiError}{' '}
            <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" onClick={() => loadDashboardData(true)}>Retry</button>
          </div>
        )}

        {/* 2. Operations Filter Bar (Exact DLE style) */}
        <section
          className="ax-card ax-card--flat ax-col--12"
          role="region"
          aria-label="ULA Dashboard Filters"
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

              <div className="ax-cluster ula-filter-item" style={{ alignItems: 'center' }}>
                <label htmlFor="district-select" style={labelStyle}>District:</label>
                <select id="district-select" className="ax-input ax-input--sm" style={selectStyle} value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)}>
                  <option value="All">All Districts ({districtwise.length})</option>
                  {districtwise.map((d) => <option key={d.district} value={d.district}>{d.district}</option>)}
                </select>
              </div>

              {filtersActive && (
                <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" style={{ height: 28, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }} onClick={() => setSelectedDistrict('All')}>
                  Reset Filters
                </button>
              )}
            </div>

            <div className="ax-cluster ula-filter-scope" style={{ gap: 'var(--ax-space-2)', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>
                Showing <b style={{ color: 'var(--ax-text-strong)' }}>{dash(ula.site_count)}</b> installations · Live: <b style={{ color: 'var(--ax-text-strong)' }}>{todayLabel}</b>
              </span>
            </div>
          </div>
        </section>

        {/* 3. Executive Welcome Banner (Exact DLE style) */}
        <section className="ax-card ax-welcome ax-col--12" role="region" aria-label="Bihar ULA Installation Overview">
          <div className="ax-welcome__body">
            <div className="ax-welcome__text">
              <p className="ax-welcome__eyebrow">ULA Installation Management System · State Hub</p>
              <h2 className="ax-card__title">Welcome to Bihar ULA Installation Dashboard</h2>
              <p className="ax-welcome__lede">
                Bihar state installation overview: <b>{dash(ula.site_count)} installations</b> tracked across <b>{dash(filtersActive ? 1 : districtwise.length)} districts</b>.
                <b> {dash(ula.complete)} ({instPct}%)</b> installations completed, with <b>{dash(ula.verify_approved)} ({approvedPct}%)</b> physically verified and approved.
              </p>
            </div>

            <dl className="ax-welcome__stats">
              <div className="ax-welcome__stat">
                <dt>Total Installations</dt>
                <dd className="ax-num">{dash(ula.site_count)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-emerald)' }}>{dash(districtwise.length)} Districts</small>
              </div>
              <div className="ax-welcome__stat">
                <dt>Structure Done</dt>
                <dd className="ax-num">{dash(ula.structure_complete)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-accent)' }}>{structPct}% Done</small>
              </div>
              <div className="ax-welcome__stat">
                <dt>Installation Done</dt>
                <dd className="ax-num">{dash(ula.complete)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-cyan)' }}>{instPct}% Done</small>
              </div>
              <div className="ax-welcome__stat">
                <dt>Approved</dt>
                <dd className="ax-num">{dash(ula.verify_approved)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-emerald)' }}>{approvedPct}% Approved</small>
              </div>
            </dl>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            4. THE 13 EXACT DLE-STYLE KPI CARDS (ALL REQUIRED METRICS)
            ══════════════════════════════════════════════════════════════ */}
        <div className="ax-col--12">
          <div className="ax-cluster" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={sectionHeadStyle}>ULA Operational Metrics &amp; Approval Status</h4>
            <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>Click card to inspect matching sites</span>
          </div>
        </div>



        {/* 2. Structure Status: Installed / Pending */}
        <KpiCard
          icon={I_BOLT}
          tone="cyan"
          label="Structure Status"
          value={loading && !data ? '…' : `${ula.structure_complete} / ${ula.structure_pending}`}
          sub="Installed / Pending"
          badge={`${structPct}% Done`}
          spark={spk((d) => n(d.structure_complete))}
          
        />

        {/* 3. Structure Verification Status: Approved / Pending / Rejected */}
        <KpiCard
          icon={I_DONE}
          tone="emerald"
          label="Structure Verification Status"
          value={loading && !data ? '…' : `${ula.structure_verify_approved} / ${ula.structure_verify_pending} / ${ula.structure_verify_reject}`}
          sub="Approved / Pending / Rejected"
          badge={ula.structure_verify_approved > 0 ? 'Approved' : undefined}
          spark={spk((d) => n(d.structure_verify_approved))}
        
        />

        {/* 4. Installation Status: Installed / Pending */}
        <KpiCard
          icon={I_BOLT}
          tone="cyan"
          label="Installation Status"
          value={loading && !data ? '…' : `${ula.complete} / ${ula.pending}`}
          sub="Installed / Pending"
          badge={`${instPct}% Done`}
          spark={spk((d) => n(d.inst_complete))}
         
          
        />

        {/* 5. Verification Status: Approved / Pending / Rejected */}
        <KpiCard
          icon={I_DONE}
          tone="emerald"
          label="Verification Status"
          value={loading && !data ? '…' : `${ula.verify_approved} / ${ula.verify_pending} / ${ula.verify_reject}`}
          sub="Approved / Pending / Rejected"
          badge={`${approvedPct}% Approved`}
          spark={spk((d) => n(d.verify_approved))}
         
         
        />

        {/* 6. Documents Status: Submitted / Pending */}
        <KpiCard
          icon={I_DOC}
          tone="violet"
          label="Documents Status"
          value={loading && !data ? '…' : `${ula.inst_doc_complete} / ${ula.inst_doc_pending}`}
          sub="Submitted / Pending"
          badge={ula.inst_doc_complete > 0 ? `${pctOf(ula.inst_doc_complete, ula.site_count)}%` : undefined}
          spark={spk((d) => n(d.inst_doc_complete))}
        
         
        />

        {/* 7. Document Approval: Approved / Pending / Rejected */}
        <KpiCard
          icon={I_DOC}
          tone="violet"
          label="Document Approval"
          value={loading && !data ? '…' : `${ula.doc_verify_approve} / ${ula.doc_verify_pending} / ${ula.doc_verify_reject}`}
          sub="Approved / Pending / Rejected"
          badge={ula.doc_verify_approve > 0 ? 'Approved' : undefined}
          spark={spk((d) => n(d.doc_verify_approved))}
        
      
        />

        {/* 8. Claim 50% Status: Applicable / Raised */}
        <KpiCard
          icon={I_LIST}
          tone="amber"
          label="Claim 50% Status"
          value={loading && !data ? '…' : `${ula.claim50_applicable} / ${ula.claim50_raised}`}
          sub="Applicable / Raised"
          badge={ula.claim50_raised > 0 ? `${ula.claim50_raised} Raised` : undefined}
          
        />

        {/* 9. Claim 50% Approval: Approved / Pending / Rejected */}
        <KpiCard
          icon={I_DONE}
          tone="emerald"
          label="Claim 50% Approval"
          value={loading && !data ? '…' : `${ula.inst_claim50_verify_papprove} / ${ula.inst_claim50_verify_pending} / ${ula.inst_claim50_verify_reject}`}
          sub="Approved / Pending / Rejected"
          badge={ula.inst_claim50_verify_papprove > 0 ? 'Approved' : undefined}
       
        />

        {/* 10. Claim 30% Status: Applicable / Raised */}
        <KpiCard
          icon={I_LIST}
          tone="amber"
          label="Claim 30% Status"
          value={loading && !data ? '…' : `${ula.claim30_applicable} / ${ula.claim30_raised}`}
          sub="Applicable / Raised"
          badge={ula.claim30_raised > 0 ? `${ula.claim30_raised} Raised` : undefined}
        
        />

        {/* 11. Claim 30% Approval: Approved / Pending / Rejected */}
        <KpiCard
          icon={I_DONE}
          tone="emerald"
          label="Claim 30% Approval"
          value={loading && !data ? '…' : `${ula.inst_claim30_verify_papprove} / ${ula.inst_claim30_verify_pending} / ${ula.inst_claim30_verify_reject}`}
          sub="Approved / Pending / Rejected"
          badge={ula.inst_claim30_verify_papprove > 0 ? 'Approved' : undefined}
        
        />

        {/* 12. Payment 50% Status: Partially Paid / Paid / Pending */}
        <KpiCard
          icon={I_COIN}
          tone="cyan"
          label="Payment 50% Status"
          value={loading && !data ? '…' : `${ula.inst_pay50_partially} / ${ula.inst_pay50_paid} / ${ula.inst_pay50_pending}`}
          sub="Partially Paid / Paid / Pending"
          badge={ula.inst_pay50_paid > 0 ? 'Disbursed' : undefined}
        
        />

        {/* 13. Payment 30% Status: Partially Paid / Paid / Pending */}
        <KpiCard
          icon={I_COIN}
          tone="amber"
          label="Payment 30% Status"
          value={loading && !data ? '…' : `${ula.inst_pay30_partially} / ${ula.inst_pay30_paid} / ${ula.inst_pay30_pending}`}
          sub="Partially Paid / Paid / Pending"
          badge={ula.inst_pay30_paid > 0 ? 'Disbursed' : undefined}
        
        />

        {/* 5. Charts: Monthly Installation Trend (8 col) + Donut Split (4 col) */}
        <section className="ax-card ax-card--chart ax-col--8" role="region" aria-label="Monthly installation trend">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Execution Throughput</span>
              <h2 className="ax-card__title">Monthly Installation Trend</h2>
              <p className="ax-card__subtitle">{num(monthTotal)} installations across {monthly.length} month{monthly.length === 1 ? '' : 's'} · {num(todayTotal)} today</p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)' }}>
                {[
                  { l: 'Monthly Completed', c: LIGHT_GREEN },
                ].map((i) => (
                  <span key={i.l} className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}>
                    <i style={{ width: 10, height: 10, borderRadius: 2, background: i.c }} />
                    <small style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-xs)' }}>{i.l}</small>
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0, minHeight: chartH }}>
            {monthly.length > 0 ? (
              <Suspense fallback={<div className="ax-skeleton" style={{ height: chartH }} />}>
                <ApexChart
                  key={`month-${chartH}-${monthly.map((m) => `${m.month_year}${m.monthly_installations}`).join('-')}`}
                  type="area"
                  height={chartH}
                  legend="none"
                  ariaLabel="Monthly installations"
                  series={[{ name: 'Installations', data: monthly.map((m) => n(m.monthly_installations)) }]}
                  apex={{
                    colors: [LIGHT_GREEN],
                    stroke: { curve: 'smooth', width: 2 },
                    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.05, stops: [0, 90, 100] } },
                    markers: { size: 4, strokeWidth: 0, hover: { size: 6 } },
                    dataLabels: { enabled: false },
                    xaxis: { categories: monthly.map((m) => fmtMonth(m.month_year)) },
                    yaxis: { min: 0, forceNiceScale: true, labels: { formatter: (v: number) => `${Math.round(v)}` }, title: { text: 'Sites', style: { color: 'var(--ax-text-muted)' } } },
                    tooltip: { y: { formatter: (v: number) => `${v} Sites` } },
                  }}
                />
              </Suspense>
            ) : (
              <TableEmptyState title="No installation trend yet" message="The monthly trend appears once installations are completed." />
            )}
          </div>
        </section>

        <section className="ax-card ax-col--4" role="region" aria-label="Installation status split">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Survey Distribution</span>
              <h2 className="ax-card__title">Installation Status</h2>
              <p className="ax-card__subtitle">Total {dash(ula.site_count)} sites</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <Suspense fallback={<div className="ax-skeleton" style={{ height: donutH }} />}>
              <ApexChart
                key={`donut-${donutH}-${instStatusSeries.join('-')}`}
                type="donut"
                height={donutH}
                legend="none"
                ariaLabel="Installation status split"
                series={instStatusSeries}
                apex={{
                  labels: instStatusLabels,
                  colors: [LIGHT_GREEN, LIGHT_BLUE, '#ef6a6a', LIGHT_AMBER],
                  stroke: { width: 0 },
                  plotOptions: {
                    pie: {
                      donut: {
                        size: '72%',
                        labels: {
                          show: true,
                          name: { fontFamily: cv('--ax-font-sans') },
                          value: { fontFamily: cv('--ax-font-mono'), fontWeight: 600 },
                          total: { show: true, label: 'Sites', formatter: () => num(ula.site_count) },
                        },
                      },
                    },
                  },
                }}
              />
            </Suspense>
            <ul className="ax-list ax-list--compact" style={{ marginTop: 'var(--ax-space-3)' }}>
              {[
                { label: 'Approved', sub: `${approvedPct}% of total`, v: ula.verify_approved, color: LIGHT_GREEN },
                { label: 'Verify Pending', sub: 'Awaiting verification', v: ula.verify_pending, color: LIGHT_BLUE },
                { label: 'Rejected', sub: 'Correction needed', v: ula.verify_reject, color: '#ef6a6a' },
                { label: 'Install Pending', sub: 'In progress', v: ula.pending, color: LIGHT_AMBER },
              ].map((s) => (
                <li key={s.label} className="ax-list__row" style={{ border: 0, paddingInline: 0 }}>
                  <span className="ax-list__leading"><i style={{ width: 9, height: 9, borderRadius: 3, background: s.color, display: 'inline-block' }} /></span>
                  <span className="ax-list__content">
                    <span className="ax-list__title" style={{ fontWeight: 'var(--ax-weight-medium)' }}>{s.label}</span>
                    <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>{s.sub}</span>
                  </span>
                  <span className="ax-list__trailing ax-num" style={{ color: 'var(--ax-text-strong)', fontWeight: 600 }}>{num(s.v)}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 6. District Chart (8 col) + Milestones (4 col) */}
        <section className="ax-card ax-card--chart ax-col--8" role="region" aria-label="District wise installations">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Geographic Breakdown</span>
              <h2 className="ax-card__title">District-wise Installation Statistics</h2>
              <p className="ax-card__subtitle">Installations by progress across Bihar districts · click bar to filter</p>
            </div>
            <div className="ax-card__actions">
              <span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--pill">{dash(districtwise.length)} Districts</span>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            {chartDistricts.length > 0 ? (
              <Suspense fallback={<div className="ax-skeleton" style={{ height: districtChartH }} />}>
                <ApexChart
                  key={`bar-${districtChartH}-${chartDistricts.length}-${ula.site_count}`}
                  type="bar"
                  height={districtChartH}
                  legend="top"
                  stacked
                  ariaLabel="Horizontal stacked bar of installations per district by progress"
                  series={[
                    { name: 'Installed', data: chartDistricts.map((d) => n(d.inst_complete)) },
                    { name: 'Structure Done', data: chartDistricts.map((d) => n(d.structure_complete)) },
                    { name: 'Pending', data: chartDistricts.map((d) => Math.max(0, n(d.site_count) - n(d.inst_complete))) },
                  ]}
                  apex={{
                    colors: [LIGHT_GREEN, LIGHT_AMBER, LIGHT_BLUE],
                    plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: '58%' } },
                    xaxis: { categories: chartDistricts.map((d) => d.district), labels: { style: { fontSize: '11px' } } },
                    yaxis: { labels: { maxWidth: isMobile ? 90 : 160, style: { fontSize: '11px' } } },
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
              <TableEmptyState title="No district records" message="District progress appears once sites are allocated." />
            )}
          </div>
        </section>

        <section className="ax-card ax-col--4" role="region" aria-label="Installation Progress">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Workflow Lifecycle</span>
              <h2 className="ax-card__title">Installation Milestones</h2>
              <p className="ax-card__subtitle">Progress across execution stages</p>
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
                  <div className="ax-progress ax-progress--sm"><div className="ax-progress__track"><div className="ax-progress__fill" style={{ width: `${p}%`, background: m.color }} /></div></div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            7. DISTRICT WISE DATA TABLE (EXACT DLE STYLING & TOOLBAR)
            ══════════════════════════════════════════════════════════════ */}
        <section className="ax-card ax-col--12" role="region" aria-label="District wise data">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Enterprise Data Analytics</span>
              <h2 className="ax-card__title">District Wise Installation Breakdown</h2>
              <p className="ax-card__subtitle">Progress across structure erection, electrical commissioning, physical verification, and document submissions</p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                <SearchInput value={qDistrict} onChange={setQDistrict} placeholder="Search district..." size="sm" />
                <TableExportToolbar
                  onCopy={() => copyToClipboard(tableDistricts, visibleColumns(districtCols, hiddenDistrictColumns))}
                  onExportCSV={() => exportToCSV(tableDistricts, visibleColumns(districtCols, hiddenDistrictColumns), `Bihar_ULA_District_Wise_${stamp}`)}
                  onExportExcel={() => exportToExcel(tableDistricts, visibleColumns(districtCols, hiddenDistrictColumns), `Bihar_ULA_District_Wise_${stamp}`)}
                  onExportPDF={() => exportToPDF(tableDistricts, visibleColumns(districtCols, hiddenDistrictColumns), 'Bihar ULA District Wise Installation Breakdown')}
                  columns={districtToolbarColumns}
                  onToggleColumn={toggleIn(setHiddenDistrictColumns)}
                />
              </div>
            </div>
          </div>
          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover ula-table--md ula-sticky-first">
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">District</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Allocated</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Structure (Done / Pend)</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Install (Done / Pend)</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Verification (App / Pend / Rej)</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Documents</th>
                  <th className="ax-table__th" scope="col">Progress</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading && !data ? (
                  <tr><td className="ax-table__td" colSpan={8} style={emptyCellStyle}><span className="ax-spinner" /> Loading district records…</td></tr>
                ) : pD.paginatedData.length === 0 ? (
                  <tr><td className="ax-table__td" colSpan={8} style={emptyCellStyle}>No districts match the filters.</td></tr>
                ) : (
                  pD.paginatedData.map((d) => {
                    const total = n(d.site_count);
                    const installed = n(d.inst_complete);
                    const rowPct = pctOf(installed, total);
                    const isSelected = selectedDistrict.toLowerCase() === d.district.toLowerCase();

                    return (
                      <tr
                        key={d.district}
                        className="ax-table__row"
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedDistrict(d.district)}
                        onKeyDown={onActivate(() => setSelectedDistrict(d.district))}
                        style={{ cursor: 'pointer', background: isSelected ? 'rgba(var(--ax-accent-rgb), 0.05)' : undefined }}
                      >
                        <td className="ax-table__td">
                          <div className="ax-cluster" style={{ gap: '6px', alignItems: 'center' }}>
                            <span style={{ fontWeight: 'var(--ax-weight-semibold)', color: 'var(--ax-text-strong)' }}>{d.district}</span>
                            {isSelected && (
                              <span className="ax-badge ax-badge--soft ax-badge--accent ax-badge--pill" style={{ fontSize: '10px', padding: '1px 6px' }}>Active</span>
                            )}
                          </div>
                        </td>
                        <td className="ax-table__td ax-table__td--num ax-num" style={{ fontWeight: 600 }}>{num(total)}</td>
                        <td className="ax-table__td ax-table__td--num">
                          <div className="ax-cluster" style={{ justifyContent: 'flex-end', gap: '4px' }}>
                            <span className="ax-badge ax-badge--soft ax-badge--info" style={{ fontWeight: 600, padding: '2px 7px' }}>{num(d.structure_complete)}</span>
                            <span style={{ color: 'var(--ax-text-muted)', fontSize: '11px' }}>/</span>
                            <span className="ax-badge ax-badge--soft ax-badge--warning" style={{ fontWeight: 600, padding: '2px 7px' }}>{num(d.structure_pending)}</span>
                          </div>
                        </td>
                        <td className="ax-table__td ax-table__td--num">
                          <div className="ax-cluster" style={{ justifyContent: 'flex-end', gap: '4px' }}>
                            <span className="ax-badge ax-badge--soft ax-badge--success" style={{ fontWeight: 600, padding: '2px 7px' }}>{num(d.inst_complete)}</span>
                            <span style={{ color: 'var(--ax-text-muted)', fontSize: '11px' }}>/</span>
                            <span className="ax-badge ax-badge--soft ax-badge--neutral" style={{ fontWeight: 600, padding: '2px 7px' }}>{num(d.inst_pending)}</span>
                          </div>
                        </td>
                        <td className="ax-table__td ax-table__td--num">
                          <div className="ax-cluster" style={{ justifyContent: 'flex-end', gap: '4px' }}>
                            <span className="ax-badge ax-badge--soft ax-badge--success" style={{ padding: '2px 6px', fontSize: '11px' }} title="Approved">
                              <span className="ax-badge__dot" />{num(d.verify_approved)}
                            </span>
                            <span className="ax-badge ax-badge--soft ax-badge--warning" style={{ padding: '2px 6px', fontSize: '11px' }} title="Pending Verify">
                              {num(d.verify_pending)}
                            </span>
                            <span className="ax-badge ax-badge--soft ax-badge--danger" style={{ padding: '2px 6px', fontSize: '11px' }} title="Rejected">
                              {num(d.verify_reject)}
                            </span>
                          </div>
                        </td>
                        <td className="ax-table__td ax-table__td--num">
                          <span style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>{num(d.inst_doc_complete)}</span>
                          <span style={{ color: 'var(--ax-text-muted)' }}> / </span>
                          <span style={{ color: 'var(--ax-text-muted)' }}>{num(d.inst_doc_pending)}</span>
                        </td>
                        <td className="ax-table__td">
                          <Bar pct={rowPct} />
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="ax-btn ax-btn--secondary ax-btn--sm"
                            style={{ height: 26, padding: '0 8px', fontSize: '11px', gap: '4px' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenStatusDrill('total', `${d.district} — All Sites`, d.district);
                            }}
                            title={`Inspect sites in ${d.district}`}
                          >
                            {ICON_EYE}
                            <span className="ax-btn__label">Sites</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
                {tableDistricts.length > 0 && (
                  <tr className="ax-table__row" style={{ background: 'var(--ax-surface-subtle)', fontWeight: 'var(--ax-weight-bold)' }}>
                    <td className="ax-table__td" style={{ color: 'var(--ax-text-strong)', background: 'var(--ax-surface-subtle)' }}>Total ({filteredDistrictRows.length} Districts)</td>
                    <td className="ax-table__td ax-table__td--num ax-num">{num(districtTotals.site_count)}</td>
                    <td className="ax-table__td ax-table__td--num">
                      <div className="ax-cluster" style={{ justifyContent: 'flex-end', gap: '4px' }}>
                        <span className="ax-badge ax-badge--soft ax-badge--info" style={{ fontWeight: 700 }}>{num(districtTotals.structure_complete)}</span>
                        <span>/</span>
                        <span className="ax-badge ax-badge--soft ax-badge--warning" style={{ fontWeight: 700 }}>{num(districtTotals.structure_pending)}</span>
                      </div>
                    </td>
                    <td className="ax-table__td ax-table__td--num">
                      <div className="ax-cluster" style={{ justifyContent: 'flex-end', gap: '4px' }}>
                        <span className="ax-badge ax-badge--soft ax-badge--success" style={{ fontWeight: 700 }}>{num(districtTotals.inst_complete)}</span>
                        <span>/</span>
                        <span className="ax-badge ax-badge--soft ax-badge--neutral" style={{ fontWeight: 700 }}>{num(districtTotals.inst_pending)}</span>
                      </div>
                    </td>
                    <td className="ax-table__td ax-table__td--num">
                      <div className="ax-cluster" style={{ justifyContent: 'flex-end', gap: '4px' }}>
                        <span className="ax-badge ax-badge--soft ax-badge--success">{num(districtTotals.verify_approved)}</span>
                        <span className="ax-badge ax-badge--soft ax-badge--warning">{num(districtTotals.verify_pending)}</span>
                        <span className="ax-badge ax-badge--soft ax-badge--danger">{num(districtTotals.verify_reject)}</span>
                      </div>
                    </td>
                    <td className="ax-table__td ax-table__td--num">
                      <span style={{ fontWeight: 700 }}>{num(districtTotals.inst_doc_complete)}</span>
                      <span> / </span>
                      <span>{num(districtTotals.inst_doc_pending)}</span>
                    </td>
                    <td className="ax-table__td">
                      <Bar pct={Math.round(pctOf(districtTotals.inst_complete, districtTotals.site_count))} />
                    </td>
                    <td />
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="ax-card__footer" style={footerStyle}>
            <div className="ula-pagination-left">
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

        {/* 8. Today's Installation Activity (8 col) & Operations Telemetry (4 col) */}
        <section className="ax-card ax-col--8" role="region" aria-label="Today's installations">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Site Operations · Live {todayLabel}</span>
              <h2 className="ax-card__title">Today&apos;s Installation Activity</h2>
              <p className="ax-card__subtitle">{todayTotal} installations completed today across execution partners</p>
            </div>
          </div>
          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover ula-table--sm ula-sticky-first">
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
                  <tr><td className="ax-table__td" colSpan={4} style={emptyCellStyle}>{loading ? 'Loading…' : 'No installations reported today yet.'}</td></tr>
                ) : (
                  today.map((t, idx) => (
                    <tr key={idx} className="ax-table__row">
                      <td className="ax-table__td" style={{ color: 'var(--ax-text-muted)' }}>{idx + 1}</td>
                      <td className="ax-table__td" style={{ fontWeight: 'var(--ax-weight-semibold)', color: 'var(--ax-text-strong)' }}>
                        {t.name || `Vendor #${t.inst_vendor}`}
                      </td>
                      <td className="ax-table__td"><span className="ax-badge ax-badge--soft ax-badge--info ax-badge--pill">Installation Partner</span></td>
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-emerald)', fontWeight: 700 }}>
                        +{t.today_install} Sites
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="ax-card ax-col--4" role="region" aria-label="Operations Telemetry">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Real-Time Telemetry</span>
              <h2 className="ax-card__title">Operations Overview</h2>
              <p className="ax-card__subtitle">Field activity and verification status</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <div>
              <div className="ax-cluster" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 6, marginBottom: 'var(--ax-space-2)' }}>
                <span style={{ fontSize: 'var(--ax-text-sm)', fontWeight: 600, color: 'var(--ax-text-strong)' }}>Top Installation Partners</span>
                <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill">{today.length} Active Today</span>
              </div>
              <div className="ax-statgroup ax-statgroup--stack" style={{ gap: 'var(--ax-space-3)' }}>
                {today.length === 0 && <div style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-xs)' }}>{loading ? 'Loading…' : 'No partner data today.'}</div>}
                {today.map((s, i) => {
                  const c = AVATAR_COLORS[i % AVATAR_COLORS.length];
                  return (
                    <div
                      key={i}
                      className="ax-cluster"
                      style={{ width: '100%', gap: 'var(--ax-space-3)', flexWrap: 'nowrap', padding: 0 }}
                    >
                      <span className="ax-avatar ax-avatar--sm" style={{ background: `color-mix(in oklab,${c} 22%,transparent)`, color: c, fontWeight: 600 }}>{initials(s.name || `V${s.inst_vendor}`)}</span>
                      <div style={{ flex: '1 1 auto', minWidth: 0 }}>
                        <div className="ax-truncate" style={{ fontWeight: 'var(--ax-weight-medium)', color: 'var(--ax-text-strong)', fontSize: 'var(--ax-text-sm)' }}>{s.name || `Vendor #${s.inst_vendor}`}</div>
                        <div style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>Field Partner</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <b className="ax-num" style={{ color: 'var(--ax-viz-emerald)' }}>+{s.today_install}</b>
                        <span className="ax-kpi__delta ax-kpi__delta--up" style={{ display: 'flex', justifyContent: 'flex-end' }}>{ARROW_UP}today</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="ax-divider" style={{ marginBlock: 'var(--ax-space-4)' }} />

            <div className="ax-cluster" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>Quick Actions</span>
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--sm"
                onClick={() => navigate('/v/bihar/ula/installation/view')}
              >
                View Installations →
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* ── Status Drill-Down Modal (DLE modal style) ── */}
      {statusModalOpen && (
        <div className="ax-modal-backdrop" onClick={() => setStatusModalOpen(false)}>
          <div className="ax-modal" style={{ maxWidth: 850 }} onClick={(e) => e.stopPropagation()}>
            <div className="ax-modal__header">
              <div>
                <h4 className="ax-modal__title">{statusModalTitle}</h4>
                <p style={{ margin: 0, fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
                  Total {statusModalSites.length} site{statusModalSites.length === 1 ? '' : 's'}
                </p>
              </div>
              <button type="button" className="ax-btn ax-btn--ghost ax-btn--icon" onClick={() => setStatusModalOpen(false)}>✕</button>
            </div>
            <div className="ax-modal__body" style={{ maxHeight: 450, overflowY: 'auto' }}>
              {statusModalLoading ? (
                <div style={{ textAlign: 'center', padding: 'var(--ax-space-6)' }}><span className="ax-spinner" /> Fetching sites…</div>
              ) : statusModalSites.length === 0 ? (
                <TableEmptyState title="No sites found" message="No sites currently match this status filter." />
              ) : (
                <div className="ax-table-wrap">
                  <table className="ax-table ax-table--hover">
                    <thead>
                      <tr>
                        <th>Sr.</th>
                        <th>Beneficiary Name</th>
                        <th>District</th>
                        <th>Block</th>
                        <th>Village</th>
                        <th>CA No.</th>
                        <th>Contact</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statusModalSites.map((s, idx) => (
                        <tr key={s.id || idx}>
                          <td>{idx + 1}</td>
                          <td style={{ fontWeight: 600 }}>{s.beneficiary_name || s.consumer_name || '—'}</td>
                          <td>{s.district || '—'}</td>
                          <td>{s.block || '—'}</td>
                          <td>{s.village || '—'}</td>
                          <td>{s.ca_no || s.ca_number || '—'}</td>
                          <td>{s.contact_no || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="ax-modal__footer">
              <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={() => setStatusModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Bihar_Installation_ULA_Dashboard;
