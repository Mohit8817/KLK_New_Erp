import { useState, useMemo, useEffect, useCallback, useRef, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  biharUlaInstallationService,
} from '../../bihar-services/biharUlaInstallationService';
import { BIHAR_DISTRICTS } from '../../../../Vendor-Management/bihar/bihar-types';
import { resolveBiharMediaUrl } from '../../../../Vendor-Management/bihar/bihar-services/biharAdminService';
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
export interface UlaStatusRecord {
  id: number | string;
  site_id?: number | string;
  site_name?: string;
  beneficiary_name?: string;
  consumer_name?: string;
  father_name?: string;
  contact_no?: string;
  district?: string;
  block?: string;
  village?: string;
  ca_no?: string;
  sanction_load?: string | number;
  aadhar_no?: string;
  structure_status?: string | number;
  structure_verify_status?: string | number;
  inst_status?: string | number;
  verify_status?: string | number;
  inst_doc_status?: string | number;
  doc_status?: string | number;
  doc_verify_status?: string | number;
  claim50_status?: string | number;
  claim30_status?: string | number;
  claim_status?: string | number;
  payment50_status?: string | number;
  payment30_status?: string | number;
  payment_status?: string | number;
  structure_image?: string;
  complete_photo?: string;
  installation_image?: string;
  module_serial_image?: string;
  structure_remark?: string;
  verify_remarks?: string;
  vendor_name?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export type StatusCategory = 'all' | 'structure' | 'installation' | 'document' | 'claim50' | 'claim30';

export interface StatusMeta {
  key: string;
  label: string;
  category: StatusCategory;
  tone: 'accent' | 'cyan' | 'emerald' | 'amber' | 'violet' | 'pink' | 'red';
  sub: string;
}

/* ───────── 32 Backend Statuses ───────── */
export const ULA_STATUS_CATALOG: StatusMeta[] = [
  { key: 'total', label: 'Total Sites', category: 'all', tone: 'accent', sub: 'All assigned ULA installation sites' },

  { key: 'structure-complete', label: 'Structure Complete', category: 'structure', tone: 'emerald', sub: 'Civil foundation & structure erected' },
  { key: 'structure-pending', label: 'Structure Pending', category: 'structure', tone: 'amber', sub: 'Structure erection work pending' },
  { key: 'structure-verify-approved', label: 'Structure Approved', category: 'structure', tone: 'emerald', sub: 'Foundation & structure audit approved' },
  { key: 'structure-verify-pending', label: 'Structure Verify Pending', category: 'structure', tone: 'amber', sub: 'Awaiting structure verification' },
  { key: 'structure-verify-reject', label: 'Structure Rejected', category: 'structure', tone: 'red', sub: 'Structure verification rejected / rework' },

  { key: 'complete', label: 'Installation Complete', category: 'installation', tone: 'emerald', sub: 'Pump, panel & controller installed' },
  { key: 'pending', label: 'Installation Pending', category: 'installation', tone: 'amber', sub: 'Solar pump installation pending' },
  { key: 'verify-approved', label: 'Installation Approved', category: 'installation', tone: 'emerald', sub: 'Physical site verification approved' },
  { key: 'verify-pending', label: 'Installation Verify Pending', category: 'installation', tone: 'amber', sub: 'Inspection verification in queue' },
  { key: 'verify-reject', label: 'Installation Rejected', category: 'installation', tone: 'red', sub: 'Physical verification rejected' },

  { key: 'doc-complete', label: 'Doc Submitted', category: 'document', tone: 'violet', sub: 'Handover & commissioning doc submitted' },
  { key: 'doc-pending', label: 'Doc Pending', category: 'document', tone: 'amber', sub: 'Documentation submission pending' },
  { key: 'doc-verify-approved', label: 'Doc Approved', category: 'document', tone: 'emerald', sub: 'Installation documents verified & approved' },
  { key: 'doc-verify-pending', label: 'Doc Verify Pending', category: 'document', tone: 'amber', sub: 'Document approval pending' },
  { key: 'doc-verify-reject', label: 'Doc Rejected', category: 'document', tone: 'red', sub: 'Document rejected / re-upload required' },

  { key: 'claim50-applicable', label: 'Claim 50% Applicable', category: 'claim50', tone: 'cyan', sub: 'Sites eligible for 50% subsidy claim' },
  { key: 'claim50-raised', label: 'Claim 50% Raised', category: 'claim50', tone: 'accent', sub: '50% claim invoice submitted' },
  { key: 'claim50-verify-pending', label: 'Claim 50% Verify Pending', category: 'claim50', tone: 'amber', sub: '50% claim awaiting verification' },
  { key: 'claim50-verify-papprove', label: 'Claim 50% Approved', category: 'claim50', tone: 'emerald', sub: '50% claim verified & passed' },
  { key: 'claim50-verify-reject', label: 'Claim 50% Rejected', category: 'claim50', tone: 'red', sub: '50% claim rejected by authority' },
  { key: 'inst-pay50-paid', label: 'Pay 50% Paid', category: 'claim50', tone: 'emerald', sub: '50% vendor payment disbursed' },
  { key: 'inst-pay50-partially', label: 'Pay 50% Partially Paid', category: 'claim50', tone: 'amber', sub: '50% payment partial release' },
  { key: 'inst-pay50-pending', label: 'Pay 50% Pending', category: 'claim50', tone: 'red', sub: '50% disbursement pending' },

  { key: 'claim-applicable', label: 'Claim 30% Applicable', category: 'claim30', tone: 'cyan', sub: 'Sites eligible for 30% subsidy claim' },
  { key: 'claim-raised', label: 'Claim 30% Raised', category: 'claim30', tone: 'accent', sub: '30% claim invoice submitted' },
  { key: 'claim-verify-pending', label: 'Claim 30% Verify Pending', category: 'claim30', tone: 'amber', sub: '30% claim awaiting verification' },
  { key: 'claim-verify-papprove', label: 'Claim 30% Approved', category: 'claim30', tone: 'emerald', sub: '30% claim verified & passed' },
  { key: 'claim-verify-reject', label: 'Claim 30% Rejected', category: 'claim30', tone: 'red', sub: '30% claim rejected by authority' },
  { key: 'inst-pay-paid', label: 'Pay 30% Paid', category: 'claim30', tone: 'emerald', sub: '30% vendor payment disbursed' },
  { key: 'inst-pay-partially', label: 'Pay 30% Partially Paid', category: 'claim30', tone: 'amber', sub: '30% payment partial release' },
  { key: 'inst-pay-pending', label: 'Pay 30% Pending', category: 'claim30', tone: 'red', sub: '30% disbursement pending' },
];

const STATUS_META_MAP: Record<string, StatusMeta> = Object.fromEntries(
  ULA_STATUS_CATALOG.map((m) => [m.key, m])
);

export const CATEGORY_LABELS: { key: StatusCategory; label: string }[] = [
  { key: 'all', label: 'All Sites' },
  { key: 'structure', label: 'Structure' },
  { key: 'installation', label: 'Installation' },
  { key: 'document', label: 'Documents' },
  { key: 'claim50', label: '50% Claim & Pay' },
  { key: 'claim30', label: '30% Claim & Pay' },
];

/* ───────── UI Helpers ───────── */
const DASH = '—';
const txt = (v: unknown) => (v === null || v === undefined || v === '' ? DASH : String(v));
const beneficiaryOf = (r: UlaStatusRecord) => r.beneficiary_name || r.consumer_name || r.site_name || `Site #${r.id}`;

type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'info' | 'accent';

const Badge = ({ tone, children }: { tone: Tone; children: ReactNode }) => (
  <span className={`ax-badge ax-badge--soft ax-badge--${tone}`}>{children}</span>
);

const isInstalled = (r: UlaStatusRecord): boolean => {
  const s = String(r.inst_status ?? r.installation_status ?? '').toLowerCase().trim();
  return s === '1' || s === 'complete' || s === 'completed' || s === 'installed';
};

const isStructureApproved = (r: UlaStatusRecord): boolean => {
  const s = String(r.structure_status ?? '').toLowerCase().trim();
  return s === '1' || s === 'approved' || s === 'complete';
};

type VerifyState = 'approved' | 'rejected' | 'pending';

const verifyState = (r: UlaStatusRecord): VerifyState => {
  const raw = String(r.verify_status ?? r.structure_verify_status ?? '').toLowerCase().trim();
  if (raw === '1' || raw === 'approved' || raw === 'approve') return 'approved';
  if (raw === '2' || raw === 'rejected' || raw === 'reject') return 'rejected';
  return 'pending';
};

const verifyLabel = (s: VerifyState) => (s === 'approved' ? 'Approved' : s === 'rejected' ? 'Rejected' : 'Pending');
const verifyTone = (s: VerifyState): Tone => (s === 'approved' ? 'success' : s === 'rejected' ? 'danger' : 'warning');

const StructureBadge = ({ row }: { row: UlaStatusRecord }) =>
  isStructureApproved(row) ? <Badge tone="success">Approved</Badge> : <Badge tone="warning">Pending</Badge>;

const InstallBadge = ({ row }: { row: UlaStatusRecord }) =>
  isInstalled(row) ? <Badge tone="success">Installed</Badge> : <Badge tone="warning">Pending</Badge>;

const VerifyBadge = ({ row }: { row: UlaStatusRecord }) => {
  const s = verifyState(row);
  return <Badge tone={verifyTone(s)}>{verifyLabel(s)}</Badge>;
};

const DocBadge = ({ row }: { row: UlaStatusRecord }) => {
  const isDoc = Number(row.inst_doc_status ?? row.doc_status ?? 0) === 1;
  return isDoc ? <Badge tone="success">Uploaded</Badge> : <Badge tone="warning">Pending</Badge>;
};

const ClaimBadge = ({ row }: { row: UlaStatusRecord }) => {
  const c50 = Number(row.claim50_status ?? row.claim_status ?? 0);
  const c30 = Number(row.claim30_status ?? 0);
  if (c50 === 2 || c30 === 2) return <Badge tone="success">Approved</Badge>;
  if (c50 === 3 || c30 === 3) return <Badge tone="danger">Rejected</Badge>;
  if (c50 === 1 || c30 === 1) return <Badge tone="info">Raised</Badge>;
  return <Badge tone="neutral">Not Raised</Badge>;
};

const PaymentBadge = ({ row }: { row: UlaStatusRecord }) => {
  const p50 = Number(row.payment50_status ?? row.payment_status ?? 0);
  const p30 = Number(row.payment30_status ?? 0);
  if (p50 === 1 || p30 === 1) return <Badge tone="success">Paid</Badge>;
  if (p50 === 2 || p30 === 2) return <Badge tone="warning">Partial</Badge>;
  return <Badge tone="danger">Pending</Badge>;
};

const fmtTime = (d: Date) => d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();

const rowImage = (r: UlaStatusRecord): string => {
  const raw =
    r.complete_photo ||
    r.installation_image ||
    r.structure_image ||
    r.module_serial_image;
  return raw ? resolveBiharMediaUrl(raw) || '' : '';
};

const rowLabel = (r: UlaStatusRecord) => r.beneficiary_name || r.consumer_name || r.site_name || (r.ca_no ? `CA ${r.ca_no}` : `#${r.id}`);

function resolveUlaInitialStatus(rawStatus: string | null, rawHash: string): string {
  const hash = (rawHash || '').replace('#', '').toLowerCase().trim();
  if (rawStatus && rawStatus !== 'total' && rawStatus !== 'total-sites') return rawStatus;
  if (hash === 'pending' || hash === 'penidng') return 'pending';
  if (hash === 'completed' || hash === 'complete') return 'complete';
  if (hash === 'structure') return 'structure-complete';
  if (hash === 'payment' || hash === 'pay') return 'inst-pay50-paid';
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
    <Modal open onClose={onClose} labelledBy="ulasv-preview-title" dialogClass="ax-modal__dialog--lg">
      <div className="ax-modal__header">
        <h2 className="ax-modal__title" id="ulasv-preview-title">{title || 'Photo Preview'}</h2>
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

/* ───────── KPI card (identical to SSL / SRT status view) ───────── */
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
  'Beneficiary Name',
  'District',
  'Block',
  'Village',
  'CA Number',
  'Contact No.',
  'Sanction Load',
  'Site Photo',
  'Structure Status',
  'Installation Status',
  'Verify Status',
  'Doc Status',
  'Claim Status',
  'Payment Status',
  'Action',
];

export function Bihar_Installation_ULA_StatusView() {
  const [searchParams, setSearchParams] = useSearchParams();

  const queryStatus = searchParams.get('status');
  const initialDistrict = searchParams.get('district') || 'all';

  const [currentStatus, setCurrentStatus] = useState<string>(() => resolveUlaInitialStatus(queryStatus, window.location.hash));
  const [selectedDistrict, setSelectedDistrict] = useState<string>(initialDistrict);
  const [verifyFilter, setVerifyFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');
  const [search, setSearch] = useState<string>('');

  const [items, setItems] = useState<UlaStatusRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [updatedAt, setUpdatedAt] = useState<Date>(new Date());

  const [detailItem, setDetailItem] = useState<UlaStatusRecord | null>(null);
  const [preview, setPreview] = useState<{ url: string; title: string } | null>(null);

  // Meta for current status
  const currentMeta = useMemo(() => {
    return (
      STATUS_META_MAP[currentStatus] || {
        key: currentStatus,
        label: currentStatus.replace(/[-_]/g, ' ').toUpperCase(),
        category: 'all' as StatusCategory,
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
        data = await biharUlaInstallationService.getDashboardSitesByDistrict(currentStatus, selectedDistrict);
      } else {
        data = await biharUlaInstallationService.getDashboardSitesByStatus(currentStatus);
      }
      setItems(Array.isArray(data) ? data : []);
      setUpdatedAt(new Date());
    } catch (err: any) {
      console.error('[Bihar ULA StatusView] loadData error:', err);
      setErrorMsg(err?.message || 'Failed to load Bihar ULA status records from server.');
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
    const resolved = resolveUlaInitialStatus(s, window.location.hash);
    if (resolved && resolved !== currentStatus) setCurrentStatus(resolved);
    if (d && d !== selectedDistrict) setSelectedDistrict(d);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Hash change sync
  useEffect(() => {
    const onHashChange = () => {
      const resolved = resolveUlaInitialStatus(searchParams.get('status'), window.location.hash);
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
    if (statusKey === 'pending') window.location.hash = 'pending';
    else if (statusKey === 'complete') window.location.hash = 'completed';
    else if (statusKey.startsWith('inst-pay')) window.location.hash = 'payment';
    else if (statusKey.startsWith('structure')) window.location.hash = 'structure';
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
    const structApp = items.filter(isStructureApproved).length;
    const vApp = items.filter((r) => verifyState(r) === 'approved').length;
    const vRej = items.filter((r) => verifyState(r) === 'rejected').length;
    const vPend = items.filter((r) => verifyState(r) === 'pending').length;
    return { total, installed, structApp, vApp, vRej, vPend };
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
        r.beneficiary_name,
        r.consumer_name,
        r.site_name,
        r.district,
        r.block,
        r.village,
        r.ca_no,
        r.contact_no,
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
  const exportCols: ExportColumn<UlaStatusRecord>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r, idx) => (idx !== undefined ? idx + 1 : '') },
      { header: 'Beneficiary Name', accessor: (r) => beneficiaryOf(r) },
      { header: 'District', accessor: (r) => r.district || DASH },
      { header: 'Block', accessor: (r) => r.block || DASH },
      { header: 'Village', accessor: (r) => r.village || DASH },
      { header: 'CA Number', accessor: (r) => r.ca_no || DASH },
      { header: 'Contact No.', accessor: (r) => r.contact_no || DASH },
      { header: 'Sanction Load', accessor: (r) => (r.sanction_load ? `${r.sanction_load} HP` : DASH) },
      { header: 'Structure Status', accessor: (r) => (isStructureApproved(r) ? 'Approved' : 'Pending') },
      { header: 'Installation Status', accessor: (r) => (isInstalled(r) ? 'Installed' : 'Pending') },
      { header: 'Verify Status', accessor: (r) => verifyLabel(verifyState(r)) },
      { header: 'Doc Status', accessor: (r) => (Number(r.inst_doc_status ?? r.doc_status ?? 0) === 1 ? 'Uploaded' : 'Pending') },
      { header: 'Claim Status', accessor: (r) => (Number(r.claim50_status ?? r.claim_status ?? 0) === 2 ? 'Approved' : Number(r.claim50_status ?? 0) === 1 ? 'Raised' : 'Not Raised') },
      { header: 'Payment Status', accessor: (r) => (Number(r.payment50_status ?? r.payment_status ?? 0) === 1 ? 'Paid' : 'Pending') },
    ],
    []
  );

  const pageTitle = `Bihar ULA Sites: ${currentMeta.label}${!isAllDistricts ? ` (${selectedDistrict})` : ''}`;
  const fileBase = `Bihar_ULA_${currentStatus}`;

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* ── Page Head (Matching Bihar SSL Installation Data exactly) ── */}
      <PageHead
        title="Bihar ULA Installation Data"
        subtitle={`Viewing ${currentMeta.label}${!isAllDistricts ? ` in ${selectedDistrict}` : ''} — Master register of solar pump installations, verification, claims and payment status · Updated ${fmtTime(updatedAt)}`}
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Bihar' },
          { label: 'Installation' },
          { label: 'ULA' },
          { label: 'Dashboard', href: '/v/bihar/installation/ula/dashboard' },
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
            <Link to="/v/bihar/installation/ula/dashboard" className="ax-btn ax-btn--secondary ax-btn--sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}>
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </Link>
            <Link to="/v/bihar/installation/ula/view-installation" className="ax-btn ax-btn--primary ax-btn--sm">
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
          label="Installed Pumps"
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
          label="Structure Approved"
          value={summary.structApp.toLocaleString('en-IN')}
          sub={`${summary.vRej} audit rejected`}
          icon={svgIcon(<><path d="M13 10V3L4 14h7v7l9-11h-7z" /></>)}
        />
      </div>

      {/* ── Main Table Card ── */}
      <section className="ax-card ax-col--12" role="region" aria-label="Bihar ULA Installations">
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
                id="ulasv_status_category_filter"
                className="ax-input ax-input--sm"
                style={{ width: 190, height: 32, fontSize: 'var(--ax-text-xs)' }}
                value={currentStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
                aria-label="Status category"
              >
                {CATEGORY_LABELS.map((cat) => (
                  <optgroup key={cat.key} label={cat.label}>
                    {ULA_STATUS_CATALOG.filter((s) => s.category === cat.key).map((sm) => (
                      <option key={sm.key} value={sm.key}>{sm.label}</option>
                    ))}
                  </optgroup>
                ))}
                {!STATUS_META_MAP[currentStatus] && <option value={currentStatus}>{currentMeta.label}</option>}
              </select>

              {/* District Filter */}
              <select
                id="ulasv_district_filter"
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
                id="ulasv_verify_filter"
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
                placeholder="Search beneficiary, CA no, contact…"
                size="sm"
                ariaLabel="Search ULA installation sites"
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
            <caption className="ax-visually-hidden">Bihar ULA Installation Data</caption>
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
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading Bihar ULA records from server…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td className="ax-table__td" colSpan={COLUMN_HEADERS.length} style={{ padding: 0 }}>
                    <TableEmptyState
                      title="No ULA installation sites found"
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
                      <td className="ax-table__td">{txt(row.village)}</td>
                      <td className="ax-table__td" style={monoCell}>{txt(row.ca_no)}</td>
                      <td className="ax-table__td" style={monoCell}>{txt(row.contact_no)}</td>
                      <td className="ax-table__td ax-num">{row.sanction_load ? `${row.sanction_load} HP` : DASH}</td>

                      {/* Photo thumbnail */}
                      <td className="ax-table__td">
                        <SiteThumbnail src={img} alt={`Site ${label} - Photo`} onPreview={openPreview} />
                      </td>

                      {/* Status badges */}
                      <td className="ax-table__td"><StructureBadge row={row} /></td>
                      <td className="ax-table__td"><InstallBadge row={row} /></td>
                      <td className="ax-table__td"><VerifyBadge row={row} /></td>
                      <td className="ax-table__td"><DocBadge row={row} /></td>
                      <td className="ax-table__td"><ClaimBadge row={row} /></td>
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
      <Modal open={!!detailItem} onClose={() => setDetailItem(null)} labelledBy="ulasv-detail-title" dialogClass="ax-modal__dialog--md">
        {detailItem && (
          <div>
            <div className="ax-modal__header">
              <div>
                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700 }} id="ulasv-detail-title">
                  ULA Plant Record {beneficiaryOf(detailItem)}
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
                <div className="ula-m-info"><span>Beneficiary:</span> <b>{txt(beneficiaryOf(detailItem))}</b></div>
                {detailItem.father_name && <div className="ula-m-info"><span>Father&apos;s Name:</span> <b>{txt(detailItem.father_name)}</b></div>}
                <div className="ula-m-info"><span>District:</span> <b>{txt(detailItem.district)}</b></div>
                <div className="ula-m-info"><span>Block:</span> <b>{txt(detailItem.block)}</b></div>
                <div className="ula-m-info"><span>Village:</span> <b>{txt(detailItem.village)}</b></div>
                <div className="ula-m-info"><span>CA Number:</span> <b>{txt(detailItem.ca_no)}</b></div>
                <div className="ula-m-info"><span>Contact No:</span> <b>{txt(detailItem.contact_no)}</b></div>
                <div className="ula-m-info"><span>Sanction Load:</span> <b>{detailItem.sanction_load ? `${detailItem.sanction_load} HP` : DASH}</b></div>
                <div className="ula-m-info"><span>Structure:</span> <b>{isStructureApproved(detailItem) ? 'Approved' : 'Pending'}</b></div>
                <div className="ula-m-info"><span>Installation:</span> <b>{isInstalled(detailItem) ? 'Installed' : 'Pending'}</b></div>
                <div className="ula-m-info"><span>BREDA Verification:</span> <b>{verifyLabel(verifyState(detailItem))}</b></div>
                <div className="ula-m-info"><span>Doc Status:</span> <b>{Number(detailItem.inst_doc_status ?? detailItem.doc_status ?? 0) === 1 ? 'Uploaded' : 'Pending'}</b></div>
                <div className="ula-m-info"><span>Claim 50%:</span> <b>{Number(detailItem.claim50_status ?? detailItem.claim_status ?? 0) === 2 ? 'Approved' : Number(detailItem.claim50_status ?? 0) === 1 ? 'Raised' : 'Pending'}</b></div>
                <div className="ula-m-info"><span>Payment 50%:</span> <b>{Number(detailItem.payment50_status ?? detailItem.payment_status ?? 0) === 1 ? 'Paid' : 'Pending'}</b></div>
              </div>

              {/* Photos */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {(() => {
                  const sImg = detailItem.structure_image ? resolveBiharMediaUrl(detailItem.structure_image) : '';
                  return (
                    <div style={{ border: '1px solid var(--ax-border, #e2e8f0)', borderRadius: 6, padding: 6, textAlign: 'center' }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ax-text-muted)', marginBottom: 4 }}>Structure Photo</div>
                      {sImg ? (
                        <img
                          src={sImg}
                          alt="Structure"
                          style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 0, border: '1px solid var(--ax-border, #e2e8f0)', cursor: 'zoom-in' }}
                          onClick={() => openPreview(sImg, `${beneficiaryOf(detailItem)} - Structure Photo`)}
                        />
                      ) : (
                        <div style={{ height: 110, background: 'var(--ax-surface-subtle, #f8fafc)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ax-text-muted)', fontSize: 11 }}>
                          N/A
                        </div>
                      )}
                    </div>
                  );
                })()}

                {(() => {
                  const iImg = (detailItem.complete_photo || detailItem.installation_image) ? resolveBiharMediaUrl(detailItem.complete_photo || detailItem.installation_image) : '';
                  return (
                    <div style={{ border: '1px solid var(--ax-border, #e2e8f0)', borderRadius: 6, padding: 6, textAlign: 'center' }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ax-text-muted)', marginBottom: 4 }}>Installation Photo</div>
                      {iImg ? (
                        <img
                          src={iImg}
                          alt="Installation"
                          style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 0, border: '1px solid var(--ax-border, #e2e8f0)', cursor: 'zoom-in' }}
                          onClick={() => openPreview(iImg, `${beneficiaryOf(detailItem)} - Installation Photo`)}
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

export default Bihar_Installation_ULA_StatusView;
