import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  Pagination,
  usePagination,
  SearchInput,
  TableEmptyState,
} from '../../../../../common';
import {
  jammuExpenseService,
  resolveJammuMediaUrl,
  type JammuExpenseClaimItem,
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

export function ViewExpenses() {
  const [expenses, setExpenses] = useState<JammuExpenseClaimItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  void loading;
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [claimStatusFilter, setClaimStatusFilter] = useState<string>('ALL');
  const [payStatusFilter, setPayStatusFilter] = useState<string>('ALL');

  // Notifications
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editLoading, setEditLoading] = useState<boolean>(false);
  const [sitesDropdown, setSitesDropdown] = useState<Array<{ id: number; site_name: string }>>([]);
  const [editForm, setEditForm] = useState({
    site_id: '',
    purpose: '',
    amount: '',
    remarks: '',
  });
  const [editFile, setEditFile] = useState<File | null>(null);
  const [submittingEdit, setSubmittingEdit] = useState<boolean>(false);

  const editModalRef = useRef<HTMLDivElement>(null);
  useFocusTrap(editModalRef, editModalOpen);

  // Load claims from API 15: GET /jammu/installation-expenses
  const loadExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await jammuExpenseService.getExpenseClaims();
      setExpenses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load expense claims from API:', err);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  // Open Edit Modal (API 18)
  const handleOpenEdit = async (id: number) => {
    setEditingId(id);
    setEditModalOpen(true);
    setEditLoading(true);
    setEditFile(null);

    try {
      const data = await jammuExpenseService.editExpenseClaimLoad(id);
      if (data?.claim) {
        setEditForm({
          site_id: String(data.claim.site_id || ''),
          purpose: data.claim.purpose || '',
          amount: String(data.claim.amount || ''),
          remarks: data.claim.remarks || '',
        });
      }
      setSitesDropdown(Array.isArray(data?.srt70mw) ? data.srt70mw : []);
    } catch (err) {
      console.error('Error loading edit claim:', err);
      const match = expenses.find((e) => e.id === id);
      setEditForm({
        site_id: String(match?.id || ''),
        purpose: match?.purpose || '',
        amount: String(match?.amount || ''),
        remarks: match?.remarks || '',
      });
      setSitesDropdown([]);
    } finally {
      setEditLoading(false);
    }
  };

  // Save Edit (API 19)
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    setSubmittingEdit(true);
    try {
      const fd = new FormData();
      fd.append('id', String(editingId));
      fd.append('site_id', editForm.site_id);
      fd.append('purpose', editForm.purpose);
      fd.append('amount', editForm.amount);
      if (editForm.remarks) fd.append('remarks', editForm.remarks);
      if (editFile) fd.append('file', editFile);

      const res = await jammuExpenseService.updateExpenseClaim(fd);
      if (res?.success) {
        setNotification({
          type: 'success',
          message: 'Expense claim updated successfully!',
        });
        setEditModalOpen(false);
        loadExpenses();
      } else {
        setNotification({
          type: 'error',
          message: res?.message || 'Failed to update expense claim.',
        });
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Error occurred while saving claim.',
      });
    } finally {
      setSubmittingEdit(false);
    }
  };

  // KPIs
  const kpis = useMemo(() => {
    const totalCount = expenses.length;
    let totalAmount = 0;
    let approvedCount = 0;
    let approvedAmount = 0;
    let pendingCount = 0;
    let disbursedCount = 0;
    let disbursedAmount = 0;

    expenses.forEach((e) => {
      const amt = Number(e.amount) || 0;
      totalAmount += amt;
      if (e.claim_status === 2) {
        approvedCount++;
        approvedAmount += amt;
      } else {
        pendingCount++;
      }
      if (e.pay_status === 1) {
        disbursedCount++;
        disbursedAmount += amt;
      }
    });

    return {
      totalCount,
      totalAmount,
      approvedCount,
      approvedAmount,
      pendingCount,
      disbursedCount,
      disbursedAmount,
    };
  }, [expenses]);

  // Filtered
  const filteredExpenses = useMemo(() => {
    return expenses.filter((item) => {
      const matchSearch =
        !searchQuery ||
        item.site_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.site_code && item.site_code.toLowerCase().includes(searchQuery.toLowerCase()));

      let matchClaim = true;
      if (claimStatusFilter === 'APPROVED') matchClaim = item.claim_status === 2;
      if (claimStatusFilter === 'PENDING') matchClaim = item.claim_status === 1;

      let matchPay = true;
      if (payStatusFilter === 'PAID') matchPay = item.pay_status === 1;
      if (payStatusFilter === 'UNPAID') matchPay = item.pay_status === 0;

      return matchSearch && matchClaim && matchPay;
    });
  }, [expenses, searchQuery, claimStatusFilter, payStatusFilter]);

  const { paginatedData, currentPage, pageSize, totalItems, setPage, setPageSize } =
    usePagination({ data: filteredExpenses, initialPageSize: 10 });

  return (
    <div className="ax-page solar-erp-page">
      <style>{PAGE_CSS}</style>

      <PageHead
        title="Jammu SRT 70MW - View Expenses"
        subtitle="Manage and audit site installation expense claims, verify receipts, and monitor reimbursement payouts"
        breadcrumbs={[
          { label: 'Jammu & Kashmir' },
          { label: 'Installation Expenses' },
          { label: 'SRT 70MW' },
          { label: 'View Expenses' },
        ]}
      />

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
              {kpis.totalCount}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
              Gross Claimed: <strong>₹ {kpis.totalAmount.toLocaleString('en-IN')}</strong>
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="ax-card">
          <div className="ax-card__body" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>APPROVED CLAIMS</span>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#059669' }}>
              {kpis.approvedCount}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
              Sanctioned: <strong>₹ {kpis.approvedAmount.toLocaleString('en-IN')}</strong>
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="ax-card">
          <div className="ax-card__body" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>PENDING AUDIT</span>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} />
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#d97706' }}>
              {kpis.pendingCount}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
              Awaiting project manager sign-off
            </div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="ax-card">
          <div className="ax-card__body" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>REIMBURSED</span>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#7c3aed' }} />
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#7c3aed' }}>
              {kpis.disbursedCount}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
              Paid to Vendor: <strong>₹ {kpis.disbursedAmount.toLocaleString('en-IN')}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          style={{
            marginBottom: '16px',
            padding: '12px 16px',
            borderRadius: '8px',
            backgroundColor: notification.type === 'success' ? '#ecfdf5' : '#fef2f2',
            border: `1px solid ${notification.type === 'success' ? '#10b981' : '#ef4444'}`,
            color: notification.type === 'success' ? '#065f46' : '#991b1b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '13.5px',
          }}
        >
          <span>{notification.message}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '16px', color: 'inherit' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Master Expense Ledger Card */}
      <div className="ax-card">
        <div className="ax-card__header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--ax-border-subtle, #f1f5f9)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <div>
            <h3 className="ax-card__title" style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
              Installation Expense Requisition Ledger
            </h3>
            <p className="ax-card__subtitle" style={{ fontSize: '12.5px', color: '#64748b', margin: '2px 0 0 0' }}>
              Track approval state, voucher attachments, and reimbursement disbursal milestones
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <select
              value={claimStatusFilter}
              onChange={(e) => setClaimStatusFilter(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--ax-border, #cbd5e1)', fontSize: '13px' }}
            >
              <option value="ALL">All Audit Statuses</option>
              <option value="PENDING">Pending Review</option>
              <option value="APPROVED">Approved Claims</option>
            </select>

            <select
              value={payStatusFilter}
              onChange={(e) => setPayStatusFilter(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--ax-border, #cbd5e1)', fontSize: '13px' }}
            >
              <option value="ALL">All Payout Statuses</option>
              <option value="PAID">Disbursed</option>
              <option value="UNPAID">Pending Disbursal</option>
            </select>

            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search site, purpose..."
            />

            <Link to="/v/jammu/installation-expenses/srt-70mw/request-expenses" className="ax-btn ax-btn--primary">
              + Request New Expense
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
                  <th style={{ padding: '12px 14px' }}>Date</th>
                  <th style={{ padding: '12px 14px' }}>Amount (₹)</th>
                  <th style={{ padding: '12px 14px' }}>Voucher File</th>
                  <th style={{ padding: '12px 14px' }}>Remarks</th>
                  <th style={{ padding: '12px 14px' }}>Audit Status</th>
                  <th style={{ padding: '12px 14px' }}>Payout Status</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ padding: 0 }}>
                      <TableEmptyState title="No expenses found" message="No installation expense claims found matching your filters." />
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((item, index) => {
                    const sr = (currentPage - 1) * pageSize + index + 1;
                    const amountFormatted = Number(item.amount)
                      ? `₹ ${Number(item.amount).toLocaleString('en-IN')}`
                      : '₹ 0';

                    const fileUrl = resolveJammuMediaUrl(item.file);

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
                        <td style={{ padding: '12px 14px', color: '#64748b' }}>
                          {item.date || '—'}
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: '#2563eb' }}>
                          {amountFormatted}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          {item.file ? (
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: '#2563eb', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                            >
                              📄 Receipt
                            </a>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>None</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#475569' }} title={item.remarks}>
                          {item.remarks || '—'}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          {item.claim_status === 2 ? (
                            <span style={{ background: '#ecfdf5', color: '#065f46', padding: '3px 8px', borderRadius: '4px', fontSize: '11.5px', fontWeight: 600 }}>
                              ✓ Approved
                            </span>
                          ) : (
                            <span style={{ background: '#fffbeb', color: '#92400e', padding: '3px 8px', borderRadius: '4px', fontSize: '11.5px', fontWeight: 600 }}>
                              ⏳ Pending
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          {item.pay_status === 1 ? (
                            <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '3px 8px', borderRadius: '4px', fontSize: '11.5px', fontWeight: 600 }}>
                              ✓ Disbursed
                            </span>
                          ) : item.pay_status === 2 ? (
                            <span style={{ background: '#faf5ff', color: '#7e22ce', padding: '3px 8px', borderRadius: '4px', fontSize: '11.5px' }}>
                              Partially Paid
                            </span>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '11.5px' }}>Unpaid</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          <button
                            type="button"
                            className="ax-btn ax-btn--secondary ax-btn--sm"
                            onClick={() => handleOpenEdit(item.id)}
                            style={{ fontSize: '11.5px', padding: '3px 8px' }}
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

      {/* Edit Expense Claim Modal */}
      {editModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
        >
          <div
            ref={editModalRef}
            style={{
              background: '#fff',
              borderRadius: '12px',
              maxWidth: '540px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
                Edit Expense Requisition #{editingId}
              </h3>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                style={{ background: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            {editLoading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                Loading claim details...
              </div>
            ) : (
              <form onSubmit={handleSaveEdit} style={{ padding: '24px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Site Allocation *
                  </label>
                  <select
                    value={editForm.site_id}
                    onChange={(e) => setEditForm({ ...editForm, site_id: e.target.value })}
                    style={{ width: '100%', height: '40px', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    required
                  >
                    <option value="">-- Select Site --</option>
                    {sitesDropdown.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.site_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Expense Purpose / Head *
                  </label>
                  <input
                    type="text"
                    value={editForm.purpose}
                    onChange={(e) => setEditForm({ ...editForm, purpose: e.target.value })}
                    style={{ width: '100%', height: '40px', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    required
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Amount (INR ₹) *
                  </label>
                  <input
                    type="number"
                    value={editForm.amount}
                    onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                    style={{ width: '100%', height: '40px', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    required
                    min="1"
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Replace Supporting Voucher / Receipt (Optional)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(e) => setEditFile(e.target.files?.[0] || null)}
                    style={{ width: '100%', padding: '6px', border: '1px dashed #cbd5e1', borderRadius: '6px' }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Justification / Remarks
                  </label>
                  <textarea
                    value={editForm.remarks}
                    onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })}
                    style={{ width: '100%', height: '60px', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                  <button
                    type="button"
                    className="ax-btn ax-btn--secondary"
                    onClick={() => setEditModalOpen(false)}
                    disabled={submittingEdit}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="ax-btn ax-btn--primary"
                    disabled={submittingEdit}
                  >
                    {submittingEdit ? 'Saving...' : 'Save Updates'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ViewExpenses;
