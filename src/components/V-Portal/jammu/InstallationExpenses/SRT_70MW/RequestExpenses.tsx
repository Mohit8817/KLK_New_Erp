import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  jammuExpenseService,
  type JammuExpenseSiteItem,
} from '../../jammu-services';

/* ───────── Form Page CSS (matching Karnataka / Jammu Single Card Form) ───────── */
const FORM_PAGE_CSS = `
  .solar-erp-page {
    --asw-primary: #2563eb;
    --asw-primary-rgb: 37, 99, 235;
  }
  .solar-erp-page .ax-card { min-width: 0; }
  .solar-erp-page .ax-card__footer { width: 100%; box-sizing: border-box; }

  /* Floating label core */
  .ax-float { position: relative; width: 100%; }
  .ax-float__input {
    width: 100%;
    height: 46px;
    padding: 12px 14px 4px 14px;
    font-size: var(--ax-text-sm, 13.5px);
    background: var(--ax-surface-solid, #ffffff);
    border: 1px solid var(--ax-border, #cbd5e1);
    border-radius: var(--ax-radius-md, 8px);
    color: var(--ax-text, #1e293b);
    outline: none;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }
  .ax-float__input::placeholder { color: transparent; }
  .ax-float__input:focus {
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
  }
  .ax-float__label {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    font-size: var(--ax-text-sm, 13px);
    color: var(--ax-text-muted, #64748b);
    pointer-events: none;
    transition: all 0.15s ease;
    background: transparent;
    padding: 0 2px;
  }
  .ax-float__input:focus ~ .ax-float__label,
  .ax-float__input:not(:placeholder-shown) ~ .ax-float__label {
    top: 6px;
    transform: translateY(0);
    font-size: 10.5px;
    font-weight: 600;
    color: #2563eb;
  }

  .file-dropzone-box {
    border: 2px dashed var(--ax-border, #cbd5e1);
    border-radius: var(--ax-radius-md, 8px);
    padding: 16px;
    text-align: center;
    background: var(--ax-surface-subtle, #f8fafc);
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    min-height: 120px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
  .file-dropzone-box:hover {
    border-color: #2563eb;
    background: #f0f7ff;
  }
  .file-dropzone-box.has-file {
    border-color: #10b981;
    background: #ecfdf5;
  }
`;

const PREDEFINED_PURPOSES = [
  'Material Transportation & Freight',
  'Crane / Roof Lifting & Rigging Charges',
  'Civil Foundation & Grouting Works',
  'Site Labor & Mounting Expenses',
  'Electrical Cabling & Conduit Laying',
  'Local Discom Liaisoning & Net Metering',
  'Safety Equipment & PPE Incidentals',
  'Emergency Site Repairs / Contingency',
];

export function RequestExpenses() {
  const navigate = useNavigate();

  const [sites, setSites] = useState<JammuExpenseSiteItem[]>([]);
  const [loadingSites, setLoadingSites] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form state
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [purpose, setPurpose] = useState<string>('');
  const [customPurpose, setCustomPurpose] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [remarks, setRemarks] = useState<string>('');

  // Notifications
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Load sites from API 16 (GET /jammu/installation-expenses-create)
  useEffect(() => {
    let isMounted = true;
    async function fetchSites() {
      setLoadingSites(true);
      try {
        const data = await jammuExpenseService.getExpenseSites();
        if (isMounted) {
          setSites(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Failed to load expense sites from API:', err);
        if (isMounted) setSites([]);
      } finally {
        if (isMounted) setLoadingSites(false);
      }
    }
    fetchSites();
    return () => { isMounted = false; };
  }, []);

  const handleReset = () => {
    setSelectedSiteId('');
    setPurpose('');
    setCustomPurpose('');
    setAmount('');
    setReceiptFile(null);
    setRemarks('');
    setNotification(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedSiteId) {
      setNotification({ type: 'error', message: 'Please select an installation site for this expense claim.' });
      return;
    }

    const finalPurpose = purpose === 'Other' ? customPurpose.trim() : purpose.trim();
    if (!finalPurpose) {
      setNotification({ type: 'error', message: 'Please specify the expense purpose / head.' });
      return;
    }

    if (!amount || Number(amount) <= 0) {
      setNotification({ type: 'error', message: 'Please enter a valid expense amount in INR.' });
      return;
    }

    setSubmitting(true);
    setNotification(null);

    try {
      const fd = new FormData();
      fd.append('site_id', selectedSiteId);
      fd.append('purpose', finalPurpose);
      fd.append('amount', amount);
      if (remarks) fd.append('remarks', remarks);
      if (receiptFile) fd.append('file', receiptFile);

      const res = await jammuExpenseService.storeExpenseClaim(fd);

      if (res?.success) {
        setNotification({
          type: 'success',
          message: 'Installation expense requisition submitted successfully! Routing to accounts approval.',
        });
        setTimeout(() => {
          handleReset();
          navigate('/v/jammu/installation-expenses/srt-70mw/view-expenses');
        }, 1500);
      } else {
        setNotification({
          type: 'error',
          message: res?.message || 'Failed to submit expense request. Please check inputs and try again.',
        });
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Error communicating with expense management server.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ax-page solar-erp-page">
      <style>{FORM_PAGE_CSS}</style>

      <PageHead
        title="Jammu SRT 70MW - Request Expenses"
        subtitle="Submit field expense requisitions, mobilization vouchers, transport receipts, and local labor claims"
        breadcrumbs={[
          { label: 'Jammu & Kashmir' },
          { label: 'Installation Expenses' },
          { label: 'SRT 70MW' },
          { label: 'Request Expenses' },
        ]}
      />

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

      {/* Main Single Card Form */}
      <form onSubmit={handleSubmit}>
        <div className="ax-card">
          <div className="ax-card__header" style={{ padding: '20px 24px', borderBottom: '1px solid var(--ax-border-subtle, #f1f5f9)', background: 'var(--ax-surface-subtle, #f8fafc)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 className="ax-card__title" style={{ fontSize: '17px', fontWeight: 700, margin: 0 }}>
                Installation Field Expense Requisition
              </h3>
              <p className="ax-card__subtitle" style={{ fontSize: '12.5px', color: '#64748b', margin: '4px 0 0 0' }}>
                Reimbursement claims for freight, local shifting, specialized civil work, and project incidentals
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Link to="/v/jammu/installation-expenses/srt-70mw/view-expenses" className="ax-btn ax-btn--secondary ax-btn--sm">
                View Claims Ledger
              </Link>
              <Link to="/v/jammu/installation-expenses/srt-70mw/view-payments" className="ax-btn ax-btn--secondary ax-btn--sm">
                Disbursal Status
              </Link>
            </div>
          </div>

          <div className="ax-card__body" style={{ padding: '24px' }}>
            {/* Site Selection */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
                Select Project Site *
              </label>
              <div className="ax-float">
                <select
                  className="ax-float__input"
                  style={{ paddingTop: '10px' }}
                  value={selectedSiteId}
                  onChange={(e) => setSelectedSiteId(e.target.value)}
                  disabled={loadingSites}
                  required
                >
                  <option value="">-- Choose Site for Expense Allocation --</option>
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.site_name} {s.site_code ? `[${s.site_code}]` : ''} {s.district ? `(${s.district})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Purpose & Amount */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
                  Expense Purpose / Head *
                </label>
                <div className="ax-float">
                  <select
                    className="ax-float__input"
                    style={{ paddingTop: '10px' }}
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    required
                  >
                    <option value="">-- Select Expense Purpose --</option>
                    {PREDEFINED_PURPOSES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                    <option value="Other">Other / Custom Head</option>
                  </select>
                </div>

                {purpose === 'Other' && (
                  <div className="ax-float" style={{ marginTop: '12px' }}>
                    <input
                      type="text"
                      className="ax-float__input"
                      placeholder=" "
                      value={customPurpose}
                      onChange={(e) => setCustomPurpose(e.target.value)}
                      required
                    />
                    <label className="ax-float__label">Specify Custom Expense Head *</label>
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
                  Requisition Amount (INR ₹) *
                </label>
                <div className="ax-float">
                  <input
                    type="number"
                    className="ax-float__input"
                    placeholder=" "
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="1"
                    required
                  />
                  <label className="ax-float__label">Amount in INR (e.g. 15000)</label>
                </div>
              </div>
            </div>

            {/* Supporting Voucher / Bill Upload */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
                Supporting Bill / Payment Receipt / Voucher (PDF or Image)
              </label>
              <label className={`file-dropzone-box ${receiptFile ? 'has-file' : ''}`}>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                />
                <div style={{ fontSize: '28px', marginBottom: '6px' }}>🧾</div>
                {receiptFile ? (
                  <>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#059669' }}>
                      ✓ {receiptFile.name} ({(receiptFile.size / 1024).toFixed(1)} KB)
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Click to replace file</span>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#2563eb' }}>
                      Click or drag receipt voucher here
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                      Supports PDF, PNG, JPG up to 10MB
                    </span>
                  </>
                )}
              </label>
            </div>

            {/* Field Remarks */}
            <div style={{ marginBottom: '28px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
                Detailed Field Remarks / Justification
              </label>
              <div className="ax-float">
                <textarea
                  className="ax-float__input"
                  style={{ height: '80px', paddingTop: '16px' }}
                  placeholder=" "
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
                <label className="ax-float__label">Enter justification details, vendor name, or invoice reference...</label>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
              <button
                type="button"
                className="ax-btn ax-btn--secondary"
                onClick={handleReset}
                disabled={submitting}
              >
                Reset
              </button>
              <button
                type="submit"
                className="ax-btn ax-btn--primary"
                disabled={submitting}
                style={{ minWidth: '180px' }}
              >
                {submitting ? 'Submitting Requisition...' : '✓ Submit Expense Claim'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default RequestExpenses;
