import { useEffect, useMemo, useRef, useState, useCallback, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
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
import {
  kashmirAdminService,
  resolveKashmirMediaUrl,
  type ExpenseClaimItem,
  type ExpensePaymentSubItem,
} from '../../kashmir-services';

type Row = ExpenseClaimItem;
type ExpenseClaimState = 'approved' | 'rejected' | 'pending';
type FilterKey = 'all' | ExpenseClaimState;

const DASH = '—';
const txt = (v: unknown) => (v === null || v === undefined || v === '' ? DASH : String(v));

const claimState = (r: Row): ExpenseClaimState => {
  const s = Number(r.claim_status ?? 1);
  if (s === 2) return 'approved';
  if (s === 3) return 'rejected';
  return 'pending';
};

const claimStatusLabel = (s: ExpenseClaimState) => {
  if (s === 'approved') return 'Approved';
  if (s === 'rejected') return 'Rejected';
  return 'Pending';
};

const claimStatusTone = (s: ExpenseClaimState): 'success' | 'danger' | 'warning' => {
  if (s === 'approved') return 'success';
  if (s === 'rejected') return 'danger';
  return 'warning';
};

const fmtDate = (val?: string | null): string => {
  if (!val) return DASH;
  const d = new Date(val);
  if (!isNaN(d.getTime())) return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  return String(val).slice(0, 10);
};

const fmtMoney = (val?: string | number | null): string => {
  if (!val) return DASH;
  const n = parseFloat(String(val).replace(/[^0-9.-]/g, ''));
  if (isNaN(n)) return String(val);
  return `₹${n.toLocaleString('en-IN')}`;
};

/* ───────── Responsive page CSS ───────── */
const PAGE_CSS = `
  .solar-erp-page .ax-card { min-width: 0; }
  .solar-erp-page .ax-card__footer { width: 100%; box-sizing: border-box; }
  .solar-erp-page .ula-pagination-left {
    width: 100%; display: flex; justify-content: flex-start; align-items: center; margin: 0; overflow-x: auto;
  }
  .solar-erp-page .ula-pagination-left > * { margin-left: 0 !important; margin-right: 0 !important; }
  .solar-erp-page img, .solar-erp-page .ax-card img { border-radius: 0 !important; }
  .solar-erp-page .ax-card__header {
    display: flex; flex-wrap: nowrap; align-items: flex-start; justify-content: space-between; gap: 12px;
  }
  .solar-erp-page .ax-card__titles { flex: 1 1 220px; min-width: 220px; max-width: 100%; }
  .solar-erp-page .ax-card__title,
  .solar-erp-page .ax-card__eyebrow,
  .solar-erp-page .ax-card__subtitle { max-width: none; word-break: normal; overflow-wrap: normal; hyphens: none; }
  .solar-erp-page .ax-card__subtitle { line-height: 1.45; }
  .solar-erp-page .ax-card__actions {
    flex: 0 1 auto; min-width: 0; margin-left: auto; display: flex; align-items: center;
    justify-content: flex-end; flex-wrap: nowrap; gap: 8px;
  }
  .solar-erp-page .ax-card__actions .ax-cluster { flex-wrap: nowrap !important; min-width: 0; justify-content: flex-end; }
  .solar-erp-page .ax-card__actions .ax-search,
  .solar-erp-page .ax-card__actions [class*="search"] { flex: 1 1 140px; min-width: 200px; max-width: 240px; }
  .solar-erp-page .ax-card__actions input { min-width: 0; width: 100%; }
  .solar-erp-page .ax-card__actions .ax-export-toolbar,
  .solar-erp-page .ax-card__actions [class*="export-toolbar"] { flex: 0 1 auto; min-width: 0; flex-wrap: nowrap; gap: 4px; }
  .solar-erp-page .ax-export-toolbar__button { padding-inline: 8px !important; min-width: 0; }
  .solar-erp-page .ax-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; width: 100%; }

  @media (max-width: 1100px) {
    .solar-erp-page .ax-export-toolbar__button { font-size: 0; gap: 0; padding: 0 8px !important; justify-content: center; }
    .solar-erp-page .ax-export-toolbar__button svg { width: 16px; height: 16px; flex-shrink: 0; }
    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] { max-width: 180px; }
  }
  @media (max-width: 760px) {
    .solar-erp-page .ax-card__header { flex-direction: column; flex-wrap: nowrap; align-items: stretch; gap: 10px; }
    .solar-erp-page .ax-card__titles { flex: 0 0 auto; min-width: 0; width: 100%; max-width: 100%; }
    .solar-erp-page .ax-card__actions { width: 100%; justify-content: stretch; margin-left: 0; }
    .solar-erp-page .ax-card__actions .ax-cluster { width: 100%; flex-wrap: wrap !important; }
    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] { flex: 1 1 100%; max-width: 100%; }
  }

  /* Image thumbnails */
  .solar-erp-page .kswp-thumb {
    display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; padding: 0;
    border: 1px solid var(--ax-border, #e2e8f0); background: var(--ax-surface-subtle, #f8fafc);
    overflow: hidden; cursor: pointer; transition: transform 0.15s ease;
  }
  .solar-erp-page .kswp-thumb:hover { transform: scale(1.08); }
  .solar-erp-page .kswp-thumb img { width: 100%; height: 100%; object-fit: cover; }
`;

/* ───────── Overlay CSS (modals) ───────── */
const OVERLAY_CSS = `
  .ax-modal {
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(15, 23, 42, 0.65);
    backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
  }
  .ax-modal__backdrop {
    position: fixed; inset: 0; background: transparent;
  }
  .ax-modal__dialog {
    position: relative; z-index: 1; background: #ffffff;
    border-radius: 16px; border: 1px solid var(--ax-border, #e2e8f0);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    overflow: hidden; width: 100%;
  }
  .ax-modal__header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 24px; border-bottom: 1px solid var(--ax-border, #e2e8f0);
    background: var(--ax-surface-subtle, #f8fafc);
  }
  .ax-modal__close {
    width: 32px; height: 32px; padding: 0; border-radius: 50%;
    border: none; background: transparent; cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center;
    color: var(--ax-text-muted, #64748b); font-size: 15px; font-weight: 700;
    transition: all 0.15s ease;
  }
  .ax-modal__close:hover {
    background: var(--ax-surface-hover, #e2e8f0);
    color: var(--ax-text-strong, #0f172a);
  }
  .ax-modal__body { padding: 24px; overflow-y: auto; max-height: calc(85vh - 120px); }
  .ax-modal__footer {
    display: flex; align-items: center; justify-content: flex-end; gap: 10px;
    padding: 16px 24px; border-top: 1px solid var(--ax-border, #e2e8f0);
    background: var(--ax-surface-subtle, #f8fafc);
  }
`;

const actionsRowStyle = { gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', width: '100%' } as const;

/* ───────── KPI card ───────── */
type KpiTone = 'accent' | 'cyan' | 'emerald' | 'amber';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(var(--ax-accent-rgb), 0.12)', fg: 'var(--ax-accent)' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan) 14%, transparent)', fg: 'var(--ax-viz-cyan)' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald) 14%, transparent)', fg: 'var(--ax-viz-emerald)' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber) 14%, transparent)', fg: 'var(--ax-viz-amber)' },
};

const svgIcon = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);

const ICONS = {
  doc: svgIcon(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M9 15l2 2 4-4" /></>),
  check: svgIcon(<><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" /></>),
  shield: svgIcon(<><path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" /><path d="M9 12l2 2 4-4" /></>),
  clock: svgIcon(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>),
  cross: svgIcon(<><circle cx="12" cy="12" r="9" /><path d="M9 9l6 6" /><path d="M15 9l-6 6" /></>),
  coin: svgIcon(<><circle cx="12" cy="12" r="9" /><path d="M9 8h6" /><path d="M9 12h6" /><path d="M10 8c4 0 4 4 0 4l4 4" /></>),
};
type IconKey = keyof typeof ICONS;

function KpiCard({ icon, tone, label, value, sub }: { icon: ReactNode; tone: KpiTone; label: string; value: ReactNode; sub?: string }) {
  const t = TONE[tone];
  return (
    <div className="ax-card ax-col--3" style={{ padding: '14px 18px', borderRadius: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ width: 28, height: 28, borderRadius: 8, background: t.bg, color: t.fg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ width: 15, height: 15, display: 'inline-flex' }}>{icon}</span>
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)', letterSpacing: '0.04em' }}>{label}</span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: t.fg, marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

const X_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 18, height: 18 }}>
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 640,
  dialogStyle,
  labelledBy,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: number;
  dialogStyle?: CSSProperties;
  labelledBy?: string;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="ax-modal" role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
      <div className="ax-modal__backdrop" onClick={onClose} />
      <div
        ref={dialogRef}
        className="ax-modal__dialog"
        style={{
          maxWidth,
          width: '92%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          ...dialogStyle,
        }}
      >
        <div className="ax-modal__header">
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--ax-text-strong)' }}>{title}</h3>
            {subtitle && <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--ax-text-muted)' }}>{subtitle}</p>}
          </div>
          <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">
            {X_ICON}
          </button>
        </div>
        <div className="ax-modal__body">{children}</div>
        {footer && <div className="ax-modal__footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

const REFRESH_ICON = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
    <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
  </svg>
);

const TABS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

export function ClaimRequests() {
  const [claims, setClaims] = useState<Row[]>([]);
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterKey>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Verify action modal
  const [targetClaim, setTargetClaim] = useState<Row | null>(null);
  const [actionStatus, setActionStatus] = useState<'2' | '3'>('2');
  const [remarks, setRemarks] = useState('');
  const [modalError, setModalError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Invoice modal
  const [previewInvoice, setPreviewInvoice] = useState<string | null>(null);

  // Payment Details modal state
  const [paymentModalClaim, setPaymentModalClaim] = useState<Row | null>(null);
  const [loadingPaymentDetails, setLoadingPaymentDetails] = useState<boolean>(false);
  const [paymentDetailsData, setPaymentDetailsData] = useState<any>(null);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await kashmirAdminService.getViewExpenses();
      const d = (res?.data || {}) as any;
      setClaims(Array.isArray(d.claims) ? d.claims : []);
      setDetails(d.claim_details || null);
    } catch (err: any) {
      console.error('Failed to load Kashmir expenses claim requests:', err);
      setErrorMsg(err?.message || 'Failed to fetch expense claim requests.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  useEffect(() => {
    if (!successMsg) return;
    const t = window.setTimeout(() => setSuccessMsg(''), 4000);
    return () => window.clearTimeout(t);
  }, [successMsg]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return claims.filter((r) => {
      if (statusFilter !== 'all' && claimState(r) !== statusFilter) return false;
      if (!q) return true;
      return [
        r.state,
        r.vendor_name,
        r.district,
        r.site_name,
        r.purpose,
        r.amount,
        r.approved_remarks,
      ].some((v) => String(v ?? '').toLowerCase().includes(q));
    });
  }, [claims, search, statusFilter]);

  const paged = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const hasFilters = !!search;
  const clearFilters = () => {
    setSearch('');
    setCurrentPage(1);
  };

  const openVerify = (row: Row) => {
    setTargetClaim(row);
    setActionStatus('2');
    setRemarks('');
    setModalError('');
  };

  const handleSubmitAction = async () => {
    if (!targetClaim) return;
    setSubmitting(true);
    setModalError('');
    try {
      const res = await kashmirAdminService.verifyExpensesClaimStatus(
        targetClaim.id,
        Number(actionStatus),
        remarks || undefined
      );
      setSuccessMsg(res?.message || 'Status Updated Successfully!!!');
      setTargetClaim(null);
      await fetchExpenses();
    } catch (err: any) {
      console.error('Verify expenses claim error:', err);
      setModalError(err?.message || 'Failed to update expense claim status.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadFile = async (row: Row) => {
    if (!row.file) {
      alert('No invoice or supporting document file available for this claim.');
      return;
    }
    const fileUrl = resolveKashmirMediaUrl(row.file);
    try {
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error('Fetch failed');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      const cleanFileName = row.file.split('/').pop() || `Expense_Claim_${row.id}_Document`;
      a.download = cleanFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      const a = document.createElement('a');
      a.href = fileUrl;
      a.download = row.file.split('/').pop() || `Expense_Claim_${row.id}_Document`;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleOpenPaymentDetails = async (row: Row) => {
    setPaymentModalClaim(row);
    setLoadingPaymentDetails(true);
    setPaymentDetailsData(null);
    try {
      const res = await kashmirAdminService.getExpensesPaymentDetails(row.id);
      const d = res?.data || res;
      setPaymentDetailsData(d);
    } catch (err) {
      console.warn('Could not load extra payment details from API:', err);
      setPaymentDetailsData(null);
    } finally {
      setLoadingPaymentDetails(false);
    }
  };

  const computedPayment = useMemo(() => {
    if (!paymentModalClaim) {
      return { total: 0, paid: 0, balance: 0, payStatus: 'Pending', installments: [] as ExpensePaymentSubItem[] };
    }
    const total = parseFloat(String(paymentModalClaim.amount || 0)) || 0;

    const installments: ExpensePaymentSubItem[] =
      (Array.isArray(paymentDetailsData?.payments?.[0]?.allpayment) && paymentDetailsData.payments[0].allpayment) ||
      (Array.isArray(paymentDetailsData?.allpayment) && paymentDetailsData.allpayment) ||
      (Array.isArray(paymentModalClaim.allpayment) && paymentModalClaim.allpayment) ||
      [];

    const installmentPaid = installments.reduce(
      (sum, p) => sum + (parseFloat(String(p.amount || 0)) || 0),
      0
    );

    const paymentAmount =
      paymentDetailsData?.payments?.[0]?.pay_amount != null
        ? Number(paymentDetailsData.payments[0].pay_amount)
        : paymentModalClaim.payment_amount != null
        ? Number(paymentModalClaim.payment_amount)
        : installmentPaid;

    const paid = paymentAmount > 0 ? paymentAmount : installmentPaid;
    const balance = Math.max(0, total - paid);

    let payStatus = 'Pending';
    const rawStatus =
      paymentDetailsData?.payments?.[0]?.pay_status ??
      paymentModalClaim.pay_status ??
      paymentModalClaim.payment_status;

    if (rawStatus === 1 || rawStatus === '1' || (paid >= total && total > 0)) {
      payStatus = 'Complete';
    } else if (rawStatus === 2 || rawStatus === '2' || paid > 0) {
      payStatus = 'Partially';
    }

    return { total, paid, balance, payStatus, installments };
  }, [paymentModalClaim, paymentDetailsData]);

  const exportCols: ExportColumn<Row>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r, idx) => (idx !== undefined ? idx + 1 : '') },
      { header: 'State', accessor: (r) => r.state || 'Kashmir' },
      { header: 'Vendor', accessor: (r) => r.vendor_name || DASH },
      { header: 'Claim Date', accessor: (r) => fmtDate(r.date) },
      { header: 'District', accessor: (r) => r.district || DASH },
      { header: 'Claim Count', accessor: (r) => r.claim_count ?? 1 },
      { header: 'Site Name', accessor: (r) => r.site_name || DASH },
      { header: 'Purpose', accessor: (r) => r.purpose || DASH },
      { header: 'Claim Amount', accessor: (r) => fmtMoney(r.amount) },
      { header: 'Claim Update Date', accessor: (r) => fmtDate(r.approved_date) },
      { header: 'Claim Status', accessor: (r) => claimStatusLabel(claimState(r)) },
      { header: 'Claim Verify Remarks', accessor: (r) => txt(r.approved_remarks) },
    ],
    []
  );

  const handleCopy = () => copyTableDataToClipboard(filtered, exportCols);
  const handleCsv = () => exportDataToCSV('Kashmir_Expense_Claims', filtered, exportCols);
  const handleExcel = () => exportDataToExcel('Kashmir_Expense_Claims', filtered, exportCols);
  const handlePdf = () => printTableData('View Expenses Claim Request', filtered, exportCols);

  const colCount = 14;
  const tabCount = (k: FilterKey) => (k === 'all' ? claims.length : claims.filter((c) => claimState(c) === k).length);
  const num = (v: unknown) => Number(v ?? 0).toLocaleString('en-IN');

  const kpiCards: { label: string; value: unknown; tone: KpiTone; icon: IconKey; sub: string }[] = [
    { label: 'Total Claims', value: details?.total ?? claims.length, tone: 'accent', icon: 'doc', sub: 'expense claims raised' },
    { label: 'Claim Approved', value: details?.claim_approved, tone: 'emerald', icon: 'check', sub: 'approved claims' },
    { label: 'Claim Pending', value: details?.claim_pending, tone: 'amber', icon: 'clock', sub: 'awaiting decision' },
    { label: 'Claim Reject', value: details?.claim_reject, tone: 'cyan', icon: 'cross', sub: 'rejected claims' },
  ];

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      <PageHead
        title="View Expenses Claim Request"
        subtitle="Review and verify expense claims submitted by vendors for Kashmir SRT 70MW sites"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'View Expenses Claim Request', href: '/vendor-management/kashmir/srt70mw/expense/claim-requests' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)', alignItems: 'center' }}>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={fetchExpenses} disabled={loading}>
              {REFRESH_ICON}
              <span className="ax-btn__label">Refresh</span>
            </button>
          </div>
        }
      />

      {errorMsg && !loading && (
        <div className="ax-alert ax-alert--danger" role="alert" style={{ marginBottom: 16 }}>
          <div className="ax-alert__content">{errorMsg}</div>
          <button type="button" className="ax-btn ax-btn--ghost ax-btn--xs" onClick={() => setErrorMsg('')}>✕</button>
        </div>
      )}
      {successMsg && (
        <div className="ax-alert ax-alert--success" role="status" style={{ marginBottom: 16 }}>
          <div className="ax-alert__content">{successMsg}</div>
          <button type="button" className="ax-btn ax-btn--ghost ax-btn--xs" onClick={() => setSuccessMsg('')}>✕</button>
        </div>
      )}

      <div className="ax-dash-grid">
        {/* ── KPI Row ── */}
        {loading ? (
          <KpiSkeleton count={4} />
        ) : (
          kpiCards.map((k) => (
            <KpiCard key={k.label} tone={k.tone} label={k.label} value={num(k.value)} sub={k.sub} icon={ICONS[k.icon]} />
          ))
        )}

        {/* ── Filter Tabs ── */}
        <div className="ax-col--12">
          <div className="ax-cluster" role="tablist" aria-label="Expense claim status tabs" style={{ gap: 'var(--ax-space-2)' }}>
            {TABS.map((t) => {
              const active = t.key === statusFilter;
              return (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={`ax-btn ax-btn--sm ${active ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
                  onClick={() => {
                    setStatusFilter(t.key);
                    setCurrentPage(1);
                  }}
                >
                  <span className="ax-btn__label">{t.label} ({loading ? '…' : tabCount(t.key)})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Main Table Card ── */}
        <section className="ax-card ax-col--12" role="region" aria-label="Expense claim requests">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">View Expenses Claim Request</h2>
              <p className="ax-card__subtitle">
                <span className="ax-num">{filtered.length}</span> of <span className="ax-num">{claims.length}</span> claim records
              </p>
            </div>

            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                {hasFilters && (
                  <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" onClick={clearFilters} style={{ height: 30, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }}>
                    Reset
                  </button>
                )}
                <SearchInput
                  value={search}
                  onChange={(val) => {
                    setSearch(val);
                    setCurrentPage(1);
                  }}
                  placeholder="Search vendor, site, purpose, amount…"
                  size="sm"
                  ariaLabel="Search expense claims"
                />
                <TableExportToolbar onCopy={handleCopy} onExportCSV={handleCsv} onExportExcel={handleExcel} onExportPDF={handlePdf} />
              </div>
            </div>
          </div>

          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap' }}>
              <caption className="ax-visually-hidden">Expense claim requests</caption>
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">Sr. No.</th>
                  <th className="ax-table__th" scope="col">State</th>
                  <th className="ax-table__th" scope="col">Vendor</th>
                  <th className="ax-table__th" scope="col">Claim Date</th>
                  <th className="ax-table__th" scope="col">District</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Claim Count</th>
                  <th className="ax-table__th" scope="col">Site Name</th>
                  <th className="ax-table__th" scope="col">Purpose</th>
                  <th className="ax-table__th" scope="col">Claim Invoice</th>
                  <th className="ax-table__th" scope="col">Claim Amount</th>
                  <th className="ax-table__th" scope="col">Claim Update Date</th>
                  <th className="ax-table__th" scope="col">Claim Status</th>
                  <th className="ax-table__th" scope="col">Claim Verify Remarks</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center', minWidth: 210 }}>Action</th>
                </tr>
              </thead>
              <tbody aria-busy={loading}>
                {loading && (
                  <tr>
                    <td colSpan={colCount} style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--ax-text-muted)' }}>
                      <span className="ax-spinner" style={{ width: 20, height: 20, marginRight: 8, verticalAlign: 'middle' }} />
                      Loading expense claims from server…
                    </td>
                  </tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={colCount} style={{ padding: 0 }}>
                      <TableEmptyState
                        title="No expense claims found"
                        message={hasFilters ? 'No claims match your search. Try clearing the search term.' : 'No expense claim requests found under this category.'}
                        onClear={hasFilters ? clearFilters : undefined}
                        clearLabel="Clear filters"
                      />
                    </td>
                  </tr>
                )}
                {!loading &&
                  paged.map((row, idx) => {
                    const srNo = (currentPage - 1) * pageSize + idx + 1;
                    const st = claimState(row);
                    return (
                      <tr key={row.id ?? idx} className="ax-table__row">
                        <td className="ax-table__td ax-num">{srNo}</td>
                        <td className="ax-table__td">{row.state || 'Kashmir'}</td>
                        <td className="ax-table__td" style={{ fontWeight: 600 }}>{txt(row.vendor_name)}</td>
                        <td className="ax-table__td">{fmtDate(row.date)}</td>
                        <td className="ax-table__td">{txt(row.district)}</td>
                        <td className="ax-table__td ax-num" style={{ textAlign: 'center', fontWeight: 600 }}>{row.claim_count ?? 1}</td>
                        <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>{txt(row.site_name)}</td>
                        <td className="ax-table__td" style={{ maxWidth: 200, whiteSpace: 'normal', fontSize: 12 }}>{txt(row.purpose)}</td>
                        <td className="ax-table__td">
                          {row.file ? (
                            <button
                              type="button"
                              className="ax-btn ax-btn--secondary ax-btn--sm"
                              onClick={() => setPreviewInvoice(resolveKashmirMediaUrl(row.file))}
                            >
                              View Invoice
                            </button>
                          ) : (
                            DASH
                          )}
                        </td>
                        <td className="ax-table__td ax-num" style={{ fontWeight: 600 }}>{fmtMoney(row.amount)}</td>
                        <td className="ax-table__td">{fmtDate(row.approved_date)}</td>
                        <td className="ax-table__td">
                          <span className={`ax-badge ax-badge--soft ax-badge--pill ax-badge--${claimStatusTone(st)}`}>
                            <span className="ax-badge__dot" />
                            {claimStatusLabel(st)}
                          </span>
                        </td>
                        <td className="ax-table__td" style={{ maxWidth: 180, whiteSpace: 'normal', fontSize: 12 }}>{txt(row.approved_remarks)}</td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
                            <button
                              type="button"
                              className="ax-btn ax-btn--secondary ax-btn--sm"
                              onClick={() => handleDownloadFile(row)}
                              disabled={!row.file}
                              title={row.file ? 'Download Claim Document / Invoice' : 'No document uploaded'}
                              style={{
                                padding: '4px 10px',
                                fontSize: 12,
                                fontWeight: 600,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                opacity: row.file ? 1 : 0.5,
                                cursor: row.file ? 'pointer' : 'not-allowed',
                              }}
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 13, height: 13 }}>
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                              </svg>
                              <span>Download</span>
                            </button>
                            <button
                              type="button"
                              className="ax-btn ax-btn--primary ax-btn--sm"
                              onClick={() => handleOpenPaymentDetails(row)}
                              title="View Payment Details"
                              style={{
                                padding: '4px 10px',
                                fontSize: 12,
                                fontWeight: 600,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                              }}
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 13, height: 13 }}>
                                <rect x="2" y="5" width="20" height="14" rx="2" />
                                <line x1="2" y1="10" x2="22" y2="10" />
                              </svg>
                              <span>Payment Details</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          <div className="ax-card__footer">
            <div className="ula-pagination-left">
              <Pagination
                currentPage={currentPage}
                pageSize={pageSize}
                totalItems={filtered.length}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                pageSizeOptions={[10, 25, 50, 100]}
              />
            </div>
          </div>
        </section>
      </div>

      {/* ── Modal: Verify Expense Claim ── */}
      <Modal
        open={!!targetClaim}
        onClose={() => setTargetClaim(null)}
        labelledBy="ksrt-expense-verify-title"
        title="Verify Expense Claim"
        subtitle={targetClaim ? `Vendor: ${txt(targetClaim.vendor_name)} · Claim ID: #${targetClaim.id}` : undefined}
        maxWidth={580}
        footer={
          <>
            <button
              type="button"
              className="ax-btn ax-btn--secondary"
              onClick={() => setTargetClaim(null)}
              disabled={submitting}
              style={{ borderRadius: 8, padding: '8px 16px', fontWeight: 600 }}
            >
              Cancel
            </button>
            <button
              type="button"
              className={`ax-btn ${actionStatus === '2' ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
              onClick={handleSubmitAction}
              disabled={submitting}
              style={{
                borderRadius: 8,
                padding: '8px 20px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                ...(actionStatus === '3' ? { color: '#ef4444', borderColor: '#ef4444', background: '#fef2f2' } : {}),
              }}
            >
              {submitting && (
                <span
                  style={{
                    width: 14,
                    height: 14,
                    border: '2px solid currentColor',
                    borderRightColor: 'transparent',
                    borderRadius: '50%',
                    display: 'inline-block',
                    animation: 'spin 0.75s linear infinite',
                  }}
                />
              )}
              {submitting ? 'Updating...' : actionStatus === '2' ? 'Approve Claim' : 'Reject Claim'}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {modalError && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: 8,
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#991b1b',
                fontSize: 13,
                fontWeight: 500,
              }}
              role="alert"
            >
              {modalError}
            </div>
          )}

          {targetClaim && (
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: 16,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Expense Summary</span>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '3px 10px',
                    borderRadius: 9999,
                    fontSize: 12,
                    fontWeight: 700,
                    background: '#eff6ff',
                    color: '#2563eb',
                  }}
                >
                  {fmtMoney(targetClaim.amount)}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px 16px', fontSize: 13 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Vendor</div>
                  <div style={{ fontWeight: 600, color: '#1e293b', marginTop: 2 }}>{txt(targetClaim.vendor_name)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Site Name</div>
                  <div style={{ fontWeight: 600, color: '#1e293b', marginTop: 2 }}>{txt(targetClaim.site_name)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>District</div>
                  <div style={{ fontWeight: 600, color: '#1e293b', marginTop: 2 }}>{txt(targetClaim.district)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Claim Date</div>
                  <div style={{ fontWeight: 600, color: '#1e293b', marginTop: 2 }}>{fmtDate(targetClaim.date)}</div>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Purpose</div>
                  <div style={{ fontWeight: 500, color: '#334155', marginTop: 2 }}>{txt(targetClaim.purpose)}</div>
                </div>
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
              Claim Decision <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              className="ax-select"
              value={actionStatus}
              onChange={(e) => setActionStatus(e.target.value as '2' | '3')}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: 14,
                fontWeight: 600,
                background: '#ffffff',
                color: actionStatus === '2' ? '#166534' : '#991b1b',
              }}
            >
              <option value="2">Approve Claim</option>
              <option value="3">Reject Claim</option>
            </select>
          </div>

          <div>
            <label htmlFor="expenseRemarks" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
              Verification Remarks {actionStatus === '3' && <span style={{ color: '#ef4444' }}>* (Required on Rejection)</span>}
            </label>
            <textarea
              id="expenseRemarks"
              className="ax-textarea"
              rows={3}
              placeholder={actionStatus === '3' ? 'Please specify reason for rejecting this claim...' : 'Enter approval notes or remarks (optional)...'}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              style={{ width: '100%', borderRadius: 8, border: '1px solid #cbd5e1', padding: '10px 12px', fontSize: 13, resize: 'vertical' }}
            />
          </div>
        </div>
      </Modal>

      {/* ── Modal: Invoice Preview ── */}
      <Modal
        open={!!previewInvoice}
        onClose={() => setPreviewInvoice(null)}
        labelledBy="ksrt-expense-invoice-title"
        title="Expense Invoice Preview"
        subtitle="Supporting document uploaded with the expense claim"
        maxWidth={860}
        footer={
          <>
            <a
              href={previewInvoice || '#'}
              target="_blank"
              rel="noreferrer"
              className="ax-btn ax-btn--secondary"
              style={{ borderRadius: 8, padding: '7px 14px', textDecoration: 'none', fontWeight: 600, fontSize: 13 }}
            >
              Open in new tab ↗
            </a>
            <button
              type="button"
              className="ax-btn ax-btn--primary"
              onClick={() => setPreviewInvoice(null)}
              style={{ borderRadius: 8, padding: '7px 18px', fontWeight: 600 }}
            >
              Close
            </button>
          </>
        }
      >
        {previewInvoice && (
          <div style={{ minHeight: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {previewInvoice.match(/\.(jpg|jpeg|png|webp|gif)$/i) ? (
              <img
                src={previewInvoice}
                alt="Expense Invoice"
                style={{
                  maxWidth: '100%',
                  maxHeight: '65vh',
                  objectFit: 'contain',
                  borderRadius: 10,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                }}
              />
            ) : previewInvoice.match(/\.pdf$/i) ? (
              <iframe
                src={previewInvoice}
                title="Expense Invoice PDF"
                style={{
                  width: '100%',
                  height: '65vh',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                }}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: 32 }}>
                <p style={{ color: '#64748b', fontSize: 14, marginBottom: 12 }}>
                  Direct preview is not available for this file type.
                </p>
                <a
                  href={previewInvoice}
                  target="_blank"
                  rel="noreferrer"
                  className="ax-btn ax-btn--primary ax-btn--sm"
                  style={{ borderRadius: 8 }}
                >
                  Download or View in New Tab ↗
                </a>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ── Modal: Payment Details ── */}
      <Modal
        open={!!paymentModalClaim}
        onClose={() => setPaymentModalClaim(null)}
        labelledBy="ksrt-payment-details-title"
        title="Payment Details"
        subtitle={
          paymentModalClaim
            ? `Vendor: ${txt(paymentModalClaim.vendor_name)} · Site: ${txt(paymentModalClaim.site_name)} (Claim #${paymentModalClaim.id})`
            : undefined
        }
        maxWidth={720}
        footer={
          <div style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div>
              {paymentModalClaim?.file ? (
                <button
                  type="button"
                  className="ax-btn ax-btn--secondary ax-btn--sm"
                  onClick={() => handleDownloadFile(paymentModalClaim)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 14, height: 14 }}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  <span>Download Invoice</span>
                </button>
              ) : null}
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button
                type="button"
                className="ax-btn ax-btn--ghost ax-btn--sm"
                onClick={() => {
                  if (paymentModalClaim) {
                    openVerify(paymentModalClaim);
                  }
                }}
                style={{ fontSize: 13, fontWeight: 600 }}
              >
                Verify Claim Decision ↗
              </button>
              <button
                type="button"
                className="ax-btn ax-btn--primary ax-btn--sm"
                onClick={() => setPaymentModalClaim(null)}
                style={{ padding: '6px 18px', fontWeight: 600 }}
              >
                Close
              </button>
            </div>
          </div>
        }
      >
        {paymentModalClaim && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Top Info Banner */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: '16px 18px',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px 20px', fontSize: 13 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Vendor Name</div>
                  <div style={{ fontWeight: 600, color: '#0f172a', marginTop: 2 }}>{txt(paymentModalClaim.vendor_name)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>District & Site</div>
                  <div style={{ fontWeight: 600, color: '#0f172a', marginTop: 2 }}>{txt(paymentModalClaim.district)} — {txt(paymentModalClaim.site_name)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Claim Date</div>
                  <div style={{ fontWeight: 500, color: '#334155', marginTop: 2 }}>{fmtDate(paymentModalClaim.date)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Claim Approval Status</div>
                  <div style={{ marginTop: 2 }}>
                    <span className={`ax-badge ax-badge--soft ax-badge--pill ax-badge--${claimStatusTone(claimState(paymentModalClaim))}`}>
                      <span className="ax-badge__dot" />
                      {claimStatusLabel(claimState(paymentModalClaim))}
                    </span>
                  </div>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Purpose</div>
                  <div style={{ fontWeight: 500, color: '#334155', marginTop: 2 }}>{txt(paymentModalClaim.purpose)}</div>
                </div>
              </div>
            </div>

            {/* Financial Highlights */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
              <div style={{ padding: '12px 14px', borderRadius: 10, background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase' }}>Claim Amount</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#1e40af', marginTop: 4 }}>₹ {computedPayment.total.toLocaleString('en-IN')}</div>
              </div>
              <div style={{ padding: '12px 14px', borderRadius: 10, background: '#ecfdf5', border: '1px solid #a7f3d0' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#047857', textTransform: 'uppercase' }}>Paid Amount</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#065f46', marginTop: 4 }}>₹ {computedPayment.paid.toLocaleString('en-IN')}</div>
              </div>
              <div style={{ padding: '12px 14px', borderRadius: 10, background: '#fffbeb', border: '1px solid #fde68a' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#b45309', textTransform: 'uppercase' }}>Balance Pending</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#92400e', marginTop: 4 }}>₹ {computedPayment.balance.toLocaleString('en-IN')}</div>
              </div>
              <div style={{ padding: '12px 14px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Pay Status</div>
                <div style={{ marginTop: 4 }}>
                  <span
                    className={`ax-badge ax-badge--soft ${
                      computedPayment.payStatus === 'Complete'
                        ? 'ax-badge--success'
                        : computedPayment.payStatus === 'Partially'
                        ? 'ax-badge--info'
                        : 'ax-badge--warning'
                    }`}
                    style={{ fontWeight: 700, fontSize: 12 }}
                  >
                    {computedPayment.payStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* Installments Table */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--ax-text-strong)' }}>
                  Disbursement Installments History
                </h4>
                {loadingPaymentDetails && (
                  <span style={{ fontSize: 12, color: 'var(--ax-text-muted)' }}>
                    <span className="ax-spinner" style={{ width: 12, height: 12, marginRight: 6 }} /> Updating history…
                  </span>
                )}
              </div>

              {loadingPaymentDetails && computedPayment.installments.length === 0 ? (
                <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--ax-text-muted)', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <span className="ax-spinner" style={{ width: 18, height: 18, marginRight: 8, verticalAlign: 'middle' }} />
                  Loading payment history records…
                </div>
              ) : computedPayment.installments.length === 0 ? (
                <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--ax-text-muted)', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}>
                  No payment disbursements recorded yet for this claim request.
                </div>
              ) : (
                <div className="ax-table-wrap" style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                  <table className="ax-table ax-table--hover" style={{ width: '100%', whiteSpace: 'nowrap', fontSize: 12.5 }}>
                    <thead className="ax-table__head" style={{ background: '#f1f5f9' }}>
                      <tr>
                        <th className="ax-table__th" style={{ width: 45 }}>#</th>
                        <th className="ax-table__th">Payment Date</th>
                        <th className="ax-table__th">Disbursed Amount</th>
                        <th className="ax-table__th">Balance Left</th>
                        <th className="ax-table__th">Remarks / UTR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {computedPayment.installments.map((item, idx) => (
                        <tr key={item.id || idx} className="ax-table__row">
                          <td className="ax-table__td" style={{ fontWeight: 600 }}>{idx + 1}</td>
                          <td className="ax-table__td">{fmtDate(item.date)}</td>
                          <td className="ax-table__td" style={{ fontWeight: 700, color: '#16a34a' }}>
                            ₹ {Number(item.amount || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="ax-table__td" style={{ fontWeight: 700, color: '#d97706' }}>
                            ₹ {Number(item.balance || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="ax-table__td" style={{ maxWidth: 220, whiteSpace: 'normal' }}>
                            {txt(item.pay_remarks || item.remarks)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default ClaimRequests;