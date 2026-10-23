import { useState, useEffect, useCallback, useRef, useMemo, type FormEvent, type ChangeEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  biharUlaInstallationService,
  type SiteDetailResponse,
} from '../../bihar-services';

// CSS for Unified Single-Card Layout with Floating Labels & Section Dividers (same as Jammu form)
const SINGLE_CARD_FORM_CSS = `
.ula-inst-form .ax-card {
  border: 1px solid var(--ax-border);
  border-radius: var(--ax-radius-xl);
  background: var(--ax-surface-solid);
  box-shadow: var(--ax-shadow-sm);
  overflow: hidden;
}
.ula-inst-form .ax-card__header {
  padding: var(--ax-space-5) var(--ax-space-6);
  border-bottom: 1px solid var(--ax-border-subtle);
  background: var(--ax-surface-subtle);
  display: flex;
  flex-direction: column;
  gap: var(--ax-space-4);
}
.ula-inst-form .ax-card__body { padding: var(--ax-space-6); }

/* Quick Section Nav Pills */
.ula-section-pills {
  display: flex;
  gap: var(--ax-space-2);
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: thin;
}
.ula-section-pill-btn {
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
.ula-section-pill-btn:hover {
  border-color: var(--ax-accent);
  color: var(--ax-accent);
  background: color-mix(in srgb, var(--ax-accent) 6%, var(--ax-surface-solid));
}
.ula-section-pill-btn .pill-num {
  width: 18px; height: 18px; border-radius: 50%;
  background: var(--ax-surface-subtle);
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 700;
}

/* Section Block */
.ula-section-block { padding-top: var(--ax-space-2); }
.ula-section-header {
  display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap;
  gap: var(--ax-space-2);
  margin-bottom: var(--ax-space-5);
  padding-bottom: var(--ax-space-3);
  border-bottom: 1px solid var(--ax-border-subtle);
}
.ula-section-title-wrap { display: flex; flex-direction: column; gap: 4px; }
.ula-section-divider {
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
.ax-float__input:focus + .ax-float__label,
.ax-float__input:not(:placeholder-shown) + .ax-float__label,
.ax-float--select .ax-float__label {
  top: 0;
  transform: translateY(-50%);
  font-size: var(--ax-text-2xs);
  font-weight: 500;
  color: var(--ax-text-muted);
}
.ax-float__input:focus + .ax-float__label { color: var(--ax-accent); }

/* Validation states */
.ax-float__input.is-invalid { border-color: var(--ax-danger-500) !important; }
.ax-float__input.is-invalid:focus { box-shadow: 0 0 0 3px color-mix(in srgb, var(--ax-danger-500) 24%, transparent) !important; }
.ax-float__input.is-invalid + .ax-float__label { color: var(--ax-danger-500) !important; }
.ax-float__input.is-valid { border-color: var(--ax-success-500) !important; }
.ax-float__input.is-valid:focus { box-shadow: 0 0 0 3px color-mix(in srgb, var(--ax-success-500) 24%, transparent) !important; }
.ax-float__input.is-valid + .ax-float__label { color: var(--ax-success-500) !important; }

/* Feedback */
.ax-field-feedback {
  display: flex; align-items: center; gap: 4px;
  margin-top: 4px;
  font-size: var(--ax-text-2xs);
  min-height: 16px;
}
.ax-field-feedback--error { color: var(--ax-danger-500); }
.ax-field-feedback--success { color: var(--ax-success-500); }

/* Grid */
.ula-form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--ax-space-4);
}
@media (min-width: 1024px) {
  .ula-form-grid--3col { grid-template-columns: repeat(3, 1fr); }
}
.ula-form-col-span-full { grid-column: 1 / -1; }

/* Selected site info cards */
.ula-site-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--ax-space-3);
}
@media (min-width: 1024px) {
  .ula-site-info-grid { grid-template-columns: repeat(3, 1fr); }
}
.ula-site-info-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  padding: var(--ax-space-3) var(--ax-space-4);
  background: var(--ax-surface-solid);
  border: 1px solid var(--ax-border);
  border-radius: var(--ax-radius-lg);
}
.ula-site-info-card__label {
  font-size: var(--ax-text-2xs);
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--ax-text-muted);
}
.ula-site-info-card__value {
  font-size: var(--ax-text-base);
  font-weight: 600;
  color: var(--ax-text-strong);
  overflow-wrap: anywhere;
}

/* Photo cards */
.ula-photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--ax-space-4);
}
.ula-photo-card {
  border: 1px solid var(--ax-border);
  border-radius: var(--ax-radius-lg);
  padding: var(--ax-space-4);
  background: var(--ax-surface-solid);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: var(--ax-space-3);
  min-height: 170px;
  transition: border-color var(--ax-motion-fast) var(--ax-ease-standard);
}
.ula-photo-card.is-valid { border-color: var(--ax-success-500); }
.ula-photo-card.is-invalid { border-color: var(--ax-danger-500); }
.ula-photo-thumbs { display: flex; flex-wrap: wrap; gap: var(--ax-space-2); }
.ula-photo-thumb {
  position: relative;
  width: 52px; height: 52px;
  border-radius: var(--ax-radius-sm);
  overflow: hidden;
  border: 1px solid var(--ax-border);
  cursor: pointer;
}
.ula-photo-thumb img { width: 100%; height: 100%; object-fit: cover; }
.ula-photo-thumb__remove {
  position: absolute; top: 2px; right: 2px;
  width: 16px; height: 16px;
  border-radius: 50%;
  border: 0; padding: 0;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  background: var(--ax-surface-solid);
  color: var(--ax-text-strong);
  box-shadow: var(--ax-shadow-sm);
}

/* Sticky footer */
.ula-form-sticky-bar {
  position: sticky;
  bottom: var(--ax-space-4);
  z-index: 30;
  margin-top: var(--ax-space-6);
  padding: var(--ax-space-3) var(--ax-space-5);
  background: var(--ax-surface-solid);
  border: 1px solid var(--ax-border);
  border-radius: var(--ax-radius-xl);
  box-shadow: var(--ax-shadow-lg);
  display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap;
  gap: var(--ax-space-3);
  backdrop-filter: blur(12px);
}
`;

/* ── Inline SVG Icons ── */
const iconProps = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };

const ICON_CROSSHAIR = (
  <svg className="ax-btn__icon" {...iconProps}>
    <circle cx="12" cy="12" r="10" />
    <line x1="22" y1="12" x2="18" y2="12" />
    <line x1="6" y1="12" x2="2" y2="12" />
    <line x1="12" y1="6" x2="12" y2="2" />
    <line x1="12" y1="22" x2="12" y2="18" />
  </svg>
);
const ICON_CAMERA = (
  <svg className="ax-btn__icon" {...iconProps}>
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);
const ICON_GALLERY = (
  <svg className="ax-btn__icon" {...iconProps}>
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);
const ICON_CHECK = (
  <svg style={{ width: 14, height: 14 }} {...iconProps}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const ICON_DOT = (
  <svg style={{ width: 14, height: 14 }} {...iconProps}>
    <circle cx="12" cy="12" r="9" />
  </svg>
);
const ICON_X = (
  <svg style={{ width: 10, height: 10 }} {...iconProps}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

interface FieldStatusProps {
  className: string;
  isValid: boolean;
  isInvalid: boolean;
}

// null / undefined / empty / 0 → "N/A"
const formatInfo = (v: unknown): string => {
  if (v === null || v === undefined) return 'N/A';
  const s = String(v).trim();
  if (s === '' || s === '0') return 'N/A';
  return s;
};

export function Bihar_Installation_ULA_InstallationDetails() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();

  // ── Step 1: Site Selection ──
  const [siteOptions, setSiteOptions] = useState<{ id: number; beneficiary_name: string }[]>([]);
  const [loadingSites, setLoadingSites] = useState(true);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [siteDetails, setSiteDetails] = useState<SiteDetailResponse | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // ── Step 2: Installation & GPS ──
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [caNumber, setCaNumber] = useState('');
  const [moduleSerial1, setModuleSerial1] = useState('');
  const [moduleSerial2, setModuleSerial2] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [gpsDetecting, setGpsDetecting] = useState(false);
  const [gpsStatusMsg, setGpsStatusMsg] = useState<string | null>(null);

  // ── Step 3: Photos ──
  // 1. Foundation & Fastener (1 to 4 photos)
  const [fastenerPhotos, setFastenerPhotos] = useState<File[]>([]);
  const [fastenerPreviews, setFastenerPreviews] = useState<string[]>([]);

  // 2. Structure (1 photo)
  const [structurePhoto, setStructurePhoto] = useState<File | null>(null);
  const [structurePreview, setStructurePreview] = useState<string | null>(null);

  // 3. Module Serial Number 1 (1 photo)
  const [module1Photo, setModule1Photo] = useState<File | null>(null);
  const [module1Preview, setModule1Preview] = useState<string | null>(null);

  // 4. Module Serial Number 2 (1 photo)
  const [module2Photo, setModule2Photo] = useState<File | null>(null);
  const [module2Preview, setModule2Preview] = useState<string | null>(null);

  // Preview Modal for clicked image
  const [modalImage, setModalImage] = useState<{ url: string; title: string } | null>(null);

  // ── Validation / Submission State ──
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load site dropdown options
  const loadSites = useCallback(async () => {
    setLoadingSites(true);
    try {
      const names = await biharUlaInstallationService.fetchSiteNames();
      setSiteOptions(names || []);
    } catch (err: any) {
      console.error('[ULA Installation] fetchSiteNames error:', err);
    } finally {
      setLoadingSites(false);
    }
  }, []);

  useEffect(() => {
    loadSites();
  }, [loadSites]);

  useEffect(() => {
    if (id) {
      handleSiteChange(String(id));
    }
  }, [id]);

  // Auto GPS location on initial page load
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
        setLatitude(lat);
        setLongitude(lng);
        setErrors((prev) => ({ ...prev, latitude: '', longitude: '' }));
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

  useEffect(() => {
    handleDetectGps();
  }, [handleDetectGps]);

  /* ───────── Validation helpers ───────── */
  const textMessages: Record<string, string> = {
    site: 'Please select a Site Name from the dropdown.',
    beneficiaryName: 'Beneficiary Name is required.',
    contactNo: 'Contact Number is required.',
    caNumber: 'CA Number is required.',
    moduleSerial1: 'Module Serial Number 1 is required.',
    moduleSerial2: 'Module Serial Number 2 is required.',
    latitude: 'GPS Latitude is required. Please click "Retry GPS Lock".',
    longitude: 'GPS Longitude is required. Please click "Retry GPS Lock".',
  };

  const validateText = (name: string, value: string): string =>
    value.trim() ? '' : textMessages[name] || 'This field is required.';

  const setText = (name: string, value: string, setter: (v: string) => void) => {
    setter(value);
    setErrors((prev) => ({ ...prev, [name]: validateText(name, value) }));
  };

  const handleBlur = (name: string) => setTouched((prev) => ({ ...prev, [name]: true }));

  const getStatus = (name: string, value: unknown): FieldStatusProps => {
    const isFieldTouched = touched[name] || submitted;
    if (!isFieldTouched) return { className: '', isValid: false, isInvalid: false };
    if (errors[name]) return { className: 'is-invalid', isValid: false, isInvalid: true };
    if (value !== null && value !== undefined && String(value).trim() !== '') {
      return { className: 'is-valid', isValid: true, isInvalid: false };
    }
    return { className: '', isValid: false, isInvalid: false };
  };

  // Load site details when dropdown changes
  const handleSiteChange = async (siteIdStr: string) => {
    setSelectedSiteId(siteIdStr);
    setErrors((prev) => ({ ...prev, site: validateText('site', siteIdStr) }));
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!siteIdStr) {
      setSiteDetails(null);
      setBeneficiaryName('');
      setContactNo('');
      setCaNumber('');
      return;
    }

    setLoadingDetails(true);
    try {
      const details = await biharUlaInstallationService.fetchSiteDetails(siteIdStr);
      setSiteDetails(details);
      if (details) {
        if (details.beneficiary_name) setBeneficiaryName(details.beneficiary_name);
        if (details.contact_no) setContactNo(details.contact_no);
        if (details.ca_no) setCaNumber(details.ca_no);
        setErrors((prev) => ({
          ...prev,
          beneficiaryName: details.beneficiary_name ? '' : prev.beneficiaryName,
          contactNo: details.contact_no ? '' : prev.contactNo,
          caNumber: details.ca_no ? '' : prev.caNumber,
        }));
      }
    } catch (err: any) {
      console.error('[ULA Installation] fetchSiteDetails error:', err);
      setSiteDetails(null);
      setErrorMsg('Failed to load beneficiary details for this site.');
    } finally {
      setLoadingDetails(false);
    }
  };

  // Info cards shown under Site Name (State, District, Block, Village, Location, Sanction Load, Plant SC, WO No., Phase)
  const siteInfoItems = useMemo(() => {
    if (!siteDetails) return [];
    const d = siteDetails as unknown as Record<string, unknown>;
    return [
      { label: 'State', value: formatInfo(d.state) },
      { label: 'District', value: formatInfo(d.district) },
      { label: 'Block Name', value: formatInfo(d.block) },
      { label: 'Village Name', value: formatInfo(d.village) },
      { label: 'Location', value: formatInfo(d.address) },
      { label: 'Sanction Load', value: formatInfo(d.sanction_load) },
      { label: 'Plant SC', value: formatInfo(d.plant_sc) },
      { label: 'WO No.', value: formatInfo(d.wo_no) },
      { label: 'Phase', value: formatInfo(d.phase) },
    ];
  }, [siteDetails]);

  // ── Foundation & Fastener Multi-File Handler (up to 4) ──
  const handleFastenerFiles = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remainingSlots = 4 - fastenerPhotos.length;
    if (remainingSlots <= 0) {
      alert('Maximum 4 photos allowed for Foundation & Fastener.');
      e.target.value = '';
      return;
    }

    const validFiles: File[] = [];
    for (const f of files.slice(0, remainingSlots)) {
      if (f.size > 2 * 1024 * 1024) {
        alert(`File "${f.name}" exceeds the 2 MB limit.`);
      } else {
        validFiles.push(f);
      }
    }

    if (validFiles.length) {
      setFastenerPhotos((prev) => [...prev, ...validFiles]);
      setFastenerPreviews((prev) => [...prev, ...validFiles.map((f) => URL.createObjectURL(f))]);
      setErrors((prev) => ({ ...prev, fastener: '' }));
    }
    e.target.value = '';
  };

  const removeFastenerPhoto = (index: number) => {
    setFastenerPhotos((prev) => prev.filter((_, i) => i !== index));
    setFastenerPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Single Photo Handler ──
  const handleSinglePhoto = (
    e: ChangeEvent<HTMLInputElement>,
    key: string,
    setter: (f: File | null) => void,
    previewSetter: (u: string | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert(`File "${file.name}" exceeds the 2 MB limit.`);
      e.target.value = '';
      return;
    }

    setter(file);
    previewSetter(URL.createObjectURL(file));
    setErrors((prev) => ({ ...prev, [key]: '' }));
    e.target.value = '';
  };

  const removeSinglePhoto = (setter: (f: File | null) => void, previewSetter: (u: string | null) => void) => {
    setter(null);
    previewSetter(null);
  };

  // Calculate captured photos count out of 4 sections
  const capturedCount = useMemo(() => {
    let count = 0;
    if (fastenerPhotos.length > 0) count++;
    if (structurePhoto) count++;
    if (module1Photo) count++;
    if (module2Photo) count++;
    return count;
  }, [fastenerPhotos.length, structurePhoto, module1Photo, module2Photo]);

  // Completion (required text fields + 4 photo groups + site)
  const textValues: Record<string, string> = {
    site: selectedSiteId,
    beneficiaryName,
    contactNo,
    caNumber,
    moduleSerial1,
    moduleSerial2,
    latitude,
    longitude,
  };
  const textKeys = Object.keys(textValues);
  const totalRequired = textKeys.length + 4;
  const completedRequired = textKeys.filter((k) => textValues[k].trim() !== '').length + capturedCount;
  const progressPercent = Math.round((completedRequired / totalRequired) * 100);

  // Form Reset / Cancel
  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? Any unsaved inputs will be lost.')) {
      navigate('/v/bihar/ula-installation-view-site');
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Form Submit
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setSubmitted(true);

    const newErrors: Record<string, string> = {};
    textKeys.forEach((k) => {
      const err = validateText(k, textValues[k]);
      if (err) newErrors[k] = err;
    });
    if (fastenerPhotos.length === 0) newErrors.fastener = 'Please capture at least 1 photo for Foundation & Fastener (1 to 4 allowed).';
    if (!structurePhoto) newErrors.structure = 'Structure photo is required.';
    if (!module1Photo) newErrors.module1 = 'Photo for Module with Serial Number 1 is required.';
    if (!module2Photo) newErrors.module2 = 'Photo for Module with Serial Number 2 is required.';

    setErrors(newErrors);

    const order = ['site', 'beneficiaryName', 'contactNo', 'caNumber', 'moduleSerial1', 'moduleSerial2', 'latitude', 'longitude', 'fastener', 'structure', 'module1', 'module2'];
    const firstKey = order.find((k) => newErrors[k]);
    if (firstKey) {
      setErrorMsg(newErrors[firstKey]);
      setTimeout(() => {
        const firstErr = document.querySelector('.ula-inst-form .is-invalid');
        if (firstErr) {
          firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
          (firstErr as HTMLElement).focus?.();
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 50);
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('site_id', selectedSiteId);
      fd.append('beneficiary_name', beneficiaryName.trim());
      fd.append('contact_no', contactNo.trim());
      fd.append('ca_no', caNumber.trim());

      // GPS Coordinates (appending both keys for backend resilience)
      fd.append('inst_latitude', latitude.trim());
      fd.append('latitude', latitude.trim());
      fd.append('inst_longitude', longitude.trim());
      fd.append('longitude', longitude.trim());

      // Module Serial Numbers (exactly 2)
      fd.append('module_serial_no[]', moduleSerial1.trim());
      fd.append('module_serial_no[]', moduleSerial2.trim());

      // Structure Photo
      fd.append('structure_image', structurePhoto as File);

      // Foundation & Fastener (1 to 4 photos)
      fastenerPhotos.forEach((file) => {
        fd.append('foundation_fastener_images[]', file);
      });

      // Module Serial Photos (exactly 2 photos)
      fd.append('module_serial_image[]', module1Photo as File);
      fd.append('module_serial_image[]', module2Photo as File);

      const resp = await biharUlaInstallationService.storeStructureInstall(fd);
      setSuccessMsg(resp.message || 'Site Structure Installation saved successfully!');
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Redirect after brief delay
      setTimeout(() => {
        navigate('/v/bihar/ula-installation-view-site');
      }, 1500);
    } catch (err: any) {
      console.error('[ULA Installation] submit error:', err);
      setErrorMsg(err?.message || 'Failed to submit site installation data. Please verify inputs.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  const errorCount = Object.keys(errors).filter((k) => errors[k]).length;

  return (
    <div className="ax-page ula-inst-form">
      <style>{SINGLE_CARD_FORM_CSS}</style>

      {/* ── Page Header ── */}
      <PageHead
        title="ULA Installation"
        subtitle="Bihar ULA Installation & Physical Site Verification"
        breadcrumbs={[
          { label: 'Bihar' },
          { label: 'Installation' },
          { label: 'ULA' },
          { label: 'Installation Details' },
        ]}
        actions={
          <Link to="/v/bihar/ula-installation-view-site" className="ax-btn ax-btn--secondary ax-btn--pill">
            <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12l14 0" />
              <path d="M5 12l6 6" />
              <path d="M5 12l6 -6" />
            </svg>
            <span className="ax-btn__label">View Installed Sites</span>
          </Link>
        }
      />

      {/* ── Alerts ── */}
      {successMsg && (
        <div className="ax-alert ax-alert--success" role="status" style={{ marginBottom: 'var(--ax-space-6)' }}>
          <span className="ax-alert__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5l10 -10" /></svg>
          </span>
          <div className="ax-alert__content">
            <h3 className="ax-alert__title" style={{ fontSize: 'var(--ax-text-base)', fontWeight: 600 }}>{successMsg}</h3>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="ax-alert ax-alert--danger" role="alert" style={{ marginBottom: 'var(--ax-space-6)' }}>
          <span className="ax-alert__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4" /><path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0" /><path d="M12 16h.01" /></svg>
          </span>
          <div className="ax-alert__content">
            <h4 className="ax-alert__title" style={{ fontWeight: 600 }}>{errorMsg}</h4>
            {submitted && errorCount > 1 && (
              <p className="ax-alert__message" style={{ margin: '4px 0 0' }}>
                {errorCount} fields need attention before this installation can be submitted.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Main Single Card Form ── */}
      <form onSubmit={handleSubmit} noValidate>
        <div className="ax-card">
          {/* Card Header with Title and Section Pills */}
          <div className="ax-card__header">
            <div className="ax-cluster" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--ax-space-3)' }}>
              <div>
                <span className="ax-card__eyebrow">Unified Card Architecture</span>
                <h2 className="ax-card__title" style={{ margin: 0 }}>ULA Installation Details</h2>
                <p className="ax-card__subtitle" style={{ margin: '4px 0 0' }}>
                  Site selection, installation &amp; GPS and mandatory photographs organized in one main card.
                </p>
              </div>


            </div>

            <div className="ula-section-pills" role="navigation" aria-label="Jump to section">
              {[
                { id: 'inst-sec-1', num: '1', title: 'Site' },
                { id: 'inst-sec-2', num: '2', title: 'Installation & GPS' },
                { id: 'inst-sec-3', num: '3', title: 'Photos' },
              ].map((s) => (
                <button key={s.id} type="button" onClick={() => scrollToSection(s.id)} className="ula-section-pill-btn">
                  <span className="pill-num">{s.num}</span>
                  <span>{s.title}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="ax-card__body">
            {/* ========== Section 1: Site ========== */}
            <div id="inst-sec-1" className="ula-section-block">
              <SectionHeader num="1" total="3" title="Site" subtitle="Select the site to auto-fill beneficiary details." />

              <div className="ula-form-grid">
                <div className="ula-form-col-span-full">
                  <FloatingSelect
                    id="site_select"
                    label={loadingDetails ? 'Site Name (Fetching beneficiary details…)' : 'Site Name'}
                    required
                    placeholder={loadingSites ? 'Loading sites...' : 'Select Site Name'}
                    value={selectedSiteId}
                    options={siteOptions.map((s) => ({ value: String(s.id), label: `${s.beneficiary_name} ${s.id ? `(#${s.id})` : ''}` }))}
                    disabled={loadingSites}
                    onChange={handleSiteChange}
                    onBlur={() => handleBlur('site')}
                    status={getStatus('site', selectedSiteId)}
                    error={errors.site}
                  />
                </div>
              </div>

              {/* Selected site info cards */}
              {loadingDetails && (
                <p style={{ margin: 'var(--ax-space-4) 0 0', fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>
                  <span className="ax-spinner" style={{ width: 14, height: 14, marginRight: 8 }} />
                  Fetching site details…
                </p>
              )}

              {!loadingDetails && siteDetails && (
                <div style={{ marginTop: 'var(--ax-space-4)' }}>
                  <p style={{ margin: '0 0 var(--ax-space-3)', fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>
                    Confirm this is the correct site before proceeding.
                  </p>
                  <div className="ula-site-info-grid">
                    {siteInfoItems.map((item) => (
                      <div key={item.label} className="ula-site-info-card">
                        <span className="ula-site-info-card__label">{item.label}</span>
                        <span className="ula-site-info-card__value">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <hr className="ula-section-divider" />

            {/* ========== Section 2: Installation & GPS ========== */}
            <div id="inst-sec-2" className="ula-section-block">
              <SectionHeader num="2" total="3" title="Installation & GPS" subtitle="Beneficiary info, module serial numbers and GPS location." />

              <div className="ula-form-grid ula-form-grid--3col">
                <FloatingInput
                  id="beneficiary_name"
                  label="Beneficiary Name"
                  required
                  placeholder="Enter Beneficiary Name"
                  value={beneficiaryName}
                  onChange={(v) => setText('beneficiaryName', v, setBeneficiaryName)}
                  onBlur={() => handleBlur('beneficiaryName')}
                  status={getStatus('beneficiaryName', beneficiaryName)}
                  error={errors.beneficiaryName}
                />

                <FloatingInput
                  id="contact_no"
                  label="Contact No."
                  type="tel"
                  maxLength={15}
                  required
                  placeholder="Enter Contact Number"
                  value={contactNo}
                  onChange={(v) => setText('contactNo', v, setContactNo)}
                  onBlur={() => handleBlur('contactNo')}
                  status={getStatus('contactNo', contactNo)}
                  error={errors.contactNo}
                />

                <FloatingInput
                  id="ca_number"
                  label="CA Number"
                  required
                  placeholder="Enter CA Number"
                  value={caNumber}
                  onChange={(v) => setText('caNumber', v, setCaNumber)}
                  onBlur={() => handleBlur('caNumber')}
                  status={getStatus('caNumber', caNumber)}
                  error={errors.caNumber}
                />

                <FloatingInput
                  id="module_serial_1"
                  label="Module Serial Number 1"
                  required
                  placeholder="Enter Module Serial No 1"
                  value={moduleSerial1}
                  onChange={(v) => setText('moduleSerial1', v, setModuleSerial1)}
                  onBlur={() => handleBlur('moduleSerial1')}
                  status={getStatus('moduleSerial1', moduleSerial1)}
                  error={errors.moduleSerial1}
                />

                <FloatingInput
                  id="module_serial_2"
                  label="Module Serial Number 2"
                  required
                  placeholder="Enter Module Serial No 2"
                  value={moduleSerial2}
                  onChange={(v) => setText('moduleSerial2', v, setModuleSerial2)}
                  onBlur={() => handleBlur('moduleSerial2')}
                  status={getStatus('moduleSerial2', moduleSerial2)}
                  error={errors.moduleSerial2}
                />

                {/* spacer keeps GPS row aligned on 3-col grid */}
                <div className="ula-form-col-span-full" style={{ marginTop: 'var(--ax-space-2)' }}>
                  <h4 style={{ margin: 0, fontSize: 'var(--ax-text-sm)', fontWeight: 600, color: 'var(--ax-text-strong)' }}>GPS Location</h4>
                </div>

                <FloatingInput
                  id="latitude"
                  label="Latitude"
                  required
                  placeholder="Latitude"
                  value={latitude}
                  onChange={(v) => setText('latitude', v, setLatitude)}
                  onBlur={() => handleBlur('latitude')}
                  status={getStatus('latitude', latitude)}
                  error={errors.latitude}
                />

                <FloatingInput
                  id="longitude"
                  label="Longitude"
                  required
                  placeholder="Longitude"
                  value={longitude}
                  onChange={(v) => setText('longitude', v, setLongitude)}
                  onBlur={() => handleBlur('longitude')}
                  status={getStatus('longitude', longitude)}
                  error={errors.longitude}
                />

                <div>
                  <button
                    type="button"
                    className="ax-btn ax-btn--secondary"
                    onClick={handleDetectGps}
                    disabled={gpsDetecting}
                    style={{ width: '100%', height: 46 }}
                  >
                    {gpsDetecting ? <span className="ax-spinner" style={{ width: 16, height: 16 }} /> : ICON_CROSSHAIR}
                    <span className="ax-btn__label">{gpsDetecting ? 'Locking GPS…' : 'Retry GPS Lock'}</span>
                  </button>
                </div>

                {gpsStatusMsg && (
                  <div className="ula-form-col-span-full">
                    <span
                      style={{
                        fontSize: 'var(--ax-text-xs)',
                        fontWeight: 500,
                        color: latitude && longitude ? 'var(--ax-success-500)' : 'var(--ax-text-muted)',
                      }}
                    >
                      {latitude && longitude ? '✓ ' : ''}
                      {gpsStatusMsg}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <hr className="ula-section-divider" />

            {/* ========== Section 3: Photos ========== */}
            <div id="inst-sec-3" className="ula-section-block">
              <SectionHeader
                num="3"
                total="3"
                title="Photos"
                subtitle={`${capturedCount} of 4 photos captured. Use Camera for a fresh photo on site, or Gallery for an existing one. Max 2MB each.`}
              />

              <div className="ula-photo-grid">
                <PhotoCard
                  title="2. Foundation & Fastener"
                  hint="Select 1 to 4 photos."
                  multiple
                  previews={fastenerPreviews}
                  count={fastenerPhotos.length}
                  max={4}
                  submitted={submitted}
                  error={errors.fastener}
                  onFiles={handleFastenerFiles}
                  onRemove={removeFastenerPhoto}
                  onPreview={(url, i) => setModalImage({ url, title: `Foundation & Fastener Photo #${i + 1}` })}
                />

                <PhotoCard
                  title="3. Structure"
                  hint=" "
                  previews={structurePreview ? [structurePreview] : []}
                  count={structurePhoto ? 1 : 0}
                  max={1}
                  submitted={submitted}
                  error={errors.structure}
                  onFiles={(e) => handleSinglePhoto(e, 'structure', setStructurePhoto, setStructurePreview)}
                  onRemove={() => removeSinglePhoto(setStructurePhoto, setStructurePreview)}
                  onPreview={(url) => setModalImage({ url, title: 'Structure Photo' })}
                />

                <PhotoCard
                  title="Module with Serial Number 1"
                  hint="Serial number must match the allocation."
                  previews={module1Preview ? [module1Preview] : []}
                  count={module1Photo ? 1 : 0}
                  max={1}
                  submitted={submitted}
                  error={errors.module1}
                  onFiles={(e) => handleSinglePhoto(e, 'module1', setModule1Photo, setModule1Preview)}
                  onRemove={() => removeSinglePhoto(setModule1Photo, setModule1Preview)}
                  onPreview={(url) => setModalImage({ url, title: 'Module Serial #1 Photo' })}
                />

                <PhotoCard
                  title="Module with Serial Number 2"
                  hint="Serial number must match the allocation."
                  previews={module2Preview ? [module2Preview] : []}
                  count={module2Photo ? 1 : 0}
                  max={1}
                  submitted={submitted}
                  error={errors.module2}
                  onFiles={(e) => handleSinglePhoto(e, 'module2', setModule2Photo, setModule2Preview)}
                  onRemove={() => removeSinglePhoto(setModule2Photo, setModule2Preview)}
                  onPreview={(url) => setModalImage({ url, title: 'Module Serial #2 Photo' })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="ula-form-sticky-bar">
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)', alignItems: 'center' }}>
            <span className="ax-badge ax-badge--soft ax-badge--primary ax-badge--pill">
              Required: {completedRequired} / {totalRequired} ({progressPercent}%)
            </span>
            {submitted && errorCount > 0 && (
              <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-danger-500)', fontWeight: 500 }}>
                Missing mandatory fields
              </span>
            )}
          </div>

          <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)' }}>
            <button type="button" className="ax-btn ax-btn--secondary" onClick={handleCancel} disabled={submitting}>
              <span className="ax-btn__label">Cancel</span>
            </button>
            <button type="submit" disabled={submitting} className="ax-btn ax-btn--primary" style={{ minWidth: 200 }}>
              {submitting ? (
                <>
                  <span className="ax-spinner" style={{ width: 16, height: 16, marginRight: 8 }} />
                  <span className="ax-btn__label">Submitting…</span>
                </>
              ) : (
                <>
                  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5l10 -10" /></svg>
                  <span className="ax-btn__label">Submit Installation</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* ── Photo Preview Lightbox Modal ── */}
      {modalImage && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--ax-space-4)' }}
          onClick={() => setModalImage(null)}
        >
          <div
            className="ax-card"
            style={{ position: 'relative', padding: 'var(--ax-space-4)', maxWidth: 640, width: '90%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--ax-space-3)' }}>
              <h4 style={{ margin: 0, fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-strong)', fontWeight: 'var(--ax-weight-semibold)' }}>
                {modalImage.title}
              </h4>
              <button type="button" className="ax-btn ax-btn--ghost ax-btn--icon ax-btn--sm" onClick={() => setModalImage(null)} aria-label="Close preview">
                ✕
              </button>
            </div>
            <img src={modalImage.url} alt={modalImage.title} style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 'var(--ax-radius-md)', display: 'block', margin: '0 auto' }} />
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
 * Helper Reusable Components (same pattern as Jammu form)
 * ========================================================================= */

function SectionHeader({ num, total, title, subtitle }: { num: string; total: string; title: string; subtitle: string }) {
  return (
    <div className="ula-section-header">
      <div className="ula-section-title-wrap">
        <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', alignItems: 'center' }}>
          <span className="ax-badge ax-badge--soft ax-badge--primary ax-badge--pill" style={{ fontWeight: 600 }}>
            Section {num} of {total}
          </span>
          <h3 style={{ fontSize: 'var(--ax-text-base)', fontWeight: 600, margin: 0, color: 'var(--ax-text-strong)' }}>{title}</h3>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>{subtitle}</p>
      </div>
    </div>
  );
}

const Req = () => <span style={{ color: 'var(--ax-danger-500)', marginLeft: 3 }}>*</span>;

interface FloatingInputProps {
  id: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder: string;
  maxLength?: number;
  value: string;
  onChange: (val: string) => void;
  onBlur: () => void;
  status: FieldStatusProps;
  error?: string;
}

function FloatingInput({ id, label, type = 'text', required, placeholder, maxLength, value, onChange, onBlur, status, error }: FloatingInputProps) {
  return (
    <div>
      <div className="ax-float">
        <input
          id={id}
          type={type}
          maxLength={maxLength}
          className={`ax-input ax-float__input ${status.className}`}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          aria-invalid={status.isInvalid}
        />
        <label className="ax-float__label" htmlFor={id}>
          {label}
          {required && <Req />}
        </label>
      </div>
      <FieldFeedback error={error} isValid={status.isValid} />
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
  onBlur: () => void;
  status: FieldStatusProps;
  error?: string;
}

function FloatingSelect({ id, label, required, placeholder = '-- Select --', value, options, disabled, onChange, onBlur, status, error }: FloatingSelectProps) {
  return (
    <div>
      <div className="ax-float ax-float--select">
        <select
          id={id}
          className={`ax-select ax-float__input ${status.className}`}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          aria-invalid={status.isInvalid}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <label className="ax-float__label" htmlFor={id}>
          {label}
          {required && <Req />}
        </label>
      </div>
      <FieldFeedback error={error} isValid={status.isValid} />
    </div>
  );
}

interface PhotoCardProps {
  title: string;
  hint: string;
  multiple?: boolean;
  previews: string[];
  count: number;
  max: number;
  submitted: boolean;
  error?: string;
  onFiles: (e: ChangeEvent<HTMLInputElement>) => void;
  onRemove: (index: number) => void;
  onPreview: (url: string, index: number) => void;
}

function PhotoCard({ title, hint, multiple, previews, count, max, submitted, error, onFiles, onRemove, onPreview }: PhotoCardProps) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const full = count >= max;
  const stateClass = error ? 'is-invalid' : count > 0 ? 'is-valid' : '';

  return (
    <div className={`ula-photo-card ${stateClass}`}>
      <div>
        <h4 style={{ margin: '0 0 2px 0', fontSize: 'var(--ax-text-sm)', fontWeight: 600, color: 'var(--ax-text-strong)' }}>{title}</h4>
        <p style={{ margin: '0 0 var(--ax-space-3) 0', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>{hint}</p>

        <input type="file" ref={cameraRef} accept="image/*" capture="environment" style={{ display: 'none' }} onChange={onFiles} />
        <input type="file" ref={galleryRef} accept="image/*" multiple={multiple} style={{ display: 'none' }} onChange={onFiles} />

        <div style={{ display: 'flex', gap: 'var(--ax-space-2)', marginBottom: 'var(--ax-space-3)' }}>
          <button
            type="button"
            className="ax-btn ax-btn--secondary ax-btn--sm"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => cameraRef.current?.click()}
            disabled={multiple ? full : false}
          >
            {ICON_CAMERA}
            <span className="ax-btn__label">Camera</span>
          </button>
          <button
            type="button"
            className="ax-btn ax-btn--secondary ax-btn--sm"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => galleryRef.current?.click()}
            disabled={multiple ? full : false}
          >
            {ICON_GALLERY}
            <span className="ax-btn__label">Gallery</span>
          </button>
        </div>

        {previews.length > 0 && (
          <div className="ula-photo-thumbs">
            {previews.map((url, i) => (
              <div key={url} className="ula-photo-thumb" onClick={() => onPreview(url, i)}>
                <img src={url} alt={`${title} ${i + 1}`} />
                <button
                  type="button"
                  className="ula-photo-thumb__remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(i);
                  }}
                  title="Remove photo"
                  aria-label="Remove photo"
                >
                  {ICON_X}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--ax-text-xs)' }}>
        {count === 0 ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: submitted || error ? 'var(--ax-danger-500)' : 'var(--ax-text-muted)', fontWeight: 500 }}>
            {ICON_DOT}
            Not captured
          </span>
        ) : (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--ax-success-500)', fontWeight: 600 }}>
            {ICON_CHECK}
            {multiple ? `${count} of ${max} captured` : 'Captured'}
          </span>
        )}
      </div>
    </div>
  );
}

function FieldFeedback({ error, isValid }: { error?: string; isValid?: boolean }) {
  if (error) {
    return (
      <span className="ax-field-feedback ax-field-feedback--error" role="alert">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 12, height: 12 }}>
          <circle cx="12" cy="12" r="9" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        {error}
      </span>
    );
  }

  if (isValid) {
    return (
      <span className="ax-field-feedback ax-field-feedback--success">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 12, height: 12 }}>
          <polyline points="20 6 9 17 4 12" />
        </svg>
        Valid
      </span>
    );
  }

  return <span className="ax-field-feedback" />;
}

export default Bihar_Installation_ULA_InstallationDetails;