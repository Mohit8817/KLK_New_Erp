import { useState, useMemo, useEffect, useCallback, useRef, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import { PageHead } from '../../../../shell/PageHead';
import {
  kashmirSrtService,
  getKashmirMediaUrl,
  type KashmirAssignSiteItem,
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
const TOTAL_COLUMNS = 10;

type StatusFilter = 'all' | 'pending' | 'accepted';

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

/* ───────── UI Modal Component ───────── */
function Modal({
  open,
  onClose,
  labelledBy,
  centered = true,
  dialogClass = '',
  dialogStyle,
  closeOnBackdrop = true,
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  centered?: boolean;
  dialogClass?: string;
  dialogStyle?: CSSProperties;
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
    <div
      className={`ax-modal${centered ? ' ax-modal--centered' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
    >
      <div className="ax-modal__backdrop" onClick={() => closeOnBackdrop && onClose()} />
      <div
        ref={dialogRef}
        className={`ax-modal__dialog${dialogClass ? ' ' + dialogClass : ''}`}
        style={dialogStyle}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

const getSiteCount = (item: KashmirAssignSiteItem): number => {
  const n = Number(item.assign_srt.sitecount);
  if (!isNaN(n) && n > 0) return n;
  return item.jammu_srt70mws?.length || 0;
};

export function Kashmir_Installation_AssignSite() {
  const [rows, setRows] = useState<KashmirAssignSiteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  // Selected batch for viewing site list in modal
  const [viewBatch, setViewBatch] = useState<KashmirAssignSiteItem | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const list = await kashmirSrtService.getAssignSites();
      setRows(Array.isArray(list) ? list : []);
    } catch (err: any) {
      console.error('Failed to load assigned sites:', err);
      setFeedbackMsg({ type: 'danger', text: err?.message || 'Failed to load assigned installation sites.' });
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

  // Handle Accept Action
  const handleAcceptAssignment = async (assignId: number) => {
    if (actionLoadingId !== null) return;
    if (!window.confirm('Are you sure you want to accept this assignment?')) return;

    setActionLoadingId(assignId);
    setFeedbackMsg(null);
    try {
      const resp = await kashmirSrtService.acceptAssignment(assignId);
      setFeedbackMsg({ type: 'success', text: resp.message || 'Status Updated Successfully!!!' });
      setRows((prev) =>
        prev.map((r) =>
          r.assign_srt.id === assignId ? { ...r, assign_srt: { ...r.assign_srt, status: 2 } } : r
        )
      );
    } catch (err: any) {
      setFeedbackMsg({ type: 'danger', text: err?.message || 'Failed to accept assignment.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Distinct districts
  const districts = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => {
      const d = r.assign_srt.district;
      if (d && d.trim()) set.add(d.trim());
    });
    return Array.from(set).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const a = r.assign_srt;
      const accepted = Number(a.status) === 2;

      if (statusFilter === 'pending' && accepted) return false;
      if (statusFilter === 'accepted' && !accepted) return false;

      if (districtFilter !== 'all' && (a.district || '').toLowerCase() !== districtFilter.toLowerCase()) {
        return false;
      }

      if (!q) return true;
      return (
        String(a.id).includes(q) ||
        (a.district && a.district.toLowerCase().includes(q)) ||
        (a.state && a.state.toLowerCase().includes(q)) ||
        (r.vendor_name && r.vendor_name.toLowerCase().includes(q)) ||
        (a.remarks && String(a.remarks).toLowerCase().includes(q)) ||
        (r.jammu_srt70mws && r.jammu_srt70mws.some((s) => s.site_name?.toLowerCase().includes(q)))
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
  const exportCols: ExportColumn<KashmirAssignSiteItem>[] = useMemo(
    () => [
      { header: 'Vendor', accessor: (r) => r.vendor_name || String(r.assign_srt.vendor || '') },
      { header: 'Assign Date', accessor: (r) => r.assign_srt.assign_date || DASH },
      { header: 'State', accessor: (r) => r.assign_srt.state || 'Kashmir' },
      { header: 'District', accessor: (r) => r.assign_srt.district || DASH },
      {
        header: 'Site Name - Deadline',
        accessor: (r) =>
          (r.jammu_srt70mws || [])
            .map((s) => `${s.site_name}${s.inst_deadline ? ` (${s.inst_deadline})` : ''}`)
            .join('; ') || DASH,
      },
      { header: 'Site Count', accessor: (r) => getSiteCount(r) },
      { header: 'File', accessor: (r) => r.assign_srt.file || DASH },
      { header: 'Remarks', accessor: (r) => r.assign_srt.remarks || DASH },
      { header: 'Status', accessor: (r) => (Number(r.assign_srt.status) === 2 ? 'Accepted' : 'Pending') },
    ],
    []
  );

  const renderSiteNameSnippet = (item: KashmirAssignSiteItem) => {
    const sites = item.jammu_srt70mws || [];
    if (sites.length > 0) {
      const first = sites[0];
      const count = sites.length;
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
            {first.site_name}
            {first.inst_deadline && (
              <span style={{ color: 'var(--ax-text-muted)', marginLeft: 6, fontWeight: 400, fontSize: 12 }}>
                (Deadline: {first.inst_deadline})
              </span>
            )}
          </span>
          {count > 1 && (
            <button
              type="button"
              className="ax-btn ax-btn--ghost ax-btn--xs"
              style={{ padding: '0 4px', height: 20, fontSize: 11, alignSelf: 'flex-start', color: 'var(--ax-accent)' }}
              onClick={() => setViewBatch(item)}
            >
              + {count - 1} more sites
            </button>
          )}
        </div>
      );
    }
    return String(item.assign_srt.site_name || DASH);
  };

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="View Assigned SRT Installation"
        subtitle="Welcome to, View Assigned SRT Installation"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Kashmir' },
          { label: 'Installation' },
          { label: 'SRT 70MW' },
          { label: 'Assign Site' },
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
        <section className="ax-card ax-col--12" role="region" aria-label="Assigned SRT Site Records">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">ASSIGNED SITES</span>
              <h2 className="ax-card__title">View Installation Records</h2>
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
                  style={{ width: 130, height: 32, fontSize: 'var(--ax-text-xs)' }}
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as StatusFilter);
                    setCurrentPage(1);
                  }}
                  aria-label="Filter by status"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
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
                  placeholder="Search vendor, site, district…"
                  size="sm"
                  ariaLabel="Search assignments"
                />

                <TableExportToolbar
                  onCopy={() => copyTableDataToClipboard(filtered, exportCols)}
                  onExportCSV={() => exportDataToCSV('Kashmir_Assigned_SRT_Sites', filtered, exportCols)}
                  onExportExcel={() => exportDataToExcel('Kashmir_Assigned_SRT_Sites', filtered, exportCols)}
                  onExportPDF={() => printTableData('Assigned SRT Installation Sites', filtered, exportCols)}
                />
              </div>
            </div>
          </div>

          <div className="ax-table-wrap">
            <table
              className="ax-table ax-table--hover ula-table--wide"
              style={{ whiteSpace: 'nowrap', minWidth: 1600 }}
            >
              <caption className="ax-visually-hidden">View Assigned SRT Installation Records</caption>
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col" style={{ width: 60 }}>Sr. No.</th>
                  <th className="ax-table__th" scope="col">Vendor</th>
                  <th className="ax-table__th" scope="col">Assign Date</th>
                  <th className="ax-table__th" scope="col">State</th>
                  <th className="ax-table__th" scope="col">District</th>
                  <th className="ax-table__th" scope="col" style={{ minWidth: 220 }}>Site Name - Deadline</th>
                  <th className="ax-table__th" scope="col" style={{ width: 90, textAlign: 'center' }}>Site Count</th>
                  <th className="ax-table__th" scope="col" style={{ width: 90, textAlign: 'center' }}>File</th>
                  <th className="ax-table__th" scope="col" style={{ minWidth: 160 }}>Remarks</th>
                  <th className="ax-table__th" scope="col" style={{ width: 100 }}>Status</th>
                </tr>
              </thead>
              <tbody aria-busy={loading}>
                {loading && (
                  <tr>
                    <td className="ax-table__td" colSpan={TOTAL_COLUMNS} style={{ textAlign: 'center', padding: 32 }}>
                      <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading assigned installation sites…
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
                            : 'Assigned installation sites will appear here.'
                        }
                        query={search}
                        onClear={hasFilters ? resetFilters : undefined}
                      />
                    </td>
                  </tr>
                )}
                {!loading &&
                  paginated.map((r, index) => {
                    const a = r.assign_srt;
                    const isAccepted = Number(a.status) === 2;
                    const siteCount = getSiteCount(r);

                    return (
                      <tr key={a.id || index} className="ax-table__row">
                        <td className="ax-table__td ax-num">{(currentPage - 1) * pageSize + index + 1}</td>
                        <td className="ax-table__td" style={{ fontWeight: 600 }}>
                          {r.vendor_name || `Vendor #${a.vendor}`}
                        </td>
                        <td className="ax-table__td">{a.assign_date || DASH}</td>
                        <td className="ax-table__td" style={{ textTransform: 'capitalize' }}>{a.state || 'Kashmir'}</td>
                        <td className="ax-table__td">{a.district || DASH}</td>
                        <td className="ax-table__td">{renderSiteNameSnippet(r)}</td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="ax-badge ax-badge--soft"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '2px 8px',
                              borderRadius: 'var(--ax-radius-pill, 9999px)',
                              background: 'rgba(var(--ax-accent-rgb, 73, 146, 255), 0.1)',
                              color: 'var(--ax-accent)',
                              fontWeight: 700,
                              fontSize: 12,
                              cursor: 'pointer',
                              border: 'none',
                            }}
                            onClick={() => setViewBatch(r)}
                            title="Click to view sites in this batch"
                          >
                            {siteCount}
                          </button>
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          {a.file ? (
                            <a
                              href={getKashmirMediaUrl(a.file)}
                              target="_blank"
                              rel="noreferrer"
                              className="ax-btn ax-btn--ghost ax-btn--sm"
                              style={{ padding: '2px 8px', fontSize: 11 }}
                            >
                              View File ↗
                            </a>
                          ) : (
                            DASH
                          )}
                        </td>
                        <td className="ax-table__td" style={{ maxWidth: 220, whiteSpace: 'normal', fontSize: 12 }}>
                          {a.remarks || DASH}
                        </td>
                        <td className="ax-table__td">
                          {isAccepted ? (
                            <span className="ax-badge ax-badge--soft ax-badge--success" style={{ fontWeight: 600 }}>
                              Accepted
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="ax-badge ax-badge--soft ax-badge--warning"
                              style={{ fontWeight: 600, cursor: 'pointer', border: 'none' }}
                              onClick={() => handleAcceptAssignment(a.id)}
                              disabled={actionLoadingId !== null}
                              title="Click to accept assignment"
                            >
                              {actionLoadingId === a.id ? 'Accepting…' : 'Pending'}
                            </button>
                          )}
                        </td>
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

      {/* ── View Batch Sites Modal ── */}
      {viewBatch && (
        <Modal
          open={!!viewBatch}
          onClose={() => setViewBatch(null)}
          labelledBy="view-batch-modal-title"
          dialogStyle={{ maxWidth: 620 }}
        >
          <div className="ax-modal__header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--ax-border)' }}>
            <div>
              <h3 id="view-batch-modal-title" style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                Batch #{viewBatch.assign_srt.id} Sites List
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: 12, color: 'var(--ax-text-muted)' }}>
                District: <b>{viewBatch.assign_srt.district || 'Kashmir'}</b> · Total: <b>{getSiteCount(viewBatch)} sites</b>
              </p>
            </div>
            <button
              type="button"
              className="ax-modal__close"
              onClick={() => setViewBatch(null)}
              aria-label="Close modal"
            >
              {X_ICON}
            </button>
          </div>
          <div className="ax-modal__body" style={{ padding: '16px 20px', maxHeight: '60vh', overflowY: 'auto' }}>
            {viewBatch.jammu_srt70mws && viewBatch.jammu_srt70mws.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {viewBatch.jammu_srt70mws.map((s, i) => (
                  <li
                    key={i}
                    style={{
                      padding: '10px 14px',
                      background: 'var(--ax-surface-subtle)',
                      border: '1px solid var(--ax-border-subtle, var(--ax-border))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>{s.site_name}</span>
                    {s.inst_deadline && (
                      <span className="ax-badge ax-badge--soft ax-badge--warning" style={{ fontSize: 11 }}>
                        Due: {s.inst_deadline}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ margin: 0 }}>{String(viewBatch.assign_srt.site_name || 'No individual site names provided in batch.')}</p>
            )}
          </div>
          <div className="ax-modal__footer" style={{ padding: '12px 20px', borderTop: '1px solid var(--ax-border)', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="ax-btn ax-btn--primary"
              onClick={() => setViewBatch(null)}
            >
              Close
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default Kashmir_Installation_AssignSite;