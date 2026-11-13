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

/* ───────── Responsive page CSS (Exact Assam SWP Installation Payment Reference) ───────── */
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

  /* All table columns fully scrollable horizontally */
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

/* ───────── Bihar SRT Payment Item Interface ───────── */
export type PaymentMilestoneTab = '70' | '15_1' | '15_2';

export interface BiharSRTPaymentItem {
  id: number;
  created_at: string;
  vendor: string;
  vendor_id?: number;
  state: string;
  district: string;
  site_name: string;
  site_count?: number;
  claim_raised_date: string;
  claim_invoice: string;
  file?: string;
  amount: number;
  claim_amount?: string;
  claim_approved_date: string;
  claim_approved_by: string;
  remarks: string;
  pay_amount: number;
  payment_amount?: string;
  pay_date: string;
  payment_date?: string;
  payment_by?: string;
  pay_remarks: string;
  status: 'Pending' | 'Partially' | 'Complete';
  pay_status: number; // 2: Complete, 1: Partially, 0: Pending
  milestone: PaymentMilestoneTab;
}

export function BiharSRTInstallationViewPayment() {
  const [payments, setPayments] = useState<BiharSRTPaymentItem[]>([]);
  const [vendorList, setVendorList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Active Milestone Tab
  const [activeMilestone, setActiveMilestone] = useState<PaymentMilestoneTab>('70');

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
  const [disbursePayment, setDisbursePayment] = useState<BiharSRTPaymentItem | null>(null);
  const [disburseAmount, setDisburseAmount] = useState('');
  const [disburseDate, setDisburseDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [disburseRemarks, setDisburseRemarks] = useState('');
  const [submittingDisburse, setSubmittingDisburse] = useState(false);

  // Load Payments from API
  const loadPayments = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg('');

      const res = await biharAdminService.getViewSrtPayments({
        from: appliedFilters.fromDate || undefined,
        to: appliedFilters.toDate || undefined,
        vendor: appliedFilters.vendor || undefined,
      });

      const rawList = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.payments)
        ? res.payments
        : Array.isArray(res?.data?.payments)
        ? res.data.payments
        : [];

      const mapped: BiharSRTPaymentItem[] = rawList.map((item: any, idx: number) => {
        const rawStatus = String(item.status ?? item.pay_status ?? '').toLowerCase();
        const pStatus: 'Pending' | 'Partially' | 'Complete' =
          rawStatus.includes('complete') || rawStatus === '2'
            ? 'Complete'
            : rawStatus.includes('part') || rawStatus === '1'
            ? 'Partially'
            : 'Pending';
        const pStatusNum = pStatus === 'Complete' ? 2 : pStatus === 'Partially' ? 1 : 0;

        let mStone: PaymentMilestoneTab = '70';
        const mStr = String(item.milestone || item.payment_type || item.phase || '').toLowerCase();
        if (mStr.includes('15_2') || mStr.includes('third') || mStr.includes('3rd')) {
          mStone = '15_2';
        } else if (mStr.includes('15') || mStr.includes('second') || mStr.includes('2nd')) {
          mStone = '15_1';
        }

        const amt = Number(item.amount || item.claim_amount || 0);
        const pAmt = Number(item.pay_amount || item.payment_amount || 0);

        return {
          id: item.id ?? idx + 1,
          created_at: item.created_at || item.claim_raised_date || item.date || '—',
          vendor: item.vendor || item.vendor_name || item.agency_name || '—',
          vendor_id: item.vendor_id,
          state: item.state || 'Bihar',
          district: item.district || '—',
          site_name: item.site_name || item.name || '—',
          site_count: Number(item.site_count || 1),
          claim_raised_date: item.claim_raised_date || item.created_at || '—',
          claim_invoice: item.claim_invoice || item.invoice || '—',
          file: item.file || item.invoice || '',
          amount: amt,
          claim_amount: `₹ ${amt.toLocaleString('en-IN')}`,
          claim_approved_date: item.claim_approved_date || item.approved_date || '—',
          claim_approved_by: item.claim_approved_by || item.approved_by || '—',
          remarks: item.remarks || item.remark || '—',
          pay_amount: pAmt,
          payment_amount: `₹ ${pAmt.toLocaleString('en-IN')}`,
          pay_date: item.pay_date || item.payment_date || '—',
          payment_date: item.payment_date || item.pay_date || '—',
          payment_by: item.payment_by || 'Finance Accounts Officer',
          pay_remarks: item.pay_remarks || item.payment_remark || '—',
          status: pStatus,
          pay_status: pStatusNum,
          milestone: mStone,
        };
      });

      setPayments(mapped);

      // Extract unique vendors for filter dropdown
      const vSet = new Set<string>();
      mapped.forEach((p) => {
        if (p.vendor && p.vendor !== '—') vSet.add(p.vendor);
      });
      setVendorList(Array.from(vSet).sort());
    } catch (err: any) {
      console.error('Failed to load Bihar SRT payments:', err);
      setErrorMsg(err?.message || 'Failed to load SRT payments from server.');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [appliedFilters]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  // Milestone counts
  const milestoneCounts = useMemo(() => {
    return {
      '70': payments.filter((p) => p.milestone === '70').length,
      '15_1': payments.filter((p) => p.milestone === '15_1').length,
      '15_2': payments.filter((p) => p.milestone === '15_2').length,
    };
  }, [payments]);

  // Current Milestone Dataset
  const milestonePayments = useMemo(() => {
    return payments.filter((p) => p.milestone === activeMilestone);
  }, [payments, activeMilestone]);

  // Overall KPI Summary across current milestone (or total)
  const paymentDetail = useMemo(() => {
    const total = milestonePayments.length;
    const complete = milestonePayments.filter((p) => p.pay_status === 2).length;
    const partially = milestonePayments.filter((p) => p.pay_status === 1).length;
    const pending = milestonePayments.filter((p) => p.pay_status === 0 || p.pay_status === undefined).length;
    return { total, complete, partially, pending };
  }, [milestonePayments]);

  const tabLabel =
    activeMilestone === '70'
      ? '1st Payment 70%'
      : activeMilestone === '15_1'
      ? '2nd Payment 15%'
      : '3rd Payment 15%';

  // Apply filters
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
    setAppliedFilters({ fromDate: '', toDate: '', vendor: '', payStatus: 'All' });
  };

  // Filtered Payments List
  const filteredPayments = useMemo(() => {
    return milestonePayments.filter((item) => {
      // Date filter
      if (appliedFilters.fromDate) {
        const itemDate = (item.created_at || item.claim_approved_date || '').slice(0, 10);
        if (itemDate && itemDate < appliedFilters.fromDate) return false;
      }
      if (appliedFilters.toDate) {
        const itemDate = (item.created_at || item.claim_approved_date || '').slice(0, 10);
        if (itemDate && itemDate > appliedFilters.toDate) return false;
      }

      // Vendor filter
      if (appliedFilters.vendor && item.vendor !== appliedFilters.vendor) {
        return false;
      }

      // Pay status filter
      if (appliedFilters.payStatus !== 'All') {
        const stNum = Number(appliedFilters.payStatus);
        if (item.pay_status !== stNum) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const vendor = (item.vendor || '').toLowerCase();
        const site = (item.site_name || '').toLowerCase();
        const invoice = (item.claim_invoice || '').toLowerCase();
        const district = (item.district || '').toLowerCase();
        const remarks = (item.remarks || '').toLowerCase();
        const amtStr = String(item.amount || '');

        return (
          vendor.includes(q) ||
          site.includes(q) ||
          invoice.includes(q) ||
          district.includes(q) ||
          remarks.includes(q) ||
          amtStr.includes(q)
        );
      }

      return true;
    });
  }, [milestonePayments, appliedFilters, searchQuery]);

  const pagination = usePagination(filteredPayments, { initialPageSize: 10 });

  // Disburse submit handler calling API
  const handleDisburseSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!disbursePayment) return;

    const amt = parseFloat(disburseAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('Please enter a valid disbursement amount greater than 0.');
      return;
    }

    setSubmittingDisburse(true);
    try {
      const totalAmount = Number(disbursePayment.amount || 0);
      const currentPaid = Number(disbursePayment.pay_amount || 0);
      const newPaid = currentPaid + amt;
      const newStatusNum = newPaid >= totalAmount ? 2 : 1;

      await biharAdminService.updateSrtPaymentStatus({
        id: disbursePayment.id,
        pay_amount: newPaid,
        payment_date: disburseDate,
        payment_remark: disburseRemarks || `Disbursed ₹ ${amt.toLocaleString('en-IN')}`,
        status: newStatusNum,
      });

      setSuccessMsg(`Payment of ₹ ${amt.toLocaleString('en-IN')} recorded successfully for Claim #${disbursePayment.id}!`);
      setDisbursePayment(null);
      setDisburseAmount('');
      setDisburseRemarks('');
      await loadPayments();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(`Failed to record disbursement payment: ${err?.message || 'Server error'}`);
    } finally {
      setSubmittingDisburse(false);
    }
  };

  // Export columns
  const exportCols: ExportColumn<BiharSRTPaymentItem>[] = useMemo(
    () => [
      { header: 'S.No.', accessor: (_r, idx) => (idx !== undefined ? idx + 1 : '') },
      { header: 'Date', accessor: (r) => fmtDate(r.created_at || r.claim_approved_date) },
      { header: 'Vendor', accessor: (r) => r.vendor },
      { header: 'State', accessor: (r) => r.state },
      { header: 'District', accessor: (r) => r.district },
      { header: 'Site Name', accessor: (r) => r.site_name },
      { header: 'Claim Invoice', accessor: (r) => r.claim_invoice },
      { header: 'Claim Amount (₹)', accessor: (r) => r.amount },
      { header: 'Claim Approved Date', accessor: (r) => fmtDate(r.claim_approved_date) },
      { header: 'Claim Approved by', accessor: (r) => r.claim_approved_by },
      { header: `${tabLabel} Paid (₹)`, accessor: (r) => r.pay_amount },
      { header: 'Balance (₹)', accessor: (r) => Math.max(0, Number(r.amount || 0) - Number(r.pay_amount || 0)) },
      { header: 'Pay Date', accessor: (r) => fmtDate(r.pay_date) },
      { header: 'Remarks', accessor: (r) => r.remarks || '—' },
      { header: 'Pay Remarks', accessor: (r) => r.pay_remarks || '—' },
      { header: 'Status', accessor: (r) => r.status },
    ],
    [tabLabel]
  );

  const getExportValue = <T,>(row: T, col: ExportColumn<T>, index: number): unknown => {
    if (typeof col.accessor === 'function') {
      return col.accessor(row, index);
    }
    return (row as Record<string, unknown>)[col.accessor as string];
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

  const fileBase = `Bihar_SRT_Payment_${activeMilestone}`;
  const fileTitle = `Bihar SRT Payment - ${tabLabel}`;

  return (
    <div className="solar-erp-page" style={{ maxWidth: '100%', margin: '0 auto', paddingBottom: 40 }}>
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      <PageHead
        title="Bihar SRT Payment Request"
        subtitle="Disburse vendor claim payments, manage milestone releases, and track outstanding balances"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Bihar SRT', href: '/vendor-management/bihar/srt/installation/dashboard' },
          { label: 'Bihar SRT Payment Request' },
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
          value={loading ? '—' : paymentDetail.total}
          sub={`${tabLabel} vouchers`}
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
          value={loading ? '—' : paymentDetail.complete}
          sub="Fully settled milestones"
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
          value={loading ? '—' : paymentDetail.partially}
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
          value={loading ? '—' : paymentDetail.pending}
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
                <option key={v} value={v}>
                  {v}
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
              className="ax-btn ax-btn--primary ax-btn--sm"
              style={{ height: 34, padding: '0 14px', fontSize: 12, fontWeight: 600 }}
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

      {/* ── Report-Wise Milestone Tabs (Pills) ── */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--ax-border, #e2e8f0)', paddingBottom: 8 }}>
          {[
            { key: '70' as const, label: '1st Payment 70%' },
            { key: '15_1' as const, label: '2nd Payment 15%' },
            { key: '15_2' as const, label: '3rd Payment 15%' },
          ].map((tab) => {
            const active = activeMilestone === tab.key;
            const count = milestoneCounts[tab.key];
            return (
              <button
                key={tab.key}
                type="button"
                className={`ax-btn ${active ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
                style={{
                  height: 36,
                  padding: '0 16px',
                  borderRadius: 8,
                  fontSize: 12.5,
                  fontWeight: active ? 700 : 500,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                }}
                onClick={() => {
                  setActiveMilestone(tab.key);
                  setSearchQuery('');
                  pagination.setPage(1);
                }}
              >
                <span>{tab.label}</span>
                <span
                  style={{
                    padding: '2px 7px',
                    borderRadius: 9999,
                    fontSize: 11,
                    fontWeight: 700,
                    background: active ? 'rgba(255, 255, 255, 0.25)' : 'var(--ax-surface-subtle, #f1f5f9)',
                    color: active ? '#ffffff' : 'var(--ax-text-strong)',
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main Data Card ── */}
      <section className="ax-card ax-col--12">
        <div className="ax-card__header" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div className="ax-card__titles">
            <h2 className="ax-card__title" style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>{tabLabel}</h2>
            <p className="ax-card__subtitle" style={{ fontSize: '12.5px', color: '#64748b', margin: '4px 0 0' }}>
              Showing {filteredPayments.length} claim payment voucher{filteredPayments.length === 1 ? '' : 's'} under {tabLabel}
            </p>
          </div>

          <div className="ax-card__actions">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search vendor, site..."
                size="sm"
                ariaLabel="Search payment vouchers"
              />
              <TableExportToolbar
                onCopy={() => copyToClipboard(filteredPayments, exportCols)}
                onExportCSV={() => exportToCSV(filteredPayments, exportCols, fileBase)}
                onExportExcel={() => exportToExcel(filteredPayments, exportCols, fileBase)}
                onExportPDF={() => exportToPDF(filteredPayments, exportCols, fileTitle)}
              />
            </div>
          </div>
        </div>

        <div className="ax-table-wrap" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%' }}>
          <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap', width: '100%', fontSize: 12.5 }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th">Sr. No.</th>
                <th className="ax-table__th">State</th>
                <th className="ax-table__th">Vendor Name</th>
                <th className="ax-table__th">Site Name</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Site Count</th>
                <th className="ax-table__th">Claim Invoice</th>
                <th className="ax-table__th">Claim Amount</th>
                <th className="ax-table__th">Claim Approved Date</th>
                <th className="ax-table__th">Claim Approved by</th>
                <th className="ax-table__th">Payment Date</th>
                <th className="ax-table__th">Payment By</th>
                <th className="ax-table__th">Pay Amount</th>
                <th className="ax-table__th">Payment Remark</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Status</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={15} style={{ textAlign: 'center', padding: '40px 16px', color: '#64748b' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <div className="ax-spinner" style={{ width: 18, height: 18 }} />
                      <span>Loading payments data from API...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={15} style={{ padding: 0 }}>
                    <TableEmptyState
                      title="No payment vouchers found"
                      message={searchQuery ? 'No vouchers match your search criteria.' : 'No payment requests available for this milestone.'}
                      onClear={searchQuery ? () => setSearchQuery('') : undefined}
                      clearLabel="Clear search"
                    />
                  </td>
                </tr>
              ) : (
                (pagination.paged ?? []).map((r, idx) => {
                  const globalIdx = (pagination.page - 1) * pagination.pageSize + idx + 1;
                  return (
                    <tr key={r.id} className="ax-table__row">
                      <td className="ax-table__td ax-num">{globalIdx}</td>
                      <td className="ax-table__td">{r.state}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{r.vendor}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: '#1e293b' }}>{r.site_name}</td>
                      <td className="ax-table__td ax-num" style={{ textAlign: 'center' }}>
                        <span className="ax-badge ax-badge--soft ax-badge--info" style={{ fontWeight: 700 }}>
                          {r.site_count}
                        </span>
                      </td>
                      <td className="ax-table__td">
                        <MediaFileThumbnail
                          file={r.file || r.claim_invoice}
                          onClick={(url) => setLightboxUrl(resolveBiharMediaUrl(url))}
                        />
                      </td>
                      <td className="ax-table__td" style={{ fontWeight: 700, color: '#047857' }}>
                        {r.claim_amount}
                      </td>
                      <td className="ax-table__td ax-num">{fmtDate(r.claim_approved_date)}</td>
                      <td className="ax-table__td">{r.claim_approved_by}</td>
                      <td className="ax-table__td ax-num">{fmtDate(r.pay_date || r.payment_date)}</td>
                      <td className="ax-table__td">{r.payment_by || '—'}</td>
                      <td className="ax-table__td" style={{ fontWeight: 700, color: '#2563eb' }}>
                        {r.pay_amount ? `₹ ${r.pay_amount.toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="ax-table__td" style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {r.pay_remarks || '—'}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <span
                          className={`ax-badge ax-badge--soft ${
                            r.status === 'Complete'
                              ? 'ax-badge--success'
                              : r.status === 'Partially'
                              ? 'ax-badge--info'
                              : 'ax-badge--warning'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {r.status !== 'Complete' ? (
                          <button
                            type="button"
                            onClick={() => {
                              setDisbursePayment(r);
                              const remaining = Math.max(0, Number(r.amount || 0) - Number(r.pay_amount || 0));
                              setDisburseAmount(String(remaining));
                              setDisburseRemarks('');
                            }}
                            className="ax-btn ax-btn--primary ax-btn--sm"
                            style={{ height: 26, padding: '0 10px', fontSize: 11.5 }}
                          >
                            Disburse
                          </button>
                        ) : (
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
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="ax-card__footer ula-pagination-left" style={{ padding: '12px 16px', borderTop: '1px solid #e2e8f0' }}>
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            pageSize={pagination.pageSize}
            totalItems={filteredPayments.length}
            onPageChange={pagination.setPage}
            onPageSizeChange={pagination.setPageSize}
          />
        </div>
      </section>

      {/* ── Disburse Payment Modal ── */}
      <Modal
        open={!!disbursePayment}
        onClose={() => setDisbursePayment(null)}
        title="Disburse Payment Release"
        subtitle={disbursePayment ? `${disbursePayment.site_name} (${disbursePayment.vendor})` : ''}
        footer={
          <>
            <button
              type="button"
              onClick={() => setDisbursePayment(null)}
              className="ax-btn ax-btn--secondary ax-btn--sm"
              disabled={submittingDisburse}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDisburseSubmit}
              disabled={submittingDisburse}
              className="ax-btn ax-btn--primary ax-btn--sm"
            >
              {submittingDisburse ? 'Recording...' : 'Record Payment'}
            </button>
          </>
        }
      >
        <form onSubmit={handleDisburseSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: '#334155' }}>
              Disbursement Amount (₹) <span style={{ color: '#ef4444' }}>*</span>
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
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: '#334155' }}>
              Disbursement Date <span style={{ color: '#ef4444' }}>*</span>
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
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: '#334155' }}>
              Payment Remarks / UTR Reference
            </label>
            <textarea
              rows={3}
              value={disburseRemarks}
              onChange={(e) => setDisburseRemarks(e.target.value)}
              placeholder="Enter bank transfer UTR or remarks..."
              className="ax-input"
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, resize: 'vertical' }}
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
            zIndex: 10000,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              background: '#ffffff',
              borderRadius: 16,
              maxWidth: 720,
              width: '100%',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: '1px solid #e2e8f0',
                background: '#f8fafc',
              }}
            >
              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                Invoice Document Preview
              </h4>
              <button
                type="button"
                onClick={() => setLightboxUrl(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  fontSize: 20,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 260 }}>
              {/\.(jpe?g|png|webp|gif|bmp|svg)($|\?)/i.test(lightboxUrl) ? (
                <img src={lightboxUrl} alt="Invoice Document Preview" style={{ maxWidth: '100%', maxHeight: 480, objectFit: 'contain' }} />
              ) : (
                <div style={{ textAlign: 'center', padding: 20 }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>📄</div>
                  <h5 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                    {lightboxUrl.split('/').pop() || 'Invoice Document'}
                  </h5>
                  <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>
                    PDF / Scanned Claim Voucher Document
                  </p>
                  <a
                    href={lightboxUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ax-btn ax-btn--primary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, cursor: 'pointer', textDecoration: 'none' }}
                  >
                    Open Document ↗
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BiharSRTInstallationViewPayment;
