import { useState, useMemo, useEffect, useCallback, useRef, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  jammuRescoService,
  resolveJammuMediaUrl,
  getJammuMediaCandidates,
  type JammuRescoPaymentItem,
  type JammuRescoSiteNameItem,
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

const PaymentStatusBadge = ({ status, isClaimRaised }: { status?: number; isClaimRaised?: boolean }) => {
  if (isClaimRaised === false) return <Badge tone="neutral">Not Raised</Badge>;
  const s = Number(status ?? 0);
  if (s === 1 || s === 2) return <Badge tone="success">Disbursed</Badge>;
  if (s === 3) return <Badge tone="danger">Rejected</Badge>;
  return <Badge tone="warning">Pending</Badge>;
};

const txt = (row: any, key: string): string => {
  const v = row?.[key];
  if (v === null || v === undefined || v === '') return '';
  return String(v);
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
  dialogClass = '',
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  dialogClass?: string;
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
      <div ref={dialogRef} className={`ax-modal__dialog${dialogClass ? ' ' + dialogClass : ''}`}>
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
        <h2 className="ax-modal__title" id="claim-preview-title" style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
          {title || 'Invoice Preview'}
        </h2>
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
type KpiTone = 'accent' | 'cyan' | 'emerald' | 'violet';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(37, 99, 235, 0.12)', fg: '#2563eb' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan, #06b6d4) 14%, transparent)', fg: '#0891b2' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald, #10b981) 14%, transparent)', fg: '#16a34a' },
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
    min-width: 180px;
    max-width: 220px;
  }
  .solar-erp-page .ax-card__actions input { min-width: 0; width: 100%; }

  .solar-erp-page .ax-table-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  /* Modals */
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

const actionsRowStyle: CSSProperties = { gap: 'var(--ax-space-2, 8px)', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', width: '100%' };
const footerStyle: CSSProperties = {
  borderTop: '1px solid var(--ax-border, #e2e8f0)',
  padding: 'var(--ax-space-3, 12px) var(--ax-space-4, 16px)',
  display: 'flex',
  justifyContent: 'flex-start',
  alignItems: 'center',
  width: '100%',
  boxSizing: 'border-box',
};
const centerCell: CSSProperties = { textAlign: 'center', padding: 24 };

// Table Column Headers as exact as requested by User
const RESCO_PAYMENT_HEADERS = [
  'S.No.',
  'Date',
  'Claim',
  'Sites',
  'Invoice',
  'Amount',
  'Remarks',
  'Status',
  'Payment Amount',
  'Payment Balance',
  'Payment Date',
  'Payment Remarks',
  'Payment Status',
  'Action',
];

type TabKey = 'all' | 'pay40' | 'pay30_1' | 'pay30_2';

export function RescoClaimRequest() {
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [claimData, setClaimData] = useState<JammuRescoClaimData>({
    payments: [],
    pay1: [],
    pay2: [],
    pay3: [],
  });
  const [payments, setPayments] = useState<JammuRescoPaymentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Preview Modal
  const [preview, setPreview] = useState<{ url: string; title: string } | null>(null);
  const openPreview = useCallback((url: string, title: string) => setPreview({ url, title }), []);
  const closePreview = useCallback(() => setPreview(null), []);

  // Toast
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);
  useEffect(() => {
    if (!toastMsg) return;
    const t = window.setTimeout(() => setToastMsg(null), 4000);
    return () => window.clearTimeout(t);
  }, [toastMsg]);

  // Raise Claim Modal State (API 12: POST /jk/resco-installation-add-claim)
  const [raiseModalOpen, setRaiseModalOpen] = useState<boolean>(false);
  const [submittingClaim, setSubmittingClaim] = useState<boolean>(false);
  const [sitesDropdown, setSitesDropdown] = useState<any[]>([]);
  const [loadingSites, setLoadingSites] = useState<boolean>(false);

  const [claimPayType, setClaimPayType] = useState<number>(1);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [claimAmount, setClaimAmount] = useState<string>('');
  const [claimInvoiceFile, setClaimInvoiceFile] = useState<File | null>(null);
  const [claimRemarks, setClaimRemarks] = useState<string>('');
  const [claimError, setClaimError] = useState<string | null>(null);
  const claimFileRef = useRef<HTMLInputElement>(null);

  const closeRaiseModal = () => {
    setRaiseModalOpen(false);
    setSelectedSiteId('');
    setClaimAmount('');
    setClaimInvoiceFile(null);
    setClaimRemarks('');
    setClaimError(null);
    setClaimPayType(1);
    if (claimFileRef.current) claimFileRef.current.value = '';
  };

  // Edit/Update Claim Modal State (API 13 & 14)
  const [editClaimModalOpen, setEditClaimModalOpen] = useState<boolean>(false);
  const [editingClaimId, setEditingClaimId] = useState<number | null>(null);
  const [editAmount, setEditAmount] = useState<string>('');
  const [editPayType, setEditPayType] = useState<number>(1);
  const [editSiteId, setEditSiteId] = useState<string>('');
  const [editRemarks, setEditRemarks] = useState<string>('');
  const [editInvoiceFile, setEditInvoiceFile] = useState<File | null>(null);
  const [editClaimLoading, setEditClaimLoading] = useState<boolean>(false);
  const [submittingEditClaim, setSubmittingEditClaim] = useState<boolean>(false);
  const [editClaimError, setEditClaimError] = useState<string | null>(null);
  const editFileRef = useRef<HTMLInputElement>(null);

  // Load Data from API 11: GET /jk/resco-installation-claim
  const loadClaims = useCallback(async () => {
    setLoading(true);
    try {
      const data = await jammuRescoService.getInstallationClaims();
      setClaimData(data);
      setPayments(Array.isArray(data.payments) ? data.payments : []);
    } catch (err: any) {
      console.error('[Jammu Resco Claims] load error:', err);
      setToastMsg({ type: 'danger', text: err?.message || 'Failed to load RESCO payment claims.' });
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClaims();
  }, [loadClaims]);

  // Helper to get sites directly from live claimData for selected milestone
  const getEligibleSitesForPayType = useCallback(
    (payType: number) => {
      if (payType === 2) return Array.isArray(claimData.pay2) ? claimData.pay2 : [];
      if (payType === 3) return Array.isArray(claimData.pay3) ? claimData.pay3 : [];
      return Array.isArray(claimData.pay1) ? claimData.pay1 : [];
    },
    [claimData]
  );

  // Open Raise Claim Modal and fetch eligible approved sites
  const handleOpenRaiseModal = async (initialPayType?: number, initialSiteId?: string) => {
    const targetPayType =
      initialPayType ||
      (activeTab === 'pay40' ? 1 : activeTab === 'pay30_1' ? 2 : activeTab === 'pay30_2' ? 3 : 1);
    setClaimPayType(targetPayType);

    if (initialSiteId) {
      setSelectedSiteId(String(initialSiteId));
    }

    setRaiseModalOpen(true);
    setClaimError(null);

    // 1. Primary: Use verified milestone sites already loaded in claimData (instant & milestone-accurate)
    const directEligible = getEligibleSitesForPayType(targetPayType);
    if (directEligible.length > 0) {
      setSitesDropdown(directEligible);
      setLoadingSites(false);
      return;
    }

    // 2. Fallback: Query live installed sites if claimData pay array is empty
    setLoadingSites(true);
    try {
      const res = await jammuRescoService.getViewInstalledSites();
      const rawSites =
        Array.isArray(res.sites) && res.sites.length > 0
          ? res.sites
          : Array.isArray((res as any)?.install_detail)
          ? (res as any).install_detail
          : [];

      let approved = rawSites.filter((s: any) => {
        const v = Number(s.inst_verify_status ?? s.verify_status ?? 0);
        const raw = String(s.inst_verify_status ?? s.verify_status ?? '').toLowerCase().trim();
        return v === 1 || raw === 'approved' || raw === 'complete' || raw === '1';
      });

      if (approved.length === 0) {
        const installSites = await jammuRescoService.getInstallSites();
        approved = installSites.filter((s: any) => {
          const v = Number(s.inst_verify_status ?? s.verify_status ?? 0);
          const raw = String(s.inst_verify_status ?? s.verify_status ?? '').toLowerCase().trim();
          return v === 1 || raw === 'approved' || raw === 'complete' || raw === '1';
        });
      }

      const cleanApproved = approved.filter(
        (s: any) =>
          s &&
          s.site_name &&
          !String(s.site_name).toLowerCase().includes('dummy') &&
          !String(s.site_name).toLowerCase().includes('fake')
      );

      setSitesDropdown(cleanApproved);
    } catch (err: any) {
      console.error('[Jammu Resco Claims] fetch approved sites error:', err);
      const pool = [
        ...(claimData.pay1 || []),
        ...(claimData.pay2 || []),
        ...(claimData.pay3 || []),
      ].filter(
        (s: any) =>
          s &&
          s.site_name &&
          !String(s.site_name).toLowerCase().includes('dummy') &&
          !String(s.site_name).toLowerCase().includes('fake')
      );
      setSitesDropdown(pool);
    } finally {
      setLoadingSites(false);
    }
  };

  // Submit Claim Request (API 12: POST /jk/resco-installation-add-claim)
  const handleRaiseClaimSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedSiteId) {
      setClaimError('Please select an approved site to raise a milestone claim.');
      return;
    }
    const numAmt = Number(claimAmount);
    if (!claimAmount || isNaN(numAmt) || numAmt <= 0) {
      setClaimError('Please enter a valid claim amount in INR.');
      return;
    }
    if (!claimInvoiceFile) {
      setClaimError('Please upload the milestone invoice file (PDF, JPG, PNG).');
      return;
    }

    setSubmittingClaim(true);
    setClaimError(null);

    try {
      const fd = new FormData();
      fd.append('amount', String(numAmt));
      fd.append('site_id[]', String(selectedSiteId));
      fd.append('pay_type', String(claimPayType));
      fd.append('file', claimInvoiceFile);
      if (claimRemarks.trim()) fd.append('remarks', claimRemarks.trim());

      const res = await jammuRescoService.addClaim(fd);
      setToastMsg({
        type: 'success',
        text: res.message || 'Claim raised successfully',
      });

      closeRaiseModal();
      await loadClaims();
    } catch (err: any) {
      console.error('[Jammu Resco RaiseClaim] error:', err);
      setClaimError(err?.message || 'Failed to raise claim.');
    } finally {
      setSubmittingClaim(false);
    }
  };

  // Open Edit Claim Modal (API 14: POST /jk/fetch-site-resco-installation-claim)
  const handleOpenEditClaim = async (claimId: number) => {
    setEditingClaimId(claimId);
    setEditClaimModalOpen(true);
    setEditClaimLoading(true);
    setEditClaimError(null);
    try {
      const res = await jammuRescoService.fetchClaimDetails(claimId);
      if (res?.claims) {
        setEditAmount(String(res.claims.amount || ''));
        setEditPayType(Number(res.claims.pay_type || 1));
        setEditSiteId(String(res.claims.site_id || ''));
        setEditRemarks(res.claims.remarks || '');
      }
    } catch (err: any) {
      console.warn('Fetch claim details warning:', err);
      const target = payments.find((p) => p.id === claimId);
      setEditAmount(String(target?.amount || ''));
      setEditSiteId(String(target?.site_id || ''));
      setEditRemarks(target?.remarks || '');
    } finally {
      setEditClaimLoading(false);
    }
  };

  // Save Edit Claim (API 13: POST /jk/resco-installation-update-claim)
  const handleSaveEditClaim = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingClaimId) return;

    setSubmittingEditClaim(true);
    setEditClaimError(null);
    try {
      const fd = new FormData();
      fd.append('update_id', String(editingClaimId));
      fd.append('amount', editAmount.trim());
      fd.append('pay_type', String(editPayType));
      if (editSiteId) fd.append('site_id[]', editSiteId);
      if (editRemarks.trim()) fd.append('remarks', editRemarks.trim());
      if (editInvoiceFile) fd.append('file', editInvoiceFile);

      const res = await jammuRescoService.updateClaim(fd);
      setToastMsg({
        type: 'success',
        text: res.message || 'Claim updated successfully',
      });
      setEditClaimModalOpen(false);
      await loadClaims();
    } catch (err: any) {
      console.error('[Jammu Resco UpdateClaim] error:', err);
      setEditClaimError(err?.message || 'Failed to update claim.');
    } finally {
      setSubmittingEditClaim(false);
    }
  };

  // Helper to normalize site items from pay1, pay2, pay3 into JammuRescoPaymentItem
  const normalizeSiteToPayment = useCallback((site: any, payType: 1 | 2 | 3): JammuRescoPaymentItem => {
    const claimStatusKey =
      payType === 1 ? 'inst_claim1_status' : payType === 2 ? 'inst_claim2_status' : 'inst_claim3_status';
    const payStatusKey =
      payType === 1 ? 'inst_pay1_status' : payType === 2 ? 'inst_pay2_status' : 'inst_pay3_status';
    const payAmtKey =
      payType === 1 ? 'inst_pay1_amount' : payType === 2 ? 'inst_pay2_amount' : 'inst_pay3_amount';
    const payDateKey =
      payType === 1 ? 'inst_pay1_date' : payType === 2 ? 'inst_pay2_date' : 'inst_pay3_date';

    const siteId = Number(site.id ?? site.site_id);
    const rawClaimStatus = site[claimStatusKey] ?? site.claim_status ?? 0;
    const rawPayStatus = site[payStatusKey] ?? site.payment_status ?? 0;
    const rawPayAmt = site[payAmtKey] ?? site.payment_amount;

    return {
      id: siteId,
      site_id: siteId,
      site_name: site.site_name || `Site ${siteId}`,
      amount: site.amount || rawPayAmt || site.claim_amount || '',
      file: site.inst_doc_file || site.file || site.invoice || null,
      invoice: site.inst_doc_file || site.file || site.invoice || null,
      remarks: site.inst_remarks || site.inst_doc_remarks || site.remarks || '',
      status: Number(rawClaimStatus) || 0,
      pay_type: payType,
      payment_amount: rawPayAmt || site.payment_amount || '',
      payment_balance: site.payment_balance || '',
      payment_remarks:
        site.payment_remarks ||
        site.inst_doc_verify_remarks ||
        site.inst_verify_remarks ||
        site.approved_remarks ||
        '',
      date: site.inst_date || site.inst_assigned_date || site.created_at || null,
      created_at: site.created_at || null,
      district: site.district || '',
      state: site.state || 'jammu',
      ca_no: site.ca_no || '',
      sanction_load: site.sanction_load || '',
      contact_person: site.contact_person || '',
      contact_number: site.contact_number || '',
      wo_no: site.wo_no || '',
      is_site_record: true,
      has_claim: Number(rawClaimStatus) > 0,
    };
  }, []);

  // 1. Payment 40 % (Milestone 1)
  const pay40List = useMemo(() => {
    const rawPay1 = Array.isArray(claimData.pay1) ? claimData.pay1 : [];
    const usedClaimIds = new Set<number>();

    // For each site in pay1, check if an explicit claim was raised in payments
    const list: JammuRescoPaymentItem[] = rawPay1.map((s: any) => {
      const siteId = Number(s.id ?? s.site_id);
      const matchedClaim = payments.find(
        (c) =>
          Number(c.site_id || c.id) === siteId &&
          (Number(c.pay_type || (c as any).payment_type || 1) === 1 ||
            String(c.milestone || c.stage || '').includes('40'))
      );
      if (matchedClaim) {
        usedClaimIds.add(Number(matchedClaim.id));
        return {
          ...matchedClaim,
          site_name: matchedClaim.site_name || s.site_name || `Site ${siteId}`,
          district: matchedClaim.district || s.district,
          state: matchedClaim.state || s.state,
          pay_type: 1,
          has_claim: true,
        };
      }
      return normalizeSiteToPayment(s, 1);
    });

    // Plus any payments for Milestone 1 that were not in pay1
    payments.forEach((c) => {
      if (usedClaimIds.has(Number(c.id))) return;
      const pt = Number(c.pay_type || (c as any).payment_type || 0);
      const m = String(c.milestone || c.stage || (c as any).claim_type || '').toLowerCase();
      if (pt === 1 || m.includes('40') || m.includes('milestone 1') || m.includes('first')) {
        list.push({ ...c, pay_type: 1, has_claim: true });
        usedClaimIds.add(Number(c.id));
      }
    });

    return list.filter((c) => {
      const name = String(c.site_name || '').toLowerCase();
      return !name.includes('dummy') && !name.includes('fake');
    });
  }, [claimData.pay1, payments, normalizeSiteToPayment]);

  // 2. Payment 30 % (Milestone 2)
  const pay30_1List = useMemo(() => {
    const rawPay2 = Array.isArray(claimData.pay2) ? claimData.pay2 : [];
    const usedClaimIds = new Set<number>();

    const list: JammuRescoPaymentItem[] = rawPay2.map((s: any) => {
      const siteId = Number(s.id ?? s.site_id);
      const matchedClaim = payments.find(
        (c) =>
          Number(c.site_id || c.id) === siteId &&
          (Number(c.pay_type || (c as any).payment_type) === 2 ||
            (String(c.milestone || c.stage || '').includes('30') &&
              String(c.milestone || c.stage || '').includes('2')))
      );
      if (matchedClaim) {
        usedClaimIds.add(Number(matchedClaim.id));
        return {
          ...matchedClaim,
          site_name: matchedClaim.site_name || s.site_name || `Site ${siteId}`,
          district: matchedClaim.district || s.district,
          state: matchedClaim.state || s.state,
          pay_type: 2,
          has_claim: true,
        };
      }
      return normalizeSiteToPayment(s, 2);
    });

    payments.forEach((c) => {
      if (usedClaimIds.has(Number(c.id))) return;
      const pt = Number(c.pay_type || (c as any).payment_type || 0);
      const m = String(c.milestone || c.stage || (c as any).claim_type || '').toLowerCase();
      if (pt === 2 || (m.includes('30') && (m.includes('2') || m.includes('second'))) || m.includes('milestone 2')) {
        list.push({ ...c, pay_type: 2, has_claim: true });
        usedClaimIds.add(Number(c.id));
      }
    });

    return list.filter((c) => {
      const name = String(c.site_name || '').toLowerCase();
      return !name.includes('dummy') && !name.includes('fake');
    });
  }, [claimData.pay2, payments, normalizeSiteToPayment]);

  // 3. Payment 30 % (Milestone 3)
  const pay30_2List = useMemo(() => {
    const rawPay3 = Array.isArray(claimData.pay3) ? claimData.pay3 : [];
    const usedClaimIds = new Set<number>();

    const list: JammuRescoPaymentItem[] = rawPay3.map((s: any) => {
      const siteId = Number(s.id ?? s.site_id);
      const matchedClaim = payments.find(
        (c) =>
          Number(c.site_id || c.id) === siteId &&
          (Number(c.pay_type || (c as any).payment_type) === 3 ||
            (String(c.milestone || c.stage || '').includes('30') &&
              (String(c.milestone || c.stage || '').includes('3') ||
                String(c.milestone || c.stage || '').includes('final'))))
      );
      if (matchedClaim) {
        usedClaimIds.add(Number(matchedClaim.id));
        return {
          ...matchedClaim,
          site_name: matchedClaim.site_name || s.site_name || `Site ${siteId}`,
          district: matchedClaim.district || s.district,
          state: matchedClaim.state || s.state,
          pay_type: 3,
          has_claim: true,
        };
      }
      return normalizeSiteToPayment(s, 3);
    });

    payments.forEach((c) => {
      if (usedClaimIds.has(Number(c.id))) return;
      const pt = Number(c.pay_type || (c as any).payment_type || 0);
      const m = String(c.milestone || c.stage || (c as any).claim_type || '').toLowerCase();
      if (pt === 3 || (m.includes('30') && (m.includes('3') || m.includes('third') || m.includes('final'))) || m.includes('milestone 3')) {
        list.push({ ...c, pay_type: 3, has_claim: true });
        usedClaimIds.add(Number(c.id));
      }
    });

    return list.filter((c) => {
      const name = String(c.site_name || '').toLowerCase();
      return !name.includes('dummy') && !name.includes('fake');
    });
  }, [claimData.pay3, payments, normalizeSiteToPayment]);

  // 4. Combined List for 'all' (Resco Installation Payment)
  const allList = useMemo(() => {
    const combined = [...pay40List, ...pay30_1List, ...pay30_2List];
    if (combined.length > 0) return combined;
    return payments;
  }, [pay40List, pay30_1List, pay30_2List, payments]);

  const tabFilteredPayments = useMemo(() => {
    if (activeTab === 'pay40') return pay40List;
    if (activeTab === 'pay30_1') return pay30_1List;
    if (activeTab === 'pay30_2') return pay30_2List;
    return allList; // 'all'
  }, [activeTab, allList, pay40List, pay30_1List, pay30_2List]);

  const activeTabTitle = useMemo(() => {
    if (activeTab === 'pay40') return 'Payment 40 %';
    if (activeTab === 'pay30_1') return 'Payment 30 %';
    if (activeTab === 'pay30_2') return 'Payment 30 %';
    return 'Resco Installation Payment';
  }, [activeTab]);

  const activePayType = useMemo(() => {
    if (activeTab === 'pay40') return 1;
    if (activeTab === 'pay30_1') return 2;
    if (activeTab === 'pay30_2') return 3;
    return 1;
  }, [activeTab]);

  // KPI Calculations
  const kpis = useMemo(() => {
    const totalCount = tabFilteredPayments.length;
    let totalAmount = 0;
    let approvedCount = 0;
    let approvedAmount = 0;
    let pendingCount = 0;
    let pendingAmount = 0;

    tabFilteredPayments.forEach((c) => {
      const amt = Number(c.amount) || 0;
      totalAmount += amt;
      if (Number(c.status) === 2) {
        approvedCount++;
        approvedAmount += amt;
      } else if (Number(c.status) === 1) {
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
  }, [tabFilteredPayments]);

  // Filtered List
  const filteredPayments = useMemo(() => {
    let list = tabFilteredPayments;

    if (statusFilter === 'approved') {
      list = list.filter((c) => Number(c.status) === 2);
    } else if (statusFilter === 'pending') {
      list = list.filter((c) => Number(c.status) === 1 || Number(c.status) === 0);
    } else if (statusFilter === 'rejected') {
      list = list.filter((c) => Number(c.status) === 3);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((item) => {
        return (
          String(item.id).includes(q) ||
          txt(item, 'site_name').toLowerCase().includes(q) ||
          txt(item, 'district').toLowerCase().includes(q) ||
          String(item.amount || '').includes(q) ||
          txt(item, 'remarks').toLowerCase().includes(q)
        );
      });
    }

    return list;
  }, [tabFilteredPayments, search, statusFilter]);

  const { paginatedData, currentPage, pageSize, totalItems, setPage, setPageSize } =
    usePagination({ data: filteredPayments, initialPageSize: 100 });

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, activeTab, setPage]);

  const hasFilters = search.trim() !== '' || statusFilter !== 'all';
  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setPage(1);
  };

  // Export Columns definition
  const exportCols: ExportColumn<JammuRescoPaymentItem>[] = useMemo(
    () => [
      { header: 'S.No.', accessor: (_r, idx?: number) => (idx !== undefined ? idx + 1 : '') } as any,
      { header: 'Date', accessor: (r) => txt(r, 'date') || txt(r, 'claim_date') || txt(r, 'created_at') },
      { header: 'Claim', accessor: (r) => (r.is_site_record && !r.has_claim ? `Site ${r.site_id || r.id}` : `Claim ${r.id}`) },
      { header: 'Milestone', accessor: (r) => (Number(r.pay_type) === 1 ? 'Payment 40 %' : Number(r.pay_type) === 2 ? 'Payment 30 %' : Number(r.pay_type) === 3 ? 'Payment 30 %' : 'Payment 40 %') },
      { header: 'Sites', accessor: (r) => r.site_name || `Site ${r.site_id || r.id}` },
      { header: 'District', accessor: (r) => r.district || DASH },
      { header: 'Amount', accessor: (r) => (Number(r.amount || 0) > 0 ? `₹ ${Number(r.amount).toLocaleString('en-IN')}` : r.sanction_load ? `Load: ${r.sanction_load} kW` : DASH) },
      { header: 'Remarks', accessor: (r) => r.remarks || DASH },
      { header: 'Status', accessor: (r) => (Number(r.status) === 2 ? 'Approved' : Number(r.status) === 1 ? 'Raised (Pending Audit)' : Number(r.status) === 3 ? 'Rejected' : 'Not Raised') },
      { header: 'Payment Amount', accessor: (r) => (r.payment_amount ? `₹ ${Number(r.payment_amount).toLocaleString('en-IN')}` : DASH) },
      { header: 'Payment Balance', accessor: (r) => (r.payment_balance ? `₹ ${Number(r.payment_balance).toLocaleString('en-IN')}` : DASH) },
      { header: 'Payment Date', accessor: (r) => txt(r, 'payment_date') || DASH },
      { header: 'Payment Remarks', accessor: (r) => r.payment_remarks || DASH },
      { header: 'Payment Status', accessor: (r) => (Number(r.payment_status) === 1 ? 'Disbursed' : 'Pending') },
    ],
    []
  );

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="Resco Installation Payment"
        subtitle="Manage and track RESCO rooftop solar installation milestone claims, tax invoices, and disbursement records"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Jammu & Kashmir' },
          { label: 'Installation' },
          { label: 'RESCO' },
          { label: 'Claim Request' },
        ]}
        actions={
          <button
            type="button"
            className="ax-btn ax-btn--primary ax-btn--sm"
            onClick={() => handleOpenRaiseModal(activePayType)}
          >
            <span className="ax-btn__label">+ Raise RESCO Installation Claim</span>
          </button>
        }
      />

      {toastMsg && (
        <div className={`ax-alert ax-alert--${toastMsg.type}`} style={{ marginBottom: 'var(--ax-space-4, 16px)' }} role="status">
          <div className="ax-alert__title">{toastMsg.type === 'success' ? 'Success' : 'Error'}</div>
          <div className="ax-alert__text">{toastMsg.text}</div>
        </div>
      )}

      {/* ── Top Metric KPI Cards ── */}
      <div className="asw-cards-row">
        <KpiCard
          tone="accent"
          label="Total Claims"
          value={kpis.totalCount.toLocaleString('en-IN')}
          sub={activeTab === 'all' ? 'All milestones registered' : `${activeTabTitle} claims`}
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

      {/* ── Table Tabs (Resco Installation Payment + Payment 40 % + Payment 30 % + Payment 30 %) ── */}
      <div className="ax-col--12" style={{ marginBottom: 'var(--ax-space-4, 16px)' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            background: 'var(--ax-surface-subtle, #f8fafc)',
            padding: '8px 12px',
            borderRadius: 12,
            border: '1px solid var(--ax-border, #e2e8f0)',
          }}
        >
          <div className="ax-cluster" role="tablist" aria-label="Payment Claim Tabs" style={{ gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'all'}
              className={`ax-btn ax-btn--sm ${activeTab === 'all' ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
              onClick={() => { setActiveTab('all'); setPage(1); }}
              style={{ fontWeight: 600, height: 34, padding: '0 14px' }}
            >
              <span>Resco Installation Payment</span>
              <span
                style={{
                  marginLeft: 8,
                  fontSize: 11,
                  padding: '2px 7px',
                  borderRadius: 12,
                  background: activeTab === 'all' ? 'rgba(255,255,255,0.25)' : 'var(--ax-surface-subtle, #f1f5f9)',
                  color: activeTab === 'all' ? '#ffffff' : 'var(--ax-text-muted, #64748b)',
                }}
              >
                {allList.length}
              </span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'pay40'}
              className={`ax-btn ax-btn--sm ${activeTab === 'pay40' ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
              onClick={() => { setActiveTab('pay40'); setPage(1); }}
              style={{ fontWeight: 600, height: 34, padding: '0 14px' }}
            >
              <span>Payment 40 %</span>
              <span
                style={{
                  marginLeft: 8,
                  fontSize: 11,
                  padding: '2px 7px',
                  borderRadius: 12,
                  background: activeTab === 'pay40' ? 'rgba(255,255,255,0.25)' : 'var(--ax-surface-subtle, #f1f5f9)',
                  color: activeTab === 'pay40' ? '#ffffff' : 'var(--ax-text-muted, #64748b)',
                }}
              >
                {pay40List.length}
              </span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'pay30_1'}
              className={`ax-btn ax-btn--sm ${activeTab === 'pay30_1' ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
              onClick={() => { setActiveTab('pay30_1'); setPage(1); }}
              style={{ fontWeight: 600, height: 34, padding: '0 14px' }}
            >
              <span>Payment 30 %</span>
              <span
                style={{
                  marginLeft: 8,
                  fontSize: 11,
                  padding: '2px 7px',
                  borderRadius: 12,
                  background: activeTab === 'pay30_1' ? 'rgba(255,255,255,0.25)' : 'var(--ax-surface-subtle, #f1f5f9)',
                  color: activeTab === 'pay30_1' ? '#ffffff' : 'var(--ax-text-muted, #64748b)',
                }}
              >
                {pay30_1List.length}
              </span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'pay30_2'}
              className={`ax-btn ax-btn--sm ${activeTab === 'pay30_2' ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
              onClick={() => { setActiveTab('pay30_2'); setPage(1); }}
              style={{ fontWeight: 600, height: 34, padding: '0 14px' }}
            >
              <span>Payment 30 %</span>
              <span
                style={{
                  marginLeft: 8,
                  fontSize: 11,
                  padding: '2px 7px',
                  borderRadius: 12,
                  background: activeTab === 'pay30_2' ? 'rgba(255,255,255,0.25)' : 'var(--ax-surface-subtle, #f1f5f9)',
                  color: activeTab === 'pay30_2' ? '#ffffff' : 'var(--ax-text-muted, #64748b)',
                }}
              >
                {pay30_2List.length}
              </span>
            </button>
          </div>

          <div>
            <button
              type="button"
              className="ax-btn ax-btn--primary ax-btn--sm"
              onClick={() => handleOpenRaiseModal(activePayType)}
              style={{ height: 34, padding: '0 14px', fontWeight: 600 }}
              title="Raise RESCO Installation Claim for selected milestone"
            >
              <span className="ax-btn__label">+ Raise RESCO Installation Claim</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Table Card ── */}
      <section className="ax-card ax-col--12" role="region" aria-label="Resco Installation Payment Table">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">{activeTabTitle}</h2>
            <p className="ax-card__subtitle">
              <span className="ax-num">{filteredPayments.length}</span> of <span className="ax-num">{tabFilteredPayments.length}</span> claims
              {' '}· Approved <b className="ax-num">{kpis.approvedCount}</b> · Pending <b className="ax-num">{kpis.pendingCount}</b>
            </p>
          </div>

          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              <select
                className="ax-input ax-input--sm"
                style={{ width: 130, height: 32 }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
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
                  style={{ height: 30, padding: '0 8px' }}
                >
                  Reset
                </button>
              )}

              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search site, amount, remarks…"
                size="sm"
                ariaLabel="Search payment claims"
              />

              <TableExportToolbar
                onCopy={() => {
                  const t = [
                    exportCols.map((c) => c.header).join('\t'),
                    ...filteredPayments.map((r, i) =>
                      exportCols.map((c) => (typeof c.accessor === 'function' ? (c.accessor as any)(r, i) : r[c.accessor as keyof typeof r])).join('\t')
                    ),
                  ].join('\n');
                  navigator.clipboard.writeText(t);
                  setToastMsg({ type: 'success', text: 'Copied to clipboard!' });
                }}
                onExportCSV={() => {
                  const out = [
                    exportCols.map((c) => c.header).join(','),
                    ...filteredPayments.map((r, i) =>
                      exportCols.map((c) => `"${String(typeof c.accessor === 'function' ? (c.accessor as any)(r, i) : r[c.accessor as keyof typeof r] || '').replace(/"/g, '""')}"`).join(',')
                    ),
                  ].join('\n');
                  const blob = new Blob([out], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'Jammu_RESCO_Installation_Payment.csv';
                  a.click();
                }}
                onExportExcel={() => {
                  const tableHtml = `<table border="1"><thead><tr>${exportCols.map((c) => `<th>${escapeHtml(c.header)}</th>`).join('')}</tr></thead><tbody>${filteredPayments.map((r, i) => `<tr>${exportCols.map((c) => `<td>${escapeHtml(String(typeof c.accessor === 'function' ? (c.accessor as any)(r, i) : r[c.accessor as keyof typeof r] || ''))}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
                  const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8" /></head><body>${tableHtml}</body></html>`;
                  const blob = new Blob([`\ufeff${html}`], { type: 'application/vnd.ms-excel' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'Jammu_RESCO_Installation_Payment.xls';
                  a.click();
                }}
                onExportPDF={() => window.print()}
              />
            </div>
          </div>
        </div>

        {/* ── Table with EXACT user headers:
            S.No. | Date | Claim | Sites | Invoice | Amount | Remarks | Status | Payment Amount | Payment Balance | Payment Date | Payment Remarks | Payment Status | Action ── */}
        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap', minWidth: 1600 }}>
            <thead className="ax-table__head">
              <tr>
                {RESCO_PAYMENT_HEADERS.map((h) => (
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
                  <td colSpan={RESCO_PAYMENT_HEADERS.length} style={centerCell}>
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading payment claims from server…
                  </td>
                </tr>
              )}
              {!loading && filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={RESCO_PAYMENT_HEADERS.length} style={{ padding: 0 }}>
                    <TableEmptyState
                      title="No payment records found"
                      message={
                        hasFilters
                          ? 'No claim records match your current search or status filter.'
                          : 'No installation claims have been raised yet. Click "+ Raise New Claim" to initiate.'
                      }
                      onClear={hasFilters ? resetFilters : undefined}
                    />
                  </td>
                </tr>
              )}
              {!loading &&
                paginatedData.map((row, index) => {
                  const invoiceFile = row.invoice || row.file || (row as any).inst_doc_file;
                  const invoiceUrl = invoiceFile ? resolveJammuMediaUrl(invoiceFile) : '';
                  const isApproved = Number(row.status) === 2;
                  const isNotRaised = Number(row.status) === 0;

                  return (
                    <tr key={`${row.id}-${row.pay_type || index}`} className="ax-table__row">
                      <td className="ax-table__td ax-num">{(currentPage - 1) * pageSize + index + 1}</td>
                      <td className="ax-table__td" style={{ fontSize: 12 }}>
                        {txt(row, 'date') || txt(row, 'claim_date') || txt(row, 'created_at') || DASH}
                      </td>
                      <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono)' }}>
                        <div style={{ fontWeight: 600 }}>
                          {(row as any).is_site_record && !(row as any).has_claim
                            ? `Site ${row.site_id || row.id}`
                            : `Claim ${row.id}`}
                        </div>
                        <span
                          className="ax-badge ax-badge--soft"
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            marginTop: 3,
                            display: 'inline-block',
                            color:
                              Number(row.pay_type) === 1
                                ? '#2563eb'
                                : Number(row.pay_type) === 2
                                ? '#0891b2'
                                : '#7c3aed',
                          }}
                        >
                          {Number(row.pay_type) === 1
                            ? '40% (M1)'
                            : Number(row.pay_type) === 2
                            ? '30% (M2)'
                            : Number(row.pay_type) === 3
                            ? '30% (M3)'
                            : '40%'}
                        </span>
                      </td>
                      <td className="ax-table__td">
                        <span style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                          {row.site_name || `Site ${row.site_id || row.id}`}
                        </span>
                        {row.district && (
                          <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', marginTop: 2 }}>
                            {row.district}
                          </div>
                        )}
                      </td>

                      {/* Invoice */}
                      <td className="ax-table__td">
                        {invoiceFile ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <InstallationThumbnail
                              src={invoiceFile}
                              alt={`Invoice - ${row.site_name || row.id}`}
                              onPreview={openPreview}
                              size={28}
                            />
                            <a
                              href={invoiceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="ax-btn ax-btn--ghost ax-btn--xs"
                              style={{ color: '#2563eb', padding: '2px 6px', fontSize: 11 }}
                              title="Open invoice file"
                            >
                              View ↗
                            </a>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--ax-text-muted)' }}>{DASH}</span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="ax-table__td" style={{ fontWeight: 700, color: 'var(--asw-primary)' }}>
                        {Number(row.amount || 0) > 0 ? (
                          `₹ ${Number(row.amount).toLocaleString('en-IN')}`
                        ) : row.sanction_load ? (
                          <span style={{ fontSize: 12, color: 'var(--ax-text-muted)' }}>
                            Load: {row.sanction_load} kW
                          </span>
                        ) : (
                          DASH
                        )}
                      </td>

                      {/* Remarks */}
                      <td className="ax-table__td" style={{ maxWidth: 160, whiteSpace: 'normal', fontSize: 12 }}>
                        {row.remarks || DASH}
                      </td>

                      {/* Status */}
                      <td className="ax-table__td">
                        <ClaimStatusBadge status={row.status} />
                      </td>

                      {/* Payment Amount */}
                      <td className="ax-table__td" style={{ fontWeight: 600, color: '#16a34a' }}>
                        {row.payment_amount ? `₹ ${Number(row.payment_amount).toLocaleString('en-IN')}` : DASH}
                      </td>

                      {/* Payment Balance */}
                      <td className="ax-table__td" style={{ fontWeight: 600, color: '#d97706' }}>
                        {row.payment_balance ? `₹ ${Number(row.payment_balance).toLocaleString('en-IN')}` : DASH}
                      </td>

                      {/* Payment Date */}
                      <td className="ax-table__td" style={{ fontSize: 12 }}>
                        {txt(row, 'payment_date') || DASH}
                      </td>

                      {/* Payment Remarks */}
                      <td className="ax-table__td" style={{ maxWidth: 160, whiteSpace: 'normal', fontSize: 12 }}>
                        {row.payment_remarks || DASH}
                      </td>

                      {/* Payment Status */}
                      <td className="ax-table__td">
                        <PaymentStatusBadge status={row.payment_status} isClaimRaised={Boolean((row as any).has_claim || Number(row.status) > 0)} />
                      </td>

                      {/* Action */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                          {isNotRaised ? (
                            <>
                              <button
                                type="button"
                                className="ax-btn ax-btn--primary ax-btn--xs"
                                onClick={() => {
                                  const sId = String(row.site_id || row.id);
                                  setSelectedSiteId(sId);
                                  const pType = Number(row.pay_type || activePayType || 1);
                                  setClaimPayType(pType);
                                  handleOpenRaiseModal(pType, sId);
                                }}
                                style={{ height: 26, fontSize: 11, padding: '0 8px', fontWeight: 600 }}
                                title="Raise Claim for this site"
                              >
                                + Raise Claim
                              </button>
                              {invoiceUrl && (
                                <button
                                  type="button"
                                  className="ax-btn ax-btn--ghost ax-btn--xs"
                                  onClick={() => openPreview(invoiceUrl, `Document - ${row.site_name || row.id}`)}
                                  style={{ height: 26, fontSize: 11, padding: '0 8px' }}
                                >
                                  Inspect
                                </button>
                              )}
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                className="ax-btn ax-btn--ghost ax-btn--xs"
                                onClick={() => {
                                  if (invoiceUrl) {
                                    openPreview(invoiceUrl, `Claim Invoice - ${row.site_name || row.id}`);
                                  } else {
                                    alert(`Claim ${row.id} is under review.`);
                                  }
                                }}
                                style={{ height: 26, fontSize: 11, padding: '0 8px' }}
                              >
                                Inspect
                              </button>

                              {!isApproved && !(row as any).is_site_record && (
                                <button
                                  type="button"
                                  className="ax-btn ax-btn--secondary ax-btn--xs"
                                  onClick={() => handleOpenEditClaim(row.id)}
                                  title="Edit Claim Details"
                                  style={{ height: 26, fontSize: 11, padding: '0 8px' }}
                                >
                                  Edit
                                </button>
                              )}
                            </>
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

      {/* ── Raise New Claim Modal (API 12: POST /jk/resco-installation-add-claim) ── */}
      <Modal open={raiseModalOpen} onClose={closeRaiseModal} labelledBy="raise-resco-claim-title" dialogClass="ax-modal__dialog--md">
        <form onSubmit={handleRaiseClaimSubmit}>
          <div className="ax-modal__header">
            <div>
              <h4 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--ax-text-strong, #0f172a)' }} id="raise-resco-claim-title">
                Raise RESCO Installation Claim
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

            {/* Payment Milestone */}
            <div className="ax-modern-field">
              <label className="ax-modern-label" htmlFor="claim_pay_type">
                <span>Payment Milestone</span>
                <span className="ax-modern-req">*</span>
              </label>
              <select
                id="claim_pay_type"
                className="ax-input"
                style={{ width: '100%', height: 42 }}
                value={claimPayType}
                onChange={(e) => {
                  const nextPt = Number(e.target.value);
                  setClaimPayType(nextPt);
                  const eligible = getEligibleSitesForPayType(nextPt);
                  if (eligible.length > 0) {
                    setSitesDropdown(eligible);
                    if (!eligible.some((s: any) => String(s.id ?? s.site_id) === selectedSiteId)) {
                      setSelectedSiteId('');
                    }
                  }
                }}
                disabled={submittingClaim}
                required
              >
                <option value={1}>Payment 40 % (Milestone 1)</option>
                <option value={2}>Payment 30 % (Milestone 2)</option>
                <option value={3}>Payment 30 % (Milestone 3)</option>
              </select>
            </div>

            {/* Select Site */}
            <div className="ax-modern-field">
              <label className="ax-modern-label" htmlFor="claim_site_select">
                <span>Select Approved Site (Only Verified & Approved)</span>
                <span className="ax-modern-req">*</span>
              </label>
              <select
                id="claim_site_select"
                className="ax-input"
                style={{ width: '100%', height: 42 }}
                value={selectedSiteId}
                onChange={(e) => setSelectedSiteId(e.target.value)}
                disabled={loadingSites || submittingClaim}
                required
              >
                <option value="">-- Choose Verified & Approved Site --</option>
                {sitesDropdown.map((s) => {
                  const sid = String(s.id ?? s.site_id);
                  return (
                    <option key={sid} value={sid}>
                      {s.site_name || `Site ${sid}`} {s.district ? `(${s.district})` : ''} {s.sanction_load ? `[${s.sanction_load} kW]` : ''}
                    </option>
                  );
                })}
              </select>
              {loadingSites && (
                <div style={{ fontSize: 11, color: '#2563eb', marginTop: 2 }}>
                  <span className="ax-spinner" /> Loading verified & approved sites...
                </div>
              )}
              {!loadingSites && sitesDropdown.length === 0 && (
                <div style={{ fontSize: 11.5, color: '#b91c1c', marginTop: 4 }}>
                  ⚠️ Only verified & approved sites from Installation Details can raise claims. No approved sites found.
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
              disabled={submittingClaim || !selectedSiteId || !claimAmount || !claimInvoiceFile}
            >
              {submittingClaim ? 'Submitting Claim…' : 'Submit Claim Request'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Edit/Update Claim Modal (API 13 & 14) ── */}
      <Modal open={editClaimModalOpen} onClose={() => setEditClaimModalOpen(false)} labelledBy="edit-claim-title" dialogClass="ax-modal__dialog--md">
        <form onSubmit={handleSaveEditClaim}>
          <div className="ax-modal__header">
            <div>
              <h4 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--ax-text-strong, #0f172a)' }} id="edit-claim-title">
                Update RESCO Claim {editingClaimId}
              </h4>
            </div>
            <button
              type="button"
              className="ax-modal__close"
              onClick={() => setEditClaimModalOpen(false)}
              disabled={submittingEditClaim}
              aria-label="Close dialog"
            >
              ✕
            </button>
          </div>

          <div className="ax-modal__body" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {editClaimError && (
              <div style={{ padding: 12, borderRadius: 8, background: '#fef2f2', color: '#991b1b', fontSize: 13, fontWeight: 600, border: '1px solid #fecaca' }}>
                ✕ {editClaimError}
              </div>
            )}

            {editClaimLoading ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#2563eb' }}>
                <span className="ax-spinner" /> Loading claim details…
              </div>
            ) : (
              <>
                <div className="ax-modern-field">
                  <label className="ax-modern-label">
                    <span>Claim Amount (₹)</span>
                    <span className="ax-modern-req">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    className="ax-input"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    required
                  />
                </div>

                <div className="ax-modern-field">
                  <label className="ax-modern-label">
                    <span>Payment Milestone Type</span>
                  </label>
                  <select
                    className="ax-input"
                    value={editPayType}
                    onChange={(e) => setEditPayType(Number(e.target.value))}
                  >
                    <option value={1}>Milestone 1 (e.g. 50% / Initial)</option>
                    <option value={2}>Milestone 2 (e.g. 30% / Commissioning)</option>
                    <option value={3}>Milestone 3 (e.g. 20% / Final Handover)</option>
                  </select>
                </div>

                <div className="ax-modern-field">
                  <label className="ax-modern-label">
                    <span>Updated Invoice File (Optional)</span>
                  </label>
                  <input
                    ref={editFileRef}
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(e) => setEditInvoiceFile(e.target.files?.[0] || null)}
                  />
                </div>

                <div className="ax-modern-field">
                  <label className="ax-modern-label">
                    <span>Remarks</span>
                  </label>
                  <textarea
                    className="ax-input"
                    value={editRemarks}
                    onChange={(e) => setEditRemarks(e.target.value)}
                    rows={2}
                  />
                </div>
              </>
            )}
          </div>

          <div className="ax-modal__footer">
            <button
              type="button"
              className="ax-btn ax-btn--secondary"
              onClick={() => setEditClaimModalOpen(false)}
              disabled={submittingEditClaim}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="ax-btn ax-btn--primary"
              disabled={submittingEditClaim || !editAmount}
            >
              {submittingEditClaim ? 'Updating…' : 'Update Claim'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default RescoClaimRequest;
