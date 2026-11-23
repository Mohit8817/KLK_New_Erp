import {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  type FormEvent,
  type ChangeEvent,
} from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useAuth } from '../../../../../context/AuthContext';
import authService from '../../../../../services/authService';
import {
  biharSslInstallationService,
  getMediaUrl,
  type SslLightDropdownItem,
  type SslLightDetail,
} from '../../bihar-services';
import { SkeletonLine, SkeletonRect } from '../../../../../common/skeletons/SkeletonPrimitives';
import { CameraBarcodeScannerModal } from './CameraBarcodeScannerModal';
import {
  extractBackendError,
  formatMissingRequiredMsg,
  scrollToFirstError,
} from '../../../common-services/vPortalFormUtils';

// Unified Single-Card Layout matching Karnataka SWP Site Reference
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
.ssl-section-block { padding-top: var(--ax-space-2, 8px); }
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

/* 3-column Grid */
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

/* Sticky action footer */
.ssl-form-sticky-bar,
.bihar-form-sticky-bar {
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

@keyframes bihar-spin { to { transform: rotate(360deg); } }
`;

const MAX_FILE = 2 * 1024 * 1024;

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
  latitude: 'Latitude is required. Please click "Auto-detect GPS" or enter manually.',
  longitude: 'Longitude is required. Please click "Auto-detect GPS" or enter manually.',
  light_file: 'Installed Light photograph is required.',
};

const TEXT_KEYS = [
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
] as const;

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

export function Bihar_Installation_SSL_InstallLight() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editIdParam = searchParams.get('id') || searchParams.get('ssl_id') || searchParams.get('unique_id');
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

  // Vendor resolution matching AuthContext
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

  // Dropdown & Site Detail States
  const [dropdownLoading, setDropdownLoading] = useState(true);
  const [lightOptions, setLightOptions] = useState<SslLightDropdownItem[]>([]);
  const [selectedUniqueId, setSelectedUniqueId] = useState('');

  const [detailLoading, setDetailLoading] = useState(false);
  const [siteDetail, setSiteDetail] = useState<SslLightDetail | null>(null);

  // Form State
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [lightFile, setLightFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [modalImage, setModalImage] = useState<string | null>(null);

  // Scanner Modal Target State
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
        return 'Panel / Module Number';
      case 'lightNo':
        return 'Light / Luminary Number';
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

  // Quick helper to fill equipment serial numbers registered in ERP Master
  const handlePrefillMasterEquipment = useCallback(() => {
    if (!siteDetail) return;
    setForm((p) => ({
      ...p,
      uuidNo: siteDetail.uuid_no || p.uuidNo,
      batteryNo: siteDetail.battery_serial_no || siteDetail.battery_no || p.batteryNo,
      panelNo: siteDetail.module_no || siteDetail.panel_no || p.panelNo,
      lightNo: siteDetail.light_no || siteDetail.luminary_no || p.lightNo,
    }));
    setErrors((p) => {
      const next = { ...p };
      delete next.uuidNo;
      delete next.batteryNo;
      delete next.panelNo;
      delete next.lightNo;
      return next;
    });
  }, [siteDetail]);

  // Quick helper to fill official survey beneficiary and location details
  const handlePrefillMasterBeneficiary = useCallback(() => {
    if (!siteDetail) return;
    setForm((p) => ({
      ...p,
      wardNo: siteDetail.ward_no || p.wardNo,
      poleNo: siteDetail.pole_no || p.pole_no,
      beneficiaryName: siteDetail.beneficiary_name || p.beneficiaryName,
      contactNo: siteDetail.contact_no || p.contactNo,
    }));
    setErrors((p) => {
      const next = { ...p };
      delete next.wardNo;
      delete next.poleNo;
      delete next.beneficiaryName;
      delete next.contactNo;
      return next;
    });
  }, [siteDetail]);

  // Fetch Dropdown List
  useEffect(() => {
    let active = true;
    (async () => {
      setDropdownLoading(true);
      try {
        const list = await biharSslInstallationService.fetchLightNames();
        if (active) setLightOptions(Array.isArray(list) ? list : []);
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
        const detail = await biharSslInstallationService.fetchLightDetail(uid);
        setSiteDetail(detail);

        // In new installation mode, input fields must NOT be auto-filled from site survey detail.
        // The installer / user enters and barcode-scans them manually on site.
        // Only pre-fill input fields if explicitly in Edit Mode.
        if (isEditMode && detail) {
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
        } else {
          // New installation mode: Keep form fields blank
          setForm(EMPTY_FORM);
          setLightFile(null);
          setFilePreview(null);
          setExistingImageUrl(null);
          setTouched({});
          setErrors({});
        }
      } catch (err) {
        console.error('[InstallLight] fetch detail error:', err);
        setSiteDetail(null);
        setErrorMsg('Could not fetch light details.');
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
            return [
              {
                id: Number(editIdParam) || (editIdParam as any),
                unique_id: d.unique_id || d.uid || `${editIdParam}`,
              },
              ...prev,
            ];
          });
          setErrors({});
        }
      } catch (err) {
        console.error('[InstallLight] fetch edit details error:', err);
      } finally {
        if (active) setDetailLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [editIdParam]);

  // GPS Auto-detect
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
        setGpsStatusMsg(`Unable to lock GPS: ${err.message}.`);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  }, []);

  // Auto-detect GPS coordinates on mount or light selection
  useEffect(() => {
    handleDetectGps();
  }, [selectedUniqueId, handleDetectGps]);

  // Photo handlers
  const handleFileChange = (file: File) => {
    if (file.size > MAX_FILE) {
      alert(`File "${file.name}" exceeds the 2 MB limit.`);
      return;
    }
    if (filePreview) URL.revokeObjectURL(filePreview);
    setLightFile(file);
    setFilePreview(URL.createObjectURL(file));
    setErrors((p) => ({ ...p, light_file: '' }));
  };

  const removeFile = () => {
    if (filePreview) URL.revokeObjectURL(filePreview);
    setLightFile(null);
    setFilePreview(null);
    setExistingImageUrl(null);
  };

  // Progress metrics
  const totalRequired = 1 + TEXT_KEYS.length + 1;
  const completedRequired =
    (selectedUniqueId ? 1 : 0) +
    TEXT_KEYS.filter((k) => form[k].trim() !== '').length +
    (lightFile || (isEditMode && existingImageUrl) ? 1 : 0);
  const progressPercent = Math.round((completedRequired / totalRequired) * 100);
  const errorCount = Object.keys(errors).filter((k) => errors[k]).length;

  // Site Info Items (24 items from Bihar SSL API)
  const siteInfoItems = useMemo(() => {
    const d = (siteDetail || {}) as Record<string, unknown>;
    return [
      { label: 'Vendor Name', value: selectedUniqueId ? formatInfo(loginVendorName || d.vendor || d.vendor_name) : 'N/A' },
      { label: 'State', value: formatInfo(d.state || 'Bihar') },
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
      { label: 'UUID No.', value: formatInfo(d.uuid_no) },
      { label: 'Luminary / Light No.', value: formatInfo(d.light_no || d.luminary_no) },
      { label: 'Sim No.', value: formatInfo(d.sim_no) },
      { label: 'Battery Serial No.', value: formatInfo(d.battery_serial_no || d.battery_no) },
      { label: 'Module No.', value: formatInfo(d.module_no || d.panel_no) },
      { label: 'Supply', value: formatInfo(d.supply) },
      { label: 'Material Inspection', value: formatInfo(d.material_inspection) },
      { label: 'Installation', value: formatInfo(d.installation) },
      { label: 'Date of Installation', value: formatInfo(d.date_of_installation) },
      { label: 'Installed By', value: formatInfo(d.installed_by) },
      { label: 'Inspected by Breda', value: formatInfo(d.inspected_by_breda) },
    ];
  }, [siteDetail, selectedUniqueId, loginVendorName]);

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
    if (!lightFile && !(isEditMode && existingImageUrl)) {
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
      const extracted = extractBackendError(err, 'Failed to submit installation details.');
      setErrorMsg(extracted.message);
      if (extracted.fieldErrors && Object.keys(extracted.fieldErrors).length > 0) {
        setErrors((prev) => ({ ...prev, ...extracted.fieldErrors }));
        setTimeout(() => scrollToFirstError(), 50);
      } else if (typeof extracted.message === 'string' && extracted.message.toLowerCase().includes('master')) {
        setErrors((prev) => ({
          ...prev,
          uuidNo: 'UUID No. must be registered in ERP Master',
          batteryNo: 'Battery No. must be registered in ERP Master',
          panelNo: 'Module No. must be registered in ERP Master',
          lightNo: 'Light No. must be registered in ERP Master',
        }));
        setTimeout(() => scrollToFirstError(), 50);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const resolvedPreview = filePreview || (existingImageUrl ? getMediaUrl(existingImageUrl) : '');

  return (
    <div className="solar-erp-page ssl-inst-form">
      <style>{SINGLE_CARD_FORM_CSS}</style>

      {/* ── Page Head matching Karnataka SWP Reference ── */}
      <PageHead
        title={isEditMode ? 'Edit Installed Light' : 'Install Light'}
        subtitle={
          isEditMode
            ? `Update installation verification form for Bihar SSL ${selectedUniqueId || editIdParam || ''}`
            : 'Complete installation verification form for assigned Bihar SSL sites'
        }
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Bihar' },
          { label: 'Installation' },
          { label: 'SSL', href: '/v/ssl/installation-dashboard' },
          { label: isEditMode ? 'Edit Light' : 'Install Light' },
        ]}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {isEditMode ? (
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--sm"
                onClick={() => navigate('/v/ssl/view-ssl-complete-site#completed')}
                style={{ fontWeight: 600 }}
              >
                ← Back to Details
              </button>
            ) : (
              <Link to="/v/ssl/view-assigned-ssl-site" className="ax-btn ax-btn--secondary ax-btn--sm">
                View Assigned Lights
              </Link>
            )}
          </div>
        }
      />

      {/* ── Alerts ── */}
      {successMsg && (
        <div className="ax-alert ax-alert--success" style={{ marginBottom: 'var(--ax-space-4)' }} role="status">
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

      {/* ── Main Single-Card Form ── */}
      <form onSubmit={handleSubmit} noValidate className="ax-card">
        {/* ── Header with Section Navigation Pills ── */}
        <div className="ax-card__header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h2 className="ax-card__title" style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                {isEditMode ? 'Edit Installation Details' : 'Solar Street Light Installation Form'}
              </h2>
              <p className="ax-card__subtitle" style={{ fontSize: '0.85rem', color: 'var(--ax-text-muted, #64748b)', margin: '2px 0 0' }}>
                {isEditMode
                  ? 'Update existing solar street light equipment serials, GPS coordinates, and verification photographs.'
                  : 'Capture Solar Street Light (SSL) equipment serials, GPS coordinates, and field verification photographs.'}
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
                  {isEditMode
                    ? 'Editing existing installation record'
                    : 'Choose from assigned solar street light sites pending installation in Bihar'}
                </span>
              </div>
            </div>

            <div className="ssl-form-grid" style={{ marginBottom: 16 }}>
              {/* Unique ID select */}
              <div>
                {dropdownLoading ? (
                  <SkeletonRect width="100%" height={46} borderRadius="8px" />
                ) : isEditMode ? (
                  <div className="ax-float">
                    <input
                      id="ssl_unique_id"
                      type="text"
                      className="ax-float__input"
                      value={`Site ${selectedUniqueId}`}
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
                      label: o.unique_id || `Site${o.id}`,
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
                    value={selectedUniqueId ? loginVendorName || siteDetail?.vendor || 'N/A' : ''}
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
                  ? 'Official Bihar SSL site records & prefilled specifications:'
                  : 'Select a Unique ID above to fetch Bihar SSL site specifications.'}
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
                readOnly
                placeholder="Auto-detected GPS Latitude"
                required
                error={touched.latitude || submitted ? errors.latitude : undefined}
              />

              <FloatingInput
                label="Installation Longitude"
                name="longitude"
                value={form.longitude}
                onChange={() => {}}
                readOnly
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
                  Upload clear field photograph of the installed solar street light (Max 2MB)
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <UploadDropzone
                id="light_file"
                label="Installed Light Photograph"
                required={!isEditMode || !existingImageUrl}
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

          {/* Sticky Action Footer (matching Register SSL Complaint design) */}
          <div className="bihar-form-sticky-bar">
            <span className="ax-badge ax-badge--soft ax-badge--primary ax-badge--pill">
              {isEditMode ? 'Edit Mode' : 'New Installation'}
            </span>
            <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)' }}>
              <button
                type="button"
                className="ax-btn ax-btn--secondary"
                onClick={() => {
                  const isV = window.location.pathname.startsWith('/v/') || window.location.pathname.startsWith('v/');
                  navigate(isV ? '/v/bihar/installation/ssl/installation-detail' : '/bihar/installation/ssl/installation-detail');
                }}
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
                      style={{ animation: 'bihar-spin 1s linear infinite' }}
                    >
                      <path d="M12 3a9 9 0 1 0 9 9" />
                    </svg>
                    <span className="ax-btn__label">
                      {isEditMode ? 'Updating Installation...' : 'Submitting Installation...'}
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
                      {isEditMode ? 'Update Installation' : 'Submit Installation'}
                    </span>
                  </>
                )}
              </button>
            </div>
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

/* ───────── Reusable Components matching Karnataka SWP Reference ───────── */

interface FloatingInputProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  type?: string;
  maxLength?: number;
  placeholder?: string;
  onCameraClick?: () => void;
  error?: string;
  style?: React.CSSProperties;
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
  type = 'text',
  maxLength,
  placeholder,
  onCameraClick,
  error,
  style,
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
          ...(readOnly ? { cursor: 'not-allowed', backgroundColor: 'var(--ax-surface-subtle, #f8fafc)' } : {}),
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
  accept = 'image/*',
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
                  border: '1px solid #e2e8f0',
                  flexShrink: 0,
                }}
              />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file ? file.name : label}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: 2 }}>
                  {file ? `${(file.size / 1024).toFixed(0)} KB · Ready for upload` : 'Existing image loaded (click to preview)'}
                </div>
              </div>
            </div>
            <button
              type="button"
              className="ax-btn ax-btn--ghost ax-btn--sm"
              onClick={handleClear}
              style={{ color: '#ef4444', flexShrink: 0 }}
            >
              Remove
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 4 }}>
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
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </div>
            <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#334155' }}>
              Click to capture or upload photograph
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
              JPEG, PNG or WebP · Drag & drop supported
            </div>
          </div>
        )}
      </div>

      {error && (
        <span style={{ fontSize: '11px', color: 'var(--ax-danger-500, #ef4444)' }}>
          {error}
        </span>
      )}
    </div>
  );
}

export default Bihar_Installation_SSL_InstallLight;
