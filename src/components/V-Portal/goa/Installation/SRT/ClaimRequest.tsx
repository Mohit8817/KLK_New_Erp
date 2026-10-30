import { createPortal } from 'react-dom';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import { useState, useMemo, useEffect, useCallback, useRef, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import { PageHead } from '../../../../shell/PageHead';
import {
  goaSrtInstallationService,
  getGoaSrtInstallationImageCandidates,
  type GoaSrtInstalledSiteItem,
  type GoaSrtSiteDropdownItem,
} from '../../goa-services/goaSrtInstallationService';
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

const mediaUrl = (path?: string | null): string => {
  if (!path) return '';
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  const candidates = getGoaSrtInstallationImageCandidates(path);
  return candidates[0] || `${BACKEND_BASE}/${path.replace(/^\/+/, '')}`;
};

const num = (x: unknown) => {
  const n = Number(x ?? 0);
  return isNaN(n) ? String(x ?? '0') : n.toLocaleString('en-IN');
};

const ICON_REFRESH = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
    <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
  </svg>
);

const DASH = '—';

/* ── Robust Table Image: Strict NO BORDER RADIUS ── */
function RobustClaimImage({
  path,
  alt,
  onClick,
}: {
  path?: string | null;
  alt: string;
  onClick?: () => void;
}) {
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [hasError, setHasError] = useState(false);

  const candidates = useMemo(() => getGoaSrtInstallationImageCandidates(path), [path]);

  useEffect(() => {
    setCandidateIndex(0);
    setHasError(false);
  }, [path]);

  if (!path || candidates.length === 0 || hasError) {
    return <span style={{ color: 'var(--ax-text-muted)', fontSize: '11px' }}>{DASH}</span>;
  }

  const currentSrc = candidates[candidateIndex];

  return (
    <img
      src={currentSrc}
      alt={alt}
      style={{
        width: 38,
        height: 38,
        objectFit: 'cover',
        borderRadius: 0,
        border: '1px solid var(--ax-border)',
        cursor: onClick ? 'pointer' : 'default',
        display: 'inline-block',
      }}
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

/* ───────── KPI Card (exact same as standard V-Portal view data) ───────── */
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
  icon, tone, label, value, sub,
}: {
  icon: ReactNode; tone: KpiTone; label: string;
  value: ReactNode; sub: string;
}) {
  const t = TONE[tone];
  return (
    <div className="ax-card ax-col--3" style={{ padding: '14px 18px', borderRadius: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ width: 28, height: 28, borderRadius: 8, background: t.bg, color: t.fg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ width: 15, height: 15, display: 'inline-flex' }}>{icon}</span>
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)', letterSpacing: '0.04em' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: t.fg, marginTop: 4 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>
        {sub}
      </div>
    </div>
  );
}

/* ── Status Badge Helper ── */
function ClaimStatusBadge({ status }: { status: unknown }) {
  const val = String(status ?? '').toLowerCase().trim();
  if (val === '2' || val === 'approved' || val === 'paid' || val === 'disbursed') {
    return <span className="ax-badge ax-badge--soft ax-badge--success">Approved / Paid</span>;
  }
  if (val === '3' || val === 'rejected' || val === 'reject') {
    return <span className="ax-badge ax-badge--soft ax-badge--danger">Rejected</span>;
  }
  if (val === '1' || val === 'raised') {
    return <span className="ax-badge ax-badge--soft ax-badge--info">Raised</span>;
  }
  return <span className="ax-badge ax-badge--soft ax-badge--warning">Pending</span>;
}

/* ───────── Responsive page CSS (Exact matching ViewInstallation & standard ERP) ───────── */
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

const OVERLAY_CSS = `
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
`;

/* ── Lightbox Zoom Steps ── */
const ZOOM_STEPS = [1, 1.5, 2, 3];

function ImagePreviewModal({ url, title, onClose }: { url: string; title: string; onClose: () => void }) {
  const [zoomIdx, setZoomIdx] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const zoom = ZOOM_STEPS[zoomIdx];
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, true);

  useEffect(() => {
    setZoomIdx(0);
    setStatus('loading');
  }, [url]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div className="ax-modal" role="dialog" aria-modal="true" onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div
        ref={dialogRef}
        className="ax-modal__dialog ax-modal__dialog--lg"
        onClick={(e) => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', width: '100%', maxWidth: 860, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)' }}
      >
        <div className="ax-modal__header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--ax-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{title || 'Media Preview'}</h4>
          <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" onClick={onClose} aria-label="Close dialog">✕</button>
        </div>

        <div className="ax-modal__body" style={{ padding: 0 }}>
          <div className="ula-m-stage">
            {status === 'loading' && <div className="ula-m-stage__msg"><span className="ax-spinner" /> Loading image…</div>}
            {status === 'error' && <div className="ula-m-stage__msg">Image could not be loaded. Try opening it in a new tab.</div>}
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

        <div className="ax-modal__footer" style={{ padding: '12px 20px', borderTop: '1px solid var(--ax-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="ula-m-zoom" role="group" aria-label="Zoom">
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={() => setZoomIdx((i) => Math.max(0, i - 1))} disabled={zoomIdx === 0} aria-label="Zoom out">−</button>
            <span className="ula-m-zoom__val">{Math.round(zoom * 100)}%</span>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={() => setZoomIdx((i) => Math.min(ZOOM_STEPS.length - 1, i + 1))} disabled={zoomIdx === ZOOM_STEPS.length - 1} aria-label="Zoom in">+</button>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <a href={url} target="_blank" rel="noreferrer" className="ax-btn ax-btn--secondary ax-btn--sm">Open Full</a>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

const actionsRowStyle = {
  gap: 'var(--ax-space-2)',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'flex-end',
  width: '100%',
} as const;

export function Goa_Installation_SRT_ClaimRequest() {
  const [claims, setClaims] = useState<GoaSrtInstalledSiteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

  // Modals
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  // New Claim Modal State
  const [newClaimModal, setNewClaimModal] = useState(false);
  const [eligibleSites, setEligibleSites] = useState<GoaSrtSiteDropdownItem[]>([]);
  const [loadingSites, setLoadingSites] = useState(false);
  const [claimSiteId, setClaimSiteId] = useState('');
  const [claimAmount, setClaimAmount] = useState('');
  const [claimRemarks, setClaimRemarks] = useState('');
  const [claimInvoiceFile, setClaimInvoiceFile] = useState<File | null>(null);
  const [submittingClaim, setSubmittingClaim] = useState(false);

  // Raise 3rd Payment Modal State
  const [pay3Modal, setPay3Modal] = useState<GoaSrtInstalledSiteItem | null>(null);
  const [genImage, setGenImage] = useState<File | null>(null);
  const [rmsLoggerImage, setRmsLoggerImage] = useState<File | null>(null);
  const [submittingPay3, setSubmittingPay3] = useState(false);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await goaSrtInstallationService.getViewPayments();
      setClaims(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.warn('[Goa SRT ClaimRequest] load error:', err);
      setFeedback({ type: 'danger', text: err?.message || 'Failed to load SRT claim records.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load eligible sites for raising claim
  const handleOpenClaimModal = async () => {
    setNewClaimModal(true);
    setClaimSiteId('');
    setClaimAmount('');
    setClaimRemarks('');
    setClaimInvoiceFile(null);
    setLoadingSites(true);
    try {
      const list = await goaSrtInstallationService.fetchSiteNames();
      setEligibleSites(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('[Goa SRT ClaimRequest] fetchSiteNames error:', err);
    } finally {
      setLoadingSites(false);
    }
  };

  // Submit Claim
  const handleSubmitClaim = async (e: FormEvent) => {
    e.preventDefault();
    if (!claimSiteId || !claimAmount || !claimInvoiceFile) {
      alert('Please fill all mandatory fields and upload the invoice file.');
      return;
    }
    setSubmittingClaim(true);
    try {
      const fd = new FormData();
      fd.append('site_id', claimSiteId);
      fd.append('inst_claim_amount', claimAmount);
      fd.append('inst_claim_remarks', claimRemarks || '');
      fd.append('inst_claim_invoice', claimInvoiceFile);

      await goaSrtInstallationService.raiseClaim(fd);
      setFeedback({ type: 'success', text: 'Installation claim submitted successfully!' });
      setNewClaimModal(false);
      loadData();
    } catch (err: any) {
      alert(err?.message || 'Failed to raise installation claim');
    } finally {
      setSubmittingClaim(false);
    }
  };

  // Submit 3rd Payment (15%)
  const handleSubmitPay3 = async (e: FormEvent) => {
    e.preventDefault();
    if (!pay3Modal || !genImage || !rmsLoggerImage) {
      alert('Please provide both generation photo and RMS logger photo.');
      return;
    }
    setSubmittingPay3(true);
    try {
      const fd = new FormData();
      fd.append('site_id', String(pay3Modal.id));
      fd.append('inst_gen_image', genImage);
      fd.append('inst_rms_loger_image', rmsLoggerImage);

      await goaSrtInstallationService.raisePayment3(fd);
      setFeedback({ type: 'success', text: '3rd Payment (15%) claim raised successfully!' });
      setPay3Modal(null);
      setGenImage(null);
      setRmsLoggerImage(null);
      loadData();
    } catch (err: any) {
      alert(err?.message || 'Failed to raise 3rd payment claim');
    } finally {
      setSubmittingPay3(false);
    }
  };

  // Submit Document
  const handleSubmitDoc = async (siteId: number | string) => {
    if (!confirm('Are you sure you want to submit the installation compliance documents for verification?')) return;
    try {
      await goaSrtInstallationService.submitDocument(siteId);
      setFeedback({ type: 'success', text: 'Documents submitted successfully for audit review!' });
      loadData();
    } catch (err: any) {
      alert(err?.message || 'Failed to submit document');
    }
  };

  // Distinct districts
  const districts = useMemo(() => {
    const set = new Set<string>();
    claims.forEach((c) => {
      if (c.district) set.add(c.district.trim());
    });
    return Array.from(set).sort();
  }, [claims]);

  // Filtered claims
  const filteredClaims = useMemo(() => {
    const q = search.toLowerCase().trim();
    return claims.filter((c) => {
      if (districtFilter !== 'all' && (c.district || '').toLowerCase() !== districtFilter.toLowerCase()) {
        return false;
      }
      if (statusFilter !== 'all') {
        const st = Number(c.inst_claim_status ?? 0);
        if (statusFilter === 'approved' && st !== 2) return false;
        if (statusFilter === 'rejected' && st !== 3) return false;
        if (statusFilter === 'pending' && st !== 1 && st !== 0) return false;
      }
      if (!q) return true;
      const haystack = [
        c.site_name,
        c.district,
        c.ca_no,
        c.id,
        c.contact_person,
        c.contact_number,
        c.claim_updated_by,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [claims, search, districtFilter, statusFilter]);

  // Pagination (defaults to 100 rows per page)
  const paginatedClaims = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredClaims.slice(start, start + pageSize);
  }, [filteredClaims, currentPage, pageSize]);

  // Aggregated KPIs
  const totalClaims = claims.length;
  const totalAmount = claims.reduce((acc, c) => acc + (Number(c.inst_claim_amount) || 0), 0);
  const approvedClaims = claims.filter((c) => Number(c.inst_claim_status) === 2).length;
  const pendingClaims = claims.filter((c) => Number(c.inst_claim_status) === 1 || Number(c.inst_claim_status) === 0).length;
  const pay2Count = claims.filter((c) => Number(c.inst_pay2_status) === 1).length;
  const pay3Count = claims.filter((c) => Number(c.inst_pay3_status) === 1).length;

  // Export Columns (Exact match with table headers)
  const exportCols: ExportColumn<GoaSrtInstalledSiteItem>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_, idx) => idx + 1 },
      { header: 'State', accessor: (r) => r.state || 'Goa' },
      { header: 'District', accessor: (r) => r.district || DASH },
      { header: 'Site Name', accessor: (r) => r.site_name || `Site #${r.id}` },
      { header: 'Claim Raised Date', accessor: (r) => r.inst_claim_date || r.created_at || DASH },
      { header: 'Claim Invoice', accessor: (r) => (r.inst_claim_invoice ? 'Uploaded' : DASH) },
      { header: 'Claim Amount', accessor: (r) => `₹${num(r.inst_claim_amount)}` },
      { header: 'Claim Update Date', accessor: (r) => r.claim_updated_at || r.updated_at || DASH },
      { header: 'Claim Update by', accessor: (r) => r.claim_updated_by || DASH },
      {
        header: 'Claim Status',
        accessor: (r) =>
          Number(r.inst_claim_status) === 2 ? 'Approved' : Number(r.inst_claim_status) === 3 ? 'Rejected' : 'Pending',
      },
      { header: 'Payment 1st 70% Date', accessor: (r) => r.inst_pay1_date || DASH },
      { header: 'Payment 1st 70% Amount', accessor: (r) => `₹${num(r.inst_pay1_amount)}` },
      { header: 'Payment 1st 70% Status', accessor: (r) => (r.inst_pay1_status === 1 ? 'Paid' : 'Pending') },
      { header: 'Installation Inspection', accessor: (r) => r.inspection_status || 'Done' },
      { header: 'Document Submit', accessor: (r) => (r.inst_doc_submit === 1 ? 'Submitted' : 'Pending') },
      { header: 'Payment 2nd 15% Date', accessor: (r) => r.inst_pay2_date || DASH },
      { header: 'Payment 2nd 15% Amount', accessor: (r) => `₹${num(r.inst_pay2_amount)}` },
      { header: 'Payment 2nd 15% Status', accessor: (r) => (r.inst_pay2_status === 1 ? 'Paid' : 'Pending') },
      { header: 'Raised 3rd Payment 15%', accessor: (r) => (r.inst_pay3_raised_status === 1 ? 'Raised' : 'Not Raised') },
      { header: 'Generation Image', accessor: (r) => (r.inst_gen_image ? 'Uploaded' : DASH) },
      { header: 'RMS Logger Image', accessor: (r) => (r.inst_rms_loger_image ? 'Uploaded' : DASH) },
      { header: 'Payment 3rd 15% Date', accessor: (r) => r.inst_pay3_date || DASH },
      { header: 'Payment 3rd 15% Amount', accessor: (r) => `₹${num(r.inst_pay3_amount)}` },
      { header: 'Payment 3rd 15% Status', accessor: (r) => (r.inst_pay3_status === 1 ? 'Paid' : 'Pending') },
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
        subtitle="Manage rooftop solar subsidy disbursements, track multi-stage payouts (70% - 15% - 15%), and verify invoice compliance"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Goa' },
          { label: 'Installation' },
          { label: 'SRT', href: '/v/goa/vendor-srt-installation-dashboard' },
          { label: 'Claim Request' },
        ]}
        actions={
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}>
            <button
              type="button"
              className="ax-btn ax-btn--primary ax-btn--sm"
              onClick={handleOpenClaimModal}
            >
              + Raise Claim
            </button>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={loadData}
              disabled={loading}
            >
              <span className={loading ? 'ax-spinner' : ''}>{ICON_REFRESH}</span>
              <span className="ax-btn__label">Refresh</span>
            </button>
          </div>
        }
      />

      {feedback && (
        <div className={`ax-alert ax-alert--${feedback.type}`} style={{ marginBottom: 'var(--ax-space-4)' }}>
          <div className="ax-alert__content">{feedback.text}</div>
          <button type="button" className="ax-btn ax-btn--ghost ax-btn--xs" onClick={() => setFeedback(null)}>
            ✕
          </button>
        </div>
      )}

      {/* ── Summary KPI Cards (Exact 4 Cards) ── */}
      <div className="ax-dash-grid">
        {loading && !claims.length ? (
          <KpiSkeleton count={4} />
        ) : (
          <>
            <KpiCard
              tone="accent"
              label="Total Claims Raised"
              value={totalClaims.toLocaleString('en-IN')}
              sub="Claims in disbursement queue"
              icon={svg(<><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 9h8M8 13h8M8 17h5" /></>)}
            />
            <KpiCard
              tone="cyan"
              label="Total Claimed Amount"
              value={`₹${num(totalAmount)}`}
              sub="Cumulative invoice amount"
              icon={svg(<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h3" /></>)}
            />
            <KpiCard
              tone="emerald"
              label="Approved Claims"
              value={approvedClaims.toLocaleString('en-IN')}
              sub="Verified for stage disbursement"
              icon={svg(<><circle cx="12" cy="12" r="9" /><path d="M8 12l2.5 2.5L16 9" /></>)}
            />
            <KpiCard
              tone="amber"
              label="Pending Approval"
              value={pendingClaims.toLocaleString('en-IN')}
              sub="Awaiting verification audit"
              icon={svg(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>)}
            />
          </>
        )}

        {/* ── Main Table Card (Exact matching other view data files) ── */}
        <section className="ax-card ax-col--12" role="region" aria-labelledby="claim-table-title">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">PAYMENT MILESTONES</span>
              <h2 id="claim-table-title" className="ax-card__title">View Claim Request Information</h2>
              <p className="ax-card__subtitle ax-num" style={{ fontFamily: 'var(--ax-font-mono)' }}>
                {filteredClaims.length} of {claims.length} claim records
              </p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                {districts.length > 0 && (
                  <select
                    className="ax-input ax-input--sm"
                    style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                    value={districtFilter}
                    onChange={(e) => { setDistrictFilter(e.target.value); setCurrentPage(1); }}
                    aria-label="Filter by district"
                  >
                    <option value="all">All Districts</option>
                    {districts.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                )}

                <select
                  className="ax-input ax-input--sm"
                  style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                  aria-label="Filter by claim status"
                >
                  <option value="all">All Status</option>
                  <option value="approved">Approved / Paid</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>

                {(search || districtFilter !== 'all' || statusFilter !== 'all') && (
                  <button
                    type="button"
                    className="ax-btn ax-btn--ghost ax-btn--sm"
                    onClick={() => {
                      setSearch('');
                      setDistrictFilter('all');
                      setStatusFilter('all');
                      setCurrentPage(1);
                    }}
                    style={{ height: 30, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }}
                  >
                    Reset
                  </button>
                )}

                <SearchInput
                  value={search}
                  onChange={(v) => { setSearch(v); setCurrentPage(1); }}
                  placeholder="Search site, ID, district…"
                  size="sm"
                  ariaLabel="Search claim requests"
                />

                <TableExportToolbar
                  onCopy={() => copyTableDataToClipboard(filteredClaims, exportCols)}
                  onExportCSV={() => exportDataToCSV('Goa_SRT_Claims', filteredClaims, exportCols)}
                  onExportExcel={() => exportDataToExcel('Goa_SRT_Claims', filteredClaims, exportCols)}
                  onExportPDF={() => printTableData('Goa SRT Claim Requests Report', filteredClaims, exportCols)}
                />
              </div>
            </div>
          </div>

          <div className="ax-table-wrap">
            <table
              className="ax-table ax-table--hover ula-table--wide"
              style={{ whiteSpace: 'nowrap', minWidth: 2600 }}
            >
              <caption className="ax-visually-hidden">View Claim Request Information</caption>
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">Sr. No.</th>
                  <th className="ax-table__th" scope="col">State</th>
                  <th className="ax-table__th" scope="col">District</th>
                  <th className="ax-table__th" scope="col" style={{ minWidth: 160 }}>Site Name</th>
                  <th className="ax-table__th" scope="col">Claim Raised Date</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Claim Invoice</th>
                  <th className="ax-table__th" scope="col">Claim Amount</th>
                  <th className="ax-table__th" scope="col">Claim Update Date</th>
                  <th className="ax-table__th" scope="col">Claim Update by</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Claim Status</th>
                  <th className="ax-table__th" scope="col">Payment 1st 70% Date</th>
                  <th className="ax-table__th" scope="col">Payment 1st 70% Amount</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Payment 1st 70% Status</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Installation Inspection</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Document Submit</th>
                  <th className="ax-table__th" scope="col">Payment 2nd 15% Date</th>
                  <th className="ax-table__th" scope="col">Payment 2nd 15% Amount</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Payment 2nd 15% Status</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Raised 3rd Payment 15%</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Generation Image</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>RMS Logger Image</th>
                  <th className="ax-table__th" scope="col">Payment 3rd 15% Date</th>
                  <th className="ax-table__th" scope="col">Payment 3rd 15% Amount</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Payment 3rd 15% Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="ax-table__td" colSpan={24} style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--ax-text-muted)' }}>
                      <span className="ax-spinner" /> Loading claim requests...
                    </td>
                  </tr>
                ) : paginatedClaims.length === 0 ? (
                  <tr>
                    <td className="ax-table__td" colSpan={24} style={{ textAlign: 'center', padding: '36px 16px' }}>
                      <TableEmptyState
                        title="No claim request records found"
                        message={search ? 'No claim records match your search keyword.' : 'No installation claims have been raised yet.'}
                      />
                    </td>
                  </tr>
                ) : (
                  paginatedClaims.map((item, idx) => {
                    const srNo = (currentPage - 1) * pageSize + idx + 1;
                    const invoiceUrl = mediaUrl(item.inst_claim_invoice);

                    return (
                      <tr key={item.id || idx}>
                        <td className="ax-table__td" style={{ fontWeight: 600 }}>{srNo}</td>
                        <td className="ax-table__td" style={{ textTransform: 'capitalize' }}>{item.state || 'Goa'}</td>
                        <td className="ax-table__td" style={{ fontWeight: 600 }}>{item.district || DASH}</td>
                        <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.site_name}>
                          {item.site_name || `Site #${item.id}`}
                        </td>
                        <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: '11px' }}>
                          {item.inst_claim_date || item.created_at || DASH}
                        </td>

                        {/* Claim Invoice Link */}
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          {invoiceUrl ? (
                            <a
                              href={invoiceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="ax-btn ax-btn--secondary ax-btn--xs"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            >
                              📄 View Invoice
                            </a>
                          ) : (
                            <span style={{ color: 'var(--ax-text-muted)' }}>{DASH}</span>
                          )}
                        </td>

                        <td className="ax-table__td" style={{ fontWeight: 700, color: 'var(--ax-text-strong)', fontFamily: 'var(--ax-font-mono)' }}>
                          ₹{num(item.inst_claim_amount)}
                        </td>
                        <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: '11px' }}>
                          {item.claim_updated_at || item.updated_at || DASH}
                        </td>
                        <td className="ax-table__td">{item.claim_updated_by || DASH}</td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <ClaimStatusBadge status={item.inst_claim_status} />
                        </td>

                        {/* 1st 70% Payment */}
                        <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: '11px' }}>
                          {item.inst_pay1_date || DASH}
                        </td>
                        <td className="ax-table__td" style={{ fontWeight: 600, fontFamily: 'var(--ax-font-mono)' }}>
                          {item.inst_pay1_amount ? `₹${num(item.inst_pay1_amount)}` : DASH}
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          {item.inst_pay1_status === 1 ? (
                            <span className="ax-badge ax-badge--soft ax-badge--success">Paid</span>
                          ) : (
                            <span className="ax-badge ax-badge--soft ax-badge--warning">Pending</span>
                          )}
                        </td>

                        {/* Inspection & Document */}
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          {String(item.inspection_status || '').toLowerCase() === '1' || String(item.inspection_status || '').toLowerCase() === 'done' || String(item.inspection_status || '').toLowerCase() === 'complete' ? (
                            <span className="ax-badge ax-badge--soft ax-badge--success">Complete</span>
                          ) : (
                            <span className="ax-badge ax-badge--soft ax-badge--warning">Pending</span>
                          )}
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          {item.inst_doc_submit === 1 ? (
                            <span className="ax-badge ax-badge--soft ax-badge--success">Submitted</span>
                          ) : (
                            <button
                              type="button"
                              className="ax-btn ax-btn--secondary ax-btn--xs"
                              onClick={() => handleSubmitDoc(item.id)}
                            >
                              Submit Doc
                            </button>
                          )}
                        </td>

                        {/* 2nd 15% Payment */}
                        <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: '11px' }}>
                          {item.inst_pay2_date || DASH}
                        </td>
                        <td className="ax-table__td" style={{ fontWeight: 600, fontFamily: 'var(--ax-font-mono)' }}>
                          {item.inst_pay2_amount ? `₹${num(item.inst_pay2_amount)}` : DASH}
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          {item.inst_pay2_status === 1 ? (
                            <span className="ax-badge ax-badge--soft ax-badge--success">Paid</span>
                          ) : (
                            <span className="ax-badge ax-badge--soft ax-badge--warning">Pending</span>
                          )}
                        </td>

                        {/* Raised 3rd Payment 15% */}
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          {item.inst_pay3_raised_status === 1 ? (
                            <span className="ax-badge ax-badge--soft ax-badge--info">Raised</span>
                          ) : (
                            <button
                              type="button"
                              className="ax-btn ax-btn--primary ax-btn--xs"
                              onClick={() => setPay3Modal(item)}
                            >
                              Raise 3rd 15%
                            </button>
                          )}
                        </td>

                        {/* Generation Image with Preview (Strict NO Border Radius) */}
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <RobustClaimImage
                            path={item.inst_gen_image}
                            alt="Generation"
                            onClick={() => setPreviewImage({ url: mediaUrl(item.inst_gen_image), title: `${item.site_name || 'Site'} - Generation Photo` })}
                          />
                        </td>

                        {/* RMS Logger Image with Preview (Strict NO Border Radius) */}
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <RobustClaimImage
                            path={item.inst_rms_loger_image}
                            alt="RMS Logger"
                            onClick={() => setPreviewImage({ url: mediaUrl(item.inst_rms_loger_image), title: `${item.site_name || 'Site'} - RMS Logger Photo` })}
                          />
                        </td>

                        {/* 3rd 15% Payment */}
                        <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: '11px' }}>
                          {item.inst_pay3_date || DASH}
                        </td>
                        <td className="ax-table__td" style={{ fontWeight: 600, fontFamily: 'var(--ax-font-mono)' }}>
                          {item.inst_pay3_amount ? `₹${num(item.inst_pay3_amount)}` : DASH}
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          {item.inst_pay3_status === 1 ? (
                            <span className="ax-badge ax-badge--soft ax-badge--success">Paid</span>
                          ) : (
                            <span className="ax-badge ax-badge--soft ax-badge--warning">Pending</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="ax-card__footer" style={{ borderTop: '1px solid var(--ax-border, #e2e8f0)', padding: 'var(--ax-space-3) var(--ax-space-4)' }}>
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
                pageSizeOptions={[100, 200, 300]}
              />
            </div>
          </div>
        </section>
      </div>

      {/* ── Photo Preview Modal with Zoom ── */}
      {previewImage && (
        <ImagePreviewModal
          url={previewImage.url}
          title={previewImage.title}
          onClose={() => setPreviewImage(null)}
        />
      )}

      {/* ── Raise New Claim Modal ── */}
      {newClaimModal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => setNewClaimModal(false)}
        >
          <div
            style={{
              backgroundColor: 'var(--ax-surface-solid, #fff)',
              borderRadius: 14,
              width: '100%',
              maxWidth: 540,
              padding: 24,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Raise Installation Claim</h3>
              <button
                type="button"
                className="ax-btn ax-btn--ghost ax-btn--xs"
                onClick={() => setNewClaimModal(false)}
                style={{ fontSize: 16 }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitClaim}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                  Select Completed Site *
                </label>
                <select
                  className="ax-input"
                  style={{ width: '100%', height: 38 }}
                  value={claimSiteId}
                  onChange={(e) => setClaimSiteId(e.target.value)}
                  required
                  disabled={loadingSites}
                >
                  <option value="">{loadingSites ? 'Loading sites...' : '-- Select Eligible Site --'}</option>
                  {eligibleSites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.site_name || s.farmer_name} (ID #{s.id} - CA: {s.ca_no || DASH})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                  Claim Amount (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="ax-input"
                  style={{ width: '100%', height: 38 }}
                  placeholder="Enter invoice claim amount"
                  value={claimAmount}
                  onChange={(e) => setClaimAmount(e.target.value)}
                  required
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                  Invoice Document (PDF / Image) *
                </label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="ax-input"
                  style={{ width: '100%', padding: '6px 10px' }}
                  onChange={(e) => setClaimInvoiceFile(e.target.files?.[0] || null)}
                  required
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                  Remarks (Optional)
                </label>
                <textarea
                  className="ax-input"
                  style={{ width: '100%', minHeight: 64, padding: 8 }}
                  placeholder="Enter remarks or invoice details"
                  value={claimRemarks}
                  onChange={(e) => setClaimRemarks(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  className="ax-btn ax-btn--secondary"
                  onClick={() => setNewClaimModal(false)}
                  disabled={submittingClaim}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="ax-btn ax-btn--primary"
                  disabled={submittingClaim}
                >
                  {submittingClaim ? 'Submitting...' : 'Submit Claim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Raise 3rd Payment (15%) Modal ── */}
      {pay3Modal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => setPay3Modal(null)}
        >
          <div
            style={{
              backgroundColor: 'var(--ax-surface-solid, #fff)',
              borderRadius: 14,
              width: '100%',
              maxWidth: 520,
              padding: 24,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                Raise 3rd Payment (15%) - Site #{pay3Modal.id}
              </h3>
              <button
                type="button"
                className="ax-btn ax-btn--ghost ax-btn--xs"
                onClick={() => setPay3Modal(null)}
                style={{ fontSize: 16 }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: 13, color: 'var(--ax-text-muted)', marginBottom: 16 }}>
              Upload generation evidence and RMS logger photos to unlock final 15% disbursement.
            </p>

            <form onSubmit={handleSubmitPay3}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                  Generation Reading / Image *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  className="ax-input"
                  style={{ width: '100%', padding: '6px 10px' }}
                  onChange={(e) => setGenImage(e.target.files?.[0] || null)}
                  required
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                  RMS Logger Installation Image *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  className="ax-input"
                  style={{ width: '100%', padding: '6px 10px' }}
                  onChange={(e) => setRmsLoggerImage(e.target.files?.[0] || null)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  className="ax-btn ax-btn--secondary"
                  onClick={() => setPay3Modal(null)}
                  disabled={submittingPay3}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="ax-btn ax-btn--primary"
                  disabled={submittingPay3}
                >
                  {submittingPay3 ? 'Uploading...' : 'Submit 3rd Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Goa_Installation_SRT_ClaimRequest;
