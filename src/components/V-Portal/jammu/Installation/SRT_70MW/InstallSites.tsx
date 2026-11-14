import { useState, useEffect, useRef, useMemo, useCallback, type FormEvent, type ChangeEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { authService } from '../../../../../services/authService';
import { useAuth } from '../../../../../context/AuthContext';
import {
  jammuSrt70mwService,
  resolveJammuMediaUrl,
  type JammuInstallableSiteName,
  type JammuSrtSiteDetail,
} from '../../jammu-services';
import { CameraBarcodeScannerModal } from './CameraBarcodeScannerModal';

/* ───────── Unified Single-Card Layout matching Reference Design ───────── */
const SINGLE_CARD_FORM_CSS = `
.solar-erp-page {
  --asw-primary: #2559bf;
  --asw-primary-rgb: 37, 89, 191;
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
  border-color: #2559bf;
  color: #2559bf;
  background: color-mix(in srgb, #2559bf 6%, var(--ax-surface-solid, #ffffff));
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
  border-color: #2559bf;
  box-shadow: 0 0 0 3px color-mix(in srgb, #2559bf 20%, transparent);
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
  color: #2559bf;
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
            color: '#2559bf',
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
            ? '1.5px dashed #2559bf'
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

export function InstallSites() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, rawResponse } = useAuth();

  const paramSiteId = searchParams.get('srt_id') || searchParams.get('id') || searchParams.get('site_id');

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

    try {
      const sessionStr = sessionStorage.getItem('klk_user_session') || localStorage.getItem('klk_user_session');
      if (sessionStr) {
        const parsed = JSON.parse(sessionStr);
        const fromParsed =
          getCleanString(parsed?.vendor_name) ||
          getCleanString(parsed?.vendor) ||
          getCleanString(parsed?.name);
        if (fromParsed) return fromParsed;
      }
    } catch {}

    return '';
  }, [user, rawResponse]);

  // Section 1: Dropdown sites list (API 3)
  const [sitesList, setSitesList] = useState<JammuInstallableSiteName[]>([]);
  const [loadingSites, setLoadingSites] = useState(false);

  // Selected site and fetched specifications (API 4)
  const [selectedSiteId, setSelectedSiteId] = useState<string>(paramSiteId || '');
  const [siteDetail, setSiteDetail] = useState<JammuSrtSiteDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Section 3: Fill this Form - Technician Manual Inputs
  const [vendorName, setVendorName] = useState<string>('');
  const [contactPerson, setContactPerson] = useState<string>('');
  const [contactNumber, setContactNumber] = useState<string>('');
  const [inverterNo, setInverterNo] = useState<string>('');
  const [simNo, setSimNo] = useState<string>('');
  const [solarMeterNo, setSolarMeterNo] = useState<string>('');
  const [nmSmNo, setNmSmNo] = useState<string>('');
  const [logerNo, setLogerNo] = useState<string>('');
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');

  // Panel Numbers array: starts with Panel No 1
  const [panelNos, setPanelNos] = useState<string[]>(['']);

  // File Uploads
  const [panelImage, setPanelImage] = useState<File | null>(null);
  const [systemImage, setSystemImage] = useState<File | null>(null);
  const [inverterImage, setInverterImage] = useState<File | null>(null);
  const [nmSmImage, setNmSmImage] = useState<File | null>(null);
  const [logerImage, setLogerImage] = useState<File | null>(null);

  // File Previews
  const [panelPreview, setPanelPreview] = useState<string>('');
  const [systemPreview, setSystemPreview] = useState<string>('');
  const [inverterPreview, setInverterPreview] = useState<string>('');
  const [nmSmPreview, setNmSmPreview] = useState<string>('');
  const [logerPreview, setLogerPreview] = useState<string>('');

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
      const list = await jammuSrt70mwService.getInstallableSiteNames();
      setSitesList(Array.isArray(list) ? list : []);
    } catch (err: any) {
      console.error('[Jammu SRT InstallSites] fetchSiteNames error:', err);
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

  // 2. Load site details on site selection (API 4 & API 7)
  const handleSiteSelect = async (siteIdStr: string) => {
    setSelectedSiteId(siteIdStr);
    setSiteDetail(null);
    setFeedback(null);

    // Reset fields for fresh entry / prefill
    setContactPerson('');
    setContactNumber('');
    setInverterNo('');
    setSimNo('');
    setSolarMeterNo('');
    setNmSmNo('');
    setLogerNo('');
    setLatitude('');
    setLongitude('');
    setRemarks('');
    setPanelNos(['']);
    setPanelImage(null);
    setSystemImage(null);
    setInverterImage(null);
    setNmSmImage(null);
    setLogerImage(null);
    setPanelPreview('');
    setSystemPreview('');
    setInverterPreview('');
    setNmSmPreview('');
    setLogerPreview('');

    if (!siteIdStr) return;

    try {
      setLoadingDetail(true);
      const [det, editData] = await Promise.all([
        jammuSrt70mwService.getSiteDetail(siteIdStr).catch(() => null),
        jammuSrt70mwService.editInstallationLoad(siteIdStr).catch(() => null),
      ]);

      if (det || editData) {
        const merged: JammuSrtSiteDetail = {
          id: Number(siteIdStr),
          ...(det || {}),
          ...(editData || {}),
        } as any;
        setSiteDetail(merged);

        // Vendor name
        if (merged.vendor_name || merged.vendor) {
          setVendorName(String(merged.vendor_name || merged.vendor));
        } else if (loginVendorName) {
          setVendorName(loginVendorName);
        }

        // Auto-populate Contact Info if available
        if (merged.contact_person) setContactPerson(String(merged.contact_person));
        if (merged.contact_number || (merged as any).contact_no) {
          setContactNumber(String(merged.contact_number || (merged as any).contact_no));
        }

        // Auto-populate Equipment Serials (Must match dispatch material!)
        const inv = merged.inverter_no || (merged as any).inverter || (merged as any).inv_no || '';
        if (inv) setInverterNo(String(inv));

        const sim = merged.sim_no || (merged as any).sim || '';
        if (sim) setSimNo(String(sim));

        const sm = merged.solarmeter_no || (merged as any).solar_meter_no || (merged as any).solarmeter || '';
        if (sm) setSolarMeterNo(String(sm));

        const net = merged.nm_sm_no || (merged as any).netmeter_no || (merged as any).nm_sm || '';
        if (net) setNmSmNo(String(net));

        const log = merged.loger_no || (merged as any).rms_loger_no || (merged as any).logger_no || '';
        if (log) setLogerNo(String(log));

        // Auto-populate GPS coordinates if available
        const lat = merged.inst_latitude || (merged as any).latitude || '';
        if (lat) setLatitude(String(lat));

        const lng = merged.inst_longitude || (merged as any).longitude || '';
        if (lng) setLongitude(String(lng));

        // Auto-populate Remarks if available
        const rem = merged.inst_remarks || (merged as any).remarks || '';
        if (rem) setRemarks(String(rem));

        // Auto-populate Panel Numbers if available
        const rawPanels = merged.panel_no || (merged as any).panels || (merged as any).panel_nos;
        if (rawPanels) {
          let list: string[] = [];
          if (Array.isArray(rawPanels)) {
            list = rawPanels.map((p: any) => String(p).trim()).filter(Boolean);
          } else if (typeof rawPanels === 'string') {
            try {
              const parsed = JSON.parse(rawPanels);
              if (Array.isArray(parsed)) {
                list = parsed.map((p: any) => String(p).trim()).filter(Boolean);
              } else if (parsed) {
                list = [String(parsed).trim()];
              }
            } catch {
              list = rawPanels.split(',').map((p) => p.trim()).filter(Boolean);
            }
          }
          if (list.length > 0) {
            setPanelNos(list);
          }
        }
      } else {
        setFeedback({
          type: 'danger',
          text: `Site ${siteIdStr} details not found or not assigned to your vendor account.`,
        });
      }
    } catch (err: any) {
      console.error('[Jammu SRT InstallSites] fetchSiteDetail error:', err);
      setFeedback({ type: 'danger', text: err?.message || 'Failed to load site specifications from server.' });
    } finally {
      setLoadingDetail(false);
    }
  };

  // Auto-load paramSiteId if present in query string
  useEffect(() => {
    if (paramSiteId && !siteDetail) {
      handleSiteSelect(paramSiteId);
    }
  }, [paramSiteId]);

  // Panel array handlers
  const handleAddPanel = () => {
    setPanelNos((prev) => [...prev, '']);
  };

  const handleRemovePanel = (index: number) => {
    setPanelNos((prev) => {
      if (prev.length <= 1) return [''];
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
  };

  const handlePanelChange = (index: number, val: string) => {
    setPanelNos((prev) => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  // Barcode scanned callback
  const handleBarcodeScanned = (code: string) => {
    const clean = code.trim();
    if (!scannerTarget) return;

    if (scannerTarget === 'inverter') {
      setInverterNo(clean);
    } else if (scannerTarget === 'sim') {
      setSimNo(clean);
    } else if (scannerTarget === 'solarmeter') {
      setSolarMeterNo(clean);
    } else if (scannerTarget === 'nm_sm') {
      setNmSmNo(clean);
    } else if (scannerTarget === 'loger') {
      setLogerNo(clean);
    } else if (scannerTarget.startsWith('panel-')) {
      const index = parseInt(scannerTarget.replace('panel-', ''), 10);
      if (!isNaN(index)) {
        handlePanelChange(index, clean);
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

  // Form Submit Handler (API 5)
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const siteId = String(siteDetail?.srt_id || siteDetail?.site_id || siteDetail?.id || selectedSiteId || '').trim();
    if (!siteId) {
      setFeedback({ type: 'danger', text: 'Please select an assigned installation site first.' });
      scrollTo(sec1);
      return;
    }

    if (!vendorName.trim()) {
      setFeedback({ type: 'danger', text: 'Vendor Name is required.' });
      scrollTo(sec3);
      return;
    }

    if (!contactPerson.trim()) {
      setFeedback({ type: 'danger', text: 'Contact Person Name is required.' });
      scrollTo(sec3);
      return;
    }

    const cleanContact = contactNumber.replace(/\D/g, '').trim();
    if (cleanContact.length !== 10) {
      setFeedback({ type: 'danger', text: 'Contact Number must be exactly 10 digits.' });
      scrollTo(sec3);
      return;
    }

    if (!inverterNo.trim()) {
      setFeedback({ type: 'danger', text: 'Inverter Serial Number is required.' });
      scrollTo(sec3);
      return;
    }

    if (!simNo.trim()) {
      setFeedback({ type: 'danger', text: 'SIM Number is required.' });
      scrollTo(sec3);
      return;
    }

    if (!solarMeterNo.trim()) {
      setFeedback({ type: 'danger', text: 'Solar Meter Serial Number is required.' });
      scrollTo(sec3);
      return;
    }

    if (!nmSmNo.trim()) {
      setFeedback({ type: 'danger', text: 'Net Meter / Smart Meter Number is required.' });
      scrollTo(sec3);
      return;
    }

    if (!logerNo.trim()) {
      setFeedback({ type: 'danger', text: 'RMS Loger Number is required.' });
      scrollTo(sec3);
      return;
    }

    if (!latitude.trim() || !longitude.trim()) {
      setFeedback({ type: 'danger', text: 'Latitude and Longitude are required. Click "Auto-detect GPS" or enter coordinates.' });
      scrollTo(sec3);
      return;
    }

    // Panel 1 check
    if (!panelNos[0] || !panelNos[0].trim()) {
      setFeedback({ type: 'danger', text: 'Panel No 1 serial number is required.' });
      scrollTo(sec3);
      return;
    }

    // Mandatory Images validation
    if (!panelImage) {
      setFeedback({ type: 'danger', text: 'Panel Image is required.' });
      scrollTo(sec3);
      return;
    }
    if (!systemImage) {
      setFeedback({ type: 'danger', text: 'System Image is required.' });
      scrollTo(sec3);
      return;
    }
    if (!inverterImage) {
      setFeedback({ type: 'danger', text: 'Inverter Image is required.' });
      scrollTo(sec3);
      return;
    }
    if (!nmSmImage) {
      setFeedback({ type: 'danger', text: 'Net Meter / Smart Meter Image is required.' });
      scrollTo(sec3);
      return;
    }
    if (!logerImage) {
      setFeedback({ type: 'danger', text: 'Loger Image is required.' });
      scrollTo(sec3);
      return;
    }

    try {
      setSubmitting(true);
      setFeedback(null);

      const formData = new FormData();
      // Primary Site Identifiers
      formData.append('srt_id', siteId);
      formData.append('site_id', siteId);
      formData.append('id', siteId);
      formData.append('jammu_srt_id', siteId);

      // Metadata identifiers to satisfy any dispatch material lookup queries
      if (siteDetail?.site_name) formData.append('site_name', String(siteDetail.site_name).trim());
      if (siteDetail?.site_code) formData.append('site_code', String(siteDetail.site_code).trim());
      if (siteDetail?.ca_no) formData.append('ca_no', String(siteDetail.ca_no).trim());
      if (siteDetail?.wo_no) formData.append('wo_no', String(siteDetail.wo_no).trim());
      if (siteDetail?.uid) formData.append('uid', String(siteDetail.uid).trim());
      if (siteDetail?.state) formData.append('state', String(siteDetail.state).trim());
      if (siteDetail?.district) formData.append('district', String(siteDetail.district).trim());
      if (siteDetail?.dispatch_id) formData.append('dispatch_id', String(siteDetail.dispatch_id).trim());

      // Vendor Info
      formData.append('vendor', vendorName.trim());
      formData.append('vendor_name', vendorName.trim());

      // Contact Details
      formData.append('contact_person', contactPerson.trim());
      formData.append('contact_number', cleanContact);

      // Equipment Serial Numbers
      formData.append('inverter_no', inverterNo.trim());
      formData.append('sim_no', simNo.trim());
      formData.append('solarmeter_no', solarMeterNo.trim());
      formData.append('solar_meter_no', solarMeterNo.trim());
      formData.append('nm_sm_no', nmSmNo.trim());
      formData.append('netmeter_no', nmSmNo.trim());
      formData.append('loger_no', logerNo.trim());
      formData.append('rms_loger_no', logerNo.trim());
      formData.append('logger_no', logerNo.trim());

      // GPS Coordinates
      formData.append('inst_latitude', latitude.trim());
      formData.append('latitude', latitude.trim());
      formData.append('inst_longitude', longitude.trim());
      formData.append('longitude', longitude.trim());

      if (remarks.trim()) {
        formData.append('inst_remarks', remarks.trim());
        formData.append('remarks', remarks.trim());
      }

      // Append panel numbers: ONLY panel_no[] (without duplicate keys)
      const cleanPanels = panelNos.map((p) => p.trim()).filter(Boolean);
      cleanPanels.forEach((p) => {
        formData.append('panel_no[]', p);
      });

      // Append image files & standard aliases
      formData.append('panel_image', panelImage);
      formData.append('solar_panel_photo', panelImage);

      formData.append('system_image', systemImage);

      formData.append('inverter_image', inverterImage);
      formData.append('inverter_photo', inverterImage);

      formData.append('nm_sm_image', nmSmImage);
      formData.append('netmeter_photo', nmSmImage);

      formData.append('loger_image', logerImage);
      formData.append('loger_photo', logerImage);

      const res = await jammuSrt70mwService.installSiteStore(formData);

      setFeedback({
        type: 'success',
        text: res.message || 'Details Submitted Successfully! Site has been commissioned.',
      });

      // Update dropdown list
      setSitesList((prev) => prev.filter((s) => String(s.id) !== String(siteId)));

      setTimeout(() => {
        navigate('/v/jammu/installation/srt-70mw/installation-details');
      }, 1500);
    } catch (err: any) {
      console.error('[Jammu SRT InstallSites] submit error:', err);
      setFeedback({
        type: 'danger',
        text: err?.message || 'Failed to submit Jammu SRT 70MW installation details.',
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
        title="Jammu SRT 70MW - Install Sites"
        subtitle="Capture live solar rooftop installation execution data, serial numbers, geocoordinates, and verification photographs."
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Jammu & Kashmir' },
          { label: 'Installation' },
          { label: 'SRT 70MW' },
          { label: 'Install Sites' },
        ]}
        actions={
          <Link to="/v/jammu/installation/srt-70mw/installation-details" className="ax-btn ax-btn--secondary ax-btn--sm">
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
                Jammu SRT 70MW Installation Form
              </h2>
              <p className="ax-card__subtitle" style={{ fontSize: '0.85rem', color: 'var(--ax-text-muted, #64748b)', margin: '2px 0 0' }}>
                Fill out installation details and upload site completion evidence for department verification.
              </p>
            </div>
            {siteDetail && (
              <span className="ax-badge ax-badge--soft ax-badge--info" style={{ fontWeight: 600 }}>
                {siteDetail.site_name ? `${siteDetail.site_name} (${siteDetail.district || ''})` : `Site ${siteDetail.id}`}
              </span>
            )}
          </div>

          {/* Quick Nav Pills */}
          <div className="swp-section-pills" role="navigation" aria-label="Quick section navigation">
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec1)}>
              <span className="pill-num">1</span> Site Selection
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
          {/* ════════ Section 1: Site Selection ════════ */}
          <div ref={sec1} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>1. Select Installation Site</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Choose from accepted sites with material dispatched, pending installation in Jammu & Kashmir
                </span>
              </div>
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--sm"
                onClick={fetchSitesList}
                disabled={loadingSites}
                title="Refresh installable sites"
              >
                {loadingSites ? 'Refreshing...' : '🔄 Refresh Sites'}
              </button>
            </div>

            <div className="ax-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <div className="ax-float">
                <select
                  id="jammu-select-site"
                  className="ax-float__input"
                  value={selectedSiteId}
                  onChange={(e) => handleSiteSelect(e.target.value)}
                  disabled={loadingSites || submitting}
                  required
                >
                  <option value="">-- Select Assigned Site --</option>
                  {sitesList.map((s) => (
                    <option key={s.id} value={String(s.id)}>
                      {s.site_name} {s.district ? `(${s.district})` : ''}
                    </option>
                  ))}
                </select>
                <label htmlFor="jammu-select-site" className="ax-float__label floating">
                  Select Site <span style={{ color: 'var(--ax-danger, #ef4444)' }}>*</span>
                </label>
              </div>
            </div>

            {!loadingSites && sitesList.length === 0 && (
              <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 8, border: '1px solid var(--ax-border, #e2e8f0)', fontSize: 13, color: 'var(--ax-text-muted)' }}>
                ℹ️ No pending installation sites found. Please ensure you have accepted assigned site batches first in{' '}
                <Link to="/v/jammu/installation/srt-70mw/assign-site" style={{ color: '#2559bf', fontWeight: 600 }}>
                  Assigned Sites
                </Link>.
              </div>
            )}

            {loadingDetail && (
              <div style={{ padding: '16px 0', color: '#2559bf', fontSize: '13px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="ax-spinner" /> Fetching site specifications & prefilled details...
              </div>
            )}
          </div>

          <hr className="swp-section-divider" />

          {/* ════════ Section 2: Information (Read-only fetched data) ════════ */}
          <div ref={sec2} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>2. Information</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Auto-populated official site specifications, sanction load, work order, and material invoice (Read-only fetched details)
                </span>
              </div>
            </div>

            <div className="ax-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '16px' }}>
              <FloatingInput
                label="State"
                name="state_info"
                value={siteDetail?.state || (selectedSiteId ? 'Jammu & Kashmir' : '')}
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
                label="Department Name"
                name="dept_name_info"
                value={siteDetail?.dept_name || siteDetail?.department || ''}
                onChange={() => {}}
                disabled
              />

              <FloatingInput
                label="Site Name"
                name="site_name_info"
                value={siteDetail?.site_name || ''}
                onChange={() => {}}
                disabled
              />

              <FloatingInput
                label="Location"
                name="location_info"
                value={siteDetail?.location || ''}
                onChange={() => {}}
                disabled
              />

              <FloatingInput
                label="Firm Name"
                name="firm_name_info"
                value={siteDetail?.firm_name || ''}
                onChange={() => {}}
                disabled
              />

              <FloatingInput
                label="CA No."
                name="ca_no_info"
                value={siteDetail?.ca_no || ''}
                onChange={() => {}}
                disabled
              />

              <FloatingInput
                label="Sanction Load"
                name="sanction_load_info"
                value={siteDetail?.sanction_load != null ? `${siteDetail.sanction_load} kW` : ''}
                onChange={() => {}}
                disabled
              />

              <FloatingInput
                label="Plant SC"
                name="plant_sc_info"
                value={siteDetail?.plant_sc != null ? String(siteDetail.plant_sc) : ''}
                onChange={() => {}}
                disabled
              />

              <FloatingInput
                label="WO No."
                name="wo_no_info"
                value={siteDetail?.wo_no || ''}
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
                label="Vendor"
                name="vendor_info"
                value={siteDetail?.vendor_name || siteDetail?.vendor || loginVendorName || ''}
                onChange={() => {}}
                disabled
              />

              <FloatingInput
                label="Date"
                name="date_info"
                value={siteDetail?.date || siteDetail?.created_at ? new Date(siteDetail.date || siteDetail.created_at).toLocaleDateString('en-IN') : ''}
                onChange={() => {}}
                disabled
              />

              <FloatingInput
                label="Material Invoice Date"
                name="material_i_date_info"
                value={siteDetail?.material_i_date || ''}
                onChange={() => {}}
                disabled
              />

              {/* Material Bill Invoice with attachment link if available */}
              <div style={{ display: 'flex', alignItems: 'stretch', width: '100%' }}>
                <FloatingInput
                  label="Material Bill Invoice"
                  name="mb_invoice_info"
                  value={siteDetail?.mb_invoice ? String(siteDetail.mb_invoice) : (selectedSiteId ? 'Available on file' : '')}
                  onChange={() => {}}
                  disabled
                />
                {siteDetail?.mb_invoice && (
                  <a
                    href={resolveJammuMediaUrl(siteDetail.mb_invoice)}
                    target="_blank"
                    rel="noreferrer"
                    className="ax-btn ax-btn--secondary"
                    style={{
                      height: 46,
                      padding: '0 12px',
                      borderTopLeftRadius: 0,
                      borderBottomLeftRadius: 0,
                      borderLeft: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      color: '#2559bf',
                      fontWeight: 600,
                      fontSize: '12px',
                      flexShrink: 0,
                      background: 'var(--ax-surface-subtle, #f8fafc)',
                      borderColor: 'var(--ax-border, #cbd5e1)',
                      textDecoration: 'none',
                    }}
                    title="View Material Invoice Document"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                    <span>View</span>
                  </a>
                )}
              </div>
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

            {/* Sub-grid 1: Vendor & Contact Details */}
            <div style={{ marginBottom: 16 }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b', margin: '0 0 10px 0' }}>
                Vendor & Contact Details
              </h4>
              <div className="ax-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                <FloatingInput
                  label="Vendor"
                  name="vendor"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  placeholder="Enter Vendor Name"
                  required
                />

                <FloatingInput
                  label="Contact Person"
                  name="contact_person"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="Enter Contact Person Name"
                  required
                />

                <FloatingInput
                  label="Contact No."
                  name="contact_number"
                  type="tel"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="Enter 10-digit Mobile Number"
                  required
                />
              </div>
            </div>

            {/* Sub-grid 2: Equipment Serial Numbers with Barcode Scanners */}
            <div style={{ marginBottom: 16, marginTop: 24 }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b', margin: '0 0 10px 0' }}>
                Equipment Serial Numbers (Barcode Scan Enabled)
              </h4>
              <div className="ax-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                <FloatingInput
                  label="Inverter No"
                  name="inverter_no"
                  value={inverterNo}
                  onChange={(e) => setInverterNo(e.target.value)}
                  placeholder="Enter Inverter Serial Number"
                  required
                  onCameraClick={() => setScannerTarget('inverter')}
                />

                <FloatingInput
                  label="Sim No"
                  name="sim_no"
                  value={simNo}
                  onChange={(e) => setSimNo(e.target.value)}
                  placeholder="Enter SIM Card Number"
                  required
                  onCameraClick={() => setScannerTarget('sim')}
                />

                <FloatingInput
                  label="Solar Meter Number"
                  name="solarmeter_no"
                  value={solarMeterNo}
                  onChange={(e) => setSolarMeterNo(e.target.value)}
                  placeholder="Enter Solar Meter Number"
                  required
                  onCameraClick={() => setScannerTarget('solarmeter')}
                />

                <FloatingInput
                  label="Net Meter/Smart Meter Number"
                  name="nm_sm_no"
                  value={nmSmNo}
                  onChange={(e) => setNmSmNo(e.target.value)}
                  placeholder="Enter Net Meter / Smart Meter Number"
                  required
                  onCameraClick={() => setScannerTarget('nm_sm')}
                />

                <FloatingInput
                  label="RMS Loger Number"
                  name="loger_no"
                  value={logerNo}
                  onChange={(e) => setLogerNo(e.target.value)}
                  placeholder="Enter RMS Loger Serial Number"
                  required
                  onCameraClick={() => setScannerTarget('loger')}
                />
              </div>
            </div>

            {/* Sub-grid 3: Panel Numbers (Panel No 1 + Dynamic add/remove) */}
            <div style={{ marginBottom: 16, marginTop: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b', margin: 0 }}>
                  Solar Panel Serial Numbers ({panelNos.length} {panelNos.length === 1 ? 'Panel' : 'Panels'})
                </h4>
                <button
                  type="button"
                  className="ax-btn ax-btn--secondary ax-btn--xs"
                  onClick={handleAddPanel}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600 }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span>Add More Panels</span>
                </button>
              </div>

              <div className="ax-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                {panelNos.map((pVal, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'stretch', gap: 6, width: '100%' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <FloatingInput
                        label={`Panel No ${idx + 1}`}
                        name={`panel_no_${idx + 1}`}
                        value={pVal}
                        onChange={(e) => handlePanelChange(idx, e.target.value)}
                        placeholder={`Enter Panel ${idx + 1} Serial`}
                        required={idx === 0}
                        onCameraClick={() => setScannerTarget(`panel-${idx}`)}
                      />
                    </div>
                    {panelNos.length > 1 && (
                      <button
                        type="button"
                        className="ax-btn ax-btn--ghost ax-btn--sm"
                        onClick={() => handleRemovePanel(idx)}
                        title={`Remove Panel ${idx + 1}`}
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

            {/* Sub-grid 4: Geolocation Coordinates & Remarks */}
            <div style={{ marginBottom: 16, marginTop: 24 }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b', margin: '0 0 10px 0' }}>
                Site Geolocation & Remarks
              </h4>
              <div className="ax-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                <FloatingInput
                  label="Latitude"
                  name="latitude"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="e.g. 32.726600"
                  required
                />

                <FloatingInput
                  label="Longitude"
                  name="longitude"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="e.g. 74.857000"
                  required
                />

                <FloatingInput
                  label="Remarks"
                  name="remarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Installation comments or observations"
                />
              </div>
            </div>

            {/* Sub-grid 5: Upload Photos Dropzones */}
            <div style={{ marginTop: 24 }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b', margin: '0 0 6px 0' }}>
                Site Verification Photographs <span style={{ color: 'var(--ax-danger, #ef4444)' }}>*</span>
              </h4>
              <p style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)', margin: '0 0 14px 0' }}>
                Upload high-clarity site evidence photographs for department commissioning approval (JPG, PNG, PDF up to 5MB each).
              </p>

              <div className="jammu-upload-grid">
                <UploadDropzone
                  id="panel_image"
                  label="Panel Image"
                  required
                  file={panelImage}
                  preview={panelPreview}
                  onSelect={(f) => {
                    setPanelImage(f);
                    setPanelPreview(URL.createObjectURL(f));
                  }}
                  onRemove={() => {
                    setPanelImage(null);
                    setPanelPreview('');
                  }}
                />

                <UploadDropzone
                  id="system_image"
                  label="System Image"
                  required
                  file={systemImage}
                  preview={systemPreview}
                  onSelect={(f) => {
                    setSystemImage(f);
                    setSystemPreview(URL.createObjectURL(f));
                  }}
                  onRemove={() => {
                    setSystemImage(null);
                    setSystemPreview('');
                  }}
                />

                <UploadDropzone
                  id="inverter_image"
                  label="Inverter Image"
                  required
                  file={inverterImage}
                  preview={inverterPreview}
                  onSelect={(f) => {
                    setInverterImage(f);
                    setInverterPreview(URL.createObjectURL(f));
                  }}
                  onRemove={() => {
                    setInverterImage(null);
                    setInverterPreview('');
                  }}
                />

                <UploadDropzone
                  id="nm_sm_image"
                  label="Net Meter/Smart Meter Image"
                  required
                  file={nmSmImage}
                  preview={nmSmPreview}
                  onSelect={(f) => {
                    setNmSmImage(f);
                    setNmSmPreview(URL.createObjectURL(f));
                  }}
                  onRemove={() => {
                    setNmSmImage(null);
                    setNmSmPreview('');
                  }}
                />

                <UploadDropzone
                  id="loger_image"
                  label="Loger Image"
                  required
                  file={logerImage}
                  preview={logerPreview}
                  onSelect={(f) => {
                    setLogerImage(f);
                    setLogerPreview(URL.createObjectURL(f));
                  }}
                  onRemove={() => {
                    setLogerImage(null);
                    setLogerPreview('');
                  }}
                />
              </div>
            </div>
          </div>

          {/* ════════ Submit Footer ════════ */}
          <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid var(--ax-border, #e2e8f0)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <Link to="/v/jammu/installation/srt-70mw/installation-details" className="ax-btn ax-btn--secondary">
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
          scannerTarget === 'inverter'
            ? 'Inverter Serial Number'
            : scannerTarget === 'sim'
            ? 'SIM Card Number'
            : scannerTarget === 'solarmeter'
            ? 'Solar Meter Serial Number'
            : scannerTarget === 'nm_sm'
            ? 'Net Meter / Smart Meter Number'
            : scannerTarget === 'loger'
            ? 'RMS Loger Serial Number'
            : scannerTarget?.startsWith('panel-')
            ? `Panel No ${parseInt(scannerTarget.replace('panel-', ''), 10) + 1} Serial`
            : ''
        }
        onScan={handleBarcodeScanned}
        onClose={() => setScannerTarget(null)}
      />
    </div>
  );
}

export default InstallSites;


