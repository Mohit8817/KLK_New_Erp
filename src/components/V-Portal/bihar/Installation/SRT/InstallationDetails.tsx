import { useState, useEffect, useCallback, useRef, useMemo, type FormEvent, type ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  biharSrtInstallationService,
  type SrtSiteDropdownItem,
  type SrtSiteDetailItem,
} from '../../bihar-services/biharSrtInstallationService';

// Unified Single-Card Layout with Floating Labels & Section Dividers
const SINGLE_CARD_FORM_CSS = `
.srt-inst-form .ax-card {
  border: 1px solid var(--ax-border);
  border-radius: var(--ax-radius-xl);
  background: var(--ax-surface-solid);
  box-shadow: var(--ax-shadow-sm);
  overflow: hidden;
}
.srt-inst-form .ax-card__header {
  padding: var(--ax-space-5) var(--ax-space-6);
  border-bottom: 1px solid var(--ax-border-subtle);
  background: var(--ax-surface-subtle);
  display: flex;
  flex-direction: column;
  gap: var(--ax-space-4);
}
.srt-inst-form .ax-card__body { padding: var(--ax-space-6); }

/* Quick Section Nav Pills */
.srt-section-pills {
  display: flex;
  gap: var(--ax-space-2);
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: thin;
}
.srt-section-pill-btn {
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
}
.srt-section-pill-btn:hover {
  border-color: var(--ax-accent);
  color: var(--ax-accent);
  background: color-mix(in srgb, var(--ax-accent) 6%, var(--ax-surface-solid));
}
.srt-section-pill-btn .pill-num {
  width: 18px; height: 18px; border-radius: 50%;
  background: var(--ax-surface-subtle);
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 700;
}

/* Section Block */
.srt-section-block { padding-top: var(--ax-space-2); }
.srt-section-header {
  display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap;
  gap: var(--ax-space-2);
  margin-bottom: var(--ax-space-5);
  padding-bottom: var(--ax-space-3);
  border-bottom: 1px solid var(--ax-border-subtle);
}
.srt-section-title-wrap { display: flex; flex-direction: column; gap: 4px; }
.srt-section-divider {
  border: 0;
  border-top: 1px dashed var(--ax-border);
  margin: var(--ax-space-8) 0 var(--ax-space-6);
}

/* Floating Label Core */
.ax-float { position: relative; width: 100%; }
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
.ax-float__input::placeholder { color: transparent; }
.ax-float__input:focus {
  border-color: var(--ax-accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--ax-accent) 20%, transparent);
}
.ax-float__input:disabled { opacity: .6; cursor: not-allowed; }

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
.ax-float__label.floating {
  top: 0;
  font-size: 11px;
  font-weight: 500;
  color: var(--ax-accent);
}
.ax-float__label.has-val:not(.floating) {
  top: 0;
  font-size: 11px;
  font-weight: 500;
  color: var(--ax-text-muted);
}

/* Image Upload Cards */
.srt-upload-card {
  border: 1px dashed var(--ax-border);
  border-radius: var(--ax-radius-lg);
  padding: var(--ax-space-4);
  background: var(--ax-surface-subtle);
  transition: border-color var(--ax-motion-fast);
}
.srt-upload-card:hover { border-color: var(--ax-accent); }
.srt-upload-card__preview {
  position: relative;
  width: 100%;
  height: 140px;
  border-radius: var(--ax-radius-md);
  overflow: hidden;
  margin-top: var(--ax-space-2);
}
.srt-upload-card__preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.srt-upload-card__remove {
  position: absolute;
  top: 6px;
  right: 6px;
  background: rgba(0, 0, 0, 0.65);
  color: #fff;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 12px;
}
`;

interface FloatingInputProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  required?: boolean;
  disabled?: boolean;
  type?: string;
  placeholder?: string;
}

function FloatingInput({ label, name, value, onChange, required, disabled, type = 'text', placeholder }: FloatingInputProps) {
  const [focused, setFocused] = useState(false);
  const hasVal = Boolean(value && String(value).length > 0);

  return (
    <div className="ax-float">
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        required={required}
        disabled={disabled}
        placeholder={placeholder || label}
        className="ax-float__input"
      />
      <label htmlFor={name} className={`ax-float__label ${focused ? 'floating' : hasVal ? 'has-val' : ''}`}>
        {label} {required && <span style={{ color: 'var(--ax-danger, #ef4444)' }}>*</span>}
      </label>
    </div>
  );
}

export function Bihar_Installation_SRT_InstallationDetails() {
  const navigate = useNavigate();

  // Site Dropdown & Detail State
  const [sitesList, setSitesList] = useState<SrtSiteDropdownItem[]>([]);
  const [loadingSites, setLoadingSites] = useState(true);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [siteDetail, setSiteDetail] = useState<SrtSiteDetailItem | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
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
  });

  // Photo Files & Previews
  const [files, setFiles] = useState<{
    panel_image: File | null;
    system_image: File | null;
    inverter_image: File | null;
    nm_sm_image: File | null;
    loger_image: File | null;
  }>({
    panel_image: null,
    system_image: null,
    inverter_image: null,
    nm_sm_image: null,
    loger_image: null,
  });

  const [previews, setPreviews] = useState<{
    panel_image: string;
    system_image: string;
    inverter_image: string;
    nm_sm_image: string;
    loger_image: string;
  }>({
    panel_image: '',
    system_image: '',
    inverter_image: '',
    nm_sm_image: '',
    loger_image: '',
  });

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  // Section refs for smooth scrolling
  const sec1 = useRef<HTMLDivElement>(null);
  const sec2 = useRef<HTMLDivElement>(null);
  const sec3 = useRef<HTMLDivElement>(null);
  const sec4 = useRef<HTMLDivElement>(null);
  const sec5 = useRef<HTMLDivElement>(null);
  const sec6 = useRef<HTMLDivElement>(null);

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // 1. Load pending site names
  useEffect(() => {
    const fetchSites = async () => {
      try {
        setLoadingSites(true);
        const data = await biharSrtInstallationService.fetchSiteNames();
        setSitesList(Array.isArray(data) ? data : []);
      } catch (err: any) {
        console.error('[SRT Installation] fetchSiteNames error:', err);
      } finally {
        setLoadingSites(false);
      }
    };
    fetchSites();
  }, []);

  // 2. Load site details on site selection
  const handleSiteSelect = async (siteId: string) => {
    setSelectedSiteId(siteId);
    setSiteDetail(null);
    if (!siteId) return;

    try {
      setLoadingDetail(true);
      const detail = await biharSrtInstallationService.fetchSiteDetail(siteId);
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
    } catch (err: any) {
      console.error('[SRT Installation] fetchSiteDetail error:', err);
      setFeedback({ type: 'danger', text: 'Failed to load site details.' });
    } finally {
      setLoadingDetail(false);
    }
  };

  // Text inputs handler
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // File handler
  const handleFileChange = (field: keyof typeof files) => (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFiles((prev) => ({ ...prev, [field]: f }));
    const url = URL.createObjectURL(f);
    setPreviews((prev) => ({ ...prev, [field]: url }));
  };

  const removeFile = (field: keyof typeof files) => {
    setFiles((prev) => ({ ...prev, [field]: null }));
    if (previews[field]) {
      URL.revokeObjectURL(previews[field]);
      setPreviews((prev) => ({ ...prev, [field]: '' }));
    }
  };

  // Geolocation
  const detectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          inst_latitude: String(pos.coords.latitude.toFixed(6)),
          inst_longitude: String(pos.coords.longitude.toFixed(6)),
        }));
        setGettingLocation(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        alert('Could not retrieve GPS coordinates. Please enter manually.');
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Form Submit
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedSiteId) {
      setFeedback({ type: 'danger', text: 'Please select a site first.' });
      scrollTo(sec1);
      return;
    }

    if (!files.panel_image || !files.system_image || !files.inverter_image || !files.nm_sm_image || !files.loger_image) {
      setFeedback({ type: 'danger', text: 'All 5 installation photos are required. Please upload them.' });
      scrollTo(sec6);
      return;
    }

    try {
      setSubmitting(true);
      setFeedback(null);

      const fd = new FormData();
      fd.append('srt_id', selectedSiteId);
      fd.append('contact_person', formData.contact_person);
      fd.append('contact_number', formData.contact_number);
      fd.append('ca_no', formData.ca_no);
      fd.append('solarmeter_no', formData.solarmeter_no);
      fd.append('nm_sm_no', formData.nm_sm_no);
      fd.append('loger_no', formData.loger_no);
      fd.append('inverter_no', formData.inverter_no);
      fd.append('inst_latitude', formData.inst_latitude);
      fd.append('inst_longitude', formData.inst_longitude);
      if (formData.inst_remarks) {
        fd.append('inst_remarks', formData.inst_remarks);
      }

      fd.append('panel_image', files.panel_image);
      fd.append('system_image', files.system_image);
      fd.append('inverter_image', files.inverter_image);
      fd.append('nm_sm_image', files.nm_sm_image);
      fd.append('loger_image', files.loger_image);

      const res = await biharSrtInstallationService.storeInstallation(fd);
      setFeedback({ type: 'success', text: res.message || 'SRT Site Installed Successfully!' });

      setTimeout(() => {
        navigate('/v/srt/allassignsite');
      }, 1500);
    } catch (err: any) {
      console.error('[SRT Installation] submit error:', err);
      setFeedback({ type: 'danger', text: err?.message || 'Failed to submit SRT installation.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ax-page srt-inst-form">
      <style>{SINGLE_CARD_FORM_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="Bihar - Installation > SRT > Installation Details"
        subtitle="Capture rooftop solar installation execution data, serial numbers, geocoordinates, and verification photos."
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Bihar' },
          { label: 'Installation' },
          { label: 'SRT' },
          { label: 'Installation Details' },
        ]}
        actions={
          <Link to="/v/srt/allassignsite" className="ax-btn ax-btn--secondary ax-btn--sm">
            View Installed Sites
          </Link>
        }
      />

      {feedback && (
        <div className={`ax-alert ax-alert--${feedback.type}`} style={{ marginBottom: 'var(--ax-space-4)' }}>
          <div className="ax-alert__title">{feedback.type === 'success' ? 'Success' : 'Error'}</div>
          <div className="ax-alert__text">{feedback.text}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="ax-card">
        {/* ── Header with Section Pills ── */}
        <div className="ax-card__header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 className="ax-card__title" style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                Rooftop Solar Installation Form
              </h2>
              <p className="ax-card__subtitle" style={{ fontSize: '0.85rem', color: 'var(--ax-text-muted)' }}>
                Fill out installation details and upload site completion evidence for department verification.
              </p>
            </div>
            {siteDetail && (
              <span className="ax-badge ax-badge--soft ax-badge--info">
                Site ID #{siteDetail.id}
              </span>
            )}
          </div>

          {/* Quick Nav Pills */}
          <div className="srt-section-pills">
            <button type="button" className="srt-section-pill-btn" onClick={() => scrollTo(sec1)}>
              <span className="pill-num">1</span> Site Selection
            </button>
            <button type="button" className="srt-section-pill-btn" onClick={() => scrollTo(sec2)}>
              <span className="pill-num">2</span> Beneficiary Info
            </button>
            <button type="button" className="srt-section-pill-btn" onClick={() => scrollTo(sec3)}>
              <span className="pill-num">3</span> Identifiers
            </button>
            <button type="button" className="srt-section-pill-btn" onClick={() => scrollTo(sec4)}>
              <span className="pill-num">4</span> Equipment Numbers
            </button>
            <button type="button" className="srt-section-pill-btn" onClick={() => scrollTo(sec5)}>
              <span className="pill-num">5</span> Geo & Remarks
            </button>
            <button type="button" className="srt-section-pill-btn" onClick={() => scrollTo(sec6)}>
              <span className="pill-num">6</span> Site Photos
            </button>
          </div>
        </div>

        <div className="ax-card__body">
          {/* ════════ Section 1: Site Selection ════════ */}
          <div ref={sec1} className="srt-section-block">
            <div className="srt-section-header">
              <div className="srt-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>1. Select Rooftop Site</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted)' }}>
                  Choose from accepted sites pending installation
                </span>
              </div>
            </div>

            <div className="ax-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <div className="ax-float">
                <select
                  id="site_id_select"
                  className="ax-float__input"
                  value={selectedSiteId}
                  onChange={(e) => handleSiteSelect(e.target.value)}
                  disabled={loadingSites || submitting}
                  required
                >
                  <option value="">-- Choose Assigned SRT Site --</option>
                  {sitesList.map((s) => (
                    <option key={s.id} value={s.id}>
                      #{s.id} - {s.site_name}
                    </option>
                  ))}
                </select>
                <label htmlFor="site_id_select" className="ax-float__label floating">
                  Assigned Site <span style={{ color: 'var(--ax-danger)' }}>*</span>
                </label>
              </div>
            </div>

            {loadingDetail && (
              <div style={{ padding: '16px 0', color: 'var(--ax-accent)', fontSize: '13px' }}>
                Fetching site specifications & prefilled details...
              </div>
            )}
          </div>

          <hr className="srt-section-divider" />

          {/* ════════ Section 2: Beneficiary / Site Information ════════ */}
          <div ref={sec2} className="srt-section-block">
            <div className="srt-section-header">
              <div className="srt-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>2. Site & Plant Information</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted)' }}>
                  Auto-populated details from sanction order
                </span>
              </div>
            </div>

            <div className="ax-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <FloatingInput label="Discom" name="discom" value={siteDetail?.discom || ''} onChange={() => {}} disabled />
              <FloatingInput label="Department" name="dept_name" value={siteDetail?.dept_name || ''} onChange={() => {}} disabled />
              <FloatingInput label="District" name="district" value={siteDetail?.district || ''} onChange={() => {}} disabled />
              <FloatingInput label="State" name="state" value={siteDetail?.state || 'Bihar'} onChange={() => {}} disabled />
              <FloatingInput label="Firm Name" name="firm_name" value={siteDetail?.firm_name || ''} onChange={() => {}} disabled />
              <FloatingInput label="Plant Capacity" name="plant_sc" value={siteDetail?.plant_sc || ''} onChange={() => {}} disabled />
              <FloatingInput label="Connection Phase" name="phase" value={siteDetail?.phase || ''} onChange={() => {}} disabled />
              <FloatingInput label="Sanction Load (kW)" name="sanction_load" value={siteDetail?.sanction_load || ''} onChange={() => {}} disabled />
              <div style={{ gridColumn: '1 / -1' }}>
                <FloatingInput label="Site Location / Address" name="location" value={siteDetail?.location || ''} onChange={() => {}} disabled />
              </div>
            </div>
          </div>

          <hr className="srt-section-divider" />

          {/* ════════ Section 3: Contact & Identifiers ════════ */}
          <div ref={sec3} className="srt-section-block">
            <div className="srt-section-header">
              <div className="srt-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>3. Contact & CA Identifiers</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted)' }}>
                  Nodal contact person and discom CA consumer number
                </span>
              </div>
            </div>

            <div className="ax-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <FloatingInput
                label="Contact Person Name"
                name="contact_person"
                value={formData.contact_person}
                onChange={handleInputChange}
                required
              />
              <FloatingInput
                label="Contact Number"
                name="contact_number"
                value={formData.contact_number}
                onChange={handleInputChange}
                required
              />
              <FloatingInput
                label="CA Number"
                name="ca_no"
                value={formData.ca_no}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <hr className="srt-section-divider" />

          {/* ════════ Section 4: Meter & Equipment Serial Numbers ════════ */}
          <div ref={sec4} className="srt-section-block">
            <div className="srt-section-header">
              <div className="srt-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>4. Meter & Equipment Serial Numbers</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted)' }}>
                  Installed solar meters, inverters, and datalogger serials
                </span>
              </div>
            </div>

            <div className="ax-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <FloatingInput
                label="Solar Meter Number"
                name="solarmeter_no"
                value={formData.solarmeter_no}
                onChange={handleInputChange}
                required
              />
              <FloatingInput
                label="Net / Smart Meter No"
                name="nm_sm_no"
                value={formData.nm_sm_no}
                onChange={handleInputChange}
                required
              />
              <FloatingInput
                label="Inverter Serial Number"
                name="inverter_no"
                value={formData.inverter_no}
                onChange={handleInputChange}
                required
              />
              <FloatingInput
                label="Datalogger Number"
                name="loger_no"
                value={formData.loger_no}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <hr className="srt-section-divider" />

          {/* ════════ Section 5: Geo Coordinates & Remarks ════════ */}
          <div ref={sec5} className="srt-section-block">
            <div className="srt-section-header">
              <div className="srt-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>5. GPS Coordinates & Remarks</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted)' }}>
                  Exact site geotag coordinates
                </span>
              </div>
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--sm"
                onClick={detectLocation}
                disabled={gettingLocation}
              >
                {gettingLocation ? 'Detecting GPS...' : '📍 Auto-detect GPS'}
              </button>
            </div>

            <div className="ax-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <FloatingInput
                label="Latitude"
                name="inst_latitude"
                value={formData.inst_latitude}
                onChange={handleInputChange}
                required
              />
              <FloatingInput
                label="Longitude"
                name="inst_longitude"
                value={formData.inst_longitude}
                onChange={handleInputChange}
                required
              />
              <div style={{ gridColumn: '1 / -1' }}>
                <FloatingInput
                  label="Installation Remarks (optional)"
                  name="inst_remarks"
                  value={formData.inst_remarks}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          <hr className="srt-section-divider" />

          {/* ════════ Section 6: Photo Uploads ════════ */}
          <div ref={sec6} className="srt-section-block">
            <div className="srt-section-header">
              <div className="srt-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>6. Installation Photo Evidence</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted)' }}>
                  Upload clear photos of all 5 installed components (max 5MB each)
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              {/* Photo 1: Panel */}
              <div className="srt-upload-card">
                <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: 4 }}>
                  1. Panel Image <span style={{ color: 'var(--ax-danger)' }}>*</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange('panel_image')}
                  required={!previews.panel_image}
                  style={{ fontSize: '12px', width: '100%' }}
                />
                {previews.panel_image && (
                  <div className="srt-upload-card__preview">
                    <img src={previews.panel_image} alt="Panel Preview" />
                    <button type="button" className="srt-upload-card__remove" onClick={() => removeFile('panel_image')}>
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {/* Photo 2: Complete System */}
              <div className="srt-upload-card">
                <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: 4 }}>
                  2. System Photo <span style={{ color: 'var(--ax-danger)' }}>*</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange('system_image')}
                  required={!previews.system_image}
                  style={{ fontSize: '12px', width: '100%' }}
                />
                {previews.system_image && (
                  <div className="srt-upload-card__preview">
                    <img src={previews.system_image} alt="System Preview" />
                    <button type="button" className="srt-upload-card__remove" onClick={() => removeFile('system_image')}>
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {/* Photo 3: Inverter */}
              <div className="srt-upload-card">
                <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: 4 }}>
                  3. Inverter Photo <span style={{ color: 'var(--ax-danger)' }}>*</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange('inverter_image')}
                  required={!previews.inverter_image}
                  style={{ fontSize: '12px', width: '100%' }}
                />
                {previews.inverter_image && (
                  <div className="srt-upload-card__preview">
                    <img src={previews.inverter_image} alt="Inverter Preview" />
                    <button type="button" className="srt-upload-card__remove" onClick={() => removeFile('inverter_image')}>
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {/* Photo 4: Net / Smart Meter */}
              <div className="srt-upload-card">
                <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: 4 }}>
                  4. Net/Smart Meter <span style={{ color: 'var(--ax-danger)' }}>*</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange('nm_sm_image')}
                  required={!previews.nm_sm_image}
                  style={{ fontSize: '12px', width: '100%' }}
                />
                {previews.nm_sm_image && (
                  <div className="srt-upload-card__preview">
                    <img src={previews.nm_sm_image} alt="Meter Preview" />
                    <button type="button" className="srt-upload-card__remove" onClick={() => removeFile('nm_sm_image')}>
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {/* Photo 5: Datalogger */}
              <div className="srt-upload-card">
                <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: 4 }}>
                  5. Datalogger Photo <span style={{ color: 'var(--ax-danger)' }}>*</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange('loger_image')}
                  required={!previews.loger_image}
                  style={{ fontSize: '12px', width: '100%' }}
                />
                {previews.loger_image && (
                  <div className="srt-upload-card__preview">
                    <img src={previews.loger_image} alt="Logger Preview" />
                    <button type="button" className="srt-upload-card__remove" onClick={() => removeFile('loger_image')}>
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ════════ Submit Footer ════════ */}
          <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid var(--ax-border)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <Link to="/v/srt/allassignsite" className="ax-btn ax-btn--secondary">
              Cancel
            </Link>
            <button
              type="submit"
              className="ax-btn ax-btn--primary"
              disabled={submitting || !selectedSiteId}
            >
              {submitting ? 'Submitting Installation...' : 'Submit Installation Report'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default Bihar_Installation_SRT_InstallationDetails;
