import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  upInstallationService,
  type UpRescoInstalledSiteItem,
} from '../../up-services';
import {
  Pagination,
  usePagination,
  SearchInput,
  TableExportToolbar,
  TableEmptyState,
  type ExportColumn,
} from '../../../../../common';

const ApexChart = lazy(() => import('../../../../charts/ApexChart').then((m) => ({ default: m.ApexChart })));

const num = (x: number) => (x ?? 0).toLocaleString('en-IN');
const pctOf = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : 0);

const DASHBOARD_CSS = `
  .solar-erp-page .ax-dash-grid { margin-top: 0; }
  .solar-erp-page .clickable-kpi {
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
  }
  .solar-erp-page .clickable-kpi:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    border-color: var(--ax-accent, #2563eb);
  }
  .solar-erp-page .ax-welcome {
    border-radius: var(--ax-radius-xl, 12px);
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    color: #fff;
    padding: 24px;
    margin-bottom: 20px;
    border: 1px solid #334155;
  }
  .solar-erp-page .ax-welcome__stats {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 16px;
    margin-top: 20px;
    padding-top: 18px;
    border-top: 1px solid rgba(255,255,255,0.1);
  }
  .solar-erp-page .ax-welcome__stat dt {
    font-size: 12px;
    color: #94a3b8;
    margin-bottom: 4px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .solar-erp-page .ax-welcome__stat dd {
    font-size: 26px;
    font-weight: 700;
    margin: 0;
    color: #f8fafc;
  }
  @media (max-width: 768px) {
    .solar-erp-page .ax-welcome__stats {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
`;

export function UP_Installation_Resco_Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [sites, setSites] = useState<UpRescoInstalledSiteItem[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [apiError, setApiError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const res = await upInstallationService.getRescoInstalledSites();
      setSites(res.data || []);
    } catch (err: any) {
      console.error(err);
      setApiError(err?.message || 'Failed to load Resco installation dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalSites = sites.length;
  const completedSites = sites.filter((s) => s.installation_date || s.inverter_no).length;
  const pendingSites = totalSites - completedSites;
  const verifiedSites = sites.filter((s) => s.verify_status === 1).length;
  const docVerified = sites.filter((s) => s.document_status === 1).length;

  const compPct = pctOf(completedSites, totalSites);
  const verPct = pctOf(verifiedSites, totalSites);

  // Group by district
  const districtwise = useMemo(() => {
    const map = new Map<string, { district: string; total: number; complete: number; pending: number; verified: number }>();
    sites.forEach((s) => {
      const d = s.district || 'Other';
      const cur = map.get(d) || { district: d, total: 0, complete: 0, pending: 0, verified: 0 };
      cur.total += 1;
      if (s.installation_date || s.inverter_no) {
        cur.complete += 1;
      } else {
        cur.pending += 1;
      }
      if (s.verify_status === 1) cur.verified += 1;
      map.set(d, cur);
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [sites]);

  const districtFiltered = useMemo(() => {
    if (selectedDistrict === 'All') return districtwise;
    return districtwise.filter((d) => d.district.toLowerCase() === selectedDistrict.toLowerCase());
  }, [districtwise, selectedDistrict]);

  const searchFiltered = useMemo(() => {
    if (!searchQuery.trim()) return districtFiltered;
    const q = searchQuery.toLowerCase();
    return districtFiltered.filter((d) => d.district.toLowerCase().includes(q));
  }, [districtFiltered, searchQuery]);

  const pagination = usePagination(searchFiltered, { initialPageSize: 10 });
  const pageItems = pagination.pageItems || pagination.paged || [];
  const startIndex = pagination.startIndex ?? pagination.from ?? 0;

  // Chart data
  const chartCategories = useMemo(() => districtwise.slice(0, 8).map((d) => d.district), [districtwise]);
  const chartSeries = useMemo(
    () => [
      { name: 'Completed', data: districtwise.slice(0, 8).map((d) => d.complete) },
      { name: 'Pending', data: districtwise.slice(0, 8).map((d) => d.pending) },
    ],
    [districtwise]
  );

  const chartOptions: any = {
    chart: { type: 'bar', stacked: true, toolbar: { show: false }, height: 260 },
    colors: ['#10b981', '#f59e0b'],
    plotOptions: { bar: { borderRadius: 4, columnWidth: '40%' } },
    dataLabels: { enabled: false },
    xaxis: { categories: chartCategories },
    yaxis: { title: { text: 'Rooftop Sites' } },
    grid: { strokeDashArray: 3 },
  };

  const exportCols: ExportColumn<any>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_, idx) => idx + 1 },
      { header: 'District', accessor: (r) => r.district },
      { header: 'Total Sites', accessor: (r) => r.total },
      { header: 'Complete', accessor: (r) => r.complete },
      { header: 'Pending', accessor: (r) => r.pending },
      { header: 'Verified Approved', accessor: (r) => r.verified },
    ],
    []
  );

  return (
    <div className="solar-erp-page ax-page">
      <style>{DASHBOARD_CSS}</style>

      <PageHead
        title="UP Resco - Installation Dashboard"
        subtitle="Executive operational progress, equipment commissioning & physical verification metrics"
        breadcrumbs={[
          { label: 'Home', href: '/v' },
          { label: 'Uttar Pradesh' },
          { label: 'Installation' },
          { label: 'Resco Dashboard' },
        ]}
        actions={
          <div className="ax-cluster" style={{ gap: 8 }}>
            <button
              type="button"
              className="ax-btn ax-btn--ghost ax-btn--sm"
              onClick={loadData}
              disabled={loading}
              title="Refresh Dashboard"
            >
              <svg className={`ax-btn__icon ${loading ? 'ax-spinner' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
                <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
              </svg>
              <span>Refresh</span>
            </button>
            <Link to="/v/up/resco-view-assign-installation-sites" className="ax-btn ax-btn--secondary ax-btn--sm">
              Assigned Sites
            </Link>
            <Link to="/v/up/resco-install-site" className="ax-btn ax-btn--primary ax-btn--sm">
              + Install Site
            </Link>
          </div>
        }
      />

      {apiError && (
        <div className="ax-alert ax-alert--danger" style={{ marginBottom: 16 }}>
          <span>{apiError}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="ax-card" style={{ marginBottom: 16, padding: '10px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>Filter District:</span>
            <select
              className="ax-input ax-input--sm"
              style={{ width: 200, height: 32 }}
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
            >
              <option value="All">All Districts ({districtwise.length})</option>
              {districtwise.map((d) => (
                <option key={d.district} value={d.district}>
                  {d.district}
                </option>
              ))}
            </select>
            {selectedDistrict !== 'All' && (
              <button
                type="button"
                className="ax-btn ax-btn--ghost ax-btn--sm"
                onClick={() => setSelectedDistrict('All')}
              >
                Reset Filter
              </button>
            )}
          </div>

          <div style={{ fontSize: 12, color: 'var(--ax-text-muted)' }}>
            Showing <b>{num(totalSites)}</b> total installations across <b>{districtwise.length}</b> districts
          </div>
        </div>
      </div>

      {/* Executive Welcome Hero Banner */}
      <section className="ax-welcome">
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            RESCO Solar Rooftop Installation Project
          </span>
          <h2 style={{ margin: '6px 0 8px 0', fontSize: 24, fontWeight: 700, color: '#fff' }}>
            Welcome to UP Resco Installation Dashboard
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: '#cbd5e1', maxWidth: 800, lineHeight: 1.5 }}>
            Statewide rooftop solar installation overview: <b>{num(totalSites)} installations</b> tracked across{' '}
            <b>{districtwise.length} districts</b>. <b>{num(completedSites)} ({compPct}%)</b> installations completed, with{' '}
            <b>{num(verifiedSites)} ({verPct}%)</b> physically verified and approved.
          </p>
        </div>

        <dl className="ax-welcome__stats">
          <div className="ax-welcome__stat">
            <dt>Total Assign</dt>
            <dd>{num(totalSites)}</dd>
            <small style={{ color: '#38bdf8', fontSize: 11 }}>{districtwise.length} Districts</small>
          </div>
          <div className="ax-welcome__stat">
            <dt>Completed</dt>
            <dd>{num(completedSites)}</dd>
            <small style={{ color: '#10b981', fontSize: 11 }}>{compPct}% Done</small>
          </div>
          <div className="ax-welcome__stat">
            <dt>Physical Verify</dt>
            <dd>{num(verifiedSites)}</dd>
            <small style={{ color: '#34d399', fontSize: 11 }}>{verPct}% Approved</small>
          </div>
          <div className="ax-welcome__stat">
            <dt>Document Verify</dt>
            <dd>{num(docVerified)}</dd>
            <small style={{ color: '#fbbf24', fontSize: 11 }}>Verified</small>
          </div>
        </dl>
      </section>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 24 }}>
        <div className="ax-card clickable-kpi" onClick={() => navigate('/v/up/resco-view-install-site')} style={{ padding: '16px 18px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ax-text-muted)' }}>Total Assigned</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--ax-text-strong)', marginTop: 4 }}>
            {num(totalSites)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--ax-accent, #2563eb)', marginTop: 4 }}>View details →</div>
        </div>

        <div className="ax-card clickable-kpi" onClick={() => navigate('/v/up/resco-view-install-site')} style={{ padding: '16px 18px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ax-text-muted)' }}>Installation Status</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--ax-text-strong)', marginTop: 4 }}>
            <span style={{ color: '#10b981' }}>{num(completedSites)}</span> / <span style={{ color: '#f59e0b' }}>{num(pendingSites)}</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', marginTop: 4 }}>Complete / Pending</div>
        </div>

        <div className="ax-card clickable-kpi" onClick={() => navigate('/v/up/resco-view-install-site')} style={{ padding: '16px 18px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ax-text-muted)' }}>Physical Verification</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#10b981', marginTop: 4 }}>
            {num(verifiedSites)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', marginTop: 4 }}>Approved sites</div>
        </div>

        <div className="ax-card clickable-kpi" onClick={() => navigate('/v/up/resco-installation-claim')} style={{ padding: '16px 18px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ax-text-muted)' }}>Payment Claims</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#3b82f6', marginTop: 4 }}>
            40% / 30% / 30%
          </div>
          <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', marginTop: 4 }}>Milestone stage claims →</div>
        </div>
      </div>

      {/* Charts Section */}
      {districtwise.length > 0 && (
        <div className="ax-card" style={{ marginBottom: 24, padding: '18px 20px' }}>
          <div style={{ marginBottom: 12 }}>
            <h3 className="ax-card__title" style={{ margin: 0, fontSize: 15 }}>
              District-wise Installation Breakdown
            </h3>
            <p className="ax-card__subtitle" style={{ margin: '2px 0 0', fontSize: 12 }}>
              Comparison of completed vs pending rooftop installations
            </p>
          </div>
          <Suspense fallback={<div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading chart...</div>}>
            <ApexChart options={chartOptions} series={chartSeries} type="bar" height={260} />
          </Suspense>
        </div>
      )}

      {/* District-wise Table */}
      <div className="ax-card">
        <div className="ax-card__header" style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 className="ax-card__title" style={{ margin: 0, fontSize: 16 }}>
              District-Wise Installation Progress
            </h3>
            <p className="ax-card__subtitle" style={{ margin: '2px 0 0', fontSize: 12 }}>
              Rooftop solar installation and verification summary by district
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search district..."
              size="sm"
            />
            <TableExportToolbar
              data={searchFiltered}
              columns={exportCols}
              filename="up_resco_districtwise"
              title="UP Resco - District Progress"
            />
          </div>
        </div>

        <div className="ax-card__body" style={{ padding: 0 }}>
          <div className="ax-table-wrap">
            <table className="ax-table ax-table--striped">
              <thead>
                <tr>
                  <th style={{ width: 50, textAlign: 'center' }}>Sr. No.</th>
                  <th>District</th>
                  <th style={{ textAlign: 'center' }}>Total Sites</th>
                  <th style={{ textAlign: 'center' }}>Complete</th>
                  <th style={{ textAlign: 'center' }}>Pending</th>
                  <th style={{ textAlign: 'center' }}>Verified Approved</th>
                  <th style={{ width: 100, textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: 36 }}>
                      <span className="ax-spinner" /> Loading district data...
                    </td>
                  </tr>
                ) : pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: 0 }}>
                      <TableEmptyState
                        title="No districts found"
                        subtitle={searchQuery ? 'Try adjusting your search criteria' : 'No records available'}
                      />
                    </td>
                  </tr>
                ) : (
                  pageItems.map((d, idx) => {
                    const sr = startIndex + idx + 1;
                    return (
                      <tr key={d.district || idx}>
                        <td style={{ textAlign: 'center', fontWeight: 600 }}>{sr}</td>
                        <td style={{ fontWeight: 600 }}>{d.district}</td>
                        <td style={{ textAlign: 'center', fontWeight: 700 }}>{num(d.total)}</td>
                        <td style={{ textAlign: 'center', color: '#10b981', fontWeight: 600 }}>{num(d.complete)}</td>
                        <td style={{ textAlign: 'center', color: '#f59e0b' }}>{num(d.pending)}</td>
                        <td style={{ textAlign: 'center', color: '#10b981' }}>{num(d.verified)}</td>
                        <td style={{ textAlign: 'center' }}>
                          <Link
                            to="/v/up/resco-view-install-site"
                            className="ax-btn ax-btn--ghost ax-btn--sm"
                            style={{ padding: '3px 8px', fontSize: 11 }}
                          >
                            View Sites
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

export default UP_Installation_Resco_Dashboard;
