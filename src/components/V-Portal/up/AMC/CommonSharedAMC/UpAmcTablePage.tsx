import { useState, useMemo, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import { resolveUpMediaUrl } from '../../up-services';
export { resolveUpMediaUrl };

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
const asRec = (row: unknown): Record<string, any> => (row && typeof row === 'object' ? (row as Record<string, any>) : {});

/** First non-empty value among keys, else fallback (default DASH). */
export const pick = (row: unknown, keys: string[], fallback: string = DASH): string => {
  const r = asRec(row);
  for (const k of keys) {
    const v = r[k];
    if (v !== null && v !== undefined && v !== '') return String(v);
  }
  return fallback;
};

export type AmcStatusKey = 'pending' | 'verified' | 'rejected' | 'completed' | 'all';

export const amcStatusKey = (row: unknown): 'completed' | 'pending' | 'verified' | 'rejected' => {
  const r = asRec(row);
  const v = String(r.verify_status ?? r.amcverify_status ?? '').trim();
  if (v === '1') return 'verified';
  if (v === '2') return 'rejected';
  const s = String(r.amc_status ?? r.status ?? '').trim();
  if (s === '1' || s.toLowerCase() === 'completed') return 'completed';
  return 'pending';
};

export const AmcStatusBadge = ({ row }: { row: unknown }) => {
  const r = asRec(row);
  const v = String(r.verify_status ?? r.amcverify_status ?? '').trim();
  if (v === '1') {
    return <span className="ax-badge ax-badge--soft ax-badge--success">Verified</span>;
  }
  if (v === '2') {
    return <span className="ax-badge ax-badge--soft ax-badge--danger">Rejected</span>;
  }
  const s = String(r.amc_status ?? r.status ?? '').trim();
  if (s === '1' || s.toLowerCase() === 'completed') {
    return <span className="ax-badge ax-badge--soft ax-badge--info">Completed</span>;
  }
  return <span className="ax-badge ax-badge--soft ax-badge--warning">Pending</span>;
};

export const docUrlOf = (row: unknown): string => {
  const r = asRec(row);
  let raw = r.image1 || r.image || r.file || r.jmr_report || r.digital_signature;
  if (!raw && r.before_cleaning_photo) {
    try {
      const arr = typeof r.before_cleaning_photo === 'string' ? JSON.parse(r.before_cleaning_photo) : r.before_cleaning_photo;
      if (Array.isArray(arr) && arr.length > 0) raw = arr[0];
    } catch {}
  }
  if (!raw && r.after_cleaning_photo) {
    try {
      const arr = typeof r.after_cleaning_photo === 'string' ? JSON.parse(r.after_cleaning_photo) : r.after_cleaning_photo;
      if (Array.isArray(arr) && arr.length > 0) raw = arr[0];
    } catch {}
  }
  return raw ? resolveUpMediaUrl(raw) : '';
};

/* ───────── Column helpers ───────── */
export interface CellCtx {
  serial: number;
  openPreview: (url: string, title: string) => void;
}

export interface AmcColumn<T> {
  header: string;
  cell: (row: T, ctx: CellCtx) => ReactNode;
  exportValue?: (row: T, index: number) => string | number;
}

export function amcTextCol<T>(
  header: string,
  keys: string[],
  opts: { strong?: boolean; accent?: boolean; fallback?: string; clamp?: boolean } = {}
): AmcColumn<T> {
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

export function amcStatusCol<T>(header = 'AMC Status'): AmcColumn<T> {
  return {
    header,
    cell: (row) => <AmcStatusBadge row={row} />,
    exportValue: (row) => {
      const k = amcStatusKey(row);
      return k.toUpperCase();
    },
  };
}

export function amcMediaCol<T>(header = 'Media / Photo', getUrl?: (r: T) => string | null): AmcColumn<T> {
  return {
    header,
    cell: (row, ctx) => {
      const url = getUrl ? getUrl(row) : docUrlOf(row);
      return <DocThumb url={url ? resolveUpMediaUrl(url) : null} alt={header} onPreview={ctx.openPreview} />;
    },
  };
}

/* ───────── Modal ───────── */
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
    <div className="ax-modal ax-modal--centered" role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
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

function ImagePreviewModal({ url, title, onClose }: { url: string; title: string; onClose: () => void }) {
  const [zoomIdx, setZoomIdx] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const zoom = ZOOM_STEPS[zoomIdx];

  useEffect(() => {
    setZoomIdx(0);
    setStatus('loading');
  }, [url]);

  return (
    <Modal open onClose={onClose} labelledBy="up-amc-preview-title" dialogClass="ax-modal__dialog--lg">
      <div className="ax-modal__header">
        <h2 className="ax-modal__title" id="up-amc-preview-title">{title || 'Media Preview'}</h2>
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

/* ───────── Thumbnail ───────── */
export function DocThumb({
  url,
  alt,
  onPreview,
  size = 34,
}: {
  url?: string | null;
  alt: string;
  onPreview: (url: string, title: string) => void;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [url]);

  if (!url || failed) return <span style={{ color: 'var(--ax-text-subtle)' }}>{DASH}</span>;

  return (
    <img
      src={url}
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
      onError={() => setFailed(true)}
      onClick={() => onPreview(url, alt)}
      title="Click to preview"
    />
  );
}

/* ───────── Row action dropdown ───────── */
const MENU_W = 180;
const MENU_H = 84;

function RowActionDropdown({
  docUrl,
  onView,
  extraAction,
}: {
  docUrl: string;
  onView: () => void;
  extraAction?: { label: string; onClick: () => void };
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
                onView();
              }}
            >
              View Details
            </button>
            {extraAction && (
              <button
                type="button"
                className="ula-menu__item"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  extraAction.onClick();
                }}
              >
                {extraAction.label}
              </button>
            )}
            {docUrl && (
              <a
                href={docUrl}
                target="_blank"
                rel="noreferrer"
                className="ula-menu__item"
                role="menuitem"
                onClick={() => setOpen(false)}
              >
                Open Media
              </a>
            )}
          </div>,
          document.body
        )}
    </>
  );
}

/* ───────── CSS ───────── */
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

export interface DetailField {
  label: string;
  value: ReactNode;
}

export interface UpAmcViewProps<T extends object> {
  title: string;
  subtitle: string;
  breadcrumbs: { label: string; href?: string }[];
  addLink?: string;
  addLabel?: string;
  cardTitle: string;
  searchPlaceholder?: string;
  loadingText?: string;
  emptyMessage?: string;
  fetchData: () => Promise<T[]>;
  columns: AmcColumn<T>[];
  searchFields: (row: T) => unknown[];
  detailEyebrow?: string;
  detailTitle?: (row: T) => string;
  detailFields: (row: T) => DetailField[];
  exportName: string;
  exportTitle: string;
  statusOptions?: { label: string; value: string }[];
  filterStatus?: (row: T, selectedStatus: string) => boolean;
}

export function UpAmcTablePage<T extends object>(props: UpAmcViewProps<T>) {
  const {
    title,
    subtitle,
    breadcrumbs,
    addLink,
    addLabel = 'Pending AMC',
    cardTitle,
    loadingText = 'Loading AMC records…',
    emptyMessage = 'No AMC records found.',
    columns,
    searchFields,
    detailEyebrow = 'AMC Record Details',
    detailTitle,
    detailFields,
    exportName,
    exportTitle,
    statusOptions,
    filterStatus,
  } = props;

  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<T[]>([]);
  const [search, setSearch] = useState(() => searchParams.get('search') || '');
  const [selectedDistrict, setSelectedDistrict] = useState(() => searchParams.get('district') || 'All');
  const [selectedStatus, setSelectedStatus] = useState(() => searchParams.get('status') || 'All');

  const [preview, setPreview] = useState<{ url: string; title: string } | null>(null);
  const openPreview = useCallback((url: string, t: string) => setPreview({ url, title: t }), []);
  const closePreview = useCallback(() => setPreview(null), []);

  const [detailRow, setDetailRow] = useState<T | null>(null);
  const closeDetail = useCallback(() => setDetailRow(null), []);

  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);
  useEffect(() => {
    if (!toastMsg) return;
    const t = window.setTimeout(() => setToastMsg(null), 4000);
    return () => window.clearTimeout(t);
  }, [toastMsg]);

  const fetchRef = useRef(props.fetchData);
  fetchRef.current = props.fetchData;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchRef.current();
      setRows(data || []);
    } catch (err: any) {
      console.error(`[${exportName}] Error loading AMC records:`, err);
      setRows([]);
      setToastMsg({ type: 'danger', text: err?.message || 'Failed to load AMC records.' });
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
      const d = rec.district || rec.f_district || rec.installation_dsitrict || rec?.resco?.district;
      if (d) set.add(String(d));
    });
    return Array.from(set).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const rec = asRec(r);
      const dist = rec.district || rec.f_district || rec.installation_dsitrict || rec?.resco?.district;
      if (selectedDistrict !== 'All' && String(dist).toLowerCase() !== selectedDistrict.toLowerCase()) return false;

      if (selectedStatus !== 'All') {
        if (filterStatus) {
          if (!filterStatus(r, selectedStatus)) return false;
        } else {
          const k = amcStatusKey(r);
          if (selectedStatus.toLowerCase() !== k.toLowerCase()) return false;
        }
      }

      if (!q) return true;
      return searchFields(r).some((v) => String(v ?? '').toLowerCase().includes(q));
    });
  }, [rows, search, selectedDistrict, selectedStatus, filterStatus, searchFields]);

  const { paginatedData, currentPage, pageSize, totalItems, setPage, setPageSize } =
    usePagination({ data: filtered, initialPageSize: 100 });

  useEffect(() => {
    setPage(1);
  }, [search, selectedDistrict, selectedStatus, setPage]);

  const hasFilters = search.trim() !== '' || selectedDistrict !== 'All' || selectedStatus !== 'All';
  const resetFilters = () => {
    setSearch('');
    setSelectedDistrict('All');
    setSelectedStatus('All');
    setPage(1);
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
            {addLink && (
              <Link to={addLink} className="ax-btn ax-btn--primary ax-btn--sm">
                {ICON_PLUS}
                <span className="ax-btn__label">{addLabel}</span>
              </Link>
            )}
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
                <span className="ax-num">{filtered.length}</span> records found.
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
                  aria-label="Filter by status"
                >
                  <option value="All">All Status</option>
                  {statusOptions ? (
                    statusOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))
                  ) : (
                    <>
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                      <option value="verified">Verified</option>
                      <option value="rejected">Rejected</option>
                    </>
                  )}
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
                  ariaLabel="Search records"
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
                        title="No records found"
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
                    const key = pick(row, ['id', 'site_id', 'ssl_id'], String(serial));
                    return (
                      <tr key={`${key}-${serial}`} className="ax-table__row">
                        <td className="ax-table__td ax-num">{serial}</td>
                        {columns.map((c) => (
                          <td key={c.header} className="ax-table__td">
                            {c.cell(row, { serial, openPreview })}
                          </td>
                        ))}
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <RowActionDropdown docUrl={docUrlOf(row)} onView={() => setDetailRow(row)} />
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
      {preview && <ImagePreviewModal url={preview.url} title={preview.title} onClose={closePreview} />}

      {/* ── Details Modal ── */}
      <Modal open={!!detailRow} onClose={closeDetail} labelledBy="up-amc-detail-title">
        {detailRow && (
          <>
            <div className="ax-modal__header">
              <div>
                <p className="ula-m-field__label" style={{ margin: 0 }}>{detailEyebrow}</p>
                <h2 className="ax-modal__title" id="up-amc-detail-title">
                  {detailTitle
                    ? detailTitle(detailRow)
                    : `Record #${pick(detailRow, ['id', 'site_id', 'assignment_id'])}`}
                </h2>
              </div>
              <button type="button" className="ax-modal__close" onClick={closeDetail} aria-label="Close dialog">{X_ICON}</button>
            </div>

            <div className="ax-modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-5)' }}>
              <div className="ula-m-info">
                <div><span>Status: </span><AmcStatusBadge row={detailRow} /></div>
                <div>
                  <span>District: </span>
                  <b>
                    {pick(
                      detailRow,
                      ['district', 'f_district', 'installation_dsitrict'],
                      asRec(detailRow)?.resco?.district || DASH
                    )}
                  </b>
                </div>
              </div>

              <div className="ula-m-grid">
                {detailFields(detailRow).map((f) => (
                  <div key={f.label}>
                    <div className="ula-m-field__label">{f.label}</div>
                    <div className="ula-m-field__value">{f.value}</div>
                  </div>
                ))}
              </div>

              {asRec(detailRow).remark || asRec(detailRow).amc_remark ? (
                <div>
                  <div className="ula-m-field__label" style={{ marginBottom: 4 }}>Remark</div>
                  <div className="ula-m-desc">
                    {String(asRec(detailRow).remark || asRec(detailRow).amc_remark)}
                  </div>
                </div>
              ) : null}

              {asRec(detailRow).complaint ? (
                <div>
                  <div className="ula-m-field__label" style={{ marginBottom: 4, color: 'var(--ax-danger, #ef4444)' }}>
                    Complaint Raised
                  </div>
                  <div className="ula-m-desc" style={{ borderColor: 'var(--ax-danger, #ef4444)' }}>
                    {String(asRec(detailRow).complaint)}
                  </div>
                </div>
              ) : null}

              {docUrlOf(detailRow) && (
                <div>
                  <div className="ula-m-field__label" style={{ marginBottom: 6 }}>Attached Document / Photo</div>
                  <DocThumb url={docUrlOf(detailRow)} alt="Media" onPreview={openPreview} size={96} />
                </div>
              )}
            </div>

            <div className="ax-modal__footer">
              <button type="button" className="ax-btn ax-btn--primary" onClick={closeDetail}>Close</button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
