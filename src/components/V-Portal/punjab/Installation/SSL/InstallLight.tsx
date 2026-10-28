import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  punjabSslInstallationService,
  getMediaUrl,
  type PunjabLightDropdownItem,
  type PunjabLightDetail,
} from '../../punjab-services';

/* Unified single-card design */
const ULA_STYLE_CSS = `
.ula-inst-form .ax-card { border: 1px solid var(--ax-border); border-radius: var(--ax-radius-xl); background: var(--ax-surface-solid); box-shadow: var(--ax-shadow-sm); overflow: hidden; }
.ula-inst-form .ax-card__header { padding: var(--ax-space-5) var(--ax-space-6); border-bottom: 1px solid var(--ax-border-subtle); background: var(--ax-surface-subtle); display: flex; flex-direction: column; gap: var(--ax-space-4); }
.ula-inst-form .ax-card__body { padding: var(--ax-space-6); }

.ula-section-pills { display: flex; gap: var(--ax-space-2); overflow-x: auto; padding-bottom: 4px; scrollbar-width: thin; }
.ula-section-pill-btn { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: var(--ax-radius-pill); font-size: var(--ax-text-xs); font-weight: 500; white-space: nowrap; background: var(--ax-surface-solid); border: 1px solid var(--ax-border); color: var(--ax-text); cursor: pointer; transition: all 0.15s ease; }
.ula-section-pill-btn:hover { border-color: var(--ax-accent); color: var(--ax-accent); background: color-mix(in srgb, var(--ax-accent) 6%, var(--ax-surface-solid)); }
.ula-section-pill-btn .pill-num { width: 18px; height: 18px; border-radius: 50%; background: var(--ax-surface-subtle); display: inline-flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; }

.ula-section-block { padding-top: var(--ax-space-2); }
.ula-section-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: var(--ax-space-2); margin-bottom: var(--ax-space-5); padding-bottom: var(--ax-space-3); border-bottom: 1px solid var(--ax-border-subtle); }
.ula-section-title-wrap { display: flex; flex-direction: column; gap: 4px; }
.ula-section-divider { border: 0; border-top: 1px dashed var(--ax-border); margin: var(--ax-space-8) 0 var(--ax-space-6); }

.ax-float { position: relative; width: 100%; }
.ax-float__input { width: 100%; height: 46px; padding: 12px 14px 4px 14px; font-size: var(--ax-text-sm); background: var(--ax-surface-solid); border: 1px solid var(--ax-border); border-radius: var(--ax-radius-md); color: var(--ax-text); outline: none; transition: border-color 0.15s ease, box-shadow 0.15s ease; }
textarea.ax-float__input { height: auto; min-height: 84px; padding-top: 20px; resize: vertical; }
.ax-float__input::placeholder { color: transparent; }
.ax-float__input:focus { border-color: var(--ax-accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--ax-accent) 20%, transparent); }
.ax-float__input:disabled { opacity: .6; cursor: not-allowed; }
.ax-float__label { position: absolute; inset-inline-start: 12px; top: 23px; transform: translateY(-50%); margin: 0; padding: 0 4px; font-size: var(--ax-text-sm); color: var(--ax-text-subtle); background: var(--ax-surface-solid); border-radius: var(--ax-radius-xs); pointer-events: none; transition: top 0.15s ease, font-size 0.15s ease, color 0.15s ease; z-index: 2; white-space: nowrap; max-width: calc(100% - 24px); overflow: hidden; text-overflow: ellipsis; }
.ax-float__input:focus + .ax-float__label,
.ax-float__input:not(:placeholder-shown) + .ax-float__label,
.ax-float--select .ax-float__label { top: 0; transform: translateY(-50%); font-size: var(--ax-text-2xs); font-weight: 500; color: var(--ax-text-muted); }
.ax-float__input:focus + .ax-float__label { color: var(--ax-accent); }
.ax-float__input.is-invalid { border-color: var(--ax-danger-500) !important; }
.ax-float__input.is-invalid:focus { box-shadow: 0 0 0 3px color-mix(in srgb, var(--ax-danger-500) 24%, transparent) !important; }
.ax-float__input.is-invalid + .ax-float__label { color: var(--ax-danger-500) !important; }
.ax-float__input.is-valid { border-color: var(--ax-success-500) !important; }
.ax-float__input.is-valid:focus { box-shadow: 0 0 0 3px color-mix(in srgb, var(--ax-success-500) 24%, transparent) !important; }
.ax-float__input.is-valid + .ax-float__label { color: var(--ax-success-500) !important; }

.ax-field-feedback { display: flex; align-items: center; gap: 4px; margin-top: 4px; font-size: var(--ax-text-2xs); min-height: 16px; }
.ax-field-feedback--error { color: var(--ax-danger-500); }

.ula-form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--ax-space-4); }
@media (min-width: 1024px) { .ula-form-grid--3col { grid-template-columns: repeat(3, 1fr); } }
.ula-form-col-span-full { grid-column: 1 / -1; }

.ula-site-info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: var(--ax-space-3); }
@media (min-width: 1024px) { .ula-site-info-grid { grid-template-columns: repeat(4, 1fr); } }
.ula-site-info-card { display: flex; flex-direction: column; gap: 4px; min-width: 0; padding: var(--ax-space-3) var(--ax-space-4); background: var(--ax-surface-solid); border: 1px solid var(--ax-border); border-radius: var(--ax-radius-lg); }
.ula-site-info-card__label { font-size: var(--ax-text-2xs); font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: var(--ax-text-muted); }
.ula-site-info-card__value { font-size: var(--ax-text-base); font-weight: 600; color: var(--ax-text-strong); overflow-wrap: anywhere; }

.ula-photo-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--ax-space-4); }
.ula-photo-card { border: 1px solid var(--ax-border); border-radius: var(--ax-radius-lg); padding: var(--ax-space-4); background: var(--ax-surface-solid); display: flex; flex-direction: column; justify-content: space-between; gap: var(--ax-space-3); min-height: 170px; }
.ula-photo-card.is-valid { border-color: var(--ax-success-500); }
.ula-photo-card.is-invalid { border-color: var(--ax-danger-500); }

.ula-form-sticky-bar { position: sticky; bottom: var(--ax-space-4); z-index: 30; margin-top: var(--ax-space-6); padding: var(--ax-space-3) var(--ax-space-5); background: var(--ax-surface-solid); border: 1px solid var(--ax-border); border-radius: var(--ax-radius-xl); box-shadow: var(--ax-shadow-lg); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--ax-space-3); backdrop-filter: blur(12px); }
`;

const MAX_FILE = 5 * 1024 * 1024; // 5120 KB as per API doc

const iconProps = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };
const ICON_CROSSHAIR = (<svg style={{ width: 15, height: 15 }} {...iconProps}><circle cx="12" cy="12" r="10" /><line x1="22" y1="12" x2="18" y2="12" /><line x1="6" y1="12" x2="2" y2="12" /><line x1="12" y1="6" x2="12" y2="2" /><line x1="12" y1="22" x2="12" y2="18" /></svg>);
const ICON_CAMERA = (<svg style={{ width: 15, height: 15 }} {...iconProps}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>);

interface FieldStatusProps { className: string; isValid: boolean; isInvalid: boolean; }

const formatInfo = (v: unknown): string => {
  if (v === null || v === undefined) return 'N/A';
  const s = String(v).trim();
  return s === '' || s === '0' ? 'N/A' : s;
};

type FormState = {
  wardNo: string;
  poleNo: string;
  beneficiaryName: string;
  contactNo: string;
  uuidNo: string;
  batteryNo: string;
  panelNo: string;
  lightNo: string;
  latitude: string;
  longitude: string;
  remarks: string;
};

const EMPTY_FORM: FormState = {
  wardNo: '',
  poleNo: '',
  beneficiaryName: '',
  contactNo: '',
  uuidNo: '',
  batteryNo: '',
  panelNo: '',
  lightNo: '',
  latitude: '',
  longitude: '',
  remarks: '',
};

export function Punjab_Installation_SSL_InstallLight() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editIdParam = searchParams.get('ssl_id') || searchParams.get('id') || searchParams.get('light_id');
  const isEditMode = searchParams.get('edit') === 'true' || Boolean(searchParams.get('ssl_id'));

  const [dropdownLoading, setDropdownLoading] = useState(true);
  const [lightOptions, setLightOptions] = useState<PunjabLightDropdownItem[]>([]);
  const [selectedLightId, setSelectedLightId] = useState<string>(editIdParam ? String(editIdParam) : '');

  const [detailLoading, setDetailLoading] = useState(false);
  const [siteDetail, setSiteDetail] = useState<PunjabLightDetail | null>(null);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [lightFile, setLightFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [lightFile2, setLightFile2] = useState<File | null>(null);
  const [filePreview2, setFilePreview2] = useState<string | null>(null);

  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [existingImageUrl2, setExistingImageUrl2] = useState<string | null>(null);

  const [gpsDetecting, setGpsDetecting] = useState(false);
  const [gpsStatusMsg, setGpsStatusMsg] = useState<string | null>(null);

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef1 = useRef<HTMLInputElement>(null);
  const fileInputRef2 = useRef<HTMLInputElement>(null);

  const validate = (name: string, value: string): string => {
    if (!value.trim()) return 'This field is required.';
    if (name === 'contactNo') {
      const clean = value.replace(/\D/g, '');
      if (clean.length !== 10) return 'Contact number must be exactly 10 digits.';
    }
    return '';
  };

  const setField = (name: keyof FormState, value: string) => {
    setForm((p) => ({ ...p, [name]: value }));
    if (name !== 'remarks') setErrors((p) => ({ ...p, [name]: validate(name, value) }));
  };

  const handleBlur = (name: string) => setTouched((p) => ({ ...p, [name]: true }));

  const getStatus = (name: string, value: unknown): FieldStatusProps => {
    if (!(touched[name] || submitted)) return { className: '', isValid: false, isInvalid: false };
    if (errors[name]) return { className: 'is-invalid', isValid: false, isInvalid: true };
    if (value !== null && value !== undefined && String(value).trim() !== '') return { className: 'is-valid', isValid: true, isInvalid: false };
    return { className: '', isValid: false, isInvalid: false };
  };

  const resetForm = useCallback(() => {
    setForm(EMPTY_FORM);
    setLightFile(null);
    setFilePreview(null);
    setLightFile2(null);
    setFilePreview2(null);
    setExistingImageUrl(null);
    setExistingImageUrl2(null);
    setTouched({});
    setErrors({});
    setSubmitted(false);
    setGpsStatusMsg(null);
  }, []);

  // Fetch Dropdown list
  useEffect(() => {
    let active = true;
    (async () => {
      setDropdownLoading(true);
      try {
        const list = await punjabSslInstallationService.fetchLightNames();
        if (active) setLightOptions(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error('[InstallLight] fetch dropdown error:', err);
      } finally {
        if (active) setDropdownLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  // Fetch Light Details on Select or Edit Mode
  const handleSelectLight = useCallback(async (idOrUid: string) => {
    setSelectedLightId(idOrUid);
    setExistingImageUrl(null);
    setExistingImageUrl2(null);
    setSuccessMsg(null);
    setErrorMsg(null);

    if (!idOrUid) {
      setSiteDetail(null);
      resetForm();
      return;
    }

    setDetailLoading(true);
    try {
      let detail: PunjabLightDetail | null = null;
      if (isEditMode) {
        detail = await punjabSslInstallationService.getUpdateInstallLightLoad(idOrUid);
      }
      if (!detail) {
        detail = await punjabSslInstallationService.fetchLightDetail(idOrUid);
      }

      setSiteDetail(detail);
      if (detail) {
        setForm((p) => ({
          ...p,
          wardNo: detail?.ward_no || '',
          poleNo: detail?.pole_no || '',
          beneficiaryName: detail?.beneficiary_name || '',
          contactNo: detail?.contact_no || '',
          uuidNo: detail?.uuid_no || '',
          batteryNo: detail?.battery_serial_no || '',
          panelNo: detail?.panel_no || '',
          lightNo: detail?.light_no || '',
          latitude: detail?.latitude ? String(detail.latitude) : '',
          longitude: detail?.longitude ? String(detail.longitude) : '',
          remarks: detail?.remark || detail?.inst_remark || '',
        }));
        if (detail.light_file) setExistingImageUrl(getMediaUrl(detail.light_file));
        if (detail.light_file2) setExistingImageUrl2(getMediaUrl(detail.light_file2));
        setErrors({});
      }
    } catch (err) {
      console.error('[InstallLight] fetch detail error:', err);
      setSiteDetail(null);
      setErrorMsg('Could not fetch light details.');
    } finally {
      setDetailLoading(false);
    }
  }, [isEditMode, resetForm]);

  useEffect(() => {
    if (editIdParam) {
      handleSelectLight(String(editIdParam));
    }
  }, [editIdParam, handleSelectLight]);

  // GPS Detect
  const handleDetectGps = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsStatusMsg('Geolocation is not supported by your browser.');
      return;
    }
    setGpsDetecting(true);
    setGpsStatusMsg('Acquiring high-accuracy GPS coordinates…');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        setField('latitude', lat);
        setField('longitude', lng);
        setGpsDetecting(false);
        setGpsStatusMsg(`GPS Lock Acquired (Accuracy: ±${Math.round(pos.coords.accuracy)}m)`);
      },
      (err) => {
        setGpsDetecting(false);
        setGpsStatusMsg(`GPS failed: ${err.message}. Please enter manually.`);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  }, []);

  // File Upload Handlers
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, isSecond = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE) {
      setErrorMsg('File size exceeds the 5MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (isSecond) {
        setLightFile2(file);
        setFilePreview2(reader.result as string);
      } else {
        setLightFile(file);
        setFilePreview(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Submit Handler
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const sslNumericId = siteDetail?.id || Number(selectedLightId);
    if (!sslNumericId) {
      setErrorMsg('Please select a valid Light ID from the dropdown.');
      return;
    }

    // Validate required fields
    const newErrors: Record<string, string> = {};
    const reqKeys: (keyof FormState)[] = [
      'beneficiaryName',
      'contactNo',
      'wardNo',
      'uuidNo',
      'poleNo',
      'lightNo',
      'panelNo',
      'batteryNo',
      'latitude',
      'longitude',
    ];

    reqKeys.forEach((key) => {
      const err = validate(key, form[key]);
      if (err) newErrors[key] = err;
    });

    if (!isEditMode) {
      if (!lightFile) newErrors['light_file'] = 'Light Image 1 is required.';
      if (!lightFile2) newErrors['light_file2'] = 'Light Image 2 is required.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setErrorMsg('Please correct the highlighted errors before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('ssl_id', String(sslNumericId));
      formData.append('uuid_no', form.uuidNo.trim());
      formData.append('pole_no', form.poleNo.trim());
      formData.append('light_no', form.lightNo.trim());
      formData.append('panel_no', form.panelNo.trim());
      formData.append('battery_serial_no', form.batteryNo.trim());
      formData.append('beneficiary_name', form.beneficiaryName.trim());
      formData.append('ward_no', form.wardNo.trim());
      formData.append('contact_no', form.contactNo.trim().replace(/\D/g, ''));
      formData.append('latitude', form.latitude.trim());
      formData.append('longitude', form.longitude.trim());
      if (form.remarks.trim()) {
        formData.append('remark', form.remarks.trim());
      }

      if (lightFile) {
        formData.append('light_file', lightFile);
      }
      if (lightFile2) {
        formData.append('light_file2', lightFile2);
      }

      let res;
      if (isEditMode) {
        res = await punjabSslInstallationService.updateInstallLightStore(formData);
      } else {
        res = await punjabSslInstallationService.storeLightDetails(formData);
      }

      setSuccessMsg(res.message || 'Light installed successfully!');
      setTimeout(() => {
        navigate('/v/punjab/ssl/installation/complete-light#Completed');
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit light installation.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ax-page ula-inst-form">
      <style>{ULA_STYLE_CSS}</style>

      <PageHead
        title={isEditMode ? 'Update Installed Light' : 'Install Light Details'}
        subtitle="Record physical site parameters, hardware serials, and geo-tagged inspection photos in Punjab"
        breadcrumbs={[
          { label: 'Punjab' },
          { label: 'Installation' },
          { label: 'SSL', href: '/v/punjab/ssl/installation/dashboard' },
          { label: isEditMode ? 'Update Light' : 'Install Light' },
        ]}
      />

      {successMsg && (
        <div className="ax-alert ax-alert--success" style={{ marginBottom: 16 }}>
          <div className="ax-alert__content">
            <p className="ax-alert__message">{successMsg}</p>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="ax-alert ax-alert--danger" style={{ marginBottom: 16 }}>
          <div className="ax-alert__content">
            <p className="ax-alert__message">{errorMsg}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="ax-card">
          <div className="ax-card__header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                  {isEditMode ? 'Edit Light Installation Record' : 'Punjab SSL Installation Form'}
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--ax-text-muted)' }}>
                  State: <b>Punjab</b> · All fields marked with * are mandatory
                </p>
              </div>

              {/* Light Picker Dropdown */}
              <div style={{ width: 280 }}>
                <select
                  className="ax-input ax-input--sm"
                  style={{ width: '100%', fontWeight: 600 }}
                  value={selectedLightId}
                  disabled={dropdownLoading || isEditMode}
                  onChange={(e) => handleSelectLight(e.target.value)}
                >
                  <option value="">-- Select Allocated Light --</option>
                  {lightOptions.map((opt) => (
                    <option key={opt.id || opt.unique_id} value={opt.id || opt.unique_id}>
                      {opt.unique_id} {opt.panchayat ? `(${opt.panchayat})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="ax-card__body">
            {detailLoading && (
              <div style={{ textAlign: 'center', padding: 32 }}>
                <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading light installation profile…
              </div>
            )}

            {/* Section 1: Pre-Allocated Site Details */}
            {siteDetail && (
              <div className="ula-section-block">
                <div className="ula-section-header">
                  <div className="ula-section-title-wrap">
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--ax-text-muted)' }}>
                      1. Site & Administrative Details
                    </h4>
                  </div>
                </div>

                <div className="ula-site-info-grid">
                  <div className="ula-site-info-card">
                    <span className="ula-site-info-card__label">Unique ID</span>
                    <span className="ula-site-info-card__value" style={{ color: 'var(--ax-accent)' }}>
                      {formatInfo(siteDetail.unique_id || siteDetail.id)}
                    </span>
                  </div>
                  <div className="ula-site-info-card">
                    <span className="ula-site-info-card__label">District</span>
                    <span className="ula-site-info-card__value">{formatInfo(siteDetail.district)}</span>
                  </div>
                  <div className="ula-site-info-card">
                    <span className="ula-site-info-card__label">Block</span>
                    <span className="ula-site-info-card__value">{formatInfo(siteDetail.block)}</span>
                  </div>
                  <div className="ula-site-info-card">
                    <span className="ula-site-info-card__label">Panchayat</span>
                    <span className="ula-site-info-card__value">{formatInfo(siteDetail.panchayat)}</span>
                  </div>
                  <div className="ula-site-info-card">
                    <span className="ula-site-info-card__label">Sarpanch Name</span>
                    <span className="ula-site-info-card__value">{formatInfo(siteDetail.sarpanch_name)}</span>
                  </div>
                  <div className="ula-site-info-card">
                    <span className="ula-site-info-card__label">Sarpanch Contact</span>
                    <span className="ula-site-info-card__value">{formatInfo(siteDetail.sarpanch_contact)}</span>
                  </div>
                  <div className="ula-site-info-card">
                    <span className="ula-site-info-card__label">Phase</span>
                    <span className="ula-site-info-card__value">{formatInfo(siteDetail.phase)}</span>
                  </div>
                  <div className="ula-site-info-card">
                    <span className="ula-site-info-card__label">Work Order No.</span>
                    <span className="ula-site-info-card__value">{formatInfo(siteDetail.wo_no)}</span>
                  </div>
                </div>

                <hr className="ula-section-divider" />
              </div>
            )}

            {/* Section 2: Beneficiary Details */}
            <div className="ula-section-block">
              <div className="ula-section-header">
                <div className="ula-section-title-wrap">
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--ax-text-muted)' }}>
                    2. Beneficiary Details
                  </h4>
                </div>
              </div>

              <div className="ula-form-grid ula-form-grid--3col">
                <div className="ax-float">
                  <input
                    id="beneficiaryName"
                    type="text"
                    className={`ax-float__input ${getStatus('beneficiaryName', form.beneficiaryName).className}`}
                    placeholder=" "
                    value={form.beneficiaryName}
                    onChange={(e) => setField('beneficiaryName', e.target.value)}
                    onBlur={() => handleBlur('beneficiaryName')}
                  />
                  <label htmlFor="beneficiaryName" className="ax-float__label">Beneficiary Name *</label>
                  {errors.beneficiaryName && (
                    <div className="ax-field-feedback ax-field-feedback--error">{errors.beneficiaryName}</div>
                  )}
                </div>

                <div className="ax-float">
                  <input
                    id="contactNo"
                    type="tel"
                    maxLength={10}
                    className={`ax-float__input ${getStatus('contactNo', form.contactNo).className}`}
                    placeholder=" "
                    value={form.contactNo}
                    onChange={(e) => setField('contactNo', e.target.value)}
                    onBlur={() => handleBlur('contactNo')}
                  />
                  <label htmlFor="contactNo" className="ax-float__label">Beneficiary Contact No. (10 digits) *</label>
                  {errors.contactNo && (
                    <div className="ax-field-feedback ax-field-feedback--error">{errors.contactNo}</div>
                  )}
                </div>

                <div className="ax-float">
                  <input
                    id="wardNo"
                    type="text"
                    className={`ax-float__input ${getStatus('wardNo', form.wardNo).className}`}
                    placeholder=" "
                    value={form.wardNo}
                    onChange={(e) => setField('wardNo', e.target.value)}
                    onBlur={() => handleBlur('wardNo')}
                  />
                  <label htmlFor="wardNo" className="ax-float__label">Ward Number *</label>
                  {errors.wardNo && (
                    <div className="ax-field-feedback ax-field-feedback--error">{errors.wardNo}</div>
                  )}
                </div>
              </div>

              <hr className="ula-section-divider" />
            </div>

            {/* Section 3: Hardware Serials */}
            <div className="ula-section-block">
              <div className="ula-section-header">
                <div className="ula-section-title-wrap">
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--ax-text-muted)' }}>
                    3. Installed Hardware Identifiers
                  </h4>
                </div>
              </div>

              <div className="ula-form-grid ula-form-grid--3col">
                <div className="ax-float">
                  <input
                    id="uuidNo"
                    type="text"
                    className={`ax-float__input ${getStatus('uuidNo', form.uuidNo).className}`}
                    placeholder=" "
                    value={form.uuidNo}
                    onChange={(e) => setField('uuidNo', e.target.value)}
                    onBlur={() => handleBlur('uuidNo')}
                  />
                  <label htmlFor="uuidNo" className="ax-float__label">UUID Number *</label>
                  {errors.uuidNo && (
                    <div className="ax-field-feedback ax-field-feedback--error">{errors.uuidNo}</div>
                  )}
                </div>

                <div className="ax-float">
                  <input
                    id="poleNo"
                    type="text"
                    className={`ax-float__input ${getStatus('poleNo', form.poleNo).className}`}
                    placeholder=" "
                    value={form.poleNo}
                    onChange={(e) => setField('poleNo', e.target.value)}
                    onBlur={() => handleBlur('poleNo')}
                  />
                  <label htmlFor="poleNo" className="ax-float__label">Pole Number *</label>
                  {errors.poleNo && (
                    <div className="ax-field-feedback ax-field-feedback--error">{errors.poleNo}</div>
                  )}
                </div>

                <div className="ax-float">
                  <input
                    id="lightNo"
                    type="text"
                    className={`ax-float__input ${getStatus('lightNo', form.lightNo).className}`}
                    placeholder=" "
                    value={form.lightNo}
                    onChange={(e) => setField('lightNo', e.target.value)}
                    onBlur={() => handleBlur('lightNo')}
                  />
                  <label htmlFor="lightNo" className="ax-float__label">Light Luminary Number *</label>
                  {errors.lightNo && (
                    <div className="ax-field-feedback ax-field-feedback--error">{errors.lightNo}</div>
                  )}
                </div>

                <div className="ax-float">
                  <input
                    id="panelNo"
                    type="text"
                    className={`ax-float__input ${getStatus('panelNo', form.panelNo).className}`}
                    placeholder=" "
                    value={form.panelNo}
                    onChange={(e) => setField('panelNo', e.target.value)}
                    onBlur={() => handleBlur('panelNo')}
                  />
                  <label htmlFor="panelNo" className="ax-float__label">Solar Panel Serial No. *</label>
                  {errors.panelNo && (
                    <div className="ax-field-feedback ax-field-feedback--error">{errors.panelNo}</div>
                  )}
                </div>

                <div className="ax-float">
                  <input
                    id="batteryNo"
                    type="text"
                    className={`ax-float__input ${getStatus('batteryNo', form.batteryNo).className}`}
                    placeholder=" "
                    value={form.batteryNo}
                    onChange={(e) => setField('batteryNo', e.target.value)}
                    onBlur={() => handleBlur('batteryNo')}
                  />
                  <label htmlFor="batteryNo" className="ax-float__label">Battery Serial No. *</label>
                  {errors.batteryNo && (
                    <div className="ax-field-feedback ax-field-feedback--error">{errors.batteryNo}</div>
                  )}
                </div>
              </div>

              <hr className="ula-section-divider" />
            </div>

            {/* Section 4: Geolocation */}
            <div className="ula-section-block">
              <div className="ula-section-header">
                <div className="ula-section-title-wrap">
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--ax-text-muted)' }}>
                    4. GPS Coordinates & Geolocation
                  </h4>
                </div>
                <button
                  type="button"
                  className="ax-btn ax-btn--secondary ax-btn--sm"
                  onClick={handleDetectGps}
                  disabled={gpsDetecting}
                >
                  {ICON_CROSSHAIR}
                  <span>{gpsDetecting ? 'Detecting…' : 'Capture Current GPS'}</span>
                </button>
              </div>

              {gpsStatusMsg && (
                <div style={{ fontSize: 12, color: 'var(--ax-accent)', marginBottom: 12 }}>
                  {gpsStatusMsg}
                </div>
              )}

              <div className="ula-form-grid">
                <div className="ax-float">
                  <input
                    id="latitude"
                    type="text"
                    className={`ax-float__input ${getStatus('latitude', form.latitude).className}`}
                    placeholder=" "
                    value={form.latitude}
                    onChange={(e) => setField('latitude', e.target.value)}
                    onBlur={() => handleBlur('latitude')}
                  />
                  <label htmlFor="latitude" className="ax-float__label">Latitude (e.g. 30.9010) *</label>
                  {errors.latitude && (
                    <div className="ax-field-feedback ax-field-feedback--error">{errors.latitude}</div>
                  )}
                </div>

                <div className="ax-float">
                  <input
                    id="longitude"
                    type="text"
                    className={`ax-float__input ${getStatus('longitude', form.longitude).className}`}
                    placeholder=" "
                    value={form.longitude}
                    onChange={(e) => setField('longitude', e.target.value)}
                    onBlur={() => handleBlur('longitude')}
                  />
                  <label htmlFor="longitude" className="ax-float__label">Longitude (e.g. 75.8573) *</label>
                  {errors.longitude && (
                    <div className="ax-field-feedback ax-field-feedback--error">{errors.longitude}</div>
                  )}
                </div>
              </div>

              <hr className="ula-section-divider" />
            </div>

            {/* Section 5: Photos */}
            <div className="ula-section-block">
              <div className="ula-section-header">
                <div className="ula-section-title-wrap">
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--ax-text-muted)' }}>
                    5. Site Installation Photographs (Max 5MB)
                  </h4>
                </div>
              </div>

              <div className="ula-photo-grid">
                {/* Photo 1: light_file */}
                <div className={`ula-photo-card ${filePreview || existingImageUrl ? 'is-valid' : errors.light_file ? 'is-invalid' : ''}`}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>
                      Light Installation Photo 1 {!isEditMode && <span style={{ color: 'var(--ax-danger-500)' }}>*</span>}
                    </span>
                    <p style={{ margin: '2px 0 10px', fontSize: 11, color: 'var(--ax-text-muted)' }}>
                      Pole view showing installed luminary & panel
                    </p>
                  </div>

                  {(filePreview || existingImageUrl) && (
                    <div style={{ position: 'relative', width: '100%', height: 140, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--ax-border)' }}>
                      <img
                        src={filePreview || existingImageUrl!}
                        alt="Photo 1 Preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                  )}

                  <input
                    ref={fileInputRef1}
                    type="file"
                    accept="image/*,application/pdf"
                    style={{ display: 'none' }}
                    onChange={(e) => handleFileChange(e, false)}
                  />

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      className="ax-btn ax-btn--secondary ax-btn--sm"
                      style={{ flex: 1 }}
                      onClick={() => fileInputRef1.current?.click()}
                    >
                      {ICON_CAMERA}
                      <span>{filePreview || existingImageUrl ? 'Change Photo' : 'Select Photo'}</span>
                    </button>
                    {filePreview && (
                      <button
                        type="button"
                        className="ax-btn ax-btn--ghost ax-btn--sm"
                        onClick={() => {
                          setLightFile(null);
                          setFilePreview(null);
                        }}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  {errors.light_file && (
                    <div className="ax-field-feedback ax-field-feedback--error">{errors.light_file}</div>
                  )}
                </div>

                {/* Photo 2: light_file2 */}
                <div className={`ula-photo-card ${filePreview2 || existingImageUrl2 ? 'is-valid' : errors.light_file2 ? 'is-invalid' : ''}`}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>
                      Light Installation Photo 2 {!isEditMode && <span style={{ color: 'var(--ax-danger-500)' }}>*</span>}
                    </span>
                    <p style={{ margin: '2px 0 10px', fontSize: 11, color: 'var(--ax-text-muted)' }}>
                      Close-up photo of battery box & serial tag
                    </p>
                  </div>

                  {(filePreview2 || existingImageUrl2) && (
                    <div style={{ position: 'relative', width: '100%', height: 140, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--ax-border)' }}>
                      <img
                        src={filePreview2 || existingImageUrl2!}
                        alt="Photo 2 Preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                  )}

                  <input
                    ref={fileInputRef2}
                    type="file"
                    accept="image/*,application/pdf"
                    style={{ display: 'none' }}
                    onChange={(e) => handleFileChange(e, true)}
                  />

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      className="ax-btn ax-btn--secondary ax-btn--sm"
                      style={{ flex: 1 }}
                      onClick={() => fileInputRef2.current?.click()}
                    >
                      {ICON_CAMERA}
                      <span>{filePreview2 || existingImageUrl2 ? 'Change Photo' : 'Select Photo'}</span>
                    </button>
                    {filePreview2 && (
                      <button
                        type="button"
                        className="ax-btn ax-btn--ghost ax-btn--sm"
                        onClick={() => {
                          setLightFile2(null);
                          setFilePreview2(null);
                        }}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  {errors.light_file2 && (
                    <div className="ax-field-feedback ax-field-feedback--error">{errors.light_file2}</div>
                  )}
                </div>
              </div>

              <hr className="ula-section-divider" />
            </div>

            {/* Section 6: Remarks */}
            <div className="ula-section-block">
              <div className="ula-section-header">
                <div className="ula-section-title-wrap">
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--ax-text-muted)' }}>
                    6. Inspection & Installation Remarks
                  </h4>
                </div>
              </div>

              <div className="ax-float">
                <textarea
                  id="remarks"
                  className="ax-float__input"
                  placeholder=" "
                  value={form.remarks}
                  onChange={(e) => setField('remarks', e.target.value)}
                />
                <label htmlFor="remarks" className="ax-float__label">Remarks (Optional)</label>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Bottom Submission Bar */}
        <div className="ula-form-sticky-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              {isEditMode ? 'Editing Installation' : 'New Light Installation'}
            </span>
            {siteDetail && (
              <span className="ax-badge ax-badge--soft ax-badge--accent ax-badge--pill">
                #{siteDetail.unique_id || siteDetail.id}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              className="ax-btn ax-btn--ghost"
              onClick={resetForm}
              disabled={submitting}
            >
              Reset Form
            </button>
            <button
              type="submit"
              className="ax-btn ax-btn--primary"
              disabled={submitting}
            >
              {submitting ? 'Submitting to Server…' : isEditMode ? 'Update Installation' : 'Submit Light Installation'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default Punjab_Installation_SSL_InstallLight;
