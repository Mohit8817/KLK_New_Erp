import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  upSurveyService,
  getUpSurveyMediaUrl,
  type UpRescoPendingSite,
  type UpRescoSiteDetail,
  type UpRescoSurveyRecord,
} from '../../up-services';

// CSS: Unified Single-Card Layout with Floating Labels & Section Dividers (same as Bihar SRT design)
const SINGLE_CARD_FORM_CSS = `
.up-single-card-form .ax-card { border: 1px solid var(--ax-border); border-radius: var(--ax-radius-xl); background: var(--ax-surface-solid); box-shadow: var(--ax-shadow-sm); overflow: hidden; }
.up-single-card-form .ax-card__header { padding: var(--ax-space-5) var(--ax-space-6); border-bottom: 1px solid var(--ax-border-subtle); background: var(--ax-surface-subtle); display: flex; flex-direction: column; gap: var(--ax-space-4); }
.up-single-card-form .ax-card__body { padding: var(--ax-space-6); }

.up-section-pills { display: flex; gap: var(--ax-space-2); overflow-x: auto; padding-bottom: 4px; scrollbar-width: thin; }
.up-section-pill-btn { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: var(--ax-radius-pill); font-size: var(--ax-text-xs); font-weight: 500; white-space: nowrap; background: var(--ax-surface-solid); border: 1px solid var(--ax-border); color: var(--ax-text); cursor: pointer; transition: all var(--ax-motion-fast) var(--ax-ease-standard); text-decoration: none; }
.up-section-pill-btn:hover { border-color: var(--ax-accent); color: var(--ax-accent); background: color-mix(in srgb, var(--ax-accent) 6%, var(--ax-surface-solid)); }
.up-section-pill-btn .pill-num { width: 18px; height: 18px; border-radius: 50%; background: var(--ax-surface-subtle); display: inline-flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; }

.up-section-block { padding-top: var(--ax-space-2); scroll-margin-top: 80px; }
.up-section-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: var(--ax-space-2); margin-bottom: var(--ax-space-5); padding-bottom: var(--ax-space-3); border-bottom: 1px solid var(--ax-border-subtle); }
.up-section-title-wrap { display: flex; flex-direction: column; gap: 4px; }
.up-section-divider { border: 0; border-top: 1px dashed var(--ax-border); margin: var(--ax-space-8) 0 var(--ax-space-6); }

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

.up-form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--ax-space-4); }
@media (min-width: 1024px) { .up-form-grid--3col { grid-template-columns: repeat(3, 1fr); } }
.up-form-col-span-full { grid-column: 1 / -1; }
.up-gps-cell { height: 46px; }

.up-form-sticky-bar { position: sticky; bottom: var(--ax-space-4); z-index: 30; margin-top: var(--ax-space-6); padding: var(--ax-space-3) var(--ax-space-5); background: var(--ax-surface-solid); border: 1px solid var(--ax-border); border-radius: var(--ax-radius-xl); box-shadow: var(--ax-shadow-lg); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--ax-space-3); backdrop-filter: blur(12px); }

@keyframes up-spin { to { transform: rotate(360deg); } }
`;

type Option = { value: string; label: string };
const opts = (arr: string[]): Option[] => arr.map((v) => ({ value: v, label: v }));
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const INITIAL_FORM = {
  // Fill this form
  site_address: '',
  landmark: '',
  agency_person_name: '',
  agency_person_contact: '',
  nodal_person: '',
  contact_nodal: '',
  latitude: '',
  longitude: '',

  // Technical information
  load_type: 'AC',
  connection_phase: '3 Phase',
  meter_connection: 'LT',
  meter_number: '',
  meter_type: 'Smart Meter',
  sanction_load: '',
  connected_load: '',
  grid_power: 'Yes',
  all_3_phase_ltdb: 'Yes',
  missing_phase: 'None',
  ltdb_present: 'Present',
  roof_condition: 'Feasible',
  area_roof: '',
  free_space_solar: '',
  free_space_inverter: '',
  earth_pit: 'Ok',
  site_feasible: 'Feasible',
  survey_remarks: '',

  // Civil / Structural
  building_age: '',
  roof_access: 'Available',
  rooftop_height: '',
  parapet_height: '',
  floors_number: '',
  water_source: '',

  // Other information
  site_access: '',
  site_distance: '',
};

type FormKey = keyof typeof INITIAL_FORM;
type FileKey = 'building_image' | 'roof_image' | 'control_room_image' | 'image4' | 'image5' | 'pdf';

const REQUIRED_FIELDS: Partial<Record<FormKey, string>> = {
  site_address: 'Site address is required.',
  landmark: 'Nearest landmark is required.',
  agency_person_name: 'Agency contact person name is required.',
  agency_person_contact: 'Agency contact number is required.',
  nodal_person: 'Nodal person name is required.',
  contact_nodal: 'Nodal contact number is required.',
  latitude: 'Latitude is required.',
  longitude: 'Longitude is required.',
  meter_number: 'Meter number is required.',
  sanction_load: 'Sanction load is required.',
  connected_load: 'Connected load is required.',
  missing_phase: 'This field is required.',
  area_roof: 'Total roof area is required.',
  free_space_solar: 'Free space for solar is required.',
  free_space_inverter: 'Free space for inverter is required.',
  survey_remarks: 'Survey remarks are required.',
  building_age: 'Age of building is required.',
  rooftop_height: 'Rooftop height is required.',
  parapet_height: 'Parapet height is required.',
  floors_number: 'Number of floors is required.',
  water_source: 'Water source for cleaning is required.',
  site_access: 'Access to site is required.',
  site_distance: 'Distance of site from main road is required.',
};

const SECTIONS = [
  { id: 'sec-1', num: '1', title: 'Select Site' },
  { id: 'sec-2', num: '2', title: 'General Info' },
  { id: 'sec-3', num: '3', title: 'Address & Contacts' },
  { id: 'sec-4', num: '4', title: 'Technical' },
  { id: 'sec-5', num: '5', title: 'Civil / Structural' },
  { id: 'sec-6', num: '6', title: 'Other Info & Media' },
];

const str = (v: any) => (v === null || v === undefined ? '' : String(v));

export function UP_Survey_Resco_AddResco() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit_id');
  const isEdit = Boolean(editId);

  // Pending sites & selected site
  const [sites, setSites] = useState<UpRescoPendingSite[]>([]);
  const [loadingSites, setLoadingSites] = useState(false);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [siteDetail, setSiteDetail] = useState<UpRescoSiteDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [editRecord, setEditRecord] = useState<UpRescoSurveyRecord | null>(null);

  // Form + files
  const [formData, setFormData] = useState({ ...INITIAL_FORM });
  const [files, setFiles] = useState<Record<FileKey, File | null>>({
    building_image: null,
    roof_image: null,
    control_room_image: null,
    image4: null,
    image5: null,
    pdf: null,
  });
  const [existingFiles, setExistingFiles] = useState<Partial<Record<FileKey, string>>>({});

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});

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
    if (file && file.size > MAX_FILE_SIZE) {
      alert('File size exceeds 5MB limit.');
      return;
    }
    setFiles((prev) => ({ ...prev, [key]: file }));
    if (validationErrors[key]) clearError(key);
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // 1. Load pending sites (create mode)
  useEffect(() => {
    if (isEdit) return;
    setLoadingSites(true);
    upSurveyService
      .getRescoPendingSites()
      .then((res) => setSites(res))
      .catch((err) => console.error('Error loading pending Resco sites:', err))
      .finally(() => setLoadingSites(false));
  }, [isEdit]);

  // 2. Load survey record (edit mode)
  useEffect(() => {
    if (!isEdit || !editId) return;
    setLoadingDetail(true);
    upSurveyService
      .getRescoSurveyForEdit(editId)
      .then((rec) => {
        if (!rec) return;
        setEditRecord(rec);
        setSelectedSiteId(String(rec.id));
        setFormData({
          site_address: str(rec.survey_address || rec.site_address),
          landmark: str(rec.near_landmark),
          agency_person_name: str(rec.agency_person_name),
          agency_person_contact: str(rec.agency_person_contact),
          nodal_person: str(rec.nodal_person),
          contact_nodal: str(rec.contact_nodal),
          latitude: str(rec.latitude),
          longitude: str(rec.longitude),
          load_type: rec.load_type || 'AC',
          connection_phase: rec.connection_phase || '3 Phase',
          meter_connection: rec.meter_connection || 'LT',
          meter_number: str(rec.meter_number),
          meter_type: rec.meter_type || 'Smart Meter',
          sanction_load: str(rec.sanction_load),
          connected_load: str(rec.connected_load),
          grid_power: rec.grid_power || 'Yes',
          all_3_phase_ltdb: rec.all_3_phase_ltdb || 'Yes',
          missing_phase: rec.missing_phase || 'None',
          ltdb_present: rec.ltdb_present || 'Present',
          roof_condition: rec.roof_condition || 'Feasible',
          area_roof: str(rec.area_roof),
          free_space_solar: str(rec.free_space_solar),
          free_space_inverter: str(rec.free_space_inverter),
          earth_pit: rec.earth_pit || 'Ok',
          site_feasible: rec.site_feasible || 'Feasible',
          survey_remarks: str(rec.survey_remarks),
          building_age: str(rec.building_age || rec.age_of_building),
          roof_access: rec.roof_access || 'Available',
          rooftop_height: str(rec.rooftop_height),
          parapet_height: str(rec.parapet_height),
          floors_number: str(rec.floors_number),
          water_source: str(rec.water_source),
          site_access: str(rec.site_access),
          site_distance: str(rec.site_distance),
        });

        const existing: Partial<Record<FileKey, string>> = {};
        if (rec.image1) existing.building_image = getUpSurveyMediaUrl(rec.image1);
        if (rec.image2) existing.roof_image = getUpSurveyMediaUrl(rec.image2);
        if (rec.image3) existing.control_room_image = getUpSurveyMediaUrl(rec.image3);
        if (rec.image4) existing.image4 = getUpSurveyMediaUrl(rec.image4);
        if (rec.image5) existing.image5 = getUpSurveyMediaUrl(rec.image5);
        if (rec.pdf_file || rec.pdf) existing.pdf = getUpSurveyMediaUrl(rec.pdf_file || rec.pdf);
        setExistingFiles(existing);
      })
      .catch((err) => {
        console.error('Error fetching survey for edit:', err);
        setErrorMsg('Failed to load survey record for editing.');
      })
      .finally(() => setLoadingDetail(false));
  }, [isEdit, editId]);

  // 3. Site selection -> fetch detail
  const handleSiteSelect = async (siteId: string) => {
    setSelectedSiteId(siteId);
    clearError('site_name');
    if (!siteId) {
      setSiteDetail(null);
      return;
    }
    setLoadingDetail(true);
    try {
      const detail = await upSurveyService.getRescoSiteDetail(siteId);
      setSiteDetail(detail);
      if (detail?.address) {
        setFormData((prev) => ({ ...prev, site_address: prev.site_address || detail.address }));
      }
    } catch (err) {
      console.error('Error fetching site detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  // GPS detection
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
        setLocating(false);
      },
      (err) => {
        alert(`Location error: ${err.message}. Please enter coordinates manually.`);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Validation
  const validate = () => {
    const errs: Record<string, string[]> = {};
    if (!selectedSiteId) errs.site_name = ['Please select a site to survey.'];
    (Object.keys(REQUIRED_FIELDS) as FormKey[]).forEach((key) => {
      if (!formData[key].trim()) errs[key] = [REQUIRED_FIELDS[key] as string];
    });
    if (!isEdit) {
      if (!files.building_image) errs.building_image = ['Building image is required.'];
      if (!files.roof_image) errs.roof_image = ['Roof image is required.'];
      if (!files.control_room_image) errs.control_room_image = ['Control room image is required.'];
    }
    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Submit
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    if (!validate()) {
      setErrorMsg('Please correct the highlighted fields before submitting.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => {
        document.querySelector('.is-invalid')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      // In store endpoint, site_name carries the site ID
      if (!isEdit) fd.append('site_name', selectedSiteId);
      Object.entries(formData).forEach(([key, val]) => fd.append(key, val ?? ''));

      if (files.building_image) fd.append('building_image', files.building_image);
      if (files.roof_image) fd.append('roof_image', files.roof_image);
      if (files.control_room_image) fd.append('control_room_image', files.control_room_image);
      if (files.image4) fd.append('image4', files.image4);
      if (files.image5) fd.append('image5', files.image5);
      if (files.pdf) fd.append('pdf', files.pdf);

      const res =
        isEdit && editId
          ? await upSurveyService.updateRescoSurveyStore(editId, fd)
          : await upSurveyService.storeRescoSurvey(fd);

      if (res.status) {
        setSuccessMsg(res.message || (isEdit ? 'Survey Updated Successfully!!!' : 'Survey Complete Successfully!!!'));
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => {
          navigate('/v/up/view-resco-survey');
        }, 1200);
      } else {
        setErrorMsg(res.message || 'Failed to submit survey.');
        if (res.errors) setValidationErrors(res.errors);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error occurred while saving survey.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  const currentGeneral: any = useMemo(() => {
    if (siteDetail) return siteDetail;
    if (editRecord) {
      return {
        uid: editRecord.uid || `RESCO-${editRecord.id}`,
        state: editRecord.state || 'UP',
        district: editRecord.district || '',
        division: editRecord.division || '',
        sub_division: editRecord.sub_division || '',
        dept_name: editRecord.dept_name || '',
        site_name: editRecord.site_name || '',
        address: editRecord.site_address || '',
        ca_no: editRecord.ca_no || '',
      };
    }
    return null;
  }, [siteDetail, editRecord]);

  const siteSelectOptions: Option[] = sites.map((s) => ({
    value: String(s.id),
    label: `${s.uid ? `[${s.uid}] ` : ''}${s.site_name} - ${s.district || s.state}`,
  }));
  if (isEdit && editRecord) {
    siteSelectOptions.unshift({ value: String(editRecord.id), label: `${editRecord.site_name || 'Site'} (#${editId})` });
  }

  const yesNo = opts(['Yes', 'No']);

  return (
    <div className="up-single-card-form">
      <style>{SINGLE_CARD_FORM_CSS}</style>

      <PageHead
        title={isEdit ? 'Edit UP Resco Survey' : 'Create UP Resco Survey'}
        subtitle={
          <span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>
            {isEdit ? 'Edit UP Resco Survey Feasibility Report' : 'Site Feasibility Report'}
          </span>
        }
        breadcrumbs={[
          { label: 'Home', href: '/v' },
          { label: 'UP Resco Survey', href: '/v/up/view-resco-survey' },
          { label: isEdit ? 'Edit Resco' : 'Add Resco' },
        ]}
        actions={
          <Link to="/v/up/view-resco-survey" className="ax-btn ax-btn--secondary ax-btn--pill">
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

      {/* Main Single Card Form */}
      <form onSubmit={handleSubmit} noValidate>
        <div className="ax-card">
          {/* Card Header with Title and Section Pills */}
          <div className="ax-card__header">
            <div>
              <span className="ax-card__eyebrow">Site Survey</span>
              <h2 className="ax-card__title" style={{ margin: 0 }}>
                {isEdit ? 'Edit UP Resco Survey' : 'Site Feasibility Report'}
              </h2>
              <p className="ax-card__subtitle" style={{ margin: '4px 0 0' }}>
                All survey fields organized inside one main card across 6 dedicated sections.
              </p>
            </div>

            <div className="up-section-pills" role="navigation" aria-label="Jump to section">
              {SECTIONS.map((s) => (
                <button key={s.id} type="button" onClick={() => scrollToSection(s.id)} className="up-section-pill-btn">
                  <span className="pill-num">{s.num}</span>
                  <span>{s.title}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="ax-card__body">
            {/* Section 1: Select Site */}
            <div id="sec-1" className="up-section-block">
              <SectionHeader num="1" total={6} title="Select Site" desc="Choose the allocated site for this survey." />
              <div className="up-form-grid up-form-grid--3col">
                <div className="up-form-col-span-full" style={{ maxWidth: 540 }}>
                  <FloatingSelect
                    id="up-resco-site"
                    label="Site Name / UID"
                    required
                    placeholder={loadingSites ? 'Loading pending sites...' : '-- Select Site --'}
                    value={selectedSiteId}
                    options={siteSelectOptions}
                    disabled={isEdit || loadingSites}
                    onChange={handleSiteSelect}
                    error={validationErrors.site_name?.[0]}
                  />
                </div>
              </div>
            </div>

            <hr className="up-section-divider" />

            {/* Section 2: General Information (read-only) */}
            <div id="sec-2" className="up-section-block">
              <SectionHeader
                num="2"
                total={6}
                title="General Information"
                desc={loadingDetail ? 'Loading site details...' : 'Auto-populated from selected site record (Read-only).'}
              />
              <div className="up-form-grid up-form-grid--3col">
                <FloatingInput id="up-uid" label="Unique ID" readOnly value={currentGeneral?.uid || ''} />
                <FloatingInput id="up-state" label="State" readOnly value={(currentGeneral?.state || 'UP').toUpperCase()} />
                <FloatingInput id="up-district" label="District" readOnly value={currentGeneral?.district || ''} />
                <FloatingInput id="up-division" label="Division" readOnly value={currentGeneral?.division || ''} />
                <FloatingInput id="up-subdivision" label="Sub Division" readOnly value={currentGeneral?.sub_division || ''} />
                <FloatingInput id="up-department" label="Department" readOnly value={currentGeneral?.dept_name || ''} />
                <FloatingInput id="up-site-name" label="Site Name" readOnly value={currentGeneral?.site_name || ''} />
                <FloatingInput id="up-location" label="Location / Address" readOnly value={currentGeneral?.address || currentGeneral?.location || ''} />
                <FloatingInput id="up-ca-no" label="CA No." readOnly value={currentGeneral?.ca_no || ''} />
              </div>
            </div>

            <hr className="up-section-divider" />

            {/* Section 3: Address & Contacts */}
            <div id="sec-3" className="up-section-block">
              <SectionHeader
                num="3"
                total={6}
                title="Fill this Form"
                desc={<>The field labels marked with <span style={{ color: 'var(--ax-danger-500)' }}>*</span> are input fields.</>}
              />
              <div className="up-form-grid up-form-grid--3col">
                <FloatingInput id="up-lat" label="Latitude" required placeholder="e.g. 26.8467" {...f('latitude')} />
                <FloatingInput id="up-lng" label="Longitude" required placeholder="e.g. 80.9462" {...f('longitude')} />
                <div>
                  <button type="button" className="ax-btn ax-btn--secondary up-gps-cell" style={{ width: '100%' }} onClick={handleGetLocation} disabled={locating}>
                    <span className="ax-btn__label">{locating ? 'Detecting GPS...' : '📍 Get GPS'}</span>
                  </button>
                </div>

                <div className="up-form-col-span-full">
                  <FloatingInput id="up-address" label="Site Address (details)" required placeholder="Enter Site Address" {...f('site_address')} />
                </div>

                <FloatingInput id="up-landmark" label="Nearest Landmark" required placeholder="Enter Nearest Landmark" {...f('landmark')} />
                <FloatingInput id="up-agency-name" label="Name of Contact Person of Agency" required placeholder="Enter Name of Contact Person" {...f('agency_person_name')} />
                <FloatingInput id="up-agency-contact" label="Contact Number" type="tel" required placeholder="Enter Contact No. of the Person" {...f('agency_person_contact')} />
                <FloatingInput id="up-nodal" label="Nodal Person of concern building" required placeholder="Enter Name of Nodal Person" {...f('nodal_person')} />
                <FloatingInput id="up-nodal-contact" label="Contact Number of Nodal Person" type="tel" required placeholder="Enter Contact of Nodal Person" {...f('contact_nodal')} />
              </div>
            </div>

            <hr className="up-section-divider" />

            {/* Section 4: Technical Information */}
            <div id="sec-4" className="up-section-block">
              <SectionHeader num="4" total={6} title="Technical Information" desc="Electrical & roof data." />
              <div className="up-form-grid up-form-grid--3col">
                <FloatingSelect id="up-load-type" label="Type of Load" required placeholder="Select Type of Load..." options={opts(['AC', 'DC', 'Mixed'])} {...f('load_type')} />
                <FloatingSelect id="up-conn-phase" label="Connection Phase" required placeholder="Select Connection Phase..." options={opts(['1 Phase', '3 Phase'])} {...f('connection_phase')} />
                <FloatingSelect id="up-meter-conn" label="Meter Connection Type" required placeholder="Select Meter Connection Type..." options={opts(['LT', 'HT'])} {...f('meter_connection')} />
                <FloatingInput id="up-meter-no" label="Meter Number" required placeholder="Enter Meter Number" {...f('meter_number')} />
                <FloatingSelect id="up-meter-type" label="Meter Type" required placeholder="Select Meter Type..." options={opts(['Smart Meter', 'Electronic', 'Electromechanical', 'Net Meter', 'Solar Meter'])} {...f('meter_type')} />
                <FloatingInput id="up-sanction" label="Sanction Load (KW/KVA)" required placeholder="Enter Sanction Load" {...f('sanction_load')} />
                <FloatingInput id="up-connected" label="Instantaneous/Connected Load (KW)" required placeholder="Enter Connected Load" {...f('connected_load')} />
                <FloatingSelect id="up-grid" label="Grid power availability in hours" required placeholder="Select Grid power availability..." options={opts(['24 Hours', '18-20 Hours', '12-16 Hours', '8-12 Hours', 'Yes', 'No'])} {...f('grid_power')} />
                <FloatingSelect id="up-3phase" label="Is all three-phase available in LTDB" required placeholder="Select three-phase availability..." options={opts(['Yes', 'No', 'NA'])} {...f('all_3_phase_ltdb')} />
                <FloatingInput id="up-missing" label="If phase is missing, name i.e., R, Y, B, N" required placeholder="e.g. None or R, Y" {...f('missing_phase')} />
                <FloatingSelect id="up-ltdb" label="Is LTDB Present" required placeholder="Select Is LTDB Present..." options={opts(['Present', 'Not Present', 'Yes', 'No'])} {...f('ltdb_present')} />
                <FloatingSelect id="up-roof-cond" label="Roof Condition of solar power plant installation" required placeholder="-- Select Roof Condition --" options={opts(['Feasible', 'Good', 'RCC Roof', 'Tin Shed', 'Average', 'Poor'])} {...f('roof_condition')} />
                <FloatingInput id="up-area-roof" label="Total Area of Roof (in Sq.Feet)" required placeholder="Enter Total Area of Roof" {...f('area_roof')} />
                <FloatingInput id="up-free-solar" label="Free space for solar Installation (in Sq.Feet)" required placeholder="Enter Free Space" {...f('free_space_solar')} />
                <FloatingInput id="up-free-inv" label="Free space for Control Room/Inverter (in Sq.Feet)" required placeholder="Enter Free Space" {...f('free_space_inverter')} />
                <FloatingSelect id="up-earth" label="Earth pit position" required placeholder="Select Earth pit position..." options={opts(['Ok', 'Available', 'Not Available', 'Near Control Room', 'Beside Building'])} {...f('earth_pit')} />
                <FloatingSelect id="up-feasible" label="Site Feasible" required placeholder="Select ..." options={opts(['Feasible', 'Not Feasible', 'Partially Feasible'])} {...f('site_feasible')} />
                <div className="up-form-col-span-full">
                  <FloatingTextarea id="up-remarks" label="Survey Remarks" required placeholder="Enter survey findings and technical observation remarks..." {...f('survey_remarks')} />
                </div>
              </div>
            </div>

            <hr className="up-section-divider" />

            {/* Section 5: Civil / Structural */}
            <div id="sec-5" className="up-section-block">
              <SectionHeader num="5" total={6} title="Civil / Structural" desc="Physical structure of the building and rooftop." />
              <div className="up-form-grid up-form-grid--3col">
                <FloatingInput id="up-age" label="Age of Building" required placeholder="e.g. 5 Years" {...f('building_age')} />
                <FloatingSelect id="up-roof-access" label="Access to the roof (Availability of Staircase)" required placeholder="Select Staircase Availability..." options={opts(['Available', 'Not Available', 'Internal Staircase', 'External Staircase', 'Ladder'])} {...f('roof_access')} />
                <FloatingInput id="up-roof-height" label="Rooftop Height (Feet)" required placeholder="Enter Rooftop Height" {...f('rooftop_height')} />
                <FloatingInput id="up-parapet" label="Parapet Height (Feet)" required placeholder="Enter Parapet Height" {...f('parapet_height')} />
                <FloatingInput id="up-floors" label="No. of floors (G+...)" required placeholder="e.g. G+2" {...f('floors_number')} />
                <FloatingInput id="up-water" label="Water Source for Cleaning" required placeholder="Enter Water Source" {...f('water_source')} />
              </div>
            </div>

            <hr className="up-section-divider" />

            {/* Section 6: Other Information & Attachments */}
            <div id="sec-6" className="up-section-block">
              <SectionHeader num="6" total={6} title="Other Information" desc="Access details and site media (up to 5MB per file)." />
              <div className="up-form-grid up-form-grid--3col">
                <FloatingInput id="up-access" label="Access to Site" required placeholder="Enter Access to Site" {...f('site_access')} />
                <FloatingInput id="up-distance" label="Distance of site from main Road (km)" required placeholder="Enter Distance" {...f('site_distance')} />
                <div />

                <FloatingFileInput id="up-img-building" label="Building Image" required={!isEdit} accept="image/*" capture="environment" file={files.building_image} existingUrl={existingFiles.building_image} onChange={(file) => handleFileChange('building_image', file)} error={validationErrors.building_image?.[0]} />
                <FloatingFileInput id="up-img-roof" label="Roof Image" required={!isEdit} accept="image/*" capture="environment" file={files.roof_image} existingUrl={existingFiles.roof_image} onChange={(file) => handleFileChange('roof_image', file)} error={validationErrors.roof_image?.[0]} />
                <FloatingFileInput id="up-img-control" label="Control Room Image" required={!isEdit} accept="image/*" capture="environment" file={files.control_room_image} existingUrl={existingFiles.control_room_image} onChange={(file) => handleFileChange('control_room_image', file)} error={validationErrors.control_room_image?.[0]} />
                <FloatingFileInput id="up-img-meter" label="Meter Image (Optional)" accept="image/*" capture="environment" file={files.image4} existingUrl={existingFiles.image4} onChange={(file) => handleFileChange('image4', file)} error={validationErrors.image4?.[0]} />
                <FloatingFileInput id="up-img-other" label="Other Image (Optional)" accept="image/*" capture="environment" file={files.image5} existingUrl={existingFiles.image5} onChange={(file) => handleFileChange('image5', file)} error={validationErrors.image5?.[0]} />
                <FloatingFileInput id="up-pdf" label="PDF - Feasibility Sheet (Optional)" accept="application/pdf" file={files.pdf} existingUrl={existingFiles.pdf} onChange={(file) => handleFileChange('pdf', file)} error={validationErrors.pdf?.[0]} />
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="up-form-sticky-bar">
          <span className="ax-badge ax-badge--soft ax-badge--primary ax-badge--pill">
            {isEdit ? 'Edit Mode' : 'New Survey'}
          </span>
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)' }}>
            <button type="button" className="ax-btn ax-btn--secondary" onClick={() => navigate('/v/up/view-resco-survey')} disabled={submitting}>
              <span className="ax-btn__label">Cancel</span>
            </button>
            <button type="submit" disabled={submitting} className="ax-btn ax-btn--primary" style={{ minWidth: 200 }}>
              {submitting ? (
                <>
                  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ animation: 'up-spin 1s linear infinite' }}><path d="M12 3a9 9 0 1 0 9 9" /></svg>
                  <span className="ax-btn__label">Saving Survey...</span>
                </>
              ) : (
                <>
                  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5l10 -10" /></svg>
                  <span className="ax-btn__label">{isEdit ? 'Update Survey' : 'Submit Feasibility Survey'}</span>
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

export const UPSurveyRescoAddResco = UP_Survey_Resco_AddResco;
export default UP_Survey_Resco_AddResco;

/* =========================================================================
 * Reusable Floating Components (same as Bihar SRT)
 * ========================================================================= */

function SectionHeader({ num, total, title, desc }: { num: string; total: number; title: string; desc?: ReactNode }) {
  return (
    <div className="up-section-header">
      <div className="up-section-title-wrap">
        <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', alignItems: 'center' }}>
          <span className="ax-badge ax-badge--soft ax-badge--primary ax-badge--pill" style={{ fontWeight: 600 }}>
            Section {num} of {total}
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
  required?: boolean;
  readOnly?: boolean;
  maxLength?: number;
  placeholder?: string;
  value: string;
  onChange?: (val: string) => void;
  error?: string;
}

function FloatingInput({ id, label, type = 'text', required, readOnly, maxLength, placeholder = ' ', value, onChange, error }: FloatingInputProps) {
  return (
    <div>
      <div className="ax-float">
        <input
          id={id}
          type={type}
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
  capture?: 'user' | 'environment';
  file: File | null;
  existingUrl?: string | null;
  onChange: (file: File | null) => void;
  error?: string;
}

function FloatingFileInput({ id, label, required, accept, capture, file, existingUrl, onChange, error }: FloatingFileInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

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
        capture={capture}
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
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', marginTop: 2 }}>
                  {(file.size / 1024).toFixed(0)} KB · Ready to upload
                </div>
              </div>
            </div>
            <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" onClick={handleClear} style={{ color: '#ef4444', flexShrink: 0 }} title="Remove file">
              Remove
            </button>
          </div>
        ) : existingName ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, textAlign: 'left' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
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
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#eff6ff', color: '#3b82f6', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
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
              {accept === 'application/pdf' || accept === '.pdf' ? 'PDF file up to 5MB' : 'JPG, PNG or WEBP up to 5MB'}
            </div>
          </>
        )}
      </div>

      <FieldFeedback error={error} />
    </div>
  );
}