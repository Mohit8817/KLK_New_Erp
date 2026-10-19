import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  biharSrt200mwService,
  type BiharSrtSiteItem,
} from '../../../../../services/biharSrt200mwService';
import '../../bihar-srt200mw.css';

export function Bihar_Survey_SRT200MW_AddData() {
  const navigate = useNavigate();
  const location = useLocation();

  // Query parameter ?id=... for edit mode
  const searchParams = new URLSearchParams(location.search);
  const editId = searchParams.get('id');
  const isEditMode = Boolean(editId);

  // Pending sites list for select dropdown
  const [pendingSites, setPendingSites] = useState<BiharSrtSiteItem[]>([]);
  const [loadingSites, setLoadingSites] = useState(false);
  const [selectedSiteId, setSelectedSiteId] = useState<string>(editId || '');
  const [selectedSite, setSelectedSite] = useState<BiharSrtSiteItem | null>(null);

  // Form submitting state & feedback
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});

  // Form Fields State
  const [formData, setFormData] = useState({
    // Fill this form fields
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
  });

  // File states
  const [files, setFiles] = useState<{
    building_image: File | null;
    roof_image: File | null;
    control_room_image: File | null;
    image4: File | null;
    pdf: File | null;
  }>({
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
      try {
        const list = await biharSrt200mwService.getSurveyPendingSites();
        setPendingSites(list);
      } catch (err) {
        console.error('Failed to load pending sites:', err);
      } finally {
        setLoadingSites(false);
      }
    })();
  }, []);

  // When editId changes or user selects site in edit mode
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

  // Handle site selection in dropdown (Create mode)
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
  };

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear validation error on change
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, key: keyof typeof files) => {
    const file = e.target.files?.[0] || null;
    setFiles((prev) => ({ ...prev, [key]: file }));
  };

  // Auto-fill Geo-coordinates via browser GPS
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

  // Submit Handler
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);
    setValidationErrors({});

    if (!selectedSiteId) {
      setErrorMsg('Please select a site first.');
      return;
    }

    const payload = new FormData();
    payload.append('id', selectedSiteId);

    // Append text fields
    Object.entries(formData).forEach(([k, v]) => {
      payload.append(k, v);
    });

    // Append files
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

  return (
    <div className="bihar-srt-page">
      {/* ── Page Header ── */}
      <div className="bihar-srt-head">
        <div className="bihar-srt-head__titles">
          <span className="bihar-srt-head__eyebrow">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            Bihar SRT 200MW
          </span>
          <h1 className="bihar-srt-head__title">
            {isEditMode ? 'Edit Bihar SRT 200MW Survey' : 'Create Bihar SRT 200MW Survey'}
          </h1>
        </div>
        <div className="bihar-srt-head__breadcrumbs">
          <Link to="/v-dashboard">Home</Link> / <Link to="/v/bihar/view-srt200mw-survey">Survey</Link> /{' '}
          <span>{isEditMode ? 'Edit Survey' : 'Add Survey'}</span>
        </div>
      </div>

      {/* ── Notification Feedback Banners ── */}
      {successMsg && (
        <div
          style={{
            background: '#dcfce7',
            border: '1px solid #86efac',
            color: '#15803d',
            padding: '1rem 1.25rem',
            borderRadius: 8,
            marginBottom: '1.25rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div
          style={{
            background: '#fee2e2',
            border: '1px solid #fca5a5',
            color: '#b91c1c',
            padding: '1rem 1.25rem',
            borderRadius: 8,
            marginBottom: '1.25rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* ── Select Site Section ── */}
        <div className="bihar-form-section">
          <div className="bihar-form-section__header">
            <h3 className="bihar-form-section__title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              Select Site <span style={{ color: '#ef4444' }}>*</span>
            </h3>
          </div>
          <div className="bihar-form-section__body">
            <div className="bihar-field" style={{ maxWidth: 540 }}>
              <label htmlFor="site-select">
                Site Name / UID <span className="req">*</span>
              </label>
              <select
                id="site-select"
                className="bihar-select"
                value={selectedSiteId}
                disabled={isEditMode}
                onChange={(e) => handleSiteSelect(e.target.value)}
              >
                <option value="">-- Select Site --</option>
                {loadingSites && <option disabled>Loading pending sites...</option>}
                {pendingSites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.uid ? `[${s.uid}] ` : ''}
                    {s.site_name || 'Site'} {s.district ? `- ${s.district}` : ''}
                  </option>
                ))}
              </select>
              {validationErrors.id && <span className="bihar-error-text">{validationErrors.id[0]}</span>}
            </div>
          </div>
        </div>

        {/* ── General Information (Read-only populated from selected site) ── */}
        <div className="bihar-form-section">
          <div className="bihar-form-section__header">
            <h3 className="bihar-form-section__title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              General Information
            </h3>
          </div>
          <div className="bihar-form-section__body">
            <div className="bihar-form-grid">
              <div className="bihar-field" style={{ gridColumn: 'span 4' }}>
                <label>Unique ID</label>
                <input type="text" className="bihar-input" value={selectedSite?.uid || ''} readOnly />
              </div>
              <div className="bihar-field" style={{ gridColumn: 'span 4' }}>
                <label>State</label>
                <input type="text" className="bihar-input" value={selectedSite?.state || 'Bihar'} readOnly />
              </div>
              <div className="bihar-field" style={{ gridColumn: 'span 4' }}>
                <label>District</label>
                <input type="text" className="bihar-input" value={selectedSite?.district || ''} readOnly />
              </div>
              <div className="bihar-field" style={{ gridColumn: 'span 4' }}>
                <label>Division</label>
                <input type="text" className="bihar-input" value={selectedSite?.division || ''} readOnly />
              </div>
              <div className="bihar-field" style={{ gridColumn: 'span 4' }}>
                <label>Sub Division</label>
                <input type="text" className="bihar-input" value={selectedSite?.sub_division || ''} readOnly />
              </div>
              <div className="bihar-field" style={{ gridColumn: 'span 4' }}>
                <label>Department</label>
                <input type="text" className="bihar-input" value={selectedSite?.department || ''} readOnly />
              </div>
              <div className="bihar-field" style={{ gridColumn: 'span 4' }}>
                <label>Site Name</label>
                <input type="text" className="bihar-input" value={selectedSite?.site_name || ''} readOnly />
              </div>
              <div className="bihar-field" style={{ gridColumn: 'span 4' }}>
                <label>Location</label>
                <input type="text" className="bihar-input" value={selectedSite?.address || ''} readOnly />
              </div>
              <div className="bihar-field" style={{ gridColumn: 'span 4' }}>
                <label>CA No.</label>
                <input type="text" className="bihar-input" value={selectedSite?.ca_no || ''} readOnly />
              </div>
            </div>
          </div>
        </div>

        {/* ── Fill this Form: Basic Details & Agency / Nodal Contacts ── */}
        <div className="bihar-form-section">
          <div className="bihar-form-section__header">
            <h3 className="bihar-form-section__title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              Fill this Form
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              The field labels marked with <span style={{ color: '#ef4444' }}>*</span> are input fields.
            </span>
          </div>
          <div className="bihar-form-section__body">
            <div className="bihar-form-grid">
              {/* Latitude & Longitude */}
              <div className="bihar-field" style={{ gridColumn: 'span 5' }}>
                <label>
                  Latitude <span className="req">*</span>
                </label>
                <input
                  type="text"
                  name="latitude"
                  className="bihar-input"
                  value={formData.latitude}
                  onChange={handleInputChange}
                  placeholder="e.g. 25.6093"
                  required
                />
                {validationErrors.latitude && <span className="bihar-error-text">{validationErrors.latitude[0]}</span>}
              </div>

              <div className="bihar-field" style={{ gridColumn: 'span 5' }}>
                <label>
                  Longitude <span className="req">*</span>
                </label>
                <input
                  type="text"
                  name="longitude"
                  className="bihar-input"
                  value={formData.longitude}
                  onChange={handleInputChange}
                  placeholder="e.g. 85.1376"
                  required
                />
                {validationErrors.longitude && <span className="bihar-error-text">{validationErrors.longitude[0]}</span>}
              </div>

              <div className="bihar-field" style={{ gridColumn: 'span 2', alignSelf: 'flex-end' }}>
                <button
                  type="button"
                  className="bihar-btn bihar-btn--secondary"
                  style={{ width: '100%', padding: '0.45rem 0.5rem', fontSize: '0.78rem' }}
                  onClick={handleGetLocation}
                >
                  📍 Get GPS
                </button>
              </div>

              {/* Site Address details */}
              <div className="bihar-field" style={{ gridColumn: 'span 6' }}>
                <label>
                  Site Address (details) <span className="req">*</span>
                </label>
                <input
                  type="text"
                  name="site_address"
                  className="bihar-input"
                  value={formData.site_address}
                  onChange={handleInputChange}
                  placeholder="Detailed rooftop site location address"
                  required
                />
                {validationErrors.site_address && (
                  <span className="bihar-error-text">{validationErrors.site_address[0]}</span>
                )}
              </div>

              {/* Nearest Landmark */}
              <div className="bihar-field" style={{ gridColumn: 'span 6' }}>
                <label>
                  Nearest Landmark <span className="req">*</span>
                </label>
                <input
                  type="text"
                  name="landmark"
                  className="bihar-input"
                  value={formData.landmark}
                  onChange={handleInputChange}
                  placeholder="Near petrol pump, school, hospital, etc."
                  required
                />
                {validationErrors.landmark && <span className="bihar-error-text">{validationErrors.landmark[0]}</span>}
              </div>

              {/* Agency Person */}
              <div className="bihar-field" style={{ gridColumn: 'span 6' }}>
                <label>
                  Name of Contact Person of Agency <span className="req">*</span>
                </label>
                <input
                  type="text"
                  name="agency_person_name"
                  className="bihar-input"
                  value={formData.agency_person_name}
                  onChange={handleInputChange}
                  placeholder="Agency surveyor name"
                  required
                />
                {validationErrors.agency_person_name && (
                  <span className="bihar-error-text">{validationErrors.agency_person_name[0]}</span>
                )}
              </div>

              {/* Agency Contact */}
              <div className="bihar-field" style={{ gridColumn: 'span 6' }}>
                <label>
                  Contact Number <span className="req">*</span>
                </label>
                <input
                  type="tel"
                  name="agency_person_contact"
                  className="bihar-input"
                  value={formData.agency_person_contact}
                  onChange={handleInputChange}
                  placeholder="10-digit mobile number"
                  required
                />
                {validationErrors.agency_person_contact && (
                  <span className="bihar-error-text">{validationErrors.agency_person_contact[0]}</span>
                )}
              </div>

              {/* Nodal Person */}
              <div className="bihar-field" style={{ gridColumn: 'span 6' }}>
                <label>
                  Nodal Person of concern building <span className="req">*</span>
                </label>
                <input
                  type="text"
                  name="nodal_person"
                  className="bihar-input"
                  value={formData.nodal_person}
                  onChange={handleInputChange}
                  placeholder="Nodal incharge name"
                  required
                />
                {validationErrors.nodal_person && (
                  <span className="bihar-error-text">{validationErrors.nodal_person[0]}</span>
                )}
              </div>

              {/* Nodal Contact */}
              <div className="bihar-field" style={{ gridColumn: 'span 6' }}>
                <label>
                  Contact Number of Nodal Person <span className="req">*</span>
                </label>
                <input
                  type="tel"
                  name="contact_nodal"
                  className="bihar-input"
                  value={formData.contact_nodal}
                  onChange={handleInputChange}
                  placeholder="Nodal person mobile number"
                  required
                />
                {validationErrors.contact_nodal && (
                  <span className="bihar-error-text">{validationErrors.contact_nodal[0]}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Technical Information ── */}
        <div className="bihar-form-section">
          <div className="bihar-form-section__header">
            <h3 className="bihar-form-section__title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              Technical Information
            </h3>
          </div>
          <div className="bihar-form-section__body">
            <div className="bihar-form-grid">
              {/* Type of Load */}
              <div className="bihar-field" style={{ gridColumn: 'span 4' }}>
                <label>
                  Type of Load <span className="req">*</span>
                </label>
                <select
                  name="load_type"
                  className="bihar-select"
                  value={formData.load_type}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Type of Load...</option>
                  <option value="AC">AC</option>
                  <option value="DC">DC</option>
                </select>
                {validationErrors.load_type && <span className="bihar-error-text">{validationErrors.load_type[0]}</span>}
              </div>

              {/* Connection Phase */}
              <div className="bihar-field" style={{ gridColumn: 'span 4' }}>
                <label>
                  Connection Phase <span className="req">*</span>
                </label>
                <select
                  name="connection_phase"
                  className="bihar-select"
                  value={formData.connection_phase}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Connection Phase...</option>
                  <option value="1 Phase">1 Phase</option>
                  <option value="3 Phase">3 Phase</option>
                </select>
                {validationErrors.connection_phase && (
                  <span className="bihar-error-text">{validationErrors.connection_phase[0]}</span>
                )}
              </div>

              {/* Meter Connection Type */}
              <div className="bihar-field" style={{ gridColumn: 'span 4' }}>
                <label>
                  Meter Connection Type <span className="req">*</span>
                </label>
                <select
                  name="meter_connection"
                  className="bihar-select"
                  value={formData.meter_connection}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Meter Connection Type...</option>
                  <option value="HT">HT</option>
                  <option value="LT">LT</option>
                </select>
                {validationErrors.meter_connection && (
                  <span className="bihar-error-text">{validationErrors.meter_connection[0]}</span>
                )}
              </div>

              {/* Meter Number */}
              <div className="bihar-field" style={{ gridColumn: 'span 4' }}>
                <label>
                  Meter Number <span className="req">*</span>
                </label>
                <input
                  type="text"
                  name="meter_number"
                  className="bihar-input"
                  value={formData.meter_number}
                  onChange={handleInputChange}
                  placeholder="Enter meter number"
                  required
                />
                {validationErrors.meter_number && (
                  <span className="bihar-error-text">{validationErrors.meter_number[0]}</span>
                )}
              </div>

              {/* Meter Type */}
              <div className="bihar-field" style={{ gridColumn: 'span 4' }}>
                <label>
                  Meter Type <span className="req">*</span>
                </label>
                <select
                  name="meter_type"
                  className="bihar-select"
                  value={formData.meter_type}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Meter Type...</option>
                  <option value="Smart Meter">Smart Meter</option>
                  <option value="Normal Meter">Normal Meter</option>
                  <option value="LTCT Meter">LTCT Meter</option>
                  <option value="HT Meter">HT Meter</option>
                </select>
                {validationErrors.meter_type && <span className="bihar-error-text">{validationErrors.meter_type[0]}</span>}
              </div>

              {/* Sanction Load */}
              <div className="bihar-field" style={{ gridColumn: 'span 4' }}>
                <label>
                  Sanction Load (KW/KVA) <span className="req">*</span>
                </label>
                <input
                  type="text"
                  name="sanction_load"
                  className="bihar-input"
                  value={formData.sanction_load}
                  onChange={handleInputChange}
                  placeholder="Sanction load"
                  required
                />
                {validationErrors.sanction_load && (
                  <span className="bihar-error-text">{validationErrors.sanction_load[0]}</span>
                )}
              </div>

              {/* Instantaneous/Connected Load */}
              <div className="bihar-field" style={{ gridColumn: 'span 4' }}>
                <label>
                  Instantaneous/Connected Load (KW) <span className="req">*</span>
                </label>
                <input
                  type="text"
                  name="connected_load"
                  className="bihar-input"
                  value={formData.connected_load}
                  onChange={handleInputChange}
                  placeholder="Connected load"
                  required
                />
                {validationErrors.connected_load && (
                  <span className="bihar-error-text">{validationErrors.connected_load[0]}</span>
                )}
              </div>

              {/* Grid power availability */}
              <div className="bihar-field" style={{ gridColumn: 'span 4' }}>
                <label>
                  Grid power availability in hours <span className="req">*</span>
                </label>
                <select
                  name="grid_power"
                  className="bihar-select"
                  value={formData.grid_power}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Grid power availability...</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
                {validationErrors.grid_power && <span className="bihar-error-text">{validationErrors.grid_power[0]}</span>}
              </div>

              {/* Is all three-phase available in LTDB */}
              <div className="bihar-field" style={{ gridColumn: 'span 4' }}>
                <label>
                  Is all three-phase available in LTDB <span className="req">*</span>
                </label>
                <select
                  name="all_3_phase_ltdb"
                  className="bihar-select"
                  value={formData.all_3_phase_ltdb}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select three-phase availability...</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
                {validationErrors.all_3_phase_ltdb && (
                  <span className="bihar-error-text">{validationErrors.all_3_phase_ltdb[0]}</span>
                )}
              </div>

              {/* Missing Phase */}
              <div className="bihar-field" style={{ gridColumn: 'span 4' }}>
                <label>
                  If phase is missing, name i.e., R, Y, B, N <span className="req">*</span>
                </label>
                <input
                  type="text"
                  name="missing_phase"
                  className="bihar-input"
                  value={formData.missing_phase}
                  onChange={handleInputChange}
                  placeholder="None / R / Y / B / N"
                  required
                />
                {validationErrors.missing_phase && (
                  <span className="bihar-error-text">{validationErrors.missing_phase[0]}</span>
                )}
              </div>

              {/* Is LTDB Present */}
              <div className="bihar-field" style={{ gridColumn: 'span 4' }}>
                <label>
                  Is LTDB Present <span className="req">*</span>
                </label>
                <select
                  name="ltdb_present"
                  className="bihar-select"
                  value={formData.ltdb_present}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Is LTDB Present...</option>
                  <option value="Present">Present</option>
                  <option value="Not Present">Not Present</option>
                </select>
                {validationErrors.ltdb_present && (
                  <span className="bihar-error-text">{validationErrors.ltdb_present[0]}</span>
                )}
              </div>

              {/* Roof Condition */}
              <div className="bihar-field" style={{ gridColumn: 'span 4' }}>
                <label>
                  Roof Condition of solar power plant installation <span className="req">*</span>
                </label>
                <select
                  name="roof_condition"
                  className="bihar-select"
                  value={formData.roof_condition}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">-- Select Roof Condition --</option>
                  <option value="Feasible">Feasible</option>
                  <option value="Not Feasible">Not Feasible</option>
                </select>
                {validationErrors.roof_condition && (
                  <span className="bihar-error-text">{validationErrors.roof_condition[0]}</span>
                )}
              </div>

              {/* Total Area of Roof */}
              <div className="bihar-field" style={{ gridColumn: 'span 4' }}>
                <label>
                  Total Area of Roof (in Sq.Feet) <span className="req">*</span>
                </label>
                <input
                  type="number"
                  name="area_roof"
                  className="bihar-input"
                  value={formData.area_roof}
                  onChange={handleInputChange}
                  placeholder="e.g. 1500"
                  required
                />
                {validationErrors.area_roof && <span className="bihar-error-text">{validationErrors.area_roof[0]}</span>}
              </div>

              {/* Free space for solar Installation */}
              <div className="bihar-field" style={{ gridColumn: 'span 4' }}>
                <label>
                  Free space for solar Installation (in Sq.Feet) <span className="req">*</span>
                </label>
                <input
                  type="number"
                  name="free_space_solar"
                  className="bihar-input"
                  value={formData.free_space_solar}
                  onChange={handleInputChange}
                  placeholder="e.g. 1000"
                  required
                />
                {validationErrors.free_space_solar && (
                  <span className="bihar-error-text">{validationErrors.free_space_solar[0]}</span>
                )}
              </div>

              {/* Free space for Control Room/Inverter */}
              <div className="bihar-field" style={{ gridColumn: 'span 4' }}>
                <label>
                  Free space for Control Room/Inverter (in Sq.Feet) <span className="req">*</span>
                </label>
                <input
                  type="number"
                  name="free_space_inverter"
                  className="bihar-input"
                  value={formData.free_space_inverter}
                  onChange={handleInputChange}
                  placeholder="e.g. 100"
                  required
                />
                {validationErrors.free_space_inverter && (
                  <span className="bihar-error-text">{validationErrors.free_space_inverter[0]}</span>
                )}
              </div>

              {/* Earth pit position */}
              <div className="bihar-field" style={{ gridColumn: 'span 4' }}>
                <label>
                  Earth pit position <span className="req">*</span>
                </label>
                <select
                  name="earth_pit"
                  className="bihar-select"
                  value={formData.earth_pit}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Earth pit position...</option>
                  <option value="Ok">Ok</option>
                  <option value="Not Ok">Not Ok</option>
                </select>
                {validationErrors.earth_pit && <span className="bihar-error-text">{validationErrors.earth_pit[0]}</span>}
              </div>

              {/* Site Feasible */}
              <div className="bihar-field" style={{ gridColumn: 'span 4' }}>
                <label>Site Feasible</label>
                <select
                  name="site_feasible"
                  className="bihar-select"
                  value={formData.site_feasible}
                  onChange={handleInputChange}
                >
                  <option value="">Select ...</option>
                  <option value="Feasible">Feasible</option>
                  <option value="Not Feasible">Not Feasible</option>
                  <option value="Site Install">Site Install</option>
                </select>
              </div>

              {/* Survey Remarks */}
              <div className="bihar-field" style={{ gridColumn: 'span 12' }}>
                <label>
                  Survey Remarks <span className="req">*</span>
                </label>
                <textarea
                  name="survey_remarks"
                  className="bihar-textarea"
                  rows={3}
                  value={formData.survey_remarks}
                  onChange={handleInputChange}
                  placeholder="Provide detailed observation, feasibility, and electrical remarks..."
                  required
                />
                {validationErrors.survey_remarks && (
                  <span className="bihar-error-text">{validationErrors.survey_remarks[0]}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Civil / Structural ── */}
        <div className="bihar-form-section">
          <div className="bihar-form-section__header">
            <h3 className="bihar-form-section__title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="4" y="2" width="16" height="20" rx="2" />
                <path d="M9 22v-4h6v4" />
              </svg>
              Civil / Structural
            </h3>
          </div>
          <div className="bihar-form-section__body">
            <div className="bihar-form-grid">
              {/* Age of Building */}
              <div className="bihar-field" style={{ gridColumn: 'span 4' }}>
                <label>
                  Age of Building (Years) <span className="req">*</span>
                </label>
                <input
                  type="text"
                  name="building_age"
                  className="bihar-input"
                  value={formData.building_age}
                  onChange={handleInputChange}
                  placeholder="e.g. 5"
                  required
                />
                {validationErrors.building_age && (
                  <span className="bihar-error-text">{validationErrors.building_age[0]}</span>
                )}
              </div>

              {/* Access to the roof */}
              <div className="bihar-field" style={{ gridColumn: 'span 4' }}>
                <label>
                  Access to the roof (Availability of Staircase) <span className="req">*</span>
                </label>
                <select
                  name="roof_access"
                  className="bihar-select"
                  value={formData.roof_access}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Staircase Availability...</option>
                  <option value="Available">Available</option>
                  <option value="Not Available">Not Available</option>
                </select>
                {validationErrors.roof_access && (
                  <span className="bihar-error-text">{validationErrors.roof_access[0]}</span>
                )}
              </div>

              {/* Rooftop Height */}
              <div className="bihar-field" style={{ gridColumn: 'span 4' }}>
                <label>
                  Rooftop Height (Feet) <span className="req">*</span>
                </label>
                <input
                  type="text"
                  name="rooftop_height"
                  className="bihar-input"
                  value={formData.rooftop_height}
                  onChange={handleInputChange}
                  placeholder="e.g. 12"
                  required
                />
                {validationErrors.rooftop_height && (
                  <span className="bihar-error-text">{validationErrors.rooftop_height[0]}</span>
                )}
              </div>

              {/* Parapet Height */}
              <div className="bihar-field" style={{ gridColumn: 'span 4' }}>
                <label>
                  Parapet Height (Feet) <span className="req">*</span>
                </label>
                <input
                  type="text"
                  name="parapet_height"
                  className="bihar-input"
                  value={formData.parapet_height}
                  onChange={handleInputChange}
                  placeholder="e.g. 3"
                  required
                />
                {validationErrors.parapet_height && (
                  <span className="bihar-error-text">{validationErrors.parapet_height[0]}</span>
                )}
              </div>

              {/* No. of floors */}
              <div className="bihar-field" style={{ gridColumn: 'span 4' }}>
                <label>
                  No. of floors (G+...) <span className="req">*</span>
                </label>
                <input
                  type="text"
                  name="floors_number"
                  className="bihar-input"
                  value={formData.floors_number}
                  onChange={handleInputChange}
                  placeholder="e.g. G+2"
                  required
                />
                {validationErrors.floors_number && (
                  <span className="bihar-error-text">{validationErrors.floors_number[0]}</span>
                )}
              </div>

              {/* Water Source for Cleaning */}
              <div className="bihar-field" style={{ gridColumn: 'span 4' }}>
                <label>
                  Water Source for Cleaning <span className="req">*</span>
                </label>
                <input
                  type="text"
                  name="water_source"
                  className="bihar-input"
                  value={formData.water_source}
                  onChange={handleInputChange}
                  placeholder="Available / Borewell / Municipal"
                  required
                />
                {validationErrors.water_source && (
                  <span className="bihar-error-text">{validationErrors.water_source[0]}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Other Information & File Attachments ── */}
        <div className="bihar-form-section">
          <div className="bihar-form-section__header">
            <h3 className="bihar-form-section__title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              Other Information & Media Attachments
            </h3>
          </div>
          <div className="bihar-form-section__body">
            <div className="bihar-form-grid">
              {/* Access to Site */}
              <div className="bihar-field" style={{ gridColumn: 'span 6' }}>
                <label>
                  Access to Site <span className="req">*</span>
                </label>
                <input
                  type="text"
                  name="site_access"
                  className="bihar-input"
                  value={formData.site_access}
                  onChange={handleInputChange}
                  placeholder="Easy / Road Access / Vehicle accessible"
                  required
                />
                {validationErrors.site_access && (
                  <span className="bihar-error-text">{validationErrors.site_access[0]}</span>
                )}
              </div>

              {/* Distance of site from main Road */}
              <div className="bihar-field" style={{ gridColumn: 'span 6' }}>
                <label>
                  Distance of site from main Road (km) <span className="req">*</span>
                </label>
                <input
                  type="text"
                  name="site_distance"
                  className="bihar-input"
                  value={formData.site_distance}
                  onChange={handleInputChange}
                  placeholder="e.g. 0.5"
                  required
                />
                {validationErrors.site_distance && (
                  <span className="bihar-error-text">{validationErrors.site_distance[0]}</span>
                )}
              </div>

              {/* Building Image */}
              <div className="bihar-field" style={{ gridColumn: 'span 4' }}>
                <label>
                  Building Image {!isEditMode && <span className="req">*</span>}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  className="bihar-input"
                  onChange={(e) => handleFileChange(e, 'building_image')}
                  required={!isEditMode}
                />
                {selectedSite?.image1 && (
                  <small style={{ color: '#64748b' }}>Current: {selectedSite.image1.split('/').pop()}</small>
                )}
                {validationErrors.building_image && (
                  <span className="bihar-error-text">{validationErrors.building_image[0]}</span>
                )}
              </div>

              {/* Roof Image */}
              <div className="bihar-field" style={{ gridColumn: 'span 4' }}>
                <label>
                  Roof Image {!isEditMode && <span className="req">*</span>}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  className="bihar-input"
                  onChange={(e) => handleFileChange(e, 'roof_image')}
                  required={!isEditMode}
                />
                {selectedSite?.image2 && (
                  <small style={{ color: '#64748b' }}>Current: {selectedSite.image2.split('/').pop()}</small>
                )}
                {validationErrors.roof_image && (
                  <span className="bihar-error-text">{validationErrors.roof_image[0]}</span>
                )}
              </div>

              {/* Control Room Image */}
              <div className="bihar-field" style={{ gridColumn: 'span 4' }}>
                <label>
                  Control Room Image {!isEditMode && <span className="req">*</span>}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  className="bihar-input"
                  onChange={(e) => handleFileChange(e, 'control_room_image')}
                  required={!isEditMode}
                />
                {selectedSite?.image3 && (
                  <small style={{ color: '#64748b' }}>Current: {selectedSite.image3.split('/').pop()}</small>
                )}
                {validationErrors.control_room_image && (
                  <span className="bihar-error-text">{validationErrors.control_room_image[0]}</span>
                )}
              </div>

              {/* Other Image */}
              <div className="bihar-field" style={{ gridColumn: 'span 6' }}>
                <label>Other Image (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  className="bihar-input"
                  onChange={(e) => handleFileChange(e, 'image4')}
                />
                {selectedSite?.image4 && (
                  <small style={{ color: '#64748b' }}>Current: {selectedSite.image4.split('/').pop()}</small>
                )}
              </div>

              {/* PDF */}
              <div className="bihar-field" style={{ gridColumn: 'span 6' }}>
                <label>PDF (Optional, only .pdf)</label>
                <input
                  type="file"
                  accept="application/pdf"
                  className="bihar-input"
                  onChange={(e) => handleFileChange(e, 'pdf')}
                />
                {selectedSite?.pdf_file && (
                  <small style={{ color: '#64748b' }}>Current: {selectedSite.pdf_file.split('/').pop()}</small>
                )}
                {validationErrors.pdf && <span className="bihar-error-text">{validationErrors.pdf[0]}</span>}
              </div>
            </div>
          </div>

          {/* Form Action Buttons */}
          <div className="bihar-form-actions">
            <button
              type="button"
              className="bihar-btn bihar-btn--secondary"
              onClick={() => navigate('/v/bihar/view-srt200mw-survey')}
            >
              Cancel
            </button>
            <button type="submit" className="bihar-btn bihar-btn--primary" disabled={submitting}>
              {submitting ? (
                <>
                  <span className="ax-spinner" style={{ width: 14, height: 14 }} />
                  Saving Survey...
                </>
              ) : isEditMode ? (
                'Update Survey'
              ) : (
                'Submit Survey'
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Copyright Footer */}
      <footer style={{ marginTop: '2.5rem', textAlign: 'center', fontSize: '0.8rem', color: '#64748b' }}>
        Copyright ©{' '}
        <a href="https://klkerp.com" target="_blank" rel="noopener noreferrer" style={{ color: '#3b0764', fontWeight: 600 }}>
          ETS NETWORKS
        </a>
        . All rights reserved.
      </footer>
    </div>
  );
}

export default Bihar_Survey_SRT200MW_AddData;
