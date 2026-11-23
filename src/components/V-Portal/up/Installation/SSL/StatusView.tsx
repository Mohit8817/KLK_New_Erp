import { useState, useMemo, useEffect, useCallback, useRef, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  upInstallationService,
  resolveUpMediaUrl,
  type UpSsl18wInstalledLightItem,
} from '../../up-services';
import {
  TableExportToolbar,
  SearchInput,
  Pagination,
  TableEmptyState,
  usePagination,
  copyTableDataToClipboard,
  exportDataToCSV,
  exportDataToExcel,
  printTableData,
  type ExportColumn,
} from '../../../../../common';

/* ───────── Types ───────── */
type Row = UpSsl18wInstalledLightItem;
export type SslStatusCategory = 'all' | 'installation' | 'verification' | 'claim' | 'payment';

export interface SslStatusMeta {
  key: string;
  label: string;
  category: SslStatusCategory;
  tone: 'accent' | 'cyan' | 'emerald' | 'amber' | 'violet' | 'pink' | 'red';
  sub: string;
}

/* ───────── Status catalog for UP SSL 18W ───────── */
export const UP_SSL_STATUS_CATALOG: SslStatusMeta[] = [
  { key: 'total', label: 'Total Lights', category: 'all', tone: 'accent', sub: 'All allocated SSL 18W street lights' },
  { key: 'accept', label: 'Accepted', category: 'all', tone: 'cyan', sub: 'Lights accepted for installation' },

  { key: 'complete', label: 'Complete', category: 'installation', tone: 'emerald', sub: 'Installation completed on site' },
  { key: 'pending', label: 'Pending', category: 'installation', tone: 'amber', sub: 'Installation still pending' },

  { key: 'verify-approved', label: 'Verify Approved', category: 'verification', tone: 'emerald', sub: 'Audited and approved by authority' },
  { key: 'verify-pending', label: 'Verify Pending', category: 'verification', tone: 'amber', sub: 'Awaiting inspection verification' },
  { key: 'verify-reject', label: 'Verify Rejected', category: 'verification', tone: 'red', sub: 'Verification rejected / rework required' },

  { key: 'claim-applicable', label: 'Claim Applicable', category: 'claim', tone: 'cyan', sub: 'Lights eligible for claim' },
  { key: 'claim-raised', label: 'Claim Raised', category: 'claim', tone: 'accent', sub: 'Vendor claim submitted' },
  { key: 'claim-not-applicable', label: 'Claim N/A', category: 'claim', tone: 'violet', sub: 'Claim not applicable' },
  { key: 'claim-verify-approved', label: 'Claim Verify Approved', category: 'claim', tone: 'emerald', sub: 'Claim verified & passed' },
  { key: 'claim-verify-pending', label: 'Claim Verify Pending', category: 'claim', tone: 'amber', sub: 'Claim verification in progress' },
  { key: 'claim-verify-reject', label: 'Claim Verify Rejected', category: 'claim', tone: 'red', sub: 'Claim rejected by authority' },

  { key: 'payment-complete', label: 'Payment Done', category: 'payment', tone: 'emerald', sub: 'Vendor payment disbursed' },
  { key: 'payment-pending', label: 'Payment Pending', category: 'payment', tone: 'red', sub: 'Vendor payment pending' },
];

const STATUS_META_MAP: Record<string, SslStatusMeta> = Object.fromEntries(
  UP_SSL_STATUS_CATALOG.map((m) => [m.key, m])
);

const CATEGORY_LABELS: { key: SslStatusCategory; label: string }[] = [
  { key: 'all', label: 'All Lights' },
  { key: 'installation', label: 'Installation' },
  { key: 'verification', label: 'Verification' },
  { key: 'claim', label: 'Claim' },
  { key: 'payment', label: 'Payment' },
];

/* ───────── Helpers ───────── */
const DASH = '—';
const txt = (v: unknown) => (v === null || v === undefined || v === '' ? DASH : String(v));

type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

const Badge = ({ tone, children }: { tone: Tone; children: ReactNode }) => (
  <span className={`ax-badge ax-badge--soft ax-badge--${tone}`}>{children}</span>
);

type VerifyState = 'approved' | 'rejected' | 'pending';

const verifyState = (r: Row): VerifyState => {
  const v = Number(r.inst_verify_status ?? r.verify_status ?? 0);
  if (v === 1) return 'approved';
  if (v === 2) return 'rejected';
  return 'pending';
};
const verifyLabel = (s: VerifyState) => (s === 'approved' ? 'Approved' : s === 'rejected' ? 'Rejected' : 'Pending');
const verifyTone = (s: VerifyState): Tone => (s === 'approved' ? 'success' : s === 'rejected' ? 'danger' : 'warning');

const claimOf = (r: Row): number => {
  const raw =
    r.inst_claim_status !== undefined && r.inst_claim_status !== null
      ? r.inst_claim_status
      : r.claim_status !== undefined && r.claim_status !== null
        ? r.claim_status
        : 0;

  if (typeof raw === 'string') {
    const s = raw.trim().toLowerCase();
    if (s === '2' || s === 'approved' || s === 'claim approved' || s === 'claim-approved') return 2;
    if (s === '3' || s === 'reject' || s === 'rejected' || s === 'claim rejected' || s === 'claim-rejected') return 3;
    if (s === '1' || s === 'claim applicable' || s === 'claim-applicable' || s === 'applicable') return 1;
    if (s === '0' || s === 'not applicable' || s === 'not-applicable' || s === 'not_applicable' || s === 'na' || s === 'n/a') return 0;
    const n = Number(raw);
    return Number.isNaN(n) ? 0 : n;
  }
  const n = Number(raw);
  return Number.isNaN(n) ? 0 : n;
};
const payOf = (r: Row) => Number(r.payment_status ?? r.inst_pay_status ?? 0);
const claimLabel = (c: number) => (c === 2 ? 'Approved' : c === 3 ? 'Reject' : c === 1 ? 'Claim Applicable' : 'Not Applicable');
const instDate = (r: Row) => r.installation_date || r.inst_date;

const VerifyBadge = ({ row }: { row: Row }) => {
  const s = verifyState(row);
  return <Badge tone={verifyTone(s)}>{verifyLabel(s)}</Badge>;
};

const ClaimBadge = ({ status }: { status: number }) => {
  if (status === 2) return <Badge tone="success">Approved</Badge>;
  if (status === 3) return <Badge tone="danger">Reject</Badge>;
  if (status === 1) return <Badge tone="info">Claim Applicable</Badge>;
  return <Badge tone="neutral">Not Applicable</Badge>;
};

const PaymentBadge = ({ status }: { status: number }) =>
  status === 1 ? <Badge tone="success">Paid</Badge> : <Badge tone="warning">Pending</Badge>;

const fmtTime = (d: Date) => d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();

const rowImage = (r: Row): string => (r.light_file ? resolveUpMediaUrl(r.light_file) || '' : '');
const rowLabel = (r: Row) => r.uid || `#${r.id}`;

/* ───────── Modal (portal to <body>, focus trap, Esc to close) ───────── */
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
    <Modal open onClose={onClose} labelledBy="upsslsv-preview-title" dialogClass="ax-modal__dialog--lg">
      <div className="ax-modal__header">
        <h2 className="ax-modal__title" id="upsslsv-preview-title">{title || 'Photo Preview'}</h2>
        <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">{X_ICON}</button>
      </div>

      <div className="ax-modal__body" style={{ padding: 0 }}>
        <div className="ula-m-stage">
          {status === 'loading' && <div className="ula-m-stage__msg"><span className="ax-spinner" /> Loading photo…</div>}
          {status === 'error' && <div className="ula-m-stage__msg">Photo could not be loaded. Try opening it in a new tab.</div>}
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

/* ───────── Thumbnail (click to preview) ───────── */
function LightThumbnail({
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
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) return <span style={{ color: 'var(--ax-text-subtle)' }}>{DASH}</span>;

  return (
    <img
      src={src}
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
      onClick={() => onPreview(src, alt)}
      title="Click to preview"
    />
  );
}

/* ───────── Action dropdown (menu rendered in <body> so the table never clips it) ───────── */
const MENU_W = 170;

function RowActionDropdown({ onView, onPhoto }: { onView: () => void; onPhoto?: () => void }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuH = onPhoto ? 76 : 40;

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
            <button type="button" className="ula-menu__item" role="menuitem" onClick={() => { setOpen(false); onView(); }}>
              View Details
            </button>
            {onPhoto && (
              <button type="button" className="ula-menu__item" role="menuitem" onClick={() => { setOpen(false); onPhoto(); }}>
                View Photo
              </button>
            )}
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
  .ax-modal__backdrop { position: fixed; inset: 0; background: transparent; }
  .ax-modal__dialog {
    position: relative; z-index: 1; background: #ffffff;
    border-radius: 16px; border: 1px solid var(--ax-border, #e2e8f0);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    overflow: hidden; width: 100%;
  }
  .ax-modal__dialog--md { max-width: 680px; }
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
  .ula-m-info--full { grid-column: 1 / -1; }
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
  .solar-erp-page .ax-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }

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
const monoCell = { fontFamily: 'var(--ax-font-mono)', fontSize: '12px' } as const;

/* ───────── KPI card ───────── */
type KpiTone = 'accent' | 'cyan' | 'emerald' | 'amber' | 'violet' | 'pink' | 'red';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(var(--ax-accent-rgb), 0.12)', fg: 'var(--ax-accent)' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan) 14%, transparent)', fg: 'var(--ax-viz-cyan)' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald) 14%, transparent)', fg: 'var(--ax-viz-emerald)' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber) 14%, transparent)', fg: 'var(--ax-viz-amber)' },
  violet: { bg: 'color-mix(in oklab, var(--ax-viz-violet) 14%, transparent)', fg: 'var(--ax-viz-violet)' },
  pink: { bg: 'color-mix(in oklab, var(--ax-viz-pink) 14%, transparent)', fg: 'var(--ax-viz-pink)' },
  red: { bg: 'color-mix(in oklab, var(--ax-viz-red) 14%, transparent)', fg: 'var(--ax-viz-red)' },
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

const COLUMN_HEADERS = [
  'Sr. No.',
  'UID',
  'District',
  'Block',
  'Panchayat',
  'Ward No.',
  'Pole No.',
  'Beneficiary Name',
  'Contact No.',
  'Light No.',
  'UUID No.',
  'Installation Date',
  'Light Photo',
  'Verify Status',
  'Claim Status',
  'Payment Status',
  'Action',
];

export function UP_Installation_SSL_StatusView() {
  const [searchParams, setSearchParams] = useSearchParams();

  const currentStatus = searchParams.get('status') || 'complete';
  const rawDistrict = searchParams.get('district') || '';
  const selectedDistrict = rawDistrict || 'all';
  const isAllDistricts = !rawDistrict || rawDistrict === 'all' || rawDistrict === 'All';

  const [items, setItems] = useState<Row[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [updatedAt, setUpdatedAt] = useState<Date>(new Date());

  const [search, setSearch] = useState<string>('');
  const [verifyFilter, setVerifyFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');

  const [preview, setPreview] = useState<{ url: string; title: string } | null>(null);
  const openPreview = useCallback((url: string, title: string) => setPreview({ url, title }), []);
  const closePreview = useCallback(() => setPreview(null), []);
  const [detailItem, setDetailItem] = useState<Row | null>(null);

  const currentMeta: SslStatusMeta = STATUS_META_MAP[currentStatus] || {
    key: currentStatus,
    label: currentStatus.replace(/[-_]/g, ' ').toUpperCase(),
    category: 'all',
    tone: 'accent',
    sub: `Filtered by ${currentStatus}`,
  };

  // Load status data
  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = !isAllDistricts
        ? await upInstallationService.getSsl18wDashboardByDistrict(currentStatus, rawDistrict)
        : await upInstallationService.getSsl18wDashboardByStatus(currentStatus);
      const list = Array.isArray(data) ? data : [];
      setItems(list);
      setUpdatedAt(new Date());

      // Keep every district we have seen so the dropdown does not shrink after filtering
      if (list.length > 0) {
        setDistricts((prev) => {
          const set = new Set([...prev, ...(list.map((d) => d.district).filter(Boolean) as string[])]);
          return Array.from(set).sort();
        });
      }
    } catch (err: any) {
      console.error('[UP SSL StatusView] loadData error:', err);
      setErrorMsg(err?.message || 'Failed to load UP SSL 18W status records from server.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [currentStatus, rawDistrict, isAllDistricts]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Status switcher
  const handleStatusChange = (statusKey: string) => {
    const p = new URLSearchParams(searchParams);
    p.set('status', statusKey);
    setSearchParams(p);
  };

  // District switcher
  const handleDistrictChange = (district: string) => {
    const p = new URLSearchParams(searchParams);
    p.set('status', currentStatus);
    if (!district || district === 'all' || district === 'All') p.delete('district');
    else p.set('district', district);
    setSearchParams(p);
  };

  // KPI counts
  const summary = useMemo(() => {
    const total = items.length;
    const vApp = items.filter((r) => verifyState(r) === 'approved').length;
    const vRej = items.filter((r) => verifyState(r) === 'rejected').length;
    const vPend = items.filter((r) => verifyState(r) === 'pending').length;
    const claimRaised = items.filter((r) => claimOf(r) === 1).length;
    const claimApproved = items.filter((r) => claimOf(r) === 2).length;
    const paid = items.filter((r) => payOf(r) === 1).length;
    return { total, vApp, vRej, vPend, claimRaised, claimApproved, paid };
  }, [items]);

  // District options
  const districtOptions = useMemo(() => {
    const set = new Set<string>(districts);
    items.forEach((r) => r.district && set.add(String(r.district).trim()));
    if (!isAllDistricts) set.add(rawDistrict);
    return Array.from(set).sort();
  }, [districts, items, rawDistrict, isAllDistricts]);

  // Client-side search + verify filter
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((r) => {
      if (verifyFilter !== 'all' && verifyState(r) !== verifyFilter) return false;
      if (!q) return true;
      return Object.values(r).some((v) => v !== null && v !== undefined && String(v).toLowerCase().includes(q));
    });
  }, [items, search, verifyFilter]);

  const { paginatedData, currentPage, pageSize, totalItems, setPage, setPageSize } =
    usePagination({ data: filtered, initialPageSize: 100 });

  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, verifyFilter, currentStatus, rawDistrict]);

  const hasFilters = search.trim() !== '' || verifyFilter !== 'all' || !isAllDistricts;
  const resetFilters = () => {
    setSearch('');
    setVerifyFilter('all');
    const p = new URLSearchParams(searchParams);
    p.delete('district');
    setSearchParams(p);
    setPage(1);
  };

  // Export
  const exportCols: ExportColumn<Row>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r, idx) => (idx !== undefined ? idx + 1 : '') },
      { header: 'UID', accessor: (r) => r.uid || DASH },
      { header: 'District', accessor: (r) => r.district || DASH },
      { header: 'Block', accessor: (r) => r.block || DASH },
      { header: 'Panchayat', accessor: (r) => r.panchayat || DASH },
      { header: 'Ward No.', accessor: (r) => r.ward_no || DASH },
      { header: 'Pole No.', accessor: (r) => r.pole_no || DASH },
      { header: 'Beneficiary Name', accessor: (r) => r.beneficiary_name || DASH },
      { header: 'Contact', accessor: (r) => r.beneficiary_contact || DASH },
      { header: 'Installation Date', accessor: (r) => instDate(r) || DASH },
      { header: 'Light No.', accessor: (r) => r.light_no || DASH },
      { header: 'UUID No.', accessor: (r) => r.uuid_no || DASH },
      { header: 'Battery No.', accessor: (r) => r.battery_serial_no || DASH },
      { header: 'Panel No.', accessor: (r) => r.panel_no || DASH },
      { header: 'Verify Status', accessor: (r) => verifyLabel(verifyState(r)) },
      { header: 'Claim Status', accessor: (r) => claimLabel(claimOf(r)) },
      { header: 'Payment Status', accessor: (r) => (payOf(r) === 1 ? 'Paid' : 'Pending') },
      { header: 'Remarks', accessor: (r) => r.remark || r.inst_remarks || DASH },
    ],
    []
  );

  const pageTitle = `UP SSL 18W Lights: ${currentMeta.label}${!isAllDistricts ? ` (${rawDistrict})` : ''}`;
  const fileBase = `UP_SSL_18W_${currentStatus}`;

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="UP SSL 18W Installation Data"
        subtitle={`Viewing ${currentMeta.label}${!isAllDistricts ? ` in ${rawDistrict}` : ''} — Master register of solar street light installations, verification, claims and payment status · Updated ${fmtTime(updatedAt)}`}
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Uttar Pradesh' },
          { label: 'Installation' },
          { label: 'SSL 18W Dashboard', href: '/v/up/ssl-18w-installation-dashboard' },
          { label: currentMeta.label },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)' }}>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={loadData} disabled={loading}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}>
                <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
                <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
              </svg>
              Refresh
            </button>
            <Link to="/v/up/ssl-18w-installation-dashboard" className="ax-btn ax-btn--secondary ax-btn--sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}>
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </Link>
          </div>
        }
      />

      {errorMsg && (
        <div className="ax-alert ax-alert--danger" style={{ marginBottom: 'var(--ax-space-4)' }} role="status">
          <div className="ax-alert__title">Error</div>
          <div className="ax-alert__text">{errorMsg}</div>
        </div>
      )}

      {/* ── Top Metric KPI Cards (4 in 1 row) ── */}
      <div className="asw-cards-row">
        <KpiCard
          tone={currentMeta.tone}
          label={`${currentMeta.label} Total`}
          value={summary.total.toLocaleString('en-IN')}
          sub={!isAllDistricts ? `Filtered in ${rawDistrict}` : 'Across all UP districts'}
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
          tone="cyan"
          label="Claim Approved"
          value={summary.claimApproved.toLocaleString('en-IN')}
          sub={`${summary.claimRaised} claim raised · ${summary.vPend} audit pending`}
          icon={svgIcon(<><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 15" /></>)}
        />
        <KpiCard
          tone="violet"
          label="Payment Settled"
          value={summary.paid.toLocaleString('en-IN')}
          sub={`${summary.vRej} audit rejected`}
          icon={svgIcon(<><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>)}
        />
      </div>

      {/* ── Main Table Card ── */}
      <section className="ax-card ax-col--12" role="region" aria-label="UP SSL 18W Installations">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">{pageTitle}</h2>
            <p className="ax-card__subtitle">
              <span className="ax-num">{filtered.length}</span> of <span className="ax-num">{items.length}</span> lights
              {' '}· Status: <b>{currentMeta.label}</b>
              {' '}· Approved <b className="ax-num">{summary.vApp}</b> · Pending <b className="ax-num">{summary.vPend}</b> · Rejected <b className="ax-num">{summary.vRej}</b>
            </p>
          </div>
          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              {/* Status Switcher */}
              <select
                id="upsslsv_status_category_filter"
                className="ax-input ax-input--sm"
                style={{ width: 190, height: 32, fontSize: 'var(--ax-text-xs)' }}
                value={currentStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
                aria-label="Status category"
              >
                {CATEGORY_LABELS.map((cat) => (
                  <optgroup key={cat.key} label={cat.label}>
                    {UP_SSL_STATUS_CATALOG.filter((s) => s.category === cat.key).map((sm) => (
                      <option key={sm.key} value={sm.key}>{sm.label}</option>
                    ))}
                  </optgroup>
                ))}
                {!STATUS_META_MAP[currentStatus] && <option value={currentStatus}>{currentMeta.label}</option>}
              </select>

              {/* District Filter */}
              <select
                id="upsslsv_district_filter"
                className="ax-input ax-input--sm"
                style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                value={isAllDistricts ? 'all' : selectedDistrict}
                onChange={(e) => handleDistrictChange(e.target.value)}
                aria-label="Filter by district"
              >
                <option value="all">All Districts ({districtOptions.length})</option>
                {districtOptions.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>

              {/* Verify Status Filter */}
              <select
                id="upsslsv_verify_filter"
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
                placeholder="Search UID, ward, pole, beneficiary…"
                size="sm"
                ariaLabel="Search street lights"
              />

              <TableExportToolbar
                onCopy={() => copyTableDataToClipboard(filtered, exportCols)}
                onExportCSV={() => exportDataToCSV(fileBase, filtered, exportCols)}
                onExportExcel={() => exportDataToExcel(fileBase, filtered, exportCols)}
                onExportPDF={() => printTableData(pageTitle, filtered, exportCols)}
              />
            </div>
          </div>
        </div>

        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap', minWidth: 1900 }}>
            <caption className="ax-visually-hidden">UP SSL 18W Installation Data</caption>
            <thead className="ax-table__head">
              <tr>
                {COLUMN_HEADERS.map((h) => (
                  <th key={h} className="ax-table__th" scope="col" style={h === 'Action' ? { textAlign: 'center' } : undefined}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody aria-busy={loading}>
              {loading && (
                <tr>
                  <td className="ax-table__td" colSpan={COLUMN_HEADERS.length} style={centerCell}>
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading UP SSL 18W records from server…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td className="ax-table__td" colSpan={COLUMN_HEADERS.length} style={{ padding: 0 }}>
                    <TableEmptyState
                      title="No street light records found"
                      message={
                        hasFilters
                          ? 'No records match your filters or search. Try clearing your query.'
                          : `There are currently no records in status "${currentMeta.label}".`
                      }
                      onClear={hasFilters ? resetFilters : undefined}
                      clearLabel="Clear filters"
                    />
                  </td>
                </tr>
              )}
              {!loading &&
                paginatedData.map((row, index) => {
                  const img = rowImage(row);
                  const label = rowLabel(row);
                  const vs = verifyState(row);

                  return (
                    <tr key={row.id || index} className="ax-table__row">
                      <td className="ax-table__td ax-num">{(currentPage - 1) * pageSize + index + 1}</td>
                      <td className="ax-table__td" style={{ fontWeight: 700, color: 'var(--ax-accent)' }}>{label}</td>
                      <td className="ax-table__td"><b>{txt(row.district)}</b></td>
                      <td className="ax-table__td">{txt(row.block)}</td>
                      <td className="ax-table__td">{txt(row.panchayat)}</td>
                      <td className="ax-table__td" style={monoCell}>{txt(row.ward_no)}</td>
                      <td className="ax-table__td" style={monoCell}>{txt(row.pole_no)}</td>
                      <td className="ax-table__td">
                        <span style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>{txt(row.beneficiary_name)}</span>
                      </td>
                      <td className="ax-table__td" style={monoCell}>{txt(row.beneficiary_contact)}</td>
                      <td className="ax-table__td" style={monoCell}>{txt(row.light_no)}</td>
                      <td className="ax-table__td" style={monoCell}>{txt(row.uuid_no)}</td>
                      <td className="ax-table__td">{txt(instDate(row))}</td>

                      {/* Photo thumbnail */}
                      <td className="ax-table__td">
                        <LightThumbnail src={img} alt={`Light ${label} - Photo`} onPreview={openPreview} />
                      </td>

                      {/* Status badges */}
                      <td className="ax-table__td">
                        <VerifyBadge row={row} />
                        {row.inst_verify_remarks && (
                          <div style={{ fontSize: 11, marginTop: 2, color: vs === 'rejected' ? 'var(--ax-danger, #ef4444)' : 'var(--ax-text-muted)' }}>
                            {row.inst_verify_remarks}
                          </div>
                        )}
                      </td>
                      <td className="ax-table__td"><ClaimBadge status={claimOf(row)} /></td>
                      <td className="ax-table__td"><PaymentBadge status={payOf(row)} /></td>

                      {/* Action */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <RowActionDropdown
                          onView={() => setDetailItem(row)}
                          onPhoto={img ? () => openPreview(img, `Light ${label} - Photo`) : undefined}
                        />
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
      {preview && <ImagePreviewModal url={preview.url} title={preview.title} onClose={closePreview} />}

      {/* ── Detail View Modal ── */}
      <Modal open={!!detailItem} onClose={() => setDetailItem(null)} labelledBy="upsslsv-detail-title" dialogClass="ax-modal__dialog--md">
        {detailItem && (
          <div>
            <div className="ax-modal__header">
              <div>
                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700 }} id="upsslsv-detail-title">
                  SSL 18W Light Record {rowLabel(detailItem)}
                </h4>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--ax-text-muted)' }}>
                  {detailItem.district ? `District: ${detailItem.district} · ` : ''}State: Uttar Pradesh
                </p>
              </div>
              <button type="button" className="ax-modal__close" onClick={() => setDetailItem(null)} aria-label="Close dialog">
                {X_ICON}
              </button>
            </div>
            <div className="ax-modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="ula-m-grid">
                <div className="ula-m-info"><span>District:</span> <b>{txt(detailItem.district)}</b></div>
                <div className="ula-m-info"><span>Block:</span> <b>{txt(detailItem.block)}</b></div>
                <div className="ula-m-info"><span>Panchayat:</span> <b>{txt(detailItem.panchayat)}</b></div>
                <div className="ula-m-info"><span>Ward / Pole:</span> <b>W: {txt(detailItem.ward_no)} / P: {txt(detailItem.pole_no)}</b></div>
                <div className="ula-m-info"><span>Beneficiary:</span> <b>{txt(detailItem.beneficiary_name)}</b></div>
                <div className="ula-m-info"><span>Contact No:</span> <b>{txt(detailItem.beneficiary_contact)}</b></div>
                <div className="ula-m-info"><span>Installation Date:</span> <b>{txt(instDate(detailItem))}</b></div>
                <div className="ula-m-info"><span>Light No.:</span> <b>{txt(detailItem.light_no)}</b></div>
                <div className="ula-m-info"><span>UUID No.:</span> <b>{txt(detailItem.uuid_no)}</b></div>
                <div className="ula-m-info"><span>Battery Serial No.:</span> <b>{txt(detailItem.battery_serial_no)}</b></div>
                <div className="ula-m-info"><span>Panel No.:</span> <b>{txt(detailItem.panel_no)}</b></div>
                <div className="ula-m-info"><span>Lat / Long:</span> <b>{txt(detailItem.latitude)} / {txt(detailItem.longitude)}</b></div>
                <div className="ula-m-info"><span>Verification:</span> <b>{verifyLabel(verifyState(detailItem))}</b></div>
                <div className="ula-m-info"><span>Claim:</span> <b>{claimLabel(claimOf(detailItem))}</b></div>
                <div className="ula-m-info"><span>Payment:</span> <b>{payOf(detailItem) === 1 ? 'Paid' : 'Pending'}</b></div>
                {detailItem.inst_verify_remarks && (
                  <div className="ula-m-info ula-m-info--full">
                    <span>Verify Remarks:</span>
                    <b style={{ color: verifyState(detailItem) === 'rejected' ? 'var(--ax-danger, #ef4444)' : undefined }}>
                      {detailItem.inst_verify_remarks}
                    </b>
                  </div>
                )}
                <div className="ula-m-info ula-m-info--full">
                  <span>Remarks:</span> <b>{txt(detailItem.remark || detailItem.inst_remarks)}</b>
                </div>
              </div>

              {/* Photo */}
              {(() => {
                const img = rowImage(detailItem);
                return (
                  <div style={{ border: '1px solid var(--ax-border)', borderRadius: 6, padding: 6, textAlign: 'center' }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ax-text-muted)', marginBottom: 4 }}>Light Photo</div>
                    {img ? (
                      <img
                        src={img}
                        alt="Light photo"
                        style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 0, border: '1px solid var(--ax-border)', cursor: 'zoom-in' }}
                        onClick={() => openPreview(img, `Light ${rowLabel(detailItem)} - Photo`)}
                      />
                    ) : (
                      <div style={{ height: 110, background: 'var(--ax-surface-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ax-text-muted)', fontSize: 11 }}>
                        N/A
                      </div>
                    )}
                  </div>
                );
              })()}
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

export default UP_Installation_SSL_StatusView;