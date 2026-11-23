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
  type UpKusumCClaimRecord,
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
  fmtCurrency,
  fmtNum,
  DASH,
  copyRowsToClipboard,
  exportRowsCSV,
  exportRowsExcel,
  exportRowsPDF,
} from '../upInstallationShared';

export function UPKusumCVerifyClaim() {
  const [claims, setClaims] = useState<UpKusumCClaimRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Verify Claim Modal (#15: id, status: 2|3, remarks: REQUIRED)
  const [actionClaim, setActionClaim] = useState<UpKusumCClaimRecord | null>(null);
  const [claimStatus, setClaimStatus] = useState<'2' | '3'>('2');
  const [claimRemarks, setClaimRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Sites Modal & Lightbox
  const [sitesClaim, setSitesClaim] = useState<UpKusumCClaimRecord | null>(null);
  const [lightbox, setLightbox] = useState<{ url: string; title?: string } | null>(null);

  const fetchClaims = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const list = await upKusumCAdminService.getViewClaim();
      setClaims(list);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to fetch Kusum C installation claims.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  const handleVerifyClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionClaim) return;
    if (!claimRemarks.trim()) {
      return setErrorMsg('Verification remarks are required to approve or reject a claim.');
    }
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await upKusumCAdminService.verifyClaimStatus({
        id: actionClaim.id,
        status: Number(claimStatus) as 2 | 3,
        remarks: claimRemarks.trim(),
      });
      setSuccessMsg(res.message || 'Claim status updated successfully.');
      setActionClaim(null);
      setClaimRemarks('');
      fetchClaims();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to update claim status.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredClaims = useMemo(() => {
    let list = claims;
    if (statusFilter !== 'all') {
      list = list.filter((c) => String(c.claim_status) === statusFilter);
    }
    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter((c) => {
      const sites = (c.site_details || []).map((s) => s.f_farmer_name || '').join(' ');
      const hay = [c.id, c.date, c.amount, c.remarks, c.approved_remarks, sites].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [claims, searchQuery, statusFilter]);

  const pagination = usePagination(filteredClaims, { initialPageSize: 50 });

  const exportCols = useMemo<ExportColumn<UpKusumCClaimRecord>[]>(
    () => [
      { header: 'S.No.', accessor: ((_r: UpKusumCClaimRecord, idx?: number) => (idx !== undefined ? idx + 1 : '')) as any },
      { header: 'Date', accessor: (r) => fmtDate(r.date || r.created_at) },
      { header: 'Sites', accessor: (r) => (r.site_details || []).map((s) => s.f_farmer_name).filter(Boolean).join(', ') || DASH },
      { header: 'Amount', accessor: (r) => r.amount },
      { header: 'Remarks', accessor: (r) => r.remarks || DASH },
      { header: 'Verify Remarks', accessor: (r) => r.approved_remarks || DASH },
      {
        header: 'Status',
        accessor: (r) =>
          Number(r.claim_status) === 2 ? 'Approved' : Number(r.claim_status) === 3 ? 'Rejected' : 'Pending',
      },
    ],
    []
  );

  const pendingCount = claims.filter((c) => Number(c.claim_status) === 1).length;
  const approvedCount = claims.filter((c) => Number(c.claim_status) === 2).length;
  const rejectedCount = claims.filter((c) => Number(c.claim_status) === 3).length;
  const totalAmount = claims.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  const stamp = new Date().toISOString().slice(0, 10);

  return (
    <div className="solar-erp-page">
      <style>{TABLE_PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      <PageHead
        title="View Kusum-C Installation Claim"
        subtitle="Review vendor installation invoices, linked farmer sites, and approve or reject payment claims"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Uttar Pradesh', href: '/vendor-management/up' },
          { label: 'Kusum C', href: '/vendor-management/up/kusumc/installation/dashboard' },
          { label: 'Kusum-C Installation Claim' },
        ]}
      />

      <StatusFeedbackBanners
        errorMsg={errorMsg}
        successMsg={successMsg}
        onClearError={() => setErrorMsg('')}
        onClearSuccess={() => setSuccessMsg('')}
      />

      <div className="asw-cards-row">
        <KpiCard
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /></svg>}
          tone="accent"
          label="Total Claims"
          value={fmtNum(claims.length)}
          sub={`Total Value: ${fmtCurrency(totalAmount)}`}
        />
        <KpiCard
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>}
          tone="amber"
          label="Pending Review"
          value={fmtNum(pendingCount)}
          sub="Awaiting approval"
        />
        <KpiCard
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>}
          tone="emerald"
          label="Approved Claims"
          value={fmtNum(approvedCount)}
          sub="Ready for disbursement"
        />
        <KpiCard
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>}
          tone="red"
          label="Rejected Claims"
          value={fmtNum(rejectedCount)}
          sub="Sent back to vendor"
        />
      </div>

      <section className="ax-card ax-col--12">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">Kusum-C Installation Claim</h2>
            <p className="ax-card__subtitle">Showing {filteredClaims.length} claim request(s)</p>
          </div>
          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              <select
                className="ax-input ax-input--sm"
                style={{ width: 135, height: 32, fontSize: 'var(--ax-text-xs)' }}
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  pagination.setPage(1);
                }}
              >
                <option value="all">All Status</option>
                <option value="1">Pending (1)</option>
                <option value="2">Approved (2)</option>
                <option value="3">Rejected (3)</option>
              </select>
              <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search farmer, amount, remarks..." size="sm" />
              <TableExportToolbar
                onCopy={() => copyRowsToClipboard(filteredClaims, exportCols)}
                onExportCSV={() => exportRowsCSV(filteredClaims, exportCols, `UP_KusumC_Claims_${stamp}`)}
                onExportExcel={() => exportRowsExcel(filteredClaims, exportCols, `UP_KusumC_Claims_${stamp}`)}
                onExportPDF={() => exportRowsPDF(filteredClaims, exportCols, 'View Kusum-C Installation Claim')}
              />
            </div>
          </div>
        </div>

        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap', minWidth: 1000 }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th">S.No.</th>
                <th className="ax-table__th">Date</th>
                <th className="ax-table__th">Sites</th>
                <th className="ax-table__th">Invoice</th>
                <th className="ax-table__th">Amount</th>
                <th className="ax-table__th">Remarks</th>
                <th className="ax-table__th">Verify Remarks</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Status</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={centerCell}>
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading Kusum C claims...
                  </td>
                </tr>
              ) : pagination.paged.length === 0 ? (
                <tr>
                  <td colSpan={9} style={centerCell}>
                    <TableEmptyState title="No data available in table" description="No Kusum C installation claims found." />
                  </td>
                </tr>
              ) : (
                pagination.paged.map((row, idx) => {
                  const globalIdx = (pagination.curPage - 1) * pagination.pageSize + idx + 1;
                  const sites = row.site_details || [];
                  const st = Number(row.claim_status ?? 1);

                  return (
                    <tr key={row.id}>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{globalIdx}</td>
                      <td className="ax-table__td">{fmtDate(row.date || row.created_at)}</td>
                      <td className="ax-table__td">
                        <button
                          type="button"
                          onClick={() => setSitesClaim(row)}
                          style={{
                            background: 'rgba(37, 99, 235, 0.1)',
                            color: '#2563eb',
                            border: '1px solid rgba(37, 99, 235, 0.25)',
                            borderRadius: 6,
                            padding: '2px 8px',
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {sites.length} Site{sites.length === 1 ? '' : 's'} ↗
                        </button>
                      </td>
                      <td className="ax-table__td">
                        <MediaFileThumbnail
                          url={row.file ? resolveUpMediaUrl(row.file, 'kusumc') : null}
                          alt={`Claim #${row.id} Invoice`}
                          onClick={(url, title) => setLightbox({ url, title })}
                        />
                      </td>
                      <td className="ax-table__td" style={{ fontWeight: 700, color: '#0f172a' }}>
                        {fmtCurrency(row.amount)}
                      </td>
                      <td className="ax-table__td" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {row.remarks || DASH}
                      </td>
                      <td className="ax-table__td" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {row.approved_remarks || DASH}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {st === 2 ? (
                          <span className="ax-badge ax-badge--soft ax-badge--success">Approved</span>
                        ) : st === 3 ? (
                          <span className="ax-badge ax-badge--soft ax-badge--danger">Rejected</span>
                        ) : (
                          <span className="ax-badge ax-badge--soft ax-badge--warning">Pending</span>
                        )}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {st === 1 ? (
                          <button
                            type="button"
                            className="ax-btn ax-btn--primary ax-btn--xs"
                            onClick={() => {
                              setActionClaim(row);
                              setClaimStatus('2');
                              setClaimRemarks(row.approved_remarks || '');
                            }}
                          >
                            Verify Claim
                          </button>
                        ) : (
                          <span style={{ fontSize: 12, color: '#64748b' }}>Processed</span>
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

      {/* Verify Claim Modal (Endpoint #15) */}
      <Modal
        open={Boolean(actionClaim)}
        onClose={() => setActionClaim(null)}
        title="Verify Kusum-C Claim Request"
        subtitle={actionClaim ? `Claim #${actionClaim.id} • Amount: ${fmtCurrency(actionClaim.amount)}` : ''}
        maxWidth={480}
      >
        <form onSubmit={handleVerifyClaim} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
              Claim Status <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              className="ax-input"
              value={claimStatus}
              onChange={(e) => setClaimStatus(e.target.value as '2' | '3')}
              style={{ width: '100%' }}
              required
            >
              <option value="2">Approve (2)</option>
              <option value="3">Reject (3)</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
              Verify Remarks <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <textarea
              className="ax-input"
              rows={3}
              value={claimRemarks}
              onChange={(e) => setClaimRemarks(e.target.value)}
              placeholder="Required: Enter approval or rejection reason..."
              style={{ width: '100%', padding: 10 }}
              required
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setActionClaim(null)}>
              Cancel
            </button>
            <button type="submit" className="ax-btn ax-btn--primary" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Claim Decision'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Linked Sites Modal */}
      <Modal
        open={Boolean(sitesClaim)}
        onClose={() => setSitesClaim(null)}
        title={`Sites in Claim #${sitesClaim?.id}`}
        subtitle={`Amount: ${fmtCurrency(sitesClaim?.amount)} • Date: ${fmtDate(sitesClaim?.date)}`}
        maxWidth={560}
        footer={
          <button type="button" className="ax-btn ax-btn--primary" onClick={() => setSitesClaim(null)}>
            Close
          </button>
        }
      >
        <table className="ax-table" style={{ width: '100%', fontSize: 12.5 }}>
          <thead>
            <tr>
              <th className="ax-table__th">#</th>
              <th className="ax-table__th">Site ID</th>
              <th className="ax-table__th">Farmer Name</th>
            </tr>
          </thead>
          <tbody>
            {(sitesClaim?.site_details || []).length > 0 ? (
              (sitesClaim?.site_details || []).map((s, i) => (
                <tr key={s.id || i}>
                  <td className="ax-table__td">{i + 1}</td>
                  <td className="ax-table__td" style={{ fontFamily: 'monospace' }}>#{s.id}</td>
                  <td className="ax-table__td" style={{ fontWeight: 600 }}>{s.f_farmer_name || DASH}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} style={{ textAlign: 'center', padding: 18, color: '#64748b' }}>
                  No site list returned for this claim.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Modal>

      <MediaLightbox url={lightbox?.url || null} title={lightbox?.title} onClose={() => setLightbox(null)} />
    </div>
  );
}

export default UPKusumCVerifyClaim;
