import { useState, useMemo, useEffect, useCallback, type ReactNode } from 'react';
import { PageHead } from '../../../../shell/PageHead';
import {
  kashmirSrtService,
  type KashmirExpensePaymentData,
  type KashmirExpenseItem,
} from '../../kashmir-services';
import {
  TableExportToolbar,
  SearchInput,
  Pagination,
  TableEmptyState,
  KpiSkeleton,
  copyTableDataToClipboard,
  exportDataToCSV,
  exportDataToExcel,
  printTableData,
  type ExportColumn,
} from '../../../../../common';

const DASH = '—';
const TOTAL_COLUMNS = 12;

type PayFilter = 'all' | 'complete' | 'partially' | 'pending';

const DEFAULT_DETAILS = { total: 0, complete: 0, partially: 0, pending: 0 };

/* Safe getter: checks candidate keys in object */
const pick = (r: KashmirExpenseItem, ...keys: string[]): string => {
  const o = r as unknown as Record<string, unknown>;
  for (const k of keys) {
    const v = o[k];
    if (v !== undefined && v !== null && String(v).trim() !== '') return String(v);
  }
  return '';
};

/* Format date helper */
const fmtDate = (v: string | null | undefined): string => {
  if (!v) return DASH;
  try {
    const d = new Date(v);
    if (isNaN(d.getTime())) return v;
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return v;
  }
};

/* ── Installment / Payment parsing helpers ── */
const parseAllPayments = (row: KashmirExpenseItem): Array<{ amount?: number | string; balance?: number | string; date?: string; pay_remarks?: string }> => {
  if (Array.isArray(row.allpayment)) return row.allpayment;
  if (typeof row.allpayment === 'string' && row.allpayment.trim()) {
    try {
      const parsed = JSON.parse(row.allpayment);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }
  return [];
};

const getRowDate = (row: KashmirExpenseItem): string => {
  return row.date || row.approved_date || row.created_at || '';
};

const getRowPayAmount = (row: KashmirExpenseItem): number | null => {
  const allPay = parseAllPayments(row);
  if (allPay.length > 0) {
    return allPay.reduce((acc, curr) => acc + (Number(curr?.amount) || 0), 0);
  }
  if (row.pay_amount !== undefined && row.pay_amount !== null && row.pay_amount !== '') {
    return Number(row.pay_amount) || 0;
  }
  if (row.payment_amount !== undefined && row.payment_amount !== null && row.payment_amount !== '') {
    return Number(row.payment_amount) || 0;
  }
  if (row.paid_amount !== undefined && row.paid_amount !== null && row.paid_amount !== '') {
    return Number(row.paid_amount) || 0;
  }
  if (Number(row.pay_status) === 1) {
    return Number(row.amount) || 0;
  }
  return null;
};

const getRowBalanceAmount = (row: KashmirExpenseItem): number | null => {
  const allPay = parseAllPayments(row);
  if (allPay.length > 0) {
    for (let i = allPay.length - 1; i >= 0; i--) {
      const b = allPay[i]?.balance;
      if (b !== undefined && b !== null && b !== '') {
        return Number(b) || 0;
      }
    }
    const totalAmt = Number(row.amount) || 0;
    const paidAmt = getRowPayAmount(row) || 0;
    return Math.max(0, totalAmt - paidAmt);
  }
  if (row.balance_amount !== undefined && row.balance_amount !== null && row.balance_amount !== '') {
    return Number(row.balance_amount) || 0;
  }
  if (row.payment_balance !== undefined && row.payment_balance !== null && row.payment_balance !== '') {
    return Number(row.payment_balance) || 0;
  }
  if (Number(row.pay_status) === 1) {
    return 0;
  }
  if (Number(row.pay_status) === 0) {
    return Number(row.amount) || 0;
  }
  const totalAmt = Number(row.amount) || 0;
  const paid = getRowPayAmount(row) ?? 0;
  return Math.max(0, totalAmt - paid);
};

const getRowPayDate = (row: KashmirExpenseItem): string => {
  const allPay = parseAllPayments(row);
  if (allPay.length > 0) {
    for (let i = allPay.length - 1; i >= 0; i--) {
      const d = allPay[i]?.date;
      if (d) return d;
    }
  }
  return row.pay_date || row.payment_date || row.paid_date || (Number(row.pay_status) === 1 ? row.approved_date : '') || '';
};

const getRowPayRemarks = (row: KashmirExpenseItem): string => {
  const allPay = parseAllPayments(row);
  if (allPay.length > 0) {
    const list = allPay
      .map((p) => p.pay_remarks?.trim())
      .filter((r): r is string => Boolean(r));
    if (list.length > 0) {
      return Array.from(new Set(list)).join('; ');
    }
  }
  return row.pay_remarks || row.payment_remarks || row.approved_remarks || '';
};

const payLabel = (r: KashmirExpenseItem) => {
  const s = Number(r.pay_status);
  return s === 1 ? 'Complete' : s === 2 ? 'Partially' : 'Pending';
};

const PayStatusBadge = ({ status }: { status: number | string | undefined | null }) => {
  const s = Number(status);
  if (s === 1) {
    return <span className="ax-badge ax-badge--soft ax-badge--success" style={{ fontWeight: 600 }}>Complete</span>;
  }
  if (s === 2) {
    return <span className="ax-badge ax-badge--soft ax-badge--warning" style={{ fontWeight: 600 }}>Partially</span>;
  }
  return <span className="ax-badge ax-badge--soft ax-badge--neutral" style={{ fontWeight: 600 }}>Pending</span>;
};

/* ───────── KPI Card ───────── */
type KpiTone = 'accent' | 'emerald' | 'amber' | 'pink';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(var(--ax-accent-rgb), 0.12)', fg: 'var(--ax-accent)' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald) 14%, transparent)', fg: 'var(--ax-viz-emerald)' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber) 14%, transparent)', fg: 'var(--ax-viz-amber)' },
  pink: { bg: 'color-mix(in oklab, var(--ax-viz-pink) 14%, transparent)', fg: 'var(--ax-viz-pink)' },
};

const svgIcon = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);

function KpiCard({
  icon,
  tone,
  label,
  value,
  sub,
  active,
  onClick,
}: {
  icon: ReactNode;
  tone: KpiTone;
  label: string;
  value: ReactNode;
  sub: ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  const t = TONE[tone];
  return (
    <div
      className={`ax-card ax-col--3 ${active ? 'is-active-filter' : ''}`}
      onClick={onClick}
      style={{
        padding: '16px 20px',
        borderRadius: 12,
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: active ? `0 0 0 1px ${t.fg}22` : undefined,
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: t.bg,
            color: t.fg,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span style={{ width: 16, height: 16, display: 'inline-flex' }}>{icon}</span>
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)', letterSpacing: '0.04em' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: t.fg, marginTop: 4 }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 4 }}>{sub}</div>
    </div>
  );
}

/* ───────── Responsive page CSS ───────── */
const PAGE_CSS = `
  .solar-erp-page .ax-card { min-width: 0; }
  .solar-erp-page .ax-card__footer { width: 100%; box-sizing: border-box; }
  .solar-erp-page .ula-pagination-left {
    width: 100%; display: flex; justify-content: flex-start; align-items: center; margin: 0; overflow-x: auto;
  }
  .solar-erp-page .ula-pagination-left > * { margin-left: 0 !important; margin-right: 0 !important; }

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
    min-width: 200px;
    max-width: 240px;
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

  .solar-erp-page .ax-table-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  .solar-erp-page .ax-table th,
  .solar-erp-page .ax-table td {
    white-space: nowrap;
    vertical-align: middle;
  }

  @media (max-width: 1100px) {
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
    .solar-erp-page .ax-card__actions [class*="search"] { max-width: 180px; }
  }

  @media (max-width: 760px) {
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
      width: 100%;
      justify-content: stretch;
      margin-left: 0;
    }
    .solar-erp-page .ax-card__actions .ax-cluster {
      width: 100%;
      flex-wrap: wrap !important;
    }
    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] {
      flex: 1 1 100%;
      max-width: 100%;
    }
  }

  @media (max-width: 900px) {
    .solar-erp-page .ax-dash-grid > .ax-card {
      grid-column: span 12 !important;
    }
  }
`;

const actionsRowStyle = {
  gap: 'var(--ax-space-2)',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'flex-end',
  width: '100%',
} as const;

const footerStyle = {
  borderTop: '1px solid var(--ax-border, #e2e8f0)',
  padding: 'var(--ax-space-3) var(--ax-space-4)',
  display: 'flex',
  justifyContent: 'flex-start',
  alignItems: 'center',
  width: '100%',
  boxSizing: 'border-box',
} as const;

const ICON_PROPS = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

const ICON_REFRESH = (
  <svg className="ax-btn__icon" {...ICON_PROPS}>
    <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
    <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
  </svg>
);

const X_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

/* ═══════════════════════════════════════════════════════════════════════════
 * Main Component
 * ═══════════════════════════════════════════════════════════════════════════ */
export function Kashmir_Expenses_ViewPayments() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<KashmirExpensePaymentData | null>(null);
  const [siteMap, setSiteMap] = useState<Record<string, { site_name: string; district?: string }>>({});
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PayFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [resp, sitesResult] = await Promise.allSettled([
        kashmirSrtService.getExpensePayments(),
        kashmirSrtService.getExpenseCreateSites(),
      ]);

      if (resp.status === 'fulfilled') {
        setData(resp.value);
        // Pre-populate siteMap from any embedded site_name objects in payments
        const embeddedMap: Record<string, { site_name: string; district?: string }> = {};
        const paymentsList = resp.value?.payments || [];
        for (const p of paymentsList) {
          const sObj = (p as any).site_name;
          if (sObj && typeof sObj === 'object' && sObj.id) {
            embeddedMap[String(sObj.id)] = {
              site_name: sObj.site_name || sObj.name || '',
              district: sObj.district || '',
            };
          }
        }
        if (Object.keys(embeddedMap).length > 0) {
          setSiteMap((prev) => ({ ...embeddedMap, ...prev }));
        }
      } else {
        throw resp.reason;
      }

      if (sitesResult.status === 'fulfilled' && Array.isArray(sitesResult.value)) {
        const map: Record<string, { site_name: string; district?: string }> = {};
        for (const s of sitesResult.value) {
          if (s?.id) {
            map[String(s.id)] = {
              site_name: s.site_name || '',
              district: s.district || '',
            };
          }
        }
        setSiteMap((prev) => ({ ...prev, ...map }));
      }
    } catch (err: any) {
      console.error('Failed to load expense payments:', err);
      setFeedbackMsg({ type: 'danger', text: err?.message || 'Failed to load expense payments.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!feedbackMsg) return;
    const t = window.setTimeout(() => setFeedbackMsg(null), 4000);
    return () => window.clearTimeout(t);
  }, [feedbackMsg]);

  const payments = useMemo(() => data?.payments || [], [data]);
  const details = data?.payment_detail || DEFAULT_DETAILS;

  const setStatus = (s: PayFilter) => {
    setStatusFilter(s);
    setCurrentPage(1);
  };

  const getRowSiteName = useCallback((r: KashmirExpenseItem): string => {
    const raw = (r as any).site_name;
    // 1. If site_name is an object
    if (raw && typeof raw === 'object') {
      if (typeof raw.site_name === 'string' && raw.site_name.trim() && raw.site_name.trim() !== '[object Object]') {
        return raw.site_name.trim();
      }
      if (typeof raw.name === 'string' && raw.name.trim() && raw.name.trim() !== '[object Object]') {
        return raw.name.trim();
      }
    }
    // 2. If site_name is a string and not [object Object]
    if (typeof raw === 'string' && raw.trim() && raw.trim() !== '[object Object]') {
      return raw.trim();
    }
    // 3. Check site / srt70mw / site_details objects
    const altObj = (r as any).site || (r as any).srt70mw || (r as any).site_details;
    if (altObj && typeof altObj === 'object') {
      const name = altObj.site_name || altObj.name;
      if (typeof name === 'string' && name.trim() && name.trim() !== '[object Object]') {
        return name.trim();
      }
    }
    // 4. Lookup from siteMap
    const sId = String(r.site_id ?? (raw && typeof raw === 'object' ? raw.id : '') ?? '').trim();
    if (sId && siteMap[sId]?.site_name) {
      return siteMap[sId].site_name;
    }
    if (sId && sId !== '[object Object]') return sId;
    return DASH;
  }, [siteMap]);

  const getRowDistrict = useCallback((r: KashmirExpenseItem): string => {
    // 1. Direct district string
    if (typeof r.district === 'string' && r.district.trim() && r.district.trim() !== '[object Object]') {
      return r.district.trim();
    }
    // 2. From site_name object
    const raw = (r as any).site_name;
    if (raw && typeof raw === 'object') {
      if (typeof raw.district === 'string' && raw.district.trim() && raw.district.trim() !== '[object Object]') {
        return raw.district.trim();
      }
    }
    // 3. From site / srt70mw / site_details objects
    const altObj = (r as any).site || (r as any).srt70mw || (r as any).site_details;
    if (altObj && typeof altObj === 'object') {
      if (typeof altObj.district === 'string' && altObj.district.trim() && altObj.district.trim() !== '[object Object]') {
        return altObj.district.trim();
      }
    }
    // 4. Direct site_district
    if (typeof r.site_district === 'string' && r.site_district.trim() && r.site_district.trim() !== '[object Object]') {
      return r.site_district.trim();
    }
    // 5. Lookup from siteMap
    const sId = String(r.site_id ?? (raw && typeof raw === 'object' ? raw.id : '') ?? '').trim();
    if (sId && siteMap[sId]?.district) {
      return siteMap[sId].district!;
    }
    return DASH;
  }, [siteMap]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return payments.filter((r) => {
      // Pay status filter
      if (statusFilter !== 'all') {
        const s = Number(r.pay_status);
        if (statusFilter === 'complete' && s !== 1) return false;
        if (statusFilter === 'partially' && s !== 2) return false;
        if (statusFilter === 'pending' && (s === 1 || s === 2)) return false;
      }

      if (!q) return true;

      const district = getRowDistrict(r).toLowerCase();
      const siteName = getRowSiteName(r).toLowerCase();
      const payRemarks = getRowPayRemarks(r).toLowerCase();
      const payDate = fmtDate(getRowPayDate(r)).toLowerCase();
      const date = fmtDate(getRowDate(r)).toLowerCase();

      return (
        String(r.id || '').includes(q) ||
        date.includes(q) ||
        district.includes(q) ||
        siteName.includes(q) ||
        (r.site_id && String(r.site_id).includes(q)) ||
        (r.purpose && r.purpose.toLowerCase().includes(q)) ||
        (r.amount && String(r.amount).includes(q)) ||
        (r.remarks && r.remarks.toLowerCase().includes(q)) ||
        payRemarks.includes(q) ||
        payDate.includes(q) ||
        payLabel(r).toLowerCase().includes(q)
      );
    });
  }, [payments, search, statusFilter, getRowDistrict, getRowSiteName]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const hasFilters = search.trim() !== '' || statusFilter !== 'all';
  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  // Export columns — Exactly 12 columns per specification
  const exportCols: ExportColumn<KashmirExpenseItem>[] = useMemo(
    () => [
      { header: 'S.No.', accessor: (_r, idx?: number) => (idx !== undefined ? idx + 1 : '') } as any,
      { header: 'Date', accessor: (r) => fmtDate(getRowDate(r)) },
      { header: 'District', accessor: (r) => getRowDistrict(r) },
      { header: 'Site Name', accessor: (r) => getRowSiteName(r) },
      { header: 'Purpose', accessor: (r) => r.purpose || DASH },
      { header: 'Amount', accessor: (r) => (r.amount ? `₹ ${Number(r.amount).toLocaleString('en-IN')}` : DASH) },
      { header: 'Remarks', accessor: (r) => r.remarks || DASH },
      {
        header: 'Pay Amount',
        accessor: (r) => {
          const p = getRowPayAmount(r);
          return p !== null ? `₹ ${p.toLocaleString('en-IN')}` : DASH;
        },
      },
      {
        header: 'Balance Amount',
        accessor: (r) => {
          const b = getRowBalanceAmount(r);
          return b !== null ? `₹ ${b.toLocaleString('en-IN')}` : DASH;
        },
      },
      { header: 'Pay Date', accessor: (r) => fmtDate(getRowPayDate(r)) },
      { header: 'Pay Remarks', accessor: (r) => getRowPayRemarks(r) || DASH },
      { header: 'Pay Status', accessor: (r) => payLabel(r) },
    ],
    [getRowDistrict, getRowSiteName]
  );

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="View Expenses Payment"
        subtitle="Welcome to, View Expenses Payment"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Kashmir' },
          { label: 'Installation Expenses' },
          { label: 'SRT 70MW' },
          { label: 'View Payments' },
        ]}
        actions={
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={loadData}
              disabled={loading}
            >
              <span className={loading ? 'ax-spinner' : ''}>{ICON_REFRESH}</span>
              <span className="ax-btn__label">Refresh</span>
            </button>
          </div>
        }
      />

      {feedbackMsg && (
        <div
          className={`ax-alert ax-alert--${feedbackMsg.type}`}
          style={{ marginBottom: 'var(--ax-space-4)' }}
          role="status"
        >
          <div className="ax-alert__content">{feedbackMsg.text}</div>
          <button
            type="button"
            className="ax-btn ax-btn--ghost ax-btn--xs"
            onClick={() => setFeedbackMsg(null)}
            aria-label="Dismiss alert"
          >
            {X_ICON}
          </button>
        </div>
      )}

      {/* ── KPI Cards (click to filter) ── */}
      <div className="ax-dash-grid" style={{ marginBottom: 'var(--ax-space-4)' }}>
        {loading ? (
          <>
            <KpiSkeleton />
            <KpiSkeleton />
            <KpiSkeleton />
            <KpiSkeleton />
          </>
        ) : (
          <>
            <KpiCard
              tone="accent"
              label="Payment Request"
              value={Number(details.total || 0).toLocaleString('en-IN')}
              sub="All payment requests"
              active={statusFilter === 'all'}
              onClick={() => setStatus('all')}
              icon={svgIcon(
                <>
                  <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                  <rect x="9" y="3" width="6" height="4" rx="2" />
                  <path d="M9 14l2 2 4-4" />
                </>
              )}
            />
            <KpiCard
              tone="emerald"
              label="Payment Complete"
              value={Number(details.complete || 0).toLocaleString('en-IN')}
              sub="Complete"
              active={statusFilter === 'complete'}
              onClick={() => setStatus('complete')}
              icon={svgIcon(
                <>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M9 12l2 2 4-4" />
                </>
              )}
            />
            <KpiCard
              tone="amber"
              label="Payment Partially"
              value={Number(details.partially || 0).toLocaleString('en-IN')}
              sub="Partially"
              active={statusFilter === 'partially'}
              onClick={() => setStatus('partially')}
              icon={svgIcon(
                <>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 3v9h9" />
                </>
              )}
            />
            <KpiCard
              tone="pink"
              label="Payment Pending"
              value={Number(details.pending || 0).toLocaleString('en-IN')}
              sub="Pending"
              active={statusFilter === 'pending'}
              onClick={() => setStatus('pending')}
              icon={svgIcon(
                <>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 3" />
                </>
              )}
            />
          </>
        )}
      </div>

      <div className="ax-dash-grid">
        {/* ── Main Table Card ── */}
        <section className="ax-card ax-col--12" role="region" aria-label="Expense Payment Records">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">EXPENSE PAYMENTS</span>
              <h2 className="ax-card__title">View Payment</h2>
              <p className="ax-card__subtitle ax-num" style={{ fontFamily: 'var(--ax-font-mono)' }}>
                {filtered.length} of {payments.length} records
              </p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                <select
                  id="status_filter"
                  className="ax-input ax-input--sm"
                  style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                  value={statusFilter}
                  onChange={(e) => setStatus(e.target.value as PayFilter)}
                  aria-label="Filter by pay status"
                >
                  <option value="all">All Status</option>
                  <option value="complete">Complete</option>
                  <option value="partially">Partially</option>
                  <option value="pending">Pending</option>
                </select>

                {hasFilters && (
                  <button
                    type="button"
                    className="ax-btn ax-btn--ghost ax-btn--sm"
                    onClick={resetFilters}
                    style={{ height: 30, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }}
                  >
                    Reset
                  </button>
                )}

                <SearchInput
                  value={search}
                  onChange={(val) => { setSearch(val); setCurrentPage(1); }}
                  placeholder="Search date, district, site, purpose…"
                  size="sm"
                  ariaLabel="Search payments"
                />

                <TableExportToolbar
                  onCopy={() => { void copyTableDataToClipboard(filtered, exportCols); }}
                  onExportCSV={() => exportDataToCSV('Kashmir_Expense_Payments', filtered, exportCols)}
                  onExportExcel={() => exportDataToExcel('Kashmir_Expense_Payments', filtered, exportCols)}
                  onExportPDF={() => printTableData('Kashmir Expense Payments', filtered, exportCols)}
                />
              </div>
            </div>
          </div>

          <div className="ax-table-wrap">
            <table
              className="ax-table ax-table--hover ula-table--wide"
              style={{ whiteSpace: 'nowrap', minWidth: 1200 }}
            >
              <caption className="ax-visually-hidden">View Expenses Payment Records</caption>
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col" style={{ width: 60 }}>S.No.</th>
                  <th className="ax-table__th" scope="col">Date</th>
                  <th className="ax-table__th" scope="col">District</th>
                  <th className="ax-table__th" scope="col">Site Name</th>
                  <th className="ax-table__th" scope="col" style={{ minWidth: 160 }}>Purpose</th>
                  <th className="ax-table__th" scope="col">Amount</th>
                  <th className="ax-table__th" scope="col" style={{ minWidth: 160 }}>Remarks</th>
                  <th className="ax-table__th" scope="col">Pay Amount</th>
                  <th className="ax-table__th" scope="col">Balance Amount</th>
                  <th className="ax-table__th" scope="col">Pay Date</th>
                  <th className="ax-table__th" scope="col" style={{ minWidth: 160 }}>Pay Remarks</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Pay Status</th>
                </tr>
              </thead>
              <tbody aria-busy={loading}>
                {loading && (
                  <tr>
                    <td className="ax-table__td" colSpan={TOTAL_COLUMNS} style={{ textAlign: 'center', padding: 32 }}>
                      <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading payments…
                    </td>
                  </tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td className="ax-table__td" colSpan={TOTAL_COLUMNS} style={{ padding: 0 }}>
                      <TableEmptyState
                        title="No data available in table"
                        message={
                          hasFilters
                            ? 'No records match your filters or search. Try clearing your query.'
                            : 'No expense payments found.'
                        }
                        query={search}
                        onClear={hasFilters ? resetFilters : undefined}
                      />
                    </td>
                  </tr>
                )}
                {!loading &&
                  paginated.map((r, idx) => {
                    const payAmt = getRowPayAmount(r);
                    const balAmt = getRowBalanceAmount(r);
                    const payDate = getRowPayDate(r);
                    const payRemarks = getRowPayRemarks(r);

                    return (
                      <tr key={r.id || idx} className="ax-table__row">
                        {/* 1. S.No. */}
                        <td className="ax-table__td ax-num">{(currentPage - 1) * pageSize + idx + 1}</td>

                        {/* 2. Date */}
                        <td className="ax-table__td">{fmtDate(getRowDate(r))}</td>

                        {/* 3. District */}
                        <td className="ax-table__td">{getRowDistrict(r)}</td>

                        {/* 4. Site Name */}
                        <td className="ax-table__td" style={{ fontWeight: 600 }}>
                          {getRowSiteName(r)}
                        </td>

                        {/* 5. Purpose */}
                        <td className="ax-table__td">{r.purpose || DASH}</td>

                        {/* 6. Amount */}
                        <td className="ax-table__td" style={{ fontWeight: 600 }}>
                          {r.amount ? `₹ ${Number(r.amount).toLocaleString('en-IN')}` : DASH}
                        </td>

                        {/* 7. Remarks */}
                        <td className="ax-table__td" style={{ maxWidth: 220, whiteSpace: 'normal', fontSize: 12 }}>
                          {r.remarks || DASH}
                        </td>

                        {/* 8. Pay Amount */}
                        <td className="ax-table__td" style={{ fontWeight: 600 }}>
                          {payAmt !== null ? `₹ ${payAmt.toLocaleString('en-IN')}` : DASH}
                        </td>

                        {/* 9. Balance Amount */}
                        <td className="ax-table__td" style={{ fontWeight: 600 }}>
                          {balAmt !== null ? `₹ ${balAmt.toLocaleString('en-IN')}` : DASH}
                        </td>

                        {/* 10. Pay Date */}
                        <td className="ax-table__td">{fmtDate(payDate)}</td>

                        {/* 11. Pay Remarks */}
                        <td className="ax-table__td" style={{ maxWidth: 220, whiteSpace: 'normal', fontSize: 12 }}>
                          {payRemarks || DASH}
                        </td>

                        {/* 12. Pay Status */}
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <PayStatusBadge status={r.pay_status} />
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* ── Table Footer: Pagination ── */}
          <div className="ax-card__footer" style={footerStyle}>
            <div className="ula-pagination-left">
              <Pagination
                currentPage={currentPage}
                pageSize={pageSize}
                totalItems={filtered.length}
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
                pageSizeOptions={[25, 50, 100, 200, 300]}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Kashmir_Expenses_ViewPayments;
