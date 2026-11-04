import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  upInstallationService,
  type UpKusumCReadySiteItem,
} from '../../up-services';

const DASH = '—';

/* ═══════════════════════════════════════════════════════════════════════════
 * CSS: Unified Single-Card Layout with Floating Labels & Section Dividers
 * (Same design system as Kashmir SRT / Bihar SRT Survey)
 * ═══════════════════════════════════════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════════════════════════════════════
 * Sections Config
 * ═══════════════════════════════════════════════════════════════════════════ */
const SECTIONS = [
  { id: 'sec-1', num: '1', title: 'Site Selection' },
  { id: 'sec-2', num: '2', title: 'Equipment Serials' },
  { id: 'sec-3', num: '3', title: 'Geotag & Remarks' },
  { id: 'sec-4', num: '4', title: 'Photographs' },
];
const TOTAL_SECTIONS = SECTIONS.length;

/* ═══════════════════════════════════════════════════════════════════════════
 * Main Component
 * ═══════════════════════════════════════════════════════════════════════════ */
export function UP_Installation_KusumC_InstallSite() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preSelectedId = searchParams.get('site_id') || searchParams.get('id') || '';

  // Dropdown sites & selected site details
  const [readySites, setReadySites] = useState<UpKusumCReadySiteItem[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState(preSelectedId);
  const [siteDetails, setSiteDetails] = useState<UpKusumCReadySiteItem | null>(null);

  // Form Fields
  const [inverterNo, setInverterNo] = useState('');
  const [vfdNo, setVfdNo] = useState('');
  const [moduleSerials, setModuleSerials] = useState<string[]>(['']);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [remarks, setRemarks] = useState('');

  // 3 Photo uploads
  const [moduleImage, setModuleImage] = useState<File | null>(null);
  const [inverterVfdImage, setInverterVfdImage] = useState<File | null>(null);
  const [runningWaterImage, setRunningWaterImage] = useState<File | null>(null);

  // States
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [geoLocating, setGeoLocating] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Load available sites
  useEffect(() => {
    setLoading(true);
    upInstallationService
      .getKusumCReadySites()
      .then(async (sites) => {
        setReadySites(sites || []);
        const targetId = preSelectedId || (sites.length > 0 ? String(sites[0].id) : '');
        if (targetId) {
          setSelectedSiteId(targetId);
          loadSiteDetail(targetId, sites);
        }
      })
      .catch((err) => console.warn('Error loading Kusum-C sites:', err))
      .finally(() => setLoading(false));
  }, [preSelectedId]);

  const loadSiteDetail = async (id: string, list: UpKusumCReadySiteItem[] = readySites) => {
    try {
      const detail = await upInstallationService.getKusumCSiteDetail(id);
      if (detail) {
        setSiteDetails(detail);
        if (detail.inverter_no) setInverterNo(detail.inverter_no);
        if (detail.vfd_no) setVfdNo(detail.vfd_no);
      } else {
        const found = list.find((s) => String(s.id) === id);
        setSiteDetails(found || null);
      }
    } catch {
      const found = list.find((s) => String(s.id) === id);
      setSiteDetails(found || null);
    }
  };

  const handleSelectSite = (id: string) => {
    setSelectedSiteId(id);
    setFieldErrors({});
    loadSiteDetail(id);
  };

  const handleAddModuleSerial = () => {
    setModuleSerials((prev) => [...prev, '']);
  };

  const handleRemoveModuleSerial = (idx: number) => {
    setModuleSerials((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleModuleSerialChange = (idx: number, val: string) => {
    setModuleSerials((prev) => {
      const copy = [...prev];
      copy[idx] = val;
      return copy;
    });
  };

  const fetchGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setGeoLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
        setGeoLocating(false);
        setToast({ type: 'success', message: 'GPS coordinates detected!' });
      },
      (err) => {
        setGeoLocating(false);
        alert(`GPS Error: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!selectedSiteId) errs.srt_id = 'Please select a site.';
    if (!inverterNo.trim()) errs.inverter_no = 'Inverter Number is required.';
    if (!vfdNo.trim()) errs.vfd_no = 'VFD Number is required.';
    const validSerials = moduleSerials.filter((s) => s.trim() !== '');
    if (validSerials.length === 0) errs.module_serial = 'At least 1 module serial number is required.';
    if (!latitude.trim()) errs.inst_latitude = 'Latitude is required.';
    if (!longitude.trim()) errs.inst_longitude = 'Longitude is required.';
    if (!moduleImage) errs.module_image = 'Farmer with Module photo is required.';
    if (!inverterVfdImage) errs.inverter_vfd_image = 'Farmer with VFD & Inverter photo is required.';
    if (!runningWaterImage) errs.running_water_image = 'Farmer with Running Water photo is required.';

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setToast(null);

    if (!validate()) {
      setToast({ type: 'error', message: 'Please complete all required fields.' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => {
        document.querySelector('.is-invalid')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
      return;
    }

    setSubmitting(true);
    const fd = new FormData();
    fd.append('srt_id', selectedSiteId);
    fd.append('id', selectedSiteId);
    fd.append('inverter_no', inverterNo.trim());
    fd.append('vfd_no', vfdNo.trim());

    const validSerials = moduleSerials.filter((s) => s.trim() !== '');
    validSerials.forEach((sn) => {
      fd.append('module_serial_no[]', sn.trim());
    });

    fd.append('inst_latitude', latitude.trim());
    fd.append('latitude', latitude.trim());
    fd.append('inst_longitude', longitude.trim());
    fd.append('longitude', longitude.trim());
    if (remarks.trim()) {
      fd.append('inst_remarks', remarks.trim());
      fd.append('remarks', remarks.trim());
    }

    if (moduleImage) fd.append('module_image', moduleImage);
    if (inverterVfdImage) fd.append('inverter_vfd_image', inverterVfdImage);
    if (runningWaterImage) fd.append('running_water_image', runningWaterImage);

    try {
      const res = await upInstallationService.storeKusumCInstallation(fd);
      if (res.status) {
        setToast({ type: 'success', message: res.message || 'Site installation recorded successfully!' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => {
          navigate('/v/up/view-kusum-c-install-site');
        }, 1200);
      } else {
        setToast({ type: 'error', message: res.message || 'Failed to submit installation.' });
      }
    } catch (err: any) {
      setToast({ type: 'error', message: err?.message || 'Server error occurred.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Build site dropdown options
  const siteSelectOptions: Option[] = readySites.map((s) => ({
    value: String(s.id),
    label: `#${s.id} — ${s.f_farmer_name}${s.lot_no ? ` (${s.lot_no})` : ''}${s.pump_capacity ? ` [${s.pump_capacity}]` : ''}`,
  }));

  return (
    <div className="up-single-card-form">
      <style>{SINGLE_CARD_FORM_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="UP Kusum-C Install Site"
        subtitle={
          <span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>
            Record equipment serials, GPS coordinates, and photographic evidence for Kusum-C solar pump installation
          </span>
        }
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Uttar Pradesh' },
          { label: 'Installation' },
          { label: 'Kusum C' },
          { label: 'Install Site' },
        ]}
        actions={
          <Link to="/v/up/view-kusum-c-install-site" className="ax-btn ax-btn--secondary ax-btn--pill">
            <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l14 0" /><path d="M5 12l6 6" /><path d="M5 12l6 -6" /></svg>
            <span className="ax-btn__label">View Installations</span>
          </Link>
        }
      />

      {/* Success Banner */}
      {toast?.type === 'success' && (
        <div className="ax-alert ax-alert--success" role="status" style={{ marginBottom: 'var(--ax-space-6)' }}>
          <span className="ax-alert__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5l10 -10" /></svg>
          </span>
          <div className="ax-alert__content">
            <h3 className="ax-alert__title" style={{ fontSize: 'var(--ax-text-base)', fontWeight: 600 }}>{toast.message}</h3>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {toast?.type === 'error' && (
        <div className="ax-alert ax-alert--danger" role="alert" style={{ marginBottom: 'var(--ax-space-6)' }}>
          <span className="ax-alert__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4" /><path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0" /><path d="M12 16h.01" /></svg>
          </span>
          <div className="ax-alert__content">
            <h4 className="ax-alert__title" style={{ fontWeight: 600 }}>{toast.message}</h4>
          </div>
        </div>
      )}

      {/* ── Unified Single Form Card ── */}
      <form onSubmit={handleSubmit} noValidate>
        <div className="ax-card">
          {/* Card Header with Title and Section Pills */}
          <div className="ax-card__header">
            <div>
              <span className="ax-card__eyebrow">Kusum-C Installation</span>
              <h2 className="ax-card__title" style={{ margin: 0 }}>
                UP Kusum-C Site Installation
              </h2>
              <p className="ax-card__subtitle" style={{ margin: '4px 0 0' }}>
                The field labels marked with <span style={{ color: 'var(--ax-danger-500)', fontWeight: 700 }}>*</span> are required input fields.
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
            {/* ═════════ SECTION 1: SITE SELECTION & DETAILS ═════════ */}
            <div id="sec-1" className="up-section-block">
              <SectionHeader num="1" title="Site Selection & Details" desc="Choose an accepted Kusum-C site and verify farmer details." />
              <div className="up-form-grid up-form-grid--3col">
                <FloatingSelect
                  id="up-kusumc-site"
                  label="Select Kusum-C Site"
                  required
                  placeholder={loading ? 'Loading sites…' : '-- Choose Accepted Site --'}
                  value={selectedSiteId}
                  options={siteSelectOptions}
                  disabled={loading}
                  onChange={handleSelectSite}
                  error={fieldErrors.srt_id}
                />
                <FloatingInput
                  id="up-farmer-name"
                  label="Farmer Name"
                  readOnly
                  placeholder=" "
                  value={siteDetails?.f_farmer_name || DASH}
                />
                <FloatingInput
                  id="up-district-block"
                  label="District / Block"
                  readOnly
                  placeholder=" "
                  value={[siteDetails?.f_district, siteDetails?.f_block].filter(Boolean).join(' / ') || DASH}
                />
                <FloatingInput
                  id="up-village-post"
                  label="Village / Post"
                  readOnly
                  placeholder=" "
                  value={[siteDetails?.f_village, siteDetails?.f_post].filter(Boolean).join(', ') || DASH}
                />
                <FloatingInput
                  id="up-lot-capacity"
                  label="Lot No / Capacity"
                  readOnly
                  placeholder=" "
                  value={[siteDetails?.lot_no, siteDetails?.pump_capacity || siteDetails?.volume].filter(Boolean).join(' • ') || DASH}
                />
                <FloatingInput
                  id="up-contact"
                  label="Contact Number"
                  readOnly
                  placeholder=" "
                  value={siteDetails?.f_contact || DASH}
                />
              </div>
            </div>

            <hr className="up-section-divider" />

            {/* ═════════ SECTION 2: EQUIPMENT SERIAL NUMBERS ═════════ */}
            <div id="sec-2" className="up-section-block">
              <SectionHeader num="2" title="Inverter & VFD Equipment Numbers" desc="Enter inverter, VFD, and solar module serial numbers for this installation." />
              <div className="up-form-grid up-form-grid--3col">
                <FloatingInput
                  id="up-inverter-no"
                  label="Inverter Number"
                  required
                  placeholder="e.g. INV-0001"
                  value={inverterNo}
                  onChange={(v) => setInverterNo(v)}
                  error={fieldErrors.inverter_no}
                />
                <FloatingInput
                  id="up-vfd-no"
                  label="VFD Number"
                  required
                  placeholder="e.g. VFD-0001"
                  value={vfdNo}
                  onChange={(v) => setVfdNo(v)}
                  error={fieldErrors.vfd_no}
                />
                <div /> {/* spacer */}
              </div>

              {/* Dynamic Module Serial Numbers */}
              <div style={{ marginTop: 'var(--ax-space-5)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--ax-space-3)' }}>
                  <span style={{ fontSize: 'var(--ax-text-sm)', fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                    Solar Module Serial Numbers <Asterisk />
                  </span>
                  <button
                    type="button"
                    className="ax-btn ax-btn--secondary ax-btn--xs"
                    onClick={handleAddModuleSerial}
                  >
                    + Add Module Serial
                  </button>
                </div>

                <div className="up-form-grid up-form-grid--3col">
                  {moduleSerials.map((sn, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <FloatingInput
                          id={`up-module-serial-${idx}`}
                          label={`Module Serial #${idx + 1}`}
                          placeholder={`Module Serial #${idx + 1}`}
                          value={sn}
                          onChange={(v) => handleModuleSerialChange(idx, v)}
                        />
                      </div>
                      {moduleSerials.length > 1 && (
                        <button
                          type="button"
                          className="ax-btn ax-btn--ghost ax-btn--xs"
                          style={{ color: '#ef4444', marginTop: 10 }}
                          onClick={() => handleRemoveModuleSerial(idx)}
                          title="Remove"
                        >
                          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {fieldErrors.module_serial && (
                  <span className="ax-field-feedback ax-field-feedback--error" role="alert" style={{ marginTop: 4 }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 12, height: 12 }}>
                      <circle cx="12" cy="12" r="9" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    {fieldErrors.module_serial}
                  </span>
                )}
              </div>
            </div>

            <hr className="up-section-divider" />

            {/* ═════════ SECTION 3: GPS COORDINATES & REMARKS ═════════ */}
            <div id="sec-3" className="up-section-block">
              <SectionHeader num="3" title="Geotag & Remarks" desc="Capture GPS coordinates and add optional installation remarks." />
              <div className="up-form-grid up-form-grid--3col">
                <FloatingInput
                  id="up-latitude"
                  label="Latitude"
                  required
                  placeholder="e.g. 26.8467"
                  value={latitude}
                  onChange={(v) => setLatitude(v)}
                  error={fieldErrors.inst_latitude}
                />
                <FloatingInput
                  id="up-longitude"
                  label="Longitude"
                  required
                  placeholder="e.g. 80.9462"
                  value={longitude}
                  onChange={(v) => setLongitude(v)}
                  error={fieldErrors.inst_longitude}
                />
                <div>
                  <button
                    type="button"
                    className="ax-btn ax-btn--secondary up-gps-cell"
                    style={{ width: '100%' }}
                    onClick={fetchGPS}
                    disabled={geoLocating}
                  >
                    <span className="ax-btn__label">{geoLocating ? 'Fetching GPS…' : '📍 Get GPS'}</span>
                  </button>
                </div>

                <div className="up-form-col-span-full">
                  <FloatingTextarea
                    id="up-remarks"
                    label="Installation Remarks"
                    placeholder="Optional site installation notes…"
                    value={remarks}
                    rows={2}
                    onChange={(v) => setRemarks(v)}
                  />
                </div>
              </div>
            </div>

            <hr className="up-section-divider" />

            {/* ═════════ SECTION 4: COMPLIANCE PHOTOGRAPHS ═════════ */}
            <div id="sec-4" className="up-section-block">
              <SectionHeader num="4" title="Compliance Photographs" desc="Upload required installation evidence photos of farmer with equipment." />
              <div className="up-form-grid up-form-grid--3col">
                <FloatingFileInput
                  id="up-img-module"
                  label="Farmer with Module Photo"
                  required
                  accept="image/*"
                  file={moduleImage}
                  onChange={(file) => setModuleImage(file)}
                  error={fieldErrors.module_image}
                  hint="Clear photo showing farmer beside installed solar panels."
                />
                <FloatingFileInput
                  id="up-img-inverter-vfd"
                  label="Farmer with VFD & Inverter Photo"
                  required
                  accept="image/*"
                  file={inverterVfdImage}
                  onChange={(file) => setInverterVfdImage(file)}
                  error={fieldErrors.inverter_vfd_image}
                  hint="Clear photo showing farmer with installed inverter & VFD unit."
                />
                <FloatingFileInput
                  id="up-img-running-water"
                  label="Farmer with Running Water Photo"
                  required
                  accept="image/*"
                  file={runningWaterImage}
                  onChange={(file) => setRunningWaterImage(file)}
                  error={fieldErrors.running_water_image}
                  hint="Verification photo of solar pump discharging water."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Action Footer (outside the card, same as Kashmir) */}
        <div className="up-form-sticky-bar">
          <span className="ax-badge ax-badge--soft ax-badge--primary ax-badge--pill">
            New Installation
          </span>
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)' }}>
            <button type="button" className="ax-btn ax-btn--secondary" onClick={() => navigate('/v/up/view-kusum-c-install-site')} disabled={submitting}>
              <span className="ax-btn__label">Cancel</span>
            </button>
            <button type="submit" disabled={submitting} className="ax-btn ax-btn--primary" style={{ minWidth: 200 }}>
              {submitting ? (
                <>
                  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ animation: 'up-spin 1s linear infinite' }}><path d="M12 3a9 9 0 1 0 9 9" /></svg>
                  <span className="ax-btn__label">Submitting Installation…</span>
                </>
              ) : (
                <>
                  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5l10 -10" /></svg>
                  <span className="ax-btn__label">Submit Installation Data</span>
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

/* ═══════════════════════════════════════════════════════════════════════════
 * Reusable Floating Components (same pattern as Kashmir SRT / Bihar SRT)
 * ═══════════════════════════════════════════════════════════════════════════ */

type Option = { value: string; label: string };

function SectionHeader({ num, title, desc }: { num: string; title: string; desc?: ReactNode }) {
  return (
    <div className="up-section-header">
      <div className="up-section-title-wrap">
        <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', alignItems: 'center' }}>
          <span className="ax-badge ax-badge--soft ax-badge--primary ax-badge--pill" style={{ fontWeight: 600 }}>
            Section {num} of {TOTAL_SECTIONS}
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

/* ── Floating Input ── */
interface FloatingInputProps {
  id: string;
  label: string;
  type?: string;
  step?: string;
  required?: boolean;
  readOnly?: boolean;
  maxLength?: number;
  placeholder?: string;
  value: string;
  onChange?: (val: string) => void;
  error?: string;
}

function FloatingInput({ id, label, type = 'text', step, required, readOnly, maxLength, placeholder = ' ', value, onChange, error }: FloatingInputProps) {
  return (
    <div>
      <div className="ax-float">
        <input
          id={id}
          type={type}
          step={step}
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

/* ── Floating Select ── */
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

/* ── Floating Textarea ── */
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

/* ── Floating File Input (drag & drop + preview) ── */
interface FloatingFileInputProps {
  id: string;
  label: string;
  required?: boolean;
  accept?: string;
  file: File | null;
  existingUrl?: string | null;
  onChange: (file: File | null) => void;
  error?: string;
  hint?: string;
}

const IMG_RE = /\.(png|jpe?g|webp|gif|svg)$/i;

function FloatingFileInput({ id, label, required, accept, file, existingUrl, onChange, error, hint }: FloatingFileInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const objectUrl = useMemo(
    () => (file && file.type.startsWith('image/') ? URL.createObjectURL(file) : null),
    [file]
  );
  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

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
  const existingIsImage = Boolean(existingClean && IMG_RE.test(existingClean));

  const thumbStyle = {
    width: 44,
    height: 44,
    objectFit: 'cover' as const,
    borderRadius: 0,
    border: '1px solid var(--ax-border)',
    flexShrink: 0,
  };

  const iconCircle = (bg: string, fg: string, children: ReactNode) => (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        background: bg,
        color: fg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {children}
    </div>
  );

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
        capture="environment"
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
              {objectUrl ? (
                <img src={objectUrl} alt={label} style={thumbStyle} />
              ) : (
                iconCircle('#ecfdf5', '#10b981',
                  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                )
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', marginTop: 2 }}>
                  {(file.size / 1024).toFixed(0)} KB · Ready to upload
                </div>
              </div>
            </div>
            <button
              type="button"
              className="ax-btn ax-btn--ghost ax-btn--sm"
              onClick={handleClear}
              style={{ color: '#ef4444', flexShrink: 0 }}
              title="Remove file"
            >
              Remove
            </button>
          </div>
        ) : existingName ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, textAlign: 'left' }}>
              {existingIsImage && existingUrl ? (
                <img src={existingUrl} alt={label} style={thumbStyle} />
              ) : (
                iconCircle('#eff6ff', '#3b82f6',
                  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                )
              )}
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
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: '#eff6ff',
                color: '#3b82f6',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 6,
              }}
            >
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
              {hint || 'JPG, PNG or WEBP'}
            </div>
          </>
        )}
      </div>

      <FieldFeedback error={error} />
    </div>
  );
}

export default UP_Installation_KusumC_InstallSite;