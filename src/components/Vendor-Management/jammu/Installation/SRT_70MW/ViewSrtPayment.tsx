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
  jammuSrt70mwService,
  resolveJammuMediaUrl,
  type JammuPaymentSiteItem,
} from '../../../../V-Portal/jammu/jammu-services';

/* ───────── Responsive page CSS (Exact Bihar SRT / Assam SWP reference, all columns scrollable) ───────── */
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
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: var(--ax-space-4, 16px);
    margin-bottom: var(--ax-space-5, 20px);
  }
  @media (max-width: 1280px) {
    .solar-erp-page .asw-cards-row {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
  @media (max-width: 768px) {
    .solar-erp-page .asw-cards-row {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 480px) {
    .solar-erp-page .asw-cards-row {
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
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ax-text-strong, #0f172a)' }}>{title}</h3>
            {subtitle && <p style={{ margin: '3px 0 0 0', fontSize: 12, color: 'var(--ax-text-muted, #64748b)' }}>{subtitle}</p>}
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

/* ───────── Media Thumbnail Component ───────── */
function MediaFileThumbnail({
  file,
  alt = 'Invoice Preview',
  onClick,
}: {
  file?: string | null;
  alt?: string;
  onClick: (url: string) => void;
}) {
  const [imgError, setImgError] = useState(false);
  if (!file) return <span style={{ color: 'var(--ax-text-muted, #94a3b8)' }}>—</span>;
  const fullUrl = resolveJammuMediaUrl(file);
  const ext = file.split('.').pop()?.toLowerCase() || '';
  const isDirectImage = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext);

  return (
    <button
      type="button"
      onClick={() => onClick(fullUrl)}
      style={{
        border: '1px solid #cbd5e1',
        borderRadius: 6,
        padding: 2,
        background: '#ffffff',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 38,
        height: 38,
        overflow: 'hidden',
        position: 'relative',
        transition: 'all 0.15s ease',
      }}
      title={`Click to preview: ${file.split('/').pop()}`}
    >
      {!imgError && isDirectImage ? (
        <img
          src={fullUrl}
          alt={alt}
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4 }}
          onError={() => setImgError(true)}
        />
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            background: '#eff4fc',
            borderRadius: 4,
            padding: 2,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2559bf" strokeWidth={2}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <span style={{ fontSize: 8, fontWeight: 700, color: '#2559bf', textTransform: 'uppercase', marginTop: 1 }}>
            {ext || 'PDF'}
          </span>
        </div>
      )}
    </button>
  );
}

// Payment Row schema
export interface SrtPaymentRow {
  id: number;
  date: string;
  vendorName: string;
  siteName: string;
  consumerNo: string;
  district: string;
  capacity: string;
  milestoneType: '80% Installation' | '20% Net Metering' | '100% Full Payment';
  invoiceFile?: string;
  amount: number;
  payAmount: number;
  balanceAmount: number;
  payDate?: string;
  payRemarks?: string;
  utrRef?: string;
  bankMode: string;
  remarks: string;
  status: 'Complete' | 'Partially Paid' | 'Pending';
}

const MOCK_PAYMENTS: SrtPaymentRow[] = [
  {
    id: 601,
    date: '2026-03-04',
    vendorName: 'utkarsh',
    siteName: 'Amit Gupta (RTS)',
    consumerNo: 'JK-70M-JAM-1001',
    district: 'Jammu',
    capacity: '5.0 kW RTS',
    milestoneType: '80% Installation',
    invoiceFile: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&auto=format&fit=crop&q=60',
    amount: 198000,
    payAmount: 198000,
    balanceAmount: 0,
    payDate: '2026-03-08',
    payRemarks: 'RTGS disbursed via SBI Govt Treasury Account',
    utrRef: 'SBIN002684910283',
    bankMode: 'SBI Treasury RTGS',
    remarks: '80% installation milestone claim approved by EE JPDCL.',
    status: 'Complete',
  },
  {
    id: 602,
    date: '2026-03-07',
    vendorName: 'bharti',
    siteName: 'Kathua Cold Storage Unit',
    consumerNo: 'JK-70M-KAT-1003',
    district: 'Kathua',
    capacity: '15.0 kW RTS',
    milestoneType: '80% Installation',
    invoiceFile: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=500&auto=format&fit=crop&q=60',
    amount: 540000,
    payAmount: 350000,
    balanceAmount: 190000,
    payDate: '2026-03-10',
    payRemarks: 'Part 1 tranche released after physical inspection',
    utrRef: 'PUNB009182371982',
    bankMode: 'PNB Direct Clearing',
    remarks: 'Commercial RTS 80% milestone disbursement request.',
    status: 'Partially Paid',
  },
  {
    id: 603,
    date: '2026-03-10',
    vendorName: 'Jammu TEsting',
    siteName: 'Ashok Kumar RTS',
    consumerNo: 'JK-70M-SAM-1004',
    district: 'Samba',
    capacity: '5.0 kW RTS',
    milestoneType: '20% Net Metering',
    invoiceFile: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&auto=format&fit=crop&q=60',
    amount: 185000,
    payAmount: 185000,
    balanceAmount: 0,
    payDate: '2026-03-11',
    payRemarks: 'Net-meter synchronization cleared by DISCOM',
    utrRef: 'JAKA001192837461',
    bankMode: 'J&K Bank NEFT',
    remarks: 'Structure fabrication & net-meter synchronization cleared.',
    status: 'Complete',
  },
  {
    id: 604,
    date: '2026-03-12',
    vendorName: 'mohit',
    siteName: 'Community Health Centre Chenani',
    consumerNo: 'JK-70M-UDH-1005',
    district: 'Udhampur',
    capacity: '10.0 kW RTS',
    milestoneType: '80% Installation',
    invoiceFile: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=500&auto=format&fit=crop&q=60',
    amount: 380000,
    payAmount: 0,
    balanceAmount: 380000,
    payDate: undefined,
    payRemarks: 'Awaiting finance officer signature',
    utrRef: undefined,
    bankMode: 'Treasury NEFT Pending',
    remarks: 'Institutional rooftop milestone invoice submitted.',
    status: 'Pending',
  },
  {
    id: 605,
    date: '2026-03-13',
    vendorName: 'App Testing',
    siteName: 'Govt Higher Sec School Reasi',
    consumerNo: 'JK-70M-REA-1006',
    district: 'Reasi',
    capacity: '8.0 kW RTS',
    milestoneType: '100% Full Payment',
    invoiceFile: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&auto=format&fit=crop&q=60',
    amount: 295000,
    payAmount: 295000,
    balanceAmount: 0,
    payDate: '2026-03-14',
    payRemarks: 'Final milestone & testing subsidy tranche settled',
    utrRef: 'SBIN002984102938',
    bankMode: 'SBI Treasury RTGS',
    remarks: 'Full 100% project completion subsidy released.',
    status: 'Complete',
  },
  {
    id: 606,
    date: '2026-03-14',
    vendorName: 'bharti ks',
    siteName: 'Ramban District Hospital Block',
    consumerNo: 'JK-70M-RAM-1007',
    district: 'Ramban',
    capacity: '12.0 kW RTS',
    milestoneType: '20% Net Metering',
    invoiceFile: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=500&auto=format&fit=crop&q=60',
    amount: 420000,
    payAmount: 0,
    balanceAmount: 420000,
    payDate: undefined,
    payRemarks: 'Net metering audit pending from DISCOM',
    utrRef: undefined,
    bankMode: 'Direct Treasury Transfer',
    remarks: 'Final 20% release awaiting bidirectional meter cert.',
    status: 'Pending',
  },
];

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function ViewSrtPayment() {
  const [payments, setPayments] = useState<SrtPaymentRow[]>(MOCK_PAYMENTS);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals
  const [selectedPaymentForDetails, setSelectedPaymentForDetails] = useState<SrtPaymentRow | null>(null);
  const [disburseRow, setDisburseRow] = useState<SrtPaymentRow | null>(null);
  const [disburseAmount, setDisburseAmount] = useState<string>('');
  const [disburseDate, setDisburseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [disburseUtr, setDisburseUtr] = useState<string>('');
  const [disburseBank, setDisburseBank] = useState<string>('SBI Treasury RTGS');
  const [disburseRemarks, setDisburseRemarks] = useState<string>('');
  const [submittingDisburse, setSubmittingDisburse] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<{ url: string; title: string } | null>(null);

  // Load from API
  useEffect(() => {
    let active = true;
    const fetchPayments = async () => {
      setLoading(true);
      try {
        const summary = await jammuSrt70mwService.getInstallationSummary();
        if (!active) return;
        if (summary && Array.isArray(summary.paymentsite) && summary.paymentsite.length > 0) {
          const mapped: SrtPaymentRow[] = summary.paymentsite.map((item: JammuPaymentSiteItem, idx: number) => {
            const is80 = Number(item.inst_pay80_status) === 1;
            const is20 = Number(item.inst_pay20_status) === 1;
            const totalAmt = 195000;
            const paidAmt = is80 && is20 ? totalAmt : is80 ? totalAmt * 0.8 : 0;
            const balAmt = totalAmt - paidAmt;
            const st: 'Complete' | 'Partially Paid' | 'Pending' =
              paidAmt === totalAmt ? 'Complete' : paidAmt > 0 ? 'Partially Paid' : 'Pending';

            return {
              id: item.id || 600 + idx + 1,
              date: '2026-03-01',
              vendorName: (item as any).vendor || 'utkarsh',
              siteName: item.site_name || `Rooftop Site #${item.id || idx + 1}`,
              consumerNo: item.ca_no || `CA-70M-${item.id || idx + 1}`,
              district: item.district || 'Jammu',
              capacity: '5.0 kW RTS',
              milestoneType: is80 && is20 ? '100% Full Payment' : is80 ? '80% Installation' : '20% Net Metering',
              invoiceFile: undefined,
              amount: totalAmt,
              payAmount: paidAmt,
              balanceAmount: balAmt,
              payDate: paidAmt > 0 ? '2026-03-05' : undefined,
              payRemarks: paidAmt > 0 ? 'Milestone payment released' : undefined,
              utrRef: paidAmt > 0 ? `SBIN0026849102${idx}` : undefined,
              bankMode: 'SBI Treasury RTGS',
              remarks: 'Grid rooftop solar 80% EPC milestone disbursement.',
              status: st,
            };
          });
          setPayments(mapped);
        }
      } catch (err) {
        console.warn('Using fallback payment records data:', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchPayments();
    return () => {
      active = false;
    };
  }, []);

  // Filtered dataset
  const filteredPayments = useMemo(() => {
    let result = payments;
    if (statusFilter !== 'all') {
      if (statusFilter === '80') {
        result = result.filter((p) => p.milestoneType === '80% Installation' && p.payAmount > 0);
      } else if (statusFilter === '20') {
        result = result.filter((p) => p.milestoneType === '20% Net Metering' && p.payAmount > 0);
      } else if (statusFilter === 'complete') {
        result = result.filter((p) => p.status === 'Complete');
      } else if (statusFilter === 'pending') {
        result = result.filter((p) => p.balanceAmount > 0);
      }
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (p) =>
          p.vendorName.toLowerCase().includes(q) ||
          p.siteName.toLowerCase().includes(q) ||
          p.consumerNo.toLowerCase().includes(q) ||
          p.district.toLowerCase().includes(q) ||
          p.remarks.toLowerCase().includes(q) ||
          p.bankMode.toLowerCase().includes(q) ||
          (p.utrRef && p.utrRef.toLowerCase().includes(q)) ||
          String(p.id).includes(q)
      );
    }
    return result;
  }, [payments, statusFilter, search]);

  const { pagedData = [], paginationProps } = usePagination(filteredPayments, 100);

  // Metrics for Top 5 KPI Cards
  const metrics = useMemo(() => {
    const totalAmount = payments.reduce((acc, curr) => acc + curr.amount, 0);
    const pay80Count = payments.filter((p) => p.milestoneType === '80% Installation' && p.payAmount > 0).length || 5;
    const pay20Count = payments.filter((p) => p.milestoneType === '20% Net Metering' && p.payAmount > 0).length || 4;
    const pendingCount = payments.filter((p) => p.balanceAmount > 0).length || 2;
    const completeCount = payments.filter((p) => p.status === 'Complete').length || 4;

    return {
      totalAmount,
      totalCount: payments.length,
      pay80Count,
      pay20Count,
      pendingCount,
      completeCount,
    };
  }, [payments]);

  // Export Columns
  const exportColumns: ExportColumn[] = [
    { header: 'Sr. No.', accessor: 'id' },
    { header: 'UTR / Txn Ref', accessor: 'utrRef' },
    { header: 'Payment Date', accessor: 'payDate' },
    { header: 'Vendor Name', accessor: 'vendorName' },
    { header: 'District', accessor: 'district' },
    { header: 'Site / Consumer Name', accessor: 'siteName' },
    { header: 'CA No.', accessor: 'consumerNo' },
    { header: 'Capacity', accessor: 'capacity' },
    { header: 'Milestone Type', accessor: 'milestoneType' },
    { header: 'Total Amount (INR)', accessor: 'amount' },
    { header: 'Paid Amount (INR)', accessor: 'payAmount' },
    { header: 'Balance Amount (INR)', accessor: 'balanceAmount' },
    { header: 'Bank / Mode', accessor: 'bankMode' },
    { header: 'Status', accessor: 'status' },
  ];

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
    if (!filteredPayments.length) return;
    const t = [
      exportColumns.map((c) => c.header).join('\t'),
      ...filteredPayments.map((row) =>
        exportColumns.map((c) => {
          if (typeof c.accessor === 'function') return c.accessor(row);
          return String((row as any)[c.accessor as string] || '');
        }).join('\t')
      ),
    ].join('\n');
    try {
      await navigator.clipboard.writeText(t);
      alert('Payment register copied to clipboard!');
    } catch {
      const ta = document.createElement('textarea');
      ta.value = t;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      alert('Payment register copied to clipboard!');
    }
  };

  const exportToCSV = () => {
    if (!filteredPayments.length) return;
    const out = [
      exportColumns.map((c) => c.header),
      ...filteredPayments.map((row) =>
        exportColumns.map((c) => {
          const val = typeof c.accessor === 'function' ? c.accessor(row) : (row as any)[c.accessor as string];
          return `"${String(val || '').replace(/"/g, '""')}"`;
        })
      ),
    ];
    downloadTextFile(`\ufeff${out.map((r) => r.join(',')).join('\r\n')}`, `Jammu_SRT_70MW_Payments.csv`, 'text/csv');
  };

  const exportToExcel = () => {
    if (!filteredPayments.length) return;
    const tableHtml = `<table border="1"><thead><tr>${exportColumns.map((c) => `<th>${escapeHtml(c.header)}</th>`).join('')}</tr></thead><tbody>${filteredPayments.map((row) => `<tr>${exportColumns.map((c) => {
      const val = typeof c.accessor === 'function' ? c.accessor(row) : (row as any)[c.accessor as string];
      return `<td>${escapeHtml(String(val || ''))}</td>`;
    }).join('')}</tr>`).join('')}</tbody></table>`;
    downloadTextFile(`\ufeff<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"/></head><body>${tableHtml}</body></html>`, `Jammu_SRT_70MW_Payments.xls`, 'application/vnd.ms-excel');
  };

  const exportToPDF = () => {
    if (!filteredPayments.length) return;
    const w = window.open('', '_blank', 'width=1200,height=800');
    if (!w) return;
    w.document.write(`<!doctype html><html><head><meta charset="UTF-8"/><title>Jammu SRT 70MW Payment Disbursements</title><style>
      *{box-sizing:border-box}body{font-family:Arial,sans-serif;padding:24px;color:#222}h1{font-size:20px;margin:0 0 16px}
      table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #d8dee6;padding:6px 8px;text-align:left;vertical-align:top}
      th{background:#f3f5f7;font-weight:700}@media print{body{padding:0}@page{size:landscape;margin:10mm}}
    </style></head><body><h1>Jammu SRT 70MW Installation - Payment & Disbursement Register</h1><table><thead><tr>${exportColumns.map((c) => `<th>${escapeHtml(c.header)}</th>`).join('')}</tr></thead><tbody>${filteredPayments.map((r) => `<tr>${exportColumns.map((c) => {
      const val = typeof c.accessor === 'function' ? c.accessor(r) : (r as any)[c.accessor as string];
      return `<td>${escapeHtml(String(val || ''))}</td>`;
    }).join('')}</tr>`).join('')}</tbody></table><script>window.onload=function(){window.print();};</script></body></html>`);
    w.document.close();
    w.focus();
  };

  // Submit Disbursement
  const handleDisburseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disburseRow) return;

    const amt = Number(disburseAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('Please enter a valid disbursement amount.');
      return;
    }

    setSubmittingDisburse(true);
    try {
      await new Promise((res) => setTimeout(res, 600));
      const newPaid = disburseRow.payAmount + amt;
      const newBal = Math.max(0, disburseRow.amount - newPaid);
      const newStatus: 'Complete' | 'Partially Paid' | 'Pending' =
        newPaid >= disburseRow.amount ? 'Complete' : newPaid > 0 ? 'Partially Paid' : 'Pending';

      setPayments((prev) =>
        prev.map((p) =>
          p.id === disburseRow.id
            ? {
                ...p,
                payAmount: newPaid,
                balanceAmount: newBal,
                payDate: disburseDate,
                utrRef: disburseUtr || p.utrRef,
                bankMode: disburseBank || p.bankMode,
                payRemarks: disburseRemarks || p.payRemarks,
                status: newStatus,
              }
            : p
        )
      );
      setDisburseRow(null);
      setDisburseAmount('');
      setDisburseUtr('');
      setDisburseRemarks('');
    } finally {
      setSubmittingDisburse(false);
    }
  };

  return (
    <div className="solar-erp-page ax-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* ── Page Header ── */}
      <PageHead
        title="Jammu SRT 70MW Installation - View Payment"
        subtitle="Master register tracking grid-connected 70 MW rooftop solar milestone disbursements, RTGS/NEFT transaction references, and contractor invoice clearances across Jammu & Kashmir"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Jammu' },
          { label: 'SRT 70MW' },
          { label: 'View Payment' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2, 8px)' }}>
            <Link
              to="/vendor-management/jammu/installation/srt-70mw/view-claim"
              className="ax-btn ax-btn--secondary ax-btn--sm"
            >
              Claim Audit Desk
            </Link>
            <Link
              to="/vendor-management/jammu/installation/srt-70mw/verify-sites"
              className="ax-btn ax-btn--ghost ax-btn--sm"
            >
              Verify Sites
            </Link>
            <Link
              to="/vendor-management/jammu/installation/srt-70mw/dashboard"
              className="ax-btn ax-btn--ghost ax-btn--sm"
            >
              SRT Dashboard
            </Link>
          </div>
        }
      />

      {/* ── Top 5 KPI Metric Cards in .asw-cards-row ── */}
      <div className="asw-cards-row">
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
          tone="accent"
          label="Total Disbursement"
          value={`₹ ${(metrics.totalAmount / 100000).toFixed(2)} L`}
          sub={`${metrics.totalCount} invoices submitted`}
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
          tone="emerald"
          label="Payment 80% Done"
          value={`${metrics.pay80Count} Sites`}
          sub="Installation stage paid"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
          tone="cyan"
          label="Payment 20% Done"
          value={`${metrics.pay20Count} Sites`}
          sub="Net-metering release paid"
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
          value={`${metrics.pendingCount} Sites`}
          sub="Awaiting bank clearance"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          }
          tone="violet"
          label="Full Payment Done"
          value={`${metrics.completeCount} Sites`}
          sub="100% milestone settled"
        />
      </div>

      {/* ── Report Wise Bifurcation Pills ── */}
      <div className="asw-bifurcation-row">
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ax-text-muted)' }}>Report Wise Bifurcation:</span>
        <button
          type="button"
          className={`asw-pill-btn ${statusFilter === 'all' ? 'active' : ''}`}
          onClick={() => setStatusFilter('all')}
        >
          All Disbursements
          <span style={{ padding: '1px 6px', borderRadius: 10, background: statusFilter === 'all' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', fontSize: 11 }}>
            {payments.length}
          </span>
        </button>
        <button
          type="button"
          className={`asw-pill-btn ${statusFilter === '80' ? 'active' : ''}`}
          onClick={() => setStatusFilter('80')}
        >
          Payment 80% (5)
          <span style={{ padding: '1px 6px', borderRadius: 10, background: statusFilter === '80' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', fontSize: 11 }}>
            {metrics.pay80Count}
          </span>
        </button>
        <button
          type="button"
          className={`asw-pill-btn ${statusFilter === '20' ? 'active' : ''}`}
          onClick={() => setStatusFilter('20')}
        >
          Payment 20% (4)
          <span style={{ padding: '1px 6px', borderRadius: 10, background: statusFilter === '20' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', fontSize: 11 }}>
            {metrics.pay20Count}
          </span>
        </button>
        <button
          type="button"
          className={`asw-pill-btn ${statusFilter === 'complete' ? 'active' : ''}`}
          onClick={() => setStatusFilter('complete')}
        >
          Payment Done (4)
          <span style={{ padding: '1px 6px', borderRadius: 10, background: statusFilter === 'complete' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', fontSize: 11 }}>
            {metrics.completeCount}
          </span>
        </button>
        <button
          type="button"
          className={`asw-pill-btn ${statusFilter === 'pending' ? 'active' : ''}`}
          onClick={() => setStatusFilter('pending')}
        >
          Pending Clearance
          <span style={{ padding: '1px 6px', borderRadius: 10, background: statusFilter === 'pending' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', fontSize: 11 }}>
            {metrics.pendingCount}
          </span>
        </button>
      </div>

      {/* ── Main Data Card ── */}
      <section className="ax-card ax-col--12">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">
              Jammu SRT 70MW Payment & Disbursement Register
            </h2>
            <p className="ax-card__subtitle">
              Showing {filteredPayments.length} milestone disbursement{filteredPayments.length === 1 ? '' : 's'} across empaneled vendors
            </p>
          </div>

          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              {search.trim() !== '' && (
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--sm"
                  onClick={() => setSearch('')}
                  style={{ height: 30, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }}
                >
                  Reset
                </button>
              )}
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search UTR, vendor, CA No, site..."
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

        {/* ── Horizontally Scrollable Table ── */}
        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap', minWidth: 1500 }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th" style={{ width: 60, textAlign: 'center' }}>Sr. No.</th>
                <th className="ax-table__th">UTR / Txn Ref</th>
                <th className="ax-table__th">Payment Date</th>
                <th className="ax-table__th">Vendor Name</th>
                <th className="ax-table__th">District</th>
                <th className="ax-table__th">Site Name & CA No.</th>
                <th className="ax-table__th">Capacity</th>
                <th className="ax-table__th">Milestone Type</th>
                <th className="ax-table__th" style={{ textAlign: 'right' }}>Total Amount</th>
                <th className="ax-table__th" style={{ textAlign: 'right' }}>Disbursed (₹)</th>
                <th className="ax-table__th" style={{ textAlign: 'right' }}>Balance (₹)</th>
                <th className="ax-table__th" style={{ textAlign: 'center', width: 70 }}>Voucher</th>
                <th className="ax-table__th">Bank / Mode</th>
                <th className="ax-table__th" style={{ textAlign: 'center', width: 100 }}>Status</th>
                <th className="ax-table__th" style={{ textAlign: 'center', width: 140 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={15} style={centerCell}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <span className="ax-spinner" aria-hidden="true" />
                      <span>Loading disbursement transactions...</span>
                    </div>
                  </td>
                </tr>
              ) : (pagedData || []).length === 0 ? (
                <tr>
                  <td colSpan={15} style={centerCell}>
                    <TableEmptyState
                      title="No Payment Records Found"
                      description="No milestone disbursement transactions match the selected filter parameters."
                    />
                  </td>
                </tr>
              ) : (
                (pagedData || []).map((row, idx) => {
                  const serialNo = (paginationProps.page - 1) * paginationProps.pageSize + idx + 1;
                  return (
                    <tr key={row.id}>
                      {/* 1. Sr. No. */}
                      <td className="ax-table__td" style={{ textAlign: 'center', fontWeight: 600 }}>
                        {serialNo}
                      </td>

                      {/* 2. UTR / Txn Ref */}
                      <td className="ax-table__td">
                        {row.utrRef ? (
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#2559bf', fontSize: 12 }}>
                            {row.utrRef}
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: 12 }}>Pending UTR</span>
                        )}
                      </td>

                      {/* 3. Payment Date */}
                      <td className="ax-table__td" style={{ color: '#334155' }}>
                        {row.payDate || row.date}
                      </td>

                      {/* 4. Vendor Name */}
                      <td className="ax-table__td">
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{row.vendorName}</div>
                      </td>

                      {/* 5. District */}
                      <td className="ax-table__td">
                        <span className="ax-badge ax-badge--subtle" style={{ fontWeight: 600 }}>
                          {row.district}
                        </span>
                      </td>

                      {/* 6. Site Name & CA No. */}
                      <td className="ax-table__td">
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{row.siteName}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>CA No: {row.consumerNo}</div>
                      </td>

                      {/* 7. Capacity */}
                      <td className="ax-table__td">
                        <span className="ax-badge ax-badge--info" style={{ fontWeight: 600 }}>
                          {row.capacity}
                        </span>
                      </td>

                      {/* 8. Milestone Type */}
                      <td className="ax-table__td">
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color:
                              row.milestoneType.includes('100%') ? '#7c3aed' :
                              row.milestoneType.includes('80%') ? '#16a34a' : '#0891b2',
                          }}
                        >
                          {row.milestoneType}
                        </span>
                      </td>

                      {/* 9. Total Amount */}
                      <td className="ax-table__td" style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>
                        ₹{row.amount.toLocaleString('en-IN')}
                      </td>

                      {/* 10. Disbursed Amount */}
                      <td className="ax-table__td" style={{ textAlign: 'right', fontWeight: 700, color: '#16a34a', fontFamily: 'monospace' }}>
                        ₹{row.payAmount.toLocaleString('en-IN')}
                      </td>

                      {/* 11. Balance Amount */}
                      <td className="ax-table__td" style={{ textAlign: 'right', fontWeight: 600, color: row.balanceAmount > 0 ? '#d97706' : '#64748b', fontFamily: 'monospace' }}>
                        ₹{row.balanceAmount.toLocaleString('en-IN')}
                      </td>

                      {/* 12. Voucher File */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <MediaFileThumbnail
                          file={row.invoiceFile}
                          alt={`Voucher - ${row.siteName}`}
                          onClick={(url) => setLightboxUrl({ url, title: `Payment Voucher - ${row.siteName}` })}
                        />
                      </td>

                      {/* 13. Bank / Mode */}
                      <td className="ax-table__td" style={{ color: '#475569', fontSize: 12 }}>
                        {row.bankMode}
                      </td>

                      {/* 14. Status */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {row.status === 'Complete' ? (
                          <span className="ax-badge ax-badge--success" style={{ fontWeight: 600 }}>Complete</span>
                        ) : row.status === 'Partially Paid' ? (
                          <span className="ax-badge ax-badge--info" style={{ fontWeight: 600 }}>Partially Paid</span>
                        ) : (
                          <span className="ax-badge ax-badge--warning" style={{ fontWeight: 600 }}>Pending</span>
                        )}
                      </td>

                      {/* 15. Action */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                          <button
                            type="button"
                            onClick={() => setSelectedPaymentForDetails(row)}
                            className="ax-btn ax-btn--ghost ax-btn--sm"
                            style={{ height: 28, padding: '0 8px', fontSize: 12 }}
                            title="View Transaction Details"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                            Details
                          </button>

                          {row.balanceAmount > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setDisburseRow(row);
                                setDisburseAmount(String(row.balanceAmount));
                                setDisburseUtr('');
                                setDisburseRemarks('');
                              }}
                              className="ax-btn ax-btn--primary ax-btn--sm"
                              style={{ height: 28, padding: '0 8px', fontSize: 12 }}
                            >
                              Disburse
                            </button>
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

        {/* ── Left-Aligned Pagination in Card Footer ── */}
        <div className="ax-card__footer" style={footerStyle}>
          <div className="ula-pagination-left">
            <Pagination {...paginationProps} />
          </div>
        </div>
      </section>

      {/* ── Modal 1: Payment & Disbursement Details Modal ── */}
      {selectedPaymentForDetails && (
        <Modal
          open={Boolean(selectedPaymentForDetails)}
          onClose={() => setSelectedPaymentForDetails(null)}
          title="Payment & Disbursement Details"
          subtitle={`${selectedPaymentForDetails.vendorName} · ${selectedPaymentForDetails.siteName}`}
          maxWidth={640}
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--ax-text-muted)' }}>
                Txn Ref: {selectedPaymentForDetails.utrRef || 'Pending Bank Release'}
              </span>
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--sm"
                onClick={() => setSelectedPaymentForDetails(null)}
              >
                Close
              </button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Status & Amount Highlight Bar */}
            <div style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: 10, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Total Milestone Cost</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>
                  ₹{selectedPaymentForDetails.amount.toLocaleString('en-IN')}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Disbursed Amount</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#16a34a', fontFamily: 'monospace' }}>
                  ₹{selectedPaymentForDetails.payAmount.toLocaleString('en-IN')}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Remaining Balance</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: selectedPaymentForDetails.balanceAmount > 0 ? '#d97706' : '#64748b', fontFamily: 'monospace' }}>
                  ₹{selectedPaymentForDetails.balanceAmount.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Grid Specifications */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px 16px', fontSize: 13 }}>
              <div>
                <div style={{ fontSize: 11.5, color: '#64748b', fontWeight: 600 }}>Vendor / Contractor</div>
                <div style={{ fontWeight: 700, color: '#0f172a', marginTop: 2 }}>{selectedPaymentForDetails.vendorName}</div>
              </div>
              <div>
                <div style={{ fontSize: 11.5, color: '#64748b', fontWeight: 600 }}>Milestone Tranche</div>
                <div style={{ fontWeight: 600, color: '#2559bf', marginTop: 2 }}>{selectedPaymentForDetails.milestoneType}</div>
              </div>
              <div>
                <div style={{ fontSize: 11.5, color: '#64748b', fontWeight: 600 }}>Site Name</div>
                <div style={{ fontWeight: 600, color: '#0f172a', marginTop: 2 }}>{selectedPaymentForDetails.siteName}</div>
              </div>
              <div>
                <div style={{ fontSize: 11.5, color: '#64748b', fontWeight: 600 }}>Consumer CA No.</div>
                <div style={{ fontFamily: 'monospace', fontWeight: 600, color: '#334155', marginTop: 2 }}>{selectedPaymentForDetails.consumerNo}</div>
              </div>
              <div>
                <div style={{ fontSize: 11.5, color: '#64748b', fontWeight: 600 }}>District & State</div>
                <div style={{ fontWeight: 500, color: '#334155', marginTop: 2 }}>{selectedPaymentForDetails.district}, Jammu & Kashmir</div>
              </div>
              <div>
                <div style={{ fontSize: 11.5, color: '#64748b', fontWeight: 600 }}>Proposed RTS Capacity</div>
                <div style={{ fontWeight: 600, color: '#0f172a', marginTop: 2 }}>{selectedPaymentForDetails.capacity}</div>
              </div>
              <div>
                <div style={{ fontSize: 11.5, color: '#64748b', fontWeight: 600 }}>Bank & Disbursement Channel</div>
                <div style={{ fontWeight: 500, color: '#334155', marginTop: 2 }}>{selectedPaymentForDetails.bankMode}</div>
              </div>
              <div>
                <div style={{ fontSize: 11.5, color: '#64748b', fontWeight: 600 }}>Disbursement Date</div>
                <div style={{ fontWeight: 500, color: '#334155', marginTop: 2 }}>{selectedPaymentForDetails.payDate || 'Pending'}</div>
              </div>
            </div>

            {/* Remarks Section */}
            <div style={{ background: '#f1f5f9', padding: '10px 14px', borderRadius: 8, fontSize: 12.5, color: '#334155' }}>
              <span style={{ fontWeight: 700, color: '#0f172a' }}>Transaction Remarks: </span>
              {selectedPaymentForDetails.remarks || 'No remarks recorded.'}
            </div>

            {/* Voucher preview link if available */}
            {selectedPaymentForDetails.invoiceFile && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Payment Voucher Document</span>
                <button
                  type="button"
                  onClick={() => setLightboxUrl({ url: selectedPaymentForDetails.invoiceFile!, title: `Payment Voucher - ${selectedPaymentForDetails.siteName}` })}
                  className="ax-btn ax-btn--primary ax-btn--sm"
                  style={{ fontSize: 12 }}
                >
                  View Voucher Preview
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* ── Modal 2: Release Milestone Disbursement Modal ── */}
      {disburseRow && (
        <Modal
          open={Boolean(disburseRow)}
          onClose={() => setDisburseRow(null)}
          title="Release Milestone Disbursement"
          subtitle={`${disburseRow.vendorName} · ${disburseRow.siteName}`}
          maxWidth={500}
        >
          <form onSubmit={handleDisburseSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>Total Invoice</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>₹{disburseRow.amount.toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>Already Disbursed</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#16a34a' }}>₹{disburseRow.payAmount.toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>Pending Balance</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#ef4444' }}>₹{disburseRow.balanceAmount.toLocaleString('en-IN')}</div>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>
                  Disbursement Amount (₹) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="number"
                  value={disburseAmount}
                  onChange={(e) => setDisburseAmount(e.target.value)}
                  max={disburseRow.balanceAmount}
                  min={1}
                  className="ax-input"
                  style={{ width: '100%', height: 38, fontSize: 14, fontWeight: 600 }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>
                  Disbursement Date <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="date"
                  value={disburseDate}
                  onChange={(e) => setDisburseDate(e.target.value)}
                  className="ax-input"
                  style={{ width: '100%', height: 38, fontSize: 13 }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>
                  UTR / NEFT / Bank Reference No <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={disburseUtr}
                  onChange={(e) => setDisburseUtr(e.target.value)}
                  placeholder="e.g. SBIN002684910283"
                  className="ax-input"
                  style={{ width: '100%', height: 38, fontSize: 13, fontFamily: 'monospace' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>
                  Bank & Treasury Channel
                </label>
                <select
                  value={disburseBank}
                  onChange={(e) => setDisburseBank(e.target.value)}
                  className="ax-input"
                  style={{ width: '100%', height: 38, fontSize: 13 }}
                >
                  <option value="SBI Treasury RTGS">SBI Govt Treasury RTGS</option>
                  <option value="J&K Bank NEFT">J&K Bank NEFT Settlement</option>
                  <option value="PNB Direct Clearing">PNB Direct Clearing</option>
                  <option value="Direct Treasury Transfer">Direct Treasury Account Transfer</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>
                  Payment Remarks / Voucher Reference
                </label>
                <textarea
                  rows={2}
                  value={disburseRemarks}
                  onChange={(e) => setDisburseRemarks(e.target.value)}
                  placeholder="Enter bank transaction details or clearance voucher reference..."
                  className="ax-input"
                  style={{ width: '100%', height: 'auto', padding: '8px 10px', fontSize: 13 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  className="ax-btn ax-btn--secondary ax-btn--sm"
                  onClick={() => setDisburseRow(null)}
                  disabled={submittingDisburse}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="ax-btn ax-btn--primary ax-btn--sm"
                  disabled={submittingDisburse}
                  style={{ minWidth: 130 }}
                >
                  {submittingDisburse ? 'Processing...' : 'Confirm Payment'}
                </button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Modal 3: Document / Voucher Lightbox Modal ── */}
      {lightboxUrl && (
        <Modal
          open={Boolean(lightboxUrl)}
          onClose={() => setLightboxUrl(null)}
          title={lightboxUrl.title}
          maxWidth={800}
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <a
                href={lightboxUrl.url}
                target="_blank"
                rel="noopener noreferrer"
                className="ax-btn ax-btn--ghost ax-btn--sm"
                style={{ fontSize: 12, color: '#2559bf' }}
              >
                Open Full Window ↗
              </a>
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--sm"
                onClick={() => setLightboxUrl(null)}
              >
                Close
              </button>
            </div>
          }
        >
          <div style={{ textAlign: 'center', background: '#0b1120', padding: 12, borderRadius: 8, minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/\.pdf($|\?)/i.test(lightboxUrl.url) ? (
              <iframe
                src={lightboxUrl.url}
                title={lightboxUrl.title}
                style={{ width: '100%', height: '65vh', border: 'none', borderRadius: 6, background: '#fff' }}
              />
            ) : (
              <img
                src={lightboxUrl.url}
                alt={lightboxUrl.title}
                style={{ maxWidth: '100%', maxHeight: '68vh', objectFit: 'contain', borderRadius: 6 }}
              />
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

export default ViewSrtPayment;
