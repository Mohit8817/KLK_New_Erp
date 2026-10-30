import { useState, useEffect, useRef, useMemo, useCallback, type FormEvent, type ChangeEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { authService } from '../../../../../services/authService';
import { useAuth } from '../../../../../context/AuthContext';
import {
  karnatakaSwpService,
  resolveKarnatakaMediaUrl,
  type KarnatakaSiteNameItem,
  type KarnatakaSiteDetailItem,
} from '../../karnataka-services';
import { CameraBarcodeScannerModal } from './CameraBarcodeScannerModal';

// Unified Single-Card Layout with Floating Labels & Section Dividers (matching exact reference)
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
  border-radius: 9999px;
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
  background: #eff6ff;
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
  color: var(--ax-text, #1e293b);
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.ax-float__input::placeholder { color: transparent; }
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
  transition: top 0.15s ease, font-size 0.15s ease, color 0.15s ease;
  z-index: 2;
  white-space: nowrap;
  max-width: calc(100% - 24px);
  overflow: hidden;
  text-overflow: ellipsis;
}
.ax-float__label.floating,
.ax-float:focus-within .ax-float__label {
  top: 0;
  transform: translateY(-50%);
  font-size: 11px;
  font-weight: 600;
  color: #2563eb;
}
.ax-float__label.has-val:not(.floating) {
  top: 0;
  transform: translateY(-50%);
  font-size: 11px;
  font-weight: 500;
  color: var(--ax-text-muted, #64748b);
}

/* 3-column GPS & Remarks Grid */
.swp-gps-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}
@media (max-width: 768px) {
  .swp-gps-grid { grid-template-columns: 1fr; }
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
          padding: 14,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          minHeight: 110,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {preview ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
              <img
                src={preview}
                alt={label}
                style={{
                  width: 56,
                  height: 56,
                  objectFit: 'cover',
                  borderRadius: 6,
                  border: '1px solid #e2e8f0',
                  flexShrink: 0,
                }}
              />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file ? file.name : label}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: 2 }}>
                  {file ? `${(file.size / 1024).toFixed(0)} KB · Ready for upload` : 'Existing image loaded'}
                </div>
              </div>
            </div>
            <button
              type="button"
              className="ax-btn ax-btn--ghost ax-btn--sm"
              onClick={handleClear}
              style={{ color: '#ef4444', flexShrink: 0 }}
            >
              Remove
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 4 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: '#eff6ff',
                color: '#2563eb',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </div>
            <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#334155' }}>
              Click to capture or upload photograph
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
              JPEG, PNG or WebP · Drag & drop supported
            </div>
          </div>
        )}
      </div>

      {error && (
        <span style={{ fontSize: '11px', color: 'var(--ax-danger-500, #ef4444)' }}>
          {error}
        </span>
      )}
    </div>
  );
}

export function KarnatakaInstallationSite() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  // Mode: Check if edit query parameter exists (API 6 & API 7)
  const editSiteIdParam = searchParams.get('id') || searchParams.get('edit_id') || searchParams.get('site_id');
  const isEditMode = Boolean(searchParams.get('mode') === 'edit' || searchParams.get('edit_id'));

  // Logged-in Vendor name resolution from active login session & useAuth context
  const loginVendorName = useMemo(() => {
    try {
      const session = authService.getSession() as any;
      const raw = authService.getRawResponse() as any;
      const directUser = authService.getUser() as any;

      const candidates = [
        user?.name,
        user?.vendor_name,
        user?.username,
        session?.name,
        session?.username,
        session?.vendor_name,
        session?.vendors?.name,
        session?.vendor?.name,
        directUser?.name,
        directUser?.vendor_name,
        directUser?.username,
        raw?.data?.username,
        raw?.username,
        raw?.vendor?.name,
        raw?.data?.vendor?.name,
        raw?.data?.vendors?.name,
        raw?.user?.name,
        raw?.data?.name,
        session?.company,
        session?.firm,
        session?.vendor_id ? `Vendor (${session.vendor_id})` : '',
      ];

      for (const c of candidates) {
        if (c && typeof c === 'string' && c.trim() && c.trim() !== 'Active Vendor' && c.trim() !== 'NA') {
          return c.trim();
        }
      }
      return session?.vendor_id ? `Vendor (${session.vendor_id})` : 'App Testing';
    } catch {
      return 'App Testing';
    }
  }, [user]);

  // Section Refs for Quick Navigation Pills
  const sec1 = useRef<HTMLDivElement>(null);
  const sec2 = useRef<HTMLDivElement>(null);
  const sec3 = useRef<HTMLDivElement>(null);
  const sec4 = useRef<HTMLDivElement>(null);
  const sec5 = useRef<HTMLDivElement>(null);

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // State: Sites Dropdown (API 15)
  const [sitesList, setSitesList] = useState<KarnatakaSiteNameItem[]>([]);
  const [loadingSites, setLoadingSites] = useState(false);

  // Form selections and site details (API 16 or API 6)
  const [selectedSiteId, setSelectedSiteId] = useState<string>(editSiteIdParam || '');
  const [siteDetail, setSiteDetail] = useState<KarnatakaSiteDetailItem | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Equipment Form Inputs (API 4 & API 7)
  const [controllerNo, setControllerNo] = useState('');
  const [pumpNo, setPumpNo] = useState('');
  const [motorNo, setMotorNo] = useState('');
  const [imeiNo, setImeiNo] = useState('');
  const [moduleSerials, setModuleSerials] = useState<string[]>(['']);

  // Geolocation & Location Fields
  const [instLatitude, setInstLatitude] = useState('');
  const [instLongitude, setInstLongitude] = useState('');
  const [tehsil, setTehsil] = useState('');
  const [village, setVillage] = useState('');
  const [pincode, setPincode] = useState('');
  const [instRemarks, setInstRemarks] = useState('');
  const [gettingLocation, setGettingLocation] = useState(false);

  // Photo Upload States
  const [moduleImage, setModuleImage] = useState<File | null>(null);
  const [moduleImagePreview, setModuleImagePreview] = useState<string>('');

  const [controllerImage, setControllerImage] = useState<File | null>(null);
  const [controllerImagePreview, setControllerImagePreview] = useState<string>('');

  const [structureImage, setStructureImage] = useState<File | null>(null);
  const [structureImagePreview, setStructureImagePreview] = useState<string>('');

  const [runningWaterImage, setRunningWaterImage] = useState<File | null>(null);
  const [runningWaterImagePreview, setRunningWaterImagePreview] = useState<string>('');

  const [foundationImage, setFoundationImage] = useState<File | null>(null);
  const [foundationImagePreview, setFoundationImagePreview] = useState<string>('');

  // Scanner modal state
  const [scannerTarget, setScannerTarget] = useState<string | null>(null);

  // Feedback & Submitting
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Fetch pending sites list (API 15)
  useEffect(() => {
    if (isEditMode) return;
    let mounted = true;
    setLoadingSites(true);
    karnatakaSwpService
      .fetchSiteName()
      .then((res) => {
        if (!mounted) return;
        setSitesList(res.data || []);
      })
      .catch((err) => {
        console.error('[Karnataka SWP Installation] fetchSiteName error:', err);
      })
      .finally(() => {
        if (mounted) setLoadingSites(false);
      });
    return () => {
      mounted = false;
    };
  }, [isEditMode]);

  // Load details when site is selected (API 16)
  const handleSiteSelect = useCallback(async (siteId: string) => {
    setSelectedSiteId(siteId);
    setFieldErrors({});
    if (!siteId) {
      setSiteDetail(null);
      return;
    }
    setLoadingDetail(true);
    try {
      const res = await karnatakaSwpService.fetchSiteDetails(Number(siteId));
      const det = (res.data?.site || res.data?.sites?.[0] || res.data) as KarnatakaSiteDetailItem;
      setSiteDetail(det);

      // Pre-fill location fields if available
      if (det.f_tehsil || det.tehsil) setTehsil(det.f_tehsil || det.tehsil || '');
      if (det.f_village || det.village) setVillage(det.f_village || det.village || '');
      if (det.f_pincode || det.pincode) setPincode(det.f_pincode || det.pincode || '');
    } catch (err: any) {
      console.error('[Karnataka SWP Installation] fetchSiteDetails error:', err);
      setFeedback({ type: 'error', text: err?.message || 'Failed to fetch site details.' });
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  // Load details for Edit Mode (API 6)
  useEffect(() => {
    if (!isEditMode || !editSiteIdParam) return;
    let mounted = true;
    setLoadingDetail(true);
    karnatakaSwpService
      .getUpdateInstallSite(Number(editSiteIdParam))
      .then((res) => {
        if (!mounted) return;
        const site = res.data?.site;
        if (!site) return;
        setSiteDetail(site);
        setSelectedSiteId(String(site.id || editSiteIdParam));
        setControllerNo(site.controller_no || '');
        setPumpNo(site.pump_no || '');
        setMotorNo(site.motor_no || '');
        setImeiNo(site.imei_no || '');
        setInstLatitude(site.inst_latitude || site.latitude || '');
        setInstLongitude(site.inst_longitude || site.longitude || '');
        setTehsil(site.f_tehsil || site.tehsil || '');
        setVillage(site.f_village || site.village || '');
        setPincode(site.f_pincode || site.pincode || '');
        setInstRemarks(site.inst_remarks || site.remark || '');

        // Module serials
        if (Array.isArray(site.module_serial_no)) {
          setModuleSerials(site.module_serial_no.length > 0 ? site.module_serial_no : ['']);
        } else if (typeof site.module_serial_no === 'string') {
          try {
            const parsed = JSON.parse(site.module_serial_no);
            if (Array.isArray(parsed) && parsed.length > 0) setModuleSerials(parsed);
          } catch {
            setModuleSerials([site.module_serial_no]);
          }
        }

        // Existing image previews
        if (site.module_image) setModuleImagePreview(resolveKarnatakaMediaUrl(site.module_image));
        if (site.controller_image) setControllerImagePreview(resolveKarnatakaMediaUrl(site.controller_image));
        if (site.structure_image) setStructureImagePreview(resolveKarnatakaMediaUrl(site.structure_image));
        if (site.running_water_image) setRunningWaterImagePreview(resolveKarnatakaMediaUrl(site.running_water_image));
        if (site.foundation_image) setFoundationImagePreview(resolveKarnatakaMediaUrl(site.foundation_image));
      })
      .catch((err) => {
        console.error('[Karnataka SWP Installation] getUpdateInstallSite error:', err);
        setFeedback({ type: 'error', text: err?.message || 'Failed to load installation for edit.' });
      })
      .finally(() => {
        if (mounted) setLoadingDetail(false);
      });
    return () => {
      mounted = false;
    };
  }, [isEditMode, editSiteIdParam]);

  // Handle Barcode Scanned
  const handleBarcodeScanned = (target: string, code: string) => {
    if (target === 'controller') setControllerNo(code);
    else if (target === 'pump') setPumpNo(code);
    else if (target === 'motor') setMotorNo(code);
    else if (target === 'imei') setImeiNo(code);
    else if (target.startsWith('module_')) {
      const idx = parseInt(target.replace('module_', ''), 10);
      if (!isNaN(idx)) {
        setModuleSerials((prev) => {
          const next = [...prev];
          next[idx] = code;
          return next;
        });
      }
    }
  };

  // Module serial row helpers
  const handleModuleSerialChange = (index: number, val: string) => {
    setModuleSerials((prev) => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  const addModuleSerial = () => {
    setModuleSerials((prev) => [...prev, '']);
  };

  const removeModuleSerial = (index: number) => {
    if (moduleSerials.length <= 1) {
      setModuleSerials(['']);
      return;
    }
    setModuleSerials((prev) => prev.filter((_, i) => i !== index));
  };

  // Auto-detect GPS
  const detectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setInstLatitude(pos.coords.latitude.toFixed(6));
        setInstLongitude(pos.coords.longitude.toFixed(6));
        setGettingLocation(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        alert('Could not retrieve GPS coordinates. Please ensure location permissions are enabled.');
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // Form Submit Handler (API 4 for Store, API 7 for Update)
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setFieldErrors({});

    const siteNumericId = Number(selectedSiteId);
    if (!siteNumericId) {
      setFeedback({ type: 'error', text: 'Please select an assigned installation site.' });
      scrollTo(sec1);
      return;
    }

    // Required image validation for new installations
    if (!isEditMode) {
      if (!moduleImage) {
        setFeedback({ type: 'error', text: 'Solar Module photograph is required.' });
        scrollTo(sec5);
        return;
      }
      if (!controllerImage) {
        setFeedback({ type: 'error', text: 'Controller photograph is required.' });
        scrollTo(sec5);
        return;
      }
      if (!structureImage) {
        setFeedback({ type: 'error', text: 'Structure photograph is required.' });
        scrollTo(sec5);
        return;
      }
      if (!runningWaterImage) {
        setFeedback({ type: 'error', text: 'Running Water photograph is required.' });
        scrollTo(sec5);
        return;
      }
    }

    const cleanSerials = moduleSerials.map((s) => s.trim()).filter(Boolean);
    if (cleanSerials.length === 0) {
      setFeedback({ type: 'error', text: 'Please enter at least one Solar Module serial number.' });
      scrollTo(sec3);
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('site_id', String(siteNumericId));
      formData.append('controller_no', controllerNo.trim());
      formData.append('pump_no', pumpNo.trim());
      formData.append('motor_no', motorNo.trim());
      formData.append('imei_no', imeiNo.trim());

      cleanSerials.forEach((sn) => {
        formData.append('module_serial_no[]', sn);
      });

      formData.append('inst_latitude', instLatitude.trim());
      formData.append('inst_longitude', instLongitude.trim());
      if (tehsil.trim()) formData.append('tehsil', tehsil.trim());
      if (village.trim()) formData.append('village', village.trim());
      if (pincode.trim()) formData.append('pincode', pincode.trim());
      if (instRemarks.trim()) formData.append('inst_remarks', instRemarks.trim());

      // Pass vendor name retrieved from session
      formData.append('vendor', loginVendorName);
      formData.append('vendor_name', loginVendorName);

      // Photos
      if (moduleImage) formData.append('module_image', moduleImage);
      if (controllerImage) formData.append('controller_image', controllerImage);
      if (structureImage) formData.append('structure_image', structureImage);
      if (runningWaterImage) formData.append('running_water_image', runningWaterImage);
      if (foundationImage) formData.append('foundation_image', foundationImage);

      let res;
      if (isEditMode) {
        formData.append('id', String(editSiteIdParam || siteNumericId));
        res = await karnatakaSwpService.updateInstStore(formData);
      } else {
        res = await karnatakaSwpService.installSiteStore(formData);
      }

      setFeedback({
        type: 'success',
        text: res.message || (isEditMode ? 'Site installation updated successfully!' : 'Site installed successfully!'),
      });

      setTimeout(() => {
        navigate('/v/karnataka/installation/swp/view');
      }, 1200);
    } catch (err: any) {
      console.error('[Karnataka SWP Installation] submit error:', err);
      if (err?.errors) {
        const errs: Record<string, string> = {};
        Object.entries(err.errors).forEach(([k, v]) => {
          errs[k] = Array.isArray(v) ? v.join(', ') : String(v);
        });
        setFieldErrors(errs);
      }
      setFeedback({
        type: 'error',
        text: err?.message || 'Failed to submit Karnataka SWP installation.',
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="solar-erp-page swp-inst-form">
      <style>{SINGLE_CARD_FORM_CSS}</style>

      {/* ── Page Head matching reference ── */}
      <PageHead
        title={isEditMode ? 'Edit Installation Details' : 'Install Karnataka SWP Site'}
        subtitle={
          isEditMode
            ? 'Update solar water pump equipment numbers, GPS coordinates, and verification photographs.'
            : 'Capture Solar Water Pump (SWP) equipment serials, GPS coordinates, and field verification photographs.'
        }
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Karnataka' },
          { label: 'Installation' },
          { label: 'SWP' },
          { label: isEditMode ? 'Edit Details' : 'Installation Site' },
        ]}
        actions={
          <Link to="/v/karnataka/installation/swp/view" className="ax-btn ax-btn--secondary ax-btn--sm">
            View Installed Sites
          </Link>
        }
      />

      {feedback && (
        <div className={`ax-alert ax-alert--${feedback.type}`} style={{ marginBottom: 'var(--ax-space-4)' }} role="alert">
          <div className="ax-alert__title">{feedback.type === 'success' ? 'Success' : 'Error'}</div>
          <div className="ax-alert__text">{feedback.text}</div>
          {fieldErrors.module_serial_no && (
            <div style={{ marginTop: 6, fontWeight: 600 }}>⚠️ {fieldErrors.module_serial_no}</div>
          )}
        </div>
      )}

      {/* ── Main Form Card ── */}
      <form onSubmit={handleSubmit} className="ax-card">
        {/* ── Header with Section Pills ── */}
        <div className="ax-card__header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h2 className="ax-card__title" style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                {isEditMode ? 'Edit Installation Details' : 'Solar Water Pump Installation Form'}
              </h2>
              <p className="ax-card__subtitle" style={{ fontSize: '0.85rem', color: 'var(--ax-text-muted, #64748b)', margin: '2px 0 0' }}>
                {isEditMode
                  ? 'Update existing solar pump equipment serials, GPS coordinates, and verification photographs.'
                  : 'Fill out installation serial numbers and upload site completion evidence for audit verification.'}
              </p>
            </div>
            {siteDetail && (
              <span className="ax-badge ax-badge--soft ax-badge--info" style={{ fontWeight: 600 }}>
                {siteDetail.f_farmer_name || siteDetail.farmer_name
                  ? `${siteDetail.f_farmer_name || siteDetail.farmer_name} (${siteDetail.district || siteDetail.f_district || 'Karnataka'})`
                  : `Site #${siteDetail.id}`}
              </span>
            )}
          </div>

          {/* Quick Nav Pills */}
          <div className="swp-section-pills" role="navigation" aria-label="Quick section navigation">
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
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  {isEditMode
                    ? 'Editing existing installation record'
                    : 'Choose from accepted solar water pump sites pending installation in Karnataka'}
                </span>
              </div>
            </div>

            <div className="ax-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <div className="ax-float">
                {isEditMode ? (
                  <>
                    <input
                      id="swp-select-site"
                      type="text"
                      className="ax-float__input"
                      value={`Site ${selectedSiteId} - ${siteDetail?.f_farmer_name || siteDetail?.farmer_name || 'Farmer'} (${siteDetail?.district || siteDetail?.f_district || 'Karnataka'})`}
                      disabled
                    />
                    <label htmlFor="swp-select-site" className="ax-float__label floating">
                      Installation Site
                    </label>
                  </>
                ) : (
                  <>
                    <select
                      id="swp-select-site"
                      className="ax-float__input"
                      value={selectedSiteId}
                      onChange={(e) => handleSiteSelect(e.target.value)}
                      disabled={loadingSites || submitting}
                      required
                    >
                      <option value="">-- Choose Assigned Site / Farmer Name --</option>
                      {sitesList.map((s) => (
                        <option key={s.id} value={String(s.id)}>
                          #{s.id} - {s.f_farmer_name || s.farmer_name || `Site ${s.id}`} ({s.district || s.f_district || 'Karnataka'})
                        </option>
                      ))}
                    </select>
                    <label htmlFor="swp-select-site" className="ax-float__label floating">
                      Assigned Site <span style={{ color: 'var(--ax-danger, #ef4444)' }}>*</span>
                    </label>
                  </>
                )}
              </div>
            </div>

            {!isEditMode && !loadingSites && sitesList.length === 0 && (
              <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 8, border: '1px solid var(--ax-border, #e2e8f0)', fontSize: 13, color: 'var(--ax-text-muted)' }}>
                ℹ️ No pending installation sites found. Please ensure you have accepted assigned site batches first in{' '}
                <Link to="/v/karnataka/installation/swp/request" style={{ color: '#2563eb', fontWeight: 600 }}>
                  Installation Requests
                </Link>.
              </div>
            )}

            {loadingDetail && (
              <div style={{ padding: '16px 0', color: '#2563eb', fontSize: '13px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="ax-spinner" /> Fetching site specifications & prefilled details...
              </div>
            )}
          </div>

          <hr className="swp-section-divider" />

          {/* ════════ Section 2: Beneficiary & Location Information ════════ */}
          <div ref={sec2} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>2. Beneficiary & Location Information</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Auto-populated official beneficiary and site record (Vendor Name retrieved from active login session)
                </span>
              </div>
            </div>

            <div className="ax-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              {/* Vendor Name is automatically populated from vendor login */}
              <FloatingInput
                label="Vendor Name"
                name="vendor"
                value={loginVendorName || siteDetail?.vendor_name || siteDetail?.vendor || ''}
                onChange={() => {}}
                disabled
              />
              <FloatingInput label="Farmer Name" name="farmer_name_prefill" value={siteDetail?.f_farmer_name || siteDetail?.farmer_name || ''} onChange={() => {}} disabled />
              <FloatingInput label="Father's Name" name="father_name_prefill" value={siteDetail?.f_father_name || siteDetail?.father_name || ''} onChange={() => {}} disabled />
              <FloatingInput label="Contact Number" name="contact_no_prefill" value={siteDetail?.f_contact || siteDetail?.f_contact_no || siteDetail?.contact_no || ''} onChange={() => {}} disabled />
              <FloatingInput label="State" name="state" value={siteDetail?.state || 'Karnataka'} onChange={() => {}} disabled />
              <FloatingInput label="District" name="district" value={siteDetail?.district || siteDetail?.f_district || ''} onChange={() => {}} disabled />
              <FloatingInput label="Block / Tehsil" name="block" value={siteDetail?.f_tehsil || siteDetail?.tehsil || ''} onChange={() => {}} disabled />
              <FloatingInput label="Village" name="village_prefill" value={siteDetail?.f_village || siteDetail?.village || ''} onChange={() => {}} disabled />
              <FloatingInput label="Application / Work Order No." name="app_no" value={siteDetail?.application_no || siteDetail?.app_no || siteDetail?.work_order_no || ''} onChange={() => {}} disabled />
              <FloatingInput label="Pump Capacity / HP" name="pump_capacity" value={siteDetail?.hp ? `${siteDetail.hp} HP` : siteDetail?.pump_capacity || ''} onChange={() => {}} disabled />
            </div>
          </div>

          <hr className="swp-section-divider" />

          {/* ════════ Section 3: Equipment & Serial Numbers ════════ */}
          <div ref={sec3} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>3. Equipment & Serial Numbers</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Scan barcode with camera or enter unique serial numbers for Controller, Pump, Motor, IMEI, and Solar Modules
                </span>
              </div>
            </div>

            <div className="ax-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              <FloatingInput
                label="Controller Number"
                name="controller_no"
                value={controllerNo}
                onChange={(e) => setControllerNo(e.target.value)}
                placeholder="Enter Controller Serial No"
                required
                onCameraClick={() => setScannerTarget('controller')}
              />

              <FloatingInput
                label="Pump Number"
                name="pump_no"
                value={pumpNo}
                onChange={(e) => setPumpNo(e.target.value)}
                placeholder="Enter Pump Serial No"
                required
                onCameraClick={() => setScannerTarget('pump')}
              />

              <FloatingInput
                label="Motor Number"
                name="motor_no"
                value={motorNo}
                onChange={(e) => setMotorNo(e.target.value)}
                placeholder="Enter Motor Serial No"
                required
                onCameraClick={() => setScannerTarget('motor')}
              />

              <FloatingInput
                label="IMEI Number"
                name="imei_no"
                value={imeiNo}
                onChange={(e) => setImeiNo(e.target.value)}
                placeholder="Enter RMS / IMEI Number"
                required
                onCameraClick={() => setScannerTarget('imei')}
              />
            </div>

            {/* Dynamic Solar Module Serial Numbers */}
            <div style={{ marginTop: 12, padding: 16, background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 10, border: '1px solid var(--ax-border, #cbd5e1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ax-text-strong, #1e293b)' }}>
                    Solar Module Serial Numbers (module_serial_no) <span style={{ color: 'var(--ax-danger, #ef4444)' }}>*</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ax-text-muted, #64748b)' }}>
                    Add all panel serial numbers installed on the structure
                  </div>
                </div>
                <button
                  type="button"
                  className="ax-btn ax-btn--secondary ax-btn--sm"
                  onClick={addModuleSerial}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}
                >
                  <span>+</span> Add Module Serial
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                {moduleSerials.map((serial, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'stretch', gap: 4 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <FloatingInput
                        label={`Module #${idx + 1} Serial`}
                        name={`module_serial_${idx}`}
                        value={serial}
                        onChange={(e) => handleModuleSerialChange(idx, e.target.value)}
                        placeholder={`Enter Module #${idx + 1}`}
                        required
                        onCameraClick={() => setScannerTarget(`module_${idx}`)}
                      />
                    </div>
                    {moduleSerials.length > 1 && (
                      <button
                        type="button"
                        className="ax-btn ax-btn--ghost"
                        onClick={() => removeModuleSerial(idx)}
                        title="Remove serial"
                        style={{ color: '#ef4444', padding: '0 10px', height: 46 }}
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

          {/* ════════ Section 4: Geolocation & Remarks ════════ */}
          <div ref={sec4} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>4. Geolocation & Site Remarks</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Confirm GPS coordinates, block / village, and installation remarks
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

            {/* GPS & Location Grid */}
            <div className="swp-gps-grid" style={{ marginBottom: 16 }}>
              <FloatingInput
                label="Installation Latitude"
                name="inst_latitude"
                value={instLatitude}
                onChange={(e) => setInstLatitude(e.target.value)}
                placeholder="e.g. 15.3173"
                required
              />
              <FloatingInput
                label="Installation Longitude"
                name="inst_longitude"
                value={instLongitude}
                onChange={(e) => setInstLongitude(e.target.value)}
                placeholder="e.g. 75.7139"
                required
              />
              <FloatingInput
                label="Tehsil / Taluk"
                name="tehsil"
                value={tehsil}
                onChange={(e) => setTehsil(e.target.value)}
                placeholder="Enter Tehsil"
              />
            </div>

            <div className="swp-gps-grid">
              <FloatingInput
                label="Village"
                name="village"
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                placeholder="Enter Village"
              />
              <FloatingInput
                label="Pincode"
                name="pincode"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                placeholder="Enter 6-digit Pincode"
              />
              <FloatingInput
                label="Installation Remarks"
                name="inst_remarks"
                value={instRemarks}
                onChange={(e) => setInstRemarks(e.target.value)}
                placeholder="Enter site execution remarks..."
              />
            </div>
          </div>

          <hr className="swp-section-divider" />

          {/* ════════ Section 5: Photo Uploads ════════ */}
          <div ref={sec5} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>5. Installation Photo Evidence</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Upload clear field photographs of installed solar module, controller, structure, and discharge water
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              <UploadDropzone
                id="module_image"
                label="Solar Module Array Photo"
                required={!isEditMode}
                file={moduleImage}
                preview={moduleImagePreview}
                onSelect={(f) => {
                  setModuleImage(f);
                  setModuleImagePreview(URL.createObjectURL(f));
                }}
                onRemove={() => {
                  setModuleImage(null);
                  setModuleImagePreview('');
                }}
              />

              <UploadDropzone
                id="controller_image"
                label="Pump Controller Photo"
                required={!isEditMode}
                file={controllerImage}
                preview={controllerImagePreview}
                onSelect={(f) => {
                  setControllerImage(f);
                  setControllerImagePreview(URL.createObjectURL(f));
                }}
                onRemove={() => {
                  setControllerImage(null);
                  setControllerImagePreview('');
                }}
              />

              <UploadDropzone
                id="structure_image"
                label="Structure & Foundation Photo"
                required={!isEditMode}
                file={structureImage}
                preview={structureImagePreview}
                onSelect={(f) => {
                  setStructureImage(f);
                  setStructureImagePreview(URL.createObjectURL(f));
                }}
                onRemove={() => {
                  setStructureImage(null);
                  setStructureImagePreview('');
                }}
              />

              <UploadDropzone
                id="running_water_image"
                label="Discharge / Running Water Photo"
                required={!isEditMode}
                file={runningWaterImage}
                preview={runningWaterImagePreview}
                onSelect={(f) => {
                  setRunningWaterImage(f);
                  setRunningWaterImagePreview(URL.createObjectURL(f));
                }}
                onRemove={() => {
                  setRunningWaterImage(null);
                  setRunningWaterImagePreview('');
                }}
              />

              <UploadDropzone
                id="foundation_image"
                label="Civil Foundation Photo (Optional)"
                required={false}
                file={foundationImage}
                preview={foundationImagePreview}
                onSelect={(f) => {
                  setFoundationImage(f);
                  setFoundationImagePreview(URL.createObjectURL(f));
                }}
                onRemove={() => {
                  setFoundationImage(null);
                  setFoundationImagePreview('');
                }}
              />
            </div>
          </div>

          {/* ════════ Submit Footer matching reference ════════ */}
          <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid var(--ax-border, #e2e8f0)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <Link to="/v/karnataka/installation/swp/view" className="ax-btn ax-btn--secondary">
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
                : 'Install & Submit Site'}
            </button>
          </div>
        </div>
      </form>

      {/* ── Camera Barcode Scanner Modal ── */}
      <CameraBarcodeScannerModal
        open={scannerTarget !== null}
        fieldName={scannerTarget || ''}
        fieldLabel={
          scannerTarget === 'controller'
            ? 'Controller Number'
            : scannerTarget === 'pump'
            ? 'Pump Number'
            : scannerTarget === 'motor'
            ? 'Motor Number'
            : scannerTarget === 'imei'
            ? 'IMEI / RMS Number'
            : scannerTarget?.startsWith('module_')
            ? `Module #${parseInt(scannerTarget.replace('module_', ''), 10) + 1} Serial`
            : 'Barcode'
        }
        onScan={(code: string) => handleBarcodeScanned(scannerTarget || '', code)}
        onClose={() => setScannerTarget(null)}
      />
    </div>
  );
}

export default KarnatakaInstallationSite;
