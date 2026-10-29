import { useState, useMemo, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  arunachalShlInstallationService,
  resolveArunachalMediaUrl,
  getArunachalMediaCandidates,
  type ArunachalInstalledLightItem,
  type ArunachalInstallDetailSummary,
  type ArunachalViewInstallationResponse,
} from '../../arunachal-services';
import {
  TableExportToolbar,
  SearchInput,
  Pagination,
  TableEmptyState,
  KpiSkeleton,
  copyTableDataToClipboard,
  exportDataToCSV,
  exportDataToExcel,
  printTableData,
  type ExportColumn,
} from '../../../../../common';

type Row = ArunachalInstalledLightItem;
type TabFilter = 'all' | 'completed' | 'payment';
type VerifyStatusFilter = 'all' | 'approved' | 'pending' | 'rejected';

const DASH = '—';
const txt = (v: unknown) => (v === null || v === undefined || v === '' ? DASH : String(v));

/* ── Status helpers ──
   Approved = inst_verify_status === 1 → edit locked */
const isVerified = (r: Row) => Number(r.inst_verify_status ?? r.verify_status) === 1;
const isVerifyRejected = (r: Row) => Number(r.inst_verify_status ?? r.verify_status) === 2;
const isLocked = (r: Row) => isVerified(r);

/* ───────── Responsive page CSS (Exact Bihar Complaint / Solar ERP Reference) ───────── */
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

  /* Modal & Lightbox Styles */
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
  .ax-modal__dialog--lg { max-width: 900px; }
  .ax-modal__header {
    padding: 16px 20px;
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
  .ax-modal__body {
    padding: 0; overflow-y: auto; max-height: calc(85vh - 120px);
  }
  .ax-modal__footer {
    padding: 14px 20px;
    border-top: 1px solid var(--ax-border, #e2e8f0);
    background: var(--ax-surface-subtle, #f8fafc);
    display: flex; align-items: center; justify-content: space-between;
  }
  .ula-m-stage {
    position: relative; display: flex; overflow: auto;
    height: min(66vh, 600px); background: #0f172a;
  }
  .ula-m-stage__msg {
    position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 8px;
    font-size: 13px; color: #94a3b8; text-align: center; padding: 16px;
  }
  .ula-m-zoom { display: inline-flex; align-items: center; gap: 8px; }
  .ula-m-zoom__val { min-width: 44px; text-align: center; font-size: 12px; color: var(--ax-text-muted, #64748b); }
`;

const actionsRowStyle = { gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', width: '100%' } as const;

/* ───────── KPI card (Exact from reference) ───────── */
type KpiTone = 'accent' | 'cyan' | 'emerald' | 'amber';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(var(--ax-accent-rgb), 0.12)', fg: 'var(--ax-accent)' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan) 14%, transparent)', fg: 'var(--ax-viz-cyan)' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald) 14%, transparent)', fg: 'var(--ax-viz-emerald)' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber) 14%, transparent)', fg: 'var(--ax-viz-amber)' },
};

const svgIcon = (children: ReactNode) => (
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
      <div style={{ fontSize: 24, fontWeight: 800, color: t.fg, marginTop: 4 }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>{sub}</div>
    </div>
  );
}

/* ───────── Photo Modal Helper ───────── */
const X_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 16, height: 16 }}>
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

const ZOOM_STEPS = [1, 1.5, 2, 3];

function ImagePreviewModal({ url, title, onClose }: { url: string; title: string; onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, true);

  const [zoomIdx, setZoomIdx] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const zoom = ZOOM_STEPS[zoomIdx];

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
    <div className="ax-modal" role="dialog" aria-modal="true" aria-labelledby="arunachal-preview-title">
      <div className="ax-modal__backdrop" onClick={onClose} />
      <div ref={dialogRef} className="ax-modal__dialog ax-modal__dialog--lg">
        <div className="ax-modal__header">
          <h2 className="ax-modal__title" id="arunachal-preview-title" style={{ fontSize: 15, fontWeight: 600 }}>{title || 'Installation Photograph'}</h2>
          <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">{X_ICON}</button>
        </div>

        <div className="ax-modal__body">
          <div className="ula-m-stage">
            {status === 'loading' && (
              <div className="ula-m-stage__msg"><span className="ax-spinner" /> Loading photograph…</div>
            )}
            {status === 'error' && (
              <div className="ula-m-stage__msg">Photograph could not be loaded. Try opening it in a new tab.</div>
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

        <div className="ax-modal__footer">
          <div className="ula-m-zoom" role="group" aria-label="Zoom controls">
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={() => setZoomIdx((i) => Math.max(0, i - 1))} disabled={zoomIdx === 0} aria-label="Zoom out">−</button>
            <span className="ula-m-zoom__val">{Math.round(zoom * 100)}%</span>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={() => setZoomIdx((i) => Math.min(ZOOM_STEPS.length - 1, i + 1))} disabled={zoomIdx === ZOOM_STEPS.length - 1} aria-label="Zoom in">+</button>
          </div>
          <div style={{ display: 'inline-flex', gap: 8 }}>
            <a href={url} target="_blank" rel="noreferrer" className="ax-btn ax-btn--ghost ax-btn--sm">Open in new tab ↗</a>
            <button type="button" className="ax-btn ax-btn--primary ax-btn--sm" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ── Interactive Image Thumbnail ── */
function InstallationThumbnail({
  src,
  alt,
  onPreview,
  size = 36,
}: {
  src?: string | null;
  alt: string;
  onPreview: (url: string, title: string) => void;
  size?: number;
}) {
  const candidates = useMemo(() => getArunachalMediaCandidates(src), [src]);
  const [candidateIdx, setCandidateIdx] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setCandidateIdx(0);
    setFailed(false);
  }, [src]);

  if (!src || failed || candidateIdx >= candidates.length) {
    return <span style={{ color: 'var(--ax-text-muted)' }}>{DASH}</span>;
  }

  const currentUrl = candidates[candidateIdx];

  return (
    <img
      src={currentUrl}
      alt={alt}
      style={{
        width: size,
        height: size,
        borderRadius: 4,
        objectFit: 'cover',
        cursor: 'zoom-in',
        border: '1px solid var(--ax-border, #cbd5e1)',
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
      title="Click to preview photograph"
    />
  );
}

/* ── Filter Tabs ── */
const FILTER_TABS: { key: TabFilter; label: string }[] = [
  { key: 'all', label: 'All Lights' },
  { key: 'completed', label: 'Lights Completed' },
  { key: 'payment', label: 'Payment Lights' },
];

/* ── Table Export Columns ── */
const EXPORT_COLS: ExportColumn<Row>[] = [
  { header: 'UID', accessor: (r) => r.unique_id || `AR-SHL-${r.id}` },
  { header: 'State', accessor: (r) => r.state || 'Arunachal Pradesh' },
  { header: 'Phase', accessor: (r) => r.phase || '1' },
  { header: 'District', accessor: (r) => r.district ?? '' },
  { header: 'Block', accessor: (r) => r.block ?? '' },
  { header: 'Panchayat', accessor: (r) => r.panchayat ?? '' },
  { header: 'Ward No.', accessor: (r) => r.ward_no ?? '' },
  { header: 'Pole No.', accessor: (r) => r.pole_no ?? '' },
  { header: 'Beneficiary Name', accessor: (r) => r.beneficiary_name ?? '' },
  { header: 'Beneficiary Contact', accessor: (r) => r.contact_no ?? '' },
  { header: 'UUID No.', accessor: (r) => r.uuid_no ?? '' },
  { header: 'Light No.', accessor: (r) => r.light_no ?? '' },
  { header: 'Panel No.', accessor: (r) => r.panel_no ?? '' },
  { header: 'Battery No.', accessor: (r) => r.battery_serial_no || r.battery_no || '' },
  { header: 'Latitude', accessor: (r) => r.latitude ?? '' },
  { header: 'Longitude', accessor: (r) => r.longitude ?? '' },
  { header: 'Remark', accessor: (r) => r.remark || r.inst_remark || '' },
  {
    header: 'Verify Status',
    accessor: (r) => (Number(r.inst_verify_status ?? r.verify_status) === 1 ? 'Approved' : Number(r.inst_verify_status ?? r.verify_status) === 2 ? 'Rejected' : 'Pending'),
  },
  {
    header: 'Claim Status',
    accessor: (r) => (Number(r.inst_claim_status) === 2 ? 'Approved' : Number(r.inst_claim_status) === 3 ? 'Rejected' : Number(r.inst_claim_status) === 1 ? 'Raised' : 'Not Raised'),
  },
  {
    header: 'Payment Status',
    accessor: (r) => (Number(r.inst_pay_status) === 1 ? 'Paid' : 'Pending'),
  },
];

export function Arunachal_Installation_SHL_InstallationDetail() {
  const navigate = useNavigate();

  const [data, setData] = useState<ArunachalViewInstallationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<VerifyStatusFilter>('all');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

  // Photo preview modal
  const [preview, setPreview] = useState<{ url: string; title: string } | null>(null);
  const openPreview = useCallback((url: string, title: string) => setPreview({ url, title }), []);
  const closePreview = useCallback(() => setPreview(null), []);

  // Detail item modal
  const [detailModalItem, setDetailModalItem] = useState<Row | null>(null);

  // Load data from API 6: GET /arunachal/shl/installation/view-installation
  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await arunachalShlInstallationService.getViewInstallation();
      setData(res);
      const totalCount =
        (Array.isArray(res?.completelight) ? res.completelight.length : (res?.completelights?.length ?? 0)) +
        (Array.isArray(res?.paymentlight) ? res.paymentlight.length : (res?.paymentlights?.length ?? 0));
      if (totalCount === 0) {
        setErrorMsg('No installation records have been recorded yet.');
      }
    } catch (err: any) {
      console.error('[Arunachal SHL Installation] load error:', err);
      setErrorMsg(err?.message || 'Failed to load installation sites from server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Tab lists
  const completeList: Row[] = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data.completelight)) return data.completelight;
    if (Array.isArray(data.completelights)) return data.completelights;
    return [];
  }, [data]);

  const paymentList: Row[] = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data.paymentlight)) return data.paymentlight;
    if (Array.isArray(data.paymentlights)) return data.paymentlights;
    return [];
  }, [data]);

  // Merge completelight and paymentlight based on tab
  const allLights: Row[] = useMemo(() => {
    if (!data) return [];
    if (activeTab === 'completed') return completeList;
    if (activeTab === 'payment') return paymentList;

    // 'all': merge unique by id
    const map = new Map<number, Row>();
    completeList.forEach((item) => map.set(item.id, item));
    paymentList.forEach((item) => {
      if (!map.has(item.id)) {
        map.set(item.id, item);
      }
    });
    return Array.from(map.values());
  }, [data, activeTab, completeList, paymentList]);

  // Unique districts for filter dropdown
  const uniqueDistricts = useMemo(() => {
    const set = new Set<string>();
    allLights.forEach((r) => {
      if (r.district) set.add(r.district.trim());
    });
    return Array.from(set).sort();
  }, [allLights]);

  // Filtered lights
  const filteredLights = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allLights.filter((item) => {
      if (statusFilter === 'approved' && !isVerified(item)) return false;
      if (statusFilter === 'rejected' && !isVerifyRejected(item)) return false;
      if (statusFilter === 'pending' && (isVerified(item) || isVerifyRejected(item))) return false;
      if (selectedDistrict !== 'all' && item.district?.trim().toLowerCase() !== selectedDistrict.toLowerCase()) return false;
      if (q) {
        const hay = [
          item.unique_id, item.id, item.beneficiary_name, item.contact_no, item.district,
          item.block, item.panchayat, item.ward_no, item.pole_no, item.light_no,
          item.uuid_no, item.panel_no, item.battery_serial_no, item.battery_no,
        ];
        if (!hay.some((v) => String(v ?? '').toLowerCase().includes(q))) return false;
      }
      return true;
    });
  }, [allLights, search, statusFilter, selectedDistrict]);

  const pagedLights = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLights.slice(start, start + pageSize);
  }, [filteredLights, currentPage, pageSize]);

  // Summary counts from install_detail
  const summary: ArunachalInstallDetailSummary = data?.install_detail || {
    total: 0,
    complete: 0,
    pending: 0,
    verify_approved: 0,
    verify_pending: 0,
    verify_reject: 0,
    claim_applicable: 0,
    claim_raised: 0,
    claim_not_applicable: 0,
    claim_verify_approved: 0,
    claim_verify_pending: 0,
    claim_verify_reject: 0,
    payment_complete: 0,
    payment_pending: 0,
  };

  const hasFilters = !!search || statusFilter !== 'all' || selectedDistrict !== 'all';
  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setSelectedDistrict('all');
    setCurrentPage(1);
  };

  /* ── Export handlers ── */
  const handleCopy = () => copyTableDataToClipboard(filteredLights, EXPORT_COLS);
  const handleCsv = () => exportDataToCSV('Arunachal_SHL_Installations', filteredLights, EXPORT_COLS);
  const handleExcel = () => exportDataToExcel('Arunachal_SHL_Installations', filteredLights, EXPORT_COLS);
  const handlePdf = () => printTableData('Arunachal Pradesh SHL Installation Report', filteredLights, EXPORT_COLS);

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      {/* ── Page Head (Exact from reference) ── */}
      <PageHead
        title="Arunachal Pradesh SHL Installation Detail"
        subtitle="Review Arunachal Pradesh Solar Home Light (SHL) completed installations, payment batches & verification"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Arunachal Pradesh' },
          { label: 'Installation' },
          { label: 'SHL' },
          { label: 'Installation Detail' },
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
            <button
              type="button"
              className="ax-btn ax-btn--primary ax-btn--sm"
              onClick={() => navigate('/v/arunachal/shl/installation/install-light')}
            >
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 5l0 14" />
                <path d="M5 12l14 0" />
              </svg>
              <span className="ax-btn__label">Install Light</span>
            </button>
          </div>
        }
      />

      <div className="ax-dash-grid">
        {/* ── KPI Row (4 Cards layout matching reference) ── */}
        {loading ? (
          <KpiSkeleton count={4} />
        ) : (
          <>
            <KpiCard
              tone="accent"
              label="Total Installed"
              value={(summary.total ?? 0).toLocaleString('en-IN')}
              sub={`${summary.complete ?? 0} completed · ${summary.pending ?? 0} pending`}
              icon={svgIcon(
                <>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6" />
                  <path d="M9 15l2 2 4-4" />
                </>
              )}
            />
            <KpiCard
              tone="emerald"
              label="Verify Approved"
              value={(summary.verify_approved ?? 0).toLocaleString('en-IN')}
              sub={`${summary.verify_pending ?? 0} pending audit · ${summary.verify_reject ?? 0} rejected`}
              icon={svgIcon(
                <>
                  <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" />
                  <path d="M9 12l2 2 4-4" />
                </>
              )}
            />
            <KpiCard
              tone="cyan"
              label="Claim Applicable"
              value={(summary.claim_applicable ?? 0).toLocaleString('en-IN')}
              sub={`${summary.claim_raised ?? 0} claims raised`}
              icon={svgIcon(
                <>
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
                </>
              )}
            />
            <KpiCard
              tone="amber"
              label="Payment Done"
              value={(summary.payment_complete ?? 0).toLocaleString('en-IN')}
              sub={`${summary.payment_pending ?? 0} payment pending`}
              icon={svgIcon(
                <>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </>
              )}
            />
          </>
        )}

        {/* ── Filter Tabs (Exact from reference) ── */}
        <div className="ax-col--12">
          <div className="ax-cluster" role="tablist" aria-label="Installation filter tabs" style={{ gap: 'var(--ax-space-2)' }}>
            {FILTER_TABS.map((t) => {
              const active = t.key === activeTab;
              const count =
                t.key === 'completed'
                  ? completeList.length
                  : t.key === 'payment'
                  ? paymentList.length
                  : completeList.length + paymentList.length;
              return (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={`ax-btn ax-btn--sm ${active ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
                  onClick={() => {
                    setActiveTab(t.key);
                    setCurrentPage(1);
                  }}
                >
                  <span className="ax-btn__label">{t.label} ({loading ? '…' : count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Main Table Card (The Table is ALWAYS present in DOM, never removed) ── */}
        <section className="ax-card ax-col--12" role="region" aria-label="Arunachal SHL Installation Details">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">
                {activeTab === 'completed'
                  ? 'Completed SHL Installations'
                  : activeTab === 'payment'
                  ? 'Payment Ready Installations'
                  : 'All SHL Installations'}
              </h2>
              <p className="ax-card__subtitle">
                <span className="ax-num">{filteredLights.length}</span> of <span className="ax-num">{allLights.length}</span> installations
                {' '}· Total <b className="ax-num">{summary.total}</b> · Verified <b className="ax-num">{summary.verify_approved}</b> · Paid <b className="ax-num">{summary.payment_complete}</b>
              </p>
            </div>

            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                <select
                  className="ax-input ax-input--sm"
                  aria-label="Filter by district"
                  value={selectedDistrict}
                  onChange={(e) => {
                    setSelectedDistrict(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                >
                  <option value="all">All Districts</option>
                  {uniqueDistricts.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>

                <select
                  className="ax-input ax-input--sm"
                  aria-label="Filter by verify status"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as VerifyStatusFilter);
                    setCurrentPage(1);
                  }}
                  style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                >
                  <option value="all">All Verify Status</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>

                {hasFilters && (
                  <button
                    type="button"
                    className="ax-btn ax-btn--ghost ax-btn--sm"
                    onClick={clearFilters}
                    style={{ height: 30, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }}
                  >
                    Reset
                  </button>
                )}

                <SearchInput
                  value={search}
                  onChange={(val) => {
                    setSearch(val);
                    setCurrentPage(1);
                  }}
                  placeholder="Search UID, pole, contact…"
                  size="sm"
                  ariaLabel="Search installations"
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

          {/* ── Table is ALWAYS rendered (Headers & Columns are never removed) ── */}
          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap' }}>
              <caption className="ax-visually-hidden">Arunachal SHL Installation Details</caption>
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">Sr. No.</th>
                  <th className="ax-table__th" scope="col">UID</th>
                  <th className="ax-table__th" scope="col">State</th>
                  <th className="ax-table__th" scope="col">Phase</th>
                  <th className="ax-table__th" scope="col">District</th>
                  <th className="ax-table__th" scope="col">Block</th>
                  <th className="ax-table__th" scope="col">Panchayat</th>
                  <th className="ax-table__th" scope="col">Ward No.</th>
                  <th className="ax-table__th" scope="col">Pole No.</th>
                  <th className="ax-table__th" scope="col">Beneficiary Name</th>
                  <th className="ax-table__th" scope="col">Beneficiary Contact</th>
                  <th className="ax-table__th" scope="col">UUID No.</th>
                  <th className="ax-table__th" scope="col">Light No.</th>
                  <th className="ax-table__th" scope="col">Panel No.</th>
                  <th className="ax-table__th" scope="col">Battery No.</th>
                  <th className="ax-table__th" scope="col">Light Image</th>
                  <th className="ax-table__th" scope="col">Latitude</th>
                  <th className="ax-table__th" scope="col">Longitude</th>
                  <th className="ax-table__th" scope="col">Remark</th>
                  <th className="ax-table__th" scope="col">Verify Status</th>
                  <th className="ax-table__th" scope="col">Claim Status</th>
                  <th className="ax-table__th" scope="col">Payment Status</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody aria-busy={loading}>
                {loading && (
                  <tr>
                    <td colSpan={23} style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--ax-text-muted)' }}>
                      <span className="ax-spinner" style={{ width: 20, height: 20, marginRight: 8, verticalAlign: 'middle' }} />
                      Loading Arunachal SHL installation records from server…
                    </td>
                  </tr>
                )}
                {!loading && filteredLights.length === 0 && (
                  <tr>
                    <td colSpan={23} style={{ padding: 0 }}>
                      <TableEmptyState
                        title="No installation records found"
                        message={
                          hasFilters
                            ? 'No installations match your filters. Try clearing filters or search term.'
                            : errorMsg || 'No Arunachal SHL installations recorded yet.'
                        }
                        onClear={hasFilters ? clearFilters : undefined}
                        clearLabel="Clear filters"
                      />
                    </td>
                  </tr>
                )}
                {!loading &&
                  pagedLights.map((item, idx) => {
                    const srNo = (currentPage - 1) * pageSize + idx + 1;
                    const locked = isLocked(item);
                    const isRejected = isVerifyRejected(item);
                    const isClaimApproved = Number(item.inst_claim_status) === 2;
                    const isClaimRaised = Number(item.inst_claim_status) === 1;
                    const isClaimRejected = Number(item.inst_claim_status) === 3;
                    const isPaid = Number(item.inst_pay_status) === 1;

                    return (
                      <tr key={item.id ?? idx} className="ax-table__row">
                        <td className="ax-table__td ax-num">{srNo}</td>
                        <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono, monospace)', fontWeight: 600, color: 'var(--ax-accent)' }}>
                          {item.unique_id || `AR-SHL-${item.id}`}
                        </td>
                        <td className="ax-table__td">{txt(item.state || 'Arunachal Pradesh')}</td>
                        <td className="ax-table__td">{txt(item.phase || '1')}</td>
                        <td className="ax-table__td" style={{ fontWeight: 600 }}>{txt(item.district)}</td>
                        <td className="ax-table__td">{txt(item.block)}</td>
                        <td className="ax-table__td" style={{ maxWidth: 160, whiteSpace: 'normal', fontSize: 12 }}>
                          {txt(item.panchayat)}
                        </td>
                        <td className="ax-table__td">{txt(item.ward_no)}</td>
                        <td className="ax-table__td" style={{ fontWeight: 600 }}>{txt(item.pole_no)}</td>
                        <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                          {txt(item.beneficiary_name)}
                        </td>
                        <td className="ax-table__td">{txt(item.contact_no)}</td>
                        <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 11 }}>{txt(item.uuid_no)}</td>
                        <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 11 }}>{txt(item.light_no)}</td>
                        <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 11 }}>{txt(item.panel_no)}</td>
                        <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 11 }}>{txt(item.battery_serial_no || item.battery_no)}</td>
                        <td className="ax-table__td">
                          <InstallationThumbnail
                            src={item.light_file}
                            alt={`Light photo for ${item.unique_id || item.id}`}
                            onPreview={openPreview}
                          />
                        </td>
                        <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 11 }}>{txt(item.latitude)}</td>
                        <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 11 }}>{txt(item.longitude)}</td>
                        <td className="ax-table__td" style={{ maxWidth: 160, whiteSpace: 'normal', fontSize: 12 }}>
                          {txt(item.remark || item.inst_remark)}
                        </td>

                        {/* Verify Status Badge */}
                        <td className="ax-table__td">
                          <span
                            className={`ax-badge ax-badge--soft ax-badge--pill ${
                              locked
                                ? 'ax-badge--success'
                                : isRejected
                                ? 'ax-badge--danger'
                                : 'ax-badge--warning'
                            }`}
                          >
                            <span className="ax-badge__dot" />
                            {locked ? 'Approved' : isRejected ? 'Rejected' : 'Pending'}
                          </span>
                        </td>

                        {/* Claim Status Badge */}
                        <td className="ax-table__td">
                          <span
                            className={`ax-badge ax-badge--soft ax-badge--pill ${
                              isClaimApproved
                                ? 'ax-badge--success'
                                : isClaimRejected
                                ? 'ax-badge--danger'
                                : isClaimRaised
                                ? 'ax-badge--info'
                                : 'ax-badge--neutral'
                            }`}
                          >
                            <span className="ax-badge__dot" />
                            {isClaimApproved ? 'Approved' : isClaimRejected ? 'Rejected' : isClaimRaised ? 'Raised' : 'Not Raised'}
                          </span>
                        </td>

                        {/* Payment Status Badge */}
                        <td className="ax-table__td">
                          <span
                            className={`ax-badge ax-badge--soft ax-badge--pill ${
                              isPaid ? 'ax-badge--success' : 'ax-badge--warning'
                            }`}
                          >
                            <span className="ax-badge__dot" />
                            {isPaid ? 'Paid' : 'Pending'}
                          </span>
                        </td>

                        {/* Action: View + Edit/Locked */}
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
                            <button
                              type="button"
                              className="ax-btn ax-btn--ghost ax-btn--sm"
                              onClick={() => setDetailModalItem(item)}
                              title="View installation details"
                              style={{ padding: '0 8px' }}
                            >
                              View
                            </button>
                            {locked ? (
                              <span
                                className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--pill"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', fontSize: 11.5, cursor: 'not-allowed' }}
                                title="Light verified & approved — edit locked"
                              >
                                <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                  <rect x="5" y="11" width="14" height="10" rx="2" />
                                  <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                                </svg>
                                Locked
                              </span>
                            ) : (
                              <button
                                type="button"
                                className="ax-btn ax-btn--secondary ax-btn--sm"
                                onClick={() => navigate(`/v/arunachal/shl/installation/install-light?light_id=${item.id}`)}
                              >
                                Edit
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

          {/* ── Table Footer & Left-aligned Pagination (Always rendered) ── */}
          <div className="ax-card__footer">
            <div className="ula-pagination-left">
              <Pagination
                currentPage={currentPage}
                pageSize={pageSize}
                totalItems={filteredLights.length}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                pageSizeOptions={[100, 200, 300]}
              />
            </div>
          </div>
        </section>
      </div>

      {/* ── Lightbox Photo Preview Modal ── */}
      {preview && (
        <ImagePreviewModal
          url={preview.url}
          title={preview.title}
          onClose={closePreview}
        />
      )}

      {/* ── View Light Detail Modal ── */}
      {detailModalItem && (
        <div className="ax-modal" role="dialog" aria-modal="true" aria-labelledby="shl-view-detail-title">
          <div className="ax-modal__backdrop" onClick={() => setDetailModalItem(null)} />
          <div className="ax-modal__dialog" style={{ maxWidth: 640 }}>
            <div className="ax-modal__header">
              <h2 className="ax-modal__title" id="shl-view-detail-title" style={{ fontSize: 15, fontWeight: 600 }}>
                Installation Detail: {detailModalItem.unique_id || `AR-SHL-${detailModalItem.id}`}
              </h2>
              <button
                type="button"
                className="ax-modal__close"
                onClick={() => setDetailModalItem(null)}
                aria-label="Close dialog"
              >
                {X_ICON}
              </button>
            </div>
            <div className="ax-modal__body" style={{ padding: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13, marginBottom: 16 }}>
                <div><span style={{ color: 'var(--ax-text-muted)' }}>Unique ID:</span> <b>{detailModalItem.unique_id || '—'}</b></div>
                <div><span style={{ color: 'var(--ax-text-muted)' }}>Beneficiary:</span> <b>{detailModalItem.beneficiary_name || '—'}</b></div>
                <div><span style={{ color: 'var(--ax-text-muted)' }}>Contact:</span> <b>{detailModalItem.contact_no || '—'}</b></div>
                <div><span style={{ color: 'var(--ax-text-muted)' }}>District:</span> <b>{detailModalItem.district || '—'}</b></div>
                <div><span style={{ color: 'var(--ax-text-muted)' }}>Block:</span> <b>{detailModalItem.block || '—'}</b></div>
                <div><span style={{ color: 'var(--ax-text-muted)' }}>Panchayat:</span> <b>{detailModalItem.panchayat || '—'}</b></div>
                <div><span style={{ color: 'var(--ax-text-muted)' }}>Ward No:</span> <b>{detailModalItem.ward_no || '—'}</b></div>
                <div><span style={{ color: 'var(--ax-text-muted)' }}>Pole No:</span> <b>{detailModalItem.pole_no || '—'}</b></div>
                <div><span style={{ color: 'var(--ax-text-muted)' }}>UUID:</span> <b>{detailModalItem.uuid_no || '—'}</b></div>
                <div><span style={{ color: 'var(--ax-text-muted)' }}>Light No:</span> <b>{detailModalItem.light_no || '—'}</b></div>
                <div><span style={{ color: 'var(--ax-text-muted)' }}>Panel No:</span> <b>{detailModalItem.panel_no || '—'}</b></div>
                <div><span style={{ color: 'var(--ax-text-muted)' }}>Battery No:</span> <b>{detailModalItem.battery_serial_no || detailModalItem.battery_no || '—'}</b></div>
                <div><span style={{ color: 'var(--ax-text-muted)' }}>Latitude:</span> <b>{detailModalItem.latitude || '—'}</b></div>
                <div><span style={{ color: 'var(--ax-text-muted)' }}>Longitude:</span> <b>{detailModalItem.longitude || '—'}</b></div>
              </div>

              {detailModalItem.light_file && (
                <div style={{ marginTop: 12, borderTop: '1px solid var(--ax-border, #e2e8f0)', paddingTop: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ax-text-muted)', display: 'block', marginBottom: 8 }}>
                    Installation Photograph:
                  </span>
                  <img
                    src={resolveArunachalMediaUrl(detailModalItem.light_file)}
                    alt="Installation evidence"
                    style={{ width: '100%', maxHeight: 260, objectFit: 'contain', borderRadius: 8, border: '1px solid var(--ax-border, #cbd5e1)', cursor: 'zoom-in' }}
                    onClick={() => openPreview(resolveArunachalMediaUrl(detailModalItem.light_file), 'Installation Photograph')}
                  />
                </div>
              )}
            </div>
            <div className="ax-modal__footer" style={{ justifyContent: 'flex-end', gap: 8 }}>
              {!isLocked(detailModalItem) && (
                <button
                  type="button"
                  className="ax-btn ax-btn--primary ax-btn--sm"
                  onClick={() => {
                    const id = detailModalItem.id;
                    setDetailModalItem(null);
                    navigate(`/v/arunachal/shl/installation/install-light?light_id=${id}`);
                  }}
                >
                  Edit Light
                </button>
              )}
              <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={() => setDetailModalItem(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Arunachal_Installation_SHL_InstallationDetail;
