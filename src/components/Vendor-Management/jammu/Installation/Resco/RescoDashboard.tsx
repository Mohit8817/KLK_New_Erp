import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  Pagination,
  usePagination,
  SearchInput,
  TableExportToolbar,
  type ExportColumn,
} from '../../../../../common';
import {
  JAMMU_RESCO_DISTRICTS,
  JAMMU_RESCO_VENDORS,
} from './jammuRescoAdminService';

// Code-split ApexCharts so Jammu RESCO Dashboard shell renders instantly
const ApexChart = lazy(() => import('../../../../charts/ApexChart').then((m) => ({ default: m.ApexChart })));

// Palette constants matching Solar ERP design language
const LIGHT_BLUE = '#2559bf';
const LIGHT_GREEN = '#10b981';
const LIGHT_CYAN = '#0891b2';
const LIGHT_AMBER = '#f59e0b';
const LIGHT_VIOLET = '#7c3aed';

const num = (x: number) => (x ?? 0).toLocaleString('en-IN');
const pctOf = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : 0);
const escapeHtml = (s: string) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// Responsive chart height hook
const useChartHeight = (desktop: number, mobile: number) => {
  const pick = () => (typeof window !== 'undefined' && window.innerWidth < 640 ? mobile : desktop);
  const [h, setH] = useState(pick);
  useEffect(() => {
    const onResize = () => setH(pick());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [desktop, mobile]);
  return h;
};

/* ───────── Responsive page CSS (Solar ERP reference, all columns scrollable) ───────── */
const PAGE_CSS = `
  .solar-erp-page {
    --asw-primary: #2559bf;
    --asw-primary-rgb: 37, 89, 191;
    --ax-primary: #2559bf;
    --ax-primary-hover: #1e4699;
    --ax-primary-rgb: 37, 89, 191;
  }
  .solar-erp-page .ax-btn--primary,
  .solar-erp-page .ax-button--primary {
    background: #2559bf !important;
    border-color: #2559bf !important;
    color: #ffffff !important;
  }
  .solar-erp-page .ax-btn--primary:hover,
  .solar-erp-page .ax-button--primary:hover {
    background: #1e4699 !important;
    border-color: #1e4699 !important;
  }
  .solar-erp-page .ax-page-head { margin-block-end: 10px; }
  .solar-erp-page .ax-page-head .ax-breadcrumb { margin-block-end: 4px; }
  .solar-erp-page .ax-dash-grid { margin-top: 0; }
  .solar-erp-page .ax-card { min-width: 0; }
  .solar-erp-page .ax-card__footer { width: 100%; box-sizing: border-box; }
  .solar-erp-page .ula-pagination-left {
    width: 100%; display: flex; justify-content: flex-start; align-items: center; margin: 0; overflow-x: auto;
  }
  .solar-erp-page .ula-pagination-left > * { margin-left: 0 !important; margin-right: 0 !important; }

  /* ───── Card header row: titles on left, tools on right, always one row ───── */
  .solar-erp-page .ax-card__header {
    display: flex;
    flex-wrap: nowrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }
  .solar-erp-page .ax-card__titles {
    flex: 1 1 220px;
    min-width: 220px;
    max-width: 100%;
  }
  .solar-erp-page .ax-card__title,
  .solar-erp-page .ax-card__eyebrow,
  .solar-erp-page .ax-card__subtitle {
    max-width: none;
    word-break: normal;
    overflow-wrap: normal;
    hyphens: none;
  }
  .solar-erp-page .ax-card__subtitle { line-height: 1.45; }

  .solar-erp-page .ax-card__actions {
    flex: 0 1 auto;
    min-width: 0;
    margin-left: auto;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex-wrap: nowrap;
    gap: 8px;
  }
  .solar-erp-page .ax-card__actions .ax-cluster {
    flex-wrap: nowrap !important;
    min-width: 0;
    justify-content: flex-end;
  }

  /* Compact search input & export buttons */
  .solar-erp-page .ax-card__actions .ax-search,
  .solar-erp-page .ax-card__actions [class*="search"] {
    flex: 1 1 140px;
    min-width: 140px;
    max-width: 240px;
  }
  .solar-erp-page .ax-card__actions input { min-width: 0; width: 100%; }
  .solar-erp-page .ax-card__actions .ax-export-toolbar,
  .solar-erp-page .ax-card__actions [class*="export-toolbar"] {
    flex: 0 1 auto;
    min-width: 0;
    flex-wrap: nowrap;
    gap: 4px;
  }
  .solar-erp-page .ax-export-toolbar__button {
    padding-inline: 8px !important;
    min-width: 0;
  }

  /* All table columns fully scrollable horizontally - no sticky/fixed columns */
  .solar-erp-page .ax-table-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    width: 100%;
  }
  .solar-erp-page .ax-table {
    border-collapse: collapse;
    width: 100%;
  }
  .solar-erp-page .ax-table th,
  .solar-erp-page .ax-table td {
    position: static !important;
    left: auto !important;
    right: auto !important;
    box-shadow: none !important;
  }

  /* Icon-only export buttons below 1100px */
  @media (max-width: 1100px) {
    .solar-erp-page .ax-export-toolbar__button {
      font-size: 0;
      gap: 0;
      padding: 0 8px !important;
      justify-content: center;
    }
    .solar-erp-page .ax-export-toolbar__button svg {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
    }
    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] { max-width: 180px; }
  }

  /* Below 760px: stack titles above actions, search full-width, export toolbar wraps */
  @media (max-width: 760px) {
    .solar-erp-page .ax-card__header {
      flex-direction: column;
      flex-wrap: nowrap;
      align-items: stretch;
      gap: 10px;
    }
    .solar-erp-page .ax-card__titles {
      flex: 0 0 auto;
      min-width: 0;
      width: 100%;
      max-width: 100%;
    }
    .solar-erp-page .ax-card__title {
      font-family: var(--ax-font-display);
      font-size: var(--ax-text-md);
      line-height: var(--ax-leading-md);
    }
    .solar-erp-page .ax-card__actions {
      flex: 0 0 auto;
      width: 100%;
      margin-left: 0;
      flex-wrap: wrap;
      justify-content: flex-start;
    }
    .solar-erp-page .ax-card__actions .ax-cluster {
      flex-wrap: wrap !important;
      width: 100%;
      justify-content: flex-start;
      gap: 8px;
    }
    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] {
      flex: 1 1 100%;
      width: 100%;
      max-width: 100%;
      min-width: 0;
    }
    .solar-erp-page .ax-card__actions .ax-export-toolbar,
    .solar-erp-page .ax-card__actions [class*="export-toolbar"] {
      flex: 1 1 100%;
      flex-wrap: wrap;
      justify-content: flex-start;
      gap: 6px;
    }
    .solar-erp-page .ax-export-toolbar__button {
      font-size: 12px;
      gap: 4px;
      height: 30px;
      padding: 0 8px !important;
    }
  }

  /* Below 490px */
  @media (max-width: 490px) {
    .solar-erp-page .ax-export-toolbar__button {
      font-size: 11px;
      height: 28px;
      padding: 0 6px !important;
    }
    .solar-erp-page .ax-export-toolbar { gap: 4px; }
  }

  /* 5 Top KPI Cards layout */
    .solar-erp-page .asw-cards-row span svg {
    width: 15px !important;
    height: 15px !important;
    display: block !important;
  }
.solar-erp-page .asw-cards-row {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: var(--ax-space-4, 16px);
    margin-bottom: var(--ax-space-5, 20px);
  }
  @media (max-width: 1280px) {
    .solar-erp-page .asw-cards-row {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
  @media (max-width: 768px) {
    .solar-erp-page .asw-cards-row {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 480px) {
    .solar-erp-page .asw-cards-row {
      grid-template-columns: 1fr;
    }
  }
`;

type KpiTone = 'accent' | 'cyan' | 'emerald' | 'amber' | 'violet';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(37, 89, 191, 0.12)', fg: '#2559bf' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan, #06b6d4) 14%, transparent)', fg: '#0891b2' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald, #10b981) 14%, transparent)', fg: '#16a34a' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber, #f59e0b) 14%, transparent)', fg: '#d97706' },
  violet: { bg: 'color-mix(in oklab, var(--ax-viz-violet, #8b5cf6) 14%, transparent)', fg: '#7c3aed' },
};

function KpiCard({
  icon,
  tone,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  tone: KpiTone;
  label: string;
  value: React.ReactNode;
  sub: string;
}) {
  const t = TONE[tone];
  return (
    <div className="ax-card" style={{ padding: '14px 18px', borderRadius: 12, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: t.bg,
            color: t.fg,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span style={{ width: 15, height: 15, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</span>
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)', letterSpacing: '0.04em' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: t.fg, marginTop: 4, fontFamily: 'var(--ax-font-display)' }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>
        {sub}
      </div>
    </div>
  );
}

export function RescoDashboard() {
  const [districtQuery, setDistrictQuery] = useState('');
  const [vendorQuery, setVendorQuery] = useState('');

  // Top stats
  const totalSites = 21;
  const assignedSites = 5;
  const unassignedSites = 13;
  const installedComplete = 4;
  const installedPending = 1;
  const verifyApproved = 3;
  const verifyPending = 1;

  // Chart heights
  const chartH = useChartHeight(300, 240);

  // District wise data
  const districtData = useMemo(() => [
    { district: 'Jammu', total: 6, installed: 2, pending: 1, capacity: '95 kW' },
    { district: 'Kathua', total: 4, installed: 1, pending: 0, capacity: '65 kW' },
    { district: 'Samba', total: 4, installed: 1, pending: 0, capacity: '115 kW' },
    { district: 'Udhampur', total: 3, installed: 0, pending: 0, capacity: '75 kW' },
    { district: 'Rajouri', total: 2, installed: 0, pending: 0, capacity: '45 kW' },
    { district: 'Reasi', total: 2, installed: 0, pending: 0, capacity: '30 kW' },
  ], []);

  // Vendor wise data
  const vendorData = useMemo(() => [
    { vendor: 'utkarsh (Utkarsh Solar Systems)', assigned: 2, installed: 2, verified: 1, amount: '₹28,00,000' },
    { vendor: 'Jammu TEsting (Jammu Renewable Developers)', assigned: 1, installed: 1, verified: 1, amount: '₹22,00,000' },
    { vendor: 'bharti (Bharti Clean Energy)', assigned: 1, installed: 1, verified: 1, amount: '₹8,50,000' },
    { vendor: 'Ajay sharma (ID: 42)', assigned: 1, installed: 0, verified: 0, amount: '—' },
  ], []);

  const filteredDistricts = useMemo(() => {
    const q = districtQuery.trim().toLowerCase();
    if (!q) return districtData;
    return districtData.filter((d) => d.district.toLowerCase().includes(q));
  }, [districtData, districtQuery]);

  const filteredVendors = useMemo(() => {
    const q = vendorQuery.trim().toLowerCase();
    if (!q) return vendorData;
    return vendorData.filter((v) => v.vendor.toLowerCase().includes(q));
  }, [vendorData, vendorQuery]);

  const pagedDistricts = usePagination(filteredDistricts, { initialPageSize: 10 });
  const pagedVendors = usePagination(filteredVendors, { initialPageSize: 10 });

  // Export columns
  const distCols: ExportColumn<typeof districtData[0]>[] = [
    { header: 'District', accessor: 'district' },
    { header: 'Allocated Sites', accessor: 'total' },
    { header: 'Installed', accessor: 'installed' },
    { header: 'Pending Installation', accessor: 'pending' },
    { header: 'Total Capacity', accessor: 'capacity' },
  ];

  const vendorCols: ExportColumn<typeof vendorData[0]>[] = [
    { header: 'Vendor Name', accessor: 'vendor' },
    { header: 'Assigned Sites', accessor: 'assigned' },
    { header: 'Installed Sites', accessor: 'installed' },
    { header: 'Verified Sites', accessor: 'verified' },
    { header: 'Claimed Value', accessor: 'amount' },
  ];

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      {/* Page Header */}
      <PageHead
        title="Jammu RESCO Installation Dashboard"
        subtitle="Operational oversight of rooftop RESCO project milestones, feasibility audits, net-metering synchronization, and billing across Jammu & Kashmir."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Jammu', href: '/vendor-management/jammu' },
          { label: 'RESCO Installation Dashboard' },
        ]}
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <Link
              to="/vendor-management/jammu/installation/resco/assign-installation"
              className="ax-btn ax-btn--primary ax-btn--sm"
            >
              Assign Resco Sites
            </Link>
            <Link
              to="/vendor-management/jammu/installation/resco/view-assign-installation"
              className="ax-btn ax-btn--secondary ax-btn--sm"
            >
              View Assigned Sites
            </Link>
          </div>
        }
      />

      {/* Top 5 KPI Cards */}
      <div className="asw-cards-row">
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 15, height: 15 }}>
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          }
          tone="accent"
          label="Total Rooftop Sites"
          value={totalSites}
          sub={`Assigned: ${assignedSites} | Unassigned: ${unassignedSites}`}
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 15, height: 15 }}>
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          }
          tone="cyan"
          label="Installed Sites"
          value={installedComplete}
          sub={`Pending: ${installedPending} sites in progress`}
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 15, height: 15 }}>
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
          tone="amber"
          label="Verification Pending"
          value={verifyPending}
          sub="Awaiting Admin QA inspection"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 15, height: 15 }}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
          tone="emerald"
          label="Verified Approved"
          value={verifyApproved}
          sub="Passed CEIG & QA checks"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 15, height: 15 }}>
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
          tone="violet"
          label="Commissioned Capacity"
          value="425 kW"
          sub="Grid synchronized RESCO assets"
        />
      </div>

      {/* Analytics Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: 20, marginBottom: 24 }}>
        {/* Chart 1: District Allocation */}
        <div className="ax-card" style={{ padding: 18, borderRadius: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 4 }}>
            District-wise RESCO Capacity Allocation
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>
            Cumulative kilowatt capacity under installation across primary J&K districts
          </div>
          <Suspense fallback={<div style={{ height: chartH, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading Chart...</div>}>
            <ApexChart
              type="bar"
              height={chartH}
              series={[
                { name: 'Capacity (kW)', data: [95, 65, 115, 75, 45, 30] },
              ]}
              options={{
                chart: { toolbar: { show: false } },
                colors: [LIGHT_BLUE],
                plotOptions: { bar: { borderRadius: 4, columnWidth: '45%' } },
                xaxis: { categories: ['Jammu', 'Kathua', 'Samba', 'Udhampur', 'Rajouri', 'Reasi'] },
                yaxis: { title: { text: 'kW' } },
                dataLabels: { enabled: false },
              }}
            />
          </Suspense>
        </div>

        {/* Chart 2: Milestone Completion Velocity */}
        <div className="ax-card" style={{ padding: 18, borderRadius: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 4 }}>
            Monthly Installation Velocity (Rooftop Commissioning)
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>
            Completed solar sites vs QA verified sites over the last quarters
          </div>
          <Suspense fallback={<div style={{ height: chartH, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading Chart...</div>}>
            <ApexChart
              type="area"
              height={chartH}
              series={[
                { name: 'Sites Commissioned', data: [1, 2, 3, 4] },
                { name: 'QA Verified', data: [0, 1, 2, 3] },
              ]}
              options={{
                chart: { toolbar: { show: false } },
                colors: [LIGHT_BLUE, LIGHT_GREEN],
                stroke: { curve: 'smooth', width: 2 },
                xaxis: { categories: ['Nov 2025', 'Dec 2025', 'Jan 2026', 'Feb 2026'] },
                dataLabels: { enabled: false },
              }}
            />
          </Suspense>
        </div>
      </div>

      {/* District-wise & Vendor-wise Tables Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: 20 }}>
        {/* District Wise Table */}
        <div className="ax-card" style={{ borderRadius: 12, overflow: 'hidden' }}>
          <div className="ax-card__header" style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0' }}>
            <div className="ax-card__titles">
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>District-Wise RESCO Progress</h3>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748b' }}>Sites installed by district</p>
            </div>
            <div className="ax-card__actions">
              <SearchInput value={districtQuery} onChange={setDistrictQuery} placeholder="Search district..." size="sm" />
            </div>
          </div>
          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover" style={{ width: '100%', fontSize: 12 }}>
              <thead>
                <tr>
                  <th className="ax-table__th">District</th>
                  <th className="ax-table__th">Allocated Sites</th>
                  <th className="ax-table__th">Installed</th>
                  <th className="ax-table__th">Pending</th>
                  <th className="ax-table__th">Capacity</th>
                </tr>
              </thead>
              <tbody>
                {pagedDistricts.paged.map((row) => (
                  <tr key={row.district}>
                    <td className="ax-table__td" style={{ fontWeight: 600 }}>{row.district}</td>
                    <td className="ax-table__td">{row.total}</td>
                    <td className="ax-table__td" style={{ color: '#16a34a', fontWeight: 600 }}>{row.installed}</td>
                    <td className="ax-table__td" style={{ color: '#d97706', fontWeight: 600 }}>{row.pending}</td>
                    <td className="ax-table__td" style={{ fontWeight: 700 }}>{row.capacity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Vendor Wise Table */}
        <div className="ax-card" style={{ borderRadius: 12, overflow: 'hidden' }}>
          <div className="ax-card__header" style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0' }}>
            <div className="ax-card__titles">
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Contracted EPC Vendor Performance</h3>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748b' }}>Assigned vs verified installations</p>
            </div>
            <div className="ax-card__actions">
              <SearchInput value={vendorQuery} onChange={setVendorQuery} placeholder="Search vendor..." size="sm" />
            </div>
          </div>
          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover" style={{ width: '100%', fontSize: 12 }}>
              <thead>
                <tr>
                  <th className="ax-table__th">Vendor</th>
                  <th className="ax-table__th">Assigned</th>
                  <th className="ax-table__th">Installed</th>
                  <th className="ax-table__th">Verified</th>
                  <th className="ax-table__th">Disbursed</th>
                </tr>
              </thead>
              <tbody>
                {pagedVendors.paged.map((row) => (
                  <tr key={row.vendor}>
                    <td className="ax-table__td" style={{ fontWeight: 600, color: '#0f172a' }}>{row.vendor}</td>
                    <td className="ax-table__td">{row.assigned}</td>
                    <td className="ax-table__td" style={{ color: '#16a34a', fontWeight: 600 }}>{row.installed}</td>
                    <td className="ax-table__td" style={{ color: '#2559bf', fontWeight: 600 }}>{row.verified}</td>
                    <td className="ax-table__td" style={{ fontWeight: 700 }}>{row.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RescoDashboard;
