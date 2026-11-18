import { useState, useRef, useEffect, useMemo, type FormEvent, type ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  goaAdminService,
  type GoaSurveyFetchSiteItem,
} from '../../goa-services';

// Unified Single-Card Layout with Floating Labels & Section Dividers (matching ERP reference standard)
const SINGLE_CARD_FORM_CSS = `
.swp-inst-form .ax-card {
  border: 1px solid var(--ax-border, #e2e8f0);
  border-radius: var(--ax-radius-xl, 16px);
  background: var(--ax-surface-solid, #ffffff);
  box-shadow: var(--ax-shadow-sm, 0 1px 3px rgba(0,0,0,0.05));
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
  color: var(--ax-text, #1e293b);
  cursor: pointer;
  transition: all var(--ax-motion-fast, 0.15s) var(--ax-ease-standard, ease);
}
.swp-section-pill-btn:hover {
  border-color: #2563eb;
  color: #2563eb;
  background: color-mix(in srgb, #2563eb 6%, #ffffff);
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

/* Site Selection List & Cards */
.swp-site-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
  max-height: 320px;
  overflow-y: auto;
  padding: 12px;
  background: var(--ax-surface-subtle, #f8fafc);
  border: 1px solid var(--ax-border, #cbd5e1);
  border-radius: var(--ax-radius-md, 8px);
}
.swp-site-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  background: #ffffff;
  border: 1px solid var(--ax-border, #e2e8f0);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
}
.swp-site-item:hover {
  border-color: #3b82f6;
  background: #f0f7ff;
}
.swp-site-item.selected {
  border-color: #3b82f6;
  background: #eff6ff;
  box-shadow: 0 0 0 1px #3b82f6;
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
  transition: border-color var(--ax-motion-fast, 0.15s) ease,
              box-shadow var(--ax-motion-fast, 0.15s) ease;
}
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
  transition: top var(--ax-motion-fast, 0.15s) ease,
              font-size var(--ax-motion-fast, 0.15s) ease,
              color var(--ax-motion-fast, 0.15s) ease;
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
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  required?: boolean;
  disabled?: boolean;
  type?: string;
  placeholder?: string;
  isTextarea?: boolean;
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
  isTextarea = false,
}: FloatingInputProps) {
  const [focused, setFocused] = useState(false);
  const hasVal = Boolean(value && String(value).length > 0);

  return (
    <div className="ax-float">
      {isTextarea ? (
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          required={required}
          disabled={disabled}
          placeholder={placeholder || label}
          rows={3}
          className="ax-float__input"
          style={{ height: 'auto', minHeight: 70, paddingTop: 16, resize: 'vertical' }}
        />
      ) : (
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
      )}
      <label htmlFor={name} className={`ax-float__label ${focused ? 'floating' : hasVal ? 'has-val' : ''}`}>
        {label} {required && <span style={{ color: 'var(--ax-danger, #ef4444)' }}>*</span>}
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
  accept = '.pdf,.jpg,.jpeg,.png',
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
    if (chosen) onSelect(chosen);
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
        onClick={() => { if (!disabled) inputRef.current?.click(); }}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onMouseEnter={() => { if (!disabled) setIsHovered(true); }}
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
          minHeight: 100,
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
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                <path d="M12 12v9" />
                <path d="m8 16 4-4 4 4" />
              </svg>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong, #1e293b)' }}>
              Click to upload or drag & drop survey scope document
            </div>
            <div style={{ fontSize: 11, color: 'var(--ax-text-muted, #64748b)', marginTop: 3 }}>
              PDF, JPG, JPEG, PNG (Max 5 MB)
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

export function GoaSRTSurveyAssign() {
  const navigate = useNavigate();

  // Dynamic Options from API
  const [vendors, setVendors] = useState<Array<{ id: number; name: string }>>([]);
  const [districts, setDistricts] = useState<string[]>(['North Goa', 'South Goa']);
  const [initLoading, setInitLoading] = useState<boolean>(true);

  // Sites fetched based on selected district
  const [sites, setSites] = useState<GoaSurveyFetchSiteItem[]>([]);
  const [sitesLoading, setSitesLoading] = useState<boolean>(false);
  const [siteSearch, setSiteSearch] = useState<string>('');
  const [selectedSiteDropdownId, setSelectedSiteDropdownId] = useState<string>('');

  // Form State
  const [vendor, setVendor] = useState<string>('');
  const [stateName] = useState<string>('Goa');
  const [district, setDistrict] = useState<string>('');
  const [selectedSites, setSelectedSites] = useState<number[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [remarks, setRemarks] = useState<string>('');

  // Execution states
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Section refs for smooth navigation pills
  const sec1 = useRef<HTMLDivElement>(null);
  const sec2 = useRef<HTMLDivElement>(null);
  const sec3 = useRef<HTMLDivElement>(null);

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // 1. Fetch Vendors and Districts on Mount
  // GET /goa/srt/survey/assign
  useEffect(() => {
    let cancelled = false;
    setInitLoading(true);
    goaAdminService
      .getSurveyAssignFormData()
      .then((data) => {
        if (!cancelled) {
          if (Array.isArray(data?.vendor)) {
            setVendors(data.vendor);
          }
          if (Array.isArray(data?.districts)) {
            const dNames = data.districts
              .map((d: any) => (typeof d === 'string' ? d : d.district))
              .filter(Boolean);
            if (dNames.length > 0) {
              setDistricts(Array.from(new Set(dNames)));
            } else {
              setDistricts(['North Goa', 'South Goa']);
            }
          }
        }
      })
      .catch((err: any) => {
        if (!cancelled) {
          console.warn('Initial survey assign data error:', err);
          setDistricts(['North Goa', 'South Goa']);
        }
      })
      .finally(() => {
        if (!cancelled) setInitLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // 2. Fetch Sites dynamically when district changes
  // GET /goa/srt/survey/fetch-site?district={district}
  useEffect(() => {
    if (!district) {
      setSites([]);
      setSelectedSites([]);
      setSiteSearch('');
      setSelectedSiteDropdownId('');
      return;
    }

    let cancelled = false;
    setSitesLoading(true);
    setSelectedSites([]);
    setSiteSearch('');
    setSelectedSiteDropdownId('');

    goaAdminService
      .getSurveyFetchSites(district)
      .then((fetched) => {
        if (!cancelled) {
          setSites(Array.isArray(fetched) ? fetched : []);
        }
      })
      .catch((err: any) => {
        if (!cancelled) {
          console.warn('Failed to fetch unassigned survey sites for:', district, err);
          setSites([]);
        }
      })
      .finally(() => {
        if (!cancelled) setSitesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [district]);

  // Filtered sites inside picker
  const filteredSites = useMemo(() => {
    const q = siteSearch.trim().toLowerCase();
    if (!q) return sites;
    return sites.filter(
      (s) =>
        String(s.id).includes(q) ||
        (s.site_name || '').toLowerCase().includes(q) ||
        (s.ca_no || '').toLowerCase().includes(q)
    );
  }, [sites, siteSearch]);

  const toggleSite = (siteId: number) => {
    setSelectedSites((prev) =>
      prev.includes(siteId) ? prev.filter((id) => id !== siteId) : [...prev, siteId]
    );
  };

  const handleSelectAllSites = () => {
    if (selectedSites.length === filteredSites.length && filteredSites.length > 0) {
      setSelectedSites([]);
    } else {
      setSelectedSites(filteredSites.map((s) => s.id));
    }
  };

  // 3. Store Assign
  // POST /goa/srt/survey/assign-store (multipart/form-data)
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setFieldErrors({});
    setSuccessMsg('');

    if (!vendor) {
      setErrorMsg('Vendor selection is required.');
      return;
    }
    if (!district) {
      setErrorMsg('District is required.');
      return;
    }
    if (selectedSites.length === 0) {
      setErrorMsg('Please select at least one site to assign for survey.');
      return;
    }
    if (file && file.size > 5 * 1024 * 1024) {
      setErrorMsg('The uploaded file must not exceed 5 MB.');
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('vendor', vendor);
      fd.append('state', stateName.toLowerCase());
      fd.append('district', district);
      selectedSites.forEach((siteId) => {
        fd.append('site[]', String(siteId));
      });
      if (file) {
        fd.append('file', file);
      }
      if (remarks.trim()) {
        fd.append('remarks', remarks.trim());
      }

      const res = await goaAdminService.storeSurveyAssign(fd);
      const msg = res?.message || 'Survey Assigned Successfully!';
      setSuccessMsg(msg);
      setSelectedSites([]);
      setTimeout(() => {
        navigate('/vendor-management/goa/srt/survey/assign-view');
      }, 1500);
    } catch (err: any) {
      console.error('Survey assign submission error:', err);
      if (err?.errors) {
        setFieldErrors(err.errors);
      }
      setErrorMsg(err?.message || 'Failed to assign survey. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ax-page swp-inst-form">
      <style>{SINGLE_CARD_FORM_CSS}</style>

      {/* Page Head */}
      <PageHead
        title="Assign Goa SRT Survey"
        subtitle="Allot unassigned rooftop solar sites to verified vendor surveyors for pre-installation feasibility study."
        breadcrumbs={[
          { label: 'ERP Dashboard', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Goa' },
          { label: 'Survey' },
          { label: 'SRT Survey' },
          { label: 'Assign Survey' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)' }}>
            <Link
              to="/vendor-management/goa/srt/survey/assign-view"
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
                aria-hidden="true"
              >
                <path d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
                <path d="M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6" />
              </svg>
              View Assigned Surveys
            </Link>
            <Link
              to="/vendor-management/goa/srt/survey/dashboard"
              className="ax-btn ax-btn--secondary ax-btn--sm"
            >
              Dashboard
            </Link>
          </div>
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
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div>
              <div style={{ fontWeight: 600 }}>{errorMsg}</div>
              {Object.keys(fieldErrors).length > 0 && (
                <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                  {Object.entries(fieldErrors).map(([field, msgs]) => (
                    <li key={field}>{field}: {msgs.join(', ')}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg('')}
            style={{ background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer', padding: 4 }}
            aria-label="Dismiss error"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
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
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>{successMsg}</span>
          </div>
          <span style={{ fontSize: 12, opacity: 0.8 }}>Redirecting...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="ax-card" noValidate>
        {/* Header with Section Pills */}
        <div className="ax-card__header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h2 className="ax-card__title" style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--ax-text-strong, #0f172a)' }}>
                Assign Goa SRT Survey
              </h2>
              <p className="ax-card__subtitle" style={{ fontSize: '0.85rem', color: '#ef4444', margin: '4px 0 0' }}>
                The field labels marked with * are required input fields.
              </p>
            </div>
          </div>

          {/* Quick Nav Pills */}
          <div className="swp-section-pills">
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec1)}>
              <span className="pill-num">1</span> Surveyor Vendor & State
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec2)}>
              <span className="pill-num">2</span> Target District & Sites {selectedSites.length > 0 ? `(${selectedSites.length})` : ''}
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec3)}>
              <span className="pill-num">3</span> Scope Document & Remarks
            </button>
          </div>
        </div>

        <div className="ax-card__body">
          {/* SECTION 1: Vendor Name * & State * */}
          <div ref={sec1} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
                  1. Surveyor Vendor & Jurisdiction <span style={{ color: '#ef4444' }}>*</span>
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Select authorized empaneled contractor for conducting technical rooftop surveys
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {/* Vendor Select */}
              <div className="ax-float">
                <select
                  id="vendor_select"
                  className="ax-float__input"
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  disabled={initLoading || submitting}
                  required
                >
                  <option value="">
                    {initLoading ? 'Loading vendors from server...' : '-- Select Surveyor Vendor --'}
                  </option>
                  {vendors.map((v) => (
                    <option key={v.id} value={String(v.id)}>
                      {v.name} (ID: {v.id})
                    </option>
                  ))}
                </select>
                <label htmlFor="vendor_select" className="ax-float__label floating">
                  Surveyor Vendor <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              {/* State */}
              <div className="ax-float">
                <select
                  id="state_select"
                  className="ax-float__input"
                  value={stateName}
                  disabled
                  required
                >
                  <option value="Goa">Goa</option>
                </select>
                <label htmlFor="state_select" className="ax-float__label floating">
                  State <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>
            </div>
          </div>

          <hr className="swp-section-divider" />

          {/* SECTION 2: Target District * & Unassigned Sites * */}
          <div ref={sec2} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, color: 'var(--ax-text-strong, #0f172a)' }}>
                  2. Target District & Feasibility Sites <span style={{ color: '#ef4444' }}>*</span>
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  {district
                    ? `Select one or more unassigned rooftop sites in ${district} for pre-installation feasibility study.`
                    : 'Select a district below to fetch real-time unassigned survey sites.'}
                </span>
              </div>
              {district && sites.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="ax-badge ax-badge--soft ax-badge--accent" style={{ fontWeight: 600 }}>
                    {selectedSites.length} of {sites.length} selected
                  </span>
                  <button
                    type="button"
                    className="ax-btn ax-btn--secondary ax-btn--xs"
                    onClick={handleSelectAllSites}
                  >
                    {selectedSites.length === filteredSites.length && filteredSites.length > 0
                      ? 'Deselect All'
                      : 'Select All'}
                  </button>
                </div>
              )}
            </div>

            {/* District Dropdown */}
            <div style={{ maxWidth: 360, marginBottom: 18 }}>
              <div className="ax-float">
                <select
                  id="district_select"
                  className="ax-float__input"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  disabled={initLoading || submitting}
                  required
                >
                  <option value="">-- Select Target District --</option>
                  {districts.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <label htmlFor="district_select" className="ax-float__label floating">
                  Target District <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>
            </div>

            {/* Sites Picker states */}
            {!district ? (
              <div
                style={{
                  padding: '24px 16px',
                  textAlign: 'center',
                  background: '#f8fafc',
                  borderRadius: 8,
                  border: '1px dashed #cbd5e1',
                  color: '#64748b',
                  fontSize: 13,
                }}
              >
                -- Select District Above to Load Unassigned Feasibility Sites --
              </div>
            ) : sitesLoading ? (
              <div
                style={{
                  padding: '28px 16px',
                  textAlign: 'center',
                  background: '#f8fafc',
                  borderRadius: 8,
                  color: '#2563eb',
                  fontSize: 13,
                }}
              >
                <span className="ax-spinner" style={{ marginRight: 8 }} />
                Fetching unassigned survey sites for <b>{district}</b>...
              </div>
            ) : sites.length === 0 ? (
              <div
                style={{
                  padding: '24px 16px',
                  textAlign: 'center',
                  background: '#f8fafc',
                  borderRadius: 8,
                  border: '1px dashed #cbd5e1',
                  color: '#64748b',
                  fontSize: 13,
                }}
              >
                No unassigned survey sites available in <b>{district}</b>. All sites in this jurisdiction may have already been surveyed or assigned.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Quick Dropdown & Search Controls */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
                  {/* Quick Dropdown */}
                  <div>
                    <select
                      id="quick_survey_site_dropdown"
                      className="ax-input ax-input--sm"
                      style={{ width: '100%', height: 38, borderRadius: 6, fontSize: 13 }}
                      value={selectedSiteDropdownId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedSiteDropdownId(val);
                        if (val) {
                          const numId = Number(val);
                          if (!selectedSites.includes(numId)) {
                            setSelectedSites((prev) => [...prev, numId]);
                          }
                        }
                      }}
                      disabled={submitting}
                    >
                      <option value="">-- Quick Select Site from List ({sites.length}) --</option>
                      {sites.map((s) => {
                        const isSelected = selectedSites.includes(s.id);
                        return (
                          <option key={s.id} value={String(s.id)}>
                            {isSelected ? '[Selected] ' : ''}{s.site_name} (ID: {s.id})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Search Input */}
                  <div>
                    <input
                      type="text"
                      value={siteSearch}
                      onChange={(e) => setSiteSearch(e.target.value)}
                      placeholder="Search sites by ID, name or CA No..."
                      className="ax-input ax-input--sm"
                      style={{ width: '100%', height: 38, borderRadius: 6, fontSize: 13 }}
                    />
                  </div>
                </div>

                {/* Checkbox Grid / Cards */}
                <div className="swp-site-list">
                  {filteredSites.map((site) => {
                    const isChecked = selectedSites.includes(site.id);
                    return (
                      <div
                        key={site.id}
                        className={`swp-site-item ${isChecked ? 'selected' : ''}`}
                        onClick={() => toggleSite(site.id)}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSite(site.id)}
                          onClick={(e) => e.stopPropagation()}
                          style={{ width: 16, height: 16, marginTop: 2, cursor: 'pointer', accentColor: '#2563eb' }}
                        />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: 'var(--ax-text-strong, #1e293b)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                            title={site.site_name}
                          >
                            {site.site_name}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: 'var(--ax-text-muted, #64748b)',
                              display: 'flex',
                              gap: 8,
                              flexWrap: 'wrap',
                              marginTop: 2,
                            }}
                          >
                            <span>Site ID: <b>{site.id}</b></span>
                            {site.ca_no && <span>CA: <b>{site.ca_no}</b></span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {filteredSites.length === 0 && (
                  <div style={{ padding: 12, textAlign: 'center', color: '#64748b', fontSize: 12 }}>
                    No survey sites matching "{siteSearch}"
                  </div>
                )}

                {selectedSites.length > 0 && (
                  <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    <span>{selectedSites.length} site(s) selected for survey feasibility assignment</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <hr className="swp-section-divider" />

          {/* SECTION 3: Scope Document & Remarks */}
          <div ref={sec3} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
                  3. Assignment Scope File & Remarks (Optional)
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Attach official allotment order, survey guidelines, or specific instructions
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              <div>
                <UploadDropzone
                  id="assign_file"
                  label="Survey Scope Document"
                  file={file}
                  onSelect={(f) => setFile(f)}
                  onRemove={() => setFile(null)}
                  disabled={submitting}
                />
              </div>

              <div>
                <FloatingInput
                  label="Survey Assignment Remarks"
                  name="remarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  disabled={submitting}
                  placeholder="Enter specific surveyor instructions, access notes, or deadlines..."
                  isTextarea
                />
              </div>
            </div>
          </div>

          {/* Submit Footer */}
          <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid var(--ax-border, #e2e8f0)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px' }}>
            <Link to="/vendor-management/goa/srt/survey/assign-view" className="ax-btn ax-btn--secondary">
              Cancel
            </Link>
            <button
              type="submit"
              className="ax-btn ax-btn--primary"
              disabled={submitting || initLoading || !vendor || !district || selectedSites.length === 0}
              style={{ minWidth: 180, fontWeight: 700 }}
            >
              {submitting ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <span className="ax-spinner" /> Assigning Survey...
                </span>
              ) : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  Assign ({selectedSites.length}) Goa SRT Sites
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </span>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default GoaSRTSurveyAssign;
