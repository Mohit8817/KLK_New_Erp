import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';

// CSS: Unified Single-Card Layout with Floating Labels & Section Dividers (same as UP Resco Install Site)
export const SINGLE_CARD_FORM_CSS = `
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
.ax-float__input:focus { border-color: var(--ax-accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--ax-accent) 20%, transparent); }
.ax-float__input[readonly] { background: var(--ax-surface-subtle); }
.ax-float__input:disabled { opacity: .7; cursor: not-allowed; background: var(--ax-surface-subtle); }

.ax-float__label { position: absolute; inset-inline-start: 12px; top: 50%; transform: translateY(-50%); margin: 0; padding: 0 4px; font-size: var(--ax-text-sm); color: var(--ax-text-subtle); background: var(--ax-surface-solid); border-radius: var(--ax-radius-xs); pointer-events: none; transition: top var(--ax-motion-fast) var(--ax-ease-standard), font-size var(--ax-motion-fast) var(--ax-ease-standard), color var(--ax-motion-fast) var(--ax-ease-standard); z-index: 2; white-space: nowrap; max-width: calc(100% - 24px); overflow: hidden; text-overflow: ellipsis; }

.ax-float__input:focus + .ax-float__label,
.ax-float__input:not(:placeholder-shown) + .ax-float__label,
.ax-float--select .ax-float__label,
.ax-float--date .ax-float__label,
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

.up-form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--ax-space-4); }
@media (min-width: 1024px) { .up-form-grid--3col { grid-template-columns: repeat(3, 1fr); } }
.up-form-col-span-full { grid-column: 1 / -1; }
.up-form-col-span-2 { grid-column: span 2; }
.up-gps-cell { height: 46px; }

.up-form-sticky-bar { position: sticky; bottom: var(--ax-space-4); z-index: 30; margin-top: var(--ax-space-6); padding: var(--ax-space-3) var(--ax-space-5); background: var(--ax-surface-solid); border: 1px solid var(--ax-border); border-radius: var(--ax-radius-xl); box-shadow: var(--ax-shadow-lg); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--ax-space-3); backdrop-filter: blur(12px); }

@keyframes up-spin { to { transform: rotate(360deg); } }
`;

type Option = { value: string; label: string };
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// ── 6 Main Sections Matching UP Resco Structure ──
const SECTIONS = [
  { id: 'sec-1', num: '1', title: 'Site Selection' },
  { id: 'sec-2', num: '2', title: 'Information' },
  { id: 'sec-3', num: '3', title: 'Maintenance Details' },
  { id: 'sec-4', num: '4', title: 'GPS Coordinates & Remarks' },
  { id: 'sec-5', num: '5', title: 'Photo Evidence' },
  { id: 'sec-6', num: '6', title: 'Raised Complaint' },
];

const MONTH_OPTIONS: Option[] = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

const AMC_TYPE_OPTIONS: Option[] = [
  { value: 'Monthly', label: 'Monthly' },
  { value: 'Quarterly', label: 'Quarterly' },
  { value: 'Half-Yearly', label: 'Half-Yearly' },
  { value: 'Yearly', label: 'Yearly' },
];

export interface UpAmcPendingFormProps {
  title: string;
  subtitle: string;
  projectEyebrow: string;
  breadcrumbs: { label: string; href?: string }[];
  viewLink: string;
  viewLabel: string;
  mode?: 'resco' | 'ssl' | 'ssl18w' | 'schedule';
  onFetchYears: () => Promise<number[]>;
  onFetchMonths?: (year: number) => Promise<(number | string)[]>;
  onFetchSites: (year: number, month?: number | string) => Promise<{ id: number | string; label: string; [key: string]: any }[]>;
  onFetchSiteDetails: (id: number | string, year?: number, month?: number | string) => Promise<any>;
  onSubmit: (formData: FormData) => Promise<{ status: boolean; message?: string; errors?: Record<string, string[]> }>;
  defaultAmcType?: string;
  photoMode?: 'beforeAfter' | 'fourImages';
  hasDigitalSignature?: boolean;
  hasJmrReport?: boolean;
}

export function UpAmcPendingForm(props: UpAmcPendingFormProps) {
  const {
    title,
    subtitle,
    projectEyebrow,
    breadcrumbs,
    viewLink,
    viewLabel,
    onFetchYears,
    onFetchMonths,
    onFetchSites,
    onFetchSiteDetails,
    onSubmit,
    defaultAmcType = 'Monthly',
  } = props;

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preSelectedId = searchParams.get('site_id') || searchParams.get('id') || '';

  // ── Section 1: Site Selection States ──
  const [years, setYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | ''>('');
  const [months, setMonths] = useState<(number | string)[]>([]);
  const [sites, setSites] = useState<{ id: number | string; label: string; [key: string]: any }[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>(preSelectedId);

  // ── Section 2: Information (Auto-populated 11 fields) ──
  const [siteInfo, setSiteInfo] = useState({
    state: '',
    district: '',
    village: '',
    beneficiaryName: '',
    contact: '',
    gender: '',
    phase: '',
    serialNumber: '',
    address: '',
    volume: '',
    contractorName: '',
  });

  // ── Section 3: Maintenance Details Inputs ──
  const [amcType, setAmcType] = useState(defaultAmcType);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [amcDate, setAmcDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [beneficiaryContact, setBeneficiaryContact] = useState('');

  // ── Section 4: GPS Coordinates & Remarks Inputs ──
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'fetching' | 'success' | 'unable'>('idle');
  const [remarks, setRemarks] = useState('');

  // ── Section 5: Photo Evidence ──
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [image1, setImage1] = useState<File | null>(null);
  const [image2, setImage2] = useState<File | null>(null);
  const [image3, setImage3] = useState<File | null>(null);

  // ── Section 6: Raised Complaint Inputs ──
  const [complaintText, setComplaintText] = useState('');
  const [complaintImage, setComplaintImage] = useState<File | null>(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [loadingYears, setLoadingYears] = useState(false);
  const [loadingSites, setLoadingSites] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const clearError = (name: string) => {
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Auto-detect GPS coordinates on mount
  useEffect(() => {
    handleDetectGps(true);
  }, []);

  const handleDetectGps = (silent = false) => {
    if (!navigator.geolocation) {
      setGpsStatus('unable');
      if (!silent) setToast({ type: 'error', message: 'Geolocation is not supported by your browser.' });
      return;
    }
    setGpsStatus('fetching');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
        setGpsStatus('success');
        clearError('latitude');
        clearError('longitude');
        if (!silent) setToast({ type: 'success', message: 'Current GPS coordinates detected successfully!' });
      },
      (err) => {
        setGpsStatus('unable');
        if (!silent) setToast({ type: 'error', message: `GPS error: ${err.message}` });
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Load Years on mount
  useEffect(() => {
    let active = true;
    setLoadingYears(true);
    onFetchYears()
      .then((resYears) => {
        if (!active) return;
        setYears(resYears);
        if (resYears.length > 0) {
          const currentY = new Date().getFullYear();
          const match = resYears.find((y) => y === currentY) || resYears[0];
          setSelectedYear(match);
        }
      })
      .catch((err) => {
        console.error('Error fetching years:', err);
      })
      .finally(() => {
        if (active) setLoadingYears(false);
      });
    return () => {
      active = false;
    };
  }, [onFetchYears]);

  // Load Months if callback provided
  useEffect(() => {
    if (!onFetchMonths || !selectedYear) return;
    let active = true;
    onFetchMonths(Number(selectedYear))
      .then((mList) => {
        if (active) {
          setMonths(mList || []);
          if (mList && mList.length > 0 && !selectedMonth) {
            setSelectedMonth(String(mList[0]));
          }
        }
      })
      .catch((e) => console.error('Error fetching months:', e));
    return () => {
      active = false;
    };
  }, [selectedYear, onFetchMonths]);

  // Load Sites when Year changes
  useEffect(() => {
    if (!selectedYear) return;
    let active = true;
    setSites([]);
    if (!preSelectedId) {
      setSelectedSiteId('');
      clearSiteInfo();
    }

    setLoadingSites(true);
    onFetchSites(Number(selectedYear), selectedMonth || undefined)
      .then((res: any) => {
        if (!active) return;
        let sList: any[] = [];
        if (Array.isArray(res)) {
          sList = res;
        } else if (Array.isArray(res?.srtsite)) {
          sList = res.srtsite;
        } else if (Array.isArray(res?.data?.srtsite)) {
          sList = res.data.srtsite;
        } else if (Array.isArray(res?.srt_site)) {
          sList = res.srt_site;
        } else if (Array.isArray(res?.data?.srt_site)) {
          sList = res.data.srt_site;
        } else if (Array.isArray(res?.sites)) {
          sList = res.sites;
        } else if (Array.isArray(res?.data?.sites)) {
          sList = res.data.sites;
        } else if (Array.isArray(res?.site_name)) {
          sList = res.site_name;
        } else if (Array.isArray(res?.data?.site_name)) {
          sList = res.data.site_name;
        } else if (Array.isArray(res?.data)) {
          sList = res.data;
        } else if (typeof res === 'object' && res !== null) {
          const arrVal = Object.values(res).find((v) => Array.isArray(v)) as any[] | undefined;
          if (arrVal) sList = arrVal;
        }

        const normalizedList = sList.map((s: any, idx: number) => {
          if (typeof s === 'string' || typeof s === 'number') {
            return {
              id: s,
              label: String(s),
              site_name: String(s),
            };
          }
          const id = s.id ?? s.site_id ?? s.site_name ?? idx + 1;
          const name = s.site_name ?? s.name ?? s.beneficiary_name ?? s.farmer_name ?? `Site #${id}`;
          return {
            id,
            label: name ? `${name} (ID: ${id})` : `Site #${id}`,
            site_name: name,
            ...s,
          };
        });

        setSites(normalizedList);
        if (preSelectedId && normalizedList.some((s) => String(s.id) === preSelectedId)) {
          setSelectedSiteId(preSelectedId);
        } else if (normalizedList.length > 0 && !selectedSiteId) {
          setSelectedSiteId(String(normalizedList[0].id));
        }
      })
      .catch(() => {
        if (active) setSites([]);
      })
      .finally(() => {
        if (active) setLoadingSites(false);
      });

    return () => {
      active = false;
    };
  }, [selectedYear, selectedMonth, onFetchSites]);

  const clearSiteInfo = () => {
    setSiteInfo({
      state: '',
      district: '',
      village: '',
      beneficiaryName: '',
      contact: '',
      gender: '',
      phase: '',
      serialNumber: '',
      address: '',
      volume: '',
      contractorName: '',
    });
  };

  const normalizeSite = (det: any) => {
    if (!det) return null;
    const raw =
      det?.srtsite ||
      det?.srt_site ||
      det?.data?.srtsite ||
      det?.data?.srt_site ||
      det?.data ||
      det?.kusumb ||
      det?.ongrid ||
      det?.offgrid ||
      det?.powerpack ||
      det?.ssl_details ||
      det?.site_details ||
      det;
    const d = Array.isArray(raw) ? raw[0] : raw;

    const bName = d.beneficiary_name || d.beneficiary || d.farmer_name || d.f_farmer_name || d.applicant_name || d.site_name || d.name || d.contact_person || '';
    const bContact = d.contact || d.mobile || d.f_mobile || d.beneficiary_contact || d.f_contact || d.contact_number || d.contact_no || d.contractor_number || d.contact_person_number || '';
    const st = d.state || 'UP';
    const dist = d.district || d.f_district || d.installation_dsitrict || '';
    const vill = d.village || d.f_village || d.installation_village || d.block || d.location || '';
    const gdr = d.gender || d.f_gender || d.farmer_gender || '';
    const ph = d.phase || d.f_phase || d.installation_phase || '';
    const srNo = d.serial_number || d.serial_no || d.f_sr_no || d.saral_id || d.application_no || d.ca_no || d.pole_no || d.light_no || d.system_id || d.wo_no || d.consumer_no || '';
    const addr = d.address || d.f_address || d.location || d.village_address || '';
    const vol = d.volume || d.pump_capacity || d.plant_capacity || d.capacity || d.sanction_load || d.wattage || d.plant_sc || '';
    const cName = d.contractor_name || d.contractor || d.vendor_name || d.vendor || '';

    let aType = d.amc_type || det.amc_type_name || d.amc_type_name || defaultAmcType;
    if (aType === 'M') aType = 'Monthly';
    else if (aType === 'Q') aType = 'Quarterly';
    else if (aType === 'H') aType = 'Half-Yearly';
    else if (aType === 'Y') aType = 'Yearly';

    return {
      state: st,
      district: dist,
      village: vill,
      beneficiaryName: String(bName),
      contact: String(bContact),
      gender: String(gdr),
      phase: String(ph),
      serialNumber: String(srNo),
      address: String(addr),
      volume: String(vol),
      contractorName: String(cName),
      amcType: aType,
      amcDate: d.amc_date || d.date || '',
      latitude: d.latitude || d.lat || '',
      longitude: d.longitude || d.long || d.lng || '',
      month: d.month || d.report_month || '',
    };
  };

  // Load Site Details when selectedSiteId changes
  useEffect(() => {
    if (!selectedSiteId) {
      clearSiteInfo();
      return;
    }
    let active = true;
    onFetchSiteDetails(selectedSiteId, selectedYear ? Number(selectedYear) : undefined, selectedMonth || undefined)
      .then((det) => {
        if (!active || !det) return;
        const norm = normalizeSite(det);
        if (norm) {
          setSiteInfo({
            state: norm.state,
            district: norm.district,
            village: norm.village,
            beneficiaryName: norm.beneficiaryName,
            contact: norm.contact,
            gender: norm.gender,
            phase: norm.phase,
            serialNumber: norm.serialNumber,
            address: norm.address,
            volume: norm.volume,
            contractorName: norm.contractorName,
          });

          if (norm.beneficiaryName) setBeneficiaryName(norm.beneficiaryName);
          if (norm.contact) setBeneficiaryContact(norm.contact);
          if (norm.amcType) setAmcType(norm.amcType);
          if (norm.amcDate) setAmcDate(norm.amcDate);
          if (norm.month && !selectedMonth) setSelectedMonth(String(norm.month));
          if (norm.latitude && !latitude) setLatitude(String(norm.latitude));
          if (norm.longitude && !longitude) setLongitude(String(norm.longitude));
        }
      })
      .catch((err) => {
        console.error('Error fetching site details:', err);
      });

    return () => {
      active = false;
    };
  }, [selectedSiteId]);

  const handleReset = () => {
    setSelectedSiteId('');
    clearSiteInfo();
    setBeneficiaryName('');
    setBeneficiaryContact('');
    setAmcDate(new Date().toISOString().slice(0, 10));
    setLatitude('');
    setLongitude('');
    setGpsStatus('idle');
    setRemarks('');
    setSelectedMonth('');
    setDocumentFile(null);
    setImage1(null);
    setImage2(null);
    setImage3(null);
    setComplaintText('');
    setComplaintImage(null);
    setErrors({});
    setToast(null);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!selectedSiteId) errs.site = 'Please select a site';
    if (!amcType) errs.amcType = 'AMC Type is required';
    if (!selectedMonth) errs.month = 'Please select month';
    if (!amcDate) errs.amcDate = 'AMC Date is required';
    if (!beneficiaryName.trim()) errs.beneficiaryName = 'Beneficiary Name is required';
    if (!beneficiaryContact.trim()) {
      errs.beneficiaryContact = 'Beneficiary Contact is required';
    } else if (!/^\d{10}$/.test(beneficiaryContact.replace(/\D/g, ''))) {
      errs.beneficiaryContact = 'Contact must be a valid 10-digit number';
    }
    if (!latitude.trim()) errs.latitude = 'AMC Latitude is required';
    if (!longitude.trim()) errs.longitude = 'AMC Longitude is required';
    if (!documentFile) errs.documentFile = 'Document Upload is required';
    if (!image1) errs.image1 = 'AMC Image 1 is required';
    if (!image2) errs.image2 = 'AMC Image 2 is required';
    if (!image3) errs.image3 = 'AMC Image 3 is required';
    if (complaintImage && !complaintText.trim()) {
      errs.complaint = 'Please enter complaint description if uploading complaint image';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setToast(null);
    if (!validate()) {
      setToast({ type: 'error', message: 'Please fill in all mandatory fields.' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => {
        document.querySelector('.is-invalid')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('id', selectedSiteId);
      fd.append('site_id', selectedSiteId);

      if (selectedYear) {
        fd.append('amc_years', String(selectedYear));
        fd.append('year', String(selectedYear));
        fd.append('report_year', String(selectedYear));
      }

      if (selectedMonth) {
        fd.append('month', String(selectedMonth));
        fd.append('months', String(selectedMonth));
        fd.append('amc_months', String(selectedMonth));
        fd.append('report_month', String(selectedMonth));
        if (selectedYear) {
          fd.append('month_year', `${String(selectedMonth).padStart(2, '0')}-${selectedYear}`);
        }
      }

      fd.append('amc_type', amcType);
      if (amcType === 'Monthly') fd.append('amc_type_code', 'M');
      else if (amcType === 'Quarterly') fd.append('amc_type_code', 'Q');
      else if (amcType === 'Half-Yearly') fd.append('amc_type_code', 'H');
      else if (amcType === 'Yearly') fd.append('amc_type_code', 'Y');

      const finalAmcDate = amcDate || new Date().toISOString().slice(0, 10);
      fd.append('amc_date', finalAmcDate);
      fd.append('date', finalAmcDate);
      fd.append('report_date', finalAmcDate);

      fd.append('beneficiary_name', beneficiaryName.trim());
      fd.append('farmer_name', beneficiaryName.trim());
      fd.append('f_farmer_name', beneficiaryName.trim());

      fd.append('beneficiary_contact', beneficiaryContact.trim());
      fd.append('contact', beneficiaryContact.trim());
      fd.append('mobile', beneficiaryContact.trim());
      fd.append('f_mobile', beneficiaryContact.trim());
      fd.append('amc_beneficiary_contact', beneficiaryContact.trim());

      if (latitude) {
        fd.append('latitude', latitude);
        fd.append('amc_latitude', latitude);
      }
      if (longitude) {
        fd.append('longitude', longitude);
        fd.append('amc_longitude', longitude);
      }

      if (remarks) {
        fd.append('remarks', remarks.trim());
        fd.append('remark', remarks.trim());
        fd.append('amc_remark', remarks.trim());
      }

      // Append 11 Information fields
      fd.append('state', siteInfo.state || 'UP');
      fd.append('district', siteInfo.district || '');
      fd.append('village', siteInfo.village || '');
      fd.append('gender', siteInfo.gender || '');
      fd.append('phase', siteInfo.phase || '');
      fd.append('serial_number', siteInfo.serialNumber || '');
      fd.append('address', siteInfo.address || '');
      fd.append('volume', siteInfo.volume || '');
      fd.append('contractor_name', siteInfo.contractorName || '');

      // Append Files
      if (documentFile) {
        fd.append('document', documentFile);
        fd.append('file', documentFile);
        fd.append('document_file', documentFile);
        fd.append('upload_file', documentFile);
      }
      if (image1) {
        fd.append('image1', image1);
        fd.append('amc_image1', image1);
        fd.append('before_cleaning_photo[]', image1);
      }
      if (image2) {
        fd.append('image2', image2);
        fd.append('amc_image2', image2);
        fd.append('after_cleaning_photo[]', image2);
      }
      if (image3) {
        fd.append('image3', image3);
        fd.append('amc_image3', image3);
      }

      // Complaint Section
      if (complaintText.trim()) {
        fd.append('raised_complaint', '1');
        fd.append('complaint', complaintText.trim());
        if (complaintImage) {
          fd.append('complaint_image', complaintImage);
          fd.append('complaint_file', complaintImage);
          fd.append('file1', complaintImage);
        }
      } else {
        fd.append('raised_complaint', '0');
        fd.append('complaint', '');
      }

      const res = await onSubmit(fd);
      if (res.status) {
        setToast({ type: 'success', message: res.message || 'AMC report submitted successfully!' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => {
          navigate(viewLink);
        }, 1500);
      } else {
        const errorMsg =
          (res.errors ? Object.values(res.errors).flat().join(' ') : null) ||
          res.message ||
          'Submission failed. Please check the fields.';
        setToast({ type: 'error', message: errorMsg });
        if (res.errors) {
          const serverErrors: Record<string, string> = {};
          for (const [key, msgs] of Object.entries(res.errors)) {
            if (Array.isArray(msgs) && msgs.length > 0) {
              serverErrors[key] = msgs[0];
            }
          }
          setErrors((prev) => ({ ...prev, ...serverErrors }));
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err: any) {
      setToast({ type: 'error', message: err?.message || 'Error occurred during submission.' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="up-single-card-form">
      <style>{SINGLE_CARD_FORM_CSS}</style>

      <PageHead
        title={title}
        subtitle={
          <span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>
            {subtitle}
          </span>
        }
        breadcrumbs={breadcrumbs}
        actions={
          <Link to={viewLink} className="ax-btn ax-btn--secondary ax-btn--pill">
            <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l14 0" /><path d="M5 12l6 6" /><path d="M5 12l6 -6" /></svg>
            <span className="ax-btn__label">{viewLabel}</span>
          </Link>
        }
      />

      {/* Success Banner */}
      {toast?.type === 'success' && (
        <div className="ax-alert ax-alert--success" role="status" style={{ marginBottom: 'var(--ax-space-6)' }}>
          <span className="ax-alert__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5l10 -10" /></svg>
          </span>
          <div className="ax-alert__content">
            <h3 className="ax-alert__title" style={{ fontSize: 'var(--ax-text-base)', fontWeight: 600 }}>{toast.message}</h3>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {toast?.type === 'error' && (
        <div className="ax-alert ax-alert--danger" role="alert" style={{ marginBottom: 'var(--ax-space-6)' }}>
          <span className="ax-alert__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4" /><path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0" /><path d="M12 16h.01" /></svg>
          </span>
          <div className="ax-alert__content">
            <h4 className="ax-alert__title" style={{ fontWeight: 600 }}>{toast.message}</h4>
          </div>
        </div>
      )}

      {/* Main Single Card Form */}
      <form onSubmit={handleSubmit} noValidate>
        <div className="ax-card">
          {/* Card Header with Eyebrow, Title and Section Pills */}
          <div className="ax-card__header">
            <div>
              <span className="ax-card__eyebrow">{projectEyebrow}</span>
              <h2 className="ax-card__title" style={{ margin: 0 }}>{title}</h2>
              <p className="ax-card__subtitle" style={{ margin: '4px 0 0' }}>
                All maintenance fields organized inside one main card across 6 dedicated sections.
              </p>
            </div>

            <div className="up-section-pills" role="navigation" aria-label="Jump to section">
              {SECTIONS.map((s) => (
                <button key={s.id} type="button" onClick={() => scrollToSection(s.id)} className="up-section-pill-btn">
                  <span className="pill-num">{s.num}</span>
                  <span>{s.title}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="ax-card__body">
            {/* ── Section 1: Site Selection ── */}
            <div id="sec-1" className="up-section-block">
              <SectionHeader
                num="1"
                total={6}
                title="Site Information"
                desc="Choose the assigned site ready for periodic maintenance report."
              />
              <div className="up-form-grid up-form-grid--3col">
                {years.length > 0 && (
                  <FloatingSelect
                    id="up-amc-year"
                    label="AMC Year"
                    value={selectedYear ? String(selectedYear) : ''}
                    options={years.map((y) => ({ value: String(y), label: String(y) }))}
                    disabled={loadingYears}
                    onChange={(v) => setSelectedYear(v ? Number(v) : '')}
                  />
                )}

                {months.length > 0 && (
                  <FloatingSelect
                    id="up-amc-site-month"
                    label="Filter Month"
                    placeholder="-- Select Month --"
                    value={selectedMonth}
                    options={months.map((m) => {
                      const val = String(m);
                      const found = MONTH_OPTIONS.find((mo) => mo.value === val);
                      return { value: val, label: found ? found.label : `Month ${val}` };
                    })}
                    onChange={(v) => setSelectedMonth(v)}
                  />
                )}

                <div className={years.length > 0 || months.length > 0 ? (years.length > 0 && months.length > 0 ? '' : 'up-form-col-span-2') : 'up-form-col-span-full'}>
                  <FloatingSelect
                    id="up-amc-site-name"
                    label="Select Site"
                    required
                    placeholder={loadingSites ? 'Loading sites...' : '-- Select Site --'}
                    value={selectedSiteId}
                    options={sites.map((s) => ({
                      value: String(s.id),
                      label: s.label || s.site_name || s.farmer_name || s.beneficiary_name || `Site #${s.id}`,
                    }))}
                    disabled={loadingSites}
                    onChange={(v) => {
                      setSelectedSiteId(v);
                      if (errors.site) clearError('site');
                    }}
                    error={errors.site}
                  />
                </div>
              </div>
            </div>

            <hr className="up-section-divider" />

            {/* ── Section 2: Information (Auto-populated from site) ── */}
            <div id="sec-2" className="up-section-block">
              <SectionHeader
                num="2"
                total={6}
                title="Information"
                desc="Auto-populated site parameters, specifications, and contact records (Read-only)."
              />
              <div className="up-form-grid up-form-grid--3col">
                <FloatingInput id="up-info-state" label="State" readOnly value={siteInfo.state || 'UP'} />
                <FloatingInput id="up-info-district" label="District" readOnly value={siteInfo.district || ''} />
                <FloatingInput id="up-info-village" label="Village" readOnly value={siteInfo.village || ''} />
                <FloatingInput id="up-info-beneficiary" label="Beneficiary Name" readOnly value={siteInfo.beneficiaryName || ''} />
                <FloatingInput id="up-info-contact" label="Contact" readOnly value={siteInfo.contact || ''} />
                <FloatingInput id="up-info-gender" label="Gender" readOnly value={siteInfo.gender || ''} />
                <FloatingInput id="up-info-phase" label="Phase" readOnly value={siteInfo.phase || ''} />
                <FloatingInput id="up-info-serial" label="Serial Number" readOnly value={siteInfo.serialNumber || ''} />
                <FloatingInput id="up-info-address" label="Address" readOnly value={siteInfo.address || ''} />
                <FloatingInput id="up-info-volume" label="Volume" readOnly value={siteInfo.volume || ''} />
                <FloatingInput id="up-info-contractor" label="Contractor Name" readOnly value={siteInfo.contractorName || ''} />
              </div>
            </div>

            <hr className="up-section-divider" />

            {/* ── Section 3: Contact & Maintenance Details ── */}
            <div id="sec-3" className="up-section-block">
              <SectionHeader
                num="3"
                total={6}
                title="Contact & Maintenance Details"
                desc={<>The field labels marked with <span style={{ color: 'var(--ax-danger-500)' }}>*</span> are input fields.</>}
              />
              <div className="up-form-grid up-form-grid--3col">
                <FloatingSelect
                  id="up-amc-type"
                  label="AMC Type"
                  required
                  value={amcType}
                  options={AMC_TYPE_OPTIONS}
                  onChange={(v) => {
                    setAmcType(v);
                    if (errors.amcType) clearError('amcType');
                  }}
                  error={errors.amcType}
                />
                <FloatingSelect
                  id="up-amc-month"
                  label="Month"
                  required
                  placeholder="-- Select Month --"
                  value={selectedMonth}
                  options={MONTH_OPTIONS}
                  onChange={(v) => {
                    setSelectedMonth(v);
                    if (errors.month) clearError('month');
                  }}
                  error={errors.month}
                />
                <FloatingInput
                  id="up-amc-date"
                  label="AMC Date"
                  type="date"
                  required
                  value={amcDate}
                  onChange={(v) => {
                    setAmcDate(v);
                    if (errors.amcDate || errors.amc_date) {
                      clearError('amcDate');
                      clearError('amc_date');
                    }
                  }}
                  error={errors.amcDate || errors.amc_date}
                />
                <FloatingInput
                  id="up-beneficiary-name-form"
                  label="Beneficiary Name"
                  required
                  placeholder="Enter Beneficiary Name"
                  value={beneficiaryName}
                  onChange={(v) => {
                    setBeneficiaryName(v);
                    if (errors.beneficiaryName) clearError('beneficiaryName');
                  }}
                  error={errors.beneficiaryName}
                />
                <FloatingInput
                  id="up-beneficiary-contact-form"
                  label="Beneficiary Contact"
                  type="tel"
                  required
                  placeholder="Enter Contact Number"
                  value={beneficiaryContact}
                  onChange={(v) => {
                    setBeneficiaryContact(v);
                    if (errors.beneficiaryContact) clearError('beneficiaryContact');
                  }}
                  error={errors.beneficiaryContact}
                />
              </div>
            </div>

            <hr className="up-section-divider" />

            {/* ── Section 4: GPS Coordinates & Remarks ── */}
            <div id="sec-4" className="up-section-block">
              <SectionHeader
                num="4"
                total={6}
                title="GPS Coordinates & Remarks"
                desc="Exact site geotag coordinates and maintenance observations."
              />
              <div className="up-form-grid up-form-grid--3col">
                <FloatingInput
                  id="up-amc-lat"
                  label="Latitude"
                  required
                  placeholder={gpsStatus === 'unable' && !latitude ? 'Unable to fetch' : 'Enter Latitude'}
                  value={latitude}
                  onChange={(v) => {
                    setLatitude(v);
                    if (errors.latitude) clearError('latitude');
                  }}
                  error={errors.latitude}
                />
                <FloatingInput
                  id="up-amc-lng"
                  label="Longitude"
                  required
                  placeholder={gpsStatus === 'unable' && !longitude ? 'Unable to fetch' : 'Enter Longitude'}
                  value={longitude}
                  onChange={(v) => {
                    setLongitude(v);
                    if (errors.longitude) clearError('longitude');
                  }}
                  error={errors.longitude}
                />
                <div>
                  <button
                    type="button"
                    className="ax-btn ax-btn--secondary up-gps-cell"
                    style={{ width: '100%' }}
                    onClick={() => handleDetectGps(false)}
                    disabled={gpsStatus === 'fetching'}
                  >
                    <span className="ax-btn__label">
                      {gpsStatus === 'fetching' ? 'Detecting GPS...' : '📍 Get GPS'}
                    </span>
                  </button>
                </div>
                <div className="up-form-col-span-full">
                  <FloatingTextarea
                    id="up-amc-remarks"
                    label="Remarks"
                    placeholder="Enter Remarks..."
                    value={remarks}
                    onChange={(v) => setRemarks(v)}
                  />
                </div>
              </div>
            </div>

            <hr className="up-section-divider" />

            {/* ── Section 5: Photo Evidence ── */}
            <div id="sec-5" className="up-section-block">
              <SectionHeader
                num="5"
                total={6}
                title="AMC Photo Evidence"
                desc="Upload clear photos and verification document of the site (up to 5MB each)."
              />
              <div className="up-form-grid up-form-grid--3col">
                <FloatingFileInput
                  id="up-doc-upload"
                  label="Document Upload"
                  required
                  accept=".pdf,.doc,.docx,image/*"
                  file={documentFile}
                  onChange={(f) => {
                    setDocumentFile(f);
                    if (errors.documentFile) clearError('documentFile');
                  }}
                  error={errors.documentFile}
                />
                <FloatingFileInput
                  id="up-amc-image1"
                  label="AMC Image 1 (Before Maintenance)"
                  required
                  accept="image/*"
                  file={image1}
                  onChange={(f) => {
                    setImage1(f);
                    if (errors.image1) clearError('image1');
                  }}
                  error={errors.image1}
                />
                <FloatingFileInput
                  id="up-amc-image2"
                  label="AMC Image 2 (After Maintenance)"
                  required
                  accept="image/*"
                  file={image2}
                  onChange={(f) => {
                    setImage2(f);
                    if (errors.image2) clearError('image2');
                  }}
                  error={errors.image2}
                />
                <FloatingFileInput
                  id="up-amc-image3"
                  label="AMC Image 3 (Site / System Photo)"
                  required
                  accept="image/*"
                  file={image3}
                  onChange={(f) => {
                    setImage3(f);
                    if (errors.image3) clearError('image3');
                  }}
                  error={errors.image3}
                />
              </div>
            </div>

            <hr className="up-section-divider" />

            {/* ── Section 6: Raised Complaint ── */}
            <div id="sec-6" className="up-section-block">
              <SectionHeader
                num="6"
                total={6}
                title="Raised Complaint (Optional)"
                desc="Log breakdown notice or site defect if observed during AMC visit."
              />
              <div className="up-form-grid up-form-grid--3col">
                <div className="up-form-col-span-2">
                  <FloatingTextarea
                    id="up-complaint-text"
                    label="Complaint Description"
                    required={Boolean(complaintImage)}
                    placeholder="Enter Complaint Description..."
                    rows={4}
                    value={complaintText}
                    onChange={(v) => {
                      setComplaintText(v);
                      if (errors.complaint) clearError('complaint');
                    }}
                    error={errors.complaint}
                  />
                </div>
                <div>
                  <FloatingFileInput
                    id="up-complaint-image"
                    label="Complaint Photo"
                    accept="image/*"
                    file={complaintImage}
                    onChange={(f) => setComplaintImage(f)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="up-form-sticky-bar">
          <span className="ax-badge ax-badge--soft ax-badge--primary ax-badge--pill">
            AMC Report Submission
          </span>
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)' }}>
            <button type="button" className="ax-btn ax-btn--secondary" onClick={handleReset} disabled={loading}>
              <span className="ax-btn__label">Reset</span>
            </button>
            <button type="submit" disabled={loading || !selectedSiteId} className="ax-btn ax-btn--primary" style={{ minWidth: 200 }}>
              {loading ? (
                <>
                  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ animation: 'up-spin 1s linear infinite' }}><path d="M12 3a9 9 0 1 0 9 9" /></svg>
                  <span className="ax-btn__label">Submitting...</span>
                </>
              ) : (
                <>
                  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5l10 -10" /></svg>
                  <span className="ax-btn__label">Submit AMC Report</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      <footer style={{ marginTop: 'var(--ax-space-8)', textAlign: 'center', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
        Copyright © <a href="https://klkerp.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--ax-primary)' }}>ETS NETWORKS</a>. All rights reserved.
      </footer>
    </div>
  );
}

export default UpAmcPendingForm;

/* =========================================================================
 * Reusable Floating Components (same as UP Resco Install Site)
 * ========================================================================= */

function SectionHeader({ num, total, title, desc }: { num: string; total: number; title: string; desc?: ReactNode }) {
  return (
    <div className="up-section-header">
      <div className="up-section-title-wrap">
        <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', alignItems: 'center' }}>
          <span className="ax-badge ax-badge--soft ax-badge--primary ax-badge--pill" style={{ fontWeight: 600 }}>
            Section {num} of {total}
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
  required?: boolean;
  readOnly?: boolean;
  maxLength?: number;
  placeholder?: string;
  value: string;
  onChange?: (val: string) => void;
  error?: string;
}

function FloatingInput({ id, label, type = 'text', required, readOnly, maxLength, placeholder = ' ', value, onChange, error }: FloatingInputProps) {
  const isDateOrTime = type === 'date' || type === 'time';
  return (
    <div>
      <div className={`ax-float ${isDateOrTime ? 'ax-float--date' : ''}`}>
        <input
          id={id}
          type={type}
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

function FloatingTextarea({ id, label, required, placeholder = 'Enter Remarks...', value, rows = 3, onChange, error }: FloatingTextareaProps) {
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

function FloatingFileInput({ id, label, required, accept, capture, file, existingUrl, onChange, error }: FloatingFileInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const chosen = e.dataTransfer.files?.[0];
    if (chosen) {
      if (chosen.size > MAX_FILE_SIZE) {
        alert('File size exceeds 5MB limit.');
        return;
      }
      onChange(chosen);
    }
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
          const f = e.target.files?.[0] || null;
          if (f && f.size > MAX_FILE_SIZE) {
            alert('File size exceeds 5MB limit.');
            return;
          }
          onChange(f);
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
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', marginTop: 2 }}>
                  {(file.size / 1024).toFixed(0)} KB · Ready to upload
                </div>
              </div>
            </div>
            <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" onClick={handleClear} style={{ color: '#ef4444', flexShrink: 0 }} title="Remove file">
              Remove
            </button>
          </div>
        ) : existingName ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, textAlign: 'left' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {existingName}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', marginTop: 2 }}>
                  Existing file · Click to replace
                </div>
              </div>
            </div>
            <span className="ax-btn ax-btn--secondary ax-btn--sm" style={{ flexShrink: 0, pointerEvents: 'none' }}>
              Replace
            </span>
          </div>
        ) : (
          <>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#eff6ff', color: '#3b82f6', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
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
              {accept?.includes('pdf') ? 'PDF, DOC or Image up to 5MB' : 'JPG, PNG or WEBP up to 5MB'}
            </div>
          </>
        )}
      </div>

      <FieldFeedback error={error} />
    </div>
  );
}
