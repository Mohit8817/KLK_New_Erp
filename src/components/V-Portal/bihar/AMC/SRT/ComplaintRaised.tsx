import { useEffect, useMemo, useState, useCallback, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  biharAmcService,
  type BiharSrtAmcComplaintItem,
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

type Row = BiharSrtAmcComplaintItem;

const DASH = '—';
const txt = (v: unknown) => (v === null || v === undefined || v === '' ? DASH : String(v));

/* Responsive page CSS (Exact matching View Data / Complaints) */
const PAGE_CSS = `
  .solar-erp-page .ax-card { min-width: 0; }
  .solar-erp-page .ax-card__footer { width: 100%; box-sizing: border-box; }
  .solar-erp-page .ula-pagination-left {
    width: 100%; display: flex; justify-content: flex-start; align-items: center; margin: 0; overflow-x: auto;
  }
  .solar-erp-page .ula-pagination-left > * { margin-left: 0 !important; margin-right: 0 !important; }

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

export function Bihar_AMC_SRT_ComplaintRaised() {
  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState<Row[]>([]);
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await biharAmcService.getSrtAmcComplaints();
      setComplaints(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load SRT complaints:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Distinct districts
  const districts = useMemo(() => {
    const s = new Set<string>();
    complaints.forEach((r) => {
      if (r.district && String(r.district).trim()) s.add(String(r.district).trim());
    });
    return Array.from(s).sort();
  }, [complaints]);

  // Filtered
  const filtered = useMemo(() => {
    return complaints.filter((r) => {
      if (districtFilter !== 'all' && (r.district || '').toLowerCase() !== districtFilter.toLowerCase()) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const str = [
          r.complaint_id,
          r.site_name,
          r.complaint,
          r.district,
          r.dept_name,
          r.location,
          r.firm_name,
          r.ca_no,
          r.wo_no,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!str.includes(q)) return false;
      }
      return true;
    });
  }, [complaints, districtFilter, search]);

  // Pagination
  const paged = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [districtFilter, search]);

  // Export Columns
  const exportCols: ExportColumn<Row>[] = useMemo(
    () => [
      { header: 'Complaint ID', accessor: (r) => String(r.complaint_id || DASH) },
      { header: 'Complaint Date', accessor: (r) => r.start_date || r.complaint_date || DASH },
      { header: 'Complaint', accessor: (r) => r.complaint || DASH },
      { header: 'State', accessor: (r) => r.state || 'Bihar' },
      { header: 'Discom', accessor: (r) => r.discom || DASH },
      { header: 'District', accessor: (r) => r.district || DASH },
      { header: 'Dept Name', accessor: (r) => r.dept_name || DASH },
      { header: 'Site Name', accessor: (r) => r.site_name || DASH },
      { header: 'Location', accessor: (r) => r.location || DASH },
      { header: 'Firm Name', accessor: (r) => r.firm_name || DASH },
      { header: 'CA No', accessor: (r) => r.ca_no || DASH },
      { header: 'Sanction Load', accessor: (r) => String(r.sanction_load ?? DASH) },
      { header: 'Plant SC', accessor: (r) => r.plant_sc || DASH },
      { header: 'WO No', accessor: (r) => r.wo_no || DASH },
      { header: 'Phase', accessor: (r) => r.phase || DASH },
    ],
    []
  );

  const handleCopy = () => copyTableDataToClipboard(filtered, exportCols);
  const handleCsv = () => exportDataToCSV('Bihar_SRT_AMC_Complaints', filtered, exportCols);
  const handleExcel = () => exportDataToExcel('Bihar_SRT_AMC_Complaints', filtered, exportCols);
  const handlePdf = () => printTableData('Bihar SRT AMC Complaints List', filtered, exportCols);

  const resetFilters = () => {
    setSearch('');
    setDistrictFilter('all');
  };

  const TOTAL_COLS = 16;

  return (
    <div className="solar-erp-page bihar-srt-complaint-view">
      <style>{PAGE_CSS}</style>

      <PageHead
        title="View SRT Complaint"
        subtitle={
          <span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>
            Welcome to, View SRT AMC Site Complaint
          </span>
        }
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Bihar' },
          { label: 'AMC' },
          { label: 'SRT', href: '/v/bihar-view-srt-amc' },
          { label: 'View SRT AMC Site Complaint' },
        ]}
        actions={
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}>
            <Link to="/v/bihar-view-srt-amc" className="ax-btn ax-btn--secondary ax-btn--pill">
              <span className="ax-btn__label">View AMC Sites</span>
            </Link>
            <Link to="/v/bihar-add-srt-amc" className="ax-btn ax-btn--primary ax-btn--pill">
              <span className="ax-btn__label">Add SRT AMC</span>
            </Link>
          </div>
        }
      />

      <div className="ax-card">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title" style={{ fontSize: 'var(--ax-text-base)', margin: 0 }}>
              View SRT AMC Site Complaint
            </h2>
            <p className="ax-card__subtitle" style={{ fontSize: 'var(--ax-text-xs)', margin: '4px 0 0' }}>
              Showing {filtered.length} complaint ticket(s)
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
                placeholder="Search complaints..."
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

        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap', minWidth: 1800 }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th" style={{ width: 60 }}>Sr. no.</th>
                <th className="ax-table__th">Complaint ID</th>
                <th className="ax-table__th">Complaint Date</th>
                <th className="ax-table__th" style={{ minWidth: 200 }}>Complaint</th>
                <th className="ax-table__th">State</th>
                <th className="ax-table__th">Discom</th>
                <th className="ax-table__th">District</th>
                <th className="ax-table__th">Dept Name</th>
                <th className="ax-table__th" style={{ minWidth: 160 }}>Site Name</th>
                <th className="ax-table__th">Location</th>
                <th className="ax-table__th">Firm Name</th>
                <th className="ax-table__th">CA No</th>
                <th className="ax-table__th">Sanction Load</th>
                <th className="ax-table__th">Plant SC</th>
                <th className="ax-table__th">WO No</th>
                <th className="ax-table__th">Phase</th>
              </tr>
            </thead>
            <tbody aria-busy={loading}>
              {loading && (
                <tr>
                  <td colSpan={TOTAL_COLS} style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--ax-text-muted)' }}>
                    <span className="ax-spinner" style={{ marginRight: 8, verticalAlign: 'middle' }} />
                    Loading SRT complaints…
                  </td>
                </tr>
              )}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={TOTAL_COLS} style={{ padding: 0 }}>
                    <TableEmptyState
                      title="No data available in table"
                      message={search ? 'No complaints match your search query.' : 'No SRT AMC complaints recorded yet.'}
                      onClear={search || districtFilter !== 'all' ? resetFilters : undefined}
                      clearLabel="Clear filters"
                    />
                  </td>
                </tr>
              )}

              {!loading &&
                paged.map((r, idx) => {
                  const srNo = (currentPage - 1) * pageSize + idx + 1;
                  return (
                    <tr key={r.id || idx} className="ax-table__row">
                      <td className="ax-table__td ax-num" style={{ fontWeight: 600 }}>{srNo}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-primary)' }}>
                        #{r.complaint_id}
                      </td>
                      <td className="ax-table__td">{r.start_date || r.complaint_date || DASH}</td>
                      <td className="ax-table__td" style={{ maxWidth: 260, whiteSpace: 'normal', fontSize: 12 }}>
                        {txt(r.complaint)}
                      </td>
                      <td className="ax-table__td">{r.state || 'Bihar'}</td>
                      <td className="ax-table__td">{txt(r.discom)}</td>
                      <td className="ax-table__td">{txt(r.district)}</td>
                      <td className="ax-table__td">{txt(r.dept_name)}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                        {txt(r.site_name)}
                      </td>
                      <td className="ax-table__td">{txt(r.location)}</td>
                      <td className="ax-table__td">{txt(r.firm_name)}</td>
                      <td className="ax-table__td">{txt(r.ca_no)}</td>
                      <td className="ax-table__td">{txt(r.sanction_load)}</td>
                      <td className="ax-table__td">{txt(r.plant_sc)}</td>
                      <td className="ax-table__td">{txt(r.wo_no)}</td>
                      <td className="ax-table__td">{txt(r.phase)}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

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

      <footer style={{ marginTop: 'var(--ax-space-8)', textAlign: 'center', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
        Copyright © <a href="https://klkerp.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--ax-primary)' }}>ETS NETWORKS</a>. All rights reserved.
      </footer>
    </div>
  );
}

export default Bihar_AMC_SRT_ComplaintRaised;
