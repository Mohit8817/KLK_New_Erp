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
  upSsl18wAdminService,
  resolveUpMediaUrl,
  getUpMediaCandidates,
  type UpSsl18wSiteRow,
} from '../../up-services';
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
} from '../upInstallationShared';

const SSL18W_STATUS_OPTIONS = [
  { key: 'total', label: 'All Feasible Sites' },
  { key: 'assigned', label: 'Vendor Assigned' },
  { key: 'not-assigned', label: 'Unassigned' },
  { key: 'accept', label: 'Vendor Accepted' },
  { key: 'complete', label: 'Installation Complete' },
  { key: 'pending', label: 'Installation Pending' },
  { key: 'verify-approved', label: 'Verify Approved' },
  { key: 'verify-pending', label: 'Verify Pending' },
  { key: 'verify-reject', label: 'Verify Rejected' },
  { key: 'claim-applicable', label: 'Claim Applicable (7+ days)' },
  { key: 'claim-not-applicable', label: 'Claim Not Applicable (<7 days)' },
  { key: 'claim-raised', label: 'Claim Raised' },
  { key: 'claim-verify-approved', label: 'Claim Verify Approved' },
  { key: 'claim-verify-pending', label: 'Claim Verify Pending' },
  { key: 'claim-verify-reject', label: 'Claim Verify Rejected' },
  { key: 'payment-completed', label: 'Payment Completed' },
  { key: 'payment-pending', label: 'Payment Pending' },
  { key: 'payment-partially', label: 'Payment Partially' },
];

const QUICK_STATUS_PILLS = [
  { key: 'total', label: 'All Lights' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'accept', label: 'Accepted' },
  { key: 'not-assigned', label: 'Unassigned' },
  { key: 'complete', label: 'Complete' },
  { key: 'pending', label: 'Pending' },
  { key: 'verify-approved', label: 'Verify Approved' },
  { key: 'verify-pending', label: 'Verify Pending' },
  { key: 'verify-reject', label: 'Verify Rejected' },
  { key: 'claim-applicable', label: 'Claim Applicable' },
  { key: 'payment-completed', label: 'Paid' },
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

function getRowLightFile(row: UpSsl18wSiteRow): string | null {
  const val =
    row.light_file ||
    row.light_image ||
    row.inst_image ||
    row.image ||
    (row as any).file ||
    (row as any).installation_image;
  if (!val || typeof val !== 'string') return null;
  const s = val.trim();
  if (!s || s === '—' || s.toUpperCase() === 'NULL' || s.toLowerCase() === 'null') return null;
  return s;
}

function getRowBatteryNo(row: UpSsl18wSiteRow): string {
  return row.battery_serial_no || row.battery_no || DASH;
}

export function UPSSL18WStatusView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get('status') || 'total';
  const mode = searchParams.get('mode') as 'vendor' | 'district' | null;
  const value = searchParams.get('value') || '';
  const customLabel = searchParams.get('label') || '';

  const [rows, setRows] = useState<UpSsl18wSiteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [lightbox, setLightbox] = useState<{ url: string; title?: string; candidates?: string[] } | null>(null);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      let data: UpSsl18wSiteRow[] = [];
      if (mode === 'vendor' && value) {
        data = await upSsl18wAdminService.getVendorwiseData(status, value);
      } else if (mode === 'district' && value) {
        data = await upSsl18wAdminService.getDistrictwiseData(status, value);
      } else {
        data = await upSsl18wAdminService.getViewDashboard(status);
      }
      setRows(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setRows([]);
      setErrorMsg(err?.message || 'Failed to load SSL-18W status drill-down data.');
    } finally {
      setLoading(false);
    }
  }, [status, mode, value]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

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
      list = list.filter((r) => String(r.district || '').trim() === districtFilter);
    }
    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter((r) => {
      const hay = [
        r.id,
        r.state,
        r.vendor_name || r.vendors?.name,
        r.inst_vendor,
        r.uid || r.unique_id,
        r.phase || r.volume,
        r.district,
        r.block,
        r.panchayat,
        r.ward_no || r.ward,
        r.pole_no,
        r.beneficiary_name,
        r.beneficiary_contact || r.contact_no,
        r.uuid_no || r.uuid,
        r.imei_no || r.imei,
        r.light_no || r.luminary_no,
        r.battery_serial_no,
        r.battery_no,
        r.panel_no || r.module_no,
        r.light_file,
        r.inst_remarks || r.remarks,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [rows, districtFilter, searchQuery]);

  const pagination = usePagination(filteredRows, { initialPageSize: 50 });

  const metrics = useMemo(() => {
    let installed = 0;
    let verifyApproved = 0;
    let verifyPending = 0;
    let claimApproved = 0;
    let paid = 0;
    rows.forEach((r) => {
      const isDone = Number(r.inst_status) === 1 || Boolean(r.inst_date || r.installation_date);
      if (isDone) installed += 1;
      const vs = Number(r.inst_verify_status ?? 0);
      if (vs === 1) verifyApproved += 1;
      else if (vs === 0 && isDone) verifyPending += 1;
      if (Number(r.inst_claim_status) === 2) claimApproved += 1;
      if (Number(r.inst_pay_status) === 1) paid += 1;
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

  const exportCols = useMemo<ExportColumn<UpSsl18wSiteRow>[]>(
    () => [
      { header: 'Sr. No.', accessor: ((_r: UpSsl18wSiteRow, idx?: number) => (idx !== undefined ? idx + 1 : '')) as any },
      { header: 'State', accessor: (r) => (r.state || 'UP').toUpperCase() },
      { header: 'Vendor Name', accessor: (r) => r.vendor_name || r.vendors?.name || (r.inst_vendor ? `Vendor #${r.inst_vendor}` : DASH) },
      { header: 'UID', accessor: (r) => r.uid || r.unique_id || DASH },
      { header: 'Phase', accessor: (r) => r.phase || r.volume || DASH },
      { header: 'District', accessor: (r) => r.district || DASH },
      { header: 'Block', accessor: (r) => r.block || DASH },
      { header: 'Panchayat', accessor: (r) => r.panchayat || DASH },
      { header: 'Ward No', accessor: (r) => r.ward_no || r.ward || DASH },
      { header: 'Pole No', accessor: (r) => r.pole_no || DASH },
      { header: 'Beneficiary Name', accessor: (r) => r.beneficiary_name || DASH },
      { header: 'Contact', accessor: (r) => r.beneficiary_contact || r.contact_no || DASH },
      { header: 'Latitude', accessor: (r) => r.latitude || DASH },
      { header: 'Longitude', accessor: (r) => r.longitude || DASH },
      { header: 'UUID No.', accessor: (r) => r.uuid_no || r.uuid || DASH },
      { header: 'IMEI No.', accessor: (r) => r.imei_no || r.imei || DASH },
      { header: 'Light No.', accessor: (r) => r.light_no || r.luminary_no || DASH },
      { header: 'Battery No.', accessor: (r) => getRowBatteryNo(r) },
      { header: 'Panel No.', accessor: (r) => r.panel_no || r.module_no || DASH },
      { header: 'Inst. Remarks', accessor: (r) => r.inst_remarks || r.remarks || DASH },
      { header: 'Installation Date', accessor: (r) => fmtDate(r.inst_date || r.installation_date) },
      { header: 'Installation Status', accessor: (r) => getInstStatusLabel(r.inst_status) },
      { header: 'Verify Date', accessor: (r) => fmtDate(r.inst_verify_date) },
      { header: 'Verify Status', accessor: (r) => getVerifyStatusLabel(r.inst_verify_status) },
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

  const titleLabel =
    customLabel ||
    SSL18W_STATUS_OPTIONS.find((o) => o.key === status)?.label ||
    `Status: ${status}`;
  const stamp = new Date().toISOString().slice(0, 10);

  return (
    <div className="solar-erp-page">
      <style>{TABLE_PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      <PageHead
        title="View UP SSL-18W Installation"
        subtitle={
          mode && value
            ? `${titleLabel} · Filtered by ${mode}: ${value}`
            : `UP SSL-18W Installation Status Register · ${titleLabel}`
        }
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Uttar Pradesh', href: '/vendor-management/up' },
          { label: 'SSL 18W Dashboard', href: '/vendor-management/up/ssl18w/installation/dashboard' },
          { label: 'View UP SSL-18W Installation' },
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
            <Link to="/vendor-management/up/ssl18w/installation/dashboard" className="ax-btn ax-btn--primary ax-btn--sm">
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
            <h2 className="ax-card__title">View UP SSL-18W Installation</h2>
            <p className="ax-card__subtitle">
              Showing <span className="ax-num">{filteredRows.length}</span> of <span className="ax-num">{rows.length}</span> SSL-18W light record(s) · {titleLabel}
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
                style={{ width: 195, height: 32, fontSize: 'var(--ax-text-xs)' }}
                value={status}
                onChange={(e) => handleStatusChange(e.target.value)}
                aria-label="Select status view"
              >
                {SSL18W_STATUS_OPTIONS.map((opt) => (
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
                placeholder="Search UID, vendor, district, IMEI..."
                size="sm"
              />
              <TableExportToolbar
                onCopy={() => copyRowsToClipboard(filteredRows, exportCols)}
                onExportCSV={() => exportRowsCSV(filteredRows, exportCols, `View_UP_SSL18W_Installation_${status}_${stamp}`)}
                onExportExcel={() => exportRowsExcel(filteredRows, exportCols, `View_UP_SSL18W_Installation_${status}_${stamp}`)}
                onExportPDF={() => exportRowsPDF(filteredRows, exportCols, `View UP SSL-18W Installation — ${titleLabel}`)}
              />
            </div>
          </div>
        </div>

        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap', minWidth: 2650 }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th">Sr. No.</th>
                <th className="ax-table__th">State</th>
                <th className="ax-table__th">Vendor Name</th>
                <th className="ax-table__th">UID</th>
                <th className="ax-table__th">Phase</th>
                <th className="ax-table__th">District</th>
                <th className="ax-table__th">Block</th>
                <th className="ax-table__th">Panchayat</th>
                <th className="ax-table__th">Ward No</th>
                <th className="ax-table__th">Pole No</th>
                <th className="ax-table__th">Beneficiary Name</th>
                <th className="ax-table__th">Contact</th>
                <th className="ax-table__th">Latitude</th>
                <th className="ax-table__th">Longitude</th>
                <th className="ax-table__th">UUID No.</th>
                <th className="ax-table__th">IMEI No.</th>
                <th className="ax-table__th">Light No.</th>
                <th className="ax-table__th">Battery No.</th>
                <th className="ax-table__th">Panel No.</th>
                <th className="ax-table__th">Light Image</th>
                <th className="ax-table__th">Inst. Remarks</th>
                <th className="ax-table__th">Installation Date</th>
                <th className="ax-table__th">Installation Status</th>
                <th className="ax-table__th">Verify Date</th>
                <th className="ax-table__th">Verify Status</th>
                <th className="ax-table__th">Claim Status</th>
                <th className="ax-table__th">Payment Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={27} style={centerCell}>
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading SSL-18W light records...
                  </td>
                </tr>
              ) : pagination.paged.length === 0 ? (
                <tr>
                  <td colSpan={27} style={centerCell}>
                    <TableEmptyState title="No lights found" description="No SSL-18W sites match this status or search filter." />
                  </td>
                </tr>
              ) : (
                pagination.paged.map((row, idx) => {
                  const globalIdx = (pagination.curPage - 1) * pagination.pageSize + idx + 1;
                  const rawImg = getRowLightFile(row);
                  const imgCandidates = rawImg ? getUpMediaCandidates(rawImg, 'ssl18w') : [];
                  const primaryImgUrl = imgCandidates[0] || (rawImg ? resolveUpMediaUrl(rawImg, 'ssl18w') : null);
                  const batteryDisplay = getRowBatteryNo(row);
                  const instDone = Number(row.inst_status) === 1;
                  const verifyCode = Number(row.inst_verify_status ?? 0);
                  const claimCode = Number(row.inst_claim_status ?? 0);
                  const payCode = Number(row.inst_pay_status ?? 0);

                  return (
                    <tr key={row.id || idx}>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{globalIdx}</td>
                      <td className="ax-table__td">{(row.state || 'UP').toUpperCase()}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>
                        {row.vendor_name || rVendorFallback(row)}
                      </td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {row.uid || row.unique_id || `#${row.id}`}
                      </td>
                      <td className="ax-table__td">{row.phase || row.volume || DASH}</td>
                      <td className="ax-table__td">{row.district || DASH}</td>
                      <td className="ax-table__td">{row.block || DASH}</td>
                      <td className="ax-table__td">{row.panchayat || DASH}</td>
                      <td className="ax-table__td">{row.ward_no || row.ward || DASH}</td>
                      <td className="ax-table__td">{row.pole_no || DASH}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{row.beneficiary_name || DASH}</td>
                      <td className="ax-table__td">{row.beneficiary_contact || row.contact_no || DASH}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 11.5 }}>{row.latitude || DASH}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 11.5 }}>{row.longitude || DASH}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 11.5 }}>{row.uuid_no || row.uuid || DASH}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 11.5 }}>{row.imei_no || row.imei || DASH}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 11.5 }}>{row.light_no || row.luminary_no || DASH}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 11.5 }}>{batteryDisplay}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 11.5 }}>{row.panel_no || row.module_no || DASH}</td>
                      <td className="ax-table__td">
                        <MediaFileThumbnail
                          url={primaryImgUrl}
                          candidates={imgCandidates}
                          filename={rawImg}
                          alt={`Light #${row.uid || row.id}`}
                          onClick={(url, title, cands) =>
                            setLightbox({ url, title, candidates: cands || imgCandidates })
                          }
                        />
                      </td>
                      <td
                        className="ax-table__td"
                        style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}
                        title={row.inst_remarks || row.remarks || ''}
                      >
                        {row.inst_remarks || row.remarks || DASH}
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

      <MediaLightbox
        url={lightbox?.url || null}
        title={lightbox?.title}
        candidates={lightbox?.candidates}
        onClose={() => setLightbox(null)}
      />
    </div>
  );
}

function rVendorFallback(row: UpSsl18wSiteRow): string {
  if (row.vendors?.name) return String(row.vendors.name);
  if (row.inst_vendor) return `Vendor #${row.inst_vendor}`;
  return DASH;
}

export default UPSSL18WStatusView;
