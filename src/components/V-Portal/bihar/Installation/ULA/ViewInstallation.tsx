import { useState, useMemo, useEffect, useCallback, useRef, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  biharUlaInstallationService,
  type StructureSiteItem,
} from '../../bihar-services';
import {
  Pagination,
  usePagination,
  SearchInput,
  TableExportToolbar,
  TableEmptyState,
  type ExportColumn,
} from '../../../../../common';

/* ── Base URLs for media assets ── */
const BACKEND_BASE = (import.meta.env.VITE_API_BASE_URL || 'https://klkerp.com/api')
  .replace(/\/api\/?$/, '')
  .replace(/\/+$/, '');

const R2_BASE = ((import.meta.env.VITE_R2_PUBLIC_URL as string | undefined) ?? '').replace(/\/+$/, '');

function getInstallationImageCandidates(path?: string | null): string[] {
  if (!path || typeof path !== 'string') return [];
  const clean = path.trim();
  if (!clean) return [];

  if (/^(https?:)?\/\//i.test(clean) || clean.startsWith('data:') || clean.startsWith('blob:')) {
    return [clean];
  }

  if (clean.startsWith('r2:')) {
    const key = clean.slice(3).replace(/^\/+/, '');
    const urls: string[] = [];
    if (R2_BASE) urls.push(`${R2_BASE}/${key}`);
    urls.push(`${BACKEND_BASE}/uploads/${key}`);
    return urls;
  }

  const normalized = clean.replace(/^\/+/, '');
  const filename = normalized.split('/').pop() || normalized;
  const candidates: string[] = [];

  if (normalized.startsWith('uploads/')) {
    candidates.push(`${BACKEND_BASE}/${normalized}`);
  } else if (normalized.startsWith('storage/')) {
    candidates.push(`${BACKEND_BASE}/${normalized}`);
  }

  candidates.push(`${BACKEND_BASE}/uploads/bihar/installation/ula/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/bihar/installation/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/bihar/survey/ula/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/bihar/survey/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/${filename}`);
  candidates.push(`${BACKEND_BASE}/${normalized}`);
  if (R2_BASE) {
    candidates.push(`${R2_BASE}/uploads/bihar/installation/ula/${filename}`);
    candidates.push(`${R2_BASE}/${filename}`);
  }
  candidates.push(`https://pub-21d2019fecbe4a96a88c93b2f091317a.r2.dev/${filename}`);

  return Array.from(new Set(candidates));
}

const mediaUrl = (path?: string | null): string => {
  if (!path) return '';
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  const candidates = getInstallationImageCandidates(path);
  return candidates[0] || `${BACKEND_BASE}/${path.replace(/^\/+/, '')}`;
};

const ICON_REFRESH = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
    <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
  </svg>
);

const DASH = '—';

/* ── Field helpers ── */
const field = (s: StructureSiteItem, key: string): unknown =>
  (s as unknown as Record<string, unknown>)[key];

const text = (s: StructureSiteItem, key: string): string => {
  const v = field(s, key);
  if (v === null || v === undefined || v === '') return '';
  return String(v);
};

const parseList = (val?: unknown): string[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(String).filter(Boolean);
  if (typeof val !== 'string') return [];
  try {
    const parsed = JSON.parse(val);
    if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
  } catch {
    // not JSON
  }
  return [val].filter(Boolean);
};

type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

const Badge = ({ tone, children }: { tone: Tone; children: ReactNode }) => (
  <span className={`ax-badge ax-badge--soft ax-badge--${tone}`}>{children}</span>
);

const VerifyBadge = ({ value }: { value: number }) =>
  value === 1 ? <Badge tone="success">Approved</Badge>
  : value === 2 ? <Badge tone="danger">Rejected</Badge>
  : <Badge tone="warning">Pending</Badge>;

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const DOC_MAX_BYTES = 5 * 1024 * 1024;
const DOC_ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

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
    <Modal open onClose={onClose} labelledBy="ula-preview-title" dialogClass="ax-modal__dialog--lg">
      <div className="ax-modal__header">
        <h2 className="ax-modal__title" id="ula-preview-title">{title || 'Media Preview'}</h2>
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

/* ── Interactive Image Thumbnail (NO BORDER RADIUS) ── */
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
  const candidates = useMemo(() => getInstallationImageCandidates(src), [src]);
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

function ThumbnailGroup({
  images,
  altPrefix,
  onPreview,
}: {
  images?: unknown;
  altPrefix: string;
  onPreview: (url: string, title: string) => void;
}) {
  const list = parseList(images);
  if (!list.length) return <span style={{ color: 'var(--ax-text-subtle)' }}>{DASH}</span>;
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap', maxWidth: 160 }}>
      {list.map((img, i) => (
        <InstallationThumbnail
          key={i}
          src={img}
          alt={`${altPrefix} ${i + 1}`}
          onPreview={onPreview}
        />
      ))}
    </div>
  );
}

/* ── Action Dropdown (menu is rendered in <body> so the table never clips it) ── */
const MENU_W = 180;
const MENU_H = 118;

function RowActionDropdown({
  site,
  onOpenDoc,
}: {
  site: StructureSiteItem;
  onOpenDoc: () => void;
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
          style={{
            width: 12,
            height: 12,
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.15s ease',
          }}
          aria-hidden="true"
        >
          <path d="M6 9l6 6l6 -6" />
        </svg>
      </button>

      {open && pos &&
        createPortal(
          <div
            ref={menuRef}
            className="ula-menu"
            role="menu"
            style={{ top: pos.top, left: pos.left, width: MENU_W }}
          >
            <Link
              to={`/v/bihar/ula-installation-structure-edit-site/${site.id}`}
              className="ula-menu__item"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              Edit Structure
            </Link>
            <Link
              to={`/v/bihar/ula-installation-pending-site/${site.id}`}
              className="ula-menu__item"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              Pending Installation
            </Link>
            <button
              type="button"
              className="ula-menu__item"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onOpenDoc();
              }}
            >
              Document
            </button>
          </div>,
          document.body
        )}
    </>
  );
}

/* ───────── Overlay CSS (modals + dropdown; global because they render in <body>) ───────── */
const OVERLAY_CSS = `
  .ax-modal img { border-radius: 0 !important; }

  /* Image preview stage */
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

  /* Form bits inside modals */
  .ula-m-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--ax-space-4, 16px); }
  .ula-m-full { grid-column: 1 / -1; }
  .ula-m-note { margin: 0; font-size: var(--ax-text-sm, 13px); color: var(--ax-text-muted, #64748b); }
  .ula-m-hint { margin: 0; font-size: 12px; color: var(--ax-text-muted, #64748b); word-break: break-all; }
  .ula-m-info {
    display: flex; flex-wrap: wrap; gap: 4px 16px; padding: 8px 12px; font-size: 12px;
    background: var(--ax-surface-subtle, #f8fafc); border: 1px solid var(--ax-border, #e2e8f0);
  }
  .ula-m-info span { color: var(--ax-text-muted, #64748b); }
  .ula-m-info b { color: var(--ax-text-strong, #0f172a); font-weight: 600; }
  .ula-m-current {
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    padding-top: var(--ax-space-4, 16px); border-top: 1px solid var(--ax-border, #e2e8f0);
    font-size: 12px; color: var(--ax-text-muted, #64748b);
  }
  .ax-modal textarea.ax-input { resize: vertical; min-height: 84px; line-height: 1.45; }

  /* Row action button + menu */
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

/* ───────── Responsive page CSS ───────── */
const PAGE_CSS = `
  .solar-erp-page .ax-card { min-width: 0; }
  .solar-erp-page .ax-card__footer { width: 100%; box-sizing: border-box; }
  .solar-erp-page .ula-pagination-left {
    width: 100%; display: flex; justify-content: flex-start; align-items: center; margin: 0; overflow-x: auto;
  }
  .solar-erp-page .ula-pagination-left > * { margin-left: 0 !important; margin-right: 0 !important; }

  /* Images: NO BORDER RADIUS */
  .solar-erp-page img,
  .solar-erp-page .ula-table--wide img,
  .solar-erp-page .ax-card img {
    border-radius: 0 !important;
  }

  /* Card header: title and actions */
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

  /* Table: sideways scroll with sticky first column (no extra min-height / bottom padding) */
  .solar-erp-page .ax-table-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  .solar-erp-page .ula-table--wide { min-width: 2800px; }
  .solar-erp-page .ula-sticky-first th:first-child,
  .solar-erp-page .ula-sticky-first td:first-child {
    position: sticky;
    left: 0;
    z-index: 2;
    background: var(--ax-bg-surface, #ffffff);
    box-shadow: 1px 0 0 var(--ax-border-subtle, #e2e8f0);
  }

  /* Tablet */
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

  /* Mobile: header stack */
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

  /* Small phones */
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

/* Small form helpers used by the electrical modal */
const Req = () => <span style={{ color: 'var(--ax-danger-500)' }} aria-hidden="true">*</span>;

function TextField({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required,
  full,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  full?: boolean;
}) {
  return (
    <div className={`ax-field${full ? ' ula-m-full' : ''}`}>
      <label className="ax-label" htmlFor={id}>{label} {required && <Req />}</label>
      <input
        id={id}
        type={type}
        className="ax-input"
        placeholder={placeholder}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function FileField({ id, label, onChange }: { id: string; label: string; onChange: (f: File | null) => void }) {
  return (
    <div className="ax-field">
      <label className="ax-label" htmlFor={id}>{label}</label>
      <input
        id={id}
        type="file"
        accept="image/*"
        className="ax-input"
        onChange={(e) => onChange(e.target.files?.[0] || null)}
      />
    </div>
  );
}

export function Bihar_Installation_ULA_ViewInstallation() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [sites, setSites] = useState<StructureSiteItem[]>([]);
  const [search, setSearch] = useState(() => searchParams.get('search') || '');
  const [selectedDistrict, setSelectedDistrict] = useState(() => searchParams.get('district') || 'All');
  const [selectedStatus, setSelectedStatus] = useState(() => searchParams.get('status') || 'All');
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);

  // Photo preview modal
  const [preview, setPreview] = useState<{ url: string; title: string } | null>(null);
  const openPreview = useCallback((url: string, title: string) => setPreview({ url, title }), []);
  const closePreview = useCallback(() => setPreview(null), []);

  // Electrical Modal State
  const [electricModalSite, setElectricModalSite] = useState<StructureSiteItem | null>(null);
  const [instDate, setInstDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [solarMeterNo, setSolarMeterNo] = useState('');
  const [inverterNo, setInverterNo] = useState('');
  const [nmSmNo, setNmSmNo] = useState('');
  const [logerNo, setLogerNo] = useState('');
  const [instRemarks, setInstRemarks] = useState('');

  // Electrical Upload Files
  const [completePhoto, setCompletePhoto] = useState<File | null>(null);
  const [inverterImage, setInverterImage] = useState<File | null>(null);
  const [earthingImage, setEarthingImage] = useState<File | null>(null);
  const [acdbImage, setAcdbImage] = useState<File | null>(null);
  const [solarMeterImage, setSolarMeterImage] = useState<File | null>(null);
  const [laImage, setLaImage] = useState<File | null>(null);

  const [electricSubmitting, setElectricSubmitting] = useState(false);
  const [electricError, setElectricError] = useState<string | null>(null);
  const closeElectric = useCallback(() => setElectricModalSite(null), []);

  // Document Modal State
  const [docModalSite, setDocModalSite] = useState<StructureSiteItem | null>(null);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docDate, setDocDate] = useState('');
  const [docRemarks, setDocRemarks] = useState('');
  const [docSubmitting, setDocSubmitting] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const closeDoc = useCallback(() => setDocModalSite(null), []);

  // Toast / feedback message
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  useEffect(() => {
    if (!toastMsg) return;
    const t = window.setTimeout(() => setToastMsg(null), 4000);
    return () => window.clearTimeout(t);
  }, [toastMsg]);

  // Fetch installed sites
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await biharUlaInstallationService.getViewInstalledSites();
      setSites(data || []);
    } catch (err: any) {
      console.error('[ULA Installation] Error loading installed sites:', err);
      setSites([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // District options
  const districtList = useMemo(() => {
    const set = new Set<string>();
    sites.forEach((s) => {
      if (s.district) set.add(s.district);
    });
    return Array.from(set).sort();
  }, [sites]);

  // Filtered sites
  const filteredSites = useMemo(() => {
    return sites.filter((s) => {
      if (selectedDistrict !== 'All' && s.district !== selectedDistrict) return false;
      if (selectedStatus === 'Installed' && Number(s.inst_status) !== 1) return false;
      if (selectedStatus === 'Pending' && Number(s.inst_status) === 1) return false;

      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const modSerials = parseList(field(s, 'module_serial_no')).join(' ').toLowerCase();

      return (
        (s.beneficiary_name || '').toLowerCase().includes(q) ||
        (s.contact_no || '').toLowerCase().includes(q) ||
        (s.ca_no || '').toLowerCase().includes(q) ||
        (s.district || '').toLowerCase().includes(q) ||
        (s.block || '').toLowerCase().includes(q) ||
        (s.village || '').toLowerCase().includes(q) ||
        (s.solarmeter_no || '').toLowerCase().includes(q) ||
        (s.inverter_no || '').toLowerCase().includes(q) ||
        (s.nm_sm_no || '').toLowerCase().includes(q) ||
        (s.loger_no || '').toLowerCase().includes(q) ||
        modSerials.includes(q) ||
        String(s.id).includes(q) ||
        text(s, 'unique_id').toLowerCase().includes(q) ||
        text(s, 'wo_no').toLowerCase().includes(q)
      );
    });
  }, [sites, search, selectedDistrict, selectedStatus]);

  // Pagination hook from common
  const { paginatedData, currentPage, pageSize, totalItems, setPage, setPageSize } =
    usePagination({ data: filteredSites, initialPageSize: 10 });

  // Reset page on search or filter change
  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, selectedDistrict, selectedStatus]);

  const hasFilters = search.trim() !== '' || selectedDistrict !== 'All' || selectedStatus !== 'All';
  const resetFilters = () => {
    setSearch('');
    setSelectedDistrict('All');
    setSelectedStatus('All');
    setPage(1);
  };

  // Open Electrical Modal
  const handleOpenElectricModal = (site: StructureSiteItem) => {
    setElectricModalSite(site);
    setInstDate(text(site, 'inst_date') || new Date().toISOString().split('T')[0]);
    setSolarMeterNo(site.solarmeter_no || text(site, 'solar_meter_no') || '');
    setInverterNo(site.inverter_no || '');
    setNmSmNo(site.nm_sm_no || text(site, 'smart_meter_no') || '');
    setLogerNo(site.loger_no || '');
    setInstRemarks(site.inst_remarks || text(site, 'remarks') || '');
    setCompletePhoto(null);
    setInverterImage(null);
    setEarthingImage(null);
    setAcdbImage(null);
    setSolarMeterImage(null);
    setLaImage(null);
    setElectricError(null);
  };

  // Open Document Modal
  const handleOpenDocModal = (site: StructureSiteItem) => {
    setDocModalSite(site);
    setDocFile(null);
    setDocDate('');
    setDocRemarks('');
    setDocError(null);
  };

  const handlePickDoc = (file: File | null) => {
    setDocError(null);
    if (!file) {
      setDocFile(null);
      return;
    }
    if (!DOC_ALLOWED_TYPES.includes(file.type)) {
      setDocFile(null);
      if (docInputRef.current) docInputRef.current.value = '';
      setDocError('Only PDF, JPG or PNG files are allowed.');
      return;
    }
    if (file.size > DOC_MAX_BYTES) {
      setDocFile(null);
      if (docInputRef.current) docInputRef.current.value = '';
      setDocError(`File is ${formatSize(file.size)}. Maximum allowed size is 5 MB.`);
      return;
    }
    setDocFile(file);
  };

  // Submit Electrical Installation
  const handleSubmitElectric = async (e: FormEvent) => {
    e.preventDefault();
    if (!electricModalSite) return;
    setElectricError(null);
    setElectricSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('site_id', String(electricModalSite.id));
      fd.append('inst_date', instDate);
      if (solarMeterNo) fd.append('solarmeter_no', solarMeterNo);
      if (inverterNo) fd.append('inverter_no', inverterNo);
      if (nmSmNo) fd.append('nm_sm_no', nmSmNo);
      if (logerNo) fd.append('loger_no', logerNo);
      if (instRemarks) fd.append('inst_remarks', instRemarks);

      if (completePhoto) fd.append('complete_photo', completePhoto);
      if (inverterImage) fd.append('inverter_image', inverterImage);
      if (earthingImage) fd.append('earthing_image', earthingImage);
      if (acdbImage) fd.append('acdb_image', acdbImage);
      if (solarMeterImage) fd.append('solarmeter_image', solarMeterImage);
      if (laImage) fd.append('la_image', laImage);

      await biharUlaInstallationService.storeInstallation(fd);
      setToastMsg({ type: 'success', text: 'Electrical installation saved successfully!' });
      setElectricModalSite(null);
      await loadData();
    } catch (err: any) {
      setElectricError(err?.message || 'Failed to save electrical installation.');
    } finally {
      setElectricSubmitting(false);
    }
  };

  // Submit Commissioning Doc
  const handleSubmitDoc = async (e: FormEvent) => {
    e.preventDefault();
    if (!docModalSite) return;
    if (!docFile || !docDate || !docRemarks.trim()) {
      setDocError('Document, Date and Remarks are required.');
      return;
    }
    setDocError(null);
    setDocSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('site_id', String(docModalSite.id));
      fd.append('file', docFile);
      fd.append('doc_date', docDate);
      fd.append('doc_remarks', docRemarks.trim());

      await biharUlaInstallationService.uploadInstallationDoc(fd);
      setToastMsg({ type: 'success', text: 'Installation document uploaded successfully!' });
      setDocModalSite(null);
      setDocFile(null);
      setDocDate('');
      setDocRemarks('');
      await loadData();
    } catch (err: any) {
      setDocError(err?.message || 'Failed to upload document.');
    } finally {
      setDocSubmitting(false);
    }
  };

  // Export Columns definition (Exact 30 requested fields)
  const exportCols: ExportColumn<StructureSiteItem>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r, idx) => (idx !== undefined ? idx + 1 : '') },
      { header: 'State', accessor: (r) => text(r, 'state') || 'Bihar' },
      { header: 'District', accessor: (r) => r.district || '' },
      { header: 'Block', accessor: (r) => r.block || '' },
      { header: 'Village', accessor: (r) => r.village || '' },
      { header: 'Beneficiary Name', accessor: (r) => r.beneficiary_name || '' },
      { header: 'Contact Number', accessor: (r) => r.contact_no || '' },
      { header: 'CA No.', accessor: (r) => r.ca_no || '' },
      { header: 'Module Serial No.', accessor: (r) => parseList(field(r, 'module_serial_no')).join(', ') },
      { header: 'Module Serial Image', accessor: (r) => parseList(field(r, 'module_serial_image')).join(', ') },
      { header: 'Foundation & Fastener', accessor: (r) => parseList(field(r, 'foundation_fastener_images')).join(', ') },
      { header: 'Structure Image', accessor: (r) => r.structure_image || '' },
      { header: 'Latitude', accessor: (r) => text(r, 'inst_latitude') || text(r, 'latitude') },
      { header: 'Longitude', accessor: (r) => text(r, 'inst_longitude') || text(r, 'longitude') },
      { header: 'Structure Status', accessor: (r) => (Number(r.structure_status) === 1 ? 'Installed' : 'Pending') },
      {
        header: 'Structure Verify Status',
        accessor: (r) =>
          Number(r.structure_verify_status) === 1
            ? 'Approved'
            : Number(r.structure_verify_status) === 2
            ? 'Rejected'
            : 'Pending',
      },
      { header: 'Verify Remarks', accessor: (r) => text(r, 'structure_verify_remarks') || text(r, 'verify_remarks') },
      { header: 'Solar Meter No.', accessor: (r) => r.solarmeter_no || text(r, 'solar_meter_no') },
      { header: 'Inverter No.', accessor: (r) => r.inverter_no || '' },
      { header: 'Net/Smart Meter No.', accessor: (r) => r.nm_sm_no || text(r, 'smart_meter_no') },
      { header: 'Loger No.', accessor: (r) => r.loger_no || '' },
      { header: 'Complete Photo', accessor: (r) => text(r, 'complete_photo') },
      { header: 'Inverter Image', accessor: (r) => text(r, 'inverter_image') },
      { header: 'Earthing Image', accessor: (r) => text(r, 'earthing_image') },
      { header: 'ACDB Image', accessor: (r) => text(r, 'acdb_image') },
      { header: 'Solar Meter Image', accessor: (r) => text(r, 'solar_meter_image') || text(r, 'solarmeter_image') },
      { header: 'LA Image', accessor: (r) => text(r, 'la_image') },
      { header: 'Remark', accessor: (r) => text(r, 'inst_remarks') || text(r, 'remarks') },
      { header: 'Installation Status', accessor: (r) => (Number(r.inst_status) === 1 ? 'Installed' : 'Pending') },
      {
        header: 'Verify Status',
        accessor: (r) =>
          Number(r.inst_verify_status ?? r.verify_status) === 1
            ? 'Approved'
            : Number(r.inst_verify_status ?? r.verify_status) === 2
            ? 'Rejected'
            : 'Pending',
      },
    ],
    []
  );

  const stamp = new Date().toISOString().slice(0, 10);

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
    } catch {
      const ta = document.createElement('textarea');
      ta.value = t;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
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

  const toolbarColumns = exportCols.map((c, i) => ({
    key: `${c.header}-${i}`,
    label: c.header,
    visible: !hiddenColumns.includes(`${c.header}-${i}`),
  }));
  const activeCols = exportCols.filter((c, i) => !hiddenColumns.includes(`${c.header}-${i}`));
  const toggleColumn = (key: string) =>
    setHiddenColumns((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const TOTAL_COLUMNS = 31;

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="View Bihar ULA Installation"
        subtitle="Master register of structure erection, electrical commissioning, and physical verification media"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Bihar' },
          { label: 'Installation' },
          { label: 'ULA' },
          { label: 'View Installation' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)' }}>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={loadData} disabled={loading}>
              {ICON_REFRESH}
              <span className="ax-btn__label">Refresh</span>
            </button>
          </div>
        }
      />

      {toastMsg && (
        <div className={`ax-alert ax-alert--${toastMsg.type}`} style={{ marginBottom: 'var(--ax-space-4)' }} role="status">
          <div className="ax-alert__title">{toastMsg.type === 'success' ? 'Success' : 'Error'}</div>
          <div className="ax-alert__text">{toastMsg.text}</div>
        </div>
      )}

      <div className="ax-dash-grid">
        {/* ── Main Table Card ── */}
        <section className="ax-card ax-col--12" role="region" aria-label="ULA Installation Records">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">View Installation Records</h2>
              <p className="ax-card__subtitle">
                <span className="ax-num">{filteredSites.length}</span> installations found.
              </p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                {/* District Filter Dropdown */}
                <select
                  id="dist_filter"
                  className="ax-input ax-input--sm"
                  style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                  value={selectedDistrict}
                  onChange={(e) => {
                    setSelectedDistrict(e.target.value);
                    setPage(1);
                  }}
                  aria-label="Filter by district"
                >
                  <option value="All">All Districts</option>
                  {districtList.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>

                {/* Electric Status Filter Dropdown */}
                <select
                  id="status_filter"
                  className="ax-input ax-input--sm"
                  style={{ width: 130, height: 32, fontSize: 'var(--ax-text-xs)' }}
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    setPage(1);
                  }}
                  aria-label="Filter by electric status"
                >
                  <option value="All">All Status</option>
                  <option value="Installed">Installed (1)</option>
                  <option value="Pending">Pending (0)</option>
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
                  placeholder="Search name, CA, contact, meter…"
                  size="sm"
                  ariaLabel="Search installation records"
                />

                <TableExportToolbar
                  onCopy={() => copyToClipboard(filteredSites, activeCols)}
                  onExportCSV={() => exportToCSV(filteredSites, activeCols, `Bihar_ULA_Installation_${stamp}`)}
                  onExportExcel={() => exportToExcel(filteredSites, activeCols, `Bihar_ULA_Installation_${stamp}`)}
                  onExportPDF={() => exportToPDF(filteredSites, activeCols, 'Bihar ULA Installation')}
                  columns={toolbarColumns}
                  onToggleColumn={toggleColumn}
                />
              </div>
            </div>
          </div>

          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover ula-table--wide ula-sticky-first" style={{ whiteSpace: 'nowrap' }}>
              <caption className="ax-visually-hidden">ULA Installation Records</caption>
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">Sr. No.</th>
                  <th className="ax-table__th" scope="col">State</th>
                  <th className="ax-table__th" scope="col">District</th>
                  <th className="ax-table__th" scope="col">Block</th>
                  <th className="ax-table__th" scope="col">Village</th>
                  <th className="ax-table__th" scope="col">Beneficiary Name</th>
                  <th className="ax-table__th" scope="col">Contact Number</th>
                  <th className="ax-table__th" scope="col">CA No.</th>
                  <th className="ax-table__th" scope="col">Module Serial No.</th>
                  <th className="ax-table__th" scope="col">Module Serial Image</th>
                  <th className="ax-table__th" scope="col">Foundation & Fastener</th>
                  <th className="ax-table__th" scope="col">Structure Image</th>
                  <th className="ax-table__th" scope="col">Latitude</th>
                  <th className="ax-table__th" scope="col">Longitude</th>
                  <th className="ax-table__th" scope="col">Structure Status</th>
                  <th className="ax-table__th" scope="col">Structure Verify Status</th>
                  <th className="ax-table__th" scope="col">Verify Remarks</th>
                  <th className="ax-table__th" scope="col">Solar Meter No.</th>
                  <th className="ax-table__th" scope="col">Inverter No.</th>
                  <th className="ax-table__th" scope="col">Net/Smart Meter No.</th>
                  <th className="ax-table__th" scope="col">Loger No.</th>
                  <th className="ax-table__th" scope="col">Complete Photo</th>
                  <th className="ax-table__th" scope="col">Inverter Image</th>
                  <th className="ax-table__th" scope="col">Earthing Image</th>
                  <th className="ax-table__th" scope="col">ACDB Image</th>
                  <th className="ax-table__th" scope="col">Solar Meter Image</th>
                  <th className="ax-table__th" scope="col">LA Image</th>
                  <th className="ax-table__th" scope="col">Remark</th>
                  <th className="ax-table__th" scope="col">Installation Status</th>
                  <th className="ax-table__th" scope="col">Verify Status</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Action</th>
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
                        title="No installation records found"
                        message={
                          hasFilters
                            ? 'No records match your filters or search. Try clearing your query.'
                            : 'Installed sites will appear here once structure and electrical work is recorded.'
                        }
                        onClear={hasFilters ? resetFilters : undefined}
                        clearLabel="Clear filters"
                      />
                    </td>
                  </tr>
                )}
                {!loading &&
                  paginatedData.map((s, index) => {
                    const modSerials = parseList(field(s, 'module_serial_no'));
                    const isElectricDone = Number(s.inst_status) === 1;

                    const lat = text(s, 'inst_latitude') || text(s, 'latitude');
                    const lng = text(s, 'inst_longitude') || text(s, 'longitude');
                    const hasGeo = lat !== '' && lng !== '' && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng));

                    return (
                      <tr key={s.id} className="ax-table__row">
                        <td className="ax-table__td ax-num">{(currentPage - 1) * pageSize + index + 1}</td>
                        <td className="ax-table__td">{text(s, 'state') || 'Bihar'}</td>
                        <td className="ax-table__td"><b>{s.district || DASH}</b></td>
                        <td className="ax-table__td">{s.block || DASH}</td>
                        <td className="ax-table__td">{s.village || DASH}</td>
                        <td className="ax-table__td">
                          <span style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                            {s.beneficiary_name || DASH}
                          </span>
                        </td>
                        <td className="ax-table__td">{s.contact_no || DASH}</td>
                        <td className="ax-table__td">{s.ca_no || DASH}</td>

                        {/* Module Serial No. */}
                        <td className="ax-table__td">
                          {modSerials.length === 0 ? (
                            <span style={{ color: 'var(--ax-text-subtle)' }}>{DASH}</span>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              {modSerials.map((serial, i) => (
                                <span
                                  key={i}
                                  className="ax-badge ax-badge--soft ax-badge--neutral"
                                  style={{ fontFamily: 'var(--ax-font-mono)', fontSize: '11px' }}
                                >
                                  {serial}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>

                        <td className="ax-table__td">
                          <ThumbnailGroup
                            images={field(s, 'module_serial_image')}
                            altPrefix="Module Serial"
                            onPreview={openPreview}
                          />
                        </td>

                        <td className="ax-table__td">
                          <ThumbnailGroup
                            images={field(s, 'foundation_fastener_images')}
                            altPrefix="Foundation & Fastener"
                            onPreview={openPreview}
                          />
                        </td>

                        <td className="ax-table__td">
                          <InstallationThumbnail
                            src={s.structure_image}
                            alt="Structure"
                            onPreview={openPreview}
                          />
                        </td>

                        {/* Latitude */}
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

                        <td className="ax-table__td">
                          <span
                            className={`ax-badge ax-badge--soft ${
                              Number(s.structure_status) === 1 ? 'ax-badge--success' : 'ax-badge--warning'
                            }`}
                          >
                            {Number(s.structure_status) === 1 ? 'Installed' : 'Pending'}
                          </span>
                        </td>

                        <td className="ax-table__td">
                          <VerifyBadge value={Number(s.structure_verify_status)} />
                        </td>

                        <td className="ax-table__td" style={{ maxWidth: 200, whiteSpace: 'normal', fontSize: '12px' }}>
                          {text(s, 'structure_verify_remarks') || text(s, 'verify_remarks') || DASH}
                        </td>

                        <td className="ax-table__td">{s.solarmeter_no || text(s, 'solar_meter_no') || DASH}</td>
                        <td className="ax-table__td">{s.inverter_no || DASH}</td>
                        <td className="ax-table__td">{s.nm_sm_no || text(s, 'smart_meter_no') || DASH}</td>
                        <td className="ax-table__td">{s.loger_no || DASH}</td>

                        <td className="ax-table__td">
                          <InstallationThumbnail src={text(s, 'complete_photo')} alt="Complete Plant" onPreview={openPreview} />
                        </td>
                        <td className="ax-table__td">
                          <InstallationThumbnail src={text(s, 'inverter_image')} alt="Inverter" onPreview={openPreview} />
                        </td>
                        <td className="ax-table__td">
                          <InstallationThumbnail src={text(s, 'earthing_image')} alt="Earthing" onPreview={openPreview} />
                        </td>
                        <td className="ax-table__td">
                          <InstallationThumbnail src={text(s, 'acdb_image')} alt="ACDB" onPreview={openPreview} />
                        </td>
                        <td className="ax-table__td">
                          <InstallationThumbnail
                            src={text(s, 'solar_meter_image') || text(s, 'solarmeter_image')}
                            alt="Solar Meter"
                            onPreview={openPreview}
                          />
                        </td>
                        <td className="ax-table__td">
                          <InstallationThumbnail src={text(s, 'la_image')} alt="Lightning Arrester" onPreview={openPreview} />
                        </td>

                        <td className="ax-table__td" style={{ maxWidth: 200, whiteSpace: 'normal', fontSize: '12px' }}>
                          {text(s, 'inst_remarks') || text(s, 'remarks') || DASH}
                        </td>

                        <td className="ax-table__td">
                          <span
                            className={`ax-badge ax-badge--soft ${
                              isElectricDone ? 'ax-badge--success' : 'ax-badge--warning'
                            }`}
                          >
                            {isElectricDone ? 'Installed' : 'Pending'}
                          </span>
                        </td>

                        <td className="ax-table__td">
                          <VerifyBadge value={Number(s.inst_verify_status ?? s.verify_status)} />
                        </td>

                        {/* Action */}
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <RowActionDropdown site={s} onOpenDoc={() => handleOpenDocModal(s)} />
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          <div className="ax-card__footer" style={footerStyle}>
            <div className="ula-pagination-left">
              <Pagination
                currentPage={currentPage}
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                pageSizeOptions={[10, 20, 40, 100]}
              />
            </div>
          </div>
        </section>
      </div>

      {/* ── Photo Preview Modal ── */}
      {preview && <ImagePreviewModal url={preview.url} title={preview.title} onClose={closePreview} />}

      {/* ── Document Modal ── */}
      <Modal open={!!docModalSite} onClose={closeDoc} labelledBy="ula-doc-title">
        {docModalSite && (
          <form onSubmit={handleSubmitDoc}>
            <div className="ax-modal__header">
              <h2 className="ax-modal__title" id="ula-doc-title">Installation document</h2>
              <button type="button" className="ax-modal__close" onClick={closeDoc} aria-label="Close dialog">{X_ICON}</button>
            </div>

            <div className="ax-modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-5)' }}>
              {docError && (
                <div className="ax-alert ax-alert--danger" role="alert">
                  <div className="ax-alert__text">{docError}</div>
                </div>
              )}

              <div className="ula-m-info">
                <div><span>Beneficiary: </span><b>{docModalSite.beneficiary_name || DASH}</b></div>
                <div><span>CA No.: </span><b>{docModalSite.ca_no || DASH}</b></div>
                {docModalSite.district && <div><span>District: </span><b>{docModalSite.district}</b></div>}
              </div>

              <p className="ula-m-note">The field labels marked with * are required fields.</p>

              <div className="ax-field">
                <label className="ax-label" htmlFor="ula-doc-file">Document <Req /></label>
                <input
                  id="ula-doc-file"
                  ref={docInputRef}
                  type="file"
                  accept=".pdf,image/jpeg,image/png,image/jpg"
                  className="ax-input"
                  required
                  onChange={(e) => handlePickDoc(e.target.files?.[0] || null)}
                />
                <span className="ax-help">
                  {docFile ? `${docFile.name} (${formatSize(docFile.size)})` : 'PDF, JPG or PNG, max 5 MB'}
                </span>
              </div>

              <div className="ax-field">
                <label className="ax-label" htmlFor="ula-doc-date">Date <Req /></label>
                <input
                  id="ula-doc-date"
                  type="date"
                  className="ax-input"
                  value={docDate}
                  onChange={(e) => setDocDate(e.target.value)}
                  required
                />
              </div>

              <div className="ax-field">
                <label className="ax-label" htmlFor="ula-doc-remarks">Remarks <Req /></label>
                <textarea
                  id="ula-doc-remarks"
                  className="ax-input"
                  rows={3}
                  placeholder="Enter the Remark..."
                  value={docRemarks}
                  onChange={(e) => setDocRemarks(e.target.value)}
                  required
                />
              </div>

              {text(docModalSite, 'inst_doc') && (
                <div className="ula-m-current">
                  <span>A document is already uploaded. Uploading a new one replaces it.</span>
                  <a
                    href={mediaUrl(text(docModalSite, 'inst_doc'))}
                    target="_blank"
                    rel="noreferrer"
                    className="ax-btn ax-btn--secondary"
                    style={{ flexShrink: 0 }}
                  >
                    View current ↗
                  </a>
                </div>
              )}
            </div>

            <div className="ax-modal__footer">
              <button type="button" className="ax-btn ax-btn--ghost" onClick={closeDoc} disabled={docSubmitting}>Cancel</button>
              <button
                type="submit"
                className="ax-btn ax-btn--primary"
                disabled={docSubmitting || !docFile || !docDate || !docRemarks.trim()}
              >
                {docSubmitting ? <span className="ax-spinner" /> : 'Upload document'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ── Electrical Installation Modal ── */}
      <Modal open={!!electricModalSite} onClose={closeElectric} labelledBy="ula-electric-title" dialogClass="ax-modal__dialog--lg">
        {electricModalSite && (
          <form onSubmit={handleSubmitElectric}>
            <div className="ax-modal__header">
              <div>
                <h2 className="ax-modal__title" id="ula-electric-title">Electrical commissioning</h2>
                <p style={{ margin: 0, fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
                  Site: <b>{electricModalSite.beneficiary_name}</b> (CA #{electricModalSite.ca_no})
                </p>
              </div>
              <button type="button" className="ax-modal__close" onClick={closeElectric} aria-label="Close dialog">{X_ICON}</button>
            </div>

            <div className="ax-modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-5)' }}>
              {electricError && (
                <div className="ax-alert ax-alert--danger" role="alert">
                  <div className="ax-alert__text">{electricError}</div>
                </div>
              )}

              <div className="ula-m-grid">
                <TextField id="ula-e-date" label="Installation Date" type="date" value={instDate} onChange={setInstDate} required />
                <TextField id="ula-e-sm" label="Solar Meter No." value={solarMeterNo} onChange={setSolarMeterNo} placeholder="e.g. SM-10023" />
                <TextField id="ula-e-inv" label="Inverter No." value={inverterNo} onChange={setInverterNo} placeholder="e.g. INV-9081" />
                <TextField id="ula-e-nm" label="Net Meter No." value={nmSmNo} onChange={setNmSmNo} placeholder="e.g. NM-4521" />
                <TextField id="ula-e-log" label="Logger No." value={logerNo} onChange={setLogerNo} placeholder="e.g. LOG-3321" />
                <TextField
                  id="ula-e-rem"
                  label="Installation Remarks"
                  value={instRemarks}
                  onChange={setInstRemarks}
                  placeholder="e.g. Full electrical wiring and inverter synchronization complete"
                  full
                />
                <FileField id="ula-e-f1" label="Complete Plant Photo" onChange={setCompletePhoto} />
                <FileField id="ula-e-f2" label="Inverter Photo" onChange={setInverterImage} />
                <FileField id="ula-e-f3" label="Earthing Photo" onChange={setEarthingImage} />
                <FileField id="ula-e-f4" label="ACDB Photo" onChange={setAcdbImage} />
                <FileField id="ula-e-f5" label="Solar Meter Photo" onChange={setSolarMeterImage} />
                <FileField id="ula-e-f6" label="Lightning Arrester (LA) Photo" onChange={setLaImage} />
              </div>
            </div>

            <div className="ax-modal__footer">
              <button type="button" className="ax-btn ax-btn--ghost" onClick={closeElectric} disabled={electricSubmitting}>Cancel</button>
              <button type="submit" className="ax-btn ax-btn--primary" disabled={electricSubmitting}>
                {electricSubmitting ? <span className="ax-spinner" /> : 'Save electrical installation'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

export default Bihar_Installation_ULA_ViewInstallation;