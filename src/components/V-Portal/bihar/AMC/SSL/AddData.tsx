import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  biharAmcService,
  getAmcMediaUrl,
  type BiharSslUidItem,
  type BiharSslDetail,
} from '../../bihar-services/biharAmcService';

// Unified Single-Card Layout CSS (Same as Bihar Complaints SSL)
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
  .bihar-form-grid--2col {
    grid-template-columns: repeat(2, 1fr);
  }
  .bihar-form-grid--3col {
    grid-template-columns: repeat(3, 1fr);
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
  { id: 'sec-uid', num: '1', title: "Select UID's" },
  { id: 'sec-details', num: '2', title: 'Site Details' },
  { id: 'sec-form', num: '3', title: 'Fill this Form' },
  { id: 'sec-complaint', num: '4', title: 'Raised Complaint' },
];

export function Bihar_AMC_SSL_AddData() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryUid = searchParams.get('uid') || searchParams.get('unique_id') || '';

  // Dropdown states
  const [uids, setUids] = useState<BiharSslUidItem[]>([]);
  const [selectedUid, setSelectedUid] = useState(queryUid);
  const [siteDetail, setSiteDetail] = useState<BiharSslDetail | null>(null);

  // Loaders
  const [loadingUids, setLoadingUids] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [fetchingLoc, setFetchingLoc] = useState(false);

  // Form Inputs
  const [formData, setFormData] = useState({
    beneficiary_name: '',
    beneficiary_contact: '',
    latitude: '',
    longitude: '',
    amc_remarks: '',
    raised_complaint: false,
    complaint: '',
  });

  // Images 1 & 2
  const [image1, setImage1] = useState<File | null>(null);
  const [image2, setImage2] = useState<File | null>(null);

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

  // 1. Fetch UIDs: GET /bihar/ssl/amc/fetch-uids
  useEffect(() => {
    let active = true;
    (async () => {
      setLoadingUids(true);
      try {
        const list = await biharAmcService.getSslUids();
        if (active) {
          setUids(list);
          if (queryUid && list.some((u) => u.unique_id === queryUid)) {
            setSelectedUid(queryUid);
          }
        }
      } catch (err) {
        console.warn('Failed to load SSL UIDs:', err);
      } finally {
        if (active) setLoadingUids(false);
      }
    })();
    return () => { active = false; };
  }, [queryUid]);

  // 2. Fetch Details when UID selected: GET /bihar/ssl/amc/fetch-details/{unique_id}
  useEffect(() => {
    if (!selectedUid) {
      setSiteDetail(null);
      return;
    }
    let active = true;
    (async () => {
      setLoadingDetail(true);
      try {
        const detail = await biharAmcService.getSslDetailsByUid(selectedUid);
        if (active && detail) {
          setSiteDetail(detail);
          setFormData((prev) => ({
            ...prev,
            beneficiary_name: prev.beneficiary_name || detail.beneficiary_name || '',
            beneficiary_contact: prev.beneficiary_contact || (detail.contact_no ? String(detail.contact_no).slice(-10) : ''),
            latitude: prev.latitude || (detail.latitude ? String(detail.latitude) : ''),
            longitude: prev.longitude || (detail.longitude ? String(detail.longitude) : ''),
          }));
        }
      } catch (err) {
        console.warn('Failed to load SSL details:', err);
      } finally {
        if (active) setLoadingDetail(false);
      }
    })();
    return () => { active = false; };
  }, [selectedUid]);

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
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
        clearError('latitude');
        clearError('longitude');
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
    if (!selectedUid) errs.selectedUid = 'Please select a Unique ID.';
    if (!siteDetail?.id) errs.selectedUid = 'Site record could not be loaded.';

    if (!formData.beneficiary_name.trim()) errs.beneficiary_name = 'Beneficiary Name is required.';
    if (!formData.beneficiary_contact.trim() || !/^\d{10}$/.test(formData.beneficiary_contact.trim())) {
      errs.beneficiary_contact = 'Beneficiary Contact must be exactly 10 digits.';
    }

    const lat = Number(formData.latitude);
    if (!formData.latitude.trim() || isNaN(lat) || lat < -90 || lat > 90) {
      errs.latitude = 'Latitude is required and must be between -90 and 90.';
    }

    const lng = Number(formData.longitude);
    if (!formData.longitude.trim() || isNaN(lng) || lng < -180 || lng > 180) {
      errs.longitude = 'Longitude is required and must be between -180 and 180.';
    }

    if (!image1) errs.amc_image1 = 'AMC Image 1 is required.';
    if (!image2) errs.amc_image2 = 'AMC Image 2 is required.';

    if (formData.raised_complaint && !formData.complaint.trim()) {
      errs.complaint = 'Complaint description is required when raising a complaint.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Submit Handler: POST /bihar/ssl/update
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
      fd.append('id', String(siteDetail!.id));
      fd.append('latitude', formData.latitude.trim());
      fd.append('longitude', formData.longitude.trim());
      fd.append('beneficiary_name', formData.beneficiary_name.trim());
      fd.append('beneficiary_contact', formData.beneficiary_contact.trim());

      if (formData.amc_remarks) {
        fd.append('amc_remarks', formData.amc_remarks.trim());
      }
      if (image1) fd.append('amc_image1', image1);
      if (image2) fd.append('amc_image2', image2);

      if (formData.raised_complaint) {
        fd.append('raised_complaint', '1');
        fd.append('complaint', formData.complaint.trim());
      }

      const res = await biharAmcService.updateSslAmc(fd);
      setSuccessMsg(res.message || 'Details Updated Successfully!!!');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => {
        navigate('/v/view-biharssl');
      }, 1500);
    } catch (err: any) {
      console.error('SSL AMC submission error:', err);
      setErrorMsg(err.message || 'Failed to submit SSL AMC record.');
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
        title="UPDATE BIHAR SSL"
        subtitle={
          <span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>
            Welcome to, Update Bihar SSL AMC (Record Periodic SSL AMC)
          </span>
        }
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Bihar' },
          { label: 'AMC' },
          { label: 'SSL', href: '/v/view-biharssl' },
          { label: 'Add Data' },
        ]}
        actions={
          <Link to="/v/view-biharssl" className="ax-btn ax-btn--secondary ax-btn--pill">
            <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l14 0" /><path d="M5 12l6 6" /><path d="M5 12l6 -6" /></svg>
            <span className="ax-btn__label">View SSL AMC</span>
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
              <span className="ax-card__eyebrow">Bihar Solar Street Light (SSL)</span>
              <h2 className="ax-card__title" style={{ margin: 0 }}>
              Bihar SSL Survey Form
              </h2>
              <p className="ax-card__subtitle" style={{ margin: '4px 0 0' }}>
                Select UID to load street light technical data, capture photographs, and record AMC performance checks.
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
            {/* Section 1: Select UID */}
            <div id="sec-uid" className="bihar-section-block">
              <SectionHeader num="1" total={T} title="Select UID's" desc="Select from assigned Solar Street Light UIDs." />
              <div className="bihar-form-grid bihar-form-grid--2col">
                <FloatingSelect
                  id="ssl-uid-select"
                  label="Select UID's"
                  required
                  placeholder={loadingUids ? 'Loading UIDs...' : uids.length === 0 ? 'No assigned lights found' : '-- Select UID --'}
                  value={selectedUid}
                  options={uids.map((u) => ({ value: u.unique_id, label: u.unique_id }))}
                  disabled={loadingUids || uids.length === 0}
                  onChange={(val) => {
                    setSelectedUid(val);
                    clearError('selectedUid');
                  }}
                  error={errors.selectedUid}
                />
              </div>
            </div>

            {/* Section 2: Site Details */}
            <div id="sec-details" className="bihar-section-block">
              <SectionHeader num="2" total={T} title="Site Details" desc="Read-only metadata and light installation parameters." />
              {loadingDetail ? (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--ax-text-muted)' }}>
                  <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading SSL site details…
                </div>
              ) : siteDetail ? (
                <>
                  <div className="bihar-info-card">
                    <InfoItem label="Unique ID" value={siteDetail.unique_id} />
                    <InfoItem label="State" value={siteDetail.state || 'Bihar'} />
                    <InfoItem label="Phase" value={siteDetail.phase} />
                    <InfoItem label="WO No" value={siteDetail.wo_no} />
                    <InfoItem label="WO Received" value={siteDetail.wo_recieved} />
                    <InfoItem label="District" value={siteDetail.district} />
                    <InfoItem label="Block" value={siteDetail.block} />
                    <InfoItem label="Panchyat" value={siteDetail.panchyat || siteDetail.panchayat} />
                    <InfoItem label="Ward No" value={siteDetail.ward_no} />
                    <InfoItem label="Pole No" value={siteDetail.pole_no} />
                    <InfoItem label="Beneficiary Name" value={siteDetail.beneficiary_name} />
                    <InfoItem label="Contact No" value={siteDetail.contact_no} />
                    <InfoItem label="Latitude" value={siteDetail.latitude} />
                    <InfoItem label="Longitude" value={siteDetail.longitude} />
                    <InfoItem label="Luminary No" value={siteDetail.luminary_no} />
                    <InfoItem label="SIM No" value={siteDetail.sim_no} />
                    <InfoItem label="Battery Serial No" value={siteDetail.battery_serial_no} />
                    <InfoItem label="Module No" value={siteDetail.module_no} />
                    <InfoItem label="Supply" value={siteDetail.supply} />
                    <InfoItem label="Material Inspection" value={siteDetail.material_inspection} />
                    <InfoItem label="Installation" value={siteDetail.installation} />
                    <InfoItem label="Date of Installation" value={siteDetail.date_of_installation} />
                    <InfoItem label="Installed By" value={siteDetail.installed_by} />
                  </div>

                  {/* Previous Installation Photos if available */}
                  {Array.isArray(siteDetail.images) && siteDetail.images.length > 0 && (
                    <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--ax-border)' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ax-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                        Installation Photos on Record:
                      </span>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        {siteDetail.images.map((img, i) => (
                          <div key={i} style={{ display: 'flex', gap: 6 }}>
                            {img.image1 && (
                              <a href={getAmcMediaUrl(img.image1)} target="_blank" rel="noreferrer">
                                <img src={getAmcMediaUrl(img.image1)} alt="Light Photo 1" style={{ width: 70, height: 70, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--ax-border)' }} />
                              </a>
                            )}
                            {img.image2 && (
                              <a href={getAmcMediaUrl(img.image2)} target="_blank" rel="noreferrer">
                                <img src={getAmcMediaUrl(img.image2)} alt="Light Photo 2" style={{ width: 70, height: 70, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--ax-border)' }} />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ padding: 20, textAlign: 'center', background: 'var(--ax-surface-subtle)', borderRadius: 8, color: 'var(--ax-text-muted)', fontSize: 13 }}>
                  Please select a Unique ID above to view street light details.
                </div>
              )}
            </div>

            {/* Section 3: Fill this Form */}
            <div id="sec-form" className="bihar-section-block">
              <SectionHeader
                num="3"
                total={T}
                title="Fill this Form"
                desc="The field labels marked with * are required fields."
              />
              <div className="bihar-form-grid bihar-form-grid--2col">
                <FloatingFileInput
                  id="ssl-img-1"
                  label="AMC Image 1"
                  required
                  file={image1}
                  onChange={(f) => {
                    setImage1(f);
                    clearError('amc_image1');
                  }}
                  error={errors.amc_image1}
                />

                <FloatingFileInput
                  id="ssl-img-2"
                  label="AMC Image 2"
                  required
                  file={image2}
                  onChange={(f) => {
                    setImage2(f);
                    clearError('amc_image2');
                  }}
                  error={errors.amc_image2}
                />

                <FloatingInput
                  id="ssl-ben-name"
                  label="Beneficiary Name"
                  required
                  placeholder="Enter Beneficiary Name"
                  value={formData.beneficiary_name}
                  onChange={(val) => {
                    setFormData((prev) => ({ ...prev, beneficiary_name: val }));
                    clearError('beneficiary_name');
                  }}
                  error={errors.beneficiary_name}
                />

                <FloatingInput
                  id="ssl-ben-contact"
                  label="Beneficiary Contact (10 Digits)"
                  required
                  type="tel"
                  maxLength={10}
                  placeholder="10-digit mobile number"
                  value={formData.beneficiary_contact}
                  onChange={(val) => {
                    const clean = val.replace(/\D/g, '').slice(0, 10);
                    setFormData((prev) => ({ ...prev, beneficiary_contact: clean }));
                    clearError('beneficiary_contact');
                  }}
                  error={errors.beneficiary_contact}
                />

                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <FloatingInput
                      id="ssl-lat"
                      label="AMC Latitude"
                      required
                      placeholder="e.g. 25.594095"
                      value={formData.latitude}
                      onChange={(val) => {
                        setFormData((prev) => ({ ...prev, latitude: val }));
                        clearError('latitude');
                      }}
                      error={errors.latitude}
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
                  id="ssl-lng"
                  label="AMC Longitude"
                  required
                  placeholder="e.g. 85.137566"
                  value={formData.longitude}
                  onChange={(val) => {
                    setFormData((prev) => ({ ...prev, longitude: val }));
                    clearError('longitude');
                  }}
                  error={errors.longitude}
                />

                <div className="bihar-form-col-span-full">
                  <FloatingTextarea
                    id="ssl-remarks"
                    label="Remarks"
                    placeholder="Enter Remarks..."
                    value={formData.amc_remarks}
                    rows={3}
                    onChange={(val) => {
                      setFormData((prev) => ({ ...prev, amc_remarks: val }));
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Raised Complaint */}
            <div id="sec-complaint" className="bihar-section-block">
              <SectionHeader
                num="4"
                total={T}
                title="Raised Complaint (Optional)"
                desc="Raise a breakdown complaint ticket for this street light."
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
                    id="ssl-complaint-desc"
                    label="Complaint Description *"
                    required
                    placeholder="Describe street light issue in detail (e.g. light not glowing, luminaire failure, battery issue)..."
                    value={formData.complaint}
                    rows={3}
                    onChange={(val) => {
                      setFormData((prev) => ({ ...prev, complaint: val }));
                      clearError('complaint');
                    }}
                    error={errors.complaint}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="bihar-form-sticky-bar">
          <span className="ax-badge ax-badge--soft ax-badge--primary ax-badge--pill">
            SSL AMC Status
          </span>
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)' }}>
            <button type="button" className="ax-btn ax-btn--secondary" onClick={() => navigate(-1)} disabled={submitting}>
              <span className="ax-btn__label">Cancel</span>
            </button>
            <button type="submit" disabled={submitting} className="ax-btn ax-btn--primary" style={{ minWidth: 200 }}>
              {submitting ? (
                <>
                  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ animation: 'bihar-spin 1s linear infinite' }}><path d="M12 3a9 9 0 1 0 9 9" /></svg>
                  <span className="ax-btn__label">Updating SSL AMC…</span>
                </>
              ) : (
                <>
                  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5l10 -10" /></svg>
                  <span className="ax-btn__label">Submit AMC Status</span>
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

/* ── Info Item ── */
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

/* ── Floating File Input ── */
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
          padding: file ? '10px 12px' : '18px 12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          minHeight: 100,
        }}
      >
        {file ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, textAlign: 'left' }}>
              {objectUrl && (
                <img
                  src={objectUrl}
                  alt={label}
                  style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 4, border: '1px solid var(--ax-border)', flexShrink: 0 }}
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
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 4 }}>
              <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
              <path d="M12 12v9" />
              <path d="m8 16 4-4 4 4" />
            </svg>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ax-text-strong, #1e293b)' }}>
              Choose File
            </div>
            <div style={{ fontSize: 10, color: 'var(--ax-text-muted, #64748b)', marginTop: 2 }}>
              No file chosen (JPG, PNG up to 5MB)
            </div>
          </>
        )}
      </div>

      <FieldFeedback error={error} />
    </div>
  );
}

export default Bihar_AMC_SSL_AddData;
