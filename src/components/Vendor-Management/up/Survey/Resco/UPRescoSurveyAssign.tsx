import { useState, useEffect, useRef, useMemo, type FormEvent, type ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  upRescoSurveyAdminService,
  type UpVendorItem,
} from '../../up-services';

// Unified Single-Card Layout with Floating Labels & Section Dividers
const SINGLE_CARD_FORM_CSS = `
.swp-inst-form .ax-card {
  border: 1px solid var(--ax-border, #cbd5e1);
  border-radius: var(--ax-radius-xl, 16px);
  background: var(--ax-surface-solid, #ffffff);
  box-shadow: var(--ax-shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.05));
  overflow: hidden;
}
.swp-inst-form .ax-card__header {
  padding: var(--ax-space-5, 20px) var(--ax-space-6, 24px);
  border-bottom: 1px solid var(--ax-border-subtle, #f1f5f9);
  background: var(--ax-surface-subtle, #f8fafc);
  display: flex;
  flex-direction: column;
  gap: var(--ax-space-4, 16px);
}
.swp-inst-form .ax-card__body { padding: var(--ax-space-6, 24px); }

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
  font-size: var(--ax-text-sm, 13px);
  background: var(--ax-surface-solid, #ffffff);
  border: 1px solid var(--ax-border, #cbd5e1);
  border-radius: var(--ax-radius-md, 8px);
  color: var(--ax-text, #0f172a);
  outline: none;
  transition: border-color var(--ax-motion-fast, 0.15s) var(--ax-ease-standard, ease),
              box-shadow var(--ax-motion-fast, 0.15s) var(--ax-ease-standard, ease);
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

/* ───────── Upload Dropzone ───────── */
interface UploadDropzoneProps {
  id: string;
  label: string;
  required?: boolean;
  disabled?: boolean;
  accept?: string;
  file: File | null;
  preview?: string;
  onSelect: (file: File) => void;
  onRemove: () => void;
  error?: string;
}

function UploadDropzone({
  id,
  label,
  required,
  disabled,
  accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx,.xlsx,.xls',
  file,
  preview,
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
          padding: file || preview ? '12px 14px' : '22px 16px',
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
        {file || preview ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, textAlign: 'left' }}>
              {preview ? (
                <img
                  src={preview}
                  alt={label}
                  style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--ax-border, #cbd5e1)' }}
                />
              ) : (
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
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong, #1e293b)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file ? file.name : label}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ax-text-muted, #64748b)', marginTop: 2 }}>
                  {file ? `${(file.size / 1024).toFixed(0)} KB · Ready to upload` : 'File selected'}
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
              PDF, JPG, PNG, DOC or Excel (Max 5 MB)
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

export function UPRescoSurveyAssign() {
  const navigate = useNavigate();

  // Master datasets
  const [vendors, setVendors] = useState<UpVendorItem[]>([]);
  const [volumes, setVolumes] = useState<Array<{ volume: string | number }>>([]);
  const [districts, setDistricts] = useState<Array<{ district: string }>>([]);
  const [sites, setSites] = useState<Array<{ id: number; site_name: string; connected?: string; [key: string]: any }>>([]);

  // Form values
  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [selectedVolume, setSelectedVolume] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedSiteIds, setSelectedSiteIds] = useState<number[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | undefined>(undefined);
  const [remarks, setRemarks] = useState<string>('');

  // Loading States
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [districtsLoading, setDistrictsLoading] = useState<boolean>(false);
  const [sitesLoading, setSitesLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const [siteFilterQuery, setSiteFilterQuery] = useState<string>('');

  // Section refs for navigation pills
  const sec1 = useRef<HTMLDivElement>(null);
  const sec2 = useRef<HTMLDivElement>(null);
  const sec3 = useRef<HTMLDivElement>(null);
  const sec4 = useRef<HTMLDivElement>(null);

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // 1. Initial Load: Vendors & Volumes (API 1: GET /up/resco/survey/assign)
  useEffect(() => {
    let active = true;
    const loadInit = async () => {
      setInitialLoading(true);
      setErrorMsg('');
      try {
        const res = await upRescoSurveyAdminService.getAssignFormData();
        if (!active) return;
        setVendors(res.vendors || []);
        setVolumes(res.volumes || []);
      } catch (err: any) {
        if (!active) return;
        console.error('Initial load error:', err);
        setErrorMsg(err?.message || 'Failed to fetch vendors and volumes.');
      } finally {
        if (active) setInitialLoading(false);
      }
    };
    loadInit();
    return () => {
      active = false;
    };
  }, []);

  // 2. Volume Change -> Fetch Districts (API 2: GET /up/resco/survey/fetch-district)
  useEffect(() => {
    if (!selectedVolume) {
      setDistricts([]);
      setSelectedDistrict('');
      setSites([]);
      setSelectedSiteIds([]);
      return;
    }

    let active = true;
    const loadDistricts = async () => {
      setDistrictsLoading(true);
      setErrorMsg('');
      try {
        const dList = await upRescoSurveyAdminService.fetchDistricts(selectedVolume);
        if (!active) return;
        setDistricts(dList || []);
        setSelectedDistrict('');
        setSites([]);
        setSelectedSiteIds([]);
      } catch (err: any) {
        if (!active) return;
        console.error('Districts fetch error:', err);
        setErrorMsg(err?.message || 'Failed to fetch districts.');
      } finally {
        if (active) setDistrictsLoading(false);
      }
    };
    loadDistricts();
    return () => {
      active = false;
    };
  }, [selectedVolume]);

  // 3. District Change -> Fetch Sites (API 3: GET /up/resco/survey/fetch-site)
  useEffect(() => {
    if (!selectedDistrict || !selectedVolume) {
      setSites([]);
      setSelectedSiteIds([]);
      return;
    }

    let active = true;
    const loadSites = async () => {
      setSitesLoading(true);
      setErrorMsg('');
      try {
        const sList = await upRescoSurveyAdminService.fetchSites(selectedVolume, selectedDistrict);
        if (!active) return;
        setSites(sList || []);
        setSelectedSiteIds([]);
      } catch (err: any) {
        if (!active) return;
        console.error('Sites fetch error:', err);
        setErrorMsg(err?.message || 'Failed to fetch sites.');
      } finally {
        if (active) setSitesLoading(false);
      }
    };
    loadSites();
    return () => {
      active = false;
    };
  }, [selectedDistrict, selectedVolume]);

  const handleToggleSite = (id: number) => {
    setSelectedSiteIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };

  const handleSelectAll = () => {
    if (selectedSiteIds.length === sites.length) {
      setSelectedSiteIds([]);
    } else {
      setSelectedSiteIds(sites.map((s) => s.id));
    }
  };

  const filteredSites = useMemo(() => {
    const q = siteFilterQuery.trim().toLowerCase();
    if (!q) return sites;
    return sites.filter((s) => {
      return (
        String(s.id).includes(q) ||
        (s.site_name && s.site_name.toLowerCase().includes(q)) ||
        (s.connected && String(s.connected).toLowerCase().includes(q))
      );
    });
  }, [sites, siteFilterQuery]);

  // Submit Handler (API 4: POST /up/resco/survey/store-assign-survey)
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedVendor) return setErrorMsg('Vendor Name is required.');
    if (!selectedVolume) return setErrorMsg('Volume is required.');
    if (!selectedDistrict) return setErrorMsg('District is required.');
    if (selectedSiteIds.length === 0) return setErrorMsg('Please select at least one survey site.');

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('vendor', selectedVendor);
      formData.append('volume', selectedVolume);
      formData.append('district', selectedDistrict);
      selectedSiteIds.forEach((siteId) => {
        formData.append('site[]', String(siteId));
      });
      if (file) {
        formData.append('file', file);
      }
      if (remarks.trim()) {
        formData.append('remarks', remarks.trim());
      }

      const res = await upRescoSurveyAdminService.storeAssignSurvey(formData);
      setSuccessMsg(res.message || 'Survey Assigned Successfully!');

      setTimeout(() => {
        navigate('/up/resco-survey-assign-view');
      }, 1500);
    } catch (err: any) {
      console.error('Submit assign error:', err);
      setErrorMsg(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ax-page swp-inst-form">
      <style>{SINGLE_CARD_FORM_CSS}</style>

      {/* Page Head */}
      <PageHead
        title="Assign UP Resco Survey"
        subtitle="The field labels marked with * are required input fields."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'UP Resco Survey', href: '/up/resco-survey-dashboard' },
          { label: 'Assign UP Resco Survey' },
        ]}
        actions={
          <Link
            to="/up/resco-survey-assign-view"
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
            View Assigned UP Resco Survey
          </Link>
        }
      />

      {/* Status Banners */}
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

      <form onSubmit={handleSubmit} className="ax-card">
        {/* Header with Section Pills */}
        <div className="ax-card__header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h2 className="ax-card__title" style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--ax-text-strong, #0f172a)' }}>
                Assign UP Resco Survey
              </h2>
              <p className="ax-card__subtitle" style={{ fontSize: '0.85rem', color: '#ef4444', margin: '4px 0 0' }}>
                The field labels marked with * are required input fields.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {selectedSiteIds.length > 0 && (
                <span className="ax-badge ax-badge--soft ax-badge--info" style={{ fontWeight: 600, padding: '4px 12px', fontSize: 12 }}>
                  {selectedSiteIds.length} Site(s) Selected
                </span>
              )}
            </div>
          </div>

          {/* Quick Nav Pills */}
          <div className="swp-section-pills">
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec1)}>
              <span className="pill-num">1</span> Vendor & Volume
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec2)}>
              <span className="pill-num">2</span> District
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec3)}>
              <span className="pill-num">3</span> Site Name
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec4)}>
              <span className="pill-num">4</span> File & Remarks
            </button>
          </div>
        </div>

        <div className="ax-card__body">
          {/* Section 1: Vendor Name & Volume */}
          <div ref={sec1} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>1. Vendor & Volume Allocation</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Select authorized partner vendor and project volume
                </span>
              </div>
            </div>

            <div className="ax-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {/* Vendor Name * */}
              <div className="ax-float">
                <select
                  id="vendor_select"
                  className="ax-float__input"
                  value={selectedVendor}
                  onChange={(e) => setSelectedVendor(e.target.value)}
                  disabled={initialLoading || submitting}
                  required
                >
                  <option value="">-- Select Vendor --</option>
                  {vendors.map((v) => (
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
                  value={selectedVolume}
                  onChange={(e) => setSelectedVolume(e.target.value)}
                  disabled={initialLoading || submitting}
                  required
                >
                  <option value="">-- Select Volume --</option>
                  {volumes.map((vol, idx) => (
                    <option key={idx} value={vol.volume}>
                      {vol.volume}
                    </option>
                  ))}
                </select>
                <label htmlFor="volume_select" className="ax-float__label floating">
                  Volume <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>
            </div>
          </div>

          <hr className="swp-section-divider" />

          {/* Section 2: District */}
          <div ref={sec2} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>2. District</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Select district from the volumes allocated
                </span>
              </div>
            </div>

            <div style={{ maxWidth: '480px' }}>
              {/* District * */}
              <div className="ax-float">
                <select
                  id="district_select"
                  className="ax-float__input"
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  disabled={!selectedVolume || districtsLoading || submitting}
                  required
                >
                  <option value="">
                    {districtsLoading
                      ? 'Loading Districts...'
                      : !selectedVolume
                      ? '-- Select Volume First --'
                      : '-- Select District --'}
                  </option>
                  {districts.map((d, idx) => (
                    <option key={idx} value={d.district}>
                      {d.district}
                    </option>
                  ))}
                </select>
                <label htmlFor="district_select" className="ax-float__label floating">
                  District <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>
            </div>
          </div>

          <hr className="swp-section-divider" />

          {/* Section 3: Site Name * */}
          <div ref={sec3} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
                  3. Site Name <span style={{ color: '#ef4444' }}>*</span>
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Choose eligible unassigned Resco survey sites for survey assignment
                </span>
              </div>
              {sites.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#2563eb' }}>
                    {selectedSiteIds.length} of {sites.length} Selected
                  </span>
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="ax-btn ax-btn--secondary ax-btn--sm"
                    style={{ fontSize: 11, padding: '3px 10px' }}
                  >
                    {selectedSiteIds.length === sites.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
              )}
            </div>

            {/* Quick dropdown for Site Name */}
            <div className="ax-float" style={{ marginBottom: 16, maxWidth: '640px' }}>
              <select
                id="site_dropdown"
                className="ax-float__input"
                value=""
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val && !selectedSiteIds.includes(val)) {
                    setSelectedSiteIds((prev) => [...prev, val]);
                  }
                }}
                disabled={!selectedDistrict || sitesLoading || sites.length === 0 || submitting}
              >
                <option value="">
                  {!selectedDistrict
                    ? '-- Select District First --'
                    : sitesLoading
                    ? 'Loading Sites...'
                    : sites.length === 0
                    ? 'No site available'
                    : '-- Select Site Name --'}
                </option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    #{s.id} — {s.site_name} {s.connected ? `(${s.connected})` : ''}
                  </option>
                ))}
              </select>
              <label htmlFor="site_dropdown" className="ax-float__label floating">
                Site Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
            </div>

            {!selectedDistrict ? (
              <div
                style={{
                  padding: '24px',
                  background: 'var(--ax-surface-subtle, #f8fafc)',
                  border: '1.5px dashed var(--ax-border, #cbd5e1)',
                  borderRadius: 10,
                  color: 'var(--ax-text-muted, #64748b)',
                  fontSize: 13,
                  textAlign: 'center',
                }}
              >
                -- Select District to Load Sites --
              </div>
            ) : sitesLoading ? (
              <div style={{ padding: '28px', textAlign: 'center', color: '#2563eb', fontSize: 13 }}>
                <span className="ax-spinner" style={{ marginRight: 8 }} />
                Fetching survey sites for district &ldquo;{selectedDistrict}&rdquo;...
              </div>
            ) : sites.length === 0 ? (
              <div
                style={{
                  padding: '16px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: 8,
                  color: '#b91c1c',
                  fontSize: 13,
                  textAlign: 'center',
                }}
              >
                No unassigned survey sites available in {selectedDistrict}
              </div>
            ) : (
              <div style={{ border: '1px solid var(--ax-border, #e2e8f0)', borderRadius: 10, overflow: 'hidden', background: 'var(--ax-surface-solid, #ffffff)' }}>
                <div style={{ padding: '8px 12px', background: 'var(--ax-surface-subtle, #f8fafc)', borderBottom: '1px solid var(--ax-border, #e2e8f0)' }}>
                  <input
                    type="text"
                    className="ax-form-input"
                    value={siteFilterQuery}
                    onChange={(e) => setSiteFilterQuery(e.target.value)}
                    placeholder="Search site name, ID or connection..."
                    style={{ width: '100%', padding: '6px 12px', fontSize: 12, borderRadius: 6 }}
                  />
                </div>

                <div style={{ maxHeight: 260, overflowY: 'auto', padding: 10 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
                    {filteredSites.map((s) => {
                      const isSelected = selectedSiteIds.includes(s.id);
                      return (
                        <div
                          key={s.id}
                          onClick={() => handleToggleSite(s.id)}
                          style={{
                            padding: '8px 12px',
                            borderRadius: 8,
                            border: `1.5px solid ${isSelected ? '#3b82f6' : 'var(--ax-border, #e2e8f0)'}`,
                            background: isSelected ? '#eff6ff' : 'var(--ax-surface-solid, #ffffff)',
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
                            <div style={{ fontWeight: 700, color: 'var(--ax-text-strong, #1e293b)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              #{s.id} — {s.site_name}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--ax-text-muted, #64748b)' }}>
                              {s.connected ? `Connected: ${s.connected}` : selectedDistrict}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          <hr className="swp-section-divider" />

          {/* Section 4: File * & Remarks */}
          <div ref={sec4} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>4. Survey File & Remarks</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Attach survey work order document and enter surveyor instructions
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
                  placeholder="Optional survey assignment remarks"
                />
              </div>
            </div>

            {/* File Dropzone */}
            <div style={{ maxWidth: 540 }}>
              <UploadDropzone
                id="assign_file"
                label="File"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xlsx,.xls"
                disabled={submitting}
                file={file}
                preview={filePreview}
                onSelect={(selected) => {
                  setFile(selected);
                  if (selected && selected.type.startsWith('image/')) {
                    setFilePreview(URL.createObjectURL(selected));
                  } else {
                    setFilePreview(undefined);
                  }
                }}
                onRemove={() => {
                  setFile(null);
                  if (filePreview) {
                    URL.revokeObjectURL(filePreview);
                    setFilePreview(undefined);
                  }
                }}
              />
            </div>
          </div>

          {/* Submit Footer */}
          <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid var(--ax-border, #e2e8f0)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px' }}>
            <Link to="/up/resco-survey-assign-view" className="ax-btn ax-btn--secondary">
              Cancel
            </Link>
            <button
              type="submit"
              className="ax-btn ax-btn--primary"
              disabled={submitting || selectedSiteIds.length === 0}
              style={{
                minWidth: 180,
                fontWeight: 700,
              }}
            >
              {submitting ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <span className="ax-spinner" /> Assigning...
                </span>
              ) : (
                'Assign UP Resco Survey'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default UPRescoSurveyAssign;
