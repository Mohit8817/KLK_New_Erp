import { useState, useRef, useId } from 'react';
import { Link } from 'react-router-dom';
import { PageHead } from '../../shell/PageHead';

// CSS for Unified Single-Card Layout with Floating Labels & Section Dividers
const SINGLE_CARD_FORM_CSS = `
.jammu-single-card-form .ax-card {
  border: 1px solid var(--ax-border);
  border-radius: var(--ax-radius-xl);
  background: var(--ax-surface-solid);
  box-shadow: var(--ax-shadow-sm);
  overflow: hidden;
}

.jammu-single-card-form .ax-card__header {
  padding: var(--ax-space-5) var(--ax-space-6);
  border-bottom: 1px solid var(--ax-border-subtle);
  background: var(--ax-surface-subtle);
  display: flex;
  flex-direction: column;
  gap: var(--ax-space-4);
}

.jammu-single-card-form .ax-card__body {
  padding: var(--ax-space-6);
}

/* Quick Section Nav Pills inside Single Card */
.jammu-section-pills {
  display: flex;
  gap: var(--ax-space-2);
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: thin;
}
.jammu-section-pill-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: var(--ax-radius-pill);
  font-size: var(--ax-text-xs);
  font-weight: 500;
  white-space: nowrap;
  background: var(--ax-surface-solid);
  border: 1px solid var(--ax-border);
  color: var(--ax-text);
  cursor: pointer;
  transition: all var(--ax-motion-fast) var(--ax-ease-standard);
  text-decoration: none;
}
.jammu-section-pill-btn:hover {
  border-color: var(--ax-accent);
  color: var(--ax-accent);
  background: color-mix(in srgb, var(--ax-accent) 6%, var(--ax-surface-solid));
}
.jammu-section-pill-btn .pill-num {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--ax-surface-subtle);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
}

/* Section Block inside Single Card */
.jammu-section-block {
  padding-top: var(--ax-space-2);
}
.jammu-section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: var(--ax-space-2);
  margin-bottom: var(--ax-space-5);
  padding-bottom: var(--ax-space-3);
  border-bottom: 1px solid var(--ax-border-subtle);
}
.jammu-section-title-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.jammu-section-divider {
  border: 0;
  border-top: 1px dashed var(--ax-border);
  margin: var(--ax-space-8) 0 var(--ax-space-6);
}

/* Floating Label Core */
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
  transition: border-color var(--ax-motion-fast) var(--ax-ease-standard),
              box-shadow var(--ax-motion-fast) var(--ax-ease-standard);
}
.ax-float__input::placeholder {
  color: transparent;
}
.ax-float__input:focus {
  border-color: var(--ax-accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--ax-accent) 20%, transparent);
}

/* Floating Label Text */
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
  transition: top var(--ax-motion-fast) var(--ax-ease-standard),
              font-size var(--ax-motion-fast) var(--ax-ease-standard),
              color var(--ax-motion-fast) var(--ax-ease-standard);
  z-index: 2;
  white-space: nowrap;
  max-width: calc(100% - 24px);
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Active Floating State (focus, filled, select, date, file) */
.ax-float__input:focus + .ax-float__label,
.ax-float__input:not(:placeholder-shown) + .ax-float__label,
.ax-float--select .ax-float__label,
.ax-float--date .ax-float__label,
.ax-float--file .ax-float__label,
.ax-float--active .ax-float__label {
  top: 0;
  transform: translateY(-50%);
  font-size: var(--ax-text-2xs);
  font-weight: 500;
  color: var(--ax-text-muted);
}
.ax-float__input:focus + .ax-float__label {
  color: var(--ax-accent);
}

/* Validation States & Status Colors */
.ax-float__input.is-invalid {
  border-color: var(--ax-danger-500) !important;
}
.ax-float__input.is-invalid:focus {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--ax-danger-500) 24%, transparent) !important;
}
.ax-float__input.is-invalid + .ax-float__label,
.ax-float--file.is-invalid .ax-float__label {
  color: var(--ax-danger-500) !important;
}

.ax-float__input.is-valid {
  border-color: var(--ax-success-500) !important;
}
.ax-float__input.is-valid:focus {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--ax-success-500) 24%, transparent) !important;
}
.ax-float__input.is-valid + .ax-float__label,
.ax-float--file.is-valid .ax-float__label {
  color: var(--ax-success-500) !important;
}

/* Textarea Floating */
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

/* Custom File Upload with Floating Label */
.ax-float--file .ax-file-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ax-space-3);
  height: 46px;
  padding: 6px 12px;
  background: var(--ax-surface-solid);
  border: 1px solid var(--ax-border);
  border-radius: var(--ax-radius-md);
  cursor: pointer;
  transition: all var(--ax-motion-fast) var(--ax-ease-standard);
}
.ax-float--file .ax-file-box:hover {
  border-color: var(--ax-border-strong);
  background: var(--ax-surface-subtle);
}
.ax-float--file.is-invalid .ax-file-box {
  border-color: var(--ax-danger-500) !important;
}
.ax-float--file.is-valid .ax-file-box {
  border-color: var(--ax-success-500) !important;
}

/* Feedback Helper Messages */
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
.ax-field-feedback--success {
  color: var(--ax-success-500);
}

/* Form Responsive Grid */
.jammu-form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--ax-space-4) var(--ax-space-4);
}
@media (min-width: 1024px) {
  .jammu-form-grid--3col {
    grid-template-columns: repeat(3, 1fr);
  }
  .jammu-form-grid--4col {
    grid-template-columns: repeat(4, 1fr);
  }
}
.jammu-form-col-span-full {
  grid-column: 1 / -1;
}

/* Sticky Action Footer */
.jammu-form-sticky-bar {
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
`;

// Dropdown constants tailored for Jammu 70MW SRT Project
const JAMMU_DISTRICTS = [
  'Jammu',
  'Kathua',
  'Samba',
  'Udhampur',
  'Rajouri',
  'Poonch',
  'Doda',
  'Ramban',
  'Reasi',
  'Kishtwar',
];

const SRT_PHASES = [
  'Phase 1',
  'Phase 2',
  'Phase 3',
  'Phase 4',
  'Phase 5',
  'Phase 6',
  'Phase 7',
  'Phase 8',
  'Phase NA',
];

const INSTALLATION_VENDORS = [
  'Tata Power Solar Systems',
  'Waaree Energies Ltd',
  'Adani Solar / Mundra Solar',
  'Vikram Solar Limited',
  'Goldi Solar Pvt Ltd',
  'KLK Solar Tech',
  'SunPower Infra',
];

const DEPARTMENTS = [
  'JAKEDA (J&K Energy Development Agency)',
  'JPDCL (Jammu Power Distribution Corp Ltd)',
  'PDD (Power Development Department)',
  'Higher Education Department J&K',
  'School Education Department J&K',
  'Health & Medical Education Department',
  'PWD (R&B) Jammu',
  'Agriculture Production Department',
  'Forest, Ecology & Environment',
  'Housing & Urban Development Department',
];

// Required fields list
const REQUIRED_FIELDS = [
  'district',
  'location',
  'volume',
  'siteName',
  'department',
  'siteCode',
  'feasibleSite',
  'workOrderNo',
  'workOrderDate',
  'systemImage',
] as const;

type RequiredFieldKey = typeof REQUIRED_FIELDS[number];

interface FormState {
  // 1. Site Details
  district: string;
  location: string;
  volume: string;
  siteName: string;
  department: string;
  siteCode: string;
  feasibleSite: string;

  // 2. Work Order Details
  workOrderNo: string;
  workOrderDate: string;
  loaNo: string;
  phase: string;
  sanctionLoadKwp: string;
  plantSanctionKwp: string;
  connectionPhase: string;
  caNo: string;

  // 3. Payment & AMC Details
  payment70: string;
  payment70Doc: File | null;
  payment10: string;
  payment10Doc: File | null;
  amc1: string;
  amc2: string;
  amc3: string;
  amc4: string;
  amc5: string;

  // 4. Material & Installation
  materialStatus: string;
  materialDispatchDate: string;
  installationStatus: string;
  installationVendor: string;
  installationDate: string;
  contactPerson: string;
  contactNo: string;
  installationRemarks: string;

  // 5. Hardware & Metering
  panelNo: string;
  panelImage: File | null;
  systemImage: File | null;
  inverterNo: string;
  inverterImage: File | null;
  netMeterInstall: string;
  solarMeterNo: string;
  netSmartMeterNo: string;
  netSmartMeterImage: File | null;

  // 6. RMS & Telemetry
  rmsStatus: string;
  rmsLogerNo: string;
  logerImage: File | null;
  simNo: string;
  simFile: File | null;
  latitude: string;
  longitude: string;

  // 7. Verification & Claims
  installationVerify: string;
  claimRaised: string;
  claimInvoice: File | null;
  claimAmount: string;
  installerPay80Status: string;
  installerPay80Amount: string;
  installerPay80Date: string;
  installationDocSubmit: string;
  installerPay20Status: string;
  installerPay20Amount: string;
  installerPay20Date: string;
}

const INITIAL_FORM_STATE: FormState = {
  district: '',
  location: '',
  volume: '1',
  siteName: '',
  department: '',
  siteCode: '',
  feasibleSite: '',
  workOrderNo: '',
  workOrderDate: '',
  loaNo: '',
  phase: '',
  sanctionLoadKwp: '',
  plantSanctionKwp: '',
  connectionPhase: '',
  caNo: '',
  payment70: '',
  payment70Doc: null,
  payment10: '',
  payment10Doc: null,
  amc1: '',
  amc2: '',
  amc3: '',
  amc4: '',
  amc5: '',
  materialStatus: '',
  materialDispatchDate: '',
  installationStatus: '',
  installationVendor: '',
  installationDate: '',
  contactPerson: '',
  contactNo: '',
  installationRemarks: '',
  panelNo: '',
  panelImage: null,
  systemImage: null,
  inverterNo: '',
  inverterImage: null,
  netMeterInstall: '',
  solarMeterNo: '',
  netSmartMeterNo: '',
  netSmartMeterImage: null,
  rmsStatus: '',
  rmsLogerNo: '',
  logerImage: null,
  simNo: '',
  simFile: null,
  latitude: '',
  longitude: '',
  installationVerify: '',
  claimRaised: '',
  claimInvoice: null,
  claimAmount: '',
  installerPay80Status: '',
  installerPay80Amount: '',
  installerPay80Date: '',
  installationDocSubmit: '',
  installerPay20Status: '',
  installerPay20Amount: '',
  installerPay20Date: '',
};

export function AddJammuSRT70MWSingleCard() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM_STATE);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const firstErrorRef = useRef<HTMLDivElement>(null);

  // Validate a single field
  const validateField = (name: string, value: unknown): string => {
    if (REQUIRED_FIELDS.includes(name as RequiredFieldKey)) {
      if (name === 'systemImage') {
        if (!value) return 'System image is required.';
      } else if (!value || String(value).trim() === '') {
        return 'This field is required.';
      }
    }

    if (name === 'contactNo' && value && String(value).trim() !== '') {
      const cleaned = String(value).replace(/\D/g, '');
      if (cleaned.length < 10) return 'Enter a valid 10-digit phone number.';
    }

    if (name === 'latitude' && value && String(value).trim() !== '') {
      const lat = parseFloat(String(value));
      if (isNaN(lat) || lat < -90 || lat > 90) return 'Latitude must be between -90 and 90.';
    }

    if (name === 'longitude' && value && String(value).trim() !== '') {
      const lng = parseFloat(String(value));
      if (isNaN(lng) || lng < -180 || lng > 180) return 'Longitude must be between -180 and 180.';
    }

    return '';
  };

  const handleChange = (name: keyof FormState, value: unknown) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    const err = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: err }));
  };

  const handleBlur = (name: keyof FormState) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    const err = validateField(name, form[name]);
    setErrors((prev) => ({ ...prev, [name]: err }));
  };

  const getFieldStatus = (name: keyof FormState): { className: string; isValid: boolean; isInvalid: boolean } => {
    const isFieldTouched = touched[name] || submitted;
    const error = errors[name];
    const val = form[name];

    if (!isFieldTouched) return { className: '', isValid: false, isInvalid: false };

    if (error) {
      return { className: 'is-invalid', isValid: false, isInvalid: true };
    }

    if (val !== null && val !== undefined && String(val).trim() !== '') {
      return { className: 'is-valid', isValid: true, isInvalid: false };
    }

    return { className: '', isValid: false, isInvalid: false };
  };

  const handleFillDemo = () => {
    setForm({
      district: 'Jammu',
      location: 'Civil Secretariat Complex, Jammu Tawi',
      volume: '1',
      siteName: 'Jammu High Court Administration Block',
      department: 'PDD (Power Development Department)',
      siteCode: 'JAM-SRT-70M-0382',
      feasibleSite: 'Yes',
      workOrderNo: 'WO-JAM-001 (Urban Rooftop Tier-1)',
      workOrderDate: '2026-04-15',
      loaNo: 'LOA/JAKEDA/70MW/2026/89',
      phase: 'Phase 3',
      sanctionLoadKwp: '25.00',
      plantSanctionKwp: '20.00',
      connectionPhase: 'Three Phase',
      caNo: 'CA-JPDCL-9823410',
      payment70: 'Approved',
      payment70Doc: new File(['mock content'], 'Payment_70_Approval_Receipt.pdf', { type: 'application/pdf' }),
      payment10: 'Pending',
      payment10Doc: null,
      amc1: 'Due',
      amc2: 'Pending',
      amc3: 'Pending',
      amc4: 'Pending',
      amc5: 'Pending',
      materialStatus: 'Material Dispatched',
      materialDispatchDate: '2026-05-10',
      installationStatus: 'In Progress',
      installationVendor: 'Tata Power Solar Systems',
      installationDate: '2026-06-02',
      contactPerson: 'Er. Rajesh Choudhary',
      contactNo: '9419123456',
      installationRemarks: 'Mounting structure completed on RCC roof. Inverter setup in basement electrical room. Cable routing verified with DISCOM engineer.',
      panelNo: 'TP-540-W-88912',
      panelImage: new File(['mock content'], 'Solar_Panel_Array.jpg', { type: 'image/jpeg' }),
      systemImage: new File(['mock content'], 'SRT_70MW_System_Overview.jpg', { type: 'image/jpeg' }),
      inverterNo: 'INV-HUA-2026-904',
      inverterImage: new File(['mock content'], 'Inverter_Wiring_Box.jpg', { type: 'image/jpeg' }),
      netMeterInstall: 'Installed',
      solarMeterNo: 'SLR-MTR-4401',
      netSmartMeterNo: 'SMRT-JPDCL-8921',
      netSmartMeterImage: new File(['mock content'], 'Smart_Meter_Screen.jpg', { type: 'image/jpeg' }),
      rmsStatus: 'Active / Online',
      rmsLogerNo: 'RMS-LOG-77218',
      logerImage: new File(['mock content'], 'RMS_Device.jpg', { type: 'image/jpeg' }),
      simNo: '8991204018823194',
      simFile: new File(['mock content'], 'Sim_Activation_Form.pdf', { type: 'application/pdf' }),
      latitude: '32.7266',
      longitude: '74.8570',
      installationVerify: 'Verified',
      claimRaised: 'Under Review',
      claimInvoice: new File(['mock content'], 'Tax_Invoice_70MW_0382.pdf', { type: 'application/pdf' }),
      claimAmount: '985000',
      installerPay80Status: 'Approved',
      installerPay80Amount: '788000',
      installerPay80Date: '2026-06-20',
      installationDocSubmit: 'Submitted',
      installerPay20Status: 'Pending',
      installerPay20Amount: '197000',
      installerPay20Date: '',
    });
    setErrors({});
    setTouched({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    const newErrors: Record<string, string> = {};
    let hasError = false;

    REQUIRED_FIELDS.forEach((key) => {
      const err = validateField(key, form[key]);
      if (err) {
        newErrors[key] = err;
        hasError = true;
      }
    });

    ['contactNo', 'latitude', 'longitude'].forEach((key) => {
      const err = validateField(key, form[key as keyof FormState]);
      if (err) {
        newErrors[key] = err;
        hasError = true;
      }
    });

    setErrors(newErrors);

    if (hasError) {
      setTimeout(() => {
        const firstErr = document.querySelector('.is-invalid');
        if (firstErr) {
          firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
          (firstErr as HTMLElement).focus?.();
        }
      }, 50);
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 900);
  };

  const handleReset = () => {
    setForm(INITIAL_FORM_STATE);
    setTouched({});
    setErrors({});
    setSubmitted(false);
    setSubmitSuccess(false);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const totalRequired = REQUIRED_FIELDS.length;
  const completedRequired = REQUIRED_FIELDS.filter((f) => {
    const v = form[f];
    return v !== null && v !== undefined && String(v).trim() !== '';
  }).length;
  const progressPercent = Math.round((completedRequired / totalRequired) * 100);

  return (
    <div className="jammu-single-card-form">
      <style>{SINGLE_CARD_FORM_CSS}</style>

      {/* Header */}
      <PageHead
        title="Add Jammu SRT 70M"
        subtitle={
          <span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>
            Single Main Card View · Section 1 to 7 Sequential Breakdown · Jammu 70MW Grid-Connected Scheme
          </span>
        }
        actions={
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
            <Link to="/jammu/add-srt-70mw" className="ax-btn ax-btn--secondary ax-btn--pill" title="Switch to multi-card view">
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z" /><path d="M4 12l16 0" /></svg>
              <span className="ax-btn__label">Multi-Card View</span>
            </Link>
            <Link to="/jammu/dashboard" className="ax-btn ax-btn--secondary ax-btn--pill">
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l14 0" /><path d="M5 12l6 6" /><path d="M5 12l6 -6" /></svg>
              <span className="ax-btn__label">Jammu Dashboard</span>
            </Link>
            <button type="button" onClick={handleFillDemo} className="ax-btn ax-btn--ghost" title="Auto-fill realistic Jammu site data">
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h4l10.5 -10.5a1.5 1.5 0 0 0 -4 -4l-10.5 10.5v4" /><path d="M13.5 6.5l4 4" /></svg>
              <span className="ax-btn__label">Fill Sample Data</span>
            </button>
            <button type="button" onClick={handleReset} className="ax-btn ax-btn--ghost ax-btn--icon" title="Reset Form">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" /><path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" /></svg>
            </button>
          </div>
        }
      />

      {/* Success Alert Banner */}
      {submitSuccess && (
        <div className="ax-alert ax-alert--success" role="status" style={{ marginBottom: 'var(--ax-space-6)' }}>
          <span className="ax-alert__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5l10 -10" /></svg>
          </span>
          <div className="ax-alert__content">
            <h3 className="ax-alert__title" style={{ fontSize: 'var(--ax-text-base)', fontWeight: 600 }}>
              Jammu SRT 70MW Record Submitted Successfully!
            </h3>
            <p className="ax-alert__message" style={{ margin: '4px 0 0' }}>
              Site <strong>{form.siteCode || 'JAM-SRT-001'}</strong> ({form.siteName || 'Solar Rooftop Site'}) has been registered under <strong>{form.district}</strong> district. All 59 field parameters have been recorded into the single-card registry.
            </p>
          </div>
          <div className="ax-alert__actions">
            <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" onClick={() => setSubmitSuccess(false)}>
              <span className="ax-btn__label">Dismiss</span>
            </button>
            <Link to="/jammu/dashboard" className="ax-btn ax-btn--primary ax-btn--sm">
              <span className="ax-btn__label">View on Dashboard</span>
            </Link>
          </div>
        </div>
      )}

      {/* Form Validation Error Summary if attempted and has errors */}
      {submitted && Object.keys(errors).filter((k) => errors[k]).length > 0 && (
        <div ref={firstErrorRef} className="ax-alert ax-alert--danger" role="alert" style={{ marginBottom: 'var(--ax-space-6)' }}>
          <span className="ax-alert__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4" /><path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0" /><path d="M12 16h.01" /></svg>
          </span>
          <div className="ax-alert__content">
            <h4 className="ax-alert__title" style={{ fontWeight: 600 }}>Please Complete All Required Fields (*)</h4>
            <p className="ax-alert__message" style={{ margin: '4px 0 0' }}>
              There are {Object.keys(errors).filter((k) => errors[k]).length} mandatory fields needing attention before this Jammu 70MW record can be saved.
            </p>
          </div>
        </div>
      )}

      {/* Main Single Card Form */}
      <form onSubmit={handleSubmit} noValidate>
        <div className="ax-card">
          
          {/* Card Header with Title and Section Stepper Pills */}
          <div className="ax-card__header">
            <div className="ax-cluster" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--ax-space-3)' }}>
              <div>
                <span className="ax-card__eyebrow">Unified Card Architecture</span>
                <h2 className="ax-card__title" style={{ margin: 0 }}>Add Jammu SRT 70MW Form</h2>
                <p className="ax-card__subtitle" style={{ margin: '4px 0 0' }}>
                  All 59 input fields organized inside one main card across 7 dedicated sections.
                </p>
              </div>

              <span className="ax-badge ax-badge--soft ax-badge--primary ax-badge--pill" style={{ fontWeight: 600 }}>
                Completion: {completedRequired} / {totalRequired} ({progressPercent}%)
              </span>
            </div>

            {/* Quick Section Jump Navigator */}
            <div className="jammu-section-pills" role="navigation" aria-label="Jump to section">
              {[
                { id: 'sec-1', num: '1', title: 'Site Details' },
                { id: 'sec-2', num: '2', title: 'Work Order' },
                { id: 'sec-3', num: '3', title: 'Financials & AMC' },
                { id: 'sec-4', num: '4', title: 'Materials & Install' },
                { id: 'sec-5', num: '5', title: 'Hardware & Meters' },
                { id: 'sec-6', num: '6', title: 'RMS Telemetry' },
                { id: 'sec-7', num: '7', title: 'Claims & Payouts' },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => scrollToSection(s.id)}
                  className="jammu-section-pill-btn"
                >
                  <span className="pill-num">{s.num}</span>
                  <span>{s.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Card Body containing all 7 sections */}
          <div className="ax-card__body">

            {/* ========================================================
             * Section 1 of 7: Site & Administrative Details
             * ======================================================== */}
            <div id="sec-1" className="jammu-section-block">
              <div className="jammu-section-header">
                <div className="jammu-section-title-wrap">
                  <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', alignItems: 'center' }}>
                    <span className="ax-badge ax-badge--soft ax-badge--primary ax-badge--pill" style={{ fontWeight: 600 }}>
                      Section 1 of 7
                    </span>
                    <h3 style={{ fontSize: 'var(--ax-text-base)', fontWeight: 600, margin: 0, color: 'var(--ax-text-strong)' }}>
                      Site &amp; Administrative Details
                    </h3>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
                    Core location, nodal department and site feasibility status.
                  </p>
                </div>
              </div>

              <div className="jammu-form-grid jammu-form-grid--3col">
                {/* District * */}
                <div>
                  <FloatingSelect
                    id="sc-district"
                    label="District"
                    required
                    placeholder="Select District"
                    value={form.district}
                    options={JAMMU_DISTRICTS}
                    onChange={(val) => handleChange('district', val)}
                    onBlur={() => handleBlur('district')}
                    status={getFieldStatus('district')}
                    error={errors.district}
                  />
                </div>

                {/* Location * */}
                <div>
                  <FloatingInput
                    id="sc-location"
                    label="Location"
                    required
                    placeholder="Enter Location"
                    value={form.location}
                    onChange={(val) => handleChange('location', val)}
                    onBlur={() => handleBlur('location')}
                    status={getFieldStatus('location')}
                    error={errors.location}
                  />
                </div>

                {/* Volume * */}
                <div>
                  <FloatingInput
                    id="sc-volume"
                    label="Volume"
                    type="number"
                    min={1}
                    required
                    placeholder="1"
                    value={form.volume}
                    onChange={(val) => handleChange('volume', val)}
                    onBlur={() => handleBlur('volume')}
                    status={getFieldStatus('volume')}
                    error={errors.volume}
                  />
                </div>

                {/* Name of the Site * */}
                <div className="jammu-form-col-span-full">
                  <FloatingInput
                    id="sc-site-name"
                    label="Name of the Site"
                    required
                    placeholder="Enter Name of the Site"
                    value={form.siteName}
                    onChange={(val) => handleChange('siteName', val)}
                    onBlur={() => handleBlur('siteName')}
                    status={getFieldStatus('siteName')}
                    error={errors.siteName}
                  />
                </div>

                {/* Department * */}
                <div>
                  <FloatingInputWithDatalist
                    id="sc-department"
                    label="Department"
                    required
                    placeholder="Enter Department"
                    value={form.department}
                    suggestions={DEPARTMENTS}
                    onChange={(val) => handleChange('department', val)}
                    onBlur={() => handleBlur('department')}
                    status={getFieldStatus('department')}
                    error={errors.department}
                  />
                </div>

                {/* Site Code * */}
                <div>
                  <FloatingInput
                    id="sc-site-code"
                    label="Site Code"
                    required
                    placeholder="Enter Site Code"
                    value={form.siteCode}
                    onChange={(val) => handleChange('siteCode', val)}
                    onBlur={() => handleBlur('siteCode')}
                    status={getFieldStatus('siteCode')}
                    error={errors.siteCode}
                  />
                </div>

                {/* Feasible Site * */}
                <div>
                  <FloatingSelect
                    id="sc-feasible-site"
                    label="Feasible Site"
                    required
                    placeholder="-- Select --"
                    value={form.feasibleSite}
                    options={['Yes', 'No', 'Conditional Feasible']}
                    onChange={(val) => handleChange('feasibleSite', val)}
                    onBlur={() => handleBlur('feasibleSite')}
                    status={getFieldStatus('feasibleSite')}
                    error={errors.feasibleSite}
                  />
                </div>
              </div>
            </div>

            <hr className="jammu-section-divider" />

            {/* ========================================================
             * Section 2 of 7: Work Order & Sanction Details
             * ======================================================== */}
            <div id="sec-2" className="jammu-section-block">
              <div className="jammu-section-header">
                <div className="jammu-section-title-wrap">
                  <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', alignItems: 'center' }}>
                    <span className="ax-badge ax-badge--soft ax-badge--primary ax-badge--pill" style={{ fontWeight: 600 }}>
                      Section 2 of 7
                    </span>
                    <h3 style={{ fontSize: 'var(--ax-text-base)', fontWeight: 600, margin: 0, color: 'var(--ax-text-strong)' }}>
                      Work Order &amp; Sanction Details
                    </h3>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
                    Work order contract, sanction loads, and electrical grid phase assignment.
                  </p>
                </div>
              </div>

              <div className="jammu-form-grid jammu-form-grid--4col">
                {/* Work Order No.* */}
                <div>
                  <FloatingInput
                    id="sc-wo-no"
                    label="Work Order No."
                    required
                    placeholder="Enter Work Order No."
                    value={form.workOrderNo}
                    onChange={(val) => handleChange('workOrderNo', val)}
                    onBlur={() => handleBlur('workOrderNo')}
                    status={getFieldStatus('workOrderNo')}
                    error={errors.workOrderNo}
                  />
                </div>

                {/* Work Order Date* */}
                <div>
                  <FloatingDateInput
                    id="sc-wo-date"
                    label="Work Order Date"
                    required
                    value={form.workOrderDate}
                    onChange={(val) => handleChange('workOrderDate', val)}
                    onBlur={() => handleBlur('workOrderDate')}
                    status={getFieldStatus('workOrderDate')}
                    error={errors.workOrderDate}
                  />
                </div>

                {/* LOA No. */}
                <div>
                  <FloatingInput
                    id="sc-loa-no"
                    label="LOA No."
                    placeholder="Enter LOA Number"
                    value={form.loaNo}
                    onChange={(val) => handleChange('loaNo', val)}
                    onBlur={() => handleBlur('loaNo')}
                    status={getFieldStatus('loaNo')}
                  />
                </div>

                {/* Phase */}
                <div>
                  <FloatingSelect
                    id="sc-phase"
                    label="Phase"
                    placeholder="-- Select --"
                    value={form.phase}
                    options={SRT_PHASES}
                    onChange={(val) => handleChange('phase', val)}
                    onBlur={() => handleBlur('phase')}
                    status={getFieldStatus('phase')}
                  />
                </div>

                {/* Sanction load in kwp */}
                <div>
                  <FloatingInput
                    id="sc-sanction-load"
                    label="Sanction load in kwp"
                    type="number"
                    step="0.01"
                    placeholder="Enter Sanction load in kwp"
                    value={form.sanctionLoadKwp}
                    onChange={(val) => handleChange('sanctionLoadKwp', val)}
                    onBlur={() => handleBlur('sanctionLoadKwp')}
                    status={getFieldStatus('sanctionLoadKwp')}
                  />
                </div>

                {/* Plant Sanction in kwp */}
                <div>
                  <FloatingInput
                    id="sc-plant-sanction"
                    label="Plant Sanction in kwp"
                    type="number"
                    step="0.01"
                    placeholder="Enter Plant Sanction in kwp"
                    value={form.plantSanctionKwp}
                    onChange={(val) => handleChange('plantSanctionKwp', val)}
                    onBlur={() => handleBlur('plantSanctionKwp')}
                    status={getFieldStatus('plantSanctionKwp')}
                  />
                </div>

                {/* Connection Phase */}
                <div>
                  <FloatingSelect
                    id="sc-conn-phase"
                    label="Connection Phase"
                    placeholder="-- Select --"
                    value={form.connectionPhase}
                    options={['Single Phase', 'Three Phase']}
                    onChange={(val) => handleChange('connectionPhase', val)}
                    onBlur={() => handleBlur('connectionPhase')}
                    status={getFieldStatus('connectionPhase')}
                  />
                </div>

                {/* CA No. */}
                <div>
                  <FloatingInput
                    id="sc-ca-no"
                    label="CA No."
                    placeholder="Enter CA No."
                    value={form.caNo}
                    onChange={(val) => handleChange('caNo', val)}
                    onBlur={() => handleBlur('caNo')}
                    status={getFieldStatus('caNo')}
                  />
                </div>
              </div>
            </div>

            <hr className="jammu-section-divider" />

            {/* ========================================================
             * Section 3 of 7: Financial Milestones & AMC Retention
             * ======================================================== */}
            <div id="sec-3" className="jammu-section-block">
              <div className="jammu-section-header">
                <div className="jammu-section-title-wrap">
                  <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', alignItems: 'center' }}>
                    <span className="ax-badge ax-badge--soft ax-badge--primary ax-badge--pill" style={{ fontWeight: 600 }}>
                      Section 3 of 7
                    </span>
                    <h3 style={{ fontSize: 'var(--ax-text-base)', fontWeight: 600, margin: 0, color: 'var(--ax-text-strong)' }}>
                      Financial Milestones &amp; AMC Retention
                    </h3>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
                    70% Discom subsidy, 10% retention release and 5-year AMC milestones.
                  </p>
                </div>
              </div>

              <div className="jammu-form-grid jammu-form-grid--3col">
                {/* Payment 70% */}
                <div>
                  <FloatingSelect
                    id="sc-pay-70"
                    label="Payment 70%"
                    placeholder="-- Select --"
                    value={form.payment70}
                    options={['Pending', 'Approved', 'Released', 'Rejected', 'Under Verification']}
                    onChange={(val) => handleChange('payment70', val)}
                    onBlur={() => handleBlur('payment70')}
                    status={getFieldStatus('payment70')}
                  />
                </div>

                {/* Payment 70% Document */}
                <div style={{ gridColumn: 'span 2' }}>
                  <FloatingFileInput
                    id="sc-pay-70-doc"
                    label="Payment 70% Document"
                    file={form.payment70Doc}
                    onChange={(file) => handleChange('payment70Doc', file)}
                    onBlur={() => handleBlur('payment70Doc')}
                    status={getFieldStatus('payment70Doc')}
                  />
                </div>

                {/* Payment 10% */}
                <div>
                  <FloatingSelect
                    id="sc-pay-10"
                    label="Payment 10%"
                    placeholder="-- Select --"
                    value={form.payment10}
                    options={['Pending', 'Approved', 'Released', 'Rejected', 'Under Verification']}
                    onChange={(val) => handleChange('payment10', val)}
                    onBlur={() => handleBlur('payment10')}
                    status={getFieldStatus('payment10')}
                  />
                </div>

                {/* Payment 10% Document */}
                <div style={{ gridColumn: 'span 2' }}>
                  <FloatingFileInput
                    id="sc-pay-10-doc"
                    label="Payment 10% Document"
                    file={form.payment10Doc}
                    onChange={(file) => handleChange('payment10Doc', file)}
                    onBlur={() => handleBlur('payment10Doc')}
                    status={getFieldStatus('payment10Doc')}
                  />
                </div>

                {/* 1st AMC 4% */}
                <div>
                  <FloatingSelect
                    id="sc-amc-1"
                    label="1st AMC 4%"
                    placeholder="-- Select --"
                    value={form.amc1}
                    options={['Pending', 'Due', 'In Progress', 'Released', 'N/A']}
                    onChange={(val) => handleChange('amc1', val)}
                    onBlur={() => handleBlur('amc1')}
                    status={getFieldStatus('amc1')}
                  />
                </div>

                {/* 2nd AMC 4% */}
                <div>
                  <FloatingSelect
                    id="sc-amc-2"
                    label="2nd AMC 4%"
                    placeholder="-- Select --"
                    value={form.amc2}
                    options={['Pending', 'Due', 'In Progress', 'Released', 'N/A']}
                    onChange={(val) => handleChange('amc2', val)}
                    onBlur={() => handleBlur('amc2')}
                    status={getFieldStatus('amc2')}
                  />
                </div>

                {/* 3rd AMC 4% */}
                <div>
                  <FloatingSelect
                    id="sc-amc-3"
                    label="3rd AMC 4%"
                    placeholder="-- Select --"
                    value={form.amc3}
                    options={['Pending', 'Due', 'In Progress', 'Released', 'N/A']}
                    onChange={(val) => handleChange('amc3', val)}
                    onBlur={() => handleBlur('amc3')}
                    status={getFieldStatus('amc3')}
                  />
                </div>

                {/* 4th AMC 4% */}
                <div>
                  <FloatingSelect
                    id="sc-amc-4"
                    label="4th AMC 4%"
                    placeholder="-- Select --"
                    value={form.amc4}
                    options={['Pending', 'Due', 'In Progress', 'Released', 'N/A']}
                    onChange={(val) => handleChange('amc4', val)}
                    onBlur={() => handleBlur('amc4')}
                    status={getFieldStatus('amc4')}
                  />
                </div>

                {/* 5th AMC 4% */}
                <div>
                  <FloatingSelect
                    id="sc-amc-5"
                    label="5th AMC 4%"
                    placeholder="-- Select --"
                    value={form.amc5}
                    options={['Pending', 'Due', 'In Progress', 'Released', 'N/A']}
                    onChange={(val) => handleChange('amc5', val)}
                    onBlur={() => handleBlur('amc5')}
                    status={getFieldStatus('amc5')}
                  />
                </div>
              </div>
            </div>

            <hr className="jammu-section-divider" />

            {/* ========================================================
             * Section 4 of 7: Material Logistics & Site Installation
             * ======================================================== */}
            <div id="sec-4" className="jammu-section-block">
              <div className="jammu-section-header">
                <div className="jammu-section-title-wrap">
                  <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', alignItems: 'center' }}>
                    <span className="ax-badge ax-badge--soft ax-badge--primary ax-badge--pill" style={{ fontWeight: 600 }}>
                      Section 4 of 7
                    </span>
                    <h3 style={{ fontSize: 'var(--ax-text-base)', fontWeight: 600, margin: 0, color: 'var(--ax-text-strong)' }}>
                      Material Dispatch &amp; Installation Progress
                    </h3>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
                    Equipment logistics, vendor execution dates, and site contact info.
                  </p>
                </div>
              </div>

              <div className="jammu-form-grid jammu-form-grid--3col">
                {/* Material Status */}
                <div>
                  <FloatingSelect
                    id="sc-mat-status"
                    label="Material Status"
                    placeholder="-- Select --"
                    value={form.materialStatus}
                    options={['Material Dispatched', 'In-Transit', 'Delivered at Site', 'Material Pending', 'Partially Dispatched']}
                    onChange={(val) => handleChange('materialStatus', val)}
                    onBlur={() => handleBlur('materialStatus')}
                    status={getFieldStatus('materialStatus')}
                  />
                </div>

                {/* Material Dispatch Date */}
                <div>
                  <FloatingDateInput
                    id="sc-mat-date"
                    label="Material Dispatch Date"
                    value={form.materialDispatchDate}
                    onChange={(val) => handleChange('materialDispatchDate', val)}
                    onBlur={() => handleBlur('materialDispatchDate')}
                    status={getFieldStatus('materialDispatchDate')}
                  />
                </div>

                {/* Installation Status */}
                <div>
                  <FloatingSelect
                    id="sc-inst-status"
                    label="Installation Status"
                    placeholder="-- Select --"
                    value={form.installationStatus}
                    options={['Not Started', 'In Progress', 'Completed', 'Under Inspection', 'On Hold']}
                    onChange={(val) => handleChange('installationStatus', val)}
                    onBlur={() => handleBlur('installationStatus')}
                    status={getFieldStatus('installationStatus')}
                  />
                </div>

                {/* Installation Vendor */}
                <div>
                  <FloatingSelect
                    id="sc-inst-vendor"
                    label="Installation Vendor"
                    placeholder="-- Select --"
                    value={form.installationVendor}
                    options={INSTALLATION_VENDORS}
                    onChange={(val) => handleChange('installationVendor', val)}
                    onBlur={() => handleBlur('installationVendor')}
                    status={getFieldStatus('installationVendor')}
                  />
                </div>

                {/* Installation Date */}
                <div>
                  <FloatingDateInput
                    id="sc-inst-date"
                    label="Installation Date"
                    value={form.installationDate}
                    onChange={(val) => handleChange('installationDate', val)}
                    onBlur={() => handleBlur('installationDate')}
                    status={getFieldStatus('installationDate')}
                  />
                </div>

                {/* Contact Person */}
                <div>
                  <FloatingInput
                    id="sc-contact-person"
                    label="Contact Person"
                    placeholder="Enter Contact Person Name"
                    value={form.contactPerson}
                    onChange={(val) => handleChange('contactPerson', val)}
                    onBlur={() => handleBlur('contactPerson')}
                    status={getFieldStatus('contactPerson')}
                  />
                </div>

                {/* Contact No. */}
                <div>
                  <FloatingInput
                    id="sc-contact-no"
                    label="Contact No."
                    type="tel"
                    placeholder="Enter Contact Number"
                    value={form.contactNo}
                    onChange={(val) => handleChange('contactNo', val)}
                    onBlur={() => handleBlur('contactNo')}
                    status={getFieldStatus('contactNo')}
                    error={errors.contactNo}
                  />
                </div>

                {/* Installation Remarks */}
                <div className="jammu-form-col-span-full">
                  <FloatingTextarea
                    id="sc-inst-remarks"
                    label="Installation Remarks"
                    placeholder="Enter Remarks..."
                    value={form.installationRemarks}
                    onChange={(val) => handleChange('installationRemarks', val)}
                    onBlur={() => handleBlur('installationRemarks')}
                    status={getFieldStatus('installationRemarks')}
                  />
                </div>
              </div>
            </div>

            <hr className="jammu-section-divider" />

            {/* ========================================================
             * Section 5 of 7: Solar PV, Inverter & Metering Hardware
             * ======================================================== */}
            <div id="sec-5" className="jammu-section-block">
              <div className="jammu-section-header">
                <div className="jammu-section-title-wrap">
                  <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', alignItems: 'center' }}>
                    <span className="ax-badge ax-badge--soft ax-badge--primary ax-badge--pill" style={{ fontWeight: 600 }}>
                      Section 5 of 7
                    </span>
                    <h3 style={{ fontSize: 'var(--ax-text-base)', fontWeight: 600, margin: 0, color: 'var(--ax-text-strong)' }}>
                      Solar PV, Inverter &amp; Metering Hardware
                    </h3>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
                    Module serials, inverter numbers, photos and net/smart meter integration.
                  </p>
                </div>
              </div>

              <div className="jammu-form-grid jammu-form-grid--3col">
                {/* Panel No */}
                <div>
                  <FloatingInput
                    id="sc-panel-no"
                    label="Panel No"
                    placeholder="Enter Panel Number"
                    value={form.panelNo}
                    onChange={(val) => handleChange('panelNo', val)}
                    onBlur={() => handleBlur('panelNo')}
                    status={getFieldStatus('panelNo')}
                  />
                </div>

                {/* Panel Image */}
                <div>
                  <FloatingFileInput
                    id="sc-panel-img"
                    label="Panel Image"
                    file={form.panelImage}
                    onChange={(file) => handleChange('panelImage', file)}
                    onBlur={() => handleBlur('panelImage')}
                    status={getFieldStatus('panelImage')}
                  />
                </div>

                {/* System Image * (MANDATORY) */}
                <div>
                  <FloatingFileInput
                    id="sc-system-img"
                    label="System Image"
                    required
                    file={form.systemImage}
                    onChange={(file) => handleChange('systemImage', file)}
                    onBlur={() => handleBlur('systemImage')}
                    status={getFieldStatus('systemImage')}
                    error={errors.systemImage}
                  />
                </div>

                {/* Inverter No */}
                <div>
                  <FloatingInput
                    id="sc-inverter-no"
                    label="Inverter No"
                    placeholder="Enter Inverter Number"
                    value={form.inverterNo}
                    onChange={(val) => handleChange('inverterNo', val)}
                    onBlur={() => handleBlur('inverterNo')}
                    status={getFieldStatus('inverterNo')}
                  />
                </div>

                {/* Inverter Image */}
                <div>
                  <FloatingFileInput
                    id="sc-inverter-img"
                    label="Inverter Image"
                    file={form.inverterImage}
                    onChange={(file) => handleChange('inverterImage', file)}
                    onBlur={() => handleBlur('inverterImage')}
                    status={getFieldStatus('inverterImage')}
                  />
                </div>

                {/* Net Meter/Smart Meter Install */}
                <div>
                  <FloatingSelect
                    id="sc-net-meter-inst"
                    label="Net Meter/Smart Meter Install"
                    placeholder="-- Select --"
                    value={form.netMeterInstall}
                    options={['Installed', 'Not Installed', 'Application Submitted', 'Meter Issued', 'Testing in Progress']}
                    onChange={(val) => handleChange('netMeterInstall', val)}
                    onBlur={() => handleBlur('netMeterInstall')}
                    status={getFieldStatus('netMeterInstall')}
                  />
                </div>

                {/* Solar Meter Number */}
                <div>
                  <FloatingInput
                    id="sc-solar-meter-no"
                    label="Solar Meter Number"
                    placeholder="Enter Solar Meter Number"
                    value={form.solarMeterNo}
                    onChange={(val) => handleChange('solarMeterNo', val)}
                    onBlur={() => handleBlur('solarMeterNo')}
                    status={getFieldStatus('solarMeterNo')}
                  />
                </div>

                {/* Net Meter/Smart Meter Number */}
                <div>
                  <FloatingInput
                    id="sc-net-meter-no"
                    label="Net Meter/Smart Meter Number"
                    placeholder="Enter Net/Smart Meter Number"
                    value={form.netSmartMeterNo}
                    onChange={(val) => handleChange('netSmartMeterNo', val)}
                    onBlur={() => handleBlur('netSmartMeterNo')}
                    status={getFieldStatus('netSmartMeterNo')}
                  />
                </div>

                {/* Net Meter/Smart Meter Image */}
                <div>
                  <FloatingFileInput
                    id="sc-net-meter-img"
                    label="Net Meter/Smart Meter Image"
                    file={form.netSmartMeterImage}
                    onChange={(file) => handleChange('netSmartMeterImage', file)}
                    onBlur={() => handleBlur('netSmartMeterImage')}
                    status={getFieldStatus('netSmartMeterImage')}
                  />
                </div>
              </div>
            </div>

            <hr className="jammu-section-divider" />

            {/* ========================================================
             * Section 6 of 7: RMS Telemetry & GPS Coordinates
             * ======================================================== */}
            <div id="sec-6" className="jammu-section-block">
              <div className="jammu-section-header">
                <div className="jammu-section-title-wrap">
                  <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', alignItems: 'center' }}>
                    <span className="ax-badge ax-badge--soft ax-badge--primary ax-badge--pill" style={{ fontWeight: 600 }}>
                      Section 6 of 7
                    </span>
                    <h3 style={{ fontSize: 'var(--ax-text-base)', fontWeight: 600, margin: 0, color: 'var(--ax-text-strong)' }}>
                      Remote Monitoring System (RMS) &amp; Coordinates
                    </h3>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
                    Data logger connectivity, SIM binding and site GPS coordinates.
                  </p>
                </div>
              </div>

              <div className="jammu-form-grid jammu-form-grid--3col">
                {/* RMS Status */}
                <div>
                  <FloatingSelect
                    id="sc-rms-status"
                    label="RMS Status"
                    placeholder="-- Select --"
                    value={form.rmsStatus}
                    options={['Active / Online', 'Inactive / Offline', 'Installed - Configuration Pending', 'Not Installed', 'Faulty']}
                    onChange={(val) => handleChange('rmsStatus', val)}
                    onBlur={() => handleBlur('rmsStatus')}
                    status={getFieldStatus('rmsStatus')}
                  />
                </div>

                {/* RMS Loger Number */}
                <div>
                  <FloatingInput
                    id="sc-rms-loger-no"
                    label="RMS Loger Number"
                    placeholder="Enter RMS Loger Number"
                    value={form.rmsLogerNo}
                    onChange={(val) => handleChange('rmsLogerNo', val)}
                    onBlur={() => handleBlur('rmsLogerNo')}
                    status={getFieldStatus('rmsLogerNo')}
                  />
                </div>

                {/* Loger Image */}
                <div>
                  <FloatingFileInput
                    id="sc-loger-img"
                    label="Loger Image"
                    file={form.logerImage}
                    onChange={(file) => handleChange('logerImage', file)}
                    onBlur={() => handleBlur('logerImage')}
                    status={getFieldStatus('logerImage')}
                  />
                </div>

                {/* Sim Number */}
                <div>
                  <FloatingInput
                    id="sc-sim-no"
                    label="Sim Number"
                    placeholder="Enter Sim Number"
                    value={form.simNo}
                    onChange={(val) => handleChange('simNo', val)}
                    onBlur={() => handleBlur('simNo')}
                    status={getFieldStatus('simNo')}
                  />
                </div>

                {/* Sim File */}
                <div>
                  <FloatingFileInput
                    id="sc-sim-file"
                    label="Sim File"
                    file={form.simFile}
                    onChange={(file) => handleChange('simFile', file)}
                    onBlur={() => handleBlur('simFile')}
                    status={getFieldStatus('simFile')}
                  />
                </div>

                {/* Latitude */}
                <div>
                  <FloatingInput
                    id="sc-latitude"
                    label="Latitude"
                    placeholder="Enter Latitude"
                    value={form.latitude}
                    onChange={(val) => handleChange('latitude', val)}
                    onBlur={() => handleBlur('latitude')}
                    status={getFieldStatus('latitude')}
                    error={errors.latitude}
                  />
                </div>

                {/* Longitude */}
                <div>
                  <FloatingInput
                    id="sc-longitude"
                    label="Longitude"
                    placeholder="Enter Longitude"
                    value={form.longitude}
                    onChange={(val) => handleChange('longitude', val)}
                    onBlur={() => handleBlur('longitude')}
                    status={getFieldStatus('longitude')}
                    error={errors.longitude}
                  />
                </div>
              </div>
            </div>

            <hr className="jammu-section-divider" />

            {/* ========================================================
             * Section 7 of 7: Verification, Claim Invoicing & Vendor Payouts
             * ======================================================== */}
            <div id="sec-7" className="jammu-section-block">
              <div className="jammu-section-header">
                <div className="jammu-section-title-wrap">
                  <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', alignItems: 'center' }}>
                    <span className="ax-badge ax-badge--soft ax-badge--primary ax-badge--pill" style={{ fontWeight: 600 }}>
                      Section 7 of 7
                    </span>
                    <h3 style={{ fontSize: 'var(--ax-text-base)', fontWeight: 600, margin: 0, color: 'var(--ax-text-strong)' }}>
                      Verification, Claim Invoicing &amp; Installer Payouts
                    </h3>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
                    Field audit verification, MNRE subsidy claim, 80% and 20% vendor disbursements.
                  </p>
                </div>
              </div>

              <div className="jammu-form-grid jammu-form-grid--3col">
                {/* Installation Verify */}
                <div>
                  <FloatingSelect
                    id="sc-inst-verify"
                    label="Installation Verify"
                    placeholder="-- Select --"
                    value={form.installationVerify}
                    options={['Verified', 'Verification Pending', 'Rejected / Re-work Required']}
                    onChange={(val) => handleChange('installationVerify', val)}
                    onBlur={() => handleBlur('installationVerify')}
                    status={getFieldStatus('installationVerify')}
                  />
                </div>

                {/* Claim Raised */}
                <div>
                  <FloatingSelect
                    id="sc-claim-raised"
                    label="Claim Raised"
                    placeholder="-- Select --"
                    value={form.claimRaised}
                    options={['Yes', 'No', 'Under Review', 'Disbursed']}
                    onChange={(val) => handleChange('claimRaised', val)}
                    onBlur={() => handleBlur('claimRaised')}
                    status={getFieldStatus('claimRaised')}
                  />
                </div>

                {/* Claim Invoice */}
                <div>
                  <FloatingFileInput
                    id="sc-claim-invoice"
                    label="Claim Invoice"
                    file={form.claimInvoice}
                    onChange={(file) => handleChange('claimInvoice', file)}
                    onBlur={() => handleBlur('claimInvoice')}
                    status={getFieldStatus('claimInvoice')}
                  />
                </div>

                {/* Claim Amount */}
                <div>
                  <FloatingInput
                    id="sc-claim-amt"
                    label="Claim Amount"
                    type="number"
                    placeholder="Enter Claim Amount"
                    value={form.claimAmount}
                    onChange={(val) => handleChange('claimAmount', val)}
                    onBlur={() => handleBlur('claimAmount')}
                    status={getFieldStatus('claimAmount')}
                  />
                </div>

                {/* Installer Pay 80% Status */}
                <div>
                  <FloatingSelect
                    id="sc-pay-80-status"
                    label="Installer Pay 80% Status"
                    placeholder="-- Select --"
                    value={form.installerPay80Status}
                    options={['Pending', 'Approved', 'Disbursed', 'Hold']}
                    onChange={(val) => handleChange('installerPay80Status', val)}
                    onBlur={() => handleBlur('installerPay80Status')}
                    status={getFieldStatus('installerPay80Status')}
                  />
                </div>

                {/* Installer Pay 80% Amount */}
                <div>
                  <FloatingInput
                    id="sc-pay-80-amt"
                    label="Installer Pay 80% Amount"
                    type="number"
                    placeholder="Enter Amount"
                    value={form.installerPay80Amount}
                    onChange={(val) => handleChange('installerPay80Amount', val)}
                    onBlur={() => handleBlur('installerPay80Amount')}
                    status={getFieldStatus('installerPay80Amount')}
                  />
                </div>

                {/* Installer Pay 80% Date */}
                <div>
                  <FloatingDateInput
                    id="sc-pay-80-date"
                    label="Installer Pay 80% Date"
                    value={form.installerPay80Date}
                    onChange={(val) => handleChange('installerPay80Date', val)}
                    onBlur={() => handleBlur('installerPay80Date')}
                    status={getFieldStatus('installerPay80Date')}
                  />
                </div>

                {/* Installation Document Submit */}
                <div>
                  <FloatingSelect
                    id="sc-doc-submit"
                    label="Installation Document Submit"
                    placeholder="-- Select --"
                    value={form.installationDocSubmit}
                    options={['Submitted', 'Not Submitted', 'Resubmitted', 'Under Verification']}
                    onChange={(val) => handleChange('installationDocSubmit', val)}
                    onBlur={() => handleBlur('installationDocSubmit')}
                    status={getFieldStatus('installationDocSubmit')}
                  />
                </div>

                {/* Installer Pay 20% */}
                <div>
                  <FloatingSelect
                    id="sc-pay-20-status"
                    label="Installer Pay 20%"
                    placeholder="-- Select --"
                    value={form.installerPay20Status}
                    options={['Pending', 'Approved', 'Disbursed', 'Hold']}
                    onChange={(val) => handleChange('installerPay20Status', val)}
                    onBlur={() => handleBlur('installerPay20Status')}
                    status={getFieldStatus('installerPay20Status')}
                  />
                </div>

                {/* Installer Pay 20% Amount */}
                <div>
                  <FloatingInput
                    id="sc-pay-20-amt"
                    label="Installer Pay 20% Amount"
                    type="number"
                    placeholder="Enter Amount"
                    value={form.installerPay20Amount}
                    onChange={(val) => handleChange('installerPay20Amount', val)}
                    onBlur={() => handleBlur('installerPay20Amount')}
                    status={getFieldStatus('installerPay20Amount')}
                  />
                </div>

                {/* Installer Pay 20% Date */}
                <div>
                  <FloatingDateInput
                    id="sc-pay-20-date"
                    label="Installer Pay 20% Date"
                    value={form.installerPay20Date}
                    onChange={(val) => handleChange('installerPay20Date', val)}
                    onBlur={() => handleBlur('installerPay20Date')}
                    status={getFieldStatus('installerPay20Date')}
                  />
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="jammu-form-sticky-bar">
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)', alignItems: 'center' }}>
            <span className="ax-badge ax-badge--soft ax-badge--primary ax-badge--pill">
              Required: {completedRequired} / {totalRequired} ({progressPercent}%)
            </span>
            {submitted && Object.keys(errors).filter((k) => errors[k]).length > 0 && (
              <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-danger-500)', fontWeight: 500 }}>
                ⚠️ Missing mandatory fields
              </span>
            )}
          </div>

          <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)' }}>
            <button type="button" onClick={handleReset} className="ax-btn ax-btn--ghost">
              <span className="ax-btn__label">Clear</span>
            </button>
            <Link to="/jammu/dashboard" className="ax-btn ax-btn--secondary">
              <span className="ax-btn__label">Cancel</span>
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="ax-btn ax-btn--primary"
              style={{ minWidth: 200 }}
            >
              {isSubmitting ? (
                <>
                  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ animation: 'spin 1s linear infinite' }}><path d="M12 3a9 9 0 1 0 9 9" /></svg>
                  <span className="ax-btn__label">Submitting...</span>
                </>
              ) : (
                <>
                  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5l10 -10" /></svg>
                  <span className="ax-btn__label">Submit Jammu SRT 70MW</span>
                </>
              )}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}

/* =========================================================================
 * Helper Reusable Floating Components
 * ========================================================================= */

interface FieldStatusProps {
  className: string;
  isValid: boolean;
  isInvalid: boolean;
}

interface FloatingInputProps {
  id: string;
  label: string;
  type?: string;
  min?: number;
  step?: string;
  required?: boolean;
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
  onBlur: () => void;
  status: FieldStatusProps;
  error?: string;
}

function FloatingInput({
  id,
  label,
  type = 'text',
  min,
  step,
  required,
  placeholder,
  value,
  onChange,
  onBlur,
  status,
  error,
}: FloatingInputProps) {
  return (
    <div>
      <div className="ax-float">
        <input
          id={id}
          type={type}
          min={min}
          step={step}
          className={`ax-input ax-float__input ${status.className}`}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          aria-invalid={status.isInvalid}
        />
        <label className="ax-float__label" htmlFor={id}>
          {label}
          {required && <span style={{ color: 'var(--ax-danger-500)', marginLeft: 3 }}>*</span>}
        </label>
      </div>
      <FieldFeedback error={error} isValid={status.isValid} />
    </div>
  );
}

interface FloatingInputWithDatalistProps {
  id: string;
  label: string;
  required?: boolean;
  placeholder: string;
  value: string;
  suggestions: string[];
  onChange: (val: string) => void;
  onBlur: () => void;
  status: FieldStatusProps;
  error?: string;
}

function FloatingInputWithDatalist({
  id,
  label,
  required,
  placeholder,
  value,
  suggestions,
  onChange,
  onBlur,
  status,
  error,
}: FloatingInputWithDatalistProps) {
  const listId = `${id}-list`;
  return (
    <div>
      <div className="ax-float">
        <input
          id={id}
          type="text"
          list={listId}
          className={`ax-input ax-float__input ${status.className}`}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          aria-invalid={status.isInvalid}
        />
        <datalist id={listId}>
          {suggestions.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
        <label className="ax-float__label" htmlFor={id}>
          {label}
          {required && <span style={{ color: 'var(--ax-danger-500)', marginLeft: 3 }}>*</span>}
        </label>
      </div>
      <FieldFeedback error={error} isValid={status.isValid} />
    </div>
  );
}

interface FloatingSelectProps {
  id: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  value: string;
  options: string[];
  onChange: (val: string) => void;
  onBlur: () => void;
  status: FieldStatusProps;
  error?: string;
}

function FloatingSelect({
  id,
  label,
  required,
  placeholder = '-- Select --',
  value,
  options,
  onChange,
  onBlur,
  status,
  error,
}: FloatingSelectProps) {
  return (
    <div>
      <div className="ax-float ax-float--select">
        <select
          id={id}
          className={`ax-select ax-float__input ${status.className}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          aria-invalid={status.isInvalid}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <label className="ax-float__label" htmlFor={id}>
          {label}
          {required && <span style={{ color: 'var(--ax-danger-500)', marginLeft: 3 }}>*</span>}
        </label>
      </div>
      <FieldFeedback error={error} isValid={status.isValid} />
    </div>
  );
}

interface FloatingDateInputProps {
  id: string;
  label: string;
  required?: boolean;
  value: string;
  onChange: (val: string) => void;
  onBlur: () => void;
  status: FieldStatusProps;
  error?: string;
}

function FloatingDateInput({
  id,
  label,
  required,
  value,
  onChange,
  onBlur,
  status,
  error,
}: FloatingDateInputProps) {
  return (
    <div>
      <div className="ax-float ax-float--date">
        <input
          id={id}
          type="date"
          className={`ax-input ax-float__input ${status.className}`}
          placeholder=" "
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          aria-invalid={status.isInvalid}
        />
        <label className="ax-float__label" htmlFor={id}>
          {label}
          {required && <span style={{ color: 'var(--ax-danger-500)', marginLeft: 3 }}>*</span>}
        </label>
      </div>
      <FieldFeedback error={error} isValid={status.isValid} />
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
  onBlur: () => void;
  status: FieldStatusProps;
  error?: string;
}

function FloatingTextarea({
  id,
  label,
  required,
  placeholder = 'Enter Remarks...',
  value,
  rows = 3,
  onChange,
  onBlur,
  status,
  error,
}: FloatingTextareaProps) {
  return (
    <div>
      <div className="ax-float ax-float--area">
        <textarea
          id={id}
          rows={rows}
          className={`ax-textarea ax-float__input ${status.className}`}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          aria-invalid={status.isInvalid}
        />
        <label className="ax-float__label" htmlFor={id}>
          {label}
          {required && <span style={{ color: 'var(--ax-danger-500)', marginLeft: 3 }}>*</span>}
        </label>
      </div>
      <FieldFeedback error={error} isValid={status.isValid} />
    </div>
  );
}

interface FloatingFileInputProps {
  id: string;
  label: string;
  required?: boolean;
  file: File | null;
  onChange: (file: File | null) => void;
  onBlur: () => void;
  status: FieldStatusProps;
  error?: string;
}

function FloatingFileInput({
  id,
  label,
  required,
  file,
  onChange,
  onBlur,
  status,
  error,
}: FloatingFileInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = e.target.files?.[0] || null;
    onChange(chosen);
    onBlur();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    if (inputRef.current) inputRef.current.value = '';
    onBlur();
  };

  return (
    <div>
      <div className={`ax-float ax-float--file ${status.className}`}>
        <input
          ref={inputRef}
          id={`${id}-${inputId}`}
          type="file"
          style={{ display: 'none' }}
          onChange={handleFileChange}
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
            <svg
              style={{ width: 18, height: 18, flexShrink: 0, color: 'var(--ax-text-muted)' }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 3v4a1 1 0 0 0 1 1h4" />
              <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" />
            </svg>
            <span
              style={{
                fontSize: 'var(--ax-text-xs)',
                color: file ? 'var(--ax-text-strong)' : 'var(--ax-text-subtle)',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
              }}
            >
              {file ? `${file.name} (${(file.size / 1024).toFixed(0)} KB)` : 'No file chosen'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            {file ? (
              <button
                type="button"
                className="ax-btn ax-btn--ghost ax-btn--icon ax-btn--xs"
                onClick={handleClear}
                title="Remove file"
                aria-label="Remove file"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
                  <path d="M18 6l-12 12" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            ) : (
              <span
                className="ax-btn ax-btn--secondary ax-btn--xs"
                style={{ pointerEvents: 'none' }}
              >
                Choose File
              </span>
            )}
          </div>
        </div>

        <label className="ax-float__label" htmlFor={`${id}-${inputId}`}>
          {label}
          {required && <span style={{ color: 'var(--ax-danger-500)', marginLeft: 3 }}>*</span>}
        </label>
      </div>
      <FieldFeedback error={error} isValid={status.isValid} />
    </div>
  );
}

function FieldFeedback({ error, isValid }: { error?: string; isValid?: boolean }) {
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

  if (isValid) {
    return (
      <span className="ax-field-feedback ax-field-feedback--success">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 12, height: 12 }}>
          <polyline points="20 6 9 17 4 12" />
        </svg>
        Valid
      </span>
    );
  }

  return <span className="ax-field-feedback" />;
}

export default AddJammuSRT70MWSingleCard;
