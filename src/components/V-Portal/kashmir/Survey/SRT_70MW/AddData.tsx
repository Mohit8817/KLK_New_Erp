import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { kashmirSrtService, getKashmirMediaUrl } from '../../kashmir-services';

// CSS: Unified Single-Card Layout with Floating Labels & Section Dividers (same as Bihar SRT design)
const SINGLE_CARD_FORM_CSS = `
.kashmir-single-card-form .ax-card { border: 1px solid var(--ax-border); border-radius: var(--ax-radius-xl); background: var(--ax-surface-solid); box-shadow: var(--ax-shadow-sm); overflow: hidden; }
.kashmir-single-card-form .ax-card__header { padding: var(--ax-space-5) var(--ax-space-6); border-bottom: 1px solid var(--ax-border-subtle); background: var(--ax-surface-subtle); display: flex; flex-direction: column; gap: var(--ax-space-4); }
.kashmir-single-card-form .ax-card__body { padding: var(--ax-space-6); }

.kashmir-section-pills { display: flex; gap: var(--ax-space-2); overflow-x: auto; padding-bottom: 4px; scrollbar-width: thin; }
.kashmir-section-pill-btn { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: var(--ax-radius-pill); font-size: var(--ax-text-xs); font-weight: 500; white-space: nowrap; background: var(--ax-surface-solid); border: 1px solid var(--ax-border); color: var(--ax-text); cursor: pointer; transition: all var(--ax-motion-fast) var(--ax-ease-standard); text-decoration: none; }
.kashmir-section-pill-btn:hover { border-color: var(--ax-accent); color: var(--ax-accent); background: color-mix(in srgb, var(--ax-accent) 6%, var(--ax-surface-solid)); }
.kashmir-section-pill-btn .pill-num { width: 18px; height: 18px; border-radius: 50%; background: var(--ax-surface-subtle); display: inline-flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; }

.kashmir-section-block { padding-top: var(--ax-space-2); scroll-margin-top: 80px; }
.kashmir-section-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: var(--ax-space-2); margin-bottom: var(--ax-space-5); padding-bottom: var(--ax-space-3); border-bottom: 1px solid var(--ax-border-subtle); }
.kashmir-section-title-wrap { display: flex; flex-direction: column; gap: 4px; }
.kashmir-section-divider { border: 0; border-top: 1px dashed var(--ax-border); margin: var(--ax-space-8) 0 var(--ax-space-6); }

.ax-float { position: relative; width: 100%; }
.ax-float__input { width: 100%; height: 46px; padding: 12px 14px 4px 14px; font-size: var(--ax-text-sm); background: var(--ax-surface-solid); border: 1px solid var(--ax-border); border-radius: var(--ax-radius-md); color: var(--ax-text); outline: none; transition: border-color var(--ax-motion-fast) var(--ax-ease-standard), box-shadow var(--ax-motion-fast) var(--ax-ease-standard); }
.ax-float__input::placeholder { color: transparent; }
.ax-float__input:focus { border-color: var(--ax-accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--ax-accent) 20%, transparent); }
.ax-float__input[readonly] { background: var(--ax-surface-subtle); }
.ax-float__input:disabled { opacity: .7; cursor: not-allowed; background: var(--ax-surface-subtle); }

.ax-float__label { position: absolute; inset-inline-start: 12px; top: 50%; transform: translateY(-50%); margin: 0; padding: 0 4px; font-size: var(--ax-text-sm); color: var(--ax-text-subtle); background: var(--ax-surface-solid); border-radius: var(--ax-radius-xs); pointer-events: none; transition: top var(--ax-motion-fast) var(--ax-ease-standard), font-size var(--ax-motion-fast) var(--ax-ease-standard), color var(--ax-motion-fast) var(--ax-ease-standard); z-index: 2; white-space: nowrap; max-width: calc(100% - 24px); overflow: hidden; text-overflow: ellipsis; }

.ax-float__input:focus + .ax-float__label,
.ax-float__input:not(:placeholder-shown) + .ax-float__label,
.ax-float--select .ax-float__label,
.ax-float--file .ax-float__label { top: 0; transform: translateY(-50%); font-size: var(--ax-text-2xs); font-weight: 500; color: var(--ax-text-muted); }
.ax-float__input:focus + .ax-float__label { color: var(--ax-accent); }

.ax-float__input.is-invalid { border-color: var(--ax-danger-500) !important; }
.ax-float__input.is-invalid:focus { box-shadow: 0 0 0 3px color-mix(in srgb, var(--ax-danger-500) 24%, transparent) !important; }
.ax-float__input.is-invalid + .ax-float__label { color: var(--ax-danger-500) !important; }

.ax-float--area .ax-float__input { height: auto; min-height: 84px; padding-top: 18px; resize: vertical; }
.ax-float--area .ax-float__label { top: 18px; transform: none; }
.ax-float--area .ax-float__input:focus + .ax-float__label,
.ax-float--area .ax-float__input:not(:placeholder-shown) + .ax-float__label { top: 0; transform: translateY(-50%); }

.ax-field-feedback { display: flex; align-items: center; gap: 4px; margin-top: 4px; font-size: var(--ax-text-2xs); min-height: 16px; }
.ax-field-feedback--error { color: var(--ax-danger-500); }

.kashmir-form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--ax-space-4); }
@media (min-width: 1024px) { .kashmir-form-grid--3col { grid-template-columns: repeat(3, 1fr); } }
.kashmir-form-col-span-full { grid-column: 1 / -1; }
.kashmir-gps-cell { height: 46px; }

.kashmir-form-sticky-bar { position: sticky; bottom: var(--ax-space-4); z-index: 30; margin-top: var(--ax-space-6); padding: var(--ax-space-3) var(--ax-space-5); background: var(--ax-surface-solid); border: 1px solid var(--ax-border); border-radius: var(--ax-radius-xl); box-shadow: var(--ax-shadow-lg); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--ax-space-3); backdrop-filter: blur(12px); }

@keyframes kashmir-spin { to { transform: rotate(360deg); } }
`;

const INITIAL_FORM = {
  // General Info
  district: '',
  department: '',
  site_name: '',
  survey_site_address: '',
  near_landmark: '',
  contact_person: '',
  contact_no: '',
  proposed_capacity: '',

  // Technical Info
  latitude: '',
  longitude: '',
  load_type: '',
  connection_type: '',
  meter_connection_type: '',
  ca_no: '',
  meter_no: '',
  sanction_load: '',
  instantaneous_load: '',
  grid_availability: '',
  three_phase_available: '',
  missing_phase: '',
  ltdb_status: '',
  dg_set_available: 'No',
  dg_set_capacity: '',
  dg_set_make: '',
  roof_condition: '',
  roof_area: '',
  solar_free_space: '',
  control_room_free_space: '',
  earth_pit_position: '',
  ac_cable_routing: '',
  roof_type: '',
  structure_type: '',

  // Civil / Structural
  building_age: '',
  roof_access: '',
  rooftop_height: '',
  parapet_height: '',
  number_of_floors: '',

  // Other Information
  site_access: '',
  site_distance: '',
};

type FormKey = keyof typeof INITIAL_FORM;
type FileKey = 'building_image' | 'roof_image' | 'control_room_image' | 'image4' | 'pdf';
type Option = { value: string; label: string };

const opts = (arr: string[]): Option[] => arr.map((v) => ({ value: v, label: v }));

const SECTIONS = [
  { id: 'sec-1', num: '1', title: 'General Info' },
  { id: 'sec-2', num: '2', title: 'Technical Info' },
  { id: 'sec-3', num: '3', title: 'Civil / Structural' },
  { id: 'sec-4', num: '4', title: 'Other Info & Media' },
];

const TOTAL_SECTIONS = SECTIONS.length;

export function Kashmir_Survey_AddData() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  // Query parameter ?id=... or route param :id
  const searchParams = new URLSearchParams(location.search);
  const editId = params.id || searchParams.get('id');
  const isEditMode = Boolean(editId);

  const [pendingSites, setPendingSites] = useState<{ id: number; site_name: string; district?: string }[]>([]);
  const [loadingSites, setLoadingSites] = useState(false);
  const [selectedSiteId, setSelectedSiteId] = useState<string>(editId ? String(editId) : '');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const [gpsLoading, setGpsLoading] = useState(false);

  const [formData, setFormData] = useState({ ...INITIAL_FORM });
  const [files, setFiles] = useState<Record<FileKey, File | null>>({
    building_image: null,
    roof_image: null,
    control_room_image: null,
    image4: null,
    pdf: null,
  });
  const [existingImages, setExistingImages] = useState<Record<string, string>>({});

  const clearError = (name: string) => {
    setValidationErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const setField = (name: FormKey, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (validationErrors[name]) clearError(name);
  };

  // Shortcut props for floating fields
  const f = (name: FormKey) => ({
    value: formData[name],
    onChange: (v: string) => setField(name, v),
    error: validationErrors[name]?.[0],
  });

  const handleFileChange = (key: FileKey, file: File | null) => {
    setFiles((prev) => ({ ...prev, [key]: file }));
    if (validationErrors[key]) clearError(key);
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // 1. Fetch pending survey sites (dropdown)
  useEffect(() => {
    (async () => {
      setLoadingSites(true);
      try {
        const list = await kashmirSrtService.getSurveyAddSites();
        setPendingSites(list);
      } catch (err) {
        console.warn('Failed to load survey pending sites:', err);
      } finally {
        setLoadingSites(false);
      }
    })();
  }, []);

  // 2. If in Edit Mode, fetch survey details
  useEffect(() => {
    if (!editId) return;
    (async () => {
      try {
        const item = await kashmirSrtService.getSurveyEdit(editId);
        if (item) {
          setSelectedSiteId(String(item.id));
          setFormData({
            district: item.district || '',
            department: item.dept_name || item.department || '',
            site_name: item.site_name || '',
            survey_site_address: item.survey_site_address || item.site_address || '',
            near_landmark: item.near_landmark || '',
            contact_person: item.contact_person || '',
            contact_no: item.contact_no || '',
            proposed_capacity: String(item.proposed_capacity ?? ''),
            latitude: item.latitude || '',
            longitude: item.longitude || '',
            load_type: item.load_type || '',
            connection_type: item.connection_type || '',
            meter_connection_type: item.meter_connection_type || '',
            ca_no: item.ca_no || '',
            meter_no: item.meter_no || item.meter_number || '',
            sanction_load: item.sanction_load || '',
            instantaneous_load: item.instantaneous_load || '',
            grid_availability: item.grid_availability || '',
            three_phase_available: item.three_phase_available || '',
            missing_phase: item.missing_phase || '',
            ltdb_status: item.ltdb_status || '',
            dg_set_available: Number(item.dg_set_available) === 1 || String(item.dg_set_available).toLowerCase() === 'yes' ? 'Yes' : 'No',
            dg_set_capacity: item.dg_set_capacity || '',
            dg_set_make: item.dg_set_make || '',
            roof_condition: item.roof_condition || '',
            roof_area: item.roof_area || '',
            solar_free_space: item.solar_free_space || '',
            control_room_free_space: item.control_room_free_space || '',
            earth_pit_position: item.earth_pit_position || '',
            ac_cable_routing: item.ac_cable_routing || '',
            roof_type: item.roof_type || '',
            structure_type: item.structure_type || '',
            building_age: item.building_age || '',
            roof_access: item.roof_access || '',
            rooftop_height: item.rooftop_height || '',
            parapet_height: item.parapet_height || '',
            number_of_floors: item.number_of_floors || '',
            site_access: item.site_access || '',
            site_distance: item.site_distance || '',
          });

          setExistingImages({
            building_image: item.image1 || item.building_image || '',
            roof_image: item.image2 || item.roof_image || '',
            control_room_image: item.image3 || item.control_room_image || '',
            image4: item.image4 || item.other_image || '',
            pdf: item.pdf_file || item.pdf || '',
          });
        }
      } catch (err: any) {
        setErrorMsg(`Failed to load survey data: ${err.message}`);
      }
    })();
  }, [editId]);

  // Handle site selection from dropdown -> auto-fetch details
  const handleSiteSelect = async (siteId: string) => {
    setSelectedSiteId(siteId);
    if (!siteId) return;

    try {
      const detail = await kashmirSrtService.getSurveySiteDetail(siteId);
      if (detail) {
        setFormData((prev) => ({
          ...prev,
          site_name: detail.site_name || prev.site_name,
          district: detail.district || prev.district,
          department: detail.dept_name || detail.department || prev.department,
          ca_no: detail.ca_no || prev.ca_no,
          survey_site_address: detail.site_address || detail.survey_site_address || prev.survey_site_address,
          near_landmark: detail.near_landmark || prev.near_landmark,
          contact_person: detail.contact_person || prev.contact_person,
          contact_no: detail.contact_no || prev.contact_no,
          proposed_capacity: detail.proposed_capacity ? String(detail.proposed_capacity) : prev.proposed_capacity,
          sanction_load: detail.sanction_load || prev.sanction_load,
        }));
      }
    } catch (err) {
      console.warn('Could not fetch site detail for selected site:', err);
    }
  };

  // GPS Location fetch
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
        setGpsLoading(false);
      },
      (err) => {
        setGpsLoading(false);
        alert(`Location error: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // Submit form
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setValidationErrors({});

    // Basic client checks
    const errs: Record<string, string[]> = {};
    if (!formData.site_name.trim()) errs.site_name = ['Select or enter Site Name.'];

    if (!isEditMode) {
      if (!files.building_image) errs.building_image = ['Building image is required.'];
      if (!files.roof_image) errs.roof_image = ['Roof image is required.'];
      if (!files.control_room_image) errs.control_room_image = ['Control room image is required.'];
    }

    if (Object.keys(errs).length > 0) {
      setValidationErrors(errs);
      setErrorMsg(
        errs.site_name ? 'Please select or enter Site Name.' : 'Please upload required survey photos.'
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => {
        document.querySelector('.is-invalid')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
      return;
    }

    const payload = new FormData();
    if (selectedSiteId) {
      payload.append('srt_id', selectedSiteId);
      payload.append('id', selectedSiteId);
    }

    Object.entries(formData).forEach(([k, v]) => {
      if (k === 'dg_set_available') {
        payload.append('dg_set_available', v === 'Yes' ? '1' : '0');
      } else {
        payload.append(k, v);
      }
    });

    if (files.building_image) payload.append('building_image', files.building_image);
    if (files.roof_image) payload.append('roof_image', files.roof_image);
    if (files.control_room_image) payload.append('control_room_image', files.control_room_image);
    if (files.image4) payload.append('image4', files.image4);
    if (files.pdf) payload.append('pdf', files.pdf);

    setSubmitting(true);
    try {
      if (isEditMode && editId) {
        const resp = await kashmirSrtService.updateSurvey(editId, payload);
        setSuccessMsg(resp.message || 'Kashmir SRT Survey Updated Successfully!!!');
      } else {
        const resp = await kashmirSrtService.storeSurvey(payload);
        setSuccessMsg(resp.message || 'Kashmir SRT Survey Completed Successfully!!!');
      }
      setTimeout(() => navigate('/v/kashmir/srt70mw/survey-view'), 1500);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred while saving survey.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  const siteSelectOptions: Option[] = pendingSites.map((s) => ({
    value: String(s.id),
    label: `${s.site_name}${s.district ? ` (${s.district})` : ''}`,
  }));

  const yesNo = opts(['Yes', 'No']);
  const mediaUrl = (path?: string) => (path ? getKashmirMediaUrl(path) : undefined);

  return (
    <div className="kashmir-single-card-form">
      <style>{SINGLE_CARD_FORM_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="Kashmir SRT 70MW Survey"
        subtitle={
          <span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>
            Welcome to Kashmir SRT 70MW Survey Portal
          </span>
        }
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Kashmir' },
          { label: 'Survey' },
          { label: 'SRT 70MW Survey', href: '/v/kashmir/srt70mw/survey-view' },
          { label: isEditMode ? 'Edit Survey' : 'Add Data' },
        ]}
        actions={
          <Link to="/v/kashmir/srt70mw/survey-view" className="ax-btn ax-btn--secondary ax-btn--pill">
            <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l14 0" /><path d="M5 12l6 6" /><path d="M5 12l6 -6" /></svg>
            <span className="ax-btn__label">Survey List</span>
          </Link>
        }
      />

      {/* Success Banner */}
      {successMsg && (
        <div className="ax-alert ax-alert--success" role="status" style={{ marginBottom: 'var(--ax-space-6)' }}>
          <span className="ax-alert__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5l10 -10" /></svg>
          </span>
          <div className="ax-alert__content">
            <h3 className="ax-alert__title" style={{ fontSize: 'var(--ax-text-base)', fontWeight: 600 }}>{successMsg}</h3>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {errorMsg && (
        <div className="ax-alert ax-alert--danger" role="alert" style={{ marginBottom: 'var(--ax-space-6)' }}>
          <span className="ax-alert__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4" /><path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0" /><path d="M12 16h.01" /></svg>
          </span>
          <div className="ax-alert__content">
            <h4 className="ax-alert__title" style={{ fontWeight: 600 }}>{errorMsg}</h4>
          </div>
        </div>
      )}

      {/* ── Unified Single Form Card ── */}
      <form onSubmit={handleSubmit} noValidate>
        <div className="ax-card">
          {/* Card Header with Title and Section Pills */}
          <div className="ax-card__header">
            <div>
              <span className="ax-card__eyebrow">Site Survey</span>
              <h2 className="ax-card__title" style={{ margin: 0 }}>
                {isEditMode ? 'Update Kashmir SRT 70MW Survey Data' : 'Kashmir SRT 70MW Survey'}
              </h2>
              <p className="ax-card__subtitle" style={{ margin: '4px 0 0' }}>
                The field labels marked with <span style={{ color: 'var(--ax-danger-500)', fontWeight: 700 }}>*</span> are input fields.
              </p>
            </div>

            <div className="kashmir-section-pills" role="navigation" aria-label="Jump to section">
              {SECTIONS.map((s) => (
                <button key={s.id} type="button" onClick={() => scrollToSection(s.id)} className="kashmir-section-pill-btn">
                  <span className="pill-num">{s.num}</span>
                  <span>{s.title}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="ax-card__body">
            {/* ═════════ SECTION 1: GENERAL INFORMATION ═════════ */}
            <div id="sec-1" className="kashmir-section-block">
              <SectionHeader num="1" title="General Information" desc="Site identification, contact person and proposed system capacity." />
              <div className="kashmir-form-grid kashmir-form-grid--3col">
                <FloatingSelect
                  id="kashmir-site"
                  label="Select From Pending Sites"
                  placeholder={loadingSites ? 'Loading pending sites…' : '-- Choose Assigned Pending Site --'}
                  value={selectedSiteId}
                  options={siteSelectOptions}
                  disabled={loadingSites}
                  onChange={handleSiteSelect}
                />
                <FloatingInput id="kashmir-district" label="District" required placeholder="Enter District" {...f('district')} />
                <FloatingInput id="kashmir-dept" label="Department" required placeholder="Enter Department" {...f('department')} />
                <FloatingInput id="kashmir-site-name" label="Site Name" required placeholder="Enter Site Name" {...f('site_name')} />
                <FloatingInput id="kashmir-landmark" label="Nearest Landmark" required placeholder="Nearby landmark" {...f('near_landmark')} />
                <FloatingInput id="kashmir-contact-person" label="Name Of Current Contact Person" required placeholder="Contact person name" {...f('contact_person')} />
                <FloatingInput
                  id="kashmir-contact-no"
                  label="Contact No"
                  type="tel"
                  maxLength={12}
                  required
                  placeholder="Contact number"
                  {...f('contact_no')}
                  onChange={(v) => setField('contact_no', v.replace(/\D/g, ''))}
                />
                <FloatingInput id="kashmir-proposed-cap" label="Proposed Capacity (In KW)" type="number" step="0.01" required placeholder="Enter Capacity" {...f('proposed_capacity')} />
                <div className="kashmir-form-col-span-full">
                  <FloatingTextarea id="kashmir-site-address" label="Site Address" required placeholder="Full site address" {...f('survey_site_address')} />
                </div>
              </div>
            </div>

            <hr className="kashmir-section-divider" />

            {/* ═════════ SECTION 2: TECHNICAL INFORMATION ═════════ */}
            <div id="sec-2" className="kashmir-section-block">
              <SectionHeader num="2" title="Technical Information" desc="Coordinates, electrical connection, meter parameters and rooftop structural parameters." />
              <div className="kashmir-form-grid kashmir-form-grid--3col">
                <FloatingInput id="kashmir-lat" label="Latitude" required placeholder="e.g. 34.0837" {...f('latitude')} />
                <FloatingInput id="kashmir-lng" label="Longitude" required placeholder="e.g. 74.7973" {...f('longitude')} />
                <div>
                  <button
                    type="button"
                    className="ax-btn ax-btn--secondary kashmir-gps-cell"
                    style={{ width: '100%' }}
                    onClick={handleGetLocation}
                    disabled={gpsLoading}
                  >
                    <span className="ax-btn__label">{gpsLoading ? 'Fetching GPS…' : '📍 Get GPS'}</span>
                  </button>
                </div>

                <FloatingSelect id="kashmir-load-type" label="Type Of Load AC/DC" required placeholder="-- Select Load Type --" options={opts(['AC', 'DC'])} {...f('load_type')} />
                <FloatingSelect id="kashmir-conn-phase" label="Connection (1 Phase Or 3 Phase)" required placeholder="-- Select Connection Phase --" options={opts(['1 Phase', '3 Phase'])} {...f('connection_type')} />
                <FloatingSelect id="kashmir-meter-conn" label="Meter Connection Type HT/LT/Normal" required placeholder="-- Meter Connection Type --" options={opts(['LT', 'HT', 'Normal'])} {...f('meter_connection_type')} />
                <FloatingInput id="kashmir-ca-no" label="CA No." required placeholder="Enter CA No." {...f('ca_no')} />
                <FloatingInput id="kashmir-meter-no" label="Meter No." required placeholder="Enter Meter No." {...f('meter_no')} />
                <FloatingInput id="kashmir-sanction" label="Sanction Load KW/KVA" required placeholder="Enter Sanction Load" {...f('sanction_load')} />
                <FloatingInput id="kashmir-inst-load" label="Instantaneous/Corrected Load (KW)" required placeholder="Enter Load" {...f('instantaneous_load')} />
                <FloatingSelect id="kashmir-grid" label="Grid Availability (YES Or NO)" required placeholder="-- Select Grid Availability --" options={yesNo} {...f('grid_availability')} />
                <FloatingSelect id="kashmir-3phase" label="Is All Three Phase Available In LTDB" required placeholder="-- Select Three Phase Availability --" options={yesNo} {...f('three_phase_available')} />
                <FloatingInput id="kashmir-missing" label="If Phase Is Missing, Name I.E., R,Y,B,N" placeholder="None / R / Y / B / N" {...f('missing_phase')} />
                <FloatingSelect id="kashmir-ltdb" label="LTDB (Present/Not Present)" required placeholder="-- Select LTDB Status --" options={yesNo} {...f('ltdb_status')} />
                <FloatingSelect id="kashmir-dg" label="Is Existing DG SET" required placeholder="-- Select --" options={yesNo} {...f('dg_set_available')} />

                {formData.dg_set_available === 'Yes' && (
                  <>
                    <FloatingInput id="kashmir-dg-cap" label="DG SET Capacity" placeholder="Enter Capacity" {...f('dg_set_capacity')} />
                    <FloatingInput id="kashmir-dg-make" label="DG SET Make" placeholder="Enter Make" {...f('dg_set_make')} />
                  </>
                )}

                <FloatingSelect id="kashmir-roof-cond" label="Roof Condition for Solar Power Plant" required placeholder="-- Select Roof Contion --" options={opts(['Feasiable', 'Not Feasiable', 'Feasible', 'Not Feasible'])} {...f('roof_condition')} />
                <FloatingInput id="kashmir-roof-area" label="Total Area Of Roof (In Sqmm)" required placeholder="Enter Area" {...f('roof_area')} />
                <FloatingInput id="kashmir-free-solar" label="Free Space For Solar Installation (In Sqmm)" required placeholder="Enter Free Space" {...f('solar_free_space')} />
                <FloatingInput id="kashmir-free-ctrl" label="Free Space For Control Room (In Sqmm)" required placeholder="Enter Free Space" {...f('control_room_free_space')} />
                <FloatingSelect id="kashmir-earth" label="Earth Pit Position (Ok/Not Ok)" required placeholder="-- Select Earth Pit Position --" options={opts(['Ok', 'Not Ok'])} {...f('earth_pit_position')} />
                <FloatingInput id="kashmir-ac-cable" label="Routing of AC Cable from System Area (mtr)" required placeholder="Enter Distance" {...f('ac_cable_routing')} />
                <FloatingSelect id="kashmir-roof-type" label="Type of Roof (RCC/Tin Shed)" required placeholder="-- Type of Roof --" options={opts(['RCC', 'Tin Shed', 'Other'])} {...f('roof_type')} />
                <FloatingSelect id="kashmir-struct" label="Type of Structure Required (Elevated/Normal/Mono Rail)" required placeholder="-- Type of Structure --" options={opts(['Elevated', 'Normal', 'Mono Rail'])} {...f('structure_type')} />
              </div>
            </div>

            <hr className="kashmir-section-divider" />

            {/* ═════════ SECTION 3: CIVIL / STRUCTURAL ═════════ */}
            <div id="sec-3" className="kashmir-section-block">
              <SectionHeader num="3" title="Civil / Structural" desc="Building age, floor details, roof access and safety height parameters." />
              <div className="kashmir-form-grid kashmir-form-grid--3col">
                <FloatingInput id="kashmir-bldg-age" label="Age Of Building" required placeholder="Enter Age" {...f('building_age')} />
                <FloatingSelect id="kashmir-roof-access" label="Access To The Roof" required placeholder="-- Select Access to Roof --" options={opts(['Available', 'Not Available'])} {...f('roof_access')} />
                <FloatingInput id="kashmir-rooftop-ht" label="Rooftop Height (MTR)" required placeholder="Enter Height" {...f('rooftop_height')} />
                <FloatingInput id="kashmir-parapet-ht" label="Parapet Height (MTR)" required placeholder="Enter Height" {...f('parapet_height')} />
                <FloatingInput id="kashmir-floors" label="No. Of Floors (G+..)" required placeholder="e.g. G+2" {...f('number_of_floors')} />
              </div>
            </div>

            <hr className="kashmir-section-divider" />

            {/* ═════════ SECTION 4: OTHER INFORMATION & MEDIA ═════════ */}
            <div id="sec-4" className="kashmir-section-block">
              <SectionHeader num="4" title="Other Information & Media" desc="Site road accessibility and site survey photograph uploads." />
              <div className="kashmir-form-grid kashmir-form-grid--3col">
                <FloatingInput id="kashmir-access" label="Access To Site" required placeholder="Enter Access Details" {...f('site_access')} />
                <FloatingInput id="kashmir-distance" label="Distance Of Site From Main Road (KM)" required placeholder="Enter Distance" {...f('site_distance')} />
                <div />

                <FloatingFileInput id="kashmir-img-building" label="Building Image" required={!isEditMode} accept="image/*" file={files.building_image} existingUrl={mediaUrl(existingImages.building_image)} onChange={(file) => handleFileChange('building_image', file)} error={validationErrors.building_image?.[0]} />
                <FloatingFileInput id="kashmir-img-roof" label="Roof Image" required={!isEditMode} accept="image/*" file={files.roof_image} existingUrl={mediaUrl(existingImages.roof_image)} onChange={(file) => handleFileChange('roof_image', file)} error={validationErrors.roof_image?.[0]} />
                <FloatingFileInput id="kashmir-img-control" label="Control Room Image" required={!isEditMode} accept="image/*" file={files.control_room_image} existingUrl={mediaUrl(existingImages.control_room_image)} onChange={(file) => handleFileChange('control_room_image', file)} error={validationErrors.control_room_image?.[0]} />
                <FloatingFileInput id="kashmir-img-other" label="Other Image (Optional)" accept="image/*" file={files.image4} existingUrl={mediaUrl(existingImages.image4)} onChange={(file) => handleFileChange('image4', file)} error={validationErrors.image4?.[0]} />
                <FloatingFileInput id="kashmir-pdf" label="PDF (Optional, only .pdf)" accept="application/pdf" file={files.pdf} existingUrl={mediaUrl(existingImages.pdf)} onChange={(file) => handleFileChange('pdf', file)} error={validationErrors.pdf?.[0]} />
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Action Footer (outside the card, same as Bihar) */}
        <div className="kashmir-form-sticky-bar">
          <span className="ax-badge ax-badge--soft ax-badge--primary ax-badge--pill">
            {isEditMode ? 'Edit Mode' : 'New Survey'}
          </span>
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)' }}>
            <button type="button" className="ax-btn ax-btn--secondary" onClick={() => navigate('/v/kashmir/srt70mw/survey-view')} disabled={submitting}>
              <span className="ax-btn__label">Cancel</span>
            </button>
            <button type="submit" disabled={submitting} className="ax-btn ax-btn--primary" style={{ minWidth: 200 }}>
              {submitting ? (
                <>
                  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ animation: 'kashmir-spin 1s linear infinite' }}><path d="M12 3a9 9 0 1 0 9 9" /></svg>
                  <span className="ax-btn__label">Saving Survey...</span>
                </>
              ) : (
                <>
                  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5l10 -10" /></svg>
                  <span className="ax-btn__label">{isEditMode ? 'Update Survey' : 'Submit Survey'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      <footer style={{ marginTop: 'var(--ax-space-8)', textAlign: 'center', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
        Copyright © <a href="https://klkerp.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--ax-primary)' }}>ETS NETWORKS</a>. All rights reserved.
      </footer>
    </div>
  );
}

/* =========================================================================
 * Reusable Floating Components (same as Bihar SRT)
 * ========================================================================= */

function SectionHeader({ num, title, desc }: { num: string; title: string; desc?: ReactNode }) {
  return (
    <div className="kashmir-section-header">
      <div className="kashmir-section-title-wrap">
        <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', alignItems: 'center' }}>
          <span className="ax-badge ax-badge--soft ax-badge--primary ax-badge--pill" style={{ fontWeight: 600 }}>
            Section {num} of {TOTAL_SECTIONS}
          </span>
          <h3 style={{ fontSize: 'var(--ax-text-base)', fontWeight: 600, margin: 0, color: 'var(--ax-text-strong)' }}>{title}</h3>
        </div>
        {desc && <p style={{ margin: '4px 0 0', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>{desc}</p>}
      </div>
    </div>
  );
}

const Asterisk = () => <span style={{ color: 'var(--ax-danger-500)', marginLeft: 3 }}>*</span>;

function FieldFeedback({ error }: { error?: string }) {
  if (error) {
    return (
      <span className="ax-field-feedback ax-field-feedback--error" role="alert">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 12, height: 12 }}>
          <circle cx="12" cy="12" r="9" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        {error}
      </span>
    );
  }
  return <span className="ax-field-feedback" />;
}

interface FloatingInputProps {
  id: string;
  label: string;
  type?: string;
  step?: string;
  required?: boolean;
  readOnly?: boolean;
  maxLength?: number;
  placeholder?: string;
  value: string;
  onChange?: (val: string) => void;
  error?: string;
}

function FloatingInput({ id, label, type = 'text', step, required, readOnly, maxLength, placeholder = ' ', value, onChange, error }: FloatingInputProps) {
  return (
    <div>
      <div className="ax-float">
        <input
          id={id}
          type={type}
          step={step}
          className={`ax-input ax-float__input ${error ? 'is-invalid' : ''}`}
          placeholder={placeholder}
          value={value}
          readOnly={readOnly}
          maxLength={maxLength}
          onChange={(e) => onChange?.(e.target.value)}
          aria-invalid={Boolean(error)}
        />
        <label className="ax-float__label" htmlFor={id}>
          {label}
          {required && <Asterisk />}
        </label>
      </div>
      <FieldFeedback error={error} />
    </div>
  );
}

interface FloatingSelectProps {
  id: string;
  label: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  value: string;
  options: Option[];
  onChange: (val: string) => void;
  error?: string;
}

function FloatingSelect({ id, label, required, disabled, placeholder = '-- Select --', value, options, onChange, error }: FloatingSelectProps) {
  return (
    <div>
      <div className="ax-float ax-float--select">
        <select
          id={id}
          className={`ax-select ax-float__input ${error ? 'is-invalid' : ''}`}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(error)}
        >
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <label className="ax-float__label" htmlFor={id}>
          {label}
          {required && <Asterisk />}
        </label>
      </div>
      <FieldFeedback error={error} />
    </div>
  );
}

interface FloatingTextareaProps {
  id: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  value: string;
  rows?: number;
  onChange: (val: string) => void;
  error?: string;
}

function FloatingTextarea({ id, label, required, placeholder = 'Enter Remarks...', value, rows = 3, onChange, error }: FloatingTextareaProps) {
  return (
    <div>
      <div className="ax-float ax-float--area">
        <textarea
          id={id}
          rows={rows}
          className={`ax-textarea ax-float__input ${error ? 'is-invalid' : ''}`}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(error)}
        />
        <label className="ax-float__label" htmlFor={id}>
          {label}
          {required && <Asterisk />}
        </label>
      </div>
      <FieldFeedback error={error} />
    </div>
  );
}

interface FloatingFileInputProps {
  id: string;
  label: string;
  required?: boolean;
  accept?: string;
  file: File | null;
  existingUrl?: string | null;
  onChange: (file: File | null) => void;
  error?: string;
}

const IMG_RE = /\.(png|jpe?g|webp|gif|svg)$/i;

function FloatingFileInput({ id, label, required, accept, file, existingUrl, onChange, error }: FloatingFileInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const objectUrl = useMemo(
    () => (file && file.type.startsWith('image/') ? URL.createObjectURL(file) : null),
    [file]
  );
  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const chosen = e.dataTransfer.files?.[0];
    if (chosen) onChange(chosen);
  };

  const existingClean = existingUrl ? existingUrl.split('?')[0] : '';
  const existingName = existingClean ? existingClean.split('/').pop() : null;
  const existingIsImage = Boolean(existingClean && IMG_RE.test(existingClean));

  const thumbStyle = {
    width: 44,
    height: 44,
    objectFit: 'cover' as const,
    borderRadius: 0,
    border: '1px solid var(--ax-border)',
    flexShrink: 0,
  };

  const iconCircle = (bg: string, fg: string, children: ReactNode) => (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        background: bg,
        color: fg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {children}
    </div>
  );

  return (
    <div className={error ? 'is-invalid' : undefined} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label
        htmlFor={id}
        style={{
          fontSize: '12px',
          fontWeight: 600,
          color: error ? 'var(--ax-danger-500, #ef4444)' : 'var(--ax-text-strong, #334155)',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <span>{label}</span>
        {required && <Asterisk />}
      </label>

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        style={{ display: 'none' }}
        onChange={(e) => onChange(e.target.files?.[0] || null)}
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
            : isHovered ? '1.5px dashed #94a3b8' : '1.5px dashed #cbd5e1',
          borderRadius: 8,
          background: isDragging
            ? '#eff6ff'
            : error
            ? '#fef2f2'
            : isHovered ? '#fbfcfd' : '#ffffff',
          padding: file || existingName ? '12px 16px' : '22px 16px',
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
        {file ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, textAlign: 'left' }}>
              {objectUrl ? (
                <img src={objectUrl} alt={label} style={thumbStyle} />
              ) : (
                iconCircle('#ecfdf5', '#10b981',
                  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                )
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', marginTop: 2 }}>
                  {(file.size / 1024).toFixed(0)} KB · Ready to upload
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
        ) : existingName ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, textAlign: 'left' }}>
              {existingIsImage && existingUrl ? (
                <img src={existingUrl} alt={label} style={thumbStyle} />
              ) : (
                iconCircle('#eff6ff', '#3b82f6',
                  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                )
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {existingName}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', marginTop: 2 }}>
                  Existing file · Click to replace
                </div>
              </div>
            </div>
            <span className="ax-btn ax-btn--secondary ax-btn--sm" style={{ flexShrink: 0, pointerEvents: 'none' }}>
              Replace
            </span>
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
              Click to upload or drag & drop
            </div>
            <div style={{ fontSize: 11, color: 'var(--ax-text-muted, #64748b)', marginTop: 3 }}>
              {accept === 'application/pdf' ? 'PDF file' : 'JPG, PNG or WEBP'}
            </div>
          </>
        )}
      </div>

      <FieldFeedback error={error} />
    </div>
  );
}

export default Kashmir_Survey_AddData;