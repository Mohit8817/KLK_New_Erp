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
  jammuRescoAdminService,
  resolveJammuMediaUrl,
  type VendorItem,
} from './jammuRescoAdminService';

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
    flex: 1 1 160px;
    min-width: 220px;
    max-width: 280px;
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
    width: 100%;
  }

  @media (max-width: 768px) {
    .solar-erp-page .ax-card__header {
      flex-wrap: wrap;
    }
    .solar-erp-page .ax-card__actions {
      width: 100%;
      justify-content: flex-start;
      margin-left: 0;
      margin-top: 8px;
    }
    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] {
      max-width: 180px;
    }
  }
`;

/* ───────── Overlay CSS (dialogs & lightbox) ───────── */
const OVERLAY_CSS = `
  .ax-modal {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--ax-space-4, 16px);
  }
  .ax-modal__backdrop {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.55);
    backdrop-filter: blur(4px);
    z-index: -1;
  }
  .ax-modal__dialog {
    background: var(--ax-surface, #ffffff);
    border: 1px solid var(--ax-border, #e2e8f0);
    border-radius: var(--ax-radius-lg, 12px);
    box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.25);
    width: 100%;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .ax-modal__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--ax-space-3, 12px) var(--ax-space-4, 16px);
    border-bottom: 1px solid var(--ax-border, #e2e8f0);
    background: var(--ax-surface-subtle, #f8fafc);
  }
  .ax-modal__close {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 16px;
    color: var(--ax-text-muted, #64748b);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
    border-radius: 4px;
  }
  .ax-modal__close:hover {
    color: var(--ax-text-strong, #0f172a);
    background: var(--ax-surface-hover, #f1f5f9);
  }
  .ax-modal__body {
    padding: var(--ax-space-4, 16px);
    overflow-y: auto;
    font-size: var(--ax-text-sm, 13px);
  }
  .ax-modal__footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--ax-space-2, 8px);
    padding: var(--ax-space-3, 12px) var(--ax-space-4, 16px);
    border-top: 1px solid var(--ax-border, #e2e8f0);
    background: var(--ax-surface-subtle, #f8fafc);
  }
`;

const actionsRowStyle = { gap: 'var(--ax-space-2)', flexWrap: 'nowrap', alignItems: 'center', justifyContent: 'flex-end', width: '100%' } as const;
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
      <div ref={dialogRef} className="ax-modal__dialog" style={{ maxWidth }} tabIndex={-1}>
        <div className="ax-modal__header">
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ax-text-strong, #0f172a)' }}>{title}</h3>
            {subtitle && <p style={{ margin: '4px 0 0 0', fontSize: 12.5, color: 'var(--ax-text-muted, #64748b)' }}>{subtitle}</p>}
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
type KpiTone = 'accent' | 'cyan' | 'emerald' | 'amber' | 'red';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'color-mix(in oklab, var(--ax-accent, #2563eb) 14%, transparent)', fg: 'var(--ax-accent, #2563eb)' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan, #06b6d4) 14%, transparent)', fg: '#0891b2' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald, #10b981) 14%, transparent)', fg: '#16a34a' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber, #f59e0b) 14%, transparent)', fg: '#d97706' },
  red: { bg: 'color-mix(in oklab, var(--ax-viz-red, #ef4444) 14%, transparent)', fg: '#dc2626' },
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
    <div className="ax-card" style={{ padding: '14px 18px', borderRadius: 12, minWidth: 0, background: '#fff', border: '1px solid #e2e8f0' }}>
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

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

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

  const url = resolveJammuMediaUrl(file);
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

export function ViewRescoPayment() {
  const [payments, setPayments] = useState<any[]>([]);
  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [summaryData, setSummaryData] = useState<any>(null);

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

  // Disbursement Modal state
  const [disburseTarget, setDisburseTarget] = useState<any | null>(null);
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

        const res = await jammuRescoAdminService.getViewPayment(params);
        
        // Unified payments list extraction: combine and deduplicate by id
        const rawPayments = Array.isArray(res.payments) && res.payments.length > 0
          ? res.payments
          : [ ...(res.payments80 || []), ...(res.payments20 || []) ];

        const seen = new Set();
        const list: any[] = [];
        for (const item of rawPayments) {
          if (item && item.id != null) {
            if (!seen.has(item.id)) {
              seen.add(item.id);
              list.push(item);
            }
          } else if (item) {
            list.push(item);
          }
        }

        setPayments(list);
        setVendors(Array.isArray(res.vendor) ? res.vendor : Array.isArray(res.vendors) ? res.vendors : []);
        setSummaryData(res);
      } catch (err: any) {
        console.error('Failed to load Jammu RESCO payment records:', err);
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
  const handleOpenDisburse = (row: any) => {
    const claimAmt = Number(row.inst_claim_amount || row.amount || 0);
    const allpayment = Array.isArray(row.allpayment) ? row.allpayment : [];
    const totalPaid = allpayment.length > 0
      ? allpayment.reduce((acc: number, curr: any) => acc + Number(curr.amount || 0), 0)
      : Number(row.pay_amount || row.inst_pay || row.inst_pay80 || (Number(row.pay_status) === 1 ? claimAmt : 0));
    const bal = Math.max(0, claimAmt - totalPaid);

    if (Number(row.pay_status) === 1 || (claimAmt > 0 && totalPaid >= claimAmt)) {
      setErrorMsg('This payment claim has already been completely disbursed and is locked.');
      return;
    }
    setDisburseTarget(row);
    setErrorMsg('');
    setDisburseAmount(bal > 0 ? String(bal) : claimAmt > 0 ? String(claimAmt) : '');
    setDisburseDate(new Date().toISOString().split('T')[0]);
    setDisburseRemarks(row.remarks || '');
  };

  // Submit Disburse
  const handleDisburseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disburseTarget) return;

    const amt = parseFloat(disburseAmount);
    if (isNaN(amt) || amt <= 0) {
      return setErrorMsg('Please enter a valid disbursement amount.');
    }
    if (!disburseDate) {
      return setErrorMsg('Disbursement date is required.');
    }

    setSubmittingDisburse(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await jammuRescoAdminService.updatePaymentStatus({
        id: disburseTarget.id,
        amount: amt,
        date: disburseDate,
        remarks: disburseRemarks.trim() || undefined,
        inst_pay: amt,
        inst_pay80: amt,
        inst_pay_date: disburseDate,
        inst_pay80_date: disburseDate,
        inst_pay_remark: disburseRemarks.trim() || undefined,
        inst_pay80_remark: disburseRemarks.trim() || undefined,
      });
      setSuccessMsg(res?.message || 'Payment recorded successfully!');
      setDisburseTarget(null);
      setDisburseAmount('');
      setDisburseRemarks('');
      await fetchPayments(currentFilters());
    } catch (err: any) {
      console.error('Disbursement submit error:', err);
      setErrorMsg(err?.message || 'Failed to update payment disbursement.');
    } finally {
      setSubmittingDisburse(false);
    }
  };

  // Filtered payments
  const filteredPayments = useMemo(() => {
    let list = payments;
    if (selectedStatus !== 'All') {
      list = list.filter((r: any) => {
        const claimAmt = Number(r.inst_claim_amount || r.amount || 0);
        const allpayment = Array.isArray(r.allpayment) ? r.allpayment : [];
        const totalPaid = allpayment.length > 0
          ? allpayment.reduce((acc: number, curr: any) => acc + Number(curr.amount || 0), 0)
          : Number(r.pay_amount || r.inst_pay || (Number(r.pay_status) === 1 ? claimAmt : 0));
        const bal = Math.max(0, claimAmt - totalPaid);

        let st = Number(r.pay_status || 0);
        if (st !== 1 && claimAmt > 0 && totalPaid >= claimAmt) st = 1;
        else if (st === 0 && totalPaid > 0 && bal > 0) st = 2;

        return String(st) === selectedStatus;
      });
    }

    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;

    return list.filter((r: any) =>
      [
        r.vendor_name,
        r.state,
        r.district,
        r.site_name,
        r.inst_claim_amount,
        r.amount,
        r.inst_claim_update_by,
        r.remarks,
        r.pay_remarks,
        r.inst_pay_remark,
      ].some((v) => String(v ?? '').toLowerCase().includes(q))
    );
  }, [payments, selectedStatus, searchQuery]);

  const pagination = usePagination(filteredPayments, { initialPageSize: 50 });

  useEffect(() => {
    pagination.setPage(1);
  }, [searchQuery, selectedStatus]);

  // Export Columns definition
  const exportCols: ExportColumn<any>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r, idx) => (idx !== undefined ? idx + 1 : '') },
      { header: 'Vendor', accessor: (r) => r.vendor_name || '—' },
      { header: 'State', accessor: () => 'JAMMU' },
      { header: 'District', accessor: (r) => r.district || '—' },
      { header: 'Site Name', accessor: (r) => r.site_name || '—' },
      { header: 'Claim Raised Date', accessor: (r) => fmtDate(r.inst_claim_date || r.date) },
      { header: 'Claim Invoice', accessor: (r) => r.inst_claim_invoice || r.invoice_file || '—' },
      { header: 'Claim Amount', accessor: (r) => `₹ ${Number(r.inst_claim_amount || r.amount || 0).toLocaleString('en-IN')}` },
      { header: 'Claim Approved Date', accessor: (r) => fmtDate(r.inst_claim_update_date || r.updated_at) },
      { header: 'Claim Approved by', accessor: (r) => r.inst_claim_update_by || '—' },
      {
        header: 'Paid Amount',
        accessor: (r) => {
          const claimAmt = Number(r.inst_claim_amount || r.amount || 0);
          const allpayment = Array.isArray(r.allpayment) ? r.allpayment : [];
          const totalPaid = allpayment.length > 0
            ? allpayment.reduce((acc: number, curr: any) => acc + Number(curr.amount || 0), 0)
            : Number(r.pay_amount || r.inst_pay || (Number(r.pay_status) === 1 ? claimAmt : 0));
          return `₹ ${totalPaid.toLocaleString('en-IN')}`;
        },
      },
      {
        header: 'Balance Amount',
        accessor: (r) => {
          const claimAmt = Number(r.inst_claim_amount || r.amount || 0);
          const allpayment = Array.isArray(r.allpayment) ? r.allpayment : [];
          const totalPaid = allpayment.length > 0
            ? allpayment.reduce((acc: number, curr: any) => acc + Number(curr.amount || 0), 0)
            : Number(r.pay_amount || r.inst_pay || (Number(r.pay_status) === 1 ? claimAmt : 0));
          const bal = Math.max(0, claimAmt - totalPaid);
          return `₹ ${bal.toLocaleString('en-IN')}`;
        },
      },
      {
        header: 'Payment Date',
        accessor: (r) => {
          const allpayment = Array.isArray(r.allpayment) ? r.allpayment : [];
          const latest = allpayment.length > 0 ? allpayment[allpayment.length - 1] : null;
          return fmtDate(r.payment_date || r.inst_pay_date || (latest ? latest.date : r.updated_at));
        },
      },
      {
        header: 'Payment Remarks',
        accessor: (r) => {
          const allpayment = Array.isArray(r.allpayment) ? r.allpayment : [];
          const latest = allpayment.length > 0 ? allpayment[allpayment.length - 1] : null;
          return r.pay_remarks || r.inst_pay_remark || (latest ? latest.pay_remarks : r.remarks) || '—';
        },
      },
      {
        header: 'Payment Status',
        accessor: (r) => {
          const claimAmt = Number(r.inst_claim_amount || r.amount || 0);
          const allpayment = Array.isArray(r.allpayment) ? r.allpayment : [];
          const totalPaid = allpayment.length > 0
            ? allpayment.reduce((acc: number, curr: any) => acc + Number(curr.amount || 0), 0)
            : Number(r.pay_amount || r.inst_pay || (Number(r.pay_status) === 1 ? claimAmt : 0));
          const bal = Math.max(0, claimAmt - totalPaid);
          if (Number(r.pay_status) === 1 || (claimAmt > 0 && totalPaid >= claimAmt)) return 'Complete';
          if (Number(r.pay_status) === 2 || (totalPaid > 0 && bal > 0)) return 'Partially';
          return 'Pending';
        },
      },
    ],
    []
  );

  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = 'Jammu_RESCO_Payment_Disbursement';
  const fileTitle = 'Jammu RESCO Installation Payment Disbursement Register';

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

  const totalClaims = summaryData?.payment_detail?.total ?? payments.length;
  const totalComplete =
    summaryData?.payment_detail?.complete ??
    payments.filter((p: any) => {
      const claimAmt = Number(p.inst_claim_amount || p.amount || 0);
      const allpayment = Array.isArray(p.allpayment) ? p.allpayment : [];
      const totalPaid = allpayment.length > 0
        ? allpayment.reduce((acc: number, curr: any) => acc + Number(curr.amount || 0), 0)
        : Number(p.pay_amount || p.inst_pay || (Number(p.pay_status) === 1 ? claimAmt : 0));
      return Number(p.pay_status) === 1 || (claimAmt > 0 && totalPaid >= claimAmt);
    }).length;

  const totalPartially =
    summaryData?.payment_detail?.partially ??
    payments.filter((p: any) => {
      const claimAmt = Number(p.inst_claim_amount || p.amount || 0);
      const allpayment = Array.isArray(p.allpayment) ? p.allpayment : [];
      const totalPaid = allpayment.length > 0
        ? allpayment.reduce((acc: number, curr: any) => acc + Number(curr.amount || 0), 0)
        : Number(p.pay_amount || p.inst_pay || 0);
      const bal = Math.max(0, claimAmt - totalPaid);
      return Number(p.pay_status) === 2 || (totalPaid > 0 && bal > 0);
    }).length;

  const totalPending =
    summaryData?.payment_detail?.pending ??
    Math.max(0, totalClaims - totalComplete - totalPartially);

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      <PageHead
        title="View Jammu RESCO Installation Payment"
        subtitle="Manage and verify vendor payment disbursements against approved Jammu RESCO installation claims"
        breadcrumbs={[
          { label: 'ERP Dashboard', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Jammu', href: '/vendor-management/jammu' },
          { label: 'Installation', href: '/vendor-management/jammu/installation/resco' },
          { label: 'RESCO', href: '/vendor-management/jammu/installation/resco' },
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
          value={totalClaims}
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
          label="Payment Complete"
          value={totalComplete}
          sub="Claims fully disbursed"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
          tone="cyan"
          label="Payment Partially"
          value={totalPartially}
          sub="Partially disbursed claims"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
          tone="amber"
          label="Payment Pending"
          value={totalPending}
          sub="Awaiting first disbursement"
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
              Payment Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="ax-select"
              style={{ width: '100%', height: 34, padding: '0 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12 }}
            >
              <option value="All">All Statuses</option>
              <option value="1">Complete</option>
              <option value="2">Partially</option>
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

      {/* ── Main Data Card ── */}
      <section className="ax-card ax-col--12">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">
              Payment Disbursement Register
            </h2>
            <p className="ax-card__subtitle">
              Showing {filteredPayments.length} payment disbursement record{filteredPayments.length === 1 ? '' : 's'}
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
                placeholder="Search vendor, site, district..."
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
          <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap', minWidth: 1550 }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th" style={{ width: 60, textAlign: 'center' }}>Sr. No.</th>
                <th className="ax-table__th">Vendor</th>
                <th className="ax-table__th">State</th>
                <th className="ax-table__th">District</th>
                <th className="ax-table__th">Site Name</th>
                <th className="ax-table__th">Claim Raised Date</th>
                <th className="ax-table__th" style={{ width: 90, textAlign: 'center' }}>Claim Invoice</th>
                <th className="ax-table__th" style={{ textAlign: 'right' }}>Claim Amount</th>
                <th className="ax-table__th">Claim Approved Date</th>
                <th className="ax-table__th">Claim Approved by</th>
                <th className="ax-table__th" style={{ textAlign: 'right' }}>Paid Amount</th>
                <th className="ax-table__th" style={{ textAlign: 'right' }}>Balance Amount</th>
                <th className="ax-table__th">Payment Date</th>
                <th className="ax-table__th">Payment Remarks</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Payment Status</th>
                <th className="ax-table__th" style={{ textAlign: 'center', width: 110 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={16} style={centerCell}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <span className="ax-spinner" aria-hidden="true" />
                      <span>Loading payment disbursement records...</span>
                    </div>
                  </td>
                </tr>
              ) : pagination.paged.length === 0 ? (
                <tr>
                  <td colSpan={16} style={centerCell}>
                    <TableEmptyState
                      title="No payment records found"
                      description={searchQuery || fromDate || toDate ? 'Try adjusting your search filters' : 'No records pending payment disbursement'}
                    />
                  </td>
                </tr>
              ) : (
                pagination.paged.map((row: any, idx: number) => {
                  const globalIdx = (pagination.curPage - 1) * pagination.pageSize + idx + 1;
                  const claimAmt = Number(row.inst_claim_amount || row.amount || 0);
                  const allpayment = Array.isArray(row.allpayment) ? row.allpayment : [];
                  const totalPaid = allpayment.length > 0
                    ? allpayment.reduce((acc: number, curr: any) => acc + Number(curr.amount || 0), 0)
                    : Number(row.pay_amount || row.inst_pay || row.inst_pay80 || (Number(row.pay_status) === 1 ? claimAmt : 0));
                  const balance = Math.max(0, claimAmt - totalPaid);

                  let st = Number(row.pay_status || 0);
                  if (st !== 1 && claimAmt > 0 && totalPaid >= claimAmt) st = 1;
                  else if (st === 0 && totalPaid > 0 && balance > 0) st = 2;

                  const isComplete = st === 1;
                  const isPartially = st === 2;

                  const latestPayment = allpayment.length > 0 ? allpayment[allpayment.length - 1] : null;
                  const paymentDate = row.payment_date || row.inst_pay_date || (latestPayment ? latestPayment.date : (isComplete ? row.updated_at : null));
                  const paymentRemark = row.pay_remarks || row.inst_pay_remark || (latestPayment ? latestPayment.pay_remarks : row.remarks);

                  return (
                    <tr key={row.id ?? idx}>
                      <td className="ax-table__td" style={{ textAlign: 'center', fontWeight: 600 }}>{globalIdx}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                        {row.vendor_name || (row as any).vendor || (row.inst_vendor ? `Vendor #${row.inst_vendor}` : '—')}
                      </td>
                      <td className="ax-table__td">JAMMU</td>
                      <td className="ax-table__td">{row.district || '—'}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                        {row.site_name || '—'}
                      </td>
                      <td className="ax-table__td">{fmtDate(row.inst_claim_date || row.date)}</td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <MediaFileThumbnail file={row.inst_claim_invoice || row.invoice_file} onClick={setLightboxUrl} />
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'right', fontWeight: 700, color: 'var(--ax-text-strong)' }}>
                        ₹ {claimAmt.toLocaleString('en-IN')}
                      </td>
                      <td className="ax-table__td">{fmtDate(row.inst_claim_update_date || row.updated_at)}</td>
                      <td className="ax-table__td">{row.inst_claim_update_by || '—'}</td>
                      <td className="ax-table__td" style={{ textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>
                        ₹ {totalPaid.toLocaleString('en-IN')}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'right', fontWeight: 700, color: balance > 0 ? '#d97706' : '#64748b' }}>
                        ₹ {balance.toLocaleString('en-IN')}
                      </td>
                      <td className="ax-table__td">{fmtDate(paymentDate)}</td>
                      <td className="ax-table__td" style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {paymentRemark || '—'}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {isComplete ? (
                          <span className="ax-badge ax-badge--soft ax-badge--success" style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>
                            Complete
                          </span>
                        ) : isPartially ? (
                          <span className="ax-badge ax-badge--soft ax-badge--info" style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700, color: '#0284c7', background: '#e0f2fe' }}>
                            Partially
                          </span>
                        ) : (
                          <span className="ax-badge ax-badge--soft ax-badge--warning" style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {isComplete ? (
                          <button
                            type="button"
                            disabled
                            title="Payment completed and disbursed. Further disbursement is locked."
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
                            onClick={() => handleOpenDisburse(row)}
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
        open={Boolean(disburseTarget)}
        onClose={() => {
          if (!submittingDisburse) {
            setDisburseTarget(null);
          }
        }}
        title="Process Payment Disbursement"
        subtitle={
          disburseTarget
            ? `Site: ${disburseTarget.site_name || '—'} • Vendor: ${disburseTarget.vendor_name || '—'}`
            : ''
        }
        maxWidth={520}
        footer={
          <>
            <button
              type="button"
              className="ax-btn ax-btn--secondary"
              onClick={() => setDisburseTarget(null)}
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
        {disburseTarget && (
          <div style={{ marginBottom: 16, padding: '12px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, textAlign: 'center' }}>
              <div>
                <span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>Claim Amount</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>
                  ₹ {Number(disburseTarget.inst_claim_amount || disburseTarget.amount || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>Paid Amount</span>
                <span style={{ fontWeight: 700, color: '#16a34a' }}>
                  ₹ {Number(
                    (Array.isArray(disburseTarget.allpayment) && disburseTarget.allpayment.length > 0
                      ? disburseTarget.allpayment.reduce((acc: number, curr: any) => acc + Number(curr.amount || 0), 0)
                      : disburseTarget.pay_amount || disburseTarget.inst_pay || 0)
                  ).toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>Remaining Balance</span>
                <span style={{ fontWeight: 700, color: '#dc2626' }}>
                  ₹ {Math.max(
                    0,
                    Number(disburseTarget.inst_claim_amount || disburseTarget.amount || 0) -
                      Number(
                        (Array.isArray(disburseTarget.allpayment) && disburseTarget.allpayment.length > 0
                          ? disburseTarget.allpayment.reduce((acc: number, curr: any) => acc + Number(curr.amount || 0), 0)
                          : disburseTarget.pay_amount || disburseTarget.inst_pay || 0)
                      )
                  ).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        )}
        <form onSubmit={handleDisburseSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--ax-text-strong)' }}>
              Disbursement Amount (₹) <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={disburseAmount}
              onChange={(e) => setDisburseAmount(e.target.value)}
              required
              placeholder="Enter disbursement amount"
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
export default ViewRescoPayment;
