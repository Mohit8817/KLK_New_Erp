import { useState, useMemo } from 'react';
import { PageHead } from '../../../../shell/PageHead';
import {
  INITIAL_CLAIM_DATA,
  type UPKusumCClaimRecord,
} from './upKusumCTypes';

export function UPKusumCVerifyClaim() {
  const [claims, setClaims] = useState<UPKusumCClaimRecord[]>(INITIAL_CLAIM_DATA);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Verification modal state
  const [selectedClaim, setSelectedClaim] = useState<UPKusumCClaimRecord | null>(null);
  const [verifyDecision, setVerifyDecision] = useState<'Approved' | 'Rejected'>('Approved');
  const [verifyRemarksInput, setVerifyRemarksInput] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Invoice viewer modal state
  const [previewInvoice, setPreviewInvoice] = useState<UPKusumCClaimRecord | null>(null);

  // Metrics
  const totalAmount = claims.reduce((acc, c) => acc + c.amount, 0);
  const approvedCount = claims.filter((c) => c.status === 'Approved').length;
  const pendingCount = claims.filter((c) => c.status === 'Pending').length;

  // Filtered
  const filteredClaims = useMemo(() => {
    return claims.filter((item) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !q ||
        item.invoice.toLowerCase().includes(q) ||
        item.sites.toLowerCase().includes(q) ||
        item.remarks.toLowerCase().includes(q) ||
        (item.verify_remarks || '').toLowerCase().includes(q) ||
        String(item.amount).includes(q);

      const matchesStatus = !statusFilter || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [claims, searchTerm, statusFilter]);

  const totalItems = filteredClaims.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const pagedClaims = filteredClaims.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleOpenVerifyModal = (claim: UPKusumCClaimRecord) => {
    setSelectedClaim(claim);
    setVerifyDecision('Approved');
    setVerifyRemarksInput('');
  };

  const handleConfirmVerify = () => {
    if (!selectedClaim) return;
    setIsSubmitting(true);

    setTimeout(() => {
      setClaims((prev) =>
        prev.map((c) =>
          c.id === selectedClaim.id
            ? {
                ...c,
                status: verifyDecision,
                verify_remarks: verifyRemarksInput || (verifyDecision === 'Approved' ? 'Claim verified against site commissioning logs' : 'Invoice figures do not match portal installation milestones'),
              }
            : c
        )
      );

      setIsSubmitting(false);
      setToastMsg(`Claim ${selectedClaim.invoice} marked as ${verifyDecision}!`);
      setSelectedClaim(null);
      setTimeout(() => setToastMsg(null), 3000);
    }, 500);
  };

  const handleExportCSV = () => {
    const headers = ['S.No.', 'Date', 'Sites', 'Invoice', 'Amount', 'Remarks', 'Verify Remarks', 'Status'];
    const rows = filteredClaims.map((item, idx) => [
      idx + 1,
      `"${item.date}"`,
      `"${item.sites}"`,
      `"${item.invoice}"`,
      item.amount,
      `"${item.remarks}"`,
      `"${item.verify_remarks || ''}"`,
      `"${item.status}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `UP_Kusum_C_Claims_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="ax-page" style={{ maxWidth: 1400, margin: '0 auto', paddingBottom: 40 }}>
      {/* Page Head */}
      <PageHead
        title="View Kusum-C Installation Claim"
        subtitle="Review vendor payment claim submissions, verify invoices, and approve for disbursement"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Uttar Pradesh', href: '/vendor-management/up' },
          { label: 'Kusum C', href: '/vendor-management/up/kusumc/installation/dashboard' },
          { label: 'Kusum-C Installation Claim' },
        ]}
      />

      {/* Toast */}
      {toastMsg && (
        <div
          style={{
            padding: '12px 18px',
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#065f46',
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>✓ {toastMsg}</span>
          <button
            type="button"
            onClick={() => setToastMsg(null)}
            style={{ background: 'none', border: 'none', color: '#065f46', cursor: 'pointer', fontSize: 16 }}
          >
            ×
          </button>
        </div>
      )}

      {/* KPI Stat Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div className="ax-card" style={{ padding: '16px 20px', borderLeft: '4px solid #3b82f6', background: '#ffffff' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Total Claims</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#1e293b', marginTop: 4 }}>{claims.length}</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Submitted by vendors</div>
        </div>

        <div className="ax-card" style={{ padding: '16px 20px', borderLeft: '4px solid #6366f1', background: '#ffffff' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Total Claimed Amount</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#1e293b', marginTop: 4 }}>
            ₹ {totalAmount.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Gross invoice amount</div>
        </div>

        <div className="ax-card" style={{ padding: '16px 20px', borderLeft: '4px solid #10b981', background: '#ffffff' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Approved Claims</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#10b981', marginTop: 4 }}>{approvedCount}</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Ready for disbursement</div>
        </div>

        <div className="ax-card" style={{ padding: '16px 20px', borderLeft: '4px solid #f59e0b', background: '#ffffff' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Pending Review</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#f59e0b', marginTop: 4 }}>{pendingCount}</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Awaiting verification</div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="ax-card" style={{ overflow: 'hidden' }}>
        {/* Card Header & Toolbar */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--ax-border, #e2e8f0)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            background: 'var(--ax-surface-subtle, #f8fafc)',
          }}
        >
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
            Kusum-C Installation Claim
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={handleExportCSV}
            >
              CSV Export
            </button>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={() => window.print()}
            >
              Print
            </button>
          </div>
        </div>

        {/* Filters */}
        <div
          style={{
            padding: '12px 20px',
            borderBottom: '1px solid var(--ax-border, #e2e8f0)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 12,
            background: '#ffffff',
          }}
        >
          <div style={{ flex: '1 1 240px', minWidth: 220 }}>
            <input
              type="text"
              className="ax-form-input"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search: S.No., Date, Sites, Invoice, Amount, Remarks..."
              style={{
                width: '100%',
                padding: '7px 12px',
                fontSize: 13,
                borderRadius: 6,
                border: '1px solid #cbd5e1',
              }}
            />
          </div>

          <div style={{ minWidth: 160 }}>
            <select
              className="ax-form-input"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={{ width: '100%', padding: '7px 10px', fontSize: 13, borderRadius: 6, border: '1px solid #cbd5e1' }}
            >
              <option value="">-- All Statuses --</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          {(searchTerm || statusFilter) && (
            <button
              type="button"
              className="ax-btn ax-btn--ghost ax-btn--sm"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
                setCurrentPage(1);
              }}
              style={{ color: '#ef4444' }}
            >
              Reset
            </button>
          )}
        </div>

        {/* Table Content */}
        <div style={{ overflowX: 'auto' }}>
          <table className="ax-table ax-table--hover" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <tr>
                <th style={{ padding: '10px 12px', textAlign: 'center', width: 60, fontWeight: 600, color: '#475569' }}>S.No.</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Date</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Sites</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Invoice</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Amount</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Remarks</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Verify Remarks</th>
                <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: '#475569' }}>Status</th>
                <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: '#475569' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {pagedClaims.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '36px 20px', color: '#64748b' }}>
                    No claim records match your search criteria.
                  </td>
                </tr>
              ) : (
                pagedClaims.map((item, idx) => {
                  const sNo = (currentPage - 1) * pageSize + idx + 1;
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 12px', textAlign: 'center', color: '#64748b' }}>{sNo}</td>
                      <td style={{ padding: '10px 12px', color: '#334155' }}>{item.date}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: '#0f172a' }}>{item.sites}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <button
                          type="button"
                          className="ax-btn ax-btn--ghost ax-btn--sm"
                          onClick={() => setPreviewInvoice(item)}
                          style={{
                            color: '#2563eb',
                            fontFamily: 'monospace',
                            fontSize: 12,
                            padding: '2px 6px',
                            textDecoration: 'underline',
                          }}
                        >
                          {item.invoice}
                        </button>
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                        ₹ {item.amount.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#64748b', maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.remarks}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#64748b', maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.verify_remarks || '—'}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <span
                          className={`ax-badge ${
                            item.status === 'Approved'
                              ? 'ax-badge--soft ax-badge--success'
                              : item.status === 'Rejected'
                              ? 'ax-badge--soft ax-badge--danger'
                              : 'ax-badge--soft ax-badge--warning'
                          }`}
                          style={{ fontWeight: 600, fontSize: 11, padding: '3px 8px' }}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        {item.status === 'Pending' ? (
                          <button
                            type="button"
                            className="ax-btn ax-btn--primary ax-btn--sm"
                            onClick={() => handleOpenVerifyModal(item)}
                            style={{ fontSize: 11, padding: '4px 10px', fontWeight: 600 }}
                          >
                            Verify
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="ax-btn ax-btn--secondary ax-btn--sm"
                            disabled
                            style={{
                              fontSize: 11,
                              padding: '3px 8px',
                              opacity: 0.85,
                              cursor: 'not-allowed',
                              background: '#f1f5f9',
                              color: '#64748b',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                            title="Claim Review Locked"
                          >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                            Locked
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--ax-border, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            background: 'var(--ax-surface-subtle, #f8fafc)',
            fontSize: 12.5,
            color: '#64748b',
          }}
        >
          <div>
            Showing {totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, totalItems)} of {totalItems} entries
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>Show</span>
              <select
                className="ax-form-input"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                style={{ padding: '3px 6px', fontSize: 12, borderRadius: 4 }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span>entries</span>
            </div>

            <div style={{ display: 'flex', gap: 4 }}>
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                style={{ padding: '3px 8px', fontSize: 11 }}
              >
                Previous
              </button>
              <span style={{ padding: '4px 8px', fontWeight: 600, color: '#1e293b' }}>
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                style={{ padding: '3px 8px', fontSize: 11 }}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Verify Claim Action Modal ── */}
      {selectedClaim && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(3px)',
            zIndex: 1050,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setSelectedClaim(null)}
        >
          <div
            className="ax-card"
            style={{
              width: '100%',
              maxWidth: 540,
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#f8fafc',
              }}
            >
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                  Verify Installation Claim
                </h3>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                  Invoice: <strong>{selectedClaim.invoice}</strong> · Amount: <strong>₹ {selectedClaim.amount.toLocaleString('en-IN')}</strong>
                </div>
              </div>
              <button
                type="button"
                className="ax-btn ax-btn--ghost ax-btn--sm"
                onClick={() => setSelectedClaim(null)}
                style={{ fontSize: 18, lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: 20 }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 8 }}>
                  Claim Decision <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ display: 'flex', gap: 16 }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
                    <input
                      type="radio"
                      name="claimDecision"
                      checked={verifyDecision === 'Approved'}
                      onChange={() => setVerifyDecision('Approved')}
                    />
                    <span style={{ color: '#16a34a', fontWeight: 700 }}>Approve Claim</span>
                  </label>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
                    <input
                      type="radio"
                      name="claimDecision"
                      checked={verifyDecision === 'Rejected'}
                      onChange={() => setVerifyDecision('Rejected')}
                    />
                    <span style={{ color: '#dc2626', fontWeight: 700 }}>Reject Claim</span>
                  </label>
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label htmlFor="claimVerifyRemarksInput" style={{ fontSize: 13, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>
                  Verify Remarks
                </label>
                <textarea
                  id="claimVerifyRemarksInput"
                  className="ax-form-input"
                  rows={3}
                  value={verifyRemarksInput}
                  onChange={(e) => setVerifyRemarksInput(e.target.value)}
                  placeholder={
                    verifyDecision === 'Approved'
                      ? 'e.g. Invoiced milestones verified against approved field reports.'
                      : 'e.g. Duplicate claim submitted or document discrepancies.'
                  }
                  style={{ width: '100%', padding: '8px 12px', fontSize: 13, borderRadius: 6, border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>

            <div
              style={{
                padding: '12px 20px',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 10,
                background: '#f8fafc',
              }}
            >
              <button
                type="button"
                className="ax-btn ax-btn--secondary"
                onClick={() => setSelectedClaim(null)}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`ax-btn ${verifyDecision === 'Approved' ? 'ax-btn--primary' : 'ax-btn--danger'}`}
                onClick={handleConfirmVerify}
                disabled={isSubmitting}
                style={{ minWidth: 140, fontWeight: 700 }}
              >
                {isSubmitting ? 'Processing...' : `Confirm ${verifyDecision}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Invoice Details Modal ── */}
      {previewInvoice && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => setPreviewInvoice(null)}
        >
          <div
            className="ax-card"
            style={{
              width: '100%',
              maxWidth: 580,
              padding: 24,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: 12, marginBottom: 16 }}>
              <h3 style={{ margin: 0, color: '#0f172a' }}>Invoice Details: {previewInvoice.invoice}</h3>
              <button
                type="button"
                className="ax-btn ax-btn--ghost ax-btn--sm"
                onClick={() => setPreviewInvoice(null)}
                style={{ fontSize: 18 }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13, marginBottom: 16 }}>
              <div>
                <span style={{ color: '#64748b' }}>Date:</span> <strong>{previewInvoice.date}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Sites:</span> <strong>{previewInvoice.sites}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Claim Amount:</span> <strong style={{ color: '#2563eb' }}>₹ {previewInvoice.amount.toLocaleString('en-IN')}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Status:</span> <strong>{previewInvoice.status}</strong>
              </div>
            </div>

            <div style={{ fontSize: 13, marginBottom: 16 }}>
              <span style={{ color: '#64748b' }}>Remarks:</span>
              <div style={{ background: '#f8fafc', padding: 10, borderRadius: 6, marginTop: 4 }}>
                {previewInvoice.remarks}
              </div>
            </div>

            {previewInvoice.verify_remarks && (
              <div style={{ fontSize: 13, marginBottom: 16 }}>
                <span style={{ color: '#64748b' }}>Verify Remarks:</span>
                <div style={{ background: '#f1f5f9', padding: 10, borderRadius: 6, marginTop: 4, color: '#1e293b' }}>
                  {previewInvoice.verify_remarks}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="ax-btn ax-btn--secondary"
                onClick={() => setPreviewInvoice(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer copyright */}
    </div>
  );
}

export default UPKusumCVerifyClaim;
