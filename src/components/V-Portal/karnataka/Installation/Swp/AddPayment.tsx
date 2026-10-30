import { useState, useMemo, useEffect, useCallback, useRef, useId, type FormEvent, type ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { SearchInput, TableEmptyState, Pagination, usePagination } from '../../../../../common';
import {
  karnatakaSwpService,
  isSiteClaimEligible,
  type ClaimEligibleSite,
} from '../../karnataka-services';

/* ───────── Payment Milestone Options for Karnataka SWP ───────── */
export interface PaymentMilestoneOption {
  id: string;
  label: string;
  percentage: number;
}

export const KARNATAKA_PAYMENT_MILESTONES: PaymentMilestoneOption[] = [
  { id: '20_phys', label: '20% on Physical Document', percentage: 20 },
  { id: '20_erp', label: '20% on ERP Doc Upload', percentage: 20 },
  { id: '30_kredl', label: '30% after KREDL Approval', percentage: 30 },
  { id: '15_klk', label: '15% on KLK Payment Receipt', percentage: 15 },
  { id: '15_amc', label: '15% over 5 Yrs AMC Reports', percentage: 15 },
];

/* ───────── Unified Single-Card Layout CSS with Floating Labels ───────── */
const SINGLE_CARD_FORM_CSS = `
.karnataka-single-card-form .ax-card {
  border: 1px solid var(--ax-border, #e2e8f0);
  border-radius: var(--ax-radius-xl, 16px);
  background: var(--ax-surface-solid, #ffffff);
  box-shadow: var(--ax-shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.05));
  overflow: hidden;
}

.karnataka-single-card-form .ax-card__header {
  padding: var(--ax-space-5, 20px) var(--ax-space-6, 24px);
  border-bottom: 1px solid var(--ax-border-subtle, #f1f5f9);
  background: var(--ax-surface-subtle, #f8fafc);
  display: flex;
  flex-direction: column;
  gap: var(--ax-space-4, 16px);
}

.karnataka-single-card-form .ax-card__body {
  padding: var(--ax-space-6, 24px);
}

/* Section Nav Pills */
.karnataka-section-pills {
  display: flex;
  gap: var(--ax-space-2, 8px);
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: thin;
}
.karnataka-section-pill-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 9999px;
  font-size: var(--ax-text-xs, 12px);
  font-weight: 500;
  white-space: nowrap;
  background: var(--ax-surface-solid, #ffffff);
  border: 1px solid var(--ax-border, #e2e8f0);
  color: var(--ax-text, #1e293b);
  cursor: pointer;
  transition: all 0.15s ease;
  text-decoration: none;
}
.karnataka-section-pill-btn:hover {
  border-color: var(--ax-accent, #2563eb);
  color: var(--ax-accent, #2563eb);
  background: rgba(37, 99, 235, 0.05);
}
.karnataka-section-pill-btn .pill-num {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--ax-surface-subtle, #f1f5f9);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
}

/* Section Block inside Single Card */
.karnataka-section-block {
  padding-top: var(--ax-space-2, 8px);
}
.karnataka-section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: var(--ax-space-2, 8px);
  margin-bottom: var(--ax-space-5, 20px);
  padding-bottom: var(--ax-space-3, 12px);
  border-bottom: 1px solid var(--ax-border-subtle, #f1f5f9);
}
.karnataka-section-title-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.karnataka-section-divider {
  border: 0;
  border-top: 1px dashed var(--ax-border, #cbd5e1);
  margin: var(--ax-space-8, 32px) 0 var(--ax-space-6, 24px);
}

/* Floating Label Core */
.ax-float {
  position: relative;
  width: 100%;
}
.ax-float__input {
  width: 100%;
  height: 46px;
  padding: 14px 14px 4px 14px;
  font-size: var(--ax-text-sm, 13.5px);
  background: var(--ax-surface-solid, #ffffff);
  border: 1px solid var(--ax-border, #cbd5e1);
  border-radius: var(--ax-radius-md, 8px);
  color: var(--ax-text, #0f172a);
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.ax-float__input::placeholder {
  color: transparent;
}
.ax-float__input:focus {
  border-color: var(--ax-accent, #2563eb);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.18);
}

/* Floating Label Text */
.ax-float__label {
  position: absolute;
  inset-inline-start: 12px;
  top: 50%;
  transform: translateY(-50%);
  margin: 0;
  padding: 0 4px;
  font-size: var(--ax-text-sm, 13px);
  color: var(--ax-text-subtle, #64748b);
  background: var(--ax-surface-solid, #ffffff);
  border-radius: var(--ax-radius-xs, 4px);
  pointer-events: none;
  transition: top 0.15s ease, font-size 0.15s ease, color 0.15s ease;
  z-index: 2;
  white-space: nowrap;
  max-width: calc(100% - 24px);
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Active Floating State */
.ax-float__input:focus + .ax-float__label,
.ax-float__input:not(:placeholder-shown) + .ax-float__label,
.ax-float--select .ax-float__label,
.ax-float--date .ax-float__label,
.ax-float--file .ax-float__label,
.ax-float--area .ax-float__label,
.ax-float--active .ax-float__label {
  top: 0;
  font-size: 11px;
  font-weight: 600;
  color: var(--ax-accent, #2563eb);
}
.ax-float__input:focus + .ax-float__label {
  color: var(--ax-accent, #2563eb);
}

.ax-float--area textarea.ax-float__input {
  height: auto;
  min-height: 80px;
  padding-top: 14px;
}

/* Custom File Upload with Floating Label */
.ax-float--file .ax-file-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ax-space-3, 12px);
  height: 46px;
  padding: 6px 12px;
  background: var(--ax-surface-solid, #ffffff);
  border: 1px solid var(--ax-border, #cbd5e1);
  border-radius: var(--ax-radius-md, 8px);
  cursor: pointer;
  transition: all 0.15s ease;
}
.ax-float--file .ax-file-box:hover {
  border-color: var(--ax-border-strong, #94a3b8);
  background: var(--ax-surface-subtle, #f8fafc);
}
.ax-float--file.is-invalid .ax-file-box {
  border-color: #ef4444 !important;
}
.ax-float--file.is-valid .ax-file-box {
  border-color: #10b981 !important;
}

/* Feedback Helper Messages */
.ax-field-feedback {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  font-size: 11px;
  min-height: 16px;
}
.ax-field-feedback--error {
  color: #ef4444;
}
.ax-field-feedback--success {
  color: #10b981;
}

/* Form Responsive Grid */
.karnataka-form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--ax-space-4, 16px);
}
@media (min-width: 1024px) {
  .karnataka-form-grid--3col {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Table layout */
.karnataka-single-card-form .ax-table-wrap {
  overflow-x: auto;
  border: 1px solid var(--ax-border, #e2e8f0);
  border-radius: var(--ax-radius-lg, 12px);
  background: var(--ax-surface-solid, #ffffff);
}
.karnataka-single-card-form .ax-table-wrap .ax-table {
  width: 100%;
  border-collapse: collapse;
}
.karnataka-single-card-form .ax-table th,
.karnataka-single-card-form .ax-table td {
  padding: 12px 14px;
  font-size: 13px;
  border-bottom: 1px solid var(--ax-border-subtle, #f1f5f9);
  vertical-align: middle;
}
.karnataka-single-card-form .ax-table th {
  background: var(--ax-surface-subtle, #f8fafc);
  font-weight: 600;
  color: var(--ax-text-strong, #0f172a);
}

/* Summary Card */
.karnataka-summary-box {
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.04) 0%, rgba(16, 185, 129, 0.04) 100%);
  border: 1px solid var(--ax-border, #cbd5e1);
  border-radius: var(--ax-radius-lg, 12px);
  padding: 18px 22px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
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
        <svg style={{ width: 12, height: 12, flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span>{error}</span>
      </div>
    );
  }
  if (isValid) {
    return (
      <div className="ax-field-feedback ax-field-feedback--success">
        <svg style={{ width: 12, height: 12, flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M5 12l5 5l10 -10" />
        </svg>
        <span>Valid</span>
      </div>
    );
  }
  return null;
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
}: {
  id: string;
  label: string;
  required?: boolean;
  value: string;
  onChange: (val: string) => void;
  onBlur: () => void;
  status?: FieldStatusProps;
  error?: string;
}) {
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
          {required && <span style={{ color: '#ef4444', marginLeft: 3 }}>*</span>}
        </label>
      </div>
      <FieldFeedback error={error} isValid={status.isValid} />
    </div>
  );
}

function FloatingSelect({
  id,
  label,
  required,
  placeholder = '-- Select Milestone Type --',
  value,
  options,
  onChange,
  onBlur,
  status = { className: '', isValid: false, isInvalid: false },
  error,
}: {
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
}) {
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
          {required && <span style={{ color: '#ef4444', marginLeft: 3 }}>*</span>}
        </label>
      </div>
      <FieldFeedback error={error} isValid={status.isValid} />
    </div>
  );
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
}: {
  id: string;
  label: string;
  required?: boolean;
  file: File | null;
  onChange: (file: File | null) => void;
  onBlur: () => void;
  status?: FieldStatusProps;
  error?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
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
              style={{ width: 18, height: 18, flexShrink: 0, color: '#64748b' }}
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
                fontSize: 12,
                color: file ? 'var(--ax-text-strong, #0f172a)' : 'var(--ax-text-subtle, #64748b)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {file ? file.name : 'Upload Document (PDF / Image)…'}
            </span>
          </div>
          {file ? (
            <button
              type="button"
              className="ax-btn ax-btn--ghost ax-btn--icon ax-btn--xs"
              onClick={handleClear}
              title="Remove file"
              style={{ color: '#ef4444' }}
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
          {required && <span style={{ color: '#ef4444', marginLeft: 3 }}>*</span>}
        </label>
      </div>
      <FieldFeedback error={error} isValid={status.isValid} />
    </div>
  );
}

function FloatingTextarea({
  id,
  label,
  required,
  placeholder = 'Provide invoice details, milestone notes, bank ref…',
  value,
  rows = 3,
  onChange,
  onBlur,
  status = { className: '', isValid: false, isInvalid: false },
  error,
}: {
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
}) {
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
          {required && <span style={{ color: '#ef4444', marginLeft: 3 }}>*</span>}
        </label>
      </div>
      <FieldFeedback error={error} isValid={status.isValid} />
    </div>
  );
}

/* ═══════════════════ MAIN COMPONENT ═══════════════════ */
export function KarnatakaAddPayment() {
  const navigate = useNavigate();

  // Eligible Sites state (100% Real API)
  const [eligibleSites, setEligibleSites] = useState<ClaimEligibleSite[]>([]);
  const [loadingSites, setLoadingSites] = useState(true);
  const [siteAmounts, setSiteAmounts] = useState<Record<number, number>>({});
  const [selectedSiteIds, setSelectedSiteIds] = useState<number[]>([]);

  // Form Fields
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [claimDate, setClaimDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [paymentType, setPaymentType] = useState<string>('20% on Physical Document');
  const [remarks, setRemarks] = useState<string>('');

  // Table Search
  const [siteSearch, setSiteSearch] = useState('');

  // Form Submission & Validation State
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load eligible sites from live backend
  useEffect(() => {
    let isMounted = true;
    const fetchSites = async () => {
      setLoadingSites(true);
      setServerError(null);
      try {
        const rawSites = await karnatakaSwpService.getClaimEligibleSites();
        if (isMounted) {
          // Strictly ensure BOTH Verify Status = Approved (1) AND Document Status = Approved (2)
          const strictlyEligible = rawSites.filter(isSiteClaimEligible);
          setEligibleSites(strictlyEligible);
          // Initialize amounts map
          const amountsMap: Record<number, number> = {};
          strictlyEligible.forEach((s) => {
            amountsMap[s.id] = Number(s.amount || s.total_amount || 50000);
          });
          setSiteAmounts(amountsMap);
        }
      } catch (err: any) {
        console.error('Failed to load eligible claim sites:', err);
        if (isMounted) {
          setServerError(err?.message || 'Failed to fetch eligible sites from server');
        }
      } finally {
        if (isMounted) setLoadingSites(false);
      }
    };
    fetchSites();
    return () => {
      isMounted = false;
    };
  }, []);

  // Determine current milestone percentage based on paymentType
  const currentPercentage = useMemo(() => {
    const matched = KARNATAKA_PAYMENT_MILESTONES.find(
      (m) => m.label.toLowerCase() === paymentType.toLowerCase() || m.id === paymentType
    );
    if (matched) return matched.percentage;
    const matchPct = paymentType.match(/(\d+)%/);
    return matchPct ? Number(matchPct[1]) : 20;
  }, [paymentType]);

  // Site selection toggle
  const toggleSite = (id: number) => {
    setSelectedSiteIds((prev) =>
      prev.includes(id) ? prev.filter((sId) => sId !== id) : [...prev, id]
    );
  };

  // Filtered sites based on search
  const filteredSites = useMemo(() => {
    if (!siteSearch.trim()) return eligibleSites;
    const q = siteSearch.toLowerCase();
    return eligibleSites.filter(
      (s) =>
        String(s.id).includes(q) ||
        (s.f_farmer_name && s.f_farmer_name.toLowerCase().includes(q)) ||
        (s.farmer_name && s.farmer_name.toLowerCase().includes(q)) ||
        (s.district && s.district.toLowerCase().includes(q))
    );
  }, [eligibleSites, siteSearch]);

  const allFilteredSelected =
    filteredSites.length > 0 && filteredSites.every((s) => selectedSiteIds.includes(s.id));

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = Array.from(new Set([...selectedSiteIds, ...filteredSites.map((s) => s.id)]));
      setSelectedSiteIds(allIds);
    } else {
      const filteredIdSet = new Set(filteredSites.map((s) => s.id));
      setSelectedSiteIds((prev) => prev.filter((id) => !filteredIdSet.has(id)));
    }
  };

  // Update individual site base amount
  const handleSiteAmountChange = (id: number, val: string) => {
    const num = Number(val);
    setSiteAmounts((prev) => ({
      ...prev,
      [id]: isNaN(num) || num < 0 ? 0 : num,
    }));
  };

  // Calculate live total amount of selected sites
  const totalCalculatedAmount = useMemo(() => {
    return selectedSiteIds.reduce((sum, siteId) => {
      const base = siteAmounts[siteId] ?? 50000;
      const calc = (base * currentPercentage) / 100;
      return sum + calc;
    }, 0);
  }, [selectedSiteIds, siteAmounts, currentPercentage]);

  // Paginated sites via usePagination hook from common
  const {
    paginatedData: paginatedSites,
    currentPage,
    pageSize,
    totalItems,
    setPage,
    setPageSize,
  } = usePagination({ data: filteredSites, initialPageSize: 25 });

  useEffect(() => {
    setPage(1);
  }, [siteSearch]);

  // Field validation
  const validateField = (name: string, value: unknown): string => {
    if (name === 'documentFile' && !value) {
      return 'Invoice / claim document is required.';
    }
    if (name === 'claimDate' && (!value || String(value).trim() === '')) {
      return 'Claim date is required.';
    }
    if (name === 'paymentType' && (!value || String(value).trim() === '')) {
      return 'Payment milestone type is required.';
    }
    if (name === 'remarks' && (!value || String(value).trim() === '')) {
      return 'Claim remarks are required.';
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

  // Scroll helper
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Submit Handler
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setServerError(null);
    setSuccessMessage(null);

    const errs: Record<string, string> = {
      documentFile: validateField('documentFile', documentFile),
      claimDate: validateField('claimDate', claimDate),
      paymentType: validateField('paymentType', paymentType),
      remarks: validateField('remarks', remarks),
    };
    setErrors(errs);

    if (Object.values(errs).some((e) => e)) {
      scrollToSection('sec-header-info');
      return;
    }

    if (selectedSiteIds.length === 0) {
      setServerError('Please select at least one eligible site from the table below.');
      scrollToSection('sec-sites-table');
      return;
    }

    if (totalCalculatedAmount <= 0) {
      setServerError('Total calculated claim amount must be greater than zero.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('amount', String(totalCalculatedAmount.toFixed(2)));
      formData.append('payment_type', paymentType);
      formData.append('date', claimDate);
      formData.append('remarks', remarks.trim());
      if (documentFile) {
        formData.append('file', documentFile);
      }
      selectedSiteIds.forEach((id) => {
        formData.append('site_id[]', String(id));
      });

      const res = await karnatakaSwpService.addClaim(formData);
      setSuccessMessage(res.message || 'Payment claim raised successfully!');
      setTimeout(() => {
        navigate('/v/karnataka/installation/swp/payment');
      }, 1500);
    } catch (err: any) {
      console.error('Submit claim error:', err);
      setServerError(err?.message || 'Failed to submit payment claim. Please check network.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="karnataka-single-card-form ax-page solar-erp-page">
      <style>{SINGLE_CARD_FORM_CSS}</style>

      {/* Page Header */}
      <PageHead
        title="Raise Karnataka SWP Payment Claim"
        subtitle="Submit vendor disbursement claim with milestone percentage calculation and supporting invoice"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Karnataka' },
          { label: 'Installation' },
          { label: 'SWP' },
          { label: 'Add Payment' },
        ]}
        actions={
          <div className="ax-cluster" style={{ gap: 8 }}>
            <Link to="/v/karnataka/installation/swp/payment" className="ax-btn ax-btn--secondary ax-btn--sm">
              &larr; View Claims Registry
            </Link>
          </div>
        }
      />

      {/* Success Notification */}
      {successMessage && (
        <div className="ax-banner ax-banner--success" role="status" style={{ marginBottom: 16 }}>
          <div className="ax-banner__content">
            <strong>✓ Success:</strong> {successMessage} Redirecting to payments registry…
          </div>
        </div>
      )}

      {/* Server Error Notification */}
      {serverError && (
        <div className="ax-banner ax-banner--danger" role="alert" style={{ marginBottom: 16 }}>
          <div className="ax-banner__content">
            <strong>✕ Error:</strong> {serverError}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="ax-card">
          {/* Card Header with Quick Nav Pills */}
          <div className="ax-card__header">
            <div>
              <h2 className="ax-card__title" style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                Vendor Disbursement &amp; Milestone Claim Form
              </h2>
              <p className="ax-card__subtitle" style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--ax-text-muted)' }}>
                Select milestone tranche, verify applicant sites, and review automated percentage calculation.
              </p>
            </div>

            <nav className="karnataka-section-pills" aria-label="Form section navigation">
              <button
                type="button"
                className="karnataka-section-pill-btn"
                onClick={() => scrollToSection('sec-header-info')}
              >
                <span className="pill-num">1</span>
                <span>Claim Header &amp; Milestone</span>
              </button>
              <button
                type="button"
                className="karnataka-section-pill-btn"
                onClick={() => scrollToSection('sec-sites-table')}
              >
                <span className="pill-num">2</span>
                <span>Eligible Sites Table ({selectedSiteIds.length})</span>
              </button>
              <button
                type="button"
                className="karnataka-section-pill-btn"
                onClick={() => scrollToSection('sec-summary-submit')}
              >
                <span className="pill-num">3</span>
                <span>Summary &amp; Submit</span>
              </button>
            </nav>
          </div>

          <div className="ax-card__body">
            {/* ════════════════════════════════════════════════════════
             * SECTION 1: Claim Header Info (Document, Date, Payment Type)
             * ════════════════════════════════════════════════════════ */}
            <div id="sec-header-info" className="karnataka-section-block">
              <div className="karnataka-section-header">
                <div className="karnataka-section-title-wrap">
                  <div className="ax-cluster" style={{ gap: 8, alignItems: 'center' }}>
                    <span className="ax-badge ax-badge--soft ax-badge--primary" style={{ fontWeight: 700 }}>
                      Section 1 of 3
                    </span>
                    <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--ax-text-strong)' }}>
                      Payment Claim Information
                    </h3>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--ax-text-muted)' }}>
                    Attach invoice documentation, specify invoice date, and select payment tranche.
                  </p>
                </div>
              </div>

              <div className="karnataka-form-grid karnataka-form-grid--3col">
                {/* 1. Document * */}
                <FloatingFileInput
                  id="claim-document"
                  label="Document"
                  required
                  file={documentFile}
                  onChange={(f) => {
                    setDocumentFile(f);
                    setErrors((prev) => ({ ...prev, documentFile: validateField('documentFile', f) }));
                  }}
                  onBlur={() => setTouched((prev) => ({ ...prev, documentFile: true }))}
                  status={getStatus('documentFile', documentFile)}
                  error={errors.documentFile}
                />

                {/* 2. Date * */}
                <FloatingDateInput
                  id="claim-date"
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

                {/* 3. Payment Type * */}
                <FloatingSelect
                  id="claim-payment-type"
                  label="Payment Type"
                  required
                  value={paymentType}
                  options={KARNATAKA_PAYMENT_MILESTONES.map((m) => ({
                    label: m.label,
                    value: m.label,
                  }))}
                  onChange={(val) => {
                    setPaymentType(val);
                    setErrors((prev) => ({ ...prev, paymentType: validateField('paymentType', val) }));
                  }}
                  onBlur={() => setTouched((prev) => ({ ...prev, paymentType: true }))}
                  status={getStatus('paymentType', paymentType)}
                  error={errors.paymentType}
                />
              </div>
            </div>

            <hr className="karnataka-section-divider" />

            {/* ════════════════════════════════════════════════════════
             * SECTION 2: Interactive Milestone Calculation Table
             * ════════════════════════════════════════════════════════ */}
            <div id="sec-sites-table" className="karnataka-section-block">
              <div className="karnataka-section-header">
                <div className="karnataka-section-title-wrap">
                  <div className="ax-cluster" style={{ gap: 8, alignItems: 'center' }}>
                    <span className="ax-badge ax-badge--soft ax-badge--primary" style={{ fontWeight: 700 }}>
                      Section 2 of 3
                    </span>
                    <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--ax-text-strong)' }}>
                      Select Installation Sites &amp; Verify Calculation
                    </h3>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--ax-text-muted)' }}>
                    Calculated Amount updates automatically at <b>{currentPercentage}%</b> based on selected payment milestone.
                  </p>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 6, padding: '4px 10px', borderRadius: 6, background: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: 11.5, color: '#15803d', fontWeight: 600 }}>
                    <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 14, height: 14, flexShrink: 0 }}>
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Strict Approval Rule: Only sites with <b>Verify Status: Approved</b> AND <b>Document Status: Approved</b> are displayed.</span>
                  </div>
                </div>

                <div className="ax-cluster" style={{ gap: 10, alignItems: 'center' }}>
                  <SearchInput
                    value={siteSearch}
                    onChange={setSiteSearch}
                    placeholder="Search applicant, ID, district…"
                    size="sm"
                    ariaLabel="Search eligible sites"
                  />
                  <span className="ax-badge ax-badge--soft ax-badge--primary" style={{ fontWeight: 700, padding: '6px 12px' }}>
                    {selectedSiteIds.length} of {eligibleSites.length} Selected
                  </span>
                </div>
              </div>

              {/* Table Container */}
              <div className="ax-table-wrap">
                <table className="ax-table">
                  <thead>
                    <tr>
                      <th style={{ width: 50, textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={allFilteredSelected}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          disabled={filteredSites.length === 0}
                          aria-label="Select all sites"
                          style={{ cursor: 'pointer' }}
                        />
                      </th>
                      <th>Applicant Details</th>
                      <th style={{ width: 220, textAlign: 'center' }}>Verify &amp; Doc Status</th>
                      <th style={{ width: 160 }}>Base Amount (₹)</th>
                      <th style={{ width: 130, textAlign: 'center' }}>Milestone (%)</th>
                      <th style={{ width: 180, textAlign: 'right' }}>Calculated Claim (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingSites ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--ax-text-muted)' }}>
                          <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading verified eligible sites from server…
                        </td>
                      </tr>
                    ) : filteredSites.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: 0 }}>
                          <TableEmptyState
                            title="No eligible sites found"
                            message={
                              siteSearch
                                ? 'No sites match your search query.'
                                : 'No sites currently qualify for payment claim. Sites must have BOTH Verify Status = Approved and Document Status = Approved to be eligible.'
                            }
                            onClear={siteSearch ? () => setSiteSearch('') : undefined}
                            clearLabel="Clear search"
                          />
                        </td>
                      </tr>
                    ) : (
                      paginatedSites.map((site) => {
                        const isSelected = selectedSiteIds.includes(site.id);
                        const baseAmt = siteAmounts[site.id] ?? 50000;
                        const calcAmt = (baseAmt * currentPercentage) / 100;
                        const farmerTitle = site.f_farmer_name || site.farmer_name || `Farmer ${site.id}`;

                        return (
                          <tr
                            key={site.id}
                            onClick={() => toggleSite(site.id)}
                            style={{
                              cursor: 'pointer',
                              background: isSelected ? 'rgba(37, 99, 235, 0.04)' : undefined,
                            }}
                          >
                            {/* 1. Select Checkbox */}
                            <td
                              style={{ textAlign: 'center' }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSite(site.id)}
                                style={{ cursor: 'pointer' }}
                                aria-label={`Select site ${site.id}`}
                              />
                            </td>

                            {/* 2. Applicant Name & Details */}
                            <td>
                              <div style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                                {farmerTitle}
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', marginTop: 2 }}>
                                Site ID: <b>{site.id}</b> · {site.district || 'Karnataka'} {site.pump_capacity ? `· ${site.pump_capacity}` : ''}
                              </div>
                            </td>

                            {/* 3. Verification & Doc Approval Status */}
                            <td style={{ textAlign: 'center' }}>
                              <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
                                <span className="ax-badge ax-badge--soft ax-badge--success" style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px' }}>
                                  ✓ Verify: Approved
                                </span>
                                <span className="ax-badge ax-badge--soft ax-badge--success" style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px' }}>
                                  ✓ Doc: Approved
                                </span>
                              </div>
                            </td>

                            {/* 4. Base Amount */}
                            <td onClick={(e) => e.stopPropagation()}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <span style={{ fontSize: 13, color: 'var(--ax-text-muted)' }}>₹</span>
                                <input
                                  type="number"
                                  className="ax-input"
                                  style={{ height: 32, fontSize: 12.5, width: 110 }}
                                  value={baseAmt}
                                  onChange={(e) => handleSiteAmountChange(site.id, e.target.value)}
                                  min="0"
                                  step="100"
                                />
                              </div>
                            </td>

                            {/* 5. Percentage (%) */}
                            <td style={{ textAlign: 'center' }}>
                              <span className="ax-badge ax-badge--soft ax-badge--info" style={{ fontWeight: 700 }}>
                                {currentPercentage}%
                              </span>
                            </td>

                            {/* 6. Calculated Amount */}
                            <td style={{ textAlign: 'right', fontWeight: 700, color: '#16a34a', fontSize: 13.5 }}>
                              ₹{calcAmt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: 14 }}>
                <Pagination
                  currentPage={currentPage}
                  pageSize={pageSize}
                  totalItems={totalItems}
                  onPageChange={setPage}
                  setPage={setPage}
                  onPageSizeChange={setPageSize}
                  pageSizeOptions={[10, 25, 50, 100]}
                />
              </div>
            </div>

            <hr className="karnataka-section-divider" />

            {/* ════════════════════════════════════════════════════════
             * SECTION 3: Summary Box & Remarks Submission
             * ════════════════════════════════════════════════════════ */}
            <div id="sec-summary-submit" className="karnataka-section-block">
              <div className="karnataka-section-header">
                <div className="karnataka-section-title-wrap">
                  <div className="ax-cluster" style={{ gap: 8, alignItems: 'center' }}>
                    <span className="ax-badge ax-badge--soft ax-badge--primary" style={{ fontWeight: 700 }}>
                      Section 3 of 3
                    </span>
                    <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--ax-text-strong)' }}>
                      Claim Summary &amp; Submission
                    </h3>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--ax-text-muted)' }}>
                    Review total claim amount, verified batch count, and add necessary claim notes.
                  </p>
                </div>
              </div>

              {/* Summary Box */}
              <div className="karnataka-summary-box">
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)', letterSpacing: '0.04em' }}>
                    Total Claim Amount
                  </span>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#2563eb', fontFamily: 'var(--ax-font-display)' }}>
                    ₹{totalCalculatedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>
                    Applied Tranche: <b>{paymentType}</b> ({currentPercentage}%)
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)', letterSpacing: '0.04em' }}>
                    Total Count
                  </span>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', fontFamily: 'var(--ax-font-display)' }}>
                    {selectedSiteIds.length} <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--ax-text-muted)' }}>Sites</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>
                    Eligible Batch Selection
                  </div>
                </div>
              </div>

              {/* Remarks * */}
              <FloatingTextarea
                id="claim-remarks"
                label="Remarks"
                required
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

          {/* Form Action Footer */}
          <div
            style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--ax-border, #e2e8f0)',
              background: 'var(--ax-surface-subtle, #f8fafc)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div style={{ fontSize: 13, color: 'var(--ax-text-muted)' }}>
              Selected: <b>{selectedSiteIds.length}</b> sites · Total: <b>₹{totalCalculatedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <Link to="/v/karnataka/installation/swp/payment" className="ax-btn ax-btn--secondary ax-btn--md">
                Cancel
              </Link>
              <button
                type="submit"
                className="ax-btn ax-btn--primary ax-btn--md"
                disabled={submitting || selectedSiteIds.length === 0}
                style={{ minWidth: 160 }}
              >
                {submitting ? 'Submitting Claim…' : 'Submit Claim'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default KarnatakaAddPayment;
