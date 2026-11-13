import { useState, useMemo, useEffect, useCallback, useRef, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  kashmirSrtService,
  getKashmirMediaUrl,
  getKashmirMediaCandidates,
  type KashmirInstallationSummaryData,
  type KashmirInstalledSiteItem,
} from '../../kashmir-services';
import {
  Pagination,
  usePagination,
  SearchInput,
  TableExportToolbar,
  TableEmptyState,
  type ExportColumn,
} from '../../../../../common';

type Row = KashmirInstalledSiteItem;

const DASH = '—';

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

const Badge = ({ tone, children }: { tone: Tone; children: ReactNode }) => (
  <span className={`ax-badge ax-badge--soft ax-badge--${tone}`}>{children}</span>
);

const VerifyBadge = ({ value, raw }: { value: number; raw?: any }) => {
  const r = String(raw ?? '').toLowerCase().trim();
  if (value === 1 || r === '1' || r === 'approved') return <Badge tone="success">Approved</Badge>;
  if (value === 2 || r === '2' || r === 'rejected' || r === 'reject') return <Badge tone="danger">Rejected</Badge>;
  return <Badge tone="warning">Pending</Badge>;
};

const ClaimBadge = ({ status, onRaise }: { status?: number; onRaise?: () => void }) => {
  if (status === 2) return <Badge tone="success">Approved</Badge>;
  if (status === 3) return <Badge tone="danger">Rejected</Badge>;
  if (status === 1) return <Badge tone="info">Raised</Badge>;
  if (onRaise) {
    return (
      <button
        type="button"
        className="ax-btn ax-btn--primary ax-btn--xs"
        style={{ padding: '2px 8px', fontSize: 11, whiteSpace: 'nowrap', borderRadius: 4 }}
        onClick={onRaise}
        title="Raise claim"
      >
        Raise Claim
      </button>
    );
  }
  return <Badge tone="neutral">Not Raised</Badge>;
};

const PaymentBadge = ({ status, p80, p20 }: { status?: number; p80?: number; p20?: number }) => {
  if (status === 1 || (p80 === 1 && p20 === 1)) return <Badge tone="success">Paid</Badge>;
  if (p80 === 1) return <Badge tone="info">80% Paid</Badge>;
  return <Badge tone="warning">Pending</Badge>;
};

const txt = (row: Row, key: string): string => {
  const v = (row as Record<string, any>)[key];
  if (v === null || v === undefined || v === '') return '';
  return String(v);
};

/* ───────── Modal (design-system dialog: portal to <body>, focus trap, Esc to close) ───────── */
const X_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 16, height: 16 }}>
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
  labelledBy?: string;
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

/* ───────── Image preview modal (Interactive Zoom, Real Image) ───────── */
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
    <Modal open onClose={onClose} labelledBy="kashmir-preview-title" dialogClass="ax-modal__dialog--lg">
      <div className="ax-modal__header">
        <h2 className="ax-modal__title" id="kashmir-preview-title">{title || 'Media Preview'}</h2>
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

/* ── Interactive Image Thumbnail (NO BORDER RADIUS, Real Candidates) ── */
function InstallationThumbnail({
  src,
  alt,
  onPreview,
  size = 34,
}: {
  src?: string | null;
  alt: string;
  onPreview: (url: string, title: string) => void;
  size?: number;
}) {
  const candidates = useMemo(() => getKashmirMediaCandidates(src), [src]);
  const [candidateIdx, setCandidateIdx] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setCandidateIdx(0);
    setFailed(false);
  }, [src]);

  if (!src || failed || candidateIdx >= candidates.length) {
    return <span style={{ color: 'var(--ax-text-subtle)' }}>{DASH}</span>;
  }

  const currentUrl = candidates[candidateIdx];

  return (
    <img
      src={currentUrl}
      alt={alt}
      style={{
        width: size,
        height: size,
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
          setCandidateIdx((prev) => prev + 1);
        } else {
          setFailed(true);
        }
      }}
      onClick={() => onPreview(currentUrl, alt)}
      title="Click to preview"
    />
  );
}

/* ── Action Dropdown (menu is rendered in <body> via createPortal so the table never clips it) ── */
const MENU_W = 170;
const MENU_H = 110;

function RowActionDropdown({
  onEdit,
  onView,
  onDocSubmit,
  docSubmitted,
  onRaiseClaim,
  claimStatus,
}: {
  onEdit: () => void;
  onView: () => void;
  onDocSubmit?: () => void;
  docSubmitted?: boolean;
  onRaiseClaim?: () => void;
  claimStatus?: number;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggle = () => {
    if (open) {
      setOpen(false);
      return;
    }
    const b = btnRef.current;
    if (!b) return;
    const r = b.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom;
    const top = spaceBelow < MENU_H + 8 && r.top > MENU_H + 8 ? r.top - MENU_H - 4 : r.bottom + 4;
    const left = Math.max(8, Math.min(r.right - MENU_W, window.innerWidth - MENU_W - 8));
    setPos({ top, left });
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const close = () => setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        ref={btnRef}
        className="ax-btn ax-btn--secondary ax-btn--sm ula-action-btn"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span>Action</span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ width: 12, height: 12, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }}
          aria-hidden="true"
        >
          <path d="M6 9l6 6l6 -6" />
        </svg>
      </button>

      {open && pos &&
        createPortal(
          <div ref={menuRef} className="ula-menu" role="menu" style={{ top: pos.top, left: pos.left, width: MENU_W }}>
            <button
              type="button"
              className="ula-menu__item"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onEdit();
              }}
            >
              Edit Details
            </button>
            <button
              type="button"
              className="ula-menu__item"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onView();
              }}
            >
              View Details
            </button>
            {onDocSubmit && (
              <button
                type="button"
                className="ula-menu__item"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  onDocSubmit();
                }}
              >
                <span>{docSubmitted ? 'Re-Submit Doc' : 'Submit Doc'}</span>
                {docSubmitted && (
                  <span style={{ marginLeft: 'auto', fontSize: 10, color: '#16a34a', fontWeight: 700 }}>✓</span>
                )}
              </button>
            )}
            {onRaiseClaim && (!claimStatus || claimStatus === 0) && (
              <button
                type="button"
                className="ula-menu__item"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  onRaiseClaim();
                }}
              >
                Raise Claim
              </button>
            )}
          </div>,
          document.body
        )}
    </>
  );
}

/* ───────── Raise Claim Modal ───────── */
function RaiseClaimModal({
  site,
  onClose,
  onSuccess,
}: {
  site: Row;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}) {
  const [claimAmount, setClaimAmount] = useState('');
  const [claimInvoice, setClaimInvoice] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!claimAmount || Number(claimAmount) <= 0) {
      setErr('Please enter a valid claim amount.');
      return;
    }
    if (!claimInvoice) {
      setErr('Please upload claim invoice file (PDF/Image).');
      return;
    }

    setSubmitting(true);
    setErr(null);
    try {
      const fd = new FormData();
      fd.append('srt_id', String(site.id));
      fd.append('claim_amount', claimAmount);
      fd.append('claim_invoice', claimInvoice);

      const resp = await kashmirSrtService.raiseInstallationClaim(fd);
      onSuccess(resp.message || 'Claim raised Successfully!!!');
      onClose();
    } catch (error: any) {
      setErr(error.message || 'Failed to raise claim.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open onClose={onClose} labelledBy="kashmir-claim-title" dialogClass="ax-modal__dialog--md">
      <div className="ax-modal__header">
        <h2 className="ax-modal__title" id="kashmir-claim-title" style={{ fontSize: 16, fontWeight: 700 }}>Raise Installation Claim</h2>
        <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">{X_ICON}</button>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="ax-modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 13, color: 'var(--asw-primary, #2563eb)' }}>
            Site: <b>{site.site_name}</b> (ID: #{site.id})
          </div>
          {err && (
            <div className="ax-alert ax-alert--danger" role="alert">
              <div className="ax-alert__text">{err}</div>
            </div>
          )}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
              Claim Amount (₹) *
            </label>
            <input
              type="number"
              step="0.01"
              min="1"
              className="ax-input"
              style={{ width: '100%' }}
              placeholder="Enter claim amount"
              value={claimAmount}
              onChange={(e) => setClaimAmount(e.target.value)}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
              Claim Invoice Document (PDF/JPG/PNG max 5MB) *
            </label>
            <input
              type="file"
              accept="application/pdf,image/*"
              className="ax-input"
              style={{ width: '100%' }}
              onChange={(e) => setClaimInvoice(e.target.files?.[0] || null)}
              required
            />
          </div>
          <div style={{ fontSize: 11, color: 'var(--ax-text-muted)' }}>
            Note: Claims are applicable only after 7 days of site installation.
          </div>
        </div>
        <div className="ax-modal__footer" style={{ justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" className="ax-btn ax-btn--secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="ax-btn ax-btn--primary" disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit Claim'}
          </button>
        </div>
      </form>
    </Modal>
  );
}



/* ───────── Overlay CSS (modals + dropdown; global because they render in <body>) ───────── */
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
  .ax-modal__body {
    padding: 24px; overflow-y: auto; max-height: calc(85vh - 120px);
  }
  .ax-modal__footer {
    padding: 16px 24px;
    border-top: 1px solid var(--ax-border, #e2e8f0);
    background: var(--ax-surface-subtle, #f8fafc);
    display: flex; align-items: center; justify-content: flex-end; gap: 10px;
  }

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
  .ula-m-info {
    display: flex; flex-wrap: wrap; gap: 4px 16px; padding: 8px 12px; font-size: 12px;
    background: var(--ax-surface-subtle, #f8fafc); border: 1px solid var(--ax-border, #e2e8f0);
  }
  .ula-m-info span { color: var(--ax-text-muted, #64748b); }
  .ula-m-info b { color: var(--ax-text-strong, #0f172a); font-weight: 600; }

  .ula-action-btn {
    display: inline-flex; align-items: center; gap: 6px; height: 30px; padding: 0 12px;
    font-size: 12px; font-weight: 500; border-radius: 0; cursor: pointer;
  }
  .ula-menu {
    position: fixed; z-index: 99999; box-sizing: border-box;
    display: flex; flex-direction: column; padding: 4px 0; text-align: left;
    background: var(--ax-surface-solid, #ffffff); border: 1px solid var(--ax-border, #e2e8f0); border-radius: 0;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.14), 0 8px 10px -6px rgba(0, 0, 0, 0.08);
  }
  .ula-menu__item {
    display: block; width: 100%; box-sizing: border-box; margin: 0; padding: 8px 14px;
    font: inherit; font-size: 12px; font-weight: 500; text-align: left; text-decoration: none;
    color: var(--ax-text, #0f172a); background: transparent; border: 0; border-radius: 0; cursor: pointer;
  }
  .ula-menu__item:hover, .ula-menu__item:focus-visible { background: var(--ax-surface-subtle, #f1f5f9); outline: none; }

  @media (max-width: 560px) {
    .ula-m-grid { grid-template-columns: 1fr; }
    .ula-m-stage { height: 56vh; }
  }
`;

/* ───────── Responsive page CSS (Exact Punjab SSL / Assam SWP / Bihar SRT reference) ───────── */
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
  .solar-erp-page .ula-table--wide img,
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
const monoCell = { fontFamily: 'var(--ax-font-mono)', fontSize: '12px' } as const;

/* ── Top KPI Card Component (matching Punjab / Assam & Bihar) ── */
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

// Columns for Kashmir SRT 70MW Installation
const COMMON_HEADERS = [
  'Sr. No.', 'State', 'District', 'Site Name', 'Contact Person', 'Contact Number',
  'Solar Meter No.', 'Inverter No.', 'Net/Smart Meter No.', 'Panel No.', 'Loger No.',
  'System Photo', 'Inverter Photo', 'Panel Photo', 'Net Meter Photo', 'Loger Photo',
  'Latitude', 'Longitude', 'Remark', 'Verify Status', 'Claim Status', 'Payment Status', 'Action',
];

export function Kashmir_Installation_Details() {
  const navigate = useNavigate();
  const location = useLocation();

  const [summary, setSummary] = useState<KashmirInstallationSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<'all' | 'completed' | 'payment'>('all');

  // Photo preview modal (interactive lightbox)
  const [preview, setPreview] = useState<{ url: string; title: string } | null>(null);
  const openPreview = useCallback((url: string, title: string) => setPreview({ url, title }), []);
  const closePreview = useCallback(() => setPreview(null), []);

  // Detail modal state
  const [detailModalSite, setDetailModalSite] = useState<Row | null>(null);

  // Claim modal & doc submit modal
  const [claimModalSite, setClaimModalSite] = useState<Row | null>(null);
  const [docModalSite, setDocModalSite] = useState<Row | null>(null);

  // Toast / feedback message
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  useEffect(() => {
    if (!toastMsg) return;
    const t = window.setTimeout(() => setToastMsg(null), 4000);
    return () => window.clearTimeout(t);
  }, [toastMsg]);

  // Sync hash
  useEffect(() => {
    if (location.hash === '#Payment') {
      setActiveTab('payment');
    }
  }, [location.hash]);

  // Load real data from API
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await kashmirSrtService.getViewInstallSites();
      setSummary(res);
    } catch (err: any) {
      console.error('[Kashmir SRT 70MW Installation] load error:', err);
      setToastMsg({ type: 'danger', text: err?.message || 'Failed to load installation sites from server.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const completeSites: Row[] = useMemo(() => summary?.completesite || [], [summary]);
  const paymentSites: Row[] = useMemo(() => summary?.paymentsite || [], [summary]);

  // Merge completesite and paymentsite according to tab
  const allSites: Row[] = useMemo(() => {
    if (!summary) return [];
    if (activeTab === 'completed') return completeSites;
    if (activeTab === 'payment') return paymentSites;

    // 'all': merge unique by id
    const map = new Map<number, Row>();
    completeSites.forEach((item) => map.set(item.id, item));
    paymentSites.forEach((item) => {
      if (!map.has(item.id)) {
        map.set(item.id, item);
      }
    });
    return Array.from(map.values());
  }, [summary, activeTab, completeSites, paymentSites]);

  // Unique districts for filter dropdown
  const districts = useMemo(() => {
    const set = new Set<string>();
    allSites.forEach((r) => {
      if (r.district && String(r.district).trim()) set.add(String(r.district).trim());
    });
    return Array.from(set).sort();
  }, [allSites]);

  // Filtered sites
  const filteredSites = useMemo(() => {
    let list = allSites;
    if (statusFilter === 'approved') {
      list = list.filter((s) => Number(s.inst_verify_status) === 1 || String(s.inst_verify_status).toLowerCase() === 'approved');
    } else if (statusFilter === 'rejected') {
      list = list.filter((s) => Number(s.inst_verify_status) === 2 || String(s.inst_verify_status).toLowerCase() === 'rejected');
    } else if (statusFilter === 'pending') {
      list = list.filter((s) => !s.inst_verify_status || Number(s.inst_verify_status) === 0 || String(s.inst_verify_status).toLowerCase() === 'pending');
    }

    if (districtFilter !== 'all') {
      list = list.filter((s) => s.district?.trim().toLowerCase() === districtFilter.toLowerCase());
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((s) => {
        const uid = String(s.id || '').toLowerCase();
        const sn = String(s.site_name || '').toLowerCase();
        const cp = String(s.contact_person || '').toLowerCase();
        const cn = String(s.contact_number || '').toLowerCase();
        const dist = String(s.district || '').toLowerCase();
        const sm = String(s.solarmeter_no || '').toLowerCase();
        const inv = String(s.inverter_no || '').toLowerCase();
        const nmsm = String(s.nm_sm_no || '').toLowerCase();
        const pnl = Array.isArray(s.panel_no) ? s.panel_no.join(' ').toLowerCase() : String(s.panel_no || '').toLowerCase();
        const log = String(s.loger_no || '').toLowerCase();
        return (
          uid.includes(q) ||
          sn.includes(q) ||
          cp.includes(q) ||
          cn.includes(q) ||
          dist.includes(q) ||
          sm.includes(q) ||
          inv.includes(q) ||
          nmsm.includes(q) ||
          pnl.includes(q) ||
          log.includes(q)
        );
      });
    }
    return list;
  }, [allSites, search, statusFilter, districtFilter]);

  const { paginatedData, currentPage, pageSize, totalItems, setPage, setPageSize } =
    usePagination({ data: filteredSites, initialPageSize: 100 });

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, districtFilter, activeTab, setPage]);

  const hasFilters = search.trim() !== '' || statusFilter !== 'all' || districtFilter !== 'all' || activeTab !== 'all';
  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setDistrictFilter('all');
    setActiveTab('all');
    setPage(1);
  };

  const approvedCount = summary?.approvedsite ?? allSites.filter((s) => Number(s.inst_verify_status) === 1).length;
  const pendingCount = summary?.verifypending ?? allSites.filter((s) => !s.inst_verify_status || Number(s.inst_verify_status) === 0).length;
  const rejectedCount = summary?.rejectsite ?? allSites.filter((s) => Number(s.inst_verify_status) === 2).length;

  // Export columns
  const exportCols: ExportColumn<Row>[] = useMemo(() => [
    { header: 'Sr. No.', accessor: (_r: Row, idx?: number) => (idx !== undefined ? idx + 1 : '') } as any,
    { header: 'State', accessor: (r) => txt(r, 'state') || 'Kashmir' },
    { header: 'District', accessor: (r) => txt(r, 'district') },
    { header: 'Site Name', accessor: (r) => txt(r, 'site_name') },
    { header: 'Contact Person', accessor: (r) => txt(r, 'contact_person') },
    { header: 'Contact Number', accessor: (r) => txt(r, 'contact_number') },
    { header: 'Solar Meter No.', accessor: (r) => txt(r, 'solarmeter_no') },
    { header: 'Inverter No.', accessor: (r) => txt(r, 'inverter_no') },
    { header: 'Net/Smart Meter No.', accessor: (r) => txt(r, 'nm_sm_no') },
    { header: 'Panel No.', accessor: (r) => (Array.isArray(r.panel_no) ? r.panel_no.join(', ') : txt(r, 'panel_no')) },
    { header: 'Loger No.', accessor: (r) => txt(r, 'loger_no') },
    { header: 'System Photo', accessor: (r) => r.system_image || '' },
    { header: 'Inverter Photo', accessor: (r) => r.inverter_image || '' },
    { header: 'Panel Photo', accessor: (r) => r.panel_image || '' },
    { header: 'Net Meter Photo', accessor: (r) => r.nm_sm_image || '' },
    { header: 'Loger Photo', accessor: (r) => r.loger_image || '' },
    { header: 'Latitude', accessor: (r) => txt(r, 'inst_latitude') },
    { header: 'Longitude', accessor: (r) => txt(r, 'inst_longitude') },
    { header: 'Remark', accessor: (r) => r.inst_remarks || '' },
    {
      header: 'Verify Status',
      accessor: (r) => {
        const v = Number(r.inst_verify_status);
        if (v === 1) return 'Approved';
        if (v === 2) return 'Rejected';
        return 'Pending';
      },
    },
    {
      header: 'Claim Status',
      accessor: (r) => {
        const c = Number(r.inst_claim_status);
        return c === 2 ? 'Approved' : c === 3 ? 'Rejected' : c === 1 ? 'Raised' : 'Not Raised';
      },
    },
    {
      header: 'Payment Status',
      accessor: (r) => {
        if (r.inst_pay80_status === 1 && r.inst_pay20_status === 1) return 'Paid';
        if (r.inst_pay80_status === 1) return '80% Paid';
        return 'Pending';
      },
    },
  ], []);

  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = 'Kashmir_SRT_70MW_Completed_Installations';
  const fileTitle = 'Kashmir SRT 70MW Completed Installation Register';

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

  const headers = COMMON_HEADERS;
  const TOTAL_COLUMNS = headers.length;

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* ── Page Head (exact Punjab / Assam / Bihar pattern) ── */}
      <PageHead
        title="View Kashmir SRT 70MW Installation"
        subtitle="Master register of completed solar rooftop installations, payment stage sites, serial verifications, and compliance photos"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Kashmir' },
          { label: 'Installation' },
          { label: 'SRT 70MW' },
          { label: 'View Installation' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)' }}>
            <Link to="/v/kashmir/srt/70mw/installation/site" className="ax-btn ax-btn--primary ax-btn--sm">
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

      {/* ── Top Metric KPI Cards (4 cards in 1 row, exact Punjab SSL style) ── */}
      <div className="asw-cards-row">
        <KpiCard
          tone="accent"
          label="Total Allocated"
          value={(summary?.totalsite || 0).toLocaleString('en-IN')}
          sub="Assigned for installation"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <path d="M8 9h8M8 13h8M8 17h5" />
            </svg>
          }
        />

        <KpiCard
          tone="emerald"
          label="Installed Sites"
          value={(summary?.complete || completeSites.length).toLocaleString('en-IN')}
          sub="Equipment & photos uploaded"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          }
        />

        <KpiCard
          tone="cyan"
          label="Verify Approved"
          value={approvedCount.toLocaleString('en-IN')}
          sub={`${pendingCount} audit pending`}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <polyline points="12 7 12 12 15 15" />
            </svg>
          }
        />

        <KpiCard
          tone="violet"
          label="Payment Settled"
          value={(summary?.paymentsitecount || 0).toLocaleString('en-IN')}
          sub={`${summary?.claimedapplicable || 0} claims applicable`}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
        />
      </div>

      {/* ── Main Table Card ── */}
      <section className="ax-card ax-col--12" id="kashmir-srt-tabpanel" role="tabpanel" aria-label="Kashmir SRT 70MW Installations">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">Completed Kashmir SRT 70MW Installation Data</h2>
            <p className="ax-card__subtitle">
              <span className="ax-num">{filteredSites.length}</span> of <span className="ax-num">{allSites.length}</span> installations
              {' '}· Approved <b className="ax-num">{approvedCount}</b> · Pending <b className="ax-num">{pendingCount}</b> · Rejected <b className="ax-num">{rejectedCount}</b>
            </p>
          </div>
          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              {/* Category Segment Tabs */}
              <select
                id="kashmir_category_filter"
                className="ax-input ax-input--sm"
                style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value as any)}
                aria-label="Category view"
              >
                <option value="all">All Sites ({allSites.length})</option>
                <option value="completed">Completed ({completeSites.length})</option>
                <option value="payment">Payment Stage ({paymentSites.length})</option>
              </select>

              {/* District Filter */}
              {districts.length > 0 && (
                <select
                  id="kashmir_district_filter"
                  className="ax-input ax-input--sm"
                  style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                  value={districtFilter}
                  onChange={(e) => setDistrictFilter(e.target.value)}
                  aria-label="Filter by district"
                >
                  <option value="all">All Districts ({districts.length})</option>
                  {districts.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              )}

              {/* Verify Status Filter */}
              <select
                id="kashmir_status_filter"
                className="ax-input ax-input--sm"
                style={{ width: 130, height: 32, fontSize: 'var(--ax-text-xs)' }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by verify status"
              >
                <option value="all">All Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>

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
                placeholder="Search site, meter, serial…"
                size="sm"
                ariaLabel="Search installations"
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
            className="ax-table ax-table--hover ula-table--wide"
            style={{ whiteSpace: 'nowrap', minWidth: 2600 }}
          >
            <caption className="ax-visually-hidden">Completed Kashmir SRT 70MW Installation Data</caption>
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
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading Kashmir installation records from server…
                  </td>
                </tr>
              )}
              {!loading && filteredSites.length === 0 && (
                <tr>
                  <td className="ax-table__td" colSpan={TOTAL_COLUMNS} style={{ padding: 0 }}>
                    <TableEmptyState
                      title="No completed installation records found"
                      message={
                        hasFilters
                          ? 'No records match your filters or search. Try clearing your query.'
                          : 'Completed rooftop sites will appear here once installation work is recorded via the installation form.'
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
                  const siteLabel = row.site_name || `Site #${row.id}`;
                  const vStatus = Number(row.inst_verify_status ?? 0);
                  const rawVerifyStr = String(row.inst_verify_status ?? '').toLowerCase().trim();
                  const isVerifyApproved = vStatus === 1 || rawVerifyStr === '1' || rawVerifyStr === 'approved';
                  const cStatus = Number(row.inst_claim_status ?? 0);
                  const pStatus = Number(row.inst_pay_status ?? row.payment_status ?? 0);

                  return (
                    <tr key={row.id || index} className="ax-table__row">
                      <td className="ax-table__td ax-num">{(currentPage - 1) * pageSize + index + 1}</td>
                      <td className="ax-table__td">{txt(row, 'state') || 'Kashmir'}</td>
                      <td className="ax-table__td"><b>{txt(row, 'district') || DASH}</b></td>
                      <td className="ax-table__td">
                        <button
                          type="button"
                          onClick={() => setDetailModalSite(row)}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            font: 'inherit',
                            fontWeight: 600,
                            color: 'var(--ax-text-strong)',
                            cursor: 'pointer',
                            textAlign: 'left',
                          }}
                          title="Click to view site details"
                        >
                          {row.site_name || `Site #${row.id}`}
                        </button>
                      </td>
                      <td className="ax-table__td">{txt(row, 'contact_person') || DASH}</td>
                      <td className="ax-table__td" style={monoCell}>{row.contact_number || DASH}</td>
                      <td className="ax-table__td" style={monoCell}>{row.solarmeter_no || DASH}</td>
                      <td className="ax-table__td" style={monoCell}>{row.inverter_no || DASH}</td>
                      <td className="ax-table__td" style={monoCell}>{row.nm_sm_no || DASH}</td>
                      <td className="ax-table__td" style={monoCell}>
                        {Array.isArray(row.panel_no) ? row.panel_no.join(', ') : row.panel_no || DASH}
                      </td>
                      <td className="ax-table__td" style={monoCell}>{row.loger_no || DASH}</td>

                      {/* Photo Thumbnails: NO BORDER RADIUS, Real Candidates, Click-to-Zoom */}
                      <td className="ax-table__td">
                        <InstallationThumbnail
                          src={row.system_image}
                          alt={`${siteLabel} - System Photo`}
                          onPreview={openPreview}
                        />
                      </td>
                      <td className="ax-table__td">
                        <InstallationThumbnail
                          src={row.inverter_image}
                          alt={`${siteLabel} - Inverter Photo`}
                          onPreview={openPreview}
                        />
                      </td>
                      <td className="ax-table__td">
                        <InstallationThumbnail
                          src={row.panel_image}
                          alt={`${siteLabel} - Panel Photo`}
                          onPreview={openPreview}
                        />
                      </td>
                      <td className="ax-table__td">
                        <InstallationThumbnail
                          src={row.nm_sm_image}
                          alt={`${siteLabel} - Net Meter Photo`}
                          onPreview={openPreview}
                        />
                      </td>
                      <td className="ax-table__td">
                        <InstallationThumbnail
                          src={row.loger_image}
                          alt={`${siteLabel} - Loger Photo`}
                          onPreview={openPreview}
                        />
                      </td>

                      {/* Geolocation */}
                      <td className="ax-table__td">
                        {hasGeo ? (
                          <a
                            href={`https://www.google.com/maps?q=${lat},${lng}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: 'var(--ax-primary-default, #2563eb)', textDecoration: 'none', fontWeight: 600 }}
                            title="Open location in Google Maps"
                          >
                            {lat}
                          </a>
                        ) : (
                          lat || DASH
                        )}
                      </td>
                      <td className="ax-table__td">{lng || DASH}</td>

                      {/* Remarks */}
                      <td className="ax-table__td" style={{ maxWidth: 200, whiteSpace: 'normal', fontSize: '12px' }}>
                        {row.inst_remarks || DASH}
                      </td>

                      {/* Status Badges */}
                      <td className="ax-table__td">
                        <VerifyBadge value={vStatus} raw={row.inst_verify_status} />
                      </td>
                      <td className="ax-table__td">
                        <ClaimBadge
                          status={cStatus}
                          onRaise={!cStatus || cStatus === 0 ? () => setClaimModalSite(row) : undefined}
                        />
                      </td>
                      <td className="ax-table__td">
                        <PaymentBadge
                          status={pStatus}
                          p80={row.inst_pay80_status}
                          p20={row.inst_pay20_status}
                        />
                      </td>

                      {/* Action: Locked if Verify Status is Approved, otherwise RowActionDropdown */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {isVerifyApproved ? (
                          <span
                            className="ax-badge ax-badge--soft"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              padding: '5px 11px',
                              fontSize: '11.5px',
                              fontWeight: 600,
                              color: 'var(--ax-text-muted, #64748b)',
                              background: 'var(--ax-surface-subtle, #f1f5f9)',
                              border: '1px solid var(--ax-border, #cbd5e1)',
                              borderRadius: 6,
                              cursor: 'not-allowed',
                              userSelect: 'none',
                            }}
                            title="Installation Verified & Approved. Actions are locked."
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              style={{ width: 13, height: 13, color: '#64748b' }}
                              aria-hidden="true"
                            >
                              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                            <span>Locked</span>
                          </span>
                        ) : (
                          <RowActionDropdown
                            onEdit={() => navigate(`/v/kashmir/srt/70mw/installation/site?edit=1&srt_id=${row.id}`)}
                            onView={() => setDetailModalSite(row)}
                            onDocSubmit={() => setDocModalSite(row)}
                            docSubmitted={row.inst_doc_submit === 1}
                            onRaiseClaim={!cStatus || cStatus === 0 ? () => setClaimModalSite(row) : undefined}
                            claimStatus={cStatus}
                          />
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* ── Table Footer (exact Punjab / Assam / Bihar pagination structure) ── */}
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

      {/* ── Photo Preview Modal (Zoom, Fullscreen, Open in Tab) ── */}
      {preview && <ImagePreviewModal url={preview.url} title={preview.title} onClose={closePreview} />}

      {/* ── Detail View Modal ── */}
      <Modal open={!!detailModalSite} onClose={() => setDetailModalSite(null)} labelledBy="kashmir-detail-title" dialogClass="ax-modal__dialog--md">
        {detailModalSite && (
          <div>
            <div className="ax-modal__header">
              <div>
                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700 }} id="kashmir-detail-title">
                  Site Installation Record #{detailModalSite.id} · {detailModalSite.site_name}
                </h4>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--ax-text-muted)' }}>
                  {detailModalSite.district ? `District: ${detailModalSite.district} · ` : ''}State: Kashmir
                </p>
              </div>
              <button type="button" className="ax-modal__close" onClick={() => setDetailModalSite(null)} aria-label="Close dialog">
                {X_ICON}
              </button>
            </div>
            <div className="ax-modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="ula-m-grid">
                <div className="ula-m-info"><span>Site Name:</span> <b>{detailModalSite.site_name || DASH}</b></div>
                <div className="ula-m-info"><span>Contact Person:</span> <b>{detailModalSite.contact_person || DASH}</b></div>
                <div className="ula-m-info"><span>Contact Number:</span> <b>{detailModalSite.contact_number || DASH}</b></div>
                <div className="ula-m-info"><span>District:</span> <b>{detailModalSite.district || DASH}</b></div>
                <div className="ula-m-info"><span>Solar Meter No:</span> <b>{detailModalSite.solarmeter_no || DASH}</b></div>
                <div className="ula-m-info"><span>Inverter No:</span> <b>{detailModalSite.inverter_no || DASH}</b></div>
                <div className="ula-m-info"><span>Net/Smart Meter:</span> <b>{detailModalSite.nm_sm_no || DASH}</b></div>
                <div className="ula-m-info"><span>Panel No:</span> <b>{Array.isArray(detailModalSite.panel_no) ? detailModalSite.panel_no.join(', ') : detailModalSite.panel_no || DASH}</b></div>
                <div className="ula-m-info"><span>Loger No:</span> <b>{detailModalSite.loger_no || DASH}</b></div>
                <div className="ula-m-info"><span>Latitude:</span> <b>{detailModalSite.inst_latitude || DASH}</b></div>
                <div className="ula-m-info"><span>Longitude:</span> <b>{detailModalSite.inst_longitude || DASH}</b></div>
                <div className="ula-m-info"><span>Doc Submit:</span> <b>{detailModalSite.inst_doc_submit === 1 ? 'Submitted' : 'Pending'}</b></div>
              </div>

              {detailModalSite.inst_remarks && (
                <div style={{ padding: '8px 12px', background: 'var(--ax-surface-subtle)', borderRadius: 6, fontSize: 12 }}>
                  <span style={{ color: 'var(--ax-text-muted)', fontWeight: 600 }}>Remarks: </span>
                  {detailModalSite.inst_remarks}
                </div>
              )}

              {/* Photos in modal */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginTop: 4 }}>
                {[
                  { path: detailModalSite.system_image, label: 'System Photo' },
                  { path: detailModalSite.inverter_image, label: 'Inverter Photo' },
                  { path: detailModalSite.panel_image, label: 'Panel Photo' },
                  { path: detailModalSite.nm_sm_image, label: 'Net Meter Photo' },
                  { path: detailModalSite.loger_image, label: 'Loger Photo' },
                ].filter((img) => img.path).map((img) => {
                  const url = getKashmirMediaUrl(img.path);
                  return (
                    <div key={img.label}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ax-text-muted)', marginBottom: 4 }}>{img.label}</div>
                      <img
                        src={url}
                        alt={img.label}
                        style={{ width: '100%', height: 110, objectFit: 'cover', borderRadius: 0, border: '1px solid var(--ax-border)', cursor: 'zoom-in' }}
                        onClick={() => openPreview(url, `${detailModalSite.site_name} - ${img.label}`)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="ax-modal__footer">
              <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setDetailModalSite(null)}>
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Raise Claim Modal ── */}
      {claimModalSite && (
        <RaiseClaimModal
          site={claimModalSite}
          onClose={() => setClaimModalSite(null)}
          onSuccess={(msg) => {
            setToastMsg({ type: 'success', text: msg });
            loadData();
          }}
        />
      )}

   
  
    </div>
  );
}

export default Kashmir_Installation_Details;
