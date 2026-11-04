import { useState, useEffect, useRef, useMemo, type FormEvent, type ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  jammuExpenseService,
  type JammuExpenseSiteItem,
} from '../../jammu-services';

/* ───────── Single Card Layout matching Jammu InstallSites pattern ───────── */
const FORM_PAGE_CSS = `
  .solar-erp-page {
    --asw-primary: #2563eb;
    --asw-primary-rgb: 37, 99, 235;
  }
  .jammu-exp-form .ax-card {
    border: 1px solid var(--ax-border, #e2e8f0);
    border-radius: var(--ax-radius-xl, 16px);
    background: var(--ax-surface-solid, #ffffff);
    box-shadow: var(--ax-shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.05));
    overflow: hidden;
  }
  .jammu-exp-form .ax-card__header {
    padding: var(--ax-space-5, 20px) var(--ax-space-6, 24px);
    border-bottom: 1px solid var(--ax-border-subtle, #f1f5f9);
    background: var(--ax-surface-subtle, #f8fafc);
    display: flex;
    flex-direction: column;
    gap: var(--ax-space-4, 16px);
  }
  .jammu-exp-form .ax-card__body { padding: var(--ax-space-6, 24px); }

  /* Quick Section Nav Pills */
  .swp-section-pills {
    display: flex;
    gap: var(--ax-space-2, 8px);
    overflow-x: auto;
    padding-bottom: 4px;
    scrollbar-width: thin;
  }
  .swp-section-pill-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: var(--ax-radius-pill, 9999px);
    font-size: var(--ax-text-xs, 12px);
    font-weight: 500;
    white-space: nowrap;
    background: var(--ax-surface-solid, #ffffff);
    border: 1px solid var(--ax-border, #cbd5e1);
    color: var(--ax-text, #0f172a);
    cursor: pointer;
    transition: all var(--ax-motion-fast, 0.15s) var(--ax-ease-standard, ease);
  }
  .swp-section-pill-btn:hover {
    border-color: #2563eb;
    color: #2563eb;
    background: color-mix(in srgb, #2563eb 6%, var(--ax-surface-solid, #ffffff));
  }
  .swp-section-pill-btn .pill-num {
    width: 18px; height: 18px; border-radius: 50%;
    background: var(--ax-surface-subtle, #f1f5f9);
    display: inline-flex; align-items: center; justify-content: center;
    font-size: 10px; font-weight: 700;
  }

  /* Section Block */
  .swp-section-block { padding-top: var(--ax-space-2, 8px); }
  .swp-section-header {
    display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap;
    gap: var(--ax-space-2, 8px);
    margin-bottom: var(--ax-space-5, 20px);
    padding-bottom: var(--ax-space-3, 12px);
    border-bottom: 1px solid var(--ax-border-subtle, #f1f5f9);
  }
  .swp-section-title-wrap { display: flex; flex-direction: column; gap: 4px; }
  .swp-section-divider {
    border: 0;
    border-top: 1px dashed var(--ax-border, #cbd5e1);
    margin: var(--ax-space-8, 32px) 0 var(--ax-space-6, 24px);
  }

  /* Floating Label Core */
  .ax-float { position: relative; width: 100%; }
  .ax-float__input {
    width: 100%;
    height: 46px;
    padding: 12px 14px 4px 14px;
    font-size: var(--ax-text-sm, 13.5px);
    background: var(--ax-surface-solid, #ffffff);
    border: 1px solid var(--ax-border, #cbd5e1);
    border-radius: var(--ax-radius-md, 8px);
    color: var(--ax-text, #0f172a);
    outline: none;
    transition: border-color var(--ax-motion-fast, 0.15s) var(--ax-ease-standard, ease),
                box-shadow var(--ax-motion-fast, 0.15s) var(--ax-ease-standard, ease);
  }
  .ax-float__input::placeholder { color: transparent; }
  .ax-float__input:focus::placeholder { color: #94a3b8; }
  .ax-float__input:focus {
    border-color: #2563eb;
    box-shadow: 0 0 0 3px color-mix(in srgb, #2563eb 20%, transparent);
  }
  .ax-float__input:disabled { opacity: .75; cursor: not-allowed; background: var(--ax-surface-subtle, #f8fafc); }

  .ax-float__label {
    position: absolute;
    inset-inline-start: 12px;
    top: 50%;
    transform: translateY(-50%);
    margin: 0;
    padding: 0 4px;
    font-size: var(--ax-text-sm, 13.5px);
    color: var(--ax-text-subtle, #64748b);
    background: var(--ax-surface-solid, #ffffff);
    border-radius: var(--ax-radius-xs, 4px);
    pointer-events: none;
    transition: top var(--ax-motion-fast, 0.15s) var(--ax-ease-standard, ease),
                font-size var(--ax-motion-fast, 0.15s) var(--ax-ease-standard, ease),
                color var(--ax-motion-fast, 0.15s) var(--ax-ease-standard, ease);
    z-index: 2;
    white-space: nowrap;
    max-width: calc(100% - 24px);
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .ax-float__label.floating {
    top: 0;
    font-size: 11px;
    font-weight: 500;
    color: #2563eb;
  }
  .ax-float__label.has-val:not(.floating) {
    top: 0;
    font-size: 11px;
    font-weight: 500;
    color: var(--ax-text-muted, #64748b);
  }

  /* Modern Dropzone */
  .ax-modern-field {
    display: flex; flex-direction: column; gap: 6px;
  }
  .ax-modern-label {
    display: flex; align-items: center; justify-content: space-between;
    font-size: 12px; font-weight: 600; color: var(--ax-text-strong, #1e293b);
    letter-spacing: 0.02em; margin: 0;
  }
  .ax-modern-req {
    color: #ef4444; font-weight: 700; margin-left: 3px;
  }
  .ax-modern-dropzone {
    border: 1.5px dashed var(--ax-border, #cbd5e1);
    border-radius: 10px; padding: 22px 16px;
    background: var(--ax-surface-subtle, #f8fafc);
    text-align: center; cursor: pointer; transition: all 0.2s ease;
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
  }
  .ax-modern-dropzone:hover {
    border-color: var(--ax-accent, #2563eb);
    background: color-mix(in srgb, var(--ax-accent, #2563eb) 5%, var(--ax-surface-subtle, #f8fafc));
  }
  .ax-modern-dropzone__icon {
    width: 44px; height: 44px; border-radius: 50%;
    background: color-mix(in srgb, var(--ax-accent, #2563eb) 10%, #ffffff);
    display: flex; align-items: center; justify-content: center;
  }
  .ax-modern-file-chip {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 16px; background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 10px;
  }
  .ax-modern-file-chip__icon {
    width: 34px; height: 34px; border-radius: 8px;
    background: #dcfce7; display: flex; align-items: center; justify-content: center;
  }
`;

interface FloatingInputProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  required?: boolean;
  disabled?: boolean;
  type?: string;
  placeholder?: string;
  min?: string | number;
  step?: string | number;
}

function FloatingInput({
  label,
  name,
  value,
  onChange,
  required,
  disabled,
  type = 'text',
  placeholder,
  min,
  step,
}: FloatingInputProps) {
  const [focused, setFocused] = useState(false);
  const hasVal = Boolean(value && String(value).length > 0);

  return (
    <div className="ax-float" style={{ flex: 1, minWidth: 0 }}>
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        required={required}
        disabled={disabled}
        placeholder={placeholder || label}
        min={min}
        step={step}
        className="ax-float__input"
      />
      <label htmlFor={name} className={`ax-float__label ${focused ? 'floating' : hasVal ? 'has-val' : ''}`}>
        {label} {required && <span style={{ color: 'var(--ax-danger, #ef4444)' }}>*</span>}
      </label>
    </div>
  );
}

const PREDEFINED_PURPOSES = [
  'Material Transportation & Freight',
  'Crane / Roof Lifting & Rigging Charges',
  'Civil Foundation & Grouting Works',
  'Site Labor & Mounting Expenses',
  'Electrical Cabling & Conduit Laying',
  'Local Discom Liaisoning & Net Metering',
  'Safety Equipment & PPE Incidentals',
  'Travel & Site Visit Expenses',
  'Lodging & Food Expenses',
  'Emergency Site Repairs / Contingency',
  'Other',
];

export function RequestExpenses() {
  const navigate = useNavigate();

  const [sites, setSites] = useState<JammuExpenseSiteItem[]>([]);
  const [loadingSites, setLoadingSites] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form states per API 17 specification
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [expenseDate, setExpenseDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [purpose, setPurpose] = useState<string>('');
  const [customPurpose, setCustomPurpose] = useState<string>('');
  const [claimAmount, setClaimAmount] = useState<string>('');
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [remarks, setRemarks] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Section references for quick navigation
  const sec1 = useRef<HTMLDivElement>(null);
  const sec2 = useRef<HTMLDivElement>(null);
  const sec3 = useRef<HTMLDivElement>(null);

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Feedback notifications
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  useEffect(() => {
    if (!toastMsg) return;
    const t = window.setTimeout(() => setToastMsg(null), 4000);
    return () => window.clearTimeout(t);
  }, [toastMsg]);

  // Load sites from API 16: GET /jammu/installation-expenses-create
  const fetchSites = async () => {
    setLoadingSites(true);
    try {
      const data = await jammuExpenseService.getExpenseSites();
      setSites(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('[Jammu SRT Expenses] fetch sites error:', err);
      setSites([]);
      setToastMsg({ type: 'danger', text: err?.message || 'Failed to load installation sites for expense claim.' });
    } finally {
      setLoadingSites(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, []);

  // Selected site object
  const selectedSite = useMemo(() => {
    return sites.find((s) => String(s.id) === String(selectedSiteId)) || null;
  }, [sites, selectedSiteId]);

  const handleReset = () => {
    setSelectedSiteId('');
    setExpenseDate(new Date().toISOString().slice(0, 10));
    setPurpose('');
    setCustomPurpose('');
    setClaimAmount('');
    setInvoiceFile(null);
    setRemarks('');
    setToastMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Form Submit Handler (API 17: POST /jammu/installation-expenses-store)
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setToastMsg(null);

    if (!selectedSiteId) {
      setToastMsg({ type: 'danger', text: 'Please select an assigned installation site.' });
      scrollTo(sec1);
      return;
    }

    const finalPurpose = purpose === 'Other' ? customPurpose.trim() : purpose.trim();
    if (!finalPurpose) {
      setToastMsg({ type: 'danger', text: 'Please specify the expense purpose / head.' });
      scrollTo(sec2);
      return;
    }

    const numAmt = Number(claimAmount);
    if (!claimAmount || isNaN(numAmt) || numAmt < 1) {
      setToastMsg({ type: 'danger', text: 'Please enter a valid claim amount in INR (minimum ₹ 1).' });
      scrollTo(sec2);
      return;
    }

    if (!invoiceFile) {
      setToastMsg({ type: 'danger', text: 'Please upload the supporting tax invoice / payment voucher receipt.' });
      scrollTo(sec3);
      return;
    }

    // Max 5120 KB check (5 MB)
    if (invoiceFile.size > 5120 * 1024) {
      setToastMsg({ type: 'danger', text: 'Claim invoice file size exceeds maximum limit of 5 MB (5120 KB).' });
      scrollTo(sec3);
      return;
    }

    setSubmitting(true);

    try {
      const fd = new FormData();
      // Required backend parameters per API 17
      fd.append('site_id', selectedSiteId);
      fd.append('project', 'srt70mw');
      fd.append('date', expenseDate);
      fd.append('claim_amount', String(numAmt));
      fd.append('amount', String(numAmt)); // Fail-safe alias
      fd.append('claim_invoice', invoiceFile);
      fd.append('file', invoiceFile); // Fail-safe alias
      fd.append('purpose', finalPurpose);

      if (remarks.trim()) {
        fd.append('remarks', remarks.trim());
      }

      const res = await jammuExpenseService.storeExpenseClaim(fd);

      setToastMsg({
        type: 'success',
        text: res.message || 'Installation expense claim submitted successfully! Forwarded for audit.',
      });

      setTimeout(() => {
        handleReset();
        navigate('/v/jammu/installation-expenses/srt-70mw/view-expenses');
      }, 1500);
    } catch (err: any) {
      console.error('[Jammu SRT Expense Claim] submit error:', err);
      setToastMsg({
        type: 'danger',
        text: err?.message || 'An error occurred while submitting the expense claim.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="solar-erp-page jammu-exp-form">
      <style>{FORM_PAGE_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="Jammu SRT 70MW - Request Expenses"
        subtitle="Submit vendor installation expense claims, site mobilization charges, freight invoices, and local civil work reimbursements"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Jammu & Kashmir' },
          { label: 'Installation Expenses' },
          { label: 'SRT 70MW' },
          { label: 'Request Expenses' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)' }}>
            <Link to="/v/jammu/installation-expenses/srt-70mw/view-expenses" className="ax-btn ax-btn--secondary ax-btn--sm">
              <span className="ax-btn__label">View Expenses</span>
            </Link>
            <Link to="/v/jammu/installation-expenses/srt-70mw/view-payments" className="ax-btn ax-btn--secondary ax-btn--sm">
              <span className="ax-btn__label">View Payments</span>
            </Link>
          </div>
        }
      />

      {toastMsg && (
        <div className={`ax-alert ax-alert--${toastMsg.type}`} style={{ marginBottom: 'var(--ax-space-4)' }} role="status">
          <div className="ax-alert__title">{toastMsg.type === 'success' ? 'Success' : 'Error'}</div>
          <div className="ax-alert__text">{toastMsg.text}</div>
        </div>
      )}

      {/* ── Main Form Card ── */}
      <form onSubmit={handleSubmit} className="ax-card">
        {/* Header with Section Pills */}
        <div className="ax-card__header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h2 className="ax-card__title" style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                Installation Expense Requisition Form
              </h2>
              <p className="ax-card__subtitle" style={{ fontSize: '0.85rem', color: 'var(--ax-text-muted, #64748b)', margin: '2px 0 0' }}>
                State: <b>Jammu & Kashmir</b> · Project: <b>SRT 70MW</b> · Type: <b>Installation</b>
              </p>
            </div>
            {selectedSite && (
              <span className="ax-badge ax-badge--soft ax-badge--info" style={{ fontWeight: 600 }}>
                {selectedSite.site_name} {selectedSite.site_code ? `[${selectedSite.site_code}]` : ''}
              </span>
            )}
          </div>

          {/* Quick Nav Pills */}
          <div className="swp-section-pills" role="navigation" aria-label="Quick section navigation">
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec1)}>
              <span className="pill-num">1</span> Site Selection
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec2)}>
              <span className="pill-num">2</span> Expense Details
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec3)}>
              <span className="pill-num">3</span> Voucher & Remarks
            </button>
          </div>
        </div>

        <div className="ax-card__body">
          {/* ════════ Section 1: Site Selection ════════ */}
          <div ref={sec1} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>1. Select Installation Site</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Choose from vendor's allocated sites under Jammu SRT 70MW for this expense requisition
                </span>
              </div>
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--sm"
                onClick={fetchSites}
                disabled={loadingSites}
                title="Refresh site list"
              >
                {loadingSites ? 'Refreshing...' : '🔄 Refresh Sites'}
              </button>
            </div>

            <div className="ax-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <div className="ax-float">
                <select
                  id="jammu-expense-site"
                  className="ax-float__input"
                  value={selectedSiteId}
                  onChange={(e) => setSelectedSiteId(e.target.value)}
                  disabled={loadingSites || submitting}
                  required
                >
                  <option value="">-- Choose Installed Site --</option>
                  {sites.map((s) => (
                    <option key={s.id} value={String(s.id)}>
                      {s.site_name} {s.site_code ? `[${s.site_code}]` : ''} {s.district ? `(${s.district})` : ''}
                    </option>
                  ))}
                </select>
                <label htmlFor="jammu-expense-site" className="ax-float__label floating">
                  Select Site <span style={{ color: 'var(--ax-danger, #ef4444)' }}>*</span>
                </label>
              </div>

              <FloatingInput
                label="State"
                name="state_display"
                value="Jammu & Kashmir"
                onChange={() => {}}
                disabled
              />

              <FloatingInput
                label="Project"
                name="project_display"
                value="SRT 70MW (srt70mw)"
                onChange={() => {}}
                disabled
              />
            </div>

            {selectedSite && (
              <div
                style={{
                  marginTop: 14,
                  padding: '12px 16px',
                  background: 'var(--ax-surface-subtle, #f8fafc)',
                  border: '1px solid var(--ax-border, #e2e8f0)',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 12,
                  fontSize: 13,
                }}
              >
                <div>
                  <span style={{ color: 'var(--ax-text-muted)', fontSize: 11, textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>Selected Site</span>
                  <b style={{ color: 'var(--ax-text-strong)' }}>{selectedSite.site_name}</b>
                  {selectedSite.site_code && (
                    <span style={{ marginLeft: 8, fontFamily: 'monospace', color: '#2563eb' }}>
                      ({selectedSite.site_code})
                    </span>
                  )}
                </div>
                {selectedSite.district && (
                  <div>
                    <span style={{ color: 'var(--ax-text-muted)', fontSize: 11, textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>District</span>
                    <b>{selectedSite.district}</b>
                  </div>
                )}
                {selectedSite.ca_no && (
                  <div>
                    <span style={{ color: 'var(--ax-text-muted)', fontSize: 11, textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>CA Number</span>
                    <b style={{ fontFamily: 'monospace' }}>{selectedSite.ca_no}</b>
                  </div>
                )}
              </div>
            )}
          </div>

          <hr className="swp-section-divider" />

          {/* ════════ Section 2: Expense Requisition Details ════════ */}
          <div ref={sec2} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>2. Expense Requisition Details</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Specify date, expenditure purpose head, and INR claim amount
                </span>
              </div>
            </div>

            <div className="ax-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              {/* Expense Date */}
              <div className="ax-float">
                <input
                  type="date"
                  id="expense_date"
                  name="expense_date"
                  className="ax-float__input"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  disabled={submitting}
                  required
                />
                <label htmlFor="expense_date" className="ax-float__label floating">
                  Date of Expense <span style={{ color: 'var(--ax-danger, #ef4444)' }}>*</span>
                </label>
              </div>

              {/* Expense Purpose / Head */}
              <div className="ax-float">
                <select
                  id="expense_purpose_select"
                  className="ax-float__input"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  disabled={submitting}
                  required
                >
                  <option value="">-- Select Purpose Head --</option>
                  {PREDEFINED_PURPOSES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <label htmlFor="expense_purpose_select" className="ax-float__label floating">
                  Expense Purpose / Head <span style={{ color: 'var(--ax-danger, #ef4444)' }}>*</span>
                </label>
              </div>

              {/* Claim Amount */}
              <FloatingInput
                label="Claim Amount (₹)"
                name="claim_amount"
                type="number"
                min="1"
                step="0.01"
                value={claimAmount}
                onChange={(e) => setClaimAmount(e.target.value)}
                placeholder="e.g. 15000"
                required
                disabled={submitting}
              />
            </div>

            {/* Custom Purpose input if 'Other' selected */}
            {purpose === 'Other' && (
              <div style={{ marginTop: 14 }}>
                <FloatingInput
                  label="Specify Custom Expense Purpose / Head"
                  name="custom_purpose"
                  value={customPurpose}
                  onChange={(e) => setCustomPurpose(e.target.value)}
                  placeholder="Enter details of custom expenditure head"
                  required
                  disabled={submitting}
                />
              </div>
            )}
          </div>

          <hr className="swp-section-divider" />

          {/* ════════ Section 3: Voucher / Tax Invoice Upload & Remarks ════════ */}
          <div ref={sec3} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>3. Supporting Invoice & Remarks</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Attach valid payment receipts, bills, or invoices and optional field notes
                </span>
              </div>
            </div>

            {/* Modern Invoice Upload Dropzone */}
            <div className="ax-modern-field" style={{ marginBottom: 18 }}>
              <label className="ax-modern-label">
                <span>Tax Invoice / Payment Voucher File</span>
                <span className="ax-modern-req">* (JPG, JPEG, PNG, PDF up to 5 MB)</span>
              </label>

              <input
                ref={fileInputRef}
                type="file"
                id="claim_invoice_file"
                accept=".pdf,image/jpeg,image/jpg,image/png"
                style={{ display: 'none' }}
                onChange={(e) => setInvoiceFile(e.target.files?.[0] || null)}
              />

              {!invoiceFile ? (
                <div
                  className="ax-modern-dropzone"
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                >
                  <div className="ax-modern-dropzone__icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 22, height: 22, color: '#2563eb' }}>
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong, #1e293b)' }}>
                      Click to upload verified tax invoice / receipt voucher
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--ax-text-muted, #64748b)', marginTop: 2 }}>
                      Supported formats: JPG, JPEG, PNG, PDF (Maximum 5120 KB)
                    </div>
                  </div>
                </div>
              ) : (
                <div className="ax-modern-file-chip">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <span className="ax-modern-file-chip__icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 18, height: 18, color: '#059669' }}>
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                      </svg>
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong, #1e293b)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {invoiceFile.name}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--ax-text-muted, #64748b)' }}>
                        {(invoiceFile.size / 1024).toFixed(1)} KB · Ready to upload
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="ax-btn ax-btn--ghost ax-btn--sm"
                    style={{ padding: '4px 8px', fontSize: 12, color: '#ef4444' }}
                    onClick={() => {
                      setInvoiceFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* Remarks Textarea */}
            <div className="ax-modern-field">
              <label className="ax-modern-label" htmlFor="expense_remarks">
                <span>Field Remarks / Justification (Optional)</span>
              </label>
              <textarea
                id="expense_remarks"
                className="ax-input"
                style={{ width: '100%', padding: '10px 14px', minHeight: 75, fontSize: 13 }}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter justification notes, vehicle number, or vendor invoice reference..."
                rows={3}
                disabled={submitting}
              />
            </div>
          </div>

          {/* ════════ Submit Footer ════════ */}
          <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid var(--ax-border, #e2e8f0)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
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
              disabled={submitting || !selectedSiteId || !claimAmount || !invoiceFile}
              style={{ minWidth: 190 }}
            >
              {submitting ? 'Submitting Claim...' : '✓ Submit Expense Claim'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default RequestExpenses;
