import { useState, useMemo, useEffect, useCallback, useRef, useId, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { biharUlaInstallationService } from '../../bihar-services';
import { SearchInput, TableEmptyState, Pagination } from '../../../../../common';

// CSS for Unified Single-Card Layout with Floating Labels & Section Dividers
// Matching Jammu SRT 70MW (AddJammuSRT70MWSingleCard.tsx)
const SINGLE_CARD_FORM_CSS = `
.jammu-single-card-form .ax-card {
  border: 1px solid var(--ax-border);
  border-radius: var(--ax-radius-xl);
  background: var(--ax-surface-solid);
  box-shadow: var(--ax-shadow-sm);
  overflow: hidden;
}

.jammu-single-card-form .ax-card__header {
  padding: var(--ax-space-5) var(--ax-space-6);
  border-bottom: 1px solid var(--ax-border-subtle);
  background: var(--ax-surface-subtle);
  display: flex;
  flex-direction: column;
  gap: var(--ax-space-4);
}

.jammu-single-card-form .ax-card__body {
  padding: var(--ax-space-6);
}

/* Quick Section Nav Pills inside Single Card */
.jammu-section-pills {
  display: flex;
  gap: var(--ax-space-2);
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: thin;
}
.jammu-section-pill-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: var(--ax-radius-pill);
  font-size: var(--ax-text-xs);
  font-weight: 500;
  white-space: nowrap;
  background: var(--ax-surface-solid);
  border: 1px solid var(--ax-border);
  color: var(--ax-text);
  cursor: pointer;
  transition: all var(--ax-motion-fast) var(--ax-ease-standard);
  text-decoration: none;
}
.jammu-section-pill-btn:hover {
  border-color: var(--ax-accent);
  color: var(--ax-accent);
  background: color-mix(in srgb, var(--ax-accent) 6%, var(--ax-surface-solid));
}
.jammu-section-pill-btn .pill-num {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--ax-surface-subtle);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
}

/* Section Block inside Single Card */
.jammu-section-block {
  padding-top: var(--ax-space-2);
}
.jammu-section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: var(--ax-space-2);
  margin-bottom: var(--ax-space-5);
  padding-bottom: var(--ax-space-3);
  border-bottom: 1px solid var(--ax-border-subtle);
}
.jammu-section-title-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.jammu-section-divider {
  border: 0;
  border-top: 1px dashed var(--ax-border);
  margin: var(--ax-space-8) 0 var(--ax-space-6);
}

/* Floating Label Core */
.ax-float {
  position: relative;
  width: 100%;
}
.ax-float__input {
  width: 100%;
  height: 46px;
  padding: 12px 14px 4px 14px;
  font-size: var(--ax-text-sm);
  background: var(--ax-surface-solid);
  border: 1px solid var(--ax-border);
  border-radius: var(--ax-radius-md);
  color: var(--ax-text);
  outline: none;
  transition: border-color var(--ax-motion-fast) var(--ax-ease-standard),
              box-shadow var(--ax-motion-fast) var(--ax-ease-standard);
}
.ax-float__input::placeholder {
  color: transparent;
}
.ax-float__input:focus {
  border-color: var(--ax-accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--ax-accent) 20%, transparent);
}

/* Floating Label Text */
.ax-float__label {
  position: absolute;
  inset-inline-start: 12px;
  top: 50%;
  transform: translateY(-50%);
  margin: 0;
  padding: 0 4px;
  font-size: var(--ax-text-sm);
  color: var(--ax-text-subtle);
  background: var(--ax-surface-solid);
  border-radius: var(--ax-radius-xs);
  pointer-events: none;
  transition: top var(--ax-motion-fast) var(--ax-ease-standard),
              font-size var(--ax-motion-fast) var(--ax-ease-standard),
              color var(--ax-motion-fast) var(--ax-ease-standard);
  z-index: 2;
  white-space: nowrap;
  max-width: calc(100% - 24px);
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Active Floating State (focus, filled, select, date, file) */
.ax-float__input:focus + .ax-float__label,
.ax-float__input:not(:placeholder-shown) + .ax-float__label,
.ax-float--select .ax-float__label,
.ax-float--date .ax-float__label,
.ax-float--file .ax-float__label,
.ax-float--active .ax-float__label {
  top: 0;
  transform: translateY(-50%);
  font-size: var(--ax-text-2xs);
  font-weight: 500;
  color: var(--ax-text-muted);
}
.ax-float__input:focus + .ax-float__label {
  color: var(--ax-accent);
}

/* Validation States & Status Colors */
.ax-float__input.is-invalid {
  border-color: var(--ax-danger-500) !important;
}
.ax-float__input.is-invalid:focus {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--ax-danger-500) 24%, transparent) !important;
}
.ax-float__input.is-invalid + .ax-float__label,
.ax-float--file.is-invalid .ax-float__label {
  color: var(--ax-danger-500) !important;
}

.ax-float__input.is-valid {
  border-color: var(--ax-success-500) !important;
}
.ax-float__input.is-valid:focus {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--ax-success-500) 24%, transparent) !important;
}
.ax-float__input.is-valid + .ax-float__label,
.ax-float--file.is-valid .ax-float__label {
  color: var(--ax-success-500) !important;
}

/* Textarea Floating */
.ax-float--area .ax-float__input {
  height: auto;
  min-height: 84px;
  padding-top: 18px;
  resize: vertical;
}
.ax-float--area .ax-float__label {
  top: 18px;
  transform: none;
}
.ax-float--area .ax-float__input:focus + .ax-float__label,
.ax-float--area .ax-float__input:not(:placeholder-shown) + .ax-float__label {
  top: 0;
  transform: translateY(-50%);
}

/* Custom File Upload with Floating Label */
.ax-float--file .ax-file-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ax-space-3);
  height: 46px;
  padding: 6px 12px;
  background: var(--ax-surface-solid);
  border: 1px solid var(--ax-border);
  border-radius: var(--ax-radius-md);
  cursor: pointer;
  transition: all var(--ax-motion-fast) var(--ax-ease-standard);
}
.ax-float--file .ax-file-box:hover {
  border-color: var(--ax-border-strong);
  background: var(--ax-surface-subtle);
}
.ax-float--file.is-invalid .ax-file-box {
  border-color: var(--ax-danger-500) !important;
}
.ax-float--file.is-valid .ax-file-box {
  border-color: var(--ax-success-500) !important;
}

/* Feedback Helper Messages */
.ax-field-feedback {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  font-size: var(--ax-text-2xs);
  min-height: 16px;
}
.ax-field-feedback--error {
  color: var(--ax-danger-500);
}
.ax-field-feedback--success {
  color: var(--ax-success-500);
}

/* Form Responsive Grid */
.jammu-form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--ax-space-4);
}
@media (min-width: 1024px) {
  .jammu-form-grid--3col {
    grid-template-columns: repeat(3, 1fr);
  }
  .jammu-form-grid--4col {
    grid-template-columns: repeat(4, 1fr);
  }
}
.jammu-form-col-span-full {
  grid-column: 1 / -1;
}

/* Eligible sites table alignment fix */
.jammu-single-card-form .ax-table-wrap {
  overflow-x: auto;
}
.jammu-single-card-form .ax-table-wrap .ax-table {
  display: table;
  width: 100%;
  min-width: 900px;
  table-layout: fixed;
  border-collapse: collapse;
}
.jammu-single-card-form .ax-table-wrap .ax-table thead { display: table-header-group; }
.jammu-single-card-form .ax-table-wrap .ax-table tbody { display: table-row-group; }
.jammu-single-card-form .ax-table-wrap .ax-table tr { display: table-row; }
.jammu-single-card-form .ax-table-wrap .ax-table th,
.jammu-single-card-form .ax-table-wrap .ax-table td {
  display: table-cell;
  text-align: left;
  vertical-align: middle;
  padding: var(--ax-space-3) var(--ax-space-4);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.jammu-single-card-form .ax-table-wrap .ax-table th:first-child,
.jammu-single-card-form .ax-table-wrap .ax-table td:first-child {
  text-align: center;
  padding-inline: 0;
}

/* Sticky Action Footer */
.jammu-form-sticky-bar {
  position: sticky;
  bottom: var(--ax-space-4);
  z-index: 30;
  margin-top: var(--ax-space-6);
  padding: var(--ax-space-3) var(--ax-space-5);
  background: var(--ax-surface-solid);
  border: 1px solid var(--ax-border);
  border-radius: var(--ax-radius-xl);
  box-shadow: var(--ax-shadow-lg);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--ax-space-3);
  backdrop-filter: blur(12px);
}
`;

/* ───────── Floating Helper Components ───────── */
interface FieldStatusProps {
  className: string;
  isValid: boolean;
  isInvalid: boolean;
}

function FieldFeedback({ error, isValid }: { error?: string; isValid?: boolean }) {
  if (error) {
    return (
      <div className="ax-field-feedback ax-field-feedback--error">
        <svg style={{ width: 12, height: 12, flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
        <span>{error}</span>
      </div>
    );
  }
  if (isValid) {
    return (
      <div className="ax-field-feedback ax-field-feedback--success">
        <svg style={{ width: 12, height: 12, flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M5 12l5 5l10 -10" /></svg>
        <span>Valid</span>
      </div>
    );
  }
  return null;
}

interface FloatingInputProps {
  id: string;
  label: string;
  type?: string;
  min?: number | string;
  step?: number | string;
  required?: boolean;
  placeholder?: string;
  value: string | number;
  readOnly?: boolean;
  disabled?: boolean;
  onChange?: (val: string) => void;
  onBlur?: () => void;
  status?: FieldStatusProps;
  error?: string;
}

function FloatingInput({
  id,
  label,
  type = 'text',
  min,
  step,
  required,
  placeholder = ' ',
  value,
  readOnly,
  disabled,
  onChange,
  onBlur,
  status = { className: '', isValid: false, isInvalid: false },
  error,
}: FloatingInputProps) {
  return (
    <div>
      <div className="ax-float">
        <input
          id={id}
          type={type}
          min={min}
          step={step}
          className={`ax-input ax-float__input ${status.className}`}
          placeholder={placeholder}
          value={value}
          readOnly={readOnly}
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.value)}
          onBlur={onBlur}
          aria-invalid={status.isInvalid}
        />
        <label className="ax-float__label" htmlFor={id}>
          {label}
          {required && <span style={{ color: 'var(--ax-danger-500)', marginLeft: 3 }}>*</span>}
        </label>
      </div>
      <FieldFeedback error={error} isValid={status.isValid} />
    </div>
  );
}

interface FloatingSelectProps {
  id: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (val: string) => void;
  onBlur: () => void;
  status?: FieldStatusProps;
  error?: string;
}

function FloatingSelect({
  id,
  label,
  required,
  placeholder = '-- Select --',
  value,
  options,
  onChange,
  onBlur,
  status = { className: '', isValid: false, isInvalid: false },
  error,
}: FloatingSelectProps) {
  return (
    <div>
      <div className={`ax-float ax-float--select ${value ? 'ax-float--active' : ''}`}>
        <select
          id={id}
          className={`ax-select ax-float__input ${status.className}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          aria-invalid={status.isInvalid}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <label className="ax-float__label" htmlFor={id}>
          {label}
          {required && <span style={{ color: 'var(--ax-danger-500)', marginLeft: 3 }}>*</span>}
        </label>
      </div>
      <FieldFeedback error={error} isValid={status.isValid} />
    </div>
  );
}

interface FloatingDateInputProps {
  id: string;
  label: string;
  required?: boolean;
  value: string;
  onChange: (val: string) => void;
  onBlur: () => void;
  status?: FieldStatusProps;
  error?: string;
}

function FloatingDateInput({
  id,
  label,
  required,
  value,
  onChange,
  onBlur,
  status = { className: '', isValid: false, isInvalid: false },
  error,
}: FloatingDateInputProps) {
  return (
    <div>
      <div className="ax-float ax-float--date">
        <input
          id={id}
          type="date"
          className={`ax-input ax-float__input ${status.className}`}
          placeholder=" "
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          aria-invalid={status.isInvalid}
        />
        <label className="ax-float__label" htmlFor={id}>
          {label}
          {required && <span style={{ color: 'var(--ax-danger-500)', marginLeft: 3 }}>*</span>}
        </label>
      </div>
      <FieldFeedback error={error} isValid={status.isValid} />
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
  onBlur: () => void;
  status?: FieldStatusProps;
  error?: string;
}

function FloatingTextarea({
  id,
  label,
  required,
  placeholder = 'Enter remarks...',
  value,
  rows = 3,
  onChange,
  onBlur,
  status = { className: '', isValid: false, isInvalid: false },
  error,
}: FloatingTextareaProps) {
  return (
    <div>
      <div className="ax-float ax-float--area">
        <textarea
          id={id}
          rows={rows}
          className={`ax-textarea ax-float__input ${status.className}`}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          aria-invalid={status.isInvalid}
        />
        <label className="ax-float__label" htmlFor={id}>
          {label}
          {required && <span style={{ color: 'var(--ax-danger-500)', marginLeft: 3 }}>*</span>}
        </label>
      </div>
      <FieldFeedback error={error} isValid={status.isValid} />
    </div>
  );
}

interface FloatingFileInputProps {
  id: string;
  label: string;
  required?: boolean;
  file: File | null;
  onChange: (file: File | null) => void;
  onBlur: () => void;
  status?: FieldStatusProps;
  error?: string;
}

function FloatingFileInput({
  id,
  label,
  required,
  file,
  onChange,
  onBlur,
  status = { className: '', isValid: false, isInvalid: false },
  error,
}: FloatingFileInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = e.target.files?.[0] || null;
    onChange(chosen);
    onBlur();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    if (inputRef.current) inputRef.current.value = '';
    onBlur();
  };

  return (
    <div>
      <div className={`ax-float ax-float--file ${status.className}`}>
        <input
          ref={inputRef}
          id={`${id}-${inputId}`}
          type="file"
          accept=".pdf,image/jpeg,image/png,image/jpg"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <div
          className="ax-file-box"
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          aria-label={label}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
            <svg
              style={{ width: 18, height: 18, flexShrink: 0, color: 'var(--ax-text-muted)' }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
            >
              <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" />
              <polyline points="7 9 12 4 17 9" />
              <line x1="12" y1="4" x2="12" y2="16" />
            </svg>
            <span
              style={{
                fontSize: 'var(--ax-text-xs)',
                color: file ? 'var(--ax-text-strong)' : 'var(--ax-text-subtle)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {file ? file.name : 'Upload invoice / supporting receipt…'}
            </span>
          </div>
          {file ? (
            <button
              type="button"
              className="ax-btn ax-btn--ghost ax-btn--icon ax-btn--xs"
              onClick={handleClear}
              title="Remove file"
            >
              ✕
            </button>
          ) : (
            <span className="ax-badge ax-badge--soft ax-badge--neutral" style={{ fontSize: 11, padding: '2px 8px' }}>
              Browse
            </span>
          )}
        </div>
        <label className="ax-float__label" htmlFor={`${id}-${inputId}`}>
          {label}
          {required && <span style={{ color: 'var(--ax-danger-500)', marginLeft: 3 }}>*</span>}
        </label>
      </div>
      <FieldFeedback error={error} isValid={status.isValid} />
    </div>
  );
}

export function Bihar_Installation_ULA_AddPayment() {
  const navigate = useNavigate();

  // Form Fields
  const [paymentType, setPaymentType] = useState<string>('');
  const [claimDate, setClaimDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [remarks, setRemarks] = useState<string>('');
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [totalAmount, setTotalAmount] = useState<string>('');

  // Eligible Sites
  const [eligibleSites, setEligibleSites] = useState<any[]>([]);
  const [loadingSites, setLoadingSites] = useState(false);
  const [selectedSiteIds, setSelectedSiteIds] = useState<number[]>([]);

  // Search & Pagination
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Status & Feedback
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load eligible sites when paymentType changes
  const loadEligibleSites = useCallback(async (typeVal: string) => {
    setSelectedSiteIds([]);
    setCurrentPage(1);
    if (!typeVal) {
      setEligibleSites([]);
      return;
    }
    setLoadingSites(true);
    setErrorMsg(null);
    try {
      const data = await biharUlaInstallationService.fetchClaimEligibleSites(Number(typeVal));
      setEligibleSites(data || []);
    } catch (err: any) {
      console.error('Error fetching claim eligible sites:', err);
      setErrorMsg('Failed to load eligible sites for this claim type.');
      setEligibleSites([]);
    } finally {
      setLoadingSites(false);
    }
  }, []);

  useEffect(() => {
    loadEligibleSites(paymentType);
  }, [paymentType, loadEligibleSites]);

  const toggleSiteSelect = (id: number) => {
    setSelectedSiteIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Filtered sites
  const filteredSites = useMemo(() => {
    if (!search.trim()) return eligibleSites;
    const q = search.toLowerCase();
    return eligibleSites.filter(
      (s) =>
        s.beneficiary_name?.toLowerCase().includes(q) ||
        s.ca_no?.toLowerCase().includes(q) ||
        s.district?.toLowerCase().includes(q) ||
        s.block?.toLowerCase().includes(q) ||
        s.panchayat?.toLowerCase().includes(q) ||
        s.village?.toLowerCase().includes(q) ||
        String(s.id).includes(q)
    );
  }, [eligibleSites, search]);

  // Paginated sites
  const paginatedSites = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSites.slice(start, start + pageSize);
  }, [filteredSites, currentPage, pageSize]);

  const allFilteredSelected =
    filteredSites.length > 0 && filteredSites.every((s) => selectedSiteIds.includes(s.id));

  const handleSelectAll = (checked: boolean) => {
    setSelectedSiteIds(checked ? filteredSites.map((s) => s.id) : []);
  };

  // Field validation
  const validateField = (name: string, value: unknown): string => {
    if (name === 'paymentType' && (!value || String(value).trim() === '')) {
      return 'Payment Type is required.';
    }
    if (name === 'invoiceFile' && !value) {
      return 'Document / invoice is required.';
    }
    if (name === 'claimDate' && (!value || String(value).trim() === '')) {
      return 'Date is required.';
    }
    if (name === 'remarks' && (!value || String(value).trim() === '')) {
      return 'Remarks are required.';
    }
    if (name === 'totalAmount') {
      if (!value || String(value).trim() === '') return 'Total Amount is required.';
      if (Number(value) <= 0) return 'Total Amount must be greater than zero.';
    }
    return '';
  };

  const getStatus = (name: string, value: unknown): FieldStatusProps => {
    const isTouched = touched[name] || submitted;
    const err = errors[name];
    if (!isTouched) return { className: '', isValid: false, isInvalid: false };
    if (err) return { className: 'is-invalid', isValid: false, isInvalid: true };
    if (value !== null && value !== undefined && String(value).trim() !== '') {
      return { className: 'is-valid', isValid: true, isInvalid: false };
    }
    return { className: '', isValid: false, isInvalid: false };
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Submit Claim
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const errs: Record<string, string> = {
      paymentType: validateField('paymentType', paymentType),
      invoiceFile: validateField('invoiceFile', invoiceFile),
      claimDate: validateField('claimDate', claimDate),
      remarks: validateField('remarks', remarks),
      totalAmount: validateField('totalAmount', totalAmount),
    };
    setErrors(errs);

    if (Object.values(errs).some((e) => e)) {
      setTimeout(() => {
        const firstErr = document.querySelector('.is-invalid');
        if (firstErr) {
          firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
          (firstErr as HTMLElement).focus?.();
        }
      }, 50);
      return;
    }

    if (selectedSiteIds.length === 0) {
      setErrorMsg('Please select at least one site to raise a payment claim.');
      scrollToSection('sec-sites');
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('payment_type', paymentType);
      selectedSiteIds.forEach((id, idx) => {
        fd.append(`site_id[${idx}]`, String(id));
      });
      fd.append('date', claimDate);
      fd.append('remarks', remarks.trim());
      fd.append('total_amount', totalAmount);
      if (invoiceFile) fd.append('file', invoiceFile);

      const resp = await biharUlaInstallationService.storeClaim(fd);
      setSuccessMsg(resp.message || 'Payment claim submitted successfully!');
      setTimeout(() => {
        navigate('/v/bihar/ula-installation-view-payment');
      }, 1500);
    } catch (err: any) {
      console.error('Failed to submit claim:', err);
      setErrorMsg(err?.message || 'Failed to submit payment claim.');
    } finally {
      setSubmitting(false);
    }
  };

  const totalRequired = 5;
  const completedRequired = [
    paymentType,
    invoiceFile,
    claimDate,
    remarks,
    totalAmount,
  ].filter((v) => v !== null && v !== undefined && String(v).trim() !== '').length;
  const progressPercent = Math.round((completedRequired / totalRequired) * 100);

  return (
    <div className="jammu-single-card-form ax-page">
      <style>{SINGLE_CARD_FORM_CSS}</style>

      {/* Header */}
      <PageHead
        title="Add Payment Claim"
        subtitle={
          <span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>
            Single Main Card View · Section 1 to 3 Sequential Breakdown · Bihar ULA Installation Scheme
          </span>
        }
        breadcrumbs={[
          { label: 'Bihar' },
          { label: 'Installation' },
          { label: 'ULA' },
          { label: 'Add Payment' },
        ]}
        actions={
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
            <Link to="/v/bihar/ula-installation-view-payment" className="ax-btn ax-btn--secondary ax-btn--pill">
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l14 0" /><path d="M5 12l6 6" /><path d="M5 12l6 -6" /></svg>
              <span className="ax-btn__label">View All Claims</span>
            </Link>
          </div>
        }
      />

      {/* Success Alert Banner */}
      {successMsg && (
        <div className="ax-alert ax-alert--success" role="status" style={{ marginBottom: 'var(--ax-space-6)' }}>
          <span className="ax-alert__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5l10 -10" /></svg>
          </span>
          <div className="ax-alert__content">
            <h3 className="ax-alert__title" style={{ fontSize: 'var(--ax-text-base)', fontWeight: 600 }}>
              Payment Claim Submitted Successfully!
            </h3>
            <p className="ax-alert__message" style={{ margin: '4px 0 0' }}>
              Claim for <strong>{selectedSiteIds.length} sites</strong> (Amount: ₹{totalAmount}) has been submitted. Redirecting to payment registry…
            </p>
          </div>
        </div>
      )}

      {/* Error Alert Banner */}
      {errorMsg && (
        <div className="ax-alert ax-alert--danger" role="alert" style={{ marginBottom: 'var(--ax-space-6)' }}>
          <span className="ax-alert__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4" /><path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0" /><path d="M12 16h.01" /></svg>
          </span>
          <div className="ax-alert__content">
            <h4 className="ax-alert__title" style={{ fontWeight: 600 }}>Attention Needed</h4>
            <p className="ax-alert__message" style={{ margin: '4px 0 0' }}>
              {errorMsg}
            </p>
          </div>
        </div>
      )}

      {/* Main Single Card Form */}
      <form onSubmit={handleSubmit} noValidate>
        <div className="ax-card">
          {/* Card Header with Title and Section Stepper Pills */}
          <div className="ax-card__header">
            <div className="ax-cluster" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--ax-space-3)' }}>
              <div>
                <span className="ax-card__eyebrow">Unified Card Architecture</span>
                <h2 className="ax-card__title" style={{ margin: 0 }}>Add Payment Claim</h2>
                <p className="ax-card__subtitle" style={{ margin: '4px 0 0' }}>
                  Submit 50% advance or 30% final installation claim with supporting tax invoice organized across 3 sequential sections.
                </p>
              </div>

            </div>

            {/* Quick Section Jump Navigator */}
            <div className="jammu-section-pills" role="navigation" aria-label="Jump to section">
              {[
                { id: 'sec-claim', num: '1', title: 'Claim Information' },
                { id: 'sec-sites', num: '2', title: 'Eligible Sites' },
                { id: 'sec-review', num: '3', title: 'Review & Submit' },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => scrollToSection(s.id)}
                  className="jammu-section-pill-btn"
                >
                  <span className="pill-num">{s.num}</span>
                  <span>{s.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Card Body containing all 3 sections */}
          <div className="ax-card__body">

            {/* ========================================================
             * Section 1 of 3: Claim Information & Invoices
             * ======================================================== */}
            <div id="sec-claim" className="jammu-section-block">
              <div className="jammu-section-header">
                <div className="jammu-section-title-wrap">
                  <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', alignItems: 'center' }}>
                    <span className="ax-badge ax-badge--soft ax-badge--primary ax-badge--pill" style={{ fontWeight: 600 }}>
                      Section 1 of 3
                    </span>
                    <h3 style={{ fontSize: 'var(--ax-text-base)', fontWeight: 600, margin: 0, color: 'var(--ax-text-strong)' }}>
                      Claim &amp; Invoice Information
                    </h3>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
                    Specify payment tranche type, attach official invoice document, and record the claim submission date.
                  </p>
                </div>
              </div>

              <div className="jammu-form-grid jammu-form-grid--3col">
                {/* Payment Type * */}
                <div>
                  <FloatingSelect
                    id="sc-payment-type"
                    label="Payment Type"
                    required
                    placeholder="Select Payment Type"
                    value={paymentType}
                    options={[
                      { label: '50% Advance Claim (Structure Complete)', value: '50' },
                      { label: '30% Final Installation Claim', value: '30' },
                    ]}
                    onChange={(val) => {
                      setPaymentType(val);
                      setErrors((prev) => ({ ...prev, paymentType: validateField('paymentType', val) }));
                    }}
                    onBlur={() => setTouched((prev) => ({ ...prev, paymentType: true }))}
                    status={getStatus('paymentType', paymentType)}
                    error={errors.paymentType}
                  />
                </div>

                {/* Document / Invoice * */}
                <div>
                  <FloatingFileInput
                    id="sc-invoice-file"
                    label="Document"
                    required
                    file={invoiceFile}
                    onChange={(f) => {
                      setInvoiceFile(f);
                      setErrors((prev) => ({ ...prev, invoiceFile: validateField('invoiceFile', f) }));
                    }}
                    onBlur={() => setTouched((prev) => ({ ...prev, invoiceFile: true }))}
                    status={getStatus('invoiceFile', invoiceFile)}
                    error={errors.invoiceFile}
                  />
                </div>

                {/* Date * */}
                <div>
                  <FloatingDateInput
                    id="sc-claim-date"
                    label="Date"
                    required
                    value={claimDate}
                    onChange={(val) => {
                      setClaimDate(val);
                      setErrors((prev) => ({ ...prev, claimDate: validateField('claimDate', val) }));
                    }}
                    onBlur={() => setTouched((prev) => ({ ...prev, claimDate: true }))}
                    status={getStatus('claimDate', claimDate)}
                    error={errors.claimDate}
                  />
                </div>

                {/* Remarks * */}
                <div className="jammu-form-col-span-full">
                  <FloatingTextarea
                    id="sc-remarks"
                    label="Remarks"
                    required
                    placeholder="Enter remarks for this payment claim..."
                    value={remarks}
                    onChange={(val) => {
                      setRemarks(val);
                      setErrors((prev) => ({ ...prev, remarks: validateField('remarks', val) }));
                    }}
                    onBlur={() => setTouched((prev) => ({ ...prev, remarks: true }))}
                    status={getStatus('remarks', remarks)}
                    error={errors.remarks}
                  />
                </div>
              </div>
            </div>

            <hr className="jammu-section-divider" />

            {/* ========================================================
             * Section 2 of 3: Eligible Sites Selection
             * ======================================================== */}
            <div id="sec-sites" className="jammu-section-block">
              <div className="jammu-section-header">
                <div className="jammu-section-title-wrap">
                  <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', alignItems: 'center' }}>
                    <span className="ax-badge ax-badge--soft ax-badge--primary ax-badge--pill" style={{ fontWeight: 600 }}>
                      Section 2 of 3
                    </span>
                    <h3 style={{ fontSize: 'var(--ax-text-base)', fontWeight: 600, margin: 0, color: 'var(--ax-text-strong)' }}>
                      Eligible Beneficiary Sites
                    </h3>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
                    Select one or more approved sites eligible for this payment tranche.
                  </p>
                </div>

                <span className="ax-badge ax-badge--soft ax-badge--primary ax-badge--pill" style={{ fontWeight: 600 }}>
                  {selectedSiteIds.length} site{selectedSiteIds.length === 1 ? '' : 's'} selected
                </span>
              </div>


              {/* Table */}
              <div className="ax-table-wrap">
                <table className="ax-table ax-table--hover">
                  <colgroup>
                    <col style={{ width: 48 }} />
                    <col style={{ width: '14%' }} />
                    <col style={{ width: '14%' }} />
                    <col style={{ width: '16%' }} />
                    <col style={{ width: '20%' }} />
                    <col style={{ width: '14%' }} />
                    <col style={{ width: '16%' }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          checked={allFilteredSelected}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          disabled={filteredSites.length === 0}
                          aria-label="Select all"
                        />
                      </th>
                      <th>District</th>
                      <th>Block</th>
                      <th>Panchayat</th>
                      <th>Beneficiary Name</th>
                      <th>Contact No.</th>
                      <th>CA Number</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingSites ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: 'var(--ax-space-8)' }}>
                          <span className="ax-spinner" /> Loading eligible records…
                        </td>
                      </tr>
                    ) : !paymentType ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: 'var(--ax-space-8)', color: 'var(--ax-text-muted)' }}>
                          <i>Please select a Payment Type in Section 1 to load eligible sites</i>
                        </td>
                      </tr>
                    ) : paginatedSites.length === 0 ? (
                      <tr>
                        <td colSpan={7}>
                          <TableEmptyState
                            title="No eligible sites found"
                            message="There are currently no approved sites awaiting this payment tranche."
                          />
                        </td>
                      </tr>
                    ) : (
                      paginatedSites.map((s) => {
                        const isSelected = selectedSiteIds.includes(s.id);
                        return (
                          <tr
                            key={s.id}
                            onClick={() => toggleSiteSelect(s.id)}
                            style={{
                              cursor: 'pointer',
                              backgroundColor: isSelected ? 'color-mix(in srgb, var(--ax-accent) 6%, var(--ax-surface-solid))' : undefined,
                            }}
                          >
                            <td onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSiteSelect(s.id)}
                              />
                            </td>
                            <td style={{ fontWeight: 600 }}>{s.district || '—'}</td>
                            <td>{s.block || '—'}</td>
                            <td>{s.panchayat || s.village || '—'}</td>
                            <td style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>{s.beneficiary_name || '—'}</td>
                            <td>{s.contact_no || '—'}</td>
                            <td style={{ fontFamily: 'var(--ax-font-mono)', fontSize: 'var(--ax-text-xs)' }}>{s.ca_no || '—'}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {filteredSites.length > pageSize && (
                <div style={{ marginTop: 'var(--ax-space-3)' }}>
                  <Pagination
                    currentPage={currentPage}
                    totalCount={filteredSites.length}
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={setPageSize}
                  />
                </div>
              )}
            </div>

            <hr className="jammu-section-divider" />

            {/* ========================================================
             * Section 3 of 3: Final Review & Submission
             * ======================================================== */}
            <div id="sec-review" className="jammu-section-block">
              <div className="jammu-section-header">
                <div className="jammu-section-title-wrap">
                  <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', alignItems: 'center' }}>
                    <span className="ax-badge ax-badge--soft ax-badge--primary ax-badge--pill" style={{ fontWeight: 600 }}>
                      Section 3 of 3
                    </span>
                    <h3 style={{ fontSize: 'var(--ax-text-base)', fontWeight: 600, margin: 0, color: 'var(--ax-text-strong)' }}>
                      Claim Amount &amp; Payout Summary
                    </h3>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
                    Enter total invoice claim amount and confirm selected batch count.
                  </p>
                </div>
              </div>

              <div className="jammu-form-grid jammu-form-grid--3col">
                {/* Total Amount * */}
                <div>
                  <FloatingInput
                    id="sc-total-amount"
                    label="Total Amount"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    placeholder="Enter Total Amount"
                    value={totalAmount}
                    onChange={(val) => {
                      setTotalAmount(val);
                      setErrors((prev) => ({ ...prev, totalAmount: validateField('totalAmount', val) }));
                    }}
                    onBlur={() => setTouched((prev) => ({ ...prev, totalAmount: true }))}
                    status={getStatus('totalAmount', totalAmount)}
                    error={errors.totalAmount}
                  />
                </div>

                {/* Total Count */}
                <div>
                  <FloatingInput
                    id="sc-total-count"
                    label="Total Sites Count"
                    type="text"
                    value={selectedSiteIds.length}
                    readOnly
                    disabled
                  />
                </div>

                {/* Payment Tranche Badge */}
                <div>
                  <div className="ax-float">
                    <div
                      className="ax-input ax-float__input"
                      style={{ display: 'flex', alignItems: 'center', background: 'var(--ax-surface-subtle)', fontWeight: 600 }}
                    >
                      {paymentType === '50'
                        ? '50% Advance Claim'
                        : paymentType === '30'
                        ? '30% Final Claim'
                        : 'No Tranche Selected'}
                    </div>
                    <label className="ax-float__label">Tranche Category</label>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ── Sticky Action Bar (Exact Jammu SRT 70MW style) ── */}
        <div className="jammu-form-sticky-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ax-space-3)', flexWrap: 'wrap' }}>
            <span className="ax-badge ax-badge--soft ax-badge--primary ax-badge--pill" style={{ fontWeight: 600 }}>
              {selectedSiteIds.length} Site{selectedSiteIds.length === 1 ? '' : 's'} Selected
            </span>
            {totalAmount && (
              <span style={{ fontSize: 'var(--ax-text-sm)', fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                Amount: ₹{Number(totalAmount).toLocaleString('en-IN')}
              </span>
            )}
            <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
              {progressPercent}% Complete
            </span>
          </div>

          <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}>
            <button
              type="button"
              className="ax-btn ax-btn--ghost ax-btn--sm"
              onClick={() => {
                setSelectedSiteIds([]);
                setTotalAmount('');
                setRemarks('');
                setInvoiceFile(null);
                setErrors({});
                setSubmitted(false);
              }}
            >
              Reset
            </button>
            <button
              type="submit"
              className="ax-btn ax-btn--primary"
              disabled={submitting || selectedSiteIds.length === 0}
            >
              {submitting ? (
                <>
                  <span className="ax-spinner" />
                  <span className="ax-btn__label">Submitting Claim…</span>
                </>
              ) : (
                <>
                  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" />
                    <polyline points="7 9 12 4 17 9" />
                    <line x1="12" y1="4" x2="12" y2="16" />
                  </svg>
                  <span className="ax-btn__label">Submit Payment Claim</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default Bihar_Installation_ULA_AddPayment;