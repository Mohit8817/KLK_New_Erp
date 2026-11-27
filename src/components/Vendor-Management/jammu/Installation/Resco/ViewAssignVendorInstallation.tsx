import { useState, useMemo, useRef, useEffect, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  jammuRescoAdminService,
  type VendorItem,
} from './jammuRescoAdminService';
import {
  SINGLE_CARD_FORM_CSS,
  FloatingInput,
  UploadDropzone,
  StatusFeedbackBanners,
} from '../../../up/Installation/upInstallationShared';

export function ViewAssignVendorInstallation() {
  const navigate = useNavigate();

  // Dynamic API Options (Strictly live - zero fake fallback)
  const [vendorList, setVendorList] = useState<VendorItem[]>([]);
  const [srtRecords, setSrtRecords] = useState<any[]>([]);
  const [fetchingOptions, setFetchingOptions] = useState(true);
  const [fetchingSiteDetail, setFetchingSiteDetail] = useState(false);

  // Selected Site & Vendor
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [selectedVendorId, setSelectedVendorId] = useState<string>('');

  // Unified vendors mapping and list (includes all vendors from API and any inst_vendor from srtRecords)
  const vendorMap = useMemo(() => {
    const map = new Map<number, string>();
    vendorList.forEach((v) => {
      map.set(Number(v.id), v.name);
    });
    srtRecords.forEach((s) => {
      const vid = Number(s.inst_vendor || 0);
      if (vid > 0 && !map.has(vid)) {
        map.set(vid, s.vendor_name || `Vendor #${vid}`);
      }
    });
    return map;
  }, [vendorList, srtRecords]);

  const combinedVendors = useMemo(() => {
    const list: { id: number; name: string }[] = [...vendorList];
    const existingIds = new Set(vendorList.map((v) => Number(v.id)));

    srtRecords.forEach((s) => {
      const vid = Number(s.inst_vendor || 0);
      if (vid > 0 && !existingIds.has(vid)) {
        existingIds.add(vid);
        list.push({
          id: vid,
          name: s.vendor_name || `Vendor #${vid}`,
        });
      }
    });

    return list.sort((a, b) => a.id - b.id);
  }, [vendorList, srtRecords]);

  const currentSite = useMemo(() => {
    return srtRecords.find((s) => String(s.id) === String(selectedSiteId));
  }, [srtRecords, selectedSiteId]);

  const currentSiteVendorId = Number(currentSite?.inst_vendor || 0);
  const currentSiteVendorName = currentSiteVendorId > 0 ? vendorMap.get(currentSiteVendorId) : null;

  // Handle immediate vendor synchronization when a site is picked
  const handleSiteSelect = (siteId: string) => {
    setSelectedSiteId(siteId);
    if (!siteId) {
      setSiteDetails(null);
      setSelectedVendorId('');
      return;
    }
    const found = srtRecords.find((r) => String(r.id) === String(siteId));
    if (found) {
      const vId = Number(found.inst_vendor ?? 0);
      if (vId > 0) {
        setSelectedVendorId(String(vId));
      }
    }
  };

  // Auto-populated General Information from fetchSiteDetail
  const [siteDetails, setSiteDetails] = useState<{
    id?: number;
    survey_id?: number | string;
    unique_id?: string;
    state?: string;
    district?: string;
    division?: string;
    sub_division?: string;
    dept_name?: string;
    site_name?: string;
    address?: string;
    location?: string;
    latitude?: string | number;
    longitude?: string | number;
    ca_no?: string;
    wo_no?: string;
    plant_sc?: string | number;
    inst_vendor?: number | string;
    vendor?: number | string;
  } | null>(null);

  // Form Fields: Contact & Address
  const [siteAddress, setSiteAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [agencyPersonName, setAgencyPersonName] = useState('');
  const [agencyPersonContact, setAgencyPersonContact] = useState('');
  const [nodalPerson, setNodalPerson] = useState('');
  const [contactNodal, setContactNodal] = useState('');
  const [latitude, setLatitude] = useState('32.7266');
  const [longitude, setLongitude] = useState('74.8570');

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
  const [floorsNumber, setFloorsNumber] = useState('G+1');
  const [waterSource, setWaterSource] = useState('Available');
  const [siteAccess, setSiteAccess] = useState('Good');
  const [siteDistance, setSiteDistance] = useState('0');

  // Images & Documents
  const [buildingImage, setBuildingImage] = useState<File | null>(null);
  const [buildingImagePreview, setBuildingImagePreview] = useState<string | undefined>(undefined);

  const [roofImage, setRoofImage] = useState<File | null>(null);
  const [roofImagePreview, setRoofImagePreview] = useState<string | undefined>(undefined);

  const [controlRoomImage, setControlRoomImage] = useState<File | null>(null);
  const [controlRoomImagePreview, setControlRoomImagePreview] = useState<string | undefined>(undefined);

  const [meterImage, setMeterImage] = useState<File | null>(null);
  const [meterImagePreview, setMeterImagePreview] = useState<string | undefined>(undefined);

  const [otherImage, setOtherImage] = useState<File | null>(null);
  const [otherImagePreview, setOtherImagePreview] = useState<string | undefined>(undefined);

  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Section refs for smooth navigation pills
  const sec1 = useRef<HTMLDivElement>(null);
  const sec2 = useRef<HTMLDivElement>(null);
  const sec3 = useRef<HTMLDivElement>(null);
  const sec4 = useRef<HTMLDivElement>(null);
  const sec5 = useRef<HTMLDivElement>(null);

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // 1. Initial Load: View Assign Vendor data (vendors & srtRecords)
  useEffect(() => {
    let cancelled = false;
    setFetchingOptions(true);
    setErrorMsg('');

    jammuRescoAdminService
      .getViewAssignVendor()
      .then((res) => {
        if (!cancelled) {
          setVendorList(res.vendors || []);
          setSrtRecords(res.srtRecords || []);
        }
      })
      .catch((err: any) => {
        if (!cancelled) setErrorMsg(err?.message || 'Failed to load assigned vendor sites.');
      })
      .finally(() => {
        if (!cancelled) setFetchingOptions(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // 2. Fetch Site Detail when selectedSiteId changes
  useEffect(() => {
    if (!selectedSiteId) {
      setSiteDetails(null);
      return;
    }

    let cancelled = false;
    setFetchingSiteDetail(true);

    jammuRescoAdminService
      .fetchSiteDetail(selectedSiteId)
      .then((res) => {
        if (!cancelled && res.success && res.srt) {
          const s = res.srt;
          setSiteDetails(s);
          if (s.address) setSiteAddress(s.address);
          if (s.sanction_load || s.plant_sc) setSanctionLoad(String(s.sanction_load || s.plant_sc));
          if (s.latitude) setLatitude(String(s.latitude));
          if (s.longitude) setLongitude(String(s.longitude));
          const vId = Number(s.inst_vendor || s.vendor || 0);
          if (vId > 0) {
            setSelectedVendorId(String(vId));
          }
        }
      })
      .catch((err: any) => {
        if (!cancelled) setErrorMsg(err?.message || 'Failed to fetch site details.');
      })
      .finally(() => {
        if (!cancelled) setFetchingSiteDetail(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedSiteId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedSiteId) return setErrorMsg('Please select a Site.');
    if (!selectedVendorId) return setErrorMsg('Please select a Vendor.');
    if (!siteAddress.trim()) return setErrorMsg('Site Address details are required.');
    if (!landmark.trim()) return setErrorMsg('Nearest Landmark is required.');
    if (!agencyPersonName.trim()) return setErrorMsg('Agency contact person name is required.');
    if (!agencyPersonContact.trim()) return setErrorMsg('Agency contact number is required.');
    if (!nodalPerson.trim()) return setErrorMsg('Nodal person name is required.');
    if (!contactNodal.trim()) return setErrorMsg('Nodal person contact is required.');
    if (!latitude.trim() || !longitude.trim()) return setErrorMsg('Latitude and Longitude are required.');
    if (!meterNumber.trim()) return setErrorMsg('Meter Number is required.');
    if (!sanctionLoad.trim()) return setErrorMsg('Sanction load is required.');
    if (!connectedLoad.trim()) return setErrorMsg('Connected load is required.');
    if (!areaRoof.trim()) return setErrorMsg('Total area of roof is required.');
    if (!freeSpaceSolar.trim()) return setErrorMsg('Free space for solar is required.');
    if (!freeSpaceInverter.trim()) return setErrorMsg('Free space for control room/inverter is required.');
    if (!buildingAge.trim()) return setErrorMsg('Building age is required.');
    if (!rooftopHeight.trim()) return setErrorMsg('Rooftop height is required.');
    if (!parapetHeight.trim()) return setErrorMsg('Parapet height is required.');
    if (!surveyRemarks.trim()) return setErrorMsg('Survey remarks are required.');
    if (!buildingImage) return setErrorMsg('Building Image is required.');
    if (!roofImage) return setErrorMsg('Roof Image is required.');
    if (!controlRoomImage) return setErrorMsg('Control Room Image is required.');

    setLoading(true);
    try {
      const fd = new FormData();

      // Target IDs (Integer and Aliases)
      const siteIdVal = String(selectedSiteId);
      const targetSurveyId = String(siteDetails?.survey_id || currentSite?.survey_id || siteIdVal);
      const siteNameText = siteDetails?.site_name || currentSite?.site_name || '';

      // Primary site_name (Rule: integer srt_surveys.id / jammu_rescos.id)
      fd.append('site_name', siteIdVal);
      fd.append('site_id', siteIdVal);
      fd.append('id', siteIdVal);
      fd.append('srt_id', siteIdVal);
      if (targetSurveyId && targetSurveyId !== siteIdVal) {
        fd.append('survey_id', targetSurveyId);
      } else {
        fd.append('survey_id', siteIdVal);
      }
      if (siteNameText) {
        fd.append('sitename', siteNameText);
        fd.append('name', siteNameText);
      }

      // Vendor (using selected or site's assigned vendor)
      const effectiveVendor =
        selectedVendorId ||
        String(siteDetails?.inst_vendor || siteDetails?.vendor || currentSite?.inst_vendor || '');
      if (effectiveVendor) {
        fd.append('vendor', effectiveVendor);
        fd.append('inst_vendor', effectiveVendor);
        fd.append('vendor_id', effectiveVendor);
      }

      // State & District matching site details
      const effectiveState = siteDetails?.state || currentSite?.state || 'jammu';
      const effectiveDistrict = siteDetails?.district || currentSite?.district || 'Jammu';
      fd.append('state', effectiveState);
      fd.append('district', effectiveDistrict);

      // Contact & Address
      fd.append('site_address', siteAddress.trim());
      fd.append('landmark', landmark.trim());
      fd.append('agency_person_name', agencyPersonName.trim());
      fd.append('agency_person_contact', agencyPersonContact.trim());
      fd.append('nodal_person', nodalPerson.trim());
      fd.append('contact_nodal', contactNodal.trim());

      // Coordinates
      const effectiveLat = latitude.trim() || (siteDetails?.latitude ? String(siteDetails.latitude).trim() : '32.7266');
      const effectiveLng = longitude.trim() || (siteDetails?.longitude ? String(siteDetails.longitude).trim() : '74.8570');
      fd.append('latitude', effectiveLat);
      fd.append('longitude', effectiveLng);

      // Technical Information
      fd.append('load_type', loadType);
      fd.append('connection_phase', connectionPhase);
      fd.append('meter_connection', meterConnection);
      fd.append('meter_number', meterNumber.trim());
      fd.append('meter_type', meterType);
      fd.append('sanction_load', sanctionLoad.trim());
      fd.append('connected_load', connectedLoad.trim());
      fd.append('grid_power', gridPower);
      fd.append('all_3_phase_ltdb', all3PhaseLtdb);
      fd.append('missing_phase', missingPhase.trim());
      fd.append('ltdb_present', ltdbPresent);
      fd.append('roof_condition', roofCondition);
      fd.append('area_roof', areaRoof.trim());
      fd.append('free_space_solar', freeSpaceSolar.trim());
      fd.append('free_space_inverter', freeSpaceInverter.trim());
      fd.append('earth_pit', earthPit);
      fd.append('site_feasible', siteFeasible);
      fd.append('survey_remarks', surveyRemarks.trim());

      // Civil & Structural
      fd.append('building_age', buildingAge.trim());
      fd.append('roof_access', roofAccess);
      fd.append('rooftop_height', rooftopHeight.trim());
      fd.append('parapet_height', parapetHeight.trim());
      fd.append('floors_number', floorsNumber);
      fd.append('water_source', waterSource);
      fd.append('site_access', siteAccess);
      fd.append('site_distance', siteDistance.trim());

      // Images & Document Attachments (both naming schemes)
      if (buildingImage) {
        fd.append('building_image', buildingImage);
        fd.append('image1', buildingImage);
      }
      if (roofImage) {
        fd.append('roof_image', roofImage);
        fd.append('image2', roofImage);
      }
      if (controlRoomImage) {
        fd.append('control_room_image', controlRoomImage);
        fd.append('image3', controlRoomImage);
      }
      if (meterImage) {
        fd.append('meter_image', meterImage);
        fd.append('image4', meterImage);
      }
      if (otherImage) {
        fd.append('other_image', otherImage);
        fd.append('image5', otherImage);
      }
      if (pdfFile) {
        fd.append('pdf', pdfFile);
        fd.append('pdf_file', pdfFile);
      }

      const res = await jammuRescoAdminService.storeSurvey(fd);
      if (res.success) {
        setSuccessMsg(res.message || 'Jammu RESCO Site Feasibility Survey submitted successfully!');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => {
          navigate('/vendor-management/jammu/installation/resco/view-assign-installation');
        }, 1400);
      } else {
        setErrorMsg(res.message || 'Validation failed. Please verify all inputs.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to submit feasibility survey.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ax-page swp-inst-form">
      <style>{SINGLE_CARD_FORM_CSS}</style>

      <PageHead
        title="Jammu RESCO Assigned Vendor - Site Feasibility Report"
        subtitle="The field labels marked with * are required input fields."
        breadcrumbs={[
          { label: 'ERP Dashboard', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Jammu', href: '/vendor-management/jammu' },
          { label: 'Installation', href: '/vendor-management/jammu/installation/resco' },
          { label: 'RESCO', href: '/vendor-management/jammu/installation/resco' },
          { label: 'Site Feasibility Report' },
        ]}
        actions={
          <Link
            to="/vendor-management/jammu/installation/resco/view-assign-installation"
            className="ax-btn ax-btn--primary ax-btn--sm"
          >
            View Assigned Installations
          </Link>
        }
      />

      <StatusFeedbackBanners
        errorMsg={errorMsg}
        successMsg={successMsg}
        onClearError={() => setErrorMsg('')}
        onClearSuccess={() => setSuccessMsg('')}
      />

      <form onSubmit={handleSubmit} className="ax-card">
        <div className="ax-card__header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h2 className="ax-card__title" style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--ax-text-strong, #0f172a)' }}>
                Jammu RESCO Assigned Vendor - Site Feasibility Report
              </h2>
              <p className="ax-card__subtitle" style={{ fontSize: '0.85rem', color: '#ef4444', margin: '4px 0 0' }}>
                The field labels marked with * are required input fields.
              </p>
            </div>
            {fetchingOptions && (
              <span style={{ fontSize: 12, color: '#2563eb', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span className="ax-spinner" /> Loading assigned sites...
              </span>
            )}
          </div>

          <div className="swp-section-pills">
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec1)}>
              <span className="pill-num">1</span> Site & Vendor
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec2)}>
              <span className="pill-num">2</span> General Information
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec3)}>
              <span className="pill-num">3</span> Technical Details
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec4)}>
              <span className="pill-num">4</span> Civil & Structural
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec5)}>
              <span className="pill-num">5</span> Photos & Documents
            </button>
          </div>
        </div>

        <div className="ax-card__body">
          {/* Section 1: Site & Vendor Selection */}
          <div ref={sec1} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
                  1. Site & Vendor Selection <span style={{ color: '#ef4444' }}>*</span>
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Select the assigned RESCO site and vendor responsible for feasibility execution
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
              <div className="ax-float">
                <select
                  id="jammu_resco_survey_site"
                  className="ax-float__input"
                  value={selectedSiteId}
                  onChange={(e) => handleSiteSelect(e.target.value)}
                  disabled={loading || fetchingOptions}
                  required
                >
                  <option value="">-- Select Site --</option>
                  {srtRecords.map((s) => {
                    const vid = Number(s.inst_vendor || 0);
                    const vName = vid > 0 ? vendorMap.get(vid) || `Vendor #${vid}` : null;
                    return (
                      <option key={s.id} value={String(s.id)}>
                        {s.site_name || s.farmer_name || `Site #${s.id}`} (Site ID: #{s.id}) {vid > 0 ? `— Vendor: ${vName} (ID: #${vid})` : '— (No Vendor Assigned)'}
                      </option>
                    );
                  })}
                </select>
                <label htmlFor="jammu_resco_survey_site" className="ax-float__label floating">
                  Select Site <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              <div className="ax-float">
                <select
                  id="jammu_resco_survey_vendor"
                  className="ax-float__input"
                  value={selectedVendorId}
                  onChange={(e) => setSelectedVendorId(e.target.value)}
                  disabled={loading || fetchingOptions}
                  required
                >
                  <option value="">-- Select Vendor --</option>
                  {combinedVendors.map((v) => (
                    <option key={v.id} value={String(v.id)}>
                      {v.name} (Vendor ID: #{v.id})
                    </option>
                  ))}
                </select>
                <label htmlFor="jammu_resco_survey_vendor" className="ax-float__label floating">
                  Select Vendor <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              {selectedSiteId && (
                <div
                  style={{
                    gridColumn: '1 / -1',
                    background: '#eff4fc',
                    border: '1px solid #bfd3f8',
                    borderRadius: 8,
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: 13,
                    color: '#1e40af',
                    flexWrap: 'wrap',
                    gap: 8,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span>
                      <strong>Selected Site:</strong> {currentSite?.site_name || siteDetails?.site_name || `Site #${selectedSiteId}`} (Site ID: #{selectedSiteId})
                    </span>
                    <span style={{ color: '#94a3b8' }}>•</span>
                    <span>
                      <strong>Assigned Vendor (inst_vendor):</strong>{' '}
                      {currentSiteVendorId > 0 ? (
                        <span style={{ color: '#0f172a', fontWeight: 700 }}>
                          {currentSiteVendorName ? `${currentSiteVendorName} (ID: #${currentSiteVendorId})` : `Vendor #${currentSiteVendorId}`}
                        </span>
                      ) : (
                        <span style={{ color: '#64748b' }}>Not Assigned (0)</span>
                      )}
                    </span>
                  </div>

                  {currentSiteVendorId > 0 && selectedVendorId === String(currentSiteVendorId) && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '3px 8px',
                        background: '#ecfdf5',
                        color: '#059669',
                        border: '1px solid #a7f3d0',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      ✓ Vendor Auto-selected
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <hr className="swp-section-divider" />

          {/* Section 2: General Information */}
          <div ref={sec2} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
                  2. General Information
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  {fetchingSiteDetail
                    ? 'Loading site master data...'
                    : 'Auto-populated from the central Jammu RESCO site database'}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              <div className="ax-float">
                <input
                  type="text"
                  className="ax-float__input"
                  value={siteDetails?.unique_id || (siteDetails?.id ? `#${siteDetails.id}` : '—')}
                  readOnly
                  disabled
                />
                <label className="ax-float__label floating">Unique ID</label>
              </div>

              <div className="ax-float">
                <input
                  type="text"
                  className="ax-float__input"
                  value="JAMMU"
                  readOnly
                  disabled
                />
                <label className="ax-float__label floating">State</label>
              </div>

              <div className="ax-float">
                <input
                  type="text"
                  className="ax-float__input"
                  value={siteDetails?.district || '—'}
                  readOnly
                  disabled
                />
                <label className="ax-float__label floating">District</label>
              </div>

              <div className="ax-float">
                <input
                  type="text"
                  className="ax-float__input"
                  value={siteDetails?.division || '—'}
                  readOnly
                  disabled
                />
                <label className="ax-float__label floating">Division</label>
              </div>

              <div className="ax-float">
                <input
                  type="text"
                  className="ax-float__input"
                  value={siteDetails?.sub_division || '—'}
                  readOnly
                  disabled
                />
                <label className="ax-float__label floating">Sub Division</label>
              </div>

              <div className="ax-float">
                <input
                  type="text"
                  className="ax-float__input"
                  value={siteDetails?.dept_name || '—'}
                  readOnly
                  disabled
                />
                <label className="ax-float__label floating">Department</label>
              </div>

              <div className="ax-float">
                <input
                  type="text"
                  className="ax-float__input"
                  value={siteDetails?.site_name || '—'}
                  readOnly
                  disabled
                />
                <label className="ax-float__label floating">Site Name</label>
              </div>

              <div className="ax-float">
                <input
                  type="text"
                  className="ax-float__input"
                  value={siteDetails?.location || siteDetails?.address || '—'}
                  readOnly
                  disabled
                />
                <label className="ax-float__label floating">Location / Address</label>
              </div>

              <div className="ax-float">
                <input
                  type="text"
                  className="ax-float__input"
                  value={siteDetails?.ca_no || '—'}
                  readOnly
                  disabled
                />
                <label className="ax-float__label floating">CA Number</label>
              </div>

              <div className="ax-float">
                <input
                  type="text"
                  className="ax-float__input"
                  value={siteDetails?.plant_sc ? `${siteDetails.plant_sc} kW` : '—'}
                  readOnly
                  disabled
                />
                <label className="ax-float__label floating">Sanction Load</label>
              </div>

              <div className="ax-float">
                <input
                  type="text"
                  className="ax-float__input"
                  value={currentSiteVendorId > 0 ? (currentSiteVendorName ? `${currentSiteVendorName} (ID: #${currentSiteVendorId})` : `Vendor #${currentSiteVendorId}`) : '—'}
                  readOnly
                  disabled
                />
                <label className="ax-float__label floating">Assigned Vendor (inst_vendor)</label>
              </div>
            </div>
          </div>

          <hr className="swp-section-divider" />

          {/* Section 3: Contact & Technical Feasibility Details */}
          <div ref={sec3} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
                  3. Contact & Technical Feasibility <span style={{ color: '#ef4444' }}>*</span>
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Enter site location contacts, electrical specifications, and rooftop availability
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 16 }}>
              <FloatingInput
                label="Site Address (details)"
                name="site_address"
                value={siteAddress}
                onChange={(e) => setSiteAddress(e.target.value)}
                required
                disabled={loading}
                placeholder="Full address of the site"
              />
              <FloatingInput
                label="Nearest Landmark"
                name="landmark"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                required
                disabled={loading}
                placeholder="Nearby recognizable landmark"
              />
              <FloatingInput
                label="Agency Contact Person Name"
                name="agency_person_name"
                value={agencyPersonName}
                onChange={(e) => setAgencyPersonName(e.target.value)}
                required
                disabled={loading}
                placeholder="Site executive name"
              />
              <FloatingInput
                label="Agency Contact Number"
                name="agency_person_contact"
                value={agencyPersonContact}
                onChange={(e) => setAgencyPersonContact(e.target.value)}
                required
                disabled={loading}
                placeholder="10-digit mobile number"
              />
              <FloatingInput
                label="Nodal Person Name"
                name="nodal_person"
                value={nodalPerson}
                onChange={(e) => setNodalPerson(e.target.value)}
                required
                disabled={loading}
                placeholder="Government / Agency nodal officer"
              />
              <FloatingInput
                label="Nodal Contact Number"
                name="contact_nodal"
                value={contactNodal}
                onChange={(e) => setContactNodal(e.target.value)}
                required
                disabled={loading}
                placeholder="Nodal officer contact"
              />
              <FloatingInput
                label="GPS Latitude"
                name="latitude"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                required
                disabled={loading}
                placeholder="e.g. 32.726600"
              />
              <FloatingInput
                label="GPS Longitude"
                name="longitude"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                required
                disabled={loading}
                placeholder="e.g. 74.857000"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              <div className="ax-float">
                <select
                  id="jammu_resco_load_type"
                  className="ax-float__input"
                  value={loadType}
                  onChange={(e) => setLoadType(e.target.value)}
                  disabled={loading}
                  required
                >
                  <option value="AC">AC</option>
                  <option value="DC">DC</option>
                </select>
                <label htmlFor="jammu_resco_load_type" className="ax-float__label floating">
                  Load Type <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              <div className="ax-float">
                <select
                  id="jammu_resco_conn_phase"
                  className="ax-float__input"
                  value={connectionPhase}
                  onChange={(e) => setConnectionPhase(e.target.value)}
                  disabled={loading}
                  required
                >
                  <option value="3 Phase">3 Phase</option>
                  <option value="1 Phase">1 Phase</option>
                </select>
                <label htmlFor="jammu_resco_conn_phase" className="ax-float__label floating">
                  Connection Phase <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              <div className="ax-float">
                <select
                  id="jammu_resco_meter_conn"
                  className="ax-float__input"
                  value={meterConnection}
                  onChange={(e) => setMeterConnection(e.target.value)}
                  disabled={loading}
                  required
                >
                  <option value="LT">LT</option>
                  <option value="HT">HT</option>
                </select>
                <label htmlFor="jammu_resco_meter_conn" className="ax-float__label floating">
                  Meter Connection <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              <FloatingInput
                label="Meter Number"
                name="meter_number"
                value={meterNumber}
                onChange={(e) => setMeterNumber(e.target.value)}
                required
                disabled={loading}
                placeholder="Electricity meter serial number"
              />

              <div className="ax-float">
                <select
                  id="jammu_resco_meter_type"
                  className="ax-float__input"
                  value={meterType}
                  onChange={(e) => setMeterType(e.target.value)}
                  disabled={loading}
                  required
                >
                  <option value="Smart Meter">Smart Meter</option>
                  <option value="Electronic Meter">Electronic Meter</option>
                  <option value="Net Meter">Net Meter</option>
                </select>
                <label htmlFor="jammu_resco_meter_type" className="ax-float__label floating">
                  Meter Type <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              <FloatingInput
                label="Sanction Load (kW)"
                name="sanction_load"
                value={sanctionLoad}
                onChange={(e) => setSanctionLoad(e.target.value)}
                required
                disabled={loading}
                placeholder="e.g. 10.0"
              />

              <FloatingInput
                label="Connected Load (kW)"
                name="connected_load"
                value={connectedLoad}
                onChange={(e) => setConnectedLoad(e.target.value)}
                required
                disabled={loading}
                placeholder="e.g. 8.5"
              />

              <div className="ax-float">
                <select
                  id="jammu_resco_grid_power"
                  className="ax-float__input"
                  value={gridPower}
                  onChange={(e) => setGridPower(e.target.value)}
                  disabled={loading}
                  required
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
                <label htmlFor="jammu_resco_grid_power" className="ax-float__label floating">
                  Grid Power Available <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              <div className="ax-float">
                <select
                  id="jammu_resco_all_3_phase"
                  className="ax-float__input"
                  value={all3PhaseLtdb}
                  onChange={(e) => setAll3PhaseLtdb(e.target.value)}
                  disabled={loading}
                  required
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
                <label htmlFor="jammu_resco_all_3_phase" className="ax-float__label floating">
                  All 3 Phase LTDB <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              <div className="ax-float">
                <select
                  id="jammu_resco_missing_phase"
                  className="ax-float__input"
                  value={missingPhase}
                  onChange={(e) => setMissingPhase(e.target.value)}
                  disabled={loading}
                  required
                >
                  <option value="None">None</option>
                  <option value="R">R Phase</option>
                  <option value="Y">Y Phase</option>
                  <option value="B">B Phase</option>
                </select>
                <label htmlFor="jammu_resco_missing_phase" className="ax-float__label floating">
                  Missing Phase <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              <div className="ax-float">
                <select
                  id="jammu_resco_ltdb_present"
                  className="ax-float__input"
                  value={ltdbPresent}
                  onChange={(e) => setLtdbPresent(e.target.value)}
                  disabled={loading}
                  required
                >
                  <option value="Present">Present</option>
                  <option value="Not Present">Not Present</option>
                </select>
                <label htmlFor="jammu_resco_ltdb_present" className="ax-float__label floating">
                  LTDB Present <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              <div className="ax-float">
                <select
                  id="jammu_resco_roof_condition"
                  className="ax-float__input"
                  value={roofCondition}
                  onChange={(e) => setRoofCondition(e.target.value)}
                  disabled={loading}
                  required
                >
                  <option value="Feasible">Feasible</option>
                  <option value="Not Feasible">Not Feasible</option>
                  <option value="Rework Required">Rework Required</option>
                </select>
                <label htmlFor="jammu_resco_roof_condition" className="ax-float__label floating">
                  Roof Condition <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              <FloatingInput
                label="Total Area of Roof (sq.ft)"
                name="area_roof"
                value={areaRoof}
                onChange={(e) => setAreaRoof(e.target.value)}
                required
                disabled={loading}
                placeholder="e.g. 2500"
              />

              <FloatingInput
                label="Free Space for Solar (sq.ft)"
                name="free_space_solar"
                value={freeSpaceSolar}
                onChange={(e) => setFreeSpaceSolar(e.target.value)}
                required
                disabled={loading}
                placeholder="e.g. 1800"
              />

              <FloatingInput
                label="Free Space for Inverter (sq.ft)"
                name="free_space_inverter"
                value={freeSpaceInverter}
                onChange={(e) => setFreeSpaceInverter(e.target.value)}
                required
                disabled={loading}
                placeholder="e.g. 80"
              />

              <div className="ax-float">
                <select
                  id="jammu_resco_earth_pit"
                  className="ax-float__input"
                  value={earthPit}
                  onChange={(e) => setEarthPit(e.target.value)}
                  disabled={loading}
                  required
                >
                  <option value="Ok">Ok</option>
                  <option value="Needs Work">Needs Work</option>
                  <option value="Not Available">Not Available</option>
                </select>
                <label htmlFor="jammu_resco_earth_pit" className="ax-float__label floating">
                  Earth Pit Status <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              <div className="ax-float">
                <select
                  id="jammu_resco_site_feasible"
                  className="ax-float__input"
                  value={siteFeasible}
                  onChange={(e) => setSiteFeasible(e.target.value)}
                  disabled={loading}
                  required
                >
                  <option value="Feasible">Feasible</option>
                  <option value="Not Feasible">Not Feasible</option>
                </select>
                <label htmlFor="jammu_resco_site_feasible" className="ax-float__label floating">
                  Site Feasibility <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              <FloatingInput
                label="Survey Remarks"
                name="survey_remarks"
                value={surveyRemarks}
                onChange={(e) => setSurveyRemarks(e.target.value)}
                required
                disabled={loading}
                placeholder="Site feasibility observation notes"
              />
            </div>
          </div>

          <hr className="swp-section-divider" />

          {/* Section 4: Civil & Structural */}
          <div ref={sec4} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
                  4. Civil & Structural Assessment <span style={{ color: '#ef4444' }}>*</span>
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Structural integrity, building age, rooftop height, access pathways, and water supply
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              <FloatingInput
                label="Building Age (Years)"
                name="building_age"
                value={buildingAge}
                onChange={(e) => setBuildingAge(e.target.value)}
                required
                disabled={loading}
                placeholder="e.g. 5"
              />

              <div className="ax-float">
                <select
                  id="jammu_resco_roof_access"
                  className="ax-float__input"
                  value={roofAccess}
                  onChange={(e) => setRoofAccess(e.target.value)}
                  disabled={loading}
                  required
                >
                  <option value="Available">Available (Stairs)</option>
                  <option value="Ladder Required">Ladder Required</option>
                  <option value="Not Available">Not Available</option>
                </select>
                <label htmlFor="jammu_resco_roof_access" className="ax-float__label floating">
                  Roof Access <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              <FloatingInput
                label="Rooftop Height (m)"
                name="rooftop_height"
                value={rooftopHeight}
                onChange={(e) => setRooftopHeight(e.target.value)}
                required
                disabled={loading}
                placeholder="e.g. 12"
              />

              <FloatingInput
                label="Parapet Height (m)"
                name="parapet_height"
                value={parapetHeight}
                onChange={(e) => setParapetHeight(e.target.value)}
                required
                disabled={loading}
                placeholder="e.g. 1.2"
              />

              <div className="ax-float">
                <select
                  id="jammu_resco_floors_number"
                  className="ax-float__input"
                  value={floorsNumber}
                  onChange={(e) => setFloorsNumber(e.target.value)}
                  disabled={loading}
                  required
                >
                  <option value="G">Ground Floor (G)</option>
                  <option value="G+1">G + 1</option>
                  <option value="G+2">G + 2</option>
                  <option value="G+3">G + 3</option>
                  <option value="G+4+">G + 4 or Higher</option>
                </select>
                <label htmlFor="jammu_resco_floors_number" className="ax-float__label floating">
                  Floors Number <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              <div className="ax-float">
                <select
                  id="jammu_resco_water_source"
                  className="ax-float__input"
                  value={waterSource}
                  onChange={(e) => setWaterSource(e.target.value)}
                  disabled={loading}
                  required
                >
                  <option value="Available">Available</option>
                  <option value="Not Available">Not Available</option>
                </select>
                <label htmlFor="jammu_resco_water_source" className="ax-float__label floating">
                  Water Source (Cleaning) <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              <div className="ax-float">
                <select
                  id="jammu_resco_site_access"
                  className="ax-float__input"
                  value={siteAccess}
                  onChange={(e) => setSiteAccess(e.target.value)}
                  disabled={loading}
                  required
                >
                  <option value="Good">Good (Wide Road)</option>
                  <option value="Average">Average (Narrow Road)</option>
                  <option value="Poor">Poor (Inaccessible by truck)</option>
                </select>
                <label htmlFor="jammu_resco_site_access" className="ax-float__label floating">
                  Site Access Road <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              <FloatingInput
                label="Distance from Road (m)"
                name="site_distance"
                value={siteDistance}
                onChange={(e) => setSiteDistance(e.target.value)}
                disabled={loading}
                placeholder="e.g. 15"
              />
            </div>
          </div>

          <hr className="swp-section-divider" />

          {/* Section 5: Survey Photos & PDF Document */}
          <div ref={sec5} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
                  5. Survey Photos & Document <span style={{ color: '#ef4444' }}>*</span>
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Attach clear geo-tagged site images (JPG, PNG) and optional signed feasibility survey PDF
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              <UploadDropzone
                id="resco_survey_building_image"
                label="Building Overview Image"
                required
                accept=".jpg,.jpeg,.png"
                helperText="JPG or PNG (Max 5 MB)"
                disabled={loading}
                file={buildingImage}
                preview={buildingImagePreview}
                onSelect={(selected) => {
                  setBuildingImage(selected);
                  setBuildingImagePreview(URL.createObjectURL(selected));
                }}
                onRemove={() => {
                  setBuildingImage(null);
                  if (buildingImagePreview) URL.revokeObjectURL(buildingImagePreview);
                  setBuildingImagePreview(undefined);
                }}
              />

              <UploadDropzone
                id="resco_survey_roof_image"
                label="Roof Area Image"
                required
                accept=".jpg,.jpeg,.png"
                helperText="JPG or PNG (Max 5 MB)"
                disabled={loading}
                file={roofImage}
                preview={roofImagePreview}
                onSelect={(selected) => {
                  setRoofImage(selected);
                  setRoofImagePreview(URL.createObjectURL(selected));
                }}
                onRemove={() => {
                  setRoofImage(null);
                  if (roofImagePreview) URL.revokeObjectURL(roofImagePreview);
                  setRoofImagePreview(undefined);
                }}
              />

              <UploadDropzone
                id="resco_survey_control_room_image"
                label="Control Room / Inverter Space Image"
                required
                accept=".jpg,.jpeg,.png"
                helperText="JPG or PNG (Max 5 MB)"
                disabled={loading}
                file={controlRoomImage}
                preview={controlRoomImagePreview}
                onSelect={(selected) => {
                  setControlRoomImage(selected);
                  setControlRoomImagePreview(URL.createObjectURL(selected));
                }}
                onRemove={() => {
                  setControlRoomImage(null);
                  if (controlRoomImagePreview) URL.revokeObjectURL(controlRoomImagePreview);
                  setControlRoomImagePreview(undefined);
                }}
              />

              <UploadDropzone
                id="resco_survey_meter_image"
                label="Electricity Meter / LTDB Image"
                required={false}
                accept=".jpg,.jpeg,.png"
                helperText="JPG or PNG (Max 5 MB)"
                disabled={loading}
                file={meterImage}
                preview={meterImagePreview}
                onSelect={(selected) => {
                  setMeterImage(selected);
                  setMeterImagePreview(URL.createObjectURL(selected));
                }}
                onRemove={() => {
                  setMeterImage(null);
                  if (meterImagePreview) URL.revokeObjectURL(meterImagePreview);
                  setMeterImagePreview(undefined);
                }}
              />

              <UploadDropzone
                id="resco_survey_other_image"
                label="Other Site Image"
                required={false}
                accept=".jpg,.jpeg,.png"
                helperText="JPG or PNG (Max 5 MB)"
                disabled={loading}
                file={otherImage}
                preview={otherImagePreview}
                onSelect={(selected) => {
                  setOtherImage(selected);
                  setOtherImagePreview(URL.createObjectURL(selected));
                }}
                onRemove={() => {
                  setOtherImage(null);
                  if (otherImagePreview) URL.revokeObjectURL(otherImagePreview);
                  setOtherImagePreview(undefined);
                }}
              />

              <UploadDropzone
                id="resco_survey_pdf_file"
                label="Feasibility Survey PDF Document"
                required={false}
                accept=".pdf"
                helperText="PDF document (Max 5 MB)"
                disabled={loading}
                file={pdfFile}
                onSelect={(selected) => setPdfFile(selected)}
                onRemove={() => setPdfFile(null)}
              />
            </div>
          </div>

          <div style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <Link to="/vendor-management/jammu/installation/resco/view-assign-installation" className="ax-btn ax-btn--secondary">
              Cancel
            </Link>
            <button
              type="submit"
              className="ax-btn ax-btn--primary"
              disabled={loading || !selectedSiteId || !selectedVendorId || !buildingImage || !roofImage || !controlRoomImage}
              style={{ minWidth: 230, fontWeight: 700 }}
            >
              {loading ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <span className="ax-spinner" /> Submitting Report...
                </span>
              ) : (
                'Submit Feasibility Report →'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default ViewAssignVendorInstallation;
