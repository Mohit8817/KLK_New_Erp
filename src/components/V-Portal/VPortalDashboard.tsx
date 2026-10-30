import { lazy, Suspense, useEffect, useMemo, useState, useDeferredValue } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PageHead } from '../shell/PageHead';
import { Pagination, usePagination, TableExportToolbar, type ExportColumn } from '../../common';
import { SearchInput } from '../../common/search/SearchInput';
import { useAuth } from '../../context/AuthContext';

// Code-split ApexCharts so V-Portal Dashboard shell renders instantly
const ApexChart = lazy(() => import('../charts/ApexChart').then((m) => ({ default: m.ApexChart })));

interface WorkOrder {
  id: string;
  site: string;
  state: string;
  district: string;
  module: string;
  technician: string;
  status: 'In Progress' | 'Verified' | 'Commissioned' | 'Pending Survey' | 'Resolved';
  date: string;
  to: string;
}

interface StateOverview {
  state: string;
  totalSites: number;
  activeInstallations: number;
  surveysDone: number;
  amcUnits: number;
  complaints: number;
}

const INITIAL_WORK_ORDERS: WorkOrder[] = [
  {
    id: 'WO-8821',
    site: '70MW SRT Central Sub-station',
    state: 'Jammu & Kashmir',
    district: 'JAMMU',
    module: 'Installation (70MW)',
    technician: 'Ramesh Sharma',
    status: 'In Progress',
    date: '17-10-2026',
    to: '/jammu/installation/srt-70mw/dashboard',
  },
  {
    id: 'WO-8820',
    site: 'SSL Solar Feeder Line 4',
    state: 'Uttar Pradesh',
    district: 'LUCKNOW',
    module: 'AMC Maintenance',
    technician: 'Vikas Maurya',
    status: 'Verified',
    date: '17-10-2026',
    to: '/up/amc/ssl/view-assign-light',
  },
  {
    id: 'WO-8819',
    site: 'SWP Pump Station Block C',
    state: 'Assam',
    district: 'KAMRUP',
    module: 'Installation (SWP)',
    technician: 'Barun Das',
    status: 'Commissioned',
    date: '16-10-2026',
    to: '/assam/swp/dashboard',
  },
  {
    id: 'WO-8818',
    site: 'Kusum C Solar Farm Unit 2',
    state: 'Uttar Pradesh',
    district: 'VARANASI',
    module: 'Installation (Kusum C)',
    technician: 'Sunil Verma',
    status: 'Pending Survey',
    date: '16-10-2026',
    to: '/up/installation/kusum-c/dashboard',
  },
  {
    id: 'WO-8817',
    site: 'Resco Site Phase-3',
    state: 'Jammu & Kashmir',
    district: 'SRINAGAR',
    module: 'Survey (Resco)',
    technician: 'Anil Kumar',
    status: 'Verified',
    date: '15-10-2026',
    to: '/jammu/survey/resco/view-survey',
  },
  {
    id: 'WO-8816',
    site: 'SSL High Mast 18W',
    state: 'Uttar Pradesh',
    district: 'KANPUR',
    module: 'AMC (18W)',
    technician: 'Pradeep Yadav',
    status: 'Commissioned',
    date: '15-10-2026',
    to: '/up/amc/ssl-18w/view-assign-light',
  },
  {
    id: 'WO-8815',
    site: 'SRLM SRT Cluster 9',
    state: 'Uttar Pradesh',
    district: 'AYODHYA',
    module: 'Complaints',
    technician: 'Deepak Singh',
    status: 'In Progress',
    date: '14-10-2026',
    to: '/up/complaint/srlmsrt/add-complaint',
  },
  {
    id: 'WO-8814',
    site: 'SWP Agriculture Feeder 2',
    state: 'Assam',
    district: 'DIBRUGARH',
    module: 'Installation (SWP)',
    technician: 'Manoj Bora',
    status: 'Verified',
    date: '14-10-2026',
    to: '/assam/swp/installation-site',
  },
  {
    id: 'WO-8813',
    site: '70MW SRT Field Unit 11',
    state: 'Jammu & Kashmir',
    district: 'UDHAMPUR',
    module: 'Expenses',
    technician: 'Rajeev Raina',
    status: 'Resolved',
    date: '13-10-2026',
    to: '/jammu/installation-expenses/srt-70mw/view-expenses',
  },
  {
    id: 'WO-8812',
    site: 'Resco Commercial Rooftop',
    state: 'Uttar Pradesh',
    district: 'AGRA',
    module: 'Survey (Resco)',
    technician: 'Mahesh Pandey',
    status: 'Commissioned',
    date: '12-10-2026',
    to: '/up/survey/resco/view-resco',
  },
];

const STATE_SUMMARIES: StateOverview[] = [
  { state: 'Uttar Pradesh', totalSites: 1120, activeInstallations: 580, surveysDone: 340, amcUnits: 240, complaints: 28 },
  { state: 'Punjab', totalSites: 860, activeInstallations: 430, surveysDone: 210, amcUnits: 160, complaints: 8 },
  { state: 'Jammu & Kashmir', totalSites: 980, activeInstallations: 520, surveysDone: 310, amcUnits: 190, complaints: 14 },
  { state: 'Assam', totalSites: 745, activeInstallations: 320, surveysDone: 242, amcUnits: 103, complaints: 6 },
  { state: 'Karnataka', totalSites: 685, activeInstallations: 290, surveysDone: 195, amcUnits: 88, complaints: 4 },
];

interface KpiProps {
  icon: React.ReactNode;
  tone: 'accent' | 'cyan' | 'emerald' | 'amber' | 'violet' | 'pink' | 'red';
  label: string;
  value: string;
  unit?: string;
  sub: string;
  badge?: string;
  spark?: number[];
  sparkType?: 'line' | 'bar';
  onClick?: () => void;
}

const TONE: Record<KpiProps['tone'], { bg: string; fg: string; apex: string }> = {
  accent: { bg: 'rgba(var(--ax-accent-rgb), 0.12)', fg: 'var(--ax-accent)', apex: '--ax-accent' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan) 14%, transparent)', fg: 'var(--ax-viz-cyan)', apex: '--ax-viz-cyan' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald) 14%, transparent)', fg: 'var(--ax-viz-emerald)', apex: '--ax-viz-emerald' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber) 14%, transparent)', fg: 'var(--ax-viz-amber)', apex: '--ax-viz-amber' },
  violet: { bg: 'color-mix(in oklab, var(--ax-viz-violet) 14%, transparent)', fg: 'var(--ax-viz-violet)', apex: '--ax-viz-violet' },
  pink: { bg: 'color-mix(in oklab, var(--ax-viz-pink) 14%, transparent)', fg: 'var(--ax-viz-pink)', apex: '--ax-viz-pink' },
  red: { bg: 'color-mix(in oklab, var(--ax-viz-red) 14%, transparent)', fg: 'var(--ax-viz-red)', apex: '--ax-viz-red' },
};

function KpiCard({ icon, tone, label, value, unit, sub, badge, spark, sparkType = 'line', onClick }: KpiProps) {
  const t = TONE[tone];
  const hasSpark = Array.isArray(spark) && spark.length > 1;
  const allZeros = hasSpark && spark.every((v) => v === 0);
  const safeSpark = allZeros ? [0, 1, 0, 1, 0, 0, 1] : spark;

  return (
    <div
      className="ax-card ax-col--3"
      role={onClick ? 'button' : 'region'}
      tabIndex={onClick ? 0 : undefined}
      aria-label={label}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
      style={{
        borderRadius: 'var(--ax-radius-lg)',
        background: 'var(--ax-bg-surface)',
        cursor: onClick ? 'pointer' : undefined,
        transition: 'transform 160ms ease, box-shadow 160ms ease',
      }}
    >
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <span style={{ width: 28, height: 28, borderRadius: 'var(--ax-radius-md)', background: t.bg, color: t.fg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ width: 16, height: 16, display: 'inline-flex' }}>{icon}</span>
            </span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ax-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
          </div>
          {badge && (
            <span className="ax-kpi__delta ax-kpi__delta--up" style={{ fontSize: '11px', padding: '1px 6px', flexShrink: 0 }}>
              {badge}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--ax-font-display)', fontSize: '1.35rem', fontWeight: 700, lineHeight: 1.1, color: 'var(--ax-text-strong)', fontVariantNumeric: 'tabular-nums' }}>
              {value} {unit && <small style={{ fontSize: '11px', fontWeight: 500, color: 'var(--ax-text-muted)' }}>{unit}</small>}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--ax-text-muted)', marginTop: '2px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div>
          </div>
          {hasSpark && (
            <div style={{ width: 68, height: 26, overflow: 'hidden', flexShrink: 0 }}>
              <Suspense fallback={<div style={{ width: 68, height: 26 }} />}>
                <ApexChart
                  key={`${label}-${safeSpark!.join(',')}-${sparkType}`}
                  type={sparkType}
                  sparkline
                  tooltip={false}
                  height={26}
                  color={t.apex}
                  series={[{ name: label, data: safeSpark! }]}
                />
              </Suspense>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const I_PIN = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="10" r="3" /><path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z" /></svg>;
const I_USERS = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
const I_BOLT = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>;
const I_DONE = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M20 6L9 17l-5-5" /></svg>;
const I_CLOCK = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
const I_X = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
const I_LIST = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>;
const ICON_REFRESH = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M23 4v6h-6" /><path d="M1 20v-6h6" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>;
const ICON_FILTER = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>;

const labelStyle: React.CSSProperties = {
  fontSize: 'var(--ax-text-xs)',
  color: 'var(--ax-text-muted)',
  fontWeight: 600,
};

export function VPortalDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [selectedState, setSelectedState] = useState('All');
  const [selectedModule, setSelectedModule] = useState('All');
  const [query, setQuery] = useState('');
  const [updatedAt, setUpdatedAt] = useState<Date>(new Date());
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);

  const vendorDisplayName = user?.name || user?.vendor_id || 'Vendor Partner';

  const refreshData = () => {
    setUpdatedAt(new Date());
  };

  /* ──────── Filtered Work Orders ──────── */
  const deferredQuery = useDeferredValue(query);
  const filteredOrders = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return INITIAL_WORK_ORDERS.filter((item) => {
      const matchState = selectedState === 'All' || item.state === selectedState;
      const matchModule = selectedModule === 'All' || item.module.toLowerCase().includes(selectedModule.toLowerCase());
      const matchQuery =
        !q ||
        item.id.toLowerCase().includes(q) ||
        item.site.toLowerCase().includes(q) ||
        item.state.toLowerCase().includes(q) ||
        item.technician.toLowerCase().includes(q) ||
        item.status.toLowerCase().includes(q);
      return matchState && matchModule && matchQuery;
    });
  }, [selectedState, selectedModule, deferredQuery]);

  const {
    paginatedData: pagedOrders,
    currentPage,
    pageSize,
    totalItems,
    setPage,
    setPageSize,
  } = usePagination({ data: filteredOrders, initialPageSize: 10 });

  useEffect(() => {
    setPage(1);
  }, [query, selectedState, selectedModule, setPage]);

  const tableColumns: ExportColumn<WorkOrder>[] = [
    { header: 'Order ID', accessor: 'id' },
    { header: 'Site & Project', accessor: 'site' },
    { header: 'State', accessor: 'state' },
    { header: 'Module', accessor: 'module' },
    { header: 'Assigned Lead', accessor: 'technician' },
    { header: 'Status', accessor: 'status' },
    { header: 'Date', accessor: 'date' },
  ];

  const toolbarColumns = tableColumns.map((col, idx) => ({
    key: `${col.header}-${idx}`,
    label: col.header,
    visible: !hiddenColumns.includes(`${col.header}-${idx}`),
  }));

  const visibleTableColumns = tableColumns.filter((col, idx) => !hiddenColumns.includes(`${col.header}-${idx}`));

  const exportToCSV = (data: WorkOrder[], columns: ExportColumn<WorkOrder>[], filename: string) => {
    if (!data.length || !columns.length) return;
    const headerRow = columns.map((c) => `"${c.header}"`).join(',');
    const rows = data.map((row) =>
      columns.map((c) => {
        const val = typeof c.accessor === 'function' ? c.accessor(row) : (row as any)[c.accessor];
        return `"${String(val ?? '').replace(/"/g, '""')}"`;
      }).join(',')
    );
    const csvContent = [headerRow, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToPDF = (data: WorkOrder[], columns: ExportColumn<WorkOrder>[], title: string) => {
    if (!data.length || !columns.length) return;
    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    if (!printWindow) return;
    printWindow.document.write(`<!doctype html><html><head><meta charset="UTF-8" /><title>${title}</title><style>
      *{box-sizing:border-box}body{font-family:Arial,sans-serif;padding:24px;color:#222}h1{font-size:20px;margin:0 0 16px}
      table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #d8dee6;padding:7px 8px;text-align:left;vertical-align:top}
      th{background:#f3f5f7;font-weight:700}@media print{body{padding:0}@page{size:landscape;margin:12mm}}
    </style></head><body><h1>${title}</h1><table><thead><tr>${columns.map((c) => `<th>${c.header}</th>`).join('')}</tr></thead><tbody>${data.map((row) => `<tr>${columns.map((c) => `<td>${typeof c.accessor === 'function' ? c.accessor(row) : (row as any)[c.accessor]}</td>`).join('')}</tr>`).join('')}</tbody></table><script>window.onload=function(){window.print();};</script></body></html>`);
    printWindow.document.close();
    printWindow.focus();
  };

  const filtersActive = selectedState !== 'All' || selectedModule !== 'All';

  // Overall KPIs
  const totalSites = 2845;
  const activeInstall = 1420;
  const verifiedSurveys = 892;
  const amcTotal = 533;
  const openComplaints = 48;

  return (
    <div className="solar-erp-page">
      {/* 1. Page Header (Exact DLE Header Layout) */}
      <PageHead
        title="Vendor Dashboard (V-Portal)"
        subtitle={
          <span style={{ display: 'inline-block', fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>
            Vendor operations across states · Active field installations & surveys · Last updated {updatedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </span>
        }
        actions={
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill" style={{ fontWeight: 600, paddingInline: 'var(--ax-space-3)' }}>
              <span className="ax-badge__dot" /> 3 States Active
            </span>
            <button type="button" className="ax-btn ax-btn--ghost ax-btn--icon" aria-label="Refresh dashboard" onClick={refreshData}>
              {ICON_REFRESH}
            </button>
          </div>
        }
      />

      <div className="ax-dash-grid mt-0 pt-0">
        {/* 2. Operations Filter Bar (Exact DLE Filter Bar Layout) */}
        <section
          className="ax-card ax-card--flat ax-col--12"
          role="region"
          aria-label="V-Portal Dashboard Filters"
          style={{ padding: '8px 16px', borderRadius: 'var(--ax-radius-lg)', border: '1px solid var(--ax-border-subtle)', background: 'var(--ax-bg-surface)' }}
        >
          <div className="ax-cluster" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--ax-space-3)', alignItems: 'center' }}>
            <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
              <span
                className="ax-cluster"
                style={{
                  gap: '6px', color: 'var(--ax-text-strong)', fontSize: 'var(--ax-text-xs)', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.04em', padding: '4px 10px',
                  background: 'rgba(var(--ax-accent-rgb), 0.08)', borderRadius: 'var(--ax-radius-pill)',
                  border: '1px solid rgba(var(--ax-accent-rgb), 0.18)',
                }}
              >
                {ICON_FILTER} Filter Operations
              </span>

              <div className="ax-cluster dle-filter-item" style={{ gap: '6px', alignItems: 'center' }}>
                <label htmlFor="vp-state-select" style={labelStyle}>State:</label>
                <select
                  id="vp-state-select"
                  className="ax-input ax-input--sm"
                  style={{ height: 30, fontSize: 'var(--ax-text-xs)', paddingInline: '8px' }}
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                >
                  <option value="All">All States (3)</option>
                  <option value="Uttar Pradesh">Uttar Pradesh (UP)</option>
                  <option value="Jammu & Kashmir">Jammu & Kashmir (J&K)</option>
                  <option value="Assam">Assam</option>
                  <option value="Karnataka">Karnataka</option>
                </select>
              </div>

              <div className="ax-cluster dle-filter-item" style={{ gap: '6px', alignItems: 'center' }}>
                <label htmlFor="vp-module-select" style={labelStyle}>Module:</label>
                <select
                  id="vp-module-select"
                  className="ax-input ax-input--sm"
                  style={{ height: 30, fontSize: 'var(--ax-text-xs)', paddingInline: '8px' }}
                  value={selectedModule}
                  onChange={(e) => setSelectedModule(e.target.value)}
                >
                  <option value="All">All Modules</option>
                  <option value="Installation">Installation System</option>
                  <option value="Survey">Survey Operations</option>
                  <option value="AMC">AMC Maintenance</option>
                  <option value="Complaints">Complaints & Claims</option>
                  <option value="Expenses">Expenses</option>
                </select>
              </div>

              {filtersActive && (
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--sm"
                  style={{ height: 28, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }}
                  onClick={() => { setSelectedState('All'); setSelectedModule('All'); }}
                >
                  Reset Filters
                </button>
              )}
            </div>

            <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>
                Showing <b style={{ color: 'var(--ax-text-strong)' }}>{filteredOrders.length}</b> Work Orders · Status: <b style={{ color: 'var(--ax-viz-emerald)' }}>Live</b>
              </span>
            </div>
          </div>
        </section>

        {/* 3. Executive Welcome Banner (Exact DLE Welcome Banner Layout) */}
        <section className="ax-card ax-welcome ax-col--12" role="region" aria-label="Vendor Overview">
          <div className="ax-welcome__body">
            <div className="ax-welcome__text">
              <p className="ax-welcome__eyebrow">Vendor Management System (V-Portal)</p>
              <h2 className="ax-card__title">Welcome to Vendor Portal Dashboard</h2>
              <p className="ax-welcome__lede">
                Vendor overview for <b>{vendorDisplayName}</b>: <b>{totalSites.toLocaleString('en-IN')} Sites</b> across <b>3 States</b> and <b>24 Districts</b>.
                <b> {activeInstall.toLocaleString('en-IN')} (50%)</b> active installations with <b>{verifiedSurveys.toLocaleString('en-IN')}</b> field surveys completed.
              </p>
            </div>

            <dl className="ax-welcome__stats">
              <div className="ax-welcome__stat">
                <dt>Total States</dt>
                <dd className="ax-num">3</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-emerald)' }}>24 Districts</small>
              </div>
              <div className="ax-welcome__stat">
                <dt>Total Sites</dt>
                <dd className="ax-num">{totalSites.toLocaleString('en-IN')}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-accent)' }}>Authorized Work Orders</small>
              </div>
              <div className="ax-welcome__stat">
                <dt>Active Installs</dt>
                <dd className="ax-num">{activeInstall.toLocaleString('en-IN')}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-cyan)' }}>In Field Progress</small>
              </div>
              <div className="ax-welcome__stat">
                <dt>Open Issues</dt>
                <dd className="ax-num">{openComplaints}</dd>
                <small style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-viz-red)' }}>Claims & Complaints</small>
              </div>
            </dl>
          </div>
        </section>

        {/* 4. 8 KPI Cards with Sparklines (Exact DLE Card Style) */}
        <KpiCard
          icon={I_PIN}
          tone="accent"
          label="Total States"
          value="3"
          sub="UP, J&K, Assam"
          spark={[1, 2, 2, 3, 3, 3]}
          onClick={() => setSelectedState('All')}
        />

        <KpiCard
          icon={I_USERS}
          tone="cyan"
          label="Total Vendor Sites"
          value={totalSites.toLocaleString('en-IN')}
          unit="Sites"
          sub="Authorized projects"
          spark={[240, 480, 890, 1420, 2100, 2845]}
          onClick={() => setSelectedModule('All')}
        />

        <KpiCard
          icon={I_BOLT}
          tone="emerald"
          label="Active Installations"
          value={activeInstall.toLocaleString('en-IN')}
          unit="Units"
          sub="Solar installations active"
          badge="+18% SLA"
          spark={[120, 280, 540, 890, 1200, 1420]}
          onClick={() => setSelectedModule('Installation')}
        />

        <KpiCard
          icon={I_DONE}
          tone="cyan"
          label="Field Surveys Done"
          value={verifiedSurveys.toLocaleString('en-IN')}
          unit="Surveys"
          sub="Verified survey records"
          badge="94% Rate"
          spark={[80, 190, 340, 560, 780, 892]}
          onClick={() => setSelectedModule('Survey')}
        />

        <KpiCard
          icon={I_CLOCK}
          tone="amber"
          label="AMC Maintenance"
          value={amcTotal.toLocaleString('en-IN')}
          unit="Lights"
          sub="Active maintenance SLA"
          badge="100% SLA"
          spark={[40, 90, 180, 290, 410, 533]}
          onClick={() => setSelectedModule('AMC')}
        />

        <KpiCard
          icon={I_LIST}
          tone="accent"
          label="Today Dispatched"
          value="28"
          unit="Orders"
          sub="New work orders today"
          spark={[4, 8, 12, 18, 22, 28]}
        />

        <KpiCard
          icon={I_X}
          tone="red"
          label="Open Complaints"
          value={openComplaints.toLocaleString('en-IN')}
          unit="Issues"
          sub="Pending field claims"
          badge="-6 Resolved"
          spark={[65, 58, 54, 50, 48]}
          onClick={() => setSelectedModule('Complaints')}
        />

        <KpiCard
          icon={I_PIN}
          tone="violet"
          label="Contractor Districts"
          value="24"
          sub="Active execution zones"
          spark={[10, 14, 18, 20, 22, 24]}
        />

        {/* 5. Integrated Regional Operations & State Portals Section */}
        <div className="ax-col--12" style={{ marginTop: 'var(--ax-space-3)', marginBottom: 'var(--ax-space-1)' }}>
          <div className="ax-cluster" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--ax-space-2)' }}>
            <div>
              <span className="ax-card__eyebrow" style={{ color: 'var(--ax-accent)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                Integrated Regional Operations & State Portals
              </span>
              <h2 className="ax-card__title" style={{ fontSize: 'var(--ax-text-lg)', margin: 0 }}>
                State-Wise Operations & Project Workflows
              </h2>
            </div>
            <span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--pill" style={{ fontSize: 'var(--ax-text-xs)' }}>
              Contractor Mode: <b>Direct State Access</b>
            </span>
          </div>
        </div>

        {/* State Operation Workflow Cards (Exact DLE Card Layout) */}
        {STATE_SUMMARIES.map((st) => (
          <div key={st.state} className="ax-card ax-col--4" style={{ borderRadius: 'var(--ax-radius-lg)', background: 'var(--ax-bg-surface)' }}>
            <div className="ax-card__header" style={{ padding: '14px 16px 10px 16px', borderBottom: '1px solid var(--ax-border-subtle)' }}>
              <div className="ax-card__titles">
                <span className="ax-card__eyebrow" style={{ color: 'var(--ax-accent)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>
                  Regional Operations
                </span>
                <h3 className="ax-card__title" style={{ fontSize: '15px', margin: 0 }}>
                  {st.state}
                </h3>
              </div>
              <span className="ax-badge ax-badge--soft ax-badge--accent ax-badge--pill" style={{ fontSize: '11px', fontWeight: 700 }}>
                {st.totalSites.toLocaleString('en-IN')} Sites
              </span>
            </div>

            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                <span style={{ color: 'var(--ax-text-muted)' }}>⚡ Active Installations:</span>
                <strong style={{ color: 'var(--ax-viz-emerald)' }}>{st.activeInstallations}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                <span style={{ color: 'var(--ax-text-muted)' }}>📋 Verified Surveys:</span>
                <strong style={{ color: 'var(--ax-viz-cyan)' }}>{st.surveysDone}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                <span style={{ color: 'var(--ax-text-muted)' }}>🛡️ AMC Maintenance:</span>
                <strong style={{ color: 'var(--ax-viz-amber)' }}>{st.amcUnits}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                <span style={{ color: 'var(--ax-text-muted)' }}>🚨 Open Complaints:</span>
                <strong style={{ color: 'var(--ax-viz-red)' }}>{st.complaints}</strong>
              </div>

              {/* Progress bar */}
              <div style={{ marginTop: '4px' }}>
                <div style={{ height: '6px', background: 'var(--ax-border-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.round((st.activeInstallations / st.totalSites) * 100)}%`,
                    height: '100%',
                    background: 'var(--ax-accent)',
                    borderRadius: '3px',
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: 'var(--ax-text-subtle)', marginTop: '4px' }}>
                  <span>Execution Progress</span>
                  <span>{Math.round((st.activeInstallations / st.totalSites) * 100)}%</span>
                </div>
              </div>
            </div>

            <div className="ax-card__footer" style={{ padding: '10px 16px', borderTop: '1px solid var(--ax-border-subtle)', background: '#f8fafc' }}>
              <button
                type="button"
                className="ax-btn ax-btn--ghost ax-btn--sm"
                style={{ width: '100%', justifyContent: 'center', fontWeight: 600, fontSize: '12px', color: 'var(--ax-accent)' }}
                onClick={() => {
                  setSelectedState(st.state);
                  if (st.state === 'Uttar Pradesh') navigate('/up/survey/ssl/view-data');
                  else if (st.state === 'Punjab') navigate('/v/punjab/ssl/installation/dashboard');
                  else if (st.state === 'Jammu & Kashmir') navigate('/jammu/installation/srt-70mw/dashboard');
                  else navigate('/assam/swp/dashboard');
                }}
              >
                Open {st.state} Modules →
              </button>
            </div>
          </div>
        ))}

        {/* 6. Charts Section: State Distribution & Status Donut */}
        <div className="ax-card ax-col--6" style={{ borderRadius: 'var(--ax-radius-lg)', background: 'var(--ax-bg-surface)' }}>
          <div className="ax-card__header" style={{ padding: '14px 18px', borderBottom: '1px solid var(--ax-border-subtle)' }}>
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow" style={{ color: 'var(--ax-accent)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>
                Distribution Analytics
              </span>
              <h3 className="ax-card__title" style={{ fontSize: '15px', margin: 0 }}>
                State-Wise Work Order Distribution
              </h3>
            </div>
          </div>
          <div style={{ padding: '16px', minHeight: '260px' }}>
            <Suspense fallback={<div style={{ height: 240 }} />}>
              <ApexChart
                type="bar"
                height={240}
                series={[{
                  name: 'Total Sites',
                  data: STATE_SUMMARIES.map((s) => s.totalSites),
                }]}
                options={{
                  chart: { toolbar: { show: false } },
                  colors: ['#2563eb', '#ea580c', '#10b981', '#f59e0b'],
                  plotOptions: {
                    bar: {
                      borderRadius: 6,
                      columnWidth: '45%',
                      distributed: true,
                    },
                  },
                  xaxis: {
                    categories: STATE_SUMMARIES.map((s) => s.state),
                    labels: { style: { fontSize: '11.5px', fontWeight: 600 } },
                  },
                  yaxis: { labels: { style: { fontSize: '11px' } } },
                  legend: { show: false },
                }}
              />
            </Suspense>
          </div>
        </div>

        <div className="ax-card ax-col--6" style={{ borderRadius: 'var(--ax-radius-lg)', background: 'var(--ax-bg-surface)' }}>
          <div className="ax-card__header" style={{ padding: '14px 18px', borderBottom: '1px solid var(--ax-border-subtle)' }}>
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow" style={{ color: 'var(--ax-viz-emerald)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>
                Status Breakdown
              </span>
              <h3 className="ax-card__title" style={{ fontSize: '15px', margin: 0 }}>
                Operations Status Overview
              </h3>
            </div>
          </div>
          <div style={{ padding: '16px', minHeight: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Suspense fallback={<div style={{ height: 240 }} />}>
              <ApexChart
                type="donut"
                height={240}
                series={[activeInstall, verifiedSurveys, amcTotal, openComplaints]}
                options={{
                  chart: { toolbar: { show: false } },
                  labels: ['Active Install', 'Surveys Done', 'AMC Lights', 'Complaints'],
                  colors: ['#10b981', '#0284c7', '#f59e0b', '#ef4444'],
                  legend: { position: 'bottom', fontSize: '12px', fontWeight: 600 },
                  dataLabels: { enabled: true, formatter: (val: number) => `${Math.round(val)}%` },
                }}
              />
            </Suspense>
          </div>
        </div>

        {/* 7. Work Orders Table with Search, Export Toolbar & Pagination (Exact DLE Table) */}
        <section className="ax-card ax-col--12" style={{ borderRadius: 'var(--ax-radius-lg)', background: 'var(--ax-bg-surface)' }}>
          <div className="ax-card__header" style={{ padding: '14px 18px', borderBottom: '1px solid var(--ax-border-subtle)', flexWrap: 'wrap', gap: '12px' }}>
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow" style={{ color: 'var(--ax-accent)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>
                Field Dispatch Registry
              </span>
              <h3 className="ax-card__title" style={{ fontSize: '16px', margin: 0 }}>
                Vendor Work Orders & Service Directory
              </h3>
              <p className="ax-card__subtitle" style={{ fontSize: '12px', color: 'var(--ax-text-muted)', margin: '2px 0 0 0' }}>
                Total {filteredOrders.length} records matching current filter
              </p>
            </div>

            <div className="ax-card__actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <div style={{ minWidth: '180px' }}>
                <SearchInput
                  value={query}
                  onChange={setQuery}
                  placeholder="Search work orders, site, tech…"
                />
              </div>

              <TableExportToolbar
                columns={toolbarColumns}
                onToggleColumn={(key) => {
                  setHiddenColumns((prev) =>
                    prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
                  );
                }}
                onExportCSV={() => exportToCSV(filteredOrders, visibleTableColumns, 'vendor_work_orders')}
                onExportExcel={() => exportToCSV(filteredOrders, visibleTableColumns, 'vendor_work_orders')}
                onExportPDF={() => exportToPDF(filteredOrders, visibleTableColumns, 'Vendor Work Orders Report')}
                onPrint={() => window.print()}
              />
            </div>
          </div>

          <div className="ax-table-wrap" style={{ overflowX: 'auto' }}>
            <table className="ax-table" style={{ width: '100%', fontSize: '12.5px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--ax-border-subtle)' }}>
                  {visibleTableColumns.map((col) => (
                    <th key={col.header} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: 'var(--ax-text-strong)' }}>
                      {col.header}
                    </th>
                  ))}
                  <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: 'var(--ax-text-strong)' }}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {pagedOrders.map((wo) => (
                  <tr key={wo.id} style={{ borderBottom: '1px solid var(--ax-border-subtle)' }}>
                    {visibleTableColumns.map((col) => {
                      if (col.accessor === 'id') {
                        return (
                          <td key={col.header} style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--ax-accent)' }}>
                            {wo.id}
                          </td>
                        );
                      }
                      if (col.accessor === 'status') {
                        const statusColors: Record<string, { bg: string; fg: string }> = {
                          'In Progress': { bg: '#e0f2fe', fg: '#0369a1' },
                          'Verified': { bg: '#f0fdf4', fg: '#15803d' },
                          'Commissioned': { bg: '#f0fdf4', fg: '#15803d' },
                          'Pending Survey': { bg: '#fffbeb', fg: '#b45309' },
                          'Resolved': { bg: '#f5f3ff', fg: '#7c3aed' },
                        };
                        const c = statusColors[wo.status] || { bg: '#f1f5f9', fg: '#475569' };
                        return (
                          <td key={col.header} style={{ padding: '12px 14px' }}>
                            <span style={{
                              background: c.bg,
                              color: c.fg,
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 700,
                            }}>
                              {wo.status}
                            </span>
                          </td>
                        );
                      }
                      return (
                        <td key={col.header} style={{ padding: '12px 14px', color: 'var(--ax-text-default)' }}>
                          {(wo as any)[col.accessor]}
                        </td>
                      );
                    })}
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <Link
                        to={wo.to}
                        className="ax-btn ax-btn--sm"
                        style={{
                          padding: '4px 10px',
                          background: 'rgba(var(--ax-accent-rgb), 0.1)',
                          color: 'var(--ax-accent)',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <span>Open</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination (Exact DLE Pagination Component) */}
          <div className="ax-card__footer" style={{ padding: '12px 18px', borderTop: '1px solid var(--ax-border-subtle)', background: 'var(--ax-bg-surface)' }}>
            <div className="ula-pagination-left">
              <Pagination
                currentPage={currentPage}
                pageSize={pageSize}
                totalItems={totalItems}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                pageSizeOptions={[10, 20, 50]}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default VPortalDashboard;
