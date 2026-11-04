import { useEffect, useMemo, useState, useCallback, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  biharAmcService,
  getAmcMediaUrl,
  type BiharSrtAmcItem,
} from '../../bihar-services/biharAmcService';
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

type Row = BiharSrtAmcItem;
type TabType = 'Incomplete' | 'Complete';

const DASH = '—';
const txt = (v: unknown) => (v === null || v === undefined || v === '' ? DASH : String(v));

/* ───────── Responsive page CSS (Exact from Bihar Complaints / Details) ───────── */
const PAGE_CSS = `
  .solar-erp-page .ax-card { min-width: 0; }
  .solar-erp-page .ax-card__footer { width: 100%; box-sizing: border-box; }
  .solar-erp-page .ula-pagination-left {
    width: 100%; display: flex; justify-content: flex-start; align-items: center; margin: 0; overflow-x: auto;
  }
  .solar-erp-page .ula-pagination-left > * { margin-left: 0 !important; margin-right: 0 !important; }

  .solar-erp-page img,
  .solar-erp-page .ax-card img {
    border-radius: 4px !important;
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

  /* Modal */
  .ax-modal {
    position: fixed;
    inset: 0;
    z-index: 1050;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--ax-space-4);
  }
  .ax-modal__backdrop {
    position: absolute;
    inset: 0;
    background: rgba(15, 23, 42, 0.65);
    backdrop-filter: blur(4px);
  }
  .ax-modal__dialog {
    position: relative;
    z-index: 1;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    background: var(--ax-surface-solid);
    border: 1px solid var(--ax-border);
    border-radius: var(--ax-radius-xl);
    box-shadow: var(--ax-shadow-2xl);
  }
  .ax-modal__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--ax-space-4) var(--ax-space-6);
    border-bottom: 1px solid var(--ax-border-subtle);
  }
  .ax-modal__close {
    background: transparent;
    border: 0;
    cursor: pointer;
    color: var(--ax-text-muted);
    padding: 4px;
    border-radius: 4px;
  }
  .ax-modal__close:hover {
    color: var(--ax-text-strong);
    background: var(--ax-surface-hover);
  }
  .ax-modal__body {
    padding: var(--ax-space-6);
  }
  .ax-modal__footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: var(--ax-space-4) var(--ax-space-6);
    border-top: 1px solid var(--ax-border-subtle);
  }
`;

const actionsRowStyle = {
  gap: 'var(--ax-space-2)',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'flex-end',
  width: '100%',
} as const;

const X_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 18, height: 18 }}>
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

export function Bihar_AMC_SRT_ViewData() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabType>('Incomplete');
  const [loading, setLoading] = useState(true);
  const [incompleteList, setIncompleteList] = useState<Row[]>([]);
  const [completeList, setCompleteList] = useState<Row[]>([]);
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

  // Detail Modal
  const [detailItem, setDetailItem] = useState<Row | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await biharAmcService.getViewSrtAmcData();
      setIncompleteList(resp.srt || []);
      setCompleteList(resp.coms || []);
    } catch (err) {
      console.error('Failed to load SRT AMC data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const currentList = tab === 'Incomplete' ? incompleteList : completeList;

  // Distinct districts
  const districts = useMemo(() => {
    const s = new Set<string>();
    currentList.forEach((r) => {
      const d = r.srtdata?.district || (r as any).district;
      if (d && String(d).trim()) s.add(String(d).trim());
    });
    return Array.from(s).sort();
  }, [currentList]);

  // Filtered
  const filtered = useMemo(() => {
    return currentList.filter((r) => {
      const site = r.srtdata || {};
      const district = site.district || (r as any).district || '';
      if (districtFilter !== 'all' && district.toLowerCase() !== districtFilter.toLowerCase()) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const str = [
          r.amc,
          r.id,
          site.site_name,
          site.district,
          site.dept_name,
          site.location,
          site.firm_name,
          site.ca_no,
          site.wo_no,
          r.amc_beneficiary_name,
          r.amc_beneficiary_contact,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!str.includes(q)) return false;
      }
      return true;
    });
  }, [currentList, districtFilter, search]);

  // Pagination
  const paged = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [tab, districtFilter, search]);

  // Export Columns
  const exportCols: ExportColumn<Row>[] = useMemo(() => {
    if (tab === 'Complete') {
      return [
        { header: 'AMC Type', accessor: (r) => r.amc || DASH },
        { header: 'State', accessor: (r) => r.srtdata?.state || (r as any).state || 'Bihar' },
        { header: 'District', accessor: (r) => r.srtdata?.district || DASH },
        { header: 'Dept Name', accessor: (r) => r.srtdata?.dept_name || DASH },
        { header: 'Site Name', accessor: (r) => r.srtdata?.site_name || DASH },
        { header: 'Location', accessor: (r) => r.srtdata?.location || DASH },
        { header: 'Amc Beneficiary Name', accessor: (r) => r.amc_beneficiary_name || DASH },
        { header: 'Amc Beneficiary Contact', accessor: (r) => r.amc_beneficiary_contact || DASH },
        { header: 'Amc Beneficiary Latitude', accessor: (r) => String(r.amc_latitude ?? DASH) },
        { header: 'Amc Beneficiary Longitude', accessor: (r) => String(r.amc_longitude ?? DASH) },
        { header: 'Firm Name', accessor: (r) => r.srtdata?.firm_name || DASH },
        { header: 'CA No', accessor: (r) => r.srtdata?.ca_no || DASH },
        { header: 'Sanction Load', accessor: (r) => String(r.srtdata?.sanction_load ?? DASH) },
        { header: 'Plant SC', accessor: (r) => r.srtdata?.plant_sc || DASH },
        { header: 'WO No', accessor: (r) => r.srtdata?.wo_no || DASH },
        { header: 'Phase', accessor: (r) => r.srtdata?.phase || DASH },
        { header: 'Amc Status', accessor: () => 'Completed' },
        {
          header: 'AMC Verify Status',
          accessor: (r) => (r.amcverify_status === 1 ? 'Approved' : r.amcverify_status === 2 ? 'Rejected' : 'Pending'),
        },
      ];
    }
    return [
      { header: 'AMC Type', accessor: (r) => r.amc || DASH },
      { header: 'State', accessor: (r) => r.srtdata?.state || (r as any).state || 'Bihar' },
      { header: 'District', accessor: (r) => r.srtdata?.district || DASH },
      { header: 'Dept Name', accessor: (r) => r.srtdata?.dept_name || DASH },
      { header: 'Site Name', accessor: (r) => r.srtdata?.site_name || DASH },
      { header: 'Location', accessor: (r) => r.srtdata?.location || DASH },
      { header: 'Firm Name', accessor: (r) => r.srtdata?.firm_name || DASH },
      { header: 'CA No', accessor: (r) => r.srtdata?.ca_no || DASH },
      { header: 'Sanction Load', accessor: (r) => String(r.srtdata?.sanction_load ?? DASH) },
      { header: 'Plant SC', accessor: (r) => r.srtdata?.plant_sc || DASH },
      { header: 'WO No', accessor: (r) => r.srtdata?.wo_no || DASH },
      { header: 'Phase', accessor: (r) => r.srtdata?.phase || DASH },
      { header: 'Amc Status', accessor: () => 'Incomplete' },
    ];
  }, [tab]);

  const handleCopy = () => copyTableDataToClipboard(filtered, exportCols);
  const handleCsv = () => exportDataToCSV(`Bihar_SRT_AMC_${tab}`, filtered, exportCols);
  const handleExcel = () => exportDataToExcel(`Bihar_SRT_AMC_${tab}`, filtered, exportCols);
  const handlePdf = () => printTableData(`Bihar SRT AMC - ${tab} Sites`, filtered, exportCols);

  const resetFilters = () => {
    setSearch('');
    setDistrictFilter('all');
  };

  const totalCols = tab === 'Complete' ? 20 : 15;

  return (
    <div className="solar-erp-page bihar-srt-amc-view">
      <style>{PAGE_CSS}</style>

      <PageHead
        title="Bihar SRT Amc Site"
        subtitle={
          <span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>
            Welcome to, Bihar SRT Amc Site (Incomplete & Completed Monitoring)
          </span>
        }
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Bihar' },
          { label: 'AMC' },
          { label: 'SRT' },
          { label: 'View Data' },
        ]}
        actions={
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}>
            <Link to="/v/bihar-add-srt-amc" className="ax-btn ax-btn--primary ax-btn--pill">
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              <span className="ax-btn__label">Add SRT AMC</span>
            </Link>
            <Link to="/v/bihar-view-srt-amc-complaint" className="ax-btn ax-btn--secondary ax-btn--pill">
              <span className="ax-btn__label">Complaint Raised</span>
            </Link>
          </div>
        }
      />

      {/* Tabs */}
      <div style={{ marginBottom: 'var(--ax-space-4)' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ax-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>
          Report Wise Bifurcation
        </span>
        <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}>
          <button
            type="button"
            className={`ax-btn ax-btn--sm ${tab === 'Incomplete' ? 'ax-btn--primary' : 'ax-btn--secondary'} ax-btn--pill`}
            onClick={() => setTab('Incomplete')}
          >
            Incomplete ({incompleteList.length})
          </button>
          <button
            type="button"
            className={`ax-btn ax-btn--sm ${tab === 'Complete' ? 'ax-btn--primary' : 'ax-btn--secondary'} ax-btn--pill`}
            onClick={() => setTab('Complete')}
          >
            Complete ({completeList.length})
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="ax-card">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title" style={{ fontSize: 'var(--ax-text-base)', margin: 0 }}>
              {tab === 'Incomplete' ? 'Incomplete SRT AMC Sites' : 'Completed SRT AMC Sites'}
            </h2>
            <p className="ax-card__subtitle" style={{ fontSize: 'var(--ax-text-xs)', margin: '4px 0 0' }}>
              Showing {filtered.length} {tab.toLowerCase()} record(s)
            </p>
          </div>

          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              {districts.length > 0 && (
                <div style={{ minWidth: 150 }}>
                  <select
                    className="ax-select"
                    value={districtFilter}
                    onChange={(e) => setDistrictFilter(e.target.value)}
                    style={{ height: 34, fontSize: 12, padding: '0 8px' }}
                  >
                    <option value="all">All Districts ({districts.length})</option>
                    {districts.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              )}

              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder={`Search ${tab.toLowerCase()}...`}
              />

              <TableExportToolbar
                onCopy={handleCopy}
                onExportCsv={handleCsv}
                onExportExcel={handleExcel}
                onPrint={handlePdf}
              />
            </div>
          </div>
        </div>

        {/* Table Wrap */}
        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap', minWidth: tab === 'Complete' ? 2200 : 1600 }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th" style={{ width: 60 }}>Sr. No.</th>
                <th className="ax-table__th">AMC Type</th>
                <th className="ax-table__th">State</th>
                <th className="ax-table__th">District</th>
                <th className="ax-table__th">Dept Name</th>
                <th className="ax-table__th" style={{ minWidth: 160 }}>Site Name</th>
                <th className="ax-table__th">Location</th>

                {tab === 'Complete' ? (
                  <>
                    <th className="ax-table__th">Amc Beneficiary Name</th>
                    <th className="ax-table__th">Amc Beneficiary Contact</th>
                    <th className="ax-table__th">Amc Beneficiary Latitude</th>
                    <th className="ax-table__th">Amc Beneficiary Longitude</th>
                    <th className="ax-table__th">Firm Name</th>
                    <th className="ax-table__th">CA No</th>
                    <th className="ax-table__th">Sanction Load</th>
                    <th className="ax-table__th">Plant SC</th>
                    <th className="ax-table__th">WO No</th>
                    <th className="ax-table__th">Phase</th>
                    <th className="ax-table__th" style={{ textAlign: 'center' }}>Amc Status</th>
                    <th className="ax-table__th" style={{ textAlign: 'center' }}>AMC Verify Status</th>
                    <th className="ax-table__th" style={{ textAlign: 'center', width: 100 }}>Action</th>
                  </>
                ) : (
                  <>
                    <th className="ax-table__th">Firm Name</th>
                    <th className="ax-table__th">CA No</th>
                    <th className="ax-table__th">Sanction Load</th>
                    <th className="ax-table__th">Plant SC</th>
                    <th className="ax-table__th">WO No</th>
                    <th className="ax-table__th">Phase</th>
                    <th className="ax-table__th" style={{ textAlign: 'center' }}>Amc Status</th>
                    <th className="ax-table__th" style={{ textAlign: 'center', width: 100 }}>AMC</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody aria-busy={loading}>
              {loading && (
                <tr>
                  <td colSpan={totalCols} style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--ax-text-muted)' }}>
                    <span className="ax-spinner" style={{ marginRight: 8, verticalAlign: 'middle' }} />
                    Loading SRT AMC records…
                  </td>
                </tr>
              )}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={totalCols} style={{ padding: 0 }}>
                    <TableEmptyState
                      title="No data available in table"
                      message={search ? 'No records match your search criteria.' : `No ${tab.toLowerCase()} AMC sites found.`}
                      onClear={search || districtFilter !== 'all' ? resetFilters : undefined}
                      clearLabel="Clear filters"
                    />
                  </td>
                </tr>
              )}

              {!loading &&
                paged.map((r, idx) => {
                  const srNo = (currentPage - 1) * pageSize + idx + 1;
                  const site = r.srtdata || {};
                  const isComplete = tab === 'Complete';

                  return (
                    <tr key={r.id || idx} className="ax-table__row">
                      <td className="ax-table__td ax-num" style={{ fontWeight: 600 }}>{srNo}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-primary)' }}>
                        {r.amc || DASH}
                      </td>
                      <td className="ax-table__td">{site.state || (r as any).state || 'Bihar'}</td>
                      <td className="ax-table__td">{txt(site.district)}</td>
                      <td className="ax-table__td">{txt(site.dept_name)}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                        {txt(site.site_name)}
                      </td>
                      <td className="ax-table__td">{txt(site.location)}</td>

                      {isComplete ? (
                        <>
                          <td className="ax-table__td" style={{ fontWeight: 600 }}>{txt(r.amc_beneficiary_name)}</td>
                          <td className="ax-table__td">
                            {r.amc_beneficiary_contact ? (
                              <a href={`tel:${r.amc_beneficiary_contact}`} style={{ color: 'var(--ax-primary)', textDecoration: 'none' }}>
                                {r.amc_beneficiary_contact}
                              </a>
                            ) : DASH}
                          </td>
                          <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 11 }}>{txt(r.amc_latitude)}</td>
                          <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 11 }}>{txt(r.amc_longitude)}</td>
                          <td className="ax-table__td">{txt(site.firm_name)}</td>
                          <td className="ax-table__td">{txt(site.ca_no)}</td>
                          <td className="ax-table__td">{txt(site.sanction_load)}</td>
                          <td className="ax-table__td">{txt(site.plant_sc)}</td>
                          <td className="ax-table__td">{txt(site.wo_no)}</td>
                          <td className="ax-table__td">{txt(site.phase)}</td>
                          <td className="ax-table__td" style={{ textAlign: 'center' }}>
                            <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill">
                              <span className="ax-badge__dot" /> Completed
                            </span>
                          </td>
                          <td className="ax-table__td" style={{ textAlign: 'center' }}>
                            {r.amcverify_status === 1 ? (
                              <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill">
                                <span className="ax-badge__dot" /> Approved
                              </span>
                            ) : r.amcverify_status === 2 ? (
                              <span className="ax-badge ax-badge--soft ax-badge--danger ax-badge--pill">
                                <span className="ax-badge__dot" /> Rejected
                              </span>
                            ) : (
                              <span className="ax-badge ax-badge--soft ax-badge--warning ax-badge--pill">
                                <span className="ax-badge__dot" /> Pending
                              </span>
                            )}
                          </td>
                          <td className="ax-table__td" style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              className="ax-btn ax-btn--ghost ax-btn--sm"
                              onClick={() => setDetailItem(r)}
                              style={{ padding: '2px 10px', fontSize: 12 }}
                            >
                              View
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="ax-table__td">{txt(site.firm_name)}</td>
                          <td className="ax-table__td">{txt(site.ca_no)}</td>
                          <td className="ax-table__td">{txt(site.sanction_load)}</td>
                          <td className="ax-table__td">{txt(site.plant_sc)}</td>
                          <td className="ax-table__td">{txt(site.wo_no)}</td>
                          <td className="ax-table__td">{txt(site.phase)}</td>
                          <td className="ax-table__td" style={{ textAlign: 'center' }}>
                            <span className="ax-badge ax-badge--soft ax-badge--warning ax-badge--pill">
                              <span className="ax-badge__dot" /> Incomplete
                            </span>
                          </td>
                          <td className="ax-table__td" style={{ textAlign: 'center' }}>
                            <Link
                              to={`/v/bihar-add-srt-amc?amc=${encodeURIComponent(r.amc || '')}&site_id=${r.site_id || site.id || r.id}`}
                              className="ax-btn ax-btn--primary ax-btn--sm ax-btn--pill"
                              style={{ padding: '3px 12px', fontSize: 11 }}
                            >
                              Update AMC
                            </Link>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination */}
        <div className="ax-card__footer">
          <div className="ula-pagination-left">
            <Pagination
              currentPage={currentPage}
              pageSize={pageSize}
              totalItems={filtered.length}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[25, 50, 100, 200]}
            />
          </div>
        </div>
      </div>

      {/* Completed AMC Detail Modal */}
      {detailItem && (
        <SrtAmcDetailModal item={detailItem} onClose={() => setDetailItem(null)} />
      )}
    </div>
  );
}

/* ───────── View Detail Modal for Completed SRT AMC ───────── */
function SrtAmcDetailModal({ item, onClose }: { item: Row; onClose: () => void }) {
  const site = item.srtdata || {};

  // Collect uploaded images
  const photos = [
    item.amc_image1, item.amc_image2, item.amc_image3, item.amc_image4, item.amc_image5,
    item.amc_image6, item.amc_image7, item.amc_image8, item.amc_image9, item.amc_image10,
  ].filter(Boolean) as string[];

  return createPortal(
    <div className="ax-modal" role="dialog" aria-modal="true">
      <div className="ax-modal__backdrop" onClick={onClose} />
      <div className="ax-modal__dialog" style={{ maxWidth: 720 }}>
        <div className="ax-modal__header">
          <h2 className="ax-modal__title" style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
            SRT AMC Details: {site.site_name || `Record #${item.id}`} ({item.amc || 'AMC'})
          </h2>
          <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">
            {X_ICON}
          </button>
        </div>

        <div className="ax-modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Status Bar */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', padding: '10px 14px', background: 'var(--ax-surface-subtle)', borderRadius: 8, border: '1px solid var(--ax-border)' }}>
            <span style={{ fontSize: 12, color: 'var(--ax-text-muted)' }}>AMC Cycle: <b>{item.amc || '—'}</b></span>
            <span style={{ fontSize: 12, color: 'var(--ax-text-muted)' }}>Status: <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill">Completed</span></span>
            <span style={{ fontSize: 12, color: 'var(--ax-text-muted)' }}>
              Verify Status:{' '}
              {item.amcverify_status === 1 ? (
                <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill">Approved</span>
              ) : item.amcverify_status === 2 ? (
                <span className="ax-badge ax-badge--soft ax-badge--danger ax-badge--pill">Rejected</span>
              ) : (
                <span className="ax-badge ax-badge--soft ax-badge--warning ax-badge--pill">Pending</span>
              )}
            </span>
          </div>

          {/* Grid Information */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Beneficiary Name:</span> <b>{txt(item.amc_beneficiary_name)}</b></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Beneficiary Contact:</span> <b>{txt(item.amc_beneficiary_contact)}</b></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Latitude:</span> <b>{txt(item.amc_latitude)}</b></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Longitude:</span> <b>{txt(item.amc_longitude)}</b></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>District:</span> <b>{txt(site.district)}</b></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Dept Name:</span> <b>{txt(site.dept_name)}</b></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Location:</span> <b>{txt(site.location)}</b></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Firm Name:</span> <b>{txt(site.firm_name)}</b></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>CA No.:</span> <b>{txt(site.ca_no)}</b></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Sanction Load:</span> <b>{txt(site.sanction_load)}</b></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Plant SC:</span> <b>{txt(site.plant_sc)}</b></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>WO No.:</span> <b>{txt(site.wo_no)}</b></div>
            <div style={{ gridColumn: '1 / -1' }}><span style={{ color: 'var(--ax-text-muted)' }}>Remarks:</span> <b>{txt(item.amc_remark)}</b></div>
          </div>

          {/* Photos */}
          {photos.length > 0 && (
            <div style={{ borderTop: '1px solid var(--ax-border)', paddingTop: 14 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ax-text-muted)', display: 'block', marginBottom: 10 }}>
                AMC Inspection Photos ({photos.length}):
              </span>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {photos.map((p, pIdx) => {
                  const url = getAmcMediaUrl(p);
                  return (
                    <a key={pIdx} href={url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                      <img
                        src={url}
                        alt={`AMC Photo ${pIdx + 1}`}
                        style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--ax-border)' }}
                      />
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="ax-modal__footer">
          <button type="button" className="ax-btn ax-btn--secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default Bihar_AMC_SRT_ViewData;
