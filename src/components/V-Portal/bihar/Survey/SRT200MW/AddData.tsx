import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  biharSrt200mwService,
  type BiharSrtSiteItem,
} from '../../../../../services/biharSrt200mwService';

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

  // Form Fields State
  const [formData, setFormData] = useState({
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
  };

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

  const fieldCol = { display: 'flex', flexDirection: 'column' as const, gap: 'var(--ax-space-1)' };

  return (
    <div className="ax-page">
      <PageHead
        title={isEditMode ? 'Edit Bihar SRT 200MW Survey' : 'Create Bihar SRT 200MW Survey'}
        subtitle="Bihar Solar Rooftop 200MW site survey entry and verification"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Bihar' },
          { label: 'Survey' },
          { label: 'SRT 200MW', href: '/v/bihar/view-srt200mw-survey' },
          { label: isEditMode ? 'Edit Survey' : 'Add Survey' },
        ]}
      />

      <div className="ax-dash-grid">
        {/* Success Banner */}
        {successMsg && (
          <div className="ax-col--12">
            <div className="ax-alert ax-alert--success">
              {successMsg}
            </div>
          </div>
        )}

        {/* Error Banner */}
        {errorMsg && (
          <div className="ax-col--12">
            <div className="ax-alert ax-alert--danger">
              {errorMsg}
            </div>
          </div>
        )}

        {/* Notice when no sites are pending */}
        {noSitesNotice && !isEditMode && (
          <div className="ax-col--12">
            <div className="ax-alert ax-alert--info">
              ℹ️ {noSitesNotice}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="ax-col--12" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-5)' }}>
          {/* 1. Select Site Card */}
          <section className="ax-card">
            <div className="ax-card__header">
              <div className="ax-card__titles">
                <span className="ax-card__eyebrow">Site Allocation</span>
                <h2 className="ax-card__title">Select Site <span style={{ color: 'var(--ax-danger)' }}>*</span></h2>
              </div>
            </div>
            <div className="ax-card__body">
              <div style={{ maxWidth: 540, ...fieldCol }}>
                <label className="ax-label">
                  Site Name / UID <span style={{ color: 'var(--ax-danger)' }}>*</span>
                </label>
                <select
                  className="ax-select"
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
                {validationErrors.id && (
                  <small style={{ color: 'var(--ax-danger)' }}>{validationErrors.id[0]}</small>
                )}
              </div>
            </div>
          </section>

          {/* 2. General Information Card */}
          <section className="ax-card">
            <div className="ax-card__header">
              <div className="ax-card__titles">
                <span className="ax-card__eyebrow">Site Metadata</span>
                <h2 className="ax-card__title">General Information</h2>
                <p className="ax-card__subtitle">Auto-populated from selected site record (Read-only)</p>
              </div>
            </div>
            <div className="ax-card__body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--ax-space-4)' }}>
                <div style={fieldCol}>
                  <label className="ax-label">Unique ID</label>
                  <input type="text" className="ax-input" value={selectedSite?.uid || ''} readOnly />
                </div>
                <div style={fieldCol}>
                  <label className="ax-label">State</label>
                  <input type="text" className="ax-input" value={selectedSite?.state || 'Bihar'} readOnly />
                </div>
                <div style={fieldCol}>
                  <label className="ax-label">District</label>
                  <input type="text" className="ax-input" value={selectedSite?.district || ''} readOnly />
                </div>
                <div style={fieldCol}>
                  <label className="ax-label">Division</label>
                  <input type="text" className="ax-input" value={selectedSite?.division || ''} readOnly />
                </div>
                <div style={fieldCol}>
                  <label className="ax-label">Sub Division</label>
                  <input type="text" className="ax-input" value={selectedSite?.sub_division || ''} readOnly />
                </div>
                <div style={fieldCol}>
                  <label className="ax-label">Department</label>
                  <input type="text" className="ax-input" value={selectedSite?.department || ''} readOnly />
                </div>
                <div style={fieldCol}>
                  <label className="ax-label">Site Name</label>
                  <input type="text" className="ax-input" value={selectedSite?.site_name || ''} readOnly />
                </div>
                <div style={fieldCol}>
                  <label className="ax-label">Location</label>
                  <input type="text" className="ax-input" value={selectedSite?.address || ''} readOnly />
                </div>
                <div style={fieldCol}>
                  <label className="ax-label">CA No.</label>
                  <input type="text" className="ax-input" value={selectedSite?.ca_no || ''} readOnly />
                </div>
              </div>
            </div>
          </section>

          {/* 3. Fill this Form: Geolocation & Contact Card */}
          <section className="ax-card">
            <div className="ax-card__header">
              <div className="ax-card__titles">
                <span className="ax-card__eyebrow">Survey Details</span>
                <h2 className="ax-card__title">Fill this Form</h2>
                <p className="ax-card__subtitle">
                  The field labels marked with <span style={{ color: 'var(--ax-danger)' }}>*</span> are input fields.
                </p>
              </div>
            </div>
            <div className="ax-card__body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 'var(--ax-space-4)' }}>
                {/* Latitude */}
                <div style={{ gridColumn: 'span 5', ...fieldCol }}>
                  <label className="ax-label">Latitude <span style={{ color: 'var(--ax-danger)' }}>*</span></label>
                  <input
                    type="text"
                    name="latitude"
                    className="ax-input"
                    value={formData.latitude}
                    onChange={handleInputChange}
                    placeholder="e.g. 25.6093"
                    required
                  />
                  {validationErrors.latitude && <small style={{ color: 'var(--ax-danger)' }}>{validationErrors.latitude[0]}</small>}
                </div>

                {/* Longitude */}
                <div style={{ gridColumn: 'span 5', ...fieldCol }}>
                  <label className="ax-label">Longitude <span style={{ color: 'var(--ax-danger)' }}>*</span></label>
                  <input
                    type="text"
                    name="longitude"
                    className="ax-input"
                    value={formData.longitude}
                    onChange={handleInputChange}
                    placeholder="e.g. 85.1376"
                    required
                  />
                  {validationErrors.longitude && <small style={{ color: 'var(--ax-danger)' }}>{validationErrors.longitude[0]}</small>}
                </div>

                {/* GPS button */}
                <div style={{ gridColumn: 'span 2', alignSelf: 'flex-end', ...fieldCol }}>
                  <button
                    type="button"
                    className="ax-btn ax-btn--secondary"
                    style={{ width: '100%' }}
                    onClick={handleGetLocation}
                  >
                    📍 Get GPS
                  </button>
                </div>

                {/* Site Address */}
                <div style={{ gridColumn: 'span 6', ...fieldCol }}>
                  <label className="ax-label">Site Address (details) <span style={{ color: 'var(--ax-danger)' }}>*</span></label>
                  <input
                    type="text"
                    name="site_address"
                    className="ax-input"
                    value={formData.site_address}
                    onChange={handleInputChange}
                    placeholder="Full detailed rooftop address"
                    required
                  />
                  {validationErrors.site_address && <small style={{ color: 'var(--ax-danger)' }}>{validationErrors.site_address[0]}</small>}
                </div>

                {/* Nearest Landmark */}
                <div style={{ gridColumn: 'span 6', ...fieldCol }}>
                  <label className="ax-label">Nearest Landmark <span style={{ color: 'var(--ax-danger)' }}>*</span></label>
                  <input
                    type="text"
                    name="landmark"
                    className="ax-input"
                    value={formData.landmark}
                    onChange={handleInputChange}
                    placeholder="Nearby landmark"
                    required
                  />
                  {validationErrors.landmark && <small style={{ color: 'var(--ax-danger)' }}>{validationErrors.landmark[0]}</small>}
                </div>

                {/* Agency Person */}
                <div style={{ gridColumn: 'span 6', ...fieldCol }}>
                  <label className="ax-label">Name of Contact Person of Agency <span style={{ color: 'var(--ax-danger)' }}>*</span></label>
                  <input
                    type="text"
                    name="agency_person_name"
                    className="ax-input"
                    value={formData.agency_person_name}
                    onChange={handleInputChange}
                    placeholder="Surveyor / Agency contact"
                    required
                  />
                  {validationErrors.agency_person_name && <small style={{ color: 'var(--ax-danger)' }}>{validationErrors.agency_person_name[0]}</small>}
                </div>

                {/* Contact Number */}
                <div style={{ gridColumn: 'span 6', ...fieldCol }}>
                  <label className="ax-label">Contact Number <span style={{ color: 'var(--ax-danger)' }}>*</span></label>
                  <input
                    type="tel"
                    name="agency_person_contact"
                    className="ax-input"
                    value={formData.agency_person_contact}
                    onChange={handleInputChange}
                    placeholder="Agency 10-digit number"
                    required
                  />
                  {validationErrors.agency_person_contact && <small style={{ color: 'var(--ax-danger)' }}>{validationErrors.agency_person_contact[0]}</small>}
                </div>

                {/* Nodal Person */}
                <div style={{ gridColumn: 'span 6', ...fieldCol }}>
                  <label className="ax-label">Nodal Person of concern building <span style={{ color: 'var(--ax-danger)' }}>*</span></label>
                  <input
                    type="text"
                    name="nodal_person"
                    className="ax-input"
                    value={formData.nodal_person}
                    onChange={handleInputChange}
                    placeholder="Nodal person name"
                    required
                  />
                  {validationErrors.nodal_person && <small style={{ color: 'var(--ax-danger)' }}>{validationErrors.nodal_person[0]}</small>}
                </div>

                {/* Contact Number of Nodal Person */}
                <div style={{ gridColumn: 'span 6', ...fieldCol }}>
                  <label className="ax-label">Contact Number of Nodal Person <span style={{ color: 'var(--ax-danger)' }}>*</span></label>
                  <input
                    type="tel"
                    name="contact_nodal"
                    className="ax-input"
                    value={formData.contact_nodal}
                    onChange={handleInputChange}
                    placeholder="Nodal contact number"
                    required
                  />
                  {validationErrors.contact_nodal && <small style={{ color: 'var(--ax-danger)' }}>{validationErrors.contact_nodal[0]}</small>}
                </div>
              </div>
            </div>
          </section>

          {/* 4. Technical Information Card */}
          <section className="ax-card">
            <div className="ax-card__header">
              <div className="ax-card__titles">
                <span className="ax-card__eyebrow">Electrical & Roof Data</span>
                <h2 className="ax-card__title">Technical Information</h2>
              </div>
            </div>
            <div className="ax-card__body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--ax-space-4)' }}>
                {/* Type of Load */}
                <div style={fieldCol}>
                  <label className="ax-label">Type of Load <span style={{ color: 'var(--ax-danger)' }}>*</span></label>
                  <select name="load_type" className="ax-select" value={formData.load_type} onChange={handleInputChange} required>
                    <option value="">Select Type of Load...</option>
                    <option value="AC">AC</option>
                    <option value="DC">DC</option>
                  </select>
                </div>

                {/* Connection Phase */}
                <div style={fieldCol}>
                  <label className="ax-label">Connection Phase <span style={{ color: 'var(--ax-danger)' }}>*</span></label>
                  <select name="connection_phase" className="ax-select" value={formData.connection_phase} onChange={handleInputChange} required>
                    <option value="">Select Connection Phase...</option>
                    <option value="1 Phase">1 Phase</option>
                    <option value="3 Phase">3 Phase</option>
                  </select>
                </div>

                {/* Meter Connection Type */}
                <div style={fieldCol}>
                  <label className="ax-label">Meter Connection Type <span style={{ color: 'var(--ax-danger)' }}>*</span></label>
                  <select name="meter_connection" className="ax-select" value={formData.meter_connection} onChange={handleInputChange} required>
                    <option value="">Select Meter Connection Type...</option>
                    <option value="HT">HT</option>
                    <option value="LT">LT</option>
                  </select>
                </div>

                {/* Meter Number */}
                <div style={fieldCol}>
                  <label className="ax-label">Meter Number <span style={{ color: 'var(--ax-danger)' }}>*</span></label>
                  <input type="text" name="meter_number" className="ax-input" value={formData.meter_number} onChange={handleInputChange} required />
                </div>

                {/* Meter Type */}
                <div style={fieldCol}>
                  <label className="ax-label">Meter Type <span style={{ color: 'var(--ax-danger)' }}>*</span></label>
                  <select name="meter_type" className="ax-select" value={formData.meter_type} onChange={handleInputChange} required>
                    <option value="">Select Meter Type...</option>
                    <option value="Smart Meter">Smart Meter</option>
                    <option value="Normal Meter">Normal Meter</option>
                    <option value="LTCT Meter">LTCT Meter</option>
                    <option value="HT Meter">HT Meter</option>
                  </select>
                </div>

                {/* Sanction Load */}
                <div style={fieldCol}>
                  <label className="ax-label">Sanction Load (KW/KVA) <span style={{ color: 'var(--ax-danger)' }}>*</span></label>
                  <input type="text" name="sanction_load" className="ax-input" value={formData.sanction_load} onChange={handleInputChange} required />
                </div>

                {/* Instantaneous/Connected Load */}
                <div style={fieldCol}>
                  <label className="ax-label">Instantaneous/Connected Load (KW) <span style={{ color: 'var(--ax-danger)' }}>*</span></label>
                  <input type="text" name="connected_load" className="ax-input" value={formData.connected_load} onChange={handleInputChange} required />
                </div>

                {/* Grid power availability */}
                <div style={fieldCol}>
                  <label className="ax-label">Grid power availability in hours <span style={{ color: 'var(--ax-danger)' }}>*</span></label>
                  <select name="grid_power" className="ax-select" value={formData.grid_power} onChange={handleInputChange} required>
                    <option value="">Select Grid power availability...</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                {/* Is all three-phase available in LTDB */}
                <div style={fieldCol}>
                  <label className="ax-label">Is all three-phase available in LTDB <span style={{ color: 'var(--ax-danger)' }}>*</span></label>
                  <select name="all_3_phase_ltdb" className="ax-select" value={formData.all_3_phase_ltdb} onChange={handleInputChange} required>
                    <option value="">Select three-phase availability...</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                {/* Missing Phase */}
                <div style={fieldCol}>
                  <label className="ax-label">If phase is missing, name i.e., R, Y, B, N <span style={{ color: 'var(--ax-danger)' }}>*</span></label>
                  <input type="text" name="missing_phase" className="ax-input" value={formData.missing_phase} onChange={handleInputChange} placeholder="None / R / Y / B / N" required />
                </div>

                {/* Is LTDB Present */}
                <div style={fieldCol}>
                  <label className="ax-label">Is LTDB Present <span style={{ color: 'var(--ax-danger)' }}>*</span></label>
                  <select name="ltdb_present" className="ax-select" value={formData.ltdb_present} onChange={handleInputChange} required>
                    <option value="">Select Is LTDB Present...</option>
                    <option value="Present">Present</option>
                    <option value="Not Present">Not Present</option>
                  </select>
                </div>

                {/* Roof Condition */}
                <div style={fieldCol}>
                  <label className="ax-label">Roof Condition <span style={{ color: 'var(--ax-danger)' }}>*</span></label>
                  <select name="roof_condition" className="ax-select" value={formData.roof_condition} onChange={handleInputChange} required>
                    <option value="">-- Select Roof Condition --</option>
                    <option value="Feasible">Feasible</option>
                    <option value="Not Feasible">Not Feasible</option>
                  </select>
                </div>

                {/* Total Area of Roof */}
                <div style={fieldCol}>
                  <label className="ax-label">Total Area of Roof (in Sq.Feet) <span style={{ color: 'var(--ax-danger)' }}>*</span></label>
                  <input type="number" name="area_roof" className="ax-input" value={formData.area_roof} onChange={handleInputChange} required />
                </div>

                {/* Free space for solar Installation */}
                <div style={fieldCol}>
                  <label className="ax-label">Free space for solar Installation (in Sq.Feet) <span style={{ color: 'var(--ax-danger)' }}>*</span></label>
                  <input type="number" name="free_space_solar" className="ax-input" value={formData.free_space_solar} onChange={handleInputChange} required />
                </div>

                {/* Free space for Control Room/Inverter */}
                <div style={fieldCol}>
                  <label className="ax-label">Free space for Control Room/Inverter (in Sq.Feet) <span style={{ color: 'var(--ax-danger)' }}>*</span></label>
                  <input type="number" name="free_space_inverter" className="ax-input" value={formData.free_space_inverter} onChange={handleInputChange} required />
                </div>

                {/* Earth pit position */}
                <div style={fieldCol}>
                  <label className="ax-label">Earth pit position <span style={{ color: 'var(--ax-danger)' }}>*</span></label>
                  <select name="earth_pit" className="ax-select" value={formData.earth_pit} onChange={handleInputChange} required>
                    <option value="">Select Earth pit position...</option>
                    <option value="Ok">Ok</option>
                    <option value="Not Ok">Not Ok</option>
                  </select>
                </div>

                {/* Site Feasible */}
                <div style={fieldCol}>
                  <label className="ax-label">Site Feasible</label>
                  <select name="site_feasible" className="ax-select" value={formData.site_feasible} onChange={handleInputChange}>
                    <option value="">Select ...</option>
                    <option value="Feasible">Feasible</option>
                    <option value="Not Feasible">Not Feasible</option>
                    <option value="Site Install">Site Install</option>
                  </select>
                </div>

                {/* Survey Remarks */}
                <div style={{ gridColumn: '1 / -1', ...fieldCol }}>
                  <label className="ax-label">Survey Remarks <span style={{ color: 'var(--ax-danger)' }}>*</span></label>
                  <textarea name="survey_remarks" className="ax-textarea" rows={3} value={formData.survey_remarks} onChange={handleInputChange} required />
                </div>
              </div>
            </div>
          </section>

          {/* 5. Civil / Structural Card */}
          <section className="ax-card">
            <div className="ax-card__header">
              <div className="ax-card__titles">
                <span className="ax-card__eyebrow">Physical Structure</span>
                <h2 className="ax-card__title">Civil / Structural</h2>
              </div>
            </div>
            <div className="ax-card__body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--ax-space-4)' }}>
                <div style={fieldCol}>
                  <label className="ax-label">Age of Building (Years) <span style={{ color: 'var(--ax-danger)' }}>*</span></label>
                  <input type="text" name="building_age" className="ax-input" value={formData.building_age} onChange={handleInputChange} required />
                </div>
                <div style={fieldCol}>
                  <label className="ax-label">Access to the roof (Staircase) <span style={{ color: 'var(--ax-danger)' }}>*</span></label>
                  <select name="roof_access" className="ax-select" value={formData.roof_access} onChange={handleInputChange} required>
                    <option value="">Select Staircase Availability...</option>
                    <option value="Available">Available</option>
                    <option value="Not Available">Not Available</option>
                  </select>
                </div>
                <div style={fieldCol}>
                  <label className="ax-label">Rooftop Height (Feet) <span style={{ color: 'var(--ax-danger)' }}>*</span></label>
                  <input type="text" name="rooftop_height" className="ax-input" value={formData.rooftop_height} onChange={handleInputChange} required />
                </div>
                <div style={fieldCol}>
                  <label className="ax-label">Parapet Height (Feet) <span style={{ color: 'var(--ax-danger)' }}>*</span></label>
                  <input type="text" name="parapet_height" className="ax-input" value={formData.parapet_height} onChange={handleInputChange} required />
                </div>
                <div style={fieldCol}>
                  <label className="ax-label">No. of floors (G+...) <span style={{ color: 'var(--ax-danger)' }}>*</span></label>
                  <input type="text" name="floors_number" className="ax-input" value={formData.floors_number} onChange={handleInputChange} required />
                </div>
                <div style={fieldCol}>
                  <label className="ax-label">Water Source for Cleaning <span style={{ color: 'var(--ax-danger)' }}>*</span></label>
                  <input type="text" name="water_source" className="ax-input" value={formData.water_source} onChange={handleInputChange} required />
                </div>
              </div>
            </div>
          </section>

          {/* 6. Other Information & Attachments Card */}
          <section className="ax-card">
            <div className="ax-card__header">
              <div className="ax-card__titles">
                <span className="ax-card__eyebrow">Access & Media</span>
                <h2 className="ax-card__title">Other Information</h2>
              </div>
            </div>
            <div className="ax-card__body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--ax-space-4)' }}>
                <div style={fieldCol}>
                  <label className="ax-label">Access to Site <span style={{ color: 'var(--ax-danger)' }}>*</span></label>
                  <input type="text" name="site_access" className="ax-input" value={formData.site_access} onChange={handleInputChange} required />
                </div>
                <div style={fieldCol}>
                  <label className="ax-label">Distance of site from main Road (km) <span style={{ color: 'var(--ax-danger)' }}>*</span></label>
                  <input type="text" name="site_distance" className="ax-input" value={formData.site_distance} onChange={handleInputChange} required />
                </div>
                <div style={fieldCol}>
                  <label className="ax-label">Building Image {!isEditMode && <span style={{ color: 'var(--ax-danger)' }}>*</span>}</label>
                  <input type="file" accept="image/*" className="ax-input" onChange={(e) => handleFileChange(e, 'building_image')} required={!isEditMode} />
                  {selectedSite?.image1 && <small style={{ color: 'var(--ax-text-muted)' }}>Current: {selectedSite.image1.split('/').pop()}</small>}
                </div>
                <div style={fieldCol}>
                  <label className="ax-label">Roof Image {!isEditMode && <span style={{ color: 'var(--ax-danger)' }}>*</span>}</label>
                  <input type="file" accept="image/*" className="ax-input" onChange={(e) => handleFileChange(e, 'roof_image')} required={!isEditMode} />
                  {selectedSite?.image2 && <small style={{ color: 'var(--ax-text-muted)' }}>Current: {selectedSite.image2.split('/').pop()}</small>}
                </div>
                <div style={fieldCol}>
                  <label className="ax-label">Control Room Image {!isEditMode && <span style={{ color: 'var(--ax-danger)' }}>*</span>}</label>
                  <input type="file" accept="image/*" className="ax-input" onChange={(e) => handleFileChange(e, 'control_room_image')} required={!isEditMode} />
                  {selectedSite?.image3 && <small style={{ color: 'var(--ax-text-muted)' }}>Current: {selectedSite.image3.split('/').pop()}</small>}
                </div>
                <div style={fieldCol}>
                  <label className="ax-label">Other Image (Optional)</label>
                  <input type="file" accept="image/*" className="ax-input" onChange={(e) => handleFileChange(e, 'image4')} />
                  {selectedSite?.image4 && <small style={{ color: 'var(--ax-text-muted)' }}>Current: {selectedSite.image4.split('/').pop()}</small>}
                </div>
                <div style={fieldCol}>
                  <label className="ax-label">PDF (Optional, only .pdf)</label>
                  <input type="file" accept="application/pdf" className="ax-input" onChange={(e) => handleFileChange(e, 'pdf')} />
                  {selectedSite?.pdf_file && <small style={{ color: 'var(--ax-text-muted)' }}>Current: {selectedSite.pdf_file.split('/').pop()}</small>}
                </div>
              </div>
            </div>
            <div className="ax-card__actions" style={{ padding: 'var(--ax-space-4) var(--ax-space-6)', borderTop: '1px solid var(--ax-border)', justifyContent: 'flex-end', background: 'var(--ax-surface-subtle)' }}>
              <button
                type="button"
                className="ax-btn ax-btn--secondary"
                onClick={() => navigate('/v/bihar/view-srt200mw-survey')}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="ax-btn ax-btn--primary"
                disabled={submitting}
              >
                {submitting ? 'Saving Survey...' : isEditMode ? 'Update Survey' : 'Submit Survey'}
              </button>
            </div>
          </section>
        </form>
      </div>

      <footer style={{ marginTop: 'var(--ax-space-8)', textAlign: 'center', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
        Copyright © <a href="https://klkerp.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--ax-primary)' }}>ETS NETWORKS</a>. All rights reserved.
      </footer>
    </div>
  );
}

export default Bihar_Survey_SRT200MW_AddData;
