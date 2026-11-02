import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { getCurrentUser } from '../../../../../services/authService';
import {
  upInstallationService,
  type UpRescoAssignSiteItem,
} from '../../up-services';

const DASH = '—';

export function UP_Installation_Resco_InstallSite() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preSelectedId = searchParams.get('site_id') || '';

  // Available sites
  const [sites, setSites] = useState<UpRescoAssignSiteItem[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState(preSelectedId);
  const [siteInfo, setSiteInfo] = useState<UpRescoAssignSiteItem | null>(null);

  // Form Fields
  const [vendorName, setVendorName] = useState('mohit');
  const [contactPerson, setContactPerson] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [inverterNo, setInverterNo] = useState('');
  const [solarMeterNo, setSolarMeterNo] = useState('');
  const [netMeterNo, setNetMeterNo] = useState('');
  const [rmsLogerNo, setRmsLogerNo] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [remarks, setRemarks] = useState('');

  // Image Files
  const [panelImage, setPanelImage] = useState<File | null>(null);
  const [systemImage, setSystemImage] = useState<File | null>(null);
  const [inverterImage, setInverterImage] = useState<File | null>(null);
  const [netMeterImage, setNetMeterImage] = useState<File | null>(null);
  const [logerImage, setLogerImage] = useState<File | null>(null);

  // States
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const user = getCurrentUser();
    if (user?.name) setVendorName(user.name);

    setLoading(true);
    upInstallationService
      .getRescoAssignSites()
      .then((res) => {
        const list = res.data || [];
        setSites(list);
        if (preSelectedId) {
          const matched = list.find((s) => String(s.id) === preSelectedId);
          if (matched) setSiteInfo(matched);
        }
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [preSelectedId]);

  const handleSelectSite = (id: string) => {
    setSelectedSiteId(id);
    const matched = sites.find((s) => String(s.id) === id);
    setSiteInfo(matched || null);
    setFieldErrors({});
  };

  const fetchGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
        setToast({ type: 'success', message: 'GPS coordinates retrieved successfully!' });
      },
      (err) => alert(`GPS Error: ${err.message}`),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!selectedSiteId) errs.site_id = 'Please select Site ID';
    if (!contactPerson.trim()) errs.contact_person = 'Contact Person is required';
    if (!contactNo.trim()) errs.contact_no = 'Contact Number is required';
    if (!inverterNo.trim()) errs.inverter_no = 'Inverter Number is required';
    if (!solarMeterNo.trim()) errs.solar_meter_no = 'Solar Meter Number is required';
    if (!netMeterNo.trim()) errs.net_meter_no = 'Net Meter Number is required';
    if (!rmsLogerNo.trim()) errs.rms_loger_no = 'RMS Loger Number is required';
    if (!latitude.trim()) errs.latitude = 'Latitude is required';
    if (!longitude.trim()) errs.longitude = 'Longitude is required';
    if (!panelImage) errs.panel_image = 'Panel Image is required';
    if (!systemImage) errs.system_image = 'System Image is required';
    if (!inverterImage) errs.inverter_image = 'Inverter Image is required';
    if (!netMeterImage) errs.net_meter_image = 'Net Meter Image is required';
    if (!logerImage) errs.loger_image = 'Loger Image is required';

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setToast(null);

    if (!validate()) {
      setToast({ type: 'error', message: 'Please fill in all mandatory fields.' });
      return;
    }

    setSubmitting(true);
    const fd = new FormData();
    fd.append('site_id', selectedSiteId);
    fd.append('vendor', vendorName);
    fd.append('contact_person', contactPerson);
    fd.append('contact_no', contactNo);
    fd.append('contact_number', contactNo);
    fd.append('inverter_no', inverterNo);
    fd.append('solar_meter_no', solarMeterNo);
    fd.append('net_meter_no', netMeterNo);
    fd.append('net_smart_meter_no', netMeterNo);
    fd.append('rms_loger_no', rmsLogerNo);
    fd.append('loger_no', rmsLogerNo);
    fd.append('latitude', latitude);
    fd.append('longitude', longitude);
    if (remarks) fd.append('remarks', remarks);

    if (panelImage) fd.append('panel_image', panelImage);
    if (systemImage) fd.append('system_image', systemImage);
    if (inverterImage) fd.append('inverter_image', inverterImage);
    if (netMeterImage) fd.append('net_meter_image', netMeterImage);
    if (logerImage) fd.append('loger_image', logerImage);

    try {
      const res = await upInstallationService.storeRescoInstallation(fd);
      if (res.status) {
        setToast({ type: 'success', message: res.message || 'Resco installation recorded successfully!' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => {
          navigate('/v/up/resco-view-install-site');
        }, 1500);
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
        title="Welcome to, UP Resco Install Site"
        subtitle="Submit completed rooftop installation milestones, meter numbers and equipment photos"
        breadcrumbs={[
          { label: 'Home', href: '/v' },
          { label: 'UP Resco Install Site' },
        ]}
        actions={
          <div className="ax-cluster" style={{ gap: 8 }}>
            <Link to="/v/up/resco-view-install-site" className="ax-btn ax-btn--secondary ax-btn--sm">
              View Installation Details
            </Link>
          </div>
        }
      />

      {toast && (
        <div className={`ax-alert ${toast.type === 'success' ? 'ax-alert--success' : 'ax-alert--danger'}`} style={{ marginBottom: 16 }}>
          <span>{toast.message}</span>
          <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" onClick={() => setToast(null)} style={{ marginLeft: 'auto' }}>
            ✕
          </button>
        </div>
      )}

      {/* Site Information Selector Card */}
      <div className="ax-card" style={{ marginBottom: 20 }}>
        <div className="ax-card__header" style={{ padding: '14px 18px' }}>
          <h3 className="ax-card__title" style={{ margin: 0, fontSize: 16 }}>
            Site Information
          </h3>
        </div>
        <div className="ax-card__body" style={{ padding: 18 }}>
          <div style={{ maxWidth: 420 }}>
            <label htmlFor="resco-site-select" style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
              Select Id <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              id="resco-site-select"
              className={`ax-select ${fieldErrors.site_id ? 'is-invalid' : ''}`}
              style={{ width: '100%', height: 40 }}
              value={selectedSiteId}
              disabled={loading}
              onChange={(e) => handleSelectSite(e.target.value)}
            >
              <option value="">-- Select Id --</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.site_name || `Site #${s.id}`} {s.district ? `(${s.district})` : ''}
                </option>
              ))}
            </select>
            {fieldErrors.site_id && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{fieldErrors.site_id}</div>}
          </div>
        </div>
      </div>

      {/* Information Details Card */}
      <div className="ax-card" style={{ marginBottom: 20 }}>
        <div className="ax-card__header" style={{ padding: '14px 18px', background: 'var(--ax-surface-subtle, #f8fafc)' }}>
          <h3 className="ax-card__title" style={{ margin: 0, fontSize: 16 }}>
            Information
          </h3>
        </div>
        <div className="ax-card__body" style={{ padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, fontSize: 13 }}>
            <div>
              <div style={{ color: 'var(--ax-text-muted)', fontSize: 12, marginBottom: 2 }}>State</div>
              <div style={{ fontWeight: 600 }}>{siteInfo?.state ? siteInfo.state.toUpperCase() : 'UP'}</div>
            </div>
            <div>
              <div style={{ color: 'var(--ax-text-muted)', fontSize: 12, marginBottom: 2 }}>District</div>
              <div style={{ fontWeight: 600 }}>{siteInfo?.district || DASH}</div>
            </div>
            <div>
              <div style={{ color: 'var(--ax-text-muted)', fontSize: 12, marginBottom: 2 }}>Site Name</div>
              <div style={{ fontWeight: 600 }}>{siteInfo?.site_name || DASH}</div>
            </div>
            <div>
              <div style={{ color: 'var(--ax-text-muted)', fontSize: 12, marginBottom: 2 }}>Location</div>
              <div style={{ fontWeight: 600 }}>{siteInfo?.location || DASH}</div>
            </div>
            <div>
              <div style={{ color: 'var(--ax-text-muted)', fontSize: 12, marginBottom: 2 }}>Firm Name</div>
              <div style={{ fontWeight: 600 }}>{siteInfo?.firm_name || DASH}</div>
            </div>
            <div>
              <div style={{ color: 'var(--ax-text-muted)', fontSize: 12, marginBottom: 2 }}>CA No.</div>
              <div style={{ fontWeight: 600 }}>{siteInfo?.ca_no || DASH}</div>
            </div>
            <div>
              <div style={{ color: 'var(--ax-text-muted)', fontSize: 12, marginBottom: 2 }}>Sanction Load</div>
              <div style={{ fontWeight: 600 }}>{siteInfo?.sanction_load || DASH}</div>
            </div>
            <div>
              <div style={{ color: 'var(--ax-text-muted)', fontSize: 12, marginBottom: 2 }}>Plant SC</div>
              <div style={{ fontWeight: 600 }}>{siteInfo?.plant_sc || DASH}</div>
            </div>
            <div>
              <div style={{ color: 'var(--ax-text-muted)', fontSize: 12, marginBottom: 2 }}>WO No.</div>
              <div style={{ fontWeight: 600 }}>{siteInfo?.wo_no || DASH}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Fill this Form Card */}
      <form onSubmit={handleSubmit} noValidate>
        <div className="ax-card">
          <div className="ax-card__header" style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="ax-card__title" style={{ margin: 0, fontSize: 16 }}>
              Fill this Form
            </h3>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={fetchGPS}>
              📍 Get GPS Coordinates
            </button>
          </div>

          <div className="ax-card__body" style={{ padding: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
              {/* Vendor */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  Vendor <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input type="text" readOnly className="ax-input" value={vendorName} />
              </div>

              {/* Contact Person */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  Contact Person <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className={`ax-input ${fieldErrors.contact_person ? 'is-invalid' : ''}`}
                  placeholder="Enter Contact Person Name"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                />
                {fieldErrors.contact_person && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{fieldErrors.contact_person}</div>}
              </div>

              {/* Contact No */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  Contact No. <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="tel"
                  className={`ax-input ${fieldErrors.contact_no ? 'is-invalid' : ''}`}
                  placeholder="Enter Contact Number"
                  value={contactNo}
                  onChange={(e) => setContactNo(e.target.value)}
                />
                {fieldErrors.contact_no && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{fieldErrors.contact_no}</div>}
              </div>

              {/* Inverter No */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  Inverter No <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className={`ax-input ${fieldErrors.inverter_no ? 'is-invalid' : ''}`}
                  placeholder="Enter Inverter Number"
                  value={inverterNo}
                  onChange={(e) => setInverterNo(e.target.value)}
                />
                {fieldErrors.inverter_no && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{fieldErrors.inverter_no}</div>}
              </div>

              {/* Solar Meter Number */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  Solar Meter Number <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className={`ax-input ${fieldErrors.solar_meter_no ? 'is-invalid' : ''}`}
                  placeholder="Enter Solar Meter Number"
                  value={solarMeterNo}
                  onChange={(e) => setSolarMeterNo(e.target.value)}
                />
                {fieldErrors.solar_meter_no && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{fieldErrors.solar_meter_no}</div>}
              </div>

              {/* Net Meter Number */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  Net Meter/Smart Meter Number <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className={`ax-input ${fieldErrors.net_meter_no ? 'is-invalid' : ''}`}
                  placeholder="Enter Net/Smart Meter Number"
                  value={netMeterNo}
                  onChange={(e) => setNetMeterNo(e.target.value)}
                />
                {fieldErrors.net_meter_no && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{fieldErrors.net_meter_no}</div>}
              </div>

              {/* RMS Loger Number */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  RMS Loger Number <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className={`ax-input ${fieldErrors.rms_loger_no ? 'is-invalid' : ''}`}
                  placeholder="Enter RMS Loger Number"
                  value={rmsLogerNo}
                  onChange={(e) => setRmsLogerNo(e.target.value)}
                />
                {fieldErrors.rms_loger_no && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{fieldErrors.rms_loger_no}</div>}
              </div>

              {/* Latitude */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  Latitude <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className={`ax-input ${fieldErrors.latitude ? 'is-invalid' : ''}`}
                  placeholder="Enter Latitude"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                />
                {fieldErrors.latitude && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{fieldErrors.latitude}</div>}
              </div>

              {/* Longitude */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  Longitude <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className={`ax-input ${fieldErrors.longitude ? 'is-invalid' : ''}`}
                  placeholder="Enter Longitude"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                />
                {fieldErrors.longitude && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{fieldErrors.longitude}</div>}
              </div>

              {/* Panel Image */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  Panel Image <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className={`ax-input ${fieldErrors.panel_image ? 'is-invalid' : ''}`}
                  onChange={(e) => setPanelImage(e.target.files?.[0] || null)}
                />
                {fieldErrors.panel_image && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{fieldErrors.panel_image}</div>}
              </div>

              {/* System Image */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  System Image <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className={`ax-input ${fieldErrors.system_image ? 'is-invalid' : ''}`}
                  onChange={(e) => setSystemImage(e.target.files?.[0] || null)}
                />
                {fieldErrors.system_image && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{fieldErrors.system_image}</div>}
              </div>

              {/* Inverter Image */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  Inverter Image <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className={`ax-input ${fieldErrors.inverter_image ? 'is-invalid' : ''}`}
                  onChange={(e) => setInverterImage(e.target.files?.[0] || null)}
                />
                {fieldErrors.inverter_image && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{fieldErrors.inverter_image}</div>}
              </div>

              {/* Net Meter/Smart Meter Image */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  Net Meter/Smart Meter Image <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className={`ax-input ${fieldErrors.net_meter_image ? 'is-invalid' : ''}`}
                  onChange={(e) => setNetMeterImage(e.target.files?.[0] || null)}
                />
                {fieldErrors.net_meter_image && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{fieldErrors.net_meter_image}</div>}
              </div>

              {/* Loger Image */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  Loger Image <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className={`ax-input ${fieldErrors.loger_image ? 'is-invalid' : ''}`}
                  onChange={(e) => setLogerImage(e.target.files?.[0] || null)}
                />
                {fieldErrors.loger_image && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{fieldErrors.loger_image}</div>}
              </div>

              {/* Remarks */}
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  Remarks
                </label>
                <textarea
                  rows={3}
                  className="ax-textarea"
                  placeholder="Enter Remarks..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div
            className="ax-card__footer"
            style={{
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid var(--ax-border, #e2e8f0)',
              background: 'var(--ax-surface-subtle, #f8fafc)',
            }}
          >
            <button
              type="button"
              className="ax-btn ax-btn--ghost"
              onClick={() => {
                setContactPerson('');
                setContactNo('');
                setInverterNo('');
                setSolarMeterNo('');
                setNetMeterNo('');
                setRmsLogerNo('');
                setLatitude('');
                setLongitude('');
                setRemarks('');
              }}
              disabled={submitting}
            >
              Reset
            </button>
            <button
              type="submit"
              className="ax-btn ax-btn--primary"
              disabled={submitting || !selectedSiteId}
              style={{ minWidth: 160 }}
            >
              {submitting ? 'Submitting...' : 'Submit Installation'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default UP_Installation_Resco_InstallSite;
