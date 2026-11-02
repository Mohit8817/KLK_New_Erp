import { useState, useMemo, useEffect, useCallback } from 'react';
import { PageHead } from '../../../../shell/PageHead';
import {
  kashmirSrtService,
  getKashmirMediaUrl,
  type KashmirClaimItem,
} from '../../kashmir-services';
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
const TOTAL_COLUMNS = 17;

type ClaimStatusFilter = 'all' | 'not_raised' | 'raised' | 'approved';

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
  .solar-erp-page .ax-table th,
  .solar-erp-page .ax-table td {
    white-space: nowrap;
    vertical-align: middle;
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

  @media (max-width: 900px) {
    .solar-erp-page .ax-dash-grid > .ax-card {
      grid-column: span 12 !important;
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

const ICON_PROPS = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

const ICON_REFRESH = (
  <svg className="ax-btn__icon" {...ICON_PROPS}>
    <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
    <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
  </svg>
);

const X_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

const money = (v: unknown) => (v ? `₹${Number(v).toLocaleString('en-IN')}` : DASH);

const claimStatusLabel = (s: unknown) => (Number(s) === 2 ? 'Approved' : Number(s) === 1 ? 'Raised' : 'Not Raised');
const payStatusLabel = (s: unknown) => (Number(s) === 1 ? 'Done' : Number(s) === 2 ? 'Partial' : 'Pending');

const payStatusBadge = (status?: number) => {
  if (Number(status) === 1) return <span className="ax-badge ax-badge--soft ax-badge--success" style={{ fontWeight: 600 }}>Done</span>;
  if (Number(status) === 2) return <span className="ax-badge ax-badge--soft ax-badge--warning" style={{ fontWeight: 600 }}>Partial</span>;
  return <span className="ax-badge ax-badge--soft ax-badge--neutral" style={{ fontWeight: 600 }}>Pending</span>;
};

export function Kashmir_Installation_ClaimRequest() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<KashmirClaimItem[]>([]);
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<ClaimStatusFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const list = await kashmirSrtService.getViewClaimRequest();
      setRows(Array.isArray(list) ? list : []);
    } catch (err: any) {
      console.error('Failed to load claim requests:', err);
      setFeedbackMsg({ type: 'danger', text: err?.message || 'Failed to load claim requests.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!feedbackMsg) return;
    const t = window.setTimeout(() => setFeedbackMsg(null), 4000);
    return () => window.clearTimeout(t);
  }, [feedbackMsg]);

  // Distinct districts
  const districts = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => {
      if (r.district && r.district.trim()) set.add(r.district.trim());
    });
    return Array.from(set).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const cs = Number(r.inst_claim_status);
      if (statusFilter === 'approved' && cs !== 2) return false;
      if (statusFilter === 'raised' && cs !== 1) return false;
      if (statusFilter === 'not_raised' && (cs === 1 || cs === 2)) return false;

      if (districtFilter !== 'all' && (r.district || '').toLowerCase() !== districtFilter.toLowerCase()) {
        return false;
      }

      if (!q) return true;
      return (
        String(r.id).includes(q) ||
        (r.site_name && r.site_name.toLowerCase().includes(q)) ||
        (r.district && r.district.toLowerCase().includes(q)) ||
        (r.inst_claim_amount && String(r.inst_claim_amount).includes(q))
      );
    });
  }, [rows, search, districtFilter, statusFilter]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const hasFilters = search.trim() !== '' || districtFilter !== 'all' || statusFilter !== 'all';
  const resetFilters = () => {
    setSearch('');
    setDistrictFilter('all');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  // Export columns
  const exportCols: ExportColumn<KashmirClaimItem>[] = useMemo(
    () => [
      { header: 'ID', accessor: (r) => r.id },
      { header: 'State', accessor: (r) => r.state || 'Kashmir' },
      { header: 'District', accessor: (r) => r.district || '' },
      { header: 'Site Name', accessor: (r) => r.site_name },
      { header: 'Claim Raised Date', accessor: (r) => r.inst_claim_date || DASH },
      { header: 'Claim Invoice', accessor: (r) => r.inst_claim_invoice || DASH },
      { header: 'Claim Amount', accessor: (r) => String(r.inst_claim_amount || '') },
      { header: 'Claim Update Date', accessor: (r) => r.claim_updated_at || DASH },
      { header: 'Claim Update by', accessor: (r) => r.claim_updated_by || DASH },
      { header: 'Claim Status', accessor: (r) => claimStatusLabel(r.inst_claim_status) },
      { header: 'Payment 80% Date', accessor: (r) => r.inst_pay80_date || DASH },
      { header: 'Payment 80% Amount', accessor: (r) => String(r.inst_pay80_amount || DASH) },
      { header: 'Payment 80% Status', accessor: (r) => payStatusLabel(r.inst_pay80_status) },
      { header: 'Document Submit', accessor: (r) => (r.inst_doc_submit === 1 ? 'Submitted' : 'Pending') },
      { header: 'Payment 20% Date', accessor: (r) => r.inst_pay20_date || DASH },
      { header: 'Payment 20% Amount', accessor: (r) => String(r.inst_pay20_amount || DASH) },
      { header: 'Payment 20% Status', accessor: (r) => payStatusLabel(r.inst_pay20_status) },
    ],
    []
  );

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="View Kashmir SRT70MW Claim Request"
        subtitle="Welcome to, View Kashmir SRT70MW Claim Request"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Kashmir' },
          { label: 'Installation' },
          { label: 'SRT 70MW' },
          { label: 'Claim Request' },
        ]}
        actions={
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}>
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

      {feedbackMsg && (
        <div
          className={`ax-alert ax-alert--${feedbackMsg.type}`}
          style={{ marginBottom: 'var(--ax-space-4)' }}
          role="status"
        >
          <div className="ax-alert__content">{feedbackMsg.text}</div>
          <button
            type="button"
            className="ax-btn ax-btn--ghost ax-btn--xs"
            onClick={() => setFeedbackMsg(null)}
            aria-label="Dismiss alert"
          >
            {X_ICON}
          </button>
        </div>
      )}

      <div className="ax-dash-grid">
        {/* ── Main Table Card ── */}
        <section className="ax-card ax-col--12" role="region" aria-label="Claim Request Records">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">CLAIM REQUESTS</span>
              <h2 className="ax-card__title">View Claim Request Details</h2>
              <p className="ax-card__subtitle ax-num" style={{ fontFamily: 'var(--ax-font-mono)' }}>
                {filtered.length} of {rows.length} records
              </p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                {districts.length > 0 && (
                  <select
                    id="dist_filter"
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

                <select
                  id="status_filter"
                  className="ax-input ax-input--sm"
                  style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as ClaimStatusFilter);
                    setCurrentPage(1);
                  }}
                  aria-label="Filter by claim status"
                >
                  <option value="all">All Status</option>
                  <option value="not_raised">Not Raised</option>
                  <option value="raised">Raised</option>
                  <option value="approved">Approved</option>
                </select>

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
                  value={search}
                  onChange={(val) => { setSearch(val); setCurrentPage(1); }}
                  placeholder="Search site, district, amount…"
                  size="sm"
                  ariaLabel="Search claim requests"
                />

                <TableExportToolbar
                  onCopy={() => copyTableDataToClipboard(filtered, exportCols)}
                  onExportCSV={() => exportDataToCSV('Kashmir_SRT_70MW_Claims', filtered, exportCols)}
                  onExportExcel={() => exportDataToExcel('Kashmir_SRT_70MW_Claims', filtered, exportCols)}
                  onExportPDF={() => printTableData('Kashmir SRT 70MW Claim Request Details', filtered, exportCols)}
                />
              </div>
            </div>
          </div>

          <div className="ax-table-wrap">
            <table
              className="ax-table ax-table--hover ula-table--wide"
              style={{ whiteSpace: 'nowrap', minWidth: 2000 }}
            >
              <caption className="ax-visually-hidden">View Kashmir SRT70MW Claim Request Records</caption>
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col" style={{ width: 60 }}>Sr. No.</th>
                  <th className="ax-table__th" scope="col">State</th>
                  <th className="ax-table__th" scope="col">District</th>
                  <th className="ax-table__th" scope="col" style={{ minWidth: 160 }}>Site Name</th>
                  <th className="ax-table__th" scope="col">Claim Raised Date</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Claim Invoice</th>
                  <th className="ax-table__th" scope="col">Claim Amount</th>
                  <th className="ax-table__th" scope="col">Claim Update Date</th>
                  <th className="ax-table__th" scope="col">Claim Update by</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Claim Status</th>
                  <th className="ax-table__th" scope="col">Payment 80% Date</th>
                  <th className="ax-table__th" scope="col">Payment 80% Amount</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Payment 80% Status</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Document Submit</th>
                  <th className="ax-table__th" scope="col">Payment 20% Date</th>
                  <th className="ax-table__th" scope="col">Payment 20% Amount</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Payment 20% Status</th>
                </tr>
              </thead>
              <tbody aria-busy={loading}>
                {loading && (
                  <tr>
                    <td className="ax-table__td" colSpan={TOTAL_COLUMNS} style={{ textAlign: 'center', padding: 32 }}>
                      <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading claim requests…
                    </td>
                  </tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td className="ax-table__td" colSpan={TOTAL_COLUMNS} style={{ padding: 0 }}>
                      <TableEmptyState
                        title="No data available in table"
                        message={
                          hasFilters
                            ? 'No records match your filters or search. Try clearing your query.'
                            : 'Claim requests will appear here.'
                        }
                        query={search}
                        onClear={hasFilters ? resetFilters : undefined}
                      />
                    </td>
                  </tr>
                )}
                {!loading &&
                  paginated.map((r, idx) => {
                    const cStatus = Number(r.inst_claim_status);
                    return (
                      <tr key={r.id || idx} className="ax-table__row">
                        <td className="ax-table__td ax-num">{(currentPage - 1) * pageSize + idx + 1}</td>
                        <td className="ax-table__td" style={{ textTransform: 'capitalize' }}>{r.state || 'Kashmir'}</td>
                        <td className="ax-table__td">{r.district || DASH}</td>
                        <td className="ax-table__td" style={{ fontWeight: 600 }}>{r.site_name}</td>
                        <td className="ax-table__td">{r.inst_claim_date || DASH}</td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          {r.inst_claim_invoice ? (
                            <a
                              href={getKashmirMediaUrl(r.inst_claim_invoice)}
                              target="_blank"
                              rel="noreferrer"
                              className="ax-btn ax-btn--ghost ax-btn--sm"
                              style={{ padding: '2px 8px', fontSize: 11 }}
                            >
                              Invoice ↗
                            </a>
                          ) : (
                            DASH
                          )}
                        </td>
                        <td className="ax-table__td" style={{ fontWeight: 600 }}>
                          ₹{Number(r.inst_claim_amount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="ax-table__td">{r.claim_updated_at || DASH}</td>
                        <td className="ax-table__td">{r.claim_updated_by || DASH}</td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          {cStatus === 2 ? (
                            <span className="ax-badge ax-badge--soft ax-badge--success" style={{ fontWeight: 600 }}>Approved</span>
                          ) : cStatus === 1 ? (
                            <span className="ax-badge ax-badge--soft ax-badge--info" style={{ fontWeight: 600 }}>Raised</span>
                          ) : (
                            <span className="ax-badge ax-badge--soft ax-badge--neutral" style={{ fontWeight: 600 }}>Not Raised</span>
                          )}
                        </td>
                        <td className="ax-table__td">{r.inst_pay80_date || DASH}</td>
                        <td className="ax-table__td">{money(r.inst_pay80_amount)}</td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>{payStatusBadge(r.inst_pay80_status)}</td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          {r.inst_doc_submit === 1 ? (
                            <span className="ax-badge ax-badge--soft ax-badge--success" style={{ fontWeight: 600 }}>Submitted</span>
                          ) : (
                            <span className="ax-badge ax-badge--soft ax-badge--warning" style={{ fontWeight: 600 }}>Pending</span>
                          )}
                        </td>
                        <td className="ax-table__td">{r.inst_pay20_date || DASH}</td>
                        <td className="ax-table__td">{money(r.inst_pay20_amount)}</td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>{payStatusBadge(r.inst_pay20_status)}</td>
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
                pageSize={pageSize}
                totalItems={filtered.length}
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
                pageSizeOptions={[25, 50, 100, 200, 300]}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Kashmir_Installation_ClaimRequest;