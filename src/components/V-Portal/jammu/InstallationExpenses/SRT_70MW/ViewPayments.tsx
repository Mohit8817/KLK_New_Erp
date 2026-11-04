import { useState, useEffect, useMemo, useCallback, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';

import {
  jammuExpenseService,
  type JammuExpensePaymentData,
  type JammuExpensePaymentItem,
} from '../../jammu-services';
import {
  Pagination,
  usePagination,
  SearchInput,
  TableExportToolbar,
  TableEmptyState,
  type ExportColumn,
} from '../../../../../common';

const DASH = '—';

const formatDate = (d?: string | null): string => {
  if (!d) return DASH;
  const trimmed = String(d).trim();
  if (!trimmed || trimmed === DASH || trimmed === 'null' || trimmed === 'undefined') return DASH;

  try {
    const normalized = trimmed.includes(' ') && !trimmed.includes('T') ? trimmed.replace(' ', 'T') : trimmed;
    const dt = new Date(normalized);
    if (!isNaN(dt.getTime())) {
      return dt.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    }
  } catch {
    // fallback
  }
  return trimmed;
};

type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

const Badge = ({ tone, children }: { tone: Tone; children: ReactNode }) => (
  <span className={`ax-badge ax-badge--soft ax-badge--${tone}`}>{children}</span>
);

const PayStatusBadge = ({ status }: { status?: number }) => {
  const s = Number(status ?? 0);
  if (s === 1) return <Badge tone="success">Disbursed</Badge>;
  if (s === 2) return <Badge tone="info">Partially Paid</Badge>;
  return <Badge tone="warning">Pending Disbursal</Badge>;
};

/* ───────── Payment Field Helpers ───────── */
const parseAllPayments = (row: JammuExpensePaymentItem): Array<any> => {
  if (Array.isArray(row.allpayment)) return row.allpayment;
  if (typeof row.allpayment === 'string' && (row.allpayment as string).trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(row.allpayment as string);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }
  return [];
};

const getRowDate = (row: JammuExpensePaymentItem): string => {
  return row.date || row.approved_date || row.created_at || '';
};

const getRowDistrict = (row: JammuExpensePaymentItem): string => {
  return row.district || row.site_district || 'Jammu';
};

const getRowPayAmount = (row: JammuExpensePaymentItem): number | null => {
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
  if (Number(row.pay_status) === 1) {
    return Number(row.amount) || 0;
  }
  return null;
};

const getRowBalanceAmount = (row: JammuExpensePaymentItem): number | null => {
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

const getRowPayDate = (row: JammuExpensePaymentItem): string => {
  const allPay = parseAllPayments(row);
  if (allPay.length > 0) {
    for (let i = allPay.length - 1; i >= 0; i--) {
      const d = allPay[i]?.date;
      if (d) return d;
    }
  }
  return row.pay_date || row.payment_date || row.paid_date || '';
};

const getRowPayRemarks = (row: JammuExpensePaymentItem): string => {
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

/* ───────── Top KPI Card ───────── */
type KpiTone = 'accent' | 'cyan' | 'emerald' | 'amber' | 'violet';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(37, 99, 235, 0.12)', fg: '#2563eb' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan, #06b6d4) 14%, transparent)', fg: '#0891b2' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald, #10b981) 14%, transparent)', fg: '#16a34a' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber, #f59e0b) 14%, transparent)', fg: '#d97706' },
  violet: { bg: 'color-mix(in oklab, var(--ax-viz-violet, #8b5cf6) 14%, transparent)', fg: '#7c3aed' },
};

function KpiCard({
  icon,
  tone,
  label,
  value,
  sub,
}: {
  icon: ReactNode;
  tone: KpiTone;
  label: string;
  value: ReactNode;
  sub: string;
}) {
  const t = TONE[tone];
  return (
    <div className="ax-card" style={{ padding: '14px 18px', borderRadius: 12, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: t.bg,
            color: t.fg,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span style={{ width: 15, height: 15, display: 'inline-flex' }}>{icon}</span>
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)', letterSpacing: '0.04em' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: t.fg, marginTop: 4, fontFamily: 'var(--ax-font-display)' }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>
        {sub}
      </div>
    </div>
  );
}

/* ───────── Responsive styling ───────── */
const PAGE_CSS = `
  .solar-erp-page {
    --asw-primary: #2563eb;
    --asw-primary-rgb: 37, 99, 235;
  }
  .solar-erp-page .ax-card { min-width: 0; }
  .solar-erp-page .ax-card__footer { width: 100%; box-sizing: border-box; }
  .solar-erp-page .ula-pagination-left {
    width: 100%; display: flex; justify-content: flex-start; align-items: center; margin: 0; overflow-x: auto;
  }
  .solar-erp-page .ula-pagination-left > * { margin-left: 0 !important; margin-right: 0 !important; }

  .solar-erp-page .asw-cards-row {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--ax-space-4, 16px);
    margin-bottom: var(--ax-space-5, 20px);
  }
  @media (max-width: 992px) {
    .solar-erp-page .asw-cards-row {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 520px) {
    .solar-erp-page .asw-cards-row {
      grid-template-columns: 1fr;
    }
  }

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

  .solar-erp-page .ax-table-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
`;

const actionsRowStyle = { gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', width: '100%' } as const;
const footerStyle = {
  borderTop: '1px solid var(--ax-border, #e2e8f0)',
  padding: 'var(--ax-space-3) var(--ax-space-4)',
  display: 'flex',
  justifyContent: 'flex-start',
  alignItems: 'center',
  width: '100%',
  boxSizing: 'border-box',
} as const;
const centerCell = { textAlign: 'center', padding: 24 } as const;
const monoCell = { fontFamily: 'var(--ax-font-mono)', fontSize: '12px' } as const;

const EMPTY_PAYMENT_DATA: JammuExpensePaymentData = {
  vendor: { id: 0, name: '' },
  company_id: 0,
  loginId: 0,
  payments: [],
  payment_detail: {
    total: 0,
    complete: 0,
    partially: 0,
    pending: 0,
  },
};

export function ViewPayments() {
  const [paymentData, setPaymentData] = useState<JammuExpensePaymentData>(EMPTY_PAYMENT_DATA);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [purposeFilter, setPurposeFilter] = useState<string>('all');

  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  useEffect(() => {
    if (!toastMsg) return;
    const t = window.setTimeout(() => setToastMsg(null), 4000);
    return () => window.clearTimeout(t);
  }, [toastMsg]);

  // Load payments from API 20: GET /jammu/installation-expenses-view-payment
  const loadPayments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await jammuExpenseService.getExpensePayments();
      if (data && Array.isArray(data.payments)) {
        setPaymentData(data);
      } else {
        setPaymentData(EMPTY_PAYMENT_DATA);
      }
    } catch (err: any) {
      console.error('[Jammu SRT ViewPayments] load error:', err);
      setPaymentData(EMPTY_PAYMENT_DATA);
      setToastMsg({ type: 'danger', text: err?.message || 'Failed to load expense payment disbursals from server.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const summary = paymentData.payment_detail || EMPTY_PAYMENT_DATA.payment_detail;
  const paymentsList = paymentData.payments || [];

  // Financial calculations
  const finances = useMemo(() => {
    let totalAmt = 0;
    let completeAmt = 0;
    let partiallyAmt = 0;
    let pendingAmt = 0;

    paymentsList.forEach((p) => {
      const amt = Number(p.amount) || 0;
      totalAmt += amt;
      const status = Number(p.pay_status);
      if (status === 1) completeAmt += amt;
      else if (status === 2) partiallyAmt += amt;
      else pendingAmt += amt;
    });

    return { totalAmt, completeAmt, partiallyAmt, pendingAmt };
  }, [paymentsList]);

  // Distinct purposes
  const distinctPurposes = useMemo(() => {
    const set = new Set<string>();
    paymentsList.forEach((p) => {
      if (p.purpose) set.add(p.purpose.trim());
    });
    return Array.from(set).sort();
  }, [paymentsList]);

  // Filtered payments
  const filteredPayments = useMemo(() => {
    let list = paymentsList;

    if (statusFilter === 'complete') {
      list = list.filter((p) => Number(p.pay_status) === 1);
    } else if (statusFilter === 'partial') {
      list = list.filter((p) => Number(p.pay_status) === 2);
    } else if (statusFilter === 'pending') {
      list = list.filter((p) => Number(p.pay_status) === 0);
    }

    if (purposeFilter !== 'all') {
      list = list.filter((p) => p.purpose?.trim().toLowerCase() === purposeFilter.toLowerCase());
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((p) => {
        const amtStr = String(p.amount || '');
        const payAmt = getRowPayAmount(p);
        const payAmtStr = payAmt !== null ? String(payAmt) : '';
        const balAmt = getRowBalanceAmount(p);
        const balAmtStr = balAmt !== null ? String(balAmt) : '';
        const dateStr = formatDate(getRowDate(p)).toLowerCase();
        const payDateStr = formatDate(getRowPayDate(p)).toLowerCase();
        const payRemarks = getRowPayRemarks(p).toLowerCase();
        const dist = getRowDistrict(p).toLowerCase();

        return (
          String(p.id).includes(q) ||
          p.site_name?.toLowerCase().includes(q) ||
          dist.includes(q) ||
          p.purpose?.toLowerCase().includes(q) ||
          p.remarks?.toLowerCase().includes(q) ||
          payRemarks.includes(q) ||
          amtStr.includes(q) ||
          payAmtStr.includes(q) ||
          balAmtStr.includes(q) ||
          dateStr.includes(q) ||
          payDateStr.includes(q)
        );
      });
    }

    return list;
  }, [paymentsList, search, statusFilter, purposeFilter]);

  const { paginatedData, currentPage, pageSize, totalItems, setPage, setPageSize } =
    usePagination({ data: filteredPayments, initialPageSize: 25 });

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, purposeFilter, setPage]);

  const hasFilters = search.trim() !== '' || statusFilter !== 'all' || purposeFilter !== 'all';
  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setPurposeFilter('all');
    setPage(1);
  };

  // Export columns definition - Exact 12 columns per user specification
  const exportCols: ExportColumn<JammuExpensePaymentItem>[] = useMemo(
    () => [
      { header: 'S.No.', accessor: (_r, idx?: number) => (idx !== undefined ? idx + 1 : '') } as any,
      { header: 'Date', accessor: (r) => formatDate(getRowDate(r)) },
      { header: 'District', accessor: (r) => getRowDistrict(r) },
      { header: 'Site Name', accessor: (r) => r.site_name || DASH },
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
      { header: 'Pay Date', accessor: (r) => formatDate(getRowPayDate(r)) },
      { header: 'Pay Remarks', accessor: (r) => getRowPayRemarks(r) || DASH },
      {
        header: 'Pay Status',
        accessor: (r) =>
          Number(r.pay_status) === 1
            ? 'Disbursed'
            : Number(r.pay_status) === 2
            ? 'Partially Paid'
            : 'Pending Disbursal',
      },
    ],
    []
  );

  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = 'Jammu_SRT_70MW_Expense_Payments';
  const fileTitle = 'Jammu SRT 70MW Installation Expense Reimbursement Disbursal Register';

  const getExportValue = <T,>(row: T, column: ExportColumn<T>, index: number) => {
    if (typeof column.accessor === 'function') return (column.accessor as any)(row, index);
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

  const exportToCSV = <T,>(list: T[], columns: ExportColumn<T>[], filename: string) => {
    if (!list.length || !columns.length) return;
    const out = [
      columns.map((c) => c.header),
      ...list.map((row, idx) => columns.map((c) => escapeExportValue(getExportValue(row, c, idx)))),
    ];
    const csv = out.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(',')).join('\r\n');
    downloadTextFile(`\ufeff${csv}`, `${filename}.csv`, 'text/csv');
  };

  const copyToClipboard = async <T,>(list: T[], columns: ExportColumn<T>[]) => {
    if (!list.length || !columns.length) return;
    const t = [
      columns.map((c) => c.header).join('\t'),
      ...list.map((row, idx) => columns.map((c) => escapeExportValue(getExportValue(row, c, idx))).join('\t')),
    ].join('\n');
    try {
      await navigator.clipboard.writeText(t);
      setToastMsg({ type: 'success', text: 'Table data copied to clipboard!' });
    } catch {
      const ta = document.createElement('textarea');
      ta.value = t;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setToastMsg({ type: 'success', text: 'Table data copied to clipboard!' });
    }
  };

  const exportToExcel = <T,>(list: T[], columns: ExportColumn<T>[], filename: string) => {
    if (!list.length || !columns.length) return;
    const tableHtml = `<table border="1"><thead><tr>${columns.map((c) => `<th>${escapeExportValue(c.header)}</th>`).join('')}</tr></thead><tbody>${list.map((row, idx) => `<tr>${columns.map((c) => `<td>${escapeExportValue(getExportValue(row, c, idx))}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8" /></head><body>${tableHtml}</body></html>`;
    downloadTextFile(`\ufeff${html}`, `${filename}.xls`, 'application/vnd.ms-excel');
  };

  const exportToPDF = () => window.print();

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="Jammu SRT 70MW - View Payments"
        subtitle="Track approved expense reimbursement settlements, audit accounts clearance, and payment disbursal progress"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Jammu & Kashmir' },
          { label: 'Installation Expenses' },
          { label: 'SRT 70MW' },
          { label: 'View Payments' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)' }}>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={loadPayments}
              disabled={loading}
            >
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
                <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
              </svg>
              <span className="ax-btn__label">Refresh</span>
            </button>
            <Link to="/v/jammu/installation-expenses/srt-70mw/request-expenses" className="ax-btn ax-btn--primary ax-btn--sm">
              <span className="ax-btn__label">+ Request Expense</span>
            </Link>
            <Link to="/v/jammu/installation-expenses/srt-70mw/view-expenses" className="ax-btn ax-btn--secondary ax-btn--sm">
              <span className="ax-btn__label">View Expenses</span>
            </Link>
          </div>
        }
      />

      {toastMsg && (
        <div className={`ax-alert ax-alert--${toastMsg.type}`} style={{ marginBottom: 'var(--ax-space-4)' }} role="status">
          <div className="ax-alert__title">{toastMsg.type === 'success' ? 'Success' : 'Error'}</div>
          <div className="ax-alert__text">{toastMsg.text}</div>
        </div>
      )}

      {/* ── Top Metric KPI Cards (Matching reference pattern) ── */}
      <div className="asw-cards-row">
        <KpiCard
          tone="accent"
          label="Total Approved"
          value={Number(summary.total || paymentsList.length).toLocaleString('en-IN')}
          sub={`₹ ${finances.totalAmt.toLocaleString('en-IN')} gross sanctioned`}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <path d="M8 9h8M8 13h8M8 17h5" />
            </svg>
          }
        />

        <KpiCard
          tone="emerald"
          label="Disbursed / Paid"
          value={Number(summary.complete || 0).toLocaleString('en-IN')}
          sub={`₹ ${finances.completeAmt.toLocaleString('en-IN')} fully settled`}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          }
        />

        <KpiCard
          tone="violet"
          label="Partially Paid"
          value={Number(summary.partially || 0).toLocaleString('en-IN')}
          sub={`₹ ${finances.partiallyAmt.toLocaleString('en-IN')} paid in tranches`}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          }
        />

        <KpiCard
          tone="amber"
          label="Pending Disbursal"
          value={Number(summary.pending || 0).toLocaleString('en-IN')}
          sub={`₹ ${finances.pendingAmt.toLocaleString('en-IN')} in payout queue`}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <polyline points="12 7 12 12 15 15" />
            </svg>
          }
        />
      </div>

      {/* ── Main Disbursal Table Card ── */}
      <section className="ax-card ax-col--12" role="region" aria-label="Jammu SRT 70MW Expense Payment Disbursals">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">View Payment</h2>
            <p className="ax-card__subtitle">
              <span className="ax-num">{filteredPayments.length}</span> of <span className="ax-num">{paymentsList.length}</span> approved vouchers
              {' '}· Settled <b className="ax-num">{summary.complete}</b> · Pending <b className="ax-num">{summary.pending}</b>
            </p>
          </div>

          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              {/* Purpose Filter */}
              {distinctPurposes.length > 0 && (
                <select
                  id="jammu_pay_purpose_filter"
                  className="ax-input ax-input--sm"
                  style={{ width: 150, height: 32, fontSize: 'var(--ax-text-xs)' }}
                  value={purposeFilter}
                  onChange={(e) => {
                    setPurposeFilter(e.target.value);
                    setPage(1);
                  }}
                  aria-label="Filter by purpose head"
                >
                  <option value="all">All Purpose Heads</option>
                  {distinctPurposes.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              )}

              {/* Payout Status Filter */}
              <select
                id="jammu_pay_status_filter"
                className="ax-input ax-input--sm"
                style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                aria-label="Filter by payout status"
              >
                <option value="all">All Payout Status</option>
                <option value="complete">Disbursed</option>
                <option value="partial">Partially Paid</option>
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
                onChange={setSearch}
                placeholder="Search date, district, site, purpose…"
                size="sm"
                ariaLabel="Search payments"
              />

              <TableExportToolbar
                onCopy={() => copyToClipboard(filteredPayments, exportCols)}
                onExportCSV={() => exportToCSV(filteredPayments, exportCols, `${fileBase}_${stamp}`)}
                onExportExcel={() => exportToExcel(filteredPayments, exportCols, `${fileBase}_${stamp}`)}
                onExportPDF={exportToPDF}
              />
            </div>
          </div>
        </div>

        {/* Table Body */}
        <div className="ax-table-wrap">
          <table
            className="ax-table ax-table--hover ula-table--wide"
            style={{ whiteSpace: 'nowrap', minWidth: 1200 }}
          >
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th" scope="col">S.No.</th>
                <th className="ax-table__th" scope="col">Date</th>
                <th className="ax-table__th" scope="col">District</th>
                <th className="ax-table__th" scope="col">Site Name</th>
                <th className="ax-table__th" scope="col">Purpose</th>
                <th className="ax-table__th" scope="col">Amount</th>
                <th className="ax-table__th" scope="col">Remarks</th>
                <th className="ax-table__th" scope="col">Pay Amount</th>
                <th className="ax-table__th" scope="col">Balance Amount</th>
                <th className="ax-table__th" scope="col">Pay Date</th>
                <th className="ax-table__th" scope="col">Pay Remarks</th>
                <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Pay Status</th>
              </tr>
            </thead>
            <tbody aria-busy={loading}>
              {loading && (
                <tr>
                  <td className="ax-table__td" colSpan={12} style={centerCell}>
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading payment records from server…
                  </td>
                </tr>
              )}
              {!loading && filteredPayments.length === 0 && (
                <tr>
                  <td className="ax-table__td" colSpan={12} style={{ padding: 0 }}>
                    <TableEmptyState
                      title="No data available in table"
                      message={
                        hasFilters
                          ? 'No payments match your active filters or search query.'
                          : undefined
                      }
                      onClear={hasFilters ? resetFilters : undefined}
                      clearLabel="Clear filters"
                    />
                  </td>
                </tr>
              )}
              {!loading &&
                paginatedData.map((row, index) => {
                  const payAmt = getRowPayAmount(row);
                  const balAmt = getRowBalanceAmount(row);
                  const payDate = getRowPayDate(row);
                  const payRemarks = getRowPayRemarks(row);

                  return (
                    <tr key={row.id || index} className="ax-table__row">
                      <td className="ax-table__td ax-num">{(currentPage - 1) * pageSize + index + 1}</td>
                      <td className="ax-table__td">{formatDate(getRowDate(row))}</td>
                      <td className="ax-table__td">{getRowDistrict(row)}</td>
                      <td className="ax-table__td">
                        <span style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                          {row.site_name || DASH}
                        </span>
                      </td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                        {row.purpose || DASH}
                      </td>
                      <td className="ax-table__td" style={{ fontWeight: 700, color: 'var(--asw-primary)' }}>
                        {row.amount ? `₹ ${Number(row.amount).toLocaleString('en-IN')}` : DASH}
                      </td>
                      <td className="ax-table__td">{row.remarks || DASH}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>
                        {payAmt !== null ? `₹ ${payAmt.toLocaleString('en-IN')}` : DASH}
                      </td>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>
                        {balAmt !== null ? `₹ ${balAmt.toLocaleString('en-IN')}` : DASH}
                      </td>
                      <td className="ax-table__td">{formatDate(payDate)}</td>
                      <td className="ax-table__td">{payRemarks || DASH}</td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <PayStatusBadge status={row.pay_status} />
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="ax-card__footer" style={footerStyle}>
          <div className="ula-pagination-left">
            <Pagination
              currentPage={currentPage}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setPage}
              setPage={setPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[10, 25, 50, 100]}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

export default ViewPayments;
