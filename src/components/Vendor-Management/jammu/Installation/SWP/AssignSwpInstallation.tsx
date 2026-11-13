import { useState, useEffect, useRef, useMemo, type FormEvent, type ChangeEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  jammuAdminSwpService,
  resolveJammuSwpMediaUrl,
  type JammuSwpVendorItem,
  type JammuSwpVolumeItem,
  type JammuSwpDistrictItem,
  type JammuSwpFarmerSiteItem,
} from './jammuSwpAdminService';

// Unified Single-Card Layout with Floating Labels & Section Dividers
const SINGLE_CARD_FORM_CSS = `
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
  border-radius: var(--ax-radius-pill, 9999px);
  font-size: var(--ax-text-xs, 12px);
  font-weight: 500;
  white-space: nowrap;
  background: var(--ax-surface-solid, #ffffff);
  border: 1px solid var(--ax-border, #cbd5e1);
  color: var(--ax-text, #334155);
  cursor: pointer;
  transition: all 0.15s ease;
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

/* Floating Label Core */
.ax-float { position: relative; width: 100%; }
.ax-float__input {
  width: 100%;
  height: 46px;
  padding: 12px 14px 4px 14px;
  font-size: var(--ax-text-sm, 14px);
  background: var(--ax-surface-solid, #ffffff);
  border: 1px solid var(--ax-border, #cbd5e1);
  border-radius: var(--ax-radius-md, 8px);
  color: var(--ax-text, #0f172a);
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.ax-float__input::placeholder { color: transparent; }
.ax-float__input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}
.ax-float__input:disabled { opacity: .7; cursor: not-allowed; background: var(--ax-surface-subtle, #f8fafc); }

.ax-float__label {
  position: absolute;
  inset-inline-start: 12px;
  top: 50%;
  transform: translateY(-50%);
  margin: 0;
  padding: 0 4px;
  font-size: var(--ax-text-sm, 14px);
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
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
    </div>
  );
}

function FloatingSelect({
  label,
  name,
  value,
  onChange,
  options,
  required,
  disabled,
  hint,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string | number; label: string }[];
  required?: boolean;
  disabled?: boolean;
  hint?: string;
}) {
  const [focused, setFocused] = useState(false);
  const hasVal = Boolean(value && String(value).length > 0);

  return (
    <div className="ax-float">
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        required={required}
        disabled={disabled}
        className="ax-float__input"
        style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
      >
        <option value="" disabled hidden></option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <label htmlFor={name} className={`ax-float__label ${focused ? 'floating' : hasVal ? 'has-val' : ''}`}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      {hint && <span style={{ fontSize: 11, color: '#64748b', marginTop: 4, display: 'block' }}>{hint}</span>}
    </div>
  );
}

/* File Upload Component matching DLE standard */
function FileUploadBox({
  label,
  file,
  preview,
  onChange,
  onClear,
  disabled,
  error,
}: {
  label: string;
  file: File | null;
  preview?: string;
  onChange: (f: File) => void;
  onClear: () => void;
  disabled?: boolean;
  error?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setIsDragOver(true);
    else if (e.type === 'dragleave') setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onChange(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onChange(e.target.files[0]);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (inputRef.current) inputRef.current.value = '';
    onClear();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong, #0f172a)' }}>
        {label}
      </label>
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        style={{
          border: `2px dashed ${error ? '#ef4444' : isDragOver ? '#2563eb' : '#cbd5e1'}`,
          borderRadius: 12,
          padding: '16px 20px',
          background: isDragOver ? '#eff6ff' : '#f8fafc',
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
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          disabled={disabled}
        />
        {file || preview ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, textAlign: 'left' }}>
              {preview && !preview.endsWith('.pdf') ? (
                <img
                  src={preview}
                  alt={label}
                  style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6, border: '1px solid #cbd5e1' }}
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
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file ? file.name : label}
                </div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
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
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
              Click to upload or drag & drop work order
            </div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>
              PDF, JPG, JPEG or PNG (Max 5 MB)
            </div>
          </>
        )}
      </div>

      {error && (
        <span style={{ fontSize: 11, color: '#ef4444', marginTop: 2 }}>
          {error}
        </span>
      )}
    </div>
  );
}

export function AssignSwpInstallation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit') || searchParams.get('id');
  const isEditMode = Boolean(editId);

  // Master datasets
  const [vendors, setVendors] = useState<JammuSwpVendorItem[]>([]);
  const [volumes, setVolumes] = useState<JammuSwpVolumeItem[]>([]);
  const [districts, setDistricts] = useState<JammuSwpDistrictItem[]>([]);
  const [farmers, setFarmers] = useState<JammuSwpFarmerSiteItem[]>([]);

  // Form values
  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [selectedVolume, setSelectedVolume] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedSiteIds, setSelectedSiteIds] = useState<number[]>([]);
  const [deadlineDate, setDeadlineDate] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | undefined>(undefined);
  const [remarks, setRemarks] = useState<string>('');

  // Status & loading
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [farmersLoading, setFarmersLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [farmerFilterQuery, setFarmerFilterQuery] = useState<string>('');

  // Section refs for navigation pills
  const sec1 = useRef<HTMLDivElement>(null);
  const sec2 = useRef<HTMLDivElement>(null);
  const sec3 = useRef<HTMLDivElement>(null);
  const sec4 = useRef<HTMLDivElement>(null);

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // 1. Initial Load: Vendors & Volumes
  useEffect(() => {
    let active = true;
    const loadInit = async () => {
      setInitialLoading(true);
      setErrorMsg('');
      try {
        const { vendors: vList, volumes: volList } = await jammuAdminSwpService.getAssignFormData();
        const distList = await jammuAdminSwpService.fetchDistricts();
        if (!active) return;
        setVendors(vList);
        setVolumes(volList);
        setDistricts(distList);

        if (volList.length > 0) setSelectedVolume(volList[0].volume);
        if (vList.length > 0) setSelectedVendor(String(vList[0].id));
        if (distList.length > 0) setSelectedDistrict(distList[0].district);
      } catch (err: any) {
        if (!active) return;
        setErrorMsg(err.message || 'Failed to load master form options.');
      } finally {
        if (active) setInitialLoading(false);
      }
    };
    loadInit();
    return () => { active = false; };
  }, [isEditMode]);

  // 2. Cascade: District -> Farmers
  useEffect(() => {
    if (!selectedDistrict) {
      setFarmers([]);
      setSelectedSiteIds([]);
      return;
    }

    let active = true;
    const loadFarmers = async () => {
      setFarmersLoading(true);
      try {
        const fList = await jammuAdminSwpService.fetchFarmers(selectedDistrict);
        if (!active) return;
        setFarmers(fList);
        // Preselect first 2 for quick assignment demo
        setSelectedSiteIds(fList.slice(0, 2).map((f) => f.id));
      } catch (err: any) {
        if (!active) return;
        setErrorMsg(err.message || `Failed to fetch farmers for ${selectedDistrict}.`);
      } finally {
        if (active) setFarmersLoading(false);
      }
    };

    loadFarmers();
    return () => { active = false; };
  }, [selectedDistrict]);

  // Filtered farmers by search query
  const filteredFarmers = useMemo(() => {
    if (!farmerFilterQuery.trim()) return farmers;
    const q = farmerFilterQuery.toLowerCase().trim();
    return farmers.filter(
      (f) =>
        f.f_farmer_name.toLowerCase().includes(q) ||
        (f.f_farmer_id && f.f_farmer_id.toLowerCase().includes(q)) ||
        (f.f_block && f.f_block.toLowerCase().includes(q)) ||
        (f.f_village && f.f_village.toLowerCase().includes(q)) ||
        (f.contact_no && f.contact_no.includes(q))
    );
  }, [farmers, farmerFilterQuery]);

  const handleSelectAllFarmers = () => {
    if (selectedSiteIds.length === filteredFarmers.length) {
      setSelectedSiteIds([]);
    } else {
      setSelectedSiteIds(filteredFarmers.map((f) => f.id));
    }
  };

  const handleToggleFarmer = (id: number) => {
    setSelectedSiteIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Submit Handler
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedVendor) {
      setErrorMsg('Please select a contracted installation vendor.');
      scrollTo(sec1);
      return;
    }
    if (!selectedVolume) {
      setErrorMsg('Please select an active PM-KUSUM allocation scheme/volume.');
      scrollTo(sec1);
      return;
    }
    if (!selectedDistrict) {
      setErrorMsg('Please select a target installation district.');
      scrollTo(sec2);
      return;
    }
    if (selectedSiteIds.length === 0) {
      setErrorMsg('Please select at least one farmer installation site.');
      scrollTo(sec2);
      return;
    }
    if (!deadlineDate) {
      setErrorMsg('Please specify an installation completion deadline.');
      scrollTo(sec3);
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('state', 'Jammu & Kashmir');
      fd.append('vendor', selectedVendor);
      fd.append('volume', selectedVolume);
      fd.append('district', selectedDistrict);
      fd.append('deadline_date', deadlineDate);
      fd.append('remarks', remarks);
      selectedSiteIds.forEach((sid) => fd.append('site_id[]', String(sid)));
      if (file) fd.append('file', file);

      const res = await jammuAdminSwpService.storeAssign(fd);
      setSuccessMsg(res.message || 'Work order assigned successfully!');
      setTimeout(() => {
        navigate('/vendor-management/jammu/installation/swp/view-assign-installation');
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit assignment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="solar-erp-page swp-inst-form ax-page">
      <style>{SINGLE_CARD_FORM_CSS}</style>

      {/* Page Header */}
      <PageHead
        eyebrow="Super Admin · Vendor Management"
        title="Assign Jammu SWP Installation"
        subtitle="Allocate PM-KUSUM solar water pumping sites and installation orders to vendors across Jammu & Kashmir"
      />

      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" style={{ marginBottom: 16 }}>
        <ol className="ax-breadcrumb" style={{ display: 'flex', gap: 6, listStyle: 'none', padding: 0, margin: 0, fontSize: 13, color: 'var(--ax-text-muted)' }}>
          <li><Link to="/vendor-management" style={{ color: '#2563eb' }}>Home</Link></li>
          <li>/</li>
          <li><Link to="/vendor-management/jammu" style={{ color: '#2563eb' }}>Jammu</Link></li>
          <li>/</li>
          <li><span style={{ color: 'var(--ax-text-muted)' }}>Installation</span></li>
          <li>/</li>
          <li><Link to="/vendor-management/jammu/installation/swp/dashboard" style={{ color: '#2563eb' }}>SWP</Link></li>
          <li>/</li>
          <li style={{ color: 'var(--ax-text-strong)', fontWeight: 600 }}>Assign Installation</li>
        </ol>
      </nav>

      {/* Error / Success Banners */}
      {errorMsg && (
        <div className="ax-card" style={{ padding: '12px 18px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, color: '#dc2626', fontSize: 13, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{errorMsg}</span>
          <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" onClick={() => setErrorMsg('')} style={{ color: '#dc2626' }}>Dismiss</button>
        </div>
      )}
      {successMsg && (
        <div className="ax-card" style={{ padding: '12px 18px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, color: '#16a34a', fontSize: 13, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{successMsg}</span>
        </div>
      )}

      {/* Single Unified Card */}
      <div className="ax-card">
        {/* Card Header with Quick Nav Pills */}
        <div className="ax-card__header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--ax-text-strong)' }}>
                Work Order Allocation Register
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--ax-text-muted)' }}>
                Fill in contractor details, target district, eligible farmers, and issuance terms
              </p>
            </div>
            <Link to="/vendor-management/jammu/installation/swp/view-assign-installation" className="ax-btn ax-btn--secondary ax-btn--sm">
              View Assigned Register →
            </Link>
          </div>

          {/* Quick Navigation Pills */}
          <div className="swp-section-pills">
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec1)}>
              <span className="pill-num">1</span>
              <span>Vendor & Scheme</span>
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec2)}>
              <span className="pill-num">2</span>
              <span>District & Farmer Sites</span>
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec3)}>
              <span className="pill-num">3</span>
              <span>Work Order & Terms</span>
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec4)}>
              <span className="pill-num">4</span>
              <span>Review & Authorize</span>
            </button>
          </div>
        </div>

        {/* Card Body */}
        <div className="ax-card__body">
          {initialLoading ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#64748b' }}>
              Loading master datasets & configuration...
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* ──── Section 1: Vendor & Scheme ──── */}
              <div ref={sec1} className="swp-section-block">
                <div className="swp-section-header">
                  <div className="swp-section-title-wrap">
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase' }}>Section 1</span>
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Vendor & Allocation Volume</h4>
                  </div>
                  <span style={{ fontSize: 11, color: '#64748b' }}>Designated contractor agency</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 20 }}>
                  <FloatingSelect
                    label="Contracted Vendor"
                    name="vendor"
                    value={selectedVendor}
                    onChange={(e) => setSelectedVendor(e.target.value)}
                    options={vendors.map((v) => ({ value: v.id, label: `${v.name} (${v.email || 'J&K Authorized'})` }))}
                    required
                  />

                  <FloatingSelect
                    label="Allocation Volume / Scheme"
                    name="volume"
                    value={selectedVolume}
                    onChange={(e) => setSelectedVolume(e.target.value)}
                    options={volumes.map((vol) => ({ value: vol.volume, label: `${vol.volume} (Target: ${vol.target || 0})` }))}
                    required
                  />
                </div>
              </div>

              <hr className="swp-section-divider" />

              {/* ──── Section 2: District & Farmer Sites ──── */}
              <div ref={sec2} className="swp-section-block">
                <div className="swp-section-header">
                  <div className="swp-section-title-wrap">
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase' }}>Section 2</span>
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Target District & Eligible Farmers</h4>
                  </div>
                  <span style={{ fontSize: 11, color: '#64748b' }}>Selected: <strong>{selectedSiteIds.length}</strong> sites</span>
                </div>

                <div style={{ marginBottom: 18 }}>
                  <FloatingSelect
                    label="Target District"
                    name="district"
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    options={districts.map((d) => ({ value: d.district, label: `${d.district} (UT Jammu & Kashmir)` }))}
                    required
                  />
                </div>

                {/* Farmer Selection Card */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 20px', background: '#f8fafc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <button
                        type="button"
                        className="ax-btn ax-btn--secondary ax-btn--sm"
                        onClick={handleSelectAllFarmers}
                        disabled={farmersLoading || filteredFarmers.length === 0}
                      >
                        {selectedSiteIds.length === filteredFarmers.length && filteredFarmers.length > 0 ? 'Deselect All' : 'Select All Filtered'}
                      </button>
                      <span style={{ fontSize: 12, color: '#64748b' }}>
                        Showing <strong>{filteredFarmers.length}</strong> eligible farmer sites
                      </span>
                    </div>

                    <div style={{ width: 260, maxWidth: '100%' }}>
                      <input
                        type="text"
                        placeholder="Search by farmer name, ID, village..."
                        value={farmerFilterQuery}
                        onChange={(e) => setFarmerFilterQuery(e.target.value)}
                        className="ax-form-control"
                        style={{ width: '100%', padding: '6px 12px', fontSize: 12, borderRadius: 6, border: '1px solid #cbd5e1' }}
                      />
                    </div>
                  </div>

                  {/* Farmers List */}
                  {farmersLoading ? (
                    <div style={{ textAlign: 'center', padding: '24px 0', color: '#64748b' }}>
                      Loading eligible farmers in {selectedDistrict}...
                    </div>
                  ) : filteredFarmers.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px 0', color: '#64748b' }}>
                      No eligible unassigned farmers found in {selectedDistrict}.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, maxHeight: 280, overflowY: 'auto', paddingRight: 4 }}>
                      {filteredFarmers.map((f) => {
                        const checked = selectedSiteIds.includes(f.id);
                        return (
                          <div
                            key={f.id}
                            onClick={() => handleToggleFarmer(f.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 10,
                              padding: '10px 14px',
                              borderRadius: 8,
                              background: checked ? '#eff6ff' : '#ffffff',
                              border: `1px solid ${checked ? '#2563eb' : '#e2e8f0'}`,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {}}
                              style={{ marginTop: 3, cursor: 'pointer' }}
                            />
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                                {f.f_farmer_name}
                              </div>
                              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                                ID: <strong style={{ color: '#2563eb' }}>{f.f_farmer_id}</strong> · {f.f_block || 'Block'}, {f.f_village || 'Village'}
                              </div>
                              <div style={{ fontSize: 11, color: '#10b981', fontWeight: 600, marginTop: 2 }}>
                                Capacity: {f.pump_capacity || '5.0 HP'} ({f.pump_type || 'AC'} {f.pump_subtype || 'Submersible'})
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <hr className="swp-section-divider" />

              {/* ──── Section 3: Work Order File & Deadline ──── */}
              <div ref={sec3} className="swp-section-block">
                <div className="swp-section-header">
                  <div className="swp-section-title-wrap">
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase' }}>Section 3</span>
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Work Order Document & Deadline</h4>
                  </div>
                  <span style={{ fontSize: 11, color: '#64748b' }}>Execution timeline & official mandate</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 20 }}>
                  <FloatingInput
                    label="Installation Deadline"
                    name="deadlineDate"
                    type="date"
                    value={deadlineDate}
                    onChange={(e) => setDeadlineDate(e.target.value)}
                    required
                  />

                  <div className="ax-float">
                    <textarea
                      id="remarks"
                      name="remarks"
                      rows={2}
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Special instructions or field terms for this cluster..."
                      className="ax-float__input"
                      style={{ height: 46, resize: 'none', paddingTop: 12 }}
                    />
                    <label htmlFor="remarks" className="ax-float__label floating">
                      Special Allocation Remarks
                    </label>
                  </div>
                </div>

                <div style={{ marginTop: 18 }}>
                  <FileUploadBox
                    label="Signed Work Order / Sanction Mandate (PDF / Scan)"
                    file={file}
                    preview={filePreview}
                    onChange={(f) => {
                      setFile(f);
                      if (f.type.startsWith('image/')) setFilePreview(URL.createObjectURL(f));
                      else setFilePreview(undefined);
                    }}
                    onClear={() => {
                      setFile(null);
                      setFilePreview(undefined);
                    }}
                  />
                </div>
              </div>

              <hr className="swp-section-divider" />

              {/* ──── Section 4: Review & Submit ──── */}
              <div ref={sec4} className="swp-section-block" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                    Ready to Allocate {selectedSiteIds.length} PM-KUSUM Solar Water Pump Sites
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                    District: <strong>{selectedDistrict || 'None'}</strong> · Vendor: <strong>{vendors.find((v) => String(v.id) === selectedVendor)?.name || 'None'}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    className="ax-btn ax-btn--secondary"
                    onClick={() => navigate('/vendor-management/jammu/installation/swp/view-assign-installation')}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="ax-btn ax-btn--primary"
                    disabled={submitting}
                    style={{ background: '#2563eb', borderColor: '#2563eb', minWidth: 160 }}
                  >
                    {submitting ? 'Allocating Order...' : 'Confirm & Issue Order'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default AssignSwpInstallation;
