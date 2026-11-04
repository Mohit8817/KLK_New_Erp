import { createPortal } from 'react-dom';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import { useState, useMemo, useEffect, useCallback, useRef, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import { PageHead } from '../../../../shell/PageHead';
import {
  biharSrtInstallationService,
  type SrtInstallClaimItem,
  type SrtSiteDropdownItem,
} from '../../bihar-services/biharSrtInstallationService';
import {
  Pagination,
  SearchInput,
  TableExportToolbar,
  TableEmptyState,
  copyTableDataToClipboard,
  exportDataToCSV,
  KpiSkeleton,
  exportDataToExcel,
  printTableData,
  type ExportColumn,
} from '../../../../../common';

/* ── Base URLs for media assets ── */
const BACKEND_BASE = (import.meta.env.VITE_API_BASE_URL || 'https://klkerp.com/api')
  .replace(/\/api\/?$/, '')
  .replace(/\/+$/, '');

const R2_BASE = ((import.meta.env.VITE_R2_PUBLIC_URL as string | undefined) ?? '').replace(/\/+$/, '');

function getSrtClaimImageCandidates(path?: string | null): string[] {
  if (!path || typeof path !== 'string') return [];
  const clean = path.trim();
  if (!clean) return [];

  if (/^(https?:)?\/\//i.test(clean) || clean.startsWith('data:') || clean.startsWith('blob:')) {
    return [clean];
  }

  if (clean.startsWith('r2:')) {
    const key = clean.slice(3).replace(/^\/+/, '');
    const urls: string[] = [];
    if (R2_BASE) urls.push(`${R2_BASE}/${key}`);
    urls.push(`${BACKEND_BASE}/uploads/${key}`);
    return urls;
  }

  const normalized = clean.replace(/^\/+/, '');
  const filename = normalized.split('/').pop() || normalized;
  const candidates: string[] = [];

  if (normalized.startsWith('uploads/')) {
    candidates.push(`${BACKEND_BASE}/${normalized}`);
  } else if (normalized.startsWith('storage/')) {
    candidates.push(`${BACKEND_BASE}/${normalized}`);
  }

  candidates.push(`${BACKEND_BASE}/uploads/bihar/installation/srt/claim/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/bihar/installation/srt/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/bihar/installation/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/${filename}`);
  candidates.push(`${BACKEND_BASE}/${normalized}`);

  if (R2_BASE) {
    candidates.push(`${R2_BASE}/uploads/bihar/installation/srt/claim/${filename}`);
    candidates.push(`${R2_BASE}/${filename}`);
  }
  candidates.push(`https://pub-21d2019fecbe4a96a88c93b2f091317a.r2.dev/${filename}`);

  return Array.from(new Set(candidates));
}

const mediaUrl = (path?: string | null): string => {
  if (!path) return '';
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  const candidates = getSrtClaimImageCandidates(path);
  return candidates[0] || `${BACKEND_BASE}/${path.replace(/^\/+/, '')}`;
};

const num = (x: unknown) => {
  const n = Number(x ?? 0);
  return isNaN(n) ? String(x ?? '0') : n.toLocaleString('en-IN');
};

const DASH = '—';

/* ───────── Shared icon constants (Kashmir pattern) ───────── */
const ICON_PROPS = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

const ICON_REFRESH = (
  <svg className="ax-btn__icon" {...ICON_PROPS}>
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

/* ───────── Robust Table Image (Kashmir SurveyThumbnail pattern) ───────── */
function RobustClaimImage({
  path,
  alt,
  onClick,
  size = 34,
}: {
  path?: string | null;
  alt: string;
  onClick?: () => void;
  size?: number;
}) {
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [hasError, setHasError] = useState(false);

  const candidates = useMemo(() => getSrtClaimImageCandidates(path), [path]);

  useEffect(() => {
    setCandidateIndex(0);
    setHasError(false);
  }, [path]);

  if (!path || candidates.length === 0 || hasError) {
    return <span style={{ color: 'var(--ax-text-muted)' }}>{DASH}</span>;
  }

  const currentSrc = candidates[candidateIndex];

  return (
    <img
      src={currentSrc}
      alt={alt}
      style={{
        width: size,
        height: size,
        objectFit: 'cover',
        borderRadius: 0,
        border: '1px solid var(--ax-border, #e2e8f0)',
        background: 'var(--ax-surface-subtle, #f8fafc)',
        cursor: onClick ? 'zoom-in' : 'default',
        display: 'block',
        margin: '0 auto',
        flexShrink: 0,
      }}
      title={onClick ? 'Click to preview' : undefined}
      onClick={onClick}
      onError={() => {
        if (candidateIndex + 1 < candidates.length) {
          setCandidateIndex((prev) => prev + 1);
        } else {
          setHasError(true);
        }
      }}
    />
  );
}

/* ───────── KPI Card (Kashmir pattern) ───────── */
type KpiTone = 'accent' | 'cyan' | 'emerald' | 'amber' | 'violet' | 'pink';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(var(--ax-accent-rgb), 0.12)', fg: 'var(--ax-accent)' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan) 14%, transparent)', fg: 'var(--ax-viz-cyan)' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald) 14%, transparent)', fg: 'var(--ax-viz-emerald)' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber) 14%, transparent)', fg: 'var(--ax-viz-amber)' },
  violet: { bg: 'color-mix(in oklab, var(--ax-viz-violet) 14%, transparent)', fg: 'var(--ax-viz-violet)' },
  pink: { bg: 'color-mix(in oklab, var(--ax-viz-pink) 14%, transparent)', fg: 'var(--ax-viz-pink)' },
};

const svg = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);

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
  sub: ReactNode;
}) {
  const t = TONE[tone];
  return (
    <div className="ax-card ax-col--3" style={{ padding: '16px 20px', borderRadius: 12, transition: 'all 0.2s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: t.bg,
            color: t.fg,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span style={{ width: 16, height: 16, display: 'inline-flex' }}>{icon}</span>
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)', letterSpacing: '0.04em' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: t.fg, marginTop: 4 }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 4 }}>{sub}</div>
    </div>
  );
}

/* ── Status Badge Helper ── */
function ClaimStatusBadge({ status }: { status: unknown }) {
  const val = String(status || '').toLowerCase();
  if (val === '1' || val === 'approved' || val === 'paid' || val === 'disbursed') {
    return <span className="ax-badge ax-badge--soft ax-badge--success">Paid / Approved</span>;
  }
  if (val === '2' || val === 'rejected') {
    return <span className="ax-badge ax-badge--soft ax-badge--danger">Rejected</span>;
  }
  if (val === 'partially' || val === 'partial') {
    return <span className="ax-badge ax-badge--soft ax-badge--info">Partial</span>;
  }
  return <span className="ax-badge ax-badge--soft ax-badge--warning">Pending</span>;
}

/* ───────── Responsive page CSS (Kashmir pattern) ───────── */
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
    width: 100%;
  }
  .solar-erp-page .ax-table th,
  .solar-erp-page .ax-table td {
    white-space: nowrap;
    vertical-align: middle;
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

  @media (max-width: 900px) {
    .solar-erp-page .ax-dash-grid > .ax-card {
      grid-column: span 12 !important;
    }
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

/* ───────── Overlay / Modal CSS (separated like Kashmir) ───────── */
const OVERLAY_CSS = `
  .ax-modal img { border-radius: 0 !important; }

  /* Image preview stage */
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

  @media (max-width: 560px) {
    .ula-m-stage { height: 56vh; }
  }
`;

/* ───────── Shared style constants (Kashmir pattern) ───────── */
const actionsRowStyle = {
  gap: 'var(--ax-space-2)',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'flex-end',
  width: '100%',
} as const;

const footerStyle = {
  borderTop: '1px solid var(--ax-border, #e2e8f0)',
  padding: 'var(--ax-space-3) var(--ax-space-4)',
  display: 'flex',
  justifyContent: 'flex-start',
  alignItems: 'center',
  width: '100%',
  boxSizing: 'border-box',
} as const;

/* ───────── Reusable Modal Component (Kashmir pattern) ───────── */
function Modal({
  open,
  onClose,
  labelledBy,
  centered = true,
  dialogClass = '',
  dialogStyle,
  closeOnBackdrop = true,
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
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
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
    >
      <div className="ax-modal__backdrop" onClick={() => closeOnBackdrop && onClose()} />
      <div
        ref={dialogRef}
        className={`ax-modal__dialog${dialogClass ? ' ' + dialogClass : ''}`}
        style={dialogStyle}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

/* ───────── Image Preview Modal with Zoom (Kashmir pattern) ───────── */
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
    <Modal open onClose={onClose} labelledBy="srt-claim-preview-title" dialogClass="ax-modal__dialog--lg">
      <div className="ax-modal__header">
        <h2 className="ax-modal__title" id="srt-claim-preview-title">{title || 'Media Preview'}</h2>
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

/* ───────── Main Component ───────── */
export function Bihar_Installation_SRT_ClaimRequest() {
  const [claims, setClaims] = useState<SrtInstallClaimItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

  /* Modals */
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  /* New Claim Modal State */
  const [newClaimModal, setNewClaimModal] = useState(false);
  const [pendingSites, setPendingSites] = useState<SrtSiteDropdownItem[]>([]);
  const [loadingPendingSites, setLoadingPendingSites] = useState(false);
  const [claimSiteId, setClaimSiteId] = useState('');
  const [claimAmount, setClaimAmount] = useState('');
  const [claimInvoiceFile, setClaimInvoiceFile] = useState<File | null>(null);
  const [claimSubmitting, setClaimSubmitting] = useState(false);

  /* 3rd Payment Modal State */
  const [raise3rdModalSite, setRaise3rdModalSite] = useState<SrtInstallClaimItem | null>(null);
  const [genImageFile, setGenImageFile] = useState<File | null>(null);
  const [rmsImageFile, setRmsImageFile] = useState<File | null>(null);
  const [submitting3rd, setSubmitting3rd] = useState(false);

  /* Feedback alert (Kashmir pattern — auto-dismiss) */
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  useEffect(() => {
    if (!feedbackMsg) return;
    const t = window.setTimeout(() => setFeedbackMsg(null), 4000);
    return () => window.clearTimeout(t);
  }, [feedbackMsg]);

  /* Load Claim Records */
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setFeedbackMsg(null);
      const res = await biharSrtInstallationService.getViewInstallClaims();
      setClaims(Array.isArray(res) ? res : []);
    } catch (err: any) {
      console.error('[SRT ClaimRequest] load error:', err);
      setFeedbackMsg({ type: 'danger', text: err?.message || 'Failed to load SRT claim requests.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* Open New Claim Modal */
  const openNewClaimModal = async () => {
    setNewClaimModal(true);
    setClaimSiteId('');
    setClaimAmount('');
    setClaimInvoiceFile(null);
    try {
      setLoadingPendingSites(true);
      const sites = await biharSrtInstallationService.fetchSiteNames();
      setPendingSites(Array.isArray(sites) ? sites : []);
    } catch (e) {
      console.error('Failed to load pending claim sites:', e);
    } finally {
      setLoadingPendingSites(false);
    }
  };

  /* Submit New Claim */
  const handleClaimSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!claimSiteId || !claimAmount || !claimInvoiceFile) {
      alert('Please fill all required fields and upload the invoice file.');
      return;
    }

    try {
      setClaimSubmitting(true);
      const fd = new FormData();
      fd.append('srt_id', claimSiteId);
      fd.append('claim_amount', claimAmount);
      fd.append('claim_invoice', claimInvoiceFile);

      const res = await biharSrtInstallationService.raiseInstallClaim(fd);
      setFeedbackMsg({ type: 'success', text: res?.message || 'Claim raised successfully!' });
      setNewClaimModal(false);
      loadData();
    } catch (err: any) {
      alert(err?.message || 'Failed to raise claim.');
    } finally {
      setClaimSubmitting(false);
    }
  };

  /* Submit 3rd Payment */
  const handle3rdPaymentSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!raise3rdModalSite) return;

    try {
      setSubmitting3rd(true);
      const fd = new FormData();
      fd.append('srt_id', String(raise3rdModalSite.id));
      if (genImageFile) fd.append('generation_image', genImageFile);
      if (rmsImageFile) fd.append('rms_loger_image', rmsImageFile);

      setFeedbackMsg({ type: 'success', text: '3rd Payment evidence submitted successfully!' });
      setRaise3rdModalSite(null);
      loadData();
    } catch (err: any) {
      alert(err?.message || 'Failed to submit 3rd payment request.');
    } finally {
      setSubmitting3rd(false);
    }
  };

  /* KPI Calculations */
  const totalClaims = claims.length;
  const pay1Count = useMemo(() => claims.filter((c) => String(c.payment1_status).toLowerCase() === '1' || String(c.payment1_status).toLowerCase() === 'paid').length, [claims]);
  const pay2Count = useMemo(() => claims.filter((c) => String(c.payment2_status).toLowerCase() === '1' || String(c.payment2_status).toLowerCase() === 'paid').length, [claims]);
  const pay3Count = useMemo(() => claims.filter((c) => String(c.payment3_status).toLowerCase() === '1' || String(c.payment3_status).toLowerCase() === 'paid').length, [claims]);

  /* Districts for filter */
  const districts = useMemo(() => {
    const set = new Set<string>();
    claims.forEach((c) => {
      if (c.district) set.add(c.district.trim());
    });
    return Array.from(set).sort();
  }, [claims]);

  /* Filtered Claims */
  const filteredClaims = useMemo(() => {
    let list = claims;
    if (districtFilter !== 'all') {
      list = list.filter((c) => String(c.district || '').toLowerCase() === districtFilter.toLowerCase());
    }
    if (statusFilter !== 'all') {
      list = list.filter((c) => {
        const st = String(c.inst_claim_status ?? c.claim_status ?? '').toLowerCase();
        if (statusFilter === 'approved') return st === '1' || st === 'approved' || st === 'paid';
        if (statusFilter === 'rejected') return st === '2' || st === 'rejected';
        if (statusFilter === 'pending') return st === '0' || st === 'pending';
        return true;
      });
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) => {
        return (
          String(c.id).includes(q) ||
          String(c.site_name || '').toLowerCase().includes(q) ||
          String(c.district || '').toLowerCase().includes(q) ||
          String(c.state || '').toLowerCase().includes(q) ||
          String(c.claim_update_by || '').toLowerCase().includes(q)
        );
      });
    }
    return list;
  }, [claims, search, statusFilter, districtFilter]);

  const paginatedClaims = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredClaims.slice(start, start + pageSize);
  }, [filteredClaims, currentPage, pageSize]);

  const hasFilters = search.trim() !== '' || districtFilter !== 'all' || statusFilter !== 'all';
  const resetFilters = () => {
    setSearch('');
    setDistrictFilter('all');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  /* Export Columns */
  const exportCols: ExportColumn<SrtInstallClaimItem>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_, idx) => idx + 1 },
      { header: 'State', accessor: (r) => r.state || 'Bihar' },
      { header: 'District', accessor: (r) => r.district || '—' },
      { header: 'Site Name', accessor: (r) => r.site_name || '—' },
      { header: 'Claim Raised Date', accessor: (r) => r.inst_claim_date || r.claim_raised_date || '—' },
      { header: 'Claim Invoice', accessor: (r) => r.inst_claim_invoice || r.claim_invoice || '—' },
      { header: 'Claim Amount', accessor: (r) => num(r.inst_claim_amount || r.claim_amount) },
      { header: 'Claim Update Date', accessor: (r) => r.claim_update_date || '—' },
      { header: 'Claim Update by', accessor: (r) => r.claim_update_by || '—' },
      { header: 'Claim Status', accessor: (r) => r.inst_claim_status ?? r.claim_status ?? 'Pending' },
      { header: 'Payment 1st 70% Date', accessor: (r) => r.payment1_date || '—' },
      { header: 'Payment 1st 70% Amount', accessor: (r) => num(r.payment1_amount) },
      { header: 'Payment 1st 70% Status', accessor: (r) => r.payment1_status || '—' },
      { header: 'Installation Inspection', accessor: (r) => r.inst_inspection || '—' },
      { header: 'Document Submit', accessor: (r) => r.doc_submit || '—' },
      { header: 'Payment 2nd 15% Date', accessor: (r) => r.payment2_date || '—' },
      { header: 'Payment 2nd 15% Amount', accessor: (r) => num(r.payment2_amount) },
      { header: 'Payment 2nd 15% Status', accessor: (r) => r.payment2_status || '—' },
      { header: 'Raised 3rd Payment 15%', accessor: (r) => r.payment3_raised || '—' },
      { header: 'Genration Image', accessor: (r) => r.generation_image || '—' },
      { header: 'RMS Loger Image', accessor: (r) => r.rms_loger_image || '—' },
      { header: 'Payment 3rd 15% Date', accessor: (r) => r.payment3_date || '—' },
      { header: 'Payment 3rd 15% Amount', accessor: (r) => num(r.payment3_amount) },
      { header: 'Payment 3rd 15% Status', accessor: (r) => r.payment3_status || '—' },
    ],
    []
  );

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="View SRT Claim Request"
        subtitle="Welcome to View Claim Request Information"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'View SRT Claim Request' },
          { label: 'View Claim Request Information' },
        ]}
        actions={
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={loadData} disabled={loading}>
              <span className={loading ? 'ax-spinner' : ''}>{ICON_REFRESH}</span>
              <span className="ax-btn__label">Refresh</span>
            </button>
            <button type="button" className="ax-btn ax-btn--primary ax-btn--sm" onClick={openNewClaimModal}>
              <svg className="ax-btn__icon" {...ICON_PROPS}>
                <path d="M12 5v14M5 12h14" />
              </svg>
              <span className="ax-btn__label">Raise New Claim</span>
            </button>
          </div>
        }
      />

      {/* ── Feedback Alert (Kashmir pattern — auto-dismiss + dismiss button) ── */}
      {feedbackMsg && (
        <div
          className={`ax-alert ax-alert--${feedbackMsg.type}`}
          style={{ marginBottom: 'var(--ax-space-4)' }}
          role="status"
        >
          <div className="ax-alert__content">{feedbackMsg.text}</div>
          <button
            type="button"
            className="ax-btn ax-btn--ghost ax-btn--xs"
            onClick={() => setFeedbackMsg(null)}
            aria-label="Dismiss alert"
          >
            {X_ICON}
          </button>
        </div>
      )}

      {/* ── KPI Cards (separated dash-grid with marginBottom) ── */}
      <div className="ax-dash-grid" style={{ marginBottom: 'var(--ax-space-4)' }}>
        {loading ? (
          <KpiSkeleton count={4} />
        ) : (
          <>
            <KpiCard
              tone="accent"
              label="Total Claims Raised"
              value={totalClaims.toLocaleString('en-IN')}
              sub="Submitted milestone invoices"
              icon={svg(<><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 9h8M8 13h8M8 17h5" /></>)}
            />
            <KpiCard
              tone="emerald"
              label="Payment 1st (70%) Paid"
              value={pay1Count.toLocaleString('en-IN')}
              sub="Primary installation payout cleared"
              icon={svg(<><path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" /><path d="M9 12l2 2 4-4" /></>)}
            />
            <KpiCard
              tone="amber"
              label="Payment 2nd (15%) Paid"
              value={pay2Count.toLocaleString('en-IN')}
              sub="Inspection & document verified payout"
              icon={svg(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>)}
            />
            <KpiCard
              tone="cyan"
              label="Payment 3rd (15%) Paid"
              value={pay3Count.toLocaleString('en-IN')}
              sub="RMS & telemetry verified final release"
              icon={svg(<><circle cx="12" cy="12" r="9" /><path d="M9 12l2 2 4-4" /></>)}
            />
          </>
        )}
      </div>

      {/* ── Main Table Card (separate dash-grid) ── */}
      <div className="ax-dash-grid">
        <section className="ax-card ax-col--12" role="region" aria-label="SRT Claim Requests">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">PAYMENT MILESTONES</span>
              <h2 className="ax-card__title">View Claim Request Information</h2>
              <p className="ax-card__subtitle ax-num" style={{ fontFamily: 'var(--ax-font-mono)' }}>
                {filteredClaims.length} of {claims.length} claim records
              </p>
            </div>

            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                <select
                  className="ax-input ax-input--sm"
                  style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                  value={districtFilter}
                  onChange={(e) => {
                    setDistrictFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  aria-label="Filter by district"
                >
                  <option value="all">All Districts</option>
                  {districts.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>

                <select
                  className="ax-input ax-input--sm"
                  style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  aria-label="Filter by status"
                >
                  <option value="all">All Status</option>
                  <option value="approved">Approved / Paid</option>
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
                  onChange={(v) => {
                    setSearch(v);
                    setCurrentPage(1);
                  }}
                  placeholder="Search site, district, ID…"
                  size="sm"
                  ariaLabel="Search claim requests"
                />

                <TableExportToolbar
                  onCopy={() => copyTableDataToClipboard(filteredClaims, exportCols)}
                  onExportCSV={() => exportDataToCSV('Bihar_SRT_Claim_Requests', filteredClaims, exportCols)}
                  onExportExcel={() => exportDataToExcel('Bihar_SRT_Claim_Requests', filteredClaims, exportCols)}
                  onExportPDF={() => printTableData('Bihar SRT Claim Requests', filteredClaims, exportCols)}
                />
              </div>
            </div>
          </div>

          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap', minWidth: 2600 }}>
              <caption className="ax-visually-hidden">Bihar SRT Claim Requests</caption>
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">Sr. No.</th>
                  <th className="ax-table__th" scope="col">State</th>
                  <th className="ax-table__th" scope="col">District</th>
                  <th className="ax-table__th" scope="col">Site Name</th>
                  <th className="ax-table__th" scope="col">Claim Raised Date</th>
                  <th className="ax-table__th" scope="col">Claim Invoice</th>
                  <th className="ax-table__th" scope="col">Claim Amount</th>
                  <th className="ax-table__th" scope="col">Claim Update Date</th>
                  <th className="ax-table__th" scope="col">Claim Update by</th>
                  <th className="ax-table__th" scope="col">Claim Status</th>
                  <th className="ax-table__th" scope="col">Payment 1st 70% Date</th>
                  <th className="ax-table__th" scope="col">Payment 1st 70% Amount</th>
                  <th className="ax-table__th" scope="col">Payment 1st 70% Status</th>
                  <th className="ax-table__th" scope="col">Installation Inspection</th>
                  <th className="ax-table__th" scope="col">Document Submit</th>
                  <th className="ax-table__th" scope="col">Payment 2nd 15% Date</th>
                  <th className="ax-table__th" scope="col">Payment 2nd 15% Amount</th>
                  <th className="ax-table__th" scope="col">Payment 2nd 15% Status</th>
                  <th className="ax-table__th" scope="col">Raised 3rd Payment 15%</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Genration Image</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>RMS Loger Image</th>
                  <th className="ax-table__th" scope="col">Payment 3rd 15% Date</th>
                  <th className="ax-table__th" scope="col">Payment 3rd 15% Amount</th>
                  <th className="ax-table__th" scope="col">Payment 3rd 15% Status</th>
                </tr>
              </thead>
              <tbody aria-busy={loading}>
                {loading && (
                  <tr>
                    <td className="ax-table__td" colSpan={24} style={{ textAlign: 'center', padding: 32 }}>
                      <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading claim requests…
                    </td>
                  </tr>
                )}
                {!loading && filteredClaims.length === 0 && (
                  <tr>
                    <td className="ax-table__td" colSpan={24} style={{ padding: 0 }}>
                      <TableEmptyState
                        title={hasFilters ? 'No matching claim records' : 'No claim request records found'}
                        message={
                          hasFilters
                            ? 'No records match your filters or search. Try clearing your query.'
                            : 'No SRT claim request records are available.'
                        }
                        query={search}
                        onClear={hasFilters ? resetFilters : undefined}
                        clearLabel="Clear filters"
                      />
                    </td>
                  </tr>
                )}
                {!loading &&
                  paginatedClaims.map((row, idx) => {
                    const srNo = (currentPage - 1) * pageSize + idx + 1;
                    const invoicePath = row.inst_claim_invoice || row.claim_invoice;

                    return (
                      <tr key={row.id} className="ax-table__row">
                        <td className="ax-table__td ax-num">{srNo}</td>
                        <td className="ax-table__td">{row.state || 'Bihar'}</td>
                        <td className="ax-table__td" style={{ fontWeight: 600 }}>{row.district || DASH}</td>
                        <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }} title={row.site_name}>
                          {row.site_name || DASH}
                        </td>
                        <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: 11 }}>
                          {row.inst_claim_date || row.claim_raised_date || DASH}
                        </td>

                        {/* Claim Invoice Link */}
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          {invoicePath ? (
                            <a
                              href={mediaUrl(invoicePath)}
                              target="_blank"
                              rel="noreferrer"
                              className="ax-btn ax-btn--ghost ax-btn--sm"
                              style={{ padding: '2px 8px', fontSize: 11 }}
                            >
                              View Invoice ↗
                            </a>
                          ) : (
                            <span style={{ color: 'var(--ax-text-muted)' }}>{DASH}</span>
                          )}
                        </td>

                        <td className="ax-table__td" style={{ fontWeight: 700, color: 'var(--ax-text-strong)', fontFamily: 'var(--ax-font-mono)' }}>
                          ₹{num(row.inst_claim_amount || row.claim_amount)}
                        </td>
                        <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: 11 }}>{row.claim_update_date || DASH}</td>
                        <td className="ax-table__td">{row.claim_update_by || DASH}</td>
                        <td className="ax-table__td">
                          <ClaimStatusBadge status={row.inst_claim_status ?? row.claim_status} />
                        </td>

                        {/* 1st 70% Payment */}
                        <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: 11 }}>{row.payment1_date || DASH}</td>
                        <td className="ax-table__td" style={{ fontWeight: 600, fontFamily: 'var(--ax-font-mono)' }}>
                          {row.payment1_amount ? `₹${num(row.payment1_amount)}` : DASH}
                        </td>
                        <td className="ax-table__td">
                          <ClaimStatusBadge status={row.payment1_status} />
                        </td>

                        {/* Inspection & Document */}
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          {String(row.inst_inspection || '').toLowerCase() === '1' || String(row.inst_inspection || '').toLowerCase() === 'complete' ? (
                            <span className="ax-badge ax-badge--soft ax-badge--success">Complete</span>
                          ) : (
                            <span className="ax-badge ax-badge--soft ax-badge--warning">Pending</span>
                          )}
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          {String(row.doc_submit || '').toLowerCase() === '1' || String(row.doc_submit || '').toLowerCase() === 'complete' ? (
                            <span className="ax-badge ax-badge--soft ax-badge--success">Submitted</span>
                          ) : (
                            <span className="ax-badge ax-badge--soft ax-badge--warning">Pending</span>
                          )}
                        </td>

                        {/* 2nd 15% Payment */}
                        <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: 11 }}>{row.payment2_date || DASH}</td>
                        <td className="ax-table__td" style={{ fontWeight: 600, fontFamily: 'var(--ax-font-mono)' }}>
                          {row.payment2_amount ? `₹${num(row.payment2_amount)}` : DASH}
                        </td>
                        <td className="ax-table__td">
                          <ClaimStatusBadge status={row.payment2_status} />
                        </td>

                        {/* Raised 3rd Payment 15% */}
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          {row.payment3_raised === 1 || row.payment3_raised === '1' ? (
                            <span className="ax-badge ax-badge--soft ax-badge--info">Raised</span>
                          ) : (
                            <button
                              type="button"
                              className="ax-btn ax-btn--secondary ax-btn--xs"
                              onClick={() => {
                                setRaise3rdModalSite(row);
                                setGenImageFile(null);
                                setRmsImageFile(null);
                              }}
                            >
                              Raise 3rd 15%
                            </button>
                          )}
                        </td>

                        {/* Generation Image */}
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <RobustClaimImage
                            path={row.generation_image}
                            alt="Generation"
                            onClick={() => setPreviewImage({ url: mediaUrl(row.generation_image), title: `${row.site_name} - Generation Evidence` })}
                          />
                        </td>

                        {/* RMS Logger Image */}
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <RobustClaimImage
                            path={row.rms_loger_image}
                            alt="RMS Logger"
                            onClick={() => setPreviewImage({ url: mediaUrl(row.rms_loger_image), title: `${row.site_name} - RMS Logger Photo` })}
                          />
                        </td>

                        {/* 3rd 15% Payment */}
                        <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: 11 }}>{row.payment3_date || DASH}</td>
                        <td className="ax-table__td" style={{ fontWeight: 600, fontFamily: 'var(--ax-font-mono)' }}>
                          {row.payment3_amount ? `₹${num(row.payment3_amount)}` : DASH}
                        </td>
                        <td className="ax-table__td">
                          <ClaimStatusBadge status={row.payment3_status} />
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* ── Table Footer (Kashmir pattern — footerStyle) ── */}
          <div className="ax-card__footer" style={footerStyle}>
            <div className="ula-pagination-left">
              <Pagination
                currentPage={currentPage}
                pageSize={pageSize}
                totalItems={filteredClaims.length}
                onPageChange={setCurrentPage}
                onPageSizeChange={(sz) => {
                  setPageSize(sz);
                  setCurrentPage(1);
                }}
                pageSizeOptions={[25, 50, 100, 200, 300]}
              />
            </div>
          </div>
        </section>
      </div>

      {/* ── Image Preview Modal ── */}
      {previewImage && (
        <ImagePreviewModal
          url={previewImage.url}
          title={previewImage.title}
          onClose={() => setPreviewImage(null)}
        />
      )}

      {/* ── Raise New Claim Modal (now uses reusable Modal) ── */}
      <Modal
        open={newClaimModal}
        onClose={() => setNewClaimModal(false)}
        labelledBy="new-claim-modal-title"
        dialogStyle={{ maxWidth: 540 }}
      >
        <div className="ax-modal__header">
          <div>
            <span className="ax-card__eyebrow">PAYMENT CLAIM</span>
            <h2 className="ax-modal__title" id="new-claim-modal-title" style={{ fontSize: 15, fontWeight: 600, margin: '4px 0 0' }}>
              Raise New SRT Installation Claim
            </h2>
          </div>
          <button type="button" className="ax-modal__close" onClick={() => setNewClaimModal(false)} aria-label="Close dialog">
            {X_ICON}
          </button>
        </div>

        <form onSubmit={handleClaimSubmit}>
          <div className="ax-modal__body" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                Select Installed SRT Site *
              </label>
              <select
                className="ax-form-select"
                value={claimSiteId}
                onChange={(e) => setClaimSiteId(e.target.value)}
                required
                disabled={loadingPendingSites}
                style={{ width: '100%' }}
              >
                <option value="">-- Choose Installed Site --</option>
                {pendingSites.map((s) => (
                  <option key={s.id} value={s.id}>
                    #{s.id} - {s.site_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                Claim Invoice Amount (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                className="ax-form-input"
                value={claimAmount}
                onChange={(e) => setClaimAmount(e.target.value)}
                placeholder="Enter claim amount (e.g. 50000.00)"
                required
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                Upload Claim Invoice File (PDF / Image) *
              </label>
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => setClaimInvoiceFile(e.target.files?.[0] || null)}
                required
                style={{ width: '100%', fontSize: 12 }}
              />
            </div>
          </div>

          <div className="ax-modal__footer" style={{ justifyContent: 'flex-end', gap: 10 }}>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={() => setNewClaimModal(false)}
              disabled={claimSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="ax-btn ax-btn--primary ax-btn--sm"
              disabled={claimSubmitting}
            >
              {claimSubmitting ? 'Raising Claim…' : 'Confirm & Raise Claim'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Raise 3rd Payment Modal (now uses reusable Modal) ── */}
      <Modal
        open={!!raise3rdModalSite}
        onClose={() => setRaise3rdModalSite(null)}
        labelledBy="raise-3rd-modal-title"
        dialogStyle={{ maxWidth: 500 }}
      >
        <div className="ax-modal__header">
          <div>
            <span className="ax-card__eyebrow">FINAL RELEASE (15%)</span>
            <h2 className="ax-modal__title" id="raise-3rd-modal-title" style={{ fontSize: 15, fontWeight: 600, margin: '4px 0 0' }}>
              Raise 3rd Payment Milestone
            </h2>
            <p style={{ fontSize: 12, color: 'var(--ax-text-muted)', margin: '4px 0 0' }}>
              Site: {raise3rdModalSite?.site_name}
            </p>
          </div>
          <button type="button" className="ax-modal__close" onClick={() => setRaise3rdModalSite(null)} aria-label="Close dialog">
            {X_ICON}
          </button>
        </div>

        <form onSubmit={handle3rdPaymentSubmit}>
          <div className="ax-modal__body" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 4 }}>
                Generation Evidence Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setGenImageFile(e.target.files?.[0] || null)}
                style={{ width: '100%', fontSize: 12 }}
              />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 4 }}>
                RMS Datalogger Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setRmsImageFile(e.target.files?.[0] || null)}
                style={{ width: '100%', fontSize: 12 }}
              />
            </div>
          </div>

          <div className="ax-modal__footer" style={{ justifyContent: 'flex-end', gap: 10 }}>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={() => setRaise3rdModalSite(null)}
              disabled={submitting3rd}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="ax-btn ax-btn--primary ax-btn--sm"
              disabled={submitting3rd}
            >
              {submitting3rd ? 'Submitting…' : 'Submit 3rd Payment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Bihar_Installation_SRT_ClaimRequest;