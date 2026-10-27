import { useState, useMemo, useEffect, useCallback, useRef, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  biharSslInstallationService,
  getMediaUrl,
  type SslInstallationInspectionItem,
} from '../../bihar-services';
import {
  Pagination,
  usePagination,
  SearchInput,
  TableExportToolbar,
  TableEmptyState,
  KpiSkeleton,
  type ExportColumn,
} from '../../../../../common';

type Item = SslInstallationInspectionItem;

const BLUE_PRIMARY = '#2563eb';
const GREEN_EMERALD = '#10b981';
const AMBER_WARNING = '#f59e0b';
const DASH = '—';

/* ── Icons ── */
const svgProps = { width: 15, height: 15, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
const ICON_INSPECTION = (<svg {...svgProps}><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /><path d="m9 14 2 2 4-4" /></svg>);
const ICON_LIGHTS = (<svg {...svgProps}><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.3A7 7 0 0 0 12 2z" /></svg>);
const ICON_RUPEE = (<svg {...svgProps}><path d="M6 3h12M6 8h12M6 13l8.5 8M6 13h3a4 4 0 0 0 0-8" /></svg>);
const ICON_VERIFIED = (<svg {...svgProps}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></svg>);
const ICON_CLOCK = (<svg {...svgProps}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>);
const ICON_REFRESH = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
    <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
  </svg>
);
const ICON_PLUS = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 5l0 14" /><path d="M5 12l14 0" />
  </svg>
);
const X_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 6l-12 12" /><path d="M6 6l12 12" />
  </svg>
);

/* ── Helpers ── */
const num = (x: unknown) => (Number(x) || 0).toLocaleString('en-IN');
const cur = (x: unknown) => { const n = Number(x); return n > 0 ? `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : DASH; };
const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const isPaid = (v: unknown) => v === 1 || v === '1' || String(v).toLowerCase() === 'paid';
const isPdf = (u: string) => /\.pdf($|\?)/i.test(u);

const formatPanchayat = (val: unknown): string => {
  if (!val) return DASH;
  if (Array.isArray(val)) return val.join(', ');
  const str = String(val).trim();
  if (str.startsWith('[') && str.endsWith(']')) {
    try {
      const parsed = JSON.parse(str);
      if (Array.isArray(parsed)) return parsed.join(', ');
    } catch {
      /* keep raw */
    }
  }
  return str;
};

type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';
const Badge = ({ tone, children }: { tone: Tone; children: ReactNode }) => (
  <span className={`ax-badge ax-badge--soft ax-badge--${tone}`}>{children}</span>
);

/* ───────── Modal (portal to <body>, focus trap, Esc to close) ───────── */
function Modal({
  open, onClose, labelledBy, dialogClass = '', dialogStyle, closeOnBackdrop = true, children,
}: {
  open: boolean; onClose: () => void; labelledBy: string; dialogClass?: string;
  dialogStyle?: CSSProperties; closeOnBackdrop?: boolean; children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="ax-modal ax-modal--centered" role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
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
  useEffect(() => { setZoomIdx(0); setStatus('loading'); }, [url]);

  return (
    <Modal open onClose={onClose} labelledBy="ssi-preview-title" dialogClass="ax-modal__dialog--lg">
      <div className="ax-modal__header">
        <h2 className="ax-modal__title" id="ssi-preview-title">{title || 'File Preview'}</h2>
        <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">{X_ICON}</button>
      </div>
      <div className="ax-modal__body" style={{ padding: 0 }}>
        <div className="ssi-m-stage">
          {status === 'loading' && <div className="ssi-m-stage__msg"><span className="ax-spinner" /> Loading image…</div>}
          {status === 'error' && <div className="ssi-m-stage__msg">Image could not be loaded. Try opening it in a new tab.</div>}
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
        <div className="ssi-m-zoom" role="group" aria-label="Zoom">
          <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setZoomIdx((i) => Math.max(0, i - 1))} disabled={zoomIdx === 0} aria-label="Zoom out">−</button>
          <span className="ssi-m-zoom__val">{Math.round(zoom * 100)}%</span>
          <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setZoomIdx((i) => Math.min(ZOOM_STEPS.length - 1, i + 1))} disabled={zoomIdx === ZOOM_STEPS.length - 1} aria-label="Zoom in">+</button>
        </div>
        <div className="ssi-m-zoom">
          <a href={url} target="_blank" rel="noreferrer" className="ax-btn ax-btn--ghost">Open in new tab ↗</a>
          <button type="button" className="ax-btn ax-btn--primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </Modal>
  );
}

/* ── File cell: image thumbnail (no radius) or PDF link ── */
function FileCell({ path, onPreview }: { path?: string | null; onPreview: (url: string, title: string) => void }) {
  const url = path ? getMediaUrl(path) : '';
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [url]);

  if (!url) return <span style={{ color: 'var(--ax-text-subtle)' }}>{DASH}</span>;
  if (isPdf(url) || failed) {
    return <a href={url} target="_blank" rel="noreferrer" style={{ color: 'var(--ax-primary-default, #2563eb)', textDecoration: 'none' }}>Doc ↗</a>;
  }
  return (
    <img
      src={url}
      alt="Inspection file"
      style={{ width: 34, height: 34, borderRadius: 0, objectFit: 'cover', cursor: 'zoom-in', border: '1px solid var(--ax-border, #e2e8f0)', background: 'var(--ax-surface-subtle, #f8fafc)', display: 'block' }}
      onError={() => setFailed(true)}
      onClick={() => onPreview(url, 'Inspection file')}
      title="Click to preview"
    />
  );
}

/* ── Row Action Dropdown (rendered in <body> so the table never clips it) ── */
const MENU_W = 170;
const MENU_H = 84;
function RowActionDropdown({ onView, fileUrl }: { onView: () => void; fileUrl: string }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggle = () => {
    if (open) { setOpen(false); return; }
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
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
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
      <button type="button" ref={btnRef} className="ax-btn ax-btn--secondary ax-btn--sm ssi-action-btn" onClick={toggle} aria-haspopup="menu" aria-expanded={open}>
        <span>Action</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: 12, height: 12, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} aria-hidden="true">
          <path d="M6 9l6 6l6 -6" />
        </svg>
      </button>
      {open && pos &&
        createPortal(
          <div ref={menuRef} className="ssi-menu" role="menu" style={{ top: pos.top, left: pos.left, width: MENU_W }}>
            <button type="button" className="ssi-menu__item" role="menuitem" onClick={() => { setOpen(false); onView(); }}>
              View Details
            </button>
            {fileUrl ? (
              <a href={fileUrl} target="_blank" rel="noreferrer" className="ssi-menu__item" role="menuitem" onClick={() => setOpen(false)}>
                Open File ↗
              </a>
            ) : (
              <span className="ssi-menu__item" style={{ opacity: 0.5, cursor: 'default' }}>No File</span>
            )}
          </div>,
          document.body
        )}
    </>
  );
}

/* ───────── Overlay CSS (modals + dropdown; global because they render in <body>) ───────── */
const OVERLAY_CSS = `
  .ax-modal img { border-radius: 0 !important; }
  .ssi-m-stage { position: relative; display: flex; overflow: auto; height: min(66vh, 600px); background: var(--ax-surface-subtle, #f1f5f9); }
  .ssi-m-stage__msg { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 13px; color: var(--ax-text-muted, #64748b); text-align: center; padding: 16px; }
  .ssi-m-zoom { display: inline-flex; align-items: center; gap: 8px; }
  .ssi-m-zoom__val { min-width: 44px; text-align: center; font-size: 12px; color: var(--ax-text-muted, #64748b); }

  .ssi-m-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--ax-space-4, 16px); }
  .ssi-m-grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--ax-space-4, 16px); }
  .ssi-m-full { grid-column: 1 / -1; }
  .ssi-m-note { margin: 0; font-size: var(--ax-text-sm, 13px); color: var(--ax-text-muted, #64748b); }
  .ssi-m-cell { padding: 8px 12px; background: var(--ax-surface-subtle, #f8fafc); border: 1px solid var(--ax-border, #e2e8f0); }
  .ssi-m-cell span { display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--ax-text-muted, #64748b); }
  .ssi-m-cell b { display: block; margin-top: 2px; font-size: 13px; font-weight: 600; color: var(--ax-text-strong, #0f172a); word-break: break-word; }
  .ssi-pan-list { border: 1px solid var(--ax-border, #e2e8f0); max-height: 150px; overflow-y: auto; padding: 6px; display: flex; flex-direction: column; gap: 2px; }
  .ssi-pan-item { display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: 13px; cursor: pointer; padding: 5px 8px; }
  .ssi-pan-item.is-on { background: var(--ax-accent-wash, #eff6ff); }
  .ax-modal textarea.ax-input { resize: vertical; min-height: 84px; line-height: 1.45; }

  .ssi-action-btn { display: inline-flex; align-items: center; gap: 6px; height: 30px; padding: 0 12px; font-size: 12px; font-weight: 500; border-radius: 0; cursor: pointer; }
  .ssi-menu { position: fixed; z-index: 99999; box-sizing: border-box; display: flex; flex-direction: column; padding: 4px 0; text-align: left; background: var(--ax-surface-solid, #ffffff); border: 1px solid var(--ax-border, #e2e8f0); border-radius: 0; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.14), 0 8px 10px -6px rgba(0,0,0,0.08); }
  .ssi-menu__item { display: block; width: 100%; box-sizing: border-box; margin: 0; padding: 8px 14px; font: inherit; font-size: 12px; font-weight: 500; text-align: left; text-decoration: none; color: var(--ax-text, #0f172a); background: transparent; border: 0; border-radius: 0; cursor: pointer; }
  .ssi-menu__item:hover, .ssi-menu__item:focus-visible { background: var(--ax-surface-subtle, #f1f5f9); outline: none; }

  @media (max-width: 560px) {
    .ssi-m-grid, .ssi-m-grid3 { grid-template-columns: 1fr; }
    .ssi-m-stage { height: 56vh; }
  }
`;

/* ───────── Responsive page CSS ───────── */
const PAGE_CSS = `
  .solar-erp-page .ax-card { min-width: 0; }
  .solar-erp-page .ax-card__footer { width: 100%; box-sizing: border-box; }
  .solar-erp-page .ssi-pagination-left { width: 100%; display: flex; justify-content: flex-start; align-items: center; margin: 0; overflow-x: auto; }
  .solar-erp-page .ssi-pagination-left > * { margin-left: 0 !important; margin-right: 0 !important; }
  .solar-erp-page img, .solar-erp-page .ax-card img { border-radius: 0 !important; }

  .solar-erp-page .ax-card__header { display: flex; flex-wrap: nowrap; align-items: flex-start; justify-content: space-between; gap: 12px; }
  .solar-erp-page .ax-card__titles { flex: 1 1 220px; min-width: 220px; max-width: 100%; }
  .solar-erp-page .ax-card__title, .solar-erp-page .ax-card__eyebrow, .solar-erp-page .ax-card__subtitle { max-width: none; word-break: normal; overflow-wrap: normal; hyphens: none; }
  .solar-erp-page .ax-card__subtitle { line-height: 1.45; }
  .solar-erp-page .ax-card__actions { flex: 0 1 auto; min-width: 0; margin-left: auto; display: flex; align-items: center; justify-content: flex-end; flex-wrap: nowrap; gap: 8px; }
  .solar-erp-page .ax-card__actions .ax-cluster { flex-wrap: nowrap !important; min-width: 0; justify-content: flex-end; }
  .solar-erp-page .ax-card__actions .ax-search, .solar-erp-page .ax-card__actions [class*="search"] { flex: 1 1 140px; min-width: 200px; max-width: 240px; }
  .solar-erp-page .ax-card__actions input { min-width: 0; width: 100%; }
  .solar-erp-page .ax-card__actions .ax-export-toolbar, .solar-erp-page .ax-card__actions [class*="export-toolbar"] { flex: 0 1 auto; min-width: 0; flex-wrap: nowrap; gap: 4px; }
  .solar-erp-page .ax-export-toolbar__button { padding-inline: 8px !important; min-width: 0; }

  .solar-erp-page .ax-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .solar-erp-page .ssi-table--wide { min-width: 2400px; }
  .solar-erp-page .ssi-sticky-first th:first-child, .solar-erp-page .ssi-sticky-first td:first-child {
    position: sticky; left: 0; z-index: 2; background: var(--ax-bg-surface, #ffffff); box-shadow: 1px 0 0 var(--ax-border-subtle, #e2e8f0);
  }

  @media (max-width: 1100px) {
    .solar-erp-page .ax-export-toolbar__button { font-size: 0; gap: 0; padding: 0 8px !important; justify-content: center; }
    .solar-erp-page .ax-export-toolbar__button svg { width: 16px; height: 16px; flex-shrink: 0; }
    .solar-erp-page .ax-card__actions .ax-search, .solar-erp-page .ax-card__actions [class*="search"] { max-width: 180px; }
  }
  @media (max-width: 760px) {
    .solar-erp-page .ax-card__header { flex-direction: column; flex-wrap: nowrap; align-items: stretch; gap: 10px; }
    .solar-erp-page .ax-card__titles { flex: 0 0 auto; min-width: 0; width: 100%; max-width: 100%; }
    .solar-erp-page .ax-card__title { font-family: var(--ax-font-display); font-size: var(--ax-text-md); line-height: var(--ax-leading-md); }
    .solar-erp-page .ax-card__actions { flex: 0 0 auto; width: 100%; margin-left: 0; flex-wrap: wrap; justify-content: flex-start; }
    .solar-erp-page .ax-card__actions .ax-cluster { flex-wrap: wrap !important; width: 100%; justify-content: flex-start; gap: 8px; }
    .solar-erp-page .ax-card__actions .ax-search, .solar-erp-page .ax-card__actions [class*="search"] { flex: 1 1 100%; width: 100%; max-width: 100%; min-width: 0; }
    .solar-erp-page .ax-card__actions .ax-export-toolbar, .solar-erp-page .ax-card__actions [class*="export-toolbar"] { flex: 1 1 100%; flex-wrap: wrap; justify-content: flex-start; gap: 6px; }
    .solar-erp-page .ax-export-toolbar__button { font-size: 12px; gap: 4px; height: 30px; padding: 0 8px !important; }
  }
  @media (max-width: 490px) {
    .solar-erp-page .ax-export-toolbar__button { font-size: 11px; height: 28px; padding: 0 6px !important; }
    .solar-erp-page .ax-export-toolbar { gap: 4px; }
  }
`;

const actionsRowStyle = { gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', width: '100%' } as const;
const footerStyle = { borderTop: '1px solid var(--ax-border, #e2e8f0)', padding: 'var(--ax-space-3) var(--ax-space-4)', display: 'flex', justifyContent: 'flex-start', alignItems: 'center', width: '100%', boxSizing: 'border-box' } as const;
const centerCell = { textAlign: 'center', padding: 24 } as const;
const Req = () => <span style={{ color: 'var(--ax-danger-500)' }} aria-hidden="true">*</span>;
const truncCell = (w: number): CSSProperties => ({ maxWidth: w, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' });

/* ───────── Column definitions (drive table, column toggle and exports) ───────── */
interface Col {
  id: string;
  header: string;
  exportVal: (r: Item, idx: number) => string | number;
  render: (r: Item, idx: number, ctx: { onPreview: (u: string, t: string) => void }) => ReactNode;
  th?: CSSProperties;
  td?: CSSProperties;
  num?: boolean;
}

const COLS: Col[] = [
  { id: 'sr', header: 'Sr. No.', exportVal: (_r, i) => i + 1, render: (_r, i) => i + 1, td: undefined },
  { id: 'vendor', header: 'Vendor Name', exportVal: (r) => r.vendor_name || r.vendor || DASH,
    render: (r) => <span style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>{r.vendor_name || r.vendor || 'App Testing'}</span> },
  { id: 'state', header: 'State', exportVal: (r) => r.state || 'Bihar', render: (r) => <span style={{ textTransform: 'capitalize' }}>{r.state || 'Bihar'}</span> },
  { id: 'district', header: 'District', exportVal: (r) => r.district || '', render: (r) => <b>{r.district || DASH}</b> },
  { id: 'block', header: 'Block', exportVal: (r) => r.block || '', render: (r) => r.block || DASH },
  { id: 'panchayat', header: 'Panchayat', exportVal: (r) => formatPanchayat(r.panchayat),
    render: (r) => <span title={formatPanchayat(r.panchayat)}>{formatPanchayat(r.panchayat)}</span>, td: truncCell(200) },
  { id: 'date', header: 'Date', exportVal: (r) => r.date || '', render: (r) => r.date || DASH },
  { id: 'lights', header: 'No of Lights', exportVal: (r) => r.no_of_lights ?? '', num: true,
    render: (r) => <span style={{ color: BLUE_PRIMARY, fontWeight: 600 }}>{num(r.no_of_lights)}</span> },
  { id: 'amount', header: 'Amount', exportVal: (r) => Number(r.amount) > 0 ? cur(r.amount) : DASH, num: true,
    render: (r) => Number(r.amount) > 0 ? <span style={{ color: 'var(--ax-text-strong)', fontWeight: 600 }}>{cur(r.amount)}</span> : DASH },
  { id: 'remark', header: 'Inspection Remark', exportVal: (r) => r.remarks || r.inspection_remark || '',
    render: (r) => <span title={r.remarks || r.inspection_remark || ''}>{r.remarks || r.inspection_remark || DASH}</span>, td: truncCell(200) },
  { id: 'file', header: 'File', exportVal: (r) => (r.file ? getMediaUrl(r.file) : ''), render: (r, _i, ctx) => <FileCell path={r.file} onPreview={ctx.onPreview} /> },
  { id: 'inspection_status', header: 'Inspection Status', exportVal: (r) => (r.inspection_status === 1 ? 'Approved' : 'Pending'),
    render: (r) => <Badge tone={r.inspection_status === 1 ? 'success' : 'warning'}>{r.inspection_status === 1 ? 'Approved' : 'Pending'}</Badge> },
  { id: 'verify_status', header: 'Verify Status', exportVal: (r) => (r.verify_status === 1 ? 'Verified' : 'Pending'),
    render: (r) => <Badge tone={r.verify_status === 1 ? 'success' : 'neutral'}>{r.verify_status === 1 ? 'Verified' : 'Pending'}</Badge> },
  { id: 'verify_remarks', header: 'Verify Remarks', exportVal: (r) => r.verify_remarks || '',
    render: (r) => <span title={r.verify_remarks || ''}>{r.verify_remarks || DASH}</span>, td: truncCell(180) },
  { id: 'payment_date', header: 'Payment Date', exportVal: (r) => r.payment_date || '', render: (r) => r.payment_date || DASH },
  { id: 'payment_by', header: 'Payment By', exportVal: (r) => r.payment_by || '', render: (r) => r.payment_by || DASH },
  { id: 'payment_remark', header: 'Payment Remark', exportVal: (r) => r.payment_remark || '',
    render: (r) => <span title={r.payment_remark || ''}>{r.payment_remark || DASH}</span>, td: truncCell(180) },
  { id: 'payment_status', header: 'Payment Status', exportVal: (r) => String(r.payment_status ?? 'Pending'),
    render: (r) => <Badge tone={isPaid(r.payment_status) ? 'success' : 'warning'}>{r.payment_status || 'Pending'}</Badge> },
];

export function Bihar_Installation_SSL_InstallationInspection() {
  const [loading, setLoading] = useState(true);
  const [inspections, setInspections] = useState<Item[]>([]);
  const [eligibleDistricts, setEligibleDistricts] = useState<string[]>([]);

  const [search, setSearch] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);

  const [preview, setPreview] = useState<{ url: string; title: string } | null>(null);
  const openPreview = useCallback((url: string, title: string) => setPreview({ url, title }), []);
  const closePreview = useCallback(() => setPreview(null), []);

  const [detailItem, setDetailItem] = useState<Item | null>(null);
  const closeDetail = useCallback(() => setDetailItem(null), []);

  // Add modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addDistrict, setAddDistrict] = useState('');
  const [addBlock, setAddBlock] = useState('');
  const [availableBlocks, setAvailableBlocks] = useState<string[]>([]);
  const [blocksLoading, setBlocksLoading] = useState(false);
  const [availablePanchayats, setAvailablePanchayats] = useState<{ panchayat: string; count: number }[]>([]);
  const [panchayatsLoading, setPanchayatsLoading] = useState(false);
  const [selectedPanchayats, setSelectedPanchayats] = useState<string[]>([]);
  const [addDate, setAddDate] = useState(new Date().toISOString().slice(0, 10));
  const [addNoOfLights, setAddNoOfLights] = useState('');
  const [addAmount, setAddAmount] = useState('');
  const [addRemarks, setAddRemarks] = useState('');
  const [addFile, setAddFile] = useState<File | null>(null);
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const closeAdd = useCallback(() => { if (!addSubmitting) setAddModalOpen(false); }, [addSubmitting]);

  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);
  useEffect(() => {
    if (!toastMsg) return;
    const t = window.setTimeout(() => setToastMsg(null), 4000);
    return () => window.clearTimeout(t);
  }, [toastMsg]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await biharSslInstallationService.getViewInstallationInspection();
      setEligibleDistricts(Array.isArray(res.districts) ? res.districts : []);
      setInspections(Array.isArray(res.inspections) ? res.inspections : []);
    } catch (err) {
      console.error('[InstallationInspection] load error:', err);
      setInspections([]);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { loadData(); }, [loadData]);

  // District -> blocks
  useEffect(() => {
    if (!addDistrict) {
      setAvailableBlocks([]); setAddBlock(''); setAvailablePanchayats([]); setSelectedPanchayats([]);
      return;
    }
    let active = true;
    (async () => {
      setBlocksLoading(true);
      try {
        const blks = await biharSslInstallationService.fetchInspectionBlocks(addDistrict);
        if (active) { setAvailableBlocks(blks); setAddBlock(''); setAvailablePanchayats([]); setSelectedPanchayats([]); }
      } catch (err) {
        console.error('[Fetch Blocks] error:', err);
      } finally {
        if (active) setBlocksLoading(false);
      }
    })();
    return () => { active = false; };
  }, [addDistrict]);

  // Block -> panchayats
  useEffect(() => {
    if (!addDistrict || !addBlock) { setAvailablePanchayats([]); setSelectedPanchayats([]); return; }
    let active = true;
    (async () => {
      setPanchayatsLoading(true);
      try {
        const panchs = await biharSslInstallationService.fetchInspectionPanchayats(addBlock, addDistrict);
        if (active) { setAvailablePanchayats(panchs); setSelectedPanchayats([]); }
      } catch (err) {
        console.error('[Fetch Panchayats] error:', err);
      } finally {
        if (active) setPanchayatsLoading(false);
      }
    })();
    return () => { active = false; };
  }, [addDistrict, addBlock]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return inspections.filter((item) => {
      if (selectedDistrict !== 'All' && (item.district || '').toLowerCase() !== selectedDistrict.toLowerCase()) return false;
      if (selectedStatus === 'Verified' && item.verify_status !== 1) return false;
      if (selectedStatus === 'Pending' && item.verify_status === 1) return false;
      if (!q) return true;
      return (
        (item.vendor_name || '').toLowerCase().includes(q) ||
        (item.district || '').toLowerCase().includes(q) ||
        (item.block || '').toLowerCase().includes(q) ||
        formatPanchayat(item.panchayat).toLowerCase().includes(q) ||
        (item.remarks || '').toLowerCase().includes(q) ||
        String(item.no_of_lights).includes(q) ||
        String(item.amount).includes(q)
      );
    });
  }, [inspections, search, selectedDistrict, selectedStatus]);

  const metrics = useMemo(() => {
    let totalLights = 0, verifiedCount = 0;
    inspections.forEach((i) => {
      totalLights += Number(i.no_of_lights) || 0;
      if (i.inspection_status === 1 || i.verify_status === 1) verifiedCount++;
    });
    const pendingCount = Math.max(0, inspections.length - verifiedCount);
    return { totalCount: inspections.length, totalLights, verifiedCount, pendingCount };
  }, [inspections]);

  const { paginatedData, currentPage, pageSize, totalItems, setPage, setPageSize } =
    usePagination({ data: filtered, initialPageSize: 10 });

  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, selectedDistrict, selectedStatus]);

  const hasFilters = search.trim() !== '' || selectedDistrict !== 'All' || selectedStatus !== 'All';
  const resetFilters = () => { setSearch(''); setSelectedDistrict('All'); setSelectedStatus('All'); setPage(1); };

  const visibleCols = COLS.filter((c) => !hiddenColumns.includes(c.id));
  const toolbarColumns = COLS.map((c) => ({ key: c.id, label: c.header, visible: !hiddenColumns.includes(c.id) }));
  const toggleColumn = (key: string) =>
    setHiddenColumns((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  const activeCols: ExportColumn<Item>[] = visibleCols.map((c) => ({ header: c.header, accessor: (r: Item, i?: number) => c.exportVal(r, i ?? 0) }));
  const TOTAL_COLUMNS = visibleCols.length + 1;
  const stamp = new Date().toISOString().slice(0, 10);

  /* ── Add handlers ── */
  const handleOpenAdd = () => {
    setAddError(null);
    setAddDate(new Date().toISOString().slice(0, 10));
    setAddModalOpen(true);
  };
  const handleTogglePanchayat = (name: string) =>
    setSelectedPanchayats((prev) => (prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name]));

  const handleAddSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAddError(null);
    if (!addDistrict || !addBlock || selectedPanchayats.length === 0 || !addDate || !addNoOfLights || !addAmount) {
      setAddError('Please fill in all mandatory fields and select at least one Panchayat.');
      return;
    }
    if (!addFile) { setAddError('Please attach an inspection file.'); return; }

    setAddSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('district', addDistrict);
      fd.append('block', addBlock);
      selectedPanchayats.forEach((p) => fd.append('panchayat[]', p));
      fd.append('date', addDate);
      fd.append('no_of_lights', addNoOfLights);
      fd.append('amount', addAmount);
      if (addRemarks.trim()) fd.append('remarks', addRemarks.trim());
      fd.append('file', addFile);

      const res = await biharSslInstallationService.storeInstallationInspection(fd);
      setToastMsg({ type: 'success', text: res.message || 'Installation Inspection saved successfully!' });
      setAddModalOpen(false);
      setAddDistrict(''); setAddBlock(''); setSelectedPanchayats([]);
      setAddNoOfLights(''); setAddAmount(''); setAddRemarks(''); setAddFile(null);
      await loadData();
    } catch (err: any) {
      console.error('[Add Installation Inspection] error:', err);
      setAddError(err?.message || 'Failed to submit installation inspection.');
    } finally {
      setAddSubmitting(false);
    }
  };

  /* ── Export helpers ── */
  const getExportValue = (row: Item, column: ExportColumn<Item>, index: number) => {
    if (typeof column.accessor === 'function') return (column.accessor as any)(row, index);
    return (row as unknown as Record<string, unknown>)[column.accessor as string];
  };
  const esc = (v: unknown) => (v === null || v === undefined ? '' : String(v));

  const downloadTextFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = filename;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportToCSV = (list: Item[], columns: ExportColumn<Item>[], filename: string) => {
    if (!list.length || !columns.length) return;
    const out = [columns.map((c) => c.header), ...list.map((row, idx) => columns.map((c) => esc(getExportValue(row, c, idx))))];
    const csv = out.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(',')).join('\r\n');
    downloadTextFile(`\ufeff${csv}`, `${filename}.csv`, 'text/csv');
  };

  const copyToClipboard = async (list: Item[], columns: ExportColumn<Item>[]) => {
    if (!list.length || !columns.length) return;
    const t = [columns.map((c) => c.header).join('\t'), ...list.map((row, idx) => columns.map((c) => esc(getExportValue(row, c, idx))).join('\t'))].join('\n');
    try {
      await navigator.clipboard.writeText(t);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
    }
  };

  const exportToExcel = (list: Item[], columns: ExportColumn<Item>[], filename: string) => {
    if (!list.length || !columns.length) return;
    const tableHtml = `<table border="1"><thead><tr>${columns.map((c) => `<th>${escapeHtml(esc(c.header))}</th>`).join('')}</tr></thead><tbody>${list.map((row, idx) => `<tr>${columns.map((c) => `<td>${escapeHtml(esc(getExportValue(row, c, idx)))}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8" /></head><body>${tableHtml}</body></html>`;
    downloadTextFile(`\ufeff${html}`, `${filename}.xls`, 'application/vnd.ms-excel');
  };

  const exportToPDF = (list: Item[], columns: ExportColumn<Item>[], title: string) => {
    if (!list.length || !columns.length) return;
    const body = list.map((row, idx) => columns.map((c) => escapeHtml(esc(getExportValue(row, c, idx)))));
    const w = window.open('', '_blank', 'width=1200,height=800');
    if (!w) return;
    w.document.write(`<!doctype html><html><head><meta charset="UTF-8" /><title>${escapeHtml(title)}</title><style>
      *{box-sizing:border-box}body{font-family:Arial,sans-serif;padding:24px;color:#222}h1{font-size:20px;margin:0 0 16px}
      table{width:100%;border-collapse:collapse;font-size:10px}th,td{border:1px solid #d8dee6;padding:6px 6px;text-align:left;vertical-align:top}
      th{background:#f3f5f7;font-weight:700}@media print{body{padding:0}@page{size:landscape;margin:10mm}}
    </style></head><body><h1>${escapeHtml(title)}</h1><table><thead><tr>${columns.map((c) => `<th>${escapeHtml(esc(c.header))}</th>`).join('')}</tr></thead><tbody>${body.map((r) => `<tr>${r.map((v) => `<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table><script>window.onload=function(){window.print();};</script></body></html>`);
    w.document.close();
    w.focus();
  };

  const kpis = [
    { label: 'Total Inspections', value: num(metrics.totalCount), sub: 'Site inspection batches', icon: ICON_INSPECTION, color: BLUE_PRIMARY, bg: 'rgba(37, 99, 235, 0.12)' },
    { label: 'Total Inspected Lights', value: num(metrics.totalLights), sub: 'Verified installed light units', icon: ICON_LIGHTS, color: GREEN_EMERALD, bg: 'rgba(16, 185, 129, 0.14)' },
    { label: 'Verified Status', value: num(metrics.verifiedCount), sub: 'Approved field inspections', icon: ICON_VERIFIED, color: GREEN_EMERALD, bg: 'rgba(16, 185, 129, 0.14)' },
    { label: 'Pending Verification', value: num(metrics.pendingCount), sub: 'Awaiting inspection approval', icon: ICON_CLOCK, color: AMBER_WARNING, bg: 'rgba(245, 158, 11, 0.14)' },
  ];

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="View SSL Installation Inspection"
        subtitle="Verification and official inspection logs for installed Solar Street Lights in Bihar"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Bihar' },
          { label: 'Installation' },
          { label: 'SSL', href: '/v/ssl/installation-dashboard' },
          { label: 'Installation Inspection' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)' }}>
            <button type="button" className="ax-btn ax-btn--primary ax-btn--sm" onClick={handleOpenAdd}>
              {ICON_PLUS}
              <span className="ax-btn__label">Add Installation Inspection</span>
            </button>
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

      {/* ── KPI Row ── */}
      {loading ? (
        <KpiSkeleton count={4} />
      ) : (
        <div className="ax-dash-grid" style={{ marginBottom: 18 }}>
          {kpis.map((k) => (
            <div key={k.label} className="ax-card ax-col--3" style={{ padding: '14px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ width: 28, height: 28, background: k.bg, color: k.color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{k.icon}</span>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)', letterSpacing: '0.04em' }}>{k.label}</span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: k.color, marginTop: 4 }}>{k.value}</div>
              <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>{k.sub}</div>
            </div>
          ))}
        </div>
      )}

      <div className="ax-dash-grid">
        {/* ── Main Table Card ── */}
        <section className="ax-card ax-col--12" role="region" aria-label="SSL Installation Inspection Records">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">View Installation Inspection Records</h2>
              <p className="ax-card__subtitle">
                <span className="ax-num">{filtered.length}</span> inspections found.
              </p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                <select
                  id="ssi_dist_filter"
                  className="ax-input ax-input--sm"
                  style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                  value={selectedDistrict}
                  onChange={(e) => { setSelectedDistrict(e.target.value); setPage(1); }}
                  aria-label="Filter by district"
                >
                  <option value="All">All Districts</option>
                  {eligibleDistricts.map((d) => (<option key={d} value={d}>{d}</option>))}
                </select>

                <select
                  id="ssi_status_filter"
                  className="ax-input ax-input--sm"
                  style={{ width: 150, height: 32, fontSize: 'var(--ax-text-xs)' }}
                  value={selectedStatus}
                  onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
                  aria-label="Filter by verify status"
                >
                  <option value="All">All Status</option>
                  <option value="Verified">Verified ({metrics.verifiedCount})</option>
                  <option value="Pending">Pending ({metrics.totalCount - metrics.verifiedCount})</option>
                </select>

                {hasFilters && (
                  <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" onClick={resetFilters} style={{ height: 30, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }}>
                    Reset
                  </button>
                )}

                <SearchInput
                  value={search}
                  onChange={setSearch}
                  placeholder="Search vendor, block, district…"
                  size="sm"
                  ariaLabel="Search inspection records"
                />

                <TableExportToolbar
                  onCopy={() => copyToClipboard(filtered, activeCols)}
                  onExportCSV={() => exportToCSV(filtered, activeCols, `Bihar_SSL_Installation_Inspection_${stamp}`)}
                  onExportExcel={() => exportToExcel(filtered, activeCols, `Bihar_SSL_Installation_Inspection_${stamp}`)}
                  onExportPDF={() => exportToPDF(filtered, activeCols, 'Bihar SSL Installation Inspection')}
                
                />
              </div>
            </div>
          </div>

          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover ssi-table--wide ssi-sticky-first" style={{ whiteSpace: 'nowrap' }}>
              <caption className="ax-visually-hidden">SSL Installation Inspection Records</caption>
              <thead className="ax-table__head">
                <tr>
                  {visibleCols.map((c) => (
                    <th key={c.id} className={`ax-table__th${c.num ? ' ax-table__th--num' : ''}`} scope="col" style={c.th}>{c.header}</th>
                  ))}
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody aria-busy={loading}>
                {loading && (
                  <tr>
                    <td className="ax-table__td" colSpan={TOTAL_COLUMNS} style={centerCell}>
                      <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading inspection records…
                    </td>
                  </tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td className="ax-table__td" colSpan={TOTAL_COLUMNS} style={{ padding: 0 }}>
                      <TableEmptyState
                        title="No installation inspections found"
                        message={hasFilters ? 'No records match your filters or search. Try clearing your query.' : 'Inspection records will appear here once they are added.'}
                        onClear={hasFilters ? resetFilters : undefined}
                        clearLabel="Clear filters"
                      />
                    </td>
                  </tr>
                )}
                {!loading &&
                  paginatedData.map((r, index) => {
                    const absIdx = (currentPage - 1) * pageSize + index;
                    return (
                      <tr key={r.id ?? absIdx} className="ax-table__row">
                        {visibleCols.map((c) => (
                          <td
                            key={c.id}
                            className={`ax-table__td${c.num ? ' ax-table__td--num' : ''}${c.id === 'sr' ? ' ax-num' : ''}`}
                            style={c.td}
                          >
                            {c.render(r, absIdx, { onPreview: openPreview })}
                          </td>
                        ))}
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <RowActionDropdown onView={() => setDetailItem(r)} fileUrl={r.file ? getMediaUrl(r.file) : ''} />
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          <div className="ax-card__footer" style={footerStyle}>
            <div className="ssi-pagination-left">
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

      {/* ── Image Preview ── */}
      {preview && <ImagePreviewModal url={preview.url} title={preview.title} onClose={closePreview} />}

      {/* ── View Details Modal ── */}
      <Modal open={!!detailItem} onClose={closeDetail} labelledBy="ssi-detail-title" dialogClass="ax-modal__dialog--lg">
        {detailItem && (
          <>
            <div className="ax-modal__header">
              <h2 className="ax-modal__title" id="ssi-detail-title">Installation Inspection Details (#{detailItem.id})</h2>
              <button type="button" className="ax-modal__close" onClick={closeDetail} aria-label="Close dialog">{X_ICON}</button>
            </div>
            <div className="ax-modal__body">
              <div className="ssi-m-grid">
                {[
                  { label: 'Vendor Name', val: detailItem.vendor_name || detailItem.vendor },
                  { label: 'State', val: detailItem.state },
                  { label: 'District / Block', val: `${detailItem.district || ''} / ${detailItem.block || ''}` },
                  { label: 'Panchayat(s)', val: formatPanchayat(detailItem.panchayat) },
                  { label: 'Inspection Date', val: detailItem.date },
                  { label: 'Number of Lights', val: num(detailItem.no_of_lights) },
                  { label: 'Amount', val: cur(detailItem.amount) },
                  { label: 'Inspection Remark', val: detailItem.remarks || detailItem.inspection_remark },
                  { label: 'Payment Date', val: detailItem.payment_date },
                  { label: 'Payment By', val: detailItem.payment_by },
                  { label: 'Payment Amount', val: detailItem.payment_status ? cur(detailItem.amount) : DASH },
                  { label: 'Payment Remark', val: detailItem.payment_remark },
                ].map((it, i) => (
                  <div key={i} className="ssi-m-cell">
                    <span>{it.label}</span>
                    <b>{it.val || DASH}</b>
                  </div>
                ))}
              </div>
            </div>
            <div className="ax-modal__footer">
              <button type="button" className="ax-btn ax-btn--primary" onClick={closeDetail}>Close</button>
            </div>
          </>
        )}
      </Modal>

      {/* ── Add Installation Inspection Modal ── */}
      <Modal open={addModalOpen} onClose={closeAdd} labelledBy="ssi-add-title" dialogClass="ax-modal__dialog--lg">
        <form onSubmit={handleAddSubmit}>
          <div className="ax-modal__header">
            <h2 className="ax-modal__title" id="ssi-add-title">Add SSL Installation Inspection</h2>
            <button type="button" className="ax-modal__close" onClick={closeAdd} aria-label="Close dialog" disabled={addSubmitting}>{X_ICON}</button>
          </div>

          <div className="ax-modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-5)' }}>
            {addError && (
              <div className="ax-alert ax-alert--danger" role="alert">
                <div className="ax-alert__text">{addError}</div>
              </div>
            )}

            <p className="ssi-m-note">The field labels marked with * are required fields.</p>

            <div className="ssi-m-grid">
              <div className="ax-field">
                <label className="ax-label" htmlFor="ssi-a-dist">District <Req /></label>
                <select id="ssi-a-dist" className="ax-input" value={addDistrict} onChange={(e) => setAddDistrict(e.target.value)} required>
                  <option value="">-- Select District --</option>
                  {eligibleDistricts.map((d) => (<option key={d} value={d}>{d}</option>))}
                </select>
              </div>
              <div className="ax-field">
                <label className="ax-label" htmlFor="ssi-a-block">Block <Req /></label>
                <select id="ssi-a-block" className="ax-input" value={addBlock} onChange={(e) => setAddBlock(e.target.value)} required disabled={!addDistrict || blocksLoading}>
                  <option value="">{blocksLoading ? 'Loading blocks…' : '-- Select Block --'}</option>
                  {availableBlocks.map((b) => (<option key={b} value={b}>{b}</option>))}
                </select>
              </div>
            </div>

            <div className="ax-field">
              <label className="ax-label">Panchayat(s) <Req /></label>
              {panchayatsLoading ? (
                <div className="ssi-m-note"><span className="ax-spinner" style={{ marginRight: 8 }} /> Fetching panchayats…</div>
              ) : availablePanchayats.length === 0 ? (
                <div className="ssi-m-cell"><span style={{ textTransform: 'none', fontWeight: 500 }}>
                  {addBlock ? 'No panchayats available for this block.' : 'Please select District and Block first.'}
                </span></div>
              ) : (
                <div className="ssi-pan-list">
                  {availablePanchayats.map((p) => {
                    const on = selectedPanchayats.includes(p.panchayat);
                    return (
                      <label key={p.panchayat} className={`ssi-pan-item${on ? ' is-on' : ''}`}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                          <input type="checkbox" className="ax-checkbox" checked={on} onChange={() => handleTogglePanchayat(p.panchayat)} />
                          <span style={{ fontWeight: on ? 700 : 500, color: on ? BLUE_PRIMARY : 'inherit' }}>{p.panchayat}</span>
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--ax-text-muted)' }}>({p.count} lights)</span>
                      </label>
                    );
                  })}
                </div>
              )}
              {selectedPanchayats.length > 0 && (
                <span className="ax-help" style={{ color: BLUE_PRIMARY }}>Selected: {selectedPanchayats.join(', ')}</span>
              )}
            </div>

            <div className="ssi-m-grid3">
              <div className="ax-field">
                <label className="ax-label" htmlFor="ssi-a-date">Date <Req /></label>
                <input id="ssi-a-date" type="date" className="ax-input" value={addDate} onChange={(e) => setAddDate(e.target.value)} required />
              </div>
              <div className="ax-field">
                <label className="ax-label" htmlFor="ssi-a-lights">No. of Lights <Req /></label>
                <input id="ssi-a-lights" type="number" min="1" className="ax-input" placeholder="e.g. 20" value={addNoOfLights} onChange={(e) => setAddNoOfLights(e.target.value)} required />
              </div>
              <div className="ax-field">
                <label className="ax-label" htmlFor="ssi-a-amt">Amount (₹) <Req /></label>
                <input id="ssi-a-amt" type="number" step="0.01" min="0" className="ax-input" placeholder="e.g. 40000.00" value={addAmount} onChange={(e) => setAddAmount(e.target.value)} required />
              </div>
            </div>

            <div className="ax-field">
              <label className="ax-label" htmlFor="ssi-a-rem">Remarks (Optional)</label>
              <textarea id="ssi-a-rem" className="ax-input" rows={3} placeholder="Enter inspection remarks…" value={addRemarks} onChange={(e) => setAddRemarks(e.target.value)} />
            </div>

            <div className="ax-field">
              <label className="ax-label" htmlFor="ssi-a-file">Inspection File <Req /></label>
              <input id="ssi-a-file" type="file" accept=".pdf,image/*" className="ax-input" required onChange={(e) => setAddFile(e.target.files?.[0] || null)} />
              <span className="ax-help">Allowed: jpg, jpeg, png, webp, pdf (Max 5 MB)</span>
            </div>
          </div>

          <div className="ax-modal__footer">
            <button type="button" className="ax-btn ax-btn--ghost" onClick={closeAdd} disabled={addSubmitting}>Cancel</button>
            <button type="submit" className="ax-btn ax-btn--primary" disabled={addSubmitting}>
              {addSubmitting ? <span className="ax-spinner" /> : 'Save Inspection'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Bihar_Installation_SSL_InstallationInspection;