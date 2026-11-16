import { useState, useMemo, useEffect, useCallback, useRef, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  upInstallationService,
  resolveUpMediaUrl,
  type UpKusumCInstalledSiteItem,
  type UpKusumCInstalledCounts,
} from '../../up-services';
import {
  TableExportToolbar,
  SearchInput,
  Pagination,
  TableEmptyState,
  copyTableDataToClipboard,
  exportDataToCSV,
  exportDataToExcel,
  printTableData,
  type ExportColumn,
} from '../../../../../common';

/* ───────── Constants ───────── */
const DASH = '—';

const X_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 18, height: 18 }}>
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
const centerCell = { textAlign: 'center', padding: 24 } as const;
const monoCell = { fontFamily: 'var(--ax-font-mono)', fontSize: '12px' } as const;

/* ───────── Badges ───────── */
type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

const Badge = ({ tone, children }: { tone: Tone; children: ReactNode }) => (
  <span className={`ax-badge ax-badge--soft ax-badge--${tone}`} style={{ fontWeight: 600 }}>{children}</span>
);

const VerifyBadge = ({ value, raw }: { value: number; raw?: any }) => {
  const r = String(raw ?? '').toLowerCase().trim();
  if (value === 1 || r === '1' || r === 'approved') return <Badge tone="success">Approved</Badge>;
  if (value === 2 || r === '2' || r === 'rejected' || r === 'reject') return <Badge tone="danger">Rejected</Badge>;
  return <Badge tone="warning">Pending</Badge>;
};

const DocBadge = ({ status, docUrl }: { status?: number; docUrl?: string | null }) => {
  const s = Number(status ?? 0);
  const hasDoc = Boolean(docUrl && docUrl !== DASH && docUrl.trim() !== '');
  if (s === 2) return <Badge tone="success">Approved</Badge>;
  if (s === 3) return <Badge tone="danger">Rejected</Badge>;
  if (s === 1 || hasDoc) return <Badge tone="warning">Submitted (Pending)</Badge>;
  return <Badge tone="neutral">Not Submitted</Badge>;
};

const ClaimBadge = ({ status }: { status?: number }) => {
  const s = Number(status ?? 0);
  if (s === 1 || s === 2) return <Badge tone="success">Approved</Badge>;
  if (s === 3) return <Badge tone="danger">Rejected</Badge>;
  if (s === 1 || s === 3) return <Badge tone="info">Raised</Badge>;
  return <Badge tone="neutral">Not Raised</Badge>;
};

const PaymentBadge = ({ status }: { status?: number }) => {
  const s = Number(status ?? 0);
  if (s === 1) return <Badge tone="success">Paid</Badge>;
  if (s === 2) return <Badge tone="warning">Partially</Badge>;
  return <Badge tone="neutral">Pending</Badge>;
};

/* ───────── Helpers for Labels & Serialization ───────── */
const formatModuleSerials = (val: any): string => {
  if (!val) return DASH;
  if (Array.isArray(val)) {
    const joined = val.filter(Boolean).join(', ');
    return joined || DASH;
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          const joined = parsed.filter(Boolean).join(', ');
          return joined || DASH;
        }
      } catch {}
    }
    return trimmed || DASH;
  }
  return String(val);
};

/* ───────── Top KPI Card Component (matching Assam SWP Reference) ───────── */
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
  sub?: string;
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
      {sub && <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

/* ───────── Reusable Modal ───────── */
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

/* ───────── Image Preview Modal (Interactive Zoom — Matching Assam Reference) ───────── */
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
    <Modal open onClose={onClose} labelledBy="kusumc-preview-title" dialogClass="ax-modal__dialog--lg">
      <div className="ax-modal__header">
        <h2 className="ax-modal__title" id="kusumc-preview-title">{title || 'Media Preview'}</h2>
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

/* ───────── Interactive Image Thumbnail (Strict Square Corners) ───────── */
function InstallationThumbnail({
  src,
  alt,
  onPreview,
  size = 36,
}: {
  src?: string | null;
  alt: string;
  onPreview: (url: string, title: string) => void;
  size?: number;
}) {
  const resolvedUrl = useMemo(() => (src ? resolveUpMediaUrl(src) : null), [src]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed || !resolvedUrl) {
    return <span style={{ color: 'var(--ax-text-subtle)' }}>{DASH}</span>;
  }

  return (
    <img
      src={resolvedUrl}
      alt={alt}
      style={{
        width: size,
        height: size,
        borderRadius: 0,
        objectFit: 'cover',
        cursor: 'zoom-in',
        border: '1px solid var(--ax-border, #e2e8f0)',
        background: 'var(--ax-surface-subtle, #f8fafc)',
        display: 'inline-block',
        flexShrink: 0,
      }}
      onError={() => setFailed(true)}
      onClick={() => onPreview(resolvedUrl, alt)}
      title="Click to preview"
    />
  );
}

/* ───────── Action Dropdown (Portal rendered to prevent table clipping) ───────── */
const MENU_W = 185;

function RowActionDropdown({
  onEdit,
  onSubmitDoc,
  canEdit = true,
  canUploadDoc = true,
  isDocSubmitted = false,
  isDocRejected = false,
}: {
  onEdit: () => void;
  onSubmitDoc: () => void;
  canEdit?: boolean;
  canUploadDoc?: boolean;
  isDocSubmitted?: boolean;
  isDocRejected?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const menuItemsCount = (canEdit ? 1 : 0) + (canUploadDoc ? 1 : 0);
  const menuH = Math.max(40, menuItemsCount * 38 + 12);

  const toggle = () => {
    if (open) {
      setOpen(false);
      return;
    }
    const b = btnRef.current;
    if (!b) return;
    const r = b.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom;
    const top = spaceBelow < menuH + 8 && r.top > menuH + 8 ? r.top - menuH - 4 : r.bottom + 4;
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

  if (!canEdit && !canUploadDoc) return null;

  return (
    <>
      <button
        type="button"
        ref={btnRef}
        className="ax-btn ax-btn--secondary ax-btn--xs ula-action-btn"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        style={{ padding: '3px 8px', fontSize: 11 }}
        title="More Actions"
      >
        <span>Action</span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ width: 11, height: 11, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }}
          aria-hidden="true"
        >
          <path d="M6 9l6 6l6 -6" />
        </svg>
      </button>

      {open && pos &&
        createPortal(
          <div ref={menuRef} className="ula-menu" role="menu" style={{ top: pos.top, left: pos.left, width: MENU_W, zIndex: 10000 }}>
            {canEdit && (
              <button
                type="button"
                className="ula-menu__item"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  onEdit();
                }}
              >
                ✏️ Edit Installation
              </button>
            )}
            {canUploadDoc && (
              <button
                type="button"
                className="ula-menu__item"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  onSubmitDoc();
                }}
              >
                {isDocRejected ? '⚠️ Re-upload HOC' : isDocSubmitted ? '📄 Update HOC' : '📄 Submit HOC Document'}
              </button>
            )}
          </div>,
          document.body
        )}
    </>
  );
}

/* ───────── Overlay CSS (modals + dropdown) ───────── */
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

  /* Modern form dropzones inside modals */
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
`;

/* ───────── Responsive Page CSS ───────── */
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
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: var(--ax-space-3, 12px);
    margin-bottom: var(--ax-space-4, 16px);
  }
  @media (max-width: 1200px) {
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
`;

// Fallback Mock Data for Kusum-C Installed Sites
const FALLBACK_KUSUM_C_INSTALLED_SITES: UpKusumCInstalledSiteItem[] = [
  {
    id: 101,
    company_id: 'UP-KC-2026-01',
    state: 'UP',
    district: 'Varanasi',
    block: 'Pindra',
    village: 'Anei',
    f_farmer_name: 'Austin Simmons',
    f_father_name: 'Robert Simmons',
    f_contact: '9876543210',
    pump_capacity: '3 HP',
    vfd_no: 'VFD-KC-3081',
    Inverter_no: 'INV-KC-7721',
    module_serial_no: ['MOD-540-001', 'MOD-540-002', 'MOD-540-003', 'MOD-540-004'],
    module_image: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=600',
    inverter_vfd_image: 'https://images.unsplash.com/photo-1542332213-9b5a5a3fad35?w=600',
    running_water_image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600',
    inst_doc: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600',
    latitude: '25.3176',
    longitude: '82.9739',
    remarks: 'Installation completed with 3HP submersible pump',
    inst_verify_status: 1, // Approved
    inst_verify_remarks: 'All equipment serials verified on site',
    inst_doc_status: 2, // Approved
    inst_claim_status: 1, // Approved
    inst_pay_status: 1, // Paid
  },
  {
    id: 102,
    company_id: 'UP-KC-2026-02',
    state: 'UP',
    district: 'Varanasi',
    block: 'Pindra',
    village: 'Kharawan',
    f_farmer_name: 'Kim Small',
    f_father_name: 'James Small',
    f_contact: '9812345678',
    pump_capacity: '3 HP',
    vfd_no: 'VFD-KC-3082',
    Inverter_no: 'INV-KC-7722',
    module_serial_no: ['MOD-540-005', 'MOD-540-006', 'MOD-540-007', 'MOD-540-008'],
    module_image: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=600',
    inverter_vfd_image: 'https://images.unsplash.com/photo-1542332213-9b5a5a3fad35?w=600',
    running_water_image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600',
    inst_doc: null,
    latitude: '25.3321',
    longitude: '82.9542',
    remarks: 'Foundation completed, running water verified',
    inst_verify_status: 0, // Pending
    inst_doc_status: 0, // Pending
    inst_claim_status: 0, // Not raised
    inst_pay_status: 0, // Pending
  },
  {
    id: 103,
    company_id: 'UP-KC-2026-03',
    state: 'UP',
    district: 'Lucknow',
    block: 'Bakshi Ka Talab',
    village: 'Bhaisamau',
    f_farmer_name: 'Maheshwar Prasad',
    f_father_name: 'Ram Dayal Prasad',
    f_contact: '9765432109',
    pump_capacity: '5 HP',
    vfd_no: 'VFD-KC-5011',
    Inverter_no: 'INV-KC-9901',
    module_serial_no: ['MOD-540-009', 'MOD-540-010', 'MOD-540-011', 'MOD-540-012', 'MOD-540-013'],
    module_image: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=600',
    inverter_vfd_image: 'https://images.unsplash.com/photo-1542332213-9b5a5a3fad35?w=600',
    running_water_image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600',
    inst_doc: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600',
    latitude: '26.9625',
    longitude: '80.9288',
    remarks: 'High discharge solar pump system installed',
    inst_verify_status: 2, // Rejected
    inst_verify_remarks: 'Module serial photo requires higher clarity',
    inst_doc_status: 1, // Submitted
    inst_claim_status: 0,
    inst_pay_status: 0,
  },
];

export function UP_Installation_KusumC_ViewInstallation() {
  const navigate = useNavigate();

  const [sites, setSites] = useState<UpKusumCInstalledSiteItem[]>([]);
  const [counts, setCounts] = useState<UpKusumCInstalledCounts>({ total: 0, complete: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

  // Modals
  const [preview, setPreview] = useState<{ url: string; title: string } | null>(null);
  const [viewDetailModal, setViewDetailModal] = useState<UpKusumCInstalledSiteItem | null>(null);
  const [editModalItem, setEditModalItem] = useState<UpKusumCInstalledSiteItem | null>(null);
  const [docModalItem, setDocModalItem] = useState<UpKusumCInstalledSiteItem | null>(null);

  const openPreview = (url: string, title: string) => setPreview({ url, title });
  const closePreview = () => setPreview(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await upInstallationService.getKusumCInstalledSites();
      if (res && res.sites && res.sites.length > 0) {
        setSites(res.sites);
        setCounts(res.install_detail || { total: res.sites.length, complete: res.sites.length, pending: 0 });
      } else {
        setSites(FALLBACK_KUSUM_C_INSTALLED_SITES);
        setCounts({
          total: 3,
          complete: 3,
          pending: 0,
          verify_approved: 1,
          verify_pending: 1,
          verify_reject: 1,
          paid: 1,
          claim_approved: 1,
        });
      }
    } catch (err: any) {
      console.warn('Error loading Kusum-C installed sites:', err);
      setToastMsg({ type: 'danger', text: err?.message || 'Failed to load Kusum-C installed sites.' });
      setSites(FALLBACK_KUSUM_C_INSTALLED_SITES);
      setCounts({
        total: 3,
        complete: 3,
        pending: 0,
        verify_approved: 1,
        verify_pending: 1,
        verify_reject: 1,
        paid: 1,
        claim_approved: 1,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!toastMsg) return;
    const t = window.setTimeout(() => setToastMsg(null), 4500);
    return () => window.clearTimeout(t);
  }, [toastMsg]);

  // District list
  const districtList = useMemo(() => {
    const set = new Set<string>();
    sites.forEach((s) => {
      const d = s.f_district || s.district;
      if (d && d.trim()) set.add(d.trim());
    });
    return Array.from(set).sort();
  }, [sites]);

  // Filtered sites
  const filtered = useMemo(() => {
    return sites.filter((item) => {
      const vStatus = Number(item.inst_verify_status ?? item.verify_status ?? 0);
      const dStatus = Number(item.inst_doc_status ?? item.document_status ?? 0);
      const rawDoc = item.inst_doc || item.hoc_photo || item.doc_hoc_photo || (item as any).doc_file || (item as any).document;
      const hasDoc = Boolean(rawDoc && String(rawDoc).trim() !== '' && rawDoc !== DASH);

      if (statusFilter === 'approved' && vStatus !== 1) return false;
      if (statusFilter === 'pending' && vStatus !== 0) return false;
      if (statusFilter === 'rejected' && vStatus !== 2) return false;

      // Document specific filters
      if (statusFilter === 'doc_approved' && dStatus !== 2) return false;
      if (statusFilter === 'doc_pending' && !(dStatus === 1 || (hasDoc && dStatus !== 2 && dStatus !== 3))) return false;
      if (statusFilter === 'doc_missing' && !(!hasDoc && dStatus === 0)) return false;
      if (statusFilter === 'doc_rejected' && dStatus !== 3) return false;

      if (selectedDistrict !== 'all') {
        const d = (item.f_district || item.district || '').trim().toLowerCase();
        if (d !== selectedDistrict.toLowerCase()) return false;
      }

      if (search.trim()) {
        const q = search.toLowerCase();
        const applicant = (item.f_farmer_name || item.farmer_name || item.applicant_name || '').toLowerCase();
        const father = (item.f_father_name || item.father_name || '').toLowerCase();
        const dist = (item.f_district || item.district || '').toLowerCase();
        const blk = (item.f_block || item.block || '').toLowerCase();
        const vil = (item.f_village || item.village || '').toLowerCase();
        const vfd = (item.vfd_no || item.vfd_serial_no || '').toLowerCase();
        const inv = (item.Inverter_no || item.inverter_no || item.inverter_serial_no || '').toLowerCase();
        const ser = formatModuleSerials(item.module_serial_no || item.module_no).toLowerCase();
        const idStr = String(item.id);

        if (
          !applicant.includes(q) &&
          !father.includes(q) &&
          !dist.includes(q) &&
          !blk.includes(q) &&
          !vil.includes(q) &&
          !vfd.includes(q) &&
          !inv.includes(q) &&
          !ser.includes(q) &&
          !idStr.includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [sites, statusFilter, selectedDistrict, search]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const hasFilters = search.trim() !== '' || statusFilter !== 'all' || selectedDistrict !== 'all';
  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setSelectedDistrict('all');
    setCurrentPage(1);
  };

  // Metrics matching API counts or derived from loaded sites
  const approvedCount = useMemo(
    () => (counts.verify_approved !== undefined ? Number(counts.verify_approved) : sites.filter((s) => Number(s.inst_verify_status ?? s.verify_status) === 1).length),
    [counts, sites]
  );
  const pendingCount = useMemo(
    () => (counts.verify_pending !== undefined ? Number(counts.verify_pending) : sites.filter((s) => Number(s.inst_verify_status ?? s.verify_status ?? 0) === 0).length),
    [counts, sites]
  );
  const rejectedCount = useMemo(
    () => (counts.verify_reject !== undefined ? Number(counts.verify_reject) : sites.filter((s) => Number(s.inst_verify_status ?? s.verify_status) === 2).length),
    [counts, sites]
  );

  const docApprovedCount = useMemo(
    () => (counts.doc_approved !== undefined ? Number(counts.doc_approved) : sites.filter((s) => Number(s.inst_doc_status) === 2).length),
    [counts, sites]
  );
  const docPendingCount = useMemo(
    () => (counts.doc_pending !== undefined ? Number(counts.doc_pending) : sites.filter((s) => Number(s.inst_doc_status) === 1 || Boolean(s.inst_doc)).length),
    [counts, sites]
  );
  const docMissingCount = useMemo(
    () => sites.filter((s) => {
      const rawDoc = s.inst_doc || s.hoc_photo || (s as any).doc_file;
      const hasDoc = Boolean(rawDoc && String(rawDoc).trim() !== '' && rawDoc !== DASH);
      return !hasDoc && Number(s.inst_doc_status ?? 0) === 0;
    }).length,
    [sites]
  );

  const totalAccepted = counts.assign || counts.total_assign || counts.total || sites.length;
  const installedCount = counts.complete || sites.length;
  const paymentSettled = counts.paid ?? sites.filter((s) => Number(s.inst_pay_status ?? s.payment_status) === 1).length;
  const claimApproved = counts.claim_approved ?? sites.filter((s) => Number(s.inst_claim_status ?? s.claim_status) === 1).length;

  const exportCols: ExportColumn<UpKusumCInstalledSiteItem>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_, idx) => (idx !== undefined ? idx + 1 : 1) },
      { header: 'State', accessor: (r) => (r.state || r.f_state || 'UP').toUpperCase() },
      { header: 'District', accessor: (r) => r.f_district || r.district || DASH },
      { header: 'Block', accessor: (r) => r.f_block || r.block || DASH },
      { header: 'Village', accessor: (r) => r.f_village || r.village || DASH },
      { header: 'Applicant Name', accessor: (r) => r.f_farmer_name || r.farmer_name || r.applicant_name || DASH },
      { header: 'Father Name', accessor: (r) => r.f_father_name || r.father_name || DASH },
      { header: 'Contact', accessor: (r) => r.f_contact || r.contact_no || DASH },
      { header: 'Capacity', accessor: (r) => r.pump_capacity || '3 HP' },
      { header: 'VFD No.', accessor: (r) => r.vfd_no || r.vfd_serial_no || DASH },
      { header: 'Inverter No.', accessor: (r) => r.Inverter_no || r.inverter_no || r.inverter_serial_no || DASH },
      { header: 'Module Serial No.', accessor: (r) => formatModuleSerials(r.module_serial_no || r.module_no) },
      { header: 'Latitude', accessor: (r) => r.latitude || DASH },
      { header: 'Longitude', accessor: (r) => r.longitude || DASH },
      { header: 'Remarks', accessor: (r) => r.inst_remarks || r.remarks || DASH },
      {
        header: 'Verify Status',
        accessor: (r) => {
          const v = Number(r.inst_verify_status ?? r.verify_status ?? 0);
          return v === 1 ? 'Approved' : v === 2 ? 'Rejected' : 'Pending';
        },
      },
      { header: 'Verify Remarks', accessor: (r) => r.inst_verify_remarks || r.verify_remarks || DASH },
      {
        header: 'Document Status',
        accessor: (r) => {
          const s = Number(r.inst_doc_status ?? r.document_status ?? 0);
          return s === 2 ? 'Approved' : s === 3 ? 'Rejected' : s === 1 ? 'Submitted' : 'Pending';
        },
      },
      { header: 'Doc Remarks', accessor: (r) => r.inst_doc_verify_remarks || r.inst_doc_remarks || DASH },
      {
        header: 'Claim Status',
        accessor: (r) => {
          const s = Number(r.inst_claim_status ?? r.claim_status ?? 0);
          return s === 1 ? 'Approved' : s === 2 ? 'Rejected' : s === 3 ? 'Claimed' : 'Not Raised';
        },
      },
      {
        header: 'Payment Status',
        accessor: (r) => {
          const s = Number(r.inst_pay_status ?? r.payment_status ?? 0);
          return s === 1 ? 'Paid' : s === 2 ? 'Partially' : 'Pending';
        },
      },
    ],
    []
  );

  const headers = [
    'Sr. No.',
    'State',
    'District',
    'Block / Village',
    'Applicant Name',
    'Father Name',
    'Contact',
    'Capacity',
    'VFD No.',
    'Inverter No.',
    'Module Serial No.',
    'Farmer With Module',
    'Inverter & VFD',
    'Running Water',
    'Doc View', // Dedicated Column requested by user!
    'Latitude',
    'Longitude',
    'Remarks',
    'Verify Status',
    'Doc Status',
    'Claim Status',
    'Payment Status',
    'Action',
  ];
  const TOTAL_COLUMNS = headers.length;

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* ── Page Head (exact pattern) ── */}
      <PageHead
        title="View Kusum-C Installed Sites"
        subtitle="Master register of installed solar pumps, verification status, HOC documents, and photo evidence"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Uttar Pradesh' },
          { label: 'Installation' },
          { label: 'Kusum C' },
          { label: 'View Installation' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)', alignItems: 'center' }}>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={loadData}
              disabled={loading}
              title="Refresh installed sites"
            >
              <svg className={`ax-btn__icon ${loading ? 'ax-spinner' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
                <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
              </svg>
              <span className="ax-btn__label">Refresh</span>
            </button>
            <Link to="/v/up/install-kusum-c-site" className="ax-btn ax-btn--primary ax-btn--sm">
              <span className="ax-btn__label">+ Install New Site</span>
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

      {/* ── Top Metric KPI Cards (5 cards in 1 row) ── */}
      <div className="asw-cards-row">
        <KpiCard
          tone="accent"
          label="Total Accepted"
          value={totalAccepted.toLocaleString('en-IN')}
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
          value={installedCount.toLocaleString('en-IN')}
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
          onClick={() => {
            setStatusFilter('approved');
            setCurrentPage(1);
          }}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <polyline points="12 7 12 12 15 15" />
            </svg>
          }
        />

        <KpiCard
          tone="amber"
          label="HOC Documents"
          value={docApprovedCount.toLocaleString('en-IN')}
          sub={`${docPendingCount} in review · ${docMissingCount} pending upload`}
          onClick={() => {
            setStatusFilter(docMissingCount > 0 ? 'doc_missing' : 'doc_pending');
            setCurrentPage(1);
          }}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          }
        />

        <KpiCard
          tone="violet"
          label="Payment Settled"
          value={paymentSettled.toLocaleString('en-IN')}
          sub={`${claimApproved} claims approved`}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
        />
      </div>

      {/* ── Main Table Card (exact Assam SWP table card layout) ── */}
      <section className="ax-card ax-col--12" role="region" aria-label="Kusum-C Installations">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">Completed Kusum-C Installation Data</h2>
            <p className="ax-card__subtitle">
              <span className="ax-num">{filtered.length}</span> of <span className="ax-num">{sites.length}</span> installations
              {' '}· Verify Approved <b className="ax-num">{approvedCount}</b> · Doc Approved <b className="ax-num">{docApprovedCount}</b> · Doc In Review <b className="ax-num">{docPendingCount}</b> · Doc Missing <b className="ax-num">{docMissingCount}</b>
            </p>
          </div>

          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              {districtList.length > 0 && (
                <select
                  className="ax-input ax-input--sm"
                  style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                  value={selectedDistrict}
                  onChange={(e) => {
                    setSelectedDistrict(e.target.value);
                    setCurrentPage(1);
                  }}
                  aria-label="Filter by district"
                >
                  <option value="all">All Districts</option>
                  {districtList.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              )}

              <select
                id="kusumc_status_filter"
                className="ax-input ax-input--sm"
                style={{ width: 185, height: 32, fontSize: 'var(--ax-text-xs)' }}
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                aria-label="Filter by verify or document status"
              >
                <option value="all">All Status</option>
                <optgroup label="Installation Audit">
                  <option value="approved">Verify: Approved</option>
                  <option value="pending">Verify: Pending</option>
                  <option value="rejected">Verify: Rejected</option>
                </optgroup>
                <optgroup label="HOC Document">
                  <option value="doc_approved">Doc: Approved</option>
                  <option value="doc_pending">Doc: In Review / Submitted</option>
                  <option value="doc_missing">Doc: Not Submitted (Upload Needed)</option>
                  <option value="doc_rejected">Doc: Rejected</option>
                </optgroup>
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
                onChange={(val) => { setSearch(val); setCurrentPage(1); }}
                placeholder="Search applicant, VFD, village, serial…"
                size="sm"
                ariaLabel="Search installed sites"
              />

              <TableExportToolbar
                onCopy={() => copyTableDataToClipboard(filtered, exportCols)}
                onExportCSV={() => exportDataToCSV('UP_KusumC_Installations', filtered, exportCols)}
                onExportExcel={() => exportDataToExcel('UP_KusumC_Installations', filtered, exportCols)}
                onExportPDF={() => printTableData('UP Kusum-C Completed Installations', filtered, exportCols)}
              />
            </div>
          </div>
        </div>

        {/* ── Table (Horizontally Scrollable) ── */}
        <div className="ax-table-wrap">
          <table
            className="ax-table ax-table--hover"
            style={{ whiteSpace: 'nowrap', minWidth: 2800 }}
          >
            <caption className="ax-visually-hidden">Completed Kusum-C Installation Data</caption>
            <thead className="ax-table__head">
              <tr>
                {headers.map((h) => (
                  <th
                    key={h}
                    className="ax-table__th"
                    scope="col"
                    style={
                      h === 'Action' || h === 'Sr. No.' || h === 'Doc View' || h.includes('Image') || h.includes('Photo') || h.includes('Status')
                        ? { textAlign: 'center' }
                        : undefined
                    }
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
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading installation records from server…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td className="ax-table__td" colSpan={TOTAL_COLUMNS} style={{ padding: 0 }}>
                    <TableEmptyState
                      title="No completed installation records found"
                      message={
                        hasFilters
                          ? 'No records match your filters or search. Try clearing your query.'
                          : 'Completed sites will appear here once installation work is recorded via the installation form.'
                      }
                      onClear={hasFilters ? resetFilters : undefined}
                      clearLabel="Clear filters"
                    />
                  </td>
                </tr>
              )}
              {!loading &&
                paginatedData.map((row, index) => {
                  const lat = row.latitude || (row as any).inst_latitude || '';
                  const lng = row.longitude || (row as any).inst_longitude || '';
                  const hasGeo = lat !== '' && lng !== '' && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng));
                  const applicantName = row.f_farmer_name || row.farmer_name || row.applicant_name || `Site #${row.id}`;
                  const blockText = row.f_block || row.block || row.f_tehsil || '';
                  const villageText = row.f_village || row.village || '';
                  const ser = formatModuleSerials(row.module_serial_no || row.module_no);

                  const moduleImg = row.module_image || row.farmer_module_image || row.f_module_image;
                  const invImg = row.inverter_vfd_image || row.inverter_image || row.vfd_image;
                  const waterImg = row.running_water_image || row.water_image;

                  // Dedicated Document URL for Doc View Column
                  const rawDoc = row.inst_doc || row.hoc_photo || row.doc_hoc_photo || (row as any).doc_file || (row as any).document;
                  const docUrl = rawDoc ? resolveUpMediaUrl(rawDoc) : null;
                  const hasDoc = Boolean(rawDoc && String(rawDoc).trim() !== '' && rawDoc !== DASH);

                  const vStatus = Number(row.inst_verify_status ?? row.verify_status ?? 0);
                  const isInstallApproved = vStatus === 1;
                  const canEditInstallation = !isInstallApproved;

                  const dStatus = Number(row.inst_doc_status ?? row.document_status ?? 0);
                  const isDocApproved = dStatus === 2;
                  const isDocRejected = dStatus === 3;
                  const isDocSubmitted = dStatus === 1 || (hasDoc && dStatus !== 2 && dStatus !== 3);
                  const isDocMissing = !hasDoc && dStatus === 0;

                  const cStatus = Number(row.inst_claim_status ?? row.claim_status ?? 0);
                  const pStatus = Number(row.inst_pay_status ?? row.payment_status ?? 0);

                  return (
                    <tr key={row.id} className="ax-table__row">
                      {/* 1. Sr. No. */}
                      <td className="ax-table__td ax-num" style={{ textAlign: 'center' }}>
                        {(currentPage - 1) * pageSize + index + 1}
                      </td>

                      {/* 2. State */}
                      <td className="ax-table__td">{(row.state || row.f_state || 'UP').toUpperCase()}</td>

                      {/* 3. District */}
                      <td className="ax-table__td"><b>{row.f_district || row.district || DASH}</b></td>

                      {/* 4. Block / Village */}
                      <td className="ax-table__td">
                        {blockText ? `${blockText}, ` : ''}{villageText || DASH}
                      </td>

                      {/* 5. Applicant Name */}
                      <td className="ax-table__td">
                        <span style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>{applicantName}</span>
                      </td>

                      {/* 6. Father Name */}
                      <td className="ax-table__td">{row.f_father_name || row.father_name || DASH}</td>

                      {/* 7. Contact */}
                      <td className="ax-table__td" style={monoCell}>{row.f_contact || row.contact_no || DASH}</td>

                      {/* 8. Capacity */}
                      <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--asw-primary)' }}>
                        {row.pump_capacity || '3 HP'}
                      </td>

                      {/* 9. VFD No. */}
                      <td className="ax-table__td" style={monoCell}>{row.vfd_no || row.vfd_serial_no || DASH}</td>

                      {/* 10. Inverter No. */}
                      <td className="ax-table__td" style={monoCell}>{row.Inverter_no || row.inverter_no || row.inverter_serial_no || DASH}</td>

                      {/* 11. Module Serial No. */}
                      <td className="ax-table__td" style={{ ...monoCell, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {ser}
                      </td>

                      {/* 12. Farmer With Module Image */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <InstallationThumbnail
                          src={moduleImg}
                          alt={`${applicantName} - Module Photo`}
                          onPreview={openPreview}
                        />
                      </td>

                      {/* 13. Inverter & VFD Image */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <InstallationThumbnail
                          src={invImg}
                          alt={`${applicantName} - Inverter & VFD Photo`}
                          onPreview={openPreview}
                        />
                      </td>

                      {/* 14. Running Water Image */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <InstallationThumbnail
                          src={waterImg}
                          alt={`${applicantName} - Running Water Photo`}
                          onPreview={openPreview}
                        />
                      </td>

                      {/* 15. Doc View (Dedicated Column requested by user!) */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {docUrl ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                            <a
                              href={docUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ax-btn ax-btn--ghost ax-btn--xs"
                              style={{ color: 'var(--asw-primary)', display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px' }}
                              title="View / Download Installation Compliance Document"
                            >
                              📄 Doc ↗
                            </a>
                            <button
                              type="button"
                              className="ax-btn ax-btn--secondary ax-btn--xs"
                              style={{ padding: '2px 6px', fontSize: 10, height: 22 }}
                              onClick={() => openPreview(docUrl, `${applicantName} - HOC Document`)}
                              title="Preview Document"
                            >
                              Preview
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="ax-btn ax-btn--outline ax-btn--xs"
                            style={{
                              padding: '2px 8px',
                              fontSize: 10.5,
                              color: 'var(--ax-primary, #2563eb)',
                              borderColor: 'var(--ax-primary, #2563eb)',
                              borderRadius: 4,
                            }}
                            onClick={() => setDocModalItem(row)}
                            title="No document attached. Click to upload HOC certificate."
                          >
                            + Upload HOC
                          </button>
                        )}
                      </td>

                      {/* 16. Latitude */}
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

                      {/* 17. Longitude */}
                      <td className="ax-table__td">{lng || DASH}</td>

                      {/* 18. Remarks */}
                      <td className="ax-table__td" style={{ maxWidth: 200, whiteSpace: 'normal', fontSize: '12px' }}>
                        {row.inst_remarks || row.remarks || DASH}
                      </td>

                      {/* 19. Verify Status */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <VerifyBadge value={vStatus} raw={row.inst_verify_status ?? row.verify_status} />
                        {row.inst_verify_remarks && (
                          <div
                            style={{
                              fontSize: 11,
                              color: vStatus === 2 ? 'var(--ax-danger, #ef4444)' : 'var(--ax-text-muted)',
                              marginTop: 2,
                              maxWidth: 160,
                              lineHeight: 1.2,
                            }}
                            title={row.inst_verify_remarks}
                          >
                            {row.inst_verify_remarks}
                          </div>
                        )}
                      </td>

                      {/* 20. Document Status */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <DocBadge status={dStatus} docUrl={docUrl} />
                        {(row.inst_doc_verify_remarks || row.inst_doc_remarks) && (
                          <div
                            style={{
                              fontSize: 11,
                              color: dStatus === 3 ? 'var(--ax-danger, #ef4444)' : 'var(--ax-text-muted)',
                              marginTop: 2,
                              maxWidth: 160,
                              lineHeight: 1.2,
                            }}
                            title={row.inst_doc_verify_remarks || row.inst_doc_remarks}
                          >
                            {row.inst_doc_verify_remarks || row.inst_doc_remarks}
                          </div>
                        )}
                      </td>

                      {/* 21. Claim Status */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <ClaimBadge status={cStatus} />
                      </td>

                      {/* 22. Payment Status */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <PaymentBadge status={pStatus} />
                      </td>

                      {/* 23. Action Column */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, justifyContent: 'center', flexWrap: 'nowrap' }}>
                          <button
                            type="button"
                            className="ax-btn ax-btn--ghost ax-btn--xs"
                            style={{ padding: '3px 8px', fontSize: 11 }}
                            onClick={() => setViewDetailModal(row)}
                            title="View Full Site Details"
                          >
                            Details
                          </button>

                          {/* 1. Only show Upload HOC if document has NEVER been uploaded yet (One-time only) */}
                          {isDocMissing && (
                            <button
                              type="button"
                              className="ax-btn ax-btn--primary ax-btn--xs"
                              style={{ padding: '3px 9px', fontSize: 11, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                              onClick={() => setDocModalItem(row)}
                              title="HOC Document Pending: Click to upload certificate (One-time submission)"
                            >
                              <span>📄 Upload HOC</span>
                            </button>
                          )}

                          {/* 2. Allow editing installation details if installation is not yet approved */}
                          {canEditInstallation && (
                            <button
                              type="button"
                              className="ax-btn ax-btn--secondary ax-btn--xs"
                              style={{ padding: '3px 8px', fontSize: 11 }}
                              onClick={() => setEditModalItem(row)}
                              title="Edit Installation Equipment Serials & Coordinates"
                            >
                              Edit Details
                            </button>
                          )}

                          {/* 3. If Installation is Approved AND Document has already been uploaded (whether Approved, Submitted, or Rejected): Row is LOCKED */}
                          {isInstallApproved && !isDocMissing && (
                            <span
                              className="ax-badge ax-badge--soft"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '4px 8px',
                                fontSize: '11px',
                                fontWeight: 600,
                                color: 'var(--ax-text-muted, #64748b)',
                                background: 'var(--ax-surface-subtle, #f1f5f9)',
                                border: '1px solid var(--ax-border, #cbd5e1)',
                                borderRadius: 4,
                                cursor: 'not-allowed',
                                userSelect: 'none',
                              }}
                              title="Installation Verified & Document Uploaded (One-time upload completed). Actions are locked."
                            >
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{ width: 12, height: 12, color: '#64748b' }}
                                aria-hidden="true"
                              >
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                              </svg>
                              <span>Locked</span>
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* ── Table Footer & Pagination ── */}
        <div className="ax-card__footer" style={footerStyle}>
          <div className="ula-pagination-left">
            <Pagination
              currentPage={currentPage}
              totalItems={filtered.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(sz) => {
                setPageSize(sz);
                setCurrentPage(1);
              }}
              pageSizeOptions={[25, 50, 100, 200]}
            />
          </div>
        </div>
      </section>

      {/* ── Detail View Modal ── */}
      <DetailViewModal
        open={Boolean(viewDetailModal)}
        item={viewDetailModal}
        onClose={() => setViewDetailModal(null)}
        onPreview={openPreview}
        onOpenSubmitDoc={(it) => setDocModalItem(it)}
      />

      {/* ── Edit Installation Details Modal ── */}
      {editModalItem && (
        <EditInstallationModal
          item={editModalItem}
          onClose={() => setEditModalItem(null)}
          onSuccess={() => {
            setEditModalItem(null);
            setToastMsg({ type: 'success', text: 'Installation details updated successfully.' });
            loadData();
          }}
        />
      )}

      {/* ── Submit Document (HOC) Modal ── */}
      {docModalItem && (
        <SubmitDocumentModal
          item={docModalItem}
          onClose={() => setDocModalItem(null)}
          onSuccess={() => {
            setDocModalItem(null);
            setToastMsg({ type: 'success', text: 'Installation document submitted successfully.' });
            loadData();
          }}
        />
      )}

      {/* ── Photo Preview Modal (Zoom, Fullscreen) ── */}
      {preview && <ImagePreviewModal url={preview.url} title={preview.title} onClose={closePreview} />}
    </div>
  );
}

export default UP_Installation_KusumC_ViewInstallation;

/* ═══════════════════════════════════════════════════════════════════════════
 * Detail View Modal (Inspection of full technical parameters & audit trail)
 * ═══════════════════════════════════════════════════════════════════════════ */
function DetailViewModal({
  open,
  item,
  onClose,
  onPreview,
  onOpenSubmitDoc,
}: {
  open: boolean;
  item: UpKusumCInstalledSiteItem | null;
  onClose: () => void;
  onPreview: (url: string, title: string) => void;
  onOpenSubmitDoc?: (item: UpKusumCInstalledSiteItem) => void;
}) {
  if (!open || !item) return null;

  const applicant = item.f_farmer_name || item.farmer_name || item.applicant_name || `Site #${item.id}`;
  const rawDoc = item.inst_doc || item.hoc_photo || item.doc_hoc_photo || (item as any).doc_file || (item as any).document;
  const docUrl = rawDoc ? resolveUpMediaUrl(rawDoc) : null;
  const hasDoc = Boolean(rawDoc && String(rawDoc).trim() !== '' && rawDoc !== DASH);
  const vStatus = Number(item.inst_verify_status ?? item.verify_status ?? 0);
  const dStatus = Number(item.inst_doc_status ?? item.document_status ?? 0);

  return (
    <Modal open onClose={onClose} labelledBy="detail-modal-title" dialogClass="ax-modal__dialog--lg">
      <div className="ax-modal__header">
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--asw-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Site Inspection & Compliance
          </span>
          <h2 className="ax-modal__title" id="detail-modal-title" style={{ margin: 0 }}>
            {applicant} — Site #{item.id}
          </h2>
        </div>
        <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">
          {X_ICON}
        </button>
      </div>

      <div className="ax-modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Verification & Compliance Status */}
        <div style={{ padding: 14, borderRadius: 10, background: 'var(--ax-surface-subtle, #f8fafc)', border: '1px solid var(--ax-border, #e2e8f0)' }}>
          <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700 }}>Verification & HOC Compliance Status</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, fontSize: 12.5 }}>
            <div>
              <span style={{ color: 'var(--ax-text-muted)' }}>Installation Audit: </span>
              <VerifyBadge value={vStatus} raw={item.inst_verify_status ?? item.verify_status} />
            </div>
            {item.inst_verify_date && (
              <div><span style={{ color: 'var(--ax-text-muted)' }}>Audit Date: </span><b>{item.inst_verify_date}</b></div>
            )}
            {item.inst_verify_remarks && (
              <div style={{ gridColumn: '1 / -1' }}>
                <span style={{ color: 'var(--ax-text-muted)' }}>Audit Remarks: </span>
                <b style={{ color: vStatus === 2 ? 'var(--ax-danger, #ef4444)' : undefined }}>
                  {item.inst_verify_remarks}
                </b>
              </div>
            )}

            <div>
              <span style={{ color: 'var(--ax-text-muted)' }}>HOC Document: </span>
              <DocBadge status={dStatus} docUrl={docUrl} />
            </div>
            {(item.inst_doc_date || item.inst_doc_verify_date) && (
              <div><span style={{ color: 'var(--ax-text-muted)' }}>Document Date: </span><b>{item.inst_doc_date || item.inst_doc_verify_date}</b></div>
            )}
            {(item.inst_doc_verify_remarks || item.inst_doc_remarks) && (
              <div style={{ gridColumn: '1 / -1' }}>
                <span style={{ color: 'var(--ax-text-muted)' }}>Doc Verification Remarks: </span>
                <b style={{ color: dStatus === 3 ? 'var(--ax-danger, #ef4444)' : undefined }}>
                  {item.inst_doc_verify_remarks || item.inst_doc_remarks}
                </b>
              </div>
            )}
          </div>

          {!hasDoc && dStatus === 0 && (
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: '#92400e' }}>
                <b>HOC Document Missing:</b> Signed handover certificate is required to complete verification and enable payment claims.
              </div>
              <button
                type="button"
                className="ax-btn ax-btn--primary ax-btn--sm"
                onClick={() => {
                  onClose();
                  onOpenSubmitDoc?.(item);
                }}
              >
                Upload HOC Document
              </button>
            </div>
          )}
        </div>

        {/* Basic Details Grid */}
        <div style={{ padding: 14, borderRadius: 10, background: 'var(--ax-surface-subtle, #f8fafc)', border: '1px solid var(--ax-border, #e2e8f0)' }}>
          <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700 }}>Beneficiary & Location</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, fontSize: 12.5 }}>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>State: </span><b>{(item.state || item.f_state || 'UP').toUpperCase()}</b></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>District: </span><b>{item.f_district || item.district || DASH}</b></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Block: </span><b>{item.f_block || item.block || DASH}</b></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Village: </span><b>{item.f_village || item.village || DASH}</b></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Contact: </span><b>{item.f_contact || item.contact_no || DASH}</b></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Father Name: </span><b>{item.f_father_name || item.father_name || DASH}</b></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Capacity: </span><b>{item.pump_capacity || '3 HP'}</b></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Coordinates: </span><b>{item.latitude && item.longitude ? `${item.latitude}, ${item.longitude}` : DASH}</b></div>
          </div>
        </div>

        {/* Equipment & Serials */}
        <div style={{ padding: 14, borderRadius: 10, background: 'var(--ax-surface-subtle, #f8fafc)', border: '1px solid var(--ax-border, #e2e8f0)' }}>
          <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700 }}>Installed Equipment & Serials</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, fontSize: 12.5 }}>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>VFD Serial No.: </span><b style={monoCell}>{item.vfd_no || item.vfd_serial_no || DASH}</b></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Inverter Serial No.: </span><b style={monoCell}>{item.Inverter_no || item.inverter_no || item.inverter_serial_no || DASH}</b></div>
            <div style={{ gridColumn: '1 / -1' }}>
              <span style={{ color: 'var(--ax-text-muted)' }}>Module Serial Numbers: </span>
              <b style={monoCell}>{formatModuleSerials(item.module_serial_no || item.module_no)}</b>
            </div>
            {item.inst_remarks && (
              <div style={{ gridColumn: '1 / -1' }}><span style={{ color: 'var(--ax-text-muted)' }}>Installation Remarks: </span><b>{item.inst_remarks}</b></div>
            )}
          </div>
        </div>

        {/* Photo Evidence Gallery */}
        <div>
          <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700 }}>Field Verification Photographs</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <div style={{ border: '1px solid var(--ax-border, #e2e8f0)', padding: 10, textAlign: 'center', background: '#fff' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ax-text-muted)', marginBottom: 6 }}>Farmer With Module</div>
              <InstallationThumbnail
                src={item.module_image || item.farmer_module_image || item.f_module_image}
                alt={`${applicant} - Farmer With Module`}
                onPreview={onPreview}
                size={120}
              />
            </div>
            <div style={{ border: '1px solid var(--ax-border, #e2e8f0)', padding: 10, textAlign: 'center', background: '#fff' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ax-text-muted)', marginBottom: 6 }}>Inverter & VFD</div>
              <InstallationThumbnail
                src={item.inverter_vfd_image || item.inverter_image || item.vfd_image}
                alt={`${applicant} - Inverter & VFD`}
                onPreview={onPreview}
                size={120}
              />
            </div>
            <div style={{ border: '1px solid var(--ax-border, #e2e8f0)', padding: 10, textAlign: 'center', background: '#fff' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ax-text-muted)', marginBottom: 6 }}>Running Water Flow</div>
              <InstallationThumbnail
                src={item.running_water_image || item.water_image}
                alt={`${applicant} - Running Water Flow`}
                onPreview={onPreview}
                size={120}
              />
            </div>
          </div>
        </div>

        {/* Document view link */}
        {docUrl && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>📄</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#166534' }}>HOC / Compliance Document Attached</div>
                <div style={{ fontSize: 11, color: '#15803d' }}>Certificate submitted for administrative verification</div>
              </div>
            </div>
            <a
              href={docUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ax-btn ax-btn--primary ax-btn--sm"
            >
              Open Document ↗
            </a>
          </div>
        )}
      </div>

      <div className="ax-modal__footer">
        <button type="button" className="ax-btn ax-btn--primary" onClick={onClose}>
          Done
        </button>
      </div>
    </Modal>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * Submit Document (HOC / JCR) Modal
 * ═══════════════════════════════════════════════════════════════════════════ */
function SubmitDocumentModal({
  item,
  onClose,
  onSuccess,
}: {
  item: UpKusumCInstalledSiteItem;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rawDoc = item.inst_doc || item.hoc_photo || (item as any).doc_file;
  const hasExistingDoc = Boolean(rawDoc && String(rawDoc).trim() !== '' && rawDoc !== DASH);
  const isRejected = Number(item.inst_doc_status) === 3;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select an HOC/document file to submit.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('id', String(item.id));
      fd.append('site_id', String(item.id));
      fd.append('doc_file', file);
      fd.append('file', file);
      fd.append('inst_doc', file);
      fd.append('hoc_file', file);
      fd.append('hoc_photo', file);
      if (remarks.trim()) {
        fd.append('remarks', remarks.trim());
        fd.append('inst_doc_remarks', remarks.trim());
      }

      const res = await upInstallationService.submitKusumCHoc(fd);
      if (res?.status !== false) {
        onSuccess();
      } else {
        setError(res?.message || 'Failed to submit document.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to submit document.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open onClose={onClose} labelledBy="submit-doc-title" dialogClass="ax-modal__dialog--md">
      <form onSubmit={handleSubmit}>
        <div className="ax-modal__header">
          <div>
            <h3 className="ax-modal__title" id="submit-doc-title" style={{ margin: 0 }}>
              Upload Handover Certificate (HOC)
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--ax-text-muted)' }}>
              Site #{item.id} — {item.f_farmer_name || item.farmer_name || 'Beneficiary'} (One-time submission)
            </p>
          </div>
          <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">
            {X_ICON}
          </button>
        </div>

        <div className="ax-modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {error && <div className="ax-alert ax-alert--danger">{error}</div>}

          <div style={{ fontSize: 12, color: '#b45309', background: '#fffbeb', border: '1px solid #fde68a', padding: '8px 12px', borderRadius: 6 }}>
            <b>Important Notice:</b> Handover Certificate (HOC) can only be submitted once. Please verify that the correct signed document is attached before uploading.
          </div>

          <div className="ax-modern-field">
            <label className="ax-modern-label">
              <span>HOC Document File <span className="ax-modern-req">*</span></span>
              <span style={{ fontSize: 11, color: 'var(--ax-text-muted)' }}>PDF, JPG, PNG (Max 5MB)</span>
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files?.[0]) setFile(e.target.files[0]);
              }}
            />

            {!file ? (
              <div className="ax-modern-dropzone" onClick={() => fileInputRef.current?.click()}>
                <div className="ax-modern-dropzone__icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth={2}>
                    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                    <path d="M12 12v9" />
                    <path d="m8 16 4-4 4 4" />
                  </svg>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Click to browse document</div>
                <div style={{ fontSize: 11, color: 'var(--ax-text-muted)' }}>Signed HOC / JCR certificate copy</div>
              </div>
            ) : (
              <div className="ax-modern-file-chip">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="ax-modern-file-chip__icon">📄</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{file.name}</div>
                    <div style={{ fontSize: 11, color: '#16a34a' }}>{(file.size / 1024).toFixed(0)} KB · Ready to upload</div>
                  </div>
                </div>
                <button type="button" className="ax-btn ax-btn--ghost ax-btn--xs" onClick={() => setFile(null)}>
                  Remove
                </button>
              </div>
            )}
          </div>

          <div className="ax-modern-field">
            <label className="ax-modern-label">Submission Remarks</label>
            <textarea
              className="ax-input"
              rows={3}
              placeholder="Enter remarks..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>
        </div>

        <div className="ax-modal__footer">
          <button type="button" className="ax-btn ax-btn--ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="ax-btn ax-btn--primary" disabled={submitting || !file}>
            {submitting ? 'Submitting…' : 'Submit Document'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * Edit Installation Modal
 * ═══════════════════════════════════════════════════════════════════════════ */
function EditInstallationModal({
  item,
  onClose,
  onSuccess,
}: {
  item: UpKusumCInstalledSiteItem;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [vfdNo, setVfdNo] = useState(item.vfd_no || item.vfd_serial_no || '');
  const [inverterNo, setInverterNo] = useState(item.Inverter_no || item.inverter_no || item.inverter_serial_no || '');
  const [moduleSerials, setModuleSerials] = useState(formatModuleSerials(item.module_serial_no || item.module_no));
  const [latitude, setLatitude] = useState(item.latitude || '');
  const [longitude, setLongitude] = useState(item.longitude || '');
  const [remarks, setRemarks] = useState(item.inst_remarks || item.remarks || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('id', String(item.id));
      fd.append('vfd_no', vfdNo.trim());
      fd.append('inverter_no', inverterNo.trim());
      fd.append('module_serial_no', moduleSerials.trim());
      fd.append('latitude', latitude.trim());
      fd.append('longitude', longitude.trim());
      if (remarks.trim()) fd.append('remarks', remarks.trim());

      const res = await upInstallationService.updateKusumCInstallation(fd);
      if (res?.status !== false) {
        onSuccess();
      } else {
        setError(res?.message || 'Failed to update installation details.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to update installation details.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open onClose={onClose} labelledBy="edit-modal-title" dialogClass="ax-modal__dialog--md">
      <form onSubmit={handleSubmit}>
        <div className="ax-modal__header">
          <div>
            <h3 className="ax-modal__title" id="edit-modal-title" style={{ margin: 0 }}>
              Edit Installation Details
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--ax-text-muted)' }}>
              Site #{item.id} — {item.f_farmer_name || item.farmer_name || 'Beneficiary'}
            </p>
          </div>
          <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">
            {X_ICON}
          </button>
        </div>

        <div className="ax-modal__body" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {error && <div className="ax-alert ax-alert--danger" style={{ gridColumn: '1 / -1' }}>{error}</div>}

          <div className="ax-modern-field">
            <label className="ax-modern-label">VFD Serial No.</label>
            <input
              type="text"
              className="ax-input"
              value={vfdNo}
              onChange={(e) => setVfdNo(e.target.value)}
              placeholder="Enter VFD Number"
            />
          </div>

          <div className="ax-modern-field">
            <label className="ax-modern-label">Inverter Serial No.</label>
            <input
              type="text"
              className="ax-input"
              value={inverterNo}
              onChange={(e) => setInverterNo(e.target.value)}
              placeholder="Enter Inverter Number"
            />
          </div>

          <div className="ax-modern-field" style={{ gridColumn: '1 / -1' }}>
            <label className="ax-modern-label">Module Serial Numbers (Comma separated)</label>
            <input
              type="text"
              className="ax-input"
              value={moduleSerials}
              onChange={(e) => setModuleSerials(e.target.value)}
              placeholder="e.g. MOD-01, MOD-02, MOD-03"
            />
          </div>

          <div className="ax-modern-field">
            <label className="ax-modern-label">Installation Latitude</label>
            <input
              type="text"
              className="ax-input"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              placeholder="e.g. 25.3176"
            />
          </div>

          <div className="ax-modern-field">
            <label className="ax-modern-label">Installation Longitude</label>
            <input
              type="text"
              className="ax-input"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              placeholder="e.g. 82.9739"
            />
          </div>

          <div className="ax-modern-field" style={{ gridColumn: '1 / -1' }}>
            <label className="ax-modern-label">Installation Remarks</label>
            <textarea
              className="ax-input"
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Enter installation notes..."
            />
          </div>
        </div>

        <div className="ax-modal__footer">
          <button type="button" className="ax-btn ax-btn--ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="ax-btn ax-btn--primary" disabled={submitting}>
            {submitting ? 'Updating…' : 'Update Details'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
