import { lazy, Suspense, useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  biharUlaInstallationService,
  type UlaInstallationDashboardData,
} from '../../../../../services/biharUlaInstallationService';
import {
  TableExportToolbar,
  SearchInput,
  Pagination,
  TableEmptyState,
  usePagination,
  copyTableDataToClipboard,
  exportDataToCSV,
  exportDataToExcel,
  printTableData,
  type ExportColumn,
} from '../../../../../common';

// Code-split ApexCharts so the shell and tables render instantly
const ApexChart = lazy(() => import('../../../../charts/ApexChart').then((m) => ({ default: m.ApexChart })));

/* ───────── Colors ───────── */
const LIGHT_BLUE = '#2f7df2';
const LIGHT_GREEN = '#86DDB2';
const LIGHT_AMBER = '#f5b94a';

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

const EMPTY_ULA: UlaSummary = {
  site_count: 0,
  structure_complete: 0,
  structure_pending: 0,
  structure_verify_pending: 0,
  structure_verify_approved: 0,
  structure_verify_reject: 0,
  complete: 0,
  pending: 0,
  verify_pending: 0,
  verify_approved: 0,
  verify_reject: 0,
  inst_doc_complete: 0,
  inst_doc_pending: 0,
  doc_verify_approve: 0,
  doc_verify_pending: 0,
  doc_verify_reject: 0,
  claim50_applicable: 0,
  claim50_raised: 0,
  inst_claim50_verify_papprove: 0,
  inst_claim50_verify_pending: 0,
  inst_claim50_verify_reject: 0,
  claim30_applicable: 0,
  claim30_raised: 0,
  inst_claim30_verify_papprove: 0,
  inst_claim30_verify_pending: 0,
  inst_claim30_verify_reject: 0,
  inst_pay50_partially: 0,
  inst_pay50_paid: 0,
  inst_pay50_pending: 0,
  inst_pay30_partially: 0,
  inst_pay30_paid: 0,
  inst_pay30_pending: 0,
};

/* ───────── Helpers ───────── */
const num = (x: number) => (x ?? 0).toLocaleString('en-IN');
const pctOf = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : 0);
const n = (v: unknown) => Number(v ?? 0) || 0;
const fmtMonth = (s: string) => {
  const [y, m] = String(s || '').split('-');
  const mi = Number(m);
  if (!y || !mi) return s || '';
  return `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][mi - 1]} ${y}`;
};

const useChartHeight = (desktop: number, mobile: number) => {
  const pickH = () => (typeof window !== 'undefined' && window.innerWidth < 640 ? mobile : desktop);
  const [h, setH] = useState(pickH);
  useEffect(() => {
    const onResize = () => setH(pickH());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [desktop, mobile]);
  return h;
};

const PAGE_CSS = `
  .solar-erp-page .ax-page-head { margin-block-end: 10px; }
  .solar-erp-page .ax-dash-grid { margin-top: 0; }
  .solar-erp-page .ax-card { min-width: 0; }
  .solar-erp-page .ax-card__footer { width: 100%; box-sizing: border-box; }
  .solar-erp-page .ula-pagination-left { width: 100%; display: flex; justify-content: flex-start; align-items: center; overflow-x: auto; }
  .solar-erp-page .ax-card__header { display: flex; flex-wrap: nowrap; align-items: flex-start; justify-content: space-between; gap: 12px; }
  .solar-erp-page .ax-card__titles { flex: 1 1 220px; min-width: 220px; max-width: 100%; }
  .solar-erp-page .ax-card__title, .solar-erp-page .ax-card__eyebrow, .solar-erp-page .ax-card__subtitle { max-width: none; word-break: normal; overflow-wrap: normal; hyphens: none; }
  .solar-erp-page .ax-card__actions { flex: 0 1 auto; min-width: 0; margin-left: auto; display: flex; align-items: center; justify-content: flex-end; gap: 8px; }
  .solar-erp-page .ax-card__actions .ax-cluster { flex-wrap: nowrap !important; min-width: 0; justify-content: flex-end; }
  .solar-erp-page .ax-card__actions .ax-search, .solar-erp-page .ax-card__actions [class*="search"] { flex: 1 1 140px; min-width: 90px; max-width: 260px; }
  .solar-erp-page .ax-card__actions input { min-width: 0; width: 100%; }
  .solar-erp-page .ax-table-wrap { width: 100%; max-width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .solar-erp-page .ax-table { min-width: 560px; }
  .solar-erp-page .ax-welcome__lede { max-width: 780px; }
  .solar-erp-page .ula-filter-item { display: flex; align-items: center; gap: 6px; }
  .solar-erp-page .ula-filter-item select { width: 170px; }

  @media (max-width: 1100px) {
    .solar-erp-page .ax-col--8, .solar-erp-page .ax-col--6, .solar-erp-page .ax-col--4 { grid-column: span 12; }
    .solar-erp-page .ax-col--3 { grid-column: span 6; }
    .solar-erp-page .ax-export-toolbar__button { font-size: 0; gap: 0; padding: 0 8px !important; justify-content: center; }
    .solar-erp-page .ax-export-toolbar__button svg { width: 16px; height: 16px; flex-shrink: 0; }
  }
  @media (max-width: 760px) {
    .solar-erp-page { width: 100%; max-width: 100%; overflow-x: hidden; box-sizing: border-box; }
    .solar-erp-page .ax-welcome__stats { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
    .solar-erp-page .ula-filter-item { width: 100%; justify-content: space-between; }
    .solar-erp-page .ula-filter-item select { flex: 1; width: auto; max-width: 100%; }
    .solar-erp-page .ax-card__header { flex-direction: column; align-items: stretch; gap: 10px; }
    .solar-erp-page .ax-card__titles { flex: 0 0 auto; min-width: 0; width: 100%; }
    .solar-erp-page .ax-card__actions { width: 100%; margin-left: 0; flex-wrap: wrap; justify-content: flex-start; }
    .solar-erp-page .ax-card__actions .ax-cluster { flex-wrap: wrap !important; width: 100%; justify-content: flex-start; }
    .solar-erp-page .ax-card__actions .ax-search, .solar-erp-page .ax-card__actions [class*="search"] { flex: 1 1 100%; width: 100%; max-width: 100%; }
    .solar-erp-page .ax-export-toolbar__button { font-size: 12px; gap: 4px; height: 30px; padding: 0 8px !important; }
  }
  @media (max-width: 490px) {
    .solar-erp-page .ax-welcome__stats { grid-template-columns: 1fr !important; }
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
const svg = (children: React.ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const I_PIN = svg(<><path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /><path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0" /></>);
const I_BOLT = svg(<path d="M13 3l0 7l6 0l-8 11l0 -7l-6 0l8 -11" />);
const I_LIST = svg(<><path d="M9 6l11 0" /><path d="M9 12l11 0" /><path d="M9 18l11 0" /><path d="M5 6l0 .01" /><path d="M5 12l0 .01" /><path d="M5 18l0 .01" /></>);
const I_CLOCK = svg(<><path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M12 7v5l3 3" /></>);
const I_DONE = svg(<><path d="M7 12l5 5l10 -10" /><path d="M2 12l5 5m5 -5l5 -5" /></>);
const I_X = svg(<><path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M10 10l4 4m0 -4l-4 4" /></>);
const I_COIN = svg(<><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M14.8 9a2 2 0 0 0 -1.8 -1h-2a2 2 0 1 0 0 4h2a2 2 0 1 1 0 4h-2a2 2 0 0 1 -1.8 -1" /><path d="M12 7v10" /></>);
const I_DOC = svg(<><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2" /><path d="M9 13l2 2l4 -4" /></>);

/* ───────── DLE-Style KPI card ───────── */
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
  onClick?: () => void;
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

function KpiCard({ icon, tone, label, value, unit, sub, badge, spark, sparkType = 'line', onClick }: KpiProps) {
  const t = TONE[tone];
  const hasSpark = Array.isArray(spark) && spark.length > 1;
  const allZeros = hasSpark && spark!.every((v) => v === 0);
  const safeSpark = allZeros ? [0, 1, 0, 1, 0, 0, 1] : spark;

  return (
    <div
      className="ax-card ax-col--3"
      role={onClick ? 'button' : 'region'}
      tabIndex={onClick ? 0 : undefined}
      aria-label={label}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
      style={{
        borderRadius: 'var(--ax-radius-lg)',
        background: 'var(--ax-bg-surface)',
        cursor: onClick ? 'pointer' : undefined,
        transition: 'transform 160ms ease, box-shadow 160ms ease',
      }}
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
            <span className="ax-kpi__delta ax-kpi__delta--up" style={{ fontSize: '11px', padding: '1px 6px', flexShrink: 0 }}>{badge}</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--ax-font-display)', fontSize: '1.25rem', fontWeight: 700, lineHeight: 1.15, color: 'var(--ax-text-strong)', fontVariantNumeric: 'tabular-nums' }}>
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

const labelStyle = { fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)', fontWeight: 500 } as const;
const sectionHeadStyle = { margin: 'var(--ax-space-3) 0 var(--ax-space-1) 0', fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' } as const;

/* ───────── Progress row ───────── */
function ProgressRow({ label, v, of, color }: { label: string; v: number; of: number; color: string }) {
  const p = pctOf(v, of);
  return (
    <div>
      <div className="ax-cluster" style={{ justifyContent: 'space-between', marginBottom: 4, flexWrap: 'wrap', gap: 4 }}>
        <span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-strong)', fontWeight: 500 }}>{label}</span>
        <b className="ax-num" style={{ color, fontSize: 'var(--ax-text-xs)' }}>{num(v)} / {num(of)} ({p}%)</b>
      </div>
      <div className="ax-progress ax-progress--sm"><div className="ax-progress__track"><div className="ax-progress__fill" style={{ width: `${p}%`, background: color }} /></div></div>
    </div>
  );
}

export function Bihar_Installation_ULA_Dashboard() {
  const [data, setData] = useState<UlaInstallationDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);

  // Status drill-down modal
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusModalTitle, setStatusModalTitle] = useState('');
  const [statusModalSites, setStatusModalSites] = useState<any[]>([]);
  const [statusModalLoading, setStatusModalLoading] = useState(false);

  const chartH = useChartHeight(300, 250);
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
  const pick = (...keys: string[]) => {
    for (const k of keys) {
      if (rawApiUla[k] !== undefined && rawApiUla[k] !== null) return n(rawApiUla[k]);
    }
    return 0;
  };

  const rawUla: UlaSummary = useMemo(() => {
    return {
      site_count: pick('site_count', 'total_sites', 'total') || 1,
      structure_complete: pick('structure_complete', 'structure_installed', 'structure_done'),
      structure_pending: pick('structure_pending'),
      structure_verify_pending: pick('structure_verify_pending'),
      structure_verify_approved: pick('structure_verify_approved', 'structure_approved'),
      structure_verify_reject: pick('structure_verify_reject', 'structure_rejected'),
      complete: pick('complete', 'inst_complete', 'installed'),
      pending: pick('pending', 'inst_pending'),
      verify_pending: pick('verify_pending', 'inst_verify_pending'),
      verify_approved: pick('verify_approved', 'inst_verify_approved', 'approved'),
      verify_reject: pick('verify_reject', 'inst_verify_reject', 'rejected'),
      inst_doc_complete: pick('inst_doc_complete', 'doc_complete', 'documents_submitted'),
      inst_doc_pending: pick('inst_doc_pending', 'doc_pending', 'documents_pending'),
      doc_verify_approve: pick('doc_verify_approve', 'doc_verify_approved', 'doc_approved', 'inst_doc_approved'),
      doc_verify_pending: pick('doc_verify_pending', 'doc_pending_approval', 'inst_doc_pending_approval'),
      doc_verify_reject: pick('doc_verify_reject', 'doc_rejected', 'inst_doc_reject'),
      claim50_applicable: pick('claim50_applicable', 'claim_50_applicable'),
      claim50_raised: pick('claim50_raised', 'claim_50_raised'),
      inst_claim50_verify_papprove: pick('inst_claim50_verify_papprove', 'claim50_approved', 'claim_50_approved', 'inst_claim50_approved'),
      inst_claim50_verify_pending: pick('inst_claim50_verify_pending', 'claim50_pending', 'claim_50_pending', 'inst_claim50_pending'),
      inst_claim50_verify_reject: pick('inst_claim50_verify_reject', 'claim50_reject', 'claim_50_reject', 'inst_claim50_rejected'),
      claim30_applicable: pick('claim30_applicable', 'claim_30_applicable'),
      claim30_raised: pick('claim30_raised', 'claim_30_raised'),
      inst_claim30_verify_papprove: pick('inst_claim30_verify_papprove', 'claim30_approved', 'claim_30_approved', 'inst_claim30_approved'),
      inst_claim30_verify_pending: pick('inst_claim30_verify_pending', 'claim30_pending', 'claim_30_pending', 'inst_claim30_pending'),
      inst_claim30_verify_reject: pick('inst_claim30_verify_reject', 'claim30_reject', 'claim_30_reject', 'inst_claim30_rejected'),
      inst_pay50_partially: pick('inst_pay50_partially', 'inst_pay50_partial', 'pay50_partial', 'payment50_partial'),
      inst_pay50_paid: pick('inst_pay50_paid', 'pay50_paid', 'payment50_paid'),
      inst_pay50_pending: pick('inst_pay50_pending', 'pay50_pending', 'payment50_pending'),
      inst_pay30_partially: pick('inst_pay30_partially', 'inst_pay30_partial', 'pay30_partial', 'payment30_partial'),
      inst_pay30_paid: pick('inst_pay30_paid', 'pay30_paid', 'payment30_paid'),
      inst_pay30_pending: pick('inst_pay30_pending', 'pay30_pending', 'payment30_pending'),
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

  // District select hone par KPI us district ke numbers se adjust hote hain
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

  const deferredQuery = useDeferredValue(searchQuery);
  const tableDistricts = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return filteredDistrictRows.filter((d) => !q || (d.district || '').toLowerCase().includes(q));
  }, [filteredDistrictRows, deferredQuery]);

  const { paginatedData: pagedDistricts, currentPage, pageSize, totalItems, setPage, setPageSize } =
    usePagination({ data: tableDistricts, initialPageSize: 10 });

  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedDistrict]);

  /* ───────── Derived Values ───────── */
  const dash = (v: number) => (loading && !data ? '…' : num(v));
  const structPct = pctOf(ula.structure_complete, ula.site_count);
  const instPct = pctOf(ula.complete, ula.site_count);
  const approvedPct = pctOf(ula.verify_approved, ula.site_count);
  const todayTotal = today.reduce((a, t) => a + n(t.today_install), 0);
  const monthTotal = monthly.reduce((a, m) => a + n(m.monthly_installations), 0);

  // Sparklines from district breakdown
  const spk = (pickFn: (d: DistrictRow) => number) => {
    const arr = districtwise.slice(0, 10).map(pickFn);
    return arr.length > 1 ? arr : undefined;
  };

  const chartDistricts = useMemo(
    () => [...filteredDistrictRows].sort((a, b) => n(b.site_count) - n(a.site_count)).slice(0, 15),
    [filteredDistrictRows]
  );

  const stamp = new Date().toISOString().slice(0, 10);

  /* ───────── Drill-down Modal ───────── */
  const handleOpenStatusDrill = async (statusKey: string, title: string) => {
    setStatusModalTitle(title);
    setStatusModalOpen(true);
    setStatusModalLoading(true);
    try {
      let sites = [];
      if (filtersActive) {
        sites = await biharUlaInstallationService.getDashboardSitesByDistrict(statusKey, selectedDistrict);
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

  /* ───────── Export Columns ───────── */
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
    ],
    []
  );
  const exportCols = districtCols.filter((c, i) => !hiddenColumns.includes(`${c.header}-${i}`));

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
    <div className="solar-erp-page ax-page">
      <style>{PAGE_CSS}</style>

      {/* 1. Page Header */}
      <PageHead
        title="Bihar - Installation > ULA > Dashboard"
        subtitle={
          <span style={{ display: 'inline-block', fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>
            Unnat Lok Abhiyan (ULA) solar rooftop installation tracking
            {updatedAt ? ` · last updated ${updatedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase()}` : ''}
          </span>
        }
        breadcrumbs={[{ label: 'Bihar' }, { label: 'Installation' }, { label: 'ULA' }, { label: 'Dashboard' }]}
        actions={
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill" style={{ fontWeight: 600, paddingInline: 'var(--ax-space-3)' }}>
              <span className="ax-badge__dot" /> Districts: {dash(districtwise.length)}
            </span>
            <button type="button" className="ax-btn ax-btn--ghost ax-btn--icon" aria-label="Refresh dashboard" onClick={() => loadDashboardData(true)} disabled={isRefreshing}>
              <span className={isRefreshing ? 'ax-spinner' : ''}>{ICON_REFRESH}</span>
            </button>
            <Link to="/v/bihar/ula-installation-pending-structure-site" className="ax-btn ax-btn--primary ax-btn--sm">
              {ICON_PLUS}
              <span className="ax-btn__label">Add Installation</span>
            </Link>
          </div>
        }
      />

      <div className="ax-dash-grid mt-0 pt-0">
        {apiError && (
          <div className="ax-col--12" style={{ padding: '10px 14px', background: 'color-mix(in oklab, var(--ax-viz-red) 12%, transparent)', color: 'var(--ax-viz-red)', borderRadius: 'var(--ax-radius-md)', fontSize: 'var(--ax-text-xs)' }}>
            <b>Some data could not be loaded.</b> {apiError}{' '}
            <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" onClick={() => loadDashboardData(true)}>Retry</button>
          </div>
        )}

        {/* 2. Operations Filter Bar */}
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

              <div className="ax-cluster ula-filter-item" style={{ gap: '6px', alignItems: 'center' }}>
                <label htmlFor="ula-district-select" style={labelStyle}>District:</label>
                <select
                  id="ula-district-select"
                  className="ax-input ax-input--sm"
                  style={{ height: 30, fontSize: 'var(--ax-text-xs)', paddingInline: '8px' }}
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                >
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

            <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>
                Showing <b style={{ color: 'var(--ax-text-strong)' }}>{dash(ula.site_count)}</b> sites · State: <b style={{ color: 'var(--ax-text-strong)' }}>Bihar</b> · Project: <b style={{ color: 'var(--ax-text-strong)' }}>ULA</b>
              </span>
              <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill" style={{ fontSize: '11px', padding: '2px 8px' }}>BREDA ULA Scheme</span>
            </div>
          </div>
        </section>

        {/* 3. Executive Welcome Banner */}
        <section className="ax-card ax-welcome ax-col--12" role="region" aria-label="Bihar ULA Installation Overview">
          <div className="ax-welcome__body">
            <div className="ax-welcome__text">
              <p className="ax-welcome__eyebrow">ULA Installation Management</p>
              <h2 className="ax-card__title">Welcome to Bihar ULA Installation Dashboard</h2>
              <p className="ax-welcome__lede">
                ULA overview: <b>{dash(ula.site_count)} allocated sites</b> across <b>{dash(filtersActive ? 1 : districtwise.length)} districts</b>.
                <b> {dash(ula.structure_complete)} ({structPct}%)</b> structures erected, <b>{dash(ula.complete)} ({instPct}%)</b> installations complete, with <b>{dash(ula.verify_approved)}</b> approved.
              </p>
            </div>

            <dl className="ax-welcome__stats">
              <div className="ax-welcome__stat">
                <dt>Total Sites</dt>
                <dd className="ax-num">{dash(ula.site_count)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-cyan)' }}>Allocated</small>
              </div>
              <div className="ax-welcome__stat">
                <dt>Structure Done</dt>
                <dd className="ax-num">{dash(ula.structure_complete)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-accent)' }}>{structPct}% of sites</small>
              </div>
              <div className="ax-welcome__stat">
                <dt>Install Done</dt>
                <dd className="ax-num">{dash(ula.complete)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-emerald)' }}>{instPct}% of sites</small>
              </div>
              <div className="ax-welcome__stat">
                <dt>Approved</dt>
                <dd className="ax-num">{dash(ula.verify_approved)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-emerald)' }}>{approvedPct}% of sites</small>
              </div>
            </dl>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            4. THE 13 EXACT DLE-STYLE KPI CARDS
            ══════════════════════════════════════════════════════════════ */}
        <div className="ax-col--12">
          <div className="ax-cluster" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={sectionHeadStyle}>ULA Operational Metrics & Approval Status</h4>
            <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>Click card to inspect matching sites</span>
          </div>
        </div>

        {/* 1. Total Sites */}
        <KpiCard
          icon={I_PIN}
          tone="accent"
          label="Total Sites"
          value={loading && !data ? '…' : `${ula.site_count}`}
          sub="Allocated Sites"
          badge="Allocated"
          spark={spk((d) => n(d.site_count))}
          onClick={drill('total', 'Total Allocated Sites')}
        />

        {/* 2. Structure Status: Installed / Pending */}
        <KpiCard
          icon={I_BOLT}
          tone="cyan"
          label="Structure Status"
          value={loading && !data ? '…' : `${ula.structure_complete} / ${ula.structure_pending}`}
          sub="Installed / Pending"
          badge={`${structPct}% Done`}
          spark={spk((d) => n(d.structure_complete))}
          sparkType="bar"
          onClick={drill('structure_complete', 'Structure Completed Sites')}
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
          sparkType="bar"
          onClick={drill('structure_verify_approved', 'Structure Approved Sites')}
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
          sparkType="area"
          onClick={drill('complete', 'Installation Completed Sites')}
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
          sparkType="area"
          onClick={drill('verify_approved', 'Installation Approved Sites')}
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
          sparkType="bar"
          onClick={drill('doc_complete', 'Documents Submitted Sites')}
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
          sparkType="bar"
          onClick={drill('doc_approved', 'Documents Approved Sites')}
        />

        {/* 8. Claim 50% Status: Applicable / Raised */}
        <KpiCard
          icon={I_LIST}
          tone="amber"
          label="Claim 50% Status"
          value={loading && !data ? '…' : `${ula.claim50_applicable} / ${ula.claim50_raised}`}
          sub="Applicable / Raised"
          badge={ula.claim50_raised > 0 ? `${ula.claim50_raised} Raised` : undefined}
          onClick={drill('claim50_raised', '50% Claim Raised Sites')}
        />

        {/* 9. Claim 50% Approval: Approved / Pending / Rejected */}
        <KpiCard
          icon={I_DONE}
          tone="emerald"
          label="Claim 50% Approval"
          value={loading && !data ? '…' : `${ula.inst_claim50_verify_papprove} / ${ula.inst_claim50_verify_pending} / ${ula.inst_claim50_verify_reject}`}
          sub="Approved / Pending / Rejected"
          badge={ula.inst_claim50_verify_papprove > 0 ? 'Approved' : undefined}
          onClick={drill('claim50_approved', '50% Claim Approved Sites')}
        />

        {/* 10. Claim 30% Status: Applicable / Raised */}
        <KpiCard
          icon={I_LIST}
          tone="amber"
          label="Claim 30% Status"
          value={loading && !data ? '…' : `${ula.claim30_applicable} / ${ula.claim30_raised}`}
          sub="Applicable / Raised"
          badge={ula.claim30_raised > 0 ? `${ula.claim30_raised} Raised` : undefined}
          onClick={drill('claim30_raised', '30% Claim Raised Sites')}
        />

        {/* 11. Claim 30% Approval: Approved / Pending / Rejected */}
        <KpiCard
          icon={I_DONE}
          tone="emerald"
          label="Claim 30% Approval"
          value={loading && !data ? '…' : `${ula.inst_claim30_verify_papprove} / ${ula.inst_claim30_verify_pending} / ${ula.inst_claim30_verify_reject}`}
          sub="Approved / Pending / Rejected"
          badge={ula.inst_claim30_verify_papprove > 0 ? 'Approved' : undefined}
          onClick={drill('claim30_approved', '30% Claim Approved Sites')}
        />

        {/* 12. Payment 50% Status: Partially Paid / Paid / Pending */}
        <KpiCard
          icon={I_COIN}
          tone="cyan"
          label="Payment 50% Status"
          value={loading && !data ? '…' : `${ula.inst_pay50_partially} / ${ula.inst_pay50_paid} / ${ula.inst_pay50_pending}`}
          sub="Partially Paid / Paid / Pending"
          badge={ula.inst_pay50_paid > 0 ? 'Disbursed' : undefined}
          onClick={drill('pay50_paid', '50% Payment Completed Sites')}
        />

        {/* 13. Payment 30% Status: Partially Paid / Paid / Pending */}
        <KpiCard
          icon={I_COIN}
          tone="amber"
          label="Payment 30% Status"
          value={loading && !data ? '…' : `${ula.inst_pay30_partially} / ${ula.inst_pay30_paid} / ${ula.inst_pay30_pending}`}
          sub="Partially Paid / Paid / Pending"
          badge={ula.inst_pay30_paid > 0 ? 'Disbursed' : undefined}
          onClick={drill('pay30_paid', '30% Payment Completed Sites')}
        />

        {/* 5. Monthly trend + Installation status donut */}
        <section className="ax-card ax-card--chart ax-col--8" role="region" aria-label="Monthly installation trend">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Installation Progress</span>
              <h2 className="ax-card__title">Monthly Installation Trend</h2>
              <p className="ax-card__subtitle">{num(monthTotal)} installations across {monthly.length} month{monthly.length === 1 ? '' : 's'} · {num(todayTotal)} today</p>
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
                    stroke: { curve: 'smooth', width: 1.5 },
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
              <span className="ax-card__eyebrow">Site Distribution</span>
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
                    pie: { donut: { size: '72%', labels: { show: true, total: { show: true, label: 'Sites', formatter: () => num(ula.site_count) } } } },
                  },
                }}
              />
            </Suspense>
            <ul className="ax-list ax-list--compact" style={{ marginTop: 'var(--ax-space-3)' }}>
              {[
                { label: 'Approved', v: ula.verify_approved, color: LIGHT_GREEN },
                { label: 'Verify Pending', v: ula.verify_pending, color: LIGHT_BLUE },
                { label: 'Rejected', v: ula.verify_reject, color: '#ef6a6a' },
                { label: 'Install Pending', v: ula.pending, color: LIGHT_AMBER },
              ].map((s) => (
                <li key={s.label} className="ax-list__row" style={{ border: 0, paddingInline: 0 }}>
                  <span className="ax-list__leading"><i style={{ width: 9, height: 9, borderRadius: 3, background: s.color, display: 'inline-block' }} /></span>
                  <span className="ax-list__content"><span className="ax-list__title" style={{ fontWeight: 'var(--ax-weight-medium)' }}>{s.label}</span></span>
                  <span className="ax-list__trailing ax-num" style={{ color: 'var(--ax-text-strong)', fontWeight: 600 }}>{num(s.v)} ({pctOf(s.v, ula.site_count)}%)</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 6. District Chart & Milestones */}
        <section className="ax-card ax-card--chart ax-col--8" role="region" aria-label="District wise progress">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Geographic Breakdown</span>
              <h2 className="ax-card__title">District Wise Progress</h2>
              <p className="ax-card__subtitle">Top 15 districts by allocated sites · full list below</p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)' }}>
                {[{ l: 'Total', c: LIGHT_BLUE }, { l: 'Structure', c: LIGHT_AMBER }, { l: 'Installed', c: LIGHT_GREEN }].map((i) => (
                  <span key={i.l} className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}>
                    <i style={{ width: 10, height: 10, borderRadius: 2, background: i.c }} />
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
                  key={`dist-${chartH}-${chartDistricts.map((d) => `${d.district}${d.site_count}${d.structure_complete}${d.inst_complete}`).join('-')}`}
                  type="bar"
                  height={chartH}
                  legend="none"
                  ariaLabel="District wise progress"
                  series={[
                    { name: 'Total Sites', data: chartDistricts.map((d) => n(d.site_count)) },
                    { name: 'Structure Done', data: chartDistricts.map((d) => n(d.structure_complete)) },
                    { name: 'Installed', data: chartDistricts.map((d) => n(d.inst_complete)) },
                  ]}
                  apex={{
                    colors: [LIGHT_BLUE, LIGHT_AMBER, LIGHT_GREEN],
                    plotOptions: { bar: { horizontal: false, borderRadius: 4, columnWidth: '40%' } },
                    dataLabels: { enabled: false },
                    xaxis: { categories: chartDistricts.map((d) => d.district), labels: { style: { fontSize: '11px' }, rotate: -35 } },
                    yaxis: { min: 0, forceNiceScale: true, labels: { formatter: (v: number) => `${Math.round(v)}` }, title: { text: 'Sites (Nos.)', style: { color: 'var(--ax-text-muted)' } } },
                    chart: {
                      events: {
                        dataPointSelection: (_e: unknown, _c: unknown, opts: any) => {
                          const d = chartDistricts[opts?.dataPointIndex];
                          if (d) setSelectedDistrict(d.district);
                        },
                      },
                    },
                  }}
                />
              </Suspense>
            ) : (
              <TableEmptyState title="No district data" message="District progress appears once sites are allocated." />
            )}
          </div>
        </section>

        <section className="ax-card ax-col--4" role="region" aria-label="ULA milestones">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Workflow Lifecycle</span>
              <h2 className="ax-card__title">ULA Milestones</h2>
              <p className="ax-card__subtitle">Progress from allocation to documents</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0, display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-4)' }}>
            {milestones.map((m) => <ProgressRow key={m.label} {...m} />)}
          </div>
        </section>

        {/* 7. District Table + Today's Activity */}
        <section className="ax-card ax-col--8" role="region" aria-label="District wise installation breakdown">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Geographic Detail</span>
              <h2 className="ax-card__title">District Wise Installation Breakdown</h2>
              <p className="ax-card__subtitle">Structure, installation, verification and documents per district</p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', width: '100%' }}>
                <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search district…" ariaLabel="Search districts" />
                <TableExportToolbar
                  onCopy={() => copyTableDataToClipboard(tableDistricts, exportCols)}
                  onExportCSV={() => exportDataToCSV(tableDistricts, exportCols, `bihar_ula_districtwise_${stamp}.csv`)}
                  onExportExcel={() => exportDataToExcel(tableDistricts, exportCols, `bihar_ula_districtwise_${stamp}.xlsx`)}
                  onPrint={() => printTableData(tableDistricts, exportCols, 'Bihar ULA Installation District Breakdown')}
                />
              </div>
            </div>
          </div>

          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <div className="ax-table-wrap">
              <table className="ax-table ax-table--hover" aria-label="District wise installation counts">
                <thead>
                  <tr>
                    <th>District</th>
                    <th style={{ textAlign: 'right' }}>Total Sites</th>
                    <th style={{ textAlign: 'right' }}>Structure Done</th>
                    <th style={{ textAlign: 'right' }}>Structure Pending</th>
                    <th style={{ textAlign: 'right' }}>Install Done</th>
                    <th style={{ textAlign: 'right' }}>Install Pending</th>
                    <th style={{ textAlign: 'right' }}>Approved</th>
                    <th style={{ textAlign: 'right' }}>Verify Pending</th>
                    <th style={{ textAlign: 'right' }}>Verify Rejected</th>
                    <th style={{ textAlign: 'right' }}>Doc Complete</th>
                    <th style={{ textAlign: 'right' }}>Doc Pending</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && !data ? (
                    <tr><td colSpan={11} style={{ textAlign: 'center', padding: 'var(--ax-space-6)' }}><span className="ax-spinner" /> Loading district records…</td></tr>
                  ) : pagedDistricts.length === 0 ? (
                    <tr><td colSpan={11}><TableEmptyState title="No district records" message="Try resetting your search query or filter." /></td></tr>
                  ) : (
                    pagedDistricts.map((d) => (
                      <tr key={d.district} style={{ cursor: 'pointer' }} onClick={() => setSelectedDistrict(d.district)}>
                        <td style={{ fontWeight: 600 }}>{d.district}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{num(d.site_count)}</td>
                        <td style={{ textAlign: 'right' }}><span className="ax-badge ax-badge--soft ax-badge--info">{num(d.structure_complete)}</span></td>
                        <td style={{ textAlign: 'right' }}><span className="ax-badge ax-badge--soft ax-badge--warning">{num(d.structure_pending)}</span></td>
                        <td style={{ textAlign: 'right' }}><span className="ax-badge ax-badge--soft ax-badge--success">{num(d.inst_complete)}</span></td>
                        <td style={{ textAlign: 'right' }}><span className="ax-badge ax-badge--soft ax-badge--warning">{num(d.inst_pending)}</span></td>
                        <td style={{ textAlign: 'right' }}><span className="ax-badge ax-badge--soft ax-badge--success">{num(d.verify_approved)}</span></td>
                        <td style={{ textAlign: 'right' }}><span className="ax-badge ax-badge--soft ax-badge--warning">{num(d.verify_pending)}</span></td>
                        <td style={{ textAlign: 'right' }}><span className="ax-badge ax-badge--soft ax-badge--danger">{num(d.verify_reject)}</span></td>
                        <td style={{ textAlign: 'right' }}>{num(d.inst_doc_complete)}</td>
                        <td style={{ textAlign: 'right' }}>{num(d.inst_doc_pending)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="ax-card__footer" style={{ borderTop: '1px solid var(--ax-border, #e2e8f0)', padding: 'var(--ax-space-3) var(--ax-space-4)' }}>
            <div className="ula-pagination-left">
              <Pagination
                currentPage={currentPage}
                totalCount={tableDistricts.length}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              />
            </div>
          </div>
        </section>

        {/* 8. Today's Installation Activity */}
        <section className="ax-card ax-col--4" role="region" aria-label="Today's installations">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Realtime Execution</span>
              <h2 className="ax-card__title">Today's Activity</h2>
              <p className="ax-card__subtitle">{todayTotal} installations logged today</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0, maxHeight: 380, overflowY: 'auto' }}>
            {today.length > 0 ? (
              <ul className="ax-list ax-list--hover">
                {today.map((t, idx) => (
                  <li key={idx} className="ax-list__row">
                    <span className="ax-list__leading">
                      <span className="ax-badge ax-badge--soft ax-badge--info ax-badge--pill" style={{ width: 28, height: 28, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        {idx + 1}
                      </span>
                    </span>
                    <span className="ax-list__content">
                      <span className="ax-list__title" style={{ fontWeight: 600 }}>{t.name || `Vendor #${t.inst_vendor}`}</span>
                      <span className="ax-list__subtitle">Installation Partner</span>
                    </span>
                    <span className="ax-list__trailing">
                      <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill">+{t.today_install} Sites</span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div style={{ textAlign: 'center', padding: 'var(--ax-space-6) 0', color: 'var(--ax-text-muted)' }}>
                <p style={{ margin: 0, fontSize: 'var(--ax-text-sm)' }}>No installations reported today yet.</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* ── Status Drill-Down Modal ── */}
      {statusModalOpen && (
        <div className="ax-modal-backdrop" onClick={() => setStatusModalOpen(false)}>
          <div className="ax-modal" style={{ maxWidth: 850 }} onClick={(e) => e.stopPropagation()}>
            <div className="ax-modal__header">
              <div>
                <h4 className="ax-modal__title">{statusModalTitle}</h4>
                <p style={{ margin: 0, fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
                  {filtersActive ? `District: ${selectedDistrict}` : 'State: Bihar'} · Total {statusModalSites.length} site{statusModalSites.length === 1 ? '' : 's'}
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
