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
  DASH,
  copyRowsToClipboard,
  exportRowsCSV,
  exportRowsExcel,
  exportRowsPDF,
} from '../upInstallationShared';

export function UPKusumCVerifyDocument() {
  const [verification, setVerification] = useState<UpKusumCSiteRow[]>([]);
  const [verified, setVerified] = useState<UpKusumCSiteRow[]>([]);
  const [detail, setDetail] = useState<UpKusumCDetailSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [activeTab, setActiveTab] = useState<'pending' | 'approved_rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState('');

  // Verify Doc Modal (2=Approve, 3=Reject)
  const [actionSite, setActionSite] = useState<UpKusumCSiteRow | null>(null);
  const [docStatus, setDocStatus] = useState<'2' | '3'>('2');
  const [docRemarks, setDocRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [lightbox, setLightbox] = useState<{ url: string; title?: string } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await upKusumCAdminService.getViewInstallationDocument();
      setDetail(res.detail);
      setVerification(res.verification);
      setVerified(res.verified);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to load Kusum C installation documents.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDocVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionSite) return;
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const statusNum = Number(docStatus) as 2 | 3;
      const res = await upKusumCAdminService.verifyInstallationDocStatus({
        id: actionSite.id,
        status: statusNum,
        remarks: docRemarks.trim() || undefined,
      });
      setSuccessMsg(res.message || 'Document status updated successfully.');
      setActionSite(null);
      setDocRemarks('');
      fetchData();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to verify installation document.');
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
        r.f_district || r.district,
        r.f_block || r.block || r.f_post,
        r.f_village || r.village,
        r.f_farmer_name || r.farmer_name,
        r.inst_doc_remarks,
        r.inst_doc_verify_remarks,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [currentList, searchQuery]);

  const pagination = usePagination(filteredList, { initialPageSize: 50 });

  const exportCols = useMemo<ExportColumn<UpKusumCSiteRow>[]>(
    () => [
      { header: 'Sr. No.', accessor: ((_r: UpKusumCSiteRow, idx?: number) => (idx !== undefined ? idx + 1 : '')) as any },
      { header: 'State', accessor: (r) => (r.state || 'UP').toUpperCase() },
      { header: 'District', accessor: (r) => r.f_district || r.district || DASH },
      { header: 'Block', accessor: (r) => r.f_block || r.block || r.f_post || DASH },
      { header: 'Village', accessor: (r) => r.f_village || r.village || DASH },
      { header: 'Applicant Name', accessor: (r) => r.f_farmer_name || r.farmer_name || DASH },
      { header: 'Submit Date', accessor: (r) => fmtDate(r.inst_doc_date) },
      { header: 'Remarks', accessor: (r) => r.inst_doc_verify_remarks || r.inst_doc_remarks || DASH },
      {
        header: 'Verify Status',
        accessor: (r) =>
          Number(r.inst_doc_status) === 2 ? 'Approved' : Number(r.inst_doc_status) === 3 ? 'Rejected' : 'Pending',
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
        title="Verify Kusum-C Document"
        subtitle="Verify submitted UP Kusum C joint commissioning & handover documents"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Uttar Pradesh', href: '/vendor-management/up' },
          { label: 'Kusum C', href: '/vendor-management/up/kusumc/installation/dashboard' },
          { label: 'Verify Document' },
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
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /></svg>}
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
          label="Document Pending"
          value={fmtNum(detail?.doc_pending ?? verification.length)}
          sub="Pending verification"
        />
        <KpiCard
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M20 6L9 17l-5-5" /></svg>}
          tone="emerald"
          label="Document Approved"
          value={fmtNum(detail?.doc_approved)}
          sub="Cleared documents"
        />
        <KpiCard
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>}
          tone="red"
          label="Document Rejected"
          value={fmtNum(detail?.doc_reject)}
          sub="Rejected documents"
        />
      </div>

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
              {activeTab === 'pending' ? 'Kusum-C Document Verification Pending' : 'Kusum-C Verified Documents'}
            </h2>
            <p className="ax-card__subtitle">Showing {filteredList.length} document record(s)</p>
          </div>
          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search applicant, district, village..." size="sm" />
              <TableExportToolbar
                onCopy={() => copyRowsToClipboard(filteredList, exportCols)}
                onExportCSV={() => exportRowsCSV(filteredList, exportCols, `UP_KusumC_VerifyDoc_${activeTab}_${stamp}`)}
                onExportExcel={() => exportRowsExcel(filteredList, exportCols, `UP_KusumC_VerifyDoc_${activeTab}_${stamp}`)}
                onExportPDF={() => exportRowsPDF(filteredList, exportCols, 'Verify Kusum-C Document')}
              />
            </div>
          </div>
        </div>

        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap', minWidth: 1150 }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th">Sr. No.</th>
                <th className="ax-table__th">State</th>
                <th className="ax-table__th">District</th>
                <th className="ax-table__th">Block</th>
                <th className="ax-table__th">Village</th>
                <th className="ax-table__th">Applicant Name</th>
                <th className="ax-table__th">Document File</th>
                <th className="ax-table__th">Submit Date</th>
                <th className="ax-table__th">Remarks</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Verify Status</th>
                {activeTab === 'pending' && <th className="ax-table__th" style={{ textAlign: 'center' }}>Action</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={activeTab === 'pending' ? 11 : 10} style={centerCell}>
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading Kusum C documents...
                  </td>
                </tr>
              ) : pagination.paged.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === 'pending' ? 11 : 10} style={centerCell}>
                    <TableEmptyState title="No document records found" description="No documents match this view." />
                  </td>
                </tr>
              ) : (
                pagination.paged.map((row, idx) => {
                  const globalIdx = (pagination.curPage - 1) * pagination.pageSize + idx + 1;
                  const docPath = (row as any).inst_doc_file || row.inst_doc || row.doc_file || (row as any).document;
                  const docStatusNum = Number(row.inst_doc_status ?? 1);

                  return (
                    <tr key={row.id}>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{globalIdx}</td>
                      <td className="ax-table__td">{(row.state || 'UP').toUpperCase()}</td>
                      <td className="ax-table__td">{row.f_district || row.district || DASH}</td>
                      <td className="ax-table__td">{row.f_block || row.block || row.f_post || DASH}</td>
                      <td className="ax-table__td">{row.f_village || row.village || DASH}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{row.f_farmer_name || row.farmer_name || DASH}</td>
                      <td className="ax-table__td">
                        <MediaFileThumbnail
                          url={docPath ? resolveUpMediaUrl(docPath, 'kusumc') : null}
                          alt="Installation Document"
                          onClick={(url, title) => setLightbox({ url, title })}
                        />
                      </td>
                      <td className="ax-table__td">{fmtDate(row.inst_doc_date)}</td>
                      <td className="ax-table__td" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {row.inst_doc_verify_remarks || row.inst_doc_remarks || DASH}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {docStatusNum === 2 ? (
                          <span className="ax-badge ax-badge--soft ax-badge--success">Approved</span>
                        ) : docStatusNum === 3 ? (
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
                              setDocStatus('2');
                              setDocRemarks(row.inst_doc_verify_remarks || '');
                            }}
                          >
                            Verify Doc
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

      {/* Verify Document Modal (Endpoint #13: 2=Approve, 3=Reject) */}
      <Modal
        open={Boolean(actionSite)}
        onClose={() => setActionSite(null)}
        title="Verify Installation Document"
        subtitle={actionSite ? `Applicant: ${actionSite.f_farmer_name || actionSite.farmer_name} (Site #${actionSite.id})` : ''}
        maxWidth={480}
      >
        <form onSubmit={handleDocVerify} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
              Document Verification Status <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              className="ax-input"
              value={docStatus}
              onChange={(e) => setDocStatus(e.target.value as '2' | '3')}
              style={{ width: '100%' }}
              required
            >
              <option value="2">Approve (2)</option>
              <option value="3">Reject (3)</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Remarks</label>
            <textarea
              className="ax-input"
              rows={3}
              value={docRemarks}
              onChange={(e) => setDocRemarks(e.target.value)}
              placeholder="Enter document verification remarks..."
              style={{ width: '100%', padding: 10 }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setActionSite(null)}>
              Cancel
            </button>
            <button type="submit" className="ax-btn ax-btn--primary" disabled={submitting}>
              {submitting ? 'Updating...' : 'Save Document Status'}
            </button>
          </div>
        </form>
      </Modal>

      <MediaLightbox url={lightbox?.url || null} title={lightbox?.title} onClose={() => setLightbox(null)} />
    </div>
  );
}

export default UPKusumCVerifyDocument;
