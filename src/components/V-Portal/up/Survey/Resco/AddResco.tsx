import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  upSurveyService,
  getUpSurveyMediaUrl,
  type UpRescoPendingSite,
  type UpRescoSiteDetail,
  type UpRescoSurveyRecord,
} from '../../up-services';

const CSS = `
  .solar-erp-page .ax-card { min-width: 0; }
  .solar-erp-page img,
  .solar-erp-page .ax-card img {
    border-radius: 0 !important;
  }

  .survey-section-title {
    font-size: 14px;
    font-weight: 700;
    color: var(--ax-text, #0f172a);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin: 0 0 14px 0;
    padding-bottom: 8px;
    border-bottom: 2px solid var(--ax-border, #e2e8f0);
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .survey-section-title span.badge {
    background: rgba(37, 99, 235, 0.1);
    color: #2563eb;
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 9999px;
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 16px;
  }
  @media (min-width: 1024px) {
    .form-grid-3 {
      grid-template-columns: repeat(3, 1fr);
    }
    .form-grid-4 {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  .form-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .form-field label {
    font-size: 12.5px;
    font-weight: 600;
    color: var(--ax-text, #1e293b);
  }
  .form-field label span.req {
    color: #dc2626;
    margin-left: 2px;
  }
  .form-field input,
  .form-field select,
  .form-field textarea {
    padding: 9px 12px;
    border-radius: 8px;
    border: 1px solid var(--ax-border, #cbd5e1);
    background: var(--ax-surface-solid, #ffffff);
    color: var(--ax-text, #0f172a);
    font-size: 13px;
    outline: none;
    transition: all 0.15s ease;
  }
  .form-field input:focus,
  .form-field select:focus,
  .form-field textarea:focus {
    border-color: var(--ax-accent, #2563eb);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
  }
  .form-field input[readonly],
  .form-field textarea[readonly] {
    background: var(--ax-surface-subtle, #f8fafc);
    cursor: default;
  }
`;

export function UP_Survey_Resco_AddResco() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit_id');
  const isEdit = Boolean(editId);

  // Pending sites list
  const [sites, setSites] = useState<UpRescoPendingSite[]>([]);
  const [loadingSites, setLoadingSites] = useState(false);

  // Selected site
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [siteDetail, setSiteDetail] = useState<UpRescoSiteDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Edit record
  const [editRecord, setEditRecord] = useState<UpRescoSurveyRecord | null>(null);

  // Form Fields
  const [siteAddress, setSiteAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [agencyPersonName, setAgencyPersonName] = useState('');
  const [agencyPersonContact, setAgencyPersonContact] = useState('');
  const [nodalPerson, setNodalPerson] = useState('');
  const [contactNodal, setContactNodal] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  // Technical Information
  const [loadType, setLoadType] = useState('AC');
  const [connectionPhase, setConnectionPhase] = useState('3 Phase');
  const [meterConnection, setMeterConnection] = useState('LT');
  const [meterNumber, setMeterNumber] = useState('');
  const [meterType, setMeterType] = useState('Smart Meter');
  const [sanctionLoad, setSanctionLoad] = useState('');
  const [connectedLoad, setConnectedLoad] = useState('');
  const [gridPower, setGridPower] = useState('Yes');
  const [all3PhaseLtdb, setAll3PhaseLtdb] = useState('Yes');
  const [missingPhase, setMissingPhase] = useState('None');
  const [ltdbPresent, setLtdbPresent] = useState('Present');
  const [roofCondition, setRoofCondition] = useState('Feasible');
  const [areaRoof, setAreaRoof] = useState('');
  const [freeSpaceSolar, setFreeSpaceSolar] = useState('');
  const [freeSpaceInverter, setFreeSpaceInverter] = useState('');
  const [earthPit, setEarthPit] = useState('Ok');
  const [siteFeasible, setSiteFeasible] = useState('Feasible');
  const [surveyRemarks, setSurveyRemarks] = useState('');

  // Civil / Structural
  const [buildingAge, setBuildingAge] = useState('');
  const [roofAccess, setRoofAccess] = useState('Available');
  const [rooftopHeight, setRooftopHeight] = useState('');
  const [parapetHeight, setParapetHeight] = useState('');
  const [floorsNumber, setFloorsNumber] = useState('');
  const [waterSource, setWaterSource] = useState('');

  // Other Information
  const [accessToSite, setAccessToSite] = useState('');
  const [siteDistance, setSiteDistance] = useState('');

  // File Uploads
  const [buildingImage, setBuildingImage] = useState<File | null>(null);
  const [roofImage, setRoofImage] = useState<File | null>(null);
  const [controlRoomImage, setControlRoomImage] = useState<File | null>(null);
  const [image4, setImage4] = useState<File | null>(null);
  const [image5, setImage5] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [locating, setLocating] = useState(false);

  // 1. Load pending sites (if not edit)
  useEffect(() => {
    if (!isEdit) {
      setLoadingSites(true);
      upSurveyService
        .getRescoPendingSites()
        .then((res) => {
          setSites(res);
        })
        .catch((err) => {
          console.error('Error loading pending Resco sites:', err);
        })
        .finally(() => {
          setLoadingSites(false);
        });
    }
  }, [isEdit]);

  // 2. If editing, load survey record
  useEffect(() => {
    if (isEdit && editId) {
      setLoadingDetail(true);
      upSurveyService
        .getRescoSurveyForEdit(editId)
        .then((rec) => {
          if (rec) {
            setEditRecord(rec);
            setSelectedSiteId(String(rec.id));
            setSiteAddress(rec.survey_address || rec.site_address || '');
            setLandmark(rec.near_landmark || '');
            setAgencyPersonName(rec.agency_person_name || '');
            setAgencyPersonContact(rec.agency_person_contact || '');
            setNodalPerson(rec.nodal_person || '');
            setContactNodal(rec.contact_nodal || '');
            setLatitude(String(rec.latitude || ''));
            setLongitude(String(rec.longitude || ''));
            setLoadType(rec.load_type || 'AC');
            setConnectionPhase(rec.connection_phase || '3 Phase');
            setMeterConnection(rec.meter_connection || 'LT');
            setMeterNumber(rec.meter_number || '');
            setMeterType(rec.meter_type || 'Smart Meter');
            setSanctionLoad(String(rec.sanction_load || ''));
            setConnectedLoad(String(rec.connected_load || ''));
            setGridPower(rec.grid_power || 'Yes');
            setAll3PhaseLtdb(rec.all_3_phase_ltdb || 'Yes');
            setMissingPhase(rec.missing_phase || 'None');
            setLtdbPresent(rec.ltdb_present || 'Present');
            setRoofCondition(rec.roof_condition || 'Feasible');
            setAreaRoof(String(rec.area_roof || ''));
            setFreeSpaceSolar(String(rec.free_space_solar || ''));
            setFreeSpaceInverter(String(rec.free_space_inverter || ''));
            setEarthPit(rec.earth_pit || 'Ok');
            setSiteFeasible(rec.site_feasible || 'Feasible');
            setSurveyRemarks(rec.survey_remarks || '');
            setBuildingAge(String(rec.building_age || rec.age_of_building || ''));
            setRoofAccess(rec.roof_access || 'Available');
            setRooftopHeight(String(rec.rooftop_height || ''));
            setParapetHeight(String(rec.parapet_height || ''));
            setFloorsNumber(String(rec.floors_number || ''));
            setWaterSource(rec.water_source || '');
            setAccessToSite(rec.site_access || '');
            setSiteDistance(String(rec.site_distance || ''));
          }
        })
        .catch((err) => {
          console.error('Error fetching survey for edit:', err);
          setToast({ type: 'error', message: 'Failed to load survey record for editing.' });
        })
        .finally(() => {
          setLoadingDetail(false);
        });
    }
  }, [isEdit, editId]);

  // 3. When a site is selected, fetch site detail
  const handleSiteSelect = async (siteId: string) => {
    setSelectedSiteId(siteId);
    if (!siteId) {
      setSiteDetail(null);
      return;
    }
    setLoadingDetail(true);
    try {
      const detail = await upSurveyService.getRescoSiteDetail(siteId);
      setSiteDetail(detail);
      if (detail?.address && !siteAddress) {
        setSiteAddress(detail.address);
      }
    } catch (err) {
      console.error('Error fetching site detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Browser Geolocation
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setToast({ type: 'error', message: 'Geolocation is not supported by your browser.' });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
        setLocating(false);
        setToast({ type: 'success', message: 'Current GPS coordinates captured successfully!' });
      },
      (err) => {
        setLocating(false);
        setToast({
          type: 'error',
          message: `Location error: ${err.message}. Please enter coordinates manually.`,
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Submit Handler
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    if (!selectedSiteId) {
      setToast({ type: 'error', message: 'Please select a site to survey.' });
      return;
    }

    if (!isEdit && (!buildingImage || !roofImage || !controlRoomImage)) {
      setToast({
        type: 'error',
        message: 'Building Image, Roof Image, and Control Room Image are required for a new survey.',
      });
      return;
    }

    setSubmitting(true);
    setToast(null);

    const fd = new FormData();
    if (!isEdit) {
      // In store endpoint, site_name carries the site ID
      fd.append('site_name', selectedSiteId);
    }
    fd.append('site_address', siteAddress);
    fd.append('landmark', landmark);
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
    fd.append('all_3_phase_ltdb', all3PhaseLtdb);
    fd.append('missing_phase', missingPhase);
    fd.append('ltdb_present', ltdbPresent);
    fd.append('roof_condition', roofCondition);
    fd.append('area_roof', areaRoof);
    fd.append('free_space_solar', freeSpaceSolar);
    fd.append('free_space_inverter', freeSpaceInverter);
    fd.append('earth_pit', earthPit);
    fd.append('site_feasible', siteFeasible);
    fd.append('survey_remarks', surveyRemarks);
    fd.append('building_age', buildingAge);
    fd.append('roof_access', roofAccess);
    fd.append('rooftop_height', rooftopHeight);
    fd.append('parapet_height', parapetHeight);
    fd.append('floors_number', floorsNumber);
    fd.append('water_source', waterSource);
    fd.append('site_access', accessToSite);
    fd.append('site_distance', siteDistance);

    // File attachments
    if (buildingImage) fd.append('building_image', buildingImage);
    if (roofImage) fd.append('roof_image', roofImage);
    if (controlRoomImage) fd.append('control_room_image', controlRoomImage);
    if (image4) fd.append('image4', image4);
    if (image5) fd.append('image5', image5);
    if (pdfFile) fd.append('pdf', pdfFile);

    try {
      let res;
      if (isEdit && editId) {
        res = await upSurveyService.updateRescoSurveyStore(editId, fd);
      } else {
        res = await upSurveyService.storeRescoSurvey(fd);
      }

      if (res.status) {
        setToast({
          type: 'success',
          message: res.message || (isEdit ? 'Survey Updated Successfully!!!' : 'Survey Complete Successfully!!!'),
        });
        setTimeout(() => {
          navigate('/v/up/view-resco-survey');
        }, 1200);
      } else {
        setToast({ type: 'error', message: res.message || 'Failed to submit survey.' });
        if (res.errors) {
          setFieldErrors(res.errors);
        }
      }
    } catch (err: any) {
      setToast({ type: 'error', message: err?.message || 'Error occurred while saving survey.' });
    } finally {
      setSubmitting(false);
    }
  };

  const currentGeneral = useMemo(() => {
    if (siteDetail) return siteDetail;
    if (editRecord) {
      return {
        id: editRecord.id,
        uid: editRecord.uid || `RESCO-${editRecord.id}`,
        state: editRecord.state || 'UP',
        district: editRecord.district || '—',
        division: editRecord.division || '—',
        sub_division: editRecord.sub_division || '—',
        dept_name: editRecord.dept_name || '—',
        site_name: editRecord.site_name || '—',
        address: editRecord.site_address || '—',
        location: editRecord.site_address || '—',
        ca_no: editRecord.ca_no || '—',
      };
    }
    return null;
  }, [siteDetail, editRecord]);

  return (
    <div className="ax-page solar-erp-page">
      <style>{CSS}</style>

      {/* Header */}
      <PageHead
        title="Welcome to, UP Resco Survey"
        subtitle={isEdit ? 'Edit UP Resco Survey Feasibility Report' : 'Site Feasibility Report'}
        breadcrumbs={[
          { label: 'Home', href: '/v' },
          { label: 'UP Resco Survey', href: '/v/up/view-resco-survey' },
          { label: isEdit ? 'Edit Resco' : 'Add Resco' },
        ]}
      />

      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: 8,
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: toast.type === 'success' ? '#ecfdf5' : '#fef2f2',
            border: `1px solid ${toast.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
            color: toast.type === 'success' ? '#065f46' : '#991b1b',
            fontSize: 13.5,
            fontWeight: 500,
          }}
        >
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit' }}
          >
            ✕
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Step 1: Site Selector */}
        <div className="ax-card" style={{ marginBottom: 20, padding: 20, borderRadius: 12 }}>
          <div className="form-field" style={{ maxWidth: 500 }}>
            <label htmlFor="site-select">
              Select Site <span className="req">*</span>
            </label>
            {isEdit ? (
              <input
                id="site-select"
                type="text"
                readOnly
                value={`${editRecord?.site_name || 'Site'} (#${editId})`}
                style={{ fontWeight: 600 }}
              />
            ) : (
              <select
                id="site-select"
                value={selectedSiteId}
                onChange={(e) => handleSiteSelect(e.target.value)}
                disabled={loadingSites}
                required
              >
                <option value="">-- Select Site --</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.uid ? `[${s.uid}] ` : ''}
                    {s.site_name} - {s.district || s.state}
                  </option>
                ))}
              </select>
            )}
            {fieldErrors.site_name && (
              <span style={{ fontSize: 11, color: '#dc2626' }}>{fieldErrors.site_name[0]}</span>
            )}
          </div>

          {/* General Information (read-only grid auto-filled) */}
          {currentGeneral && (
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--ax-border, #e2e8f0)' }}>
              <div className="survey-section-title">
                General Information
                <span className="badge">Auto-filled</span>
              </div>
              <div className="form-grid form-grid-3">
                <div className="form-field">
                  <label>Unique ID</label>
                  <input type="text" readOnly value={currentGeneral.uid || '—'} />
                </div>
                <div className="form-field">
                  <label>State</label>
                  <input type="text" readOnly value={(currentGeneral.state || 'UP').toUpperCase()} />
                </div>
                <div className="form-field">
                  <label>District</label>
                  <input type="text" readOnly value={currentGeneral.district || '—'} />
                </div>
                <div className="form-field">
                  <label>Division</label>
                  <input type="text" readOnly value={currentGeneral.division || '—'} />
                </div>
                <div className="form-field">
                  <label>Sub Division</label>
                  <input type="text" readOnly value={currentGeneral.sub_division || '—'} />
                </div>
                <div className="form-field">
                  <label>Department</label>
                  <input type="text" readOnly value={currentGeneral.dept_name || '—'} />
                </div>
                <div className="form-field">
                  <label>Site Name</label>
                  <input type="text" readOnly value={currentGeneral.site_name || '—'} style={{ fontWeight: 600 }} />
                </div>
                <div className="form-field">
                  <label>Location / Address</label>
                  <input type="text" readOnly value={currentGeneral.address || currentGeneral.location || '—'} />
                </div>
                <div className="form-field">
                  <label>CA No.</label>
                  <input type="text" readOnly value={currentGeneral.ca_no || '—'} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Fill this Form */}
        <div className="ax-card" style={{ marginBottom: 20, padding: 20, borderRadius: 12 }}>
          <div className="survey-section-title">
            Fill this Form
            <span className="badge">Fields with * are required</span>
          </div>

          {/* Location & Contact Information */}
          <div className="form-grid form-grid-3" style={{ marginBottom: 20 }}>
            <div className="form-field" style={{ gridColumn: 'span 2' }}>
              <label>
                Site Address (details) <span className="req">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter Site Address"
                value={siteAddress}
                onChange={(e) => setSiteAddress(e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label>
                Nearest Landmark <span className="req">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter Nearest Landmark"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label>
                Name of Contact Person of Agency <span className="req">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter Name of Contact Person"
                value={agencyPersonName}
                onChange={(e) => setAgencyPersonName(e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label>
                Contact Number <span className="req">*</span>
              </label>
              <input
                type="tel"
                placeholder="Enter Contact No. of the Person"
                value={agencyPersonContact}
                onChange={(e) => setAgencyPersonContact(e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label>
                Nodal Person of concern building <span className="req">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter Name of Nodal Person"
                value={nodalPerson}
                onChange={(e) => setNodalPerson(e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label>
                Contact Number of Nodal Person <span className="req">*</span>
              </label>
              <input
                type="tel"
                placeholder="Enter Contact of Nodal Person"
                value={contactNodal}
                onChange={(e) => setContactNodal(e.target.value)}
                required
              />
            </div>

            {/* Coordinates with GPS Auto-Detect */}
            <div className="form-field">
              <label>
                Latitude <span className="req">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 26.8467"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label>
                Longitude <span className="req">*</span>
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  placeholder="e.g. 80.9462"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  style={{ flex: 1 }}
                  required
                />
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={locating}
                  className="ax-btn ax-btn--subtle"
                  style={{ padding: '0 12px', fontSize: 12, whiteSpace: 'nowrap' }}
                  title="Detect GPS Location"
                >
                  {locating ? 'Locating...' : '📍 GPS'}
                </button>
              </div>
            </div>
          </div>

          {/* Section: Technical Information */}
          <div className="survey-section-title" style={{ marginTop: 24 }}>
            Technical Information
          </div>
          <div className="form-grid form-grid-3" style={{ marginBottom: 20 }}>
            <div className="form-field">
              <label>
                Type of Load <span className="req">*</span>
              </label>
              <select value={loadType} onChange={(e) => setLoadType(e.target.value)} required>
                <option value="AC">AC</option>
                <option value="DC">DC</option>
                <option value="Mixed">Mixed</option>
              </select>
            </div>

            <div className="form-field">
              <label>
                Connection Phase <span className="req">*</span>
              </label>
              <select value={connectionPhase} onChange={(e) => setConnectionPhase(e.target.value)} required>
                <option value="1 Phase">1 Phase</option>
                <option value="3 Phase">3 Phase</option>
              </select>
            </div>

            <div className="form-field">
              <label>
                Meter Connection Type <span className="req">*</span>
              </label>
              <select value={meterConnection} onChange={(e) => setMeterConnection(e.target.value)} required>
                <option value="LT">LT</option>
                <option value="HT">HT</option>
              </select>
            </div>

            <div className="form-field">
              <label>
                Meter Number <span className="req">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter Meter Number"
                value={meterNumber}
                onChange={(e) => setMeterNumber(e.target.value)}
                required
              />
              {fieldErrors.meter_number && (
                <span style={{ fontSize: 11, color: '#dc2626' }}>{fieldErrors.meter_number[0]}</span>
              )}
            </div>

            <div className="form-field">
              <label>
                Meter Type <span className="req">*</span>
              </label>
              <select value={meterType} onChange={(e) => setMeterType(e.target.value)} required>
                <option value="Smart Meter">Smart Meter</option>
                <option value="Electronic">Electronic</option>
                <option value="Electromechanical">Electromechanical</option>
                <option value="Net Meter">Net Meter</option>
                <option value="Solar Meter">Solar Meter</option>
              </select>
            </div>

            <div className="form-field">
              <label>
                Sanction Load (KW/KVA) <span className="req">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter Sanction Load"
                value={sanctionLoad}
                onChange={(e) => setSanctionLoad(e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label>
                Instantaneous/Connected Load (KW) <span className="req">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter Instantaneous/Connected Load"
                value={connectedLoad}
                onChange={(e) => setConnectedLoad(e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label>
                Grid power availability in hours <span className="req">*</span>
              </label>
              <select value={gridPower} onChange={(e) => setGridPower(e.target.value)} required>
                <option value="24 Hours">24 Hours</option>
                <option value="18-20 Hours">18-20 Hours</option>
                <option value="12-16 Hours">12-16 Hours</option>
                <option value="8-12 Hours">8-12 Hours</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            <div className="form-field">
              <label>
                Is all three-phase available in LTDB <span className="req">*</span>
              </label>
              <select value={all3PhaseLtdb} onChange={(e) => setAll3PhaseLtdb(e.target.value)} required>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
                <option value="NA">NA</option>
              </select>
            </div>

            <div className="form-field">
              <label>
                If phase is missing, name i.e., R, Y, B, N <span className="req">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. None or R, Y"
                value={missingPhase}
                onChange={(e) => setMissingPhase(e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label>
                Is LTDB Present <span className="req">*</span>
              </label>
              <select value={ltdbPresent} onChange={(e) => setLtdbPresent(e.target.value)} required>
                <option value="Present">Present</option>
                <option value="Not Present">Not Present</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            <div className="form-field">
              <label>
                Roof Condition of solar power plant installation <span className="req">*</span>
              </label>
              <select value={roofCondition} onChange={(e) => setRoofCondition(e.target.value)} required>
                <option value="Feasible">Feasible</option>
                <option value="Good">Good</option>
                <option value="RCC Roof">RCC Roof</option>
                <option value="Tin Shed">Tin Shed</option>
                <option value="Average">Average</option>
                <option value="Poor">Poor</option>
              </select>
            </div>

            <div className="form-field">
              <label>
                Total Area of Roof (in Sq.Feet) <span className="req">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter Total Area of Roof"
                value={areaRoof}
                onChange={(e) => setAreaRoof(e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label>
                Free space for solar Installation (in Sq.Feet) <span className="req">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter Free space for solar Installation"
                value={freeSpaceSolar}
                onChange={(e) => setFreeSpaceSolar(e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label>
                Free space for Control Room/Inverter (in Sq.Feet) <span className="req">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter Free space for Control Room/Inverter"
                value={freeSpaceInverter}
                onChange={(e) => setFreeSpaceInverter(e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label>
                Earth pit position <span className="req">*</span>
              </label>
              <select value={earthPit} onChange={(e) => setEarthPit(e.target.value)} required>
                <option value="Ok">Ok</option>
                <option value="Available">Available</option>
                <option value="Not Available">Not Available</option>
                <option value="Near Control Room">Near Control Room</option>
                <option value="Beside Building">Beside Building</option>
              </select>
            </div>

            <div className="form-field">
              <label>
                Site Feasible <span className="req">*</span>
              </label>
              <select value={siteFeasible} onChange={(e) => setSiteFeasible(e.target.value)} required>
                <option value="Feasible">Feasible</option>
                <option value="Not Feasible">Not Feasible</option>
                <option value="Partially Feasible">Partially Feasible</option>
              </select>
            </div>

            <div className="form-field" style={{ gridColumn: 'span 3' }}>
              <label>
                Survey Remarks <span className="req">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="Enter survey findings and technical observation remarks..."
                value={surveyRemarks}
                onChange={(e) => setSurveyRemarks(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Section: Civil / Structural */}
          <div className="survey-section-title" style={{ marginTop: 24 }}>
            Civil / Structural
          </div>
          <div className="form-grid form-grid-3" style={{ marginBottom: 20 }}>
            <div className="form-field">
              <label>
                Age of Building <span className="req">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter Age of Building (e.g. 5 Years)"
                value={buildingAge}
                onChange={(e) => setBuildingAge(e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label>
                Access to the roof (Availability of Staircase) <span className="req">*</span>
              </label>
              <select value={roofAccess} onChange={(e) => setRoofAccess(e.target.value)} required>
                <option value="Available">Available</option>
                <option value="Not Available">Not Available</option>
                <option value="Internal Staircase">Internal Staircase</option>
                <option value="External Staircase">External Staircase</option>
                <option value="Ladder">Ladder</option>
              </select>
            </div>

            <div className="form-field">
              <label>
                Rooftop Height (Feet) <span className="req">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter Rooftop Height"
                value={rooftopHeight}
                onChange={(e) => setRooftopHeight(e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label>
                Parapet Height (Feet) <span className="req">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter Parapet Height"
                value={parapetHeight}
                onChange={(e) => setParapetHeight(e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label>
                No. of floors (G+...) <span className="req">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter No. of floors (e.g. G+2)"
                value={floorsNumber}
                onChange={(e) => setFloorsNumber(e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label>
                Water Source for Cleaning <span className="req">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter Water Source for Cleaning"
                value={waterSource}
                onChange={(e) => setWaterSource(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Section: Other Information */}
          <div className="survey-section-title" style={{ marginTop: 24 }}>
            Other Information
          </div>
          <div className="form-grid form-grid-3" style={{ marginBottom: 20 }}>
            <div className="form-field">
              <label>
                Access to Site <span className="req">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter Access to Site"
                value={accessToSite}
                onChange={(e) => setAccessToSite(e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label>
                Distance of site from main Road (km) <span className="req">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter Distance of site from main Road"
                value={siteDistance}
                onChange={(e) => setSiteDistance(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Section: Image & Document Uploads */}
          <div className="survey-section-title" style={{ marginTop: 24 }}>
            Site Photos & PDF Upload
          </div>
          <div className="form-grid form-grid-3" style={{ marginBottom: 20 }}>
            <div className="form-field">
              <label>
                Building Image {!isEdit && <span className="req">*</span>}
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files && setBuildingImage(e.target.files[0])}
                required={!isEdit}
              />
              {isEdit && editRecord?.image1 && (
                <span style={{ fontSize: 11, color: 'var(--ax-text-muted)' }}>
                  Current: <a href={getUpSurveyMediaUrl(editRecord.image1)} target="_blank" rel="noreferrer">View Image</a>
                </span>
              )}
            </div>

            <div className="form-field">
              <label>
                Roof Image {!isEdit && <span className="req">*</span>}
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files && setRoofImage(e.target.files[0])}
                required={!isEdit}
              />
              {isEdit && editRecord?.image2 && (
                <span style={{ fontSize: 11, color: 'var(--ax-text-muted)' }}>
                  Current: <a href={getUpSurveyMediaUrl(editRecord.image2)} target="_blank" rel="noreferrer">View Image</a>
                </span>
              )}
            </div>

            <div className="form-field">
              <label>
                Control Room Image {!isEdit && <span className="req">*</span>}
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files && setControlRoomImage(e.target.files[0])}
                required={!isEdit}
              />
              {isEdit && editRecord?.image3 && (
                <span style={{ fontSize: 11, color: 'var(--ax-text-muted)' }}>
                  Current: <a href={getUpSurveyMediaUrl(editRecord.image3)} target="_blank" rel="noreferrer">View Image</a>
                </span>
              )}
            </div>

            <div className="form-field">
              <label>Meter Image (image4)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files && setImage4(e.target.files[0])}
              />
              {isEdit && editRecord?.image4 && (
                <span style={{ fontSize: 11, color: 'var(--ax-text-muted)' }}>
                  Current: <a href={getUpSurveyMediaUrl(editRecord.image4)} target="_blank" rel="noreferrer">View Image</a>
                </span>
              )}
            </div>

            <div className="form-field">
              <label>Other Image (image5)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files && setImage5(e.target.files[0])}
              />
              {isEdit && editRecord?.image5 && (
                <span style={{ fontSize: 11, color: 'var(--ax-text-muted)' }}>
                  Current: <a href={getUpSurveyMediaUrl(editRecord.image5)} target="_blank" rel="noreferrer">View Image</a>
                </span>
              )}
            </div>

            <div className="form-field">
              <label>PDF (Feasibility Sheet)</label>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => e.target.files && setPdfFile(e.target.files[0])}
              />
              {isEdit && (editRecord?.pdf_file || editRecord?.pdf) && (
                <span style={{ fontSize: 11, color: 'var(--ax-text-muted)' }}>
                  Current: <a href={getUpSurveyMediaUrl(editRecord.pdf_file || editRecord.pdf)} target="_blank" rel="noreferrer">View PDF</a>
                </span>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div
            style={{
              marginTop: 30,
              paddingTop: 20,
              borderTop: '1px solid var(--ax-border, #e2e8f0)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 12,
            }}
          >
            <button
              type="button"
              onClick={() => navigate('/v/up/view-resco-survey')}
              className="ax-btn ax-btn--subtle"
              disabled={submitting}
              style={{ padding: '10px 20px', borderRadius: 8 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="ax-btn ax-btn--primary"
              disabled={submitting}
              style={{
                padding: '10px 28px',
                borderRadius: 8,
                background: '#2563eb',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              {submitting ? 'Submitting Survey...' : isEdit ? 'Update Survey' : 'Submit Feasibility Survey'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export const UPSurveyRescoAddResco = UP_Survey_Resco_AddResco;
export default UP_Survey_Resco_AddResco;
