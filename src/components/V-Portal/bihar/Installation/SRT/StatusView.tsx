import { useState, useMemo, useEffect, useCallback, useRef, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  biharSrtInstallationService,
  getMediaUrl,
} from '../../bihar-services/biharSrtInstallationService';
import { BIHAR_DISTRICTS } from '../../../../Vendor-Management/bihar/bihar-types';
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
export type SrtStatusCategory = 'all' | 'installation' | 'inspection' | 'document' | 'claim' | 'payment';

export interface SrtStatusMeta {
  key: string;
  label: string;
  category: SrtStatusCategory;
  tone: 'accent' | 'cyan' | 'emerald' | 'amber' | 'violet' | 'pink' | 'red';
  sub: string;
}

/* ───────── 18 Backend Statuses for Bihar SRT Installation ───────── */
export const BIHAR_SRT_STATUS_CATALOG: SrtStatusMeta[] = [
  // Total & Assignment
  { key: 'total', label: 'Total Sites', category: 'all', tone: 'accent', sub: 'All allocated solar rooftop sites' },
  { key: 'total-assigned', label: 'Assigned Sites', category: 'all', tone: 'emerald', sub: 'Sites allocated to vendors' },

  // Installation
  { key: 'inst-complete', label: 'Installation Complete', category: 'installation', tone: 'emerald', sub: 'Rooftop plant erected & synchronized' },
  { key: 'inst-pending', label: 'Installation Pending', category: 'installation', tone: 'amber', sub: 'Physical rooftop installation pending' },

  // Inspection & Verification
  { key: 'inpection-complete', label: 'Inspection Complete', category: 'inspection', tone: 'emerald', sub: 'Technical inspection passed' },
  { key: 'inpection-pending', label: 'Inspection Pending', category: 'inspection', tone: 'amber', sub: 'Inspection in verification queue' },
  { key: 'verify-approved', label: 'Verification Approved', category: 'inspection', tone: 'emerald', sub: 'Audit verified & approved by BREDA' },
  { key: 'verify-pending', label: 'Verification Pending', category: 'inspection', tone: 'amber', sub: 'Awaiting audit verification' },
  { key: 'verify-reject', label: 'Verification Rejected', category: 'inspection', tone: 'red', sub: 'Audit rejected / rework required' },

  // Documents
  { key: 'inst-doc-complete', label: 'Doc Complete', category: 'document', tone: 'violet', sub: 'Commissioning & test report uploaded' },
  { key: 'inst-doc-pending', label: 'Doc Pending', category: 'document', tone: 'amber', sub: 'Documentation submission pending' },

  // Claim
  { key: 'claim-applicable', label: 'Claim Applicable', category: 'claim', tone: 'cyan', sub: 'Sites eligible for billing claim' },
  { key: 'claim-raised', label: 'Claim Raised', category: 'claim', tone: 'accent', sub: 'Vendor claim invoice submitted' },

  // Payment
  { key: 'inst-pay1', label: 'Payment 1 (Stage 1)', category: 'payment', tone: 'emerald', sub: 'First stage payment disbursed' },
  { key: 'inst-pay2', label: 'Payment 2 (Stage 2)', category: 'payment', tone: 'emerald', sub: 'Second stage payment disbursed' },
  { key: 'inst-pay3', label: 'Payment 3 (Stage 3)', category: 'payment', tone: 'emerald', sub: 'Final stage payment disbursed' },
  { key: 'inst-pay1-amount', label: 'Payment 1 Amount', category: 'payment', tone: 'cyan', sub: 'Stage 1 invoice disbursement total' },
  { key: 'inst-pay2-amount', label: 'Payment 2 Amount', category: 'payment', tone: 'cyan', sub: 'Stage 2 invoice disbursement total' },
  { key: 'inst-pay3-amount', label: 'Payment 3 Amount', category: 'payment', tone: 'cyan', sub: 'Stage 3 invoice disbursement total' },
];

const STATUS_META_MAP: Record<string, SrtStatusMeta> = Object.fromEntries(
  BIHAR_SRT_STATUS_CATALOG.map((m) => [m.key, m])
);

export const CATEGORY_LABELS: { key: SrtStatusCategory; label: string }[] = [
  { key: 'all', label: 'All Sites' },
  { key: 'installation', label: 'Installation' },
  { key: 'inspection', label: 'Inspection & Verify' },
  { key: 'document', label: 'Documents' },
  { key: 'claim', label: 'Claim' },
  { key: 'payment', label: 'Payment Stages' },
];

/* ───────── Helpers ───────── */
const DASH = '—';
const txt = (v: unknown) => (v === null || v === undefined || v === '' ? DASH : String(v));

type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'info' | 'accent';

const Badge = ({ tone, children }: { tone: Tone; children: ReactNode }) => (
  <span className={`ax-badge ax-badge--soft ax-badge--${tone}`}>{children}</span>
);

const isInstalled = (r: any): boolean => {
  const s = String(r.site_inst_status ?? r.inst_status ?? r.installation_status ?? '').toLowerCase().trim();
  return s === '1' || s === 'complete' || s === 'completed' || s === 'installed';
};

type VerifyState = 'approved' | 'rejected' | 'pending';

const verifyState = (r: any): VerifyState => {
  const raw = String(r.inst_verify_status ?? r.verify_status ?? '').toLowerCase().trim();
  if (raw === '1' || raw === 'approved' || raw === 'approve') return 'approved';
  if (raw === '2' || raw === 'rejected' || raw === 'reject') return 'rejected';
  return 'pending';
};

const verifyLabel = (s: VerifyState) => (s === 'approved' ? 'Approved' : s === 'rejected' ? 'Rejected' : 'Pending');
const verifyTone = (s: VerifyState): Tone => (s === 'approved' ? 'success' : s === 'rejected' ? 'danger' : 'warning');

const getPaymentLabel = (r: any): string => {
  if (Number(r.inst_pay3_status ?? 0) === 1) return 'Stage 3 Paid';
  if (Number(r.inst_pay2_status ?? 0) === 1) return 'Stage 2 Paid';
  if (Number(r.inst_pay1_status ?? 0) === 1) return 'Stage 1 Paid';
  return 'Pending';
};

const VerifyBadge = ({ row }: { row: any }) => {
  const s = verifyState(row);
  return <Badge tone={verifyTone(s)}>{verifyLabel(s)}</Badge>;
};

const InstallBadge = ({ row }: { row: any }) =>
  isInstalled(row) ? <Badge tone="success">Installed</Badge> : <Badge tone="warning">Pending</Badge>;

const InspectBadge = ({ row }: { row: any }) => {
  const isInspect = Number(row.inpection_status ?? row.inspection_status ?? 0) === 1;
  return isInspect ? <Badge tone="success">Complete</Badge> : <Badge tone="warning">Pending</Badge>;
};

const DocBadge = ({ row }: { row: any }) => {
  const isDoc = Number(row.inst_doc_status ?? row.doc_status ?? 0) === 1;
  return isDoc ? <Badge tone="success">Uploaded</Badge> : <Badge tone="warning">Pending</Badge>;
};

const ClaimBadge = ({ status }: { status: number }) => {
  if (status === 2) return <Badge tone="success">Approved</Badge>;
  if (status === 3) return <Badge tone="danger">Rejected</Badge>;
  if (status === 1) return <Badge tone="info">Raised</Badge>;
  return <Badge tone="neutral">Not Raised</Badge>;
};

const PaymentBadge = ({ row }: { row: any }) => {
  if (Number(row.inst_pay3_status ?? 0) === 1) return <Badge tone="success">Stage 3 Paid</Badge>;
  if (Number(row.inst_pay2_status ?? 0) === 1) return <Badge tone="info">Stage 2 Paid</Badge>;
  if (Number(row.inst_pay1_status ?? 0) === 1) return <Badge tone="accent">Stage 1 Paid</Badge>;
  return <Badge tone="warning">Pending</Badge>;
};

const fmtTime = (d: Date) => d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();

const rowImage = (r: any): string => {
  const raw =
    r.inst_gen_image ||
    r.generation_image ||
    r.site_image ||
    r.rms_loger_image ||
    r.panel_image ||
    r.system_image ||
    r.inverter_image ||
    r.nm_sm_image ||
    r.loger_image;
  return raw ? getMediaUrl(raw) || '' : '';
};

const rowLabel = (r: any) => r.site_name || r.ca_no || `#${r.id}`;

function resolveSrtInitialStatus(rawStatus: string | null, rawHash: string): string {
  const hash = (rawHash || '').replace('#', '').toLowerCase().trim();
  if (rawStatus && rawStatus !== 'total' && rawStatus !== 'total-sites') return rawStatus;
  if (hash === 'pending' || hash === 'penidng') return 'inst-pending';
  if (hash === 'completed' || hash === 'complete') return 'inst-complete';
  if (hash === 'payment' || hash === 'pay') return 'inst-pay1';
  if (rawStatus) return rawStatus;
  return 'total';
}

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
    <Modal open onClose={onClose} labelledBy="srtsv-preview-title" dialogClass="ax-modal__dialog--lg">
      <div className="ax-modal__header">
        <h2 className="ax-modal__title" id="srtsv-preview-title">{title || 'Photo Preview'}</h2>
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

/* ───────── Action dropdown (menu rendered in <body> so table never clips it) ───────── */
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

/* ───────── Overlay CSS (modals + dropdown) ───────── */
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

/* ───────── KPI card (identical to SSL status view) ───────── */
type KpiTone = 'accent' | 'cyan' | 'emerald' | 'amber' | 'violet' | 'pink' | 'red';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(var(--ax-accent-rgb, 37, 99, 235), 0.12)', fg: 'var(--ax-accent, #2563eb)' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan, #0891b2) 14%, transparent)', fg: 'var(--ax-viz-cyan, #0891b2)' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald, #10b981) 14%, transparent)', fg: 'var(--ax-viz-emerald, #10b981)' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber, #f59e0b) 14%, transparent)', fg: 'var(--ax-viz-amber, #f59e0b)' },
  violet: { bg: 'color-mix(in oklab, var(--ax-viz-violet, #7c3aed) 14%, transparent)', fg: 'var(--ax-viz-violet, #7c3aed)' },
  pink: { bg: 'color-mix(in oklab, var(--ax-viz-pink, #ec4899) 14%, transparent)', fg: 'var(--ax-viz-pink, #ec4899)' },
  red: { bg: 'color-mix(in oklab, var(--ax-viz-red, #ef4444) 14%, transparent)', fg: 'var(--ax-viz-red, #ef4444)' },
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
  'Site Name',
  'District',
  'Block',
  'Village / Location',
  'CA Number',
  'Consumer Name',
  'Contact No.',
  'Capacity (kW)',
  'Plant Photo',
  'Installation Status',
  'Inspection Status',
  'Verify Status',
  'Doc Status',
  'Claim Status',
  'Payment Status',
  'Action',
];

export function Bihar_Installation_SRT_StatusView() {
  const [searchParams, setSearchParams] = useSearchParams();

  const queryStatus = searchParams.get('status');
  const initialDistrict = searchParams.get('district') || 'all';

  const [currentStatus, setCurrentStatus] = useState<string>(() => resolveSrtInitialStatus(queryStatus, window.location.hash));
  const [selectedDistrict, setSelectedDistrict] = useState<string>(initialDistrict);
  const [verifyFilter, setVerifyFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');
  const [search, setSearch] = useState<string>('');

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [updatedAt, setUpdatedAt] = useState<Date>(new Date());

  const [detailItem, setDetailItem] = useState<any | null>(null);
  const [preview, setPreview] = useState<{ url: string; title: string } | null>(null);

  // Meta for current status
  const currentMeta = useMemo(() => {
    return (
      STATUS_META_MAP[currentStatus] || {
        key: currentStatus,
        label: currentStatus.replace(/[-_]/g, ' ').toUpperCase(),
        category: 'all' as SrtStatusCategory,
        tone: 'accent' as const,
        sub: `Filtered by ${currentStatus}`,
      }
    );
  }, [currentStatus]);

  // Load Status Data from API
  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      let data: any[] = [];
      if (selectedDistrict && selectedDistrict !== 'all' && selectedDistrict !== 'All') {
        data = await biharSrtInstallationService.getDashboardSitesByDistrict(currentStatus, selectedDistrict);
      } else {
        data = await biharSrtInstallationService.getDashboardSitesByStatus(currentStatus);
      }
      setItems(Array.isArray(data) ? data : []);
      setUpdatedAt(new Date());
    } catch (err: any) {
      console.error('[Bihar SRT StatusView] loadData error:', err);
      setErrorMsg(err?.message || 'Failed to load Bihar SRT status records from server.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [currentStatus, selectedDistrict]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Sync state from URL query params
  useEffect(() => {
    const s = searchParams.get('status');
    const d = searchParams.get('district');
    const resolved = resolveSrtInitialStatus(s, window.location.hash);
    if (resolved && resolved !== currentStatus) setCurrentStatus(resolved);
    if (d && d !== selectedDistrict) setSelectedDistrict(d);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Hash change sync
  useEffect(() => {
    const onHashChange = () => {
      const resolved = resolveSrtInitialStatus(searchParams.get('status'), window.location.hash);
      if (resolved && resolved !== currentStatus) setCurrentStatus(resolved);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [currentStatus, searchParams]);

  const handleStatusChange = (statusKey: string) => {
    setCurrentStatus(statusKey);
    const next = new URLSearchParams(searchParams);
    next.set('status', statusKey);
    if (selectedDistrict && selectedDistrict !== 'all') {
      next.set('district', selectedDistrict);
    } else {
      next.delete('district');
    }
    setSearchParams(next);
    if (statusKey === 'inst-pending') window.location.hash = 'pending';
    else if (statusKey === 'inst-complete') window.location.hash = 'completed';
    else if (statusKey.startsWith('inst-pay')) window.location.hash = 'payment';
  };

  const handleDistrictChange = (d: string) => {
    setSelectedDistrict(d);
    const next = new URLSearchParams(searchParams);
    next.set('status', currentStatus);
    if (d && d !== 'all') next.set('district', d);
    else next.delete('district');
    setSearchParams(next);
  };

  const isAllDistricts = !selectedDistrict || selectedDistrict === 'all' || selectedDistrict === 'All';

  // Derived metrics
  const summary = useMemo(() => {
    const total = items.length;
    const installed = items.filter(isInstalled).length;
    const vApp = items.filter((r) => verifyState(r) === 'approved').length;
    const vRej = items.filter((r) => verifyState(r) === 'rejected').length;
    const vPend = items.filter((r) => verifyState(r) === 'pending').length;
    const paid = items.filter((r) => Number(r.inst_pay1_status ?? 0) === 1 || Number(r.inst_pay2_status ?? 0) === 1 || Number(r.inst_pay3_status ?? 0) === 1).length;
    return { total, installed, vApp, vRej, vPend, paid };
  }, [items]);

  // Districts list
  const districts = useMemo(() => {
    const set = new Set<string>();
    items.forEach((r) => r.district && set.add(String(r.district).trim()));
    BIHAR_DISTRICTS.forEach((d) => set.add(d));
    return Array.from(set).sort();
  }, [items]);

  // Filtered rows
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((r) => {
      if (verifyFilter !== 'all' && verifyState(r) !== verifyFilter) return false;
      if (!q) return true;
      return [
        r.site_name,
        r.district,
        r.block,
        r.village,
        r.location,
        r.ca_no,
        r.contact_no,
        r.consumer_name,
        r.beneficiary_name,
        r.sanction_load,
      ].some((v) => String(v ?? '').toLowerCase().includes(q));
    });
  }, [items, search, verifyFilter]);

  const {
    currentPage,
    pageSize,
    setPage,
    setPageSize,
    totalItems,
    paginatedData,
  } = usePagination({ data: filtered, initialPageSize: 25 });

  const hasFilters = Boolean(search || verifyFilter !== 'all' || (!isAllDistricts && selectedDistrict !== 'all'));
  const resetFilters = () => {
    setSearch('');
    setVerifyFilter('all');
    setSelectedDistrict('all');
    const next = new URLSearchParams(searchParams);
    next.set('status', currentStatus);
    next.delete('district');
    setSearchParams(next);
  };

  const openPreview = (url: string, title: string) => setPreview({ url, title });
  const closePreview = () => setPreview(null);

  // Export
  const exportCols: ExportColumn<any>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r, idx) => (idx !== undefined ? idx + 1 : '') },
      { header: 'Site Name', accessor: (r) => rowLabel(r) },
      { header: 'District', accessor: (r) => r.district || DASH },
      { header: 'Block', accessor: (r) => r.block || DASH },
      { header: 'Village / Location', accessor: (r) => r.village || r.location || DASH },
      { header: 'CA Number', accessor: (r) => r.ca_no || DASH },
      { header: 'Consumer Name', accessor: (r) => r.consumer_name || r.beneficiary_name || DASH },
      { header: 'Contact No.', accessor: (r) => r.contact_no || DASH },
      { header: 'Capacity (kW)', accessor: (r) => (r.sanction_load ? `${r.sanction_load} kW` : DASH) },
      { header: 'Installation Status', accessor: (r) => (isInstalled(r) ? 'Installed' : 'Pending') },
      { header: 'Inspection Status', accessor: (r) => (Number(r.inpection_status ?? r.inspection_status ?? 0) === 1 ? 'Complete' : 'Pending') },
      { header: 'Verify Status', accessor: (r) => verifyLabel(verifyState(r)) },
      { header: 'Doc Status', accessor: (r) => (Number(r.inst_doc_status ?? r.doc_status ?? 0) === 1 ? 'Uploaded' : 'Pending') },
      { header: 'Claim Status', accessor: (r) => (Number(r.inst_claim_status ?? r.claim_status ?? 0) === 1 ? 'Raised' : 'Not Raised') },
      { header: 'Payment Status', accessor: (r) => getPaymentLabel(r) },
    ],
    []
  );

  const pageTitle = `Bihar SRT Sites: ${currentMeta.label}${!isAllDistricts ? ` (${selectedDistrict})` : ''}`;
  const fileBase = `Bihar_SRT_${currentStatus}`;

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* ── Page Head (Matching Bihar SSL Installation Data exactly) ── */}
      <PageHead
        title="Bihar SRT Installation Data"
        subtitle={`Viewing ${currentMeta.label}${!isAllDistricts ? ` in ${selectedDistrict}` : ''} — Master register of solar rooftop installations, verification, claims and payment status · Updated ${fmtTime(updatedAt)}`}
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Bihar' },
          { label: 'Installation' },
          { label: 'SRT' },
          { label: 'Dashboard', href: '/v/bihar/vendor-srt-installation-dashboard' },
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
            <Link to="/v/bihar/vendor-srt-installation-dashboard" className="ax-btn ax-btn--secondary ax-btn--sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}>
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </Link>
            <Link to="/v/bihar/installation/srt/view-installation" className="ax-btn ax-btn--primary ax-btn--sm">
              <span className="ax-btn__label">View Installations</span>
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
          sub={!isAllDistricts ? `Filtered in ${selectedDistrict}` : 'Across all Bihar districts'}
          icon={svgIcon(<><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 9h8M8 13h8M8 17h5" /></>)}
        />
        <KpiCard
          tone="emerald"
          label="Installed Plants"
          value={summary.installed.toLocaleString('en-IN')}
          sub={`${summary.total > 0 ? Math.round((summary.installed / summary.total) * 100) : 0}% of current list`}
          icon={svgIcon(<><path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" /><path d="M9 12l2 2 4-4" /></>)}
        />
        <KpiCard
          tone="cyan"
          label="Verify Approved"
          value={summary.vApp.toLocaleString('en-IN')}
          sub={`${summary.vPend} audit pending`}
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
      <section className="ax-card ax-col--12" role="region" aria-label="Bihar SRT Installations">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">{pageTitle}</h2>
            <p className="ax-card__subtitle">
              <span className="ax-num">{filtered.length}</span> of <span className="ax-num">{items.length}</span> sites
              {' '}· Status: <b>{currentMeta.label}</b>
              {' '}· Approved <b className="ax-num">{summary.vApp}</b> · Pending <b className="ax-num">{summary.vPend}</b> · Rejected <b className="ax-num">{summary.vRej}</b>
            </p>
          </div>
          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              {/* Status Category Grouped Switcher */}
              <select
                id="srtsv_status_category_filter"
                className="ax-input ax-input--sm"
                style={{ width: 190, height: 32, fontSize: 'var(--ax-text-xs)' }}
                value={currentStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
                aria-label="Status category"
              >
                {CATEGORY_LABELS.map((cat) => (
                  <optgroup key={cat.key} label={cat.label}>
                    {BIHAR_SRT_STATUS_CATALOG.filter((s) => s.category === cat.key).map((sm) => (
                      <option key={sm.key} value={sm.key}>{sm.label}</option>
                    ))}
                  </optgroup>
                ))}
                {!STATUS_META_MAP[currentStatus] && <option value={currentStatus}>{currentMeta.label}</option>}
              </select>

              {/* District Filter */}
              <select
                id="srtsv_district_filter"
                className="ax-input ax-input--sm"
                style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                value={isAllDistricts ? 'all' : selectedDistrict}
                onChange={(e) => handleDistrictChange(e.target.value)}
                aria-label="Filter by district"
              >
                <option value="all">All Districts ({districts.length})</option>
                {districts.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>

              {/* Verify Status Filter */}
              <select
                id="srtsv_verify_filter"
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
                placeholder="Search site, CA no, consumer…"
                size="sm"
                ariaLabel="Search solar rooftop sites"
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
          <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap', minWidth: 1750 }}>
            <caption className="ax-visually-hidden">Bihar SRT Installation Data</caption>
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
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading Bihar SRT records from server…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td className="ax-table__td" colSpan={COLUMN_HEADERS.length} style={{ padding: 0 }}>
                    <TableEmptyState
                      title="No solar rooftop sites found"
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

                  return (
                    <tr key={row.id || index} className="ax-table__row">
                      <td className="ax-table__td ax-num">{(currentPage - 1) * pageSize + index + 1}</td>
                      <td className="ax-table__td" style={{ fontWeight: 700, color: 'var(--ax-accent)' }}>{label}</td>
                      <td className="ax-table__td"><b>{txt(row.district)}</b></td>
                      <td className="ax-table__td">{txt(row.block)}</td>
                      <td className="ax-table__td">{txt(row.village || row.location)}</td>
                      <td className="ax-table__td" style={monoCell}>{txt(row.ca_no)}</td>
                      <td className="ax-table__td">
                        <span style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>{txt(row.consumer_name || row.beneficiary_name)}</span>
                      </td>
                      <td className="ax-table__td" style={monoCell}>{txt(row.contact_no)}</td>
                      <td className="ax-table__td ax-num">{row.sanction_load ? `${row.sanction_load} kW` : DASH}</td>

                      {/* Photo thumbnail */}
                      <td className="ax-table__td">
                        <SiteThumbnail src={img} alt={`Site ${label} - Photo`} onPreview={openPreview} />
                      </td>

                      {/* Status badges */}
                      <td className="ax-table__td"><InstallBadge row={row} /></td>
                      <td className="ax-table__td"><InspectBadge row={row} /></td>
                      <td className="ax-table__td"><VerifyBadge row={row} /></td>
                      <td className="ax-table__td"><DocBadge row={row} /></td>
                      <td className="ax-table__td"><ClaimBadge status={Number(row.inst_claim_status ?? row.claim_status ?? 0)} /></td>
                      <td className="ax-table__td"><PaymentBadge row={row} /></td>

                      {/* Action */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <RowActionDropdown
                          onView={() => setDetailItem(row)}
                          onPhoto={img ? () => openPreview(img, `Site ${label} - Photo`) : undefined}
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
      <Modal open={!!detailItem} onClose={() => setDetailItem(null)} labelledBy="srtsv-detail-title" dialogClass="ax-modal__dialog--md">
        {detailItem && (
          <div>
            <div className="ax-modal__header">
              <div>
                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700 }} id="srtsv-detail-title">
                  SRT Plant Record {rowLabel(detailItem)}
                </h4>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--ax-text-muted)' }}>
                  {detailItem.district ? `District: ${detailItem.district} · ` : ''}State: Bihar
                </p>
              </div>
              <button type="button" className="ax-modal__close" onClick={() => setDetailItem(null)} aria-label="Close dialog">
                {X_ICON}
              </button>
            </div>
            <div className="ax-modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="ula-m-grid">
                <div className="ula-m-info"><span>Site Name:</span> <b>{txt(detailItem.site_name)}</b></div>
                <div className="ula-m-info"><span>District:</span> <b>{txt(detailItem.district)}</b></div>
                <div className="ula-m-info"><span>Block:</span> <b>{txt(detailItem.block)}</b></div>
                <div className="ula-m-info"><span>Village / Loc:</span> <b>{txt(detailItem.village || detailItem.location)}</b></div>
                <div className="ula-m-info"><span>CA Number:</span> <b>{txt(detailItem.ca_no)}</b></div>
                <div className="ula-m-info"><span>Consumer Name:</span> <b>{txt(detailItem.consumer_name || detailItem.beneficiary_name)}</b></div>
                <div className="ula-m-info"><span>Contact No:</span> <b>{txt(detailItem.contact_no)}</b></div>
                <div className="ula-m-info"><span>Capacity:</span> <b>{detailItem.sanction_load ? `${detailItem.sanction_load} kW` : DASH}</b></div>
                <div className="ula-m-info"><span>Installation:</span> <b>{isInstalled(detailItem) ? 'Installed' : 'Pending'}</b></div>
                <div className="ula-m-info"><span>Inspection:</span> <b>{Number(detailItem.inpection_status ?? detailItem.inspection_status ?? 0) === 1 ? 'Complete' : 'Pending'}</b></div>
                <div className="ula-m-info"><span>BREDA Verification:</span> <b>{verifyLabel(verifyState(detailItem))}</b></div>
                <div className="ula-m-info"><span>Doc Status:</span> <b>{Number(detailItem.inst_doc_status ?? detailItem.doc_status ?? 0) === 1 ? 'Uploaded' : 'Pending'}</b></div>
                <div className="ula-m-info">
                  <span>Claim Status:</span>
                  <b>{Number(detailItem.inst_claim_status ?? detailItem.claim_status ?? 0) === 1 ? 'Raised' : 'Not Raised'}</b>
                </div>
                <div className="ula-m-info"><span>Payment:</span> <b>{getPaymentLabel(detailItem)}</b></div>
              </div>

              {/* Photo */}
              {(() => {
                const img = rowImage(detailItem);
                return (
                  <div style={{ border: '1px solid var(--ax-border, #e2e8f0)', borderRadius: 6, padding: 6, textAlign: 'center' }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ax-text-muted)', marginBottom: 4 }}>Plant Photo</div>
                    {img ? (
                      <img
                        src={img}
                        alt="Plant photo"
                        style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 0, border: '1px solid var(--ax-border, #e2e8f0)', cursor: 'zoom-in' }}
                        onClick={() => openPreview(img, `Site ${rowLabel(detailItem)} - Photo`)}
                      />
                    ) : (
                      <div style={{ height: 110, background: 'var(--ax-surface-subtle, #f8fafc)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ax-text-muted)', fontSize: 11 }}>
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

export default Bihar_Installation_SRT_StatusView;
