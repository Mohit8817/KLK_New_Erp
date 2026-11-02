import { useState, useMemo, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  upInstallationService,
  resolveUpMediaUrl,
  type UpRescoAssignSiteItem,
} from '../../up-services';
import {
  Pagination,
  usePagination,
  SearchInput,
  TableExportToolbar,
  TableEmptyState,
  type ExportColumn,
} from '../../../../../common';

const DASH = '—';

export function UP_Installation_Resco_AssignedSites() {
  const [loading, setLoading] = useState(false);
  const [sites, setSites] = useState<UpRescoAssignSiteItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await upInstallationService.getRescoAssignSites();
      setSites(res.data || []);
    } catch (err: any) {
      console.error(err);
      setToast({ type: 'error', message: err?.message || 'Failed to load assigned Resco sites.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return sites;
    const q = searchQuery.toLowerCase();
    return sites.filter((s) =>
      Object.values(s).some((v) => v !== null && v !== undefined && String(v).toLowerCase().includes(q))
    );
  }, [sites, searchQuery]);

  const pagination = usePagination(filtered, { initialPageSize: 10 });
  const pageItems = pagination.pageItems || pagination.paged || [];
  const startIndex = pagination.startIndex ?? pagination.from ?? 0;

  const exportCols: ExportColumn<UpRescoAssignSiteItem>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_, idx) => idx + 1 },
      { header: 'Vendor', accessor: (r) => r.vendor || DASH },
      { header: 'Assign Date', accessor: (r) => r.assign_date || DASH },
      { header: 'State', accessor: (r) => r.state || 'UP' },
      { header: 'District', accessor: (r) => r.district || DASH },
      { header: 'Site Name - Deadline', accessor: (r) => `${r.site_name || DASH} ${r.deadline ? `(${r.deadline})` : ''}` },
      { header: 'Count', accessor: (r) => r.count ?? DASH },
      { header: 'Remarks', accessor: (r) => r.remarks || DASH },
      { header: 'Status', accessor: (r) => (r.status === 2 ? 'Accepted' : 'Pending') },
    ],
    []
  );

  return (
    <div className="solar-erp-page ax-page">
      <PageHead
        title="Welcome to, View Assigned Resco Installation"
        subtitle="Manage assigned RESCO solar rooftop installation projects across Uttar Pradesh"
        breadcrumbs={[
          { label: 'Home', href: '/v' },
          { label: 'View Assigned Resco Installation' },
        ]}
        actions={
          <div className="ax-cluster" style={{ gap: 8 }}>
            <button
              type="button"
              className="ax-btn ax-btn--ghost ax-btn--sm"
              onClick={loadData}
              disabled={loading}
              title="Refresh"
            >
              <svg className={`ax-btn__icon ${loading ? 'ax-spinner' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
                <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
              </svg>
              <span>Refresh</span>
            </button>
            <Link to="/v/up/resco-install-site" className="ax-btn ax-btn--primary ax-btn--sm">
              + Install Site
            </Link>
          </div>
        }
      />

      {toast && (
        <div className={`ax-alert ${toast.type === 'success' ? 'ax-alert--success' : 'ax-alert--danger'}`} style={{ marginBottom: 16 }}>
          <span>{toast.message}</span>
          <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" onClick={() => setToast(null)} style={{ marginLeft: 'auto' }}>
            ✕
          </button>
        </div>
      )}

      <div className="ax-card">
        <div className="ax-card__header" style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 className="ax-card__title" style={{ margin: 0, fontSize: 16 }}>
              Assigned Resco Site
            </h3>
            <p className="ax-card__subtitle" style={{ margin: '2px 0 0', fontSize: 12 }}>
              List of RESCO rooftop installation work orders
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search assigned sites..."
              size="sm"
            />
            <TableExportToolbar
              data={filtered}
              columns={exportCols}
              filename="up_resco_assigned_sites"
              title="Assigned Resco Site"
            />
          </div>
        </div>

        <div className="ax-card__body" style={{ padding: 0 }}>
          <div className="ax-table-wrap">
            <table className="ax-table ax-table--striped">
              <thead>
                <tr>
                  <th style={{ width: 50, textAlign: 'center' }}>Sr. No.</th>
                  <th>Vendor</th>
                  <th>Assign Date</th>
                  <th>State</th>
                  <th>District</th>
                  <th>Site Name - Deadline</th>
                  <th style={{ textAlign: 'center' }}>Count</th>
                  <th>File</th>
                  <th style={{ textAlign: 'center' }}>View</th>
                  <th>Remarks</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ width: 100, textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={12} style={{ textAlign: 'center', padding: 36 }}>
                      <span className="ax-spinner" /> Loading assigned sites...
                    </td>
                  </tr>
                ) : pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={12} style={{ padding: 0 }}>
                      <TableEmptyState
                        title="No data available in table"
                        subtitle={searchQuery ? 'Try adjusting your search query' : 'No RESCO installation sites assigned'}
                      />
                    </td>
                  </tr>
                ) : (
                  pageItems.map((item, idx) => {
                    const sr = startIndex + idx + 1;
                    const isAccepted = item.status === 2;
                    const fileUrl = item.file ? resolveUpMediaUrl(item.file) : '';
                    return (
                      <tr key={item.id || idx}>
                        <td style={{ textAlign: 'center', fontWeight: 600 }}>{sr}</td>
                        <td style={{ fontWeight: 600 }}>{item.vendor || DASH}</td>
                        <td>{item.assign_date || DASH}</td>
                        <td>{item.state ? item.state.toUpperCase() : 'UP'}</td>
                        <td>{item.district || DASH}</td>
                        <td style={{ fontWeight: 600 }}>
                          {item.site_name || DASH}{' '}
                          {item.deadline && <span style={{ color: 'var(--ax-text-muted)', fontSize: 11 }}>({item.deadline})</span>}
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 600 }}>{item.count ?? 1}</td>
                        <td>
                          {fileUrl ? (
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ax-btn ax-btn--ghost ax-btn--sm"
                              style={{ padding: '2px 8px', fontSize: 11 }}
                            >
                              Download
                            </a>
                          ) : (
                            <span style={{ color: 'var(--ax-text-muted)' }}>{DASH}</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <Link
                            to={`/v/up/resco-install-site?site_id=${item.id}`}
                            className="ax-btn ax-btn--ghost ax-btn--sm"
                            style={{ padding: '2px 8px', fontSize: 11 }}
                          >
                            Details
                          </Link>
                        </td>
                        <td>{item.remarks || DASH}</td>
                        <td style={{ textAlign: 'center' }}>
                          {isAccepted ? (
                            <span className="ax-badge ax-badge--soft ax-badge--success">Accepted</span>
                          ) : (
                            <span className="ax-badge ax-badge--soft ax-badge--warning">Pending</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <Link
                            to={`/v/up/resco-install-site?site_id=${item.id}`}
                            className="ax-btn ax-btn--primary ax-btn--sm"
                            style={{ padding: '4px 10px', fontSize: 11 }}
                          >
                            Install
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="ax-card__footer" style={{ padding: '10px 18px' }}>
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={pagination.setPage}
            totalItems={pagination.totalItems}
            pageSize={pagination.pageSize}
            onPageSizeChange={pagination.setPageSize}
          />
        </div>
      </div>
    </div>
  );
}

export default UP_Installation_Resco_AssignedSites;
