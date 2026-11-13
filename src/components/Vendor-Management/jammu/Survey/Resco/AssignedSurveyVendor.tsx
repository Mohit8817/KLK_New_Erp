import { useState, useEffect, useRef, useMemo, useCallback, type FormEvent, type ChangeEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  jammuRescoSurveyService,
  resolveJammuSurveyMediaUrl,
  type JammuRescoDropdownSite,
  type JammuRescoSiteDetail,
} from '../../../../V-Portal/jammu/jammu-services';

/* ───────── Unified Single-Card Layout matching Reference Design ───────── */
const SINGLE_CARD_FORM_CSS = `
.solar-erp-page {
  --asw-primary: #2563eb;
  --asw-primary-rgb: 37, 99, 235;
}
.jammu-survey-form .ax-card {
  border: 1px solid var(--ax-border, #e2e8f0);
  border-radius: var(--ax-radius-xl, 16px);
  background: var(--ax-surface-solid, #ffffff);
  box-shadow: var(--ax-shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.05));
  overflow: hidden;
}
.jammu-survey-form .ax-card__header {
  padding: var(--ax-space-5, 20px) var(--ax-space-6, 24px);
  border-bottom: 1px solid var(--ax-border-subtle, #f1f5f9);
  background: var(--ax-surface-subtle, #f8fafc);
  display: flex;
  flex-direction: column;
  gap: var(--ax-space-4, 16px);
}
.jammu-survey-form .ax-card__body { padding: var(--ax-space-6, 24px); }

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
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
  margin-top: 8px;
}
`;

interface FloatingInputProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  required?: boolean;
  disabled?: boolean;
  type?: string;
  placeholder?: string;
  as?: 'input' | 'select' | 'textarea';
  children?: React.ReactNode;
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
  as = 'input',
  children,
}: FloatingInputProps) {
  const [focused, setFocused] = useState(false);
  const hasVal = Boolean(value && String(value).length > 0);

  if (as === 'select') {
    return (
      <div className="ax-float" style={{ flex: 1, minWidth: 0 }}>
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          required={required}
          disabled={disabled}
          className="ax-float__input"
        >
          {children}
        </select>
        <label htmlFor={name} className="ax-float__label floating">
          {label} {required && <span style={{ color: 'var(--ax-danger, #ef4444)' }}>*</span>}
        </label>
      </div>
    );
  }

  if (as === 'textarea') {
    return (
      <div className="ax-float" style={{ flex: 1, minWidth: 0 }}>
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          required={required}
          disabled={disabled}
          placeholder={placeholder || label}
          rows={3}
          style={{ height: 'auto', minHeight: 76, padding: '16px 14px 8px' }}
          className="ax-float__input"
        />
        <label htmlFor={name} className={`ax-float__label ${focused ? 'floating' : hasVal ? 'has-val' : ''}`}>
          {label} {required && <span style={{ color: 'var(--ax-danger, #ef4444)' }}>*</span>}
        </label>
      </div>
    );
  }

  return (
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
      />
      <label htmlFor={name} className={`ax-float__label ${focused ? 'floating' : hasVal ? 'has-val' : ''}`}>
        {label} {required && <span style={{ color: 'var(--ax-danger, #ef4444)' }}>*</span>}
      </label>
    </div>
  );
}

/* ───────── Upload Dropzone Component ───────── */
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
  accept = '.pdf,.jpg,.jpeg,.png',
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
    if (chosen) onSelect(chosen);
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
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong, #0f172a)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file ? file.name : label}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ax-text-muted, #64748b)', marginTop: 2 }}>
                  {file ? `${(file.size / 1024).toFixed(0)} KB &bull; Ready to upload` : 'File attached'}
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
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong, #1e293b)' }}>
              Click or drag image
            </div>
            <div style={{ fontSize: 11, color: 'var(--ax-text-muted, #64748b)', marginTop: 2 }}>
              JPG, PNG or PDF (Max 5 MB)
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

/* ───────── Main Component ───────── */
export function AssignedSurveyVendor() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Query parameter support: siteId
  const querySiteId = searchParams.get('siteId') || searchParams.get('site_id');

  // Sites list & selected site
  const [sitesList, setSitesList] = useState<JammuRescoDropdownSite[]>([]);
  const [loadingSites, setLoadingSites] = useState(false);
  const [selectedSiteId, setSelectedSiteId] = useState<string>(querySiteId || '');
  const [siteDetail, setSiteDetail] = useState<JammuRescoSiteDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Section 2: Location, Nodal & GPS Details
  const [siteAddress, setSiteAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [agencyPersonName, setAgencyPersonName] = useState('');
  const [agencyPersonContact, setAgencyPersonContact] = useState('');
  const [nodalPerson, setNodalPerson] = useState('');
  const [contactNodal, setContactNodal] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  // Section 3: Electrical & Metering
  const [loadType, setLoadType] = useState('Commercial');
  const [connectionPhase, setConnectionPhase] = useState('3 Phase');
  const [meterConnection, setMeterConnection] = useState('Single Phase');
  const [meterNumber, setMeterNumber] = useState('');
  const [meterType, setMeterType] = useState('Digital');
  const [sanctionLoad, setSanctionLoad] = useState('');
  const [connectedLoad, setConnectedLoad] = useState('');
  const [gridPower, setGridPower] = useState('Yes');
  const [ltdbPresent, setLtdbPresent] = useState('Yes');
  const [all3PhaseLtdb, setAll3PhaseLtdb] = useState('Yes');
  const [missingPhase, setMissingPhase] = useState('No');

  // Section 4: Rooftop & Civil Feasibility
  const [roofCondition, setRoofCondition] = useState('Good');
  const [areaRoof, setAreaRoof] = useState('');
  const [freeSpaceSolar, setFreeSpaceSolar] = useState('');
  const [freeSpaceInverter, setFreeSpaceInverter] = useState('');
  const [earthPit, setEarthPit] = useState('Available');
  const [buildingAge, setBuildingAge] = useState('');
  const [roofAccess, setRoofAccess] = useState('Staircase');
  const [rooftopHeight, setRooftopHeight] = useState('');
  const [parapetHeight, setParapetHeight] = useState('');
  const [floorsNumber, setFloorsNumber] = useState('1');
  const [waterSource, setWaterSource] = useState('Tap Water');
  const [siteAccess, setSiteAccess] = useState('Direct Road Access');
  const [siteDistance, setSiteDistance] = useState('0');
  const [surveyRemarks, setSurveyRemarks] = useState('');

  // Section 5: Feasibility Verdict & Media Evidence
  const [siteFeasible, setSiteFeasible] = useState('Feasible');
  const [buildingImage, setBuildingImage] = useState<File | null>(null);
  const [buildingImagePreview, setBuildingImagePreview] = useState('');
  const [roofImage, setRoofImage] = useState<File | null>(null);
  const [roofImagePreview, setRoofImagePreview] = useState('');
  const [controlRoomImage, setControlRoomImage] = useState<File | null>(null);
  const [controlRoomImagePreview, setControlRoomImagePreview] = useState('');
  const [otherImage, setOtherImage] = useState<File | null>(null);
  const [otherImagePreview, setOtherImagePreview] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  // Submission state & feedback
  const [submitting, setSubmitting] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  // Section references for scroll
  const sec1 = useRef<HTMLDivElement>(null);
  const sec2 = useRef<HTMLDivElement>(null);
  const sec3 = useRef<HTMLDivElement>(null);
  const sec4 = useRef<HTMLDivElement>(null);
  const sec5 = useRef<HTMLDivElement>(null);

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Fetch Dropdown Sites
  const fetchSites = useCallback(async () => {
    setLoadingSites(true);
    try {
      const list = await jammuRescoSurveyService.fetchSites();
      if (Array.isArray(list) && list.length > 0) {
        setSitesList(list);
      } else {
        const pending = await jammuRescoSurveyService.getPendingSurveys();
        setSitesList(
          pending.map((p) => ({
            id: p.id,
            site_name: p.site_name || `Site #${p.id}`,
            district: p.district,
            capacity: p.capacity,
          }))
        );
      }
    } catch (err) {
      console.warn('[AssignedSurveyVendor] fetchSites fallback:', err);
      setSitesList([
        { id: 1, site_name: 'DC Office Complex Jammu', district: 'Jammu', capacity: '100 KW' },
        { id: 2, site_name: 'District Hospital Kathua', district: 'Kathua', capacity: '50 KW' },
        { id: 3, site_name: 'Govt Higher Secondary School Samba', district: 'Samba', capacity: '25 KW' },
        { id: 4, site_name: 'PWD Divisional Office Udhampur', district: 'Udhampur', capacity: '30 KW' },
        { id: 5, site_name: 'Govt Polytechnic College Rajouri', district: 'Rajouri', capacity: '75 KW' },
      ]);
    } finally {
      setLoadingSites(false);
    }
  }, []);

  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  // Load Site Details when selected
  useEffect(() => {
    if (!selectedSiteId) {
      setSiteDetail(null);
      return;
    }

    let active = true;
    const loadDetail = async () => {
      setLoadingDetail(true);
      try {
        const detail = await jammuRescoSurveyService.getSiteDetail(selectedSiteId);
        if (!active) return;
        setSiteDetail(detail);

        if (detail) {
          if (detail.site_address) setSiteAddress(detail.site_address);
          if (detail.nearest_landmark) setLandmark(detail.nearest_landmark);
          if (detail.contact_person) setAgencyPersonName(detail.contact_person);
          if (detail.contact_number) setAgencyPersonContact(detail.contact_number);
          if (detail.latitude) setLatitude(String(detail.latitude));
          if (detail.longitude) setLongitude(String(detail.longitude));
          if (detail.sanction_load) setSanctionLoad(String(detail.sanction_load));
          if (detail.connected_load) setConnectedLoad(String(detail.connected_load));
          if (detail.meter_number) setMeterNumber(String(detail.meter_number));
          if (detail.area_roof) setAreaRoof(String(detail.area_roof));
          if (detail.free_space_solar) setFreeSpaceSolar(String(detail.free_space_solar));
          if (detail.building_age) setBuildingAge(String(detail.building_age));
        }
      } catch (err) {
        console.warn('[AssignedSurveyVendor] getSiteDetail fallback:', err);
      } finally {
        if (active) setLoadingDetail(false);
      }
    };

    loadDetail();
    return () => {
      active = false;
    };
  }, [selectedSiteId]);

  // Fetch Live GPS
  const handleFetchLocation = () => {
    if (!navigator.geolocation) {
      setFeedback({ type: 'danger', text: 'Geolocation is not supported by your browser.' });
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
        setGettingLocation(false);
        setFeedback({ type: 'success', text: 'GPS coordinates captured from device.' });
      },
      (err) => {
        setGettingLocation(false);
        setFeedback({ type: 'danger', text: `Failed to fetch GPS location: ${err.message}` });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Submit Handler
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!selectedSiteId) {
      setFeedback({ type: 'danger', text: 'Please select a survey site.' });
      scrollTo(sec1);
      return;
    }

    try {
      setSubmitting(true);
      const fd = new FormData();
      fd.append('site_id', selectedSiteId);
      fd.append('site_address', siteAddress);
      fd.append('nearest_landmark', landmark);
      fd.append('agency_person_name', agencyPersonName);
      fd.append('agency_person_contact', agencyPersonContact);
      fd.append('nodal_person', nodalPerson);
      fd.append('contact_nodal', contactNodal);
      fd.append('latitude', latitude);
      fd.append('longitude', longitude);

      fd.append('load_type', loadType);
      fd.append('connection_phase', connectionPhase);
      fd.append('meter_connection', meterConnection);
      fd.append('meter_number', meterNumber);
      fd.append('meter_type', meterType);
      fd.append('sanction_load', sanctionLoad);
      fd.append('connected_load', connectedLoad);
      fd.append('grid_power', gridPower);
      fd.append('ltdb_present', ltdbPresent);
      fd.append('all_3phase_ltdb', all3PhaseLtdb);
      fd.append('missing_phase', missingPhase);

      fd.append('roof_condition', roofCondition);
      fd.append('area_roof', areaRoof);
      fd.append('free_space_solar', freeSpaceSolar);
      fd.append('free_space_inverter', freeSpaceInverter);
      fd.append('earth_pit', earthPit);
      fd.append('building_age', buildingAge);
      fd.append('roof_access', roofAccess);
      fd.append('rooftop_height', rooftopHeight);
      fd.append('parapet_height', parapetHeight);
      fd.append('floors_number', floorsNumber);
      fd.append('water_source', waterSource);
      fd.append('site_access', siteAccess);
      fd.append('site_distance', siteDistance);
      fd.append('survey_remarks', surveyRemarks);

      fd.append('site_feasible', siteFeasible);
      if (buildingImage) fd.append('building_image', buildingImage);
      if (roofImage) fd.append('roof_image', roofImage);
      if (controlRoomImage) fd.append('control_room_image', controlRoomImage);
      if (otherImage) fd.append('other_image', otherImage);
      if (pdfFile) fd.append('pdf', pdfFile);

      await jammuRescoSurveyService.submitSurvey(fd);

      setFeedback({
        type: 'success',
        text: 'Field feasibility survey report submitted successfully!',
      });

      setTimeout(() => {
        navigate('/vendor-management/jammu/survey/resco/verify');
      }, 1500);
    } catch (err: any) {
      console.error('[AssignedSurveyVendor] submit error:', err);
      setFeedback({
        type: 'danger',
        text: err?.message || 'Failed to submit survey. Please review required fields.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="solar-erp-page jammu-survey-form">
      <style>{SINGLE_CARD_FORM_CSS}</style>

      {/* Page Head */}
      <PageHead
        title="Jammu RESCO Conduct Field Survey"
        subtitle="Complete on-ground rooftop technical feasibility, record electrical specifications, and capture geo-tagged inspection evidence."
        breadcrumbs={[
          { label: 'Home', href: '/vendor-management' },
          { label: 'Jammu', href: '/vendor-management/jammu/survey/resco/dashboard' },
          { label: 'Resco Survey', href: '/vendor-management/jammu/survey/resco/dashboard' },
          { label: 'Conduct Field Survey' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 8 }}>
            <Link
              to="/vendor-management/jammu/survey/resco/view-assign"
              className="ax-btn ax-btn--secondary ax-btn--sm"
            >
              &larr; View Assigned Batches
            </Link>
            <Link
              to="/vendor-management/jammu/survey/resco/verify"
              className="ax-btn ax-btn--primary ax-btn--sm"
            >
              Verification Desk &rarr;
            </Link>
          </div>
        }
      />

      <div className="ax-container" style={{ paddingBottom: 40 }}>
        {feedback && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 8,
              marginBottom: 16,
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: feedback.type === 'success' ? '#ecfdf5' : '#fef2f2',
              border: `1px solid ${feedback.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
              color: feedback.type === 'success' ? '#065f46' : '#b91c1c',
            }}
          >
            <span>{feedback.text}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              style={{
                background: 'none',
                border: 'none',
                color: feedback.type === 'success' ? '#065f46' : '#b91c1c',
                cursor: 'pointer',
                fontSize: 16,
              }}
            >
              &times;
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="ax-card">
          {/* Card Header with Section Nav Pills */}
          <div className="ax-card__header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h2 className="ax-card__title" style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--ax-text-strong)' }}>
                  RESCO Field Feasibility Survey Entry
                </h2>
                <p className="ax-card__subtitle" style={{ fontSize: '0.85rem', color: '#ef4444', margin: '4px 0 0' }}>
                  The field labels marked with * are required input fields.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="ax-badge ax-badge--soft ax-badge--info" style={{ fontWeight: 600, padding: '4px 12px', fontSize: 12 }}>
                  State: Jammu and Kashmir
                </span>
              </div>
            </div>

            {/* Quick Section Nav Pills */}
            <div className="swp-section-pills">
              <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec1)}>
                <span className="pill-num">1</span> Site Selection
              </button>
              <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec2)}>
                <span className="pill-num">2</span> Location &amp; Contact
              </button>
              <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec3)}>
                <span className="pill-num">3</span> Electrical Specs
              </button>
              <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec4)}>
                <span className="pill-num">4</span> Rooftop &amp; Civil
              </button>
              <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec5)}>
                <span className="pill-num">5</span> Verdict &amp; Photos
              </button>
            </div>
          </div>

          <div className="ax-card__body">
            {/* ── Section 1: Site Selection & Scope ── */}
            <div ref={sec1} className="swp-section-block">
              <div className="swp-section-header">
                <div className="swp-section-title-wrap">
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>1. Site Selection &amp; Scope</h3>
                  <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                    Choose assigned survey site to load allocation metadata
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                {/* Site Dropdown */}
                <div className="ax-float">
                  <select
                    id="site_select"
                    className="ax-float__input"
                    value={selectedSiteId}
                    onChange={(e) => setSelectedSiteId(e.target.value)}
                    required
                  >
                    <option value="">
                      {loadingSites ? 'Loading sites...' : '-- Select Assigned Site --'}
                    </option>
                    {sitesList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.site_name} {s.district ? `(${s.district})` : ''} {s.capacity ? `[${s.capacity}]` : ''}
                      </option>
                    ))}
                  </select>
                  <label htmlFor="site_select" className="ax-float__label floating">
                    Select Survey Site <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                </div>

                {/* Read-only District */}
                <div className="ax-float">
                  <input
                    type="text"
                    id="site_district"
                    className="ax-float__input"
                    value={siteDetail?.district || '—'}
                    readOnly
                    disabled
                  />
                  <label htmlFor="site_district" className="ax-float__label floating">
                    Allocated District
                  </label>
                </div>

                {/* Read-only Capacity */}
                <div className="ax-float">
                  <input
                    type="text"
                    id="site_capacity"
                    className="ax-float__input"
                    value={siteDetail?.proposed_capacity || siteDetail?.capacity || '—'}
                    readOnly
                    disabled
                  />
                  <label htmlFor="site_capacity" className="ax-float__label floating">
                    Proposed Capacity
                  </label>
                </div>
              </div>
            </div>

            <hr className="swp-section-divider" />

            {/* ── Section 2: Location, Nodal & GPS Details ── */}
            <div ref={sec2} className="swp-section-block">
              <div className="swp-section-header">
                <div className="swp-section-title-wrap">
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>2. Location, Nodal &amp; GPS Details</h3>
                  <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                    Detailed site address, institutional contact persons, and geo-coordinates
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleFetchLocation}
                  disabled={gettingLocation}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 6,
                    background: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {gettingLocation ? 'Fetching GPS...' : 'Fetch Live GPS'}
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                {/* Site Address */}
                <FloatingInput
                  label="Detailed Site Address"
                  name="site_address"
                  value={siteAddress}
                  onChange={(e) => setSiteAddress(e.target.value)}
                  placeholder="Street, ward, village or postal address"
                />

                {/* Nearest Landmark */}
                <FloatingInput
                  label="Nearest Landmark"
                  name="landmark"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="e.g. Near Bus Stand / Police Station"
                />

                {/* Agency Contact Person */}
                <FloatingInput
                  label="Agency Contact Person"
                  name="agency_person"
                  value={agencyPersonName}
                  onChange={(e) => setAgencyPersonName(e.target.value)}
                  placeholder="Surveyor / Field Representative"
                />

                {/* Agency Contact No */}
                <FloatingInput
                  label="Agency Contact Number"
                  name="agency_contact"
                  value={agencyPersonContact}
                  onChange={(e) => setAgencyPersonContact(e.target.value)}
                  placeholder="10-digit mobile number"
                />

                {/* Nodal Officer Person */}
                <FloatingInput
                  label="Institutional Nodal Officer"
                  name="nodal_person"
                  value={nodalPerson}
                  onChange={(e) => setNodalPerson(e.target.value)}
                  placeholder="Departmental In-charge Name"
                />

                {/* Nodal Contact No */}
                <FloatingInput
                  label="Nodal Officer Contact Number"
                  name="nodal_contact"
                  value={contactNodal}
                  onChange={(e) => setContactNodal(e.target.value)}
                  placeholder="Nodal phone number"
                />

                {/* Latitude */}
                <FloatingInput
                  label="Latitude"
                  name="latitude"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="e.g. 32.726601"
                />

                {/* Longitude */}
                <FloatingInput
                  label="Longitude"
                  name="longitude"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="e.g. 74.857025"
                />
              </div>
            </div>

            <hr className="swp-section-divider" />

            {/* ── Section 3: Electrical & Metering Specs ── */}
            <div ref={sec3} className="swp-section-block">
              <div className="swp-section-header">
                <div className="swp-section-title-wrap">
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>3. Electrical &amp; Metering Specifications</h3>
                  <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                    Utility power parameters, LTDB panel availability, and connected load measurements
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                {/* Load Type */}
                <FloatingInput
                  as="select"
                  label="Load Type"
                  name="load_type"
                  value={loadType}
                  onChange={(e) => setLoadType(e.target.value)}
                >
                  <option value="Commercial">Commercial</option>
                  <option value="Industrial">Industrial</option>
                  <option value="Institutional">Institutional</option>
                  <option value="Domestic">Domestic</option>
                </FloatingInput>

                {/* Connection Phase */}
                <FloatingInput
                  as="select"
                  label="Connection Phase"
                  name="connection_phase"
                  value={connectionPhase}
                  onChange={(e) => setConnectionPhase(e.target.value)}
                >
                  <option value="3 Phase">3 Phase</option>
                  <option value="Single Phase">Single Phase</option>
                </FloatingInput>

                {/* Meter Connection */}
                <FloatingInput
                  as="select"
                  label="Meter Connection Type"
                  name="meter_connection"
                  value={meterConnection}
                  onChange={(e) => setMeterConnection(e.target.value)}
                >
                  <option value="3 Phase 4 Wire">3 Phase 4 Wire</option>
                  <option value="Single Phase 2 Wire">Single Phase 2 Wire</option>
                  <option value="HT Connection">HT Connection</option>
                </FloatingInput>

                {/* Meter Number */}
                <FloatingInput
                  label="Discom Meter Number"
                  name="meter_number"
                  value={meterNumber}
                  onChange={(e) => setMeterNumber(e.target.value)}
                  placeholder="e.g. MTR-JM-88412"
                />

                {/* Sanction Load */}
                <FloatingInput
                  label="Sanction Load (KW)"
                  name="sanction_load"
                  value={sanctionLoad}
                  onChange={(e) => setSanctionLoad(e.target.value)}
                  placeholder="e.g. 50"
                />

                {/* Connected Load */}
                <FloatingInput
                  label="Instantaneous / Connected Load (KW)"
                  name="connected_load"
                  value={connectedLoad}
                  onChange={(e) => setConnectedLoad(e.target.value)}
                  placeholder="e.g. 35"
                />

                {/* Grid Power */}
                <FloatingInput
                  as="select"
                  label="Grid Availability"
                  name="grid_power"
                  value={gridPower}
                  onChange={(e) => setGridPower(e.target.value)}
                >
                  <option value="Yes">Yes (Stable Grid)</option>
                  <option value="No">No (Unstable / DG Backup)</option>
                </FloatingInput>

                {/* LTDB Present */}
                <FloatingInput
                  as="select"
                  label="LTDB Panel Present"
                  name="ltdb_present"
                  value={ltdbPresent}
                  onChange={(e) => setLtdbPresent(e.target.value)}
                >
                  <option value="Yes">Yes (Accessible LTDB)</option>
                  <option value="No">No (Direct Main Busbar)</option>
                </FloatingInput>

                {/* All 3 Phase in LTDB */}
                <FloatingInput
                  as="select"
                  label="All 3-Phases Available in LTDB"
                  name="all_3phase_ltdb"
                  value={all3PhaseLtdb}
                  onChange={(e) => setAll3PhaseLtdb(e.target.value)}
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </FloatingInput>

                {/* Missing Phase */}
                <FloatingInput
                  as="select"
                  label="Missing Phase Detected"
                  name="missing_phase"
                  value={missingPhase}
                  onChange={(e) => setMissingPhase(e.target.value)}
                >
                  <option value="No">No (All Phases Active)</option>
                  <option value="Yes">Yes (Phase Discrepancy)</option>
                </FloatingInput>
              </div>
            </div>

            <hr className="swp-section-divider" />

            {/* ── Section 4: Rooftop, Civil & Structural Feasibility ── */}
            <div ref={sec4} className="swp-section-block">
              <div className="swp-section-header">
                <div className="swp-section-title-wrap">
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>4. Rooftop &amp; Civil Feasibility</h3>
                  <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                    Rooftop structural integrity, available area for PV modules, building height, and earth pit positions
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                {/* Roof Condition */}
                <FloatingInput
                  as="select"
                  label="Roof Condition"
                  name="roof_condition"
                  value={roofCondition}
                  onChange={(e) => setRoofCondition(e.target.value)}
                >
                  <option value="Good (RCC Slab)">Good (RCC Slab)</option>
                  <option value="Tin Shed / Metal Sheet">Tin Shed / Metal Sheet</option>
                  <option value="Tiled / Slanted">Tiled / Slanted</option>
                  <option value="Old RCC (Repairs Needed)">Old RCC (Repairs Needed)</option>
                </FloatingInput>

                {/* Area of Roof */}
                <FloatingInput
                  label="Total Roof Area (Sq. Feet)"
                  name="area_roof"
                  value={areaRoof}
                  onChange={(e) => setAreaRoof(e.target.value)}
                  placeholder="e.g. 5000"
                />

                {/* Free Space Solar */}
                <FloatingInput
                  label="Shadow-Free Space for Solar (Sq. Ft.)"
                  name="free_space_solar"
                  value={freeSpaceSolar}
                  onChange={(e) => setFreeSpaceSolar(e.target.value)}
                  placeholder="e.g. 3500"
                />

                {/* Free Space Inverter */}
                <FloatingInput
                  label="Space for Inverter / Control Room (Sq. Ft.)"
                  name="free_space_inverter"
                  value={freeSpaceInverter}
                  onChange={(e) => setFreeSpaceInverter(e.target.value)}
                  placeholder="e.g. 150"
                />

                {/* Earth Pit */}
                <FloatingInput
                  as="select"
                  label="Earth Pit Position"
                  name="earth_pit"
                  value={earthPit}
                  onChange={(e) => setEarthPit(e.target.value)}
                >
                  <option value="Available">Available (Ground Yard)</option>
                  <option value="New Earth Pit Required">New Earth Pit Required</option>
                  <option value="Nearby Building Pit">Nearby Building Pit</option>
                </FloatingInput>

                {/* Building Age */}
                <FloatingInput
                  label="Age of Building (Years)"
                  name="building_age"
                  value={buildingAge}
                  onChange={(e) => setBuildingAge(e.target.value)}
                  placeholder="e.g. 8"
                />

                {/* Roof Access */}
                <FloatingInput
                  as="select"
                  label="Access to the Roof"
                  name="roof_access"
                  value={roofAccess}
                  onChange={(e) => setRoofAccess(e.target.value)}
                >
                  <option value="Staircase">Staircase (Direct Walk)</option>
                  <option value="Ladder / Monkey Ladder">Ladder / Monkey Ladder</option>
                  <option value="Trapdoor / Hatch">Trapdoor / Hatch</option>
                  <option value="Scaffolding Required">Scaffolding Required</option>
                </FloatingInput>

                {/* Rooftop Height */}
                <FloatingInput
                  label="Rooftop Height (Meters)"
                  name="rooftop_height"
                  value={rooftopHeight}
                  onChange={(e) => setRooftopHeight(e.target.value)}
                  placeholder="e.g. 12"
                />

                {/* Parapet Height */}
                <FloatingInput
                  label="Parapet Wall Height (Meters)"
                  name="parapet_height"
                  value={parapetHeight}
                  onChange={(e) => setParapetHeight(e.target.value)}
                  placeholder="e.g. 1.2"
                />

                {/* No. of Floors */}
                <FloatingInput
                  label="No. of Floors (G+...)"
                  name="floors_number"
                  value={floorsNumber}
                  onChange={(e) => setFloorsNumber(e.target.value)}
                  placeholder="e.g. G+2"
                />

                {/* Water Source */}
                <FloatingInput
                  as="select"
                  label="Water Source for Module Cleaning"
                  name="water_source"
                  value={waterSource}
                  onChange={(e) => setWaterSource(e.target.value)}
                >
                  <option value="Tap Water">Tap Water / Overhead Tank</option>
                  <option value="Borewell Supply">Borewell Supply</option>
                  <option value="External Water Tanker">External Water Tanker</option>
                </FloatingInput>

                {/* Site Access */}
                <FloatingInput
                  as="select"
                  label="Vehicle Access to Site"
                  name="site_access"
                  value={siteAccess}
                  onChange={(e) => setSiteAccess(e.target.value)}
                >
                  <option value="Direct Road Access">Direct Road Access (Truck)</option>
                  <option value="Narrow Lane (Small LCV)">Narrow Lane (Small LCV)</option>
                  <option value="Manual Carriage Required">Manual Carriage Required</option>
                </FloatingInput>
              </div>

              <div style={{ marginTop: 16 }}>
                <FloatingInput
                  as="textarea"
                  label="Surveyor Feasibility Remarks & Scope Notes"
                  name="survey_remarks"
                  value={surveyRemarks}
                  onChange={(e) => setSurveyRemarks(e.target.value)}
                  placeholder="Enter structural assessment, cable route observations, or shading analysis..."
                />
              </div>
            </div>

            <hr className="swp-section-divider" />

            {/* ── Section 5: Verdict & Media Evidence Uploads ── */}
            <div ref={sec5} className="swp-section-block">
              <div className="swp-section-header">
                <div className="swp-section-title-wrap">
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>5. Feasibility Verdict &amp; Media Uploads</h3>
                  <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                    Provide technical verdict and upload required inspection photographs and feasibility report
                  </span>
                </div>
              </div>

              {/* Feasibility Verdict Radio / Select */}
              <div style={{ marginBottom: 20, maxWidth: 360 }}>
                <FloatingInput
                  as="select"
                  label="Site Solar Feasibility Verdict"
                  name="site_feasible"
                  value={siteFeasible}
                  onChange={(e) => setSiteFeasible(e.target.value)}
                  required
                >
                  <option value="Feasible">Feasible (Recommended for Solar PV)</option>
                  <option value="Not Feasible">Not Feasible (Severe Obstacles / Structurally Unsound)</option>
                  <option value="Conditionally Feasible">Conditionally Feasible (Subject to Structural Rework)</option>
                </FloatingInput>
              </div>

              {/* Upload Dropzones Grid */}
              <div className="jammu-upload-grid">
                {/* 1. Building Image */}
                <UploadDropzone
                  id="building_image"
                  label="Building Front View Photo"
                  file={buildingImage}
                  preview={buildingImagePreview}
                  onSelect={(file) => {
                    setBuildingImage(file);
                    setBuildingImagePreview(URL.createObjectURL(file));
                  }}
                  onRemove={() => {
                    setBuildingImage(null);
                    setBuildingImagePreview('');
                  }}
                />

                {/* 2. Roof Image */}
                <UploadDropzone
                  id="roof_image"
                  label="Rooftop Surface Photo"
                  file={roofImage}
                  preview={roofImagePreview}
                  onSelect={(file) => {
                    setRoofImage(file);
                    setRoofImagePreview(URL.createObjectURL(file));
                  }}
                  onRemove={() => {
                    setRoofImage(null);
                    setRoofImagePreview('');
                  }}
                />

                {/* 3. Control Room Image */}
                <UploadDropzone
                  id="control_room_image"
                  label="Control Room / Inverter Space Photo"
                  file={controlRoomImage}
                  preview={controlRoomImagePreview}
                  onSelect={(file) => {
                    setControlRoomImage(file);
                    setControlRoomImagePreview(URL.createObjectURL(file));
                  }}
                  onRemove={() => {
                    setControlRoomImage(null);
                    setControlRoomImagePreview('');
                  }}
                />

                {/* 4. Other Image */}
                <UploadDropzone
                  id="other_image"
                  label="LTDB Panel / Additional Photo"
                  file={otherImage}
                  preview={otherImagePreview}
                  onSelect={(file) => {
                    setOtherImage(file);
                    setOtherImagePreview(URL.createObjectURL(file));
                  }}
                  onRemove={() => {
                    setOtherImage(null);
                    setOtherImagePreview('');
                  }}
                />

                {/* 5. Feasibility PDF Dossier */}
                <UploadDropzone
                  id="pdf_file"
                  label="Feasibility Dossier / Single Line Diagram (PDF)"
                  accept=".pdf"
                  file={pdfFile}
                  onSelect={(file) => setPdfFile(file)}
                  onRemove={() => setPdfFile(null)}
                />
              </div>
            </div>

            {/* Submit Footer */}
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
              <Link to="/vendor-management/jammu/survey/resco/view-assign" className="ax-btn ax-btn--secondary">
                Cancel
              </Link>
              <button
                type="submit"
                className="ax-btn ax-btn--primary"
                disabled={submitting || !selectedSiteId}
                style={{ minWidth: 200, fontWeight: 700 }}
              >
                {submitting ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <span className="ax-spinner" /> Submitting Survey...
                  </span>
                ) : (
                  'Submit Feasibility Survey'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AssignedSurveyVendor;
