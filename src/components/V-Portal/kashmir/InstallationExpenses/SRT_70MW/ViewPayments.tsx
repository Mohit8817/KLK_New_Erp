import { useState, useMemo, useEffect, useCallback, type ReactNode } from 'react';
import { PageHead } from '../../../../shell/PageHead';
import {
  kashmirSrtService,
  type KashmirExpensePaymentData,
  type KashmirExpenseItem,
  getKashmirMediaUrl,
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
const TOTAL_COLUMNS = 15;

type PayFilter = 'all' | 'paid' | 'partial' | 'pending';
type ClaimFilter = 'all' | 'approved' | 'pending' | 'rejected';

const DEFAULT_DETAILS = { total: 0, complete: 0, partially: 0, pending: 0 };

/* Safe getter: API field names pehle match karte hain jo mile wahi use hota hai */
const pick = (r: KashmirExpenseItem, ...keys: string[]): string => {
  const o = r as unknown as Record<string, unknown>;
  for (const k of keys) {
    const v = o[k];
    if (v !== undefined && v !== null && String(v).trim() !== '') return String(v);
  }
  return '';
};

/* ── Pay Status helpers ── */
const payKey = (r: KashmirExpenseItem): Exclude<PayFilter, 'all'> => {
  const s = Number(r.pay_status);
  return s === 1 ? 'paid' : s === 2 ? 'partial' : 'pending';
};

const payLabel = (r: KashmirExpenseItem) => {
  const k = payKey(r);
  return k === 'paid' ? 'Paid' : k === 'partial' ? 'Partial' : 'Pending';
};

/* ── Claim Status helpers ── */
const claimStatusLabel = (r: KashmirExpenseItem) => {
  const s = Number(pick(r, 'claim_status'));
  if (s === 1) return 'Pending';
  if (s === 2) return 'Approved';
  if (s === 3) return 'Rejected';
  return 'Pending';
};

const claimStatusBadge = (r: KashmirExpenseItem) => {
  const s = Number(pick(r, 'claim_status'));
  if (s === 2) return <span className="ax-badge ax-badge--soft ax-badge--success" style={{ fontWeight: 600 }}>Approved</span>;
  if (s === 3) return <span className="ax-badge ax-badge--soft ax-badge--danger" style={{ fontWeight: 600 }}>Rejected</span>;
  return <span className="ax-badge ax-badge--soft ax-badge--warning" style={{ fontWeight: 600 }}>Pending</span>;
};

const money = (v: unknown) => `₹${Number(v || 0).toLocaleString('en-IN')}`;

/* Format datetime: "2026-11-04 13:49:03" → "04 Nov 2026, 01:49 PM" */
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

const fmtDateTime = (v: string | null | undefined): string => {
  if (!v) return DASH;
  try {
    const d = new Date(v);
    if (isNaN(d.getTime())) return v;
    return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
  } catch {
    return v;
  }
};

/* ───────── KPI Card (same style as View Assigned SRT Installation) ───────── */
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

  .solar-erp-page img,
  .solar-erp-page .ula-table--wide img,
  .solar-erp-page .ax-card img {
    border-radius: 0 !important;
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

  .solar-erp-page .invoice-thumb {
    width: 40px; height: 40px; object-fit: cover; border: 1px solid var(--ax-border);
    cursor: pointer; transition: transform 0.2s ease;
  }
  .solar-erp-page .invoice-thumb:hover { transform: scale(1.15); }

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
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<PayFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await kashmirSrtService.getExpensePayments();
      setData(resp);
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

  // Distinct expense types for filter dropdown
  const expenseTypes = useMemo(() => {
    const set = new Set<string>();
    payments.forEach((r) => {
      const t = pick(r, 'type').trim();
      if (t) set.add(t);
    });
    return Array.from(set).sort();
  }, [payments]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return payments.filter((r) => {
      // Pay status filter
      if (statusFilter !== 'all' && payKey(r) !== statusFilter) return false;

      // Type filter (installation, survey, etc.)
      if (typeFilter !== 'all' && pick(r, 'type').toLowerCase() !== typeFilter.toLowerCase()) {
        return false;
      }

      if (!q) return true;
      return (
        String(r.id).includes(q) ||
        (r.amount && String(r.amount).includes(q)) ||
        (r.purpose && r.purpose.toLowerCase().includes(q)) ||
        pick(r, 'type').toLowerCase().includes(q) ||
        pick(r, 'state').toLowerCase().includes(q) ||
        pick(r, 'project').toLowerCase().includes(q) ||
        pick(r, 'vendor_id').includes(q) ||
        pick(r, 'site_id').includes(q) ||
        pick(r, 'remarks').toLowerCase().includes(q) ||
        pick(r, 'approved_remarks').toLowerCase().includes(q)
      );
    });
  }, [payments, search, typeFilter, statusFilter]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const hasFilters = search.trim() !== '' || typeFilter !== 'all' || statusFilter !== 'all';
  const resetFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  // Export columns — mapped to ACTUAL API fields
  const exportCols: ExportColumn<KashmirExpenseItem>[] = useMemo(
    () => [
      { header: 'ID', accessor: (r) => String(r.id ?? '') },
      { header: 'Date', accessor: (r) => r.date || DASH },
      { header: 'State', accessor: (r) => pick(r, 'state') || DASH },
      { header: 'Project', accessor: (r) => pick(r, 'project') || DASH },
      { header: 'Type', accessor: (r) => pick(r, 'type') || DASH },
      { header: 'Site ID', accessor: (r) => pick(r, 'site_id') || DASH },
      { header: 'Vendor ID', accessor: (r) => pick(r, 'vendor_id') || DASH },
      { header: 'Purpose', accessor: (r) => r.purpose || DASH },
      { header: 'Amount', accessor: (r) => String(r.amount ?? '') },
      { header: 'Remarks', accessor: (r) => pick(r, 'remarks') || DASH },
      { header: 'Claim Status', accessor: (r) => claimStatusLabel(r) },
      { header: 'Approved Date', accessor: (r) => pick(r, 'approved_date') || DASH },
      { header: 'Approved By', accessor: (r) => pick(r, 'approved_by') || DASH },
      { header: 'Approved Remarks', accessor: (r) => pick(r, 'approved_remarks') || DASH },
      { header: 'Pay Status', accessor: (r) => payLabel(r) },
    ],
    []
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
              active={statusFilter === 'paid'}
              onClick={() => setStatus('paid')}
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
              active={statusFilter === 'partial'}
              onClick={() => setStatus('partial')}
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
                {expenseTypes.length > 0 && (
                  <select
                    id="type_filter"
                    className="ax-input ax-input--sm"
                    style={{ width: 150, height: 32, fontSize: 'var(--ax-text-xs)', textTransform: 'capitalize' }}
                    value={typeFilter}
                    onChange={(e) => {
                      setTypeFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    aria-label="Filter by type"
                  >
                    <option value="all">All Types</option>
                    {expenseTypes.map((t) => (
                      <option key={t} value={t} style={{ textTransform: 'capitalize' }}>{t}</option>
                    ))}
                  </select>
                )}

                <select
                  id="status_filter"
                  className="ax-input ax-input--sm"
                  style={{ width: 130, height: 32, fontSize: 'var(--ax-text-xs)' }}
                  value={statusFilter}
                  onChange={(e) => setStatus(e.target.value as PayFilter)}
                  aria-label="Filter by pay status"
                >
                  <option value="all">All Status</option>
                  <option value="paid">Paid</option>
                  <option value="partial">Partial</option>
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
                  placeholder="Search site, purpose, vendor…"
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
              style={{ whiteSpace: 'nowrap', minWidth: 1800 }}
            >
              <caption className="ax-visually-hidden">View Expenses Payment Records</caption>
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col" style={{ width: 60 }}>S.No.</th>
                  <th className="ax-table__th" scope="col">Date</th>
                  <th className="ax-table__th" scope="col">State</th>
                  <th className="ax-table__th" scope="col">Project</th>
                  <th className="ax-table__th" scope="col">Type</th>
                  <th className="ax-table__th" scope="col">Site ID</th>
                  <th className="ax-table__th" scope="col">Vendor ID</th>
                  <th className="ax-table__th" scope="col" style={{ minWidth: 160 }}>Purpose</th>
                  <th className="ax-table__th" scope="col">Amount</th>
                  <th className="ax-table__th" scope="col" style={{ minWidth: 160 }}>Remarks</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Invoice</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Claim Status</th>
                  <th className="ax-table__th" scope="col">Approved Date</th>
                  <th className="ax-table__th" scope="col" style={{ minWidth: 160 }}>Approved Remarks</th>
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
                            : 'No approved expense payments found.'
                        }
                        query={search}
                        onClear={hasFilters ? resetFilters : undefined}
                      />
                    </td>
                  </tr>
                )}
                {!loading &&
                  paginated.map((r, idx) => {
                    const k = payKey(r);
                    const fileUrl = pick(r, 'file');
                    const mediaUrl = fileUrl ? getKashmirMediaUrl(fileUrl) : null;

                    return (
                      <tr key={r.id || idx} className="ax-table__row">
                        {/* S.No. */}
                        <td className="ax-table__td ax-num">{(currentPage - 1) * pageSize + idx + 1}</td>

                        {/* Date */}
                        <td className="ax-table__td">{fmtDate(r.date)}</td>

                        {/* State */}
                        <td className="ax-table__td" style={{ textTransform: 'capitalize' }}>
                          {pick(r, 'state') || DASH}
                        </td>

                        {/* Project */}
                        <td className="ax-table__td" style={{ textTransform: 'uppercase' }}>
                          {pick(r, 'project') || DASH}
                        </td>

                        {/* Type */}
                        <td className="ax-table__td" style={{ textTransform: 'capitalize' }}>
                          {pick(r, 'type') || DASH}
                        </td>

                        {/* Site ID */}
                        <td className="ax-table__td" style={{ fontWeight: 600 }}>
                          {pick(r, 'site_id') ? `#${pick(r, 'site_id')}` : DASH}
                        </td>

                        {/* Vendor ID */}
                        <td className="ax-table__td">
                          {pick(r, 'vendor_id') || DASH}
                        </td>

                        {/* Purpose */}
                        <td className="ax-table__td">{r.purpose || DASH}</td>

                        {/* Amount */}
                        <td className="ax-table__td" style={{ fontWeight: 600 }}>{money(r.amount)}</td>

                        {/* Remarks */}
                        <td className="ax-table__td" style={{ maxWidth: 220, whiteSpace: 'normal', fontSize: 12 }}>
                          {pick(r, 'remarks') || DASH}
                        </td>

                        {/* Invoice File */}
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          {mediaUrl ? (
                            <a href={mediaUrl} target="_blank" rel="noopener noreferrer" title="View Invoice">
                              <img
                                src={mediaUrl}
                                alt="Invoice"
                                className="invoice-thumb"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                  (e.target as HTMLImageElement).parentElement!.innerHTML =
                                    '<span class="ax-badge ax-badge--soft ax-badge--primary" style="font-size:10px;cursor:pointer;">View File</span>';
                                }}
                              />
                            </a>
                          ) : (
                            DASH
                          )}
                        </td>

                        {/* Claim Status */}
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          {claimStatusBadge(r)}
                        </td>

                        {/* Approved Date */}
                        <td className="ax-table__td" style={{ fontSize: 12 }}>
                          {fmtDateTime(pick(r, 'approved_date'))}
                        </td>

                        {/* Approved Remarks */}
                        <td className="ax-table__td" style={{ maxWidth: 220, whiteSpace: 'normal', fontSize: 12 }}>
                          {pick(r, 'approved_remarks') || DASH}
                        </td>

                        {/* Pay Status */}
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          {k === 'paid' ? (
                            <span className="ax-badge ax-badge--soft ax-badge--success" style={{ fontWeight: 600 }}>Paid</span>
                          ) : k === 'partial' ? (
                            <span className="ax-badge ax-badge--soft ax-badge--warning" style={{ fontWeight: 600 }}>Partial</span>
                          ) : (
                            <span className="ax-badge ax-badge--soft ax-badge--neutral" style={{ fontWeight: 600 }}>Pending</span>
                          )}
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