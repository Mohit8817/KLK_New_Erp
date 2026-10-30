import { useState, useMemo, useEffect, useCallback, useRef, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
<<<<<<< HEAD
import { Link, useNavigate, useLocation } from 'react-router-dom';
=======
import { useLocation, useNavigate, useSearchParams, Link } from 'react-router-dom';
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  punjabSslInstallationService,
<<<<<<< HEAD
  resolvePunjabMediaUrl,
  getPunjabMediaCandidates,
=======
  getPunjabMediaCandidates,
  resolvePunjabMediaUrl,
  type PunjabInstallDetailSummary,
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328
  type PunjabInstalledLightItem,
  type PunjabInstallDetailSummary,
  type PunjabCompleteLightsResponse,
} from '../../punjab-services';
import {
  Pagination,
  usePagination,
  SearchInput,
  TableExportToolbar,
  TableEmptyState,
<<<<<<< HEAD
=======
  usePagination,
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328
  type ExportColumn,
} from '../../../../../common';

const DASH = '—';
<<<<<<< HEAD

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
=======
const num = (x: unknown) => (Number(x) || 0).toLocaleString('en-IN');
const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328

const ClaimBadge = ({ status }: { status?: number }) => {
  if (status === 2) return <Badge tone="success">Approved</Badge>;
  if (status === 3) return <Badge tone="danger">Rejected</Badge>;
  if (status === 1) return <Badge tone="info">Raised</Badge>;
  return <Badge tone="neutral">Not Raised</Badge>;
};

const PaymentBadge = ({ status }: { status?: number }) => {
  if (status === 1) return <Badge tone="success">Paid</Badge>;
  return <Badge tone="warning">Pending</Badge>;
};

const txt = (row: PunjabInstalledLightItem, key: string): string => {
  const v = (row as Record<string, any>)[key];
  if (v === null || v === undefined || v === '') return '';
  return String(v);
};

/* ───────── Modal (design-system dialog: portal to <body>, focus trap, Esc to close) ───────── */
const X_ICON = (
<<<<<<< HEAD
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 16, height: 16 }}>
=======
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 18, height: 18 }}>
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

<<<<<<< HEAD
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
=======
type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';
const Badge = ({ tone, children }: { tone: Tone; children: ReactNode }) => (
  <span className={`ax-badge ax-badge--soft ax-badge--${tone} ax-badge--pill`}>{children}</span>
);

const vStatusOf = (r: PunjabInstalledLightItem) => Number(r.inst_verify_status ?? r.verify_status ?? 0);
const cStatusOf = (r: PunjabInstalledLightItem) => Number(r.inst_claim_status ?? r.claim_status ?? 0);
const pStatusOf = (r: PunjabInstalledLightItem) => Number(r.inst_pay_status ?? r.payment_status ?? 0);

/* ───────── Image Preview Lightbox Modal (Interactive Zoom, matching Assam SWP) ───────── */
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
    <Modal open onClose={onClose} title={title || 'Media Lightbox'} maxWidth={840}>
      <div style={{ padding: 0 }}>
        <div style={{ minHeight: 340, maxHeight: '60vh', overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', position: 'relative' }}>
          {status === 'loading' && (
            <div style={{ color: '#fff', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="ax-spinner" /> Loading photograph…
            </div>
          )}
          {status === 'error' && (
            <div style={{ color: '#f87171', fontSize: 13 }}>
              Photo could not be loaded. Try opening it directly in a new tab.
            </div>
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
                ? { maxWidth: '100%', maxHeight: '58vh', objectFit: 'contain' }
                : { width: `${zoom * 100}%`, maxWidth: 'none', maxHeight: 'none', height: 'auto' }),
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderTop: '1px solid var(--ax-border, #e2e8f0)', background: 'var(--ax-surface-subtle, #f8fafc)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--xs"
              onClick={() => setZoomIdx((i) => Math.max(0, i - 1))}
              disabled={zoomIdx === 0}
            >
              − Zoom Out
            </button>
            <span style={{ fontSize: 12, fontWeight: 700, paddingInline: 8 }}>{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--xs"
              onClick={() => setZoomIdx((i) => Math.min(ZOOM_STEPS.length - 1, i + 1))}
              disabled={zoomIdx === ZOOM_STEPS.length - 1}
            >
              + Zoom In
            </button>
          </div>
          <div style={{ display: 'inline-flex', gap: 8 }}>
            <a href={url} target="_blank" rel="noreferrer" className="ax-btn ax-btn--ghost ax-btn--sm" style={{ color: '#2563eb' }}>
              Open in new tab ↗
            </a>
            <button type="button" className="ax-btn ax-btn--primary ax-btn--sm" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* ───────── Light Thumbnail with Candidate Resolver ───────── */
function LightThumbnail({
  src,
  alt,
  onPreview,
  size = 32,
}: {
  src?: string | null;
  alt: string;
  onPreview: (url: string, title: string) => void;
  size?: number;
}) {
  const candidates = useMemo(() => getPunjabMediaCandidates(src), [src]);
  const [candidateIdx, setCandidateIdx] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setCandidateIdx(0);
    setFailed(false);
  }, [src]);

  if (!src || failed || candidateIdx >= candidates.length) {
    return <span style={{ color: 'var(--ax-text-subtle, #94a3b8)', fontSize: 12 }}>{DASH}</span>;
  }

  const currentUrl = candidates[candidateIdx];

  return (
    <img
      src={currentUrl}
      alt={alt}
      style={{
        width: size,
        height: size,
        borderRadius: 4,
        objectFit: 'cover',
        cursor: 'zoom-in',
        border: '1px solid var(--ax-border, #cbd5e1)',
        background: '#f8fafc',
        display: 'block',
      }}
      onError={() => {
        if (candidateIdx + 1 < candidates.length) {
          setCandidateIdx((prev) => prev + 1);
        } else {
          setFailed(true);
        }
      }}
      onClick={() => onPreview(currentUrl, alt)}
      title="Click to preview photograph"
    />
  );
}

/* ───────── Generic Design System Modal ───────── */
function Modal({
  open,
  onClose,
  title,
  subtitle,
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328
  children,
  footer,
  maxWidth = 720,
}: {
  open: boolean;
  onClose: () => void;
<<<<<<< HEAD
  labelledBy: string;
  describedBy?: string;
  role?: 'dialog' | 'alertdialog';
  centered?: boolean;
  dialogClass?: string;
  dialogStyle?: CSSProperties;
  modalStyle?: CSSProperties;
  closeOnBackdrop?: boolean;
=======
  title: string;
  subtitle?: string;
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328
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
<<<<<<< HEAD
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
=======
    <div className="ax-modal" role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ position: 'fixed', inset: 0, background: 'transparent' }} onClick={onClose} />
      <div
        ref={dialogRef}
        style={{
          position: 'relative', zIndex: 1, background: '#ffffff', borderRadius: 16, border: '1px solid var(--ax-border, #e2e8f0)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden', width: '92%', maxWidth, maxHeight: '90vh',
          display: 'flex', flexDirection: 'column',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--ax-border, #e2e8f0)', background: 'var(--ax-surface-subtle, #f8fafc)' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--ax-text-strong, #0f172a)' }}>{title}</h3>
            {subtitle && <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--ax-text-muted, #64748b)' }}>{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} style={{ width: 32, height: 32, padding: 0, borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }} aria-label="Close">
            {X_ICON}
          </button>
        </div>
        <div style={{ padding: 20, overflowY: 'auto', maxHeight: 'calc(85vh - 120px)' }}>
          {children}
        </div>
        {footer && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, padding: '14px 20px', borderTop: '1px solid var(--ax-border, #e2e8f0)', background: 'var(--ax-surface-subtle, #f8fafc)' }}>
            {footer}
          </div>
        )}
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328
      </div>
    </div>,
    document.body
  );
}

<<<<<<< HEAD
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
    <Modal open onClose={onClose} labelledBy="punjab-preview-title" dialogClass="ax-modal__dialog--lg">
      <div className="ax-modal__header">
        <h2 className="ax-modal__title" id="punjab-preview-title">{title || 'Media Preview'}</h2>
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
  const candidates = useMemo(() => getPunjabMediaCandidates(src), [src]);
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
const MENU_H = 76;

function RowActionDropdown({
  onEdit,
  onView,
}: {
  onEdit: () => void;
  onView: () => void;
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
          </div>,
          document.body
        )}
    </>
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

/* ───────── Responsive page CSS (Exact Assam SWP / Bihar SRT reference) ───────── */
const PAGE_CSS = `
  .solar-erp-page {
    --asw-primary: #2563eb;
    --asw-primary-rgb: 37, 99, 235;
=======
/* ───────── Top KPI Card Component ───────── */
type KpiTone = 'accent' | 'cyan' | 'emerald' | 'amber' | 'violet' | 'red';
const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(37, 99, 235, 0.12)', fg: '#2563eb' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan, #06b6d4) 14%, transparent)', fg: '#0891b2' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald, #10b981) 14%, transparent)', fg: '#16a34a' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber, #f59e0b) 14%, transparent)', fg: '#d97706' },
  violet: { bg: 'color-mix(in oklab, var(--ax-viz-violet, #8b5cf6) 14%, transparent)', fg: '#7c3aed' },
  red: { bg: 'color-mix(in oklab, var(--ax-viz-red, #ef4444) 14%, transparent)', fg: '#ef4444' },
};

function KpiCard({ icon, tone, label, value, sub }: { icon: ReactNode; tone: KpiTone; label: string; value: ReactNode; sub: string }) {
  const t = TONE[tone];
  return (
    <div className="ax-card" style={{ padding: '12px 16px', borderRadius: 12, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ width: 26, height: 26, borderRadius: 8, background: t.bg, color: t.fg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ width: 14, height: 14, display: 'inline-flex' }}>{icon}</span>
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)', letterSpacing: '0.04em' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: t.fg, marginTop: 2, fontFamily: 'var(--ax-font-display)' }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', marginTop: 2 }}>{sub}</div>
    </div>
  );
}

/* ───────── Layout CSS (matching Assam SWP / Bihar reference) ───────── */
const PAGE_CSS = `
  .solar-erp-page {
    --asw-primary: #2563eb;
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328
  }
  .solar-erp-page .ax-card { min-width: 0; }
  .solar-erp-page .ax-card__footer { width: 100%; box-sizing: border-box; }
  .solar-erp-page .ula-pagination-left {
    width: 100%; display: flex; justify-content: flex-start; align-items: center; margin: 0; overflow-x: auto;
  }
  .solar-erp-page .ula-pagination-left > * { margin-left: 0 !important; margin-right: 0 !important; }

<<<<<<< HEAD
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
=======
  .solar-erp-page .asw-cards-row {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: var(--ax-space-3, 12px);
    margin-bottom: var(--ax-space-4, 16px);
  }
  @media (max-width: 1280px) {
    .solar-erp-page .asw-cards-row { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  }
  @media (max-width: 640px) {
    .solar-erp-page .asw-cards-row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }

  .solar-erp-page .ax-card__header {
    display: flex; flex-wrap: nowrap; align-items: flex-start; justify-content: space-between; gap: 12px;
  }
  .solar-erp-page .ax-card__titles { flex: 1 1 220px; min-width: 200px; }
  .solar-erp-page .ax-card__actions { flex: 0 1 auto; margin-left: auto; display: flex; align-items: center; gap: 8px; }

  /* Fully horizontally scrollable table without clipping */
  .solar-erp-page .ax-table-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    width: 100%;
  }

  @media (max-width: 760px) {
    .solar-erp-page .ax-card__header { flex-direction: column; align-items: stretch; gap: 10px; }
    .solar-erp-page .ax-card__actions { width: 100%; flex-wrap: wrap; justify-content: flex-start; }
  }
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328
`;

const footerStyle = {
  borderTop: '1px solid var(--ax-border, #e2e8f0)',
  padding: 'var(--ax-space-3) var(--ax-space-4)',
  display: 'flex',
  justifyContent: 'flex-start',
  alignItems: 'center',
  width: '100%',
  boxSizing: 'border-box',
} as const;
<<<<<<< HEAD
const centerCell = { textAlign: 'center', padding: 24 } as const;
const monoCell = { fontFamily: 'var(--ax-font-mono)', fontSize: '12px' } as const;
=======
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328

/* ── Top KPI Card Component (matching Assam & Bihar) ── */
type KpiTone = 'accent' | 'cyan' | 'emerald' | 'amber' | 'violet';

<<<<<<< HEAD
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

// Columns for Punjab SSL Installation
const COMMON_HEADERS = [
  'Sr. No.', 'State', 'District', 'Block', 'Panchayat', 'Ward No.', 'Pole No.',
  'Beneficiary Name', 'Contact Number', 'UUID No.', 'Light No.', 'Panel No.', 'Battery No.',
  'Light Photo 1', 'Light Photo 2',
  'Latitude', 'Longitude', 'Remark', 'Verify Status', 'Claim Status', 'Payment Status', 'Action',
];

=======
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328
export function Punjab_Installation_SSL_InstallationDetail() {
  const navigate = useNavigate();
<<<<<<< HEAD
  const location = useLocation();
=======
  const tab: TabKey = location.hash.toLowerCase() === '#payment' ? 'Payment' : 'Completed';

  const setTab = (k: TabKey) => {
    navigate({ pathname: location.pathname, search: location.search, hash: k === 'Payment' ? '#payment' : '#completed' }, { replace: true });
  };

  const isCompleted = tab === 'Completed';
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328

  const [data, setData] = useState<PunjabCompleteLightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<'all' | 'completed' | 'payment'>('all');

  // Photo preview modal (interactive lightbox)
  const [preview, setPreview] = useState<{ url: string; title: string } | null>(null);
  const openPreview = useCallback((url: string, title: string) => setPreview({ url, title }), []);
  const closePreview = useCallback(() => setPreview(null), []);

<<<<<<< HEAD
  // Detail modal state
  const [detailModalItem, setDetailModalItem] = useState<PunjabInstalledLightItem | null>(null);

  // Toast / feedback message
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);
=======
  // Preview Lightbox Modal
  const [preview, setPreview] = useState<{ open: boolean; url: string; title: string }>({
    open: false,
    url: '',
    title: '',
  });
  const openPreview = (url: string, title: string) => setPreview({ open: true, url, title });
  const closePreview = () => setPreview({ open: false, url: '', title: '' });

  // View Light Full Detail Modal
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<PunjabInstalledLightItem | null>(null);

  // Approve Confirmation Modal
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approvingItem, setApprovingItem] = useState<PunjabInstalledLightItem | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328

  useEffect(() => {
    if (!toastMsg) return;
    const t = window.setTimeout(() => setToastMsg(null), 4000);
    return () => window.clearTimeout(t);
  }, [toastMsg]);

  // Load real data from API 8 & 9 (completelights & paymentlights)
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
<<<<<<< HEAD
      const res = await punjabSslInstallationService.getCompleteLights();
      setData(res);
    } catch (err: any) {
      console.error('[Punjab SSL Installation] load error:', err);
      setToastMsg({ type: 'danger', text: err?.message || 'Failed to load installation sites from server.' });
=======
      const resp = await punjabSslInstallationService.getCompleteLights();
      if (resp) {
        if (resp.install_detail) setSummary(resp.install_detail);
        const comp = resp.completelights || resp.complete_lights || [];
        const pay = resp.paymentlights || resp.payment_lights || [];
        setCompleteLights(Array.isArray(comp) ? comp : []);
        setPaymentLights(Array.isArray(pay) ? pay : []);
      }
    } catch (err: any) {
      console.error('[Punjab SSL] load complete lights error:', err);
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Merge completelights and paymentlights according to tab
  const allLights: PunjabInstalledLightItem[] = useMemo(() => {
    if (!data) return [];
    const comp = Array.isArray(data.completelights) ? data.completelights : [];
    const pay = Array.isArray(data.paymentlights) ? data.paymentlights : [];

<<<<<<< HEAD
    if (activeTab === 'completed') return comp;
    if (activeTab === 'payment') return pay;

    // 'all': merge unique by id
    const map = new Map<number, PunjabInstalledLightItem>();
    comp.forEach((item) => map.set(item.id, item));
    pay.forEach((item) => {
      if (!map.has(item.id)) {
        map.set(item.id, item);
      }
    });
    return Array.from(map.values());
  }, [data, activeTab]);

  // Unique districts for filter dropdown
=======
  // Unique districts
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328
  const districts = useMemo(() => {
    const set = new Set<string>();
    allLights.forEach((r) => {
      if (r.district) set.add(r.district.trim());
    });
    return Array.from(set).sort();
  }, [allLights]);

<<<<<<< HEAD
  // Filtered lights
  const filteredLights = useMemo(() => {
    let list = allLights;
    if (statusFilter === 'approved') {
      list = list.filter((s) => Number(s.inst_verify_status ?? s.verify_status) === 1 || String(s.inst_verify_status ?? s.verify_status).toLowerCase() === 'approved');
    } else if (statusFilter === 'rejected') {
      list = list.filter((s) => Number(s.inst_verify_status ?? s.verify_status) === 2 || String(s.inst_verify_status ?? s.verify_status).toLowerCase() === 'rejected');
    } else if (statusFilter === 'pending') {
      list = list.filter((s) => !s.inst_verify_status || Number(s.inst_verify_status ?? s.verify_status) === 0 || String(s.inst_verify_status ?? s.verify_status).toLowerCase() === 'pending');
    }

    if (districtFilter !== 'all') {
      list = list.filter((s) => s.district?.trim().toLowerCase() === districtFilter.toLowerCase());
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((s) => {
        const uid = String(s.unique_id || s.id || '').toLowerCase();
        const ben = String(s.beneficiary_name || '').toLowerCase();
        const ph = String(s.contact_no || '').toLowerCase();
        const dist = String(s.district || '').toLowerCase();
        const blk = String(s.block || '').toLowerCase();
        const pan = String(s.panchayat || '').toLowerCase();
        const pole = String(s.pole_no || '').toLowerCase();
        const lgt = String(s.light_no || '').toLowerCase();
        const pnl = String(s.panel_no || '').toLowerCase();
        const bat = String(s.battery_serial_no || s.battery_no || '').toLowerCase();
        return (
          uid.includes(q) ||
          ben.includes(q) ||
          ph.includes(q) ||
          dist.includes(q) ||
          blk.includes(q) ||
          pan.includes(q) ||
          pole.includes(q) ||
          lgt.includes(q) ||
          pnl.includes(q) ||
          bat.includes(q)
        );
      });
    }
    return list;
  }, [allLights, search, statusFilter, districtFilter]);

  const { paginatedData, currentPage, pageSize, totalItems, setPage, setPageSize } =
    usePagination({ data: filteredLights, initialPageSize: 100 });

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

  // Summary counts from install_detail
  const installDetail: PunjabInstallDetailSummary = data?.install_detail || {
    total: 0,
    complete: 0,
    pending: 0,
    verify_approved: 0,
    verify_pending: 0,
    verify_reject: 0,
    claim_applicable: 0,
    claim_raised: 0,
    payment_complete: 0,
    payment_pending: 0,
  };

  const approvedCount = installDetail.verify_approved ?? allLights.filter((s) => Number(s.inst_verify_status ?? s.verify_status) === 1).length;
  const pendingCount = installDetail.verify_pending ?? allLights.filter((s) => !s.inst_verify_status || Number(s.inst_verify_status ?? s.verify_status) === 0).length;
  const rejectedCount = installDetail.verify_reject ?? allLights.filter((s) => Number(s.inst_verify_status ?? s.verify_status) === 2).length;

  // Export columns
  const exportCols: ExportColumn<PunjabInstalledLightItem>[] = useMemo(() => [
    { header: 'Sr. No.', accessor: (_r: PunjabInstalledLightItem, idx?: number) => (idx !== undefined ? idx + 1 : '') } as any,
    { header: 'State', accessor: (r) => txt(r, 'state') || 'Punjab' },
    { header: 'District', accessor: (r) => txt(r, 'district') },
    { header: 'Block', accessor: (r) => txt(r, 'block') },
    { header: 'Panchayat', accessor: (r) => txt(r, 'panchayat') },
    { header: 'Ward No.', accessor: (r) => txt(r, 'ward_no') },
    { header: 'Pole No.', accessor: (r) => txt(r, 'pole_no') },
    { header: 'Beneficiary Name', accessor: (r) => txt(r, 'beneficiary_name') },
    { header: 'Contact Number', accessor: (r) => txt(r, 'contact_no') },
    { header: 'UUID No.', accessor: (r) => txt(r, 'uuid_no') },
    { header: 'Light No.', accessor: (r) => txt(r, 'light_no') },
    { header: 'Panel No.', accessor: (r) => txt(r, 'panel_no') },
    { header: 'Battery No.', accessor: (r) => txt(r, 'battery_serial_no') || txt(r, 'battery_no') },
    { header: 'Light Photo 1', accessor: (r) => r.light_file || '' },
    { header: 'Light Photo 2', accessor: (r) => r.light_file2 || '' },
    { header: 'Latitude', accessor: (r) => txt(r, 'latitude') },
    { header: 'Longitude', accessor: (r) => txt(r, 'longitude') },
    { header: 'Remark', accessor: (r) => r.remark || r.inst_remark || '' },
    {
      header: 'Verify Status',
      accessor: (r) => {
        const v = Number(r.inst_verify_status ?? r.verify_status);
        const str = String(r.inst_verify_status ?? r.verify_status ?? '').toLowerCase().trim();
        if (v === 1 || str === '1' || str === 'approved') return 'Approved';
        if (v === 2 || str === '2' || str === 'rejected') return 'Rejected';
        return 'Pending';
      },
    },
    {
      header: 'Claim Status',
      accessor: (r) => {
        const c = Number(r.inst_claim_status ?? r.claim_status);
        return c === 2 ? 'Approved' : c === 3 ? 'Rejected' : c === 1 ? 'Raised' : 'Not Raised';
      },
    },
    {
      header: 'Payment Status',
      accessor: (r) => (Number(r.inst_pay_status ?? r.payment_status) === 1 ? 'Paid' : 'Pending'),
    },
  ], []);

  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = 'Punjab_SSL_Completed_Installations';
  const fileTitle = 'Punjab SSL Completed Installation Register';

  const getExportValue = <T,>(row: T, column: ExportColumn<T>, index: number) => {
    if (typeof column.accessor === 'function') return (column.accessor as any)(row, index);
    return (row as unknown as Record<string, unknown>)[column.accessor as string];
  };

  const escapeExportValue = (value: unknown) => (value === null || value === undefined ? '' : String(value));

=======
  // Filtered dataset
  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return activeList.filter((r) => {
      if (districtFilter !== 'all' && r.district?.trim().toLowerCase() !== districtFilter.toLowerCase()) {
        return false;
      }
      if (isCompleted && verifyFilter !== 'all') {
        const v = vStatusOf(r);
        if (verifyFilter === 'approved' && v !== 1) return false;
        if (verifyFilter === 'pending' && v !== 0) return false;
        if (verifyFilter === 'rejected' && v !== 2) return false;
      }
      if (q) {
        const match =
          (r.unique_id && r.unique_id.toLowerCase().includes(q)) ||
          (r.beneficiary_name && r.beneficiary_name.toLowerCase().includes(q)) ||
          (r.contact_no && r.contact_no.toLowerCase().includes(q)) ||
          (r.pole_no && r.pole_no.toLowerCase().includes(q)) ||
          (r.uuid_no && r.uuid_no.toLowerCase().includes(q)) ||
          (r.block && r.block.toLowerCase().includes(q)) ||
          (r.panchayat && r.panchayat.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [activeList, deferredQuery, districtFilter, verifyFilter, isCompleted]);

  // Pagination
  const pagination = usePagination({ data: filtered, initialPageSize: 25 });

  useEffect(() => {
    pagination.setPage(1);
  }, [deferredQuery, districtFilter, verifyFilter, tab]);

  // Export handling
  const exportCols: ExportColumn<PunjabInstalledLightItem>[] = useMemo(
    () => [
      { header: 'Sr.', accessor: (_r, idx) => idx + 1 },
      { header: 'UID', accessor: (r) => r.unique_id || `#${r.id}` },
      { header: 'State', accessor: (r) => r.state || 'Punjab' },
      { header: 'District', accessor: (r) => r.district || '—' },
      { header: 'Block', accessor: (r) => r.block || '—' },
      { header: 'Panchayat', accessor: (r) => r.panchayat || '—' },
      { header: 'Ward No', accessor: (r) => r.ward_no || '—' },
      { header: 'Pole No', accessor: (r) => r.pole_no || '—' },
      { header: 'Beneficiary Name', accessor: (r) => r.beneficiary_name || '—' },
      { header: 'Contact', accessor: (r) => r.contact_no || '—' },
      { header: 'UUID No', accessor: (r) => r.uuid_no || '—' },
      { header: 'Light No', accessor: (r) => r.light_no || '—' },
      { header: 'Panel No', accessor: (r) => r.panel_no || '—' },
      { header: 'Battery No', accessor: (r) => r.battery_serial_no || '—' },
      { header: 'Verify Status', accessor: (r) => (vStatusOf(r) === 1 ? 'Approved' : vStatusOf(r) === 2 ? 'Rejected' : 'Pending') },
      { header: 'Payment Status', accessor: (r) => (pStatusOf(r) === 1 ? 'Paid' : 'Pending') },
    ],
    []
  );

  const escapeExportValue = (value: unknown) => (value === null || value === undefined ? '' : String(value));
  const getExportValue = <T,>(row: T, column: ExportColumn<T>, index: number) => {
    if (typeof column.accessor === 'function') return (column.accessor as any)(row, index);
    return (row as unknown as Record<string, unknown>)[column.accessor as string];
  };

>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328
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

<<<<<<< HEAD
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

      {/* ── Page Head (exact Assam / Bihar pattern) ── */}
      <PageHead
        title="View Punjab SSL Installation"
        subtitle="Master register of completed solar street light installations, verification evidence, photographs, and payment compliance"
=======
  const exportToCSV = () => {
    if (!filtered.length) return;
    const out = [
      exportCols.map((c) => c.header),
      ...filtered.map((row, idx) => exportCols.map((c) => escapeExportValue(getExportValue(row, c, idx)))),
    ];
    const csv = out.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(',')).join('\r\n');
    downloadTextFile(`\ufeff${csv}`, `Punjab_SSL_${tab}_Lights.csv`, 'text/csv');
  };

  const exportToExcel = () => {
    if (!filtered.length) return;
    const tableHtml = `<table border="1"><thead><tr>${exportCols.map((c) => `<th>${c.header}</th>`).join('')}</tr></thead><tbody>${filtered.map((row, idx) => `<tr>${exportCols.map((c) => `<td>${escapeExportValue(getExportValue(row, c, idx))}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8" /></head><body>${tableHtml}</body></html>`;
    downloadTextFile(`\ufeff${html}`, `Punjab_SSL_${tab}_Lights.xls`, 'application/vnd.ms-excel');
  };

  const copyToClipboard = async () => {
    if (!filtered.length) return;
    const t = [
      exportCols.map((c) => c.header).join('\t'),
      ...filtered.map((row, idx) => exportCols.map((c) => escapeExportValue(getExportValue(row, c, idx))).join('\t')),
    ].join('\n');
    try {
      await navigator.clipboard.writeText(t);
      alert('Table data copied to clipboard!');
    } catch {
      alert('Copy failed, please export CSV instead.');
    }
  };

  const exportToPDF = () => {
    if (!filtered.length) return;
    const body = filtered.map((row, idx) => exportCols.map((c) => escapeExportValue(getExportValue(row, c, idx))));
    const w = window.open('', '_blank', 'width=1200,height=800');
    if (!w) return;
    w.document.write(`<!doctype html><html><head><meta charset="UTF-8" /><title>Punjab SSL ${tab} Lights</title><style>
      *{box-sizing:border-box}body{font-family:Arial,sans-serif;padding:24px;color:#222}h1{font-size:20px;margin:0 0 16px}
      table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #d8dee6;padding:6px 8px;text-align:left;vertical-align:top}
      th{background:#f3f5f7;font-weight:700}@media print{body{padding:0}@page{size:landscape;margin:10mm}}
    </style></head><body><h1>Punjab SSL ${tab} Lights Register</h1><table><thead><tr>${exportCols.map((c) => `<th>${c.header}</th>`).join('')}</tr></thead><tbody>${body.map((r) => `<tr>${r.map((v) => `<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table><script>window.onload=function(){window.print();};</script></body></html>`);
    w.document.close();
    w.focus();
  };

  // Mark light as verified
  const handleApproveConfirm = () => {
    if (!approvingItem) return;
    setCompleteLights((prev) =>
      prev.map((item) => (item.id === approvingItem.id ? { ...item, inst_verify_status: 1 } : item))
    );
    if (summary) {
      setSummary({
        ...summary,
        verify_approved: (summary.verify_approved || 0) + 1,
        verify_pending: Math.max(0, (summary.verify_pending || 0) - 1),
      });
    }
    setActionSuccessMsg(`Light #${approvingItem.unique_id || approvingItem.id} marked as Approved!`);
    setApproveModalOpen(false);
    setApprovingItem(null);
  };

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      {/* Page Header (matching Assam SWP / Bihar reference) */}
      <PageHead
        title="View Installation"
        subtitle="Comprehensive register of completed Solar Street Light installations and payment-stage records"
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Punjab' },
          { label: 'Installation' },
<<<<<<< HEAD
          { label: 'SSL' },
=======
          { label: 'SSL', href: '/v/punjab/ssl/installation/dashboard' },
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328
          { label: 'View Installation' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)' }}>
<<<<<<< HEAD
            <Link to="/v/punjab/ssl/installation/install-light" className="ax-btn ax-btn--primary ax-btn--sm">
              <span className="ax-btn__label">+ New Installation</span>
=======
            <Link to="/v/punjab/ssl/installation/update-light-deatils" className="ax-btn ax-btn--primary ax-btn--sm">
              <span className="ax-btn__label">+ Install Light</span>
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328
            </Link>
          </div>
        }
      />

<<<<<<< HEAD
      {toastMsg && (
        <div className={`ax-alert ax-alert--${toastMsg.type}`} style={{ marginBottom: 'var(--ax-space-4)' }} role="status">
          <div className="ax-alert__title">{toastMsg.type === 'success' ? 'Success' : 'Error'}</div>
          <div className="ax-alert__text">{toastMsg.text}</div>
        </div>
      )}

      {/* ── Top Metric KPI Cards (4 cards in 1 row) ── */}
      <div className="asw-cards-row">
        <KpiCard
          tone="accent"
          label="Total Allocated"
          value={(installDetail.total || 0).toLocaleString('en-IN')}
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
          label="Installed Lights"
          value={(installDetail.complete || allLights.length).toLocaleString('en-IN')}
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
          value={(installDetail.payment_complete || 0).toLocaleString('en-IN')}
          sub={`${installDetail.claim_applicable || 0} claims applicable`}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
        />
      </div>

      {/* ── Main Table Card ── */}
      <section className="ax-card ax-col--12" id="punjab-ssl-tabpanel" role="tabpanel" aria-label="Punjab SSL Installations">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">Completed Punjab SSL Installation Data</h2>
            <p className="ax-card__subtitle">
              <span className="ax-num">{filteredLights.length}</span> of <span className="ax-num">{allLights.length}</span> installations
              {' '}· Approved <b className="ax-num">{approvedCount}</b> · Pending <b className="ax-num">{pendingCount}</b> · Rejected <b className="ax-num">{rejectedCount}</b>
=======
      {/* Success Notification */}
      {actionSuccessMsg && (
        <div className="ax-alert ax-alert--success" style={{ marginBottom: 'var(--ax-space-4)' }} role="status">
          <div className="ax-alert__title">Success</div>
          <div className="ax-alert__text">{actionSuccessMsg}</div>
        </div>
      )}

      {/* Summary KPI Cards (matching Assam SWP metrics) */}
      {summary && (
        <div className="asw-cards-row">
          <KpiCard
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>}
            tone="accent"
            label="Total Lights"
            value={num(summary.total)}
            sub="Allocated lights"
          />
          <KpiCard
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="20 6 9 17 4 12" /></svg>}
            tone="emerald"
            label="Complete"
            value={num(summary.complete)}
            sub="Installed lights"
          />
          <KpiCard
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>}
            tone="amber"
            label="Pending"
            value={num(summary.pending)}
            sub="Awaiting install"
          />
          <KpiCard
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>}
            tone="cyan"
            label="Verified Approved"
            value={num(summary.verify_approved)}
            sub="Field verified"
          />
          <KpiCard
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>}
            tone="violet"
            label="Claims Raised"
            value={num(summary.claim_raised)}
            sub="Claimed batches"
          />
          <KpiCard
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>}
            tone="emerald"
            label="Payment Complete"
            value={num(summary.payment_complete)}
            sub="Settled payments"
          />
        </div>
      )}

      {/* Main Table Card */}
      <section className="ax-card" role="region" aria-label="Installation records">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            {/* Tab switchers matching Assam SWP */}
            <div style={{ display: 'inline-flex', background: 'var(--ax-surface-subtle)', borderRadius: 8, padding: 3, border: '1px solid var(--ax-border)', marginBottom: 8 }}>
              <button
                type="button"
                style={{
                  border: 'none', background: isCompleted ? '#ffffff' : 'transparent',
                  color: isCompleted ? '#2563eb' : 'var(--ax-text-muted)',
                  fontWeight: 700, fontSize: 13, padding: '5px 14px', borderRadius: 6, cursor: 'pointer',
                  boxShadow: isCompleted ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}
                onClick={() => setTab('Completed')}
              >
                Completed Lights ({completeLights.length})
              </button>
              <button
                type="button"
                style={{
                  border: 'none', background: !isCompleted ? '#ffffff' : 'transparent',
                  color: !isCompleted ? '#2563eb' : 'var(--ax-text-muted)',
                  fontWeight: 700, fontSize: 13, padding: '5px 14px', borderRadius: 6, cursor: 'pointer',
                  boxShadow: !isCompleted ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}
                onClick={() => setTab('Payment')}
              >
                Payment Stage Lights ({paymentLights.length})
              </button>
            </div>
            <p className="ax-card__subtitle">
              {isCompleted
                ? 'Review fully installed Solar Street Lights, verify hardware serial numbers and inspection photos'
                : 'Review lights eligible for claim verification and completed disbursements'}
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328
            </p>
          </div>
          <div className="ax-card__actions">
<<<<<<< HEAD
            <div className="ax-cluster" style={actionsRowStyle}>
              {/* Category Segment Tabs */}
              <select
                id="punjab_category_filter"
                className="ax-input ax-input--sm"
                style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value as any)}
                aria-label="Category view"
              >
                <option value="all">All Lights ({allLights.length})</option>
                <option value="completed">Completed ({data?.completelights?.length || 0})</option>
                <option value="payment">Payment Stage ({data?.paymentlights?.length || 0})</option>
              </select>

              {/* District Filter */}
              {districts.length > 0 && (
                <select
                  id="punjab_district_filter"
                  className="ax-input ax-input--sm"
                  style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                  value={districtFilter}
                  onChange={(e) => setDistrictFilter(e.target.value)}
                  aria-label="Filter by district"
=======
            <div className="ax-cluster" style={{ gap: 8, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end' }}>
              {/* District Filter Dropdown */}
              {districts.length > 0 && (
                <select
                  value={districtFilter}
                  onChange={(e) => setDistrictFilter(e.target.value)}
                  className="ax-input ax-input--sm"
                  style={{ height: 32, fontSize: 12, minWidth: 120 }}
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328
                >
                  <option value="all">All Districts</option>
                  {districts.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              )}

<<<<<<< HEAD
              {/* Verify Status Filter */}
              <select
                id="punjab_status_filter"
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
                placeholder="Search UID, beneficiary, pole, light…"
                size="sm"
                ariaLabel="Search installed lights"
              />

              <TableExportToolbar
                onCopy={() => copyToClipboard(filteredLights, exportCols)}
                onExportCSV={() => exportToCSV(filteredLights, exportCols, `${fileBase}_${stamp}`)}
                onExportExcel={() => exportToExcel(filteredLights, exportCols, `${fileBase}_${stamp}`)}
                onExportPDF={() => exportToPDF(filteredLights, exportCols, fileTitle)}
=======
              {/* Verify Status Filter (Completed tab only) */}
              {isCompleted && (
                <select
                  value={verifyFilter}
                  onChange={(e) => setVerifyFilter(e.target.value)}
                  className="ax-input ax-input--sm"
                  style={{ height: 32, fontSize: 12, minWidth: 120 }}
                >
                  <option value="all">All Status</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
              )}

              <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search UID, pole, contact..." size="sm" />
              <TableExportToolbar
                onExportCSV={exportToCSV}
                onExportExcel={exportToExcel}
                onExportPDF={exportToPDF}
                onCopy={copyToClipboard}
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328
              />
            </div>
          </div>
        </div>

        {/* Scrollable Table */}
        <div className="ax-table-wrap">
<<<<<<< HEAD
          <table
            className="ax-table ax-table--hover ula-table--wide"
            style={{ whiteSpace: 'nowrap', minWidth: 2600 }}
          >
            <caption className="ax-visually-hidden">Completed Punjab SSL Installation Data</caption>
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
=======
          <table className="ax-table ax-table--hover">
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th" scope="col">Sr. No.</th>
                <th className="ax-table__th" scope="col">UID</th>
                <th className="ax-table__th" scope="col">State</th>
                <th className="ax-table__th" scope="col">District</th>
                <th className="ax-table__th" scope="col">Block</th>
                <th className="ax-table__th" scope="col">Panchayat</th>
                <th className="ax-table__th" scope="col">Ward No.</th>
                <th className="ax-table__th" scope="col">Pole No.</th>
                <th className="ax-table__th" scope="col">Beneficiary</th>
                <th className="ax-table__th" scope="col">Contact</th>
                <th className="ax-table__th" scope="col">UUID No.</th>
                <th className="ax-table__th" scope="col">Light No.</th>
                <th className="ax-table__th" scope="col">Panel No.</th>
                <th className="ax-table__th" scope="col">Battery No.</th>
                <th className="ax-table__th" scope="col">Photo 1</th>
                <th className="ax-table__th" scope="col">Photo 2</th>
                <th className="ax-table__th" scope="col">Verification</th>
                <th className="ax-table__th" scope="col">Claim</th>
                <th className="ax-table__th" scope="col">Payment</th>
                <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Action</th>
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328
              </tr>
            </thead>
            <tbody aria-busy={loading}>
              {loading && (
                <tr>
<<<<<<< HEAD
                  <td className="ax-table__td" colSpan={TOTAL_COLUMNS} style={centerCell}>
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading Punjab installation records from server…
                  </td>
                </tr>
              )}
              {!loading && filteredLights.length === 0 && (
                <tr>
                  <td className="ax-table__td" colSpan={TOTAL_COLUMNS} style={{ padding: 0 }}>
                    <TableEmptyState
                      title="No completed installation records found"
                      message={
                        hasFilters
                          ? 'No records match your filters or search. Try clearing your query.'
                          : 'Completed lights will appear here once installation work is recorded via the installation form.'
                      }
                      onClear={hasFilters ? resetFilters : undefined}
                      clearLabel="Clear filters"
=======
                  <td colSpan={20} style={{ textAlign: 'center', padding: 28 }}>
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading installed lights…
                  </td>
                </tr>
              )}

              {!loading && pagination.paginatedData.length === 0 && (
                <tr>
                  <td colSpan={20} style={{ padding: 0 }}>
                    <TableEmptyState
                      title={isCompleted ? 'No completed lights found' : 'No payment lights found'}
                      message="No lights match your active search or filter criteria."
                      onClear={() => {
                        setSearchQuery('');
                        setDistrictFilter('all');
                        setVerifyFilter('all');
                      }}
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328
                    />
                  </td>
                </tr>
              )}

              {!loading &&
<<<<<<< HEAD
                paginatedData.map((row, index) => {
                  const lat = txt(row, 'latitude');
                  const lng = txt(row, 'longitude');
                  const hasGeo = lat !== '' && lng !== '' && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng));
                  const lightLabel = row.unique_id || `Light #${row.id}`;
                  const vStatus = Number(row.inst_verify_status ?? row.verify_status ?? 0);
                  const rawVerifyStr = String(row.inst_verify_status ?? row.verify_status ?? '').toLowerCase().trim();
                  const isVerifyApproved = vStatus === 1 || rawVerifyStr === '1' || rawVerifyStr === 'approved';
                  const cStatus = Number(row.inst_claim_status ?? row.claim_status ?? 0);
                  const pStatus = Number(row.inst_pay_status ?? row.payment_status ?? 0);

                  return (
                    <tr key={row.id || index} className="ax-table__row">
                      <td className="ax-table__td ax-num">{(currentPage - 1) * pageSize + index + 1}</td>
                      <td className="ax-table__td">{txt(row, 'state') || 'Punjab'}</td>
                      <td className="ax-table__td"><b>{txt(row, 'district') || DASH}</b></td>
                      <td className="ax-table__td">{txt(row, 'block') || DASH}</td>
                      <td className="ax-table__td">{txt(row, 'panchayat') || DASH}</td>
                      <td className="ax-table__td" style={monoCell}>{txt(row, 'ward_no') || DASH}</td>
                      <td className="ax-table__td" style={monoCell}>{txt(row, 'pole_no') || DASH}</td>
                      <td className="ax-table__td">
                        <span style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>{row.beneficiary_name || DASH}</span>
                      </td>
                      <td className="ax-table__td" style={monoCell}>{row.contact_no || DASH}</td>
                      <td className="ax-table__td" style={monoCell}>{row.uuid_no || DASH}</td>
                      <td className="ax-table__td" style={monoCell}>{row.light_no || DASH}</td>
                      <td className="ax-table__td" style={monoCell}>{row.panel_no || DASH}</td>
                      <td className="ax-table__td" style={monoCell}>{row.battery_serial_no || row.battery_no || DASH}</td>

                      {/* Photo Thumbnails: NO BORDER RADIUS, Real Candidates, Click-to-Zoom */}
                      <td className="ax-table__td">
                        <InstallationThumbnail
                          src={row.light_file}
                          alt={`${lightLabel} - Light Photo 1`}
=======
                pagination.paginatedData.map((r, idx) => {
                  const isApproved = vStatusOf(r) === 1;
                  const cStatus = cStatusOf(r);
                  const pStatus = pStatusOf(r);
                  return (
                    <tr key={r.id || idx} className="ax-table__row">
                      <td className="ax-table__td ax-num" style={{ color: 'var(--ax-text-muted)' }}>
                        {(pagination.currentPage - 1) * pagination.pageSize + idx + 1}
                      </td>
                      <td className="ax-table__td ax-num" style={{ fontWeight: 700, color: '#2563eb' }}>
                        {r.unique_id || `#${r.id}`}
                      </td>
                      <td className="ax-table__td" style={{ textTransform: 'capitalize' }}>
                        {r.state || 'Punjab'}
                      </td>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{r.district || DASH}</td>
                      <td className="ax-table__td">{r.block || DASH}</td>
                      <td className="ax-table__td">{r.panchayat || DASH}</td>
                      <td className="ax-table__td ax-num">{r.ward_no ?? DASH}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{r.pole_no ?? DASH}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{r.beneficiary_name || DASH}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: 12 }}>
                        {r.contact_no || DASH}
                      </td>
                      <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: 12 }}>
                        {r.uuid_no || DASH}
                      </td>
                      <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: 12 }}>
                        {r.light_no || DASH}
                      </td>
                      <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: 12 }}>
                        {r.panel_no || DASH}
                      </td>
                      <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: 12 }}>
                        {r.battery_serial_no || DASH}
                      </td>
                      <td className="ax-table__td">
                        <LightThumbnail
                          src={r.light_file}
                          alt={`${r.unique_id || r.id} - Photo 1`}
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328
                          onPreview={openPreview}
                        />
                      </td>
                      <td className="ax-table__td">
<<<<<<< HEAD
                        <InstallationThumbnail
                          src={row.light_file2}
                          alt={`${lightLabel} - Light Photo 2`}
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
                        {row.remark || row.inst_remark || DASH}
                      </td>

                      {/* Status Badges */}
                      <td className="ax-table__td">
                        <VerifyBadge value={vStatus} raw={row.inst_verify_status ?? row.verify_status} />
                      </td>
                      <td className="ax-table__td">
                        <ClaimBadge status={cStatus} />
                      </td>
                      <td className="ax-table__td">
                        <PaymentBadge status={pStatus} />
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
=======
                        <LightThumbnail
                          src={r.light_file2}
                          alt={`${r.unique_id || r.id} - Photo 2`}
                          onPreview={openPreview}
                        />
                      </td>
                      <td className="ax-table__td">
                        {isApproved ? (
                          <Badge tone="success">Approved</Badge>
                        ) : vStatusOf(r) === 2 ? (
                          <Badge tone="danger">Rejected</Badge>
                        ) : (
                          <Badge tone="warning">Pending</Badge>
                        )}
                      </td>
                      <td className="ax-table__td">
                        {cStatus === 1 ? (
                          <Badge tone="info">Raised</Badge>
                        ) : (
                          <Badge tone="neutral">Not Raised</Badge>
                        )}
                      </td>
                      <td className="ax-table__td">
                        {pStatus === 1 ? (
                          <Badge tone="success">Paid</Badge>
                        ) : (
                          <Badge tone="warning">Pending</Badge>
                        )}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <button
                            type="button"
                            className="ax-btn ax-btn--ghost ax-btn--xs"
                            style={{ color: '#2563eb', fontWeight: 600 }}
                            onClick={() => {
                              setActiveItem(r);
                              setDetailModalOpen(true);
                            }}
                          >
                            View
                          </button>
                          <button
                            type="button"
                            className="ax-btn ax-btn--secondary ax-btn--xs"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            onClick={() => navigate(`/v/punjab/ssl/installation/update-light-deatils?ssl_id=${r.id}&edit=true`)}
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328
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
<<<<<<< HEAD
                            <span>Locked</span>
                          </span>
                        ) : (
                          <RowActionDropdown
                            onEdit={() => navigate(`/v/punjab/ssl/installation/update-light-deatils?ssl_id=${row.id}&edit=true`)}
                            onView={() => setDetailModalItem(row)}
                          />
                        )}
=======
                            <span>Edit</span>
                          </button>
                          {!isApproved && (
                            <button
                              type="button"
                              className="ax-btn ax-btn--primary ax-btn--xs"
                              style={{ background: '#10b981', borderColor: '#10b981', padding: '3px 8px' }}
                              onClick={() => {
                                setApprovingItem(r);
                                setApproveModalOpen(true);
                              }}
                            >
                              Approve
                            </button>
                          )}
                        </div>
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

<<<<<<< HEAD
        {/* ── Table Footer (exact Assam / Bihar pagination structure) ── */}
        <div className="ax-card__footer" style={footerStyle}>
          <div className="ula-pagination-left">
            <Pagination
              currentPage={currentPage}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[25, 50, 100, 200]}
=======
        {/* Pagination Footer */}
        <div className="ax-card__footer" style={footerStyle}>
          <div className="ula-pagination-left">
            <Pagination
              currentPage={pagination.currentPage}
              totalItems={pagination.totalItems}
              pageSize={pagination.pageSize}
              onPageChange={pagination.setPage}
              onPageSizeChange={pagination.setPageSize}
              pageSizeOptions={[10, 25, 50, 100]}
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328
            />
          </div>
        </div>
      </section>

<<<<<<< HEAD
      {/* ── Photo Preview Modal (Zoom, Fullscreen, Open in Tab) ── */}
      {preview && <ImagePreviewModal url={preview.url} title={preview.title} onClose={closePreview} />}

      {/* ── Detail View Modal ── */}
      <Modal open={!!detailModalItem} onClose={() => setDetailModalItem(null)} labelledBy="punjab-detail-title" dialogClass="ax-modal__dialog--md">
        {detailModalItem && (
          <div>
            <div className="ax-modal__header">
              <div>
                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700 }} id="punjab-detail-title">
                  Light Installation Record #{detailModalItem.unique_id || detailModalItem.id}
                </h4>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--ax-text-muted)' }}>
                  {detailModalItem.district ? `District: ${detailModalItem.district} · ` : ''}State: Punjab
                </p>
              </div>
              <button type="button" className="ax-modal__close" onClick={() => setDetailModalItem(null)}>
                {X_ICON}
              </button>
            </div>
            <div className="ax-modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="ula-m-grid">
                <div className="ula-m-info"><span>Beneficiary:</span> <b>{detailModalItem.beneficiary_name || DASH}</b></div>
                <div className="ula-m-info"><span>Contact No:</span> <b>{detailModalItem.contact_no || DASH}</b></div>
                <div className="ula-m-info"><span>Ward No:</span> <b>{detailModalItem.ward_no || DASH}</b></div>
                <div className="ula-m-info"><span>Pole No:</span> <b>{detailModalItem.pole_no || DASH}</b></div>
                <div className="ula-m-info"><span>Panchayat:</span> <b>{detailModalItem.panchayat || DASH}</b></div>
                <div className="ula-m-info"><span>Block:</span> <b>{detailModalItem.block || DASH}</b></div>
                <div className="ula-m-info"><span>UUID No:</span> <b>{detailModalItem.uuid_no || DASH}</b></div>
                <div className="ula-m-info"><span>Light No:</span> <b>{detailModalItem.light_no || DASH}</b></div>
                <div className="ula-m-info"><span>Panel No:</span> <b>{detailModalItem.panel_no || DASH}</b></div>
                <div className="ula-m-info"><span>Battery No:</span> <b>{detailModalItem.battery_serial_no || detailModalItem.battery_no || DASH}</b></div>
                <div className="ula-m-info"><span>Latitude:</span> <b>{detailModalItem.latitude || DASH}</b></div>
                <div className="ula-m-info"><span>Longitude:</span> <b>{detailModalItem.longitude || DASH}</b></div>
              </div>

              {detailModalItem.remark && (
                <div style={{ padding: '8px 12px', background: 'var(--ax-surface-subtle)', borderRadius: 6, fontSize: 12 }}>
                  <span style={{ color: 'var(--ax-text-muted)', fontWeight: 600 }}>Remarks: </span>
                  {detailModalItem.remark}
                </div>
              )}

              {/* Photos in modal */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 4 }}>
                {detailModalItem.light_file && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ax-text-muted)', marginBottom: 4 }}>Light Photo 1</div>
                    <img
                      src={resolvePunjabMediaUrl(detailModalItem.light_file)}
                      alt="Light Photo 1"
                      style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--ax-border)', cursor: 'zoom-in' }}
                      onClick={() => openPreview(resolvePunjabMediaUrl(detailModalItem.light_file), 'Light Photo 1')}
                    />
                  </div>
                )}
                {detailModalItem.light_file2 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ax-text-muted)', marginBottom: 4 }}>Light Photo 2</div>
                    <img
                      src={resolvePunjabMediaUrl(detailModalItem.light_file2)}
                      alt="Light Photo 2"
                      style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--ax-border)', cursor: 'zoom-in' }}
                      onClick={() => openPreview(resolvePunjabMediaUrl(detailModalItem.light_file2), 'Light Photo 2')}
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="ax-modal__footer">
              <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setDetailModalItem(null)}>
=======
      {/* ── Lightbox Image Preview Modal ── */}
      {preview.open && (
        <ImagePreviewModal
          url={preview.url}
          title={preview.title}
          onClose={closePreview}
        />
      )}

      {/* ── View Light Details Modal ── */}
      <Modal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={`Installation Record — ${activeItem?.unique_id || `#${activeItem?.id}`}`}
        subtitle={`State: ${activeItem?.state || 'Punjab'} · District: ${activeItem?.district || '—'} · Block: ${activeItem?.block || '—'}`}
        maxWidth={760}
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--ax-text-muted)' }}>Status:</span>
              {activeItem && vStatusOf(activeItem) === 1 ? (
                <Badge tone="success">Verified Approved</Badge>
              ) : (
                <Badge tone="warning">Pending Verification</Badge>
              )}
            </div>
            <div style={{ display: 'inline-flex', gap: 8 }}>
              {activeItem && (
                <button
                  type="button"
                  className="ax-btn ax-btn--primary ax-btn--sm"
                  onClick={() => {
                    setDetailModalOpen(false);
                    navigate(`/v/punjab/ssl/installation/update-light-deatils?ssl_id=${activeItem.id}&edit=true`);
                  }}
                >
                  Edit Installation
                </button>
              )}
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--sm"
                onClick={() => setDetailModalOpen(false)}
              >
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328
                Close
              </button>
            </div>
          </div>
<<<<<<< HEAD
        )}
      </Modal>
=======
        }
      >
        {activeItem && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Grid 1: Administrative & Beneficiary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, background: 'var(--ax-surface-subtle)', padding: 14, borderRadius: 10, border: '1px solid var(--ax-border)' }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)' }}>Beneficiary</span>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{activeItem.beneficiary_name || '—'}</div>
              </div>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)' }}>Contact No</span>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{activeItem.contact_no || '—'}</div>
              </div>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)' }}>Ward No</span>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{activeItem.ward_no || '—'}</div>
              </div>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)' }}>Panchayat</span>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{activeItem.panchayat || '—'}</div>
              </div>
            </div>

            {/* Grid 2: Hardware Identifiers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, background: 'var(--ax-surface-subtle)', padding: 14, borderRadius: 10, border: '1px solid var(--ax-border)' }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)' }}>Pole No</span>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{activeItem.pole_no || '—'}</div>
              </div>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)' }}>UUID No</span>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{activeItem.uuid_no || '—'}</div>
              </div>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)' }}>Light Luminary No</span>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{activeItem.light_no || '—'}</div>
              </div>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)' }}>Solar Panel No</span>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{activeItem.panel_no || '—'}</div>
              </div>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)' }}>Battery Serial No</span>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{activeItem.battery_serial_no || '—'}</div>
              </div>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)' }}>GPS Coordinates</span>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#2563eb' }}>
                  {activeItem.latitude && activeItem.longitude ? `${activeItem.latitude}, ${activeItem.longitude}` : '—'}
                </div>
              </div>
            </div>

            {/* Photos Preview */}
            <div>
              <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)' }}>
                Installation Photographs
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                <div style={{ border: '1px solid var(--ax-border)', borderRadius: 10, padding: 10, textAlign: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 8 }}>Photo 1 (Pole & Luminary)</span>
                  <LightThumbnail
                    src={activeItem.light_file}
                    alt="Photo 1"
                    size={90}
                    onPreview={openPreview}
                  />
                </div>
                <div style={{ border: '1px solid var(--ax-border)', borderRadius: 10, padding: 10, textAlign: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 8 }}>Photo 2 (Battery Tag)</span>
                  <LightThumbnail
                    src={activeItem.light_file2}
                    alt="Photo 2"
                    size={90}
                    onPreview={openPreview}
                  />
                </div>
              </div>
            </div>

            {/* Remarks */}
            {activeItem.remark || activeItem.inst_remark ? (
              <div style={{ padding: 12, background: 'var(--ax-surface-subtle)', borderRadius: 8, fontSize: 13 }}>
                <b>Remark:</b> {activeItem.remark || activeItem.inst_remark}
              </div>
            ) : null}
          </div>
        )}
      </Modal>

      {/* ── Approve Modal ── */}
      <Modal
        open={approveModalOpen}
        onClose={() => setApproveModalOpen(false)}
        title="Approve Installation Record"
        subtitle={`Mark light #${approvingItem?.unique_id || approvingItem?.id} as field-verified and approved`}
        maxWidth={480}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, width: '100%' }}>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={() => setApproveModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="ax-btn ax-btn--primary ax-btn--sm"
              style={{ background: '#10b981', borderColor: '#10b981' }}
              onClick={handleApproveConfirm}
            >
              Confirm Approval
            </button>
          </div>
        }
      >
        <p style={{ margin: 0, fontSize: 13, color: 'var(--ax-text-muted)' }}>
          Are you sure you want to mark this light installation as verified and approved? Once approved, it will be eligible for claim processing.
        </p>
      </Modal>
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328
    </div>
  );
}

export default Punjab_Installation_SSL_InstallationDetail;
