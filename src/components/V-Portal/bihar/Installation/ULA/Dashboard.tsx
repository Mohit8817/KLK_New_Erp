import { useState, useMemo, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { ApexChart } from '../../../../charts/ApexChart';
import {
  biharUlaInstallationService,
  type UlaInstallationDashboardData,
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

const ICON_PLUS = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 5l0 14" />
    <path d="M5 12l14 0" />
  </svg>
);

const ICON_FILTER = (
  <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 4h16v2.172a2 2 0 0 1 -.586 1.414l-4.828 4.828v7.586l-4 -2v-5.586l-4.828 -4.828a2 2 0 0 1 -.586 -1.414v-2.172z" />
  </svg>
);

export function Bihar_Installation_ULA_Dashboard() {
  const [data, setData] = useState<UlaInstallationDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Filter & Search states
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Status Drill-Down Modal state
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusModalTitle, setStatusModalTitle] = useState('');
  const [statusModalSites, setStatusModalSites] = useState<any[]>([]);
  const [statusModalLoading, setStatusModalLoading] = useState(false);

  const loadDashboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setApiError(null);
    try {
      const resp = await biharUlaInstallationService.getDashboardData();
      if (resp) {
        setData(resp);
      } else {
        setApiError('Unable to load Bihar ULA dashboard data from server.');
      }
    } catch (err: any) {
      console.warn('Dashboard fetch error:', err);
      setApiError(err?.message || 'Failed to load Bihar ULA installation dashboard.');
    } finally {
      setLoading(false);
      if (isRefresh) {
        setTimeout(() => setIsRefreshing(false), 400);
      }
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const ula = useMemo(() => {
    return data?.ula || {
      site_count: 0,
      structure_complete: 0,
      structure_pending: 0,
      structure_verify_pending: 0,
      structure_verify_approved: 0,
      structure_verify_reject: 0,
      complete: 0,
      pending: 0,
      verify_pending: 0,
      verify_approved: 0,
      verify_reject: 0,
      inst_doc_complete: 0,
      inst_doc_pending: 0,
      claim50_applicable: 0,
      claim50_raised: 0,
      claim30_applicable: 0,
      inst_pay50_paid: 0,
      inst_pay50_pending: 0,
      inst_pay30_paid: 0,
      inst_pay30_pending: 0,
    };
  }, [data]);

  const districtwise = useMemo(() => {
    return Array.isArray(data?.districtwise) ? data.districtwise : [];
  }, [data]);

  const monthlyInstallations = useMemo(() => {
    return Array.isArray(data?.vendor_installation_month) ? data.vendor_installation_month : [];
  }, [data]);

  const todayInstallations = useMemo(() => {
    return Array.isArray(data?.vendor_today_installation) ? data.vendor_today_installation : [];
  }, [data]);

  // Filtered districts
  const filteredDistricts = useMemo(() => {
    return districtwise.filter((d) => {
      const dName = d.district || '';
      const matchDistrict = selectedDistrict === 'All' || dName.toLowerCase() === selectedDistrict.toLowerCase();
      const matchQuery = !searchQuery || dName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchDistrict && matchQuery;
    });
  }, [districtwise, selectedDistrict, searchQuery]);

  // Paginated districts
  const paginatedDistricts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredDistricts.slice(start, start + pageSize);
  }, [filteredDistricts, currentPage, pageSize]);

  // Calculated Percentages
  const structCompletePct = ula.site_count > 0 ? Math.round((ula.structure_complete / ula.site_count) * 100) : 0;
  const instCompletePct = ula.site_count > 0 ? Math.round((ula.complete / ula.site_count) * 100) : 0;
  const structApprovedPct = ula.structure_complete > 0 ? Math.round((ula.structure_verify_approved / ula.structure_complete) * 100) : 0;

  // Chart configs
  const monthlyChartSeries = useMemo(() => {
    return [
      {
        name: 'Installations',
        data: monthlyInstallations.map((m) => m.monthly_installations || 0),
      },
    ];
  }, [monthlyInstallations]);

  const monthlyChartOptions: ApexCharts.ApexOptions = useMemo(() => {
    return {
      chart: {
        type: 'area',
        height: 280,
        toolbar: { show: false },
        zoom: { enabled: false },
      },
      colors: ['#0d9488'],
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 2 },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.45,
          opacityTo: 0.05,
          stops: [0, 95, 100],
        },
      },
      xaxis: {
        categories: monthlyInstallations.map((m) => m.month_year || ''),
        labels: { style: { fontSize: '11px' } },
      },
      yaxis: {
        labels: {
          formatter: (val) => `${Math.round(val)}`,
          style: { fontSize: '11px' },
        },
      },
      grid: {
        borderColor: 'rgba(0,0,0,0.05)',
        strokeDashArray: 3,
      },
      tooltip: {
        theme: 'light',
        y: { formatter: (val) => `${val} Sites` },
      },
    };
  }, [monthlyInstallations]);

  // Open drill-down modal for status
  const handleOpenStatusDrill = async (statusKey: string, title: string) => {
    setStatusModalTitle(title);
    setStatusModalOpen(true);
    setStatusModalLoading(true);
    try {
      const sites = await biharUlaInstallationService.getDashboardSitesByStatus(statusKey);
      setStatusModalSites(sites || []);
    } catch {
      setStatusModalSites([]);
    } finally {
      setStatusModalLoading(false);
    }
  };

  // Export Columns for Districtwise Table
  const districtExportCols: ExportColumn<any>[] = useMemo(
    () => [
      { header: 'District', accessor: (r) => r.district || '' },
      { header: 'Allocated Sites', accessor: (r) => r.site_count ?? 0 },
      { header: 'Structure Complete', accessor: (r) => r.structure_complete ?? 0 },
      { header: 'Installation Complete', accessor: (r) => r.complete ?? r.inst_complete ?? 0 },
      { header: 'Installation Pending', accessor: (r) => r.pending ?? 0 },
      { header: 'Verified Approved', accessor: (r) => r.verify_approved ?? 0 },
      { header: 'Verification Pending', accessor: (r) => r.verify_pending ?? 0 },
      { header: 'Verification Rejected', accessor: (r) => r.verify_reject ?? 0 },
      { header: 'Doc Complete', accessor: (r) => r.doc_complete ?? 0 },
      { header: 'Doc Pending', accessor: (r) => r.doc_pending ?? 0 },
    ],
    []
  );

  return (
    <div className="ax-page">
      <PageHead
        title="Bihar - Installation > ULA > Dashboard"
        subtitle="Unnat Lok Abhiyan (ULA) solar rooftop installation tracking, structure verification, and payments"
        breadcrumbs={[
          { label: 'Bihar' },
          { label: 'Installation' },
          { label: 'ULA' },
          { label: 'Dashboard' },
        ]}
        actions={
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={() => loadDashboardData(true)}
              disabled={isRefreshing}
            >
              <span className={isRefreshing ? 'ax-spinner' : ''}>{ICON_REFRESH}</span>
              <span className="ax-btn__label">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
            <Link to="/v/bihar/ula-installation-pending-structure-site" className="ax-btn ax-btn--primary ax-btn--sm">
              {ICON_PLUS}
              <span className="ax-btn__label">Add Installation</span>
            </Link>
          </div>
        }
      />

      {apiError && (
        <div className="ax-alert ax-alert--warning" style={{ marginBottom: 'var(--ax-space-4)' }}>
          <div className="ax-alert__title">Notice</div>
          <div className="ax-alert__text">{apiError}</div>
        </div>
      )}

      <div className="ax-dash-grid">
        {/* Filter Toolbar */}
        <section className="ax-card ax-col--12" style={{ padding: 'var(--ax-space-3)' }}>
          <div className="ax-rep-toolbar" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--ax-space-3)', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
              <span
                className="ax-badge ax-badge--soft ax-badge--info"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 10px',
                  fontSize: 'var(--ax-text-xs)',
                  fontWeight: 600,
                  borderRadius: 'var(--ax-radius-pill)',
                }}
              >
                {ICON_FILTER} Filter Metrics
              </span>

              {/* District Filter */}
              <div className="ax-cluster" style={{ gap: '6px', alignItems: 'center' }}>
                <label htmlFor="district-select" style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)', fontWeight: 500 }}>
                  District:
                </label>
                <select
                  id="district-select"
                  className="ax-input ax-input--sm"
                  style={{ width: 170, height: 32, fontSize: 'var(--ax-text-xs)', paddingInline: '8px' }}
                  value={selectedDistrict}
                  onChange={(e) => {
                    setSelectedDistrict(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="All">All Districts ({districtwise.length})</option>
                  {districtwise.map((d) => (
                    <option key={d.district} value={d.district}>{d.district}</option>
                  ))}
                </select>
              </div>

              {selectedDistrict !== 'All' && (
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--sm"
                  style={{ height: 28, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }}
                  onClick={() => setSelectedDistrict('All')}
                >
                  Reset
                </button>
              )}
            </div>

            <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>
                State: <b style={{ color: 'var(--ax-text-strong)' }}>Bihar</b> · Project: <b style={{ color: 'var(--ax-text-strong)' }}>ULA</b>
              </span>
              <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill" style={{ fontSize: '11px', padding: '2px 8px' }}>
                BREDA ULA Scheme
              </span>
            </div>
          </div>
        </section>

        {/* Welcome Executive Overview Banner */}
        <section className="ax-card ax-welcome ax-col--12" role="region" aria-label="Bihar ULA Installation Overview">
          <div className="ax-welcome__body">
            <div className="ax-welcome__text">
              <p className="ax-welcome__eyebrow">Unnat Lok Abhiyan (ULA) · Solar Installation Portal</p>
              <h2 className="ax-welcome__title">Welcome to Bihar ULA Installation Dashboard</h2>
              <p className="ax-welcome__lede">
                Real-time operational summary across <b>{districtwise.length} Bihar Districts</b>: <b>{ula.site_count} Total Allocated Sites</b>.
                <b> {ula.structure_complete} Structure Completed ({structCompletePct}%)</b>, <b>{ula.complete} Electrical Installations Done ({instCompletePct}%)</b>, with <b>{ula.verify_approved} Fully Verified</b>.
              </p>
            </div>

            <dl className="ax-welcome__stats">
              <div className="ax-welcome__stat">
                <dt>Total Sites</dt>
                <dd className="ax-num">{ula.site_count}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>Assigned</small>
              </div>
              <div className="ax-welcome__stat">
                <dt>Structure Done</dt>
                <dd className="ax-num">{ula.structure_complete}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-accent)' }}>{structCompletePct}%</small>
              </div>
              <div className="ax-welcome__stat">
                <dt>Electric Done</dt>
                <dd className="ax-num">{ula.complete}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-success)' }}>{instCompletePct}%</small>
              </div>
              <div className="ax-welcome__stat">
                <dt>Verified Approved</dt>
                <dd className="ax-num">{ula.verify_approved}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>Approved</small>
              </div>
            </dl>
          </div>
        </section>

        {/* ── KPI SECTION 1: Structure Erection Status ── */}
        <div className="ax-col--12">
          <h4 style={{ margin: 'var(--ax-space-2) 0 var(--ax-space-1) 0', fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Phase 1: Structure Erection Metrics
          </h4>
        </div>

        <div className="ax-card ax-kpi ax-col--3" role="button" tabIndex={0} onClick={() => handleOpenStatusDrill('structure_complete', 'Structure Completed Sites')} style={{ cursor: 'pointer' }}>
          <div className="ax-card__body">
            <div className="ax-kpi__top">
              <span className="ax-badge ax-badge--soft ax-badge--success">Structure Done</span>
              <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>{structCompletePct}%</span>
            </div>
            <div className="ax-kpi__label">Structure Complete</div>
            <div className="ax-kpi__value ax-num">{ula.structure_complete}</div>
            <div className="ax-kpi__caption">Sites with structure erected</div>
          </div>
        </div>

        <div className="ax-card ax-kpi ax-col--3" role="button" tabIndex={0} onClick={() => handleOpenStatusDrill('structure_pending', 'Structure Pending Sites')} style={{ cursor: 'pointer' }}>
          <div className="ax-card__body">
            <div className="ax-kpi__top">
              <span className="ax-badge ax-badge--soft ax-badge--warning">Structure Pending</span>
            </div>
            <div className="ax-kpi__label">Structure Pending</div>
            <div className="ax-kpi__value ax-num">{ula.structure_pending}</div>
            <div className="ax-kpi__caption">Pending structure installation</div>
          </div>
        </div>

        <div className="ax-card ax-kpi ax-col--3" role="button" tabIndex={0} onClick={() => handleOpenStatusDrill('structure_verify_pending', 'Structure Verification Pending')} style={{ cursor: 'pointer' }}>
          <div className="ax-card__body">
            <div className="ax-kpi__top">
              <span className="ax-badge ax-badge--soft ax-badge--info">Verify Pending</span>
            </div>
            <div className="ax-kpi__label">Structure Verify Pending</div>
            <div className="ax-kpi__value ax-num">{ula.structure_verify_pending}</div>
            <div className="ax-kpi__caption">Awaiting verification inspection</div>
          </div>
        </div>

        <div className="ax-card ax-kpi ax-col--3" role="button" tabIndex={0} onClick={() => handleOpenStatusDrill('structure_verify_reject', 'Structure Rejected Sites')} style={{ cursor: 'pointer' }}>
          <div className="ax-card__body">
            <div className="ax-kpi__top">
              <span className="ax-badge ax-badge--soft ax-badge--danger">Verify Rejected</span>
            </div>
            <div className="ax-kpi__label">Structure Verify Rejected</div>
            <div className="ax-kpi__value ax-num">{ula.structure_verify_reject}</div>
            <div className="ax-kpi__caption">Rejected upon inspection</div>
          </div>
        </div>

        {/* ── KPI SECTION 2: Complete Installation & Verification ── */}
        <div className="ax-col--12">
          <h4 style={{ margin: 'var(--ax-space-2) 0 var(--ax-space-1) 0', fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Phase 2: Electrical Installation & Document Metrics
          </h4>
        </div>

        <div className="ax-card ax-kpi ax-col--3" role="button" tabIndex={0} onClick={() => handleOpenStatusDrill('complete', 'Installation Completed Sites')} style={{ cursor: 'pointer' }}>
          <div className="ax-card__body">
            <div className="ax-kpi__top">
              <span className="ax-badge ax-badge--soft ax-badge--success">Electric Complete</span>
              <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>{instCompletePct}%</span>
            </div>
            <div className="ax-kpi__label">Installation Complete</div>
            <div className="ax-kpi__value ax-num">{ula.complete}</div>
            <div className="ax-kpi__caption">Panels, Inverter & Wiring done</div>
          </div>
        </div>

        <div className="ax-card ax-kpi ax-col--3" role="button" tabIndex={0} onClick={() => handleOpenStatusDrill('pending', 'Installation Pending Sites')} style={{ cursor: 'pointer' }}>
          <div className="ax-card__body">
            <div className="ax-kpi__top">
              <span className="ax-badge ax-badge--soft ax-badge--warning">Electric Pending</span>
            </div>
            <div className="ax-kpi__label">Installation Pending</div>
            <div className="ax-kpi__value ax-num">{ula.pending}</div>
            <div className="ax-kpi__caption">Pending electrical completion</div>
          </div>
        </div>

        <div className="ax-card ax-kpi ax-col--3" role="button" tabIndex={0} onClick={() => handleOpenStatusDrill('verify_approved', 'Installation Approved Sites')} style={{ cursor: 'pointer' }}>
          <div className="ax-card__body">
            <div className="ax-kpi__top">
              <span className="ax-badge ax-badge--soft ax-badge--success">Approved</span>
            </div>
            <div className="ax-kpi__label">Installation Approved</div>
            <div className="ax-kpi__value ax-num">{ula.verify_approved}</div>
            <div className="ax-kpi__caption">Officially verified by inspector</div>
          </div>
        </div>

        <div className="ax-card ax-kpi ax-col--3" role="button" tabIndex={0} onClick={() => handleOpenStatusDrill('verify_reject', 'Installation Rejected Sites')} style={{ cursor: 'pointer' }}>
          <div className="ax-card__body">
            <div className="ax-kpi__top">
              <span className="ax-badge ax-badge--soft ax-badge--danger">Rejected</span>
            </div>
            <div className="ax-kpi__label">Installation Rejected</div>
            <div className="ax-kpi__value ax-num">{ula.verify_reject}</div>
            <div className="ax-kpi__caption">Rejected inspection items</div>
          </div>
        </div>

        {/* ── KPI SECTION 3: Claims & Payment Cards ── */}
        <div className="ax-col--12">
          <h4 style={{ margin: 'var(--ax-space-2) 0 var(--ax-space-1) 0', fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Claims & Payment Status
          </h4>
        </div>

        <div className="ax-card ax-kpi ax-col--3">
          <div className="ax-card__body">
            <div className="ax-kpi__top">
              <span className="ax-badge ax-badge--soft ax-badge--info">50% Advance Claim</span>
            </div>
            <div className="ax-kpi__label">50% Claim Raised / App.</div>
            <div className="ax-kpi__value ax-num">
              {ula.claim50_raised}{' '}
              <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>/ {ula.claim50_applicable}</span>
            </div>
            <div className="ax-kpi__caption">Claims raised vs eligible sites</div>
          </div>
        </div>

        <div className="ax-card ax-kpi ax-col--3">
          <div className="ax-card__body">
            <div className="ax-kpi__top">
              <span className="ax-badge ax-badge--soft ax-badge--success">50% Paid</span>
            </div>
            <div className="ax-kpi__label">50% Payment Paid / Pend.</div>
            <div className="ax-kpi__value ax-num">
              {ula.inst_pay50_paid}{' '}
              <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>/ {ula.inst_pay50_pending}</span>
            </div>
            <div className="ax-kpi__caption">Disbursed vs pending disbursement</div>
          </div>
        </div>

        <div className="ax-card ax-kpi ax-col--3">
          <div className="ax-card__body">
            <div className="ax-kpi__top">
              <span className="ax-badge ax-badge--soft ax-badge--info">30% Final Claim</span>
            </div>
            <div className="ax-kpi__label">30% Claim Applicable</div>
            <div className="ax-kpi__value ax-num">{ula.claim30_applicable}</div>
            <div className="ax-kpi__caption">Sites ready for final 30% claim</div>
          </div>
        </div>

        <div className="ax-card ax-kpi ax-col--3">
          <div className="ax-card__body">
            <div className="ax-kpi__top">
              <span className="ax-badge ax-badge--soft ax-badge--neutral">Documents</span>
            </div>
            <div className="ax-kpi__label">Doc Complete / Pending</div>
            <div className="ax-kpi__value ax-num">
              {ula.inst_doc_complete}{' '}
              <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>/ {ula.inst_doc_pending}</span>
            </div>
            <div className="ax-kpi__caption">Commissioning document upload</div>
          </div>
        </div>

        {/* ── Monthly Progress Chart & Today's Activity ── */}
        <div className="ax-card ax-col--8">
          <div className="ax-card__header">
            <h3 className="ax-card__title">Monthly Installation Trend</h3>
          </div>
          <div className="ax-card__body" style={{ minHeight: 290 }}>
            {monthlyInstallations.length > 0 ? (
              <ApexChart options={monthlyChartOptions} series={monthlyChartSeries} type="area" height={280} />
            ) : (
              <TableEmptyState title="No installation trends available" message="Monthly trend data will display as installations are completed." />
            )}
          </div>
        </div>

        <div className="ax-card ax-col--4">
          <div className="ax-card__header">
            <h3 className="ax-card__title">Today's Installation Activity</h3>
          </div>
          <div className="ax-card__body" style={{ maxHeight: 310, overflowY: 'auto' }}>
            {todayInstallations.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-3)' }}>
                {todayInstallations.map((t, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 'var(--ax-space-2)', borderBottom: '1px solid var(--ax-border-subtle)' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 'var(--ax-text-sm)' }}>{t.name || `Vendor #${t.inst_vendor}`}</div>
                      <div style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>Installation Vendor</div>
                    </div>
                    <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill">
                      +{t.today_install} Sites Today
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 'var(--ax-space-6) 0', color: 'var(--ax-text-muted)' }}>
                <p style={{ margin: 0, fontSize: 'var(--ax-text-sm)' }}>No installations reported today yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* ── DISTRICT-WISE INSTALLATION BREAKDOWN TABLE ── */}
        <section className="ax-card ax-col--12" aria-labelledby="district-table-title">
          <div className="ax-card__header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: 'var(--ax-space-2)' }}>
              <div>
                <h3 id="district-table-title" className="ax-card__title">District-wise Installation Breakdown</h3>
                <p className="ax-card__subtitle">Complete district progress across structure erection, electrical install, and approvals</p>
              </div>
              <TableExportToolbar
                onExportCSV={() => exportDataToCSV(filteredDistricts, districtExportCols, 'bihar_ula_districtwise.csv')}
                onExportExcel={() => exportDataToExcel(filteredDistricts, districtExportCols, 'bihar_ula_districtwise.xlsx')}
                onPrint={() => printTableData(filteredDistricts, districtExportCols, 'Bihar ULA Installation Districtwise Breakdown')}
                onCopy={() => copyTableDataToClipboard(filteredDistricts, districtExportCols)}
              />
            </div>
          </div>

          <div className="ax-card__body">
            <div style={{ marginBottom: 'var(--ax-space-3)', maxWidth: 300 }}>
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search district name..."
              />
            </div>

            <div className="ax-table-wrap">
              <table className="ax-table ax-table--hover">
                <thead>
                  <tr>
                    <th>District</th>
                    <th style={{ textAlign: 'right' }}>Total Sites</th>
                    <th style={{ textAlign: 'right' }}>Structure Done</th>
                    <th style={{ textAlign: 'right' }}>Electric Done</th>
                    <th style={{ textAlign: 'right' }}>Electric Pending</th>
                    <th style={{ textAlign: 'right' }}>Approved</th>
                    <th style={{ textAlign: 'right' }}>Verify Pending</th>
                    <th style={{ textAlign: 'right' }}>Verify Rejected</th>
                    <th style={{ textAlign: 'right' }}>Doc Complete</th>
                    <th style={{ textAlign: 'right' }}>Doc Pending</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={10} style={{ textAlign: 'center', padding: 'var(--ax-space-6)' }}>
                        <span className="ax-spinner" /> Loading district records...
                      </td>
                    </tr>
                  ) : paginatedDistricts.length === 0 ? (
                    <tr>
                      <td colSpan={10}>
                        <TableEmptyState title="No district records found" message="Try adjusting your district filter or search query." />
                      </td>
                    </tr>
                  ) : (
                    paginatedDistricts.map((d, index) => (
                      <tr key={d.district || index}>
                        <td style={{ fontWeight: 600 }}>{d.district}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{d.site_count}</td>
                        <td style={{ textAlign: 'right' }}>
                          <span className="ax-badge ax-badge--soft ax-badge--info">
                            {d.structure_complete ?? 0}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span className="ax-badge ax-badge--soft ax-badge--success">
                            {d.complete ?? d.inst_complete ?? 0}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span className="ax-badge ax-badge--soft ax-badge--warning">
                            {d.pending ?? 0}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span className="ax-badge ax-badge--soft ax-badge--success">
                            {d.verify_approved ?? 0}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span className="ax-badge ax-badge--soft ax-badge--warning">
                            {d.verify_pending ?? 0}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span className="ax-badge ax-badge--soft ax-badge--danger">
                            {d.verify_reject ?? 0}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>{d.doc_complete ?? 0}</td>
                        <td style={{ textAlign: 'right' }}>{d.doc_pending ?? 0}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 'var(--ax-space-3)' }}>
              <Pagination
                currentPage={currentPage}
                totalCount={filteredDistricts.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
              />
            </div>
          </div>
        </section>
      </div>

      {/* Status Drill-Down Modal */}
      {statusModalOpen && (
        <div className="ax-modal-backdrop" onClick={() => setStatusModalOpen(false)}>
          <div className="ax-modal" style={{ maxWidth: 850 }} onClick={(e) => e.stopPropagation()}>
            <div className="ax-modal__header">
              <h4 className="ax-modal__title">{statusModalTitle}</h4>
              <button
                type="button"
                className="ax-btn ax-btn--ghost ax-btn--icon"
                onClick={() => setStatusModalOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="ax-modal__body" style={{ maxHeight: 450, overflowY: 'auto' }}>
              {statusModalLoading ? (
                <div style={{ textAlign: 'center', padding: 'var(--ax-space-6)' }}>
                  <span className="ax-spinner" /> Fetching sites...
                </div>
              ) : statusModalSites.length === 0 ? (
                <TableEmptyState title="No sites found" message="No sites currently match this status filter." />
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
                        <th>Contact</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statusModalSites.map((s, idx) => (
                        <tr key={s.id || idx}>
                          <td>{idx + 1}</td>
                          <td style={{ fontWeight: 600 }}>{s.beneficiary_name || '—'}</td>
                          <td>{s.district || '—'}</td>
                          <td>{s.block || '—'}</td>
                          <td>{s.village || '—'}</td>
                          <td>{s.ca_no || '—'}</td>
                          <td>{s.contact_no || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="ax-modal__footer">
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--sm"
                onClick={() => setStatusModalOpen(false)}
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

export default Bihar_Installation_ULA_Dashboard;
