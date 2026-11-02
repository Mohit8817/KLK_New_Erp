import { useState, useMemo, useEffect, useCallback, useRef, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  jammuSrt70mwService,
  getJammuMediaCandidates,
  resolveJammuMediaUrl,
  type JammuInstallationSummaryData,
  type JammuCompleteSiteItem,
  type JammuPaymentSiteItem,
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

const VerifyBadge = ({ value, raw }: { value: number; raw?: any }) => {
  const r = String(raw ?? '').toLowerCase().trim();
  if (value === 1 || r === '1' || r === 'approved') return <Badge tone="success">Approved</Badge>;
  if (value === 2 || r === '2' || r === 'rejected' || r === 'reject') return <Badge tone="danger">Rejected</Badge>;
  return <Badge tone="warning">Pending</Badge>;
};

const ClaimBadge = ({ status }: { status?: number }) => {
  if (status === 2) return <Badge tone="success">Approved</Badge>;
  if (status === 3) return <Badge tone="danger">Rejected</Badge>;
  if (status === 1) return <Badge tone="info">Raised</Badge>;
  return <Badge tone="neutral">Not Raised</Badge>;
};

const txt = (row: any, key: string): string => {
  const v = row?.[key];
  if (v === null || v === undefined || v === '') return '';
  return String(v);
};

const fmtSerials = (val?: any): string => {
  if (!val) return DASH;
  if (Array.isArray(val)) {
    const valid = val.map(String).map((s) => s.trim()).filter(Boolean);
    return valid.length > 0 ? valid.join(', ') : DASH;
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed || trimmed === '[]' || trimmed === '[""]') return DASH;
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        const valid = parsed.map(String).map((s) => s.trim()).filter(Boolean);
        return valid.length > 0 ? valid.join(', ') : DASH;
      }
    } catch {}
    return trimmed.replace(/[\[\]"']/g, '').trim() || DASH;
  }
  return String(val);
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
    <Modal open onClose={onClose} labelledBy="jammu-preview-title" dialogClass="ax-modal__dialog--lg">
      <div className="ax-modal__header">
        <h2 className="ax-modal__title" id="jammu-preview-title">{title || 'Media Preview'}</h2>
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
  const candidates = useMemo(() => getJammuMediaCandidates(src), [src]);
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

  /* Modern Dropzone inside Submit Document Modal */
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

// Jammu SRT 70MW Columns
const COMMON_HEADERS = [
  'Sr. No.',
  'State',
  'District',
  'Department',
  'Site Name',
  'Location',
  'CA No.',
  'Sanction Load',
  'Contact Person',
  'Contact No.',
  'Inverter No.',
  'Sim No.',
  'Solar Meter No.',
  'Net Meter / Smart Meter No.',
  'RMS Loger No.',
  'Panel Serials',
  'Total Panels',
  'Panel Photo',
  'System Photo',
  'Inverter Photo',
  'Net Meter Photo',
  'Loger Photo',
  'Latitude',
  'Longitude',
  'Installation Date',
  'Remarks',
];

export function InstallationDetails() {
  const navigate = useNavigate();

  const [tab, setTab] = useState<'completed' | 'payment'>('completed');
  const [summaryData, setSummaryData] = useState<JammuInstallationSummaryData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [districtFilter, setDistrictFilter] = useState<string>('all');

  // Photo preview modal (lightbox zoom)
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
    site_name: '',
    contact_person: '',
    contact_number: '',
    inverter_no: '',
    sim_no: '',
    solarmeter_no: '',
    nm_sm_no: '',
    loger_no: '',
    panel_no: [] as string[],
    latitude: '',
    longitude: '',
    remarks: '',
  });
  const [submittingEdit, setSubmittingEdit] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Load live data from API 6: GET /jammu/srt70mw/view-install-srt70mw-sites
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await jammuSrt70mwService.getInstallationSummary();
      setSummaryData({
        ...data,
        completesite: data?.completesite || [],
        paymentsite: data?.paymentsite || [],
      });
    } catch (err: any) {
      console.error('[Jammu SRT InstallationDetails] load error:', err);
      setToastMsg({ type: 'danger', text: err?.message || 'Failed to load installation sites from server.' });
      setSummaryData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Current active records
  const currentRecords = useMemo(() => {
    if (!summaryData) return [];
    return tab === 'completed' ? (summaryData.completesite || []) : (summaryData.paymentsite || []);
  }, [summaryData, tab]);

  // Distinct districts
  const distinctDistricts = useMemo(() => {
    const list = currentRecords.map((r) => r.district).filter(Boolean);
    return Array.from(new Set(list));
  }, [currentRecords]);

  // Filtered sites
  const filteredSites = useMemo(() => {
    let list = currentRecords;

    if (districtFilter !== 'all') {
      list = list.filter((s) => s.district === districtFilter);
    }

    if (tab === 'completed') {
      if (statusFilter === 'approved') {
        list = list.filter((s) => Number(s.inst_verify_status ?? s.verify_status) === 1 || String(s.inst_verify_status ?? s.verify_status).toLowerCase() === 'approved');
      } else if (statusFilter === 'rejected') {
        list = list.filter((s) => Number(s.inst_verify_status ?? s.verify_status) === 2 || String(s.inst_verify_status ?? s.verify_status).toLowerCase() === 'rejected');
      } else if (statusFilter === 'pending') {
        list = list.filter((s) => !s.inst_verify_status || Number(s.inst_verify_status ?? s.verify_status) === 0 || String(s.inst_verify_status ?? s.verify_status).toLowerCase() === 'pending');
      }
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((s) => {
        const ser = fmtSerials(s.panel_no || s.panel_serials);
        const lat = String(s.latitude || s.inst_latitude || '');
        const lng = String(s.longitude || s.inst_longitude || '');
        return (
          String(s.id).includes(q) ||
          txt(s, 'site_name').toLowerCase().includes(q) ||
          txt(s, 'ca_no').toLowerCase().includes(q) ||
          txt(s, 'district').toLowerCase().includes(q) ||
          txt(s, 'dept_name').toLowerCase().includes(q) ||
          txt(s, 'department').toLowerCase().includes(q) ||
          txt(s, 'location').toLowerCase().includes(q) ||
          txt(s, 'contact_person').toLowerCase().includes(q) ||
          txt(s, 'contact_number').toLowerCase().includes(q) ||
          txt(s, 'inverter_no').toLowerCase().includes(q) ||
          txt(s, 'sim_no').toLowerCase().includes(q) ||
          txt(s, 'solarmeter_no').toLowerCase().includes(q) ||
          txt(s, 'nm_sm_no').toLowerCase().includes(q) ||
          txt(s, 'loger_no').toLowerCase().includes(q) ||
          lat.toLowerCase().includes(q) ||
          lng.toLowerCase().includes(q) ||
          ser.toLowerCase().includes(q)
        );
      });
    }
    return list;
  }, [currentRecords, search, statusFilter, districtFilter, tab]);

  const { paginatedData, currentPage, pageSize, totalItems, setPage, setPageSize } =
    usePagination({ data: filteredSites, initialPageSize: 100 });

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, districtFilter, tab, setPage]);

  const hasFilters = search.trim() !== '' || districtFilter !== 'all' || (tab === 'completed' && statusFilter !== 'all');
  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setDistrictFilter('all');
    setPage(1);
  };

  // Open Edit Modal (API 7)
  const handleOpenEdit = async (id: number) => {
    setEditingId(id);
    setEditModalOpen(true);
    setEditLoading(true);
    setEditError(null);
    try {
      const srt = await jammuSrt70mwService.editInstallationLoad(id);
      if (srt) {
        let pArr: string[] = [];
        if (Array.isArray(srt.panel_no)) {
          pArr = srt.panel_no;
        } else if (typeof srt.panel_no === 'string') {
          try {
            pArr = JSON.parse(srt.panel_no);
          } catch {
            pArr = srt.panel_no ? [srt.panel_no] : [];
          }
        }

        setEditForm({
          site_name: srt.site_name || '',
          contact_person: srt.contact_person || '',
          contact_number: srt.contact_number ? String(srt.contact_number) : '',
          inverter_no: srt.inverter_no || '',
          sim_no: srt.sim_no || '',
          solarmeter_no: srt.solarmeter_no || '',
          nm_sm_no: srt.nm_sm_no || '',
          loger_no: srt.loger_no || '',
          panel_no: pArr.length > 0 ? pArr : [''],
          latitude: srt.inst_latitude || srt.latitude || '',
          longitude: srt.inst_longitude || srt.longitude || '',
          remarks: srt.inst_remarks || srt.remarks || '',
        });
      }
    } catch (err: any) {
      console.error('Error loading edit data:', err);
      const target = currentRecords.find((c) => c.id === id);
      setEditForm({
        site_name: target?.site_name || '',
        contact_person: target?.contact_person || '',
        contact_number: target?.contact_number || '',
        inverter_no: target?.inverter_no || '',
        sim_no: target?.sim_no || '',
        solarmeter_no: target?.solarmeter_no || '',
        nm_sm_no: target?.nm_sm_no || '',
        loger_no: target?.loger_no || '',
        panel_no: [''],
        latitude: target?.latitude || '',
        longitude: target?.longitude || '',
        remarks: target?.remarks || '',
      });
      setEditError(err?.message || 'Failed to load site details for editing.');
    } finally {
      setEditLoading(false);
    }
  };

  // Save Edit Form (API 8)
  const handleSaveEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    setSubmittingEdit(true);
    setEditError(null);
    try {
      const fd = new FormData();
      fd.append('srt_id', String(editingId));
      fd.append('id', String(editingId));
      fd.append('contact_person', editForm.contact_person.trim());
      fd.append('contact_number', editForm.contact_number.trim());
      fd.append('inverter_no', editForm.inverter_no.trim());
      fd.append('sim_no', editForm.sim_no.trim());
      fd.append('solarmeter_no', editForm.solarmeter_no.trim());
      fd.append('solar_meter_no', editForm.solarmeter_no.trim());
      fd.append('nm_sm_no', editForm.nm_sm_no.trim());
      fd.append('loger_no', editForm.loger_no.trim());
      fd.append('rms_loger_no', editForm.loger_no.trim());
      fd.append('inst_latitude', editForm.latitude.trim());
      fd.append('latitude', editForm.latitude.trim());
      fd.append('inst_longitude', editForm.longitude.trim());
      fd.append('longitude', editForm.longitude.trim());
      fd.append('inst_remarks', editForm.remarks.trim());
      fd.append('remarks', editForm.remarks.trim());

      editForm.panel_no.forEach((p, idx) => {
        if (p.trim()) {
          fd.append('panel_no[]', p.trim());
          fd.append(`panel_no[${idx}]`, p.trim());
        }
      });

      const res = await jammuSrt70mwService.updateInstallationStore(fd);
      setToastMsg({
        type: 'success',
        text: res.message || 'Installation details updated successfully!',
      });
      setEditModalOpen(false);
      await loadData();
    } catch (err: any) {
      console.error('[Jammu SRT Edit] submit error:', err);
      setEditError(err?.message || 'Failed to update installation details.');
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Export Columns definition
  const exportCols: ExportColumn<any>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r, idx?: number) => (idx !== undefined ? idx + 1 : '') } as any,
      { header: 'State', accessor: () => 'Jammu & Kashmir' },
      { header: 'District', accessor: (r) => txt(r, 'district') },
      { header: 'Department', accessor: (r) => txt(r, 'dept_name') || txt(r, 'department') },
      { header: 'Site Name', accessor: (r) => txt(r, 'site_name') },
      { header: 'Location', accessor: (r) => txt(r, 'location') },
      { header: 'CA No.', accessor: (r) => txt(r, 'ca_no') },
      { header: 'Sanction Load', accessor: (r) => (r.sanction_load ? `${r.sanction_load} kW` : '') },
      { header: 'Contact Person', accessor: (r) => txt(r, 'contact_person') },
      { header: 'Contact No.', accessor: (r) => txt(r, 'contact_number') },
      { header: 'Inverter No.', accessor: (r) => txt(r, 'inverter_no') },
      { header: 'Sim No.', accessor: (r) => txt(r, 'sim_no') },
      { header: 'Solar Meter No.', accessor: (r) => txt(r, 'solarmeter_no') },
      { header: 'Net Meter No.', accessor: (r) => txt(r, 'nm_sm_no') },
      { header: 'RMS Loger No.', accessor: (r) => txt(r, 'loger_no') },
      { header: 'Panel Serials', accessor: (r) => fmtSerials(r.panel_no) },
      { header: 'Total Panels', accessor: (r) => r.total_panels ?? r.panels_count ?? '' },
      { header: 'Latitude', accessor: (r) => txt(r, 'latitude') || txt(r, 'inst_latitude') },
      { header: 'Longitude', accessor: (r) => txt(r, 'longitude') || txt(r, 'inst_longitude') },
      { header: 'Installation Date', accessor: (r) => txt(r, 'inst_date') || txt(r, 'created_at') },
      { header: 'Remarks', accessor: (r) => txt(r, 'inst_remarks') || txt(r, 'remarks') },
      ...(tab === 'completed'
        ? [
            {
              header: 'Verify Status',
              accessor: (r: any) => {
                const v = Number(r.inst_verify_status ?? r.verify_status);
                const str = String(r.inst_verify_status ?? r.verify_status ?? '').toLowerCase().trim();
                if (v === 1 || str === '1' || str === 'approved') return 'Approved';
                if (v === 2 || str === '2' || str === 'rejected') return 'Rejected';
                return 'Pending';
              },
            },
            {
              header: 'Claim Status',
              accessor: (r: any) =>
                Number(r.inst_claim_status ?? r.claim_status) === 2
                  ? 'Approved'
                  : Number(r.inst_claim_status ?? r.claim_status) === 3
                  ? 'Rejected'
                  : Number(r.inst_claim_status ?? r.claim_status) === 1
                  ? 'Raised'
                  : 'Not Raised',
            },
          ]
        : [
            {
              header: '80% Payment Status',
              accessor: (r: any) => (Number(r.inst_pay80_status) === 1 ? '80% Disbursed' : 'Pending'),
            },
            {
              header: '20% Payment Status',
              accessor: (r: any) => (Number(r.inst_pay20_status) === 1 ? '20% Disbursed' : 'Pending'),
            },
          ]),
    ],
    [tab]
  );

  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = `Jammu_SRT_70MW_${tab === 'completed' ? 'Completed' : 'Payment_Settled'}_Installations`;
  const fileTitle = `Jammu SRT 70MW ${tab === 'completed' ? 'Completed' : 'Payment Settled'} Installation Register`;

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

  // Header metric counts
  const totalAccepted = summaryData?.totalsite ?? 0;
  const installedCount = summaryData?.complete ?? 0;
  const approvedCount = summaryData?.approvedsite ?? currentRecords.filter((s) => Number(s.inst_verify_status ?? s.verify_status) === 1).length;
  const pendingCount = summaryData?.verifypending ?? currentRecords.filter((s) => !s.inst_verify_status || Number(s.inst_verify_status ?? s.verify_status) === 0).length;
  const rejectedCount = summaryData?.rejectsite ?? currentRecords.filter((s) => Number(s.inst_verify_status ?? s.verify_status) === 2).length;
  const settledCount = summaryData?.paymentsitecount ?? summaryData?.paymentsite?.length ?? 0;

  const totalColumns = tab === 'completed' ? COMMON_HEADERS.length + 3 : COMMON_HEADERS.length + 2;

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* ── Page Head matching reference ── */}
      <PageHead
        title="Jammu SRT 70MW Installed Sites"
        subtitle="Complete audit register of verified solar rooftop installations and billing certificates"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Jammu & Kashmir' },
          { label: 'Installation' },
          { label: 'SRT 70MW' },
          { label: 'Installation Details' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)' }}>
            <Link to="/v/jammu/installation/srt-70mw/install-sites" className="ax-btn ax-btn--primary ax-btn--sm">
              <span className="ax-btn__label">+ New Installation</span>
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
          sub="Equipment & photos uploaded"
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
          label="Payment Settled"
          value={settledCount.toLocaleString('en-IN')}
          sub={`${summaryData?.claimraised || 0} claims raised`}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
        />
      </div>

      {/* ── Tabs ABOVE Table (per reference design) ── */}
      <div style={{ marginBottom: 'var(--ax-space-3, 12px)' }}>
        <div className="ax-cluster" role="tablist" aria-label="Installation report tabs" style={{ gap: 'var(--ax-space-2)' }}>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'completed'}
            className={`ax-btn ax-btn--sm ${tab === 'completed' ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
            onClick={() => setTab('completed')}
          >
            <span className="ax-btn__label">
              Complete SRT ({summaryData?.completesite?.length || 0})
            </span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'payment'}
            className={`ax-btn ax-btn--sm ${tab === 'payment' ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
            onClick={() => setTab('payment')}
          >
            <span className="ax-btn__label">
              Payment SRT ({summaryData?.paymentsite?.length || 0})
            </span>
          </button>
        </div>
      </div>

      <div className="ax-dash-grid">
        {/* ── Main Sites Table ── */}
        <section className="ax-card ax-col--12" role="region" aria-labelledby="view-install-table-title">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 id="view-install-table-title" className="ax-card__title">
                {tab === 'completed' ? 'Complete SRT Installations' : 'Payment SRT Sites'}
              </h2>
              <p className="ax-card__subtitle">
                <span className="ax-num">{filteredSites.length}</span> installations found.
              </p>
            </div>

            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                {/* District Filter */}
                {distinctDistricts.length > 0 && (
                  <select
                    id="jammu_district_filter"
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

                {/* Verification Status Filter (completed tab only) */}
                {tab === 'completed' && (
                  <select
                    id="jammu_status_filter"
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
                  value={search}
                  onChange={setSearch}
                  placeholder="Search site, CA no, district, serial…"
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
              style={{ whiteSpace: 'nowrap', minWidth: 2900 }}
            >
              <caption className="ax-visually-hidden">Jammu SRT 70MW {tab === 'completed' ? 'Completed' : 'Payment'} Installation Data</caption>
              <thead className="ax-table__head">
                <tr>
                  {COMMON_HEADERS.map((h) => (
                    <th key={h} className="ax-table__th" scope="col">
                      {h}
                    </th>
                  ))}
                  {tab === 'completed' ? (
                    <>
                      <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Verify Status</th>
                      <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Claim Status</th>
                      <th className="ax-table__th" scope="col" style={{ textAlign: 'center', width: 90 }}>Action</th>
                    </>
                  ) : (
                    <>
                      <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>80% Payment Status</th>
                      <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>20% Payment Status</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody aria-busy={loading}>
                {loading && (
                  <tr>
                    <td className="ax-table__td" colSpan={totalColumns} style={centerCell}>
                      <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading live installation records from server…
                    </td>
                  </tr>
                )}
                {!loading && filteredSites.length === 0 && (
                  <tr>
                    <td className="ax-table__td" colSpan={totalColumns} style={{ padding: 0 }}>
                      <TableEmptyState
                        title="No installation records found"
                        message={
                          hasFilters
                            ? 'No records match your filters or search. Try clearing your query.'
                            : tab === 'completed'
                            ? 'Completed sites will appear here once installation work is recorded via the installation form.'
                            : 'No payment stage sites available.'
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
                  const siteLabel = row.site_name || `Site #${row.id}`;

                  const panelImg = row.panel_image || row.solar_panel_photo;
                  const systemImg = row.system_image;
                  const inverterImg = row.inverter_image || row.inverter_photo;
                  const nmSmImg = row.nm_sm_image || row.netmeter_photo;
                  const logerImg = row.loger_image || row.loger_photo;

                  const ser = fmtSerials(row.panel_no || row.panel_serials);
                  const vStatus = Number(row.inst_verify_status ?? row.verify_status ?? 0);
                  const rawVerifyStr = String(row.inst_verify_status ?? row.verify_status ?? '').toLowerCase().trim();
                  const isVerifyApproved = vStatus === 1 || rawVerifyStr === '1' || rawVerifyStr === 'approved';
                  const cStatus = Number(row.inst_claim_status ?? row.claim_status ?? 0);

                  return (
                    <tr key={row.id} className="ax-table__row">
                      <td className="ax-table__td ax-num">{(currentPage - 1) * pageSize + index + 1}</td>
                      <td className="ax-table__td">{txt(row, 'state') || 'Jammu & Kashmir'}</td>
                      <td className="ax-table__td"><b>{txt(row, 'district') || DASH}</b></td>
                      <td className="ax-table__td">{txt(row, 'dept_name') || txt(row, 'department') || DASH}</td>
                      <td className="ax-table__td">
                        <span style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                          {row.site_name || DASH}
                        </span>
                      </td>
                      <td className="ax-table__td">{txt(row, 'location') || DASH}</td>
                      <td className="ax-table__td" style={monoCell}>{txt(row, 'ca_no') || DASH}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--asw-primary)' }}>
                        {row.sanction_load ? `${row.sanction_load} kW` : DASH}
                      </td>
                      <td className="ax-table__td">{txt(row, 'contact_person') || DASH}</td>
                      <td className="ax-table__td" style={monoCell}>{txt(row, 'contact_number') || DASH}</td>
                      <td className="ax-table__td" style={monoCell}>{txt(row, 'inverter_no') || DASH}</td>
                      <td className="ax-table__td" style={monoCell}>{txt(row, 'sim_no') || DASH}</td>
                      <td className="ax-table__td" style={monoCell}>{txt(row, 'solarmeter_no') || DASH}</td>
                      <td className="ax-table__td" style={monoCell}>{txt(row, 'nm_sm_no') || DASH}</td>
                      <td className="ax-table__td" style={monoCell}>{txt(row, 'loger_no') || DASH}</td>

                      {/* Panel serials */}
                      <td className="ax-table__td" style={{ ...monoCell, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {ser}
                      </td>

                      <td className="ax-table__td ax-num">{row.total_panels ?? row.panels_count ?? DASH}</td>

                      {/* Photo Thumbnails: Click-to-preview lightbox */}
                      <td className="ax-table__td">
                        <InstallationThumbnail
                          src={panelImg}
                          alt={`${siteLabel} - Panel Photo`}
                          onPreview={openPreview}
                        />
                      </td>
                      <td className="ax-table__td">
                        <InstallationThumbnail
                          src={systemImg}
                          alt={`${siteLabel} - System Photo`}
                          onPreview={openPreview}
                        />
                      </td>
                      <td className="ax-table__td">
                        <InstallationThumbnail
                          src={inverterImg}
                          alt={`${siteLabel} - Inverter Photo`}
                          onPreview={openPreview}
                        />
                      </td>
                      <td className="ax-table__td">
                        <InstallationThumbnail
                          src={nmSmImg}
                          alt={`${siteLabel} - Net Meter Photo`}
                          onPreview={openPreview}
                        />
                      </td>
                      <td className="ax-table__td">
                        <InstallationThumbnail
                          src={logerImg}
                          alt={`${siteLabel} - Loger Photo`}
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

                      <td className="ax-table__td" style={{ fontSize: '12px' }}>
                        {txt(row, 'inst_date') || txt(row, 'created_at') || DASH}
                      </td>

                      {/* Remarks */}
                      <td className="ax-table__td" style={{ maxWidth: 200, whiteSpace: 'normal', fontSize: '12px' }}>
                        {row.inst_remarks || row.remarks || DASH}
                      </td>

                      {/* Status Badges & Actions */}
                      {tab === 'completed' ? (
                        <>
                          <td className="ax-table__td" style={{ textAlign: 'center' }}>
                            <VerifyBadge value={vStatus} raw={row.inst_verify_status ?? row.verify_status} />
                          </td>
                          <td className="ax-table__td" style={{ textAlign: 'center' }}>
                            <ClaimBadge status={cStatus} />
                          </td>

                          {/* Action: Locked if Verified Approved, else Edit Button */}
                          <td className="ax-table__td" style={{ textAlign: 'center' }}>
                            {isVerifyApproved ? (
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
                                title="Installation Verified & Approved. Actions are locked."
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
                              <button
                                type="button"
                                className="ax-btn ax-btn--secondary ax-btn--xs"
                                onClick={() => handleOpenEdit(row.id)}
                                title="Edit installation details"
                              >
                                Edit
                              </button>
                            )}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="ax-table__td" style={{ textAlign: 'center' }}>
                            {Number(row.inst_pay80_status) === 1 ? (
                              <Badge tone="success">80% Disbursed</Badge>
                            ) : (
                              <Badge tone="warning">Pending</Badge>
                            )}
                          </td>
                          <td className="ax-table__td" style={{ textAlign: 'center' }}>
                            {Number(row.inst_pay20_status) === 1 ? (
                              <Badge tone="success">20% Disbursed</Badge>
                            ) : (
                              <Badge tone="neutral">Pending</Badge>
                            )}
                          </td>
                        </>
                      )}
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
    </div>

      {/* ── Photo Preview Modal (Zoom, Fullscreen, Open in Tab) ── */}
      {preview && <ImagePreviewModal url={preview.url} title={preview.title} onClose={closePreview} />}

      {/* ── Edit Site Details Modal (API 7 & API 8) ── */}
      <Modal open={editModalOpen} onClose={() => setEditModalOpen(false)} labelledBy="jammu-edit-title" dialogClass="ax-modal__dialog--lg">
        <form onSubmit={handleSaveEdit}>
          <div className="ax-modal__header">
            <div>
              <h4 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--ax-text-strong, #0f172a)' }} id="jammu-edit-title">
                Edit Installation Details
              </h4>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--ax-text-muted, #64748b)' }}>
                Site: <b>{editForm.site_name}</b> (#{editingId})
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
                <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading site specifications for edit…
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Contact info */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                  <div className="ax-modern-field">
                    <label className="ax-modern-label">
                      <span>Contact Person</span>
                      <span className="ax-modern-req">*</span>
                    </label>
                    <input
                      type="text"
                      className="ax-input"
                      value={editForm.contact_person}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, contact_person: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="ax-modern-field">
                    <label className="ax-modern-label">
                      <span>Contact Number</span>
                      <span className="ax-modern-req">*</span>
                    </label>
                    <input
                      type="tel"
                      className="ax-input"
                      value={editForm.contact_number}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, contact_number: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                {/* Equipment Numbers */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                  <div className="ax-modern-field">
                    <label className="ax-modern-label">
                      <span>Inverter Serial Number</span>
                      <span className="ax-modern-req">*</span>
                    </label>
                    <input
                      type="text"
                      className="ax-input"
                      value={editForm.inverter_no}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, inverter_no: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="ax-modern-field">
                    <label className="ax-modern-label">
                      <span>SIM Card Number</span>
                      <span className="ax-modern-req">*</span>
                    </label>
                    <input
                      type="text"
                      className="ax-input"
                      value={editForm.sim_no}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, sim_no: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="ax-modern-field">
                    <label className="ax-modern-label">
                      <span>Solar Meter Number</span>
                      <span className="ax-modern-req">*</span>
                    </label>
                    <input
                      type="text"
                      className="ax-input"
                      value={editForm.solarmeter_no}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, solarmeter_no: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="ax-modern-field">
                    <label className="ax-modern-label">
                      <span>Net Meter / Smart Meter Number</span>
                      <span className="ax-modern-req">*</span>
                    </label>
                    <input
                      type="text"
                      className="ax-input"
                      value={editForm.nm_sm_no}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, nm_sm_no: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="ax-modern-field">
                    <label className="ax-modern-label">
                      <span>RMS Loger Number</span>
                      <span className="ax-modern-req">*</span>
                    </label>
                    <input
                      type="text"
                      className="ax-input"
                      value={editForm.loger_no}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, loger_no: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                {/* Panel Serial Numbers */}
                <div className="ax-modern-field">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <label className="ax-modern-label">
                      <span>Panel Serial Numbers ({editForm.panel_no.length})</span>
                      <span className="ax-modern-req">*</span>
                    </label>
                    <button
                      type="button"
                      className="ax-btn ax-btn--secondary ax-btn--xs"
                      onClick={() => setEditForm((prev) => ({ ...prev, panel_no: [...prev.panel_no, ''] }))}
                    >
                      + Add Panel
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
                    {editForm.panel_no.map((p, pIdx) => (
                      <div key={pIdx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input
                          type="text"
                          className="ax-input"
                          style={{ flex: 1 }}
                          value={p}
                          placeholder={`Panel #${pIdx + 1}`}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditForm((prev) => {
                              const next = [...prev.panel_no];
                              next[pIdx] = val;
                              return { ...prev, panel_no: next };
                            });
                          }}
                          required={pIdx === 0}
                        />
                        {editForm.panel_no.length > 1 && (
                          <button
                            type="button"
                            className="ax-btn ax-btn--ghost ax-btn--xs"
                            style={{ color: '#ef4444', padding: '0 6px' }}
                            onClick={() => {
                              setEditForm((prev) => ({
                                ...prev,
                                panel_no: prev.panel_no.filter((_, idx) => idx !== pIdx),
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
                      value={editForm.latitude}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, latitude: e.target.value }))}
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
                      value={editForm.longitude}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, longitude: e.target.value }))}
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
                      value={editForm.remarks}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, remarks: e.target.value }))}
                      placeholder="Enter update remarks..."
                    />
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
    </div>
  );
}

export const ViewInstallation = InstallationDetails;
export default InstallationDetails;
