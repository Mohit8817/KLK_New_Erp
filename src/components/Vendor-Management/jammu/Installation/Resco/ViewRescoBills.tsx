import { useState, useMemo, useEffect, useCallback, useRef, type ReactNode } from 'react';
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
  type RescoBillItem,
} from './jammuRescoAdminService';

<<<<<<< HEAD
/* ───────── Responsive page CSS (Exact Solar ERP / Jammu SRT 70MW reference) ───────── */
const PAGE_CSS = `
  .solar-erp-page {
    --asw-primary: var(--ax-accent, #2563eb);
    --asw-primary-rgb: var(--ax-accent-rgb, 37, 99, 235);
=======
/* ───────── Responsive page CSS (Exact Solar ERP reference, all columns scrollable) ───────── */
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
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7
  }
  .solar-erp-page .ax-card { min-width: 0; }
  .solar-erp-page .ax-card__footer { width: 100%; box-sizing: border-box; }
  .solar-erp-page .ula-pagination-left {
    width: 100%; display: flex; justify-content: flex-start; align-items: center; margin: 0; overflow-x: auto;
  }
  .solar-erp-page .ula-pagination-left > * { margin-left: 0 !important; margin-right: 0 !important; }

<<<<<<< HEAD
  .solar-erp-page .asw-cards-row {
=======
    .solar-erp-page .asw-cards-row {
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--ax-space-4, 16px);
    margin-bottom: var(--ax-space-5, 20px);
  }
<<<<<<< HEAD
  @media (max-width: 992px) {
=======
  @media (max-width: 1024px) {
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7
    .solar-erp-page .asw-cards-row {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
<<<<<<< HEAD
  @media (max-width: 520px) {
=======
  @media (max-width: 640px) {
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7
    .solar-erp-page .asw-cards-row {
      grid-template-columns: 1fr;
    }
  }
<<<<<<< HEAD

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

=======
  .solar-erp-page .asw-cards-row span svg {
    width: 15px !important;
    height: 15px !important;
    display: block !important;
  }
  /* Compact table action buttons */
  .solar-erp-page .ax-table .ax-btn--sm,
  .solar-erp-page .ax-table .ax-btn--xs,
  .solar-erp-page .ax-table button.ax-btn,
  .solar-erp-page .ax-table a.ax-btn {
    min-height: unset !important;
    height: auto !important;
    padding: 4px 8px !important;
    font-size: 11px !important;
    line-height: 1.2 !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 4px !important;
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

>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7
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

<<<<<<< HEAD
const X_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 18, height: 18 }}>
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

/* ───────── Modal Dialog Component ───────── */
=======
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7
function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
<<<<<<< HEAD
  maxWidth = 720,
=======
  maxWidth = 640,
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7
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
<<<<<<< HEAD
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--ax-text-strong)' }}>{title}</h3>
            {subtitle && <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--ax-text-muted)' }}>{subtitle}</p>}
          </div>
          <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">
            {X_ICON}
=======
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>{title}</h3>
            {subtitle && <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>{subtitle}</p>}
          </div>
          <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">
            ✕
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7
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
<<<<<<< HEAD
  accent: { bg: 'rgba(37, 99, 235, 0.12)', fg: '#2563eb' },
=======
  accent: { bg: 'rgba(37, 89, 191, 0.12)', fg: '#2559bf' },
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7
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

<<<<<<< HEAD
const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const fmtCurrency = (val?: number | string | null): string => {
  const n = Number(val || 0);
  return `₹${n.toLocaleString('en-IN')}`;
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
          alt="Thumbnail"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e) => {
            (e.currentTarget as HTMLElement).style.display = 'none';
            if (e.currentTarget.parentElement) {
              const span = document.createElement('span');
              span.innerText = 'IMG';
              span.style.fontSize = '10px';
              span.style.fontWeight = '700';
              span.style.color = '#2563eb';
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
          <svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth={2} style={{ width: 18, height: 18 }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#2563eb', lineHeight: 1 }}>DOC</span>
        </div>
      )}
    </div>
  );
}

export function ViewRescoBills() {
  const [bills, setBills] = useState<RescoBillItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [districtFilter, setDistrictFilter] = useState('all');

  // Verification modal
  const [selectedBill, setSelectedBill] = useState<RescoBillItem | null>(null);
  const [verifyStatusAction, setVerifyStatusAction] = useState<1 | 2>(1); // 1 = Approved, 2 = Rejected
  const [verifyRemarks, setVerifyRemarks] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // File Lightbox
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Fetch Live Bills strictly from live API
  const fetchBills = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await jammuRescoAdminService.getViewCreateBill();
      setBills(res.bills || []);
    } catch (e: any) {
      setErrorMsg(e?.message || 'Failed to load Jammu RESCO monthly bills.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  // Handle Verify Bill Submit
  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBill) return;

    const amt = Number(billAmount || selectedBill.bill_amount);
    if (!amt || amt <= 0) {
      setErrorMsg('Please enter a valid bill amount greater than 0.');
      return;
    }
    if (!verifyRemarks.trim()) {
      setErrorMsg('Remarks are required for bill verification.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await jammuRescoAdminService.verifyBillStatus(selectedBill.id, {
        verify_status: verifyStatusAction,
        remarks: verifyRemarks.trim(),
        bill_amount: amt,
      });

      if (res.success) {
        setSuccessMsg(res.message || 'Bill verification updated successfully!');
        setSelectedBill(null);
        setVerifyRemarks('');
        setBillAmount('');
        await fetchBills();
      } else {
        setErrorMsg(res.message || 'Failed to update bill verification.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'An error occurred while verifying bill.');
=======
export function ViewRescoBills() {
  const [bills, setBills] = useState<RescoBillItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Action verification modal
  const [selectedBillForVerify, setSelectedBillForVerify] = useState<RescoBillItem | null>(null);
  const [verifyStatus, setVerifyStatus] = useState<'Approved' | 'Pending' | 'Rejected'>('Approved');
  const [verifyRemarks, setVerifyRemarks] = useState('');
  const [submittingVerify, setSubmittingVerify] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await jammuRescoAdminService.getCreatedBills();
      setBills(data);
    } catch (e) {
      console.error('Failed to load RESCO created bills:', e);
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredBills = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return bills;
    return bills.filter(
      (b) =>
        b.site_name.toLowerCase().includes(q) ||
        b.district.toLowerCase().includes(q) ||
        b.bill_no.toLowerCase().includes(q) ||
        b.inverter_no.toLowerCase().includes(q) ||
        b.months_and_year.toLowerCase().includes(q)
    );
  }, [bills, searchQuery]);

  const pagination = usePagination(filteredBills, { initialPageSize: 10 });

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBillForVerify) return;

    setSubmittingVerify(true);
    try {
      setBills((prev) =>
        prev.map((item) =>
          item.id === selectedBillForVerify.id
            ? { ...item, verify_status: verifyStatus, verify_remarks: verifyRemarks }
            : item
        )
      );
      setSelectedBillForVerify(null);
      setVerifyRemarks('');
    } finally {
      setSubmittingVerify(false);
    }
  };

<<<<<<< HEAD
  // Distinct districts
  const availableDistricts = useMemo(() => {
    const set = new Set<string>();
    bills.forEach((b) => {
      const d = b.district || b.resco?.district;
      if (d && String(d).trim() !== '') {
        set.add(String(d).trim());
      }
    });
    return Array.from(set).sort();
  }, [bills]);

  // Filtered Bills
  const filteredBills = useMemo(() => {
    let list = bills;
    if (statusFilter !== 'all') {
      list = list.filter((b) => String(b.verify_status ?? 0) === String(statusFilter));
    }
    if (districtFilter !== 'all') {
      list = list.filter((b) => String(b.district || b.resco?.district || '').toLowerCase() === districtFilter.toLowerCase());
    }

    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter((b) => {
      const sName = (b.site_name || b.resco?.site_name || '').toLowerCase();
      const dist = (b.district || b.resco?.district || '').toLowerCase();
      const bNo = (b.bill_no || '').toLowerCase();
      const invNo = (b.inverter_no || b.resco?.inverter_no || '').toLowerCase();
      const mYear = (b.months_and_year || b.month_year || '').toLowerCase();
      const idStr = String(b.id);

      return (
        sName.includes(q) ||
        dist.includes(q) ||
        bNo.includes(q) ||
        invNo.includes(q) ||
        mYear.includes(q) ||
        idStr.includes(q)
      );
    });
  }, [bills, searchQuery, statusFilter, districtFilter]);

  const pagination = usePagination(filteredBills, { initialPageSize: 50 });

  // Export Columns definition
  const exportColumns: ExportColumn[] = useMemo(
    () => [
      { header: 'Sr No', accessor: 'id' },
      { header: 'Months And Year', accessor: (r: RescoBillItem) => r.months_and_year || r.month_year || '—' },
      { header: 'State', accessor: () => 'JAMMU' },
      { header: 'District', accessor: (r: RescoBillItem) => r.district || r.resco?.district || 'Jammu' },
      { header: 'Site Name', accessor: (r: RescoBillItem) => r.site_name || r.resco?.site_name || '—' },
      { header: 'Inverter No', accessor: (r: RescoBillItem) => r.inverter_no || r.resco?.inverter_no || '—' },
      { header: 'Reading', accessor: (r: RescoBillItem) => String(r.reading || '—') },
      { header: 'Bill No', accessor: (r: RescoBillItem) => r.bill_no || '—' },
      { header: 'Bill Amount', accessor: (r: RescoBillItem) => fmtCurrency(r.bill_amount) },
      {
        header: 'Verify Status',
        accessor: (r: RescoBillItem) =>
          Number(r.verify_status) === 1
            ? 'Approved'
            : Number(r.verify_status) === 2
            ? 'Rejected'
            : 'Pending',
      },
      { header: 'Verify Remarks', accessor: (r: RescoBillItem) => r.verify_remarks || '—' },
    ],
    []
  );

  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = 'Jammu_RESCO_Created_Bills';
  const fileTitle = 'Jammu RESCO Monthly Created Bills Register';

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
    if (!filteredBills.length) return;
    const t = [
      exportColumns.map((c) => c.header).join('\t'),
      ...filteredBills.map((row) =>
        exportColumns.map((c) => {
          if (typeof c.accessor === 'function') return (c.accessor as any)(row);
          return String((row as any)[c.accessor as string] || '');
        }).join('\t')
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
    if (!filteredBills.length) return;
    const out = [
      exportColumns.map((c) => c.header),
      ...filteredBills.map((row) =>
        exportColumns.map((c) => {
          const val = typeof c.accessor === 'function' ? (c.accessor as any)(row) : (row as any)[c.accessor as string];
          return `"${String(val ?? '').replace(/"/g, '""')}"`;
        })
      ),
    ];
    downloadTextFile(`\ufeff${out.map((r) => r.join(',')).join('\r\n')}`, `${fileBase}_${stamp}.csv`, 'text/csv');
  };

  const exportToExcel = () => {
    if (!filteredBills.length) return;
    const tableHtml = `<table border="1"><thead><tr>${exportColumns.map((c) => `<th>${escapeHtml(c.header)}</th>`).join('')}</tr></thead><tbody>${filteredBills.map((row) => `<tr>${exportColumns.map((c) => {
      const val = typeof c.accessor === 'function' ? (c.accessor as any)(row) : (row as any)[c.accessor as string];
      return `<td>${escapeHtml(String(val ?? ''))}</td>`;
    }).join('')}</tr>`).join('')}</tbody></table>`;
    downloadTextFile(`\ufeff<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"/></head><body>${tableHtml}</body></html>`, `${fileBase}_${stamp}.xls`, 'application/vnd.ms-excel');
  };

  const exportToPDF = () => {
    if (!filteredBills.length) return;
    const w = window.open('', '_blank', 'width=1200,height=800');
    if (!w) return;
    w.document.write(`<!doctype html><html><head><meta charset="UTF-8"/><title>${escapeHtml(fileTitle)}</title><style>
      *{box-sizing:border-box}body{font-family:Arial,sans-serif;padding:24px;color:#222}h1{font-size:20px;margin:0 0 16px}
      table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #d8dee6;padding:6px 8px;text-align:left;vertical-align:top}
      th{background:#f3f5f7;font-weight:700}@media print{body{padding:0}@page{size:landscape;margin:10mm}}
    </style></head><body><h1>${escapeHtml(fileTitle)}</h1><table><thead><tr>${exportColumns.map((c) => `<th>${escapeHtml(c.header)}</th>`).join('')}</tr></thead><tbody>${filteredBills.map((r) => `<tr>${exportColumns.map((c) => {
      const val = typeof c.accessor === 'function' ? (c.accessor as any)(r) : (r as any)[c.accessor as string];
      return `<td>${escapeHtml(String(val ?? ''))}</td>`;
    }).join('')}</tr>`).join('')}</tbody></table><script>window.onload=function(){window.print();};</script></body></html>`);
    w.document.close();
    w.focus();
  };

  // KPI Calculations
  const totalBillsCount = bills.length;
  const totalBillAmount = bills.reduce((acc, b) => acc + Number(b.bill_amount || 0), 0);
  const approvedBillsCount = bills.filter((b) => Number(b.verify_status) === 1).length;
  const pendingBillsCount = bills.filter((b) => Number(b.verify_status || 0) === 0).length;

=======
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7
  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

<<<<<<< HEAD
      {/* ── Page Header ── */}
      <PageHead
        title="View Months Wise Created Bill Details"
        subtitle="Audit and authorize monthly energy generation bills and net meter readings for Jammu RESCO installations."
        breadcrumbs={[
          { label: 'ERP Dashboard', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Jammu', href: '/vendor-management/jammu' },
          { label: 'Installation', href: '/vendor-management/jammu/installation/resco' },
          { label: 'RESCO', href: '/vendor-management/jammu/installation/resco' },
          { label: 'View Created Bills' },
        ]}
        actions={
          <Link
            to="/vendor-management/jammu/installation/resco/view-payment"
            className="ax-btn ax-btn--primary ax-btn--sm"
          >
            View Payments
          </Link>
        }
=======
      {/* Page Header matching exact prompt */}
      <PageHead
        title="View Resco Details"
        subtitle="View Months Wise Created Bill Details for Institutional Rooftop Solar Plants in Jammu & Kashmir."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Jammu', href: '/vendor-management/jammu' },
          { label: 'RESCO Installation', href: '/vendor-management/jammu/installation/resco/dashboard' },
          { label: 'View Resco Create Bill' },
        ]}
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7
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

      {/* ── Top 4 KPI Cards in .asw-cards-row ── */}
      <div className="asw-cards-row">
        <KpiCard
          icon={
<<<<<<< HEAD
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
=======
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 15, height: 15 }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7
            </svg>
          }
          tone="accent"
          label="Total Bills"
<<<<<<< HEAD
          value={totalBillsCount}
          sub="Generated monthly bills"
=======
          value={bills.length}
          sub="Generated monthly invoices"
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7
        />

        <KpiCard
          icon={
<<<<<<< HEAD
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
          tone="emerald"
          label="Total Amount"
          value={fmtCurrency(totalBillAmount)}
          sub="Cumulative billing value"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
=======
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 15, height: 15 }}>
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
<<<<<<< HEAD
          tone="cyan"
          label="Approved Bills"
          value={approvedBillsCount}
          sub="Audited & approved"
=======
          tone="emerald"
          label="Approved Bills"
          value={bills.filter((b) => b.verify_status === 'Approved').length}
          sub="Verified generation invoices"
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7
        />

        <KpiCard
          icon={
<<<<<<< HEAD
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
=======
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 15, height: 15 }}>
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
          tone="amber"
          label="Pending Bills"
<<<<<<< HEAD
          value={pendingBillsCount}
          sub="Awaiting verification"
        />
      </div>

      {/* ── Main Data Card ── */}
=======
          value={bills.filter((b) => b.verify_status === 'Pending').length}
          sub="Awaiting review"
        />

        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 15, height: 15 }}>
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
          tone="cyan"
          label="Total Billing Value"
          value={`₹${bills.reduce((acc, b) => acc + (b.bill_amount || 0), 0).toLocaleString('en-IN')}`}
          sub="Net generation invoice amount"
        />
      </div>

      {/* Main Table Card */}
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7
      <section className="ax-card ax-col--12">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">View Months Wise Created Bill Details</h2>
<<<<<<< HEAD
            <p className="ax-card__subtitle">
              <span className="ax-num">{filteredBills.length}</span> of <span className="ax-num">{bills.length}</span> monthly bills
              {' '}· Approved <b className="ax-num">{approvedBillsCount}</b> · Pending <b className="ax-num">{pendingBillsCount}</b>
            </p>
          </div>
          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              {availableDistricts.length > 0 && (
                <select
                  id="bill_district_filter"
                  className="ax-input ax-input--sm"
                  style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                  value={districtFilter}
                  onChange={(e) => {
                    setDistrictFilter(e.target.value);
                    pagination.setPage(1);
                  }}
                  aria-label="Filter by district"
                >
                  <option value="all">All Districts</option>
                  {availableDistricts.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              )}

              <select
                id="bill_status_filter"
                className="ax-input ax-input--sm"
                style={{ width: 130, height: 32, fontSize: 'var(--ax-text-xs)' }}
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  pagination.setPage(1);
                }}
                aria-label="Filter by status"
              >
                <option value="all">All Status</option>
                <option value="0">Pending (0)</option>
                <option value="1">Approved (1)</option>
                <option value="2">Rejected (2)</option>
              </select>

              {(searchQuery.trim() !== '' || statusFilter !== 'all' || districtFilter !== 'all') && (
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--sm"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setDistrictFilter('all');
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
                placeholder="Search site, bill no, month..."
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

        {/* ── Responsive Horizontal Scroll Table ── */}
        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap', minWidth: 1400 }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th" style={{ width: 50, textAlign: 'center' }}>Sr No</th>
                <th className="ax-table__th">Months And Year</th>
                <th className="ax-table__th">State</th>
                <th className="ax-table__th">District</th>
                <th className="ax-table__th">Site Name</th>
                <th className="ax-table__th">Inverter No</th>
                <th className="ax-table__th">Reading</th>
                <th className="ax-table__th">Bill No</th>
                <th className="ax-table__th">Bill Amount</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Documents</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Verify Status</th>
                <th className="ax-table__th">Verify Remarks</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={13} style={centerCell}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <span className="ax-spinner" aria-hidden="true" />
                      <span>Loading bills...</span>
                    </div>
                  </td>
                </tr>
              ) : pagination.paged.length === 0 ? (
                <tr>
                  <td colSpan={13} style={centerCell}>
                    <TableEmptyState
                      title="No data available in table"
                      description={
                        searchQuery
                          ? 'No billing records match your search criteria.'
                          : 'No monthly bills created yet.'
                      }
                    />
                  </td>
                </tr>
              ) : (
                pagination.paged.map((bill: RescoBillItem, idx: number) => {
                  const globalIdx = (pagination.curPage - 1) * pagination.pageSize + idx + 1;
                  const vStat = Number(bill.verify_status || 0);
                  const isPending = vStat === 0;
                  const siteName = bill.site_name || bill.resco?.site_name || '—';
                  const districtName = bill.district || bill.resco?.district || 'Jammu';
                  const inverterNum = bill.inverter_no || bill.resco?.inverter_no || '—';
                  const docFile = bill.documents || bill.file;

                  return (
                    <tr key={bill.id}>
                      <td className="ax-table__td" style={{ textAlign: 'center', fontWeight: 600 }}>{globalIdx}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>
                        {bill.months_and_year || bill.month_year || '—'}
                      </td>
                      <td className="ax-table__td">JAMMU</td>
                      <td className="ax-table__td">{districtName}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>{siteName}</td>
                      <td className="ax-table__td">{inverterNum}</td>
                      <td className="ax-table__td">{bill.reading || '—'}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>
                        {bill.bill_no || `BILL-${bill.id}`}
                      </td>
                      <td className="ax-table__td" style={{ fontWeight: 700, color: '#16a34a' }}>
                        {fmtCurrency(bill.bill_amount)}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <MediaFileThumbnail file={docFile} onClick={setLightboxUrl} />
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {vStat === 1 ? (
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
                            Approved
                          </span>
                        ) : vStat === 2 ? (
                          <span
                            className="ax-badge"
                            style={{
                              padding: '3px 8px',
                              fontSize: 11,
                              fontWeight: 700,
                              color: '#dc2626',
                              background: 'rgba(220, 38, 38, 0.1)',
                              border: '1px solid rgba(220, 38, 38, 0.25)',
                              borderRadius: 6,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#dc2626' }} />
                            Rejected
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
                      <td className="ax-table__td" style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {bill.verify_remarks || '—'}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {isPending ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedBill(bill);
                              setVerifyStatusAction(1);
                              setBillAmount(String(bill.bill_amount || ''));
                              setVerifyRemarks('');
                            }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              padding: '4px 10px',
                              borderRadius: 6,
                              background: '#2563eb',
                              color: '#ffffff',
                              border: 'none',
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: 'pointer',
=======
            <p className="ax-card__subtitle">Showing {filteredBills.length} monthly generation billing records</p>
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
                  style={{ height: 30, padding: '0 8px', fontSize: '11px' }}
                >
                  Reset
                </button>
              )}
              <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search site, bill no, month..." size="sm" />
              <TableExportToolbar onCopy={() => {}} onExportCSV={() => {}} onExportExcel={() => {}} onExportPDF={() => {}} />
            </div>
          </div>
        </div>

        {/* Responsive Table matching exact prompt columns */}
        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap', minWidth: 1500 }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th">Sr No</th>
                <th className="ax-table__th">Months And Year</th>
                <th className="ax-table__th">State</th>
                <th className="ax-table__th">District</th>
                <th className="ax-table__th">Site Name</th>
                <th className="ax-table__th">Inverter No</th>
                <th className="ax-table__th">Reading</th>
                <th className="ax-table__th">Bill No</th>
                <th className="ax-table__th ax-table__th--num">Bill Amount</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Documents</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Verify Status</th>
                <th className="ax-table__th">Verify Remarks</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={13} style={centerCell}>Loading created bills...</td>
                </tr>
              ) : pagination.paged.length === 0 ? (
                <tr>
                  <td colSpan={13} style={centerCell}>
                    <TableEmptyState title="No data available in table" description="No monthly bill records match current criteria" />
                  </td>
                </tr>
              ) : (
                pagination.paged.map((row, idx) => {
                  const globalIdx = (pagination.curPage - 1) * pagination.pageSize + idx + 1;
                  return (
                    <tr key={row.id}>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{globalIdx}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{row.months_and_year}</td>
                      <td className="ax-table__td">JAMMU &amp; KASHMIR</td>
                      <td className="ax-table__td">{row.district}</td>
                      <td className="ax-table__td" style={{ fontWeight: 700, color: '#0f172a' }}>{row.site_name}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace' }}>{row.inverter_no}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontWeight: 600 }}>{row.reading}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontWeight: 700, color: '#2559bf' }}>
                        {row.bill_no}
                      </td>
                      <td className="ax-table__td ax-table__td--num" style={{ fontWeight: 800, color: '#16a34a' }}>
                        ₹{row.bill_amount.toLocaleString('en-IN')}
                      </td>

                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {row.documents ? (
                          <a
                            href={resolveJammuMediaUrl(row.documents)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ax-btn ax-btn--ghost ax-btn--xs"
                            style={{ color: '#2559bf', fontWeight: 600 }}
                          >
                            📄 Bill PDF
                          </a>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </td>

                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <span
                          className={`ax-badge ax-badge--soft ${
                            row.verify_status === 'Approved'
                              ? 'ax-badge--success'
                              : row.verify_status === 'Rejected'
                              ? 'ax-badge--danger'
                              : 'ax-badge--warning'
                          }`}
                          style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700 }}
                        >
                          {row.verify_status}
                        </span>
                      </td>

                      <td className="ax-table__td" style={{ fontSize: 11, maxWidth: 180, whiteSpace: 'normal' }}>
                        {row.verify_remarks || '—'}
                      </td>

                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedBillForVerify(row);
                              setVerifyStatus(row.verify_status);
                              setVerifyRemarks(row.verify_remarks || '');
                            }}
                            className="ax-btn ax-btn--primary ax-btn--sm"
                            style={{
                              padding: '4px 12px',
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              lineHeight: 1.2,
                              height: 'auto',
                              minHeight: 'unset',
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7
                            }}
                          >
                            Verify
                          </button>
<<<<<<< HEAD
                        ) : (
                          <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Verified</span>
                        )}
                      </td>
=======
                        </td>
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

<<<<<<< HEAD
        {/* ── Left Aligned Pagination in Footer ── */}
=======
        {/* Footer Pagination */}
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7
        <div className="ax-card__footer" style={footerStyle}>
          <div className="ula-pagination-left">
            <Pagination
              currentPage={pagination.curPage}
              totalItems={pagination.totalItems}
              pageSize={pagination.pageSize}
              onPageChange={pagination.setPage}
              onPageSizeChange={pagination.setPageSize}
<<<<<<< HEAD
              pageSizeOptions={[10, 25, 50, 100, 200]}
=======
              pageSizeOptions={[10, 25, 50, 100]}
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7
            />
          </div>
        </div>
      </section>

<<<<<<< HEAD
      {/* ── Modal 1: Verify Bill Action ── */}
      <Modal
        open={Boolean(selectedBill)}
        onClose={() => setSelectedBill(null)}
        title={`Verify Bill — ${selectedBill?.bill_no || `Bill #${selectedBill?.id}`}`}
        subtitle={`Site: ${selectedBill?.site_name || selectedBill?.resco?.site_name || ''} | Month: ${selectedBill?.months_and_year || ''}`}
        footer={
          <>
            <button
              type="button"
              className="ax-btn ax-btn--secondary"
              onClick={() => setSelectedBill(null)}
              disabled={submitting}
              style={{ padding: '6px 14px', fontSize: 13, borderRadius: 6 }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="ax-btn ax-btn--primary"
              onClick={handleVerifySubmit}
              disabled={submitting}
              style={{
                padding: '6px 16px',
                fontSize: 13,
                fontWeight: 600,
                borderRadius: 6,
                background: verifyStatusAction === 1 ? '#16a34a' : '#dc2626',
                border: 'none',
                color: '#fff',
              }}
            >
              {submitting
                ? 'Submitting...'
                : verifyStatusAction === 1
                ? 'Approve Bill'
                : 'Reject Bill'}
=======
      {/* Bill Verify Action Modal */}
      <Modal
        open={Boolean(selectedBillForVerify)}
        onClose={() => setSelectedBillForVerify(null)}
        title="Verify Monthly RESCO Solar Bill"
        subtitle={selectedBillForVerify ? `${selectedBillForVerify.site_name} • Bill: ${selectedBillForVerify.bill_no}` : ''}
        maxWidth={500}
        footer={
          <>
            <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setSelectedBillForVerify(null)} disabled={submittingVerify}>
              Cancel
            </button>
            <button type="button" className="ax-btn ax-btn--primary" onClick={handleVerifySubmit} disabled={submittingVerify}>
              {submittingVerify ? 'Updating...' : 'Save Decision'}
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7
            </button>
          </>
        }
      >
<<<<<<< HEAD
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: '#334155' }}>
              Verification Action <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <div style={{ display: 'flex', gap: 12 }}>
              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: verifyStatusAction === 1 ? '2px solid #16a34a' : '1px solid #cbd5e1',
                  background: verifyStatusAction === 1 ? '#f0fdf4' : '#fff',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 13,
                  color: verifyStatusAction === 1 ? '#15803d' : '#334155',
                }}
              >
                <input
                  type="radio"
                  name="billAction"
                  checked={verifyStatusAction === 1}
                  onChange={() => setVerifyStatusAction(1)}
                />
                Approve (Status = 1)
              </label>

              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: verifyStatusAction === 2 ? '2px solid #ef4444' : '1px solid #cbd5e1',
                  background: verifyStatusAction === 2 ? '#fef2f2' : '#fff',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 13,
                  color: verifyStatusAction === 2 ? '#b91c1c' : '#334155',
                }}
              >
                <input
                  type="radio"
                  name="billAction"
                  checked={verifyStatusAction === 2}
                  onChange={() => setVerifyStatusAction(2)}
                />
                Reject (Status = 2)
              </label>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: '#334155' }}>
              Verified Bill Amount (₹) <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              type="number"
              className="ax-form-control"
              value={billAmount}
              onChange={(e) => setBillAmount(e.target.value)}
              placeholder="e.g. 25000"
              required
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: 13,
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: '#334155' }}>
              Verification Remarks <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <textarea
              className="ax-form-control"
              rows={3}
              placeholder="Enter audit or verification remarks..."
              value={verifyRemarks}
              onChange={(e) => setVerifyRemarks(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: 13,
                resize: 'vertical',
              }}
            />
          </div>
        </div>
      </Modal>

      {/* ── Modal 2: Document Lightbox ── */}
      {lightboxUrl && (
        <div
          onClick={() => setLightboxUrl(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: 12,
              maxWidth: '90vw',
              maxHeight: '90vh',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderBottom: '1px solid #e2e8f0',
                background: '#f8fafc',
              }}
            >
              <span style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>
                Bill Document Preview
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <a
                  href={lightboxUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: 12,
                    color: '#2563eb',
                    fontWeight: 600,
                    textDecoration: 'none',
                    padding: '4px 10px',
                    borderRadius: 6,
                    border: '1px solid #bfdbfe',
                    background: '#eff6ff',
                  }}
                >
                  Open Original ↗
                </a>
                <button
                  type="button"
                  onClick={() => setLightboxUrl(null)}
                  style={{
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontSize: 18,
                    color: '#64748b',
                    lineHeight: 1,
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
            <div
              style={{
                padding: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#0f172a',
                minWidth: 320,
                minHeight: 240,
                maxHeight: '80vh',
                overflow: 'auto',
              }}
            >
              {/\.(pdf)($|\?)/i.test(lightboxUrl) ? (
                <iframe
                  src={lightboxUrl}
                  title="PDF Preview"
                  style={{ width: '80vw', height: '75vh', border: 'none', borderRadius: 6, background: '#fff' }}
                />
              ) : /\.(heic|docx?|xlsx?)($|\?)/i.test(lightboxUrl) ? (
                <div style={{ textAlign: 'center', color: '#fff', padding: 24 }}>
                  <p style={{ fontSize: 14, marginBottom: 12 }}>
                    Direct preview not supported for this file format in browser.
                  </p>
                  <a
                    href={lightboxUrl}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ax-btn ax-btn--primary"
                    style={{
                      display: 'inline-block',
                      padding: '8px 16px',
                      fontWeight: 700,
                      fontSize: 13,
                      textDecoration: 'none',
                    }}
                  >
                    Download / Open File
                  </a>
                </div>
              ) : (
                <img
                  src={lightboxUrl}
                  alt="Bill Document Preview"
                  style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: 6 }}
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
=======
        <form onSubmit={handleVerifySubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
              Verification Status <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              value={verifyStatus}
              onChange={(e) => setVerifyStatus(e.target.value as any)}
              className="ax-select"
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }}
              required
            >
              <option value="Approved">Approved</option>
              <option value="Pending">Pending</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
              Verify Remarks
            </label>
            <textarea
              rows={3}
              value={verifyRemarks}
              onChange={(e) => setVerifyRemarks(e.target.value)}
              placeholder="Enter PPA tariff verification or joint meter reading reconciliation remarks..."
              className="ax-textarea"
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
            />
          </div>
        </form>
      </Modal>
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7
    </div>
  );
}

export default ViewRescoBills;
