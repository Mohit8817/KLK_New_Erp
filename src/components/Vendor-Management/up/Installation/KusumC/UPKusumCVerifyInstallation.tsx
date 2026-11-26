import { useEffect, useMemo, useState, useCallback } from 'react';
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
  type UpKusumCDetailSummary,
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

function getInverterNo(row: UpKusumCSiteRow): string {
  return String(row.Inverter_no || row.inverter_no || '').trim();
}

function formatYesNoFlag(val: unknown): string {
  if (val === null || val === undefined || val === '') return DASH;
  const s = String(val).trim().toLowerCase();
  if (s === '1' || s === 'yes' || s === 'true') return 'Yes';
  if (s === '0' || s === 'no' || s === 'false') return 'No';
  return String(val);
}

function getDocStatusLabel(status: unknown): string {
  const n = Number(status ?? 0);
  if (n === 2) return 'Approved';
  if (n === 3) return 'Rejected';
  if (n === 1) return 'Pending';
  return 'Not Submitted';
}

function getVerifyStatusLabel(status: unknown): string {
  const n = Number(status ?? 0);
  if (n === 1) return 'Approved';
  if (n === 2) return 'Rejected';
  return 'Pending';
}

export function UPKusumCVerifyInstallation() {
  const [verification, setVerification] = useState<UpKusumCSiteRow[]>([]);
  const [verified, setVerified] = useState<UpKusumCSiteRow[]>([]);
  const [detail, setDetail] = useState<UpKusumCDetailSummary | null>(null);
  const [loginInfo, setLoginInfo] = useState<{ id?: string; name?: string }>({});
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [activeTab, setActiveTab] = useState<'pending' | 'approved_rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState('');

  // Verify Modal
  const [actionSite, setActionSite] = useState<UpKusumCSiteRow | null>(null);
  const [actionStatus, setActionStatus] = useState<'1' | '2'>('1');
  const [actionRemarks, setActionRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Details Modal (with Module Search) & Lightbox
  const [detailSite, setDetailSite] = useState<UpKusumCSiteRow | null>(null);
  const [moduleSearch, setModuleSearch] = useState('');
  const [lightbox, setLightbox] = useState<{ url: string; title?: string } | null>(null);

  const openDetailsModal = (row: UpKusumCSiteRow) => {
    setDetailSite(row);
    setModuleSearch('');
  };

  const closeDetailsModal = () => {
    setDetailSite(null);
    setModuleSearch('');
  };

  const formatVerifyBy = useCallback(
    (row: UpKusumCSiteRow): string => {
      if (row.inst_verify_by_name) return String(row.inst_verify_by_name);
      if (row.inst_verify_by === null || row.inst_verify_by === undefined || row.inst_verify_by === '') {
        return DASH;
      }
      const raw = String(row.inst_verify_by).trim();
      if (loginInfo.id && loginInfo.name && raw === loginInfo.id) {
        return `${loginInfo.name} (${raw})`;
      }
      return raw;
    },
    [loginInfo]
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await upKusumCAdminService.getViewInstallation();
      setDetail(res.detail);
      setVerification(res.verification);
      setVerified(res.verified);
      setLoginInfo({
        id: res.loginId !== undefined && res.loginId !== null ? String(res.loginId) : undefined,
        name: res.loginName || undefined,
      });
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to load Kusum C installation verification data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionSite) return;
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const statusNum = Number(actionStatus) as 1 | 2;
      const res = await upKusumCAdminService.verifyInstallationStatus({
        id: actionSite.id,
        status: statusNum,
        remarks: actionRemarks.trim() || undefined,
      });

      const updated: UpKusumCSiteRow = {
        ...actionSite,
        inst_verify_status: statusNum,
        inst_verify_remarks: actionRemarks.trim(),
        inst_verify_date: new Date().toISOString().slice(0, 10),
        inst_verify_by: loginInfo.id || actionSite.inst_verify_by,
      };
      setVerification((prev) => prev.filter((s) => s.id !== actionSite.id));
      setVerified((prev) => [updated, ...prev.filter((s) => s.id !== actionSite.id)]);
      setSuccessMsg(res.message || 'Status updated successfully.');
      setActionSite(null);
      setActionRemarks('');
      fetchData();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to update installation verification status.');
    } finally {
      setSubmitting(false);
    }
  };

  const currentList = activeTab === 'pending' ? verification : verified;

  const filteredList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return currentList;
    return currentList.filter((s) => {
      const serials = parseStringArray(s.module_serial_no || s.module_no).join(' ');
      const hay = [
        s.id,
        s.vendor_name,
        s.state,
        s.f_district || s.district,
        s.f_block || s.block || s.f_post,
        s.f_village || s.village,
        s.f_farmer_name || s.farmer_name,
        s.f_father_name || s.father_name,
        s.f_customer_no,
        s.lot_no,
        s.vfd_no,
        getInverterNo(s),
        serials,
        s.inst_remarks,
        s.inst_verify_date,
        formatVerifyBy(s),
        s.inst_verify_remarks,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [currentList, searchQuery, formatVerifyBy]);

  const pagination = usePagination(filteredList, { initialPageSize: 50 });

  const exportCols = useMemo<ExportColumn<UpKusumCSiteRow>[]>(() => {
    const baseCols: ExportColumn<UpKusumCSiteRow>[] = [
      { header: 'Sr. No.', accessor: ((_r: UpKusumCSiteRow, idx?: number) => (idx !== undefined ? idx + 1 : '')) as any },
      { header: 'Vendor Name', accessor: (r) => r.vendor_name || DASH },
      { header: 'State', accessor: (r) => (r.state || 'UP').toUpperCase() },
      { header: 'District', accessor: (r) => r.f_district || r.district || DASH },
      { header: 'Block', accessor: (r) => r.f_block || r.block || r.f_post || DASH },
      { header: 'Village', accessor: (r) => r.f_village || r.village || DASH },
      { header: 'Applicant Name', accessor: (r) => r.f_farmer_name || r.farmer_name || DASH },
      { header: 'VFD No.', accessor: (r) => r.vfd_no || DASH },
      { header: 'Inverter No.', accessor: (r) => getInverterNo(r) || DASH },
      { header: 'Module Serial No.', accessor: (r) => parseStringArray(r.module_serial_no || r.module_no).join(', ') || DASH },
      { header: 'Remarks', accessor: (r) => r.inst_remarks || DASH },
      { header: 'Verify Status', accessor: (r) => getVerifyStatusLabel(r.inst_verify_status) },
    ];
    if (activeTab === 'approved_rejected') {
      baseCols.push(
        { header: 'Verify Date', accessor: (r) => fmtDate(r.inst_verify_date) },
        { header: 'Verify By', accessor: (r) => formatVerifyBy(r) },
        { header: 'Verify Remarks', accessor: (r) => r.inst_verify_remarks || DASH }
      );
    }
    return baseCols;
  }, [activeTab, formatVerifyBy]);

  const detailAllSerials = useMemo(
    () => (detailSite ? parseStringArray(detailSite.module_serial_no || detailSite.module_no) : []),
    [detailSite]
  );

  const detailFilteredSerials = useMemo(() => {
    const q = moduleSearch.trim().toLowerCase();
    return detailAllSerials
      .map((serial, index) => ({ serial, index: index + 1 }))
      .filter((item) => !q || item.serial.toLowerCase().includes(q) || String(item.index) === q);
  }, [detailAllSerials, moduleSearch]);

  const isApprovedRejectedTab = activeTab === 'approved_rejected';
  const totalTableCols = isApprovedRejectedTab ? 18 : 16;
  const stamp = new Date().toISOString().slice(0, 10);

  return (
    <div className="solar-erp-page">
      <style>{TABLE_PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      <PageHead
        title="Verify Kusum-C Installation"
        subtitle="Audit UP Kusum C vendor installations, hardware serial numbers, and field photo proof"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Uttar Pradesh', href: '/vendor-management/up' },
          { label: 'Kusum C', href: '/vendor-management/up/kusumc/installation/dashboard' },
          { label: 'Verify Installation' },
        ]}
      />

      <StatusFeedbackBanners
        errorMsg={errorMsg}
        successMsg={successMsg}
        onClearError={() => setErrorMsg('')}
        onClearSuccess={() => setSuccessMsg('')}
      />

      {/* Top KPI Cards */}
      <div className="asw-cards-row asw-cards-row--5">
        <KpiCard
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="2" y="3" width="20" height="14" rx="2" /></svg>}
          tone="accent"
          label="Total / Assigned / Not Assigned"
          value={`${fmtNum(detail?.total)} / ${fmtNum(detail?.assigned)} / ${fmtNum(detail?.not_assigned)}`}
          sub="Total · Assigned · Not Assigned"
        />
        <KpiCard
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>}
          tone="cyan"
          label="Installation Status"
          value={`${fmtNum(detail?.complete)} / ${fmtNum(detail?.pending)}`}
          sub="Complete / Pending"
        />
        <KpiCard
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>}
          tone="amber"
          label="Verify Pending"
          value={fmtNum(detail?.verify_pending ?? verification.length)}
          sub="Awaiting QA review"
        />
        <KpiCard
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M20 6L9 17l-5-5" /></svg>}
          tone="emerald"
          label="Verify Approved"
          value={fmtNum(detail?.verify_approved)}
          sub="Approved installations"
        />
        <KpiCard
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>}
          tone="red"
          label="Verify Rejected"
          value={fmtNum(detail?.verify_reject)}
          sub="Rejected for rework"
        />
      </div>

      {/* Report Wise Bifurcation Pills */}
      <div className="asw-bifurcation-row">
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ax-text-muted)' }}>Report Wise Bifurcation:</span>
        <button
          type="button"
          className={`asw-pill-btn ${activeTab === 'pending' ? 'active ax-btn--primary' : ''}`}
          onClick={() => {
            setActiveTab('pending');
            pagination.setPage(1);
          }}
        >
          Verification Pending
          <span style={{ padding: '1px 6px', borderRadius: 10, background: activeTab === 'pending' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', fontSize: 11 }}>
            {verification.length}
          </span>
        </button>
        <button
          type="button"
          className={`asw-pill-btn ${activeTab === 'approved_rejected' ? 'active ax-btn--primary' : ''}`}
          onClick={() => {
            setActiveTab('approved_rejected');
            pagination.setPage(1);
          }}
        >
          Approved/Rejected Data
          <span style={{ padding: '1px 6px', borderRadius: 10, background: activeTab === 'approved_rejected' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', fontSize: 11 }}>
            {verified.length}
          </span>
        </button>
      </div>

      <section className="ax-card ax-col--12">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">
              {activeTab === 'pending' ? 'Kusum-C Verification Pending List' : 'Kusum-C Approved / Rejected Installations'}
            </h2>
            <p className="ax-card__subtitle">Showing {filteredList.length} installation record(s)</p>
          </div>
          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search vendor, applicant, district, serial..."
                size="sm"
              />
              <TableExportToolbar
                onCopy={() => copyRowsToClipboard(filteredList, exportCols)}
                onExportCSV={() => exportRowsCSV(filteredList, exportCols, `UP_KusumC_Verify_${activeTab}_${stamp}`)}
                onExportExcel={() => exportRowsExcel(filteredList, exportCols, `UP_KusumC_Verify_${activeTab}_${stamp}`)}
                onExportPDF={() => exportRowsPDF(filteredList, exportCols, 'Verify Kusum-C Installation')}
              />
            </div>
          </div>
        </div>

        <div className="ax-table-wrap">
          <table
            className="ax-table ax-table--hover ula-table--wide"
            style={{ whiteSpace: 'nowrap', minWidth: isApprovedRejectedTab ? 2150 : 1700 }}
          >
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th">Sr. No.</th>
                <th className="ax-table__th">Vendor Name</th>
                <th className="ax-table__th">State</th>
                <th className="ax-table__th">District</th>
                <th className="ax-table__th">Block</th>
                <th className="ax-table__th">Village</th>
                <th className="ax-table__th">Applicant Name</th>
                <th className="ax-table__th">VFD No.</th>
                <th className="ax-table__th">Inverter No.</th>
                <th className="ax-table__th">Module Serial No.</th>
                <th className="ax-table__th">Farmer With Module Image</th>
                <th className="ax-table__th">Inverter and VFD with Farmer Image</th>
                <th className="ax-table__th">Running Water With Farmer Image</th>
                <th className="ax-table__th">Remarks</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Verify Status</th>
                {isApprovedRejectedTab && (
                  <>
                    <th className="ax-table__th">Verify Date</th>
                    <th className="ax-table__th">Verify By</th>
                    <th className="ax-table__th">Verify Remarks</th>
                  </>
                )}
                {!isApprovedRejectedTab && (
                  <th className="ax-table__th" style={{ textAlign: 'center' }}>Action</th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={totalTableCols} style={centerCell}>
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading Kusum C installations...
                  </td>
                </tr>
              ) : pagination.paged.length === 0 ? (
                <tr>
                  <td colSpan={totalTableCols} style={centerCell}>
                    <TableEmptyState title="No installation records found" description="No records match this tab or search." />
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
                  const st = Number(row.inst_verify_status ?? 0);

                  return (
                    <tr key={row.id}>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{globalIdx}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{row.vendor_name || DASH}</td>
                      <td className="ax-table__td">{(row.state || 'UP').toUpperCase()}</td>
                      <td className="ax-table__td">{row.f_district || row.district || DASH}</td>
                      <td className="ax-table__td">{row.f_block || row.block || row.f_post || DASH}</td>
                      <td className="ax-table__td">{row.f_village || row.village || DASH}</td>
                      <td className="ax-table__td">
                        <div
                          style={{ fontWeight: 600, cursor: 'pointer', color: 'var(--ax-primary-600, #2563eb)' }}
                          onClick={() => openDetailsModal(row)}
                          title="Click to view full installation details"
                        >
                          {row.f_farmer_name || row.farmer_name || DASH}
                        </div>
                        {(row.f_father_name || row.father_name) && (
                          <div style={{ fontSize: 11, color: '#64748b' }}>S/o {row.f_father_name || row.father_name}</div>
                        )}
                      </td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>{row.vfd_no || DASH}</td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>{inverterNo || DASH}</td>
                      <td className="ax-table__td">
                        {serials.length ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {serials.slice(0, 2).map((s, i) => (
                              <span key={i} style={{ fontFamily: 'monospace', fontSize: 10.5, background: '#f1f5f9', padding: '1px 5px', borderRadius: 4 }}>
                                {s}
                              </span>
                            ))}
                            {serials.length > 2 && (
                              <button
                                type="button"
                                onClick={() => openDetailsModal(row)}
                                style={{ fontSize: 10, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0, fontWeight: 600 }}
                              >
                                +{serials.length - 2} more (Search modules)
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
                          alt="Farmer With Module"
                          onClick={(url, title) => setLightbox({ url, title })}
                        />
                      </td>
                      <td className="ax-table__td">
                        <MediaFileThumbnail
                          url={vfdImg ? resolveUpMediaUrl(vfdImg, 'kusumc') : null}
                          alt="Inverter & VFD With Farmer"
                          onClick={(url, title) => setLightbox({ url, title })}
                        />
                      </td>
                      <td className="ax-table__td">
                        <MediaFileThumbnail
                          url={waterImg ? resolveUpMediaUrl(waterImg, 'kusumc') : null}
                          alt="Running Water With Farmer"
                          onClick={(url, title) => setLightbox({ url, title })}
                        />
                      </td>
                      <td className="ax-table__td" style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }} title={row.inst_remarks || ''}>
                        {row.inst_remarks || DASH}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {st === 1 ? (
                          <span className="ax-badge ax-badge--soft ax-badge--success">Approved</span>
                        ) : st === 2 ? (
                          <span className="ax-badge ax-badge--soft ax-badge--danger">Rejected</span>
                        ) : (
                          <span className="ax-badge ax-badge--soft ax-badge--warning">Pending</span>
                        )}
                      </td>
                      {isApprovedRejectedTab && (
                        <>
                          <td className="ax-table__td">{fmtDate(row.inst_verify_date)}</td>
                          <td className="ax-table__td">{formatVerifyBy(row)}</td>
                          <td
                            className="ax-table__td"
                            style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}
                            title={row.inst_verify_remarks || ''}
                          >
                            {row.inst_verify_remarks || DASH}
                          </td>
                        </>
                      )}
                      {!isApprovedRejectedTab && (
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: 6 }}>
                            <button
                              type="button"
                              className="ax-btn ax-btn--secondary ax-btn--xs"
                              onClick={() => openDetailsModal(row)}
                            >
                              Details
                            </button>
                            <button
                              type="button"
                              className="ax-btn ax-btn--primary ax-btn--xs"
                              onClick={() => {
                                setActionSite(row);
                                setActionStatus('1');
                                setActionRemarks(row.inst_verify_remarks || '');
                              }}
                            >
                              Verify
                            </button>
                          </div>
                        </td>
                      )}
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

      {/* Verify Status Modal (Endpoint #11) */}
      <Modal
        open={Boolean(actionSite)}
        onClose={() => setActionSite(null)}
        title="Verify Kusum-C Installation"
        subtitle={actionSite ? `Applicant: ${actionSite.f_farmer_name || actionSite.farmer_name} (Site #${actionSite.id})` : ''}
        maxWidth={500}
      >
        <form onSubmit={handleVerifySubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
              Verification Decision <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              className="ax-input"
              value={actionStatus}
              onChange={(e) => setActionStatus(e.target.value as '1' | '2')}
              style={{ width: '100%' }}
              required
            >
              <option value="1">Approve (1)</option>
              <option value="2">Reject (2)</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Remarks</label>
            <textarea
              className="ax-input"
              rows={3}
              value={actionRemarks}
              onChange={(e) => setActionRemarks(e.target.value)}
              placeholder="Enter QA verification remarks..."
              style={{ width: '100%', padding: 10 }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setActionSite(null)}>
              Cancel
            </button>
            <button type="submit" className="ax-btn ax-btn--primary" disabled={submitting}>
              {submitting ? 'Updating...' : 'Submit Verification'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Full Site Installation Details Modal with Module Search */}
      <Modal
        open={Boolean(detailSite)}
        onClose={closeDetailsModal}
        title="Kusum-C Site Installation Details"
        subtitle={detailSite ? `Site #${detailSite.id} • ${detailSite.f_farmer_name || detailSite.farmer_name || ''}` : ''}
        maxWidth={920}
        footer={
          <button type="button" className="ax-btn ax-btn--primary" onClick={closeDetailsModal}>
            Close
          </button>
        }
      >
        {detailSite && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, fontSize: 13 }}>
            {/* Section 1: Module Serial Numbers with Dedicated Search */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 10,
                padding: 14,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  marginBottom: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Module Serial Numbers</span>
                  <span className="ax-badge ax-badge--soft ax-badge--info" style={{ fontSize: 11 }}>
                    {moduleSearch.trim()
                      ? `${detailFilteredSerials.length} of ${detailAllSerials.length}`
                      : `${detailAllSerials.length} Total`}
                  </span>
                </div>
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

              {detailAllSerials.length === 0 ? (
                <div style={{ fontSize: 12, color: '#64748b' }}>No module serial numbers recorded.</div>
              ) : detailFilteredSerials.length === 0 ? (
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  No module serial matches <b>"{moduleSearch}"</b>.
                </div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 170, overflowY: 'auto' }}>
                  {detailFilteredSerials.map(({ serial, index }) => (
                    <span
                      key={`${index}-${serial}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        fontFamily: 'monospace',
                        fontSize: 11.5,
                        background: '#ffffff',
                        padding: '4px 9px',
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

            {/* Section 2: Farmer & Location Information */}
            <div>
              <h4 style={{ margin: '0 0 10px 0', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569' }}>
                Farmer & Site Information
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                <div><span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>Applicant Name</span><b>{detailSite.f_farmer_name || detailSite.farmer_name || DASH}</b></div>
                <div><span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>Father Name</span><b>{detailSite.f_father_name || detailSite.father_name || DASH}</b></div>
                <div><span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>Contact No.</span><b>{detailSite.f_contact || detailSite.contact || DASH}</b></div>
                <div><span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>Customer No.</span><b>{detailSite.f_customer_no || DASH}</b></div>
                <div><span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>Lot No.</span><b>{detailSite.lot_no || DASH}</b></div>
                <div><span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>Phase / Volume / KC Wise</span><b>{[detailSite.phase || DASH, detailSite.volume || DASH, detailSite.kc_wise || DASH].join(' / ')}</b></div>
                <div><span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>State</span><b>{(detailSite.state || 'UP').toUpperCase()}</b></div>
                <div><span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>District</span><b>{detailSite.f_district || detailSite.district || DASH}</b></div>
                <div><span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>Tehsil / Block</span><b>{[detailSite.f_tehsil, detailSite.f_block || detailSite.block].filter(Boolean).join(' / ') || DASH}</b></div>
                <div><span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>Post / Village</span><b>{[detailSite.f_post, detailSite.f_village || detailSite.village].filter(Boolean).join(' / ') || DASH}</b></div>
                <div><span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>PIN / Aadhar</span><b>{[detailSite.f_pin || DASH, detailSite.f_aadhar || DASH].join(' / ')}</b></div>
                <div><span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>Pump Capacity</span><b>{detailSite.pump_capacity ? `${detailSite.pump_capacity} HP` : DASH}</b></div>
                <div><span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>Invoice No. / Date</span><b>{detailSite.f_invoice_no || DASH} {detailSite.f_invoice_date ? `(${fmtDate(detailSite.f_invoice_date)})` : ''}</b></div>
                <div><span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>Contractor / Firm</span><b>{[detailSite.c_contractor_name, detailSite.KLK_Firm].filter(Boolean).join(' · ') || DASH}</b></div>
              </div>
            </div>

            {/* Section 3: Vendor, Hardware & Installation */}
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569' }}>
                Vendor, Hardware & Installation Details
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                <div><span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>Vendor Name</span><b>{detailSite.vendor_name || DASH} {detailSite.vendor_id ? `(#${detailSite.vendor_id})` : ''}</b></div>
                <div><span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>Assign Date</span><b>{fmtDate(detailSite.inst_assign_date)}</b></div>
                <div><span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>Deadline Date</span><b>{fmtDate(detailSite.inst_deadline)}</b></div>
                <div><span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>Installation Date</span><b>{fmtDate(detailSite.inst_date)}</b></div>
                <div><span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>VFD No.</span><code style={{ fontWeight: 600 }}>{detailSite.vfd_no || DASH}</code></div>
                <div><span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>VFD Status</span><b>{formatYesNoFlag(detailSite.vfd_status)}</b></div>
                <div><span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>Inverter No.</span><code style={{ fontWeight: 600 }}>{getInverterNo(detailSite) || DASH}</code></div>
                <div><span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>RMS ID / IMEI</span><b>{[detailSite.rmsid || DASH, detailSite.imei || DASH].join(' / ')}</b></div>
                <div><span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>Latitude / Longitude</span><b>{detailSite.latitude || DASH}, {detailSite.longitude || DASH}</b></div>
                <div style={{ gridColumn: '1 / -1' }}><span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>Installation Remarks</span><b>{detailSite.inst_remarks || DASH}</b></div>
              </div>
            </div>

            {/* Section 4: Material Dispatch & Field Progress */}
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569' }}>
                Material Dispatch & Site Execution
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
                <div><span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>Dispatch Status</span><b>{formatYesNoFlag(detailSite.material_dispatch_status)}</b></div>
                <div><span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>BOS Status</span><b>{formatYesNoFlag(detailSite.mt_bos)}</b></div>
                <div><span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>Inverter Material</span><b>{formatYesNoFlag(detailSite.mt_inverter)}</b></div>
                <div><span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>Structure Material</span><b>{formatYesNoFlag(detailSite.mt_structure)}</b></div>
                <div><span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>Modules Material</span><b>{formatYesNoFlag(detailSite.mt_modules)}</b></div>
                <div><span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>Foundation</span><b>{formatYesNoFlag(detailSite.ins_foundation)}</b></div>
                <div><span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>Module Mounting</span><b>{formatYesNoFlag(detailSite.ins_module_mounting)}</b></div>
                <div><span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>Inverter Installed</span><b>{formatYesNoFlag(detailSite.ins_inverter_installation)}</b></div>
              </div>
            </div>

            {/* Section 5: Verification, Document, Payment & AMC */}
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569' }}>
                Verification, Document, Payment & AMC
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                <div><span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>Verify Status</span><b>{getVerifyStatusLabel(detailSite.inst_verify_status)}</b></div>
                <div><span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>Verify Date</span><b>{fmtDate(detailSite.inst_verify_date)}</b></div>
                <div><span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>Verify By</span><b>{formatVerifyBy(detailSite)}</b></div>
                <div><span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>Verify Remarks</span><b>{detailSite.inst_verify_remarks || DASH}</b></div>
                <div><span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>Document Status</span><b>{getDocStatusLabel(detailSite.inst_doc_status)}</b></div>
                <div><span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>Document Date</span><b>{fmtDate(detailSite.inst_doc_date)}</b></div>
                <div><span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>Doc Verify Remarks</span><b>{detailSite.inst_doc_verify_remarks || detailSite.inst_doc_remarks || DASH}</b></div>
                <div><span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>HOC / Net Metering</span><b>{formatYesNoFlag(detailSite.doc_hoc)} / {formatYesNoFlag(detailSite.net_metering)}</b></div>
                <div><span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>Claim / Pay Status</span><b>{detailSite.inst_claim_status ?? 0} / {detailSite.inst_pay_status ?? 0}</b></div>
                <div><span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>AMC Status / Type / Date</span><b>{formatYesNoFlag(detailSite.amc_status)} · {detailSite.amc_type || DASH} · {fmtDate(detailSite.amc_date)}</b></div>
              </div>
            </div>

            {/* Section 6: Field Photos & Document */}
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569' }}>
                Field Photos & Documents
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 11, color: '#64748b' }}>Farmer With Module</span>
                  <MediaFileThumbnail
                    url={detailSite.farmer_with_module || detailSite.module_image ? resolveUpMediaUrl(detailSite.farmer_with_module || detailSite.module_image, 'kusumc') : null}
                    alt="Farmer With Module Image"
                    onClick={(url, title) => setLightbox({ url, title })}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 11, color: '#64748b' }}>Inverter & VFD With Farmer</span>
                  <MediaFileThumbnail
                    url={detailSite.inverter_vfd_with_farmer || detailSite.inverter_vfd_image ? resolveUpMediaUrl(detailSite.inverter_vfd_with_farmer || detailSite.inverter_vfd_image, 'kusumc') : null}
                    alt="Inverter & VFD With Farmer Image"
                    onClick={(url, title) => setLightbox({ url, title })}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 11, color: '#64748b' }}>Running Water With Farmer</span>
                  <MediaFileThumbnail
                    url={detailSite.running_water_with_farmer || detailSite.running_water_image ? resolveUpMediaUrl(detailSite.running_water_with_farmer || detailSite.running_water_image, 'kusumc') : null}
                    alt="Running Water With Farmer Image"
                    onClick={(url, title) => setLightbox({ url, title })}
                  />
                </div>
                {detailSite.inst_doc && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: 11, color: '#64748b' }}>Installation Document</span>
                    <MediaFileThumbnail
                      url={resolveUpMediaUrl(detailSite.inst_doc, 'kusumc')}
                      alt="Installation Document"
                      onClick={(url, title) => setLightbox({ url, title })}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <MediaLightbox url={lightbox?.url || null} title={lightbox?.title} onClose={() => setLightbox(null)} />
    </div>
  );
}

export default UPKusumCVerifyInstallation;
