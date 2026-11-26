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
  upSsl18wAdminService,
  resolveUpMediaUrl,
  getUpMediaCandidates,
  type UpSsl18wSiteRow,
  type UpSsl18wDetailSummary,
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
  DASH,
  copyRowsToClipboard,
  exportRowsCSV,
  exportRowsExcel,
  exportRowsPDF,
} from '../upInstallationShared';

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

export function UPSSL18WVerifyInstallation() {
  const [verification, setVerification] = useState<UpSsl18wSiteRow[]>([]);
  const [verified, setVerified] = useState<UpSsl18wSiteRow[]>([]);
  const [detail, setDetail] = useState<UpSsl18wDetailSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [activeTab, setActiveTab] = useState<'pending' | 'approved_rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState('');

  // Verify Modal (#10: id, status: 1=Approve | 2=Reject, inst_verify_remarks)
  const [actionSite, setActionSite] = useState<UpSsl18wSiteRow | null>(null);
  const [actionStatus, setActionStatus] = useState<'1' | '2'>('1');
  const [actionRemarks, setActionRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [lightbox, setLightbox] = useState<{ url: string; title?: string; candidates?: string[] } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await upSsl18wAdminService.getViewInstallation();
      setDetail(res.detail);
      setVerification(res.verification);
      setVerified(res.verified);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to load UP SSL-18W installation verification records.');
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
      const res = await upSsl18wAdminService.verifyInstallationStatus({
        id: actionSite.id,
        status: statusNum,
        inst_verify_remarks: actionRemarks.trim() || undefined,
      });
      setSuccessMsg(res.message || 'Status updated successfully!');
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
    return currentList.filter((r) => {
      const hay = [
        r.id,
        r.uid || r.unique_id,
        r.vendor_name || r.vendors?.name,
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
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [currentList, searchQuery]);

  const pagination = usePagination(filteredList, { initialPageSize: 50 });

  const exportCols = useMemo<ExportColumn<UpSsl18wSiteRow>[]>(
    () => [
      { header: 'Sr. No.', accessor: ((_r: UpSsl18wSiteRow, idx?: number) => (idx !== undefined ? idx + 1 : '')) as any },
      { header: 'Vendor', accessor: (r) => r.vendor_name || r.vendors?.name || (r.inst_vendor ? `Vendor #${r.inst_vendor}` : DASH) },
      { header: 'UID', accessor: (r) => r.uid || r.unique_id || DASH },
      { header: 'Installation Date', accessor: (r) => fmtDate(r.inst_date || r.installation_date) },
      { header: 'State', accessor: (r) => (r.state || 'UP').toUpperCase() },
      { header: 'Phase', accessor: (r) => r.phase || r.volume || DASH },
      { header: 'District', accessor: (r) => r.district || DASH },
      { header: 'Block', accessor: (r) => r.block || DASH },
      { header: 'Panchayat', accessor: (r) => r.panchayat || DASH },
      { header: 'Ward No', accessor: (r) => r.ward_no || r.ward || DASH },
      { header: 'Pole No', accessor: (r) => r.pole_no || DASH },
      { header: 'Beneficiary Name', accessor: (r) => r.beneficiary_name || DASH },
      { header: 'Beneficiary Contact', accessor: (r) => r.beneficiary_contact || r.contact_no || DASH },
      { header: 'Latitude', accessor: (r) => r.latitude || DASH },
      { header: 'Longitude', accessor: (r) => r.longitude || DASH },
      { header: 'UUID No.', accessor: (r) => r.uuid_no || r.uuid || DASH },
      { header: 'IMEI No.', accessor: (r) => r.imei_no || r.imei || DASH },
      { header: 'Light No.', accessor: (r) => r.light_no || r.luminary_no || DASH },
      { header: 'Battery No.', accessor: (r) => getRowBatteryNo(r) },
      { header: 'Panel No.', accessor: (r) => r.panel_no || r.module_no || DASH },
      { header: 'Remark', accessor: (r) => r.inst_verify_remarks || r.inst_remarks || r.remarks || DASH },
      {
        header: 'Verify Status',
        accessor: (r) =>
          Number(r.inst_verify_status) === 1 ? 'Approved' : Number(r.inst_verify_status) === 2 ? 'Rejected' : 'Pending',
      },
    ],
    []
  );

  const stamp = new Date().toISOString().slice(0, 10);

  return (
    <div className="solar-erp-page">
      <style>{TABLE_PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      <PageHead
        title="Verify UP SSL 18W Installation"
        subtitle="Audit commissioned 18W Solar Street Lights, serial numbers, GPS coordinates, and site photographs"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Uttar Pradesh', href: '/vendor-management/up' },
          { label: 'SSL 18W', href: '/vendor-management/up/ssl18w/installation/dashboard' },
          { label: 'Verify Installation' },
        ]}
      />

      <StatusFeedbackBanners
        errorMsg={errorMsg}
        successMsg={successMsg}
        onClearError={() => setErrorMsg('')}
        onClearSuccess={() => setSuccessMsg('')}
      />

      <div className="asw-cards-row asw-cards-row--5">
        <KpiCard
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /></svg>}
          tone="accent"
          label="Total / Assigned / Accept / Not Assigned"
          value={`${fmtNum(detail?.total)} / ${fmtNum(detail?.assigned)} / ${fmtNum(detail?.accept)} / ${fmtNum(detail?.not_assigned)}`}
          sub="Feasible SSL-18W lights"
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
          sub="Lights pending audit"
        />
        <KpiCard
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M20 6L9 17l-5-5" /></svg>}
          tone="emerald"
          label="Verify Approved"
          value={fmtNum(detail?.verify_approved)}
          sub="Verified lights"
        />
        <KpiCard
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>}
          tone="red"
          label="Verify Rejected"
          value={fmtNum(detail?.verify_reject)}
          sub="Rejected lights"
        />
      </div>

      {/* Report Wise Bifurcation Pills matching exact user labels */}
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
          Lights Completed
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
          Approved/Rejected Lights
          <span style={{ padding: '1px 6px', borderRadius: 10, background: activeTab === 'approved_rejected' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', fontSize: 11 }}>
            {verified.length}
          </span>
        </button>
      </div>

      <section className="ax-card ax-col--12">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">
              {activeTab === 'pending' ? 'Lights Completed (Verification Pending)' : 'Approved / Rejected Lights'}
            </h2>
            <p className="ax-card__subtitle">Showing {filteredList.length} light record(s)</p>
          </div>
          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search UID, beneficiary, IMEI, light no..." size="sm" />
              <TableExportToolbar
                onCopy={() => copyRowsToClipboard(filteredList, exportCols)}
                onExportCSV={() => exportRowsCSV(filteredList, exportCols, `UP_SSL18W_Verify_${activeTab}_${stamp}`)}
                onExportExcel={() => exportRowsExcel(filteredList, exportCols, `UP_SSL18W_Verify_${activeTab}_${stamp}`)}
                onExportPDF={() => exportRowsPDF(filteredList, exportCols, 'Verify UP SSL 18W Installation')}
              />
            </div>
          </div>
        </div>

        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap', minWidth: 2200 }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th">Sr. No.</th>
                <th className="ax-table__th">Vendor</th>
                <th className="ax-table__th">UID</th>
                <th className="ax-table__th">Installation Date</th>
                <th className="ax-table__th">State</th>
                <th className="ax-table__th">Phase</th>
                <th className="ax-table__th">District</th>
                <th className="ax-table__th">Block</th>
                <th className="ax-table__th">Panchayat</th>
                <th className="ax-table__th">Ward No</th>
                <th className="ax-table__th">Pole No</th>
                <th className="ax-table__th">Beneficiary Name</th>
                <th className="ax-table__th">Beneficiary Contact</th>
                <th className="ax-table__th">Latitude</th>
                <th className="ax-table__th">Longitude</th>
                <th className="ax-table__th">UUID No.</th>
                <th className="ax-table__th">IMEI No.</th>
                <th className="ax-table__th">Light No.</th>
                <th className="ax-table__th">Battery No.</th>
                <th className="ax-table__th">Panel No.</th>
                <th className="ax-table__th">Light Image</th>
                <th className="ax-table__th">Remark</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Verify Status</th>
                {activeTab === 'pending' && <th className="ax-table__th" style={{ textAlign: 'center' }}>Action</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={activeTab === 'pending' ? 24 : 23} style={centerCell}>
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading SSL-18W light records...
                  </td>
                </tr>
              ) : pagination.paged.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === 'pending' ? 24 : 23} style={centerCell}>
                    <TableEmptyState title="No installation records found" description="No lights match this view." />
                  </td>
                </tr>
              ) : (
                pagination.paged.map((row, idx) => {
                  const globalIdx = (pagination.curPage - 1) * pagination.pageSize + idx + 1;
                  const rawImg = getRowLightFile(row);
                  const imgCandidates = rawImg ? getUpMediaCandidates(rawImg, 'ssl18w') : [];
                  const primaryImgUrl = imgCandidates[0] || (rawImg ? resolveUpMediaUrl(rawImg, 'ssl18w') : null);
                  const batteryDisplay = getRowBatteryNo(row);
                  const st = Number(row.inst_verify_status ?? 0);

                  return (
                    <tr key={row.id}>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{globalIdx}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>
                        {row.vendor_name || row.vendors?.name || (row.inst_vendor ? `Vendor #${row.inst_vendor}` : DASH)}
                      </td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>{row.uid || row.unique_id || DASH}</td>
                      <td className="ax-table__td">{fmtDate(row.inst_date || row.installation_date)}</td>
                      <td className="ax-table__td">{(row.state || 'UP').toUpperCase()}</td>
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
                      <td className="ax-table__td" style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {row.inst_verify_remarks || row.inst_remarks || row.remarks || DASH}
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
                      {activeTab === 'pending' && (
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
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

      {/* Verify Modal (#10) */}
      <Modal
        open={Boolean(actionSite)}
        onClose={() => setActionSite(null)}
        title="Verify UP SSL-18W Light Installation"
        subtitle={actionSite ? `UID: ${actionSite.uid || actionSite.id} • Beneficiary: ${actionSite.beneficiary_name || DASH}` : ''}
        maxWidth={480}
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
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Verification Remarks</label>
            <textarea
              className="ax-input"
              rows={3}
              value={actionRemarks}
              onChange={(e) => setActionRemarks(e.target.value)}
              placeholder="Optional QA verification remarks..."
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

      <MediaLightbox
        url={lightbox?.url || null}
        title={lightbox?.title}
        candidates={lightbox?.candidates}
        onClose={() => setLightbox(null)}
      />
    </div>
  );
}

export default UPSSL18WVerifyInstallation;
