import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  Pagination,
  usePagination,
  SearchInput,
  TableEmptyState,
} from '../../../../../common';
import {
  jammuExpenseService,
  type JammuExpensePaymentData,
} from '../../jammu-services';

/* ───────── Responsive styling ───────── */
const PAGE_CSS = `
  .solar-erp-page {
    --asw-primary: #2563eb;
    --asw-primary-rgb: 37, 99, 235;
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
`;

const EMPTY_PAYMENT_DATA: JammuExpensePaymentData = {
  vendor: { id: 0, name: '' },
  company_id: 0,
  loginId: 0,
  payments: [],
  payment_detail: {
    total: 0,
    complete: 0,
    partially: 0,
    pending: 0,
  },
};

export function ViewPayments() {
  const [paymentData, setPaymentData] = useState<JammuExpensePaymentData>(EMPTY_PAYMENT_DATA);
  const [loading, setLoading] = useState<boolean>(true);
  void loading;
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Load payments from API 20: GET /jammu/installation-expenses-view-payment
  const loadPayments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await jammuExpenseService.getExpensePayments();
      if (data && Array.isArray(data.payments)) {
        setPaymentData(data);
      } else {
        setPaymentData(EMPTY_PAYMENT_DATA);
      }
    } catch (err) {
      console.error('Failed to load expense payment data from API:', err);
      setPaymentData(EMPTY_PAYMENT_DATA);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const summary = paymentData.payment_detail || EMPTY_PAYMENT_DATA.payment_detail!;

  // Filtered payments
  const filteredPayments = useMemo(() => {
    return (paymentData.payments || []).filter((item) => {
      const matchSearch =
        !searchQuery ||
        item.site_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.site_code && item.site_code.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.utr_no && item.utr_no.toLowerCase().includes(searchQuery.toLowerCase()));

      let matchStatus = true;
      if (statusFilter === 'DISBURSED') matchStatus = item.pay_status === 1;
      if (statusFilter === 'PENDING') matchStatus = item.pay_status === 0;
      if (statusFilter === 'PARTIAL') matchStatus = item.pay_status === 2;

      return matchSearch && matchStatus;
    });
  }, [paymentData.payments, searchQuery, statusFilter]);

  const { paginatedData, currentPage, pageSize, totalItems, setPage, setPageSize } =
    usePagination({ data: filteredPayments, initialPageSize: 10 });

  return (
    <div className="ax-page solar-erp-page">
      <style>{PAGE_CSS}</style>

      <PageHead
        title="Jammu SRT 70MW - View Payments"
        subtitle="Track expense reimbursement disbursals, bank UTR transaction references, and settlement accounts"
        breadcrumbs={[
          { label: 'Jammu & Kashmir' },
          { label: 'Installation Expenses' },
          { label: 'SRT 70MW' },
          { label: 'View Payments' },
        ]}
      />

      {/* Vendor Profile Info Ribbon */}
      {paymentData.vendor && (
        <div
          style={{
            marginBottom: '16px',
            padding: '12px 18px',
            borderRadius: '8px',
            background: 'var(--ax-surface-subtle, #f8fafc)',
            border: '1px solid var(--ax-border, #e2e8f0)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>🏢</span>
            <div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Vendor Account</span>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>
                {paymentData.vendor.name || 'Vendor Partner'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '16px', fontSize: '12.5px', color: '#475569' }}>
            <span>Company ID: <strong>{paymentData.company_id ?? 1}</strong></span>
            <span>&bull;</span>
            <span>Login ID: <strong>{paymentData.loginId ?? 5}</strong></span>
          </div>
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="asw-cards-row">
        {/* Card 1 */}
        <div className="ax-card">
          <div className="ax-card__body" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>TOTAL EXPENSES</span>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563eb' }} />
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#1e293b' }}>
              ₹ {Number(summary.total || 0).toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
              Across {paymentData.payments?.length || 0} claimed vouchers
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="ax-card">
          <div className="ax-card__body" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>DISBURSED / PAID</span>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#059669' }}>
              ₹ {Number(summary.complete || 0).toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
              Processed through direct bank RTGS/NEFT
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="ax-card">
          <div className="ax-card__body" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>PENDING REIMBURSEMENT</span>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} />
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#d97706' }}>
              ₹ {Number(summary.pending || 0).toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
              Queued for next account payout cycle
            </div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="ax-card">
          <div className="ax-card__body" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>PARTIALLY CLEARED</span>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#7c3aed' }} />
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#7c3aed' }}>
              ₹ {Number(summary.partially || 0).toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
              Partially reimbursed claims
            </div>
          </div>
        </div>
      </div>

      {/* Payment Disbursal Ledger Card */}
      <div className="ax-card">
        <div className="ax-card__header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--ax-border-subtle, #f1f5f9)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <div>
            <h3 className="ax-card__title" style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
              Reimbursement Disbursal & UTR Ledger
            </h3>
            <p className="ax-card__subtitle" style={{ fontSize: '12.5px', color: '#64748b', margin: '2px 0 0 0' }}>
              Verified bank payment references and payment completion dates
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--ax-border, #cbd5e1)', fontSize: '13px' }}
            >
              <option value="ALL">All Payout Statuses</option>
              <option value="DISBURSED">Fully Disbursed</option>
              <option value="PENDING">Pending Payment</option>
              <option value="PARTIAL">Partially Paid</option>
            </select>

            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search site, UTR no..."
            />

            <Link to="/v/jammu/installation-expenses/srt-70mw/request-expenses" className="ax-btn ax-btn--primary">
              + Request Expense
            </Link>
          </div>
        </div>

        <div className="ax-card__body" style={{ padding: 0 }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="ax-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={{ padding: '12px 14px' }}>Sr. No.</th>
                  <th style={{ padding: '12px 14px' }}>Site Details</th>
                  <th style={{ padding: '12px 14px' }}>Expense Purpose</th>
                  <th style={{ padding: '12px 14px' }}>Amount (₹)</th>
                  <th style={{ padding: '12px 14px' }}>Bank UTR / Ref No.</th>
                  <th style={{ padding: '12px 14px' }}>Paid Date</th>
                  <th style={{ padding: '12px 14px' }}>Audit Status</th>
                  <th style={{ padding: '12px 14px' }}>Disbursal Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: 0 }}>
                      <TableEmptyState title="No expense payments found" message="No expense payments found matching your filters." />
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((item, index) => {
                    const sr = (currentPage - 1) * pageSize + index + 1;
                    const amountFormatted = Number(item.amount)
                      ? `₹ ${Number(item.amount).toLocaleString('en-IN')}`
                      : '₹ 0';

                    return (
                      <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 14px', fontWeight: 600, color: '#64748b' }}>{sr}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: 700, color: '#1e293b' }}>{item.site_name}</div>
                          {item.site_code && (
                            <div style={{ fontSize: '11px', color: '#64748b' }}>Code: {item.site_code}</div>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 600, color: '#334155' }}>
                          {item.purpose}
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: '#2563eb' }}>
                          {amountFormatted}
                        </td>
                        <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontWeight: 600, color: item.utr_no && item.utr_no !== '—' ? '#0f172a' : '#94a3b8' }}>
                          {item.utr_no || '—'}
                        </td>
                        <td style={{ padding: '12px 14px', color: '#475569' }}>
                          {item.paid_date || '—'}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          {item.claim_status === 2 ? (
                            <span style={{ background: '#ecfdf5', color: '#065f46', padding: '3px 8px', borderRadius: '4px', fontSize: '11.5px', fontWeight: 600 }}>
                              ✓ Approved
                            </span>
                          ) : (
                            <span style={{ background: '#fffbeb', color: '#92400e', padding: '3px 8px', borderRadius: '4px', fontSize: '11.5px', fontWeight: 600 }}>
                              Pending
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          {item.pay_status === 1 ? (
                            <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '3px 8px', borderRadius: '4px', fontSize: '11.5px', fontWeight: 600 }}>
                              ✓ Disbursed
                            </span>
                          ) : item.pay_status === 2 ? (
                            <span style={{ background: '#faf5ff', color: '#7e22ce', padding: '3px 8px', borderRadius: '4px', fontSize: '11.5px', fontWeight: 600 }}>
                              Partially Paid
                            </span>
                          ) : (
                            <span style={{ background: '#f1f5f9', color: '#64748b', padding: '3px 8px', borderRadius: '4px', fontSize: '11.5px' }}>
                              Pending Disbursal
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="ax-card__footer" style={{ padding: '12px 20px', borderTop: '1px solid #e2e8f0' }}>
            <div className="ula-pagination-left">
              <Pagination
                currentPage={currentPage}
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                pageSizeOptions={[5, 10, 20, 50]}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ViewPayments;
