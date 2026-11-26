import { useEffect, useMemo, useRef, useState, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
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
  type JammuExpenseVendor,
} from './jammuSrtExpenseService';
import {
  copyRowsToClipboard,
  exportRowsCSV,
  exportRowsExcel,
  exportRowsPDF,
} from '../../../up/Installation/upInstallationShared';

/* ───────── Responsive page CSS matching Exact Reference ───────── */
const PAGE_CSS = `
  .solar-erp-page {
    --asw-primary: var(--ax-accent, #2563eb);
    --asw-primary-rgb: 37, 99, 235;
    --ax-primary: #2563eb;
    --ax-primary-hover: #1d4ed8;
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

  .solar-erp-page .asw-filter-card {
    background: var(--ax-surface, #ffffff);
    border: 1px solid var(--ax-border, #e2e8f0);
    border-radius: 12px;
    padding: 16px 20px;
    margin-bottom: 20px;
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
    border-color: #2563eb;
    color: #2563eb;
  }
  .solar-erp-page .asw-pill-btn.active {
    background: #2563eb;
    color: #ffffff;
    border-color: #2563eb;
    box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);
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

  /* Compact table action buttons */
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

const X_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 18, height: 18 }}>
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

/* ── Modal Dialog Component ── */
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

/* ── Top KPI Card Component ── */
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
        border: active ? '2px solid #2563eb' : '1px solid var(--ax-border, #e2e8f0)',
        background: active ? '#f0f7ff' : '#ffffff',
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
          <span style={{ width: 15, height: 15, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            {icon}
          </span>
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted, #64748b)', letterSpacing: '0.04em' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: t.fg, marginTop: 4, fontFamily: 'var(--ax-font-display)' }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--ax-text-muted, #64748b)', marginTop: 2 }}>
        {sub}
      </div>
    </div>
  );
}

/* ── In-Row Media File Thumbnail Component ── */
function MediaFileThumbnail({ file, onClick }: { file?: string | null; onClick: (url: string) => void }) {
  if (!file) {
    return <span style={{ color: 'var(--ax-text-muted, #94a3b8)', fontSize: 12 }}>—</span>;
  }

  const url = resolveJammuMediaUrl(file);
  const isPdf = /\.pdf($|\?)/i.test(file);
  const isImage = /\.(jpe?g|png|webp|gif|bmp|svg)($|\?)/i.test(file);

  return (
    <div
      onClick={() => onClick(url)}
      title="Click to preview file"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 36,
        height: 36,
        borderRadius: 6,
        border: '1px solid #cbd5e1',
        background: '#f8fafc',
        cursor: 'pointer',
        overflow: 'hidden',
        position: 'relative',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        transition: 'all 0.15s ease',
        margin: '0 auto',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.08)';
        e.currentTarget.style.borderColor = '#2563eb';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.borderColor = '#cbd5e1';
      }}
    >
      {isImage ? (
        <img
          src={url}
          alt="Invoice"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e) => {
            (e.currentTarget as HTMLElement).style.display = 'none';
            if (e.currentTarget.parentElement) {
              const span = document.createElement('span');
              span.innerText = 'IMG';
              span.style.fontSize = '9px';
              span.style.fontWeight = '700';
              span.style.color = '#2563eb';
              e.currentTarget.parentElement.appendChild(span);
            }
          }}
        />
      ) : isPdf ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth={2} style={{ width: 14, height: 14 }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <span style={{ fontSize: 8, fontWeight: 700, color: '#ef4444', lineHeight: 1 }}>PDF</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth={2} style={{ width: 14, height: 14 }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <span style={{ fontSize: 8, fontWeight: 700, color: '#2563eb', lineHeight: 1 }}>DOC</span>
        </div>
      )}
    </div>
  );
}

/* ───────── Main SrtExpenseViewPayments Component ───────── */
export function SrtExpenseViewPayments() {
  const [searchParams] = useSearchParams();
  const initialClaimId = searchParams.get('claim_id');

  const [loading, setLoading] = useState<boolean>(true);
  const [payments, setPayments] = useState<JammuSrtExpensePaymentItem[]>([]);
  const [stats, setStats] = useState({ total: 0, complete: 0, partially: 0, pending: 0 });
  const [availableVendors, setAvailableVendors] = useState<JammuExpenseVendor[]>([]);
  const [search, setSearch] = useState<string>('');

  // Filters state
  const [filterFromDate, setFilterFromDate] = useState<string>('');
  const [filterToDate, setFilterToDate] = useState<string>('');
  const [filterVendor, setFilterVendor] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Quick Bifurcation active tab
  const [activeTab, setActiveTab] = useState<'ALL' | 'Pending' | 'Paid' | 'Partially'>('ALL');

  // Disburse Payment Modal state
  const [settleItem, setSettleItem] = useState<JammuSrtExpensePaymentItem | null>(null);
  const [payAmountInput, setPayAmountInput] = useState<number>(0);
  const [settlementDateInput, setSettlementDateInput] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [payRemarksInput, setPayRemarksInput] = useState<string>('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Lightbox preview state
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Toast notification
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ type, message });
    setTimeout(() => setToastMsg(null), 3500);
  }, []);

  // Fetch payments list
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const statusParam =
        filterStatus !== 'ALL'
          ? filterStatus === 'Paid'
            ? 1
            : filterStatus === 'Partially'
            ? 2
            : 0
          : undefined;

      const res = await jammuSrtExpenseService.getExpensePayments({
        from_date: filterFromDate || undefined,
        to_date: filterToDate || undefined,
        vendor: filterVendor || undefined,
        status: statusParam,
      });

      setPayments(res.list);
      setStats(res.stats);
      if (res.vendors && res.vendors.length > 0) {
        setAvailableVendors(res.vendors);
      }
    } catch (err: any) {
      console.error('Failed to load Jammu expense payments:', err);
      showToast(err?.message || 'Failed to fetch payment ledger', 'error');
    } finally {
      setLoading(false);
    }
  }, [filterFromDate, filterToDate, filterVendor, filterStatus, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle open settle modal
  const handleOpenSettle = (item: JammuSrtExpensePaymentItem) => {
    setSettleItem(item);
    const balance = item.balance_amount != null ? item.balance_amount : item.amount;
    setPayAmountInput(balance > 0 ? balance : item.amount);
    setSettlementDateInput(new Date().toISOString().slice(0, 10));
    setPayRemarksInput('');
    setSubmitError(null);
  };

  // Submit payment settlement
  const handleConfirmSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settleItem) return;

    if (!payAmountInput || payAmountInput <= 0) {
      setSubmitError('Please enter a valid disbursement amount greater than zero.');
      return;
    }

    const maxAllowed = settleItem.balance_amount != null ? settleItem.balance_amount : settleItem.amount;
    if (payAmountInput > maxAllowed) {
      setSubmitError(`Disbursement amount cannot exceed remaining balance of ₹${maxAllowed.toLocaleString('en-IN')}.`);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const res = await jammuSrtExpenseService.verifyPaymentExpenses({
        id: settleItem.id,
        amount: Number(payAmountInput),
        date: settlementDateInput,
        remarks: payRemarksInput.trim() || undefined,
      });

      showToast(
        res.message || `Payment of ₹${Number(payAmountInput).toLocaleString('en-IN')} disbursed successfully!`,
        'success'
      );
      setSettleItem(null);
      await loadData();
    } catch (err: any) {
      console.error('Settlement error:', err);
      setSubmitError(err?.message || 'Failed to disburse payment.');
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

    // Filter by claim_id from searchParams if present
    if (initialClaimId) {
      const matched = result.filter((p) => String(p.id) === String(initialClaimId));
      if (matched.length > 0) return matched;
    }

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
      result = result.filter((p) => {
        if (p.vendor_id && String(p.vendor_id) === String(filterVendor)) return true;
        return p.vendor === filterVendor;
      });
    }

    // Free text search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (p) =>
          p.vendor.toLowerCase().includes(q) ||
          p.district.toLowerCase().includes(q) ||
          p.site_name.toLowerCase().includes(q) ||
          (p.site_code && p.site_code.toLowerCase().includes(q)) ||
          p.purpose.toLowerCase().includes(q) ||
          p.remarks.toLowerCase().includes(q) ||
          (p.pay_remarks && p.pay_remarks.toLowerCase().includes(q)) ||
          p.pay_status.toLowerCase().includes(q)
      );
    }

    return result;
  }, [payments, activeTab, filterStatus, filterFromDate, filterToDate, filterVendor, search, initialClaimId]);

  const pagination = usePagination(filteredPayments, { initialPageSize: 100 });

  // Export Columns definition
  const exportCols: ExportColumn<JammuSrtExpensePaymentItem>[] = useMemo(
    () => [
      { header: 'S.No.', accessor: (_r, idx) => (idx !== undefined ? idx + 1 : '') } as any,
      { header: 'Date', accessor: (r) => r.date },
      { header: 'Vendor', accessor: (r) => r.vendor },
      { header: 'District', accessor: (r) => r.district },
      { header: 'Site Name', accessor: (r) => r.site_name },
      { header: 'Purpose', accessor: (r) => r.purpose },
      { header: 'Invoice', accessor: (r) => r.invoice || '—' },
      { header: 'Amount', accessor: (r) => `₹${r.amount.toLocaleString('en-IN')}` },
      { header: 'Remarks', accessor: (r) => r.remarks || '—' },
      { header: 'Pay Amount', accessor: (r) => (r.pay_amount != null ? `₹${r.pay_amount.toLocaleString('en-IN')}` : '—') },
      {
        header: 'Balance Amount',
        accessor: (r) =>
          r.balance_amount != null
            ? `₹${r.balance_amount.toLocaleString('en-IN')}`
            : `₹${r.amount.toLocaleString('en-IN')}`,
      },
      { header: 'Pay Date', accessor: (r) => r.pay_date || '—' },
      { header: 'Pay Remarks', accessor: (r) => r.pay_remarks || '—' },
      { header: 'Pay Status', accessor: (r) => r.pay_status },
    ],
    []
  );

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* Page Header */}
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

      {/* Top 4 KPI Metric Cards */}
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
            pagination.setPage(1);
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
            pagination.setPage(1);
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
            pagination.setPage(1);
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
            pagination.setPage(1);
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

      {/* Filter Card: "Filter By Date & Status" */}
      <div className="asw-filter-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--ax-text-strong, #0f172a)' }}>
            Filter By Date &amp; Status
          </h4>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            loadData();
          }}
          style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}
        >
          <div style={{ flex: '1 1 150px', minWidth: 140 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, color: '#64748b' }}>
              From Date
            </label>
            <input
              type="date"
              value={filterFromDate}
              onChange={(e) => setFilterFromDate(e.target.value)}
              className="ax-input"
              style={{ width: '100%', height: 34, padding: '0 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12 }}
            />
          </div>

          <div style={{ flex: '1 1 150px', minWidth: 140 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, color: '#64748b' }}>
              To Date
            </label>
            <input
              type="date"
              value={filterToDate}
              onChange={(e) => setFilterToDate(e.target.value)}
              className="ax-input"
              style={{ width: '100%', height: 34, padding: '0 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12 }}
            />
          </div>

          <div style={{ flex: '1 1 170px', minWidth: 150 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, color: '#64748b' }}>
              Select Vendor
            </label>
            <select
              value={filterVendor}
              onChange={(e) => setFilterVendor(e.target.value)}
              className="ax-select"
              style={{ width: '100%', height: 34, padding: '0 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12 }}
            >
              <option value="">All Vendors</option>
              {availableVendors.length > 0
                ? availableVendors.map((v) => (
                    <option key={v.id} value={String(v.id)}>
                      {v.name}
                    </option>
                  ))
                : JAMMU_EXPENSE_VENDORS.map((v, i) => (
                    <option key={i} value={v}>
                      {v}
                    </option>
                  ))}
            </select>
          </div>

          <div style={{ flex: '1 1 150px', minWidth: 130 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, color: '#64748b' }}>
              Payment Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                if (e.target.value === 'ALL') setActiveTab('ALL');
                else setActiveTab(e.target.value as any);
              }}
              className="ax-select"
              style={{ width: '100%', height: 34, padding: '0 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12 }}
            >
              <option value="ALL">All Statuses</option>
              <option value="Paid">Payment Complete</option>
              <option value="Partially">Payment Partially</option>
              <option value="Pending">Payment Pending</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              type="submit"
              className="ax-btn ax-btn--primary ax-btn--sm"
              style={{ height: 34, padding: '0 14px', fontSize: 12 }}
            >
              Apply Filter
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="ax-btn ax-btn--secondary ax-btn--sm"
              style={{ height: 34, padding: '0 12px', fontSize: 12 }}
            >
              Clear
            </button>
          </div>
        </form>
      </div>

      {/* Report Wise Bifurcation quick filter tabs */}
      <div className="asw-bifurcation-row" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ax-text-muted, #64748b)' }}>
          Report Wise Bifurcation:
        </span>

        <button
          type="button"
          className={`ax-btn ${activeTab === 'ALL' ? 'ax-btn--primary' : 'ax-btn--secondary'} ax-btn--sm`}
          onClick={() => {
            setActiveTab('ALL');
            setFilterStatus('ALL');
            pagination.setPage(1);
          }}
          style={{ borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <span>All Payment Claims</span>
          <span
            style={{
              padding: '1px 6px',
              borderRadius: 10,
              fontSize: 11,
              fontWeight: 700,
              background: activeTab === 'ALL' ? 'rgba(255,255,255,0.25)' : 'var(--ax-surface-hover, #e2e8f0)',
              color: activeTab === 'ALL' ? '#ffffff' : 'inherit',
            }}
          >
            {stats.total}
          </span>
        </button>

        <button
          type="button"
          className={`ax-btn ${activeTab === 'Pending' ? 'ax-btn--primary' : 'ax-btn--secondary'} ax-btn--sm`}
          onClick={() => {
            setActiveTab('Pending');
            setFilterStatus('Pending');
            pagination.setPage(1);
          }}
          style={{ borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <span>Payment Pending</span>
          <span
            style={{
              padding: '1px 6px',
              borderRadius: 10,
              fontSize: 11,
              fontWeight: 700,
              background: activeTab === 'Pending' ? 'rgba(255,255,255,0.25)' : 'var(--ax-surface-hover, #e2e8f0)',
              color: activeTab === 'Pending' ? '#ffffff' : 'inherit',
            }}
          >
            {stats.pending}
          </span>
        </button>

        <button
          type="button"
          className={`ax-btn ${activeTab === 'Partially' ? 'ax-btn--primary' : 'ax-btn--secondary'} ax-btn--sm`}
          onClick={() => {
            setActiveTab('Partially');
            setFilterStatus('Partially');
            pagination.setPage(1);
          }}
          style={{ borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <span>Payment Partially</span>
          <span
            style={{
              padding: '1px 6px',
              borderRadius: 10,
              fontSize: 11,
              fontWeight: 700,
              background: activeTab === 'Partially' ? 'rgba(255,255,255,0.25)' : 'var(--ax-surface-hover, #e2e8f0)',
              color: activeTab === 'Partially' ? '#ffffff' : 'inherit',
            }}
          >
            {stats.partially}
          </span>
        </button>

        <button
          type="button"
          className={`ax-btn ${activeTab === 'Paid' ? 'ax-btn--primary' : 'ax-btn--secondary'} ax-btn--sm`}
          onClick={() => {
            setActiveTab('Paid');
            setFilterStatus('Paid');
            pagination.setPage(1);
          }}
          style={{ borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <span>Payment Complete</span>
          <span
            style={{
              padding: '1px 6px',
              borderRadius: 10,
              fontSize: 11,
              fontWeight: 700,
              background: activeTab === 'Paid' ? 'rgba(255,255,255,0.25)' : 'var(--ax-surface-hover, #e2e8f0)',
              color: activeTab === 'Paid' ? '#ffffff' : 'inherit',
            }}
          >
            {stats.complete}
          </span>
        </button>
      </div>

      {/* Main Table Card */}
      <section className="ax-card ax-col--12">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">Expenses Payment Details</h2>
            <p className="ax-card__subtitle">
              Showing {filteredPayments.length} payment transaction record{filteredPayments.length === 1 ? '' : 's'}
            </p>
          </div>

          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              {search.trim() !== '' && (
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--sm"
                  onClick={() => {
                    setSearch('');
                    pagination.setPage(1);
                  }}
                  style={{ height: 30, padding: '0 8px', fontSize: '11px' }}
                >
                  Reset
                </button>
              )}
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search vendor, district, site..."
                size="sm"
              />
              <TableExportToolbar
                onCopy={() => copyRowsToClipboard(filteredPayments, exportCols)}
                onExportCSV={() => exportRowsCSV(filteredPayments, exportCols, 'Jammu_SRT_70MW_Expenses_Payment')}
                onExportExcel={() => exportRowsExcel(filteredPayments, exportCols, 'Jammu_SRT_70MW_Expenses_Payment')}
                onExportPDF={() => exportRowsPDF(filteredPayments, exportCols, 'Jammu SRT 70MW Expenses Payment')}
              />
            </div>
          </div>
        </div>

        {/* Scrollable Table matching exact user column structure */}
        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap', minWidth: 1650 }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th">S.No.</th>
                <th className="ax-table__th">Date</th>
                <th className="ax-table__th">Vendor</th>
                <th className="ax-table__th">District</th>
                <th className="ax-table__th">Site Name</th>
                <th className="ax-table__th">Purpose</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Invoice</th>
                <th className="ax-table__th ax-table__th--num">Amount</th>
                <th className="ax-table__th">Remarks</th>
                <th className="ax-table__th ax-table__th--num">Pay Amount</th>
                <th className="ax-table__th ax-table__th--num">Balance Amount</th>
                <th className="ax-table__th">Pay Date</th>
                <th className="ax-table__th">Pay Remarks</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Pay Status</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={15} style={centerCell}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <span className="ax-spinner" aria-hidden="true" />
                      <span>Loading payment records...</span>
                    </div>
                  </td>
                </tr>
              ) : pagination.paged.length === 0 ? (
                <tr>
                  <td colSpan={15} style={centerCell}>
                    <TableEmptyState
                      title="No payment records found"
                      description={search ? 'Try adjusting your search query' : 'No disbursement records found for this filter'}
                    />
                  </td>
                </tr>
              ) : (
                pagination.paged.map((item, idx) => {
                  const serialNo = (pagination.curPage - 1) * pagination.pageSize + idx + 1;
                  const isPaid = item.pay_status === 'Paid';
                  const isPartial = item.pay_status === 'Partially';

                  return (
                    <tr key={item.id}>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{serialNo}</td>
                      <td className="ax-table__td" style={{ fontSize: 12 }}>{item.date}</td>
                      <td className="ax-table__td" style={{ fontWeight: 700, color: '#0f172a' }}>{item.vendor}</td>
                      <td className="ax-table__td">{item.district}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: '#2563eb' }}>
                        {item.site_name}
                        {item.site_code && (
                          <span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>({item.site_code})</span>
                        )}
                      </td>
                      <td className="ax-table__td" style={{ maxWidth: 220, whiteSpace: 'normal', fontSize: 12 }}>
                        {item.purpose}
                      </td>

                      {/* Invoice Thumbnail */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <MediaFileThumbnail file={item.invoice} onClick={(url) => setLightboxUrl(url)} />
                      </td>

                      <td className="ax-table__td ax-table__td--num" style={{ fontWeight: 800 }}>
                        ₹{item.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="ax-table__td" style={{ maxWidth: 180, whiteSpace: 'normal', fontSize: 12 }}>
                        {item.remarks || '—'}
                      </td>
                      <td className="ax-table__td ax-table__td--num" style={{ fontWeight: 700, color: '#16a34a' }}>
                        {item.pay_amount != null && item.pay_amount > 0
                          ? `₹${item.pay_amount.toLocaleString('en-IN')}`
                          : '—'}
                      </td>
                      <td className="ax-table__td ax-table__td--num" style={{ fontWeight: 700, color: '#dc2626' }}>
                        {item.balance_amount != null
                          ? `₹${item.balance_amount.toLocaleString('en-IN')}`
                          : `₹${item.amount.toLocaleString('en-IN')}`}
                      </td>
                      <td className="ax-table__td" style={{ fontSize: 12 }}>{item.pay_date || '—'}</td>
                      <td className="ax-table__td" style={{ maxWidth: 180, whiteSpace: 'normal', fontSize: 12 }}>
                        {item.pay_remarks || '—'}
                      </td>

                      {/* Pay Status badge */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {isPaid ? (
                          <span
                            className="ax-badge"
                            style={{
                              padding: '3px 8px',
                              fontSize: 11,
                              fontWeight: 700,
                              color: '#16a34a',
                              background: 'rgba(22, 163, 74, 0.1)',
                              border: '1px solid rgba(22, 163, 74, 0.25)',
                              borderRadius: 6,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a' }} />
                            Complete
                          </span>
                        ) : isPartial ? (
                          <span
                            className="ax-badge"
                            style={{
                              padding: '3px 8px',
                              fontSize: 11,
                              fontWeight: 700,
                              color: '#2563eb',
                              background: 'rgba(37, 99, 235, 0.1)',
                              border: '1px solid rgba(37, 99, 235, 0.25)',
                              borderRadius: 6,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563eb' }} />
                            Partially
                          </span>
                        ) : (
                          <span
                            className="ax-badge"
                            style={{
                              padding: '3px 8px',
                              fontSize: 11,
                              fontWeight: 700,
                              color: '#d97706',
                              background: 'rgba(217, 119, 6, 0.1)',
                              border: '1px solid rgba(217, 119, 6, 0.25)',
                              borderRadius: 6,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#d97706' }} />
                            Pending
                          </span>
                        )}
                      </td>

                      {/* Action column */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          {item.can_pay ? (
                            <button
                              type="button"
                              onClick={() => handleOpenSettle(item)}
                              className="ax-btn ax-btn--primary ax-btn--sm"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '4px 10px',
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: 'pointer',
                                height: 'auto',
                                lineHeight: 1.2,
                                whiteSpace: 'nowrap',
                              }}
                              title="Disburse Settlement"
                            >
                              <svg
                                viewBox="0 0 24 24"
                                width="12"
                                height="12"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2.5}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              Pay Now
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled
                              title="Settled (Locked)"
                              className="ax-btn ax-btn--secondary ax-btn--sm"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '4px 8px',
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: 'not-allowed',
                                height: 'auto',
                                lineHeight: 1.2,
                                whiteSpace: 'nowrap',
                                opacity: 0.7,
                              }}
                            >
                              <svg
                                viewBox="0 0 24 24"
                                width="12"
                                height="12"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                              >
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                              </svg>
                              Paid
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenSettle(item)}
                            title="View Payment Breakdown"
                            className="ax-btn ax-btn--secondary ax-btn--sm"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              padding: '4px 8px',
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: 'pointer',
                              height: 'auto',
                              lineHeight: 1.2,
                              whiteSpace: 'nowrap',
                            }}
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

        {/* Footer Pagination */}
        <div className="ax-card__footer" style={footerStyle}>
          <div className="ula-pagination-left">
            <Pagination
              currentPage={pagination.curPage}
              totalItems={pagination.totalItems}
              pageSize={pagination.pageSize}
              onPageChange={pagination.setPage}
              onPageSizeChange={pagination.setPageSize}
              pageSizeOptions={[10, 25, 50, 100]}
            />
          </div>
        </div>
      </section>

      {/* ── Settlement / Disburse Modal ── */}
      <Modal
        open={Boolean(settleItem)}
        onClose={() => {
          setSettleItem(null);
          setSubmitError(null);
        }}
        title={
          settleItem?.can_pay
            ? 'Disburse & Settle Expense Payment'
            : 'Expense Payment & Installment Details'
        }
        subtitle={
          settleItem
            ? `Vendor: ${settleItem.vendor} | Site: ${settleItem.site_name}${
                settleItem.site_code ? ` (${settleItem.site_code})` : ''
              } | Claim #${settleItem.id}`
            : ''
        }
        maxWidth={620}
        footer={
          <>
            <button
              type="button"
              className="ax-btn ax-btn--secondary"
              onClick={() => {
                setSettleItem(null);
                setSubmitError(null);
              }}
              disabled={isSubmitting}
            >
              {settleItem?.can_pay ? 'Cancel' : 'Close'}
            </button>
            {settleItem?.can_pay ? (
              <button
                type="button"
                className="ax-btn ax-btn--primary"
                onClick={handleConfirmSettlement}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Processing...' : 'Confirm Disbursement'}
              </button>
            ) : null}
          </>
        }
      >
        {settleItem && (
          <form onSubmit={handleConfirmSettlement}>
            {submitError && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#991b1b',
                  padding: '10px 14px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  marginBottom: 14,
                }}
              >
                ⚠️ {submitError}
              </div>
            )}

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

            {!settleItem.can_pay ? (
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: 8,
                  padding: '12px 14px',
                  fontSize: 13,
                  color: '#166534',
                  marginBottom: 16,
                }}
              >
                ✓ <strong>Payment Complete:</strong> The full reimbursement claim of ₹
                {settleItem.amount.toLocaleString('en-IN')} has been disbursed. No further balance is pending.
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                      Disbursement Amount (₹) <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <input
                      type="number"
                      className="ax-input"
                      min={1}
                      max={settleItem.balance_amount != null ? settleItem.balance_amount : settleItem.amount}
                      value={payAmountInput}
                      onChange={(e) => setPayAmountInput(Number(e.target.value))}
                      required
                      style={{ width: '100%', padding: '8px 12px', fontSize: 14, borderRadius: 6 }}
                    />
                    <span style={{ fontSize: 11, color: '#64748b' }}>
                      Max: ₹{(settleItem.balance_amount != null ? settleItem.balance_amount : settleItem.amount).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                      Disbursement Date <span style={{ color: '#dc2626' }}>*</span>
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
                    Disbursement Remarks
                  </label>
                  <textarea
                    className="ax-input"
                    rows={2}
                    placeholder="Enter banking voucher number, RTGS reference, or disbursement note..."
                    value={payRemarksInput}
                    onChange={(e) => setPayRemarksInput(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', fontSize: 13, borderRadius: 6 }}
                  />
                </div>
              </>
            )}

            {/* Past Installment History */}
            {settleItem.allpayment && settleItem.allpayment.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
                  Previous Payment Installments ({settleItem.allpayment.length})
                </div>
                <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 600 }}>#</th>
                        <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 600 }}>Date</th>
                        <th style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 600 }}>Paid (₹)</th>
                        <th style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 600 }}>Balance (₹)</th>
                        <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 600 }}>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {settleItem.allpayment.map((pay, pIdx) => (
                        <tr key={pay.id || pIdx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '6px 10px', color: '#64748b' }}>{pIdx + 1}</td>
                          <td style={{ padding: '6px 10px' }}>{pay.date || '—'}</td>
                          <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 600, color: '#16a34a' }}>
                            ₹{Number(pay.amount).toLocaleString('en-IN')}
                          </td>
                          <td style={{ padding: '6px 10px', textAlign: 'right', color: '#dc2626' }}>
                            ₹{Number(pay.balance).toLocaleString('en-IN')}
                          </td>
                          <td style={{ padding: '6px 10px', color: '#64748b' }}>{pay.pay_remarks || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </form>
        )}
      </Modal>

      {/* ── Invoice Document Lightbox Preview ── */}
      <Modal open={Boolean(lightboxUrl)} onClose={() => setLightboxUrl(null)} title="Claim Invoice Document" maxWidth={750}>
        {lightboxUrl && (
          <div style={{ textAlign: 'center', padding: 8 }}>
            <div style={{ maxHeight: '72vh', overflow: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {/\.pdf($|\?)/i.test(lightboxUrl) ? (
                <iframe src={lightboxUrl} style={{ width: '100%', height: '70vh', border: 'none', borderRadius: 8 }} title="PDF Preview" />
              ) : (
                <img
                  src={lightboxUrl}
                  alt="Invoice Document"
                  style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 8 }}
                />
              )}
            </div>
            <div style={{ marginTop: 14 }}>
              <a
                href={lightboxUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ax-btn ax-btn--primary ax-btn--sm"
                style={{ textDecoration: 'none', padding: '6px 16px' }}
              >
                Open in New Tab ↗
              </a>
            </div>
          </div>
        )}
      </Modal>

      {/* Toast Notification */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            top: 24,
            right: 24,
            zIndex: 10000,
            background: toastMsg.type === 'error' ? '#ef4444' : '#16a34a',
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
          <span>{toastMsg.type === 'error' ? '⚠️' : '✓'}</span>
          <span>{toastMsg.message}</span>
        </div>
      )}
    </div>
  );
}

export default SrtExpenseViewPayments;
