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
  upRescoAdminService,
  resolveUpMediaUrl,
  type UpRescoBillRow,
  type UpRescoSiteRow,
} from '../../up-services';
import {
  TABLE_PAGE_CSS,
  OVERLAY_CSS,
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

/* ───────── Responsive page CSS matching Payment table design ───────── */
const PAGE_CSS = `
  .solar-erp-page {
    --asw-primary: var(--ax-accent, #2563eb);
    --asw-primary-rgb: var(--ax-accent-rgb, 37, 99, 235);
  }
  .solar-erp-page .ax-card { min-width: 0; }
  .solar-erp-page .ax-card__footer { width: 100%; box-sizing: border-box; }
  .solar-erp-page .ula-pagination-left {
    width: 100%; display: flex; justify-content: flex-start; align-items: center; margin: 0; overflow-x: auto;
  }
  .solar-erp-page .ula-pagination-left > * { margin-left: 0 !important; margin-right: 0 !important; }

  .solar-erp-page .asw-cards-row {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--ax-space-4, 16px);
    margin-bottom: var(--ax-space-5, 20px);
  }
  @media (max-width: 992px) {
    .solar-erp-page .asw-cards-row {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 520px) {
    .solar-erp-page .asw-cards-row {
      grid-template-columns: 1fr;
    }
  }

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

  /* All table columns fully scrollable horizontally - exact payment table design */
  .solar-erp-page .ax-table-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    width: 100%;
  }

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
  }
`;

function getBillStatusMeta(status: unknown): { label: string; tone: 'warning' | 'success' | 'danger' } {
  const code = Number(status);
  if (code === 1) return { label: 'Approved', tone: 'success' };
  if (code === 2) return { label: 'Rejected', tone: 'danger' };
  return { label: 'Pending Approval', tone: 'warning' };
}

export function UPRescoViewCreatedBills() {
  const [bills, setBills] = useState<UpRescoBillRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [lightbox, setLightbox] = useState<{ url: string; title?: string } | null>(null);

  // Review & Approval Modal State
  const [reviewModalBillId, setReviewModalBillId] = useState<number | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalBill, setModalBill] = useState<UpRescoBillRow | null>(null);
  const [modalResco, setModalResco] = useState<UpRescoSiteRow | null>(null);
  const [approvalDecision, setApprovalDecision] = useState<'1' | '2'>('1');
  const [approvalRemarks, setApprovalRemarks] = useState('');
  const [submittingApproval, setSubmittingApproval] = useState(false);

  const fetchBills = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await upRescoAdminService.getViewCreateBill();
      setBills(res);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to fetch Resco generated bills');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  const summary = useMemo(() => {
    const total = bills.length;
    let approved = 0;
    let pending = 0;
    let rejected = 0;
    bills.forEach((b) => {
      const s = Number(b.verify_status);
      if (s === 1) approved++;
      else if (s === 2) rejected++;
      else pending++;
    });
    return { total, approved, pending, rejected };
  }, [bills]);

  const filteredBills = useMemo(() => {
    let list = bills;
    if (statusFilter !== 'all') {
      const target = Number(statusFilter);
      list = list.filter((b) => Number(b.verify_status) === target);
    }
    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter((b) => {
      const sName = b.resco?.site_name || '';
      const dept = b.resco?.dept_name || '';
      const dist = b.resco?.district || '';
      const ca = b.resco?.ca_no || '';
      return (
        String(b.id).includes(q) ||
        String(b.resco_id).includes(q) ||
        sName.toLowerCase().includes(q) ||
        dept.toLowerCase().includes(q) ||
        dist.toLowerCase().includes(q) ||
        ca.toLowerCase().includes(q)
      );
    });
  }, [bills, searchQuery, statusFilter]);

  const pagination = usePagination(filteredBills, { initialPageSize: 50 });

  const handleOpenReviewModal = async (billId: number) => {
    setReviewModalBillId(billId);
    setModalLoading(true);
    setModalBill(null);
    setModalResco(null);
    setApprovalDecision('1');
    setApprovalRemarks('');
    try {
      const res = await upRescoAdminService.getCreateBillApproval(billId);
      setModalBill(res.bill);
      setModalResco(res.resco);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to fetch bill approval details');
      setReviewModalBillId(null);
    } finally {
      setModalLoading(false);
    }
  };

  const handleSubmitApproval = async () => {
    if (!reviewModalBillId) return;
    setSubmittingApproval(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await upRescoAdminService.billVerifyStatus(reviewModalBillId, {
        verify_status: Number(approvalDecision) as 1 | 2,
        remarks: approvalRemarks.trim() || undefined,
      });
      setSuccessMsg(res.message || 'Bill verification status updated successfully.');
      setReviewModalBillId(null);
      await fetchBills();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to update bill verify status');
    } finally {
      setSubmittingApproval(false);
    }
  };

  const exportCols = useMemo<ExportColumn<UpRescoBillRow>[]>(
    () => [
      { header: 'S.No.', accessor: ((_r: UpRescoBillRow, idx?: number) => (idx !== undefined ? idx + 1 : '')) as any },
      { header: 'Bill ID', accessor: 'id' },
      { header: 'Site ID', accessor: 'resco_id' },
      { header: 'Site Name', accessor: (r) => r.resco?.site_name || `Site #${r.resco_id}` },
      { header: 'Department', accessor: (r) => r.resco?.dept_name || DASH },
      { header: 'District', accessor: (r) => r.resco?.district || DASH },
      { header: 'CA No', accessor: (r) => r.resco?.ca_no || DASH },
      { header: 'Sanction Load (kW)', accessor: (r) => r.resco?.sanction_load || DASH },
      { header: 'Readings Count', accessor: (r) => r.readings?.length ?? 0 },
      { header: 'Status', accessor: (r) => getBillStatusMeta(r.verify_status).label },
      { header: 'Remarks', accessor: (r) => r.verify_remarks || DASH },
    ],
    []
  );

  return (
    <div className="solar-erp-page">
      <style>{TABLE_PAGE_CSS}</style>
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      <PageHead
        title="View Created UP Resco Bills"
        subtitle="Review solar generation meter readings, consumption certificates, and bill approvals for Uttar Pradesh Resco sites"
        breadcrumbs={[
          { label: 'ERP Dashboard', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Uttar Pradesh', href: '/vendor-management/up' },
          { label: 'Resco Installation', href: '/vendor-management/up/resco/installation/dashboard' },
          { label: 'View Created Bills' },
        ]}
      />

      <StatusFeedbackBanners errorMsg={errorMsg} successMsg={successMsg} />

      {/* KPI Cards Row */}
      <div className="asw-cards-row">
        <KpiCard label="Total Bills" value={summary.total} tone="primary" />
        <KpiCard label="Approved Bills" value={summary.approved} tone="success" />
        <KpiCard label="Pending Approval" value={summary.pending} tone="warning" />
        <KpiCard label="Rejected Bills" value={summary.rejected} tone="danger" />
      </div>

      {/* Main Table Card */}
      <div className="ax-card">
        <div className="ax-card__header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', width: '100%' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--ax-text, #0f172a)' }}>
                Generated Resco Solar Bills Register
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                Showing {filteredBills.length} generated bill{filteredBills.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>

          {/* Search, Filter & Export Toolbar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginTop: '12px', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flex: 1, minWidth: '300px' }}>
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search site name, bill ID, CA no, department, district..."
              />
              <select
                className="ax-input"
                style={{ height: '36px', fontSize: '13px', width: 'auto' }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Bill Statuses</option>
                <option value="0">Pending Approval (0)</option>
                <option value="1">Approved (1)</option>
                <option value="2">Rejected (2)</option>
              </select>
            </div>

            <TableExportToolbar
              onCopy={() => copyRowsToClipboard(filteredBills, exportCols)}
              onExportCSV={() => exportRowsCSV(filteredBills, exportCols, 'UP_Resco_Created_Bills')}
              onExportExcel={() => exportRowsExcel(filteredBills, exportCols, 'UP_Resco_Created_Bills')}
              onExportPDF={() => exportRowsPDF(filteredBills, exportCols, 'UP Resco Created Bills')}
            />
          </div>
        </div>

        {/* ── Responsive Horizontal Scroll Table matching Payment Table Design ── */}
        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap', minWidth: 1200 }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th">S.No.</th>
                <th className="ax-table__th">Bill ID</th>
                <th className="ax-table__th">Site Details</th>
                <th className="ax-table__th">Department & District</th>
                <th className="ax-table__th">CA & Sanction Load</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Readings Count</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Status</th>
                <th className="ax-table__th">Remarks</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={centerCell}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <span className="ax-spinner" aria-hidden="true" />
                      <span>Loading bills...</span>
                    </div>
                  </td>
                </tr>
              ) : pagination.paged.length === 0 ? (
                <tr>
                  <td colSpan={9} style={centerCell}>
                    <TableEmptyState
                      title="No bills found"
                      description={searchQuery ? 'Try adjusting your search criteria.' : 'No Resco generation bills have been generated yet.'}
                    />
                  </td>
                </tr>
              ) : (
                pagination.paged.map((r: UpRescoBillRow, idx: number) => {
                  const globalIdx = (pagination.curPage - 1) * pagination.pageSize + idx + 1;
                  const statusMeta = getBillStatusMeta(r.verify_status);
                  const readingsCount = r.readings?.length ?? 0;

                  return (
                    <tr key={r.id}>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>
                        {globalIdx}
                      </td>
                      <td className="ax-table__td" style={{ fontWeight: 700, color: '#2563eb' }}>
                        #{r.id}
                      </td>
                      <td className="ax-table__td">
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600, color: 'var(--ax-text-strong, #0f172a)' }}>
                            {r.resco?.site_name || `Site #${r.resco_id}`}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--ax-text-muted, #64748b)' }}>
                            Site ID: #{r.resco_id}
                          </span>
                        </div>
                      </td>
                      <td className="ax-table__td">
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600, color: 'var(--ax-text-strong, #0f172a)' }}>
                            {r.resco?.district || DASH}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--ax-text-muted, #64748b)' }}>
                            {r.resco?.dept_name || DASH}
                          </span>
                        </div>
                      </td>
                      <td className="ax-table__td">
                        <div style={{ display: 'flex', flexDirection: 'column', fontSize: '12px' }}>
                          <span><strong style={{ color: 'var(--ax-text-strong, #0f172a)' }}>CA:</strong> {r.resco?.ca_no || DASH}</span>
                          <span><strong style={{ color: 'var(--ax-text-strong, #0f172a)' }}>Load:</strong> {r.resco?.sanction_load ? `${r.resco.sanction_load} kW` : DASH}</span>
                        </div>
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center', fontWeight: 700, color: '#0891b2' }}>
                        {fmtNum(readingsCount)}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {Number(r.verify_status) === 1 ? (
                          <span className="ax-badge ax-badge--soft ax-badge--success" style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>
                            Approved
                          </span>
                        ) : Number(r.verify_status) === 2 ? (
                          <span className="ax-badge ax-badge--soft ax-badge--danger" style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>
                            Rejected
                          </span>
                        ) : (
                          <span className="ax-badge ax-badge--soft ax-badge--warning" style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="ax-table__td" style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis' }} title={r.verify_remarks || ''}>
                        {r.verify_remarks || DASH}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="ax-btn ax-btn--primary ax-btn--sm"
                          onClick={() => handleOpenReviewModal(r.id)}
                          style={{
                            padding: '4px 12px',
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          Review & Verify
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer with Left-Aligned Pagination matching Payment Table */}
        <div className="ax-card__footer" style={footerStyle}>
          <div className="ula-pagination-left">
            <Pagination
              currentPage={pagination.curPage}
              totalItems={pagination.totalItems}
              pageSize={pagination.pageSize}
              onPageChange={pagination.setPage}
              onPageSizeChange={pagination.setPageSize}
              pageSizeOptions={[10, 25, 50, 100, 200]}
            />
          </div>
        </div>
      </div>

      {/* Review & Approval Modal */}
      {reviewModalBillId && (
        <Modal
          title={`Review Bill #${reviewModalBillId}`}
          onClose={() => setReviewModalBillId(null)}
          width="750px"
        >
          {modalLoading ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--ax-text-muted, #64748b)' }}>
              Loading bill readings and site details...
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Site Details Box */}
              <div style={{ background: 'var(--ax-surface-subtle, #f8fafc)', padding: '12px', borderRadius: '8px', border: '1px solid var(--ax-border, #e2e8f0)', fontSize: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                  <div><strong>Site Name:</strong> {modalResco?.site_name || modalBill?.resco?.site_name || `Site #${modalBill?.resco_id}`}</div>
                  <div><strong>District:</strong> {modalResco?.district || modalBill?.resco?.district || DASH}</div>
                  <div><strong>Department:</strong> {modalResco?.dept_name || modalBill?.resco?.dept_name || DASH}</div>
                  <div><strong>CA No:</strong> {modalResco?.ca_no || modalBill?.resco?.ca_no || DASH}</div>
                  <div><strong>Sanction Load:</strong> {modalResco?.sanction_load ? `${modalResco.sanction_load} kW` : DASH}</div>
                  <div><strong>Current Status:</strong> {getBillStatusMeta(modalBill?.verify_status).label}</div>
                </div>
              </div>

              {/* Meter Readings Table */}
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                  Recorded Meter Readings ({modalBill?.readings?.length ?? 0})
                </h4>

                {(!modalBill?.readings || modalBill.readings.length === 0) ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--ax-text-muted, #64748b)', background: '#f8fafc', borderRadius: '6px' }}>
                    No meter readings recorded on this bill.
                  </div>
                ) : (
                  <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid var(--ax-border, #e2e8f0)', borderRadius: '6px' }}>
                    <table className="ax-table">
                      <thead>
                        <tr>
                          <th style={{ width: '45px', textAlign: 'center' }}>#</th>
                          <th>Reading Date</th>
                          <th>Start Reading</th>
                          <th>End Reading</th>
                          <th>Units Generated</th>
                          <th>Meter Photo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {modalBill.readings.map((reading, idx) => {
                          const imgUrl = resolveUpMediaUrl(reading.reading_image, 'resco');
                          return (
                            <tr key={reading.id || idx}>
                              <td style={centerCell}>{idx + 1}</td>
                              <td>{fmtDate(reading.reading_date)}</td>
                              <td>{reading.start_reading || DASH}</td>
                              <td>{reading.end_reading || DASH}</td>
                              <td style={{ fontWeight: 600, color: '#047857' }}>{reading.unit_generated || DASH}</td>
                              <td>
                                {reading.reading_image ? (
                                  <MediaFileThumbnail
                                    url={imgUrl}
                                    filename={reading.reading_image}
                                    title="Reading Photo"
                                    onPreview={() => setLightbox({ url: imgUrl, title: `Reading Photo - Bill #${modalBill.id}` })}
                                  />
                                ) : (
                                  <span style={{ fontSize: '11px', color: 'var(--ax-text-muted, #94a3b8)' }}>No Photo</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Approval Controls */}
              <div style={{ borderTop: '1px solid var(--ax-border, #e2e8f0)', paddingTop: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                  Bill Verification Decision *
                </label>
                <div style={{ display: 'flex', gap: '20px', marginBottom: '12px' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
                    <input
                      type="radio"
                      name="billDecision"
                      value="1"
                      checked={approvalDecision === '1'}
                      onChange={() => setApprovalDecision('1')}
                    />
                    Approve Bill (1)
                  </label>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 500, color: '#dc2626' }}>
                    <input
                      type="radio"
                      name="billDecision"
                      value="2"
                      checked={approvalDecision === '2'}
                      onChange={() => setApprovalDecision('2')}
                    />
                    Reject Bill (2)
                  </label>
                </div>

                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                  Verification Remarks (Optional)
                </label>
                <textarea
                  className="ax-input"
                  rows={2}
                  placeholder="Enter remarks or justification..."
                  value={approvalRemarks}
                  onChange={(e) => setApprovalRemarks(e.target.value)}
                  style={{ width: '100%', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  className="ax-button ax-button--secondary ax-button--sm"
                  onClick={() => setReviewModalBillId(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="ax-button ax-button--primary ax-button--sm"
                  disabled={submittingApproval}
                  onClick={handleSubmitApproval}
                >
                  {submittingApproval ? 'Submitting...' : 'Submit Decision'}
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* Lightbox for Photos */}
      {lightbox && (
        <MediaLightbox
          url={lightbox.url}
          title={lightbox.title}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}

export default UPRescoViewCreatedBills;
