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
import { biharAdminService } from '../../bihar-services/biharAdminService';

// Code-split ApexCharts so the dashboard shell renders instantly
const ApexChart = lazy(() => import('../../../../charts/ApexChart').then((m) => ({ default: m.ApexChart })));

const LIGHT_BLUE = '#2563eb';
const LIGHT_GREEN = '#10b981';
const LIGHT_CYAN = '#0891b2';
const LIGHT_AMBER = '#f59e0b';
const LIGHT_VIOLET = '#7c3aed';
const LIGHT_RED = '#ef4444';

const BASE = '/vendor-management/bihar/ssl/installation';

const num = (x: number) => (x ?? 0).toLocaleString('en-IN');
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
  .solar-erp-page .ax-welcome__lede { max-width: 820px; }

  .solar-erp-page .asw-filter-item { display: flex; align-items: center; gap: 6px; }
  .solar-erp-page .asw-filter-item select { width: 165px; }

  .asw-interactive-kpi { cursor: pointer; transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease; }
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

/* ───────── Icons ───────── */
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
const ICON_FILTER = (
  <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 4h16v2.172a2 2 0 0 1 -.586 1.414l-4.828 4.828v7.586l-4 -2v-5.586l-4.828 -4.828a2 2 0 0 1 -.586 -1.414v-2.172z" /></svg>
);

/* ───────── KPI Card ───────── */
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
      style={{ borderRadius: 'var(--ax-radius-lg, 12px)', background: 'var(--ax-bg-surface, #ffffff)', border: '1px solid var(--ax-border, #e2e8f0)' }}
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
            <span className="ax-kpi__delta ax-kpi__delta--up" style={{ fontSize: '11px', padding: '1px 6px', flexShrink: 0 }}>{badge}</span>
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

const actionsRowStyle = { gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', width: '100%' } as const;
const labelStyle = { fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)', fontWeight: 500 } as const;
const footerStyle = { borderTop: '1px solid var(--ax-border, #e2e8f0)', padding: 'var(--ax-space-3) var(--ax-space-4)' } as const;

/* ───────── Export helpers ───────── */
const getExportValue = <T,>(row: T, column: ExportColumn<T>) =>
  typeof column.accessor === 'function'
    ? (column.accessor as any)(row)
    : (row as Record<string, unknown>)[column.accessor as string];
const str = (v: unknown) => String(v ?? '');

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
  const out = [columns.map((c) => c.header), ...list.map((row) => columns.map((c) => str(getExportValue(row, c))))];
  const csv = out.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
  downloadTextFile(`\ufeff${csv}`, `${filename}.csv`, 'text/csv');
};

const copyToClipboard = async <T,>(list: T[], columns: ExportColumn<T>[]) => {
  if (!list.length || !columns.length) return;
  const t = [
    columns.map((c) => c.header).join('\t'),
    ...list.map((row) => columns.map((c) => str(getExportValue(row, c))).join('\t')),
  ].join('\n');
  try {
    await navigator.clipboard.writeText(t);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = t;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
  alert('Data copied to clipboard!');
};

const exportToExcel = <T,>(list: T[], columns: ExportColumn<T>[], filename: string) => {
  if (!list.length || !columns.length) return;
  const tableHtml = `<table border="1"><thead><tr>${columns.map((c) => `<th>${escapeHtml(str(c.header))}</th>`).join('')}</tr></thead><tbody>${list.map((row) => `<tr>${columns.map((c) => `<td>${escapeHtml(str(getExportValue(row, c)))}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8" /></head><body>${tableHtml}</body></html>`;
  downloadTextFile(`\ufeff${html}`, `${filename}.xls`, 'application/vnd.ms-excel');
};

const exportToPDF = <T,>(list: T[], columns: ExportColumn<T>[], title: string) => {
  if (!list.length || !columns.length) return;
  const body = list.map((row) => columns.map((c) => escapeHtml(str(getExportValue(row, c)))));
  const w = window.open('', '_blank', 'width=1200,height=800');
  if (!w) return;
  w.document.write(`<!doctype html><html><head><meta charset="UTF-8" /><title>${escapeHtml(title)}</title><style>
    *{box-sizing:border-box}body{font-family:Arial,sans-serif;padding:24px;color:#222}h1{font-size:20px;margin:0 0 16px}
    table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #d8dee6;padding:6px 8px;text-align:left;vertical-align:top}
    th{background:#f3f5f7;font-weight:700}@media print{body{padding:0}@page{size:landscape;margin:10mm}}
  </style></head><body><h1>${escapeHtml(title)}</h1><table><thead><tr>${columns.map((c) => `<th>${escapeHtml(str(c.header))}</th>`).join('')}</tr></thead><tbody>${body.map((r) => `<tr>${r.map((v) => `<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table><script>window.onload=function(){window.print();};</script></body></html>`);
  w.document.close();
  w.focus();
};

/* ───────── Types ───────── */
export interface DistrictSSLStat {
  district: string;
  volume: string;
  totalLights: number;
  completed: number;
  pending: number;
  approved: number;
  rejected: number;
}

export interface VendorSSLStat {
  vendor: string;
  volume: string;
  assignedLights: number;
  completed: number;
  pending: number;
  approved: number;
  rejected: number;
}

const EMPTY_STATS = {
  totalLights: 0,
  completeLights: 0,
  pendingLights: 0,
  approveLights: 0,
  rejectLights: 0,
  verifyPending: 0,
  claimApplicable: 0,
  paymentDone: 0,
};

const toList = (val: any, nested: string[]): any[] => {
  if (Array.isArray(val)) return val;
  if (Array.isArray(val?.data)) return val.data;
  for (const k of nested) {
    if (Array.isArray(val?.data?.[k])) return val.data[k];
    if (Array.isArray(val?.[k])) return val[k];
  }
  return [];
};
const lightCount = (a: any) => Number(a.site_count) || Number(a.light_count) || 1;
const isApproved = (i: any) => i.verify_status === 'Approved' || i.status === 'Approved' || i.verification_status === 1;
const isRejected = (i: any) => i.verify_status === 'Rejected' || i.status === 'Rejected' || i.verification_status === 2;

export function BiharSSLInstallationDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const [rawStats, setRawStats] = useState(EMPTY_STATS);
  const [districtData, setDistrictData] = useState<DistrictSSLStat[]>([]);
  const [vendorData, setVendorData] = useState<VendorSSLStat[]>([]);

  // Filters
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [tableQuery, setTableQuery] = useState<string>('');
  const [vendorTableQuery, setVendorTableQuery] = useState<string>('');

  const chartH = useChartHeight(320, 260);
  const donutH = useChartHeight(230, 210);

  // 1. Load dashboard data (live API only)
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const [assignRes, installRes, claimsRes, paymentsRes] = await Promise.allSettled([
        biharAdminService.getViewAssignSsl(),
        biharAdminService.getViewSslInstallation(),
        biharAdminService.getViewSslClaims(),
        biharAdminService.getViewSslPayments(),
      ]);

      const rawAssigns: any[] = assignRes.status === 'fulfilled' && assignRes.value
        ? toList(assignRes.value, ['assigned'])
        : [];
      const rawInstalls: any[] = installRes.status === 'fulfilled' && installRes.value
        ? toList(installRes.value, ['verification'])
        : [];

      let total = rawAssigns.reduce((sum, a) => sum + lightCount(a), 0);
      let completed = rawInstalls.length;
      let approved = rawInstalls.filter(isApproved).length;
      let rejected = rawInstalls.filter(isRejected).length;
      let vPending = completed - (approved + rejected);
      let claimApp = 0;
      let payDone = 0;

      if (claimsRes.status === 'fulfilled' && claimsRes.value) {
        claimApp = toList(claimsRes.value, []).length;
      }
      if (paymentsRes.status === 'fulfilled' && paymentsRes.value) {
        payDone = toList(paymentsRes.value, []).filter((p: any) => p.status === 'Processed' || p.status === 'Success' || p.status === 1).length;
      }

      // Root stats object (if API returns summary directly)
      if (installRes.status === 'fulfilled') {
        const d: any = (installRes.value as any)?.data;
        if (d && !Array.isArray(d) && typeof d === 'object') {
          if (d.totalsite || d.totalLights) total = Number(d.totalsite || d.totalLights);
          if (d.complete || d.completeLights) completed = Number(d.complete || d.completeLights);
          if (d.approvedsite || d.approveLights) approved = Number(d.approvedsite || d.approveLights);
          if (d.rejectsite || d.rejectLights) rejected = Number(d.rejectsite || d.rejectLights);
          if (d.verifypending) vPending = Number(d.verifypending);
          if (d.claimedapplicable) claimApp = Number(d.claimedapplicable);
          if (d.paymentsitecount) payDone = Number(d.paymentsitecount);
        }
      }

      if (assignRes.status === 'rejected' && installRes.status === 'rejected') {
        setApiError((installRes.reason as any)?.message || 'Failed to load SSL installation data');
      }

      setRawStats({
        totalLights: total,
        completeLights: completed,
        pendingLights: Math.max(0, total - completed),
        approveLights: approved,
        rejectLights: rejected,
        verifyPending: Math.max(0, vPending),
        claimApplicable: claimApp,
        paymentDone: payDone,
      });

      // District aggregation
      const dMap = new Map<string, DistrictSSLStat>();
      rawAssigns.forEach((a) => {
        const dist = a.district || 'Unknown';
        const cur = dMap.get(dist) || { district: dist, volume: a.volume || '-', totalLights: 0, completed: 0, pending: 0, approved: 0, rejected: 0 };
        const cnt = lightCount(a);
        cur.totalLights += cnt;
        cur.pending += cnt;
        dMap.set(dist, cur);
      });
      rawInstalls.forEach((i) => {
        const dist = i.district || 'Unknown';
        const cur = dMap.get(dist) || { district: dist, volume: i.volume || '-', totalLights: 1, completed: 0, pending: 1, approved: 0, rejected: 0 };
        cur.completed += 1;
        if (isApproved(i)) cur.approved += 1;
        else if (isRejected(i)) cur.rejected += 1;
        cur.pending = Math.max(0, cur.totalLights - cur.completed);
        dMap.set(dist, cur);
      });
      setDistrictData(Array.from(dMap.values()));

      // Vendor aggregation
      const vMap = new Map<string, VendorSSLStat>();
      rawAssigns.forEach((a) => {
        const v = a.vendor || a.vendor_name || 'Unknown Vendor';
        const cur = vMap.get(v) || { vendor: v, volume: a.volume || '-', assignedLights: 0, completed: 0, pending: 0, approved: 0, rejected: 0 };
        const cnt = lightCount(a);
        cur.assignedLights += cnt;
        cur.pending += cnt;
        vMap.set(v, cur);
      });
      setVendorData(Array.from(vMap.values()));

      setUpdatedAt(new Date());
    } catch (err: any) {
      console.error('[Bihar SSL Installation Dashboard] Error:', err);
      setApiError(err?.message || 'Failed to fetch live SSL installation analytics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const districtOptions = useMemo(
    () => [...new Set(districtData.map((d) => d.district).filter(Boolean))].sort(),
    [districtData]
  );

  const filteredDistricts = useMemo(() => {
    return districtData.filter((d) => {
      const matchDistrict = selectedDistrict === 'All' || d.district.toLowerCase() === selectedDistrict.toLowerCase();
      let matchStatus = true;
      if (selectedStatus === 'Complete') matchStatus = d.completed > 0;
      else if (selectedStatus === 'Pending') matchStatus = d.pending > 0;
      else if (selectedStatus === 'Approved') matchStatus = d.approved > 0;
      else if (selectedStatus === 'Rejected') matchStatus = d.rejected > 0;
      return matchDistrict && matchStatus;
    });
  }, [districtData, selectedDistrict, selectedStatus]);

  const filtersActive = selectedDistrict !== 'All' || selectedStatus !== 'All';

  // Light counts follow filtered districts; claim/payment stay state level
  const stats = useMemo(() => {
    if (!filtersActive) return rawStats;
    const sum = filteredDistricts.reduce(
      (a, d) => ({
        totalLights: a.totalLights + d.totalLights,
        completeLights: a.completeLights + d.completed,
        pendingLights: a.pendingLights + d.pending,
        approveLights: a.approveLights + d.approved,
        rejectLights: a.rejectLights + d.rejected,
      }),
      { totalLights: 0, completeLights: 0, pendingLights: 0, approveLights: 0, rejectLights: 0 }
    );
    return {
      ...rawStats,
      ...sum,
      verifyPending: Math.max(0, sum.completeLights - sum.approveLights - sum.rejectLights),
    };
  }, [rawStats, filteredDistricts, filtersActive]);

  // District table
  const deferredQuery = useDeferredValue(tableQuery);
  const tableDistricts = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return filteredDistricts.filter((d) => !q || d.district.toLowerCase().includes(q) || d.volume.toLowerCase().includes(q));
  }, [filteredDistricts, deferredQuery]);

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

  // Vendor table
  const deferredVendorQuery = useDeferredValue(vendorTableQuery);
  const tableVendors = useMemo(() => {
    const q = deferredVendorQuery.trim().toLowerCase();
    return vendorData.filter((v) => !q || v.vendor.toLowerCase().includes(q) || v.volume.toLowerCase().includes(q));
  }, [vendorData, deferredVendorQuery]);

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

  // Percentages
  const pctComplete = pctOf(stats.completeLights, stats.totalLights);
  const pctPending = pctOf(stats.pendingLights, stats.totalLights);
  const pctApproved = pctOf(stats.approveLights, stats.completeLights || 1);
  const pctClaim = pctOf(stats.claimApplicable, stats.completeLights || 1);
  const pctPaid = pctOf(stats.paymentDone, stats.completeLights || 1);

  const milestones = [
    { label: '1. Allocated Street Lights', v: stats.totalLights, of: stats.totalLights || 1, color: LIGHT_BLUE },
    { label: '2. Lights Installed', v: stats.completeLights, of: stats.totalLights || 1, color: LIGHT_GREEN },
    { label: '3. Verification Approved', v: stats.approveLights, of: stats.completeLights || stats.totalLights || 1, color: LIGHT_CYAN },
    { label: '4. Claims Applicable', v: stats.claimApplicable, of: stats.completeLights || stats.totalLights || 1, color: LIGHT_VIOLET },
    { label: '5. Payment Done', v: stats.paymentDone, of: stats.completeLights || stats.totalLights || 1, color: LIGHT_AMBER },
  ];

  const chartDistricts = useMemo(
    () => [...filteredDistricts].sort((a, b) => b.completed - a.completed).slice(0, 15),
    [filteredDistricts]
  );

  const sp = (fn: (d: DistrictSSLStat) => number) =>
    filteredDistricts.length > 1 ? filteredDistricts.slice(0, 10).map(fn) : undefined;
  const totalSpark = sp((d) => d.totalLights);
  const completeSpark = sp((d) => d.completed);
  const pendingSpark = sp((d) => d.pending);
  const approvedSpark = sp((d) => d.approved);
  const execRateSpark = sp((d) => pctOf(d.completed, d.totalLights));
  const auditPassSpark = sp((d) => pctOf(d.approved, d.approved + d.rejected || 1));

  const districtCols: ExportColumn<DistrictSSLStat>[] = useMemo(() => [
    { header: 'District', accessor: 'district' },
    { header: 'Volume', accessor: 'volume' },
    { header: 'Total Lights', accessor: 'totalLights' },
    { header: 'Completed', accessor: 'completed' },
    { header: 'Pending', accessor: 'pending' },
    { header: 'Approved', accessor: 'approved' },
    { header: 'Rejected', accessor: 'rejected' },
  ], []);

  const vendorCols: ExportColumn<VendorSSLStat>[] = useMemo(() => [
    { header: 'Vendor Name', accessor: 'vendor' },
    { header: 'Volume', accessor: 'volume' },
    { header: 'Assigned Lights', accessor: 'assignedLights' },
    { header: 'Completed', accessor: 'completed' },
    { header: 'Pending', accessor: 'pending' },
    { header: 'Approved', accessor: 'approved' },
    { header: 'Rejected', accessor: 'rejected' },
  ], []);

  const stamp = new Date().toISOString().slice(0, 10);
  const distFileBase = 'Bihar_SSL_District_Summary';
  const distFileTitle = 'Bihar SSL District & Volume Installation Summary';
  const vendorFileBase = 'Bihar_SSL_Vendor_Performance';
  const vendorFileTitle = 'Bihar SSL Vendor Allotment & Performance';

  const go = (path: string) => navigate(`${BASE}/${path}`);

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      {/* 1. Page Header */}
      <PageHead
        title="Bihar SSL Installation Dashboard"
        subtitle={
          <span style={{ display: 'inline-block', fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>
            Solar Street Light (SSL) Operations, District Analysis & Execution Throughput
            {updatedAt ? ` · Last updated ${updatedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}` : ''}
          </span>
        }
        breadcrumbs={[
          { label: 'ERP Dashboard', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Bihar' },
          { label: 'Installation' },
          { label: 'SSL' },
          { label: 'Dashboard' },
        ]}
        actions={
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill" style={{ fontWeight: 600, paddingInline: 'var(--ax-space-3)' }}>
              <span className="ax-badge__dot" /> State: Bihar
            </span>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={loadDashboardData} disabled={loading}>
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
            <Link to={`${BASE}/view-assign`} className="ax-btn ax-btn--secondary ax-btn--sm">
              Assigned Lights
            </Link>
            <Link to={`${BASE}/verify`} className="ax-btn ax-btn--secondary ax-btn--sm">
              Verify Lights
            </Link>
            <Link to={`${BASE}/assign`} className="ax-btn ax-btn--primary ax-btn--sm">
              <span className="ax-btn__label">+ Assign Light</span>
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

        {/* 2. Filter Bar */}
        <section
          className="ax-card ax-card--flat ax-col--12"
          role="region"
          aria-label="Bihar SSL Dashboard Filters"
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
                <label htmlFor="ssl-district-select" style={labelStyle}>District:</label>
                <select
                  id="ssl-district-select"
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
                <label htmlFor="ssl-status-select" style={labelStyle}>Status:</label>
                <select
                  id="ssl-status-select"
                  className="ax-input ax-input--sm"
                  style={{ height: 30, fontSize: 'var(--ax-text-xs)', paddingInline: '8px' }}
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="All">All Operations</option>
                  <option value="Complete">Installed Lights</option>
                  <option value="Pending">Pending Installation</option>
                  <option value="Approved">Verify Approved</option>
                  <option value="Rejected">Verification Rejected</option>
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
                Showing <b style={{ color: 'var(--ax-text-strong)' }}>{num(stats.totalLights)}</b> Total Lights across <b style={{ color: 'var(--ax-text-strong)' }}>{filteredDistricts.length}</b> {filteredDistricts.length === 1 ? 'District' : 'Districts'}
              </span>
            </div>
          </div>

          <div className="ax-cluster" style={{ gap: 6, flexWrap: 'wrap', width: '100%', marginTop: 8, paddingTop: 8, borderTop: '1px dashed var(--ax-border, #e2e8f0)' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ax-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Quick Filter:</span>
            {[
              { key: 'All', label: 'All Operations' },
              { key: 'Complete', label: 'Installed' },
              { key: 'Pending', label: 'Pending' },
              { key: 'Approved', label: 'Verify Approved' },
              { key: 'Rejected', label: 'Rejected' },
            ].map((p) => {
              const isActive = selectedStatus === p.key;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setSelectedStatus(p.key)}
                  className={`ax-btn ax-btn--xs ${isActive ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
                  style={{ height: 24, fontSize: '11px', padding: '0 8px', borderRadius: 12, fontWeight: isActive ? 700 : 500 }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* 3. Welcome Banner */}
        <section className="ax-card ax-welcome ax-col--12" role="region" aria-label="Bihar SSL Operations Overview">
          <div className="ax-welcome__body">
            <div className="ax-welcome__text">
              <p className="ax-welcome__eyebrow">Bihar Solar Street Light System</p>
              <h2 className="ax-card__title">Welcome to Bihar SSL Installation Dashboard</h2>
              <p className="ax-welcome__lede">
                {selectedDistrict !== 'All' ? (
                  <>
                    Bihar SSL execution overview for <b>{selectedDistrict}</b>: <b>{num(stats.totalLights)} street lights</b> allocated.
                    <b> {num(stats.completeLights)} ({pctComplete}%)</b> installed, with <b>{num(stats.approveLights)}</b> verified approved, <b>{num(stats.claimApplicable)}</b> claims applicable, and <b>{num(stats.paymentDone)}</b> payment settlements.
                  </>
                ) : (
                  <>
                    Bihar SSL execution overview: <b>{num(stats.totalLights)} street lights</b> allocated across <b>{districtOptions.length} districts</b>.
                    <b> {num(stats.completeLights)} ({pctComplete}%)</b> installed, with <b>{num(stats.approveLights)}</b> verified approved, <b>{num(stats.claimApplicable)}</b> claims applicable, and <b>{num(stats.paymentDone)}</b> payment settlements.
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
                  {selectedDistrict !== 'All' ? 'Active Filter Scope' : 'Bihar Operational Scope'}
                </small>
              </div>
              <div className="ax-welcome__stat">
                <dt>Allocated Lights</dt>
                <dd className="ax-num">{num(stats.totalLights)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--asw-primary)' }}>Scope across Bihar</small>
              </div>
              <div className="ax-welcome__stat">
                <dt>Installed Lights</dt>
                <dd className="ax-num">{num(stats.completeLights)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-emerald, #10b981)' }}>{pctComplete}% Complete</small>
              </div>
              <div className="ax-welcome__stat">
                <dt>Verify Approved</dt>
                <dd className="ax-num">{num(stats.approveLights)}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-amber, #f59e0b)' }}>{num(stats.verifyPending)} In Audit</small>
              </div>
            </dl>
          </div>
        </section>

        {/* 4. Core KPI Cards */}
        <KpiCard icon={I_PIN} tone="accent" label="Total Assigned Lights" value={num(stats.totalLights)} unit="Lights" sub="Scope across Bihar" spark={totalSpark} onClick={() => go('view-assign')} />
        <KpiCard icon={I_DONE} tone="emerald" label="Complete Lights" value={num(stats.completeLights)} unit="Lights" sub="Installed & glowing" badge={`${pctComplete}%`} spark={completeSpark} onClick={() => go('verify')} />
        <KpiCard icon={I_CLOCK} tone="amber" label="Pending Installation" value={num(stats.pendingLights)} unit="Lights" sub="In progress at field" badge={`${pctPending}%`} spark={pendingSpark} onClick={() => go('view-assign')} />
        <KpiCard icon={I_SHIELD} tone="cyan" label="Approve Lights" value={num(stats.approveLights)} unit="Lights" sub={`${num(stats.verifyPending)} Audit in progress`} badge={`${pctApproved}%`} spark={approvedSpark} onClick={() => go('verify')} />
        <KpiCard icon={I_CLOCK} tone="amber" label="Verify Pending" value={num(stats.verifyPending)} unit="Lights" sub="Under scrutiny" onClick={() => go('verify')} />
        <KpiCard icon={I_X} tone="red" label="Reject Lights" value={num(stats.rejectLights)} unit="Lights" sub="Rejected audit count" onClick={() => go('verify')} />
        <KpiCard icon={I_DOC} tone="violet" label="Claim Applicable" value={num(stats.claimApplicable)} unit="Lights" sub="Eligible claims raised" badge={`${pctClaim}%`} onClick={() => go('claim-request')} />
        <KpiCard icon={I_CREDIT} tone="emerald" label="Payment Done" value={num(stats.paymentDone)} unit="Lights" sub="Disbursed settlements" badge={`${pctPaid}%`} onClick={() => go('payment-request')} />

        {/* 5. Operations header */}
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
              Bihar SSL Vendor Portal
            </span>
          </div>
        </div>

        <KpiCard icon={I_BOLT} tone="emerald" label="Execution Rate" value={`${pctComplete}%`} sub={`${num(stats.completeLights)} of ${num(stats.totalLights)} lights installed`} badge="Installed" spark={execRateSpark} onClick={() => go('verify')} />
        <KpiCard icon={I_SHIELD} tone="cyan" label="Audit Pass Rate" value={`${pctOf(stats.approveLights, stats.approveLights + stats.rejectLights || 1)}%`} sub={`${num(stats.approveLights)} Passed · ${num(stats.rejectLights)} Rejected`} spark={auditPassSpark} onClick={() => go('verify')} />
        <KpiCard icon={I_DOC} tone="violet" label="Claim Rate" value={`${pctClaim}%`} sub={`${num(stats.claimApplicable)} claims applicable`} onClick={() => go('claim-request')} />
        <KpiCard icon={I_CREDIT} tone="accent" label="Payment Disbursement" value={`${pctPaid}%`} sub={`${num(stats.paymentDone)} lights disbursed`} onClick={() => go('payment-request')} />

        {/* State Operations Card */}
        <section className="ax-card ax-col--12" role="region" aria-label="Bihar SSL Operations Summary">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow" style={{ color: 'var(--asw-primary)' }}>State Operations</span>
              <h3 className="ax-card__title">Bihar · Solar Street Light (SSL) Operations</h3>
              <p className="ax-card__subtitle">{num(stats.completeLights)} street lights installed across {districtOptions.length} districts in Bihar</p>
            </div>
            <Link to={`${BASE}/verify`} className="ax-btn ax-btn--sm ax-btn--primary">
              View Installation Register →
            </Link>
          </div>
          <div className="ax-card__body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-3)' }}>
            <div className="ax-grid ax-grid--2" style={{ gap: 'var(--ax-space-2)' }}>
              <div style={{ padding: '10px 12px', background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 'var(--ax-radius-md, 8px)' }}>
                <small style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-xs)' }}>Installed & Operational</small>
                <div style={{ fontSize: 'var(--ax-text-lg)', fontWeight: 700, color: 'var(--ax-viz-emerald, #10b981)' }}>
                  {num(stats.completeLights)} <span style={{ fontSize: 'var(--ax-text-xs)', fontWeight: 500 }}>({pctComplete}%)</span>
                </div>
              </div>
              <div style={{ padding: '10px 12px', background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 'var(--ax-radius-md, 8px)' }}>
                <small style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-xs)' }}>Pending Execution</small>
                <div style={{ fontSize: 'var(--ax-text-lg)', fontWeight: 700, color: 'var(--ax-viz-amber, #f59e0b)' }}>
                  {num(stats.pendingLights)} <span style={{ fontSize: 'var(--ax-text-xs)', fontWeight: 500 }}>({pctPending}%)</span>
                </div>
              </div>
            </div>

            <div>
              <div className="ax-cluster" style={{ justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>Overall Installation Execution Efficiency</span>
                <b className="ax-num" style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-emerald, #10b981)' }}>{pctComplete}%</b>
              </div>
              <div className="ax-progress ax-progress--sm">
                <div className="ax-progress__track">
                  <div className="ax-progress__fill" style={{ width: `${pctComplete}%`, background: 'var(--ax-viz-emerald, #10b981)' }} />
                </div>
              </div>
            </div>

            <div style={{ paddingTop: 'var(--ax-space-2)', borderTop: '1px solid var(--ax-border-subtle, #f1f5f9)', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
              <b>Verification & Compliance:</b> {num(stats.approveLights)} lights approved by auditor ({pctApproved}%) · {num(stats.claimApplicable)} claims applicable · {num(stats.paymentDone)} payment settlements confirmed.
            </div>
          </div>
        </section>

        {/* 6. Charts */}
        <section className="ax-card ax-card--chart ax-col--8" role="region" aria-label="District wise installations">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Geographic Breakdown</span>
              <h2 className="ax-card__title">District Wise Installations</h2>
              <p className="ax-card__subtitle">{num(stats.completeLights)} installed of {num(stats.totalLights)} allocated across {districtOptions.length} districts</p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)' }}>
                {[{ l: 'Installed Lights', c: LIGHT_GREEN }, { l: 'Allocated Lights', c: LIGHT_BLUE }].map((i) => (
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
                  key={`dist-chart-${chartH}-${chartDistricts.map((d) => `${d.district}-${d.completed}-${d.totalLights}`).join('-')}`}
                  type="bar"
                  height={chartH}
                  legend="none"
                  ariaLabel="District-wise installation comparison"
                  series={[
                    { name: 'Installed Lights', data: chartDistricts.map((d) => d.completed) },
                    { name: 'Allocated Lights', data: chartDistricts.map((d) => d.totalLights) },
                  ]}
                  apex={{
                    colors: [LIGHT_GREEN, LIGHT_BLUE],
                    plotOptions: { bar: { horizontal: false, borderRadius: 4, columnWidth: '35%' } },
                    xaxis: { categories: chartDistricts.map((d) => d.district), labels: { style: { fontSize: '11px' }, rotate: -35 } },
                    yaxis: { title: { text: 'Street Lights (Nos.)', style: { color: 'var(--ax-text-muted)' } } },
                  }}
                />
              </Suspense>
            ) : (
              <div style={{ height: chartH, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--ax-text-muted)', gap: 8 }}>
                <span style={{ fontSize: 'var(--ax-text-sm)', fontWeight: 500 }}>{loading ? 'Loading district data…' : 'No district data returned by server.'}</span>
              </div>
            )}
          </div>
        </section>

        <section className="ax-card ax-col--4" role="region" aria-label="Installation status split">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Execution Distribution</span>
              <h2 className="ax-card__title">Status Breakdown</h2>
              <p className="ax-card__subtitle">Total {num(stats.totalLights)} Street Lights</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <Suspense fallback={<div className="ax-skeleton" style={{ height: donutH }} />}>
              <ApexChart
                key={`donut-${donutH}-${stats.completeLights}-${stats.pendingLights}-${stats.rejectLights}`}
                type="donut"
                height={donutH}
                legend="none"
                ariaLabel="Installed, pending and rejected distribution"
                series={[stats.completeLights, stats.pendingLights, stats.rejectLights]}
                apex={{
                  labels: ['Installed', 'Pending', 'Rework Required'],
                  colors: [LIGHT_GREEN, LIGHT_AMBER, LIGHT_RED],
                  stroke: { width: 0 },
                  plotOptions: {
                    pie: {
                      donut: {
                        size: '72%',
                        labels: {
                          show: true,
                          name: { fontFamily: 'var(--ax-font-sans)' },
                          value: { fontFamily: 'var(--ax-font-mono)', fontWeight: 600 },
                          total: { show: true, label: 'Lights', formatter: () => num(stats.totalLights) },
                        },
                      },
                    },
                  },
                }}
              />
            </Suspense>
            <ul className="ax-list ax-list--compact" style={{ marginTop: 'var(--ax-space-3)' }}>
              {[
                { label: 'Installed', sub: 'Completed lights', v: stats.completeLights, p: pctComplete, color: LIGHT_GREEN },
                { label: 'Pending', sub: 'Awaiting execution', v: stats.pendingLights, p: pctPending, color: LIGHT_AMBER },
                { label: 'Rework Required', sub: 'Audit rejected', v: stats.rejectLights, p: pctOf(stats.rejectLights, stats.totalLights), color: LIGHT_RED },
              ].map((s) => (
                <li key={s.label} className="ax-list__row" style={{ border: 0, paddingInline: 0 }}>
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

        {/* 7. District & Volume table + Milestones */}
        <section className="ax-card ax-col--8" role="region" aria-label="District and volume summary table">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Geographic Breakdown</span>
              <h2 className="ax-card__title">District & Volume Summary</h2>
              <p className="ax-card__subtitle">Allocated, installed and verification metrics per district & volume</p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                <SearchInput value={tableQuery} onChange={setTableQuery} placeholder="Search district or volume…" ariaLabel="Search districts" />
                <TableExportToolbar
                  onCopy={() => copyToClipboard(tableDistricts, districtCols)}
                  onExportCSV={() => exportToCSV(tableDistricts, districtCols, `${distFileBase}_${stamp}`)}
                  onExportExcel={() => exportToExcel(tableDistricts, districtCols, `${distFileBase}_${stamp}`)}
                  onExportPDF={() => exportToPDF(tableDistricts, districtCols, distFileTitle)}
                />
              </div>
            </div>
          </div>

          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover">
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">Sr. No.</th>
                  <th className="ax-table__th" scope="col">District</th>
                  <th className="ax-table__th" scope="col">Volume</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Total Lights</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Completed</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Pending</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Approved</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Rejected</th>
                </tr>
              </thead>
              <tbody>
                {pagedDistricts.map((d, idx) => (
                  <tr key={`${d.district}-${d.volume}`} className="ax-table__row">
                    <td className="ax-table__td">{(currentPage - 1) * pageSize + idx + 1}</td>
                    <td className="ax-table__td" style={{ fontWeight: 'var(--ax-weight-semibold)', color: 'var(--ax-text-strong)' }}><b>{d.district}</b></td>
                    <td className="ax-table__td"><span className="ax-badge ax-badge--soft ax-badge--neutral">{d.volume}</span></td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ fontWeight: 600 }}>{num(d.totalLights)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-emerald, #10b981)', fontWeight: 600 }}>{num(d.completed)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-amber, #f59e0b)', fontWeight: 600 }}>{num(d.pending)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-violet, #7c3aed)', fontWeight: 600 }}>{num(d.approved)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-red, #ef4444)', fontWeight: 600 }}>{num(d.rejected)}</td>
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
                    <td className="ax-table__td" />
                    <td className="ax-table__td" style={{ color: 'var(--ax-text-strong)' }}>Total ({filteredDistricts.length} Districts)</td>
                    <td className="ax-table__td" />
                    <td className="ax-table__td ax-table__td--num ax-num">{num(stats.totalLights)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-emerald, #10b981)' }}>{num(stats.completeLights)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-amber, #f59e0b)' }}>{num(stats.pendingLights)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-violet, #7c3aed)' }}>{num(stats.approveLights)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-red, #ef4444)' }}>{num(stats.rejectLights)}</td>
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

        <section className="ax-card ax-col--4" role="region" aria-label="SSL Workflow Milestones and quick actions">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Workflow Lifecycle</span>
              <h2 className="ax-card__title">SSL Milestones</h2>
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

            <div className="ax-divider" />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 'var(--ax-text-xs)', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)', letterSpacing: '0.04em' }}>
                Quick Module Actions
              </span>
              <Link to={`${BASE}/view-assign`} className="ax-btn ax-btn--secondary ax-btn--sm" style={{ justifyContent: 'space-between' }}>
                <span>View Assigned SSL</span><span>→</span>
              </Link>
              <Link to={`${BASE}/assign`} className="ax-btn ax-btn--primary ax-btn--sm" style={{ justifyContent: 'space-between' }}>
                <span>Assign New Light</span><span>+</span>
              </Link>
              <Link to={`${BASE}/verify`} className="ax-btn ax-btn--secondary ax-btn--sm" style={{ justifyContent: 'space-between' }}>
                <span>Verify Lights</span><span>👁</span>
              </Link>
              <Link to={`${BASE}/claim-request`} className="ax-btn ax-btn--secondary ax-btn--sm" style={{ justifyContent: 'space-between' }}>
                <span>Review Claim Requests</span><span>→</span>
              </Link>
              <Link to={`${BASE}/payment-request`} className="ax-btn ax-btn--secondary ax-btn--sm" style={{ justifyContent: 'space-between' }}>
                <span>Review Payment Requests</span><span>₹</span>
              </Link>
            </div>
          </div>
        </section>

        {/* 8. Vendor table */}
        <section className="ax-card ax-col--12" role="region" aria-label="Vendor wise performance table">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Field Partner Analytics</span>
              <h2 className="ax-card__title">Vendor SSL Allotment & Performance</h2>
              <p className="ax-card__subtitle">Assigned volumes, quotas and field verified completion across Bihar</p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                <SearchInput value={vendorTableQuery} onChange={setVendorTableQuery} placeholder="Search vendor or volume…" ariaLabel="Search vendors" />
                <TableExportToolbar
                  onCopy={() => copyToClipboard(tableVendors, vendorCols)}
                  onExportCSV={() => exportToCSV(tableVendors, vendorCols, `${vendorFileBase}_${stamp}`)}
                  onExportExcel={() => exportToExcel(tableVendors, vendorCols, `${vendorFileBase}_${stamp}`)}
                  onExportPDF={() => exportToPDF(tableVendors, vendorCols, vendorFileTitle)}
                />
              </div>
            </div>
          </div>

          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover">
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">Sr. No.</th>
                  <th className="ax-table__th" scope="col">Vendor Name</th>
                  <th className="ax-table__th" scope="col">Volume</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Assigned Lights</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Completed</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Pending</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Approved</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Rejected</th>
                  <th className="ax-table__th" scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {pagedVendors.map((v, idx) => (
                  <tr key={`${v.vendor}-${v.volume}`} className="ax-table__row">
                    <td className="ax-table__td">{(vendorCurrentPage - 1) * vendorPageSize + idx + 1}</td>
                    <td className="ax-table__td" style={{ fontWeight: 'var(--ax-weight-semibold)', color: 'var(--ax-text-strong)' }}><b>{v.vendor}</b></td>
                    <td className="ax-table__td"><span className="ax-badge ax-badge--soft ax-badge--neutral">{v.volume}</span></td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ fontWeight: 600 }}>{num(v.assignedLights)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-emerald, #10b981)', fontWeight: 600 }}>{num(v.completed)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-amber, #f59e0b)', fontWeight: 600 }}>{num(v.pending)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-violet, #7c3aed)', fontWeight: 600 }}>{num(v.approved)}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-red, #ef4444)', fontWeight: 600 }}>{num(v.rejected)}</td>
                    <td className="ax-table__td">
                      <Link to={`${BASE}/view-assign`} className="ax-btn ax-btn--secondary ax-btn--sm">View Orders</Link>
                    </td>
                  </tr>
                ))}
                {!loading && pagedVendors.length === 0 && (
                  <tr>
                    <td className="ax-table__td" colSpan={9} style={{ textAlign: 'center', color: 'var(--ax-text-muted)', padding: 24 }}>
                      No vendors match the search criteria.
                    </td>
                  </tr>
                )}
                {pagedVendors.length > 0 && (
                  <tr className="ax-table__row" style={{ background: 'var(--ax-surface-subtle, #f8fafc)', fontWeight: 'var(--ax-weight-bold)' }}>
                    <td className="ax-table__td" />
                    <td className="ax-table__td" style={{ color: 'var(--ax-text-strong)' }}>Total ({vendorData.length} Vendors)</td>
                    <td className="ax-table__td" />
                    <td className="ax-table__td ax-table__td--num ax-num">{num(vendorData.reduce((a, v) => a + v.assignedLights, 0))}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-emerald, #10b981)' }}>{num(vendorData.reduce((a, v) => a + v.completed, 0))}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-amber, #f59e0b)' }}>{num(vendorData.reduce((a, v) => a + v.pending, 0))}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-violet, #7c3aed)' }}>{num(vendorData.reduce((a, v) => a + v.approved, 0))}</td>
                    <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-red, #ef4444)' }}>{num(vendorData.reduce((a, v) => a + v.rejected, 0))}</td>
                    <td className="ax-table__td" />
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="ax-card__footer" style={footerStyle}>
            <div className="ula-pagination-left">
              <Pagination
                currentPage={vendorCurrentPage}
                totalItems={vendorTotalItems}
                pageSize={vendorPageSize}
                onPageChange={setVendorPage}
                onPageSizeChange={setVendorPageSize}
                pageSizeOptions={[10, 15, 25, 50, 100]}
              />
            </div>
          </div>
        </section>
      </div>

      <footer style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--ax-border, #e2e8f0)', textAlign: 'center', color: 'var(--ax-text-muted)', fontSize: 13 }}>
        Copyright © ETS NETWORKS. All rights reserved.
      </footer>
    </div>
  );
}

export const BiharSslInstallationDashboard = BiharSSLInstallationDashboard;
export default BiharSSLInstallationDashboard;