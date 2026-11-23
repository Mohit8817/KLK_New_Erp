import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
  type CSSProperties,
} from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { authService, getCurrentUser } from '../../../../../services/authService';
import {
  upInstallationService,
  resolveUpMediaUrl,
  type UpRescoSiteDetail,
} from '../../up-services';
import {
  extractBackendError,
  formatMissingRequiredMsg,
  scrollToFirstError,
} from '../../../common-services/vPortalFormUtils';

// CSS: Unified Single-Card Layout with Floating Labels & Section Dividers
const SINGLE_CARD_FORM_CSS = `
.up-single-card-form .ax-card { border: 1px solid var(--ax-border); border-radius: var(--ax-radius-xl); background: var(--ax-surface-solid); box-shadow: var(--ax-shadow-sm); overflow: hidden; }
.up-single-card-form .ax-card__header { padding: var(--ax-space-5) var(--ax-space-6); border-bottom: 1px solid var(--ax-border-subtle); background: var(--ax-surface-subtle); display: flex; flex-direction: column; gap: var(--ax-space-4); }
.up-single-card-form .ax-card__body { padding: var(--ax-space-6); }

.up-section-pills { display: flex; gap: var(--ax-space-2); overflow-x: auto; padding-bottom: 4px; scrollbar-width: thin; }
.up-section-pill-btn { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: var(--ax-radius-pill); font-size: var(--ax-text-xs); font-weight: 500; white-space: nowrap; background: var(--ax-surface-solid); border: 1px solid var(--ax-border); color: var(--ax-text); cursor: pointer; transition: all var(--ax-motion-fast) var(--ax-ease-standard); text-decoration: none; }
.up-section-pill-btn:hover { border-color: var(--ax-accent); color: var(--ax-accent); background: color-mix(in srgb, var(--ax-accent) 6%, var(--ax-surface-solid)); }
.up-section-pill-btn .pill-num { width: 18px; height: 18px; border-radius: 50%; background: var(--ax-surface-subtle); display: inline-flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; }

.up-section-block { padding-top: var(--ax-space-2); scroll-margin-top: 80px; }
.up-section-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: var(--ax-space-2); margin-bottom: var(--ax-space-5); padding-bottom: var(--ax-space-3); border-bottom: 1px solid var(--ax-border-subtle); }
.up-section-title-wrap { display: flex; flex-direction: column; gap: 4px; }
.up-section-divider { border: 0; border-top: 1px dashed var(--ax-border); margin: var(--ax-space-8) 0 var(--ax-space-6); }

.ax-float { position: relative; width: 100%; }
.ax-float__input { width: 100%; height: 46px; padding: 12px 14px 4px 14px; font-size: var(--ax-text-sm); background: var(--ax-surface-solid); border: 1px solid var(--ax-border); border-radius: var(--ax-radius-md); color: var(--ax-text); outline: none; transition: border-color var(--ax-motion-fast) var(--ax-ease-standard), box-shadow var(--ax-motion-fast) var(--ax-ease-standard); }
.ax-float__input::placeholder { color: transparent; }
.ax-float__input:focus::placeholder { color: var(--ax-text-subtle); }
.ax-float__input:focus { border-color: var(--ax-accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--ax-accent) 20%, transparent); }
.ax-float__input[readonly] { background: var(--ax-surface-subtle); }
.ax-float__input:disabled { opacity: .7; cursor: not-allowed; background: var(--ax-surface-subtle); }

.ax-float__label { position: absolute; inset-inline-start: 12px; top: 50%; transform: translateY(-50%); margin: 0; padding: 0 4px; font-size: var(--ax-text-sm); color: var(--ax-text-subtle); background: var(--ax-surface-solid); border-radius: var(--ax-radius-xs); pointer-events: none; transition: top var(--ax-motion-fast) var(--ax-ease-standard), font-size var(--ax-motion-fast) var(--ax-ease-standard), color var(--ax-motion-fast) var(--ax-ease-standard); z-index: 2; white-space: nowrap; max-width: calc(100% - 24px); overflow: hidden; text-overflow: ellipsis; }

.ax-float__input:focus + .ax-float__label,
.ax-float__input:not(:placeholder-shown) + .ax-float__label,
.ax-float--select .ax-float__label,
.ax-float--readonly .ax-float__label,
.ax-float--file .ax-float__label { top: 0; transform: translateY(-50%); font-size: var(--ax-text-2xs); font-weight: 500; color: var(--ax-text-muted); }
.ax-float__input:focus + .ax-float__label { color: var(--ax-accent); }

.ax-float__input.is-invalid { border-color: var(--ax-danger-500) !important; }
.ax-float__input.is-invalid:focus { box-shadow: 0 0 0 3px color-mix(in srgb, var(--ax-danger-500) 24%, transparent) !important; }
.ax-float__input.is-invalid + .ax-float__label { color: var(--ax-danger-500) !important; }

.ax-float--area .ax-float__input { height: auto; min-height: 88px; padding-top: 18px; resize: vertical; }
.ax-float--area .ax-float__label { top: 18px; transform: none; }
.ax-float--area .ax-float__input:focus + .ax-float__label,
.ax-float--area .ax-float__input:not(:placeholder-shown) + .ax-float__label { top: 0; transform: translateY(-50%); }

.ax-field-feedback { display: flex; align-items: center; gap: 4px; margin-top: 4px; font-size: var(--ax-text-2xs); min-height: 16px; }
.ax-field-feedback--error { color: var(--ax-danger-500); }

.up-form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--ax-space-4); }
@media (min-width: 1024px) { .up-form-grid--3col { grid-template-columns: repeat(3, 1fr); } }
.up-form-col-span-full { grid-column: 1 / -1; }
.up-gps-cell { height: 46px; }

.up-form-sticky-bar { position: sticky; bottom: var(--ax-space-4); z-index: 30; margin-top: var(--ax-space-6); padding: var(--ax-space-3) var(--ax-space-5); background: var(--ax-surface-solid); border: 1px solid var(--ax-border); border-radius: var(--ax-radius-xl); box-shadow: var(--ax-shadow-lg); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--ax-space-3); backdrop-filter: blur(12px); }

@keyframes up-spin { to { transform: rotate(360deg); } }
`;

type Option = { value: string; label: string };
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

type FileKey =
  | 'panel_image'
  | 'system_image'
  | 'inverter_image'
  | 'net_meter_image'
  | 'loger_image';

interface RescoSiteOptionItem {
  id: string;
  resco_id: string;
  site_name: string;
  district?: string;
  state?: string;
}

interface SiteInformationState {
  id: string;
  state: string;
  district: string;
  site_name: string;
  location: string;
  firm_name: string;
  ca_no: string;
  sanction_load: string;
  plant_sc: string;
  wo_no: string;
  panel_image?: string | null;
  system_image?: string | null;
  inverter_image?: string | null;
  net_meter_image?: string | null;
  loger_image?: string | null;
}

const EMPTY_SITE_INFO: SiteInformationState = {
  id: '',
  state: '',
  district: '',
  site_name: '',
  location: '',
  firm_name: '',
  ca_no: '',
  sanction_load: '',
  plant_sc: '',
  wo_no: '',
  panel_image: null,
  system_image: null,
  inverter_image: null,
  net_meter_image: null,
  loger_image: null,
};

const INITIAL_FORM = {
  contact_person: '',
  contact_no: '',
  inverter_no: '',
  solar_meter_no: '',
  net_meter_no: '',
  rms_loger_no: '',
  latitude: '',
  longitude: '',
  remarks: '',
};
type FormKey = keyof typeof INITIAL_FORM;

const INITIAL_FILES: Record<FileKey, File | null> = {
  panel_image: null,
  system_image: null,
  inverter_image: null,
  net_meter_image: null,
  loger_image: null,
};

const REQUIRED_FIELDS: Partial<Record<FormKey, string>> = {
  contact_person: 'Contact Person is required',
  contact_no: 'Contact No. is required',
  inverter_no: 'Inverter No is required',
  solar_meter_no: 'Solar Meter Number is required',
  net_meter_no: 'Net Meter/Smart Meter Number is required',
  rms_loger_no: 'RMS Loger Number is required',
  latitude: 'Latitude is required',
  longitude: 'Longitude is required',
};

const FILE_FIELDS: { key: FileKey; id: string; label: string; error: string }[] = [
  { key: 'panel_image', id: 'up-inst-panel', label: 'Panel Image', error: 'Panel Image is required' },
  { key: 'system_image', id: 'up-inst-system', label: 'System Image', error: 'System Image is required' },
  { key: 'inverter_image', id: 'up-inst-inverter', label: 'Inverter Image', error: 'Inverter Image is required' },
  { key: 'net_meter_image', id: 'up-inst-netmeter', label: 'Net Meter/Smart Meter Image', error: 'Net Meter/Smart Meter Image is required' },
  { key: 'loger_image', id: 'up-inst-loger', label: 'Loger Image', error: 'Loger Image is required' },
];

const SECTIONS = [
  { id: 'sec-1', num: '1', title: 'Site Information' },
  { id: 'sec-2', num: '2', title: 'Information' },
  { id: 'sec-3', num: '3', title: 'Contact & Equipment' },
  { id: 'sec-4', num: '4', title: 'Site Photos' },
  { id: 'sec-5', num: '5', title: 'GPS & Remarks' },
];

const strVal = (v: unknown): string => {
  if (v === null || v === undefined) return '';
  const s = String(v).trim();
  return s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined' ? '' : s;
};

const resolveSessionVendorName = (): string => {
  const user = getCurrentUser();
  const raw = authService.getRawResponse?.();
  return (
    strVal(user?.name) ||
    strVal((user as any)?.vendor_name) ||
    strVal(raw?.vendor?.name) ||
    strVal(raw?.user?.name) ||
    strVal(raw?.data?.vendor?.name) ||
    strVal(raw?.data?.user?.name) ||
    ''
  );
};

export function UP_Installation_Resco_InstallSite() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preSelectedId =
    searchParams.get('site_id') || searchParams.get('id') || searchParams.get('resco_id') || '';
  const assignIdParam = searchParams.get('assign_id') || '';

  // Dropdown sites & selected site details (100% API-driven)
  const [sites, setSites] = useState<RescoSiteOptionItem[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [siteInfo, setSiteInfo] = useState<SiteInformationState>({ ...EMPTY_SITE_INFO });

  // Form fields
  const [vendorName, setVendorName] = useState<string>(() => resolveSessionVendorName());
  const [formData, setFormData] = useState({ ...INITIAL_FORM });
  const [files, setFiles] = useState<Record<FileKey, File | null>>({ ...INITIAL_FILES });

  // UI state
  const [loadingSites, setLoadingSites] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const clearError = useCallback((name: string) => {
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);

  const setField = (name: FormKey, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) clearError(name);
  };

  const f = (name: FormKey) => ({
    value: formData[name],
    onChange: (v: string) => setField(name, v),
    error: fieldErrors[name],
  });

  const handleFileChange = (key: FileKey, file: File | null) => {
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        setFieldErrors((prev) => ({ ...prev, [key]: 'File size must be 5 MB or less.' }));
        return;
      }
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        setFieldErrors((prev) => ({ ...prev, [key]: 'Only JPG, PNG, WEBP, or PDF files are allowed.' }));
        return;
      }
    }
    setFiles((prev) => ({ ...prev, [key]: file }));
    clearError(key);
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Populate Section 2 (Information) & prefill form fields strictly from API site detail
  const applyDetail = useCallback((detail: UpRescoSiteDetail) => {
    const resolvedId = strVal(detail.resco_id || detail.site_id || detail.id);
    setSiteInfo({
      id: resolvedId,
      state: strVal(detail.state),
      district: strVal(detail.district),
      site_name: strVal(detail.site_name),
      location: strVal(detail.address || (detail as any).location),
      firm_name: strVal(detail.firm_name),
      ca_no: strVal(detail.ca_no),
      sanction_load: strVal(detail.sanction_load),
      plant_sc: strVal(detail.plant_sc),
      wo_no: strVal(detail.wo_no),
      panel_image: detail.panel_image ? resolveUpMediaUrl(detail.panel_image) : null,
      system_image: detail.system_image ? resolveUpMediaUrl(detail.system_image) : null,
      inverter_image: detail.inverter_image ? resolveUpMediaUrl(detail.inverter_image) : null,
      net_meter_image: (detail.nm_sm_image || (detail as any).net_meter_smart_meter_image)
        ? resolveUpMediaUrl(detail.nm_sm_image || (detail as any).net_meter_smart_meter_image)
        : null,
      loger_image: detail.loger_image ? resolveUpMediaUrl(detail.loger_image) : null,
    });

    const apiVendor = strVal((detail as any).vendor || (detail as any).vendors?.name);
    if (apiVendor) {
      setVendorName((prev) => prev || apiVendor);
    }

    // Reset form values cleanly from this site's API record (no stale values from previous site)
    setFormData({
      contact_person: strVal(detail.contact_person),
      contact_no: strVal(detail.contact_number || (detail as any).contact_no),
      inverter_no: strVal(detail.inverter_no),
      solar_meter_no: strVal(detail.solarmeter_no || (detail as any).solar_meter_no),
      net_meter_no: strVal(detail.nm_sm_no || (detail as any).net_smart_meter_no || (detail as any).net_meter_no),
      rms_loger_no: strVal(detail.loger_no || (detail as any).rms_loger_no),
      latitude: strVal(detail.inst_latitude || (detail as any).latitude),
      longitude: strVal(detail.inst_longitude || (detail as any).longitude),
      remarks: strVal(detail.inst_remarks || (detail as any).remarks),
    });
    setFiles({ ...INITIAL_FILES });
  }, []);

  // Fetch site detail for a selected ID via GET up/resco/installation/fetch-site-detail/{id}
  const fetchAndApplySiteDetail = useCallback(
    async (id: string) => {
      const cleanId = id.trim();
      if (!cleanId) {
        setSiteInfo({ ...EMPTY_SITE_INFO });
        setFormData({ ...INITIAL_FORM });
        setFiles({ ...INITIAL_FILES });
        return null;
      }

      setLoadingDetail(true);
      setErrorMsg(null);
      try {
        const detail = await upInstallationService.getRescoSiteDetail(cleanId);
        if (detail) {
          applyDetail(detail);
          clearError('site_id');
          return detail;
        } else {
          setSiteInfo({ ...EMPTY_SITE_INFO });
          setFormData({ ...INITIAL_FORM });
          setFiles({ ...INITIAL_FILES });
          setErrorMsg(`Site details not found for Site ID ${cleanId}.`);
          return null;
        }
      } catch (err: any) {
        setSiteInfo({ ...EMPTY_SITE_INFO });
        setErrorMsg(err?.message || 'Failed to load site details from server.');
        return null;
      } finally {
        setLoadingDetail(false);
      }
    },
    [applyDetail, clearError]
  );

  // Load available sites strictly from UP Resco Installation API
  const loadAvailableSites = useCallback(async () => {
    setLoadingSites(true);
    setErrorMsg(null);
    try {
      const list = await upInstallationService.getRescoAvailableSites();
      const mapped: RescoSiteOptionItem[] = list.map((a) => {
        const rid = strVal(a.resco_id ?? a.site_id ?? a.id);
        return {
          id: rid,
          resco_id: rid,
          site_name: strVal(a.site_name) || `Site #${rid}`,
          district: strVal(a.district),
          state: strVal(a.state),
        };
      });

      // Deduplicate by ID
      const deduped: RescoSiteOptionItem[] = [];
      const seen = new Set<string>();
      for (const item of mapped) {
        if (item.id && !seen.has(item.id)) {
          seen.add(item.id);
          deduped.push(item);
        }
      }

      // If navigated with ?site_id=..., select it and fetch its detail from API
      if (preSelectedId) {
        const existing = deduped.find((m) => m.id === preSelectedId);
        if (existing) {
          setSites(deduped);
          setSelectedSiteId(existing.id);
          await fetchAndApplySiteDetail(existing.id);
        } else {
          const detail = await fetchAndApplySiteDetail(preSelectedId);
          if (detail) {
            const detailId = strVal(detail.resco_id || detail.site_id || detail.id || preSelectedId);
            const injected: RescoSiteOptionItem = {
              id: detailId,
              resco_id: detailId,
              site_name: strVal(detail.site_name) || `Site #${detailId}`,
              district: strVal(detail.district),
              state: strVal(detail.state),
            };
            setSites([injected, ...deduped]);
            setSelectedSiteId(detailId);
          } else {
            setSites(deduped);
          }
        }
      } else {
        setSites(deduped);
      }
    } catch (err: any) {
      setSites([]);
      setErrorMsg(err?.message || 'Failed to load available installation sites.');
    } finally {
      setLoadingSites(false);
    }
  }, [preSelectedId, fetchAndApplySiteDetail]);

  useEffect(() => {
    const sessionVendor = resolveSessionVendorName();
    if (sessionVendor) setVendorName(sessionVendor);
    loadAvailableSites();
  }, [loadAvailableSites]);

  const handleSelectSite = async (id: string) => {
    setSelectedSiteId(id);
    setSuccessMsg(null);
    setErrorMsg(null);
    setFieldErrors({});
    await fetchAndApplySiteDetail(id);
  };

  // Detect current GPS coordinates
  const fetchGPS = (silent = false) => {
    if (!navigator.geolocation) {
      if (!silent) setErrorMsg('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    if (!silent) setErrorMsg(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
        clearError('latitude');
        clearError('longitude');
        setLocating(false);
      },
      (err) => {
        if (!silent) setErrorMsg(`GPS Error: ${err.message}`);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    fetchGPS(true);
  }, [selectedSiteId]);

  const handleReset = () => {
    setFormData({ ...INITIAL_FORM });
    setFiles({ ...INITIAL_FILES });
    setFieldErrors({});
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  // Client-side validation
  const validate = (): Record<string, string> => {
    const errs: Record<string, string> = {};

    if (!selectedSiteId.trim()) {
      errs.site_id = 'Please select a Site Id';
    }
    if (!vendorName.trim()) {
      errs.vendor = 'Vendor is required';
    }

    (Object.keys(REQUIRED_FIELDS) as FormKey[]).forEach((key) => {
      if (!formData[key].trim()) {
        errs[key] = REQUIRED_FIELDS[key] as string;
      }
    });

    // Contact No. format check (10 to 15 digits)
    const cleanContact = formData.contact_no.replace(/\D/g, '');
    if (formData.contact_no.trim() && (cleanContact.length < 10 || cleanContact.length > 15)) {
      errs.contact_no = 'Contact No. must be 10 to 15 digits';
    }

    // Latitude / Longitude numeric range check
    if (formData.latitude.trim()) {
      const lat = Number(formData.latitude);
      if (Number.isNaN(lat) || lat < -90 || lat > 90) {
        errs.latitude = 'Latitude must be a valid number between -90 and 90';
      }
    }
    if (formData.longitude.trim()) {
      const lng = Number(formData.longitude);
      if (Number.isNaN(lng) || lng < -180 || lng > 180) {
        errs.longitude = 'Longitude must be a valid number between -180 and 180';
      }
    }

    // Required image uploads
    FILE_FIELDS.forEach(({ key, error }) => {
      if (!files[key]) {
        errs[key] = error;
      }
    });

    setFieldErrors(errs);
    return errs;
  };

  // Submit installation form to POST up/resco/installation/install-site-store
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      const missingMsg = formatMissingRequiredMsg(validationErrors);
      setErrorMsg(missingMsg);
      setTimeout(() => scrollToFirstError(), 50);
      return;
    }

    setSubmitting(true);
    try {
      const finalRescoId = (siteInfo.id || selectedSiteId).trim();
      const session = authService.getSession?.();

      const fd = new FormData();
      fd.append('resco_id', finalRescoId);
      fd.append('site_id', finalRescoId);
      fd.append('id', finalRescoId);

      if (vendorName.trim()) {
        fd.append('vendor', vendorName.trim());
      }
      if (session?.vendor_id || session?.id) {
        fd.append('vendor_id', String(session.vendor_id || session.id));
      }
      if (assignIdParam) {
        fd.append('assign_id', assignIdParam);
        fd.append('assignment_id', assignIdParam);
      }

      fd.append('contact_person', formData.contact_person.trim());
      fd.append('contact_number', formData.contact_no.trim());
      fd.append('contact_no', formData.contact_no.trim());
      fd.append('inverter_no', formData.inverter_no.trim());
      fd.append('solarmeter_no', formData.solar_meter_no.trim());
      fd.append('solar_meter_no', formData.solar_meter_no.trim());
      fd.append('nm_sm_no', formData.net_meter_no.trim());
      fd.append('net_meter_no', formData.net_meter_no.trim());
      fd.append('net_smart_meter_no', formData.net_meter_no.trim());
      fd.append('loger_no', formData.rms_loger_no.trim());
      fd.append('rms_loger_no', formData.rms_loger_no.trim());
      fd.append('inst_latitude', formData.latitude.trim());
      fd.append('latitude', formData.latitude.trim());
      fd.append('inst_longitude', formData.longitude.trim());
      fd.append('longitude', formData.longitude.trim());

      if (formData.remarks.trim()) {
        fd.append('inst_remarks', formData.remarks.trim());
        fd.append('remarks', formData.remarks.trim());
      }

      if (files.panel_image) fd.append('panel_image', files.panel_image);
      if (files.system_image) fd.append('system_image', files.system_image);
      if (files.inverter_image) fd.append('inverter_image', files.inverter_image);
      if (files.net_meter_image) {
        fd.append('nm_sm_image', files.net_meter_image);
        fd.append('net_meter_image', files.net_meter_image);
      }
      if (files.loger_image) fd.append('loger_image', files.loger_image);

      const res = await upInstallationService.storeRescoInstallation(fd);
      if (res.status) {
        setSuccessMsg(res.message || 'UP Resco installation submitted successfully!');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => {
          navigate('/v/up/resco-view-install-site');
        }, 1500);
      } else {
        const extracted = extractBackendError(res, 'Failed to submit installation.');
        const mappedErrors: Record<string, string> = { ...extracted.fieldErrors };
        const keyMap: Record<string, string> = {
          id: 'site_id',
          resco_id: 'site_id',
          site_id: 'site_id',
          vendor: 'vendor',
          contact_person: 'contact_person',
          contact_number: 'contact_no',
          contact_no: 'contact_no',
          inverter_no: 'inverter_no',
          solarmeter_no: 'solar_meter_no',
          solar_meter_no: 'solar_meter_no',
          nm_sm_no: 'net_meter_no',
          net_meter_no: 'net_meter_no',
          net_smart_meter_no: 'net_meter_no',
          loger_no: 'rms_loger_no',
          rms_loger_no: 'rms_loger_no',
          inst_latitude: 'latitude',
          latitude: 'latitude',
          inst_longitude: 'longitude',
          longitude: 'longitude',
          inst_remarks: 'remarks',
          remarks: 'remarks',
          panel_image: 'panel_image',
          system_image: 'system_image',
          inverter_image: 'inverter_image',
          nm_sm_image: 'net_meter_image',
          net_meter_image: 'net_meter_image',
          loger_image: 'loger_image',
        };

        if (res.errors && typeof res.errors === 'object') {
          for (const [k, v] of Object.entries(res.errors)) {
            const firstMsg = Array.isArray(v) ? String(v[0] ?? '') : String(v ?? '');
            if (firstMsg) {
              const targetKey = keyMap[k] || k;
              mappedErrors[targetKey] = firstMsg;
            }
          }
        }

        if (Object.keys(mappedErrors).length > 0) {
          setFieldErrors((prev) => ({ ...prev, ...mappedErrors }));
        }

        setErrorMsg(extracted.message);
        setTimeout(() => scrollToFirstError(), 80);
      }
    } catch (err: any) {
      const extracted = extractBackendError(err, 'Server error occurred while submitting installation.');
      setErrorMsg(extracted.message);
      if (extracted.fieldErrors && Object.keys(extracted.fieldErrors).length > 0) {
        setFieldErrors((prev) => ({ ...prev, ...extracted.fieldErrors }));
        setTimeout(() => scrollToFirstError(), 80);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const siteSelectOptions: Option[] = useMemo(
    () =>
      sites.map((s) => {
        const distPart = s.district ? ` (${s.district})` : '';
        return {
          value: s.id,
          label: `${s.id} — ${s.site_name}${distPart}`,
        };
      }),
    [sites]
  );

  const errorCount = Object.keys(fieldErrors).length;

  return (
    <div className="up-single-card-form">
      <style>{SINGLE_CARD_FORM_CSS}</style>

      <PageHead
        title="UP Resco Install Site"
        subtitle={
          <span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>
            Submit completed rooftop installation details, equipment numbers, GPS coordinates, and site photographs
          </span>
        }
        breadcrumbs={[
          { label: 'Home', href: '/v' },
          { label: 'UP Resco Install Site' },
        ]}
        actions={
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}>
            <Link to="/v/up/resco-assign-site" className="ax-btn ax-btn--secondary ax-btn--pill">
              <span className="ax-btn__label">Assigned Sites</span>
            </Link>
            <Link to="/v/up/resco-view-install-site" className="ax-btn ax-btn--secondary ax-btn--pill">
              <svg
                className="ax-btn__icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.75}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12l14 0" />
                <path d="M5 12l6 6" />
                <path d="M5 12l6 -6" />
              </svg>
              <span className="ax-btn__label">Installation Details</span>
            </Link>
          </div>
        }
      />

      {/* Success Banner */}
      {successMsg && (
        <div className="ax-alert ax-alert--success" role="status" style={{ marginBottom: 'var(--ax-space-6)' }}>
          <span className="ax-alert__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12l5 5l10 -10" />
            </svg>
          </span>
          <div className="ax-alert__content">
            <h3 className="ax-alert__title" style={{ fontSize: 'var(--ax-text-base)', fontWeight: 600 }}>
              {successMsg}
            </h3>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {errorMsg && (
        <div className="ax-alert ax-alert--danger" role="alert" style={{ marginBottom: 'var(--ax-space-6)' }}>
          <span className="ax-alert__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 9v4" />
              <path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0" />
              <path d="M12 16h.01" />
            </svg>
          </span>
          <div className="ax-alert__content">
            <h4 className="ax-alert__title" style={{ fontWeight: 600 }}>
              {errorMsg}
            </h4>
          </div>
        </div>
      )}

      {/* Main Single Card Form */}
      <form onSubmit={handleSubmit} noValidate>
        <div className="ax-card">
          {/* Card Header with Title and Section Pills */}
          <div className="ax-card__header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <span className="ax-card__eyebrow">Installation</span>
                <h2 className="ax-card__title" style={{ margin: 0 }}>
                  UP Resco Install Site
                </h2>
                <p className="ax-card__subtitle" style={{ margin: '4px 0 0' }}>
                  Select an assigned site ID to auto-load site information from the server, then fill all mandatory fields.
                </p>
              </div>
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--sm"
                onClick={loadAvailableSites}
                disabled={loadingSites}
              >
                <svg
                  className="ax-btn__icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.75}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={loadingSites ? { animation: 'up-spin 1s linear infinite' } : undefined}
                >
                  <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
                  <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
                </svg>
                <span className="ax-btn__label">{loadingSites ? 'Loading…' : 'Refresh Sites'}</span>
              </button>
            </div>

            <div className="up-section-pills" role="navigation" aria-label="Jump to section">
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => scrollToSection(s.id)}
                  className="up-section-pill-btn"
                >
                  <span className="pill-num">{s.num}</span>
                  <span>{s.title}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="ax-card__body">
            {/* ── Section 1: Site Information (Select Id) ── */}
            <div id="sec-1" className="up-section-block">
              <SectionHeader
                num="1"
                total={SECTIONS.length}
                title="Site Information"
                desc="Select the Site Id from available sites ready for installation."
              />

              <div className="up-form-grid up-form-grid--3col">
                <div style={{ gridColumn: 'span 2' }}>
                  <FloatingSelect
                    id="up-inst-site"
                    label="Select Id"
                    required
                    placeholder={
                      loadingSites
                        ? 'Loading available sites...'
                        : siteSelectOptions.length === 0
                        ? 'No pending sites available'
                        : '-- Select Id --'
                    }
                    value={selectedSiteId}
                    options={siteSelectOptions}
                    disabled={loadingSites || siteSelectOptions.length === 0}
                    onChange={handleSelectSite}
                    error={fieldErrors.site_id}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', height: 46 }}>
                  {loadingDetail && (
                    <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-accent)', fontWeight: 500 }}>
                      Fetching site information…
                    </span>
                  )}
                  {!loadingDetail && selectedSiteId && siteInfo.site_name && (
                    <span className="ax-badge ax-badge--soft ax-badge--success">
                      Site #{siteInfo.id} Loaded
                    </span>
                  )}
                </div>
              </div>

              {!loadingSites && siteSelectOptions.length === 0 && (
                <div
                  className="ax-alert ax-alert--info"
                  role="status"
                  style={{ marginTop: 'var(--ax-space-3)', fontSize: 'var(--ax-text-sm)' }}
                >
                  <div className="ax-alert__content">
                    No pending RESCO sites found ready for installation. Make sure you have accepted your assigned sites on{' '}
                    <Link to="/v/up/resco-assign-site" style={{ fontWeight: 600, textDecoration: 'underline' }}>
                      Assigned Sites
                    </Link>
                    .
                  </div>
                </div>
              )}
            </div>

            <hr className="up-section-divider" />

            {/* ── Section 2: Information (Read-Only from API) ── */}
            <div id="sec-2" className="up-section-block">
              <SectionHeader
                num="2"
                total={SECTIONS.length}
                title="Information"
                desc="Auto-populated from the API when a Site Id is selected (Read-only)."
              />
              <div className="up-form-grid up-form-grid--3col">
                <FloatingInput id="up-inst-state" label="State" readOnly value={siteInfo.state} />
                <FloatingInput id="up-inst-district" label="District" readOnly value={siteInfo.district} />
                <FloatingInput id="up-inst-site-name" label="Site Name" readOnly value={siteInfo.site_name} />
                <FloatingInput id="up-inst-location" label="Location" readOnly value={siteInfo.location} />
                <FloatingInput id="up-inst-firm" label="Firm Name" readOnly value={siteInfo.firm_name} />
                <FloatingInput id="up-inst-ca" label="CA No." readOnly value={siteInfo.ca_no} />
                <FloatingInput id="up-inst-sanction" label="Sanction Load" readOnly value={siteInfo.sanction_load} />
                <FloatingInput id="up-inst-plant" label="Plant SC" readOnly value={siteInfo.plant_sc} />
                <FloatingInput id="up-inst-wo" label="WO No." readOnly value={siteInfo.wo_no} />
              </div>
            </div>

            <hr className="up-section-divider" />

            {/* ── Section 3: Fill this Form — Contact & Equipment ── */}
            <div id="sec-3" className="up-section-block">
              <SectionHeader
                num="3"
                total={SECTIONS.length}
                title="Fill this Form"
                desc={
                  <>
                    Enter contact details and installed equipment serial numbers. Fields marked with{' '}
                    <span style={{ color: 'var(--ax-danger-500)' }}>*</span> are mandatory.
                  </>
                }
              />
              <div className="up-form-grid up-form-grid--3col">
                <FloatingInput
                  id="up-inst-vendor"
                  label="Vendor"
                  required
                  readOnly
                  value={vendorName}
                  error={fieldErrors.vendor}
                />
                <FloatingInput
                  id="up-inst-person"
                  label="Contact Person"
                  required
                  placeholder="Enter Contact Person Name"
                  {...f('contact_person')}
                />
                <FloatingInput
                  id="up-inst-contact"
                  label="Contact No."
                  type="tel"
                  required
                  maxLength={15}
                  placeholder="Enter Contact Number"
                  value={formData.contact_no}
                  onChange={(v) => setField('contact_no', v.replace(/\D/g, '').slice(0, 15))}
                  error={fieldErrors.contact_no}
                />
                <FloatingInput
                  id="up-inst-inverter-no"
                  label="Inverter No"
                  required
                  placeholder="Enter Inverter Number"
                  {...f('inverter_no')}
                />
                <FloatingInput
                  id="up-inst-solarmeter"
                  label="Solar Meter Number"
                  required
                  placeholder="Enter Solar Meter Number"
                  {...f('solar_meter_no')}
                />
                <FloatingInput
                  id="up-inst-netmeter-no"
                  label="Net Meter/Smart Meter Number"
                  required
                  placeholder="Enter Net/Smart Meter Number"
                  {...f('net_meter_no')}
                />
                <FloatingInput
                  id="up-inst-rms"
                  label="RMS Loger Number"
                  required
                  placeholder="Enter RMS Loger Number"
                  {...f('rms_loger_no')}
                />
              </div>
            </div>

            <hr className="up-section-divider" />

            {/* ── Section 4: Site Photos ── */}
            <div id="sec-4" className="up-section-block">
              <SectionHeader
                num="4"
                total={SECTIONS.length}
                title="Site Photos"
                desc="Upload clear photos of all 5 installed components (JPG, PNG, WEBP, or PDF up to 5 MB each)."
              />
              <div className="up-form-grid up-form-grid--3col">
                {FILE_FIELDS.map(({ key, id, label }) => (
                  <FloatingFileInput
                    key={key}
                    id={id}
                    label={label}
                    required
                    accept="image/*,.pdf"
                    file={files[key]}
                    existingUrl={siteInfo[key]}
                    onChange={(file) => handleFileChange(key, file)}
                    error={fieldErrors[key]}
                  />
                ))}
              </div>
            </div>

            <hr className="up-section-divider" />

            {/* ── Section 5: GPS Coordinates & Remarks ── */}
            <div id="sec-5" className="up-section-block">
              <SectionHeader
                num="5"
                total={SECTIONS.length}
                title="GPS Coordinates & Remarks"
                desc="Capture exact site geotag coordinates and optional installation remarks."
              />
              <div className="up-form-grid up-form-grid--3col">
                <FloatingInput
                  id="up-inst-lat"
                  label="Latitude"
                  required
                  readOnly={true}
                  style={{ cursor: 'not-allowed', backgroundColor: 'var(--ax-surface-subtle, #f8fafc)' }}
                  placeholder="Auto-detected GPS Latitude"
                  value={formData.latitude}
                  onChange={() => {}}
                  error={fieldErrors.latitude}
                />
                <FloatingInput
                  id="up-inst-lng"
                  label="Longitude"
                  required
                  readOnly={true}
                  style={{ cursor: 'not-allowed', backgroundColor: 'var(--ax-surface-subtle, #f8fafc)' }}
                  placeholder="Auto-detected GPS Longitude"
                  value={formData.longitude}
                  onChange={() => {}}
                  error={fieldErrors.longitude}
                />
                <div>
                  <button
                    type="button"
                    className="ax-btn ax-btn--secondary up-gps-cell"
                    style={{ width: '100%' }}
                    onClick={() => fetchGPS(false)}
                    disabled={locating}
                  >
                    <svg
                      className="ax-btn__icon"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.75}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span className="ax-btn__label">{locating ? 'Detecting GPS...' : 'Get Current GPS'}</span>
                  </button>
                </div>
                <div className="up-form-col-span-full">
                  <FloatingTextarea
                    id="up-inst-remarks"
                    label="Remarks"
                    placeholder="Enter Remarks..."
                    {...f('remarks')}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="up-form-sticky-bar">
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', alignItems: 'center' }}>
            <span className="ax-badge ax-badge--soft ax-badge--primary ax-badge--pill">
              UP Resco Installation
            </span>
            {errorCount > 0 && (
              <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-danger-500)', fontWeight: 600 }}>
                {errorCount} field(s) need attention
              </span>
            )}
          </div>
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)' }}>
            <button
              type="button"
              className="ax-btn ax-btn--secondary"
              onClick={handleReset}
              disabled={submitting}
            >
              <span className="ax-btn__label">Reset</span>
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedSiteId || loadingDetail}
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
                    style={{ animation: 'up-spin 1s linear infinite' }}
                  >
                    <path d="M12 3a9 9 0 1 0 9 9" />
                  </svg>
                  <span className="ax-btn__label">Submitting...</span>
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
                  <span className="ax-btn__label">Submit Installation</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default UP_Installation_Resco_InstallSite;

/* =========================================================================
 * Reusable Floating Form Components
 * ========================================================================= */

function SectionHeader({
  num,
  total,
  title,
  desc,
}: {
  num: string;
  total: number;
  title: string;
  desc?: ReactNode;
}) {
  return (
    <div className="up-section-header">
      <div className="up-section-title-wrap">
        <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', alignItems: 'center' }}>
          <span className="ax-badge ax-badge--soft ax-badge--primary ax-badge--pill" style={{ fontWeight: 600 }}>
            Section {num} of {total}
          </span>
          <h3 style={{ fontSize: 'var(--ax-text-base)', fontWeight: 600, margin: 0, color: 'var(--ax-text-strong)' }}>
            {title}
          </h3>
        </div>
        {desc && <p style={{ margin: '4px 0 0', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>{desc}</p>}
      </div>
    </div>
  );
}

const Asterisk = () => <span style={{ color: 'var(--ax-danger-500)', marginLeft: 3 }}>*</span>;

function FieldFeedback({ error }: { error?: string }) {
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
  return <span className="ax-field-feedback" />;
}

interface FloatingInputProps {
  id: string;
  label: string;
  type?: string;
  required?: boolean;
  readOnly?: boolean;
  style?: CSSProperties;
  maxLength?: number;
  placeholder?: string;
  value: string;
  onChange?: (val: string) => void;
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
  error?: string;
}

function FloatingInput({
  id,
  label,
  type = 'text',
  required,
  readOnly,
  style,
  maxLength,
  placeholder = ' ',
  value,
  onChange,
  onKeyDown,
  error,
}: FloatingInputProps) {
  return (
    <div>
      <div className={`ax-float${readOnly ? ' ax-float--readonly' : ''}`}>
        <input
          id={id}
          type={type}
          className={`ax-input ax-float__input ${error ? 'is-invalid' : ''}`}
          placeholder={placeholder}
          value={value}
          readOnly={readOnly}
          style={style}
          maxLength={maxLength}
          onChange={(e) => onChange?.(e.target.value)}
          onKeyDown={onKeyDown}
          aria-invalid={Boolean(error)}
        />
        <label className="ax-float__label" htmlFor={id}>
          {label}
          {required && <Asterisk />}
        </label>
      </div>
      <FieldFeedback error={error} />
    </div>
  );
}

interface FloatingSelectProps {
  id: string;
  label: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  value: string;
  options: Option[];
  onChange: (val: string) => void;
  error?: string;
}

function FloatingSelect({
  id,
  label,
  required,
  disabled,
  placeholder = '-- Select --',
  value,
  options,
  onChange,
  error,
}: FloatingSelectProps) {
  return (
    <div>
      <div className="ax-float ax-float--select">
        <select
          id={id}
          className={`ax-select ax-float__input ${error ? 'is-invalid' : ''}`}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(error)}
        >
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <label className="ax-float__label" htmlFor={id}>
          {label}
          {required && <Asterisk />}
        </label>
      </div>
      <FieldFeedback error={error} />
    </div>
  );
}

interface FloatingTextareaProps {
  id: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  value: string;
  rows?: number;
  onChange: (val: string) => void;
  error?: string;
}

function FloatingTextarea({
  id,
  label,
  required,
  placeholder = 'Enter Remarks...',
  value,
  rows = 3,
  onChange,
  error,
}: FloatingTextareaProps) {
  return (
    <div>
      <div className="ax-float ax-float--area">
        <textarea
          id={id}
          rows={rows}
          className={`ax-textarea ax-float__input ${error ? 'is-invalid' : ''}`}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(error)}
        />
        <label className="ax-float__label" htmlFor={id}>
          {label}
          {required && <Asterisk />}
        </label>
      </div>
      <FieldFeedback error={error} />
    </div>
  );
}

interface FloatingFileInputProps {
  id: string;
  label: string;
  required?: boolean;
  accept?: string;
  capture?: 'user' | 'environment';
  file: File | null;
  existingUrl?: string | null;
  onChange: (file: File | null) => void;
  error?: string;
}

function FloatingFileInput({
  id,
  label,
  required,
  accept,
  capture,
  file,
  existingUrl,
  onChange,
  error,
}: FloatingFileInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file || !file.type.startsWith('image/')) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const chosen = e.dataTransfer.files?.[0];
    if (chosen) onChange(chosen);
  };

  const existingClean = existingUrl ? existingUrl.split('?')[0] : '';
  const existingName = existingClean ? existingClean.split('/').pop() : null;

  return (
    <div className={error ? 'is-invalid' : undefined} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label
        htmlFor={id}
        style={{
          fontSize: '12px',
          fontWeight: 600,
          color: error ? 'var(--ax-danger-500, #ef4444)' : 'var(--ax-text-strong, #334155)',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <span>{label}</span>
        {required && <Asterisk />}
      </label>

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        capture={capture}
        style={{ display: 'none' }}
        onChange={(e) => {
          onChange(e.target.files?.[0] || null);
          e.target.value = '';
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
            ? 'var(--ax-surface-subtle, #fbfcfd)'
            : 'var(--ax-surface-solid, #ffffff)',
          padding: file || existingName ? '12px 14px' : '22px 16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          minHeight: 112,
        }}
      >
        {file ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, textAlign: 'left' }}>
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt={label}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 6,
                    objectFit: 'cover',
                    border: '1px solid var(--ax-border)',
                    flexShrink: 0,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: '#ecfdf5',
                    color: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
              )}
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--ax-text-strong)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {file.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', marginTop: 2 }}>
                  {(file.size / 1024).toFixed(0)} KB · Ready to upload
                </div>
              </div>
            </div>
            <button
              type="button"
              className="ax-btn ax-btn--ghost ax-btn--sm"
              onClick={handleClear}
              style={{ color: '#ef4444', flexShrink: 0 }}
              title="Remove file"
            >
              Remove
            </button>
          </div>
        ) : existingName ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, textAlign: 'left' }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: '#eff6ff',
                  color: '#3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--ax-text-strong)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {existingName}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', marginTop: 2 }}>
                  Existing file · Click to upload new file
                </div>
              </div>
            </div>
            <span className="ax-btn ax-btn--secondary ax-btn--sm" style={{ flexShrink: 0, pointerEvents: 'none' }}>
              Replace
            </span>
          </div>
        ) : (
          <>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: '#eff6ff',
                color: '#3b82f6',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 6,
              }}
            >
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                <path d="M12 12v9" />
                <path d="m8 16 4-4 4 4" />
              </svg>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong, #1e293b)' }}>
              Click to upload or drag & drop
            </div>
            <div style={{ fontSize: 11, color: 'var(--ax-text-muted, #64748b)', marginTop: 3 }}>
              JPG, PNG, WEBP, or PDF up to 5 MB
            </div>
          </>
        )}
      </div>

      <FieldFeedback error={error} />
    </div>
  );
}
