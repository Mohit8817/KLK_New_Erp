import { useState, useMemo, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { ApexChart } from '../../../../charts/ApexChart';
import {
  ASSAM_DASHBOARD_DATA,
  type DistrictWiseItem,
  type AssamDashboardData,
} from '../../../../../data/demo/assamSwpData';
import { ASSAM_SWP_DASHBOARD_URL } from '../../../V_Portal_APIS/Assam_API';
import { authService } from '../../../../../services/authService';

const cv = (n: string) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

// Inline SVG Icons matching Tabler design language
const ICON_CAL = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12" /><path d="M16 3v4" /><path d="M8 3v4" /><path d="M4 11h16" /><path d="M11 15h1" /><path d="M12 15v3" /></svg>
);
const ICON_CHEV = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6l6 -6" /></svg>
);
const ICON_REFRESH = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" /><path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" /></svg>
);
const ICON_PLUS = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5l0 14" /><path d="M5 12l14 0" /></svg>
);
const ICON_DOWNLOAD = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /><path d="M7 11l5 5l5 -5" /><path d="M12 4l0 12" /></svg>
);
const ICON_FILTER = (
  <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 4h16v2.172a2 2 0 0 1 -.586 1.414l-4.828 4.828v7.586l-4 -2v-5.586l-4.828 -4.828a2 2 0 0 1 -.586 -1.414v-2.172z" /></svg>
);
const ARROW_UP = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 15l6 -6l6 6" /></svg>
);

const ICON_SUN = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14.828 14.828a4 4 0 1 0 -5.656 -5.656a4 4 0 0 0 5.656 5.656z"/><path d="M6.343 17.657l-1.414 1.414"/><path d="M6.343 6.343l-1.414 -1.414"/><path d="M17.657 6.343l1.414 -1.414"/><path d="M17.657 17.657l1.414 1.414"/><path d="M4 12h-2"/><path d="M12 4v-2"/><path d="M20 12h2"/><path d="M12 20v2"/></svg>
);
const ICON_WRENCH = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 10h3v-3l-3.5 -3.5a6 6 0 0 1 8 8l6 6a2 2 0 0 1 -3 3l-6 -6a6 6 0 0 1 -8 -8l3.5 3.5z" /></svg>
);
const ICON_CLOCK = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M12 7v5l3 3" /></svg>
);
const ICON_CHECK_SHIELD = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3a12 12 0 0 0 8.5 3a12 12 0 0 1 -8.5 15a12 12 0 0 1 -8.5 -15a12 12 0 0 0 8.5 -3" /><path d="M9 12l2 2l4 -4" /></svg>
);
const ICON_FILE_SEARCH = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M12 21h-5a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v4.5" /><path d="M16.5 17.5m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0 -5 0" /><path d="M18.5 19.5l2.5 2.5" /></svg>
);
const ICON_DOC = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" /><path d="M9 9l1 0" /><path d="M9 13l6 0" /><path d="M9 17l6 0" /></svg>
);
const ICON_CURRENCY = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 5h18" /><path d="M3 10h18" /><path d="M3 15h18" /><path d="M3 20h18" /><path d="M12 5v15" /></svg>
);
const ICON_CREDIT = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 5m0 3a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3z" /><path d="M3 10l18 0" /><path d="M7 15l.01 0" /><path d="M11 15l2 0" /></svg>
);

export function AssamDashboard() {
  const [data, setData] = useState<AssamDashboardData>(ASSAM_DASHBOARD_DATA);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const loadDashboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    }
    try {
      const token = authService.getToken();
      const headers: Record<string, string> = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(ASSAM_SWP_DASHBOARD_URL, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard data (${response.status})`);
      }

      const json = await response.json();
      const raw = json?.data || json;

      if (raw) {
        setData({
          swp: {
            site_count: Number(raw.swp?.site_count ?? ASSAM_DASHBOARD_DATA.swp.site_count),
            complete: Number(raw.swp?.complete ?? ASSAM_DASHBOARD_DATA.swp.complete),
            pending: Number(raw.swp?.pending ?? ASSAM_DASHBOARD_DATA.swp.pending),
            verify_pending: Number(raw.swp?.verify_pending ?? ASSAM_DASHBOARD_DATA.swp.verify_pending),
            verify_approved: Number(raw.swp?.verify_approved ?? ASSAM_DASHBOARD_DATA.swp.verify_approved),
            verify_reject: Number(raw.swp?.verify_reject ?? ASSAM_DASHBOARD_DATA.swp.verify_reject),
            doc_approved: Number(raw.swp?.doc_approved ?? ASSAM_DASHBOARD_DATA.swp.doc_approved),
            doc_pending: Number(raw.swp?.doc_pending ?? ASSAM_DASHBOARD_DATA.swp.doc_pending),
            doc_reject: Number(raw.swp?.doc_reject ?? ASSAM_DASHBOARD_DATA.swp.doc_reject),
            inst_claim_raised: Number(raw.swp?.inst_claim_raised ?? ASSAM_DASHBOARD_DATA.swp.inst_claim_raised),
            inst_claim_approved: Number(raw.swp?.inst_claim_approved ?? ASSAM_DASHBOARD_DATA.swp.inst_claim_approved),
            inst_claim_reject: Number(raw.swp?.inst_claim_reject ?? ASSAM_DASHBOARD_DATA.swp.inst_claim_reject),
            inst_pay_complete: Number(raw.swp?.inst_pay_complete ?? ASSAM_DASHBOARD_DATA.swp.inst_pay_complete),
            inst_pay_partially: Number(raw.swp?.inst_pay_partially ?? ASSAM_DASHBOARD_DATA.swp.inst_pay_partially),
            inst_pay_pending: Number(raw.swp?.inst_pay_pending ?? ASSAM_DASHBOARD_DATA.swp.inst_pay_pending),
          },
          district_install: Array.isArray(raw.district_install)
            ? raw.district_install
            : (ASSAM_DASHBOARD_DATA.district_install || []),
          districtwise: Array.isArray(raw.districtwise)
            ? raw.districtwise.map((d: any) => ({
                district: d.district || 'Unknown',
                site_count: Number(d.site_count || 0),
                complete: Number(d.complete || 0),
                pending: Number(d.pending || 0),
                verify_pending: Number(d.verify_pending || 0),
                verify_approved: Number(d.verify_approved || 0),
                verify_reject: Number(d.verify_reject || 0),
                doc_approved: Number(d.doc_approved || 0),
                doc_pending: Number(d.doc_pending || 0),
                doc_reject: Number(d.doc_reject || 0),
                inst_claim_raised: Number(d.inst_claim_raised || 0),
                inst_claim_approved: Number(d.inst_claim_approved || 0),
                inst_claim_reject: Number(d.inst_claim_reject || 0),
                inst_pay_complete: Number(d.inst_pay_complete || 0),
                inst_pay_partially: Number(d.inst_pay_partially || 0),
                inst_pay_pending: Number(d.inst_pay_pending || 0),
              }))
            : (ASSAM_DASHBOARD_DATA.districtwise || []),
          monthly_installations: Array.isArray(raw.monthly_installations)
            ? raw.monthly_installations.map((m: any) => ({
                month_year: String(m.month_year || ''),
                monthly_installations: Number(m.monthly_installations || 0),
              }))
            : (ASSAM_DASHBOARD_DATA.monthly_installations || []),
        });
      }
    } catch (err: any) {
      console.warn('Dashboard fetch error:', err);
    } finally {
      if (isRefresh) {
        setTimeout(() => setIsRefreshing(false), 500);
      }
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Safe destructuring with robust defaults
  const swp = data?.swp || ASSAM_DASHBOARD_DATA.swp;
  const districtwise = Array.isArray(data?.districtwise) ? data.districtwise : (ASSAM_DASHBOARD_DATA.districtwise || []);
  const monthly_installations = Array.isArray(data?.monthly_installations) ? data.monthly_installations : (ASSAM_DASHBOARD_DATA.monthly_installations || []);

  // Filter & Search states
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filtered district-wise records
  const filteredDistricts = useMemo(() => {
    return (districtwise || []).filter((d) => {
      if (!d) return false;
      const districtName = d.district || '';
      const matchDistrict = selectedDistrict === 'All' || districtName.toLowerCase() === selectedDistrict.toLowerCase();
      const matchQuery = !searchQuery || districtName.toLowerCase().includes(searchQuery.toLowerCase());
      let matchStatus = true;
      if (selectedStatus === 'Complete') matchStatus = (d.complete || 0) > 0;
      else if (selectedStatus === 'Pending') matchStatus = (d.pending || 0) > 0;
      else if (selectedStatus === 'VerifyPending') matchStatus = (d.verify_pending || 0) > 0;
      else if (selectedStatus === 'DocPending') matchStatus = (d.doc_pending || 0) > 0;
      return matchDistrict && matchQuery && matchStatus;
    });
  }, [districtwise, selectedDistrict, searchQuery, selectedStatus]);

  // Aggregate stats based on current view/filter
  const totalStats = useMemo(() => {
    return filteredDistricts.reduce(
      (acc, d) => ({
        site_count: acc.site_count + (d.site_count || 0),
        complete: acc.complete + (d.complete || 0),
        pending: acc.pending + (d.pending || 0),
        verify_pending: acc.verify_pending + (d.verify_pending || 0),
        verify_approved: acc.verify_approved + (d.verify_approved || 0),
        verify_reject: acc.verify_reject + (d.verify_reject || 0),
        doc_approved: acc.doc_approved + (d.doc_approved || 0),
        doc_pending: acc.doc_pending + (d.doc_pending || 0),
        doc_reject: acc.doc_reject + (d.doc_reject || 0),
        inst_claim_raised: acc.inst_claim_raised + (d.inst_claim_raised || 0),
        inst_pay_complete: acc.inst_pay_complete + (d.inst_pay_complete || 0),
      }),
      {
        site_count: 0,
        complete: 0,
        pending: 0,
        verify_pending: 0,
        verify_approved: 0,
        verify_reject: 0,
        doc_approved: 0,
        doc_pending: 0,
        doc_reject: 0,
        inst_claim_raised: 0,
        inst_pay_complete: 0,
      }
    );
  }, [filteredDistricts]);

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      'District',
      'Total Sites',
      'Complete',
      'Pending',
      'Verification Pending',
      'Verification Approved',
      'Verification Rejected',
      'Document Approved',
      'Document Pending',
      'Document Rejected',
      'Installation Claims Raised',
      'Installation Claims Approved',
      'Payment Complete',
      'Payment Pending',
    ];
    const rows = filteredDistricts.map((d) => [
      `"${d.district}"`,
      d.site_count,
      d.complete,
      d.pending,
      d.verify_pending,
      d.verify_approved,
      d.verify_reject,
      d.doc_approved,
      d.doc_pending,
      d.doc_reject,
      d.inst_claim_raised,
      d.inst_claim_approved,
      d.inst_pay_complete,
      d.inst_pay_pending,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Assam_SWP_Dashboard_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalSites = Number(swp?.site_count || 0);
  const completeSites = Number(swp?.complete || 0);
  const pendingSites = Number(swp?.pending || 0);
  const completionPct = totalSites > 0 ? ((completeSites / totalSites) * 100).toFixed(1) : '0';
  const pendingPct = totalSites > 0 ? ((pendingSites / totalSites) * 100).toFixed(1) : '0';

  return (
    <div className="ax-page solar-erp-page">
      {/* 1. Page Header & Actions */}
      <PageHead
        title="Assam SWP Dashboard"
        subtitle="Assam State Operations · Solar Water Pump (SWP) & Solar Installation Scheme"
        breadcrumbs ={[
          { label: 'Assam' },
          { label: 'SWP' },
          { label: 'Dashboard' },
        ]}
        actions={
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill" style={{ fontWeight: 600, paddingInline: 'var(--ax-space-3)' }}>
              <span className="ax-badge__dot" /> State: Assam
            </span>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--pill" aria-label="Fiscal Year filter">
              {ICON_CAL}
              <span className="ax-btn__label">FY 2026–27</span>
              {ICON_CHEV}
            </button>
            <button
              type="button"
              className={`ax-btn ax-btn--ghost ax-btn--icon ${isRefreshing ? 'is-loading' : ''}`}
              aria-label="Refresh telemetry"
              onClick={() => loadDashboardData(true)}
              title="Refresh Data from API"
              disabled={isRefreshing}
            >
              <span style={{ display: 'inline-flex', animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }}>
                {ICON_REFRESH}
              </span>
            </button>
            <button type="button" className="ax-btn ax-btn--secondary" onClick={exportToCSV}>
              {ICON_DOWNLOAD}
              <span className="ax-btn__label">Export Report</span>
            </button>
            <Link to="/assam/swp/installation-request" className="ax-btn ax-btn--secondary" title="View Installation Requests">
              <span className="ax-btn__label">Installation Requests</span>
            </Link>
            <Link to="/assam/swp/installation-site" className="ax-btn ax-btn--primary">
              {ICON_PLUS}
              <span className="ax-btn__label">Add SWP Installation</span>
            </Link>
          </div>
        }
      />

      <div className="ax-dash-grid mt-0 pt-0">
        {/* 2. Operations Filter Bar */}
        <section
          className="ax-card ax-card--flat ax-col--12"
          role="region"
          aria-label="Assam Dashboard Filters"
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--ax-radius-lg)',
            border: '1px solid var(--ax-border-subtle)',
            background: 'var(--ax-bg-surface)',
          }}
        >
          <div className="ax-cluster" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--ax-space-3)', alignItems: 'center' }}>
            <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
              <span
                className="ax-cluster"
                style={{
                  gap: '6px',
                  color: 'var(--ax-text-strong)',
                  fontSize: 'var(--ax-text-xs)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  padding: '4px 10px',
                  background: 'rgba(var(--ax-accent-rgb), 0.08)',
                  borderRadius: 'var(--ax-radius-pill)',
                  border: '1px solid rgba(var(--ax-accent-rgb), 0.18)',
                }}
              >
                {ICON_FILTER} Filter Operations
              </span>

              {/* State Filter (locked to Assam) */}
              <div className="ax-cluster" style={{ gap: '6px', alignItems: 'center' }}>
                <label htmlFor="state-select" style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)', fontWeight: 500 }}>State:</label>
                <select id="state-select" className="ax-input ax-input--sm" style={{ width: 130, height: 30, fontSize: 'var(--ax-text-xs)', fontWeight: 600, paddingInline: '8px' }} defaultValue="Assam" disabled>
                  <option value="Assam">Assam (Active)</option>
                </select>
              </div>

              {/* District Filter */}
              <div className="ax-cluster" style={{ gap: '6px', alignItems: 'center' }}>
                <label htmlFor="district-select" style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)', fontWeight: 500 }}>District:</label>
                <select
                  id="district-select"
                  className="ax-input ax-input--sm"
                  style={{ width: 160, height: 30, fontSize: 'var(--ax-text-xs)', paddingInline: '8px' }}
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                >
                  <option value="All">All Districts ({districtwise.length})</option>
                  {(districtwise || []).map((d) => (
                    <option key={d.district} value={d.district}>{d.district}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="ax-cluster" style={{ gap: '6px', alignItems: 'center' }}>
                <label htmlFor="status-select" style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)', fontWeight: 500 }}>Status:</label>
                <select
                  id="status-select"
                  className="ax-input ax-input--sm"
                  style={{ width: 150, height: 30, fontSize: 'var(--ax-text-xs)', paddingInline: '8px' }}
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="All">All Statuses</option>
                  <option value="Complete">Installed Complete</option>
                  <option value="Pending">Installation Pending</option>
                  <option value="VerifyPending">Verification Pending</option>
                  <option value="DocPending">Document Pending</option>
                </select>
              </div>

              {/* Reset button */}
              {(selectedDistrict !== 'All' || selectedStatus !== 'All' || searchQuery !== '') && (
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--sm"
                  style={{ height: 28, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }}
                  onClick={() => { setSelectedDistrict('All'); setSelectedStatus('All'); setSearchQuery(''); }}
                >
                  Reset Filters
                </button>
              )}
            </div>

            <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>
                Scheme: <b style={{ color: 'var(--ax-text-strong)' }}>SWP Solar</b> · Discom: <b style={{ color: 'var(--ax-text-strong)' }}>APDCL</b>
              </span>
              <span className="ax-badge ax-badge--soft ax-badge--info ax-badge--pill" style={{ fontSize: '11px', padding: '2px 8px' }}>
                MNRE SWP Phase-I
              </span>
            </div>
          </div>
        </section>

        {/* 3. Executive Welcome Banner */}
        <section className="ax-card ax-welcome ax-col--12" role="region" aria-label="Assam SWP Overview">
          <div className="ax-welcome__body">
            <div className="ax-welcome__text">
              <p className="ax-welcome__eyebrow">Solar Water Pump (SWP) Management · Assam State Hub</p>
              <h2 className="ax-welcome__title">Welcome to Assam SWP Dashboard</h2>
              <p className="ax-welcome__lede">
                Assam state operational overview: <b>{swp.site_count} Total Allocated Sites</b> validated across <b>{districtwise.length} Districts</b>.
                <b> {swp.complete} Sites ({completionPct}%)</b> installation completed on-site with <b>{swp.pending} Pending</b> sites, <b>{swp.verify_pending} Verification Pending</b>, and <b>{swp.doc_pending} Document Pending</b>.
              </p>
            </div>

            <dl className="ax-welcome__stats">
              <div className="ax-welcome__stat">
                <dt>Total Sites</dt>
                <dd className="ax-num">{swp.site_count}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-emerald)' }}>Allocated: {swp.site_count}</small>
              </div>
              <div className="ax-welcome__stat">
                <dt>Completed</dt>
                <dd className="ax-num">{swp.complete}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-accent)' }}>{completionPct}% Complete</small>
              </div>
              <div className="ax-welcome__stat">
                <dt>Pending</dt>
                <dd className="ax-num">{swp.pending}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-amber)' }}>{pendingPct}% In Progress</small>
              </div>
              <div className="ax-welcome__stat">
                <dt>Verify Pending</dt>
                <dd className="ax-num">{swp.verify_pending}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-cyan)' }}>Doc Pending: {swp.doc_pending}</small>
              </div>
            </dl>
          </div>
        </section>

        {/* 4. Top KPI Cards Row (8 Metric Cards matching design template) */}
        {/* KPI 1: Total Allocated Sites */}
        <div className="ax-card ax-col--3" role="region" aria-label="Total Allocated Sites" style={{ borderRadius: 'var(--ax-radius-lg)', background: 'var(--ax-bg-surface)' }}>
          <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <span style={{ width: 28, height: 28, borderRadius: 'var(--ax-radius-md)', background: 'rgba(var(--ax-accent-rgb), 0.12)', color: 'var(--ax-accent)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ width: 16, height: 16, display: 'inline-flex' }}>{ICON_SUN}</span>
                </span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ax-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Total Allocated Sites
                </span>
              </div>
              <span className="ax-badge ax-badge--soft ax-badge--info ax-badge--pill" style={{ fontSize: '11px', padding: '1px 6px', flexShrink: 0 }}>
                {districtwise.length} Districts
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px' }}>
              <div>
                <div style={{ fontFamily: 'var(--ax-font-display)', fontSize: '1.35rem', fontWeight: 700, lineHeight: 1.1, color: 'var(--ax-text-strong)', fontVariantNumeric: 'tabular-nums' }}>
                  {swp.site_count} <small style={{ fontSize: '11px', fontWeight: 500, color: 'var(--ax-text-muted)' }}>Sites</small>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ax-text-muted)', marginTop: '2px', fontWeight: 500 }}>
                  100% Survey Completed
                </div>
              </div>
              <div style={{ width: 68, height: 26, overflow: 'hidden', flexShrink: 0 }}>
                <ApexChart type="line" sparkline tooltip={false} height={26} color="--ax-accent" series={[{ name: 'Sites', data: [10, 14, 16, 18] }]} style={{ minHeight: 26, width: 68 }} />
              </div>
            </div>
          </div>
        </div>

        {/* KPI 2: Installation Complete */}
        <div className="ax-card ax-col--3" role="region" aria-label="Installation Complete" style={{ borderRadius: 'var(--ax-radius-lg)', background: 'var(--ax-bg-surface)' }}>
          <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <span style={{ width: 28, height: 28, borderRadius: 'var(--ax-radius-md)', background: 'color-mix(in oklab, var(--ax-viz-emerald) 14%, transparent)', color: 'var(--ax-viz-emerald)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ width: 16, height: 16, display: 'inline-flex' }}>{ICON_WRENCH}</span>
                </span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ax-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Installation Completed
                </span>
              </div>
              <span className="ax-kpi__delta ax-kpi__delta--up" style={{ fontSize: '11px', padding: '1px 6px', flexShrink: 0 }}>
                {ARROW_UP} {completionPct}%
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px' }}>
              <div>
                <div style={{ fontFamily: 'var(--ax-font-display)', fontSize: '1.35rem', fontWeight: 700, lineHeight: 1.1, color: 'var(--ax-text-strong)', fontVariantNumeric: 'tabular-nums' }}>
                  {swp.complete} <small style={{ fontSize: '11px', fontWeight: 500, color: 'var(--ax-text-muted)' }}>Done</small>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ax-text-muted)', marginTop: '2px', fontWeight: 500 }}>
                  {swp.complete} of {swp.site_count} Sites Active
                </div>
              </div>
              <div style={{ width: 68, height: 26, overflow: 'hidden', flexShrink: 0 }}>
                <ApexChart type="line" sparkline tooltip={false} height={26} color="--ax-viz-emerald" series={[{ name: 'Complete', data: [4, 7, 9, 12] }]} style={{ minHeight: 26, width: 68 }} />
              </div>
            </div>
          </div>
        </div>

        {/* KPI 3: Installation Pending */}
        <div className="ax-card ax-col--3" role="region" aria-label="Installation Pending" style={{ borderRadius: 'var(--ax-radius-lg)', background: 'var(--ax-bg-surface)' }}>
          <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <span style={{ width: 28, height: 28, borderRadius: 'var(--ax-radius-md)', background: 'color-mix(in oklab, var(--ax-viz-amber) 14%, transparent)', color: 'var(--ax-viz-amber)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ width: 16, height: 16, display: 'inline-flex' }}>{ICON_CLOCK}</span>
                </span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ax-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Installation Pending
                </span>
              </div>
              <span className="ax-badge ax-badge--soft ax-badge--warning ax-badge--pill" style={{ fontSize: '11px', padding: '1px 6px', flexShrink: 0 }}>
                {pendingPct}%
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px' }}>
              <div>
                <div style={{ fontFamily: 'var(--ax-font-display)', fontSize: '1.35rem', fontWeight: 700, lineHeight: 1.1, color: 'var(--ax-text-strong)', fontVariantNumeric: 'tabular-nums' }}>
                  {swp.pending} <small style={{ fontSize: '11px', fontWeight: 500, color: 'var(--ax-text-muted)' }}>Pending</small>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ax-text-muted)', marginTop: '2px', fontWeight: 500 }}>
                  Work In Progress
                </div>
              </div>
              <div style={{ width: 68, height: 26, overflow: 'hidden', flexShrink: 0 }}>
                <ApexChart type="line" sparkline tooltip={false} height={26} color="--ax-viz-amber" series={[{ name: 'Pending', data: [14, 11, 9, 6] }]} style={{ minHeight: 26, width: 68 }} />
              </div>
            </div>
          </div>
        </div>

        {/* KPI 4: Verification Pending */}
        <div className="ax-card ax-col--3" role="region" aria-label="Verification Pending" style={{ borderRadius: 'var(--ax-radius-lg)', background: 'var(--ax-bg-surface)' }}>
          <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <span style={{ width: 28, height: 28, borderRadius: 'var(--ax-radius-md)', background: 'color-mix(in oklab, var(--ax-viz-cyan) 14%, transparent)', color: 'var(--ax-viz-cyan)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ width: 16, height: 16, display: 'inline-flex' }}>{ICON_FILE_SEARCH}</span>
                </span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ax-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Verification Pending
                </span>
              </div>
              <span className="ax-badge ax-badge--soft ax-badge--info ax-badge--pill" style={{ fontSize: '11px', padding: '1px 6px', flexShrink: 0 }}>
                Inspection
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px' }}>
              <div>
                <div style={{ fontFamily: 'var(--ax-font-display)', fontSize: '1.35rem', fontWeight: 700, lineHeight: 1.1, color: 'var(--ax-text-strong)', fontVariantNumeric: 'tabular-nums' }}>
                  {swp.verify_pending} <small style={{ fontSize: '11px', fontWeight: 500, color: 'var(--ax-text-muted)' }}>Sites</small>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ax-text-muted)', marginTop: '2px', fontWeight: 500 }}>
                  {swp.verify_approved} Approved · {swp.verify_reject} Rejected
                </div>
              </div>
              <div style={{ width: 68, height: 26, overflow: 'hidden', flexShrink: 0 }}>
                <ApexChart type="line" sparkline tooltip={false} height={26} color="--ax-viz-cyan" series={[{ name: 'Verify', data: [5, 8, 10, 12] }]} style={{ minHeight: 26, width: 68 }} />
              </div>
            </div>
          </div>
        </div>

        {/* Secondary KPI Rail */}
        {/* KPI 5: Verification Approval Status */}
        <div className="ax-card ax-col--3" role="region" aria-label="Verification Status" style={{ borderRadius: 'var(--ax-radius-lg)', background: 'var(--ax-bg-surface)' }}>
          <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <span style={{ width: 28, height: 28, borderRadius: 'var(--ax-radius-md)', background: 'color-mix(in oklab, var(--ax-viz-emerald) 14%, transparent)', color: 'var(--ax-viz-emerald)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ width: 16, height: 16, display: 'inline-flex' }}>{ICON_CHECK_SHIELD}</span>
                </span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ax-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Verification Approved
                </span>
              </div>
              <span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--pill" style={{ fontSize: '11px', padding: '1px 6px', flexShrink: 0 }}>
                Audit Pass
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px' }}>
              <div>
                <div style={{ fontFamily: 'var(--ax-font-display)', fontSize: '1.35rem', fontWeight: 700, lineHeight: 1.1, color: 'var(--ax-text-strong)', fontVariantNumeric: 'tabular-nums' }}>
                  {swp.verify_approved} <small style={{ fontSize: '11px', fontWeight: 500, color: 'var(--ax-text-muted)' }}>Approved</small>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ax-text-muted)', marginTop: '2px', fontWeight: 500 }}>
                  0 Rejected (0.0%)
                </div>
              </div>
              <div style={{ width: 68, height: 26, overflow: 'hidden', flexShrink: 0 }}>
                <ApexChart type="line" sparkline tooltip={false} height={26} color="--ax-viz-emerald" series={[{ name: 'Approved', data: [0, 0, 0, 0] }]} style={{ minHeight: 26, width: 68 }} />
              </div>
            </div>
          </div>
        </div>

        {/* KPI 6: Document Pending */}
        <div className="ax-card ax-col--3" role="region" aria-label="Document Status" style={{ borderRadius: 'var(--ax-radius-lg)', background: 'var(--ax-bg-surface)' }}>
          <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <span style={{ width: 28, height: 28, borderRadius: 'var(--ax-radius-md)', background: 'color-mix(in oklab, var(--ax-viz-violet) 14%, transparent)', color: 'var(--ax-viz-violet)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ width: 16, height: 16, display: 'inline-flex' }}>{ICON_DOC}</span>
                </span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ax-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Document Pending
                </span>
              </div>
              <span className="ax-badge ax-badge--soft ax-badge--warning ax-badge--pill" style={{ fontSize: '11px', padding: '1px 6px', flexShrink: 0 }}>
                {swp.doc_pending} Sites
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px' }}>
              <div>
                <div style={{ fontFamily: 'var(--ax-font-display)', fontSize: '1.35rem', fontWeight: 700, lineHeight: 1.1, color: 'var(--ax-text-strong)', fontVariantNumeric: 'tabular-nums' }}>
                  {swp.doc_pending} <small style={{ fontSize: '11px', fontWeight: 500, color: 'var(--ax-text-muted)' }}>Docs</small>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ax-text-muted)', marginTop: '2px', fontWeight: 500 }}>
                  {swp.doc_approved} Approved · {swp.doc_reject} Rejected
                </div>
              </div>
              <div style={{ width: 68, height: 26, overflow: 'hidden', flexShrink: 0 }}>
                <ApexChart type="line" sparkline tooltip={false} height={26} color="--ax-viz-violet" series={[{ name: 'Docs', data: [1, 2, 3, 4] }]} style={{ minHeight: 26, width: 68 }} />
              </div>
            </div>
          </div>
        </div>

        {/* KPI 7: Installation Claims */}
        <div className="ax-card ax-col--3" role="region" aria-label="Installation Claims" style={{ borderRadius: 'var(--ax-radius-lg)', background: 'var(--ax-bg-surface)' }}>
          <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <span style={{ width: 28, height: 28, borderRadius: 'var(--ax-radius-md)', background: 'rgba(var(--ax-accent-rgb), 0.12)', color: 'var(--ax-accent)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ width: 16, height: 16, display: 'inline-flex' }}>{ICON_CURRENCY}</span>
                </span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ax-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Installation Claims
                </span>
              </div>
              <span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--pill" style={{ fontSize: '11px', padding: '1px 6px', flexShrink: 0 }}>
                Discom
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px' }}>
              <div>
                <div style={{ fontFamily: 'var(--ax-font-display)', fontSize: '1.35rem', fontWeight: 700, lineHeight: 1.1, color: 'var(--ax-text-strong)', fontVariantNumeric: 'tabular-nums' }}>
                  {swp.inst_claim_raised} <small style={{ fontSize: '11px', fontWeight: 500, color: 'var(--ax-text-muted)' }}>Raised</small>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ax-text-muted)', marginTop: '2px', fontWeight: 500 }}>
                  {swp.inst_claim_approved} Approved · {swp.inst_claim_reject} Rejected
                </div>
              </div>
              <div style={{ width: 68, height: 26, overflow: 'hidden', flexShrink: 0 }}>
                <ApexChart type="line" sparkline tooltip={false} height={26} color="--ax-accent" series={[{ name: 'Claims', data: [0, 0, 0, 0] }]} style={{ minHeight: 26, width: 68 }} />
              </div>
            </div>
          </div>
        </div>

        {/* KPI 8: Installation Payment Status */}
        <div className="ax-card ax-col--3" role="region" aria-label="Installation Payment" style={{ borderRadius: 'var(--ax-radius-lg)', background: 'var(--ax-bg-surface)' }}>
          <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <span style={{ width: 28, height: 28, borderRadius: 'var(--ax-radius-md)', background: 'color-mix(in oklab, var(--ax-viz-pink) 14%, transparent)', color: 'var(--ax-viz-pink)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ width: 16, height: 16, display: 'inline-flex' }}>{ICON_CREDIT}</span>
                </span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ax-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Payment Disbursal
                </span>
              </div>
              <span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--pill" style={{ fontSize: '11px', padding: '1px 6px', flexShrink: 0 }}>
                Settlement
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px' }}>
              <div>
                <div style={{ fontFamily: 'var(--ax-font-display)', fontSize: '1.35rem', fontWeight: 700, lineHeight: 1.1, color: 'var(--ax-text-strong)', fontVariantNumeric: 'tabular-nums' }}>
                  ₹{swp.inst_pay_complete} <small style={{ fontSize: '11px', fontWeight: 500, color: 'var(--ax-text-muted)' }}>Complete</small>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ax-text-muted)', marginTop: '2px', fontWeight: 500 }}>
                  Partially: {swp.inst_pay_partially} · Pending: {swp.inst_pay_pending}
                </div>
              </div>
              <div style={{ width: 68, height: 26, overflow: 'hidden', flexShrink: 0 }}>
                <ApexChart type="line" sparkline tooltip={false} height={26} color="--ax-viz-pink" series={[{ name: 'Pay', data: [0, 0, 0, 0] }]} style={{ minHeight: 26, width: 68 }} />
              </div>
            </div>
          </div>
        </div>

        {/* 5. Charts Section (Matching Image 2) */}
        {/* CHART 1: Monthly Installation Throughput */}
        <section className="ax-card ax-card--chart ax-col--8" role="region" aria-label="Monthly Installation Velocity">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Execution Throughput</span>
              <h2 className="ax-card__title">Monthly Installation &amp; Deployment</h2>
              <p className="ax-card__subtitle">Solar Water Pump installations completed per month</p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)' }}>
                <span className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}>
                  <i style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--ax-accent)' }} />
                  <small style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-xs)' }}>Installations (Nos.)</small>
                </span>
              </div>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <ApexChart
              type="bar"
              height={300}
              legend="none"
              ariaLabel="Monthly SWP installation column chart"
              series={[
                {
                  name: 'Installations (Nos.)',
                  data: (monthly_installations || []).map((m) => Number(m?.monthly_installations || 0)),
                },
              ]}
              apex={{
                colors: [cv('--ax-accent')],
                plotOptions: {
                  bar: {
                    borderRadius: 6,
                    columnWidth: '40%',
                    distributed: true,
                  },
                },
                xaxis: {
                  categories: (monthly_installations || []).map((m) => {
                    if (!m?.month_year) return '-';
                    const parts = String(m.month_year).split('-');
                    if (parts.length >= 2) {
                      const year = parseInt(parts[0], 10);
                      const month = parseInt(parts[1], 10);
                      if (!isNaN(year) && !isNaN(month)) {
                        const date = new Date(year, month - 1, 1);
                        return date.toLocaleString('default', { month: 'short', year: 'numeric' });
                      }
                    }
                    return String(m.month_year);
                  }),
                },
                yaxis: {
                  title: { text: 'Installations (Nos.)', style: { color: 'var(--ax-text-muted)' } },
                },
              }}
            />
          </div>
        </section>

        {/* CHART 2: Site Status & Feasibility Donut */}
        <section className="ax-card ax-col--4" role="region" aria-label="Site Status Distribution">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Project Distribution</span>
              <h2 className="ax-card__title">Site Feasibility Status</h2>
              <p className="ax-card__subtitle">Total {swp?.site_count || 0} Allocated SWP Sites</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <ApexChart
              type="donut"
              height={220}
              legend="none"
              ariaLabel="Donut chart of SWP Site Status"
              series={[Number(swp?.complete || 0), Number(swp?.pending || 0)]}
              apex={{
                labels: ['Completed Sites', 'Pending Sites'],
                colors: [cv('--ax-viz-emerald'), cv('--ax-viz-amber')],
                stroke: { width: 0 },
                plotOptions: {
                  pie: {
                    donut: {
                      size: '72%',
                      labels: {
                        show: true,
                        name: { fontFamily: cv('--ax-font-sans') },
                        value: { fontFamily: cv('--ax-font-mono'), fontWeight: 600 },
                        total: { show: true, label: 'Total Sites', formatter: () => `${swp?.site_count || 0}` },
                      },
                    },
                  },
                },
              }}
            />
            <ul className="ax-list ax-list--compact" style={{ marginTop: 'var(--ax-space-3)' }}>
              <li className="ax-list__row" style={{ border: 0, paddingInline: 0 }}>
                <span className="ax-list__leading"><i style={{ width: 9, height: 9, borderRadius: 3, background: 'var(--ax-viz-emerald)', display: 'inline-block' }} /></span>
                <span className="ax-list__content">
                  <span className="ax-list__title" style={{ fontWeight: 'var(--ax-weight-medium)' }}>Completed Sites</span>
                  <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>Installation Done</span>
                </span>
                <span className="ax-list__trailing ax-num" style={{ color: 'var(--ax-text-strong)', fontWeight: 600 }}>{swp.complete} ({completionPct}%)</span>
              </li>
              <li className="ax-list__row" style={{ border: 0, paddingInline: 0 }}>
                <span className="ax-list__leading"><i style={{ width: 9, height: 9, borderRadius: 3, background: 'var(--ax-viz-amber)', display: 'inline-block' }} /></span>
                <span className="ax-list__content">
                  <span className="ax-list__title" style={{ fontWeight: 'var(--ax-weight-medium)' }}>Pending Sites</span>
                  <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>Work In Progress</span>
                </span>
                <span className="ax-list__trailing ax-num" style={{ color: 'var(--ax-text-strong)', fontWeight: 600 }}>{swp.pending} ({pendingPct}%)</span>
              </li>
            </ul>
          </div>
        </section>

        {/* 6. District-Wise Solar Statistics Chart & Stage Milestones */}
        {/* CHART 3: District-Wise Installation Comparison */}
        <section className="ax-card ax-card--chart ax-col--8" role="region" aria-label="District-wise SWP Project Statistics">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Geographic Breakdown</span>
              <h2 className="ax-card__title">District-wise SWP Project Statistics</h2>
              <p className="ax-card__subtitle">Allocated sites vs. completed installations across districts</p>
            </div>
            <div className="ax-card__actions">
              <span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--pill">{districtwise.length} Districts</span>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <ApexChart
              type="bar"
              height={300}
              legend="top"
              ariaLabel="Bar chart of installations by district"
              series={[
                { name: 'Allocated Sites', data: (districtwise || []).map((d) => Number(d?.site_count || 0)) },
                { name: 'Installed Complete', data: (districtwise || []).map((d) => Number(d?.complete || 0)) },
              ]}
              apex={{
                colors: [cv('--ax-accent'), cv('--ax-viz-emerald')],
                plotOptions: {
                  bar: {
                    horizontal: false,
                    borderRadius: 4,
                    columnWidth: '50%',
                  },
                },
                xaxis: {
                  categories: (districtwise || []).map((d) => d?.district || 'Unknown'),
                  labels: { style: { fontSize: '12px', fontWeight: 500 } },
                },
                yaxis: {
                  title: { text: 'Site Count', style: { color: 'var(--ax-text-muted)' } },
                },
              }}
            />
          </div>
        </section>

        {/* SECTION: Solar Installation & Execution Milestones */}
        <section className="ax-card ax-col--4" role="region" aria-label="Installation Progress & Pipeline">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Workflow Lifecycle</span>
              <h2 className="ax-card__title">Installation Milestones</h2>
              <p className="ax-card__subtitle">Progress across project execution stages</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0, display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-4)' }}>
            {/* Survey & Site Allocation */}
            <div>
              <div className="ax-cluster" style={{ justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-strong)', fontWeight: 500 }}>1. Total Sites Allocated</span>
                <b className="ax-num" style={{ color: 'var(--ax-viz-emerald)', fontSize: 'var(--ax-text-xs)' }}>{totalSites} / {totalSites} (100%)</b>
              </div>
              <div className="ax-progress ax-progress--sm"><div className="ax-progress__track"><div className="ax-progress__fill" style={{ width: '100%', background: 'var(--ax-viz-emerald)' }} /></div></div>
            </div>

            {/* Installation Completed */}
            <div>
              <div className="ax-cluster" style={{ justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-strong)', fontWeight: 500 }}>2. Installation Completed</span>
                <b className="ax-num" style={{ color: 'var(--ax-viz-cyan)', fontSize: 'var(--ax-text-xs)' }}>{completeSites} Sites ({completionPct}%)</b>
              </div>
              <div className="ax-progress ax-progress--sm"><div className="ax-progress__track"><div className="ax-progress__fill" style={{ width: `${completionPct}%`, background: 'var(--ax-viz-cyan)' }} /></div></div>
            </div>

            {/* Verification Pending */}
            <div>
              <div className="ax-cluster" style={{ justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-strong)', fontWeight: 500 }}>3. Physical Inspection &amp; Verification</span>
                <b className="ax-num" style={{ color: 'var(--ax-viz-amber)', fontSize: 'var(--ax-text-xs)' }}>{swp?.verify_pending ?? 0} Sites Pending ({totalSites > 0 ? (((swp?.verify_pending || 0) / totalSites) * 100).toFixed(1) : 0}%)</b>
              </div>
              <div className="ax-progress ax-progress--sm"><div className="ax-progress__track"><div className="ax-progress__fill" style={{ width: `${totalSites > 0 ? (((swp?.verify_pending || 0) / totalSites) * 100).toFixed(1) : 0}%`, background: 'var(--ax-viz-amber)' }} /></div></div>
            </div>

            {/* Document Submission */}
            <div>
              <div className="ax-cluster" style={{ justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-strong)', fontWeight: 500 }}>4. Documentation &amp; Uploads</span>
                <b className="ax-num" style={{ color: 'var(--ax-viz-violet)', fontSize: 'var(--ax-text-xs)' }}>{swp?.doc_pending ?? 0} Sites Pending ({totalSites > 0 ? (((swp?.doc_pending || 0) / totalSites) * 100).toFixed(1) : 0}%)</b>
              </div>
              <div className="ax-progress ax-progress--sm"><div className="ax-progress__track"><div className="ax-progress__fill" style={{ width: `${totalSites > 0 ? (((swp?.doc_pending || 0) / totalSites) * 100).toFixed(1) : 0}%`, background: 'var(--ax-viz-violet)' }} /></div></div>
            </div>

            {/* Claims & Disbursal */}
            <div>
              <div className="ax-cluster" style={{ justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-strong)', fontWeight: 500 }}>5. Claims &amp; Payment Disbursal</span>
                <b className="ax-num" style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-xs)' }}>{swp?.inst_claim_raised ?? 0} Claims Raised ({totalSites > 0 ? (((swp?.inst_claim_raised || 0) / totalSites) * 100).toFixed(1) : 0}%)</b>
              </div>
              <div className="ax-progress ax-progress--sm"><div className="ax-progress__track"><div className="ax-progress__fill" style={{ width: `${totalSites > 0 ? (((swp?.inst_claim_raised || 0) / totalSites) * 100).toFixed(1) : 0}%`, background: 'var(--ax-accent)' }} /></div></div>
            </div>
          </div>
        </section>

        {/* 7. Detailed District-Wise Data Table (Matching Image 1 & 3) */}
        <section className="ax-card ax-col--12" role="region" aria-label="District-wise SWP Installation Breakdown">
          <div className="ax-card__header" style={{ flexWrap: 'wrap', gap: 'var(--ax-space-3)' }}>
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Geographic Breakdown &amp; Verification Matrix</span>
              <h2 className="ax-card__title">District-wise SWP Installation Breakdown</h2>
              <p className="ax-card__subtitle">Complete district report from Assam SWP operations</p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', flexWrap: 'wrap' }}>
                {/* <div className="ax-btn-group ax-btn-group--segmented" role="tablist" aria-label="Report Tabs">
                  <button
                    type="button"
                    className={`ax-btn ax-btn--sm ${activeTab === 'districtWise' ? 'is-selected' : ''}`}
                    role="tab"
                    aria-selected={activeTab === 'districtWise'}
                    onClick={() => setActiveTab('districtWise')}
                  >
                    All Overview
                  </button>
                  <button
                    type="button"
                    className={`ax-btn ax-btn--sm ${activeTab === 'verification' ? 'is-selected' : ''}`}
                    role="tab"
                    aria-selected={activeTab === 'verification'}
                    onClick={() => setActiveTab('verification')}
                  >
                    Verification &amp; Docs
                  </button>
                  <button
                    type="button"
                    className={`ax-btn ax-btn--sm ${activeTab === 'payment' ? 'is-selected' : ''}`}
                    role="tab"
                    aria-selected={activeTab === 'payment'}
                    onClick={() => setActiveTab('payment')}
                  >
                    Claims &amp; Payment
                  </button>
                </div> */}
                {/* <input
                  type="search"
                  className="ax-input ax-input--sm"
                  placeholder="Search district..."
                  style={{ minWidth: 160 }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                /> */}
                <button
                  type="button"
                  className="ax-btn ax-btn--secondary ax-btn--sm"
                  onClick={exportToCSV}
                  title="Export records to Excel/CSV"
                >
                  {ICON_DOWNLOAD}
                  <span className="ax-btn__label">Export Excel/CSV</span>
                </button>
              </div>
            </div>
          </div>

          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap' }}>
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">Sr No</th>
                  <th className="ax-table__th" scope="col">District</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Total Sites</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Complete</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Pending</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Verify Pending</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Verify Approved</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Verify Rejected</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Doc Pending</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Doc Approved</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Claims Raised</th>
                  <th className="ax-table__th ax-table__th--num" scope="col">Payment Complete</th>
                  <th className="ax-table__th" scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredDistricts.length > 0 ? (
                  filteredDistricts.map((row: DistrictWiseItem, idx: number) => {
                    const rowCompletePct = row.site_count > 0 ? Math.round((row.complete / row.site_count) * 100) : 0;
                    const tone = rowCompletePct === 100 ? 'success' : rowCompletePct >= 50 ? 'info' : 'warning';
                    return (
                      <tr key={row.district} className="ax-table__row">
                        <td className="ax-table__td ax-num" style={{ color: 'var(--ax-text-muted)' }}>{idx + 1}</td>
                        <td className="ax-table__td">
                          <span style={{ fontWeight: 'var(--ax-weight-semibold)', color: 'var(--ax-text-strong)', textTransform: 'capitalize' }}>
                            {row.district}
                          </span>
                        </td>
                        <td className="ax-table__td ax-table__td--num ax-num" style={{ fontWeight: 600 }}>{row.site_count}</td>
                        <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-emerald)', fontWeight: 600 }}>{row.complete}</td>
                        <td className="ax-table__td ax-table__td--num ax-num" style={{ color: row.pending > 0 ? 'var(--ax-viz-amber)' : 'var(--ax-text-muted)' }}>{row.pending}</td>
                        <td className="ax-table__td ax-table__td--num ax-num" style={{ color: row.verify_pending > 0 ? 'var(--ax-viz-cyan)' : 'var(--ax-text-muted)' }}>{row.verify_pending}</td>
                        <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-emerald)' }}>{row.verify_approved}</td>
                        <td className="ax-table__td ax-table__td--num ax-num" style={{ color: row.verify_reject > 0 ? 'var(--ax-viz-red)' : 'var(--ax-text-muted)' }}>{row.verify_reject}</td>
                        <td className="ax-table__td ax-table__td--num ax-num" style={{ color: row.doc_pending > 0 ? 'var(--ax-viz-violet)' : 'var(--ax-text-muted)' }}>{row.doc_pending}</td>
                        <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-emerald)' }}>{row.doc_approved}</td>
                        <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-accent)' }}>{row.inst_claim_raised}</td>
                        <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-pink)' }}>₹{row.inst_pay_complete}</td>
                        <td className="ax-table__td">
                          <span className={`ax-badge ax-badge--soft ax-badge--${tone} ax-badge--pill`}>
                            <span className="ax-badge__dot" />
                            {rowCompletePct}% Done
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={13} style={{ textAlign: 'center', padding: 'var(--ax-space-6)', color: 'var(--ax-text-muted)' }}>
                      No matching district records found for the selected filters.
                    </td>
                  </tr>
                )}
                {/* Total Row */}
                <tr className="ax-table__row" style={{ background: 'var(--ax-surface-subtle)', fontWeight: 'var(--ax-weight-bold)' }}>
                  <td className="ax-table__td" colSpan={2} style={{ color: 'var(--ax-text-strong)' }}>Total</td>
                  <td className="ax-table__td ax-table__td--num ax-num">{totalStats.site_count}</td>
                  <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-emerald)' }}>{totalStats.complete}</td>
                  <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-amber)' }}>{totalStats.pending}</td>
                  <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-cyan)' }}>{totalStats.verify_pending}</td>
                  <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-emerald)' }}>{totalStats.verify_approved}</td>
                  <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-text-strong)' }}>{totalStats.verify_reject}</td>
                  <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-violet)' }}>{totalStats.doc_pending}</td>
                  <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-emerald)' }}>{totalStats.doc_approved}</td>
                  <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-accent)' }}>{totalStats.inst_claim_raised}</td>
                  <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-viz-pink)' }}>₹{totalStats.inst_pay_complete}</td>
                  <td className="ax-table__td">
                    <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill">
                      {completionPct}% Complete
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

export default AssamDashboard;
