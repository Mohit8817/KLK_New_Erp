import { useState, useMemo, useEffect, useCallback, useRef, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  upInstallationService,
  resolveUpMediaUrl,
  getUpMediaCandidates,
  type UpKusumCInstalledSiteItem,
} from '../../up-services';
import {
  Pagination,
  usePagination,
  SearchInput,
  TableExportToolbar,
  TableEmptyState,
  type ExportColumn,
} from '../../../../../common';

const DASH = '—';

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

const Badge = ({ tone, children }: { tone: Tone; children: ReactNode }) => (
  <span className={`ax-badge ax-badge--soft ax-badge--${tone}`}>{children}</span>
);

const VerifyBadge = ({ value, raw }: { value?: number | string; raw?: any }) => {
  const r = String(raw ?? '').toLowerCase().trim();
  const v = Number(value ?? 0);
  if (v === 1 || r === '1' || r === 'approved' || r === 'ok') return <Badge tone="success">Approved</Badge>;
  if (v === 2 || r === '2' || r === 'rejected' || r === 'reject') return <Badge tone="danger">Rejected</Badge>;
  return <Badge tone="warning">Pending</Badge>;
};

const DocBadge = ({ status, docUrl }: { status?: number | string; docUrl?: string | null }) => {
  const s = Number(status ?? 0);
  const r = String(status ?? '').toLowerCase().trim();
  if (s === 2 || r === 'approved' || r === 'ok') return <Badge tone="success">Approved</Badge>;
  if (s === 3 || r === 'rejected' || r === 'reject') return <Badge tone="danger">Reject</Badge>;
  if (s === 1 || r === 'submitted') return <Badge tone="info">Submitted</Badge>;
  return <Badge tone="warning">Pending</Badge>;
};

const ClaimBadge = ({ status }: { status?: number | string }) => {
  const s = Number(status ?? 0);
  if (s === 1) return <Badge tone="info">Claim Applicable</Badge>;
  if (s === 2) return <Badge tone="success">Approved</Badge>;
  if (s === 3) return <Badge tone="danger">Reject</Badge>;
  return <Badge tone="neutral">Not Applicable</Badge>;
};

const PaymentBadge = ({ status }: { status?: number | string }) => {
  const s = Number(status ?? 0);
  if (s === 2 || s === 1) return <Badge tone="success">Paid</Badge>;
  return <Badge tone="warning">Pending</Badge>;
};

const txt = (row: UpKusumCInstalledSiteItem, key: string): string => {
  const v = (row as Record<string, any>)[key];
  if (v === null || v === undefined || v === '') return '';
  return String(v).trim();
};

const getStateName = (row: UpKusumCInstalledSiteItem): string =>
  (row.state || (row as any).f_state || 'UP').trim();

const getDistrict = (row: UpKusumCInstalledSiteItem): string =>
  (row.f_district || row.district || '').trim();

const getBlockVillage = (row: UpKusumCInstalledSiteItem): string => {
  const blk = (row.f_block || row.block || row.f_tehsil || (row as any).f_post || '').trim();
  const vil = (row.f_village || row.village || '').trim();
  if (blk && vil) return `${vil} (${blk})`;
  return vil || blk || '';
};

const getFarmerName = (row: UpKusumCInstalledSiteItem): string =>
  (row.f_farmer_name || row.farmer_name || (row as any).applicant_name || (row as any).beneficiary_name || '').trim();

const getFatherName = (row: UpKusumCInstalledSiteItem): string =>
  (row.f_father_name || row.father_name || '').trim();

const getContact = (row: UpKusumCInstalledSiteItem): string =>
  (row.f_contact || (row as any).contact_no || '').trim();

const getRawDoc = (row: UpKusumCInstalledSiteItem): string | null => {
  const raw =
    row.inst_doc ||
    (row as any).hoc_photo ||
    (row as any).doc_hoc_photo ||
    (row as any).doc_file ||
    (row as any).document ||
    null;
  if (!raw || String(raw).trim() === '' || raw === DASH) return null;
  return String(raw).trim();
};

const getVerifyVal = (row: UpKusumCInstalledSiteItem): number => {
  const raw = row.inst_verify_status ?? (row as any).verify_status;
  if (raw === undefined || raw === null || raw === '') return 0;
  const num = Number(raw);
  if (!Number.isNaN(num)) return num;
  const s = String(raw).toLowerCase().trim();
  if (s === 'approved' || s === 'verified' || s === 'ok') return 1;
  if (s === 'rejected' || s === 'reject') return 2;
  return 0;
};

const parseModuleSerials = (val: any): string[] => {
  if (val === null || val === undefined) return [];
  if (Array.isArray(val)) {
    return val.flatMap((item) => parseModuleSerials(item)).filter((s) => s && s !== DASH);
  }
  let str = String(val).trim();
  if (!str || str === '[]' || str === '[""]' || str === "['']" || str === DASH) return [];

  if (
    (str.startsWith('[') && str.endsWith(']')) ||
    (str.startsWith('{') && str.endsWith('}')) ||
    (str.startsWith('"') && str.endsWith('"'))
  ) {
    try {
      const parsed = JSON.parse(str);
      if (Array.isArray(parsed) || typeof parsed === 'object') {
        const res = parseModuleSerials(parsed);
        if (res.length > 0) return res;
      }
    } catch {}
  }
  str = str.replace(/^[\[{\("']+|[\]}\)"']+$/g, '');
  const tokens = str.split(/[,;\n\r|\t]+|\s{2,}/);
  const result: string[] = [];
  for (const t of tokens) {
    const clean = t.replace(/[\[\]"']/g, '').trim();
    if (clean && clean !== DASH && clean.toLowerCase() !== 'null' && clean.toLowerCase() !== 'undefined') {
      result.push(clean);
    }
  }
  return result;
};

const getRowModuleSerials = (row: any): string[] => {
  if (!row || typeof row !== 'object') return [];
  const candidates = [
    row.module_serial_no,
    row.module_serials,
    row.module_no,
    row.modules,
    row.module_serial,
    row.mod_serial_no,
    row.modules_serial_no,
  ];
  for (const c of candidates) {
    if (c !== undefined && c !== null) {
      const parsed = parseModuleSerials(c);
      if (parsed.length > 0) return parsed;
    }
  }
  return [];
};

const fmtSerials = (val?: any): string => {
  if (!val) return DASH;
  const list = parseModuleSerials(val);
  return list.length > 0 ? list.join(', ') : DASH;
};

/* ── Status Metadata Catalog for UP Kusum-C ── */
export interface KusumCStatusMeta {
  key: string;
  label: string;
  tone: 'accent' | 'emerald' | 'amber' | 'cyan' | 'violet' | 'red';
  desc: string;
}

export const KUSUM_C_STATUS_LIST: KusumCStatusMeta[] = [
  { key: 'total', label: 'Total Sites', tone: 'accent', desc: 'All assigned PM-KUSUM Component-C solar pump sites across UP' },
  { key: 'complete', label: 'Installation Complete', tone: 'emerald', desc: 'Sites where pump, VFD/controller & modules are installed' },
  { key: 'pending', label: 'Installation Pending', tone: 'amber', desc: 'Assigned pump sites awaiting field installation' },
  { key: 'site-assigned', label: 'Site Assigned', tone: 'violet', desc: 'Sites assigned to vendor for installation' },
  { key: 'accept-pending', label: 'Acceptance Pending', tone: 'amber', desc: 'Sites awaiting vendor acceptance' },
  { key: 'site-not-assigned', label: 'Site Not Assigned', tone: 'red', desc: 'Sites pending vendor assignment' },
  { key: 'verify-approved', label: 'Verify Approved', tone: 'emerald', desc: 'Sites physically inspected and approved by auditors' },
  { key: 'verify-pending', label: 'Verify Pending', tone: 'amber', desc: 'Completed sites awaiting field audit inspection' },
  { key: 'verify-reject', label: 'Verify Rejected', tone: 'red', desc: 'Sites flagged with audit discrepancies or rework' },
  { key: 'doc-approved', label: 'HOC / Doc Approved', tone: 'emerald', desc: 'Sites with approved handover certificates and compliance docs' },
  { key: 'doc-pending', label: 'HOC / Doc Pending', tone: 'amber', desc: 'Sites where handover documents are pending review' },
  { key: 'doc-reject', label: 'HOC / Doc Rejected', tone: 'red', desc: 'Handover documents flagged for re-upload' },
  { key: 'claim-applicable', label: 'Claim Applicable', tone: 'cyan', desc: 'Sites eligible for vendor payment invoice submission' },
  { key: 'claim-raised', label: 'Claim Raised', tone: 'accent', desc: 'Sites with submitted vendor payment invoices' },
  { key: 'claim-approved', label: 'Claim Approved', tone: 'emerald', desc: 'Sites whose payment claims are cleared' },
  { key: 'claim-pending', label: 'Claim Pending', tone: 'amber', desc: 'Payment claims undergoing financial review' },
  { key: 'pay-done', label: 'Payment Done', tone: 'emerald', desc: 'Sites where vendor payment disbursal is completed' },
  { key: 'pay-partially', label: 'Partially Paid', tone: 'cyan', desc: 'Sites with partial milestone payment disbursed' },
  { key: 'pay-pending', label: 'Payment Pending', tone: 'amber', desc: 'Sites awaiting final financial disbursal' },
];

const STATUS_META_MAP: Record<string, KusumCStatusMeta> = Object.fromEntries(
  KUSUM_C_STATUS_LIST.map((m) => [m.key, m])
);

export const normalizeKusumCStatus = (raw: string | undefined | null): string => {
  if (!raw) return 'total';
  const clean = raw.trim().toLowerCase();
  if (clean === 'install' || clean === 'installed' || clean === 'installation-complete') return 'complete';
  if (clean === 'not-install' || clean === 'not-installed') return 'pending';
  if (clean === 'all') return 'total';
  if (clean === 'approved' || clean === 'verified') return 'verify-approved';
  if (clean === 'rejected') return 'verify-reject';
  if (clean === 'doc-approve') return 'doc-approved';
  if (clean === 'inst-pay-done') return 'pay-done';
  if (clean === 'inst-pay-pending') return 'pay-pending';
  if (clean === 'inst-pay-partially') return 'pay-partially';
  return clean;
};

/* ───────── Modal (design-system dialog: portal to <body>, focus trap, Esc to close) ───────── */
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
  describedBy,
  role = 'dialog',
  centered = true,
  dialogClass = '',
  dialogStyle,
  modalStyle,
  closeOnBackdrop = true,
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  describedBy?: string;
  role?: 'dialog' | 'alertdialog';
  centered?: boolean;
  dialogClass?: string;
  dialogStyle?: CSSProperties;
  modalStyle?: CSSProperties;
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
    <div
      className={`ax-modal${centered ? ' ax-modal--centered' : ''}`}
      role={role}
      aria-modal="true"
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      style={modalStyle}
    >
      <div className="ax-modal__backdrop" onClick={() => closeOnBackdrop && onClose()} />
      <div ref={dialogRef} className={`ax-modal__dialog${dialogClass ? ' ' + dialogClass : ''}`} style={dialogStyle}>
        {children}
      </div>
    </div>,
    document.body
  );
}

/* ───────── Image preview modal (Interactive Zoom, Real Image) ───────── */
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
    <Modal open onClose={onClose} labelledBy="kusumc-preview-title" dialogClass="ax-modal__dialog--lg">
      <div className="ax-modal__header">
        <h2 className="ax-modal__title" id="kusumc-preview-title">{title || 'Media Preview'}</h2>
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

/* ── Interactive Image Thumbnail (NO BORDER RADIUS, Real Candidates) ── */
function InstallationThumbnail({
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
  const candidates = useMemo(() => getUpMediaCandidates(src), [src]);
  const [candidateIdx, setCandidateIdx] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setCandidateIdx(0);
    setFailed(false);
  }, [src]);

  if (!src || failed || candidateIdx >= candidates.length) {
    return <span style={{ color: 'var(--ax-text-subtle)' }}>{DASH}</span>;
  }

  const currentUrl = candidates[candidateIdx];

  return (
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
      title="Click to preview"
    />
  );
}

/* ── Action Dropdown (menu rendered in <body> via createPortal so table never clips it) ── */
const MENU_W = 170;
const MENU_H = 76;

function RowActionDropdown({
  onEdit,
  onView,
}: {
  onEdit: () => void;
  onView: () => void;
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
                onEdit();
              }}
            >
              Edit Details
            </button>
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
          </div>,
          document.body
        )}
    </>
  );
}

/* ───────── Solar Module Serials Modal & Cell ───────── */
interface ModuleSerialsModalProps {
  serials: string[];
  siteTitle?: string;
  farmerName?: string;
  siteId?: number | string;
  pumpCapacity?: string;
  district?: string;
  onClose: () => void;
}

function ModuleSerialsModal({
  serials,
  siteTitle,
  farmerName,
  siteId,
  pumpCapacity,
  district,
  onClose,
}: ModuleSerialsModalProps) {
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const filteredSerials = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return serials;
    return serials.filter((s) => s.toLowerCase().includes(q));
  }, [serials, search]);

  const handleCopyAll = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigator.clipboard?.writeText(serials.join(', '));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleCopySingle = (sn: string, idx: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigator.clipboard?.writeText(sn);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  return (
    <Modal open onClose={onClose} labelledBy="module-serials-modal-title" dialogClass="ax-modal__dialog--md">
      <div className="ax-modal__header">
        <div>
          <h3 className="ax-modal__title" id="module-serials-modal-title" style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
            Solar PV Module Serial Numbers ({serials.length})
          </h3>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--ax-text-muted, #64748b)' }}>
            {farmerName || siteTitle ? `Farmer: ${farmerName || siteTitle}` : ''}
            {district ? ` · District: ${district}` : ''}
            {pumpCapacity ? ` · Pump: ${pumpCapacity}` : ''}
          </p>
        </div>
        <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">
          {X_ICON}
        </button>
      </div>

      <div className="ax-modal__body" style={{ maxHeight: '60vh', overflowY: 'auto', padding: '16px 20px' }}>
        {serials.length > 4 && (
          <div style={{ marginBottom: 12 }}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search serial number…"
              className="ax-input ax-input--sm"
              style={{ width: '100%', fontSize: 12 }}
            />
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 8 }}>
          {filteredSerials.map((sn, idx) => (
            <div
              key={`${sn}-${idx}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: 6,
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                fontSize: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#64748b',
                    background: '#e2e8f0',
                    borderRadius: 4,
                    padding: '2px 5px',
                    fontFamily: 'monospace',
                    flexShrink: 0,
                  }}
                >
                  #{idx + 1}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--ax-font-mono, monospace)',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#0f172a',
                    wordBreak: 'break-all',
                    letterSpacing: '0.02em',
                  }}
                >
                  {sn}
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => handleCopySingle(sn, idx, e)}
                style={{
                  background: copiedIdx === idx ? '#dcfce7' : '#ffffff',
                  border: `1px solid ${copiedIdx === idx ? '#86efac' : '#cbd5e1'}`,
                  color: copiedIdx === idx ? '#15803d' : '#475569',
                  cursor: 'pointer',
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '3px 7px',
                  borderRadius: 4,
                  marginLeft: 8,
                  flexShrink: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                }}
                title="Copy serial number"
              >
                {copiedIdx === idx ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          ))}
          {filteredSerials.length === 0 && (
            <div
              style={{
                gridColumn: '1 / -1',
                padding: '24px 16px',
                textAlign: 'center',
                color: '#64748b',
                background: '#f8fafc',
                borderRadius: 8,
                border: '1px dashed #cbd5e1',
                fontSize: 13,
              }}
            >
              No module serials match "<b>{search}</b>"
            </div>
          )}
        </div>
      </div>

      <div
        className="ax-modal__footer"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 20px',
          borderTop: '1px solid var(--ax-border, #e2e8f0)',
          background: '#f8fafc',
          borderBottomLeftRadius: 'inherit',
          borderBottomRightRadius: 'inherit',
        }}
      >
        <button
          type="button"
          onClick={handleCopyAll}
          className="ax-btn ax-btn--secondary ax-btn--sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          {copiedAll ? (
            <span style={{ color: '#16a34a', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              ✓ Copied All ({serials.length})
            </span>
          ) : (
            <>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              <span>Copy All ({serials.length})</span>
            </>
          )}
        </button>

        <button type="button" onClick={onClose} className="ax-btn ax-btn--primary ax-btn--sm">
          Close
        </button>
      </div>
    </Modal>
  );
}

function ModuleSerialsCell({
  serials,
  siteTitle,
  farmerName,
  siteId,
  pumpCapacity,
  district,
}: {
  serials: string[];
  siteTitle?: string;
  farmerName?: string;
  siteId?: number | string;
  pumpCapacity?: string;
  district?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  if (!serials || serials.length === 0) {
    return <span style={{ color: 'var(--ax-text-subtle, #94a3b8)' }}>{DASH}</span>;
  }

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(serials.join(', '));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const maxInitial = 2;
  const hasMore = serials.length > maxInitial;
  const visible = serials.slice(0, maxInitial);

  return (
    <>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 4,
          minWidth: 140,
          maxWidth: 260,
        }}
        title={serials.join(', ')}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
          {visible.map((sn, idx) => (
            <span
              key={`${sn}-${idx}`}
              onClick={() => setModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '2px 6px',
                borderRadius: 4,
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                fontFamily: 'var(--ax-font-mono, monospace)',
                fontSize: 11,
                fontWeight: 600,
                color: '#0f172a',
                lineHeight: 1.3,
                wordBreak: 'break-all',
                cursor: 'pointer',
              }}
              title="Click to view all module serials"
            >
              {sn}
            </span>
          ))}
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 11, marginTop: 1 }}>
          {hasMore && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setModalOpen(true);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                padding: 0,
                color: 'var(--asw-primary, #2563eb)',
                fontWeight: 600,
                fontSize: 11,
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
              title="Click to view all module serials in modal"
            >
              +{serials.length - maxInitial} more
            </button>
          )}
          <button
            type="button"
            onClick={handleCopy}
            style={{
              background: 'transparent',
              border: 'none',
              padding: 0,
              color: copied ? '#16a34a' : 'var(--ax-text-muted, #64748b)',
              fontSize: 11,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 2,
            }}
            title="Copy module serial numbers"
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {modalOpen && (
        <ModuleSerialsModal
          serials={serials}
          siteTitle={siteTitle}
          farmerName={farmerName}
          siteId={siteId}
          pumpCapacity={pumpCapacity}
          district={district}
          onClose={() => setModalOpen(false)}
        />
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
  .ax-modal__backdrop {
    position: fixed; inset: 0; background: transparent;
  }
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
    color: var(--ax-text-muted, #64748b); font-size: 15px; font-weight: 700;
    transition: all 0.15s ease;
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

/* ───────── Responsive page CSS (Exact Solar ERP reference, all columns scrollable) ───────── */
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
const monoCell = { fontFamily: 'var(--ax-font-mono)', fontSize: '12px' } as const;

/* ── Top KPI Card Component ── */
type KpiTone = 'accent' | 'cyan' | 'emerald' | 'amber' | 'violet';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(37, 99, 235, 0.12)', fg: '#2563eb' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan, #06b6d4) 14%, transparent)', fg: '#0891b2' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald, #10b981) 14%, transparent)', fg: '#16a34a' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber, #f59e0b) 14%, transparent)', fg: '#d97706' },
  violet: { bg: 'color-mix(in oklab, var(--ax-viz-violet, #8b5cf6) 14%, transparent)', fg: '#7c3aed' },
};

function KpiCard({
  icon,
  tone,
  label,
  value,
  sub,
  onClick,
}: {
  icon: ReactNode;
  tone: KpiTone;
  label: string;
  value: ReactNode;
  sub: string;
  onClick?: () => void;
}) {
  const t = TONE[tone];
  return (
    <div
      className={`ax-card ${onClick ? 'asw-interactive-kpi' : ''}`}
      style={{ padding: '14px 18px', borderRadius: 12, minWidth: 0, cursor: onClick ? 'pointer' : undefined }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
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

// Full comprehensive columns tailored for UP Kusum-C Solar Pump Installation (Matching View Kusum-C Sites)
const COMMON_HEADERS = [
  'Sr. No.',
  'State',
  'District',
  'Block / Village',
  'Farmer Name',
  'Father Name',
  'Contact Number',
  'Customer No.',
  'Pump Capacity',
  'Inverter No.',
  'VFD No.',
  'Module Serials',
  'Module Photo',
  'Inverter & VFD Photo',
  'Running Water Photo',
  'Latitude',
  'Longitude',
  'Remark',
  'Verify Status',
  'Document Status',
  'Claim Status',
  'Action',
];

export function UP_Installation_KusumC_StatusView() {
  const navigate = useNavigate();
  const { status: paramStatus } = useParams<{ status?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read URL query params or path params: status and district
  const rawStatus = paramStatus || searchParams.get('status') || 'total';
  const activeStatus = normalizeKusumCStatus(rawStatus);
  const activeDistrict = (searchParams.get('district') || '').trim();

  const [loading, setLoading] = useState(true);
  const [sites, setSites] = useState<UpKusumCInstalledSiteItem[]>([]);
  const [allDistricts, setAllDistricts] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [districtFilter, setDistrictFilter] = useState(activeDistrict || 'all');

  // Photo preview modal (interactive lightbox with zoom)
  const [preview, setPreview] = useState<{ url: string; title: string } | null>(null);
  const openPreview = useCallback((url: string, title: string) => setPreview({ url, title }), []);
  const closePreview = useCallback(() => setPreview(null), []);

  // Detail modal state
  const [detailModalItem, setDetailModalItem] = useState<UpKusumCInstalledSiteItem | null>(null);

  // Toast / feedback message
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  useEffect(() => {
    if (!toastMsg) return;
    const t = window.setTimeout(() => setToastMsg(null), 4000);
    return () => window.clearTimeout(t);
  }, [toastMsg]);

  // Synchronize districtFilter with activeDistrict from searchParams
  useEffect(() => {
    setDistrictFilter(activeDistrict || 'all');
  }, [activeDistrict]);

  // Pre-load all available UP districts from dashboard summary
  useEffect(() => {
    let cancelled = false;
    upInstallationService.getKusumCDashboard().then((dash) => {
      if (!cancelled && Array.isArray(dash?.districtwise)) {
        const names = Array.from(new Set(dash.districtwise.map((d: any) => (d.f_district || d.district || '').trim()).filter(Boolean))).sort() as string[];
        if (names.length > 0) setAllDistricts(names);
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Load data for active status and district via APIs 16 & 17
  const loadStatusData = useCallback(async () => {
    setLoading(true);
    try {
      let result: any[] = [];
      if (activeDistrict && activeDistrict !== 'all' && activeDistrict !== 'All') {
        result = await upInstallationService.getKusumCDashboardByDistrict(activeStatus, activeDistrict);
      } else {
        result = await upInstallationService.getKusumCDashboardByStatus(activeStatus);
      }
      setSites(Array.isArray(result) ? result : []);
    } catch (err: any) {
      console.error('[UP Kusum-C Dashboard Status] load error:', err);
      setToastMsg({ type: 'danger', text: err?.message || 'Failed to load installation sites from server.' });
      setSites([]);
    } finally {
      setLoading(false);
    }
  }, [activeStatus, activeDistrict]);

  useEffect(() => {
    loadStatusData();
  }, [loadStatusData]);

  // Current status metadata
  const currentStatusMeta: KusumCStatusMeta = STATUS_META_MAP[activeStatus] || {
    key: activeStatus,
    label: String(activeStatus).replace(/-/g, ' ').toUpperCase(),
    tone: 'accent',
    desc: `Drilling down sites by status: "${activeStatus}"`,
  };

  // Unique districts for filter dropdown (merged dashboard districts + current list)
  const districts = useMemo(() => {
    const set = new Set<string>(allDistricts);
    sites.forEach((r) => {
      const d = (r.f_district || r.district || '').trim();
      if (d) set.add(d);
    });
    if (activeDistrict && activeDistrict !== 'All' && activeDistrict !== 'all') {
      set.add(activeDistrict);
    }
    return Array.from(set).sort();
  }, [allDistricts, sites, activeDistrict]);

  // Filtered sites (matching search, verify status filter, and district filter)
  const filteredSites = useMemo(() => {
    let list = sites;

    if (statusFilter === 'approved') {
      list = list.filter((s) => Number(s.inst_verify_status ?? s.verify_status) === 1 || String(s.inst_verify_status ?? s.verify_status).toLowerCase() === 'approved');
    } else if (statusFilter === 'rejected') {
      list = list.filter((s) => Number(s.inst_verify_status ?? s.verify_status) === 2 || String(s.inst_verify_status ?? s.verify_status).toLowerCase() === 'rejected');
    } else if (statusFilter === 'pending') {
      list = list.filter((s) => !s.inst_verify_status || Number(s.inst_verify_status ?? s.verify_status) === 0 || String(s.inst_verify_status ?? s.verify_status).toLowerCase() === 'pending');
    }

    if (districtFilter && districtFilter !== 'all' && districtFilter !== 'All') {
      list = list.filter((s) => (s.f_district || s.district || '').trim().toLowerCase() === districtFilter.trim().toLowerCase());
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((s) => {
        const sid = String(s.id || s.excel_id || '').toLowerCase();
        const ben = String(s.f_farmer_name || s.farmer_name || (s as any).applicant_name || (s as any).beneficiary_name || '').toLowerCase();
        const fth = String(s.f_father_name || s.father_name || '').toLowerCase();
        const ph = String(s.f_contact || (s as any).contact_no || '').toLowerCase();
        const app = String(s.f_customer_no || s.uid || '').toLowerCase();
        const dist = String(s.f_district || s.district || '').toLowerCase();
        const teh = String(s.f_tehsil || s.f_block || s.block || (s as any).f_post || '').toLowerCase();
        const vil = String(s.f_village || s.village || '').toLowerCase();
        const inv = String(s.Inverter_no || (s as any).inverter_no || (s as any).inverter_serial_no || '').toLowerCase();
        const vfd = String(s.vfd_no || (s as any).vfd_serial_no || '').toLowerCase();
        const mod = typeof s.module_serial_no === 'string' ? s.module_serial_no.toLowerCase() : Array.isArray(s.module_serial_no) ? s.module_serial_no.join(' ').toLowerCase() : '';
        return (
          sid.includes(q) ||
          ben.includes(q) ||
          fth.includes(q) ||
          ph.includes(q) ||
          app.includes(q) ||
          dist.includes(q) ||
          teh.includes(q) ||
          vil.includes(q) ||
          inv.includes(q) ||
          vfd.includes(q) ||
          mod.includes(q)
        );
      });
    }
    return list;
  }, [sites, search, statusFilter, districtFilter]);

  const { paginatedData, currentPage, pageSize, totalItems, setPage, setPageSize } =
    usePagination({ data: filteredSites, initialPageSize: 100 });

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, districtFilter, activeStatus]);

  const hasFilters = search.trim() !== '' || statusFilter !== 'all' || districtFilter !== 'all';
  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setDistrictFilter('all');
    const p = new URLSearchParams(searchParams);
    p.delete('district');
    setSearchParams(p);
    setPage(1);
  };

  // Status switcher
  const handleStatusChange = (newStatus: string) => {
    const valid = normalizeKusumCStatus(newStatus);
    const p = new URLSearchParams(searchParams);
    p.delete('status');
    const qs = p.toString() ? `?${p.toString()}` : '';
    navigate(`/v/up/kusum-c-installation-view-dashboard/${valid}${qs}`);
    setPage(1);
  };

  // District filter change
  const handleDistrictChange = (newDistrict: string) => {
    setDistrictFilter(newDistrict);
    const p = new URLSearchParams(searchParams);
    if (!newDistrict || newDistrict === 'all') {
      p.delete('district');
    } else {
      p.set('district', newDistrict);
    }
    setSearchParams(p);
    setPage(1);
  };

  // Counts for KPI row
  const installedCount = useMemo(() => sites.filter((s) => Number(s.inst_status) === 1 || Boolean(s.vfd_no) || Boolean(s.Inverter_no)).length, [sites]);
  const approvedCount = useMemo(() => sites.filter((s) => Number(s.inst_verify_status ?? s.verify_status) === 1).length, [sites]);
  const pendingCount = useMemo(() => sites.filter((s) => !s.inst_verify_status || Number(s.inst_verify_status ?? s.verify_status) === 0).length, [sites]);
  const rejectedCount = useMemo(() => sites.filter((s) => Number(s.inst_verify_status ?? s.verify_status) === 2).length, [sites]);
  const paymentSettledCount = useMemo(() => sites.filter((s) => Number(s.inst_pay_status ?? s.payment_status ?? s.pay_status) === 2 || Number(s.inst_pay_status) === 1).length, [sites]);

  // Export columns (exact match with table structure)
  const exportCols: ExportColumn<UpKusumCInstalledSiteItem>[] = useMemo(() => [
    { header: 'Sr. No.', accessor: (_r: UpKusumCInstalledSiteItem, idx?: number) => (idx !== undefined ? idx + 1 : '') } as any,
    { header: 'State', accessor: (r) => getStateName(r).toUpperCase() || 'UP' },
    { header: 'District', accessor: (r) => getDistrict(r) },
    { header: 'Block / Village', accessor: (r) => getBlockVillage(r) },
    { header: 'Farmer Name', accessor: (r) => getFarmerName(r) },
    { header: 'Father Name', accessor: (r) => getFatherName(r) },
    { header: 'Contact Number', accessor: (r) => getContact(r) },
    { header: 'Customer No.', accessor: (r) => r.f_customer_no || r.excel_id || r.uid || '' },
    { header: 'Pump Capacity', accessor: (r) => r.pump_capacity ? (String(r.pump_capacity).toUpperCase().includes('HP') ? r.pump_capacity : `${r.pump_capacity} HP`) : '' },
    { header: 'Inverter No.', accessor: (r) => r.Inverter_no || (r as any).inverter_no || (r as any).inverter_serial_no || '' },
    { header: 'VFD No.', accessor: (r) => r.vfd_no || (r as any).vfd_serial_no || '' },
    { header: 'Module Serials', accessor: (r) => fmtSerials(r.module_serial_no) },
    { header: 'Module Photo', accessor: (r) => r.module_image || r.farmer_module_image || r.f_module_image || '' },
    { header: 'Inverter & VFD Photo', accessor: (r) => r.inverter_vfd_image || r.inverter_image || r.vfd_image || '' },
    { header: 'Running Water Photo', accessor: (r) => r.running_water_image || r.water_image || '' },
    { header: 'Latitude', accessor: (r) => r.latitude || (r as any).inst_latitude || '' },
    { header: 'Longitude', accessor: (r) => r.longitude || (r as any).inst_longitude || '' },
    { header: 'Remark', accessor: (r) => r.inst_remarks || r.remarks || '' },
    {
      header: 'Verify Status',
      accessor: (r) => {
        const v = getVerifyVal(r);
        if (v === 1) return 'Approved';
        if (v === 2) return 'Rejected';
        return 'Pending';
      },
    },
    {
      header: 'Document Status',
      accessor: (r) => {
        const s = Number(r.inst_doc_status ?? (r as any).document_status ?? 0);
        if (s === 2) return 'Approved';
        if (s === 3) return 'Reject';
        if (s === 1) return 'Submitted';
        return 'Pending';
      },
    },
    {
      header: 'Claim Status',
      accessor: (r) => {
        const c = Number(r.inst_claim_status ?? (r as any).claim_status ?? 0);
        if (c === 1) return 'Claim Applicable';
        if (c === 2) return 'Approved';
        if (c === 3) return 'Reject';
        return 'Not Applicable';
      },
    },
  ], []);

  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = `UP_KusumC_${activeStatus}_Installations`;
  const fileTitle = `UP Kusum-C ${currentStatusMeta.label} Installation Register`;

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
      setToastMsg({ type: 'success', text: 'Table data copied to clipboard!' });
    } catch {
      const ta = document.createElement('textarea');
      ta.value = t;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setToastMsg({ type: 'success', text: 'Table data copied to clipboard!' });
    }
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

  const headers = COMMON_HEADERS;
  const TOTAL_COLUMNS = headers.length;

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* ── Page Head (exact reference pattern) ── */}
      <PageHead
        title="UP Kusum-C - Installation Status View"
        subtitle={
          <span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>
            Showing <b>{filteredSites.length.toLocaleString('en-IN')}</b> sites for status:{' '}
            <b style={{ color: 'var(--ax-text-strong)' }}>{currentStatusMeta.label}</b>
            {districtFilter && districtFilter !== 'all' && districtFilter !== 'All' ? (
              <> in district <b style={{ color: 'var(--ax-accent, #2563eb)' }}>{districtFilter}</b></>
            ) : (
              ' across All Districts'
            )}{' '}
            · Uttar Pradesh Operations
          </span>
        }
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Uttar Pradesh' },
          { label: 'Installation' },
          { label: 'Kusum-C Dashboard', href: '/v/up/kusum-c-installation-dashboard' },
          { label: currentStatusMeta.label },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)' }}>
            <Link to="/v/up/kusum-c-installation-dashboard" className="ax-btn ax-btn--secondary ax-btn--sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}>
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </Link>
            <Link to="/v/up/install-kusum-c-site" className="ax-btn ax-btn--primary ax-btn--sm">
              <span className="ax-btn__label">+ Install Site</span>
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

      {/* ── Top Metric KPI Cards (4 cards in 1 row) ── */}
      <div className="asw-cards-row">
        <KpiCard
          tone="accent"
          label={`${currentStatusMeta.label} Total`}
          value={sites.length.toLocaleString('en-IN')}
          sub={activeDistrict ? `Filtered in ${activeDistrict}` : 'Across all Uttar Pradesh districts'}
          onClick={() => handleStatusChange('total')}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <path d="M8 9h8M8 13h8M8 17h5" />
            </svg>
          }
        />

        <KpiCard
          tone="emerald"
          label="Installed Sites"
          value={installedCount.toLocaleString('en-IN')}
          sub="Pump & VFD equipment installed"
          onClick={() => handleStatusChange('complete')}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          }
        />

        <KpiCard
          tone="cyan"
          label="Verify Approved"
          value={approvedCount.toLocaleString('en-IN')}
          sub={`${pendingCount} audit pending`}
          onClick={() => handleStatusChange('verify-approved')}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <polyline points="12 7 12 12 15 15" />
            </svg>
          }
        />

        <KpiCard
          tone="violet"
          label="Payment Settled"
          value={paymentSettledCount.toLocaleString('en-IN')}
          sub={`${rejectedCount} audit rejected`}
          onClick={() => handleStatusChange('pay-done')}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
        />
      </div>

      {/* ── Main Table Card (Completed UP Kusum-C Installation Data) ── */}
      <section className="ax-card ax-col--12" id="kusumc-tabpanel" role="tabpanel" aria-label="UP Kusum-C Installations">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">Completed UP Kusum-C Installation Data</h2>
            <p className="ax-card__subtitle">
              <span className="ax-num">{filteredSites.length}</span> of <span className="ax-num">{sites.length}</span> installations
              {' '}· Status: <b>{currentStatusMeta.label}</b>
              {' '}· Approved <b className="ax-num">{approvedCount}</b> · Pending <b className="ax-num">{pendingCount}</b> · Rejected <b className="ax-num">{rejectedCount}</b>
            </p>
          </div>
          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              {/* Status Switcher Filter */}
              <select
                id="kusumc_status_category_filter"
                className="ax-input ax-input--sm"
                style={{ width: 190, height: 32, fontSize: 'var(--ax-text-xs)' }}
                value={activeStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
                aria-label="Status category"
              >
                {KUSUM_C_STATUS_LIST.map((sm) => (
                  <option key={sm.key} value={sm.key}>
                    {sm.label}
                  </option>
                ))}
              </select>

              {/* District Filter */}
              {districts.length > 0 && (
                <select
                  id="kusumc_district_filter"
                  className="ax-input ax-input--sm"
                  style={{ width: 150, height: 32, fontSize: 'var(--ax-text-xs)' }}
                  value={districtFilter}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  aria-label="Filter by district"
                >
                  <option value="all">All Districts ({districts.length})</option>
                  {districts.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              )}

              {/* Verify Status Filter */}
              <select
                id="kusumc_verify_status_filter"
                className="ax-input ax-input--sm"
                style={{ width: 130, height: 32, fontSize: 'var(--ax-text-xs)' }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by verify status"
              >
                <option value="all">All Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
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
                placeholder="Search beneficiary, serial, IMEI, district…"
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
          <table
            className="ax-table ax-table--hover ula-table--wide"
            style={{ whiteSpace: 'nowrap', minWidth: 2800 }}
          >
            <caption className="ax-visually-hidden">Completed UP Kusum-C Installation Data</caption>
            <thead className="ax-table__head">
              <tr>
                {headers.map((h) => (
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
                  <td className="ax-table__td" colSpan={TOTAL_COLUMNS} style={centerCell}>
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading UP Kusum-C installation records from server…
                  </td>
                </tr>
              )}
              {!loading && filteredSites.length === 0 && (
                <tr>
                  <td className="ax-table__td" colSpan={TOTAL_COLUMNS} style={{ padding: 0 }}>
                    <TableEmptyState
                      title="No completed installation records found"
                      message={
                        hasFilters
                          ? 'No records match your filters or search. Try clearing your query.'
                          : `There are currently no records in status "${currentStatusMeta.label}".`
                      }
                      onClear={hasFilters ? resetFilters : undefined}
                      clearLabel="Clear filters"
                    />
                  </td>
                </tr>
              )}
              {!loading &&
                paginatedData.map((row, index) => {
                  const lat = txt(row, 'latitude') || txt(row, 'inst_latitude');
                  const lng = txt(row, 'longitude') || txt(row, 'inst_longitude');
                  const hasGeo = lat !== '' && lng !== '' && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng));
                  const farmerName = getFarmerName(row);
                  const farmerLabel = farmerName || `Site ${row.id}`;
                  const vStatus = getVerifyVal(row);
                  const rawVerifyStr = String(row.inst_verify_status ?? (row as any).verify_status ?? '').toLowerCase().trim();
                  const isVerifyApproved = vStatus === 1 || rawVerifyStr === '1' || rawVerifyStr === 'approved';
                  const isVerifyRejected = vStatus === 2 || rawVerifyStr === '2' || rawVerifyStr === 'rejected' || rawVerifyStr === 'reject';
                  const isActionLocked = isVerifyApproved || isVerifyRejected;
                  const cStatus = Number(row.inst_claim_status ?? (row as any).claim_status ?? 0);
                  const dStatus = Number(row.inst_doc_status ?? (row as any).document_status ?? 0);

                  const modulePhoto = row.module_image || row.farmer_module_image || row.f_module_image;
                  const inverterPhoto = row.inverter_vfd_image || row.inverter_image || row.vfd_image;
                  const waterPhoto = row.running_water_image || row.water_image;

                  const rawDoc = getRawDoc(row);
                  const docUrl = rawDoc ? resolveUpMediaUrl(rawDoc) : null;
                  const moduleSerialsList = getRowModuleSerials(row);
                  const blockVillage = getBlockVillage(row);

                  return (
                    <tr key={row.id || index} className="ax-table__row">
                      <td className="ax-table__td ax-num">{(currentPage - 1) * pageSize + index + 1}</td>
                      <td className="ax-table__td" style={{ textTransform: 'uppercase' }}>
                        {getStateName(row).toUpperCase() || 'UP'}
                      </td>
                      <td className="ax-table__td">
                        <b>{getDistrict(row) || DASH}</b>
                      </td>
                      <td className="ax-table__td">{blockVillage || DASH}</td>
                      <td className="ax-table__td">
                        <span style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                          {farmerName || DASH}
                        </span>
                      </td>
                      <td className="ax-table__td">{getFatherName(row) || DASH}</td>
                      <td className="ax-table__td" style={monoCell}>
                        {getContact(row) || DASH}
                      </td>
                      <td className="ax-table__td" style={monoCell}>
                        {row.f_customer_no || row.excel_id || row.uid || DASH}
                      </td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--asw-primary)' }}>
                        {row.pump_capacity ? (String(row.pump_capacity).toUpperCase().includes('HP') ? row.pump_capacity : `${row.pump_capacity} HP`) : DASH}
                      </td>
                      <td className="ax-table__td" style={monoCell}>
                        {row.Inverter_no || (row as any).inverter_no || (row as any).inverter_serial_no || DASH}
                      </td>
                      <td className="ax-table__td" style={monoCell}>
                        {row.vfd_no || (row as any).vfd_serial_no || DASH}
                      </td>
                      <td className="ax-table__td" style={{ verticalAlign: 'middle' }}>
                        <ModuleSerialsCell
                          serials={moduleSerialsList}
                          siteTitle={`${farmerLabel}${row.id ? ` · Site #${row.id}` : ''}`}
                          farmerName={farmerLabel}
                          siteId={row.id}
                          pumpCapacity={row.pump_capacity}
                          district={getDistrict(row)}
                        />
                      </td>

                      {/* Photo Thumbnails: NO BORDER RADIUS, Real Candidates, Click-to-Zoom */}
                      <td className="ax-table__td">
                        <InstallationThumbnail
                          src={modulePhoto}
                          alt={`${farmerLabel} - Module Photo`}
                          onPreview={openPreview}
                        />
                      </td>
                      <td className="ax-table__td">
                        <InstallationThumbnail
                          src={inverterPhoto}
                          alt={`${farmerLabel} - Inverter & VFD Photo`}
                          onPreview={openPreview}
                        />
                      </td>
                      <td className="ax-table__td">
                        <InstallationThumbnail
                          src={waterPhoto}
                          alt={`${farmerLabel} - Running Water Photo`}
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
                            style={{ color: 'var(--ax-primary-default, #2563eb)', textDecoration: 'none', fontWeight: 600 }}
                            title="Open location in Google Maps"
                          >
                            {lat}
                          </a>
                        ) : (
                          lat || DASH
                        )}
                      </td>
                      <td className="ax-table__td">{lng || DASH}</td>

                      {/* Remarks */}
                      <td className="ax-table__td" style={{ maxWidth: 200, whiteSpace: 'normal', fontSize: '12px' }}>
                        {row.inst_remarks || row.remarks || DASH}
                      </td>

                      {/* Status Badges */}
                      <td className="ax-table__td">
                        <VerifyBadge value={vStatus} raw={row.inst_verify_status ?? (row as any).verify_status} />
                      </td>
                      <td className="ax-table__td">
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <DocBadge status={dStatus} docUrl={docUrl} />
                          {docUrl && (
                            <a
                              href={docUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: 'var(--asw-primary, #2563eb)',
                                textDecoration: 'none',
                              }}
                              title="View uploaded HOC document"
                            >
                              View ↗
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="ax-table__td">
                        <ClaimBadge status={cStatus} />
                      </td>

                      {/* Action: Locked if Verify Status is Approved or Rejected, otherwise RowActionDropdown */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {isActionLocked ? (
                          <span
                            className="ax-badge ax-badge--soft"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              padding: '5px 11px',
                              fontSize: '11.5px',
                              fontWeight: 600,
                              color: 'var(--ax-text-muted, #64748b)',
                              background: 'var(--ax-surface-subtle, #f1f5f9)',
                              border: '1px solid var(--ax-border, #cbd5e1)',
                              borderRadius: 6,
                              cursor: 'not-allowed',
                              userSelect: 'none',
                            }}
                            title={`Installation has been ${isVerifyApproved ? 'Approved' : 'Rejected'}. Actions are locked.`}
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              style={{ width: 13, height: 13, color: '#64748b' }}
                              aria-hidden="true"
                            >
                              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                            <span>Locked</span>
                          </span>
                        ) : (
                          <RowActionDropdown
                            onEdit={() => navigate(`/v/up/install-kusum-c-site?edit_id=${row.id}`)}
                            onView={() => setDetailModalItem(row)}
                          />
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* ── Table Footer (exact reference pagination structure) ── */}
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

      {/* ── Photo Preview Modal (Zoom, Fullscreen, Open in Tab) ── */}
      {preview && <ImagePreviewModal url={preview.url} title={preview.title} onClose={closePreview} />}

      {/* ── Detail View Modal ── */}
      <Modal open={!!detailModalItem} onClose={() => setDetailModalItem(null)} labelledBy="kusumc-detail-title" dialogClass="ax-modal__dialog--md">
        {detailModalItem && (
          <div>
            <div className="ax-modal__header">
              <div>
                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700 }} id="kusumc-detail-title">
                  Kusum-C Installation Record #{detailModalItem.id || detailModalItem.excel_id}
                </h4>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--ax-text-muted)' }}>
                  {getDistrict(detailModalItem) ? `District: ${getDistrict(detailModalItem)} · ` : ''}State: {getStateName(detailModalItem).toUpperCase() || 'UP'}
                </p>
              </div>
              <button type="button" className="ax-modal__close" onClick={() => setDetailModalItem(null)} aria-label="Close dialog">
                {X_ICON}
              </button>
            </div>
            <div className="ax-modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="ula-m-grid">
                <div className="ula-m-info"><span>Farmer Name:</span> <b>{getFarmerName(detailModalItem) || DASH}</b></div>
                <div className="ula-m-info"><span>Father Name:</span> <b>{getFatherName(detailModalItem) || DASH}</b></div>
                <div className="ula-m-info"><span>Contact No:</span> <b>{getContact(detailModalItem) || DASH}</b></div>
                <div className="ula-m-info"><span>Customer No:</span> <b>{detailModalItem.f_customer_no || detailModalItem.excel_id || detailModalItem.uid || DASH}</b></div>
                <div className="ula-m-info"><span>District:</span> <b>{getDistrict(detailModalItem) || DASH}</b></div>
                <div className="ula-m-info"><span>Block / Village:</span> <b>{getBlockVillage(detailModalItem) || DASH}</b></div>
                <div className="ula-m-info"><span>Pump Spec:</span> <b>{detailModalItem.pump_capacity ? (String(detailModalItem.pump_capacity).toUpperCase().includes('HP') ? detailModalItem.pump_capacity : `${detailModalItem.pump_capacity} HP`) : DASH} Solar Pump</b></div>
                <div className="ula-m-info"><span>Inverter No:</span> <b>{detailModalItem.Inverter_no || (detailModalItem as any).inverter_no || (detailModalItem as any).inverter_serial_no || DASH}</b></div>
                <div className="ula-m-info"><span>VFD No:</span> <b>{detailModalItem.vfd_no || (detailModalItem as any).vfd_serial_no || DASH}</b></div>
                <div className="ula-m-info"><span>Latitude:</span> <b>{detailModalItem.latitude || (detailModalItem as any).inst_latitude || DASH}</b></div>
                <div className="ula-m-info"><span>Longitude:</span> <b>{detailModalItem.longitude || (detailModalItem as any).inst_longitude || DASH}</b></div>
                <div className="ula-m-info"><span>Verify Status:</span> <b>{getVerifyVal(detailModalItem) === 1 ? 'Approved' : getVerifyVal(detailModalItem) === 2 ? 'Rejected' : 'Pending'}</b></div>
                <div className="ula-m-info"><span>Document Status:</span> <b>{Number(detailModalItem.inst_doc_status) === 2 ? 'Approved' : Number(detailModalItem.inst_doc_status) === 3 ? 'Reject' : Number(detailModalItem.inst_doc_status) === 1 ? 'Submitted' : 'Pending'}</b></div>
                <div className="ula-m-info"><span>Claim Status:</span> <b>{Number(detailModalItem.inst_claim_status) === 1 ? 'Claim Applicable' : Number(detailModalItem.inst_claim_status) === 2 ? 'Approved' : Number(detailModalItem.inst_claim_status) === 3 ? 'Reject' : 'Not Applicable'}</b></div>
              </div>

              {/* Module Serials */}
              <div style={{ padding: '8px 12px', background: 'var(--ax-surface-subtle)', borderRadius: 6, fontSize: 12 }}>
                <span style={{ color: 'var(--ax-text-muted)', fontWeight: 600 }}>PV Module Serials: </span>
                <b>{fmtSerials(detailModalItem.module_serial_no)}</b>
              </div>

              {(detailModalItem.inst_remarks || detailModalItem.remarks) && (
                <div style={{ padding: '8px 12px', background: 'var(--ax-surface-subtle)', borderRadius: 6, fontSize: 12 }}>
                  <span style={{ color: 'var(--ax-text-muted)', fontWeight: 600 }}>Remarks: </span>
                  {detailModalItem.inst_remarks || detailModalItem.remarks}
                </div>
              )}

              {/* Photos in modal */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginTop: 4 }}>
                {[
                  { label: 'PV Modules', src: detailModalItem.module_image || detailModalItem.farmer_module_image || detailModalItem.f_module_image },
                  { label: 'Inverter & VFD', src: detailModalItem.inverter_vfd_image || detailModalItem.inverter_image || detailModalItem.vfd_image },
                  { label: 'Running Water', src: detailModalItem.running_water_image || detailModalItem.water_image },
                  { label: 'HOC / Document', src: detailModalItem.inst_doc || (detailModalItem as any).doc_file || (detailModalItem as any).doc_hoc_photo },
                ].map((p, idx) => {
                  const resolved = p.src ? resolveUpMediaUrl(p.src) : '';
                  return (
                    <div key={idx} style={{ border: '1px solid var(--ax-border)', borderRadius: 6, padding: 6, textAlign: 'center' }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ax-text-muted)', marginBottom: 4 }}>{p.label}</div>
                      {resolved ? (
                        <img
                          src={resolved}
                          alt={p.label}
                          style={{ width: '100%', height: 110, objectFit: 'cover', borderRadius: 0, border: '1px solid var(--ax-border)', cursor: 'zoom-in' }}
                          onClick={() => openPreview(resolved, p.label)}
                        />
                      ) : (
                        <div style={{ height: 110, background: 'var(--ax-surface-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ax-text-muted)', fontSize: 11 }}>
                          N/A
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="ax-modal__footer">
              <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setDetailModalItem(null)}>
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default UP_Installation_KusumC_StatusView;
