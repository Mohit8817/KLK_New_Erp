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
  jammuSrt70mwAdminService,
  resolveJammuMediaUrl,
  type JammuSrtSiteRow,
} from './jammuSrt70mwAdminService';
import {
  TABLE_PAGE_CSS,
  OVERLAY_CSS,
  actionsRowStyle,
  footerStyle,
  centerCell,
  Modal,
  KpiCard,
  MediaFileThumbnail,
  MediaLightbox,
  StatusFeedbackBanners,
  fmtDate,
  fmtNum,
  parseStringArray,
  DASH,
  copyRowsToClipboard,
  exportRowsCSV,
  exportRowsExcel,
  exportRowsPDF,
} from '../../../up/Installation/upInstallationShared';

const JAMMU_SRT_STATUS_OPTIONS = [
  { key: 'total', label: 'All Sites' },
  { key: 'site_assigned', label: 'Assigned Sites' },
  { key: 'site_not_assigned', label: 'Unassigned Sites' },
  { key: 'material_dispatch', label: 'Material Dispatched' },
  { key: 'material_pending', label: 'Material Pending' },
  { key: 'complete', label: 'Installed Sites' },
  { key: 'pending', label: 'Installation Pending' },
  { key: 'verify_approved', label: 'Verify Approved' },
  { key: 'verify_pending', label: 'Verify Pending' },
  { key: 'verify_reject', label: 'Verify Rejected' },
  { key: 'claim_applicable', label: 'Claim Applicable' },
  { key: 'claim_raised', label: 'Claim Raised' },
  { key: 'inst_doc_complete', label: 'Documents Approved' },
  { key: 'inst_pay80_complete', label: '80% Payment Complete' },
  { key: 'inst_pay20_complete', label: '20% Payment Complete' },
  { key: 'inst_pay80_pending', label: '80% Payment Pending' },
  { key: 'inst_pay20_pending', label: '20% Payment Pending' },
];

const QUICK_STATUS_PILLS = [
  { key: 'total', label: 'All Sites' },
  { key: 'site_assigned', label: 'Assigned' },
  { key: 'complete', label: 'Installed' },
  { key: 'pending', label: 'Pending' },
  { key: 'verify_approved', label: 'Verify Approved' },
  { key: 'verify_pending', label: 'In Audit' },
  { key: 'claim_raised', label: 'Claim Raised' },
  { key: 'inst_pay80_complete', label: '80% Paid' },
  { key: 'inst_pay20_complete', label: '20% Paid' },
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
  if (n === 3) return 'Reject';
  if (n === 1) return 'Claimed';
  return 'Pending';
}

function getPaymentStatusLabel(status: unknown): string {
  return Number(status ?? 0) === 1 ? 'Paid' : 'Pending';
}

export function StatusView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get('status') || 'total';
  const mode = searchParams.get('mode') as 'vendor' | 'district' | null;
  const value = searchParams.get('value') || searchParams.get('district') || searchParams.get('vendor') || '';
  const customLabel = searchParams.get('label') || '';

  const [rows, setRows] = useState<JammuSrtSiteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');

  // Module / Panel Serial Search Modal & Media Lightbox
  const [panelModalSite, setPanelModalSite] = useState<JammuSrtSiteRow | null>(null);
  const [panelSearch, setPanelSearch] = useState('');
  const [lightbox, setLightbox] = useState<{ url: string; title?: string } | null>(null);

  // Fetch live rows from backend (Zero fake data)
  const fetchRows = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      let data: JammuSrtSiteRow[] = [];
      const backendStatus = (status || 'total').replace(/_/g, '-');
      if (mode === 'vendor' && value) {
        const res = await jammuSrt70mwAdminService.getVendorwiseData(backendStatus, value);
        data = res.jammusrt70mw || [];
      } else if (mode === 'district' && value) {
        const res = await jammuSrt70mwAdminService.getDistrictwiseData(backendStatus, value);
        data = res.jammusrt70mw || [];
      } else {
        const res = await jammuSrt70mwAdminService.getViewDashboard(backendStatus);
        data = res.jammusrt70mw || [];
      }
      setRows(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('StatusView fetch error:', err);
      setRows([]);
      setErrorMsg(err?.message || 'Failed to load Jammu SRT 70MW status drill-down data.');
    } finally {
      setLoading(false);
    }
  }, [status, mode, value]);

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
      const serials = parseStringArray(r.panel_no).join(' ');
      const hay = [
        r.id,
        r.state,
        r.department_name,
        r.dept_name,
        r.district,
        r.location,
        r.address,
        r.site_name,
        r.site_code,
        r.firm_name,
        r.work_order_no,
        r.loa_no,
        r.ca_no,
        r.vendor_name,
        r.vendors?.name,
        r.contact_person,
        r.contact_person_phone,
        r.contact_number,
        r.solar_meter_no,
        r.inverter_no,
        r.net_smart_meter_no,
        r.nm_sm_no,
        serials,
        r.loger_no,
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
    let docApproved = 0;
    let paid = 0;
    rows.forEach((r) => {
      const isInst = Number(r.site_inst_status ?? r.inst_status ?? 0) === 1;
      if (isInst) installed += 1;
      const vs = Number(r.inst_verify_status ?? 0);
      if (vs === 1) verifyApproved += 1;
      else if (vs === 0 && isInst) verifyPending += 1;
      if (Number(r.inst_doc_submit ?? r.inst_doc_status ?? 0) === 2) docApproved += 1;
      if (Number(r.inst_pay80_status ?? 0) === 1 || Number(r.inst_pay20_status ?? 0) === 1) paid += 1;
    });
    return {
      total: rows.length,
      installed,
      pendingInstall: Math.max(0, rows.length - installed),
      verifyApproved,
      verifyPending,
      docApproved,
      paid,
    };
  }, [rows]);

  const exportCols = useMemo<ExportColumn<JammuSrtSiteRow>[]>(
    () => [
      { header: 'Sr. No.', accessor: ((_r: JammuSrtSiteRow, idx?: number) => (idx !== undefined ? idx + 1 : '')) as any },
      { header: 'State', accessor: () => 'JAMMU' },
      { header: 'Vendor Name', accessor: (r) => r.vendor_name || r.vendors?.name || (r.inst_vendor ? `Vendor #${r.inst_vendor}` : DASH) },
      { header: 'District', accessor: (r) => r.district || DASH },
      { header: 'Department Name', accessor: (r) => r.department_name || r.dept_name || DASH },
      { header: 'Site / Building Name', accessor: (r) => r.site_name || DASH },
      { header: 'Site Code', accessor: (r) => r.site_code || DASH },
      { header: 'CA No.', accessor: (r) => r.ca_no || DASH },
      { header: 'Sanction Load', accessor: (r) => (r.sanction_load ? `${r.sanction_load} kW` : DASH) },
      { header: 'Contact Person', accessor: (r) => r.contact_person || DASH },
      { header: 'Contact Phone', accessor: (r) => r.contact_person_phone || r.contact_number || DASH },
      { header: 'Solar Meter No.', accessor: (r) => r.solar_meter_no || r.solarmeter_no || DASH },
      { header: 'Inverter No.', accessor: (r) => r.inverter_no || DASH },
      { header: 'Net Meter No.', accessor: (r) => r.net_smart_meter_no || r.nm_sm_no || DASH },
      { header: 'Panel No.', accessor: (r) => parseStringArray(r.panel_no).join(', ') || DASH },
      { header: 'Logger No.', accessor: (r) => r.loger_no || DASH },
      { header: 'Inst. Remarks', accessor: (r) => r.inst_remarks || DASH },
      { header: 'Installation Date', accessor: (r) => fmtDate(r.inst_date || r.installation_date) },
      { header: 'Installation Status', accessor: (r) => getInstStatusLabel(r.site_inst_status ?? r.inst_status) },
      { header: 'Verify Date', accessor: (r) => fmtDate(r.inst_verify_date) },
      { header: 'Verify Status', accessor: (r) => getVerifyStatusLabel(r.inst_verify_status) },
      { header: 'Documents Status', accessor: (r) => getDocStatusLabel(r.inst_doc_submit ?? r.inst_doc_status) },
      { header: 'Claim Status', accessor: (r) => getClaimStatusLabel(r.inst_claim_status) },
      { header: 'Payment 80%', accessor: (r) => getPaymentStatusLabel(r.inst_pay80_status) },
      { header: 'Payment 20%', accessor: (r) => getPaymentStatusLabel(r.inst_pay20_status) },
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
    setSearchParams(next);
  };

  const modalAllSerials = useMemo(
    () => (panelModalSite ? parseStringArray(panelModalSite.panel_no) : []),
    [panelModalSite]
  );

  const modalFilteredSerials = useMemo(() => {
    const q = panelSearch.trim().toLowerCase();
    return modalAllSerials
      .map((serial, index) => ({ serial, index: index + 1 }))
      .filter((item) => !q || item.serial.toLowerCase().includes(q) || String(item.index) === q);
  }, [modalAllSerials, panelSearch]);

  const titleLabel =
    customLabel ||
    JAMMU_SRT_STATUS_OPTIONS.find((o) => o.key === status || o.key === status.replace(/-/g, '_') || o.key === status.replace(/_/g, '-'))?.label ||
    `Status: ${status}`;
  const stamp = new Date().toISOString().slice(0, 10);

  return (
    <div className="solar-erp-page">
      <style>{TABLE_PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      <PageHead
        title="View Jammu SRT 70MW Installation"
        subtitle={
          mode && value
            ? `${titleLabel} · Filtered by ${mode}: ${value}`
            : `Jammu SRT 70MW Installation Status Register · ${titleLabel}`
        }
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Jammu' },
          { label: 'SRT 70MW Dashboard', href: '/vendor-management/jammu/installation/srt-70mw/dashboard' },
          { label: 'View Jammu SRT 70MW Installation' },
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
            <Link to="/vendor-management/jammu/installation/srt-70mw/dashboard" className="ax-btn ax-btn--primary ax-btn--sm">
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
          label="Docs & Payment"
          value={`${fmtNum(metrics.docApproved)} / ${fmtNum(metrics.paid)}`}
          sub="Docs Approved / Paid"
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
            <h2 className="ax-card__title">View Jammu SRT 70MW Installation</h2>
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
                {JAMMU_SRT_STATUS_OPTIONS.map((opt) => (
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
                placeholder="Search vendor, site, code, meter..."
                size="sm"
              />
              <TableExportToolbar
                onCopy={() => copyRowsToClipboard(filteredRows, exportCols)}
                onExportCSV={() => exportRowsCSV(filteredRows, exportCols, `View_Jammu_SRT70MW_${status}_${stamp}`)}
                onExportExcel={() => exportRowsExcel(filteredRows, exportCols, `View_Jammu_SRT70MW_${status}_${stamp}`)}
                onExportPDF={() => exportRowsPDF(filteredRows, exportCols, `View Jammu SRT 70MW Installation — ${titleLabel}`)}
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
                <th className="ax-table__th">Department Name</th>
                <th className="ax-table__th">Site / Building Name</th>
                <th className="ax-table__th">Site Code</th>
                <th className="ax-table__th">CA No.</th>
                <th className="ax-table__th">Sanction Load</th>
                <th className="ax-table__th">Contact Person</th>
                <th className="ax-table__th">Solar Meter No.</th>
                <th className="ax-table__th">Inverter No.</th>
                <th className="ax-table__th">Net Meter No.</th>
                <th className="ax-table__th">Panel Serial No.</th>
                <th className="ax-table__th">Logger No.</th>
                <th className="ax-table__th">System Image</th>
                <th className="ax-table__th">Inverter Image</th>
                <th className="ax-table__th">Panel Image</th>
                <th className="ax-table__th">Net Meter Image</th>
                <th className="ax-table__th">Logger Image</th>
                <th className="ax-table__th">Inst. Remarks</th>
                <th className="ax-table__th">Installation Date</th>
                <th className="ax-table__th">Installation Status</th>
                <th className="ax-table__th">Verify Date</th>
                <th className="ax-table__th">Verify Status</th>
                <th className="ax-table__th">Documents Status</th>
                <th className="ax-table__th">Claim Status</th>
                <th className="ax-table__th">Payment 80%</th>
                <th className="ax-table__th">Payment 20%</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={29} style={centerCell}>
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading Jammu SRT 70MW records...
                  </td>
                </tr>
              ) : pagination.paged.length === 0 ? (
                <tr>
                  <td colSpan={29} style={centerCell}>
                    <TableEmptyState title="No sites found" description="No Jammu SRT 70MW sites match this status or search filter." />
                  </td>
                </tr>
              ) : (
                pagination.paged.map((row, idx) => {
                  const globalIdx = (pagination.curPage - 1) * pagination.pageSize + idx + 1;
                  const serials = parseStringArray(row.panel_no);
                  const instDone = Number(row.site_inst_status ?? row.inst_status ?? 0) === 1;
                  const verifyCode = Number(row.inst_verify_status ?? 0);
                  const docCode = Number(row.inst_doc_submit ?? row.inst_doc_status ?? 0);
                  const claimCode = Number(row.inst_claim_status ?? 0);
                  const pay80Code = Number(row.inst_pay80_status ?? 0);
                  const pay20Code = Number(row.inst_pay20_status ?? 0);

                  const sysImg = row.system_image;
                  const invImg = row.inverter_image;
                  const panImg = row.panel_image;
                  const netImg = row.net_smart_meter_image || row.nm_sm_image;
                  const logImg = row.loger_image;

                  return (
                    <tr key={row.id || idx}>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{globalIdx}</td>
                      <td className="ax-table__td">JAMMU</td>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>
                        {row.vendor_name || row.vendors?.name || (row.inst_vendor ? `Vendor #${row.inst_vendor}` : DASH)}
                      </td>
                      <td className="ax-table__td">{row.district || DASH}</td>
                      <td className="ax-table__td" style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {row.department_name || row.dept_name || DASH}
                      </td>
                      <td className="ax-table__td" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 600 }}>
                        {row.site_name || DASH}
                      </td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {row.site_code || DASH}
                      </td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {row.ca_no || DASH}
                      </td>
                      <td className="ax-table__td">
                        {row.sanction_load ? `${row.sanction_load} kW` : DASH}
                      </td>
                      <td className="ax-table__td">
                        <div>{row.contact_person || DASH}</div>
                        {(row.contact_person_phone || row.contact_number) && (
                          <div style={{ fontSize: 11, color: '#64748b' }}>{row.contact_person_phone || row.contact_number}</div>
                        )}
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
                      <td className="ax-table__td">
                        {serials.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {serials.slice(0, 2).map((s, i) => (
                              <span
                                key={i}
                                style={{
                                  fontFamily: 'monospace',
                                  fontSize: 10.5,
                                  background: '#f1f5f9',
                                  padding: '1px 5px',
                                  borderRadius: 4,
                                }}
                              >
                                {s}
                              </span>
                            ))}
                            {serials.length > 2 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setPanelModalSite(row);
                                  setPanelSearch('');
                                }}
                                style={{
                                  fontSize: 10,
                                  color: '#2563eb',
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  padding: 0,
                                  fontWeight: 600,
                                }}
                              >
                                +{serials.length - 2} more (Search)
                              </button>
                            )}
                          </div>
                        ) : (
                          DASH
                        )}
                      </td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {row.loger_no || DASH}
                      </td>
                      <td className="ax-table__td">
                        <MediaFileThumbnail
                          url={sysImg ? resolveJammuMediaUrl(sysImg) : null}
                          alt="System Image"
                          onClick={(url, title) => setLightbox({ url, title: title || 'System Image' })}
                        />
                      </td>
                      <td className="ax-table__td">
                        <MediaFileThumbnail
                          url={invImg ? resolveJammuMediaUrl(invImg) : null}
                          alt="Inverter Image"
                          onClick={(url, title) => setLightbox({ url, title: title || 'Inverter Image' })}
                        />
                      </td>
                      <td className="ax-table__td">
                        <MediaFileThumbnail
                          url={panImg ? resolveJammuMediaUrl(panImg) : null}
                          alt="Panel Image"
                          onClick={(url, title) => setLightbox({ url, title: title || 'Panel Image' })}
                        />
                      </td>
                      <td className="ax-table__td">
                        <MediaFileThumbnail
                          url={netImg ? resolveJammuMediaUrl(netImg) : null}
                          alt="Net Meter Image"
                          onClick={(url, title) => setLightbox({ url, title: title || 'Net Meter Image' })}
                        />
                      </td>
                      <td className="ax-table__td">
                        <MediaFileThumbnail
                          url={logImg ? resolveJammuMediaUrl(logImg) : null}
                          alt="Logger Image"
                          onClick={(url, title) => setLightbox({ url, title: title || 'Logger Image' })}
                        />
                      </td>
                      <td
                        className="ax-table__td"
                        style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}
                        title={row.inst_remarks || ''}
                      >
                        {row.inst_remarks || DASH}
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
                          <span className="ax-badge ax-badge--soft ax-badge--danger">Reject</span>
                        ) : claimCode === 1 ? (
                          <span className="ax-badge ax-badge--soft ax-badge--info">Claimed</span>
                        ) : (
                          <span className="ax-badge ax-badge--soft ax-badge--warning">Pending</span>
                        )}
                      </td>
                      <td className="ax-table__td">
                        {pay80Code === 1 ? (
                          <span className="ax-badge ax-badge--soft ax-badge--success">Paid</span>
                        ) : (
                          <span className="ax-badge ax-badge--soft ax-badge--warning">Pending</span>
                        )}
                      </td>
                      <td className="ax-table__td">
                        {pay20Code === 1 ? (
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

      {/* Module / Panel Serial Number Search Modal */}
      <Modal
        open={Boolean(panelModalSite)}
        onClose={() => {
          setPanelModalSite(null);
          setPanelSearch('');
        }}
        title="Panel Serial Numbers"
        subtitle={
          panelModalSite
            ? `Site #${panelModalSite.id} • ${panelModalSite.site_name || ''} • Code: ${panelModalSite.site_code || ''}`
            : ''
        }
        maxWidth={640}
        footer={
          <button
            type="button"
            className="ax-btn ax-btn--primary"
            onClick={() => {
              setPanelModalSite(null);
              setPanelSearch('');
            }}
          >
            Close
          </button>
        }
      >
        {panelModalSite && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
              <span className="ax-badge ax-badge--soft ax-badge--info" style={{ fontSize: 11 }}>
                {panelSearch.trim()
                  ? `Showing ${modalFilteredSerials.length} of ${modalAllSerials.length}`
                  : `${modalAllSerials.length} Panel(s)`}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: '1 1 220px', maxWidth: 320 }}>
                <input
                  type="text"
                  className="ax-input ax-input--sm"
                  value={panelSearch}
                  onChange={(e) => setPanelSearch(e.target.value)}
                  placeholder="Search panel serial no..."
                  aria-label="Search panel serial number"
                  style={{ width: '100%', height: 32, fontSize: 12 }}
                />
                {panelSearch && (
                  <button
                    type="button"
                    className="ax-btn ax-btn--ghost ax-btn--xs"
                    onClick={() => setPanelSearch('')}
                    style={{ height: 32, padding: '0 8px' }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {modalFilteredSerials.length === 0 ? (
              <div style={{ fontSize: 12, color: '#64748b', padding: '12px 0' }}>
                No panel serial matches <b>"{panelSearch}"</b>.
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 280, overflowY: 'auto' }}>
                {modalFilteredSerials.map(({ serial, index }) => (
                  <span
                    key={`${index}-${serial}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      fontFamily: 'monospace',
                      fontSize: 12,
                      background: '#f8fafc',
                      padding: '4px 10px',
                      borderRadius: 6,
                      border: '1px solid #cbd5e1',
                      color: '#0f172a',
                    }}
                  >
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#2563eb' }}>#{index}</span>
                    <span>{serial}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      <MediaLightbox url={lightbox?.url || null} title={lightbox?.title} onClose={() => setLightbox(null)} />
    </div>
  );
}

export default StatusView;
