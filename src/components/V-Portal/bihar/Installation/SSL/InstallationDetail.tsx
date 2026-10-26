import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  biharSslInstallationService,
  getMediaUrl,
  getCompanyId,
  type InstalledLightsSummary,
  type InstalledLightItem,
} from '../../bihar-services';
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

const DASH = '—';
const MAX_FILE = 2 * 1024 * 1024;

const num = (x: unknown) => (Number(x) || 0).toLocaleString('en-IN');

const ICON_REFRESH = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
    <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
  </svg>
);

const ICON_CROSSHAIR = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M22 12h-4M6 12H2M12 6V2M12 22v-4" />
  </svg>
);

const X_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';
const Badge = ({ tone, children }: { tone: Tone; children: ReactNode }) => (
  <span className={`ax-badge ax-badge--soft ax-badge--${tone} ax-badge--pill`}>{children}</span>
);

const vStatusOf = (r: InstalledLightItem) => Number(r.inst_verify_status ?? r.verify_status ?? 0);
const cStatusOf = (r: InstalledLightItem) => Number(r.inst_claim_status ?? r.claim_status ?? 0);
const pStatusOf = (r: InstalledLightItem) => Number(r.inst_pay_status ?? r.payment_status ?? 0);
const lightImageOf = (r: InstalledLightItem) => getMediaUrl(r.light_image || r.light_file) || '';

/* ───────── Modal (design-system dialog: portal to <body>, focus trap, Esc to close) ───────── */
function Modal({
  open,
  onClose,
  labelledBy,
  dialogClass = '',
  closeOnBackdrop = true,
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  dialogClass?: string;
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
    <div className="ax-modal ax-modal--centered" role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
      <div className="ax-modal__backdrop" onClick={() => closeOnBackdrop && onClose()} />
      <div ref={dialogRef} className={`ax-modal__dialog${dialogClass ? ' ' + dialogClass : ''}`}>
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
    <Modal open onClose={onClose} labelledBy="ssl-preview-title" dialogClass="ax-modal__dialog--lg">
      <div className="ax-modal__header">
        <h2 className="ax-modal__title" id="ssl-preview-title">{title || 'Media Preview'}</h2>
        <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">{X_ICON}</button>
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

/* ── Image thumbnail (NO BORDER RADIUS) ── */
function LightThumbnail({ url, alt, onPreview }: { url: string; alt: string; onPreview: (url: string, title: string) => void }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [url]);

  if (!url || failed) return <span style={{ color: 'var(--ax-text-subtle)' }}>{DASH}</span>;
  return (
    <img
      src={url}
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
      onError={() => setFailed(true)}
      onClick={() => onPreview(url, alt)}
      title="Click to preview"
    />
  );
}

/* ── Action Dropdown (menu is rendered in <body> so the table never clips it) ── */
const MENU_W = 180;

function RowActionDropdown({ items }: { items: { label: string; onClick: () => void }[] }) {
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
            {items.map((it) => (
              <button
                key={it.label}
                type="button"
                className="ula-menu__item"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  it.onClick();
                }}
              >
                {it.label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}

/* ───────── Overlay CSS (modals + dropdown; global because they render in <body>) ───────── */
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

  .ula-m-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--ax-space-4, 16px); }
  .ula-m-full { grid-column: 1 / -1; }
  .ula-m-note { margin: 0; font-size: var(--ax-text-sm, 13px); color: var(--ax-text-muted, #64748b); }
  .ula-m-hint { margin: 0; font-size: 12px; color: var(--ax-text-muted, #64748b); }
  .ula-m-info {
    display: flex; flex-wrap: wrap; gap: 4px 16px; padding: 8px 12px; font-size: 12px;
    background: var(--ax-surface-subtle, #f8fafc); border: 1px solid var(--ax-border, #e2e8f0);
  }
  .ula-m-info span { color: var(--ax-text-muted, #64748b); }
  .ula-m-info b { color: var(--ax-text-strong, #0f172a); font-weight: 600; }
  .ula-m-kv {
    padding: 8px 12px; min-width: 0;
    background: var(--ax-surface-subtle, #f8fafc); border: 1px solid var(--ax-border, #e2e8f0);
  }
  .ula-m-kv__k { font-size: 11px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; color: var(--ax-text-muted, #64748b); }
  .ula-m-kv__v { margin-top: 2px; font-size: 13px; font-weight: 600; color: var(--ax-text-strong, #0f172a); overflow-wrap: anywhere; }
  .ax-modal textarea.ax-input { resize: vertical; min-height: 84px; line-height: 1.45; }

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

/* ───────── Responsive page CSS (same as ULA / SRT view) ───────── */
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
  .solar-erp-page .ula-sticky-first th:first-child,
  .solar-erp-page .ula-sticky-first td:first-child {
    position: sticky;
    left: 0;
    z-index: 2;
    background: var(--ax-bg-surface, #ffffff);
    box-shadow: 1px 0 0 var(--ax-border-subtle, #e2e8f0);
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

const Req = () => <span style={{ color: 'var(--ax-danger-500)' }} aria-hidden="true">*</span>;

function TextField({
  id,
  label,
  value,
  onChange,
  type = 'text',
  required = true,
  full,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
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
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

/* ───────── Tabs (one page, two datasets; URL hash: #Completed / #Payment) ───────── */
type TabKey = 'Completed' | 'Payment';

const TABS: { key: TabKey; label: string; hash: string }[] = [
  { key: 'Completed', label: 'Lights Completed', hash: '#Completed' },
  { key: 'Payment', label: 'Payment Lights', hash: '#Payment' },
];

/* ───────── Column config: one source for table + export ───────── */
interface Col {
  header: string;
  text: (r: InstalledLightItem) => string;
  render?: (r: InstalledLightItem, ctx: { preview: (url: string, title: string) => void }) => ReactNode;
  strong?: boolean;
  mono?: boolean;
  wrap?: boolean;
}

const commonCols: Col[] = [
  { header: 'UID', text: (r) => r.unique_id || r.uid || `#${r.id}`, strong: true },
  { header: 'State', text: (r) => r.state || 'Bihar' },
  { header: 'Phase', text: (r) => String(r.phase ?? '') },
  { header: 'District', text: (r) => r.district || '', strong: true },
  { header: 'Block', text: (r) => r.block || '' },
  { header: 'Panchayat', text: (r) => r.panchayat || r.panchyat || '' },
  { header: 'Ward No.', text: (r) => String(r.ward_no ?? '') },
  { header: 'Pole No.', text: (r) => String(r.pole_no ?? '') },
  { header: 'Beneficiary Name', text: (r) => r.beneficiary_name || '', strong: true },
  { header: 'Beneficiary Contact', text: (r) => r.contact_no || '', mono: true },
  { header: 'Latitude', text: (r) => String(r.latitude ?? '') },
  { header: 'Longitude', text: (r) => String(r.longitude ?? '') },
];

const tailCols: Col[] = [
  { header: 'Battery No.', text: (r) => r.battery_no || r.battery_serial_no || '', mono: true },
  { header: 'Panel No.', text: (r) => r.panel_no || r.module_no || '', mono: true },
  {
    header: 'Light Image',
    text: (r) => lightImageOf(r),
    render: (r, { preview }) => (
      <LightThumbnail url={lightImageOf(r)} alt={`${r.unique_id || r.uid || `#${r.id}`} - Light Photo`} onPreview={preview} />
    ),
  },
  { header: 'Remark', text: (r) => r.remark || r.inst_remark || '', wrap: true },
];

const paymentStatusCol: Col = {
  header: 'Payment Status',
  text: (r) => (pStatusOf(r) === 1 ? 'Paid' : 'Pending'),
  render: (r) => (pStatusOf(r) === 1 ? <Badge tone="success">Paid</Badge> : <Badge tone="warning">Pending</Badge>),
};

const COMPLETED_COLS: Col[] = [
  ...commonCols,
  { header: 'Light No.', text: (r) => r.light_no || '', mono: true },
  { header: 'UUID No.', text: (r) => r.uuid_no || '', mono: true },
  ...tailCols,
  {
    header: 'Verify Status',
    text: (r) => (vStatusOf(r) === 1 ? 'Approved' : vStatusOf(r) === 2 ? 'Rejected' : 'Pending'),
    render: (r) => {
      const v = vStatusOf(r);
      return v === 1 ? <Badge tone="success">Approved</Badge> : v === 2 ? <Badge tone="danger">Rejected</Badge> : <Badge tone="warning">Pending</Badge>;
    },
  },
  {
    header: 'Claim Status',
    text: (r) => (cStatusOf(r) === 1 ? 'Raised' : 'Not Raised'),
    render: (r) => (cStatusOf(r) === 1 ? <Badge tone="info">Raised</Badge> : <Badge tone="neutral">Not Raised</Badge>),
  },
  paymentStatusCol,
];

const PAYMENT_COLS: Col[] = [
  ...commonCols,
  { header: 'IMEI No.', text: (r) => r.imei_no || '', mono: true },
  { header: 'Sim No.', text: (r) => r.sim_no || '', mono: true },
  ...tailCols,
  paymentStatusCol,
];

type EditForm = {
  beneficiary_name: string; contact_no: string; ward_no: string; pole_no: string;
  uuid_no: string; light_no: string; module_no: string; battery_serial_no: string;
  latitude: string; longitude: string; remark: string;
};
const EMPTY_FORM: EditForm = {
  beneficiary_name: '', contact_no: '', ward_no: '', pole_no: '', uuid_no: '', light_no: '',
  module_no: '', battery_serial_no: '', latitude: '', longitude: '', remark: '',
};

/* =========================================================================
 * Main page
 * ========================================================================= */
export function Bihar_Installation_SSL_InstallationDetail() {
  const location = useLocation();
  const navigate = useNavigate();
  const tab: TabKey = location.hash.toLowerCase() === '#payment' ? 'Payment' : 'Completed';
  const setTab = (k: TabKey) => {
    const t = TABS.find((x) => x.key === k)!;
    navigate({ pathname: location.pathname, search: location.search, hash: t.hash }, { replace: true });
  };
  const isCompleted = tab === 'Completed';

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<InstalledLightsSummary | null>(null);
  const [completeLights, setCompleteLights] = useState<InstalledLightItem[]>([]);
  const [paymentLights, setPaymentLights] = useState<InstalledLightItem[]>([]);

  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') || '');
  const [districtFilter, setDistrictFilter] = useState(() => searchParams.get('district') || 'all');
  const [verifyFilter, setVerifyFilter] = useState(() => searchParams.get('verify') || searchParams.get('status') || 'all');
  const [hiddenByTab, setHiddenByTab] = useState<Record<TabKey, string[]>>({ Completed: [], Payment: [] });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Photo preview modal
  const [preview, setPreview] = useState<{ url: string; title: string } | null>(null);
  const openPreview = useCallback((url: string, title: string) => setPreview({ url, title }), []);
  const closePreview = useCallback(() => setPreview(null), []);

  // View modal
  const [viewItem, setViewItem] = useState<InstalledLightItem | null>(null);
  const closeView = useCallback(() => setViewItem(null), []);

  // Edit modal
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editForm, setEditForm] = useState<EditForm>(EMPTY_FORM);
  const [editFile, setEditFile] = useState<File | null>(null);
  const [existingImage, setExistingImage] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [gpsDetecting, setGpsDetecting] = useState(false);
  const [gpsMsg, setGpsMsg] = useState<string | null>(null);
  const closeEdit = useCallback(() => {
    if (!editSubmitting) setEditingId(null);
  }, [editSubmitting]);

  // Toast / feedback message
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  useEffect(() => {
    if (!toastMsg) return;
    const t = window.setTimeout(() => setToastMsg(null), 4000);
    return () => window.clearTimeout(t);
  }, [toastMsg]);

  const deferredQuery = useDeferredValue(searchQuery);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await biharSslInstallationService.getViewInstalledLights();
      if (res) {
        setSummary(res.install_detail || null);
        setCompleteLights(Array.isArray(res.complete_lights) ? res.complete_lights : []);
        setPaymentLights(Array.isArray(res.payment_lights) ? res.payment_lights : []);
      }
    } catch (err: any) {
      console.error('[InstallationDetail] error:', err);
      setToastMsg({ type: 'danger', text: err?.message || 'Failed to load installed lights.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const currentList = isCompleted ? completeLights : paymentLights;

  const districts = useMemo(() => {
    const set = new Set<string>();
    currentList.forEach((r) => {
      if (r.district) set.add(r.district.trim());
    });
    return Array.from(set).sort();
  }, [currentList]);

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return currentList.filter((r) => {
      if (q) {
        const fields = [
          r.unique_id, r.uid, r.beneficiary_name, r.contact_no, r.district, r.block,
          r.panchayat, r.panchyat, r.uuid_no, r.light_no, r.battery_no, r.panel_no,
        ];
        if (!fields.some((f) => f && String(f).toLowerCase().includes(q))) return false;
      }
      if (districtFilter !== 'all' && r.district?.toLowerCase() !== districtFilter.toLowerCase()) return false;
      if (isCompleted && verifyFilter !== 'all' && String(vStatusOf(r)) !== verifyFilter) return false;
      return true;
    });
  }, [currentList, deferredQuery, districtFilter, verifyFilter, isCompleted]);

  // Pagination
  useEffect(() => {
    setCurrentPage(1);
  }, [deferredQuery, districtFilter, verifyFilter, tab]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const hasFilters = searchQuery.trim() !== '' || districtFilter !== 'all' || (isCompleted && verifyFilter !== 'all');
  const resetFilters = () => {
    setSearchQuery('');
    setDistrictFilter('all');
    setVerifyFilter('all');
  };

  /* ───────── Edit ───────── */
  const setField = (name: keyof EditForm) => (v: string) => setEditForm((p) => ({ ...p, [name]: v }));

  const handleOpenEdit = async (lightId: number) => {
    setEditingId(lightId);
    setEditLoading(true);
    setEditError(null);
    setEditFile(null);
    setExistingImage('');
    setGpsMsg(null);
    setEditForm(EMPTY_FORM);
    try {
      const data = await biharSslInstallationService.getInstalledLightEdit(lightId);
      if (data) {
        setEditForm({
          beneficiary_name: data.beneficiary_name || '',
          contact_no: data.contact_no || '',
          ward_no: data.ward_no || '',
          pole_no: data.pole_no || '',
          uuid_no: data.uuid_no || '',
          light_no: data.light_no || '',
          module_no: data.module_no || data.panel_no || '',
          battery_serial_no: data.battery_serial_no || data.battery_no || '',
          latitude: data.latitude || '',
          longitude: data.longitude || '',
          remark: data.remark || data.inst_remark || '',
        });
        setExistingImage(getMediaUrl((data as any).light_image || (data as any).light_file) || '');
      }
    } catch (err: any) {
      console.error('[Edit Light] fetch error:', err);
      setEditError(err?.message || 'Failed to fetch light details.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      setGpsMsg('Geolocation is not supported by your browser.');
      return;
    }
    setGpsDetecting(true);
    setGpsMsg('Locating coordinates…');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setEditForm((p) => ({
          ...p,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
        setGpsDetecting(false);
        setGpsMsg(`GPS locked (accuracy ±${Math.round(pos.coords.accuracy || 5)} m)`);
      },
      (err) => {
        setGpsDetecting(false);
        setGpsMsg(`Unable to lock GPS: ${err.message}. Enter manually or retry.`);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  const handlePickFile = (file: File | null) => {
    setEditError(null);
    if (!file) {
      setEditFile(null);
      return;
    }
    if (file.size > MAX_FILE) {
      setEditFile(null);
      setEditError(`File "${file.name}" exceeds the 2 MB limit.`);
      return;
    }
    setEditFile(file);
  };

  const handleSaveEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setEditError(null);
    setEditSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('ssl_id', String(editingId));
      fd.append('uuid_no', editForm.uuid_no.trim());
      fd.append('light_no', editForm.light_no.trim());
      fd.append('module_no', editForm.module_no.trim());
      fd.append('battery_serial_no', editForm.battery_serial_no.trim());
      fd.append('beneficiary_name', editForm.beneficiary_name.trim());
      fd.append('contact_no', editForm.contact_no.trim());
      fd.append('ward_no', editForm.ward_no.trim());
      fd.append('pole_no', editForm.pole_no.trim());
      fd.append('latitude', editForm.latitude.trim());
      fd.append('longitude', editForm.longitude.trim());
      if (editForm.remark.trim()) fd.append('remark', editForm.remark.trim());
      if (editFile) fd.append('light_file', editFile);

      const res = await biharSslInstallationService.updateInstalledLight(fd);
      setToastMsg({ type: 'success', text: res?.message || 'Details updated successfully!' });
      setEditingId(null);
      await loadData();
    } catch (err: any) {
      console.error('[Save Edit] error:', err);
      setEditError(err?.message || 'Failed to update details.');
    } finally {
      setEditSubmitting(false);
    }
  };

  /* ───────── Export (derived from the same column config as the table) ───────── */
  const cols = isCompleted ? COMPLETED_COLS : PAYMENT_COLS;

  const exportCols: ExportColumn<InstalledLightItem>[] = useMemo(
    () => cols.map((c) => ({ header: c.header, accessor: (r: InstalledLightItem) => c.text(r) })),
    [cols]
  );
  const hiddenColumns = hiddenByTab[tab];
  const toolbarColumns = exportCols.map((c, i) => ({
    key: `${c.header}-${i}`,
    label: c.header,
    visible: !hiddenColumns.includes(`${c.header}-${i}`),
  }));
  const activeCols = exportCols.filter((c, i) => !hiddenColumns.includes(`${c.header}-${i}`));
  const toggleColumn = (key: string) =>
    setHiddenByTab((prev) => ({
      ...prev,
      [tab]: prev[tab].includes(key) ? prev[tab].filter((k) => k !== key) : [...prev[tab], key],
    }));

  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = isCompleted ? 'Bihar_SSL_Completed_Lights' : 'Bihar_SSL_Payment_Lights';
  const fileTitle = isCompleted ? 'Bihar SSL Completed Lights' : 'Bihar SSL Payment Lights';

  const TOTAL_COLUMNS = 1 + cols.length + (isCompleted ? 1 : 0);

  const viewItems = viewItem
    ? [
        { label: 'Beneficiary', value: viewItem.beneficiary_name },
        { label: 'Contact', value: viewItem.contact_no },
        { label: 'District / Block', value: `${viewItem.district || DASH} / ${viewItem.block || DASH}` },
        { label: 'Panchayat', value: viewItem.panchayat || viewItem.panchyat },
        { label: 'Ward / Pole', value: `${viewItem.ward_no || DASH} / ${viewItem.pole_no || DASH}` },
        { label: 'GPS (Lat, Lng)', value: `${viewItem.latitude || DASH}, ${viewItem.longitude || DASH}` },
        { label: 'UUID No.', value: viewItem.uuid_no },
        { label: 'Light No.', value: viewItem.light_no },
        { label: 'Battery Serial No.', value: viewItem.battery_no || viewItem.battery_serial_no },
        { label: 'Module / Panel No.', value: viewItem.panel_no || viewItem.module_no },
        { label: 'Sim No.', value: viewItem.sim_no },
        { label: 'IMEI No.', value: viewItem.imei_no },
        { label: 'Remark', value: viewItem.remark || viewItem.inst_remark },
      ]
    : [];

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="Installation Details"
        subtitle="View installed lights and payment status for Bihar Solar Street Light sites"
        breadcrumbs={[
          { label: 'Bihar' },
          { label: 'Installation' },
          { label: 'SSL', href: '/v/ssl/installation-dashboard' },
          { label: 'Installation Detail' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)', alignItems: 'center' }}>
            <span className="ax-badge ax-badge--soft ax-badge--accent ax-badge--pill" style={{ fontWeight: 600 }}>
              Company ID: {getCompanyId()}
            </span>
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
        {/* ── Tabs: Lights Completed / Payment Lights ── */}
        <div className="ax-col--12">
          <div className="ax-cluster" role="tablist" aria-label="Installed lights" style={{ gap: 'var(--ax-space-2)' }}>
            {TABS.map((t) => {
              const active = t.key === tab;
              const count = t.key === 'Completed' ? completeLights.length : paymentLights.length;
              return (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  id={`ssl-tab-${t.key}`}
                  aria-selected={active}
                  aria-controls="ssl-tabpanel"
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
        <section className="ax-card ax-col--12" id="ssl-tabpanel" role="tabpanel" aria-labelledby={`ssl-tab-${tab}`}>
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">{isCompleted ? 'Lights Completed' : 'Payment Lights'}</h2>
              <p className="ax-card__subtitle">
                <span className="ax-num">{filtered.length}</span> of <span className="ax-num">{currentList.length}</span> lights
                {summary && isCompleted && (
                  <>
                    {' '}· Completed <b className="ax-num">{num(summary.complete)}</b> / {num(summary.total)} · Approved <b className="ax-num">{num(summary.verify_approved)}</b> · Verify pending <b className="ax-num">{num(summary.verify_pending)}</b> · Claims raised <b className="ax-num">{num(summary.claim_raised)}</b> / {num(summary.claim_applicable)}
                  </>
                )}
                {summary && !isCompleted && (
                  <>
                    {' '}· Payment complete <b className="ax-num">{num(summary.payment_complete)}</b> · Pending <b className="ax-num">{num(summary.payment_pending)}</b>
                  </>
                )}
              </p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                <select
                  id="ssl_district_filter"
                  className="ax-input ax-input--sm"
                  style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                  value={districtFilter}
                  onChange={(e) => setDistrictFilter(e.target.value)}
                  aria-label="Filter by district"
                >
                  <option value="all">All Districts</option>
                  {districts.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>

                {isCompleted && (
                  <select
                    id="ssl_verify_filter"
                    className="ax-input ax-input--sm"
                    style={{ width: 150, height: 32, fontSize: 'var(--ax-text-xs)' }}
                    value={verifyFilter}
                    onChange={(e) => setVerifyFilter(e.target.value)}
                    aria-label="Filter by verification"
                  >
                    <option value="all">All Verification</option>
                    <option value="1">Approved</option>
                    <option value="0">Pending</option>
                    <option value="2">Rejected</option>
                  </select>
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
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search UID, contact, pole…"
                  size="sm"
                  ariaLabel="Search installed lights"
                />

                <TableExportToolbar
                  onCopy={() => copyTableDataToClipboard(filtered, activeCols)}
                  onExportCSV={() => exportDataToCSV(`${fileBase}_${stamp}`, filtered, activeCols)}
                  onExportExcel={() => exportDataToExcel(`${fileBase}_${stamp}`, filtered, activeCols)}
                  onExportPDF={() => printTableData(fileTitle, filtered, activeCols)}
                  columns={toolbarColumns}
                  onToggleColumn={toggleColumn}
                />
              </div>
            </div>
          </div>

          <div className="ax-table-wrap">
            <table
              className="ax-table ax-table--hover ula-sticky-first"
              style={{ whiteSpace: 'nowrap', minWidth: isCompleted ? 2600 : 2200 }}
            >
              <caption className="ax-visually-hidden">{isCompleted ? 'Lights Completed' : 'Payment Lights'}</caption>
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">Sr. No.</th>
                  {cols.map((c) => (
                    <th key={c.header} className="ax-table__th" scope="col">{c.header}</th>
                  ))}
                  {isCompleted && <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Action</th>}
                </tr>
              </thead>
              <tbody aria-busy={loading}>
                {loading && (
                  <tr>
                    <td className="ax-table__td" colSpan={TOTAL_COLUMNS} style={centerCell}>
                      <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading installed lights…
                    </td>
                  </tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td className="ax-table__td" colSpan={TOTAL_COLUMNS} style={{ padding: 0 }}>
                      <TableEmptyState
                        title={isCompleted ? 'No completed lights found' : 'No payment lights found'}
                        message={
                          hasFilters
                            ? 'No records match your filters or search. Try clearing your query.'
                            : isCompleted
                            ? 'Lights will appear here once installation is completed.'
                            : 'Lights will appear here once they reach the payment stage.'
                        }
                        onClear={hasFilters ? resetFilters : undefined}
                        clearLabel="Clear filters"
                      />
                    </td>
                  </tr>
                )}
                {!loading &&
                  paginated.map((r, idx) => (
                    <tr key={r.id || idx} className="ax-table__row">
                      <td className="ax-table__td ax-num">{(currentPage - 1) * pageSize + idx + 1}</td>
                      {cols.map((c) => {
                        const content = c.render ? c.render(r, { preview: openPreview }) : c.text(r) || DASH;
                        return (
                          <td
                            key={c.header}
                            className="ax-table__td"
                            title={c.wrap ? c.text(r) : undefined}
                            style={{
                              ...(c.strong ? { fontWeight: 600, color: 'var(--ax-text-strong)' } : null),
                              ...(c.mono ? { fontFamily: 'var(--ax-font-mono)', fontSize: '12px' } : null),
                              ...(c.wrap ? { maxWidth: 200, whiteSpace: 'normal', fontSize: '12px' } : null),
                            }}
                          >
                            {content}
                          </td>
                        );
                      })}
                      {isCompleted && (
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <RowActionDropdown
                            items={[
                              { label: 'Edit Details', onClick: () => handleOpenEdit(r.id) },
                              { label: 'View Specs', onClick: () => setViewItem(r) },
                            ]}
                          />
                        </td>
                      )}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

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
                pageSizeOptions={[10, 15, 25, 50, 100]}
              />
            </div>
          </div>
        </section>
      </div>

      {/* ── Photo Preview Modal ── */}
      {preview && <ImagePreviewModal url={preview.url} title={preview.title} onClose={closePreview} />}

      {/* ── View Specs Modal ── */}
      <Modal open={!!viewItem} onClose={closeView} labelledBy="ssl-view-title" dialogClass="ax-modal__dialog--lg">
        {viewItem && (
          <div>
            <div className="ax-modal__header">
              <div>
                <h2 className="ax-modal__title" id="ssl-view-title">SSL site details</h2>
                <p style={{ margin: 0, fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
                  {viewItem.unique_id || viewItem.uid || `#${viewItem.id}`}
                </p>
              </div>
              <button type="button" className="ax-modal__close" onClick={closeView} aria-label="Close dialog">{X_ICON}</button>
            </div>

            <div className="ax-modal__body">
              <div className="ula-m-grid">
                {viewItems.map((item) => (
                  <div key={item.label} className="ula-m-kv">
                    <div className="ula-m-kv__k">{item.label}</div>
                    <div className="ula-m-kv__v">{item.value || DASH}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="ax-modal__footer">
              <button type="button" className="ax-btn ax-btn--primary" onClick={closeView}>Close</button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Edit Details Modal ── */}
      <Modal open={editingId !== null} onClose={closeEdit} labelledBy="ssl-edit-title" dialogClass="ax-modal__dialog--lg" closeOnBackdrop={!editSubmitting}>
        {editingId !== null && (
          <form onSubmit={handleSaveEdit}>
            <div className="ax-modal__header">
              <div>
                <h2 className="ax-modal__title" id="ssl-edit-title">Edit installed light details</h2>
                <p style={{ margin: 0, fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>Light ID #{editingId}</p>
              </div>
              <button type="button" className="ax-modal__close" onClick={closeEdit} aria-label="Close dialog" disabled={editSubmitting}>{X_ICON}</button>
            </div>

            <div className="ax-modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-5)' }}>
              {editError && (
                <div className="ax-alert ax-alert--danger" role="alert">
                  <div className="ax-alert__text">{editError}</div>
                </div>
              )}

              {editLoading ? (
                <div style={{ textAlign: 'center', padding: 'var(--ax-space-6)', color: 'var(--ax-text-muted)' }}>
                  <span className="ax-spinner" /> Loading light details…
                </div>
              ) : (
                <>
                  <p className="ula-m-note">The field labels marked with * are required fields.</p>

                  <div className="ula-m-grid">
                    <TextField id="ssl-e-name" label="Beneficiary Name" value={editForm.beneficiary_name} onChange={setField('beneficiary_name')} />
                    <TextField id="ssl-e-contact" label="Contact No." type="tel" value={editForm.contact_no} onChange={setField('contact_no')} />
                    <TextField id="ssl-e-ward" label="Ward No." value={editForm.ward_no} onChange={setField('ward_no')} />
                    <TextField id="ssl-e-pole" label="Pole No." value={editForm.pole_no} onChange={setField('pole_no')} />
                    <TextField id="ssl-e-uuid" label="UUID No." value={editForm.uuid_no} onChange={setField('uuid_no')} />
                    <TextField id="ssl-e-light" label="Light Number" value={editForm.light_no} onChange={setField('light_no')} />
                    <TextField id="ssl-e-module" label="Panel Number (Module No)" value={editForm.module_no} onChange={setField('module_no')} />
                    <TextField id="ssl-e-battery" label="Battery Number" value={editForm.battery_serial_no} onChange={setField('battery_serial_no')} />
                    <TextField id="ssl-e-lat" label="Latitude" value={editForm.latitude} onChange={setField('latitude')} />
                    <TextField id="ssl-e-lng" label="Longitude" value={editForm.longitude} onChange={setField('longitude')} />

                    <div className="ula-m-full" style={{ display: 'flex', alignItems: 'center', gap: 'var(--ax-space-3)', flexWrap: 'wrap' }}>
                      <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={handleDetectGps} disabled={gpsDetecting}>
                        {gpsDetecting ? <span className="ax-spinner" /> : ICON_CROSSHAIR}
                        <span className="ax-btn__label">{gpsDetecting ? 'Locking GPS…' : 'Detect GPS'}</span>
                      </button>
                      {gpsMsg && <span className="ula-m-hint">{gpsMsg}</span>}
                    </div>

                    <div className="ax-field ula-m-full">
                      <label className="ax-label" htmlFor="ssl-e-file">Replace Light Photo (optional)</label>
                      <input
                        id="ssl-e-file"
                        type="file"
                        accept="image/*"
                        className="ax-input"
                        onChange={(e) => handlePickFile(e.target.files?.[0] || null)}
                      />
                      <span className="ax-help">
                        {editFile ? `${editFile.name} (${(editFile.size / 1024).toFixed(1)} KB)` : 'JPG or PNG, max 2 MB'}
                      </span>
                    </div>

                    {existingImage && (
                      <div className="ula-m-full" style={{ display: 'flex', alignItems: 'center', gap: 'var(--ax-space-3)' }}>
                        <LightThumbnail url={existingImage} alt={`Light #${editingId} - Current Photo`} onPreview={openPreview} />
                        <span className="ula-m-hint">Current photo. Add a new one only to replace it.</span>
                      </div>
                    )}

                    <div className="ax-field ula-m-full">
                      <label className="ax-label" htmlFor="ssl-e-remark">Remarks</label>
                      <textarea
                        id="ssl-e-remark"
                        className="ax-input"
                        rows={3}
                        value={editForm.remark}
                        onChange={(e) => setField('remark')(e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="ax-modal__footer">
              <button type="button" className="ax-btn ax-btn--ghost" onClick={closeEdit} disabled={editSubmitting}>Cancel</button>
              <button type="submit" className="ax-btn ax-btn--primary" disabled={editSubmitting || editLoading}>
                {editSubmitting ? <span className="ax-spinner" /> : 'Update details'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

export default Bihar_Installation_SSL_InstallationDetail;