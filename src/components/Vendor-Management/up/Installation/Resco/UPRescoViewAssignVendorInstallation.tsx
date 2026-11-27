import { useState, useEffect, useRef, type FormEvent, type ChangeEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  upRescoAdminService,
  type UpVendorItem,
  type UpRescoSiteRow,
} from '../../up-services';

// Unified Single-Card Layout with Floating Labels & Section Dividers (matching user reference)
const SINGLE_CARD_FORM_CSS = `
.swp-inst-form .ax-card {
  border: 1px solid var(--ax-border, #e2e8f0);
  border-radius: var(--ax-radius-xl, 16px);
  background: var(--ax-surface-solid, #ffffff);
  box-shadow: var(--ax-shadow-sm, 0 1px 3px 0 rgba(0, 0, 0, 0.1));
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
  color: var(--ax-text, #1e293b);
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
  border-top: 1px dashed var(--ax-border, #e2e8f0);
  margin: var(--ax-space-8, 32px) 0 var(--ax-space-6, 24px);
}

/* Floating Label Core */
.ax-float { position: relative; width: 100%; }
.ax-float__input {
  width: 100%;
  height: 46px;
  padding: 12px 14px 4px 14px;
  font-size: var(--ax-text-sm, 13px);
  background: var(--ax-surface-solid, #ffffff);
  border: 1px solid var(--ax-border, #cbd5e1);
  border-radius: var(--ax-radius-md, 8px);
  color: var(--ax-text, #0f172a);
  outline: none;
  transition: border-color var(--ax-motion-fast, 0.15s) var(--ax-ease-standard, ease),
              box-shadow var(--ax-motion-fast, 0.15s) var(--ax-ease-standard, ease);
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
  font-size: var(--ax-text-sm, 13px);
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
  font-weight: 600;
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
  onChange?: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  required?: boolean;
  disabled?: boolean;
  type?: string;
  placeholder?: string;
  min?: string | number;
  max?: string | number;
  step?: string | number;
}

function FloatingInput({ label, name, value, onChange, required, disabled, type = 'text', placeholder, min, max, step }: FloatingInputProps) {
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
        min={min}
        max={max}
        step={step}
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
  disabled?: boolean;
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
  disabled,
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
    if (disabled) return;
    onRemove();
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
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
        disabled={disabled}
        style={{ display: 'none' }}
        onChange={(e) => {
          if (disabled) return;
          const f = e.target.files?.[0];
          if (f) onSelect(f);
        }}
      />

      <div
        onClick={() => {
          if (!disabled) inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onMouseEnter={() => {
          if (!disabled) setIsHovered(true);
        }}
        onMouseLeave={() => setIsHovered(false)}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        style={{
          border: disabled
            ? '1.5px dashed #cbd5e1'
            : isDragging
            ? '1.5px dashed #2563eb'
            : error
            ? '1.5px dashed var(--ax-danger-500, #ef4444)'
            : isHovered
            ? '1.5px dashed #94a3b8'
            : '1.5px dashed #cbd5e1',
          borderRadius: 8,
          background: disabled
            ? 'var(--ax-surface-subtle, #f8fafc)'
            : isDragging
            ? '#eff6ff'
            : error
            ? '#fef2f2'
            : isHovered
            ? '#fbfcfd'
            : '#ffffff',
          opacity: disabled ? 0.75 : 1,
          padding: file || preview ? '12px 14px' : '20px 16px',
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
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong, #1e293b)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
              title="Remove file"
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
              Click to upload {label}
            </div>
            <div style={{ fontSize: 11, color: 'var(--ax-text-muted, #64748b)', marginTop: 2 }}>
              JPG, PNG, WEBP or PDF (Max 5 MB)
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

interface SrtRecordItem {
  id: number;
  site_name: string;
  inst_vendor?: number;
  [key: string]: any;
}

export function UPRescoViewAssignVendorInstallation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Master datasets
  const [vendors, setVendors] = useState<UpVendorItem[]>([]);
  const [srtRecords, setSrtRecords] = useState<SrtRecordItem[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [fetchingSiteDetail, setFetchingSiteDetail] = useState(false);
  const [siteDetail, setSiteDetail] = useState<UpRescoSiteRow | null>(null);

  // Status & Feedback
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 1. Site Feasibility Report Selection
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [selectedVendor, setSelectedVendor] = useState('');

  // 2. Technical Parameters & Serials ("Fill this Form")
  const [contactPerson, setContactPerson] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [inverterMake, setInverterMake] = useState('');
  const [panelMake, setPanelMake] = useState('');
  const [panelWp, setPanelWp] = useState('');
  const [panelQty, setPanelQty] = useState('');
  const [revisedLoad, setRevisedLoad] = useState('');
  const [solarMeterNo, setSolarMeterNo] = useState('');
  const [nmSmNo, setNmSmNo] = useState('');

  // Hardware Serials (Dynamic Repeaters with "+" to add more)
  const [inverters, setInverters] = useState<Array<{ no: string; kws: string }>>([{ no: '', kws: '' }]);
  const [loggers, setLoggers] = useState<string[]>(['']);
  const [panels, setPanels] = useState<string[]>(['']);

  // Inverter Repeater Handlers
  const handleAddInverter = () => {
    setInverters((prev) => [...prev, { no: '', kws: '' }]);
  };
  const handleRemoveInverter = (index: number) => {
    if (inverters.length <= 1) return;
    setInverters((prev) => prev.filter((_, i) => i !== index));
  };
  const handleInverterChange = (index: number, field: 'no' | 'kws', val: string) => {
    setInverters((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  // Logger Repeater Handlers
  const handleAddLogger = () => {
    setLoggers((prev) => [...prev, '']);
  };
  const handleRemoveLogger = (index: number) => {
    if (loggers.length <= 1) return;
    setLoggers((prev) => prev.filter((_, i) => i !== index));
  };
  const handleLoggerChange = (index: number, val: string) => {
    setLoggers((prev) => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  };

  // Panel Repeater Handlers
  const handleAddPanel = () => {
    setPanels((prev) => [...prev, '']);
  };
  const handleRemovePanel = (index: number) => {
    if (panels.length <= 1) return;
    setPanels((prev) => prev.filter((_, i) => i !== index));
  };
  const handlePanelChange = (index: number, val: string) => {
    setPanels((prev) => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  };

  // 3. Location & GPS
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [gettingLocation, setGettingLocation] = useState(false);
  const [remarks, setRemarks] = useState('');

  // 4. Photos
  const [panelImage, setPanelImage] = useState<File | null>(null);
  const [panelPreview, setPanelPreview] = useState<string | undefined>(undefined);

  const [systemImage, setSystemImage] = useState<File | null>(null);
  const [systemPreview, setSystemPreview] = useState<string | undefined>(undefined);

  const [inverterImage, setInverterImage] = useState<File | null>(null);
  const [inverterPreview, setInverterPreview] = useState<string | undefined>(undefined);

  const [nmSmImage, setNmSmImage] = useState<File | null>(null);
  const [nmSmPreview, setNmSmPreview] = useState<string | undefined>(undefined);

  const [loggerImage, setLoggerImage] = useState<File | null>(null);
  const [loggerPreview, setLoggerPreview] = useState<string | undefined>(undefined);

  // Section refs for navigation pills
  const sec1 = useRef<HTMLDivElement>(null);
  const sec2 = useRef<HTMLDivElement>(null);
  const sec3 = useRef<HTMLDivElement>(null);
  const sec4 = useRef<HTMLDivElement>(null);

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // 1. Initial Load: Fetch Desk Vendors and Assigned Sites
  useEffect(() => {
    let active = true;
    const loadDeskData = async () => {
      setInitialLoading(true);
      setErrorMsg('');
      try {
        const res = await upRescoAdminService.getViewAssignVendor();
        if (!active) return;
        const vList = res.vendors || [];
        const sList = res.srtRecords || [];
        setVendors(vList);
        setSrtRecords(sList);

        // By default no site is auto-selected; user must manually pick from dropdown ("by default koi site nahi aayegi, select karni hogi")
        // No automatic site selection on page load.
      } catch (err: any) {
        if (!active) return;
        console.error('Initial load error:', err);
        setErrorMsg(err?.message || 'Failed to fetch assigned vendor and site records.');
      } finally {
        if (active) setInitialLoading(false);
      }
    };
    loadDeskData();
    return () => {
      active = false;
    };
  }, [searchParams]);

  // 2. Site Selection -> Instantly auto-select vendor by inst_vendor, fetch details
  const handleSiteSelect = async (siteId: string) => {
    setSelectedSiteId(siteId);
    setSiteDetail(null);
    if (!siteId) {
      setSelectedVendor('');
      return;
    }

    // Instantly auto-select vendor by inst_vendor from srtRecords
    const matchingRecord = srtRecords.find((s) => String(s.id) === String(siteId));
    if (matchingRecord && matchingRecord.inst_vendor != null) {
      setSelectedVendor(String(matchingRecord.inst_vendor));
    }

    setFetchingSiteDetail(true);
    try {
      const detail = await upRescoAdminService.fetchSiteDetail(siteId);
      setSiteDetail(detail);

      // If detail has inst_vendor, ensure it is selected
      if (detail && detail.inst_vendor != null) {
        setSelectedVendor(String(detail.inst_vendor));
      }

      // Pre-fill revised load from sanction load if empty
      if (detail?.sanction_load && !revisedLoad) {
        setRevisedLoad(String(detail.sanction_load));
      } else if (detail?.plant_sc && !revisedLoad) {
        setRevisedLoad(String(detail.plant_sc));
      }
    } catch (err: any) {
      console.error('Failed to load site detail:', err);
    } finally {
      setFetchingSiteDetail(false);
    }
  };

  // GPS Geolocation Handler
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser.');
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
        setErrorMsg(`Unable to retrieve GPS coordinates: ${err.message}`);
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleResetForm = () => {
    setSelectedSiteId('');
    setSelectedVendor('');
    setSiteDetail(null);
    setContactPerson('');
    setContactNumber('');
    setInverterMake('');
    setPanelMake('');
    setPanelWp('');
    setPanelQty('');
    setRevisedLoad('');
    setSolarMeterNo('');
    setNmSmNo('');
    setInverters([{ no: '', kws: '' }]);
    setLoggers(['']);
    setPanels(['']);
    setLatitude('');
    setLongitude('');
    setRemarks('');
    setPanelImage(null);
    setPanelPreview(undefined);
    setSystemImage(null);
    setSystemPreview(undefined);
    setInverterImage(null);
    setInverterPreview(undefined);
    setNmSmImage(null);
    setNmSmPreview(undefined);
    setLoggerImage(null);
    setLoggerPreview(undefined);
  };

  // Submit Handler
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedSiteId) return setErrorMsg('Please select a Site.');
    if (!selectedVendor) return setErrorMsg('Please select a Vendor.');
    if (!contactPerson.trim()) return setErrorMsg('Contact Person is required.');
    if (!contactNumber.trim()) return setErrorMsg('Contact No. is required.');
    if (!inverterMake.trim()) return setErrorMsg('Inverter Make is required.');
    if (!panelMake.trim()) return setErrorMsg('Panel Make is required.');
    if (!panelWp.trim()) return setErrorMsg('Panel Wp is required.');
    if (!panelQty.trim()) return setErrorMsg('Panel Qty is required.');
    if (!revisedLoad.trim()) return setErrorMsg('Revised Load is required.');
    if (!solarMeterNo.trim()) return setErrorMsg('Solar Meter Number is required.');
    if (!nmSmNo.trim()) return setErrorMsg('Net Meter / Smart Meter Number is required.');
    if (!inverters[0]?.no.trim()) return setErrorMsg('Inverter No. 1 is required.');
    if (!loggers[0]?.trim()) return setErrorMsg('Loger No. 1 is required.');
    if (!panels[0]?.trim()) return setErrorMsg('Panel No. 1 is required.');
    if (!latitude || !longitude) return setErrorMsg('Latitude and Longitude GPS coordinates are required.');

    if (!panelImage || !systemImage || !inverterImage || !nmSmImage || !loggerImage) {
      return setErrorMsg('All 5 mandatory installation photos (Panel, System, Inverter, Net Meter, and Loger) must be uploaded.');
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('site_name', selectedSiteId);
      formData.append('site_id', selectedSiteId);
      formData.append('vendor', selectedVendor);
      formData.append('inst_vendor', selectedVendor);
      formData.append('contact_person', contactPerson.trim());
      formData.append('contact_number', contactNumber.trim());

      formData.append('inverter_make', inverterMake.trim());
      formData.append('panel_make', panelMake.trim());
      formData.append('panel_wp', panelWp.trim());
      formData.append('panel_qty', panelQty.trim());
      formData.append('revised_load', revisedLoad.trim());

      formData.append('solarmeter_no', solarMeterNo.trim());
      formData.append('solar_meter_number', solarMeterNo.trim());
      formData.append('nm_sm_no', nmSmNo.trim());
      formData.append('net_meter_number', nmSmNo.trim());

      // Inverters (Repeaters + Primary fields)
      inverters.forEach((inv, idx) => {
        const num = idx + 1;
        if (inv.no.trim()) {
          formData.append(`inverter_no_${num}`, inv.no.trim());
          formData.append(`inverter_no[${idx}]`, inv.no.trim());
          formData.append('inverter_no[]', inv.no.trim());
          if (inv.kws.trim()) {
            formData.append(`inverter_kws_${num}`, inv.kws.trim());
            formData.append(`kws_${num}`, inv.kws.trim());
            formData.append(`inverter_kws[${idx}]`, inv.kws.trim());
            formData.append('kws[]', inv.kws.trim());
          }
        }
      });
      if (inverters[0]?.no.trim()) {
        formData.append('inverter_no', inverters[0].no.trim());
        formData.append('inverter_no_1', inverters[0].no.trim());
        if (inverters[0].kws.trim()) {
          formData.append('kws', inverters[0].kws.trim());
          formData.append('inverter_kws', inverters[0].kws.trim());
        }
      }

      // Loggers (Repeaters + Primary fields)
      loggers.forEach((log, idx) => {
        const num = idx + 1;
        if (log.trim()) {
          formData.append(`loger_no_${num}`, log.trim());
          formData.append(`loger_no[${idx}]`, log.trim());
          formData.append('loger_no[]', log.trim());
        }
      });
      if (loggers[0]?.trim()) {
        formData.append('loger_no', loggers[0].trim());
        formData.append('loger_no_1', loggers[0].trim());
      }

      // Panels (Repeaters + Primary fields)
      panels.forEach((p, idx) => {
        const num = idx + 1;
        if (p.trim()) {
          formData.append(`panel_no_${num}`, p.trim());
          formData.append(`panel_no[${idx}]`, p.trim());
          formData.append('panel_no[]', p.trim());
        }
      });
      if (panels[0]?.trim()) {
        formData.append('panel_no', panels[0].trim());
        formData.append('panel_no_1', panels[0].trim());
      }

      formData.append('inst_latitude', latitude.trim());
      formData.append('latitude', latitude.trim());
      formData.append('inst_longitude', longitude.trim());
      formData.append('longitude', longitude.trim());

      if (remarks.trim()) {
        formData.append('inst_remarks', remarks.trim());
        formData.append('remarks', remarks.trim());
      }

      formData.append('panel_image', panelImage);
      formData.append('system_image', systemImage);
      formData.append('inverter_image', inverterImage);
      formData.append('nm_sm_image', nmSmImage);
      formData.append('loger_image', loggerImage);

      const res = await upRescoAdminService.installStore(formData);
      setSuccessMsg(res.message || 'UP Resco Installation Data Submitted Successfully!');
      handleResetForm();

      setTimeout(() => {
        navigate('/vendor-management/up/resco/installation/dashboard');
      }, 1500);
    } catch (err: any) {
      console.error('Submit install error:', err);
      setErrorMsg(err?.message || 'Failed to submit UP Resco installation data.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ax-page swp-inst-form">
      <style>{SINGLE_CARD_FORM_CSS}</style>

      {/* Page Head */}
      <PageHead
        title="UP Resco Assigned Vendor Installation Desk"
        subtitle="Submit rooftop solar installation commissioning data, serial numbers, equipment specifications, and site photos"
        breadcrumbs={[
          { label: 'ERP Dashboard', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Uttar Pradesh', href: '/vendor-management/up' },
          { label: 'Resco Installation', href: '/vendor-management/up/resco/installation/dashboard' },
          { label: 'Vendor Installation Desk' },
        ]}
        actions={
          <Link
            to="/vendor-management/up/resco/installation/view-assign"
            className="ax-btn ax-btn--primary ax-btn--sm"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ marginRight: 6 }}
            >
              <path d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
              <path d="M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6" />
            </svg>
            View Assigned Installations
          </Link>
        }
      />

      {/* Status Feedback Banners */}
      {errorMsg && (
        <div
          style={{
            padding: '12px 16px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>✕ {errorMsg}</span>
          <button
            type="button"
            onClick={() => setErrorMsg('')}
            style={{ background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer', fontSize: 16 }}
          >
            ×
          </button>
        </div>
      )}

      {successMsg && (
        <div
          style={{
            padding: '12px 16px',
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#065f46',
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>✓ {successMsg}</span>
          <span style={{ fontSize: 12, opacity: 0.8 }}>Redirecting...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="ax-card">
        {/* Header with Quick Nav Pills */}
        <div className="ax-card__header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h2 className="ax-card__title" style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--ax-text-strong, #0f172a)' }}>
                UP Resco Assigned Site Vendor Data
              </h2>
              <p className="ax-card__subtitle" style={{ fontSize: '0.85rem', color: '#2563eb', margin: '4px 0 0' }}>
                The field labels marked with * are required input fields.
              </p>
            </div>
            {siteDetail && (
              <span className="ax-badge ax-badge--soft ax-badge--info" style={{ fontWeight: 600, padding: '4px 12px', fontSize: 12 }}>
                Site: {siteDetail.site_name} (ID #{siteDetail.id})
              </span>
            )}
          </div>

          {/* Quick Nav Pills */}
          <div className="swp-section-pills">
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec1)}>
              <span className="pill-num">1</span> Site & Vendor
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec2)}>
              <span className="pill-num">2</span> General Information
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec3)}>
              <span className="pill-num">3</span> Equipment & Serials
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec4)}>
              <span className="pill-num">4</span> Location & Photos
            </button>
          </div>
        </div>

        <div className="ax-card__body">
          {/* Section 1: Site Feasibility Report */}
          <div ref={sec1} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
                  1. Site Feasibility Report
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Select the surveyed site and assigned partner vendor
                </span>
              </div>
            </div>

            <div className="ax-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {/* Select Site * */}
              <div className="ax-float">
                <select
                  id="site_select"
                  className="ax-float__input"
                  value={selectedSiteId}
                  onChange={(e) => handleSiteSelect(e.target.value)}
                  disabled={initialLoading || submitting}
                  required
                >
                  <option value="">-- Select Site --</option>
                  {srtRecords.map((s) => (
                    <option key={s.id} value={String(s.id)}>
                      {s.site_name} (ID: {s.id})
                    </option>
                  ))}
                </select>
                <label htmlFor="site_select" className="ax-float__label floating">
                  Select Site <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              {/* Select Vendor * */}
              <div className="ax-float">
                <select
                  id="vendor_select"
                  className="ax-float__input"
                  value={selectedVendor}
                  onChange={(e) => setSelectedVendor(e.target.value)}
                  disabled={initialLoading || submitting}
                  required
                >
                  <option value="">-- Vendor --</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={String(v.id)}>
                      {v.name} (ID: {v.id})
                    </option>
                  ))}
                  {selectedVendor && !vendors.some((v) => String(v.id) === String(selectedVendor)) && (
                    <option value={selectedVendor}>Vendor ID #{selectedVendor}</option>
                  )}
                </select>
                <label htmlFor="vendor_select" className="ax-float__label floating">
                  Select Vendor <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>
            </div>

            {fetchingSiteDetail && (
              <div style={{ padding: '14px', marginTop: 12, textAlign: 'center', color: '#2563eb', fontSize: 13 }}>
                <span className="ax-spinner" style={{ marginRight: 8 }} />
                Loading site details and specifications...
              </div>
            )}
          </div>

          <hr className="swp-section-divider" />

          {/* Section 2: General Information */}
          <div ref={sec2} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
                  2. General Information
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Auto-populated location, department, and site identification details
                </span>
              </div>
              {siteDetail && (
                <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>
                  ✓ Site details loaded
                </span>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <FloatingInput
                label="Unique ID"
                name="gen_unique_id"
                value={String(siteDetail?.unique_id || '')}
                disabled
                placeholder="Auto-populated"
              />
              <FloatingInput
                label="State"
                name="gen_state"
                value={siteDetail?.state || 'Uttar Pradesh'}
                disabled
                placeholder="Uttar Pradesh"
              />
              <FloatingInput
                label="District"
                name="gen_district"
                value={siteDetail?.district || ''}
                disabled
                placeholder="Auto-populated"
              />
              <FloatingInput
                label="Division"
                name="gen_division"
                value={siteDetail?.division || ''}
                disabled
                placeholder="Auto-populated"
              />
              <FloatingInput
                label="Sub Division"
                name="gen_sub_division"
                value={siteDetail?.sub_division || ''}
                disabled
                placeholder="Auto-populated"
              />
              <FloatingInput
                label="Department"
                name="gen_department"
                value={siteDetail?.dept_name || ''}
                disabled
                placeholder="Auto-populated"
              />
              <FloatingInput
                label="Site Name"
                name="gen_site_name"
                value={siteDetail?.site_name || ''}
                disabled
                placeholder="Auto-populated"
              />
              <FloatingInput
                label="Location"
                name="gen_location"
                value={siteDetail?.address || siteDetail?.location || ''}
                disabled
                placeholder="Auto-populated"
              />
              <FloatingInput
                label="CA No."
                name="gen_ca_no"
                value={siteDetail?.ca_no || ''}
                disabled
                placeholder="Auto-populated"
              />
            </div>
          </div>

          <hr className="swp-section-divider" />

          {/* Section 3: Fill this Form — Technical Specifications & Serials */}
          <div ref={sec3} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
                  3. Fill this Form — Equipment Specifications & Serials
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Enter contractor details, inverter, panel ratings, meter numbers, and hardware serials
                </span>
              </div>
            </div>

            {/* Row A: Vendor & Contact Details */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: 16 }}>
              {/* Vendor * */}
              <div className="ax-float">
                <select
                  id="form_vendor"
                  className="ax-float__input"
                  value={selectedVendor}
                  onChange={(e) => setSelectedVendor(e.target.value)}
                  disabled={submitting}
                  required
                >
                  <option value="">-- Select Vendor --</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={String(v.id)}>
                      {v.name} (ID: {v.id})
                    </option>
                  ))}
                  {selectedVendor && !vendors.some((v) => String(v.id) === String(selectedVendor)) && (
                    <option value={selectedVendor}>Vendor ID #{selectedVendor}</option>
                  )}
                </select>
                <label htmlFor="form_vendor" className="ax-float__label floating">
                  Vendor <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              {/* Contact Person * */}
              <FloatingInput
                label="Contact Person"
                name="contact_person"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                required
                disabled={submitting}
                placeholder="Site representative name"
              />

              {/* Contact No. * */}
              <FloatingInput
                label="Contact No."
                name="contact_number"
                type="tel"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                required
                disabled={submitting}
                placeholder="10-digit mobile number"
              />
            </div>

            {/* Row B: Equipment Makes & Ratings */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: 16 }}>
              {/* Inverter Make * */}
              <FloatingInput
                label="Inverter Make"
                name="inverter_make"
                value={inverterMake}
                onChange={(e) => setInverterMake(e.target.value)}
                required
                disabled={submitting}
                placeholder="e.g. Growatt, Sungrow"
              />

              {/* Panel Make * */}
              <FloatingInput
                label="Panel Make"
                name="panel_make"
                value={panelMake}
                onChange={(e) => setPanelMake(e.target.value)}
                required
                disabled={submitting}
                placeholder="e.g. Waaree, Vikram"
              />

              {/* Panel Wp * */}
              <FloatingInput
                label="Panel Wp"
                name="panel_wp"
                type="number"
                step="any"
                value={panelWp}
                onChange={(e) => setPanelWp(e.target.value)}
                required
                disabled={submitting}
                placeholder="e.g. 545"
              />

              {/* Panel Qty * */}
              <FloatingInput
                label="Panel Qty"
                name="panel_qty"
                type="number"
                min="1"
                value={panelQty}
                onChange={(e) => setPanelQty(e.target.value)}
                required
                disabled={submitting}
                placeholder="e.g. 24"
              />

              {/* Revised Load * */}
              <FloatingInput
                label="Revised Load"
                name="revised_load"
                type="number"
                step="any"
                value={revisedLoad}
                onChange={(e) => setRevisedLoad(e.target.value)}
                required
                disabled={submitting}
                placeholder="kW"
              />
            </div>

            {/* Row C: Meter Numbers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: 16 }}>
              {/* Solar Meter Number * */}
              <FloatingInput
                label="Solar Meter Number"
                name="solar_meter_no"
                value={solarMeterNo}
                onChange={(e) => setSolarMeterNo(e.target.value)}
                required
                disabled={submitting}
                placeholder="Solar generation meter serial"
              />

              {/* Net Meter/Smart Meter Number * */}
              <FloatingInput
                label="Net Meter/Smart Meter Number"
                name="net_meter_no"
                value={nmSmNo}
                onChange={(e) => setNmSmNo(e.target.value)}
                required
                disabled={submitting}
                placeholder="Bi-directional / smart meter serial"
              />
            </div>

            {/* Dynamic Equipment Serials: Inverters, Loggers, Panels */}
            
            {/* 1. Inverters Repeater (+ Add More) */}
            <div style={{ background: 'var(--ax-surface-subtle, #f8fafc)', padding: '16px 18px', borderRadius: '10px', border: '1px solid var(--ax-border, #e2e8f0)', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563eb' }} />
                  <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--ax-text-strong, #1e293b)' }}>
                    Inverter Serials & Capacity (KWs)
                  </h4>
                </div>
                <button
                  type="button"
                  className="ax-btn ax-btn--secondary ax-btn--xs"
                  onClick={handleAddInverter}
                  disabled={submitting}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: 700, padding: '4px 12px' }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  + Add Inverter
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {inverters.map((inv, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ flex: '2 1 200px', minWidth: '180px' }}>
                      <FloatingInput
                        label={`Inverter No. ${idx + 1}`}
                        name={`inverter_no_${idx + 1}`}
                        value={inv.no}
                        onChange={(e) => handleInverterChange(idx, 'no', e.target.value)}
                        required={idx === 0}
                        disabled={submitting}
                        placeholder="Enter Inverter Number"
                      />
                    </div>
                    <div style={{ flex: '1 1 120px', minWidth: '120px' }}>
                      <FloatingInput
                        label="KWs"
                        name={`inverter_kws_${idx + 1}`}
                        type="number"
                        step="any"
                        value={inv.kws}
                        onChange={(e) => handleInverterChange(idx, 'kws', e.target.value)}
                        disabled={submitting}
                        placeholder="Enter KWs"
                      />
                    </div>
                    {inverters.length > 1 && (
                      <button
                        type="button"
                        className="ax-btn ax-btn--ghost ax-btn--sm"
                        onClick={() => handleRemoveInverter(idx)}
                        disabled={submitting}
                        style={{ color: '#ef4444', height: '46px', padding: '0 10px', flexShrink: 0, fontWeight: 700 }}
                        title={`Remove Inverter #${idx + 1}`}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Loggers Repeater (+ Add More) */}
            <div style={{ background: 'var(--ax-surface-subtle, #f8fafc)', padding: '16px 18px', borderRadius: '10px', border: '1px solid var(--ax-border, #e2e8f0)', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0891b2' }} />
                  <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--ax-text-strong, #1e293b)' }}>
                    Loger Device Serial Numbers
                  </h4>
                </div>
                <button
                  type="button"
                  className="ax-btn ax-btn--secondary ax-btn--xs"
                  onClick={handleAddLogger}
                  disabled={submitting}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: 700, padding: '4px 12px' }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  + Add Loger
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                {loggers.map((log, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <FloatingInput
                        label={`Loger No. ${idx + 1}`}
                        name={`logger_no_${idx + 1}`}
                        value={log}
                        onChange={(e) => handleLoggerChange(idx, e.target.value)}
                        required={idx === 0}
                        disabled={submitting}
                        placeholder="Enter Loger Number"
                      />
                    </div>
                    {loggers.length > 1 && (
                      <button
                        type="button"
                        className="ax-btn ax-btn--ghost ax-btn--sm"
                        onClick={() => handleRemoveLogger(idx)}
                        disabled={submitting}
                        style={{ color: '#ef4444', height: '46px', padding: '0 8px', flexShrink: 0, fontWeight: 700 }}
                        title={`Remove Loger #${idx + 1}`}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Panel Modules Repeater (+ Add More) */}
            <div style={{ background: 'var(--ax-surface-subtle, #f8fafc)', padding: '16px 18px', borderRadius: '10px', border: '1px solid var(--ax-border, #e2e8f0)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                  <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--ax-text-strong, #1e293b)' }}>
                    Panel Serial Numbers
                  </h4>
                </div>
                <button
                  type="button"
                  className="ax-btn ax-btn--secondary ax-btn--xs"
                  onClick={handleAddPanel}
                  disabled={submitting}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: 700, padding: '4px 12px' }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  + Add Panel
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                {panels.map((p, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <FloatingInput
                        label={`Panel No. ${idx + 1}`}
                        name={`panel_no_${idx + 1}`}
                        value={p}
                        onChange={(e) => handlePanelChange(idx, e.target.value)}
                        required={idx === 0}
                        disabled={submitting}
                        placeholder="Enter Panel Number"
                      />
                    </div>
                    {panels.length > 1 && (
                      <button
                        type="button"
                        className="ax-btn ax-btn--ghost ax-btn--sm"
                        onClick={() => handleRemovePanel(idx)}
                        disabled={submitting}
                        style={{ color: '#ef4444', height: '46px', padding: '0 8px', flexShrink: 0, fontWeight: 700 }}
                        title={`Remove Panel #${idx + 1}`}
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

          {/* Section 4: Location Coordinates & Mandatory Commissioning Photos */}
          <div ref={sec4} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
                  4. Location Coordinates & Mandatory Commissioning Photos
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Verified GPS latitude/longitude and high-resolution installation photos
                </span>
              </div>
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--sm"
                onClick={handleGetLocation}
                disabled={gettingLocation || submitting}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                {gettingLocation ? (
                  <>
                    <span className="ax-spinner" style={{ width: 12, height: 12 }} /> Locating...
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <circle cx="12" cy="12" r="3" />
                      <path d="M12 2v3m0 14v3M2 12h3m14 0h3" />
                    </svg>
                    Get Current Location
                  </>
                )}
              </button>
            </div>

            {/* Coordinates */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: 20 }}>
              <FloatingInput
                label="Latitude"
                name="latitude"
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                required
                disabled={submitting}
                placeholder="e.g. 26.8467"
              />
              <FloatingInput
                label="longitude"
                name="longitude"
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                required
                disabled={submitting}
                placeholder="e.g. 80.9462"
              />
            </div>

            {/* Mandatory Commissioning Photos */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: 20 }}>
              {/* Panel Image * */}
              <UploadDropzone
                id="panel_image_drop"
                label="Panel Image"
                required
                disabled={submitting}
                file={panelImage}
                preview={panelPreview}
                onSelect={(f) => {
                  setPanelImage(f);
                  setPanelPreview(URL.createObjectURL(f));
                }}
                onRemove={() => {
                  setPanelImage(null);
                  if (panelPreview) URL.revokeObjectURL(panelPreview);
                  setPanelPreview(undefined);
                }}
              />

              {/* System Image * */}
              <UploadDropzone
                id="system_image_drop"
                label="System Image"
                required
                disabled={submitting}
                file={systemImage}
                preview={systemPreview}
                onSelect={(f) => {
                  setSystemImage(f);
                  setSystemPreview(URL.createObjectURL(f));
                }}
                onRemove={() => {
                  setSystemImage(null);
                  if (systemPreview) URL.revokeObjectURL(systemPreview);
                  setSystemPreview(undefined);
                }}
              />

              {/* Inverter Image * */}
              <UploadDropzone
                id="inverter_image_drop"
                label="Inverter Image"
                required
                disabled={submitting}
                file={inverterImage}
                preview={inverterPreview}
                onSelect={(f) => {
                  setInverterImage(f);
                  setInverterPreview(URL.createObjectURL(f));
                }}
                onRemove={() => {
                  setInverterImage(null);
                  if (inverterPreview) URL.revokeObjectURL(inverterPreview);
                  setInverterPreview(undefined);
                }}
              />

              {/* Net Meter/Smart Meter Image * */}
              <UploadDropzone
                id="nm_sm_image_drop"
                label="Net Meter/Smart Meter Image"
                required
                disabled={submitting}
                file={nmSmImage}
                preview={nmSmPreview}
                onSelect={(f) => {
                  setNmSmImage(f);
                  setNmSmPreview(URL.createObjectURL(f));
                }}
                onRemove={() => {
                  setNmSmImage(null);
                  if (nmSmPreview) URL.revokeObjectURL(nmSmPreview);
                  setNmSmPreview(undefined);
                }}
              />

              {/* Loger Image * */}
              <UploadDropzone
                id="logger_image_drop"
                label="Loger Image"
                required
                disabled={submitting}
                file={loggerImage}
                preview={loggerPreview}
                onSelect={(f) => {
                  setLoggerImage(f);
                  setLoggerPreview(URL.createObjectURL(f));
                }}
                onRemove={() => {
                  setLoggerImage(null);
                  if (loggerPreview) URL.revokeObjectURL(loggerPreview);
                  setLoggerPreview(undefined);
                }}
              />
            </div>

            {/* Remarks */}
            <div className="ax-float">
              <input
                type="text"
                id="remarks"
                name="remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                disabled={submitting}
                placeholder="Optional remarks or notes about installation"
                className="ax-float__input"
              />
              <label htmlFor="remarks" className={`ax-float__label ${remarks ? 'has-val' : ''}`}>
                Remarks
              </label>
            </div>
          </div>

          {/* Submit Footer */}
          <div
            style={{
              marginTop: '32px',
              paddingTop: '20px',
              borderTop: '1px solid var(--ax-border, #e2e8f0)',
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <button
              type="button"
              className="ax-btn ax-btn--secondary"
              onClick={handleResetForm}
              disabled={submitting}
            >
              Reset Form
            </button>
            <button
              type="submit"
              className="ax-btn ax-btn--primary"
              disabled={submitting || !selectedSiteId || !selectedVendor}
              style={{ minWidth: 200, fontWeight: 700 }}
            >
              {submitting ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <span className="ax-spinner" /> Submitting Details...
                </span>
              ) : (
                'Submit Installation'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default UPRescoViewAssignVendorInstallation;
