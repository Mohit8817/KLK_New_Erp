import { useState, useEffect, useRef, useMemo, useCallback, type FormEvent, type ChangeEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  jammuRescoSurveyService,
  resolveJammuSurveyMediaUrl,
  type JammuRescoDropdownSite,
  type JammuRescoSiteDetail,
  type JammuRescoSurveyItem,
} from '../../jammu-services';

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
                  {file ? `${(file.size / 1024).toFixed(0)} KB · Ready to upload` : 'Existing file attached'}
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

export function Pending_Survey() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Query parameter support: siteId (pre-select) or editId / id (update mode)
  const querySiteId = searchParams.get('siteId') || searchParams.get('site_id');
  const queryEditId = searchParams.get('editId') || searchParams.get('id');

  const isUpdateMode = Boolean(queryEditId);

  // Site Dropdown list (from API 2: /jk/resco-fetch-site & API 1: /jk/resco-survey)
  const [sitesList, setSitesList] = useState<JammuRescoDropdownSite[]>([]);
  const [loadingSites, setLoadingSites] = useState(false);

  // Selected Site ID & Read-only Details
  const [selectedSiteId, setSelectedSiteId] = useState<string>(querySiteId || '');
  const [siteDetail, setSiteDetail] = useState<JammuRescoSiteDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Section 3: Agency & Nodal Details
  const [siteAddress, setSiteAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [agencyPersonName, setAgencyPersonName] = useState('');
  const [agencyPersonContact, setAgencyPersonContact] = useState('');
  const [nodalPerson, setNodalPerson] = useState('');
  const [contactNodal, setContactNodal] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  // Section 4: Electrical & Metering
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

  // Section 5: Rooftop & Structural Details
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

  // Section 6: Feasibility & Media Uploads
  const [siteFeasible, setSiteFeasible] = useState('Feasible');
  const [buildingImage, setBuildingImage] = useState<File | null>(null);
  const [buildingImagePreview, setBuildingImagePreview] = useState('');
  const [roofImage, setRoofImage] = useState<File | null>(null);
  const [roofImagePreview, setRoofImagePreview] = useState('');
  const [controlRoomImage, setControlRoomImage] = useState<File | null>(null);
  const [controlRoomImagePreview, setControlRoomImagePreview] = useState('');
  const [image4, setImage4] = useState<File | null>(null);
  const [image4Preview, setImage4Preview] = useState('');
  const [image5, setImage5] = useState<File | null>(null);
  const [image5Preview, setImage5Preview] = useState('');
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
  const sec6 = useRef<HTMLDivElement>(null);

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // 1. Fetch Dropdown Sites (API 2)
  const fetchSites = useCallback(async () => {
    setLoadingSites(true);
    try {
      const list = await jammuRescoSurveyService.fetchSites();
      if (Array.isArray(list) && list.length > 0) {
        setSitesList(list);
      } else {
        // Fallback to pending survey sites API 1
        const pending = await jammuRescoSurveyService.getPendingSurveys();
        setSitesList(
          pending
            .filter((p) => p && p.site_name && !p.site_name.toLowerCase().includes('dummy') && !p.site_name.toLowerCase().includes('fake'))
            .map((p) => ({
              id: p.id,
              site_name: p.site_name,
              uid: p.uid,
            }))
        );
      }
    } catch (err: any) {
      console.warn('[Pending_Survey] fetchSites error:', err);
      try {
        const pending = await jammuRescoSurveyService.getPendingSurveys();
        setSitesList(
          pending
            .filter((p) => p && p.site_name && !p.site_name.toLowerCase().includes('dummy') && !p.site_name.toLowerCase().includes('fake'))
            .map((p) => ({
              id: p.id,
              site_name: p.site_name,
              uid: p.uid,
            }))
        );
      } catch {
        setSitesList([]);
      }
    } finally {
      setLoadingSites(false);
    }
  }, []);

  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  // 2. Load Site Detail when selected (API 3)
  const handleSiteSelect = async (siteIdStr: string) => {
    setSelectedSiteId(siteIdStr);
    setSiteDetail(null);
    setFeedback(null);

    if (!siteIdStr) return;

    try {
      setLoadingDetail(true);
      const detail = await jammuRescoSurveyService.fetchSiteDetail(siteIdStr);
      if (detail) {
        setSiteDetail(detail);
        if (detail.address) setSiteAddress(detail.address);
      }
    } catch (err: any) {
      console.warn('[Pending_Survey] fetchSiteDetail error:', err);
      setFeedback({ type: 'danger', text: err?.message || 'Failed to load site details.' });
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    if (querySiteId && !isUpdateMode) {
      handleSiteSelect(querySiteId);
    }
  }, [querySiteId, isUpdateMode]);

  // 3. Load Survey for Update if in Update Mode (API 6)
  useEffect(() => {
    if (!queryEditId) return;

    const loadUpdateData = async () => {
      setLoadingDetail(true);
      try {
        const item: JammuRescoSurveyItem = await jammuRescoSurveyService.getSurveyForUpdate(queryEditId);
        if (item) {
          setSelectedSiteId(String(item.site_name || item.id || queryEditId));
          setSiteDetail({
            id: item.id,
            uid: item.uid,
            state: item.state,
            district: item.district,
            dept_name: item.dept_name || item.department,
            site_name: item.site_name,
            address: item.address || item.site_address,
            ca_no: item.ca_no,
            division: item.division,
            sub_division: item.sub_division,
          });

          setSiteAddress(item.site_address || item.address || '');
          setLandmark(item.landmark || item.near_landmark || '');
          setAgencyPersonName(item.agency_person_name || '');
          setAgencyPersonContact(item.agency_person_contact || '');
          setNodalPerson(item.nodal_person || '');
          setContactNodal(item.contact_nodal || '');
          setLatitude(item.latitude ? String(item.latitude) : '');
          setLongitude(item.longitude ? String(item.longitude) : '');

          if (item.load_type) setLoadType(item.load_type);
          if (item.connection_phase) setConnectionPhase(item.connection_phase);
          if (item.meter_connection) setMeterConnection(item.meter_connection);
          setMeterNumber(item.meter_number || '');
          if (item.meter_type) setMeterType(item.meter_type);
          setSanctionLoad(item.sanction_load ? String(item.sanction_load) : '');
          setConnectedLoad(item.connected_load ? String(item.connected_load) : '');
          if (item.grid_power) setGridPower(item.grid_power);
          if (item.ltdb_present) setLtdbPresent(item.ltdb_present);
          if (item.all_3_phase_ltdb) setAll3PhaseLtdb(item.all_3_phase_ltdb);
          if (item.missing_phase) setMissingPhase(item.missing_phase);

          if (item.roof_condition) setRoofCondition(item.roof_condition);
          setAreaRoof(item.area_roof ? String(item.area_roof) : '');
          setFreeSpaceSolar(item.free_space_solar ? String(item.free_space_solar) : '');
          setFreeSpaceInverter(item.free_space_inverter ? String(item.free_space_inverter) : '');
          if (item.earth_pit) setEarthPit(item.earth_pit);
          setBuildingAge(item.building_age ? String(item.building_age) : '');
          if (item.roof_access) setRoofAccess(item.roof_access);
          setRooftopHeight(item.rooftop_height ? String(item.rooftop_height) : '');
          setParapetHeight(item.parapet_height ? String(item.parapet_height) : '');
          setFloorsNumber(item.floors_number ? String(item.floors_number) : '1');
          if (item.water_source) setWaterSource(item.water_source);
          if (item.site_access) setSiteAccess(item.site_access);
          setSiteDistance(item.site_distance ? String(item.site_distance) : '0');
          setSurveyRemarks(item.survey_remarks || item.remarks || '');
          if (item.site_feasible) setSiteFeasible(item.site_feasible);

          if (item.building_image) setBuildingImagePreview(resolveJammuSurveyMediaUrl(item.building_image, 'resco_image'));
          if (item.roof_image) setRoofImagePreview(resolveJammuSurveyMediaUrl(item.roof_image, 'resco_image'));
          if (item.control_room_image) setControlRoomImagePreview(resolveJammuSurveyMediaUrl(item.control_room_image, 'resco_image'));
          if (item.image4) setImage4Preview(resolveJammuSurveyMediaUrl(item.image4, 'resco_image'));
          if (item.image5) setImage5Preview(resolveJammuSurveyMediaUrl(item.image5, 'resco_image'));
        }
      } catch (err: any) {
        console.error('[Pending_Survey] loadUpdateData error:', err);
        setFeedback({ type: 'danger', text: err?.message || 'Failed to load survey record for editing.' });
      } finally {
        setLoadingDetail(false);
      }
    };

    loadUpdateData();
  }, [queryEditId]);

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
        console.warn('High accuracy geolocation failed, trying standard...', err);
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

    if (!isUpdateMode && !selectedSiteId) {
      setFeedback({ type: 'danger', text: 'Please select a site to survey.' });
      scrollTo(sec1);
      return;
    }

    if (!siteAddress.trim()) {
      setFeedback({ type: 'danger', text: 'Site Address is required.' });
      scrollTo(sec3);
      return;
    }
    if (!landmark.trim()) {
      setFeedback({ type: 'danger', text: 'Nearest Landmark is required.' });
      scrollTo(sec3);
      return;
    }
    if (!agencyPersonName.trim()) {
      setFeedback({ type: 'danger', text: 'Agency Contact Person is required.' });
      scrollTo(sec3);
      return;
    }
    if (!agencyPersonContact.trim()) {
      setFeedback({ type: 'danger', text: 'Agency Contact Number is required.' });
      scrollTo(sec3);
      return;
    }
    if (!nodalPerson.trim()) {
      setFeedback({ type: 'danger', text: 'Nodal Person Name is required.' });
      scrollTo(sec3);
      return;
    }
    if (!contactNodal.trim()) {
      setFeedback({ type: 'danger', text: 'Nodal Person Contact Number is required.' });
      scrollTo(sec3);
      return;
    }
    if (!latitude.trim() || !longitude.trim()) {
      setFeedback({ type: 'danger', text: 'Latitude and Longitude are required. Click "Auto-detect GPS".' });
      scrollTo(sec3);
      return;
    }
    if (!meterNumber.trim()) {
      setFeedback({ type: 'danger', text: 'Meter Number is required.' });
      scrollTo(sec4);
      return;
    }
    if (!sanctionLoad.trim() || !connectedLoad.trim()) {
      setFeedback({ type: 'danger', text: 'Sanction Load and Connected Load are required.' });
      scrollTo(sec4);
      return;
    }
    if (!areaRoof.trim()) {
      setFeedback({ type: 'danger', text: 'Total Roof Area is required.' });
      scrollTo(sec5);
      return;
    }
    if (!freeSpaceSolar.trim() || !freeSpaceInverter.trim()) {
      setFeedback({ type: 'danger', text: 'Free Space for Solar & Inverter are required.' });
      scrollTo(sec5);
      return;
    }
    if (!surveyRemarks.trim()) {
      setFeedback({ type: 'danger', text: 'Survey Remarks are required.' });
      scrollTo(sec5);
      return;
    }

    // Required images check on create mode
    if (!isUpdateMode) {
      if (!buildingImage) {
        setFeedback({ type: 'danger', text: 'Building Image is required.' });
        scrollTo(sec6);
        return;
      }
      if (!roofImage) {
        setFeedback({ type: 'danger', text: 'Roof Image is required.' });
        scrollTo(sec6);
        return;
      }
      if (!controlRoomImage) {
        setFeedback({ type: 'danger', text: 'Control Room Image is required.' });
        scrollTo(sec6);
        return;
      }
    }

    try {
      setSubmitting(true);
      setFeedback(null);

      const fd = new FormData();
      if (!isUpdateMode) {
        fd.append('site_name', selectedSiteId);
      }
      fd.append('site_address', siteAddress.trim());
      fd.append('landmark', landmark.trim());
      fd.append('agency_person_name', agencyPersonName.trim());
      fd.append('agency_person_contact', agencyPersonContact.trim());
      fd.append('nodal_person', nodalPerson.trim());
      fd.append('contact_nodal', contactNodal.trim());
      fd.append('latitude', latitude.trim());
      fd.append('longitude', longitude.trim());
      fd.append('load_type', loadType);
      fd.append('connection_phase', connectionPhase);
      fd.append('meter_connection', meterConnection);
      fd.append('meter_number', meterNumber.trim());
      fd.append('meter_type', meterType);
      fd.append('sanction_load', sanctionLoad.trim());
      fd.append('connected_load', connectedLoad.trim());
      fd.append('grid_power', gridPower);
      fd.append('ltdb_present', ltdbPresent);
      fd.append('all_3_phase_ltdb', all3PhaseLtdb);
      fd.append('missing_phase', missingPhase);
      fd.append('roof_condition', roofCondition);
      fd.append('area_roof', areaRoof.trim());
      fd.append('free_space_solar', freeSpaceSolar.trim());
      fd.append('free_space_inverter', freeSpaceInverter.trim());
      fd.append('earth_pit', earthPit);
      fd.append('survey_remarks', surveyRemarks.trim());
      fd.append('building_age', buildingAge.trim() || '5');
      fd.append('roof_access', roofAccess);
      fd.append('rooftop_height', rooftopHeight.trim() || '10');
      fd.append('parapet_height', parapetHeight.trim() || '3');
      fd.append('floors_number', floorsNumber);
      fd.append('water_source', waterSource);
      fd.append('site_access', siteAccess);
      fd.append('site_distance', siteDistance.trim() || '0');
      if (siteFeasible) fd.append('site_feasible', siteFeasible);

      // Photos
      if (buildingImage) fd.append('building_image', buildingImage);
      if (roofImage) fd.append('roof_image', roofImage);
      if (controlRoomImage) fd.append('control_room_image', controlRoomImage);
      if (image4) fd.append('image4', image4);
      if (image5) fd.append('image5', image5);
      if (pdfFile) fd.append('pdf', pdfFile);

      if (isUpdateMode && queryEditId) {
        const res = await jammuRescoSurveyService.updateSurvey(queryEditId, fd);
        setFeedback({ type: 'success', text: res.message || 'Survey Updated Successfully!!!' });
      } else {
        const res = await jammuRescoSurveyService.storeSurvey(fd);
        setFeedback({ type: 'success', text: res.message || 'Survey Complete Successfully!!!' });
      }

      setTimeout(() => {
        navigate('/v/jammu/survey/resco/view-survey');
      }, 1500);
    } catch (err: any) {
      console.error('[Pending_Survey] submit error:', err);
      setFeedback({ type: 'danger', text: err?.message || 'Failed to submit survey.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="solar-erp-page jammu-survey-form">
      <style>{SINGLE_CARD_FORM_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title={isUpdateMode ? 'Update Jammu RESCO Survey' : 'Conduct Jammu RESCO Survey'}
        subtitle="Capture rooftop feasibility details, electrical specifications, access parameters, and upload site photos"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Jammu & Kashmir' },
          { label: 'Survey' },
          { label: 'RESCO' },
          { label: isUpdateMode ? 'Update Survey' : 'Pending Survey' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)' }}>
            <Link to="/v/jammu/survey/resco/assign-survey" className="ax-btn ax-btn--secondary ax-btn--sm">
              View Assigned
            </Link>
            <Link to="/v/jammu/survey/resco/view-survey" className="ax-btn ax-btn--primary ax-btn--sm">
              View Completed Surveys
            </Link>
          </div>
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
                {isUpdateMode ? `Editing Survey #${queryEditId}` : 'JK RESCO Rooftop Solar Feasibility Survey'}
              </h2>
              <p className="ax-card__subtitle" style={{ fontSize: '0.85rem', color: 'var(--ax-text-muted, #64748b)', margin: '2px 0 0' }}>
                Complete all required field measurements, electrical audit data, and GPS photographic verification.
              </p>
            </div>
            {siteDetail && (
              <span className="ax-badge ax-badge--soft ax-badge--info" style={{ fontWeight: 600 }}>
                Site: {siteDetail.site_name || siteDetail.id} {siteDetail.district ? `· ${siteDetail.district}` : ''}
              </span>
            )}
          </div>

          {/* Quick Nav Pills */}
          <div className="swp-section-pills" role="navigation" aria-label="Quick section navigation">
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec1)}>
              <span className="pill-num">1</span> Select Site
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec2)}>
              <span className="pill-num">2</span> Site Info
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec3)}>
              <span className="pill-num">3</span> Agency & Nodal
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec4)}>
              <span className="pill-num">4</span> Electrical & Metering
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec5)}>
              <span className="pill-num">5</span> Rooftop & Specs
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec6)}>
              <span className="pill-num">6</span> Photos & Feasibility
            </button>
          </div>
        </div>

        <div className="ax-card__body">
          {/* ════════ Section 1: Select Site ════════ */}
          <div ref={sec1} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>1. Select Survey Site</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Choose from allocated RESCO sites awaiting survey completion
                </span>
              </div>
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--sm"
                onClick={fetchSites}
                disabled={loadingSites}
              >
                {loadingSites ? 'Refreshing...' : '🔄 Refresh Sites'}
              </button>
            </div>

            <div className="ax-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <div className="ax-float">
                <select
                  id="jammu-survey-site-select"
                  className="ax-float__input"
                  value={selectedSiteId}
                  onChange={(e) => handleSiteSelect(e.target.value)}
                  disabled={loadingSites || submitting || isUpdateMode}
                  required={!isUpdateMode}
                >
                  <option value="">-- Select Site Name --</option>
                  {sitesList
                    .filter((item) => {
                      const name = String(item.site_name || '').trim().toLowerCase();
                      const id = String(item.id || '').trim();
                      if (!id || id === '0') return false;
                      if (name.includes('dummy') || name.includes('fake') || name.startsWith('-- select') || name.startsWith('- select')) return false;
                      return true;
                    })
                    .map((item) => (
                      <option key={item.id} value={String(item.id)}>
                        {item.site_name} {item.uid ? `(${item.uid})` : ''}
                      </option>
                    ))}
                </select>
                <label htmlFor="jammu-survey-site-select" className="ax-float__label floating">
                  Site Name <span style={{ color: 'var(--ax-danger, #ef4444)' }}>*</span>
                </label>
              </div>
            </div>

            {loadingDetail && (
              <div style={{ padding: '14px 0', color: '#2563eb', fontSize: '13px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="ax-spinner" /> Fetching official site specifications...
              </div>
            )}
          </div>

          <hr className="swp-section-divider" />

          {/* ════════ Section 2: Site Information (Read-only fetched data) ════════ */}
          <div ref={sec2} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>2. Information (Auto-populated)</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Official site master data retrieved from Jammu RESCO registry
                </span>
              </div>
            </div>

            <div className="ax-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '16px' }}>
              <FloatingInput
                label="Unique ID"
                name="info_uid"
                value={siteDetail?.uid || (selectedSiteId ? `SRT-${selectedSiteId}` : '')}
                onChange={() => {}}
                disabled
              />

              <FloatingInput
                label="State"
                name="info_state"
                value={siteDetail?.state || (selectedSiteId ? 'Jammu' : '')}
                onChange={() => {}}
                disabled
              />

              <FloatingInput
                label="District"
                name="info_district"
                value={siteDetail?.district || ''}
                onChange={() => {}}
                disabled
              />

              <FloatingInput
                label="Division"
                name="info_division"
                value={siteDetail?.division || ''}
                onChange={() => {}}
                disabled
              />

              <FloatingInput
                label="Sub Division"
                name="info_subdivision"
                value={siteDetail?.sub_division || ''}
                onChange={() => {}}
                disabled
              />

              <FloatingInput
                label="Department"
                name="info_dept"
                value={siteDetail?.dept_name || ''}
                onChange={() => {}}
                disabled
              />

              <FloatingInput
                label="Site Name"
                name="info_sitename"
                value={siteDetail?.site_name || ''}
                onChange={() => {}}
                disabled
              />

              <FloatingInput
                label="Location"
                name="info_location"
                value={siteDetail?.site_address || (siteDetail as any)?.location || ''}
                onChange={() => {}}
                disabled
              />

              <FloatingInput
                label="CA No."
                name="info_ca"
                value={siteDetail?.ca_no || ''}
                onChange={() => {}}
                disabled
              />
            </div>
          </div>

          <hr className="swp-section-divider" />

          {/* ════════ Section 3: Agency & Nodal Details ════════ */}
          <div ref={sec3} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>3. Agency & Nodal Personnel Details</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Contact details of field engineers, agency supervisors, and nodal officers
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
              <div style={{ gridColumn: 'span 2' }}>
                <FloatingInput
                  label="Survey Address"
                  name="site_address"
                  value={siteAddress}
                  onChange={(e) => setSiteAddress(e.target.value)}
                  placeholder="Enter complete site address"
                  required
                />
              </div>

              <FloatingInput
                label="Nearest Landmark"
                name="landmark"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="e.g. Near District Court"
                required
              />

              <FloatingInput
                label="Agency Contact Person Name"
                name="agency_person_name"
                value={agencyPersonName}
                onChange={(e) => setAgencyPersonName(e.target.value)}
                placeholder="Supervisor / Engineer name"
                required
              />

              <FloatingInput
                label="Agency Contact Number"
                name="agency_person_contact"
                type="tel"
                value={agencyPersonContact}
                onChange={(e) => setAgencyPersonContact(e.target.value.replace(/\D/g, '').slice(0, 12))}
                placeholder="10-12 digit mobile"
                required
              />

              <FloatingInput
                label="Nodal Person"
                name="nodal_person"
                value={nodalPerson}
                onChange={(e) => setNodalPerson(e.target.value)}
                placeholder="Department Nodal Officer"
                required
              />

              <FloatingInput
                label="Nodal Person Contact"
                name="contact_nodal"
                type="tel"
                value={contactNodal}
                onChange={(e) => setContactNodal(e.target.value.replace(/\D/g, '').slice(0, 12))}
                placeholder="10-12 digit mobile"
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

          {/* ════════ Section 4: Electrical & Metering ════════ */}
          <div ref={sec4} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>4. Electrical & Metering Audit</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Grid connection parameters, LTDB presence, sanction and connected load
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
                <option value="Industrial">Industrial</option>
                <option value="Domestic">Domestic</option>
                <option value="Institutional">Institutional</option>
                <option value="Government">Government</option>
              </FloatingInput>

              <FloatingInput
                as="select"
                label="Connection Phase"
                name="connection_phase"
                value={connectionPhase}
                onChange={(e) => setConnectionPhase(e.target.value)}
                required
              >
                <option value="1 Phase">1 Phase</option>
                <option value="3 Phase">3 Phase</option>
              </FloatingInput>

              <FloatingInput
                as="select"
                label="Meter Connection"
                name="meter_connection"
                value={meterConnection}
                onChange={(e) => setMeterConnection(e.target.value)}
                required
              >
                <option value="Single Phase">Single Phase</option>
                <option value="Three Phase">Three Phase</option>
                <option value="CT Operated">CT Operated</option>
                <option value="HT Meter">HT Meter</option>
              </FloatingInput>

              <FloatingInput
                label="Meter Number"
                name="meter_number"
                value={meterNumber}
                onChange={(e) => setMeterNumber(e.target.value)}
                placeholder="Enter Meter Number"
                required
              />

              <FloatingInput
                as="select"
                label="Meter Type"
                name="meter_type"
                value={meterType}
                onChange={(e) => setMeterType(e.target.value)}
                required
              >
                <option value="Digital">Digital</option>
                <option value="Smart Meter">Smart Meter</option>
                <option value="Electromechanical">Electromechanical</option>
              </FloatingInput>

              <FloatingInput
                label="Sanction Load (kW)"
                name="sanction_load"
                type="number"
                value={sanctionLoad}
                onChange={(e) => setSanctionLoad(e.target.value)}
                placeholder="e.g. 50"
                required
              />

              <FloatingInput
                label="Connected Load (kW)"
                name="connected_load"
                type="number"
                value={connectedLoad}
                onChange={(e) => setConnectedLoad(e.target.value)}
                placeholder="e.g. 45"
                required
              />

              <FloatingInput
                as="select"
                label="Grid Power Availability"
                name="grid_power"
                value={gridPower}
                onChange={(e) => setGridPower(e.target.value)}
                required
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </FloatingInput>

              <FloatingInput
                as="select"
                label="LTDB Present"
                name="ltdb_present"
                value={ltdbPresent}
                onChange={(e) => setLtdbPresent(e.target.value)}
                required
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </FloatingInput>

              <FloatingInput
                as="select"
                label="All 3-Phase in LTDB"
                name="all_3_phase_ltdb"
                value={all3PhaseLtdb}
                onChange={(e) => setAll3PhaseLtdb(e.target.value)}
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
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </FloatingInput>
            </div>
          </div>

          <hr className="swp-section-divider" />

          {/* ════════ Section 5: Rooftop & Structural Details ════════ */}
          <div ref={sec5} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>5. Rooftop Feasibility & Civil Specifications</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Rooftop dimensions, clear space availability, water supply, and structural access
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
                <option value="Poor">Poor (Needs Renovation)</option>
              </FloatingInput>

              <FloatingInput
                label="Total Roof Area (Sq. Ft.)"
                name="area_roof"
                type="number"
                value={areaRoof}
                onChange={(e) => setAreaRoof(e.target.value)}
                placeholder="e.g. 5000"
                required
              />

              <FloatingInput
                label="Free Space for Solar (Sq. Ft.)"
                name="free_space_solar"
                type="number"
                value={freeSpaceSolar}
                onChange={(e) => setFreeSpaceSolar(e.target.value)}
                placeholder="e.g. 3500"
                required
              />

              <FloatingInput
                label="Free Space Inverter (Sq. Ft.)"
                name="free_space_inverter"
                type="number"
                value={freeSpaceInverter}
                onChange={(e) => setFreeSpaceInverter(e.target.value)}
                placeholder="e.g. 150"
                required
              />

              <FloatingInput
                as="select"
                label="Earth Pit Position"
                name="earth_pit"
                value={earthPit}
                onChange={(e) => setEarthPit(e.target.value)}
                required
              >
                <option value="Available">Available (Near Building)</option>
                <option value="Ground Yard">Ground Yard</option>
                <option value="New Required">New Pit Required</option>
              </FloatingInput>

              <FloatingInput
                label="Building Age (Years)"
                name="building_age"
                type="number"
                value={buildingAge}
                onChange={(e) => setBuildingAge(e.target.value)}
                placeholder="e.g. 8"
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
                <option value="Staircase">Permanent Staircase</option>
                <option value="Ladder">External Metal Ladder</option>
                <option value="No Direct Access">No Direct Access</option>
              </FloatingInput>

              <FloatingInput
                label="Rooftop Height (Ft.)"
                name="rooftop_height"
                type="number"
                value={rooftopHeight}
                onChange={(e) => setRooftopHeight(e.target.value)}
                placeholder="e.g. 35"
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
                name="floors_number"
                type="number"
                value={floorsNumber}
                onChange={(e) => setFloorsNumber(e.target.value)}
                placeholder="e.g. 3"
                required
              />

              <FloatingInput
                as="select"
                label="Water Source for Cleaning"
                name="water_source"
                value={waterSource}
                onChange={(e) => setWaterSource(e.target.value)}
                required
              >
                <option value="Tap Water">Tap Water on Roof</option>
                <option value="Ground Borewell">Ground Borewell</option>
                <option value="Storage Tank">Rooftop Storage Tank</option>
                <option value="Tanker Required">Tanker Required</option>
              </FloatingInput>

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
                <option value="Crane Accessible">Crane Accessible</option>
              </FloatingInput>

              <FloatingInput
                label="Distance from Main Road (km)"
                name="site_distance"
                type="number"
                value={siteDistance}
                onChange={(e) => setSiteDistance(e.target.value)}
                placeholder="e.g. 0.5"
                required
              />

              <div style={{ gridColumn: 'span 2' }}>
                <FloatingInput
                  as="textarea"
                  label="Survey Remarks / Observations"
                  name="survey_remarks"
                  value={surveyRemarks}
                  onChange={(e) => setSurveyRemarks(e.target.value)}
                  placeholder="Record shadow analysis, cable length estimate, obstacle notes, etc."
                  required
                />
              </div>
            </div>
          </div>

          <hr className="swp-section-divider" />

          {/* ════════ Section 6: Photos & Feasibility ════════ */}
          <div ref={sec6} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>6. Feasibility Verdict & Photographic Evidence</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Upload building overview, rooftop area, electrical room photos, and survey report PDF
                </span>
              </div>
            </div>

            <div style={{ marginBottom: 20, maxWidth: 320 }}>
              <FloatingInput
                as="select"
                label="Site Feasibility"
                name="site_feasible"
                value={siteFeasible}
                onChange={(e) => setSiteFeasible(e.target.value)}
              >
                <option value="Feasible">Feasible (Recommended)</option>
                <option value="Not Feasible">Not Feasible</option>
                <option value="Conditional">Conditional Feasibility</option>
              </FloatingInput>
            </div>

            <div className="jammu-upload-grid">
              <UploadDropzone
                id="building_image"
                label="Building Front Photo"
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
                id="roof_image"
                label="Roof Area Photo"
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
                id="control_room_image"
                label="Control Room / LTDB Photo"
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
                id="image4"
                label="Meter / Additional Photo 1"
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
                id="image5"
                label="Cable Routing / Additional Photo 2"
                file={image5}
                preview={image5Preview}
                onSelect={(f) => {
                  setImage5(f);
                  setImage5Preview(URL.createObjectURL(f));
                }}
                onRemove={() => {
                  setImage5(null);
                  setImage5Preview('');
                }}
              />

              <UploadDropzone
                id="pdf_file"
                label="Survey Report / Drawing (PDF)"
                accept="application/pdf"
                file={pdfFile}
                onSelect={(f) => setPdfFile(f)}
                onRemove={() => setPdfFile(null)}
              />
            </div>
          </div>

          {/* ════════ Submit Footer ════════ */}
          <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid var(--ax-border, #e2e8f0)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <Link to="/v/jammu/survey/resco/assign-survey" className="ax-btn ax-btn--secondary">
              Cancel
            </Link>
            <button
              type="submit"
              className="ax-btn ax-btn--primary"
              disabled={submitting || (!isUpdateMode && !selectedSiteId)}
              style={{ minWidth: 200 }}
            >
              {submitting ? 'Submitting Survey…' : isUpdateMode ? 'Update Survey Record' : 'Submit Survey'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default Pending_Survey;
