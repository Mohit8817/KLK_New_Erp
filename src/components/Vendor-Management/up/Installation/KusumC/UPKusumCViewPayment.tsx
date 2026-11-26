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
  type UpKusumCPaymentRecord,
  type UpPaymentDetailSummary,
  type UpVendorItem,
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

function getPaidAndBalance(row: UpKusumCPaymentRecord) {
  const claimAmt = Number(row.amount) || 0;
  const history = row.allpayment || [];
  const totalPaid = history.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const balance = Math.max(0, claimAmt - totalPaid);
  const latest = history.length > 0 ? history[history.length - 1] : null;
  return { claimAmt, totalPaid, balance, latest };
}

export function UPKusumCViewPayment() {
  const [payments, setPayments] = useState<UpKusumCPaymentRecord[]>([]);
  const [detail, setDetail] = useState<UpPaymentDetailSummary>({ total: 0, complete: 0, partially: 0, pending: 0 });
  const [vendors, setVendors] = useState<UpVendorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filter Bar (matching user fields: From, To, Select Vendor, Status)
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedVendor, setSelectedVendor] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Update Payment Modal (#17)
  const [payRow, setPayRow] = useState<UpKusumCPaymentRecord | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [payRemarks, setPayRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // History / Sites Modal & Lightbox
  const [historyRow, setHistoryRow] = useState<UpKusumCPaymentRecord | null>(null);
  const [lightbox, setLightbox] = useState<{ url: string; title?: string } | null>(null);

  const fetchPayments = useCallback(
    async (overrides?: { from_date?: string; to_date?: string; vendor?: string; status?: string }) => {
      setLoading(true);
      setErrorMsg('');
      try {
        const params = {
          from_date: overrides ? overrides.from_date : fromDate || undefined,
          to_date: overrides ? overrides.to_date : toDate || undefined,
          vendor: overrides ? overrides.vendor : selectedVendor || undefined,
          status: overrides ? overrides.status : selectedStatus || undefined,
        };
        const res = await upKusumCAdminService.getViewPayment(params);
        setPayments(res.payments);
        setDetail(res.payment_detail);
        if (res.vendors.length > 0) {
          setVendors(res.vendors);
        }
      } catch (err: any) {
        setErrorMsg(err?.message || 'Failed to load Kusum C installation payments.');
      } finally {
        setLoading(false);
      }
    },
    [fromDate, toDate, selectedVendor, selectedStatus]
  );

  // Load initial payments + vendor options fallback
  useEffect(() => {
    fetchPayments({});
    upKusumCAdminService
      .getAssignFormData()
      .then((res) => {
        if (res.vendors.length) {
          setVendors((prev) => (prev.length ? prev : res.vendors));
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fromDate && toDate && fromDate > toDate) {
      return setErrorMsg('From Date must be less than or equal to To Date.');
    }
    fetchPayments();
  };

  const handleResetFilters = () => {
    setFromDate('');
    setToDate('');
    setSelectedVendor('');
    setSelectedStatus('');
    setSearchQuery('');
    fetchPayments({ from_date: undefined, to_date: undefined, vendor: undefined, status: undefined });
  };

  const handleUpdatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payRow) return;
    const amt = Number(payAmount);
    const { balance } = getPaidAndBalance(payRow);
    if (isNaN(amt) || amt < 0.01) {
      return setErrorMsg('Payment amount must be at least 0.01.');
    }
    if (amt > balance + 0.001) {
      return setErrorMsg('Payment amount cannot be greater than the remaining balance.');
    }
    if (!payDate) {
      return setErrorMsg('Payment date is required.');
    }

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await upKusumCAdminService.updatePaymentStatus({
        id: payRow.id,
        amount: amt,
        date: payDate,
        remarks: payRemarks.trim() || undefined,
      });
      setSuccessMsg(res.message || 'Payment successfully updated.');
      setPayRow(null);
      setPayAmount('');
      setPayRemarks('');
      fetchPayments();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to update payment.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPayments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return payments;
    return payments.filter((p) => {
      const sites = (p.site_details || []).map((s) => s.f_farmer_name || '').join(' ');
      const hay = [p.id, p.vendor_name, p.amount, p.remarks, sites].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [payments, searchQuery]);

  const pagination = usePagination(filteredPayments, { initialPageSize: 50 });

  const exportCols = useMemo<ExportColumn<UpKusumCPaymentRecord>[]>(
    () => [
      { header: 'S.No.', accessor: ((_r: UpKusumCPaymentRecord, idx?: number) => (idx !== undefined ? idx + 1 : '')) as any },
      { header: 'Date', accessor: (r) => fmtDate(r.date) },
      { header: 'Vendor', accessor: (r) => r.vendor_name || `Vendor #${r.vendor_id}` },
      { header: 'Sites', accessor: (r) => (r.site_details || []).length },
      { header: 'Amount', accessor: (r) => r.amount },
      { header: 'Remarks', accessor: (r) => r.remarks || DASH },
      { header: 'Pay Amount', accessor: (r) => getPaidAndBalance(r).totalPaid },
      { header: 'Balance Amount', accessor: (r) => getPaidAndBalance(r).balance },
      { header: 'Pay Date', accessor: (r) => fmtDate(getPaidAndBalance(r).latest?.date) },
      { header: 'Pay Remarks', accessor: (r) => getPaidAndBalance(r).latest?.pay_remarks || DASH },
      {
        header: 'Pay Status',
        accessor: (r) =>
          Number(r.pay_status) === 1 ? 'Paid' : Number(r.pay_status) === 2 ? 'Partially' : 'Pending',
      },
    ],
    []
  );

  const stamp = new Date().toISOString().slice(0, 10);

  return (
    <div className="solar-erp-page">
      <style>{TABLE_PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      <PageHead
        title="View Kusum-C Installation Payment"
        subtitle="Manage approved UP Kusum C vendor payment disbursements, partial settlements, and payment history"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Uttar Pradesh', href: '/vendor-management/up' },
          { label: 'Kusum C', href: '/vendor-management/up/kusumc/installation/dashboard' },
          { label: 'Kusum-C Installation Payment' },
        ]}
      />

      <StatusFeedbackBanners
        errorMsg={errorMsg}
        successMsg={successMsg}
        onClearError={() => setErrorMsg('')}
        onClearSuccess={() => setSuccessMsg('')}
      />

      {/* 4 KPI Cards */}
      <div className="asw-cards-row">
        <KpiCard
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>}
          tone="accent"
          label="Payment Request"
          value={fmtNum(detail.total)}
          sub="Total approved claims"
        />
        <KpiCard
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>}
          tone="emerald"
          label="Payment Complete"
          value={fmtNum(detail.complete)}
          sub="Fully settled"
        />
        <KpiCard
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>}
          tone="cyan"
          label="Payment Partially"
          value={fmtNum(detail.partially)}
          sub="Partially disbursed"
        />
        <KpiCard
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>}
          tone="amber"
          label="Payment Pending"
          value={fmtNum(detail.pending)}
          sub="Awaiting settlement"
        />
      </div>

      {/* Filter Bar Card */}
      <form onSubmit={handleFilterSubmit} className="asw-filter-card">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#475569', marginBottom: 4 }}>From</label>
            <input type="date" className="ax-input ax-input--sm" value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={{ width: '100%' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#475569', marginBottom: 4 }}>To</label>
            <input type="date" className="ax-input ax-input--sm" value={toDate} onChange={(e) => setToDate(e.target.value)} style={{ width: '100%' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Select Vendor</label>
            <select className="ax-input ax-input--sm" value={selectedVendor} onChange={(e) => setSelectedVendor(e.target.value)} style={{ width: '100%' }}>
              <option value="">-- Select Vendor --</option>
              {vendors.map((v) => (
                <option key={v.id} value={String(v.id)}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Status</label>
            <select className="ax-input ax-input--sm" value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} style={{ width: '100%' }}>
              <option value="">-- Select Status --</option>
              <option value="0">Pending</option>
              <option value="1">Paid</option>
              <option value="2">Partially</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" className="ax-btn ax-btn--primary ax-btn--sm" style={{ flex: 1 }}>
              Apply Filter
            </button>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={handleResetFilters}>
              Reset
            </button>
          </div>
        </div>
      </form>

      <section className="ax-card ax-col--12">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">View Kusum-C Installation Payment</h2>
            <p className="ax-card__subtitle">Showing {filteredPayments.length} approved claim payment record(s)</p>
          </div>
          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search vendor, farmer, amount..." size="sm" />
              <TableExportToolbar
                onCopy={() => copyRowsToClipboard(filteredPayments, exportCols)}
                onExportCSV={() => exportRowsCSV(filteredPayments, exportCols, `UP_KusumC_Payments_${stamp}`)}
                onExportExcel={() => exportRowsExcel(filteredPayments, exportCols, `UP_KusumC_Payments_${stamp}`)}
                onExportPDF={() => exportRowsPDF(filteredPayments, exportCols, 'View Kusum-C Installation Payment')}
              />
            </div>
          </div>
        </div>

        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap', minWidth: 1350 }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th">S.No.</th>
                <th className="ax-table__th">Date</th>
                <th className="ax-table__th">Vendor</th>
                <th className="ax-table__th">Sites</th>
                <th className="ax-table__th">Invoice</th>
                <th className="ax-table__th">Amount</th>
                <th className="ax-table__th">Remarks</th>
                <th className="ax-table__th">Pay Amount</th>
                <th className="ax-table__th">Balance Amount</th>
                <th className="ax-table__th">Pay Date</th>
                <th className="ax-table__th">Pay Remarks</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Pay Status</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={13} style={centerCell}>
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading payments...
                  </td>
                </tr>
              ) : pagination.paged.length === 0 ? (
                <tr>
                  <td colSpan={13} style={centerCell}>
                    <TableEmptyState title="No data available in table" description="No approved payment claims match your filters." />
                  </td>
                </tr>
              ) : (
                pagination.paged.map((row, idx) => {
                  const globalIdx = (pagination.curPage - 1) * pagination.pageSize + idx + 1;
                  const { claimAmt, totalPaid, balance, latest } = getPaidAndBalance(row);
                  const st = Number(row.pay_status ?? 0);

                  return (
                    <tr key={row.id}>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{globalIdx}</td>
                      <td className="ax-table__td">{fmtDate(row.date)}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600 }}>{row.vendor_name || `Vendor #${row.vendor_id}`}</td>
                      <td className="ax-table__td">
                        <button
                          type="button"
                          onClick={() => setHistoryRow(row)}
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
                          {(row.site_details || []).length} Site(s) ↗
                        </button>
                      </td>
                      <td className="ax-table__td">
                        <MediaFileThumbnail
                          url={row.file ? resolveUpMediaUrl(row.file, 'kusumc') : null}
                          alt={`Invoice #${row.id}`}
                          onClick={(url, title) => setLightbox({ url, title })}
                        />
                      </td>
                      <td className="ax-table__td" style={{ fontWeight: 700 }}>{fmtCurrency(claimAmt)}</td>
                      <td className="ax-table__td" style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {row.remarks || DASH}
                      </td>
                      <td className="ax-table__td" style={{ fontWeight: 700, color: '#16a34a' }}>{fmtCurrency(totalPaid)}</td>
                      <td className="ax-table__td" style={{ fontWeight: 700, color: balance > 0 ? '#d97706' : '#64748b' }}>
                        {fmtCurrency(balance)}
                      </td>
                      <td className="ax-table__td">{fmtDate(latest?.date)}</td>
                      <td className="ax-table__td" style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {latest?.pay_remarks || latest?.remarks || DASH}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {st === 1 ? (
                          <span className="ax-badge ax-badge--soft ax-badge--success">Paid</span>
                        ) : st === 2 ? (
                          <span className="ax-badge ax-badge--soft ax-badge--info">Partially</span>
                        ) : (
                          <span className="ax-badge ax-badge--soft ax-badge--warning">Pending</span>
                        )}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button type="button" className="ax-btn ax-btn--secondary ax-btn--xs" onClick={() => setHistoryRow(row)}>
                            History
                          </button>
                          {st !== 1 && balance > 0 && (
                            <button
                              type="button"
                              className="ax-btn ax-btn--primary ax-btn--xs"
                              onClick={() => {
                                setPayRow(row);
                                setPayAmount(String(balance));
                                setPayDate(new Date().toISOString().slice(0, 10));
                                setPayRemarks('');
                              }}
                            >
                              Update Pay
                            </button>
                          )}
                        </div>
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

      {/* Update Payment Modal (Endpoint #17) */}
      <Modal
        open={Boolean(payRow)}
        onClose={() => setPayRow(null)}
        title="Record Kusum-C Installation Payment"
        subtitle={
          payRow
            ? `Claim #${payRow.id} • ${payRow.vendor_name || ''} • Remaining Balance: ${fmtCurrency(getPaidAndBalance(payRow).balance)}`
            : ''
        }
        maxWidth={480}
      >
        <form onSubmit={handleUpdatePayment} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
              Payment Amount (₹) <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={payRow ? getPaidAndBalance(payRow).balance : undefined}
              className="ax-input"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              style={{ width: '100%' }}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
              Payment Date <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="date"
              className="ax-input"
              value={payDate}
              onChange={(e) => setPayDate(e.target.value)}
              style={{ width: '100%' }}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Payment Remarks / UTR</label>
            <textarea
              className="ax-input"
              rows={3}
              value={payRemarks}
              onChange={(e) => setPayRemarks(e.target.value)}
              placeholder="UTR number, NEFT reference, or payment notes..."
              style={{ width: '100%', padding: 10 }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setPayRow(null)}>
              Cancel
            </button>
            <button type="submit" className="ax-btn ax-btn--primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Submit Payment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Payment History & Sites Modal */}
      <Modal
        open={Boolean(historyRow)}
        onClose={() => setHistoryRow(null)}
        title={`Claim #${historyRow?.id} — Payment Ledger & Sites`}
        subtitle={historyRow ? `Vendor: ${historyRow.vendor_name || ''} • Claim Amount: ${fmtCurrency(historyRow.amount)}` : ''}
        maxWidth={740}
        footer={
          <button type="button" className="ax-btn ax-btn--primary" onClick={() => setHistoryRow(null)}>
            Close
          </button>
        }
      >
        {historyRow && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <h4 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700 }}>Disbursement Installments</h4>
              <table className="ax-table" style={{ width: '100%', fontSize: 12 }}>
                <thead>
                  <tr>
                    <th className="ax-table__th">#</th>
                    <th className="ax-table__th">Date</th>
                    <th className="ax-table__th">Paid Amount</th>
                    <th className="ax-table__th">Balance</th>
                    <th className="ax-table__th">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {(historyRow.allpayment || []).length > 0 ? (
                    (historyRow.allpayment || []).map((p, i) => (
                      <tr key={p.id || i}>
                        <td className="ax-table__td">{i + 1}</td>
                        <td className="ax-table__td">{fmtDate(p.date)}</td>
                        <td className="ax-table__td" style={{ fontWeight: 700, color: '#16a34a' }}>{fmtCurrency(p.amount)}</td>
                        <td className="ax-table__td">{fmtCurrency(p.balance)}</td>
                        <td className="ax-table__td">{p.pay_remarks || p.remarks || DASH}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: 14, color: '#64748b' }}>
                        No payments recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div>
              <h4 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700 }}>
                Included Sites ({(historyRow.site_details || []).length})
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {(historyRow.site_details || []).map((s) => (
                  <span key={s.id} style={{ padding: '4px 10px', borderRadius: 6, background: '#f1f5f9', fontSize: 12, fontWeight: 600 }}>
                    #{s.id} — {s.f_farmer_name || DASH}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <MediaLightbox url={lightbox?.url || null} title={lightbox?.title} onClose={() => setLightbox(null)} />
    </div>
  );
}

export default UPKusumCViewPayment;
