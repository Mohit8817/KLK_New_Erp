import { useState, useEffect, useRef, useMemo, type FormEvent, type ChangeEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { resolveJammuMediaUrl } from '../../../../V-Portal/jammu/jammu-services';

// Unified Single-Card Layout with Floating Labels & Section Dividers (matching Bihar & Assam reference)
const SINGLE_CARD_FORM_CSS = `
.solar-erp-page {
  --asw-primary: #2559bf;
  --asw-primary-rgb: 37, 89, 191;
}
.swp-inst-form .ax-btn--primary {
  background-color: #2559bf !important;
  border-color: #2559bf !important;
  color: #ffffff !important;
}
.swp-inst-form .ax-btn--primary:hover {
  background-color: #1d4699 !important;
  border-color: #1d4699 !important;
}
.swp-inst-form .ax-card {
  border: 1px solid var(--ax-border, #e2e8f0);
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
  border-radius: 9999px;
  font-size: var(--ax-text-xs, 12px);
  font-weight: 500;
  white-space: nowrap;
  background: var(--ax-surface-solid, #ffffff);
  border: 1px solid var(--ax-border, #cbd5e1);
  color: var(--ax-text, #1e293b);
  cursor: pointer;
  transition: all 0.15s ease;
}
.swp-section-pill-btn:hover,
.swp-section-pill-btn.active {
  border-color: #2559bf;
  color: #2559bf;
  background: color-mix(in srgb, #2559bf 6%, #ffffff);
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
  border-top: 1px dashed var(--ax-border, #e2e8f0);
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
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.ax-float__input::placeholder { color: transparent; }
.ax-float__input:focus {
  border-color: #2559bf;
  box-shadow: 0 0 0 3px rgba(37, 89, 191, 0.15);
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
  border-radius: 4px;
  pointer-events: none;
  transition: top 0.15s ease, font-size 0.15s ease, color 0.15s ease;
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

.ax-table-wrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  width: 100%;
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
  accept = '.pdf,.jpg,.jpeg,.png',
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
            ? '1.5px dashed #2559bf'
            : error
            ? '1.5px dashed var(--ax-danger-500, #ef4444)'
            : isHovered
            ? '1.5px dashed #94a3b8'
            : '1.5px dashed #cbd5e1',
          borderRadius: 8,
          background: disabled
            ? 'var(--ax-surface-subtle, #f8fafc)'
            : isDragging
            ? '#eff4fc'
            : error
            ? '#fef2f2'
            : isHovered
            ? '#fbfcfd'
            : '#ffffff',
          opacity: disabled ? 0.75 : 1,
          padding: file || preview ? '12px 14px' : '20px 16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          minHeight: 105,
        }}
      >
        {file || preview ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, textAlign: 'left' }}>
              {preview ? (
                <img
                  src={preview}
                  alt={label}
                  style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--ax-border, #e2e8f0)' }}
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
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'rgba(37, 89, 191, 0.1)',
                color: '#2559bf',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 6,
              }}
            >
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                <path d="M12 12v9" />
                <path d="m8 16 4-4 4 4" />
              </svg>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong, #1e293b)' }}>
              Click to upload or drag & drop file
            </div>
            <div style={{ fontSize: 11, color: 'var(--ax-text-muted, #64748b)', marginTop: 3 }}>
              PDF, JPG, JPEG or PNG (Max 10 MB)
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

export interface JammuConsumerSite {
  id: number;
  consumer_no: string;
  consumer_name: string;
  father_name?: string;
  sanction_load: string | number;
  plant_sc?: string | number;
  district: string;
  division: string;
  subdivision: string;
  address: string;
  ca_no?: string;
}

// User specified exact vendor options
const VENDOR_OPTIONS = [
  'App Testing',
  'bharti',
  'bharti ks',
  'Jammu TEsting',
  'mohit',
  'utkarsh',
];

// District options for Jammu
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

// Generates fallback consumer rooftop sites for Jammu districts
const generateMockJammuSites = (district: string): JammuConsumerSite[] => {
  const dist = district || 'Jammu';
  const names = [
    'Mohammad Rafiq Bhat',
    'Sunil Sharma',
    'Parvez Ahmad Lone',
    'Rajesh Kumar Gupta',
    'Abdul Hamid Mir',
    'Virender Singh Jamwal',
    'Tariq Hussain Shah',
    'Anita Devi',
    'Kuldeep Singh Manhas',
    'Farooq Ahmad Wani',
    'Sanjay Bakshi',
    'Pooja Choudhary',
  ];
  const loads = ['3.3 kW', '5.0 kW', '7.5 kW', '10.0 kW', '15.0 kW'];
  const divisions = ['Division-I (City)', 'Division-II (Suburban)', 'Division-III (Rural)', 'North Zone', 'South Zone'];

  return Array.from({ length: 12 }, (_, i) => {
    const id = 1000 + i + 1;
    return {
      id,
      consumer_no: `JK-70M-${dist.substring(0, 3).toUpperCase()}-${1000 + i}`,
      consumer_name: names[i % names.length],
      father_name: `S/o ${names[(i + 3) % names.length].split(' ')[0]}`,
      sanction_load: loads[i % loads.length],
      plant_sc: `${loads[i % loads.length]} RTS`,
      district: dist,
      division: divisions[i % divisions.length],
      subdivision: `Sub-Div ${((i % 4) + 1)}`,
      address: `Plot ${i + 14}, Main Sector, ${dist}, J&K`,
      ca_no: `CA-${982000 + i}`,
    };
  });
};

export function AssignSrtSites() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit') || searchParams.get('id');
  const isEditMode = Boolean(editId);

  // Form values (exact fields requested)
  const [vendorName, setVendorName] = useState<string>('');
  const [stateName, setStateName] = useState<string>('Jammu');
  const [district, setDistrict] = useState<string>('');
  const [selectedSiteIds, setSelectedSiteIds] = useState<number[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [remarks, setRemarks] = useState<string>('');

  // Sites list & search
  const [consumerSites, setConsumerSites] = useState<JammuConsumerSite[]>([]);
  const [siteFilterQuery, setSiteFilterQuery] = useState<string>('');

  // Status & feedback
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  // Section refs for navigation pills
  const sec1 = useRef<HTMLDivElement>(null);
  const sec2 = useRef<HTMLDivElement>(null);
  const sec3 = useRef<HTMLDivElement>(null);

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Populate sites when district changes
  useEffect(() => {
    const targetDist = district || 'Jammu';
    const list = generateMockJammuSites(targetDist);
    setConsumerSites(list);
    // Pre-select first 3 sites as starting example
    setSelectedSiteIds(list.slice(0, 3).map((s) => s.id));
  }, [district]);

  const handleToggleSite = (id: number) => {
    setSelectedSiteIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };

  const handleSelectAll = () => {
    if (selectedSiteIds.length === consumerSites.length) {
      setSelectedSiteIds([]);
    } else {
      setSelectedSiteIds(consumerSites.map((s) => s.id));
    }
  };

  const filteredSites = useMemo(() => {
    const q = siteFilterQuery.trim().toLowerCase();
    if (!q) return consumerSites;
    return consumerSites.filter((s) => {
      return (
        String(s.id).includes(q) ||
        s.consumer_name.toLowerCase().includes(q) ||
        s.consumer_no.toLowerCase().includes(q) ||
        s.division.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q)
      );
    });
  }, [consumerSites, siteFilterQuery]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!vendorName) {
      setFeedback({ type: 'danger', text: 'Please select a vendor name.' });
      return;
    }
    if (!stateName) {
      setFeedback({ type: 'danger', text: 'Please select state.' });
      return;
    }
    if (!district) {
      setFeedback({ type: 'danger', text: 'Please select a district.' });
      return;
    }
    if (selectedSiteIds.length === 0) {
      setFeedback({ type: 'danger', text: 'Please select at least one site from the list.' });
      return;
    }
    if (!file && !isEditMode) {
      setFeedback({ type: 'danger', text: 'Please upload the required file.' });
      return;
    }

    setSubmitting(true);
    try {
      // Simulate API submit delay
      await new Promise((res) => setTimeout(res, 800));
      setFeedback({
        type: 'success',
        text: `Jammu SRT 70MW Installation sites assigned successfully to ${vendorName}! (${selectedSiteIds.length} sites allocated)`,
      });
      setTimeout(() => {
        navigate('/vendor-management/jammu/installation/srt-70mw/view-assign-sites');
      }, 1200);
    } catch (err: any) {
      setFeedback({ type: 'danger', text: err?.message || 'Failed to submit assignment.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setVendorName('');
    setStateName('Jammu');
    setDistrict('');
    setRemarks('');
    setFile(null);
    setFeedback(null);
    const list = generateMockJammuSites('Jammu');
    setSelectedSiteIds(list.slice(0, 3).map((s) => s.id));
  };

  return (
    <div className="solar-erp-page swp-inst-form ax-page">
      <style>{SINGLE_CARD_FORM_CSS}</style>

      {/* ── Page Header ── */}
      <PageHead
        title="Assign Jammu SRT 70MW Installation"
        subtitle="The field labels marked with * are required input fields."
        breadcrumbs={[
          { label: 'Home', href: '/vendor-management' },
          { label: 'Assign Jammu SRT 70MW Installation' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2, 8px)' }}>
            <Link
              to="/vendor-management/jammu/installation/srt-70mw/view-assign-sites"
              className="ax-btn ax-btn--secondary ax-btn--sm"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
              View Assigned Sites
            </Link>
            <Link
              to="/vendor-management/jammu/installation/srt-70mw/verify-sites"
              className="ax-btn ax-btn--ghost ax-btn--sm"
            >
              Verify Sites
            </Link>
          </div>
        }
      />

      {feedback && (
        <div
          className={`ax-banner ax-banner--${feedback.type} ax-banner--dismissible`}
          style={{ marginBottom: 'var(--ax-space-4, 16px)' }}
        >
          <div className="ax-banner__icon">
            {feedback.type === 'success' ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : '!'}
          </div>
          <div className="ax-banner__content">
            <p>{feedback.text}</p>
          </div>
          <button
            type="button"
            className="ax-banner__dismiss"
            onClick={() => setFeedback(null)}
            aria-label="Dismiss banner"
          >
            ×
          </button>
        </div>
      )}

      {/* ── Main Unified Form Card ── */}
      <div className="ax-card">
        {/* Header with Quick Navigation Section Pills */}
        <div className="ax-card__header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--ax-text-strong, #0f172a)' }}>
                Assign Jammu SRT 70MW Installation
              </h2>
              <p style={{ fontSize: '12.5px', color: 'var(--ax-text-muted, #64748b)', margin: '4px 0 0 0' }}>
                The field labels marked with * are required input fields.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="ax-badge ax-badge--subtle" style={{ fontWeight: 600 }}>
                Selected Sites: <strong>{selectedSiteIds.length}</strong> / {consumerSites.length}
              </span>
            </div>
          </div>

          <div className="swp-section-pills">
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec1)}>
              <span className="pill-num">1</span>
              <span>Vendor & Location</span>
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec2)}>
              <span className="pill-num">2</span>
              <span>Site Selection</span>
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec3)}>
              <span className="pill-num">3</span>
              <span>File & Remarks</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="ax-card__body">
          <form onSubmit={handleSubmit}>
            {/* Section 1: Vendor & Location */}
            <div ref={sec1} className="swp-section-block">
              <div className="swp-section-header">
                <div className="swp-section-title-wrap">
                  <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: 'var(--ax-text-strong, #0f172a)' }}>
                    1. Vendor & Location Details
                  </h3>
                  <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                    Select the vendor name and geographic district
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                {/* Vendor Name * */}
                <div className="ax-float">
                  <select
                    id="vendorName"
                    name="vendorName"
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    className="ax-float__input"
                    required
                  >
                    <option value="">-- Select Vendor --</option>
                    {VENDOR_OPTIONS.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                  <label htmlFor="vendorName" className="ax-float__label floating">
                    Vendor Name <span style={{ color: 'var(--ax-danger, #ef4444)' }}>*</span>
                  </label>
                </div>

                {/* State * */}
                <div className="ax-float">
                  <select
                    id="stateName"
                    name="stateName"
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    className="ax-float__input"
                    required
                  >
                    <option value="">-- Select State --</option>
                    <option value="Jammu">Jammu</option>
                  </select>
                  <label htmlFor="stateName" className="ax-float__label floating">
                    State <span style={{ color: 'var(--ax-danger, #ef4444)' }}>*</span>
                  </label>
                </div>

                {/* District * */}
                <div className="ax-float">
                  <select
                    id="district"
                    name="district"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="ax-float__input"
                    required
                  >
                    <option value="">-- Select District --</option>
                    {JAMMU_DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  <label htmlFor="district" className="ax-float__label floating">
                    District <span style={{ color: 'var(--ax-danger, #ef4444)' }}>*</span>
                  </label>
                </div>
              </div>
            </div>

            <hr className="swp-section-divider" />

            {/* Section 2: Site Name * */}
            <div ref={sec2} className="swp-section-block">
              <div className="swp-section-header">
                <div className="swp-section-title-wrap">
                  <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: 'var(--ax-text-strong, #0f172a)' }}>
                    2. Site Name <span style={{ color: 'var(--ax-danger, #ef4444)' }}>*</span>
                  </h3>
                  <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                    Select one or more rooftop consumer sites for installation assignment ({district || 'All Districts'})
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative', width: 220 }}>
                    <input
                      type="text"
                      className="ax-input ax-input--sm"
                      placeholder="Search site / consumer..."
                      value={siteFilterQuery}
                      onChange={(e) => setSiteFilterQuery(e.target.value)}
                      style={{ paddingLeft: 28, width: '100%', height: 32, fontSize: 12.5 }}
                    />
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
                    >
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </div>
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="ax-btn ax-btn--secondary ax-btn--sm"
                    style={{ fontSize: 12, height: 32 }}
                  >
                    {selectedSiteIds.length === consumerSites.length ? 'Deselect All' : 'Select All Sites'}
                  </button>
                </div>
              </div>

              {/* Table of Consumer Sites */}
              <div className="ax-table-wrap" style={{ border: '1px solid var(--ax-border, #e2e8f0)', borderRadius: 10, maxHeight: 360, overflowY: 'auto' }}>
                <table className="ax-table" style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse', minWidth: 680 }}>
                  <thead style={{ background: 'var(--ax-surface-subtle, #f8fafc)', position: 'sticky', top: 0, zIndex: 3 }}>
                    <tr>
                      <th style={{ width: 44, textAlign: 'center', padding: '10px 8px' }}>
                        <input
                          type="checkbox"
                          checked={consumerSites.length > 0 && selectedSiteIds.length === consumerSites.length}
                          onChange={handleSelectAll}
                          aria-label="Select all sites"
                        />
                      </th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--ax-text-muted, #64748b)' }}>Site Name & Consumer</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--ax-text-muted, #64748b)' }}>CA Number</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--ax-text-muted, #64748b)' }}>Capacity</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--ax-text-muted, #64748b)' }}>Division</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--ax-text-muted, #64748b)' }}>Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSites.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--ax-text-muted, #64748b)' }}>
                          No rooftop consumer sites matching query.
                        </td>
                      </tr>
                    ) : (
                      filteredSites.map((site) => {
                        const isSelected = selectedSiteIds.includes(site.id);
                        return (
                          <tr
                            key={site.id}
                            onClick={() => handleToggleSite(site.id)}
                            style={{
                              cursor: 'pointer',
                              background: isSelected ? 'rgba(37, 89, 191, 0.06)' : undefined,
                              borderBottom: '1px solid var(--ax-border-subtle, #f1f5f9)',
                            }}
                          >
                            <td style={{ textAlign: 'center', padding: '10px 8px' }} onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleSite(site.id)}
                                aria-label={`Select site ${site.consumer_no}`}
                              />
                            </td>
                            <td style={{ padding: '10px 12px' }}>
                              <div style={{ fontWeight: 600, color: 'var(--ax-text-strong, #0f172a)' }}>{site.consumer_name}</div>
                              <div style={{ fontSize: 11, color: 'var(--ax-text-muted, #64748b)' }}>{site.consumer_no} · {site.father_name}</div>
                            </td>
                            <td style={{ padding: '10px 12px', fontFamily: 'var(--ax-font-mono, monospace)', fontSize: 12 }}>
                              {site.ca_no || '—'}
                            </td>
                            <td style={{ padding: '10px 12px' }}>
                              <span className="ax-badge ax-badge--info" style={{ fontWeight: 600, fontSize: 11 }}>
                                {site.sanction_load}
                              </span>
                            </td>
                            <td style={{ padding: '10px 12px', color: 'var(--ax-text, #334155)' }}>
                              {site.division}
                            </td>
                            <td style={{ padding: '10px 12px', color: 'var(--ax-text-muted, #64748b)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {site.address}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <hr className="swp-section-divider" />

            {/* Section 3: File * & Remarks */}
            <div ref={sec3} className="swp-section-block">
              <div className="swp-section-header">
                <div className="swp-section-title-wrap">
                  <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: 'var(--ax-text-strong, #0f172a)' }}>
                    3. File Upload & Remarks
                  </h3>
                  <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                    Upload assignment document and provide any additional remarks
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
                {/* File * Dropzone */}
                <div>
                  <UploadDropzone
                    id="assignment-file"
                    label="File"
                    required
                    file={file}
                    onSelect={(f) => setFile(f)}
                    onRemove={() => setFile(null)}
                  />
                </div>

                {/* Remarks */}
                <div>
                  <div className="ax-float" style={{ height: '100%' }}>
                    <textarea
                      id="remarks"
                      name="remarks"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Remarks"
                      className="ax-float__input"
                      style={{ height: '105px', padding: '16px 14px 4px 14px', resize: 'vertical' }}
                    />
                    <label htmlFor="remarks" className={`ax-float__label ${remarks ? 'floating' : ''}`}>
                      Remarks
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Toolbar */}
            <div
              style={{
                marginTop: 32,
                paddingTop: 20,
                borderTop: '1px solid var(--ax-border, #e2e8f0)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <button
                type="button"
                onClick={handleReset}
                className="ax-btn ax-btn--secondary"
                disabled={submitting}
              >
                Reset
              </button>
              <button
                type="submit"
                className="ax-btn ax-btn--primary"
                disabled={submitting || selectedSiteIds.length === 0}
                style={{ minWidth: 160 }}
              >
                {submitting ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <svg className="ax-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite' }}>
                      <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12" />
                    </svg>
                    Saving...
                  </span>
                ) : (
                  `Assign Jammu SRT 70MW Installation`
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AssignSrtSites;
