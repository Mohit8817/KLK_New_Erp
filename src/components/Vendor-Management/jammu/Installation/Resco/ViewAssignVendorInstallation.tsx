<<<<<<< HEAD
import React from 'react';
import RescoInstallSite from '../../../../V-Portal/jammu/Installation/Resco/RescoInstallSite';

/**
 * Super Admin - Jammu RESCO Assigned Vendor Installation Desk
 * Review vendor site installation submissions, solar inverter specs, and installation progress
 */
export const ViewAssignVendorInstallation: React.FC = () => {
  return <RescoInstallSite />;
=======
import { useState, useEffect, useRef, useMemo, useCallback, type FormEvent, type ChangeEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { authService } from '../../../../../services/authService';
import { useAuth } from '../../../../../context/AuthContext';
import {
  jammuRescoService,
  type JammuRescoSiteNameItem,
  type JammuRescoSiteDetail,
} from '../../../../V-Portal/jammu/jammu-services';
import { CameraBarcodeScannerModal } from '../../../../V-Portal/jammu/Installation/Resco/CameraBarcodeScannerModal';

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
              JPG, PNG or PDF (max 5 MB)
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

export const ViewAssignVendorInstallation: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, rawResponse } = useAuth();

  const paramSiteId = searchParams.get('id') || searchParams.get('site_id') || searchParams.get('resco_id');

  // Vendor name resolution
  const loginVendorName = useMemo(() => {
    const getCleanString = (val: any): string => {
      if (
        typeof val === 'string' &&
        val.trim() &&
        val.trim().toLowerCase() !== '[object object]' &&
        val.trim().toLowerCase() !== 'null' &&
        val.trim().toLowerCase() !== 'undefined' &&
        isNaN(Number(val.trim()))
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

    return 'App Testing';
  }, [user, rawResponse]);

  // Section 1: Dropdown sites list
  const [sitesList, setSitesList] = useState<JammuRescoSiteNameItem[]>([]);
  const [loadingSites, setLoadingSites] = useState(false);

  // Selected site and fetched specifications
  const [selectedSiteId, setSelectedSiteId] = useState<string>(paramSiteId || '');
  const [siteDetail, setSiteDetail] = useState<JammuRescoSiteDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Section 3: Fill this Form - User Manual Inputs
  const [vendorName, setVendorName] = useState<string>('App Testing');
  const [contactPerson, setContactPerson] = useState<string>('');
  const [contactNumber, setContactNumber] = useState<string>('');
  const [inverterNo, setInverterNo] = useState<string>('');
  const [solarMeterNo, setSolarMeterNo] = useState<string>('');
  const [nmSmNo, setNmSmNo] = useState<string>('');
  const [logerNo, setLogerNo] = useState<string>('');
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');

  // Panel Numbers array
  const [panelNos, setPanelNos] = useState<string[]>(['']);

  // Section 4: File Uploads
  const [files, setFiles] = useState<{
    system_image: File | null;
    inverter_image: File | null;
    panel_image: File | null;
    nmsm_image: File | null;
    loger_image: File | null;
  }>({
    system_image: null,
    inverter_image: null,
    panel_image: null,
    nmsm_image: null,
    loger_image: null,
  });

  const [previews, setPreviews] = useState<{
    system_image?: string;
    inverter_image?: string;
    panel_image?: string;
    nmsm_image?: string;
    loger_image?: string;
  }>({});

  // Barcode Scanner Modal State
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerTargetField, setScannerTargetField] = useState<{
    type: 'field' | 'panel';
    name?: string;
    index?: number;
    title: string;
  } | null>(null);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  useEffect(() => {
    if (!toastMsg) return;
    const t = window.setTimeout(() => setToastMsg(null), 4000);
    return () => window.clearTimeout(t);
  }, [toastMsg]);

  // Synchronize vendor name with logged in session
  useEffect(() => {
    if (loginVendorName && loginVendorName !== 'App Testing') {
      setVendorName(loginVendorName);
    }
  }, [loginVendorName]);

  // 1. Fetch dropdown sites list
  const loadSites = useCallback(async () => {
    setLoadingSites(true);
    try {
      const list = await jammuRescoService.getInstallableSiteNames();
      setSitesList(Array.isArray(list) ? list : []);
    } catch (err: any) {
      console.error('[Admin Vendor Installation] loadSites error:', err);
      setSitesList([]);
    } finally {
      setLoadingSites(false);
    }
  }, []);

  useEffect(() => {
    loadSites();
  }, [loadSites]);

  // 2. Fetch selected site details
  const loadSiteDetail = useCallback(async (siteId: string | number) => {
    if (!siteId) {
      setSiteDetail(null);
      return;
    }
    setLoadingDetail(true);
    try {
      const data = await jammuRescoService.getSiteDetails(siteId);
      setSiteDetail(data);

      if (data) {
        if (data.contact_person) setContactPerson(data.contact_person);
        if (data.contact_number) setContactNumber(data.contact_number);
        if (data.inst_vendor || data.vendor) {
          const v = String(data.inst_vendor || data.vendor).trim();
          if (v && isNaN(Number(v))) setVendorName(v);
        }
      }
    } catch (err: any) {
      console.error('[Admin Vendor Installation] loadSiteDetail error:', err);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    if (selectedSiteId) {
      loadSiteDetail(selectedSiteId);
    }
  }, [selectedSiteId, loadSiteDetail]);

  // Auto-fetch GPS Geolocation
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setToastMsg({ type: 'danger', text: 'Geolocation is not supported by your browser.' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
        setToastMsg({ type: 'success', text: 'Current GPS coordinates captured!' });
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setToastMsg({ type: 'danger', text: 'Could not access GPS. Please allow location permissions.' });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Barcode scanner trigger
  const handleOpenScanner = (target: { type: 'field' | 'panel'; name?: string; index?: number; title: string }) => {
    setScannerTargetField(target);
    setScannerOpen(true);
  };

  const handleBarcodeScanned = (scannedCode: string) => {
    if (!scannerTargetField) return;
    const clean = scannedCode.trim();

    if (scannerTargetField.type === 'field') {
      const fName = scannerTargetField.name;
      if (fName === 'inverter_no') setInverterNo(clean);
      else if (fName === 'solarmeter_no') setSolarMeterNo(clean);
      else if (fName === 'nm_sm_no') setNmSmNo(clean);
      else if (fName === 'loger_no') setLogerNo(clean);
    } else if (scannerTargetField.type === 'panel' && scannerTargetField.index !== undefined) {
      const idx = scannerTargetField.index;
      setPanelNos((prev) => {
        const next = [...prev];
        next[idx] = clean;
        return next;
      });
    }

    setToastMsg({ type: 'success', text: `Captured: ${clean}` });
    setScannerOpen(false);
  };

  // Dynamic Panel Serial Handlers
  const handlePanelChange = (idx: number, val: string) => {
    setPanelNos((prev) => {
      const copy = [...prev];
      copy[idx] = val;
      return copy;
    });
  };

  const handleAddPanel = () => {
    setPanelNos((prev) => [...prev, '']);
  };

  const handleRemovePanel = (idx: number) => {
    if (panelNos.length <= 1) {
      setPanelNos(['']);
      return;
    }
    setPanelNos((prev) => prev.filter((_, i) => i !== idx));
  };

  // File Handlers
  const handleFileSelect = (key: keyof typeof files, f: File) => {
    setFiles((prev) => ({ ...prev, [key]: f }));
    const objectUrl = URL.createObjectURL(f);
    setPreviews((prev) => {
      if (prev[key]) URL.revokeObjectURL(prev[key]!);
      return { ...prev, [key]: objectUrl };
    });
  };

  const handleFileRemove = (key: keyof typeof files) => {
    setFiles((prev) => ({ ...prev, [key]: null }));
    if (previews[key]) {
      URL.revokeObjectURL(previews[key]!);
      setPreviews((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  // Submit Handler
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!selectedSiteId) {
      setSubmitError('Please select a site from the dropdown list.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('site_id', selectedSiteId);
      fd.append('id', selectedSiteId);
      fd.append('vendor_name', vendorName);
      fd.append('contact_person', contactPerson);
      fd.append('contact_number', contactNumber);
      fd.append('inverter_no', inverterNo);
      fd.append('solarmeter_no', solarMeterNo);
      fd.append('nm_sm_no', nmSmNo);
      fd.append('loger_no', logerNo);
      fd.append('inst_latitude', latitude);
      fd.append('inst_longitude', longitude);
      fd.append('remarks', remarks);

      // Panel numbers array
      const validPanels = panelNos.map((p) => p.trim()).filter(Boolean);
      validPanels.forEach((p, idx) => {
        fd.append(`panel_no[${idx}]`, p);
      });

      // Files
      if (files.system_image) fd.append('system_image', files.system_image);
      if (files.inverter_image) fd.append('inverter_image', files.inverter_image);
      if (files.panel_image) fd.append('panel_image', files.panel_image);
      if (files.nmsm_image) fd.append('nmsm_image', files.nmsm_image);
      if (files.loger_image) fd.append('loger_image', files.loger_image);

      const res = await jammuRescoService.submitInstallation(fd);
      setToastMsg({
        type: 'success',
        text: res.message || 'Installation submission recorded successfully!',
      });

      // Clear & navigate after success
      setTimeout(() => {
        navigate('/vendor-management/jammu/installation/resco/verify-installation');
      }, 1500);
    } catch (err: any) {
      console.error('[Admin Vendor Installation] submit error:', err);
      setSubmitError(err?.message || 'Failed to submit installation record. Please check inputs.');
      setToastMsg({ type: 'danger', text: err?.message || 'Installation submission failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="solar-erp-page jammu-inst-form">
      <style>{SINGLE_CARD_FORM_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="Jammu RESCO - Assigned Vendor Installation Desk"
        subtitle="Submit and record vendor rooftop solar plant installations, equipment specifications, serial numbers, and geotagged evidence"
        breadcrumbs={[
          { label: 'Home', href: '/vendor-management' },
          { label: 'Jammu' },
          { label: 'Installation' },
          { label: 'RESCO' },
          { label: 'Vendor Installation' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2, 8px)' }}>
            <Link to="/vendor-management/jammu/installation/resco/view-assign-installation" className="ax-btn ax-btn--secondary ax-btn--sm">
              View Assigned
            </Link>
            <Link to="/vendor-management/jammu/installation/resco/verify-installation" className="ax-btn ax-btn--primary ax-btn--sm">
              Verify Installation
            </Link>
          </div>
        }
      />

      {toastMsg && (
        <div className={`ax-alert ax-alert--${toastMsg.type}`} style={{ marginBottom: 'var(--ax-space-4, 16px)' }} role="status">
          <div className="ax-alert__title">{toastMsg.type === 'success' ? 'Success' : 'Error'}</div>
          <div className="ax-alert__text">{toastMsg.text}</div>
        </div>
      )}

      {submitError && (
        <div className="ax-alert ax-alert--danger" style={{ marginBottom: 'var(--ax-space-4, 16px)' }} role="alert">
          <div className="ax-alert__title">Submission Failed</div>
          <div className="ax-alert__text">{submitError}</div>
        </div>
      )}

      {/* ── Main Unified Form Card ── */}
      <div className="ax-card">
        {/* Card Header & Section Navigation Pills */}
        <div className="ax-card__header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--ax-text-strong)' }}>
                Rooftop Solar Installation Form
              </h2>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>
                Fields marked with <span style={{ color: '#ef4444' }}>*</span> are required before plant verification
              </p>
            </div>
            {selectedSiteId && (
              <span className="ax-badge ax-badge--soft ax-badge--info">
                Active Site ID #{selectedSiteId}
              </span>
            )}
          </div>

          <div className="swp-section-pills" role="navigation" aria-label="Form Sections">
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo('sec-select-site')}>
              <span className="pill-num">1</span>
              <span>Select Site</span>
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo('sec-site-details')}>
              <span className="pill-num">2</span>
              <span>Site Details</span>
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo('sec-fill-form')}>
              <span className="pill-num">3</span>
              <span>Equipment Specs</span>
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo('sec-panel-serials')}>
              <span className="pill-num">4</span>
              <span>Solar Panels</span>
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo('sec-upload-photos')}>
              <span className="pill-num">5</span>
              <span>Evidence Photos</span>
            </button>
          </div>
        </div>

        {/* Card Body */}
        <div className="ax-card__body">
          <form onSubmit={handleSubmit} noValidate>
            {/* ── SECTION 1: Select Site ── */}
            <div id="sec-select-site" className="swp-section-block">
              <div className="swp-section-header">
                <div className="swp-section-title-wrap">
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--ax-text-strong)' }}>
                    Section 1: Site Selection
                  </h3>
                  <span style={{ fontSize: 12, color: 'var(--ax-text-muted)' }}>
                    Choose an assigned rooftop solar project from the active allocation queue
                  </span>
                </div>
              </div>

              <div style={{ maxWidth: 640 }}>
                <label
                  htmlFor="site-select-dropdown"
                  style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6, color: 'var(--ax-text-strong)' }}
                >
                  Select Site Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <select
                    id="site-select-dropdown"
                    className="ax-input"
                    style={{ height: 46, fontSize: 13.5, flex: 1 }}
                    value={selectedSiteId}
                    onChange={(e) => setSelectedSiteId(e.target.value)}
                    required
                    disabled={loadingSites}
                  >
                    <option value="">-- Choose Assigned Resco Site --</option>
                    {sitesList.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.site_name || `Site #${st.id}`} {st.district ? `(${st.district})` : ''}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="ax-btn ax-btn--secondary"
                    onClick={loadSites}
                    disabled={loadingSites}
                    title="Reload sites list"
                    style={{ height: 46, padding: '0 14px' }}
                  >
                    {loadingSites ? '…' : '↻ Refresh'}
                  </button>
                </div>
              </div>
            </div>

            <hr className="swp-section-divider" />

            {/* ── SECTION 2: Site Specifications (Auto-Populated) ── */}
            <div id="sec-site-details" className="swp-section-block">
              <div className="swp-section-header">
                <div className="swp-section-title-wrap">
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--ax-text-strong)' }}>
                    Section 2: Site Specifications & Allocation Details
                  </h3>
                  <span style={{ fontSize: 12, color: 'var(--ax-text-muted)' }}>
                    Auto-fetched technical specifications and contract parameters for the chosen site
                  </span>
                </div>
                {loadingDetail && (
                  <span style={{ fontSize: 12, color: '#2563eb', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <span className="ax-spinner" /> Fetching specifications…
                  </span>
                )}
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: 16,
                  background: 'var(--ax-surface-subtle, #f8fafc)',
                  padding: 18,
                  borderRadius: 12,
                  border: '1px solid var(--ax-border, #e2e8f0)',
                }}
              >
                <div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ax-text-muted)', textTransform: 'uppercase' }}>State</span>
                  <div style={{ fontSize: 13, fontWeight: 600, marginTop: 3 }}>
                    {siteDetail?.state || 'Jammu & Kashmir'}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ax-text-muted)', textTransform: 'uppercase' }}>District</span>
                  <div style={{ fontSize: 13, fontWeight: 600, marginTop: 3 }}>
                    {siteDetail?.district || '—'}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ax-text-muted)', textTransform: 'uppercase' }}>Capacity (kWp)</span>
                  <div style={{ fontSize: 13, fontWeight: 600, marginTop: 3, color: '#2563eb' }}>
                    {siteDetail?.capacity_kwp || siteDetail?.capacity || '—'} kWp
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ax-text-muted)', textTransform: 'uppercase' }}>Consumer CA No.</span>
                  <div style={{ fontSize: 13, fontWeight: 600, marginTop: 3 }}>
                    {siteDetail?.ca_no || siteDetail?.cano || '—'}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ax-text-muted)', textTransform: 'uppercase' }}>Department</span>
                  <div style={{ fontSize: 13, fontWeight: 600, marginTop: 3 }}>
                    {siteDetail?.department || '—'}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ax-text-muted)', textTransform: 'uppercase' }}>Discom</span>
                  <div style={{ fontSize: 13, fontWeight: 600, marginTop: 3 }}>
                    {siteDetail?.discom || 'JPDCL / KPDCL'}
                  </div>
                </div>
              </div>
            </div>

            <hr className="swp-section-divider" />

            {/* ── SECTION 3: Fill Installation Details ── */}
            <div id="sec-fill-form" className="swp-section-block">
              <div className="swp-section-header">
                <div className="swp-section-title-wrap">
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--ax-text-strong)' }}>
                    Section 3: Equipment Specifications & BOS
                  </h3>
                  <span style={{ fontSize: 12, color: 'var(--ax-text-muted)' }}>
                    Enter serial numbers for solar inverter, bidirectional net-meter, and data logger
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                <FloatingInput
                  label="Vendor Name"
                  name="vendor_name"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  required
                />

                <FloatingInput
                  label="Contact Person"
                  name="contact_person"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  required
                />

                <FloatingInput
                  label="Contact Number"
                  name="contact_number"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  type="tel"
                  required
                />

                <FloatingInput
                  label="Inverter Serial No."
                  name="inverter_no"
                  value={inverterNo}
                  onChange={(e) => setInverterNo(e.target.value)}
                  required
                  onCameraClick={() => handleOpenScanner({ type: 'field', name: 'inverter_no', title: 'Scan Inverter Serial No.' })}
                />

                <FloatingInput
                  label="Solar Generation Meter No."
                  name="solarmeter_no"
                  value={solarMeterNo}
                  onChange={(e) => setSolarMeterNo(e.target.value)}
                  required
                  onCameraClick={() => handleOpenScanner({ type: 'field', name: 'solarmeter_no', title: 'Scan Solar Meter No.' })}
                />

                <FloatingInput
                  label="Net / Smart Meter No."
                  name="nm_sm_no"
                  value={nmSmNo}
                  onChange={(e) => setNmSmNo(e.target.value)}
                  required
                  onCameraClick={() => handleOpenScanner({ type: 'field', name: 'nm_sm_no', title: 'Scan Net / Smart Meter No.' })}
                />

                <FloatingInput
                  label="RMS Data Logger No."
                  name="loger_no"
                  value={logerNo}
                  onChange={(e) => setLogerNo(e.target.value)}
                  onCameraClick={() => handleOpenScanner({ type: 'field', name: 'loger_no', title: 'Scan Data Logger No.' })}
                />
              </div>

              {/* Geotagging GPS Coordinates */}
              <div style={{ marginTop: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                    Geotagged Plant Coordinates
                  </label>
                  <button
                    type="button"
                    className="ax-btn ax-btn--secondary ax-btn--sm"
                    onClick={handleGetLocation}
                    style={{ fontSize: 11, padding: '0 10px', height: 28 }}
                  >
                    Locate GPS Coordinates
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                  <FloatingInput
                    label="Latitude"
                    name="inst_latitude"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    required
                    placeholder="e.g. 32.726601"
                  />

                  <FloatingInput
                    label="Longitude"
                    name="inst_longitude"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    required
                    placeholder="e.g. 74.857025"
                  />
                </div>
              </div>

              {/* Remarks */}
              <div style={{ marginTop: 16 }}>
                <FloatingInput
                  label="Installation Remarks / Notes"
                  name="remarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter plant commissioning notes, earthing pit status, etc."
                />
              </div>
            </div>

            <hr className="swp-section-divider" />

            {/* ── SECTION 4: Solar Panel Serial Numbers ── */}
            <div id="sec-panel-serials" className="swp-section-block">
              <div className="swp-section-header">
                <div className="swp-section-title-wrap">
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--ax-text-strong)' }}>
                    Section 4: Solar PV Module Serials
                  </h3>
                  <span style={{ fontSize: 12, color: 'var(--ax-text-muted)' }}>
                    Record barcode serial number for each solar module installed on the rooftop structure
                  </span>
                </div>
                <button
                  type="button"
                  className="ax-btn ax-btn--secondary ax-btn--sm"
                  onClick={handleAddPanel}
                  style={{ height: 30, fontSize: 12 }}
                >
                  + Add Next Module
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
                {panelNos.map((pVal, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FloatingInput
                      label={`Module #${idx + 1} Serial`}
                      name={`panel_no_${idx}`}
                      value={pVal}
                      onChange={(e) => handlePanelChange(idx, e.target.value)}
                      onCameraClick={() =>
                        handleOpenScanner({
                          type: 'panel',
                          index: idx,
                          title: `Scan Module #${idx + 1} Barcode`,
                        })
                      }
                    />
                    {panelNos.length > 1 && (
                      <button
                        type="button"
                        className="ax-btn ax-btn--ghost ax-btn--sm"
                        onClick={() => handleRemovePanel(idx)}
                        style={{ color: '#ef4444', height: 46, padding: '0 8px' }}
                        title="Remove module"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <hr className="swp-section-divider" />

            {/* ── SECTION 5: Upload Photos ── */}
            <div id="sec-upload-photos" className="swp-section-block">
              <div className="swp-section-header">
                <div className="swp-section-title-wrap">
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--ax-text-strong)' }}>
                    Section 5: Geotagged Installation Evidence Photos
                  </h3>
                  <span style={{ fontSize: 12, color: 'var(--ax-text-muted)' }}>
                    High-resolution photographs of solar modules, inverter, meters, and overall site layout
                  </span>
                </div>
              </div>

              <div className="jammu-upload-grid">
                <UploadDropzone
                  id="system-image"
                  label="Complete Rooftop Solar Plant"
                  required
                  file={files.system_image}
                  preview={previews.system_image}
                  onSelect={(f) => handleFileSelect('system_image', f)}
                  onRemove={() => handleFileRemove('system_image')}
                />

                <UploadDropzone
                  id="inverter-image"
                  label="Solar Inverter & Disconnect Switch"
                  required
                  file={files.inverter_image}
                  preview={previews.inverter_image}
                  onSelect={(f) => handleFileSelect('inverter_image', f)}
                  onRemove={() => handleFileRemove('inverter_image')}
                />

                <UploadDropzone
                  id="panel-image"
                  label="Solar PV Modules Array & Tilt"
                  required
                  file={files.panel_image}
                  preview={previews.panel_image}
                  onSelect={(f) => handleFileSelect('panel_image', f)}
                  onRemove={() => handleFileRemove('panel_image')}
                />

                <UploadDropzone
                  id="nmsm-image"
                  label="Bidirectional Net-Meter / Smart Meter"
                  required
                  file={files.nmsm_image}
                  preview={previews.nmsm_image}
                  onSelect={(f) => handleFileSelect('nmsm_image', f)}
                  onRemove={() => handleFileRemove('nmsm_image')}
                />

                <UploadDropzone
                  id="loger-image"
                  label="RMS Data Logger & Connectivity"
                  file={files.loger_image}
                  preview={previews.loger_image}
                  onSelect={(f) => handleFileSelect('loger_image', f)}
                  onRemove={() => handleFileRemove('loger_image')}
                />
              </div>
            </div>

            {/* ── Submit Actions ── */}
            <div
              style={{
                marginTop: 32,
                paddingTop: 20,
                borderTop: '1px solid var(--ax-border, #e2e8f0)',
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <button
                type="button"
                className="ax-btn ax-btn--secondary"
                onClick={() => navigate('/vendor-management/jammu/installation/resco/view-assign-installation')}
                disabled={submitting}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="ax-btn ax-btn--primary"
                disabled={submitting}
                style={{ minWidth: 160 }}
              >
                {submitting ? 'Submitting Installation…' : 'Submit Installation Record'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ── Barcode Scanner Camera Modal ── */}
      {scannerOpen && scannerTargetField && (
        <CameraBarcodeScannerModal
          title={scannerTargetField.title}
          onScan={handleBarcodeScanned}
          onClose={() => setScannerOpen(false)}
        />
      )}
    </div>
  );
>>>>>>> 1734fe6c6a1a76ca36492f9e29deed599b8f9488
};

export default ViewAssignVendorInstallation;
