import { useEffect, useMemo, useRef, useState, useCallback, type FormEvent, type ReactNode } from 'react';
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
import { biharAdminService, resolveBiharMediaUrl } from '../../bihar-services/biharAdminService';

/* ───────── Responsive page CSS (Exact Karnataka / Assam SWP Reference) ───────── */
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
  accent: { bg: 'rgba(37, 99, 235, 0.12)', fg: '#2563eb' },
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

  const isPdf = /\.pdf($|\?)/i.test(file);
  const isImage = /\.(jpe?g|png|webp|gif|bmp|svg)($|\?)/i.test(file);

  return (
    <button
      type="button"
      onClick={() => onClick(file)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '3px 8px',
        borderRadius: 6,
        border: '1px solid #cbd5e1',
        background: '#f8fafc',
        cursor: 'pointer',
        fontSize: 11.5,
        color: '#2563eb',
        fontWeight: 600,
        maxWidth: 160,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
      title={`Preview ${file}`}
    >
      <span>{isPdf ? '📄' : isImage ? '🖼️' : '📎'}</span>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.split('/').pop()}</span>
    </button>
  );
}

const actionsRowStyle = { gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', width: '100%' } as const;
const footerStyle = {
  borderTop: '1px solid var(--ax-border, #e2e8f0)',
  padding: 'var(--ax-space-3) var(--ax-space-4)',
  display: 'flex',
  justifyContent: 'flex-start',
  alignItems: 'center',
  width: '100%',
} as const;
const centerCell = { textAlign: 'center', padding: '36px 16px', color: 'var(--ax-text-muted)' } as const;

/* ───────── Bihar ULA Payment Item Interface ───────── */
export interface BiharULAPaymentItem {
  id: number;
  date?: string;
  created_at?: string;
  vendor?: string;
  vendor_id?: number | string;
  vendor_name?: string;
  state?: string;
  district?: string;
  block?: string;
  village?: string;
  site_name?: string;
  sites?: number | string;
  farmer?: string;
  farmer_name?: string;
  beneficiary_name?: string;
  invoice?: string;
  invoice_no?: string;
  file?: string;
  amount: number;
  claim_amount?: string | number;
  remarks?: string;
  claim_remarks?: string;
  pay_amount: number;
  payment_amount?: string | number;
  balance_amount?: number;
  pay_date?: string;
  payment_date?: string;
  pay_remarks?: string;
  payment_remarks?: string;
  status?: string;
  pay_status?: number | string;
}

export function BiharULAInstallationViewPayment() {
  const [payments, setPayments] = useState<BiharULAPaymentItem[]>([]);
  const [vendorList, setVendorList] = useState<{ id: string | number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filter Form State
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedVendor, setSelectedVendor] = useState('');
  const [selectedPayStatus, setSelectedPayStatus] = useState<string>('All');
  const [appliedFilters, setAppliedFilters] = useState<{
    fromDate: string;
    toDate: string;
    vendor: string;
    payStatus: string;
  }>({ fromDate: '', toDate: '', vendor: '', payStatus: 'All' });

  // Search & Lightbox
  const [searchQuery, setSearchQuery] = useState('');
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Disburse Modal State
  const [disbursePayment, setDisbursePayment] = useState<BiharULAPaymentItem | null>(null);
  const [disburseAmount, setDisburseAmount] = useState('');
  const [disburseDate, setDisburseDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [disburseRemarks, setDisburseRemarks] = useState('');
  const [submittingDisburse, setSubmittingDisburse] = useState(false);

  // Backend KPI Counts (if provided)
  const [serverSummary, setServerSummary] = useState<{
    total?: number;
    complete?: number;
    partially?: number;
    pending?: number;
  } | null>(null);

  // Load Payments from API
  const loadPayments = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg('');

      const res = await biharAdminService.getViewUlaPayments({
        from: appliedFilters.fromDate || undefined,
        to: appliedFilters.toDate || undefined,
        vendor: appliedFilters.vendor || undefined,
        status: appliedFilters.payStatus !== 'All' ? appliedFilters.payStatus : undefined,
      });

      const rawList = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.payments)
        ? res.payments
        : Array.isArray(res?.data?.payments)
        ? res.data.payments
        : Array.isArray(res?.data?.data)
        ? res.data.data
        : [];

      if (res?.summary || res?.data?.summary) {
        const sum = res.summary || res.data.summary;
        setServerSummary({
          total: Number(sum.total ?? sum.total_payment ?? sum.paymentRequest ?? rawList.length),
          complete: Number(sum.complete ?? sum.paymentComplete ?? 0),
          partially: Number(sum.partially ?? sum.paymentPartially ?? 0),
          pending: Number(sum.pending ?? sum.paymentPending ?? 0),
        });
      }

      const mapped: BiharULAPaymentItem[] = rawList.map((item: any, idx: number) => {
        const total = Number(item.amount ?? item.claim_amount ?? 0);
        const paid = Number(item.pay_amount ?? item.payment_amount ?? 0);
        const bal = item.balance_amount != null ? Number(item.balance_amount) : Math.max(0, total - paid);

        let pStatus = 0;
        const rawStatus = String(item.status ?? item.pay_status ?? '').toLowerCase();
        if (rawStatus === '2' || rawStatus.includes('comp') || (paid >= total && total > 0)) {
          pStatus = 2;
        } else if (rawStatus === '1' || rawStatus.includes('part') || paid > 0) {
          pStatus = 1;
        } else {
          pStatus = 0;
        }

        return {
          id: item.id || idx + 1,
          date: item.date || item.created_at || item.claim_date || '',
          created_at: item.created_at || '',
          vendor: item.vendor_name || item.vendor || '—',
          vendor_id: item.vendor_id || item.vendor || '',
          vendor_name: item.vendor_name || item.vendor || '',
          state: item.state || 'bihar',
          district: item.district || '',
          block: item.block || '',
          village: item.village || '',
          site_name: item.site_name || item.name || '',
          sites: item.sites || item.site_count || (item.site_name ? 1 : '—'),
          farmer: item.farmer_name || item.farmer || item.beneficiary_name || item.site_name || '—',
          farmer_name: item.farmer_name || item.farmer || '',
          beneficiary_name: item.beneficiary_name || '',
          invoice: item.invoice || item.invoice_no || item.file || '',
          file: item.file || item.invoice || '',
          amount: total,
          claim_amount: item.claim_amount,
          remarks: item.remarks || item.claim_remarks || '',
          pay_amount: paid,
          balance_amount: bal,
          pay_date: item.pay_date || item.payment_date || '',
          pay_remarks: item.pay_remarks || item.payment_remarks || '',
          status: pStatus === 2 ? 'Complete' : pStatus === 1 ? 'Partially' : 'Pending',
          pay_status: pStatus,
        };
      });

      setPayments(mapped);

      // Extract unique vendors dynamically
      const vMap = new Map<string, string>();
      mapped.forEach((item) => {
        const vId = String(item.vendor_id || item.vendor || '').trim();
        const vName = String(item.vendor_name || item.vendor || '').trim();
        if (vId && vName && vName !== '—') {
          vMap.set(vId, vName);
        }
      });
      if (vMap.size > 0) {
        setVendorList(Array.from(vMap.entries()).map(([id, name]) => ({ id, name })));
      }
    } catch (err: any) {
      console.error('[Bihar ULA ViewPayment] Fetch error:', err);
      setErrorMsg(err?.message || 'Failed to fetch Bihar ULA payment data from server.');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [appliedFilters]);

  // Initial fetch and fetch master vendor list if available
  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  useEffect(() => {
    biharAdminService.getUlaAssignMaster?.().then((res: any) => {
      if (res && res.vendors && Array.isArray(res.vendors)) {
        setVendorList(res.vendors.map((v: any) => ({
          id: String(v.id || v.vendor_id || v.name),
          name: v.name || v.firm_name || `Vendor ${v.id}`,
        })));
      }
    }).catch(() => {});
  }, []);

  // Filter Form Handlers
  const handleFilterSubmit = (e: FormEvent) => {
    e.preventDefault();
    setAppliedFilters({
      fromDate,
      toDate,
      vendor: selectedVendor,
      payStatus: selectedPayStatus,
    });
  };

  const handleResetFilters = () => {
    setFromDate('');
    setToDate('');
    setSelectedVendor('');
    setSelectedPayStatus('All');
    setAppliedFilters({
      fromDate: '',
      toDate: '',
      vendor: '',
      payStatus: 'All',
    });
  };

  // Filter Payments by Search & Applied Filters
  const filteredPayments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return payments.filter((item) => {
      // Status filter
      if (appliedFilters.payStatus !== 'All') {
        if (appliedFilters.payStatus === '2' && item.pay_status !== 2) return false;
        if (appliedFilters.payStatus === '1' && item.pay_status !== 1) return false;
        if (appliedFilters.payStatus === '0' && item.pay_status !== 0) return false;
      }
      // Vendor filter
      if (appliedFilters.vendor) {
        const vStr = String(item.vendor_id || item.vendor || '').toLowerCase();
        if (!vStr.includes(appliedFilters.vendor.toLowerCase())) return false;
      }
      // Date range filter
      if (appliedFilters.fromDate && item.date) {
        if (item.date < appliedFilters.fromDate) return false;
      }
      if (appliedFilters.toDate && item.date) {
        if (item.date > appliedFilters.toDate) return false;
      }
      // Search query
      if (q) {
        const match =
          String(item.id).includes(q) ||
          String(item.vendor || '').toLowerCase().includes(q) ||
          String(item.farmer || '').toLowerCase().includes(q) ||
          String(item.site_name || '').toLowerCase().includes(q) ||
          String(item.district || '').toLowerCase().includes(q) ||
          String(item.invoice || '').toLowerCase().includes(q) ||
          String(item.remarks || '').toLowerCase().includes(q) ||
          String(item.pay_remarks || '').toLowerCase().includes(q) ||
          String(item.amount || '').includes(q) ||
          String(item.pay_amount || '').includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [payments, appliedFilters, searchQuery]);

  // Pagination hook
  const pagination = usePagination({
    totalItems: filteredPayments.length,
    initialPageSize: 10,
  });

  // KPI Metrics Calculation
  const kpiStats = useMemo(() => {
    if (serverSummary) {
      return {
        total: serverSummary.total ?? payments.length,
        complete: serverSummary.complete ?? 0,
        partially: serverSummary.partially ?? 0,
        pending: serverSummary.pending ?? 0,
      };
    }
    const total = payments.length;
    let complete = 0;
    let partially = 0;
    let pending = 0;

    payments.forEach((p) => {
      if (p.pay_status === 2) complete++;
      else if (p.pay_status === 1) partially++;
      else pending++;
    });

    return { total, complete, partially, pending };
  }, [payments, serverSummary]);

  // Export columns specification
  const exportCols: ExportColumn<BiharULAPaymentItem>[] = useMemo(
    () => [
      { header: 'S.No.', accessor: (_, idx) => String(idx + 1) },
      { header: 'Date', accessor: (r) => fmtDate(r.date) },
      { header: 'Vendor', accessor: (r) => r.vendor || '—' },
      { header: 'Site / Beneficiary', accessor: (r) => r.site_name || r.farmer || '—' },
      { header: 'Invoice', accessor: (r) => r.invoice || '—' },
      { header: 'Total Amount (₹)', accessor: (r) => String(r.amount || 0) },
      { header: 'Remarks', accessor: (r) => r.remarks || '—' },
      { header: 'Pay Amount (₹)', accessor: (r) => String(r.pay_amount || 0) },
      { header: 'Balance Amount (₹)', accessor: (r) => String(r.balance_amount || 0) },
      { header: 'Pay Date', accessor: (r) => fmtDate(r.pay_date) },
      { header: 'Pay Remarks', accessor: (r) => r.pay_remarks || '—' },
      { header: 'Status', accessor: (r) => r.status },
    ],
    []
  );

  // Clipboard & file export helpers
  const copyToClipboard = async (list: BiharULAPaymentItem[], cols: ExportColumn<BiharULAPaymentItem>[]) => {
    if (!list.length) return;
    const header = cols.map((c) => c.header).join('\t');
    const rows = list.map((row, idx) =>
      cols.map((c) => (typeof c.accessor === 'function' ? c.accessor(row, idx) : (row as any)[c.accessor] ?? '')).join('\t')
    );
    const text = [header, ...rows].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setSuccessMsg('Payment records copied to clipboard successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch {
      alert('Unable to access clipboard.');
    }
  };

  const exportToCSV = (list: BiharULAPaymentItem[], cols: ExportColumn<BiharULAPaymentItem>[], filename: string) => {
    if (!list.length) return;
    const header = cols.map((c) => `"${c.header.replace(/"/g, '""')}"`).join(',');
    const rows = list.map((row, idx) =>
      cols
        .map((c) => {
          const val = typeof c.accessor === 'function' ? c.accessor(row, idx) : (row as any)[c.accessor] ?? '';
          return `"${String(val).replace(/"/g, '""')}"`;
        })
        .join(',')
    );
    const blob = new Blob([`\ufeff${[header, ...rows].join('\n')}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const exportToExcel = (list: BiharULAPaymentItem[], cols: ExportColumn<BiharULAPaymentItem>[], filename: string) => {
    if (!list.length) return;
    const tableHtml = `<table border="1"><thead><tr>${cols
      .map((c) => `<th>${escapeHtml(c.header)}</th>`)
      .join('')}</tr></thead><tbody>${list
      .map(
        (row, idx) =>
          `<tr>${cols
            .map((c) => `<td>${escapeHtml(String(typeof c.accessor === 'function' ? c.accessor(row, idx) : (row as any)[c.accessor] ?? ''))}</td>`)
            .join('')}</tr>`
      )
      .join('')}</tbody></table>`;
    const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8" /></head><body>${tableHtml}</body></html>`;
    const blob = new Blob([`\ufeff${html}`], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.xls`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const exportToPDF = (list: BiharULAPaymentItem[], cols: ExportColumn<BiharULAPaymentItem>[], title: string) => {
    if (!list.length) return;
    const rows = list.map((row, idx) =>
      cols.map((c) => escapeHtml(String(typeof c.accessor === 'function' ? c.accessor(row, idx) : (row as any)[c.accessor] ?? '')))
    );
    const win = window.open('', '_blank', 'width=1200,height=800');
    if (!win) return;
    win.document.write(`<!doctype html><html><head><meta charset="UTF-8" /><title>${escapeHtml(title)}</title><style>
      *{box-sizing:border-box}body{font-family:Arial,sans-serif;padding:24px;color:#222}h1{font-size:20px;margin:0 0 16px}
      table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #d8dee6;padding:6px 8px;text-align:left;vertical-align:top}
      th{background:#f3f5f7;font-weight:700}@media print{body{padding:0}@page{size:landscape;margin:10mm}}
    </style></head><body><h1>${escapeHtml(title)}</h1><table><thead><tr>${cols.map((c) => `<th>${escapeHtml(c.header)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((v) => `<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table><script>window.onload=function(){window.print();};</script></body></html>`);
    win.document.close();
    win.focus();
  };

  // Handle Disburse Payment Submit
  const handleDisburseSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!disbursePayment) return;

    const amt = Number(disburseAmount) || 0;
    if (amt <= 0) {
      alert('Please enter a valid disbursement amount greater than 0.');
      return;
    }

    const curPaid = Number(disbursePayment.pay_amount || 0);
    const totalAmt = Number(disbursePayment.amount || 0);
    const newPaid = curPaid + amt;
    const newStatus = newPaid >= totalAmt ? 2 : 1;

    try {
      setSubmittingDisburse(true);
      setErrorMsg('');

      const payload = {
        id: disbursePayment.id,
        claim_id: disbursePayment.id,
        pay_amount: amt,
        payment_amount: amt,
        pay_date: disburseDate,
        payment_date: disburseDate,
        pay_remarks: disburseRemarks,
        payment_remarks: disburseRemarks,
        status: newStatus,
        pay_status: newStatus,
      };

      await biharAdminService.updateUlaPaymentStatus(payload);

      setSuccessMsg(`Disbursement of ₹ ${amt.toLocaleString('en-IN')} recorded successfully for Claim #${disbursePayment.id}!`);
      setTimeout(() => setSuccessMsg(''), 5000);
      setDisbursePayment(null);
      await loadPayments();
    } catch (err: any) {
      console.error('[Bihar ULA Disburse] Submission error:', err);
      setErrorMsg(err?.message || 'Failed to record disbursement on server.');
    } finally {
      setSubmittingDisburse(false);
    }
  };

  const fileBase = 'Bihar_ULA_Installation_Payments';
  const stamp = new Date().toISOString().slice(0, 10);
  const fileTitle = 'Bihar ULA Installation Payment Records';

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      <PageHead
        title="View Bihar ULA Installation Payment"
        subtitle="Disburse vendor claim payments, manage milestone releases, and track outstanding balances"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Bihar', href: '/vendor-management/bihar' },
          { label: 'ULA Installation', href: '/vendor-management/bihar/ula/installation/dashboard' },
          { label: 'Payment Data' },
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

      {/* ── Top 4 KPI Metric Cards in .asw-cards-row (Exact Karnataka SWP Design) ── */}
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
          value={kpiStats.total}
          sub="Approved vendor claim vouchers"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
          tone="emerald"
          label="Complete"
          value={kpiStats.complete}
          sub="Fully settled in accounts"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
          tone="cyan"
          label="Partially Paid"
          value={kpiStats.partially}
          sub="Partial balance pending release"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
          tone="amber"
          label="Pending Payments"
          value={kpiStats.pending}
          sub="Awaiting finance payment order"
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
              {vendorList.map((v) => (
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
              value={selectedPayStatus}
              onChange={(e) => setSelectedPayStatus(e.target.value)}
              className="ax-select"
              style={{ width: '100%', height: 34, padding: '0 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12 }}
            >
              <option value="All">All Statuses</option>
              <option value="2">Complete</option>
              <option value="1">Partially</option>
              <option value="0">Pending</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              type="submit"
              className="ax-button ax-button--primary"
              style={{ height: 34, padding: '0 14px', fontSize: 12, fontWeight: 600 }}
            >
              Apply Filter
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="ax-button ax-button--secondary"
              style={{ height: 34, padding: '0 12px', fontSize: 12 }}
            >
              Clear
            </button>
          </div>
        </form>
      </div>

      {/* ── Main Data Card (Exact Karnataka SWP Design) ── */}
      <section className="ax-card ax-col--12">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">View Bihar ULA Installation Payment Data</h2>
            <p className="ax-card__subtitle">
              Showing {filteredPayments.length} claim payment voucher{filteredPayments.length === 1 ? '' : 's'}
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
                placeholder="Search vendor, site, amount..."
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
                <th className="ax-table__th">S.No.</th>
                <th className="ax-table__th">Date</th>
                <th className="ax-table__th">Vendor</th>
                <th className="ax-table__th">Site / Beneficiary</th>
                <th className="ax-table__th">Invoice</th>
                <th className="ax-table__th">Amount</th>
                <th className="ax-table__th">Remarks</th>
                <th className="ax-table__th">Pay Amount</th>
                <th className="ax-table__th">Balance Amount</th>
                <th className="ax-table__th">Pay Date</th>
                <th className="ax-table__th">Pay Remarks</th>
                <th className="ax-table__th">Pay Status</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={13} style={centerCell}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <span className="ax-spinner" aria-hidden="true" />
                      <span>Loading payment records...</span>
                    </div>
                  </td>
                </tr>
              ) : pagination.paged.length === 0 ? (
                <tr>
                  <td colSpan={13} style={centerCell}>
                    <TableEmptyState
                      title="No payment records found"
                      description={searchQuery || fromDate || toDate ? 'Try adjusting your search filters' : 'No approved claims pending payment disbursement'}
                    />
                  </td>
                </tr>
              ) : (
                pagination.paged.map((row: BiharULAPaymentItem, idx: number) => {
                  const globalIdx = (pagination.curPage - 1) * pagination.pageSize + idx + 1;
                  const totalAmt = Number(row.amount || 0);
                  const paidAmt = Number(row.pay_amount || 0);
                  const balAmt = row.balance_amount != null ? Number(row.balance_amount) : Math.max(0, totalAmt - paidAmt);
                  const pStatus = Number(row.pay_status ?? 0);

                  return (
                    <tr key={row.id}>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{globalIdx}</td>
                      <td className="ax-table__td">{fmtDate(row.date || row.created_at)}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                        {row.vendor_name || row.vendor || '—'}
                      </td>
                      <td className="ax-table__td">
                        {row.site_name || row.farmer || (row.district ? `${row.district} (${row.block || 'Site'})` : '—')}
                      </td>
                      <td className="ax-table__td">
                        <MediaFileThumbnail
                          file={row.file || row.invoice}
                          onClick={(url) => setLightboxUrl(resolveBiharMediaUrl(url))}
                        />
                      </td>
                      <td className="ax-table__td" style={{ fontWeight: 700, color: 'var(--ax-text-strong)' }}>
                        ₹ {totalAmt.toLocaleString('en-IN')}
                      </td>
                      <td className="ax-table__td" style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {row.remarks || '—'}
                      </td>
                      <td className="ax-table__td" style={{ fontWeight: 700, color: '#16a34a' }}>
                        ₹ {paidAmt.toLocaleString('en-IN')}
                      </td>
                      <td className="ax-table__td" style={{ fontWeight: 700, color: balAmt > 0 ? '#d97706' : '#16a34a' }}>
                        ₹ {balAmt.toLocaleString('en-IN')}
                      </td>
                      <td className="ax-table__td">{fmtDate(row.pay_date)}</td>
                      <td className="ax-table__td" style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {row.pay_remarks || '—'}
                      </td>
                      <td className="ax-table__td">
                        {pStatus === 2 ? (
                          <span className="ax-badge ax-badge--soft ax-badge--success" style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>
                            Complete
                          </span>
                        ) : pStatus === 1 ? (
                          <span className="ax-badge ax-badge--soft ax-badge--info" style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>
                            Partially
                          </span>
                        ) : (
                          <span className="ax-badge ax-badge--soft ax-badge--warning" style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {pStatus === 2 || balAmt <= 0 ? (
                          <button
                            type="button"
                            disabled
                            title="Payment has been fully settled (Locked)"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              background: '#f1f5f9',
                              color: '#94a3b8',
                              border: '1px solid #cbd5e1',
                              fontSize: '11px',
                              fontWeight: 700,
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
                            onClick={() => {
                              setDisbursePayment(row);
                              setDisburseAmount(balAmt > 0 ? String(balAmt) : String(totalAmt));
                              setDisburseDate(new Date().toISOString().slice(0, 10));
                              setDisburseRemarks('');
                            }}
                            style={{
                              padding: '4px 12px',
                              borderRadius: 6,
                              background: '#2563eb',
                              color: '#ffffff',
                              border: 'none',
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
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

        {/* ── Left Aligned Pagination in Footer (Exact Karnataka SWP Pattern) ── */}
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
        open={Boolean(disbursePayment)}
        onClose={() => {
          if (!submittingDisburse) setDisbursePayment(null);
        }}
        title="Disburse Vendor Payment"
        subtitle={
          disbursePayment
            ? `Claim ID #${disbursePayment.id} • Total Amount: ₹ ${Number(disbursePayment.amount || 0).toLocaleString('en-IN')}`
            : ''
        }
        maxWidth={500}
        footer={
          <>
            <button
              type="button"
              className="ax-button ax-button--secondary"
              onClick={() => setDisbursePayment(null)}
              disabled={submittingDisburse}
              style={{ padding: '7px 14px', fontSize: 13, borderRadius: 6, cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDisburseSubmit}
              disabled={submittingDisburse}
              style={{
                padding: '7px 18px',
                fontSize: 13,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: 6,
                fontWeight: 700,
                cursor: 'pointer',
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
              Total Claim Amount
            </label>
            <input
              type="text"
              readOnly
              value={`₹ ${Number(disbursePayment?.amount || 0).toLocaleString('en-IN')}`}
              className="ax-input"
              style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#f1f5f9', fontWeight: 700 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--ax-text-strong)' }}>
              Balance Amount Outstanding
            </label>
            <input
              type="text"
              readOnly
              value={`₹ ${Number(disbursePayment?.balance_amount ?? disbursePayment?.amount ?? 0).toLocaleString('en-IN')}`}
              className="ax-input"
              style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#f1f5f9', fontWeight: 700, color: '#d97706' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--ax-text-strong)' }}>
              Disburse Payment Amount (₹) <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="number"
              step="any"
              min="1"
              max={Number(disbursePayment?.balance_amount ?? disbursePayment?.amount ?? 0) || undefined}
              value={disburseAmount}
              onChange={(e) => setDisburseAmount(e.target.value)}
              placeholder="Enter amount to pay..."
              required
              className="ax-input"
              style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontWeight: 700 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--ax-text-strong)' }}>
              Payment / Transfer Date <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="date"
              value={disburseDate}
              onChange={(e) => setDisburseDate(e.target.value)}
              required
              className="ax-input"
              style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--ax-text-strong)' }}>
              Payment Remarks / UTR Reference
            </label>
            <textarea
              value={disburseRemarks}
              onChange={(e) => setDisburseRemarks(e.target.value)}
              placeholder="e.g. Disbursed via RTGS Ref: UTR12345678, milestone tranche approved"
              rows={3}
              className="ax-textarea"
              style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12 }}
            />
          </div>
        </form>
      </Modal>

      {/* ── Invoice / Media File Lightbox Modal ── */}
      <Modal
        open={Boolean(lightboxUrl)}
        onClose={() => setLightboxUrl(null)}
        title="Document Preview"
        subtitle={lightboxUrl ? lightboxUrl.split('/').pop() : ''}
        maxWidth={720}
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            {lightboxUrl && (
              <a
                href={lightboxUrl}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="ax-button ax-button--secondary"
                style={{ padding: '6px 14px', fontSize: 12, textDecoration: 'none' }}
              >
                Open Original File ↗
              </a>
            )}
            <button
              type="button"
              className="ax-button ax-button--secondary"
              onClick={() => setLightboxUrl(null)}
              style={{ padding: '6px 14px', fontSize: 12, borderRadius: 6, cursor: 'pointer' }}
            >
              Close
            </button>
          </div>
        }
      >
        {lightboxUrl && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 350, background: '#f8fafc', borderRadius: 8, padding: 12 }}>
            {/\.pdf($|\?)/i.test(lightboxUrl) ? (
              <iframe
                src={lightboxUrl}
                title="PDF Document"
                style={{ width: '100%', height: 480, border: 'none', borderRadius: 6 }}
              />
            ) : (
              <img
                src={lightboxUrl}
                alt="Payment Document"
                style={{ maxWidth: '100%', maxHeight: 480, objectFit: 'contain', borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default BiharULAInstallationViewPayment;
