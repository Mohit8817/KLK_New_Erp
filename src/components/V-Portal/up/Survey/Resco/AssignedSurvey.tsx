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

/* ───────── Constants ───────── */
const DASH = '—';
const txt = (v: unknown) => (v === null || v === undefined || v === '' ? DASH : String(v));

const actionsRowStyle = {
  gap: 'var(--ax-space-2)',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'flex-end',
  width: '100%',
} as const;

/* ───────── Responsive page CSS (Exact Arunachal / Solar ERP Reference) ───────── */
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
`;

/* ───────── Component ───────── */

export function UP_Survey_Resco_AssignedSurvey() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<UpRescoAssignedBatch[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

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

  /* ── Search filter ── */
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

  /* ── Pagination ── */
  const totalPages = Math.max(1, Math.ceil(filteredList.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredList.slice(start, start + pageSize);
  }, [filteredList, currentPage, pageSize]);

  const hasFilters = !!search;
  const clearFilters = () => {
    setSearch('');
    setPage(1);
  };

  /* ── Export Columns ── */
  const exportCols: ExportColumn<UpRescoAssignedBatch>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r, i) => (i !== undefined ? i + 1 : 1) },
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
            /* ignore */
          }
          return r.site_name ? 1 : 0;
        },
      },
      { header: 'File', accessor: (r) => (r.file ? getUpSurveyMediaUrl(r.file) : DASH) },
      { header: 'Remarks', accessor: (r) => r.remarks || DASH },
    ],
    []
  );

  /* ── Export handlers ── */
  const handleCopy = () => copyTableDataToClipboard(filteredList, exportCols);
  const handleCsv = () => exportDataToCSV('Assigned_Resco_Surveys', filteredList, exportCols);
  const handleExcel = () => exportDataToExcel('Assigned_Resco_Surveys', filteredList, exportCols);
  const handlePdf = () => printTableData('Vendor UP Assigned Resco Surveys', filteredList, exportCols);

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="Assigned Resco Survey"
        subtitle="Assigned Resco rooftop solar survey batches for your vendor account"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Uttar Pradesh' },
          { label: 'Survey' },
          { label: 'Resco' },
          { label: 'Assigned Survey' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)', alignItems: 'center' }}>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={loadData}
              disabled={loading}
            >
              <svg
                className="ax-btn__icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.75}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
                <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
              </svg>
              <span className="ax-btn__label">Refresh</span>
            </button>
          </div>
        }
      />

      <div className="ax-dash-grid">
        {/* ── Main Table Card ── */}
        <section className="ax-card ax-col--12" role="region" aria-label="Assigned Resco Surveys">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">UP RESCO</span>
              <h2 className="ax-card__title">Assigned Resco Sites</h2>
              <p className="ax-card__subtitle">
                <span className="ax-num">{filteredList.length}</span> of{' '}
                <span className="ax-num">{data.length}</span> batch allocations for rooftop solar site surveys
              </p>
            </div>

            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
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
                    setPage(1);
                  }}
                  placeholder="Search vendor, district…"
                  size="sm"
                  ariaLabel="Search assigned surveys"
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

          {/* ── Table ── */}
          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap' }}>
              <caption className="ax-visually-hidden">Assigned Resco Survey Batches</caption>
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col" style={{ width: 60 }}>Sr. No.</th>
                  <th className="ax-table__th" scope="col">Vendor</th>
                  <th className="ax-table__th" scope="col">Assign Date</th>
                  <th className="ax-table__th" scope="col">State</th>
                  <th className="ax-table__th" scope="col">District</th>
                  <th className="ax-table__th" scope="col">Site Name</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Site Count</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>File</th>
                  <th className="ax-table__th" scope="col">Remarks</th>
                </tr>
              </thead>
              <tbody aria-busy={loading}>
                {loading && (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--ax-text-muted)' }}>
                      <span className="ax-spinner" style={{ width: 20, height: 20, marginRight: 8, verticalAlign: 'middle' }} />
                      Loading assigned Resco surveys…
                    </td>
                  </tr>
                )}
                {!loading && filteredList.length === 0 && (
                  <tr>
                    <td colSpan={9} style={{ padding: 0 }}>
                      <TableEmptyState
                        title="No survey batches found"
                        message={
                          hasFilters
                            ? 'No survey batches match your search criteria. Try clearing the search.'
                            : 'There are currently no assigned Resco survey batches.'
                        }
                        onClear={hasFilters ? clearFilters : undefined}
                        clearLabel="Clear search"
                      />
                    </td>
                  </tr>
                )}
                {!loading &&
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
                      <tr key={row.id ?? idx} className="ax-table__row">
                        <td className="ax-table__td ax-num" style={{ textAlign: 'center' }}>{srNo}</td>
                        <td className="ax-table__td" style={{ fontWeight: 700, color: 'var(--ax-text-strong)' }}>
                          {txt(row.vendor_name)}
                        </td>
                        <td className="ax-table__td">{txt(row.assign_date)}</td>
                        <td className="ax-table__td">{(row.state || 'UP').toUpperCase()}</td>
                        <td className="ax-table__td" style={{ fontWeight: 600 }}>{txt(row.district)}</td>
                        <td className="ax-table__td" style={{ maxWidth: 320, whiteSpace: 'normal' }}>
                          {Array.isArray(row.site_names) && row.site_names.length > 0 ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                              {row.site_names.map((name, i) => (
                                <span key={i} className="ax-badge ax-badge--soft ax-badge--neutral" style={{ fontSize: 11 }}>
                                  {name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            txt(row.site_name)
                          )}
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <span className="ax-badge ax-badge--soft ax-badge--accent ax-badge--pill" style={{ fontWeight: 700 }}>
                            {siteCount}
                          </span>
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          {fileUrl ? (
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ax-btn ax-btn--ghost ax-btn--xs"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            >
                              <svg
                                viewBox="0 0 24 24"
                                width={14}
                                height={14}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={1.75}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                              >
                                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                              </svg>
                              <span>View File</span>
                            </a>
                          ) : (
                            <span style={{ color: 'var(--ax-text-muted)' }}>{DASH}</span>
                          )}
                        </td>
                        <td className="ax-table__td" style={{ maxWidth: 200, whiteSpace: 'normal', fontSize: 12 }}>
                          {txt(row.remarks)}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* ── Left-Aligned Pagination ── */}
          <div className="ax-card__footer">
            <div className="ula-pagination-left">
              <Pagination
                currentPage={currentPage}
                pageSize={pageSize}
                totalItems={filteredList.length}
                onPageChange={setPage}
                onPageSizeChange={(sz) => {
                  setPageSize(sz);
                  setPage(1);
                }}
                pageSizeOptions={[50, 100, 200]}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export const UPSurveyRescoAssignedSurvey = UP_Survey_Resco_AssignedSurvey;
export default UP_Survey_Resco_AssignedSurvey;