import { useState, useMemo, useEffect, useCallback, useRef, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  jammuSrt70mwService,
  getJammuMediaCandidates,
  resolveJammuMediaUrl,
  type JammuClaimItem,
  type JammuInstallableSiteName,
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

const ClaimStatusBadge = ({ status }: { status?: number }) => {
  const s = Number(status ?? 0);
  if (s === 2) return <Badge tone="success">Approved</Badge>;
  if (s === 3) return <Badge tone="danger">Rejected</Badge>;
  if (s === 1) return <Badge tone="info">Raised (Pending Audit)</Badge>;
  return <Badge tone="neutral">Not Raised</Badge>;
};

const DocBadge = ({ status, docUrl }: { status?: number; docUrl?: string }) => {
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
            title="View handover document"
          >
            ↗
          </a>
        )}
      </span>
    );
  }
  if (s === 3) return <Badge tone="danger">Rejected</Badge>;
  if (s === 1 || docUrl) {
    return (
      <span className="ax-cluster" style={{ gap: 4, justifyContent: 'center' }}>
        <Badge tone="info">Submitted (Pending)</Badge>
        {docUrl && (
          <a
            href={docUrl}
            target="_blank"
            rel="noreferrer"
            className="ax-btn ax-btn--ghost ax-btn--xs"
            style={{ padding: '2px 4px', fontSize: 11, color: '#2563eb' }}
            title="View handover document"
          >
            ↗
          </a>
        )}
      </span>
    );
  }
  return <Badge tone="neutral">Not Submitted</Badge>;
};

const txt = (row: any, key: string): string => {
  const v = row?.[key];
  if (v === null || v === undefined || v === '') return '';
  return String(v);
};

/* ───────── Modal Component (Design System dialog with FocusTrap & Portal) ───────── */
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
    <Modal open onClose={onClose} labelledBy="claim-preview-title" dialogClass="ax-modal__dialog--lg">
      <div className="ax-modal__header">
        <h2 className="ax-modal__title" id="claim-preview-title">{title || 'Invoice Preview'}</h2>
        <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">{X_ICON}</button>
      </div>

      <div className="ax-modal__body" style={{ padding: 0 }}>
        <div className="ula-m-stage">
          {status === 'loading' && (
            <div className="ula-m-stage__msg"><span className="ax-spinner" /> Loading invoice…</div>
          )}
          {status === 'error' && (
            <div className="ula-m-stage__msg">Invoice document could not be previewed. Try opening it in a new tab.</div>
          )}
          <img
            key={url}
            src={url}
            alt={title || 'Invoice'}
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
      title="Click to preview invoice"
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

  /* Modern Dropzone */
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

// Table Column Headers
const CLAIM_HEADERS = [
  'Sr. No.',
  'State',
  'District',
  'Site Name',
  'Site Code',
  'Claim Amount (₹)',
  'Claim Date',
  'Invoice File',
  'Document Status',
  'Disbursal Status',
  'Action',
];

export function ClaimRequest() {
  const [claims, setClaims] = useState<JammuClaimItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [districtFilter, setDistrictFilter] = useState<string>('all');

  // Notification Toast
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  useEffect(() => {
    if (!toastMsg) return;
    const t = window.setTimeout(() => setToastMsg(null), 4000);
    return () => window.clearTimeout(t);
  }, [toastMsg]);

  // Invoice preview lightbox modal
  const [preview, setPreview] = useState<{ url: string; title: string } | null>(null);
  const openPreview = useCallback((url: string, title: string) => setPreview({ url, title }), []);
  const closePreview = useCallback(() => setPreview(null), []);

  // Raise Claim Modal State
  const [raiseModalOpen, setRaiseModalOpen] = useState<boolean>(false);
  const [submittingClaim, setSubmittingClaim] = useState<boolean>(false);
  const [sitesDropdown, setSitesDropdown] = useState<JammuInstallableSiteName[]>([]);
  const [loadingSites, setLoadingSites] = useState<boolean>(false);

  // Form Fields for Raise Claim
  const [selectedSrtId, setSelectedSrtId] = useState<string>('');
  const [claimAmount, setClaimAmount] = useState<string>('');
  const [claimInvoiceFile, setClaimInvoiceFile] = useState<File | null>(null);
  const [claimRemarks, setClaimRemarks] = useState<string>('');
  const [claimError, setClaimError] = useState<string | null>(null);
  const claimFileRef = useRef<HTMLInputElement>(null);

  const closeRaiseModal = useCallback(() => {
    setRaiseModalOpen(false);
    setSelectedSrtId('');
    setClaimAmount('');
    setClaimInvoiceFile(null);
    setClaimRemarks('');
    setClaimError(null);
    if (claimFileRef.current) claimFileRef.current.value = '';
  }, []);

  // Load claims from API 11: GET /Jammu/srt70mw/view-claim-request
  const loadClaims = useCallback(async () => {
    setLoading(true);
    try {
      const data = await jammuSrt70mwService.getClaimRequests();
      setClaims(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('[Jammu SRT Claims] load error:', err);
      setClaims([]);
      setToastMsg({ type: 'danger', text: err?.message || 'Failed to load claims register from server.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClaims();
  }, [loadClaims]);

  // Open Raise Claim Modal and fetch eligible sites
  const handleOpenRaiseModal = async () => {
    setRaiseModalOpen(true);
    setLoadingSites(true);
    setClaimError(null);
    try {
      const siteNames = await jammuSrt70mwService.getInstallableSiteNames();
      setSitesDropdown(Array.isArray(siteNames) ? siteNames : []);
    } catch (err: any) {
      console.error('[Jammu SRT Claims] fetch sites error:', err);
      setSitesDropdown([]);
    } finally {
      setLoadingSites(false);
    }
  };

  // Submit Claim Request (API 10: POST /jammu/srt70mw/installation-claim-raise)
  const handleRaiseClaimSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedSrtId) {
      setClaimError('Please select a site to raise a milestone claim.');
      return;
    }
    const numAmt = Number(claimAmount);
    if (!claimAmount || isNaN(numAmt) || numAmt <= 0) {
      setClaimError('Please enter a valid claim amount in INR (minimum ₹ 1).');
      return;
    }
    if (!claimInvoiceFile) {
      setClaimError('Please upload the certified milestone tax invoice file (JPG, PNG, PDF).');
      return;
    }

    setSubmittingClaim(true);
    setClaimError(null);

    try {
      const fd = new FormData();
      fd.append('srt_id', selectedSrtId);
      fd.append('claim_amount', String(numAmt));
      fd.append('claim_invoice', claimInvoiceFile);
      if (claimRemarks.trim()) {
        fd.append('remarks', claimRemarks.trim());
      }

      const res = await jammuSrt70mwService.raiseClaim(fd);

      setToastMsg({
        type: 'success',
        text: res.message || 'Milestone claim request submitted successfully! Dispatched for department audit.',
      });

      closeRaiseModal();
      await loadClaims();
    } catch (err: any) {
      console.error('[Jammu SRT RaiseClaim] error:', err);
      setClaimError(err?.message || 'Failed to raise claim. Note: Claims can only be raised 7 days after installation.');
    } finally {
      setSubmittingClaim(false);
    }
  };

  // Submit Document Modal State (API 9: GET /jammu/srt70mw/installation-submit-document?srt_id={srt_id})
  const [docModalSite, setDocModalSite] = useState<JammuClaimItem | null>(null);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docDate, setDocDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [docRemarks, setDocRemarks] = useState<string>('');
  const [docSubmitting, setDocSubmitting] = useState<boolean>(false);
  const [docError, setDocError] = useState<string | null>(null);
  const docFileRef = useRef<HTMLInputElement>(null);

  const handleOpenDocModal = useCallback((claim: JammuClaimItem) => {
    setDocModalSite(claim);
    setDocFile(null);
    setDocDate(new Date().toISOString().slice(0, 10));
    setDocRemarks('');
    setDocError(null);
  }, []);

  const closeDocModal = useCallback(() => {
    setDocModalSite(null);
    setDocFile(null);
    setDocRemarks('');
    setDocError(null);
    if (docFileRef.current) docFileRef.current.value = '';
  }, []);

  // Submit Document Form (API 9)
  const handleDocSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!docModalSite) return;
    setDocError(null);
    setDocSubmitting(true);
    try {
      const siteId = docModalSite.srt_id || docModalSite.id;
      const res = await jammuSrt70mwService.submitDocument(siteId);

      setToastMsg({
        type: 'success',
        text: res.message || `Installation Document submitted successfully for "${docModalSite.site_name}"!`,
      });

      // Optimistically update document status to Submitted (Pending)
      setClaims((prev) =>
        prev.map((c) =>
          c.id === docModalSite.id || c.srt_id === siteId
            ? { ...c, inst_doc_submit: 1, document_status: 1 }
            : c
        )
      );

      closeDocModal();
      await loadClaims();
    } catch (err: any) {
      console.error('[Jammu SRT SubmitDoc] error:', err);
      setDocError(err?.message || 'Failed to submit installation document. Please verify connection.');
    } finally {
      setDocSubmitting(false);
    }
  };

  // KPI Calculations
  const kpis = useMemo(() => {
    const totalCount = claims.length;
    let totalAmount = 0;
    let approvedCount = 0;
    let approvedAmount = 0;
    let pendingCount = 0;
    let pendingAmount = 0;

    claims.forEach((c) => {
      const amt = Number(c.inst_claim_amount) || 0;
      totalAmount += amt;
      if (Number(c.inst_claim_status) === 2) {
        approvedCount++;
        approvedAmount += amt;
      } else {
        pendingCount++;
        pendingAmount += amt;
      }
    });

    return {
      totalCount,
      totalAmount,
      approvedCount,
      approvedAmount,
      pendingCount,
      pendingAmount,
    };
  }, [claims]);

  // Distinct Districts
  const distinctDistricts = useMemo(() => {
    const list = claims.map((c) => c.district).filter(Boolean) as string[];
    return Array.from(new Set(list));
  }, [claims]);

  // Filtered List
  const filteredClaims = useMemo(() => {
    let list = claims;

    if (districtFilter !== 'all') {
      list = list.filter((c) => c.district === districtFilter);
    }

    if (statusFilter === 'approved') {
      list = list.filter((c) => Number(c.inst_claim_status) === 2);
    } else if (statusFilter === 'pending') {
      list = list.filter((c) => Number(c.inst_claim_status) === 1 || Number(c.inst_claim_status) === 0);
    } else if (statusFilter === 'rejected') {
      list = list.filter((c) => Number(c.inst_claim_status) === 3);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((item) => {
        const amtStr = String(item.inst_claim_amount || '');
        return (
          String(item.id).includes(q) ||
          txt(item, 'site_name').toLowerCase().includes(q) ||
          txt(item, 'district').toLowerCase().includes(q) ||
          txt(item, 'site_code').toLowerCase().includes(q) ||
          amtStr.includes(q)
        );
      });
    }

    return list;
  }, [claims, search, statusFilter, districtFilter]);

  const { paginatedData, currentPage, pageSize, totalItems, setPage, setPageSize } =
    usePagination({ data: filteredClaims, initialPageSize: 100 });

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, districtFilter]);

  const hasFilters = search.trim() !== '' || statusFilter !== 'all' || districtFilter !== 'all';
  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setDistrictFilter('all');
    setPage(1);
  };

  // Export Columns definition
  const exportCols: ExportColumn<JammuClaimItem>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r, idx?: number) => (idx !== undefined ? idx + 1 : '') } as any,
      { header: 'State', accessor: () => 'Jammu & Kashmir' },
      { header: 'District', accessor: (r) => txt(r, 'district') },
      { header: 'Site Name', accessor: (r) => txt(r, 'site_name') },
      { header: 'Site Code', accessor: (r) => txt(r, 'site_code') },
      { header: 'Claim Amount (₹)', accessor: (r) => `₹ ${Number(r.inst_claim_amount || 0).toLocaleString('en-IN')}` },
      { header: 'Claim Date', accessor: (r) => txt(r, 'inst_claim_date') },
      { header: 'Invoice File', accessor: (r) => txt(r, 'inst_claim_invoice') },
      {
        header: 'Document Status',
        accessor: (r) => {
          const s = Number(r.inst_doc_submit ?? r.document_status ?? 0);
          if (s === 2) return 'Approved';
          if (s === 3) return 'Rejected';
          if (s === 1 || r.inst_doc) return 'Submitted (Pending)';
          return 'Not Submitted';
        },
      },
      {
        header: 'Disbursal Status',
        accessor: (r) =>
          Number(r.inst_claim_status) === 2
            ? 'Approved / Disbursed'
            : Number(r.inst_claim_status) === 1
            ? 'Raised (Pending Audit)'
            : Number(r.inst_claim_status) === 3
            ? 'Rejected'
            : 'Draft',
      },
    ],
    []
  );

  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = 'Jammu_SRT_70MW_Claim_Requests';
  const fileTitle = 'Jammu SRT 70MW Claim Requests Register';

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

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* ── Page Head matching reference ── */}
      <PageHead
        title="Jammu SRT 70MW - Claim Request"
        subtitle="Submit installation subsidy and milestone claim requisitions, upload verified tax invoices, and track disbursal status"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Jammu & Kashmir' },
          { label: 'Installation' },
          { label: 'SRT 70MW' },
          { label: 'Claim Request' },
        ]}
        actions={
          <button
            type="button"
            className="ax-btn ax-btn--primary ax-btn--sm"
            onClick={handleOpenRaiseModal}
          >
            <span className="ax-btn__label">+ Raise New Claim</span>
          </button>
        }
      />

      {toastMsg && (
        <div className={`ax-alert ax-alert--${toastMsg.type}`} style={{ marginBottom: 'var(--ax-space-4)' }} role="status">
          <div className="ax-alert__title">{toastMsg.type === 'success' ? 'Success' : 'Error'}</div>
          <div className="ax-alert__text">{toastMsg.text}</div>
        </div>
      )}

      {/* ── 7-Day Policy Warning Banner ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 18px',
          background: '#fffbeb',
          border: '1px solid #fef3c7',
          borderRadius: 10,
          marginBottom: 'var(--ax-space-5, 20px)',
          fontSize: '13px',
          color: '#92400e',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <div>
          <b>Important Disbursal Policy:</b> As per Jammu SRT 70MW guidelines, milestone claim requests can only be raised <b>7 days after</b> physical site installation and completion verification approval.
        </div>
      </div>

      {/* ── Top Metric KPI Cards (4 cards in 1 row) ── */}
      <div className="asw-cards-row">
        <KpiCard
          tone="accent"
          label="Total Claims"
          value={kpis.totalCount.toLocaleString('en-IN')}
          sub="Requisitions submitted"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <path d="M8 9h8M8 13h8M8 17h5" />
            </svg>
          }
        />

        <KpiCard
          tone="emerald"
          label="Claims Approved"
          value={kpis.approvedCount.toLocaleString('en-IN')}
          sub={`₹ ${kpis.approvedAmount.toLocaleString('en-IN')}`}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          }
        />

        <KpiCard
          tone="cyan"
          label="Pending Audit"
          value={kpis.pendingCount.toLocaleString('en-IN')}
          sub={`₹ ${kpis.pendingAmount.toLocaleString('en-IN')}`}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <polyline points="12 7 12 12 15 15" />
            </svg>
          }
        />

        <KpiCard
          tone="violet"
          label="Total Amount"
          value={`₹ ${kpis.totalAmount.toLocaleString('en-IN')}`}
          sub={`${kpis.totalCount} claims registered`}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
        />
      </div>

      {/* ── Main Table Card ── */}
      <section className="ax-card ax-col--12" role="region" aria-label="Jammu SRT 70MW Claim Requisitions">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">Claim Requisition Register</h2>
            <p className="ax-card__subtitle">
              <span className="ax-num">{filteredClaims.length}</span> of <span className="ax-num">{claims.length}</span> claims
              {' '}· Approved <b className="ax-num">{kpis.approvedCount}</b> · Pending <b className="ax-num">{kpis.pendingCount}</b>
            </p>
          </div>

          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              {/* District Filter */}
              {distinctDistricts.length > 0 && (
                <select
                  id="claim_district_filter"
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

              {/* Status Filter */}
              <select
                id="claim_status_filter"
                className="ax-input ax-input--sm"
                style={{ width: 130, height: 32, fontSize: 'var(--ax-text-xs)' }}
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                aria-label="Filter by claim status"
              >
                <option value="all">All Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending Audit</option>
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
                placeholder="Search site, code, district, amount…"
                size="sm"
                ariaLabel="Search claim requisitions"
              />

              <TableExportToolbar
                onCopy={() => copyToClipboard(filteredClaims, exportCols)}
                onExportCSV={() => exportToCSV(filteredClaims, exportCols, `${fileBase}_${stamp}`)}
                onExportExcel={() => exportToExcel(filteredClaims, exportCols, `${fileBase}_${stamp}`)}
                onExportPDF={() => exportToPDF(filteredClaims, exportCols, fileTitle)}
              />
            </div>
          </div>
        </div>

        <div className="ax-table-wrap">
          <table
            className="ax-table ax-table--hover ula-table--wide"
            style={{ whiteSpace: 'nowrap', minWidth: 1200 }}
          >
            <caption className="ax-visually-hidden">Jammu SRT 70MW Claim Requisitions</caption>
            <thead className="ax-table__head">
              <tr>
                {CLAIM_HEADERS.map((h) => (
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
                  <td className="ax-table__td" colSpan={CLAIM_HEADERS.length} style={centerCell}>
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading claims from server…
                  </td>
                </tr>
              )}
              {!loading && filteredClaims.length === 0 && (
                <tr>
                  <td className="ax-table__td" colSpan={CLAIM_HEADERS.length} style={{ padding: 0 }}>
                    <TableEmptyState
                      title="No claim requests found"
                      message={
                        hasFilters
                          ? 'No claim records match your current search or status filter.'
                          : 'No installation claims have been raised yet. Click "+ Raise New Claim" to initiate.'
                      }
                      onClear={hasFilters ? resetFilters : undefined}
                      clearLabel="Clear filters"
                    />
                  </td>
                </tr>
              )}
              {!loading &&
                paginatedData.map((row, index) => {
                  const invoiceUrl = resolveJammuMediaUrl(row.inst_claim_invoice);
                  const docUrl = resolveJammuMediaUrl(row.inst_doc || (row as any).document || (row as any).doc_file);
                  const dStatus = Number(row.inst_doc_submit ?? (row as any).document_status ?? 0);
                  const isApproved = Number(row.inst_claim_status) === 2;

                  return (
                    <tr key={row.id} className="ax-table__row">
                      <td className="ax-table__td ax-num">{(currentPage - 1) * pageSize + index + 1}</td>
                      <td className="ax-table__td">Jammu & Kashmir</td>
                      <td className="ax-table__td"><b>{txt(row, 'district') || DASH}</b></td>
                      <td className="ax-table__td">
                        <span style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                          {row.site_name || DASH}
                        </span>
                      </td>
                      <td className="ax-table__td" style={monoCell}>{txt(row, 'site_code') || DASH}</td>
                      <td className="ax-table__td" style={{ fontWeight: 700, color: 'var(--asw-primary)' }}>
                        ₹ {Number(row.inst_claim_amount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="ax-table__td" style={{ fontSize: '12px' }}>
                        {txt(row, 'inst_claim_date') || DASH}
                      </td>

                      {/* Invoice File */}
                      <td className="ax-table__td">
                        {row.inst_claim_invoice ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <InstallationThumbnail
                              src={row.inst_claim_invoice}
                              alt={`Invoice - ${row.site_name}`}
                              onPreview={openPreview}
                              size={28}
                            />
                            <a
                              href={invoiceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="ax-btn ax-btn--ghost ax-btn--xs"
                              style={{ color: '#2563eb', padding: '2px 6px', fontSize: 11 }}
                              title="Open document in new tab"
                            >
                              View ↗
                            </a>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--ax-text-muted)' }}>{DASH}</span>
                        )}
                      </td>

                      {/* Document Status */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <DocBadge status={dStatus} docUrl={docUrl} />
                      </td>

                      {/* Disbursal Status */}
                      <td className="ax-table__td">
                        <ClaimStatusBadge status={row.inst_claim_status} />
                      </td>

                      {/* Action */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                          {dStatus !== 1 && dStatus !== 2 && (
                            <button
                              type="button"
                              className="ax-btn ax-btn--primary ax-btn--xs"
                              style={{ height: 26, fontSize: 11.5, padding: '0 8px' }}
                              onClick={() => handleOpenDocModal(row)}
                              title="Submit commissioning / handover document"
                            >
                              Submit Doc
                            </button>
                          )}
                          {isApproved ? (
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
                              }}
                              title="Claim is Approved & Settled"
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 12, height: 12, color: '#10b981' }}>
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              <span>Settled</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="ax-btn ax-btn--secondary ax-btn--xs"
                              style={{ height: 26, fontSize: 11.5, padding: '0 8px' }}
                              onClick={() => {
                                if (row.inst_claim_invoice) {
                                  openPreview(invoiceUrl, `Claim Invoice - ${row.site_name}`);
                                } else {
                                  alert(`Claim for ${row.site_name} is under review.`);
                                }
                              }}
                            >
                              Inspect
                            </button>
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

      {/* ── Invoice Lightbox Zoom Modal ── */}
      {preview && <ImagePreviewModal url={preview.url} title={preview.title} onClose={closePreview} />}

      {/* ── Raise New Claim Modal (API 10) ── */}
      <Modal open={raiseModalOpen} onClose={closeRaiseModal} labelledBy="raise-claim-title" dialogClass="ax-modal__dialog--md">
        <form onSubmit={handleRaiseClaimSubmit}>
          <div className="ax-modal__header">
            <div>
              <h4 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--ax-text-strong, #0f172a)' }} id="raise-claim-title">
                Raise Installation Milestone Claim
              </h4>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--ax-text-muted, #64748b)' }}>
                Upload verified tax invoice and claim eligible milestone payment.
              </p>
            </div>
            <button
              type="button"
              className="ax-modal__close"
              onClick={closeRaiseModal}
              disabled={submittingClaim}
              aria-label="Close dialog"
            >
              ✕
            </button>
          </div>

          <div className="ax-modal__body" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {claimError && (
              <div style={{ padding: 12, borderRadius: 8, background: '#fef2f2', color: '#991b1b', fontSize: 13, fontWeight: 600, border: '1px solid #fecaca' }}>
                ✕ {claimError}
              </div>
            )}

            {/* Select Site Dropdown */}
            <div className="ax-modern-field">
              <label className="ax-modern-label" htmlFor="claim_site_select">
                <span>Select Site (Eligible for Claim)</span>
                <span className="ax-modern-req">*</span>
              </label>
              <select
                id="claim_site_select"
                className="ax-input"
                style={{ width: '100%', height: 42 }}
                value={selectedSrtId}
                onChange={(e) => setSelectedSrtId(e.target.value)}
                disabled={loadingSites || submittingClaim}
                required
              >
                <option value="">-- Choose Installed Site --</option>
                {sitesDropdown.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    #{s.id} - {s.site_name} {s.district ? `(${s.district})` : ''}
                  </option>
                ))}
              </select>
              {loadingSites && (
                <div style={{ fontSize: 11, color: '#2563eb', marginTop: 2 }}>
                  <span className="ax-spinner" /> Loading eligible sites...
                </div>
              )}
            </div>

            {/* Claim Amount */}
            <div className="ax-modern-field">
              <label className="ax-modern-label" htmlFor="claim_amount_input">
                <span>Claim Amount (₹)</span>
                <span className="ax-modern-req">*</span>
              </label>
              <input
                id="claim_amount_input"
                type="number"
                min="1"
                step="0.01"
                className="ax-input"
                style={{ width: '100%', height: 42 }}
                placeholder="Enter claim amount (e.g. 50000)"
                value={claimAmount}
                onChange={(e) => setClaimAmount(e.target.value)}
                disabled={submittingClaim}
                required
              />
            </div>

            {/* Claim Invoice Document Upload */}
            <div className="ax-modern-field">
              <label className="ax-modern-label">
                <span>Milestone Tax Invoice Document</span>
                <span className="ax-modern-req">*</span>
              </label>
              <input
                ref={claimFileRef}
                id="claim_invoice_file"
                type="file"
                accept=".pdf,image/*"
                style={{ display: 'none' }}
                onChange={(e) => setClaimInvoiceFile(e.target.files?.[0] || null)}
              />
              {!claimInvoiceFile ? (
                <div
                  className="ax-modern-dropzone"
                  onClick={() => claimFileRef.current?.click()}
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
                      Click to upload signed tax invoice
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--ax-text-muted, #64748b)', marginTop: 2 }}>
                      Allowed: JPG, PNG, WEBP, PDF (Max 5 MB)
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
                        {claimInvoiceFile.name}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--ax-text-muted, #64748b)' }}>
                        {(claimInvoiceFile.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="ax-btn ax-btn--ghost ax-btn--sm"
                    style={{ padding: '4px 8px', fontSize: 12, color: '#ef4444' }}
                    onClick={() => {
                      setClaimInvoiceFile(null);
                      if (claimFileRef.current) claimFileRef.current.value = '';
                    }}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* Remarks */}
            <div className="ax-modern-field">
              <label className="ax-modern-label" htmlFor="claim_remarks">
                <span>Remarks (Optional)</span>
              </label>
              <textarea
                id="claim_remarks"
                className="ax-input"
                style={{ width: '100%', padding: '10px 12px', minHeight: 65 }}
                value={claimRemarks}
                onChange={(e) => setClaimRemarks(e.target.value)}
                placeholder="Enter claim notes or milestone description..."
                rows={2}
              />
            </div>
          </div>

          <div className="ax-modal__footer">
            <button
              type="button"
              className="ax-btn ax-btn--secondary"
              onClick={closeRaiseModal}
              disabled={submittingClaim}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="ax-btn ax-btn--primary"
              disabled={submittingClaim || !selectedSrtId || !claimAmount || !claimInvoiceFile}
            >
              {submittingClaim ? 'Submitting Claim…' : 'Submit Claim Request'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Document Submit Modal (API 9: GET /jammu/srt70mw/installation-submit-document?srt_id={srt_id}) ── */}
      <Modal open={!!docModalSite} onClose={closeDocModal} labelledBy="jammu-doc-title" dialogClass="ax-modal__dialog--md">
        {docModalSite && (
          <form onSubmit={handleDocSubmit}>
            <div className="ax-modal__header">
              <div>
                <h4 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--ax-text-strong, #0f172a)' }} id="jammu-doc-title">
                  Submit Installation Document
                </h4>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--ax-text-muted, #64748b)' }}>
                  Site: <b>{docModalSite.site_name || DASH}</b> (#{docModalSite.srt_id || docModalSite.id}) {docModalSite.district ? `· ${docModalSite.district}` : ''}
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
                Upload commissioning handover sheet, joint inspection report or signed invoice document (PDF, JPG, PNG).
              </div>

              {/* Modern Document Upload */}
              <div className="ax-modern-field">
                <label className="ax-modern-label">
                  <span>Installation Document (File)</span>
                  <span className="ax-modern-req">*</span>
                </label>
                <input
                  ref={docFileRef}
                  id="jammu_doc_file_input"
                  type="file"
                  accept=".pdf,image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                />
                {!docFile ? (
                  <div
                    className="ax-modern-dropzone"
                    onClick={() => docFileRef.current?.click()}
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
                        Click to upload installation document
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--ax-text-muted, #64748b)', marginTop: 2 }}>
                        Allowed: JPG, PNG, WEBP, PDF (Max 5 MB)
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
                          {docFile.name}
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--ax-text-muted, #64748b)' }}>
                          {(docFile.size / 1024).toFixed(1)} KB
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="ax-btn ax-btn--ghost ax-btn--sm"
                      style={{ padding: '4px 8px', fontSize: 12, color: '#ef4444' }}
                      onClick={() => {
                        setDocFile(null);
                        if (docFileRef.current) docFileRef.current.value = '';
                      }}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Date */}
              <div className="ax-modern-field">
                <label className="ax-modern-label" htmlFor="doc_date">
                  <span>Document Date</span>
                  <span className="ax-modern-req">*</span>
                </label>
                <input
                  id="doc_date"
                  type="date"
                  className="ax-input"
                  style={{ width: '100%', height: 42 }}
                  value={docDate}
                  onChange={(e) => setDocDate(e.target.value)}
                  required
                />
              </div>

              {/* Remarks */}
              <div className="ax-modern-field">
                <label className="ax-modern-label" htmlFor="doc_remarks">
                  <span>Remarks</span>
                  <span className="ax-modern-req">*</span>
                </label>
                <textarea
                  id="doc_remarks"
                  className="ax-input"
                  style={{ width: '100%', padding: '10px 12px', minHeight: 70 }}
                  value={docRemarks}
                  onChange={(e) => setDocRemarks(e.target.value)}
                  placeholder="Enter remarks for commissioning document handover..."
                  rows={3}
                  required
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
                disabled={docSubmitting || !docRemarks.trim()}
              >
                {docSubmitting ? 'Submitting…' : 'Submit Document'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

export default ClaimRequest;
