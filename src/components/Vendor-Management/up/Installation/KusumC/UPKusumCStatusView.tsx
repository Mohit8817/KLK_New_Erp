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
  upKusumCAdminService,
  resolveUpMediaUrl,
  type UpKusumCSiteRow,
} from '../../up-services';
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
} from '../upInstallationShared';

const KUSUMC_STATUS_OPTIONS = [
  { key: 'total', label: 'All Sites' },
  { key: 'assign', label: 'Assigned & Accepted' },
  { key: 'not-assign', label: 'Unassigned' },
  { key: 'acceptance-pending', label: 'Acceptance Pending' },
  { key: 'installed', label: 'Installed' },
  { key: 'pending-installed', label: 'Installation Pending' },
  { key: 'verify', label: 'Verify Approved' },
  { key: 'verify-pending', label: 'Verify Pending' },
  { key: 'verify-reject', label: 'Verify Rejected' },
  { key: 'claim-applicable', label: 'Claim Applicable' },
  { key: 'claim-raised', label: 'Claim Raised' },
  { key: 'claim-approved', label: 'Claim Approved' },
  { key: 'claim-pending', label: 'Claim Pending' },
  { key: 'claim-reject', label: 'Claim Rejected' },
  { key: 'pay-done', label: 'Payment Complete' },
  { key: 'pay-partially', label: 'Partial Payment' },
  { key: 'pay-pending', label: 'Payment Pending' },
];

const QUICK_STATUS_PILLS = [
  { key: 'total', label: 'All Sites' },
  { key: 'assign', label: 'Assigned' },
  { key: 'not-assign', label: 'Unassigned' },
  { key: 'installed', label: 'Installed' },
  { key: 'pending-installed', label: 'Pending' },
  { key: 'verify', label: 'Verify Approved' },
  { key: 'verify-pending', label: 'Verify Pending' },
  { key: 'claim-raised', label: 'Claims Raised' },
  { key: 'pay-done', label: 'Paid' },
];

function getInverterNo(row: UpKusumCSiteRow): string {
  return String(row.Inverter_no || row.inverter_no || '').trim();
}

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
  if (n === 1) return 'Paid';
  if (n === 2) return 'Partial';
  return 'Pending';
}

export function UPKusumCStatusView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get('status') || 'total';
  const mode = searchParams.get('mode') as 'vendor' | 'district' | 'phase' | null;
  const value = searchParams.get('value') || '';
  const customLabel = searchParams.get('label') || '';

  const [rows, setRows] = useState<UpKusumCSiteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');

  // Module Serial Search Modal & Media Lightbox
  const [moduleModalSite, setModuleModalSite] = useState<UpKusumCSiteRow | null>(null);
  const [moduleSearch, setModuleSearch] = useState('');
  const [lightbox, setLightbox] = useState<{ url: string; title?: string } | null>(null);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      let data: UpKusumCSiteRow[] = [];
      if (mode === 'vendor' && value) {
        data = await upKusumCAdminService.getVendorwiseData(status, value);
      } else if (mode === 'district' && value) {
        data = await upKusumCAdminService.getDistrictwiseData(status, value);
      } else if (mode === 'phase' && value) {
        data = await upKusumCAdminService.getPhasewiseData(status, value);
      } else {
        data = await upKusumCAdminService.getViewDashboard(status);
      }
      setRows(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setRows([]);
      setErrorMsg(err?.message || 'Failed to load Kusum C status drill-down data.');
    } finally {
      setLoading(false);
    }
  }, [status, mode, value]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  // Distinct districts for local quick-filtering
  const districtOptions = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => {
      const d = String(r.f_district || r.district || '').trim();
      if (d) set.add(d);
    });
    return Array.from(set).sort();
  }, [rows]);

  const filteredRows = useMemo(() => {
    let list = rows;
    if (districtFilter !== 'all') {
      list = list.filter((r) => String(r.f_district || r.district || '').trim() === districtFilter);
    }
    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter((r) => {
      const serials = parseStringArray(r.module_serial_no || r.module_no).join(' ');
      const hay = [
        r.id,
        r.state,
        r.vendor_name,
        r.inst_vendor,
        r.f_district || r.district,
        r.f_tehsil || r.tehsil,
        r.f_block || r.block || r.f_post,
        r.f_village || r.village,
        r.f_farmer_name || r.farmer_name,
        r.f_father_name || r.father_name,
        r.f_customer_no,
        r.vfd_no,
        getInverterNo(r),
        serials,
        r.inst_remarks,
        r.inst_date,
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
      if (Number(r.inst_status) === 1) installed += 1;
      const vs = Number(r.inst_verify_status ?? 0);
      if (vs === 1) verifyApproved += 1;
      else if (vs === 0 && Number(r.inst_status) === 1) verifyPending += 1;
      if (Number(r.inst_doc_status) === 2) docApproved += 1;
      if (Number(r.inst_pay_status) === 1) paid += 1;
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

  const exportCols = useMemo<ExportColumn<UpKusumCSiteRow>[]>(
    () => [
      { header: 'Sr. No.', accessor: ((_r: UpKusumCSiteRow, idx?: number) => (idx !== undefined ? idx + 1 : '')) as any },
      { header: 'State', accessor: (r) => (r.state || 'UP').toUpperCase() },
      { header: 'Vendor Name', accessor: (r) => r.vendor_name || (r.inst_vendor ? `Vendor #${r.inst_vendor}` : DASH) },
      { header: 'District', accessor: (r) => r.f_district || r.district || DASH },
      { header: 'Tehsil', accessor: (r) => r.f_tehsil || r.tehsil || DASH },
      { header: 'Block', accessor: (r) => r.f_block || r.block || r.f_post || DASH },
      { header: 'Village', accessor: (r) => r.f_village || r.village || DASH },
      { header: 'Applicant Name', accessor: (r) => r.f_farmer_name || r.farmer_name || DASH },
      { header: 'VFD No.', accessor: (r) => r.vfd_no || DASH },
      { header: 'Inverter No.', accessor: (r) => getInverterNo(r) || DASH },
      { header: 'Module Serial No.', accessor: (r) => parseStringArray(r.module_serial_no || r.module_no).join(', ') || DASH },
      { header: 'Inst. Remarks', accessor: (r) => r.inst_remarks || DASH },
      { header: 'Installation Date', accessor: (r) => fmtDate(r.inst_date) },
      { header: 'Installation Status', accessor: (r) => getInstStatusLabel(r.inst_status) },
      { header: 'Verify Date', accessor: (r) => fmtDate(r.inst_verify_date) },
      { header: 'Verify Status', accessor: (r) => getVerifyStatusLabel(r.inst_verify_status) },
      { header: 'Documents Status', accessor: (r) => getDocStatusLabel(r.inst_doc_status) },
      { header: 'Claim Status', accessor: (r) => getClaimStatusLabel(r.inst_claim_status) },
      { header: 'Payment Status', accessor: (r) => getPaymentStatusLabel(r.inst_pay_status) },
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
    () => (moduleModalSite ? parseStringArray(moduleModalSite.module_serial_no || moduleModalSite.module_no) : []),
    [moduleModalSite]
  );

  const modalFilteredSerials = useMemo(() => {
    const q = moduleSearch.trim().toLowerCase();
    return modalAllSerials
      .map((serial, index) => ({ serial, index: index + 1 }))
      .filter((item) => !q || item.serial.toLowerCase().includes(q) || String(item.index) === q);
  }, [modalAllSerials, moduleSearch]);

  const titleLabel =
    customLabel ||
    KUSUMC_STATUS_OPTIONS.find((o) => o.key === status)?.label ||
    `Status: ${status}`;
  const stamp = new Date().toISOString().slice(0, 10);

  return (
    <div className="solar-erp-page">
      <style>{TABLE_PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      <PageHead
        title="View Kusum C Installation"
        subtitle={
          mode && value
            ? `${titleLabel} · Filtered by ${mode}: ${value}`
            : `UP Kusum-C Installation Status Register · ${titleLabel}`
        }
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Uttar Pradesh', href: '/vendor-management/up' },
          { label: 'Kusum C Dashboard', href: '/vendor-management/up/kusumc/installation/dashboard' },
          { label: 'View Kusum C Installation' },
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
            <Link to="/vendor-management/up/kusumc/installation/dashboard" className="ax-btn ax-btn--primary ax-btn--sm">
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
            <h2 className="ax-card__title">View Kusum C Installation</h2>
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
                {KUSUMC_STATUS_OPTIONS.map((opt) => (
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
                placeholder="Search vendor, farmer, district, serial..."
                size="sm"
              />
              <TableExportToolbar
                onCopy={() => copyRowsToClipboard(filteredRows, exportCols)}
                onExportCSV={() => exportRowsCSV(filteredRows, exportCols, `View_KusumC_Installation_${status}_${stamp}`)}
                onExportExcel={() => exportRowsExcel(filteredRows, exportCols, `View_KusumC_Installation_${status}_${stamp}`)}
                onExportPDF={() => exportRowsPDF(filteredRows, exportCols, `View Kusum C Installation — ${titleLabel}`)}
              />
            </div>
          </div>
        </div>

        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap', minWidth: 2450 }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th">Sr. No.</th>
                <th className="ax-table__th">State</th>
                <th className="ax-table__th">Vendor Name</th>
                <th className="ax-table__th">District</th>
                <th className="ax-table__th">Tehsil</th>
                <th className="ax-table__th">Block</th>
                <th className="ax-table__th">Village</th>
                <th className="ax-table__th">Applicant Name</th>
                <th className="ax-table__th">VFD No.</th>
                <th className="ax-table__th">Inverter No.</th>
                <th className="ax-table__th">Module Serial No.</th>
                <th className="ax-table__th">Farmer With Module Image</th>
                <th className="ax-table__th">Inverter and VFD with Farmer Image</th>
                <th className="ax-table__th">Running Water With Farmer Image</th>
                <th className="ax-table__th">Inst. Remarks</th>
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
                  <td colSpan={22} style={centerCell}>
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading Kusum C installation records...
                  </td>
                </tr>
              ) : pagination.paged.length === 0 ? (
                <tr>
                  <td colSpan={22} style={centerCell}>
                    <TableEmptyState title="No sites found" description="No Kusum C sites match this status or search filter." />
                  </td>
                </tr>
              ) : (
                pagination.paged.map((row, idx) => {
                  const globalIdx = (pagination.curPage - 1) * pagination.pageSize + idx + 1;
                  const serials = parseStringArray(row.module_serial_no || row.module_no);
                  const inverterNo = getInverterNo(row);
                  const modImg = row.farmer_with_module || row.module_image;
                  const vfdImg = row.inverter_vfd_with_farmer || row.inverter_vfd_image;
                  const waterImg = row.running_water_with_farmer || row.running_water_image;

                  const instDone = Number(row.inst_status) === 1;
                  const verifyCode = Number(row.inst_verify_status ?? 0);
                  const docCode = Number(row.inst_doc_status ?? 0);
                  const claimCode = Number(row.inst_claim_status ?? 0);
                  const payCode = Number(row.inst_pay_status ?? 0);

                  return (
                    <tr key={row.id || idx}>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{globalIdx}</td>
                      <td className="ax-table__td">{(row.state || 'UP').toUpperCase()}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>
                        {row.vendor_name || (row.inst_vendor ? `Vendor #${row.inst_vendor}` : DASH)}
                      </td>
                      <td className="ax-table__td">{row.f_district || row.district || DASH}</td>
                      <td className="ax-table__td">{row.f_tehsil || row.tehsil || DASH}</td>
                      <td className="ax-table__td">{row.f_block || row.block || row.f_post || DASH}</td>
                      <td className="ax-table__td">{row.f_village || row.village || DASH}</td>
                      <td className="ax-table__td">
                        <div style={{ fontWeight: 600 }}>{row.f_farmer_name || row.farmer_name || DASH}</div>
                        {(row.f_father_name || row.father_name) && (
                          <div style={{ fontSize: 11, color: '#64748b' }}>S/o {row.f_father_name || row.father_name}</div>
                        )}
                      </td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {row.vfd_no || DASH}
                      </td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {inverterNo || DASH}
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
                                  setModuleModalSite(row);
                                  setModuleSearch('');
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
                      <td className="ax-table__td">
                        <MediaFileThumbnail
                          url={modImg ? resolveUpMediaUrl(modImg, 'kusumc') : null}
                          alt="Farmer With Module Image"
                          onClick={(url, title) => setLightbox({ url, title })}
                        />
                      </td>
                      <td className="ax-table__td">
                        <MediaFileThumbnail
                          url={vfdImg ? resolveUpMediaUrl(vfdImg, 'kusumc') : null}
                          alt="Inverter and VFD with Farmer Image"
                          onClick={(url, title) => setLightbox({ url, title })}
                        />
                      </td>
                      <td className="ax-table__td">
                        <MediaFileThumbnail
                          url={waterImg ? resolveUpMediaUrl(waterImg, 'kusumc') : null}
                          alt="Running Water With Farmer Image"
                          onClick={(url, title) => setLightbox({ url, title })}
                        />
                      </td>
                      <td
                        className="ax-table__td"
                        style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}
                        title={row.inst_remarks || ''}
                      >
                        {row.inst_remarks || DASH}
                      </td>
                      <td className="ax-table__td">{fmtDate(row.inst_date)}</td>
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
                        ) : payCode === 2 ? (
                          <span className="ax-badge ax-badge--soft ax-badge--info">Partial</span>
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

      {/* Module Serial Number Search Modal */}
      <Modal
        open={Boolean(moduleModalSite)}
        onClose={() => {
          setModuleModalSite(null);
          setModuleSearch('');
        }}
        title="Module Serial Numbers"
        subtitle={
          moduleModalSite
            ? `Site #${moduleModalSite.id} • ${moduleModalSite.f_farmer_name || moduleModalSite.farmer_name || ''}`
            : ''
        }
        maxWidth={640}
        footer={
          <button
            type="button"
            className="ax-btn ax-btn--primary"
            onClick={() => {
              setModuleModalSite(null);
              setModuleSearch('');
            }}
          >
            Close
          </button>
        }
      >
        {moduleModalSite && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
              <span className="ax-badge ax-badge--soft ax-badge--info" style={{ fontSize: 11 }}>
                {moduleSearch.trim()
                  ? `Showing ${modalFilteredSerials.length} of ${modalAllSerials.length}`
                  : `${modalAllSerials.length} Module(s)`}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: '1 1 220px', maxWidth: 320 }}>
                <input
                  type="text"
                  className="ax-input ax-input--sm"
                  value={moduleSearch}
                  onChange={(e) => setModuleSearch(e.target.value)}
                  placeholder="Search module serial no..."
                  aria-label="Search module serial number"
                  style={{ width: '100%', height: 32, fontSize: 12 }}
                />
                {moduleSearch && (
                  <button
                    type="button"
                    className="ax-btn ax-btn--ghost ax-btn--xs"
                    onClick={() => setModuleSearch('')}
                    style={{ height: 32, padding: '0 8px' }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {modalFilteredSerials.length === 0 ? (
              <div style={{ fontSize: 12, color: '#64748b', padding: '12px 0' }}>
                No module serial matches <b>"{moduleSearch}"</b>.
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

export default UPKusumCStatusView;
