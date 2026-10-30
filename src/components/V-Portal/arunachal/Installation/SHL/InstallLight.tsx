import { useState, useEffect, useRef, useMemo, type FormEvent, type ChangeEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { authService } from '../../../../../services/authService';
import { useAuth } from '../../../../../context/AuthContext';
import {
  arunachalShlInstallationService,
  resolveArunachalMediaUrl,
  type ArunachalLightDropdownItem,
  type ArunachalLightDetail,
} from '../../arunachal-services';
import { CameraBarcodeScannerModal } from './CameraBarcodeScannerModal';

// Unified Single-Card Layout with Floating Labels & Section Dividers (matching exact Assam reference)
const SINGLE_CARD_FORM_CSS = `
.shl-inst-form .ax-card {
  border: 1px solid var(--ax-border, #e2e8f0);
  border-radius: var(--ax-radius-xl, 16px);
  background: var(--ax-surface-solid, #ffffff);
  box-shadow: var(--ax-shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.05));
  overflow: hidden;
}
.shl-inst-form .ax-card__header {
  padding: var(--ax-space-5, 20px) var(--ax-space-6, 24px);
  border-bottom: 1px solid var(--ax-border-subtle, #f1f5f9);
  background: var(--ax-surface-subtle, #f8fafc);
  display: flex;
  flex-direction: column;
  gap: var(--ax-space-4, 16px);
}
.shl-inst-form .ax-card__body { padding: var(--ax-space-6, 24px); }

/* Quick Section Nav Pills matching Assam reference */
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

/* ───────── Modern Upload Dropzone (matching exact Assam reference) ───────── */
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
              Choose File <span style={{ fontWeight: 400, color: 'var(--ax-text-muted, #64748b)', fontSize: 12 }}>No file chosen</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--ax-text-muted, #64748b)', marginTop: 3 }}>
              JPG, PNG, JPEG, WEBP or PDF image — single file (max 5120 KB)
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

export function Arunachal_Installation_SHL_InstallLight() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, rawResponse } = useAuth();

  // Mode: Check if edit query parameter exists
  const editLightIdParam = searchParams.get('light_id') || searchParams.get('id') || searchParams.get('edit_id');
  const isEditMode = Boolean(editLightIdParam);

  // Logged-in Vendor name resolution from AuthContext, active session & storage
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

    // 1. From AuthContext reactive state
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
        getCleanString(rawResponse?.data?.name) ||
        getCleanString(rawResponse?.data?.user?.name) ||
        getCleanString(rawResponse?.vendor_id) ||
        getCleanString(rawResponse?.data?.vendor_id);
      if (fromRaw) return fromRaw;
    }

    // 2. From authService storage methods
    try {
      const session = authService.getSession() as any;
      if (session) {
        const fromSession =
          getCleanString(session.vendor_name) ||
          getCleanString(session.vendor) ||
          getCleanString(session.name) ||
          getCleanString(session.vendor_id) ||
          getCleanString(session.username);
        if (fromSession) return fromSession;
      }

      const raw = authService.getRawResponse() as any;
      if (raw) {
        const fromRaw =
          getCleanString(raw?.vendor?.name) ||
          getCleanString(raw?.vendor?.vendor_name) ||
          getCleanString(raw?.vendor) ||
          getCleanString(raw?.vendor_name) ||
          getCleanString(raw?.name) ||
          getCleanString(raw?.user?.name) ||
          getCleanString(raw?.data?.vendor?.name) ||
          getCleanString(raw?.data?.vendor_name) ||
          getCleanString(raw?.data?.vendor) ||
          getCleanString(raw?.data?.name) ||
          getCleanString(raw?.data?.user?.name) ||
          getCleanString(raw?.vendor_id) ||
          getCleanString(raw?.data?.vendor_id);
        if (fromRaw) return fromRaw;
      }
    } catch {}

    // 3. Direct localStorage / sessionStorage inspect fallback
    try {
      const sessionStr = sessionStorage.getItem('klk_user_session') || localStorage.getItem('klk_user_session');
      if (sessionStr) {
        const parsed = JSON.parse(sessionStr);
        const fromParsed =
          getCleanString(parsed?.vendor_name) ||
          getCleanString(parsed?.vendor) ||
          getCleanString(parsed?.name) ||
          getCleanString(parsed?.vendor_id);
        if (fromParsed) return fromParsed;
      }

      const rawStr = sessionStorage.getItem('klk_raw_login_response') || localStorage.getItem('klk_raw_login_response');
      if (rawStr) {
        const parsedRaw = JSON.parse(rawStr);
        const fromParsedRaw =
          getCleanString(parsedRaw?.vendor?.name) ||
          getCleanString(parsedRaw?.vendor?.vendor_name) ||
          getCleanString(parsedRaw?.vendor) ||
          getCleanString(parsedRaw?.vendor_name) ||
          getCleanString(parsedRaw?.name) ||
          getCleanString(parsedRaw?.user?.name) ||
          getCleanString(parsedRaw?.data?.vendor?.name) ||
          getCleanString(parsedRaw?.data?.vendor_name) ||
          getCleanString(parsedRaw?.data?.vendor) ||
          getCleanString(parsedRaw?.data?.name);
        if (fromParsedRaw) return fromParsedRaw;
      }
    } catch {}

    return '';
  }, [user, rawResponse]);

  // State: Dropdown lights list (API 3)
  const [lightsList, setLightsList] = useState<ArunachalLightDropdownItem[]>([]);
  const [loadingLights, setLoadingLights] = useState(false);

  // Form selections and site details (API 4 or API 7)
  const [selectedLightId, setSelectedLightId] = useState<string>(editLightIdParam || '');
  const [siteDetail, setSiteDetail] = useState<ArunachalLightDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Editable Form Inputs (API 5 & 8)
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [wardNo, setWardNo] = useState('');
  const [poleNo, setPoleNo] = useState('');
  const [uuidNo, setUuidNo] = useState('');
  const [panelNo, setPanelNo] = useState('');
  const [batteryNo, setBatteryNo] = useState('');
  const [lightNo, setLightNo] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [remarks, setRemarks] = useState('');

  // File upload state
  const [lightFile, setLightFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string>('');

  // Status and submission states
  const [submitting, setSubmitting] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  // Camera Barcode Scanner Modal State
  const [scannerTarget, setScannerTarget] = useState<'uuid' | 'panel' | 'battery' | 'light' | null>(null);

  // Section refs for smooth scrolling matching Assam reference
  const sec1 = useRef<HTMLDivElement>(null);
  const sec2 = useRef<HTMLDivElement>(null);
  const sec3 = useRef<HTMLDivElement>(null);

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // 1. Load pending light names (API 3) in Add mode
  useEffect(() => {
    if (isEditMode) return;
    let cancelled = false;
    const fetchDropdown = async () => {
      setLoadingLights(true);
      try {
        const list = await arunachalShlInstallationService.fetchLightNames();
        if (!cancelled) {
          setLightsList(list || []);
        }
      } catch (err) {
        console.error('[Arunachal SHL Installation] fetchLightList error:', err);
      } finally {
        if (!cancelled) {
          setLoadingLights(false);
        }
      }
    };

    fetchDropdown();
    return () => {
      cancelled = true;
    };
  }, [isEditMode]);

  // 2. Load site details on site selection (API 4)
  const handleLightSelect = async (lightId: string) => {
    setSelectedLightId(lightId);
    setSiteDetail(null);
    setFeedback(null);

    // Keep all editable inputs in Section 3 ("Fill this Form") completely blank for manual entry!
    setBeneficiaryName('');
    setContactNo('');
    setWardNo('');
    setPoleNo('');
    setUuidNo('');
    setPanelNo('');
    setBatteryNo('');
    setLightNo('');
    setLatitude('');
    setLongitude('');
    setRemarks('');
    setFilePreview('');
    setLightFile(null);

    if (!lightId) {
      return;
    }

    try {
      setLoadingDetail(true);
      const det = await arunachalShlInstallationService.fetchLightDetail(lightId);
      if (det) {
        // ONLY populate siteDetail for Section 2 (read-only display)
        setSiteDetail(det);

        // Editable form inputs in Section 3 ("Fill this Form") remain blank for manual entry by technician:
        // "bakii nichee kaa form khudd bharnaa hogaa voo fetch matt karvaa kahii se blank dataa rhene do"
        setBeneficiaryName('');
        setContactNo('');
        setWardNo('');
        setPoleNo('');
        setUuidNo('');
        setPanelNo('');
        setBatteryNo('');
        setLightNo('');
        setLatitude('');
        setLongitude('');
        setRemarks('');
        setFilePreview('');
        setLightFile(null);
      } else {
        setFeedback({
          type: 'danger',
          text: 'Site details not found or not assigned to your vendor account.',
        });
      }
    } catch (err: any) {
      console.error('[Arunachal SHL Installation] fetchDetail error:', err);
      setFeedback({ type: 'danger', text: 'Failed to load site details.' });
    } finally {
      setLoadingDetail(false);
    }
  };

  // 3. Load for Edit (API 7) if in Edit mode
  useEffect(() => {
    if (!editLightIdParam) return;
    let isMounted = true;
    const loadForEdit = async () => {
      setLoadingDetail(true);
      try {
        const det = await arunachalShlInstallationService.getUpdateInstallLightLoad(editLightIdParam);
        if (!isMounted) return;
        if (det) {
          setSelectedLightId(String(det.id || editLightIdParam));
          setSiteDetail(det);
          setBeneficiaryName(det.beneficiary_name || '');
          setContactNo(det.contact_no ? String(det.contact_no) : '');
          setWardNo(det.ward_no ? String(det.ward_no) : '');
          setPoleNo(det.pole_no ? String(det.pole_no) : '');
          setUuidNo(det.uuid_no ? String(det.uuid_no) : '');
          setPanelNo(det.panel_no ? String(det.panel_no) : '');
          setBatteryNo(det.battery_serial_no || det.battery_no || '');
          setLightNo(det.light_no ? String(det.light_no) : '');
          setLatitude(det.latitude ? String(det.latitude) : '');
          setLongitude(det.longitude ? String(det.longitude) : '');
          setRemarks(det.inst_remark || det.remark || '');
          if (det.light_file) {
            setFilePreview(resolveArunachalMediaUrl(det.light_file));
          }
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('[Arunachal SHL Installation] loadForEdit error:', err);
          setFeedback({ type: 'danger', text: err?.message || 'Failed to load light details for edit' });
        }
      } finally {
        if (isMounted) setLoadingDetail(false);
      }
    };
    loadForEdit();
    return () => {
      isMounted = false;
    };
  }, [editLightIdParam]);

  // Barcode scanned callback from Camera Barcode Scanner
  const handleBarcodeScanned = (code: string) => {
    const clean = code.trim();
    if (scannerTarget === 'uuid') {
      setUuidNo(clean);
    } else if (scannerTarget === 'panel') {
      setPanelNo(clean);
    } else if (scannerTarget === 'battery') {
      setBatteryNo(clean);
    } else if (scannerTarget === 'light') {
      setLightNo(clean);
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
        console.warn('Geolocation high-accuracy failed, retrying standard...', err);
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

  // Remove uploaded file
  const removeFile = () => {
    setLightFile(null);
    setFilePreview('');
  };

  // Form Submit Handler (API 5 for Store, API 8 for Update)
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const lightNumericId = selectedLightId || siteDetail?.id;
    if (!lightNumericId) {
      setFeedback({ type: 'danger', text: 'Please select an installation light first.' });
      scrollTo(sec1);
      return;
    }

    if (!beneficiaryName.trim()) {
      setFeedback({ type: 'danger', text: 'Benificiary Name is required.' });
      scrollTo(sec3);
      return;
    }

    const cleanContact = contactNo.replace(/\D/g, '').trim();
    if (cleanContact.length !== 10) {
      setFeedback({ type: 'danger', text: 'Benificiary Contact must be exactly 10 digits.' });
      scrollTo(sec3);
      return;
    }

    if (!wardNo.trim()) {
      setFeedback({ type: 'danger', text: 'Ward Number is required.' });
      scrollTo(sec3);
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
    if (!panelNo.trim()) {
      setFeedback({ type: 'danger', text: 'Panel Number is required.' });
      scrollTo(sec3);
      return;
    }
    if (!batteryNo.trim()) {
      setFeedback({ type: 'danger', text: 'Battery Number is required.' });
      scrollTo(sec3);
      return;
    }
    if (!lightNo.trim()) {
      setFeedback({ type: 'danger', text: 'Light Number is required.' });
      scrollTo(sec3);
      return;
    }

    if (!latitude.trim() || !longitude.trim()) {
      setFeedback({ type: 'danger', text: 'GPS Latitude and Longitude are required.' });
      scrollTo(sec3);
      return;
    }

    if (!isEditMode && !lightFile) {
      setFeedback({ type: 'danger', text: 'Light Image is required.' });
      scrollTo(sec3);
      return;
    }

    if (lightFile && lightFile.size > 5120 * 1024) {
      setFeedback({ type: 'danger', text: 'Light Image size exceeds 5MB (5120 KB).' });
      scrollTo(sec3);
      return;
    }

    try {
      setSubmitting(true);
      setFeedback(null);

      const formData = new FormData();
      formData.append('light_id', String(lightNumericId));
      formData.append('uuid_no', uuidNo.trim());
      formData.append('pole_no', poleNo.trim());
      formData.append('light_no', lightNo.trim());
      formData.append('panel_no', panelNo.trim());
      formData.append('battery_serial_no', batteryNo.trim());
      formData.append('battery_no', batteryNo.trim());
      formData.append('beneficiary_name', beneficiaryName.trim());
      formData.append('ward_no', wardNo.trim());
      formData.append('contact_no', cleanContact);
      formData.append('latitude', latitude.trim());
      formData.append('longitude', longitude.trim());
      formData.append('remark', remarks.trim());
      formData.append('remarks', remarks.trim());

      // Attach logged in vendor name if available
      const vendorToSubmit = loginVendorName || siteDetail?.vendor || siteDetail?.vendor_name || '';
      if (vendorToSubmit) {
        formData.append('vendor', vendorToSubmit);
        formData.append('vendor_name', vendorToSubmit);
      }

      if (lightFile) {
        formData.append('light_file', lightFile);
      }

      let res;
      if (isEditMode) {
        res = await arunachalShlInstallationService.updateInstallLightStore(formData);
        setFeedback({ type: 'success', text: res.message || 'Details Updated Successfully!' });
      } else {
        res = await arunachalShlInstallationService.storeLightDetails(formData);
        setFeedback({ type: 'success', text: res.message || 'Light Installed Successfully!' });
      }

      setTimeout(() => {
        navigate('/v/arunachal/shl/installation/view-installation');
      }, 1500);
    } catch (err: any) {
      console.error('[Arunachal SHL Installation] submit error:', err);
      setFeedback({
        type: 'danger',
        text: err?.message || 'Failed to submit Arunachal SHL installation.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="solar-erp-page shl-inst-form">
      <style>{SINGLE_CARD_FORM_CSS}</style>

      {/* ── Page Head matching reference ── */}
      <PageHead
        title={isEditMode ? 'Edit Installation Details' : 'Install Arunachal SHL Light'}
        subtitle={
          isEditMode
            ? 'Update solar home light equipment numbers, GPS coordinates, and verification photo.'
            : 'Capture Solar Home Light installation execution data, serial numbers, geocoordinates, and verification photograph.'
        }
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Arunachal Pradesh' },
          { label: 'Installation' },
          { label: 'SHL' },
          { label: isEditMode ? 'Edit Details' : 'Install Light' },
        ]}
        actions={
          <Link to="/v/arunachal/shl/installation/view-installation" className="ax-btn ax-btn--secondary ax-btn--sm">
            View Installed Lights
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
                {isEditMode ? 'Edit Installation Details' : 'Solar Home Light Installation Form'}
              </h2>
              <p className="ax-card__subtitle" style={{ fontSize: '0.85rem', color: 'var(--ax-text-muted, #64748b)', margin: '2px 0 0' }}>
                {isEditMode
                  ? 'Update existing solar home light equipment numbers, GPS coordinates, and verification photograph.'
                  : 'Fill out installation details and upload site completion evidence for department verification.'}
              </p>
            </div>
            {siteDetail && (
              <span className="ax-badge ax-badge--soft ax-badge--info" style={{ fontWeight: 600 }}>
                {siteDetail.beneficiary_name ? `${siteDetail.beneficiary_name} (${siteDetail.district || ''})` : `Light #${siteDetail.id}`}
              </span>
            )}
          </div>

          {/* Quick Nav Pills */}
          <div className="swp-section-pills" role="navigation" aria-label="Quick section navigation">
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec1)}>
              <span className="pill-num">1</span> Site Selection
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec2)}>
              <span className="pill-num">2</span> Beneficiary & Location Info
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec3)}>
              <span className="pill-num">3</span> Fill this Form
            </button>
          </div>
        </div>

        <div className="ax-card__body">
          {/* ════════ Section 1: Site Selection ════════ */}
          <div ref={sec1} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>1. Select Installation Site</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  {isEditMode
                    ? 'Editing existing installation record'
                    : 'Choose from accepted lights pending installation in Arunachal Pradesh'}
                </span>
              </div>
            </div>

            <div className="ax-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <div className="ax-float">
                {isEditMode ? (
                  <>
                    <input
                      id="shl-select-uid"
                      type="text"
                      className="ax-float__input"
                      value={`Light #${selectedLightId} - ${siteDetail?.unique_id || ''}`}
                      disabled
                    />
                    <label htmlFor="shl-select-uid" className="ax-float__label floating">
                      Installation Light
                    </label>
                  </>
                ) : (
                  <>
                    <select
                      id="shl-select-uid"
                      className="ax-float__input"
                      value={selectedLightId}
                      onChange={(e) => handleLightSelect(e.target.value)}
                      disabled={loadingLights || submitting}
                      required
                    >
                      <option value="">-- Choose Assigned Light / Unique ID --</option>
                      {lightsList.map((l) => (
                        <option key={l.id} value={String(l.id)}>
                          #{l.id} - {l.unique_id} {l.panchayat ? `· ${l.panchayat}` : ''}
                        </option>
                      ))}
                    </select>
                    <label htmlFor="shl-select-uid" className="ax-float__label floating">
                      Assigned Light <span style={{ color: 'var(--ax-danger, #ef4444)' }}>*</span>
                    </label>
                  </>
                )}
              </div>
            </div>

            {!isEditMode && !loadingLights && lightsList.length === 0 && (
              <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 8, border: '1px solid var(--ax-border, #e2e8f0)', fontSize: 13, color: 'var(--ax-text-muted)' }}>
                ℹ️ No pending installation lights found. Please ensure you have accepted assigned light batches first in{' '}
                <Link to="/v/arunachal/shl/installation/view-assigned-light" style={{ color: '#2563eb', fontWeight: 600 }}>
                  Assigned Lights
                </Link>.
              </div>
            )}

            {loadingDetail && (
              <div style={{ padding: '16px 0', color: '#2563eb', fontSize: '13px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="ax-spinner" /> Fetching light specifications & prefilled details...
              </div>
            )}
          </div>

          <hr className="swp-section-divider" />

          {/* ════════ Section 2: Beneficiary & Location Information (Read-only fetched data) ════════ */}
          <div ref={sec2} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>2. Beneficiary & Location Information</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Auto-populated official beneficiary and site record (Read-only fetched details)
                </span>
              </div>
            </div>

            <div className="ax-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <FloatingInput
                label="Vendor Name"
                name="vendor_display"
                value={loginVendorName || siteDetail?.vendor || siteDetail?.vendor_name || ''}
                onChange={() => {}}
                disabled
              />
              <FloatingInput
                label="Unique ID"
                name="unique_id_display"
                value={siteDetail?.unique_id != null ? String(siteDetail.unique_id) : (selectedLightId ? String(selectedLightId) : '')}
                onChange={() => {}}
                disabled
              />
              <FloatingInput
                label="Beneficiary Name"
                name="beneficiary_name_display"
                value={siteDetail?.beneficiary_name || ''}
                onChange={() => {}}
                disabled
              />
              <FloatingInput
                label="Contact No."
                name="contact_no_display"
                value={siteDetail?.contact_no != null ? String(siteDetail.contact_no) : ''}
                onChange={() => {}}
                disabled
              />
              <FloatingInput
                label="State"
                name="state_display"
                value={siteDetail?.state || (selectedLightId ? 'arunachal' : '')}
                onChange={() => {}}
                disabled
              />
              <FloatingInput
                label="Phase"
                name="phase_display"
                value={siteDetail?.phase || ''}
                onChange={() => {}}
                disabled
              />
              <FloatingInput
                label="District"
                name="district_display"
                value={siteDetail?.district || ''}
                onChange={() => {}}
                disabled
              />
              <FloatingInput
                label="Block"
                name="block_display"
                value={siteDetail?.block || ''}
                onChange={() => {}}
                disabled
              />
              <FloatingInput
                label="Panchayat"
                name="panchayat_display"
                value={siteDetail?.panchayat || ''}
                onChange={() => {}}
                disabled
              />
              <FloatingInput
                label="Address"
                name="address_display"
                value={siteDetail?.address || ''}
                onChange={() => {}}
                disabled
              />
            </div>
          </div>

          <hr className="swp-section-divider" />

          {/* ════════ Section 3: Fill this Form (Technician manual entry) ════════ */}
          <div ref={sec3} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>3. Fill this Form</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  The field labels marked with <span style={{ color: 'var(--ax-danger, #ef4444)', fontWeight: 600 }}>*</span> are required fields.
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

            {/* Grid 1: Beneficiary, Ward, Pole */}
            <div className="ax-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '16px' }}>
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
                value={contactNo}
                onChange={(e) => setContactNo(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="Enter Contact Number"
                required
              />

              <FloatingInput
                label="Ward Number"
                name="ward_no"
                value={wardNo}
                onChange={(e) => setWardNo(e.target.value)}
                placeholder="Enter Ward Number"
                required
              />

              <FloatingInput
                label="Pole Number"
                name="pole_no"
                value={poleNo}
                onChange={(e) => setPoleNo(e.target.value)}
                placeholder="Enter Pole Number"
                required
              />
            </div>

            {/* Grid 2: Equipment Serial Numbers with Barcode Scanner Buttons */}
            <div className="ax-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '16px' }}>
              <FloatingInput
                label="UUID NO"
                name="uuid_no"
                value={uuidNo}
                onChange={(e) => setUuidNo(e.target.value)}
                placeholder="Enter UUID Number"
                required
                onCameraClick={() => setScannerTarget('uuid')}
              />

              <FloatingInput
                label="Panel Number"
                name="panel_no"
                value={panelNo}
                onChange={(e) => setPanelNo(e.target.value)}
                placeholder="Enter Panel Number"
                required
                onCameraClick={() => setScannerTarget('panel')}
              />

              <FloatingInput
                label="Battery Number"
                name="battery_no"
                value={batteryNo}
                onChange={(e) => setBatteryNo(e.target.value)}
                placeholder="Enter Battery Number"
                required
                onCameraClick={() => setScannerTarget('battery')}
              />

              <FloatingInput
                label="Light Number"
                name="light_no"
                value={lightNo}
                onChange={(e) => setLightNo(e.target.value)}
                placeholder="Enter Light Number"
                required
                onCameraClick={() => setScannerTarget('light')}
              />
            </div>

            {/* Grid 3: GPS Coordinates & Remarks */}
            <div className="ax-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '16px' }}>
              <FloatingInput
                label="Latitude"
                name="latitude"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="28.603171541160073"
                required
              />

              <FloatingInput
                label="Longitude"
                name="longitude"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="77.35741112118423"
                required
              />

              <FloatingInput
                label="Remarks"
                name="remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter Remarks"
              />
            </div>

            {/* Grid 4: Light Image Evidence */}
            <div style={{ marginTop: '8px' }}>
              <UploadDropzone
                id="light_file"
                label="Light Image"
                required={!isEditMode}
                file={lightFile}
                preview={filePreview}
                onSelect={(f) => {
                  setLightFile(f);
                  setFilePreview(URL.createObjectURL(f));
                }}
                onRemove={removeFile}
              />
            </div>
          </div>

          {/* ════════ Submit Footer matching reference ════════ */}
          <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid var(--ax-border, #e2e8f0)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <Link to="/v/arunachal/shl/installation/view-installation" className="ax-btn ax-btn--secondary">
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

      {/* ── Camera Barcode Scanner Modal ── */}
      <CameraBarcodeScannerModal
        open={scannerTarget !== null}
        fieldName={scannerTarget || ''}
        fieldLabel={
          scannerTarget === 'uuid'
            ? 'UUID Number'
            : scannerTarget === 'panel'
            ? 'Panel Number'
            : scannerTarget === 'battery'
            ? 'Battery Number'
            : scannerTarget === 'light'
            ? 'Light Number'
            : ''
        }
        onScan={handleBarcodeScanned}
        onClose={() => setScannerTarget(null)}
      />
    </div>
  );
}

export default Arunachal_Installation_SHL_InstallLight;
