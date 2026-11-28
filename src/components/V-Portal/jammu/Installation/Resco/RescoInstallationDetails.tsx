import { useState, useMemo, useEffect, useCallback, useRef, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  jammuRescoService,
  resolveJammuMediaUrl,
  getJammuMediaCandidates,
  isJammuPdfFile,
  type JammuRescoInstalledSiteItem,
  type JammuRescoInstallDetailSummary,
} from '../../jammu-services';
import {
  Pagination,
  usePagination,
  SearchInput,
  TableExportToolbar,
  TableEmptyState,
  type ExportColumn,
} from '../../../../../common';

const DASH = '—';

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

const Badge = ({ tone, children }: { tone: Tone; children: ReactNode }) => (
  <span className={`ax-badge ax-badge--soft ax-badge--${tone}`}>{children}</span>
);

const VerifyBadge = ({ value, raw }: { value?: number; raw?: any }) => {
  const r = String(raw ?? '').toLowerCase().trim();
  const v = Number(value ?? 0);
  if (v === 1 || r === '1' || r === 'approved' || r === 'complete') return <Badge tone="success">Complete</Badge>;
  if (v === 2 || r === '2' || r === 'rejected' || r === 'reject') return <Badge tone="danger">Reject</Badge>;
  return <Badge tone="warning">Pending</Badge>;
};

const DocBadge = ({ status }: { status?: number }) => {
  const s = Number(status ?? 0);
  if (s === 2) return <Badge tone="success">Complete</Badge>;
  if (s === 3) return <Badge tone="danger">Reject</Badge>;
  if (s === 1) return <Badge tone="info">Pending</Badge>;
  return <Badge tone="neutral">Pending</Badge>;
};

const txt = (row: any, key: string): string => {
  const v = row?.[key];
  if (v === null || v === undefined || v === '') return '';
  return String(v);
};

/* ───────── Modal Component ───────── */
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
  children,
  dialogClass = '',
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  children: ReactNode;
  dialogClass?: string;
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
    <div className="ax-modal ax-modal--centered" role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
      <div className="ax-modal__backdrop" onClick={onClose} />
      <div ref={dialogRef} className={`ax-modal__dialog${dialogClass ? ' ' + dialogClass : ''}`}>
        {children}
      </div>
    </div>,
    document.body
  );
}

/* ───────── Image Preview Modal (Interactive Lightbox Zoom) ───────── */
const ZOOM_STEPS = [1, 1.5, 2, 3];

function ImagePreviewModal({ url, title, onClose }: { url: string; title: string; onClose: () => void }) {
  const [zoomIdx, setZoomIdx] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const zoom = ZOOM_STEPS[zoomIdx];
  const isPdf = isJammuPdfFile(url);

  useEffect(() => {
    setZoomIdx(0);
    setStatus('loading');
  }, [url]);

  return (
    <Modal open onClose={onClose} labelledBy="preview-title" dialogClass="ax-modal__dialog--lg">
      <div className="ax-modal__header">
        <h2 className="ax-modal__title" id="preview-title" style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
          {title || 'Media Preview'}
        </h2>
        <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">{X_ICON}</button>
      </div>

      <div className="ax-modal__body" style={{ padding: 0 }}>
        {isPdf ? (
          <div style={{ height: 'min(70vh, 650px)', width: '100%' }}>
            <iframe
              src={url}
              title={title || 'Document Preview'}
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          </div>
        ) : (
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
        )}
      </div>

      <div className="ax-modal__footer" style={{ justifyContent: 'space-between' }}>
        {!isPdf ? (
          <div className="ula-m-zoom" role="group" aria-label="Zoom">
            <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setZoomIdx((i) => Math.max(0, i - 1))} disabled={zoomIdx === 0} aria-label="Zoom out">−</button>
            <span className="ula-m-zoom__val">{Math.round(zoom * 100)}%</span>
            <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setZoomIdx((i) => Math.min(ZOOM_STEPS.length - 1, i + 1))} disabled={zoomIdx === ZOOM_STEPS.length - 1} aria-label="Zoom in">+</button>
          </div>
        ) : <div />}
        <div className="ula-m-zoom">
          <a href={url} target="_blank" rel="noreferrer" className="ax-btn ax-btn--ghost">Open in new tab ↗</a>
          <button type="button" className="ax-btn ax-btn--primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </Modal>
  );
}

/* ── Interactive Image Thumbnail ── */
function InstallationThumbnail({
  src,
  alt,
  onPreview,
  size = 34,
  fallbackToLink = false,
}: {
  src?: string | null;
  alt: string;
  onPreview: (url: string, title: string) => void;
  size?: number;
  fallbackToLink?: boolean;
}) {
  const isPdf = useMemo(() => isJammuPdfFile(src), [src]);
  const candidates = useMemo(() => getJammuMediaCandidates(src), [src]);
  const [candidateIdx, setCandidateIdx] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setCandidateIdx(0);
    setFailed(false);
  }, [src]);

  if (!src || String(src).trim() === '' || String(src).toLowerCase() === 'null' || String(src).toLowerCase() === 'undefined') {
    return <span style={{ color: 'var(--ax-text-subtle)' }}>{DASH}</span>;
  }

  // If the document is explicitly a PDF
  if (isPdf) {
    const pdfUrl = candidates[0] || resolveJammuMediaUrl(src);
    return (
      <a
        href={pdfUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="ax-btn ax-btn--ghost ax-btn--xs"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '3px 8px',
          fontSize: 11,
          fontWeight: 600,
          color: '#dc2626',
          background: 'rgba(220, 38, 38, 0.08)',
          border: '1px solid rgba(220, 38, 38, 0.22)',
          borderRadius: 4,
          textDecoration: 'none',
        }}
        title="Open PDF Document in new tab"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 13, height: 13 }}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
        <span>PDF ↗</span>
      </a>
    );
  }

  // If all candidate URLs failed
  if (failed || candidateIdx >= candidates.length) {
    if (fallbackToLink) {
      const fallbackUrl = candidates[0] || resolveJammuMediaUrl(src);
      return (
        <a
          href={fallbackUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ax-btn ax-btn--ghost ax-btn--xs"
          style={{ color: '#2563eb', padding: '2px 6px', fontSize: 11 }}
          title="Open Document File"
        >
          📄 View
        </a>
      );
    }
    return <span style={{ color: 'var(--ax-text-subtle)' }}>{DASH}</span>;
  }

  const currentUrl = candidates[candidateIdx];

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, justifyContent: 'center' }}>
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
        title="Click to preview image"
      />
      {fallbackToLink && (
        <a
          href={currentUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#2563eb', fontSize: 11.5, textDecoration: 'none', fontWeight: 600, padding: '2px' }}
          title="Open full resolution in new tab"
        >
          ↗
        </a>
      )}
    </div>
  );
}

/* ── Action Dropdown (menu is rendered in <body> via createPortal so the table never clips it) ── */
const MENU_W = 185;

function RowActionDropdown({
  onEdit,
  onSubmitDoc,
  onImportPanel,
  onViewPanel,
  canEdit = true,
  canSubmitDoc = true,
}: {
  onEdit: () => void;
  onSubmitDoc: () => void;
  onImportPanel: () => void;
  onViewPanel: () => void;
  canEdit?: boolean;
  canSubmitDoc?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const totalItems = (canEdit ? 1 : 0) + (canSubmitDoc ? 1 : 0) + 2;
  const menuH = totalItems * 38 + 12;

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
          <div ref={menuRef} className="ula-menu" role="menu" style={{ top: pos.top, left: pos.left, width: MENU_W, zIndex: 99999 }}>
            {canEdit && (
              <button
                type="button"
                className="ula-menu__item"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  onEdit();
                }}
                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} style={{ width: 14, height: 14, color: '#2563eb' }}>
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                <span>Edit Details</span>
              </button>
            )}
            {canSubmitDoc && (
              <button
                type="button"
                className="ula-menu__item"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  onSubmitDoc();
                }}
                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} style={{ width: 14, height: 14, color: '#16a34a' }}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <polyline points="9 15 12 12 15 15" />
                </svg>
                <span>Doc Submit</span>
              </button>
            )}
            <button
              type="button"
              className="ula-menu__item"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onImportPanel();
              }}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} style={{ width: 14, height: 14, color: '#d97706' }}>
                <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span>Import Panel</span>
            </button>
            <button
              type="button"
              className="ula-menu__item"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onViewPanel();
              }}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} style={{ width: 14, height: 14, color: '#0284c7' }}>
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
              <span>View Panel</span>
            </button>
          </div>,
          document.body
        )}
    </>
  );
}

/* ───────── Top KPI Card ───────── */
type KpiTone = 'accent' | 'cyan' | 'emerald' | 'amber';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(37, 99, 235, 0.12)', fg: '#2563eb' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan, #06b6d4) 14%, transparent)', fg: '#0891b2' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald, #10b981) 14%, transparent)', fg: '#16a34a' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber, #f59e0b) 14%, transparent)', fg: '#d97706' },
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

/* ───────── Overlay & Responsive CSS ───────── */
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
    min-width: 180px;
    max-width: 220px;
  }
  .solar-erp-page .ax-card__actions input { min-width: 0; width: 100%; }

  .solar-erp-page .ax-table-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  /* Modals */
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
    font-size: 12px; font-weight: 500; border-radius: 4px; cursor: pointer;
  }
  .ula-menu {
    position: fixed; z-index: 99999; box-sizing: border-box;
    display: flex; flex-direction: column; padding: 4px 0; text-align: left;
    background: var(--ax-surface-solid, #ffffff); border: 1px solid var(--ax-border, #e2e8f0); border-radius: 6px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.14), 0 8px 10px -6px rgba(0, 0, 0, 0.08);
  }
  .ula-menu__item {
    display: block; width: 100%; box-sizing: border-box; margin: 0; padding: 8px 14px;
    font: inherit; font-size: 12px; font-weight: 500; text-align: left; text-decoration: none;
    color: var(--ax-text, #0f172a); background: transparent; border: 0; border-radius: 0; cursor: pointer;
  }
  .ula-menu__item:hover, .ula-menu__item:focus-visible { background: var(--ax-surface-subtle, #f1f5f9); outline: none; }
`;

const actionsRowStyle: CSSProperties = { gap: 'var(--ax-space-2, 8px)', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', width: '100%' };
const footerStyle: CSSProperties = {
  borderTop: '1px solid var(--ax-border, #e2e8f0)',
  padding: 'var(--ax-space-3, 12px) var(--ax-space-4, 16px)',
  display: 'flex',
  justifyContent: 'flex-start',
  alignItems: 'center',
  width: '100%',
  boxSizing: 'border-box',
};
const centerCell: CSSProperties = { textAlign: 'center', padding: 24 };
const monoCell: CSSProperties = { fontFamily: 'var(--ax-font-mono)', fontSize: '12px' };

// Table Column Headers as exact as requested by User
const RESCO_COLUMNS = [
  'Sr. No.',
  'Installation Date',
  'State',
  'District',
  'Site Name',
  'Contact Person',
  'Contact Number',
  'Solar Meter No.',
  'Inverter No.',
  'Net/Smart Meter No.',
  'Loger No.',
  'System Image',
  'Inverter Image',
  'Panel Image',
  'Net Meter/Smart Meter Image',
  'Loger Image',
  'Latitude',
  'Longitude',
  'Remark',
  'Verify Status',
  'Verify Remarks',
  'Document Status',
  'Document File',
  'Document Remarks',
  'Action',
];

export function RescoInstallationDetails() {
  const [summary, setSummary] = useState<JammuRescoInstallDetailSummary>({
    total: 0,
    complete: 0,
    pending: 0,
    verify_approved: 0,
    verify_pending: 0,
    verify_reject: 0,
    doc_approved: 0,
    doc_pending: 0,
    doc_reject: 0,
  });
  const [sites, setSites] = useState<JammuRescoInstalledSiteItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [districtFilter, setDistrictFilter] = useState<string>('all');
  const [verifyFilter, setVerifyFilter] = useState<string>('all');

  // Preview Modal
  const [preview, setPreview] = useState<{ url: string; title: string } | null>(null);
  const openPreview = useCallback((url: string, title: string) => setPreview({ url, title }), []);
  const closePreview = useCallback(() => setPreview(null), []);

  // Toast
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);
  useEffect(() => {
    if (!toastMsg) return;
    const t = window.setTimeout(() => setToastMsg(null), 4000);
    return () => window.clearTimeout(t);
  }, [toastMsg]);

  // Edit Modal State (API 8 & 9)
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editLoading, setEditLoading] = useState<boolean>(false);
  const [editForm, setEditForm] = useState({
    site_name: '',
    contact_person: '',
    contact_number: '',
    solarmeter_no: '',
    nm_sm_no: '',
    loger_no: '',
    inverter_no: '',
    panel_no: [] as string[],
    inst_latitude: '',
    inst_longitude: '',
    inst_remarks: '',
  });
  const [submittingEdit, setSubmittingEdit] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Submit Document Modal State (API 10: POST /jk/resco-installation-doc-submit)
  const [docModalSite, setDocModalSite] = useState<JammuRescoInstalledSiteItem | null>(null);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docRemarks, setDocRemarks] = useState<string>('');
  const [docSubmitting, setDocSubmitting] = useState<boolean>(false);
  const [docError, setDocError] = useState<string | null>(null);
  const docFileRef = useRef<HTMLInputElement>(null);

  // Import Panel Modal State (API 16: POST /jk/resco-installation-panel-store/{id})
  const [importModalSite, setImportModalSite] = useState<JammuRescoInstalledSiteItem | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importingPanels, setImportingPanels] = useState<boolean>(false);
  const [importError, setImportError] = useState<string | null>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  // View Panel Modal State (API 17: GET /jk/resco-installation-view-panel/{id})
  const [viewPanelModalSite, setViewPanelModalSite] = useState<JammuRescoInstalledSiteItem | null>(null);
  const [sitePanels, setSitePanels] = useState<Array<{ id: number | string; panel_no: string }>>([]);
  const [loadingPanels, setLoadingPanels] = useState<boolean>(false);
  const [panelSearch, setPanelSearch] = useState<string>('');

  // Load Data from API 7: GET /jk/resco-view-install-site
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await jammuRescoService.getViewInstalledSites();
      setSummary(res.install_detail);
      const rawSites = Array.isArray(res.sites) && res.sites.length > 0
        ? res.sites
        : (Array.isArray((res as any)?.install_detail) ? (res as any).install_detail : (Array.isArray(res.sites) ? res.sites : []));
      setSites(rawSites);
    } catch (err: any) {
      console.error('[Jammu Resco InstallationDetails] load error:', err);
      setToastMsg({ type: 'danger', text: err?.message || 'Failed to load installed RESCO sites.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Distinct districts
  const distinctDistricts = useMemo(() => {
    const list = sites.map((s) => s.district).filter(Boolean) as string[];
    return Array.from(new Set(list));
  }, [sites]);

  // Filtered sites
  const filteredSites = useMemo(() => {
    let list = sites;

    if (districtFilter !== 'all') {
      list = list.filter((s) => s.district === districtFilter);
    }

    if (verifyFilter === 'complete' || verifyFilter === 'approved') {
      list = list.filter((s) => Number(s.inst_verify_status ?? s.verify_status) === 1);
    } else if (verifyFilter === 'pending') {
      list = list.filter((s) => !s.inst_verify_status || Number(s.inst_verify_status ?? s.verify_status) === 0);
    } else if (verifyFilter === 'reject') {
      list = list.filter((s) => Number(s.inst_verify_status ?? s.verify_status) === 2);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((s) => {
        return (
          String(s.id).includes(q) ||
          txt(s, 'site_name').toLowerCase().includes(q) ||
          txt(s, 'district').toLowerCase().includes(q) ||
          txt(s, 'contact_person').toLowerCase().includes(q) ||
          txt(s, 'contact_number').toLowerCase().includes(q) ||
          txt(s, 'inverter_no').toLowerCase().includes(q) ||
          txt(s, 'solarmeter_no').toLowerCase().includes(q) ||
          txt(s, 'nm_sm_no').toLowerCase().includes(q) ||
          txt(s, 'loger_no').toLowerCase().includes(q)
        );
      });
    }

    return list;
  }, [sites, districtFilter, verifyFilter, search]);

  const { paginatedData, currentPage, pageSize, totalItems, setPage, setPageSize } =
    usePagination({ data: filteredSites, initialPageSize: 100 });

  useEffect(() => {
    setPage(1);
  }, [search, districtFilter, verifyFilter, setPage]);

  const hasFilters = search.trim() !== '' || districtFilter !== 'all' || verifyFilter !== 'all';
  const resetFilters = () => {
    setSearch('');
    setDistrictFilter('all');
    setVerifyFilter('all');
    setPage(1);
  };

  // Open Edit Modal (API 8)
  const handleOpenEdit = async (id: number) => {
    setEditingId(id);
    setEditModalOpen(true);
    setEditLoading(true);
    setEditError(null);
    try {
      const data = await jammuRescoService.getInstallationUpdateData(id);
      if (data) {
        let pArr: string[] = [];
        if (Array.isArray(data.panel_no)) {
          pArr = data.panel_no;
        } else if (typeof data.panel_no === 'string') {
          try {
            pArr = JSON.parse(data.panel_no);
          } catch {
            pArr = data.panel_no ? [data.panel_no] : [];
          }
        }

        setEditForm({
          site_name: data.site_name || '',
          contact_person: data.contact_person || '',
          contact_number: data.contact_number || '',
          solarmeter_no: data.solarmeter_no || '',
          nm_sm_no: data.nm_sm_no || '',
          loger_no: data.loger_no || '',
          inverter_no: data.inverter_no || '',
          panel_no: pArr.length > 0 ? pArr : [''],
          inst_latitude: data.inst_latitude || '',
          inst_longitude: data.inst_longitude || '',
          inst_remarks: data.inst_remarks || '',
        });
      }
    } catch (err: any) {
      console.warn('Load update data warning:', err);
      const target = sites.find((s) => s.id === id);
      setEditForm({
        site_name: target?.site_name || '',
        contact_person: target?.contact_person || '',
        contact_number: target?.contact_number || '',
        solarmeter_no: target?.solarmeter_no || '',
        nm_sm_no: target?.nm_sm_no || '',
        loger_no: target?.loger_no || '',
        inverter_no: target?.inverter_no || '',
        panel_no: [''],
        inst_latitude: target?.inst_latitude || target?.latitude || '',
        inst_longitude: target?.inst_longitude || target?.longitude || '',
        inst_remarks: target?.inst_remarks || target?.remark || '',
      });
    } finally {
      setEditLoading(false);
    }
  };

  const [detectingGps, setDetectingGps] = useState(false);
  const detectEditLocation = (silent = false) => {
    if (!navigator.geolocation) {
      if (!silent) alert('Geolocation is not supported by your browser.');
      return;
    }
    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setEditForm((prev) => ({
          ...prev,
          inst_latitude: pos.coords.latitude.toFixed(6),
          inst_longitude: pos.coords.longitude.toFixed(6),
        }));
        setDetectingGps(false);
      },
      (err) => {
        console.warn('Geolocation high accuracy failed, retrying standard...', err);
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setEditForm((prev) => ({
              ...prev,
              inst_latitude: pos.coords.latitude.toFixed(6),
              inst_longitude: pos.coords.longitude.toFixed(6),
            }));
            setDetectingGps(false);
          },
          (err2) => {
            setDetectingGps(false);
            if (!silent) {
              alert(`Unable to retrieve GPS coordinates (${err2.message || 'Permission denied'}). Please allow location access in your browser.`);
            }
          },
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    if (editingId) {
      detectEditLocation(true);
    }
  }, [editingId]);

  // Save Edit Form (API 9)
  const handleSaveEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    setSubmittingEdit(true);
    setEditError(null);
    try {
      const fd = new FormData();
      fd.append('contact_person', editForm.contact_person.trim());
      fd.append('contact_number', editForm.contact_number.trim());
      fd.append('solarmeter_no', editForm.solarmeter_no.trim());
      fd.append('nm_sm_no', editForm.nm_sm_no.trim());
      fd.append('loger_no', editForm.loger_no.trim());
      fd.append('inverter_no', editForm.inverter_no.trim());
      fd.append('inst_latitude', editForm.inst_latitude.trim());
      fd.append('inst_longitude', editForm.inst_longitude.trim());
      fd.append('inst_remarks', editForm.inst_remarks.trim());

      editForm.panel_no.forEach((p) => {
        if (p.trim()) fd.append('panel_no[]', p.trim());
      });

      const res = await jammuRescoService.updateInstallation(editingId, fd);
      setToastMsg({
        type: 'success',
        text: res.message || 'Details updated successfully',
      });
      setEditModalOpen(false);
      await loadData();
    } catch (err: any) {
      console.error('[Jammu Resco Edit] submit error:', err);
      setEditError(err?.message || 'Failed to update installation');
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Open Document Modal (API 10)
  const handleOpenDocModal = (site: JammuRescoInstalledSiteItem) => {
    setDocModalSite(site);
    setDocFile(null);
    setDocRemarks('');
    setDocError(null);
  };

  const closeDocModal = () => {
    setDocModalSite(null);
    setDocFile(null);
    setDocRemarks('');
    setDocError(null);
    if (docFileRef.current) docFileRef.current.value = '';
  };

  // Submit Document Form (API 10: POST /jk/resco-installation-doc-submit)
  const handleDocSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!docModalSite) return;
    if (!docFile) {
      setDocError('Please upload the commissioning document file (PDF, JPG, PNG).');
      return;
    }

    setDocSubmitting(true);
    setDocError(null);
    try {
      const fd = new FormData();
      const siteId = String(docModalSite.site_id || docModalSite.id);
      fd.append('id', siteId);
      fd.append('site_id', siteId);
      fd.append('resco_id', siteId);
      fd.append('doc_file', docFile);
      fd.append('inst_doc_file', docFile);
      fd.append('document_file', docFile);
      fd.append('image', docFile);
      fd.append('file', docFile);
      fd.append('doc_remarks', docRemarks.trim());
      fd.append('inst_doc_remarks', docRemarks.trim());
      fd.append('document_remarks', docRemarks.trim());
      fd.append('remarks', docRemarks.trim());
      fd.append('date', new Date().toISOString().split('T')[0]);
      fd.append('doc_date', new Date().toISOString().split('T')[0]);

      const res = await jammuRescoService.submitInstallationDocument(fd);
      setToastMsg({
        type: 'success',
        text: res.message || 'Document submitted successfully',
      });

      closeDocModal();
      await loadData();
    } catch (err: any) {
      console.error('[Jammu Resco SubmitDoc] error:', err);
      setDocError(err?.message || 'Failed to submit document');
    } finally {
      setDocSubmitting(false);
    }
  };

  // Import Panel handlers (API 16: POST /jk/resco-installation-panel-store/{id})
  const handleOpenImportModal = (site: JammuRescoInstalledSiteItem) => {
    setImportModalSite(site);
    setImportFile(null);
    setImportError(null);
  };

  const closeImportModal = () => {
    setImportModalSite(null);
    setImportFile(null);
    setImportError(null);
    if (importFileRef.current) importFileRef.current.value = '';
  };

  const handleImportSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!importModalSite || !importFile) return;

    setImportingPanels(true);
    setImportError(null);
    try {
      const fd = new FormData();
      const siteId = String(importModalSite.site_id || importModalSite.id);
      fd.append('id', siteId);
      fd.append('site_id', siteId);
      fd.append('resco_id', siteId);
      fd.append('image', importFile);
      fd.append('file', importFile);
      fd.append('panel_image', importFile);
      fd.append('panel_file', importFile);
      fd.append('import_file', importFile);

      const res = await jammuRescoService.importPanels(siteId, fd);
      setToastMsg({
        type: 'success',
        text: res.message || 'Panels imported successfully!',
      });
      closeImportModal();
      await loadData();
    } catch (err: any) {
      console.error('[Jammu Resco Import Panels] error:', err);
      setImportError(err?.message || 'Failed to import panels.');
    } finally {
      setImportingPanels(false);
    }
  };

  // View Panel handlers (API 17: GET /jk/resco-installation-view-panel/{id})
  const handleOpenViewPanel = async (site: JammuRescoInstalledSiteItem) => {
    setViewPanelModalSite(site);
    setLoadingPanels(true);
    setPanelSearch('');
    setSitePanels([]);

    try {
      const siteId = site.site_id || site.id;
      const res = await jammuRescoService.getViewPanels(siteId);
      let list: any[] = [];
      if (res && Array.isArray(res.panels)) {
        list = res.panels;
      } else if (res && Array.isArray((res as any).data)) {
        list = (res as any).data;
      }

      if (list.length === 0 && site.panel_no) {
        if (Array.isArray(site.panel_no)) {
          list = site.panel_no;
        } else if (typeof site.panel_no === 'string') {
          try {
            const parsed = JSON.parse(site.panel_no);
            if (Array.isArray(parsed)) list = parsed;
            else list = site.panel_no.split(',');
          } catch {
            list = site.panel_no.split(',');
          }
        }
      }

      const normalized = list
        .filter((item) => item !== null && item !== undefined && item !== '')
        .map((item, idx) => {
          if (typeof item === 'string') {
            return { id: idx + 1, panel_no: item.trim() };
          }
          return {
            id: item.id || idx + 1,
            panel_no: String(item.panel_no || item.panel_serial_no || item.serial_no || item.number || '—').trim(),
          };
        });

      setSitePanels(normalized);
    } catch (err: any) {
      console.warn('Error loading panels, falling back to local panel_no:', err);
      if (Array.isArray(site.panel_no)) {
        setSitePanels(site.panel_no.map((p, idx) => ({ id: idx + 1, panel_no: String(p) })));
      } else if (typeof site.panel_no === 'string' && site.panel_no.trim()) {
        try {
          const parsed = JSON.parse(site.panel_no);
          if (Array.isArray(parsed)) {
            setSitePanels(parsed.map((p, idx) => ({ id: idx + 1, panel_no: String(p) })));
          } else {
            setSitePanels([{ id: 1, panel_no: site.panel_no }]);
          }
        } catch {
          setSitePanels(site.panel_no.split(',').map((p, idx) => ({ id: idx + 1, panel_no: p.trim() })));
        }
      } else {
        setSitePanels([]);
      }
    } finally {
      setLoadingPanels(false);
    }
  };

  const filteredPanels = useMemo(() => {
    if (!panelSearch.trim()) return sitePanels;
    const q = panelSearch.trim().toLowerCase();
    return sitePanels.filter((p) => String(p.panel_no).toLowerCase().includes(q));
  }, [sitePanels, panelSearch]);

  // Export Columns definition
  const exportCols: ExportColumn<JammuRescoInstalledSiteItem>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r: JammuRescoInstalledSiteItem, idx?: number) => (idx !== undefined ? idx + 1 : '') } as any,
      { header: 'Installation Date', accessor: (r: JammuRescoInstalledSiteItem) => txt(r, 'inst_date') || txt(r, 'created_at') },
      { header: 'State', accessor: (r: JammuRescoInstalledSiteItem) => r.state || 'Jammu & Kashmir' },
      { header: 'District', accessor: (r: JammuRescoInstalledSiteItem) => r.district || DASH },
      { header: 'Site Name', accessor: (r: JammuRescoInstalledSiteItem) => r.site_name || DASH },
      { header: 'Contact Person', accessor: (r: JammuRescoInstalledSiteItem) => r.contact_person || DASH },
      { header: 'Contact Number', accessor: (r: JammuRescoInstalledSiteItem) => r.contact_number || DASH },
      { header: 'Solar Meter No.', accessor: (r: JammuRescoInstalledSiteItem) => r.solarmeter_no || DASH },
      { header: 'Inverter No.', accessor: (r: JammuRescoInstalledSiteItem) => r.inverter_no || DASH },
      { header: 'Net/Smart Meter No.', accessor: (r: JammuRescoInstalledSiteItem) => r.nm_sm_no || DASH },
      { header: 'Loger No.', accessor: (r: JammuRescoInstalledSiteItem) => r.loger_no || DASH },
      { header: 'Latitude', accessor: (r: JammuRescoInstalledSiteItem) => r.inst_latitude || r.latitude || DASH },
      { header: 'Longitude', accessor: (r: JammuRescoInstalledSiteItem) => r.inst_longitude || r.longitude || DASH },
      { header: 'Remark', accessor: (r: JammuRescoInstalledSiteItem) => r.inst_remarks || r.remark || DASH },
      { header: 'Verify Status', accessor: (r: JammuRescoInstalledSiteItem) => (Number(r.inst_verify_status ?? r.verify_status) === 1 ? 'Complete' : Number(r.inst_verify_status ?? r.verify_status) === 2 ? 'Reject' : 'Pending') },
      { header: 'Verify Remarks', accessor: (r: JammuRescoInstalledSiteItem) => r.inst_verify_remarks || r.verify_remarks || DASH },
      { header: 'Document Status', accessor: (r: JammuRescoInstalledSiteItem) => (Number(r.inst_doc_status ?? r.document_status) === 2 ? 'Complete' : Number(r.inst_doc_status ?? r.document_status) === 3 ? 'Reject' : 'Pending') },
      { header: 'Document File', accessor: (r: JammuRescoInstalledSiteItem) => resolveJammuMediaUrl(r.inst_doc_file || r.doc_file || r.document_file || r.inst_doc || r.document || r.file) || DASH },
      { header: 'Document Remarks', accessor: (r: JammuRescoInstalledSiteItem) => r.inst_doc_remarks || r.doc_remarks || r.document_remarks || DASH },
    ],
    []
  );

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="Jammu Resco Installation"
        subtitle="Complete audit register of verified RESCO rooftop solar site installations and compliance documents"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Jammu & Kashmir' },
          { label: 'Installation' },
          { label: 'RESCO' },
          { label: 'Installation Details' },
        ]}
        actions={
          <Link to="/v/jammu/installation/resco/install-site" className="ax-btn ax-btn--primary ax-btn--sm">
            <span className="ax-btn__label">+ Install Site</span>
          </Link>
        }
      />

      {toastMsg && (
        <div className={`ax-alert ax-alert--${toastMsg.type}`} style={{ marginBottom: 'var(--ax-space-4, 16px)' }} role="status">
          <div className="ax-alert__title">{toastMsg.type === 'success' ? 'Success' : 'Error'}</div>
          <div className="ax-alert__text">{toastMsg.text}</div>
        </div>
      )}

      {/* ── Top 4 KPI Cards (EXACT as requested:
          1. Total 0 Total Assign
          2. Installation Status 0 / 0 Complete / Pending
          3. Verify Status 0 / 0 / 0 Complete / Pending / Reject
          4. Document Verify 0 / 0 / 0 Complete / Pending / Reject
      ) ── */}
      <div className="asw-cards-row">
        {/* Card 1 */}
        <KpiCard
          tone="accent"
          label="Total Assign"
          value={summary.total.toLocaleString('en-IN')}
          sub="Total site allocations"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <path d="M8 9h8M8 13h8M8 17h5" />
            </svg>
          }
        />

        {/* Card 2 */}
        <KpiCard
          tone="emerald"
          label="Installation Status"
          value={`${summary.complete} / ${summary.pending}`}
          sub="Complete / Pending"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          }
        />

        {/* Card 3 */}
        <KpiCard
          tone="cyan"
          label="Verify Status"
          value={`${summary.verify_approved} / ${summary.verify_pending} / ${summary.verify_reject}`}
          sub="Complete / Pending / Reject"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <polyline points="12 7 12 12 15 15" />
            </svg>
          }
        />

        {/* Card 4 */}
        <KpiCard
          tone="amber"
          label="Document Verify"
          value={`${summary.doc_approved} / ${summary.doc_pending} / ${summary.doc_reject}`}
          sub="Complete / Pending / Reject"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
            </svg>
          }
        />
      </div>

      {/* ── Main Table Card ── */}
      <section className="ax-card ax-col--12" role="region" aria-label="Jammu Resco Installation Table">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">Jammu Resco Installation</h2>
            <p className="ax-card__subtitle">
              <span className="ax-num">{filteredSites.length}</span> installations found.
            </p>
          </div>

          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              {distinctDistricts.length > 0 && (
                <select
                  className="ax-input ax-input--sm"
                  style={{ width: 140, height: 32 }}
                  value={districtFilter}
                  onChange={(e) => setDistrictFilter(e.target.value)}
                  aria-label="Filter by district"
                >
                  <option value="all">All Districts</option>
                  {distinctDistricts.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              )}

              <select
                className="ax-input ax-input--sm"
                style={{ width: 150, height: 32 }}
                value={verifyFilter}
                onChange={(e) => setVerifyFilter(e.target.value)}
                aria-label="Filter by verify status"
              >
                <option value="all">All Verification</option>
                <option value="complete">Complete</option>
                <option value="pending">Pending</option>
                <option value="reject">Reject</option>
              </select>

              {hasFilters && (
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--sm"
                  onClick={resetFilters}
                  style={{ height: 30, padding: '0 8px' }}
                >
                  Reset
                </button>
              )}

              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search site, district…"
                size="sm"
                ariaLabel="Search installed sites"
              />

              <TableExportToolbar
                onCopy={() => {
                  const t = [
                    exportCols.map((c) => c.header).join('\t'),
                    ...filteredSites.map((r, i) =>
                      exportCols.map((c) => (typeof c.accessor === 'function' ? (c.accessor as any)(r, i) : r[c.accessor as keyof typeof r])).join('\t')
                    ),
                  ].join('\n');
                  navigator.clipboard.writeText(t);
                  setToastMsg({ type: 'success', text: 'Copied to clipboard!' });
                }}
                onExportCSV={() => {
                  const out = [
                    exportCols.map((c) => c.header).join(','),
                    ...filteredSites.map((r, i) =>
                      exportCols.map((c) => `"${String(typeof c.accessor === 'function' ? (c.accessor as any)(r, i) : r[c.accessor as keyof typeof r] || '').replace(/"/g, '""')}"`).join(',')
                    ),
                  ].join('\n');
                  const blob = new Blob([out], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'Jammu_RESCO_Installation_Details.csv';
                  a.click();
                }}
                onExportExcel={() => {
                  const tableHtml = `<table border="1"><thead><tr>${exportCols.map((c) => `<th>${escapeHtml(c.header ?? c.label ?? '')}</th>`).join('')}</tr></thead><tbody>${filteredSites.map((r, i) => `<tr>${exportCols.map((c) => `<td>${escapeHtml(String(typeof c.accessor === 'function' ? (c.accessor as any)(r, i) : r[c.accessor as keyof typeof r] || ''))}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
                  const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8" /></head><body>${tableHtml}</body></html>`;
                  const blob = new Blob([`\ufeff${html}`], { type: 'application/vnd.ms-excel' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'Jammu_RESCO_Installation_Details.xls';
                  a.click();
                }}
                onExportPDF={() => window.print()}
              />
            </div>
          </div>
        </div>

        {/* ── Table with EXACT user headers:
            Sr. No. | Installation Date | State | District | Site Name | Contact Person | Contact Number |
            Solar Meter No. | Inverter No. | Net/Smart Meter No. | Loger No. | System Image | Inverter Image |
            Panel Image | Net Meter/Smart Meter Image | Loger Image | Latitude | Longitude | Remark |
            Verify Status | Verify Remarks | Document Status | Document File | Document Remarks | Action ── */}
        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap', minWidth: 2600 }}>
            <thead className="ax-table__head">
              <tr>
                {RESCO_COLUMNS.map((h) => (
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
                  <td colSpan={RESCO_COLUMNS.length} style={centerCell}>
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading installed RESCO sites from server…
                  </td>
                </tr>
              )}
              {!loading && filteredSites.length === 0 && (
                <tr>
                  <td colSpan={RESCO_COLUMNS.length} style={{ padding: 0 }}>
                    <TableEmptyState
                      title="No installation records found"
                      message={
                        hasFilters
                          ? 'No records match your filters. Try clearing your search.'
                          : 'Installed RESCO sites will appear here once submitted from the Install Site form.'
                      }
                      onClear={hasFilters ? resetFilters : undefined}
                    />
                  </td>
                </tr>
              )}
              {!loading &&
                paginatedData.map((row, index) => {
                  const lat = txt(row, 'inst_latitude') || txt(row, 'latitude');
                  const lng = txt(row, 'inst_longitude') || txt(row, 'longitude');
                  const hasGeo = lat !== '' && lng !== '' && !isNaN(Number(lat)) && !isNaN(Number(lng));
                  const siteLabel = row.site_name || `Site ${row.id}`;

                  const panelImg = row.panel_image || row.panel_photo || row.panel_img;
                  const systemImg = row.system_image || row.system_photo || row.system_img;
                  const inverterImg = row.inverter_image || row.inverter_photo || row.inverter_img;
                  const nmSmImg = row.nm_sm_image || row.nm_sm_photo || row.nm_sm_img || row.meter_image;
                  const logerImg = row.loger_image || row.loger_photo || row.loger_img || row.logger_image;

                  const docFileRaw =
                    row.inst_doc_file ||
                    row.doc_file ||
                    row.document_file ||
                    row.inst_doc ||
                    row.document ||
                    row.doc ||
                    row.doc_image ||
                    row.commissioning_doc ||
                    row.inst_verify_file ||
                    row.file;

                  const vStatus = Number(row.inst_verify_status ?? row.verify_status ?? 0);
                  const rawV = String(row.inst_verify_status ?? row.verify_status ?? '').toLowerCase().trim();
                  const isApproved = vStatus === 1 || rawV === 'approved' || rawV === 'complete';

                  return (
                    <tr key={row.id || index} className="ax-table__row">
                      <td className="ax-table__td ax-num">{(currentPage - 1) * pageSize + index + 1}</td>
                      <td className="ax-table__td" style={{ fontSize: 12 }}>
                        {txt(row, 'inst_date') || txt(row, 'created_at') || DASH}
                      </td>
                      <td className="ax-table__td">{txt(row, 'state') || 'Jammu & Kashmir'}</td>
                      <td className="ax-table__td"><b>{txt(row, 'district') || DASH}</b></td>
                      <td className="ax-table__td">
                        <span style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                          {row.site_name || DASH}
                        </span>
                      </td>
                      <td className="ax-table__td">{txt(row, 'contact_person') || DASH}</td>
                      <td className="ax-table__td" style={monoCell}>{txt(row, 'contact_number') || DASH}</td>
                      <td className="ax-table__td" style={monoCell}>{txt(row, 'solarmeter_no') || DASH}</td>
                      <td className="ax-table__td" style={monoCell}>{txt(row, 'inverter_no') || DASH}</td>
                      <td className="ax-table__td" style={monoCell}>{txt(row, 'nm_sm_no') || DASH}</td>
                      <td className="ax-table__td" style={monoCell}>{txt(row, 'loger_no') || DASH}</td>

                      {/* Photo Thumbnails */}
                      <td className="ax-table__td">
                        <InstallationThumbnail
                          src={systemImg}
                          alt={`${siteLabel} - System Photo`}
                          onPreview={openPreview}
                        />
                      </td>
                      <td className="ax-table__td">
                        <InstallationThumbnail
                          src={inverterImg}
                          alt={`${siteLabel} - Inverter Photo`}
                          onPreview={openPreview}
                        />
                      </td>
                      <td className="ax-table__td">
                        <InstallationThumbnail
                          src={panelImg}
                          alt={`${siteLabel} - Panel Photo`}
                          onPreview={openPreview}
                        />
                      </td>
                      <td className="ax-table__td">
                        <InstallationThumbnail
                          src={nmSmImg}
                          alt={`${siteLabel} - Net Meter Photo`}
                          onPreview={openPreview}
                        />
                      </td>
                      <td className="ax-table__td">
                        <InstallationThumbnail
                          src={logerImg}
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
                            style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}
                            title="Open in Google Maps"
                          >
                            {lat}
                          </a>
                        ) : (
                          lat || DASH
                        )}
                      </td>
                      <td className="ax-table__td">{lng || DASH}</td>

                      {/* Remark */}
                      <td className="ax-table__td" style={{ maxWidth: 180, whiteSpace: 'normal', fontSize: 12 }}>
                        {row.inst_remarks || row.remark || row.remarks || DASH}
                      </td>

                      {/* Verify Status & Verify Remarks */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <VerifyBadge value={vStatus} raw={row.inst_verify_status ?? row.verify_status} />
                      </td>
                      <td className="ax-table__td" style={{ maxWidth: 160, whiteSpace: 'normal', fontSize: 12 }}>
                        {row.inst_verify_remarks || row.verify_remarks || DASH}
                      </td>

                      {/* Document Status, Document File & Document Remarks */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <DocBadge status={row.inst_doc_status ?? row.document_status} />
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <InstallationThumbnail
                          src={docFileRaw}
                          alt={`${siteLabel} - Document File`}
                          onPreview={openPreview}
                          size={34}
                          fallbackToLink={true}
                        />
                      </td>
                      <td className="ax-table__td" style={{ maxWidth: 160, whiteSpace: 'normal', fontSize: 12 }}>
                        {row.inst_doc_remarks || row.doc_remarks || row.document_remarks || DASH}
                      </td>

                      {/* Action Dropdown */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <RowActionDropdown
                          canEdit={!isApproved}
                          canSubmitDoc={true}
                          onEdit={() => handleOpenEdit(row.id)}
                          onSubmitDoc={() => handleOpenDocModal(row)}
                          onImportPanel={() => handleOpenImportModal(row)}
                          onViewPanel={() => handleOpenViewPanel(row)}
                        />
                      </td>
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
              setPage={setPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[25, 50, 100, 200]}
            />
          </div>
        </div>
      </section>

      {/* ── Image Lightbox Modal ── */}
      {preview && <ImagePreviewModal url={preview.url} title={preview.title} onClose={closePreview} />}

      {/* ── Edit Modal (API 8 & 9) ── */}
      <Modal open={editModalOpen} onClose={() => setEditModalOpen(false)} labelledBy="resco-edit-title" dialogClass="ax-modal__dialog--lg">
        <form onSubmit={handleSaveEdit}>
          <div className="ax-modal__header">
            <div>
              <h4 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--ax-text-strong, #0f172a)' }} id="resco-edit-title">
                Edit RESCO Installation Details
              </h4>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--ax-text-muted, #64748b)' }}>
                Site: <b>{editForm.site_name}</b> ({editingId})
              </p>
            </div>
            <button
              type="button"
              className="ax-modal__close"
              onClick={() => setEditModalOpen(false)}
              disabled={submittingEdit}
              aria-label="Close dialog"
            >
              ✕
            </button>
          </div>

          <div className="ax-modal__body" style={{ padding: 24 }}>
            {editError && (
              <div style={{ marginBottom: 16, padding: 12, borderRadius: 8, background: '#fef2f2', color: '#991b1b', fontSize: 13, fontWeight: 600, border: '1px solid #fecaca' }}>
                ✕ {editError}
              </div>
            )}

            {editLoading ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#2563eb' }}>
                <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading specifications for edit…
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                  <div className="ax-modern-field">
                    <label className="ax-modern-label">
                      <span>Contact Person</span>
                      <span className="ax-modern-req">*</span>
                    </label>
                    <input
                      type="text"
                      className="ax-input"
                      value={editForm.contact_person}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, contact_person: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="ax-modern-field">
                    <label className="ax-modern-label">
                      <span>Contact Number</span>
                      <span className="ax-modern-req">*</span>
                    </label>
                    <input
                      type="tel"
                      className="ax-input"
                      value={editForm.contact_number}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, contact_number: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                  <div className="ax-modern-field">
                    <label className="ax-modern-label">
                      <span>Inverter Number</span>
                      <span className="ax-modern-req">*</span>
                    </label>
                    <input
                      type="text"
                      className="ax-input"
                      value={editForm.inverter_no}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, inverter_no: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="ax-modern-field">
                    <label className="ax-modern-label">
                      <span>Solar Meter Number</span>
                      <span className="ax-modern-req">*</span>
                    </label>
                    <input
                      type="text"
                      className="ax-input"
                      value={editForm.solarmeter_no}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, solarmeter_no: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="ax-modern-field">
                    <label className="ax-modern-label">
                      <span>Net/Smart Meter Number</span>
                      <span className="ax-modern-req">*</span>
                    </label>
                    <input
                      type="text"
                      className="ax-input"
                      value={editForm.nm_sm_no}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, nm_sm_no: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="ax-modern-field">
                    <label className="ax-modern-label">
                      <span>RMS Loger Number</span>
                      <span className="ax-modern-req">*</span>
                    </label>
                    <input
                      type="text"
                      className="ax-input"
                      value={editForm.loger_no}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, loger_no: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ax-text-subtle, #64748b)' }}>GPS Coordinates</span>
                  <button
                    type="button"
                    className="ax-btn ax-btn--secondary ax-btn--xs"
                    onClick={() => detectEditLocation(false)}
                    disabled={detectingGps}
                  >
                    {detectingGps ? 'Detecting...' : '📍 Auto-detect GPS'}
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                  <div className="ax-modern-field">
                    <label className="ax-modern-label">
                      <span>Latitude</span>
                      <span className="ax-modern-req">*</span>
                    </label>
                    <input
                      type="text"
                      className="ax-input"
                      value={editForm.inst_latitude}
                      onChange={() => {}}
                      readOnly={true}
                      style={{ cursor: 'not-allowed', backgroundColor: 'var(--ax-surface-subtle, #f8fafc)' }}
                      placeholder="Auto-detected GPS Latitude"
                      required
                    />
                  </div>

                  <div className="ax-modern-field">
                    <label className="ax-modern-label">
                      <span>Longitude</span>
                      <span className="ax-modern-req">*</span>
                    </label>
                    <input
                      type="text"
                      className="ax-input"
                      value={editForm.inst_longitude}
                      onChange={() => {}}
                      readOnly={true}
                      style={{ cursor: 'not-allowed', backgroundColor: 'var(--ax-surface-subtle, #f8fafc)' }}
                      placeholder="Auto-detected GPS Longitude"
                      required
                    />
                  </div>

                  <div className="ax-modern-field" style={{ gridColumn: '1 / -1' }}>
                    <label className="ax-modern-label">
                      <span>Remarks</span>
                    </label>
                    <input
                      type="text"
                      className="ax-input"
                      value={editForm.inst_remarks}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, inst_remarks: e.target.value }))}
                      placeholder="Enter update remarks..."
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="ax-modal__footer">
            <button
              type="button"
              className="ax-btn ax-btn--secondary"
              onClick={() => setEditModalOpen(false)}
              disabled={submittingEdit}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="ax-btn ax-btn--primary"
              disabled={submittingEdit || editLoading}
            >
              {submittingEdit ? 'Updating Details…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Submit Document Modal (API 10: POST /jk/resco-installation-doc-submit) ── */}
      <Modal open={!!docModalSite} onClose={closeDocModal} labelledBy="resco-doc-title" dialogClass="ax-modal__dialog--md">
        {docModalSite && (
          <form onSubmit={handleDocSubmit}>
            <div className="ax-modal__header">
              <div>
                <h4 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--ax-text-strong, #0f172a)' }} id="resco-doc-title">
                  Submit Installation Document
                </h4>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--ax-text-muted, #64748b)' }}>
                  Site: <b>{docModalSite.site_name || DASH}</b> ({docModalSite.site_id || docModalSite.id})
                </p>
              </div>
              <button
                type="button"
                className="ax-modal__close"
                onClick={closeDocModal}
                disabled={docSubmitting}
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <div className="ax-modal__body" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {docError && (
                <div style={{ padding: 12, borderRadius: 8, background: '#fef2f2', color: '#991b1b', fontSize: 13, fontWeight: 600, border: '1px solid #fecaca' }}>
                  ✕ {docError}
                </div>
              )}

              <div style={{ fontSize: 12.5, color: 'var(--ax-text-muted, #64748b)', background: 'var(--ax-surface-subtle, #f8fafc)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--ax-border, #e2e8f0)' }}>
                Upload commissioning handover sheet, joint inspection report or signed invoice document (PDF, JPG, PNG).
              </div>

              {Boolean(
                docModalSite.inst_doc_file ||
                docModalSite.doc_file ||
                docModalSite.document_file ||
                docModalSite.inst_doc ||
                docModalSite.file
              ) && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 8, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <InstallationThumbnail
                      src={
                        docModalSite.inst_doc_file ||
                        docModalSite.doc_file ||
                        docModalSite.document_file ||
                        docModalSite.inst_doc ||
                        docModalSite.file
                      }
                      alt={`${docModalSite.site_name || 'Site'} - Existing Document`}
                      onPreview={openPreview}
                      size={36}
                      fallbackToLink={true}
                    />
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#166534' }}>Current Document Attached</div>
                      <div style={{ fontSize: 11, color: '#15803d' }}>Upload a new file below to replace it</div>
                    </div>
                  </div>
                  <a
                    href={resolveJammuMediaUrl(
                      docModalSite.inst_doc_file ||
                      docModalSite.doc_file ||
                      docModalSite.document_file ||
                      docModalSite.inst_doc ||
                      docModalSite.file
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ax-btn ax-btn--ghost ax-btn--xs"
                    style={{ color: '#166534', fontWeight: 600, fontSize: 11 }}
                  >
                    View Current ↗
                  </a>
                </div>
              )}

              {/* Document File Dropzone */}
              <div className="ax-modern-field">
                <label className="ax-modern-label">
                  <span>Installation Document File</span>
                  <span className="ax-modern-req">*</span>
                </label>
                <input
                  ref={docFileRef}
                  id="resco_doc_file_input"
                  type="file"
                  accept=".pdf,image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                />
                {!docFile ? (
                  <div
                    className="ax-modern-dropzone"
                    onClick={() => docFileRef.current?.click()}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="ax-modern-dropzone__icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 22, height: 22, color: '#2563eb' }}>
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong, #1e293b)' }}>
                        Click to upload installation document
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--ax-text-muted, #64748b)', marginTop: 2 }}>
                        Allowed: JPG, PNG, WEBP, PDF (Max 5 MB)
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="ax-modern-file-chip">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <span className="ax-modern-file-chip__icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 18, height: 18, color: '#059669' }}>
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                        </svg>
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong, #1e293b)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {docFile.name}
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--ax-text-muted, #64748b)' }}>
                          {(docFile.size / 1024).toFixed(1)} KB
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="ax-btn ax-btn--ghost ax-btn--sm"
                      style={{ padding: '4px 8px', fontSize: 12, color: '#ef4444' }}
                      onClick={() => {
                        setDocFile(null);
                        if (docFileRef.current) docFileRef.current.value = '';
                      }}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Document Remarks */}
              <div className="ax-modern-field">
                <label className="ax-modern-label" htmlFor="resco_doc_remarks">
                  <span>Document Remarks</span>
                  <span className="ax-modern-req">*</span>
                </label>
                <textarea
                  id="resco_doc_remarks"
                  className="ax-input"
                  style={{ width: '100%', padding: '10px 12px', minHeight: 70 }}
                  value={docRemarks}
                  onChange={(e) => setDocRemarks(e.target.value)}
                  placeholder="Enter remarks for commissioning document handover..."
                  rows={3}
                  required
                />
              </div>
            </div>

            <div className="ax-modal__footer">
              <button
                type="button"
                className="ax-btn ax-btn--secondary"
                onClick={closeDocModal}
                disabled={docSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="ax-btn ax-btn--primary"
                disabled={docSubmitting || !docFile || !docRemarks.trim()}
              >
                {docSubmitting ? 'Submitting…' : 'Submit Document'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ── Import Panel Modal (API 16: POST /jk/resco-installation-panel-store/{id}) ── */}
      <Modal open={!!importModalSite} onClose={closeImportModal} labelledBy="resco-import-title" dialogClass="ax-modal__dialog--md">
        {importModalSite && (
          <form onSubmit={handleImportSubmit}>
            <div className="ax-modal__header">
              <div>
                <h4 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--ax-text-strong, #0f172a)' }} id="resco-import-title">
                  Import Panels
                </h4>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--ax-text-muted, #64748b)' }}>
                  Site: <b>{importModalSite.site_name}</b> (#{importModalSite.id})
                </p>
              </div>
              <button
                type="button"
                className="ax-modal__close"
                onClick={closeImportModal}
                disabled={importingPanels}
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <div className="ax-modal__body" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {importError && (
                <div style={{ padding: 12, borderRadius: 8, background: '#fef2f2', color: '#991b1b', fontSize: 13, fontWeight: 600, border: '1px solid #fecaca' }}>
                  ✕ {importError}
                </div>
              )}

              <div style={{ fontSize: 12.5, color: '#1e40af', background: '#eff6ff', padding: '10px 14px', borderRadius: 8, border: '1px solid #bfdbfe' }}>
                Upload panel photograph or Excel (.xlsx, .xls) / CSV file containing solar panel serial numbers.
              </div>

              {/* File Dropzone */}
              <div className="ax-modern-field">
                <label className="ax-modern-label">
                  <span>Panel Image / File</span>
                  <span className="ax-modern-req">*</span>
                </label>
                <input
                  ref={importFileRef}
                  id="resco_import_file_input"
                  type="file"
                  accept="image/*,.xlsx,.xls,.csv"
                  style={{ display: 'none' }}
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                />
                {!importFile ? (
                  <div
                    className="ax-modern-dropzone"
                    onClick={() => importFileRef.current?.click()}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="ax-modern-dropzone__icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 22, height: 22, color: '#d97706' }}>
                        <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong, #1e293b)' }}>
                        Click to upload panel image or Excel file
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--ax-text-muted, #64748b)', marginTop: 2 }}>
                        Allowed: JPG, PNG, WEBP, XLSX, XLS, CSV
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="ax-modern-file-chip">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <span className="ax-modern-file-chip__icon" style={{ background: '#fef3c7' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 18, height: 18, color: '#d97706' }}>
                          <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong, #1e293b)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {importFile.name}
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--ax-text-muted, #64748b)' }}>
                          {(importFile.size / 1024).toFixed(1)} KB
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="ax-btn ax-btn--ghost ax-btn--sm"
                      style={{ padding: '4px 8px', fontSize: 12, color: '#ef4444' }}
                      onClick={() => {
                        setImportFile(null);
                        if (importFileRef.current) importFileRef.current.value = '';
                      }}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="ax-modal__footer">
              <button
                type="button"
                className="ax-btn ax-btn--secondary"
                onClick={closeImportModal}
                disabled={importingPanels}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="ax-btn ax-btn--primary"
                disabled={importingPanels || !importFile}
              >
                {importingPanels ? 'Uploading…' : 'Upload & Import'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ── View Panel Modal (API 17: GET /jk/resco-installation-view-panel/{id}) ── */}
      <Modal open={!!viewPanelModalSite} onClose={() => setViewPanelModalSite(null)} labelledBy="resco-panels-title" dialogClass="ax-modal__dialog--md">
        {viewPanelModalSite && (
          <div>
            <div className="ax-modal__header">
              <div>
                <h4 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--ax-text-strong, #0f172a)' }} id="resco-panels-title">
                  Installed Panels List
                </h4>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--ax-text-muted, #64748b)' }}>
                  Site: <b>{viewPanelModalSite.site_name}</b> (#{viewPanelModalSite.id}) · Total: <b>{sitePanels.length}</b> panels
                </p>
              </div>
              <button
                type="button"
                className="ax-modal__close"
                onClick={() => setViewPanelModalSite(null)}
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <div className="ax-modal__body" style={{ padding: 20 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14 }}>
                <SearchInput
                  value={panelSearch}
                  onChange={setPanelSearch}
                  placeholder="Search panel serial number…"
                  size="sm"
                  ariaLabel="Search panel numbers"
                />
                <button
                  type="button"
                  className="ax-btn ax-btn--secondary ax-btn--sm"
                  onClick={() => {
                    const text = sitePanels.map((p, i) => `${i + 1}\t${p.panel_no}`).join('\n');
                    navigator.clipboard.writeText(text);
                    setToastMsg({ type: 'success', text: 'Panel numbers copied to clipboard!' });
                  }}
                  disabled={sitePanels.length === 0}
                  style={{ whiteSpace: 'nowrap', padding: '0 12px', height: 32 }}
                >
                  Copy List
                </button>
              </div>

              {loadingPanels ? (
                <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--ax-text-muted)' }}>
                  <span className="ax-spinner" style={{ width: 18, height: 18, marginRight: 8, verticalAlign: 'middle' }} />
                  Loading panels…
                </div>
              ) : filteredPanels.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--ax-text-muted)', background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 8 }}>
                  {sitePanels.length === 0 ? 'No individual panel records found for this site.' : 'No panel matches your search.'}
                </div>
              ) : (
                <div style={{ maxHeight: 340, overflowY: 'auto', border: '1px solid var(--ax-border, #e2e8f0)', borderRadius: 8 }}>
                  <table className="ax-table ax-table--sm" style={{ width: '100%', whiteSpace: 'nowrap', margin: 0 }}>
                    <thead className="ax-table__head" style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 1 }}>
                      <tr>
                        <th className="ax-table__th" style={{ width: 70, textAlign: 'center' }}>Sr. No.</th>
                        <th className="ax-table__th">Panel No.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPanels.map((panel, pIdx) => (
                        <tr key={panel.id || pIdx} className="ax-table__row">
                          <td className="ax-table__td ax-num" style={{ textAlign: 'center' }}>{pIdx + 1}</td>
                          <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono, monospace)', fontWeight: 600 }}>
                            {panel.panel_no}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="ax-modal__footer" style={{ justifyContent: 'space-between' }}>
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--sm"
                onClick={() => {
                  const site = viewPanelModalSite;
                  setViewPanelModalSite(null);
                  handleOpenImportModal(site);
                }}
              >
                + Import More Panels
              </button>
              <button
                type="button"
                className="ax-btn ax-btn--primary ax-btn--sm"
                onClick={() => setViewPanelModalSite(null)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default RescoInstallationDetails;
