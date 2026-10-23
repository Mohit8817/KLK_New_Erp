import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  biharSslInstallationService,
  getCompanyId,
  type SslLightDropdownItem,
  type SslLightDetail,
} from '../../bihar-services';
import { SkeletonLine, SkeletonRect } from '../../../../../common/skeletons/SkeletonPrimitives';

/* ── ULA Single-Card Form Styling ── */
const FORM_CSS = `
  .solar-erp-page { --ula-accent: var(--ax-accent, #2563eb); }
  .solar-erp-page .ax-card {
    border: 1px solid var(--ax-border-subtle, #e2e8f0);
    border-radius: var(--ax-radius-xl, 16px);
    background: var(--ax-surface-solid, #fff);
    box-shadow: var(--ax-shadow-sm, 0 2px 8px rgba(15,23,42,.04));
    overflow: hidden;
    margin-bottom: var(--ax-space-5, 20px);
  }
  .solar-erp-page .ax-card__header {
    padding: 18px 24px;
    border-bottom: 1px solid var(--ax-border-subtle, #e2e8f0);
    background: var(--ax-surface-subtle, #f8fafc);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .solar-erp-page .ax-card__titles {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .solar-erp-page .ax-card__title {
    font-size: var(--ax-text-lg, 17px);
    font-weight: 700;
    color: var(--ax-text-strong, #0f172a);
    margin: 0;
  }
  .solar-erp-page .ax-card__subtitle {
    font-size: 12px;
    color: var(--ax-text-muted, #64748b);
    margin: 0;
  }
  .solar-erp-page .ax-card__body {
    padding: 24px;
  }

  /* Grid for Information Tiles */
  .ula-info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 14px;
  }
  .ula-info-tile {
    background: var(--ax-surface-subtle, #f8fafc);
    border: 1px solid var(--ax-border-subtle, #e2e8f0);
    border-radius: var(--ax-radius-md, 8px);
    padding: 10px 14px;
    transition: border-color .15s ease;
  }
  .ula-info-tile:hover {
    border-color: var(--ax-border, #cbd5e1);
  }
  .ula-info-tile__label {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .04em;
    color: var(--ax-text-muted, #64748b);
  }
  .ula-info-tile__val {
    font-size: 13.5px;
    font-weight: 650;
    color: var(--ax-text-strong, #0f172a);
    margin-top: 3px;
    word-break: break-word;
  }

  /* Grid for form inputs */
  .ula-form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 18px;
    margin-bottom: 22px;
  }
  .ula-form-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .ula-form-label {
    font-size: 12.5px;
    font-weight: 650;
    color: var(--ax-text-strong, #0f172a);
  }
  .ula-form-label .req {
    color: #ef4444;
    font-weight: 700;
    margin-left: 2px;
  }
  .ula-form-input {
    width: 100%;
    height: 42px;
    padding: 0 14px;
    font-size: 13.5px;
    border-radius: var(--ax-radius-md, 8px);
    border: 1px solid var(--ax-border, #cbd5e1);
    background: var(--ax-surface-solid, #fff);
    color: var(--ax-text-strong, #0f172a);
    outline: none;
    transition: border-color .15s ease, box-shadow .15s ease;
  }
  .ula-form-input:focus {
    border-color: var(--ula-accent);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--ula-accent) 18%, transparent);
  }
  .ula-form-input.is-invalid {
    border-color: #ef4444;
  }
  .ula-form-error {
    font-size: 11.5px;
    font-weight: 500;
    color: #ef4444;
    margin-top: 2px;
  }

  /* File upload dropzone */
  .ula-file-box {
    border: 2px dashed var(--ax-border, #cbd5e1);
    border-radius: var(--ax-radius-lg, 12px);
    padding: 18px 20px;
    text-align: center;
    background: var(--ax-surface-subtle, #f8fafc);
    cursor: pointer;
    transition: all .2s ease;
  }
  .ula-file-box:hover {
    border-color: var(--ula-accent);
    background: color-mix(in srgb, var(--ula-accent) 4%, #fff);
  }
`;

const ICON_PROPS = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

const ICON_GPS = (
  <svg style={{ width: 14, height: 14 }} {...ICON_PROPS}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
  </svg>
);

export function Bihar_Installation_SSL_InstallLight() {
  const { id: routeId } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const queryId = searchParams.get('id') || searchParams.get('unique_id');
  const targetId = routeId || queryId;

  // Dropdown list
  const [dropdownLoading, setDropdownLoading] = useState(true);
  const [lightOptions, setLightOptions] = useState<SslLightDropdownItem[]>([]);
  const [selectedUniqueId, setSelectedUniqueId] = useState<string>('');

  // Pre-filled site details
  const [detailLoading, setDetailLoading] = useState(false);
  const [siteDetail, setSiteDetail] = useState<SslLightDetail | null>(null);

  // Form Fields
  const [wardNo, setWardNo] = useState('');
  const [poleNo, setPoleNo] = useState('');
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [uuidNo, setUuidNo] = useState('');
  const [batteryNo, setBatteryNo] = useState('');
  const [panelNo, setPanelNo] = useState('');
  const [lightNo, setLightNo] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [remarks, setRemarks] = useState('');
  const [lightFile, setLightFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  // Submission & Alert state
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const resetForm = useCallback(() => {
    setWardNo('');
    setPoleNo('');
    setBeneficiaryName('');
    setContactNo('');
    setUuidNo('');
    setBatteryNo('');
    setPanelNo('');
    setLightNo('');
    setLatitude('');
    setLongitude('');
    setRemarks('');
    setLightFile(null);
    setFilePreview(null);
  }, []);

  // Fetch light details when selectedUniqueId changes
  const handleSelectLight = useCallback(
    async (uid: string) => {
      setSelectedUniqueId(uid);
      setSuccessMsg(null);
      setErrorMsg(null);
      setFieldErrors({});

      if (!uid) {
        setSiteDetail(null);
        resetForm();
        return;
      }

      setDetailLoading(true);
      try {
        const detail = await biharSslInstallationService.fetchLightDetail(uid);
        setSiteDetail(detail);

        if (detail) {
          setWardNo(detail.ward_no || '');
          setPoleNo(detail.pole_no || '');
          setBeneficiaryName(detail.beneficiary_name || '');
          setContactNo(detail.contact_no || '');
          setUuidNo(detail.uuid_no || '');
          setBatteryNo(detail.battery_serial_no || '');
          setPanelNo(detail.module_no || '');
          setLightNo(detail.light_no || '');
          setLatitude(detail.latitude || '');
          setLongitude(detail.longitude || '');
        }
      } catch (err) {
        console.error('[InstallLight] fetch detail error:', err);
        setErrorMsg('Could not fetch light details.');
      } finally {
        setDetailLoading(false);
      }
    },
    [resetForm]
  );

  // Fetch dropdown list on mount
  useEffect(() => {
    let active = true;
    (async () => {
      setDropdownLoading(true);
      try {
        const list = await biharSslInstallationService.fetchLightNames();
        if (active) {
          setLightOptions(Array.isArray(list) ? list : []);
        }
      } catch (err) {
        console.error('[InstallLight] fetch dropdown error:', err);
      } finally {
        if (active) setDropdownLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Auto-load if route has an id param or query param
  useEffect(() => {
    if (targetId && targetId !== selectedUniqueId) {
      handleSelectLight(targetId);
    }
  }, [targetId, handleSelectLight, selectedUniqueId]);

  // GPS Location handler
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(String(pos.coords.latitude.toFixed(6)));
        setLongitude(String(pos.coords.longitude.toFixed(6)));
      },
      (err) => {
        setErrorMsg(`Unable to retrieve GPS location: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // File change with image preview
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLightFile(file);
      const url = URL.createObjectURL(file);
      setFilePreview(url);
    } else {
      setLightFile(null);
      setFilePreview(null);
    }
  };

  // Form submit
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setFieldErrors({});

    // Basic Validation
    const errs: Record<string, string> = {};
    if (!selectedUniqueId) errs.unique_id = 'Please select a Unique ID';
    if (!wardNo.trim()) errs.ward_no = 'Ward Number is required';
    if (!poleNo.trim()) errs.pole_no = 'Pole Number is required';
    if (!beneficiaryName.trim()) errs.beneficiary_name = 'Beneficiary Name is required';
    if (!contactNo.trim()) errs.contact_no = 'Contact Number is required';
    if (!uuidNo.trim()) errs.uuid_no = 'UUID NO is required';
    if (!batteryNo.trim()) errs.battery_serial_no = 'Battery Number is required';
    if (!panelNo.trim()) errs.module_no = 'Panel Number is required';
    if (!lightNo.trim()) errs.light_no = 'Light Number is required';
    if (!latitude.trim()) errs.latitude = 'Latitude is required';
    if (!longitude.trim()) errs.longitude = 'Longitude is required';
    if (!lightFile) errs.light_file = 'Light Image is required';

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setErrorMsg('Please fill in all mandatory fields.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('ssl_id', selectedUniqueId);
      formData.append('uuid_no', uuidNo.trim());
      formData.append('light_no', lightNo.trim());
      formData.append('ward_no', wardNo.trim());
      formData.append('pole_no', poleNo.trim());
      formData.append('module_no', panelNo.trim());
      formData.append('battery_serial_no', batteryNo.trim());
      formData.append('latitude', latitude.trim());
      formData.append('longitude', longitude.trim());
      formData.append('beneficiary_name', beneficiaryName.trim());
      formData.append('contact_no', contactNo.trim());
      if (remarks.trim()) {
        formData.append('remark', remarks.trim());
      }
      if (lightFile) {
        formData.append('light_file', lightFile);
      }

      const res = await biharSslInstallationService.installLightStore(formData);
      setSuccessMsg(res.message || 'Details saved successfully.');

      // Refresh dropdown options
      const updatedList = await biharSslInstallationService.fetchLightNames();
      setLightOptions(Array.isArray(updatedList) ? updatedList : []);

      // Reset
      setSelectedUniqueId('');
      setSiteDetail(null);
      resetForm();
    } catch (err: any) {
      console.error('[InstallLight] submit error:', err);
      setErrorMsg(err.message || 'Failed to submit installation details.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ax-page solar-erp-page">
      <style>{FORM_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="Install Light"
        subtitle="Complete installation verification form for assigned Bihar SSL sites"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Bihar' },
          { label: 'Installation' },
          { label: 'SSL', href: '/v/ssl/installation-dashboard' },
          { label: 'Install Light' },
        ]}
        actions={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="ax-badge ax-badge--soft ax-badge--accent ax-badge--pill" style={{ fontWeight: 600 }}>
              Company ID: {getCompanyId()}
            </span>
          </div>
        }
      />

      {/* Alerts */}
      {successMsg && (
        <div className="ax-alert ax-alert--success" style={{ marginBottom: 'var(--ax-space-4)' }}>
          <div className="ax-alert__title">Success</div>
          <div className="ax-alert__text">{successMsg}</div>
        </div>
      )}

      {errorMsg && (
        <div className="ax-alert ax-alert--danger" style={{ marginBottom: 'var(--ax-space-4)' }}>
          <div className="ax-alert__title">Error</div>
          <div className="ax-alert__text">{errorMsg}</div>
        </div>
      )}

      {/* ── Card 1: Select Unique ID ── */}
      <section className="ax-card">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">Select Unique ID's</h2>
            <p className="ax-card__subtitle">Choose an allocated light ID to load its system parameters</p>
          </div>
        </div>
        <div className="ax-card__body">
          <div style={{ maxWidth: 480 }}>
            <label className="ula-form-label" style={{ display: 'block', marginBottom: 8 }}>
              Select Unique ID's <span className="req">*</span>
            </label>
            {dropdownLoading ? (
              <SkeletonRect width="100%" height={42} borderRadius="8px" />
            ) : (
              <select
                className={`ula-form-input ${fieldErrors.unique_id ? 'is-invalid' : ''}`}
                value={selectedUniqueId}
                onChange={(e) => handleSelectLight(e.target.value)}
              >
                <option value="">-- Select Unique ID's --</option>
                {lightOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.unique_id || `Site #${opt.id}`}
                  </option>
                ))}
              </select>
            )}
            {fieldErrors.unique_id && <div className="ula-form-error">{fieldErrors.unique_id}</div>}
          </div>
        </div>
      </section>

      {/* ── Card 2: Bihar SSL Site Information (Pre-filled details) ── */}
      {selectedUniqueId && (
        <section className="ax-card">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">Bihar SSL Site Information</h2>
              <p className="ax-card__subtitle">Fetched system parameters and allocated location info</p>
            </div>
            <span className="ax-badge ax-badge--soft ax-badge--info ax-badge--pill">Auto-fetched</span>
          </div>
          <div className="ax-card__body">
            {detailLoading ? (
              <div className="ula-info-grid">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="ula-info-tile">
                    <SkeletonLine width="50%" height="0.8em" style={{ marginBottom: 6 }} />
                    <SkeletonRect width="100%" height={20} borderRadius="4px" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="ula-info-grid">
                {[
                  { label: 'Vendor Name', val: siteDetail?.vendor || siteDetail?.vendor_name || 'App Testing' },
                  { label: 'State', val: siteDetail?.state || 'Bihar' },
                  { label: 'Phase', val: siteDetail?.phase || '—' },
                  { label: 'District', val: siteDetail?.district || '—' },
                  { label: 'Block', val: siteDetail?.block || '—' },
                  { label: 'Panchayat', val: siteDetail?.panchyat || siteDetail?.panchayat || '—' },
                  { label: 'Work Order No.', val: siteDetail?.wo_no || '—' },
                  { label: 'Work Order Received', val: siteDetail?.wo_received || '—' },
                  { label: 'Ward No.', val: siteDetail?.ward_no || '—' },
                  { label: 'Pole No.', val: siteDetail?.pole_no || '—' },
                  { label: 'Beneficiary Name', val: siteDetail?.beneficiary_name || '—' },
                  { label: 'Contact No.', val: siteDetail?.contact_no || '—' },
                  { label: 'Latitude', val: siteDetail?.latitude || '—' },
                  { label: 'Longitude', val: siteDetail?.longitude || '—' },
                  { label: 'Luminary No.', val: siteDetail?.luminary_no || '—' },
                  { label: 'Sim No.', val: siteDetail?.sim_no || '—' },
                  { label: 'Battery Serial No.', val: siteDetail?.battery_serial_no || '—' },
                  { label: 'Module No.', val: siteDetail?.module_no || '—' },
                  { label: 'Supply', val: siteDetail?.supply || '—' },
                  { label: 'Material Inspection', val: siteDetail?.material_inspection || '—' },
                  { label: 'Installation', val: siteDetail?.installation || '—' },
                  { label: 'Date of Installation', val: siteDetail?.date_of_installation || '—' },
                  { label: 'Installed By', val: siteDetail?.installed_by || '—' },
                  { label: 'Inspected by Breda', val: siteDetail?.inspected_by_breda || '—' },
                ].map((item, idx) => (
                  <div key={idx} className="ula-info-tile">
                    <div className="ula-info-tile__label">{item.label}</div>
                    <div className="ula-info-tile__val">{item.val || '—'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Card 3: Fill this Form ── */}
      <section className="ax-card">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">Fill this Form</h2>
            <p className="ax-card__subtitle">
              The field labels marked with <span style={{ color: '#ef4444' }}>*</span> are mandatory.
            </p>
          </div>
        </div>

        <div className="ax-card__body">
          <form onSubmit={handleSubmit}>
            <div className="ula-form-grid">
              {/* Ward Number */}
              <div className="ula-form-field">
                <label className="ula-form-label">
                  Ward Number <span className="req">*</span>
                </label>
                <input
                  type="text"
                  className={`ula-form-input ${fieldErrors.ward_no ? 'is-invalid' : ''}`}
                  placeholder="Enter Ward Number"
                  value={wardNo}
                  onChange={(e) => setWardNo(e.target.value)}
                />
                {fieldErrors.ward_no && <div className="ula-form-error">{fieldErrors.ward_no}</div>}
              </div>

              {/* Pole Number */}
              <div className="ula-form-field">
                <label className="ula-form-label">
                  Pole Number <span className="req">*</span>
                </label>
                <input
                  type="text"
                  className={`ula-form-input ${fieldErrors.pole_no ? 'is-invalid' : ''}`}
                  placeholder="Enter Pole Number"
                  value={poleNo}
                  onChange={(e) => setPoleNo(e.target.value)}
                />
                {fieldErrors.pole_no && <div className="ula-form-error">{fieldErrors.pole_no}</div>}
              </div>

              {/* Beneficiary Name */}
              <div className="ula-form-field">
                <label className="ula-form-label">
                  Benificiary Name <span className="req">*</span>
                </label>
                <input
                  type="text"
                  className={`ula-form-input ${fieldErrors.beneficiary_name ? 'is-invalid' : ''}`}
                  placeholder="Enter Benificiary Name"
                  value={beneficiaryName}
                  onChange={(e) => setBeneficiaryName(e.target.value)}
                />
                {fieldErrors.beneficiary_name && (
                  <div className="ula-form-error">{fieldErrors.beneficiary_name}</div>
                )}
              </div>

              {/* Beneficiary Contact */}
              <div className="ula-form-field">
                <label className="ula-form-label">
                  Benificiary Contact <span className="req">*</span>
                </label>
                <input
                  type="tel"
                  className={`ula-form-input ${fieldErrors.contact_no ? 'is-invalid' : ''}`}
                  placeholder="Enter Contact Number"
                  value={contactNo}
                  onChange={(e) => setContactNo(e.target.value)}
                />
                {fieldErrors.contact_no && <div className="ula-form-error">{fieldErrors.contact_no}</div>}
              </div>

              {/* UUID NO */}
              <div className="ula-form-field">
                <label className="ula-form-label">
                  UUID NO <span className="req">*</span>
                </label>
                <input
                  type="text"
                  className={`ula-form-input ${fieldErrors.uuid_no ? 'is-invalid' : ''}`}
                  placeholder="Enter UUID Number"
                  value={uuidNo}
                  onChange={(e) => setUuidNo(e.target.value)}
                />
                {fieldErrors.uuid_no && <div className="ula-form-error">{fieldErrors.uuid_no}</div>}
              </div>

              {/* Battery Number */}
              <div className="ula-form-field">
                <label className="ula-form-label">
                  Battery Number <span className="req">*</span>
                </label>
                <input
                  type="text"
                  className={`ula-form-input ${fieldErrors.battery_serial_no ? 'is-invalid' : ''}`}
                  placeholder="Enter Battery Number"
                  value={batteryNo}
                  onChange={(e) => setBatteryNo(e.target.value)}
                />
                {fieldErrors.battery_serial_no && (
                  <div className="ula-form-error">{fieldErrors.battery_serial_no}</div>
                )}
              </div>

              {/* Panel Number */}
              <div className="ula-form-field">
                <label className="ula-form-label">
                  Panel Number <span className="req">*</span>
                </label>
                <input
                  type="text"
                  className={`ula-form-input ${fieldErrors.module_no ? 'is-invalid' : ''}`}
                  placeholder="Enter Panel Number"
                  value={panelNo}
                  onChange={(e) => setPanelNo(e.target.value)}
                />
                {fieldErrors.module_no && <div className="ula-form-error">{fieldErrors.module_no}</div>}
              </div>

              {/* Light Number */}
              <div className="ula-form-field">
                <label className="ula-form-label">
                  Light Number <span className="req">*</span>
                </label>
                <input
                  type="text"
                  className={`ula-form-input ${fieldErrors.light_no ? 'is-invalid' : ''}`}
                  placeholder="Enter Light Number"
                  value={lightNo}
                  onChange={(e) => setLightNo(e.target.value)}
                />
                {fieldErrors.light_no && <div className="ula-form-error">{fieldErrors.light_no}</div>}
              </div>

              {/* Latitude */}
              <div className="ula-form-field">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="ula-form-label">
                    Latitude <span className="req">*</span>
                  </label>
                  <button
                    type="button"
                    className="ax-btn ax-btn--ghost ax-btn--xs"
                    onClick={handleGetLocation}
                    style={{ fontSize: 11, gap: 4, color: 'var(--ula-accent)' }}
                  >
                    {ICON_GPS} GPS
                  </button>
                </div>
                <input
                  type="text"
                  className={`ula-form-input ${fieldErrors.latitude ? 'is-invalid' : ''}`}
                  placeholder="Enter Latitude"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                />
                {fieldErrors.latitude && <div className="ula-form-error">{fieldErrors.latitude}</div>}
              </div>

              {/* Longitude */}
              <div className="ula-form-field">
                <label className="ula-form-label">
                  Longitude <span className="req">*</span>
                </label>
                <input
                  type="text"
                  className={`ula-form-input ${fieldErrors.longitude ? 'is-invalid' : ''}`}
                  placeholder="Enter Longitude"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                />
                {fieldErrors.longitude && <div className="ula-form-error">{fieldErrors.longitude}</div>}
              </div>
            </div>

            {/* Light Image Upload */}
            <div style={{ marginBottom: 20 }}>
              <label className="ula-form-label" style={{ display: 'block', marginBottom: 8 }}>
                Light Image <span className="req">*</span>
              </label>
              <div className="ula-file-box">
                <input
                  type="file"
                  id="ssl_light_file"
                  accept="image/jpeg,image/png,image/jpg"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <label htmlFor="ssl_light_file" style={{ cursor: 'pointer', display: 'block' }}>
                  {filePreview ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
                      <img
                        src={filePreview}
                        alt="Selected site preview"
                        style={{
                          width: 80,
                          height: 80,
                          objectFit: 'cover',
                          borderRadius: 0,
                          border: '1px solid var(--ax-border)',
                        }}
                      />
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 650, fontSize: 13 }}>{lightFile?.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', marginTop: 2 }}>
                          {lightFile ? `${(lightFile.size / 1024).toFixed(1)} KB` : ''}
                        </div>
                        <span
                          className="ax-btn ax-btn--secondary ax-btn--xs"
                          style={{ marginTop: 6 }}
                          onClick={(e) => {
                            e.preventDefault();
                            document.getElementById('ssl_light_file')?.click();
                          }}
                        >
                          Change Photo
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <svg
                        style={{ width: 32, height: 32, margin: '0 auto 8px', color: 'var(--ax-text-muted)' }}
                        {...ICON_PROPS}
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>Click to select or drag and drop image</div>
                      <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', marginTop: 2 }}>
                        JPEG, JPG or PNG (up to 5MB)
                      </div>
                    </div>
                  )}
                </label>
              </div>
              {fieldErrors.light_file && <div className="ula-form-error">{fieldErrors.light_file}</div>}
            </div>

            {/* Remarks */}
            <div style={{ marginBottom: 24 }}>
              <label className="ula-form-label" style={{ display: 'block', marginBottom: 6 }}>
                Remarks
              </label>
              <textarea
                className="ula-form-input"
                style={{ height: 80, padding: 12, resize: 'vertical' }}
                placeholder="Enter Remarks..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>

            {/* Submit Action */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="ax-btn ax-btn--secondary"
                onClick={resetForm}
                disabled={submitting}
              >
                Reset Form
              </button>
              <button
                type="submit"
                className="ax-btn ax-btn--primary"
                disabled={submitting}
                style={{ minWidth: 150 }}
              >
                {submitting ? 'Submitting…' : 'Submit Installation'}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}

export default Bihar_Installation_SSL_InstallLight;
