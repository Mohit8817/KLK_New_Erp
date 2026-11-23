import { useState, useMemo, useEffect, useCallback, useRef, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import { getMediaUrl, getUpMediaCandidates } from '../../up-services';
import { UP_MODAL_CSS, DetailSectionCard, AttachmentCardGrid } from './UpComplaintModalUI';
import {
  Pagination,
  usePagination,
  SearchInput,
  TableExportToolbar,
  TableEmptyState,
  copyTableDataToClipboard,
  exportDataToCSV,
  exportDataToExcel,
  printTableData,
  type ExportColumn,
} from '../../../../../common';

export const DASH = '—';

/* ───────── Helpers ───────── */
const asRec = (row: unknown): Record<string, any> => row as Record<string, any>;

/** First non-empty value among keys, else fallback (default DASH). Trims string values and ignores null/undefined/'null'/'undefined'. */
export const pick = (row: unknown, keys: string[], fallback: string = DASH): string => {
  const r = asRec(row);
  if (!r) return fallback;
  for (const k of keys) {
    const v = r[k];
    if (v !== null && v !== undefined && v !== '') {
      let s = String(v).trim();
      if ((s.startsWith("'") && s.endsWith("'")) || (s.startsWith('"') && s.endsWith('"'))) {
        s = s.slice(1, -1).trim();
      }
      if (s !== '' && s !== 'null' && s !== 'undefined') return s;
    }
  }
  return fallback;
};

type StatusKey = 'open' | 'pending' | 'resolved';

export const statusKey = (row: unknown): StatusKey => {
  const r = asRec(row);
  if (!r) return 'open';
  const s = String(r.complaint_status || r.status || '').toLowerCase().trim();
  const cs = String(r.close_status || '').toLowerCase().trim();
  const hasCloseDate = !!(
    (r.close_date && String(r.close_date).trim() !== '' && String(r.close_date).trim() !== 'null') ||
    (r.manual_close_date && String(r.manual_close_date).trim() !== '' && String(r.manual_close_date).trim() !== 'null') ||
    (r.close_complaint_date && String(r.close_complaint_date).trim() !== '' && String(r.close_complaint_date).trim() !== 'null')
  );
  if (s === '2' || s === 'closed' || s === 'resolved' || cs === '1' || cs === '2' || cs === 'closed' || hasCloseDate) {
    return 'resolved';
  }
  if (s === '1' || s === 'approved' || s === 'pending approval') return 'pending';
  return 'open';
};

const STATUS_META: Record<StatusKey, { label: string; tone: 'warning' | 'info' | 'success' }> = {
  open: { label: 'Open', tone: 'warning' },
  pending: { label: 'Pending Approval', tone: 'info' },
  resolved: { label: 'Resolved', tone: 'success' },
};

export const statusLabel = (row: unknown) => STATUS_META[statusKey(row)].label;

const hasAssignedValue = (v: unknown): boolean => {
  if (v === null || v === undefined) return false;
  const s = String(v).trim().toLowerCase();
  return (
    s !== '' &&
    s !== '0' &&
    s !== 'null' &&
    s !== 'undefined' &&
    s !== 'na' &&
    s !== 'n/a' &&
    s !== '-' &&
    s !== '—' &&
    s !== '0000-00-00' &&
    s !== '0000-00-00 00:00:00'
  );
};

export const isComplaintAssigned = (row: unknown): boolean => {
  const r = asRec(row);
  if (!r) return false;
  if (
    hasAssignedValue(r.assigned_to) ||
    hasAssignedValue(r.assign_to) ||
    hasAssignedValue(r.assigned_date) ||
    hasAssignedValue(r.assign_date) ||
    hasAssignedValue(r.assigned_vendor) ||
    hasAssignedValue(r.assign_vendor) ||
    Number(r.assign_status) === 1 ||
    Number(r.assigned_status) === 1
  ) {
    return true;
  }
  const sk = statusKey(r);
  return sk === 'resolved' || sk === 'pending';
};

export const StatusBadge = ({ row }: { row: unknown }) => {
  const m = STATUS_META[statusKey(row)];
  return <span className={`ax-badge ax-badge--soft ax-badge--${m.tone}`}>{m.label}</span>;
};

export const allDocUrlsOf = (row: unknown): { label: string; url: string; candidates: string[] }[] => {
  const r = asRec(row);
  if (!r) return [];
  const list: { label: string; url: string; candidates: string[] }[] = [];
  const add = (label: string, path?: string | null) => {
    if (path && typeof path === 'string') {
      const trimmed = path.trim();
      if (trimmed && trimmed !== 'null' && trimmed !== 'undefined' && trimmed !== 'NA') {
        const candidates = getUpMediaCandidates(trimmed);
        const url = candidates[0] || getMediaUrl(trimmed);
        if (url && !list.some((item) => item.url === url)) {
          list.push({ label, url, candidates: candidates.length ? candidates : [url] });
        }
      }
    }
  };
  add('File 1', r.file1);
  add('File 2', r.file2);
  add('Document', r.document);
  add('File', r.file);
  add('Resolution File 1', r.r_file1);
  add('Resolution File 2', r.r_file2);
  add('Resolution File', r.r_file);
  return list;
};

export const docUrlOf = (row: unknown): string => {
  const r = asRec(row);
  if (!r) return '';
  return getMediaUrl(r.file1 || r.document || r.file || r.file2 || r.r_file1 || r.r_file || r.r_file2) || '';
};

/* ───────── Column helpers ───────── */
export interface CellCtx {
  serial: number;
  openPreview: (url: string, title: string, candidates?: string[]) => void;
}

export interface ComplaintColumn<T> {
  header: string;
  cell: (row: T, ctx: CellCtx) => ReactNode;
  /** If omitted, the column is not part of the export. */
  exportValue?: (row: T, index: number) => string | number;
}

export function textCol<T>(
  header: string,
  keys: string[],
  opts: { strong?: boolean; accent?: boolean; fallback?: string; clamp?: boolean } = {}
): ComplaintColumn<T> {
  return {
    header,
    cell: (row) => {
      const v = pick(row, keys, opts.fallback ?? DASH);
      if (opts.clamp) {
        return (
          <span
            title={v === DASH ? '' : v}
            style={{ display: 'block', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {v}
          </span>
        );
      }
      if (opts.accent) return <b style={{ color: 'var(--ax-primary-default, #2563eb)' }}>{v}</b>;
      if (opts.strong) return <span style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>{v}</span>;
      return v;
    },
    exportValue: (row) => pick(row, keys, opts.fallback ?? DASH),
  };
}

export function statusCol<T>(header = 'Complaint Status'): ComplaintColumn<T> {
  return { header, cell: (row) => <StatusBadge row={row} />, exportValue: (row) => statusLabel(row) };
}

export function documentCol<T>(header = 'Document'): ComplaintColumn<T> {
  return {
    header,
    cell: (row, ctx) => {
      const docs = allDocUrlsOf(row);
      if (docs.length === 0) {
        return <span style={{ color: 'var(--ax-text-subtle)' }}>{DASH}</span>;
      }
      return (
        <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
          {docs.slice(0, 2).map((d, i) => (
            <DocThumb key={i} url={d.url} candidates={d.candidates} alt={d.label} onPreview={ctx.openPreview} />
          ))}
          {docs.length > 2 && (
            <span style={{ fontSize: 11, color: 'var(--ax-text-muted)', fontWeight: 600 }}>
              +{docs.length - 2}
            </span>
          )}
        </div>
      );
    },
    exportValue: (row) => {
      const docs = allDocUrlsOf(row);
      return docs.map((d) => d.url).join(', ') || DASH;
    },
  };
}

/* ───────── Modal (portal to <body>, focus trap, Esc to close) ───────── */
const X_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

const ICON_REFRESH = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
    <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
  </svg>
);

const ICON_PLUS = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </svg>
);

function Modal({
  open,
  onClose,
  labelledBy,
  dialogClass = '',
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  dialogClass?: string;
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
    <div className="ax-modal ax-modal--centered up-modal" role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
      <div className="ax-modal__backdrop" onClick={onClose} />
      <div ref={dialogRef} className={`ax-modal__dialog${dialogClass ? ' ' + dialogClass : ''}`}>
        {children}
      </div>
    </div>,
    document.body
  );
}

/* ───────── Image preview modal (zoom) ───────── */
const ZOOM_STEPS = [1, 1.5, 2, 3];

function ImagePreviewModal({
  url,
  candidates,
  title,
  onClose,
}: {
  url: string;
  candidates?: string[];
  title: string;
  onClose: () => void;
}) {
  const list = useMemo(() => {
    const arr = candidates && candidates.length > 0 ? candidates : url ? [url] : [];
    return url && !arr.includes(url) ? [url, ...arr] : arr;
  }, [url, candidates]);
  const [srcIdx, setSrcIdx] = useState(0);
  const [zoomIdx, setZoomIdx] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const zoom = ZOOM_STEPS[zoomIdx];
  const activeUrl = list[srcIdx] || url;

  useEffect(() => {
    setSrcIdx(0);
    setZoomIdx(0);
    setStatus('loading');
  }, [url, candidates]);

  return (
    <Modal open onClose={onClose} labelledBy="ula-preview-title" dialogClass="up-modal__dialog--preview">
      <div className="ax-modal__header">
        <div>
          <span className="up-modal__eyebrow">Media Preview</span>
          <h2 className="ax-modal__title" id="ula-preview-title">{title || 'Attached Document'}</h2>
        </div>
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
            key={activeUrl}
            src={activeUrl}
            alt={title || 'Preview'}
            onLoad={() => setStatus('ready')}
            onError={() => {
              if (srcIdx + 1 < list.length) {
                setSrcIdx((i) => i + 1);
              } else {
                setStatus('error');
              }
            }}
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
          <a href={activeUrl} target="_blank" rel="noreferrer" className="ax-btn ax-btn--ghost">Open in new tab ↗</a>
          <button type="button" className="ax-btn ax-btn--primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </Modal>
  );
}

/* ───────── Thumbnail (NO BORDER RADIUS) ───────── */
export function DocThumb({
  url,
  candidates,
  alt,
  onPreview,
  size = 34,
}: {
  url?: string | null;
  candidates?: string[];
  alt: string;
  onPreview: (url: string, title: string, candidates?: string[]) => void;
  size?: number;
}) {
  const list = useMemo(() => {
    const arr = candidates && candidates.length > 0 ? candidates : url ? [url] : [];
    return url && !arr.includes(url) ? [url, ...arr] : arr;
  }, [url, candidates]);
  const [idx, setIdx] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setIdx(0);
    setFailed(false);
  }, [url, candidates]);

  const activeUrl = list[idx];
  if (!activeUrl) return <span style={{ color: 'var(--ax-text-subtle)' }}>{DASH}</span>;

  if (failed) {
    return (
      <a
        href={list[0]}
        target="_blank"
        rel="noreferrer"
        onClick={(e) => e.stopPropagation()}
        title={`${alt} — open file`}
        style={{
          width: size,
          height: size,
          borderRadius: 0,
          border: '1px solid var(--ax-border, #cbd5e1)',
          background: 'var(--ax-surface-subtle, #f1f5f9)',
          color: 'var(--ax-primary-default, #2563eb)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          textDecoration: 'none',
        }}
      >
        <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      </a>
    );
  }

  return (
    <img
      src={activeUrl}
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
        if (idx + 1 < list.length) {
          setIdx((i) => i + 1);
        } else {
          setFailed(true);
        }
      }}
      onClick={() => onPreview(activeUrl, alt, list)}
      title="Click to preview"
    />
  );
}

/* ───────── Row action dropdown (menu rendered in <body>) ───────── */
const MENU_W = 148;

function LockedAssignedBadge() {
  return (
    <span
      className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--pill"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '4px 10px',
        fontSize: 11.5,
        fontWeight: 600,
        color: 'var(--ax-text-muted, #64748b)',
        background: 'var(--ax-surface-subtle, #f1f5f9)',
        border: '1px solid var(--ax-border, #cbd5e1)',
        cursor: 'not-allowed',
        userSelect: 'none',
      }}
      title="Complaint assigned — edit/delete locked"
    >
      <svg
        viewBox="0 0 24 24"
        width={12}
        height={12}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      </svg>
      <span>Assigned</span>
    </span>
  );
}

function RowActionDropdown({
  onEdit,
  onDelete,
}: {
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const visibleCount = (onEdit ? 1 : 0) + (onDelete ? 1 : 0);
  const menuH = Math.max(1, visibleCount) * 36 + 12;

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
          <div ref={menuRef} className="ula-menu" role="menu" style={{ top: pos.top, left: pos.left, width: MENU_W }}>
            {onEdit && (
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
                <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ color: '#2563eb', flexShrink: 0 }} aria-hidden="true">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                <span>Edit</span>
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                className="ula-menu__item ula-menu__item--danger"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  onDelete();
                }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ax-danger, #dc2626)' }}
              >
                <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--ax-danger, #dc2626)', flexShrink: 0 }} aria-hidden="true">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6" />
                  <path d="M14 11v6" />
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
                <span>Delete</span>
              </button>
            )}
          </div>,
          document.body
        )}
    </>
  );
}

/* ───────── CSS (same as ULA View Installation + Unified Vendor Modal) ───────── */
const OVERLAY_CSS = `
  ${UP_MODAL_CSS}
  .ax-modal img { border-radius: 0 !important; }
  .up-modal .up-drop-preview,
  .up-modal .view-card img { border-radius: 6px !important; }

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

  .ula-m-info {
    display: flex; flex-wrap: wrap; gap: 4px 16px; padding: 8px 12px; font-size: 12px;
    background: var(--ax-surface-subtle, #f8fafc); border: 1px solid var(--ax-border, #e2e8f0);
  }
  .ula-m-info span { color: var(--ax-text-muted, #64748b); }
  .ula-m-info b { color: var(--ax-text-strong, #0f172a); font-weight: 600; }

  .ula-m-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px 20px; }
  .ula-m-field__label { font-size: 11px; color: var(--ax-text-muted, #64748b); margin-bottom: 2px; }
  .ula-m-field__value { font-size: 13px; color: var(--ax-text-strong, #0f172a); font-weight: 500; overflow-wrap: anywhere; }
  .ula-m-desc {
    padding: 12px; font-size: 13px; line-height: 1.5; white-space: pre-wrap;
    background: var(--ax-surface-subtle, #f8fafc); border: 1px solid var(--ax-border, #e2e8f0);
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
  .ula-menu__item--danger:hover, .ula-menu__item--danger:focus-visible { background: #fef2f2; outline: none; }
  .up-comp-row-clickable { cursor: pointer; }
  .up-edit-field { display: flex; flex-direction: column; gap: 5px; }
  .up-edit-label { font-size: 12px; font-weight: 600; color: var(--ax-text-strong, #1e293b); }
  .up-edit-req { color: #ef4444; margin-left: 2px; }

  @media (max-width: 560px) {
    .ula-m-stage { height: 56vh; }
    .ula-m-grid { grid-template-columns: minmax(0, 1fr); }
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
  .solar-erp-page .ax-card img {
    border-radius: 0 !important;
  }

  .solar-erp-page .ax-card__header {
    display: flex; flex-wrap: nowrap; align-items: flex-start; justify-content: space-between; gap: 12px;
  }
  .solar-erp-page .ax-card__titles { flex: 1 1 220px; min-width: 220px; max-width: 100%; }
  .solar-erp-page .ax-card__title,
  .solar-erp-page .ax-card__eyebrow,
  .solar-erp-page .ax-card__subtitle {
    max-width: none; word-break: normal; overflow-wrap: normal; hyphens: none;
  }
  .solar-erp-page .ax-card__subtitle { line-height: 1.45; }

  .solar-erp-page .ax-card__actions {
    flex: 0 1 auto; min-width: 0; margin-left: auto;
    display: flex; align-items: center; justify-content: flex-end; flex-wrap: nowrap; gap: 8px;
  }
  .solar-erp-page .ax-card__actions .ax-cluster {
    flex-wrap: nowrap !important; min-width: 0; justify-content: flex-end;
  }
  .solar-erp-page .ax-card__actions .ax-search,
  .solar-erp-page .ax-card__actions [class*="search"] {
    flex: 1 1 140px; min-width: 200px; max-width: 240px;
  }
  .solar-erp-page .ax-card__actions input { min-width: 0; width: 100%; }
  .solar-erp-page .ax-card__actions .ax-export-toolbar,
  .solar-erp-page .ax-card__actions [class*="export-toolbar"] {
    flex: 0 1 auto; min-width: 0; flex-wrap: nowrap; gap: 4px;
  }
  .solar-erp-page .ax-export-toolbar__button { padding-inline: 8px !important; min-width: 0; }

  .solar-erp-page .ax-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }

  @media (max-width: 1100px) {
    .solar-erp-page .ax-export-toolbar__button {
      font-size: 0; gap: 0; padding: 0 8px !important; justify-content: center;
    }
    .solar-erp-page .ax-export-toolbar__button svg { width: 16px; height: 16px; flex-shrink: 0; }
    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] { max-width: 180px; }
  }

  @media (max-width: 760px) {
    .solar-erp-page .ax-card__header { flex-direction: column; flex-wrap: nowrap; align-items: stretch; gap: 10px; }
    .solar-erp-page .ax-card__titles { flex: 0 0 auto; min-width: 0; width: 100%; max-width: 100%; }
    .solar-erp-page .ax-card__title {
      font-family: var(--ax-font-display); font-size: var(--ax-text-md); line-height: var(--ax-leading-md);
    }
    .solar-erp-page .ax-card__actions {
      flex: 0 0 auto; width: 100%; margin-left: 0; flex-wrap: wrap; justify-content: flex-start;
    }
    .solar-erp-page .ax-card__actions .ax-cluster {
      flex-wrap: wrap !important; width: 100%; justify-content: flex-start; gap: 8px;
    }
    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] {
      flex: 1 1 100%; width: 100%; max-width: 100%; min-width: 0;
    }
    .solar-erp-page .ax-card__actions .ax-export-toolbar,
    .solar-erp-page .ax-card__actions [class*="export-toolbar"] {
      flex: 1 1 100%; flex-wrap: wrap; justify-content: flex-start; gap: 6px;
    }
    .solar-erp-page .ax-export-toolbar__button { font-size: 12px; gap: 4px; height: 30px; padding: 0 8px !important; }
  }

  @media (max-width: 490px) {
    .solar-erp-page .ax-export-toolbar__button { font-size: 11px; height: 28px; padding: 0 6px !important; }
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

/* ───────── Generic page ───────── */
export interface DetailField {
  label: string;
  value: ReactNode;
}

export interface ComplaintViewProps<T extends object> {
  title: string;
  subtitle: string;
  breadcrumbs: { label: string; href?: string }[];
  addLink: string;
  addLabel: string;
  cardTitle: string;
  searchPlaceholder?: string;
  loadingText: string;
  emptyMessage: string;
  fetchData: () => Promise<T[]>;
  /** Delete complaint handler */
  onDeleteComplaint?: (
    id: number | string,
    row: T
  ) => Promise<{ status: boolean; message: string }>;
  columns: ComplaintColumn<T>[];
  /** Values searched by the search box. */
  searchFields: (row: T) => unknown[];
  detailEyebrow: string;
  detailFields: (row: T) => DetailField[];
  exportName: string;
  exportTitle: string;
}

export function ComplaintViewPage<T extends object>(props: ComplaintViewProps<T>) {
  const {
    title, subtitle, breadcrumbs, addLink, addLabel, cardTitle, loadingText, emptyMessage,
    onDeleteComplaint,
    columns, searchFields, detailEyebrow, detailFields, exportName, exportTitle,
  } = props;

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<T[]>([]);
  const [search, setSearch] = useState(() => searchParams.get('search') || '');
  const [selectedDistrict, setSelectedDistrict] = useState(() => searchParams.get('district') || 'All');
  const [selectedStatus, setSelectedStatus] = useState(() => {
    const s = searchParams.get('status');
    if (!s) return 'All';
    const lower = s.toLowerCase().trim();
    if (lower === 'all' || lower === 'total') return 'All';
    if (lower === 'open' || lower === '0') return 'Open';
    if (lower === 'pending' || lower === '1') return 'Pending';
    if (lower === 'resolved' || lower === 'closed' || lower === '2') return 'Resolved';
    return s;
  });

  const [preview, setPreview] = useState<{ url: string; title: string; candidates?: string[] } | null>(null);
  const openPreview = useCallback((url: string, t: string, candidates?: string[]) => setPreview({ url, title: t, candidates }), []);
  const closePreview = useCallback(() => setPreview(null), []);

  const [detailRow, setDetailRow] = useState<T | null>(null);
  const closeDetail = useCallback(() => setDetailRow(null), []);

  // Delete Confirmation Modal State
  const [deleteRow, setDeleteRow] = useState<T | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);
  useEffect(() => {
    if (!toastMsg) return;
    const t = window.setTimeout(() => setToastMsg(null), 4000);
    return () => window.clearTimeout(t);
  }, [toastMsg]);

  // Keep latest fetcher without re-triggering the load effect.
  const fetchRef = useRef(props.fetchData);
  fetchRef.current = props.fetchData;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchRef.current();
      setRows(data || []);
    } catch (err: any) {
      console.error(`[${exportName}] Error loading complaints:`, err);
      setRows([]);
      setToastMsg({ type: 'danger', text: err?.message || 'Failed to load complaints.' });
    } finally {
      setLoading(false);
    }
  }, [exportName]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const districtList = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => {
      const rec = asRec(r);
      const d = rec.district || rec.district_name || rec.d_name;
      if (d) {
        const str = String(d).trim();
        if (str && str !== 'null' && str !== 'undefined') set.add(str);
      }
    });
    return Array.from(set).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (selectedDistrict !== 'All') {
        const rec = asRec(r);
        const rowDist = String(rec.district || rec.district_name || rec.d_name || '').trim().toLowerCase();
        if (rowDist !== selectedDistrict.trim().toLowerCase()) return false;
      }
      if (selectedStatus !== 'All') {
        const s = selectedStatus.toLowerCase().trim();
        const want = (s === 'open' || s === '0') ? 'open' : (s === 'pending' || s === '1') ? 'pending' : 'resolved';
        if (statusKey(r) !== want) return false;
      }
      if (!q) return true;
      return searchFields(r).some((v) => String(v ?? '').toLowerCase().includes(q));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, search, selectedDistrict, selectedStatus]);

  const { paginatedData, currentPage, pageSize, totalItems, setPage, setPageSize } =
    usePagination({ data: filtered, initialPageSize: 100 });

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

  const getRowId = (r: T): number | string => {
    const rec = asRec(r);
    return rec?.id ?? rec?.complaint_id ?? '';
  };

  const getRowSubject = (r: T): string =>
    pick(r, ['site_name', 'beneficiary_name', 'farmer_name', 'f_name', 'customer_name', 'name']);

  const handleRowClick = useCallback((e: ReactMouseEvent<HTMLTableRowElement>, row: T) => {
    const target = e.target as HTMLElement;
    if (target.closest('button, a, input, select, textarea, img')) return;
    setDetailRow(row);
  }, []);

  const handleOpenEdit = useCallback(
    (row: T) => {
      if (isComplaintAssigned(row)) return;
      const id = getRowId(row);
      if (id === '') return;
      const sep = addLink.includes('?') ? '&' : '?';
      navigate(`${addLink}${sep}edit=${encodeURIComponent(String(id))}`, {
        state: { editComplaint: row },
      });
    },
    [addLink, navigate]
  );

  const handleOpenDelete = useCallback((row: T) => {
    if (isComplaintAssigned(row)) return;
    setDeleteRow(row);
    setDeleteError(null);
  }, []);

  const handleConfirmDelete = async () => {
    if (!deleteRow || !onDeleteComplaint) return;
    const id = getRowId(deleteRow);
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await onDeleteComplaint(id, deleteRow);
      if (res.status) {
        setToastMsg({ type: 'success', text: res.message || 'Complaint deleted successfully.' });
        setRows((prev) => prev.filter((r) => getRowId(r) !== id));
        if (detailRow && getRowId(detailRow) === id) setDetailRow(null);
        setDeleteRow(null);
        loadData();
      } else {
        setDeleteError(res.message || 'Failed to delete complaint.');
      }
    } catch (err: any) {
      setDeleteError(err?.message || 'Server error deleting complaint.');
    } finally {
      setDeleting(false);
    }
  };

  const exportCols: ExportColumn<T>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r: T, i: number) => i + 1 },
      ...columns
        .filter((c) => c.exportValue)
        .map((c) => ({ header: c.header, accessor: (r: T, i: number) => c.exportValue!(r, i) })),
    ] as ExportColumn<T>[],
    [columns]
  );

  const stamp = new Date().toISOString().slice(0, 10);
  const TOTAL_COLUMNS = columns.length + 2;

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title={title}
        subtitle={subtitle}
        breadcrumbs={breadcrumbs}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)' }}>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={loadData} disabled={loading}>
              {ICON_REFRESH}
              <span className="ax-btn__label">Refresh</span>
            </button>
            <Link to={addLink} className="ax-btn ax-btn--primary ax-btn--sm">
              {ICON_PLUS}
              <span className="ax-btn__label">{addLabel}</span>
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

      <div className="ax-dash-grid">
        {/* ── Main Table Card ── */}
        <section className="ax-card ax-col--12" role="region" aria-label={cardTitle}>
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">{cardTitle}</h2>
              <p className="ax-card__subtitle">
                <span className="ax-num">{filtered.length}</span> complaints found.
              </p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                <select
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

                <select
                  className="ax-input ax-input--sm"
                  style={{ width: 150, height: 32, fontSize: 'var(--ax-text-xs)' }}
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    setPage(1);
                  }}
                  aria-label="Filter by complaint status"
                >
                  <option value="All">All Status</option>
                  <option value="Open">Open</option>
                  <option value="Pending">Pending Approval</option>
                  <option value="Resolved">Resolved</option>
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
                  placeholder={props.searchPlaceholder || 'Search ID, name, district, contact…'}
                  size="sm"
                  ariaLabel="Search complaints"
                />

                <TableExportToolbar
                  onCopy={() => copyTableDataToClipboard(filtered, exportCols)}
                  onExportCSV={() => exportDataToCSV(`${exportName}_${stamp}`, filtered, exportCols)}
                  onExportExcel={() => exportDataToExcel(`${exportName}_${stamp}`, filtered, exportCols)}
                  onExportPDF={() => printTableData(exportTitle, filtered, exportCols)}
                />
              </div>
            </div>
          </div>

          <div className="ax-table-wrap">
            <table
              className="ax-table ax-table--hover"
              style={{ whiteSpace: 'nowrap', minWidth: Math.max(1200, TOTAL_COLUMNS * 130) }}
            >
              <caption className="ax-visually-hidden">{cardTitle}</caption>
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">Sr. No.</th>
                  {columns.map((c) => (
                    <th key={c.header} className="ax-table__th" scope="col">{c.header}</th>
                  ))}
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody aria-busy={loading}>
                {loading && (
                  <tr>
                    <td className="ax-table__td" colSpan={TOTAL_COLUMNS} style={centerCell}>
                      <span className="ax-spinner" style={{ marginRight: 8 }} /> {loadingText}
                    </td>
                  </tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td className="ax-table__td" colSpan={TOTAL_COLUMNS} style={{ padding: 0 }}>
                      <TableEmptyState
                        title="No complaints found"
                        message={
                          hasFilters
                            ? 'No records match your filters or search. Try clearing your query.'
                            : emptyMessage
                        }
                        onClear={hasFilters ? resetFilters : undefined}
                        clearLabel="Clear filters"
                      />
                    </td>
                  </tr>
                )}
                {!loading &&
                  paginatedData.map((row, index) => {
                    const serial = (currentPage - 1) * pageSize + index + 1;
                    const key = pick(row, ['id', 'complaint_id'], String(serial));
                    const assigned = isComplaintAssigned(row);
                    return (
                      <tr
                        key={`${key}-${serial}`}
                        className="ax-table__row up-comp-row-clickable"
                        onClick={(e) => handleRowClick(e, row)}
                        title="Click row to view complaint details"
                      >
                        <td className="ax-table__td ax-num">{serial}</td>
                        {columns.map((c) => (
                          <td key={c.header} className="ax-table__td">
                            {c.cell(row, { serial, openPreview })}
                          </td>
                        ))}
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          {assigned ? (
                            <LockedAssignedBadge />
                          ) : (
                            <RowActionDropdown
                              onEdit={() => handleOpenEdit(row)}
                              onDelete={onDeleteComplaint ? () => handleOpenDelete(row) : undefined}
                            />
                          )}
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
                pageSizeOptions={[100, 200, 300]}
              />
            </div>
          </div>
        </section>
      </div>

      {/* ── Photo Preview Modal ── */}
      {preview && (
        <ImagePreviewModal
          url={preview.url}
          candidates={preview.candidates}
          title={preview.title}
          onClose={closePreview}
        />
      )}

      {/* ── Details Modal ── */}
      <Modal open={!!detailRow} onClose={closeDetail} labelledBy="up-complaint-detail-title">
        {detailRow && (
          <>
            <div className="ax-modal__header">
              <div>
                <span className="up-modal__eyebrow">{detailEyebrow}</span>
                <h2 className="ax-modal__title" id="up-complaint-detail-title">
                  Complaint {pick(detailRow, ['complaint_id', 'id'])}
                </h2>
                <p className="up-modal__sub">
                  Complete complaint record, site specifications and attached proof documents.
                </p>
              </div>
              <button type="button" className="ax-modal__close" onClick={closeDetail} aria-label="Close dialog">{X_ICON}</button>
            </div>

            <div className="ax-modal__body">
              <div className="view-modal-wrap">
                <div className="view-summary-strip">
                  <div className="view-summary-col">
                    <span className="view-summary-label">Complaint ID</span>
                    <span className="view-summary-value">#{pick(detailRow, ['complaint_id', 'id'])}</span>
                  </div>
                  <div className="view-summary-col">
                    <span className="view-summary-label">District</span>
                    <span className="view-summary-value">{pick(detailRow, ['district', 'district_name'])}</span>
                  </div>
                  <div className="view-summary-col">
                    <span className="view-summary-label">Complaint Date</span>
                    <span className="view-summary-value">{pick(detailRow, ['start_date', 'complaint_date', 'created_date', 'created_at'])}</span>
                  </div>
                  <div className="view-summary-col">
                    <span className="view-summary-label">Status</span>
                    <div><StatusBadge row={detailRow} /></div>
                  </div>
                </div>

                <DetailSectionCard
                  title="Complaint & Site Specifications"
                  tone="blue"
                  icon={
                    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <rect x="4" y="2" width="16" height="20" rx="2" />
                      <path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01" />
                    </svg>
                  }
                >
                  <div className="view-grid-3">
                    {detailFields(detailRow).map((f) => (
                      <div key={f.label} className="view-data-cell">
                        <span className="view-data-label">{f.label}</span>
                        <div className="view-data-value">{f.value}</div>
                      </div>
                    ))}
                  </div>
                </DetailSectionCard>

                <DetailSectionCard
                  title="Complaint Description & Attachments"
                  tone="purple"
                  icon={
                    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  }
                >
                  <div className="view-data-cell">
                    <span className="view-data-label" style={{ marginBottom: 4 }}>Detailed Problem Description</span>
                    <div className="view-desc-box">{pick(detailRow, ['complaint'])}</div>
                  </div>

                  <AttachmentCardGrid docs={allDocUrlsOf(detailRow)} onPreview={openPreview} />
                </DetailSectionCard>
              </div>
            </div>

            <div className="ax-modal__footer" style={{ justifyContent: 'space-between' }}>
              <div>
                {isComplaintAssigned(detailRow) ? (
                  <LockedAssignedBadge />
                ) : (
                  <div style={{ display: 'inline-flex', gap: 8 }}>
                    <button
                      type="button"
                      className="ax-btn ax-btn--secondary ax-btn--sm"
                      onClick={() => {
                        const target = detailRow;
                        closeDetail();
                        handleOpenEdit(target);
                      }}
                    >
                      Edit
                    </button>
                    {onDeleteComplaint && (
                      <button
                        type="button"
                        className="ax-btn ax-btn--ghost ax-btn--sm"
                        style={{ color: '#dc2626', borderColor: '#fecaca', background: '#fef2f2' }}
                        onClick={() => {
                          const target = detailRow;
                          closeDetail();
                          handleOpenDelete(target);
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
              <button type="button" className="ax-btn ax-btn--primary" onClick={closeDetail}>Close</button>
            </div>
          </>
        )}
      </Modal>

      {/* ── Delete Confirmation Modal ── */}
      <Modal
        open={!!deleteRow}
        onClose={() => { if (!deleting) setDeleteRow(null); }}
        labelledBy="up-complaint-delete-title"
        dialogClass="up-modal__dialog--compact"
      >
        {deleteRow && (
          <>
            <div className="ax-modal__header">
              <div>
                <span className="up-modal__eyebrow" style={{ color: '#dc2626' }}>Confirm Deletion</span>
                <h2 className="ax-modal__title" id="up-complaint-delete-title" style={{ color: '#0f172a' }}>
                  Delete Complaint #{pick(deleteRow, ['complaint_id', 'id'])}
                </h2>
                <p className="up-modal__sub">
                  This action permanently removes the complaint record and cannot be undone.
                </p>
              </div>
              <button
                type="button"
                className="ax-modal__close"
                onClick={() => setDeleteRow(null)}
                disabled={deleting}
                aria-label="Close dialog"
              >
                {X_ICON}
              </button>
            </div>

            <div className="ax-modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="assigned-overview-card">
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', marginBottom: 10 }}>
                  Complaint Information
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px 16px', fontSize: 12 }}>
                  <div><span style={{ color: '#64748b' }}>Complaint ID:</span> <b>#{pick(deleteRow, ['complaint_id', 'id'])}</b></div>
                  <div><span style={{ color: '#64748b' }}>District:</span> <b>{pick(deleteRow, ['district', 'district_name'])}</b></div>
                  <div><span style={{ color: '#64748b' }}>Site / Beneficiary:</span> <b>{getRowSubject(deleteRow)}</b></div>
                </div>
              </div>

              {deleteError && (
                <div className="ax-alert ax-alert--danger" role="alert">
                  <div className="ax-alert__content">
                    <p className="ax-alert__message" style={{ margin: 0 }}>{deleteError}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="ax-modal__footer">
              <button
                type="button"
                className="ax-btn ax-btn--ghost"
                onClick={() => setDeleteRow(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="ax-btn ax-btn--danger"
                onClick={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting…' : 'Delete Complaint'}
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}