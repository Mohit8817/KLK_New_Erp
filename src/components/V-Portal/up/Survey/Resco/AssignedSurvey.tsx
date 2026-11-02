import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageHead } from '../../../../shell/PageHead';
import {
  upSurveyService,
  getUpSurveyMediaUrl,
  type UpRescoAssignedBatch,
} from '../../up-services';
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

export function UP_Survey_Resco_AssignedSurvey() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<UpRescoAssignedBatch[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadData = useCallback(() => {
    setLoading(true);
    upSurveyService
      .getViewAssignedRescoSurveys()
      .then((res) => {
        setData(res);
      })
      .catch((err) => {
        console.error('Error fetching assigned Resco surveys:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Search filter
  const filteredList = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter((item) => {
      const names = Array.isArray(item.site_names) ? item.site_names.join(' ') : String(item.site_name || '');
      return (
        String(item.id || '').toLowerCase().includes(q) ||
        String(item.vendor_name || '').toLowerCase().includes(q) ||
        String(item.state || '').toLowerCase().includes(q) ||
        String(item.district || '').toLowerCase().includes(q) ||
        names.toLowerCase().includes(q) ||
        String(item.remarks || '').toLowerCase().includes(q)
      );
    });
  }, [data, search]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredList.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredList.slice(start, start + pageSize);
  }, [filteredList, currentPage, pageSize]);

  // Export Columns definition
  const exportCols: ExportColumn<UpRescoAssignedBatch>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r, i) => i + 1 },
      { header: 'Vendor', accessor: (r) => r.vendor_name || DASH },
      { header: 'Assign Date', accessor: (r) => r.assign_date || DASH },
      { header: 'State', accessor: (r) => (r.state || 'UP').toUpperCase() },
      { header: 'District', accessor: (r) => r.district || DASH },
      {
        header: 'Site Name',
        accessor: (r) =>
          Array.isArray(r.site_names) && r.site_names.length > 0
            ? r.site_names.join(', ')
            : r.site_name || DASH,
      },
      {
        header: 'Site Count',
        accessor: (r) => {
          if (Array.isArray(r.site_names)) return r.site_names.length;
          try {
            const parsed = JSON.parse(r.site_name || '[]');
            if (Array.isArray(parsed)) return parsed.length;
          } catch {
            // ignore
          }
          return r.site_name ? 1 : 0;
        },
      },
      { header: 'File', accessor: (r) => (r.file ? getUpSurveyMediaUrl(r.file) : DASH) },
      { header: 'Remarks', accessor: (r) => r.remarks || DASH },
    ],
    []
  );

  return (
    <div className="ax-page solar-erp-page">
      <style>{`
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
      `}</style>

      {/* Header */}
      <PageHead
        title="Welcome to, View Assigned Resco Survey"
        subtitle="Assigned Resco rooftop solar survey batches for your vendor account"
        breadcrumbs={[
          { label: 'Home', href: '/v' },
          { label: 'Assigned Resco Survey' },
        ]}
      />

      {/* Main Table Card */}
      <div className="ax-card">
        <div
          className="ax-card__header"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            padding: '16px 20px',
            borderBottom: '1px solid var(--ax-border, #e2e8f0)',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ax-text, #0f172a)' }}>
              Assigned Resco Site
            </h3>
            <span style={{ fontSize: 12, color: 'var(--ax-text-muted)' }}>
              Batch allocations for rooftop solar site surveys
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ width: 260 }}>
              <SearchInput
                placeholder="Search..."
                value={search}
                onChange={(v) => {
                  setSearch(v);
                  setPage(1);
                }}
              />
            </div>
            <TableExportToolbar
              onCopy={() => copyTableDataToClipboard('Assigned_Resco_Surveys', filteredList, exportCols)}
              onExportCSV={() => exportDataToCSV('Assigned_Resco_Surveys', filteredList, exportCols)}
              onExportExcel={() => exportDataToExcel('Assigned_Resco_Surveys', filteredList, exportCols)}
              onPrint={() => printTableData('Vendor UP Assigned Resco Surveys', filteredList, exportCols)}
            />
          </div>
        </div>

        {/* Table Body */}
        <div className="ax-card__body" style={{ padding: 0 }}>
          <div className="ax-table-wrapper" style={{ overflowX: 'auto', maxHeight: '68vh' }}>
            <table className="ax-table" style={{ width: '100%', borderCollapse: 'collapse', whiteSpace: 'nowrap' }}>
              <thead>
                <tr>
                  <th style={{ width: 60, textAlign: 'center' }}>Sr. No.</th>
                  <th>Vendor</th>
                  <th>Assign Date</th>
                  <th>State</th>
                  <th>District</th>
                  <th>Site Name</th>
                  <th style={{ textAlign: 'center' }}>Site Count</th>
                  <th>File</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: 40, color: 'var(--ax-text-muted)' }}>
                      Loading assigned Resco surveys...
                    </td>
                  </tr>
                ) : pageData.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: 40, textAlign: 'center' }}>
                      <TableEmptyState
                        title="No data available in table"
                        message={
                          search
                            ? 'No survey batches match your search criteria.'
                            : 'There are currently no assigned Resco survey batches.'
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  pageData.map((row, idx) => {
                    const srNo = (currentPage - 1) * pageSize + idx + 1;
                    const fileUrl = row.file ? getUpSurveyMediaUrl(row.file) : null;
                    let siteCount = 0;
                    if (Array.isArray(row.site_names)) {
                      siteCount = row.site_names.length;
                    } else if (row.site_name) {
                      try {
                        const parsed = JSON.parse(row.site_name);
                        siteCount = Array.isArray(parsed) ? parsed.length : 1;
                      } catch {
                        siteCount = 1;
                      }
                    }

                    return (
                      <tr key={row.id || idx}>
                        <td style={{ textAlign: 'center' }}>{srNo}</td>
                        <td style={{ fontWeight: 600 }}>{row.vendor_name || DASH}</td>
                        <td>{row.assign_date || DASH}</td>
                        <td>{(row.state || 'UP').toUpperCase()}</td>
                        <td>{row.district || DASH}</td>
                        <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {Array.isArray(row.site_names) && row.site_names.length > 0 ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                              {row.site_names.map((name, i) => (
                                <span
                                  key={i}
                                  style={{
                                    fontSize: 11.5,
                                    padding: '2px 8px',
                                    borderRadius: 4,
                                    background: 'var(--ax-surface-subtle, #f1f5f9)',
                                    border: '1px solid var(--ax-border, #cbd5e1)',
                                  }}
                                >
                                  {name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            row.site_name || DASH
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '2px 10px',
                              borderRadius: 9999,
                              fontWeight: 700,
                              fontSize: 12,
                              background: 'rgba(37, 99, 235, 0.1)',
                              color: '#2563eb',
                            }}
                          >
                            {siteCount}
                          </span>
                        </td>
                        <td>
                          {fileUrl ? (
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--ax-accent, #2563eb)' }}
                            >
                              <span>📎</span>
                              <span style={{ fontSize: 12 }}>View File</span>
                            </a>
                          ) : (
                            <span style={{ color: 'var(--ax-text-muted)' }}>{DASH}</span>
                          )}
                        </td>
                        <td>{row.remarks || DASH}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table Footer with Pagination */}
        <div className="ax-card__footer" style={{ padding: '12px 20px', borderTop: '1px solid var(--ax-border, #e2e8f0)' }}>
          <div className="ula-pagination-left">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredList.length}
              pageSize={pageSize}
              onPageChange={(p) => setPage(p)}
              onPageSizeChange={(sz) => {
                setPageSize(sz);
                setPage(1);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export const UPSurveyRescoAssignedSurvey = UP_Survey_Resco_AssignedSurvey;
export default UP_Survey_Resco_AssignedSurvey;
