import { useState, useMemo, useEffect, useCallback, useRef, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import { authService } from '../../../../../services/authService';
import { useAuth } from '../../../../../context/AuthContext';
import {
  jammuSslService,
  resolveJammuSslMediaUrl,
  getJammuSslMediaCandidates,
  type JammuSslClaimItem,
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
  return <Badge tone="neutral">Pending</Badge>;
};

const PaymentStatusBadge = ({ status }: { status?: number }) => {
  const s = Number(status ?? 0);
  if (s === 1) return <Badge tone="success">Disbursed</Badge>;
  return <Badge tone="warning">Pending</Badge>;
};

const formatDate = (d?: string | null): string => {
  if (!d) return '—';
  const trimmed = String(d).trim();
  if (!trimmed || trimmed === '—' || trimmed === 'null' || trimmed === 'undefined') return '—';

  try {
    const normalized = trimmed.includes(' ') && !trimmed.includes('T') ? trimmed.replace(' ', 'T') : trimmed;
    const dt = new Date(normalized);
    if (!isNaN(dt.getTime())) {
      return dt.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    }
  } catch {}

  const datePart = trimmed.split(/[ T]/)[0];
  return datePart || trimmed;
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
  children,
  dialogClass = '',
  dialogStyle,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  children: ReactNode;
  dialogClass?: string;
  dialogStyle?: CSSProperties;
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

/* ───────── Image Preview Modal (Lightbox Zoom) ───────── */
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

/* ── Interactive Image Thumbnail ── */
function InstallationThumbnail({
  src,
  alt,
  onPreview,
  size = 32,
}: {
  src?: string | null;
  alt: string;
  onPreview: (url: string, title: string) => void;
  size?: number;
}) {
  const candidates = useMemo(() => getJammuSslMediaCandidates(src), [src]);
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

/* ───────── Styles ───────── */
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

  .ax-modern-field { display: flex; flex-direction: column; gap: 6px; }
  .ax-modern-label {
    display: flex; align-items: center; justify-content: space-between;
    font-size: 12px; font-weight: 600; color: var(--ax-text-strong, #1e293b);
    letter-spacing: 0.02em; margin: 0;
  }
  .ax-modern-req { color: #ef4444; font-weight: 700; margin-left: 3px; }
  .ax-modern-dropzone {
    border: 1.5px dashed var(--ax-border, #cbd5e1);
    border-radius: 10px; padding: 18px 16px;
    background: var(--ax-surface-subtle, #f8fafc);
    text-align: center; cursor: pointer; transition: all 0.2s ease;
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
  }
  .ax-modern-dropzone:hover {
    border-color: #2563eb;
    background: color-mix(in srgb, #2563eb 5%, var(--ax-surface-subtle, #f8fafc));
  }
  .ax-modern-dropzone__icon {
    width: 42px; height: 42px; border-radius: 50%;
    background: color-mix(in srgb, #2563eb 10%, #ffffff);
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

// Exactly matching user's requested columns
const CLAIM_HEADERS = [
  'Sr. No.',
  'Vendor Name',
  'State',
  'Claim Raised Date',
  'Site Count',
  'Claim Invoice',
  'Claim Amount',
  'Claim Update Date',
  'Claim Status',
  'Payment Status',
  'Payment Date',
  'Payment Amount',
  'Payment Remark',
];

export function SSLClaimRequest() {
  const { user } = useAuth();
  const [claims, setClaims] = useState<JammuSslClaimItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

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

  // Raise Claim Modal State (API 9: POST jammu/ssl/installation/claim-raised)
  const [raiseModalOpen, setRaiseModalOpen] = useState<boolean>(false);
  const [submittingClaim, setSubmittingClaim] = useState<boolean>(false);
  const [eligibleSiteCount, setEligibleSiteCount] = useState<number>(0);
  const [eligibleSiteIds, setEligibleSiteIds] = useState<number[]>([]);
  const [loadingEligible, setLoadingEligible] = useState<boolean>(false);

  // Form Fields for Raise Claim
  const [claimAmount, setClaimAmount] = useState<string>('');
  const [claimInvoiceFile, setClaimInvoiceFile] = useState<File | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);
  const claimFileRef = useRef<HTMLInputElement>(null);

  const closeRaiseModal = useCallback(() => {
    setRaiseModalOpen(false);
    setClaimAmount('');
    setClaimInvoiceFile(null);
    setClaimError(null);
    if (claimFileRef.current) claimFileRef.current.value = '';
  }, []);

  // Load claims from API 10: GET jammu/ssl/installation/view-claim-request-deatils
  const loadClaims = useCallback(async () => {
    setLoading(true);
    try {
      const data = await jammuSslService.getViewClaimRequests();
      setClaims(Array.isArray(data?.claimraised) ? data.claimraised : []);
    } catch (err: any) {
      console.error('[Jammu SSL Claims] load error:', err);
      setClaims([]);
      setToastMsg({ type: 'danger', text: err?.message || 'Failed to load claims register from server.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClaims();
  }, [loadClaims]);

  // Open Raise Claim Modal and check eligible sites count (from API 6: view-complete-site)
  const handleOpenRaiseModal = async () => {
    setRaiseModalOpen(true);
    setLoadingEligible(true);
    setClaimError(null);
    try {
      const summary = await jammuSslService.getViewCompleteSites();
      setEligibleSiteCount(summary?.claimedapplicable || 0);
      setEligibleSiteIds(summary?.claimedapplicable1 || []);
    } catch (err: any) {
      console.error('[Jammu SSL Claims] fetch complete sites error:', err);
      setEligibleSiteCount(0);
      setEligibleSiteIds([]);
    } finally {
      setLoadingEligible(false);
    }
  };

  // Submit Claim Request (API 9: POST jammu/ssl/installation/claim-raised)
  const handleRaiseClaimSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const numAmt = Number(claimAmount);
    if (!claimAmount || isNaN(numAmt) || numAmt <= 0) {
      setClaimError('Please enter a valid claim amount in INR (minimum ₹ 1).');
      return;
    }
    if (!claimInvoiceFile) {
      setClaimError('Please upload the certified milestone tax invoice file (JPG, PNG, PDF up to 5MB).');
      return;
    }

    setSubmittingClaim(true);
    setClaimError(null);

    try {
      const fd = new FormData();
      // Send comma-separated IDs from eligibleSiteIds or fallback
      const sslIdsStr = eligibleSiteIds.length > 0 ? eligibleSiteIds.join(',') : '';
      fd.append('ssl_id', sslIdsStr);
      fd.append('claim_amount', String(numAmt));
      fd.append('claim_invoice', claimInvoiceFile);

      const res = await jammuSslService.raiseClaim(fd);

      setToastMsg({
        type: 'success',
        text: res.message || 'Claim Raised Successfully!!!',
      });

      closeRaiseModal();
      await loadClaims();
    } catch (err: any) {
      console.error('[Jammu SSL RaiseClaim] error:', err);
      setClaimError(err?.message || 'Failed to raise claim. Please verify eligible sites.');
    } finally {
      setSubmittingClaim(false);
    }
  };

  // Default vendor name from session
  const defaultVendorName = useMemo(() => {
    return (
      (user as any)?.vendor?.name ||
      (user as any)?.vendor_name ||
      (user as any)?.name ||
      (authService.getSession() as any)?.vendor_name ||
      (authService.getSession() as any)?.name ||
      'App Testing'
    );
  }, [user]);

  // KPI Calculations
  const kpis = useMemo(() => {
    const totalCount = claims.length;
    let totalAmount = 0;
    let approvedCount = 0;
    let approvedAmount = 0;
    let pendingCount = 0;
    let pendingAmount = 0;

    claims.forEach((c) => {
      const amt = Number(c.claim_amount) || 0;
      totalAmount += amt;
      if (Number(c.claim_status) === 2) {
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

  // Filtered List
  const filteredClaims = useMemo(() => {
    let list = claims;

    if (statusFilter === 'approved') {
      list = list.filter((c) => Number(c.claim_status) === 2);
    } else if (statusFilter === 'pending') {
      list = list.filter((c) => Number(c.claim_status) === 1 || Number(c.claim_status) === 0);
    } else if (statusFilter === 'rejected') {
      list = list.filter((c) => Number(c.claim_status) === 3);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((item) => {
        const amtStr = String(item.claim_amount || '');
        const vendor = item.vendor_name || defaultVendorName;
        return (
          String(item.id).includes(q) ||
          vendor.toLowerCase().includes(q) ||
          String(item.state || '').toLowerCase().includes(q) ||
          amtStr.includes(q) ||
          String(item.payment_remark || '').toLowerCase().includes(q)
        );
      });
    }

    return list;
  }, [claims, search, statusFilter, defaultVendorName]);

  const { paginatedData, currentPage, pageSize, totalItems, setPage, setPageSize } =
    usePagination({ data: filteredClaims, initialPageSize: 100 });

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const hasFilters = search.trim() !== '' || statusFilter !== 'all';
  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setPage(1);
  };

  // Export Columns definition
  const exportCols: ExportColumn<JammuSslClaimItem>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r: JammuSslClaimItem, idx?: number) => (idx !== undefined ? idx + 1 : '') } as any,
      { header: 'Vendor Name', accessor: (r: JammuSslClaimItem) => r.vendor_name || defaultVendorName },
      { header: 'State', accessor: (r: JammuSslClaimItem) => r.state || 'Jammu' },
      { header: 'Claim Raised Date', accessor: (r: JammuSslClaimItem) => formatDate(r.claim_raised_date) },
      { header: 'Site Count', accessor: (r: JammuSslClaimItem) => r.claim_site_count ?? 0 },
      { header: 'Claim Invoice', accessor: (r: JammuSslClaimItem) => r.claim_invoice || '' },
      { header: 'Claim Amount', accessor: (r: JammuSslClaimItem) => `₹ ${Number(r.claim_amount || 0).toLocaleString('en-IN')}` },
      { header: 'Claim Update Date', accessor: (r: JammuSslClaimItem) => formatDate(r.claim_update_date || r.updated_at) },
      {
        header: 'Claim Status',
        accessor: (r: JammuSslClaimItem) =>
          Number(r.claim_status) === 2
            ? 'Approved'
            : Number(r.claim_status) === 3
            ? 'Rejected'
            : 'Raised (Pending Audit)',
      },
      {
        header: 'Payment Status',
        accessor: (r: JammuSslClaimItem) => (Number(r.payment_status) === 1 ? 'Disbursed' : 'Pending'),
      },
      { header: 'Payment Date', accessor: (r: JammuSslClaimItem) => formatDate(r.payment_date) },
      { header: 'Payment Amount', accessor: (r: JammuSslClaimItem) => (r.payment_amount ? `₹ ${Number(r.payment_amount).toLocaleString('en-IN')}` : '') },
      { header: 'Payment Remark', accessor: (r: JammuSslClaimItem) => r.payment_remark || '' },
    ],
    [defaultVendorName]
  );

  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = 'Jammu_SSL_Claim_Requests';
  const fileTitle = 'Jammu SSL Claim Requests Register';

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

      {/* ── Page Head ── */}
      <PageHead
        title="View SSL Claim Request"
        subtitle="Submit street light installation milestone claims, upload certified tax invoices, and track payment disbursal status"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Jammu & Kashmir' },
          { label: 'Installation' },
          { label: 'SSL' },
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

      {/* ── Policy Banner ── */}
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
          <b>Important Claim Policy:</b> A payment claim for Jammu SSL is allowed only when the vendor has <b>100 or more eligible sites</b> (installed 7+ days ago, verified, not claimed, payment not done).
        </div>
      </div>

      {/* ── Top Metric KPI Cards ── */}
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
      <section className="ax-card ax-col--12" role="region" aria-label="View SSL Claim Request">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">View SSL Claim Request</h2>
            <p className="ax-card__subtitle">
              <span className="ax-num">{filteredClaims.length}</span> of <span className="ax-num">{claims.length}</span> claims
              {' '}· Approved <b className="ax-num">{kpis.approvedCount}</b> · Pending <b className="ax-num">{kpis.pendingCount}</b>
            </p>
          </div>

          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              {/* Status Filter */}
              <select
                id="ssl_claim_status_filter"
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
                placeholder="Search vendor, state, amount…"
                size="sm"
                ariaLabel="Search claim requests"
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
            style={{ whiteSpace: 'nowrap', minWidth: 1500 }}
          >
            <caption className="ax-visually-hidden">View SSL Claim Request</caption>
            <thead className="ax-table__head">
              <tr>
                {CLAIM_HEADERS.map((h) => (
                  <th key={h} className="ax-table__th" scope="col">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody aria-busy={loading}>
              {loading && (
                <tr>
                  <td className="ax-table__td" colSpan={CLAIM_HEADERS.length} style={centerCell}>
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading claim requests from server…
                  </td>
                </tr>
              )}
              {!loading && filteredClaims.length === 0 && (
                <tr>
                  <td className="ax-table__td" colSpan={CLAIM_HEADERS.length} style={{ padding: 0 }}>
                    <TableEmptyState
                      title="No data available in table"
                      message={
                        hasFilters
                          ? 'No claim records match your current search or status filter.'
                          : 'No street light claims have been raised yet. Click "+ Raise New Claim" to initiate.'
                      }
                      onClear={hasFilters ? resetFilters : undefined}
                      clearLabel="Clear filters"
                    />
                  </td>
                </tr>
              )}
              {!loading &&
                paginatedData.map((row, index) => {
                  const invoiceUrl = resolveJammuSslMediaUrl(row.claim_invoice);
                  const vendorDisplay = row.vendor_name || defaultVendorName;

                  return (
                    <tr key={row.id || index} className="ax-table__row">
                      <td className="ax-table__td ax-num">{(currentPage - 1) * pageSize + index + 1}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                        {vendorDisplay}
                      </td>
                      <td className="ax-table__td">{row.state || 'Jammu'}</td>
                      <td className="ax-table__td" style={{ fontSize: 12 }}>
                        {formatDate(row.claim_raised_date)}
                      </td>
                      <td className="ax-table__td ax-num" style={{ fontWeight: 700, color: '#16a34a' }}>
                        {row.claim_site_count ?? 0}
                      </td>

                      {/* Claim Invoice */}
                      <td className="ax-table__td">
                        {row.claim_invoice ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <InstallationThumbnail
                              src={row.claim_invoice}
                              alt={`Invoice ${row.id}`}
                              onPreview={openPreview}
                              size={28}
                            />
                            <a
                              href={invoiceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="ax-btn ax-btn--ghost ax-btn--xs"
                              style={{ color: '#2563eb', padding: '2px 6px', fontSize: 11 }}
                              title="Open invoice in new tab"
                            >
                              View ↗
                            </a>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--ax-text-muted)' }}>{DASH}</span>
                        )}
                      </td>

                      {/* Claim Amount */}
                      <td className="ax-table__td" style={{ fontWeight: 700, color: 'var(--asw-primary)' }}>
                        ₹ {Number(row.claim_amount || 0).toLocaleString('en-IN')}
                      </td>

                      {/* Claim Update Date */}
                      <td className="ax-table__td" style={{ fontSize: 12 }}>
                        {formatDate(row.claim_update_date || row.updated_at)}
                      </td>

                      {/* Claim Status */}
                      <td className="ax-table__td">
                        <ClaimStatusBadge status={row.claim_status} />
                      </td>

                      {/* Payment Status */}
                      <td className="ax-table__td">
                        <PaymentStatusBadge status={row.payment_status} />
                      </td>

                      {/* Payment Date */}
                      <td className="ax-table__td" style={{ fontSize: 12 }}>
                        {formatDate(row.payment_date)}
                      </td>

                      {/* Payment Amount */}
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>
                        {row.payment_amount ? `₹ ${Number(row.payment_amount).toLocaleString('en-IN')}` : DASH}
                      </td>

                      {/* Payment Remark */}
                      <td className="ax-table__td" style={{ maxWidth: 200, whiteSpace: 'normal', fontSize: 12 }}>
                        {row.payment_remark || DASH}
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

      {/* ── Raise New Claim Modal (API 9: POST jammu/ssl/installation/claim-raised) ── */}
      <Modal open={raiseModalOpen} onClose={closeRaiseModal} labelledBy="raise-ssl-claim-title" dialogClass="ax-modal__dialog--md">
        <form onSubmit={handleRaiseClaimSubmit}>
          <div className="ax-modal__header">
            <div>
              <h4 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--ax-text-strong, #0f172a)' }} id="raise-ssl-claim-title">
                Raise Jammu SSL Payment Claim
              </h4>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--ax-text-muted, #64748b)' }}>
                Upload verified tax invoice and submit milestone payment requisition.
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

            {/* Eligible sites info banner */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 8,
                background: 'var(--ax-surface-subtle, #f8fafc)',
                border: '1px solid var(--ax-border, #e2e8f0)',
                fontSize: 13,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>
                  Eligible Verified Sites (7+ days installed)
                </span>
                {loadingEligible ? (
                  <span style={{ fontSize: 12, color: '#2563eb' }}><span className="ax-spinner" /> Checking eligibility…</span>
                ) : (
                  <b style={{ fontSize: 16, color: eligibleSiteCount >= 100 ? '#16a34a' : '#d97706' }}>
                    {eligibleSiteCount} {eligibleSiteCount === 1 ? 'Site' : 'Sites'}
                    {eligibleSiteCount < 100 && (
                      <span style={{ fontSize: 11, fontWeight: 500, color: '#dc2626', marginLeft: 6 }}>
                        (Requires 100+ sites to claim)
                      </span>
                    )}
                  </b>
                )}
              </div>
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
                placeholder="Enter claim amount in INR (e.g. 250000)"
                value={claimAmount}
                onChange={(e) => setClaimAmount(e.target.value)}
                disabled={submittingClaim}
                required
              />
            </div>

            {/* Claim Invoice Document Upload */}
            <div className="ax-modern-field">
              <label className="ax-modern-label">
                <span>Claim Invoice Document</span>
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
                      Allowed: JPG, JPEG, PNG, PDF (Max 5 MB)
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
              disabled={submittingClaim || !claimAmount || !claimInvoiceFile}
            >
              {submittingClaim ? 'Submitting Claim…' : 'Submit Claim Request'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default SSLClaimRequest;
