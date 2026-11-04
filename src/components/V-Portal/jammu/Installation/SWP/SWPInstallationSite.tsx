import { useState, useEffect, useRef, useMemo, useCallback, type FormEvent, type ChangeEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { authService } from '../../../../../services/authService';
import { useAuth } from '../../../../../context/AuthContext';
import {
  jammuSwpService,
  type JammuSwpSiteNameItem,
  type JammuSwpSiteDetail,
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

/* Upload dropzone grid */
.jammu-upload-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
  margin-top: 8px;
}
@media (max-width: 640px) {
  .jammu-upload-grid {
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

/* ───────── Modern Upload Dropzone ───────── */
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
              JPG, PNG, JPEG or WEBP (max 5 MB)
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

export function SWPInstallationSite() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, rawResponse } = useAuth();

  const paramSiteId = searchParams.get('site_id') || searchParams.get('id');

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
        getCleanString((user as any).username);
      if (fromUser) return fromUser;
    }

    if (rawResponse) {
      const fromRaw =
        getCleanString(rawResponse?.vendor?.name) ||
        getCleanString(rawResponse?.vendor?.vendor_name) ||
        getCleanString(rawResponse?.vendor) ||
        getCleanString(rawResponse?.vendor_name) ||
        getCleanString(rawResponse?.name) ||
        getCleanString(rawResponse?.data?.vendor?.name);
      if (fromRaw) return fromRaw;
    }

    try {
      const session = authService.getSession() as any;
      if (session) {
        const fromSession =
          getCleanString(session.vendor_name) ||
          getCleanString(session.vendor) ||
          getCleanString(session.name);
        if (fromSession) return fromSession;
      }
    } catch {}

    return '';
  }, [user, rawResponse]);

  // Section 1: Dropdown sites list (API 3: GET jammu/swp/fetch-site-name)
  const [sitesList, setSitesList] = useState<JammuSwpSiteNameItem[]>([]);
  const [loadingSites, setLoadingSites] = useState(false);

  // Selected site and fetched specifications (API 4: GET jammu/swp/fetch-site-detail?site_id={site_id})
  const [selectedSiteId, setSelectedSiteId] = useState<string>(paramSiteId || '');
  const [siteDetail, setSiteDetail] = useState<JammuSwpSiteDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Section 3: Fill this Form - Technician Inputs
  const [vendorName, setVendorName] = useState<string>('');
  const [motorNo, setMotorNo] = useState<string>('');
  const [pumpNo, setPumpNo] = useState<string>('');
  const [vfdNo, setVfdNo] = useState<string>('');
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');

  // Module Serial Numbers array (starts with Module Serial No. 1)
  const [moduleSerialNos, setModuleSerialNos] = useState<string[]>(['']);

  // 4 Mandatory Images
  const [moduleImage, setModuleImage] = useState<File | null>(null);
  const [vfdImage, setVfdImage] = useState<File | null>(null);
  const [runningWaterImage, setRunningWaterImage] = useState<File | null>(null);
  const [poleImage, setPoleImage] = useState<File | null>(null);

  // Image Previews
  const [modulePreview, setModulePreview] = useState<string>('');
  const [vfdPreview, setVfdPreview] = useState<string>('');
  const [runningWaterPreview, setRunningWaterPreview] = useState<string>('');
  const [polePreview, setPolePreview] = useState<string>('');

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
  const fetchSitesList = useCallback(async () => {
    setLoadingSites(true);
    try {
      const list = await jammuSwpService.getInstallableSiteNames();
      setSitesList(Array.isArray(list) ? list : []);
    } catch (err: any) {
      console.error('[Jammu SWP InstallSites] fetchSiteNames error:', err);
      setSitesList([]);
    } finally {
      setLoadingSites(false);
    }
  }, []);

  useEffect(() => {
    fetchSitesList();
  }, [fetchSitesList]);

  // Sync vendor name default
  useEffect(() => {
    if (!vendorName && loginVendorName) {
      setVendorName(loginVendorName);
    }
  }, [loginVendorName, vendorName]);

  // 2. Load site details on site selection (API 4: GET jammu/swp/fetch-site-detail?site_id={site_id})
  const handleSiteSelect = async (siteIdStr: string) => {
    setSelectedSiteId(siteIdStr);
    setSiteDetail(null);
    setFeedback(null);

    // Reset technician inputs
    setMotorNo('');
    setPumpNo('');
    setVfdNo('');
    setLatitude('');
    setLongitude('');
    setRemarks('');
    setModuleSerialNos(['']);
    setModuleImage(null);
    setVfdImage(null);
    setRunningWaterImage(null);
    setPoleImage(null);
    setModulePreview('');
    setVfdPreview('');
    setRunningWaterPreview('');
    setPolePreview('');

    if (!siteIdStr) return;

    try {
      setLoadingDetail(true);
      const detail = await jammuSwpService.getSiteDetail(siteIdStr);

      if (detail) {
        setSiteDetail(detail);

        if (detail.vendor_name || detail.vendor) {
          setVendorName(String(detail.vendor_name || detail.vendor));
        } else if (loginVendorName) {
          setVendorName(loginVendorName);
        }

        if (detail.mt_motor_no) setMotorNo(String(detail.mt_motor_no));
        if (detail.mt_pump_no) setPumpNo(String(detail.mt_pump_no));
        if (detail.vfd_no) setVfdNo(String(detail.vfd_no));
        if (detail.inst_latitude) setLatitude(String(detail.inst_latitude));
        if (detail.inst_longitude) setLongitude(String(detail.inst_longitude));
        if (detail.inst_remarks) setRemarks(String(detail.inst_remarks));
      } else {
        setFeedback({
          type: 'danger',
          text: `Site ${siteIdStr} details not found or not assigned to your vendor account.`,
        });
      }
    } catch (err: any) {
      console.error('[Jammu SWP InstallSites] fetchSiteDetail error:', err);
      setFeedback({ type: 'danger', text: err?.message || 'Failed to load site specifications from server.' });
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    if (paramSiteId && !siteDetail) {
      handleSiteSelect(paramSiteId);
    }
  }, [paramSiteId]);

  // Module serial array handlers
  const handleAddModule = () => {
    setModuleSerialNos((prev) => [...prev, '']);
  };

  const handleRemoveModule = (index: number) => {
    setModuleSerialNos((prev) => {
      if (prev.length <= 1) return [''];
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
  };

  const handleModuleChange = (index: number, val: string) => {
    setModuleSerialNos((prev) => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  // Barcode scanned callback
  const handleBarcodeScanned = (code: string) => {
    const clean = code.trim();
    if (!scannerTarget) return;

    if (scannerTarget === 'motor') {
      setMotorNo(clean);
    } else if (scannerTarget === 'pump') {
      setPumpNo(clean);
    } else if (scannerTarget === 'vfd') {
      setVfdNo(clean);
    } else if (scannerTarget.startsWith('module-')) {
      const index = parseInt(scannerTarget.replace('module-', ''), 10);
      if (!isNaN(index)) {
        handleModuleChange(index, clean);
      }
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

  // Form Submit Handler (Endpoint 5: POST jammu/swp/installation-site-store)
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const siteId = String(siteDetail?.id || selectedSiteId || '').trim();
    if (!siteId) {
      setFeedback({ type: 'danger', text: 'Please select an accepted applicant / installation site first.' });
      scrollTo(sec1);
      return;
    }

    if (!vendorName.trim()) {
      setFeedback({ type: 'danger', text: 'Vendor Name is required.' });
      scrollTo(sec3);
      return;
    }

    if (!motorNo.trim()) {
      setFeedback({ type: 'danger', text: 'Motor No. is required.' });
      scrollTo(sec3);
      return;
    }

    if (!pumpNo.trim()) {
      setFeedback({ type: 'danger', text: 'Pump No. is required.' });
      scrollTo(sec3);
      return;
    }

    if (!vfdNo.trim()) {
      setFeedback({ type: 'danger', text: 'VFD Serial No. is required.' });
      scrollTo(sec3);
      return;
    }

    if (!latitude.trim() || !longitude.trim()) {
      setFeedback({ type: 'danger', text: 'Latitude and Longitude are required. Click "Auto-detect GPS" or enter coordinates.' });
      scrollTo(sec3);
      return;
    }

    // Module serial 1 check
    if (!moduleSerialNos[0] || !moduleSerialNos[0].trim()) {
      setFeedback({ type: 'danger', text: 'Module Serial No. 1 is required.' });
      scrollTo(sec3);
      return;
    }

    // 4 Mandatory Images validation
    if (!moduleImage) {
      setFeedback({ type: 'danger', text: 'Farmer With Module Image is required.' });
      scrollTo(sec3);
      return;
    }
    if (!vfdImage) {
      setFeedback({ type: 'danger', text: 'VFD with Farmer Image is required.' });
      scrollTo(sec3);
      return;
    }
    if (!runningWaterImage) {
      setFeedback({ type: 'danger', text: 'Running Water With Farmer Image is required.' });
      scrollTo(sec3);
      return;
    }
    if (!poleImage) {
      setFeedback({ type: 'danger', text: 'Pole With Farmer Image is required.' });
      scrollTo(sec3);
      return;
    }

    try {
      setSubmitting(true);
      setFeedback(null);

      const formData = new FormData();
      formData.append('site_id', siteId);
      formData.append('motor_no', motorNo.trim());
      formData.append('pump_no', pumpNo.trim());
      formData.append('vfd_no', vfdNo.trim());

      formData.append('inst_latitude', latitude.trim());
      formData.append('inst_longitude', longitude.trim());

      if (remarks.trim()) {
        formData.append('inst_remarks', remarks.trim());
      }

      // Append module serial numbers: module_serial_no[]
      const cleanModules = moduleSerialNos.map((m) => m.trim()).filter(Boolean);
      cleanModules.forEach((m) => {
        formData.append('module_serial_no[]', m);
      });

      // 4 Photos
      formData.append('module_image', moduleImage);
      formData.append('vfd_image', vfdImage);
      formData.append('running_water_image', runningWaterImage);
      formData.append('pole_image', poleImage);

      const res = await jammuSwpService.installSiteStore(formData);

      setFeedback({
        type: 'success',
        text: res.message || 'Site Installed Successfully! Installation report submitted.',
      });

      // Update dropdown list
      setSitesList((prev) => prev.filter((s) => String(s.id) !== String(siteId)));

      setTimeout(() => {
        navigate('/v/jammu/installation/swp/view-installation');
      }, 1500);
    } catch (err: any) {
      console.error('[Jammu SWP InstallSites] submit error:', err);
      setFeedback({
        type: 'danger',
        text: err?.message || 'Failed to submit Jammu SWP installation details.',
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
        title="Jammu SWP Install Site"
        subtitle="Record solar water pump installation, motor & pump serials, VFD configuration, GPS coordinates, and farmer photos."
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Jammu & Kashmir' },
          { label: 'Installation' },
          { label: 'SWP' },
          { label: 'Installation Site' },
        ]}
        actions={
          <Link to="/v/jammu/installation/swp/view-installation" className="ax-btn ax-btn--secondary ax-btn--sm">
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
                Jammu SWP Install Site
              </h2>
              <p className="ax-card__subtitle" style={{ fontSize: '0.85rem', color: 'var(--ax-text-muted, #64748b)', margin: '2px 0 0' }}>
                Fill out installation details and upload site evidence for verification.
              </p>
            </div>
            {siteDetail && (
              <span className="ax-badge ax-badge--soft ax-badge--info" style={{ fontWeight: 600 }}>
                {siteDetail.f_farmer_name ? `${siteDetail.f_farmer_name} (${siteDetail.district || ''})` : `Site ${siteDetail.id}`}
              </span>
            )}
          </div>

          {/* Quick Nav Pills */}
          <div className="swp-section-pills" role="navigation" aria-label="Quick section navigation">
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec1)}>
              <span className="pill-num">1</span> Site Information
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
          {/* ════════ Section 1: Site Information (Select Applicant) ════════ */}
          <div ref={sec1} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>Site Information</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Select an accepted applicant / solar water pump installation site
                </span>
              </div>
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--sm"
                onClick={fetchSitesList}
                disabled={loadingSites}
                title="Refresh applicant list"
              >
                {loadingSites ? 'Refreshing...' : '🔄 Refresh Applicants'}
              </button>
            </div>

            <div className="ax-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <div className="ax-float">
                <select
                  id="swp-select-applicant"
                  className="ax-float__input"
                  value={selectedSiteId}
                  onChange={(e) => handleSiteSelect(e.target.value)}
                  disabled={loadingSites || submitting}
                  required
                >
                  <option value="">-- Select Applicant --</option>
                  {sitesList.map((s) => (
                    <option key={s.id} value={String(s.id)}>
                      {s.f_farmer_name} {s.district ? `(${s.district})` : ''}
                    </option>
                  ))}
                </select>
                <label htmlFor="swp-select-applicant" className="ax-float__label floating">
                  Select Applicant <span style={{ color: 'var(--ax-danger, #ef4444)' }}>*</span>
                </label>
              </div>
            </div>

            {!loadingSites && sitesList.length === 0 && (
              <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 8, border: '1px solid var(--ax-border, #e2e8f0)', fontSize: 13, color: 'var(--ax-text-muted)' }}>
                ℹ️ No pending installation sites found. Please ensure you have accepted assigned site batches first in{' '}
                <Link to="/v/jammu/installation/swp/installation-request" style={{ color: '#2563eb', fontWeight: 600 }}>
                  Assigned SWP Site
                </Link>.
              </div>
            )}

            {loadingDetail && (
              <div style={{ padding: '16px 0', color: '#2563eb', fontSize: '13px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="ax-spinner" /> Fetching applicant specifications & site details...
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
                  Auto-populated farmer site information, location, work order, and pump volume (Read-only details)
                </span>
              </div>
            </div>

            <div className="ax-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '16px' }}>
              <FloatingInput
                label="State"
                name="state_info"
                value={siteDetail?.state || (selectedSiteId ? 'jammu' : '')}
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
                label="Tehsil"
                name="tehsil_info"
                value={siteDetail?.tehsil || ''}
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
                label="Applicant Name"
                name="f_farmer_name_info"
                value={siteDetail?.f_farmer_name || ''}
                onChange={() => {}}
                disabled
              />

              <FloatingInput
                label="WO No."
                name="wo_no_info"
                value={siteDetail?.work_order || ''}
                onChange={() => {}}
                disabled
              />

              <FloatingInput
                label="Volume No."
                name="volume_info"
                value={siteDetail?.volume || ''}
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

            {/* Vendor Details */}
            <div style={{ marginBottom: 16 }}>
              <div className="ax-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                <FloatingInput
                  label="Vendor"
                  name="vendor"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  placeholder="Enter Vendor Name"
                  required
                />
              </div>
            </div>

            {/* Equipment Serial Numbers with Barcode Scanners */}
            <div style={{ marginBottom: 16, marginTop: 24 }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b', margin: '0 0 10px 0' }}>
                Pump Equipment Serial Numbers (Barcode Scan Enabled)
              </h4>
              <div className="ax-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                <FloatingInput
                  label="Motor No."
                  name="motor_no"
                  value={motorNo}
                  onChange={(e) => setMotorNo(e.target.value)}
                  placeholder="Enter Motor Serial Number"
                  required
                  onCameraClick={() => setScannerTarget('motor')}
                />

                <FloatingInput
                  label="Pump No."
                  name="pump_no"
                  value={pumpNo}
                  onChange={(e) => setPumpNo(e.target.value)}
                  placeholder="Enter Pump Serial Number"
                  required
                  onCameraClick={() => setScannerTarget('pump')}
                />

                <FloatingInput
                  label="VFD Serial No."
                  name="vfd_no"
                  value={vfdNo}
                  onChange={(e) => setVfdNo(e.target.value)}
                  placeholder="Enter VFD Serial Number"
                  required
                  onCameraClick={() => setScannerTarget('vfd')}
                />
              </div>
            </div>

            {/* Module Serial Numbers (Module Serial No. 1 + Dynamic add/remove) */}
            <div style={{ marginBottom: 16, marginTop: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b', margin: 0 }}>
                  Solar Module Serial Numbers ({moduleSerialNos.length} {moduleSerialNos.length === 1 ? 'Module' : 'Modules'})
                </h4>
                <button
                  type="button"
                  className="ax-btn ax-btn--secondary ax-btn--xs"
                  onClick={handleAddModule}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600 }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span>Add More Modules</span>
                </button>
              </div>

              <div className="ax-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                {moduleSerialNos.map((mVal, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'stretch', gap: 6, width: '100%' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <FloatingInput
                        label={`Module Serial No. ${idx + 1}`}
                        name={`module_serial_no_${idx + 1}`}
                        value={mVal}
                        onChange={(e) => handleModuleChange(idx, e.target.value)}
                        placeholder={`Enter Module ${idx + 1} Serial`}
                        required={idx === 0}
                        onCameraClick={() => setScannerTarget(`module-${idx}`)}
                      />
                    </div>
                    {moduleSerialNos.length > 1 && (
                      <button
                        type="button"
                        className="ax-btn ax-btn--ghost ax-btn--sm"
                        onClick={() => handleRemoveModule(idx)}
                        title={`Remove Module ${idx + 1}`}
                        style={{ color: '#ef4444', padding: '0 8px', alignSelf: 'center', height: 46 }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Geolocation Coordinates & Remarks */}
            <div style={{ marginBottom: 16, marginTop: 24 }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b', margin: '0 0 10px 0' }}>
                Installation Geolocation & Remarks
              </h4>
              <div className="ax-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                <FloatingInput
                  label="Latitude"
                  name="inst_latitude"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="e.g. 32.5612"
                  required
                />

                <FloatingInput
                  label="Longitude"
                  name="inst_longitude"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="e.g. 75.1234"
                  required
                />

                <FloatingInput
                  label="Installation Remarks"
                  name="inst_remarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter remarks or observations"
                />
              </div>
            </div>

            {/* Upload Photos Dropzones (4 Mandatory Images) */}
            <div style={{ marginTop: 24 }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b', margin: '0 0 6px 0' }}>
                Installation Site Evidence Photographs <span style={{ color: 'var(--ax-danger, #ef4444)' }}>*</span>
              </h4>
              <p style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)', margin: '0 0 14px 0' }}>
                Upload high-clarity site evidence photographs with farmer (JPG, PNG, JPEG, WEBP up to 5MB each).
              </p>

              <div className="jammu-upload-grid">
                <UploadDropzone
                  id="module_image"
                  label="Farmer With Module Image"
                  required
                  file={moduleImage}
                  preview={modulePreview}
                  onSelect={(f) => {
                    setModuleImage(f);
                    setModulePreview(URL.createObjectURL(f));
                  }}
                  onRemove={() => {
                    setModuleImage(null);
                    setModulePreview('');
                  }}
                />

                <UploadDropzone
                  id="vfd_image"
                  label="VFD with Farmer Image"
                  required
                  file={vfdImage}
                  preview={vfdPreview}
                  onSelect={(f) => {
                    setVfdImage(f);
                    setVfdPreview(URL.createObjectURL(f));
                  }}
                  onRemove={() => {
                    setVfdImage(null);
                    setVfdPreview('');
                  }}
                />

                <UploadDropzone
                  id="running_water_image"
                  label="Running Water With Farmer Image"
                  required
                  file={runningWaterImage}
                  preview={runningWaterPreview}
                  onSelect={(f) => {
                    setRunningWaterImage(f);
                    setRunningWaterPreview(URL.createObjectURL(f));
                  }}
                  onRemove={() => {
                    setRunningWaterImage(null);
                    setRunningWaterPreview('');
                  }}
                />

                <UploadDropzone
                  id="pole_image"
                  label="Pole With Farmer Image"
                  required
                  file={poleImage}
                  preview={polePreview}
                  onSelect={(f) => {
                    setPoleImage(f);
                    setPolePreview(URL.createObjectURL(f));
                  }}
                  onRemove={() => {
                    setPoleImage(null);
                    setPolePreview('');
                  }}
                />
              </div>
            </div>
          </div>

          {/* ════════ Submit Footer ════════ */}
          <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid var(--ax-border, #e2e8f0)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <Link to="/v/jammu/installation/swp/view-installation" className="ax-btn ax-btn--secondary">
              Cancel
            </Link>
            <button
              type="submit"
              className="ax-btn ax-btn--primary"
              disabled={submitting || !selectedSiteId}
              style={{ minWidth: 180 }}
            >
              {submitting ? 'Submitting Installation...' : 'Submit Installation Report'}
            </button>
          </div>
        </div>
      </form>

      {/* ── Camera Barcode Scanner Modal ── */}
      <CameraBarcodeScannerModal
        open={scannerTarget !== null}
        fieldName={scannerTarget || ''}
        fieldLabel={
          scannerTarget === 'motor'
            ? 'Motor Serial Number'
            : scannerTarget === 'pump'
            ? 'Pump Serial Number'
            : scannerTarget === 'vfd'
            ? 'VFD Serial Number'
            : scannerTarget?.startsWith('module-')
            ? `Module Serial No. ${parseInt(scannerTarget.replace('module-', ''), 10) + 1}`
            : ''
        }
        onScan={handleBarcodeScanned}
        onClose={() => setScannerTarget(null)}
      />
    </div>
  );
}

export default SWPInstallationSite;
