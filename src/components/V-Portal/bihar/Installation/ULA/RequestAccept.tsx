import { useState, useMemo, useEffect, useCallback } from 'react';
import { PageHead } from '../../../../shell/PageHead';
import {
  biharUlaInstallationService,
  type AssignSiteItem,
  type AssignedBeneficiarySite,
} from '../../../../../services/biharUlaInstallationService';
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

const ICON_REFRESH = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
    <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
  </svg>
);

const ICON_CHECK = (
  <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const ICON_EYE = (
  <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="2" />
    <path d="M22 12c-2.667 4.667 -6 7 -10 7s-7.333 -2.333 -10 -7c2.667 -4.667 6 -7 10 -7s7.333 2.333 10 7" />
  </svg>
);

export function Bihar_Installation_ULA_RequestAccept() {
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<AssignSiteItem[]>([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  // Detail Modal State
  const [selectedAssign, setSelectedAssign] = useState<AssignSiteItem | null>(null);
  const [modalSites, setModalSites] = useState<AssignedBeneficiarySite[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

  // Load assignments
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await biharUlaInstallationService.getViewAssignSites();
      setAssignments(data || []);
    } catch (err: any) {
      console.error('[ULA Installation] Error loading assigned sites:', err);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Accept
  const handleAccept = async (id: number) => {
    if (!window.confirm(`Are you sure you want to accept assignment #${id}?`)) return;
    setActionLoadingId(id);
    setFeedbackMsg(null);
    try {
      const res = await biharUlaInstallationService.acceptAssignSite(id);
      setFeedbackMsg({
        type: 'success',
        text: res.message || 'Installation Assignment Accepted Successfully!',
      });
      // Refresh list
      await loadData();
      if (selectedAssign?.id === id) {
        setSelectedAssign((prev) => (prev ? { ...prev, status: 2 } : null));
      }
    } catch (err: any) {
      setFeedbackMsg({
        type: 'danger',
        text: err?.message || 'Failed to accept installation assignment.',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Open Details Modal
  const handleViewDetail = async (item: AssignSiteItem) => {
    setSelectedAssign(item);
    setModalSites(item.sites || []);
    setModalLoading(true);
    try {
      const detail = await biharUlaInstallationService.getAssignSiteDetail(item.id);
      if (detail && detail.sites) {
        setModalSites(detail.sites);
      }
    } catch (err) {
      console.warn('Could not load detailed assignment data, fallback to inline sites', err);
    } finally {
      setModalLoading(false);
    }
  };

  // KPI calculations
  const totalAssignments = assignments.length;
  const pendingCount = assignments.filter((a) => Number(a.status) === 1).length;
  const acceptedCount = assignments.filter((a) => Number(a.status) === 2).length;

  // Filtered
  const filteredAssignments = useMemo(() => {
    if (!search.trim()) return assignments;
    const q = search.toLowerCase();
    return assignments.filter((a) => {
      const idMatch = String(a.id).includes(q);
      const vendorMatch = a.vendors?.name?.toLowerCase().includes(q);
      const remarkMatch = a.remarks?.toLowerCase().includes(q);
      const deadlineMatch = a.deadline_date?.toLowerCase().includes(q);
      const sitesMatch = a.sites?.some((s) =>
        s.beneficiary_name?.toLowerCase().includes(q) ||
        s.district?.toLowerCase().includes(q) ||
        s.ca_no?.toLowerCase().includes(q)
      );
      return idMatch || vendorMatch || remarkMatch || deadlineMatch || sitesMatch;
    });
  }, [assignments, search]);

  // Paginated
  const paginatedAssignments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAssignments.slice(start, start + pageSize);
  }, [filteredAssignments, currentPage, pageSize]);

  // Helper count of sites
  const getSiteCount = (item: AssignSiteItem) => {
    if (Array.isArray(item.sites) && item.sites.length > 0) return item.sites.length;
    if (typeof item.site_id === 'string') {
      try {
        const parsed = JSON.parse(item.site_id);
        if (Array.isArray(parsed)) return parsed.length;
      } catch {
        // ignore
      }
    }
    return 1;
  };

  // Export Columns
  const exportCols: ExportColumn<AssignSiteItem>[] = useMemo(
    () => [
      { header: 'Assign ID', accessor: (r) => `#${r.id}` },
      { header: 'Vendor Name', accessor: (r) => r.vendors?.name || '—' },
      { header: 'Total Sites', accessor: (r) => getSiteCount(r) },
      { header: 'Deadline Date', accessor: (r) => r.deadline_date || '—' },
      { header: 'Status', accessor: (r) => (Number(r.status) === 2 ? 'Accepted' : 'Pending Acceptance') },
      { header: 'Remarks', accessor: (r) => r.remarks || '—' },
    ],
    []
  );

  return (
    <div className="ax-page">
      <PageHead
        title="Bihar - Installation > ULA > Request Accept"
        subtitle="Manage assigned installation batches and accept assignments for site execution"
        breadcrumbs={[
          { label: 'Bihar' },
          { label: 'Installation' },
          { label: 'ULA' },
          { label: 'Request Accept' },
        ]}
        actions={
          <button
            type="button"
            className="ax-btn ax-btn--secondary ax-btn--sm"
            onClick={loadData}
            disabled={loading}
          >
            <span className={loading ? 'ax-spinner' : ''}>{ICON_REFRESH}</span>
            <span className="ax-btn__label">Refresh</span>
          </button>
        }
      />

      {feedbackMsg && (
        <div className={`ax-alert ax-alert--${feedbackMsg.type}`} style={{ marginBottom: 'var(--ax-space-4)' }}>
          <div className="ax-alert__title">{feedbackMsg.type === 'success' ? 'Success' : 'Error'}</div>
          <div className="ax-alert__text">{feedbackMsg.text}</div>
        </div>
      )}

      <div className="ax-dash-grid">
        {/* KPI Cards */}
        <div className="ax-card ax-kpi ax-col--4">
          <div className="ax-card__body">
            <div className="ax-kpi__top">
              <span className="ax-badge ax-badge--soft ax-badge--info">All Batches</span>
            </div>
            <div className="ax-kpi__label">Total Assignments</div>
            <div className="ax-kpi__value ax-num">{totalAssignments}</div>
            <div className="ax-kpi__caption">Batches allocated by state admin</div>
          </div>
        </div>

        <div className="ax-card ax-kpi ax-col--4">
          <div className="ax-card__body">
            <div className="ax-kpi__top">
              <span className="ax-badge ax-badge--soft ax-badge--warning">Pending</span>
            </div>
            <div className="ax-kpi__label">Pending Acceptance</div>
            <div className="ax-kpi__value ax-num">{pendingCount}</div>
            <div className="ax-kpi__caption">Action required to begin installation</div>
          </div>
        </div>

        <div className="ax-card ax-kpi ax-col--4">
          <div className="ax-card__body">
            <div className="ax-kpi__top">
              <span className="ax-badge ax-badge--soft ax-badge--success">Accepted</span>
            </div>
            <div className="ax-kpi__label">Accepted Assignments</div>
            <div className="ax-kpi__value ax-num">{acceptedCount}</div>
            <div className="ax-kpi__caption">Ready for structure erection</div>
          </div>
        </div>

        {/* Main Assignments Table */}
        <section className="ax-card ax-col--12" aria-labelledby="assign-table-title">
          <div className="ax-card__header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: 'var(--ax-space-2)' }}>
              <div>
                <h3 id="assign-table-title" className="ax-card__title">Assigned Installation Batches</h3>
                <p className="ax-card__subtitle">Review assigned beneficiary locations and accept requests</p>
              </div>
              <TableExportToolbar
                onExportCSV={() => exportDataToCSV(filteredAssignments, exportCols, 'ula_assigned_installations.csv')}
                onExportExcel={() => exportDataToExcel(filteredAssignments, exportCols, 'ula_assigned_installations.xlsx')}
                onPrint={() => printTableData(filteredAssignments, exportCols, 'Bihar ULA Installation Assignments')}
                onCopy={() => copyTableDataToClipboard(filteredAssignments, exportCols)}
              />
            </div>
          </div>

          <div className="ax-card__body">
            <div style={{ marginBottom: 'var(--ax-space-3)', maxWidth: 300 }}>
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search vendor, ID, district..."
              />
            </div>

            <div className="ax-table-wrap">
              <table className="ax-table ax-table--hover">
                <thead>
                  <tr>
                    <th>Sr.</th>
                    <th>Assign ID</th>
                    <th>Vendor Name</th>
                    <th>Sites Count</th>
                    <th>Deadline Date</th>
                    <th>Remarks</th>
                    <th>Attachment</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: 'var(--ax-space-6)' }}>
                        <span className="ax-spinner" /> Loading assigned installation batches...
                      </td>
                    </tr>
                  ) : paginatedAssignments.length === 0 ? (
                    <tr>
                      <td colSpan={9}>
                        <TableEmptyState title="No installation assignments found" message="Assigned installation requests will appear here once allocated." />
                      </td>
                    </tr>
                  ) : (
                    paginatedAssignments.map((a, index) => {
                      const isAccepted = Number(a.status) === 2;
                      const isActioning = actionLoadingId === a.id;
                      return (
                        <tr key={a.id}>
                          <td>{(currentPage - 1) * pageSize + index + 1}</td>
                          <td style={{ fontWeight: 600 }}>#{a.id}</td>
                          <td>{a.vendors?.name || 'Assigned Vendor'}</td>
                          <td>
                            <span className="ax-badge ax-badge--soft ax-badge--neutral">
                              {getSiteCount(a)} Sites
                            </span>
                          </td>
                          <td>{a.deadline_date || '—'}</td>
                          <td style={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {a.remarks || '—'}
                          </td>
                          <td>
                            {a.file ? (
                              <a
                                href={a.file}
                                target="_blank"
                                rel="noreferrer"
                                className="ax-btn ax-btn--ghost ax-btn--sm"
                                style={{ height: 26, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }}
                              >
                                View Doc
                              </a>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td>
                            {isAccepted ? (
                              <span className="ax-badge ax-badge--soft ax-badge--success">
                                Accepted
                              </span>
                            ) : (
                              <span className="ax-badge ax-badge--soft ax-badge--warning">
                                Pending Accept
                              </span>
                            )}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div className="ax-cluster" style={{ justifyContent: 'center', gap: 'var(--ax-space-1)' }}>
                              <button
                                type="button"
                                className="ax-btn ax-btn--secondary ax-btn--sm"
                                style={{ height: 28, padding: '0 10px', fontSize: 'var(--ax-text-xs)' }}
                                onClick={() => handleViewDetail(a)}
                              >
                                {ICON_EYE}
                                <span className="ax-btn__label">View Sites</span>
                              </button>
                              {!isAccepted && (
                                <button
                                  type="button"
                                  className="ax-btn ax-btn--primary ax-btn--sm"
                                  style={{ height: 28, padding: '0 10px', fontSize: 'var(--ax-text-xs)' }}
                                  disabled={isActioning}
                                  onClick={() => handleAccept(a.id)}
                                >
                                  {isActioning ? (
                                    <span className="ax-spinner" />
                                  ) : (
                                    ICON_CHECK
                                  )}
                                  <span className="ax-btn__label">Accept</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 'var(--ax-space-3)' }}>
              <Pagination
                currentPage={currentPage}
                totalCount={filteredAssignments.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
              />
            </div>
          </div>
        </section>
      </div>

      {/* View Assignment Sites Modal */}
      {selectedAssign && (
        <div className="ax-modal-backdrop" onClick={() => setSelectedAssign(null)}>
          <div className="ax-modal" style={{ maxWidth: 900 }} onClick={(e) => e.stopPropagation()}>
            <div className="ax-modal__header">
              <div>
                <h4 className="ax-modal__title">Assignment Details — Batch #{selectedAssign.id}</h4>
                <p style={{ margin: 0, fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
                  Vendor: {selectedAssign.vendors?.name || '—'} · Deadline: {selectedAssign.deadline_date || '—'}
                </p>
              </div>
              <button
                type="button"
                className="ax-btn ax-btn--ghost ax-btn--icon"
                onClick={() => setSelectedAssign(null)}
              >
                ✕
              </button>
            </div>
            <div className="ax-modal__body" style={{ maxHeight: 460, overflowY: 'auto' }}>
              {modalLoading ? (
                <div style={{ textAlign: 'center', padding: 'var(--ax-space-6)' }}>
                  <span className="ax-spinner" /> Loading site list...
                </div>
              ) : modalSites.length === 0 ? (
                <TableEmptyState title="No sites listed" message="No beneficiary sites attached to this assignment batch." />
              ) : (
                <div className="ax-table-wrap">
                  <table className="ax-table ax-table--hover">
                    <thead>
                      <tr>
                        <th>Sr.</th>
                        <th>Beneficiary Name</th>
                        <th>District</th>
                        <th>Block</th>
                        <th>Village</th>
                        <th>CA No.</th>
                        <th>Contact No.</th>
                        <th>Structure Status</th>
                        <th>Installation Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modalSites.map((s, idx) => (
                        <tr key={s.id || idx}>
                          <td>{idx + 1}</td>
                          <td style={{ fontWeight: 600 }}>{s.beneficiary_name || '—'}</td>
                          <td>{s.district || '—'}</td>
                          <td>{s.block || '—'}</td>
                          <td>{s.village || '—'}</td>
                          <td>{s.ca_no || '—'}</td>
                          <td>{s.contact_no || '—'}</td>
                          <td>
                            {Number(s.structure_status) === 1 ? (
                              <span className="ax-badge ax-badge--soft ax-badge--success">Complete</span>
                            ) : (
                              <span className="ax-badge ax-badge--soft ax-badge--warning">Pending</span>
                            )}
                          </td>
                          <td>
                            {Number(s.inst_status) === 1 ? (
                              <span className="ax-badge ax-badge--soft ax-badge--success">Complete</span>
                            ) : (
                              <span className="ax-badge ax-badge--soft ax-badge--neutral">Pending</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="ax-modal__footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                {Number(selectedAssign.status) !== 2 && (
                  <button
                    type="button"
                    className="ax-btn ax-btn--primary ax-btn--sm"
                    disabled={actionLoadingId === selectedAssign.id}
                    onClick={() => handleAccept(selectedAssign.id)}
                  >
                    {actionLoadingId === selectedAssign.id ? <span className="ax-spinner" /> : ICON_CHECK}
                    <span className="ax-btn__label">Accept Installation</span>
                  </button>
                )}
              </div>
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--sm"
                onClick={() => setSelectedAssign(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Bihar_Installation_ULA_RequestAccept;
