import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  Pagination,
  usePagination,
  SearchInput,
  TableExportToolbar,
  TableEmptyState,
  type ExportColumn,
} from '../../../../../common';
import {
  jammuRescoAdminService,
  resolveJammuRescoMediaUrl,
  type RescoSiteRow,
} from './jammuRescoAdminService';
import {
  TABLE_PAGE_CSS,
  OVERLAY_CSS,
  actionsRowStyle,
  footerStyle,
  centerCell,
  KpiCard,
  MediaFileThumbnail,
  MediaLightbox,
  StatusFeedbackBanners,
  fmtDate,
  fmtNum,
  DASH,
  copyRowsToClipboard,
  exportRowsCSV,
  exportRowsExcel,
  exportRowsPDF,
} from '../../../up/Installation/upInstallationShared';

export const JAMMU_RESCO_STATUS_OPTIONS = [
  { key: 'total', label: 'All Sites' },
  { key: 'assigned', label: 'Assigned Sites' },
  { key: 'not-assigned', label: 'Unassigned Sites' },
  { key: 'complete', label: 'Installed Sites' },
  { key: 'pending', label: 'Installation Pending' },
  { key: 'verify-approved', label: 'Verify Approved' },
  { key: 'verify-pending', label: 'Verify Pending' },
  { key: 'verify-reject', label: 'Verify Rejected' },
  { key: 'doc-approved', label: 'Document Approved' },
  { key: 'doc-pending', label: 'Document Pending' },
  { key: 'doc-reject', label: 'Document Rejected' },
  { key: 'inst-claim1-pending', label: 'Claim 1 Pending' },
  { key: 'inst-claim1-approved', label: 'Claim 1 Approved' },
  { key: 'inst-claim1-reject', label: 'Claim 1 Rejected' },
  { key: 'inst-claim2-pending', label: 'Claim 2 Pending' },
  { key: 'inst-claim2-approved', label: 'Claim 2 Approved' },
  { key: 'inst-claim2-reject', label: 'Claim 2 Rejected' },
  { key: 'inst-claim3-pending', label: 'Claim 3 Pending' },
  { key: 'inst-claim3-approved', label: 'Claim 3 Approved' },
  { key: 'inst-claim3-reject', label: 'Claim 3 Rejected' },
  { key: 'inst-pay1-complete', label: 'Payment 1 Complete' },
  { key: 'inst-pay1-partially', label: 'Payment 1 Partially' },
  { key: 'inst-pay1-pending', label: 'Payment 1 Pending' },
  { key: 'inst-pay2-complete', label: 'Payment 2 Complete' },
  { key: 'inst-pay2-partially', label: 'Payment 2 Partially' },
  { key: 'inst-pay2-pending', label: 'Payment 2 Pending' },
  { key: 'inst-pay3-complete', label: 'Payment 3 Complete' },
  { key: 'inst-pay3-partially', label: 'Payment 3 Partially' },
  { key: 'inst-pay3-pending', label: 'Payment 3 Pending' },
];

const QUICK_STATUS_PILLS = [
  { key: 'total', label: 'All Sites' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'complete', label: 'Installed' },
  { key: 'pending', label: 'Pending' },
  { key: 'verify-approved', label: 'Verify Approved' },
  { key: 'verify-pending', label: 'In Audit' },
  { key: 'doc-approved', label: 'Doc Approved' },
  { key: 'inst-claim1-approved', label: 'Claim 1 Approved' },
  { key: 'inst-pay1-complete', label: 'Payment 1 Settled' },
];

function getInstStatusLabel(status: unknown): string {
  return Number(status ?? 0) === 1 ? 'Complete' : 'Pending';
}

function getVerifyStatusLabel(status: unknown): string {
  const n = Number(status ?? 0);
  if (n === 1) return 'Approved';
  if (n === 2) return 'Rejected';
  return 'Pending';
}

function getDocStatusLabel(status: unknown): string {
  const n = Number(status ?? 0);
  if (n === 2) return 'Approved';
  if (n === 3) return 'Rejected';
  if (n === 1) return 'Pending';
  return 'Not Submitted';
}

function getClaimStatusLabel(status: unknown): string {
  const n = Number(status ?? 0);
  if (n === 2) return 'Approved';
  if (n === 3) return 'Rejected';
  if (n === 1) return 'Pending';
  return 'Not Raised';
}

function getPaymentStatusLabel(status: unknown): string {
  const n = Number(status ?? 0);
  if (n === 1) return 'Complete';
  if (n === 2) return 'Partially';
  return 'Pending';
}

export function StatusView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get('status') || 'total';
  const mode = searchParams.get('mode') as 'vendor' | 'district' | null;
  const value = searchParams.get('value') || searchParams.get('district') || searchParams.get('vendor') || '';
  const volume = searchParams.get('volume') || 'all';
  const customLabel = searchParams.get('label') || '';

  const [rows, setRows] = useState<RescoSiteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');

  // Media Lightbox
  const [lightbox, setLightbox] = useState<{ url: string; title?: string } | null>(null);

  // Fetch live rows from backend (Zero fake data)
  const fetchRows = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      let data: RescoSiteRow[] = [];
      const backendStatus = (status || 'total').replace(/_/g, '-');
      if (mode === 'vendor' && value) {
        data = await jammuRescoAdminService.getVendorwiseData(backendStatus, value, volume);
      } else if (mode === 'district' && value) {
        data = await jammuRescoAdminService.getDistrictwiseData(backendStatus, value, volume);
      } else {
        data = await jammuRescoAdminService.getViewDashboard(backendStatus, volume);
      }
      setRows(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('RESCO StatusView fetch error:', err);
      setRows([]);
      setErrorMsg(err?.message || 'Failed to load Jammu RESCO status drill-down data.');
    } finally {
      setLoading(false);
    }
  }, [status, mode, value, volume]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  // Distinct districts for local quick filtering
  const districtOptions = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => {
      const d = String(r.district || '').trim();
      if (d) set.add(d);
    });
    return Array.from(set).sort();
  }, [rows]);

  const filteredRows = useMemo(() => {
    let list = rows;
    if (districtFilter !== 'all') {
      list = list.filter((r) => String(r.district || '').trim().toLowerCase() === districtFilter.toLowerCase());
    }
    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter((r) => {
      const hay = [
        r.id,
        r.unique_id,
        r.uid,
        r.state,
        r.district,
        r.block,
        r.tehsil,
        r.panchayat,
        r.village,
        r.address,
        r.location,
        r.vendor_name,
        typeof r.vendors === 'object' ? r.vendors?.name : r.vendors,
        r.site_name,
        r.farmer_name,
        r.beneficiary_name,
        r.contact_person,
        r.contact_no,
        r.contact_number,
        r.phone,
        r.contact_person_phone,
        r.solar_meter_no,
        r.solarmeter_no,
        r.inverter_no,
        r.net_smart_meter_no,
        r.nm_sm_no,
        r.panel_no,
        r.module_no,
        r.loger_no,
        r.ca_no,
        r.site_code,
        r.inst_remarks,
        r.inst_date,
        r.installation_date,
        r.inst_verify_date,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [rows, districtFilter, searchQuery]);

  const pagination = usePagination(filteredRows, { initialPageSize: 50 });

  // KPI metrics calculated from current dataset
  const metrics = useMemo(() => {
    let installed = 0;
    let verifyApproved = 0;
    let verifyPending = 0;
    let claimApproved = 0;
    let paid = 0;
    rows.forEach((r) => {
      const isInst = Number(r.inst_status ?? 0) === 1;
      if (isInst) installed += 1;
      const vs = Number(r.verify_status ?? r.inst_verify_status ?? 0);
      if (vs === 1) verifyApproved += 1;
      else if (vs === 0 && isInst) verifyPending += 1;
      if (Number(r.inst_claim1_status ?? 0) === 2 || Number(r.inst_claim_status ?? 0) === 2) claimApproved += 1;
      if (
        Number(r.inst_pay1_status ?? 0) === 1 ||
        Number(r.inst_pay2_status ?? 0) === 1 ||
        Number(r.inst_pay3_status ?? 0) === 1 ||
        Number(r.inst_pay_status ?? 0) === 1
      ) {
        paid += 1;
      }
    });
    return {
      total: rows.length,
      installed,
      pendingInstall: Math.max(0, rows.length - installed),
      verifyApproved,
      verifyPending,
      claimApproved,
      paid,
    };
  }, [rows]);

  const exportCols = useMemo<ExportColumn<RescoSiteRow>[]>(
    () => [
      { header: 'Sr. No.', accessor: ((_r: RescoSiteRow, idx?: number) => (idx !== undefined ? idx + 1 : '')) as any },
      { header: 'State', accessor: () => 'JAMMU' },
      { header: 'Vendor Name', accessor: (r) => r.vendor_name || (typeof r.vendors === 'object' ? r.vendors?.name : r.vendors) || (r.inst_vendor ? `Vendor #${r.inst_vendor}` : DASH) },
      { header: 'District', accessor: (r) => r.district || DASH },
      { header: 'Block / Tehsil', accessor: (r) => r.block || r.tehsil || DASH },
      { header: 'Panchayat / Village', accessor: (r) => r.panchayat || r.village || DASH },
      { header: 'Site / Building Name', accessor: (r) => r.site_name || r.farmer_name || DASH },
      { header: 'Site Code / UID', accessor: (r) => r.site_code || r.uid || r.unique_id || String(r.id) },
      { header: 'CA No.', accessor: (r) => r.ca_no || DASH },
      { header: 'Sanction Load', accessor: (r) => (r.sanction_load ? `${r.sanction_load} kW` : DASH) },
      { header: 'Beneficiary / Contact', accessor: (r) => r.contact_person || r.beneficiary_name || DASH },
      { header: 'Contact Phone', accessor: (r) => r.contact_no || r.contact_number || r.phone || r.contact_person_phone || DASH },
      { header: 'Solar Meter No.', accessor: (r) => r.solar_meter_no || r.solarmeter_no || DASH },
      { header: 'Inverter No.', accessor: (r) => r.inverter_no || DASH },
      { header: 'Net Meter No.', accessor: (r) => r.net_smart_meter_no || r.nm_sm_no || DASH },
      { header: 'Panel / Module No.', accessor: (r) => r.panel_no || r.module_no || DASH },
      { header: 'Logger No.', accessor: (r) => r.loger_no || DASH },
      { header: 'Installation Date', accessor: (r) => fmtDate(r.inst_date || r.installation_date) },
      { header: 'Installation Status', accessor: (r) => getInstStatusLabel(r.inst_status) },
      { header: 'Verify Date', accessor: (r) => fmtDate(r.inst_verify_date) },
      { header: 'Verify Status', accessor: (r) => getVerifyStatusLabel(r.verify_status ?? r.inst_verify_status) },
      { header: 'Documents Status', accessor: (r) => getDocStatusLabel(r.inst_doc_status) },
      { header: 'Claim Status', accessor: (r) => getClaimStatusLabel(r.inst_claim1_status ?? r.inst_claim_status) },
      { header: 'Payment Status', accessor: (r) => getPaymentStatusLabel(r.inst_pay1_status ?? r.inst_pay_status) },
    ],
    []
  );

  const handleStatusChange = (nextStatus: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('status', nextStatus);
    next.delete('label');
    setSearchParams(next);
    setDistrictFilter('all');
    pagination.setPage(1);
  };

  const clearDrillMode = () => {
    const next = new URLSearchParams();
    next.set('status', status);
    if (volume && volume !== 'all') {
      next.set('volume', volume);
    }
    setSearchParams(next);
  };

  const titleLabel =
    customLabel ||
    JAMMU_RESCO_STATUS_OPTIONS.find((o) => o.key === status || o.key === status.replace(/_/g, '-'))?.label ||
    `Status: ${status}`;
  const stamp = new Date().toISOString().slice(0, 10);

  const vendorDisp = (row: RescoSiteRow) =>
    row.vendor_name ||
    (typeof row.vendors === 'object' ? row.vendors?.name : row.vendors) ||
    (row.inst_vendor ? `Vendor #${row.inst_vendor}` : DASH);

  return (
    <div className="solar-erp-page">
      <style>{TABLE_PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      <PageHead
        title="View Jammu RESCO Installation"
        subtitle={
          mode && value
            ? `${titleLabel} · Filtered by ${mode}: ${value} (Volume: ${volume.toUpperCase()})`
            : `Jammu RESCO Installation Status Register · ${titleLabel} (Volume: ${volume.toUpperCase()})`
        }
        breadcrumbs={[
          { label: 'ERP Dashboard', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Jammu', href: '/vendor-management/jammu' },
          { label: 'Installation', href: '/vendor-management/jammu/installation/resco' },
          { label: 'RESCO', href: '/vendor-management/jammu/installation/resco/dashboard' },
          { label: 'Status Drill-down' },
          { label: 'All Sites — Overview' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={fetchRows}
              disabled={loading}
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
            <Link to="/vendor-management/jammu/installation/resco/dashboard" className="ax-btn ax-btn--primary ax-btn--sm">
              ← Back to Dashboard
            </Link>
          </div>
        }
      />

      <StatusFeedbackBanners
        errorMsg={errorMsg}
        successMsg=""
        onClearError={() => setErrorMsg('')}
        onClearSuccess={() => {}}
      />

      {/* Top KPI Summary Cards */}
      <div className="asw-cards-row">
        <KpiCard
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="2" y="3" width="20" height="14" rx="2" /></svg>}
          tone="accent"
          label="Total Records"
          value={fmtNum(metrics.total)}
          sub={filteredRows.length !== metrics.total ? `${fmtNum(filteredRows.length)} matching filters` : titleLabel}
        />
        <KpiCard
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>}
          tone="emerald"
          label="Installation Status"
          value={`${fmtNum(metrics.installed)} / ${fmtNum(metrics.pendingInstall)}`}
          sub="Complete / Pending"
        />
        <KpiCard
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>}
          tone="cyan"
          label="Verification Status"
          value={`${fmtNum(metrics.verifyApproved)} / ${fmtNum(metrics.verifyPending)}`}
          sub="Approved / Pending"
        />
        <KpiCard
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="5" width="18" height="14" rx="3" /><line x1="3" y1="10" x2="21" y2="10" /></svg>}
          tone="violet"
          label="Claims & Payment"
          value={`${fmtNum(metrics.claimApproved)} / ${fmtNum(metrics.paid)}`}
          sub="Claims Approved / Paid"
        />
      </div>

      {/* Status Switcher Pills */}
      <div className="asw-bifurcation-row">
        <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ax-text-muted)' }}>Status Filter:</span>
        {QUICK_STATUS_PILLS.map((pill) => {
          const isActive = status === pill.key;
          return (
            <button
              key={pill.key}
              type="button"
              className={`asw-pill-btn ${isActive ? 'active ax-btn--primary' : ''}`}
              onClick={() => handleStatusChange(pill.key)}
            >
              {pill.label}
            </button>
          );
        })}
        {mode && value && (
          <button
            type="button"
            className="ax-btn ax-btn--ghost ax-btn--xs"
            onClick={clearDrillMode}
            style={{ marginLeft: 'auto', color: '#dc2626', fontWeight: 600 }}
          >
            Clear {mode}: {value} ×
          </button>
        )}
      </div>

      {/* Main Status View Table Card */}
      <section className="ax-card ax-col--12">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">View Jammu RESCO Installation</h2>
            <p className="ax-card__subtitle">
              Showing <span className="ax-num">{filteredRows.length}</span> of <span className="ax-num">{rows.length}</span> site record(s) · {titleLabel}
            </p>
          </div>
          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              {districtOptions.length > 0 && (
                <select
                  className="ax-input ax-input--sm"
                  style={{ width: 155, height: 32, fontSize: 'var(--ax-text-xs)' }}
                  value={districtFilter}
                  onChange={(e) => {
                    setDistrictFilter(e.target.value);
                    pagination.setPage(1);
                  }}
                  aria-label="Filter by district"
                >
                  <option value="all">All Districts ({districtOptions.length})</option>
                  {districtOptions.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              )}
              <select
                className="ax-input ax-input--sm"
                style={{ width: 185, height: 32, fontSize: 'var(--ax-text-xs)' }}
                value={status}
                onChange={(e) => handleStatusChange(e.target.value)}
                aria-label="Select status view"
              >
                {JAMMU_RESCO_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <SearchInput
                value={searchQuery}
                onChange={(v) => {
                  setSearchQuery(v);
                  pagination.setPage(1);
                }}
                placeholder="Search vendor, site, code, serial, meter..."
                size="sm"
              />
              <TableExportToolbar
                onCopy={() => copyRowsToClipboard(filteredRows, exportCols)}
                onExportCSV={() => exportRowsCSV(filteredRows, exportCols, `View_Jammu_RESCO_${status}_${stamp}`)}
                onExportExcel={() => exportRowsExcel(filteredRows, exportCols, `View_Jammu_RESCO_${status}_${stamp}`)}
                onExportPDF={() => exportRowsPDF(filteredRows, exportCols, `View Jammu RESCO Installation — ${titleLabel}`)}
              />
            </div>
          </div>
        </div>

        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap', minWidth: 2600 }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th">Sr. No.</th>
                <th className="ax-table__th">State</th>
                <th className="ax-table__th">Vendor Name</th>
                <th className="ax-table__th">District</th>
                <th className="ax-table__th">Block / Tehsil</th>
                <th className="ax-table__th">Panchayat / Village</th>
                <th className="ax-table__th">Site / Building Name</th>
                <th className="ax-table__th">Site Code / UID</th>
                <th className="ax-table__th">CA No.</th>
                <th className="ax-table__th">Sanction Load</th>
                <th className="ax-table__th">Beneficiary / Contact</th>
                <th className="ax-table__th">Contact Phone</th>
                <th className="ax-table__th">Solar Meter No.</th>
                <th className="ax-table__th">Inverter No.</th>
                <th className="ax-table__th">Net Meter No.</th>
                <th className="ax-table__th">Panel / Module No.</th>
                <th className="ax-table__th">Logger No.</th>
                <th className="ax-table__th">System Photo</th>
                <th className="ax-table__th">Inverter Photo</th>
                <th className="ax-table__th">Panel Photo</th>
                <th className="ax-table__th">Net Meter Photo</th>
                <th className="ax-table__th">Logger Photo</th>
                <th className="ax-table__th">Installation Date</th>
                <th className="ax-table__th">Installation Status</th>
                <th className="ax-table__th">Verify Date</th>
                <th className="ax-table__th">Verify Status</th>
                <th className="ax-table__th">Documents Status</th>
                <th className="ax-table__th">Claim Status</th>
                <th className="ax-table__th">Payment Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={29} style={centerCell}>
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading Jammu RESCO records...
                  </td>
                </tr>
              ) : pagination.paged.length === 0 ? (
                <tr>
                  <td colSpan={29} style={centerCell}>
                    <TableEmptyState title="No sites found" description="No Jammu RESCO sites match this status or search filter." />
                  </td>
                </tr>
              ) : (
                pagination.paged.map((row, idx) => {
                  const globalIdx = (pagination.curPage - 1) * pagination.pageSize + idx + 1;
                  const instDone = Number(row.inst_status ?? 0) === 1;
                  const verifyCode = Number(row.verify_status ?? row.inst_verify_status ?? 0);
                  const docCode = Number(row.inst_doc_status ?? 0);
                  const claimCode = Number(row.inst_claim1_status ?? row.inst_claim_status ?? 0);
                  const payCode = Number(row.inst_pay1_status ?? row.inst_pay_status ?? 0);

                  const sysImg = row.system_image || row.site_photo || row.building_image;
                  const invImg = row.inverter_image || row.roof_image;
                  const panImg = row.panel_image || row.control_room_image;
                  const netImg = row.net_smart_meter_image || row.nm_sm_image;
                  const logImg = row.loger_image || row.logger_image;

                  return (
                    <tr key={row.id || idx}>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{globalIdx}</td>
                      <td className="ax-table__td">JAMMU</td>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>
                        {vendorDisp(row)}
                      </td>
                      <td className="ax-table__td">{row.district || DASH}</td>
                      <td className="ax-table__td">{row.block || row.tehsil || DASH}</td>
                      <td className="ax-table__td">{row.panchayat || row.village || DASH}</td>
                      <td className="ax-table__td" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 600 }}>
                        {row.site_name || row.farmer_name || DASH}
                      </td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {row.site_code || row.uid || row.unique_id || row.id}
                      </td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {row.ca_no || DASH}
                      </td>
                      <td className="ax-table__td">
                        {row.sanction_load ? `${row.sanction_load} kW` : DASH}
                      </td>
                      <td className="ax-table__td">
                        <div>{row.contact_person || row.beneficiary_name || DASH}</div>
                      </td>
                      <td className="ax-table__td">
                        {(row.contact_no || row.contact_number || row.phone || row.contact_person_phone) ? (
                          <div style={{ fontSize: 12, color: '#334155' }}>
                            {row.contact_no || row.contact_number || row.phone || row.contact_person_phone}
                          </div>
                        ) : DASH}
                      </td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {row.solar_meter_no || row.solarmeter_no || DASH}
                      </td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {row.inverter_no || DASH}
                      </td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {row.net_smart_meter_no || row.nm_sm_no || DASH}
                      </td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {row.panel_no || row.module_no || DASH}
                      </td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {row.loger_no || DASH}
                      </td>
                      <td className="ax-table__td">
                        <MediaFileThumbnail
                          url={sysImg ? resolveJammuRescoMediaUrl(sysImg) : null}
                          alt="System Photo"
                          onClick={(url, title) => setLightbox({ url, title: title || 'System Photo' })}
                        />
                      </td>
                      <td className="ax-table__td">
                        <MediaFileThumbnail
                          url={invImg ? resolveJammuRescoMediaUrl(invImg) : null}
                          alt="Inverter Photo"
                          onClick={(url, title) => setLightbox({ url, title: title || 'Inverter Photo' })}
                        />
                      </td>
                      <td className="ax-table__td">
                        <MediaFileThumbnail
                          url={panImg ? resolveJammuRescoMediaUrl(panImg) : null}
                          alt="Panel Photo"
                          onClick={(url, title) => setLightbox({ url, title: title || 'Panel Photo' })}
                        />
                      </td>
                      <td className="ax-table__td">
                        <MediaFileThumbnail
                          url={netImg ? resolveJammuRescoMediaUrl(netImg) : null}
                          alt="Net Meter Photo"
                          onClick={(url, title) => setLightbox({ url, title: title || 'Net Meter Photo' })}
                        />
                      </td>
                      <td className="ax-table__td">
                        <MediaFileThumbnail
                          url={logImg ? resolveJammuRescoMediaUrl(logImg) : null}
                          alt="Logger Photo"
                          onClick={(url, title) => setLightbox({ url, title: title || 'Logger Photo' })}
                        />
                      </td>
                      <td className="ax-table__td">{fmtDate(row.inst_date || row.installation_date)}</td>
                      <td className="ax-table__td">
                        {instDone ? (
                          <span className="ax-badge ax-badge--soft ax-badge--success">Complete</span>
                        ) : (
                          <span className="ax-badge ax-badge--soft ax-badge--warning">Pending</span>
                        )}
                      </td>
                      <td className="ax-table__td">{fmtDate(row.inst_verify_date)}</td>
                      <td className="ax-table__td">
                        {verifyCode === 1 ? (
                          <span className="ax-badge ax-badge--soft ax-badge--success">Approved</span>
                        ) : verifyCode === 2 ? (
                          <span className="ax-badge ax-badge--soft ax-badge--danger">Rejected</span>
                        ) : (
                          <span className="ax-badge ax-badge--soft ax-badge--warning">Pending</span>
                        )}
                      </td>
                      <td className="ax-table__td">
                        {docCode === 2 ? (
                          <span className="ax-badge ax-badge--soft ax-badge--success">Approved</span>
                        ) : docCode === 3 ? (
                          <span className="ax-badge ax-badge--soft ax-badge--danger">Rejected</span>
                        ) : docCode === 1 ? (
                          <span className="ax-badge ax-badge--soft ax-badge--info">Pending</span>
                        ) : (
                          <span className="ax-badge ax-badge--soft ax-badge--neutral">Not Submitted</span>
                        )}
                      </td>
                      <td className="ax-table__td">
                        {claimCode === 2 ? (
                          <span className="ax-badge ax-badge--soft ax-badge--success">Approved</span>
                        ) : claimCode === 3 ? (
                          <span className="ax-badge ax-badge--soft ax-badge--danger">Rejected</span>
                        ) : claimCode === 1 ? (
                          <span className="ax-badge ax-badge--soft ax-badge--info">Pending</span>
                        ) : (
                          <span className="ax-badge ax-badge--soft ax-badge--neutral">Not Raised</span>
                        )}
                      </td>
                      <td className="ax-table__td">
                        {payCode === 1 ? (
                          <span className="ax-badge ax-badge--soft ax-badge--success">Paid</span>
                        ) : (
                          <span className="ax-badge ax-badge--soft ax-badge--warning">Pending</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="ax-card__footer" style={footerStyle}>
          <div className="ula-pagination-left">
            <Pagination
              currentPage={pagination.curPage}
              totalItems={pagination.totalItems}
              pageSize={pagination.pageSize}
              onPageChange={pagination.setPage}
              onPageSizeChange={pagination.setPageSize}
              pageSizeOptions={[10, 25, 50, 100]}
            />
          </div>
        </div>
      </section>

      <MediaLightbox url={lightbox?.url || null} title={lightbox?.title} onClose={() => setLightbox(null)} />
    </div>
  );
}

export default StatusView;
