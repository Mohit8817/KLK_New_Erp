import React, { useEffect, useMemo, useRef, useState, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  goaSrtAmcService,
  getGoaAmcImageCandidates,
  type GoaAmcSiteRecord,
} from '../../goa-services';
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

const DASH = '—';

/* ───────── Responsive page CSS (Punjab-style footer, no tfoot) ───────── */
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

const ICON_REFRESH = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
    <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
  </svg>
);

const ICON_PLUS = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 5l0 14" />
    <path d="M5 12l14 0" />
  </svg>
);

const X_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

/* ───────── Modal Dialog ───────── */
function Modal({
  open,
  onClose,
  labelledBy,
  dialogClass = '',
  closeOnBackdrop = true,
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  dialogClass?: string;
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
    <div className="ax-modal ax-modal--centered" role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
      <div className="ax-modal__backdrop" onClick={() => closeOnBackdrop && onClose()} />
      <div ref={dialogRef} className={`ax-modal__dialog${dialogClass ? ' ' + dialogClass : ''}`}>
        {children}
      </div>
    </div>,
    document.body
  );
}

/* ───────── Image preview modal with zoom ───────── */
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
    <Modal open onClose={onClose} labelledBy="goa-amc-preview-title" dialogClass="ax-modal__dialog--lg">
      <div className="ax-modal__header">
        <h2 className="ax-modal__title" id="goa-amc-preview-title">{title || 'Media Preview'}</h2>
        <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">{X_ICON}</button>
      </div>

      <div className="ax-modal__body" style={{ padding: 0 }}>
        <div className="ula-m-stage">
          {status === 'loading' && <div className="ula-m-stage__msg"><span className="ax-spinner" /> Loading…</div>}
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

      <div className="ax-modal__footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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

type TabType = 'Incomplete' | 'Complete';

export function Goa_AMC_SRT_ViewData() {
  const location = useLocation();
  const navigate = useNavigate();

  // Tab state synced with URL hash
  const currentTab: TabType = location.hash.toLowerCase() === '#complete' ? 'Complete' : 'Incomplete';
  const setTab = (t: TabType) => {
    navigate({ pathname: location.pathname, search: location.search, hash: `#${t}` }, { replace: true });
    setCurrentPage(1);
  };

  // Data states
  const [loading, setLoading] = useState(true);
  const [pendingSites, setPendingSites] = useState<GoaAmcSiteRecord[]>([]);
  const [completedSites, setCompletedSites] = useState<GoaAmcSiteRecord[]>([]);

  // Search & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Modals
  const [previewMedia, setPreviewMedia] = useState<{ url: string; title: string } | null>(null);
  const [viewCompletedLoading, setViewCompletedLoading] = useState(false);
  const [completedModalRecord, setCompletedModalRecord] = useState<GoaAmcSiteRecord | null>(null);

  // Fetch AMC Data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await goaSrtAmcService.viewAmcData();
      setPendingSites(data.srt);
      setCompletedSites(data.coms);
    } catch (err: any) {
      console.warn('Error fetching AMC data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Current list based on active tab
  const activeList = currentTab === 'Incomplete' ? pendingSites : completedSites;

  // Filtered rows
  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return activeList;
    const q = searchQuery.toLowerCase();
    return activeList.filter((item) => {
      const s = item.srtdata;
      return (
        String(item.id).toLowerCase().includes(q) ||
        (item.amc && item.amc.toLowerCase().includes(q)) ||
        (s?.site_name && s.site_name.toLowerCase().includes(q)) ||
        (s?.dept_name && s.dept_name.toLowerCase().includes(q)) ||
        (s?.district && s.district.toLowerCase().includes(q)) ||
        (s?.location && s.location.toLowerCase().includes(q)) ||
        (s?.firm_name && s.firm_name.toLowerCase().includes(q)) ||
        (s?.ca_no && s.ca_no.toLowerCase().includes(q)) ||
        (item.amc_beneficiary_name && item.amc_beneficiary_name.toLowerCase().includes(q)) ||
        (item.amc_beneficiary_contact && item.amc_beneficiary_contact.toLowerCase().includes(q))
      );
    });
  }, [activeList, searchQuery]);

  // Paginated rows
  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;
  const pagedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  // Export Columns based on tab
  const incompleteExportCols: ExportColumn[] = [
    { key: 'srNo', label: 'Sr. No.' },
    { key: 'amc', label: 'AMC Type' },
    { key: 'state', label: 'State' },
    { key: 'district', label: 'District' },
    { key: 'dept_name', label: 'Dept Name' },
    { key: 'site_name', label: 'Site Name' },
    { key: 'location', label: 'Location' },
    { key: 'firm_name', label: 'Firm Name' },
    { key: 'ca_no', label: 'CA No' },
    { key: 'sanction_load', label: 'Sanction Load' },
    { key: 'plant_sc', label: 'Plant SC' },
    { key: 'wo_no', label: 'WO No' },
    { key: 'phase', label: 'Phase' },
    { key: 'amc_status', label: 'Amc Status' },
  ];

  const completeExportCols: ExportColumn[] = [
    { key: 'srNo', label: 'Sr. No.' },
    { key: 'amc', label: 'AMC Type' },
    { key: 'state', label: 'State' },
    { key: 'district', label: 'District' },
    { key: 'dept_name', label: 'Dept Name' },
    { key: 'site_name', label: 'Site Name' },
    { key: 'location', label: 'Location' },
    { key: 'amc_beneficiary_name', label: 'Amc Beneficiary Name' },
    { key: 'amc_beneficiary_contact', label: 'Amc Beneficiary Contact' },
    { key: 'amc_latitude', label: 'Amc Beneficiary Latitude' },
    { key: 'amc_longitude', label: 'Amc Beneficiary Longitude' },
    { key: 'firm_name', label: 'Firm Name' },
    { key: 'ca_no', label: 'CA No' },
    { key: 'sanction_load', label: 'Sanction Load' },
    { key: 'plant_sc', label: 'Plant SC' },
    { key: 'wo_no', label: 'WO No' },
    { key: 'phase', label: 'Phase' },
    { key: 'amc_status', label: 'Amc Status' },
    { key: 'amcverify_status', label: 'AMC Verify Status' },
  ];

  const exportData = useMemo(() => {
    return filteredRows.map((r, idx) => {
      const site = r.srtdata;
      return {
        srNo: idx + 1,
        amc: r.amc || DASH,
        state: site?.state || r.state || 'Goa',
        district: site?.district || DASH,
        dept_name: site?.dept_name || DASH,
        site_name: site?.site_name || `Site #${r.site_id}`,
        location: site?.location || DASH,
        amc_beneficiary_name: r.amc_beneficiary_name || DASH,
        amc_beneficiary_contact: r.amc_beneficiary_contact || DASH,
        amc_latitude: r.amc_latitude ?? DASH,
        amc_longitude: r.amc_longitude ?? DASH,
        firm_name: site?.firm_name || DASH,
        ca_no: site?.ca_no || DASH,
        sanction_load: site?.sanction_load || DASH,
        plant_sc: site?.plant_sc || DASH,
        wo_no: site?.wo_no || DASH,
        phase: site?.phase || DASH,
        amc_status: r.amc_status === 1 ? 'Done' : 'Pending',
        amcverify_status:
          r.amcverify_status === 1 ? 'Approved' : r.amcverify_status === 2 ? 'Rejected' : 'Pending',
      };
    });
  }, [filteredRows]);

  const activeCols = currentTab === 'Incomplete' ? incompleteExportCols : completeExportCols;

  const handleOpenDetailModal = async (amcId: number | string, fallbackRecord: GoaAmcSiteRecord) => {
    setViewCompletedLoading(true);
    setCompletedModalRecord(fallbackRecord);
    try {
      const full = await goaSrtAmcService.viewCompletedAmc(amcId);
      if (full) {
        setCompletedModalRecord(full);
      }
    } catch {
      // keep fallback
    } finally {
      setViewCompletedLoading(false);
    }
  };

  const openPreview = (url: string, title: string) => setPreviewMedia({ url, title });

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* Page Head (matching View Bihar SRT Installation) */}
      <PageHead
        title="Welcome to, Goa SRT Amc Site"
        subtitle="View Goa SRT Amc Site"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Goa' },
          { label: 'AMC' },
          { label: 'View Goa SRT Amc Site' },
        ]}
        actions={
          <div className="ax-cluster">
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={loadData} disabled={loading}>
              {ICON_REFRESH}
              <span className="ax-btn__label">Refresh</span>
            </button>
            <Link to="/v/goa-add-srt-amc" className="ax-btn ax-btn--primary ax-btn--sm">
              {ICON_PLUS}
              <span className="ax-btn__label">+ Update AMC Site</span>
            </Link>
          </div>
        }
      />

      <div className="ax-dash-grid">
        {/* Report Wise Bifurcation Tabs */}
        <div className="ax-col--12">
          <div style={{ marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ax-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Report Wise Bifurcation
            </span>
          </div>
          <div className="ax-cluster" role="tablist" aria-label="AMC Bifurcation" style={{ gap: 'var(--ax-space-2)' }}>
            <button
              type="button"
              role="tab"
              aria-selected={currentTab === 'Incomplete'}
              className={`ax-btn ax-btn--sm ${currentTab === 'Incomplete' ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
              onClick={() => setTab('Incomplete')}
            >
              <span className="ax-btn__label">Incomplete ({loading ? '…' : pendingSites.length})</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={currentTab === 'Complete'}
              className={`ax-btn ax-btn--sm ${currentTab === 'Complete' ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
              onClick={() => setTab('Complete')}
            >
              <span className="ax-btn__label">Complete ({loading ? '…' : completedSites.length})</span>
            </button>
          </div>
        </div>

        {/* Main Card */}
        <section className="ax-card ax-col--12" role="region" aria-label="Goa SRT AMC Records">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">AMC SITE</span>
              <h2 className="ax-card__title">
                {currentTab === 'Incomplete' ? 'Incomplete AMC Sites' : 'Completed AMC Sites'}
              </h2>
              <p className="ax-card__subtitle ax-num" style={{ fontFamily: 'var(--ax-font-mono)' }}>
                {filteredRows.length} of {activeList.length} sites
              </p>
            </div>

            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                {searchQuery && (
                  <button
                    type="button"
                    className="ax-btn ax-btn--ghost ax-btn--sm"
                    onClick={() => {
                      setSearchQuery('');
                      setCurrentPage(1);
                    }}
                    style={{ height: 30, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }}
                  >
                    Reset
                  </button>
                )}

                <SearchInput
                  value={searchQuery}
                  onChange={(val) => {
                    setSearchQuery(val);
                    setCurrentPage(1);
                  }}
                  placeholder="Search AMC..."
                  size="sm"
                  ariaLabel="Search AMC sites"
                />

                <TableExportToolbar
                  onCopy={() => copyTableDataToClipboard(activeCols, exportData)}
                  onExportCSV={() => exportDataToCSV(activeCols, exportData, `Goa_SRT_AMC_${currentTab}_List.csv`)}
                  onExportExcel={() => exportDataToExcel(activeCols, exportData, `Goa_SRT_AMC_${currentTab}_List.xlsx`)}
                  onExportPDF={() => printTableData(activeCols, exportData, `Goa SRT AMC ${currentTab} Sites`)}
                />
              </div>
            </div>
          </div>

          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap' }}>
              <caption className="ax-visually-hidden">
                {currentTab === 'Incomplete' ? 'Incomplete AMC Sites' : 'Completed AMC Sites'}
              </caption>

              {/* Incomplete Tab Table */}
              {currentTab === 'Incomplete' ? (
                <>
                  <thead className="ax-table__head">
                    <tr>
                      <th className="ax-table__th" scope="col">Sr. No.</th>
                      <th className="ax-table__th" scope="col">AMC Type</th>
                      <th className="ax-table__th" scope="col">State</th>
                      <th className="ax-table__th" scope="col">District</th>
                      <th className="ax-table__th" scope="col">Dept Name</th>
                      <th className="ax-table__th" scope="col">Site Name</th>
                      <th className="ax-table__th" scope="col">Location</th>
                      <th className="ax-table__th" scope="col">Firm Name</th>
                      <th className="ax-table__th" scope="col">CA No</th>
                      <th className="ax-table__th" scope="col">Sanction Load</th>
                      <th className="ax-table__th" scope="col">Plant SC</th>
                      <th className="ax-table__th" scope="col">WO No</th>
                      <th className="ax-table__th" scope="col">Phase</th>
                      <th className="ax-table__th" scope="col">Amc Status</th>
                      <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>AMC</th>
                    </tr>
                  </thead>
                  <tbody aria-busy={loading}>
                    {loading && (
                      <tr>
                        <td className="ax-table__td" colSpan={15} style={{ textAlign: 'center', padding: 32 }}>
                          <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading AMC records…
                        </td>
                      </tr>
                    )}
                    {!loading && filteredRows.length === 0 && (
                      <tr>
                        <td className="ax-table__td" colSpan={15} style={{ padding: 0 }}>
                          <TableEmptyState
                            title="No data available in table"
                            message="No pending AMC sites match your search."
                            query={searchQuery}
                            onClear={() => setSearchQuery('')}
                          />
                        </td>
                      </tr>
                    )}
                    {!loading &&
                      pagedRows.map((row, idx) => {
                        const srNo = (currentPage - 1) * pageSize + idx + 1;
                        const site = row.srtdata;
                        return (
                          <tr key={row.id} className="ax-table__row">
                            <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: 12 }}>{srNo}</td>
                            <td className="ax-table__td" style={{ fontWeight: 600 }}>{row.amc}</td>
                            <td className="ax-table__td">{site?.state || row.state || 'Goa'}</td>
                            <td className="ax-table__td">{site?.district || DASH}</td>
                            <td className="ax-table__td">{site?.dept_name || DASH}</td>
                            <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                              {site?.site_name || `Site #${row.site_id}`}
                            </td>
                            <td className="ax-table__td">{site?.location || DASH}</td>
                            <td className="ax-table__td">{site?.firm_name || DASH}</td>
                            <td className="ax-table__td">{site?.ca_no || DASH}</td>
                            <td className="ax-table__td">{site?.sanction_load || DASH}</td>
                            <td className="ax-table__td">{site?.plant_sc || DASH}</td>
                            <td className="ax-table__td">{site?.wo_no || DASH}</td>
                            <td className="ax-table__td">{site?.phase || DASH}</td>
                            <td className="ax-table__td">
                              <span className="ax-badge ax-badge--soft ax-badge--warning">Pending</span>
                            </td>
                            <td className="ax-table__td" style={{ textAlign: 'center' }}>
                              <Link
                                to={`/v/goa-add-srt-amc?amc=${encodeURIComponent(row.amc)}&site_id=${row.site_id || row.id}&amc_id=${row.id}`}
                                className="ax-btn ax-btn--primary ax-btn--xs"
                              >
                                Complete AMC
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </>
              ) : (
                /* Complete Tab Table */
                <>
                  <thead className="ax-table__head">
                    <tr>
                      <th className="ax-table__th" scope="col">Sr. No.</th>
                      <th className="ax-table__th" scope="col">AMC Type</th>
                      <th className="ax-table__th" scope="col">State</th>
                      <th className="ax-table__th" scope="col">District</th>
                      <th className="ax-table__th" scope="col">Dept Name</th>
                      <th className="ax-table__th" scope="col">Site Name</th>
                      <th className="ax-table__th" scope="col">Location</th>
                      <th className="ax-table__th" scope="col">Amc Beneficiary Name</th>
                      <th className="ax-table__th" scope="col">Amc Beneficiary Contact</th>
                      <th className="ax-table__th" scope="col">Amc Beneficiary Latitude</th>
                      <th className="ax-table__th" scope="col">Amc Beneficiary Longitude</th>
                      <th className="ax-table__th" scope="col">Firm Name</th>
                      <th className="ax-table__th" scope="col">CA No</th>
                      <th className="ax-table__th" scope="col">Sanction Load</th>
                      <th className="ax-table__th" scope="col">Plant SC</th>
                      <th className="ax-table__th" scope="col">WO No</th>
                      <th className="ax-table__th" scope="col">Phase</th>
                      <th className="ax-table__th" scope="col">Amc Status</th>
                      <th className="ax-table__th" scope="col">AMC Verify Status</th>
                      <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody aria-busy={loading}>
                    {loading && (
                      <tr>
                        <td className="ax-table__td" colSpan={20} style={{ textAlign: 'center', padding: 32 }}>
                          <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading AMC records…
                        </td>
                      </tr>
                    )}
                    {!loading && filteredRows.length === 0 && (
                      <tr>
                        <td className="ax-table__td" colSpan={20} style={{ padding: 0 }}>
                          <TableEmptyState
                            title="No data available in table"
                            message="No completed AMC records match your query."
                            query={searchQuery}
                            onClear={() => setSearchQuery('')}
                          />
                        </td>
                      </tr>
                    )}
                    {!loading &&
                      pagedRows.map((row, idx) => {
                        const srNo = (currentPage - 1) * pageSize + idx + 1;
                        const site = row.srtdata;
                        const lat = row.amc_latitude;
                        const lng = row.amc_longitude;

                        return (
                          <tr key={row.id} className="ax-table__row">
                            <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: 12 }}>{srNo}</td>
                            <td className="ax-table__td" style={{ fontWeight: 600 }}>{row.amc}</td>
                            <td className="ax-table__td">{site?.state || row.state || 'Goa'}</td>
                            <td className="ax-table__td">{site?.district || DASH}</td>
                            <td className="ax-table__td">{site?.dept_name || DASH}</td>
                            <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                              {site?.site_name || `Site #${row.site_id}`}
                            </td>
                            <td className="ax-table__td">{site?.location || DASH}</td>
                            <td className="ax-table__td">{row.amc_beneficiary_name || DASH}</td>
                            <td className="ax-table__td">{row.amc_beneficiary_contact || DASH}</td>
                            <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: 12 }}>
                              {lat ? (
                                <a
                                  href={`https://www.google.com/maps?q=${lat},${lng}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{ color: 'var(--ax-primary-default, #2563eb)', textDecoration: 'none' }}
                                  title="Open in Google Maps"
                                >
                                  {lat}
                                </a>
                              ) : (
                                DASH
                              )}
                            </td>
                            <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: 12 }}>{lng ?? DASH}</td>
                            <td className="ax-table__td">{site?.firm_name || DASH}</td>
                            <td className="ax-table__td">{site?.ca_no || DASH}</td>
                            <td className="ax-table__td">{site?.sanction_load || DASH}</td>
                            <td className="ax-table__td">{site?.plant_sc || DASH}</td>
                            <td className="ax-table__td">{site?.wo_no || DASH}</td>
                            <td className="ax-table__td">{site?.phase || DASH}</td>
                            <td className="ax-table__td">
                              <span className="ax-badge ax-badge--soft ax-badge--success">Done</span>
                            </td>
                            <td className="ax-table__td">
                              <span
                                className={`ax-badge ax-badge--soft ${
                                  row.amcverify_status === 1
                                    ? 'ax-badge--success'
                                    : row.amcverify_status === 2
                                    ? 'ax-badge--danger'
                                    : 'ax-badge--warning'
                                }`}
                              >
                                {row.amcverify_status === 1
                                  ? 'Approved'
                                  : row.amcverify_status === 2
                                  ? 'Rejected'
                                  : 'Pending'}
                              </span>
                            </td>
                            <td className="ax-table__td" style={{ textAlign: 'center' }}>
                              <button
                                type="button"
                                className="ax-btn ax-btn--secondary ax-btn--xs"
                                onClick={() => handleOpenDetailModal(row.id, row)}
                              >
                                 View Details
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </>
              )}
            </table>
          </div>

          {/* ── Table Footer (Punjab-style: pagination only) ── */}
          <div className="ax-card__footer" style={footerStyle}>
            <div className="ula-pagination-left">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredRows.length}
                pageSize={pageSize}
                pageSizeOptions={[10, 25, 50, 100]}
                onPageChange={setCurrentPage}
                onPageSizeChange={(newSize) => {
                  setPageSize(newSize);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
        </section>
      </div>

      {/* Completed Record Modal with Image Gallery */}
      {completedModalRecord && (
        <Modal
          open
          onClose={() => setCompletedModalRecord(null)}
          labelledBy="goa-amc-detail-title"
          dialogClass="ax-modal__dialog--lg"
        >
          <div className="ax-modal__header">
            <div>
              <h3 className="ax-modal__title" id="goa-amc-detail-title">
                {completedModalRecord.srtdata?.site_name || `Site #${completedModalRecord.site_id}`}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--ax-text-muted)' }}>
                AMC Type: {completedModalRecord.amc} · Date: {completedModalRecord.amc_date || DASH}
              </p>
            </div>
            <button
              type="button"
              className="ax-modal__close"
              onClick={() => setCompletedModalRecord(null)}
              aria-label="Close dialog"
            >
              {X_ICON}
            </button>
          </div>

          <div className="ax-modal__body" style={{ padding: 24, maxHeight: '70vh', overflowY: 'auto' }}>
            {viewCompletedLoading && (
              <div style={{ padding: '8px 0', color: 'var(--ax-text-muted)' }}>
                <span className="ax-spinner" style={{ marginRight: 8 }} /> Fetching latest details…
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, fontSize: 13, marginBottom: 20 }}>
              <div><strong>State:</strong> {completedModalRecord.srtdata?.state || completedModalRecord.state || 'Goa'}</div>
              <div><strong>District:</strong> {completedModalRecord.srtdata?.district || DASH}</div>
              <div><strong>Dept Name:</strong> {completedModalRecord.srtdata?.dept_name || DASH}</div>
              <div><strong>Location:</strong> {completedModalRecord.srtdata?.location || DASH}</div>
              <div><strong>Firm Name:</strong> {completedModalRecord.srtdata?.firm_name || DASH}</div>
              <div><strong>CA No:</strong> {completedModalRecord.srtdata?.ca_no || DASH}</div>
              <div><strong>Sanction Load:</strong> {completedModalRecord.srtdata?.sanction_load || DASH}</div>
              <div><strong>Plant SC:</strong> {completedModalRecord.srtdata?.plant_sc || DASH}</div>
              <div><strong>WO No:</strong> {completedModalRecord.srtdata?.wo_no || DASH}</div>
              <div><strong>Phase:</strong> {completedModalRecord.srtdata?.phase || DASH}</div>
              <div><strong>Beneficiary Name:</strong> {completedModalRecord.amc_beneficiary_name || DASH}</div>
              <div><strong>Beneficiary Contact:</strong> {completedModalRecord.amc_beneficiary_contact || DASH}</div>
              <div><strong>AMC Latitude:</strong> {completedModalRecord.amc_latitude || DASH}</div>
              <div><strong>AMC Longitude:</strong> {completedModalRecord.amc_longitude || DASH}</div>
              <div>
                <strong>Verification Status:</strong>{' '}
                <span
                  className={`ax-badge ax-badge--soft ${
                    completedModalRecord.amcverify_status === 1
                      ? 'ax-badge--success'
                      : completedModalRecord.amcverify_status === 2
                      ? 'ax-badge--danger'
                      : 'ax-badge--warning'
                  }`}
                >
                  {completedModalRecord.amcverify_status === 1
                    ? 'Approved'
                    : completedModalRecord.amcverify_status === 2
                    ? 'Rejected'
                    : 'Pending'}
                </span>
              </div>
              <div style={{ gridColumn: 'span 3' }}>
                <strong>AMC Remarks:</strong> {completedModalRecord.amc_remark || DASH}
              </div>
            </div>

            {/* Photos 1-10 Grid */}
            <h4 style={{ fontSize: 14, fontWeight: 700, margin: '20px 0 12px' }}>AMC Uploaded Photos (1 to 10)</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                const key = `amc_image${num}` as keyof GoaAmcSiteRecord;
                const path = completedModalRecord[key] as string | null | undefined;
                if (!path) return null;
                const candidate = getGoaAmcImageCandidates(path)[0] || path;
                return (
                  <div
                    key={num}
                    style={{
                      border: '1px solid var(--ax-border)',
                      padding: 6,
                      background: 'var(--ax-surface-subtle)',
                      textAlign: 'center',
                      cursor: 'pointer',
                    }}
                    onClick={() => openPreview(candidate, `AMC Image ${num}`)}
                  >
                    <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4 }}>Image {num}</div>
                    <img
                      src={candidate}
                      alt={`AMC ${num}`}
                      style={{ width: '100%', height: 75, objectFit: 'cover', borderRadius: 0, display: 'block' }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="ax-modal__footer" style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" className="ax-btn ax-btn--primary" onClick={() => setCompletedModalRecord(null)}>
              Close
            </button>
          </div>
        </Modal>
      )}

      {/* Media Zoom Preview Modal */}
      {previewMedia && (
        <ImagePreviewModal
          url={previewMedia.url}
          title={previewMedia.title}
          onClose={() => setPreviewMedia(null)}
        />
      )}
    </div>
  );
}

export default Goa_AMC_SRT_ViewData;