import { useState, useRef, type FormEvent, type ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';

// Unified Single-Card Layout with Floating Labels & Section Dividers matching Reference
const SINGLE_CARD_FORM_CSS = `
.solar-erp-page {
  --asw-primary: #2563eb;
  --asw-primary-rgb: 37, 99, 235;
}
.resco-inst-form .ax-card {
  border: 1px solid var(--ax-border, #e2e8f0);
  border-radius: var(--ax-radius-xl, 16px);
  background: var(--ax-surface-solid, #ffffff);
  box-shadow: var(--ax-shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
  overflow: hidden;
}
.resco-inst-form .ax-card__header {
  padding: var(--ax-space-5, 20px) var(--ax-space-6, 24px);
  border-bottom: 1px solid var(--ax-border-subtle, #f1f5f9);
  background: var(--ax-surface-subtle, #f8fafc);
  display: flex;
  flex-direction: column;
  gap: var(--ax-space-4, 16px);
}
.resco-inst-form .ax-card__body { padding: var(--ax-space-6, 24px); }

/* Quick Section Nav Pills */
.resco-section-pills {
  display: flex;
  gap: var(--ax-space-2, 8px);
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: thin;
}
.resco-section-pill-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: var(--ax-radius-pill, 9999px);
  font-size: var(--ax-text-xs, 12px);
  font-weight: 500;
  white-space: nowrap;
  background: var(--ax-surface-solid, #ffffff);
  border: 1px solid var(--ax-border, #e2e8f0);
  color: var(--ax-text, #1e293b);
  cursor: pointer;
  transition: all var(--ax-motion-fast, 150ms) var(--ax-ease-standard, ease);
}
.resco-section-pill-btn:hover {
  border-color: #2563eb;
  color: #2563eb;
  background: color-mix(in srgb, #2563eb 6%, var(--ax-surface-solid, #ffffff));
}
.resco-section-pill-btn .pill-num {
  width: 18px; height: 18px; border-radius: 50%;
  background: var(--ax-surface-subtle, #f1f5f9);
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 700;
}

/* Section Block */
.resco-section-block { padding-top: var(--ax-space-2, 8px); }
.resco-section-header {
  display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap;
  gap: var(--ax-space-2, 8px);
  margin-bottom: var(--ax-space-5, 20px);
  padding-bottom: var(--ax-space-3, 12px);
  border-bottom: 1px solid var(--ax-border-subtle, #f1f5f9);
}
.resco-section-title-wrap { display: flex; flex-direction: column; gap: 4px; }
.resco-section-divider {
  border: 0;
  border-top: 1px dashed var(--ax-border, #e2e8f0);
  margin: var(--ax-space-8, 32px) 0 var(--ax-space-6, 24px);
}

/* Floating Label Core */
.ax-float { position: relative; width: 100%; }
.ax-float__input {
  width: 100%;
  height: 46px;
  padding: 12px 14px 4px 14px;
  font-size: var(--ax-text-sm, 13px);
  background: var(--ax-surface-solid, #ffffff);
  border: 1px solid var(--ax-border, #cbd5e1);
  border-radius: var(--ax-radius-md, 8px);
  color: var(--ax-text, #0f172a);
  outline: none;
  transition: border-color var(--ax-motion-fast, 150ms) var(--ax-ease-standard, ease),
              box-shadow var(--ax-motion-fast, 150ms) var(--ax-ease-standard, ease);
}
.ax-float__input::placeholder { color: transparent; }
.ax-float__input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px color-mix(in srgb, #2563eb 20%, transparent);
}
.ax-float__input:disabled { opacity: .7; cursor: not-allowed; background: var(--ax-surface-subtle, #f8fafc); }

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
  transition: top var(--ax-motion-fast, 150ms) var(--ax-ease-standard, ease),
              font-size var(--ax-motion-fast, 150ms) var(--ax-ease-standard, ease),
              color var(--ax-motion-fast, 150ms) var(--ax-ease-standard, ease);
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
`;

interface FloatingInputProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  required?: boolean;
  disabled?: boolean;
  type?: string;
  placeholder?: string;
}

function FloatingInput({ label, name, value, onChange, required, disabled, type = 'text', placeholder }: FloatingInputProps) {
  const [focused, setFocused] = useState(false);
  const hasVal = Boolean(value && String(value).length > 0);

  return (
    <div className="ax-float">
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
        className="ax-float__input"
      />
      <label htmlFor={name} className={`ax-float__label ${focused ? 'floating' : hasVal ? 'has-val' : ''}`}>
        {label} {required && <span style={{ color: 'var(--ax-danger, #ef4444)' }}>*</span>}
      </label>
    </div>
  );
}

/* ───────── Modern Upload Dropzone ───────── */
interface UploadDropzoneProps {
  id: string;
  label: string;
  required?: boolean;
  disabled?: boolean;
  accept?: string;
  file: File | null;
  onSelect: (file: File) => void;
  onRemove: () => void;
  error?: string;
}

function UploadDropzone({
  id,
  label,
  required,
  disabled,
  accept = '.pdf,.doc,.docx,.xlsx,.xls,.png,.jpg,.jpeg',
  file,
  onSelect,
  onRemove,
  error,
}: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    onRemove();
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragging(false);
    const chosen = e.dataTransfer.files?.[0];
    if (chosen) {
      onSelect(chosen);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label
        htmlFor={id}
        style={{
          fontSize: '12.5px',
          fontWeight: 600,
          color: error ? 'var(--ax-danger-500, #ef4444)' : 'var(--ax-text-strong, #334155)',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <span>{label}</span>
        {required && <span style={{ color: 'var(--ax-danger-500, #ef4444)' }}>*</span>}
      </label>

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        disabled={disabled}
        style={{ display: 'none' }}
        onChange={(e) => {
          if (disabled) return;
          const f = e.target.files?.[0];
          if (f) onSelect(f);
        }}
      />

      <div
        onClick={() => {
          if (!disabled) inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onMouseEnter={() => {
          if (!disabled) setIsHovered(true);
        }}
        onMouseLeave={() => setIsHovered(false)}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        style={{
          border: disabled
            ? '1.5px dashed #cbd5e1'
            : isDragging
            ? '1.5px dashed #2563eb'
            : error
            ? '1.5px dashed var(--ax-danger-500, #ef4444)'
            : isHovered
            ? '1.5px dashed #94a3b8'
            : '1.5px dashed #cbd5e1',
          borderRadius: 8,
          background: disabled
            ? 'var(--ax-surface-subtle, #f8fafc)'
            : isDragging
            ? '#eff6ff'
            : error
            ? '#fef2f2'
            : isHovered
            ? '#fbfcfd'
            : '#ffffff',
          opacity: disabled ? 0.75 : 1,
          padding: file ? '12px 14px' : '22px 16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          minHeight: 110,
        }}
      >
        {file ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, textAlign: 'left' }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: '#ecfdf5',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong, #1e293b)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ax-text-muted, #64748b)', marginTop: 2 }}>
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
              Click to upload or drag &amp; drop
            </div>
            <div style={{ fontSize: 11, color: 'var(--ax-text-muted, #64748b)', marginTop: 3 }}>
              PDF, Word, Excel, JPG, JPEG or PNG (Max 10 MB) — single file
            </div>
          </>
        )}
      </div>

      {error && (
        <span style={{ fontSize: 11, color: 'var(--ax-danger-500, #ef4444)', marginTop: 2 }}>
          {error}
        </span>
      )}
    </div>
  );
}

const JAMMU_DISTRICTS = [
  'Jammu',
  'Samba',
  'Kathua',
  'Udhampur',
  'Reasi',
  'Rajouri',
  'Poonch',
  'Doda',
  'Ramban',
  'Kishtwar',
];

const DEFAULT_VENDORS = [
  { id: 'utkarsh', name: 'Utkarsh Solar Systems' },
  { id: 'Jammu TEsting', name: 'Jammu Renewable Developers' },
  { id: 'bharti', name: 'Bharti Clean Energy' },
  { id: '142', name: 'App Testing' },
  { id: '212', name: 'Mohit Solar Enterprises' },
];

export function AssignRescoInstallation() {
  const navigate = useNavigate();

  // Form states
  const [vendorName, setVendorName] = useState('');
  const [volume, setVolume] = useState('Volume 1');
  const [category, setCategory] = useState('Institutional');
  const [district, setDistrict] = useState('');
  const [subDivision, setSubDivision] = useState('');
  const [siteName, setSiteName] = useState('');
  const [siteAddress, setSiteAddress] = useState('');
  const [capacityKw, setCapacityKw] = useState('');
  const [caNo, setCaNo] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [deadlineDate, setDeadlineDate] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [remarks, setRemarks] = useState('');

  // Status & Feedback
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Section refs for navigation pills
  const sec1 = useRef<HTMLDivElement>(null);
  const sec2 = useRef<HTMLDivElement>(null);
  const sec3 = useRef<HTMLDivElement>(null);
  const sec4 = useRef<HTMLDivElement>(null);

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleReset = () => {
    setVendorName('');
    setVolume('Volume 1');
    setCategory('Institutional');
    setDistrict('');
    setSubDivision('');
    setSiteName('');
    setSiteAddress('');
    setCapacityKw('');
    setCaNo('');
    setContactPerson('');
    setContactPhone('');
    setDeadlineDate('');
    setFile(null);
    setRemarks('');
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!vendorName.trim()) {
      setErrorMsg('Please select a Vendor Name.');
      return;
    }
    if (!district.trim()) {
      setErrorMsg('Please select a District.');
      return;
    }
    if (!siteName.trim()) {
      setErrorMsg('Site / Institutional Name is required.');
      return;
    }
    if (!deadlineDate) {
      setErrorMsg('Target Commissioning Deadline Date is required.');
      return;
    }

    try {
      setSubmitting(true);
      // Simulate/persist assignment
      setSuccessMsg(`RESCO rooftop solar site "${siteName}" (${district}) allocated successfully to vendor "${vendorName}".`);
      setTimeout(() => {
        navigate('/v/jammu/installation/resco/assigned-sites');
      }, 1400);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to submit RESCO assignment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ax-page resco-inst-form solar-erp-page">
      <style>{SINGLE_CARD_FORM_CSS}</style>

      {/* Page Head */}
      <PageHead
        title="Assign Jammu RESCO Installation"
        subtitle="Allocate rooftop solar RESCO projects and commercial site work orders to vendors across Jammu & Kashmir"
        breadcrumbs={[
          { label: 'Home', href: '/vendor-management' },
          { label: 'Jammu' },
          { label: 'Installation' },
          { label: 'RESCO' },
          { label: 'Assign Installation' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)' }}>
            <Link
              to="/v/jammu/installation/resco/assigned-sites"
              className="ax-btn ax-btn--secondary ax-btn--sm"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ marginRight: 6 }}
              >
                <path d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
                <path d="M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6" />
              </svg>
              View Assigned Sites
            </Link>
            <Link
              to="/vendor-management/jammu/installation/resco/dashboard"
              className="ax-btn ax-btn--ghost ax-btn--sm"
            >
              RESCO Dashboard
            </Link>
          </div>
        }
      />

      {/* Status Alerts */}
      {errorMsg && (
        <div
          style={{
            padding: '12px 16px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>{errorMsg}</span>
          <button
            type="button"
            onClick={() => setErrorMsg('')}
            style={{ background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer', fontSize: 16 }}
          >
            ×
          </button>
        </div>
      )}

      {successMsg && (
        <div
          style={{
            padding: '12px 16px',
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#065f46',
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>{successMsg}</span>
          <span style={{ fontSize: 12, opacity: 0.8 }}>Redirecting...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="ax-card">
        {/* Header with Quick Navigation Pills */}
        <div className="ax-card__header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h2 className="ax-card__title" style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--ax-text-strong, #0f172a)' }}>
                Assign RESCO Installation Site
              </h2>
              <p className="ax-card__subtitle" style={{ fontSize: '0.85rem', color: '#ef4444', margin: '4px 0 0' }}>
                The field labels marked with * are required input fields.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="ax-badge ax-badge--soft ax-badge--info ax-badge--pill" style={{ fontWeight: 600, padding: '4px 12px', fontSize: 12 }}>
                <span className="ax-badge__dot" /> Rooftop Solar RESCO
              </span>
            </div>
          </div>

          {/* Quick Nav Pills */}
          <div className="resco-section-pills">
            <button type="button" className="resco-section-pill-btn" onClick={() => scrollTo(sec1)}>
              <span className="pill-num">1</span> Vendor &amp; Volume Allocation
            </button>
            <button type="button" className="resco-section-pill-btn" onClick={() => scrollTo(sec2)}>
              <span className="pill-num">2</span> District &amp; Territory Allocation
            </button>
            <button type="button" className="resco-section-pill-btn" onClick={() => scrollTo(sec3)}>
              <span className="pill-num">3</span> Technical &amp; Net-Metering
            </button>
            <button type="button" className="resco-section-pill-btn" onClick={() => scrollTo(sec4)}>
              <span className="pill-num">4</span> Timeline &amp; Work Order
            </button>
          </div>
        </div>

        <div className="ax-card__body">
          {/* Section 1: Vendor & Volume Allocation */}
          <div ref={sec1} className="resco-section-block">
            <div className="resco-section-header">
              <div className="resco-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>1. Vendor &amp; Volume Allocation</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Select authorized partner vendor, project volume, and institutional category
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {/* Vendor Name * */}
              <div className="ax-float">
                <select
                  id="vendor_select"
                  className="ax-float__input"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  disabled={submitting}
                  required
                >
                  <option value="">-- Select Vendor --</option>
                  {DEFAULT_VENDORS.map((v) => (
                    <option key={v.id} value={v.name}>
                      {v.name}
                    </option>
                  ))}
                </select>
                <label htmlFor="vendor_select" className="ax-float__label floating">
                  Vendor Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              {/* State (Read only) */}
              <div className="ax-float">
                <input
                  type="text"
                  id="state_input"
                  className="ax-float__input"
                  value="Jammu & Kashmir"
                  readOnly
                  disabled
                />
                <label htmlFor="state_input" className="ax-float__label floating">
                  State <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              {/* Volume */}
              <div className="ax-float">
                <select
                  id="volume_select"
                  className="ax-float__input"
                  value={volume}
                  onChange={(e) => setVolume(e.target.value)}
                  disabled={submitting}
                  required
                >
                  <option value="Volume 1">Volume 1 (General Rooftop)</option>
                  <option value="Volume 2">Volume 2 (Commercial / Gov)</option>
                  <option value="Volume 3">Volume 3 (Special Institutional)</option>
                </select>
                <label htmlFor="volume_select" className="ax-float__label floating">
                  Volume <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              {/* Project Category */}
              <div className="ax-float">
                <select
                  id="category_select"
                  className="ax-float__input"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={submitting}
                >
                  <option value="Institutional">Institutional Building</option>
                  <option value="Government">Government Office / Complex</option>
                  <option value="Commercial">Commercial Establishment</option>
                  <option value="Educational">College / University / School</option>
                  <option value="Hospital">Hospital / Healthcare</option>
                </select>
                <label htmlFor="category_select" className="ax-float__label floating">
                  Building Category
                </label>
              </div>
            </div>
          </div>

          <hr className="resco-section-divider" />

          {/* Section 2: District & Territory Allocation */}
          <div ref={sec2} className="resco-section-block">
            <div className="resco-section-header">
              <div className="resco-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>2. District &amp; Territory Details</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Location and geographical jurisdiction for solar plant deployment
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {/* District * */}
              <div className="ax-float">
                <select
                  id="district_select"
                  className="ax-float__input"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  disabled={submitting}
                  required
                >
                  <option value="">-- Select District --</option>
                  {JAMMU_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <label htmlFor="district_select" className="ax-float__label floating">
                  District <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              {/* Sub-Division / Block */}
              <FloatingInput
                label="Tehsil / Sub-Division"
                name="subDivision"
                value={subDivision}
                onChange={(e) => setSubDivision(e.target.value)}
                placeholder="e.g. Jammu South, Gandhinagar"
              />

              {/* Site Name * */}
              <FloatingInput
                label="Site / Institutional Name"
                name="siteName"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                required
                placeholder="e.g. Govt Degree College Kathua"
              />

              {/* Site Address */}
              <FloatingInput
                label="Site Street Address / Landmark"
                name="siteAddress"
                value={siteAddress}
                onChange={(e) => setSiteAddress(e.target.value)}
                placeholder="Complete postal address with PIN"
              />
            </div>
          </div>

          <hr className="resco-section-divider" />

          {/* Section 3: Technical & Net-Metering Details */}
          <div ref={sec3} className="resco-section-block">
            <div className="resco-section-header">
              <div className="resco-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>3. Technical &amp; Net-Metering Parameters</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Target solar capacity, DISCOM electricity account, and nodal officer contacts
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {/* Capacity kW */}
              <FloatingInput
                label="Proposed Solar Plant Capacity (kW)"
                name="capacityKw"
                type="number"
                value={capacityKw}
                onChange={(e) => setCapacityKw(e.target.value)}
                placeholder="e.g. 50"
              />

              {/* CA No */}
              <FloatingInput
                label="Consumer Account (CA) No. / Meter No."
                name="caNo"
                value={caNo}
                onChange={(e) => setCaNo(e.target.value)}
                placeholder="e.g. CA-JK-88219"
              />

              {/* Contact Person */}
              <FloatingInput
                label="Nodal Contact Person"
                name="contactPerson"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="Full name of site engineer / manager"
              />

              {/* Contact Phone */}
              <FloatingInput
                label="Nodal Contact Phone Number"
                name="contactPhone"
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="10-digit mobile number"
              />
            </div>
          </div>

          <hr className="resco-section-divider" />

          {/* Section 4: Timeline & Work Order Document */}
          <div ref={sec4} className="resco-section-block">
            <div className="resco-section-header">
              <div className="resco-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>4. Timeline &amp; Work Order Document</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Work allocation deadline, project layout files, and special commissioning guidelines
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {/* Deadline Date * */}
              <div className="ax-float">
                <input
                  type="date"
                  id="deadline_date"
                  name="deadlineDate"
                  className="ax-float__input"
                  value={deadlineDate}
                  onChange={(e) => setDeadlineDate(e.target.value)}
                  disabled={submitting}
                  required
                />
                <label htmlFor="deadline_date" className="ax-float__label floating">
                  Target Commissioning Deadline <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              {/* Remarks */}
              <div className="ax-float" style={{ gridColumn: '1 / -1' }}>
                <textarea
                  id="remarks_input"
                  className="ax-float__input"
                  style={{ height: 'auto', minHeight: 80, paddingTop: 14, resize: 'vertical' }}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  disabled={submitting}
                  placeholder="Special guidelines, rooftop shadow considerations, grid interconnectivity details..."
                />
                <label htmlFor="remarks_input" className="ax-float__label floating">
                  Special Guidelines / Work Order Remarks
                </label>
              </div>

              {/* File Dropzone */}
              <div style={{ gridColumn: '1 / -1' }}>
                <UploadDropzone
                  id="resco_work_order_file"
                  label="Site Layout / Sanction Work Order File"
                  accept=".pdf,.doc,.docx,.xlsx,.xls,.png,.jpg,.jpeg"
                  file={file}
                  onSelect={(f) => setFile(f)}
                  onRemove={() => setFile(null)}
                  disabled={submitting}
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 12,
              marginTop: 32,
              paddingTop: 16,
              borderTop: '1px solid var(--ax-border, #e2e8f0)',
            }}
          >
            <button
              type="button"
              className="ax-btn ax-btn--secondary"
              onClick={handleReset}
              disabled={submitting}
            >
              Reset Form
            </button>
            <button
              type="submit"
              className="ax-btn ax-btn--primary"
              disabled={submitting}
              style={{ minWidth: 180 }}
            >
              {submitting ? 'Allocating Site…' : 'Submit RESCO Assignment →'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default AssignRescoInstallation;
