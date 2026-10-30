import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  goaSrtInstallationService,
  type GoaSrtSiteDropdownItem,
  type GoaSrtSiteDetailItem,
} from '../../goa-services/goaSrtInstallationService';

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

.goa-form-sticky-bar { position: sticky; bottom: var(--ax-space-4); z-index: 30; margin-top: var(--ax-space-6); padding: var(--ax-space-3) var(--ax-space-5); background: var(--ax-surface-solid); border: 1px solid var(--ax-border); border-radius: var(--ax-radius-xl); box-shadow: var(--ax-shadow-lg); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--ax-space-3); backdrop-filter: blur(12px); }

@keyframes goa-spin { to { transform: rotate(360deg); } }
`;

const INITIAL_FORM = {
  contact_person: '',
  contact_number: '',
  ca_no: '',
  solarmeter_no: '',
  nm_sm_no: '',
  loger_no: '',
  inverter_no: '',
  inst_latitude: '',
  inst_longitude: '',
  inst_remarks: '',
};

type FormKey = keyof typeof INITIAL_FORM;
type FileKey = 'panel_image' | 'system_image' | 'inverter_image' | 'nm_sm_image' | 'loger_image';
type Option = { value: string; label: string };

const SECTIONS = [
  { id: 'sec-1', num: '1', title: 'Select Site' },
  { id: 'sec-2', num: '2', title: 'Site & Plant Info' },
  { id: 'sec-3', num: '3', title: 'Contact & CA' },
  { id: 'sec-4', num: '4', title: 'Equipment Numbers' },
  { id: 'sec-5', num: '5', title: 'GPS & Remarks' },
  { id: 'sec-6', num: '6', title: 'Site Photos' },
];

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export function Goa_Installation_SRT_InstallationDetails() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialSiteId = searchParams.get('site_id') || searchParams.get('id') || '';
  const isEditMode = Boolean(searchParams.get('edit') === '1' || searchParams.get('edit_id'));

  // Site dropdown & detail
  const [siteOptions, setSiteOptions] = useState<GoaSrtSiteDropdownItem[]>([]);
  const [loadingSites, setLoadingSites] = useState(false);
  const [selectedSiteId, setSelectedSiteId] = useState<string>(initialSiteId);
  const [siteDetail, setSiteDetail] = useState<GoaSrtSiteDetailItem | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Form + files
  const [formData, setFormData] = useState({ ...INITIAL_FORM });
  const [files, setFiles] = useState<Record<FileKey, File | null>>({
    panel_image: null,
    system_image: null,
    inverter_image: null,
    nm_sm_image: null,
    loger_image: null,
  });
  const [existingFiles, setExistingFiles] = useState<Partial<Record<FileKey, string>>>({});

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [geoLocating, setGeoLocating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});

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

  // Shortcut props for floating fields
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

  // 1. Load accepted site names
  useEffect(() => {
    let active = true;
    (async () => {
      setLoadingSites(true);
      try {
        const list = await goaSrtInstallationService.fetchSiteNames();
        if (active) setSiteOptions(Array.isArray(list) ? list : []);
      } catch (err) {
        console.warn('Failed to load site dropdown:', err);
      } finally {
        if (active) setLoadingSites(false);
      }
    })();
    return () => { active = false; };
  }, []);

  // 2. Fetch site detail when selected
  const handleSiteSelect = async (siteId: string) => {
    setSelectedSiteId(siteId);
    setSiteDetail(null);
    clearError('site_id');
    if (!siteId) return;

    try {
      setLoadingDetail(true);
      setErrorMsg(null);
      const detail = await goaSrtInstallationService.fetchSiteDetail(siteId);
      if (detail) {
        setSiteDetail(detail);
        setFormData((prev) => ({
          ...prev,
          contact_person: detail.contact_person || '',
          contact_number: detail.contact_number || '',
          ca_no: detail.ca_no || '',
          solarmeter_no: detail.solarmeter_no || '',
          nm_sm_no: detail.nm_sm_no || '',
          loger_no: detail.loger_no || '',
          inverter_no: detail.inverter_no || '',
        }));
      }
    } catch (err) {
      console.error('[Goa SRT Installation] fetchSiteDetail error:', err);
      setErrorMsg('Failed to load site details.');
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    if (!initialSiteId) return;

    if (isEditMode) {
      (async () => {
        setLoadingDetail(true);
        try {
          const existing = await goaSrtInstallationService.fetchUpdateSite(initialSiteId);
          if (existing) {
            const sName = existing.site_name || `Site #${initialSiteId}`;
            setSiteOptions((prev) => {
              if (prev.some((s) => String(s.id) === String(initialSiteId))) return prev;
              return [{ id: Number(initialSiteId), site_name: sName, ca_no: existing.ca_no || '' }, ...prev];
            });
            setSelectedSiteId(String(initialSiteId));
            setSiteDetail({
              id: Number(initialSiteId),
              site_name: sName,
              district: existing.district || '',
              dept_name: existing.dept_name || '',
              sanction_load: existing.sanction_load || '',
              plant_sc: existing.plant_sc || '',
              wo_no: existing.wo_no || '',
              phase: existing.phase || '',
              address: existing.address || '',
              location: existing.location || '',
              firm_name: existing.firm_name || '',
              ca_no: existing.ca_no || '',
              contact_person: existing.contact_person || '',
              contact_number: existing.contact_number || '',
              solarmeter_no: existing.solarmeter_no || '',
              nm_sm_no: existing.nm_sm_no || '',
              loger_no: existing.loger_no || '',
              inverter_no: existing.inverter_no || '',
            });
            setFormData({
              contact_person: existing.contact_person || '',
              contact_number: existing.contact_number || '',
              ca_no: existing.ca_no || '',
              solarmeter_no: existing.solarmeter_no || '',
              nm_sm_no: existing.nm_sm_no || '',
              loger_no: existing.loger_no || '',
              inverter_no: existing.inverter_no || '',
              inst_latitude: existing.inst_latitude || '',
              inst_longitude: existing.inst_longitude || '',
              inst_remarks: existing.inst_remarks || '',
            });

            const ex: Partial<Record<FileKey, string>> = {};
            (['panel_image', 'system_image', 'inverter_image', 'nm_sm_image', 'loger_image'] as FileKey[]).forEach((k) => {
              const raw = (existing as any)[k];
              if (raw) ex[k] = goaSrtInstallationService.resolveImageUrl(raw);
            });
            setExistingFiles(ex);
          } else {
            handleSiteSelect(initialSiteId);
          }
        } catch (err) {
          console.warn('[Goa SRT] Failed to load update site:', err);
          handleSiteSelect(initialSiteId);
        } finally {
          setLoadingDetail(false);
        }
      })();
    } else {
      handleSiteSelect(initialSiteId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSiteId, isEditMode]);

  // GPS detection
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setGeoLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          inst_latitude: pos.coords.latitude.toFixed(6),
          inst_longitude: pos.coords.longitude.toFixed(6),
        }));
        setGeoLocating(false);
      },
      (err) => {
        alert(`Failed to detect GPS location: ${err.message}`);
        setGeoLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Validation
  const validate = () => {
    const errs: Record<string, string[]> = {};
    const req = (key: FormKey, msg: string) => {
      if (!formData[key].trim()) errs[key] = [msg];
    };

    if (!selectedSiteId) errs.site_id = ['Please select an assigned rooftop site.'];
    req('contact_person', 'Contact person name is required.');
    req('contact_number', 'Contact number is required.');
    req('ca_no', 'CA number is required.');
    req('solarmeter_no', 'Solar meter number is required.');
    req('nm_sm_no', 'Net / Smart meter number is required.');
    req('inverter_no', 'Inverter serial number is required.');
    req('loger_no', 'Datalogger number is required.');

    if (!isEditMode) {
      (['panel_image', 'system_image', 'inverter_image', 'nm_sm_image', 'loger_image'] as FileKey[]).forEach((k) => {
        if (!files[k]) errs[k] = ['This photo is required.'];
      });
    }

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
      fd.append('id', String(selectedSiteId));
      fd.append('site_id', String(selectedSiteId));
      fd.append('contact_person', formData.contact_person.trim());
      fd.append('contact_number', formData.contact_number.trim());
      fd.append('ca_no', formData.ca_no.trim());
      fd.append('solarmeter_no', formData.solarmeter_no.trim());
      fd.append('nm_sm_no', formData.nm_sm_no.trim());
      fd.append('loger_no', formData.loger_no.trim());
      fd.append('inverter_no', formData.inverter_no.trim());
      if (formData.inst_latitude) fd.append('inst_latitude', formData.inst_latitude);
      if (formData.inst_longitude) fd.append('inst_longitude', formData.inst_longitude);
      if (formData.inst_remarks) fd.append('inst_remarks', formData.inst_remarks.trim());

      if (files.panel_image) fd.append('panel_image', files.panel_image);
      if (files.system_image) fd.append('system_image', files.system_image);
      if (files.inverter_image) fd.append('inverter_image', files.inverter_image);
      if (files.nm_sm_image) fd.append('nm_sm_image', files.nm_sm_image);
      if (files.loger_image) fd.append('loger_image', files.loger_image);

      if (isEditMode) {
        await goaSrtInstallationService.updateSiteStore(fd);
        setSuccessMsg('Installation Details Updated Successfully! Status reset to pending verification.');
      } else {
        const res = await goaSrtInstallationService.storeInstallationData(fd);
        setSuccessMsg(res?.message || 'SRT Site Installed Successfully!');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });

      setTimeout(() => {
        navigate('/v/goa/srt/allassignsite');
      }, 1500);
    } catch (err: any) {
      console.error('[Goa SRT Installation] submit error:', err);
      setErrorMsg(err?.message || 'Failed to submit SRT installation data.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  const siteSelectOptions: Option[] = siteOptions.map((s) => ({
    value: String(s.id),
    label: `${s.site_name} (ID: #${s.id})`,
  }));

  return (
    <div className="goa-single-card-form">
      <style>{SINGLE_CARD_FORM_CSS}</style>

      <PageHead
        title={isEditMode ? 'Goa SRT - Edit Installation Details' : 'Goa SRT - Installation Details'}
        subtitle={
          <span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>
            {isEditMode
              ? 'Update solar rooftop equipment serial numbers, GPS coordinates, remarks, and photos.'
              : 'Capture rooftop solar installation data, serial numbers, geocoordinates, and verification photos.'}
          </span>
        }
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Goa' },
          { label: 'Installation' },
          { label: 'SRT', href: '/v/goa/vendor-srt-installation-dashboard' },
          { label: isEditMode ? 'Edit Installation' : 'Installation Details' },
        ]}
        actions={
          <Link to="/v/goa/srt/allassignsite" className="ax-btn ax-btn--secondary ax-btn--pill">
            <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l14 0" /><path d="M5 12l6 6" /><path d="M5 12l6 -6" /></svg>
            <span className="ax-btn__label">Installed Sites</span>
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
              <span className="ax-card__eyebrow">Installation</span>
              <h2 className="ax-card__title" style={{ margin: 0 }}>
                {isEditMode ? 'Edit Goa SRT Installation' : 'Goa Solar Rooftop Commissioning Form'}
              </h2>
              <p className="ax-card__subtitle" style={{ margin: '4px 0 0' }}>
                All installation fields organized inside one main card across 6 dedicated sections.
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
            {/* Section 1: Select Site */}
            <div id="sec-1" className="goa-section-block">
              <SectionHeader num="1" title="Select Rooftop Site" desc="Choose from accepted sites pending installation." />
              <div className="goa-form-grid goa-form-grid--3col">
                <div className="goa-form-col-span-full" style={{ maxWidth: 540 }}>
                  <FloatingSelect
                    id="goa-inst-site"
                    label="Assigned Site"
                    required
                    placeholder={loadingSites ? 'Loading sites...' : '-- Choose Assigned SRT Site --'}
                    value={selectedSiteId}
                    options={siteSelectOptions}
                    disabled={isEditMode || loadingSites || submitting}
                    onChange={handleSiteSelect}
                    error={validationErrors.site_id?.[0]}
                  />
                </div>
              </div>
            </div>

            <hr className="goa-section-divider" />

            {/* Section 2: Site & Plant Information (read-only) */}
            <div id="sec-2" className="goa-section-block">
              <SectionHeader
                num="2"
                title="Site & Plant Information"
                desc={loadingDetail ? 'Loading site details...' : 'Auto-populated from selected site record (Read-only).'}
              />
              <div className="goa-form-grid goa-form-grid--3col">
                <FloatingInput id="goa-inst-discom" label="Discom" readOnly value={siteDetail?.discom || ''} />
                <FloatingInput id="goa-inst-dept" label="Department" readOnly value={siteDetail?.dept_name || ''} />
                <FloatingInput id="goa-inst-district" label="District" readOnly value={siteDetail?.district || ''} />
                <FloatingInput id="goa-inst-state" label="State" readOnly value={siteDetail?.state || 'Goa'} />
                <FloatingInput id="goa-inst-firm" label="Firm Name" readOnly value={siteDetail?.firm_name || ''} />
                <FloatingInput id="goa-inst-plant" label="Plant Capacity" readOnly value={siteDetail?.plant_sc || ''} />
                <FloatingInput id="goa-inst-phase" label="Connection Phase" readOnly value={siteDetail?.phase || ''} />
                <FloatingInput id="goa-inst-sanction" label="Sanction Load (kW)" readOnly value={siteDetail?.sanction_load || ''} />
                <div />
                <div className="goa-form-col-span-full">
                  <FloatingInput id="goa-inst-location" label="Site Location / Address" readOnly value={siteDetail?.location || ''} />
                </div>
              </div>
            </div>

            <hr className="goa-section-divider" />

            {/* Section 3: Contact & CA Identifiers */}
            <div id="sec-3" className="goa-section-block">
              <SectionHeader
                num="3"
                title="Contact & CA Identifiers"
                desc={<>The field labels marked with <span style={{ color: 'var(--ax-danger-500)' }}>*</span> are input fields.</>}
              />
              <div className="goa-form-grid goa-form-grid--3col">
                <FloatingInput id="goa-inst-person" label="Contact Person Name" required placeholder="Nodal contact person" {...f('contact_person')} />
                <FloatingInput id="goa-inst-contact" label="Contact Number" type="tel" required placeholder="Contact number" {...f('contact_number')} />
                <FloatingInput id="goa-inst-ca" label="CA Number" required placeholder="Discom CA number" {...f('ca_no')} />
              </div>
            </div>

            <hr className="goa-section-divider" />

            {/* Section 4: Meter & Equipment Serial Numbers */}
            <div id="sec-4" className="goa-section-block">
              <SectionHeader num="4" title="Meter & Equipment Serial Numbers" desc="Installed solar meter, net / smart meter, inverter and datalogger serials." />
              <div className="goa-form-grid goa-form-grid--3col">
                <FloatingInput id="goa-inst-solarmeter" label="Solar Meter Number" required placeholder="Enter Solar Meter Number" {...f('solarmeter_no')} />
                <FloatingInput id="goa-inst-nmsm" label="Net / Smart Meter No" required placeholder="Enter Net / Smart Meter No" {...f('nm_sm_no')} />
                <FloatingInput id="goa-inst-inverter" label="Inverter Serial Number" required placeholder="Enter Inverter Serial Number" {...f('inverter_no')} />
                <FloatingInput id="goa-inst-loger" label="Datalogger Number" required placeholder="Enter Datalogger Number" {...f('loger_no')} />
              </div>
            </div>

            <hr className="goa-section-divider" />

            {/* Section 5: GPS & Remarks */}
            <div id="sec-5" className="goa-section-block">
              <SectionHeader num="5" title="GPS Coordinates & Remarks" desc="Exact site geotag coordinates." />
              <div className="goa-form-grid goa-form-grid--3col">
                <FloatingInput id="goa-inst-lat" label="Latitude" placeholder="e.g. 15.4989" {...f('inst_latitude')} />
                <FloatingInput id="goa-inst-lng" label="Longitude" placeholder="e.g. 73.8278" {...f('inst_longitude')} />
                <div>
                  <button
                    type="button"
                    className="ax-btn ax-btn--secondary goa-gps-cell"
                    style={{ width: '100%' }}
                    onClick={handleGetLocation}
                    disabled={geoLocating}
                  >
                    <span className="ax-btn__label">{geoLocating ? 'Detecting GPS...' : '📍 Get GPS'}</span>
                  </button>
                </div>
                <div className="goa-form-col-span-full">
                  <FloatingTextarea id="goa-inst-remarks" label="Installation Remarks (optional)" placeholder="Enter Remarks..." {...f('inst_remarks')} />
                </div>
              </div>
            </div>

            <hr className="goa-section-divider" />

            {/* Section 6: Photo Evidence */}
            <div id="sec-6" className="goa-section-block">
              <SectionHeader num="6" title="Installation Photo Evidence" desc="Upload clear photos of all 5 installed components (up to 5MB each)." />
              <div className="goa-form-grid goa-form-grid--3col">
                <FloatingFileInput id="goa-img-panel" label="Panel Image" required={!isEditMode} accept="image/*" capture="environment" file={files.panel_image} existingUrl={existingFiles.panel_image} onChange={(file) => handleFileChange('panel_image', file)} error={validationErrors.panel_image?.[0]} />
                <FloatingFileInput id="goa-img-system" label="Complete System Photo" required={!isEditMode} accept="image/*" capture="environment" file={files.system_image} existingUrl={existingFiles.system_image} onChange={(file) => handleFileChange('system_image', file)} error={validationErrors.system_image?.[0]} />
                <FloatingFileInput id="goa-img-inverter" label="Inverter Photo" required={!isEditMode} accept="image/*" capture="environment" file={files.inverter_image} existingUrl={existingFiles.inverter_image} onChange={(file) => handleFileChange('inverter_image', file)} error={validationErrors.inverter_image?.[0]} />
                <FloatingFileInput id="goa-img-nmsm" label="Net / Smart Meter Photo" required={!isEditMode} accept="image/*" capture="environment" file={files.nm_sm_image} existingUrl={existingFiles.nm_sm_image} onChange={(file) => handleFileChange('nm_sm_image', file)} error={validationErrors.nm_sm_image?.[0]} />
                <FloatingFileInput id="goa-img-loger" label="Logger Photo" required={!isEditMode} accept="image/*" capture="environment" file={files.loger_image} existingUrl={existingFiles.loger_image} onChange={(file) => handleFileChange('loger_image', file)} error={validationErrors.loger_image?.[0]} />
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="goa-form-sticky-bar">
          <span className="ax-badge ax-badge--soft ax-badge--primary ax-badge--pill">
            {isEditMode ? 'Edit Mode' : 'New Installation'}
          </span>
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)' }}>
            <button type="button" className="ax-btn ax-btn--secondary" onClick={() => navigate('/v/goa/srt/allassignsite')} disabled={submitting}>
              <span className="ax-btn__label">Cancel</span>
            </button>
            <button type="submit" disabled={submitting} className="ax-btn ax-btn--primary" style={{ minWidth: 200 }}>
              {submitting ? (
                <>
                  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ animation: 'goa-spin 1s linear infinite' }}><path d="M12 3a9 9 0 1 0 9 9" /></svg>
                  <span className="ax-btn__label">{isEditMode ? 'Updating...' : 'Submitting...'}</span>
                </>
              ) : (
                <>
                  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5l10 -10" /></svg>
                  <span className="ax-btn__label">{isEditMode ? 'Save Changes' : 'Submit Installation Data'}</span>
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
            Section {num} of 6
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
  placeholder?: string;
  value: string;
  onChange?: (val: string) => void;
  error?: string;
}

function FloatingInput({ id, label, type = 'text', required, readOnly, placeholder = ' ', value, onChange, error }: FloatingInputProps) {
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
              JPG, PNG or WEBP up to 5MB
            </div>
          </>
        )}
      </div>

      <FieldFeedback error={error} />
    </div>
  );
}

export default Goa_Installation_SRT_InstallationDetails;