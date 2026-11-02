import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { getCurrentUser } from '../../../../../services/authService';
import {
  upInstallationService,
  type UpSsl18wLightDropdownItem,
  type UpSsl18wLightDetail,
} from '../../up-services';

const DASH = '—';

export function UP_Installation_SSL_InstallLight() {
  const navigate = useNavigate();

  // Dropdown list & selected light
  const [lights, setLights] = useState<UpSsl18wLightDropdownItem[]>([]);
  const [selectedLightId, setSelectedLightId] = useState<string>('');
  const [lightDetail, setLightDetail] = useState<UpSsl18wLightDetail | null>(null);
  const [vendorName, setVendorName] = useState('mohit');

  // Form Fields
  const [wardNo, setWardNo] = useState('');
  const [poleNo, setPoleNo] = useState('');
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [beneficiaryContact, setBeneficiaryContact] = useState('');
  const [uuidNo, setUuidNo] = useState('');
  const [batterySerialNo, setBatterySerialNo] = useState('');
  const [panelNo, setPanelNo] = useState('');
  const [lightNo, setLightNo] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [lightImage, setLightImage] = useState<File | null>(null);
  const [remarks, setRemarks] = useState('');

  // States
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // 1. Load available lights on mount
  useEffect(() => {
    let mounted = true;
    setLoadingInitial(true);

    const user = getCurrentUser();
    if (user?.name) {
      setVendorName(user.name);
    }

    Promise.all([
      upInstallationService.getSsl18wAvailableLights(),
      upInstallationService.getSsl18wInstallSiteData(),
    ])
      .then(([availableLights, siteData]) => {
        if (!mounted) return;
        if (availableLights && availableLights.length > 0) {
          setLights(availableLights);
        } else if (siteData?.ssl_sites && siteData.ssl_sites.length > 0) {
          setLights(siteData.ssl_sites.map((s) => ({ id: s.id, uid: s.uid })));
        }
        if (siteData?.vendor?.name) {
          setVendorName(siteData.vendor.name);
        }
      })
      .catch((err) => {
        console.error('Failed to load initial data:', err);
      })
      .finally(() => {
        if (mounted) setLoadingInitial(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // 2. When light selected, fetch details
  const handleLightChange = async (id: string) => {
    setSelectedLightId(id);
    setFieldErrors({});
    setToast(null);

    if (!id) {
      setLightDetail(null);
      resetFormFields();
      return;
    }

    setLoadingDetail(true);
    try {
      const details = await upInstallationService.getSsl18wLightDetails(id);
      if (details) {
        setLightDetail(details);
        // Pre-fill fields if available
        if (details.ward_no) setWardNo(details.ward_no);
        if (details.pole_no) setPoleNo(details.pole_no);
        if (details.beneficiary_name) setBeneficiaryName(details.beneficiary_name);
        if (details.beneficiary_contact) setBeneficiaryContact(details.beneficiary_contact);
        if (details.uuid_no) setUuidNo(details.uuid_no);
        if (details.battery_serial_no) setBatterySerialNo(details.battery_serial_no);
        if (details.panel_no) setPanelNo(details.panel_no);
        if (details.light_no) setLightNo(details.light_no);
        if (details.latitude) setLatitude(String(details.latitude));
        if (details.longitude) setLongitude(String(details.longitude));
      } else {
        setLightDetail(null);
      }
    } catch (err: any) {
      console.error(err);
      setToast({ type: 'error', message: 'Failed to fetch light details.' });
    } finally {
      setLoadingDetail(false);
    }
  };

  const resetFormFields = () => {
    setWardNo('');
    setPoleNo('');
    setBeneficiaryName('');
    setBeneficiaryContact('');
    setUuidNo('');
    setBatterySerialNo('');
    setPanelNo('');
    setLightNo('');
    setLatitude('');
    setLongitude('');
    setLightImage(null);
    setRemarks('');
  };

  // GPS Geolocation handler
  const fetchCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
        setToast({ type: 'success', message: 'GPS coordinates retrieved successfully!' });
      },
      (err) => {
        alert(`Location access failed: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Validation
  const validate = () => {
    const errs: Record<string, string> = {};
    if (!selectedLightId) errs.ssl_id = 'Please select a Unique ID';
    if (!wardNo.trim()) errs.ward_no = 'Ward Number is required';
    if (!poleNo.trim()) errs.pole_no = 'Pole Number is required';
    if (!beneficiaryName.trim()) errs.beneficiary_name = 'Beneficiary Name is required';
    if (!beneficiaryContact.trim()) errs.beneficiary_contact = 'Beneficiary Contact is required';
    if (!uuidNo.trim()) errs.uuid_no = 'UUID Number is required';
    if (!batterySerialNo.trim()) errs.battery_serial_no = 'Battery Number is required';
    if (!panelNo.trim()) errs.panel_no = 'Panel Number is required';
    if (!lightNo.trim()) errs.light_no = 'Light Number is required';
    if (!latitude.trim()) errs.latitude = 'Latitude is required';
    if (!longitude.trim()) errs.longitude = 'Longitude is required';
    if (!lightImage) errs.light_file = 'Light Image is required';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setToast(null);

    if (!validate()) {
      setToast({ type: 'error', message: 'Please complete all required fields marked with *.' });
      return;
    }

    setSubmitting(true);
    const fd = new FormData();
    fd.append('ssl_id', selectedLightId);
    fd.append('ward_no', wardNo);
    fd.append('pole_no', poleNo);
    fd.append('beneficiary_name', beneficiaryName);
    fd.append('beneficiary_contact', beneficiaryContact);
    fd.append('uuid_no', uuidNo);
    fd.append('battery_serial_no', batterySerialNo);
    fd.append('panel_no', panelNo);
    fd.append('light_no', lightNo);
    fd.append('latitude', latitude);
    fd.append('longitude', longitude);
    if (remarks) fd.append('remark', remarks);
    if (lightImage) fd.append('light_file', lightImage);

    try {
      const res = await upInstallationService.storeSsl18wInstallation(fd);
      if (res.status) {
        setToast({ type: 'success', message: res.message || 'Installation details saved successfully!' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => {
          navigate('/v/up/ssl-view-installed-18w-light');
        }, 1500);
      } else {
        if (res.errors) {
          const mapped: Record<string, string> = {};
          Object.entries(res.errors).forEach(([k, v]) => {
            mapped[k] = Array.isArray(v) ? v[0] : String(v);
          });
          setFieldErrors(mapped);
        }
        setToast({ type: 'error', message: res.message || res.error || 'Failed to save installation details.' });
      }
    } catch (err: any) {
      setToast({ type: 'error', message: err?.message || 'Server error occurred during submission.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="solar-erp-page ax-page">
      <PageHead
        title="Welcome to, UP SSL Install 18w Light"
        subtitle="Record solar street light installation details and upload site commissioning proof"
        breadcrumbs={[
          { label: 'Home', href: '/v' },
          { label: 'UP SSL Install 18w Light' },
        ]}
        actions={
          <div className="ax-cluster" style={{ gap: 8 }}>
            <Link to="/v/up/ssl-view-installed-18w-light" className="ax-btn ax-btn--secondary ax-btn--sm">
              View Installed Lights
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

      {/* Select Unique ID Card */}
      <div className="ax-card" style={{ marginBottom: 20 }}>
        <div className="ax-card__header" style={{ padding: '14px 18px' }}>
          <h3 className="ax-card__title" style={{ margin: 0, fontSize: 16 }}>
            UP SSL 18w Information
          </h3>
        </div>
        <div className="ax-card__body" style={{ padding: 18 }}>
          <div style={{ maxWidth: 420 }}>
            <label htmlFor="ssl-unique-id" style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'var(--ax-text-strong)' }}>
              Select Unique ID's <span style={{ color: 'var(--ax-danger, #ef4444)' }}>*</span>
            </label>
            <select
              id="ssl-unique-id"
              className={`ax-select ${fieldErrors.ssl_id ? 'is-invalid' : ''}`}
              style={{ width: '100%', height: 42, fontSize: 14 }}
              value={selectedLightId}
              disabled={loadingInitial}
              onChange={(e) => handleLightChange(e.target.value)}
            >
              <option value="">-- Select Unique ID's --</option>
              {lights.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.uid}
                </option>
              ))}
            </select>
            {fieldErrors.ssl_id && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{fieldErrors.ssl_id}</div>}
            {loadingDetail && <div style={{ fontSize: 12, color: 'var(--ax-accent, #2563eb)', marginTop: 4 }}>Loading site specifications...</div>}
          </div>
        </div>
      </div>

      {/* Read-Only Information Card */}
      <div className="ax-card" style={{ marginBottom: 20 }}>
        <div className="ax-card__header" style={{ padding: '14px 18px', background: 'var(--ax-surface-subtle, #f8fafc)' }}>
          <h3 className="ax-card__title" style={{ margin: 0, fontSize: 16 }}>
            Information
          </h3>
        </div>
        <div className="ax-card__body" style={{ padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, fontSize: 13 }}>
            <div>
              <div style={{ color: 'var(--ax-text-muted)', fontSize: 12, marginBottom: 2 }}>Vendor</div>
              <div style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>{vendorName}</div>
            </div>
            <div>
              <div style={{ color: 'var(--ax-text-muted)', fontSize: 12, marginBottom: 2 }}>State</div>
              <div style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>{lightDetail?.state ? lightDetail.state.toUpperCase() : 'UP'}</div>
            </div>
            <div>
              <div style={{ color: 'var(--ax-text-muted)', fontSize: 12, marginBottom: 2 }}>Phase</div>
              <div style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>{lightDetail?.phase || DASH}</div>
            </div>
            <div>
              <div style={{ color: 'var(--ax-text-muted)', fontSize: 12, marginBottom: 2 }}>District</div>
              <div style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>{lightDetail?.district || DASH}</div>
            </div>
            <div>
              <div style={{ color: 'var(--ax-text-muted)', fontSize: 12, marginBottom: 2 }}>Block</div>
              <div style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>{lightDetail?.block || DASH}</div>
            </div>
            <div>
              <div style={{ color: 'var(--ax-text-muted)', fontSize: 12, marginBottom: 2 }}>Panchayat</div>
              <div style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>{lightDetail?.panchayat || DASH}</div>
            </div>
            <div>
              <div style={{ color: 'var(--ax-text-muted)', fontSize: 12, marginBottom: 2 }}>Work Order No.</div>
              <div style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>{lightDetail?.wo_no || DASH}</div>
            </div>
            <div>
              <div style={{ color: 'var(--ax-text-muted)', fontSize: 12, marginBottom: 2 }}>WO Received</div>
              <div style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>{lightDetail?.wo_received || DASH}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Fill this Form Card */}
      <form onSubmit={handleSubmit} noValidate>
        <div className="ax-card">
          <div className="ax-card__header" style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 className="ax-card__title" style={{ margin: 0, fontSize: 16 }}>
                Fill this Form
              </h3>
              <p className="ax-card__subtitle" style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--ax-text-muted)' }}>
                The field labels marked with <span style={{ color: 'var(--ax-danger, #ef4444)' }}>*</span> are fields.
              </p>
            </div>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={fetchCurrentLocation}
              title="Automatically get device GPS coordinates"
            >
              📍 Get GPS Coordinates
            </button>
          </div>

          <div className="ax-card__body" style={{ padding: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
              {/* Ward Number */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  Ward Number <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className={`ax-input ${fieldErrors.ward_no ? 'is-invalid' : ''}`}
                  placeholder="Enter Ward Number"
                  value={wardNo}
                  onChange={(e) => {
                    setWardNo(e.target.value);
                    if (fieldErrors.ward_no) setFieldErrors((prev) => ({ ...prev, ward_no: '' }));
                  }}
                />
                {fieldErrors.ward_no && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{fieldErrors.ward_no}</div>}
              </div>

              {/* Pole Number */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  Pole Number <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className={`ax-input ${fieldErrors.pole_no ? 'is-invalid' : ''}`}
                  placeholder="Enter Pole Number"
                  value={poleNo}
                  onChange={(e) => {
                    setPoleNo(e.target.value);
                    if (fieldErrors.pole_no) setFieldErrors((prev) => ({ ...prev, pole_no: '' }));
                  }}
                />
                {fieldErrors.pole_no && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{fieldErrors.pole_no}</div>}
              </div>

              {/* Beneficiary Name */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  Benificiary Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className={`ax-input ${fieldErrors.beneficiary_name ? 'is-invalid' : ''}`}
                  placeholder="Enter Benificiary Name"
                  value={beneficiaryName}
                  onChange={(e) => {
                    setBeneficiaryName(e.target.value);
                    if (fieldErrors.beneficiary_name) setFieldErrors((prev) => ({ ...prev, beneficiary_name: '' }));
                  }}
                />
                {fieldErrors.beneficiary_name && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{fieldErrors.beneficiary_name}</div>}
              </div>

              {/* Beneficiary Contact */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  Benificiary Contact <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="tel"
                  maxLength={15}
                  className={`ax-input ${fieldErrors.beneficiary_contact ? 'is-invalid' : ''}`}
                  placeholder="Enter Contact Number"
                  value={beneficiaryContact}
                  onChange={(e) => {
                    setBeneficiaryContact(e.target.value);
                    if (fieldErrors.beneficiary_contact) setFieldErrors((prev) => ({ ...prev, beneficiary_contact: '' }));
                  }}
                />
                {fieldErrors.beneficiary_contact && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{fieldErrors.beneficiary_contact}</div>}
              </div>

              {/* UUID No */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  UUID NO <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className={`ax-input ${fieldErrors.uuid_no ? 'is-invalid' : ''}`}
                  placeholder="Enter UUID Number"
                  value={uuidNo}
                  onChange={(e) => {
                    setUuidNo(e.target.value);
                    if (fieldErrors.uuid_no) setFieldErrors((prev) => ({ ...prev, uuid_no: '' }));
                  }}
                />
                {fieldErrors.uuid_no && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{fieldErrors.uuid_no}</div>}
              </div>

              {/* Battery Number */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  Battery Number <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className={`ax-input ${fieldErrors.battery_serial_no ? 'is-invalid' : ''}`}
                  placeholder="Enter Battery Number"
                  value={batterySerialNo}
                  onChange={(e) => {
                    setBatterySerialNo(e.target.value);
                    if (fieldErrors.battery_serial_no) setFieldErrors((prev) => ({ ...prev, battery_serial_no: '' }));
                  }}
                />
                {fieldErrors.battery_serial_no && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{fieldErrors.battery_serial_no}</div>}
              </div>

              {/* Panel Number */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  Panel Number <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className={`ax-input ${fieldErrors.panel_no ? 'is-invalid' : ''}`}
                  placeholder="Enter Panel Number"
                  value={panelNo}
                  onChange={(e) => {
                    setPanelNo(e.target.value);
                    if (fieldErrors.panel_no) setFieldErrors((prev) => ({ ...prev, panel_no: '' }));
                  }}
                />
                {fieldErrors.panel_no && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{fieldErrors.panel_no}</div>}
              </div>

              {/* Light Number */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  Light Number <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className={`ax-input ${fieldErrors.light_no ? 'is-invalid' : ''}`}
                  placeholder="Enter Light Number"
                  value={lightNo}
                  onChange={(e) => {
                    setLightNo(e.target.value);
                    if (fieldErrors.light_no) setFieldErrors((prev) => ({ ...prev, light_no: '' }));
                  }}
                />
                {fieldErrors.light_no && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{fieldErrors.light_no}</div>}
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
                  onChange={(e) => {
                    setLatitude(e.target.value);
                    if (fieldErrors.latitude) setFieldErrors((prev) => ({ ...prev, latitude: '' }));
                  }}
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
                  onChange={(e) => {
                    setLongitude(e.target.value);
                    if (fieldErrors.longitude) setFieldErrors((prev) => ({ ...prev, longitude: '' }));
                  }}
                />
                {fieldErrors.longitude && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{fieldErrors.longitude}</div>}
              </div>

              {/* Light Image */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  Light Image <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className={`ax-input ${fieldErrors.light_file ? 'is-invalid' : ''}`}
                  style={{ paddingTop: 6 }}
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    setLightImage(f);
                    if (fieldErrors.light_file) setFieldErrors((prev) => ({ ...prev, light_file: '' }));
                  }}
                />
                {fieldErrors.light_file && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{fieldErrors.light_file}</div>}
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
              onClick={resetFormFields}
              disabled={submitting}
            >
              Reset
            </button>
            <button
              type="submit"
              className="ax-btn ax-btn--primary"
              disabled={submitting || !selectedLightId}
              style={{ minWidth: 160 }}
            >
              {submitting ? 'Saving Installation...' : 'Submit Installation'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default UP_Installation_SSL_InstallLight;
