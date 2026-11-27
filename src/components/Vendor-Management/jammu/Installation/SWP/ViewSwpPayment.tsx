import { useEffect, useMemo, useState, useCallback, useRef, type FormEvent, type ReactNode } from 'react';
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
  jammuAdminSwpService,
  resolveJammuSwpMediaUrl,
} from './jammuSwpAdminService';

/* ───────── Responsive page CSS (Exact Solar ERP / Jammu SRT 70MW reference) ───────── */
const PAGE_CSS = `
  .solar-erp-page {
    --asw-primary: #2559bf;
    --asw-primary-rgb: 37, 89, 191;
  }
  .solar-erp-page .ax-btn--primary {
    background-color: #2559bf !important;
    border-color: #2559bf !important;
    color: #ffffff !important;
  }
  .solar-erp-page .ax-btn--primary:hover {
    background-color: #1d4699 !important;
    border-color: #1d4699 !important;
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
    width: 100%;
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

/* ── Top KPI Card Component ── */
type KpiTone = 'accent' | 'cyan' | 'emerald' | 'amber' | 'red';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(37, 89, 191, 0.12)', fg: '#2559bf' },
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
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{title}</h3>
            {subtitle && <p style={{ margin: '4px 0 0 0', fontSize: 12.5, color: '#64748b' }}>{subtitle}</p>}
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

/* ───────── Lightbox Modal ───────── */
function LightboxModal({
  open,
  onClose,
  url,
  title,
}: {
  open: boolean;
  onClose: () => void;
  url: string;
  title: string;
}) {
  const isPdf = /\.pdf($|\?)/i.test(url);

  if (!open) return null;

  return createPortal(
    <div className="ax-modal" role="dialog" aria-modal="true" style={{ zIndex: 10000 }}>
      <div className="ax-modal__backdrop" onClick={onClose} />
      <div
        className="ax-modal__dialog"
        style={{
          maxWidth: isPdf ? 1000 : 800,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div className="ax-modal__header">
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{title}</h3>
            <span style={{ fontSize: 11.5, color: '#64748b' }}>Invoice Inspection</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="ax-btn ax-btn--ghost ax-btn--sm"
              style={{ fontSize: 12 }}
            >
              Open Original ↗
            </a>
            <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close">
              {X_ICON}
            </button>
          </div>
        </div>
        <div className="ax-modal__body" style={{ padding: 12, display: 'flex', justifyContent: 'center', background: '#0b1120', minHeight: 460 }}>
          {isPdf ? (
            <iframe src={url} title={title} style={{ width: '100%', height: '70vh', border: 'none', borderRadius: 8, background: '#fff' }} />
          ) : (
            <img src={url} alt={title} style={{ maxWidth: '100%', maxHeight: '72vh', objectFit: 'contain', borderRadius: 8 }} />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export interface JammuSwpPaymentTableItem {
  id: number;
  date: string;
  vendorId?: number;
  vendor: string;
  sites: Array<{ id: number; farmer_name?: string }>;
  invoice?: string;
  amount: number;
  remarks: string;
  payAmount: number;
  balanceAmount: number;
  payDate: string;
  payRemarks: string;
  payStatus: number; // 0 = Pending, 1 = Complete, 2 = Partially
  allpayment: any[];
}

const fmtCurrency = (val: number | string | undefined | null) =>
  `₹${Number(val || 0).toLocaleString('en-IN')}`;

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function ViewSwpPayment() {
  const [payments, setPayments] = useState<JammuSwpPaymentTableItem[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    complete: 0,
    partially: 0,
    pending: 0,
  });
  const [vendorList, setVendorList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [vendorFilter, setVendorFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Disburse / Record Payment Modal
  const [actionPayment, setActionPayment] = useState<JammuSwpPaymentTableItem | null>(null);
  const [payAmountInput, setPayAmountInput] = useState<string>('');
  const [payDateInput, setPayDateInput] = useState<string>(new Date().toISOString().slice(0, 10));
  const [payRemarksInput, setPayRemarksInput] = useState<string>('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Installments and Sites View Modals & Lightbox
  const [selectedSitesModal, setSelectedSitesModal] = useState<JammuSwpPaymentTableItem | null>(null);
  const [selectedInstallmentsModal, setSelectedInstallmentsModal] = useState<JammuSwpPaymentTableItem | null>(null);
  const [lightbox, setLightbox] = useState<{ url: string; title: string } | null>(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await jammuAdminSwpService.getViewPayment({
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
        vendor: vendorFilter !== 'all' ? vendorFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });

      if (res.payment_detail) {
        setStats({
          total: Number(res.payment_detail.total || 0),
          complete: Number(res.payment_detail.complete || 0),
          partially: Number(res.payment_detail.partially || 0),
          pending: Number(res.payment_detail.pending || 0),
        });
      }
      if (Array.isArray(res.vendor)) {
        setVendorList(res.vendor);
      }

      const rawPayments = Array.isArray(res.payments) ? res.payments : [];
      const mapped: JammuSwpPaymentTableItem[] = rawPayments.map((p: any) => {
        const installments = Array.isArray(p.allpayment) ? p.allpayment : [];
        const totalPaid = installments.reduce((acc: number, curr: { amount?: number | string }) => acc + Number(curr.amount || 0), 0);
        const claimAmt = Number(p.amount ?? p.claim_amount ?? 0);
        const balance = Math.max(0, claimAmt - totalPaid);

        const latestInst = installments.length > 0 ? installments[installments.length - 1] : null;

        let st = Number(p.pay_status ?? p.status ?? 0);
        if (installments.length > 0) {
          if (balance === 0) st = 1; // Complete
          else st = 2; // Partially
        }

        const rawInvoice = p.invoice || p.file || p.claim_invoice;

        return {
          id: p.id,
          date: p.payment_date || p.date || p.created_at || '—',
          vendorId: p.vendor_id,
          vendor: p.vendor_name || p.vendor || (p.vendor_id ? `Vendor #${p.vendor_id}` : '—'),
          sites: Array.isArray(p.sites) ? p.sites : [],
          invoice: rawInvoice ? resolveJammuSwpMediaUrl(rawInvoice) : undefined,
          amount: claimAmt,
          remarks: p.remarks || '—',
          payAmount: totalPaid,
          balanceAmount: balance,
          payDate: latestInst?.date || latestInst?.created_at || '—',
          payRemarks: latestInst?.pay_remarks || '—',
          payStatus: st,
          allpayment: installments,
        };
      });

      setPayments(mapped);
    } catch (err: any) {
      console.error('Failed to fetch Jammu SWP payment records:', err);
      setErrorMsg(err?.message || 'Failed to fetch Jammu SWP payment disbursement records.');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, vendorFilter, statusFilter]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // Submit Payment / Disburse
  const handlePaymentSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!actionPayment) return;

    const amt = Number(payAmountInput);
    if (!amt || amt <= 0) {
      alert('Please enter a valid disbursement amount.');
      return;
    }
    if (amt > actionPayment.balanceAmount) {
      alert(`Amount cannot exceed the balance amount of ${fmtCurrency(actionPayment.balanceAmount)}`);
      return;
    }

    setSubmittingPayment(true);
    try {
      const res = await jammuAdminSwpService.updatePaymentStatus({
        id: actionPayment.id,
        amount: amt,
        date: payDateInput,
        remarks: payRemarksInput.trim() || undefined,
      });

      if (res.success || res.status) {
        alert(res.message || 'Payment successfully recorded.');
        setActionPayment(null);
        setPayAmountInput('');
        setPayRemarksInput('');
        fetchPayments();
      } else {
        alert(res.message || 'Failed to record payment.');
      }
    } catch (err: any) {
      alert(err?.message || 'Error recording payment.');
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Local text search
  const filteredPayments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return payments;
    return payments.filter((p) => {
      const hay = [
        p.id,
        p.vendor,
        p.date,
        p.amount,
        p.remarks,
        p.payRemarks,
        p.payDate,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [payments, searchQuery]);

  const pagination = usePagination(filteredPayments, { initialPageSize: 50 });

  useEffect(() => {
    pagination.setPage(1);
  }, [searchQuery]);

  // Export columns
  const exportCols: ExportColumn[] = [
    { header: 'S.No.', accessor: 'id' },
    { header: 'Date', accessor: 'date' },
    { header: 'Vendor', accessor: 'vendor' },
    { header: 'Sites Count', accessor: 'sitesCount' },
    { header: 'Invoice', accessor: 'invoice' },
    { header: 'Amount (₹)', accessor: 'amount' },
    { header: 'Remarks', accessor: 'remarks' },
    { header: 'Pay Amount (₹)', accessor: 'payAmount' },
    { header: 'Balance Amount (₹)', accessor: 'balanceAmount' },
    { header: 'Pay Date', accessor: 'payDate' },
    { header: 'Pay Remarks', accessor: 'payRemarks' },
    { header: 'Pay Status', accessor: 'payStatus' },
  ];

  const exportDataFormatted = useMemo(() => {
    return filteredPayments.map((p, idx) => ({
      id: idx + 1,
      date: p.date,
      vendor: p.vendor,
      sitesCount: p.sites.length,
      invoice: p.invoice || '—',
      amount: p.amount,
      remarks: p.remarks,
      payAmount: p.payAmount,
      balanceAmount: p.balanceAmount,
      payDate: p.payDate,
      payRemarks: p.payRemarks,
      payStatus: p.payStatus === 1 ? 'Complete' : p.payStatus === 2 ? 'Partially' : 'Pending',
    }));
  }, [filteredPayments]);

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

  const copyToClipboard = async () => {
    if (!exportDataFormatted.length) return;
    const t = [
      exportCols.map((c) => c.header).join('\t'),
      ...exportDataFormatted.map((row) =>
        exportCols.map((c) => String((row as any)[c.accessor as string] || '')).join('\t')
      ),
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

  const exportToCSV = () => {
    if (!exportDataFormatted.length) return;
    const out = [
      exportCols.map((c) => c.header),
      ...exportDataFormatted.map((row) =>
        exportCols.map((c) => `"${String((row as any)[c.accessor as string] || '').replace(/"/g, '""')}"`)
      ),
    ];
    downloadTextFile(`\ufeff${out.map((r) => r.join(',')).join('\r\n')}`, `Jammu_SWP_Payments.csv`, 'text/csv');
  };

  const exportToExcel = () => {
    if (!exportDataFormatted.length) return;
    const tableHtml = `<table border="1"><thead><tr>${exportCols.map((c) => `<th>${escapeHtml(c.header ?? c.label ?? '')}</th>`).join('')}</tr></thead><tbody>${exportDataFormatted.map((row) => `<tr>${exportCols.map((c) => `<td>${escapeHtml(String((row as any)[c.accessor as string] || ''))}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    downloadTextFile(`\ufeff<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"/></head><body>${tableHtml}</body></html>`, `Jammu_SWP_Payments.xls`, 'application/vnd.ms-excel');
  };

  const exportToPDF = () => {
    if (!exportDataFormatted.length) return;
    const w = window.open('', '_blank', 'width=1200,height=800');
    if (!w) return;
    w.document.write(`<!doctype html><html><head><meta charset="UTF-8"/><title>Jammu SWP Payments</title><style>
      *{box-sizing:border-box}body{font-family:Arial,sans-serif;padding:24px;color:#222}h1{font-size:20px;margin:0 0 16px}
      table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #d8dee6;padding:6px 8px;text-align:left;vertical-align:top}
      th{background:#f3f5f7;font-weight:700}@media print{body{padding:0}@page{size:landscape;margin:10mm}}
    </style></head><body><h1>Jammu SWP Payment & Disbursement Register</h1><table><thead><tr>${exportCols.map((c) => `<th>${escapeHtml(c.header ?? c.label ?? '')}</th>`).join('')}</tr></thead><tbody>${exportDataFormatted.map((r) => `<tr>${exportCols.map((c) => `<td>${escapeHtml(String((r as any)[c.accessor as string] || ''))}</td>`).join('')}</tr>`).join('')}</tbody></table><script>window.onload=function(){window.print();};</script></body></html>`);
    w.document.close();
    w.focus();
  };

  return (
    <div className="solar-erp-page ax-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* ── Page Header ── */}
      <PageHead
        title="Jammu SWP Installation - View Payment"
        subtitle="Tracking solar water pump milestone disbursements, vendor bank settlements, and tranche disbursement logs across Jammu"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Jammu', href: '/vendor-management/jammu' },
          { label: 'SWP', href: '/vendor-management/jammu/installation/swp/dashboard' },
          { label: 'View Payment' },
        ]}
      />

      {errorMsg && (
        <div className="ax-card" style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, marginBottom: 16, color: '#dc2626', fontSize: 13 }}>
          {errorMsg}
        </div>
      )}

      {/* ── 4 Top KPI Metric Cards ── */}
      <div className="asw-cards-row">
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
          }
          tone="accent"
          label="Payment Request"
          value={stats.total || payments.length}
          sub="Sanctioned claim accounts"
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
          value={stats.complete || payments.filter((p) => p.payStatus === 1).length}
          sub="Claims fully settled"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          }
          tone="cyan"
          label="Payment Partially"
          value={stats.partially || payments.filter((p) => p.payStatus === 2).length}
          sub="Tranche released in part"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          }
          tone="amber"
          label="Payment Pending"
          value={stats.pending || payments.filter((p) => p.payStatus === 0).length}
          sub="Awaiting first disbursement"
        />
      </div>

      {/* ── Filter Card ── */}
      <div className="asw-filter-card">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14, alignItems: 'flex-end' }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>From Date:</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="ax-form-control"
              style={{ width: '100%', padding: '6px 10px', fontSize: 12, borderRadius: 6, border: '1px solid #cbd5e1' }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>To Date:</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="ax-form-control"
              style={{ width: '100%', padding: '6px 10px', fontSize: 12, borderRadius: 6, border: '1px solid #cbd5e1' }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Select Vendor:</label>
            <select
              value={vendorFilter}
              onChange={(e) => setVendorFilter(e.target.value)}
              className="ax-form-control"
              style={{ width: '100%', padding: '6px 10px', fontSize: 12, borderRadius: 6, border: '1px solid #cbd5e1' }}
            >
              <option value="all">All Vendors</option>
              {vendorList.map((v) => (
                <option key={v.id || v.inst_vendor} value={v.id || v.inst_vendor}>
                  {v.name || v.vendor_name || `Vendor #${v.id}`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Payment Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="ax-form-control"
              style={{ width: '100%', padding: '6px 10px', fontSize: 12, borderRadius: 6, border: '1px solid #cbd5e1' }}
            >
              <option value="all">All Status</option>
              <option value="1">Complete (1)</option>
              <option value="2">Partially (2)</option>
              <option value="0">Pending (0)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Main Data Card ── */}
      <section className="ax-card ax-col--12">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">Milestone Payment Disbursement Register</h2>
            <p className="ax-card__subtitle">Showing {filteredPayments.length} payment disbursement record(s)</p>
          </div>
          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              {searchQuery.trim() !== '' && (
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--sm"
                  onClick={() => setSearchQuery('')}
                  style={{ height: 30, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }}
                >
                  Reset
                </button>
              )}
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search vendor, amount, remarks..."
                size="sm"
              />
              <TableExportToolbar
                onCopy={copyToClipboard}
                onExportCSV={exportToCSV}
                onExportExcel={exportToExcel}
                onExportPDF={exportToPDF}
              />
            </div>
          </div>
        </div>

        {/* ── Horizontally Scrollable Table with Exact 13 Columns ── */}
        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap', minWidth: 1500 }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th" style={{ width: 60, textAlign: 'center' }}>S.No.</th>
                <th className="ax-table__th">Date</th>
                <th className="ax-table__th">Vendor</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Sites</th>
                <th className="ax-table__th" style={{ width: 100, textAlign: 'center' }}>Invoice</th>
                <th className="ax-table__th" style={{ textAlign: 'right' }}>Amount</th>
                <th className="ax-table__th">Remarks</th>
                <th className="ax-table__th" style={{ textAlign: 'right' }}>Pay Amount</th>
                <th className="ax-table__th" style={{ textAlign: 'right' }}>Balance Amount</th>
                <th className="ax-table__th">Pay Date</th>
                <th className="ax-table__th">Pay Remarks</th>
                <th className="ax-table__th" style={{ width: 110, textAlign: 'center' }}>Pay Status</th>
                <th className="ax-table__th" style={{ width: 120, textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={13} style={centerCell}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <span className="ax-spinner" aria-hidden="true" />
                      <span>Loading Jammu SWP disbursement records...</span>
                    </div>
                  </td>
                </tr>
              ) : pagination.paged.length === 0 ? (
                <tr>
                  <td colSpan={13} style={centerCell}>
                    <TableEmptyState title="No Payment Records Found" description="No disbursement records found matching criteria." />
                  </td>
                </tr>
              ) : (
                pagination.paged.map((row, idx) => {
                  const globalIdx = (pagination.curPage - 1) * pagination.pageSize + idx + 1;
                  const isComplete = row.payStatus === 1;
                  const isPartial = row.payStatus === 2;

                  return (
                    <tr key={row.id}>
                      {/* 1. S.No. */}
                      <td className="ax-table__td" style={{ textAlign: 'center', fontWeight: 600 }}>
                        {globalIdx}
                      </td>

                      {/* 2. Date */}
                      <td className="ax-table__td">{row.date}</td>

                      {/* 3. Vendor */}
                      <td className="ax-table__td" style={{ fontWeight: 600, color: '#0f172a' }}>
                        {row.vendor}
                      </td>

                      {/* 4. Sites */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {row.sites.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => setSelectedSitesModal(row)}
                            className="ax-btn ax-btn--ghost ax-btn--xs"
                            style={{
                              color: '#2559bf',
                              fontWeight: 700,
                              background: '#eff6ff',
                              border: '1px solid #bfdbfe',
                              borderRadius: 9999,
                              padding: '2px 10px',
                            }}
                            title="Click to view associated sites"
                          >
                            {row.sites.length} Site{row.sites.length === 1 ? '' : 's'} ↗
                          </button>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </td>

                      {/* 5. Invoice */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {row.invoice ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            {/\.(jpe?g|png|webp|gif|svg)$/i.test(row.invoice) ? (
                              <button
                                type="button"
                                onClick={() => setLightbox({ url: row.invoice!, title: `Claim #${row.id} Invoice` })}
                                style={{
                                  border: '1px solid #cbd5e1',
                                  borderRadius: 6,
                                  padding: 2,
                                  background: '#fff',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                }}
                                title="Click to preview Invoice"
                              >
                                <img
                                  src={row.invoice}
                                  alt="Invoice"
                                  style={{ width: 44, height: 44, borderRadius: 4, objectFit: 'cover' }}
                                />
                              </button>
                            ) : (
                              <a
                                href={row.invoice}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  padding: '5px 10px',
                                  borderRadius: 6,
                                  background: '#eff4fc',
                                  color: '#2559bf',
                                  textDecoration: 'none',
                                  fontSize: 12,
                                  fontWeight: 600,
                                  border: '1px solid #bfd3f8',
                                }}
                                title="Open Invoice"
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                  <polyline points="14 2 14 8 20 8" />
                                </svg>
                                <span>Invoice</span>
                              </a>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </td>

                      {/* 6. Amount */}
                      <td className="ax-table__td" style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                        {fmtCurrency(row.amount)}
                      </td>

                      {/* 7. Remarks */}
                      <td className="ax-table__td" style={{ maxWidth: 160 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#64748b' }} title={row.remarks}>
                          {row.remarks}
                        </div>
                      </td>

                      {/* 8. Pay Amount */}
                      <td className="ax-table__td" style={{ textAlign: 'right', fontWeight: 700, color: '#059669' }}>
                        {fmtCurrency(row.payAmount)}
                      </td>

                      {/* 9. Balance Amount */}
                      <td className="ax-table__td" style={{ textAlign: 'right', fontWeight: 700, color: row.balanceAmount > 0 ? '#dc2626' : '#64748b' }}>
                        {fmtCurrency(row.balanceAmount)}
                      </td>

                      {/* 10. Pay Date */}
                      <td className="ax-table__td">{row.payDate}</td>

                      {/* 11. Pay Remarks */}
                      <td className="ax-table__td" style={{ maxWidth: 160 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#64748b' }} title={row.payRemarks}>
                          {row.payRemarks}
                        </div>
                      </td>

                      {/* 12. Pay Status */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '3px 10px',
                            borderRadius: 9999,
                            fontSize: 11.5,
                            fontWeight: 700,
                            background:
                              isComplete ? '#ecfdf5' : isPartial ? '#eff6ff' : '#fffbeb',
                            color:
                              isComplete ? '#059669' : isPartial ? '#2563eb' : '#d97706',
                            border: `1px solid ${
                              isComplete ? '#a7f3d0' : isPartial ? '#bfdbfe' : '#fde68a'
                            }`,
                          }}
                        >
                          {isComplete ? 'Complete' : isPartial ? 'Partially' : 'Pending'}
                        </span>
                      </td>

                      {/* 13. Action */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                          {!isComplete && (
                            <button
                              type="button"
                              onClick={() => {
                                setActionPayment(row);
                                setPayAmountInput(String(row.balanceAmount || row.amount));
                                setPayDateInput(new Date().toISOString().slice(0, 10));
                                setPayRemarksInput('');
                              }}
                              style={{
                                padding: '4px 10px',
                                borderRadius: 6,
                                fontSize: 11.5,
                                fontWeight: 600,
                                background: '#2559bf',
                                color: '#fff',
                                border: 'none',
                                cursor: 'pointer',
                              }}
                            >
                              Disburse
                            </button>
                          )}
                          {row.allpayment.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setSelectedInstallmentsModal(row)}
                              className="ax-btn ax-btn--ghost ax-btn--xs"
                              style={{ fontSize: 11, color: '#2559bf', padding: '3px 6px' }}
                              title="View past installments"
                            >
                              History ({row.allpayment.length})
                            </button>
                          )}
                          {isComplete && row.allpayment.length === 0 && (
                            <span style={{ fontSize: 12, color: '#64748b' }}>Settled</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Table Footer with Pagination ── */}
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

      {/* ── Disburse Payment Modal (#16) ── */}
      <Modal
        open={Boolean(actionPayment)}
        onClose={() => {
          if (!submittingPayment) {
            setActionPayment(null);
            setPayAmountInput('');
            setPayRemarksInput('');
          }
        }}
        title="Record Payment Disbursement"
        subtitle={actionPayment ? `Vendor: ${actionPayment.vendor} · Balance Due: ${fmtCurrency(actionPayment.balanceAmount)}` : undefined}
      >
        <form onSubmit={handlePaymentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: '#334155' }}>
              Disbursement Amount (₹) <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              type="number"
              required
              step="any"
              min="1"
              max={actionPayment?.balanceAmount}
              value={payAmountInput}
              onChange={(e) => setPayAmountInput(e.target.value)}
              className="ax-form-control"
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: 13,
                outline: 'none',
              }}
            />
            {actionPayment && (
              <span style={{ fontSize: 11.5, color: '#64748b', marginTop: 4, display: 'block' }}>
                Remaining Balance: <strong>{fmtCurrency(actionPayment.balanceAmount)}</strong>
              </span>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: '#334155' }}>
              Payment Date <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              type="date"
              required
              value={payDateInput}
              onChange={(e) => setPayDateInput(e.target.value)}
              className="ax-form-control"
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: 13,
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: '#334155' }}>
              Payment Remarks / UTR Reference
            </label>
            <textarea
              rows={3}
              value={payRemarksInput}
              onChange={(e) => setPayRemarksInput(e.target.value)}
              placeholder="Enter transaction reference, RTGS/NEFT UTR, or bank disbursement notes..."
              className="ax-form-control"
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: 13,
                resize: 'vertical',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <button
              type="button"
              disabled={submittingPayment}
              onClick={() => {
                setActionPayment(null);
                setPayAmountInput('');
                setPayRemarksInput('');
              }}
              className="ax-btn ax-btn--secondary"
              style={{ padding: '8px 16px', fontSize: 13, borderRadius: 8 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingPayment}
              className="ax-btn ax-btn--primary"
              style={{
                padding: '8px 20px',
                fontSize: 13,
                borderRadius: 8,
                background: '#2559bf',
                color: '#fff',
                fontWeight: 600,
                border: 'none',
                cursor: submittingPayment ? 'not-allowed' : 'pointer',
              }}
            >
              {submittingPayment ? 'Recording...' : 'Authorize Disbursement'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Installment History Modal ── */}
      <Modal
        open={Boolean(selectedInstallmentsModal)}
        onClose={() => setSelectedInstallmentsModal(null)}
        title={`Payment History · Claim #${selectedInstallmentsModal?.id}`}
        subtitle={`Vendor: ${selectedInstallmentsModal?.vendor} · Total Claim: ${fmtCurrency(selectedInstallmentsModal?.amount)}`}
        maxWidth={640}
      >
        <div style={{ maxHeight: 350, overflowY: 'auto' }}>
          <table className="ax-table" style={{ width: '100%', fontSize: 12.5, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '8px 12px' }}>Tranche</th>
                <th style={{ padding: '8px 12px' }}>Date</th>
                <th style={{ padding: '8px 12px', textAlign: 'right' }}>Amount Paid</th>
                <th style={{ padding: '8px 12px', textAlign: 'right' }}>Balance Remaining</th>
                <th style={{ padding: '8px 12px' }}>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {(selectedInstallmentsModal?.allpayment || []).map((inst, i) => (
                <tr key={inst.id || i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 600 }}>Tranche #{i + 1}</td>
                  <td style={{ padding: '8px 12px' }}>{inst.date || inst.created_at || '—'}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#059669' }}>{fmtCurrency(inst.amount)}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: '#dc2626' }}>{fmtCurrency(inst.balance)}</td>
                  <td style={{ padding: '8px 12px', color: '#64748b' }}>{inst.pay_remarks || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>

      {/* ── Associated Sites Modal ── */}
      <Modal
        open={Boolean(selectedSitesModal)}
        onClose={() => setSelectedSitesModal(null)}
        title={`Claim #${selectedSitesModal?.id} Sites`}
        subtitle={`Vendor: ${selectedSitesModal?.vendor} · ${selectedSitesModal?.sites.length || 0} Sites`}
        maxWidth={600}
      >
        <div style={{ maxHeight: 350, overflowY: 'auto' }}>
          <table className="ax-table" style={{ width: '100%', fontSize: 12.5, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '8px 12px' }}>#</th>
                <th style={{ padding: '8px 12px' }}>Site ID</th>
                <th style={{ padding: '8px 12px' }}>Farmer / Applicant Name</th>
              </tr>
            </thead>
            <tbody>
              {(selectedSitesModal?.sites || []).map((s, i) => (
                <tr key={s.id || i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 600 }}>{i + 1}</td>
                  <td style={{ padding: '8px 12px', fontFamily: 'monospace' }}>#{s.id}</td>
                  <td style={{ padding: '8px 12px', fontWeight: 600 }}>{s.farmer_name || (s as any).f_farmer_name || `Farmer #${s.id}`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>

      {/* ── Media Lightbox Modal ── */}
      {lightbox && (
        <LightboxModal
          open={Boolean(lightbox)}
          onClose={() => setLightbox(null)}
          url={lightbox.url}
          title={lightbox.title}
        />
      )}
    </div>
  );
}

export default ViewSwpPayment;
