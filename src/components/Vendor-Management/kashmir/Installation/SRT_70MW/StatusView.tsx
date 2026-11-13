import { useState, useMemo, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  kashmirAdminService,
} from '../../kashmir-services';
import {
  TableExportToolbar,
  SearchInput,
  Pagination,
  TableEmptyState,
  KpiSkeleton,
  copyTableDataToClipboard,
  exportDataToCSV,
  exportDataToExcel,
  printTableData,
  type ExportColumn,
} from '../../../../../common';

type Row = any;

const DASH = '—';
const txt = (v: unknown) => (v === null || v === undefined || v === '' ? DASH : String(v));

const PAGE_CSS = `
  .solar-erp-page .ax-card { min-width: 0; }
  .solar-erp-page .ax-card__footer { width: 100%; box-sizing: border-box; }
  .solar-erp-page .ula-pagination-left {
    width: 100%; display: flex; justify-content: flex-start; align-items: center; margin: 0; overflow-x: auto;
  }
  .solar-erp-page .ula-pagination-left > * { margin-left: 0 !important; margin-right: 0 !important; }
  .solar-erp-page .ax-card__header {
    display: flex; flex-wrap: nowrap; align-items: flex-start; justify-content: space-between; gap: 12px;
  }
  .solar-erp-page .ax-card__titles { flex: 1 1 220px; min-width: 220px; max-width: 100%; }
  .solar-erp-page .ax-card__title,
  .solar-erp-page .ax-card__eyebrow,
  .solar-erp-page .ax-card__subtitle { max-width: none; word-break: normal; overflow-wrap: normal; hyphens: none; }
  .solar-erp-page .ax-card__subtitle { line-height: 1.45; }
  .solar-erp-page .ax-card__actions {
    flex: 0 1 auto; min-width: 0; margin-left: auto; display: flex; align-items: center;
    justify-content: flex-end; flex-wrap: nowrap; gap: 8px;
  }
  .solar-erp-page .ax-card__actions .ax-cluster { flex-wrap: nowrap !important; min-width: 0; justify-content: flex-end; }
  .solar-erp-page .ax-card__actions .ax-search,
  .solar-erp-page .ax-card__actions [class*="search"] { flex: 1 1 140px; min-width: 200px; max-width: 240px; }
  .solar-erp-page .ax-card__actions input { min-width: 0; width: 100%; }
  .solar-erp-page .ax-card__actions .ax-export-toolbar,
  .solar-erp-page .ax-card__actions [class*="export-toolbar"] { flex: 0 1 auto; min-width: 0; flex-wrap: nowrap; gap: 4px; }
  .solar-erp-page .ax-export-toolbar__button { padding-inline: 8px !important; min-width: 0; }
  .solar-erp-page .ax-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; width: 100%; }
`;

export function StatusView() {
  const [searchParams] = useSearchParams();
  const statusParam = searchParams.get('status') || 'total-site';
  const vendorParam = searchParams.get('vendor');
  const districtParam = searchParams.get('district');

  const [list, setList] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      let res: any;
      if (vendorParam) {
        res = await kashmirAdminService.getVendorWiseData(statusParam, vendorParam);
      } else if (districtParam) {
        res = await kashmirAdminService.getDistrictWiseData(statusParam, districtParam);
      } else {
        res = await kashmirAdminService.getViewDashboard(statusParam);
      }
      const d = res?.data;
      const items = Array.isArray(d)
        ? d
        : Array.isArray(d?.kashmirsrt70mw)
        ? d.kashmirsrt70mw
        : Array.isArray(d?.sites)
        ? d.sites
        : Array.isArray(res?.kashmirsrt70mw)
        ? res.kashmirsrt70mw
        : [];
      setList(items);
    } catch (err: any) {
      console.error('Failed to fetch status data:', err);
      setErrorMsg(err?.message || 'Failed to fetch status data.');
    } finally {
      setLoading(false);
    }
  }, [statusParam, vendorParam, districtParam]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((r) =>
      [r.site_name, r.site_code, r.district, r.vendor_name, r.contact_person].some((v) =>
        String(v ?? '').toLowerCase().includes(q)
      )
    );
  }, [list, search]);

  const paged = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const exportCols: ExportColumn<Row>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r, idx) => (idx !== undefined ? idx + 1 : '') },
      { header: 'Site Name', accessor: (r) => r.site_name || DASH },
      { header: 'Site Code', accessor: (r) => r.site_code || DASH },
      { header: 'District', accessor: (r) => r.district || DASH },
      { header: 'Vendor', accessor: (r) => r.vendor_name || DASH },
      { header: 'Status', accessor: (r) => (Number(r.inst_status) === 1 ? 'Installed' : 'Pending') },
    ],
    []
  );

  const displayStatus = statusParam.replace(/-/g, ' ').toUpperCase();

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      <PageHead
        title={`Kashmir SRT 70MW: ${displayStatus}`}
        subtitle={
          <span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>
            Filtered drilldown records for status: {statusParam}
          </span>
        }
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Dashboard', href: '/vendor-management/kashmir/srt70mw/installation/dashboard' },
          { label: displayStatus, href: '#' },
        ]}
        actions={
          <Link to="/vendor-management/kashmir/srt70mw/installation/dashboard" className="ax-btn ax-btn--subtle ax-btn--pill">
            Back to Dashboard
          </Link>
        }
      />

      {errorMsg && (
        <div className="ax-alert ax-alert--danger" role="alert" style={{ marginBottom: 16 }}>
          <div className="ax-alert__content">
            <h4 className="ax-alert__title" style={{ margin: 0, fontWeight: 600 }}>{errorMsg}</h4>
          </div>
        </div>
      )}

      <div className="ax-card">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <span className="ax-card__eyebrow">Drilldown Records</span>
            <h3 className="ax-card__title" style={{ margin: 0 }}>Sites List ({displayStatus})</h3>
            <p className="ax-card__subtitle" style={{ margin: '2px 0 0' }}>
              Showing {filtered.length} sites
            </p>
          </div>

          <div className="ax-card__actions">
            <div className="ax-cluster">
              <SearchInput
                value={search}
                onChange={(v) => { setSearch(v); setCurrentPage(1); }}
                placeholder="Search..."
              />

              <TableExportToolbar
                onExportCSV={() => exportDataToCSV(filtered, exportCols, `kashmir_${statusParam}`)}
                onExportExcel={() => exportDataToExcel(filtered, exportCols, `kashmir_${statusParam}`)}
                onPrint={() => printTableData(filtered, exportCols, `Kashmir Sites - ${displayStatus}`)}
                onCopy={() => copyTableDataToClipboard(filtered, exportCols)}
              />
            </div>
          </div>
        </div>

        <div className="ax-card__body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: 24 }}>
              <KpiSkeleton count={5} />
            </div>
          ) : filtered.length === 0 ? (
            <TableEmptyState
              title="No Sites Found"
              description="No site records found for this status criteria."
            />
          ) : (
            <div className="ax-table-wrap">
              <table className="ax-table">
                <thead>
                  <tr>
                    <th style={{ width: 60, textAlign: 'center' }}>Sr. No.</th>
                    <th>Site Name</th>
                    <th>Site Code</th>
                    <th>District</th>
                    <th>Vendor</th>
                    <th>Sanction Load</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((row, idx) => {
                    const srNo = (currentPage - 1) * pageSize + idx + 1;
                    return (
                      <tr key={row.id || idx}>
                        <td style={{ textAlign: 'center', color: 'var(--ax-text-muted)' }}>{srNo}</td>
                        <td style={{ fontWeight: 600 }}>{txt(row.site_name)}</td>
                        <td>{txt(row.site_code)}</td>
                        <td>{txt(row.district)}</td>
                        <td>{txt(row.vendor_name)}</td>
                        <td>{txt(row.sanction_load)} kW</td>
                        <td>
                          <span className={`ax-badge ax-badge--${Number(row.inst_status) === 1 ? 'success' : 'warning'}`}>
                            {Number(row.inst_status) === 1 ? 'Installed' : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {filtered.length > pageSize && (
          <div className="ax-card__footer">
            <div className="ula-pagination-left">
              <Pagination
                currentPage={currentPage}
                totalItems={filtered.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(sz) => { setPageSize(sz); setCurrentPage(1); }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StatusView;
