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
  jammuSslAdminService,
  resolveJammuSslMediaUrl,
  type SslPaymentRegisterItem,
  type VendorItem,
  type ViewPaymentData,
} from './jammuSslAdminService';

type TabType = 'pending' | 'completed' | 'all';

/* ───────── Responsive page CSS (Exact Reference, all columns scrollable) ───────── */
const PAGE_CSS = `
  .solar-erp-page {
    --asw-primary: var(--ax-accent, #2563eb);
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

  .solar-erp-page .asw-tabs-wrap {
    display: flex;
    gap: 8px;
    margin-bottom: 20px;
  }
  .solar-erp-page .asw-tab-btn {
    padding: 8px 18px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    border: 1px solid var(--ax-border, #cbd5e1);
    background: var(--ax-surface, #ffffff);
    color: var(--ax-text-muted, #64748b);
    transition: all 0.15s ease;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .solar-erp-page .asw-tab-btn:hover {
    color: var(--ax-accent, #2563eb);
    border-color: var(--ax-accent, #2563eb);
  }
  .solar-erp-page .asw-tab-btn--active {
    background: var(--ax-gradient-accent, var(--ax-accent, #2563eb)) !important;
    color: var(--ax-on-accent, #ffffff) !important;
    border-color: transparent !important;
    box-shadow: 0 2px 6px rgba(37, 99, 235, 0.25);
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
  .solar-erp-page .ax-cluster {
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

  /* All table columns fully scrollable horizontally - no sticky/fixed columns */
  .solar-erp-page .ax-table-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    width: 100%;
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

  @media (max-width: 490px) {
    .solar-erp-page .ax-export-toolbar__button {
      font-size: 11px;
      height: 28px;
      padding: 0 6px !important;
    }
    .solar-erp-page .ax-export-toolbar { gap: 4px; }
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

/* ───────── Modal Dialog Component ───────── */
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

/* ── Top KPI Card Component ── */
type KpiTone = 'accent' | 'cyan' | 'emerald' | 'amber';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(var(--asw-primary-rgb), 0.12)', fg: 'var(--ax-accent, #2563eb)' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan, #06b6d4) 14%, transparent)', fg: '#0891b2' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald, #10b981) 14%, transparent)', fg: '#16a34a' },
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

const escapeHtml = (s: string) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const num = (x: number | string | undefined | null) => Number(x || 0).toLocaleString('en-IN');

const fmtDate = (val?: string | null): string => {
  if (!val) return '—';
  try {
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    }
  } catch {}
  return String(val).slice(0, 10);
};

/* ── In-Row Media File Thumbnail Component ── */
function MediaFileThumbnail({ file, onClick }: { file?: string | null; onClick: (url: string) => void }) {
  if (!file) {
    return <span style={{ color: 'var(--ax-text-muted)', fontSize: 12 }}>—</span>;
  }

  const url = resolveJammuSslMediaUrl(file);
  const isPdf = /\.pdf($|\?)/i.test(file);
  const isHeic = /\.heic($|\?)/i.test(file);
  const isImage = /\.(jpe?g|png|webp|gif|bmp|svg)($|\?)/i.test(file);

  return (
    <div
      onClick={() => onClick(url)}
      title="Click to preview file"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 44,
        height: 44,
        borderRadius: 8,
        border: '1px solid #cbd5e1',
        background: '#f8fafc',
        cursor: 'pointer',
        overflow: 'hidden',
        position: 'relative',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.06)';
        e.currentTarget.style.borderColor = 'var(--ax-accent, #2563eb)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.borderColor = '#cbd5e1';
      }}
    >
      {isImage ? (
        <img
          src={url}
          alt="Thumbnail"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e) => {
            (e.currentTarget as HTMLElement).style.display = 'none';
            if (e.currentTarget.parentElement) {
              const span = document.createElement('span');
              span.innerText = 'IMG';
              span.style.fontSize = '10px';
              span.style.fontWeight = '700';
              span.style.color = 'var(--ax-accent, #2563eb)';
              e.currentTarget.parentElement.appendChild(span);
            }
          }}
        />
      ) : isPdf ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth={2} style={{ width: 18, height: 18 }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#ef4444', lineHeight: 1 }}>PDF</span>
        </div>
      ) : isHeic ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth={2} style={{ width: 18, height: 18 }}>
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#8b5cf6', lineHeight: 1 }}>HEIC</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--ax-accent, #2563eb)" strokeWidth={2} style={{ width: 18, height: 18 }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--ax-accent, #2563eb)', lineHeight: 1 }}>DOC</span>
        </div>
      )}
    </div>
  );
}

export function SslPaymentRequest() {
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [payments, setPayments] = useState<SslPaymentRegisterItem[]>([]);
  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [summaryData, setSummaryData] = useState<ViewPaymentData | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Filters
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  // Search input
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Payment Disbursement Modal state
  const [payTarget, setPayTarget] = useState<SslPaymentRegisterItem | null>(null);
  const [disburseAmount, setDisburseAmount] = useState<string>('');
  const [disburseDate, setDisburseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [disburseRemarks, setDisburseRemarks] = useState<string>('');
  const [submittingDisburse, setSubmittingDisburse] = useState<boolean>(false);

  // Lightbox preview state
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const fetchPayments = useCallback(
    async (overrideParams?: { from_date?: string; to_date?: string; vendor?: string }) => {
      setLoading(true);
      setErrorMsg('');
      try {
        const params = {
          from_date: overrideParams?.from_date !== undefined ? overrideParams.from_date : fromDate || undefined,
          to_date: overrideParams?.to_date !== undefined ? overrideParams.to_date : toDate || undefined,
          vendor: overrideParams?.vendor !== undefined ? overrideParams.vendor : selectedVendor || undefined,
        };

        const res: ViewPaymentData = await jammuSslAdminService.getViewPayment(params);
        setPayments(Array.isArray(res.payments) ? res.payments : []);
        setVendors(Array.isArray(res.vendors) ? res.vendors : []);
        setSummaryData(res);
      } catch (err: any) {
        console.error('Failed to load Jammu SSL payment records:', err);
        setErrorMsg(err?.message || 'Failed to fetch payment records.');
        setPayments([]);
        setVendors([]);
        setSummaryData(null);
      } finally {
        setLoading(false);
      }
    },
    [fromDate, toDate, selectedVendor]
  );

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const currentFilters = () => ({
    from_date: fromDate || undefined,
    to_date: toDate || undefined,
    vendor: selectedVendor || undefined,
  });

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fromDate && toDate && fromDate > toDate) {
      return setErrorMsg('From date cannot be greater than To date.');
    }
    fetchPayments();
  };

  const handleResetFilters = () => {
    setFromDate('');
    setToDate('');
    setSelectedVendor('');
    setSelectedStatus('All');
    setSearchQuery('');
    fetchPayments({ from_date: '', to_date: '', vendor: '' });
  };

  // Open Disburse Modal
  const handleOpenPay = (row: SslPaymentRegisterItem) => {
    if (Number(row.status) === 1 || Number(row.payment_status) === 1) {
      setErrorMsg('This payment has already been disbursed and is locked.');
      return;
    }
    setPayTarget(row);
    setErrorMsg('');
    const claim = parseFloat(String(row.claim_amount || 0));
    setDisburseAmount(
      row.pay_amount
        ? String(row.pay_amount)
        : !isNaN(claim) && claim > 0
        ? String(claim)
        : ''
    );
    setDisburseDate(row.payment_date ? row.payment_date.slice(0, 10) : new Date().toISOString().split('T')[0]);
    setDisburseRemarks(row.payment_remark || row.payment_remarks || '');
  };

  // Submit Disburse
  const handleDisburseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payTarget) return;

    const amt = parseFloat(disburseAmount);
    if (isNaN(amt) || amt < 0) {
      return setErrorMsg('Please enter a valid disbursement amount.');
    }
    if (!disburseDate) {
      return setErrorMsg('Disbursement date is required.');
    }

    setSubmittingDisburse(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await jammuSslAdminService.updatePaymentStatus({
        update_id: payTarget.id,
        id: payTarget.id,
        payment_amount: amt,
        amount: amt,
        date: disburseDate,
        payment_remarks: disburseRemarks.trim() || undefined,
        remarks: disburseRemarks.trim() || undefined,
      });

      setSuccessMsg(res?.message || 'Payment recorded successfully!');
      setPayTarget(null);
      setDisburseAmount('');
      setDisburseRemarks('');
      await fetchPayments(currentFilters());
    } catch (err: any) {
      console.error('Payment disbursement submit error:', err);
      setErrorMsg(err?.message || 'Failed to update payment disbursement.');
    } finally {
      setSubmittingDisburse(false);
    }
  };

  // Filtered payments by tab, status and search
  const filteredPayments = useMemo(() => {
    let list = payments;

    // Tab filter
    if (activeTab === 'pending') {
      list = list.filter((r) => Number(r.status) !== 1 && Number(r.payment_status) !== 1);
    } else if (activeTab === 'completed') {
      list = list.filter((r) => Number(r.status) === 1 || Number(r.payment_status) === 1);
    }

    // Pay Status dropdown filter
    if (selectedStatus !== 'All') {
      const isDoneRequired = selectedStatus === '1';
      list = list.filter((r) => {
        const isDone = Number(r.status) === 1 || Number(r.payment_status) === 1;
        return isDoneRequired ? isDone : !isDone;
      });
    }

    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;

    return list.filter((r) =>
      [
        r.vendor_name,
        r.state,
        r.district,
        r.claim_invoice,
        r.claim_amount,
        r.claim_approved_by,
        r.pay_amount,
        r.payment_amount,
        r.payment_by,
        r.payment_remark,
        r.payment_remarks,
      ].some((v) => String(v ?? '').toLowerCase().includes(q))
    );
  }, [payments, activeTab, selectedStatus, searchQuery]);

  const pagination = usePagination(filteredPayments, { initialPageSize: 100 });

  // Top 4 KPI counters
  const totalRequests = summaryData?.payment_request ?? payments.length;
  const totalComplete = summaryData?.payment_complete ?? payments.filter((p) => Number(p.status) === 1 || Number(p.payment_status) === 1).length;
  const totalPending = summaryData?.payment_pending ?? payments.filter((p) => Number(p.status) !== 1 && Number(p.payment_status) !== 1).length;
  const totalDisbursedAmount = useMemo(() => {
    return payments.reduce((acc, p) => {
      const isPaid = Number(p.status) === 1 || Number(p.payment_status) === 1;
      return acc + (isPaid ? Number(p.pay_amount || p.payment_amount || 0) : 0);
    }, 0);
  }, [payments]);

  // Export Columns definition
  const exportCols: ExportColumn<SslPaymentRegisterItem>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r: SslPaymentRegisterItem, idx?: number) => (idx !== undefined ? idx + 1 : '') } as any,
      { header: 'Vendor', accessor: (r) => r.vendor_name || `Vendor #${r.vendor_id ?? r.id}` },
      { header: 'State', accessor: () => 'JAMMU' },
      { header: 'Site Count', accessor: (r) => r.site_count ?? r.claim_site_count ?? 1 },
      { header: 'Claim Invoice', accessor: (r) => r.claim_invoice || '—' },
      { header: 'Claim Amount', accessor: (r) => `₹ ${num(r.claim_amount)}` },
      { header: 'Claim Approved Date', accessor: (r) => fmtDate(r.claim_approved_date) },
      { header: 'Claim Approved by', accessor: (r) => r.claim_approved_by || 'Admin' },
      { header: 'Payment Date', accessor: (r) => fmtDate(r.payment_date) },
      { header: 'Payment By', accessor: (r) => r.payment_by || '—' },
      { header: 'Payment Amount', accessor: (r) => (r.pay_amount ? `₹ ${num(r.pay_amount)}` : '—') },
      { header: 'Payment Remarks', accessor: (r) => r.payment_remark || r.payment_remarks || r.remarks || '—' },
      { header: 'Payment Status', accessor: (r) => (Number(r.status) === 1 || Number(r.payment_status) === 1 ? 'Complete' : 'Pending') },
    ],
    []
  );

  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = `Jammu_SSL_Payment_${activeTab}`;
  const fileTitle = `Jammu SSL Installation Payment Desk - ${activeTab === 'pending' ? 'Pending' : activeTab === 'completed' ? 'Completed' : 'All'}`;

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
    const csv = out.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
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
      alert('Data copied to clipboard!');
    } catch {
      const ta = document.createElement('textarea');
      ta.value = t;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      alert('Data copied to clipboard!');
    }
  };

  const exportToExcel = <T,>(list: T[], columns: ExportColumn<T>[], filename: string) => {
    if (!list.length || !columns.length) return;
    const tableHtml = `<table border="1"><thead><tr>${columns.map((c) => `<th>${escapeHtml(escapeExportValue(c.header))}</th>`).join('')}</tr></thead><tbody>${list.map((row, idx) => `<tr>${columns.map((c) => `<td>${escapeHtml(escapeExportValue(getExportValue(row, c, idx)))}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8" /></head><body>${tableHtml}</body></html>`;
    downloadTextFile(`\ufeff${html}`, `${filename}.xls`, 'application/vnd.ms-excel');
  };

  const exportToPDF = <T,>(list: T[], columns: ExportColumn<T>[], title: string) => {
    if (!list.length || !columns.length) return;
    const body = list.map((row, idx) => columns.map((c) => escapeHtml(escapeExportValue(getExportValue(row, c, idx)))));
    const w = window.open('', '_blank', 'width=1200,height=800');
    if (!w) return;
    w.document.write(`<!doctype html><html><head><meta charset="UTF-8" /><title>${escapeHtml(title)}</title><style>
      *{box-sizing:border-box}body{font-family:Arial,sans-serif;padding:24px;color:#222}h1{font-size:20px;margin:0 0 16px}
      table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #d8dee6;padding:6px 8px;text-align:left;vertical-align:top}
      th{background:#f3f5f7;font-weight:700}@media print{body{padding:0}@page{size:landscape;margin:10mm}}
    </style></head><body><h1>${escapeHtml(title)}</h1><table><thead><tr>${columns.map((c) => `<th>${escapeHtml(escapeExportValue(c.header))}</th>`).join('')}</tr></thead><tbody>${body.map((r) => `<tr>${r.map((v) => `<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table><script>window.onload=function(){window.print();};</script></body></html>`);
    w.document.close();
    w.focus();
  };

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      <PageHead
        title="Jammu SSL Installation Payment Desk"
        subtitle="Process and disburse installation payments against approved Jammu SSL claims"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Jammu' },
          { label: 'SSL', href: '/vendor-management/jammu/installation/ssl' },
          { label: 'View Payment' },
        ]}
      />

      {/* ── Status Feedback Banners ── */}
      {errorMsg && (
        <div
          style={{
            padding: '12px 16px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>✕ {errorMsg}</span>
          <button
            type="button"
            onClick={() => setErrorMsg('')}
            style={{ background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer', fontSize: 16 }}
          >
            ×
          </button>
        </div>
      )}

      {successMsg && (
        <div
          style={{
            padding: '12px 16px',
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#065f46',
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>✓ {successMsg}</span>
          <button
            type="button"
            onClick={() => setSuccessMsg('')}
            style={{ background: 'none', border: 'none', color: '#065f46', cursor: 'pointer', fontSize: 16 }}
          >
            ×
          </button>
        </div>
      )}

      {/* ── Top 4 KPI Metric Cards in .asw-cards-row ── */}
      <div className="asw-cards-row">
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
              <line x1="1" y1="10" x2="23" y2="10" />
            </svg>
          }
          tone="accent"
          label="Total Payment Request"
          value={totalRequests}
          sub="Approved installation claims"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
          tone="emerald"
          label="Complete Payments"
          value={totalComplete}
          sub="Disbursements completed"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
          tone="cyan"
          label="Total Disbursed (₹)"
          value={`₹ ${totalDisbursedAmount.toLocaleString('en-IN')}`}
          sub="Disbursed payment value"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
          tone="amber"
          label="Pending Payments"
          value={totalPending}
          sub="Awaiting disbursement"
        />
      </div>

      {/* ── Filter By Date & Status Card ── */}
      <div className="asw-filter-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--ax-text-strong)' }}>
            Filter By Date & Status
          </h4>
        </div>
        <form onSubmit={handleFilterSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 150px', minWidth: 140 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, color: '#64748b' }}>
              From Date
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
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
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="ax-input"
              style={{ width: '100%', height: 34, padding: '0 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12 }}
            />
          </div>

          <div style={{ flex: '1 1 170px', minWidth: 150 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, color: '#64748b' }}>
              Vendor
            </label>
            <select
              value={selectedVendor}
              onChange={(e) => setSelectedVendor(e.target.value)}
              className="ax-select"
              style={{ width: '100%', height: 34, padding: '0 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12 }}
            >
              <option value="">All Vendors</option>
              {vendors.map((v) => (
                <option key={v.id} value={String(v.id)}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ flex: '1 1 150px', minWidth: 130 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, color: '#64748b' }}>
              Pay Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="ax-select"
              style={{ width: '100%', height: 34, padding: '0 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12 }}
            >
              <option value="All">All Statuses</option>
              <option value="1">Complete / Done</option>
              <option value="0">Pending</option>
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

      {/* ── Payment Tabs ── */}
      <div className="asw-tabs-wrap">
        <button
          type="button"
          className={`asw-tab-btn ${activeTab === 'pending' ? 'asw-tab-btn--active ax-btn--primary' : ''}`}
          onClick={() => {
            setActiveTab('pending');
            pagination.setPage(1);
          }}
        >
          Pending Payments ({totalPending})
        </button>
        <button
          type="button"
          className={`asw-tab-btn ${activeTab === 'completed' ? 'asw-tab-btn--active ax-btn--primary' : ''}`}
          onClick={() => {
            setActiveTab('completed');
            pagination.setPage(1);
          }}
        >
          Completed Payments ({totalComplete})
        </button>
        <button
          type="button"
          className={`asw-tab-btn ${activeTab === 'all' ? 'asw-tab-btn--active ax-btn--primary' : ''}`}
          onClick={() => {
            setActiveTab('all');
            pagination.setPage(1);
          }}
        >
          All Records ({payments.length})
        </button>
      </div>

      {/* ── Main Data Card ── */}
      <section className="ax-card ax-col--12">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">
              {activeTab === 'pending'
                ? 'Pending Payment Requests'
                : activeTab === 'completed'
                ? 'Completed Disbursements'
                : 'All Jammu SSL Payment Requests'}
            </h2>
            <p className="ax-card__subtitle">
              Showing {filteredPayments.length} payment record{filteredPayments.length === 1 ? '' : 's'}
            </p>
          </div>
          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              {searchQuery.trim() !== '' && (
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--sm"
                  onClick={() => {
                    setSearchQuery('');
                    pagination.setPage(1);
                  }}
                  style={{ height: 30, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }}
                >
                  Reset
                </button>
              )}
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search vendor, district, invoice..."
                size="sm"
              />
              <TableExportToolbar
                onCopy={() => copyToClipboard(filteredPayments, exportCols)}
                onExportCSV={() => exportToCSV(filteredPayments, exportCols, `${fileBase}_${stamp}`)}
                onExportExcel={() => exportToExcel(filteredPayments, exportCols, `${fileBase}_${stamp}`)}
                onExportPDF={() => exportToPDF(filteredPayments, exportCols, fileTitle)}
              />
            </div>
          </div>
        </div>

        {/* ── Responsive Horizontal Scroll Table ── */}
        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap', minWidth: 1400 }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th">Sr. No.</th>
                <th className="ax-table__th">Vendor</th>
                <th className="ax-table__th">State</th>
                <th className="ax-table__th">Site Count</th>
                <th className="ax-table__th">Claim Invoice</th>
                <th className="ax-table__th">Claim Amount</th>
                <th className="ax-table__th">Claim Approved Date</th>
                <th className="ax-table__th">Claim Approved by</th>
                <th className="ax-table__th">Payment Date</th>
                <th className="ax-table__th">Payment By</th>
                <th className="ax-table__th">Payment Amount</th>
                <th className="ax-table__th">Payment Remarks</th>
                <th className="ax-table__th">Payment Status</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={14} style={centerCell}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <span className="ax-spinner" aria-hidden="true" />
                      <span>Loading payment records...</span>
                    </div>
                  </td>
                </tr>
              ) : pagination.paged.length === 0 ? (
                <tr>
                  <td colSpan={14} style={centerCell}>
                    <TableEmptyState
                      title="No payment records found"
                      description={searchQuery || fromDate || toDate ? 'Try adjusting your search filters' : 'No records pending payment disbursement'}
                    />
                  </td>
                </tr>
              ) : (
                pagination.paged.map((row: SslPaymentRegisterItem, idx: number) => {
                  const globalIdx = (pagination.curPage - 1) * pagination.pageSize + idx + 1;
                  const isDone = Number(row.status) === 1 || Number(row.payment_status) === 1;
                  const claimAmt = Number(row.claim_amount || 0);
                  const payAmt = Number(row.pay_amount || row.payment_amount || 0);
                  const payDate = row.payment_date || row.disbursed_date || row.date;
                  const remark = row.payment_remark || row.payment_remarks || row.remarks;

                  return (
                    <tr key={row.id ?? idx}>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{globalIdx}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                        {row.vendor_name || `Vendor #${row.vendor_id ?? row.id}`}
                      </td>
                      <td className="ax-table__td">JAMMU</td>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>
                        {row.site_count ?? row.claim_site_count ?? 1}
                      </td>
                      <td className="ax-table__td">
                        <MediaFileThumbnail file={row.claim_invoice} onClick={setLightboxUrl} />
                      </td>
                      <td className="ax-table__td" style={{ fontWeight: 700, color: 'var(--ax-text-strong)' }}>
                        ₹ {claimAmt.toLocaleString('en-IN')}
                      </td>
                      <td className="ax-table__td">{fmtDate(row.claim_approved_date)}</td>
                      <td className="ax-table__td">{row.claim_approved_by || 'Admin'}</td>
                      <td className="ax-table__td">{fmtDate(payDate)}</td>
                      <td className="ax-table__td">{row.payment_by || (isDone ? 'Finance' : '—')}</td>
                      <td className="ax-table__td" style={{ fontWeight: 700, color: '#16a34a' }}>
                        {payAmt > 0 ? `₹ ${payAmt.toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="ax-table__td" style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }} title={remark || ''}>
                        {remark || '—'}
                      </td>
                      <td className="ax-table__td">
                        {isDone ? (
                          <span className="ax-badge ax-badge--soft ax-badge--success" style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>
                            Complete
                          </span>
                        ) : (
                          <span className="ax-badge ax-badge--soft ax-badge--warning" style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {isDone ? (
                          <button
                            type="button"
                            disabled
                            title="Payment completed & disbursed. Further action is locked."
                            className="ax-btn ax-btn--secondary ax-btn--sm"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                              opacity: 0.65,
                              cursor: 'not-allowed',
                            }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                            Locked
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenPay(row)}
                            className="ax-btn ax-btn--primary ax-btn--sm"
                          >
                            Disburse
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

        {/* ── Left Aligned Pagination in Footer ── */}
        <div className="ax-card__footer" style={footerStyle}>
          <div className="ula-pagination-left">
            <Pagination
              currentPage={pagination.curPage}
              totalItems={pagination.totalItems}
              pageSize={pagination.pageSize}
              onPageChange={pagination.setPage}
              onPageSizeChange={pagination.setPageSize}
              pageSizeOptions={[10, 25, 50, 100, 200]}
            />
          </div>
        </div>
      </section>

      {/* ── Action Disbursement Modal ── */}
      <Modal
        open={Boolean(payTarget)}
        onClose={() => {
          if (!submittingDisburse) {
            setPayTarget(null);
          }
        }}
        title="Process Installation Payment"
        subtitle={
          payTarget
            ? `Vendor: ${payTarget.vendor_name || '—'} • Claim: ₹ ${Number(payTarget.claim_amount || 0).toLocaleString('en-IN')} (${payTarget.site_count ?? 1} Lights)`
            : ''
        }
        maxWidth={500}
        footer={
          <>
            <button
              type="button"
              className="ax-btn ax-btn--secondary"
              onClick={() => setPayTarget(null)}
              disabled={submittingDisburse}
              style={{ padding: '7px 14px', fontSize: 13 }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDisburseSubmit}
              disabled={submittingDisburse}
              className="ax-btn ax-btn--primary"
              style={{
                padding: '7px 18px',
                fontSize: 13,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {submittingDisburse && <span className="ax-spinner" style={{ width: 12, height: 12 }} />}
              Record Payment
            </button>
          </>
        }
      >
        <form onSubmit={handleDisburseSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--ax-text-strong)' }}>
              Payment Amount (₹) <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={disburseAmount}
              onChange={(e) => setDisburseAmount(e.target.value)}
              required
              placeholder="e.g. 15000"
              className="ax-input"
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--ax-text-strong)' }}>
              Payment Date <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="date"
              value={disburseDate}
              onChange={(e) => setDisburseDate(e.target.value)}
              required
              className="ax-input"
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--ax-text-strong)' }}>
              Payment Remarks / Reference UTR
            </label>
            <textarea
              rows={3}
              value={disburseRemarks}
              onChange={(e) => setDisburseRemarks(e.target.value)}
              placeholder="Enter bank UTR / transaction remarks…"
              className="ax-textarea"
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
            />
          </div>
        </form>
      </Modal>

      {/* ── Document / Invoice Lightbox Preview Modal ── */}
      {lightboxUrl && (
        <div
          onClick={() => setLightboxUrl(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              background: '#ffffff',
              borderRadius: 12,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 18px',
                borderBottom: '1px solid #e2e8f0',
                background: '#f8fafc',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>Claim Invoice Preview</span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <a
                  href={lightboxUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="ax-btn ax-btn--primary ax-btn--sm"
                  style={{
                    textDecoration: 'none',
                  }}
                >
                  Open in New Tab ↗
                </a>
                <button
                  type="button"
                  onClick={() => setLightboxUrl(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: 18,
                    cursor: 'pointer',
                    color: '#64748b',
                    padding: '0 4px',
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
            <div style={{ padding: 16, overflow: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {/\.pdf($|\?)/i.test(lightboxUrl) ? (
                <iframe src={lightboxUrl} style={{ width: '80vw', height: '75vh', border: 'none' }} title="PDF Preview" />
              ) : (
                <img src={lightboxUrl} alt="Invoice Preview" style={{ maxWidth: '85vw', maxHeight: '75vh', objectFit: 'contain' }} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SslPaymentRequest;
export { SslPaymentRequest as ViewSslPayment };
