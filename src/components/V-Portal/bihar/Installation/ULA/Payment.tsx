import { useState, useMemo, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  biharUlaInstallationService,
  type PaymentClaimItem,
} from '../../../../../services/biharUlaInstallationService';
import {
  TableExportToolbar,
  SearchInput,
  Pagination,
  TableEmptyState,
  copyTableDataToClipboard,
  exportDataToCSV,
  exportDataToExcel,
  printTableData,
  type ExportColumn,
} from '../../../../../common';

const ICON_REFRESH = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
    <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
  </svg>
);

const ICON_PLUS = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 5l0 14" />
    <path d="M5 12l14 0" />
  </svg>
);

const ICON_EYE = (
  <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="2" />
    <path d="M22 12c-2.667 4.667 -6 7 -10 7s-7.333 -2.333 -10 -7c2.667 -4.667 6 -7 10 -7s7.333 2.333 10 7" />
  </svg>
);

export function Bihar_Installation_ULA_Payment() {
  const [loading, setLoading] = useState(true);
  const [claims, setClaims] = useState<PaymentClaimItem[]>([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');

  // Modal State
  const [selectedClaim, setSelectedClaim] = useState<PaymentClaimItem | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await biharUlaInstallationService.getViewPayments();
      setClaims(data || []);
    } catch (err: any) {
      console.error('Failed to load payment claims:', err);
      setClaims([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Extract site count
  const getSiteCount = (item: PaymentClaimItem) => {
    if (Array.isArray(item.sites) && item.sites.length > 0) return item.sites.length;
    if (typeof item.site_id === 'string') {
      try {
        const parsed = JSON.parse(item.site_id);
        if (Array.isArray(parsed)) return parsed.length;
      } catch {
        // ignore
      }
    }
    return 1;
  };

  // KPIs
  const totalClaims = claims.length;
  const totalClaimAmount = claims.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  const totalPaidAmount = claims.reduce((sum, c) => sum + (Number(c.payment_amount) || 0), 0);
  const totalBalanceAmount = claims.reduce((sum, c) => sum + (Number(c.payment_balance) || 0), 0);

  // Filtered
  const filteredClaims = useMemo(() => {
    return claims.filter((c) => {
      const matchType = selectedTypeFilter === 'All' || String(c.payment_type) === selectedTypeFilter;
      let matchStatus = true;
      if (selectedStatusFilter === 'Approved') matchStatus = Number(c.claim_status) === 1;
      else if (selectedStatusFilter === 'Pending') matchStatus = Number(c.claim_status) === 0;
      else if (selectedStatusFilter === 'Paid') matchStatus = Number(c.payment_status) === 1;

      if (!matchType || !matchStatus) return false;

      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        String(c.id).includes(q) ||
        c.remarks?.toLowerCase().includes(q) ||
        c.payment_remarks?.toLowerCase().includes(q) ||
        c.sites?.some((s) => s.beneficiary_name?.toLowerCase().includes(q) || s.district?.toLowerCase().includes(q))
      );
    });
  }, [claims, selectedTypeFilter, selectedStatusFilter, search]);

  // Paginated
  const paginatedClaims = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredClaims.slice(start, start + pageSize);
  }, [filteredClaims, currentPage, pageSize]);

  // Export Cols
  const exportCols: ExportColumn<PaymentClaimItem>[] = useMemo(
    () => [
      { header: 'Claim ID', accessor: (r) => `#${r.id}` },
      { header: 'Claim Date', accessor: (r) => r.created_at || '—' },
      { header: 'Type', accessor: (r) => `${r.payment_type || 50}% Claim` },
      { header: 'Sites Count', accessor: (r) => getSiteCount(r) },
      { header: 'Claim Amount', accessor: (r) => `₹${Number(r.amount || 0).toLocaleString('en-IN')}` },
      { header: 'Claim Status', accessor: (r) => (Number(r.claim_status) === 1 ? 'Approved' : Number(r.claim_status) === 2 ? 'Rejected' : 'Pending') },
      { header: 'Paid Amount', accessor: (r) => `₹${Number(r.payment_amount || 0).toLocaleString('en-IN')}` },
      { header: 'Balance', accessor: (r) => `₹${Number(r.payment_balance || 0).toLocaleString('en-IN')}` },
      { header: 'Payment Date', accessor: (r) => r.payment_date || '—' },
      { header: 'Payment Remarks', accessor: (r) => r.payment_remarks || '—' },
    ],
    []
  );

  return (
    <div className="ax-page">
      <PageHead
        title="Bihar - Installation > ULA > Payment Claims"
        subtitle="Track submitted invoices, claim approvals, and disbursement balances"
        breadcrumbs={[
          { label: 'Bihar' },
          { label: 'Installation' },
          { label: 'ULA' },
          { label: 'Payment Claims' },
        ]}
        actions={
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={loadData}
              disabled={loading}
            >
              <span className={loading ? 'ax-spinner' : ''}>{ICON_REFRESH}</span>
              <span className="ax-btn__label">Refresh</span>
            </button>
            <Link to="/v/bihar/ula-installation-claim" className="ax-btn ax-btn--primary ax-btn--sm">
              {ICON_PLUS}
              <span className="ax-btn__label">Raise Claim</span>
            </Link>
          </div>
        }
      />

      <div className="ax-dash-grid">
        {/* KPI Summary Cards */}
        <div className="ax-card ax-kpi ax-col--3">
          <div className="ax-card__body">
            <div className="ax-kpi__top">
              <span className="ax-badge ax-badge--soft ax-badge--info">All Claims</span>
            </div>
            <div className="ax-kpi__label">Total Claims Raised</div>
            <div className="ax-kpi__value ax-num">{totalClaims}</div>
            <div className="ax-kpi__caption">Batches submitted for payout</div>
          </div>
        </div>

        <div className="ax-card ax-kpi ax-col--3">
          <div className="ax-card__body">
            <div className="ax-kpi__top">
              <span className="ax-badge ax-badge--soft ax-badge--neutral">Invoiced</span>
            </div>
            <div className="ax-kpi__label">Total Claim Amount</div>
            <div className="ax-kpi__value ax-num">₹{totalClaimAmount.toLocaleString('en-IN')}</div>
            <div className="ax-kpi__caption">Cumulative invoice claims</div>
          </div>
        </div>

        <div className="ax-card ax-kpi ax-col--3">
          <div className="ax-card__body">
            <div className="ax-kpi__top">
              <span className="ax-badge ax-badge--soft ax-badge--success">Disbursed</span>
            </div>
            <div className="ax-kpi__label">Total Paid Amount</div>
            <div className="ax-kpi__value ax-num">₹{totalPaidAmount.toLocaleString('en-IN')}</div>
            <div className="ax-kpi__caption">Amount credited to vendor</div>
          </div>
        </div>

        <div className="ax-card ax-kpi ax-col--3">
          <div className="ax-card__body">
            <div className="ax-kpi__top">
              <span className="ax-badge ax-badge--soft ax-badge--warning">Pending Balance</span>
            </div>
            <div className="ax-kpi__label">Disbursement Balance</div>
            <div className="ax-kpi__value ax-num">₹{totalBalanceAmount.toLocaleString('en-IN')}</div>
            <div className="ax-kpi__caption">Awaiting bank settlement</div>
          </div>
        </div>

        {/* Claims Table */}
        <section className="ax-card ax-col--12" aria-labelledby="claim-table-title">
          <div className="ax-card__header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: 'var(--ax-space-2)' }}>
              <div>
                <h3 id="claim-table-title" className="ax-card__title">Payment Claims History</h3>
                <p className="ax-card__subtitle">Detailed view of raised claims, verify approvals, and payment transactions</p>
              </div>
              <TableExportToolbar
                onExportCSV={() => exportDataToCSV(filteredClaims, exportCols, 'bihar_ula_payment_claims.csv')}
                onExportExcel={() => exportDataToExcel(filteredClaims, exportCols, 'bihar_ula_payment_claims.xlsx')}
                onPrint={() => printTableData(filteredClaims, exportCols, 'Bihar ULA Payment Claims')}
                onCopy={() => copyTableDataToClipboard(filteredClaims, exportCols)}
              />
            </div>
          </div>

          <div className="ax-card__body">
            {/* Filter toolbar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--ax-space-3)', alignItems: 'center', marginBottom: 'var(--ax-space-3)' }}>
              <div style={{ width: 260 }}>
                <SearchInput
                  value={search}
                  onChange={setSearch}
                  placeholder="Search claim ID, remarks..."
                />
              </div>

              <div className="ax-cluster" style={{ gap: '6px', alignItems: 'center' }}>
                <label htmlFor="stage_filter" style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)', fontWeight: 500 }}>
                  Claim Type:
                </label>
                <select
                  id="stage_filter"
                  className="ax-input ax-input--sm"
                  style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                  value={selectedTypeFilter}
                  onChange={(e) => {
                    setSelectedTypeFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="All">All Types</option>
                  <option value="50">50% Advance</option>
                  <option value="30">30% Final</option>
                </select>
              </div>

              <div className="ax-cluster" style={{ gap: '6px', alignItems: 'center' }}>
                <label htmlFor="status_filter" style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)', fontWeight: 500 }}>
                  Status:
                </label>
                <select
                  id="status_filter"
                  className="ax-input ax-input--sm"
                  style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                  value={selectedStatusFilter}
                  onChange={(e) => {
                    setSelectedStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="All">All Statuses</option>
                  <option value="Approved">Claim Approved</option>
                  <option value="Pending">Claim Pending</option>
                  <option value="Paid">Payment Disbursed</option>
                </select>
              </div>

              {(selectedTypeFilter !== 'All' || selectedStatusFilter !== 'All' || search) && (
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--sm"
                  style={{ height: 28, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }}
                  onClick={() => {
                    setSelectedTypeFilter('All');
                    setSelectedStatusFilter('All');
                    setSearch('');
                  }}
                >
                  Reset
                </button>
              )}
            </div>

            <div className="ax-table-wrap">
              <table className="ax-table ax-table--hover">
                <thead>
                  <tr>
                    <th>Sr.</th>
                    <th>Claim ID</th>
                    <th>Stage</th>
                    <th>Date</th>
                    <th>Sites Count</th>
                    <th>Claim Amount</th>
                    <th>Invoice</th>
                    <th>Claim Status</th>
                    <th>Paid Amount</th>
                    <th>Balance</th>
                    <th>Payment Date & UTR</th>
                    <th>Payment Status</th>
                    <th style={{ textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={13} style={{ textAlign: 'center', padding: 'var(--ax-space-6)' }}>
                        <span className="ax-spinner" /> Loading payment claims...
                      </td>
                    </tr>
                  ) : paginatedClaims.length === 0 ? (
                    <tr>
                      <td colSpan={13}>
                        <TableEmptyState title="No payment claims found" message="Submitted payment claims will appear here." />
                      </td>
                    </tr>
                  ) : (
                    paginatedClaims.map((c, index) => {
                      const isClaimApproved = Number(c.claim_status) === 1;
                      const isClaimRejected = Number(c.claim_status) === 2;
                      const isPayDone = Number(c.payment_status) === 1;

                      return (
                        <tr key={c.id}>
                          <td>{(currentPage - 1) * pageSize + index + 1}</td>
                          <td style={{ fontWeight: 600 }}>#{c.id}</td>
                          <td>
                            <span className="ax-badge ax-badge--soft ax-badge--info">
                              {c.payment_type || 50}%
                            </span>
                          </td>
                          <td>{c.created_at ? new Date(c.created_at).toLocaleDateString('en-GB') : '—'}</td>
                          <td>
                            <button
                              type="button"
                              className="ax-badge ax-badge--soft ax-badge--neutral"
                              style={{ cursor: 'pointer', border: 'none' }}
                              onClick={() => setSelectedClaim(c)}
                            >
                              {getSiteCount(c)} Sites
                            </button>
                          </td>
                          <td style={{ fontWeight: 600 }}>₹{Number(c.amount || 0).toLocaleString('en-IN')}</td>
                          <td>
                            {c.file ? (
                              <a
                                href={c.file}
                                target="_blank"
                                rel="noreferrer"
                                className="ax-btn ax-btn--ghost ax-btn--sm"
                                style={{ height: 26, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }}
                              >
                                View Inv
                              </a>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td>
                            {isClaimApproved ? (
                              <span className="ax-badge ax-badge--soft ax-badge--success">Approved</span>
                            ) : isClaimRejected ? (
                              <span className="ax-badge ax-badge--soft ax-badge--danger">Rejected</span>
                            ) : (
                              <span className="ax-badge ax-badge--soft ax-badge--warning">Pending</span>
                            )}
                          </td>
                          <td style={{ fontWeight: 600, color: 'var(--ax-success)' }}>
                            ₹{Number(c.payment_amount || 0).toLocaleString('en-IN')}
                          </td>
                          <td style={{ color: Number(c.payment_balance) > 0 ? 'var(--ax-warning)' : 'inherit' }}>
                            ₹{Number(c.payment_balance || 0).toLocaleString('en-IN')}
                          </td>
                          <td>
                            <div>{c.payment_date || '—'}</div>
                            {c.payment_remarks && (
                              <div style={{ fontSize: '10px', color: 'var(--ax-text-muted)' }}>
                                {c.payment_remarks}
                              </div>
                            )}
                          </td>
                          <td>
                            {isPayDone ? (
                              <span className="ax-badge ax-badge--soft ax-badge--success">Paid</span>
                            ) : Number(c.payment_amount) > 0 ? (
                              <span className="ax-badge ax-badge--soft ax-badge--warning">Partial</span>
                            ) : (
                              <span className="ax-badge ax-badge--soft ax-badge--neutral">Pending</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              className="ax-btn ax-btn--secondary ax-btn--sm"
                              style={{ height: 26, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }}
                              onClick={() => setSelectedClaim(c)}
                            >
                              {ICON_EYE}
                              <span className="ax-btn__label">Sites</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 'var(--ax-space-3)' }}>
              <Pagination
                currentPage={currentPage}
                totalCount={filteredClaims.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
              />
            </div>
          </div>
        </section>
      </div>

      {/* ── View Claim Sites Modal ── */}
      {selectedClaim && (
        <div className="ax-modal-backdrop" onClick={() => setSelectedClaim(null)}>
          <div className="ax-modal" style={{ maxWidth: 850 }} onClick={(e) => e.stopPropagation()}>
            <div className="ax-modal__header">
              <div>
                <h4 className="ax-modal__title">Sites Included in Claim #{selectedClaim.id}</h4>
                <p style={{ margin: 0, fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
                  Stage: {selectedClaim.payment_type}% · Invoiced Amount: ₹{Number(selectedClaim.amount || 0).toLocaleString('en-IN')}
                </p>
              </div>
              <button
                type="button"
                className="ax-btn ax-btn--ghost ax-btn--icon"
                onClick={() => setSelectedClaim(null)}
              >
                ✕
              </button>
            </div>
            <div className="ax-modal__body" style={{ maxHeight: 420, overflowY: 'auto' }}>
              {!selectedClaim.sites || selectedClaim.sites.length === 0 ? (
                <TableEmptyState
                  title="No detailed site breakdown"
                  message={`This claim covers ${getSiteCount(selectedClaim)} sites.`}
                />
              ) : (
                <div className="ax-table-wrap">
                  <table className="ax-table ax-table--hover">
                    <thead>
                      <tr>
                        <th>Sr.</th>
                        <th>Beneficiary Name</th>
                        <th>District</th>
                        <th>Block</th>
                        <th>Village</th>
                        <th>Contact No.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedClaim.sites.map((s, idx) => (
                        <tr key={s.id || idx}>
                          <td>{idx + 1}</td>
                          <td style={{ fontWeight: 600 }}>{s.beneficiary_name || `Site #${s.id}`}</td>
                          <td>{s.district || '—'}</td>
                          <td>{s.block || '—'}</td>
                          <td>{s.village || '—'}</td>
                          <td>{s.contact_no || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="ax-modal__footer">
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--sm"
                onClick={() => setSelectedClaim(null)}
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

export default Bihar_Installation_ULA_Payment;
