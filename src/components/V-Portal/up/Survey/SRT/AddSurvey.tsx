import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { upSurveyService } from '../../up-services';

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
  // Location
  district: '',
  block: '',
  panchayat: '',
  village: '',
  ward_no: '',
  address: '',
  latitude: '',
  longitude: '',
  // Beneficiary
  beneficiary: '',
  phone: '',
  email: '',
  aadhaar_no: '',
  pan_no: '',
  ca_no: '',
  // Electricity & Rooftop
  sanctioned_load: '',
  load_demand: '',
  consumption: '',
  quotation: '',
  rooftop_area: '',
  // Bank
  bank_name: '',
  account_holder: '',
  account_no: '',
  ifsc: '',
  // Remark
  remark: '',
};

type FormKey = keyof typeof INITIAL_FORM;
type FileKey = 'aadhaar_photo' | 'pan_photo' | 'electricity_bill' | 'bank_passbook' | 'rooftop_photo';

const REQUIRED_FIELDS: Partial<Record<FormKey, string>> = {
  district: 'District is required.',
  block: 'Block is required.',
  panchayat: 'Panchayat is required.',
  village: 'Village is required.',
  address: 'Address is required.',
  beneficiary: 'Beneficiary name is required.',
  phone: 'Phone number is required.',
  email: 'Email is required.',
  aadhaar_no: 'Aadhaar number is required.',
  pan_no: 'PAN number is required.',
  ca_no: 'CA number is required.',
  sanctioned_load: 'Sanctioned load is required.',
  load_demand: 'Load demand is required.',
  consumption: 'Consumption is required.',
  rooftop_area: 'Rooftop area is required.',
  bank_name: 'Bank name is required.',
  account_holder: 'Account holder name is required.',
  account_no: 'Account number is required.',
  ifsc: 'IFSC code is required.',
};

const FILE_FIELDS: { key: FileKey; id: string; label: string }[] = [
  { key: 'aadhaar_photo', id: 'up-doc-aadhaar', label: 'Aadhaar Card (Photo)' },
  { key: 'pan_photo', id: 'up-doc-pan', label: 'PAN Card (Photo)' },
  { key: 'electricity_bill', id: 'up-doc-bill', label: 'Electricity Bill (Photo)' },
  { key: 'bank_passbook', id: 'up-doc-bank', label: 'Bank Passbook (Photo)' },
  { key: 'rooftop_photo', id: 'up-doc-rooftop', label: 'Rooftop (Photo)' },
];

const SECTIONS = [
  { id: 'sec-1', num: '1', title: 'Location' },
  { id: 'sec-2', num: '2', title: 'Beneficiary' },
  { id: 'sec-3', num: '3', title: 'Electricity & Rooftop' },
  { id: 'sec-4', num: '4', title: 'Bank Details' },
  { id: 'sec-5', num: '5', title: 'Documents & Remark' },
];



export function UP_Survey_SRT_AddSurvey() {
  const navigate = useNavigate();

  // Cascading location lists
  const [districts, setDistricts] = useState<string[]>([]);
  const [blocks, setBlocks] = useState<string[]>([]);
  const [panchayats, setPanchayats] = useState<string[]>([]);
  const [villages, setVillages] = useState<string[]>([]);

  const [formData, setFormData] = useState({ ...INITIAL_FORM });
  const [files, setFiles] = useState<Record<FileKey, File | null>>({
    aadhaar_photo: null,
    pan_photo: null,
    electricity_bill: null,
    bank_passbook: null,
    rooftop_photo: null,
  });

  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});

  const { district, block, panchayat } = formData;

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

  // Districts on mount
  useEffect(() => {
    upSurveyService.getSrtDistricts().then((dists) => setDistricts(dists));
  }, []);

  // Cascading blocks
  useEffect(() => {
    if (district) {
      upSurveyService.getSrtBlocks(district).then((b) => setBlocks(b));
    } else {
      setBlocks([]);
    }
    setFormData((prev) => ({ ...prev, block: '', panchayat: '', village: '' }));
  }, [district]);

  // Cascading panchayats
  useEffect(() => {
    if (district && block) {
      upSurveyService.getSrtPanchayats(district, block).then((p) => setPanchayats(p));
    } else {
      setPanchayats([]);
    }
    setFormData((prev) => ({ ...prev, panchayat: '', village: '' }));
  }, [district, block]);

  // Cascading villages
  useEffect(() => {
    if (district && block && panchayat) {
      upSurveyService.getSrtVillages(district, block, panchayat).then((v) => setVillages(v));
    } else {
      setVillages([]);
    }
    setFormData((prev) => ({ ...prev, village: '' }));
  }, [district, block, panchayat]);

  // GPS detection
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Location permission denied. Allow location access in your browser/site settings, then retry.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          latitude: pos.coords.latitude.toFixed(7),
          longitude: pos.coords.longitude.toFixed(7),
        }));
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        setErrorMsg(`Location permission denied (${err.message}). Allow location access in your browser/site settings, then retry.`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Validation
  const validate = () => {
    const errs: Record<string, string[]> = {};
    (Object.keys(REQUIRED_FIELDS) as FormKey[]).forEach((key) => {
      if (!formData[key].trim()) errs[key] = [REQUIRED_FIELDS[key] as string];
    });
    FILE_FIELDS.forEach(({ key, label }) => {
      if (!files[key]) errs[key] = [`${label} is required.`];
    });
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
      Object.entries(formData).forEach(([key, val]) => fd.append(key, val ?? ''));
      FILE_FIELDS.forEach(({ key }) => {
        const file = files[key];
        if (file) fd.append(key, file);
      });

      const res = await upSurveyService.storeSrtSurvey(fd);
      if (res.status) {
        setSuccessMsg(res.message || 'UP SRT Survey Details submitted successfully!');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => {
          navigate('/v/up/srt-surveys/view');
        }, 1200);
      } else {
        setErrorMsg(res.message || 'Failed to submit survey.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error occurred while saving survey.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="up-single-card-form">
      <style>{SINGLE_CARD_FORM_CSS}</style>

      <PageHead
        title="Create UP SRT Survey"
        subtitle={
          <span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>
            UP SRT Survey Details — Fields marked with * are required.
          </span>
        }
        breadcrumbs={[
          { label: 'Home', href: '/v' },
          { label: 'UP SRT Survey', href: '/v/up/srt-surveys/view' },
          { label: 'Add Survey' },
        ]}
        actions={
          <Link to="/v/up/srt-surveys/view" className="ax-btn ax-btn--secondary ax-btn--pill">
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
              <h2 className="ax-card__title" style={{ margin: 0 }}>UP SRT Survey Details</h2>
              <p className="ax-card__subtitle" style={{ margin: '4px 0 0' }}>
                All survey fields organized inside one main card across 5 dedicated sections.
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
            {/* Section 1: Location Details */}
            <div id="sec-1" className="up-section-block">
              <SectionHeader num="1" total={5} title="Location Details" desc="District, block, panchayat, village and GPS coordinates." />
              <div className="up-form-grid up-form-grid--3col">
                <FloatingSelect id="up-district" label="District" required placeholder="Select District" options={opts(districts)} {...f('district')} />
                <FloatingSelect id="up-block" label="Block" required placeholder="Select Block" options={opts(blocks)} disabled={!district} {...f('block')} />
                <FloatingSelect id="up-panchayat" label="Panchayat" required placeholder="Select Panchayat" options={opts(panchayats)} disabled={!block} {...f('panchayat')} />
                <FloatingSelect id="up-village" label="Village" required placeholder="Select Village" options={opts(villages)} disabled={!panchayat} {...f('village')} />
                <FloatingInput id="up-ward" label="Ward No." placeholder="Enter ward number" {...f('ward_no')} />
                <FloatingInput id="up-address" label="Address" required placeholder="Enter full address" {...f('address')} />
                <FloatingInput id="up-lat" label="Latitude" placeholder="e.g. 28.6031650" {...f('latitude')} />
                <FloatingInput id="up-lng" label="Longitude" placeholder="e.g. 77.3573570" {...f('longitude')} />
                <div>
                  <button type="button" className="ax-btn ax-btn--secondary up-gps-cell" style={{ width: '100%' }} onClick={handleGetLocation} disabled={locating}>
                    <span className="ax-btn__label">{locating ? 'Detecting GPS...' : '📍 Get GPS'}</span>
                  </button>
                </div>
              </div>
            </div>

            <hr className="up-section-divider" />

            {/* Section 2: Beneficiary Details */}
            <div id="sec-2" className="up-section-block">
              <SectionHeader
                num="2"
                total={5}
                title="Beneficiary Details"
                desc={<>The field labels marked with <span style={{ color: 'var(--ax-danger-500)' }}>*</span> are input fields.</>}
              />
              <div className="up-form-grid up-form-grid--3col">
                <FloatingInput id="up-beneficiary" label="Beneficiary Name" required placeholder="Enter beneficiary name" {...f('beneficiary')} />
                <FloatingInput id="up-phone" label="Phone No." type="tel" required placeholder="Enter 10-digit mobile number" {...f('phone')} />
                <FloatingInput id="up-email" label="Email" type="email" required placeholder="Enter email address" {...f('email')} />
                <FloatingInput id="up-aadhaar" label="Aadhaar No." required placeholder="Enter 12-digit Aadhaar number" {...f('aadhaar_no')} />
                <FloatingInput
                  id="up-pan"
                  label="PAN No."
                  required
                  placeholder="e.g. ABCDE1234F"
                  {...f('pan_no')}
                  onChange={(v) => setField('pan_no', v.toUpperCase())}
                />
                <FloatingInput id="up-ca" label="CA No." required placeholder="Enter CA number" {...f('ca_no')} />
              </div>
            </div>

            <hr className="up-section-divider" />

            {/* Section 3: Electricity & Rooftop */}
            <div id="sec-3" className="up-section-block">
              <SectionHeader num="3" total={5} title="Electricity & Rooftop Details" desc="Load, consumption and rooftop data." />
              <div className="up-form-grid up-form-grid--3col">
                <FloatingInput id="up-sanctioned" label="Sanctioned Load (kW)" required placeholder="e.g. 5" {...f('sanctioned_load')} />
                <FloatingInput id="up-demand" label="Load Demand (kW)" required placeholder="e.g. 5" {...f('load_demand')} />
                <FloatingInput id="up-consumption" label="Consumption (Units/Month)" required placeholder="e.g. 2000" {...f('consumption')} />
                <FloatingInput id="up-quotation" label="Quotation (₹)" placeholder="e.g. 1200000" {...f('quotation')} />
                <FloatingInput id="up-rooftop-area" label="Rooftop Area (Sq. Ft.)" required placeholder="e.g. 123.4" {...f('rooftop_area')} />
              </div>
            </div>

            <hr className="up-section-divider" />

            {/* Section 4: Bank Details */}
            <div id="sec-4" className="up-section-block">
              <SectionHeader num="4" total={5} title="Bank Details" desc="Beneficiary bank account information." />
              <div className="up-form-grid up-form-grid--3col">
                <FloatingInput id="up-bank" label="Bank Name" required placeholder="e.g. State Bank of India" {...f('bank_name')} />
                <FloatingInput id="up-holder" label="Account Holder Name" required placeholder="Enter account holder name" {...f('account_holder')} />
                <FloatingInput id="up-account" label="Account No." required placeholder="Enter account number" {...f('account_no')} />
                <FloatingInput
                  id="up-ifsc"
                  label="IFSC Code"
                  required
                  placeholder="e.g. SBIN0001234"
                  {...f('ifsc')}
                  onChange={(v) => setField('ifsc', v.toUpperCase())}
                />
              </div>
            </div>

            <hr className="up-section-divider" />

            {/* Section 5: Documents & Remark */}
            <div id="sec-5" className="up-section-block">
              <SectionHeader num="5" total={5} title="Documents & Remark" desc="Upload document photos (up to 5MB each)." />
              <div className="up-form-grid up-form-grid--3col">
                {FILE_FIELDS.map(({ key, id, label }) => (
                  <FloatingFileInput
                    key={key}
                    id={id}
                    label={label}
                    required
                    accept="image/*"
                    file={files[key]}
                    onChange={(file) => handleFileChange(key, file)}
                    error={validationErrors[key]?.[0]}
                  />
                ))}
                <div className="up-form-col-span-full">
                  <FloatingTextarea id="up-remark" label="Remark (if any)" placeholder="Enter remark (if any)..." {...f('remark')} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="up-form-sticky-bar">
          <span className="ax-badge ax-badge--soft ax-badge--primary ax-badge--pill">New Survey</span>
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)' }}>
            <button type="button" className="ax-btn ax-btn--secondary" onClick={() => navigate('/v/up/srt-surveys/view')} disabled={submitting}>
              <span className="ax-btn__label">Cancel</span>
            </button>
            <button type="submit" disabled={submitting} className="ax-btn ax-btn--primary" style={{ minWidth: 200 }}>
              {submitting ? (
                <>
                  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ animation: 'up-spin 1s linear infinite' }}><path d="M12 3a9 9 0 1 0 9 9" /></svg>
                  <span className="ax-btn__label">Submitting...</span>
                </>
              ) : (
                <>
                  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5l10 -10" /></svg>
                  <span className="ax-btn__label">Submit SRT Survey</span>
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

export const UPSurveySRTAdd = UP_Survey_SRT_AddSurvey;
export default UP_Survey_SRT_AddSurvey;

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