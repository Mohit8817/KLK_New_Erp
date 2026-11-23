import { useState, useMemo, useEffect, useCallback, useRef, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  jammuRescoService,
  normalizeRescoStatus,
  type JammuRescoInstalledSiteItem,
} from '../../jammu-services';
import { getJammuMediaCandidates } from '../../jammu-services/jammuSrt70mwService';
import {
  Pagination,
  SearchInput,
  TableExportToolbar,
  TableEmptyState,
  usePagination,
  copyTableDataToClipboard,
  exportDataToCSV,
  exportDataToExcel,
  printTableData,
  type ExportColumn,
} from '../../../../../common';

const ICON_REFRESH = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
    <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
  </svg>
);

const X_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 16, height: 16 }}>
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

const DASH = '—';
const fmtTime = (d: Date) => d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();

/* ───────── Field helpers ───────── */
const pick = (row: any, ...keys: string[]): string => {
  for (const k of keys) {
    const v = row?.[k];
    if (v !== null && v !== undefined && v !== '') return String(v);
  }
  return '';
};

const pickNum = (row: any, ...keys: string[]): number => {
  for (const k of keys) {
    const v = row?.[k];
    if (v !== null && v !== undefined && v !== '') {
      const n = Number(v);
      return isNaN(n) ? 0 : n;
    }
  }
  return 0;
};

const ALIASES: Record<string, string[]> = {
  site_name: ['site_name', 'siteName', 'name', 'Site Name'],
  ca_no: ['ca_no', 'caNumber', 'cano', 'consumer_no', 'account_no'],
  department: ['department', 'dept_name', 'dept', 'division'],
  contact_person: ['contact_person', 'agency_contact_person', 'nodal_person', 'person_name', 'contact_name'],
  contact_number: ['contact_number', 'agency_contact_number', 'nodal_contact', 'contact_no', 'mobile', 'phone'],
  inverter_no: ['inverter_no', 'inverter_serial_no', 'inverter_serial'],
  meter_no: ['solarmeter_no', 'solar_meter_no', 'meter_no', 'solarmeter'],
  nm_sm_no: ['nm_sm_no', 'net_meter_no', 'net_meter', 'netmeter_no', 'nmsm_no'],
  loger_no: ['loger_no', 'logger_no', 'logger', 'loger'],
  latitude: ['latitude', 'inst_latitude'],
  longitude: ['longitude', 'inst_longitude'],
  remark: ['remark', 'remarks', 'inst_remarks', 'approved_remarks'],
  district: ['district', 'District'],
};

const txt = (row: any, key: string): string => {
  const keys = ALIASES[key] ?? [key];
  return pick(row, ...keys);
};

const verifyOf = (r: any) => pickNum(r, 'inst_verify_status', 'verify_status');
const docOf = (r: any) => pickNum(r, 'inst_doc_status', 'document_status', 'doc_status');
const instStatusOf = (r: any) => pickNum(r, 'inst_status', 'installation_status');

type VerifyState = 'approved' | 'rejected' | 'pending';
const verifyState = (r: any): VerifyState => {
  const v = verifyOf(r);
  return v === 1 ? 'approved' : v === 2 ? 'rejected' : 'pending';
};
const verifyLabel = (s: VerifyState) => (s === 'approved' ? 'Approved' : s === 'rejected' ? 'Rejected' : 'Pending');

/* ───────── Status Badges ───────── */
type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';
const Badge = ({ tone, children }: { tone: Tone; children: ReactNode }) => (
  <span className={`ax-badge ax-badge--soft ax-badge--pill ax-badge--${tone}`}>
    <span className="ax-badge__dot" />
    {children}
  </span>
);

const VerifyBadge = ({ row }: { row: any }) => {
  const s = verifyState(row);
  return <Badge tone={s === 'approved' ? 'success' : s === 'rejected' ? 'danger' : 'warning'}>{verifyLabel(s)}</Badge>;
};

const DocBadge = ({ status }: { status?: number }) => {
  const s = Number(status ?? 0);
  if (s === 2) return <Badge tone="success">Complete</Badge>;
  if (s === 3) return <Badge tone="danger">Rejected</Badge>;
  if (s === 1) return <Badge tone="info">Pending</Badge>;
  return <Badge tone="neutral">Not Submitted</Badge>;
};

const ClaimBadge = ({ status }: { status?: number }) => {
  const s = Number(status ?? 0);
  if (s === 2) return <Badge tone="success">Approved</Badge>;
  if (s === 3) return <Badge tone="danger">Rejected</Badge>;
  if (s === 1) return <Badge tone="info">Raised</Badge>;
  return <Badge tone="neutral">Pending</Badge>;
};

const InstBadge = ({ row }: { row: any }) => {
  const s = instStatusOf(row);
  return s === 1 ? <Badge tone="success">Installed</Badge> : <Badge tone="neutral">Pending</Badge>;
};

/* ───────── Modal (portal to <body>, focus trap, Esc to close) ───────── */
function Modal({
  open,
  onClose,
  labelledBy,
  dialogClass = '',
  dialogStyle,
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  dialogClass?: string;
  dialogStyle?: CSSProperties;
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
      <div ref={dialogRef} className={`ax-modal__dialog${dialogClass ? ' ' + dialogClass : ''}`} style={dialogStyle}>
        {children}
      </div>
    </div>,
    document.body
  );
}

/* ── Robust Table Image: strict NO BORDER RADIUS ── */
function RobustImage({
  path,
  alt,
  onClick,
  size = 38,
}: {
  path?: string | null;
  alt: string;
  onClick?: (url: string) => void;
  size?: number;
}) {
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [hasError, setHasError] = useState(false);
  const candidates = useMemo(() => getJammuMediaCandidates(path), [path]);

  useEffect(() => {
    setCandidateIndex(0);
    setHasError(false);
  }, [path]);

  if (!path || candidates.length === 0 || hasError) {
    return <span style={{ color: 'var(--ax-text-muted)', fontSize: '11px' }}>{DASH}</span>;
  }

  const currentSrc = candidates[candidateIndex];

  return (
    <img
      src={currentSrc}
      alt={alt}
      title="Click to preview"
      style={{
        width: size,
        height: size,
        objectFit: 'cover',
        borderRadius: 0,
        border: '1px solid var(--ax-border, #e2e8f0)',
        cursor: onClick ? 'zoom-in' : 'default',
        display: 'inline-block',
        flexShrink: 0,
      }}
      onClick={() => onClick?.(currentSrc)}
      onError={() => {
        if (candidateIndex + 1 < candidates.length) setCandidateIndex((p) => p + 1);
        else setHasError(true);
      }}
    />
  );
}

/* ── Lightbox with Zoom ── */
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
    <Modal open onClose={onClose} labelledBy="jrsv-preview-title" dialogClass="ax-modal__dialog--lg">
      <div className="ax-modal__header">
        <h2 className="ax-modal__title" id="jrsv-preview-title" style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
          {title || 'Photo Preview'}
        </h2>
        <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">
          {X_ICON}
        </button>
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

/* ───────── Action dropdown ───────── */
const MENU_W = 170;

interface MenuItem {
  label: string;
  onClick: () => void;
}

function RowActionDropdown({ items }: { items: MenuItem[] }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuH = items.length * 36 + 8;

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
      <button type="button" ref={btnRef} className="ax-btn ax-btn--secondary ax-btn--sm ula-action-btn" onClick={toggle} aria-haspopup="menu" aria-expanded={open}>
        <span>Action</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: 12, height: 12, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} aria-hidden="true">
          <path d="M6 9l6 6l6 -6" />
        </svg>
      </button>

      {open && pos &&
        createPortal(
          <div ref={menuRef} className="ula-menu" role="menu" style={{ top: pos.top, left: pos.left, width: MENU_W }}>
            {items.map((it) => (
              <button key={it.label} type="button" className="ula-menu__item" role="menuitem" onClick={() => { setOpen(false); it.onClick(); }}>
                {it.label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}

/* ───────── Overlay CSS ───────── */
const OVERLAY_CSS = `
  .ax-modal {
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(15, 23, 42, 0.65);
    backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
  }
  .ax-modal__backdrop { position: fixed; inset: 0; background: transparent; }
  .ax-modal__dialog {
    position: relative; z-index: 1; background: #ffffff;
    border-radius: 16px; border: 1px solid var(--ax-border, #e2e8f0);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    overflow: hidden; width: 100%;
  }
  .ax-modal__dialog--md { max-width: 720px; }
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
    color: var(--ax-text-muted, #64748b);
    transition: all 0.15s ease;
  }
  .ax-modal__close:hover { background: var(--ax-surface-hover, #e2e8f0); color: var(--ax-text-strong, #0f172a); }
  .ax-modal__body { padding: 24px; overflow-y: auto; max-height: calc(85vh - 120px); }
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

/* ───────── Responsive page CSS ───────── */
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
  .solar-erp-page img { border-radius: 0 !important; }

  .solar-erp-page .asw-cards-row {
    display: grid; grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--ax-space-4, 16px); margin-bottom: var(--ax-space-5, 20px);
  }
  @media (max-width: 992px) { .solar-erp-page .asw-cards-row { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  @media (max-width: 520px) { .solar-erp-page .asw-cards-row { grid-template-columns: 1fr; } }

  .solar-erp-page .ax-card__header {
    display: flex; flex-wrap: nowrap; align-items: flex-start; justify-content: space-between; gap: 12px;
  }
  .solar-erp-page .ax-card__titles { flex: 1 1 220px; min-width: 220px; max-width: 100%; }
  .solar-erp-page .ax-card__title,
  .solar-erp-page .ax-card__eyebrow,
  .solar-erp-page .ax-card__subtitle { max-width: none; word-break: normal; overflow-wrap: normal; hyphens: none; }
  .solar-erp-page .ax-card__subtitle { line-height: 1.45; }

  .solar-erp-page .ax-card__actions {
    flex: 0 1 auto; min-width: 0; margin-left: auto; display: flex; align-items: center;
    justify-content: flex-end; flex-wrap: nowrap; gap: 8px;
  }
  .solar-erp-page .ax-card__actions .ax-cluster { flex-wrap: nowrap !important; min-width: 0; justify-content: flex-end; }
  .solar-erp-page .ax-card__actions .ax-search,
  .solar-erp-page .ax-card__actions [class*="search"] { flex: 1 1 140px; min-width: 200px; max-width: 240px; }
  .solar-erp-page .ax-card__actions input { min-width: 0; width: 100%; }
  .solar-erp-page .ax-card__actions .ax-export-toolbar,
  .solar-erp-page .ax-card__actions [class*="export-toolbar"] { flex: 0 1 auto; min-width: 0; flex-wrap: nowrap; gap: 4px; }
  .solar-erp-page .ax-export-toolbar__button { padding-inline: 8px !important; min-width: 0; }
  .solar-erp-page .ax-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; width: 100%; }

  .solar-erp-page .asw-cat-pill {
    padding: 6px 14px;
    border-radius: 9999px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    border: 1px solid var(--ax-border, #e2e8f0);
    background: var(--ax-surface-solid, #ffffff);
    color: var(--ax-text-muted, #64748b);
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: all 0.15s ease;
    white-space: nowrap;
  }
  .solar-erp-page .asw-cat-pill:hover {
    border-color: var(--ax-primary, #2563eb);
    color: var(--ax-primary, #2563eb);
  }
  .solar-erp-page .asw-cat-pill.is-active {
    background: var(--ax-primary, #2563eb);
    border-color: var(--ax-primary, #2563eb);
    color: #ffffff;
  }

  @media (max-width: 1100px) {
    .solar-erp-page .ax-export-toolbar__button { font-size: 0; gap: 0; padding: 0 8px !important; justify-content: center; }
    .solar-erp-page .ax-export-toolbar__button svg { width: 16px; height: 16px; flex-shrink: 0; }
    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] { max-width: 180px; }
  }
  @media (max-width: 760px) {
    .solar-erp-page .ax-card__header { flex-direction: column; flex-wrap: nowrap; align-items: stretch; gap: 10px; }
    .solar-erp-page .ax-card__titles { flex: 0 0 auto; min-width: 0; width: 100%; max-width: 100%; }
    .solar-erp-page .ax-card__title { font-family: var(--ax-font-display); font-size: var(--ax-text-md); line-height: var(--ax-leading-md); }
    .solar-erp-page .ax-card__actions { flex: 0 0 auto; width: 100%; margin-left: 0; flex-wrap: wrap; justify-content: flex-start; }
    .solar-erp-page .ax-card__actions .ax-cluster { flex-wrap: wrap !important; width: 100%; justify-content: flex-start; gap: 8px; }
    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] { flex: 1 1 100%; width: 100%; max-width: 100%; min-width: 0; }
    .solar-erp-page .ax-card__actions .ax-export-toolbar,
    .solar-erp-page .ax-card__actions [class*="export-toolbar"] { flex: 1 1 100%; flex-wrap: wrap; justify-content: flex-start; gap: 6px; }
    .solar-erp-page .ax-export-toolbar__button { font-size: 12px; gap: 4px; height: 30px; padding: 0 8px !important; }
  }
  @media (max-width: 490px) {
    .solar-erp-page .ax-export-toolbar__button { font-size: 11px; height: 28px; padding: 0 6px !important; }
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
const monoCell = { fontFamily: 'var(--ax-font-mono, monospace)', fontSize: '12px' } as const;

/* ───────── KPI card ───────── */
type KpiTone = 'accent' | 'cyan' | 'emerald' | 'amber' | 'violet' | 'pink' | 'red';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(37, 99, 235, 0.12)', fg: '#2563eb' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan, #06b6d4) 14%, transparent)', fg: '#0891b2' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald, #10b981) 14%, transparent)', fg: '#16a34a' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber, #f59e0b) 14%, transparent)', fg: '#d97706' },
  violet: { bg: 'color-mix(in oklab, var(--ax-viz-violet, #8b5cf6) 14%, transparent)', fg: '#7c3aed' },
  pink: { bg: 'color-mix(in oklab, var(--ax-viz-pink, #ec4899) 14%, transparent)', fg: '#db2777' },
  red: { bg: 'color-mix(in oklab, var(--ax-viz-red, #ef4444) 14%, transparent)', fg: '#dc2626' },
};

function KpiCard({ icon, tone, label, value, sub }: { icon: ReactNode; tone: KpiTone; label: string; value: ReactNode; sub: string }) {
  const t = TONE[tone] || TONE.accent;
  return (
    <div className="ax-card" style={{ padding: '14px 18px', borderRadius: 12, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ width: 28, height: 28, borderRadius: 8, background: t.bg, color: t.fg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ width: 15, height: 15, display: 'inline-flex' }}>{icon}</span>
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)', letterSpacing: '0.04em' }}>{label}</span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: t.fg, marginTop: 4, fontFamily: 'var(--ax-font-display)' }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>{sub}</div>
    </div>
  );
}

const svgIcon = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);

/* ───────── Status catalog (grouped like Jammu SRT 70MW) ───────── */
export type StatusCategory = 'all' | 'installation' | 'material' | 'verification' | 'claim';

export interface StatusOption {
  key: string;
  label: string;
  sub: string;
  category: StatusCategory;
  tone: KpiTone;
}

const STATUS_CATALOG: StatusOption[] = [
  { key: 'total', label: 'Total Sites', sub: 'All allocated RESCO sites', category: 'all', tone: 'accent' },

  { key: 'complete', label: 'Installed', sub: 'Completed installations', category: 'installation', tone: 'emerald' },
  { key: 'pending', label: 'Pending', sub: 'Pending field installations', category: 'installation', tone: 'amber' },

  { key: 'material_dispatch', label: 'Material Dispatched', sub: 'Materials on site', category: 'material', tone: 'cyan' },
  { key: 'material_pending', label: 'Material Pending', sub: 'Awaiting dispatch', category: 'material', tone: 'amber' },

  { key: 'verify_approved', label: 'Verify Approved', sub: 'Approved by departmental audit', category: 'verification', tone: 'emerald' },
  { key: 'verify_pending', label: 'Verify Pending', sub: 'Awaiting inspection audit', category: 'verification', tone: 'amber' },
  { key: 'verify_reject', label: 'Verify Rejected', sub: 'Flagged with audit rework', category: 'verification', tone: 'red' },

  { key: 'claim1_approved', label: 'Claim 1 Approved', sub: 'Milestone 1 sanctioned', category: 'claim', tone: 'emerald' },
  { key: 'claim2_approved', label: 'Claim 2 Approved', sub: 'Milestone 2 sanctioned', category: 'claim', tone: 'cyan' },
  { key: 'claim3_approved', label: 'Claim 3 Approved', sub: 'Milestone 3 sanctioned', category: 'claim', tone: 'violet' },
];

const STATUS_META_MAP: Record<string, StatusOption> = Object.fromEntries(STATUS_CATALOG.map((s) => [s.key, s]));

const CATEGORY_LABELS: { key: StatusCategory; label: string }[] = [
  { key: 'all', label: 'All Sites' },
  { key: 'installation', label: 'Installation' },
  { key: 'material', label: 'Material' },
  { key: 'verification', label: 'Verification' },
  { key: 'claim', label: 'Claim' },
];

const COLUMN_HEADERS = [
  'Sr. No.',
  'District',
  'Site Name & CA No.',
  'Sanction Load',
  'Department',
  'Contact Person',
  'Inverter & Meter No.',
  'Net Meter & Logger',
  'Panel Count',
  'Photos',
  'Installation',
  'Verification',
  'Document',
  'Claim 1',
  'Claim 2',
  'Claim 3',
  'Action',
];

const panelsOf = (r: any): string[] => {
  if (Array.isArray(r.panel_no)) return r.panel_no;
  if (typeof r.panel_no === 'string') {
    try {
      const p = JSON.parse(r.panel_no);
      return Array.isArray(p) ? p : r.panel_no ? [r.panel_no] : [];
    } catch {
      return r.panel_no ? [r.panel_no] : [];
    }
  }
  return [];
};

const sanctionOf = (r: any) => txt(r, 'sanction_load') || (r.plant_sc ? `${r.plant_sc} kW` : '');

export function RescoStatusView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = normalizeRescoStatus(searchParams.get('status') || 'total');
  const initialDistrict = searchParams.get('district') || 'all';

  const [currentStatus, setCurrentStatus] = useState<string>(initialStatus);
  const [districtFilter, setDistrictFilter] = useState<string>(initialDistrict);
  const [data, setData] = useState<JammuRescoInstalledSiteItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date>(new Date());

  const [search, setSearch] = useState('');
  const [verifyFilter, setVerifyFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');

  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);
  const openPreview = useCallback((url: string, title: string) => setPreviewImage({ url, title }), []);
  const [detailItem, setDetailItem] = useState<JammuRescoInstalledSiteItem | null>(null);

  const isAllDistricts = !districtFilter || districtFilter === 'all' || districtFilter === 'All';

  const activeMeta: StatusOption = useMemo(() => {
    const norm = normalizeRescoStatus(currentStatus);
    return (
      STATUS_META_MAP[norm] ||
      STATUS_META_MAP[currentStatus] || {
        key: norm,
        label: norm.replace(/[-_]/g, ' ').toUpperCase(),
        sub: `Filtered by ${norm}`,
        category: 'all' as const,
        tone: 'accent' as const,
      }
    );
  }, [currentStatus]);

  // Sync state from query params
  useEffect(() => {
    const s = searchParams.get('status');
    const d = searchParams.get('district');
    if (s) {
      const norm = normalizeRescoStatus(s);
      if (norm !== currentStatus) setCurrentStatus(norm);
    }
    setDistrictFilter(d || 'all');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const loadStatusData = useCallback(async (statusKey: string, district: string, isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const targetStatus = normalizeRescoStatus(statusKey);
      let items: JammuRescoInstalledSiteItem[] = [];
      if (district && district !== 'all' && district !== 'All') {
        items = await jammuRescoService.getDistrictWiseData(targetStatus, district);
      } else {
        items = await jammuRescoService.getStatusWiseData(targetStatus);
      }

      setData(Array.isArray(items) ? items : []);
      setUpdatedAt(new Date());
    } catch (err: any) {
      console.error('[Jammu Resco StatusView] API error:', err);
      setData([]);
      setError(err?.message || 'Failed to load RESCO status records from server');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadStatusData(currentStatus, districtFilter);
  }, [currentStatus, districtFilter, loadStatusData]);

  const handleSelectStatus = (key: string) => {
    setCurrentStatus(key);
    setSearchParams(!isAllDistricts ? { status: key, district: districtFilter } : { status: key });
  };

  const handleSelectDistrict = (dist: string) => {
    setDistrictFilter(dist);
    setSearchParams(dist !== 'all' ? { status: currentStatus, district: dist } : { status: currentStatus });
  };

  // District options
  const districts = useMemo(() => {
    const set = new Set<string>();
    data.forEach((r) => {
      const d = txt(r, 'district');
      if (d) set.add(d.trim());
    });
    if (!isAllDistricts) set.add(districtFilter);
    return Array.from(set).sort();
  }, [data, districtFilter, isAllDistricts]);

  // KPI counts
  const summary = useMemo(() => {
    const total = data.length;
    const vApp = data.filter((r) => verifyState(r) === 'approved').length;
    const vRej = data.filter((r) => verifyState(r) === 'rejected').length;
    const vPend = total - vApp - vRej;
    const installed = data.filter((r) => instStatusOf(r) === 1).length;
    const docApp = data.filter((r) => docOf(r) === 2).length;
    return { total, vApp, vRej, vPend, installed, docApp };
  }, [data]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    const q = search.toLowerCase().trim();
    return data.filter((row) => {
      const dist = txt(row, 'district').trim();
      if (!isAllDistricts && dist.toLowerCase() !== districtFilter.toLowerCase()) return false;
      if (verifyFilter !== 'all' && verifyState(row) !== verifyFilter) return false;
      if (!q) return true;
      return [
        txt(row, 'site_name'),
        txt(row, 'ca_no'),
        txt(row, 'department'),
        txt(row, 'contact_person'),
        txt(row, 'contact_number'),
        txt(row, 'meter_no'),
        txt(row, 'inverter_no'),
        txt(row, 'nm_sm_no'),
        txt(row, 'loger_no'),
        txt(row, 'district'),
        txt(row, 'sanction_load'),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [data, districtFilter, isAllDistricts, search, verifyFilter]);

  const { paginatedData, currentPage, pageSize, totalItems, setPage, setPageSize } =
    usePagination({ data: filteredRows, initialPageSize: 100 });

  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, verifyFilter, currentStatus, districtFilter]);

  const hasFilters = search.trim() !== '' || verifyFilter !== 'all' || !isAllDistricts;
  const resetFilters = () => {
    setSearch('');
    setVerifyFilter('all');
    setDistrictFilter('all');
    setSearchParams({ status: currentStatus });
    setPage(1);
  };

  // Export columns
  const exportCols: ExportColumn<JammuRescoInstalledSiteItem>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r, idx) => (idx !== undefined ? idx + 1 : '') },
      { header: 'District', accessor: (r) => txt(r, 'district') || DASH },
      { header: 'Site Name', accessor: (r) => txt(r, 'site_name') || DASH },
      { header: 'CA No.', accessor: (r) => txt(r, 'ca_no') || DASH },
      { header: 'Department', accessor: (r) => txt(r, 'department') || DASH },
      { header: 'Sanction Load', accessor: (r) => sanctionOf(r) || DASH },
      { header: 'Contact Person', accessor: (r) => txt(r, 'contact_person') || DASH },
      { header: 'Contact Number', accessor: (r) => txt(r, 'contact_number') || DASH },
      { header: 'Inverter No.', accessor: (r) => txt(r, 'inverter_no') || DASH },
      { header: 'Solar Meter No.', accessor: (r) => txt(r, 'meter_no') || DASH },
      { header: 'Net Meter No.', accessor: (r) => txt(r, 'nm_sm_no') || DASH },
      { header: 'Logger No.', accessor: (r) => txt(r, 'loger_no') || DASH },
      { header: 'Latitude', accessor: (r) => txt(r, 'latitude') || DASH },
      { header: 'Longitude', accessor: (r) => txt(r, 'longitude') || DASH },
      { header: 'Remark', accessor: (r) => txt(r, 'remark') || DASH },
      { header: 'Verify Status', accessor: (r) => verifyLabel(verifyState(r)) },
      { header: 'Doc Status', accessor: (r) => (docOf(r) === 2 ? 'Complete' : docOf(r) === 3 ? 'Rejected' : 'Pending') },
      { header: 'Claim 1', accessor: (r) => (Number(r.inst_claim1_status ?? 0) === 2 ? 'Approved' : 'Pending') },
      { header: 'Claim 2', accessor: (r) => (Number(r.inst_claim2_status ?? 0) === 2 ? 'Approved' : 'Pending') },
      { header: 'Claim 3', accessor: (r) => (Number(r.inst_claim3_status ?? 0) === 2 ? 'Approved' : 'Pending') },
    ],
    []
  );

  const pageTitle = `Jammu RESCO Sites: ${activeMeta.label}${!isAllDistricts ? ` (${districtFilter})` : ''}`;
  const fileBase = `Jammu_RESCO_Status_${currentStatus}`;

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="Jammu Resco Installation Data"
        subtitle={`Viewing ${activeMeta.label}${!isAllDistricts ? ` in ${districtFilter}` : ''} — ${activeMeta.sub} · Updated ${fmtTime(updatedAt)}`}
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Jammu & Kashmir' },
          { label: 'Installation' },
          { label: 'RESCO', href: '/v/jammu/installation/resco/dashboard' },
          { label: activeMeta.label },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)' }}>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={() => loadStatusData(currentStatus, districtFilter, true)}
              disabled={loading || refreshing}
            >
              <span className={refreshing ? 'ax-spinner' : ''}>{ICON_REFRESH}</span>
              <span className="ax-btn__label">Refresh</span>
            </button>
            <Link to="/v/jammu/installation/resco/dashboard" className="ax-btn ax-btn--secondary ax-btn--sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}>
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </Link>
          </div>
        }
      />

      {error && (
        <div className="ax-alert ax-alert--danger" style={{ marginBottom: 'var(--ax-space-4)' }} role="status">
          <div className="ax-alert__title">Error</div>
          <div className="ax-alert__text">{error}</div>
        </div>
      )}

      {/* ── Top Metric KPI Cards (4 in 1 row) ── */}
      <div className="asw-cards-row">
        <KpiCard
          tone={activeMeta.tone}
          label={`${activeMeta.label} Total`}
          value={summary.total.toLocaleString('en-IN')}
          sub={!isAllDistricts ? `Filtered in ${districtFilter}` : 'Across all J&K districts'}
          icon={svgIcon(<><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 9h8M8 13h8M8 17h5" /></>)}
        />
        <KpiCard
          tone="emerald"
          label="Verify Approved"
          value={summary.vApp.toLocaleString('en-IN')}
          sub={`${summary.total > 0 ? Math.round((summary.vApp / summary.total) * 100) : 0}% of current list`}
          icon={svgIcon(<><path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" /><path d="M9 12l2 2 4-4" /></>)}
        />
        <KpiCard
          tone="amber"
          label="Verify Pending"
          value={summary.vPend.toLocaleString('en-IN')}
          sub={`${summary.vRej} audit rejected`}
          icon={svgIcon(<><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 15" /></>)}
        />
        <KpiCard
          tone="cyan"
          label="Document Complete"
          value={summary.docApp.toLocaleString('en-IN')}
          sub={`${summary.installed} installed sites`}
          icon={svgIcon(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></>)}
        />
      </div>

      {/* ── Category Tabs & Pills ── */}
      <div className="ax-card" style={{ marginBottom: 'var(--ax-space-4)', padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {STATUS_CATALOG.map((cat) => {
            const isActive = cat.key === currentStatus;
            return (
              <button
                key={cat.key}
                type="button"
                className={`asw-cat-pill ${isActive ? 'is-active' : ''}`}
                onClick={() => handleSelectStatus(cat.key)}
              >
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main Table Card ── */}
      <section className="ax-card ax-col--12" role="region" aria-label="Jammu RESCO Status View">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">{pageTitle}</h2>
            <p className="ax-card__subtitle">
              <span className="ax-num">{filteredRows.length}</span> of <span className="ax-num">{data.length}</span> sites
              {' '}· Status: <b>{activeMeta.label}</b>
              {' '}· Approved <b className="ax-num">{summary.vApp}</b> · Pending <b className="ax-num">{summary.vPend}</b> · Rejected <b className="ax-num">{summary.vRej}</b>
            </p>
          </div>
          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              {/* Status Switcher */}
              <select
                id="resco_status_filter"
                className="ax-input ax-input--sm"
                style={{ width: 190, height: 32, fontSize: 'var(--ax-text-xs)' }}
                value={activeMeta.key}
                onChange={(e) => handleSelectStatus(e.target.value)}
                aria-label="Status category"
              >
                {CATEGORY_LABELS.map((cat) => (
                  <optgroup key={cat.key} label={cat.label}>
                    {STATUS_CATALOG.filter((s) => s.category === cat.key).map((sm) => (
                      <option key={sm.key} value={sm.key}>{sm.label}</option>
                    ))}
                  </optgroup>
                ))}
                {!STATUS_META_MAP[activeMeta.key] && <option value={activeMeta.key}>{activeMeta.label}</option>}
              </select>

              {/* District Filter */}
              <select
                id="resco_district_filter"
                className="ax-input ax-input--sm"
                style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                value={isAllDistricts ? 'all' : districtFilter}
                onChange={(e) => handleSelectDistrict(e.target.value)}
                aria-label="Filter by district"
              >
                <option value="all">All Districts ({districts.length})</option>
                {districts.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>

              {/* Verify Status Filter */}
              <select
                id="resco_verify_filter"
                className="ax-input ax-input--sm"
                style={{ width: 130, height: 32, fontSize: 'var(--ax-text-xs)' }}
                value={verifyFilter}
                onChange={(e) => setVerifyFilter(e.target.value as typeof verifyFilter)}
                aria-label="Filter by verify status"
              >
                <option value="all">All Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>

              {hasFilters && (
                <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" onClick={resetFilters} style={{ height: 30, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }}>
                  Reset
                </button>
              )}

              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search site, CA, meter…"
                size="sm"
                ariaLabel="Search sites"
              />

              <TableExportToolbar
                onCopy={() => copyTableDataToClipboard(filteredRows, exportCols)}
                onExportCSV={() => exportDataToCSV(fileBase, filteredRows, exportCols)}
                onExportExcel={() => exportDataToExcel(fileBase, filteredRows, exportCols)}
                onExportPDF={() => printTableData(pageTitle, filteredRows, exportCols)}
              />
            </div>
          </div>
        </div>

        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap', minWidth: 2000 }}>
            <caption className="ax-visually-hidden">Jammu RESCO Status View</caption>
            <thead className="ax-table__head">
              <tr>
                {COLUMN_HEADERS.map((h) => (
                  <th
                    key={h}
                    className="ax-table__th"
                    scope="col"
                    style={h === 'Action' || h === 'Photos' ? { textAlign: 'center' } : undefined}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody aria-busy={loading}>
              {loading && (
                <tr>
                  <td className="ax-table__td" colSpan={COLUMN_HEADERS.length} style={centerCell}>
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading Jammu RESCO installation sites…
                  </td>
                </tr>
              )}
              {!loading && filteredRows.length === 0 && (
                <tr>
                  <td className="ax-table__td" colSpan={COLUMN_HEADERS.length} style={{ padding: 0 }}>
                    <TableEmptyState
                      title="No sites found"
                      message={
                        hasFilters
                          ? 'No records match your filters or search. Try clearing your query.'
                          : `No sites currently in "${activeMeta.label}".`
                      }
                      onClear={hasFilters ? resetFilters : undefined}
                      clearLabel="Clear filters"
                    />
                  </td>
                </tr>
              )}
              {!loading &&
                paginatedData.map((r, idx) => {
                  const srNo = (currentPage - 1) * pageSize + idx + 1;
                  const siteName = txt(r, 'site_name') || `Site ${r.id}`;
                  const caNo = txt(r, 'ca_no');
                  const district = txt(r, 'district');
                  const sLoad = sanctionOf(r);
                  const department = txt(r, 'department');
                  const contactPerson = txt(r, 'contact_person');
                  const contactNumber = txt(r, 'contact_number');
                  const invNo = txt(r, 'inverter_no');
                  const mtrNo = txt(r, 'meter_no');
                  const nmNo = txt(r, 'nm_sm_no');
                  const logNo = txt(r, 'loger_no');
                  const panels = panelsOf(r);

                  return (
                    <tr key={r.id || idx} className="ax-table__row">
                      <td className="ax-table__td ax-num">{srNo}</td>
                      <td className="ax-table__td"><b>{district || DASH}</b></td>
                      <td className="ax-table__td">
                        <div style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>{siteName}</div>
                        {caNo && <div style={{ fontSize: '11px', color: 'var(--ax-text-muted)' }}>CA: {caNo}</div>}
                      </td>
                      <td className="ax-table__td">{sLoad || DASH}</td>
                      <td className="ax-table__td">{department || DASH}</td>
                      <td className="ax-table__td">
                        <div>{contactPerson || DASH}</div>
                        {contactNumber && <div style={{ fontSize: '11px', color: 'var(--ax-text-muted)' }}>{contactNumber}</div>}
                      </td>
                      <td className="ax-table__td" style={monoCell}>
                        <div><span style={{ color: 'var(--ax-text-muted)' }}>Inv:</span> {invNo || DASH}</div>
                        <div><span style={{ color: 'var(--ax-text-muted)' }}>Mtr:</span> {mtrNo || DASH}</div>
                      </td>
                      <td className="ax-table__td" style={monoCell}>
                        <div><span style={{ color: 'var(--ax-text-muted)' }}>NM:</span> {nmNo || DASH}</div>
                        <div><span style={{ color: 'var(--ax-text-muted)' }}>Log:</span> {logNo || DASH}</div>
                      </td>
                      <td className="ax-table__td">
                        {panels.length > 0 ? (
                          <span className="ax-badge ax-badge--soft ax-badge--accent" title={panels.join(', ')}>{panels.length} Panels</span>
                        ) : (
                          <span style={{ color: 'var(--ax-text-muted)' }}>{DASH}</span>
                        )}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
                          <RobustImage path={r.panel_image} alt={`${siteName} Panel`} onClick={(u) => openPreview(u, `${siteName} - Solar Panels`)} />
                          <RobustImage path={r.system_image} alt={`${siteName} System`} onClick={(u) => openPreview(u, `${siteName} - System BOS`)} />
                          <RobustImage path={r.inverter_image} alt={`${siteName} Inverter`} onClick={(u) => openPreview(u, `${siteName} - Inverter`)} />
                          <RobustImage path={r.nm_sm_image} alt={`${siteName} Net Meter`} onClick={(u) => openPreview(u, `${siteName} - Net Meter`)} />
                          <RobustImage path={r.loger_image} alt={`${siteName} Logger`} onClick={(u) => openPreview(u, `${siteName} - Logger`)} />
                        </div>
                      </td>
                      <td className="ax-table__td"><InstBadge row={r} /></td>
                      <td className="ax-table__td"><VerifyBadge row={r} /></td>
                      <td className="ax-table__td"><DocBadge status={docOf(r)} /></td>
                      <td className="ax-table__td"><ClaimBadge status={r.inst_claim1_status} /></td>
                      <td className="ax-table__td"><ClaimBadge status={r.inst_claim2_status} /></td>
                      <td className="ax-table__td"><ClaimBadge status={r.inst_claim3_status} /></td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <RowActionDropdown items={[{ label: 'View Details', onClick: () => setDetailItem(r) }]} />
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* ── Footer / Pagination ── */}
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

      {/* ── Photo Preview Modal ── */}
      {previewImage && (
        <ImagePreviewModal url={previewImage.url} title={previewImage.title} onClose={() => setPreviewImage(null)} />
      )}

      {/* ── Detail View Modal ── */}
      <Modal open={!!detailItem} onClose={() => setDetailItem(null)} labelledBy="jrsv-detail-title" dialogClass="ax-modal__dialog--md">
        {detailItem && (
          <div>
            <div className="ax-modal__header">
              <div>
                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700 }} id="jrsv-detail-title">
                  {txt(detailItem, 'site_name') || `Site ${detailItem.id}`}
                </h4>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--ax-text-muted)' }}>
                  {txt(detailItem, 'district') ? `District: ${txt(detailItem, 'district')} · ` : ''}Project: Jammu RESCO
                </p>
              </div>
              <button type="button" className="ax-modal__close" onClick={() => setDetailItem(null)} aria-label="Close dialog">
                {X_ICON}
              </button>
            </div>
            <div className="ax-modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="ula-m-grid">
                <div className="ula-m-info"><span>CA No:</span> <b>{txt(detailItem, 'ca_no') || DASH}</b></div>
                <div className="ula-m-info"><span>Department:</span> <b>{txt(detailItem, 'department') || DASH}</b></div>
                <div className="ula-m-info"><span>Sanction Load:</span> <b>{sanctionOf(detailItem) || DASH}</b></div>
                <div className="ula-m-info"><span>Contact Person:</span> <b>{txt(detailItem, 'contact_person') || DASH}</b></div>
                <div className="ula-m-info"><span>Contact No:</span> <b>{txt(detailItem, 'contact_number') || DASH}</b></div>
                <div className="ula-m-info"><span>Inverter No:</span> <b>{txt(detailItem, 'inverter_no') || DASH}</b></div>
                <div className="ula-m-info"><span>Solar Meter No:</span> <b>{txt(detailItem, 'meter_no') || DASH}</b></div>
                <div className="ula-m-info"><span>Net Meter No:</span> <b>{txt(detailItem, 'nm_sm_no') || DASH}</b></div>
                <div className="ula-m-info"><span>Logger No:</span> <b>{txt(detailItem, 'loger_no') || DASH}</b></div>
                <div className="ula-m-info"><span>Latitude:</span> <b>{txt(detailItem, 'latitude') || DASH}</b></div>
                <div className="ula-m-info"><span>Longitude:</span> <b>{txt(detailItem, 'longitude') || DASH}</b></div>
                <div className="ula-m-info"><span>Panels:</span> <b>{panelsOf(detailItem).length || DASH}</b></div>
                <div className="ula-m-info"><span>Verification:</span> <b>{verifyLabel(verifyState(detailItem))}</b></div>
                <div className="ula-m-info"><span>Document:</span> <b>{docOf(detailItem) === 2 ? 'Complete' : 'Pending'}</b></div>
                <div className="ula-m-info"><span>Claim 1:</span> <b>{Number(detailItem.inst_claim1_status ?? 0) === 2 ? 'Approved' : 'Pending'}</b></div>
                <div className="ula-m-info"><span>Claim 2:</span> <b>{Number(detailItem.inst_claim2_status ?? 0) === 2 ? 'Approved' : 'Pending'}</b></div>
              </div>

              {txt(detailItem, 'remark') && (
                <div className="ula-m-info"><span>Remark:</span> <b>{txt(detailItem, 'remark')}</b></div>
              )}

              <div style={{ border: '1px solid var(--ax-border, #e2e8f0)', padding: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)', marginBottom: 8, letterSpacing: '0.04em' }}>Site Evidentiary Photos</div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {[
                    { path: detailItem.panel_image, label: 'Solar Panels' },
                    { path: detailItem.system_image, label: 'System BOS' },
                    { path: detailItem.inverter_image, label: 'Inverter' },
                    { path: detailItem.nm_sm_image, label: 'Net Meter' },
                    { path: detailItem.loger_image, label: 'Logger' },
                  ].map((p) => (
                    <div key={p.label} style={{ textAlign: 'center' }}>
                      <RobustImage path={p.path} alt={p.label} size={84} onClick={(u) => openPreview(u, `${txt(detailItem, 'site_name')} - ${p.label}`)} />
                      <div style={{ fontSize: 10, color: 'var(--ax-text-muted)', marginTop: 4 }}>{p.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="ax-modal__footer">
              <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setDetailItem(null)}>Close</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default RescoStatusView;
