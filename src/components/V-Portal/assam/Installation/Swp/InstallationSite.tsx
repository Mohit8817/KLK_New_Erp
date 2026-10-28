import { useState, useEffect, useRef, useMemo, type FormEvent, type ChangeEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  assamSwpService,
  resolveAssamMediaUrl,
  type InstallableSiteName,
  type InstallSiteDetails,
} from '../../assam-services';

// Unified Single-Card Layout with Floating Labels & Section Dividers (matching Bihar reference)
const SINGLE_CARD_FORM_CSS = `
.swp-inst-form .ax-card {
  border: 1px solid var(--ax-border);
  border-radius: var(--ax-radius-xl, 16px);
  background: var(--ax-surface-solid);
  box-shadow: var(--ax-shadow-sm);
  overflow: hidden;
}
.swp-inst-form .ax-card__header {
  padding: var(--ax-space-5) var(--ax-space-6);
  border-bottom: 1px solid var(--ax-border-subtle);
  background: var(--ax-surface-subtle);
  display: flex;
  flex-direction: column;
  gap: var(--ax-space-4);
}
.swp-inst-form .ax-card__body { padding: var(--ax-space-6); }

/* Quick Section Nav Pills */
.swp-section-pills {
  display: flex;
  gap: var(--ax-space-2);
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: thin;
}
.swp-section-pill-btn {
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
}
.swp-section-pill-btn:hover {
  border-color: #2563eb;
  color: #2563eb;
  background: color-mix(in srgb, #2563eb 6%, var(--ax-surface-solid));
}
.swp-section-pill-btn .pill-num {
  width: 18px; height: 18px; border-radius: 50%;
  background: var(--ax-surface-subtle);
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 700;
}

/* Section Block */
.swp-section-block { padding-top: var(--ax-space-2); }
.swp-section-header {
  display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap;
  gap: var(--ax-space-2);
  margin-bottom: var(--ax-space-5);
  padding-bottom: var(--ax-space-3);
  border-bottom: 1px solid var(--ax-border-subtle);
}
.swp-section-title-wrap { display: flex; flex-direction: column; gap: 4px; }
.swp-section-divider {
  border: 0;
  border-top: 1px dashed var(--ax-border);
  margin: var(--ax-space-8) 0 var(--ax-space-6);
}

/* Floating Label Core */
.ax-float { position: relative; width: 100%; }
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
.ax-float__input::placeholder { color: transparent; }
.ax-float__input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px color-mix(in srgb, #2563eb 20%, transparent);
}
.ax-float__input:disabled { opacity: .7; cursor: not-allowed; background: var(--ax-surface-subtle); }

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
  color: var(--ax-text-muted);
}

/* GPS Section 3 columns in 1 line */
.swp-gps-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}
@media (max-width: 768px) {
  .swp-gps-grid {
    grid-template-columns: 1fr;
  }
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

/* ───────── Modern Upload Dropzone (matching reference code) ───────── */
interface UploadDropzoneProps {
  id: string;
  label: string;
  required?: boolean;
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
  accept = 'image/*',
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
    onRemove();
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
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
        capture="environment"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onSelect(f);
        }}
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
            : isHovered
            ? '1.5px dashed #94a3b8'
            : '1.5px dashed #cbd5e1',
          borderRadius: 8,
          background: isDragging
            ? '#eff6ff'
            : error
            ? '#fef2f2'
            : isHovered
            ? '#fbfcfd'
            : '#ffffff',
          padding: file || preview ? '12px 14px' : '22px 16px',
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
        {file || preview ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, textAlign: 'left' }}>
              {preview ? (
                <img
                  src={preview}
                  alt={label}
                  style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--ax-border)' }}
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
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file ? file.name : label}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', marginTop: 2 }}>
                  {file ? `${(file.size / 1024).toFixed(0)} KB · Ready to upload` : 'Photo captured'}
                </div>
              </div>
            </div>
            <button
              type="button"
              className="ax-btn ax-btn--ghost ax-btn--sm"
              onClick={handleClear}
              style={{ color: '#ef4444', flexShrink: 0 }}
              title="Remove photo"
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
              JPG, PNG or JPEG image — single file
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

export function Assam_Installation_SWP_Site() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit_id') || searchParams.get('id');
  const isEditMode = Boolean(editId);

  // Site Dropdown & Detail State
  const [sitesList, setSitesList] = useState<InstallableSiteName[]>([]);
  const [loadingSites, setLoadingSites] = useState(false);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [siteDetail, setSiteDetail] = useState<InstallSiteDetails | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Form State
  const [inverterNo, setInverterNo] = useState('');
  const [vfdNo, setVfdNo] = useState('');
  const [moduleSerials, setModuleSerials] = useState<string[]>(['']);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [remarks, setRemarks] = useState('');

  // Photo Files & Previews
  const [files, setFiles] = useState<{
    module_image: File | null;
    inverter_vfd_image: File | null;
    running_water_image: File | null;
  }>({
    module_image: null,
    inverter_vfd_image: null,
    running_water_image: null,
  });

  const [previews, setPreviews] = useState<{
    module_image: string;
    inverter_vfd_image: string;
    running_water_image: string;
  }>({
    module_image: '',
    inverter_vfd_image: '',
    running_water_image: '',
  });

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  // Section refs for smooth scrolling
  const sec1 = useRef<HTMLDivElement>(null);
  const sec2 = useRef<HTMLDivElement>(null);
  const sec3 = useRef<HTMLDivElement>(null);
  const sec4 = useRef<HTMLDivElement>(null);
  const sec5 = useRef<HTMLDivElement>(null);

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // 1. Load pending site names (API 4) in Add mode
  useEffect(() => {
    if (isEditMode) return;
    const fetchSites = async () => {
      try {
        setLoadingSites(true);
        const data = await assamSwpService.getInstallableSiteNameList();
        setSitesList(Array.isArray(data) ? data : []);
      } catch (err: any) {
        console.error('[Assam SWP Installation] fetchSiteNames error:', err);
      } finally {
        setLoadingSites(false);
      }
    };
    fetchSites();
  }, [isEditMode]);

  // 2. Load site details on site selection (API 5)
  const handleSiteSelect = async (siteId: string) => {
    setSelectedSiteId(siteId);
    setSiteDetail(null);
    if (!siteId) return;

    try {
      setLoadingDetail(true);
      const detail = await assamSwpService.getInstallSiteDetails(siteId);
      if (detail) {
        setSiteDetail(detail);
      }
    } catch (err: any) {
      console.error('[Assam SWP Installation] fetchSiteDetail error:', err);
      setFeedback({ type: 'danger', text: 'Failed to load site details.' });
    } finally {
      setLoadingDetail(false);
    }
  };

  // 3. Load for Edit (API 8) if in Edit mode
  useEffect(() => {
    if (!editId) return;
    let isMounted = true;
    const loadForEdit = async () => {
      setLoadingDetail(true);
      try {
        const res = await assamSwpService.getInstallSiteForUpdate(editId);
        if (!isMounted) return;
        const s = (res as any).site || (res as any).data?.site || (res as any).data || res;
        if (s) {
          const siteIdVal = String(s.id || s.site_id || editId);
          setSelectedSiteId(siteIdVal);
          setSiteDetail({
            id: Number(siteIdVal),
            state: s.state || 'Assam',
            district: s.district,
            block: s.block,
            village: s.village,
            tehsil: s.tehsil || s.block,
            farmer_name: s.farmer_name,
            father_name: s.father_name,
            farmer_contact: s.farmer_contact,
            customer_no: s.customer_no,
            pump_capacity: s.pump_capacity,
            pump_type: s.pump_type,
            pump_sub_type: s.pump_sub_type,
          });
          setInverterNo(s.inverter_no || '');
          setVfdNo(s.vfd_no || '');

          if (Array.isArray(s.module_serial_no)) {
            setModuleSerials(s.module_serial_no.length > 0 ? s.module_serial_no : ['']);
          } else if (typeof s.module_serial_no === 'string') {
            try {
              const parsed = JSON.parse(s.module_serial_no);
              if (Array.isArray(parsed) && parsed.length > 0) setModuleSerials(parsed);
              else setModuleSerials([s.module_serial_no || '']);
            } catch {
              const parts = s.module_serial_no.split(',').map((x: string) => x.trim()).filter(Boolean);
              setModuleSerials(parts.length > 0 ? parts : ['']);
            }
          } else {
            setModuleSerials(['']);
          }

          setLatitude(s.latitude || s.inst_latitude || '');
          setLongitude(s.longitude || s.inst_longitude || '');
          setRemarks(s.inst_remarks || s.remarks || '');

          // Existing image previews
          const modImg = s.module_image || s.module_photo;
          if (modImg) {
            setPreviews((prev) => ({ ...prev, module_image: resolveAssamMediaUrl(modImg) }));
          }
          const invImg = s.inverter_vfd_image || s.inverter_vfd_photo;
          if (invImg) {
            setPreviews((prev) => ({ ...prev, inverter_vfd_image: resolveAssamMediaUrl(invImg) }));
          }
          const waterImg = s.running_water_image || s.running_water_photo;
          if (waterImg) {
            setPreviews((prev) => ({ ...prev, running_water_image: resolveAssamMediaUrl(waterImg) }));
          }
        }
      } catch (err: any) {
        if (isMounted) setFeedback({ type: 'danger', text: err?.message || 'Failed to load site details for edit' });
      } finally {
        if (isMounted) setLoadingDetail(false);
      }
    };
    loadForEdit();
    return () => { isMounted = false; };
  }, [editId]);

  // Remove photo handler
  const removeFile = (field: keyof typeof files) => {
    setFiles((prev) => ({ ...prev, [field]: null }));
    if (previews[field]) {
      URL.revokeObjectURL(previews[field]);
      setPreviews((prev) => ({ ...prev, [field]: '' }));
    }
  };

  // Dynamic Module Serial Numbers
  const handleModuleChange = (index: number, val: string) => {
    setModuleSerials((prev) => prev.map((s, i) => (i === index ? val : s)));
  };
  const handleAddModule = () => {
    setModuleSerials((prev) => [...prev, '']);
  };
  const handleRemoveModule = (index: number) => {
    if (moduleSerials.length > 1) {
      setModuleSerials((prev) => prev.filter((_, i) => i !== index));
    }
  };

  // Geolocation
  const detectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(String(pos.coords.latitude.toFixed(6)));
        setLongitude(String(pos.coords.longitude.toFixed(6)));
        setGettingLocation(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        alert('Could not retrieve GPS coordinates. Please enter manually.');
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Form Submit (API 6 or API 9)
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedSiteId) {
      setFeedback({ type: 'danger', text: 'Please select an installation site first.' });
      scrollTo(sec1);
      return;
    }

    if (!inverterNo.trim()) {
      setFeedback({ type: 'danger', text: 'Inverter Number is required.' });
      scrollTo(sec3);
      return;
    }
    if (!vfdNo.trim()) {
      setFeedback({ type: 'danger', text: 'VFD Number is required.' });
      scrollTo(sec3);
      return;
    }

    const filteredModules = moduleSerials.map((s) => s.trim()).filter(Boolean);
    if (filteredModules.length === 0) {
      setFeedback({ type: 'danger', text: 'At least one Module Serial Number is required.' });
      scrollTo(sec3);
      return;
    }

    // Client-side duplicate check
    const uniqueSerials = new Set(filteredModules);
    if (uniqueSerials.size !== filteredModules.length) {
      setFeedback({ type: 'danger', text: 'Duplicate Module Serial Numbers entered in the form.' });
      scrollTo(sec3);
      return;
    }

    if (!latitude.trim() || !longitude.trim()) {
      setFeedback({ type: 'danger', text: 'GPS Latitude and Longitude are required.' });
      scrollTo(sec4);
      return;
    }

    if (!isEditMode) {
      if (!files.module_image) {
        setFeedback({ type: 'danger', text: 'Farmer with Module Image is required.' });
        scrollTo(sec5);
        return;
      }
      if (!files.inverter_vfd_image) {
        setFeedback({ type: 'danger', text: 'Farmer with VFD and Inverter Image is required.' });
        scrollTo(sec5);
        return;
      }
      if (!files.running_water_image) {
        setFeedback({ type: 'danger', text: 'Farmer with Running Water Image is required.' });
        scrollTo(sec5);
        return;
      }
    }

    try {
      setSubmitting(true);
      setFeedback(null);

      const fd = new FormData();
      fd.append('site_id', selectedSiteId);
      fd.append('id', selectedSiteId);
      if (isEditMode) {
        fd.append('update_id', selectedSiteId);
      }
      fd.append('inverter_no', inverterNo.trim());
      fd.append('vfd_no', vfdNo.trim());

      filteredModules.forEach((m) => {
        fd.append('module_serial_no[]', m);
      });

      fd.append('inst_latitude', latitude.trim());
      fd.append('latitude', latitude.trim());
      fd.append('inst_longitude', longitude.trim());
      fd.append('longitude', longitude.trim());
      if (remarks.trim()) {
        fd.append('inst_remarks', remarks.trim());
        fd.append('remarks', remarks.trim());
      }
      if (siteDetail?.farmer_name) fd.append('farmer_name', siteDetail.farmer_name);
      if (siteDetail?.farmer_contact) fd.append('farmer_contact', siteDetail.farmer_contact);
      if (siteDetail?.father_name) fd.append('father_name', siteDetail.father_name);

      if (files.module_image) {
        fd.append('module_image', files.module_image);
      }
      if (files.inverter_vfd_image) {
        fd.append('inverter_vfd_image', files.inverter_vfd_image);
      }
      if (files.running_water_image) {
        fd.append('running_water_image', files.running_water_image);
      }

      if (isEditMode) {
        const res = await assamSwpService.updateSiteInstall(fd);
        setFeedback({ type: 'success', text: res.message || 'Details Updated Successfully!' });
      } else {
        const res = await assamSwpService.storeSiteInstall(fd);
        setFeedback({ type: 'success', text: res.message || 'Site Installed Successfully!' });
      }

      setTimeout(() => {
        navigate('/v/assam/installation/swp/view');
      }, 1500);
    } catch (err: any) {
      console.error('[Assam SWP Installation] submit error:', err);
      setFeedback({ type: 'danger', text: err?.message || 'Failed to submit SWP installation.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ax-page swp-inst-form">
      <style>{SINGLE_CARD_FORM_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title={isEditMode ? 'Edit Installation Details' : 'SWP-Installation Details'}
        subtitle={
          isEditMode
            ? 'Update solar water pump equipment numbers, GPS coordinates, and verification photos.'
            : 'Capture Solar Water Pump installation execution data, serial numbers, geocoordinates, and verification photos.'
        }
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Assam' },
          { label: 'Installation' },
          { label: 'SWP' },
          { label: isEditMode ? 'Edit Details' : 'Installation Details' },
        ]}
        actions={
          <Link to="/v/assam/installation/swp/view" className="ax-btn ax-btn--secondary ax-btn--sm">
            View Installed Sites
          </Link>
        }
      />

      {feedback && (
        <div className={`ax-alert ax-alert--${feedback.type}`} style={{ marginBottom: 'var(--ax-space-4)' }}>
          <div className="ax-alert__title">{feedback.type === 'success' ? 'Success' : 'Error'}</div>
          <div className="ax-alert__text">{feedback.text}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="ax-card">
        {/* ── Header with Section Pills ── */}
        <div className="ax-card__header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h2 className="ax-card__title" style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                {isEditMode ? 'Edit Installation Details' : 'Solar Water Pump Installation Form'}
              </h2>
              <p className="ax-card__subtitle" style={{ fontSize: '0.85rem', color: 'var(--ax-text-muted)', margin: '2px 0 0' }}>
                {isEditMode
                  ? 'Update existing solar water pump equipment numbers, GPS coordinates, and verification photos.'
                  : 'Fill out installation details and upload site completion evidence for department verification.'}
              </p>
            </div>
            {siteDetail && (
              <span className="ax-badge ax-badge--soft ax-badge--info" style={{ fontWeight: 600 }}>
                {siteDetail.farmer_name ? `${siteDetail.farmer_name} (${siteDetail.district || ''})` : `Site #${siteDetail.id}`}
              </span>
            )}
          </div>

          {/* Quick Nav Pills */}
          <div className="swp-section-pills">
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec1)}>
              <span className="pill-num">1</span> Site Selection
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec2)}>
              <span className="pill-num">2</span> Beneficiary Info
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec3)}>
              <span className="pill-num">3</span> Equipment Numbers
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec4)}>
              <span className="pill-num">4</span> Geo & Remarks
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec5)}>
              <span className="pill-num">5</span> Site Photos
            </button>
          </div>
        </div>

        <div className="ax-card__body">
          {/* ════════ Section 1: Site Selection ════════ */}
          <div ref={sec1} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>1. Select Installation Site</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted)' }}>
                  {isEditMode
                    ? 'Editing existing installation record'
                    : 'Choose from accepted sites pending installation in Assam'}
                </span>
              </div>
            </div>

            <div className="ax-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <div className="ax-float">
                {isEditMode ? (
                  <>
                    <input
                      id="site_id_select"
                      type="text"
                      className="ax-float__input"
                      value={`Site #${selectedSiteId} - ${siteDetail?.farmer_name || ''}`}
                      disabled
                    />
                    <label htmlFor="site_id_select" className="ax-float__label floating">
                      Installation Site
                    </label>
                  </>
                ) : (
                  <>
                    <select
                      id="site_id_select"
                      className="ax-float__input"
                      value={selectedSiteId}
                      onChange={(e) => handleSiteSelect(e.target.value)}
                      disabled={loadingSites || submitting}
                      required
                    >
                      <option value="">-- Choose Assigned SWP Site --</option>
                      {sitesList.map((s) => (
                        <option key={s.site_id} value={s.site_id}>
                          #{s.site_id} - {s.site_name}
                        </option>
                      ))}
                    </select>
                    <label htmlFor="site_id_select" className="ax-float__label floating">
                      Assigned Site <span style={{ color: 'var(--ax-danger, #ef4444)' }}>*</span>
                    </label>
                  </>
                )}
              </div>
            </div>

            {loadingDetail && (
              <div style={{ padding: '16px 0', color: '#2563eb', fontSize: '13px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="ax-spinner" /> Fetching site specifications & prefilled details...
              </div>
            )}
          </div>

          <hr className="swp-section-divider" />

          {/* ════════ Section 2: Beneficiary / Site Information ════════ */}
          <div ref={sec2} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>2. Beneficiary & Location Information</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted)' }}>
                  Auto-populated farmer and pump sanction details
                </span>
              </div>
            </div>

            <div className="ax-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <FloatingInput label="Farmer Name" name="farmer_name" value={siteDetail?.farmer_name || ''} onChange={() => {}} disabled />
              <FloatingInput label="Father's Name" name="father_name" value={siteDetail?.father_name || ''} onChange={() => {}} disabled />
              <FloatingInput label="Contact Number" name="farmer_contact" value={siteDetail?.farmer_contact || ''} onChange={() => {}} disabled />
              <FloatingInput label="Customer Number" name="customer_no" value={siteDetail?.customer_no || ''} onChange={() => {}} disabled />
              <FloatingInput label="Village" name="village" value={siteDetail?.village || ''} onChange={() => {}} disabled />
              <FloatingInput label="Block" name="block" value={siteDetail?.block || ''} onChange={() => {}} disabled />
              <FloatingInput label="Tehsil" name="tehsil" value={siteDetail?.tehsil || siteDetail?.block || ''} onChange={() => {}} disabled />
              <FloatingInput label="District" name="district" value={siteDetail?.district || ''} onChange={() => {}} disabled />
              <FloatingInput label="State" name="state" value={siteDetail?.state || 'Assam'} onChange={() => {}} disabled />
              <FloatingInput label="Pump Capacity" name="pump_capacity" value={siteDetail?.pump_capacity || ''} onChange={() => {}} disabled />
              <FloatingInput label="Pump Type" name="pump_type" value={siteDetail?.pump_type || ''} onChange={() => {}} disabled />
              <FloatingInput label="Pump Sub-Type" name="pump_sub_type" value={siteDetail?.pump_sub_type || ''} onChange={() => {}} disabled />
            </div>
          </div>

          <hr className="swp-section-divider" />

          {/* ════════ Section 3: Inverter, VFD & Module Serials ════════ */}
          <div ref={sec3} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>3. Equipment & Serial Numbers</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted)' }}>
                  Inverter, VFD and Solar Panel module serial numbers installed
                </span>
              </div>
            </div>

            <div className="ax-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              <FloatingInput
                label="Inverter Number"
                name="inverter_no"
                value={inverterNo}
                onChange={(e) => setInverterNo(e.target.value)}
                required
              />
              <FloatingInput
                label="VFD Serial Number"
                name="vfd_no"
                value={vfdNo}
                onChange={(e) => setVfdNo(e.target.value)}
                required
              />
            </div>

            {/* Dynamic Solar Module Serial Numbers */}
            <div style={{ borderTop: '1px dashed var(--ax-border)', paddingTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 600, margin: 0 }}>
                    Solar Module Serial Numbers <span style={{ color: 'var(--ax-danger, #ef4444)' }}>*</span>
                  </h4>
                  <span style={{ fontSize: '11px', color: 'var(--ax-text-muted)' }}>
                    Add each installed panel module serial number individually
                  </span>
                </div>
                <button
                  type="button"
                  className="ax-btn ax-btn--secondary ax-btn--xs"
                  onClick={handleAddModule}
                  style={{ color: '#2563eb', fontWeight: 600 }}
                >
                  + Add Another Module
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                {moduleSerials.map((serial, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <FloatingInput
                        label={`Module #${idx + 1} Serial`}
                        name={`module_serial_${idx}`}
                        value={serial}
                        onChange={(e) => handleModuleChange(idx, e.target.value)}
                        required
                      />
                    </div>
                    {moduleSerials.length > 1 && (
                      <button
                        type="button"
                        className="ax-btn ax-btn--ghost ax-btn--icon"
                        style={{ color: '#ef4444', height: 42, width: 36 }}
                        onClick={() => handleRemoveModule(idx)}
                        title="Remove module serial"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <hr className="swp-section-divider" />

          {/* ════════ Section 4: Geo Coordinates & Remarks ════════ */}
          <div ref={sec4} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>4. GPS Coordinates & Remarks</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted)' }}>
                  Exact site geotag coordinates (latitude & longitude)
                </span>
              </div>
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--sm"
                onClick={detectLocation}
                disabled={gettingLocation}
              >
                {gettingLocation ? 'Detecting GPS...' : '📍 Auto-detect GPS'}
              </button>
            </div>

            <div className="swp-gps-grid">
              <FloatingInput
                label="Installation Latitude"
                name="inst_latitude"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                required
              />
              <FloatingInput
                label="Installation Longitude"
                name="inst_longitude"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                required
              />
              <FloatingInput
                label="Installation Remarks (optional)"
                name="inst_remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>
          </div>

          <hr className="swp-section-divider" />

          {/* ════════ Section 5: Photo Uploads ════════ */}
          <div ref={sec5} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>5. Installation Photo Evidence</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted)' }}>
                  Upload clear photos of all 3 required views with farmer present
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              <UploadDropzone
                id="module_image"
                label="1. Farmer with Module Photo"
                required={!isEditMode}
                file={files.module_image}
                preview={previews.module_image}
                onSelect={(f) => {
                  setFiles((prev) => ({ ...prev, module_image: f }));
                  setPreviews((prev) => ({ ...prev, module_image: URL.createObjectURL(f) }));
                }}
                onRemove={() => removeFile('module_image')}
              />

              <UploadDropzone
                id="inverter_vfd_image"
                label="2. Farmer with VFD & Inverter Photo"
                required={!isEditMode}
                file={files.inverter_vfd_image}
                preview={previews.inverter_vfd_image}
                onSelect={(f) => {
                  setFiles((prev) => ({ ...prev, inverter_vfd_image: f }));
                  setPreviews((prev) => ({ ...prev, inverter_vfd_image: URL.createObjectURL(f) }));
                }}
                onRemove={() => removeFile('inverter_vfd_image')}
              />

              <UploadDropzone
                id="running_water_image"
                label="3. Farmer with Running Water Photo"
                required={!isEditMode}
                file={files.running_water_image}
                preview={previews.running_water_image}
                onSelect={(f) => {
                  setFiles((prev) => ({ ...prev, running_water_image: f }));
                  setPreviews((prev) => ({ ...prev, running_water_image: URL.createObjectURL(f) }));
                }}
                onRemove={() => removeFile('running_water_image')}
              />
            </div>
          </div>

          {/* ════════ Submit Footer ════════ */}
          <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid var(--ax-border)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <Link to="/v/assam/installation/swp/view" className="ax-btn ax-btn--secondary">
              Cancel
            </Link>
            <button
              type="submit"
              className="ax-btn ax-btn--primary"
              disabled={submitting || !selectedSiteId}
              style={{ minWidth: 160 }}
            >
              {submitting
                ? isEditMode
                  ? 'Updating Installation...'
                  : 'Submitting Installation...'
                : isEditMode
                ? 'Update Installation Details'
                : 'Submit Installation Report'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default Assam_Installation_SWP_Site;
