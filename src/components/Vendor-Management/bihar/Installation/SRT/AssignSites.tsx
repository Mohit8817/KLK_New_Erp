import { useState, useRef, useEffect, useCallback, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { biharAdminService } from '../../bihar-services/biharAdminService';

// CSS: Unified Single-Card Layout with Floating Labels & Section Dividers (same as Bihar SRT design)
const SINGLE_CARD_FORM_CSS = `
.bsa-single-card-form .ax-card { border: 1px solid var(--ax-border); border-radius: var(--ax-radius-xl); background: var(--ax-surface-solid); box-shadow: var(--ax-shadow-sm); overflow: hidden; }
.bsa-single-card-form .ax-card__header { padding: var(--ax-space-5) var(--ax-space-6); border-bottom: 1px solid var(--ax-border-subtle); background: var(--ax-surface-subtle); display: flex; flex-direction: column; gap: var(--ax-space-4); }
.bsa-single-card-form .ax-card__body { padding: var(--ax-space-6); }

.bsa-section-pills { display: flex; gap: var(--ax-space-2); overflow-x: auto; padding-bottom: 4px; scrollbar-width: thin; }
.bsa-section-pill-btn { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: var(--ax-radius-pill); font-size: var(--ax-text-xs); font-weight: 500; white-space: nowrap; background: var(--ax-surface-solid); border: 1px solid var(--ax-border); color: var(--ax-text); cursor: pointer; transition: all var(--ax-motion-fast) var(--ax-ease-standard); text-decoration: none; }
.bsa-section-pill-btn:hover { border-color: var(--ax-accent); color: var(--ax-accent); background: color-mix(in srgb, var(--ax-accent) 6%, var(--ax-surface-solid)); }
.bsa-section-pill-btn .pill-num { width: 18px; height: 18px; border-radius: 50%; background: var(--ax-surface-subtle); display: inline-flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; }

.bsa-section-block { padding-top: var(--ax-space-2); scroll-margin-top: 80px; }
.bsa-section-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: var(--ax-space-2); margin-bottom: var(--ax-space-5); padding-bottom: var(--ax-space-3); border-bottom: 1px solid var(--ax-border-subtle); }
.bsa-section-title-wrap { display: flex; flex-direction: column; gap: 4px; }
.bsa-section-divider { border: 0; border-top: 1px dashed var(--ax-border); margin: var(--ax-space-8) 0 var(--ax-space-6); }

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

.bsa-form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--ax-space-4); }
@media (min-width: 1024px) { .bsa-form-grid--3col { grid-template-columns: repeat(3, 1fr); } }
.bsa-form-col-span-full { grid-column: 1 / -1; }
@media (min-width: 1024px) { .bsa-form-col-span-2 { grid-column: span 2; } }
.bsa-gps-cell { height: 46px; }

.bsa-form-sticky-bar { position: sticky; bottom: var(--ax-space-4); z-index: 30; margin-top: var(--ax-space-6); padding: var(--ax-space-3) var(--ax-space-5); background: var(--ax-surface-solid); border: 1px solid var(--ax-border); border-radius: var(--ax-radius-xl); box-shadow: var(--ax-shadow-lg); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--ax-space-3); backdrop-filter: blur(12px); }

@keyframes bsa-spin { to { transform: rotate(360deg); } }
`;

type Option = { value: string; label: string };

const SECTIONS = [
  { id: 'sec-1', num: '1', title: 'Site & Contractor Details' },
  { id: 'sec-2', num: '2', title: 'Work Order File & Notes' },
];

const STATE_VALUE = 'Bihar';

export function BiharSRTInstallationAssignSites() {
  const [vendorList, setVendorList] = useState<Array<{ id: number | string; name: string }>>([]);
  const [districtList, setDistrictList] = useState<string[]>([]);
  const [siteOptions, setSiteOptions] = useState<string[]>([]);
  const [loadingMaster, setLoadingMaster] = useState(true);
  const [loadingSites, setLoadingSites] = useState(false);

  const [vendor, setVendor] = useState('');
  const [district, setDistrict] = useState('');
  const [siteName, setSiteName] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const clearError = (name: string) => {
    setValidationErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Fetch initial master data: vendors and districts
  const loadMasterData = useCallback(async () => {
    try {
      setLoadingMaster(true);
      setErrorMsg('');

      const [assignMasterRes, districtsRes] = await Promise.allSettled([
        biharAdminService.getSrtAssignMaster(),
        biharAdminService.getSrtDistricts(),
      ]);

      // Parse vendors
      if (assignMasterRes.status === 'fulfilled') {
        const data = assignMasterRes.value;
        const vendorsRaw = data?.vendors || data?.data?.vendors || data?.vendor_list || data?.data || [];
        if (Array.isArray(vendorsRaw)) {
          const mappedVendors = vendorsRaw.map((v: any) => ({
            id: v.id ?? v.vendor_id ?? v.name ?? String(v),
            name: v.name || v.vendor_name || v.agency_name || String(v),
          }));
          setVendorList(mappedVendors);
        }
      }

      // Parse districts
      if (districtsRes.status === 'fulfilled') {
        const data = districtsRes.value;
        const distsRaw = data?.districts || data?.data?.districts || data?.district || data?.data || [];
        if (Array.isArray(distsRaw)) {
          const list = distsRaw.map((d: any) => (typeof d === 'string' ? d : d.name || d.district || String(d)));
          setDistrictList(list);
        }
      }
    } catch (err: any) {
      console.error('Failed to load Bihar SRT assignment master data:', err);
    } finally {
      setLoadingMaster(false);
    }
  }, []);

  useEffect(() => {
    loadMasterData();
  }, [loadMasterData]);

  // Load sites when district changes
  useEffect(() => {
    if (!district) {
      setSiteOptions([]);
      return;
    }

    let isMounted = true;
    setLoadingSites(true);
    biharAdminService
      .getSrtSites(district)
      .then((res: any) => {
        if (!isMounted) return;
        const sitesRaw = res?.sites || res?.data?.sites || res?.data || (Array.isArray(res) ? res : []);
        if (Array.isArray(sitesRaw)) {
          const list = sitesRaw.map((s: any) => (typeof s === 'string' ? s : s.site_name || s.name || String(s)));
          setSiteOptions(list);
        } else {
          setSiteOptions([]);
        }
      })
      .catch((err) => {
        console.error('Failed to load sites for district:', district, err);
        if (isMounted) setSiteOptions([]);
      })
      .finally(() => {
        if (isMounted) setLoadingSites(false);
      });

    return () => {
      isMounted = false;
    };
  }, [district]);

  // Validation
  const validate = () => {
    const errs: Record<string, string> = {};
    if (!vendor) errs.vendor = 'Please select a Vendor Name.';
    if (!district) errs.district = 'Please select a District.';
    if (!siteName) errs.site_name = 'Please enter or select Site Name.';
    if (!uploadedFile) errs.file = 'Please upload Work Order / Allotment File.';
    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!validate()) {
      setErrorMsg('Please correct the highlighted fields before submitting.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => {
        document.querySelector('.is-invalid')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
      return;
    }

    try {
      setIsSubmitting(true);
      const fd = new FormData();
      fd.append('vendor', vendor);
      fd.append('state', STATE_VALUE);
      fd.append('district', district);
      fd.append('site_name', siteName);
      if (uploadedFile) fd.append('file', uploadedFile);
      if (remarks) fd.append('remarks', remarks);

      await biharAdminService.storeSrtAssign(fd);

      setSuccessMsg(`Site "${siteName}" successfully assigned for Bihar SRT Installation!`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setSiteName('');
      setUploadedFile(null);
      setRemarks('');
    } catch (err: any) {
      console.error('Failed to submit Bihar SRT assignment:', err);
      setErrorMsg(err?.message || 'Failed to submit site assignment to server.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setVendor('');
    setDistrict('');
    setSiteName('');
    setUploadedFile(null);
    setRemarks('');
    setErrorMsg('');
    setSuccessMsg('');
    setValidationErrors({});
  };

  const vendorOptions: Option[] = vendorList.map((v) => ({ value: v.name, label: v.name }));
  const districtOptions: Option[] = districtList.map((d) => ({ value: d, label: d }));
  const siteSelectOptions: Option[] = siteOptions.map((s) => ({ value: s, label: s }));
  const siteLabel = `Site Name${loadingSites ? ' (fetching sites...)' : ''}`;

  return (
    <div className="bsa-single-card-form">
      <style>{SINGLE_CARD_FORM_CSS}</style>

      <PageHead
        title="Assign Bihar SRT Installation"
        subtitle={
          <span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>
            The field labels marked with * are required input fields.
          </span>
        }
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Bihar SRT', href: '/vendor-management/bihar/srt/installation/dashboard' },
          { label: 'Assign Bihar SRT Installation' },
        ]}
        actions={
          <Link to="/vendor-management/bihar/srt/installation/view-assign" className="ax-btn ax-btn--secondary ax-btn--pill">
            <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l14 0" /><path d="M5 12l6 6" /><path d="M5 12l6 -6" /></svg>
            <span className="ax-btn__label">Assigned Sites</span>
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
              <span className="ax-card__eyebrow">Bihar SRT</span>
              <h2 className="ax-card__title" style={{ margin: 0 }}>Work Order Site Allotment</h2>
              <p className="ax-card__subtitle" style={{ margin: '4px 0 0' }}>
                Select authorized vendor contractor, target district jurisdiction, and allocate rooftop solar site.
                {loadingMaster && <span style={{ marginLeft: 8, color: 'var(--ax-accent)' }}>Loading API options...</span>}
              </p>
            </div>

            <div className="bsa-section-pills" role="navigation" aria-label="Jump to section">
              {SECTIONS.map((s) => (
                <button key={s.id} type="button" onClick={() => scrollToSection(s.id)} className="bsa-section-pill-btn">
                  <span className="pill-num">{s.num}</span>
                  <span>{s.title}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="ax-card__body">
            {/* Section 1: Contractor & Location */}
            <div id="sec-1" className="bsa-section-block">
              <SectionHeader num="1" total={2} title="Contractor & Location Information" desc="Assign authorized agency and select site location in Bihar." />
              <div className="bsa-form-grid bsa-form-grid--3col">
                <FloatingSelect
                  id="bsa-vendor"
                  label="Vendor Name"
                  required
                  placeholder="-- Select Vendor --"
                  value={vendor}
                  options={vendorOptions}
                  onChange={(v) => { setVendor(v); clearError('vendor'); setErrorMsg(''); }}
                  error={validationErrors.vendor}
                />
                <FloatingInput id="bsa-state" label="State" required readOnly value={STATE_VALUE} />
                <FloatingSelect
                  id="bsa-district"
                  label="District"
                  required
                  placeholder="-- Select District --"
                  value={district}
                  options={districtOptions}
                  onChange={(v) => { setDistrict(v); setSiteName(''); clearError('district'); setErrorMsg(''); }}
                  error={validationErrors.district}
                />
                {siteSelectOptions.length > 0 ? (
                  <FloatingSelect
                    id="bsa-site"
                    label={siteLabel}
                    required
                    placeholder="-- Select Site Name --"
                    value={siteName}
                    options={siteSelectOptions}
                    onChange={(v) => { setSiteName(v); clearError('site_name'); setErrorMsg(''); }}
                    error={validationErrors.site_name}
                  />
                ) : (
                  <FloatingInput
                    id="bsa-site"
                    label={siteLabel}
                    required
                    placeholder="Enter Site Name"
                    value={siteName}
                    onChange={(v) => { setSiteName(v); clearError('site_name'); setErrorMsg(''); }}
                    error={validationErrors.site_name}
                  />
                )}
              </div>
            </div>

            <hr className="bsa-section-divider" />

            {/* Section 2: Work Order File & Remarks */}
            <div id="sec-2" className="bsa-section-block">
              <SectionHeader num="2" total={2} title="Supporting File & Instructions" desc="Upload allotment document or work order PDF and enter instructions." />
              <div className="bsa-form-grid bsa-form-grid--3col">
                <FloatingFileInput
                  id="bsa-file"
                  label="Work Order / Allotment File"
                  required
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                  hint="PDF, Excel, Word or Images up to 20MB"
                  file={uploadedFile}
                  onChange={(file) => { setUploadedFile(file); clearError('file'); setErrorMsg(''); }}
                  error={validationErrors.file}
                />
                <div className="bsa-form-col-span-2">
                  <FloatingTextarea
                    id="bsa-remarks"
                    label="Remarks"
                    rows={4}
                    placeholder="Enter instructions, deadlines or milestone notes..."
                    value={remarks}
                    onChange={setRemarks}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="bsa-form-sticky-bar">
          <span className="ax-badge ax-badge--soft ax-badge--primary ax-badge--pill">New Assignment</span>
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)' }}>
            <button type="button" className="ax-btn ax-btn--secondary" onClick={handleReset} disabled={isSubmitting}>
              <span className="ax-btn__label">Reset</span>
            </button>
            <button type="submit" disabled={isSubmitting} className="ax-btn ax-btn--primary" style={{ minWidth: 220 }}>
              {isSubmitting ? (
                <>
                  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ animation: 'bsa-spin 1s linear infinite' }}><path d="M12 3a9 9 0 1 0 9 9" /></svg>
                  <span className="ax-btn__label">Assigning...</span>
                </>
              ) : (
                <>
                  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5l10 -10" /></svg>
                  <span className="ax-btn__label">Assign SRT Installation</span>
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

function SectionHeader({ num, total, title, desc }: { num: string; total: number; title: string; desc?: ReactNode }) {
  return (
    <div className="bsa-section-header">
      <div className="bsa-section-title-wrap">
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
  hint?: string;
  onChange: (file: File | null) => void;
  error?: string;
}

function FloatingFileInput({ id, label, required, accept, capture, file, existingUrl, hint, onChange, error }: FloatingFileInputProps) {
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
              {hint || (accept === 'application/pdf' || accept === '.pdf' ? 'PDF file up to 5MB' : 'JPG, PNG or WEBP up to 5MB')}
            </div>
          </>
        )}
      </div>

      <FieldFeedback error={error} />
    </div>
  );
}