import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useAuth } from '../../../../../context/AuthContext';
import authService from '../../../../../services/authService';
import {
  kashmirSrtService,
  getKashmirMediaUrl,
} from '../../kashmir-services';

/* ═══════════════════════════════════════════════════════════════════
 * CSS – Unified Single-Card Layout with Floating Labels
 * ═══════════════════════════════════════════════════════════════════ */
const SINGLE_CARD_FORM_CSS = `
.kashmir-install-single-card-form .ax-card { border: 1px solid var(--ax-border); border-radius: var(--ax-radius-xl); background: var(--ax-surface-solid); box-shadow: var(--ax-shadow-sm); overflow: hidden; }
.kashmir-install-single-card-form .ax-card__header { padding: var(--ax-space-5) var(--ax-space-6); border-bottom: 1px solid var(--ax-border-subtle); background: var(--ax-surface-subtle); display: flex; flex-direction: column; gap: var(--ax-space-4); }
.kashmir-install-single-card-form .ax-card__body { padding: var(--ax-space-6); }

.kashmir-install-section-pills { display: flex; gap: var(--ax-space-2); overflow-x: auto; padding-bottom: 4px; scrollbar-width: thin; }
.kashmir-install-section-pill-btn { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: var(--ax-radius-pill); font-size: var(--ax-text-xs); font-weight: 500; white-space: nowrap; background: var(--ax-surface-solid); border: 1px solid var(--ax-border); color: var(--ax-text); cursor: pointer; transition: all var(--ax-motion-fast) var(--ax-ease-standard); text-decoration: none; }
.kashmir-install-section-pill-btn:hover { border-color: var(--ax-accent); color: var(--ax-accent); background: color-mix(in srgb, var(--ax-accent) 6%, var(--ax-surface-solid)); }
.kashmir-install-section-pill-btn .pill-num { width: 18px; height: 18px; border-radius: 50%; background: var(--ax-surface-subtle); display: inline-flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; }

.kashmir-install-section-block { padding-top: var(--ax-space-2); scroll-margin-top: 80px; }
.kashmir-install-section-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: var(--ax-space-2); margin-bottom: var(--ax-space-5); padding-bottom: var(--ax-space-3); border-bottom: 1px solid var(--ax-border-subtle); }
.kashmir-install-section-title-wrap { display: flex; flex-direction: column; gap: 4px; }
.kashmir-install-section-divider { border: 0; border-top: 1px dashed var(--ax-border); margin: var(--ax-space-8) 0 var(--ax-space-6); }

.ax-float { position: relative; width: 100%; }
.ax-float__input { width: 100%; height: 46px; padding: 12px 14px 4px 14px; font-size: var(--ax-text-sm); background: var(--ax-surface-solid); border: 1px solid var(--ax-border); border-radius: var(--ax-radius-md); color: var(--ax-text); outline: none; transition: border-color var(--ax-motion-fast) var(--ax-ease-standard), box-shadow var(--ax-motion-fast) var(--ax-ease-standard); }
.ax-float__input::placeholder { color: transparent; }
.ax-float__input:focus { border-color: var(--ax-accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--ax-accent) 20%, transparent); }
.ax-float__input[readonly] { background: var(--ax-surface-subtle); }
.ax-float__input:disabled { opacity: .7; cursor: not-allowed; background: var(--ax-surface-subtle); }

.ax-float__label { position: absolute; inset-inline-start: 12px; top: 50%; transform: translateY(-50%); margin: 0; padding: 0 4px; font-size: var(--ax-text-sm); color: var(--ax-text-subtle); background: var(--ax-surface-solid); border-radius: var(--ax-radius-xs); pointer-events: none; transition: top var(--ax-motion-fast) var(--ax-ease-standard), font-size var(--ax-motion-fast) var(--ax-ease-standard), color var(--ax-motion-fast) var(--ax-ease-standard); z-index: 2; white-space: nowrap; max-width: calc(100% - 24px); overflow: hidden; text-overflow: ellipsis; }

.ax-float__input:focus + .ax-float__label,
.ax-float__input:not(:placeholder-shown) + .ax-float__label,
.ax-float--select .ax-float__label,
.ax-float--file .ax-float__label { top: 0; transform: translateY(-50%); font-size: var(--ax-text-2xs); font-weight: 500; color: var(--ax-text-muted); }
.ax-float__input:focus + .ax-float__label { color: var(--ax-accent); }

.ax-float__input.is-invalid { border-color: var(--ax-danger-500) !important; }
.ax-float__input.is-invalid:focus { box-shadow: 0 0 0 3px color-mix(in srgb, var(--ax-danger-500) 24%, transparent) !important; }
.ax-float__input.is-invalid + .ax-float__label { color: var(--ax-danger-500) !important; }

.ax-float--area .ax-float__input { height: auto; min-height: 84px; padding-top: 18px; resize: vertical; }
.ax-float--area .ax-float__label { top: 18px; transform: none; }
.ax-float--area .ax-float__input:focus + .ax-float__label,
.ax-float--area .ax-float__input:not(:placeholder-shown) + .ax-float__label { top: 0; transform: translateY(-50%); }

.ax-field-feedback { display: flex; align-items: center; gap: 4px; margin-top: 4px; font-size: var(--ax-text-2xs); min-height: 16px; }
.ax-field-feedback--error { color: var(--ax-danger-500); }

.kashmir-install-form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--ax-space-4); }
@media (min-width: 1024px) { .kashmir-install-form-grid--3col { grid-template-columns: repeat(3, 1fr); } }
@media (min-width: 1024px) { .kashmir-install-form-grid--2col { grid-template-columns: repeat(2, 1fr); } }
.kashmir-install-form-col-span-full { grid-column: 1 / -1; }
.kashmir-install-gps-cell { height: 46px; }

.kashmir-install-form-sticky-bar { position: sticky; bottom: var(--ax-space-4); z-index: 30; margin-top: var(--ax-space-6); padding: var(--ax-space-3) var(--ax-space-5); background: var(--ax-surface-solid); border: 1px solid var(--ax-border); border-radius: var(--ax-radius-xl); box-shadow: var(--ax-shadow-lg); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--ax-space-3); backdrop-filter: blur(12px); }

@keyframes kashmir-install-spin { to { transform: rotate(360deg); } }

.kashmir-install-single-card-form img { border-radius: 0 !important; }

/* Info grid for read-only site detail */
.kashmir-install-single-card-form .info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
  background: var(--ax-surface-subtle, #f8fafc);
  padding: 16px;
  border-radius: var(--ax-radius-md, 8px);
  border: 1px solid var(--ax-border-subtle, #e2e8f0);
}
.kashmir-install-single-card-form .info-item dt {
  font-size: 11px;
  font-weight: 600;
  color: var(--ax-text-muted, #64748b);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 2px;
}
.kashmir-install-single-card-form .info-item dd {
  font-size: 13px;
  font-weight: 600;
  color: var(--ax-text-strong, #0f172a);
  margin: 0;
  word-break: break-word;
}
`;

/* ═══════════════════════════════════════════════════════════════════
 * Sections definition
 * ═══════════════════════════════════════════════════════════════════ */
const SECTIONS = [
  { id: 'sec-1', num: '1', title: 'Site Information' },
  { id: 'sec-2', num: '2', title: 'Contact & Equipment' },
  { id: 'sec-3', num: '3', title: 'GPS & Panels' },
  { id: 'sec-4', num: '4', title: 'Photo Evidence' },
];
const TOTAL_SECTIONS = SECTIONS.length;

type Option = { value: string; label: string };

const DASH = '—';

interface SiteDetail {
  id: number;
  uid?: string;
  state?: string;
  district?: string;
  dept_name?: string;
  site_name?: string;
  location?: string;
  firm_name?: string;
  ca_no?: string;
  sanction_load?: string;
  plant_sc?: string;
  wo_no?: string;
  phase?: string;
  vendor?: string;
  inst_date?: string;
  material_i_date?: string;
  mb_invoice?: string;
  [key: string]: any;
}

type FileKey = 'panel_image' | 'system_image' | 'inverter_image' | 'nm_sm_image' | 'loger_image';

/* ═══════════════════════════════════════════════════════════════════
 * Main Component
 * ═══════════════════════════════════════════════════════════════════ */
export function Kashmir_Installation_InstallSites() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, rawResponse } = useAuth();

  const querySiteId = searchParams.get('srt_id') || searchParams.get('site_id') || searchParams.get('id') || '';
  const isEditMode = Boolean(searchParams.get('edit') === '1');

  // Resolved logged in vendor identity
  const loginVendorName = useMemo(() => {
    const getClean = (val: any) => (typeof val === 'string' && val.trim() ? val.trim() : '');
    if (user) {
      const fromUser =
        getClean((user as any).vendor_name) ||
        getClean((user as any).name) ||
        getClean((user as any).firm_name) ||
        getClean((user as any).vendor) ||
        getClean((user as any).username);
      if (fromUser) return fromUser;
    }
    if (rawResponse) {
      const fromRaw =
        getClean(rawResponse?.vendor?.vendor_name) ||
        getClean(rawResponse?.vendor?.name) ||
        getClean(rawResponse?.vendor_name) ||
        getClean(rawResponse?.name);
      if (fromRaw) return fromRaw;
    }
    try {
      const sess = authService.getSession() as any;
      if (sess) {
        const fromSess = getClean(sess.vendor_name) || getClean(sess.name) || getClean(sess.firm_name);
        if (fromSess) return fromSess;
      }
    } catch {
      // ignore
    }
    return '0';
  }, [user, rawResponse]);

  // Dropdown options
  const [siteOptions, setSiteOptions] = useState<{ id: number; site_name: string }[]>([]);
  const [loadingSites, setLoadingSites] = useState(false);
  const [selectedSrtId, setSelectedSrtId] = useState<string>(querySiteId);

  // Selected site detailed information
  const [siteDetail, setSiteDetail] = useState<SiteDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Form fields
  const [contactPerson, setContactPerson] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [inverterNo, setInverterNo] = useState('');
  const [solarmeterNo, setSolarmeterNo] = useState('');
  const [nmSmNo, setNmSmNo] = useState('');
  const [logerNo, setLogerNo] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [remarks, setRemarks] = useState('');
  const [panels, setPanels] = useState<string[]>(['']);

  // Dispatched material state (for prefilling and auto-validation)
  const [dispatchedMaterial, setDispatchedMaterial] = useState<{
    inverter_no?: string;
    solarmeter_no?: string;
    nm_sm_no?: string;
    loger_no?: string;
  } | null>(null);

  // Photos
  const [files, setFiles] = useState<Record<FileKey, File | null>>({
    panel_image: null,
    system_image: null,
    inverter_image: null,
    nm_sm_image: null,
    loger_image: null,
  });

  // Existing photo URLs (for edit mode)
  const [existingPhotos, setExistingPhotos] = useState<Record<string, string | undefined>>({});

  const handleFileChange = (key: FileKey, file: File | null) => {
    setFiles((prev) => ({ ...prev, [key]: file }));
    if (validationErrors[key]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  // UI state
  const [geoLocating, setGeoLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [previewModalImg, setPreviewModalImg] = useState<{ url: string; title: string } | null>(null);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // 1. Fetch available sites for dropdown
  useEffect(() => {
    (async () => {
      setLoadingSites(true);
      try {
        const list = await kashmirSrtService.fetchSites();
        setSiteOptions(Array.isArray(list) ? list : []);
      } catch (err: any) {
        console.warn('Failed to load site dropdown:', err);
      } finally {
        setLoadingSites(false);
      }
    })();
  }, []);

  // 2. Fetch site detail when selected
  const loadSiteDetail = async (id: string | number) => {
    if (!id) {
      setSiteDetail(null);
      return;
    }
    setLoadingDetail(true);
    try {
      if (isEditMode) {
        // Load edit details
        const editData = await kashmirSrtService.getSiteUpdate(id);
        const srt = editData?.srt || {};
        const ven = editData?.ven || {};

        setSiteDetail({
          id: Number(id),
          site_name: srt.site_name,
          district: srt.district || ven.district,
          state: srt.state || 'kashmir',
          firm_name: ven.name || srt.firm_name,
          ca_no: srt.ca_no,
          sanction_load: srt.sanction_load,
          plant_sc: srt.plant_sc,
          wo_no: srt.wo_no,
          phase: srt.phase,
          vendor: ven.name,
          inst_date: srt.inst_date,
          material_i_date: srt.material_i_date,
          mb_invoice: srt.mb_invoice,
        });

        // Populate fields
        setContactPerson(srt.contact_person || ven.contact_person || '');
        setContactNumber(srt.contact_number || ven.contact || '');
        setInverterNo(srt.inverter_no || '');
        setSolarmeterNo(srt.solarmeter_no || '');
        setNmSmNo(srt.nm_sm_no || '');
        setLogerNo(srt.loger_no || '');
        setLatitude(String(srt.inst_latitude || ''));
        setLongitude(String(srt.inst_longitude || ''));
        setRemarks(srt.inst_remarks || '');

        // Panels parsing
        try {
          if (Array.isArray(srt.panel_no)) {
            setPanels(srt.panel_no.length > 0 ? srt.panel_no : ['']);
          } else if (typeof srt.panel_no === 'string') {
            const parsed = JSON.parse(srt.panel_no);
            setPanels(Array.isArray(parsed) && parsed.length > 0 ? parsed : ['']);
          }
        } catch {
          setPanels(['']);
        }

        // Existing image previews
        setExistingPhotos({
          panel_image: srt.panel_image ? getKashmirMediaUrl(srt.panel_image) : undefined,
          system_image: srt.system_image ? getKashmirMediaUrl(srt.system_image) : undefined,
          inverter_image: srt.inverter_image ? getKashmirMediaUrl(srt.inverter_image) : undefined,
          nm_sm_image: srt.nm_sm_image ? getKashmirMediaUrl(srt.nm_sm_image) : undefined,
          loger_image: srt.loger_image ? getKashmirMediaUrl(srt.loger_image) : undefined,
        });
      } else {
        // Standard fresh installation details
        const detail = await kashmirSrtService.fetchSiteDetail(id);
        if (detail) {
          setSiteDetail(detail);
          if (detail.contact_person) setContactPerson(detail.contact_person);
          if (detail.contact_number) setContactNumber(detail.contact_number);
          if (detail.inverter_no) setInverterNo(detail.inverter_no);
          if (detail.solarmeter_no) setSolarmeterNo(detail.solarmeter_no);
          if (detail.nm_sm_no) setNmSmNo(detail.nm_sm_no);
          if (detail.loger_no) setLogerNo(detail.loger_no);
        }

        // Fetch dispatched material for this site to auto-populate valid equipment serial numbers
        try {
          const dispatchResp = await kashmirSrtService.getViewDispatchMaterial();
          const list: any[] = dispatchResp?.dispatchmaterial || dispatchResp || [];
          const matched = list.find(
            (d: any) => String(d.site_id) === String(id) || String(d.id) === String(id)
          );
          if (matched) {
            setDispatchedMaterial({
              inverter_no: matched.inverter_no || '',
              solarmeter_no: matched.solarmeter_no || '',
              nm_sm_no: matched.nm_sm_no || '',
              loger_no: matched.loger_no || '',
            });
            if (matched.inverter_no) setInverterNo(matched.inverter_no);
            if (matched.solarmeter_no) setSolarmeterNo(matched.solarmeter_no);
            if (matched.nm_sm_no) setNmSmNo(matched.nm_sm_no);
            if (matched.loger_no) setLogerNo(matched.loger_no);
          }
        } catch (e) {
          console.warn('Could not load dispatched material:', e);
        }
      }
    } catch (err: any) {
      console.warn('Failed to load site details:', err);
      setFeedback({ type: 'error', message: err?.message || 'Failed to fetch site details.' });
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    if (selectedSrtId) {
      loadSiteDetail(selectedSrtId);
    }
  }, [selectedSrtId]);

  // GPS Coordinate Detection
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setGeoLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
        setGeoLocating(false);
      },
      (err) => {
        alert(`Failed to detect GPS: ${err.message}`);
        setGeoLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Dynamic Panels handlers
  const handleAddPanel = () => {
    setPanels((prev) => [...prev, '']);
  };

  const handlePanelChange = (index: number, val: string) => {
    setPanels((prev) => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  };

  const handleRemovePanel = (index: number) => {
    if (panels.length <= 1) return;
    setPanels((prev) => prev.filter((_, i) => i !== index));
  };

  // Form Validation
  const validateForm = () => {
    const errs: Record<string, string> = {};

    if (!selectedSrtId) errs.selectedSrtId = 'Please select a Site ID.';
    if (!contactPerson.trim()) errs.contactPerson = 'Contact Person Name is required.';
    if (!contactNumber.trim()) {
      errs.contactNumber = 'Contact Number is required.';
    } else if (!/^\d{10,12}$/.test(contactNumber.trim())) {
      errs.contactNumber = 'Contact Number must be between 10 and 12 digits.';
    }

    if (!inverterNo.trim()) errs.inverterNo = 'Inverter Number is required.';
    if (!solarmeterNo.trim()) errs.solarmeterNo = 'Solar Meter Number is required.';
    if (!nmSmNo.trim()) errs.nmSmNo = 'Net Meter / Smart Meter Number is required.';
    if (!logerNo.trim()) errs.logerNo = 'RMS Loger Number is required.';

    if (!latitude.trim()) errs.latitude = 'Latitude is required.';
    if (!longitude.trim()) errs.longitude = 'Longitude is required.';

    const validPanels = panels.map((p) => p.trim()).filter(Boolean);
    if (validPanels.length === 0) {
      errs.panels = 'At least one Panel Number is required.';
    } else {
      const uniquePanels = new Set(validPanels);
      if (uniquePanels.size !== validPanels.length) {
        errs.panels = 'Duplicate panel numbers detected. Each panel must be unique.';
      }
    }

    if (!isEditMode) {
      if (!files.panel_image) errs.panel_image = 'Panel Image is required.';
      if (!files.system_image) errs.system_image = 'System Image is required.';
      if (!files.inverter_image) errs.inverter_image = 'Inverter Image is required.';
      if (!files.nm_sm_image) errs.nm_sm_image = 'Net Meter / Smart Meter Image is required.';
      if (!files.loger_image) errs.loger_image = 'Loger Image is required.';
    }

    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Form Submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!validateForm()) {
      setFeedback({ type: 'error', message: 'Please fix the highlighted errors before submitting.' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSubmitting(true);
    const fd = new FormData();
    fd.append('srt_id', String(selectedSrtId));
    fd.append('id', String(selectedSrtId));
    fd.append('site_id', String(selectedSrtId));

    if (loginVendorName) {
      fd.append('vendor', loginVendorName.trim());
      fd.append('vendor_name', loginVendorName.trim());
    }

    fd.append('contact_person', contactPerson.trim());
    fd.append('contact_number', contactNumber.trim());

    // Equipment serial numbers (including aliases)
    fd.append('inverter_no', inverterNo.trim());

    fd.append('solarmeter_no', solarmeterNo.trim());
    fd.append('solar_meter_no', solarmeterNo.trim());

    fd.append('nm_sm_no', nmSmNo.trim());
    fd.append('netmeter_no', nmSmNo.trim());

    fd.append('loger_no', logerNo.trim());
    fd.append('logger_no', logerNo.trim());
    fd.append('rms_loger_no', logerNo.trim());

    // GPS coordinates (including aliases)
    fd.append('inst_latitude', latitude.trim());
    fd.append('latitude', latitude.trim());
    fd.append('inst_longitude', longitude.trim());
    fd.append('longitude', longitude.trim());

    if (remarks.trim()) {
      fd.append('inst_remarks', remarks.trim());
      fd.append('remarks', remarks.trim());
    }

    // Panels
    const cleanPanels = panels.map((p) => p.trim()).filter(Boolean);
    cleanPanels.forEach((p) => {
      fd.append('panel_no[]', p);
    });

    // Photos (including aliases)
    if (files.panel_image) {
      fd.append('panel_image', files.panel_image);
      fd.append('solar_panel_photo', files.panel_image);
    }
    if (files.system_image) {
      fd.append('system_image', files.system_image);
    }
    if (files.inverter_image) {
      fd.append('inverter_image', files.inverter_image);
      fd.append('inverter_photo', files.inverter_image);
    }
    if (files.nm_sm_image) {
      fd.append('nm_sm_image', files.nm_sm_image);
      fd.append('netmeter_photo', files.nm_sm_image);
    }
    if (files.loger_image) {
      fd.append('loger_image', files.loger_image);
      fd.append('loger_photo', files.loger_image);
    }

    // Metadata identifiers if loaded
    if (siteDetail?.site_name) fd.append('site_name', String(siteDetail.site_name).trim());
    if (siteDetail?.site_code) fd.append('site_code', String(siteDetail.site_code).trim());
    if (siteDetail?.ca_no) fd.append('ca_no', String(siteDetail.ca_no).trim());
    if (siteDetail?.wo_no) fd.append('wo_no', String(siteDetail.wo_no).trim());
    if (siteDetail?.dispatch_id) fd.append('dispatch_id', String(siteDetail.dispatch_id).trim());

    try {
      if (isEditMode) {
        const res = await kashmirSrtService.updateSiteDetails(fd);
        setFeedback({
          type: 'success',
          message: res.message || 'Installation Details Updated Successfully! Status reset to pending verification.',
        });
      } else {
        const res = await kashmirSrtService.storeSiteDetails(fd);
        setFeedback({
          type: 'success',
          message: res.message || 'Kashmir SRT Site Installation Details Submitted Successfully!!!',
        });
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => {
        navigate('/v/kashmir/srt/70mw/view-install-sites');
      }, 1500);
    } catch (err: any) {
      console.error('Submit failed:', err);
      const data = err?.data;
      const backendErrors = err?.errors || data?.errors || {};
      const newFieldErrors: Record<string, string> = {};

      if (typeof backendErrors === 'object' && backendErrors !== null) {
        Object.entries(backendErrors).forEach(([k, v]) => {
          const msg = Array.isArray(v) ? v.join(' ') : String(v);
          if (k === 'srt_id' || k === 'id' || k === 'site_id') newFieldErrors.selectedSrtId = msg;
          else if (k === 'contact_person') newFieldErrors.contactPerson = msg;
          else if (k === 'contact_number') newFieldErrors.contactNumber = msg;
          else if (k === 'inverter_no') newFieldErrors.inverterNo = msg;
          else if (k === 'solarmeter_no' || k === 'solar_meter_no') newFieldErrors.solarmeterNo = msg;
          else if (k === 'nm_sm_no' || k === 'netmeter_no') newFieldErrors.nmSmNo = msg;
          else if (k === 'loger_no' || k === 'logger_no' || k === 'rms_loger_no') newFieldErrors.logerNo = msg;
          else if (k === 'inst_latitude' || k === 'latitude') newFieldErrors.latitude = msg;
          else if (k === 'inst_longitude' || k === 'longitude') newFieldErrors.longitude = msg;
          else if (k.startsWith('panel_no')) newFieldErrors.panels = msg;
          else if (k === 'panel_image' || k === 'solar_panel_photo') newFieldErrors.panel_image = msg;
          else if (k === 'system_image') newFieldErrors.system_image = msg;
          else if (k === 'inverter_image' || k === 'inverter_photo') newFieldErrors.inverter_image = msg;
          else if (k === 'nm_sm_image' || k === 'netmeter_photo') newFieldErrors.nm_sm_image = msg;
          else if (k === 'loger_image' || k === 'loger_photo') newFieldErrors.loger_image = msg;
        });
      }

      const msg = err?.message || data?.message || data?.panel_no || 'Validation failed (422)';
      if (/inverter/i.test(msg)) newFieldErrors.inverterNo = msg;
      if (/loger|logger/i.test(msg)) newFieldErrors.logerNo = msg;
      if (/net\/smart|nm_sm|netmeter/i.test(msg)) newFieldErrors.nmSmNo = msg;
      if (/solar/i.test(msg)) newFieldErrors.solarmeterNo = msg;
      if (/panel/i.test(msg)) newFieldErrors.panels = msg;

      setValidationErrors((prev) => ({ ...prev, ...newFieldErrors }));
      setFeedback({
        type: 'error',
        message: msg,
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  const siteSelectOptions: Option[] = siteOptions.map((s) => ({
    value: String(s.id),
    label: `${s.id} - ${s.site_name}`,
  }));

  return (
    <div className="kashmir-install-single-card-form">
      <style>{SINGLE_CARD_FORM_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="Kashmir SRT 70MW Install Site"
        subtitle={
          <span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>
            Record physical installation, equipment serial numbers, geotag evidence and component photos
          </span>
        }
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Kashmir' },
          { label: 'SRT 70MW Install Site' },
        ]}
        actions={
          <div className="ax-cluster" style={{ gap: 8 }}>
            <Link to="/v/kashmir/srt/70mw/installation/assign-site" className="ax-btn ax-btn--secondary ax-btn--pill">
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l14 0" /><path d="M5 12l6 6" /><path d="M5 12l6 -6" /></svg>
              <span className="ax-btn__label">Assign Sites</span>
            </Link>
            <Link to="/v/kashmir/srt/70mw/view-install-sites" className="ax-btn ax-btn--ghost ax-btn--pill">
              <span className="ax-btn__label">View Installations</span>
            </Link>
          </div>
        }
      />

      {/* Success Banner */}
      {feedback?.type === 'success' && (
        <div className="ax-alert ax-alert--success" role="status" style={{ marginBottom: 'var(--ax-space-6)' }}>
          <span className="ax-alert__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5l10 -10" /></svg>
          </span>
          <div className="ax-alert__content">
            <h3 className="ax-alert__title" style={{ fontSize: 'var(--ax-text-base)', fontWeight: 600 }}>{feedback.message}</h3>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {feedback?.type === 'error' && (
        <div className="ax-alert ax-alert--danger" role="alert" style={{ marginBottom: 'var(--ax-space-6)' }}>
          <span className="ax-alert__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4" /><path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0" /><path d="M12 16h.01" /></svg>
          </span>
          <div className="ax-alert__content">
            <h4 className="ax-alert__title" style={{ fontWeight: 600 }}>{feedback.message}</h4>
          </div>
        </div>
      )}

      {/* ── Unified Single Form Card ── */}
      <form onSubmit={handleSubmit} noValidate>
        <div className="ax-card">
          {/* Card Header with Title and Section Pills */}
          <div className="ax-card__header">
            <div>
              <span className="ax-card__eyebrow">Installation</span>
              <h2 className="ax-card__title" style={{ margin: 0 }}>
                {isEditMode ? 'Update Kashmir SRT 70MW Installation Data' : 'Kashmir SRT 70MW Site Installation'}
              </h2>
              <p className="ax-card__subtitle" style={{ margin: '4px 0 0' }}>
                The field labels marked with <span style={{ color: 'var(--ax-danger-500)', fontWeight: 700 }}>*</span> are required input fields.
              </p>
            </div>

            <div className="kashmir-install-section-pills" role="navigation" aria-label="Jump to section">
              {SECTIONS.map((s) => (
                <button key={s.id} type="button" onClick={() => scrollToSection(s.id)} className="kashmir-install-section-pill-btn">
                  <span className="pill-num">{s.num}</span>
                  <span>{s.title}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="ax-card__body">
            {/* ═════════ SECTION 1: SITE INFORMATION ═════════ */}
            <div id="sec-1" className="kashmir-install-section-block">
              <SectionHeader num="1" title="Site Information" desc="Select an assigned SRT site to populate sanctioned load, CA number and dispatch metadata." />
              <div className="kashmir-install-form-grid kashmir-install-form-grid--3col" style={{ marginBottom: 'var(--ax-space-5)' }}>
                <FloatingSelect
                  id="install-site-select"
                  label="Select Id"
                  required
                  placeholder={loadingSites ? 'Loading sites…' : '-- Choose Assigned Site --'}
                  value={selectedSrtId}
                  options={siteSelectOptions}
                  disabled={loadingSites || (isEditMode && Boolean(querySiteId))}
                  onChange={(v) => {
                    setSelectedSrtId(v);
                    if (validationErrors.selectedSrtId) {
                      setValidationErrors((prev) => ({ ...prev, selectedSrtId: '' }));
                    }
                  }}
                  error={validationErrors.selectedSrtId}
                />
              </div>

              {/* Read-only Site Information Specs Grid */}
              {loadingDetail ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--ax-text-muted)' }}>
                  <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading site specifications…
                </div>
              ) : siteDetail ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--ax-space-4)' }}>
                    <span className="ax-badge ax-badge--soft ax-badge--info ax-badge--pill" style={{ fontSize: 'var(--ax-text-2xs)' }}>Auto-filled</span>
                    <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>Site specifications from selected site</span>
                    <span className="ax-badge ax-badge--soft ax-badge--accent ax-badge--pill" style={{ marginLeft: 'auto' }}>
                      Site ID: #{siteDetail.id} {siteDetail.uid ? `(${siteDetail.uid})` : ''}
                    </span>
                  </div>
                  <dl className="info-grid">
                    <div className="info-item">
                      <dt>State</dt>
                      <dd style={{ textTransform: 'capitalize' }}>{siteDetail.state || 'Kashmir'}</dd>
                    </div>
                    <div className="info-item">
                      <dt>District</dt>
                      <dd>{siteDetail.district || DASH}</dd>
                    </div>
                    <div className="info-item">
                      <dt>Department Name</dt>
                      <dd>{siteDetail.dept_name || DASH}</dd>
                    </div>
                    <div className="info-item">
                      <dt>Site Name</dt>
                      <dd style={{ color: 'var(--ax-accent, #2563eb)' }}>{siteDetail.site_name || DASH}</dd>
                    </div>
                    <div className="info-item">
                      <dt>Location</dt>
                      <dd>{siteDetail.location || DASH}</dd>
                    </div>
                    <div className="info-item">
                      <dt>Firm Name</dt>
                      <dd>{siteDetail.firm_name || DASH}</dd>
                    </div>
                    <div className="info-item">
                      <dt>CA No.</dt>
                      <dd>{siteDetail.ca_no || DASH}</dd>
                    </div>
                    <div className="info-item">
                      <dt>Sanction Load</dt>
                      <dd>{siteDetail.sanction_load ? `${siteDetail.sanction_load} kW` : DASH}</dd>
                    </div>
                    <div className="info-item">
                      <dt>Plant SC</dt>
                      <dd>{siteDetail.plant_sc || DASH}</dd>
                    </div>
                    <div className="info-item">
                      <dt>WO No.</dt>
                      <dd>{siteDetail.wo_no || DASH}</dd>
                    </div>
                    <div className="info-item">
                      <dt>Phase</dt>
                      <dd>{siteDetail.phase || DASH}</dd>
                    </div>
                    <div className="info-item">
                      <dt>Vendor</dt>
                      <dd>{loginVendorName || siteDetail.firm_name || '0'}</dd>
                    </div>
                    <div className="info-item">
                      <dt>Date</dt>
                      <dd>{siteDetail.inst_date || new Date().toISOString().slice(0, 10)}</dd>
                    </div>
                    <div className="info-item">
                      <dt>Material Invoice Date</dt>
                      <dd>{siteDetail.material_i_date || DASH}</dd>
                    </div>
                    <div className="info-item">
                      <dt>Material Bill Invoice</dt>
                      <dd>{siteDetail.mb_invoice || DASH}</dd>
                    </div>
                  </dl>
                </>
              ) : (
                <div
                  style={{
                    padding: '24px 16px',
                    textAlign: 'center',
                    background: 'var(--ax-surface-subtle)',
                    borderRadius: 8,
                    color: 'var(--ax-text-muted)',
                    fontSize: 'var(--ax-text-sm)',
                  }}
                >
                  Please select a Site ID from the dropdown above to view site specifications.
                </div>
              )}
            </div>

            <hr className="kashmir-install-section-divider" />

            {/* ═════════ SECTION 2: CONTACT & EQUIPMENT ═════════ */}
            <div id="sec-2" className="kashmir-install-section-block">
              <SectionHeader num="2" title="Contact & Equipment" desc="Vendor identity, contact person details, and installed equipment serial numbers." />
              <div className="kashmir-install-form-grid kashmir-install-form-grid--3col">
                <FloatingInput
                  id="install-vendor"
                  label="Vendor"
                  required
                  readOnly
                  placeholder=" "
                  value={loginVendorName}
                />
                <FloatingInput
                  id="install-contact-person"
                  label="Contact Person"
                  required
                  placeholder="Enter Contact Person Name"
                  value={contactPerson}
                  onChange={(v) => setContactPerson(v)}
                  error={validationErrors.contactPerson}
                />
                <FloatingInput
                  id="install-contact-number"
                  label="Contact No."
                  type="tel"
                  maxLength={10}
                  required
                  placeholder="Enter Contact Number"
                  value={contactNumber}
                  onChange={(v) => setContactNumber(v.replace(/\D/g, ''))}
                  error={validationErrors.contactNumber}
                />
              </div>

              {dispatchedMaterial && (
                <div
                  style={{
                    marginTop: 'var(--ax-space-4)',
                    background: 'color-mix(in srgb, var(--ax-accent) 8%, var(--ax-surface-subtle))',
                    border: '1px solid color-mix(in srgb, var(--ax-accent) 24%, var(--ax-border))',
                    borderRadius: 'var(--ax-radius-md, 8px)',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 10,
                  }}
                >
                  <div style={{ fontSize: 'var(--ax-text-xs, 12px)', color: 'var(--ax-text)' }}>
                    <div style={{ fontWeight: 600, color: 'var(--ax-text-strong)', marginBottom: 2 }}>
                      📦 Dispatched Equipment Details for this Site (Backend Verification Match):
                    </div>
                    <div className="ax-cluster" style={{ gap: 12, flexWrap: 'wrap' }}>
                      {dispatchedMaterial.inverter_no && <span>Inverter: <strong>{dispatchedMaterial.inverter_no}</strong></span>}
                      {dispatchedMaterial.solarmeter_no && <span>Solar Meter: <strong>{dispatchedMaterial.solarmeter_no}</strong></span>}
                      {dispatchedMaterial.nm_sm_no && <span>Net/Smart: <strong>{dispatchedMaterial.nm_sm_no}</strong></span>}
                      {dispatchedMaterial.loger_no && <span>Logger: <strong>{dispatchedMaterial.loger_no}</strong></span>}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="ax-btn ax-btn--secondary ax-btn--sm ax-btn--pill"
                    onClick={() => {
                      if (dispatchedMaterial.inverter_no) setInverterNo(dispatchedMaterial.inverter_no);
                      if (dispatchedMaterial.solarmeter_no) setSolarmeterNo(dispatchedMaterial.solarmeter_no);
                      if (dispatchedMaterial.nm_sm_no) setNmSmNo(dispatchedMaterial.nm_sm_no);
                      if (dispatchedMaterial.loger_no) setLogerNo(dispatchedMaterial.loger_no);
                    }}
                  >
                    ✓ Apply Dispatched Numbers
                  </button>
                </div>
              )}

              <div className="kashmir-install-form-grid kashmir-install-form-grid--2col" style={{ marginTop: 'var(--ax-space-4)' }}>
                <FloatingInput
                  id="install-inverter-no"
                  label="Inverter No"
                  required
                  placeholder="Enter Inverter Number"
                  value={inverterNo}
                  onChange={(v) => setInverterNo(v)}
                  error={validationErrors.inverterNo}
                />
                <FloatingInput
                  id="install-solar-meter"
                  label="Solar Meter Number"
                  required
                  placeholder="Enter Solar Meter Number"
                  value={solarmeterNo}
                  onChange={(v) => setSolarmeterNo(v)}
                  error={validationErrors.solarmeterNo}
                />
                <FloatingInput
                  id="install-net-meter"
                  label="Net Meter / Smart Meter Number"
                  required
                  placeholder="Enter Net/Smart Meter Number"
                  value={nmSmNo}
                  onChange={(v) => setNmSmNo(v)}
                  error={validationErrors.nmSmNo}
                />
                <FloatingInput
                  id="install-loger-no"
                  label="RMS Loger Number"
                  required
                  placeholder="Enter RMS Loger Number"
                  value={logerNo}
                  onChange={(v) => setLogerNo(v)}
                  error={validationErrors.logerNo}
                />
              </div>
            </div>

            <hr className="kashmir-install-section-divider" />

            {/* ═════════ SECTION 3: GPS & PANELS ═════════ */}
            <div id="sec-3" className="kashmir-install-section-block">
              <SectionHeader num="3" title="GPS & Panels" desc="Geotag coordinates, installation remarks, and solar panel serial barcodes." />
              <div className="kashmir-install-form-grid kashmir-install-form-grid--3col">
                <FloatingInput
                  id="install-latitude"
                  label="Latitude"
                  required
                  placeholder="Enter Latitude"
                  value={latitude}
                  onChange={(v) => setLatitude(v)}
                  error={validationErrors.latitude}
                />
                <FloatingInput
                  id="install-longitude"
                  label="Longitude"
                  required
                  placeholder="Enter Longitude"
                  value={longitude}
                  onChange={(v) => setLongitude(v)}
                  error={validationErrors.longitude}
                />
                <div>
                  <button
                    type="button"
                    className="ax-btn ax-btn--secondary kashmir-install-gps-cell"
                    style={{ width: '100%' }}
                    onClick={handleGetLocation}
                    disabled={geoLocating}
                  >
                    <span className="ax-btn__label">{geoLocating ? 'Fetching GPS…' : '📍 Get GPS'}</span>
                  </button>
                </div>
              </div>

              <div style={{ marginTop: 'var(--ax-space-4)' }}>
                <FloatingTextarea
                  id="install-remarks"
                  label="Installation Remarks (optional)"
                  placeholder="Enter any physical site remarks or inspection notes…"
                  value={remarks}
                  rows={2}
                  onChange={(v) => setRemarks(v)}
                />
              </div>

              {/* ── Dynamic Solar Panels ── */}
              <div style={{ marginTop: 'var(--ax-space-6)', borderTop: '1px dashed var(--ax-border)', paddingTop: 'var(--ax-space-4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--ax-space-4)' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 'var(--ax-text-sm)', fontWeight: 700, color: 'var(--ax-text-strong)' }}>
                      Solar Panels Serial Numbers
                    </h4>
                    <p style={{ margin: '2px 0 0', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
                      Enter installed module serial barcodes matching dispatched material
                    </p>
                  </div>
                  <button
                    type="button"
                    className="ax-btn ax-btn--secondary ax-btn--sm"
                    onClick={handleAddPanel}
                    style={{ gap: 6 }}
                  >
                    <span>+ Add Panel</span>
                  </button>
                </div>

                {validationErrors.panels && (
                  <div className="ax-field-feedback ax-field-feedback--error" style={{ marginBottom: 'var(--ax-space-3)' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 12, height: 12 }}>
                      <circle cx="12" cy="12" r="9" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    {validationErrors.panels}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--ax-space-3)' }}>
                  {panels.map((panel, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ flex: 1 }}>
                        <FloatingInput
                          id={`install-panel-${idx}`}
                          label={`Panel No ${idx + 1}`}
                          required
                          placeholder="Enter Panel Number"
                          value={panel}
                          onChange={(v) => handlePanelChange(idx, v)}
                        />
                      </div>
                      {panels.length > 1 && (
                        <button
                          type="button"
                          className="ax-btn ax-btn--ghost ax-btn--sm ax-btn--icon"
                          style={{ marginTop: 4, color: 'var(--ax-danger-500)' }}
                          onClick={() => handleRemovePanel(idx)}
                          title="Remove panel"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <hr className="kashmir-install-section-divider" />

            {/* ═════════ SECTION 4: PHOTO EVIDENCE ═════════ */}
            <div id="sec-4" className="kashmir-install-section-block">
              <SectionHeader num="4" title="Photo Evidence" desc="Upload clear geo-tagged photos of all 5 installed equipment components (Max 5MB each)." />
              <div className="kashmir-install-form-grid kashmir-install-form-grid--3col">
                <FloatingFileInput
                  id="install-img-panel"
                  label="Panel Image"
                  required={!isEditMode}
                  accept="image/*"
                  file={files.panel_image}
                  existingUrl={existingPhotos.panel_image}
                  onChange={(file) => handleFileChange('panel_image', file)}
                  error={validationErrors.panel_image}
                  onPreview={existingPhotos.panel_image && !files.panel_image ? () => setPreviewModalImg({ url: existingPhotos.panel_image!, title: 'Panel Image' }) : undefined}
                />
                <FloatingFileInput
                  id="install-img-system"
                  label="System Image"
                  required={!isEditMode}
                  accept="image/*"
                  file={files.system_image}
                  existingUrl={existingPhotos.system_image}
                  onChange={(file) => handleFileChange('system_image', file)}
                  error={validationErrors.system_image}
                  onPreview={existingPhotos.system_image && !files.system_image ? () => setPreviewModalImg({ url: existingPhotos.system_image!, title: 'System Image' }) : undefined}
                />
                <FloatingFileInput
                  id="install-img-inverter"
                  label="Inverter Image"
                  required={!isEditMode}
                  accept="image/*"
                  file={files.inverter_image}
                  existingUrl={existingPhotos.inverter_image}
                  onChange={(file) => handleFileChange('inverter_image', file)}
                  error={validationErrors.inverter_image}
                  onPreview={existingPhotos.inverter_image && !files.inverter_image ? () => setPreviewModalImg({ url: existingPhotos.inverter_image!, title: 'Inverter Image' }) : undefined}
                />
                <FloatingFileInput
                  id="install-img-nm-sm"
                  label="Net Meter / Smart Meter Image"
                  required={!isEditMode}
                  accept="image/*"
                  file={files.nm_sm_image}
                  existingUrl={existingPhotos.nm_sm_image}
                  onChange={(file) => handleFileChange('nm_sm_image', file)}
                  error={validationErrors.nm_sm_image}
                  onPreview={existingPhotos.nm_sm_image && !files.nm_sm_image ? () => setPreviewModalImg({ url: existingPhotos.nm_sm_image!, title: 'Net / Smart Meter Image' }) : undefined}
                />
                <FloatingFileInput
                  id="install-img-loger"
                  label="Loger Image"
                  required={!isEditMode}
                  accept="image/*"
                  file={files.loger_image}
                  existingUrl={existingPhotos.loger_image}
                  onChange={(file) => handleFileChange('loger_image', file)}
                  error={validationErrors.loger_image}
                  onPreview={existingPhotos.loger_image && !files.loger_image ? () => setPreviewModalImg({ url: existingPhotos.loger_image!, title: 'Loger Image' }) : undefined}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="kashmir-install-form-sticky-bar">
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}>
            <span className="ax-badge ax-badge--soft ax-badge--primary ax-badge--pill">
              {isEditMode ? 'Edit Mode' : 'New Installation'}
            </span>
            {selectedSrtId && (
              <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
                Target Site: #{selectedSrtId}
              </span>
            )}
          </div>
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)' }}>
            <button
              type="button"
              className="ax-btn ax-btn--secondary"
              onClick={() => navigate('/v/kashmir/srt/70mw/installation/assign-site')}
              disabled={submitting}
            >
              <span className="ax-btn__label">Cancel</span>
            </button>
            <button type="submit" disabled={submitting} className="ax-btn ax-btn--primary" style={{ minWidth: 200 }}>
              {submitting ? (
                <>
                  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ animation: 'kashmir-install-spin 1s linear infinite' }}><path d="M12 3a9 9 0 1 0 9 9" /></svg>
                  <span className="ax-btn__label">{isEditMode ? 'Updating Details…' : 'Submitting…'}</span>
                </>
              ) : (
                <>
                  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5l10 -10" /></svg>
                  <span className="ax-btn__label">{isEditMode ? 'Save Changes' : 'Submit Installation Details'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Enlarged Photo Modal */}
      {previewModalImg && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => setPreviewModalImg(null)}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--icon"
              style={{ position: 'absolute', top: -14, right: -14, background: '#fff', borderRadius: '50%', zIndex: 10 }}
              onClick={() => setPreviewModalImg(null)}
            >
              ✕
            </button>
            <img
              src={previewModalImg.url}
              alt={previewModalImg.title}
              style={{ maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain', borderRadius: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
            />
          </div>
        </div>
      )}

      <footer style={{ marginTop: 'var(--ax-space-8)', textAlign: 'center', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
        Copyright © <a href="https://klkerp.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--ax-primary)' }}>ETS NETWORKS</a>. All rights reserved.
      </footer>
    </div>
  );
}

/* =========================================================================
 * Reusable Floating Components
 * ========================================================================= */

function SectionHeader({ num, title, desc }: { num: string; title: string; desc?: ReactNode }) {
  return (
    <div className="kashmir-install-section-header">
      <div className="kashmir-install-section-title-wrap">
        <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', alignItems: 'center' }}>
          <span className="ax-badge ax-badge--soft ax-badge--primary ax-badge--pill" style={{ fontWeight: 600 }}>
            Section {num} of {TOTAL_SECTIONS}
          </span>
          <h3 style={{ fontSize: 'var(--ax-text-base)', fontWeight: 600, margin: 0, color: 'var(--ax-text-strong)' }}>{title}</h3>
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
  step?: string;
  required?: boolean;
  readOnly?: boolean;
  maxLength?: number;
  placeholder?: string;
  value: string;
  onChange?: (val: string) => void;
  error?: string;
}

function FloatingInput({ id, label, type = 'text', step, required, readOnly, maxLength, placeholder = ' ', value, onChange, error }: FloatingInputProps) {
  return (
    <div>
      <div className="ax-float">
        <input
          id={id}
          type={type}
          step={step}
          className={`ax-input ax-float__input ${error ? 'is-invalid' : ''}`}
          placeholder={placeholder}
          value={value}
          readOnly={readOnly}
          maxLength={maxLength}
          onChange={(e) => onChange?.(e.target.value)}
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

function FloatingSelect({ id, label, required, disabled, placeholder = '-- Select --', value, options, onChange, error }: FloatingSelectProps) {
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

function FloatingTextarea({ id, label, required, placeholder = ' ', value, rows = 3, onChange, error }: FloatingTextareaProps) {
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
  file: File | null;
  existingUrl?: string | null;
  onChange: (file: File | null) => void;
  error?: string;
  onPreview?: () => void;
}

const IMG_RE = /\.(png|jpe?g|webp|gif|svg)$/i;

function FloatingFileInput({ id, label, required, accept, file, existingUrl, onChange, error, onPreview }: FloatingFileInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const objectUrl = useMemo(
    () => (file && file.type.startsWith('image/') ? URL.createObjectURL(file) : null),
    [file]
  );
  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

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
  const existingIsImage = Boolean(existingClean && IMG_RE.test(existingClean));

  const thumbStyle = {
    width: 44,
    height: 44,
    objectFit: 'cover' as const,
    borderRadius: 0,
    border: '1px solid var(--ax-border)',
    flexShrink: 0,
  };

  const iconCircle = (bg: string, fg: string, children: ReactNode) => (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        background: bg,
        color: fg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {children}
    </div>
  );

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
        style={{ display: 'none' }}
        onChange={(e) => onChange(e.target.files?.[0] || null)}
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
            : isHovered ? '1.5px dashed #94a3b8' : '1.5px dashed #cbd5e1',
          borderRadius: 8,
          background: isDragging
            ? '#eff6ff'
            : error
            ? '#fef2f2'
            : isHovered ? '#fbfcfd' : '#ffffff',
          padding: file || existingName ? '12px 16px' : '22px 16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          minHeight: 110,
        }}
      >
        {file ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, textAlign: 'left' }}>
              {objectUrl ? (
                <img src={objectUrl} alt={label} style={thumbStyle} />
              ) : (
                iconCircle('#ecfdf5', '#10b981',
                  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                )
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
              {existingIsImage && existingUrl ? (
                <img src={existingUrl} alt={label} style={thumbStyle} />
              ) : (
                iconCircle('#eff6ff', '#3b82f6',
                  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                )
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {existingName}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', marginTop: 2 }}>
                  Existing file · Click to replace
                </div>
              </div>
            </div>
            <div className="ax-cluster" style={{ gap: 6, flexShrink: 0 }}>
              {onPreview && (
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--sm"
                  onClick={(e) => { e.stopPropagation(); onPreview(); }}
                  style={{ color: 'var(--ax-accent)' }}
                >
                  View
                </button>
              )}
              <span className="ax-btn ax-btn--secondary ax-btn--sm" style={{ pointerEvents: 'none' }}>
                Replace
              </span>
            </div>
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
              {accept === 'application/pdf' ? 'PDF file' : 'JPG, PNG or WEBP'}
            </div>
          </>
        )}
      </div>

      <FieldFeedback error={error} />
    </div>
  );
}

export default Kashmir_Installation_InstallSites;