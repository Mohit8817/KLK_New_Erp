import { useEffect, useMemo, useState, useCallback, type FormEvent } from 'react';
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
  jammuSrt70mwAdminService,
  resolveJammuMediaUrl,
  type ClaimRequestItem,
  type ViewClaimData,
} from './jammuSrt70mwAdminService';
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
} from '../../../up/Installation/upInstallationShared';

export function ViewSrtClaim() {
  const [claims, setClaims] = useState<ClaimRequestItem[]>([]);
  const [summary, setSummary] = useState<{
    total: number;
    claim_approved: number;
    claim_pending: number;
    claim_reject: number;
  }>({
    total: 0,
    claim_approved: 0,
    claim_pending: 0,
    claim_reject: 0,
  });
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Verify Claim Modal (#13: id, status: 2|3, remarks)
  const [actionClaim, setActionClaim] = useState<ClaimRequestItem | null>(null);
  const [claimStatus, setClaimStatus] = useState<'2' | '3'>('2');
  const [claimRemarks, setClaimRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [lightbox, setLightbox] = useState<{ url: string; title?: string } | null>(null);

  const fetchClaims = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res: ViewClaimData = await jammuSrt70mwAdminService.getViewClaim();
      const list = Array.isArray(res?.claimrequest) ? res.claimrequest : [];
      setClaims(list);
      setSummary({
        total: list.length,
        claim_approved: list.filter((c) => Number(c.inst_claim_status) === 2).length,
        claim_pending: list.filter((c) => Number(c.inst_claim_status ?? 1) === 1).length,
        claim_reject: list.filter((c) => Number(c.inst_claim_status) === 3).length,
      });
    } catch (err: any) {
      console.error('Failed to fetch Jammu SRT 70MW claim requests:', err);
      setErrorMsg(err?.message || 'Failed to fetch Jammu SRT 70MW claim requests.');
      setClaims([]);
      setSummary({ total: 0, claim_approved: 0, claim_pending: 0, claim_reject: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  const handleVerifyClaim = async (e: FormEvent) => {
    e.preventDefault();
    if (!actionClaim) return;
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await jammuSrt70mwAdminService.verifyClaimStatus(
        actionClaim.id,
        Number(claimStatus),
        claimRemarks.trim() || undefined
      );
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
      list = list.filter((c) => String(c.inst_claim_status ?? 1) === statusFilter);
    }
    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter((c) => {
      const hay = [
        c.id,
        c.state,
        c.district,
        c.site_name,
        c.vendor_name || (c as any).vendor,
        c.inst_claim_amount,
        c.remarks || (c as any).contractorRemarks,
        c.verify_remarks || c.inst_verify_remark,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [claims, searchQuery, statusFilter]);

  const pagination = usePagination(filteredClaims, { initialPageSize: 50 });

  const exportCols = useMemo<ExportColumn<ClaimRequestItem>[]>(
    () => [
      { header: 'Sr. No.', accessor: ((_r: ClaimRequestItem, idx?: number) => (idx !== undefined ? idx + 1 : '')) as any },
      { header: 'State', accessor: () => 'JAMMU' },
      { header: 'District', accessor: (r) => r.district || DASH },
      { header: 'Vendor', accessor: (r) => r.vendor_name || (r as any).vendor || (r.inst_vendor ? `Vendor #${r.inst_vendor}` : DASH) },
      { header: 'Claim Date', accessor: (r) => fmtDate(r.inst_claim_date || r.created_at) },
      { header: 'Site Name', accessor: (r) => r.site_name || `Site #${r.id}` },
      { header: 'Claim Amount', accessor: (r) => r.inst_claim_amount },
      { header: 'Claim Update Date', accessor: (r) => fmtDate(r.inst_claim_update_date || r.updated_at) },
      {
        header: 'Claim Status',
        accessor: (r) =>
          Number(r.inst_claim_status) === 2 ? 'Approved' : Number(r.inst_claim_status) === 3 ? 'Rejected' : 'Pending',
      },
      { header: 'Claim Verify Remarks', accessor: (r) => r.verify_remarks || r.inst_verify_remark || DASH },
    ],
    []
  );

  const stamp = new Date().toISOString().slice(0, 10);

  return (
    <div className="solar-erp-page">
      <style>{TABLE_PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      <PageHead
        title="Jammu SRT 70MW Installation - View Claim"
        subtitle="Verification and audit desk for 70 MW rooftop solar EPC milestone claims, vendor submission invoices, and DISCOM commissioning settlements across Jammu"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Jammu' },
          { label: 'SRT 70MW' },
          { label: 'View Claim' },
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
          value={fmtNum(summary.total)}
          sub="All SRT 70MW claim requests"
        />
        <KpiCard
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>}
          tone="amber"
          label="Claim Pending"
          value={fmtNum(summary.claim_pending)}
          sub="Awaiting approval"
        />
        <KpiCard
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>}
          tone="emerald"
          label="Claim Approved"
          value={fmtNum(summary.claim_approved)}
          sub="Cleared for payment"
        />
        <KpiCard
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>}
          tone="red"
          label="Claim Rejected"
          value={fmtNum(summary.claim_reject)}
          sub="Rejected claims"
        />
      </div>

      <section className="ax-card ax-col--12">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">View Jammu SRT 70MW Claim Request Data</h2>
            <p className="ax-card__subtitle">Showing {filteredClaims.length} claim record(s)</p>
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
              <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search vendor, amount, remarks..." size="sm" />
              <TableExportToolbar
                onCopy={() => copyRowsToClipboard(filteredClaims, exportCols)}
                onExportCSV={() => exportRowsCSV(filteredClaims, exportCols, `Jammu_SRT70MW_Claims_${stamp}`)}
                onExportExcel={() => exportRowsExcel(filteredClaims, exportCols, `Jammu_SRT70MW_Claims_${stamp}`)}
                onExportPDF={() => exportRowsPDF(filteredClaims, exportCols, 'View Jammu SRT 70MW Claim Request Data')}
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
                <th className="ax-table__th">Vendor</th>
                <th className="ax-table__th">Claim Date</th>
                <th className="ax-table__th">Site Name</th>
                <th className="ax-table__th">Claim Invoice</th>
                <th className="ax-table__th">Claim Amount</th>
                <th className="ax-table__th">Claim Update Date</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Claim Status</th>
                <th className="ax-table__th">Claim Verify Remarks</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={12} style={centerCell}>
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading Jammu SRT 70MW claim requests...
                  </td>
                </tr>
              ) : pagination.paged.length === 0 ? (
                <tr>
                  <td colSpan={12} style={centerCell}>
                    <TableEmptyState title="No data available in table" description="No Jammu SRT 70MW claim requests found." />
                  </td>
                </tr>
              ) : (
                pagination.paged.map((row, idx) => {
                  const globalIdx = (pagination.curPage - 1) * pagination.pageSize + idx + 1;
                  const invoicePath = row.inst_claim_invoice || row.invoice || (row as any).file;
                  const st = Number(row.inst_claim_status ?? 1);

                  return (
                    <tr key={row.id}>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{globalIdx}</td>
                      <td className="ax-table__td">JAMMU</td>
                      <td className="ax-table__td">{row.district || DASH}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>
                        {row.vendor_name || (row as any).vendor || (row.inst_vendor ? `Vendor #${row.inst_vendor}` : DASH)}
                      </td>
                      <td className="ax-table__td">{fmtDate(row.inst_claim_date || row.created_at)}</td>
                      <td className="ax-table__td">
                        <span className="ax-badge ax-badge--soft ax-badge--info">{row.site_name || `Site #${row.id}`}</span>
                      </td>
                      <td className="ax-table__td">
                        <MediaFileThumbnail
                          url={invoicePath ? resolveJammuMediaUrl(invoicePath) : null}
                          alt={`Claim #${row.id} Invoice`}
                          onClick={(url, title) => setLightbox({ url, title })}
                        />
                      </td>
                      <td className="ax-table__td" style={{ fontWeight: 700 }}>{fmtCurrency(row.inst_claim_amount)}</td>
                      <td className="ax-table__td">{fmtDate(row.inst_claim_update_date || row.updated_at)}</td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {st === 2 ? (
                          <span className="ax-badge ax-badge--soft ax-badge--success">Approved</span>
                        ) : st === 3 ? (
                          <span className="ax-badge ax-badge--soft ax-badge--danger">Rejected</span>
                        ) : (
                          <span className="ax-badge ax-badge--soft ax-badge--warning">Pending</span>
                        )}
                      </td>
                      <td className="ax-table__td" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {row.verify_remarks || row.inst_verify_remark || (row as any).approved_remarks || DASH}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {st === 1 ? (
                          <button
                            type="button"
                            className="ax-btn ax-btn--primary ax-btn--xs"
                            onClick={() => {
                              setActionClaim(row);
                              setClaimStatus('2');
                              setClaimRemarks(row.verify_remarks || row.inst_verify_remark || '');
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

      {/* Verify Claim Modal (#13) */}
      <Modal
        open={Boolean(actionClaim)}
        onClose={() => setActionClaim(null)}
        title="Verify Jammu SRT 70MW Claim Request"
        subtitle={actionClaim ? `Claim #${actionClaim.id} • ${actionClaim.site_name || 'Rooftop Site'} • Amount: ${fmtCurrency(actionClaim.inst_claim_amount)}` : ''}
        maxWidth={480}
      >
        <form onSubmit={handleVerifyClaim} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
              Claim Decision <span style={{ color: '#ef4444' }}>*</span>
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
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Verify Remarks</label>
            <textarea
              className="ax-input"
              rows={3}
              value={claimRemarks}
              onChange={(e) => setClaimRemarks(e.target.value)}
              placeholder="Optional approval or rejection notes..."
              style={{ width: '100%', padding: 10 }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setActionClaim(null)}>
              Cancel
            </button>
            <button type="submit" className="ax-btn ax-btn--primary" disabled={submitting}>
              {submitting ? 'Updating...' : 'Submit Claim Status'}
            </button>
          </div>
        </form>
      </Modal>

      <MediaLightbox url={lightbox?.url || null} title={lightbox?.title} onClose={() => setLightbox(null)} />
    </div>
  );
}

export default ViewSrtClaim;
