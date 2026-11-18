import { useState, useRef, useMemo, type FormEvent, type ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  JAMMU_RESCO_DISTRICTS,
  JAMMU_RESCO_VOLUMES,
  JAMMU_RESCO_VENDORS,
  JAMMU_RESCO_SITES_CATALOG,
  jammuRescoAdminService,
  type RescoSiteItem,
} from './jammuRescoAdminService';

// Unified Single-Card Layout with Floating Labels & Section Dividers
const SINGLE_CARD_FORM_CSS = `
.solar-erp-page {
  --asw-primary: #2559bf;
  --asw-primary-rgb: 37, 89, 191;
  --ax-primary: #2559bf;
  --ax-primary-hover: #1e4699;
  --ax-primary-rgb: 37, 89, 191;
}
.solar-erp-page .ax-btn--primary,
.solar-erp-page .ax-button--primary {
  background: #2559bf !important;
  border-color: #2559bf !important;
  color: #ffffff !important;
}
.solar-erp-page .ax-btn--primary:hover,
.solar-erp-page .ax-button--primary:hover {
  background: #1e4699 !important;
  border-color: #1e4699 !important;
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
  border-color: #2559bf;
  color: #2559bf;
  background: color-mix(in srgb, #2559bf 6%, var(--ax-surface-solid, #ffffff));
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
  border-color: #2559bf;
  box-shadow: 0 0 0 3px color-mix(in srgb, #2559bf 20%, transparent);
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
  color: #2559bf;
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
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
    </div>
  );
}

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
  accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png',
  file,
  onSelect,
  onRemove,
  error,
}: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    onRemove();
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label
        htmlFor={id}
        style={{
          fontSize: '12.5px',
          fontWeight: 600,
          color: error ? '#ef4444' : '#334155',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <span>{label}</span>
        {required && <span style={{ color: '#ef4444' }}>*</span>}
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
        onDrop={(e) => {
          e.preventDefault();
          if (disabled) return;
          setIsDragging(false);
          const chosen = e.dataTransfer.files?.[0];
          if (chosen) onSelect(chosen);
        }}
        role="button"
        tabIndex={disabled ? -1 : 0}
        style={{
          border: isDragging ? '1.5px dashed #2559bf' : '1.5px dashed #cbd5e1',
          borderRadius: 8,
          background: isDragging ? '#eff6ff' : '#ffffff',
          padding: file ? '12px 14px' : '22px 16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          minHeight: 110,
        }}
      >
        {file ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
                }}
              >
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{file.name}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{(file.size / 1024).toFixed(0)} KB · Ready to upload</div>
              </div>
            </div>
            <button
              type="button"
              className="ax-btn ax-btn--ghost ax-btn--sm"
              onClick={handleClear}
              style={{ color: '#ef4444' }}
            >
              Remove
            </button>
          </div>
        ) : (
          <>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#eff6ff', color: '#2559bf', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                <path d="M12 12v9" />
                <path d="m8 16 4-4 4 4" />
              </svg>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>Click to upload or drag &amp; drop PO Document</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>PDF, DOC, DOCX, JPG or PNG (Max 10MB)</div>
          </>
        )}
      </div>
    </div>
  );
}

export function AssignRescoInstallation() {
  const navigate = useNavigate();

  // Form states matching required fields
  const [vendorName, setVendorName] = useState('');
  const [volume, setVolume] = useState('');
  const [district, setDistrict] = useState('');
  const [selectedSiteIds, setSelectedSiteIds] = useState<number[]>([]);
  const [siteSearch, setSiteSearch] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [remarks, setRemarks] = useState('');

  // Status feedback
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

  // Filtered sites based on selected district and search query
  const eligibleSites = useMemo(() => {
    let list = JAMMU_RESCO_SITES_CATALOG;
    if (district) {
      list = list.filter((s) => s.district.toLowerCase() === district.toLowerCase());
    }
    if (siteSearch.trim()) {
      const q = siteSearch.trim().toLowerCase();
      list = list.filter(
        (s) =>
          s.site_name.toLowerCase().includes(q) ||
          (s.ca_no && s.ca_no.toLowerCase().includes(q)) ||
          (s.department && s.department.toLowerCase().includes(q))
      );
    }
    return list;
  }, [district, siteSearch]);

  const handleToggleSite = (id: number) => {
    setSelectedSiteIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };

  const handleSelectAll = () => {
    if (selectedSiteIds.length === eligibleSites.length) {
      setSelectedSiteIds([]);
    } else {
      setSelectedSiteIds(eligibleSites.map((s) => s.id));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!vendorName) return setErrorMsg('Vendor Name is required.');
    if (!volume) return setErrorMsg('Volume is required.');
    if (!district) return setErrorMsg('District is required.');
    if (selectedSiteIds.length === 0) return setErrorMsg('Please select at least one Site Name.');

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('vendor', vendorName);
      fd.append('volume', volume);
      fd.append('district', district);
      selectedSiteIds.forEach((id) => fd.append('site_id[]', String(id)));
      if (file) fd.append('file', file);
      if (remarks.trim()) fd.append('remarks', remarks.trim());

      const res = await jammuRescoAdminService.submitAssignInstallation(fd);
      setSuccessMsg(res.message || 'Jammu RESCO Installation Assigned Successfully!');

      setTimeout(() => {
        navigate('/vendor-management/jammu/installation/resco/view-assign-installation');
      }, 1500);
    } catch (err: any) {
      console.error('Submit assign error:', err);
      setErrorMsg(err?.message || 'Failed to assign RESCO installation.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="solar-erp-page resco-inst-form">
      <style>{SINGLE_CARD_FORM_CSS}</style>

      {/* Page Head */}
      <PageHead
        title="Assign Jammu Resco Installation"
        subtitle="The field labels marked with * are required input fields."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Jammu', href: '/vendor-management/jammu' },
          { label: 'RESCO Installation', href: '/vendor-management/jammu/installation/resco/dashboard' },
          { label: 'Assign Jammu Resco Installation' },
        ]}
        actions={
          <Link
            to="/vendor-management/jammu/installation/resco/view-assign-installation"
            className="ax-btn ax-btn--primary ax-btn--sm"
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
            View Assign Jammu Resco Installation
          </Link>
        }
      />

      {/* Status Feedback Banners */}
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
          <span>✕ {errorMsg}</span>
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
          <span>✓ {successMsg}</span>
          <span style={{ fontSize: 12, opacity: 0.8 }}>Redirecting to View Assigned...</span>
        </div>
      )}

      {/* Main Single Card Form */}
      <form onSubmit={handleSubmit} className="ax-card">
        {/* Header with Section Pills */}
        <div className="ax-card__header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h2 className="ax-card__title" style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                Assign Jammu Resco Installation
              </h2>
              <p className="ax-card__subtitle" style={{ fontSize: '0.85rem', color: '#ef4444', margin: '4px 0 0' }}>
                The field labels marked with * are required input fields.
              </p>
            </div>
            {selectedSiteIds.length > 0 && (
              <span className="ax-badge ax-badge--soft ax-badge--info" style={{ fontWeight: 600, padding: '4px 12px', fontSize: 12 }}>
                {selectedSiteIds.length} Site(s) Selected
              </span>
            )}
          </div>

          {/* Quick Nav Pills */}
          <div className="resco-section-pills">
            <button type="button" className="resco-section-pill-btn" onClick={() => scrollTo(sec1)}>
              <span className="pill-num">1</span> Vendor Name &amp; Volume
            </button>
            <button type="button" className="resco-section-pill-btn" onClick={() => scrollTo(sec2)}>
              <span className="pill-num">2</span> District
            </button>
            <button type="button" className="resco-section-pill-btn" onClick={() => scrollTo(sec3)}>
              <span className="pill-num">3</span> Site Name
            </button>
            <button type="button" className="resco-section-pill-btn" onClick={() => scrollTo(sec4)}>
              <span className="pill-num">4</span> File &amp; Remarks
            </button>
          </div>
        </div>

        <div className="ax-card__body">
          {/* Section 1: Vendor Name * & Volume * */}
          <div ref={sec1} className="resco-section-block">
            <div className="resco-section-header">
              <div className="resco-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>1. Vendor &amp; Volume Allocation</h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Select authorized EPC vendor partner and allocation volume
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
                  {JAMMU_RESCO_VENDORS.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
                <label htmlFor="vendor_select" className="ax-float__label floating">
                  Vendor Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              {/* Volume * */}
              <div className="ax-float">
                <select
                  id="volume_select"
                  className="ax-float__input"
                  value={volume}
                  onChange={(e) => setVolume(e.target.value)}
                  disabled={submitting}
                  required
                >
                  <option value="">-- Select Volume --</option>
                  {JAMMU_RESCO_VOLUMES.map((vol) => (
                    <option key={vol} value={vol}>
                      Volume {vol}
                    </option>
                  ))}
                </select>
                <label htmlFor="volume_select" className="ax-float__label floating">
                  Volume <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>
            </div>
          </div>

          <hr className="resco-section-divider" />

          {/* Section 2: District * */}
          <div ref={sec2} className="resco-section-block">
            <div className="resco-section-header">
              <div className="resco-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>2. District Allocation</h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Choose targeted Jammu &amp; Kashmir district for rooftop solar installation
                </span>
              </div>
            </div>

            <div style={{ maxWidth: '480px' }}>
              <div className="ax-float">
                <select
                  id="district_select"
                  className="ax-float__input"
                  value={district}
                  onChange={(e) => {
                    setDistrict(e.target.value);
                    setSelectedSiteIds([]);
                  }}
                  disabled={submitting}
                  required
                >
                  <option value="">-- Select District --</option>
                  {JAMMU_RESCO_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <label htmlFor="district_select" className="ax-float__label floating">
                  District <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>
            </div>
          </div>

          <hr className="resco-section-divider" />

          {/* Section 3: Site Name * */}
          <div ref={sec3} className="resco-section-block">
            <div className="resco-section-header">
              <div className="resco-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
                  3. Site Name <span style={{ color: '#ef4444' }}>*</span>
                </h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Select eligible rooftop institutional or government sites to allocate
                </span>
              </div>
              {eligibleSites.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#2559bf' }}>
                    {selectedSiteIds.length} of {eligibleSites.length} Selected
                  </span>
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="ax-btn ax-btn--secondary ax-btn--sm"
                    style={{ fontSize: 11, padding: '3px 10px' }}
                  >
                    {selectedSiteIds.length === eligibleSites.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
              )}
            </div>

            {/* Quick dropdown for Site Name */}
            <div className="ax-float" style={{ marginBottom: 16, maxWidth: '640px' }}>
              <select
                id="site_quick_dropdown"
                className="ax-float__input"
                value=""
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val && !selectedSiteIds.includes(val)) {
                    setSelectedSiteIds((prev) => [...prev, val]);
                  }
                }}
                disabled={submitting || eligibleSites.length === 0}
              >
                <option value="">
                  {eligibleSites.length === 0
                    ? '-- No sites available for selected district --'
                    : '-- Select Site Name --'}
                </option>
                {eligibleSites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.site_name} ({s.capacity_kw ? `${s.capacity_kw} kW` : ''} • {s.district})
                  </option>
                ))}
              </select>
              <label htmlFor="site_quick_dropdown" className="ax-float__label floating">
                Site Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
            </div>

            {/* Site search & selectable cards */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden', background: '#ffffff' }}>
              <div style={{ padding: '8px 12px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <input
                  type="text"
                  className="ax-form-input"
                  value={siteSearch}
                  onChange={(e) => setSiteSearch(e.target.value)}
                  placeholder="Filter site name, department, CA number..."
                  style={{ width: '100%', padding: '6px 12px', fontSize: 12, borderRadius: 6, border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ maxHeight: 260, overflowY: 'auto', padding: 10 }}>
                {eligibleSites.length === 0 ? (
                  <div style={{ padding: 20, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                    No rooftop sites found matching your filter.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
                    {eligibleSites.map((s) => {
                      const isSelected = selectedSiteIds.includes(s.id);
                      return (
                        <div
                          key={s.id}
                          onClick={() => handleToggleSite(s.id)}
                          style={{
                            padding: '8px 12px',
                            borderRadius: 8,
                            border: `1.5px solid ${isSelected ? '#2559bf' : '#e2e8f0'}`,
                            background: isSelected ? '#eff6ff' : '#ffffff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            fontSize: 12,
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSite(s.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {s.site_name}
                            </div>
                            <div style={{ fontSize: 11, color: '#64748b' }}>
                              {s.capacity_kw ? `${s.capacity_kw} kW • ` : ''}
                              {s.district} • {s.department || 'Govt Building'}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <hr className="resco-section-divider" />

          {/* Section 4: File & Remarks */}
          <div ref={sec4} className="resco-section-block">
            <div className="resco-section-header">
              <div className="resco-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>4. Work Order PO File &amp; Remarks</h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Attach formal sanction/PO document and optional vendor instructions
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: 20 }}>
              {/* Remarks */}
              <div>
                <FloatingInput
                  label="Remarks"
                  name="remarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  disabled={submitting}
                  placeholder="Enter assignment remarks, priority instructions..."
                />
              </div>
            </div>

            {/* File Dropzone */}
            <div style={{ maxWidth: 540 }}>
              <UploadDropzone
                id="assign_file"
                label="File"
                file={file}
                onSelect={setFile}
                onRemove={() => setFile(null)}
                disabled={submitting}
              />
            </div>
          </div>

          {/* Submit Footer */}
          <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px' }}>
            <Link to="/vendor-management/jammu/installation/resco/view-assign-installation" className="ax-btn ax-btn--secondary">
              Cancel
            </Link>
            <button
              type="submit"
              className="ax-btn ax-btn--primary"
              disabled={submitting || selectedSiteIds.length === 0}
              style={{ minWidth: 180, fontWeight: 700 }}
            >
              {submitting ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <span className="ax-spinner" /> Assigning...
                </span>
              ) : (
                'Assign Jammu Resco Installation'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default AssignRescoInstallation;
