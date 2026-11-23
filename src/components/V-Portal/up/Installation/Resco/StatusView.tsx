import { useState, useMemo, useEffect, useCallback, useRef, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  upInstallationService,
  resolveUpMediaUrl,
  type UpRescoDashboardCounts,
} from '../../up-services';
import {
  Pagination,
  usePagination,
  SearchInput,
  TableExportToolbar,
  TableEmptyState,
  type ExportColumn,
} from '../../../../../common';

/* ───────── Helpers ───────── */
const DASH = '—';

const num = (x: unknown) => {
  const v = Number(x ?? 0);
  return isNaN(v) ? String(x ?? '0') : v.toLocaleString('en-IN');
};

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const pickStr = (obj: any, ...keys: string[]): string => {
  if (!obj) return '';
  for (const k of keys) {
    const v = obj[k];
    if (v !== null && v !== undefined && String(v).trim() !== '') return String(v).trim();
  }
  return '';
};

const pickNum = (obj: any, ...keys: string[]): number | undefined => {
  if (!obj) return undefined;
  for (const k of keys) {
    const v = obj[k];
    if (v !== null && v !== undefined && v !== '' && !isNaN(Number(v))) return Number(v);
  }
  return undefined;
};

type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

const Badge = ({ tone, children }: { tone: Tone; children: ReactNode }) => (
  <span className={`ax-badge ax-badge--soft ax-badge--${tone}`}>{children}</span>
);

/* ───────── Status Catalog (Endpoint 18 & 19) ───────── */
export interface StatusOption {
  id: string;
  label: string;
  group: 'Installation' | 'Verification' | 'Document' | 'Claim 1' | 'Claim 2' | 'Claim 3' | 'Payment 1' | 'Payment 2' | 'Payment 3';
  tone: 'accent' | 'cyan' | 'emerald' | 'amber' | 'violet' | 'pink' | 'red';
  countKey?: keyof UpRescoDashboardCounts | string;
}

export const RESCO_STATUS_OPTIONS: StatusOption[] = [
  { id: 'total', label: 'Total Sites', group: 'Installation', tone: 'accent', countKey: 'site_count' },
  { id: 'complete', label: 'Installation Complete', group: 'Installation', tone: 'emerald', countKey: 'complete' },
  { id: 'pending', label: 'Installation Pending', group: 'Installation', tone: 'amber', countKey: 'pending' },

  { id: 'verify-approved', label: 'Verify Approved', group: 'Verification', tone: 'emerald', countKey: 'verify_approved' },
  { id: 'verify-pending', label: 'Verify Pending', group: 'Verification', tone: 'amber', countKey: 'verify_pending' },
  { id: 'verify-reject', label: 'Verify Rejected', group: 'Verification', tone: 'red', countKey: 'verify_reject' },

  { id: 'doc-approved', label: 'Doc Approved', group: 'Document', tone: 'emerald', countKey: 'doc_approved' },
  { id: 'doc-pending', label: 'Doc Pending', group: 'Document', tone: 'amber', countKey: 'doc_pending' },
  { id: 'doc-reject', label: 'Doc Rejected', group: 'Document', tone: 'red', countKey: 'doc_reject' },

  { id: 'inst-claim1-applicable', label: 'Claim 1 Applicable', group: 'Claim 1', tone: 'cyan', countKey: 'inst_claim1_applicable' },
  { id: 'inst-claim1-raised', label: 'Claim 1 Raised', group: 'Claim 1', tone: 'accent', countKey: 'inst_claim1_raised' },
  { id: 'inst-claim1-approved', label: 'Claim 1 Approved', group: 'Claim 1', tone: 'emerald', countKey: 'inst_claim1_approved' },
  { id: 'inst-claim1-pending', label: 'Claim 1 Pending', group: 'Claim 1', tone: 'amber', countKey: 'inst_claim1_pending' },
  { id: 'inst-claim1-reject', label: 'Claim 1 Rejected', group: 'Claim 1', tone: 'red', countKey: 'inst_claim1_reject' },

  { id: 'inst-claim2-applicable', label: 'Claim 2 Applicable', group: 'Claim 2', tone: 'cyan', countKey: 'inst_claim2_applicable' },
  { id: 'inst-claim2-raised', label: 'Claim 2 Raised', group: 'Claim 2', tone: 'accent', countKey: 'inst_claim2_raised' },
  { id: 'inst-claim2-approved', label: 'Claim 2 Approved', group: 'Claim 2', tone: 'emerald', countKey: 'inst_claim2_approved' },
  { id: 'inst-claim2-pending', label: 'Claim 2 Pending', group: 'Claim 2', tone: 'amber', countKey: 'inst_claim2_pending' },
  { id: 'inst-claim2-reject', label: 'Claim 2 Rejected', group: 'Claim 2', tone: 'red', countKey: 'inst_claim2_reject' },

  { id: 'inst-claim3-applicable', label: 'Claim 3 Applicable', group: 'Claim 3', tone: 'cyan', countKey: 'inst_claim3_applicable' },
  { id: 'inst-claim3-raised', label: 'Claim 3 Raised', group: 'Claim 3', tone: 'accent', countKey: 'inst_claim3_raised' },
  { id: 'inst-claim3-approved', label: 'Claim 3 Approved', group: 'Claim 3', tone: 'emerald', countKey: 'inst_claim3_approved' },
  { id: 'inst-claim3-pending', label: 'Claim 3 Pending', group: 'Claim 3', tone: 'amber', countKey: 'inst_claim3_pending' },
  { id: 'inst-claim3-reject', label: 'Claim 3 Rejected', group: 'Claim 3', tone: 'red', countKey: 'inst_claim3_reject' },

  { id: 'inst-pay1-complete', label: 'Payment 1 Complete', group: 'Payment 1', tone: 'emerald', countKey: 'inst_pay1_complete' },
  { id: 'inst-pay1-partially', label: 'Payment 1 Partial', group: 'Payment 1', tone: 'amber', countKey: 'inst_pay1_partially' },
  { id: 'inst-pay1-pending', label: 'Payment 1 Pending', group: 'Payment 1', tone: 'violet', countKey: 'inst_pay1_pending' },

  { id: 'inst-pay2-complete', label: 'Payment 2 Complete', group: 'Payment 2', tone: 'emerald', countKey: 'inst_pay2_complete' },
  { id: 'inst-pay2-partially', label: 'Payment 2 Partial', group: 'Payment 2', tone: 'amber', countKey: 'inst_pay2_partially' },
  { id: 'inst-pay2-pending', label: 'Payment 2 Pending', group: 'Payment 2', tone: 'violet', countKey: 'inst_pay2_pending' },

  { id: 'inst-pay3-complete', label: 'Payment 3 Complete', group: 'Payment 3', tone: 'emerald', countKey: 'inst_pay3_complete' },
  { id: 'inst-pay3-partially', label: 'Payment 3 Partial', group: 'Payment 3', tone: 'amber', countKey: 'inst_pay3_partially' },
  { id: 'inst-pay3-pending', label: 'Payment 3 Pending', group: 'Payment 3', tone: 'violet', countKey: 'inst_pay3_pending' },
];

const STATUS_GROUPS = Array.from(new Set(RESCO_STATUS_OPTIONS.map((o) => o.group)));

const normalizeStatusKey = (s?: string): string => {
  if (!s) return 'total';
  const clean = s.toLowerCase().trim().replace(/_/g, '-');
  if (clean === 'site-count' || clean === 'all') return 'total';
  if (clean === 'installed') return 'complete';
  return clean;
};

/* ───────── Row helpers ───────── */
const siteImg = (raw: unknown): string => (raw ? resolveUpMediaUrl(raw as any) || '' : '');

const getImages = (s: any) => ({
  system: siteImg(s.system_image),
  inverter: siteImg(s.inverter_image),
  panel: siteImg(s.panel_image),
  meter: siteImg(s.net_meter_smart_meter_image || s.nm_sm_image || s.meter_image),
  logger: siteImg(s.loger_image || s.logger_image),
});

const isSiteInstalled = (s: any) =>
  Boolean(pickStr(s, 'installation_date', 'inst_date') || pickStr(s, 'inverter_no') || Number(s.inst_status) === 1);

const verifyOf = (s: any) => pickNum(s, 'verify_status', 'inst_verify_status');
const docOf = (s: any) => pickNum(s, 'document_status', 'inst_doc_status');

const verifyLabel = (v?: number) => (v === 1 ? 'Approved' : v === 2 ? 'Rejected' : 'Pending');
const docLabel = (v?: number) => (v === 1 ? 'Approved' : v === 2 ? 'Rejected' : 'Pending');

const VerifyBadge = ({ value }: { value?: number }) => (
  <Badge tone={value === 1 ? 'success' : value === 2 ? 'danger' : 'warning'}>{verifyLabel(value)}</Badge>
);
const DocBadge = ({ value }: { value?: number }) => (
  <Badge tone={value === 1 ? 'success' : value === 2 ? 'danger' : 'neutral'}>{docLabel(value)}</Badge>
);
const InstallBadge = ({ installed }: { installed: boolean }) =>
  installed ? <Badge tone="success">Installed</Badge> : <Badge tone="warning">Pending</Badge>;

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
    <Modal open onClose={onClose} labelledBy="uprsv-preview-title" dialogClass="ax-modal__dialog--lg">
      <div className="ax-modal__header">
        <h2 className="ax-modal__title" id="uprsv-preview-title">{title || 'Media Preview'}</h2>
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

/* ───────── Thumbnail (click to preview) ───────── */
function SiteThumbnail({
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
const MENU_H = 40;

function RowActionDropdown({ onView }: { onView: () => void }) {
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

/* ───────── KPI card (same as Karnataka status view) ───────── */
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
  'Site ID',
  'Site Name',
  'District',
  'CA No.',
  'Department',
  'Contact Person',
  'Contact No.',
  'Installation Date',
  'Inverter No.',
  'Solar Meter No.',
  'Net / Smart Meter No.',
  'Logger No.',
  'System Photo',
  'Inverter Photo',
  'Panel Photo',
  'Meter Photo',
  'Logger Photo',
  'Latitude',
  'Longitude',
  'Remark',
  'Install Status',
  'Verify Status',
  'Document Status',
  'Action',
];

/* ───────── Main Component ───────── */
export function UP_Installation_Resco_StatusView() {
  const { status: paramStatus } = useParams<{ status?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const currentStatus = useMemo(
    () => normalizeStatusKey(paramStatus || searchParams.get('status') || 'total'),
    [paramStatus, searchParams]
  );
  const selectedDistrict = (searchParams.get('district') || '').trim();
  const isAllDistricts = !selectedDistrict || selectedDistrict === 'All' || selectedDistrict === 'all';

  const [loading, setLoading] = useState(true);
  const [sites, setSites] = useState<any[]>([]);
  const [counts, setCounts] = useState<UpRescoDashboardCounts | null>(null);
  const [districts, setDistricts] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [verifyFilter, setVerifyFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');

  const [preview, setPreview] = useState<{ url: string; title: string } | null>(null);
  const openPreview = useCallback((url: string, title: string) => setPreview({ url, title }), []);
  const closePreview = useCallback(() => setPreview(null), []);
  const [detailSite, setDetailSite] = useState<any | null>(null);

  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);
  useEffect(() => {
    if (!toastMsg) return;
    const t = window.setTimeout(() => setToastMsg(null), 4000);
    return () => window.clearTimeout(t);
  }, [toastMsg]);

  // Summary counts (Endpoint 17) — used for dropdown labels
  useEffect(() => {
    let cancelled = false;
    upInstallationService
      .getRescoDashboard()
      .then((data) => {
        if (!cancelled && data) setCounts(data);
      })
      .catch((e) => console.warn('Could not fetch Resco dashboard counts:', e));
    return () => { cancelled = true; };
  }, []);

  // Status records (Endpoint 18 / 19)
  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = !isAllDistricts
        ? await upInstallationService.getRescoDashboardByDistrict(currentStatus, selectedDistrict)
        : await upInstallationService.getRescoDashboardByStatus(currentStatus);
      const list = Array.isArray(data) ? data : [];
      setSites(list);

      const discovered = list.map((s) => pickStr(s, 'district', 'District')).filter(Boolean);
      if (discovered.length > 0) setDistricts((prev) => Array.from(new Set([...prev, ...discovered])).sort());
    } catch (err: any) {
      console.error('[UP Resco StatusView] Error fetching data:', err);
      setErrorMsg(err?.message || 'Failed to fetch status records from server. Please try again.');
      setToastMsg({ type: 'danger', text: err?.message || 'Failed to load installation sites from server.' });
      setSites([]);
    } finally {
      setLoading(false);
    }
  }, [currentStatus, selectedDistrict, isAllDistricts]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeMeta: StatusOption = useMemo(
    () =>
      RESCO_STATUS_OPTIONS.find((o) => o.id === currentStatus) || {
        id: currentStatus,
        label: currentStatus.replace(/-/g, ' ').toUpperCase(),
        group: 'Installation' as const,
        tone: 'accent' as const,
      },
    [currentStatus]
  );

  // Navigation helpers (route + query params)
  const goTo = (status: string, district: string) => {
    const q = new URLSearchParams(searchParams);
    q.delete('status');
    if (district && district !== 'All' && district !== 'all') q.set('district', district);
    else q.delete('district');
    const qs = q.toString();
    navigate(`/v/up/resco-installation-view-dashboard/${status}${qs ? `?${qs}` : ''}`);
  };
  const handleStatusChange = (s: string) => goTo(normalizeStatusKey(s), selectedDistrict);
  const handleDistrictChange = (d: string) => goTo(currentStatus, d);

  const districtOptions = useMemo(() => {
    const set = new Set<string>(districts);
    if (!isAllDistricts) set.add(selectedDistrict);
    return Array.from(set).sort();
  }, [districts, selectedDistrict, isAllDistricts]);

  // Search + verify filter
  const filteredSites = useMemo(() => {
    let list = sites;

    if (verifyFilter !== 'all') {
      list = list.filter((s) => {
        const v = verifyOf(s);
        if (verifyFilter === 'approved') return v === 1;
        if (verifyFilter === 'rejected') return v === 2;
        return v !== 1 && v !== 2;
      });
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((s) =>
        [
          String(s.id ?? ''),
          pickStr(s, 'site_name', 'name'),
          pickStr(s, 'district'),
          pickStr(s, 'inverter_no'),
          pickStr(s, 'solar_meter_no', 'solarmeter_no'),
          pickStr(s, 'net_smart_meter_no', 'nm_sm_no'),
          pickStr(s, 'loger_no', 'logger_no'),
          pickStr(s, 'ca_no', 'account_no'),
          pickStr(s, 'contact_person', 'nodal_person'),
          pickStr(s, 'contact_number', 'mobile'),
        ].some((v) => v.toLowerCase().includes(q))
      );
    }
    return list;
  }, [sites, search, verifyFilter]);

  const { paginatedData, currentPage, pageSize, totalItems, setPage, setPageSize } =
    usePagination({ data: filteredSites, initialPageSize: 100 });

  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, verifyFilter, currentStatus, selectedDistrict]);

  const hasFilters = search.trim() !== '' || verifyFilter !== 'all' || !isAllDistricts;
  const resetFilters = () => {
    setSearch('');
    setVerifyFilter('all');
    if (!isAllDistricts) goTo(currentStatus, 'All');
    setPage(1);
  };

  // KPI counts (from loaded rows)
  const installedCount = useMemo(() => sites.filter(isSiteInstalled).length, [sites]);
  const approvedCount = useMemo(() => sites.filter((s) => verifyOf(s) === 1).length, [sites]);
  const rejectedCount = useMemo(() => sites.filter((s) => verifyOf(s) === 2).length, [sites]);
  const pendingCount = useMemo(() => sites.filter((s) => verifyOf(s) !== 1 && verifyOf(s) !== 2).length, [sites]);
  const docApprovedCount = useMemo(() => sites.filter((s) => docOf(s) === 1).length, [sites]);
  const docRejectedCount = useMemo(() => sites.filter((s) => docOf(s) === 2).length, [sites]);

  /* ───────── Export ───────── */
  const exportCols: ExportColumn<any>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r: any, idx?: number) => (idx !== undefined ? idx + 1 : '') } as any,
      { header: 'Site ID', accessor: (r: any) => `#${r.id}` },
      { header: 'Site Name', accessor: (r: any) => pickStr(r, 'site_name', 'name') || DASH },
      { header: 'District', accessor: (r: any) => pickStr(r, 'district') || DASH },
      { header: 'CA No.', accessor: (r: any) => pickStr(r, 'ca_no', 'account_no') || DASH },
      { header: 'Department', accessor: (r: any) => pickStr(r, 'dept_name', 'department', 'firm_name') || DASH },
      { header: 'Contact Person', accessor: (r: any) => pickStr(r, 'contact_person', 'nodal_person') || DASH },
      { header: 'Contact No.', accessor: (r: any) => pickStr(r, 'contact_number', 'mobile') || DASH },
      { header: 'Installation Date', accessor: (r: any) => pickStr(r, 'installation_date', 'inst_date') || DASH },
      { header: 'Inverter No.', accessor: (r: any) => pickStr(r, 'inverter_no') || DASH },
      { header: 'Solar Meter No.', accessor: (r: any) => pickStr(r, 'solar_meter_no', 'solarmeter_no') || DASH },
      { header: 'Net / Smart Meter No.', accessor: (r: any) => pickStr(r, 'net_smart_meter_no', 'nm_sm_no') || DASH },
      { header: 'Logger No.', accessor: (r: any) => pickStr(r, 'loger_no', 'logger_no') || DASH },
      { header: 'Latitude', accessor: (r: any) => pickStr(r, 'latitude', 'inst_latitude') || DASH },
      { header: 'Longitude', accessor: (r: any) => pickStr(r, 'longitude', 'inst_longitude') || DASH },
      { header: 'Remark', accessor: (r: any) => pickStr(r, 'remark', 'verify_remarks', 'remarks') || DASH },
      { header: 'Install Status', accessor: (r: any) => (isSiteInstalled(r) ? 'Installed' : 'Pending') },
      { header: 'Verify Status', accessor: (r: any) => verifyLabel(verifyOf(r)) },
      { header: 'Document Status', accessor: (r: any) => docLabel(docOf(r)) },
    ],
    []
  );

  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = `UP_Resco_${currentStatus}_Installations`;
  const fileTitle = `UP Resco ${activeMeta.label} Installation Register`;

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
    setToastMsg({ type: 'success', text: 'Table data copied to clipboard!' });
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

  const subtitle = `Viewing ${activeMeta.label}${!isAllDistricts ? ` in ${selectedDistrict}` : ''} — Master register of Resco solar installations, verification evidence, photographs and document compliance`;

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="UP Resco Installation Data"
        subtitle={subtitle}
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Uttar Pradesh' },
          { label: 'Installation' },
          { label: 'Resco' },
          { label: 'Dashboard', href: '/v/up/resco-installation-dashboard' },
          { label: activeMeta.label },
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
            <Link to="/v/up/resco-installation-dashboard" className="ax-btn ax-btn--secondary ax-btn--sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}>
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </Link>
            <Link to="/v/up/resco-view-assign-installation-sites" className="ax-btn ax-btn--secondary ax-btn--sm">
              Assigned Sites
            </Link>
            <Link to="/v/up/resco-install-site" className="ax-btn ax-btn--primary ax-btn--sm">
              <span className="ax-btn__label">+ Install Site</span>
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

      {toastMsg && toastMsg.type === 'success' && (
        <div className="ax-alert ax-alert--success" style={{ marginBottom: 'var(--ax-space-4)' }} role="status">
          <div className="ax-alert__title">Success</div>
          <div className="ax-alert__text">{toastMsg.text}</div>
        </div>
      )}

      {/* ── Top Metric KPI Cards (4 in 1 row) ── */}
      <div className="asw-cards-row">
        <KpiCard
          tone={activeMeta.tone}
          label={`${activeMeta.label} Total`}
          value={num(sites.length)}
          sub={!isAllDistricts ? `Filtered in ${selectedDistrict}` : 'Across all UP districts'}
          icon={svgIcon(<><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 9h8M8 13h8M8 17h5" /></>)}
        />
        <KpiCard
          tone="emerald"
          label="Installed Sites"
          value={num(installedCount)}
          sub="Equipment serials / install date available"
          icon={svgIcon(<><path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" /><path d="M9 12l2 2 4-4" /></>)}
        />
        <KpiCard
          tone="cyan"
          label="Verify Approved"
          value={num(approvedCount)}
          sub={`${num(pendingCount)} audit pending · ${num(rejectedCount)} rejected`}
          icon={svgIcon(<><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 15" /></>)}
        />
        <KpiCard
          tone="violet"
          label="Document Approved"
          value={num(docApprovedCount)}
          sub={`${num(docRejectedCount)} document rejected`}
          icon={svgIcon(<><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" /><path d="M9 14l2 2l4 -4" /></>)}
        />
      </div>

      {/* ── Main Table Card ── */}
      <section className="ax-card ax-col--12" role="region" aria-label="UP Resco Installations">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">UP Resco Installation Data</h2>
            <p className="ax-card__subtitle">
              <span className="ax-num">{filteredSites.length}</span> of <span className="ax-num">{sites.length}</span> installations
              {' '}· Status: <b>{activeMeta.label}</b>
              {' '}· Approved <b className="ax-num">{approvedCount}</b> · Pending <b className="ax-num">{pendingCount}</b> · Rejected <b className="ax-num">{rejectedCount}</b>
            </p>
          </div>
          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              {/* Status Switcher (grouped, with live counts) */}
              <select
                id="uprsv_status_category_filter"
                className="ax-input ax-input--sm"
                style={{ width: 210, height: 32, fontSize: 'var(--ax-text-xs)' }}
                value={currentStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
                aria-label="Status category"
              >
                {STATUS_GROUPS.map((g) => (
                  <optgroup key={g} label={g}>
                    {RESCO_STATUS_OPTIONS.filter((o) => o.group === g).map((o) => {
                      const c = counts && o.countKey ? (counts as any)[o.countKey] : undefined;
                      return (
                        <option key={o.id} value={o.id}>
                          {o.label}{c !== undefined && c !== null ? ` (${num(c)})` : ''}
                        </option>
                      );
                    })}
                  </optgroup>
                ))}
                {!RESCO_STATUS_OPTIONS.some((o) => o.id === currentStatus) && (
                  <option value={currentStatus}>{activeMeta.label}</option>
                )}
              </select>

              {/* District Filter */}
              <select
                id="uprsv_district_filter"
                className="ax-input ax-input--sm"
                style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                value={isAllDistricts ? 'All' : selectedDistrict}
                onChange={(e) => handleDistrictChange(e.target.value)}
                aria-label="Filter by district"
              >
                <option value="All">All Districts ({districtOptions.length})</option>
                {districtOptions.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>

              {/* Verify Status Filter */}
              <select
                id="uprsv_verify_filter"
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
                placeholder="Search site, district, inverter, meter…"
                size="sm"
                ariaLabel="Search installed sites"
              />

              <TableExportToolbar
                onCopy={() => copyToClipboard(filteredSites, exportCols)}
                onExportCSV={() => exportToCSV(filteredSites, exportCols, `${fileBase}_${stamp}`)}
                onExportExcel={() => exportToExcel(filteredSites, exportCols, `${fileBase}_${stamp}`)}
                onExportPDF={() => exportToPDF(filteredSites, exportCols, fileTitle)}
              />
            </div>
          </div>
        </div>

        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap', minWidth: 3000 }}>
            <caption className="ax-visually-hidden">UP Resco Installation Data</caption>
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
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading UP Resco installation records from server…
                  </td>
                </tr>
              )}
              {!loading && filteredSites.length === 0 && (
                <tr>
                  <td className="ax-table__td" colSpan={COLUMN_HEADERS.length} style={{ padding: 0 }}>
                    <TableEmptyState
                      title={`No records for ${activeMeta.label}`}
                      message={
                        hasFilters
                          ? 'No records match your filters or search. Try clearing your query.'
                          : `There are currently no installations marked as "${activeMeta.label}".`
                      }
                      onClear={hasFilters ? resetFilters : undefined}
                      clearLabel="Clear filters"
                    />
                  </td>
                </tr>
              )}
              {!loading &&
                paginatedData.map((site: any, index: number) => {
                  const imgs = getImages(site);
                  const siteName = pickStr(site, 'site_name', 'name') || DASH;
                  const siteLabel = `Site ${site.id ?? index + 1}`;
                  const lat = pickStr(site, 'latitude', 'inst_latitude');
                  const lng = pickStr(site, 'longitude', 'inst_longitude');
                  const hasGeo = lat !== '' && lng !== '' && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng));

                  return (
                    <tr key={site.id ?? index} className="ax-table__row">
                      <td className="ax-table__td ax-num">{(currentPage - 1) * pageSize + index + 1}</td>
                      <td className="ax-table__td" style={{ fontWeight: 700, color: 'var(--ax-accent)' }}>#{site.id}</td>
                      <td className="ax-table__td">
                        <span style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>{siteName}</span>
                      </td>
                      <td className="ax-table__td"><b>{pickStr(site, 'district') || DASH}</b></td>
                      <td className="ax-table__td" style={monoCell}>{pickStr(site, 'ca_no', 'account_no') || DASH}</td>
                      <td className="ax-table__td">{pickStr(site, 'dept_name', 'department', 'firm_name') || DASH}</td>
                      <td className="ax-table__td">{pickStr(site, 'contact_person', 'nodal_person') || DASH}</td>
                      <td className="ax-table__td" style={monoCell}>{pickStr(site, 'contact_number', 'mobile') || DASH}</td>
                      <td className="ax-table__td">{pickStr(site, 'installation_date', 'inst_date') || DASH}</td>
                      <td className="ax-table__td" style={monoCell}>{pickStr(site, 'inverter_no') || DASH}</td>
                      <td className="ax-table__td" style={monoCell}>{pickStr(site, 'solar_meter_no', 'solarmeter_no') || DASH}</td>
                      <td className="ax-table__td" style={monoCell}>{pickStr(site, 'net_smart_meter_no', 'nm_sm_no') || DASH}</td>
                      <td className="ax-table__td" style={monoCell}>{pickStr(site, 'loger_no', 'logger_no') || DASH}</td>

                      {/* Photo thumbnails (click to zoom) */}
                      <td className="ax-table__td"><SiteThumbnail src={imgs.system} alt={`${siteLabel} - System Photo`} onPreview={openPreview} /></td>
                      <td className="ax-table__td"><SiteThumbnail src={imgs.inverter} alt={`${siteLabel} - Inverter Photo`} onPreview={openPreview} /></td>
                      <td className="ax-table__td"><SiteThumbnail src={imgs.panel} alt={`${siteLabel} - Panel Photo`} onPreview={openPreview} /></td>
                      <td className="ax-table__td"><SiteThumbnail src={imgs.meter} alt={`${siteLabel} - Meter Photo`} onPreview={openPreview} /></td>
                      <td className="ax-table__td"><SiteThumbnail src={imgs.logger} alt={`${siteLabel} - Logger Photo`} onPreview={openPreview} /></td>

                      {/* Geolocation */}
                      <td className="ax-table__td">
                        {hasGeo ? (
                          <a
                            href={`https://www.google.com/maps?q=${lat},${lng}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: 'var(--ax-accent)', textDecoration: 'none', fontWeight: 600 }}
                            title="Open location in Google Maps"
                          >
                            {lat}
                          </a>
                        ) : (
                          lat || DASH
                        )}
                      </td>
                      <td className="ax-table__td">{lng || DASH}</td>

                      <td className="ax-table__td" style={{ maxWidth: 200, whiteSpace: 'normal', fontSize: '12px' }}>
                        {pickStr(site, 'remark', 'verify_remarks', 'remarks') || DASH}
                      </td>

                      {/* Status badges */}
                      <td className="ax-table__td"><InstallBadge installed={isSiteInstalled(site)} /></td>
                      <td className="ax-table__td"><VerifyBadge value={verifyOf(site)} /></td>
                      <td className="ax-table__td"><DocBadge value={docOf(site)} /></td>

                      {/* Action */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <RowActionDropdown onView={() => setDetailSite(site)} />
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
      <Modal open={!!detailSite} onClose={() => setDetailSite(null)} labelledBy="uprsv-detail-title" dialogClass="ax-modal__dialog--md">
        {detailSite && (() => {
          const imgs = getImages(detailSite);
          const gallery = [
            { label: 'System Overview', src: imgs.system },
            { label: 'Inverter', src: imgs.inverter },
            { label: 'Solar Panel', src: imgs.panel },
            { label: 'Net / Smart Meter', src: imgs.meter },
            { label: 'Logger', src: imgs.logger },
          ];
          const remark = pickStr(detailSite, 'remark', 'verify_remarks', 'remarks');
          return (
            <div>
              <div className="ax-modal__header">
                <div>
                  <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700 }} id="uprsv-detail-title">
                    Resco Installation Record #{detailSite.id}
                  </h4>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--ax-text-muted)' }}>
                    {pickStr(detailSite, 'district') ? `District: ${pickStr(detailSite, 'district')} · ` : ''}State: Uttar Pradesh
                  </p>
                </div>
                <button type="button" className="ax-modal__close" onClick={() => setDetailSite(null)} aria-label="Close dialog">
                  {X_ICON}
                </button>
              </div>

              <div className="ax-modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="ula-m-grid">
                  <div className="ula-m-info"><span>Site Name:</span> <b>{pickStr(detailSite, 'site_name', 'name') || DASH}</b></div>
                  <div className="ula-m-info"><span>District:</span> <b>{pickStr(detailSite, 'district') || DASH}</b></div>
                  <div className="ula-m-info"><span>Department / Firm:</span> <b>{pickStr(detailSite, 'dept_name', 'department', 'firm_name') || DASH}</b></div>
                  <div className="ula-m-info"><span>CA / Account No:</span> <b>{pickStr(detailSite, 'ca_no', 'account_no') || DASH}</b></div>
                  <div className="ula-m-info"><span>Contact Person:</span> <b>{pickStr(detailSite, 'contact_person', 'nodal_person') || DASH}</b></div>
                  <div className="ula-m-info"><span>Contact No:</span> <b>{pickStr(detailSite, 'contact_number', 'mobile') || DASH}</b></div>
                  <div className="ula-m-info"><span>Installation Date:</span> <b>{pickStr(detailSite, 'installation_date', 'inst_date') || DASH}</b></div>
                  <div className="ula-m-info"><span>Inverter No:</span> <b>{pickStr(detailSite, 'inverter_no') || DASH}</b></div>
                  <div className="ula-m-info"><span>Solar Meter No:</span> <b>{pickStr(detailSite, 'solar_meter_no', 'solarmeter_no') || DASH}</b></div>
                  <div className="ula-m-info"><span>Net / Smart Meter No:</span> <b>{pickStr(detailSite, 'net_smart_meter_no', 'nm_sm_no') || DASH}</b></div>
                  <div className="ula-m-info"><span>Logger No:</span> <b>{pickStr(detailSite, 'loger_no', 'logger_no') || DASH}</b></div>
                  <div className="ula-m-info"><span>Install Status:</span> <b>{isSiteInstalled(detailSite) ? 'Installed' : 'Pending'}</b></div>
                  <div className="ula-m-info"><span>Physical Verification:</span> <b>{verifyLabel(verifyOf(detailSite))}</b></div>
                  <div className="ula-m-info"><span>Document Verification:</span> <b>{docLabel(docOf(detailSite))}</b></div>
                  <div className="ula-m-info"><span>Latitude:</span> <b>{pickStr(detailSite, 'latitude', 'inst_latitude') || DASH}</b></div>
                  <div className="ula-m-info"><span>Longitude:</span> <b>{pickStr(detailSite, 'longitude', 'inst_longitude') || DASH}</b></div>
                </div>

                {remark && (
                  <div style={{ padding: '8px 12px', background: 'var(--ax-surface-subtle)', borderRadius: 6, fontSize: 12 }}>
                    <span style={{ color: 'var(--ax-text-muted)', fontWeight: 600 }}>Remarks: </span>
                    {remark}
                  </div>
                )}

                {/* Photos in modal */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginTop: 4 }}>
                  {gallery.map((p, idx) => (
                    <div key={idx} style={{ border: '1px solid var(--ax-border)', borderRadius: 6, padding: 6, textAlign: 'center' }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ax-text-muted)', marginBottom: 4 }}>{p.label}</div>
                      {p.src ? (
                        <img
                          src={p.src}
                          alt={p.label}
                          style={{ width: '100%', height: 110, objectFit: 'cover', borderRadius: 0, border: '1px solid var(--ax-border)', cursor: 'zoom-in' }}
                          onClick={() => openPreview(p.src, `${p.label} - Site ${detailSite.id}`)}
                        />
                      ) : (
                        <div style={{ height: 110, background: 'var(--ax-surface-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ax-text-muted)', fontSize: 11 }}>
                          N/A
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="ax-modal__footer">
                <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setDetailSite(null)}>Close</button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}

export default UP_Installation_Resco_StatusView;