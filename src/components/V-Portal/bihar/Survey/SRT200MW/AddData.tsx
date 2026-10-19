import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  biharSrt200mwService,
  type BiharSrtSiteItem,
} from '../../../../../services/biharSrt200mwService';

// CSS: Unified Single-Card Layout with Floating Labels & Section Dividers (same as Jammu design)
const SINGLE_CARD_FORM_CSS = `
.bihar-single-card-form .ax-card { border: 1px solid var(--ax-border); border-radius: var(--ax-radius-xl); background: var(--ax-surface-solid); box-shadow: var(--ax-shadow-sm); overflow: hidden; }
.bihar-single-card-form .ax-card__header { padding: var(--ax-space-5) var(--ax-space-6); border-bottom: 1px solid var(--ax-border-subtle); background: var(--ax-surface-subtle); display: flex; flex-direction: column; gap: var(--ax-space-4); }
.bihar-single-card-form .ax-card__body { padding: var(--ax-space-6); }

.bihar-section-pills { display: flex; gap: var(--ax-space-2); overflow-x: auto; padding-bottom: 4px; scrollbar-width: thin; }
.bihar-section-pill-btn { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: var(--ax-radius-pill); font-size: var(--ax-text-xs); font-weight: 500; white-space: nowrap; background: var(--ax-surface-solid); border: 1px solid var(--ax-border); color: var(--ax-text); cursor: pointer; transition: all var(--ax-motion-fast) var(--ax-ease-standard); text-decoration: none; }
.bihar-section-pill-btn:hover { border-color: var(--ax-accent); color: var(--ax-accent); background: color-mix(in srgb, var(--ax-accent) 6%, var(--ax-surface-solid)); }
.bihar-section-pill-btn .pill-num { width: 18px; height: 18px; border-radius: 50%; background: var(--ax-surface-subtle); display: inline-flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; }

.bihar-section-block { padding-top: var(--ax-space-2); }
.bihar-section-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: var(--ax-space-2); margin-bottom: var(--ax-space-5); padding-bottom: var(--ax-space-3); border-bottom: 1px solid var(--ax-border-subtle); }
.bihar-section-title-wrap { display: flex; flex-direction: column; gap: 4px; }
.bihar-section-divider { border: 0; border-top: 1px dashed var(--ax-border); margin: var(--ax-space-8) 0 var(--ax-space-6); }

.ax-float { position: relative; width: 100%; }
.ax-float__input { width: 100%; height: 46px; padding: 12px 14px 4px 14px; font-size: var(--ax-text-sm); background: var(--ax-surface-solid); border: 1px solid var(--ax-border); border-radius: var(--ax-radius-md); color: var(--ax-text); outline: none; transition: border-color var(--ax-motion-fast) var(--ax-ease-standard), box-shadow var(--ax-motion-fast) var(--ax-ease-standard); }
.ax-float__input::placeholder { color: transparent; }
.ax-float__input:focus { border-color: var(--ax-accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--ax-accent) 20%, transparent); }
.ax-float__input[readonly] { background: var(--ax-surface-subtle); }

.ax-float__label { position: absolute; inset-inline-start: 12px; top: 50%; transform: translateY(-50%); margin: 0; padding: 0 4px; font-size: var(--ax-text-sm); color: var(--ax-text-subtle); background: var(--ax-surface-solid); border-radius: var(--ax-radius-xs); pointer-events: none; transition: top var(--ax-motion-fast) var(--ax-ease-standard), font-size var(--ax-motion-fast) var(--ax-ease-standard), color var(--ax-motion-fast) var(--ax-ease-standard); z-index: 2; white-space: nowrap; max-width: calc(100% - 24px); overflow: hidden; text-overflow: ellipsis; }

.ax-float__input:focus + .ax-float__label,
.ax-float__input:not(:placeholder-shown) + .ax-float__label,
.ax-float--select .ax-float__label,
.ax-float--file .ax-float__label { top: 0; transform: translateY(-50%); font-size: var(--ax-text-2xs); font-weight: 500; color: var(--ax-text-muted); }
.ax-float__input:focus + .ax-float__label { color: var(--ax-accent); }

.ax-float__input.is-invalid { border-color: var(--ax-danger-500) !important; }
.ax-float__input.is-invalid:focus { box-shadow: 0 0 0 3px color-mix(in srgb, var(--ax-danger-500) 24%, transparent) !important; }
.ax-float__input.is-invalid + .ax-float__label, .ax-float--file.is-invalid .ax-float__label { color: var(--ax-danger-500) !important; }
.ax-float--file.is-invalid .ax-file-box { border-color: var(--ax-danger-500) !important; }

.ax-float--area .ax-float__input { height: auto; min-height: 84px; padding-top: 18px; resize: vertical; }
.ax-float--area .ax-float__label { top: 18px; transform: none; }
.ax-float--area .ax-float__input:focus + .ax-float__label,
.ax-float--area .ax-float__input:not(:placeholder-shown) + .ax-float__label { top: 0; transform: translateY(-50%); }

.ax-float--file .ax-file-box { display: flex; align-items: center; justify-content: space-between; gap: var(--ax-space-3); height: 46px; padding: 6px 12px; background: var(--ax-surface-solid); border: 1px solid var(--ax-border); border-radius: var(--ax-radius-md); cursor: pointer; transition: all var(--ax-motion-fast) var(--ax-ease-standard); }
.ax-float--file .ax-file-box:hover { border-color: var(--ax-border-strong); background: var(--ax-surface-subtle); }

.ax-field-feedback { display: flex; align-items: center; gap: 4px; margin-top: 4px; font-size: var(--ax-text-2xs); min-height: 16px; }
.ax-field-feedback--error { color: var(--ax-danger-500); }

.bihar-form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--ax-space-4); }
@media (min-width: 1024px) { .bihar-form-grid--3col { grid-template-columns: repeat(3, 1fr); } }
.bihar-form-col-span-full { grid-column: 1 / -1; }
.bihar-gps-cell { height: 46px; }

.bihar-form-sticky-bar { position: sticky; bottom: var(--ax-space-4); z-index: 30; margin-top: var(--ax-space-6); padding: var(--ax-space-3) var(--ax-space-5); background: var(--ax-surface-solid); border: 1px solid var(--ax-border); border-radius: var(--ax-radius-xl); box-shadow: var(--ax-shadow-lg); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--ax-space-3); backdrop-filter: blur(12px); }
`;

const INITIAL_FORM = {
  latitude: '',
  longitude: '',
  site_address: '',
  landmark: '',
  agency_person_name: '',
  agency_person_contact: '',
  nodal_person: '',
  contact_nodal: '',

  // Technical information
  load_type: '',
  connection_phase: '',
  meter_connection: '',
  meter_number: '',
  meter_type: '',
  sanction_load: '',
  connected_load: '',
  grid_power: '',
  all_3_phase_ltdb: '',
  missing_phase: '',
  ltdb_present: '',
  roof_condition: '',
  area_roof: '',
  free_space_solar: '',
  free_space_inverter: '',
  earth_pit: '',
  site_feasible: '',
  survey_remarks: '',

  // Civil / Structural
  building_age: '',
  roof_access: '',
  rooftop_height: '',
  parapet_height: '',
  floors_number: '',
  water_source: '',

  // Other Information
  site_access: '',
  site_distance: '',
};

type FormKey = keyof typeof INITIAL_FORM;
type FileKey = 'building_image' | 'roof_image' | 'control_room_image' | 'image4' | 'pdf';
type Option = { value: string; label: string };

const opts = (arr: string[]): Option[] => arr.map((v) => ({ value: v, label: v }));

const SECTIONS = [
  { id: 'sec-1', num: '1', title: 'Select Site' },
  { id: 'sec-2', num: '2', title: 'General Info' },
  { id: 'sec-3', num: '3', title: 'Survey Details' },
  { id: 'sec-4', num: '4', title: 'Technical' },
  { id: 'sec-5', num: '5', title: 'Civil / Structural' },
  { id: 'sec-6', num: '6', title: 'Other Info & Media' },
];

export function Bihar_Survey_SRT200MW_AddData() {
  const navigate = useNavigate();
  const location = useLocation();

  // Query parameter ?id=... for edit mode
  const searchParams = new URLSearchParams(location.search);
  const editId = searchParams.get('id');
  const isEditMode = Boolean(editId);

  // Pending sites list
  const [pendingSites, setPendingSites] = useState<BiharSrtSiteItem[]>([]);
  const [loadingSites, setLoadingSites] = useState(false);
  const [noSitesNotice, setNoSitesNotice] = useState<string | null>(null);
  const [selectedSiteId, setSelectedSiteId] = useState<string>(editId || '');
  const [selectedSite, setSelectedSite] = useState<BiharSrtSiteItem | null>(null);

  // Form submitting state & feedback
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});

  const [formData, setFormData] = useState({ ...INITIAL_FORM });

  const [files, setFiles] = useState<Record<FileKey, File | null>>({
    building_image: null,
    roof_image: null,
    control_room_image: null,
    image4: null,
    pdf: null,
  });

  // Fetch pending sites on mount
  useEffect(() => {
    (async () => {
      setLoadingSites(true);
      setNoSitesNotice(null);
      try {
        const resp = await biharSrt200mwService.getSurveyPendingSites();
        setPendingSites(resp.sites);
        if (!resp.sites.length) {
          setNoSitesNotice(resp.message || 'No pending sites currently available for survey.');
        }
      } catch (err) {
        console.warn('Failed to load pending sites:', err);
      } finally {
        setLoadingSites(false);
      }
    })();
  }, []);

  // When editId changes or user loads in edit mode
  useEffect(() => {
    if (!editId) return;

    (async () => {
      setLoadingSites(true);
      try {
        const data = await biharSrt200mwService.getSurveyForEdit(editId);
        if (data) {
          setSelectedSite(data);
          setSelectedSiteId(String(data.id));
          setFormData({
            latitude: data.latitude ?? '',
            longitude: data.longitude ?? '',
            site_address: data.survey_address ?? data.address ?? '',
            landmark: data.near_landmark ?? '',
            agency_person_name: data.agency_person_name ?? '',
            agency_person_contact: data.agency_person_contact ?? '',
            nodal_person: data.nodal_person ?? '',
            contact_nodal: data.contact_nodal ?? '',
            load_type: data.load_type ?? '',
            connection_phase: data.connection_phase ?? '',
            meter_connection: data.meter_connection ?? '',
            meter_number: data.meter_number ?? '',
            meter_type: data.meter_type ?? '',
            sanction_load: data.sanction_load ?? '',
            connected_load: data.connected_load ?? '',
            grid_power: data.grid_power ?? '',
            all_3_phase_ltdb: data.all_3_phase_ltdb ?? '',
            missing_phase: data.missing_phase ?? '',
            ltdb_present: data.ltdb_present ?? '',
            roof_condition: data.roof_condition ?? '',
            area_roof: data.area_roof ?? '',
            free_space_solar: data.free_space_solar ?? '',
            free_space_inverter: data.free_space_inverter ?? '',
            earth_pit: data.earth_pit ?? '',
            site_feasible: data.site_feasible ?? '',
            survey_remarks: data.survey_remarks ?? '',
            building_age: data.building_age ?? '',
            roof_access: data.roof_access ?? '',
            rooftop_height: data.rooftop_height ?? '',
            parapet_height: data.parapet_height ?? '',
            floors_number: data.floors_number ?? '',
            water_source: data.water_source ?? '',
            site_access: data.site_access ?? '',
            site_distance: data.site_distance ?? '',
          });
        }
      } catch (err) {
        console.error('Failed to load edit survey details:', err);
      } finally {
        setLoadingSites(false);
      }
    })();
  }, [editId]);

  // Handle site selection in dropdown
  const handleSiteSelect = (siteId: string) => {
    setSelectedSiteId(siteId);
    if (!siteId) {
      setSelectedSite(null);
      return;
    }
    const found = pendingSites.find((s) => String(s.id) === String(siteId));
    setSelectedSite(found || null);
    if (found) {
      setFormData((prev) => ({
        ...prev,
        site_address: prev.site_address || found.address || '',
      }));
    }
    if (validationErrors.id) clearError('id');
  };

  const clearError = (name: string) => {
    setValidationErrors((prev) => {
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

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
      },
      (err) => {
        alert(`Location retrieval failed: ${err.message}`);
      }
    );
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);
    setValidationErrors({});

    if (!selectedSiteId) {
      setErrorMsg('Please select a site first.');
      setValidationErrors({ id: ['Please select a site.'] });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Required images (create mode only)
    if (!isEditMode) {
      const fileErrs: Record<string, string[]> = {};
      (['building_image', 'roof_image', 'control_room_image'] as FileKey[]).forEach((k) => {
        if (!files[k]) fileErrs[k] = ['This image is required.'];
      });
      if (Object.keys(fileErrs).length) {
        setErrorMsg('Please upload all required images.');
        setValidationErrors(fileErrs);
        setTimeout(() => {
          document.querySelector('.is-invalid')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 50);
        return;
      }
    }

    const payload = new FormData();
    payload.append('id', selectedSiteId);

    Object.entries(formData).forEach(([k, v]) => {
      payload.append(k, v);
    });

    if (files.building_image) payload.append('building_image', files.building_image);
    if (files.roof_image) payload.append('roof_image', files.roof_image);
    if (files.control_room_image) payload.append('control_room_image', files.control_room_image);
    if (files.image4) payload.append('image4', files.image4);
    if (files.pdf) payload.append('pdf', files.pdf);

    setSubmitting(true);
    try {
      const resp = isEditMode
        ? await biharSrt200mwService.updateSurvey(payload)
        : await biharSrt200mwService.storeSurvey(payload);

      if (resp.success) {
        setSuccessMsg(resp.message || (isEditMode ? 'Survey Updated Successfully!!!' : 'Survey Created Successfully!!!'));
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => {
          navigate('/v/bihar/view-srt200mw-survey');
        }, 1500);
      } else {
        setErrorMsg(resp.message || 'Submission failed. Please check the inputs.');
        if (resp.errors && typeof resp.errors === 'object') {
          setValidationErrors(resp.errors);
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Network error occurred.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  const siteOptions: Option[] = pendingSites.map((s) => ({
    value: String(s.id),
    label: `${s.uid ? `[${s.uid}] ` : ''}${s.site_name || 'Site'}${s.district ? ` - ${s.district}` : ''}`,
  }));
  if (isEditMode && selectedSite && !siteOptions.find((o) => o.value === String(selectedSite.id))) {
    siteOptions.unshift({
      value: String(selectedSite.id),
      label: `${selectedSite.uid ? `[${selectedSite.uid}] ` : ''}${selectedSite.site_name || 'Site'}${selectedSite.district ? ` - ${selectedSite.district}` : ''}`,
    });
  }

  const yesNo = opts(['Yes', 'No']);

  return (
    <div className="bihar-single-card-form">
      <style>{SINGLE_CARD_FORM_CSS}</style>

      <PageHead
        title={isEditMode ? 'Edit Bihar SRT 200MW Survey' : 'Create Bihar SRT 200MW Survey'}
        subtitle={
          <span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>
            Bihar Solar Rooftop 200MW site survey entry and verification
          </span>
        }
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Bihar' },
          { label: 'Survey' },
          { label: 'SRT 200MW', href: '/v/bihar/view-srt200mw-survey' },
          { label: isEditMode ? 'Edit Survey' : 'Add Survey' },
        ]}
        actions={
          <Link to="/v/bihar/view-srt200mw-survey" className="ax-btn ax-btn--secondary ax-btn--pill">
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

      {/* Notice when no sites are pending */}
      {noSitesNotice && !isEditMode && (
        <div className="ax-alert ax-alert--info" style={{ marginBottom: 'var(--ax-space-6)' }}>
          <div className="ax-alert__content">
            <p className="ax-alert__message" style={{ margin: 0 }}>ℹ️ {noSitesNotice}</p>
          </div>
        </div>
      )}

      {/* Main Single Card Form */}
      <form onSubmit={handleSubmit}>
        <div className="ax-card">
          {/* Card Header with Title and Section Pills */}
          <div className="ax-card__header">
            <div>
              <span className="ax-card__eyebrow">Unified Card Architecture</span>
              <h2 className="ax-card__title" style={{ margin: 0 }}>
                {isEditMode ? 'Edit Bihar SRT 200MW Survey' : 'Add Bihar SRT 200MW Survey'}
              </h2>
              <p className="ax-card__subtitle" style={{ margin: '4px 0 0' }}>
                All survey fields organized inside one main card across 6 dedicated sections.
              </p>
            </div>

            <div className="bihar-section-pills" role="navigation" aria-label="Jump to section">
              {SECTIONS.map((s) => (
                <button key={s.id} type="button" onClick={() => scrollToSection(s.id)} className="bihar-section-pill-btn">
                  <span className="pill-num">{s.num}</span>
                  <span>{s.title}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="ax-card__body">
            {/* Section 1: Select Site */}
            <div id="sec-1" className="bihar-section-block">
              <SectionHeader num="1" title="Select Site" desc="Choose the allocated site for this survey." />
              <div className="bihar-form-grid bihar-form-grid--3col">
                <div className="bihar-form-col-span-full" style={{ maxWidth: 540 }}>
                  <FloatingSelect
                    id="bh-site"
                    label="Site Name / UID"
                    required
                    placeholder={loadingSites ? 'Loading pending sites...' : '-- Select Site --'}
                    value={selectedSiteId}
                    options={siteOptions}
                    disabled={isEditMode}
                    onChange={handleSiteSelect}
                    error={validationErrors.id?.[0]}
                  />
                </div>
              </div>
            </div>

            <hr className="bihar-section-divider" />

            {/* Section 2: General Information (read-only) */}
            <div id="sec-2" className="bihar-section-block">
              <SectionHeader num="2" title="General Information" desc="Auto-populated from selected site record (Read-only)." />
              <div className="bihar-form-grid bihar-form-grid--3col">
                <FloatingInput id="bh-uid" label="Unique ID" readOnly value={selectedSite?.uid || ''} />
                <FloatingInput id="bh-state" label="State" readOnly value={selectedSite?.state || 'Bihar'} />
                <FloatingInput id="bh-district" label="District" readOnly value={selectedSite?.district || ''} />
                <FloatingInput id="bh-division" label="Division" readOnly value={selectedSite?.division || ''} />
                <FloatingInput id="bh-subdivision" label="Sub Division" readOnly value={selectedSite?.sub_division || ''} />
                <FloatingInput id="bh-department" label="Department" readOnly value={selectedSite?.department || ''} />
                <FloatingInput id="bh-site-name" label="Site Name" readOnly value={selectedSite?.site_name || ''} />
                <FloatingInput id="bh-location" label="Location" readOnly value={selectedSite?.address || ''} />
                <FloatingInput id="bh-ca-no" label="CA No." readOnly value={selectedSite?.ca_no || ''} />
              </div>
            </div>

            <hr className="bihar-section-divider" />

            {/* Section 3: Survey Details (Geo + Contacts) */}
            <div id="sec-3" className="bihar-section-block">
              <SectionHeader
                num="3"
                title="Fill this Form"
                desc={<>The field labels marked with <span style={{ color: 'var(--ax-danger-500)' }}>*</span> are input fields.</>}
              />
              <div className="bihar-form-grid bihar-form-grid--3col">
                <FloatingInput id="bh-lat" label="Latitude" required placeholder="e.g. 25.6093" {...f('latitude')} />
                <FloatingInput id="bh-lng" label="Longitude" required placeholder="e.g. 85.1376" {...f('longitude')} />
                <div>
                  <button type="button" className="ax-btn ax-btn--secondary bihar-gps-cell" style={{ width: '100%' }} onClick={handleGetLocation}>
                    <span className="ax-btn__label">📍 Get GPS</span>
                  </button>
                </div>

                <div className="bihar-form-col-span-full">
                  <FloatingInput id="bh-address" label="Site Address (details)" required placeholder="Full detailed rooftop address" {...f('site_address')} />
                </div>

                <FloatingInput id="bh-landmark" label="Nearest Landmark" required placeholder="Nearby landmark" {...f('landmark')} />
                <FloatingInput id="bh-agency-name" label="Name of Contact Person of Agency" required placeholder="Surveyor / Agency contact" {...f('agency_person_name')} />
                <FloatingInput id="bh-agency-contact" label="Contact Number" type="tel" required placeholder="Agency 10-digit number" {...f('agency_person_contact')} />
                <FloatingInput id="bh-nodal" label="Nodal Person of concern building" required placeholder="Nodal person name" {...f('nodal_person')} />
                <FloatingInput id="bh-nodal-contact" label="Contact Number of Nodal Person" type="tel" required placeholder="Nodal contact number" {...f('contact_nodal')} />
              </div>
            </div>

            <hr className="bihar-section-divider" />

            {/* Section 4: Technical Information */}
            <div id="sec-4" className="bihar-section-block">
              <SectionHeader num="4" title="Technical Information" desc="Electrical & roof data." />
              <div className="bihar-form-grid bihar-form-grid--3col">
                <FloatingSelect id="bh-load-type" label="Type of Load" required placeholder="Select Type of Load..." options={opts(['AC', 'DC'])} {...f('load_type')} />
                <FloatingSelect id="bh-conn-phase" label="Connection Phase" required placeholder="Select Connection Phase..." options={opts(['1 Phase', '3 Phase'])} {...f('connection_phase')} />
                <FloatingSelect id="bh-meter-conn" label="Meter Connection Type" required placeholder="Select Meter Connection Type..." options={opts(['HT', 'LT'])} {...f('meter_connection')} />
                <FloatingInput id="bh-meter-no" label="Meter Number" required placeholder="Enter Meter Number" {...f('meter_number')} />
                <FloatingSelect id="bh-meter-type" label="Meter Type" required placeholder="Select Meter Type..." options={opts(['Smart Meter', 'Normal Meter', 'LTCT Meter', 'HT Meter'])} {...f('meter_type')} />
                <FloatingInput id="bh-sanction" label="Sanction Load (KW/KVA)" required placeholder="Enter Sanction Load" {...f('sanction_load')} />
                <FloatingInput id="bh-connected" label="Instantaneous/Connected Load (KW)" required placeholder="Enter Connected Load" {...f('connected_load')} />
                <FloatingSelect id="bh-grid" label="Grid power availability in hours" required placeholder="Select Grid power availability..." options={yesNo} {...f('grid_power')} />
                <FloatingSelect id="bh-3phase" label="Is all three-phase available in LTDB" required placeholder="Select three-phase availability..." options={yesNo} {...f('all_3_phase_ltdb')} />
                <FloatingInput id="bh-missing" label="If phase is missing, name i.e., R, Y, B, N" required placeholder="None / R / Y / B / N" {...f('missing_phase')} />
                <FloatingSelect id="bh-ltdb" label="Is LTDB Present" required placeholder="Select Is LTDB Present..." options={opts(['Present', 'Not Present'])} {...f('ltdb_present')} />
                <FloatingSelect id="bh-roof-cond" label="Roof Condition" required placeholder="-- Select Roof Condition --" options={opts(['Feasible', 'Not Feasible'])} {...f('roof_condition')} />
                <FloatingInput id="bh-area-roof" label="Total Area of Roof (in Sq.Feet)" type="number" required placeholder="Enter Area" {...f('area_roof')} />
                <FloatingInput id="bh-free-solar" label="Free space for solar Installation (in Sq.Feet)" type="number" required placeholder="Enter Free Space" {...f('free_space_solar')} />
                <FloatingInput id="bh-free-inv" label="Free space for Control Room/Inverter (in Sq.Feet)" type="number" required placeholder="Enter Free Space" {...f('free_space_inverter')} />
                <FloatingSelect id="bh-earth" label="Earth pit position" required placeholder="Select Earth pit position..." options={opts(['Ok', 'Not Ok'])} {...f('earth_pit')} />
                <FloatingSelect id="bh-feasible" label="Site Feasible" placeholder="Select ..." options={opts(['Feasible', 'Not Feasible', 'Site Install'])} {...f('site_feasible')} />
                <div className="bihar-form-col-span-full">
                  <FloatingTextarea id="bh-remarks" label="Survey Remarks" required placeholder="Enter Remarks..." {...f('survey_remarks')} />
                </div>
              </div>
            </div>

            <hr className="bihar-section-divider" />

            {/* Section 5: Civil / Structural */}
            <div id="sec-5" className="bihar-section-block">
              <SectionHeader num="5" title="Civil / Structural" desc="Physical structure of the building and rooftop." />
              <div className="bihar-form-grid bihar-form-grid--3col">
                <FloatingInput id="bh-age" label="Age of Building (Years)" required placeholder="Enter Age" {...f('building_age')} />
                <FloatingSelect id="bh-roof-access" label="Access to the roof (Staircase)" required placeholder="Select Staircase Availability..." options={opts(['Available', 'Not Available'])} {...f('roof_access')} />
                <FloatingInput id="bh-roof-height" label="Rooftop Height (Feet)" required placeholder="Enter Height" {...f('rooftop_height')} />
                <FloatingInput id="bh-parapet" label="Parapet Height (Feet)" required placeholder="Enter Height" {...f('parapet_height')} />
                <FloatingInput id="bh-floors" label="No. of floors (G+...)" required placeholder="e.g. G+2" {...f('floors_number')} />
                <FloatingInput id="bh-water" label="Water Source for Cleaning" required placeholder="Enter Water Source" {...f('water_source')} />
              </div>
            </div>

            <hr className="bihar-section-divider" />

            {/* Section 6: Other Information & Attachments */}
            <div id="sec-6" className="bihar-section-block">
              <SectionHeader num="6" title="Other Information" desc="Access details and site media." />
              <div className="bihar-form-grid bihar-form-grid--3col">
                <FloatingInput id="bh-access" label="Access to Site" required placeholder="Enter Access Details" {...f('site_access')} />
                <FloatingInput id="bh-distance" label="Distance of site from main Road (km)" required placeholder="Enter Distance" {...f('site_distance')} />
                <div />

                <FloatingFileInput id="bh-img-building" label="Building Image" required={!isEditMode} accept="image/*" file={files.building_image} existing={selectedSite?.image1} onChange={(file) => handleFileChange('building_image', file)} error={validationErrors.building_image?.[0]} />
                <FloatingFileInput id="bh-img-roof" label="Roof Image" required={!isEditMode} accept="image/*" file={files.roof_image} existing={selectedSite?.image2} onChange={(file) => handleFileChange('roof_image', file)} error={validationErrors.roof_image?.[0]} />
                <FloatingFileInput id="bh-img-control" label="Control Room Image" required={!isEditMode} accept="image/*" file={files.control_room_image} existing={selectedSite?.image3} onChange={(file) => handleFileChange('control_room_image', file)} error={validationErrors.control_room_image?.[0]} />
                <FloatingFileInput id="bh-img-other" label="Other Image (Optional)" accept="image/*" file={files.image4} existing={selectedSite?.image4} onChange={(file) => handleFileChange('image4', file)} error={validationErrors.image4?.[0]} />
                <FloatingFileInput id="bh-pdf" label="PDF (Optional, only .pdf)" accept="application/pdf" file={files.pdf} existing={selectedSite?.pdf_file} onChange={(file) => handleFileChange('pdf', file)} error={validationErrors.pdf?.[0]} />
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="bihar-form-sticky-bar">
          <span className="ax-badge ax-badge--soft ax-badge--primary ax-badge--pill">
            {isEditMode ? 'Edit Mode' : 'New Survey'}
          </span>
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)' }}>
            <button type="button" className="ax-btn ax-btn--secondary" onClick={() => navigate('/v/bihar/view-srt200mw-survey')}>
              <span className="ax-btn__label">Cancel</span>
            </button>
            <button type="submit" disabled={submitting} className="ax-btn ax-btn--primary" style={{ minWidth: 200 }}>
              {submitting ? (
                <>
                  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ animation: 'spin 1s linear infinite' }}><path d="M12 3a9 9 0 1 0 9 9" /></svg>
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
 * Helper Reusable Floating Components (same as Jammu)
 * ========================================================================= */

function SectionHeader({ num, title, desc }: { num: string; title: string; desc?: ReactNode }) {
  return (
    <div className="bihar-section-header">
      <div className="bihar-section-title-wrap">
        <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', alignItems: 'center' }}>
          <span className="ax-badge ax-badge--soft ax-badge--primary ax-badge--pill" style={{ fontWeight: 600 }}>
            Section {num} of 6
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
  placeholder?: string;
  value: string;
  onChange?: (val: string) => void;
  error?: string;
}

function FloatingInput({ id, label, type = 'text', required, readOnly, placeholder = ' ', value, onChange, error }: FloatingInputProps) {
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
          required={required}
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
          required={required}
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
          required={required}
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
  existing?: string | null;
  onChange: (file: File | null) => void;
  error?: string;
}

function FloatingFileInput({ id, label, required, accept, file, existing, onChange, error }: FloatingFileInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const existingName = existing ? existing.split('/').pop() : null;
  const text = file
    ? `${file.name} (${(file.size / 1024).toFixed(0)} KB)`
    : existingName
      ? `Current: ${existingName}`
      : 'No file chosen';

  return (
    <div>
      <div className={`ax-float ax-float--file ${error ? 'is-invalid' : ''}`}>
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept}
          style={{ display: 'none' }}
          onChange={(e) => onChange(e.target.files?.[0] || null)}
        />
        <div
          className="ax-file-box"
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          aria-label={label}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
            <svg style={{ width: 18, height: 18, flexShrink: 0, color: 'var(--ax-text-muted)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 3v4a1 1 0 0 0 1 1h4" />
              <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" />
            </svg>
            <span style={{ fontSize: 'var(--ax-text-xs)', color: file ? 'var(--ax-text-strong)' : 'var(--ax-text-subtle)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {text}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            {file ? (
              <button type="button" className="ax-btn ax-btn--ghost ax-btn--icon ax-btn--xs" onClick={handleClear} title="Remove file" aria-label="Remove file">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
                  <path d="M18 6l-12 12" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            ) : (
              <span className="ax-btn ax-btn--secondary ax-btn--xs" style={{ pointerEvents: 'none' }}>
                Choose File
              </span>
            )}
          </div>
        </div>

        <label className="ax-float__label" htmlFor={id}>
          {label}
          {required && <Asterisk />}
        </label>
      </div>
      <FieldFeedback error={error} />
    </div>
  );
}

export default Bihar_Survey_SRT200MW_AddData;