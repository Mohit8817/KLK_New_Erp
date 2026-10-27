<<<<<<< HEAD
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
=======
import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
>>>>>>> f49923685403717f9e19cbf9dfbdf409606a2966
import { PageHead } from '../../../../shell/PageHead';
import {
  biharSslInstallationService,
  getCompanyId,
  type SslLightDropdownItem,
  type SslLightDetail,
} from '../../bihar-services';
import { SkeletonLine, SkeletonRect } from '../../../../../common/skeletons/SkeletonPrimitives';
<<<<<<< HEAD
import { useAuth } from '../../../../../context/AuthContext';
import authService from '../../../../../services/authService';

/* Same unified single-card design as ULA Installation form */
const ULA_STYLE_CSS = `
.ula-inst-form .ax-card { border: 1px solid var(--ax-border); border-radius: var(--ax-radius-xl); background: var(--ax-surface-solid); box-shadow: var(--ax-shadow-sm); overflow: hidden; }
.ula-inst-form .ax-card__header { padding: var(--ax-space-5) var(--ax-space-6); border-bottom: 1px solid var(--ax-border-subtle); background: var(--ax-surface-subtle); display: flex; flex-direction: column; gap: var(--ax-space-4); }
.ula-inst-form .ax-card__body { padding: var(--ax-space-6); }

.ula-section-pills { display: flex; gap: var(--ax-space-2); overflow-x: auto; padding-bottom: 4px; scrollbar-width: thin; }
.ula-section-pill-btn { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: var(--ax-radius-pill); font-size: var(--ax-text-xs); font-weight: 500; white-space: nowrap; background: var(--ax-surface-solid); border: 1px solid var(--ax-border); color: var(--ax-text); cursor: pointer; transition: all var(--ax-motion-fast) var(--ax-ease-standard); }
.ula-section-pill-btn:hover { border-color: var(--ax-accent); color: var(--ax-accent); background: color-mix(in srgb, var(--ax-accent) 6%, var(--ax-surface-solid)); }
.ula-section-pill-btn .pill-num { width: 18px; height: 18px; border-radius: 50%; background: var(--ax-surface-subtle); display: inline-flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; }

.ula-section-block { padding-top: var(--ax-space-2); }
.ula-section-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: var(--ax-space-2); margin-bottom: var(--ax-space-5); padding-bottom: var(--ax-space-3); border-bottom: 1px solid var(--ax-border-subtle); }
.ula-section-title-wrap { display: flex; flex-direction: column; gap: 4px; }
.ula-section-divider { border: 0; border-top: 1px dashed var(--ax-border); margin: var(--ax-space-8) 0 var(--ax-space-6); }

.ax-float { position: relative; width: 100%; }
.ax-float__input { width: 100%; height: 46px; padding: 12px 14px 4px 14px; font-size: var(--ax-text-sm); background: var(--ax-surface-solid); border: 1px solid var(--ax-border); border-radius: var(--ax-radius-md); color: var(--ax-text); outline: none; transition: border-color var(--ax-motion-fast) var(--ax-ease-standard), box-shadow var(--ax-motion-fast) var(--ax-ease-standard); }
textarea.ax-float__input { height: auto; min-height: 84px; padding-top: 20px; resize: vertical; }
.ax-float__input::placeholder { color: transparent; }
.ax-float__input:focus { border-color: var(--ax-accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--ax-accent) 20%, transparent); }
.ax-float__input:disabled { opacity: .6; cursor: not-allowed; }
.ax-float__label { position: absolute; inset-inline-start: 12px; top: 23px; transform: translateY(-50%); margin: 0; padding: 0 4px; font-size: var(--ax-text-sm); color: var(--ax-text-subtle); background: var(--ax-surface-solid); border-radius: var(--ax-radius-xs); pointer-events: none; transition: top var(--ax-motion-fast) var(--ax-ease-standard), font-size var(--ax-motion-fast) var(--ax-ease-standard), color var(--ax-motion-fast) var(--ax-ease-standard); z-index: 2; white-space: nowrap; max-width: calc(100% - 24px); overflow: hidden; text-overflow: ellipsis; }
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
.ax-field-feedback--success { color: var(--ax-success-500); }

.ula-form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--ax-space-4); }
@media (min-width: 1024px) { .ula-form-grid--3col { grid-template-columns: repeat(3, 1fr); } }
.ula-form-col-span-full { grid-column: 1 / -1; }

.ula-site-info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: var(--ax-space-3); }
@media (min-width: 1024px) { .ula-site-info-grid { grid-template-columns: repeat(4, 1fr); } }
.ula-site-info-card { display: flex; flex-direction: column; gap: 4px; min-width: 0; padding: var(--ax-space-3) var(--ax-space-4); background: var(--ax-surface-solid); border: 1px solid var(--ax-border); border-radius: var(--ax-radius-lg); }
.ula-site-info-card__label { font-size: var(--ax-text-2xs); font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: var(--ax-text-muted); }
.ula-site-info-card__value { font-size: var(--ax-text-base); font-weight: 600; color: var(--ax-text-strong); overflow-wrap: anywhere; }

.ula-photo-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: var(--ax-space-4); }
.ula-photo-card { border: 1px solid var(--ax-border); border-radius: var(--ax-radius-lg); padding: var(--ax-space-4); background: var(--ax-surface-solid); display: flex; flex-direction: column; justify-content: space-between; gap: var(--ax-space-3); min-height: 170px; transition: border-color var(--ax-motion-fast) var(--ax-ease-standard); }
.ula-photo-card.is-valid { border-color: var(--ax-success-500); }
.ula-photo-card.is-invalid { border-color: var(--ax-danger-500); }
.ula-photo-thumbs { display: flex; flex-wrap: wrap; gap: var(--ax-space-2); }
.ula-photo-thumb { position: relative; width: 52px; height: 52px; border-radius: var(--ax-radius-sm); overflow: hidden; border: 1px solid var(--ax-border); cursor: pointer; }
.ula-photo-thumb img { width: 100%; height: 100%; object-fit: cover; }
.ula-photo-thumb__remove { position: absolute; top: 2px; right: 2px; width: 16px; height: 16px; border-radius: 50%; border: 0; padding: 0; display: flex; align-items: center; justify-content: center; cursor: pointer; background: var(--ax-surface-solid); color: var(--ax-text-strong); box-shadow: var(--ax-shadow-sm); }

.ula-form-sticky-bar { position: sticky; bottom: var(--ax-space-4); z-index: 30; margin-top: var(--ax-space-6); padding: var(--ax-space-3) var(--ax-space-5); background: var(--ax-surface-solid); border: 1px solid var(--ax-border); border-radius: var(--ax-radius-xl); box-shadow: var(--ax-shadow-lg); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--ax-space-3); backdrop-filter: blur(12px); }
`;

const MAX_FILE = 2 * 1024 * 1024;
const iconProps = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };
const ICON_CROSSHAIR = (<svg className="ax-btn__icon" {...iconProps}><circle cx="12" cy="12" r="10" /><line x1="22" y1="12" x2="18" y2="12" /><line x1="6" y1="12" x2="2" y2="12" /><line x1="12" y1="6" x2="12" y2="2" /><line x1="12" y1="22" x2="12" y2="18" /></svg>);
const ICON_CAMERA = (<svg className="ax-btn__icon" {...iconProps}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>);
const ICON_GALLERY = (<svg className="ax-btn__icon" {...iconProps}><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>);
const ICON_CHECK = (<svg style={{ width: 14, height: 14 }} {...iconProps}><polyline points="20 6 9 17 4 12" /></svg>);
const ICON_DOT = (<svg style={{ width: 14, height: 14 }} {...iconProps}><circle cx="12" cy="12" r="9" /></svg>);
const ICON_X = (<svg style={{ width: 10, height: 10 }} {...iconProps}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>);

interface FieldStatusProps { className: string; isValid: boolean; isInvalid: boolean; }

const formatInfo = (v: unknown): string => {
  if (v === null || v === undefined) return 'N/A';
  const s = String(v).trim();
  return s === '' || s === '0' ? 'N/A' : s;
};

type FormState = {
  wardNo: string; poleNo: string; beneficiaryName: string; contactNo: string;
  uuidNo: string; batteryNo: string; panelNo: string; lightNo: string;
  latitude: string; longitude: string; remarks: string;
};
const EMPTY_FORM: FormState = {
  wardNo: '', poleNo: '', beneficiaryName: '', contactNo: '', uuidNo: '', batteryNo: '',
  panelNo: '', lightNo: '', latitude: '', longitude: '', remarks: '',
};
const MESSAGES: Record<string, string> = {
  unique_id: 'Please select a Unique ID.',
  wardNo: 'Ward Number is required.',
  poleNo: 'Pole Number is required.',
  beneficiaryName: 'Beneficiary Name is required.',
  contactNo: 'Contact Number is required.',
  uuidNo: 'UUID No. is required.',
  batteryNo: 'Battery Number is required.',
  panelNo: 'Panel Number is required.',
  lightNo: 'Light Number is required.',
  latitude: 'Latitude is required. Please click "Retry GPS Lock".',
  longitude: 'Longitude is required. Please click "Retry GPS Lock".',
  light_file: 'Light Image is required.',
};
const TEXT_KEYS = ['wardNo', 'poleNo', 'beneficiaryName', 'contactNo', 'uuidNo', 'batteryNo', 'panelNo', 'lightNo', 'latitude', 'longitude'] as const;
const ORDER = ['unique_id', 'wardNo', 'poleNo', 'beneficiaryName', 'contactNo', 'uuidNo', 'batteryNo', 'panelNo', 'lightNo', 'latitude', 'longitude', 'light_file'];

export function Bihar_Installation_SSL_InstallLight() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editIdParam = searchParams.get('id') || searchParams.get('ssl_id') || searchParams.get('unique_id');
  const isEditMode = searchParams.get('edit') === 'true' || Boolean(editIdParam);

  const { user } = useAuth();
  const loginVendorName = useMemo(() => {
    const session = authService.getSession();
    const raw = authService.getRawResponse();
    const candidate =
      user?.vendor_name ||
      user?.vendor ||
      user?.name ||
      session?.vendor_name ||
      session?.vendor ||
      session?.name ||
      raw?.vendor?.name ||
      raw?.user?.name ||
      raw?.data?.vendor?.name ||
      raw?.data?.user?.name ||
      raw?.data?.name ||
      '';
    return candidate ? String(candidate).trim() : '';
  }, [user]);
  const [dropdownLoading, setDropdownLoading] = useState(true);
  const [lightOptions, setLightOptions] = useState<SslLightDropdownItem[]>([]);
  const [selectedUniqueId, setSelectedUniqueId] = useState('');

  const [detailLoading, setDetailLoading] = useState(false);
  const [siteDetail, setSiteDetail] = useState<SslLightDetail | null>(null);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [lightFile, setLightFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [modalImage, setModalImage] = useState<string | null>(null);

  const [gpsDetecting, setGpsDetecting] = useState(false);
  const [gpsStatusMsg, setGpsStatusMsg] = useState<string | null>(null);

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const validate = (name: string, value: string): string => (value.trim() ? '' : MESSAGES[name] || 'This field is required.');

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
    setExistingImageUrl(null);
    setTouched({});
    setErrors({});
    setSubmitted(false);
    setGpsStatusMsg(null);
  }, []);

  // Dropdown list
=======

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
>>>>>>> f49923685403717f9e19cbf9dfbdf409606a2966
  useEffect(() => {
    let active = true;
    (async () => {
      setDropdownLoading(true);
      try {
        const list = await biharSslInstallationService.fetchLightNames();
<<<<<<< HEAD
        if (active) setLightOptions(Array.isArray(list) ? list : []);
=======
        if (active) {
          setLightOptions(Array.isArray(list) ? list : []);
        }
>>>>>>> f49923685403717f9e19cbf9dfbdf409606a2966
      } catch (err) {
        console.error('[InstallLight] fetch dropdown error:', err);
      } finally {
        if (active) setDropdownLoading(false);
      }
    })();
<<<<<<< HEAD
    return () => { active = false; };
  }, []);

  // Light details on select
  const handleSelectLight = useCallback(async (uid: string) => {
    setSelectedUniqueId(uid);
    setExistingImageUrl(null);
    setSuccessMsg(null);
    setErrorMsg(null);
    setErrors((p) => ({ ...p, unique_id: uid ? '' : MESSAGES.unique_id }));

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
        setForm((p) => ({
          ...p,
          wardNo: detail.ward_no || '',
          poleNo: detail.pole_no || '',
          beneficiaryName: detail.beneficiary_name || '',
          contactNo: detail.contact_no || '',
          uuidNo: detail.uuid_no || '',
          batteryNo: detail.battery_serial_no || '',
          panelNo: detail.module_no || '',
          lightNo: detail.light_no || '',
          latitude: detail.latitude || '',
          longitude: detail.longitude || '',
        }));
        setErrors({});
      }
    } catch (err) {
      console.error('[InstallLight] fetch detail error:', err);
      setSiteDetail(null);
      setErrorMsg('Could not fetch light details.');
    } finally {
      setDetailLoading(false);
    }
  }, [resetForm]);

  // Auto-load details if editIdParam is provided via navigation
  useEffect(() => {
    if (!editIdParam) return;
    let active = true;
    (async () => {
      setDetailLoading(true);
      setSelectedUniqueId(String(editIdParam));
      try {
        const [editData, detail] = await Promise.all([
          biharSslInstallationService.getInstalledLightEdit(editIdParam).catch(() => null),
          biharSslInstallationService.fetchLightDetail(editIdParam).catch(() => null),
        ]);
        if (!active) return;
        const d: any = editData || detail;
        if (d) {
          setSiteDetail(d);
          setForm({
            wardNo: d.ward_no || '',
            poleNo: d.pole_no || '',
            beneficiaryName: d.beneficiary_name || '',
            contactNo: d.contact_no || '',
            uuidNo: d.uuid_no || '',
            batteryNo: d.battery_serial_no || d.battery_no || '',
            panelNo: d.module_no || d.panel_no || '',
            lightNo: d.light_no || '',
            latitude: d.latitude ? String(d.latitude) : '',
            longitude: d.longitude ? String(d.longitude) : '',
            remarks: d.remark || d.inst_remark || '',
          });
          const img = d.light_image || d.light_file;
          if (img && typeof img === 'string') {
            setExistingImageUrl(img);
          }
          setLightOptions((prev) => {
            if (prev.some((o) => String(o.id) === String(editIdParam))) return prev;
            return [{ id: Number(editIdParam) || (editIdParam as any), unique_id: d.unique_id || d.uid || `Site #${editIdParam}` }, ...prev];
          });
          setErrors({});
        }
      } catch (err) {
        console.error('[InstallLight] fetch edit details error:', err);
      } finally {
        if (active) setDetailLoading(false);
      }
    })();
    return () => { active = false; };
  }, [editIdParam]);

  // GPS
  const handleDetectGps = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsStatusMsg('Geolocation is not supported by your browser.');
      return;
    }
    setGpsDetecting(true);
    setGpsStatusMsg('Locating coordinates via satellite GPS…');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        setForm((p) => ({ ...p, latitude: lat, longitude: lng }));
        setErrors((p) => ({ ...p, latitude: '', longitude: '' }));
        setGpsDetecting(false);
        setGpsStatusMsg(`GPS Lock Acquired (Accuracy: ±${Math.round(pos.coords.accuracy || 5)}m)`);
      },
      (err) => {
        setGpsDetecting(false);
        setGpsStatusMsg(`Unable to lock GPS: ${err.message}. Please enter manually or retry.`);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  }, []);

  // Photo
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE) {
      alert(`File "${file.name}" exceeds the 2 MB limit.`);
      e.target.value = '';
      return;
    }
    if (filePreview) URL.revokeObjectURL(filePreview);
    setLightFile(file);
    setFilePreview(URL.createObjectURL(file));
    setErrors((p) => ({ ...p, light_file: '' }));
    e.target.value = '';
  };
  const removeFile = () => {
    if (filePreview) URL.revokeObjectURL(filePreview);
    setLightFile(null);
    setFilePreview(null);
    setExistingImageUrl(null);
  };

  const scrollToSection = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Progress
  const values: Record<string, string> = { unique_id: selectedUniqueId, ...form };
  const totalRequired = 1 + TEXT_KEYS.length + 1;
  const completedRequired =
    (selectedUniqueId ? 1 : 0) + TEXT_KEYS.filter((k) => form[k].trim() !== '').length + (lightFile ? 1 : 0);
  const progressPercent = Math.round((completedRequired / totalRequired) * 100);
  const errorCount = Object.keys(errors).filter((k) => errors[k]).length;

  const siteInfoItems = useMemo(() => {
    const d = (siteDetail || {}) as Record<string, unknown>;
    return [
      { label: 'Vendor Name', value: selectedUniqueId ? formatInfo(loginVendorName || d.vendor || d.vendor_name) : 'N/A' },
      { label: 'State', value: formatInfo(d.state) },
      { label: 'Phase', value: formatInfo(d.phase) },
      { label: 'District', value: formatInfo(d.district) },
      { label: 'Block', value: formatInfo(d.block) },
      { label: 'Panchayat', value: formatInfo(d.panchyat || d.panchayat) },
      { label: 'Work Order No.', value: formatInfo(d.wo_no) },
      { label: 'Work Order Received', value: formatInfo(d.wo_received) },
      { label: 'Ward No.', value: formatInfo(d.ward_no) },
      { label: 'Pole No.', value: formatInfo(d.pole_no) },
      { label: 'Beneficiary Name', value: formatInfo(d.beneficiary_name) },
      { label: 'Contact No.', value: formatInfo(d.contact_no) },
      { label: 'Latitude', value: formatInfo(d.latitude) },
      { label: 'Longitude', value: formatInfo(d.longitude) },
      { label: 'Luminary No.', value: formatInfo(d.luminary_no) },
      { label: 'Sim No.', value: formatInfo(d.sim_no) },
      { label: 'Battery Serial No.', value: formatInfo(d.battery_serial_no) },
      { label: 'Module No.', value: formatInfo(d.module_no) },
      { label: 'Supply', value: formatInfo(d.supply) },
      { label: 'Material Inspection', value: formatInfo(d.material_inspection) },
      { label: 'Installation', value: formatInfo(d.installation) },
      { label: 'Date of Installation', value: formatInfo(d.date_of_installation) },
      { label: 'Installed By', value: formatInfo(d.installed_by) },
      { label: 'Inspected by Breda', value: formatInfo(d.inspected_by_breda) },
    ];
  }, [siteDetail, selectedUniqueId, loginVendorName]);

  // Submit
=======
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
>>>>>>> f49923685403717f9e19cbf9dfbdf409606a2966
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
<<<<<<< HEAD
    setSubmitted(true);

    const newErrors: Record<string, string> = {};
    if (!selectedUniqueId) newErrors.unique_id = MESSAGES.unique_id;
    TEXT_KEYS.forEach((k) => {
      const err = validate(k, form[k]);
      if (err) newErrors[k] = err;
    });
    if (!lightFile && !(isEditMode && existingImageUrl)) newErrors.light_file = MESSAGES.light_file;
    setErrors(newErrors);

    const firstKey = ORDER.find((k) => newErrors[k]);
    if (firstKey) {
      setErrorMsg(newErrors[firstKey]);
      setTimeout(() => {
        const el = document.querySelector('.ula-inst-form .is-invalid') as HTMLElement | null;
        if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.focus?.(); }
        else window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 50);
=======
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
>>>>>>> f49923685403717f9e19cbf9dfbdf409606a2966
      return;
    }

    setSubmitting(true);
    try {
<<<<<<< HEAD
      const fd = new FormData();
      fd.append('ssl_id', selectedUniqueId);
      fd.append('uuid_no', form.uuidNo.trim());
      fd.append('light_no', form.lightNo.trim());
      fd.append('ward_no', form.wardNo.trim());
      fd.append('pole_no', form.poleNo.trim());
      fd.append('module_no', form.panelNo.trim());
      fd.append('battery_serial_no', form.batteryNo.trim());
      fd.append('latitude', form.latitude.trim());
      fd.append('longitude', form.longitude.trim());
      fd.append('beneficiary_name', form.beneficiaryName.trim());
      fd.append('contact_no', form.contactNo.trim());
      if (loginVendorName) {
        fd.append('vendor_name', loginVendorName);
        fd.append('vendor', loginVendorName);
      }
      if (form.remarks.trim()) fd.append('remark', form.remarks.trim());
      if (lightFile) fd.append('light_file', lightFile);

      let res: { status: boolean; message: string };
      if (isEditMode) {
        try {
          res = await biharSslInstallationService.updateInstalledLight(fd);
        } catch {
          res = await biharSslInstallationService.installLightStore(fd);
        }
      } else {
        res = await biharSslInstallationService.installLightStore(fd);
      }
      setSuccessMsg(res.message || (isEditMode ? 'Installation details updated successfully.' : 'Details saved successfully.'));
      window.scrollTo({ top: 0, behavior: 'smooth' });

      if (!isEditMode) {
        const updatedList = await biharSslInstallationService.fetchLightNames();
      setLightOptions(Array.isArray(updatedList) ? updatedList : []);

      setSelectedUniqueId('');
      setSiteDetail(null);
      resetForm();
      }
    } catch (err: any) {
      console.error('[InstallLight] submit error:', err);
      setErrorMsg(err?.message || 'Failed to submit installation details.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
=======
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
>>>>>>> f49923685403717f9e19cbf9dfbdf409606a2966
    } finally {
      setSubmitting(false);
    }
  };

<<<<<<< HEAD
  const fi = (name: keyof FormState, label: string, placeholder: string, extra?: { type?: string; maxLength?: number }) => (
    <FloatingInput
      id={`il_${name}`} label={label} required placeholder={placeholder}
      type={extra?.type} maxLength={extra?.maxLength}
      value={form[name]} onChange={(v) => setField(name, v)} onBlur={() => handleBlur(name)}
      status={getStatus(name, form[name])} error={errors[name]}
    />
  );

  return (
    <div className="ax-page solar-erp-page ula-inst-form">
      <style>{ULA_STYLE_CSS}</style>

      <PageHead
        title={isEditMode ? "Edit Installed Light" : "Install Light"}
        subtitle={isEditMode ? `Update installation verification form for Bihar SSL Site #${selectedUniqueId || editIdParam || ''}` : "Complete installation verification form for assigned Bihar SSL sites"}
=======
  return (
    <div className="ax-page solar-erp-page">
      <style>{FORM_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="Install Light"
        subtitle="Complete installation verification form for assigned Bihar SSL sites"
>>>>>>> f49923685403717f9e19cbf9dfbdf409606a2966
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Bihar' },
          { label: 'Installation' },
          { label: 'SSL', href: '/v/ssl/installation-dashboard' },
<<<<<<< HEAD
          { label: isEditMode ? 'Edit Light' : 'Install Light' },
        ]}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {isEditMode && (
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--sm"
                onClick={() => navigate('/v/ssl/view-ssl-complete-site#completed')}
                style={{ fontWeight: 600 }}
              >
                ← Back to Details
              </button>
            )}
      
=======
          { label: 'Install Light' },
        ]}
        actions={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="ax-badge ax-badge--soft ax-badge--accent ax-badge--pill" style={{ fontWeight: 600 }}>
              Company ID: {getCompanyId()}
            </span>
>>>>>>> f49923685403717f9e19cbf9dfbdf409606a2966
          </div>
        }
      />

      {/* Alerts */}
      {successMsg && (
<<<<<<< HEAD
        <div className="ax-alert ax-alert--success" role="status" style={{ marginBottom: 'var(--ax-space-6)' }}>
          <span className="ax-alert__icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5l10 -10" /></svg></span>
          <div className="ax-alert__content"><h3 className="ax-alert__title" style={{ fontSize: 'var(--ax-text-base)', fontWeight: 600 }}>{successMsg}</h3></div>
        </div>
      )}
      {errorMsg && (
        <div className="ax-alert ax-alert--danger" role="alert" style={{ marginBottom: 'var(--ax-space-6)' }}>
          <span className="ax-alert__icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4" /><path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0" /><path d="M12 16h.01" /></svg></span>
          <div className="ax-alert__content">
            <h4 className="ax-alert__title" style={{ fontWeight: 600 }}>{errorMsg}</h4>
            {submitted && errorCount > 1 && (
              <p className="ax-alert__message" style={{ margin: '4px 0 0' }}>{errorCount} fields need attention before this installation can be submitted.</p>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="ax-card">
          <div className="ax-card__header">
            <div>
              <h2 className="ax-card__title" style={{ margin: 0 }}>Install Light Details</h2>
              <p className="ax-card__subtitle" style={{ margin: '4px 0 0' }}>
                Site selection, light details, GPS and photograph in one card. Fields marked <span style={{ color: 'var(--ax-danger-500)' }}>*</span> are mandatory.
              </p>
            </div>
            <div className="ula-section-pills" role="navigation" aria-label="Jump to section">
              {[
                { id: 'il-sec-1', num: '1', title: 'Unique ID' },
                { id: 'il-sec-2', num: '2', title: 'Light Details' },
                { id: 'il-sec-3', num: '3', title: 'GPS' },
                { id: 'il-sec-4', num: '4', title: 'Photo & Remark' },
              ].map((s) => (
                <button key={s.id} type="button" onClick={() => scrollToSection(s.id)} className="ula-section-pill-btn">
                  <span className="pill-num">{s.num}</span>
                  <span>{s.title}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="ax-card__body">
            {/* Section 1 */}
            <div id="il-sec-1" className="ula-section-block">
              <SectionHeader num="1" total="4" title="Unique ID" subtitle="Select the assigned site to fetch its information." />
              <div className="ula-form-grid">
                <div>
                  {dropdownLoading ? (
                    <SkeletonRect width="100%" height={46} borderRadius="8px" />
                  ) : (
                    <FloatingSelect
                      id="il_unique_id"
                      label={detailLoading ? "Unique ID (Fetching site details…)" : "Unique ID"}
                      required
                      placeholder="Select Unique ID"
                      value={selectedUniqueId}
                      options={lightOptions.map((o) => ({ value: String(o.id), label: o.unique_id || `Site #${o.id}` }))}
                      onChange={handleSelectLight}
                      onBlur={() => handleBlur('unique_id')}
                      status={getStatus('unique_id', selectedUniqueId)}
                      error={errors.unique_id}
                    />
                  )}
                </div>
                <div>
                  <div className="ax-float ax-float--select">
                    <input
                      id="il_vendor_name"
                      className="ax-float__input"
                      style={{
                        background: 'var(--ax-surface-subtle)',
                        cursor: 'default',
                        fontWeight: 600,
                        color: selectedUniqueId ? 'var(--ax-text-strong)' : 'var(--ax-text-muted)'
                      }}
                      readOnly
                      value={selectedUniqueId ? (loginVendorName) : ''}
                      placeholder=" "
                    />
                    <label className="ax-float__label" htmlFor="il_vendor_name">
                      Vendor Name
                    </label>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 'var(--ax-space-4)' }}>
                <p style={{ margin: '0 0 var(--ax-space-3)', fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>
                  {selectedUniqueId
                    ? 'Bihar SSL site information. Confirm this is the correct site before proceeding.'
                    : 'Select a Unique ID to fetch Bihar SSL site information.'}
                </p>
                {selectedUniqueId && (
                  detailLoading ? (
                    <div className="ula-site-info-grid">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="ula-site-info-card">
                          <SkeletonLine width="50%" height="0.8em" style={{ marginBottom: 6 }} />
                          <SkeletonRect width="100%" height={20} borderRadius="4px" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="ula-site-info-grid">
                      {siteInfoItems.map((item) => (
                        <div key={item.label} className="ula-site-info-card">
                          <span className="ula-site-info-card__label">{item.label}</span>
                          <span className="ula-site-info-card__value">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            </div>

            <hr className="ula-section-divider" />

            {/* Section 2 */}
            <div id="il-sec-2" className="ula-section-block">
              <SectionHeader num="2" total="4" title="Light Details" subtitle="Beneficiary, pole location and equipment serial numbers." />
              <div className="ula-form-grid ula-form-grid--3col">
                {fi('wardNo', 'Ward Number', 'Enter Ward Number')}
                {fi('poleNo', 'Pole Number', 'Enter Pole Number')}
                {fi('beneficiaryName', 'Beneficiary Name', 'Enter Beneficiary Name')}
                {fi('contactNo', 'Beneficiary Contact', 'Enter Contact Number', { type: 'tel', maxLength: 15 })}
                {fi('uuidNo', 'UUID No.', 'Enter UUID Number')}
                {fi('batteryNo', 'Battery Number', 'Enter Battery Number')}
                {fi('panelNo', 'Panel Number', 'Enter Panel Number')}
                {fi('lightNo', 'Light Number', 'Enter Light Number')}
              </div>
            </div>

            <hr className="ula-section-divider" />

            {/* Section 3 */}
            <div id="il-sec-3" className="ula-section-block">
              <SectionHeader num="3" total="4" title="GPS" subtitle="Enter coordinates manually or lock the current location." />
              <div className="ula-form-grid ula-form-grid--3col">
                {fi('latitude', 'Latitude', 'e.g. 25.6093')}
                {fi('longitude', 'Longitude', 'e.g. 85.1376')}
                <div>
                  <button type="button" className="ax-btn ax-btn--secondary" onClick={handleDetectGps} disabled={gpsDetecting} style={{ width: '100%', height: 46 }}>
                    {gpsDetecting ? <span className="ax-spinner" style={{ width: 16, height: 16 }} /> : ICON_CROSSHAIR}
                    <span className="ax-btn__label">{gpsDetecting ? 'Locking GPS…' : 'Retry GPS Lock'}</span>
                  </button>
                </div>
                {gpsStatusMsg && (
                  <div>
                    <span style={{ fontSize: 'var(--ax-text-xs)', fontWeight: 500, color: form.latitude && form.longitude ? 'var(--ax-success-500)' : 'var(--ax-text-muted)' }}>
                      {form.latitude && form.longitude ? '✓ ' : ''}{gpsStatusMsg}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <hr className="ula-section-divider" />

            {/* Section 4 */}
            <div id="il-sec-4" className="ula-section-block">
              <SectionHeader
                num="4" total="4" title="Photo & Remark"
                subtitle={`${lightFile ? 1 : 0} of 1 photo captured. Use Camera for a fresh photo on site, or Gallery for an existing one. Max 2MB.`}
              />
              <div className="ula-photo-grid">
                <PhotoCard
                  title="Light Image" hint={isEditMode && existingImageUrl ? "Current photo attached. Upload new photo to replace." : "Clear photo of the installed light."}
                  previews={filePreview ? [filePreview] : existingImageUrl ? [existingImageUrl] : []}
                  count={lightFile || existingImageUrl ? 1 : 0} max={1}
                  submitted={submitted} error={errors.light_file}
                  onFiles={handleFileChange} onRemove={removeFile}
                  onPreview={(url) => setModalImage(url)}
                />
                <div style={{ gridColumn: '1 / -1' }}>
                  <FloatingTextarea id="il_remarks" label="Remarks" placeholder="Enter Remarks..." value={form.remarks} onChange={(v) => setField('remarks', v)} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky action footer */}
        <div className="ula-form-sticky-bar">
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)', alignItems: 'center' }}>
            <span className="ax-badge ax-badge--soft ax-badge--primary ax-badge--pill">
              Required: {completedRequired} / {totalRequired} ({progressPercent}%)
            </span>
            {submitted && errorCount > 0 && (
              <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-danger-500)', fontWeight: 500 }}>Missing mandatory fields</span>
            )}
          </div>
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)' }}>
            <button
              type="button" className="ax-btn ax-btn--secondary" disabled={submitting}
              onClick={() => {
                if (window.confirm('Reset the form? Any unsaved inputs will be lost.')) {
                  setSelectedUniqueId('');
                  setSiteDetail(null);
                  resetForm();
                }
              }}
            >
              <span className="ax-btn__label">Reset Form</span>
            </button>
            <button type="submit" disabled={submitting} className="ax-btn ax-btn--primary" style={{ minWidth: 220 }}>
              {submitting ? (
                <>
                  <span className="ax-spinner" style={{ width: 16, height: 16, marginRight: 8 }} />
                  <span className="ax-btn__label">{isEditMode ? "Updating…" : "Submitting…"}</span>
                </>
              ) : (
                <>
                  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5l10 -10" /></svg>
                  <span className="ax-btn__label">{isEditMode ? "Update Installation Details" : "Submit Installation Details"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Photo lightbox */}
      {modalImage && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--ax-space-4)' }}
          onClick={() => setModalImage(null)}
        >
          <div className="ax-card" style={{ position: 'relative', padding: 'var(--ax-space-4)', maxWidth: 640, width: '90%' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--ax-space-3)' }}>
              <h4 style={{ margin: 0, fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-strong)', fontWeight: 600 }}>Light Image</h4>
              <button type="button" className="ax-btn ax-btn--ghost ax-btn--icon ax-btn--sm" onClick={() => setModalImage(null)} aria-label="Close preview">✕</button>
            </div>
            <img src={modalImage} alt="Light preview" style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 'var(--ax-radius-md)', display: 'block', margin: '0 auto' }} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────── Helper components (same pattern as ULA form) ───────── */

function SectionHeader({ num, total, title, subtitle }: { num: string; total: string; title: string; subtitle: string }) {
  return (
    <div className="ula-section-header">
      <div className="ula-section-title-wrap">
        <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', alignItems: 'center' }}>
          <span className="ax-badge ax-badge--soft ax-badge--primary ax-badge--pill" style={{ fontWeight: 600 }}>Section {num} of {total}</span>
          <h3 style={{ fontSize: 'var(--ax-text-base)', fontWeight: 600, margin: 0, color: 'var(--ax-text-strong)' }}>{title}</h3>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>{subtitle}</p>
      </div>
=======
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
>>>>>>> f49923685403717f9e19cbf9dfbdf409606a2966
    </div>
  );
}

const Req = () => <span style={{ color: 'var(--ax-danger-500)', marginLeft: 3 }}>*</span>;

interface FloatingInputProps {
  id: string; label: string; type?: string; required?: boolean; placeholder: string; maxLength?: number;
  value: string; onChange: (val: string) => void; onBlur: () => void; status: FieldStatusProps; error?: string;
}
function FloatingInput({ id, label, type = 'text', required, placeholder, maxLength, value, onChange, onBlur, status, error }: FloatingInputProps) {
  return (
    <div>
      <div className="ax-float">
        <input id={id} type={type} maxLength={maxLength} className={`ax-input ax-float__input ${status.className}`} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} aria-invalid={status.isInvalid} />
        <label className="ax-float__label" htmlFor={id}>{label}{required && <Req />}</label>
      </div>
      <FieldFeedback error={error} isValid={status.isValid} />
    </div>
  );
}

function FloatingTextarea({ id, label, placeholder, value, onChange }: { id: string; label: string; placeholder: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="ax-float">
      <textarea id={id} rows={3} className="ax-input ax-float__input" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
      <label className="ax-float__label" htmlFor={id}>{label}</label>
    </div>
  );
}

interface FloatingSelectProps {
  id: string; label: string; required?: boolean; placeholder?: string; value: string;
  options: { value: string; label: string }[]; disabled?: boolean;
  onChange: (val: string) => void; onBlur: () => void; status: FieldStatusProps; error?: string;
}
function FloatingSelect({ id, label, required, placeholder = '-- Select --', value, options, disabled, onChange, onBlur, status, error }: FloatingSelectProps) {
  return (
    <div>
      <div className="ax-float ax-float--select">
        <select id={id} className={`ax-select ax-float__input ${status.className}`} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} aria-invalid={status.isInvalid}>
          <option value="">{placeholder}</option>
          {options.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
        </select>
        <label className="ax-float__label" htmlFor={id}>{label}{required && <Req />}</label>
      </div>
      <FieldFeedback error={error} isValid={status.isValid} />
    </div>
  );
}

interface PhotoCardProps {
  title: string; hint: string; previews: string[]; count: number; max: number; submitted: boolean; error?: string;
  onFiles: (e: ChangeEvent<HTMLInputElement>) => void; onRemove: (index: number) => void; onPreview: (url: string, index: number) => void;
}
function PhotoCard({ title, hint, previews, count, submitted, error, onFiles, onRemove, onPreview }: PhotoCardProps) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const stateClass = error ? 'is-invalid' : count > 0 ? 'is-valid' : '';
  return (
    <div className={`ula-photo-card ${stateClass}`}>
      <div>
        <h4 style={{ margin: '0 0 2px 0', fontSize: 'var(--ax-text-sm)', fontWeight: 600, color: 'var(--ax-text-strong)' }}>{title}<Req /></h4>
        <p style={{ margin: '0 0 var(--ax-space-3) 0', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>{hint}</p>
        <input type="file" ref={cameraRef} accept="image/*" capture="environment" style={{ display: 'none' }} onChange={onFiles} />
        <input type="file" ref={galleryRef} accept="image/*" style={{ display: 'none' }} onChange={onFiles} />
        <div style={{ display: 'flex', gap: 'var(--ax-space-2)', marginBottom: 'var(--ax-space-3)' }}>
          <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => cameraRef.current?.click()}>
            {ICON_CAMERA}<span className="ax-btn__label">Camera</span>
          </button>
          <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => galleryRef.current?.click()}>
            {ICON_GALLERY}<span className="ax-btn__label">Gallery</span>
          </button>
        </div>
        {previews.length > 0 && (
          <div className="ula-photo-thumbs">
            {previews.map((url, i) => (
              <div key={url} className="ula-photo-thumb" onClick={() => onPreview(url, i)}>
                <img src={url} alt={`${title} ${i + 1}`} />
                <button type="button" className="ula-photo-thumb__remove" onClick={(e) => { e.stopPropagation(); onRemove(i); }} title="Remove photo" aria-label="Remove photo">{ICON_X}</button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--ax-text-xs)' }}>
        {count === 0 ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: submitted || error ? 'var(--ax-danger-500)' : 'var(--ax-text-muted)', fontWeight: 500 }}>{ICON_DOT}Not captured</span>
        ) : (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--ax-success-500)', fontWeight: 600 }}>{ICON_CHECK}Captured</span>
        )}
      </div>
    </div>
  );
}

function FieldFeedback({ error, isValid }: { error?: string; isValid?: boolean }) {
  if (error) {
    return (
      <span className="ax-field-feedback ax-field-feedback--error" role="alert">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 12, height: 12 }}><circle cx="12" cy="12" r="9" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
        {error}
      </span>
    );
  }
  if (isValid) {
    return (
      <span className="ax-field-feedback ax-field-feedback--success">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 12, height: 12 }}><polyline points="20 6 9 17 4 12" /></svg>
        Valid
      </span>
    );
  }
  return <span className="ax-field-feedback" />;
}

export default Bihar_Installation_SSL_InstallLight;



