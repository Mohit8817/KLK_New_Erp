import React, { useEffect, useMemo, useRef, useState, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  goaSrtAmcService,
  getGoaAmcImageCandidates,
  type GoaAmcComplaintRecord,
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

export function Goa_AMC_SRT_ComplaintRaised() {
  const navigate = useNavigate();

  // Data states
  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState<GoaAmcComplaintRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Modal preview
  const [selectedComplaint, setSelectedComplaint] = useState<GoaAmcComplaintRecord | null>(null);

  // Load complaints
  const loadComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const data = await goaSrtAmcService.viewAmcComplaints();
      setComplaints(data);
    } catch (err: any) {
      console.warn('Error fetching complaints:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadComplaints();
  }, [loadComplaints]);

  // District options
  const districts = useMemo(() => {
    const set = new Set<string>();
    complaints.forEach((c) => {
      if (c.district) set.add(c.district);
    });
    return Array.from(set).sort();
  }, [complaints]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    let list = complaints;

    if (districtFilter !== 'all') {
      list = list.filter((c) => c.district === districtFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((c) => {
        return (
          String(c.id).toLowerCase().includes(q) ||
          (c.complaint_id && c.complaint_id.toLowerCase().includes(q)) ||
          (c.start_date && c.start_date.toLowerCase().includes(q)) ||
          (c.complaint && c.complaint.toLowerCase().includes(q)) ||
          (c.state && c.state.toLowerCase().includes(q)) ||
          (c.discom && c.discom.toLowerCase().includes(q)) ||
          (c.district && c.district.toLowerCase().includes(q)) ||
          (c.dept_name && c.dept_name.toLowerCase().includes(q)) ||
          (c.site_name && c.site_name.toLowerCase().includes(q)) ||
          (c.location && c.location.toLowerCase().includes(q)) ||
          (c.firm_name && c.firm_name.toLowerCase().includes(q)) ||
          (c.ca_no && c.ca_no.toLowerCase().includes(q)) ||
          (c.sanction_load && c.sanction_load.toLowerCase().includes(q)) ||
          (c.plant_sc && c.plant_sc.toLowerCase().includes(q)) ||
          (c.wo_no && c.wo_no.toLowerCase().includes(q)) ||
          (c.phase && c.phase.toLowerCase().includes(q))
        );
      });
    }

    return list;
  }, [complaints, districtFilter, searchQuery]);

  // Paginated rows
  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;
  const pagedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  // Export Columns (Exact 16 requested columns)
  const exportColumns: ExportColumn[] = [
    { key: 'srNo', label: 'Sr. no.' },
    { key: 'complaint_id', label: 'Complaint ID' },
    { key: 'start_date', label: 'Complaint Date' },
    { key: 'complaint', label: 'Complaint' },
    { key: 'state', label: 'State' },
    { key: 'discom', label: 'Discom' },
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
  ];

  const exportData = useMemo(() => {
    return filteredRows.map((r, idx) => ({
      srNo: idx + 1,
      complaint_id: r.complaint_id || `#${r.id}`,
      start_date: r.start_date || DASH,
      complaint: r.complaint || DASH,
      state: r.state || 'Goa',
      discom: r.discom || DASH,
      district: r.district || DASH,
      dept_name: r.dept_name || DASH,
      site_name: r.site_name || DASH,
      location: r.location || DASH,
      firm_name: r.firm_name || DASH,
      ca_no: r.ca_no || DASH,
      sanction_load: r.sanction_load || DASH,
      plant_sc: r.plant_sc || DASH,
      wo_no: r.wo_no || DASH,
      phase: r.phase || DASH,
    }));
  }, [filteredRows]);

  const hasFilters = searchQuery || districtFilter !== 'all';

  const resetFilters = () => {
    setSearchQuery('');
    setDistrictFilter('all');
    setCurrentPage(1);
  };

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* Page Head */}
      <PageHead
        title="Welcome to, View SRT Complaint"
        subtitle="View SRT AMC Site Complaint"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Goa' },
          { label: 'AMC' },
          { label: 'View SRT AMC Site Complaint' },
        ]}
        actions={
          <div className="ax-cluster">
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={loadComplaints} disabled={loading}>
              {ICON_REFRESH}
              <span className="ax-btn__label">Refresh</span>
            </button>
            <Link to="/v/goa-add-srt-amc" className="ax-btn ax-btn--primary ax-btn--sm">
              {ICON_PLUS}
              <span className="ax-btn__label">+ Raise AMC Complaint</span>
            </Link>
          </div>
        }
      />

      {/* Main Table Card */}
      <section className="ax-card ax-col--12" role="region" aria-label="Goa SRT AMC Complaints">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <span className="ax-card__eyebrow">AMC COMPLAINT</span>
            <h2 className="ax-card__title">View SRT AMC Site Complaint</h2>
            <p className="ax-card__subtitle ax-num" style={{ fontFamily: 'var(--ax-font-mono)' }}>
              {filteredRows.length} of {complaints.length} records
            </p>
          </div>

          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              {districts.length > 0 && (
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
                value={searchQuery}
                onChange={(val) => {
                  setSearchQuery(val);
                  setCurrentPage(1);
                }}
                placeholder="Search..."
                size="sm"
                ariaLabel="Search complaints"
              />

              <TableExportToolbar
                onCopy={() => copyTableDataToClipboard(exportColumns, exportData)}
                onExportCSV={() => exportDataToCSV(exportColumns, exportData, 'Goa_SRT_AMC_Complaints.csv')}
                onExportExcel={() => exportDataToExcel(exportColumns, exportData, 'Goa_SRT_AMC_Complaints.xlsx')}
                onExportPDF={() => printTableData(exportColumns, exportData, 'View SRT AMC Site Complaint')}
              />
            </div>
          </div>
        </div>

        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap' }}>
            <caption className="ax-visually-hidden">View SRT AMC Site Complaint</caption>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th" scope="col">Sr. no.</th>
                <th className="ax-table__th" scope="col">Complaint ID</th>
                <th className="ax-table__th" scope="col">Complaint Date</th>
                <th className="ax-table__th" scope="col">Complaint</th>
                <th className="ax-table__th" scope="col">State</th>
                <th className="ax-table__th" scope="col">Discom</th>
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
              </tr>
            </thead>
            <tbody aria-busy={loading}>
              {loading && (
                <tr>
                  <td className="ax-table__td" colSpan={16} style={{ textAlign: 'center', padding: 32 }}>
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading complaint records…
                  </td>
                </tr>
              )}
              {!loading && filteredRows.length === 0 && (
                <tr>
                  <td className="ax-table__td" colSpan={16} style={{ padding: 0 }}>
                    <TableEmptyState
                      title="No data available in table"
                      message={hasFilters ? 'No complaint records match your query. Try clearing filters.' : 'Complaint records will appear here.'}
                      query={searchQuery}
                      onClear={resetFilters}
                    />
                  </td>
                </tr>
              )}
              {!loading &&
                pagedRows.map((row, idx) => {
                  const srNo = (currentPage - 1) * pageSize + idx + 1;
                  return (
                    <tr
                      key={row.id}
                      className="ax-table__row"
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedComplaint(row)}
                      title="Click to view details"
                    >
                      <td className="ax-table__td" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: 12 }}>{srNo}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-accent)' }}>
                        {row.complaint_id || `#${row.id}`}
                      </td>
                      <td className="ax-table__td">{row.start_date || DASH}</td>
                      <td className="ax-table__td" style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {row.complaint || DASH}
                      </td>
                      <td className="ax-table__td">{row.state || 'Goa'}</td>
                      <td className="ax-table__td">{row.discom || DASH}</td>
                      <td className="ax-table__td">{row.district || DASH}</td>
                      <td className="ax-table__td">{row.dept_name || DASH}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                        {row.site_name || DASH}
                      </td>
                      <td className="ax-table__td">{row.location || DASH}</td>
                      <td className="ax-table__td">{row.firm_name || DASH}</td>
                      <td className="ax-table__td">{row.ca_no || DASH}</td>
                      <td className="ax-table__td">{row.sanction_load || DASH}</td>
                      <td className="ax-table__td">{row.plant_sc || DASH}</td>
                      <td className="ax-table__td">{row.wo_no || DASH}</td>
                      <td className="ax-table__td">{row.phase || DASH}</td>
                    </tr>
                  );
                })}
            </tbody>
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

      {/* Detail Dialog on row click */}
      {selectedComplaint && (
        <Modal
          open
          onClose={() => setSelectedComplaint(null)}
          labelledBy="complaint-detail-dialog-title"
          dialogClass="ax-modal__dialog--lg"
        >
          <div className="ax-modal__header">
            <div>
              <h3 className="ax-modal__title" id="complaint-detail-dialog-title">
                Complaint #{selectedComplaint.complaint_id || selectedComplaint.id}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--ax-text-muted)' }}>
                Site: {selectedComplaint.site_name} · Date: {selectedComplaint.start_date || DASH}
              </p>
            </div>
            <button
              type="button"
              className="ax-modal__close"
              onClick={() => setSelectedComplaint(null)}
              aria-label="Close dialog"
            >
              {X_ICON}
            </button>
          </div>

          <div className="ax-modal__body" style={{ padding: 24, maxHeight: '70vh', overflowY: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, fontSize: 13, marginBottom: 20 }}>
              <div><strong>State:</strong> {selectedComplaint.state || 'Goa'}</div>
              <div><strong>Discom:</strong> {selectedComplaint.discom || DASH}</div>
              <div><strong>District:</strong> {selectedComplaint.district || DASH}</div>
              <div><strong>Dept Name:</strong> {selectedComplaint.dept_name || DASH}</div>
              <div><strong>Location:</strong> {selectedComplaint.location || DASH}</div>
              <div><strong>Firm Name:</strong> {selectedComplaint.firm_name || DASH}</div>
              <div><strong>CA No:</strong> {selectedComplaint.ca_no || DASH}</div>
              <div><strong>Sanction Load:</strong> {selectedComplaint.sanction_load || DASH}</div>
              <div><strong>Plant SC:</strong> {selectedComplaint.plant_sc || DASH}</div>
              <div><strong>WO No:</strong> {selectedComplaint.wo_no || DASH}</div>
              <div><strong>Phase:</strong> {selectedComplaint.phase || DASH}</div>
              <div>
                <strong>Status:</strong>{' '}
                <span className={`ax-badge ax-badge--soft ${selectedComplaint.close_status === 0 || selectedComplaint.status === 0 ? 'ax-badge--warning' : 'ax-badge--success'}`}>
                  {selectedComplaint.close_status === 0 || selectedComplaint.status === 0 ? 'Open' : 'Closed'}
                </span>
              </div>
            </div>

            <div style={{ background: 'var(--ax-surface-subtle)', padding: 16, borderRadius: 8, marginBottom: 16 }}>
              <strong style={{ display: 'block', marginBottom: 6, fontSize: 13, color: 'var(--ax-text-strong)' }}>Complaint:</strong>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--ax-text)', whiteSpace: 'pre-wrap' }}>
                {selectedComplaint.complaint || 'No complaint text recorded.'}
              </p>
            </div>

            {selectedComplaint.file && (
              <div>
                <strong style={{ display: 'block', marginBottom: 8, fontSize: 13 }}>Attachment:</strong>
                {(() => {
                  const url = getGoaAmcImageCandidates(selectedComplaint.file)[0] || selectedComplaint.file;
                  return (
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="ax-btn ax-btn--secondary ax-btn--sm"
                    >
                      📎 View Attachment / Photo ↗
                    </a>
                  );
                })()}
              </div>
            )}
          </div>

          <div className="ax-modal__footer" style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" className="ax-btn ax-btn--primary" onClick={() => setSelectedComplaint(null)}>
              Close
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default Goa_AMC_SRT_ComplaintRaised;