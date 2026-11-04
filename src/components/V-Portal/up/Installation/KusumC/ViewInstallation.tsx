import { useState, useMemo, useEffect, useCallback, useRef, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import { PageHead } from '../../../../shell/PageHead';
import {
  upInstallationService,
  resolveUpMediaUrl,
  type UpKusumCInstalledSiteItem,
  type UpKusumCInstalledCounts,
} from '../../up-services';
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

/* ───────── Constants ───────── */
const DASH = '—';

const X_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

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
const monoCell = { fontFamily: 'var(--ax-font-mono)', fontSize: '12px' } as const;

/* ───────── Badges ───────── */
type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

const Badge = ({ tone, children }: { tone: Tone; children: ReactNode }) => (
  <span className={`ax-badge ax-badge--soft ax-badge--${tone}`}>{children}</span>
);

const VerifyBadge = ({ value }: { value?: number | string }) => {
  const v = Number(value ?? 0);
  if (v === 1) return <Badge tone="success">Approved</Badge>;
  if (v === 2) return <Badge tone="danger">Reject</Badge>;
  return <Badge tone="warning">Pending</Badge>;
};

const DocBadge = ({ value }: { value?: number | string }) => {
  const v = Number(value ?? 0);
  if (v === 2) return <Badge tone="success">Approved</Badge>;
  if (v === 3) return <Badge tone="danger">Reject</Badge>;
  if (v === 1) return <Badge tone="info">Submitted</Badge>;
  return <Badge tone="neutral">Pending</Badge>;
};

const ClaimBadge = ({ value }: { value?: number | string }) => {
  const v = Number(value ?? 0);
  if (v === 1) return <Badge tone="success">Approved</Badge>;
  if (v === 2) return <Badge tone="danger">Reject</Badge>;
  if (v === 3) return <Badge tone="info">Claimed</Badge>;
  return <Badge tone="neutral">Pending</Badge>;
};

const PaymentBadge = ({ value }: { value?: number | string }) => {
  const v = Number(value ?? 0);
  if (v === 1) return <Badge tone="success">Paid</Badge>;
  if (v === 2) return <Badge tone="warning">Partially</Badge>;
  return <Badge tone="neutral">Pending</Badge>;
};

/* ───────── Helpers for Labels & Serialization ───────── */
const formatModuleSerials = (val: any): string => {
  if (!val) return DASH;
  if (Array.isArray(val)) {
    const joined = val.filter(Boolean).join(', ');
    return joined || DASH;
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          const joined = parsed.filter(Boolean).join(', ');
          return joined || DASH;
        }
      } catch {}
    }
    return trimmed || DASH;
  }
  return String(val);
};

const getVerifyLabel = (v?: number | string): string => {
  const n = Number(v ?? 0);
  if (n === 1) return 'Approved';
  if (n === 2) return 'Reject';
  return 'Pending';
};

const getDocLabel = (v?: number | string): string => {
  const n = Number(v ?? 0);
  if (n === 2) return 'Approved';
  if (n === 3) return 'Reject';
  if (n === 1) return 'Submitted';
  return 'Pending';
};

const getClaimLabel = (v?: number | string): string => {
  const n = Number(v ?? 0);
  if (n === 1) return 'Approved';
  if (n === 2) return 'Reject';
  if (n === 3) return 'Claimed';
  return 'Pending';
};

const getPaymentLabel = (v?: number | string): string => {
  const n = Number(v ?? 0);
  if (n === 1) return 'Paid';
  if (n === 2) return 'Partially';
  return 'Pending';
};

/* ───────── KPI Card ───────── */
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
}: {
  icon: ReactNode;
  tone: KpiTone;
  label: string;
  value: ReactNode;
  sub?: string;
}) {
  const t = TONE[tone];
  return (
    <div className="ax-card" style={{ padding: '14px 18px', borderRadius: 12, minWidth: 0 }}>
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
      <div style={{ fontSize: 20, fontWeight: 800, color: t.fg, marginTop: 4, fontFamily: 'var(--ax-font-display)', whiteSpace: 'nowrap' }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11.5, color: 'var(--ax-text-muted)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div>}
    </div>
  );
}

/* ───────── Reusable Modal ───────── */
function Modal({
  open,
  onClose,
  labelledBy,
  describedBy,
  role = 'dialog',
  centered = true,
  dialogClass = '',
  dialogStyle,
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
    >
      <div className="ax-modal__backdrop" onClick={() => closeOnBackdrop && onClose()} />
      <div ref={dialogRef} className={`ax-modal__dialog${dialogClass ? ' ' + dialogClass : ''}`} style={dialogStyle}>
        {children}
      </div>
    </div>,
    document.body
  );
}

/* ───────── Image Preview Modal (Lightbox Zoom — Square corners) ───────── */
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
                ? { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' as const }
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

/* ───────── Interactive Image Thumbnail (Strict Square Corners) ───────── */
function InstallationThumbnail({
  src,
  alt,
  onPreview,
  size = 38,
}: {
  src?: string | null;
  alt: string;
  onPreview: (url: string, title: string) => void;
  size?: number;
}) {
  const resolvedUrl = useMemo(() => (src ? resolveUpMediaUrl(src) : null), [src]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed || !resolvedUrl) {
    return <span style={{ color: 'var(--ax-text-subtle)' }}>{DASH}</span>;
  }

  return (
    <img
      src={resolvedUrl}
      alt={alt}
      style={{
        width: size,
        height: size,
        borderRadius: 0,
        objectFit: 'cover',
        cursor: 'zoom-in',
        border: '1px solid var(--ax-border, #e2e8f0)',
        background: 'var(--ax-surface-subtle, #f8fafc)',
        display: 'inline-block',
        flexShrink: 0,
      }}
      onError={() => setFailed(true)}
      onClick={() => onPreview(resolvedUrl, alt)}
      title="Click to preview"
    />
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
  .ax-modal__backdrop {
    position: fixed; inset: 0; background: transparent;
  }
  .ax-modal__dialog {
    position: relative; z-index: 1; background: #ffffff;
    border-radius: 16px; border: 1px solid var(--ax-border, #e2e8f0);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    overflow: hidden; width: 100%;
  }
  .ax-modal__dialog--md { max-width: 580px; }
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
  .ax-modal__close svg { width: 16px; height: 16px; }
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

  /* Modern form fields inside modals */
  .ax-modern-field {
    display: flex; flex-direction: column; gap: 6px;
  }
  .ax-modern-label {
    display: flex; align-items: center; justify-content: space-between;
    font-size: 12px; font-weight: 600; color: var(--ax-text-strong, #1e293b);
    letter-spacing: 0.02em; margin: 0;
  }
  .ax-modern-req {
    color: #ef4444; font-weight: 700; margin-left: 3px;
  }
  .ax-modern-dropzone {
    border: 1.5px dashed var(--ax-border, #cbd5e1);
    border-radius: 10px; padding: 18px 16px;
    background: var(--ax-surface-subtle, #f8fafc);
    text-align: center; cursor: pointer; transition: all 0.2s ease;
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
  }
  .ax-modern-dropzone:hover {
    border-color: var(--ax-accent, #2563eb);
    background: color-mix(in srgb, var(--ax-accent, #2563eb) 5%, var(--ax-surface-subtle, #f8fafc));
  }
  .ax-modern-dropzone__icon {
    width: 42px; height: 42px; border-radius: 50%;
    background: color-mix(in srgb, var(--ax-accent, #2563eb) 10%, #ffffff);
    display: flex; align-items: center; justify-content: center;
  }
  .ax-modern-file-chip {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 14px; background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 9px;
  }
  .ax-modern-file-chip__icon {
    width: 32px; height: 32px; border-radius: 8px;
    background: #dcfce7; display: flex; align-items: center; justify-content: center;
  }
`;

/* ───────── Responsive Page CSS ───────── */
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
  .solar-erp-page .ax-card img {
    border-radius: 0 !important;
  }

  .solar-erp-page .asw-cards-row {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: var(--ax-space-3, 12px);
    margin-bottom: var(--ax-space-5, 20px);
  }
  @media (max-width: 1400px) {
    .solar-erp-page .asw-cards-row {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
  @media (max-width: 820px) {
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
    width: 100%;
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
    .solar-erp-page .ax-card__actions {
      width: 100%;
      justify-content: stretch;
      margin-left: 0;
    }
    .solar-erp-page .ax-card__actions .ax-cluster {
      width: 100%;
      flex-wrap: wrap !important;
    }
    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] {
      flex: 1 1 100%;
      max-width: 100%;
    }
  }
`;

/* ───────── Detail View Modal ───────── */
function DetailViewModal({
  open,
  item,
  onClose,
  onPreview,
}: {
  open: boolean;
  item: UpKusumCInstalledSiteItem | null;
  onClose: () => void;
  onPreview: (url: string, title: string) => void;
}) {
  if (!open || !item) return null;

  const applicantName = item.applicant_name || item.f_farmer_name || item.farmer_name || item.beneficiary_name || DASH;
  const modImg = item.module_image || item.farmer_module_image || item.f_module_image ? resolveUpMediaUrl(item.module_image || item.farmer_module_image || item.f_module_image || '') : null;
  const invImg = item.inverter_vfd_image || item.inverter_image || item.vfd_image ? resolveUpMediaUrl(item.inverter_vfd_image || item.inverter_image || item.vfd_image || '') : null;
  const waterImg = item.running_water_image || item.water_image ? resolveUpMediaUrl(item.running_water_image || item.water_image || '') : null;
  const hocImg = item.hoc_photo ? resolveUpMediaUrl(item.hoc_photo) : null;
  const hasGeo = item.latitude && item.longitude;

  return (
    <Modal open={open} onClose={onClose} labelledBy="kusumc-detail-title" dialogClass="ax-modal__dialog--lg" dialogStyle={{ maxWidth: 720 }}>
      <div className="ax-modal__header">
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ax-accent, #2563eb)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            UP Kusum-C Installation Detail
          </span>
          <h3 id="kusumc-detail-title" style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ax-text, #0f172a)' }}>
            {applicantName} <span style={{ fontWeight: 400, color: 'var(--ax-text-muted)' }}>(#{item.id})</span>
          </h3>
        </div>
        <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">{X_ICON}</button>
      </div>

      <div className="ax-modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Applicant & Location Information */}
        <div style={{ padding: 14, borderRadius: 10, background: 'var(--ax-surface-subtle, #f8fafc)', border: '1px solid var(--ax-border, #e2e8f0)' }}>
          <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700 }}>Applicant &amp; Location Information</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, fontSize: 12.5 }}>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>State: </span><strong>{item.state || item.f_state || 'UP'}</strong></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>District: </span><strong>{item.district || item.f_district || DASH}</strong></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Block: </span><strong>{item.block || item.f_block || DASH}</strong></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Village: </span><strong>{item.village || item.f_village || DASH}</strong></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Applicant Name: </span><strong>{applicantName}</strong></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Father Name: </span><strong>{item.father_name || item.f_father_name || DASH}</strong></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Contact No: </span><strong>{item.contact_no || item.f_contact || DASH}</strong></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Pump Capacity: </span><strong>{item.pump_capacity || DASH}</strong></div>
          </div>
        </div>

        {/* Equipment & Verification Details */}
        <div style={{ padding: 14, borderRadius: 10, background: 'var(--ax-surface-subtle, #f8fafc)', border: '1px solid var(--ax-border, #e2e8f0)' }}>
          <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700 }}>Equipment &amp; Audit Details</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, fontSize: 12.5 }}>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>VFD No.: </span><strong>{item.vfd_no || item.vfd_serial_no || DASH}</strong></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Inverter No.: </span><strong>{item.inverter_no || item.inverter_serial_no || DASH}</strong></div>
            <div style={{ gridColumn: '1 / -1' }}>
              <span style={{ color: 'var(--ax-text-muted)' }}>Module Serial No.: </span>
              <strong>{formatModuleSerials(item.module_serial_no || item.module_no)}</strong>
            </div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Remarks: </span><strong>{item.remarks || item.inst_remarks || DASH}</strong></div>
            <div>
              <span style={{ color: 'var(--ax-text-muted)' }}>GPS Geotag: </span>
              <strong>
                {hasGeo ? (
                  <a
                    href={`https://www.google.com/maps?q=${item.latitude},${item.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: 'var(--ax-accent, #2563eb)', textDecoration: 'none', fontWeight: 600 }}
                  >
                    {item.latitude}, {item.longitude}
                  </a>
                ) : DASH}
              </strong>
            </div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Verify Status: </span><VerifyBadge value={item.inst_verify_status ?? item.verify_status} /></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Verify Remarks: </span><strong>{item.verify_remarks || item.inst_verify_remarks || item.verification_remarks || DASH}</strong></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Document Status: </span><DocBadge value={item.inst_doc_status ?? item.document_status} /></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Doc Verify Remarks: </span><strong>{item.doc_verify_remarks || item.inst_doc_remarks || item.hoc_remarks || DASH}</strong></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Claim Status: </span><ClaimBadge value={item.inst_claim_status ?? item.claim_status} /></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Payment Status: </span><PaymentBadge value={item.inst_pay_status ?? item.payment_status ?? item.pay_status} /></div>
          </div>
        </div>

        {/* Photo Gallery */}
        <div style={{ padding: 14, borderRadius: 10, background: 'var(--ax-surface-subtle, #f8fafc)', border: '1px solid var(--ax-border, #e2e8f0)' }}>
          <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700 }}>Installation Photo Evidence</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
            <div style={{ textAlign: 'center' }}>
              {modImg ? (
                <img
                  src={modImg}
                  alt="Farmer With Module Image"
                  style={{ width: '100%', height: 110, objectFit: 'cover', border: '1px solid var(--ax-border)', borderRadius: 0, cursor: 'zoom-in' }}
                  onClick={() => onPreview(modImg, 'Farmer With Module Image')}
                />
              ) : (
                <div style={{ height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', border: '1px dashed #cbd5e1', color: '#94a3b8', fontSize: 12 }}>No image</div>
              )}
              <span style={{ fontSize: 11, color: 'var(--ax-text-muted)', display: 'block', marginTop: 4 }}>Farmer With Module</span>
            </div>
            <div style={{ textAlign: 'center' }}>
              {invImg ? (
                <img
                  src={invImg}
                  alt="Inverter and VFD with Farmer"
                  style={{ width: '100%', height: 110, objectFit: 'cover', border: '1px solid var(--ax-border)', borderRadius: 0, cursor: 'zoom-in' }}
                  onClick={() => onPreview(invImg, 'Inverter and VFD with Farmer Image')}
                />
              ) : (
                <div style={{ height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', border: '1px dashed #cbd5e1', color: '#94a3b8', fontSize: 12 }}>No image</div>
              )}
              <span style={{ fontSize: 11, color: 'var(--ax-text-muted)', display: 'block', marginTop: 4 }}>Inverter &amp; VFD with Farmer</span>
            </div>
            <div style={{ textAlign: 'center' }}>
              {waterImg ? (
                <img
                  src={waterImg}
                  alt="Running Water With Farmer"
                  style={{ width: '100%', height: 110, objectFit: 'cover', border: '1px solid var(--ax-border)', borderRadius: 0, cursor: 'zoom-in' }}
                  onClick={() => onPreview(waterImg, 'Running Water With Farmer Image')}
                />
              ) : (
                <div style={{ height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', border: '1px dashed #cbd5e1', color: '#94a3b8', fontSize: 12 }}>No image</div>
              )}
              <span style={{ fontSize: 11, color: 'var(--ax-text-muted)', display: 'block', marginTop: 4 }}>Running Water With Farmer</span>
            </div>
            {hocImg && (
              <div style={{ textAlign: 'center' }}>
                <img
                  src={hocImg}
                  alt="HOC Document"
                  style={{ width: '100%', height: 110, objectFit: 'cover', border: '1px solid var(--ax-border)', borderRadius: 0, cursor: 'zoom-in' }}
                  onClick={() => onPreview(hocImg, 'HOC Document')}
                />
                <span style={{ fontSize: 11, color: 'var(--ax-text-muted)', display: 'block', marginTop: 4 }}>HOC Certificate</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="ax-modal__footer">
        <button type="button" className="ax-btn ax-btn--primary" onClick={onClose}>Close</button>
      </div>
    </Modal>
  );
}

/* ───────── Main Component ───────── */
export function UP_Installation_KusumC_ViewInstallation() {
  const [loading, setLoading] = useState(true);
  const [sites, setSites] = useState<UpKusumCInstalledSiteItem[]>([]);
  const [counts, setCounts] = useState<UpKusumCInstalledCounts>({
    total: 0,
    complete: 0,
    pending: 0,
    verify_approved: 0,
    verify_pending: 0,
    verify_reject: 0,
    doc_approved: 0,
    doc_pending: 0,
    doc_reject: 0,
    claim_approved: 0,
    claim_pending: 0,
    claim_reject: 0,
    paid: 0,
    partially: 0,
  });

  const [search, setSearch] = useState('');
  const [verifyFilter, setVerifyFilter] = useState<'all' | 'approved' | 'pending' | 'reject'>('all');
  const [docFilter, setDocFilter] = useState<'all' | 'approved' | 'pending' | 'none'>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Toast / feedback message
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  // Photo preview modal (lightbox zoom)
  const [preview, setPreview] = useState<{ url: string; title: string } | null>(null);
  const openPreview = useCallback((url: string, title: string) => setPreview({ url, title }), []);
  const closePreview = useCallback(() => setPreview(null), []);

  // Detail View Modal
  const [viewDetailModal, setViewDetailModal] = useState<UpKusumCInstalledSiteItem | null>(null);

  // Edit Modal State
  const [editItem, setEditItem] = useState<UpKusumCInstalledSiteItem | null>(null);
  const [editInverterNo, setEditInverterNo] = useState('');
  const [editVfdNo, setEditVfdNo] = useState('');
  const [editSerials, setEditSerials] = useState<string[]>(['']);
  const [editLat, setEditLat] = useState('');
  const [editLng, setEditLng] = useState('');
  const [editRemarks, setEditRemarks] = useState('');
  const [editModuleImg, setEditModuleImg] = useState<File | null>(null);
  const [editInverterImg, setEditInverterImg] = useState<File | null>(null);
  const [editWaterImg, setEditWaterImg] = useState<File | null>(null);
  const [updating, setUpdating] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // HOC Upload Modal State
  const [hocModalSite, setHocModalSite] = useState<UpKusumCInstalledSiteItem | null>(null);
  const [hocFile, setHocFile] = useState<File | null>(null);
  const [hocDate, setHocDate] = useState(new Date().toISOString().slice(0, 10));
  const [submittingHoc, setSubmittingHoc] = useState(false);

  useEffect(() => {
    if (!toastMsg) return;
    const t = window.setTimeout(() => setToastMsg(null), 4000);
    return () => window.clearTimeout(t);
  }, [toastMsg]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await upInstallationService.getKusumCInstalledSites();
      if (res.install_detail) {
        setCounts(res.install_detail);
      }
      setSites(res.sites || []);
    } catch (err: any) {
      setToastMsg({ type: 'danger', text: err?.message || 'Failed to load Kusum-C installed sites.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Open Edit Modal
  const handleOpenEdit = async (site: UpKusumCInstalledSiteItem) => {
    setEditError(null);
    setEditModuleImg(null);
    setEditInverterImg(null);
    setEditWaterImg(null);
    try {
      const fetched = await upInstallationService.getKusumCSiteForEdit(site.id);
      const target = fetched || site;
      setEditItem(target);
      setEditInverterNo(target.inverter_no || '');
      setEditVfdNo(target.vfd_no || '');
      setEditLat(target.latitude || '');
      setEditLng(target.longitude || '');
      setEditRemarks(target.remarks || target.inst_remarks || '');

      let parsedSerials: string[] = [];
      const rawSerials = target.module_serial_no || target.module_no;
      if (typeof rawSerials === 'string') {
        try {
          parsedSerials = JSON.parse(rawSerials);
        } catch {
          parsedSerials = rawSerials.split(',').map((s) => s.trim());
        }
      } else if (Array.isArray(rawSerials)) {
        parsedSerials = rawSerials;
      }
      setEditSerials(parsedSerials.length > 0 ? parsedSerials : ['']);
    } catch (e: any) {
      console.warn('Edit fetch error:', e);
      setEditItem(site);
      setEditInverterNo(site.inverter_no || '');
      setEditVfdNo(site.vfd_no || '');
      setEditLat(site.latitude || '');
      setEditLng(site.longitude || '');
      setEditRemarks(site.remarks || site.inst_remarks || '');
      setEditSerials(['']);
      setEditError(e?.message || 'Failed to load site details for editing.');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    setUpdating(true);
    setEditError(null);

    const fd = new FormData();
    fd.append('id', String(editItem.id));
    fd.append('inverter_no', editInverterNo.trim());
    fd.append('vfd_no', editVfdNo.trim());
    const validSerials = editSerials.filter((s) => s.trim() !== '');
    validSerials.forEach((sn) => fd.append('module_serial_no[]', sn.trim()));
    fd.append('inst_latitude', editLat.trim());
    fd.append('latitude', editLat.trim());
    fd.append('inst_longitude', editLng.trim());
    fd.append('longitude', editLng.trim());
    if (editRemarks.trim()) {
      fd.append('inst_remarks', editRemarks.trim());
      fd.append('remarks', editRemarks.trim());
    }

    if (editModuleImg) fd.append('module_image', editModuleImg);
    if (editInverterImg) fd.append('inverter_vfd_image', editInverterImg);
    if (editWaterImg) fd.append('running_water_image', editWaterImg);

    try {
      const res = await upInstallationService.updateKusumCInstallation(fd);
      if (res.status) {
        setToastMsg({ type: 'success', text: res.message || 'Installation updated successfully!' });
        setEditItem(null);
        loadData();
      } else {
        setEditError(res.message || 'Failed to update installation.');
      }
    } catch (err: any) {
      setEditError(err?.message || 'Server error updating installation.');
    } finally {
      setUpdating(false);
    }
  };

  // HOC Document Submit
  const handleHocSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hocModalSite || !hocFile) return;
    setSubmittingHoc(true);

    const fd = new FormData();
    fd.append('site_id', String(hocModalSite.id));
    fd.append('hoc_photo', hocFile);
    fd.append('date', hocDate);

    try {
      const res = await upInstallationService.submitKusumCHoc(fd);
      if (res.status) {
        setToastMsg({ type: 'success', text: res.message || 'HOC submitted successfully!' });
        setHocModalSite(null);
        setHocFile(null);
        loadData();
      } else {
        setToastMsg({ type: 'danger', text: res.message || 'Failed to submit HOC.' });
      }
    } catch (err: any) {
      setToastMsg({ type: 'danger', text: err?.message || 'Server error uploading HOC.' });
    } finally {
      setSubmittingHoc(false);
    }
  };

  // Distinct Districts for dropdown filter
  const districtList = useMemo(() => {
    const set = new Set<string>();
    sites.forEach((s) => {
      const d = s.district || s.f_district;
      if (d) set.add(d.trim());
    });
    return Array.from(set).sort();
  }, [sites]);

  // Filtered sites
  const filtered = useMemo(() => {
    return sites.filter((s) => {
      const vStatus = Number(s.inst_verify_status ?? s.verify_status ?? 0);
      if (verifyFilter === 'approved' && vStatus !== 1) return false;
      if (verifyFilter === 'reject' && vStatus !== 2) return false;
      if (verifyFilter === 'pending' && (vStatus === 1 || vStatus === 2)) return false;

      const dStatus = Number(s.inst_doc_status ?? s.document_status ?? 0);
      if (docFilter === 'approved' && dStatus !== 2) return false;
      if (docFilter === 'pending' && dStatus !== 1) return false;
      if (docFilter === 'none' && (dStatus === 1 || dStatus === 2)) return false;

      if (selectedDistrict !== 'all') {
        const d = s.district || s.f_district;
        if (!d || d.trim().toLowerCase() !== selectedDistrict.toLowerCase()) return false;
      }

      if (search.trim()) {
        const q = search.toLowerCase();
        const idStr = String(s.id);
        const nameStr = String(s.applicant_name || s.farmer_name || s.f_farmer_name || s.beneficiary_name || '').toLowerCase();
        const vfdStr = String(s.vfd_no || s.vfd_serial_no || '').toLowerCase();
        const invStr = String(s.inverter_no || s.inverter_serial_no || '').toLowerCase();
        const distStr = String(s.district || s.f_district || '').toLowerCase();
        const blockStr = String(s.block || s.f_block || '').toLowerCase();
        const villStr = String(s.village || s.f_village || '').toLowerCase();
        const serialStr = String(s.module_serial_no || s.module_no || '').toLowerCase();

        if (
          !idStr.includes(q) &&
          !nameStr.includes(q) &&
          !vfdStr.includes(q) &&
          !invStr.includes(q) &&
          !distStr.includes(q) &&
          !blockStr.includes(q) &&
          !villStr.includes(q) &&
          !serialStr.includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [sites, verifyFilter, docFilter, selectedDistrict, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedData = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, verifyFilter, docFilter, selectedDistrict]);

  const hasFilters = search.trim() !== '' || verifyFilter !== 'all' || docFilter !== 'all' || selectedDistrict !== 'all';
  const resetFilters = () => {
    setSearch('');
    setVerifyFilter('all');
    setDocFilter('all');
    setSelectedDistrict('all');
    setCurrentPage(1);
  };

  /* ───────── 20 Export Columns matching Table ───────── */
  const exportCols: ExportColumn<UpKusumCInstalledSiteItem>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_: any, idx?: number) => (idx !== undefined ? idx + 1 : 1) },
      { header: 'State', accessor: (r: any) => r.state || r.f_state || 'UP' },
      { header: 'District', accessor: (r: any) => r.district || r.f_district || DASH },
      { header: 'Block', accessor: (r: any) => r.block || r.f_block || DASH },
      { header: 'Village', accessor: (r: any) => r.village || r.f_village || DASH },
      { header: 'Applicant Name', accessor: (r: any) => r.applicant_name || r.f_farmer_name || r.farmer_name || r.beneficiary_name || DASH },
      { header: 'VFD No.', accessor: (r: any) => r.vfd_no || r.vfd_serial_no || DASH },
      { header: 'Inverter No.', accessor: (r: any) => r.inverter_no || r.inverter_serial_no || DASH },
      { header: 'Module Serial No.', accessor: (r: any) => formatModuleSerials(r.module_serial_no || r.module_no) },
      { header: 'Farmer With Module Image', accessor: (r: any) => (r.module_image || r.farmer_module_image || r.f_module_image ? 'Uploaded' : DASH) },
      { header: 'Inverter and VFD with Farmer Image', accessor: (r: any) => (r.inverter_vfd_image || r.inverter_image || r.vfd_image ? 'Uploaded' : DASH) },
      { header: 'Running Water With Farmer Image', accessor: (r: any) => (r.running_water_image || r.water_image ? 'Uploaded' : DASH) },
      { header: 'Remarks', accessor: (r: any) => r.remarks || r.inst_remarks || DASH },
      { header: 'Verify Status', accessor: (r: any) => getVerifyLabel(r.inst_verify_status ?? r.verify_status) },
      { header: 'Verify Remarks', accessor: (r: any) => r.verify_remarks || r.inst_verify_remarks || r.verification_remarks || DASH },
      { header: 'Document Status', accessor: (r: any) => getDocLabel(r.inst_doc_status ?? r.document_status) },
      { header: 'Doc Verify Remarks', accessor: (r: any) => r.doc_verify_remarks || r.inst_doc_remarks || r.hoc_remarks || DASH },
      { header: 'Claim Status', accessor: (r: any) => getClaimLabel(r.inst_claim_status ?? r.claim_status) },
      { header: 'Payment Status', accessor: (r: any) => getPaymentLabel(r.inst_pay_status ?? r.payment_status ?? r.pay_status) },
    ],
    []
  );

  const handleCopy = () => {
    copyTableDataToClipboard(filtered, exportCols);
    setToastMsg({ type: 'success', text: 'Table data copied to clipboard!' });
  };
  const handleCsv = () => exportDataToCSV('UP_KusumC_Installations', filtered, exportCols);
  const handleExcel = () => exportDataToExcel('UP_KusumC_Installations', filtered, exportCols);
  const handlePdf = () => printTableData('UP Kusum-C Installations', filtered, exportCols);

  const totalColumns = 20;

  /* ───────── Calculated KPI Metrics (Pure Numbers, NO "Nos.") ───────── */
  const totalAssign = counts.total_assign ?? counts.total ?? sites.length ?? 0;

  const completeInst = counts.complete ?? sites.filter((s) => s.inst_status === 1).length ?? 0;
  const pendingInst = counts.pending ?? Math.max(0, (totalAssign || sites.length) - completeInst);

  const verifyApp = counts.verify_approved ?? sites.filter((s) => Number(s.inst_verify_status ?? s.verify_status) === 1).length ?? 0;
  const verifyPen = counts.verify_pending ?? sites.filter((s) => !s.inst_verify_status && !s.verify_status || Number(s.inst_verify_status ?? s.verify_status) === 0).length ?? 0;
  const verifyRej = counts.verify_reject ?? sites.filter((s) => Number(s.inst_verify_status ?? s.verify_status) === 2).length ?? 0;

  const docApp = counts.doc_approved ?? sites.filter((s) => Number(s.inst_doc_status ?? s.document_status) === 2).length ?? 0;
  const docPen = counts.doc_pending ?? sites.filter((s) => Number(s.inst_doc_status ?? s.document_status) === 1 || Number(s.inst_doc_status ?? s.document_status) === 0 || !s.inst_doc_status).length ?? 0;
  const docRej = counts.doc_reject ?? sites.filter((s) => Number(s.inst_doc_status ?? s.document_status) === 3).length ?? 0;

  const claimApp = counts.claim_approved ?? sites.filter((s) => Number(s.inst_claim_status ?? s.claim_status) === 1).length ?? 0;
  const claimPen = counts.claim_pending ?? sites.filter((s) => !s.inst_claim_status && !s.claim_status || Number(s.inst_claim_status ?? s.claim_status) === 0).length ?? 0;
  const claimRej = counts.claim_reject ?? sites.filter((s) => Number(s.inst_claim_status ?? s.claim_status) === 2).length ?? 0;

  const payPaid = counts.paid ?? sites.filter((s) => Number(s.inst_pay_status ?? s.payment_status ?? s.pay_status) === 1).length ?? 0;
  const payPartially = counts.partially ?? sites.filter((s) => Number(s.inst_pay_status ?? s.payment_status ?? s.pay_status) === 2).length ?? 0;
  const payPen = (counts.pending_pay ?? counts.payment_pending ?? counts.inst_pay_pending ?? Math.max(0, (totalAssign || sites.length) - payPaid - payPartially)) ?? 0;

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="View Kusum-C Installed Sites"
        subtitle="Master register of installed solar pumps, verification status, HOC documents, and photo evidence"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Uttar Pradesh' },
          { label: 'Installation' },
          { label: 'Kusum C' },
          { label: 'View Installation' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)', alignItems: 'center' }}>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={loadData} disabled={loading}>
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
                <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
              </svg>
              <span className="ax-btn__label">Refresh</span>
            </button>
            <Link to="/v/up/install-kusum-c-site" className="ax-btn ax-btn--primary ax-btn--sm">
              <span className="ax-btn__label">+ Install New Site</span>
            </Link>
          </div>
        }
      />

      {/* Toast notification */}
      {toastMsg && (
        <div className={`ax-alert ax-alert--${toastMsg.type}`} style={{ marginBottom: 'var(--ax-space-4)' }} role="status">
          <div className="ax-alert__title">{toastMsg.type === 'success' ? 'Success' : 'Error'}</div>
          <div className="ax-alert__text">{toastMsg.text}</div>
        </div>
      )}

      {/* ── Top Metric KPI Cards (6 cards in responsive grid) ── */}
      <div className="asw-cards-row">
        <KpiCard
          tone="accent"
          label="Total Assign"
          value={totalAssign.toLocaleString('en-IN')}
          sub="Total assigned sites"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          }
        />

        <KpiCard
          tone="cyan"
          label="Installation Status"
          value={`${completeInst.toLocaleString('en-IN')} / ${pendingInst.toLocaleString('en-IN')}`}
          sub="Complete / Pending"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          }
        />

        <KpiCard
          tone="emerald"
          label="Verification Status"
          value={`${verifyApp.toLocaleString('en-IN')} / ${verifyPen.toLocaleString('en-IN')} / ${verifyRej.toLocaleString('en-IN')}`}
          sub="Approved / Pending / Reject"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <polyline points="12 7 12 12 15 15" />
            </svg>
          }
        />

        <KpiCard
          tone="violet"
          label="Document Verify Status"
          value={`${docApp.toLocaleString('en-IN')} / ${docPen.toLocaleString('en-IN')} / ${docRej.toLocaleString('en-IN')}`}
          sub="Approved / Pending / Reject"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <path d="M8 9h8M8 13h8M8 17h5" />
            </svg>
          }
        />

        <KpiCard
          tone="amber"
          label="Claim Verify Status"
          value={`${claimApp.toLocaleString('en-IN')} / ${claimPen.toLocaleString('en-IN')} / ${claimRej.toLocaleString('en-IN')}`}
          sub="Approved / Pending / Reject"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <path d="M9 15l2 2 4-4" />
            </svg>
          }
        />

        <KpiCard
          tone="cyan"
          label="Payment Status"
          value={`${payPaid.toLocaleString('en-IN')} / ${payPartially.toLocaleString('en-IN')} / ${payPen.toLocaleString('en-IN')}`}
          sub="Paid / Partially / Pending"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
        />
      </div>

      <div className="ax-dash-grid">
        {/* ── Main Table Card ── */}
        <section className="ax-card ax-col--12" role="region" aria-labelledby="kusumc-table-title">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">UP KUSUM-C</span>
              <h2 id="kusumc-table-title" className="ax-card__title">Installation Register</h2>
              <p className="ax-card__subtitle">
                <span className="ax-num">{filtered.length}</span> of <span className="ax-num">{sites.length}</span> sites
              </p>
            </div>

            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                {/* District Filter */}
                {districtList.length > 0 && (
                  <select
                    className="ax-input ax-input--sm"
                    style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                    value={selectedDistrict}
                    onChange={(e) => { setSelectedDistrict(e.target.value); setCurrentPage(1); }}
                    aria-label="Filter by district"
                  >
                    <option value="all">All Districts</option>
                    {districtList.map((dist) => (
                      <option key={dist} value={dist}>{dist}</option>
                    ))}
                  </select>
                )}

                {/* Verification Status Filter */}
                <select
                  className="ax-input ax-input--sm"
                  style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                  value={verifyFilter}
                  onChange={(e) => { setVerifyFilter(e.target.value as any); setCurrentPage(1); }}
                  aria-label="Filter by verify status"
                >
                  <option value="all">All Verification</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="reject">Reject</option>
                </select>

                {/* Document Status Filter */}
                <select
                  className="ax-input ax-input--sm"
                  style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                  value={docFilter}
                  onChange={(e) => { setDocFilter(e.target.value as any); setCurrentPage(1); }}
                  aria-label="Filter by document status"
                >
                  <option value="all">All Doc Status</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Submitted</option>
                  <option value="none">Pending</option>
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
                  onChange={(val) => { setSearch(val); setCurrentPage(1); }}
                  placeholder="Search applicant, VFD, village…"
                  size="sm"
                  ariaLabel="Search installed sites"
                />

                <TableExportToolbar
                  onCopy={handleCopy}
                  onExportCSV={handleCsv}
                  onExportExcel={handleExcel}
                  onExportPDF={handlePdf}
                />
              </div>
            </div>
          </div>

          {/* ── Table (Exact 20 Columns Specified) ── */}
          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap', minWidth: 2000 }}>
              <caption className="ax-visually-hidden">UP Kusum-C Installation Data</caption>
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col" style={{ width: 60, textAlign: 'center' }}>Sr. No.</th>
                  <th className="ax-table__th" scope="col">State</th>
                  <th className="ax-table__th" scope="col">District</th>
                  <th className="ax-table__th" scope="col">Block</th>
                  <th className="ax-table__th" scope="col">Village</th>
                  <th className="ax-table__th" scope="col">Applicant Name</th>
                  <th className="ax-table__th" scope="col">VFD No.</th>
                  <th className="ax-table__th" scope="col">Inverter No.</th>
                  <th className="ax-table__th" scope="col">Module Serial No.</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Farmer With Module Image</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Inverter and VFD with Farmer Image</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Running Water With Farmer Image</th>
                  <th className="ax-table__th" scope="col">Remarks</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Verify Status</th>
                  <th className="ax-table__th" scope="col">Verify Remarks</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Document Status</th>
                  <th className="ax-table__th" scope="col">Doc Verify Remarks</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Claim Status</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Payment Status</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center', width: 180 }}>Action</th>
                </tr>
              </thead>
              <tbody aria-busy={loading}>
                {loading && (
                  <tr>
                    <td className="ax-table__td" colSpan={totalColumns} style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--ax-text-muted)' }}>
                      <span className="ax-spinner" style={{ width: 20, height: 20, marginRight: 8, verticalAlign: 'middle' }} />
                      Loading live installation records from server…
                    </td>
                  </tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td className="ax-table__td" colSpan={totalColumns} style={{ padding: 0 }}>
                      <TableEmptyState
                        title="No data available in table"
                        message={
                          hasFilters
                            ? 'No records match your filters or search. Try clearing your query.'
                            : undefined
                        }
                        onClear={hasFilters ? resetFilters : undefined}
                        clearLabel="Clear filters"
                      />
                    </td>
                  </tr>
                )}
                {!loading &&
                  paginatedData.map((row, idx) => {
                    const srNo = (safePage - 1) * pageSize + idx + 1;
                    const applicantName = row.applicant_name || row.f_farmer_name || row.farmer_name || row.beneficiary_name || DASH;
                    const isVerifyApproved = Number(row.inst_verify_status ?? row.verify_status) === 1;

                    return (
                      <tr key={row.id} className="ax-table__row">
                        <td className="ax-table__td ax-num" style={{ textAlign: 'center' }}>{srNo}</td>
                        <td className="ax-table__td">{row.state || row.f_state || 'UP'}</td>
                        <td className="ax-table__td">{row.district || row.f_district || DASH}</td>
                        <td className="ax-table__td">{row.block || row.f_block || DASH}</td>
                        <td className="ax-table__td">{row.village || row.f_village || DASH}</td>
                        <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                          {applicantName}
                        </td>
                        <td className="ax-table__td" style={monoCell}>{row.vfd_no || row.vfd_serial_no || DASH}</td>
                        <td className="ax-table__td" style={monoCell}>{row.inverter_no || row.inverter_serial_no || DASH}</td>
                        <td className="ax-table__td" style={monoCell}>
                          {formatModuleSerials(row.module_serial_no || row.module_no)}
                        </td>

                        {/* Farmer With Module Image */}
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <InstallationThumbnail
                            src={row.module_image || row.farmer_module_image || row.f_module_image}
                            alt={`${applicantName} - Farmer With Module Image`}
                            onPreview={openPreview}
                          />
                        </td>

                        {/* Inverter and VFD with Farmer Image */}
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <InstallationThumbnail
                            src={row.inverter_vfd_image || row.inverter_image || row.vfd_image}
                            alt={`${applicantName} - Inverter and VFD with Farmer Image`}
                            onPreview={openPreview}
                          />
                        </td>

                        {/* Running Water With Farmer Image */}
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <InstallationThumbnail
                            src={row.running_water_image || row.water_image}
                            alt={`${applicantName} - Running Water With Farmer Image`}
                            onPreview={openPreview}
                          />
                        </td>

                        {/* Remarks */}
                        <td className="ax-table__td" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {row.remarks || row.inst_remarks || DASH}
                        </td>

                        {/* Verify Status */}
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <VerifyBadge value={row.inst_verify_status ?? row.verify_status} />
                        </td>

                        {/* Verify Remarks */}
                        <td className="ax-table__td" style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {row.verify_remarks || row.inst_verify_remarks || row.verification_remarks || DASH}
                        </td>

                        {/* Document Status */}
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <DocBadge value={row.inst_doc_status ?? row.document_status} />
                        </td>

                        {/* Doc Verify Remarks */}
                        <td className="ax-table__td" style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {row.doc_verify_remarks || row.inst_doc_remarks || row.hoc_remarks || DASH}
                        </td>

                        {/* Claim Status */}
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <ClaimBadge value={row.inst_claim_status ?? row.claim_status} />
                        </td>

                        {/* Payment Status */}
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <PaymentBadge value={row.inst_pay_status ?? row.payment_status ?? row.pay_status} />
                        </td>

                        {/* Action */}
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          {isVerifyApproved ? (
                            <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                              <button
                                type="button"
                                className="ax-btn ax-btn--ghost ax-btn--xs"
                                style={{ padding: '3px 8px', fontSize: 11 }}
                                onClick={() => setViewDetailModal(row)}
                              >
                                Details
                              </button>
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
                                title="Installation Verified & Approved. Edit is locked."
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13, color: '#64748b' }} aria-hidden="true">
                                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                                <span>Locked</span>
                              </span>
                            </div>
                          ) : (
                            <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
                              <button
                                type="button"
                                className="ax-btn ax-btn--ghost ax-btn--xs"
                                style={{ padding: '3px 8px', fontSize: 11 }}
                                onClick={() => setViewDetailModal(row)}
                              >
                                Details
                              </button>
                              <button
                                type="button"
                                className="ax-btn ax-btn--secondary ax-btn--xs"
                                style={{ padding: '3px 8px', fontSize: 11 }}
                                onClick={() => handleOpenEdit(row)}
                                title="Edit installation details"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="ax-btn ax-btn--primary ax-btn--xs"
                                style={{ padding: '3px 8px', fontSize: 11 }}
                                onClick={() => { setHocModalSite(row); setHocFile(null); }}
                                title="Submit HOC document"
                              >
                                HOC
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* ── Footer & Pagination ── */}
          <div className="ax-card__footer" style={footerStyle}>
            <div className="ula-pagination-left">
              <Pagination
                currentPage={safePage}
                totalPages={totalPages}
                totalItems={filtered.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(sz) => { setPageSize(sz); setCurrentPage(1); }}
                pageSizeOptions={[25, 50, 100, 200]}
              />
            </div>
          </div>
        </section>
      </div>

      {/* ── Detail View Modal ── */}
      <DetailViewModal
        open={Boolean(viewDetailModal)}
        item={viewDetailModal}
        onClose={() => setViewDetailModal(null)}
        onPreview={openPreview}
      />

      {/* ── Photo Preview Modal (Zoom, Fullscreen) ── */}
      {preview && <ImagePreviewModal url={preview.url} title={preview.title} onClose={closePreview} />}

      {/* ── Edit Installation Modal ── */}
      <Modal open={!!editItem} onClose={() => setEditItem(null)} labelledBy="edit-kusumc-title" dialogClass="ax-modal__dialog--lg" dialogStyle={{ maxWidth: 680 }}>
        <form onSubmit={handleEditSubmit}>
          <div className="ax-modal__header">
            <div>
              <h4 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--ax-text-strong, #0f172a)' }} id="edit-kusumc-title">
                Edit Installation Details
              </h4>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--ax-text-muted, #64748b)' }}>
                Site: <b>{editItem?.applicant_name || editItem?.f_farmer_name || editItem?.farmer_name}</b> (#{editItem?.id})
              </p>
            </div>
            <button type="button" className="ax-modal__close" onClick={() => setEditItem(null)} disabled={updating} aria-label="Close dialog">{X_ICON}</button>
          </div>

          <div className="ax-modal__body" style={{ padding: 24 }}>
            {editError && (
              <div style={{ marginBottom: 16, padding: 12, borderRadius: 8, background: '#fef2f2', color: '#991b1b', fontSize: 13, fontWeight: 600, border: '1px solid #fecaca' }}>
                {editError}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Equipment Numbers */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                <div className="ax-modern-field">
                  <label className="ax-modern-label">
                    <span>Inverter Number</span>
                    <span className="ax-modern-req">*</span>
                  </label>
                  <input type="text" required className="ax-input" value={editInverterNo} onChange={(e) => setEditInverterNo(e.target.value)} />
                </div>
                <div className="ax-modern-field">
                  <label className="ax-modern-label">
                    <span>VFD Number</span>
                    <span className="ax-modern-req">*</span>
                  </label>
                  <input type="text" required className="ax-input" value={editVfdNo} onChange={(e) => setEditVfdNo(e.target.value)} />
                </div>
              </div>

              {/* Module Serial Numbers */}
              <div className="ax-modern-field">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label className="ax-modern-label">
                    <span>Module Serial Numbers ({editSerials.length})</span>
                    <span className="ax-modern-req">*</span>
                  </label>
                  <button type="button" className="ax-btn ax-btn--secondary ax-btn--xs" onClick={() => setEditSerials((p) => [...p, ''])}>
                    + Add Serial
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
                  {editSerials.map((sn, sIdx) => (
                    <div key={sIdx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input
                        type="text"
                        className="ax-input"
                        style={{ flex: 1 }}
                        value={sn}
                        placeholder={`Serial #${sIdx + 1}`}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditSerials((prev) => {
                            const next = [...prev];
                            next[sIdx] = val;
                            return next;
                          });
                        }}
                        required={sIdx === 0}
                      />
                      {editSerials.length > 1 && (
                        <button
                          type="button"
                          className="ax-btn ax-btn--ghost ax-btn--xs"
                          style={{ color: '#ef4444', padding: '0 6px' }}
                          onClick={() => setEditSerials((p) => p.filter((_, i) => i !== sIdx))}
                        >
                          {X_ICON}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Geolocation */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                <div className="ax-modern-field">
                  <label className="ax-modern-label">
                    <span>Latitude</span>
                    <span className="ax-modern-req">*</span>
                  </label>
                  <input type="text" required className="ax-input" value={editLat} onChange={(e) => setEditLat(e.target.value)} />
                </div>
                <div className="ax-modern-field">
                  <label className="ax-modern-label">
                    <span>Longitude</span>
                    <span className="ax-modern-req">*</span>
                  </label>
                  <input type="text" required className="ax-input" value={editLng} onChange={(e) => setEditLng(e.target.value)} />
                </div>
              </div>

              {/* Replace Photos */}
              <div className="ax-modern-field">
                <label className="ax-modern-label"><span>Replace Photos (optional)</span></label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                  <div className="ax-modern-field">
                    <span style={{ fontSize: 11, color: 'var(--ax-text-muted)' }}>Farmer With Module Image</span>
                    <input type="file" accept="image/*" onChange={(e) => setEditModuleImg(e.target.files?.[0] || null)} style={{ fontSize: 12 }} />
                  </div>
                  <div className="ax-modern-field">
                    <span style={{ fontSize: 11, color: 'var(--ax-text-muted)' }}>Inverter and VFD with Farmer</span>
                    <input type="file" accept="image/*" onChange={(e) => setEditInverterImg(e.target.files?.[0] || null)} style={{ fontSize: 12 }} />
                  </div>
                  <div className="ax-modern-field">
                    <span style={{ fontSize: 11, color: 'var(--ax-text-muted)' }}>Running Water With Farmer</span>
                    <input type="file" accept="image/*" onChange={(e) => setEditWaterImg(e.target.files?.[0] || null)} style={{ fontSize: 12 }} />
                  </div>
                </div>
              </div>

              {/* Remarks */}
              <div className="ax-modern-field" style={{ gridColumn: '1 / -1' }}>
                <label className="ax-modern-label"><span>Remarks</span></label>
                <input
                  type="text"
                  className="ax-input"
                  value={editRemarks}
                  onChange={(e) => setEditRemarks(e.target.value)}
                  placeholder="Enter update remarks..."
                />
              </div>
            </div>
          </div>

          <div className="ax-modal__footer">
            <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setEditItem(null)} disabled={updating}>Cancel</button>
            <button type="submit" className="ax-btn ax-btn--primary" disabled={updating}>
              {updating ? 'Updating Details…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── HOC Document Upload Modal ── */}
      <Modal open={!!hocModalSite} onClose={() => setHocModalSite(null)} labelledBy="hoc-modal-title" dialogClass="ax-modal__dialog--md" dialogStyle={{ maxWidth: 520 }}>
        <form onSubmit={handleHocSubmit}>
          <div className="ax-modal__header">
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ax-accent, #2563eb)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Submit HOC Document
              </span>
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ax-text, #0f172a)' }} id="hoc-modal-title">
                {hocModalSite?.applicant_name || hocModalSite?.f_farmer_name || hocModalSite?.farmer_name || 'Site'} <span style={{ fontWeight: 400, color: 'var(--ax-text-muted)' }}>(#{hocModalSite?.id})</span>
              </h4>
            </div>
            <button type="button" className="ax-modal__close" onClick={() => setHocModalSite(null)} disabled={submittingHoc} aria-label="Close dialog">{X_ICON}</button>
          </div>

          <div className="ax-modal__body" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--ax-text-muted)' }}>
              Upload the signed Handing Over Certificate (HOC) photo for applicant <strong>{hocModalSite?.applicant_name || hocModalSite?.f_farmer_name || hocModalSite?.farmer_name}</strong>.
            </p>

            <div className="ax-modern-field">
              <label className="ax-modern-label">
                <span>HOC Date</span>
                <span className="ax-modern-req">*</span>
              </label>
              <input type="date" className="ax-input" value={hocDate} onChange={(e) => setHocDate(e.target.value)} required />
            </div>

            <div className="ax-modern-field">
              <label className="ax-modern-label">
                <span>HOC Document / Photo</span>
                <span className="ax-modern-req">*</span>
              </label>
              {hocFile ? (
                <div className="ax-modern-file-chip">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="ax-modern-file-chip__icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#15803d' }}>{hocFile.name}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{(hocFile.size / 1024).toFixed(1)} KB</div>
                    </div>
                  </div>
                  <button type="button" className="ax-btn ax-btn--ghost ax-btn--xs" style={{ color: '#ef4444' }} onClick={() => setHocFile(null)}>{X_ICON}</button>
                </div>
              ) : (
                <label className="ax-modern-dropzone">
                  <div className="ax-modern-dropzone__icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong)' }}>Click to upload HOC document</div>
                  <div style={{ fontSize: 11, color: 'var(--ax-text-muted)' }}>Accepts images and PDF files</div>
                  <input type="file" required accept="image/*,application/pdf" onChange={(e) => setHocFile(e.target.files?.[0] || null)} style={{ display: 'none' }} />
                </label>
              )}
            </div>
          </div>

          <div className="ax-modal__footer">
            <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setHocModalSite(null)} disabled={submittingHoc}>Cancel</button>
            <button type="submit" className="ax-btn ax-btn--primary" disabled={submittingHoc || !hocFile}>
              {submittingHoc ? 'Uploading…' : 'Submit HOC'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default UP_Installation_KusumC_ViewInstallation;
