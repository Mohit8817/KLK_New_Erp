import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  upInstallationService,
  type UpSsl18wDashboardData,
  type UpSsl18wInstallDetailsCount,
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
  .solar-erp-page .ax-card { min-width: 0; }
  .solar-erp-page .ax-card__footer { width: 100%; box-sizing: border-box; }
  .solar-erp-page .ax-card__header {
    display: flex; flex-wrap: nowrap; align-items: flex-start; justify-content: space-between; gap: 12px;
  }
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
    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
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

export function UP_Installation_SSL_Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<UpSsl18wDashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const resp = await upInstallationService.getSsl18wDashboardData();
      if (resp) {
        setData(resp);
      } else {
        setApiError('Unable to load UP SSL 18W installation dashboard from server.');
      }
    } catch (err: any) {
      console.error(err);
      setApiError(err?.message || 'Failed to fetch dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const rawDetail: UpSsl18wInstallDetailsCount = data?.install_detail || {
    total: 0,
    accept: 0,
    complete: 0,
    pending: 0,
    verify_approved: 0,
    verify_pending: 0,
    verify_reject: 0,
    claim_applicable: 0,
    claim_raised: 0,
    claim_not_applicable: 0,
    claim_verify_approved: 0,
    claim_verify_pending: 0,
    claim_verify_reject: 0,
    payment_complete: 0,
    payment_pending: 0,
    payment_partially: 0,
  };

  const districtwise = useMemo(() => data?.districtwise || [], [data]);
  const monthlyData = useMemo(() => data?.vendor_installation_month || [], [data]);

  // If district filter is chosen, optionally aggregate or focus on that district
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

  const totalLights = rawDetail.total || 0;
  const completedLights = rawDetail.complete || 0;
  const approvedLights = rawDetail.verify_approved || 0;
  const compPct = pctOf(completedLights, totalLights);
  const appPct = pctOf(approvedLights, totalLights);

  const navigateToStatus = (status: string, dist?: string) => {
    const d = dist || (selectedDistrict !== 'All' ? selectedDistrict : '');
    const q = new URLSearchParams();
    q.set('status', status);
    if (d) q.set('district', d);
    navigate(`/v/up/ssl-18w-installation-dashboard-status?${q.toString()}`);
  };

  // ApexCharts config for Monthly Trend
  const chartCategories = useMemo(() => {
    return [...monthlyData].reverse().map((m) => m.month_year);
  }, [monthlyData]);

  const chartSeries = useMemo(() => {
    return [
      {
        name: 'Installations',
        data: [...monthlyData].reverse().map((m) => m.monthly_installations),
      },
    ];
  }, [monthlyData]);

  const chartOptions: any = {
    chart: { type: 'bar', toolbar: { show: false }, height: 260 },
    colors: ['#2563eb'],
    plotOptions: { bar: { borderRadius: 4, columnWidth: '45%' } },
    dataLabels: { enabled: false },
    xaxis: { categories: chartCategories },
    yaxis: { title: { text: 'Installations' } },
    grid: { strokeDashArray: 3 },
  };

  // Export Columns for District Table
  const exportCols: ExportColumn<any>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_, idx) => idx + 1 },
      { header: 'District', accessor: (r) => r.district },
      { header: 'Total Lights', accessor: (r) => r.total },
      { header: 'Assigned', accessor: (r) => r.assigned ?? r.total },
      { header: 'Accepted', accessor: (r) => r.accept ?? 0 },
      { header: 'Complete', accessor: (r) => r.complete ?? 0 },
      { header: 'Pending', accessor: (r) => r.pending ?? 0 },
      { header: 'Verified Approved', accessor: (r) => r.verify_approved ?? 0 },
      { header: 'Claim Applicable', accessor: (r) => r.claim_applicable ?? 0 },
      { header: 'Payment Done', accessor: (r) => r.payment_complete ?? 0 },
    ],
    []
  );

  return (
    <div className="solar-erp-page ax-page">
      <style>{DASHBOARD_CSS}</style>

      <PageHead
        title="UP SSL 18W - Installation Dashboard"
        subtitle="Executive operational metrics, live installation analytics & district progress"
        breadcrumbs={[
          { label: 'Home', href: '/v' },
          { label: 'Uttar Pradesh' },
          { label: 'Installation' },
          { label: 'SSL 18W Dashboard' },
        ]}
        actions={
          <div className="ax-cluster" style={{ gap: 8 }}>
            <button
              type="button"
              className="ax-btn ax-btn--ghost ax-btn--sm"
              onClick={loadDashboardData}
              disabled={loading}
              title="Refresh Dashboard"
            >
              <svg className={`ax-btn__icon ${loading ? 'ax-spinner' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
                <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
              </svg>
              <span>Refresh</span>
            </button>
            <Link to="/v/up/view-18w-assign-installation-sites" className="ax-btn ax-btn--secondary ax-btn--sm">
              Assigned Lights
            </Link>
            <Link to="/v/up/ssl-install-18w-light" className="ax-btn ax-btn--primary ax-btn--sm">
              + Install Light
            </Link>
          </div>
        }
      />

      {apiError && (
        <div className="ax-alert ax-alert--danger" style={{ marginBottom: 16 }}>
          <span>{apiError}</span>
        </div>
      )}

      {/* 1. Filter Operations Bar */}
      <div className="ax-card" style={{ marginBottom: 16, padding: '10px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ax-text-strong)' }}>
              Filter District:
            </span>
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
            Showing <b>{num(totalLights)}</b> total lights across <b>{districtwise.length}</b> districts
          </div>
        </div>
      </div>

      {/* 2. Executive Welcome Hero Banner */}
      <section className="ax-welcome">
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            UP SSL 18W Solar Street Light Project
          </span>
          <h2 style={{ margin: '6px 0 8px 0', fontSize: 24, fontWeight: 700, color: '#fff' }}>
            Welcome to UP SSL 18W Installation Dashboard
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: '#cbd5e1', maxWidth: 800, lineHeight: 1.5 }}>
            Comprehensive installation monitoring across Uttar Pradesh: <b>{num(totalLights)} lights</b> tracked across{' '}
            <b>{districtwise.length} districts</b>. <b>{num(completedLights)} ({compPct}%)</b> installations completed, with{' '}
            <b>{num(approvedLights)} ({appPct}%)</b> physically verified and approved.
          </p>
        </div>

        <dl className="ax-welcome__stats">
          <div className="ax-welcome__stat">
            <dt>Total Lights</dt>
            <dd>{num(totalLights)}</dd>
            <small style={{ color: '#38bdf8', fontSize: 11 }}>{districtwise.length} Districts</small>
          </div>
          <div className="ax-welcome__stat">
            <dt>Accepted</dt>
            <dd>{num(rawDetail.accept || 0)}</dd>
            <small style={{ color: '#4ade80', fontSize: 11 }}>Ready to install</small>
          </div>
          <div className="ax-welcome__stat">
            <dt>Completed</dt>
            <dd>{num(completedLights)}</dd>
            <small style={{ color: '#fbbf24', fontSize: 11 }}>{compPct}% Installed</small>
          </div>
          <div className="ax-welcome__stat">
            <dt>Verified Approved</dt>
            <dd>{num(approvedLights)}</dd>
            <small style={{ color: '#34d399', fontSize: 11 }}>{appPct}% Approved</small>
          </div>
        </dl>
      </section>

      {/* 3. Interactive KPI Cards (Click to drill down) */}
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--ax-text-strong)' }}>
          Operational Metrics & Verification Status
        </h4>
        <span style={{ fontSize: 12, color: 'var(--ax-text-muted)' }}>
          Click any card to inspect corresponding lights in Status View
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 24 }}>
        {/* Total Lights */}
        <div className="ax-card clickable-kpi" onClick={() => navigateToStatus('total')} style={{ padding: '16px 18px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ax-text-muted)' }}>Total Lights</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--ax-text-strong)', marginTop: 4 }}>
            {num(rawDetail.total)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--ax-accent, #2563eb)', marginTop: 4 }}>
            Click to view all →
          </div>
        </div>

        {/* Accepted Lights */}
        <div className="ax-card clickable-kpi" onClick={() => navigateToStatus('accept')} style={{ padding: '16px 18px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ax-text-muted)' }}>Accepted Lights</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#10b981', marginTop: 4 }}>
            {num(rawDetail.accept || 0)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', marginTop: 4 }}>
            Assignment accepted
          </div>
        </div>

        {/* Installation Status */}
        <div className="ax-card clickable-kpi" onClick={() => navigateToStatus('complete')} style={{ padding: '16px 18px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ax-text-muted)' }}>Installation Status</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ax-text-strong)', marginTop: 4 }}>
            <span style={{ color: '#10b981' }}>{num(rawDetail.complete)}</span> /{' '}
            <span style={{ color: '#f59e0b' }}>{num(rawDetail.pending)}</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', marginTop: 4 }}>
            Complete / Pending
          </div>
        </div>

        {/* Verification Status */}
        <div className="ax-card clickable-kpi" onClick={() => navigateToStatus('verify-approved')} style={{ padding: '16px 18px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ax-text-muted)' }}>Verification Status</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--ax-text-strong)', marginTop: 4 }}>
            <span style={{ color: '#10b981' }}>{num(rawDetail.verify_approved)}</span> /{' '}
            <span style={{ color: '#f59e0b' }}>{num(rawDetail.verify_pending)}</span> /{' '}
            <span style={{ color: '#ef4444' }}>{num(rawDetail.verify_reject)}</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', marginTop: 4 }}>
            Approved / Pending / Rejected
          </div>
        </div>

        {/* Claim Status */}
        <div className="ax-card clickable-kpi" onClick={() => navigateToStatus('claim-applicable')} style={{ padding: '16px 18px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ax-text-muted)' }}>Claim Status</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--ax-text-strong)', marginTop: 4 }}>
            <span style={{ color: '#3b82f6' }}>{num(rawDetail.claim_applicable)}</span> /{' '}
            <span style={{ color: '#10b981' }}>{num(rawDetail.claim_raised)}</span> /{' '}
            <span style={{ color: '#94a3b8' }}>{num(rawDetail.claim_not_applicable)}</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', marginTop: 4 }}>
            Applicable / Raised / N/A
          </div>
        </div>

        {/* Claim Verify Status */}
        <div className="ax-card clickable-kpi" onClick={() => navigateToStatus('claim-verify-approved')} style={{ padding: '16px 18px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ax-text-muted)' }}>Claim Verification</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--ax-text-strong)', marginTop: 4 }}>
            <span style={{ color: '#10b981' }}>{num(rawDetail.claim_verify_approved)}</span> /{' '}
            <span style={{ color: '#f59e0b' }}>{num(rawDetail.claim_verify_pending)}</span> /{' '}
            <span style={{ color: '#ef4444' }}>{num(rawDetail.claim_verify_reject)}</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', marginTop: 4 }}>
            Approved / Pending / Rejected
          </div>
        </div>

        {/* Payment Status */}
        <div className="ax-card clickable-kpi" onClick={() => navigateToStatus('payment-complete')} style={{ padding: '16px 18px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ax-text-muted)' }}>Payment Status</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ax-text-strong)', marginTop: 4 }}>
            <span style={{ color: '#10b981' }}>{num(rawDetail.payment_complete)}</span> /{' '}
            <span style={{ color: '#f59e0b' }}>{num(rawDetail.payment_pending)}</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', marginTop: 4 }}>
            Complete / Pending
          </div>
        </div>
      </div>

      {/* 4. Chart Section */}
      {monthlyData.length > 0 && (
        <div className="ax-card" style={{ marginBottom: 24, padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <h3 className="ax-card__title" style={{ margin: 0, fontSize: 15 }}>
                Monthly Installation Velocity (Last 10 Months)
              </h3>
              <p className="ax-card__subtitle" style={{ margin: '2px 0 0', fontSize: 12 }}>
                Month-on-month trend of completed solar street light installations
              </p>
            </div>
          </div>
          <Suspense fallback={<div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading chart...</div>}>
            <ApexChart options={chartOptions} series={chartSeries} type="bar" height={260} />
          </Suspense>
        </div>
      )}

      {/* 5. District-wise Installation Breakdown Table */}
      <div className="ax-card">
        <div className="ax-card__header" style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 className="ax-card__title" style={{ margin: 0, fontSize: 16 }}>
              District-Wise Installation Progress
            </h3>
            <p className="ax-card__subtitle" style={{ margin: '2px 0 0', fontSize: 12 }}>
              Aggregated installation, verification & payment counts per district
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
              filename="up_ssl_18w_districtwise"
              title="UP SSL 18W - District-Wise Progress"
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
                  <th style={{ textAlign: 'center' }}>Total</th>
                  <th style={{ textAlign: 'center' }}>Assigned</th>
                  <th style={{ textAlign: 'center' }}>Accepted</th>
                  <th style={{ textAlign: 'center' }}>Complete</th>
                  <th style={{ textAlign: 'center' }}>Pending</th>
                  <th style={{ textAlign: 'center' }}>Verified</th>
                  <th style={{ textAlign: 'center' }}>Claim Applicable</th>
                  <th style={{ width: 100, textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', padding: 36 }}>
                      <span className="ax-spinner" /> Loading district data...
                    </td>
                  </tr>
                ) : pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ padding: 0 }}>
                      <TableEmptyState
                        title="No districts found"
                        subtitle={searchQuery ? 'Try adjusting your search query' : 'No district records available'}
                      />
                    </td>
                  </tr>
                ) : (
                  pageItems.map((d, idx) => {
                    const sr = startIndex + idx + 1;
                    return (
                      <tr key={d.district || idx}>
                        <td style={{ textAlign: 'center', fontWeight: 600 }}>{sr}</td>
                        <td style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>{d.district}</td>
                        <td style={{ textAlign: 'center', fontWeight: 700 }}>{num(d.total)}</td>
                        <td style={{ textAlign: 'center' }}>{num(d.assigned ?? d.total)}</td>
                        <td style={{ textAlign: 'center', color: '#10b981', fontWeight: 600 }}>{num(d.accept ?? 0)}</td>
                        <td style={{ textAlign: 'center', color: '#10b981', fontWeight: 600 }}>{num(d.complete ?? 0)}</td>
                        <td style={{ textAlign: 'center', color: '#f59e0b' }}>{num(d.pending ?? 0)}</td>
                        <td style={{ textAlign: 'center', color: '#10b981' }}>{num(d.verify_approved ?? 0)}</td>
                        <td style={{ textAlign: 'center', color: '#3b82f6' }}>{num(d.claim_applicable ?? 0)}</td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="ax-btn ax-btn--ghost ax-btn--sm"
                            style={{ padding: '4px 8px', fontSize: 11 }}
                            onClick={() => navigateToStatus('total', d.district)}
                          >
                            View Lights
                          </button>
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

export default UP_Installation_SSL_Dashboard;
