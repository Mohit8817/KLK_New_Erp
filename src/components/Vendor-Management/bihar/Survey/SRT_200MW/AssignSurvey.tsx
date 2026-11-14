import { useState, useEffect, useRef, useMemo, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { biharAdminService, resolveBiharMediaUrl } from '../../bihar-services/biharAdminService';
import { BIHAR_DISTRICTS } from '../../bihar-types';

// Unified Single-Card Layout with Floating Labels & Section Dividers (matching Kashmir SRT 70MW)
const SINGLE_CARD_FORM_CSS = `
.kswp-assign-form .ax-card {
  border: 1px solid var(--ax-border, #e2e8f0);
  border-radius: var(--ax-radius-xl, 16px);
  background: var(--ax-surface-solid, #ffffff);
  box-shadow: var(--ax-shadow-sm, 0 1px 3px 0 rgba(0, 0, 0, 0.05));
  overflow: hidden;
}
.kswp-assign-form .ax-card__header {
  padding: var(--ax-space-5, 20px) var(--ax-space-6, 24px);
  border-bottom: 1px solid var(--ax-border-subtle, #f1f5f9);
  background: var(--ax-surface-subtle, #f8fafc);
  display: flex;
  flex-direction: column;
  gap: var(--ax-space-4, 16px);
}
.kswp-assign-form .ax-card__body { padding: var(--ax-space-6, 24px); }

/* Quick Section Nav Pills */
.kswp-section-pills {
  display: flex;
  gap: var(--ax-space-2, 8px);
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: thin;
}
.kswp-section-pill-btn {
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
  color: var(--ax-text, #334155);
  cursor: pointer;
  transition: all var(--ax-motion-fast, 0.15s) var(--ax-ease-standard, ease);
}
.kswp-section-pill-btn:hover {
  border-color: #2563eb;
  color: #2563eb;
  background: color-mix(in srgb, #2563eb 6%, var(--ax-surface-solid, #ffffff));
}
.kswp-section-pill-btn .pill-num {
  width: 18px; height: 18px; border-radius: 50%;
  background: var(--ax-surface-subtle, #f1f5f9);
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 700;
}

/* Section Block */
.kswp-section-block { padding-top: var(--ax-space-2, 8px); scroll-margin-top: 80px; }
.kswp-section-header {
  display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap;
  gap: var(--ax-space-2, 8px);
  margin-bottom: var(--ax-space-5, 20px);
  padding-bottom: var(--ax-space-3, 12px);
  border-bottom: 1px solid var(--ax-border-subtle, #f1f5f9);
}
.kswp-section-title-wrap { display: flex; flex-direction: column; gap: 4px; }
.kswp-section-divider {
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
.ax-float__input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px color-mix(in srgb, #2563eb 20%, transparent);
}
.ax-float__input:disabled { opacity: .75; cursor: not-allowed; background: var(--ax-surface-subtle, #f8fafc); }
.ax-float__input.is-invalid { border-color: #ef4444; }
.ax-float__input.is-invalid:focus { box-shadow: 0 0 0 3px color-mix(in srgb, #ef4444 24%, transparent); }
textarea.ax-float__input {
  height: auto;
  min-height: 96px;
  padding-top: 20px;
  resize: vertical;
}

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
textarea.ax-float__input + .ax-float__label { top: 22px; }
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
.ax-float__input.is-invalid + .ax-float__label { color: #ef4444; }

.kswp-field-error { margin-top: 4px; font-size: 11px; color: #ef4444; }

/* Footer copyright */
.srt-page-footer {
  margin-top: 28px;
  padding: 16px;
  text-align: center;
  font-size: 12.5px;
  color: var(--ax-text-muted, #64748b);
  border-top: 1px solid var(--ax-border, #e2e8f0);
}
`;

/* ───────── Floating Select ───────── */
type Option = { value: string; label: string };

function FloatingSelect({
  id,
  label,
  value,
  options,
  placeholder,
  disabled,
  error,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  onChange: (val: string) => void;
}) {
  return (
    <div>
      <div className="ax-float">
        <select
          id={id}
          className={`ax-float__input ${error ? 'is-invalid' : ''}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <label htmlFor={id} className="ax-float__label floating">
          {label} <span style={{ color: '#ef4444' }}>*</span>
        </label>
      </div>
      {error && <div className="kswp-field-error">{error}</div>}
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
  accept = '.pdf,.jpg,.jpeg,.png,.xlsx,.csv',
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
    if (chosen) onSelect(chosen);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label
        htmlFor={id}
        style={{
          fontSize: '12.5px',
          fontWeight: 600,
          color: error ? '#ef4444' : 'var(--ax-text-strong, #334155)',
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
            ? '1.5px dashed #ef4444'
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
              PDF, JPG, JPEG, PNG or XLSX (Max 15 MB) — single file
            </div>
          </>
        )}
      </div>

      {error && <span style={{ fontSize: 11, color: '#ef4444', marginTop: 2 }}>{error}</span>}
    </div>
  );
}

/* ───────── Main Component: AssignBiharSRT200MWSurvey ───────── */
export function AssignBiharSRT200MWSurvey() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');

  // Form fields
  const [vendor, setVendor] = useState<string>('');
  const [stateName] = useState<string>('Bihar');
  const [district, setDistrict] = useState<string>('');
  const [selectedSiteIds, setSelectedSiteIds] = useState<number[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | undefined>(undefined);
  const [existingFileName, setExistingFileName] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');

  // Dropdown & Sites data
  const [vendors, setVendors] = useState<Array<{ id: number | string; name: string }>>([]);
  const [sites, setSites] = useState<any[]>([]);

  // UI state
  const [loadingVendors, setLoadingVendors] = useState<boolean>(false);
  const [fetchingSites, setFetchingSites] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [siteSearch, setSiteSearch] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Section refs for smooth scrolling pills
  const sec1 = useRef<HTMLDivElement>(null);
  const sec2 = useRef<HTMLDivElement>(null);
  const sec3 = useRef<HTMLDivElement>(null);

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const clearError = (name: string) => {
    setValidationErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  // Initial load: fetch vendors master
  useEffect(() => {
    let isMounted = true;
    setLoadingVendors(true);
    setErrorMsg(null);

    biharAdminService
      .getSrt200mwSurveyAssignMaster()
      .then((res: any) => {
        if (!isMounted) return;
        const list = res?.vendors || res?.data?.vendors || res?.data || (Array.isArray(res) ? res : []);
        if (Array.isArray(list)) {
          setVendors(
            list.map((v: any) => ({
              id: v.id || v.vendor_id,
              name: v.name || v.vendor_name || `Vendor #${v.id}`,
            }))
          );
        }
      })
      .catch((err: any) => {
        console.warn('Failed to load Bihar survey vendors:', err);
        if (isMounted) {
          setErrorMsg(err?.message || 'Failed to load vendor options.');
          setVendors([]);
        }
      })
      .finally(() => {
        if (isMounted) setLoadingVendors(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // When district changes, fetch sites
  useEffect(() => {
    if (!district) {
      setSites([]);
      setSelectedSiteIds([]);
      return;
    }

    let isMounted = true;
    setFetchingSites(true);
    biharAdminService
      .getSrt200mwSites(district)
      .then((res: any) => {
        if (!isMounted) return;
        const list = res?.sites || res?.data?.sites || res?.data || (Array.isArray(res) ? res : []);
        setSites(Array.isArray(list) ? list : []);
      })
      .catch((err: any) => {
        console.warn('Failed to load sites for district:', district, err);
        if (isMounted) setSites([]);
      })
      .finally(() => {
        if (isMounted) setFetchingSites(false);
      });

    return () => {
      isMounted = false;
    };
  }, [district]);

  // Cleanup object preview URL
  useEffect(() => {
    return () => {
      if (filePreview) URL.revokeObjectURL(filePreview);
    };
  }, [filePreview]);

  // Filtered sites based on search term
  const filteredSites = useMemo(() => {
    if (!sites.length) return [];
    const q = siteSearch.trim().toLowerCase();
    return sites.filter((s) => {
      if (!q) return true;
      return (
        String(s.site_name || '').toLowerCase().includes(q) ||
        String(s.ca_no || '').toLowerCase().includes(q) ||
        String(s.department || '').toLowerCase().includes(q) ||
        String(s.address || '').toLowerCase().includes(q)
      );
    });
  }, [sites, siteSearch]);

  const toggleSite = (id: number) => {
    setSelectedSiteIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    clearError('site');
  };

  const selectAllSites = () => {
    if (selectedSiteIds.length === filteredSites.length && filteredSites.length > 0) {
      setSelectedSiteIds([]);
    } else {
      setSelectedSiteIds(filteredSites.map((s) => s.id));
      clearError('site');
    }
  };

  // Form validation
  const validate = () => {
    const errs: Record<string, string> = {};
    if (!vendor) errs.vendor = 'Please select a Vendor.';
    if (!stateName) errs.state = 'Please select a State.';
    if (!district) errs.district = 'Please select a District.';
    if (selectedSiteIds.length === 0) errs.site = 'Please select at least one Site.';
    if (!editId && !file) errs.file = 'Please upload a file.';
    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Submit handler
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!validate()) {
      setErrorMsg('Please correct the highlighted fields before submitting.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('vendor', vendor);
      formData.append('state', stateName);
      formData.append('district', district);
      selectedSiteIds.forEach((id) => {
        formData.append('site_name[]', String(id));
        formData.append('site[]', String(id));
      });
      if (remarks) formData.append('remarks', remarks);
      if (file) formData.append('file', file);
      if (editId) formData.append('id', editId);

      const res = await biharAdminService.storeSrt200mwSurveyAssign(formData);
      if (res?.success === false) {
        setErrorMsg(res?.message || 'Failed to save survey assignment.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const chosenVendor = vendors.find((v) => String(v.id) === vendor);
        setSuccessMsg(
          res?.message ||
            `Successfully assigned ${selectedSiteIds.length} site(s) to ${chosenVendor?.name || 'Vendor'} in ${district}, Bihar! Work order recorded.`
        );
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Redirect after brief delay
        setTimeout(() => {
          navigate('/vendor-management/bihar/srt200mw/survey/assign-view');
        }, 1200);
      }
    } catch (err: any) {
      console.error('Bihar Survey assign submit error:', err);
      setErrorMsg(err?.message || 'Something went wrong while saving survey assignment.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setVendor('');
    setDistrict('');
    setSelectedSiteIds([]);
    setSiteSearch('');
    setRemarks('');
    setFile(null);
    if (filePreview) URL.revokeObjectURL(filePreview);
    setFilePreview(undefined);
    setValidationErrors({});
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const vendorOptions: Option[] = vendors.map((v) => ({
    value: String(v.id),
    label: v.name,
  }));

  const districtOptions: Option[] = BIHAR_DISTRICTS.map((d) => ({
    value: d,
    label: d,
  }));

  const pageTitle = editId ? 'Edit Bihar SRT 200MW Survey' : 'Assign Bihar SRT200MW Survey';

  return (
    <div className="ax-page kswp-assign-form" style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 40 }}>
      <style>{SINGLE_CARD_FORM_CSS}</style>

      {/* Page Head */}
      <PageHead
        title={pageTitle}
        subtitle="The field labels marked with * are required input fields."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Bihar SRT 200MW', href: '/vendor-management/bihar/srt200mw/survey/dashboard' },
          { label: pageTitle },
        ]}
        actions={
          <Link
            to="/vendor-management/bihar/srt200mw/survey/assign-view"
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
            View Assigned List
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
            onClick={() => setErrorMsg(null)}
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
          <span style={{ fontSize: 12, opacity: 0.8 }}>Redirecting...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="ax-card" noValidate>
        {/* Header with Title and Section Navigation Pills */}
        <div className="ax-card__header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h2 className="ax-card__title" style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--ax-text-strong, #0f172a)' }}>
                {editId ? `Edit Bihar SRT 200MW Survey #${editId}` : 'Assign Bihar SRT200MW Survey'}
              </h2>
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
          <div className="kswp-section-pills">
            <button type="button" className="kswp-section-pill-btn" onClick={() => scrollTo(sec1)}>
              <span className="pill-num">1</span> Vendor & District
            </button>
            <button type="button" className="kswp-section-pill-btn" onClick={() => scrollTo(sec2)}>
              <span className="pill-num">2</span> Site Selection
            </button>
            <button type="button" className="kswp-section-pill-btn" onClick={() => scrollTo(sec3)}>
              <span className="pill-num">3</span> File & Remarks
            </button>
          </div>
        </div>

        <div className="ax-card__body">
          {/* SECTION 1: Vendor & District */}
          <div ref={sec1} className="kswp-section-block">
            <div className="kswp-section-header">
              <div className="kswp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>1. Vendor & District Selection</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Assign certified EPC survey vendor, operational state, and project district
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <FloatingSelect
                id="bihar-vendor"
                label="Vendor Name"
                placeholder={loadingVendors ? 'Loading vendors...' : '-- Select Vendor --'}
                value={vendor}
                options={vendorOptions}
                disabled={isSubmitting || loadingVendors}
                onChange={(v) => {
                  setVendor(v);
                  clearError('vendor');
                }}
                error={validationErrors.vendor}
              />

              <div className="ax-float">
                <input
                  type="text"
                  id="bihar-state"
                  className="ax-float__input"
                  value={stateName}
                  readOnly
                  disabled
                  style={{ background: '#f8fafc', color: '#1e293b', fontWeight: 600 }}
                />
                <label htmlFor="bihar-state" className="ax-float__label floating">
                  State <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              <FloatingSelect
                id="bihar-district"
                label="District"
                placeholder="-- Select District --"
                value={district}
                options={districtOptions}
                disabled={isSubmitting}
                onChange={(v) => {
                  setDistrict(v);
                  setSelectedSiteIds([]);
                  clearError('district');
                }}
                error={validationErrors.district}
              />
            </div>
          </div>

          <hr className="kswp-section-divider" />

          {/* SECTION 2: Site Selection */}
          <div ref={sec2} className="kswp-section-block">
            <div className="kswp-section-header">
              <div className="kswp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
                  2. Site Name <span style={{ color: '#ef4444' }}>*</span>
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Select one or more rooftop solar sites to assign to the vendor for Bihar 200MW SRT Survey
                </span>
              </div>
              {filteredSites.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#2563eb' }}>
                    {selectedSiteIds.length} of {sites.length} Selected
                  </span>
                  <button
                    type="button"
                    onClick={selectAllSites}
                    className="ax-btn ax-btn--secondary ax-btn--sm"
                    style={{ fontSize: 11, padding: '3px 10px' }}
                  >
                    {selectedSiteIds.length === filteredSites.length ? 'Deselect All' : `Select All (${filteredSites.length})`}
                  </button>
                  <div style={{ display: 'inline-flex', border: '1px solid var(--ax-border, #cbd5e1)', borderRadius: 6, overflow: 'hidden' }}>
                    <button
                      type="button"
                      onClick={() => setViewMode('grid')}
                      style={{
                        padding: '3px 8px',
                        fontSize: 11,
                        border: 'none',
                        background: viewMode === 'grid' ? '#2563eb' : 'var(--ax-surface-solid, #ffffff)',
                        color: viewMode === 'grid' ? '#ffffff' : 'var(--ax-text-muted, #64748b)',
                        cursor: 'pointer',
                        fontWeight: viewMode === 'grid' ? 600 : 400,
                      }}
                      title="Card Grid View"
                    >
                      Grid
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('table')}
                      style={{
                        padding: '3px 8px',
                        fontSize: 11,
                        border: 'none',
                        background: viewMode === 'table' ? '#2563eb' : 'var(--ax-surface-solid, #ffffff)',
                        color: viewMode === 'table' ? '#ffffff' : 'var(--ax-text-muted, #64748b)',
                        cursor: 'pointer',
                        fontWeight: viewMode === 'table' ? 600 : 400,
                      }}
                      title="Table View"
                    >
                      Table
                    </button>
                  </div>
                </div>
              )}
            </div>

            {!district ? (
              <div
                style={{
                  padding: '24px',
                  background: 'var(--ax-surface-subtle, #f8fafc)',
                  border: `1.5px dashed ${validationErrors.site ? '#ef4444' : 'var(--ax-border, #cbd5e1)'}`,
                  borderRadius: 10,
                  color: 'var(--ax-text-muted, #64748b)',
                  fontSize: 13,
                  textAlign: 'center',
                }}
              >
                -- Select District to Load Sites --
              </div>
            ) : fetchingSites ? (
              <div style={{ padding: '28px', textAlign: 'center', color: '#2563eb', fontSize: 13 }}>
                <span className="ax-spinner" style={{ marginRight: 8 }} />
                Loading available sites for district &ldquo;{district}&rdquo;...
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
                No unassigned survey sites found for {district}.
              </div>
            ) : (
              <div
                style={{
                  border: `1px solid ${validationErrors.site ? '#ef4444' : 'var(--ax-border, #e2e8f0)'}`,
                  borderRadius: 10,
                  overflow: 'hidden',
                  background: 'var(--ax-surface-solid, #ffffff)',
                }}
              >
                <div style={{ padding: '8px 12px', background: 'var(--ax-surface-subtle, #f8fafc)', borderBottom: '1px solid var(--ax-border, #e2e8f0)' }}>
                  <input
                    type="text"
                    className="ax-form-input"
                    value={siteSearch}
                    onChange={(e) => setSiteSearch(e.target.value)}
                    placeholder="Search site name, CA no., department, address..."
                    style={{ width: '100%', padding: '6px 12px', fontSize: 12, borderRadius: 6, border: '1px solid var(--ax-border, #cbd5e1)' }}
                  />
                </div>

                <div style={{ maxHeight: 300, overflowY: 'auto', padding: 10 }}>
                  {filteredSites.length === 0 ? (
                    <div style={{ padding: 20, textAlign: 'center', fontSize: 13, color: 'var(--ax-text-muted, #64748b)' }}>
                      No sites match your search.
                    </div>
                  ) : viewMode === 'grid' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
                      {filteredSites.map((site) => {
                        const isSelected = selectedSiteIds.includes(site.id);
                        return (
                          <div
                            key={site.id}
                            onClick={() => toggleSite(site.id)}
                            role="checkbox"
                            aria-checked={isSelected}
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === ' ' || e.key === 'Enter') {
                                e.preventDefault();
                                toggleSite(site.id);
                              }
                            }}
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
                              onChange={() => toggleSite(site.id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 700, color: 'var(--ax-text-strong, #1e293b)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {site.site_name}
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--ax-text-muted, #64748b)', marginTop: 2 }}>
                                {site.ca_no ? `CA: ${site.ca_no} • ` : ''}
                                {site.sanction_load ? `${site.sanction_load} • ` : ''}
                                {site.department ? site.department : ''}
                              </div>
                              {site.address && (
                                <div style={{ fontSize: 11, color: 'var(--ax-text-muted, #64748b)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {site.address}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <table className="ax-table ax-table--hover" style={{ width: '100%', fontSize: 12.5, borderCollapse: 'collapse' }}>
                      <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 1 }}>
                        <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <th style={{ width: 44, padding: '8px 10px', textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={filteredSites.length > 0 && selectedSiteIds.length === filteredSites.length}
                              onChange={selectAllSites}
                              aria-label="Select all sites"
                            />
                          </th>
                          <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Site Name</th>
                          <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>CA No.</th>
                          <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Department</th>
                          <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Sanction Load</th>
                          <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Address</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSites.map((site) => {
                          const isSelected = selectedSiteIds.includes(site.id);
                          return (
                            <tr
                              key={site.id}
                              onClick={() => toggleSite(site.id)}
                              style={{
                                borderBottom: '1px solid #f1f5f9',
                                cursor: 'pointer',
                                background: isSelected ? '#f0f9ff' : 'transparent',
                              }}
                            >
                              <td style={{ textAlign: 'center', padding: '8px 10px' }}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleSite(site.id)}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </td>
                              <td style={{ padding: '8px 10px', fontWeight: 600, color: '#0f172a' }}>{site.site_name}</td>
                              <td style={{ padding: '8px 10px', fontFamily: 'monospace' }}>{site.ca_no || '—'}</td>
                              <td style={{ padding: '8px 10px' }}>{site.department || '—'}</td>
                              <td style={{ padding: '8px 10px', fontWeight: 600, color: '#2563eb' }}>{site.sanction_load || '—'}</td>
                              <td style={{ padding: '8px 10px', color: '#64748b', maxWidth: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {site.address || '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
            {validationErrors.site && <div className="kswp-field-error" style={{ marginTop: 6 }}>{validationErrors.site}</div>}
          </div>

          <hr className="kswp-section-divider" />

          {/* SECTION 3: Work Order File & Remarks */}
          <div ref={sec3} className="kswp-section-block">
            <div className="kswp-section-header">
              <div className="kswp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>3. Work Order File & Remarks</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Upload the assignment order / allotment copy and enter operational remarks
                </span>
              </div>
            </div>

            {/* Existing File Link if edit mode */}
            {existingFileName && (
              <div style={{ marginBottom: 14, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: 'var(--ax-text-muted, #64748b)' }}>Currently Attached File:</span>
                <a
                  href={resolveBiharMediaUrl(existingFileName)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'underline' }}
                >
                  {existingFileName.split('/').pop()} ↗
                </a>
              </div>
            )}

            <div style={{ maxWidth: 540, marginBottom: 20 }}>
              <UploadDropzone
                id="assign_file"
                label="File"
                required={!editId}
                accept=".pdf,.jpg,.jpeg,.png,.xlsx,.csv"
                disabled={isSubmitting}
                file={file}
                preview={filePreview}
                error={validationErrors.file}
                onSelect={(selected) => {
                  setFile(selected);
                  clearError('file');
                  if (filePreview) URL.revokeObjectURL(filePreview);
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

            {/* Remarks */}
            <div className="ax-float">
              <textarea
                id="bihar-remarks"
                className="ax-float__input"
                placeholder="Remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                disabled={isSubmitting}
                rows={3}
              />
              <label htmlFor="bihar-remarks" className={`ax-float__label ${remarks ? 'has-val' : ''}`}>
                Remarks
              </label>
            </div>
          </div>

          {/* Submit Footer */}
          <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid var(--ax-border, #e2e8f0)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              className="ax-btn ax-btn--secondary"
              onClick={handleReset}
              disabled={isSubmitting}
            >
              Reset
            </button>
            <Link to="/vendor-management/bihar/srt200mw/survey/assign-view" className="ax-btn ax-btn--secondary">
              Cancel
            </Link>
            <button
              type="submit"
              className="ax-btn ax-btn--primary"
              disabled={isSubmitting}
              style={{ minWidth: 180, fontWeight: 700 }}
            >
              {isSubmitting ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <span className="ax-spinner" /> {editId ? 'Updating...' : 'Assigning...'}
                </span>
              ) : editId ? (
                'Update Assignment'
              ) : (
                'Assign Sites'
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Footer copyright */}
      <footer className="srt-page-footer">
        Copyright © ETS NETWORKS. All rights reserved.
      </footer>
    </div>
  );
}

export default AssignBiharSRT200MWSurvey;
