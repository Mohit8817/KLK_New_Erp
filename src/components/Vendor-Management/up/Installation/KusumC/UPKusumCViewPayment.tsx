import { useState, useMemo } from 'react';
import { PageHead } from '../../../../shell/PageHead';
import {
  INITIAL_PAYMENT_DATA,
  UP_KUSUM_C_VENDORS,
  type UPKusumCPaymentRecord,
} from './upKusumCTypes';

export function UPKusumCViewPayment() {
  const [payments, setPayments] = useState<UPKusumCPaymentRecord[]>(INITIAL_PAYMENT_DATA);

  // Filter form states (matching specification)
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [filterVendor, setFilterVendor] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  // Table search & pagination
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Pay Modal State
  const [activePaymentModal, setActivePaymentModal] = useState<UPKusumCPaymentRecord | null>(null);
  const [inputPayAmount, setInputPayAmount] = useState<number>(0);
  const [inputPayDate, setInputPayDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [inputPayRemarks, setInputPayRemarks] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // KPI Calculations
  const paymentRequestCount = payments.length;
  const paymentCompleteCount = payments.filter((p) => p.pay_status === 'Paid').length;
  const paymentPartiallyCount = payments.filter((p) => p.pay_status === 'Partially Paid').length;
  const paymentPendingCount = payments.filter((p) => p.pay_status === 'Pending').length;

  // Filter logic
  const filteredPayments = useMemo(() => {
    return payments.filter((item) => {
      // Date filters
      if (fromDate && item.date < fromDate) return false;
      if (toDate && item.date > toDate) return false;

      // Dropdown filters
      if (filterVendor && item.vendor !== filterVendor) return false;
      if (filterStatus && item.pay_status !== filterStatus) return false;

      // Table search term
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matches =
          item.vendor.toLowerCase().includes(q) ||
          item.sites.toLowerCase().includes(q) ||
          item.invoice.toLowerCase().includes(q) ||
          item.remarks.toLowerCase().includes(q) ||
          (item.pay_remarks || '').toLowerCase().includes(q) ||
          String(item.amount).includes(q) ||
          String(item.pay_amount).includes(q) ||
          String(item.balance_amount).includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [payments, fromDate, toDate, filterVendor, filterStatus, searchTerm]);

  const totalItems = filteredPayments.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const pagedPayments = filteredPayments.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleResetFilters = () => {
    setFromDate('');
    setToDate('');
    setFilterVendor('');
    setFilterStatus('');
    setSearchTerm('');
    setCurrentPage(1);
  };

  const handleOpenPayModal = (item: UPKusumCPaymentRecord) => {
    setActivePaymentModal(item);
    setInputPayAmount(item.balance_amount);
    setInputPayDate(new Date().toISOString().slice(0, 10));
    setInputPayRemarks('');
  };

  const handleConfirmPayment = () => {
    if (!activePaymentModal) return;
    setIsProcessing(true);

    setTimeout(() => {
      const addedPay = Number(inputPayAmount) || 0;
      const newPaid = activePaymentModal.pay_amount + addedPay;
      const newBal = Math.max(0, activePaymentModal.amount - newPaid);
      const newStatus: 'Paid' | 'Partially Paid' | 'Pending' =
        newBal === 0 ? 'Paid' : newPaid > 0 ? 'Partially Paid' : 'Pending';

      setPayments((prev) =>
        prev.map((p) =>
          p.id === activePaymentModal.id
            ? {
                ...p,
                pay_amount: newPaid,
                balance_amount: newBal,
                pay_date: inputPayDate,
                pay_remarks: inputPayRemarks || `Disbursed ₹ ${addedPay.toLocaleString('en-IN')}`,
                pay_status: newStatus,
              }
            : p
        )
      );

      setIsProcessing(false);
      setToastMsg(`Payment of ₹ ${addedPay.toLocaleString('en-IN')} recorded for ${activePaymentModal.vendor}!`);
      setActivePaymentModal(null);
      setTimeout(() => setToastMsg(null), 3000);
    }, 500);
  };

  const handleExportCSV = () => {
    const headers = [
      'S.No.',
      'Date',
      'Vendor',
      'Sites',
      'Invoice',
      'Amount',
      'Remarks',
      'Pay Amount',
      'Balance Amount',
      'Pay Date',
      'Pay Remarks',
      'Pay Status',
    ];

    const rows = filteredPayments.map((item, idx) => [
      idx + 1,
      `"${item.date}"`,
      `"${item.vendor}"`,
      `"${item.sites}"`,
      `"${item.invoice}"`,
      item.amount,
      `"${item.remarks}"`,
      item.pay_amount,
      item.balance_amount,
      `"${item.pay_date || ''}"`,
      `"${item.pay_remarks || ''}"`,
      `"${item.pay_status}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `UP_Kusum_C_Payments_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="ax-page" style={{ maxWidth: 1400, margin: '0 auto', paddingBottom: 40 }}>
      {/* Page Head */}
      <PageHead
        title="View Kusum-C Installation Payment"
        subtitle="Track vendor installation disbursements, process payments, and verify balance dues for UP Kusum C sites"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Uttar Pradesh', href: '/vendor-management/up' },
          { label: 'Kusum C', href: '/vendor-management/up/kusumc/installation/dashboard' },
          { label: 'Kusum-C Installation Payment' },
        ]}
      />

      {/* Toast Notification */}
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

      {/* KPI Stat Cards (Matching Specification) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div className="ax-card" style={{ padding: '16px 20px', borderLeft: '4px solid #3b82f6', background: '#ffffff' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
            Payment Request
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#1e293b', marginTop: 4 }}>
            {paymentRequestCount}
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Invoices submitted</div>
        </div>

        <div className="ax-card" style={{ padding: '16px 20px', borderLeft: '4px solid #10b981', background: '#ffffff' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
            Payment Complete
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#10b981', marginTop: 4 }}>
            {paymentCompleteCount}
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Fully disbursed</div>
        </div>

        <div className="ax-card" style={{ padding: '16px 20px', borderLeft: '4px solid #f59e0b', background: '#ffffff' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
            Payment Partially
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#f59e0b', marginTop: 4 }}>
            {paymentPartiallyCount}
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Partially paid tranches</div>
        </div>

        <div className="ax-card" style={{ padding: '16px 20px', borderLeft: '4px solid #ef4444', background: '#ffffff' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
            Payment Pending
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#ef4444', marginTop: 4 }}>
            {paymentPendingCount}
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Awaiting disbursement</div>
        </div>
      </div>

      {/* Filter Card (Matching Specification: Kusum-C Installation Payment Filter) */}
      <div className="ax-card" style={{ padding: '18px 20px', marginBottom: 20, background: '#ffffff' }}>
        <h4 style={{ margin: '0 0 14px 0', fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
          Kusum-C Installation Payment
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
          {/* From Date */}
          <div>
            <label htmlFor="filter-from-date" style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>
              From
            </label>
            <input
              id="filter-from-date"
              type="date"
              className="ax-form-input"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="dd-mm-yyyy"
              style={{ width: '100%', padding: '7px 10px', fontSize: 13, borderRadius: 6, border: '1px solid #cbd5e1' }}
            />
          </div>

          {/* To Date */}
          <div>
            <label htmlFor="filter-to-date" style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>
              To
            </label>
            <input
              id="filter-to-date"
              type="date"
              className="ax-form-input"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="dd-mm-yyyy"
              style={{ width: '100%', padding: '7px 10px', fontSize: 13, borderRadius: 6, border: '1px solid #cbd5e1' }}
            />
          </div>

          {/* Select Vendor */}
          <div>
            <label htmlFor="filter-vendor-select" style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>
              Select Vendor
            </label>
            <select
              id="filter-vendor-select"
              className="ax-form-input"
              value={filterVendor}
              onChange={(e) => {
                setFilterVendor(e.target.value);
                setCurrentPage(1);
              }}
              style={{ width: '100%', padding: '7px 10px', fontSize: 13, borderRadius: 6, border: '1px solid #cbd5e1' }}
            >
              <option value="">-- Select Vendor --</option>
              {UP_KUSUM_C_VENDORS.map((v) => (
                <option key={v.id} value={v.name}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          {/* Select Status */}
          <div>
            <label htmlFor="filter-status-select" style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>
              Status
            </label>
            <select
              id="filter-status-select"
              className="ax-form-input"
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              style={{ width: '100%', padding: '7px 10px', fontSize: 13, borderRadius: 6, border: '1px solid #cbd5e1' }}
            >
              <option value="">-- Select Status --</option>
              <option value="Paid">Paid</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        </div>

        {(fromDate || toDate || filterVendor || filterStatus) && (
          <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="ax-btn ax-btn--ghost ax-btn--sm"
              onClick={handleResetFilters}
              style={{ color: '#ef4444' }}
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Main Table Card (Matching Specification: View Kusum-C Installation Payment) */}
      <div className="ax-card" style={{ overflow: 'hidden' }}>
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
            View Kusum-C Installation Payment
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

        {/* Search Input Bar */}
        <div
          style={{
            padding: '12px 20px',
            borderBottom: '1px solid var(--ax-border, #e2e8f0)',
            background: '#ffffff',
          }}
        >
          <div style={{ maxWidth: 360 }}>
            <input
              type="text"
              className="ax-form-input"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search: Vendor, invoice, sites, amount..."
              style={{
                width: '100%',
                padding: '7px 12px',
                fontSize: 13,
                borderRadius: 6,
                border: '1px solid #cbd5e1',
              }}
            />
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="ax-table ax-table--hover" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <tr>
                <th style={{ padding: '10px 10px', textAlign: 'center', width: 50, fontWeight: 600, color: '#475569' }}>S.No.</th>
                <th style={{ padding: '10px 10px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Date</th>
                <th style={{ padding: '10px 10px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Vendor</th>
                <th style={{ padding: '10px 10px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Sites</th>
                <th style={{ padding: '10px 10px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Invoice</th>
                <th style={{ padding: '10px 10px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Amount</th>
                <th style={{ padding: '10px 10px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Remarks</th>
                <th style={{ padding: '10px 10px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Pay Amount</th>
                <th style={{ padding: '10px 10px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Balance Amount</th>
                <th style={{ padding: '10px 10px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Pay Date</th>
                <th style={{ padding: '10px 10px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Pay Remarks</th>
                <th style={{ padding: '10px 10px', textAlign: 'center', fontWeight: 600, color: '#475569' }}>Pay Status</th>
                <th style={{ padding: '10px 10px', textAlign: 'center', fontWeight: 600, color: '#475569' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {pagedPayments.length === 0 ? (
                <tr>
                  <td colSpan={13} style={{ textAlign: 'center', padding: '36px 20px', color: '#64748b' }}>
                    No data available in table
                  </td>
                </tr>
              ) : (
                pagedPayments.map((item, idx) => {
                  const sNo = (currentPage - 1) * pageSize + idx + 1;
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 10px', textAlign: 'center', color: '#64748b' }}>{sNo}</td>
                      <td style={{ padding: '10px 10px', color: '#334155' }}>{item.date}</td>
                      <td style={{ padding: '10px 10px', fontWeight: 600, color: '#0f172a' }}>{item.vendor}</td>
                      <td style={{ padding: '10px 10px', color: '#334155' }}>{item.sites}</td>
                      <td style={{ padding: '10px 10px', fontFamily: 'monospace', color: '#2563eb', fontWeight: 600 }}>{item.invoice}</td>
                      <td style={{ padding: '10px 10px', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                        ₹ {item.amount.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '10px 10px', color: '#64748b', maxWidth: 140, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.remarks}
                      </td>
                      <td style={{ padding: '10px 10px', textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>
                        ₹ {item.pay_amount.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '10px 10px', textAlign: 'right', fontWeight: 700, color: item.balance_amount > 0 ? '#dc2626' : '#64748b' }}>
                        ₹ {item.balance_amount.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '10px 10px', color: '#334155' }}>{item.pay_date || '—'}</td>
                      <td style={{ padding: '10px 10px', color: '#64748b', maxWidth: 140, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.pay_remarks || '—'}
                      </td>
                      <td style={{ padding: '10px 10px', textAlign: 'center' }}>
                        <span
                          className={`ax-badge ${
                            item.pay_status === 'Paid'
                              ? 'ax-badge--soft ax-badge--success'
                              : item.pay_status === 'Partially Paid'
                              ? 'ax-badge--soft ax-badge--warning'
                              : 'ax-badge--soft ax-badge--danger'
                          }`}
                          style={{ fontWeight: 600, fontSize: 11, padding: '3px 8px' }}
                        >
                          {item.pay_status}
                        </span>
                      </td>
                      <td style={{ padding: '10px 10px', textAlign: 'center' }}>
                        {item.pay_status !== 'Paid' ? (
                          <button
                            type="button"
                            className="ax-btn ax-btn--primary ax-btn--sm"
                            onClick={() => handleOpenPayModal(item)}
                            style={{ fontSize: 11, padding: '3px 8px', fontWeight: 600 }}
                          >
                            Pay
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
                            title="Payment Completed & Locked"
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

      {/* ── Process Payment Modal ── */}
      {activePaymentModal && (
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
          onClick={() => setActivePaymentModal(null)}
        >
          <div
            className="ax-card"
            style={{
              width: '100%',
              maxWidth: 520,
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
                  Disburse Payment
                </h3>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                  Vendor: <strong>{activePaymentModal.vendor}</strong> · Invoice: <strong>{activePaymentModal.invoice}</strong>
                </div>
              </div>
              <button
                type="button"
                className="ax-btn ax-btn--ghost ax-btn--sm"
                onClick={() => setActivePaymentModal(null)}
                style={{ fontSize: 18, lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: 20 }}>
              <div
                style={{
                  padding: 12,
                  background: '#f8fafc',
                  borderRadius: 8,
                  marginBottom: 16,
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 8,
                  fontSize: 12.5,
                }}
              >
                <div>
                  <span style={{ color: '#64748b' }}>Total Invoice:</span>{' '}
                  <strong>₹ {activePaymentModal.amount.toLocaleString('en-IN')}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Already Paid:</span>{' '}
                  <strong style={{ color: '#16a34a' }}>₹ {activePaymentModal.pay_amount.toLocaleString('en-IN')}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Current Balance:</span>{' '}
                  <strong style={{ color: '#dc2626' }}>₹ {activePaymentModal.balance_amount.toLocaleString('en-IN')}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Sites:</span> <strong>{activePaymentModal.sites}</strong>
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label htmlFor="inputPayAmountField" style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 5 }}>
                  Disbursement Amount (₹) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  id="inputPayAmountField"
                  type="number"
                  className="ax-form-input"
                  value={inputPayAmount}
                  max={activePaymentModal.balance_amount}
                  onChange={(e) => setInputPayAmount(Math.min(activePaymentModal.balance_amount, Number(e.target.value)))}
                  style={{ width: '100%', padding: '8px 12px', fontSize: 13, borderRadius: 6, border: '1px solid #cbd5e1', fontWeight: 600 }}
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label htmlFor="inputPayDateField" style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 5 }}>
                  Payment Date <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  id="inputPayDateField"
                  type="date"
                  className="ax-form-input"
                  value={inputPayDate}
                  onChange={(e) => setInputPayDate(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', fontSize: 13, borderRadius: 6, border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ marginBottom: 10 }}>
                <label htmlFor="inputPayRemarksField" style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 5 }}>
                  Payment Remarks (UTR / Cheque / Bank Details)
                </label>
                <textarea
                  id="inputPayRemarksField"
                  className="ax-form-input"
                  rows={2}
                  value={inputPayRemarks}
                  onChange={(e) => setInputPayRemarks(e.target.value)}
                  placeholder="e.g. Disbursed via RTGS UTR# HDFC0098231"
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
                onClick={() => setActivePaymentModal(null)}
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                type="button"
                className="ax-btn ax-btn--primary"
                onClick={handleConfirmPayment}
                disabled={isProcessing || inputPayAmount <= 0}
                style={{ minWidth: 140, fontWeight: 700 }}
              >
                {isProcessing ? 'Processing...' : 'Record Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer copyright */}
    </div>
  );
}

export default UPKusumCViewPayment;
