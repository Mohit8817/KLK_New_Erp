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
  jammuAdminSwpService,
  resolveJammuSwpMediaUrl,
} from './jammuSwpAdminService';
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

export const JAMMU_SWP_STATUS_OPTIONS = [
  { key: 'total', label: 'All Sites' },
  { key: 'site-assigned', label: 'Assigned Sites' },
  { key: 'site-not-assigned', label: 'Unassigned Sites' },
  { key: 'complete', label: 'Installed Sites' },
  { key: 'pending', label: 'Installation Pending' },
  { key: 'verify-approved', label: 'Verify Approved' },
  { key: 'verify-pending', label: 'Verify Pending' },
  { key: 'verify-reject', label: 'Verify Rejected' },
  { key: 'claim-applicable', label: 'Claim Applicable' },
  { key: 'claim-raised', label: 'Claim Raised' },
  { key: 'claim-approved', label: 'Claim Approved' },
  { key: 'claim-pending', label: 'Claim Pending' },
  { key: 'inst-pay-done', label: 'Payment Done' },
  { key: 'inst-pay-partially', label: 'Payment Partially' },
  { key: 'inst-pay-pending', label: 'Payment Pending' },
];

const QUICK_STATUS_PILLS = [
  { key: 'total', label: 'All Sites' },
  { key: 'site-assigned', label: 'Assigned' },
  { key: 'complete', label: 'Installed' },
  { key: 'pending', label: 'Pending' },
  { key: 'verify-approved', label: 'Verify Approved' },
  { key: 'verify-pending', label: 'In Audit' },
  { key: 'claim-approved', label: 'Claim Approved' },
  { key: 'inst-pay-done', label: 'Payment Settled' },
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
  if (n === 2) return 'Partially Paid';
  return 'Pending';
}

export function StatusView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get('status') || 'total';
  const mode = searchParams.get('mode') as 'vendor' | 'district' | null;
  const value = searchParams.get('value') || searchParams.get('district') || searchParams.get('vendor') || '';
  const customLabel = searchParams.get('label') || '';

  const [rows, setRows] = useState<any[]>([]);
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
      let data: any[] = [];
      const backendStatus = (status || 'total').replace(/_/g, '-');
      if (mode === 'vendor' && value) {
        data = await jammuAdminSwpService.getVendorWiseData(backendStatus, value);
      } else if (mode === 'district' && value) {
        data = await jammuAdminSwpService.getDistrictWiseData(backendStatus, value);
      } else {
        data = await jammuAdminSwpService.getViewDashboard(backendStatus);
      }
      setRows(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('StatusView fetch error:', err);
      setRows([]);
      setErrorMsg(err?.message || 'Failed to load Jammu SWP status drill-down data.');
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
      const d = String(r.f_district || r.district || '').trim();
      if (d) set.add(d);
    });
    return Array.from(set).sort();
  }, [rows]);

  const filteredRows = useMemo(() => {
    let list = rows;
    if (districtFilter !== 'all') {
      list = list.filter((r) => String(r.f_district || r.district || '').trim().toLowerCase() === districtFilter.toLowerCase());
    }
    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter((r) => {
      const hay = [
        r.id,
        r.state,
        r.f_district || r.district,
        r.f_block || r.block,
        r.f_village || r.village,
        r.f_farmer_name || r.farmer_name,
        r.f_farmer_id || r.farmer_id,
        r.contact_no || r.mobile,
        r.vendor_name || r.vendor,
        r.pump_capacity,
        r.pump_type,
        r.controller_sr_no || r.vfd_no,
        r.motor_sr_no || r.motor_no,
        r.pump_sr_no || r.pump_no,
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
      const isInst = Number(r.inst_status ?? r.site_inst_status ?? 0) === 1;
      if (isInst) installed += 1;
      const vs = Number(r.inst_verify_status ?? 0);
      if (vs === 1) verifyApproved += 1;
      else if (vs === 0 && isInst) verifyPending += 1;
      if (Number(r.claim_status ?? r.inst_claim_status ?? 0) === 2) claimApproved += 1;
      if (Number(r.pay_status ?? r.inst_pay_status ?? 0) === 1) paid += 1;
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

  const exportCols = useMemo<ExportColumn<any>[]>(
    () => [
      { header: 'Sr. No.', accessor: ((_r: any, idx?: number) => (idx !== undefined ? idx + 1 : '')) as any },
      { header: 'State', accessor: () => 'JAMMU' },
      { header: 'Vendor Name', accessor: (r) => r.vendor_name || (r.inst_vendor ? `Vendor #${r.inst_vendor}` : DASH) },
      { header: 'District', accessor: (r) => r.f_district || r.district || DASH },
      { header: 'Block', accessor: (r) => r.f_block || r.block || DASH },
      { header: 'Village', accessor: (r) => r.f_village || r.village || DASH },
      { header: 'Farmer Name', accessor: (r) => r.f_farmer_name || r.farmer_name || `Farmer #${r.id}` },
      { header: 'Farmer ID', accessor: (r) => r.f_farmer_id || r.farmer_id || DASH },
      { header: 'Contact', accessor: (r) => r.contact_no || r.mobile || DASH },
      { header: 'Pump Capacity', accessor: (r) => r.pump_capacity || DASH },
      { header: 'Pump Type', accessor: (r) => r.pump_type || DASH },
      { header: 'Controller / VFD No.', accessor: (r) => r.controller_sr_no || r.vfd_no || DASH },
      { header: 'Motor No.', accessor: (r) => r.motor_sr_no || r.motor_no || DASH },
      { header: 'Pump Serial No.', accessor: (r) => r.pump_sr_no || r.pump_no || DASH },
      { header: 'Installation Date', accessor: (r) => fmtDate(r.installation_date || r.inst_date) },
      { header: 'Installation Status', accessor: (r) => getInstStatusLabel(r.inst_status) },
      { header: 'Verify Date', accessor: (r) => fmtDate(r.inst_verify_date) },
      { header: 'Verify Status', accessor: (r) => getVerifyStatusLabel(r.inst_verify_status) },
      { header: 'Claim Status', accessor: (r) => getClaimStatusLabel(r.claim_status ?? r.inst_claim_status) },
      { header: 'Payment Status', accessor: (r) => getPaymentStatusLabel(r.pay_status ?? r.inst_pay_status) },
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
    JAMMU_SWP_STATUS_OPTIONS.find((o) => o.key === status || o.key === status.replace(/_/g, '-'))?.label ||
    `Status: ${status}`;
  const stamp = new Date().toISOString().slice(0, 10);

  return (
    <div className="solar-erp-page">
      <style>{TABLE_PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      <PageHead
        title="View Jammu SWP Installation"
        subtitle={
          mode && value
            ? `${titleLabel} · Filtered by ${mode}: ${value}`
            : `Jammu SWP Installation Status Register · ${titleLabel}`
        }
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Jammu' },
          { label: 'SWP Dashboard', href: '/vendor-management/jammu/installation/swp/dashboard' },
          { label: 'View Jammu SWP Installation' },
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
            <Link to="/vendor-management/jammu/installation/swp/dashboard" className="ax-btn ax-btn--primary ax-btn--sm">
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
            <h2 className="ax-card__title">View Jammu SWP Installation</h2>
            <p className="ax-card__subtitle">
              Showing <span className="ax-num">{filteredRows.length}</span> of <span className="ax-num">{rows.length}</span> pump site record(s) · {titleLabel}
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
                {JAMMU_SWP_STATUS_OPTIONS.map((opt) => (
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
                placeholder="Search farmer, district, vendor, serial..."
                size="sm"
              />
              <TableExportToolbar
                onCopy={() => copyRowsToClipboard(filteredRows, exportCols)}
                onExportCSV={() => exportRowsCSV(filteredRows, exportCols, `View_Jammu_SWP_${status}_${stamp}`)}
                onExportExcel={() => exportRowsExcel(filteredRows, exportCols, `View_Jammu_SWP_${status}_${stamp}`)}
                onExportPDF={() => exportRowsPDF(filteredRows, exportCols, `View Jammu SWP Installation — ${titleLabel}`)}
              />
            </div>
          </div>
        </div>

        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap', minWidth: 2400 }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th">Sr. No.</th>
                <th className="ax-table__th">State</th>
                <th className="ax-table__th">Vendor Name</th>
                <th className="ax-table__th">District</th>
                <th className="ax-table__th">Block</th>
                <th className="ax-table__th">Village</th>
                <th className="ax-table__th">Farmer Name</th>
                <th className="ax-table__th">Farmer ID</th>
                <th className="ax-table__th">Contact</th>
                <th className="ax-table__th">Pump Capacity</th>
                <th className="ax-table__th">Pump Type</th>
                <th className="ax-table__th">Controller / VFD No.</th>
                <th className="ax-table__th">Motor No.</th>
                <th className="ax-table__th">Pump Serial No.</th>
                <th className="ax-table__th">Farmer Photo</th>
                <th className="ax-table__th">Pump Photo</th>
                <th className="ax-table__th">Controller Photo</th>
                <th className="ax-table__th">Boring Photo</th>
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
                  <td colSpan={24} style={centerCell}>
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading Jammu SWP records...
                  </td>
                </tr>
              ) : pagination.paged.length === 0 ? (
                <tr>
                  <td colSpan={24} style={centerCell}>
                    <TableEmptyState title="No sites found" description="No Jammu SWP sites match this status or search filter." />
                  </td>
                </tr>
              ) : (
                pagination.paged.map((row, idx) => {
                  const globalIdx = (pagination.curPage - 1) * pagination.pageSize + idx + 1;
                  const instDone = Number(row.inst_status ?? row.site_inst_status ?? 0) === 1;
                  const verifyCode = Number(row.inst_verify_status ?? 0);
                  const claimCode = Number(row.claim_status ?? row.inst_claim_status ?? 0);
                  const payCode = Number(row.pay_status ?? row.inst_pay_status ?? 0);

                  const farmerImg = row.farmer_photo || row.farmer_image;
                  const pumpImg = row.pump_photo || row.pump_image;
                  const vfdImg = row.controller_photo || row.controller_image || row.vfd_photo;
                  const boreImg = row.boring_photo || row.boring_image;

                  return (
                    <tr key={row.id || idx}>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{globalIdx}</td>
                      <td className="ax-table__td">JAMMU</td>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>
                        {row.vendor_name || (row.inst_vendor ? `Vendor #${row.inst_vendor}` : DASH)}
                      </td>
                      <td className="ax-table__td">{row.f_district || row.district || DASH}</td>
                      <td className="ax-table__td">{row.f_block || row.block || DASH}</td>
                      <td className="ax-table__td">{row.f_village || row.village || DASH}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>
                        {row.f_farmer_name || row.farmer_name || `Farmer #${row.id}`}
                      </td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {row.f_farmer_id || row.farmer_id || DASH}
                      </td>
                      <td className="ax-table__td">
                        {row.contact_no || row.mobile || DASH}
                      </td>
                      <td className="ax-table__td">
                        {row.pump_capacity || DASH}
                      </td>
                      <td className="ax-table__td">
                        {row.pump_type || DASH}
                      </td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {row.controller_sr_no || row.vfd_no || DASH}
                      </td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {row.motor_sr_no || row.motor_no || DASH}
                      </td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {row.pump_sr_no || row.pump_no || DASH}
                      </td>
                      <td className="ax-table__td">
                        <MediaFileThumbnail
                          url={farmerImg ? resolveJammuSwpMediaUrl(farmerImg) : null}
                          alt="Farmer Photo"
                          onClick={(url, title) => setLightbox({ url, title: title || 'Farmer Photo' })}
                        />
                      </td>
                      <td className="ax-table__td">
                        <MediaFileThumbnail
                          url={pumpImg ? resolveJammuSwpMediaUrl(pumpImg) : null}
                          alt="Pump Photo"
                          onClick={(url, title) => setLightbox({ url, title: title || 'Pump Photo' })}
                        />
                      </td>
                      <td className="ax-table__td">
                        <MediaFileThumbnail
                          url={vfdImg ? resolveJammuSwpMediaUrl(vfdImg) : null}
                          alt="Controller Photo"
                          onClick={(url, title) => setLightbox({ url, title: title || 'Controller Photo' })}
                        />
                      </td>
                      <td className="ax-table__td">
                        <MediaFileThumbnail
                          url={boreImg ? resolveJammuSwpMediaUrl(boreImg) : null}
                          alt="Boring Photo"
                          onClick={(url, title) => setLightbox({ url, title: title || 'Boring Photo' })}
                        />
                      </td>
                      <td className="ax-table__td">{fmtDate(row.installation_date || row.inst_date)}</td>
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
                          <span className="ax-badge ax-badge--soft ax-badge--info">Partially Paid</span>
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
