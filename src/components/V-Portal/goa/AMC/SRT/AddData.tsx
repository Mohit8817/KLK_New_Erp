import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  goaSrtAmcService,
  type GoaAmcSiteRecord,
  type GoaAmcSiteDetail,
} from '../../goa-services';

// CSS: Unified Single-Card Layout with Floating Labels & Section Dividers (same as Bihar SRT design)
const SINGLE_CARD_FORM_CSS = `
.goa-single-card-form .ax-card { border: 1px solid var(--ax-border); border-radius: var(--ax-radius-xl); background: var(--ax-surface-solid); box-shadow: var(--ax-shadow-sm); overflow: hidden; }
.goa-single-card-form .ax-card__header { padding: var(--ax-space-5) var(--ax-space-6); border-bottom: 1px solid var(--ax-border-subtle); background: var(--ax-surface-subtle); display: flex; flex-direction: column; gap: var(--ax-space-4); }
.goa-single-card-form .ax-card__body { padding: var(--ax-space-6); }

.goa-section-pills { display: flex; gap: var(--ax-space-2); overflow-x: auto; padding-bottom: 4px; scrollbar-width: thin; }
.goa-section-pill-btn { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: var(--ax-radius-pill); font-size: var(--ax-text-xs); font-weight: 500; white-space: nowrap; background: var(--ax-surface-solid); border: 1px solid var(--ax-border); color: var(--ax-text); cursor: pointer; transition: all var(--ax-motion-fast) var(--ax-ease-standard); text-decoration: none; }
.goa-section-pill-btn:hover { border-color: var(--ax-accent); color: var(--ax-accent); background: color-mix(in srgb, var(--ax-accent) 6%, var(--ax-surface-solid)); }
.goa-section-pill-btn .pill-num { width: 18px; height: 18px; border-radius: 50%; background: var(--ax-surface-subtle); display: inline-flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; }

.goa-section-block { padding-top: var(--ax-space-2); scroll-margin-top: 80px; }
.goa-section-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: var(--ax-space-2); margin-bottom: var(--ax-space-5); padding-bottom: var(--ax-space-3); border-bottom: 1px solid var(--ax-border-subtle); }
.goa-section-title-wrap { display: flex; flex-direction: column; gap: 4px; }
.goa-section-divider { border: 0; border-top: 1px dashed var(--ax-border); margin: var(--ax-space-8) 0 var(--ax-space-6); }

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

.goa-form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--ax-space-4); }
@media (min-width: 1024px) { .goa-form-grid--3col { grid-template-columns: repeat(3, 1fr); } }
.goa-form-col-span-full { grid-column: 1 / -1; }
.goa-gps-cell { height: 46px; }

.goa-complaint-box { padding: var(--ax-space-4); border: 1px solid var(--ax-border); border-radius: var(--ax-radius-md); background: var(--ax-surface-subtle); }

.goa-form-sticky-bar { position: sticky; bottom: var(--ax-space-4); z-index: 30; margin-top: var(--ax-space-6); padding: var(--ax-space-3) var(--ax-space-5); background: var(--ax-surface-solid); border: 1px solid var(--ax-border); border-radius: var(--ax-radius-xl); box-shadow: var(--ax-shadow-lg); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--ax-space-3); backdrop-filter: blur(12px); }

@keyframes goa-spin { to { transform: rotate(360deg); } }
`;

type Option = { value: string; label: string };
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const IMAGE_COUNT = 10;
const REQUIRED_IMAGES = 4;

const SECTIONS = [
  { id: 'sec-1', num: '1', title: 'Select AMC & Site' },
  { id: 'sec-2', num: '2', title: 'Information' },
  { id: 'sec-3', num: '3', title: 'Fill this Form' },
  { id: 'sec-4', num: '4', title: 'Photos & Complaint' },
];

export function Goa_AMC_SRT_AddData() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Params from navigation
  const paramAmc = searchParams.get('amc');
  const paramSiteId = searchParams.get('site_id');
  const paramAmcId = searchParams.get('amc_id');

  // Loading & notification states
  const [loadingAmcTypes, setLoadingAmcTypes] = useState(false);
  const [loadingSites, setLoadingSites] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [geoLocating, setGeoLocating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Dropdown lists
  const [amcTypes, setAmcTypes] = useState<string[]>([]);
  const [amcSites, setAmcSites] = useState<GoaAmcSiteRecord[]>([]);

  // Selected values
  const [selectedAmc, setSelectedAmc] = useState<string>(paramAmc || '');
  const [selectedSiteId, setSelectedSiteId] = useState<string>(paramSiteId || '');
  const [siteDetail, setSiteDetail] = useState<GoaAmcSiteDetail | null>(null);

  // Form fields
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [beneficiaryContact, setBeneficiaryContact] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [remarks, setRemarks] = useState('');
  const [raisedComplaint, setRaisedComplaint] = useState(false);
  const [complaintText, setComplaintText] = useState('');

  // 10 image slots
  const [images, setImages] = useState<(File | null)[]>(Array(IMAGE_COUNT).fill(null));

  const clearError = (name: string) => {
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // 1. Fetch AMC types on mount
  useEffect(() => {
    let active = true;
    (async () => {
      setLoadingAmcTypes(true);
      try {
        const types = await goaSrtAmcService.fetchAmcTypes();
        if (active) {
          setAmcTypes(types);
          if (!selectedAmc && types.length > 0 && !paramAmcId) {
            setSelectedAmc(types[0]);
          }
        }
      } catch (err) {
        console.warn('Failed to load AMC types:', err);
      } finally {
        if (active) setLoadingAmcTypes(false);
      }
    })();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramAmcId]);

  // 2. Load AMC for update if amc_id is passed
  useEffect(() => {
    if (!paramAmcId) return;
    let active = true;
    (async () => {
      setLoadingDetail(true);
      try {
        const rec = await goaSrtAmcService.viewAmcForUpdate(paramAmcId);
        if (active && rec) {
          if (rec.amc) setSelectedAmc(rec.amc);
          if (rec.site_id) setSelectedSiteId(String(rec.site_id));
          if (rec.srtdata) setSiteDetail(rec.srtdata);
          if (rec.amc_beneficiary_name) setBeneficiaryName(rec.amc_beneficiary_name);
          if (rec.amc_beneficiary_contact) setBeneficiaryContact(rec.amc_beneficiary_contact);
          if (rec.amc_latitude) setLatitude(String(rec.amc_latitude));
          if (rec.amc_longitude) setLongitude(String(rec.amc_longitude));
          if (rec.amc_remark) setRemarks(rec.amc_remark);
        }
      } catch (err) {
        console.warn('Error loading AMC record for update:', err);
      } finally {
        if (active) setLoadingDetail(false);
      }
    })();
    return () => { active = false; };
  }, [paramAmcId]);

  // 3. Fetch sites when selectedAmc changes
  useEffect(() => {
    if (!selectedAmc) {
      setAmcSites([]);
      return;
    }
    let active = true;
    (async () => {
      setLoadingSites(true);
      try {
        const sites = await goaSrtAmcService.fetchAmcSites(selectedAmc);
        if (active) {
          setAmcSites(sites);
          if (paramSiteId) setSelectedSiteId(paramSiteId);
        }
      } catch (err) {
        console.warn('Failed to load AMC sites:', err);
      } finally {
        if (active) setLoadingSites(false);
      }
    })();
    return () => { active = false; };
  }, [selectedAmc, paramSiteId]);

  // 4. Fetch site details when selectedSiteId changes
  useEffect(() => {
    if (!selectedSiteId) {
      setSiteDetail(null);
      return;
    }
    let active = true;
    (async () => {
      setLoadingDetail(true);
      try {
        const detail = await goaSrtAmcService.fetchSiteDetails(selectedSiteId);
        if (active && detail) setSiteDetail(detail);
      } catch (err) {
        console.warn('Failed to load site details:', err);
      } finally {
        if (active) setLoadingDetail(false);
      }
    })();
    return () => { active = false; };
  }, [selectedSiteId]);

  // GPS detection
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setGeoLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
        clearError('amc_latitude');
        clearError('amc_longitude');
        setGeoLocating(false);
      },
      (err) => {
        alert(`Failed to detect location: ${err.message}`);
        setGeoLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Image handler
  const handleFileChange = (index: number, file: File | null) => {
    if (file && file.size > MAX_FILE_SIZE) {
      alert('File size exceeds 5 MB limit.');
      return;
    }
    setImages((prev) => {
      const next = [...prev];
      next[index] = file;
      return next;
    });
    clearError(`amc_image${index + 1}`);
  };

  // Validation
  const validate = () => {
    const errs: Record<string, string> = {};

    if (!selectedAmc) errs.amc = 'Please select AMC Type.';
    if (!selectedSiteId) errs.srt_id = 'Please select a site.';
    if (!beneficiaryName.trim()) errs.amc_beneficiary_name = 'Beneficiary name is required.';
    if (!beneficiaryContact.trim()) {
      errs.amc_beneficiary_contact = 'Beneficiary contact is required.';
    } else if (!/^\d{10}$/.test(beneficiaryContact.trim())) {
      errs.amc_beneficiary_contact = 'Contact number must be exactly 10 digits.';
    }
    if (!latitude.trim()) errs.amc_latitude = 'Latitude is required.';
    if (!longitude.trim()) errs.amc_longitude = 'Longitude is required.';
    if (!remarks.trim()) errs.amc_remark = 'Remarks are required.';

    for (let i = 0; i < REQUIRED_IMAGES; i++) {
      if (!images[i]) errs[`amc_image${i + 1}`] = `AMC Image ${i + 1} is required.`;
    }

    if (raisedComplaint && !complaintText.trim()) {
      errs.complaint = 'Complaint description is required when Raised Complaint is enabled.';
    }

    setErrors(errs);
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
      fd.append('srt_id', selectedSiteId);
      fd.append('amc', selectedAmc);
      fd.append('amc_beneficiary_name', beneficiaryName.trim());
      fd.append('amc_beneficiary_contact', beneficiaryContact.trim());
      fd.append('amc_remark', remarks.trim());
      fd.append('amc_latitude', latitude.trim());
      fd.append('amc_longitude', longitude.trim());

      images.forEach((file, idx) => {
        if (file) fd.append(`amc_image${idx + 1}`, file);
      });

      if (raisedComplaint) {
        fd.append('raised_complaint', '1');
        fd.append('complaint', complaintText.trim());
      }

      const res = await goaSrtAmcService.updateAmcSite(fd);

      if (res.success) {
        setSuccessMsg(res.message || 'Update SRT AMC Successfully');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => {
          navigate('/v/goa-view-srt-amc');
        }, 1500);
      } else {
        setErrorMsg(res.message || 'Failed to update AMC site.');
        if (res.errors) {
          const apiErrors: Record<string, string> = {};
          Object.entries(res.errors).forEach(([k, v]) => {
            apiErrors[k] = Array.isArray(v) ? String(v[0]) : String(v);
          });
          setErrors((prev) => ({ ...prev, ...apiErrors }));
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

  const amcTypeOptions: Option[] = amcTypes.map((t) => ({ value: t, label: t }));
  const siteOptions: Option[] = amcSites.map((s) => ({
    value: String(s.site_id || s.id),
    label: `${s.srtdata?.site_name || `Site #${s.site_id || s.id}`} (${s.amc})`,
  }));

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="goa-single-card-form">
      <style>{SINGLE_CARD_FORM_CSS}</style>

      <PageHead
        title="Goa SRT AMC Site Information"
        subtitle={
          <span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>
            Update SRT AMC site details and service photos
          </span>
        }
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Goa' },
          { label: 'AMC', href: '/v/goa-view-srt-amc' },
          { label: 'Update AMC Site Details' },
        ]}
        actions={
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}>
            <Link to="/v/goa-view-srt-amc-complaint" className="ax-btn ax-btn--secondary ax-btn--pill">
              <span className="ax-btn__label">View Complaints</span>
            </Link>
            <Link to="/v/goa-view-srt-amc" className="ax-btn ax-btn--secondary ax-btn--pill">
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l14 0" /><path d="M5 12l6 6" /><path d="M5 12l6 -6" /></svg>
              <span className="ax-btn__label">AMC List</span>
            </Link>
          </div>
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
              <span className="ax-card__eyebrow">AMC</span>
              <h2 className="ax-card__title" style={{ margin: 0 }}>Goa SRT AMC Site Information</h2>
              <p className="ax-card__subtitle" style={{ margin: '4px 0 0' }}>
                All AMC fields organized inside one main card across 4 dedicated sections.
              </p>
            </div>

            <div className="goa-section-pills" role="navigation" aria-label="Jump to section">
              {SECTIONS.map((s) => (
                <button key={s.id} type="button" onClick={() => scrollToSection(s.id)} className="goa-section-pill-btn">
                  <span className="pill-num">{s.num}</span>
                  <span>{s.title}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="ax-card__body">
            {/* Section 1: Select AMC Type & Site */}
            <div id="sec-1" className="goa-section-block">
              <SectionHeader num="1" title="Select AMC Type & Site" desc="Pick the AMC type to load the pending sites assigned to your account." />
              <div className="goa-form-grid goa-form-grid--3col">
                <FloatingSelect
                  id="goa-amc-type"
                  label="Select AMC Type"
                  required
                  placeholder={loadingAmcTypes ? 'Loading AMC types...' : '-- Select AMC Type --'}
                  value={selectedAmc}
                  options={amcTypeOptions}
                  disabled={loadingAmcTypes}
                  onChange={(v) => {
                    setSelectedAmc(v);
                    setSelectedSiteId('');
                    setSiteDetail(null);
                    clearError('amc');
                  }}
                  error={errors.amc}
                />
                <FloatingSelect
                  id="goa-amc-site"
                  label="Select Site"
                  required
                  placeholder={loadingSites ? 'Loading sites...' : '-- Select Site --'}
                  value={selectedSiteId}
                  options={siteOptions}
                  disabled={!selectedAmc || loadingSites}
                  onChange={(v) => {
                    setSelectedSiteId(v);
                    clearError('srt_id');
                  }}
                  error={errors.srt_id}
                />
              </div>
            </div>

            <hr className="goa-section-divider" />

            {/* Section 2: Information (read-only) */}
            <div id="sec-2" className="goa-section-block">
              <SectionHeader
                num="2"
                title="Information"
                desc={loadingDetail ? 'Loading site details...' : 'Auto-populated from selected site record (Read-only).'}
              />
              <div className="goa-form-grid goa-form-grid--3col">
                <FloatingInput id="goa-amc-discom" label="Discom" readOnly value={siteDetail?.discom || ''} />
                <FloatingInput id="goa-amc-state" label="State" readOnly value={siteDetail?.state || 'Goa'} />
                <FloatingInput id="goa-amc-district" label="District" readOnly value={siteDetail?.district || ''} />
                <FloatingInput id="goa-amc-dept" label="Department Name" readOnly value={siteDetail?.dept_name || ''} />
                <FloatingInput id="goa-amc-site-name" label="Site Name" readOnly value={siteDetail?.site_name || ''} />
                <FloatingInput id="goa-amc-location" label="Location" readOnly value={siteDetail?.location || ''} />
                <FloatingInput id="goa-amc-firm" label="Firm Name" readOnly value={siteDetail?.firm_name || ''} />
                <FloatingInput id="goa-amc-ca" label="CA No." readOnly value={siteDetail?.ca_no || ''} />
                <FloatingInput id="goa-amc-sanction" label="Sanction Load" readOnly value={siteDetail?.sanction_load || ''} />
                <FloatingInput id="goa-amc-plant" label="Plant SC" readOnly value={siteDetail?.plant_sc || ''} />
                <FloatingInput id="goa-amc-wo" label="WO No." readOnly value={siteDetail?.wo_no || ''} />
                <FloatingInput id="goa-amc-phase" label="Phase" readOnly value={siteDetail?.phase || ''} />
                <FloatingInput id="goa-amc-vendor" label="Vendor" readOnly value={siteDetail?.vendor || ''} />
                <FloatingInput id="goa-amc-date" label="Date" readOnly value={siteDetail?.date || ''} />
                <FloatingInput id="goa-amc-inv-date" label="Material Invoice Date" readOnly value={siteDetail?.material_invoice_date || ''} />
                <FloatingInput id="goa-amc-inv" label="Material Bill Invoice" readOnly value={siteDetail?.material_bill_invoice || ''} />
                <FloatingInput id="goa-amc-status" label="Installation Status" readOnly value={siteDetail?.installation_status || 'Installed'} />
              </div>
            </div>

            <hr className="goa-section-divider" />

            {/* Section 3: Fill this Form */}
            <div id="sec-3" className="goa-section-block">
              <SectionHeader
                num="3"
                title="Fill this Form"
                desc={<>The field labels marked with <span style={{ color: 'var(--ax-danger-500)' }}>*</span> are input fields.</>}
              />
              <div className="goa-form-grid goa-form-grid--3col">
                <FloatingInput
                  id="goa-amc-ben-name"
                  label="Beneficiary Name"
                  required
                  placeholder="Beneficiary name"
                  value={beneficiaryName}
                  onChange={(v) => { setBeneficiaryName(v); clearError('amc_beneficiary_name'); }}
                  error={errors.amc_beneficiary_name}
                />
                <FloatingInput
                  id="goa-amc-ben-contact"
                  label="Beneficiary Contact"
                  type="tel"
                  maxLength={10}
                  required
                  placeholder="10-digit number"
                  value={beneficiaryContact}
                  onChange={(v) => { setBeneficiaryContact(v.replace(/\D/g, '')); clearError('amc_beneficiary_contact'); }}
                  error={errors.amc_beneficiary_contact}
                />
                <div />

                <FloatingInput
                  id="goa-amc-lat"
                  label="Amc Latitude"
                  required
                  placeholder="e.g. 15.2993"
                  value={latitude}
                  onChange={(v) => { setLatitude(v); clearError('amc_latitude'); }}
                  error={errors.amc_latitude}
                />
                <FloatingInput
                  id="goa-amc-lng"
                  label="Amc Longitude"
                  required
                  placeholder="e.g. 74.1240"
                  value={longitude}
                  onChange={(v) => { setLongitude(v); clearError('amc_longitude'); }}
                  error={errors.amc_longitude}
                />
                <div>
                  <button
                    type="button"
                    className="ax-btn ax-btn--secondary goa-gps-cell"
                    style={{ width: '100%' }}
                    onClick={handleDetectGPS}
                    disabled={geoLocating}
                  >
                    <span className="ax-btn__label">{geoLocating ? 'Detecting GPS...' : '📍 Get GPS'}</span>
                  </button>
                </div>

                <div className="goa-form-col-span-full">
                  <FloatingTextarea
                    id="goa-amc-remarks"
                    label="Remarks"
                    required
                    placeholder="Enter Remarks..."
                    value={remarks}
                    onChange={(v) => { setRemarks(v); clearError('amc_remark'); }}
                    error={errors.amc_remark}
                  />
                </div>
              </div>
            </div>

            <hr className="goa-section-divider" />

            {/* Section 4: Photos & Complaint */}
            <div id="sec-4" className="goa-section-block">
              <SectionHeader
                num="4"
                title="AMC Site Images & Complaint"
                desc={`Upload ${IMAGE_COUNT} site service images (Images 1 to ${REQUIRED_IMAGES} are mandatory, up to 5MB each).`}
              />
              <div className="goa-form-grid goa-form-grid--3col">
                {Array.from({ length: IMAGE_COUNT }, (_, i) => i + 1).map((num) => (
                  <FloatingFileInput
                    key={num}
                    id={`goa-amc-image-${num}`}
                    label={`Amc Image ${num}`}
                    required={num <= REQUIRED_IMAGES}
                    accept="image/*"
                    capture="environment"
                    file={images[num - 1]}
                    onChange={(file) => handleFileChange(num - 1, file)}
                    error={errors[`amc_image${num}`]}
                  />
                ))}

                <div className="goa-form-col-span-full goa-complaint-box">
                  <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)', alignItems: 'center', marginBottom: raisedComplaint ? 'var(--ax-space-4)' : 0 }}>
                    <input
                      type="checkbox"
                      id="goa-amc-raised-complaint"
                      checked={raisedComplaint}
                      onChange={(e) => setRaisedComplaint(e.target.checked)}
                      style={{ width: 18, height: 18, cursor: 'pointer' }}
                    />
                    <label htmlFor="goa-amc-raised-complaint" style={{ fontSize: 'var(--ax-text-sm)', fontWeight: 600, cursor: 'pointer' }}>
                      Raised Complaint
                    </label>
                    <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
                      (Check to raise a new complaint and notify via WhatsApp/SMS)
                    </span>
                  </div>

                  {raisedComplaint && (
                    <FloatingTextarea
                      id="goa-amc-complaint"
                      label="Complaint Details"
                      required
                      placeholder="Explain complaint details..."
                      value={complaintText}
                      onChange={(v) => { setComplaintText(v); clearError('complaint'); }}
                      error={errors.complaint}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="goa-form-sticky-bar">
          <span className="ax-badge ax-badge--soft ax-badge--primary ax-badge--pill">
            {paramAmcId ? 'Edit Mode' : 'Update AMC'}
          </span>
          {hasErrors && (
            <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-danger-500)', fontWeight: 600 }}>
              Please fill all required fields before saving.
            </span>
          )}
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)' }}>
            <button type="button" className="ax-btn ax-btn--secondary" onClick={() => navigate('/v/goa-view-srt-amc')} disabled={submitting}>
              <span className="ax-btn__label">Cancel</span>
            </button>
            <button type="submit" disabled={submitting} className="ax-btn ax-btn--primary" style={{ minWidth: 200 }}>
              {submitting ? (
                <>
                  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ animation: 'goa-spin 1s linear infinite' }}><path d="M12 3a9 9 0 1 0 9 9" /></svg>
                  <span className="ax-btn__label">Updating...</span>
                </>
              ) : (
                <>
                  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5l10 -10" /></svg>
                  <span className="ax-btn__label">Update SRT AMC</span>
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
    <div className="goa-section-header">
      <div className="goa-section-title-wrap">
        <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', alignItems: 'center' }}>
          <span className="ax-badge ax-badge--soft ax-badge--primary ax-badge--pill" style={{ fontWeight: 600 }}>
            Section {num} of 4
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
  onChange: (file: File | null) => void;
  error?: string;
}

function FloatingFileInput({ id, label, required, accept, capture, file, onChange, error }: FloatingFileInputProps) {
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
          padding: file ? '12px 16px' : '22px 16px',
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
              JPG, PNG or WEBP up to 5MB
            </div>
          </>
        )}
      </div>

      <FieldFeedback error={error} />
    </div>
  );
}

export default Goa_AMC_SRT_AddData;