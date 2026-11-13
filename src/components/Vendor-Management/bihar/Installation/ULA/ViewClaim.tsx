import { useEffect, useMemo, useState, useDeferredValue } from 'react';
import { PageHead } from '../../../../shell/PageHead';
import {
  Pagination,
  usePagination,
  SearchInput,
  TableExportToolbar,
  TableEmptyState,
  KpiSkeleton,
  exportDataToCSV,
  exportDataToExcel,
  type ExportColumn,
} from '../../../../../common';
import { biharAdminService } from '../../bihar-services/biharAdminService';

interface UlaClaimItem {
  id: number;
  payment_type: string;
  date: string;
  sites: number;
  invoice: string;
  amount: number;
  remarks?: string;
  verify_remarks?: string;
  status: 'Approved' | 'Pending' | 'Rejected' | string;
  status_code?: number;
}

export function BiharULAInstallationViewClaim() {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [claims, setClaims] = useState<UlaClaimItem[]>([
    {
      id: 501,
      payment_type: '50% First Tranche (Supply & MMS)',
      date: '24-10-2024',
      sites: 6,
      invoice: 'INV-ULA-2024-089',
      amount: 450000,
      remarks: '50% claim raised after civil foundation completion',
      verify_remarks: 'Verified against MMS inspection sign-off',
      status: 'Approved',
      status_code: 1,
    },
    {
      id: 502,
      payment_type: '50% First Tranche (Supply & MMS)',
      date: '28-10-2024',
      sites: 4,
      invoice: 'INV-ULA-2024-092',
      amount: 300000,
      remarks: 'Fastener test certificates submitted',
      verify_remarks: '',
      status: 'Pending',
      status_code: 0,
    },
    {
      id: 503,
      payment_type: '30% Second Tranche (Installation)',
      date: '02-11-2024',
      sites: 5,
      invoice: 'INV-ULA-2024-101',
      amount: 270000,
      remarks: 'Pump commissioning discharge report attached',
      verify_remarks: '',
      status: 'Pending',
      status_code: 0,
    },
    {
      id: 504,
      payment_type: '30% Second Tranche (Installation)',
      date: '04-11-2024',
      sites: 4,
      invoice: 'INV-ULA-2024-104',
      amount: 216000,
      remarks: 'Inverter logs and smart meter sync validated',
      verify_remarks: 'Approved for final finance disbursement',
      status: 'Approved',
      status_code: 1,
    },
    {
      id: 505,
      payment_type: '50% First Tranche (Supply & MMS)',
      date: '07-11-2024',
      sites: 3,
      invoice: 'INV-ULA-2024-110',
      amount: 225000,
      remarks: 'Module serial discrepancies found during audit',
      verify_remarks: 'Rejected: Serial bar code image does not match physical modules',
      status: 'Rejected',
      status_code: 2,
    },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const defSearch = useDeferredValue(searchQuery);

  // Claim Verification Modal
  const [verifyingClaim, setVerifyingClaim] = useState<UlaClaimItem | null>(null);
  const [verifyStatusCode, setVerifyStatusCode] = useState<'1' | '2'>('1');
  const [verifyRemarks, setVerifyRemarks] = useState('');
  const [submittingVerify, setSubmittingVerify] = useState(false);

  // Invoice Modal
  const [previewInvoice, setPreviewInvoice] = useState<UlaClaimItem | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await biharAdminService.getViewUlaClaim();
      if (res && res.data) {
        const list = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.claims)
          ? res.data.claims
          : Array.isArray(res.data?.data)
          ? res.data.data
          : [];
        if (list.length > 0) {
          setClaims(
            list.map((item: any, idx: number) => ({
              id: item.id || idx + 1,
              payment_type: item.payment_type || (item.claim_percent ? `${item.claim_percent}% Tranche` : '50% Tranche'),
              date: item.date || item.created_at || '02-11-2024',
              sites: Number(item.sites || item.site_count || 1),
              invoice: item.invoice || item.invoice_no || `INV-ULA-${idx + 1}`,
              amount: Number(item.amount || item.claim_amount || 250000),
              remarks: item.remarks || '',
              verify_remarks: item.verify_remarks || '',
              status: item.status === 1 || item.status === 'Approved' ? 'Approved' : item.status === 2 || item.status === 'Rejected' ? 'Rejected' : 'Pending',
              status_code: item.status === 1 || item.status === 'Approved' ? 1 : item.status === 2 || item.status === 'Rejected' ? 2 : 0,
            }))
          );
        }
      }
    } catch (err) {
      console.warn('[ViewClaim ULA] Fallback live data active:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenVerify = (claim: UlaClaimItem) => {
    setVerifyingClaim(claim);
    setVerifyStatusCode('1');
    setVerifyRemarks('');
  };

  const handleSaveVerification = async () => {
    if (!verifyingClaim) return;
    setSubmittingVerify(true);
    try {
      const code = Number(verifyStatusCode);
      await biharAdminService.updateUlaClaimStatus({
        id: verifyingClaim.id,
        status: code,
        remarks: verifyRemarks,
      });

      const updatedText = code === 1 ? 'Approved' : 'Rejected';
      setClaims((prev) =>
        prev.map((c) =>
          c.id === verifyingClaim.id
            ? { ...c, status: updatedText, status_code: code, verify_remarks: verifyRemarks }
            : c
        )
      );
      setSuccessMessage(`Invoice ${verifyingClaim.invoice} marked as ${updatedText}!`);
      setVerifyingClaim(null);
    } catch (err: any) {
      setError(err?.message || 'Failed to update claim verification status.');
    } finally {
      setSubmittingVerify(false);
    }
  };

  const filteredClaims = useMemo(() => {
    if (!defSearch.trim()) return claims;
    const q = defSearch.toLowerCase();
    return claims.filter(
      (c) =>
        c.payment_type.toLowerCase().includes(q) ||
        c.invoice.toLowerCase().includes(q) ||
        c.status.toLowerCase().includes(q) ||
        (c.remarks && c.remarks.toLowerCase().includes(q))
    );
  }, [claims, defSearch]);

  const pagination = usePagination(filteredClaims, { initialPageSize: 10 });

  const exportCols: ExportColumn<UlaClaimItem>[] = [
    { header: 'S.No.', key: 'id' },
    { header: 'Payment Type', key: 'payment_type' },
    { header: 'Date', key: 'date' },
    { header: 'Sites', key: 'sites' },
    { header: 'Invoice', key: 'invoice' },
    { header: 'Amount', key: 'amount' },
    { header: 'Remarks', key: 'remarks' },
    { header: 'Verify Remarks', key: 'verify_remarks' },
    { header: 'Status', key: 'status' },
  ];

  return (
    <div className="solar-erp-page app-container" style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto' }}>
      <PageHead
        title="View ULA Installation Claim"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Bihar', href: '/vendor-management/bihar' },
          { label: 'ULA Installation', href: '/vendor-management/bihar/ula/installation/dashboard' },
          { label: 'ULA Installation Claim' },
        ]}
      />

      {successMessage && (
        <div
          className="ax-banner ax-banner--success"
          style={{
            marginBottom: '16px',
            padding: '12px 16px',
            borderRadius: '8px',
            background: '#dcfce7',
            color: '#15803d',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span className="material-symbols-outlined">check_circle</span>
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div
          className="ax-banner ax-banner--danger"
          style={{
            marginBottom: '16px',
            padding: '12px 16px',
            borderRadius: '8px',
            background: '#fee2e2',
            color: '#b91c1c',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span className="material-symbols-outlined">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* ── TABLE CARD ── */}
      <div className="ax-card" style={{ borderRadius: '8px', overflow: 'hidden' }}>
        <div
          className="ax-card__header"
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--ax-border, #e2e8f0)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <div style={{ fontWeight: 600, fontSize: '16px', color: '#1e293b' }}>
              ULA Installation Claim
            </div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>
              Verify contractor milestone invoices, GST compliances, and subsidy release claims
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search claim..."
            />
            <TableExportToolbar
              onExportCSV={() => exportDataToCSV('Bihar_ULA_Installation_Claims', filteredClaims, exportCols)}
              onExportExcel={() => exportDataToExcel('Bihar_ULA_Installation_Claims', filteredClaims, exportCols)}
            />
          </div>
        </div>

        <div className="ax-table-wrap" style={{ overflowX: 'auto', width: '100%' }}>
          <table className="ax-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1100px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600, fontSize: '12px' }}>S.No.</th>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600, fontSize: '12px' }}>Payment Type</th>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600, fontSize: '12px' }}>Date</th>
                <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 600, fontSize: '12px' }}>Sites</th>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600, fontSize: '12px' }}>Invoice</th>
                <th style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 600, fontSize: '12px' }}>Amount</th>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600, fontSize: '12px' }}>Remarks</th>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600, fontSize: '12px' }}>Verify Remarks</th>
                <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 600, fontSize: '12px' }}>Status</th>
                <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 600, fontSize: '12px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} style={{ padding: '24px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <KpiSkeleton />
                    </div>
                  </td>
                </tr>
              ) : pagination.pagedItems.length === 0 ? (
                <tr>
                  <td colSpan={10}>
                    <TableEmptyState
                      title="No Claims Found"
                      description="No vendor claims match the search query."
                    />
                  </td>
                </tr>
              ) : (
                pagination.pagedItems.map((row, idx) => {
                  const isApproved = row.status === 'Approved' || row.status_code === 1;
                  const isRejected = row.status === 'Rejected' || row.status_code === 2;
                  const isLocked = isApproved || isRejected;

                  return (
                    <tr key={row.id} style={{ borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' }}>
                      <td style={{ padding: '12px 14px', fontSize: '12px' }}>
                        {(pagination.currentPage - 1) * pagination.pageSize + idx + 1}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '12px', fontWeight: 600, color: '#1e293b' }}>
                        {row.payment_type}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '12px', color: '#64748b' }}>{row.date}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', fontSize: '12px', fontWeight: 600 }}>{row.sites}</td>
                      <td style={{ padding: '12px 14px', fontSize: '12px' }}>
                        <button
                          type="button"
                          onClick={() => setPreviewInvoice(row)}
                          style={{
                            border: 'none',
                            background: '#eff6ff',
                            color: '#2563eb',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontFamily: 'monospace',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontSize: '11px',
                          }}
                        >
                          {row.invoice}
                        </button>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontSize: '12px', fontWeight: 700, color: '#0f766e' }}>
                        ₹{row.amount.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '12px', maxWidth: '170px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {row.remarks || '—'}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '12px', maxWidth: '170px', color: '#b45309' }}>
                        {row.verify_remarks || '—'}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        {isApproved ? (
                          <span className="ax-badge ax-badge--soft ax-badge--success" style={{ padding: '3px 8px', fontSize: '11px', fontWeight: 700 }}>
                            Approved
                          </span>
                        ) : isRejected ? (
                          <span className="ax-badge ax-badge--soft ax-badge--danger" style={{ padding: '3px 8px', fontSize: '11px', fontWeight: 700 }}>
                            Rejected
                          </span>
                        ) : (
                          <span className="ax-badge ax-badge--soft ax-badge--warning" style={{ padding: '3px 8px', fontSize: '11px', fontWeight: 700 }}>
                            Pending
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        {isLocked ? (
                          /* Locked Button Pattern */
                          <button
                            type="button"
                            disabled
                            title={`Claim has been ${row.status} (Locked)`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              background: '#f1f5f9',
                              color: '#94a3b8',
                              border: '1px solid #cbd5e1',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'not-allowed',
                            }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                            Locked
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenVerify(row)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              background: '#2563eb',
                              color: '#ffffff',
                              border: 'none',
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Verify Claim
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

        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--ax-border, #e2e8f0)', display: 'flex', justifyContent: 'flex-start' }}>
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            pageSize={pagination.pageSize}
            onPageChange={pagination.setCurrentPage}
            onPageSizeChange={pagination.setPageSize}
          />
        </div>
      </div>

      {/* ── VERIFY CLAIM MODAL ── */}
      {verifyingClaim && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              maxWidth: '520px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>
                Verify Installation Claim
              </h3>
              <button
                type="button"
                onClick={() => setVerifyingClaim(null)}
                style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <div style={{ fontSize: '13px', color: '#475569', marginBottom: '16px', lineHeight: 1.5 }}>
              <div><strong>Invoice:</strong> {verifyingClaim.invoice} ({verifyingClaim.payment_type})</div>
              <div><strong>Amount:</strong> ₹{verifyingClaim.amount.toLocaleString('en-IN')} | Sites: {verifyingClaim.sites}</div>
              <div><strong>Submission Date:</strong> {verifyingClaim.date}</div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                Claim Approval Decision
              </label>
              <div style={{ display: 'flex', gap: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="claim_verify_status"
                    value="1"
                    checked={verifyStatusCode === '1'}
                    onChange={() => setVerifyStatusCode('1')}
                  />
                  <span style={{ color: '#15803d', fontWeight: 600 }}>Approve Claim</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="claim_verify_status"
                    value="2"
                    checked={verifyStatusCode === '2'}
                    onChange={() => setVerifyStatusCode('2')}
                  />
                  <span style={{ color: '#b91c1c', fontWeight: 600 }}>Reject Claim</span>
                </label>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Audit Remarks
              </label>
              <textarea
                rows={3}
                placeholder="Enter financial audit observations or rejection reasons..."
                value={verifyRemarks}
                onChange={(e) => setVerifyRemarks(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="ax-btn ax-btn--secondary"
                onClick={() => setVerifyingClaim(null)}
                disabled={submittingVerify}
              >
                Cancel
              </button>
              <button
                type="button"
                className="ax-btn ax-btn--primary"
                onClick={handleSaveVerification}
                disabled={submittingVerify}
                style={{
                  background: verifyStatusCode === '1' ? '#10b981' : '#ef4444',
                  borderColor: verifyStatusCode === '1' ? '#10b981' : '#ef4444',
                }}
              >
                {submittingVerify ? 'Updating...' : verifyStatusCode === '1' ? 'Approve Claim' : 'Reject Claim'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── INVOICE PREVIEW MODAL ── */}
      {previewInvoice && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '20px',
          }}
          onClick={() => setPreviewInvoice(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              maxWidth: '560px',
              width: '100%',
              padding: '24px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontWeight: 700, fontSize: '16px', color: '#1e293b' }}>
                Tax Invoice: {previewInvoice.invoice}
              </div>
              <button
                type="button"
                onClick={() => setPreviewInvoice(null)}
                style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px', fontSize: '13px', lineHeight: 1.6 }}>
              <div><strong>Tranche Type:</strong> {previewInvoice.payment_type}</div>
              <div><strong>Invoice Date:</strong> {previewInvoice.date}</div>
              <div><strong>Covered Sites:</strong> {previewInvoice.sites} solar water pump installations</div>
              <div><strong>Taxable Value:</strong> ₹{(previewInvoice.amount / 1.18).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
              <div><strong>GST (18%):</strong> ₹{(previewInvoice.amount - previewInvoice.amount / 1.18).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
              <div style={{ borderTop: '1px solid #cbd5e1', marginTop: '8px', paddingTop: '8px', fontSize: '15px', fontWeight: 700, color: '#0f766e' }}>
                Total Claim Amount: ₹{previewInvoice.amount.toLocaleString('en-IN')}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
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
    </div>
  );
}
