import { useState, useMemo, useEffect, useCallback, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  upInstallationService,
  resolveUpMediaUrl,
  type UpRescoClaimItem,
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

export function UP_Installation_Resco_ClaimRequest() {
  const [loading, setLoading] = useState(false);
  const [claims, setClaims] = useState<UpRescoClaimItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Claim Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [claimType, setClaimType] = useState('Payment 40 %');
  const [claimAmount, setClaimAmount] = useState('');
  const [claimInvoice, setClaimInvoice] = useState<File | null>(null);
  const [claimRemarks, setClaimRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await upInstallationService.getRescoClaims();
      setClaims(res || []);
    } catch (err: any) {
      console.error(err);
      setToast({ type: 'error', message: err?.message || 'Failed to load Resco claims.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenClaimModal = (type: string) => {
    setClaimType(type);
    setClaimAmount('');
    setClaimRemarks('');
    setClaimInvoice(null);
    setModalOpen(true);
  };

  const handleSubmitClaim = async (e: FormEvent) => {
    e.preventDefault();
    if (!claimAmount.trim()) {
      alert('Please enter Claim Amount');
      return;
    }
    if (!claimInvoice) {
      alert('Please select Invoice file');
      return;
    }

    setSubmitting(true);
    const fd = new FormData();
    fd.append('claim', claimType);
    fd.append('amount', claimAmount);
    fd.append('claim_amount', claimAmount);
    fd.append('invoice', claimInvoice);
    if (claimRemarks) fd.append('remarks', claimRemarks);

    try {
      const res = await upInstallationService.storeRescoClaim(fd);
      if (res.status) {
        setToast({ type: 'success', message: res.message || 'Payment claim submitted successfully!' });
        setModalOpen(false);
        loadData();
      } else {
        setToast({ type: 'error', message: res.message || 'Failed to submit claim.' });
      }
    } catch (err: any) {
      setToast({ type: 'error', message: err?.message || 'Server error occurred.' });
    } finally {
      setSubmitting(false);
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

  const exportCols: ExportColumn<UpRescoClaimItem>[] = useMemo(
    () => [
      { header: 'S.No.', accessor: (_, idx) => idx + 1 },
      { header: 'Date', accessor: (r) => r.date || DASH },
      { header: 'Claim', accessor: (r) => r.claim || DASH },
      { header: 'Sites', accessor: (r) => r.sites ?? DASH },
      { header: 'Amount', accessor: (r) => (r.amount ? `₹${r.amount}` : DASH) },
      { header: 'Remarks', accessor: (r) => r.remarks || DASH },
      { header: 'Status', accessor: (r) => (r.status === 2 ? 'Approved' : 'Pending') },
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
        title="Welcome to, View UP Resco Installation Claim"
        subtitle="Manage stage-wise payment claims (40% / 30% / 30%) and track disbursement"
        breadcrumbs={[
          { label: 'Home', href: '/v' },
          { label: 'View View UP Resco Installation Claim' },
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
              onClick={() => handleOpenClaimModal('Payment 40 %')}
            >
              + Payment 40 %
            </button>
            <button
              type="button"
              className="ax-btn ax-btn--primary ax-btn--sm"
              onClick={() => handleOpenClaimModal('Payment 30 %')}
            >
              + Payment 30 %
            </button>
            <button
              type="button"
              className="ax-btn ax-btn--primary ax-btn--sm"
              onClick={() => handleOpenClaimModal('Payment 30 %')}
            >
              + Payment 30 %
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
              Resco Installation Payment
            </h3>
            <p className="ax-card__subtitle" style={{ margin: '2px 0 0', fontSize: 12 }}>
              Stage-wise installation milestone payment tracking
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--sm"
                onClick={() => handleOpenClaimModal('Payment 40 %')}
              >
                + Payment 40 %
              </button>
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--sm"
                onClick={() => handleOpenClaimModal('Payment 30 %')}
              >
                + Payment 30 %
              </button>
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--sm"
                onClick={() => handleOpenClaimModal('Payment 30 %')}
              >
                + Payment 30 %
              </button>
            </div>

            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search claims..."
              size="sm"
            />
            <TableExportToolbar
              data={filtered}
              columns={exportCols}
              filename="up_resco_claims"
              title="Resco Installation Payment"
            />
          </div>
        </div>

        <div className="ax-card__body" style={{ padding: 0 }}>
          <div className="ax-table-wrap">
            <table className="ax-table ax-table--striped">
              <thead>
                <tr>
                  <th style={{ width: 50, textAlign: 'center' }}>S.No.</th>
                  <th>Date</th>
                  <th>Claim</th>
                  <th style={{ textAlign: 'center' }}>Sites</th>
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
                    <td colSpan={14} style={{ textAlign: 'center', padding: 36 }}>
                      <span className="ax-spinner" /> Loading claims...
                    </td>
                  </tr>
                ) : pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={14} style={{ padding: 0 }}>
                      <TableEmptyState
                        title="No data available in table"
                        subtitle={searchQuery ? 'Try adjusting your search criteria' : 'No claims submitted yet'}
                      />
                    </td>
                  </tr>
                ) : (
                  pageItems.map((c, idx) => {
                    const sr = startIndex + idx + 1;
                    const invoiceUrl = c.invoice ? resolveUpMediaUrl(c.invoice) : '';
                    return (
                      <tr key={c.id || idx}>
                        <td style={{ textAlign: 'center', fontWeight: 600 }}>{sr}</td>
                        <td>{c.date || DASH}</td>
                        <td style={{ fontWeight: 600, color: 'var(--ax-accent, #2563eb)' }}>{c.claim || DASH}</td>
                        <td style={{ textAlign: 'center', fontWeight: 600 }}>{c.sites ?? DASH}</td>
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
                        <td style={{ fontWeight: 600 }}>
                          {c.amount ? `₹${Number(c.amount).toLocaleString('en-IN')}` : DASH}
                        </td>
                        <td>{c.remarks || DASH}</td>
                        <td style={{ textAlign: 'center' }}>
                          {c.status === 2 ? (
                            <span className="ax-badge ax-badge--soft ax-badge--success">Approved</span>
                          ) : (
                            <span className="ax-badge ax-badge--soft ax-badge--warning">Pending</span>
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
                            onClick={() => alert(`Claim Details: ${c.claim} for ${c.amount ? `₹${c.amount}` : ''}`)}
                          >
                            View
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

      {/* Claim Submission Modal */}
      {modalOpen &&
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
            onClick={() => setModalOpen(false)}
          >
            <div
              className="ax-card"
              style={{ width: 540, maxWidth: '100%' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="ax-card__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="ax-card__title" style={{ margin: 0 }}>
                  Raise {claimType} Claim
                </h3>
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--icon"
                  onClick={() => setModalOpen(false)}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmitClaim}>
                <div className="ax-card__body" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                        Claim Type
                      </label>
                      <input type="text" readOnly className="ax-input" value={claimType} />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                        Claim Amount (₹) <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="number"
                        required
                        className="ax-input"
                        placeholder="Enter amount"
                        value={claimAmount}
                        onChange={(e) => setClaimAmount(e.target.value)}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                        Invoice Document (PDF/Image) <span style={{ color: '#ef4444' }}>*</span>
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
                        placeholder="Enter remarks..."
                        value={claimRemarks}
                        onChange={(e) => setClaimRemarks(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="ax-card__footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '12px 20px' }}>
                  <button type="button" className="ax-btn ax-btn--ghost" onClick={() => setModalOpen(false)} disabled={submitting}>
                    Cancel
                  </button>
                  <button type="submit" className="ax-btn ax-btn--primary" disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Submit Claim'}
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

export default UP_Installation_Resco_ClaimRequest;
