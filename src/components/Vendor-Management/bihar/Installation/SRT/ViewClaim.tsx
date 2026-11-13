import { useState, useMemo, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  Pagination,
  usePagination,
  SearchInput,
  TableExportToolbar,
  TableEmptyState,
  copyTableDataToClipboard,
  exportDataToCSV,
  exportDataToExcel,
  printTableData,
  type ExportColumn,
} from '../../../../../common';
import { biharAdminService, resolveBiharMediaUrl } from '../../bihar-services/biharAdminService';

export interface BiharSRTClaimItem {
  id: number;
  state: string;
  district: string;
  site_name: string;
  claim_raised_date: string;
  claim_invoice: string;
  claim_amount: string;
  claim_update_date: string;
  claim_update_by: string;
  claim_status: 'Approved' | 'Pending' | 'Rejected';
  installation_inspection: 'Completed' | 'Verified' | 'Pending';
  document_status: 'Verified' | 'Pending' | 'Rejected';
  generation_image: string;
  loger_image: string;
  payment3_verification_status: string;
}

export function BiharSRTInstallationViewClaim() {
  const [claims, setClaims] = useState<BiharSRTClaimItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [previewModal, setPreviewModal] = useState<{ title: string; url: string } | null>(null);

  // Status Update Action Modal
  const [actionItem, setActionItem] = useState<BiharSRTClaimItem | null>(null);
  const [claimStatusChoice, setClaimStatusChoice] = useState<'1' | '2'>('1');
  const [actionRemark, setActionRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await biharAdminService.getViewSrtClaims();
      const rawList = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.claims)
        ? res.claims
        : Array.isArray(res?.data?.claims)
        ? res.data.claims
        : [];

      const mapped: BiharSRTClaimItem[] = rawList.map((item: any, idx: number) => {
        const rawStatus = String(item.claim_status ?? item.status ?? '').toLowerCase();
        const statusVal: 'Approved' | 'Pending' | 'Rejected' = rawStatus.includes('approv') || rawStatus === '1'
          ? 'Approved'
          : rawStatus.includes('reject') || rawStatus === '2'
          ? 'Rejected'
          : 'Pending';

        return {
          id: item.id ?? idx + 1,
          state: item.state || 'Bihar',
          district: item.district || '—',
          site_name: item.site_name || item.name || '—',
          claim_raised_date: item.claim_raised_date || item.created_at || item.date || '—',
          claim_invoice: item.claim_invoice || item.invoice || item.invoice_no || '—',
          claim_amount: item.claim_amount || item.amount ? `₹ ${item.claim_amount || item.amount}` : '—',
          claim_update_date: item.claim_update_date || item.updated_at || '—',
          claim_update_by: item.claim_update_by || item.approved_by || '—',
          claim_status: statusVal,
          installation_inspection: item.installation_inspection || 'Completed',
          document_status: item.document_status || 'Verified',
          generation_image: item.generation_image || '',
          loger_image: item.loger_image || '',
          payment3_verification_status: item.payment3_verification_status || 'Pending Scrutiny',
        };
      });

      setClaims(mapped);
    } catch (err: any) {
      console.error('Failed to load Bihar SRT claims:', err);
      setError(err?.message || 'Failed to load SRT claim requests from server.');
      setClaims([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdateClaimStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionItem) return;
    try {
      setSubmitting(true);
      const isApprove = claimStatusChoice === '1';
      await biharAdminService.updateSrtClaimStatus({
        id: actionItem.id,
        claim_status: isApprove ? 1 : 2,
        remark: actionRemark,
      });

      setSuccessMsg(`Claim for "${actionItem.site_name}" marked as ${isApprove ? 'Approved' : 'Rejected'}!`);
      setActionItem(null);
      setActionRemark('');
      await loadData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      alert(`Failed to update claim status: ${err?.message || 'Server error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return claims;
    return claims.filter((r) =>
      [
        r.state,
        r.district,
        r.site_name,
        r.claim_invoice,
        r.claim_amount,
        r.claim_update_by,
        r.claim_status,
        r.installation_inspection,
        r.document_status,
        r.payment3_verification_status,
      ].some((v) => String(v ?? '').toLowerCase().includes(q))
    );
  }, [claims, search]);

  const pagination = usePagination(filtered, { initialPageSize: 10 });

  const exportCols: ExportColumn<BiharSRTClaimItem>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r, idx) => (idx !== undefined ? idx + 1 : '') },
      { header: 'State', accessor: (r) => r.state },
      { header: 'District', accessor: (r) => r.district },
      { header: 'Site Name', accessor: (r) => r.site_name },
      { header: 'Claim Raised Date', accessor: (r) => r.claim_raised_date },
      { header: 'Claim Invoice', accessor: (r) => r.claim_invoice },
      { header: 'Claim Amount', accessor: (r) => r.claim_amount },
      { header: 'Claim Update Date', accessor: (r) => r.claim_update_date },
      { header: 'Claim Update by', accessor: (r) => r.claim_update_by },
      { header: 'Claim Status', accessor: (r) => r.claim_status },
      { header: 'Installation Inspection', accessor: (r) => r.installation_inspection },
      { header: 'Document Status', accessor: (r) => r.document_status },
      { header: 'Payment 3 verification Status', accessor: (r) => r.payment3_verification_status },
    ],
    []
  );

  const handleCopy = () => copyTableDataToClipboard(filtered, exportCols);
  const handleCsv = () => exportDataToCSV('Bihar_SRT_Claim_Request', filtered, exportCols);
  const handleExcel = () => exportDataToExcel('Bihar_SRT_Claim_Request', filtered, exportCols);
  const handlePdf = () => printTableData('View SRT Claim Request', filtered, exportCols);

  return (
    <div className="solar-erp-page" style={{ maxWidth: '100%', margin: '0 auto', paddingBottom: 40 }}>
      {/* Page Head */}
      <PageHead
        title="Bihar SRT Claim Request"
        subtitle="Manage assigned vendor work orders, view farmer allocations, and authorize dispatches"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Bihar SRT', href: '/vendor-management/bihar/srt/installation/dashboard' },
          { label: 'Bihar SRT Claim Request' },
        ]}
      />

      {successMsg && (
        <div style={{ padding: '12px 16px', background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857', borderRadius: 8, marginBottom: 16, fontSize: 13.5 }}>
          ✓ {successMsg}
        </div>
      )}

      {error && (
        <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: 8, marginBottom: 16, fontSize: 13.5 }}>
          ✕ {error}
        </div>
      )}

      <section className="ax-card ax-col--12">
        <div
          className="ax-card__header"
          style={{
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <h2 className="ax-card__title" style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
              View SRT Claim Request
            </h2>
            <p className="ax-card__subtitle" style={{ fontSize: '12.5px', color: '#64748b', margin: '4px 0 0' }}>
              Showing {filtered.length} of {claims.length} claim requests
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search site, invoice, district..."
              size="sm"
              ariaLabel="Search claims"
            />
            <TableExportToolbar
              onCopy={handleCopy}
              onExportCSV={handleCsv}
              onExportExcel={handleExcel}
              onExportPDF={handlePdf}
            />
          </div>
        </div>

        <div className="ax-table-wrap" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%' }}>
          <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap', width: '100%', fontSize: 12.5 }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th">Sr. No.</th>
                <th className="ax-table__th">State</th>
                <th className="ax-table__th">District</th>
                <th className="ax-table__th">Site Name</th>
                <th className="ax-table__th">Claim Raised Date</th>
                <th className="ax-table__th">Claim Invoice</th>
                <th className="ax-table__th">Claim Amount</th>
                <th className="ax-table__th">Claim Update Date</th>
                <th className="ax-table__th">Claim Update by</th>
                <th className="ax-table__th">Claim Status</th>
                <th className="ax-table__th">Installation Inspection</th>
                <th className="ax-table__th">Document Status</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Generation Image</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Loger Image</th>
                <th className="ax-table__th">Payment 3 verification Status</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody className="ax-table__body">
              {loading ? (
                <tr>
                  <td colSpan={16} style={{ textAlign: 'center', padding: '40px 16px', color: '#64748b' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <div className="ax-spinner" style={{ width: 18, height: 18 }} />
                      <span>Loading claim requests from API...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={16} style={{ padding: 0 }}>
                    <TableEmptyState
                      title="No Claim Requests Found"
                      message={search ? 'No vendor claim submissions match your current search query.' : 'No claim records received from server.'}
                      onClear={search ? () => setSearch('') : undefined}
                      clearLabel="Clear search"
                    />
                  </td>
                </tr>
              ) : (
                (pagination.paged ?? []).map((r, idx) => {
                  const globalIdx = (pagination.page - 1) * pagination.pageSize + idx + 1;
                  return (
                    <tr key={r.id} className="ax-table__row">
                      <td className="ax-table__td ax-num" style={{ fontWeight: 600 }}>{globalIdx}</td>
                      <td className="ax-table__td">{r.state}</td>
                      <td className="ax-table__td">{r.district}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: '#1e293b' }}>
                        {r.site_name}
                      </td>
                      <td className="ax-table__td ax-num">{r.claim_raised_date}</td>
                      <td className="ax-table__td">
                        {r.claim_invoice && r.claim_invoice !== '—' ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              color: '#2563eb',
                              fontWeight: 600,
                              cursor: 'pointer',
                              fontSize: 12,
                            }}
                            onClick={() => setPreviewModal({ title: `Invoice: ${r.claim_invoice}`, url: resolveBiharMediaUrl(r.claim_invoice) })}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 14, height: 14 }}>
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                            </svg>
                            {r.claim_invoice.split('/').pop()}
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </td>
                      <td className="ax-table__td" style={{ fontWeight: 700, color: '#047857' }}>
                        {r.claim_amount}
                      </td>
                      <td className="ax-table__td ax-num">{r.claim_update_date}</td>
                      <td className="ax-table__td">{r.claim_update_by}</td>
                      <td className="ax-table__td">
                        <span
                          className={`ax-badge ${
                            r.claim_status === 'Approved'
                              ? 'ax-badge--success'
                              : r.claim_status === 'Pending'
                              ? 'ax-badge--warning'
                              : 'ax-badge--danger'
                          }`}
                        >
                          {r.claim_status}
                        </span>
                      </td>
                      <td className="ax-table__td">{r.installation_inspection}</td>
                      <td className="ax-table__td">{r.document_status}</td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {r.generation_image ? (
                          <button
                            type="button"
                            onClick={() => setPreviewModal({ title: `${r.site_name} - Generation Image`, url: resolveBiharMediaUrl(r.generation_image) })}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 32,
                              height: 32,
                              borderRadius: 6,
                              border: '1px solid #cbd5e1',
                              background: '#f8fafc',
                              cursor: 'pointer',
                            }}
                          >
                            🖼️
                          </button>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {r.loger_image ? (
                          <button
                            type="button"
                            onClick={() => setPreviewModal({ title: `${r.site_name} - Logger Image`, url: resolveBiharMediaUrl(r.loger_image) })}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 32,
                              height: 32,
                              borderRadius: 6,
                              border: '1px solid #cbd5e1',
                              background: '#f8fafc',
                              cursor: 'pointer',
                            }}
                          >
                            📊
                          </button>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </td>
                      <td className="ax-table__td">{r.payment3_verification_status}</td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setActionItem(r);
                            setClaimStatusChoice('1');
                            setActionRemark('');
                          }}
                          className="ax-btn ax-btn--primary ax-btn--sm"
                          style={{ height: 26, padding: '0 10px', fontSize: 11.5 }}
                        >
                          Action
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="ax-card__footer" style={{ padding: '12px 16px', borderTop: '1px solid #e2e8f0' }}>
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            pageSize={pagination.pageSize}
            totalItems={filtered.length}
            onPageChange={pagination.setPage}
            onPageSizeChange={pagination.setPageSize}
          />
        </div>
      </section>

      {/* Action / Status Modal */}
      {actionItem &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              background: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
            role="dialog"
            aria-modal="true"
          >
            <div
              style={{
                background: '#ffffff',
                borderRadius: 16,
                width: '100%',
                maxWidth: 480,
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                  Update Claim Status
                </h3>
                <button
                  type="button"
                  onClick={() => setActionItem(null)}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18, color: '#64748b' }}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleUpdateClaimStatus} style={{ padding: 20 }}>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, color: '#64748b' }}>Site Name</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{actionItem.site_name}</div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, color: '#64748b' }}>Claim Amount</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#047857' }}>{actionItem.claim_amount}</div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                    Claim Decision *
                  </label>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                      <input
                        type="radio"
                        name="claimStatusChoice"
                        value="1"
                        checked={claimStatusChoice === '1'}
                        onChange={() => setClaimStatusChoice('1')}
                      />
                      <span style={{ color: '#16a34a', fontWeight: 600 }}>Approve Claim</span>
                    </label>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                      <input
                        type="radio"
                        name="claimStatusChoice"
                        value="2"
                        checked={claimStatusChoice === '2'}
                        onChange={() => setClaimStatusChoice('2')}
                      />
                      <span style={{ color: '#dc2626', fontWeight: 600 }}>Reject Claim</span>
                    </label>
                  </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                    Reviewer Remarks
                  </label>
                  <textarea
                    className="ax-input"
                    rows={3}
                    value={actionRemark}
                    onChange={(e) => setActionRemark(e.target.value)}
                    placeholder="Enter approval details or reason for rejection..."
                    style={{ width: '100%', resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setActionItem(null)}
                    className="ax-btn ax-btn--secondary ax-btn--sm"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="ax-btn ax-btn--primary ax-btn--sm"
                    disabled={submitting}
                  >
                    {submitting ? 'Updating...' : 'Save Decision'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* Preview Modal for Images or Invoices */}
      {previewModal &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              background: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
            role="dialog"
            aria-modal="true"
          >
            <div
              style={{
                background: '#ffffff',
                borderRadius: 16,
                width: '100%',
                maxWidth: 720,
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>{previewModal.title}</h3>
                <button
                  type="button"
                  onClick={() => setPreviewModal(null)}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18, color: '#64748b' }}
                >
                  ✕
                </button>
              </div>
              <div style={{ padding: 20, textAlign: 'center' }}>
                {previewModal.url.endsWith('.pdf') ? (
                  <iframe
                    src={previewModal.url}
                    title={previewModal.title}
                    style={{ width: '100%', height: 450, border: 'none', borderRadius: 8 }}
                  />
                ) : (
                  <img
                    src={previewModal.url}
                    alt={previewModal.title}
                    style={{ maxWidth: '100%', maxHeight: 450, borderRadius: 8, objectFit: 'contain' }}
                  />
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
