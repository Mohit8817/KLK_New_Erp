import { useState, useMemo, useEffect, useCallback, useRef, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  goaSrtInstallationService,
  getGoaSrtInstallationImageCandidates,
  type GoaSrtCompletedData,
  type GoaSrtInstalledSiteItem,
} from '../../goa-services/goaSrtInstallationService';
import {
  Pagination,
  usePagination,
  SearchInput,
  TableExportToolbar,
  TableEmptyState,
  type ExportColumn,
} from '../../../../../common';

const ICON_REFRESH = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
    <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
  </svg>
);

const DASH = '—';

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

const Badge = ({ tone, children }: { tone: Tone; children: ReactNode }) => (
  <span className={`ax-badge ax-badge--soft ax-badge--${tone}`}>{children}</span>
);

const VerifyBadge = ({ value }: { value: number }) =>
  value === 1 ? <Badge tone="success">Approved</Badge>
    : value === 2 ? <Badge tone="danger">Rejected</Badge>
      : <Badge tone="warning">Pending</Badge>;

const txt = (row: GoaSrtInstalledSiteItem, key: string): string => {
  const v = (row as Record<string, any>)[key];
  if (v === null || v === undefined || v === '') return '';
  return String(v);
};

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

  const isoStr = s.replace(' ', 'T');
  const t = new Date(isoStr).getTime();
  if (!isNaN(t)) return t;

  return null;
}

function computeDurationDays(startStr?: string | null, endStr?: string | null): number | null {
  const startMs = parseDateMs(startStr);
  if (startMs === null) return null;
  const endMs = endStr ? parseDateMs(endStr) : Date.now();
  if (endMs === null) return null;
  const diffMs = endMs - startMs;
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

function formatDurationLabel(days: number | null): string {
  if (days === null) return '—';
  if (days === 0) return 'Today';
  if (days === 1) return '1 Day';
  return `${days} Days`;
}

function getSiteDuration(row: GoaSrtInstalledSiteItem): {
  days: number | null;
  label: string;
} {
  let days: number | null = null;
  if ((row as any).duration !== undefined && (row as any).duration !== null && (row as any).duration !== '') {
    const d = Number((row as any).duration);
    if (!isNaN(d)) days = d;
  } else if ((row as any).claim_duration !== undefined && (row as any).claim_duration !== null && (row as any).claim_duration !== '') {
    const d = Number((row as any).claim_duration);
    if (!isNaN(d)) days = d;
  }

  if (days === null) {
    const installDate = row.inst_date || (row as any).created_at || (row as any).date;
    const claimDate = row.inst_claim_date || (row as any).claim_date;
    if (claimDate && installDate) {
      days = computeDurationDays(installDate, claimDate);
    } else if (installDate) {
      days = computeDurationDays(installDate);
    }
  }

  return {
    days,
    label: formatDurationLabel(days),
  };
}

const isSiteClaimRaised = (row: GoaSrtInstalledSiteItem): boolean => {
  const st = Number(row.inst_claim_status ?? (row as any).claim_status ?? 0);
  return st !== 0;
};

/* ───────── Modal (design-system dialog: portal to <body>, focus trap, Esc to close) ───────── */
const X_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

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
    <Modal open onClose={onClose} labelledBy="srt-preview-title" dialogClass="ax-modal__dialog--lg">
      <div className="ax-modal__header">
        <h2 className="ax-modal__title" id="srt-preview-title">{title || 'Media Preview'}</h2>
        <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">{X_ICON}</button>
      </div>

      <div className="ax-modal__body" style={{ padding: 0 }}>
        <div className="ula-m-stage">
          {status === 'loading' && (
            <div className="ula-m-stage__msg"><span className="ax-spinner" /> Loading image…</div>
          )}
          {status === 'error' && (
            <div className="ula-m-stage__msg">Image could not be loaded. Try opening it in a new tab.</div>
          )}
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

/* ───────── Raise Installation Claim Modal (Bihar SRT pattern) ───────── */
function RaiseClaimModal({
  site,
  onClose,
  onSuccess,
}: {
  site: GoaSrtInstalledSiteItem;
  onClose: () => void;
  onSuccess: (message: string) => void;
}) {
  const [claimAmount, setClaimAmount] = useState('');
  const [claimRemarks, setClaimRemarks] = useState('');
  const [claimInvoiceFile, setClaimInvoiceFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

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
    const trimmedRemarks = claimRemarks.trim();
    if (!trimmedRemarks) {
      setError('Please enter remarks.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const fd = new FormData();
      fd.append('site_id', String(site.id));
      fd.append('srt_id', String(site.id));
      fd.append('inst_claim_amount', claimAmount.trim());
      fd.append('claim_amount', claimAmount.trim());
      fd.append('amount', claimAmount.trim());
      fd.append('remarks', trimmedRemarks);
      fd.append('claim_remarks', trimmedRemarks);
      fd.append('inst_claim_remarks', trimmedRemarks);
      fd.append('inst_claim_invoice', claimInvoiceFile);
      fd.append('claim_invoice', claimInvoiceFile);
      fd.append('invoice', claimInvoiceFile);

      const res = await goaSrtInstallationService.raiseClaim(fd);
      onSuccess(res?.message || 'Claim request submitted successfully!');
    } catch (err: any) {
      console.error('[Goa RaiseClaimModal] submit error:', err);
      setError(err?.message || 'Failed to submit claim request. Please check inputs and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const mutedBlock = { color: 'var(--ax-text-muted, #64748b)', display: 'block' } as const;

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
            <h3
              id="raise-claim-modal-title"
              style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ax-text-strong, #0f172a)' }}
            >
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

          {/* Site Overview Details Card */}
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
                <span style={mutedBlock}>Site Name:</span>
                <strong style={{ color: 'var(--ax-text-strong, #0f172a)' }}>{site.site_name || DASH}</strong>
              </div>
              <div>
                <span style={mutedBlock}>CA Number:</span>
                <strong style={{ fontFamily: 'var(--ax-font-mono, monospace)', color: 'var(--ax-text-strong, #0f172a)' }}>
                  {site.ca_no || DASH}
                </strong>
              </div>
              <div>
                <span style={mutedBlock}>District / State:</span>
                <span>{txt(site, 'district') || DASH}, {txt(site, 'state') || 'Goa'}</span>
              </div>
              <div>
                <span style={mutedBlock}>Contact Person:</span>
                <span>{site.contact_person || DASH} {site.contact_number ? `(${site.contact_number})` : ''}</span>
              </div>
              <div>
                <span style={mutedBlock}>Install Date:</span>
                <strong style={{ color: 'var(--ax-text-strong, #0f172a)' }}>{site.inst_date || (site as any).created_at || DASH}</strong>
              </div>
              <div>
                <span style={mutedBlock}>Duration Elapsed:</span>
                <span className="ax-badge ax-badge--soft ax-badge--warning" style={{ fontWeight: 700, fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <span>⏱</span>
                  <span>{getSiteDuration(site).label}</span>
                </span>
              </div>
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
                disabled={isSubmitting}
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
              disabled={isSubmitting}
            />
            <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--ax-text-muted, #64748b)' }}>
              Allowed formats: PDF, JPG, PNG (Max 10MB)
            </p>
            {claimInvoiceFile && (
              <div
                style={{
                  marginTop: 6,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 12,
                  color: 'var(--ax-primary-default, #2563eb)',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <span>{claimInvoiceFile.name} ({(claimInvoiceFile.size / 1024).toFixed(1)} KB)</span>
              </div>
            )}
          </div>

          {/* Remarks (Required by API) */}
          <div className="ax-form-field">
            <label htmlFor="modal-claim-remarks" className="ax-label" style={{ fontWeight: 600, fontSize: 13, marginBottom: 4, display: 'block' }}>
              Remarks <span style={{ color: 'var(--ax-danger, #ef4444)' }}>*</span>
            </label>
            <input
              id="modal-claim-remarks"
              type="text"
              className="ax-input"
              style={{ width: '100%' }}
              placeholder="e.g. Work verified on site, invoice raised"
              value={claimRemarks}
              onChange={(e) => setClaimRemarks(e.target.value)}
              required
              disabled={isSubmitting}
            />
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

/* ───────── Installation Thumbnail: Strict NO BORDER RADIUS ───────── */
function InstallationThumbnail({
  src,
  alt,
  onPreview,
}: {
  src?: string | null;
  alt: string;
  onPreview: (url: string, title: string) => void;
}) {
  const [candidateIdx, setCandidateIdx] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setCandidateIdx(0);
    setFailed(false);
  }, [src]);

  const candidates = useMemo(() => getGoaSrtInstallationImageCandidates(src), [src]);

  if (!src || candidates.length === 0 || failed) {
    return <span style={{ color: 'var(--ax-text-subtle)' }}>{DASH}</span>;
  }

  const currentUrl = candidates[candidateIdx] || '';

  return (
    <img
      src={currentUrl}
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
      onError={() => {
        if (candidateIdx + 1 < candidates.length) {
          setCandidateIdx((i) => i + 1);
        } else {
          setFailed(true);
        }
      }}
      onClick={() => onPreview(currentUrl, alt)}
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

  .ula-action-btn {
    display: inline-flex; align-items: center; gap: 6px; height: 30px; padding: 0 12px;
    font-size: 12px; font-weight: 500; border-radius: 0; cursor: pointer;
  }

  @media (max-width: 560px) {
    .ula-m-stage { height: 56vh; }
  }
`;

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

  .solar-erp-page .srt-kpi-grid {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 10px;
    margin-bottom: 14px;
    margin-top: 4px;
  }
  @media (max-width: 1400px) {
    .solar-erp-page .srt-kpi-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  }
  @media (max-width: 960px) {
    .solar-erp-page .srt-kpi-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  }
  @media (max-width: 640px) {
    .solar-erp-page .srt-kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
  @media (max-width: 420px) {
    .solar-erp-page .srt-kpi-grid { grid-template-columns: 1fr; }
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
const monoCell = { fontFamily: 'var(--ax-font-mono)', fontSize: '12px' } as const;

/* ───────── Tabs (one page, two datasets; URL hash: #Completed / #Payment) ───────── */
type TabKey = 'completed' | 'payment';

const TABS: { key: TabKey; label: string; hash: string }[] = [
  { key: 'completed', label: 'Completed SRT Data', hash: '#Completed' },
  { key: 'payment', label: 'Payment SRT Data', hash: '#Payment' },
];

const COMMON_HEADERS = [
  'Sr. No.', 'State', 'District', 'Site Name', 'Install Date', 'Duration / Aging',
  'Contact Person', 'Contact Number', 'CA No.',
  'Solar Meter No.', 'Inverter No.', 'Net/Smart Meter No.', 'Loger No.',
  'System Image', 'Inverter Image', 'Panel Image', 'Net Meter/Smart Meter Image', 'Loger Image',
  'Latitude', 'Longitude', 'Remark',
];

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
      <div style={{ fontSize: 22, fontWeight: 800, color: t.fg, marginTop: 2, fontFamily: 'var(--ax-font-display)' }}>
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

/* =========================================================================
 * Main Component
 * ========================================================================= */
export function Goa_Installation_SRT_ViewInstallation() {
  const location = useLocation();
  const navigate = useNavigate();
  const tab: TabKey = location.hash.toLowerCase() === '#payment' ? 'payment' : 'completed';
  const setTab = (k: TabKey) => {
    const t = TABS.find((x) => x.key === k)!;
    navigate({ pathname: location.pathname, search: location.search, hash: t.hash }, { replace: true });
  };

  const [searchParams] = useSearchParams();
  const [data, setData] = useState<GoaSrtCompletedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(() => searchParams.get('district') || searchParams.get('search') || '');
  const [districtFilter, setDistrictFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') || 'all');
  const [claimFilter, setClaimFilter] = useState<'all' | 'due' | 'raised' | 'pending'>('all');

  // Photo preview modal
  const [preview, setPreview] = useState<{ url: string; title: string } | null>(null);
  const openPreview = useCallback((url: string, title: string) => setPreview({ url, title }), []);
  const closePreview = useCallback(() => setPreview(null), []);

  // Claim modal state
  const [claimModalSite, setClaimModalSite] = useState<GoaSrtInstalledSiteItem | null>(null);

  // Toast / feedback message
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  useEffect(() => {
    if (!toastMsg) return;
    const t = window.setTimeout(() => setToastMsg(null), 4000);
    return () => window.clearTimeout(t);
  }, [toastMsg]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await goaSrtInstallationService.getCompletedData();
      if (resp) setData(resp);
    } catch (err: any) {
      console.error('[Goa SRT ViewInstallation] load error:', err);
      setToastMsg({ type: 'danger', text: err?.message || 'Failed to load installation sites.' });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleClaimSuccess = useCallback(
    (message: string) => {
      setToastMsg({ type: 'success', text: message });
      setClaimModalSite(null);
      loadData();
    },
    [loadData]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Two datasets from the same API response
  const completeSites: GoaSrtInstalledSiteItem[] = useMemo(
    () => (Array.isArray(data?.completesite) ? data!.completesite : []),
    [data]
  );
  const paymentSites: GoaSrtInstalledSiteItem[] = useMemo(
    () => (Array.isArray(data?.paymentsite) ? data!.paymentsite : []),
    [data]
  );
  const activeSites = tab === 'completed' ? completeSites : paymentSites;
  const isCompleted = tab === 'completed';

  // Summary counts for 11 KPIs
  const approvedCount = useMemo(
    () => (data?.approvedsite !== undefined ? data.approvedsite : completeSites.filter((s) => Number(s.inst_verify_status) === 1).length),
    [data, completeSites]
  );
  const pendingCount = useMemo(
    () => (data?.verifypending !== undefined ? data.verifypending : completeSites.filter((s) => !s.inst_verify_status || Number(s.inst_verify_status) === 0).length),
    [data, completeSites]
  );
  const rejectedCount = useMemo(
    () => (data?.rejectsite !== undefined ? data.rejectsite : completeSites.filter((s) => Number(s.inst_verify_status) === 2).length),
    [data, completeSites]
  );
  const claimRaisedCount = useMemo(
    () => (data?.claimraised !== undefined ? data.claimraised : completeSites.filter((s) => isSiteClaimRaised(s)).length),
    [data, completeSites]
  );
  const readyToClaimCount = useMemo(
    () => (data?.claimedapplicable !== undefined ? data.claimedapplicable : completeSites.filter((s) => Number(s.inst_verify_status) === 1 && !isSiteClaimRaised(s)).length),
    [data, completeSites]
  );
  const totalAssignedSitesCount = useMemo(
    () => (data?.totalsite !== undefined ? data.totalsite : completeSites.length + (data?.pendingsite || 0)),
    [data, completeSites]
  );
  const completeSitesCount = useMemo(
    () => (data?.complete !== undefined ? data.complete : completeSites.length),
    [data, completeSites]
  );
  const pendingSitesCount = useMemo(
    () => (data?.pendingsite !== undefined ? data.pendingsite : 0),
    [data]
  );
  const docSubmitCount = useMemo(
    () => (data?.docsubmit !== undefined ? data.docsubmit : 0),
    [data]
  );
  const payment70Count = useMemo(
    () => (data?.payment1 !== undefined ? data.payment1 : paymentSites.filter((s: any) => s.payment1_status).length),
    [data, paymentSites]
  );
  const payment15Count = useMemo(
    () => (data?.payment2 !== undefined ? data.payment2 : paymentSites.filter((s: any) => s.payment2_status).length),
    [data, paymentSites]
  );

  // Available districts for dropdown
  const districts = useMemo(() => {
    const set = new Set<string>();
    activeSites.forEach((s) => {
      const d = txt(s, 'district')?.trim();
      if (d) set.add(d);
    });
    return Array.from(set).sort();
  }, [activeSites]);

  // Filtered sites
  const filteredSites = useMemo(() => {
    let list = activeSites;

    if (districtFilter !== 'all') {
      list = list.filter((s) => txt(s, 'district').toLowerCase() === districtFilter.toLowerCase());
    }

    if (isCompleted) {
      if (statusFilter === 'approved') list = list.filter((s) => Number(s.inst_verify_status) === 1);
      else if (statusFilter === 'rejected') list = list.filter((s) => Number(s.inst_verify_status) === 2);
      else if (statusFilter === 'pending') list = list.filter((s) => !s.inst_verify_status || Number(s.inst_verify_status) === 0);

      if (claimFilter === 'due') {
        list = list.filter((s) => Number(s.inst_verify_status) === 1 && !isSiteClaimRaised(s));
      } else if (claimFilter === 'raised') {
        list = list.filter((s) => isSiteClaimRaised(s));
      } else if (claimFilter === 'pending') {
        list = list.filter((s) => !isSiteClaimRaised(s));
      }
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((s) => {
        return (
          String(s.id).includes(q) ||
          txt(s, 'state').toLowerCase().includes(q) ||
          txt(s, 'district').toLowerCase().includes(q) ||
          String(s.site_name || '').toLowerCase().includes(q) ||
          String(s.contact_person || '').toLowerCase().includes(q) ||
          String(s.contact_number || '').toLowerCase().includes(q) ||
          String(s.ca_no || '').toLowerCase().includes(q) ||
          String(s.solarmeter_no || '').toLowerCase().includes(q) ||
          String(s.inverter_no || '').toLowerCase().includes(q) ||
          String(s.nm_sm_no || '').toLowerCase().includes(q) ||
          String(s.loger_no || '').toLowerCase().includes(q) ||
          String(s.inst_date || '').toLowerCase().includes(q) ||
          String(s.inst_claim_amount || '').toLowerCase().includes(q) ||
          String(s.inst_claim_date || '').toLowerCase().includes(q)
        );
      });
    }
    return list;
  }, [activeSites, districtFilter, isCompleted, statusFilter, claimFilter, search]);

  const { paginatedData, currentPage, pageSize, totalItems, setPage, setPageSize } =
    usePagination({ data: filteredSites, initialPageSize: 100 });

  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, districtFilter, statusFilter, claimFilter, tab]);

  const hasFilters = search.trim() !== '' || districtFilter !== 'all' || (isCompleted && (statusFilter !== 'all' || claimFilter !== 'all'));
  const resetFilters = () => {
    setSearch('');
    setDistrictFilter('all');
    setStatusFilter('all');
    setClaimFilter('all');
    setPage(1);
  };

  // Export Columns (per tab)
  const exportCols: ExportColumn<GoaSrtInstalledSiteItem>[] = useMemo(() => {
    const common: ExportColumn<GoaSrtInstalledSiteItem>[] = [
      { header: 'Sr. No.', accessor: (_r: GoaSrtInstalledSiteItem, idx?: number) => (idx !== undefined ? idx + 1 : '') } as any,
      { header: 'State', accessor: (r) => txt(r, 'state') || 'Goa' },
      { header: 'District', accessor: (r) => txt(r, 'district') },
      { header: 'Site Name', accessor: (r) => r.site_name || '' },
      { header: 'Install Date', accessor: (r) => r.inst_date || (r as any).created_at || '' },
      { header: 'Duration / Aging', accessor: (r) => getSiteDuration(r).label },
      { header: 'Contact Person', accessor: (r) => r.contact_person || '' },
      { header: 'Contact Number', accessor: (r) => r.contact_number || '' },
      { header: 'CA No.', accessor: (r) => r.ca_no || '' },
      { header: 'Solar Meter No.', accessor: (r) => r.solarmeter_no || '' },
      { header: 'Inverter No.', accessor: (r) => r.inverter_no || '' },
      { header: 'Net/Smart Meter No.', accessor: (r) => r.nm_sm_no || '' },
      { header: 'Loger No.', accessor: (r) => r.loger_no || '' },
      { header: 'System Image', accessor: (r) => r.system_image || '' },
      { header: 'Inverter Image', accessor: (r) => r.inverter_image || '' },
      { header: 'Panel Image', accessor: (r) => r.panel_image || '' },
      { header: 'Net Meter/Smart Meter Image', accessor: (r) => r.nm_sm_image || '' },
      { header: 'Loger Image', accessor: (r) => r.loger_image || '' },
      { header: 'Latitude', accessor: (r) => txt(r, 'inst_latitude') },
      { header: 'Longitude', accessor: (r) => txt(r, 'inst_longitude') },
      { header: 'Remark', accessor: (r) => r.inst_remarks || '' },
    ];
    if (tab === 'payment') return common;
    return [
      ...common,
      {
        header: 'Verify Status',
        accessor: (r) =>
          Number(r.inst_verify_status) === 1 ? 'Approved' : Number(r.inst_verify_status) === 2 ? 'Rejected' : 'Pending',
      },
      { header: 'Claim Status', accessor: (r) => (isSiteClaimRaised(r) ? 'Claim Raised' : 'Not Raised') },
      { header: 'Claim Amount', accessor: (r) => (r.inst_claim_amount ? String(r.inst_claim_amount) : '') },
    ];
  }, [tab]);

  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = isCompleted ? 'Goa_SRT_Completed' : 'Goa_SRT_Payment';
  const fileTitle = isCompleted ? 'Goa SRT Completed Data' : 'Goa SRT Payment Data';

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

  const headers = isCompleted ? [...COMMON_HEADERS, 'Verify Status', 'Claim Status', 'Action'] : COMMON_HEADERS;
  const TOTAL_COLUMNS = headers.length;

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="View Goa SRT Installation"
        subtitle="Master register of completed solar rooftop installations, payment sites, verification evidence, and compliance documents"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Goa' },
          { label: 'Installation' },
          { label: 'SRT', href: '/v/goa/vendor-srt-installation-dashboard' },
          { label: 'View Installation' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)', alignItems: 'center' }}>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={loadData} disabled={loading}>
              {ICON_REFRESH}
              <span className="ax-btn__label">Refresh</span>
            </button>
            <Link to="/v/goa/srt/installationsite" className="ax-btn ax-btn--primary ax-btn--sm">
              <span className="ax-btn__label">+ New Installation</span>
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

      {/* ── 11 KPI Stat Cards ── */}
      <div className="srt-kpi-grid">
        <KpiCard
          tone="accent"
          label="Total Assigned Sites"
          value={loading ? '…' : Number(totalAssignedSitesCount).toLocaleString('en-IN')}
          sub="Total assigned rooftop sites"
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <path d="M8 9h8M8 13h8M8 17h5" />
            </svg>
          }
        />

        <KpiCard
          tone="emerald"
          label="Complete Sites"
          value={loading ? '…' : Number(completeSitesCount).toLocaleString('en-IN')}
          sub="Installation completed"
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          }
        />

        <KpiCard
          tone="amber"
          label="Pending"
          value={loading ? '…' : Number(pendingSitesCount).toLocaleString('en-IN')}
          sub="Installation pending"
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
        />

        <KpiCard
          tone="cyan"
          label="Approve Sites"
          value={loading ? '…' : Number(approvedCount).toLocaleString('en-IN')}
          sub="Verified & approved"
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
          }
        />

        <KpiCard
          tone="danger"
          label="Reject Sites"
          value={loading ? '…' : Number(rejectedCount).toLocaleString('en-IN')}
          sub="Inspection rejected"
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          }
        />

        <KpiCard
          tone="amber"
          label="Verify Pending"
          value={loading ? '…' : Number(pendingCount).toLocaleString('en-IN')}
          sub="Awaiting verification"
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          }
        />

        <KpiCard
          tone="cyan"
          label="Claim Applicable"
          value={loading ? '…' : Number(readyToClaimCount).toLocaleString('en-IN')}
          sub="Eligible for claim"
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
          label="Claim Raised"
          value={loading ? '…' : Number(claimRaisedCount).toLocaleString('en-IN')}
          sub="Invoices lodged"
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          }
        />

        <KpiCard
          tone="emerald"
          label="DOC Submit"
          value={loading ? '…' : Number(docSubmitCount).toLocaleString('en-IN')}
          sub="Documents submitted"
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 11 12 14 22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          }
        />

        <KpiCard
          tone="emerald"
          label="Payment 70%"
          value={loading ? '…' : Number(payment70Count).toLocaleString('en-IN')}
          sub="70% disbursed"
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          }
        />

        <KpiCard
          tone="amber"
          label="Payment 15%"
          value={loading ? '…' : Number(payment15Count).toLocaleString('en-IN')}
          sub="15% disbursed"
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 14 14" />
            </svg>
          }
        />
      </div>

      {/* ── Tabs ABOVE Table ── */}
      <div style={{ marginBottom: 'var(--ax-space-3, 12px)' }}>
        <div className="ax-cluster" role="tablist" aria-label="Installed SRT tabs" style={{ gap: 'var(--ax-space-2)' }}>
          {TABS.map((t) => {
            const active = t.key === tab;
            const count = t.key === 'completed' ? completeSites.length : paymentSites.length;
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                id={`goa-srt-tab-${t.key}`}
                aria-selected={active}
                aria-controls="goa-srt-tabpanel"
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
      <section className="ax-card ax-col--12" id="goa-srt-tabpanel" role="tabpanel" aria-labelledby={`goa-srt-tab-${tab}`}>
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">{isCompleted ? 'Completed SRT Data' : 'Payment SRT Data'}</h2>
            <p className="ax-card__subtitle">
              <span className="ax-num">{filteredSites.length}</span> of <span className="ax-num">{activeSites.length}</span> installations
              {isCompleted && (
                <>
                  {' '}· Completed <b className="ax-num">{completeSitesCount}</b> / {totalAssignedSitesCount} · Approved <b className="ax-num">{approvedCount}</b> · Pending Verify <b className="ax-num">{pendingCount}</b> · Claims Raised <b className="ax-num">{claimRaisedCount}</b> / {readyToClaimCount} · Rejected <b className="ax-num">{rejectedCount}</b>
                </>
              )}
              {!isCompleted && (
                <>
                  {' '}· 70% Payment <b className="ax-num">{payment70Count}</b> · 15% Payment <b className="ax-num">{payment15Count}</b>
                </>
              )}
            </p>
          </div>
          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              <select
                id="goa_district_filter"
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
                    id="goa_status_filter"
                    className="ax-input ax-input--sm"
                    style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setPage(1);
                    }}
                    aria-label="Filter by verify status"
                  >
                    <option value="all">All Verification</option>
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                  </select>

                  <select
                    id="goa_claim_filter"
                    className="ax-input ax-input--sm"
                    style={{ width: 160, height: 32, fontSize: 'var(--ax-text-xs)' }}
                    value={claimFilter}
                    onChange={(e) => {
                      setClaimFilter(e.target.value as any);
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
                value={search}
                onChange={setSearch}
                placeholder="Search site, CA no, person, meter…"
                size="sm"
                ariaLabel="Search installed sites"
              />

              <TableExportToolbar
                onCopy={() => copyToClipboard(filteredSites, exportCols)}
                onExportCSV={() => exportToCSV(filteredSites, exportCols, `${fileBase}_${stamp}`)}
                onExportExcel={() => exportToExcel(filteredSites, exportCols, `${fileBase}_${stamp}`)}
                onExportPDF={() => exportToPDF(filteredSites, exportCols, fileTitle)}
              />
            </div>
          </div>
        </div>

        <div className="ax-table-wrap">
          <table
            className="ax-table ax-table--hover"
            style={{ whiteSpace: 'nowrap', minWidth: isCompleted ? 2800 : 2200 }}
          >
            <caption className="ax-visually-hidden">{isCompleted ? 'Completed SRT Data' : 'Payment SRT Data'}</caption>
            <thead className="ax-table__head">
              <tr>
                {headers.map((h) => (
                  <th
                    key={h}
                    className="ax-table__th"
                    scope="col"
                    style={h === 'Action' ? { textAlign: 'center' } : undefined}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody aria-busy={loading}>
              {loading && (
                <tr>
                  <td className="ax-table__td" colSpan={TOTAL_COLUMNS} style={centerCell}>
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading installation records…
                  </td>
                </tr>
              )}
              {!loading && filteredSites.length === 0 && (
                <tr>
                  <td className="ax-table__td" colSpan={TOTAL_COLUMNS} style={{ padding: 0 }}>
                    <TableEmptyState
                      title={isCompleted ? 'No completed installation records found' : 'No payment records found'}
                      message={
                        hasFilters
                          ? 'No records match your filters or search. Try clearing your query.'
                          : isCompleted
                            ? 'Completed sites will appear here once installation work is recorded.'
                            : 'Payment sites will appear here once payments are processed.'
                      }
                      onClear={hasFilters ? resetFilters : undefined}
                      clearLabel="Clear filters"
                    />
                  </td>
                </tr>
              )}
              {!loading &&
                paginatedData.map((row, index) => {
                  const lat = txt(row, 'inst_latitude');
                  const lng = txt(row, 'inst_longitude');
                  const hasGeo = lat !== '' && lng !== '' && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng));
                  const siteLabel = row.site_name || 'Site';
                  const siteClaimRaised = isSiteClaimRaised(row);
                  const isApproved = Number(row.inst_verify_status) === 1;
                  const isClaimDue = isApproved && !siteClaimRaised;
                  const siteDuration = getSiteDuration(row);
                  const installDateStr = row.inst_date || (row as any).created_at || (row as any).date;
                  const fmtInstallDate = installDateStr ? String(installDateStr).slice(0, 10) : DASH;
                  const verifyVal = Number(row.inst_verify_status ?? (row as any).verify_status ?? 0);

                  return (
                    <tr
                      key={row.id}
                      className="ax-table__row"
                      style={isClaimDue ? { background: 'rgba(245, 158, 11, 0.04)' } : undefined}
                    >
                      <td className="ax-table__td ax-num">{(currentPage - 1) * pageSize + index + 1}</td>
                      <td className="ax-table__td" style={{ textTransform: 'capitalize' }}>{txt(row, 'state') || 'Goa'}</td>
                      <td className="ax-table__td"><b>{txt(row, 'district') || DASH}</b></td>
                      <td className="ax-table__td">
                        <span style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>{row.site_name || DASH}</span>
                      </td>

                      {/* Install Date */}
                      <td className="ax-table__td" style={monoCell}>{fmtInstallDate}</td>

                      {/* Duration / Aging */}
                      <td className="ax-table__td">
                        {isClaimDue ? (
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
                            title={`Installation completed ${siteDuration.label} ago. Approved by admin and ready for claim.`}
                          >
                            <span style={{ fontSize: 12 }}>⚡</span>
                            <span>{siteDuration.label} elapsed</span>
                          </span>
                        ) : siteClaimRaised ? (
                          <span
                            style={{ color: 'var(--ax-text-muted)', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            title={`Claim raised. Installation duration: ${siteDuration.label}`}
                          >
                            <span>⏱</span>
                            <span>{siteDuration.label}</span>
                          </span>
                        ) : (
                          <span style={{ color: 'var(--ax-text-muted)', fontSize: 12 }}>
                            {siteDuration.label !== '—' ? `${siteDuration.label} elapsed` : DASH}
                          </span>
                        )}
                      </td>

                      <td className="ax-table__td">{row.contact_person || DASH}</td>
                      <td className="ax-table__td" style={monoCell}>{row.contact_number || DASH}</td>
                      <td className="ax-table__td" style={monoCell}>{row.ca_no || DASH}</td>
                      <td className="ax-table__td" style={monoCell}>{row.solarmeter_no || DASH}</td>
                      <td className="ax-table__td" style={monoCell}>{row.inverter_no || DASH}</td>
                      <td className="ax-table__td" style={monoCell}>{row.nm_sm_no || DASH}</td>
                      <td className="ax-table__td" style={monoCell}>{row.loger_no || DASH}</td>

                      <td className="ax-table__td">
                        <InstallationThumbnail src={row.system_image} alt={`${siteLabel} - Complete System`} onPreview={openPreview} />
                      </td>
                      <td className="ax-table__td">
                        <InstallationThumbnail src={row.inverter_image} alt={`${siteLabel} - Inverter Photo`} onPreview={openPreview} />
                      </td>
                      <td className="ax-table__td">
                        <InstallationThumbnail src={row.panel_image} alt={`${siteLabel} - Panel Photo`} onPreview={openPreview} />
                      </td>
                      <td className="ax-table__td">
                        <InstallationThumbnail src={row.nm_sm_image} alt={`${siteLabel} - Net/Smart Meter Photo`} onPreview={openPreview} />
                      </td>
                      <td className="ax-table__td">
                        <InstallationThumbnail src={row.loger_image} alt={`${siteLabel} - Loger Photo`} onPreview={openPreview} />
                      </td>

                      <td className="ax-table__td">
                        {hasGeo ? (
                          <a
                            href={`https://www.google.com/maps?q=${lat},${lng}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: 'var(--ax-primary-default, #2563eb)', textDecoration: 'none' }}
                            title="Open in Google Maps"
                          >
                            {lat}
                          </a>
                        ) : (
                          lat || DASH
                        )}
                      </td>
                      <td className="ax-table__td">{lng || DASH}</td>

                      <td className="ax-table__td" style={{ maxWidth: 200, whiteSpace: 'normal', fontSize: '12px' }}>
                        {row.inst_remarks || DASH}
                      </td>

                      {isCompleted && (
                        <>
                          <td className="ax-table__td">
                            <VerifyBadge value={verifyVal} />
                          </td>

                          {/* Claim Status */}
                          <td className="ax-table__td" style={{ whiteSpace: 'nowrap' }}>
                            {siteClaimRaised ? (
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
                            ) : isClaimDue ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                                <button
                                  type="button"
                                  className="ax-btn ax-btn--primary ax-btn--xs"
                                  onClick={() => setClaimModalSite(row)}
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
                                  title={`Raise claim request for ${row.site_name || 'site'}`}
                                >
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <path d="M12 5v14M5 12h14" />
                                  </svg>
                                  <span>Raise Claim</span>
                                </button>
                              </div>
                            ) : verifyVal === 2 ? (
                              <Badge tone="danger">
                                <span>Rejected</span>
                              </Badge>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-start' }}>
                                <Badge tone="neutral">
                                  <span>Awaiting Approval</span>
                                </Badge>
                                <span style={{ fontSize: 10, color: 'var(--ax-text-muted, #64748b)' }}>
                                  Claim unlocks after verify
                                </span>
                              </div>
                            )}
                          </td>

                          {/* Action: Locked when approved, otherwise Edit */}
                          <td className="ax-table__td" style={{ textAlign: 'center' }}>
                            {isApproved ? (
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
                                to={`/v/goa/srt/installationsite?id=${row.id}&edit=1`}
                                state={{ site: row, mode: 'edit' }}
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
                        </>
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
              pageSizeOptions={[25, 50, 100, 200, 300]}
            />
          </div>
        </div>
      </section>

      {/* ── Photo Preview Modal ── */}
      {preview && <ImagePreviewModal url={preview.url} title={preview.title} onClose={closePreview} />}

      {/* ── Raise Claim Modal ── */}
      {claimModalSite && (
        <RaiseClaimModal
          site={claimModalSite}
          onClose={() => setClaimModalSite(null)}
          onSuccess={handleClaimSuccess}
        />
      )}
    </div>
  );
}

export default Goa_Installation_SRT_ViewInstallation;