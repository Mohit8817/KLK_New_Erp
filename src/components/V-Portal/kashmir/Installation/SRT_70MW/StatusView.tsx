import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { kashmirSrtService } from '../../kashmir-services';
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

export function Kashmir_Installation_StatusView() {
  const params = useParams();
  const [searchParams] = useSearchParams();

  const status = params.status || searchParams.get('status') || 'total';
  const district = params.district || searchParams.get('district') || '';

  const [loading, setLoading] = useState(true);
  const [sites, setSites] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadSites = async () => {
    setLoading(true);
    try {
      if (district) {
        const list = await kashmirSrtService.getDashboardDistrictwise(status, district);
        setSites(list);
      } else {
        const list = await kashmirSrtService.getDashboardByStatus(status);
        setSites(list);
      }
    } catch (err) {
      console.error('Failed to load status sites:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSites();
  }, [status, district]);

  const filtered = useMemo(() => {
    if (!search.trim()) return sites;
    const q = search.toLowerCase();
    return sites.filter((s) => {
      return (
        String(s.id).includes(q) ||
        (s.site_name && s.site_name.toLowerCase().includes(q)) ||
        (s.district && s.district.toLowerCase().includes(q)) ||
        (s.uid && s.uid.toLowerCase().includes(q))
      );
    });
  }, [sites, search]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const exportCols: ExportColumn<any>[] = [
    { header: 'ID', accessor: (r) => r.id },
    { header: 'Site Name', accessor: (r) => r.site_name },
    { header: 'District', accessor: (r) => r.district || '' },
    { header: 'Install Status', accessor: (r) => (Number(r.site_inst_status) === 1 ? 'Installed' : 'Pending') },
    { header: 'Verify Status', accessor: (r) => (Number(r.inst_verify_status) === 1 ? 'Approved' : Number(r.inst_verify_status) === 2 ? 'Rejected' : 'Pending') },
    { header: 'Claim Status', accessor: (r) => (Number(r.inst_claim_status) === 2 ? 'Approved' : Number(r.inst_claim_status) === 1 ? 'Raised' : 'Not Raised') },
  ];

  return (
    <div className="solar-erp-page">
      <PageHead
        title={`Kashmir SRT 70MW: ${status.replace(/-/g, ' ').toUpperCase()}${district ? ` · ${district}` : ''}`}
        subtitle="Drilldown list of sites based on installation & verification filter"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Kashmir' },
          { label: 'Installation' },
          { label: 'Dashboard', href: '/v/kashmir/srt/70mw/installation/dashboard' },
          { label: 'Status Sites' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)' }}>
            <Link to="/v/kashmir/srt/70mw/installation/dashboard" className="ax-btn ax-btn--secondary ax-btn--sm">
              Back to Dashboard
            </Link>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={loadSites} disabled={loading}>
              Refresh
            </button>
          </div>
        }
      />

      <section className="ax-card ax-col--12">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">Site Details ({filtered.length} sites)</h2>
            <p className="ax-card__subtitle">Filter: <b>{status}</b>{district ? ` in district: ${district}` : ''}</p>
          </div>
          <div className="ax-card__actions">
            <div className="ax-cluster">
              <SearchInput value={search} onChange={setSearch} placeholder="Search site..." />
              <TableExportToolbar
                onCopy={() => { void copyTableDataToClipboard(filtered, exportCols); }}
                onExportCSV={() => exportDataToCSV(`Kashmir_${status}_sites`, filtered, exportCols)}
                onExportExcel={() => exportDataToExcel(`Kashmir_${status}_sites`, filtered, exportCols)}
                onExportPDF={() => printTableData(`Kashmir ${status} sites`, filtered, exportCols)}
              />
            </div>
          </div>
        </div>

        <div className="ax-table-wrap">
          <table className="ax-table">
            <thead>
              <tr>
                <th style={{ width: 50 }}>Sr. No.</th>
                <th>Site ID</th>
                <th>Site Name</th>
                <th>District</th>
                <th>Install Status</th>
                <th>Verify Status</th>
                <th>Claim Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: 32 }}>
                    <span className="ax-spinner" /> Loading sites…
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <TableEmptyState message="No sites found matching criteria." />
                  </td>
                </tr>
              ) : (
                paginated.map((r, idx) => {
                  const srNo = (page - 1) * pageSize + idx + 1;
                  return (
                    <tr key={r.id || idx}>
                      <td>{srNo}</td>
                      <td><b>{r.uid || `#${r.id}`}</b></td>
                      <td><b>{r.site_name}</b></td>
                      <td>{r.district || '—'}</td>
                      <td>
                        {Number(r.site_inst_status) === 1 ? (
                          <span className="ax-badge ax-badge--soft ax-badge--success">Installed</span>
                        ) : (
                          <span className="ax-badge ax-badge--soft ax-badge--warning">Pending</span>
                        )}
                      </td>
                      <td>
                        {Number(r.inst_verify_status) === 1 ? (
                          <span className="ax-badge ax-badge--soft ax-badge--success">Approved</span>
                        ) : Number(r.inst_verify_status) === 2 ? (
                          <span className="ax-badge ax-badge--soft ax-badge--danger">Rejected</span>
                        ) : (
                          <span className="ax-badge ax-badge--soft ax-badge--warning">Pending</span>
                        )}
                      </td>
                      <td>
                        {Number(r.inst_claim_status) === 2 ? (
                          <span className="ax-badge ax-badge--soft ax-badge--success">Approved</span>
                        ) : Number(r.inst_claim_status) === 1 ? (
                          <span className="ax-badge ax-badge--soft ax-badge--info">Raised</span>
                        ) : (
                          <span className="ax-badge ax-badge--soft ax-badge--neutral">Not Raised</span>
                        )}
                      </td>
                      <td>
                        <Link
                          to={`/v/kashmir/srt/70mw/view-install-sites`}
                          className="ax-btn ax-btn--secondary ax-btn--sm"
                          style={{ padding: '2px 8px', fontSize: 11 }}
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="ax-card__footer">
          <div className="ula-pagination-left">
            <Pagination
              currentPage={page}
              totalItems={filtered.length}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(sz) => {
                setPageSize(sz);
                setPage(1);
              }}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
export default Kashmir_Installation_StatusView;
