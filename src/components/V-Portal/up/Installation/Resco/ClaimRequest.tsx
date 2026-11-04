import { useState, useMemo, useEffect, useCallback, useRef, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  upInstallationService,
  resolveUpMediaUrl,
  type UpRescoClaimItem,
} from '../../up-services';
import {
  Pagination,
  SearchInput,
  TableExportToolbar,
  TableEmptyState,
  KpiSkeleton,
  copyTableDataToClipboard,
  exportDataToCSV,
  exportDataToExcel,
  printTableData,
  type ExportColumn,
} from '../../../../../common';

/* ───────── Constants ───────── */
const DASH = '—';
const txt = (v: unknown) => (v === null || v === undefined || v === '' ? DASH : String(v));

const X_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

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

type Row = UpRescoClaimItem;

/* ───────── KPI Card (Jammu pattern) ───────── */
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
      <div style={{ fontSize: 24, fontWeight: 800, color: t.fg, marginTop: 4, fontFamily: 'var(--ax-font-display)' }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>{sub}</div>
    </div>
  );
}

/* ───────── Reusable Modal (Jammu pattern) ───────── */
function Modal({
  open,
  onClose,
  labelledBy,
  describedBy,
  role = 'dialog',
  centered = true,
  dialogClass = '',
  dialogStyle,
  closeOnBackdrop = true,
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  describedBy?: string;
  role?: 'dialog' | 'alertdialog';
  centered?: boolean;
  dialogClass?: string;
  dialogStyle?: CSSProperties;
  closeOnBackdrop?: boolean;
  children: ReactNode;
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
    <div
      className={`ax-modal${centered ? ' ax-modal--centered' : ''}`}
      role={role}
      aria-modal="true"
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
    >
      <div className="ax-modal__backdrop" onClick={() => closeOnBackdrop && onClose()} />
      <div ref={dialogRef} className={`ax-modal__dialog${dialogClass ? ' ' + dialogClass : ''}`} style={dialogStyle}>
        {children}
      </div>
    </div>,
    document.body
  );
}

/* ───────── Overlay CSS (Jammu pattern) ───────── */
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
  .ax-modal__dialog--md { max-width: 580px; }
  .ax-modal__dialog--lg { max-width: 900px; }
  .ax-modal__header {
    padding: 18px 24px;
    border-bottom: 1px solid var(--ax-border, #e2e8f0);
    background: var(--ax-surface-subtle, #f8fafc);
    display: flex; align-items: center; justify-content: space-between;
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
  .ax-modal__close svg { width: 16px; height: 16px; }
  .ax-modal__body {
    padding: 24px; overflow-y: auto; max-height: calc(85vh - 120px);
  }
  .ax-modal__footer {
    padding: 16px 24px;
    border-top: 1px solid var(--ax-border, #e2e8f0);
    background: var(--ax-surface-subtle, #f8fafc);
    display: flex; align-items: center; justify-content: flex-end; gap: 10px;
  }

  /* Modern form fields inside modals */
  .ax-modern-field {
    display: flex; flex-direction: column; gap: 6px;
  }
  .ax-modern-label {
    display: flex; align-items: center; justify-content: space-between;
    font-size: 12px; font-weight: 600; color: var(--ax-text-strong, #1e293b);
    letter-spacing: 0.02em; margin: 0;
  }
  .ax-modern-req {
    color: #ef4444; font-weight: 700; margin-left: 3px;
  }
  .ax-modern-dropzone {
    border: 1.5px dashed var(--ax-border, #cbd5e1);
    border-radius: 10px; padding: 18px 16px;
    background: var(--ax-surface-subtle, #f8fafc);
    text-align: center; cursor: pointer; transition: all 0.2s ease;
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
  }
  .ax-modern-dropzone:hover {
    border-color: var(--ax-accent, #2563eb);
    background: color-mix(in srgb, var(--ax-accent, #2563eb) 5%, var(--ax-surface-subtle, #f8fafc));
  }
  .ax-modern-dropzone__icon {
    width: 42px; height: 42px; border-radius: 50%;
    background: color-mix(in srgb, var(--ax-accent, #2563eb) 10%, #ffffff);
    display: flex; align-items: center; justify-content: center;
  }
  .ax-modern-file-chip {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 14px; background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 9px;
  }
  .ax-modern-file-chip__icon {
    width: 32px; height: 32px; border-radius: 8px;
    background: #dcfce7; display: flex; align-items: center; justify-content: center;
  }
`;

/* ───────── Responsive Page CSS (Jammu pattern) ───────── */
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

  .solar-erp-page img,
  .solar-erp-page .ax-card img {
    border-radius: 0 !important;
  }

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
    .solar-erp-page .ax-card__actions {
      width: 100%;
      justify-content: stretch;
      margin-left: 0;
    }
    .solar-erp-page .ax-card__actions .ax-cluster {
      width: 100%;
      flex-wrap: wrap !important;
    }
    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] {
      flex: 1 1 100%;
      max-width: 100%;
    }
  }
`;

/* ───────── View Detail Modal ───────── */
function ViewDetailModal({
  open,
  item,
  onClose,
}: {
  open: boolean;
  item: Row | null;
  onClose: () => void;
}) {
  if (!open || !item) return null;

  const invoiceUrl = item.invoice ? resolveUpMediaUrl(item.invoice) : '';

  return (
    <Modal open={open} onClose={onClose} labelledBy="resco-view-title" dialogClass="ax-modal__dialog--md" dialogStyle={{ maxWidth: 620 }}>
      <div className="ax-modal__header">
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ax-accent, #2563eb)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Resco Installation
          </span>
          <h3 id="resco-view-title" style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ax-text, #0f172a)' }}>
            Claim Details <span style={{ fontWeight: 400, color: 'var(--ax-text-muted)' }}>(#{item.id})</span>
          </h3>
        </div>
        <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">{X_ICON}</button>
      </div>

      <div className="ax-modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Claim Info */}
        <div style={{ padding: 14, borderRadius: 10, background: 'var(--ax-surface-subtle, #f8fafc)', border: '1px solid var(--ax-border, #e2e8f0)' }}>
          <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700 }}>Claim Information</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12.5 }}>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Claim Type: </span><strong>{txt(item.claim)}</strong></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Date: </span><strong>{txt(item.date)}</strong></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Sites: </span><strong>{txt(item.sites)}</strong></div>
            <div>
              <span style={{ color: 'var(--ax-text-muted)' }}>Amount: </span>
              <strong style={{ color: 'var(--ax-accent, #2563eb)' }}>{item.amount ? `₹${Number(item.amount).toLocaleString('en-IN')}` : DASH}</strong>
            </div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Remarks: </span><strong>{txt(item.remarks)}</strong></div>
            <div>
              <span style={{ color: 'var(--ax-text-muted)' }}>Status: </span>
              <span className={`ax-badge ax-badge--soft ${item.status === 2 ? 'ax-badge--success' : 'ax-badge--warning'}`}>
                {item.status === 2 ? 'Approved' : 'Pending'}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Info */}
        <div style={{ padding: 14, borderRadius: 10, background: 'var(--ax-surface-subtle, #f8fafc)', border: '1px solid var(--ax-border, #e2e8f0)' }}>
          <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700 }}>Payment Details</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12.5 }}>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Payment Amount: </span><strong>{item.payment_amount ? `₹${Number(item.payment_amount).toLocaleString('en-IN')}` : DASH}</strong></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Payment Balance: </span><strong>{item.payment_balance ? `₹${Number(item.payment_balance).toLocaleString('en-IN')}` : DASH}</strong></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Payment Date: </span><strong>{txt(item.payment_date)}</strong></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Payment Remarks: </span><strong>{txt(item.payment_remarks)}</strong></div>
            <div>
              <span style={{ color: 'var(--ax-text-muted)' }}>Payment Status: </span>
              <span className={`ax-badge ax-badge--soft ${item.payment_status === 1 ? 'ax-badge--success' : 'ax-badge--warning'}`}>
                {item.payment_status === 1 ? 'Complete' : 'Pending'}
              </span>
            </div>
          </div>
        </div>

        {invoiceUrl && (
          <a href={invoiceUrl} target="_blank" rel="noopener noreferrer" className="ax-btn ax-btn--ghost ax-btn--sm" style={{ alignSelf: 'flex-start' }}>
            View Invoice ↗
          </a>
        )}
      </div>

      <div className="ax-modal__footer">
        <button type="button" className="ax-btn ax-btn--primary" onClick={onClose}>Close</button>
      </div>
    </Modal>
  );
}

/* ───────── Claim Submission Modal (Jammu ax-modern-field pattern) ───────── */
function ClaimModal({
  open,
  claimType,
  onClose,
  onSubmit,
  submitting,
}: {
  open: boolean;
  claimType: string;
  onClose: () => void;
  onSubmit: (e: FormEvent, amount: string, invoice: File | null, remarks: string) => void;
  submitting: boolean;
}) {
  const [amount, setAmount] = useState('');
  const [invoice, setInvoice] = useState<File | null>(null);
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    if (open) {
      setAmount('');
      setInvoice(null);
      setRemarks('');
    }
  }, [open]);

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} labelledBy="resco-claim-title" dialogClass="ax-modal__dialog--md" dialogStyle={{ maxWidth: 540 }}>
      <form onSubmit={(e) => onSubmit(e, amount, invoice, remarks)}>
        <div className="ax-modal__header">
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ax-accent, #2563eb)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Resco Installation
            </span>
            <h4 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--ax-text-strong, #0f172a)' }} id="resco-claim-title">
              Raise {claimType} Claim
            </h4>
          </div>
          <button type="button" className="ax-modal__close" onClick={onClose} disabled={submitting} aria-label="Close dialog">{X_ICON}</button>
        </div>

        <div className="ax-modal__body" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Claim Type (read-only, pre-filled from button) */}
          <div className="ax-modern-field">
            <label className="ax-modern-label">
              <span>Claim Type</span>
            </label>
            <input type="text" readOnly className="ax-input" value={claimType} style={{ background: 'var(--ax-surface-subtle, #f8fafc)' }} />
          </div>

          {/* Claim Amount */}
          <div className="ax-modern-field">
            <label className="ax-modern-label">
              <span>Claim Amount (₹)</span>
              <span className="ax-modern-req">*</span>
            </label>
            <input
              type="number"
              required
              className="ax-input"
              placeholder="e.g. 250000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          {/* Invoice Document (Jammu dropzone pattern) */}
          <div className="ax-modern-field">
            <label className="ax-modern-label">
              <span>Invoice Document</span>
              <span className="ax-modern-req">*</span>
            </label>
            {invoice ? (
              <div className="ax-modern-file-chip">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="ax-modern-file-chip__icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#15803d' }}>{invoice.name}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{(invoice.size / 1024).toFixed(1)} KB</div>
                  </div>
                </div>
                <button type="button" className="ax-btn ax-btn--ghost ax-btn--xs" style={{ color: '#ef4444' }} onClick={() => setInvoice(null)}>{X_ICON}</button>
              </div>
            ) : (
              <label className="ax-modern-dropzone">
                <div className="ax-modern-dropzone__icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong)' }}>Click to upload invoice</div>
                <div style={{ fontSize: 11, color: 'var(--ax-text-muted)' }}>Accepts PDF and image files</div>
                <input type="file" required accept=".pdf,image/*" onChange={(e) => setInvoice(e.target.files?.[0] || null)} style={{ display: 'none' }} />
              </label>
            )}
          </div>

          {/* Remarks */}
          <div className="ax-modern-field">
            <label className="ax-modern-label"><span>Remarks</span></label>
            <input
              type="text"
              className="ax-input"
              placeholder="Enter remarks..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>
        </div>

        <div className="ax-modal__footer">
          <button type="button" className="ax-btn ax-btn--secondary" onClick={onClose} disabled={submitting}>Cancel</button>
          <button type="submit" className="ax-btn ax-btn--primary" disabled={submitting || !invoice}>
            {submitting ? 'Submitting…' : 'Submit Claim'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ───────── Export Columns ───────── */
const EXPORT_COLS: ExportColumn<Row>[] = [
  { header: 'S.No.', accessor: (_: any, idx?: number) => (idx !== undefined ? idx + 1 : 1) },
  { header: 'Date', accessor: (r: any) => r.date || DASH },
  { header: 'Claim', accessor: (r: any) => r.claim || DASH },
  { header: 'Sites', accessor: (r: any) => String(r.sites ?? DASH) },
  { header: 'Amount', accessor: (r: any) => (r.amount ? `₹${Number(r.amount).toLocaleString('en-IN')}` : DASH) },
  { header: 'Remarks', accessor: (r: any) => r.remarks || DASH },
  { header: 'Status', accessor: (r: any) => (r.status === 2 ? 'Approved' : 'Pending') },
  { header: 'Payment Amount', accessor: (r: any) => (r.payment_amount ? `₹${Number(r.payment_amount).toLocaleString('en-IN')}` : DASH) },
  { header: 'Payment Balance', accessor: (r: any) => (r.payment_balance ? `₹${Number(r.payment_balance).toLocaleString('en-IN')}` : DASH) },
  { header: 'Payment Date', accessor: (r: any) => r.payment_date || DASH },
  { header: 'Payment Remarks', accessor: (r: any) => r.payment_remarks || DASH },
  { header: 'Payment Status', accessor: (r: any) => (r.payment_status === 1 ? 'Complete' : 'Pending') },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/* ───────── Main Component ───────── */
/* ═══════════════════════════════════════════════════════════════════════════ */

export function UP_Installation_Resco_ClaimRequest() {
  const [loading, setLoading] = useState(false);
  const [claims, setClaims] = useState<Row[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Toast / feedback (Jammu pattern)
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Claim Modal — opens with pre-filled claim type from button
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [claimType, setClaimType] = useState('Payment 40 %');
  const [submitting, setSubmitting] = useState(false);

  // Open claim modal with specific type
  const handleOpenClaimModal = (type: string) => {
    setClaimType(type);
    setClaimModalOpen(true);
  };

  // View Detail Modal
  const [viewItem, setViewItem] = useState<Row | null>(null);

  // ── Load Data ──
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await upInstallationService.getRescoClaims();
      setClaims(res || []);
    } catch (err: any) {
      console.error(err);
      setToastMsg({ type: 'danger', text: err?.message || 'Failed to load Resco claims.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Toast auto-dismiss
  useEffect(() => {
    if (!toastMsg) return;
    const t = window.setTimeout(() => setToastMsg(null), 4000);
    return () => window.clearTimeout(t);
  }, [toastMsg]);

  // ── Submit Claim ──
  const handleSubmitClaim = async (e: FormEvent, amount: string, invoice: File | null, remarks: string) => {
    e.preventDefault();
    if (!amount.trim() || !invoice) return;

    setSubmitting(true);
    const fd = new FormData();
    fd.append('claim', claimType);
    fd.append('amount', amount);
    fd.append('claim_amount', amount);
    fd.append('invoice', invoice);
    if (remarks) fd.append('remarks', remarks);

    try {
      const res = await upInstallationService.storeRescoClaim(fd);
      if (res.status) {
        setToastMsg({ type: 'success', text: res.message || 'Payment claim submitted successfully!' });
        setClaimModalOpen(false);
        loadData();
      } else {
        setToastMsg({ type: 'danger', text: res.message || 'Failed to submit claim.' });
      }
    } catch (err: any) {
      setToastMsg({ type: 'danger', text: err?.message || 'Server error occurred.' });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Search filter ──
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return claims;
    const q = searchQuery.toLowerCase();
    return claims.filter((c) =>
      Object.values(c).some((v) => v !== null && v !== undefined && String(v).toLowerCase().includes(q))
    );
  }, [claims, searchQuery]);

  // ── KPI Computed ──
  const approvedCount = useMemo(() => claims.filter((c) => c.status === 2).length, [claims]);
  const pendingCount = useMemo(() => claims.filter((c) => c.status !== 2).length, [claims]);
  const totalAmount = useMemo(() => claims.reduce((sum, c) => sum + (Number(c.amount) || 0), 0), [claims]);

  // ── Manual Pagination ──
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pagedItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  const hasFilters = !!searchQuery;
  const clearFilters = () => { setSearchQuery(''); setCurrentPage(1); };

  // ── Export Handlers ──
  const handleCopy = () => {
    copyTableDataToClipboard(filtered, EXPORT_COLS);
    setToastMsg({ type: 'success', text: 'Table data copied to clipboard!' });
  };
  const handleCsv = () => exportDataToCSV('UP_Resco_Claims', filtered, EXPORT_COLS);
  const handleExcel = () => exportDataToExcel('UP_Resco_Claims', filtered, EXPORT_COLS);
  const handlePdf = () => printTableData('UP Resco Installation Claims', filtered, EXPORT_COLS);

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* ── Page Head (Jammu pattern — buttons only here, NOT duplicated in table) ── */}
      <PageHead
        title="UP Resco Installation Claim"
        subtitle="Manage stage-wise payment claims (40% / 30%) and track disbursement for Resco installations"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Uttar Pradesh' },
          { label: 'Installation' },
          { label: 'Resco Claim Request' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)', alignItems: 'center' }}>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={loadData} disabled={loading}>
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
                <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
              </svg>
              <span className="ax-btn__label">Refresh</span>
            </button>
            <button type="button" className="ax-btn ax-btn--primary ax-btn--sm" onClick={() => handleOpenClaimModal('Payment 40 %')}>
              <span className="ax-btn__label">+ Payment 40%</span>
            </button>
            <button type="button" className="ax-btn ax-btn--primary ax-btn--sm" onClick={() => handleOpenClaimModal('Payment 30 %')}>
              <span className="ax-btn__label">+ Payment 30%</span>
            </button>
            <button type="button" className="ax-btn ax-btn--primary ax-btn--sm" onClick={() => handleOpenClaimModal('Payment 30 %')}>
              <span className="ax-btn__label">+ Payment 30%</span>
            </button>
          </div>
        }
      />

      {/* Toast notification (Jammu pattern) */}
      {toastMsg && (
        <div className={`ax-alert ax-alert--${toastMsg.type}`} style={{ marginBottom: 'var(--ax-space-4)' }} role="status">
          <div className="ax-alert__title">{toastMsg.type === 'success' ? 'Success' : 'Error'}</div>
          <div className="ax-alert__text">{toastMsg.text}</div>
        </div>
      )}

      {/* ── Top Metric KPI Cards (4 cards in 1 row — Jammu asw-cards-row pattern) ── */}
      {loading ? (
        <div className="asw-cards-row"><KpiSkeleton count={4} /></div>
      ) : (
        <div className="asw-cards-row">
          <KpiCard
            tone="accent"
            label="Total Claims"
            value={claims.length.toLocaleString('en-IN')}
            sub="All claims raised"
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="4" width="16" height="16" rx="2" />
                <path d="M8 9h8M8 13h8M8 17h5" />
              </svg>
            }
          />

          <KpiCard
            tone="emerald"
            label="Approved"
            value={approvedCount.toLocaleString('en-IN')}
            sub="Claims approved"
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            }
          />

          <KpiCard
            tone="amber"
            label="Pending"
            value={pendingCount.toLocaleString('en-IN')}
            sub="Awaiting review"
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <polyline points="12 7 12 12 15 15" />
              </svg>
            }
          />

          <KpiCard
            tone="cyan"
            label="Total Amount"
            value={`₹${totalAmount.toLocaleString('en-IN')}`}
            sub="Sum of all claims"
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            }
          />
        </div>
      )}

      <div className="ax-dash-grid">
        {/* ── Main Table Card ── */}
        <section className="ax-card ax-col--12" role="region" aria-labelledby="resco-table-title">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">UP RESCO</span>
              <h2 id="resco-table-title" className="ax-card__title">Resco Installation Payment Claims</h2>
              <p className="ax-card__subtitle">
                <span className="ax-num">{filtered.length}</span> of <span className="ax-num">{claims.length}</span> claims
                {' '}· Approved <b className="ax-num">{approvedCount}</b> · Pending <b className="ax-num">{pendingCount}</b>
              </p>
            </div>

            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                {hasFilters && (
                  <button
                    type="button"
                    className="ax-btn ax-btn--ghost ax-btn--sm"
                    onClick={clearFilters}
                    style={{ height: 30, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }}
                  >
                    Reset
                  </button>
                )}

                <SearchInput
                  value={searchQuery}
                  onChange={(val) => { setSearchQuery(val); setCurrentPage(1); }}
                  placeholder="Search claims…"
                  size="sm"
                  ariaLabel="Search claims"
                />

                <TableExportToolbar
                  onCopy={handleCopy}
                  onExportCSV={handleCsv}
                  onExportExcel={handleExcel}
                  onExportPDF={handlePdf}
                />
              </div>
            </div>
          </div>

          {/* ── Table ── */}
          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap' }}>
              <caption className="ax-visually-hidden">Resco Installation Payment Claims</caption>
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col" style={{ width: 60, textAlign: 'center' }}>S.No.</th>
                  <th className="ax-table__th" scope="col">Date</th>
                  <th className="ax-table__th" scope="col">Claim</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Sites</th>
                  <th className="ax-table__th" scope="col">Invoice</th>
                  <th className="ax-table__th" scope="col">Amount</th>
                  <th className="ax-table__th" scope="col">Remarks</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Status</th>
                  <th className="ax-table__th" scope="col">Payment Amount</th>
                  <th className="ax-table__th" scope="col">Payment Balance</th>
                  <th className="ax-table__th" scope="col">Payment Date</th>
                  <th className="ax-table__th" scope="col">Payment Remarks</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Payment Status</th>
                  <th className="ax-table__th" scope="col" style={{ width: 80, textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody aria-busy={loading}>
                {loading && (
                  <tr>
                    <td className="ax-table__td" colSpan={14} style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--ax-text-muted)' }}>
                      <span className="ax-spinner" style={{ width: 20, height: 20, marginRight: 8, verticalAlign: 'middle' }} />
                      Loading Resco claims from server…
                    </td>
                  </tr>
                )}
                {!loading && pagedItems.length === 0 && (
                  <tr>
                    <td className="ax-table__td" colSpan={14} style={{ padding: 0 }}>
                      <TableEmptyState
                        title="No claims found"
                        message={hasFilters ? 'No claims match your search. Try clearing filters.' : 'No claims submitted yet. Use the "Raise Claim" button above to create one.'}
                        onClear={hasFilters ? clearFilters : undefined}
                        clearLabel="Clear filters"
                      />
                    </td>
                  </tr>
                )}
                {!loading && pagedItems.map((c, idx) => {
                  const sr = (safePage - 1) * pageSize + idx + 1;
                  const invoiceUrl = c.invoice ? resolveUpMediaUrl(c.invoice) : '';
                  return (
                    <tr key={c.id || idx} className="ax-table__row">
                      <td className="ax-table__td ax-num" style={{ textAlign: 'center' }}>{sr}</td>
                      <td className="ax-table__td">{txt(c.date)}</td>
                      <td className="ax-table__td" style={{ fontWeight: 700, color: 'var(--asw-primary, #2563eb)' }}>{txt(c.claim)}</td>
                      <td className="ax-table__td" style={{ textAlign: 'center', fontWeight: 600 }}>{txt(c.sites)}</td>
                      <td className="ax-table__td">
                        {invoiceUrl ? (
                          <a href={invoiceUrl} target="_blank" rel="noopener noreferrer" className="ax-btn ax-btn--ghost ax-btn--xs" style={{ padding: '2px 8px' }}>
                            Invoice ↗
                          </a>
                        ) : (
                          <span style={{ color: 'var(--ax-text-muted)' }}>{DASH}</span>
                        )}
                      </td>
                      <td className="ax-table__td" style={{ fontWeight: 700, color: 'var(--asw-primary, #2563eb)' }}>
                        {c.amount ? `₹${Number(c.amount).toLocaleString('en-IN')}` : DASH}
                      </td>
                      <td className="ax-table__td" style={{ maxWidth: 160, whiteSpace: 'normal', fontSize: 12 }}>{txt(c.remarks)}</td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <span className={`ax-badge ax-badge--soft ${c.status === 2 ? 'ax-badge--success' : 'ax-badge--warning'}`}>
                          {c.status === 2 ? 'Approved' : 'Pending'}
                        </span>
                      </td>
                      <td className="ax-table__td">{c.payment_amount ? `₹${Number(c.payment_amount).toLocaleString('en-IN')}` : DASH}</td>
                      <td className="ax-table__td">{c.payment_balance ? `₹${Number(c.payment_balance).toLocaleString('en-IN')}` : DASH}</td>
                      <td className="ax-table__td">{txt(c.payment_date)}</td>
                      <td className="ax-table__td" style={{ maxWidth: 140, whiteSpace: 'normal', fontSize: 12 }}>{txt(c.payment_remarks)}</td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <span className={`ax-badge ax-badge--soft ${c.payment_status === 1 ? 'ax-badge--success' : 'ax-badge--warning'}`}>
                          {c.payment_status === 1 ? 'Complete' : 'Pending'}
                        </span>
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="ax-btn ax-btn--secondary ax-btn--xs"
                          onClick={() => setViewItem(c)}
                          title="View claim details"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Footer & Pagination (Jammu pattern) ── */}
          <div className="ax-card__footer" style={footerStyle}>
            <div className="ula-pagination-left">
              <Pagination
                currentPage={safePage}
                totalPages={totalPages}
                totalItems={filtered.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(sz) => { setPageSize(sz); setCurrentPage(1); }}
                pageSizeOptions={[50, 100, 200]}
              />
            </div>
          </div>
        </section>
      </div>

      {/* ── Claim Submission Modal (type pre-filled from button click) ── */}
      <ClaimModal
        open={claimModalOpen}
        claimType={claimType}
        onClose={() => setClaimModalOpen(false)}
        onSubmit={handleSubmitClaim}
        submitting={submitting}
      />

      {/* ── View Detail Modal ── */}
      <ViewDetailModal
        open={Boolean(viewItem)}
        item={viewItem}
        onClose={() => setViewItem(null)}
      />
    </div>
  );
}

export default UP_Installation_Resco_ClaimRequest;