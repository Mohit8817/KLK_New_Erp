import { useEffect, useMemo, useRef, useState, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  Pagination,
  usePagination,
  SearchInput,
  TableExportToolbar,
  TableEmptyState,
  type ExportColumn,
} from '../../../../../common';
import {
  jammuAdminSwpService,
  resolveJammuSwpMediaUrl,
  type JammuSwpPaymentRecord,
} from './jammuSwpAdminService';

const num = (x: number | string | undefined | null) => Number(x || 0).toLocaleString('en-IN');

/* ───────── Responsive page CSS (Exact Solar ERP reference) ───────── */
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

  .solar-erp-page .asw-filter-card {
    background: var(--ax-surface, #ffffff);
    border: 1px solid var(--ax-border, #e2e8f0);
    border-radius: 12px;
    padding: 16px 20px;
    margin-bottom: 20px;
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

  .solar-erp-page .ax-table-wrap,
  .solar-erp-page .ax-table-wrapper {
    width: 100%;
    max-width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  .solar-erp-page .ax-table { min-width: 950px; }

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
    .solar-erp-page {
      width: 100%;
      max-width: 100%;
      overflow-x: hidden;
      box-sizing: border-box;
    }
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
    .solar-erp-page .ax-export-toolbar__button {
      font-size: 11px;
      height: 28px;
      padding: 0 6px !important;
    }
    .solar-erp-page .ax-export-toolbar { gap: 4px; }
  }
`;

/* ───────── Overlay CSS (modals & lightbox) ───────── */
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
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: number;
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
    <div className="ax-modal" role="dialog" aria-modal="true">
      <div className="ax-modal__backdrop" onClick={onClose} />
      <div
        ref={dialogRef}
        className="ax-modal__dialog"
        style={{ maxWidth, width: '92%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
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
        <div className="ax-modal__body">
          {children}
        </div>
        {footer && <div className="ax-modal__footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

/* ───────── Top KPI Card Component ───────── */
type KpiTone = 'accent' | 'emerald' | 'cyan' | 'amber';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(37, 99, 235, 0.12)', fg: '#2563eb' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald, #10b981) 14%, transparent)', fg: '#16a34a' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan, #06b6d4) 14%, transparent)', fg: '#0891b2' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber, #f59e0b) 14%, transparent)', fg: '#d97706' },
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
    <div className="ax-card" style={{ padding: '14px 18px', borderRadius: 12, minWidth: 0, background: '#ffffff', border: '1px solid #e2e8f0' }}>
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
          {icon}
        </span>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ax-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--ax-text-strong)', fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', marginTop: 2 }}>{sub}</div>
    </div>
  );
}

export function ViewSwpPayment() {
  const [payments, setPayments] = useState<JammuSwpPaymentRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [vendorFilter, setVendorFilter] = useState<string>('all');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  // Disburse modal
  const [disburseModalOpen, setDisburseModalOpen] = useState<boolean>(false);
  const [activePayment, setActivePayment] = useState<JammuSwpPaymentRecord | null>(null);
  const [payAmount, setPayAmount] = useState<string>('');
  const [utrNo, setUtrNo] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<string>('NEFT');
  const [disburseRemarks, setDisburseRemarks] = useState<string>('');
  const [disbursing, setDisbursing] = useState<boolean>(false);

  // Details modal
  const [detailModalOpen, setDetailModalOpen] = useState<boolean>(false);
  const [detailItem, setDetailItem] = useState<JammuSwpPaymentRecord | null>(null);

  // Fetch payments
  const loadData = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const res = await jammuAdminSwpService.getPayments();
      setPayments(res.payments || []);
    } catch (err: any) {
      setApiError(err.message || 'Failed to load payment disbursement records.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Open disburse modal
  const openDisburseModal = (item: JammuSwpPaymentRecord) => {
    setActivePayment(item);
    setPayAmount(String(item.balance_amount || item.claim_amount));
    setUtrNo('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentMode('NEFT');
    setDisburseRemarks('');
    setDisburseModalOpen(true);
  };

  // Submit disbursement
  const handleDisburseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePayment) return;
    if (!payAmount || Number(payAmount) <= 0) {
      alert('Please enter a valid disbursement amount.');
      return;
    }
    if (!utrNo.trim()) {
      alert('Please enter UTR or Transaction Reference number.');
      return;
    }

    setDisbursing(true);
    try {
      const amountNum = Number(payAmount);
      await jammuAdminSwpService.disbursePayment({
        id: activePayment.id,
        amount: amountNum,
        utr_no: utrNo,
        payment_date: paymentDate,
        payment_mode: paymentMode,
        remarks: disburseRemarks,
      });

      // Update state
      setPayments((prev) =>
        prev.map((p) => {
          if (p.id === activePayment.id) {
            const newPaid = p.paid_amount + amountNum;
            const newBal = Math.max(0, p.claim_amount - newPaid);
            const newStatus = newBal === 0 ? 3 : 2;
            return {
              ...p,
              paid_amount: newPaid,
              balance_amount: newBal,
              status: newStatus,
              utr_no: utrNo,
              payment_date: paymentDate,
              payment_mode: paymentMode,
            };
          }
          return p;
        })
      );
      setDisburseModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Disbursement action failed.');
    } finally {
      setDisbursing(false);
    }
  };

  // Filtered dataset
  const filteredPayments = useMemo(() => {
    return payments.filter((item) => {
      const st = Number(item.status);
      if (statusFilter === 'complete' && st !== 3) return false;
      if (statusFilter === 'partial' && st !== 2) return false;
      if (statusFilter === 'pending' && st !== 1) return false;

      if (vendorFilter !== 'all') {
        if ((item.vendor || '').toLowerCase() !== vendorFilter.toLowerCase()) return false;
      }

      if (fromDate && item.payment_date && item.payment_date < fromDate) return false;
      if (toDate && item.payment_date && item.payment_date > toDate) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        String(item.id).includes(q) ||
        (item.vendor || '').toLowerCase().includes(q) ||
        (item.claim_no || '').toLowerCase().includes(q) ||
        (item.utr_no || '').toLowerCase().includes(q) ||
        String(item.claim_amount).includes(q)
      );
    });
  }, [payments, statusFilter, vendorFilter, fromDate, toDate, searchQuery]);

  // Pagination
  const pagination = usePagination({
    totalItems: filteredPayments.length,
    initialPageSize: 10,
  });

  const pagedPayments = useMemo(() => {
    const start = (pagination.currentPage - 1) * pagination.pageSize;
    return filteredPayments.slice(start, start + pagination.pageSize);
  }, [filteredPayments, pagination.currentPage, pagination.pageSize]);

  // KPI calculations
  const totalAmountRequested = useMemo(
    () => payments.reduce((acc, curr) => acc + (Number(curr.claim_amount) || 0), 0),
    [payments]
  );
  const totalAmountDisbursed = useMemo(
    () => payments.reduce((acc, curr) => acc + (Number(curr.paid_amount) || 0), 0),
    [payments]
  );
  const totalBalanceDue = useMemo(
    () => payments.reduce((acc, curr) => acc + (Number(curr.balance_amount) || 0), 0),
    [payments]
  );
  const completedCount = payments.filter((p) => Number(p.status) === 3).length;

  const vendorOptions = useMemo(
    () => [...new Set(payments.map((p) => p.vendor).filter(Boolean))].sort(),
    [payments]
  );

  // Export Columns
  const exportColumns: ExportColumn[] = useMemo(
    () => [
      { key: 'id', header: 'Payment ID' },
      { key: 'vendor', header: 'Vendor Name' },
      { key: 'claim_no', header: 'Claim Ref' },
      { key: 'total_sites', header: 'Sites' },
      { key: 'claim_amount', header: 'Claim Amount (₹)' },
      { key: 'paid_amount', header: 'Paid Amount (₹)' },
      { key: 'balance_amount', header: 'Balance (₹)' },
      { key: 'utr_no', header: 'UTR / Ref' },
      { key: 'payment_date', header: 'Payment Date' },
      { key: 'payment_mode', header: 'Payment Mode' },
    ],
    []
  );

  return (
    <div className="solar-erp-page ax-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* Page Header */}
      <PageHead
        eyebrow="Super Admin · Vendor Management"
        title="Jammu SWP Payment & Disbursement Register"
        subtitle="Tracking solar water pump milestone disbursements, RTGS/NEFT transaction references, and settlement accounts in Jammu & Kashmir."
      />

      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" style={{ marginBottom: 16 }}>
        <ol className="ax-breadcrumb" style={{ display: 'flex', gap: 6, listStyle: 'none', padding: 0, margin: 0, fontSize: 13, color: 'var(--ax-text-muted)' }}>
          <li><Link to="/vendor-management" style={{ color: '#2563eb' }}>Home</Link></li>
          <li>/</li>
          <li><Link to="/vendor-management" style={{ color: '#2563eb' }}>Vendor Management</Link></li>
          <li>/</li>
          <li><Link to="/vendor-management/jammu" style={{ color: '#2563eb' }}>Jammu</Link></li>
          <li>/</li>
          <li><Link to="/vendor-management/jammu/installation/swp/dashboard" style={{ color: '#2563eb' }}>SWP Installation</Link></li>
          <li>/</li>
          <li style={{ color: 'var(--ax-text-strong)', fontWeight: 600 }}>View Payment</li>
        </ol>
      </nav>

      {/* Error Alert */}
      {apiError && (
        <div className="ax-card" style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, marginBottom: 16, color: '#dc2626', fontSize: 13 }}>
          {apiError}
        </div>
      )}

      {/* 4 KPI Cards */}
      <div className="asw-cards-row">
        <KpiCard
          icon={<svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="5" width="18" height="14" rx="3" /><line x1="3" y1="10" x2="21" y2="10" /></svg>}
          tone="accent"
          label="Total Payment Request"
          value={`₹${num(totalAmountRequested)}`}
          sub="Sanctioned claim invoices"
        />
        <KpiCard
          icon={<svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="20 6 9 17 4 12" /></svg>}
          tone="emerald"
          label="Total Settled"
          value={`₹${num(totalAmountDisbursed)}`}
          sub={`${completedCount} claims paid in full`}
        />
        <KpiCard
          icon={<svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>}
          tone="cyan"
          label="Partially Paid"
          value={payments.filter((p) => Number(p.status) === 2).length}
          sub="Tranche released in part"
        />
        <KpiCard
          icon={<svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>}
          tone="amber"
          label="Balance Payable"
          value={`₹${num(totalBalanceDue)}`}
          sub="Awaiting disbursement"
        />
      </div>

      {/* Filter Card */}
      <div className="asw-filter-card">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14, alignItems: 'flex-end' }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Date From:</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="ax-form-control"
              style={{ width: '100%', padding: '6px 10px', fontSize: 12, borderRadius: 6, border: '1px solid #cbd5e1' }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Date To:</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="ax-form-control"
              style={{ width: '100%', padding: '6px 10px', fontSize: 12, borderRadius: 6, border: '1px solid #cbd5e1' }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Filter by Vendor:</label>
            <select
              value={vendorFilter}
              onChange={(e) => setVendorFilter(e.target.value)}
              className="ax-form-control"
              style={{ width: '100%', padding: '6px 10px', fontSize: 12, borderRadius: 6, border: '1px solid #cbd5e1' }}
            >
              <option value="all">All Vendors ({vendorOptions.length})</option>
              {vendorOptions.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Disbursement Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="ax-form-control"
              style={{ width: '100%', padding: '6px 10px', fontSize: 12, borderRadius: 6, border: '1px solid #cbd5e1' }}
            >
              <option value="all">All Statuses</option>
              <option value="complete">Complete Paid</option>
              <option value="partial">Partially Paid</option>
              <option value="pending">Pending Payment</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="ax-card" style={{ borderRadius: 12, background: '#ffffff', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div className="ax-card__header" style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
          <div className="ax-card__titles">
            <h3 className="ax-card__title" style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
              Milestone Payment Disbursement Register
            </h3>
            <p className="ax-card__subtitle" style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>
              Showing {filteredPayments.length} vendor disbursement accounts across Jammu & Kashmir
            </p>
          </div>

          <div className="ax-card__actions">
            <div className="ax-cluster">
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search vendor, UTR..."
              />

              <TableExportToolbar
                data={filteredPayments}
                columns={exportColumns}
                filename="Jammu_SWP_Disbursements"
              />
            </div>
          </div>
        </div>

        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: 700, textAlign: 'left' }}>
                <th style={{ padding: '12px 16px' }}>Sr. No.</th>
                <th style={{ padding: '12px 14px' }}>Vendor Name</th>
                <th style={{ padding: '12px 14px' }}>Claim Ref</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>Sites</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>Claim Amount</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>Paid Amount</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>Balance Due</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>UTR / Txn Ref</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} style={centerCell}>Loading disbursement records...</td>
                </tr>
              ) : pagedPayments.length === 0 ? (
                <tr>
                  <td colSpan={10} style={centerCell}>
                    <TableEmptyState message="No payment records found matching criteria." />
                  </td>
                </tr>
              ) : (
                pagedPayments.map((p, idx) => {
                  const st = Number(p.status);
                  const isComplete = st === 3;
                  const isPartial = st === 2;
                  const isPending = st === 1;

                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#64748b' }}>
                        {(pagination.currentPage - 1) * pagination.pageSize + idx + 1}
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>
                        {p.vendor}
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: '#2563eb' }}>
                        {p.claim_no || `CLM-${p.claim_id}`}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 600, color: '#334155' }}>
                        {p.total_sites} Sites
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>
                        ₹{num(p.claim_amount)}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: '#10b981', fontVariantNumeric: 'tabular-nums' }}>
                        ₹{num(p.paid_amount)}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: p.balance_amount > 0 ? '#dc2626' : '#94a3b8', fontVariantNumeric: 'tabular-nums' }}>
                        ₹{num(p.balance_amount)}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', fontSize: 11, color: '#475569' }}>
                        {p.utr_no ? (
                          <span style={{ fontWeight: 600, color: '#2563eb' }}>{p.utr_no}</span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>Pending</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <span
                          className={`ax-badge ax-badge--soft ax-badge--${isComplete ? 'success' : isPartial ? 'info' : 'warning'}`}
                          style={{
                            padding: '3px 10px',
                            borderRadius: 9999,
                            fontSize: 11,
                            fontWeight: 700,
                            background: isComplete ? '#ecfdf5' : isPartial ? '#eff6ff' : '#fef3c7',
                            color: isComplete ? '#059669' : isPartial ? '#2563eb' : '#d97706',
                          }}
                        >
                          {isComplete ? 'Complete' : isPartial ? 'Partially Paid' : 'Pending Payment'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          {!isComplete && (
                            <button
                              type="button"
                              className="ax-btn ax-btn--primary ax-btn--sm"
                              onClick={() => openDisburseModal(p)}
                              style={{ background: '#10b981', borderColor: '#10b981', padding: '4px 10px', fontSize: 11 }}
                            >
                              Disburse
                            </button>
                          )}
                          <button
                            type="button"
                            className="ax-btn ax-btn--ghost ax-btn--sm"
                            onClick={() => { setDetailItem(p); setDetailModalOpen(true); }}
                            style={{ padding: '4px 8px', fontSize: 11, color: '#2563eb' }}
                          >
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="ax-card__footer" style={footerStyle}>
          <div className="ula-pagination-left">
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={pagination.setCurrentPage}
            />
          </div>
        </div>
      </div>

      {/* Disburse Payment Modal */}
      <Modal
        open={disburseModalOpen}
        onClose={() => setDisburseModalOpen(false)}
        title="Execute Payment Disbursement"
        subtitle={activePayment ? `Disbursement to ${activePayment.vendor} · Claim ${activePayment.claim_no}` : ''}
        maxWidth={580}
        footer={
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setDisburseModalOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="ax-btn ax-btn--primary"
              disabled={disbursing}
              onClick={handleDisburseSubmit}
              style={{ background: '#10b981', borderColor: '#10b981' }}
            >
              {disbursing ? 'Processing...' : 'Authorize Disbursement'}
            </button>
          </div>
        }
      >
        {activePayment && (
          <form onSubmit={handleDisburseSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: 11, color: '#64748b' }}>Total Claim</span>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>₹{num(activePayment.claim_amount)}</div>
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#64748b' }}>Already Paid</span>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#10b981' }}>₹{num(activePayment.paid_amount)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 11, color: '#64748b' }}>Balance Payable</span>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#dc2626' }}>₹{num(activePayment.balance_amount)}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                  Disbursement Amount (₹): <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="number"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="ax-form-control"
                  style={{ width: '100%', padding: '8px 12px', fontSize: 13, borderRadius: 6, border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                  Payment Mode:
                </label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="ax-form-control"
                  style={{ width: '100%', padding: '8px 12px', fontSize: 13, borderRadius: 6, border: '1px solid #cbd5e1' }}
                >
                  <option value="NEFT">NEFT Settlement</option>
                  <option value="RTGS">RTGS Immediate</option>
                  <option value="PFMS">PFMS Public Finance</option>
                  <option value="Treasury">State Treasury Release</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                  UTR / Transaction Reference: <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SBIN924510098231"
                  value={utrNo}
                  onChange={(e) => setUtrNo(e.target.value)}
                  className="ax-form-control"
                  style={{ width: '100%', padding: '8px 12px', fontSize: 13, borderRadius: 6, border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                  Disbursement Date:
                </label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="ax-form-control"
                  style={{ width: '100%', padding: '8px 12px', fontSize: 13, borderRadius: 6, border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                Disbursement Remarks / Voucher Notes:
              </label>
              <textarea
                rows={2}
                value={disburseRemarks}
                onChange={(e) => setDisburseRemarks(e.target.value)}
                placeholder="Bank advice reference or tranche notes..."
                className="ax-form-control"
                style={{ width: '100%', padding: '8px 12px', fontSize: 13, borderRadius: 6, border: '1px solid #cbd5e1' }}
              />
            </div>
          </form>
        )}
      </Modal>

      {/* Payment Details Modal */}
      <Modal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="Disbursement Account & Settlement Details"
        subtitle={detailItem ? `${detailItem.vendor} · ${detailItem.claim_no}` : ''}
        maxWidth={620}
      >
        {detailItem && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
            <div>
              <span style={{ fontSize: 11, color: '#64748b' }}>Contractor Vendor</span>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{detailItem.vendor}</div>
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#64748b' }}>Claim Reference No</span>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#2563eb' }}>{detailItem.claim_no}</div>
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#64748b' }}>Claimed Amount</span>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>₹{num(detailItem.claim_amount)}</div>
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#64748b' }}>Paid Settlement</span>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#10b981' }}>₹{num(detailItem.paid_amount)}</div>
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#64748b' }}>Balance Payable</span>
              <div style={{ fontSize: 14, fontWeight: 700, color: detailItem.balance_amount > 0 ? '#dc2626' : '#94a3b8' }}>
                ₹{num(detailItem.balance_amount)}
              </div>
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#64748b' }}>Sites Covered</span>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{detailItem.total_sites} Sites</div>
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#64748b' }}>Bank UTR / Txn Reference</span>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#2563eb' }}>{detailItem.utr_no || 'Pending'}</div>
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#64748b' }}>Payment Mode</span>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{detailItem.payment_mode || '—'}</div>
            </div>
            {detailItem.remarks && (
              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ fontSize: 11, color: '#64748b' }}>Settlement Remarks</span>
                <div style={{ fontSize: 12, color: '#334155', background: '#eff6ff', padding: '8px 12px', borderRadius: 6, border: '1px solid #bfdbfe', marginTop: 2 }}>
                  {detailItem.remarks}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default ViewSwpPayment;
