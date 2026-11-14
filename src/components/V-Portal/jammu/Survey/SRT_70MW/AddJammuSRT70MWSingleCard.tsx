import { useState, useEffect, useRef, type FormEvent, type ChangeEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  jammuSrtSurveyService,
  resolveJammuSurveyMediaUrl,
  type JammuSrtSurveyItem,
} from '../../jammu-services';

/* ───────── Unified Single-Card Layout matching Reference Design ───────── */
const SINGLE_CARD_FORM_CSS = `
.solar-erp-page {
  --asw-primary: #2559bf;
  --asw-primary-rgb: 37, 89, 191;
}
.jammu-srt-form .ax-card {
  border: 1px solid var(--ax-border, #e2e8f0);
  border-radius: var(--ax-radius-xl, 16px);
  background: var(--ax-surface-solid, #ffffff);
  box-shadow: var(--ax-shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.05));
  overflow: hidden;
}
.jammu-srt-form .ax-card__header {
  padding: var(--ax-space-5, 20px) var(--ax-space-6, 24px);
  border-bottom: 1px solid var(--ax-border-subtle, #f1f5f9);
  background: var(--ax-surface-subtle, #f8fafc);
  display: flex;
  flex-direction: column;
  gap: var(--ax-space-4, 16px);
}
.jammu-srt-form .ax-card__body { padding: var(--ax-space-6, 24px); }

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
          className="ax-float__input"
          style={{ height: 80, resize: 'vertical' }}
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
                  {file ? `${(file.size / 1024).toFixed(0)} KB · Ready to upload` : 'Existing file attached'}
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

export function AddJammuSRT70MWSingleCard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryId = searchParams.get('id');
  const isUpdateMode = Boolean(queryId);

  // Section 1: Basic & Site Details
  const [district, setDistrict] = useState('Jammu');
  const [department, setDepartment] = useState('Education');
  const [deptName, setDeptName] = useState('');
  const [siteName, setSiteName] = useState('');
  const [surveySiteAddress, setSurveySiteAddress] = useState('');
  const [nearLandmark, setNearLandmark] = useState('');
  const [proposedCapacity, setProposedCapacity] = useState('');

  // Section 2: Contact & Geolocation
  const [contactPerson, setContactPerson] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  // Section 3: Electrical & Grid Parameters
  const [loadType, setLoadType] = useState('Commercial');
  const [connectionType, setConnectionType] = useState('LT');
  const [meterConnectionType, setMeterConnectionType] = useState('Three Phase');
  const [caNo, setCaNo] = useState('');
  const [meterNo, setMeterNo] = useState('');
  const [sanctionLoad, setSanctionLoad] = useState('');
  const [instantaneousLoad, setInstantaneousLoad] = useState('');
  const [gridAvailability, setGridAvailability] = useState('Yes');
  const [threePhaseAvailable, setThreePhaseAvailable] = useState('Yes');
  const [missingPhase, setMissingPhase] = useState('No');
  const [ltdbStatus, setLtdbStatus] = useState('Available');

  // DG Set
  const [dgSetAvailable, setDgSetAvailable] = useState('0'); // '1' = Yes, '0' = No
  const [dgSetCapacity, setDgSetCapacity] = useState('');
  const [dgSetMake, setDgSetMake] = useState('');

  // Section 4: Rooftop, Space & Routing
  const [roofCondition, setRoofCondition] = useState('Good');
  const [roofArea, setRoofArea] = useState('');
  const [roofType, setRoofType] = useState('RCC (Flat)');
  const [structureType, setStructureType] = useState('Elevated');
  const [solarFreeSpace, setSolarFreeSpace] = useState('');
  const [controlRoomFreeSpace, setControlRoomFreeSpace] = useState('');
  const [earthPitPosition, setEarthPitPosition] = useState('Near Building Boundary');
  const [acCableRouting, setAcCableRouting] = useState('Surface Concealed Conduit');
  const [buildingAge, setBuildingAge] = useState('5');
  const [roofAccess, setRoofAccess] = useState('Permanent Staircase');
  const [rooftopHeight, setRooftopHeight] = useState('12');
  const [parapetHeight, setParapetHeight] = useState('3.5');
  const [numberOfFloors, setNumberOfFloors] = useState('2');
  const [siteAccess, setSiteAccess] = useState('Direct Road Access');
  const [siteDistance, setSiteDistance] = useState('0.2');

  // Section 5: Photographs & Reports
  const [buildingImage, setBuildingImage] = useState<File | null>(null);
  const [buildingImagePreview, setBuildingImagePreview] = useState('');
  const [roofImage, setRoofImage] = useState<File | null>(null);
  const [roofImagePreview, setRoofImagePreview] = useState('');
  const [controlRoomImage, setControlRoomImage] = useState<File | null>(null);
  const [controlRoomImagePreview, setControlRoomImagePreview] = useState('');
  const [image4, setImage4] = useState<File | null>(null);
  const [image4Preview, setImage4Preview] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  // Status & Feedback
  const [submitting, setSubmitting] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(false);
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

  // If queryId is present, load survey for edit (API 3: GET /jammu/srt70mw/edit-survey?id=1)
  useEffect(() => {
    if (!queryId) return;

    const loadEditData = async () => {
      setLoadingInitial(true);
      try {
        const item: JammuSrtSurveyItem = await jammuSrtSurveyService.getSurveyForEdit(queryId);
        if (item) {
          if (item.district) setDistrict(item.district);
          const dp = item.dept_name || item.department;
          if (dp) {
            setDepartment(dp);
            setDeptName(dp);
          }
          setSiteName(item.site_name || '');
          setSurveySiteAddress(item.survey_site_address || item.address || '');
          setNearLandmark(item.near_landmark || '');
          setProposedCapacity(item.proposed_capacity ? String(item.proposed_capacity) : '');

          setContactPerson(item.contact_person || '');
          setContactNo(item.contact_no ? String(item.contact_no) : '');
          setLatitude(item.latitude ? String(item.latitude) : '');
          setLongitude(item.longitude ? String(item.longitude) : '');

          if (item.load_type) setLoadType(item.load_type);
          if (item.connection_type) setConnectionType(item.connection_type);
          if (item.meter_connection_type) setMeterConnectionType(item.meter_connection_type);
          setCaNo(item.ca_no || '');
          setMeterNo(item.meter_no || '');
          setSanctionLoad(item.sanction_load ? String(item.sanction_load) : '');
          setInstantaneousLoad(item.instantaneous_load ? String(item.instantaneous_load) : '');
          if (item.grid_availability) setGridPower(item.grid_availability);
          if (item.three_phase_available) setThreePhaseAvailable(item.three_phase_available);
          if (item.missing_phase) setMissingPhase(item.missing_phase);
          if (item.ltdb_status) setLtdbStatus(item.ltdb_status);

          const dgAvail = String(item.existing_dg_set ?? item.dg_set_available ?? '0');
          setDgSetAvailable(dgAvail === '1' || dgAvail.toLowerCase() === 'yes' ? '1' : '0');
          setDgSetCapacity(item.dg_set_capacity || '');
          setDgSetMake(item.dg_set_make || '');

          if (item.roof_condition) setRoofCondition(item.roof_condition);
          setRoofArea(item.roof_area ? String(item.roof_area) : '');
          if (item.roof_type) setRoofType(item.roof_type);
          if (item.structure_type) setStructureType(item.structure_type);
          setSolarFreeSpace(item.solar_free_space ? String(item.solar_free_space) : '');
          setControlRoomFreeSpace(item.control_room_free_space ? String(item.control_room_free_space) : '');
          const ep = item.earth_pit || item.earth_pit_position;
          if (ep) setEarthPitPosition(ep);
          if (item.ac_cable_routing) setAcCableRouting(item.ac_cable_routing);
          setBuildingAge(item.building_age ? String(item.building_age) : '5');
          if (item.roof_access) setRoofAccess(item.roof_access);
          setRooftopHeight(item.rooftop_height ? String(item.rooftop_height) : '12');
          setParapetHeight(item.parapet_height ? String(item.parapet_height) : '3.5');
          setNumberOfFloors(item.number_of_floors ? String(item.number_of_floors) : '2');
          if (item.site_access) setSiteAccess(item.site_access);
          setSiteDistance(item.site_distance ? String(item.site_distance) : '0.2');

          const bImg = item.image1 || item.building_image;
          if (bImg) setBuildingImagePreview(resolveJammuSurveyMediaUrl(bImg, 'srt_image'));
          const rImg = item.image2 || item.roof_image;
          if (rImg) setRoofImagePreview(resolveJammuSurveyMediaUrl(rImg, 'srt_image'));
          const crImg = item.image3 || item.control_room_image;
          if (crImg) setControlRoomImagePreview(resolveJammuSurveyMediaUrl(crImg, 'srt_image'));
          if (item.image4) setImage4Preview(resolveJammuSurveyMediaUrl(item.image4, 'srt_image'));
        }
      } catch (err: any) {
        console.error('[AddJammuSRT70MW] loadEditData error:', err);
        setFeedback({ type: 'danger', text: err?.message || 'Failed to load SRT survey for editing.' });
      } finally {
        setLoadingInitial(false);
      }
    };

    loadEditData();
  }, [queryId]);

  // GPS Auto-detect
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
            alert(`Unable to retrieve GPS coordinates (${err2.message}). Please enter manually.`);
          },
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // Form Submit Handler
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!district.trim()) {
      setFeedback({ type: 'danger', text: 'District is required.' });
      scrollTo(sec1);
      return;
    }
    if (!department.trim()) {
      setFeedback({ type: 'danger', text: 'Department is required.' });
      scrollTo(sec1);
      return;
    }
    if (!siteName.trim()) {
      setFeedback({ type: 'danger', text: 'Site Name is required.' });
      scrollTo(sec1);
      return;
    }
    if (!surveySiteAddress.trim() || !nearLandmark.trim()) {
      setFeedback({ type: 'danger', text: 'Survey Site Address and Landmark are required.' });
      scrollTo(sec1);
      return;
    }
    if (!proposedCapacity.trim()) {
      setFeedback({ type: 'danger', text: 'Proposed Capacity (kW) is required.' });
      scrollTo(sec1);
      return;
    }

    const cleanContact = contactNo.replace(/\D/g, '').trim();
    if (cleanContact.length < 10 || cleanContact.length > 12) {
      setFeedback({ type: 'danger', text: 'Contact Number must be between 10 and 12 digits.' });
      scrollTo(sec2);
      return;
    }
    if (!contactPerson.trim()) {
      setFeedback({ type: 'danger', text: 'Contact Person is required.' });
      scrollTo(sec2);
      return;
    }
    if (!latitude.trim() || !longitude.trim()) {
      setFeedback({ type: 'danger', text: 'Latitude and Longitude are required. Click "Auto-detect GPS".' });
      scrollTo(sec2);
      return;
    }

    if (!caNo.trim() || !meterNo.trim()) {
      setFeedback({ type: 'danger', text: 'CA Number and Meter Number are required.' });
      scrollTo(sec3);
      return;
    }
    if (!sanctionLoad.trim() || !instantaneousLoad.trim()) {
      setFeedback({ type: 'danger', text: 'Sanction Load and Instantaneous Load are required.' });
      scrollTo(sec3);
      return;
    }

    if (!roofArea.trim() || !solarFreeSpace.trim()) {
      setFeedback({ type: 'danger', text: 'Roof Area and Solar Free Space are required.' });
      scrollTo(sec4);
      return;
    }

    // On create mode, the three photos are strictly required
    if (!isUpdateMode) {
      if (!buildingImage) {
        setFeedback({ type: 'danger', text: 'Building Image is required.' });
        scrollTo(sec5);
        return;
      }
      if (!roofImage) {
        setFeedback({ type: 'danger', text: 'Roof Image is required.' });
        scrollTo(sec5);
        return;
      }
      if (!controlRoomImage) {
        setFeedback({ type: 'danger', text: 'Control Room Image is required.' });
        scrollTo(sec5);
        return;
      }
    }

    try {
      setSubmitting(true);
      setFeedback(null);

      const fd = new FormData();
      if (isUpdateMode && queryId) {
        fd.append('id', queryId);
        fd.append('dept_name', deptName || department);
      }

      fd.append('district', district.trim());
      fd.append('department', department.trim());
      fd.append('site_name', siteName.trim());
      fd.append('survey_site_address', surveySiteAddress.trim());
      fd.append('near_landmark', nearLandmark.trim());
      fd.append('proposed_capacity', proposedCapacity.trim());
      fd.append('contact_person', contactPerson.trim());
      fd.append('contact_no', cleanContact);
      fd.append('latitude', latitude.trim());
      fd.append('longitude', longitude.trim());
      fd.append('load_type', loadType);
      fd.append('connection_type', connectionType);
      fd.append('meter_connection_type', meterConnectionType);
      fd.append('ca_no', caNo.trim());
      fd.append('meter_no', meterNo.trim());
      fd.append('sanction_load', sanctionLoad.trim());
      fd.append('instantaneous_load', instantaneousLoad.trim());
      fd.append('grid_availability', gridAvailability);
      fd.append('three_phase_available', threePhaseAvailable);
      fd.append('missing_phase', missingPhase);
      fd.append('ltdb_status', ltdbStatus);
      fd.append('dg_set_available', dgSetAvailable);
      if (dgSetAvailable === '1') {
        fd.append('dg_set_capacity', dgSetCapacity.trim());
        fd.append('dg_set_make', dgSetMake.trim());
      }
      fd.append('roof_condition', roofCondition);
      fd.append('roof_area', roofArea.trim());
      fd.append('roof_type', roofType);
      fd.append('structure_type', structureType);
      fd.append('solar_free_space', solarFreeSpace.trim());
      fd.append('control_room_free_space', controlRoomFreeSpace.trim());
      fd.append('earth_pit_position', earthPitPosition);
      fd.append('ac_cable_routing', acCableRouting);
      fd.append('building_age', buildingAge.trim() || '5');
      fd.append('roof_access', roofAccess);
      fd.append('rooftop_height', rooftopHeight.trim() || '12');
      fd.append('parapet_height', parapetHeight.trim() || '3.5');
      fd.append('number_of_floors', numberOfFloors.trim() || '2');
      fd.append('site_access', siteAccess);
      fd.append('site_distance', siteDistance.trim() || '0.2');

      // Photos
      if (buildingImage) fd.append('building_image', buildingImage);
      if (roofImage) fd.append('roof_image', roofImage);
      if (controlRoomImage) fd.append('control_room_image', controlRoomImage);
      if (image4) fd.append('image4', image4);
      if (pdfFile) fd.append('pdf', pdfFile);

      if (isUpdateMode) {
        const res = await jammuSrtSurveyService.updateSurvey(fd);
        setFeedback({ type: 'success', text: res.message || 'Jammu SRT Survey Update Successfully!!!' });
      } else {
        const res = await jammuSrtSurveyService.addSurvey(fd);
        setFeedback({ type: 'success', text: res.message || 'Jammu SRT Survey Completed Successfully!!!' });
      }

      setTimeout(() => {
        navigate('/v/jammu/survey/srt-70mw/view-data');
      }, 1500);
    } catch (err: any) {
      console.error('[AddJammuSRT70MW] submit error:', err);
      setFeedback({ type: 'danger', text: err?.message || 'Failed to submit SRT survey.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="solar-erp-page jammu-srt-form">
      <style>{SINGLE_CARD_FORM_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title={isUpdateMode ? `Update 70MW SRT Survey #${queryId}` : 'Add Jammu SRT 70MW Survey'}
        subtitle="Record technical rooftop solar feasibility, DG set integration, electrical infrastructure, and high-resolution site photography"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Jammu & Kashmir' },
          { label: 'Survey' },
          { label: 'SRT 70MW' },
          { label: isUpdateMode ? 'Update Survey' : 'Add 70MW SRT' },
        ]}
        actions={
          <Link to="/v/jammu/survey/srt-70mw/view-data" className="ax-btn ax-btn--secondary ax-btn--sm">
            View 70MW SRT Surveys
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
                {isUpdateMode ? `Edit Jammu SRT 70MW Survey #${queryId}` : 'Add Jammu SRT 70MW Survey'}
              </h2>
              <p className="ax-card__subtitle" style={{ fontSize: '0.85rem', color: 'var(--ax-text-muted, #64748b)', margin: '2px 0 0' }}>
                All required measurements marked with asterisk must be verified by certified field personnel.
              </p>
            </div>
            {isUpdateMode && (
              <span className="ax-badge ax-badge--soft ax-badge--info" style={{ fontWeight: 600 }}>
                Editing Survey #{queryId}
              </span>
            )}
          </div>

          {/* Quick Nav Pills */}
          <div className="swp-section-pills" role="navigation" aria-label="Quick section navigation">
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec1)}>
              <span className="pill-num">1</span> General Info
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec2)}>
              <span className="pill-num">2</span> Location & Contact
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec3)}>
              <span className="pill-num">3</span> Technical Info
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec4)}>
              <span className="pill-num">4</span> Civil / Structural
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec5)}>
              <span className="pill-num">5</span> Other Info
            </button>
          </div>
        </div>

        <div className="ax-card__body">
          {loadingInitial && (
            <div style={{ padding: '20px', textAlign: 'center', color: '#2559bf' }}>
              <span className="ax-spinner" /> Loading existing survey specifications for editing…
            </div>
          )}

          {/* ════════ Section 1: Basic & Site Details ════════ */}
          <div ref={sec1} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>1. Basic & Site Details</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Administrative district, institutional department, site address, and proposed capacity
                </span>
              </div>
            </div>

            <div className="ax-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <FloatingInput
                as="select"
                label="District"
                name="district"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                required
              >
                {['Jammu', 'Samba', 'Kathua', 'Udhampur', 'Reasi', 'Rajouri', 'Poonch', 'Doda', 'Ramban', 'Kishtwar'].map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </FloatingInput>

              <FloatingInput
                as="select"
                label="Department"
                name="department"
                value={department}
                onChange={(e) => {
                  setDepartment(e.target.value);
                  setDeptName(e.target.value);
                }}
                required
              >
                {['Education', 'Health', 'Revenue', 'Police', 'Agriculture', 'PHE / Jal Shakti', 'PWD', 'Forest', 'Other'].map((dp) => (
                  <option key={dp} value={dp}>{dp}</option>
                ))}
              </FloatingInput>

              <FloatingInput
                label="Site Name (Free Text)"
                name="site_name"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                placeholder="e.g. Govt Higher Secondary School"
                required
              />

              <FloatingInput
                label="Proposed Capacity (kW)"
                name="proposed_capacity"
                type="number"
                value={proposedCapacity}
                onChange={(e) => setProposedCapacity(e.target.value)}
                placeholder="e.g. 20"
                required
              />

              <div style={{ gridColumn: 'span 2' }}>
                <FloatingInput
                  label="Survey Site Full Address"
                  name="survey_site_address"
                  value={surveySiteAddress}
                  onChange={(e) => setSurveySiteAddress(e.target.value)}
                  placeholder="Enter complete building & village / ward address"
                  required
                />
              </div>

              <FloatingInput
                label="Nearest Landmark"
                name="near_landmark"
                value={nearLandmark}
                onChange={(e) => setNearLandmark(e.target.value)}
                placeholder="e.g. Main Bus Stand"
                required
              />
            </div>
          </div>

          <hr className="swp-section-divider" />

          {/* ════════ Section 2: Location & Personnel ════════ */}
          <div ref={sec2} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>2. Location Coordinates & Contact Personnel</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Institutional representative contact details and satellite GPS coordinates
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

            <div className="ax-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <FloatingInput
                label="Contact Person Name"
                name="contact_person"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="Principal / In-Charge / Officer"
                required
              />

              <FloatingInput
                label="Contact Number (10-12 digits)"
                name="contact_no"
                type="tel"
                value={contactNo}
                onChange={(e) => setContactNo(e.target.value.replace(/\D/g, '').slice(0, 12))}
                placeholder="e.g. 9876543210"
                required
              />

              <FloatingInput
                label="Latitude"
                name="latitude"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="e.g. 32.7266"
                required
              />

              <FloatingInput
                label="Longitude"
                name="longitude"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="e.g. 74.8570"
                required
              />
            </div>
          </div>

          <hr className="swp-section-divider" />

          {/* ════════ Section 3: Electrical & Grid Audit ════════ */}
          <div ref={sec3} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>3. Electrical & Grid Audit Parameters</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Consumer account, meter specs, loads, grid reliability, and backup DG set availability
                </span>
              </div>
            </div>

            <div className="ax-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '16px' }}>
              <FloatingInput
                as="select"
                label="Load Type"
                name="load_type"
                value={loadType}
                onChange={(e) => setLoadType(e.target.value)}
                required
              >
                <option value="Commercial">Commercial</option>
                <option value="Institutional">Institutional</option>
                <option value="Domestic">Domestic</option>
                <option value="Industrial">Industrial</option>
              </FloatingInput>

              <FloatingInput
                as="select"
                label="Connection Type"
                name="connection_type"
                value={connectionType}
                onChange={(e) => setConnectionType(e.target.value)}
                required
              >
                <option value="LT">LT (Low Tension)</option>
                <option value="HT">HT (High Tension)</option>
              </FloatingInput>

              <FloatingInput
                as="select"
                label="Meter Connection Type"
                name="meter_connection_type"
                value={meterConnectionType}
                onChange={(e) => setMeterConnectionType(e.target.value)}
                required
              >
                <option value="Three Phase">Three Phase</option>
                <option value="Single Phase">Single Phase</option>
                <option value="CT Operated">CT Operated</option>
              </FloatingInput>

              <FloatingInput
                label="CA Number (Consumer No.)"
                name="ca_no"
                value={caNo}
                onChange={(e) => setCaNo(e.target.value)}
                placeholder="Enter Consumer CA Number"
                required
              />

              <FloatingInput
                label="Meter Number"
                name="meter_no"
                value={meterNo}
                onChange={(e) => setMeterNo(e.target.value)}
                placeholder="Enter Meter Serial No"
                required
              />

              <FloatingInput
                label="Sanction Load (kW)"
                name="sanction_load"
                type="number"
                value={sanctionLoad}
                onChange={(e) => setSanctionLoad(e.target.value)}
                placeholder="e.g. 25"
                required
              />

              <FloatingInput
                label="Instantaneous Load (kW)"
                name="instantaneous_load"
                type="number"
                value={instantaneousLoad}
                onChange={(e) => setInstantaneousLoad(e.target.value)}
                placeholder="e.g. 18"
                required
              />

              <FloatingInput
                as="select"
                label="Grid Availability"
                name="grid_availability"
                value={gridAvailability}
                onChange={(e) => setGridAvailability(e.target.value)}
                required
              >
                <option value="Yes">Yes (Reliable 18+ hrs)</option>
                <option value="Intermittent">Intermittent</option>
                <option value="No">No</option>
              </FloatingInput>

              <FloatingInput
                as="select"
                label="Three Phase Available"
                name="three_phase_available"
                value={threePhaseAvailable}
                onChange={(e) => setThreePhaseAvailable(e.target.value)}
                required
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </FloatingInput>

              <FloatingInput
                as="select"
                label="Missing Phase"
                name="missing_phase"
                value={missingPhase}
                onChange={(e) => setMissingPhase(e.target.value)}
                required
              >
                <option value="No">No (All 3 phases OK)</option>
                <option value="Yes">Yes</option>
              </FloatingInput>

              <FloatingInput
                as="select"
                label="LTDB Status"
                name="ltdb_status"
                value={ltdbStatus}
                onChange={(e) => setLtdbStatus(e.target.value)}
                required
              >
                <option value="Available">Available & Functional</option>
                <option value="Upgrade Needed">Upgrade Needed</option>
                <option value="Not Available">Not Available</option>
              </FloatingInput>

              {/* DG Set */}
              <FloatingInput
                as="select"
                label="DG Set Available"
                name="dg_set_available"
                value={dgSetAvailable}
                onChange={(e) => setDgSetAvailable(e.target.value)}
                required
              >
                <option value="0">No</option>
                <option value="1">Yes</option>
              </FloatingInput>

              {dgSetAvailable === '1' && (
                <>
                  <FloatingInput
                    label="DG Set Capacity (kVA)"
                    name="dg_set_capacity"
                    value={dgSetCapacity}
                    onChange={(e) => setDgSetCapacity(e.target.value)}
                    placeholder="e.g. 50 kVA"
                    required
                  />

                  <FloatingInput
                    label="DG Set Make / Manufacturer"
                    name="dg_set_make"
                    value={dgSetMake}
                    onChange={(e) => setDgSetMake(e.target.value)}
                    placeholder="e.g. Kirloskar / Cummins"
                    required
                  />
                </>
              )}
            </div>
          </div>

          <hr className="swp-section-divider" />

          {/* ════════ Section 4: Rooftop & Structural Details ════════ */}
          <div ref={sec4} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>4. Rooftop & Structural Details</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Rooftop dimensions, structure mounting orientation, inverter room, and cable routing
                </span>
              </div>
            </div>

            <div className="ax-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '16px' }}>
              <FloatingInput
                as="select"
                label="Roof Condition"
                name="roof_condition"
                value={roofCondition}
                onChange={(e) => setRoofCondition(e.target.value)}
                required
              >
                <option value="Good">Good (Concrete RCC)</option>
                <option value="Average">Average</option>
                <option value="Tin Shed">Tin / Metal Shed</option>
                <option value="Poor">Poor</option>
              </FloatingInput>

              <FloatingInput
                as="select"
                label="Roof Type"
                name="roof_type"
                value={roofType}
                onChange={(e) => setRoofType(e.target.value)}
                required
              >
                <option value="RCC (Flat)">RCC (Flat)</option>
                <option value="Sloped Metal Sheet">Sloped Metal Sheet</option>
                <option value="Asbestos Sheet">Asbestos Sheet</option>
              </FloatingInput>

              <FloatingInput
                as="select"
                label="Proposed Structure Type"
                name="structure_type"
                value={structureType}
                onChange={(e) => setStructureType(e.target.value)}
                required
              >
                <option value="Elevated">Elevated HDG Structure</option>
                <option value="Standard MMS">Standard MMS (Ballast)</option>
                <option value="Super Elevated">Super Elevated (Gazebo type)</option>
              </FloatingInput>

              <FloatingInput
                label="Total Roof Area (Sq. Ft.)"
                name="roof_area"
                type="number"
                value={roofArea}
                onChange={(e) => setRoofArea(e.target.value)}
                placeholder="e.g. 4000"
                required
              />

              <FloatingInput
                label="Solar Free Space (Sq. Ft.)"
                name="solar_free_space"
                type="number"
                value={solarFreeSpace}
                onChange={(e) => setSolarFreeSpace(e.target.value)}
                placeholder="e.g. 3000"
                required
              />

              <FloatingInput
                label="Control Room Free Space (Sq. Ft.)"
                name="control_room_free_space"
                type="number"
                value={controlRoomFreeSpace}
                onChange={(e) => setControlRoomFreeSpace(e.target.value)}
                placeholder="e.g. 120"
                required
              />

              <FloatingInput
                as="select"
                label="Earth Pit Position"
                name="earth_pit_position"
                value={earthPitPosition}
                onChange={(e) => setEarthPitPosition(e.target.value)}
                required
              >
                <option value="Near Building Boundary">Near Building Boundary</option>
                <option value="Ground Yard">Ground Yard</option>
                <option value="New Ground Required">New Ground Required</option>
              </FloatingInput>

              <FloatingInput
                as="select"
                label="AC Cable Routing"
                name="ac_cable_routing"
                value={acCableRouting}
                onChange={(e) => setAcCableRouting(e.target.value)}
                required
              >
                <option value="Surface Concealed Conduit">Surface Concealed Conduit</option>
                <option value="External Cable Tray">External Cable Tray</option>
                <option value="Underground Trench">Underground Trench</option>
              </FloatingInput>

              <FloatingInput
                label="Building Age (Years)"
                name="building_age"
                type="number"
                value={buildingAge}
                onChange={(e) => setBuildingAge(e.target.value)}
                placeholder="e.g. 5"
                required
              />

              <FloatingInput
                as="select"
                label="Roof Access"
                name="roof_access"
                value={roofAccess}
                onChange={(e) => setRoofAccess(e.target.value)}
                required
              >
                <option value="Permanent Staircase">Permanent Staircase</option>
                <option value="External Metal Ladder">External Metal Ladder</option>
                <option value="Manhole Access">Manhole Access</option>
              </FloatingInput>

              <FloatingInput
                label="Rooftop Height (Ft.)"
                name="rooftop_height"
                type="number"
                value={rooftopHeight}
                onChange={(e) => setRooftopHeight(e.target.value)}
                placeholder="e.g. 12"
                required
              />

              <FloatingInput
                label="Parapet Height (Ft.)"
                name="parapet_height"
                type="number"
                value={parapetHeight}
                onChange={(e) => setParapetHeight(e.target.value)}
                placeholder="e.g. 3.5"
                required
              />

              <FloatingInput
                label="Number of Floors"
                name="number_of_floors"
                type="number"
                value={numberOfFloors}
                onChange={(e) => setNumberOfFloors(e.target.value)}
                placeholder="e.g. 2"
                required
              />

              <FloatingInput
                as="select"
                label="Site Access"
                name="site_access"
                value={siteAccess}
                onChange={(e) => setSiteAccess(e.target.value)}
                required
              >
                <option value="Direct Road Access">Direct Road Access</option>
                <option value="Narrow Lane">Narrow Lane</option>
                <option value="Hilly Terrain">Hilly Terrain</option>
              </FloatingInput>

              <FloatingInput
                label="Distance from Main Road (km)"
                name="site_distance"
                type="number"
                value={siteDistance}
                onChange={(e) => setSiteDistance(e.target.value)}
                placeholder="e.g. 0.2"
                required
              />
            </div>
          </div>

          <hr className="swp-section-divider" />

          {/* ════════ Section 5: Photographs & Reports ════════ */}
          <div ref={sec5} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>5. Photographic Evidence & Survey Reports</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Clear field photographs of building front, rooftop area, control room / LTDB, and optional PDF drawing
                </span>
              </div>
            </div>

            <div className="jammu-upload-grid">
              <UploadDropzone
                id="srt_building_image"
                label="Building Overview Photograph"
                required={!isUpdateMode}
                file={buildingImage}
                preview={buildingImagePreview}
                onSelect={(f) => {
                  setBuildingImage(f);
                  setBuildingImagePreview(URL.createObjectURL(f));
                }}
                onRemove={() => {
                  setBuildingImage(null);
                  setBuildingImagePreview('');
                }}
              />

              <UploadDropzone
                id="srt_roof_image"
                label="Rooftop Area Photograph"
                required={!isUpdateMode}
                file={roofImage}
                preview={roofImagePreview}
                onSelect={(f) => {
                  setRoofImage(f);
                  setRoofImagePreview(URL.createObjectURL(f));
                }}
                onRemove={() => {
                  setRoofImage(null);
                  setRoofImagePreview('');
                }}
              />

              <UploadDropzone
                id="srt_control_room_image"
                label="Control Room / LTDB Photograph"
                required={!isUpdateMode}
                file={controlRoomImage}
                preview={controlRoomImagePreview}
                onSelect={(f) => {
                  setControlRoomImage(f);
                  setControlRoomImagePreview(URL.createObjectURL(f));
                }}
                onRemove={() => {
                  setControlRoomImage(null);
                  setControlRoomImagePreview('');
                }}
              />

              <UploadDropzone
                id="srt_image4"
                label="Meter / Additional Photograph"
                file={image4}
                preview={image4Preview}
                onSelect={(f) => {
                  setImage4(f);
                  setImage4Preview(URL.createObjectURL(f));
                }}
                onRemove={() => {
                  setImage4(null);
                  setImage4Preview('');
                }}
              />

              <UploadDropzone
                id="srt_pdf_file"
                label="Survey Engineering Report / Drawing (PDF)"
                accept="application/pdf"
                file={pdfFile}
                onSelect={(f) => setPdfFile(f)}
                onRemove={() => setPdfFile(null)}
              />
            </div>
          </div>

          {/* ════════ Submit Footer ════════ */}
          <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid var(--ax-border, #e2e8f0)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <Link to="/v/jammu/survey/srt-70mw/view-data" className="ax-btn ax-btn--secondary">
              Cancel
            </Link>
            <button
              type="submit"
              className="ax-btn ax-btn--primary"
              disabled={submitting}
              style={{ minWidth: 200 }}
            >
              {submitting ? 'Submitting Survey…' : isUpdateMode ? 'Update 70MW SRT Survey' : 'Submit 70MW SRT Survey'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default AddJammuSRT70MWSingleCard;


