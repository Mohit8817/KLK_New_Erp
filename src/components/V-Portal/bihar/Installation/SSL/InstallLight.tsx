import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { PageHead } from '../../../../shell/PageHead';
import {
  biharSslInstallationService,
  getCompanyId,
  type SslLightDropdownItem,
  type SslLightDetail,
} from '../../bihar-services';
import { SkeletonLine, SkeletonRect } from '../../../../../common/skeletons/SkeletonPrimitives';

export function Bihar_Installation_SSL_InstallLight() {
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

  // Fetch light details when selectedUniqueId changes
  const handleSelectLight = useCallback(async (uid: string) => {
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
        // Pre-fill form fields if values exist
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
  }, []);

  const resetForm = () => {
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
  };

  // GPS Location handler
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(String(pos.coords.latitude));
        setLongitude(String(pos.coords.longitude));
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
      <PageHead
        title="Install Light"
        subtitle="Complete installation verification form for assigned Bihar SSL sites"
        breadcrumbs={[
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

      {/* Alert Banners */}
      {successMsg && (
        <div
          style={{
            padding: '12px 18px',
            marginBottom: 16,
            borderRadius: 8,
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#065f46',
            fontSize: 14,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>✓ {successMsg}</span>
          <button
            type="button"
            onClick={() => setSuccessMsg(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#065f46', fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      {errorMsg && (
        <div
          style={{
            padding: '12px 18px',
            marginBottom: 16,
            borderRadius: 8,
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            fontSize: 14,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>⚠ {errorMsg}</span>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b', fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Step 1: Select Unique ID ── */}
      <div className="ax-card" style={{ padding: '20px 24px', borderRadius: 12, marginBottom: 20 }}>
        <div style={{ maxWidth: 500 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--ax-text-strong)', marginBottom: 6 }}>
            Select Unique ID's <span style={{ color: '#ef4444' }}>*</span>
          </label>
          {dropdownLoading ? (
            <SkeletonRect width="100%" height={40} borderRadius="8px" />
          ) : (
            <select
              className="ax-input"
              value={selectedUniqueId}
              onChange={(e) => handleSelectLight(e.target.value)}
              style={{ width: '100%', height: 40, borderRadius: 8 }}
            >
              <option value="">-- Select Unique ID's --</option>
              {lightOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.unique_id || `Site #${opt.id}`}
                </option>
              ))}
            </select>
          )}
          {fieldErrors.unique_id && (
            <span style={{ color: '#ef4444', fontSize: 12, marginTop: 4, display: 'block' }}>
              {fieldErrors.unique_id}
            </span>
          )}
        </div>
      </div>

<<<<<<< HEAD
      {/* ── Step 2: Bihar SSL Site Information (Pre-filled details) ── */}
      {selectedUniqueId && (
        <div className="ax-card" style={{ padding: '20px 24px', borderRadius: 12, marginBottom: 20 }}>
          <div className="ax-card__header" style={{ marginBottom: 14, padding: 0 }}>
            <div className="ax-card__titles">
              <h3 className="ax-card__title" style={{ fontSize: 16, fontWeight: 700 }}>
                Bihar SSL Site Information
              </h3>
              <p className="ax-card__subtitle" style={{ fontSize: 12, color: 'var(--ax-text-muted)' }}>
                Fetched system parameters and site location details
              </p>
            </div>
          </div>

          {detailLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i}>
                  <SkeletonLine width="60%" height="0.8em" style={{ marginBottom: 6 }} />
                  <SkeletonRect width="100%" height={32} borderRadius="6px" />
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: 14,
              }}
            >
=======
      {/* ── Card 2: Bihar SSL Site Information (Pre-filled details) ── */}
      <section className="ax-card">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">Bihar SSL Site Information</h2>
            <p className="ax-card__subtitle">
              {selectedUniqueId
                ? 'Fetched system parameters and allocated location info'
                : 'Select a Unique ID above to fetch site information'}
            </p>
          </div>
          <span
            className={`ax-badge ax-badge--pill ${
              selectedUniqueId ? 'ax-badge--soft ax-badge--info' : 'ax-badge--soft ax-badge--neutral'
            }`}
          >
            {selectedUniqueId ? 'Auto-fetched' : 'Pending Selection'}
          </span>
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
>>>>>>> f499236 (almost done SSL)
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
<<<<<<< HEAD
                <div
                  key={idx}
                  style={{
                    background: 'var(--ax-surface-subtle, #f8fafc)',
                    border: '1px solid var(--ax-border, #e2e8f0)',
                    borderRadius: 8,
                    padding: '10px 14px',
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)' }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ax-text-strong)', marginTop: 2, wordBreak: 'break-word' }}>
                    {item.val || '—'}
                  </div>
=======
                <div key={idx} className="ula-info-tile">
                  <div className="ula-info-tile__label">{item.label}</div>
                  <div className="ula-info-tile__val">{item.val || '—'}</div>
>>>>>>> f499236 (almost done SSL)
                </div>
              ))}
            </div>
          )}
        </div>
<<<<<<< HEAD
      )}
=======
      </section>
>>>>>>> f499236 (almost done SSL)

      {/* ── Step 3: Installation Form ── */}
      <div className="ax-card" style={{ padding: '24px 28px', borderRadius: 12 }}>
        <div className="ax-card__header" style={{ marginBottom: 18, padding: 0 }}>
          <div className="ax-card__titles">
            <h3 className="ax-card__title" style={{ fontSize: 17, fontWeight: 700 }}>
              Fill this Form
            </h3>
            <p className="ax-card__subtitle" style={{ fontSize: 12.5, color: 'var(--ax-text-muted)' }}>
              The field labels marked with <span style={{ color: '#ef4444' }}>*</span> are mandatory fields.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 18,
              marginBottom: 20,
            }}
          >
            {/* Ward Number */}
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>
                Ward Number <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                className="ax-input"
                placeholder="Enter Ward Number"
                value={wardNo}
                onChange={(e) => setWardNo(e.target.value)}
                style={{ width: '100%', height: 40, borderRadius: 8 }}
              />
              {fieldErrors.ward_no && (
                <span style={{ color: '#ef4444', fontSize: 11.5, marginTop: 4, display: 'block' }}>
                  {fieldErrors.ward_no}
                </span>
              )}
            </div>

            {/* Pole Number */}
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>
                Pole Number <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                className="ax-input"
                placeholder="Enter Pole Number"
                value={poleNo}
                onChange={(e) => setPoleNo(e.target.value)}
                style={{ width: '100%', height: 40, borderRadius: 8 }}
              />
              {fieldErrors.pole_no && (
                <span style={{ color: '#ef4444', fontSize: 11.5, marginTop: 4, display: 'block' }}>
                  {fieldErrors.pole_no}
                </span>
              )}
            </div>

            {/* Beneficiary Name */}
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>
                Benificiary Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                className="ax-input"
                placeholder="Enter Benificiary Name"
                value={beneficiaryName}
                onChange={(e) => setBeneficiaryName(e.target.value)}
                style={{ width: '100%', height: 40, borderRadius: 8 }}
              />
              {fieldErrors.beneficiary_name && (
                <span style={{ color: '#ef4444', fontSize: 11.5, marginTop: 4, display: 'block' }}>
                  {fieldErrors.beneficiary_name}
                </span>
              )}
            </div>

            {/* Beneficiary Contact */}
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>
                Benificiary Contact <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                className="ax-input"
                placeholder="Enter Contact Number"
                value={contactNo}
                onChange={(e) => setContactNo(e.target.value)}
                style={{ width: '100%', height: 40, borderRadius: 8 }}
              />
              {fieldErrors.contact_no && (
                <span style={{ color: '#ef4444', fontSize: 11.5, marginTop: 4, display: 'block' }}>
                  {fieldErrors.contact_no}
                </span>
              )}
            </div>

            {/* UUID NO */}
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>
                UUID NO <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                className="ax-input"
                placeholder="Enter UUID Number"
                value={uuidNo}
                onChange={(e) => setUuidNo(e.target.value)}
                style={{ width: '100%', height: 40, borderRadius: 8 }}
              />
              {fieldErrors.uuid_no && (
                <span style={{ color: '#ef4444', fontSize: 11.5, marginTop: 4, display: 'block' }}>
                  {fieldErrors.uuid_no}
                </span>
              )}
            </div>

            {/* Battery Number */}
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>
                Battery Number <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                className="ax-input"
                placeholder="Enter Battery Number"
                value={batteryNo}
                onChange={(e) => setBatteryNo(e.target.value)}
                style={{ width: '100%', height: 40, borderRadius: 8 }}
              />
              {fieldErrors.battery_serial_no && (
                <span style={{ color: '#ef4444', fontSize: 11.5, marginTop: 4, display: 'block' }}>
                  {fieldErrors.battery_serial_no}
                </span>
              )}
            </div>

            {/* Panel Number (Module No) */}
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>
                Panel Number <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                className="ax-input"
                placeholder="Enter Panel Number"
                value={panelNo}
                onChange={(e) => setPanelNo(e.target.value)}
                style={{ width: '100%', height: 40, borderRadius: 8 }}
              />
              {fieldErrors.module_no && (
                <span style={{ color: '#ef4444', fontSize: 11.5, marginTop: 4, display: 'block' }}>
                  {fieldErrors.module_no}
                </span>
              )}
            </div>

            {/* Light Number */}
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>
                Light Number <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                className="ax-input"
                placeholder="Enter Light Number"
                value={lightNo}
                onChange={(e) => setLightNo(e.target.value)}
                style={{ width: '100%', height: 40, borderRadius: 8 }}
              />
              {fieldErrors.light_no && (
                <span style={{ color: '#ef4444', fontSize: 11.5, marginTop: 4, display: 'block' }}>
                  {fieldErrors.light_no}
                </span>
              )}
            </div>

            {/* Latitude & Longitude with Get GPS button */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: 12.5, fontWeight: 700 }}>
                  Latitude <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#2563eb',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <circle cx={12} cy={12} r={10} />
                    <line x1={12} y1={2} x2={12} y2={6} />
                    <line x1={12} y1={18} x2={12} y2={22} />
                    <line x1={2} y1={12} x2={6} y2={12} />
                    <line x1={18} y1={12} x2={22} y2={12} />
                  </svg>
                  Get GPS
                </button>
              </div>
              <input
                type="text"
                className="ax-input"
                placeholder="e.g. 25.6093"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                style={{ width: '100%', height: 40, borderRadius: 8 }}
              />
              {fieldErrors.latitude && (
                <span style={{ color: '#ef4444', fontSize: 11.5, marginTop: 4, display: 'block' }}>
                  {fieldErrors.latitude}
                </span>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>
                Longitude <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                className="ax-input"
                placeholder="e.g. 85.1376"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                style={{ width: '100%', height: 40, borderRadius: 8 }}
              />
              {fieldErrors.longitude && (
                <span style={{ color: '#ef4444', fontSize: 11.5, marginTop: 4, display: 'block' }}>
                  {fieldErrors.longitude}
                </span>
              )}
            </div>

            {/* Light Image Upload */}
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>
                Light Image <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div
                style={{
                  border: '2px dashed var(--ax-border, #cbd5e1)',
                  borderRadius: 10,
                  padding: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  background: 'var(--ax-surface-subtle, #f8fafc)',
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: 'block', fontSize: 13 }}
                />
                {filePreview && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <img
                      src={filePreview}
                      alt="Light Preview"
                      style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, border: '1px solid #cbd5e1' }}
                    />
                    <span style={{ fontSize: 12, color: 'var(--ax-text-muted)' }}>Image ready for upload</span>
                  </div>
                )}
              </div>
              {fieldErrors.light_file && (
                <span style={{ color: '#ef4444', fontSize: 11.5, marginTop: 4, display: 'block' }}>
                  {fieldErrors.light_file}
                </span>
              )}
            </div>

            {/* Remarks */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>
                Remarks
              </label>
              <textarea
                className="ax-input"
                placeholder="Enter Remarks..."
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                style={{ width: '100%', borderRadius: 8, padding: 10 }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button
              type="submit"
              className="ax-btn ax-btn--primary"
              disabled={submitting}
              style={{ padding: '10px 24px', fontWeight: 700 }}
            >
              {submitting ? 'Submitting…' : 'Submit Installation Details'}
            </button>
            <button
              type="button"
              className="ax-btn ax-btn--secondary"
              onClick={resetForm}
              disabled={submitting}
            >
              Reset Form
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Bihar_Installation_SSL_InstallLight;
