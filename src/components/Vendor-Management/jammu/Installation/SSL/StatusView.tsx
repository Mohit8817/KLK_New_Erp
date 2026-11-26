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
  jammuSslAdminService,
  resolveJammuMediaUrl,
  type LightVerificationItem,
} from './jammuSslAdminService';
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

export const JAMMU_SSL_STATUS_OPTIONS = [
  { key: 'total', label: 'All Lights' },
  { key: 'assigned', label: 'Assigned Lights' },
  { key: 'complete', label: 'Installed Lights' },
  { key: 'pending', label: 'Installation Pending' },
  { key: 'verify-approved', label: 'Verify Approved' },
  { key: 'verify-pending', label: 'Verify Pending' },
  { key: 'verify-reject', label: 'Verify Rejected' },
  { key: 'claim-approved', label: 'Claim Approved' },
  { key: 'claim-pending', label: 'Claim Pending' },
  { key: 'pay-done', label: 'Payment Settled' },
  { key: 'pay-pending', label: 'Payment Pending' },
];

const QUICK_STATUS_PILLS = [
  { key: 'total', label: 'All Lights' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'complete', label: 'Installed' },
  { key: 'pending', label: 'Pending' },
  { key: 'verify-approved', label: 'Verify Approved' },
  { key: 'verify-pending', label: 'In Audit' },
  { key: 'claim-approved', label: 'Claim Approved' },
  { key: 'pay-done', label: 'Payment Settled' },
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
  return 'Pending';
}

export function StatusView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get('status') || 'total';
  const mode = searchParams.get('mode') as 'vendor' | 'district' | null;
  const value = searchParams.get('value') || searchParams.get('district') || searchParams.get('vendor') || '';
  const customLabel = searchParams.get('label') || '';

  const [rows, setRows] = useState<LightVerificationItem[]>([]);
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
      let data: LightVerificationItem[] = [];
      const backendStatus = (status || 'total').replace(/_/g, '-');
      if (mode === 'vendor' && value) {
        data = await jammuSslAdminService.getVendorWiseData(backendStatus, value);
      } else if (mode === 'district' && value) {
        data = await jammuSslAdminService.getDistrictWiseData(backendStatus, value);
      } else {
        data = await jammuSslAdminService.getViewDashboard(backendStatus);
      }
      setRows(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('SSL StatusView fetch error:', err);
      setRows([]);
      setErrorMsg(err?.message || 'Failed to load Jammu SSL status drill-down data.');
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
      const hay = [
        r.id,
        r.unique_id,
        r.uid,
        r.state,
        r.district,
        r.block,
        r.panchayat,
        r.village,
        r.address,
        r.vendor_name,
        typeof r.vendors === 'object' ? r.vendors?.name : r.vendors,
        r.beneficiary_name,
        r.contact_person,
        r.contact_no,
        r.phone,
        r.pole_no,
        r.luminary_no,
        r.battery_no,
        r.battery_serial_no,
        r.panel_no,
        r.module_no,
        r.sim_no,
        r.imei_no,
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
      const vs = Number(r.inst_verify_status ?? 0);
      if (vs === 1) verifyApproved += 1;
      else if (vs === 0 && isInst) verifyPending += 1;
      if (Number(r.inst_claim_status ?? 0) === 2) claimApproved += 1;
      if (Number(r.inst_pay_status ?? 0) === 1) paid += 1;
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

  const exportCols = useMemo<ExportColumn<LightVerificationItem>[]>(
    () => [
      { header: 'Sr. No.', accessor: ((_r: LightVerificationItem, idx?: number) => (idx !== undefined ? idx + 1 : '')) as any },
      { header: 'State', accessor: () => 'JAMMU' },
      { header: 'Vendor Name', accessor: (r) => r.vendor_name || (typeof r.vendors === 'object' ? r.vendors?.name : r.vendors) || (r.inst_vendor ? `Vendor #${r.inst_vendor}` : DASH) },
      { header: 'District', accessor: (r) => r.district || DASH },
      { header: 'Block', accessor: (r) => r.block || DASH },
      { header: 'Panchayat', accessor: (r) => r.panchayat || DASH },
      { header: 'Village / Ward', accessor: (r) => r.village || r.address || DASH },
      { header: 'Pole No.', accessor: (r) => r.pole_no || DASH },
      { header: 'Luminary No.', accessor: (r) => r.luminary_no || DASH },
      { header: 'Battery Serial No.', accessor: (r) => r.battery_serial_no || r.battery_no || DASH },
      { header: 'Panel / Module No.', accessor: (r) => r.panel_no || r.module_no || DASH },
      { header: 'SIM / IMEI No.', accessor: (r) => r.sim_no || r.imei_no || DASH },
      { header: 'Beneficiary Name', accessor: (r) => r.beneficiary_name || r.contact_person || DASH },
      { header: 'Contact Phone', accessor: (r) => r.contact_no || r.contact_number || r.phone || DASH },
      { header: 'Installation Date', accessor: (r) => fmtDate(r.inst_date || (r as any).installation_date) },
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
    JAMMU_SSL_STATUS_OPTIONS.find((o) => o.key === status || o.key === status.replace(/_/g, '-'))?.label ||
    `Status: ${status}`;
  const stamp = new Date().toISOString().slice(0, 10);

  return (
    <div className="solar-erp-page">
      <style>{TABLE_PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      <PageHead
        title="View Jammu SSL Installation"
        subtitle={
          mode && value
            ? `${titleLabel} · Filtered by ${mode}: ${value}`
            : `Jammu SSL Installation Status Register · ${titleLabel}`
        }
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Jammu' },
          { label: 'SSL Dashboard', href: '/vendor-management/jammu/installation/ssl/dashboard' },
          { label: 'View Jammu SSL Installation' },
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
            <Link to="/vendor-management/jammu/installation/ssl/dashboard" className="ax-btn ax-btn--primary ax-btn--sm">
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
            <h2 className="ax-card__title">View Jammu SSL Installation</h2>
            <p className="ax-card__subtitle">
              Showing <span className="ax-num">{filteredRows.length}</span> of <span className="ax-num">{rows.length}</span> street light record(s) · {titleLabel}
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
                {JAMMU_SSL_STATUS_OPTIONS.map((opt) => (
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
                placeholder="Search vendor, pole, luminary, serial..."
                size="sm"
              />
              <TableExportToolbar
                onCopy={() => copyRowsToClipboard(filteredRows, exportCols)}
                onExportCSV={() => exportRowsCSV(filteredRows, exportCols, `View_Jammu_SSL_${status}_${stamp}`)}
                onExportExcel={() => exportRowsExcel(filteredRows, exportCols, `View_Jammu_SSL_${status}_${stamp}`)}
                onExportPDF={() => exportRowsPDF(filteredRows, exportCols, `View Jammu SSL Installation — ${titleLabel}`)}
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
                <th className="ax-table__th">Panchayat</th>
                <th className="ax-table__th">Village / Ward</th>
                <th className="ax-table__th">Pole No.</th>
                <th className="ax-table__th">Luminary No.</th>
                <th className="ax-table__th">Battery Serial No.</th>
                <th className="ax-table__th">Panel / Module No.</th>
                <th className="ax-table__th">SIM / IMEI No.</th>
                <th className="ax-table__th">Beneficiary / Contact</th>
                <th className="ax-table__th">Pole Photo</th>
                <th className="ax-table__th">Luminary Photo</th>
                <th className="ax-table__th">Battery Photo</th>
                <th className="ax-table__th">Site Photo</th>
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
                  <td colSpan={23} style={centerCell}>
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading Jammu SSL records...
                  </td>
                </tr>
              ) : pagination.paged.length === 0 ? (
                <tr>
                  <td colSpan={23} style={centerCell}>
                    <TableEmptyState title="No lights found" description="No Jammu SSL lights match this status or search filter." />
                  </td>
                </tr>
              ) : (
                pagination.paged.map((row, idx) => {
                  const globalIdx = (pagination.curPage - 1) * pagination.pageSize + idx + 1;
                  const instDone = Number(row.inst_status ?? 0) === 1;
                  const verifyCode = Number(row.inst_verify_status ?? 0);
                  const claimCode = Number(row.inst_claim_status ?? 0);
                  const payCode = Number(row.inst_pay_status ?? 0);

                  const poleImg = row.pole_image;
                  const lumImg = row.luminary_image;
                  const batImg = row.battery_image;
                  const siteImg = row.system_image || row.lat_long_image;

                  const vendorDisp = row.vendor_name || (typeof row.vendors === 'object' ? row.vendors?.name : row.vendors) || (row.inst_vendor ? `Vendor #${row.inst_vendor}` : DASH);

                  return (
                    <tr key={row.id || idx}>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{globalIdx}</td>
                      <td className="ax-table__td">JAMMU</td>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>
                        {vendorDisp}
                      </td>
                      <td className="ax-table__td">{row.district || DASH}</td>
                      <td className="ax-table__td">{row.block || DASH}</td>
                      <td className="ax-table__td">{row.panchayat || DASH}</td>
                      <td className="ax-table__td">{row.village || row.address || DASH}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {row.pole_no || DASH}
                      </td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {row.luminary_no || DASH}
                      </td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {row.battery_serial_no || row.battery_no || DASH}
                      </td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {row.panel_no || row.module_no || DASH}
                      </td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {row.sim_no || row.imei_no || DASH}
                      </td>
                      <td className="ax-table__td">
                        <div>{row.beneficiary_name || row.contact_person || DASH}</div>
                        {(row.contact_no || row.contact_number || row.phone) && (
                          <div style={{ fontSize: 11, color: '#64748b' }}>{row.contact_no || row.contact_number || row.phone}</div>
                        )}
                      </td>
                      <td className="ax-table__td">
                        <MediaFileThumbnail
                          url={poleImg ? resolveJammuMediaUrl(poleImg) : null}
                          alt="Pole Photo"
                          onClick={(url, title) => setLightbox({ url, title: title || 'Pole Photo' })}
                        />
                      </td>
                      <td className="ax-table__td">
                        <MediaFileThumbnail
                          url={lumImg ? resolveJammuMediaUrl(lumImg) : null}
                          alt="Luminary Photo"
                          onClick={(url, title) => setLightbox({ url, title: title || 'Luminary Photo' })}
                        />
                      </td>
                      <td className="ax-table__td">
                        <MediaFileThumbnail
                          url={batImg ? resolveJammuMediaUrl(batImg) : null}
                          alt="Battery Photo"
                          onClick={(url, title) => setLightbox({ url, title: title || 'Battery Photo' })}
                        />
                      </td>
                      <td className="ax-table__td">
                        <MediaFileThumbnail
                          url={siteImg ? resolveJammuMediaUrl(siteImg) : null}
                          alt="Site Photo"
                          onClick={(url, title) => setLightbox({ url, title: title || 'Site Photo' })}
                        />
                      </td>
                      <td className="ax-table__td">{fmtDate(row.inst_date || (row as any).installation_date)}</td>
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
