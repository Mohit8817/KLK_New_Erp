import { useState, useEffect, useRef, type FormEvent, type ChangeEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  upRescoSurveyAdminService,
  type UpVendorItem,
  type UpRescoSurveySiteRow,
} from '../../up-services';

// Unified Single-Card Layout matching Reference Design
const SINGLE_CARD_FORM_CSS = `
.swp-inst-form .ax-card {
  border: 1px solid var(--ax-border, #cbd5e1);
  border-radius: var(--ax-radius-xl, 16px);
  background: var(--ax-surface-solid, #ffffff);
  box-shadow: var(--ax-shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.05));
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
.ax-float__input:disabled { opacity: .7; cursor: not-allowed; background: var(--ax-surface-subtle, #f8fafc); }

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
  font-weight: 500;
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
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  required?: boolean;
  disabled?: boolean;
  type?: string;
  placeholder?: string;
}

function FloatingInput({ label, name, value, onChange, required, disabled, type = 'text', placeholder }: FloatingInputProps) {
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
  accept = '.pdf,.jpg,.jpeg,.png,.webp',
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
          padding: file || preview ? '10px 12px' : '18px 14px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          minHeight: 100,
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
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: '#eff6ff',
                color: '#3b82f6',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 4,
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
            <div style={{ fontSize: 10.5, color: 'var(--ax-text-muted, #64748b)', marginTop: 2 }}>
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

export function UPRescoSurveyAssignVendor() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const querySiteId = searchParams.get('site_id') || searchParams.get('id');

  // Master datasets from API 14
  const [vendors, setVendors] = useState<UpVendorItem[]>([]);
  const [sites, setSites] = useState<UpRescoSurveySiteRow[]>([]);
  const [loadingInit, setLoadingInit] = useState<boolean>(true);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Top Selectors
  const [selectedSiteId, setSelectedSiteId] = useState<string>(querySiteId || '');
  const [selectedVendor, setSelectedVendor] = useState<string>('');

  // General Information (from site detail)
  const [siteDetail, setSiteDetail] = useState<UpRescoSurveySiteRow | null>(null);

  // Form Fields: Contacts & Address
  const [siteAddress, setSiteAddress] = useState<string>('');
  const [landmark, setLandmark] = useState<string>('');
  const [agencyPersonName, setAgencyPersonName] = useState<string>('');
  const [agencyPersonContact, setAgencyPersonContact] = useState<string>('');
  const [nodalPerson, setNodalPerson] = useState<string>('');
  const [contactNodal, setContactNodal] = useState<string>('');
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');

  // Form Fields: Technical Information
  const [loadType, setLoadType] = useState<string>('AC');
  const [connectionPhase, setConnectionPhase] = useState<string>('3 Phase');
  const [meterConnection, setMeterConnection] = useState<string>('LT');
  const [meterNumber, setMeterNumber] = useState<string>('');
  const [meterType, setMeterType] = useState<string>('Smart Meter');
  const [sanctionLoad, setSanctionLoad] = useState<string>('');
  const [connectedLoad, setConnectedLoad] = useState<string>('');
  const [gridPower, setGridPower] = useState<string>('Yes');
  const [all3PhaseLtdb, setAll3PhaseLtdb] = useState<string>('Yes');
  const [missingPhase, setMissingPhase] = useState<string>('No');
  const [ltdbPresent, setLtdbPresent] = useState<string>('Present');
  const [roofCondition, setRoofCondition] = useState<string>('Feasible');
  const [areaRoof, setAreaRoof] = useState<string>('');
  const [freeSpaceSolar, setFreeSpaceSolar] = useState<string>('');
  const [freeSpaceInverter, setFreeSpaceInverter] = useState<string>('');
  const [earthPit, setEarthPit] = useState<string>('Ok');
  const [siteFeasible, setSiteFeasible] = useState<string>('Feasible');
  const [surveyRemarks, setSurveyRemarks] = useState<string>('');

  // Form Fields: Civil / Structural
  const [buildingAge, setBuildingAge] = useState<string>('');
  const [roofAccess, setRoofAccess] = useState<string>('Available');
  const [rooftopHeight, setRooftopHeight] = useState<string>('');
  const [parapetHeight, setParapetHeight] = useState<string>('');
  const [floorsNumber, setFloorsNumber] = useState<string>('G+1');
  const [waterSource, setWaterSource] = useState<string>('Available');

  // Form Fields: Other Information
  const [siteAccess, setSiteAccess] = useState<string>('Available');
  const [siteDistance, setSiteDistance] = useState<string>('0');

  // Media Files
  const [buildingImage, setBuildingImage] = useState<File | null>(null);
  const [buildingImagePreview, setBuildingImagePreview] = useState<string>('');
  const [roofImage, setRoofImage] = useState<File | null>(null);
  const [roofImagePreview, setRoofImagePreview] = useState<string>('');
  const [controlRoomImage, setControlRoomImage] = useState<File | null>(null);
  const [controlRoomImagePreview, setControlRoomImagePreview] = useState<string>('');
  const [meterImage, setMeterImage] = useState<File | null>(null);
  const [meterImagePreview, setMeterImagePreview] = useState<string>('');
  const [otherImage, setOtherImage] = useState<File | null>(null);
  const [otherImagePreview, setOtherImagePreview] = useState<string>('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  // Section refs for navigation pills
  const sec1 = useRef<HTMLDivElement>(null);
  const sec2 = useRef<HTMLDivElement>(null);
  const sec3 = useRef<HTMLDivElement>(null);
  const sec4 = useRef<HTMLDivElement>(null);
  const sec5 = useRef<HTMLDivElement>(null);

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // 1. Initial Load: API 14 (GET /up/resco/survey/assign-vendor)
  useEffect(() => {
    let active = true;
    const loadAssignVendorData = async () => {
      setLoadingInit(true);
      setErrorMsg('');
      try {
        const res = await upRescoSurveyAdminService.getAssignVendor();
        if (!active) return;
        setVendors(res.vendors || []);
        setSites(res.srtRecords || []);
      } catch (err: any) {
        if (!active) return;
        console.error('Assign vendor load error:', err);
        setErrorMsg(err?.message || 'Failed to load survey assign vendor data.');
      } finally {
        if (active) setLoadingInit(false);
      }
    };
    loadAssignVendorData();
    return () => {
      active = false;
    };
  }, []);

  // 2. Site Selection -> Fetch Site Detail (API 15: GET /up/resco/survey/fetch-site-detail?srt_id=...)
  useEffect(() => {
    if (!selectedSiteId) {
      setSiteDetail(null);
      return;
    }

    let active = true;
    const loadSiteDetail = async () => {
      setLoadingDetail(true);
      setErrorMsg('');
      try {
        const detail = await upRescoSurveyAdminService.fetchSiteDetail(selectedSiteId);
        if (!active) return;
        setSiteDetail(detail);

        // Pre-fill existing values
        if (detail.survey_vendor) setSelectedVendor(String(detail.survey_vendor));
        if (detail.site_address) setSiteAddress(detail.site_address);
        if (detail.landmark || detail.nearest_landmark) setLandmark(detail.landmark || detail.nearest_landmark || '');
        if (detail.agency_person_name || detail.agency_contact_person_name)
          setAgencyPersonName(detail.agency_person_name || detail.agency_contact_person_name || '');
        if (detail.agency_person_contact || detail.agency_contact_number)
          setAgencyPersonContact(detail.agency_person_contact || detail.agency_contact_number || '');
        if (detail.nodal_person) setNodalPerson(detail.nodal_person);
        if (detail.contact_nodal || detail.nodal_person_contact)
          setContactNodal(detail.contact_nodal || detail.nodal_person_contact || '');
        if (detail.latitude) setLatitude(String(detail.latitude));
        if (detail.longitude) setLongitude(String(detail.longitude));
        if (detail.load_type) setLoadType(detail.load_type);
        if (detail.connection_phase) setConnectionPhase(detail.connection_phase);
        if (detail.meter_connection || detail.meter_connection_type)
          setMeterConnection(detail.meter_connection || detail.meter_connection_type || 'LT');
        if (detail.meter_number) setMeterNumber(detail.meter_number);
        if (detail.meter_type) setMeterType(detail.meter_type);
        if (detail.sanction_load) setSanctionLoad(String(detail.sanction_load));
        if (detail.connected_load) setConnectedLoad(String(detail.connected_load));
        if (detail.grid_power || detail.grid_power_availability)
          setGridPower(detail.grid_power || detail.grid_power_availability || 'Yes');
        if (detail.all_3_phase_ltdb || detail.three_phase_availability)
          setAll3PhaseLtdb(detail.all_3_phase_ltdb || detail.three_phase_availability || 'Yes');
        if (detail.missing_phase) setMissingPhase(detail.missing_phase);
        if (detail.ltdb_present) setLtdbPresent(detail.ltdb_present);
        if (detail.roof_condition) setRoofCondition(detail.roof_condition);
        if (detail.area_roof || detail.total_roof_area) setAreaRoof(String(detail.area_roof || detail.total_roof_area));
        if (detail.free_space_solar || detail.free_space_for_solar)
          setFreeSpaceSolar(String(detail.free_space_solar || detail.free_space_for_solar));
        if (detail.free_space_inverter || detail.free_space_for_control_room)
          setFreeSpaceInverter(String(detail.free_space_inverter || detail.free_space_for_control_room));
        if (detail.earth_pit || detail.earth_pit_position)
          setEarthPit(detail.earth_pit || detail.earth_pit_position || 'Ok');
        if (detail.site_feasible) setSiteFeasible(detail.site_feasible);
        if (detail.survey_remarks) setSurveyRemarks(detail.survey_remarks);
        if (detail.building_age || detail.age_of_building)
          setBuildingAge(String(detail.building_age || detail.age_of_building));
        if (detail.roof_access || detail.access_to_roof)
          setRoofAccess(detail.roof_access || detail.access_to_roof || 'Available');
        if (detail.rooftop_height) setRooftopHeight(String(detail.rooftop_height));
        if (detail.parapet_height) setParapetHeight(String(detail.parapet_height));
        if (detail.floors_number || detail.no_of_floors)
          setFloorsNumber(String(detail.floors_number || detail.no_of_floors));
        if (detail.water_source || detail.water_source_for_cleaning)
          setWaterSource(detail.water_source || detail.water_source_for_cleaning || 'Available');
        if (detail.site_access || detail.access_to_site)
          setSiteAccess(detail.site_access || detail.access_to_site || 'Available');
        if (detail.site_distance || detail.distance_of_site_from_main_road)
          setSiteDistance(String(detail.site_distance || detail.distance_of_site_from_main_road));
      } catch (err: any) {
        if (!active) return;
        console.error('Fetch site detail error:', err);
        setErrorMsg(err?.message || 'Failed to fetch site details.');
      } finally {
        if (active) setLoadingDetail(false);
      }
    };
    loadSiteDetail();
    return () => {
      active = false;
    };
  }, [selectedSiteId]);

  // Submit Handler: API 16 (POST /up/resco/survey/store)
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedSiteId) return setErrorMsg('Please select a site.');
    if (!siteAddress.trim()) return setErrorMsg('Site Address (details) is required.');
    if (!landmark.trim()) return setErrorMsg('Nearest Landmark is required.');
    if (!agencyPersonName.trim()) return setErrorMsg('Agency Contact Person Name is required.');
    if (!agencyPersonContact.trim()) return setErrorMsg('Agency Contact Number is required.');
    if (!nodalPerson.trim()) return setErrorMsg('Nodal Person is required.');
    if (!contactNodal.trim()) return setErrorMsg('Contact Number of Nodal Person is required.');
    if (!latitude.trim() || !longitude.trim()) return setErrorMsg('Latitude and Longitude are required.');

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('site_name', selectedSiteId);
      formData.append('site_address', siteAddress.trim());
      formData.append('landmark', landmark.trim());
      formData.append('agency_person_name', agencyPersonName.trim());
      formData.append('agency_person_contact', agencyPersonContact.trim());
      formData.append('nodal_person', nodalPerson.trim());
      formData.append('contact_nodal', contactNodal.trim());
      formData.append('latitude', latitude.trim());
      formData.append('longitude', longitude.trim());
      formData.append('load_type', loadType);
      formData.append('connection_phase', connectionPhase);
      formData.append('meter_connection', meterConnection);
      formData.append('meter_number', meterNumber.trim());
      formData.append('meter_type', meterType);
      formData.append('sanction_load', sanctionLoad.trim());
      formData.append('connected_load', connectedLoad.trim());
      formData.append('grid_power', gridPower);
      formData.append('ltdb_present', ltdbPresent);
      formData.append('all_3_phase_ltdb', all3PhaseLtdb);
      formData.append('missing_phase', missingPhase.trim());
      formData.append('roof_condition', roofCondition);
      formData.append('area_roof', areaRoof.trim());
      formData.append('free_space_solar', freeSpaceSolar.trim());
      formData.append('free_space_inverter', freeSpaceInverter.trim());
      formData.append('earth_pit', earthPit);
      formData.append('survey_remarks', surveyRemarks.trim());
      formData.append('building_age', buildingAge.trim());
      formData.append('roof_access', roofAccess);
      formData.append('rooftop_height', rooftopHeight.trim());
      formData.append('parapet_height', parapetHeight.trim());
      formData.append('floors_number', floorsNumber.trim());
      formData.append('water_source', waterSource);
      formData.append('site_access', siteAccess);
      formData.append('site_distance', siteDistance.trim());
      if (siteFeasible) formData.append('site_feasible', siteFeasible);

      // Photos
      if (buildingImage) formData.append('building_image', buildingImage);
      if (roofImage) formData.append('roof_image', roofImage);
      if (controlRoomImage) formData.append('control_room_image', controlRoomImage);
      if (meterImage) formData.append('image4', meterImage);
      if (otherImage) formData.append('image5', otherImage);
      if (pdfFile) formData.append('pdf', pdfFile);

      const res = await upRescoSurveyAdminService.store(formData);
      setSuccessMsg(res.message || 'Survey Completed Successfully!');

      setTimeout(() => {
        navigate('/up/resco-survey-verify');
      }, 1500);
    } catch (err: any) {
      console.error('Survey store error:', err);
      setErrorMsg(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ax-page swp-inst-form">
      <style>{SINGLE_CARD_FORM_CSS}</style>

      {/* Page Head */}
      <PageHead
        title="UP Resco Assigned Site Vendor"
        subtitle="The field labels marked with * are input fields."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'UP Resco Survey', href: '/up/resco-survey-dashboard' },
          { label: 'Site Feasibility Report' },
        ]}
        actions={
          <Link to="/up/resco-survey-verify" className="ax-btn ax-btn--primary ax-btn--sm">
            View Verified Surveys ↗
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
          <span style={{ fontSize: 12, opacity: 0.8 }}>Redirecting to Verify Survey...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="ax-card">
        {/* Header with Section Nav Pills */}
        <div className="ax-card__header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h2 className="ax-card__title" style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--ax-text-strong, #0f172a)' }}>
                Site Feasibility Report
              </h2>
              <p className="ax-card__subtitle" style={{ fontSize: '0.85rem', color: '#ef4444', margin: '4px 0 0' }}>
                The field labels marked with * are input fields.
              </p>
            </div>
            {loadingDetail ? (
              <span className="ax-badge ax-badge--soft ax-badge--warning" style={{ fontWeight: 600, padding: '4px 12px', fontSize: 12 }}>
                Loading Site Details...
              </span>
            ) : siteDetail ? (
              <span className="ax-badge ax-badge--soft ax-badge--info" style={{ fontWeight: 600, padding: '4px 12px', fontSize: 12 }}>
                Site ID #{siteDetail.id}
              </span>
            ) : null}
          </div>

          <div className="swp-section-pills">
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec1)}>
              <span className="pill-num">1</span> Site & Vendor
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec2)}>
              <span className="pill-num">2</span> General Info & Contacts
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec3)}>
              <span className="pill-num">3</span> Technical Information
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec4)}>
              <span className="pill-num">4</span> Civil / Structural
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec5)}>
              <span className="pill-num">5</span> Photos & PDF
            </button>
          </div>
        </div>

        <div className="ax-card__body">
          {/* Section 1: Select Site & Select Vendor */}
          <div ref={sec1} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>1. Site Selection & Vendor Allocation</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Select assigned survey site and executing vendor partner
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {/* Select Site * */}
              <div className="ax-float">
                <select
                  id="site_select"
                  className="ax-float__input"
                  value={selectedSiteId}
                  onChange={(e) => setSelectedSiteId(e.target.value)}
                  disabled={loadingInit || submitting}
                  required
                >
                  <option value="">-- Select Site --</option>
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      #{s.id} — {s.site_name}
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
                  disabled={loadingInit || submitting}
                >
                  <option value="">-- Select Vendor --</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} (ID: {v.id})
                    </option>
                  ))}
                </select>
                <label htmlFor="vendor_select" className="ax-float__label floating">
                  Select Vendor <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>
            </div>

            {/* General Information Auto-Loaded Box */}
            {siteDetail && (
              <div style={{ marginTop: 20, padding: 16, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1e40af', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  General Information
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, fontSize: 12 }}>
                  <div><span style={{ color: '#64748b' }}>Unique ID:</span> <strong style={{ fontFamily: 'monospace' }}>{siteDetail.unique_id || `#${siteDetail.id}`}</strong></div>
                  <div><span style={{ color: '#64748b' }}>State:</span> <strong>{siteDetail.state?.toUpperCase() || 'UP'}</strong></div>
                  <div><span style={{ color: '#64748b' }}>District:</span> <strong>{siteDetail.district || '—'}</strong></div>
                  <div><span style={{ color: '#64748b' }}>Division:</span> <strong>{siteDetail.division || '—'}</strong></div>
                  <div><span style={{ color: '#64748b' }}>Sub Division:</span> <strong>{siteDetail.sub_division || '—'}</strong></div>
                  <div><span style={{ color: '#64748b' }}>Department:</span> <strong>{siteDetail.department || siteDetail.dept_name || '—'}</strong></div>
                  <div><span style={{ color: '#64748b' }}>Site Name:</span> <strong>{siteDetail.site_name || '—'}</strong></div>
                  <div><span style={{ color: '#64748b' }}>Location:</span> <strong>{siteDetail.location || siteDetail.site_address || '—'}</strong></div>
                  <div><span style={{ color: '#64748b' }}>CA No.:</span> <strong style={{ fontFamily: 'monospace' }}>{siteDetail.ca_no || '—'}</strong></div>
                </div>
              </div>
            )}
          </div>

          <hr className="swp-section-divider" />

          {/* Section 2: Fill this Form - Contacts & Location */}
          <div ref={sec2} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>2. Site Location & Nodal Contacts</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Detailed address, nearest landmarks, and agency / building nodal contacts
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: 16 }}>
              <FloatingInput
                label="Site Address (details)"
                name="site_address"
                value={siteAddress}
                onChange={(e) => setSiteAddress(e.target.value)}
                required
              />
              <FloatingInput
                label="Nearest Landmark"
                name="landmark"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                required
              />
              <FloatingInput
                label="Name of Contact Person of Agency"
                name="agency_person_name"
                value={agencyPersonName}
                onChange={(e) => setAgencyPersonName(e.target.value)}
                required
              />
              <FloatingInput
                label="Contact Number"
                name="agency_person_contact"
                value={agencyPersonContact}
                onChange={(e) => setAgencyPersonContact(e.target.value)}
                required
              />
              <FloatingInput
                label="Nodal Person of concern building"
                name="nodal_person"
                value={nodalPerson}
                onChange={(e) => setNodalPerson(e.target.value)}
                required
              />
              <FloatingInput
                label="Contact Number of Nodal Person"
                name="contact_nodal"
                value={contactNodal}
                onChange={(e) => setContactNodal(e.target.value)}
                required
              />
              <FloatingInput
                label="Latitude"
                name="latitude"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                required
                placeholder="e.g. 26.8467"
              />
              <FloatingInput
                label="Longitude"
                name="longitude"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                required
                placeholder="e.g. 80.9462"
              />
            </div>
          </div>

          <hr className="swp-section-divider" />

          {/* Section 3: Technical Information */}
          <div ref={sec3} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>3. Technical Information</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Electrical loading, metering details, LTDB availability, and rooftop space
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: 16 }}>
              {/* Type of Load * */}
              <div className="ax-float">
                <select
                  id="load_type"
                  className="ax-float__input"
                  value={loadType}
                  onChange={(e) => setLoadType(e.target.value)}
                  required
                >
                  <option value="AC">AC</option>
                  <option value="DC">DC</option>
                </select>
                <label htmlFor="load_type" className="ax-float__label floating">
                  Type of Load <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              {/* Connection Phase * */}
              <div className="ax-float">
                <select
                  id="connection_phase"
                  className="ax-float__input"
                  value={connectionPhase}
                  onChange={(e) => setConnectionPhase(e.target.value)}
                  required
                >
                  <option value="1 Phase">1 Phase</option>
                  <option value="3 Phase">3 Phase</option>
                </select>
                <label htmlFor="connection_phase" className="ax-float__label floating">
                  Connection Phase <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              {/* Meter Connection Type * */}
              <div className="ax-float">
                <select
                  id="meter_connection"
                  className="ax-float__input"
                  value={meterConnection}
                  onChange={(e) => setMeterConnection(e.target.value)}
                  required
                >
                  <option value="HT">HT</option>
                  <option value="LT">LT</option>
                </select>
                <label htmlFor="meter_connection" className="ax-float__label floating">
                  Meter Connection Type <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              {/* Meter Number * */}
              <FloatingInput
                label="Meter Number"
                name="meter_number"
                value={meterNumber}
                onChange={(e) => setMeterNumber(e.target.value)}
                required
              />

              {/* Meter Type * */}
              <div className="ax-float">
                <select
                  id="meter_type"
                  className="ax-float__input"
                  value={meterType}
                  onChange={(e) => setMeterType(e.target.value)}
                  required
                >
                  <option value="Smart Meter">Smart Meter</option>
                  <option value="Normal Meter">Normal Meter</option>
                  <option value="LTCT Meter">LTCT Meter</option>
                  <option value="HT Meter">HT Meter</option>
                </select>
                <label htmlFor="meter_type" className="ax-float__label floating">
                  Meter Type <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              {/* Sanction Load (KW/KVA) * */}
              <FloatingInput
                label="Sanction Load (KW/KVA)"
                name="sanction_load"
                value={sanctionLoad}
                onChange={(e) => setSanctionLoad(e.target.value)}
                required
              />

              {/* Instantaneous/Connected Load (KW) * */}
              <FloatingInput
                label="Instantaneous/Connected Load (KW)"
                name="connected_load"
                value={connectedLoad}
                onChange={(e) => setConnectedLoad(e.target.value)}
                required
              />

              {/* Grid power availability in hours * */}
              <div className="ax-float">
                <select
                  id="grid_power"
                  className="ax-float__input"
                  value={gridPower}
                  onChange={(e) => setGridPower(e.target.value)}
                  required
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
                <label htmlFor="grid_power" className="ax-float__label floating">
                  Grid power availability in hours <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              {/* Is all three-phase available in LTDB * */}
              <div className="ax-float">
                <select
                  id="all_3_phase_ltdb"
                  className="ax-float__input"
                  value={all3PhaseLtdb}
                  onChange={(e) => setAll3PhaseLtdb(e.target.value)}
                  required
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
                <label htmlFor="all_3_phase_ltdb" className="ax-float__label floating">
                  Is all three-phase available in LTDB <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              {/* If phase is missing, name i.e., R, Y, B, N * */}
              <FloatingInput
                label="If phase is missing, name i.e., R, Y, B, N"
                name="missing_phase"
                value={missingPhase}
                onChange={(e) => setMissingPhase(e.target.value)}
                required
                placeholder="No or R, Y, B, N"
              />

              {/* Is LTDB Present * */}
              <div className="ax-float">
                <select
                  id="ltdb_present"
                  className="ax-float__input"
                  value={ltdbPresent}
                  onChange={(e) => setLtdbPresent(e.target.value)}
                  required
                >
                  <option value="Present">Present</option>
                  <option value="Not Present">Not Present</option>
                </select>
                <label htmlFor="ltdb_present" className="ax-float__label floating">
                  Is LTDB Present <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              {/* Roof Condition of solar power plant installation * */}
              <div className="ax-float">
                <select
                  id="roof_condition"
                  className="ax-float__input"
                  value={roofCondition}
                  onChange={(e) => setRoofCondition(e.target.value)}
                  required
                >
                  <option value="Feasible">Feasible</option>
                  <option value="Not Feasible">Not Feasible</option>
                </select>
                <label htmlFor="roof_condition" className="ax-float__label floating">
                  Roof Condition <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              {/* Total Area of Roof (in Sq.Feet) * */}
              <FloatingInput
                label="Total Area of Roof (in Sq.Feet)"
                name="area_roof"
                value={areaRoof}
                onChange={(e) => setAreaRoof(e.target.value)}
                required
              />

              {/* Free space for solar Installation (in Sq.Feet) * */}
              <FloatingInput
                label="Free space for solar Installation (in Sq.Feet)"
                name="free_space_solar"
                value={freeSpaceSolar}
                onChange={(e) => setFreeSpaceSolar(e.target.value)}
                required
              />

              {/* Free space for Control Room/Inverter (in Sq.Feet) * */}
              <FloatingInput
                label="Free space for Control Room/Inverter (in Sq.Feet)"
                name="free_space_inverter"
                value={freeSpaceInverter}
                onChange={(e) => setFreeSpaceInverter(e.target.value)}
                required
              />

              {/* Earth pit position * */}
              <div className="ax-float">
                <select
                  id="earth_pit"
                  className="ax-float__input"
                  value={earthPit}
                  onChange={(e) => setEarthPit(e.target.value)}
                  required
                >
                  <option value="Ok">Ok</option>
                  <option value="Not Ok">Not Ok</option>
                </select>
                <label htmlFor="earth_pit" className="ax-float__label floating">
                  Earth pit position <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              {/* Site Feasible * */}
              <div className="ax-float">
                <select
                  id="site_feasible"
                  className="ax-float__input"
                  value={siteFeasible}
                  onChange={(e) => setSiteFeasible(e.target.value)}
                  required
                >
                  <option value="Feasible">Feasible</option>
                  <option value="Not Feasible">Not Feasible</option>
                  <option value="Site Install">Site Install</option>
                </select>
                <label htmlFor="site_feasible" className="ax-float__label floating">
                  Site Feasible <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              {/* Survey Remarks * */}
              <FloatingInput
                label="Survey Remarks"
                name="survey_remarks"
                value={surveyRemarks}
                onChange={(e) => setSurveyRemarks(e.target.value)}
                required
              />
            </div>
          </div>

          <hr className="swp-section-divider" />

          {/* Section 4: Civil / Structural */}
          <div ref={sec4} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>4. Civil / Structural Information</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Building age, staircase access, rooftop heights, and approach road distance
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: 16 }}>
              <FloatingInput
                label="Age of Building"
                name="building_age"
                value={buildingAge}
                onChange={(e) => setBuildingAge(e.target.value)}
                required
                placeholder="e.g. 5 Years"
              />

              <div className="ax-float">
                <select
                  id="roof_access"
                  className="ax-float__input"
                  value={roofAccess}
                  onChange={(e) => setRoofAccess(e.target.value)}
                  required
                >
                  <option value="Available">Available</option>
                  <option value="Not Available">Not Available</option>
                </select>
                <label htmlFor="roof_access" className="ax-float__label floating">
                  Access to the roof (Availability of Staircase) <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              <FloatingInput
                label="Rooftop Height (Feet)"
                name="rooftop_height"
                value={rooftopHeight}
                onChange={(e) => setRooftopHeight(e.target.value)}
                required
              />

              <FloatingInput
                label="Parapet Height (Feet)"
                name="parapet_height"
                value={parapetHeight}
                onChange={(e) => setParapetHeight(e.target.value)}
                required
              />

              <FloatingInput
                label="No. of floors (G+...)"
                name="floors_number"
                value={floorsNumber}
                onChange={(e) => setFloorsNumber(e.target.value)}
                required
                placeholder="e.g. G+2"
              />

              <FloatingInput
                label="Water Source for Cleaning"
                name="water_source"
                value={waterSource}
                onChange={(e) => setWaterSource(e.target.value)}
                required
                placeholder="e.g. Overhead Tank, Tap"
              />

              <FloatingInput
                label="Access to Site"
                name="site_access"
                value={siteAccess}
                onChange={(e) => setSiteAccess(e.target.value)}
                required
                placeholder="e.g. Paved Road, 20ft Wide"
              />

              <FloatingInput
                label="Distance of site from main Road (km)"
                name="site_distance"
                value={siteDistance}
                onChange={(e) => setSiteDistance(e.target.value)}
                required
                placeholder="e.g. 0.5"
              />
            </div>
          </div>

          <hr className="swp-section-divider" />

          {/* Section 5: Media Evidence & Documents */}
          <div ref={sec5} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>5. Photographic Evidence & Survey PDF</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Attach building, roof, control room, and meter photographs along with survey PDF report
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              <UploadDropzone
                id="building_image"
                label="Building Image"
                required
                file={buildingImage}
                preview={buildingImagePreview}
                onSelect={(f) => {
                  setBuildingImage(f);
                  setBuildingImagePreview(URL.createObjectURL(f));
                }}
                onRemove={() => {
                  setBuildingImage(null);
                  if (buildingImagePreview) URL.revokeObjectURL(buildingImagePreview);
                  setBuildingImagePreview('');
                }}
              />

              <UploadDropzone
                id="roof_image"
                label="Roof Image"
                required
                file={roofImage}
                preview={roofImagePreview}
                onSelect={(f) => {
                  setRoofImage(f);
                  setRoofImagePreview(URL.createObjectURL(f));
                }}
                onRemove={() => {
                  setRoofImage(null);
                  if (roofImagePreview) URL.revokeObjectURL(roofImagePreview);
                  setRoofImagePreview('');
                }}
              />

              <UploadDropzone
                id="control_room_image"
                label="Control Room Image"
                required
                file={controlRoomImage}
                preview={controlRoomImagePreview}
                onSelect={(f) => {
                  setControlRoomImage(f);
                  setControlRoomImagePreview(URL.createObjectURL(f));
                }}
                onRemove={() => {
                  setControlRoomImage(null);
                  if (controlRoomImagePreview) URL.revokeObjectURL(controlRoomImagePreview);
                  setControlRoomImagePreview('');
                }}
              />

              <UploadDropzone
                id="meter_image"
                label="Meter Image"
                file={meterImage}
                preview={meterImagePreview}
                onSelect={(f) => {
                  setMeterImage(f);
                  setMeterImagePreview(URL.createObjectURL(f));
                }}
                onRemove={() => {
                  setMeterImage(null);
                  if (meterImagePreview) URL.revokeObjectURL(meterImagePreview);
                  setMeterImagePreview('');
                }}
              />

              <UploadDropzone
                id="other_image"
                label="Other Image"
                file={otherImage}
                preview={otherImagePreview}
                onSelect={(f) => {
                  setOtherImage(f);
                  setOtherImagePreview(URL.createObjectURL(f));
                }}
                onRemove={() => {
                  setOtherImage(null);
                  if (otherImagePreview) URL.revokeObjectURL(otherImagePreview);
                  setOtherImagePreview('');
                }}
              />

              <UploadDropzone
                id="survey_pdf"
                label="Survey Report PDF"
                accept=".pdf"
                file={pdfFile}
                onSelect={setPdfFile}
                onRemove={() => setPdfFile(null)}
              />
            </div>
          </div>

          {/* Submit Footer */}
          <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid var(--ax-border, #e2e8f0)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px' }}>
            <Link to="/up/resco-survey-verify" className="ax-btn ax-btn--secondary">
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
                'Submit Survey Feasibility'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default UPRescoSurveyAssignVendor;
