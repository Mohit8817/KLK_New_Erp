import {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  type FormEvent,
  type ChangeEvent,
  type CSSProperties,
} from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useAuth } from '../../../../../context/AuthContext';
import authService from '../../../../../services/authService';
import {
  upInstallationService,
  type UpSsl18wLightDropdownItem,
  type UpSsl18wLightDetail,
} from '../../up-services';
import { SkeletonLine, SkeletonRect } from '../../../../../common/skeletons/SkeletonPrimitives';
import { CameraBarcodeScannerModal } from './CameraBarcodeScannerModal';
import {
  extractBackendError,
  formatMissingRequiredMsg,
  scrollToFirstError,
} from '../../../common-services/vPortalFormUtils';

// Unified Single-Card Layout matching Bihar SSL Install Light Reference
const SINGLE_CARD_FORM_CSS = `
.ssl-inst-form .ax-card {
  border: 1px solid var(--ax-border, #e2e8f0);
  border-radius: var(--ax-radius-xl, 16px);
  background: var(--ax-surface-solid, #ffffff);
  box-shadow: var(--ax-shadow-sm, 0 1px 3px rgba(0,0,0,0.05));
  overflow: hidden;
}
.ssl-inst-form .ax-card__header {
  padding: var(--ax-space-5, 20px) var(--ax-space-6, 24px);
  border-bottom: 1px solid var(--ax-border-subtle, #f1f5f9);
  background: var(--ax-surface-subtle, #f8fafc);
  display: flex;
  flex-direction: column;
  gap: var(--ax-space-4, 16px);
}
.ssl-inst-form .ax-card__body { padding: var(--ax-space-6, 24px); }

/* Quick Section Nav Pills */
.ssl-section-pills {
  display: flex;
  gap: var(--ax-space-2, 8px);
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: thin;
}
.ssl-section-pill-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 9999px;
  font-size: var(--ax-text-xs, 12px);
  font-weight: 500;
  white-space: nowrap;
  background: var(--ax-surface-solid, #ffffff);
  border: 1px solid var(--ax-border, #cbd5e1);
  color: var(--ax-text, #334155);
  cursor: pointer;
  transition: all 0.15s ease;
}
.ssl-section-pill-btn:hover {
  border-color: #2563eb;
  color: #2563eb;
  background: #eff6ff;
}
.ssl-section-pill-btn .pill-num {
  width: 18px; height: 18px; border-radius: 50%;
  background: var(--ax-surface-subtle, #f1f5f9);
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 700;
}

/* Section Block */
.ssl-section-block { padding-top: var(--ax-space-2, 8px); scroll-margin-top: 80px; }
.ssl-section-header {
  display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap;
  gap: var(--ax-space-2, 8px);
  margin-bottom: var(--ax-space-5, 20px);
  padding-bottom: var(--ax-space-3, 12px);
  border-bottom: 1px solid var(--ax-border-subtle, #f1f5f9);
}
.ssl-section-title-wrap { display: flex; flex-direction: column; gap: 4px; }
.ssl-section-divider {
  border: 0;
  border-top: 1px dashed var(--ax-border, #cbd5e1);
  margin: var(--ax-space-8, 32px) 0 var(--ax-space-6, 24px);
}

/* Floating Label Core */
.ax-float { position: relative; width: 100%; }
.ax-float__input {
  width: 100%;
  height: 46px;
  padding: 12px 14px 4px 14px;
  font-size: var(--ax-text-sm, 13.5px);
  background: var(--ax-surface-solid, #ffffff);
  border: 1px solid var(--ax-border, #cbd5e1);
  border-radius: var(--ax-radius-md, 8px);
  color: var(--ax-text, #1e293b);
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.ax-float__input::placeholder { color: transparent; }
.ax-float__input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px color-mix(in srgb, #2563eb 20%, transparent);
}
.ax-float__input:disabled { opacity: .75; cursor: not-allowed; background: var(--ax-surface-subtle, #f8fafc); }
.ax-float__input.is-invalid { border-color: var(--ax-danger-500, #ef4444) !important; }
.ax-float__input.is-invalid:focus { box-shadow: 0 0 0 3px color-mix(in srgb, #ef4444 24%, transparent) !important; }

.ax-float__label {
  position: absolute;
  inset-inline-start: 12px;
  top: 50%;
  transform: translateY(-50%);
  margin: 0;
  padding: 0 4px;
  font-size: var(--ax-text-sm, 13.5px);
  color: var(--ax-text-subtle, #64748b);
  background: var(--ax-surface-solid, #ffffff);
  border-radius: var(--ax-radius-xs, 4px);
  pointer-events: none;
  transition: top 0.15s ease, font-size 0.15s ease, color 0.15s ease;
  z-index: 2;
  white-space: nowrap;
  max-width: calc(100% - 24px);
  overflow: hidden;
  text-overflow: ellipsis;
}
.ax-float__label.floating,
.ax-float:focus-within .ax-float__label {
  top: 0;
  transform: translateY(-50%);
  font-size: 11px;
  font-weight: 600;
  color: #2563eb;
}
.ax-float__label.has-val:not(.floating) {
  top: 0;
  transform: translateY(-50%);
  font-size: 11px;
  font-weight: 500;
  color: var(--ax-text-muted, #64748b);
}
.ax-float__input.is-invalid + .ax-float__label { color: var(--ax-danger-500, #ef4444) !important; }

.ax-field-feedback {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  font-size: 11px;
  min-height: 16px;
}
.ax-field-feedback--error { color: var(--ax-danger-500, #ef4444); }

/* Responsive Form Grids */
.ssl-form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}
@media (min-width: 1024px) {
  .ssl-form-grid--3col { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .ssl-form-grid--4col { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}

/* Site Info Grid */
.ssl-site-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}
@media (min-width: 1024px) {
  .ssl-site-info-grid { grid-template-columns: repeat(4, 1fr); }
}
.ssl-site-info-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  padding: 10px 14px;
  background: var(--ax-surface-subtle, #f8fafc);
  border: 1px solid var(--ax-border, #e2e8f0);
  border-radius: var(--ax-radius-lg, 10px);
}
.ssl-site-info-card__label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--ax-text-muted, #64748b);
}
.ssl-site-info-card__value {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--ax-text-strong, #1e293b);
  overflow-wrap: anywhere;
}

/* Sticky action footer (outside the card, same as Kusum C) */
.ssl-form-sticky-bar {
  position: sticky;
  bottom: var(--ax-space-4, 16px);
  z-index: 30;
  margin-top: var(--ax-space-6, 24px);
  padding: var(--ax-space-3, 12px) var(--ax-space-5, 20px);
  background: var(--ax-surface-solid, #ffffff);
  border: 1px solid var(--ax-border, #cbd5e1);
  border-radius: var(--ax-radius-xl, 16px);
  box-shadow: var(--ax-shadow-lg, 0 10px 15px -3px rgba(0,0,0,0.1));
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--ax-space-3, 12px);
  backdrop-filter: blur(12px);
}

@keyframes ssl-spin { to { transform: rotate(360deg); } }
`;

const MAX_FILE = 5 * 1024 * 1024; // 5MB

const formatInfo = (v: unknown): string => {
  if (v === null || v === undefined) return 'N/A';
  const s = String(v).trim();
  return s === '' || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined' ? 'N/A' : s;
};

const getMediaUrl = (path?: string | null): string => {
  if (!path) return '';
  const trimmed = String(path).trim();
  if (!trimmed) return '';
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed;
  }
  return `https://klkerp.com/${trimmed.replace(/^\/+/, '')}`;
};

interface FormState {
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
}

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

const MESSAGES: Record<string, string> = {
  unique_id: 'Please select a Unique ID',
  wardNo: 'Ward Number is required',
  poleNo: 'Pole Number is required',
  beneficiaryName: 'Beneficiary Name is required',
  contactNo: 'Beneficiary Contact Number is required',
  uuidNo: 'UUID Number is required',
  batteryNo: 'Battery Serial Number is required',
  panelNo: 'Panel Number is required',
  lightNo: 'Light Number is required',
  latitude: 'Latitude is required',
  longitude: 'Longitude is required',
  light_file: 'Installed Light Photograph is required',
};

const TEXT_KEYS: Array<keyof FormState> = [
  'wardNo',
  'poleNo',
  'beneficiaryName',
  'contactNo',
  'uuidNo',
  'batteryNo',
  'panelNo',
  'lightNo',
  'latitude',
  'longitude',
];

const ORDER = [
  'unique_id',
  'wardNo',
  'poleNo',
  'beneficiaryName',
  'contactNo',
  'uuidNo',
  'batteryNo',
  'panelNo',
  'lightNo',
  'latitude',
  'longitude',
  'light_file',
];

export function UP_Installation_SSL_InstallLight() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editIdParam = searchParams.get('id') || searchParams.get('ssl_id') || searchParams.get('unique_id');
  const editUidParam = searchParams.get('uid');
  const isEditMode = searchParams.get('edit') === 'true' || Boolean(editIdParam);

  // Section Refs for Quick Navigation
  const sec1 = useRef<HTMLDivElement>(null);
  const sec2 = useRef<HTMLDivElement>(null);
  const sec3 = useRef<HTMLDivElement>(null);
  const sec4 = useRef<HTMLDivElement>(null);
  const sec5 = useRef<HTMLDivElement>(null);

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Auth User
  const { user } = useAuth();
  const loginVendorName = useMemo(() => {
    const session = authService.getSession?.();
    const raw = authService.getRawResponse?.();
    const candidate =
      (user as any)?.vendor_name ||
      (user as any)?.vendor ||
      user?.name ||
      session?.name ||
      session?.vendor_name ||
      (raw as any)?.vendor?.name ||
      (raw as any)?.user?.name ||
      '';
    return candidate && candidate !== 'undefined' ? String(candidate) : '';
  }, [user]);

  // Dropdown & Site Detail State
  const [dropdownLoading, setDropdownLoading] = useState(true);
  const [lightOptions, setLightOptions] = useState<UpSsl18wLightDropdownItem[]>([]);
  const [selectedUniqueId, setSelectedUniqueId] = useState('');

  const [detailLoading, setDetailLoading] = useState(false);
  const [siteDetail, setSiteDetail] = useState<UpSsl18wLightDetail | null>(null);

  // Determine whether this record is an existing installed site (edit mode or already completed)
  const isAlreadyInstalled = Boolean(
    isEditMode ||
    siteDetail?.inst_status === 1 ||
    siteDetail?.light_file ||
    siteDetail?.inst_date
  );

  // Form Fields & Files
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [lightFile, setLightFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [modalImage, setModalImage] = useState<string | null>(null);

  // Barcode Scanner Modal State
  const [scannerTarget, setScannerTarget] = useState<string | null>(null);

  // GPS Geolocation States
  const [gpsDetecting, setGpsDetecting] = useState(false);
  const [gpsStatusMsg, setGpsStatusMsg] = useState<string | null>(null);

  // Validation & Submit States
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const validate = (name: string, value: string): string =>
    value.trim() ? '' : MESSAGES[name] || 'This field is required.';

  const setField = (name: keyof FormState, value: string) => {
    setForm((p) => ({ ...p, [name]: value }));
    if (name !== 'remarks') {
      setErrors((p) => ({ ...p, [name]: validate(name, value) }));
    }
  };

  const handleBlur = (name: string) => setTouched((p) => ({ ...p, [name]: true }));

  // Barcode scan handler
  const handleBarcodeScanned = (target: string, code: string) => {
    if (!target) return;
    const clean = code.trim();
    if (target === 'uuidNo') setField('uuidNo', clean);
    else if (target === 'batteryNo') setField('batteryNo', clean);
    else if (target === 'panelNo') setField('panelNo', clean);
    else if (target === 'lightNo') setField('lightNo', clean);
    else if (target === 'poleNo') setField('poleNo', clean);
    else if (target === 'wardNo') setField('wardNo', clean);
  };

  const getScannerLabel = (target: string | null) => {
    switch (target) {
      case 'uuidNo':
        return 'UUID Number';
      case 'batteryNo':
        return 'Battery Serial Number';
      case 'panelNo':
        return 'Panel Number';
      case 'lightNo':
        return 'Light Number';
      case 'poleNo':
        return 'Pole Number';
      case 'wardNo':
        return 'Ward Number';
      default:
        return 'Barcode / QR Code';
    }
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

  // Fetch Dropdown List
  useEffect(() => {
    let active = true;
    (async () => {
      setDropdownLoading(true);
      try {
        const [available, siteData] = await Promise.all([
          upInstallationService.getSsl18wAvailableLights().catch(() => []),
          upInstallationService.getSsl18wInstallSiteData().catch(() => ({ ssl_sites: [] })),
        ]);
        if (!active) return;
        let list: UpSsl18wLightDropdownItem[] = [];
        if (Array.isArray(available) && available.length > 0) {
          list = available;
        } else if (siteData?.ssl_sites && siteData.ssl_sites.length > 0) {
          list = siteData.ssl_sites.map((s) => ({ id: s.id, uid: s.uid }));
        }
        setLightOptions(list);
      } catch (err) {
        console.error('[UP InstallLight] fetch dropdown error:', err);
        if (active) {
          setLightOptions([]);
          setErrorMsg('Failed to load available SSL lights from server.');
        }
      } finally {
        if (active) setDropdownLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Handle Light Selection
  const handleSelectLight = useCallback(
    async (uid: string) => {
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
        const detail = await upInstallationService.getSsl18wLightDetails(uid);
        setSiteDetail(detail);

        if (detail?.light_file) {
          setExistingImageUrl(detail.light_file);
        }

        // Pre-fill input fields if in Edit Mode or if this site was already installed previously
        const hasExistingRecord = Boolean(isEditMode || detail?.inst_status === 1 || detail?.light_file || detail?.inst_date);
        if (hasExistingRecord && detail) {
          setForm((p) => ({
            ...p,
            wardNo: detail.ward_no || p.wardNo || '',
            poleNo: detail.pole_no || p.poleNo || '',
            beneficiaryName: detail.beneficiary_name || p.beneficiaryName || '',
            contactNo: detail.beneficiary_contact || p.contactNo || '',
            uuidNo: detail.uuid_no || p.uuidNo || '',
            batteryNo: detail.battery_serial_no || p.batteryNo || '',
            panelNo: detail.panel_no || p.panelNo || '',
            lightNo: detail.light_no || p.lightNo || '',
            latitude: detail.latitude ? String(detail.latitude) : (p.latitude || ''),
            longitude: detail.longitude ? String(detail.longitude) : (p.longitude || ''),
            remarks: detail.inst_remarks || p.remarks || '',
          }));
          setErrors({});
        } else {
          // New installation mode: Keep form fields clean
          setForm(EMPTY_FORM);
          setLightFile(null);
          setFilePreview(null);
          setTouched({});
          setErrors({});
        }
      } catch (err) {
        console.error('[UP InstallLight] fetch detail error:', err);
        setSiteDetail(null);
        setErrorMsg('Failed to load light details from server.');
      } finally {
        setDetailLoading(false);
      }
    },
    [isEditMode, resetForm]
  );

  // Auto-load details if editIdParam is provided
  useEffect(() => {
    if (!editIdParam) return;
    let active = true;
    (async () => {
      setDetailLoading(true);
      setSelectedUniqueId(String(editIdParam));
      try {
        let detail: UpSsl18wLightDetail | null = null;
        if (isEditMode) {
          detail = await upInstallationService.getSsl18wInstalledLightForEdit(editIdParam).catch(() => null);
        }
        if (!detail) {
          detail = await upInstallationService.getSsl18wLightDetails(editIdParam).catch(() => null);
        }
        if (!detail && editUidParam) {
          detail = await upInstallationService.getSsl18wLightDetails(editUidParam).catch(() => null);
        }
        if (!active) return;
        setSiteDetail(detail);
        if (detail) {
          if (detail.id) {
            setSelectedUniqueId(String(detail.id));
          }
          setForm({
            wardNo: detail.ward_no || '',
            poleNo: detail.pole_no || '',
            beneficiaryName: detail.beneficiary_name || '',
            contactNo: detail.beneficiary_contact || (detail as any).contact_no || '',
            uuidNo: detail.uuid_no || '',
            batteryNo: detail.battery_serial_no || (detail as any).battery_no || '',
            panelNo: detail.panel_no || (detail as any).module_no || '',
            lightNo: detail.light_no || '',
            latitude: detail.latitude ? String(detail.latitude) : '',
            longitude: detail.longitude ? String(detail.longitude) : '',
            remarks: detail.inst_remarks || (detail as any).remark || '',
          });
          if (detail.light_file) {
            setExistingImageUrl(detail.light_file);
          }
        }
      } catch (err) {
        console.error('[UP InstallLight] auto-load error:', err);
      } finally {
        if (active) setDetailLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [editIdParam, isEditMode, editUidParam]);

  // GPS Auto-detect
  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      setGpsStatusMsg('Geolocation is not supported by your browser.');
      return;
    }
    setGpsDetecting(true);
    setGpsStatusMsg('Requesting satellite geolocation…');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        setForm((prev) => ({ ...prev, latitude: lat, longitude: lng }));
        setErrors((prev) => {
          const next = { ...prev };
          delete next.latitude;
          delete next.longitude;
          return next;
        });
        setGpsStatusMsg(`GPS coordinates acquired: ${lat}, ${lng} (±${Math.round(pos.coords.accuracy)}m)`);
        setGpsDetecting(false);
      },
      (err) => {
        setGpsStatusMsg(`Could not acquire GPS: ${err.message}. Please enter coordinates manually.`);
        setGpsDetecting(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    handleDetectGps();
  }, [selectedLightId]);

  // File Upload Handlers
  const handleFileChange = (file: File) => {
    if (file.size > MAX_FILE) {
      setErrors((prev) => ({
        ...prev,
        light_file: `File size exceeds 5MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`,
      }));
      return;
    }
    setLightFile(file);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.light_file;
      return next;
    });
    const reader = new FileReader();
    reader.onload = () => setFilePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removeFile = () => {
    setLightFile(null);
    setFilePreview(null);
    setExistingImageUrl(null);
  };

  // Progress and Required Counters
  const totalRequired = 11;
  const completedRequired = useMemo(() => {
    let count = 0;
    if (selectedUniqueId) count++;
    if (form.wardNo.trim()) count++;
    if (form.poleNo.trim()) count++;
    if (form.beneficiaryName.trim()) count++;
    if (form.contactNo.trim()) count++;
    if (form.uuidNo.trim()) count++;
    if (form.batteryNo.trim()) count++;
    if (form.panelNo.trim()) count++;
    if (form.lightNo.trim()) count++;
    if (form.latitude.trim()) count++;
    if (form.longitude.trim()) count++;
    return count;
  }, [selectedUniqueId, form]);

  const progressPercent = Math.round((completedRequired / totalRequired) * 100);
  const errorCount = useMemo(() => Object.values(errors).filter(Boolean).length, [errors]);

  // Site detail specifications items
  const siteInfoItems = useMemo(() => {
    const d = (siteDetail || {}) as any;
    return [
      { label: 'Vendor Name', value: formatInfo(loginVendorName || d.vendor || 'N/A') },
      { label: 'State', value: formatInfo(d.state || 'Uttar Pradesh') },
      { label: 'Phase', value: formatInfo(d.phase) },
      { label: 'District', value: formatInfo(d.district) },
      { label: 'Block', value: formatInfo(d.block) },
      { label: 'Panchayat', value: formatInfo(d.panchayat) },
      { label: 'Work Order No.', value: formatInfo(d.wo_no) },
      { label: 'Work Order Received', value: formatInfo(d.wo_received) },
      { label: 'Ward No.', value: formatInfo(d.ward_no) },
      { label: 'Pole No.', value: formatInfo(d.pole_no) },
      { label: 'Beneficiary Name', value: formatInfo(d.beneficiary_name) },
      { label: 'Contact No.', value: formatInfo(d.beneficiary_contact || d.contact_no) },
    ];
  }, [siteDetail, loginVendorName]);

  // Form Submit
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setSubmitted(true);

    const newErrors: Record<string, string> = {};
    if (!selectedUniqueId) newErrors.unique_id = MESSAGES.unique_id;
    TEXT_KEYS.forEach((k) => {
      const err = validate(k, form[k]);
      if (err) newErrors[k] = err;
    });
    if (!lightFile && !(isAlreadyInstalled && existingImageUrl)) {
      newErrors.light_file = MESSAGES.light_file;
    }
    setErrors(newErrors);

    const firstKey = ORDER.find((k) => newErrors[k]);
    if (firstKey) {
      const missingMsg = formatMissingRequiredMsg(newErrors);
      setErrorMsg(missingMsg);
      if (firstKey === 'unique_id') scrollTo(sec1);
      else if (firstKey === 'wardNo' || firstKey === 'poleNo' || firstKey === 'beneficiaryName' || firstKey === 'contactNo') scrollTo(sec2);
      else if (firstKey === 'uuidNo' || firstKey === 'batteryNo' || firstKey === 'panelNo' || firstKey === 'lightNo') scrollTo(sec3);
      else if (firstKey === 'latitude' || firstKey === 'longitude') scrollTo(sec4);
      else if (firstKey === 'light_file') scrollTo(sec5);
      setTimeout(() => scrollToFirstError(), 50);
      return;
    }

    setSubmitting(true);
    try {
      const targetId = String(siteDetail?.id || editIdParam || selectedUniqueId);
      const fd = new FormData();
      fd.append('ssl_id', targetId);
      fd.append('id', targetId);
      if (siteDetail?.uid || editUidParam) {
        fd.append('uid', siteDetail?.uid || editUidParam || '');
      }
      fd.append('uuid_no', form.uuidNo.trim());
      fd.append('light_no', form.lightNo.trim());
      fd.append('ward_no', form.wardNo.trim());
      fd.append('pole_no', form.poleNo.trim());
      fd.append('module_no', form.panelNo.trim());
      fd.append('panel_no', form.panelNo.trim());
      fd.append('battery_serial_no', form.batteryNo.trim());
      fd.append('battery_no', form.batteryNo.trim());
      fd.append('latitude', form.latitude.trim());
      fd.append('longitude', form.longitude.trim());
      fd.append('beneficiary_name', form.beneficiaryName.trim());
      fd.append('beneficiary_contact', form.contactNo.trim());
      fd.append('contact_no', form.contactNo.trim());
      if (loginVendorName) {
        fd.append('vendor_name', loginVendorName);
        fd.append('vendor', loginVendorName);
      }
      if (form.remarks.trim()) {
        fd.append('remark', form.remarks.trim());
        fd.append('inst_remarks', form.remarks.trim());
      }
      if (lightFile) fd.append('light_file', lightFile);

      let res: any;
      if (isAlreadyInstalled) {
        try {
          res = await upInstallationService.updateSsl18wInstallation(fd);
        } catch (updateErr) {
          console.warn('[UP InstallLight] update endpoint failed, trying store endpoint:', updateErr);
          res = await upInstallationService.storeSsl18wInstallation(fd);
        }
      } else {
        res = await upInstallationService.storeSsl18wInstallation(fd);

        // If backend returns validation error that light_no is already taken,
        // it often means this record already exists in database. Attempt update:
        const isLightTaken =
          res?.errors?.light_no &&
          (Array.isArray(res.errors.light_no)
            ? res.errors.light_no.some((m: string) => String(m).toLowerCase().includes('taken'))
            : String(res.errors.light_no).toLowerCase().includes('taken'));

        if ((!res?.status || res?.errors) && isLightTaken && (selectedUniqueId || editIdParam)) {
          try {
            const updateAttempt = await upInstallationService.updateSsl18wInstallation(fd);
            if (updateAttempt?.status) {
              res = updateAttempt;
            }
          } catch {
            // retain original validation failure
          }
        }
      }

      // Check if backend responded with validation error or failed status
      if (!res || res.status === false || res.errors) {
        const extracted = extractBackendError(res, 'Validation error occurred while submitting installation.');
        const fieldErrors: Record<string, string> = { ...extracted.fieldErrors };

        if (res?.errors && typeof res.errors === 'object') {
          if (res.errors.light_no) {
            const raw = res.errors.light_no;
            fieldErrors.lightNo = Array.isArray(raw) ? raw.join(', ') : String(raw);
          }
          if (res.errors.uuid_no) {
            const raw = res.errors.uuid_no;
            fieldErrors.uuidNo = Array.isArray(raw) ? raw.join(', ') : String(raw);
          }
          if (res.errors.battery_no || res.errors.battery_serial_no) {
            const raw = res.errors.battery_no || res.errors.battery_serial_no;
            fieldErrors.batteryNo = Array.isArray(raw) ? raw.join(', ') : String(raw);
          }
          if (res.errors.panel_no || res.errors.module_no) {
            const raw = res.errors.panel_no || res.errors.module_no;
            fieldErrors.panelNo = Array.isArray(raw) ? raw.join(', ') : String(raw);
          }
          if (res.errors.ward_no) {
            const raw = res.errors.ward_no;
            fieldErrors.wardNo = Array.isArray(raw) ? raw.join(', ') : String(raw);
          }
          if (res.errors.pole_no) {
            const raw = res.errors.pole_no;
            fieldErrors.poleNo = Array.isArray(raw) ? raw.join(', ') : String(raw);
          }
          if (res.errors.beneficiary_name) {
            const raw = res.errors.beneficiary_name;
            fieldErrors.beneficiaryName = Array.isArray(raw) ? raw.join(', ') : String(raw);
          }
          if (res.errors.contact_no || res.errors.beneficiary_contact || res.errors.mobile) {
            const raw = res.errors.contact_no || res.errors.beneficiary_contact || res.errors.mobile;
            fieldErrors.contactNo = Array.isArray(raw) ? raw.join(', ') : String(raw);
          }
          if (res.errors.latitude) {
            const raw = res.errors.latitude;
            fieldErrors.latitude = Array.isArray(raw) ? raw.join(', ') : String(raw);
          }
          if (res.errors.longitude) {
            const raw = res.errors.longitude;
            fieldErrors.longitude = Array.isArray(raw) ? raw.join(', ') : String(raw);
          }
          if (res.errors.light_file) {
            const raw = res.errors.light_file;
            fieldErrors.light_file = Array.isArray(raw) ? raw.join(', ') : String(raw);
          }
          if (res.errors.ssl_id || res.errors.unique_id) {
            const raw = res.errors.ssl_id || res.errors.unique_id;
            fieldErrors.unique_id = Array.isArray(raw) ? raw.join(', ') : String(raw);
          }
        }

        setErrors((prev) => ({ ...prev, ...fieldErrors }));
        setTouched((prev) => {
          const nextTouched = { ...prev };
          Object.keys(fieldErrors).forEach((k) => {
            nextTouched[k] = true;
          });
          return nextTouched;
        });

        setErrorMsg(extracted.message);

        // Scroll directly to the section containing error
        if (fieldErrors.lightNo || fieldErrors.uuidNo || fieldErrors.batteryNo || fieldErrors.panelNo) {
          scrollTo(sec3);
        } else if (fieldErrors.wardNo || fieldErrors.poleNo || fieldErrors.beneficiaryName || fieldErrors.contactNo) {
          scrollTo(sec2);
        } else if (fieldErrors.latitude || fieldErrors.longitude) {
          scrollTo(sec4);
        } else if (fieldErrors.light_file) {
          scrollTo(sec5);
        } else if (fieldErrors.unique_id) {
          scrollTo(sec1);
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        return;
      }

      setSuccessMsg(
        res?.message || (isAlreadyInstalled ? 'Installation details updated successfully.' : 'Details saved successfully.')
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });

      if (!isAlreadyInstalled) {
        setSelectedUniqueId('');
        setSiteDetail(null);
        resetForm();
      }
    } catch (err: any) {
      console.error('[UP InstallLight] submit error:', err);
      const msg = err?.message || 'Failed to submit installation details.';
      setErrorMsg(msg);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  const resolvedPreview = filePreview || (existingImageUrl ? getMediaUrl(existingImageUrl) : '');

  return (
    <div className="solar-erp-page ssl-inst-form">
      <style>{SINGLE_CARD_FORM_CSS}</style>

      {/* ── Page Head matching Karnataka/Bihar SSL Reference ── */}
      <PageHead
        title={isAlreadyInstalled ? 'Edit Installed Light' : 'Install Light'}
        subtitle={
          isAlreadyInstalled
            ? `Update installation verification form for UP SSL ${selectedUniqueId || editIdParam || ''}`
            : 'Complete installation verification form for assigned UP SSL 18W sites'
        }
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'UP' },
          { label: 'Installation' },
          { label: 'SSL', href: '/v/up/ssl/dashboard' },
          { label: isAlreadyInstalled ? 'Edit Light' : 'Install Light' },
        ]}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {isAlreadyInstalled ? (
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--sm"
                onClick={() => navigate('/v/up/ssl-view-installed-18w-light')}
                style={{ fontWeight: 600 }}
              >
                ← Back to Installed Lights
              </button>
            ) : (
              <>
                <Link to="/v/up/ssl-view-installed-18w-light" className="ax-btn ax-btn--secondary ax-btn--sm">
                  View Installed Lights
                </Link>
                <Link to="/v/up/ssl/assigned-lights" className="ax-btn ax-btn--secondary ax-btn--sm">
                  View Assigned Lights
                </Link>
              </>
            )}
          </div>
        }
      />

      {/* ── Alerts ── */}
      {successMsg && (
        <div className="ax-alert ax-alert--success" style={{ marginBottom: 'var(--ax-space-4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }} role="status">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="ax-alert__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                <path d="M5 12l5 5l10 -10" />
              </svg>
            </span>
            <div className="ax-alert__content">
              <div className="ax-alert__title" style={{ fontSize: '14px', fontWeight: 600 }}>Success</div>
              <div className="ax-alert__text" style={{ fontSize: '13px' }}>{successMsg}</div>
            </div>
          </div>
          {isAlreadyInstalled && (
            <Link
              to="/v/up/ssl-view-installed-18w-light"
              className="ax-btn ax-btn--primary ax-btn--sm"
              style={{ textDecoration: 'none' }}
            >
              ← Back to Installation Details
            </Link>
          )}
        </div>
      )}

      {errorMsg && (
        <div className="ax-alert ax-alert--danger" style={{ marginBottom: 'var(--ax-space-4)' }} role="alert">
          <span className="ax-alert__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </span>
          <div className="ax-alert__content">
            <div className="ax-alert__title" style={{ fontSize: '14px', fontWeight: 600 }}>Attention Needed</div>
            <div className="ax-alert__text" style={{ fontSize: '13px' }}>{errorMsg}</div>
            {submitted && errorCount > 1 && (
              <div style={{ marginTop: 4, fontSize: '12px', fontWeight: 500 }}>
                {errorCount} fields require valid input before submission.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Main Form: Card + Sticky Footer (footer is OUTSIDE the card, same as Kusum C) ── */}
      <form onSubmit={handleSubmit} noValidate>
        <div className="ax-card">
          {/* ── Header with Eyebrow, Title and Section Navigation Pills ── */}
          <div className="ax-card__header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <span className="ax-card__eyebrow" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ax-accent, #2563eb)', fontWeight: 700 }}>
                  Installation
                </span>
                <h2 className="ax-card__title" style={{ fontSize: '1.25rem', fontWeight: 700, margin: '2px 0 0' }}>
                  {isAlreadyInstalled ? 'Edit / Update UP SSL 18w Light Installation' : 'UP SSL 18w Light Installation'}
                </h2>
                <p className="ax-card__subtitle" style={{ fontSize: '0.85rem', color: 'var(--ax-text-muted, #64748b)', margin: '4px 0 0' }}>
                  All installation fields organized inside one main card across 5 dedicated sections.
                </p>
              </div>
            </div>

            {/* Quick Nav Pills */}
            <div className="ssl-section-pills" role="navigation" aria-label="Quick section navigation">
              <button type="button" className="ssl-section-pill-btn" onClick={() => scrollTo(sec1)}>
                <span className="pill-num">1</span> Site Selection
              </button>
              <button type="button" className="ssl-section-pill-btn" onClick={() => scrollTo(sec2)}>
                <span className="pill-num">2</span> Beneficiary Info
              </button>
              <button type="button" className="ssl-section-pill-btn" onClick={() => scrollTo(sec3)}>
                <span className="pill-num">3</span> Equipment & Serials
              </button>
              <button type="button" className="ssl-section-pill-btn" onClick={() => scrollTo(sec4)}>
                <span className="pill-num">4</span> Geolocation & Remarks
              </button>
              <button type="button" className="ssl-section-pill-btn" onClick={() => scrollTo(sec5)}>
                <span className="pill-num">5</span> Site Photo
              </button>
            </div>
          </div>

          <div className="ax-card__body">
            {/* ════════ Section 1: Site Selection ════════ */}
            <div ref={sec1} className="ssl-section-block">
              <div className="ssl-section-header">
                <div className="ssl-section-title-wrap">
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>1. Select Installation Site</h3>
                  <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                    {isAlreadyInstalled
                      ? 'Editing / updating installation verification data for this site'
                      : 'Choose from assigned solar street light sites pending installation in Uttar Pradesh'}
                  </span>
                </div>
              </div>

              {isEditMode && (
                <div
                  style={{
                    marginBottom: 16,
                    padding: '10px 14px',
                    borderRadius: 6,
                    background: 'var(--ax-warning-50, #fffbeb)',
                    border: '1px solid var(--ax-warning-200, #fde68a)',
                    color: 'var(--ax-warning-800, #92400e)',
                    fontSize: '12.5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 16, height: 16, flexShrink: 0 }}>
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  <span>
                    <strong>Editing Installation Details:</strong> You are modifying the installation record for <strong>{siteDetail?.uid || editUidParam || (selectedUniqueId ? `Site #${selectedUniqueId}` : 'Selected Light')}</strong>. Update the fields below and submit to save your changes.
                  </span>
                </div>
              )}

              {isAlreadyInstalled && !isEditMode && selectedUniqueId && (
                <div
                  style={{
                    marginBottom: 16,
                    padding: '10px 14px',
                    borderRadius: 6,
                    background: 'var(--ax-info-50, #eff6ff)',
                    border: '1px solid var(--ax-info-200, #bfdbfe)',
                    color: 'var(--ax-info-700, #1d4ed8)',
                    fontSize: '12.5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 16, height: 16, flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  <span>
                    <strong>Existing Installation Record Found:</strong> This site is already marked as installed in UP SSL. Submitting this form will update its verified equipment and location details.
                  </span>
                </div>
              )}

              <div className="ssl-form-grid" style={{ marginBottom: 16 }}>
                {/* Unique ID select */}
                <div>
                  {dropdownLoading || (isEditMode && detailLoading) ? (
                    <SkeletonRect width="100%" height={46} borderRadius="8px" />
                  ) : isEditMode ? (
                    <div className="ax-float">
                      <input
                        id="ssl_unique_id"
                        type="text"
                        className="ax-float__input"
                        value={siteDetail?.uid ? `${siteDetail.uid} (ID: ${selectedUniqueId || editIdParam})` : (editUidParam ? `${editUidParam} (ID: ${selectedUniqueId || editIdParam})` : `Site #${selectedUniqueId || editIdParam}`)}
                        disabled
                      />
                      <label htmlFor="ssl_unique_id" className="ax-float__label floating">
                        Installation Site
                      </label>
                    </div>
                  ) : (
                    <FloatingSelect
                      id="ssl_unique_id"
                      label={detailLoading ? 'Unique ID (Fetching site details…)' : 'Unique ID'}
                      required
                      placeholder="-- Select Unique ID --"
                      value={selectedUniqueId}
                      options={lightOptions.map((o) => ({
                        value: String(o.id),
                        label: o.uid || `Site #${o.id}`,
                      }))}
                      onChange={(val) => handleSelectLight(val)}
                      onBlur={() => handleBlur('unique_id')}
                      error={touched.unique_id || submitted ? errors.unique_id : undefined}
                    />
                  )}
                </div>

                {/* Vendor Name */}
                <div>
                  <div className="ax-float">
                    <input
                      id="ssl_vendor_name"
                      type="text"
                      className="ax-float__input"
                      value={selectedUniqueId ? loginVendorName || (siteDetail as any)?.vendor || '' : ''}
                      placeholder=" "
                      disabled
                      style={{ fontWeight: 600, color: '#1e293b' }}
                    />
                    <label htmlFor="ssl_vendor_name" className="ax-float__label floating">
                      Vendor Name (Auto-populated from login)
                    </label>
                  </div>
                </div>
              </div>

              {/* Site details specification cards */}
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#475569', marginBottom: 8 }}>
                  {selectedUniqueId
                    ? 'Official UP SSL site records & prefilled specifications:'
                    : 'Select a Unique ID above to fetch UP SSL site specifications.'}
                </div>

                {selectedUniqueId &&
                  (detailLoading ? (
                    <div className="ssl-site-info-grid">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="ssl-site-info-card">
                          <SkeletonLine width="45%" height="0.8em" style={{ marginBottom: 6 }} />
                          <SkeletonRect width="100%" height={20} borderRadius="4px" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="ssl-site-info-grid">
                      {siteInfoItems.map((item) => (
                        <div key={item.label} className="ssl-site-info-card">
                          <span className="ssl-site-info-card__label">{item.label}</span>
                          <span className="ssl-site-info-card__value">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  ))}
              </div>
            </div>

            <hr className="ssl-section-divider" />

            {/* ════════ Section 2: Beneficiary & Location Details ════════ */}
            <div ref={sec2} className="ssl-section-block">
              <div className="ssl-section-header">
                <div className="ssl-section-title-wrap">
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>2. Beneficiary & Location Information</h3>
                  <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                    Confirm ward, pole number, beneficiary name, and direct contact number
                  </span>
                </div>
              </div>

              <div className="ssl-form-grid ssl-form-grid--4col">
                <FloatingInput
                  label="Ward Number"
                  name="wardNo"
                  value={form.wardNo}
                  onChange={(e) => setField('wardNo', e.target.value)}
                  onBlur={() => handleBlur('wardNo')}
                  placeholder="Enter Ward Number"
                  required
                  onCameraClick={() => setScannerTarget('wardNo')}
                  error={touched.wardNo || submitted ? errors.wardNo : undefined}
                />

                <FloatingInput
                  label="Pole Number"
                  name="poleNo"
                  value={form.poleNo}
                  onChange={(e) => setField('poleNo', e.target.value)}
                  onBlur={() => handleBlur('poleNo')}
                  placeholder="Enter Pole Number"
                  required
                  onCameraClick={() => setScannerTarget('poleNo')}
                  error={touched.poleNo || submitted ? errors.poleNo : undefined}
                />

                <FloatingInput
                  label="Beneficiary Name"
                  name="beneficiaryName"
                  value={form.beneficiaryName}
                  onChange={(e) => setField('beneficiaryName', e.target.value)}
                  onBlur={() => handleBlur('beneficiaryName')}
                  placeholder="Enter Beneficiary Name"
                  required
                  error={touched.beneficiaryName || submitted ? errors.beneficiaryName : undefined}
                />

                <FloatingInput
                  label="Contact Number"
                  name="contactNo"
                  type="tel"
                  maxLength={15}
                  value={form.contactNo}
                  onChange={(e) => setField('contactNo', e.target.value)}
                  onBlur={() => handleBlur('contactNo')}
                  placeholder="Enter Contact Number"
                  required
                  error={touched.contactNo || submitted ? errors.contactNo : undefined}
                />
              </div>
            </div>

            <hr className="ssl-section-divider" />

            {/* ════════ Section 3: Equipment & Serial Numbers with Barcode Scanner ════════ */}
            <div ref={sec3} className="ssl-section-block">
              <div className="ssl-section-header">
                <div className="ssl-section-title-wrap">
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>3. Equipment & Serial Numbers</h3>
                  <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                    Scan barcode with camera or enter unique serial numbers for UUID, Battery, Solar Panel, and Light Luminary
                  </span>
                </div>
              </div>

              <div className="ssl-form-grid ssl-form-grid--4col">
                <FloatingInput
                  label="UUID No."
                  name="uuidNo"
                  value={form.uuidNo}
                  onChange={(e) => setField('uuidNo', e.target.value)}
                  onBlur={() => handleBlur('uuidNo')}
                  placeholder="Enter UUID Number"
                  required
                  onCameraClick={() => setScannerTarget('uuidNo')}
                  error={touched.uuidNo || submitted ? errors.uuidNo : undefined}
                />

                <FloatingInput
                  label="Battery Number"
                  name="batteryNo"
                  value={form.batteryNo}
                  onChange={(e) => setField('batteryNo', e.target.value)}
                  onBlur={() => handleBlur('batteryNo')}
                  placeholder="Enter Battery Serial Number"
                  required
                  onCameraClick={() => setScannerTarget('batteryNo')}
                  error={touched.batteryNo || submitted ? errors.batteryNo : undefined}
                />

                <FloatingInput
                  label="Panel Number"
                  name="panelNo"
                  value={form.panelNo}
                  onChange={(e) => setField('panelNo', e.target.value)}
                  onBlur={() => handleBlur('panelNo')}
                  placeholder="Enter Solar Panel / Module Number"
                  required
                  onCameraClick={() => setScannerTarget('panelNo')}
                  error={touched.panelNo || submitted ? errors.panelNo : undefined}
                />

                <FloatingInput
                  label="Light Number"
                  name="lightNo"
                  value={form.lightNo}
                  onChange={(e) => setField('lightNo', e.target.value)}
                  onBlur={() => handleBlur('lightNo')}
                  placeholder="Enter Light / Luminary Serial Number"
                  required
                  onCameraClick={() => setScannerTarget('lightNo')}
                  error={touched.lightNo || submitted ? errors.lightNo : undefined}
                />
              </div>

              {/* Error assistance banner if lightNo has duplicate/taken error */}
              {errors.lightNo && (
                <div
                  style={{
                    marginTop: 14,
                    padding: '10px 14px',
                    borderRadius: 6,
                    background: 'var(--ax-danger-50, #fef2f2)',
                    border: '1px solid var(--ax-danger-200, #fecaca)',
                    color: 'var(--ax-danger-700, #b91c1c)',
                    fontSize: '12.5px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 16, height: 16, flexShrink: 0 }}>
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>
                      <strong>Light Number Validation:</strong> {errors.lightNo}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      className="ax-btn ax-btn--secondary ax-btn--sm"
                      onClick={() => {
                        setField('lightNo', '');
                        setErrors((p) => {
                          const next = { ...p };
                          delete next.lightNo;
                          return next;
                        });
                      }}
                      style={{ flexShrink: 0, fontSize: 11.5 }}
                    >
                      Clear Number
                    </button>
                    <button
                      type="button"
                      className="ax-btn ax-btn--primary ax-btn--sm"
                      onClick={() => setScannerTarget('lightNo')}
                      style={{ flexShrink: 0, fontSize: 11.5 }}
                    >
                      Scan Barcode
                    </button>
                  </div>
                </div>
              )}
            </div>

            <hr className="ssl-section-divider" />

            {/* ════════ Section 4: Geolocation & Remarks ════════ */}
            <div ref={sec4} className="ssl-section-block">
              <div className="ssl-section-header">
                <div className="ssl-section-title-wrap">
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>4. Geolocation & Site Remarks</h3>
                  <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                    Confirm GPS coordinates and add installation verification remarks
                  </span>
                </div>
                <button
                  type="button"
                  className="ax-btn ax-btn--secondary ax-btn--sm"
                  onClick={handleDetectGps}
                  disabled={gpsDetecting}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}
                >
                  {gpsDetecting ? (
                    <>
                      <span className="ax-spinner" style={{ width: 14, height: 14 }} />
                      <span>Detecting GPS…</span>
                    </>
                  ) : (
                    <>
                      <span>📍</span>
                      <span>Auto-detect GPS</span>
                    </>
                  )}
                </button>
              </div>

              <div className="ssl-form-grid ssl-form-grid--3col" style={{ marginBottom: 12 }}>
                <FloatingInput
                  label="Installation Latitude"
                  name="latitude"
                  value={form.latitude}
                  onChange={() => {}}
                  readOnly={true}
                  style={{ cursor: 'not-allowed', backgroundColor: 'var(--ax-surface-subtle, #f8fafc)' }}
                  placeholder="Auto-detected GPS Latitude"
                  required
                  error={touched.latitude || submitted ? errors.latitude : undefined}
                />

                <FloatingInput
                  label="Installation Longitude"
                  name="longitude"
                  value={form.longitude}
                  onChange={() => {}}
                  readOnly={true}
                  style={{ cursor: 'not-allowed', backgroundColor: 'var(--ax-surface-subtle, #f8fafc)' }}
                  placeholder="Auto-detected GPS Longitude"
                  required
                  error={touched.longitude || submitted ? errors.longitude : undefined}
                />

                <FloatingInput
                  label="Installation Remarks"
                  name="remarks"
                  value={form.remarks}
                  onChange={(e) => setField('remarks', e.target.value)}
                  onBlur={() => handleBlur('remarks')}
                  placeholder="Enter remarks..."
                />
              </div>

              {gpsStatusMsg && (
                <div style={{ fontSize: '12px', color: form.latitude && form.longitude ? '#16a34a' : '#64748b', fontWeight: 500 }}>
                  {form.latitude && form.longitude ? '✓ ' : ''}{gpsStatusMsg}
                </div>
              )}
            </div>

            <hr className="ssl-section-divider" />

            {/* ════════ Section 5: Photo Uploads ════════ */}
            <div ref={sec5} className="ssl-section-block">
              <div className="ssl-section-header">
                <div className="ssl-section-title-wrap">
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>5. Installation Photo Evidence</h3>
                  <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                    Upload clear field photograph of the installed solar street light (Max 5MB)
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                <UploadDropzone
                  id="light_file"
                  label="Installed Light Photograph"
                  required={!isAlreadyInstalled || !existingImageUrl}
                  file={lightFile}
                  preview={resolvedPreview}
                  onSelect={handleFileChange}
                  onRemove={removeFile}
                  onPreviewClick={() => {
                    if (resolvedPreview) setModalImage(resolvedPreview);
                  }}
                  error={touched.light_file || submitted ? errors.light_file : undefined}
                />
              </div>
            </div>
          </div>
        </div>
        {/* ── end ax-card ── */}

        {/* ════════ Sticky Action Footer (outside the card, same as Kusum C) ════════ */}
        <div className="ssl-form-sticky-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span
              className={`ax-badge ax-badge--soft ${isAlreadyInstalled ? 'ax-badge--warning' : 'ax-badge--primary'} ax-badge--pill`}
            >
              {isAlreadyInstalled
                ? `Update Mode · Site #${selectedUniqueId || editIdParam || ''}`
                : 'New Installation'}
            </span>
            <span className="ax-badge ax-badge--soft ax-badge--pill" style={{ fontWeight: 600 }}>
              Required: {completedRequired} / {totalRequired} ({progressPercent}%)
            </span>
            {submitted && errorCount > 0 && (
              <span style={{ fontSize: '12px', color: 'var(--ax-danger-500, #ef4444)', fontWeight: 600 }}>
                ⚠️ Missing mandatory fields
              </span>
            )}
          </div>

          <div className="ax-cluster" style={{ gap: 'var(--ax-space-3, 12px)' }}>
            <button
              type="button"
              className="ax-btn ax-btn--secondary"
              onClick={() => navigate('/v/up/ssl-view-installed-18w-light')}
              disabled={submitting}
            >
              <span className="ax-btn__label">Cancel</span>
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="ax-btn ax-btn--primary"
              style={{ minWidth: 200 }}
            >
              {submitting ? (
                <>
                  <svg
                    className="ax-btn__icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    style={{ animation: 'ssl-spin 1s linear infinite' }}
                  >
                    <path d="M12 3a9 9 0 1 0 9 9" />
                  </svg>
                  <span className="ax-btn__label">
                    {isAlreadyInstalled ? 'Updating Installation…' : 'Submitting Installation…'}
                  </span>
                </>
              ) : (
                <>
                  <svg
                    className="ax-btn__icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12l5 5l10 -10" />
                  </svg>
                  <span className="ax-btn__label">
                    {isAlreadyInstalled ? 'Update Installation Data' : 'Submit Installation Data'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* ── Camera Barcode Scanner Modal ── */}
      <CameraBarcodeScannerModal
        open={scannerTarget !== null}
        fieldName={scannerTarget || ''}
        fieldLabel={getScannerLabel(scannerTarget)}
        onScan={(code: string) => {
          handleBarcodeScanned(scannerTarget || '', code);
          setScannerTarget(null);
        }}
        onClose={() => setScannerTarget(null)}
      />

      {/* ── Photo Lightbox Modal ── */}
      {modalImage && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setModalImage(null)}
        >
          <div
            className="ax-card"
            style={{ position: 'relative', padding: '16px', maxWidth: 640, width: '90%', background: '#fff' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h4 style={{ margin: 0, fontSize: '14px', color: '#1e293b', fontWeight: 600 }}>
                Light Image Preview
              </h4>
              <button
                type="button"
                className="ax-btn ax-btn--ghost ax-btn--sm"
                onClick={() => setModalImage(null)}
                aria-label="Close preview"
              >
                ✕
              </button>
            </div>
            <img
              src={modalImage}
              alt="Light preview"
              style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: '8px', display: 'block', margin: '0 auto' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default UP_Installation_SSL_InstallLight;

/* ───────── Reusable Components matching Karnataka/Bihar SSL Reference ───────── */

interface FloatingInputProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  style?: CSSProperties;
  type?: string;
  maxLength?: number;
  placeholder?: string;
  onCameraClick?: () => void;
  error?: string;
}

function FloatingInput({
  label,
  name,
  value,
  onChange,
  onBlur,
  required,
  disabled,
  readOnly,
  style,
  type = 'text',
  maxLength,
  placeholder,
  onCameraClick,
  error,
}: FloatingInputProps) {
  const [focused, setFocused] = useState(false);
  const hasVal = Boolean(value && String(value).length > 0);

  const inputNode = (
    <div className="ax-float" style={{ flex: 1, minWidth: 0 }}>
      <input
        type={type}
        id={name}
        name={name}
        maxLength={maxLength}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          onBlur?.();
        }}
        required={required}
        disabled={disabled}
        readOnly={readOnly}
        placeholder={placeholder || label}
        className={`ax-float__input ${error ? 'is-invalid' : ''}`}
        style={{
          ...(onCameraClick ? { borderTopRightRadius: 0, borderBottomRightRadius: 0 } : {}),
          ...style,
        }}
      />
      <label htmlFor={name} className={`ax-float__label ${focused ? 'floating' : hasVal ? 'has-val' : ''}`}>
        {label} {required && <span style={{ color: 'var(--ax-danger-500, #ef4444)' }}>*</span>}
      </label>
    </div>
  );

  return (
    <div>
      {onCameraClick ? (
        <div style={{ display: 'flex', alignItems: 'stretch', width: '100%' }}>
          {inputNode}
          <button
            type="button"
            className="ax-btn ax-btn--secondary"
            onClick={onCameraClick}
            title={`Scan barcode for ${label}`}
            aria-label={`Scan barcode for ${label}`}
            style={{
              height: 46,
              padding: '0 12px',
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0,
              borderLeft: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              color: '#2563eb',
              fontWeight: 600,
              fontSize: '12px',
              flexShrink: 0,
              background: 'var(--ax-surface-subtle, #f8fafc)',
              borderColor: error ? 'var(--ax-danger-500, #ef4444)' : 'var(--ax-border, #cbd5e1)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            <span>Scan</span>
          </button>
        </div>
      ) : (
        inputNode
      )}
      {error && (
        <div className="ax-field-feedback ax-field-feedback--error" role="alert">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 12, height: 12 }}>
            <circle cx="12" cy="12" r="9" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

interface FloatingSelectProps {
  id: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  value: string;
  options: { value: string; label: string }[];
  disabled?: boolean;
  onChange: (val: string) => void;
  onBlur?: () => void;
  error?: string;
}

function FloatingSelect({
  id,
  label,
  required,
  placeholder = '-- Select --',
  value,
  options,
  disabled,
  onChange,
  onBlur,
  error,
}: FloatingSelectProps) {
  return (
    <div>
      <div className="ax-float">
        <select
          id={id}
          className={`ax-float__input ${error ? 'is-invalid' : ''}`}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
        >
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <label htmlFor={id} className="ax-float__label floating">
          {label} {required && <span style={{ color: 'var(--ax-danger-500, #ef4444)' }}>*</span>}
        </label>
      </div>
      {error && (
        <div className="ax-field-feedback ax-field-feedback--error" role="alert">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 12, height: 12 }}>
            <circle cx="12" cy="12" r="9" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

interface UploadDropzoneProps {
  id: string;
  label: string;
  required?: boolean;
  accept?: string;
  file: File | null;
  preview?: string;
  onSelect: (file: File) => void;
  onRemove: () => void;
  onPreviewClick?: () => void;
  error?: string;
}

function UploadDropzone({
  id,
  label,
  required,
  accept = 'image/*,.pdf',
  file,
  preview,
  onSelect,
  onRemove,
  onPreviewClick,
  error,
}: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove();
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const chosen = e.dataTransfer.files?.[0];
    if (chosen) {
      onSelect(chosen);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label
        htmlFor={id}
        style={{
          fontSize: '12.5px',
          fontWeight: 600,
          color: error ? 'var(--ax-danger-500, #ef4444)' : 'var(--ax-text-strong, #334155)',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <span>{label}</span>
        {required && <span style={{ color: 'var(--ax-danger-500, #ef4444)' }}>*</span>}
      </label>

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        capture="environment"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onSelect(f);
        }}
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
            : isHovered
            ? '1.5px dashed #94a3b8'
            : '1.5px dashed #cbd5e1',
          borderRadius: 8,
          background: isDragging
            ? '#eff6ff'
            : error
            ? '#fef2f2'
            : isHovered
            ? '#fbfcfd'
            : '#ffffff',
          padding: 14,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          minHeight: 110,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {preview ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 12 }}>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, cursor: 'pointer' }}
              onClick={(e) => {
                if (onPreviewClick) {
                  e.stopPropagation();
                  onPreviewClick();
                }
              }}
              title="Click to view full preview"
            >
              <img
                src={preview}
                alt={label}
                style={{
                  width: 56,
                  height: 56,
                  objectFit: 'cover',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  flexShrink: 0,
                }}
              />
              <div style={{ minWidth: 0, textAlign: 'left' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file?.name || 'Uploaded photo evidence'}
                </div>
                <div style={{ fontSize: 11, color: '#16a34a', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>✓</span>
                  <span>{file ? `${(file.size / 1024).toFixed(0)} KB · Ready to upload` : 'Existing image loaded · Click to preview'}</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              className="ax-btn ax-btn--ghost ax-btn--sm"
              onClick={handleClear}
              style={{ color: '#ef4444', flexShrink: 0, fontWeight: 600 }}
              title="Remove photo"
            >
              Remove
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, textAlign: 'center' }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: '#eff6ff',
                color: '#2563eb',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 2,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                <path d="M12 12v9" />
                <path d="m8 16 4-4 4 4" />
              </svg>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
              Click to upload or drag &amp; drop
            </div>
            <div style={{ fontSize: 11, color: '#64748b' }}>
              Take photo or select JPG, PNG, WEBP (Max 5MB)
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="ax-field-feedback ax-field-feedback--error" role="alert">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 12, height: 12 }}>
            <circle cx="12" cy="12" r="9" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}