import { useState, useMemo, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  goaSrtInstallationService,
  getGoaSrtInstallationImageCandidates,
  type GoaSrtCompletedData,
  type GoaSrtInstalledSiteItem,
} from '../../goa-services/goaSrtInstallationService';
import {
  Pagination,
  usePagination,
  SearchInput,
  TableExportToolbar,
  TableEmptyState,
  copyTableDataToClipboard,
  exportDataToCSV,
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

const ICON_REFRESH = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
    <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
  </svg>
);

const DASH = '—';
const num = (x: unknown) => (Number(x) || 0).toLocaleString('en-IN');

type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

const Badge = ({ tone, children }: { tone: Tone; children: ReactNode }) => (
  <span className={`ax-badge ax-badge--soft ax-badge--${tone}`}>{children}</span>
);

const VerifyBadge = ({ value }: { value: number }) =>
  value === 1 ? <Badge tone="success">Approved</Badge>
  : value === 2 ? <Badge tone="danger">Rejected</Badge>
  : <Badge tone="warning">Pending</Badge>;

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

/* ───────── Lightbox Modal ───────── */
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
    <div
      className="ax-modal"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        ref={dialogRef}
        className="ax-modal__dialog ax-modal__dialog--lg"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 12,
          overflow: 'hidden',
          width: '100%',
          maxWidth: 860,
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)',
        }}
      >
        <div
          className="ax-modal__header"
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--ax-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
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

        <div
          className="ax-modal__footer"
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--ax-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div className="ula-m-zoom">
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--xs"
              onClick={() => setZoomIdx((i) => Math.max(0, i - 1))}
              disabled={zoomIdx === 0}
            >
              −
            </button>
            <span className="ula-m-zoom__val">{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--xs"
              onClick={() => setZoomIdx((i) => Math.min(ZOOM_STEPS.length - 1, i + 1))}
              disabled={zoomIdx === ZOOM_STEPS.length - 1}
            >
              +
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <a href={url} target="_blank" rel="noreferrer" className="ax-btn ax-btn--ghost ax-btn--sm">
              Open Original ↗
            </a>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ───────── Responsive CSS ───────── */
const PAGE_CSS = `
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
    min-width: 180px;
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

export function Goa_Installation_SRT_ViewInstallation() {
  const navigate = useNavigate();
  const [data, setData] = useState<GoaSrtCompletedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'completed' | 'payment'>('completed');

  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [verifyFilter, setVerifyFilter] = useState('all');

  const [preview, setPreview] = useState<{ url: string; title: string } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await goaSrtInstallationService.getCompletedData();
      if (resp) setData(resp);
    } catch (err: any) {
      console.warn('[Goa SRT ViewInstallation] load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Current active list based on tab
  const currentList = useMemo(() => {
    if (!data) return [];
    return tab === 'completed' ? (data.completesite || []) : (data.paymentsite || []);
  }, [data, tab]);

  // Distinct districts
  const districts = useMemo(() => {
    const set = new Set<string>();
    currentList.forEach((r) => {
      const d = r.district || (r as any).district_name;
      if (d && String(d).trim()) set.add(String(d).trim());
    });
    return Array.from(set).sort();
  }, [currentList]);

  // Filtered Sites
  const filteredSites = useMemo(() => {
    return currentList.filter((r) => {
      // District filter
      if (districtFilter !== 'all') {
        const d = (r.district || (r as any).district_name || '').toLowerCase();
        if (d !== districtFilter.toLowerCase()) return false;
      }

      // Verification status filter (completed tab only)
      if (tab === 'completed' && verifyFilter !== 'all') {
        const vStatus = Number(r.inst_verify_status ?? (r as any).verify_status ?? 0);
        if (verifyFilter === 'approved' && vStatus !== 1) return false;
        if (verifyFilter === 'pending' && vStatus !== 0) return false;
        if (verifyFilter === 'rejected' && vStatus !== 2) return false;
      }

      // Search keyword
      if (search.trim()) {
        const q = search.toLowerCase();
        const site = (r.site_name || '').toLowerCase();
        const ca = (r.ca_no || '').toLowerCase();
        const contact = (r.contact_person || '').toLowerCase();
        const phone = (r.contact_number || '').toLowerCase();
        const inverter = (r.inverter_no || '').toLowerCase();
        const solar = (r.solarmeter_no || '').toLowerCase();
        const nmsm = (r.nm_sm_no || '').toLowerCase();
        const logger = (r.loger_no || '').toLowerCase();
        const dist = (r.district || '').toLowerCase();

        if (
          !site.includes(q) &&
          !ca.includes(q) &&
          !contact.includes(q) &&
          !phone.includes(q) &&
          !inverter.includes(q) &&
          !solar.includes(q) &&
          !nmsm.includes(q) &&
          !logger.includes(q) &&
          !dist.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [currentList, districtFilter, verifyFilter, search, tab]);

  // Pagination with 100 default rows
  const pagination = usePagination({ data: filteredSites, initialPageSize: 100 });

  useEffect(() => {
    pagination.setPage(1);
  }, [tab, districtFilter, verifyFilter, search]);

  const hasFilters = search.trim() !== '' || districtFilter !== 'all' || verifyFilter !== 'all';
  const resetFilters = () => {
    setSearch('');
    setDistrictFilter('all');
    setVerifyFilter('all');
    pagination.setPage(1);
  };

  // Export Columns
  const exportCols: ExportColumn<GoaSrtInstalledSiteItem>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r, i) => String((i || 0) + 1) },
      { header: 'State', accessor: (r) => r.state || 'goa' },
      { header: 'District', accessor: (r) => r.district || DASH },
      { header: 'Site Name', accessor: (r) => r.site_name || DASH },
      { header: 'Contact Person', accessor: (r) => r.contact_person || DASH },
      { header: 'Contact Number', accessor: (r) => r.contact_number || DASH },
      { header: 'CA No.', accessor: (r) => r.ca_no || DASH },
      { header: 'Solar Meter No.', accessor: (r) => r.solarmeter_no || DASH },
      { header: 'Inverter No.', accessor: (r) => r.inverter_no || DASH },
      { header: 'Net/Smart Meter No.', accessor: (r) => r.nm_sm_no || DASH },
      { header: 'Loger No.', accessor: (r) => r.loger_no || DASH },
      { header: 'Latitude', accessor: (r) => String(r.inst_latitude || DASH) },
      { header: 'Longitude', accessor: (r) => String(r.inst_longitude || DASH) },
      { header: 'Remark', accessor: (r) => r.inst_remarks || DASH },
      ...(tab === 'completed'
        ? [
            {
              header: 'Verify Status',
              accessor: (r: GoaSrtInstalledSiteItem) =>
                r.inst_verify_status === 1 ? 'Approved' : r.inst_verify_status === 2 ? 'Rejected' : 'Pending',
            },
            {
              header: 'Claim Status',
              accessor: (r: GoaSrtInstalledSiteItem) =>
                r.inst_claim_status === 1 ? 'Claim Raised' : 'Not Raised',
            },
          ]
        : []),
    ],
    [tab]
  );

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="View SRT Installation"
        subtitle="Master register of completed solar rooftop installations, payment stage sites, serial verifications, and compliance photos"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Goa' },
          { label: 'Installation' },
          { label: 'SRT', href: '/v/goa/vendor-srt-installation-dashboard' },
          { label: 'View Installation' },
        ]}
        actions={
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}>
            <Link to="/v/goa/srt/installationsite" className="ax-btn ax-btn--primary ax-btn--sm">
              + Installation Details
            </Link>
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
              Complete SRT ({data?.completesite?.length || 0})
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
              Payment SRT ({data?.paymentsite?.length || 0})
            </span>
          </button>
        </div>
      </div>

      <div className="ax-dash-grid">
        {/* ── Main Sites Table (Matches Bihar ULA ViewInstallation design exactly) ── */}
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
                {districts.length > 0 && (
                  <select
                    className="ax-input ax-input--sm"
                    style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                    value={districtFilter}
                    onChange={(e) => setDistrictFilter(e.target.value)}
                  >
                    <option value="all">All Districts</option>
                    {districts.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                )}

                {/* Verification Status Filter (completed tab only) */}
                {tab === 'completed' && (
                  <select
                    className="ax-input ax-input--sm"
                    style={{ width: 150, height: 32, fontSize: 'var(--ax-text-xs)' }}
                    value={verifyFilter}
                    onChange={(e) => setVerifyFilter(e.target.value)}
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

                {/* Search */}
                <SearchInput
                  value={search}
                  onChange={(v) => setSearch(v)}
                  placeholder="Search site, CA, meter, serial…"
                  size="sm"
                />

                {/* Export Toolbar */}
                <TableExportToolbar
                  onCopy={() => copyTableDataToClipboard(filteredSites, exportCols)}
                  onExportCSV={() => exportDataToCSV(`Goa_SRT_${tab}_Installation_Sites`, filteredSites, exportCols)}
                  onExportExcel={() => exportDataToExcel(`Goa_SRT_${tab}_Installation_Sites`, filteredSites, exportCols)}
                  onExportPDF={() => printTableData(`Goa SRT ${tab === 'completed' ? 'Complete' : 'Payment'} Installation Sites Report`, filteredSites, exportCols)}
                />
              </div>
            </div>
          </div>

          <div className="ax-table-wrap">
            <table
              className="ax-table ax-table--hover ula-table--wide"
              style={{ whiteSpace: 'nowrap', minWidth: 2400 }}
            >
              <caption className="ax-visually-hidden">View SRT Installation Information</caption>
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col" style={{ width: 60 }}>Sr. No.</th>
                  <th className="ax-table__th" scope="col">State</th>
                  <th className="ax-table__th" scope="col">District</th>
                  <th className="ax-table__th" scope="col" style={{ minWidth: 160 }}>Site Name</th>
                  <th className="ax-table__th" scope="col">Contact Person</th>
                  <th className="ax-table__th" scope="col">Contact Number</th>
                  <th className="ax-table__th" scope="col">CA No.</th>
                  <th className="ax-table__th" scope="col">Solar Meter No.</th>
                  <th className="ax-table__th" scope="col">Inverter No.</th>
                  <th className="ax-table__th" scope="col">Net/Smart Meter No.</th>
                  <th className="ax-table__th" scope="col">Loger No.</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>System Image</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Inverter Image</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Panel Image</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Net Meter/Smart Meter Image</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Loger Image</th>
                  <th className="ax-table__th" scope="col">Latitude</th>
                  <th className="ax-table__th" scope="col">Longitude</th>
                  <th className="ax-table__th" scope="col" style={{ minWidth: 140 }}>Remark</th>
                  {tab === 'completed' && (
                    <>
                      <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Verify Status</th>
                      <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Claim Status</th>
                      <th className="ax-table__th" scope="col" style={{ textAlign: 'center', width: 90 }}>Action</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody aria-busy={loading}>
                {loading ? (
                  <tr>
                    <td
                      className="ax-table__td"
                      colSpan={tab === 'completed' ? 22 : 19}
                      style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--ax-text-muted)' }}
                    >
                      <span className="ax-spinner" /> Loading installation sites...
                    </td>
                  </tr>
                ) : filteredSites.length === 0 ? (
                  <tr>
                    <td
                      className="ax-table__td"
                      colSpan={tab === 'completed' ? 22 : 19}
                      style={{ textAlign: 'center', padding: '36px 16px' }}
                    >
                      <TableEmptyState
                        title="No data available in table"
                        message={search ? 'No installation sites match your search keyword.' : 'No installation records available.'}
                      />
                    </td>
                  </tr>
                ) : (
                  pagination.paged.map((item, index) => {
                    const srNo = (pagination.currentPage - 1) * pagination.pageSize + index + 1;
                    const vStatus = Number(item.inst_verify_status ?? (item as any).verify_status ?? 0);
                    const cStatus = Number(item.inst_claim_status ?? (item as any).claim_status ?? 0);

                    return (
                      <tr key={item.id || index} className="ax-table__row">
                        <td className="ax-table__td ax-num" style={{ fontWeight: 600 }}>{srNo}</td>
                        <td className="ax-table__td" style={{ textTransform: 'capitalize' }}>{item.state || 'goa'}</td>
                        <td className="ax-table__td" style={{ fontWeight: 600 }}>{item.district || DASH}</td>
                        <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                          {item.site_name || `Site #${item.id}`}
                        </td>
                        <td className="ax-table__td">{item.contact_person || DASH}</td>
                        <td className="ax-table__td">{item.contact_number || DASH}</td>
                        <td className="ax-table__td ax-num">{item.ca_no || DASH}</td>
                        <td className="ax-table__td">{item.solarmeter_no || DASH}</td>
                        <td className="ax-table__td">{item.inverter_no || DASH}</td>
                        <td className="ax-table__td">{item.nm_sm_no || DASH}</td>
                        <td className="ax-table__td">{item.loger_no || DASH}</td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <RobustClaimImage
                            path={item.system_image}
                            alt="System Photo"
                            onClick={() => item.system_image && setPreview({ url: mediaUrl(item.system_image), title: `${item.site_name || 'Site'} - System Photo` })}
                          />
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <RobustClaimImage
                            path={item.inverter_image}
                            alt="Inverter Photo"
                            onClick={() => item.inverter_image && setPreview({ url: mediaUrl(item.inverter_image), title: `${item.site_name || 'Site'} - Inverter Photo` })}
                          />
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <RobustClaimImage
                            path={item.panel_image}
                            alt="Panel Photo"
                            onClick={() => item.panel_image && setPreview({ url: mediaUrl(item.panel_image), title: `${item.site_name || 'Site'} - Panel Photo` })}
                          />
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <RobustClaimImage
                            path={item.nm_sm_image}
                            alt="Net Meter/Smart Meter Photo"
                            onClick={() => item.nm_sm_image && setPreview({ url: mediaUrl(item.nm_sm_image), title: `${item.site_name || 'Site'} - Net Meter/Smart Meter Photo` })}
                          />
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <RobustClaimImage
                            path={item.loger_image}
                            alt="Loger Photo"
                            onClick={() => item.loger_image && setPreview({ url: mediaUrl(item.loger_image), title: `${item.site_name || 'Site'} - Loger Photo` })}
                          />
                        </td>
                        <td className="ax-table__td ax-num">{item.inst_latitude || DASH}</td>
                        <td className="ax-table__td ax-num">{item.inst_longitude || DASH}</td>
                        <td className="ax-table__td" style={{ maxWidth: 160, whiteSpace: 'normal' }}>
                          {item.inst_remarks || DASH}
                        </td>
                        {tab === 'completed' && (
                          <>
                            <td className="ax-table__td" style={{ textAlign: 'center' }}>
                              <VerifyBadge value={vStatus} />
                            </td>
                            <td className="ax-table__td" style={{ textAlign: 'center' }}>
                              {cStatus === 1 ? (
                                <Badge tone="info">Claim Raised</Badge>
                              ) : (
                                <Badge tone="neutral">Not Raised</Badge>
                              )}
                            </td>
                            <td className="ax-table__td" style={{ textAlign: 'center' }}>
                              <button
                                type="button"
                                className="ax-btn ax-btn--secondary ax-btn--xs"
                                onClick={() => navigate(`/v/goa/srt/installationsite?id=${item.id}&edit=1`)}
                                title="Edit installation details"
                              >
                                Edit
                              </button>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="ax-card__footer" style={footerStyle}>
            <div className="ula-pagination-left">
              <Pagination
                currentPage={pagination.currentPage}
                totalItems={pagination.totalItems}
                pageSize={pagination.pageSize}
                onPageChange={pagination.setPage}
                onPageSizeChange={pagination.setPageSize}
                pageSizeOptions={[25, 50, 100, 200, 300]}
              />
            </div>
          </div>
        </section>
      </div>

      {/* ── Photo Preview Modal ── */}
      {preview && (
        <ImagePreviewModal
          url={preview.url}
          title={preview.title}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  );
}

export default Goa_Installation_SRT_ViewInstallation;