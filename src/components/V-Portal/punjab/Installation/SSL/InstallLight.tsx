import { useState, useEffect, useRef, type FormEvent, type ChangeEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  punjabSslInstallationService,
  resolvePunjabMediaUrl,
  type PunjabLightDropdownItem,
  type PunjabLightDetail,
} from '../../punjab-services';

// Unified Single-Card Layout with Floating Labels & Section Dividers (matching Assam & Bihar reference)
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
              JPG, PNG or JPEG image — single file (Max 5MB)
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

export function Punjab_Installation_SSL_InstallLight() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('ssl_id') || searchParams.get('id') || searchParams.get('edit_id') || searchParams.get('light_id');
  const isEditMode = Boolean(editId);

  // Light Dropdown & Detail State
  const [lightsList, setLightsList] = useState<PunjabLightDropdownItem[]>([]);
  const [loadingLights, setLoadingLights] = useState(false);
  const [selectedLightId, setSelectedLightId] = useState<string>('');
  const [siteDetail, setSiteDetail] = useState<PunjabLightDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Form State
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [wardNo, setWardNo] = useState('');
  const [poleNo, setPoleNo] = useState('');
  const [uuidNo, setUuidNo] = useState('');
  const [lightNo, setLightNo] = useState('');
  const [panelNo, setPanelNo] = useState('');
  const [batteryNo, setBatteryNo] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [remarks, setRemarks] = useState('');

  // Photo Files & Previews (2 photos for Punjab SSL)
  const [files, setFiles] = useState<{
    light_file: File | null;
    light_file2: File | null;
  }>({
    light_file: null,
    light_file2: null,
  });

  const [previews, setPreviews] = useState<{
    light_file: string;
    light_file2: string;
  }>({
    light_file: '',
    light_file2: '',
  });

  // UI State
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

  // 1. Load pending lights list (API 3) in Add mode
  useEffect(() => {
    if (isEditMode) return;
    const fetchLights = async () => {
      try {
        setLoadingLights(true);
        const data = await punjabSslInstallationService.fetchLightNames();
        setLightsList(Array.isArray(data) ? data : []);
      } catch (err: any) {
        console.error('[Punjab SSL Installation] fetchLightNames error:', err);
      } finally {
        setLoadingLights(false);
      }
    };
    fetchLights();
  }, [isEditMode]);

  // 2. Load light details on selection (API 4)
  const handleLightSelect = async (lightIdOrUid: string) => {
    setSelectedLightId(lightIdOrUid);
    setSiteDetail(null);
    if (!lightIdOrUid) return;

    try {
      setLoadingDetail(true);
      const detail = await punjabSslInstallationService.fetchLightDetail(lightIdOrUid);
      if (detail) {
        setSiteDetail(detail);
        if (detail.id) setSelectedLightId(String(detail.id));
        setBeneficiaryName(detail.beneficiary_name || '');
        setContactNo(detail.contact_no || '');
        setWardNo(detail.ward_no || '');
        setPoleNo(detail.pole_no || '');
        setUuidNo(detail.uuid_no || '');
        setLightNo(detail.light_no || '');
        setPanelNo(detail.panel_no || '');
        setBatteryNo(detail.battery_serial_no || detail.battery_no || '');
        setLatitude(detail.latitude ? String(detail.latitude) : '');
        setLongitude(detail.longitude ? String(detail.longitude) : '');
        setRemarks(detail.remark || detail.inst_remark || '');
      }
    } catch (err: any) {
      console.error('[Punjab SSL Installation] fetchLightDetail error:', err);
      setFeedback({ type: 'danger', text: 'Failed to load light site details.' });
    } finally {
      setLoadingDetail(false);
    }
  };

  // 3. Load for Edit (API 6) if in Edit mode
  useEffect(() => {
    if (!editId) return;
    let isMounted = true;
    const loadForEdit = async () => {
      setLoadingDetail(true);
      try {
        let detail = await punjabSslInstallationService.getUpdateInstallLightLoad(editId);
        if (!detail) {
          detail = await punjabSslInstallationService.fetchLightDetail(editId);
        }
        if (!isMounted) return;

        if (detail) {
          const idVal = String(detail.id || editId);
          setSelectedLightId(idVal);
          setSiteDetail(detail);
          setBeneficiaryName(detail.beneficiary_name || '');
          setContactNo(detail.contact_no || '');
          setWardNo(detail.ward_no || '');
          setPoleNo(detail.pole_no || '');
          setUuidNo(detail.uuid_no || '');
          setLightNo(detail.light_no || '');
          setPanelNo(detail.panel_no || '');
          setBatteryNo(detail.battery_serial_no || detail.battery_no || '');
          setLatitude(detail.latitude ? String(detail.latitude) : '');
          setLongitude(detail.longitude ? String(detail.longitude) : '');
          setRemarks(detail.remark || detail.inst_remark || '');

          if (detail.light_file) {
            setPreviews((p) => ({ ...p, light_file: resolvePunjabMediaUrl(detail.light_file) }));
          }
          if (detail.light_file2) {
            setPreviews((p) => ({ ...p, light_file2: resolvePunjabMediaUrl(detail.light_file2) }));
          }
        }
      } catch (err: any) {
        if (isMounted) setFeedback({ type: 'danger', text: err?.message || 'Failed to load light details for edit' });
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

  // Form Submit (API 5 or API 7)
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const sslNumericId = siteDetail?.id || Number(selectedLightId);
    if (!sslNumericId) {
      setFeedback({ type: 'danger', text: 'Please select an installation light first.' });
      scrollTo(sec1);
      return;
    }

    if (!beneficiaryName.trim()) {
      setFeedback({ type: 'danger', text: 'Beneficiary Name is required.' });
      scrollTo(sec2);
      return;
    }
    const cleanPhone = contactNo.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setFeedback({ type: 'danger', text: 'Contact Number must be exactly 10 digits.' });
      scrollTo(sec2);
      return;
    }
    if (!wardNo.trim()) {
      setFeedback({ type: 'danger', text: 'Ward Number is required.' });
      scrollTo(sec2);
      return;
    }
    if (!poleNo.trim()) {
      setFeedback({ type: 'danger', text: 'Pole Number is required.' });
      scrollTo(sec3);
      return;
    }
    if (!uuidNo.trim()) {
      setFeedback({ type: 'danger', text: 'UUID Number is required.' });
      scrollTo(sec3);
      return;
    }
    if (!lightNo.trim()) {
      setFeedback({ type: 'danger', text: 'Light Luminary Number is required.' });
      scrollTo(sec3);
      return;
    }
    if (!panelNo.trim()) {
      setFeedback({ type: 'danger', text: 'Solar Panel Number is required.' });
      scrollTo(sec3);
      return;
    }
    if (!batteryNo.trim()) {
      setFeedback({ type: 'danger', text: 'Battery Serial Number is required.' });
      scrollTo(sec3);
      return;
    }

    if (!latitude.trim() || !longitude.trim()) {
      setFeedback({ type: 'danger', text: 'GPS Latitude and Longitude are required.' });
      scrollTo(sec4);
      return;
    }

    if (!isEditMode) {
      if (!files.light_file) {
        setFeedback({ type: 'danger', text: 'Light Installation Photo 1 is required.' });
        scrollTo(sec5);
        return;
      }
      if (!files.light_file2) {
        setFeedback({ type: 'danger', text: 'Light Installation Photo 2 is required.' });
        scrollTo(sec5);
        return;
      }
    }

    try {
      setSubmitting(true);
      setFeedback(null);

      const fd = new FormData();
      fd.append('ssl_id', String(sslNumericId));
      fd.append('id', String(sslNumericId));
      fd.append('light_id', String(sslNumericId));
      if (isEditMode) {
        fd.append('update_id', String(sslNumericId));
      }

      fd.append('beneficiary_name', beneficiaryName.trim());
      fd.append('contact_no', cleanPhone);
      fd.append('ward_no', wardNo.trim());
      fd.append('pole_no', poleNo.trim());
      fd.append('uuid_no', uuidNo.trim());
      fd.append('light_no', lightNo.trim());
      fd.append('panel_no', panelNo.trim());
      fd.append('battery_no', batteryNo.trim());
      fd.append('battery_serial_no', batteryNo.trim());

      fd.append('latitude', latitude.trim());
      fd.append('longitude', longitude.trim());
      if (remarks.trim()) {
        fd.append('remark', remarks.trim());
        fd.append('remarks', remarks.trim());
      }

      if (files.light_file) {
        fd.append('light_file', files.light_file);
      }
      if (files.light_file2) {
        fd.append('light_file2', files.light_file2);
      }

      if (isEditMode) {
        const res = await punjabSslInstallationService.updateInstallLightStore(fd);
        setFeedback({ type: 'success', text: res.message || 'Light Installation Details Updated Successfully!' });
      } else {
        const res = await punjabSslInstallationService.storeLightDetails(fd);
        setFeedback({ type: 'success', text: res.message || 'Light Installed Successfully!' });
      }

      setTimeout(() => {
        navigate('/v/punjab/ssl/installation/complete-light#Completed');
      }, 1500);
    } catch (err: any) {
      console.error('[Punjab SSL Installation] submit error:', err);
      setFeedback({ type: 'danger', text: err?.message || 'Failed to submit Punjab SSL installation.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ax-page swp-inst-form">
      <style>{SINGLE_CARD_FORM_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title={isEditMode ? 'Edit Installation Details' : 'Punjab SSL-Installation Details'}
        subtitle={
          isEditMode
            ? 'Update solar street light equipment numbers, GPS coordinates, and verification photos.'
            : 'Capture Solar Street Light installation execution data, serial numbers, geocoordinates, and verification photos.'
        }
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Punjab' },
          { label: 'Installation' },
          { label: 'SSL' },
          { label: isEditMode ? 'Edit Details' : 'Installation Details' },
        ]}
        actions={
          <Link to="/v/punjab/ssl/installation/complete-light" className="ax-btn ax-btn--secondary ax-btn--sm">
            View Installed Lights
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
                {isEditMode ? 'Edit Installation Details' : 'Solar Street Light Installation Form'}
              </h2>
              <p className="ax-card__subtitle" style={{ fontSize: '0.85rem', color: 'var(--ax-text-muted)', margin: '2px 0 0' }}>
                {isEditMode
                  ? 'Update existing solar street light equipment numbers, GPS coordinates, and verification photos.'
                  : 'Fill out installation details and upload site completion evidence for department verification.'}
              </p>
            </div>
            {siteDetail && (
              <span className="ax-badge ax-badge--soft ax-badge--info" style={{ fontWeight: 600 }}>
                {siteDetail.beneficiary_name ? `${siteDetail.beneficiary_name} (${siteDetail.district || ''})` : `Light #${siteDetail.unique_id || siteDetail.id}`}
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
                    : 'Choose from accepted lights ready for installation in Punjab'}
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
                      value={`Light #${selectedLightId} - ${siteDetail?.unique_id || ''} (${siteDetail?.district || ''})`}
                      disabled
                    />
                    <label htmlFor="site_id_select" className="ax-float__label floating">
                      Installation Light
                    </label>
                  </>
                ) : (
                  <>
                    <select
                      id="site_id_select"
                      className="ax-float__input"
                      value={selectedLightId}
                      onChange={(e) => handleLightSelect(e.target.value)}
                      disabled={loadingLights || submitting}
                      required
                    >
                      <option value="">-- Choose Assigned Punjab SSL Light --</option>
                      {lightsList.map((item) => {
                        const optVal = String(item.id || item.unique_id);
                        return (
                          <option key={optVal} value={optVal}>
                            #{item.unique_id} {item.panchayat ? `· ${item.panchayat}` : ''}
                          </option>
                        );
                      })}
                    </select>
                    <label htmlFor="site_id_select" className="ax-float__label floating">
                      Assigned Light <span style={{ color: 'var(--ax-danger, #ef4444)' }}>*</span>
                    </label>
                  </>
                )}
              </div>
            </div>

            {loadingDetail && (
              <div style={{ padding: '16px 0', color: '#2563eb', fontSize: '13px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="ax-spinner" /> Fetching light specifications & prefilled details...
              </div>
            )}
          </div>

          <hr className="swp-section-divider" />

          {/* ════════ Section 2: Beneficiary / Location Information ════════ */}
          <div ref={sec2} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>2. Beneficiary & Location Information</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted)' }}>
                  Beneficiary identity, contact, ward and sanction details
                </span>
              </div>
            </div>

            <div className="ax-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <FloatingInput
                label="Beneficiary Name"
                name="beneficiary_name"
                value={beneficiaryName}
                onChange={(e) => setBeneficiaryName(e.target.value)}
                required
              />
              <FloatingInput
                label="Contact Number (10 Digits)"
                name="contact_no"
                value={contactNo}
                onChange={(e) => setContactNo(e.target.value)}
                required
              />
              <FloatingInput
                label="Ward Number"
                name="ward_no"
                value={wardNo}
                onChange={(e) => setWardNo(e.target.value)}
                required
              />
              <FloatingInput
                label="Pole Number"
                name="pole_no"
                value={poleNo}
                onChange={(e) => setPoleNo(e.target.value)}
                required
              />
              <FloatingInput label="Panchayat" name="panchayat" value={siteDetail?.panchayat || ''} onChange={() => {}} disabled />
              <FloatingInput label="Block" name="block" value={siteDetail?.block || ''} onChange={() => {}} disabled />
              <FloatingInput label="District" name="district" value={siteDetail?.district || ''} onChange={() => {}} disabled />
              <FloatingInput label="State" name="state" value={siteDetail?.state || 'Punjab'} onChange={() => {}} disabled />
              <FloatingInput label="Sarpanch Name" name="sarpanch_name" value={siteDetail?.sarpanch_name || ''} onChange={() => {}} disabled />
              <FloatingInput label="Sarpanch Contact" name="sarpanch_contact" value={siteDetail?.sarpanch_contact || ''} onChange={() => {}} disabled />
            </div>
          </div>

          <hr className="swp-section-divider" />

          {/* ════════ Section 3: Equipment Numbers ════════ */}
          <div ref={sec3} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>3. Equipment & Serial Numbers</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted)' }}>
                  UUID, Pole, Luminary, Solar Panel and Battery serial numbers installed
                </span>
              </div>
            </div>

            <div className="ax-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <FloatingInput
                label="UUID Number"
                name="uuid_no"
                value={uuidNo}
                onChange={(e) => setUuidNo(e.target.value)}
                required
              />
              <FloatingInput
                label="Pole Number"
                name="pole_no_eq"
                value={poleNo}
                onChange={(e) => setPoleNo(e.target.value)}
                required
              />
              <FloatingInput
                label="Light Luminary Number"
                name="light_no"
                value={lightNo}
                onChange={(e) => setLightNo(e.target.value)}
                required
              />
              <FloatingInput
                label="Solar Panel Number"
                name="panel_no"
                value={panelNo}
                onChange={(e) => setPanelNo(e.target.value)}
                required
              />
              <FloatingInput
                label="Battery Serial Number"
                name="battery_no"
                value={batteryNo}
                onChange={(e) => setBatteryNo(e.target.value)}
                required
              />
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
                name="latitude"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                required
              />
              <FloatingInput
                label="Installation Longitude"
                name="longitude"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                required
              />
              <FloatingInput
                label="Installation Remarks (optional)"
                name="remarks"
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
                  Upload clear photos of both required SSL views (Luminary, Pole & Panel)
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <UploadDropzone
                id="light_file"
                label="1. Light Installation Photo 1"
                required={!isEditMode}
                file={files.light_file}
                preview={previews.light_file}
                onSelect={(f) => {
                  setFiles((prev) => ({ ...prev, light_file: f }));
                  setPreviews((prev) => ({ ...prev, light_file: URL.createObjectURL(f) }));
                }}
                onRemove={() => removeFile('light_file')}
              />

              <UploadDropzone
                id="light_file2"
                label="2. Light Installation Photo 2"
                required={!isEditMode}
                file={files.light_file2}
                preview={previews.light_file2}
                onSelect={(f) => {
                  setFiles((prev) => ({ ...prev, light_file2: f }));
                  setPreviews((prev) => ({ ...prev, light_file2: URL.createObjectURL(f) }));
                }}
                onRemove={() => removeFile('light_file2')}
              />
            </div>
          </div>

          {/* ════════ Submit Footer ════════ */}
          <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid var(--ax-border)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <Link to="/v/punjab/ssl/installation/complete-light" className="ax-btn ax-btn--secondary">
              Cancel
            </Link>
            <button
              type="submit"
              className="ax-btn ax-btn--primary"
              disabled={submitting || !selectedLightId}
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

export default Punjab_Installation_SSL_InstallLight;
