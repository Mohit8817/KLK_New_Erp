import { useState, useEffect, useRef, useMemo, useCallback, type FormEvent, type ChangeEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { authService } from '../../../../../services/authService';
import { useAuth } from '../../../../../context/AuthContext';
import {
  jammuSslService,
  type JammuSslLightDropdownItem,
  type JammuSslLightDetail,
} from '../../jammu-services';
import { CameraBarcodeScannerModal } from './CameraBarcodeScannerModal';

/* ───────── Unified Single-Card Layout matching Reference Design ───────── */
const SINGLE_CARD_FORM_CSS = `
.solar-erp-page {
  --asw-primary: #2563eb;
  --asw-primary-rgb: 37, 99, 235;
}
.jammu-inst-form .ax-card {
  border: 1px solid var(--ax-border, #e2e8f0);
  border-radius: var(--ax-radius-xl, 16px);
  background: var(--ax-surface-solid, #ffffff);
  box-shadow: var(--ax-shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.05));
  overflow: hidden;
}
.jammu-inst-form .ax-card__header {
  padding: var(--ax-space-5, 20px) var(--ax-space-6, 24px);
  border-bottom: 1px solid var(--ax-border-subtle, #f1f5f9);
  background: var(--ax-surface-subtle, #f8fafc);
  display: flex;
  flex-direction: column;
  gap: var(--ax-space-4, 16px);
}
.jammu-inst-form .ax-card__body { padding: var(--ax-space-6, 24px); }

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
.ax-float__input:focus::placeholder { color: #94a3b8; }
.ax-float__input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px color-mix(in srgb, #2563eb 20%, transparent);
}
.ax-float__input:disabled { opacity: .75; cursor: not-allowed; background: var(--ax-surface-subtle, #f8fafc); }

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

/* Upload dropzone */
.jammu-upload-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  margin-top: 8px;
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
  onCameraClick?: () => void;
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
  onCameraClick,
}: FloatingInputProps) {
  const [focused, setFocused] = useState(false);
  const hasVal = Boolean(value && String(value).length > 0);

  const inputNode = (
    <div className="ax-float" style={{ flex: 1, minWidth: 0 }}>
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
        style={onCameraClick ? { borderTopRightRadius: 0, borderBottomRightRadius: 0 } : undefined}
      />
      <label htmlFor={name} className={`ax-float__label ${focused ? 'floating' : hasVal ? 'has-val' : ''}`}>
        {label} {required && <span style={{ color: 'var(--ax-danger, #ef4444)' }}>*</span>}
      </label>
    </div>
  );

  if (onCameraClick) {
    return (
      <div style={{ display: 'flex', alignItems: 'stretch', width: '100%' }}>
        {inputNode}
        <button
          type="button"
          className="ax-btn ax-btn--secondary"
          onClick={onCameraClick}
          title={`Scan barcode for ${label}`}
          aria-label={`Scan barcode for ${label}`}
          style={{
            height: 46,
            padding: '0 12px',
            borderTopLeftRadius: 0,
            borderBottomLeftRadius: 0,
            borderLeft: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            color: '#2563eb',
            fontWeight: 600,
            fontSize: '12px',
            flexShrink: 0,
            background: 'var(--ax-surface-subtle, #f8fafc)',
            borderColor: 'var(--ax-border, #cbd5e1)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          <span>Scan</span>
        </button>
      </div>
    );
  }

  return inputNode;
}

/* ───────── Upload Dropzone ───────── */
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
  accept = 'image/*,application/pdf',
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
          padding: file || preview ? '12px 14px' : '20px 16px',
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
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong, #0f172a)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
              title="Remove photo"
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
                background: '#eff6ff',
                color: '#3b82f6',
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
            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ax-text-strong, #1e293b)' }}>
              Choose File <span style={{ fontWeight: 400, color: 'var(--ax-text-muted, #64748b)', fontSize: 11.5 }}>No file chosen</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--ax-text-muted, #64748b)', marginTop: 2 }}>
              JPG, PNG, WEBP or PDF (max 5 MB)
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

export function InstallLights() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, rawResponse } = useAuth();

  const paramSslId = searchParams.get('ssl_id') || searchParams.get('id') || searchParams.get('light_id');

  // Vendor resolution from Auth session
  const loginVendorName = useMemo(() => {
    const getCleanString = (val: any): string => {
      if (
        typeof val === 'string' &&
        val.trim() &&
        val.trim().toLowerCase() !== '[object object]' &&
        val.trim().toLowerCase() !== 'null' &&
        val.trim().toLowerCase() !== 'undefined'
      ) {
        return val.trim();
      }
      return '';
    };

    if (user) {
      const fromUser =
        getCleanString((user as any).vendor_name) ||
        getCleanString((user as any).vendor) ||
        getCleanString((user as any).name) ||
        getCleanString((user as any).vendor_id) ||
        getCleanString((user as any).username) ||
        getCleanString((user as any).email);
      if (fromUser) return fromUser;
    }

    if (rawResponse) {
      const fromRaw =
        getCleanString(rawResponse?.vendor?.name) ||
        getCleanString(rawResponse?.vendor?.vendor_name) ||
        getCleanString(rawResponse?.vendor) ||
        getCleanString(rawResponse?.vendor_name) ||
        getCleanString(rawResponse?.name) ||
        getCleanString(rawResponse?.user?.name) ||
        getCleanString(rawResponse?.data?.vendor?.name) ||
        getCleanString(rawResponse?.data?.vendor?.vendor_name) ||
        getCleanString(rawResponse?.data?.vendor_name) ||
        getCleanString(rawResponse?.data?.vendor) ||
        getCleanString(rawResponse?.data?.name);
      if (fromRaw) return fromRaw;
    }

    try {
      const session = authService.getSession() as any;
      if (session) {
        const fromSession =
          getCleanString(session.vendor_name) ||
          getCleanString(session.vendor) ||
          getCleanString(session.name) ||
          getCleanString(session.vendor_id);
        if (fromSession) return fromSession;
      }
    } catch {}

    return 'App Testing';
  }, [user, rawResponse]);

  // Section 1: Dropdown Unique ID's list (API 3: GET jammu/ssl/installation/fetch-site-name)
  const [uniqueIdsList, setUniqueIdsList] = useState<JammuSslLightDropdownItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  // Selected Unique ID & Site Detail (API 4: GET jammu/ssl/installation/fetch-site-detail?ssl_id={id})
  const [selectedSslId, setSelectedSslId] = useState<string>(paramSslId || '');
  const [siteDetail, setSiteDetail] = useState<JammuSslLightDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Section 3: Fill this Form - Required Inputs
  const [wardNumber, setWardNumber] = useState<string>('');
  const [poleNumber, setPoleNumber] = useState<string>('');
  const [beneficiaryName, setBeneficiaryName] = useState<string>('');
  const [beneficiaryContact, setBeneficiaryContact] = useState<string>('');
  const [imeiNumber, setImeiNumber] = useState<string>('');
  const [batteryNumber, setBatteryNumber] = useState<string>('');
  const [panelNumber, setPanelNumber] = useState<string>('');
  const [simNumber, setSimNumber] = useState<string>('');
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');

  // File Upload
  const [lightImage, setLightImage] = useState<File | null>(null);
  const [lightPreview, setLightPreview] = useState<string>('');

  // Status & Feedback
  const [submitting, setSubmitting] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  // Barcode Scanner Modal State
  const [scannerTarget, setScannerTarget] = useState<string | null>(null);

  // Section references for smooth scrolling
  const sec1 = useRef<HTMLDivElement>(null);
  const sec2 = useRef<HTMLDivElement>(null);
  const sec3 = useRef<HTMLDivElement>(null);

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // 1. Load pending site names (API 3)
  const fetchUniqueIds = useCallback(async () => {
    setLoadingList(true);
    try {
      const list = await jammuSslService.fetchLightNames();
      setUniqueIdsList(Array.isArray(list) ? list : []);
    } catch (err: any) {
      console.error('[Jammu SSL InstallLights] fetchSiteName error:', err);
      setUniqueIdsList([]);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    fetchUniqueIds();
  }, [fetchUniqueIds]);

  // 2. Load site details on site selection (API 4: GET jammu/ssl/installation/fetch-site-detail?ssl_id={id})
  const handleSiteSelect = async (sslIdStr: string) => {
    setSelectedSslId(sslIdStr);
    setSiteDetail(null);
    setFeedback(null);

    // Reset inputs
    setWardNumber('');
    setPoleNumber('');
    setBeneficiaryName('');
    setBeneficiaryContact('');
    setImeiNumber('');
    setBatteryNumber('');
    setPanelNumber('');
    setSimNumber('');
    setLatitude('');
    setLongitude('');
    setRemarks('');
    setLightImage(null);
    setLightPreview('');

    if (!sslIdStr) return;

    try {
      setLoadingDetail(true);
      const detail = await jammuSslService.fetchLightDetail(sslIdStr);
      if (detail) {
        setSiteDetail(detail);

        // Pre-fill fields if returned from detail
        if (detail.ward_no) setWardNumber(String(detail.ward_no));
        if (detail.pole_no) setPoleNumber(String(detail.pole_no));
        if (detail.beneficiary_name) setBeneficiaryName(String(detail.beneficiary_name));
        if (detail.contact_no) setBeneficiaryContact(String(detail.contact_no));
        if (detail.imei_no) setImeiNumber(String(detail.imei_no));
        if (detail.battery_serial_no) setBatteryNumber(String(detail.battery_serial_no));
        if (detail.module_no) setPanelNumber(String(detail.module_no));
        if (detail.sim_no) setSimNumber(String(detail.sim_no));
        if (detail.latitude) setLatitude(String(detail.latitude));
        if (detail.longitude) setLongitude(String(detail.longitude));
        if ((detail as any).remark || (detail as any).remarks) {
          setRemarks(String((detail as any).remark || (detail as any).remarks));
        }
      } else {
        setFeedback({
          type: 'danger',
          text: `Light #${sslIdStr} details not found or not accepted by your vendor account.`,
        });
      }
    } catch (err: any) {
      console.error('[Jammu SSL InstallLights] fetchDetail error:', err);
      setFeedback({ type: 'danger', text: err?.message || 'Failed to load light specifications from server.' });
    } finally {
      setLoadingDetail(false);
    }
  };

  // Auto-select if passed in query params
  useEffect(() => {
    if (paramSslId && !siteDetail) {
      handleSiteSelect(paramSslId);
    }
  }, [paramSslId]);

  // Barcode scanned callback
  const handleBarcodeScanned = (code: string) => {
    const clean = code.trim();
    if (!scannerTarget) return;

    if (scannerTarget === 'imei') {
      setImeiNumber(clean);
    } else if (scannerTarget === 'battery') {
      setBatteryNumber(clean);
    } else if (scannerTarget === 'panel') {
      setPanelNumber(clean);
    } else if (scannerTarget === 'sim') {
      setSimNumber(clean);
    }
    setScannerTarget(null);
  };

  // Auto-detect GPS Coordinates
  const detectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setGettingLocation(true);
    setFeedback(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
        setGettingLocation(false);
      },
      (err) => {
        console.warn('Geolocation high accuracy failed, retrying standard...', err);
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setLatitude(pos.coords.latitude.toFixed(6));
            setLongitude(pos.coords.longitude.toFixed(6));
            setGettingLocation(false);
          },
          (err2) => {
            setGettingLocation(false);
            alert(`Unable to retrieve GPS coordinates (${err2.message || 'Permission denied'}). Please enter manually.`);
          },
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // Form Submit Handler (API 5: POST jammu/ssl/installation/site-store)
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const sslId = String(siteDetail?.id || selectedSslId || '').trim();
    if (!sslId) {
      setFeedback({ type: 'danger', text: 'Please select an accepted Unique ID light first.' });
      scrollTo(sec1);
      return;
    }

    if (!wardNumber.trim()) {
      setFeedback({ type: 'danger', text: 'Ward Number is required.' });
      scrollTo(sec3);
      return;
    }

    if (!poleNumber.trim()) {
      setFeedback({ type: 'danger', text: 'Pole Number is required.' });
      scrollTo(sec3);
      return;
    }

    if (!beneficiaryName.trim()) {
      setFeedback({ type: 'danger', text: 'Beneficiary Name is required.' });
      scrollTo(sec3);
      return;
    }

    const cleanContact = beneficiaryContact.replace(/\D/g, '').trim();
    if (cleanContact.length !== 10) {
      setFeedback({ type: 'danger', text: 'Beneficiary Contact Number must be exactly 10 digits.' });
      scrollTo(sec3);
      return;
    }

    if (!imeiNumber.trim()) {
      setFeedback({ type: 'danger', text: 'IMEI Number is required.' });
      scrollTo(sec3);
      return;
    }

    if (!batteryNumber.trim()) {
      setFeedback({ type: 'danger', text: 'Battery Number is required.' });
      scrollTo(sec3);
      return;
    }

    if (!panelNumber.trim()) {
      setFeedback({ type: 'danger', text: 'Panel Number is required.' });
      scrollTo(sec3);
      return;
    }

    if (!simNumber.trim()) {
      setFeedback({ type: 'danger', text: 'SIM Number is required.' });
      scrollTo(sec3);
      return;
    }

    if (!latitude.trim() || !longitude.trim()) {
      setFeedback({ type: 'danger', text: 'Latitude and Longitude are required. Click "Auto-detect GPS" or enter coordinates.' });
      scrollTo(sec3);
      return;
    }

    if (!lightImage) {
      setFeedback({ type: 'danger', text: 'Light Image is required.' });
      scrollTo(sec3);
      return;
    }

    try {
      setSubmitting(true);
      setFeedback(null);

      const formData = new FormData();
      formData.append('ssl_id', sslId);
      formData.append('ward_no', wardNumber.trim());
      formData.append('pole_no', poleNumber.trim());
      formData.append('beneficiary_name', beneficiaryName.trim());
      formData.append('contact_no', cleanContact);
      formData.append('imei_no', imeiNumber.trim());
      formData.append('battery_serial_no', batteryNumber.trim());
      formData.append('module_no', panelNumber.trim());
      formData.append('sim_no', simNumber.trim());
      formData.append('latitude', latitude.trim());
      formData.append('longitude', longitude.trim());
      formData.append('light_file', lightImage);
      if (remarks.trim()) {
        formData.append('remark', remarks.trim());
      }

      const res = await jammuSslService.installLightStore(formData);

      setFeedback({
        type: 'success',
        text: res.message || 'Details Updated Successfully!!!',
      });

      // Remove from dropdown list
      setUniqueIdsList((prev) => prev.filter((item) => String(item.id) !== sslId));

      setTimeout(() => {
        navigate('/v/jammu/installation/ssl/installation-details');
      }, 1500);
    } catch (err: any) {
      console.error('[Jammu SSL InstallLights] submit error:', err);
      setFeedback({
        type: 'danger',
        text: err?.message || 'Failed to submit installation details.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="solar-erp-page jammu-inst-form">
      <style>{SINGLE_CARD_FORM_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="Jammu SSL Site Information"
        subtitle="Record street light installation execution, scan IMEI/SIM/battery/panel serials, capture GPS coordinates, and upload site photos"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Jammu & Kashmir' },
          { label: 'Installation' },
          { label: 'SSL' },
          { label: 'Install Lights' },
        ]}
        actions={
          <Link to="/v/jammu/installation/ssl/installation-details" className="ax-btn ax-btn--secondary ax-btn--sm">
            View Installed Sites
          </Link>
        }
      />

      {feedback && (
        <div className={`ax-alert ax-alert--${feedback.type}`} style={{ marginBottom: 'var(--ax-space-4)' }} role="alert">
          <div className="ax-alert__title">{feedback.type === 'success' ? 'Success' : 'Error'}</div>
          <div className="ax-alert__text">{feedback.text}</div>
        </div>
      )}

      {/* ── Main Form Card ── */}
      <form onSubmit={handleSubmit} className="ax-card">
        {/* ── Header with Section Pills ── */}
        <div className="ax-card__header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h2 className="ax-card__title" style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                Jammu SSL Site Information
              </h2>
              <p className="ax-card__subtitle" style={{ fontSize: '0.85rem', color: 'var(--ax-text-muted, #64748b)', margin: '2px 0 0' }}>
                Select accepted unique street light ID, review site specifications, and submit field installation data.
              </p>
            </div>
            {siteDetail && (
              <span className="ax-badge ax-badge--soft ax-badge--info" style={{ fontWeight: 600 }}>
                Light #{siteDetail.id} {siteDetail.village ? `· ${siteDetail.village}` : ''}
              </span>
            )}
          </div>

          {/* Quick Nav Pills */}
          <div className="swp-section-pills" role="navigation" aria-label="Quick section navigation">
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec1)}>
              <span className="pill-num">1</span> Select Unique ID's
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec2)}>
              <span className="pill-num">2</span> Information
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec3)}>
              <span className="pill-num">3</span> Fill this Form
            </button>
          </div>
        </div>

        <div className="ax-card__body">
          {/* ════════ Section 1: Select Unique ID's ════════ */}
          <div ref={sec1} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>Select Unique ID's</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Choose from accepted, pending-install street lights assigned to your vendor account
                </span>
              </div>
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--sm"
                onClick={fetchUniqueIds}
                disabled={loadingList}
                title="Refresh unique ID list"
              >
                {loadingList ? 'Refreshing...' : '🔄 Refresh List'}
              </button>
            </div>

            <div className="ax-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <div className="ax-float">
                <select
                  id="jammu-select-ssl-id"
                  className="ax-float__input"
                  value={selectedSslId}
                  onChange={(e) => handleSiteSelect(e.target.value)}
                  disabled={loadingList || submitting}
                  required
                >
                  <option value="">-- Select Unique ID's --</option>
                  {uniqueIdsList.map((item) => (
                    <option key={item.id} value={String(item.id)}>
                      #{item.id} {item.village ? `- ${item.village}` : ''} {item.district ? `(${item.district})` : ''}
                    </option>
                  ))}
                </select>
                <label htmlFor="jammu-select-ssl-id" className="ax-float__label floating">
                  Select Unique ID's <span style={{ color: 'var(--ax-danger, #ef4444)' }}>*</span>
                </label>
              </div>
            </div>

            {!loadingList && uniqueIdsList.length === 0 && (
              <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 8, border: '1px solid var(--ax-border, #e2e8f0)', fontSize: 13, color: 'var(--ax-text-muted)' }}>
                ℹ️ No accepted, pending-install street lights found. Please make sure you have accepted your assigned lights in{' '}
                <Link to="/v/jammu/installation/ssl/assign-lights" style={{ color: '#2563eb', fontWeight: 600 }}>
                  View Assign SSL Site
                </Link>.
              </div>
            )}

            {loadingDetail && (
              <div style={{ padding: '16px 0', color: '#2563eb', fontSize: '13px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="ax-spinner" /> Fetching light details & specifications...
              </div>
            )}
          </div>

          <hr className="swp-section-divider" />

          {/* ════════ Section 2: Information (Read-only fetched data) ════════ */}
          <div ref={sec2} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>Information</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Auto-populated official Jammu SSL site specifications (Read-only fetched details)
                </span>
              </div>
            </div>

            <div className="ax-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '16px' }}>
              <FloatingInput
                label="Vendor Name"
                name="vendor_name_info"
                value={siteDetail?.vendor_name || siteDetail?.vendor || loginVendorName}
                onChange={() => {}}
                disabled
              />

              <FloatingInput
                label="State"
                name="state_info"
                value={siteDetail?.state || (selectedSslId ? 'Jammu' : '')}
                onChange={() => {}}
                disabled
              />

              <FloatingInput
                label="District"
                name="district_info"
                value={siteDetail?.district || ''}
                onChange={() => {}}
                disabled
              />

              <FloatingInput
                label="Block"
                name="block_info"
                value={siteDetail?.block || ''}
                onChange={() => {}}
                disabled
              />

              <FloatingInput
                label="Village"
                name="village_info"
                value={siteDetail?.village || ''}
                onChange={() => {}}
                disabled
              />

              <FloatingInput
                label="Phase"
                name="phase_info"
                value={siteDetail?.phase != null ? String(siteDetail.phase) : ''}
                onChange={() => {}}
                disabled
              />

              <FloatingInput
                label="Address"
                name="address_info"
                value={siteDetail?.address || ''}
                onChange={() => {}}
                disabled
              />

              <FloatingInput
                label="Serial No."
                name="serial_no_info"
                value={siteDetail?.serial_no || ''}
                onChange={() => {}}
                disabled
              />

              <FloatingInput
                label="Supply"
                name="supply_info"
                value={
                  siteDetail?.material_supply === 1 || siteDetail?.material_supply === '1'
                    ? 'Delivered (1)'
                    : siteDetail?.material_supply != null
                    ? String(siteDetail.material_supply)
                    : ''
                }
                onChange={() => {}}
                disabled
              />

              <FloatingInput
                label="Material Inspection"
                name="inspection_info"
                value={
                  siteDetail?.material_inspection === 1 || siteDetail?.material_inspection === '1'
                    ? 'Inspected (1)'
                    : siteDetail?.material_inspection != null
                    ? String(siteDetail.material_inspection)
                    : ''
                }
                onChange={() => {}}
                disabled
              />

              <FloatingInput
                label="Installation"
                name="installation_info"
                value={
                  siteDetail?.installation === 1 || siteDetail?.installation === '1'
                    ? 'Installed (1)'
                    : siteDetail?.installation === 0 || siteDetail?.installation === '0'
                    ? 'Pending (0)'
                    : siteDetail?.installation != null
                    ? String(siteDetail.installation)
                    : ''
                }
                onChange={() => {}}
                disabled
              />

              <FloatingInput
                label="Date of Installation"
                name="installation_date_info"
                value={siteDetail?.installation_date || (selectedSslId ? 'Pending' : '')}
                onChange={() => {}}
                disabled
              />
            </div>
          </div>

          <hr className="swp-section-divider" />

          {/* ════════ Section 3: Fill this Form ════════ */}
          <div ref={sec3} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>Fill this Form</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  The field labels marked with <span style={{ color: 'var(--ax-danger, #ef4444)', fontWeight: 600 }}>*</span> are fields.
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

            {/* Sub-grid 1: Ward, Pole, Beneficiary Details */}
            <div style={{ marginBottom: 16 }}>
              <div className="ax-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                <FloatingInput
                  label="Ward Number"
                  name="ward_no"
                  value={wardNumber}
                  onChange={(e) => setWardNumber(e.target.value)}
                  placeholder="Enter Ward Number"
                  required
                />

                <FloatingInput
                  label="Pole Number"
                  name="pole_no"
                  value={poleNumber}
                  onChange={(e) => setPoleNumber(e.target.value)}
                  placeholder="Enter Pole Number"
                  required
                />

                <FloatingInput
                  label="Benificiary Name"
                  name="beneficiary_name"
                  value={beneficiaryName}
                  onChange={(e) => setBeneficiaryName(e.target.value)}
                  placeholder="Enter Benificiary Name"
                  required
                />

                <FloatingInput
                  label="Benificiary Contact"
                  name="contact_no"
                  type="tel"
                  value={beneficiaryContact}
                  onChange={(e) => setBeneficiaryContact(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="Enter Contact Number"
                  required
                />
              </div>
            </div>

            {/* Sub-grid 2: IMEI, Battery, Panel, SIM Numbers with Barcode Scanner */}
            <div style={{ marginBottom: 16, marginTop: 24 }}>
              <div className="ax-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                <FloatingInput
                  label="IMEI Number"
                  name="imei_no"
                  value={imeiNumber}
                  onChange={(e) => setImeiNumber(e.target.value)}
                  placeholder="Enter IMEI Number"
                  required
                  onCameraClick={() => setScannerTarget('imei')}
                />

                <FloatingInput
                  label="Battery Number"
                  name="battery_serial_no"
                  value={batteryNumber}
                  onChange={(e) => setBatteryNumber(e.target.value)}
                  placeholder="Enter Battery Number"
                  required
                  onCameraClick={() => setScannerTarget('battery')}
                />

                <FloatingInput
                  label="Panel Number"
                  name="module_no"
                  value={panelNumber}
                  onChange={(e) => setPanelNumber(e.target.value)}
                  placeholder="Enter Panel Number"
                  required
                  onCameraClick={() => setScannerTarget('panel')}
                />

                <FloatingInput
                  label="Sim Number"
                  name="sim_no"
                  value={simNumber}
                  onChange={(e) => setSimNumber(e.target.value)}
                  placeholder="Enter Sim Number"
                  required
                  onCameraClick={() => setScannerTarget('sim')}
                />
              </div>
            </div>

            {/* Sub-grid 3: Geolocation Coordinates & Remarks */}
            <div style={{ marginBottom: 16, marginTop: 24 }}>
              <div className="ax-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                <FloatingInput
                  label="Latitude"
                  name="latitude"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="e.g. 32.5612"
                  required
                />

                <FloatingInput
                  label="Longitude"
                  name="longitude"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="e.g. 75.1234"
                  required
                />

                <div style={{ gridColumn: 'span 2' }}>
                  <FloatingInput
                    label="Remarks"
                    name="remark"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Enter Remarks..."
                  />
                </div>
              </div>
            </div>

            {/* Sub-grid 4: Light Image Upload */}
            <div style={{ marginTop: 24 }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b', margin: '0 0 6px 0' }}>
                Installation Photograph <span style={{ color: 'var(--ax-danger, #ef4444)' }}>*</span>
              </h4>
              <p style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)', margin: '0 0 14px 0' }}>
                Upload clear photograph of installed Solar Street Light (JPG, PNG, WEBP, PDF up to 5MB).
              </p>

              <div className="jammu-upload-grid">
                <UploadDropzone
                  id="light_file"
                  label="Light Image"
                  required
                  file={lightImage}
                  preview={lightPreview}
                  onSelect={(f) => {
                    setLightImage(f);
                    setLightPreview(URL.createObjectURL(f));
                  }}
                  onRemove={() => {
                    setLightImage(null);
                    setLightPreview('');
                  }}
                />
              </div>
            </div>
          </div>

          {/* ════════ Submit Footer ════════ */}
          <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid var(--ax-border, #e2e8f0)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <Link to="/v/jammu/installation/ssl/installation-details" className="ax-btn ax-btn--secondary">
              Cancel
            </Link>
            <button
              type="submit"
              className="ax-btn ax-btn--primary"
              disabled={submitting || !selectedSslId}
              style={{ minWidth: 180 }}
            >
              {submitting ? 'Submitting Installation...' : 'Save Installation Details'}
            </button>
          </div>
        </div>
      </form>

      {/* ── Camera Barcode Scanner Modal ── */}
      <CameraBarcodeScannerModal
        open={scannerTarget !== null}
        fieldName={scannerTarget || ''}
        fieldLabel={
          scannerTarget === 'imei'
            ? 'IMEI Number'
            : scannerTarget === 'battery'
            ? 'Battery Number'
            : scannerTarget === 'panel'
            ? 'Panel Number'
            : scannerTarget === 'sim'
            ? 'SIM Card Number'
            : ''
        }
        onScan={handleBarcodeScanned}
        onClose={() => setScannerTarget(null)}
      />
    </div>
  );
}

export default InstallLights;
