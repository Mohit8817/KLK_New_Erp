import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { kashmirSrtService } from '../../kashmir-services';

// CSS: Unified Single-Card Layout with Floating Labels (same as Bihar SRT design)
const SINGLE_CARD_FORM_CSS = `
.kashmir-expense-form .ax-card { border: 1px solid var(--ax-border); border-radius: var(--ax-radius-xl); background: var(--ax-surface-solid); box-shadow: var(--ax-shadow-sm); overflow: hidden; }
.kashmir-expense-form .ax-card__header { padding: var(--ax-space-5) var(--ax-space-6); border-bottom: 1px solid var(--ax-border-subtle); background: var(--ax-surface-subtle); display: flex; flex-direction: column; gap: var(--ax-space-4); }
.kashmir-expense-form .ax-card__body { padding: var(--ax-space-6); }

.kashmir-section-block { padding-top: var(--ax-space-2); }
.kashmir-section-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: var(--ax-space-2); margin-bottom: var(--ax-space-5); padding-bottom: var(--ax-space-3); border-bottom: 1px solid var(--ax-border-subtle); }
.kashmir-section-title-wrap { display: flex; flex-direction: column; gap: 4px; }

.ax-float { position: relative; width: 100%; }
.ax-float__input { width: 100%; height: 46px; padding: 12px 14px 4px 14px; font-size: var(--ax-text-sm); background: var(--ax-surface-solid); border: 1px solid var(--ax-border); border-radius: var(--ax-radius-md); color: var(--ax-text); outline: none; transition: border-color var(--ax-motion-fast) var(--ax-ease-standard), box-shadow var(--ax-motion-fast) var(--ax-ease-standard); }
.ax-float__input::placeholder { color: transparent; }
.ax-float__input:focus { border-color: var(--ax-accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--ax-accent) 20%, transparent); }
.ax-float__input[readonly] { background: var(--ax-surface-subtle); }
.ax-float__input:disabled { opacity: .7; cursor: not-allowed; background: var(--ax-surface-subtle); }

.ax-float__label { position: absolute; inset-inline-start: 12px; top: 50%; transform: translateY(-50%); margin: 0; padding: 0 4px; font-size: var(--ax-text-sm); color: var(--ax-text-subtle); background: var(--ax-surface-solid); border-radius: var(--ax-radius-xs); pointer-events: none; transition: top var(--ax-motion-fast) var(--ax-ease-standard), font-size var(--ax-motion-fast) var(--ax-ease-standard), color var(--ax-motion-fast) var(--ax-ease-standard); z-index: 2; white-space: nowrap; max-width: calc(100% - 24px); overflow: hidden; text-overflow: ellipsis; }

.ax-float__input:focus + .ax-float__label,
.ax-float__input:not(:placeholder-shown) + .ax-float__label,
.ax-float--select .ax-float__label,
.ax-float--date .ax-float__label { top: 0; transform: translateY(-50%); font-size: var(--ax-text-2xs); font-weight: 500; color: var(--ax-text-muted); }
.ax-float__input:focus + .ax-float__label { color: var(--ax-accent); }

.ax-float__input.is-invalid { border-color: var(--ax-danger-500) !important; }
.ax-float__input.is-invalid:focus { box-shadow: 0 0 0 3px color-mix(in srgb, var(--ax-danger-500) 24%, transparent) !important; }
.ax-float__input.is-invalid + .ax-float__label { color: var(--ax-danger-500) !important; }

.ax-float--area .ax-float__input { height: auto; min-height: 84px; padding-top: 18px; resize: vertical; }
.ax-float--area .ax-float__label { top: 18px; transform: none; }
.ax-float--area .ax-float__input:focus + .ax-float__label,
.ax-float--area .ax-float__input:not(:placeholder-shown) + .ax-float__label { top: 0; transform: translateY(-50%); }

.ax-field-feedback { display: flex; align-items: center; gap: 4px; margin-top: 4px; font-size: var(--ax-text-2xs); min-height: 16px; }
.ax-field-feedback--error { color: var(--ax-danger-500); }

.kashmir-form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--ax-space-4); }
@media (min-width: 1024px) { .kashmir-form-grid--3col { grid-template-columns: repeat(3, 1fr); } }
.kashmir-form-col-span-full { grid-column: 1 / -1; }

.kashmir-form-sticky-bar { position: sticky; bottom: var(--ax-space-4); z-index: 30; margin-top: var(--ax-space-6); padding: var(--ax-space-3) var(--ax-space-5); background: var(--ax-surface-solid); border: 1px solid var(--ax-border); border-radius: var(--ax-radius-xl); box-shadow: var(--ax-shadow-lg); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--ax-space-3); backdrop-filter: blur(12px); }

@keyframes kashmir-spin { to { transform: rotate(360deg); } }
`;

const PROJECT_NAME = 'SRT-70MW';

const PURPOSES = [
  'Installation Material',
  'Installation Site Visit',
  'Repair Work',
  'Maintenance',
  'Other',
];

const INITIAL_FORM = {
  site_id: '',
  date: '',
  purpose: '',
  amount: '',
  remarks: '',
};

type FormKey = keyof typeof INITIAL_FORM;
type Option = { value: string; label: string };

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export function Kashmir_Expenses_RequestExpenses() {
  const navigate = useNavigate();

  const [sites, setSites] = useState<Option[]>([]);
  const [loadingSites, setLoadingSites] = useState(false);
  const [formData, setFormData] = useState({ ...INITIAL_FORM });
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});

  const clearError = (name: string) => {
    setValidationErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const setField = (name: FormKey, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (validationErrors[name]) clearError(name);
  };

  const f = (name: FormKey) => ({
    value: formData[name],
    onChange: (v: string) => setField(name, v),
    error: validationErrors[name]?.[0],
  });

  const handleFileChange = (file: File | null) => {
    if (file && file.size > MAX_FILE_SIZE) {
      alert('File size exceeds 5MB limit.');
      return;
    }
    setInvoiceFile(file);
    if (validationErrors.invoice_file) clearError('invoice_file');
  };

  // Load site names for dropdown
  // NOTE: replace `getExpenseSites` with the real service method name if it differs.
  useEffect(() => {
    let active = true;
    (async () => {
      setLoadingSites(true);
      try {
        const list: any[] = await (kashmirSrtService as any).getExpenseSites();
        if (active && Array.isArray(list)) {
          setSites(
            list.map((s) => ({
              value: String(s.id),
              label: `${s.site_name || s.name || 'Site'}${s.uid || s.code ? ` (${s.uid || s.code})` : ''}`,
            }))
          );
        }
      } catch (err) {
        console.warn('Failed to load expense sites:', err);
      } finally {
        if (active) setLoadingSites(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const validate = () => {
    const errs: Record<string, string[]> = {};
    if (!formData.site_id) errs.site_id = ['Please select a site name.'];
    if (!formData.date) errs.date = ['Date is required.'];
    if (!formData.purpose) errs.purpose = ['Please select a purpose.'];
    if (!formData.amount.trim()) {
      errs.amount = ['Amount is required.'];
    } else if (Number(formData.amount) <= 0) {
      errs.amount = ['Amount must be greater than 0.'];
    }
    if (!invoiceFile) errs.invoice_file = ['Invoice file is required.'];
    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // NOTE: replace `storeInstallationExpense` / field names with the real API contract if they differ.
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    if (!validate()) {
      setErrorMsg('Please correct the highlighted fields before submitting.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => {
        document.querySelector('.is-invalid')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
      return;
    }

    const payload = new FormData();
    payload.append('project_name', PROJECT_NAME);
    payload.append('site_id', formData.site_id);
    payload.append('date', formData.date);
    payload.append('purpose', formData.purpose);
    payload.append('amount', formData.amount.trim());
    payload.append('remarks', formData.remarks.trim());
    if (invoiceFile) payload.append('invoice_file', invoiceFile);

    setSubmitting(true);
    try {
      const resp: any = await (kashmirSrtService as any).storeInstallationExpense(payload);
      setSuccessMsg(resp?.message || 'Installation Expense Submitted Successfully!!!');
      setFormData({ ...INITIAL_FORM });
      setInvoiceFile(null);
      setValidationErrors({});
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error occurred while submitting expense.');
      if (err?.errors && typeof err.errors === 'object') {
        const apiErrors: Record<string, string[]> = {};
        Object.entries(err.errors).forEach(([k, v]) => {
          apiErrors[k] = Array.isArray(v) ? v.map(String) : [String(v)];
        });
        setValidationErrors(apiErrors);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="kashmir-expense-form">
      <style>{SINGLE_CARD_FORM_CSS}</style>

      <PageHead
        title="Installation Expenses"
        subtitle={
          <span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>
            Submit expense reimbursement request for Kashmir SRT 70MW installation
          </span>
        }
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Kashmir' },
          { label: 'Installation Expenses' },
          { label: 'SRT 70MW' },
          { label: 'Request Expenses' },
        ]}
      />

      {/* Success Banner */}
      {successMsg && (
        <div className="ax-alert ax-alert--success" role="status" style={{ marginBottom: 'var(--ax-space-6)' }}>
          <span className="ax-alert__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5l10 -10" /></svg>
          </span>
          <div className="ax-alert__content">
            <h3 className="ax-alert__title" style={{ fontSize: 'var(--ax-text-base)', fontWeight: 600 }}>{successMsg}</h3>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {errorMsg && (
        <div className="ax-alert ax-alert--danger" role="alert" style={{ marginBottom: 'var(--ax-space-6)' }}>
          <span className="ax-alert__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4" /><path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0" /><path d="M12 16h.01" /></svg>
          </span>
          <div className="ax-alert__content">
            <h4 className="ax-alert__title" style={{ fontWeight: 600 }}>{errorMsg}</h4>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="ax-card">
          <div className="ax-card__header">
            <div>
              <span className="ax-card__eyebrow">Expense Request</span>
              <h2 className="ax-card__title" style={{ margin: 0 }}>Installation Expenses</h2>
              <p className="ax-card__subtitle" style={{ margin: '4px 0 0' }}>
                The field labels marked with <span style={{ color: 'var(--ax-danger-500)', fontWeight: 700 }}>*</span> are input fields.
              </p>
            </div>
          </div>

          <div className="ax-card__body">
            <div className="kashmir-section-block">
              <div className="kashmir-section-header">
                <div className="kashmir-section-title-wrap">
                  <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', alignItems: 'center' }}>
                    <span className="ax-badge ax-badge--soft ax-badge--primary ax-badge--pill" style={{ fontWeight: 600 }}>
                      Expense Details
                    </span>
                    <h3 style={{ fontSize: 'var(--ax-text-base)', fontWeight: 600, margin: 0, color: 'var(--ax-text-strong)' }}>
                      Fill this Form
                    </h3>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
                    Select the site, enter the expense details and attach the invoice (up to 5MB).
                  </p>
                </div>
              </div>

              <div className="kashmir-form-grid kashmir-form-grid--3col">
                <FloatingInput id="kx-project" label="Project Name" required readOnly value={PROJECT_NAME} />
                <FloatingSelect
                  id="kx-site"
                  label="Site Name"
                  required
                  placeholder={loadingSites ? 'Loading sites...' : 'Select Site Name'}
                  options={sites}
                  disabled={loadingSites}
                  {...f('site_id')}
                />
                <FloatingInput id="kx-date" label="Date" type="date" required {...f('date')} />

                <FloatingSelect
                  id="kx-purpose"
                  label="Purpose"
                  required
                  placeholder="-- Select Purpose --"
                  options={PURPOSES.map((p) => ({ value: p, label: p }))}
                  {...f('purpose')}
                />
                <FloatingInput id="kx-amount" label="Amount" type="number" step="0.01" required placeholder="Enter Amount" {...f('amount')} />
                <FloatingFileInput
                  id="kx-invoice"
                  label="Invoice File"
                  required
                  accept="image/*,application/pdf"
                  file={invoiceFile}
                  onChange={handleFileChange}
                  error={validationErrors.invoice_file?.[0]}
                />

                <div className="kashmir-form-col-span-full">
                  <FloatingTextarea id="kx-remarks" label="Remarks" placeholder="Enter Remarks..." {...f('remarks')} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Action Footer (outside the card, same as Bihar) */}
        <div className="kashmir-form-sticky-bar">
          <span className="ax-badge ax-badge--soft ax-badge--primary ax-badge--pill">New Expense</span>
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)' }}>
            <button type="button" className="ax-btn ax-btn--secondary" onClick={() => navigate(-1)} disabled={submitting}>
              <span className="ax-btn__label">Cancel</span>
            </button>
            <button type="submit" disabled={submitting} className="ax-btn ax-btn--primary" style={{ minWidth: 200 }}>
              {submitting ? (
                <>
                  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ animation: 'kashmir-spin 1s linear infinite' }}><path d="M12 3a9 9 0 1 0 9 9" /></svg>
                  <span className="ax-btn__label">Submitting...</span>
                </>
              ) : (
                <>
                  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5l10 -10" /></svg>
                  <span className="ax-btn__label">Submit Expense</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      <footer style={{ marginTop: 'var(--ax-space-8)', textAlign: 'center', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
        Copyright © <a href="https://klkerp.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--ax-primary)' }}>ETS NETWORKS</a>. All rights reserved.
      </footer>
    </div>
  );
}

/* =========================================================================
 * Reusable Floating Components (same as Bihar SRT)
 * ========================================================================= */

const Asterisk = () => <span style={{ color: 'var(--ax-danger-500)', marginLeft: 3 }}>*</span>;

function FieldFeedback({ error }: { error?: string }) {
  if (error) {
    return (
      <span className="ax-field-feedback ax-field-feedback--error" role="alert">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 12, height: 12 }}>
          <circle cx="12" cy="12" r="9" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        {error}
      </span>
    );
  }
  return <span className="ax-field-feedback" />;
}

interface FloatingInputProps {
  id: string;
  label: string;
  type?: string;
  step?: string;
  required?: boolean;
  readOnly?: boolean;
  placeholder?: string;
  value: string;
  onChange?: (val: string) => void;
  error?: string;
}

function FloatingInput({ id, label, type = 'text', step, required, readOnly, placeholder = ' ', value, onChange, error }: FloatingInputProps) {
  return (
    <div>
      <div className={`ax-float ${type === 'date' ? 'ax-float--date' : ''}`}>
        <input
          id={id}
          type={type}
          step={step}
          className={`ax-input ax-float__input ${error ? 'is-invalid' : ''}`}
          placeholder={placeholder}
          value={value}
          readOnly={readOnly}
          onChange={(e) => onChange?.(e.target.value)}
          aria-invalid={Boolean(error)}
        />
        <label className="ax-float__label" htmlFor={id}>
          {label}
          {required && <Asterisk />}
        </label>
      </div>
      <FieldFeedback error={error} />
    </div>
  );
}

interface FloatingSelectProps {
  id: string;
  label: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  value: string;
  options: Option[];
  onChange: (val: string) => void;
  error?: string;
}

function FloatingSelect({ id, label, required, disabled, placeholder = '-- Select --', value, options, onChange, error }: FloatingSelectProps) {
  return (
    <div>
      <div className="ax-float ax-float--select">
        <select
          id={id}
          className={`ax-select ax-float__input ${error ? 'is-invalid' : ''}`}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(error)}
        >
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <label className="ax-float__label" htmlFor={id}>
          {label}
          {required && <Asterisk />}
        </label>
      </div>
      <FieldFeedback error={error} />
    </div>
  );
}

interface FloatingTextareaProps {
  id: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  value: string;
  rows?: number;
  onChange: (val: string) => void;
  error?: string;
}

function FloatingTextarea({ id, label, required, placeholder = 'Enter Remarks...', value, rows = 3, onChange, error }: FloatingTextareaProps) {
  return (
    <div>
      <div className="ax-float ax-float--area">
        <textarea
          id={id}
          rows={rows}
          className={`ax-textarea ax-float__input ${error ? 'is-invalid' : ''}`}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(error)}
        />
        <label className="ax-float__label" htmlFor={id}>
          {label}
          {required && <Asterisk />}
        </label>
      </div>
      <FieldFeedback error={error} />
    </div>
  );
}

interface FloatingFileInputProps {
  id: string;
  label: string;
  required?: boolean;
  accept?: string;
  file: File | null;
  onChange: (file: File | null) => void;
  error?: string;
}

function FloatingFileInput({ id, label, required, accept, file, onChange, error }: FloatingFileInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const objectUrl = useMemo(
    () => (file && file.type.startsWith('image/') ? URL.createObjectURL(file) : null),
    [file]
  );
  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const chosen = e.dataTransfer.files?.[0];
    if (chosen) onChange(chosen);
  };

  const iconCircle = (bg: string, fg: string, children: ReactNode) => (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        background: bg,
        color: fg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {children}
    </div>
  );

  return (
    <div className={error ? 'is-invalid' : undefined} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label
        htmlFor={id}
        style={{
          fontSize: '12px',
          fontWeight: 600,
          color: error ? 'var(--ax-danger-500, #ef4444)' : 'var(--ax-text-strong, #334155)',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <span>{label}</span>
        {required && <Asterisk />}
      </label>

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        style={{ display: 'none' }}
        onChange={(e) => onChange(e.target.files?.[0] || null)}
      />

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        style={{
          border: isDragging
            ? '1.5px dashed #2563eb'
            : error
            ? '1.5px dashed var(--ax-danger-500, #ef4444)'
            : isHovered ? '1.5px dashed #94a3b8' : '1.5px dashed #cbd5e1',
          borderRadius: 8,
          background: isDragging
            ? '#eff6ff'
            : error
            ? '#fef2f2'
            : isHovered ? '#fbfcfd' : '#ffffff',
          padding: file ? '12px 16px' : '22px 16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          minHeight: 110,
        }}
      >
        {file ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, textAlign: 'left' }}>
              {objectUrl ? (
                <img
                  src={objectUrl}
                  alt={label}
                  style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 0, border: '1px solid var(--ax-border)', flexShrink: 0 }}
                />
              ) : (
                iconCircle('#fef2f2', '#ef4444',
                  <span style={{ fontSize: 10, fontWeight: 700 }}>PDF</span>
                )
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', marginTop: 2 }}>
                  {(file.size / 1024).toFixed(0)} KB · Ready to upload
                </div>
              </div>
            </div>
            <button
              type="button"
              className="ax-btn ax-btn--ghost ax-btn--sm"
              onClick={handleClear}
              style={{ color: '#ef4444', flexShrink: 0 }}
              title="Remove file"
            >
              Remove
            </button>
          </div>
        ) : (
          <>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: '#eff6ff',
                color: '#3b82f6',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 6,
              }}
            >
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                <path d="M12 12v9" />
                <path d="m8 16 4-4 4 4" />
              </svg>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong, #1e293b)' }}>
              Click to upload or drag & drop
            </div>
            <div style={{ fontSize: 11, color: 'var(--ax-text-muted, #64748b)', marginTop: 3 }}>
              PDF, JPG or PNG up to 5MB
            </div>
          </>
        )}
      </div>

      <FieldFeedback error={error} />
    </div>
  );
}

export default Kashmir_Expenses_RequestExpenses;