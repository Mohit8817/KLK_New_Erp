import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { getCurrentUser } from '../../../../../services/authService';
import {
  upInstallationService,
  type UpRescoAssignSiteItem,
} from '../../up-services';

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
const MAX_FILE_SIZE = 5 * 1024 * 1024;

type FileKey = 'panel_image' | 'system_image' | 'inverter_image' | 'net_meter_image' | 'loger_image';

const INITIAL_FORM = {
  contact_person: '',
  contact_no: '',
  inverter_no: '',
  solar_meter_no: '',
  net_meter_no: '',
  rms_loger_no: '',
  latitude: '',
  longitude: '',
  remarks: '',
};
type FormKey = keyof typeof INITIAL_FORM;

const REQUIRED_FIELDS: Partial<Record<FormKey, string>> = {
  contact_person: 'Contact Person is required',
  contact_no: 'Contact Number is required',
  inverter_no: 'Inverter Number is required',
  solar_meter_no: 'Solar Meter Number is required',
  net_meter_no: 'Net Meter Number is required',
  rms_loger_no: 'RMS Loger Number is required',
  latitude: 'Latitude is required',
  longitude: 'Longitude is required',
};

const FILE_FIELDS: { key: FileKey; id: string; label: string; error: string }[] = [
  { key: 'panel_image', id: 'up-inst-panel', label: 'Panel Image', error: 'Panel Image is required' },
  { key: 'system_image', id: 'up-inst-system', label: 'System Image', error: 'System Image is required' },
  { key: 'inverter_image', id: 'up-inst-inverter', label: 'Inverter Image', error: 'Inverter Image is required' },
  { key: 'net_meter_image', id: 'up-inst-netmeter', label: 'Net Meter/Smart Meter Image', error: 'Net Meter Image is required' },
  { key: 'loger_image', id: 'up-inst-loger', label: 'Loger Image', error: 'Loger Image is required' },
];

const SECTIONS = [
  { id: 'sec-1', num: '1', title: 'Select Site' },
  { id: 'sec-2', num: '2', title: 'Information' },
  { id: 'sec-3', num: '3', title: 'Contact & Equipment' },
  { id: 'sec-4', num: '4', title: 'GPS & Remarks' },
  { id: 'sec-5', num: '5', title: 'Site Photos' },
];

export function UP_Installation_Resco_InstallSite() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preSelectedId = searchParams.get('site_id') || '';

  // Available sites
  const [sites, setSites] = useState<UpRescoAssignSiteItem[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState(preSelectedId);
  const [siteInfo, setSiteInfo] = useState<UpRescoAssignSiteItem | null>(null);

  // Form fields
  const [vendorName, setVendorName] = useState('mohit');
  const [formData, setFormData] = useState({ ...INITIAL_FORM });
  const [files, setFiles] = useState<Record<FileKey, File | null>>({
    panel_image: null,
    system_image: null,
    inverter_image: null,
    net_meter_image: null,
    loger_image: null,
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const clearError = (name: string) => {
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const setField = (name: FormKey, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) clearError(name);
  };

  const f = (name: FormKey) => ({
    value: formData[name],
    onChange: (v: string) => setField(name, v),
    error: fieldErrors[name],
  });

  const handleFileChange = (key: FileKey, file: File | null) => {
    if (file && file.size > MAX_FILE_SIZE) {
      alert('File size exceeds 5MB limit.');
      return;
    }
    setFiles((prev) => ({ ...prev, [key]: file }));
    if (fieldErrors[key]) clearError(key);
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Apply fetched site detail to info card + prefilled form fields
  const applyDetail = (detail: any) => {
    setSiteInfo({
      id: detail.id,
      site_name: detail.site_name,
      district: detail.district,
      location: detail.address,
      firm_name: detail.firm_name,
      ca_no: detail.ca_no,
      sanction_load: detail.sanction_load,
      plant_sc: detail.plant_sc,
      wo_no: detail.wo_no,
      status: 2,
    });
    setFormData((prev) => ({
      ...prev,
      contact_person: detail.contact_person || prev.contact_person,
      contact_no: detail.contact_number || prev.contact_no,
      inverter_no: detail.inverter_no || prev.inverter_no,
      solar_meter_no: detail.solarmeter_no || prev.solar_meter_no,
      net_meter_no: detail.nm_sm_no || prev.net_meter_no,
      rms_loger_no: detail.loger_no || prev.rms_loger_no,
    }));
  };

  useEffect(() => {
    const user = getCurrentUser();
    if (user?.name) setVendorName(user.name);

    setLoading(true);
    // Endpoint 4: Fetch sites ready for installation
    upInstallationService
      .getRescoAvailableSites()
      .then(async (avail) => {
        if (Array.isArray(avail) && avail.length > 0) {
          const mapped = avail.map((a) => ({
            id: a.id,
            site_name: a.site_name,
            status: 2,
          } as UpRescoAssignSiteItem));
          setSites(mapped);
          const targetId = preSelectedId || String(mapped[0]?.id || '');
          if (targetId) {
            setSelectedSiteId(targetId);
            const detail = await upInstallationService.getRescoSiteDetail(targetId);
            if (detail) applyDetail(detail);
          }
        } else {
          // Fallback to assigned sites
          const res = await upInstallationService.getRescoAssignSites();
          const list = res.data || [];
          setSites(list);
          if (preSelectedId) {
            const matched = list.find((s) => String(s.id) === preSelectedId);
            if (matched) setSiteInfo(matched);
          }
        }
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [preSelectedId]);

  const handleSelectSite = async (id: string) => {
    setSelectedSiteId(id);
    clearError('site_id');
    const matched = sites.find((s) => String(s.id) === id);
    setSiteInfo(matched || null);
    if (!id) return;

    try {
      const detail = await upInstallationService.getRescoSiteDetail(id);
      if (detail) applyDetail(detail);
    } catch (e) {
      console.warn('Error fetching site detail:', e);
    }
  };

  // GPS detection
  const fetchGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
        setLocating(false);
      },
      (err) => {
        alert(`GPS Error: ${err.message}`);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleReset = () => {
    setFormData({ ...INITIAL_FORM });
    setFiles({ panel_image: null, system_image: null, inverter_image: null, net_meter_image: null, loger_image: null });
    setFieldErrors({});
  };

  // Validation
  const validate = () => {
    const errs: Record<string, string> = {};
    if (!selectedSiteId) errs.site_id = 'Please select Site ID';
    (Object.keys(REQUIRED_FIELDS) as FormKey[]).forEach((key) => {
      if (!formData[key].trim()) errs[key] = REQUIRED_FIELDS[key] as string;
    });
    FILE_FIELDS.forEach(({ key, error }) => {
      if (!files[key]) errs[key] = error;
    });
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Submit
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    if (!validate()) {
      setErrorMsg('Please fill in all mandatory fields.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => {
        document.querySelector('.is-invalid')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
      return;
    }

    setSubmitting(true);
    try {
      const { contact_person, contact_no, inverter_no, solar_meter_no, net_meter_no, rms_loger_no, latitude, longitude, remarks } = formData;
      const fd = new FormData();
      fd.append('resco_id', selectedSiteId);
      fd.append('site_id', selectedSiteId);
      fd.append('vendor', vendorName);
      fd.append('contact_person', contact_person);
      fd.append('contact_number', contact_no);
      fd.append('contact_no', contact_no);
      fd.append('inverter_no', inverter_no);
      fd.append('solarmeter_no', solar_meter_no);
      fd.append('solar_meter_no', solar_meter_no);
      fd.append('nm_sm_no', net_meter_no);
      fd.append('net_meter_no', net_meter_no);
      fd.append('net_smart_meter_no', net_meter_no);
      fd.append('loger_no', rms_loger_no);
      fd.append('rms_loger_no', rms_loger_no);
      fd.append('inst_latitude', latitude);
      fd.append('latitude', latitude);
      fd.append('inst_longitude', longitude);
      fd.append('longitude', longitude);
      if (remarks) {
        fd.append('inst_remarks', remarks);
        fd.append('remarks', remarks);
      }

      if (files.panel_image) fd.append('panel_image', files.panel_image);
      if (files.system_image) fd.append('system_image', files.system_image);
      if (files.inverter_image) fd.append('inverter_image', files.inverter_image);
      if (files.net_meter_image) {
        fd.append('nm_sm_image', files.net_meter_image);
        fd.append('net_meter_image', files.net_meter_image);
      }
      if (files.loger_image) fd.append('loger_image', files.loger_image);

      const res = await upInstallationService.storeRescoInstallation(fd);
      if (res.status) {
        setSuccessMsg(res.message || 'Resco installation recorded successfully!');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => {
          navigate('/v/up/resco-view-install-site');
        }, 1500);
      } else {
        setErrorMsg(res.message || 'Failed to submit installation.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Server error occurred.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  const siteSelectOptions: Option[] = sites.map((s) => ({
    value: String(s.id),
    label: `${s.site_name || `Site #${s.id}`}${s.district ? ` (${s.district})` : ''}`,
  }));

  return (
    <div className="up-single-card-form">
      <style>{SINGLE_CARD_FORM_CSS}</style>

      <PageHead
        title="UP Resco Install Site"
        subtitle={
          <span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>
            Submit completed rooftop installation milestones, meter numbers and equipment photos
          </span>
        }
        breadcrumbs={[
          { label: 'Home', href: '/v' },
          { label: 'UP Resco Install Site' },
        ]}
        actions={
          <Link to="/v/up/resco-view-install-site" className="ax-btn ax-btn--secondary ax-btn--pill">
            <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l14 0" /><path d="M5 12l6 6" /><path d="M5 12l6 -6" /></svg>
            <span className="ax-btn__label">Installation Details</span>
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
              <h2 className="ax-card__title" style={{ margin: 0 }}>UP Resco Installation Form</h2>
              <p className="ax-card__subtitle" style={{ margin: '4px 0 0' }}>
                All installation fields organized inside one main card across 5 dedicated sections.
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
            {/* Section 1: Select Site */}
            <div id="sec-1" className="up-section-block">
              <SectionHeader num="1" total={5} title="Site Information" desc="Choose the site ready for installation." />
              <div className="up-form-grid up-form-grid--3col">
                <div className="up-form-col-span-full" style={{ maxWidth: 540 }}>
                  <FloatingSelect
                    id="up-inst-site"
                    label="Select Id"
                    required
                    placeholder={loading ? 'Loading sites...' : '-- Select Id --'}
                    value={selectedSiteId}
                    options={siteSelectOptions}
                    disabled={loading}
                    onChange={handleSelectSite}
                    error={fieldErrors.site_id}
                  />
                </div>
              </div>
            </div>

            <hr className="up-section-divider" />

            {/* Section 2: Information (read-only) */}
            <div id="sec-2" className="up-section-block">
              <SectionHeader num="2" total={5} title="Information" desc="Auto-populated from selected site record (Read-only)." />
              <div className="up-form-grid up-form-grid--3col">
                <FloatingInput id="up-inst-state" label="State" readOnly value={siteInfo?.state ? siteInfo.state.toUpperCase() : 'UP'} />
                <FloatingInput id="up-inst-district" label="District" readOnly value={siteInfo?.district || ''} />
                <FloatingInput id="up-inst-site-name" label="Site Name" readOnly value={siteInfo?.site_name || ''} />
                <FloatingInput id="up-inst-location" label="Location" readOnly value={siteInfo?.location || ''} />
                <FloatingInput id="up-inst-firm" label="Firm Name" readOnly value={siteInfo?.firm_name || ''} />
                <FloatingInput id="up-inst-ca" label="CA No." readOnly value={siteInfo?.ca_no || ''} />
                <FloatingInput id="up-inst-sanction" label="Sanction Load" readOnly value={siteInfo?.sanction_load || ''} />
                <FloatingInput id="up-inst-plant" label="Plant SC" readOnly value={siteInfo?.plant_sc || ''} />
                <FloatingInput id="up-inst-wo" label="WO No." readOnly value={siteInfo?.wo_no || ''} />
              </div>
            </div>

            <hr className="up-section-divider" />

            {/* Section 3: Contact & Equipment */}
            <div id="sec-3" className="up-section-block">
              <SectionHeader
                num="3"
                total={5}
                title="Contact & Equipment Numbers"
                desc={<>The field labels marked with <span style={{ color: 'var(--ax-danger-500)' }}>*</span> are input fields.</>}
              />
              <div className="up-form-grid up-form-grid--3col">
                <FloatingInput id="up-inst-vendor" label="Vendor" required readOnly value={vendorName} />
                <FloatingInput id="up-inst-person" label="Contact Person" required placeholder="Enter Contact Person Name" {...f('contact_person')} />
                <FloatingInput id="up-inst-contact" label="Contact No." type="tel" required placeholder="Enter Contact Number" {...f('contact_no')} />
                <FloatingInput id="up-inst-inverter-no" label="Inverter No" required placeholder="Enter Inverter Number" {...f('inverter_no')} />
                <FloatingInput id="up-inst-solarmeter" label="Solar Meter Number" required placeholder="Enter Solar Meter Number" {...f('solar_meter_no')} />
                <FloatingInput id="up-inst-netmeter-no" label="Net Meter/Smart Meter Number" required placeholder="Enter Net/Smart Meter Number" {...f('net_meter_no')} />
                <FloatingInput id="up-inst-rms" label="RMS Loger Number" required placeholder="Enter RMS Loger Number" {...f('rms_loger_no')} />
              </div>
            </div>

            <hr className="up-section-divider" />

            {/* Section 4: GPS & Remarks */}
            <div id="sec-4" className="up-section-block">
              <SectionHeader num="4" total={5} title="GPS Coordinates & Remarks" desc="Exact site geotag coordinates." />
              <div className="up-form-grid up-form-grid--3col">
                <FloatingInput id="up-inst-lat" label="Latitude" required placeholder="Enter Latitude" {...f('latitude')} />
                <FloatingInput id="up-inst-lng" label="Longitude" required placeholder="Enter Longitude" {...f('longitude')} />
                <div>
                  <button type="button" className="ax-btn ax-btn--secondary up-gps-cell" style={{ width: '100%' }} onClick={fetchGPS} disabled={locating}>
                    <span className="ax-btn__label">{locating ? 'Detecting GPS...' : '📍 Get GPS'}</span>
                  </button>
                </div>
                <div className="up-form-col-span-full">
                  <FloatingTextarea id="up-inst-remarks" label="Remarks" placeholder="Enter Remarks..." {...f('remarks')} />
                </div>
              </div>
            </div>

            <hr className="up-section-divider" />

            {/* Section 5: Photos */}
            <div id="sec-5" className="up-section-block">
              <SectionHeader num="5" total={5} title="Installation Photo Evidence" desc="Upload clear photos of all 5 installed components (up to 5MB each)." />
              <div className="up-form-grid up-form-grid--3col">
                {FILE_FIELDS.map(({ key, id, label }) => (
                  <FloatingFileInput
                    key={key}
                    id={id}
                    label={label}
                    required
                    accept="image/*,.pdf"
                    file={files[key]}
                    onChange={(file) => handleFileChange(key, file)}
                    error={fieldErrors[key]}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="up-form-sticky-bar">
          <span className="ax-badge ax-badge--soft ax-badge--primary ax-badge--pill">New Installation</span>
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)' }}>
            <button type="button" className="ax-btn ax-btn--secondary" onClick={handleReset} disabled={submitting}>
              <span className="ax-btn__label">Reset</span>
            </button>
            <button type="submit" disabled={submitting || !selectedSiteId} className="ax-btn ax-btn--primary" style={{ minWidth: 200 }}>
              {submitting ? (
                <>
                  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ animation: 'up-spin 1s linear infinite' }}><path d="M12 3a9 9 0 1 0 9 9" /></svg>
                  <span className="ax-btn__label">Submitting...</span>
                </>
              ) : (
                <>
                  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5l10 -10" /></svg>
                  <span className="ax-btn__label">Submit Installation</span>
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

export default UP_Installation_Resco_InstallSite;

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