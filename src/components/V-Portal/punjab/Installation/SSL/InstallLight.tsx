import { useCallback, useEffect, useRef, useState, useMemo, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  punjabSslInstallationService,
  getMediaUrl,
  type PunjabLightDropdownItem,
  type PunjabLightDetail,
} from '../../punjab-services';

// Unified Single-Card Layout with Floating Labels & Section Dividers (matching Assam SWP reference)
const SINGLE_CARD_FORM_CSS = `
.punjab-ssl-form .ax-card {
  border: 1px solid var(--ax-border, #e2e8f0);
  border-radius: var(--ax-radius-xl, 16px);
  background: var(--ax-surface-solid, #ffffff);
  box-shadow: var(--ax-shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.05));
  overflow: hidden;
}
.punjab-ssl-form .ax-card__header {
  padding: var(--ax-space-5, 20px) var(--ax-space-6, 24px);
  border-bottom: 1px solid var(--ax-border-subtle, #f1f5f9);
  background: var(--ax-surface-subtle, #f8fafc);
  display: flex;
  flex-direction: column;
  gap: var(--ax-space-4, 16px);
}
.punjab-ssl-form .ax-card__body { padding: var(--ax-space-6, 24px); }

/* Quick Section Nav Pills */
.ssl-section-pills {
  display: flex;
  gap: var(--ax-space-2, 8px);
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: thin;
}
.ssl-section-pill-btn {
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
.ssl-section-pill-btn:hover {
  border-color: #2563eb;
  color: #2563eb;
  background: color-mix(in srgb, #2563eb 6%, #ffffff);
}
.ssl-section-pill-btn .pill-num {
  width: 18px; height: 18px; border-radius: 50%;
  background: var(--ax-surface-subtle, #f1f5f9);
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 700;
}

/* Section Block */
.ssl-section-block { padding-top: var(--ax-space-2, 8px); }
.ssl-section-header {
  display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap;
  gap: var(--ax-space-2, 8px);
  margin-bottom: var(--ax-space-5, 20px);
  padding-bottom: var(--ax-space-3, 12px);
  border-bottom: 1px solid var(--ax-border-subtle, #f1f5f9);
}
.ssl-section-title-wrap { display: flex; flex-direction: column; gap: 4px; }
.ssl-section-divider {
  border: 0;
  border-top: 1px dashed var(--ax-border, #e2e8f0);
  margin: var(--ax-space-8, 32px) 0 var(--ax-space-6, 24px);
}

/* Floating Label Core (matching Assam FloatingInput) */
.ax-float { position: relative; width: 100%; }
.ax-float__input {
  width: 100%;
  height: 46px;
  padding: 12px 14px 4px 14px;
  font-size: var(--ax-text-sm, 13.5px);
  background: var(--ax-surface-solid, #ffffff);
  border: 1px solid var(--ax-border, #cbd5e1);
  border-radius: var(--ax-radius-md, 8px);
  color: var(--ax-text, #1e293b);
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.ax-float__input::placeholder { color: transparent; }
.ax-float__input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px color-mix(in srgb, #2563eb 20%, transparent);
}
.ax-float__input:disabled { opacity: .7; cursor: not-allowed; background: var(--ax-surface-subtle, #f8fafc); }
.ax-float__input.is-invalid {
  border-color: #ef4444 !important;
}
.ax-float__input.is-invalid:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2) !important;
}

.ax-float__label {
  position: absolute;
  inset-inline-start: 12px;
  top: 50%;
  transform: translateY(-50%);
  margin: 0;
  padding: 0 4px;
  font-size: var(--ax-text-sm, 13.5px);
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
  font-weight: 600;
  color: #2563eb;
}
.ax-float__label.has-val:not(.floating) {
  top: 0;
  font-size: 11px;
  font-weight: 500;
  color: var(--ax-text-muted, #64748b);
}
.ax-float__label.is-error {
  color: #ef4444 !important;
}

/* Grids */
.ssl-form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--ax-space-4, 16px);
}
@media (min-width: 1024px) {
  .ssl-form-grid--3col { grid-template-columns: repeat(3, 1fr); }
}

.ssl-site-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--ax-space-3, 12px);
}
@media (min-width: 1024px) {
  .ssl-site-info-grid { grid-template-columns: repeat(4, 1fr); }
}
.ssl-site-info-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 16px;
  background: var(--ax-surface-subtle, #f8fafc);
  border: 1px solid var(--ax-border, #e2e8f0);
  border-radius: var(--ax-radius-lg, 10px);
}
.ssl-site-info-card__label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--ax-text-muted, #64748b);
}
.ssl-site-info-card__value {
  font-size: 14px;
  font-weight: 600;
  color: var(--ax-text-strong, #0f172a);
}

/* Sticky Action Bar */
.ssl-form-sticky-bar {
  position: sticky;
  bottom: var(--ax-space-4, 16px);
  z-index: 30;
  margin-top: var(--ax-space-6, 24px);
  padding: 14px 24px;
  background: #ffffff;
  border: 1px solid var(--ax-border, #e2e8f0);
  border-radius: var(--ax-radius-xl, 14px);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--ax-space-3, 12px);
}
`;

const MAX_FILE = 5 * 1024 * 1024; // 5120 KB per documentation

/* ───────── Floating Input Component (Exact Assam SWP Style) ───────── */
interface FloatingInputProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  required?: boolean;
  disabled?: boolean;
  type?: string;
  placeholder?: string;
  maxLength?: number;
  error?: string;
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
  maxLength,
  error,
}: FloatingInputProps) {
  const [focused, setFocused] = useState(false);
  const hasVal = Boolean(value && String(value).length > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div className="ax-float">
        <input
          type={type}
          id={name}
          name={name}
          value={value}
          maxLength={maxLength}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          required={required}
          disabled={disabled}
          placeholder={placeholder || label}
          className={`ax-float__input ${error ? 'is-invalid' : ''}`}
        />
        <label
          htmlFor={name}
          className={`ax-float__label ${error ? 'is-error' : ''} ${focused ? 'floating' : hasVal ? 'has-val' : ''}`}
        >
          {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
        </label>
      </div>
      {error && (
        <span style={{ fontSize: 11, color: '#ef4444', paddingLeft: 4 }}>
          {error}
        </span>
      )}
    </div>
  );
}

/* ───────── Modern Upload Dropzone (matching Assam SWP InstallationSite) ───────── */
interface UploadDropzoneProps {
  id: string;
  label: string;
  required?: boolean;
  accept?: string;
  file: File | null;
  preview?: string;
  existingUrl?: string | null;
  onSelect: (file: File) => void;
  onRemove: () => void;
  error?: string;
  helperText?: string;
}

function UploadDropzone({
  id,
  label,
  required,
  accept = 'image/*,application/pdf',
  file,
  preview,
  existingUrl,
  onSelect,
  onRemove,
  error,
  helperText,
}: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const currentPreview = preview || existingUrl;

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove();
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
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

      {helperText && (
        <span style={{ fontSize: 11, color: 'var(--ax-text-muted, #64748b)' }}>
          {helperText}
        </span>
      )}

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
            ? '1.5px dashed #ef4444'
            : isHovered
            ? '1.5px dashed #94a3b8'
            : '1.5px dashed #cbd5e1',
          borderRadius: 10,
          background: isDragging
            ? '#eff6ff'
            : error
            ? '#fef2f2'
            : isHovered
            ? '#fbfcfd'
            : '#ffffff',
          padding: file || currentPreview ? '12px 14px' : '22px 16px',
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
        {file || currentPreview ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, textAlign: 'left' }}>
              {currentPreview ? (
                <img
                  src={currentPreview}
                  alt={label}
                  style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--ax-border, #cbd5e1)' }}
                />
              ) : (
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: '#ecfdf5',
                    color: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong, #0f172a)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file ? file.name : 'Existing Uploaded Photo'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ax-text-muted, #64748b)', marginTop: 2 }}>
                  {file ? `${(file.size / 1024).toFixed(0)} KB · Ready to upload` : 'Saved on server'}
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
              {file ? 'Remove' : 'Change'}
            </button>
          </div>
        ) : (
          <>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: '#eff6ff',
                color: '#2563eb',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 6,
              }}
            >
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong, #1e293b)' }}>
              Click to capture or drag & drop photo
            </div>
            <div style={{ fontSize: 11, color: 'var(--ax-text-muted, #64748b)', marginTop: 3 }}>
              JPG, PNG or PDF (Max 5MB)
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

type FormFields = {
  wardNo: string;
  poleNo: string;
  beneficiaryName: string;
  contactNo: string;
  uuidNo: string;
  batteryNo: string;
  panelNo: string;
  lightNo: string;
  latitude: string;
  longitude: string;
  remarks: string;
};

const EMPTY_FORM: FormFields = {
  wardNo: '',
  poleNo: '',
  beneficiaryName: '',
  contactNo: '',
  uuidNo: '',
  batteryNo: '',
  panelNo: '',
  lightNo: '',
  latitude: '',
  longitude: '',
  remarks: '',
};

export function Punjab_Installation_SSL_InstallLight() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editIdParam = searchParams.get('ssl_id') || searchParams.get('id') || searchParams.get('light_id');
  const isEditMode = searchParams.get('edit') === 'true' || Boolean(searchParams.get('ssl_id'));

  // Section Refs for smooth scrolling
  const sec1Ref = useRef<HTMLDivElement>(null);
  const sec2Ref = useRef<HTMLDivElement>(null);
  const sec3Ref = useRef<HTMLDivElement>(null);
  const sec4Ref = useRef<HTMLDivElement>(null);
  const sec5Ref = useRef<HTMLDivElement>(null);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Dropdown list
  const [dropdownLoading, setDropdownLoading] = useState(true);
  const [lightOptions, setLightOptions] = useState<PunjabLightDropdownItem[]>([]);
  const [selectedLightId, setSelectedLightId] = useState<string>(editIdParam ? String(editIdParam) : '');

  // Detail state
  const [detailLoading, setDetailLoading] = useState(false);
  const [siteDetail, setSiteDetail] = useState<PunjabLightDetail | null>(null);

  // Form inputs
  const [form, setForm] = useState<FormFields>(EMPTY_FORM);
  const [lightFile, setLightFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [lightFile2, setLightFile2] = useState<File | null>(null);
  const [filePreview2, setFilePreview2] = useState<string | null>(null);

  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [existingImageUrl2, setExistingImageUrl2] = useState<string | null>(null);

  // GPS state
  const [gpsDetecting, setGpsDetecting] = useState(false);
  const [gpsStatusMsg, setGpsStatusMsg] = useState<string | null>(null);

  // Validation & alerts
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setForm(EMPTY_FORM);
    setLightFile(null);
    setFilePreview(null);
    setLightFile2(null);
    setFilePreview2(null);
    setExistingImageUrl(null);
    setExistingImageUrl2(null);
    setErrors({});
    setGpsStatusMsg(null);
    setErrorMsg(null);
    setSuccessMsg(null);
  }, []);

  // Fetch dropdown list on mount
  useEffect(() => {
    let active = true;
    (async () => {
      setDropdownLoading(true);
      try {
        const list = await punjabSslInstallationService.fetchLightNames();
        if (active) setLightOptions(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error('[Punjab SSL] fetch dropdown error:', err);
      } finally {
        if (active) setDropdownLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  // Handle selecting a light from dropdown
  const handleSelectLight = useCallback(async (idOrUid: string) => {
    setSelectedLightId(idOrUid);
    setExistingImageUrl(null);
    setExistingImageUrl2(null);
    setSuccessMsg(null);
    setErrorMsg(null);

    if (!idOrUid) {
      setSiteDetail(null);
      resetForm();
      return;
    }

    setDetailLoading(true);
    try {
      let detail: PunjabLightDetail | null = null;
      if (isEditMode) {
        detail = await punjabSslInstallationService.getUpdateInstallLightLoad(idOrUid);
      }
      if (!detail) {
        detail = await punjabSslInstallationService.fetchLightDetail(idOrUid);
      }

      setSiteDetail(detail);
      if (detail) {
        setForm({
          wardNo: detail.ward_no ? String(detail.ward_no) : '',
          poleNo: detail.pole_no ? String(detail.pole_no) : '',
          beneficiaryName: detail.beneficiary_name || '',
          contactNo: detail.contact_no ? String(detail.contact_no) : '',
          uuidNo: detail.uuid_no ? String(detail.uuid_no) : '',
          batteryNo: detail.battery_serial_no ? String(detail.battery_serial_no) : '',
          panelNo: detail.panel_no ? String(detail.panel_no) : '',
          lightNo: detail.light_no ? String(detail.light_no) : '',
          latitude: detail.latitude ? String(detail.latitude) : '',
          longitude: detail.longitude ? String(detail.longitude) : '',
          remarks: detail.remark || detail.inst_remark || '',
        });

        if (detail.light_file) setExistingImageUrl(getMediaUrl(detail.light_file));
        if (detail.light_file2) setExistingImageUrl2(getMediaUrl(detail.light_file2));
        setErrors({});
      }
    } catch (err) {
      console.error('[Punjab SSL] fetch detail error:', err);
      setSiteDetail(null);
      setErrorMsg('Could not fetch light details from server.');
    } finally {
      setDetailLoading(false);
    }
  }, [isEditMode, resetForm]);

  useEffect(() => {
    if (editIdParam) {
      handleSelectLight(String(editIdParam));
    }
  }, [editIdParam, handleSelectLight]);

  // GPS detection handler
  const handleDetectGps = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsStatusMsg('Geolocation is not supported by your device browser.');
      return;
    }
    setGpsDetecting(true);
    setGpsStatusMsg('Acquiring high-accuracy GPS coordinates…');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        setForm((prev) => ({ ...prev, latitude: lat, longitude: lng }));
        setErrors((prev) => {
          const next = { ...prev };
          delete next.latitude;
          delete next.longitude;
          return next;
        });
        setGpsDetecting(false);
        setGpsStatusMsg(`✓ GPS Acquired (Accuracy: ±${Math.round(pos.coords.accuracy)}m)`);
      },
      (err) => {
        setGpsDetecting(false);
        setGpsStatusMsg(`GPS error: ${err.message}. Please enter manually.`);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  }, []);

  const handleInputChange = (field: keyof FormFields) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const val = e.target.value;
    setForm((prev) => ({ ...prev, [field]: val }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handlePhotoSelect = (isSecond: boolean) => (file: File) => {
    if (file.size > MAX_FILE) {
      setErrorMsg(`File size exceeds the 5MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (isSecond) {
        setLightFile2(file);
        setFilePreview2(reader.result as string);
        setErrors((prev) => { const n = { ...prev }; delete n.light_file2; return n; });
      } else {
        setLightFile(file);
        setFilePreview(reader.result as string);
        setErrors((prev) => { const n = { ...prev }; delete n.light_file; return n; });
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoRemove = (isSecond: boolean) => () => {
    if (isSecond) {
      setLightFile2(null);
      setFilePreview2(null);
      setExistingImageUrl2(null);
    } else {
      setLightFile(null);
      setFilePreview(null);
      setExistingImageUrl(null);
    }
  };

  // Form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    const sslNumericId = siteDetail?.id || Number(selectedLightId);
    if (!sslNumericId && !siteDetail) {
      setErrorMsg('Please select an allocated Light ID from the dropdown.');
      scrollToSection(sec1Ref);
      return;
    }

    const newErrors: Record<string, string> = {};

    if (!form.beneficiaryName.trim()) newErrors.beneficiaryName = 'Beneficiary Name is required.';
    if (!form.wardNo.trim()) newErrors.wardNo = 'Ward Number is required.';

    const cleanContact = form.contactNo.replace(/\D/g, '');
    if (!cleanContact) {
      newErrors.contactNo = 'Contact Number is required.';
    } else if (cleanContact.length !== 10) {
      newErrors.contactNo = 'Contact number must be exactly 10 digits.';
    }

    if (!form.uuidNo.trim()) newErrors.uuidNo = 'UUID Number is required.';
    if (!form.poleNo.trim()) newErrors.poleNo = 'Pole Number is required.';
    if (!form.lightNo.trim()) newErrors.lightNo = 'Light Luminary Number is required.';
    if (!form.panelNo.trim()) newErrors.panelNo = 'Solar Panel Serial No. is required.';
    if (!form.batteryNo.trim()) newErrors.batteryNo = 'Battery Serial No. is required.';

    if (!form.latitude.trim()) newErrors.latitude = 'Latitude is required.';
    if (!form.longitude.trim()) newErrors.longitude = 'Longitude is required.';

    if (!isEditMode) {
      if (!lightFile) newErrors.light_file = 'Light Photo 1 is required.';
      if (!lightFile2) newErrors.light_file2 = 'Light Photo 2 is required.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setErrorMsg('Please complete all required fields highlighted in red.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('ssl_id', String(sslNumericId || selectedLightId));
      formData.append('uuid_no', form.uuidNo.trim());
      formData.append('pole_no', form.poleNo.trim());
      formData.append('light_no', form.lightNo.trim());
      formData.append('panel_no', form.panelNo.trim());
      formData.append('battery_serial_no', form.batteryNo.trim());
      formData.append('beneficiary_name', form.beneficiaryName.trim());
      formData.append('ward_no', form.wardNo.trim());
      formData.append('contact_no', cleanContact);
      formData.append('latitude', form.latitude.trim());
      formData.append('longitude', form.longitude.trim());

      if (form.remarks.trim()) {
        formData.append('remark', form.remarks.trim());
      }

      if (lightFile) {
        formData.append('light_file', lightFile);
      }
      if (lightFile2) {
        formData.append('light_file2', lightFile2);
      }

      let res;
      if (isEditMode) {
        res = await punjabSslInstallationService.updateInstallLightStore(formData);
      } else {
        res = await punjabSslInstallationService.storeLightDetails(formData);
      }

      setSuccessMsg(res.message || 'Light installed successfully!');
      setTimeout(() => {
        navigate('/v/punjab/ssl/installation/complete-light#Completed');
      }, 1400);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit light installation.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="solar-erp-page punjab-ssl-form">
      <style>{SINGLE_CARD_FORM_CSS}</style>

      {/* Page Header (matching Assam SWP pattern) */}
      <PageHead
        title={isEditMode ? 'Update Installed Light' : 'SSL Light Installation'}
        subtitle="Record physical site parameters, hardware serials, and geo-tagged verification photos in Punjab"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Punjab' },
          { label: 'Installation' },
          { label: 'SSL', href: '/v/punjab/ssl/installation/dashboard' },
          { label: isEditMode ? 'Update Light' : 'Install Light' },
        ]}
      />

      {/* Notifications */}
      {successMsg && (
        <div className="ax-alert ax-alert--success" style={{ marginBottom: 16 }} role="status">
          <div className="ax-alert__title">Success</div>
          <div className="ax-alert__text">{successMsg}</div>
        </div>
      )}

      {errorMsg && (
        <div className="ax-alert ax-alert--danger" style={{ marginBottom: 16 }} role="alert">
          <div className="ax-alert__title">Installation Error</div>
          <div className="ax-alert__text">{errorMsg}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="ax-card">
          {/* Card Header with Title and Section Navigation Pills */}
          <div className="ax-card__header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ax-text-strong, #0f172a)' }}>
                  {isEditMode ? 'Edit Light Installation Record' : 'Punjab SSL Installation Execution'}
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--ax-text-muted, #64748b)' }}>
                  State: <b>Punjab</b> · All fields marked with * are mandatory
                </p>
              </div>

              {/* Light Picker Dropdown */}
              <div style={{ minWidth: 280, maxWidth: '100%' }}>
                <select
                  className="ax-input ax-input--sm"
                  style={{ width: '100%', fontWeight: 600, height: 38 }}
                  value={selectedLightId}
                  disabled={dropdownLoading || isEditMode}
                  onChange={(e) => handleSelectLight(e.target.value)}
                >
                  <option value="">-- Select Allocated Light --</option>
                  {lightOptions.map((opt) => (
                    <option key={opt.id || opt.unique_id} value={opt.id || opt.unique_id}>
                      {opt.unique_id} {opt.panchayat ? `(${opt.panchayat})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Section Nav Pills (matching Assam SWP) */}
            <div className="ssl-section-pills">
              <button type="button" className="ssl-section-pill-btn" onClick={() => scrollToSection(sec1Ref)}>
                <span className="pill-num">1</span> Light Selection
              </button>
              <button type="button" className="ssl-section-pill-btn" onClick={() => scrollToSection(sec2Ref)}>
                <span className="pill-num">2</span> Beneficiary & Ward
              </button>
              <button type="button" className="ssl-section-pill-btn" onClick={() => scrollToSection(sec3Ref)}>
                <span className="pill-num">3</span> Equipment Serials
              </button>
              <button type="button" className="ssl-section-pill-btn" onClick={() => scrollToSection(sec4Ref)}>
                <span className="pill-num">4</span> GPS & Photos
              </button>
              <button type="button" className="ssl-section-pill-btn" onClick={() => scrollToSection(sec5Ref)}>
                <span className="pill-num">5</span> Remarks
              </button>
            </div>
          </div>

          <div className="ax-card__body">
            {detailLoading && (
              <div style={{ textAlign: 'center', padding: 32 }}>
                <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading light installation details…
              </div>
            )}

            {/* ── Section 1: Pre-Allocated Light Details ── */}
            <div ref={sec1Ref} className="ssl-section-block">
              <div className="ssl-section-header">
                <div className="ssl-section-title-wrap">
                  <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--ax-text-muted, #64748b)' }}>
                    1. Site & Administrative Details
                  </h4>
                  <span style={{ fontSize: 12, color: 'var(--ax-text-muted, #64748b)' }}>
                    System allocated jurisdiction & sarpanch contact
                  </span>
                </div>
              </div>

              {siteDetail ? (
                <div className="ssl-site-info-grid">
                  <div className="ssl-site-info-card">
                    <span className="ssl-site-info-card__label">Light Unique ID</span>
                    <span className="ssl-site-info-card__value" style={{ color: '#2563eb' }}>
                      {siteDetail.unique_id || `#${siteDetail.id}`}
                    </span>
                  </div>
                  <div className="ssl-site-info-card">
                    <span className="ssl-site-info-card__label">District</span>
                    <span className="ssl-site-info-card__value">{siteDetail.district || '—'}</span>
                  </div>
                  <div className="ssl-site-info-card">
                    <span className="ssl-site-info-card__label">Block</span>
                    <span className="ssl-site-info-card__value">{siteDetail.block || '—'}</span>
                  </div>
                  <div className="ssl-site-info-card">
                    <span className="ssl-site-info-card__label">Panchayat</span>
                    <span className="ssl-site-info-card__value">{siteDetail.panchayat || '—'}</span>
                  </div>
                  <div className="ssl-site-info-card">
                    <span className="ssl-site-info-card__label">Sarpanch Name</span>
                    <span className="ssl-site-info-card__value">{siteDetail.sarpanch_name || '—'}</span>
                  </div>
                  <div className="ssl-site-info-card">
                    <span className="ssl-site-info-card__label">Sarpanch Contact</span>
                    <span className="ssl-site-info-card__value">{siteDetail.sarpanch_contact || '—'}</span>
                  </div>
                  <div className="ssl-site-info-card">
                    <span className="ssl-site-info-card__label">Phase</span>
                    <span className="ssl-site-info-card__value">{siteDetail.phase || '1'}</span>
                  </div>
                  <div className="ssl-site-info-card">
                    <span className="ssl-site-info-card__label">Work Order No.</span>
                    <span className="ssl-site-info-card__value">{siteDetail.wo_no || '—'}</span>
                  </div>
                </div>
              ) : (
                <div style={{ padding: 18, background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 10, border: '1px dashed var(--ax-border, #cbd5e1)', textAlign: 'center', color: 'var(--ax-text-muted, #64748b)', fontSize: 13 }}>
                  Please select an allocated light from the top dropdown to load site details.
                </div>
              )}

              <hr className="ssl-section-divider" />
            </div>

            {/* ── Section 2: Beneficiary Details ── */}
            <div ref={sec2Ref} className="ssl-section-block">
              <div className="ssl-section-header">
                <div className="ssl-section-title-wrap">
                  <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--ax-text-muted, #64748b)' }}>
                    2. Beneficiary & Location Details
                  </h4>
                  <span style={{ fontSize: 12, color: 'var(--ax-text-muted, #64748b)' }}>
                    Beneficiary identification and ward number
                  </span>
                </div>
              </div>

              <div className="ssl-form-grid ssl-form-grid--3col">
                <FloatingInput
                  label="Beneficiary Name"
                  name="beneficiaryName"
                  value={form.beneficiaryName}
                  onChange={handleInputChange('beneficiaryName')}
                  required
                  error={errors.beneficiaryName}
                />
                <FloatingInput
                  label="Beneficiary Contact No. (10 digits)"
                  name="contactNo"
                  type="tel"
                  maxLength={10}
                  value={form.contactNo}
                  onChange={handleInputChange('contactNo')}
                  required
                  error={errors.contactNo}
                />
                <FloatingInput
                  label="Ward Number"
                  name="wardNo"
                  value={form.wardNo}
                  onChange={handleInputChange('wardNo')}
                  required
                  error={errors.wardNo}
                />
              </div>

              <hr className="ssl-section-divider" />
            </div>

            {/* ── Section 3: Hardware Serials ── */}
            <div ref={sec3Ref} className="ssl-section-block">
              <div className="ssl-section-header">
                <div className="ssl-section-title-wrap">
                  <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--ax-text-muted, #64748b)' }}>
                    3. Installed Hardware Identifiers
                  </h4>
                  <span style={{ fontSize: 12, color: 'var(--ax-text-muted, #64748b)' }}>
                    Unique equipment and serial numbers installed on pole
                  </span>
                </div>
              </div>

              <div className="ssl-form-grid ssl-form-grid--3col">
                <FloatingInput
                  label="UUID Number"
                  name="uuidNo"
                  value={form.uuidNo}
                  onChange={handleInputChange('uuidNo')}
                  required
                  error={errors.uuidNo}
                />
                <FloatingInput
                  label="Pole Number"
                  name="poleNo"
                  value={form.poleNo}
                  onChange={handleInputChange('poleNo')}
                  required
                  error={errors.poleNo}
                />
                <FloatingInput
                  label="Light Luminary Number"
                  name="lightNo"
                  value={form.lightNo}
                  onChange={handleInputChange('lightNo')}
                  required
                  error={errors.lightNo}
                />
                <FloatingInput
                  label="Solar Panel Serial No."
                  name="panelNo"
                  value={form.panelNo}
                  onChange={handleInputChange('panelNo')}
                  required
                  error={errors.panelNo}
                />
                <FloatingInput
                  label="Battery Serial No."
                  name="batteryNo"
                  value={form.batteryNo}
                  onChange={handleInputChange('batteryNo')}
                  required
                  error={errors.batteryNo}
                />
              </div>

              <hr className="ssl-section-divider" />
            </div>

            {/* ── Section 4: Geolocation & Verification Photos ── */}
            <div ref={sec4Ref} className="ssl-section-block">
              <div className="ssl-section-header">
                <div className="ssl-section-title-wrap">
                  <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--ax-text-muted, #64748b)' }}>
                    4. Geo Location & Verification Photographs
                  </h4>
                  <span style={{ fontSize: 12, color: 'var(--ax-text-muted, #64748b)' }}>
                    Physical installation coordinates and photo evidence (Max 5MB each)
                  </span>
                </div>
                <button
                  type="button"
                  className="ax-btn ax-btn--secondary ax-btn--sm"
                  onClick={handleDetectGps}
                  disabled={gpsDetecting}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="22" y1="12" x2="18" y2="12" />
                    <line x1="6" y1="12" x2="2" y2="12" />
                    <line x1="12" y1="6" x2="12" y2="2" />
                    <line x1="12" y1="22" x2="12" y2="18" />
                  </svg>
                  <span>{gpsDetecting ? 'Acquiring GPS…' : 'Capture Current GPS'}</span>
                </button>
              </div>

              {gpsStatusMsg && (
                <div style={{ fontSize: 12, color: '#2563eb', fontWeight: 600, marginBottom: 14 }}>
                  {gpsStatusMsg}
                </div>
              )}

              {/* Coordinates Grid */}
              <div className="ssl-form-grid" style={{ marginBottom: 20 }}>
                <FloatingInput
                  label="Latitude (e.g. 30.9010)"
                  name="latitude"
                  value={form.latitude}
                  onChange={handleInputChange('latitude')}
                  required
                  error={errors.latitude}
                />
                <FloatingInput
                  label="Longitude (e.g. 75.8573)"
                  name="longitude"
                  value={form.longitude}
                  onChange={handleInputChange('longitude')}
                  required
                  error={errors.longitude}
                />
              </div>

              {/* Photo Upload Dropzones (matching Assam SWP UploadDropzone) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
                <UploadDropzone
                  id="light_file"
                  label="Light Installation Photo 1"
                  helperText="Full view showing installed pole, luminary, and solar panel"
                  required={!isEditMode}
                  file={lightFile}
                  preview={filePreview || undefined}
                  existingUrl={existingImageUrl}
                  onSelect={handlePhotoSelect(false)}
                  onRemove={handlePhotoRemove(false)}
                  error={errors.light_file}
                />
                <UploadDropzone
                  id="light_file2"
                  label="Light Installation Photo 2"
                  helperText="Close-up view of battery enclosure and hardware barcode label"
                  required={!isEditMode}
                  file={lightFile2}
                  preview={filePreview2 || undefined}
                  existingUrl={existingImageUrl2}
                  onSelect={handlePhotoSelect(true)}
                  onRemove={handlePhotoRemove(true)}
                  error={errors.light_file2}
                />
              </div>

              <hr className="ssl-section-divider" />
            </div>

            {/* ── Section 5: Remarks ── */}
            <div ref={sec5Ref} className="ssl-section-block">
              <div className="ssl-section-header">
                <div className="ssl-section-title-wrap">
                  <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--ax-text-muted, #64748b)' }}>
                    5. Inspection & Remarks
                  </h4>
                  <span style={{ fontSize: 12, color: 'var(--ax-text-muted, #64748b)' }}>
                    Additional site observations or installation remarks
                  </span>
                </div>
              </div>

              <div style={{ position: 'relative' }}>
                <textarea
                  id="remarks"
                  name="remarks"
                  className="ax-input"
                  style={{ width: '100%', minHeight: 90, padding: '12px 14px', fontSize: 13 }}
                  placeholder="Enter any additional installation or site notes (optional)..."
                  value={form.remarks}
                  onChange={(e) => setForm((prev) => ({ ...prev, remarks: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Bottom Action Bar */}
        <div className="ssl-form-sticky-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              {isEditMode ? 'Edit Mode:' : 'Installation Mode:'}
            </span>
            {siteDetail && (
              <span className="ax-badge ax-badge--soft ax-badge--accent ax-badge--pill" style={{ fontWeight: 700 }}>
                {siteDetail.unique_id || `#${siteDetail.id}`}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              className="ax-btn ax-btn--ghost"
              onClick={resetForm}
              disabled={submitting}
            >
              Reset Form
            </button>
            <button
              type="submit"
              className="ax-btn ax-btn--primary"
              disabled={submitting}
              style={{ minWidth: 160 }}
            >
              {submitting ? (
                <><span className="ax-spinner" style={{ marginRight: 6 }} /> Submitting…</>
              ) : isEditMode ? (
                'Update Installation'
              ) : (
                'Submit Light Installation'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default Punjab_Installation_SSL_InstallLight;
