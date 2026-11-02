import { useState, useMemo, useEffect, useCallback, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { getCurrentUser } from '../../../../../services/authService';
import {
  upInstallationService,
  resolveUpMediaUrl,
  type UpSsl18wClaimItem,
} from '../../up-services';
import {
  Pagination,
  usePagination,
  SearchInput,
  TableExportToolbar,
  TableEmptyState,
  type ExportColumn,
} from '../../../../../common';

const DASH = '—';

export function UP_Installation_SSL_ClaimRequest() {
  const [loading, setLoading] = useState(false);
  const [claims, setClaims] = useState<UpSsl18wClaimItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Add Claim Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [fetchingEligible, setFetchingEligible] = useState(false);
  const [eligibleCount, setEligibleCount] = useState(0);
  const [eligibleIds, setEligibleIds] = useState<number[]>([]);
  const [claimAmount, setClaimAmount] = useState('');
  const [claimRemarks, setClaimRemarks] = useState('');
  const [claimInvoice, setClaimInvoice] = useState<File | null>(null);
  const [submittingAdd, setSubmittingAdd] = useState(false);

  // Edit Claim Modal
  const [editClaim, setEditClaim] = useState<UpSsl18wClaimItem | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editRemarks, setEditRemarks] = useState('');
  const [editInvoice, setEditInvoice] = useState<File | null>(null);
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const user = getCurrentUser();
      const vendorId = user?.id || user?.vendor_id;
      const res = await upInstallationService.getSsl18wClaims(vendorId);
      setClaims(res || []);
    } catch (err: any) {
      console.error(err);
      setToast({ type: 'error', message: err?.message || 'Failed to fetch claim requests.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Open Add Modal & Fetch eligible lights
  const handleOpenAddModal = async () => {
    setAddModalOpen(true);
    setClaimAmount('');
    setClaimRemarks('');
    setClaimInvoice(null);
    setFetchingEligible(true);

    try {
      const eligible = await upInstallationService.getSsl18wClaimApplicableLights();
      setEligibleCount(eligible.count);
      setEligibleIds(eligible.ids);
    } catch (err: any) {
      console.error('Failed to load eligible lights:', err);
      setEligibleCount(0);
      setEligibleIds([]);
    } finally {
      setFetchingEligible(false);
    }
  };

  const handleAddSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!claimAmount.trim()) {
      alert('Please enter Claim Amount');
      return;
    }
    if (!claimInvoice) {
      alert('Please attach Claim Invoice file');
      return;
    }

    setSubmittingAdd(true);
    const fd = new FormData();
    fd.append('claim_amount', claimAmount);
    fd.append('claim_invoice', claimInvoice);
    fd.append('light_count', String(eligibleCount));
    fd.append('light_ids', eligibleIds.join(','));
    if (claimRemarks) fd.append('remarks', claimRemarks);

    try {
      const res = await upInstallationService.storeSsl18wClaim(fd);
      if (res.status) {
        setToast({ type: 'success', message: res.message || 'Claim submitted successfully!' });
        setAddModalOpen(false);
        loadData();
      } else {
        setToast({ type: 'error', message: res.message || 'Failed to submit claim.' });
      }
    } catch (err: any) {
      setToast({ type: 'error', message: err?.message || 'Error occurred while submitting claim.' });
    } finally {
      setSubmittingAdd(false);
    }
  };

  const handleOpenEdit = (c: UpSsl18wClaimItem) => {
    setEditClaim(c);
    setEditAmount(String(c.amount || c.claim_amount || ''));
    setEditRemarks(c.remarks || '');
    setEditInvoice(null);
  };

  const handleEditSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editClaim) return;

    setSubmittingEdit(true);
    const fd = new FormData();
    fd.append('claim_id', String(editClaim.id));
    if (editAmount) fd.append('amount', editAmount);
    if (editRemarks) fd.append('remarks', editRemarks);
    if (editInvoice) fd.append('claim_invoice', editInvoice);

    try {
      const res = await upInstallationService.updateSsl18wClaim(fd);
      if (res.status) {
        setToast({ type: 'success', message: res.message || 'Claim updated successfully!' });
        setEditClaim(null);
        loadData();
      } else {
        setToast({ type: 'error', message: res.message || 'Failed to update claim.' });
      }
    } catch (err: any) {
      setToast({ type: 'error', message: err?.message || 'Error updating claim.' });
    } finally {
      setSubmittingEdit(false);
    }
  };

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return claims;
    const q = searchQuery.toLowerCase();
    return claims.filter((c) =>
      Object.values(c).some((v) => v !== null && v !== undefined && String(v).toLowerCase().includes(q))
    );
  }, [claims, searchQuery]);

  const pagination = usePagination(filtered, { initialPageSize: 10 });
  const pageItems = pagination.pageItems || pagination.paged || [];
  const startIndex = pagination.startIndex ?? pagination.from ?? 0;

  const exportCols: ExportColumn<UpSsl18wClaimItem>[] = useMemo(
    () => [
      { header: 'S.No.', accessor: (_, idx) => idx + 1 },
      { header: 'Vendor', accessor: (r) => r.vendor || DASH },
      { header: 'Date', accessor: (r) => r.date || DASH },
      { header: 'State', accessor: (r) => r.state || 'UP' },
      { header: 'Light Count', accessor: (r) => r.light_count ?? r.site_id ?? DASH },
      { header: 'Amount', accessor: (r) => (r.amount || r.claim_amount ? `₹${r.amount || r.claim_amount}` : DASH) },
      { header: 'Remarks', accessor: (r) => r.remarks || DASH },
      { header: 'Status', accessor: (r) => (r.claim_status === 1 ? 'Submitted' : r.claim_status === 2 ? 'Approved' : 'Pending') },
      { header: 'Payment Amount', accessor: (r) => r.payment_amount ?? DASH },
      { header: 'Payment Balance', accessor: (r) => r.payment_balance ?? DASH },
      { header: 'Payment Date', accessor: (r) => r.payment_date || DASH },
      { header: 'Payment Remarks', accessor: (r) => r.payment_remarks || DASH },
      { header: 'Payment Status', accessor: (r) => (r.payment_status === 1 ? 'Complete' : 'Pending') },
    ],
    []
  );

  return (
    <div className="solar-erp-page ax-page">
      <PageHead
        title="Welcome to, UP SSL 18w Claim Request"
        subtitle="Submit payment claims for verified 18W solar street light installations and track disbursement"
        breadcrumbs={[
          { label: 'Home', href: '/v' },
          { label: 'UP SSL 18w Claim Request' },
        ]}
        actions={
          <div className="ax-cluster" style={{ gap: 8 }}>
            <button
              type="button"
              className="ax-btn ax-btn--ghost ax-btn--sm"
              onClick={loadData}
              disabled={loading}
              title="Refresh"
            >
              <svg className={`ax-btn__icon ${loading ? 'ax-spinner' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
                <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
              </svg>
              <span>Refresh</span>
            </button>
            <button
              type="button"
              className="ax-btn ax-btn--primary ax-btn--sm"
              onClick={handleOpenAddModal}
            >
              + ADD CLAIM
            </button>
          </div>
        }
      />

      {toast && (
        <div className={`ax-alert ${toast.type === 'success' ? 'ax-alert--success' : 'ax-alert--danger'}`} style={{ marginBottom: 16 }}>
          <span>{toast.message}</span>
          <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" onClick={() => setToast(null)} style={{ marginLeft: 'auto' }}>
            ✕
          </button>
        </div>
      )}

      <div className="ax-card">
        <div className="ax-card__header" style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 className="ax-card__title" style={{ margin: 0, fontSize: 16 }}>
              View SSL Claim Request
            </h3>
            <p className="ax-card__subtitle" style={{ margin: '2px 0 0', fontSize: 12 }}>
              List of installation claims raised and payment milestones
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="ax-btn ax-btn--primary ax-btn--sm"
              onClick={handleOpenAddModal}
            >
              + ADD CLAIM
            </button>
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search claims..."
              size="sm"
            />
            <TableExportToolbar
              data={filtered}
              columns={exportCols}
              filename="up_ssl_18w_claim_requests"
              title="View SSL Claim Request"
            />
          </div>
        </div>

        <div className="ax-card__body" style={{ padding: 0 }}>
          <div className="ax-table-wrap">
            <table className="ax-table ax-table--striped">
              <thead>
                <tr>
                  <th style={{ width: 50, textAlign: 'center' }}>S.No.</th>
                  <th>Vendor</th>
                  <th>Date</th>
                  <th>State</th>
                  <th style={{ textAlign: 'center' }}>Light Count</th>
                  <th>Invoice</th>
                  <th>Amount</th>
                  <th>Remarks</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th>Payment Amount</th>
                  <th>Payment Balance</th>
                  <th>Payment Date</th>
                  <th>Payment Remarks</th>
                  <th style={{ textAlign: 'center' }}>Payment Status</th>
                  <th style={{ width: 80, textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={15} style={{ textAlign: 'center', padding: 36 }}>
                      <span className="ax-spinner" /> Loading claim records...
                    </td>
                  </tr>
                ) : pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={15} style={{ padding: 0 }}>
                      <TableEmptyState
                        title="No data available in table"
                        subtitle={searchQuery ? 'Try adjusting your search query' : 'No claims raised yet'}
                      />
                    </td>
                  </tr>
                ) : (
                  pageItems.map((c, idx) => {
                    const sr = startIndex + idx + 1;
                    const invoiceUrl = c.file ? resolveUpMediaUrl(c.file) : '';
                    return (
                      <tr key={c.id || idx}>
                        <td style={{ textAlign: 'center', fontWeight: 600 }}>{sr}</td>
                        <td style={{ fontWeight: 600 }}>{c.vendor || DASH}</td>
                        <td>{c.date || DASH}</td>
                        <td>{c.state ? c.state.toUpperCase() : 'UP'}</td>
                        <td style={{ textAlign: 'center', fontWeight: 600 }}>{c.light_count ?? c.site_id ?? DASH}</td>
                        <td>
                          {invoiceUrl ? (
                            <a
                              href={invoiceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ax-btn ax-btn--ghost ax-btn--sm"
                              style={{ padding: '2px 8px', fontSize: 11 }}
                            >
                              Invoice
                            </a>
                          ) : (
                            <span style={{ color: 'var(--ax-text-muted)' }}>{DASH}</span>
                          )}
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--ax-accent, #2563eb)' }}>
                          {c.amount || c.claim_amount ? `₹${Number(c.amount || c.claim_amount).toLocaleString('en-IN')}` : DASH}
                        </td>
                        <td>{c.remarks || DASH}</td>
                        <td style={{ textAlign: 'center' }}>
                          {c.claim_status === 2 ? (
                            <span className="ax-badge ax-badge--soft ax-badge--success">Approved</span>
                          ) : c.claim_status === 3 ? (
                            <span className="ax-badge ax-badge--soft ax-badge--danger">Rejected</span>
                          ) : (
                            <span className="ax-badge ax-badge--soft ax-badge--info">Submitted</span>
                          )}
                        </td>
                        <td>{c.payment_amount ? `₹${Number(c.payment_amount).toLocaleString('en-IN')}` : DASH}</td>
                        <td>{c.payment_balance ? `₹${Number(c.payment_balance).toLocaleString('en-IN')}` : DASH}</td>
                        <td>{c.payment_date || DASH}</td>
                        <td>{c.payment_remarks || DASH}</td>
                        <td style={{ textAlign: 'center' }}>
                          {c.payment_status === 1 ? (
                            <span className="ax-badge ax-badge--soft ax-badge--success">Complete</span>
                          ) : (
                            <span className="ax-badge ax-badge--soft ax-badge--warning">Pending</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="ax-btn ax-btn--ghost ax-btn--sm"
                            style={{ padding: '3px 8px', fontSize: 11 }}
                            onClick={() => handleOpenEdit(c)}
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="ax-card__footer" style={{ padding: '10px 18px' }}>
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={pagination.setPage}
            totalItems={pagination.totalItems}
            pageSize={pagination.pageSize}
            onPageSizeChange={pagination.setPageSize}
          />
        </div>
      </div>

      {/* Add Claim Modal */}
      {addModalOpen &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9998,
              background: 'rgba(0,0,0,0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
            onClick={() => setAddModalOpen(false)}
          >
            <div
              className="ax-card"
              style={{ width: 560, maxWidth: '100%' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="ax-card__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="ax-card__title" style={{ margin: 0 }}>
                  Raise Installation Claim
                </h3>
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--icon"
                  onClick={() => setAddModalOpen(false)}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddSubmit}>
                <div className="ax-card__body" style={{ padding: 20 }}>
                  {fetchingEligible ? (
                    <div style={{ padding: '16px 0', textAlign: 'center' }}>
                      <span className="ax-spinner" /> Checking claim-applicable lights...
                    </div>
                  ) : (
                    <div style={{ marginBottom: 16, padding: '10px 14px', background: '#eff6ff', borderRadius: 8, fontSize: 13, border: '1px solid #bfdbfe' }}>
                      <b>Eligible Lights for Claim:</b>{' '}
                      <span style={{ color: '#1d4ed8', fontWeight: 700 }}>{eligibleCount}</span> lights verified & ready.
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                        Claim Amount (₹) <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="number"
                        required
                        className="ax-input"
                        placeholder="e.g. 250000"
                        value={claimAmount}
                        onChange={(e) => setClaimAmount(e.target.value)}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                        Claim Invoice (PDF or Image) <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="file"
                        required
                        accept=".pdf,image/*"
                        className="ax-input"
                        onChange={(e) => setClaimInvoice(e.target.files?.[0] || null)}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                        Remarks
                      </label>
                      <textarea
                        rows={3}
                        className="ax-textarea"
                        placeholder="e.g. Milestone 1 claim for verified lights"
                        value={claimRemarks}
                        onChange={(e) => setClaimRemarks(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="ax-card__footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '12px 20px' }}>
                  <button type="button" className="ax-btn ax-btn--ghost" onClick={() => setAddModalOpen(false)} disabled={submittingAdd}>
                    Cancel
                  </button>
                  <button type="submit" className="ax-btn ax-btn--primary" disabled={submittingAdd || fetchingEligible}>
                    {submittingAdd ? 'Submitting...' : 'Submit Claim'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* Edit Claim Modal */}
      {editClaim &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9998,
              background: 'rgba(0,0,0,0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
            onClick={() => setEditClaim(null)}
          >
            <div
              className="ax-card"
              style={{ width: 560, maxWidth: '100%' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="ax-card__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="ax-card__title" style={{ margin: 0 }}>
                  Edit Claim #{editClaim.id}
                </h3>
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--icon"
                  onClick={() => setEditClaim(null)}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleEditSubmit}>
                <div className="ax-card__body" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                        Claim Amount (₹)
                      </label>
                      <input
                        type="number"
                        className="ax-input"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                        Update Invoice File (Optional)
                      </label>
                      <input
                        type="file"
                        accept=".pdf,image/*"
                        className="ax-input"
                        onChange={(e) => setEditInvoice(e.target.files?.[0] || null)}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                        Remarks
                      </label>
                      <textarea
                        rows={3}
                        className="ax-textarea"
                        value={editRemarks}
                        onChange={(e) => setEditRemarks(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="ax-card__footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '12px 20px' }}>
                  <button type="button" className="ax-btn ax-btn--ghost" onClick={() => setEditClaim(null)} disabled={submittingEdit}>
                    Cancel
                  </button>
                  <button type="submit" className="ax-btn ax-btn--primary" disabled={submittingEdit}>
                    {submittingEdit ? 'Saving...' : 'Update Claim'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

export default UP_Installation_SSL_ClaimRequest;
