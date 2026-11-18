import { useEffect, useMemo, useRef, useState, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
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
  jammuSrtExpenseService,
  resolveJammuMediaUrl,
  JAMMU_EXPENSE_VENDORS,
  type JammuSrtExpensePaymentItem,
} from './jammuSrtExpenseService';

/* ───────── Responsive page CSS matching Solar ERP standard ───────── */
const PAGE_CSS = `
  .solar-erp-page {
    --asw-primary: #2559bf;
    --asw-primary-rgb: 37, 89, 191;
    --ax-primary: #2559bf;
    --ax-primary-hover: #1e4699;
    --ax-primary-rgb: 37, 89, 191;
  }
  .solar-erp-page .ax-btn--primary,
  .solar-erp-page .ax-button--primary {
    background: #2559bf !important;
    border-color: #2559bf !important;
    color: #ffffff !important;
  }
  .solar-erp-page .ax-btn--primary:hover,
  .solar-erp-page .ax-button--primary:hover {
    background: #1e4699 !important;
    border-color: #1e4699 !important;
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
  .solar-erp-page .asw-cards-row span svg {
    width: 15px !important;
    height: 15px !important;
    display: block !important;
  }
  /* Compact table action buttons - STRICTLY NO icons */
  .solar-erp-page .ax-table .ax-btn--sm,
  .solar-erp-page .ax-table .ax-btn--xs,
  .solar-erp-page .ax-table button.ax-btn,
  .solar-erp-page .ax-table a.ax-btn {
    min-height: unset !important;
    height: auto !important;
    padding: 4px 10px !important;
    font-size: 11px !important;
    line-height: 1.2 !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
  }
  @media (max-width: 1024px) {
    .solar-erp-page .asw-cards-row {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 640px) {
    .solar-erp-page .asw-cards-row {
      grid-template-columns: 1fr;
    }
  }

  /* Filter card row styling */
  .solar-erp-page .payment-filter-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1.6fr 1.2fr auto;
    gap: 12px;
    align-items: end;
  }
  @media (max-width: 1024px) {
    .solar-erp-page .payment-filter-grid {
      grid-template-columns: 1fr 1fr;
    }
  }
  @media (max-width: 640px) {
    .solar-erp-page .payment-filter-grid {
      grid-template-columns: 1fr;
    }
  }

  .solar-erp-page .asw-bifurcation-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }
  .solar-erp-page .asw-pill-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 7px 16px;
    border-radius: 9999px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
    border: 1px solid var(--ax-border, #cbd5e1);
    background: var(--ax-surface, #ffffff);
    color: var(--ax-text-muted, #64748b);
  }
  .solar-erp-page .asw-pill-btn:hover {
    border-color: #2559bf;
    color: #2559bf;
  }
  .solar-erp-page .asw-pill-btn.active {
    background: #2559bf;
    color: #ffffff;
    border-color: #2559bf;
    box-shadow: 0 2px 4px rgba(37, 89, 191, 0.2);
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

  /* All table columns fully scrollable horizontally */
  .solar-erp-page .ax-table-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    width: 100%;
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
    .solar-erp-page .ax-card__title {
      font-family: var(--ax-font-display);
      font-size: var(--ax-text-md);
      line-height: var(--ax-leading-md);
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

/* ── Modal Component ── */
function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 540,
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
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>{title}</h3>
            {subtitle && <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>{subtitle}</p>}
          </div>
          <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">
            ✕
          </button>
        </div>
        <div className="ax-modal__body">{children}</div>
        {footer && <div className="ax-modal__footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

/* ── Top KPI Card Component ── */
type KpiTone = 'accent' | 'cyan' | 'emerald' | 'amber' | 'violet';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(37, 89, 191, 0.12)', fg: '#2559bf' },
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
  onClick,
  active,
}: {
  icon: ReactNode;
  tone: KpiTone;
  label: string;
  value: ReactNode;
  sub: string;
  onClick?: () => void;
  active?: boolean;
}) {
  const t = TONE[tone];
  return (
    <div
      className={`ax-card ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      style={{
        padding: '14px 18px',
        borderRadius: 12,
        minWidth: 0,
        cursor: onClick ? 'pointer' : 'default',
        border: active ? '2px solid #2559bf' : undefined,
        background: active ? '#f8faff' : undefined,
        transition: 'all 0.15s ease',
      }}
    >
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
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: 'var(--ax-text-muted, #64748b)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {label}
        </span>
      </div>
      <div
        style={{
          fontFamily: 'var(--ax-font-display)',
          fontSize: 22,
          fontWeight: 700,
          color: 'var(--ax-text-strong, #0f172a)',
          lineHeight: 1.2,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 11, color: 'var(--ax-text-muted, #64748b)', marginTop: 2 }}>{sub}</div>
    </div>
  );
}

/* ───────── Main Component ───────── */
export const SrtExpenseViewPayments: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [payments, setPayments] = useState<JammuSrtExpensePaymentItem[]>([]);
  const [stats, setStats] = useState({ total: 156, complete: 0, partially: 0, pending: 156 });
  const [search, setSearch] = useState<string>('');

  // Filters state
  const [filterFromDate, setFilterFromDate] = useState<string>('');
  const [filterToDate, setFilterToDate] = useState<string>('');
  const [filterVendor, setFilterVendor] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Active status quick toggle
  const [activeTab, setActiveTab] = useState<'ALL' | 'Pending' | 'Paid' | 'Partially'>('ALL');

  // Modals state
  const [settleItem, setSettleItem] = useState<JammuSrtExpensePaymentItem | null>(null);
  const [payAmountInput, setPayAmountInput] = useState<number>(0);
  const [paymentModeInput, setPaymentModeInput] = useState<string>('RTGS');
  const [utrNoInput, setUtrNoInput] = useState<string>('');
  const [settlementDateInput, setSettlementDateInput] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [payRemarksInput, setPayRemarksInput] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Preview invoice lightbox
  const [previewInvoice, setPreviewInvoice] = useState<{ url: string; title: string } | null>(null);

  // Notification toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  }, []);

  // Fetch initial data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await jammuSrtExpenseService.getExpensePayments();
      setPayments(res.list);
      setStats(res.stats);
    } catch {
      // Sandboxed mock fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle open settle modal
  const handleOpenSettle = (item: JammuSrtExpensePaymentItem) => {
    setSettleItem(item);
    setPayAmountInput(item.balance_amount || item.amount);
    setPaymentModeInput(item.payment_mode || 'RTGS');
    setUtrNoInput(item.utr_no || '');
    setSettlementDateInput(item.pay_date || new Date().toISOString().slice(0, 10));
    setPayRemarksInput(item.pay_remarks || '');
  };

  // Submit payment settlement
  const handleConfirmSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settleItem) return;

    if (!payAmountInput || payAmountInput <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }
    if (!utrNoInput.trim()) {
      alert('Please enter the UTR or Bank Transaction Reference Number.');
      return;
    }

    setIsSubmitting(true);
    try {
      await jammuSrtExpenseService.submitPaymentSettlement({
        id: settleItem.id,
        pay_amount: Number(payAmountInput),
        payment_mode: paymentModeInput,
        utr_no: utrNoInput.trim(),
        settlement_date: settlementDateInput,
        remarks: payRemarksInput.trim(),
      });

      showToast(`Payment of ₹${Number(payAmountInput).toLocaleString('en-IN')} recorded successfully for ${settleItem.vendor}!`);
      setSettleItem(null);
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'Failed to settle payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset filters
  const handleResetFilters = () => {
    setFilterFromDate('');
    setFilterToDate('');
    setFilterVendor('');
    setFilterStatus('ALL');
    setActiveTab('ALL');
    setSearch('');
  };

  // Filtered dataset
  const filteredPayments = useMemo(() => {
    let result = payments;

    // Quick status tab
    if (activeTab !== 'ALL') {
      result = result.filter((p) => p.pay_status === activeTab);
    }

    // Dropdown Status filter
    if (filterStatus !== 'ALL') {
      result = result.filter((p) => p.pay_status === filterStatus);
    }

    // Date From
    if (filterFromDate) {
      result = result.filter((p) => p.date >= filterFromDate);
    }

    // Date To
    if (filterToDate) {
      result = result.filter((p) => p.date <= filterToDate);
    }

    // Vendor filter
    if (filterVendor) {
      result = result.filter((p) => p.vendor === filterVendor);
    }

    // Free text search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (p) =>
          p.vendor.toLowerCase().includes(q) ||
          p.district.toLowerCase().includes(q) ||
          p.site_name.toLowerCase().includes(q) ||
          p.purpose.toLowerCase().includes(q) ||
          p.remarks.toLowerCase().includes(q) ||
          (p.pay_remarks && p.pay_remarks.toLowerCase().includes(q)) ||
          (p.utr_no && p.utr_no.toLowerCase().includes(q)) ||
          p.pay_status.toLowerCase().includes(q)
      );
    }

    return result;
  }, [payments, activeTab, filterStatus, filterFromDate, filterToDate, filterVendor, search]);

  // Pagination hook
  const { page, setPage, totalPages, paginatedItems, pageSize } = usePagination(filteredPayments, 15);

  // Export Columns definition
  const exportColumns: ExportColumn[] = [
    { key: 'id', label: 'S.No.' },
    { key: 'date', label: 'Date' },
    { key: 'vendor', label: 'Vendor' },
    { key: 'district', label: 'District' },
    { key: 'site_name', label: 'Site Name' },
    { key: 'purpose', label: 'Purpose' },
    { key: 'amount', label: 'Amount (₹)' },
    { key: 'remarks', label: 'Remarks' },
    { key: 'pay_amount', label: 'Pay Amount (₹)' },
    { key: 'balance_amount', label: 'Balance Amount (₹)' },
    { key: 'pay_date', label: 'Pay Date' },
    { key: 'pay_remarks', label: 'Pay Remarks' },
    { key: 'pay_status', label: 'Pay Status' },
    { key: 'utr_no', label: 'UTR / Ref No' },
  ];

  return (
    <div className="solar-erp-page" style={{ padding: '0 0 var(--ax-space-8)' }}>
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* Toast Notification */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            top: 24,
            right: 24,
            zIndex: 10000,
            background: '#16a34a',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: 8,
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
            fontWeight: 600,
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span>✓</span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Page Header matching exact title and breadcrumb */}
      <PageHead
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Jammu', href: '/vendor-management/jammu' },
          { label: 'SRT 70MW Expenses', href: '/vendor-management/jammu/expenses/srt-70mw' },
          { label: 'View Payments' },
        ]}
        title="Welcome to, Jammu Installation Payment"
        subtitle="View Jammu Installation Payment - Monitor expense disbursement transactions, banking settlement receipts, and audit histories across Jammu & Kashmir."
      />

      {/* Top 4 KPI Cards matching exact prompt numbers & layout */}
      <div className="asw-cards-row">
        <KpiCard
          tone="accent"
          label="Payment Request"
          value={stats.total}
          sub="Total Reimbursement Claims"
          active={activeTab === 'ALL'}
          onClick={() => {
            setActiveTab('ALL');
            setFilterStatus('ALL');
          }}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          }
        />
        <KpiCard
          tone="emerald"
          label="Payment Complete"
          value={stats.complete}
          sub="Complete Settled Disbursed"
          active={activeTab === 'Paid'}
          onClick={() => {
            setActiveTab('Paid');
            setFilterStatus('Paid');
          }}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
        />
        <KpiCard
          tone="amber"
          label="Payment Partially"
          value={stats.partially}
          sub="Partially Paid Claims"
          active={activeTab === 'Partially'}
          onClick={() => {
            setActiveTab('Partially');
            setFilterStatus('Partially');
          }}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
        />
        <KpiCard
          tone="violet"
          label="Payment Pending"
          value={stats.pending}
          sub="Awaiting Bank Disbursement"
          active={activeTab === 'Pending'}
          onClick={() => {
            setActiveTab('Pending');
            setFilterStatus('Pending');
          }}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          }
        />
      </div>

      {/* Filter Card: "Jammu Expenses Payment" */}
      <div className="ax-card" style={{ padding: '18px 20px', borderRadius: 12, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
            Jammu Expenses Payment - Filter Desk
          </h4>
          <span style={{ fontSize: 12, color: '#64748b' }}>
            Filter transactions by date range, contracted agency vendor, or payment status
          </span>
        </div>

        <div className="payment-filter-grid">
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5 }}>
              From Date
            </label>
            <input
              type="date"
              className="ax-input"
              value={filterFromDate}
              onChange={(e) => setFilterFromDate(e.target.value)}
              style={{ width: '100%', height: 36, padding: '4px 10px', fontSize: 13, borderRadius: 6 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5 }}>
              To Date
            </label>
            <input
              type="date"
              className="ax-input"
              value={filterToDate}
              onChange={(e) => setFilterToDate(e.target.value)}
              style={{ width: '100%', height: 36, padding: '4px 10px', fontSize: 13, borderRadius: 6 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5 }}>
              Select Vendor
            </label>
            <select
              className="ax-input"
              value={filterVendor}
              onChange={(e) => setFilterVendor(e.target.value)}
              style={{ width: '100%', height: 36, padding: '4px 10px', fontSize: 13, borderRadius: 6 }}
            >
              <option value="">-- Select Vendor --</option>
              {JAMMU_EXPENSE_VENDORS.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5 }}>
              Payment Status
            </label>
            <select
              className="ax-input"
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                if (e.target.value === 'ALL') setActiveTab('ALL');
                else setActiveTab(e.target.value as any);
              }}
              style={{ width: '100%', height: 36, padding: '4px 10px', fontSize: 13, borderRadius: 6 }}
            >
              <option value="ALL">All Status</option>
              <option value="Pending">Payment Pending</option>
              <option value="Paid">Payment Complete</option>
              <option value="Partially">Payment Partially</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="ax-btn ax-btn--secondary"
              onClick={handleResetFilters}
              style={{ height: 36, padding: '0 14px', fontSize: 13, borderRadius: 6 }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Bifurcation quick filter tabs */}
      <div className="asw-bifurcation-row">
        <button
          type="button"
          className={`asw-pill-btn ${activeTab === 'ALL' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('ALL');
            setFilterStatus('ALL');
          }}
        >
          <span>All Payment Claims</span>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: 12,
              fontSize: 11,
              fontWeight: 700,
              background: activeTab === 'ALL' ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
              color: activeTab === 'ALL' ? '#ffffff' : '#0f172a',
            }}
          >
            {stats.total}
          </span>
        </button>

        <button
          type="button"
          className={`asw-pill-btn ${activeTab === 'Pending' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('Pending');
            setFilterStatus('Pending');
          }}
        >
          <span>Pending Settlement</span>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: 12,
              fontSize: 11,
              fontWeight: 700,
              background: activeTab === 'Pending' ? 'rgba(255,255,255,0.25)' : '#fef3c7',
              color: activeTab === 'Pending' ? '#ffffff' : '#b45309',
            }}
          >
            {stats.pending}
          </span>
        </button>

        <button
          type="button"
          className={`asw-pill-btn ${activeTab === 'Partially' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('Partially');
            setFilterStatus('Partially');
          }}
        >
          <span>Partially Paid</span>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: 12,
              fontSize: 11,
              fontWeight: 700,
              background: activeTab === 'Partially' ? 'rgba(255,255,255,0.25)' : '#dbeafe',
              color: activeTab === 'Partially' ? '#ffffff' : '#1d4ed8',
            }}
          >
            {stats.partially}
          </span>
        </button>

        <button
          type="button"
          className={`asw-pill-btn ${activeTab === 'Paid' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('Paid');
            setFilterStatus('Paid');
          }}
        >
          <span>Fully Disbursed</span>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: 12,
              fontSize: 11,
              fontWeight: 700,
              background: activeTab === 'Paid' ? 'rgba(255,255,255,0.25)' : '#dcfce7',
              color: activeTab === 'Paid' ? '#ffffff' : '#15803d',
            }}
          >
            {stats.complete}
          </span>
        </button>
      </div>

      {/* Main Table Card */}
      <div className="ax-card" style={{ borderRadius: 12, overflow: 'hidden' }}>
        <div className="ax-card__header" style={{ padding: '16px 20px' }}>
          <div className="ax-card__titles">
            <span
              className="ax-card__eyebrow"
              style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: '#2559bf' }}
            >
              FINANCIAL DISBURSEMENT REGISTER
            </span>
            <h3 className="ax-card__title" style={{ margin: '2px 0 0', fontSize: 16, fontWeight: 700 }}>
              Jammu SRT 70MW Expense Payment Records
            </h3>
            <p className="ax-card__subtitle" style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
              Showing {filteredPayments.length} transactions {filterVendor ? `for vendor "${filterVendor}"` : ''}
            </p>
          </div>

          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              <div style={{ width: 220 }}>
                <SearchInput
                  value={search}
                  onChange={setSearch}
                  placeholder="Search vendor, site, UTR..."
                />
              </div>
              <TableExportToolbar
                data={filteredPayments}
                columns={exportColumns}
                fileName={`jammu_srt_expense_payments_${new Date().toISOString().slice(0, 10)}`}
              />
            </div>
          </div>
        </div>

        {/* Scrollable Table */}
        <div className="ax-table-wrap">
          <table className="ax-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '10px 12px', fontWeight: 600, color: '#475569', whiteSpace: 'nowrap' }}>S.No.</th>
                <th style={{ padding: '10px 12px', fontWeight: 600, color: '#475569', whiteSpace: 'nowrap' }}>Date</th>
                <th style={{ padding: '10px 12px', fontWeight: 600, color: '#475569', whiteSpace: 'nowrap' }}>Vendor</th>
                <th style={{ padding: '10px 12px', fontWeight: 600, color: '#475569', whiteSpace: 'nowrap' }}>District</th>
                <th style={{ padding: '10px 12px', fontWeight: 600, color: '#475569', minWidth: 160 }}>Site Name</th>
                <th style={{ padding: '10px 12px', fontWeight: 600, color: '#475569', minWidth: 160 }}>Purpose</th>
                <th style={{ padding: '10px 12px', fontWeight: 600, color: '#475569', whiteSpace: 'nowrap' }}>Invoice</th>
                <th style={{ padding: '10px 12px', fontWeight: 600, color: '#475569', whiteSpace: 'nowrap' }}>Amount</th>
                <th style={{ padding: '10px 12px', fontWeight: 600, color: '#475569', minWidth: 180 }}>Remarks</th>
                <th style={{ padding: '10px 12px', fontWeight: 600, color: '#475569', whiteSpace: 'nowrap' }}>Pay Amount</th>
                <th style={{ padding: '10px 12px', fontWeight: 600, color: '#475569', whiteSpace: 'nowrap' }}>Balance Amount</th>
                <th style={{ padding: '10px 12px', fontWeight: 600, color: '#475569', whiteSpace: 'nowrap' }}>Pay Date</th>
                <th style={{ padding: '10px 12px', fontWeight: 600, color: '#475569', minWidth: 160 }}>Pay Remarks</th>
                <th style={{ padding: '10px 12px', fontWeight: 600, color: '#475569', whiteSpace: 'nowrap' }}>Pay Status</th>
                <th style={{ padding: '10px 12px', fontWeight: 600, color: '#475569', whiteSpace: 'nowrap', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={15} style={centerCell}>
                    <div style={{ display: 'inline-block', padding: 20, color: '#64748b' }}>
                      Loading Jammu expense payment ledger...
                    </div>
                  </td>
                </tr>
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={15} style={centerCell}>
                    <TableEmptyState
                      title="No payment records found"
                      description="No expense disbursement records matched your filter criteria."
                    />
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item, idx) => {
                  const serialNo = (page - 1) * pageSize + idx + 1;
                  const isPaid = item.pay_status === 'Paid';
                  const isPartial = item.pay_status === 'Partially';

                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: '1px solid #e2e8f0',
                        transition: 'background-color 0.1s ease',
                      }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = '#f8faff')}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = '')}
                    >
                      <td style={{ padding: '10px 12px', color: '#64748b', fontWeight: 500 }}>
                        {serialNo}
                      </td>
                      <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', color: '#1e293b' }}>
                        {item.date}
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: '#0f172a' }}>
                        {item.vendor}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#334155' }}>
                        {item.district}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#0f172a', fontWeight: 500 }}>
                        {item.site_name}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#475569' }}>
                        {item.purpose}
                      </td>
                      <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                        {item.invoice ? (
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewInvoice({
                                url: resolveJammuMediaUrl(item.invoice),
                                title: `Invoice #${item.id} - ${item.vendor} (${item.purpose})`,
                              })
                            }
                            style={{
                              border: 'none',
                              background: 'transparent',
                              color: '#2559bf',
                              cursor: 'pointer',
                              textDecoration: 'underline',
                              fontWeight: 600,
                              fontSize: 12,
                              padding: 0,
                            }}
                          >
                            View Invoice
                          </button>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' }}>
                        ₹{item.amount.toLocaleString('en-IN')}
                      </td>
                      <td
                        style={{
                          padding: '10px 12px',
                          color: '#64748b',
                          fontSize: 12,
                          maxWidth: 200,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={item.remarks}
                      >
                        {item.remarks || '—'}
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: '#16a34a', whiteSpace: 'nowrap' }}>
                        {item.pay_amount != null && item.pay_amount > 0
                          ? `₹${item.pay_amount.toLocaleString('en-IN')}`
                          : '—'}
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: '#dc2626', whiteSpace: 'nowrap' }}>
                        {item.balance_amount != null
                          ? `₹${item.balance_amount.toLocaleString('en-IN')}`
                          : `₹${item.amount.toLocaleString('en-IN')}`}
                      </td>
                      <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', color: '#475569' }}>
                        {item.pay_date || '—'}
                      </td>
                      <td
                        style={{
                          padding: '10px 12px',
                          color: '#64748b',
                          fontSize: 12,
                          maxWidth: 180,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={item.pay_remarks || ''}
                      >
                        {item.pay_remarks || '—'}
                      </td>
                      <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                        {isPaid ? (
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '3px 8px',
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 700,
                              background: '#dcfce7',
                              color: '#15803d',
                            }}
                          >
                            Paid
                          </span>
                        ) : isPartial ? (
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '3px 8px',
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 700,
                              background: '#dbeafe',
                              color: '#1d4ed8',
                            }}
                          >
                            Partially
                          </span>
                        ) : (
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '3px 8px',
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 700,
                              background: '#fef3c7',
                              color: '#b45309',
                            }}
                          >
                            Pending
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        {isPaid ? (
                          <button
                            type="button"
                            className="ax-btn ax-btn--secondary ax-btn--xs"
                            onClick={() => handleOpenSettle(item)}
                          >
                            Edit UTR
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="ax-btn ax-btn--primary ax-btn--xs"
                            onClick={() => handleOpenSettle(item)}
                          >
                            Settle
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Left-aligned Pagination */}
        <div className="ax-card__footer" style={footerStyle}>
          <div className="ula-pagination-left">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        </div>
      </div>

      {/* ── Settlement Modal ── */}
      <Modal
        open={Boolean(settleItem)}
        onClose={() => setSettleItem(null)}
        title={settleItem?.pay_status === 'Paid' ? 'Edit Settlement & Banking Details' : 'Disburse & Settle Expense Payment'}
        subtitle={`Vendor: ${settleItem?.vendor} | Site: ${settleItem?.site_name}`}
        maxWidth={580}
        footer={
          <>
            <button
              type="button"
              className="ax-btn ax-btn--secondary"
              onClick={() => setSettleItem(null)}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="ax-btn ax-btn--primary"
              onClick={handleConfirmSettlement}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing...' : 'Confirm Settlement'}
            </button>
          </>
        }
      >
        {settleItem && (
          <form onSubmit={handleConfirmSettlement}>
            {/* Summary card */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                padding: '12px 16px',
                marginBottom: 16,
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 12,
              }}
            >
              <div>
                <span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>Total Claim</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                  ₹{settleItem.amount.toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>Already Paid</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#16a34a' }}>
                  ₹{(settleItem.pay_amount || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>Remaining Balance</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#dc2626' }}>
                  ₹{(settleItem.balance_amount != null ? settleItem.balance_amount : settleItem.amount).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                  Disbursement Amount (₹) <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="number"
                  className="ax-input"
                  min={1}
                  max={settleItem.balance_amount || settleItem.amount}
                  value={payAmountInput}
                  onChange={(e) => setPayAmountInput(Number(e.target.value))}
                  required
                  style={{ width: '100%', padding: '8px 12px', fontSize: 14, borderRadius: 6 }}
                />
                <span style={{ fontSize: 11, color: '#64748b' }}>
                  Max: ₹{(settleItem.balance_amount || settleItem.amount).toLocaleString('en-IN')}
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                  Payment Mode <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <select
                  className="ax-input"
                  value={paymentModeInput}
                  onChange={(e) => setPaymentModeInput(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', fontSize: 14, borderRadius: 6 }}
                >
                  <option value="RTGS">RTGS Bank Transfer</option>
                  <option value="NEFT">NEFT Transfer</option>
                  <option value="IMPS">IMPS Immediate Pay</option>
                  <option value="Cheque">Company Cheque</option>
                  <option value="Direct Transfer">Direct Account Settlement</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                  UTR / Transaction Ref No. <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  className="ax-input"
                  placeholder="e.g. SBIN2610294819"
                  value={utrNoInput}
                  onChange={(e) => setUtrNoInput(e.target.value)}
                  required
                  style={{ width: '100%', padding: '8px 12px', fontSize: 14, borderRadius: 6 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                  Settlement Date <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="date"
                  className="ax-input"
                  value={settlementDateInput}
                  onChange={(e) => setSettlementDateInput(e.target.value)}
                  required
                  style={{ width: '100%', padding: '8px 12px', fontSize: 14, borderRadius: 6 }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                Disbursement Remarks / Banking Reference
              </label>
              <textarea
                className="ax-input"
                rows={3}
                placeholder="Enter bank advice notes, voucher number, or internal auditor remarks..."
                value={payRemarksInput}
                onChange={(e) => setPayRemarksInput(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', fontSize: 13, borderRadius: 6 }}
              />
            </div>
          </form>
        )}
      </Modal>

      {/* ── Invoice Lightbox Modal ── */}
      <Modal
        open={Boolean(previewInvoice)}
        onClose={() => setPreviewInvoice(null)}
        title={previewInvoice?.title || 'Invoice Preview'}
        maxWidth={700}
        footer={
          <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setPreviewInvoice(null)}>
            Close
          </button>
        }
      >
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <div
            style={{
              background: '#f8fafc',
              border: '2px dashed #cbd5e1',
              borderRadius: 12,
              padding: 30,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: 'rgba(37, 89, 191, 0.1)',
                color: '#2559bf',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
              }}
            >
              📄
            </div>
            <h4 style={{ margin: 0, fontSize: 16, color: '#0f172a' }}>Expense Invoice Document</h4>
            <p style={{ margin: 0, fontSize: 13, color: '#64748b', maxWidth: 420 }}>
              Verified reimbursement receipt file uploaded by vendor partner for Jammu SRT 70MW installation work.
            </p>
            <div style={{ marginTop: 10, display: 'flex', gap: 10 }}>
              <a
                href={previewInvoice?.url || '#'}
                target="_blank"
                rel="noreferrer"
                className="ax-btn ax-btn--primary"
                style={{ fontSize: 13 }}
              >
                Open Full Document
              </a>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SrtExpenseViewPayments;
