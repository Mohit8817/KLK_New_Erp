import { useCallback, useEffect, useMemo, useState, useDeferredValue } from 'react';
import { PageHead } from '../../../../shell/PageHead';
import {
  biharSslInstallationService,
  getMediaUrl,
  getCompanyId,
  type AssignedSslLightItem,
} from '../../bihar-services';
import {
  TableExportToolbar,
  SearchInput,
  Pagination,
  TableEmptyState,
  usePagination,
  TableSkeleton,
  KpiSkeleton,
  type ExportColumn,
  exportDataToCSV,
  exportDataToExcel,
} from '../../../../../common';

const BLUE_PRIMARY = '#2563eb';
const GREEN_EMERALD = '#10b981';
const AMBER_WARNING = '#f59e0b';

const num = (x: unknown) => (Number(x) || 0).toLocaleString('en-IN');

export function Bihar_Installation_SSL_AssignedLights() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<AssignedSslLightItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted'>('all');
  const [districtFilter, setDistrictFilter] = useState<string>('all');

  // Accept Confirmation Modal state
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<AssignedSslLightItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);

  const deferredQuery = useDeferredValue(searchQuery);

  const loadData = useCallback(async () => {
    setLoading(true);
    setActionErrorMsg(null);
    try {
      const data = await biharSslInstallationService.getAssignedLights();
      setRecords(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('[AssignedLights] load error:', err);
      setActionErrorMsg('Failed to load assigned lights.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Unique districts for filter
  const districts = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.district) set.add(r.district.trim());
    });
    return Array.from(set).sort();
  }, [records]);

  // Filtered list
  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return records.filter((r) => {
      // Search
      if (q) {
        const matches =
          (r.vendor && r.vendor.toLowerCase().includes(q)) ||
          (r.district && r.district.toLowerCase().includes(q)) ||
          (r.block && r.block.toLowerCase().includes(q)) ||
          (r.panchayat && r.panchayat.toLowerCase().includes(q)) ||
          (r.remarks && r.remarks.toLowerCase().includes(q));
        if (!matches) return false;
      }
      // Status filter: 1 = Pending, 2 = Accepted
      if (statusFilter === 'pending' && r.status !== 1) return false;
      if (statusFilter === 'accepted' && r.status !== 2) return false;

      // District filter
      if (districtFilter !== 'all' && r.district?.toLowerCase() !== districtFilter.toLowerCase()) {
        return false;
      }
      return true;
    });
  }, [records, deferredQuery, statusFilter, districtFilter]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalBatches = records.length;
    let totalSites = 0;
    let pendingCount = 0;
    let acceptedCount = 0;

    records.forEach((r) => {
      totalSites += Number(r.site_count) || 0;
      if (r.status === 2) acceptedCount++;
      else pendingCount++;
    });

    return { totalBatches, totalSites, pendingCount, acceptedCount };
  }, [records]);

  // Pagination
  const pagination = usePagination({ data: filtered, initialPageSize: 15 });

  // Export Columns
  const exportCols: ExportColumn<AssignedSslLightItem>[] = [
    { header: 'Vendor', accessor: 'vendor' },
    { header: 'State', accessor: 'state' },
    { header: 'District', accessor: 'district' },
    { header: 'Block', accessor: 'block' },
    { header: 'Panchayat', accessor: 'panchayat' },
    { header: 'Start Date', accessor: 'start_date' },
    { header: 'End Date', accessor: 'end_date' },
    { header: 'Site Count', accessor: 'site_count' },
    { header: 'Remarks', accessor: 'remarks' },
    {
      header: 'Status',
      accessor: (r) => (r.status === 2 ? 'Accepted' : 'Pending Acceptance'),
    },
  ];

  const handleExportCSV = () => {
    exportDataToCSV('Bihar_SSL_Assigned_Lights', filtered, exportCols);
  };

  const handleExportExcel = () => {
    exportDataToExcel('Bihar_SSL_Assigned_Lights', filtered, exportCols);
  };

  // Trigger Accept
  const handleConfirmAccept = async () => {
    if (!selectedItem) return;
    setSubmitting(true);
    setActionErrorMsg(null);
    setActionSuccessMsg(null);
    try {
      const res = await biharSslInstallationService.acceptAssignedLight(selectedItem.id);
      setActionSuccessMsg(res.message || 'Light assignment accepted successfully!');
      setAcceptModalOpen(false);
      setSelectedItem(null);
      await loadData();
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Failed to accept light assignment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ax-page solar-erp-page">
      <PageHead
        title="Assigned Lights"
        subtitle="Manage and accept Solar Street Light installation site allocations in Bihar"
        breadcrumbs={[
          { label: 'Bihar' },
          { label: 'Installation' },
          { label: 'SSL', href: '/v/ssl/installation-dashboard' },
          { label: 'Assigned Lights' },
        ]}
        actions={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="ax-badge ax-badge--soft ax-badge--accent ax-badge--pill" style={{ fontWeight: 600 }}>
              Company ID: {getCompanyId()}
            </span>
            <button
              type="button"
              className="ax-btn ax-btn--ghost ax-btn--sm"
              onClick={loadData}
              title="Refresh list"
            >
              <svg
                width={14}
                height={14}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}
              >
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
              <span>Refresh</span>
            </button>
          </div>
        }
      />

      {/* Notifications */}
      {actionSuccessMsg && (
        <div
          style={{
            padding: '12px 16px',
            marginBottom: 16,
            borderRadius: 8,
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#065f46',
            fontSize: 13.5,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>✓ {actionSuccessMsg}</span>
          <button
            type="button"
            onClick={() => setActionSuccessMsg(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#065f46', fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      {actionErrorMsg && (
        <div
          style={{
            padding: '12px 16px',
            marginBottom: 16,
            borderRadius: 8,
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            fontSize: 13.5,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>⚠ {actionErrorMsg}</span>
          <button
            type="button"
            onClick={() => setActionErrorMsg(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b', fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ── KPI Row ── */}
      {loading ? (
        <KpiSkeleton count={4} />
      ) : (
        <div className="ax-dash-grid" style={{ marginBottom: 18 }}>
          <div
            className="ax-card ax-col--3"
            style={{ padding: '14px 18px', border: '1px solid var(--ax-border, #e2e8f0)', borderRadius: 12 }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)' }}>
              Total Batches
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: BLUE_PRIMARY, marginTop: 4 }}>
              {num(metrics.totalBatches)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>
              Assigned work orders
            </div>
          </div>

          <div
            className="ax-card ax-col--3"
            style={{ padding: '14px 18px', border: '1px solid var(--ax-border, #e2e8f0)', borderRadius: 12 }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)' }}>
              Total Allocated Sites
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--ax-text-strong)', marginTop: 4 }}>
              {num(metrics.totalSites)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>
              Cumulative light points
            </div>
          </div>

          <div
            className="ax-card ax-col--3"
            style={{ padding: '14px 18px', border: '1px solid var(--ax-border, #e2e8f0)', borderRadius: 12 }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)' }}>
              Pending Acceptance
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: AMBER_WARNING, marginTop: 4 }}>
              {num(metrics.pendingCount)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>
              Requires vendor action
            </div>
          </div>

          <div
            className="ax-card ax-col--3"
            style={{ padding: '14px 18px', border: '1px solid var(--ax-border, #e2e8f0)', borderRadius: 12 }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)' }}>
              Accepted Batches
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: GREEN_EMERALD, marginTop: 4 }}>
              {num(metrics.acceptedCount)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>
              Ready for installation
            </div>
          </div>
        </div>
      )}

      {/* ── Table Container ── */}
      <section className="ax-card" style={{ borderRadius: 12, overflow: 'hidden' }}>
        {/* Filters and Search Toolbar */}
        <div
          className="ax-card__header"
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--ax-border, #e2e8f0)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          {/* Status Tabs */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`ax-btn ax-btn--sm ${statusFilter === 'all' ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
              onClick={() => { setStatusFilter('all'); pagination.setPage(1); }}
            >
              All ({metrics.totalBatches})
            </button>
            <button
              type="button"
              className={`ax-btn ax-btn--sm ${statusFilter === 'pending' ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
              onClick={() => { setStatusFilter('pending'); pagination.setPage(1); }}
            >
              Pending ({metrics.pendingCount})
            </button>
            <button
              type="button"
              className={`ax-btn ax-btn--sm ${statusFilter === 'accepted' ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
              onClick={() => { setStatusFilter('accepted'); pagination.setPage(1); }}
            >
              Accepted ({metrics.acceptedCount})
            </button>
          </div>

          {/* Right Toolbar: District Filter + Search + Export */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              className="ax-input ax-input--sm"
              value={districtFilter}
              onChange={(e) => {
                setDistrictFilter(e.target.value);
                pagination.setPage(1);
              }}
              style={{ minWidth: 140, height: 36, borderRadius: 8 }}
            >
              <option value="all">All Districts</option>
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <SearchInput
              value={searchQuery}
              onChange={(val) => {
                setSearchQuery(val);
                pagination.setPage(1);
              }}
              placeholder="Search vendor, district, block…"
            />

            <TableExportToolbar onExportCSV={handleExportCSV} onExportExcel={handleExportExcel} />
          </div>
        </div>

        {/* Data Table */}
        {loading ? (
          <TableSkeleton columns={12} rows={8} showCard={false} />
        ) : (
          <div className="ax-table-wrap" style={{ margin: 0, border: 'none' }}>
            <table className="ax-table ax-table--hover" style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1100 }}>
              <thead>
                <tr style={{ background: 'var(--ax-surface-subtle, #f8fafc)', borderBottom: '1px solid var(--ax-border, #e2e8f0)' }}>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', width: 50 }}>Sr. No.</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left' }}>Vendor</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left' }}>State</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left' }}>District</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left' }}>Block</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left' }}>Panchayat</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left' }}>Start Date</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left' }}>End Date</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'right' }}>Site Count</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'center' }}>Unique ID's File</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left' }}>Remarks</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'center', width: 100 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {pagination.paged.length === 0 ? (
                  <tr>
                    <td colSpan={13} style={{ padding: 40, textAlign: 'center' }}>
                      <TableEmptyState
                        title="No Assigned Lights Found"
                        message={searchQuery ? `No records match "${searchQuery}"` : 'No lights currently assigned.'}
                      />
                    </td>
                  </tr>
                ) : (
                  pagination.paged.map((r, idx) => {
                    const rowNum = (pagination.curPage - 1) * pagination.pageSize + idx + 1;
                    const isAccepted = r.status === 2;
                    const fileUrl = getMediaUrl(r.uid_file);

                    return (
                      <tr key={r.id || idx} style={{ borderBottom: '1px solid var(--ax-border, #f1f5f9)' }}>
                        <td style={{ padding: '12px 14px', fontSize: 12, color: 'var(--ax-text-subtle)' }}>
                          {rowNum}
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--ax-text-strong)' }}>
                          {r.vendor || '—'}
                        </td>
                        <td style={{ padding: '12px 14px', textTransform: 'capitalize' }}>
                          {r.state || 'Bihar'}
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 600 }}>{r.district || '—'}</td>
                        <td style={{ padding: '12px 14px' }}>{r.block || '—'}</td>
                        <td style={{ padding: '12px 14px' }}>{r.panchayat || '—'}</td>
                        <td style={{ padding: '12px 14px', fontSize: 12.5 }}>{r.start_date || '—'}</td>
                        <td style={{ padding: '12px 14px', fontSize: 12.5 }}>{r.end_date || '—'}</td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: BLUE_PRIMARY }}>
                          {num(r.site_count)}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          {fileUrl ? (
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="ax-btn ax-btn--ghost ax-btn--sm"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: BLUE_PRIMARY }}
                              title="View / Download UID File"
                            >
                              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1={12} y1={18} x2={12} y2={12} />
                                <line x1={9} y1={15} x2={12} y2={18} />
                                <line x1={15} y1={15} x2={12} y2={18} />
                              </svg>
                              <span>PDF</span>
                            </a>
                          ) : (
                            <span style={{ color: 'var(--ax-text-subtle)', fontSize: 12 }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: 12.5, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.remarks || ''}>
                          {r.remarks || '—'}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 700,
                              background: isAccepted ? '#ecfdf5' : '#fffbeb',
                              color: isAccepted ? GREEN_EMERALD : AMBER_WARNING,
                            }}
                          >
                            {isAccepted ? 'Accepted' : 'Pending'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          {isAccepted ? (
                            <span style={{ fontSize: 12, color: GREEN_EMERALD, fontWeight: 700 }}>
                              ✓ Done
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="ax-btn ax-btn--primary ax-btn--sm"
                              onClick={() => {
                                setSelectedItem(r);
                                setAcceptModalOpen(true);
                              }}
                            >
                              Accept
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="ax-card__footer" style={{ padding: '12px 20px', borderTop: '1px solid var(--ax-border, #e2e8f0)' }}>
          <Pagination {...pagination} />
        </div>
      </section>

      {/* ── Accept Confirmation Modal (DLE Style) ── */}
      {acceptModalOpen && selectedItem && (
        <div
          className="ax-modal"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 20,
          }}
          onClick={() => {
            if (!submitting) {
              setAcceptModalOpen(false);
              setSelectedItem(null);
            }
          }}
        >
          <div
            className="ax-modal__dialog"
            style={{
              background: 'var(--ax-surface-solid, #ffffff)',
              borderRadius: 14,
              width: '100%',
              maxWidth: 500,
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="ax-modal__header"
              style={{
                padding: '16px 22px',
                borderBottom: '1px solid var(--ax-border, #e2e8f0)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <h4 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--ax-text-strong)' }}>
                Accept Light Assignment
              </h4>
              <button
                type="button"
                className="ax-btn ax-btn--ghost ax-btn--sm"
                onClick={() => {
                  if (!submitting) {
                    setAcceptModalOpen(false);
                    setSelectedItem(null);
                  }
                }}
                disabled={submitting}
              >
                ✕
              </button>
            </div>

            <div className="ax-modal__body" style={{ padding: '20px 24px' }}>
              <p style={{ margin: '0 0 16px 0', fontSize: 14, color: 'var(--ax-text-muted)', lineHeight: 1.5 }}>
                Are you sure you want to accept this assigned solar street light batch for installation?
              </p>

              <div
                style={{
                  background: 'var(--ax-surface-subtle, #f8fafc)',
                  border: '1px solid var(--ax-border, #e2e8f0)',
                  borderRadius: 8,
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  fontSize: 13,
                }}
              >
                <div>
                  <strong style={{ color: 'var(--ax-text-strong)' }}>Vendor:</strong> {selectedItem.vendor || '—'}
                </div>
                <div>
                  <strong style={{ color: 'var(--ax-text-strong)' }}>District:</strong> {selectedItem.district || '—'}
                </div>
                <div>
                  <strong style={{ color: 'var(--ax-text-strong)' }}>Block:</strong> {selectedItem.block || '—'}
                </div>
                <div>
                  <strong style={{ color: 'var(--ax-text-strong)' }}>Site Count:</strong>{' '}
                  <span style={{ color: BLUE_PRIMARY, fontWeight: 700 }}>{num(selectedItem.site_count)}</span>
                </div>
              </div>
            </div>

            <div
              className="ax-modal__footer"
              style={{
                padding: '14px 22px',
                borderTop: '1px solid var(--ax-border, #e2e8f0)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 10,
              }}
            >
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--sm"
                onClick={() => {
                  setAcceptModalOpen(false);
                  setSelectedItem(null);
                }}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="ax-btn ax-btn--primary ax-btn--sm"
                onClick={handleConfirmAccept}
                disabled={submitting}
              >
                {submitting ? 'Accepting…' : 'Confirm Accept'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Bihar_Installation_SSL_AssignedLights;
