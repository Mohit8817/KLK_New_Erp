import { useState, useMemo, useEffect, useCallback, useRef, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  jammuSwpService,
  getJammuSwpMediaCandidates,
  resolveJammuSwpMediaUrl,
  type JammuSwpInstalledSiteItem,
  type JammuSwpInstallViewData,
} from '../../jammu-services';
import {
  Pagination,
  usePagination,
  SearchInput,
  TableExportToolbar,
  TableEmptyState,
  type ExportColumn,
} from '../../../../../common';

const DASH = '—';

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

const Badge = ({ tone, children }: { tone: Tone; children: ReactNode }) => (
  <span className={`ax-badge ax-badge--soft ax-badge--${tone}`}>{children}</span>
);

const VerifyBadge = ({ value, raw }: { value?: number; raw?: any }) => {
  const v = Number(value ?? 0);
  const r = String(raw ?? '').toLowerCase().trim();
  if (v === 1 || r === '1' || r === 'approved') return <Badge tone="success">Approved</Badge>;
  if (v === 2 || r === '2' || r === 'rejected' || r === 'reject') return <Badge tone="danger">Rejected</Badge>;
  return <Badge tone="warning">Pending</Badge>;
};

const DocStatusBadge = ({ status, docUrl }: { status?: number; docUrl?: string }) => {
  const s = Number(status ?? 0);
  if (s === 2) {
    return (
      <span className="ax-cluster" style={{ gap: 4, justifyContent: 'center' }}>
        <Badge tone="success">Approved</Badge>
        {docUrl && (
          <a
            href={docUrl}
            target="_blank"
            rel="noreferrer"
            className="ax-btn ax-btn--ghost ax-btn--xs"
            style={{ padding: '2px 4px', fontSize: 11, color: '#2563eb' }}
            title="View HOC document"
          >
            ↗
          </a>
        )}
      </span>
    );
  }
  if (s === 1 || docUrl) {
    return (
      <span className="ax-cluster" style={{ gap: 4, justifyContent: 'center' }}>
        <Badge tone="info">Submitted</Badge>
        {docUrl && (
          <a
            href={docUrl}
            target="_blank"
            rel="noreferrer"
            className="ax-btn ax-btn--ghost ax-btn--xs"
            style={{ padding: '2px 4px', fontSize: 11, color: '#2563eb' }}
            title="View HOC document"
          >
            ↗
          </a>
        )}
      </span>
    );
  }
  return <Badge tone="neutral">Not Submitted</Badge>;
};

const ClaimBadge = ({ status }: { status?: number }) => {
  const s = Number(status ?? 0);
  if (s === 2) return <Badge tone="success">Approved</Badge>;
  if (s === 3) return <Badge tone="danger">Rejected</Badge>;
  if (s === 1) return <Badge tone="info">Raised</Badge>;
  return <Badge tone="neutral">Not Raised</Badge>;
};

const PaymentStatusBadge = ({ status }: { status?: number }) => {
  const s = Number(status ?? 0);
  if (s === 1) return <Badge tone="success">Done</Badge>;
  if (s === 2) return <Badge tone="info">Partially</Badge>;
  return <Badge tone="warning">Pending</Badge>;
};

const txt = (row: any, key: string): string => {
  const v = row?.[key];
  if (v === null || v === undefined || v === '') return '';
  return String(v);
};

const fmtModules = (row: JammuSwpInstalledSiteItem): string => {
  const list = row.jammuModulee || row.jammu_modules;
  if (Array.isArray(list) && list.length > 0) {
    return list.map((m) => m.sr_no).filter(Boolean).join(', ');
  }
  return DASH;
};

/* ───────── Modal Component ───────── */
const X_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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

/* ───────── Image Preview Modal (Interactive Lightbox Zoom) ───────── */
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
    <Modal open onClose={onClose} labelledBy="jammu-swp-preview-title" dialogClass="ax-modal__dialog--lg">
      <div className="ax-modal__header">
        <h2 className="ax-modal__title" id="jammu-swp-preview-title">{title || 'Media Preview'}</h2>
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

/* ── Interactive Image Thumbnail ── */
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
  const candidates = useMemo(() => getJammuSwpMediaCandidates(src), [src]);
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

/* ───────── Top KPI Card ───────── */
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
  sub: string;
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
      <div style={{ fontSize: 24, fontWeight: 800, color: t.fg, marginTop: 4, fontFamily: 'var(--ax-font-display)' }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>
        {sub}
      </div>
    </div>
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

// Exactly 24 requested headers:
const HEADERS_24 = [
  'Sr. No.',
  'State',
  'District',
  'Tehsil',
  'Block',
  'Village',
  'Applicant Name',
  'VFD No.',
  'Motor No.',
  'Pump No.',
  'Module Serial No.',
  'Farmer With Module Image',
  'Inverter and VFD with Farmer Image',
  'Running Water With Farmer Image',
  'Pole With Farmer Image',
  'Remarks',
  'Verify Status',
  'Verify Remarks',
  'Document Status',
  'Document Remarks',
  'Doc Verify Remarks',
  'Claim Status',
  'Payment Status',
  'Action',
];

export function SWPViewInstallation() {
  const [dataPayload, setDataPayload] = useState<JammuSwpInstallViewData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [districtFilter, setDistrictFilter] = useState<string>('all');

  // Photo preview modal
  const [preview, setPreview] = useState<{ url: string; title: string } | null>(null);
  const openPreview = useCallback((url: string, title: string) => setPreview({ url, title }), []);
  const closePreview = useCallback(() => setPreview(null), []);

  // Toast / feedback message
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  useEffect(() => {
    if (!toastMsg) return;
    const t = window.setTimeout(() => setToastMsg(null), 4000);
    return () => window.clearTimeout(t);
  }, [toastMsg]);

  // Edit Modal State (API 7 & API 8)
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editLoading, setEditLoading] = useState<boolean>(false);
  const [editForm, setEditForm] = useState({
    farmer_name: '',
    motor_no: '',
    pump_no: '',
    vfd_no: '',
    module_serial_no: [] as string[],
    inst_latitude: '',
    inst_longitude: '',
    inst_remarks: '',
  });
  const [editFiles, setEditFiles] = useState<{
    module_image: File | null;
    vfd_image: File | null;
    running_water_image: File | null;
    pole_image: File | null;
  }>({
    module_image: null,
    vfd_image: null,
    running_water_image: null,
    pole_image: null,
  });
  const [submittingEdit, setSubmittingEdit] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Submit HOC Document Modal State (API 9: POST jammu/swp/installation-doc-store)
  const [docModalSite, setDocModalSite] = useState<JammuSwpInstalledSiteItem | null>(null);
  const [hocPhoto, setHocPhoto] = useState<File | null>(null);
  const [hocDate, setHocDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [hocRemarks, setHocRemarks] = useState<string>('');
  const [docSubmitting, setDocSubmitting] = useState<boolean>(false);
  const [docError, setDocError] = useState<string | null>(null);
  const hocPhotoRef = useRef<HTMLInputElement>(null);

  // Load live data from API 6: GET jammu/swp/installation-view-site
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await jammuSwpService.getInstalledSites();
      setDataPayload(data);
    } catch (err: any) {
      console.error('[Jammu SWP InstallationDetails] load error:', err);
      setToastMsg({ type: 'danger', text: err?.message || 'Failed to load installed SWP sites from server.' });
      setDataPayload(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const sites = useMemo(() => dataPayload?.sites || [], [dataPayload]);

  // Distinct districts
  const distinctDistricts = useMemo(() => {
    const list = sites.map((r) => r.district).filter(Boolean) as string[];
    return Array.from(new Set(list));
  }, [sites]);

  // Filtered sites
  const filteredSites = useMemo(() => {
    let list = sites;

    if (districtFilter !== 'all') {
      list = list.filter((s) => s.district?.toLowerCase() === districtFilter.toLowerCase());
    }

    if (statusFilter === 'approved') {
      list = list.filter((s) => Number(s.inst_verify_status) === 1);
    } else if (statusFilter === 'rejected') {
      list = list.filter((s) => Number(s.inst_verify_status) === 2);
    } else if (statusFilter === 'pending') {
      list = list.filter((s) => !s.inst_verify_status || Number(s.inst_verify_status) === 0);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((s) => {
        const farmerMatch = (s.f_farmer_name || '').toLowerCase().includes(q);
        const distMatch = (s.district || '').toLowerCase().includes(q);
        const tehsilMatch = (s.tehsil || '').toLowerCase().includes(q);
        const blockMatch = (s.block || '').toLowerCase().includes(q);
        const villageMatch = (s.village || '').toLowerCase().includes(q);
        const motorMatch = (s.mt_motor_no || '').toLowerCase().includes(q);
        const pumpMatch = (s.mt_pump_no || '').toLowerCase().includes(q);
        const vfdMatch = (s.vfd_no || '').toLowerCase().includes(q);
        const modulesMatch = fmtModules(s).toLowerCase().includes(q);
        const remarksMatch = (s.inst_remarks || '').toLowerCase().includes(q);
        return (
          String(s.id).includes(q) ||
          farmerMatch ||
          distMatch ||
          tehsilMatch ||
          blockMatch ||
          villageMatch ||
          motorMatch ||
          pumpMatch ||
          vfdMatch ||
          modulesMatch ||
          remarksMatch
        );
      });
    }
    return list;
  }, [sites, search, statusFilter, districtFilter]);

  const { paginatedData, currentPage, pageSize, totalItems, setPage, setPageSize } =
    usePagination({ data: filteredSites, initialPageSize: 100 });

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, districtFilter, setPage]);

  const hasFilters = search.trim() !== '' || districtFilter !== 'all' || statusFilter !== 'all';
  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setDistrictFilter('all');
    setPage(1);
  };

  // Open Edit Modal (API 7: GET jammu/swp/installation-update-site?site_id={site_id})
  const handleOpenEdit = async (id: number) => {
    setEditingId(id);
    setEditModalOpen(true);
    setEditLoading(true);
    setEditError(null);
    try {
      const res = await jammuSwpService.editInstallationLoad(id);
      const srt = res.site;
      if (srt) {
        let mArr: string[] = [];
        if (Array.isArray(srt.jammuModulee)) {
          mArr = srt.jammuModulee.map((m) => m.sr_no).filter(Boolean);
        }

        setEditForm({
          farmer_name: srt.f_farmer_name || '',
          motor_no: srt.mt_motor_no || '',
          pump_no: srt.mt_pump_no || '',
          vfd_no: srt.vfd_no || '',
          module_serial_no: mArr.length > 0 ? mArr : [''],
          inst_latitude: srt.inst_latitude || '',
          inst_longitude: srt.inst_longitude || '',
          inst_remarks: srt.inst_remarks || '',
        });
      }
    } catch (err: any) {
      console.error('Error loading edit data:', err);
      const target = sites.find((c) => c.id === id);
      setEditForm({
        farmer_name: target?.f_farmer_name || '',
        motor_no: target?.mt_motor_no || '',
        pump_no: target?.mt_pump_no || '',
        vfd_no: target?.vfd_no || '',
        module_serial_no: [''],
        inst_latitude: target?.inst_latitude || '',
        inst_longitude: target?.inst_longitude || '',
        inst_remarks: target?.inst_remarks || '',
      });
      setEditError(err?.message || 'Failed to load site details for editing.');
    } finally {
      setEditLoading(false);
    }
  };

  // Save Edit Form (API 8: POST jammu/swp/installation-update-site-store)
  const handleSaveEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    if (!editFiles.module_image || !editFiles.vfd_image || !editFiles.running_water_image || !editFiles.pole_image) {
      setEditError('All 4 images are required again on every edit per backend policy.');
      return;
    }

    setSubmittingEdit(true);
    setEditError(null);
    try {
      const fd = new FormData();
      fd.append('site_id', String(editingId));
      fd.append('motor_no', editForm.motor_no.trim());
      fd.append('pump_no', editForm.pump_no.trim());
      fd.append('vfd_no', editForm.vfd_no.trim());
      fd.append('inst_latitude', editForm.inst_latitude.trim());
      fd.append('inst_longitude', editForm.inst_longitude.trim());
      if (editForm.inst_remarks.trim()) {
        fd.append('inst_remarks', editForm.inst_remarks.trim());
      }

      editForm.module_serial_no.forEach((m) => {
        if (m.trim()) {
          fd.append('module_serial_no[]', m.trim());
        }
      });

      fd.append('module_image', editFiles.module_image);
      fd.append('vfd_image', editFiles.vfd_image);
      fd.append('running_water_image', editFiles.running_water_image);
      fd.append('pole_image', editFiles.pole_image);

      const res = await jammuSwpService.updateInstallationStore(fd);
      setToastMsg({
        type: 'success',
        text: res.message || 'Site updated successfully!',
      });
      setEditModalOpen(false);
      await loadData();
    } catch (err: any) {
      console.error('[Jammu SWP Edit] submit error:', err);
      setEditError(err?.message || 'Failed to update installation site.');
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Submit HOC Document Form (API 9: POST jammu/swp/installation-doc-store)
  const handleOpenDocModal = (site: JammuSwpInstalledSiteItem) => {
    setDocModalSite(site);
    setHocPhoto(null);
    setHocDate(new Date().toISOString().slice(0, 10));
    setHocRemarks('');
    setDocError(null);
  };

  const closeDocModal = () => {
    setDocModalSite(null);
    setHocPhoto(null);
    setHocRemarks('');
    setDocError(null);
    if (hocPhotoRef.current) hocPhotoRef.current.value = '';
  };

  const handleDocSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!docModalSite) return;
    if (!hocPhoto) {
      setDocError('HOC Photo is required.');
      return;
    }

    setDocError(null);
    setDocSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('site_id', String(docModalSite.id));
      fd.append('hoc_photo', hocPhoto);
      if (hocDate) fd.append('date', hocDate);
      if (hocRemarks.trim()) fd.append('hoc_remarks', hocRemarks.trim());

      const res = await jammuSwpService.submitHocDocument(fd);
      setToastMsg({
        type: 'success',
        text: res.message || 'HOC submitted successfully!',
      });

      setDataPayload((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          sites: prev.sites.map((s) =>
            s.id === docModalSite.id ? { ...s, inst_doc_status: 1, inst_doc: res.data?.inst_doc || s.inst_doc } : s
          ),
        };
      });

      closeDocModal();
      await loadData();
    } catch (err: any) {
      console.error('[Jammu SWP SubmitDoc] error:', err);
      setDocError(err?.message || 'Failed to submit HOC document.');
    } finally {
      setDocSubmitting(false);
    }
  };

  // Export Columns definition
  const exportCols: ExportColumn<JammuSwpInstalledSiteItem>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r, idx?: number) => (idx !== undefined ? idx + 1 : '') } as any,
      { header: 'State', accessor: () => 'Jammu & Kashmir' },
      { header: 'District', accessor: (r) => txt(r, 'district') },
      { header: 'Tehsil', accessor: (r) => txt(r, 'tehsil') },
      { header: 'Block', accessor: (r) => txt(r, 'block') },
      { header: 'Village', accessor: (r) => txt(r, 'village') },
      { header: 'Applicant Name', accessor: (r) => txt(r, 'f_farmer_name') },
      { header: 'VFD No.', accessor: (r) => txt(r, 'vfd_no') },
      { header: 'Motor No.', accessor: (r) => txt(r, 'mt_motor_no') },
      { header: 'Pump No.', accessor: (r) => txt(r, 'mt_pump_no') },
      { header: 'Module Serial No.', accessor: (r) => fmtModules(r) },
      { header: 'Remarks', accessor: (r) => txt(r, 'inst_remarks') },
      {
        header: 'Verify Status',
        accessor: (r) => (Number(r.inst_verify_status) === 1 ? 'Approved' : Number(r.inst_verify_status) === 2 ? 'Rejected' : 'Pending'),
      },
      { header: 'Verify Remarks', accessor: (r) => txt(r, 'inst_verify_remarks') },
      {
        header: 'Document Status',
        accessor: (r) => (Number(r.inst_doc_status) === 2 ? 'Approved' : Number(r.inst_doc_status) === 1 ? 'Submitted' : 'Not Submitted'),
      },
      { header: 'Document Remarks', accessor: (r) => txt(r, 'inst_doc_remarks') },
      { header: 'Doc Verify Remarks', accessor: (r) => txt(r, 'inst_doc_verify_remarks') },
      {
        header: 'Claim Status',
        accessor: (r) => (Number(r.inst_claim_status) === 2 ? 'Approved' : Number(r.inst_claim_status) === 1 ? 'Raised' : 'Not Raised'),
      },
      {
        header: 'Payment Status',
        accessor: (r) => (Number(r.inst_pay_status) === 1 ? 'Done' : Number(r.inst_pay_status) === 2 ? 'Partially' : 'Pending'),
      },
    ],
    []
  );

  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = 'Jammu_SWP_Installed_Sites';
  const fileTitle = 'Jammu SWP Installation Audit Register';

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

  // Header metric counts from dataPayload.install_detail
  const detail = dataPayload?.install_detail;
  const totalAccepted = detail?.total ?? dataPayload?.assign ?? 0;
  const installedCount = detail?.complete ?? sites.length;
  const approvedCount = detail?.verify_approved ?? sites.filter((s) => Number(s.inst_verify_status) === 1).length;
  const pendingCount = detail?.verify_pending ?? sites.filter((s) => !s.inst_verify_status || Number(s.inst_verify_status) === 0).length;

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="Jammu SWP Installation"
        subtitle="Complete audit register of verified solar water pump installations, equipment serials, and farmer photos"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Jammu & Kashmir' },
          { label: 'Installation' },
          { label: 'SWP' },
          { label: 'View Installation' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)' }}>
            <Link to="/v/jammu/installation/swp/installation-site" className="ax-btn ax-btn--primary ax-btn--sm">
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

      {/* ── Top Metric KPI Cards ── */}
      <div className="asw-cards-row">
        <KpiCard
          tone="accent"
          label="Total Accepted"
          value={totalAccepted.toLocaleString('en-IN')}
          sub="Assigned for installation"
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
          sub="Equipment & photos recorded"
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
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <polyline points="12 7 12 12 15 15" />
            </svg>
          }
        />

        <KpiCard
          tone="violet"
          label="Pending Verification"
          value={pendingCount.toLocaleString('en-IN')}
          sub="Awaiting department review"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
        />
      </div>

      {/* ── Main Table Card ── */}
      <section className="ax-card ax-col--12" role="region" aria-labelledby="view-install-table-title">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 id="view-install-table-title" className="ax-card__title">
              Jammu SWP Installation
            </h2>
            <p className="ax-card__subtitle">
              <span className="ax-num">{filteredSites.length}</span> installations found.
            </p>
          </div>

          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              {distinctDistricts.length > 0 && (
                <select
                  id="swp_district_filter"
                  className="ax-input ax-input--sm"
                  style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                  value={districtFilter}
                  onChange={(e) => {
                    setDistrictFilter(e.target.value);
                    setPage(1);
                  }}
                  aria-label="Filter by district"
                >
                  <option value="all">All Districts</option>
                  {distinctDistricts.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              )}

              <select
                id="swp_status_filter"
                className="ax-input ax-input--sm"
                style={{ width: 150, height: 32, fontSize: 'var(--ax-text-xs)' }}
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                aria-label="Filter by verify status"
              >
                <option value="all">All Verification</option>
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
                placeholder="Search applicant, district, serial…"
                size="sm"
                ariaLabel="Search installed SWP sites"
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
            <caption className="ax-visually-hidden">Jammu SWP Installation Data</caption>
            <thead className="ax-table__head">
              <tr>
                {HEADERS_24.map((h) => (
                  <th key={h} className="ax-table__th" scope="col" style={h === 'Action' ? { textAlign: 'center', width: 120 } : undefined}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody aria-busy={loading}>
              {loading && (
                <tr>
                  <td className="ax-table__td" colSpan={HEADERS_24.length} style={centerCell}>
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading installed SWP sites from server…
                  </td>
                </tr>
              )}
              {!loading && filteredSites.length === 0 && (
                <tr>
                  <td className="ax-table__td" colSpan={HEADERS_24.length} style={{ padding: 0 }}>
                    <TableEmptyState
                      title="No data available in table"
                      message={
                        hasFilters
                          ? 'No records match your filters or search. Try clearing your query.'
                          : 'No installed SWP records found. Completed sites will appear here once recorded via the Install Site form.'
                      }
                      onClear={hasFilters ? resetFilters : undefined}
                      clearLabel="Clear filters"
                    />
                  </td>
                </tr>
              )}
              {!loading &&
                paginatedData.map((row, index) => {
                  const siteLabel = row.f_farmer_name || `Site #${row.id}`;
                  const isVerifyApproved = Number(row.inst_verify_status) === 1;
                  const isHocSubmitted = Number(row.inst_doc_status) === 1 || Number(row.inst_doc_status) === 2 || Boolean(row.inst_doc);
                  const canSubmitHoc = isVerifyApproved && !isHocSubmitted;
                  const docUrl = resolveJammuSwpMediaUrl(row.inst_doc);

                  return (
                    <tr key={row.id} className="ax-table__row">
                      <td className="ax-table__td ax-num">{(currentPage - 1) * pageSize + index + 1}</td>
                      <td className="ax-table__td">{row.state || 'jammu'}</td>
                      <td className="ax-table__td"><b>{txt(row, 'district') || DASH}</b></td>
                      <td className="ax-table__td">{txt(row, 'tehsil') || DASH}</td>
                      <td className="ax-table__td">{txt(row, 'block') || DASH}</td>
                      <td className="ax-table__td">{txt(row, 'village') || DASH}</td>
                      <td className="ax-table__td">
                        <span style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                          {row.f_farmer_name || DASH}
                        </span>
                      </td>
                      <td className="ax-table__td" style={monoCell}>{txt(row, 'vfd_no') || DASH}</td>
                      <td className="ax-table__td" style={monoCell}>{txt(row, 'mt_motor_no') || DASH}</td>
                      <td className="ax-table__td" style={monoCell}>{txt(row, 'mt_pump_no') || DASH}</td>
                      <td className="ax-table__td" style={{ ...monoCell, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {fmtModules(row)}
                      </td>

                      {/* 4 Photo Thumbnails with click-to-preview lightbox */}
                      <td className="ax-table__td">
                        <InstallationThumbnail
                          src={row.module_image}
                          alt={`${siteLabel} - Farmer With Module Image`}
                          onPreview={openPreview}
                        />
                      </td>
                      <td className="ax-table__td">
                        <InstallationThumbnail
                          src={row.vfd_image}
                          alt={`${siteLabel} - Inverter and VFD with Farmer Image`}
                          onPreview={openPreview}
                        />
                      </td>
                      <td className="ax-table__td">
                        <InstallationThumbnail
                          src={row.running_water_image}
                          alt={`${siteLabel} - Running Water With Farmer Image`}
                          onPreview={openPreview}
                        />
                      </td>
                      <td className="ax-table__td">
                        <InstallationThumbnail
                          src={row.pole_image}
                          alt={`${siteLabel} - Pole With Farmer Image`}
                          onPreview={openPreview}
                        />
                      </td>

                      {/* Remarks */}
                      <td className="ax-table__td" style={{ maxWidth: 180, whiteSpace: 'normal', fontSize: '12px' }}>
                        {txt(row, 'inst_remarks') || DASH}
                      </td>

                      {/* Verify Status & Remarks */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <VerifyBadge value={row.inst_verify_status} />
                      </td>
                      <td className="ax-table__td" style={{ maxWidth: 160, whiteSpace: 'normal', fontSize: '12px' }}>
                        {txt(row, 'inst_verify_remarks') || DASH}
                      </td>

                      {/* Document Status & Remarks */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <DocStatusBadge status={row.inst_doc_status} docUrl={docUrl} />
                      </td>
                      <td className="ax-table__td" style={{ maxWidth: 160, whiteSpace: 'normal', fontSize: '12px' }}>
                        {txt(row, 'inst_doc_remarks') || DASH}
                      </td>
                      <td className="ax-table__td" style={{ maxWidth: 160, whiteSpace: 'normal', fontSize: '12px' }}>
                        {txt(row, 'inst_doc_verify_remarks') || DASH}
                      </td>

                      {/* Claim & Payment Status */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <ClaimBadge status={row.inst_claim_status} />
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <PaymentStatusBadge status={row.inst_pay_status} />
                      </td>

                      {/* Action */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                          {canSubmitHoc && (
                            <button
                              type="button"
                              className="ax-btn ax-btn--primary ax-btn--xs"
                              style={{ height: 26, fontSize: 11.5, padding: '0 8px' }}
                              onClick={() => handleOpenDocModal(row)}
                              title="Upload certified HOC photo"
                            >
                              Submit HOC
                            </button>
                          )}

                          {!isVerifyApproved ? (
                            <button
                              type="button"
                              className="ax-btn ax-btn--secondary ax-btn--xs"
                              onClick={() => handleOpenEdit(row.id)}
                              title="Edit installation details"
                            >
                              Edit
                            </button>
                          ) : (
                            !canSubmitHoc && (
                              <span
                                className="ax-badge ax-badge--soft"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  padding: '4px 8px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  color: 'var(--ax-text-muted, #64748b)',
                                  background: 'var(--ax-surface-subtle, #f1f5f9)',
                                  border: '1px solid var(--ax-border, #cbd5e1)',
                                  borderRadius: 6,
                                  cursor: 'not-allowed',
                                }}
                                title="Installation Verified & Approved. Actions locked."
                              >
                                🔒 Locked
                              </span>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* ── Table Footer ── */}
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

      {/* ── Photo Preview Lightbox Zoom Modal ── */}
      {preview && <ImagePreviewModal url={preview.url} title={preview.title} onClose={closePreview} />}

      {/* ── Edit Site Details Modal (API 7 & API 8) ── */}
      <Modal open={editModalOpen} onClose={() => setEditModalOpen(false)} labelledBy="swp-edit-title" dialogClass="ax-modal__dialog--lg">
        <form onSubmit={handleSaveEdit}>
          <div className="ax-modal__header">
            <div>
              <h4 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--ax-text-strong, #0f172a)' }} id="swp-edit-title">
                Edit SWP Installation Details
              </h4>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--ax-text-muted, #64748b)' }}>
                Applicant: <b>{editForm.farmer_name}</b> (#{editingId})
              </p>
            </div>
            <button
              type="button"
              className="ax-modal__close"
              onClick={() => setEditModalOpen(false)}
              disabled={submittingEdit}
              aria-label="Close dialog"
            >
              ✕
            </button>
          </div>

          <div className="ax-modal__body" style={{ padding: 24 }}>
            {editError && (
              <div style={{ marginBottom: 16, padding: 12, borderRadius: 8, background: '#fef2f2', color: '#991b1b', fontSize: 13, fontWeight: 600, border: '1px solid #fecaca' }}>
                ✕ {editError}
              </div>
            )}

            {editLoading ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#2563eb' }}>
                <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading SWP specifications for edit…
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Equipment Numbers */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                  <div className="ax-modern-field">
                    <label className="ax-modern-label">
                      <span>Motor Serial Number</span>
                      <span className="ax-modern-req">*</span>
                    </label>
                    <input
                      type="text"
                      className="ax-input"
                      value={editForm.motor_no}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, motor_no: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="ax-modern-field">
                    <label className="ax-modern-label">
                      <span>Pump Serial Number</span>
                      <span className="ax-modern-req">*</span>
                    </label>
                    <input
                      type="text"
                      className="ax-input"
                      value={editForm.pump_no}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, pump_no: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="ax-modern-field">
                    <label className="ax-modern-label">
                      <span>VFD Serial Number</span>
                      <span className="ax-modern-req">*</span>
                    </label>
                    <input
                      type="text"
                      className="ax-input"
                      value={editForm.vfd_no}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, vfd_no: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                {/* Module Serial Numbers */}
                <div className="ax-modern-field">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <label className="ax-modern-label">
                      <span>Module Serial Numbers ({editForm.module_serial_no.length})</span>
                      <span className="ax-modern-req">*</span>
                    </label>
                    <button
                      type="button"
                      className="ax-btn ax-btn--secondary ax-btn--xs"
                      onClick={() => setEditForm((prev) => ({ ...prev, module_serial_no: [...prev.module_serial_no, ''] }))}
                    >
                      + Add Module
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
                    {editForm.module_serial_no.map((m, mIdx) => (
                      <div key={mIdx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input
                          type="text"
                          className="ax-input"
                          style={{ flex: 1 }}
                          value={m}
                          placeholder={`Module #${mIdx + 1}`}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditForm((prev) => {
                              const next = [...prev.module_serial_no];
                              next[mIdx] = val;
                              return { ...prev, module_serial_no: next };
                            });
                          }}
                          required={mIdx === 0}
                        />
                        {editForm.module_serial_no.length > 1 && (
                          <button
                            type="button"
                            className="ax-btn ax-btn--ghost ax-btn--xs"
                            style={{ color: '#ef4444', padding: '0 6px' }}
                            onClick={() => {
                              setEditForm((prev) => ({
                                ...prev,
                                module_serial_no: prev.module_serial_no.filter((_, idx) => idx !== mIdx),
                              }));
                            }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Geolocation & Remarks */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                  <div className="ax-modern-field">
                    <label className="ax-modern-label">
                      <span>Latitude</span>
                      <span className="ax-modern-req">*</span>
                    </label>
                    <input
                      type="text"
                      className="ax-input"
                      value={editForm.inst_latitude}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, inst_latitude: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="ax-modern-field">
                    <label className="ax-modern-label">
                      <span>Longitude</span>
                      <span className="ax-modern-req">*</span>
                    </label>
                    <input
                      type="text"
                      className="ax-input"
                      value={editForm.inst_longitude}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, inst_longitude: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="ax-modern-field" style={{ gridColumn: '1 / -1' }}>
                    <label className="ax-modern-label">
                      <span>Remarks</span>
                    </label>
                    <input
                      type="text"
                      className="ax-input"
                      value={editForm.inst_remarks}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, inst_remarks: e.target.value }))}
                      placeholder="Enter update remarks..."
                    />
                  </div>
                </div>

                {/* 4 Images required on edit per backend controller rule */}
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>
                  <label className="ax-modern-label" style={{ marginBottom: 8 }}>
                    <span>Upload 4 Photos (Required on Edit)</span>
                    <span className="ax-modern-req">*</span>
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                    <div>
                      <span style={{ fontSize: 11.5, fontWeight: 600, display: 'block', marginBottom: 4 }}>Module Image *</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="ax-input"
                        onChange={(e) => setEditFiles((prev) => ({ ...prev, module_image: e.target.files?.[0] || null }))}
                        required
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: 11.5, fontWeight: 600, display: 'block', marginBottom: 4 }}>VFD Image *</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="ax-input"
                        onChange={(e) => setEditFiles((prev) => ({ ...prev, vfd_image: e.target.files?.[0] || null }))}
                        required
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: 11.5, fontWeight: 600, display: 'block', marginBottom: 4 }}>Running Water Image *</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="ax-input"
                        onChange={(e) => setEditFiles((prev) => ({ ...prev, running_water_image: e.target.files?.[0] || null }))}
                        required
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: 11.5, fontWeight: 600, display: 'block', marginBottom: 4 }}>Pole Image *</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="ax-input"
                        onChange={(e) => setEditFiles((prev) => ({ ...prev, pole_image: e.target.files?.[0] || null }))}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="ax-modal__footer">
            <button
              type="button"
              className="ax-btn ax-btn--secondary"
              onClick={() => setEditModalOpen(false)}
              disabled={submittingEdit}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="ax-btn ax-btn--primary"
              disabled={submittingEdit || editLoading}
            >
              {submittingEdit ? 'Updating Details…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Submit HOC Document Modal (API 9: POST jammu/swp/installation-doc-store) ── */}
      <Modal open={!!docModalSite} onClose={closeDocModal} labelledBy="swp-hoc-title" dialogClass="ax-modal__dialog--md">
        {docModalSite && (
          <form onSubmit={handleDocSubmit}>
            <div className="ax-modal__header">
              <div>
                <h4 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--ax-text-strong, #0f172a)' }} id="swp-hoc-title">
                  Submit HOC Document
                </h4>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--ax-text-muted, #64748b)' }}>
                  Applicant: <b>{docModalSite.f_farmer_name || DASH}</b> (#{docModalSite.id}) {docModalSite.district ? `· ${docModalSite.district}` : ''}
                </p>
              </div>
              <button
                type="button"
                className="ax-modal__close"
                onClick={closeDocModal}
                disabled={docSubmitting}
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <div className="ax-modal__body" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {docError && (
                <div style={{ padding: 12, borderRadius: 8, background: '#fef2f2', color: '#991b1b', fontSize: 13, fontWeight: 600, border: '1px solid #fecaca' }}>
                  ✕ {docError}
                </div>
              )}

              <div style={{ fontSize: 12.5, color: 'var(--ax-text-muted, #64748b)', background: 'var(--ax-surface-subtle, #f8fafc)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--ax-border, #e2e8f0)' }}>
                Upload certified Handover Certificate (HOC) signed photo with farmer (JPG, PNG, WEBP, max 5MB).
              </div>

              {/* HOC Photo Upload */}
              <div className="ax-modern-field">
                <label className="ax-modern-label">
                  <span>HOC Photo</span>
                  <span className="ax-modern-req">*</span>
                </label>
                <input
                  ref={hocPhotoRef}
                  id="swp_hoc_photo_input"
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => setHocPhoto(e.target.files?.[0] || null)}
                />
                {!hocPhoto ? (
                  <div
                    className="ax-modern-dropzone"
                    onClick={() => hocPhotoRef.current?.click()}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="ax-modern-dropzone__icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 22, height: 22, color: '#2563eb' }}>
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong, #1e293b)' }}>
                        Click to upload HOC photo
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--ax-text-muted, #64748b)', marginTop: 2 }}>
                        Allowed: JPG, PNG, WEBP (Max 5 MB)
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="ax-modern-file-chip">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <span className="ax-modern-file-chip__icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 18, height: 18, color: '#059669' }}>
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong, #1e293b)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {hocPhoto.name}
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--ax-text-muted, #64748b)' }}>
                          {(hocPhoto.size / 1024).toFixed(1)} KB
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="ax-btn ax-btn--ghost ax-btn--sm"
                      style={{ padding: '4px 8px', fontSize: 12, color: '#ef4444' }}
                      onClick={() => {
                        setHocPhoto(null);
                        if (hocPhotoRef.current) hocPhotoRef.current.value = '';
                      }}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Date */}
              <div className="ax-modern-field">
                <label className="ax-modern-label" htmlFor="hoc_date">
                  <span>HOC Date</span>
                </label>
                <input
                  id="hoc_date"
                  type="date"
                  className="ax-input"
                  style={{ width: '100%', height: 42 }}
                  value={hocDate}
                  onChange={(e) => setHocDate(e.target.value)}
                />
              </div>

              {/* Remarks */}
              <div className="ax-modern-field">
                <label className="ax-modern-label" htmlFor="hoc_remarks">
                  <span>HOC Remarks</span>
                </label>
                <textarea
                  id="hoc_remarks"
                  className="ax-input"
                  style={{ width: '100%', padding: '10px 12px', minHeight: 70 }}
                  value={hocRemarks}
                  onChange={(e) => setHocRemarks(e.target.value)}
                  placeholder="Enter remarks for HOC handover..."
                  rows={3}
                />
              </div>
            </div>

            <div className="ax-modal__footer">
              <button
                type="button"
                className="ax-btn ax-btn--secondary"
                onClick={closeDocModal}
                disabled={docSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="ax-btn ax-btn--primary"
                disabled={docSubmitting || !hocPhoto}
              >
                {docSubmitting ? 'Submitting…' : 'Submit HOC'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

export default SWPViewInstallation;
