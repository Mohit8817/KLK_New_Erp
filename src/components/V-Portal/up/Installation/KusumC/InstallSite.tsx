import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  upInstallationService,
  type UpKusumCReadySiteItem,
} from '../../up-services';

const DASH = '—';

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

  // 3 Photo uploads (required in endpoint 5)
  const [moduleImage, setModuleImage] = useState<File | null>(null);
  const [inverterVfdImage, setInverterVfdImage] = useState<File | null>(null);
  const [runningWaterImage, setRunningWaterImage] = useState<File | null>(null);

  // States
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [geoLocating, setGeoLocating] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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
      return;
    }

    setSubmitting(true);
    const fd = new FormData();
    fd.append('srt_id', selectedSiteId);
    fd.append('id', selectedSiteId);
    fd.append('inverter_no', inverterNo.trim());
    fd.append('vfd_no', vfdNo.trim());

    // module_serial_no[]
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

  return (
    <div className="solar-erp-page ax-page">
      <PageHead
        title="UP Kusum-C Install Site"
        subtitle="Record equipment serials, GPS coordinates, and photographic evidence for Kusum-C solar pump installation"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Uttar Pradesh' },
          { label: 'Installation' },
          { label: 'Kusum C' },
          { label: 'Install Site' },
        ]}
        actions={
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}>
            <Link to="/v/up/view-kusum-c-install-site" className="ax-btn ax-btn--secondary ax-btn--sm">
              <span className="ax-btn__label">View Installations</span>
            </Link>
          </div>
        }
      />

      {toast && (
        <div className={`ax-alert ax-alert--${toast.type === 'success' ? 'success' : 'danger'}`} style={{ marginBottom: 16 }}>
          <div className="ax-alert__content">{toast.message}</div>
          <button type="button" className="ax-btn ax-btn--ghost ax-btn--xs" onClick={() => setToast(null)}>✕</button>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* Section 1: Site Selection */}
        <div className="ax-card" style={{ marginBottom: 20 }}>
          <div className="ax-card__header">
            <h3 className="ax-card__title">1. Site Selection & Details</h3>
          </div>
          <div className="ax-card__body">
            <div className="ax-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              <div>
                <label className="ax-label" style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>
                  Select Kusum-C Site <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  className={`ax-input ${fieldErrors.srt_id ? 'is-invalid' : ''}`}
                  value={selectedSiteId}
                  onChange={(e) => handleSelectSite(e.target.value)}
                  disabled={loading}
                >
                  <option value="">-- Choose Accepted Site --</option>
                  {readySites.map((s) => (
                    <option key={s.id} value={s.id}>
                      #{s.id} — {s.f_farmer_name} {s.lot_no ? `(${s.lot_no})` : ''} {s.pump_capacity ? `[${s.pump_capacity}]` : ''}
                    </option>
                  ))}
                </select>
                {fieldErrors.srt_id && <span style={{ color: '#ef4444', fontSize: 12 }}>{fieldErrors.srt_id}</span>}
              </div>

              <div>
                <label className="ax-label" style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Farmer Name</label>
                <input type="text" readOnly className="ax-input" value={siteDetails?.f_farmer_name || DASH} style={{ background: 'var(--ax-surface-subtle, #f8fafc)' }} />
              </div>

              <div>
                <label className="ax-label" style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>District / Block</label>
                <input type="text" readOnly className="ax-input" value={[siteDetails?.f_district, siteDetails?.f_block].filter(Boolean).join(' / ') || DASH} style={{ background: 'var(--ax-surface-subtle, #f8fafc)' }} />
              </div>

              <div>
                <label className="ax-label" style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Village / Post</label>
                <input type="text" readOnly className="ax-input" value={[siteDetails?.f_village, siteDetails?.f_post].filter(Boolean).join(', ') || DASH} style={{ background: 'var(--ax-surface-subtle, #f8fafc)' }} />
              </div>

              <div>
                <label className="ax-label" style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Lot No / Capacity</label>
                <input type="text" readOnly className="ax-input" value={[siteDetails?.lot_no, siteDetails?.pump_capacity || siteDetails?.volume].filter(Boolean).join(' • ') || DASH} style={{ background: 'var(--ax-surface-subtle, #f8fafc)' }} />
              </div>

              <div>
                <label className="ax-label" style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Contact Number</label>
                <input type="text" readOnly className="ax-input" value={siteDetails?.f_contact || DASH} style={{ background: 'var(--ax-surface-subtle, #f8fafc)' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Equipment Serial Numbers */}
        <div className="ax-card" style={{ marginBottom: 20 }}>
          <div className="ax-card__header">
            <h3 className="ax-card__title">2. Inverter & VFD Equipment Numbers</h3>
          </div>
          <div className="ax-card__body">
            <div className="ax-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              <div>
                <label className="ax-label" style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>
                  Inverter Number <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  className={`ax-input ${fieldErrors.inverter_no ? 'is-invalid' : ''}`}
                  placeholder="e.g. INV-0001"
                  value={inverterNo}
                  onChange={(e) => setInverterNo(e.target.value)}
                />
                {fieldErrors.inverter_no && <span style={{ color: '#ef4444', fontSize: 12 }}>{fieldErrors.inverter_no}</span>}
              </div>

              <div>
                <label className="ax-label" style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>
                  VFD Number <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  className={`ax-input ${fieldErrors.vfd_no ? 'is-invalid' : ''}`}
                  placeholder="e.g. VFD-0001"
                  value={vfdNo}
                  onChange={(e) => setVfdNo(e.target.value)}
                />
                {fieldErrors.vfd_no && <span style={{ color: '#ef4444', fontSize: 12 }}>{fieldErrors.vfd_no}</span>}
              </div>
            </div>

            {/* Dynamic Module Serial Numbers */}
            <div style={{ marginTop: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label className="ax-label" style={{ fontWeight: 600 }}>
                  Solar Module Serial Numbers (module_serial_no[]) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <button
                  type="button"
                  className="ax-btn ax-btn--secondary ax-btn--xs"
                  onClick={handleAddModuleSerial}
                >
                  + Add Module Serial
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
                {moduleSerials.map((sn, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <input
                      type="text"
                      className="ax-input"
                      placeholder={`Module Serial #${idx + 1}`}
                      value={sn}
                      onChange={(e) => handleModuleSerialChange(idx, e.target.value)}
                    />
                    {moduleSerials.length > 1 && (
                      <button
                        type="button"
                        className="ax-btn ax-btn--ghost ax-btn--xs"
                        style={{ color: '#ef4444' }}
                        onClick={() => handleRemoveModuleSerial(idx)}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {fieldErrors.module_serial && <span style={{ color: '#ef4444', fontSize: 12 }}>{fieldErrors.module_serial}</span>}
            </div>
          </div>
        </div>

        {/* Section 3: GPS Coordinates & Remarks */}
        <div className="ax-card" style={{ marginBottom: 20 }}>
          <div className="ax-card__header">
            <h3 className="ax-card__title">3. Geotag & Remarks</h3>
          </div>
          <div className="ax-card__body">
            <div className="ax-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
              <div>
                <label className="ax-label" style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>
                  Latitude <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  className={`ax-input ${fieldErrors.inst_latitude ? 'is-invalid' : ''}`}
                  placeholder="e.g. 26.8467"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                />
                {fieldErrors.inst_latitude && <span style={{ color: '#ef4444', fontSize: 12 }}>{fieldErrors.inst_latitude}</span>}
              </div>

              <div>
                <label className="ax-label" style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>
                  Longitude <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  className={`ax-input ${fieldErrors.inst_longitude ? 'is-invalid' : ''}`}
                  placeholder="e.g. 80.9462"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                />
                {fieldErrors.inst_longitude && <span style={{ color: '#ef4444', fontSize: 12 }}>{fieldErrors.inst_longitude}</span>}
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button
                  type="button"
                  className="ax-btn ax-btn--secondary"
                  style={{ width: '100%', height: 42 }}
                  onClick={fetchGPS}
                  disabled={geoLocating}
                >
                  📍 {geoLocating ? 'Detecting GPS…' : 'Fetch GPS Coordinates'}
                </button>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label className="ax-label" style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Installation Remarks</label>
                <textarea
                  className="ax-textarea"
                  rows={2}
                  placeholder="Optional site installation notes…"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Required Installation Photos */}
        <div className="ax-card" style={{ marginBottom: 24 }}>
          <div className="ax-card__header">
            <h3 className="ax-card__title">4. Compliance Photographs (Required)</h3>
          </div>
          <div className="ax-card__body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {/* Photo 1: Farmer with Module */}
              <div style={{ border: '1px solid var(--ax-border, #e2e8f0)', borderRadius: 8, padding: 16 }}>
                <label style={{ fontWeight: 700, fontSize: 13, display: 'block', marginBottom: 4 }}>
                  1. Farmer with Module Photo <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <span style={{ fontSize: 11, color: 'var(--ax-text-muted)', display: 'block', marginBottom: 10 }}>
                  Clear photo showing farmer beside installed solar panels.
                </span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  required
                  onChange={(e) => setModuleImage(e.target.files?.[0] || null)}
                />
                {fieldErrors.module_image && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{fieldErrors.module_image}</div>}
              </div>

              {/* Photo 2: Farmer with VFD & Inverter */}
              <div style={{ border: '1px solid var(--ax-border, #e2e8f0)', borderRadius: 8, padding: 16 }}>
                <label style={{ fontWeight: 700, fontSize: 13, display: 'block', marginBottom: 4 }}>
                  2. Farmer with VFD & Inverter Photo <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <span style={{ fontSize: 11, color: 'var(--ax-text-muted)', display: 'block', marginBottom: 10 }}>
                  Clear photo showing farmer with installed inverter & VFD unit.
                </span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  required
                  onChange={(e) => setInverterVfdImage(e.target.files?.[0] || null)}
                />
                {fieldErrors.inverter_vfd_image && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{fieldErrors.inverter_vfd_image}</div>}
              </div>

              {/* Photo 3: Farmer with Running Water */}
              <div style={{ border: '1px solid var(--ax-border, #e2e8f0)', borderRadius: 8, padding: 16 }}>
                <label style={{ fontWeight: 700, fontSize: 13, display: 'block', marginBottom: 4 }}>
                  3. Farmer with Running Water Photo <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <span style={{ fontSize: 11, color: 'var(--ax-text-muted)', display: 'block', marginBottom: 10 }}>
                  Verification photo of solar pump discharging water.
                </span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  required
                  onChange={(e) => setRunningWaterImage(e.target.files?.[0] || null)}
                />
                {fieldErrors.running_water_image && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{fieldErrors.running_water_image}</div>}
              </div>
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingBottom: 40 }}>
          <Link to="/v/up/view-kusum-c-install-site" className="ax-btn ax-btn--secondary">
            Cancel
          </Link>
          <button type="submit" disabled={submitting} className="ax-btn ax-btn--primary" style={{ minWidth: 200 }}>
            {submitting ? 'Submitting Installation…' : 'Submit Installation Data'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default UP_Installation_KusumC_InstallSite;
