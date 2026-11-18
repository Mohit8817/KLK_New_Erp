import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  biharSslInstallationService,
  getMediaUrl,
  type InstalledLightsSummary,
  type InstalledLightItem,
} from '../../bihar-services';
import {
  TableExportToolbar,
  SearchInput,
  Pagination,
  TableEmptyState,
  usePagination,
  type ExportColumn,
} from '../../../../../common';

const DASH = '—';
const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const num = (x: unknown) => (Number(x) || 0).toLocaleString('en-IN');

const ICON_REFRESH = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
    <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
  </svg>
);

const X_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';
const Badge = ({ tone, children }: { tone: Tone; children: ReactNode }) => (
  <span className={`ax-badge ax-badge--soft ax-badge--${tone}`}>{children}</span>
);

const VerifyBadge = ({ value }: { value: number }) =>
  value === 1 ? <Badge tone="success">Approved</Badge>
    : value === 2 ? <Badge tone="danger">Rejected</Badge>
      : <Badge tone="warning">Pending</Badge>;

const vStatusOf = (r: InstalledLightItem) => Number(r.inst_verify_status ?? r.verify_status ?? 0);
const cStatusOf = (r: InstalledLightItem) => Number(r.inst_claim_status ?? r.claim_status ?? 0);
const pStatusOf = (r: InstalledLightItem) => Number(r.inst_pay_status ?? r.payment_status ?? 0);
const lightImageOf = (r: InstalledLightItem) => getMediaUrl(r.light_image || r.light_file) || '';
const uidOf = (r: InstalledLightItem) => r.unique_id || r.uid || `#${r.id}`;

// Claim helpers (same logic as SRT page)
const isClaimRaised = (r: InstalledLightItem) => cStatusOf(r) !== 0;
const isClaimDue = (r: InstalledLightItem) => vStatusOf(r) === 1 && !isClaimRaised(r);

/* ───────── Duration / Aging helpers ───────── */
function parseDateMs(dateStr?: string | null): number | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const s = dateStr.trim();
  if (!s || s === '0000-00-00' || s === '0000-00-00 00:00:00') return null;

  const ddmmyyyy = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (ddmmyyyy) {
    const [, d, m, y] = ddmmyyyy;
    const t = new Date(Number(y), Number(m) - 1, Number(d)).getTime();
    if (!isNaN(t)) return t;
  }

  const t = new Date(s.replace(' ', 'T')).getTime();
  return !isNaN(t) ? t : null;
}

function computeDurationDays(startStr?: string | null, endStr?: string | null): number | null {
  const startMs = parseDateMs(startStr);
  if (startMs === null) return null;
  const endMs = endStr ? parseDateMs(endStr) : Date.now();
  if (endMs === null) return null;
  return Math.max(0, Math.floor((endMs - startMs) / (1000 * 60 * 60 * 24)));
}

function formatDurationLabel(days: number | null): string {
  if (days === null) return DASH;
  if (days === 0) return 'Today';
  if (days === 1) return '1 Day';
  return `${days} Days`;
}

const installDateOf = (r: InstalledLightItem): string => {
  const a = r as Record<string, any>;
  return String(a.inst_date || a.install_date || a.created_at || a.date || '');
};

function getLightDuration(r: InstalledLightItem): { days: number | null; label: string } {
  const a = r as Record<string, any>;
  let days: number | null = null;
  const raw = a.duration ?? a.claim_duration;
  if (raw !== undefined && raw !== null && raw !== '') {
    const d = Number(raw);
    if (!isNaN(d)) days = d;
  }
  if (days === null) {
    const inst = installDateOf(r);
    const claimDate = a.inst_claim_date;
    if (inst) days = claimDate ? computeDurationDays(inst, claimDate) : computeDurationDays(inst);
  }
  return { days, label: formatDurationLabel(days) };
}

/* ───────── Modal (design-system dialog: portal to <body>, focus trap, Esc to close) ───────── */
function Modal({
  open,
  onClose,
  labelledBy,
  describedBy,
  role = 'dialog',
  centered = true,
  dialogClass = '',
  dialogStyle,
  modalStyle,
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
  modalStyle?: CSSProperties;
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
      style={modalStyle}
    >
      <div className="ax-modal__backdrop" onClick={() => closeOnBackdrop && onClose()} />
      <div ref={dialogRef} className={`ax-modal__dialog${dialogClass ? ' ' + dialogClass : ''}`} style={dialogStyle}>
        {children}
      </div>
    </div>,
    document.body
  );
}

/* ───────── Image preview modal ───────── */
const ZOOM_STEPS = [1, 1.5, 2, 3];

function ImagePreviewModal({ url, title, onClose }: { url: string; title: string; onClose: () => void }) {
  const [zoomIdx, setZoomIdx] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const zoom = ZOOM_STEPS[zoomIdx];

  useEffect(() => {
    setZoomIdx(0);
    setStatus('loading');
  }, [url]);

  return (
    <Modal open onClose={onClose} labelledBy="ssl-preview-title" dialogClass="ax-modal__dialog--lg">
      <div className="ax-modal__header">
        <h2 className="ax-modal__title" id="ssl-preview-title">{title || 'Media Preview'}</h2>
        <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">{X_ICON}</button>
      </div>

      <div className="ax-modal__body" style={{ padding: 0 }}>
        <div className="ula-m-stage">
          {status === 'loading' && <div className="ula-m-stage__msg"><span className="ax-spinner" /> Loading image…</div>}
          {status === 'error' && <div className="ula-m-stage__msg">Image could not be loaded. Try opening it in a new tab.</div>}
          <img
            key={url}
            src={url}
            alt={title || 'Preview'}
            onLoad={() => setStatus('ready')}
            onError={() => setStatus('error')}
            style={{
              display: status === 'ready' ? 'block' : 'none',
              margin: 'auto',
              borderRadius: 0,
              ...(zoom === 1
                ? { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }
                : { width: `${zoom * 100}%`, maxWidth: 'none', maxHeight: 'none', height: 'auto' }),
            }}
          />
        </div>
      </div>

      <div className="ax-modal__footer" style={{ justifyContent: 'space-between' }}>
        <div className="ula-m-zoom" role="group" aria-label="Zoom">
          <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setZoomIdx((i) => Math.max(0, i - 1))} disabled={zoomIdx === 0} aria-label="Zoom out">−</button>
          <span className="ula-m-zoom__val">{Math.round(zoom * 100)}%</span>
          <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setZoomIdx((i) => Math.min(ZOOM_STEPS.length - 1, i + 1))} disabled={zoomIdx === ZOOM_STEPS.length - 1} aria-label="Zoom in">+</button>
        </div>
        <div className="ula-m-zoom">
          <a href={url} target="_blank" rel="noreferrer" className="ax-btn ax-btn--ghost">Open in new tab ↗</a>
          <button type="button" className="ax-btn ax-btn--primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </Modal>
  );
}

/* ───────── Raise Claim Modal (same pattern as SRT) ───────── */
function RaiseClaimModal({
  light,
  onClose,
  onSuccess,
}: {
  light: InstalledLightItem;
  onClose: () => void;
  onSuccess: (message: string) => void;
}) {
  const [claimAmount, setClaimAmount] = useState('');
  const [claimInvoiceFile, setClaimInvoiceFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const l = light as Record<string, any>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimAmount || Number(claimAmount) <= 0) {
      setError('Please enter a valid claim amount.');
      return;
    }
    if (!claimInvoiceFile) {
      setError('Please upload the claim invoice file (PDF/Image).');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const fd = new FormData();
      fd.append('ssl_id', String(light.id));
      fd.append('claim_amount', claimAmount.trim());
      fd.append('claim_invoice', claimInvoiceFile);

      // NOTE: make sure this method exists in biharSslInstallationService
      const res = await (biharSslInstallationService as any).raiseInstallClaim(fd);
      onSuccess(res?.message || 'Claim request submitted successfully!');
    } catch (err: any) {
      console.error('[SSL RaiseClaimModal] submit error:', err);
      setError(err?.message || 'Failed to submit claim request. Please check inputs and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const labelStyle = { color: 'var(--ax-text-muted, #64748b)', display: 'block' } as const;
  const strongStyle = { color: 'var(--ax-text-strong, #0f172a)' } as const;

  return (
    <Modal
      open={true}
      onClose={onClose}
      labelledBy="raise-claim-modal-title"
      dialogClass="ax-dialog--md"
      dialogStyle={{ maxWidth: 540, width: '100%', borderRadius: 8 }}
    >
      <form onSubmit={handleSubmit} style={{ margin: 0 }}>
        <div
          className="ax-modal__header"
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--ax-border, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h3 id="raise-claim-modal-title" style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ax-text-strong, #0f172a)' }}>
              Raise Installation Claim
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--ax-text-muted, #64748b)' }}>
              Submit claim invoice for completed installation
            </p>
          </div>
          <button
            type="button"
            className="ax-btn ax-btn--ghost ax-btn--icon"
            onClick={onClose}
            aria-label="Close dialog"
            style={{ width: 32, height: 32, padding: 0 }}
          >
            {X_ICON}
          </button>
        </div>

        <div className="ax-modal__body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 6,
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#991b1b',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Light Overview Details Card */}
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 6,
              background: 'var(--ax-surface-subtle, #f8fafc)',
              border: '1px solid var(--ax-border, #e2e8f0)',
              fontSize: 12,
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
              <div>
                <span style={labelStyle}>UID:</span>
                <strong style={{ fontFamily: 'var(--ax-font-mono, monospace)', ...strongStyle }}>{uidOf(light)}</strong>
              </div>
              <div>
                <span style={labelStyle}>Beneficiary:</span>
                <strong style={strongStyle}>{light.beneficiary_name || DASH}</strong>
              </div>
              <div>
                <span style={labelStyle}>District / State:</span>
                <span>{light.district || DASH}, {light.state || 'Bihar'}</span>
              </div>
              <div>
                <span style={labelStyle}>Contact:</span>
                <span>{light.contact_no || DASH}</span>
              </div>
              <div>
                <span style={labelStyle}>Install Date:</span>
                <strong style={strongStyle}>{installDateOf(light) || DASH}</strong>
              </div>
              <div>
                <span style={labelStyle}>Duration Elapsed:</span>
                <span className="ax-badge ax-badge--soft ax-badge--warning" style={{ fontWeight: 700, fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <span>⏱</span>
                  <span>{getLightDuration(light).label}</span>
                </span>
              </div>
              {(l.pole_no || l.ward_no) && (
                <div className="ula-m-full" style={{ gridColumn: '1 / -1' }}>
                  <span style={labelStyle}>Ward / Pole:</span>
                  <span>{l.ward_no || DASH} / {l.pole_no || DASH}</span>
                </div>
              )}
            </div>
          </div>

          {/* Claim Amount Field */}
          <div className="ax-form-field">
            <label htmlFor="modal-claim-amount" className="ax-label" style={{ fontWeight: 600, fontSize: 13, marginBottom: 4, display: 'block' }}>
              Claim Amount (₹) <span style={{ color: 'var(--ax-danger, #ef4444)' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <span
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--ax-text-muted, #64748b)',
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                ₹
              </span>
              <input
                id="modal-claim-amount"
                type="number"
                min="1"
                step="any"
                className="ax-input"
                style={{ paddingLeft: 28, width: '100%' }}
                placeholder="e.g. 50000"
                value={claimAmount}
                onChange={(e) => setClaimAmount(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>

          {/* Claim Invoice Document Upload */}
          <div className="ax-form-field">
            <label htmlFor="modal-claim-invoice" className="ax-label" style={{ fontWeight: 600, fontSize: 13, marginBottom: 4, display: 'block' }}>
              Claim Invoice Document <span style={{ color: 'var(--ax-danger, #ef4444)' }}>*</span>
            </label>
            <input
              id="modal-claim-invoice"
              ref={fileInputRef}
              type="file"
              accept=".pdf,image/png,image/jpeg,image/jpg"
              className="ax-input"
              style={{ width: '100%', padding: '8px' }}
              onChange={(e) => setClaimInvoiceFile(e.target.files?.[0] || null)}
              required
            />
            <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--ax-text-muted, #64748b)' }}>
              Allowed formats: PDF, JPG, PNG (Max 10MB)
            </p>
            {claimInvoiceFile && (
              <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--ax-primary-default, #2563eb)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <span>{claimInvoiceFile.name} ({(claimInvoiceFile.size / 1024).toFixed(1)} KB)</span>
              </div>
            )}
          </div>
        </div>

        <div
          className="ax-modal__footer"
          style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--ax-border, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 10,
          }}
        >
          <button type="button" className="ax-btn ax-btn--secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" className="ax-btn ax-btn--primary" disabled={isSubmitting} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {isSubmitting ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" style={{ animation: 'spin 1s linear infinite' }}>
                  <circle cx="12" cy="12" r="10" strokeOpacity={0.25} />
                  <path d="M12 2a10 10 0 0 1 10 10" />
                </svg>
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Submit Claim Request</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ───────── Image thumbnail (NO BORDER RADIUS) ───────── */
function LightThumbnail({ url, alt, onPreview }: { url: string; alt: string; onPreview: (url: string, title: string) => void }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [url]);

  if (!url || failed) return <span style={{ color: 'var(--ax-text-subtle)' }}>{DASH}</span>;
  return (
    <img
      src={url}
      alt={alt}
      style={{
        width: 34,
        height: 34,
        borderRadius: 0,
        objectFit: 'cover',
        cursor: 'zoom-in',
        border: '1px solid var(--ax-border, #e2e8f0)',
        background: 'var(--ax-surface-subtle, #f8fafc)',
        display: 'block',
        flexShrink: 0,
      }}
      onError={() => setFailed(true)}
      onClick={() => onPreview(url, alt)}
      title="Click to preview"
    />
  );
}

/* ───────── Overlay CSS (modals; global because they render in <body>) ───────── */
const OVERLAY_CSS = `
  .ax-modal img { border-radius: 0 !important; }

  .ula-m-stage {
    position: relative; display: flex; overflow: auto;
    height: min(66vh, 600px); background: var(--ax-surface-subtle, #f1f5f9);
  }
  .ula-m-stage__msg {
    position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 8px;
    font-size: 13px; color: var(--ax-text-muted, #64748b); text-align: center; padding: 16px;
  }
  .ula-m-zoom { display: inline-flex; align-items: center; gap: 8px; }
  .ula-m-zoom__val { min-width: 44px; text-align: center; font-size: 12px; color: var(--ax-text-muted, #64748b); }

  .ula-m-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--ax-space-4, 16px); }
  .ula-m-full { grid-column: 1 / -1; }
  .ula-m-note { margin: 0; font-size: var(--ax-text-sm, 13px); color: var(--ax-text-muted, #64748b); }

  .ula-action-btn {
    display: inline-flex; align-items: center; gap: 6px; height: 30px; padding: 0 12px;
    font-size: 12px; font-weight: 500; border-radius: 0; cursor: pointer;
  }

  @media (max-width: 560px) {
    .ula-m-grid { grid-template-columns: 1fr; }
    .ula-m-stage { height: 56vh; }
  }
`;

/* ───────── Responsive page CSS (same as SRT view) ───────── */
const PAGE_CSS = `
  .solar-erp-page .ax-card { min-width: 0; }
  .solar-erp-page .ax-card__footer { width: 100%; box-sizing: border-box; }
  .solar-erp-page .ula-pagination-left {
    width: 100%; display: flex; justify-content: flex-start; align-items: center; margin: 0; overflow-x: auto;
  }
  .solar-erp-page .ula-pagination-left > * { margin-left: 0 !important; margin-right: 0 !important; }

  .solar-erp-page img,
  .solar-erp-page .ula-table--wide img,
  .solar-erp-page .ax-card img {
    border-radius: 0 !important;
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
  }

  .solar-erp-page .ssl-kpi-grid {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 10px;
    margin-bottom: 14px;
    margin-top: 4px;
  }
  @media (max-width: 1400px) {
    .solar-erp-page .ssl-kpi-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  }
  @media (max-width: 820px) {
    .solar-erp-page .ssl-kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
  @media (max-width: 480px) {
    .solar-erp-page .ssl-kpi-grid { grid-template-columns: 1fr; }
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

/* ───────── Tabs (URL hash: #Completed / #Payment) ───────── */
type TabKey = 'Completed' | 'Payment';

const TABS: { key: TabKey; label: string; hash: string }[] = [
  { key: 'Completed', label: 'Lights Completed', hash: '#Completed' },
  { key: 'Payment', label: 'Payment Lights', hash: '#Payment' },
];

/* ───────── KPI Card Component ───────── */
type KpiTone = 'accent' | 'cyan' | 'emerald' | 'amber' | 'violet' | 'danger';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(37, 99, 235, 0.12)', fg: '#2563eb' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan, #06b6d4) 14%, transparent)', fg: '#0891b2' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald, #10b981) 14%, transparent)', fg: '#16a34a' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber, #f59e0b) 14%, transparent)', fg: '#d97706' },
  violet: { bg: 'color-mix(in oklab, var(--ax-viz-violet, #8b5cf6) 14%, transparent)', fg: '#7c3aed' },
  danger: { bg: 'rgba(239, 68, 68, 0.12)', fg: '#dc2626' },
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
  sub?: string;
}) {
  const t = TONE[tone];

  return (
    <div
      className="ax-card"
      style={{
        padding: '12px 14px',
        borderRadius: 10,
        minWidth: 0,
        cursor: 'default',
        border: '1px solid var(--ax-border, #e2e8f0)',
        background: 'var(--ax-surface, #ffffff)',
        userSelect: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <span
          style={{
            width: 26,
            height: 26,
            borderRadius: 7,
            background: t.bg,
            color: t.fg,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span style={{ width: 14, height: 14, display: 'inline-flex' }}>{icon}</span>
        </span>
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            textTransform: 'uppercase',
            color: 'var(--ax-text-muted)',
            letterSpacing: '0.04em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={label}
        >
          {label}
        </span>
      </div>
      <div
        style={{
          fontSize: 18,
          fontWeight: 800,
          color: t.fg,
          marginTop: 2,
          fontFamily: 'var(--ax-font-display)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {value}
      </div>
      {sub && (
        <div
          style={{
            fontSize: 11,
            color: 'var(--ax-text-muted)',
            marginTop: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={sub}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

/* ───────── Column config ───────── */
interface CellCtx {
  preview: (url: string, title: string) => void;
  raiseClaim: (r: InstalledLightItem) => void;
}

interface Col {
  header: string;
  text: (r: InstalledLightItem) => string;
  render?: (r: InstalledLightItem, ctx: CellCtx) => ReactNode;
  strong?: boolean;
  mono?: boolean;
  wrap?: boolean;
}

const geoCell = (r: InstalledLightItem, which: 'lat' | 'lng') => {
  const lat = String(r.latitude ?? '').trim();
  const lng = String(r.longitude ?? '').trim();
  const val = which === 'lat' ? lat : lng;
  if (!val) return <span style={{ color: 'var(--ax-text-subtle)' }}>{DASH}</span>;
  if (lat && lng && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng))) {
    return (
      <a
        href={`https://www.google.com/maps?q=${lat},${lng}`}
        target="_blank"
        rel="noreferrer"
        style={{ color: 'var(--ax-primary-default, #2563eb)', textDecoration: 'none' }}
        title="Open in Google Maps"
      >
        {val}
      </a>
    );
  }
  return val;
};

const commonCols: Col[] = [
  { header: 'UID', text: (r) => uidOf(r), strong: true },
  { header: 'State', text: (r) => r.state || 'Bihar' },
  { header: 'Phase', text: (r) => String(r.phase ?? '') },
  { header: 'District', text: (r) => r.district || '', strong: true },
  { header: 'Block', text: (r) => r.block || '' },
  { header: 'Panchayat', text: (r) => r.panchayat || r.panchyat || '' },
  { header: 'Ward No.', text: (r) => String(r.ward_no ?? '') },
  { header: 'Pole No.', text: (r) => String(r.pole_no ?? '') },
  { header: 'Beneficiary Name', text: (r) => r.beneficiary_name || '', strong: true },
  { header: 'Beneficiary Contact', text: (r) => r.contact_no || '', mono: true },
  { header: 'Latitude', text: (r) => String(r.latitude ?? ''), render: (r) => geoCell(r, 'lat') },
  { header: 'Longitude', text: (r) => String(r.longitude ?? ''), render: (r) => geoCell(r, 'lng') },
];

const installDateCol: Col = {
  header: 'Install Date',
  text: (r) => (installDateOf(r) ? installDateOf(r).slice(0, 10) : ''),
  mono: true,
};

const durationCol: Col = {
  header: 'Duration / Aging',
  text: (r) => getLightDuration(r).label,
  render: (r) => {
    const d = getLightDuration(r);
    if (isClaimDue(r)) {
      return (
        <span
          className="ax-badge ax-badge--soft ax-badge--warning"
          style={{
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 8px',
            fontSize: 11,
            border: '1px solid #fde68a',
          }}
          title={`Installation completed ${d.label} ago. Approved by admin and ready for claim.`}
        >
          <span style={{ fontSize: 12 }}>⚡</span>
          <span>{d.label} elapsed</span>
        </span>
      );
    }
    if (isClaimRaised(r)) {
      return (
        <span
          style={{ color: 'var(--ax-text-muted)', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}
          title={`Claim raised. Installation duration: ${d.label}`}
        >
          <span>⏱</span>
          <span>{d.label}</span>
        </span>
      );
    }
    return (
      <span style={{ color: 'var(--ax-text-muted)', fontSize: 12 }}>
        {d.label !== DASH ? `${d.label} elapsed` : DASH}
      </span>
    );
  },
};

const tailCols: Col[] = [
  { header: 'Battery No.', text: (r) => r.battery_no || r.battery_serial_no || '', mono: true },
  { header: 'Panel No.', text: (r) => r.panel_no || r.module_no || '', mono: true },
  {
    header: 'Light Image',
    text: (r) => lightImageOf(r),
    render: (r, { preview }) => (
      <LightThumbnail url={lightImageOf(r)} alt={`${uidOf(r)} - Light Photo`} onPreview={preview} />
    ),
  },
  { header: 'Remark', text: (r) => r.remark || r.inst_remark || '', wrap: true },
];

const paymentStatusCol: Col = {
  header: 'Payment Status',
  text: (r) => (pStatusOf(r) === 1 ? 'Paid' : 'Pending'),
  render: (r) => (pStatusOf(r) === 1 ? <Badge tone="success">Paid</Badge> : <Badge tone="warning">Pending</Badge>),
};

const claimStatusCol: Col = {
  header: 'Claim Status',
  text: (r) => (isClaimRaised(r) ? 'Claim Raised' : 'Not Raised'),
  render: (r, { raiseClaim }) => {
    if (isClaimRaised(r)) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-start' }}>
          <Badge tone="success">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Claim Raised</span>
            </span>
          </Badge>
        </div>
      );
    }
    if (isClaimDue(r)) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
          <button
            type="button"
            className="ax-btn ax-btn--primary ax-btn--xs"
            onClick={() => raiseClaim(r)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '3px 9px',
              fontSize: 11,
              fontWeight: 600,
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              background: 'var(--ax-primary-default, #2563eb)',
              color: '#fff',
            }}
            title={`Raise claim request for ${uidOf(r)}`}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span>Raise Claim</span>
          </button>
        </div>
      );
    }
    if (vStatusOf(r) === 2) {
      return <Badge tone="danger"><span>Rejected</span></Badge>;
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-start' }}>
        <Badge tone="neutral"><span>Awaiting Approval</span></Badge>
        <span style={{ fontSize: 10, color: 'var(--ax-text-muted, #64748b)' }}>Claim unlocks after verify</span>
      </div>
    );
  },
};

const COMPLETED_COLS: Col[] = [
  ...commonCols,
  installDateCol,
  durationCol,
  { header: 'Light No.', text: (r) => r.light_no || '', mono: true },
  { header: 'UUID No.', text: (r) => r.uuid_no || '', mono: true },
  ...tailCols,
  {
    header: 'Verify Status',
    text: (r) => (vStatusOf(r) === 1 ? 'Approved' : vStatusOf(r) === 2 ? 'Rejected' : 'Pending'),
    render: (r) => <VerifyBadge value={vStatusOf(r)} />,
  },
  claimStatusCol,
  paymentStatusCol,
];

const PAYMENT_COLS: Col[] = [
  ...commonCols,
  { header: 'IMEI No.', text: (r) => r.imei_no || '', mono: true },
  { header: 'Sim No.', text: (r) => r.sim_no || '', mono: true },
  ...tailCols,
  paymentStatusCol,
];

type ClaimFilter = 'all' | 'due' | 'raised' | 'pending';

/* =========================================================================
 * Main Component
 * ========================================================================= */
export function Bihar_Installation_SSL_InstallationDetail() {
  const location = useLocation();
  const navigate = useNavigate();
  const tab: TabKey = location.hash.toLowerCase() === '#payment' ? 'Payment' : 'Completed';
  const setTab = (k: TabKey) => {
    const t = TABS.find((x) => x.key === k)!;
    navigate({ pathname: location.pathname, search: location.search, hash: t.hash }, { replace: true });
  };
  const isCompleted = tab === 'Completed';

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<InstalledLightsSummary | null>(null);
  const [completeLights, setCompleteLights] = useState<InstalledLightItem[]>([]);
  const [paymentLights, setPaymentLights] = useState<InstalledLightItem[]>([]);

  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') || '');
  const [districtFilter, setDistrictFilter] = useState(() => searchParams.get('district') || 'all');
  const [verifyFilter, setVerifyFilter] = useState(() => searchParams.get('verify') || searchParams.get('status') || 'all');
  const [claimFilter, setClaimFilter] = useState<ClaimFilter>(() => {
    const c = searchParams.get('claim');
    return c === '1' ? 'raised' : c === '0' ? 'pending' : c === 'due' ? 'due' : 'all';
  });
  const [paymentFilter, setPaymentFilter] = useState(() => searchParams.get('payment') || 'all');

  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  // Photo preview modal
  const [preview, setPreview] = useState<{ url: string; title: string } | null>(null);
  const openPreview = useCallback((url: string, title: string) => setPreview({ url, title }), []);
  const closePreview = useCallback(() => setPreview(null), []);

  // Claim modal state
  const [claimModalLight, setClaimModalLight] = useState<InstalledLightItem | null>(null);
  const openClaimModal = useCallback((r: InstalledLightItem) => setClaimModalLight(r), []);

  const deferredQuery = useDeferredValue(searchQuery);

  useEffect(() => {
    if (!toastMsg) return;
    const t = window.setTimeout(() => setToastMsg(null), 4000);
    return () => window.clearTimeout(t);
  }, [toastMsg]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await biharSslInstallationService.getViewInstalledLights();
      if (res) {
        setSummary(res.install_detail || null);
        setCompleteLights(Array.isArray(res.complete_lights) ? res.complete_lights : []);
        setPaymentLights(Array.isArray(res.payment_lights) ? res.payment_lights : []);
      }
    } catch (err: any) {
      console.error('[InstallationDetail] error:', err);
      setToastMsg({ type: 'danger', text: err?.message || 'Failed to load installed lights.' });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleClaimSuccess = useCallback(
    (message: string) => {
      setToastMsg({ type: 'success', text: message });
      setClaimModalLight(null);
      loadData();
    },
    [loadData]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const currentList = isCompleted ? completeLights : paymentLights;

  // ── KPI Summary Calculations ──
  const totalLightsCount = summary?.total !== undefined ? summary.total : (completeLights.length ? 648 : 0);
  const installedLightsCount = summary?.complete !== undefined ? summary.complete : completeLights.length;
  const pendingLightsCount =
    summary?.pending !== undefined ? summary.pending : Math.max(0, Number(totalLightsCount) - Number(installedLightsCount));

  const verifyApprovedCount =
    summary?.verify_approved !== undefined ? summary.verify_approved : completeLights.filter((r) => vStatusOf(r) === 1).length;
  const verifyPendingCount =
    summary?.verify_pending !== undefined ? summary.verify_pending : completeLights.filter((r) => vStatusOf(r) === 0).length;
  const verifyRejectCount =
    summary?.verify_reject !== undefined ? summary.verify_reject : completeLights.filter((r) => vStatusOf(r) === 2).length;

  // Approved but claim not raised yet (ready to claim)
  const readyToClaimCount = completeLights.filter((r) => isClaimDue(r)).length;
  const claimApplicableCount = summary?.claim_applicable !== undefined ? summary.claim_applicable : readyToClaimCount;
  const claimSubmittedCount =
    summary?.claim_raised !== undefined ? summary.claim_raised : completeLights.filter((r) => isClaimRaised(r)).length;
  const claimNotApplicableCount =
    summary?.claim_not_applicable !== undefined
      ? summary.claim_not_applicable
      : Math.max(0, completeLights.length - Number(claimApplicableCount) - Number(claimSubmittedCount));

  const claimVerifyApprovedCount = summary?.claim_verify_approved !== undefined ? summary.claim_verify_approved : 0;
  const claimVerifyPendingCount = summary?.claim_verify_pending !== undefined ? summary.claim_verify_pending : 0;
  const claimVerifyRejectCount = summary?.claim_verify_reject !== undefined ? summary.claim_verify_reject : 0;

  const paymentCompleteCount =
    summary?.payment_complete !== undefined
      ? summary.payment_complete
      : paymentLights.length || completeLights.filter((r) => pStatusOf(r) === 1).length;
  const paymentPendingCount =
    summary?.payment_pending !== undefined
      ? summary.payment_pending
      : Math.max(0, (Number(installedLightsCount) || completeLights.length) - Number(paymentCompleteCount));

  const districts = useMemo(() => {
    const set = new Set<string>();
    currentList.forEach((r) => {
      if (r.district) set.add(r.district.trim());
    });
    return Array.from(set).sort();
  }, [currentList]);

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return currentList.filter((r) => {
      if (q) {
        const fields = [
          r.unique_id, r.uid, r.beneficiary_name, r.contact_no, r.district, r.block, r.panchayat, r.panchyat,
          r.uuid_no, r.light_no, r.battery_no, r.panel_no, r.imei_no, r.sim_no, r.ward_no, r.pole_no,
          installDateOf(r),
        ];
        if (!fields.some((f) => f && String(f).toLowerCase().includes(q))) return false;
      }
      if (districtFilter !== 'all' && r.district?.toLowerCase() !== districtFilter.toLowerCase()) return false;
      if (isCompleted) {
        if (verifyFilter !== 'all' && String(vStatusOf(r)) !== verifyFilter) return false;
        if (claimFilter === 'due' && !isClaimDue(r)) return false;
        if (claimFilter === 'raised' && !isClaimRaised(r)) return false;
        if (claimFilter === 'pending' && isClaimRaised(r)) return false;
      } else {
        if (paymentFilter !== 'all' && String(pStatusOf(r)) !== paymentFilter) return false;
      }
      return true;
    });
  }, [currentList, deferredQuery, districtFilter, verifyFilter, claimFilter, paymentFilter, isCompleted]);

  const { paginatedData, currentPage, pageSize, totalItems, setPage, setPageSize } =
    usePagination({ data: filtered, initialPageSize: 100 });

  useEffect(() => {
    setPage(1);
  }, [deferredQuery, districtFilter, verifyFilter, claimFilter, paymentFilter, tab, setPage]);

  const hasFilters =
    searchQuery.trim() !== '' ||
    districtFilter !== 'all' ||
    (isCompleted && (verifyFilter !== 'all' || claimFilter !== 'all')) ||
    (!isCompleted && paymentFilter !== 'all');

  const resetFilters = () => {
    setSearchQuery('');
    setDistrictFilter('all');
    setVerifyFilter('all');
    setClaimFilter('all');
    setPaymentFilter('all');
    setPage(1);
  };

  /* ───────── Export ───────── */
  const cols = isCompleted ? COMPLETED_COLS : PAYMENT_COLS;
  const exportCols: ExportColumn<InstalledLightItem>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r: InstalledLightItem, idx?: number) => (idx !== undefined ? idx + 1 : '') } as any,
      ...cols.map((c) => ({ header: c.header, accessor: (r: InstalledLightItem) => c.text(r) })),
    ],
    [cols]
  );

  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = isCompleted ? 'Bihar_SSL_Completed_Lights' : 'Bihar_SSL_Payment_Lights';
  const fileTitle = isCompleted ? 'Bihar SSL Completed Lights' : 'Bihar SSL Payment Lights';

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
    const csv = out.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(',')).join('\r\n');
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
      setToastMsg({ type: 'success', text: 'Table data copied to clipboard!' });
    } catch {
      const ta = document.createElement('textarea');
      ta.value = t;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setToastMsg({ type: 'success', text: 'Table data copied to clipboard!' });
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
      table{width:100%;border-collapse:collapse;font-size:10px}th,td{border:1px solid #d8dee6;padding:6px 6px;text-align:left;vertical-align:top}
      th{background:#f3f5f7;font-weight:700}@media print{body{padding:0}@page{size:landscape;margin:10mm}}
    </style></head><body><h1>${escapeHtml(title)}</h1><table><thead><tr>${columns.map((c) => `<th>${escapeHtml(escapeExportValue(c.header))}</th>`).join('')}</tr></thead><tbody>${body.map((r) => `<tr>${r.map((v) => `<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table><script>window.onload=function(){window.print();};</script></body></html>`);
    w.document.close();
    w.focus();
  };

  const TOTAL_COLUMNS = 1 + cols.length + (isCompleted ? 1 : 0);

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="Installation Details"
        subtitle="View installed lights, claims and payment status for Bihar Solar Street Light sites"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Bihar' },
          { label: 'Installation' },
          { label: 'SSL', href: '/v/ssl/installation-dashboard' },
          { label: 'Installation Details' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)', alignItems: 'center' }}>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={loadData} disabled={loading}>
              {ICON_REFRESH}
              <span className="ax-btn__label">Refresh</span>
            </button>
            <Link to="/v/ssl/update-ssl-site-deatils" className="ax-btn ax-btn--primary ax-btn--sm">
              <span className="ax-btn__label">+ Install Light</span>
            </Link>
          </div>
        }
      />

      {toastMsg && (
        <div className={`ax-alert ax-alert--${toastMsg.type}`} style={{ marginBottom: 'var(--ax-space-4)' }} role="status">
          <div className="ax-alert__title">{toastMsg.type === 'success' ? 'Success' : 'Error'}</div>
          <div className="ax-alert__text">{toastMsg.text}</div>
        </div>
      )}

      {/* ── 6 KPI Stat Cards ── */}
      <div className="ssl-kpi-grid">
        <KpiCard
          tone="accent"
          label="Total Light"
          value={
            loading ? '…' : (
              <span>
                <span style={{ color: '#2563eb' }}>{num(totalLightsCount)}</span>
                <span style={{ color: 'var(--ax-text-muted)', fontWeight: 400, margin: '0 4px' }}>/</span>
                <span style={{ color: '#16a34a' }}>{num(installedLightsCount)}</span>
                <span style={{ color: 'var(--ax-text-muted)', fontWeight: 400, margin: '0 4px' }}>/</span>
                <span style={{ color: '#d97706' }}>{num(pendingLightsCount)}</span>
              </span>
            )
          }
          sub="Total / Installed / Pending"
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <line x1="9" y1="18" x2="15" y2="18" />
              <line x1="10" y1="22" x2="14" y2="22" />
              <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
            </svg>
          }
        />

        <KpiCard
          tone="cyan"
          label="Verification"
          value={
            loading ? '…' : (
              <span>
                <span style={{ color: '#16a34a' }}>{num(verifyApprovedCount)}</span>
                <span style={{ color: 'var(--ax-text-muted)', fontWeight: 400, margin: '0 4px' }}>/</span>
                <span style={{ color: '#d97706' }}>{num(verifyPendingCount)}</span>
                <span style={{ color: 'var(--ax-text-muted)', fontWeight: 400, margin: '0 4px' }}>/</span>
                <span style={{ color: '#dc2626' }}>{num(verifyRejectCount)}</span>
              </span>
            )
          }
          sub="Approved / Pending / Rejected"
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          }
        />

        <KpiCard
          tone="amber"
          label="Claim Status"
          value={
            loading ? '…' : (
              <span>
                <span style={{ color: '#0891b2' }}>{num(claimApplicableCount)}</span>
                <span style={{ color: 'var(--ax-text-muted)', fontWeight: 400, margin: '0 4px' }}>/</span>
                <span style={{ color: '#7c3aed' }}>{num(claimSubmittedCount)}</span>
                <span style={{ color: 'var(--ax-text-muted)', fontWeight: 400, margin: '0 4px' }}>/</span>
                <span style={{ color: 'var(--ax-text-muted)' }}>{num(claimNotApplicableCount)}</span>
              </span>
            )
          }
          sub="Applicable / Submitted / Not Applicable"
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          }
        />

        <KpiCard
          tone="violet"
          label="Claim Verify Status"
          value={
            loading ? '…' : (
              <span>
                <span style={{ color: '#16a34a' }}>{num(claimVerifyApprovedCount)}</span>
                <span style={{ color: 'var(--ax-text-muted)', fontWeight: 400, margin: '0 4px' }}>/</span>
                <span style={{ color: '#d97706' }}>{num(claimVerifyPendingCount)}</span>
                <span style={{ color: 'var(--ax-text-muted)', fontWeight: 400, margin: '0 4px' }}>/</span>
                <span style={{ color: '#dc2626' }}>{num(claimVerifyRejectCount)}</span>
              </span>
            )
          }
          sub="Approved / Pending / Rejected"
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
          }
        />

        <KpiCard
          tone="emerald"
          label="Payment Status"
          value={
            loading ? '…' : (
              <span>
                <span style={{ color: '#16a34a' }}>{num(paymentCompleteCount)}</span>
                <span style={{ color: 'var(--ax-text-muted)', fontWeight: 400, margin: '0 4px' }}>/</span>
                <span style={{ color: '#d97706' }}>{num(paymentPendingCount)}</span>
              </span>
            )
          }
          sub="Complete / Pending"
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
          }
        />

        <KpiCard
          tone="accent"
          label="Claim Applicable"
          value={loading ? '…' : num(claimApplicableCount)}
          sub="Eligible for claim"
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
              <line x1="7" y1="7" x2="7.01" y2="7" />
            </svg>
          }
        />
      </div>

      {/* ── Tabs ABOVE Table ── */}
      <div style={{ marginBottom: 'var(--ax-space-3, 12px)' }}>
        <div className="ax-cluster" role="tablist" aria-label="Installed lights tabs" style={{ gap: 'var(--ax-space-2)' }}>
          {TABS.map((t) => {
            const active = t.key === tab;
            const count = t.key === 'Completed' ? completeLights.length : paymentLights.length;
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                id={`ssl-tab-${t.key}`}
                aria-selected={active}
                aria-controls="ssl-tabpanel"
                className={`ax-btn ax-btn--sm ${active ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
                onClick={() => setTab(t.key)}
              >
                <span className="ax-btn__label">{t.label} ({loading ? '…' : count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main Table Card ── */}
      <section className="ax-card ax-col--12" id="ssl-tabpanel" role="tabpanel" aria-labelledby={`ssl-tab-${tab}`}>
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">{isCompleted ? 'Lights Completed' : 'Payment Lights'}</h2>
            <p className="ax-card__subtitle">
              <span className="ax-num">{filtered.length}</span> of <span className="ax-num">{currentList.length}</span> lights
              {isCompleted && (
                <>
                  {' '}· Completed <b className="ax-num">{num(installedLightsCount)}</b> / {num(totalLightsCount)} · Approved <b className="ax-num">{num(verifyApprovedCount)}</b> · Pending Verify <b className="ax-num">{num(verifyPendingCount)}</b> · Claims Raised <b className="ax-num">{num(claimSubmittedCount)}</b> / {num(claimApplicableCount)} · Rejected <b className="ax-num">{num(verifyRejectCount)}</b>
                </>
              )}
              {!isCompleted && (
                <>
                  {' '}· Payment Complete <b className="ax-num">{num(paymentCompleteCount)}</b> · Pending <b className="ax-num">{num(paymentPendingCount)}</b>
                </>
              )}
            </p>
          </div>
          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              <select
                id="ssl_district_filter"
                className="ax-input ax-input--sm"
                style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                value={districtFilter}
                onChange={(e) => {
                  setDistrictFilter(e.target.value);
                  setPage(1);
                }}
                aria-label="Filter by district"
              >
                <option value="all">All Districts</option>
                {districts.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>

              {isCompleted && (
                <>
                  <select
                    id="ssl_verify_filter"
                    className="ax-input ax-input--sm"
                    style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                    value={verifyFilter}
                    onChange={(e) => {
                      setVerifyFilter(e.target.value);
                      setPage(1);
                    }}
                    aria-label="Filter by verification"
                  >
                    <option value="all">All Verification</option>
                    <option value="1">Approved</option>
                    <option value="0">Pending</option>
                    <option value="2">Rejected</option>
                  </select>

                  <select
                    id="ssl_claim_filter"
                    className="ax-input ax-input--sm"
                    style={{ width: 160, height: 32, fontSize: 'var(--ax-text-xs)' }}
                    value={claimFilter}
                    onChange={(e) => {
                      setClaimFilter(e.target.value as ClaimFilter);
                      setPage(1);
                    }}
                    aria-label="Filter by claim status"
                  >
                    <option value="all">All Claim Status</option>
                    <option value="due">Claim Applicable (Ready)</option>
                    <option value="raised">Claim Raised</option>
                    <option value="pending">Awaiting Approval</option>
                  </select>
                </>
              )}

              {!isCompleted && (
                <select
                  id="ssl_payment_filter"
                  className="ax-input ax-input--sm"
                  style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                  value={paymentFilter}
                  onChange={(e) => {
                    setPaymentFilter(e.target.value);
                    setPage(1);
                  }}
                  aria-label="Filter by payment status"
                >
                  <option value="all">All Payment Status</option>
                  <option value="1">Paid</option>
                  <option value="0">Pending</option>
                </select>
              )}

              {hasFilters && (
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--sm"
                  onClick={resetFilters}
                  style={{ height: 30, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }}
                >
                  Reset
                </button>
              )}

              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search UID, contact, pole…"
                size="sm"
                ariaLabel="Search installed lights"
              />

              <TableExportToolbar
                onCopy={() => copyToClipboard(filtered, exportCols)}
                onExportCSV={() => exportToCSV(filtered, exportCols, `${fileBase}_${stamp}`)}
                onExportExcel={() => exportToExcel(filtered, exportCols, `${fileBase}_${stamp}`)}
                onExportPDF={() => exportToPDF(filtered, exportCols, fileTitle)}
              />
            </div>
          </div>
        </div>

        <div className="ax-table-wrap">
          <table
            className="ax-table ax-table--hover"
            style={{ whiteSpace: 'nowrap', minWidth: isCompleted ? 2900 : 2200 }}
          >
            <caption className="ax-visually-hidden">{isCompleted ? 'Lights Completed' : 'Payment Lights'}</caption>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th" scope="col">Sr. No.</th>
                {cols.map((c) => (
                  <th key={c.header} className="ax-table__th" scope="col">{c.header}</th>
                ))}
                {isCompleted && <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Action</th>}
              </tr>
            </thead>
            <tbody aria-busy={loading}>
              {loading && (
                <tr>
                  <td className="ax-table__td" colSpan={TOTAL_COLUMNS} style={centerCell}>
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading installed lights from server…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td className="ax-table__td" colSpan={TOTAL_COLUMNS} style={{ padding: 0 }}>
                    <TableEmptyState
                      title={isCompleted ? 'No completed lights found' : 'No payment lights found'}
                      message={
                        hasFilters
                          ? 'No records match your filters or search. Try clearing your query.'
                          : isCompleted
                            ? 'Lights will appear here once installation is completed.'
                            : 'Lights will appear here once they reach the payment stage.'
                      }
                      onClear={hasFilters ? resetFilters : undefined}
                      clearLabel="Clear filters"
                    />
                  </td>
                </tr>
              )}
              {!loading &&
                paginatedData.map((r, idx) => {
                  const claimDue = isCompleted && isClaimDue(r);
                  return (
                    <tr
                      key={r.id || idx}
                      className="ax-table__row"
                      style={claimDue ? { background: 'rgba(245, 158, 11, 0.04)' } : undefined}
                    >
                      <td className="ax-table__td ax-num">{(currentPage - 1) * pageSize + idx + 1}</td>
                      {cols.map((c) => {
                        const content = c.render
                          ? c.render(r, { preview: openPreview, raiseClaim: openClaimModal })
                          : c.text(r) || DASH;
                        return (
                          <td
                            key={c.header}
                            className="ax-table__td"
                            title={c.wrap ? c.text(r) : undefined}
                            style={{
                              ...(c.strong ? { fontWeight: 600, color: 'var(--ax-text-strong)' } : null),
                              ...(c.mono ? { fontFamily: 'var(--ax-font-mono)', fontSize: 12 } : null),
                              ...(c.wrap ? { maxWidth: 200, whiteSpace: 'normal', fontSize: 12 } : null),
                            }}
                          >
                            {content}
                          </td>
                        );
                      })}
                      {isCompleted && (
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          {vStatusOf(r) === 1 ? (
                            <span
                              className="ax-btn ax-btn--secondary ax-btn--sm ula-action-btn"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                opacity: 0.6,
                                cursor: 'not-allowed',
                                pointerEvents: 'none',
                                textDecoration: 'none',
                              }}
                              title="Approved — editing is locked"
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                              </svg>
                              <span>Locked</span>
                            </span>
                          ) : (
                            <Link
                              to={`/v/ssl/update-ssl-site-deatils?id=${r.id}&edit=true`}
                              state={{ light: r, mode: 'edit' }}
                              className="ax-btn ax-btn--secondary ax-btn--sm ula-action-btn"
                              style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                              title="Edit Installation Details"
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                              <span>Edit</span>
                            </Link>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* ── Table Footer ── */}
        <div className="ax-card__footer" style={footerStyle}>
          <div className="ula-pagination-left">
            <Pagination
              currentPage={currentPage}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[25, 50, 100, 200]}
            />
          </div>
        </div>
      </section>

      {/* ── Photo Preview Modal ── */}
      {preview && <ImagePreviewModal url={preview.url} title={preview.title} onClose={closePreview} />}

      {/* ── Raise Claim Modal ── */}
      {claimModalLight && (
        <RaiseClaimModal
          light={claimModalLight}
          onClose={() => setClaimModalLight(null)}
          onSuccess={handleClaimSuccess}
        />
      )}
    </div>
  );
}

export default Bihar_Installation_SSL_InstallationDetail;