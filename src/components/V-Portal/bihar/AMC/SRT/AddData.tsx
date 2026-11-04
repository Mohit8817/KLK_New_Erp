import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  biharAmcService,
  type BiharSrtAmcSiteOption,
  type BiharSrtSiteDetail,
} from '../../bihar-services/biharAmcService';

// Unified Single-Card Layout CSS with Floating Labels (Exact Bihar Complaints SSL Design)
const SINGLE_CARD_FORM_CSS = `
.bihar-single-card-form .ax-card {
  border: 1px solid var(--ax-border);
  border-radius: var(--ax-radius-xl);
  background: var(--ax-surface-solid);
  box-shadow: var(--ax-shadow-sm);
  overflow: hidden;
}
.bihar-single-card-form .ax-card__header {
  padding: var(--ax-space-5) var(--ax-space-6);
  border-bottom: 1px solid var(--ax-border-subtle);
  background: var(--ax-surface-subtle);
  display: flex;
  flex-direction: column;
  gap: var(--ax-space-4);
}
.bihar-single-card-form .ax-card__body {
  padding: var(--ax-space-6);
}

.bihar-section-pills {
  display: flex;
  gap: var(--ax-space-2);
  flex-wrap: wrap;
  padding-top: var(--ax-space-1);
}
.bihar-section-pill-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: var(--ax-radius-pill);
  font-size: var(--ax-text-xs);
  font-weight: 600;
  border: 1px solid var(--ax-border);
  background: var(--ax-surface-solid);
  color: var(--ax-text-muted);
  cursor: pointer;
  transition: all var(--ax-motion-fast) var(--ax-ease-standard);
}
.bihar-section-pill-btn:hover {
  background: var(--ax-surface-hover);
  color: var(--ax-text-strong);
  border-color: var(--ax-border-strong);
}
.bihar-section-pill-btn .pill-num {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--ax-surface-subtle);
  color: var(--ax-text-subtle);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
}

.bihar-section-block {
  padding-top: var(--ax-space-2);
}
.bihar-section-block + .bihar-section-block {
  margin-top: var(--ax-space-8);
  padding-top: var(--ax-space-6);
  border-top: 1px solid var(--ax-border-subtle);
}
.bihar-section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: var(--ax-space-2);
  margin-bottom: var(--ax-space-5);
  padding-bottom: var(--ax-space-3);
  border-bottom: 1px solid var(--ax-border-subtle);
}
.bihar-section-title-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ax-float {
  position: relative;
  width: 100%;
}
.ax-float__input {
  width: 100%;
  height: 46px;
  padding: 12px 14px 4px 14px;
  font-size: var(--ax-text-sm);
  background: var(--ax-surface-solid);
  border: 1px solid var(--ax-border);
  border-radius: var(--ax-radius-md);
  color: var(--ax-text);
  outline: none;
  transition: border-color var(--ax-motion-fast) var(--ax-ease-standard), box-shadow var(--ax-motion-fast) var(--ax-ease-standard);
}
.ax-float__input::placeholder {
  color: transparent;
}
.ax-float__input:focus {
  border-color: var(--ax-accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--ax-accent) 20%, transparent);
}
.ax-float__input[readonly] {
  background: var(--ax-surface-subtle);
}
.ax-float__input:disabled {
  opacity: .7;
  cursor: not-allowed;
  background: var(--ax-surface-subtle);
}

.ax-float__label {
  position: absolute;
  inset-inline-start: 12px;
  top: 50%;
  transform: translateY(-50%);
  margin: 0;
  padding: 0 4px;
  font-size: var(--ax-text-sm);
  color: var(--ax-text-subtle);
  background: var(--ax-surface-solid);
  border-radius: var(--ax-radius-xs);
  pointer-events: none;
  transition: top var(--ax-motion-fast) var(--ax-ease-standard), font-size var(--ax-motion-fast) var(--ax-ease-standard), color var(--ax-motion-fast) var(--ax-ease-standard);
  z-index: 2;
  white-space: nowrap;
  max-width: calc(100% - 24px);
  overflow: hidden;
  text-overflow: ellipsis;
}

.ax-float__input:focus + .ax-float__label,
.ax-float__input:not(:placeholder-shown) + .ax-float__label,
.ax-float--select .ax-float__label,
.ax-float--date .ax-float__label {
  top: 0;
  transform: translateY(-50%);
  font-size: var(--ax-text-2xs);
  font-weight: 500;
  color: var(--ax-text-muted);
}
.ax-float__input:focus + .ax-float__label {
  color: var(--ax-accent);
}

.ax-float__input.is-invalid {
  border-color: var(--ax-danger-500) !important;
}
.ax-float__input.is-invalid:focus {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--ax-danger-500) 24%, transparent) !important;
}
.ax-float__input.is-invalid + .ax-float__label {
  color: var(--ax-danger-500) !important;
}

.ax-float--area .ax-float__input {
  height: auto;
  min-height: 84px;
  padding-top: 18px;
  resize: vertical;
}
.ax-float--area .ax-float__label {
  top: 18px;
  transform: none;
}
.ax-float--area .ax-float__input:focus + .ax-float__label,
.ax-float--area .ax-float__input:not(:placeholder-shown) + .ax-float__label {
  top: 0;
  transform: translateY(-50%);
}

.ax-field-feedback {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  font-size: var(--ax-text-2xs);
  min-height: 16px;
}
.ax-field-feedback--error {
  color: var(--ax-danger-500);
}

.bihar-form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--ax-space-4);
}
@media (min-width: 1024px) {
  .bihar-form-grid--3col {
    grid-template-columns: repeat(3, 1fr);
  }
  .bihar-form-grid--4col {
    grid-template-columns: repeat(4, 1fr);
  }
}
.bihar-form-col-span-full {
  grid-column: 1 / -1;
}

.bihar-info-card {
  background: var(--ax-surface-subtle);
  border: 1px solid var(--ax-border);
  border-radius: var(--ax-radius-lg);
  padding: var(--ax-space-4);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--ax-space-3);
  font-size: var(--ax-text-xs);
}
.bihar-info-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.bihar-info-label {
  color: var(--ax-text-muted);
  font-weight: 500;
  font-size: 11px;
}
.bihar-info-value {
  color: var(--ax-text-strong);
  font-weight: 600;
  word-break: break-word;
}

.bihar-form-sticky-bar {
  position: sticky;
  bottom: var(--ax-space-4);
  z-index: 30;
  margin-top: var(--ax-space-6);
  padding: var(--ax-space-3) var(--ax-space-5);
  background: var(--ax-surface-solid);
  border: 1px solid var(--ax-border);
  border-radius: var(--ax-radius-xl);
  box-shadow: var(--ax-shadow-lg);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--ax-space-3);
  backdrop-filter: blur(12px);
}

@keyframes bihar-spin {
  to { transform: rotate(360deg); }
}
`;

const SECTIONS = [
  { id: 'sec-select', num: '1', title: 'Select AMC & Site' },
  { id: 'sec-site-info', num: '2', title: 'Site Information' },
  { id: 'sec-amc-form', num: '3', title: 'Fill this Form' },
  { id: 'sec-photos', num: '4', title: 'AMC Photographs' },
  { id: 'sec-complaint', num: '5', title: 'Raised Complaint' },
];

export function Bihar_AMC_SRT_AddData() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryAmc = searchParams.get('amc') || '';
  const querySiteId = searchParams.get('site_id') || searchParams.get('id') || '';

  // Dropdown states
  const [amcList, setAmcList] = useState<{ amc: string }[]>([]);
  const [selectedAmc, setSelectedAmc] = useState(queryAmc);
  const [siteOptions, setSiteOptions] = useState<BiharSrtAmcSiteOption[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState(querySiteId);
  const [siteDetail, setSiteDetail] = useState<BiharSrtSiteDetail | null>(null);

  // Loaders
  const [loadingAmcList, setLoadingAmcList] = useState(false);
  const [loadingSites, setLoadingSites] = useState(false);
  const [loadingSiteDetail, setLoadingSiteDetail] = useState(false);
  const [fetchingLoc, setFetchingLoc] = useState(false);

  // Form input states
  const [formData, setFormData] = useState({
    amc_beneficiary_name: '',
    amc_beneficiary_contact: '',
    amc_latitude: '',
    amc_longitude: '',
    amc_remark: '',
    raised_complaint: false,
    complaint: '',
    beneficiary_contact: '',
  });

  // Images state (1 to 10)
  const [images, setImages] = useState<{ [key: string]: File | null }>({
    amc_image1: null,
    amc_image2: null,
    amc_image3: null,
    amc_image4: null,
    amc_image5: null,
    amc_image6: null,
    amc_image7: null,
    amc_image8: null,
    amc_image9: null,
    amc_image10: null,
  });

  // Messages & Errors
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const clearError = (field: string) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  // 1. Fetch AMC list: GET /bihar/srt/amc/add-data
  useEffect(() => {
    let active = true;
    (async () => {
      setLoadingAmcList(true);
      try {
        const list = await biharAmcService.getSrtAmcList();
        if (active) setAmcList(list);
      } catch (err) {
        console.warn('Failed to load AMC list:', err);
      } finally {
        if (active) setLoadingAmcList(false);
      }
    })();
    return () => { active = false; };
  }, []);

  // 2. Fetch sites when AMC is selected: GET /bihar/srt/amc/fetch-site-name?amc=...
  useEffect(() => {
    if (!selectedAmc) {
      setSiteOptions([]);
      return;
    }
    let active = true;
    (async () => {
      setLoadingSites(true);
      try {
        const sites = await biharAmcService.getSrtSitesByAmc(selectedAmc);
        if (active) {
          setSiteOptions(sites);
          if (querySiteId && sites.some((s) => String(s.site_id) === querySiteId || String(s.id) === querySiteId)) {
            setSelectedSiteId(querySiteId);
          }
        }
      } catch (err) {
        console.warn('Failed to load sites for AMC:', err);
      } finally {
        if (active) setLoadingSites(false);
      }
    })();
    return () => { active = false; };
  }, [selectedAmc, querySiteId]);

  // 3. Fetch site details when site is selected: GET /bihar/srt/amc/fetch-site-details?id=...
  useEffect(() => {
    if (!selectedSiteId) {
      setSiteDetail(null);
      return;
    }
    let active = true;
    (async () => {
      setLoadingSiteDetail(true);
      try {
        const detail = await biharAmcService.getSrtSiteDetails(selectedSiteId);
        if (active && detail) {
          setSiteDetail(detail);
          // Autofill beneficiary info if present in site data
          setFormData((prev) => ({
            ...prev,
            amc_beneficiary_name: prev.amc_beneficiary_name || detail.contact_person || '',
            amc_beneficiary_contact: prev.amc_beneficiary_contact || (detail.contact_number ? String(detail.contact_number).slice(-10) : ''),
          }));
        }
      } catch (err) {
        console.warn('Failed to load site details:', err);
      } finally {
        if (active) setLoadingSiteDetail(false);
      }
    })();
    return () => { active = false; };
  }, [selectedSiteId]);

  // GPS Geolocation
  const handleFetchLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setFetchingLoc(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          amc_latitude: pos.coords.latitude.toFixed(6),
          amc_longitude: pos.coords.longitude.toFixed(6),
        }));
        clearError('amc_latitude');
        clearError('amc_longitude');
        setFetchingLoc(false);
      },
      (err) => {
        console.error('Geo error:', err);
        setFetchingLoc(false);
        alert(`Location error: ${err.message || 'Unable to fetch current coordinates'}`);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Validation
  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!selectedAmc) errs.selectedAmc = 'Please select AMC Type.';
    if (!selectedSiteId) errs.selectedSiteId = 'Please select Site.';
    if (!formData.amc_beneficiary_name.trim()) errs.amc_beneficiary_name = 'Beneficiary Name is required.';
    if (!formData.amc_beneficiary_contact.trim() || !/^\d{10}$/.test(formData.amc_beneficiary_contact.trim())) {
      errs.amc_beneficiary_contact = 'Beneficiary Contact must be exactly 10 digits.';
    }
    if (!formData.amc_latitude.trim()) errs.amc_latitude = 'AMC Latitude is required.';
    if (!formData.amc_longitude.trim()) errs.amc_longitude = 'AMC Longitude is required.';
    if (!formData.amc_remark.trim()) errs.amc_remark = 'Remarks are required.';

    // Images 1-4 are mandatory per API documentation
    if (!images.amc_image1) errs.amc_image1 = 'AMC Image 1 is required.';
    if (!images.amc_image2) errs.amc_image2 = 'AMC Image 2 is required.';
    if (!images.amc_image3) errs.amc_image3 = 'AMC Image 3 is required.';
    if (!images.amc_image4) errs.amc_image4 = 'AMC Image 4 is required.';

    if (formData.raised_complaint) {
      if (!formData.complaint.trim()) errs.complaint = 'Complaint description is required when raising a complaint.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Submit Handler: POST /bihar/srt/amc/update-site
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    if (!validate()) {
      setErrorMsg('Please resolve all highlighted errors before submitting.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('id', String(selectedSiteId));
      fd.append('amc', selectedAmc);
      fd.append('amc_beneficiary_name', formData.amc_beneficiary_name.trim());
      fd.append('amc_beneficiary_contact', formData.amc_beneficiary_contact.trim());
      fd.append('amc_latitude', formData.amc_latitude.trim());
      fd.append('amc_longitude', formData.amc_longitude.trim());
      fd.append('amc_remark', formData.amc_remark.trim());

      // Append images
      for (let i = 1; i <= 10; i++) {
        const file = images[`amc_image${i}`];
        if (file) {
          fd.append(`amc_image${i}`, file);
        }
      }

      if (formData.raised_complaint) {
        fd.append('raised_complaint', '1');
        fd.append('complaint', formData.complaint.trim());
        if (formData.beneficiary_contact) {
          fd.append('beneficiary_contact', formData.beneficiary_contact.trim());
        }
      }

      const res = await biharAmcService.updateSrtSite(fd);
      setSuccessMsg(res.message || 'Update SRT AMC Successfully');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => {
        navigate('/v/bihar-view-srt-amc');
      }, 1500);
    } catch (err: any) {
      console.error('SRT AMC submission error:', err);
      setErrorMsg(err.message || 'Failed to submit SRT AMC record.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  const T = SECTIONS.length;

  return (
    <div className="bihar-single-card-form">
      <style>{SINGLE_CARD_FORM_CSS}</style>

      <PageHead
        title="Bihar SRT AMC Site Information"
        subtitle={
          <span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>
            Welcome to, Updated SRT AMC Site Details
          </span>
        }
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Bihar' },
          { label: 'AMC' },
          { label: 'SRT', href: '/v/bihar-view-srt-amc' },
          { label: 'Add Data' },
        ]}
        actions={
          <Link to="/v/bihar-view-srt-amc" className="ax-btn ax-btn--secondary ax-btn--pill">
            <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l14 0" /><path d="M5 12l6 6" /><path d="M5 12l6 -6" /></svg>
            <span className="ax-btn__label">View AMC Data</span>
          </Link>
        }
      />

      {/* Success Alert */}
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

      {/* Error Alert */}
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

      <form onSubmit={handleSubmit} noValidate>
        <div className="ax-card">
          <div className="ax-card__header">
            <div>
              <span className="ax-card__eyebrow">Bihar Rooftop Solar (SRT)</span>
              <h2 className="ax-card__title" style={{ margin: 0 }}>
                Bihar SRT AMC Site Information
              </h2>
              <p className="ax-card__subtitle" style={{ margin: '4px 0 0' }}>
                Select AMC Type and Site to populate technical details, then record maintenance visit information.
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
            {/* Section 1: Selection */}
            <div id="sec-select" className="bihar-section-block">
              <SectionHeader num="1" total={T} title="Select AMC & Site" desc="Choose the AMC cycle and assigned site ID." />
              <div className="bihar-form-grid">
                <FloatingSelect
                  id="srt-amc-type"
                  label="Select Amc Type"
                  required
                  placeholder={loadingAmcList ? 'Loading AMC list...' : '-- Select AMC Type --'}
                  value={selectedAmc}
                  options={amcList.map((a) => ({ value: a.amc, label: a.amc }))}
                  disabled={loadingAmcList}
                  onChange={(val) => {
                    setSelectedAmc(val);
                    setSelectedSiteId('');
                    setSiteDetail(null);
                    clearError('selectedAmc');
                  }}
                  error={errors.selectedAmc}
                />

                <FloatingSelect
                  id="srt-site-select"
                  label="Select Site"
                  required
                  placeholder={
                    !selectedAmc
                      ? 'Select AMC Type First'
                      : loadingSites
                      ? 'Loading sites...'
                      : siteOptions.length === 0
                      ? 'No sites available for this AMC'
                      : '-- Select Site --'
                  }
                  value={selectedSiteId}
                  options={siteOptions.map((s) => ({
                    value: String(s.site_id || s.id),
                    label: `Site #${s.site_id || s.id} (${s.amc})`,
                  }))}
                  disabled={!selectedAmc || loadingSites || siteOptions.length === 0}
                  onChange={(val) => {
                    setSelectedSiteId(val);
                    clearError('selectedSiteId');
                  }}
                  error={errors.selectedSiteId}
                />
              </div>
            </div>

            {/* Section 2: Site Information */}
            <div id="sec-site-info" className="bihar-section-block">
              <SectionHeader num="2" total={T} title="Site Information" desc="Read-only site metadata fetched from master records." />
              {loadingSiteDetail ? (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--ax-text-muted)' }}>
                  <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading site information…
                </div>
              ) : siteDetail ? (
                <div className="bihar-info-card">
                  <InfoItem label="Discom" value={siteDetail.discom} />
                  <InfoItem label="State" value={siteDetail.state || 'Bihar'} />
                  <InfoItem label="District" value={siteDetail.district} />
                  <InfoItem label="Department Name" value={siteDetail.dept_name} />
                  <InfoItem label="Site Name" value={siteDetail.site_name} />
                  <InfoItem label="Location" value={siteDetail.location} />
                  <InfoItem label="Firm Name" value={siteDetail.firm_name} />
                  <InfoItem label="CA No." value={siteDetail.ca_no} />
                  <InfoItem label="Sanction Load" value={siteDetail.sanction_load} />
                  <InfoItem label="Plant SC" value={siteDetail.plant_sc} />
                  <InfoItem label="WO No." value={siteDetail.wo_no} />
                  <InfoItem label="Phase" value={siteDetail.phase} />
                  <InfoItem label="Vendor" value={siteDetail.vendor} />
                  <InfoItem label="Date" value={siteDetail.date} />
                  <InfoItem label="Material Invoice Date" value={siteDetail.material_i_date} />
                  <InfoItem label="Material Bill Invoice" value={siteDetail.mb_invoice || siteDetail.material_bill_invoice} />
                  <InfoItem label="Installation Status" value={siteDetail.installation_status} />
                </div>
              ) : (
                <div style={{ padding: 20, textAlign: 'center', background: 'var(--ax-surface-subtle)', borderRadius: 8, color: 'var(--ax-text-muted)', fontSize: 13 }}>
                  Please select an AMC and Site above to preview site details.
                </div>
              )}
            </div>

            {/* Section 3: Fill this Form */}
            <div id="sec-amc-form" className="bihar-section-block">
              <SectionHeader
                num="3"
                total={T}
                title="Fill this Form"
                desc="The field labels marked with * are required fields."
              />
              <div className="bihar-form-grid bihar-form-grid--3col">
                <FloatingInput
                  id="srt-ben-name"
                  label="Beneficiary Name"
                  required
                  placeholder="Enter Beneficiary Name"
                  value={formData.amc_beneficiary_name}
                  onChange={(val) => {
                    setFormData((prev) => ({ ...prev, amc_beneficiary_name: val }));
                    clearError('amc_beneficiary_name');
                  }}
                  error={errors.amc_beneficiary_name}
                />

                <FloatingInput
                  id="srt-ben-contact"
                  label="Beneficiary Contact (10 Digits)"
                  required
                  type="tel"
                  maxLength={10}
                  placeholder="10-digit mobile number"
                  value={formData.amc_beneficiary_contact}
                  onChange={(val) => {
                    const clean = val.replace(/\D/g, '').slice(0, 10);
                    setFormData((prev) => ({ ...prev, amc_beneficiary_contact: clean }));
                    clearError('amc_beneficiary_contact');
                  }}
                  error={errors.amc_beneficiary_contact}
                />

                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <FloatingInput
                      id="srt-lat"
                      label="Amc Latitude"
                      required
                      placeholder="e.g. 25.594095"
                      value={formData.amc_latitude}
                      onChange={(val) => {
                        setFormData((prev) => ({ ...prev, amc_latitude: val }));
                        clearError('amc_latitude');
                      }}
                      error={errors.amc_latitude}
                    />
                  </div>
                  <button
                    type="button"
                    className="ax-btn ax-btn--secondary"
                    style={{ height: 46, whiteSpace: 'nowrap', padding: '0 12px' }}
                    onClick={handleFetchLocation}
                    disabled={fetchingLoc}
                    title="Get current GPS coordinates"
                  >
                    {fetchingLoc ? (
                      <span className="ax-spinner" style={{ width: 14, height: 14 }} />
                    ) : (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/></svg>
                    )}
                    <span className="ax-btn__label" style={{ fontSize: 11 }}>GPS</span>
                  </button>
                </div>

                <FloatingInput
                  id="srt-lng"
                  label="Amc Longitude"
                  required
                  placeholder="e.g. 85.137566"
                  value={formData.amc_longitude}
                  onChange={(val) => {
                    setFormData((prev) => ({ ...prev, amc_longitude: val }));
                    clearError('amc_longitude');
                  }}
                  error={errors.amc_longitude}
                />

                <div className="bihar-form-col-span-full">
                  <FloatingTextarea
                    id="srt-remarks"
                    label="Remarks *"
                    required
                    placeholder="Enter Remarks..."
                    value={formData.amc_remark}
                    rows={3}
                    onChange={(val) => {
                      setFormData((prev) => ({ ...prev, amc_remark: val }));
                      clearError('amc_remark');
                    }}
                    error={errors.amc_remark}
                  />
                </div>
              </div>
            </div>

            {/* Section 4: AMC Photographs */}
            <div id="sec-photos" className="bihar-section-block">
              <SectionHeader
                num="4"
                total={T}
                title="AMC Photographs (Images 1-4 Required, 5-10 Optional)"
                desc="Upload geo-tagged inspection photos, module wash, inverter display, and wiring checks (JPG/PNG max 5MB each)."
              />
              <div className="bihar-form-grid bihar-form-grid--4col">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                  const key = `amc_image${num}`;
                  const isReq = num <= 4;
                  return (
                    <FloatingFileInput
                      key={key}
                      id={`srt-${key}`}
                      label={`Amc Image ${num}`}
                      required={isReq}
                      file={images[key]}
                      onChange={(f) => {
                        setImages((prev) => ({ ...prev, [key]: f }));
                        clearError(key);
                      }}
                      error={errors[key]}
                    />
                  );
                })}
              </div>
            </div>

            {/* Section 5: Raised Complaint */}
            <div id="sec-complaint" className="bihar-section-block">
              <SectionHeader
                num="5"
                total={T}
                title="Raised Complaint (Optional)"
                desc="Raise an instant breakdown complaint ticket for department rectification."
              />

              <div style={{ marginBottom: varSpace3() }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    className="ax-checkbox"
                    checked={formData.raised_complaint}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, raised_complaint: e.target.checked }));
                      clearError('complaint');
                    }}
                  />
                  <span>Raised Complaint</span>
                </label>
              </div>

              {formData.raised_complaint && (
                <div className="bihar-form-grid" style={{ marginTop: 12 }}>
                  <FloatingTextarea
                    id="srt-complaint"
                    label="Complaint Description *"
                    required
                    placeholder="Describe the complaint in detail..."
                    value={formData.complaint}
                    rows={3}
                    onChange={(val) => {
                      setFormData((prev) => ({ ...prev, complaint: val }));
                      clearError('complaint');
                    }}
                    error={errors.complaint}
                  />

                  <FloatingInput
                    id="srt-sms-contact"
                    label="Beneficiary Contact (to receive SMS notification)"
                    type="tel"
                    placeholder="Leave blank to use beneficiary contact above"
                    value={formData.beneficiary_contact}
                    onChange={(val) => {
                      setFormData((prev) => ({ ...prev, beneficiary_contact: val }));
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sticky Action Bar */}
        <div className="bihar-form-sticky-bar">
          <span className="ax-badge ax-badge--soft ax-badge--primary ax-badge--pill">
            SRT AMC Submission
          </span>
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)' }}>
            <button type="button" className="ax-btn ax-btn--secondary" onClick={() => navigate(-1)} disabled={submitting}>
              <span className="ax-btn__label">Cancel</span>
            </button>
            <button type="submit" disabled={submitting} className="ax-btn ax-btn--primary" style={{ minWidth: 200 }}>
              {submitting ? (
                <>
                  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ animation: 'bihar-spin 1s linear infinite' }}><path d="M12 3a9 9 0 1 0 9 9" /></svg>
                  <span className="ax-btn__label">Updating SRT AMC…</span>
                </>
              ) : (
                <>
                  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5l10 -10" /></svg>
                  <span className="ax-btn__label">Submit SRT AMC</span>
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

const varSpace3 = () => 'var(--ax-space-3)';

/* ── Section Header ── */
function SectionHeader({ num, total, title, desc }: { num: string; total: number; title: string; desc: string }) {
  return (
    <div className="bihar-section-header">
      <div className="bihar-section-title-wrap">
        <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', alignItems: 'center' }}>
          <span className="ax-badge ax-badge--soft ax-badge--primary ax-badge--pill" style={{ fontWeight: 600 }}>
            Step {num} of {total}
          </span>
          <h3 style={{ fontSize: 'var(--ax-text-base)', fontWeight: 600, margin: 0, color: 'var(--ax-text-strong)' }}>
            {title}
          </h3>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
          {desc}
        </p>
      </div>
    </div>
  );
}

/* ── Read-only Info Item ── */
function InfoItem({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="bihar-info-item">
      <span className="bihar-info-label">{label}</span>
      <span className="bihar-info-value">{value || '—'}</span>
    </div>
  );
}

/* ── Asterisk ── */
const Asterisk = () => <span style={{ color: 'var(--ax-danger-500)', marginLeft: 3 }}>*</span>;

/* ── Field Feedback ── */
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

/* ── Floating Input ── */
function FloatingInput({
  id, label, type = 'text', required, placeholder = ' ', value, maxLength, onChange, error,
}: {
  id: string; label: string; type?: string; required?: boolean; placeholder?: string; value: string; maxLength?: number; onChange?: (val: string) => void; error?: string;
}) {
  return (
    <div>
      <div className={`ax-float ${type === 'date' ? 'ax-float--date' : ''}`}>
        <input
          id={id}
          type={type}
          maxLength={maxLength}
          className={`ax-input ax-float__input ${error ? 'is-invalid' : ''}`}
          placeholder={placeholder}
          value={value}
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

/* ── Floating Select ── */
function FloatingSelect({
  id, label, required, disabled, placeholder = '-- Select --', value, options, onChange, error,
}: {
  id: string; label: string; required?: boolean; disabled?: boolean; placeholder?: string; value: string; options: { value: string; label: string }[]; onChange: (val: string) => void; error?: string;
}) {
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

/* ── Floating Textarea ── */
function FloatingTextarea({
  id, label, required, placeholder = 'Enter Remarks...', value, rows = 3, onChange, error,
}: {
  id: string; label: string; required?: boolean; placeholder?: string; value: string; rows?: number; onChange: (val: string) => void; error?: string;
}) {
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

/* ── Floating File Input (Drag & drop with image preview) ── */
function FloatingFileInput({
  id, label, required, accept = 'image/*', file, onChange, error,
}: {
  id: string; label: string; required?: boolean; accept?: string; file: File | null; onChange: (file: File | null) => void; error?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  useEffect(() => {
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setObjectUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setObjectUrl(null);
  }, [file]);

  return (
    <div className={error ? 'is-invalid' : undefined} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label
        htmlFor={id}
        style={{
          fontSize: '11px',
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
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const f = e.dataTransfer.files?.[0];
          if (f) onChange(f);
        }}
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
          padding: file ? '8px 10px' : '12px 10px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          minHeight: 88,
        }}
      >
        {file ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, textAlign: 'left' }}>
              {objectUrl && (
                <img
                  src={objectUrl}
                  alt={label}
                  style={{ width: 38, height: 38, objectFit: 'cover', borderRadius: 4, border: '1px solid var(--ax-border)', flexShrink: 0 }}
                />
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ax-text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file.name}
                </div>
                <div style={{ fontSize: 10, color: 'var(--ax-text-muted)' }}>
                  {(file.size / 1024).toFixed(0)} KB
                </div>
              </div>
            </div>
            <button
              type="button"
              className="ax-btn ax-btn--ghost ax-btn--xs"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
                if (inputRef.current) inputRef.current.value = '';
              }}
              style={{ color: '#ef4444', flexShrink: 0, padding: '2px 6px' }}
              title="Remove file"
            >
              ✕
            </button>
          </div>
        ) : (
          <>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 4 }}>
              <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
              <path d="M12 12v9" />
              <path d="m8 16 4-4 4 4" />
            </svg>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ax-text-strong, #1e293b)' }}>
              Choose File
            </div>
            <div style={{ fontSize: 10, color: 'var(--ax-text-muted, #64748b)' }}>
              No file chosen
            </div>
          </>
        )}
      </div>

      <FieldFeedback error={error} />
    </div>
  );
}

export default Bihar_AMC_SRT_AddData;
