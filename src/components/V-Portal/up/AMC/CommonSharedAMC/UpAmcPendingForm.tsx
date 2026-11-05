import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';

// ── Goa-style CSS: Single-Card Layout, Floating Labels, Section Badges, Sticky Footer ──
export const SINGLE_CARD_FORM_CSS = `
.up-single-card-form .ax-card { border: 1px solid var(--ax-border); border-radius: var(--ax-radius-xl); background: var(--ax-surface-solid); box-shadow: var(--ax-shadow-sm); overflow: hidden; }
.up-single-card-form .ax-card__header { padding: var(--ax-space-5) var(--ax-space-6); border-bottom: 1px solid var(--ax-border-subtle); background: var(--ax-surface-subtle); display: flex; flex-direction: column; gap: var(--ax-space-4); }
.up-single-card-form .ax-card__body { padding: var(--ax-space-6); }

.up-section-pills { display: flex; gap: var(--ax-space-2); overflow-x: auto; padding-bottom: 4px; scrollbar-width: thin; }
.up-section-pill-btn { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: var(--ax-radius-pill); font-size: var(--ax-text-xs); font-weight: 500; white-space: nowrap; background: var(--ax-surface-solid); border: 1px solid var(--ax-border); color: var(--ax-text); cursor: pointer; transition: all var(--ax-motion-fast, 0.15s) var(--ax-ease-standard, ease); text-decoration: none; }
.up-section-pill-btn:hover { border-color: var(--ax-accent); color: var(--ax-accent); background: color-mix(in srgb, var(--ax-accent) 6%, var(--ax-surface-solid)); }
.up-section-pill-btn .pill-num { width: 18px; height: 18px; border-radius: 50%; background: var(--ax-surface-subtle); display: inline-flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; }

.up-section-block { padding-top: var(--ax-space-2); scroll-margin-top: 80px; }
.up-section-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: var(--ax-space-2); margin-bottom: var(--ax-space-5); padding-bottom: var(--ax-space-3); border-bottom: 1px solid var(--ax-border-subtle); }
.up-section-title-wrap { display: flex; flex-direction: column; gap: 4px; }
.up-section-divider { border: 0; border-top: 1px dashed var(--ax-border); margin: var(--ax-space-8) 0 var(--ax-space-6); }

/* Floating label inputs */
.ax-float { position: relative; width: 100%; }
.ax-float__input { width: 100%; height: 46px; padding: 12px 14px 4px 14px; font-size: var(--ax-text-sm); background: var(--ax-surface-solid); border: 1px solid var(--ax-border); border-radius: var(--ax-radius-md); color: var(--ax-text); outline: none; transition: border-color var(--ax-motion-fast, 0.15s) var(--ax-ease-standard, ease), box-shadow var(--ax-motion-fast, 0.15s) var(--ax-ease-standard, ease); }
.ax-float__input::placeholder { color: transparent; }
.ax-float__input:focus { border-color: var(--ax-accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--ax-accent) 20%, transparent); }
.ax-float__input[readonly] { background: var(--ax-surface-subtle); cursor: default; }
.ax-float__input:disabled { opacity: .7; cursor: not-allowed; background: var(--ax-surface-subtle); }
.ax-float--readonly .ax-float__input { background: #f8fafc; cursor: default; color: #0f172a; font-weight: 500; }
.ax-float--readonly .ax-float__label { top: 0; transform: translateY(-50%); font-size: 11px; font-weight: 500; color: #64748b; }

.ax-float__label { position: absolute; inset-inline-start: 12px; top: 50%; transform: translateY(-50%); margin: 0; padding: 0 4px; font-size: var(--ax-text-sm); color: var(--ax-text-subtle); background: var(--ax-surface-solid); border-radius: var(--ax-radius-xs); pointer-events: none; transition: top var(--ax-motion-fast, 0.15s) var(--ax-ease-standard, ease), font-size var(--ax-motion-fast, 0.15s) var(--ax-ease-standard, ease), color var(--ax-motion-fast, 0.15s) var(--ax-ease-standard, ease); z-index: 2; white-space: nowrap; max-width: calc(100% - 24px); overflow: hidden; text-overflow: ellipsis; }

.ax-float__input:focus + .ax-float__label,
.ax-float__input:not(:placeholder-shown) + .ax-float__label,
.ax-float--select .ax-float__label,
.ax-float--file .ax-float__label { top: 0; transform: translateY(-50%); font-size: 11px; font-weight: 500; color: var(--ax-text-muted); }
.ax-float__input:focus + .ax-float__label { color: var(--ax-accent); }

.ax-float__input.is-invalid { border-color: var(--ax-danger-500, #ef4444) !important; }
.ax-float__input.is-invalid:focus { box-shadow: 0 0 0 3px color-mix(in srgb, var(--ax-danger-500, #ef4444) 24%, transparent) !important; }
.ax-float__input.is-invalid + .ax-float__label { color: var(--ax-danger-500, #ef4444) !important; }

.ax-float--area .ax-float__input { height: auto; min-height: 84px; padding-top: 18px; resize: vertical; }
.ax-float--area .ax-float__label { top: 18px; transform: none; }
.ax-float--area .ax-float__input:focus + .ax-float__label,
.ax-float--area .ax-float__input:not(:placeholder-shown) + .ax-float__label { top: 0; transform: translateY(-50%); }

.ax-field-feedback { display: flex; align-items: center; gap: 4px; margin-top: 4px; font-size: var(--ax-text-2xs, 11px); min-height: 16px; }
.ax-field-feedback--error { color: var(--ax-danger-500, #ef4444); }

/* Form grid */
.up-form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--ax-space-4); }
@media (min-width: 1024px) { .up-form-grid--3col { grid-template-columns: repeat(3, 1fr); } }
.up-form-grid--4col { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: var(--ax-space-4); }
@media (min-width: 1200px) { .up-form-grid--4col { grid-template-columns: repeat(4, 1fr); } }
.up-form-col-span-full { grid-column: 1 / -1; }
.up-form-col-span-2 { grid-column: span 2; }

/* Clean file upload controls */
.ax-file-box-wrap { display: flex; flex-direction: column; gap: 6px; }
.ax-file-box-label { font-size: 13px; font-weight: 500; color: var(--ax-text-strong); display: flex; align-items: center; gap: 4px; }
.ax-file-box-control {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 46px;
  padding: 6px 12px;
  background: var(--ax-surface-solid);
  border: 1px solid var(--ax-border);
  border-radius: var(--ax-radius-md);
  transition: all 0.15s ease;
}
.ax-file-box-control:hover { border-color: var(--ax-accent); }
.ax-file-box-control.is-invalid { border-color: var(--ax-danger-500, #ef4444) !important; background: #fef2f2; }
.ax-file-btn {
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 500;
  background: #f1f5f9;
  color: #334155;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s;
}
.ax-file-btn:hover { background: #e2e8f0; }
.ax-file-status-text {
  font-size: 13px;
  color: #64748b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}
.ax-file-status-text.has-file {
  color: #0f172a;
  font-weight: 500;
}
.ax-file-clear-btn {
  background: transparent;
  border: none;
  color: #ef4444;
  font-size: 18px;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
}
.ax-file-clear-btn:hover { background: #fee2e2; }
.ax-file-thumb {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  object-fit: cover;
  border: 1px solid #cbd5e1;
}

/* Sticky footer bar */
.up-form-sticky-bar { position: sticky; bottom: var(--ax-space-4); z-index: 30; margin-top: var(--ax-space-6); padding: var(--ax-space-3) var(--ax-space-5); background: var(--ax-surface-solid); border: 1px solid var(--ax-border); border-radius: var(--ax-radius-xl); box-shadow: var(--ax-shadow-lg); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--ax-space-3); backdrop-filter: blur(12px); }

@keyframes up-spin { to { transform: rotate(360deg); } }
`;

// ── 4 Main Sections Matching Requested ERP Structure ──
const SECTIONS = [
  { id: 'sec-site', num: '1', title: 'Site Selection' },
  { id: 'sec-info', num: '2', title: 'Information' },
  { id: 'sec-form', num: '3', title: 'Fill this Form' },
  { id: 'sec-complaint', num: '4', title: 'Raised Complaint' },
];

const MONTH_OPTIONS = [
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

const AMC_TYPE_OPTIONS = [
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
    mode,
    onFetchYears,
    onFetchMonths,
    onFetchSites,
    onFetchSiteDetails,
    onSubmit,
    defaultAmcType = 'Monthly',
  } = props;

  const navigate = useNavigate();

  // ── Section 1: Site Selection States ──
  const [years, setYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | ''>('');
  const [sites, setSites] = useState<{ id: number | string; label: string; [key: string]: any }[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');

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

  // ── Section 3: Fill this Form Inputs ──
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'fetching' | 'success' | 'unable'>('idle');
  const [amcType, setAmcType] = useState(defaultAmcType);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [beneficiaryContact, setBeneficiaryContact] = useState('');
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [image1, setImage1] = useState<File | null>(null);
  const [image2, setImage2] = useState<File | null>(null);
  const [image3, setImage3] = useState<File | null>(null);
  const [remarks, setRemarks] = useState('');

  // ── Section 4: Raised Complaint Inputs ──
  const [complaintText, setComplaintText] = useState('');
  const [complaintImage, setComplaintImage] = useState<File | null>(null);

  // States
  const [loading, setLoading] = useState(false);
  const [loadingYears, setLoadingYears] = useState(false);
  const [loadingSites, setLoadingSites] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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
    return () => { active = false; };
  }, [onFetchYears]);

  // Load Sites when Year changes
  useEffect(() => {
    if (!selectedYear) return;
    let active = true;
    setSites([]);
    setSelectedSiteId('');
    clearSiteInfo();

    setLoadingSites(true);
    onFetchSites(Number(selectedYear), selectedMonth || undefined)
      .then((sList) => {
        if (!active) return;
        setSites(sList);
        if (sList.length > 0) {
          setSelectedSiteId(String(sList[0].id));
        } else {
          setSelectedSiteId('');
        }
      })
      .catch(() => { if (active) setSites([]); })
      .finally(() => { if (active) setLoadingSites(false); });

    return () => { active = false; };
  }, [selectedYear, onFetchSites]);

  // Clear site info helper
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

  // Normalize site details into the exact 11 requested Information fields
  const normalizeSite = (det: any) => {
    if (!det) return null;
    const d = det.data || det.kusumb || det.ongrid || det.offgrid || det.powerpack || det.ssl_details || det.site_details || det;

    const bName = d.beneficiary_name || d.beneficiary || d.farmer_name || d.f_farmer_name || d.applicant_name || d.site_name || d.name || '';
    const bContact = d.contact || d.mobile || d.f_mobile || d.beneficiary_contact || d.f_contact || d.contact_number || d.contact_no || d.contractor_number || '';
    const st = d.state || 'UP';
    const dist = d.district || d.f_district || d.installation_dsitrict || '';
    const vill = d.village || d.f_village || d.installation_village || d.block || '';
    const gdr = d.gender || d.f_gender || d.farmer_gender || '';
    const ph = d.phase || d.f_phase || d.installation_phase || '';
    const srNo = d.serial_number || d.serial_no || d.f_sr_no || d.saral_id || d.application_no || d.ca_no || d.pole_no || d.light_no || d.system_id || d.wo_no || '';
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
    setLoadingDetails(true);
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
          if (norm.latitude && !latitude) setLatitude(String(norm.latitude));
          if (norm.longitude && !longitude) setLongitude(String(norm.longitude));
          if (norm.month && !selectedMonth) setSelectedMonth(String(norm.month));
        }
      })
      .catch((err) => { console.error('Error fetching site details:', err); })
      .finally(() => { if (active) setLoadingDetails(false); });

    return () => { active = false; };
  }, [selectedSiteId, selectedYear, selectedMonth, onFetchSiteDetails]);

  const handleReset = () => {
    setSelectedSiteId('');
    clearSiteInfo();
    setBeneficiaryName('');
    setBeneficiaryContact('');
    setLatitude('');
    setLongitude('');
    setAmcType(defaultAmcType);
    setSelectedMonth('');
    setDocumentFile(null);
    setImage1(null);
    setImage2(null);
    setImage3(null);
    setRemarks('');
    setComplaintText('');
    setComplaintImage(null);
    setErrors({});
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!selectedSiteId) errs.site = 'Please select a site';
    if (!latitude.trim()) errs.latitude = 'AMC Latitude is required';
    if (!longitude.trim()) errs.longitude = 'AMC Longitude is required';
    if (!amcType) errs.amcType = 'AMC Type is required';
    if (!selectedMonth) errs.month = 'Month is required';
    if (!beneficiaryName.trim()) errs.beneficiaryName = 'Beneficiary Name is required';
    if (!beneficiaryContact.trim()) {
      errs.beneficiaryContact = 'Beneficiary Contact is required';
    } else if (!/^\d{10,15}$/.test(beneficiaryContact.trim().replace(/[- ]/g, ''))) {
      errs.beneficiaryContact = 'Must be 10 to 15 digits';
    }
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
      setToast({ type: 'error', message: 'Please correct the highlighted errors before submitting.' });
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
        handleReset();
        setTimeout(() => { navigate(viewLink); }, 1500);
      } else {
        setToast({ type: 'error', message: res.message || 'Submission failed. Please check the fields.' });
      }
    } catch (err: any) {
      setToast({ type: 'error', message: err?.message || 'Error occurred during submission.' });
    } finally {
      setLoading(false);
    }
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="solar-erp-page up-single-card-form">
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

      <form onSubmit={handleSubmit} noValidate>
        <div className="ax-card">
          {/* Card Header with Section Pills */}
          <div className="ax-card__header">
            <div>
              <span className="ax-card__eyebrow">{projectEyebrow}</span>
              <h3 style={{ margin: 0, fontSize: 'var(--ax-text-base, 16px)', fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                Fill all sections below to submit your AMC report
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: 'var(--ax-text-xs, 12px)', color: 'var(--ax-text-muted)' }}>
                Complete the site details, inspection parameters, photos, and optional complaint.
              </p>
            </div>
            <div className="up-section-pills" role="navigation" aria-label="Jump to section">
              {SECTIONS.map((s) => (
                <button key={s.id} type="button" onClick={() => scrollTo(s.id)} className="up-section-pill-btn">
                  <span className="pill-num">{s.num}</span>
                  <span>{s.title}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="ax-card__body">
            {/* ── Section 1: Site Selection ── */}
            <div id="sec-site" className="up-section-block">
              <SectionHeader
                num="1"
                total={4}
                title="Site Selection"
                desc="Choose the assigned site for which AMC is being submitted"
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

                <div className={years.length > 0 ? 'up-form-col-span-2' : 'up-form-col-span-full'}>
                  <FloatingSelect
                    id="up-amc-site-name"
                    label="Site Name"
                    required
                    placeholder="Select Site"
                    value={selectedSiteId}
                    options={sites.map((s) => ({
                      value: String(s.id),
                      label: s.label || s.site_name || s.farmer_name || s.beneficiary_name || `Site #${s.id}`,
                    }))}
                    disabled={loadingSites}
                    onChange={(v) => setSelectedSiteId(v)}
                    error={errors.site}
                  />
                </div>
              </div>
            </div>

            <hr className="up-section-divider" />

            {/* ── Section 2: Information (Auto-populated from site) ── */}
            <div id="sec-info" className="up-section-block">
              <SectionHeader
                num="2"
                total={4}
                title="Information"
                desc="Auto-populated site parameters, specifications, and contact records (Read-only)"
              />
              <div className="up-form-grid up-form-grid--4col">
                <FloatingInput id="up-info-state" label="State" readOnly value={siteInfo.state || 'UP'} />
                <FloatingInput id="up-info-district" label="District" readOnly value={siteInfo.district || '—'} />
                <FloatingInput id="up-info-village" label="Village" readOnly value={siteInfo.village || '—'} />
                <FloatingInput id="up-info-beneficiary" label="Beneficiary Name" readOnly value={siteInfo.beneficiaryName || '—'} />
                <FloatingInput id="up-info-contact" label="Contact" readOnly value={siteInfo.contact || '—'} />
                <FloatingInput id="up-info-gender" label="Gender" readOnly value={siteInfo.gender || '—'} />
                <FloatingInput id="up-info-phase" label="Phase" readOnly value={siteInfo.phase || '—'} />
                <FloatingInput id="up-info-serial" label="Serial Number" readOnly value={siteInfo.serialNumber || '—'} />
                <FloatingInput id="up-info-address" label="Address" readOnly value={siteInfo.address || '—'} />
                <FloatingInput id="up-info-volume" label="Volume" readOnly value={siteInfo.volume || '—'} />
                <FloatingInput id="up-info-contractor" label="Contractor Name" readOnly value={siteInfo.contractorName || '—'} />
              </div>
            </div>

            <hr className="up-section-divider" />

            {/* ── Section 3: Fill this Form ── */}
            <div id="sec-form" className="up-section-block">
              <SectionHeader
                num="3"
                total={4}
                title="Fill this Form"
                desc="Enter inspection parameters, GPS coordinates, period, images, and maintenance remarks"
                action={
                  <button
                    type="button"
                    className="ax-btn ax-btn--secondary ax-btn--sm"
                    onClick={() => handleDetectGps(false)}
                    disabled={gpsStatus === 'fetching'}
                  >
                    <span className="ax-btn__label">
                      {gpsStatus === 'fetching' ? 'Detecting GPS…' : '📍 Detect Current GPS'}
                    </span>
                  </button>
                }
              />
              <div className="up-form-grid up-form-grid--3col">
                <FloatingInput
                  id="up-amc-latitude"
                  label="AMC Latitude"
                  required
                  placeholder={gpsStatus === 'unable' && !latitude ? 'Unable to fetch' : 'e.g. 26.846700'}
                  value={latitude}
                  onChange={(v) => setLatitude(v)}
                  error={errors.latitude}
                />
                <FloatingInput
                  id="up-amc-longitude"
                  label="AMC Longitude"
                  required
                  placeholder={gpsStatus === 'unable' && !longitude ? 'Unable to fetch' : 'e.g. 80.946200'}
                  value={longitude}
                  onChange={(v) => setLongitude(v)}
                  error={errors.longitude}
                />
                <FloatingSelect
                  id="up-amc-type"
                  label="AMC Type"
                  required
                  value={amcType}
                  options={AMC_TYPE_OPTIONS}
                  onChange={(v) => setAmcType(v)}
                  error={errors.amcType}
                />
                <FloatingSelect
                  id="up-amc-month"
                  label="Month"
                  required
                  placeholder="Select Month"
                  value={selectedMonth}
                  options={MONTH_OPTIONS}
                  onChange={(v) => setSelectedMonth(v)}
                  error={errors.month}
                />
                <FloatingInput
                  id="up-beneficiary-name-form"
                  label="Beneficiary Name"
                  required
                  placeholder="Enter Beneficiary Name"
                  value={beneficiaryName}
                  onChange={(v) => setBeneficiaryName(v)}
                  error={errors.beneficiaryName}
                />
                <FloatingInput
                  id="up-beneficiary-contact-form"
                  label="Beneficiary Contact"
                  required
                  placeholder="Enter Contact Number"
                  value={beneficiaryContact}
                  onChange={(v) => setBeneficiaryContact(v)}
                  error={errors.beneficiaryContact}
                />

                {/* Upload Fields */}
                <NativeStyleFileInput
                  id="up-doc-upload"
                  label="Document Upload"
                  required
                  accept=".pdf,.doc,.docx,image/*"
                  file={documentFile}
                  onChange={(f) => setDocumentFile(f)}
                  error={errors.documentFile}
                />
                <NativeStyleFileInput
                  id="up-amc-image1"
                  label="AMC Image 1"
                  required
                  accept="image/*"
                  file={image1}
                  onChange={(f) => setImage1(f)}
                  error={errors.image1}
                  showPreview
                />
                <NativeStyleFileInput
                  id="up-amc-image2"
                  label="AMC Image 2"
                  required
                  accept="image/*"
                  file={image2}
                  onChange={(f) => setImage2(f)}
                  error={errors.image2}
                  showPreview
                />
                <NativeStyleFileInput
                  id="up-amc-image3"
                  label="AMC Image 3"
                  required
                  accept="image/*"
                  file={image3}
                  onChange={(f) => setImage3(f)}
                  error={errors.image3}
                  showPreview
                />

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

            {/* ── Section 4: Raised Complaint ── */}
            <div id="sec-complaint" className="up-section-block">
              <SectionHeader
                num="4"
                total={4}
                title="Raised Complaint"
                desc="Log breakdown notice or site defect if observed during AMC visit"
              />
              <div className="up-form-grid up-form-grid--3col">
                <div className="up-form-col-span-2">
                  <FloatingTextarea
                    id="up-complaint-text"
                    label="Complaint"
                    required={Boolean(complaintImage)}
                    placeholder="Enter Complaint..."
                    value={complaintText}
                    onChange={(v) => setComplaintText(v)}
                    error={errors.complaint}
                  />
                </div>
                <div>
                  <NativeStyleFileInput
                    id="up-complaint-image"
                    label="Complaint Image"
                    accept="image/*"
                    file={complaintImage}
                    onChange={(f) => setComplaintImage(f)}
                    showPreview
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Sticky Action Footer ── */}
        <div className="up-form-sticky-bar">
          <span className="ax-badge ax-badge--soft ax-badge--primary ax-badge--pill">
            AMC Report Submission
          </span>
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)' }}>
            <button type="button" className="ax-btn ax-btn--secondary" onClick={handleReset} disabled={loading}>
              <span className="ax-btn__label">Reset Form</span>
            </button>
            <button type="submit" className="ax-btn ax-btn--primary" disabled={loading} style={{ minWidth: 200 }}>
              {loading ? (
                <>
                  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ animation: 'up-spin 1s linear infinite' }}><path d="M12 3a9 9 0 1 0 9 9" /></svg>
                  <span className="ax-btn__label">Submitting AMC…</span>
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
    </div>
  );
}

/* =========================================================================
 * Reusable Floating & Clean Form Controls
 * ========================================================================= */

const Asterisk = () => <span style={{ color: 'var(--ax-danger-500, #ef4444)', marginLeft: 3 }}>*</span>;

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

function SectionHeader({ num, total, title, desc, action }: { num: string; total: number; title: string; desc?: ReactNode; action?: ReactNode }) {
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
      {action}
    </div>
  );
}

interface FloatingInputProps {
  id: string;
  label: string;
  type?: string;
  required?: boolean;
  readOnly?: boolean;
  placeholder?: string;
  value: string;
  onChange?: (val: string) => void;
  error?: string;
}

function FloatingInput({ id, label, type = 'text', required, readOnly, placeholder = ' ', value, onChange, error }: FloatingInputProps) {
  const isDateOrTime = type === 'date' || type === 'time';
  return (
    <div>
      <div className={`ax-float${readOnly ? ' ax-float--readonly' : ''}${isDateOrTime ? ' ax-float--select' : ''}`}>
        <input
          id={id}
          type={type}
          className={`ax-input ax-float__input${error ? ' is-invalid' : ''}`}
          placeholder={placeholder}
          value={value}
          readOnly={readOnly}
          onChange={(e) => onChange?.(e.target.value)}
          step={type === 'number' ? 'any' : undefined}
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
  options: { value: string; label: string }[];
  onChange: (val: string) => void;
  error?: string;
}

function FloatingSelect({ id, label, required, disabled, placeholder = '-- Select --', value, options, onChange, error }: FloatingSelectProps) {
  return (
    <div>
      <div className="ax-float ax-float--select">
        <select
          id={id}
          className={`ax-select ax-float__input${error ? ' is-invalid' : ''}`}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(error)}
        >
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
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
          className={`ax-textarea ax-float__input${error ? ' is-invalid' : ''}`}
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

/* ── Clean file upload component: [ Choose File ] No file chosen ── */
interface NativeStyleFileInputProps {
  id: string;
  label: string;
  required?: boolean;
  accept?: string;
  file: File | null;
  onChange: (file: File | null) => void;
  error?: string;
  showPreview?: boolean;
}

function NativeStyleFileInput({ id, label, required, accept, file, onChange, error, showPreview }: NativeStyleFileInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);

  useEffect(() => {
    if (file && showPreview && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setThumbUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setThumbUrl(null);
  }, [file, showPreview]);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="ax-file-box-wrap">
      <label htmlFor={id} className="ax-file-box-label">
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

      <div className={`ax-file-box-control${error ? ' is-invalid' : ''}`}>
        <button
          type="button"
          className="ax-file-btn"
          onClick={() => inputRef.current?.click()}
        >
          Choose File
        </button>

        {thumbUrl && (
          <img src={thumbUrl} alt="Preview" className="ax-file-thumb" />
        )}

        <span className={`ax-file-status-text${file ? ' has-file' : ''}`}>
          {file ? `${file.name} (${(file.size / 1024).toFixed(0)} KB)` : 'No file chosen'}
        </span>

        {file && (
          <button
            type="button"
            className="ax-file-clear-btn"
            onClick={handleClear}
            title="Remove chosen file"
          >
            ×
          </button>
        )}
      </div>
      <FieldFeedback error={error} />
    </div>
  );
}

export default UpAmcPendingForm;
