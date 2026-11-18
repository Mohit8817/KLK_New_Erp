import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { upRescoAmcApi } from '../../up-services';
import { authService } from '../../../../../services/authService';

// Unified Single-Card Layout CSS with Floating Labels & Section Dividers
const RESCO_AMC_CSS = `
.resco-amc-form .ax-card {
  border: 1px solid var(--ax-border);
  border-radius: var(--ax-radius-xl);
  background: var(--ax-surface-solid);
  box-shadow: var(--ax-shadow-sm);
  overflow: hidden;
}
.resco-amc-form .ax-card__header {
  padding: var(--ax-space-5) var(--ax-space-6);
  border-bottom: 1px solid var(--ax-border-subtle);
  background: var(--ax-surface-subtle);
  display: flex;
  flex-direction: column;
  gap: var(--ax-space-4);
}
.resco-amc-form .ax-card__body {
  padding: var(--ax-space-6);
}

.resco-section-pills {
  display: flex;
  gap: var(--ax-space-2);
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: thin;
}
.resco-section-pill-btn {
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
  text-decoration: none;
}
.resco-section-pill-btn:hover {
  border-color: var(--ax-accent);
  color: var(--ax-accent);
  background: color-mix(in srgb, var(--ax-accent) 6%, var(--ax-surface-solid));
}
.resco-section-pill-btn .pill-num {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--ax-surface-subtle);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
}

.resco-section-block {
  padding-top: var(--ax-space-2);
  scroll-margin-top: 80px;
}
.resco-section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: var(--ax-space-2);
  margin-bottom: var(--ax-space-5);
  padding-bottom: var(--ax-space-3);
  border-bottom: 1px solid var(--ax-border-subtle);
}
.resco-section-title-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.resco-section-divider {
  border: 0;
  border-top: 1px dashed var(--ax-border);
  margin: var(--ax-space-8) 0 var(--ax-space-6);
}

.ax-float {
  position: relative;
  width: 100%;
}
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
  transition: border-color var(--ax-motion-fast) var(--ax-ease-standard), box-shadow var(--ax-motion-fast) var(--ax-ease-standard);
}
.ax-float__input::placeholder {
  color: transparent;
}
.ax-float__input:focus {
  border-color: var(--ax-accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--ax-accent) 20%, transparent);
}
.ax-float__input[readonly] {
  background: var(--ax-surface-subtle);
}
.ax-float__input:disabled {
  opacity: .7;
  cursor: not-allowed;
  background: var(--ax-surface-subtle);
}

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
  transition: top var(--ax-motion-fast) var(--ax-ease-standard), font-size var(--ax-motion-fast) var(--ax-ease-standard), color var(--ax-motion-fast) var(--ax-ease-standard);
  z-index: 2;
  white-space: nowrap;
  max-width: calc(100% - 24px);
  overflow: hidden;
  text-overflow: ellipsis;
}

.ax-float__input:focus + .ax-float__label,
.ax-float__input:not(:placeholder-shown) + .ax-float__label,
.ax-float--select .ax-float__label,
.ax-float--date .ax-float__label,
.ax-float--file .ax-float__label {
  top: 0;
  transform: translateY(-50%);
  font-size: var(--ax-text-2xs);
  font-weight: 500;
  color: var(--ax-text-muted);
}
.ax-float__input:focus + .ax-float__label {
  color: var(--ax-accent);
}

.ax-float__input.is-invalid {
  border-color: var(--ax-danger-500) !important;
}
.ax-float__input.is-invalid:focus {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--ax-danger-500) 24%, transparent) !important;
}
.ax-float__input.is-invalid + .ax-float__label {
  color: var(--ax-danger-500) !important;
}

.ax-float--area .ax-float__input {
  height: auto;
  min-height: 84px;
  padding-top: 18px;
  resize: vertical;
}
.ax-float--area .ax-float__label {
  top: 18px;
  transform: none;
}
.ax-float--area .ax-float__input:focus + .ax-float__label,
.ax-float--area .ax-float__input:not(:placeholder-shown) + .ax-float__label {
  top: 0;
  transform: translateY(-50%);
}

.ax-field-feedback {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  font-size: var(--ax-text-2xs);
  min-height: 16px;
}
.ax-field-feedback--error {
  color: var(--ax-danger-500);
}

.resco-form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--ax-space-4);
}
@media (min-width: 1024px) {
  .resco-form-grid--3col {
    grid-template-columns: repeat(3, 1fr);
  }
}
.resco-form-col-span-full {
  grid-column: 1 / -1;
}

.resco-info-box {
  background: var(--ax-surface-subtle);
  border: 1px solid var(--ax-border-subtle);
  border-radius: var(--ax-radius-lg);
  padding: var(--ax-space-4);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--ax-space-3);
  margin-bottom: var(--ax-space-4);
}
.resco-info-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.resco-info-label {
  font-size: 11px;
  font-weight: 500;
  color: var(--ax-text-muted);
}
.resco-info-val {
  font-size: var(--ax-text-sm);
  font-weight: 600;
  color: var(--ax-text-strong);
  word-break: break-word;
}

.resco-photo-box {
  border: 1px dashed var(--ax-border);
  border-radius: var(--ax-radius-md);
  padding: var(--ax-space-3);
  background: var(--ax-surface-solid);
  display: flex;
  flex-direction: column;
  gap: var(--ax-space-2);
}
.resco-photo-previews {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 6px;
}
.resco-thumb-wrap {
  position: relative;
  width: 72px;
  height: 72px;
  border-radius: var(--ax-radius-sm);
  overflow: hidden;
  border: 1px solid var(--ax-border);
}
.resco-thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.resco-thumb-del {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 11px;
}

.resco-form-sticky-bar {
  position: sticky;
  bottom: var(--ax-space-4);
  z-index: 30;
  margin-top: var(--ax-space-6);
  padding: var(--ax-space-3) var(--ax-space-5);
  background: var(--ax-surface-solid);
  border: 1px solid var(--ax-border);
  border-radius: var(--ax-radius-xl);
  box-shadow: var(--ax-shadow-lg);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--ax-space-3);
  backdrop-filter: blur(12px);
}
`;

const MONTH_NAMES: Record<string, string> = {
  '1': 'January', '2': 'February', '3': 'March', '4': 'April',
  '5': 'May', '6': 'June', '7': 'July', '8': 'August',
  '9': 'September', '10': 'October', '11': 'November', '12': 'December',
};

const parseMonthNumber = (val: string | number): number => {
  if (typeof val === 'number' && !isNaN(val)) return val;
  const s = String(val).trim().toLowerCase();
  const num = parseInt(s, 10);
  if (!isNaN(num) && num >= 1 && num <= 12) return num;
  const map: Record<string, number> = {
    january: 1, jan: 1,
    february: 2, feb: 2,
    march: 3, mar: 3,
    april: 4, apr: 4,
    may: 5,
    june: 6, jun: 6,
    july: 7, jul: 7,
    august: 8, aug: 8,
    september: 9, sep: 9, sept: 9,
    october: 10, oct: 10,
    november: 11, nov: 11,
    december: 12, dec: 12,
  };
  return map[s] || new Date().getMonth() + 1;
};

const cleanNum = (val: any): string => {
  if (!val || val === '—' || val === '-') return '';
  const match = String(val).replace(/,/g, '').match(/-?\d+(\.\d+)?/);
  return match ? match[0] : '';
};

const cleanStr = (val: any): string => {
  if (!val || val === '—' || val === '-') return '';
  return String(val).trim();
};

const SECTIONS = [
  { id: 'sec-site-info', num: '1', title: 'Site Selection & Info' },
  { id: 'sec-cleaning', num: '2', title: 'Cleaning Module' },
  { id: 'sec-inverter', num: '3', title: 'Inverter Section' },
  { id: 'sec-equipment', num: '4', title: 'Equipment Status' },
  { id: 'sec-reminder', num: '5', title: 'Reminder & Due Date' },
  { id: 'sec-ack', num: '6', title: 'Technician Acknowledgement' },
  { id: 'sec-complaint', num: '7', title: 'Raised Complaint' },
];

export function UP_AMC_Resco_PendingAMC() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const querySiteId = searchParams.get('id') || searchParams.get('site_id') || '';

  // ── Section 1: Dropdown & Selection States ──
  const [years, setYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());
  const [months, setMonths] = useState<{ id: string | number; label: string }[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [sites, setSites] = useState<any[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>(querySiteId);
  const [siteDetail, setSiteDetail] = useState<any | null>(null);

  // Basic Visit details
  const [visitDate, setVisitDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [visitTime, setVisitTime] = useState<string>(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'fetching' | 'success' | 'unable'>('idle');
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [beneficiaryContact, setBeneficiaryContact] = useState('');

  // ── Section 2: 1. Cleaning Module ──
  const [beforeCleaningPhotos, setBeforeCleaningPhotos] = useState<File[]>([]);
  const [afterCleaningPhotos, setAfterCleaningPhotos] = useState<File[]>([]);

  // ── Section 3: 2. Inverter Section ──
  const [jmrReport, setJmrReport] = useState<File | null>(null);
  const [meterReading, setMeterReading] = useState<string>('');
  const [inverterStatus, setInverterStatus] = useState<string>('Working');
  const [inverterRemarks, setInverterRemarks] = useState<string>('');

  // ── Section 4: 3. Equipment Status ──
  const [laStatus, setLaStatus] = useState<string>('OK');
  const [wiringStatus, setWiringStatus] = useState<string>('OK');
  const [earthingStatus, setEarthingStatus] = useState<string>('OK');
  const [acdbStatus, setAcdbStatus] = useState<string>('Working');
  const [dcdbStatus, setDcdbStatus] = useState<string>('Working');
  const [rmsStatus, setRmsStatus] = useState<string>('Working');

  // ── Section 5: 4. Reminder & Due Date ──
  const [nextDueDate, setNextDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });
  const [reminderNotes, setReminderNotes] = useState<string>('');

  // ── Section 6: 5. Technician/User Acknowledgement ──
  const [digitalSignature, setDigitalSignature] = useState<File | null>(null);
  const [acknowledgement, setAcknowledgement] = useState<boolean>(true);
  const [remarks, setRemarks] = useState<string>('');

  // ── Section 7: Raised Complaint ──
  const [raiseComplaint, setRaiseComplaint] = useState<boolean>(false);
  const [complaintImage1, setComplaintImage1] = useState<File | null>(null);
  const [complaintImage2, setComplaintImage2] = useState<File | null>(null);
  const [complaintText, setComplaintText] = useState<string>('');

  // Loading & Error States
  const [loadingYears, setLoadingYears] = useState(false);
  const [loadingMonths, setLoadingMonths] = useState(false);
  const [loadingSites, setLoadingSites] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const clearError = (field: string) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // ── Auto-Detect GPS ──
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
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    handleDetectGps(true);
  }, []);

  // ── 1. Fetch Years ──
  useEffect(() => {
    let active = true;
    (async () => {
      setLoadingYears(true);
      try {
        const res: any = await upRescoAmcApi.getCreateYears();
        const arr =
          res?.data?.amc_years ||
          res?.amc_years ||
          res?.data?.years ||
          res?.years ||
          (Array.isArray(res?.data) ? res.data : null) ||
          (Array.isArray(res) ? res : null);
        if (active && Array.isArray(arr) && arr.length > 0) {
          const numYears = arr.map(Number);
          setYears(numYears);
          const curY = new Date().getFullYear();
          if (numYears.includes(curY)) setSelectedYear(curY);
          else setSelectedYear(numYears[0]);
        }
      } catch (err) {
        console.error('Error fetching Resco AMC years:', err);
      } finally {
        if (active) setLoadingYears(false);
      }
    })();
    return () => { active = false; };
  }, []);

  // ── 2. Fetch Months when Year changes ──
  useEffect(() => {
    if (!selectedYear) return;
    let active = true;
    (async () => {
      setLoadingMonths(true);
      try {
        const res: any = await upRescoAmcApi.getMonth(selectedYear);
        let list: any[] = [];
        if (Array.isArray(res)) list = res;
        else if (Array.isArray(res?.months)) list = res.months;
        else if (Array.isArray(res?.month)) list = res.month;
        else if (Array.isArray(res?.data?.months)) list = res.data.months;
        else if (Array.isArray(res?.data?.month)) list = res.data.month;
        else if (Array.isArray(res?.amc_months)) list = res.amc_months;
        else if (Array.isArray(res?.data?.amc_months)) list = res.data.amc_months;
        else if (Array.isArray(res?.data)) list = res.data;

        if (list.length === 0) {
          // Fallback to all 12 months
          list = Object.keys(MONTH_NAMES);
        }

        const normalized = list.map((m: any) => {
          const val = typeof m === 'object' && m !== null ? (m.month ?? m.months ?? m.id ?? m.value ?? m) : m;
          const strVal = String(val);
          const label = MONTH_NAMES[strVal] || strVal;
          return { id: strVal, label };
        });

        if (active) {
          setMonths(normalized);
          const curM = String(new Date().getMonth() + 1);
          const match = normalized.find((m) => m.id === curM || m.label.toLowerCase() === MONTH_NAMES[curM]?.toLowerCase());
          setSelectedMonth(match ? String(match.id) : String(normalized[0]?.id || '11'));
        }
      } catch (err) {
        console.error('Error fetching Resco AMC months:', err);
        if (active) {
          const fallback = Object.entries(MONTH_NAMES).map(([id, label]) => ({ id, label }));
          setMonths(fallback);
          setSelectedMonth(String(new Date().getMonth() + 1));
        }
      } finally {
        if (active) setLoadingMonths(false);
      }
    })();
    return () => { active = false; };
  }, [selectedYear]);

  // ── 3. Fetch Sites when Year or Month changes ──
  useEffect(() => {
    if (!selectedYear) return;
    let active = true;
    (async () => {
      setLoadingSites(true);
      try {
        const m = selectedMonth || new Date().getMonth() + 1;
        const res: any = await upRescoAmcApi.getSiteName(selectedYear, m);
        let list: any[] = [];
        if (Array.isArray(res)) list = res;
        else if (Array.isArray(res?.srtsite)) list = res.srtsite;
        else if (Array.isArray(res?.data?.srtsite)) list = res.data.srtsite;
        else if (Array.isArray(res?.srt_site)) list = res.srt_site;
        else if (Array.isArray(res?.data?.srt_site)) list = res.data.srt_site;
        else if (Array.isArray(res?.sites)) list = res.sites;
        else if (Array.isArray(res?.data?.sites)) list = res.data.sites;
        else if (Array.isArray(res?.site_name)) list = res.site_name;
        else if (Array.isArray(res?.data?.site_name)) list = res.data.site_name;
        else if (Array.isArray(res?.data)) list = res.data;

        const mapped = list.map((s: any, idx: number) => {
          if (typeof s === 'string' || typeof s === 'number') {
            return { id: String(s), label: String(s), site_name: String(s) };
          }
          const id = String(s.id ?? s.site_id ?? s.site_name ?? idx + 1);
          const name = s.site_name ?? s.name ?? s.beneficiary_name ?? `Site #${id}`;
          return { id, label: `${name} (ID: ${id})`, site_name: name, ...s };
        });

        if (active) {
          setSites(mapped);
          if (querySiteId && mapped.some((s) => s.id === querySiteId)) {
            setSelectedSiteId(querySiteId);
          }
        }
      } catch (err) {
        console.error('Error fetching Resco AMC sites:', err);
      } finally {
        if (active) setLoadingSites(false);
      }
    })();
    return () => { active = false; };
  }, [selectedYear, selectedMonth, querySiteId]);

  // ── 4. Fetch Site Details when Site is selected ──
  useEffect(() => {
    if (!selectedSiteId) {
      setSiteDetail(null);
      return;
    }
    let active = true;
    (async () => {
      setLoadingDetail(true);
      try {
        const res: any = await upRescoAmcApi.getSiteDetails(selectedSiteId);
        const r =
          res?.data?.srtsite ||
          res?.srtsite ||
          res?.data?.srt_site ||
          res?.srt_site ||
          res?.data?.site_details ||
          res?.data?.site ||
          res?.site_details ||
          res?.site ||
          res?.data ||
          res;
        const d = Array.isArray(r) ? r[0] : r;
        if (active && d) {
          const info = {
            ...d,
            id: d.id ?? selectedSiteId,
            state: d.state || 'UP',
            district: d.district || d.f_district || '—',
            dept_name: d.dept_name || d.department || d.department_name || '—',
            site_name: d.site_name || d.name || '—',
            location: d.location || d.address || d.village || '—',
            ca_no: d.ca_no || d.consumer_no || d.f_sr_no || d.application_no || d.serial_number || '—',
            sanction_load: d.sanction_load || d.volume || d.capacity || '—',
            plant_sc: d.plant_sc || d.plan_sc || d.plant_capacity || '—',
            beneficiary_name: d.beneficiary_name || d.contact_person || d.name || '',
            beneficiary_contact: d.beneficiary_contact || d.contact || d.mobile || d.contact_person_number || '',
            amc_type: d.amc_type || 'Monthly',
          };
          setSiteDetail(info);
          if (info.beneficiary_name && !beneficiaryName) {
            setBeneficiaryName(info.beneficiary_name);
          }
          if (info.beneficiary_contact && !beneficiaryContact) {
            setBeneficiaryContact(info.beneficiary_contact);
          }
        }
      } catch (err) {
        console.error('Error fetching Resco AMC site details:', err);
      } finally {
        if (active) setLoadingDetail(false);
      }
    })();
    return () => { active = false; };
  }, [selectedSiteId]);

  // When visitDate changes, keep nextDueDate at +30 days if user hasn't explicitly set another
  const handleVisitDateChange = (val: string) => {
    setVisitDate(val);
    clearError('visitDate');
    try {
      const dt = new Date(val);
      if (!isNaN(dt.getTime())) {
        dt.setDate(dt.getDate() + 30);
        setNextDueDate(dt.toISOString().slice(0, 10));
        clearError('next_due_date');
      }
    } catch {}
  };

  // ── Form Validation ──
  const validateForm = () => {
    const errs: Record<string, string> = {};

    if (!selectedSiteId) errs.site = 'Site selection is required.';
    if (!selectedYear) errs.year = 'AMC Year is required.';
    if (!selectedMonth) errs.month = 'AMC Month is required.';
    if (!visitDate) errs.visitDate = 'Visit Date is required.';
    if (!visitTime) errs.visitTime = 'Visit Time is required.';
    if (!latitude.trim()) errs.latitude = 'GPS Latitude is required.';
    if (!longitude.trim()) errs.longitude = 'GPS Longitude is required.';
    if (!beneficiaryName.trim()) errs.beneficiaryName = 'Beneficiary Name is required.';
    if (!beneficiaryContact.trim()) {
      errs.beneficiaryContact = 'Beneficiary Contact is required.';
    } else if (!/^\d{10}$/.test(beneficiaryContact.replace(/\D/g, ''))) {
      errs.beneficiaryContact = 'Contact must be a valid 10-digit number.';
    }

    // Cleaning photos
    if (beforeCleaningPhotos.length === 0) {
      errs.beforeCleaningPhotos = 'At least 1 Before Cleaning photo is required (max 5).';
    } else if (beforeCleaningPhotos.length > 5) {
      errs.beforeCleaningPhotos = 'Maximum 5 Before Cleaning photos are allowed.';
    }
    if (afterCleaningPhotos.length === 0) {
      errs.afterCleaningPhotos = 'At least 1 After Cleaning photo is required (max 5).';
    } else if (afterCleaningPhotos.length > 5) {
      errs.afterCleaningPhotos = 'Maximum 5 After Cleaning photos are allowed.';
    }

    // Inverter Section
    if (!jmrReport) errs.jmrReport = 'JMR Report Upload is required.';
    if (!meterReading.trim()) {
      errs.meter_reading = 'The meter reading field is required.';
    }
    if (!inverterStatus) errs.inverterStatus = 'Inverter Status is required.';
    if (!inverterRemarks.trim()) errs.inverterRemarks = 'Inverter Remarks is required.';

    // Equipment Status
    if (!laStatus) errs.laStatus = 'LA Status is required.';
    if (!wiringStatus) errs.wiringStatus = 'Wiring Status is required.';
    if (!earthingStatus) errs.earthingStatus = 'Earthing Status is required.';
    if (!acdbStatus) errs.acdbStatus = 'ACDB Status is required.';
    if (!dcdbStatus) errs.dcdbStatus = 'DCDB Status is required.';

    // Reminder & Due Date
    if (!nextDueDate.trim()) {
      errs.next_due_date = 'The next due date field is required.';
    }

    // Technician Acknowledgement
    if (!digitalSignature) errs.digitalSignature = 'Digital Signature Upload is required.';
    if (!acknowledgement) errs.acknowledgement = 'You must confirm that all maintenance activity has been completed.';

    // Complaint if checked
    if (raiseComplaint) {
      if (!complaintText.trim()) errs.complaint = 'Complaint description is required.';
      if (!complaintImage1) errs.complaintImage1 = 'Complaint Image 1 is required.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Form Submission ──
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setToast(null);

    if (!validateForm()) {
      setToast({ type: 'error', message: 'Please fill in all mandatory fields before submitting.' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => {
        document.querySelector('.is-invalid')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();

      // Resolve numeric month & month label safely
      const numMonth = parseMonthNumber(selectedMonth);
      const strMonth = String(numMonth);
      const paddedMonth = strMonth.padStart(2, '0');
      const monthName = MONTH_NAMES[strMonth] || String(selectedMonth);
      const monthYear = `${paddedMonth}-${selectedYear}`;

      // IDs & Primary site keys
      const selectedSiteObj = sites.find((s) => String(s.id) === String(selectedSiteId));
      const primarySiteId = cleanStr(siteDetail?.site_id || siteDetail?.resco_id || selectedSiteObj?.site_id || selectedSiteObj?.resco_id || siteDetail?.id) || selectedSiteId;
      const trueRescoId = cleanStr(siteDetail?.resco_id || siteDetail?.site_id || selectedSiteObj?.resco_id || selectedSiteObj?.site_id || siteDetail?.id) || selectedSiteId;
      const assignId = cleanStr(siteDetail?.assign_id || siteDetail?.assignment_id || selectedSiteObj?.assign_id || selectedSiteObj?.assignment_id);

      fd.append('id', String(selectedSiteId));
      fd.append('site_id', primarySiteId);
      fd.append('resco_id', trueRescoId);
      if (assignId) {
        fd.append('assign_id', assignId);
        fd.append('assignment_id', assignId);
      }

      // AMC Period & Date
      fd.append('amc_years', String(selectedYear));
      fd.append('year', String(selectedYear));
      fd.append('report_year', String(selectedYear));

      fd.append('months', strMonth);
      fd.append('month', strMonth);
      fd.append('amc_months', strMonth);
      fd.append('report_month', strMonth);
      fd.append('month_name', monthName);
      fd.append('month_year', monthYear);

      // Visit details
      fd.append('amc_date', visitDate);
      fd.append('visit_date', visitDate);
      fd.append('date', visitDate);
      fd.append('report_date', visitDate);
      fd.append('visit_time', visitTime);

      // Beneficiary & Contact
      const cleanBName = beneficiaryName.trim();
      const cleanBContact = beneficiaryContact.trim();
      fd.append('beneficiary_name', cleanBName);
      fd.append('farmer_name', cleanBName);
      fd.append('f_farmer_name', cleanBName);
      fd.append('name', cleanBName);
      fd.append('contact_person', cleanBName);

      fd.append('beneficiary_contact', cleanBContact);
      fd.append('contact', cleanBContact);
      fd.append('mobile', cleanBContact);
      fd.append('f_mobile', cleanBContact);
      fd.append('amc_beneficiary_contact', cleanBContact);
      fd.append('contact_number', cleanBContact);
      fd.append('contact_no', cleanBContact);

      // GPS
      if (latitude) {
        fd.append('latitude', latitude);
        fd.append('amc_latitude', latitude);
        fd.append('inst_latitude', latitude);
      }
      if (longitude) {
        fd.append('longitude', longitude);
        fd.append('amc_longitude', longitude);
        fd.append('inst_longitude', longitude);
      }

      // Vendor & Session Information
      const session = authService.getSession?.();
      const raw = authService.getRawResponse?.();
      const resolvedVendorName =
        session?.name ||
        session?.vendor_name ||
        (raw as any)?.vendor?.name ||
        (raw as any)?.user?.name ||
        cleanStr(siteDetail?.vendor_name) ||
        cleanStr(siteDetail?.vendor) ||
        cleanStr(siteDetail?.contractor_name) ||
        '';

      const resolvedVendorId =
        session?.vendor_id ||
        session?.id ||
        cleanStr(siteDetail?.vendor_id) ||
        '';

      if (resolvedVendorName) {
        fd.append('vendor', resolvedVendorName);
        fd.append('vendor_name', resolvedVendorName);
      }
      if (resolvedVendorId) {
        fd.append('vendor_id', String(resolvedVendorId));
      }
      if (session?.company_id) {
        fd.append('company_id', String(session.company_id));
      }

      // Site Meta (Cleaned - NO '—' values)
      const st = cleanStr(siteDetail?.state) || 'UP';
      fd.append('state', st);

      const dist = cleanStr(siteDetail?.district || siteDetail?.f_district);
      if (dist) fd.append('district', dist);

      const dept = cleanStr(siteDetail?.dept_name || siteDetail?.department || siteDetail?.department_name);
      if (dept) {
        fd.append('dept_name', dept);
        fd.append('department', dept);
        fd.append('department_name', dept);
      }

      const sName = cleanStr(siteDetail?.site_name || siteDetail?.name);
      if (sName) {
        fd.append('site_name', sName);
      }

      const loc = cleanStr(siteDetail?.location || siteDetail?.address || siteDetail?.village);
      if (loc) {
        fd.append('location', loc);
        fd.append('address', loc);
      }

      const ca = cleanStr(siteDetail?.ca_no || siteDetail?.consumer_no || siteDetail?.f_sr_no || siteDetail?.application_no || siteDetail?.serial_number);
      if (ca) {
        fd.append('ca_no', ca);
        fd.append('consumer_no', ca);
        fd.append('serial_number', ca);
      }

      const vill = cleanStr(siteDetail?.village || siteDetail?.f_village);
      if (vill) fd.append('village', vill);

      const gen = cleanStr(siteDetail?.gender || siteDetail?.f_gender);
      if (gen) fd.append('gender', gen);

      const ph = cleanStr(siteDetail?.phase || siteDetail?.f_phase);
      if (ph) fd.append('phase', ph);

      const contName = cleanStr(siteDetail?.contractor_name || siteDetail?.vendor_name);
      if (contName) fd.append('contractor_name', contName);

      const vol = cleanStr(siteDetail?.volume);
      if (vol) fd.append('volume', vol);

      const wo = cleanStr(siteDetail?.wo_no || siteDetail?.work_order);
      if (wo) {
        fd.append('wo_no', wo);
        fd.append('work_order', wo);
      }

      // Numeric load & capacity (Cleaned numbers only)
      const sLoad = cleanNum(siteDetail?.sanction_load || siteDetail?.volume || siteDetail?.capacity);
      if (sLoad) fd.append('sanction_load', sLoad);

      const pSc = cleanNum(siteDetail?.plant_sc || siteDetail?.plan_sc || siteDetail?.plant_capacity);
      if (pSc) fd.append('plant_sc', pSc);

      // AMC Type & Frequency codes
      const rawAmc = cleanStr(siteDetail?.amc_type) || 'Monthly';
      let aCode = 'M';
      let aId = '1';
      if (rawAmc === 'Quarterly' || rawAmc === '3' || rawAmc === 'Q') {
        aCode = 'Q';
        aId = '3';
      } else if (rawAmc === 'Half-Yearly' || rawAmc === '6' || rawAmc === 'H') {
        aCode = 'H';
        aId = '6';
      } else if (rawAmc === 'Yearly' || rawAmc === '12' || rawAmc === 'Y') {
        aCode = 'Y';
        aId = '12';
      }
      fd.append('amc_type', rawAmc);
      fd.append('amc_type_code', aCode);
      fd.append('amc_type_id', aId);

      // 1. Cleaning Module Photos
      // Backend Laravel validator rule: 'before_cleaning_photo' => 'required|array|max:5', 'after_cleaning_photo' => 'required|array|max:5'
      // Critical: Must ONLY be appended with array brackets 'before_cleaning_photo[]' and 'after_cleaning_photo[]'.
      // NEVER append scalar 'before_cleaning_photo' as PHP overwrites the array with a single UploadedFile!
      const finalBeforePhotos = beforeCleaningPhotos.slice(0, 5);
      finalBeforePhotos.forEach((file) => {
        fd.append('before_cleaning_photo[]', file);
      });
      if (finalBeforePhotos[0]) {
        fd.append('image1', finalBeforePhotos[0]);
        fd.append('amc_image1', finalBeforePhotos[0]);
      }

      const finalAfterPhotos = afterCleaningPhotos.slice(0, 5);
      finalAfterPhotos.forEach((file) => {
        fd.append('after_cleaning_photo[]', file);
      });
      if (finalAfterPhotos[0]) {
        fd.append('image2', finalAfterPhotos[0]);
        fd.append('amc_image2', finalAfterPhotos[0]);
      }
      if (finalAfterPhotos[1]) {
        fd.append('image3', finalAfterPhotos[1]);
        fd.append('amc_image3', finalAfterPhotos[1]);
      }

      // 2. Inverter Section (CRITICAL FIX FOR METER READING)
      if (jmrReport) {
        fd.append('jmr_report', jmrReport);
        fd.append('document', jmrReport);
        fd.append('document_file', jmrReport);
        fd.append('file', jmrReport);
        fd.append('upload_file', jmrReport);
      }
      const cleanMeter = cleanNum(meterReading) || String(meterReading).trim();
      fd.append('meter_reading', cleanMeter);
      fd.append('reading', cleanMeter);
      fd.append('inverter_status', inverterStatus);
      if (inverterRemarks.trim()) {
        fd.append('inverter_remarks', inverterRemarks.trim());
        fd.append('inverter_remark', inverterRemarks.trim());
      }

      // 3. Equipment Status
      fd.append('la_status', laStatus);
      fd.append('lightning_arrester_status', laStatus);
      fd.append('wiring_status', wiringStatus);
      fd.append('earthing_status', earthingStatus);
      fd.append('acdb_status', acdbStatus);
      fd.append('dcdb_status', dcdbStatus);
      if (rmsStatus) {
        fd.append('rms_status', rmsStatus);
      }

      // 4. Reminder & Due Date (CRITICAL FIX FOR NEXT DUE DATE)
      fd.append('next_due_date', nextDueDate);
      fd.append('due_date', nextDueDate);
      if (reminderNotes.trim()) {
        fd.append('reminder_notes', reminderNotes.trim());
        fd.append('reminder_note', reminderNotes.trim());
      }

      // 5. Technician/User Acknowledgement
      if (digitalSignature) {
        fd.append('digital_signature', digitalSignature);
        fd.append('signature', digitalSignature);
        fd.append('sign_image', digitalSignature);
        fd.append('signature_image', digitalSignature);
      }
      fd.append('acknowledgement_confirmation', acknowledgement ? '1' : '0');
      fd.append('acknowledgement', acknowledgement ? '1' : '0');
      fd.append('confirmation', acknowledgement ? '1' : '0');
      if (remarks.trim()) {
        fd.append('remarks', remarks.trim());
        fd.append('remark', remarks.trim());
        fd.append('amc_remark', remarks.trim());
      }

      // 6. Raised Complaint
      if (raiseComplaint && complaintText.trim()) {
        fd.append('raised_complaint', '1');
        fd.append('complaint', complaintText.trim());
        if (complaintImage1) {
          fd.append('complaint_image', complaintImage1);
          fd.append('complaint_image1', complaintImage1);
          fd.append('complaint_file', complaintImage1);
          fd.append('file1', complaintImage1);
        }
        if (complaintImage2) {
          fd.append('complaint_image2', complaintImage2);
          fd.append('file2', complaintImage2);
        }
      } else {
        fd.append('raised_complaint', '0');
        fd.append('complaint', '');
      }

      const res: any = await upRescoAmcApi.storeSite(fd);

      if (res?.status || res?.success) {
        setToast({ type: 'success', message: res?.message || 'UP RESCO AMC report submitted successfully!' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => {
          navigate('/v/up-resco-amc-view-site');
        }, 1500);
      } else {
        const errorText =
          (res?.errors ? Object.values(res.errors).flat().join(' ') : null) ||
          res?.message ||
          'Submission failed. Please check the highlighted errors.';
        setToast({ type: 'error', message: errorText });

        if (res?.errors) {
          const serverErrors: Record<string, string> = {};
          for (const [k, msgs] of Object.entries(res.errors)) {
            if (Array.isArray(msgs) && msgs.length > 0) {
              const msg = msgs[0];
              serverErrors[k] = msg;
              if (k === 'before_cleaning_photo' || k.startsWith('before_cleaning_photo.')) {
                serverErrors.beforeCleaningPhotos = msg;
              }
              if (k === 'after_cleaning_photo' || k.startsWith('after_cleaning_photo.')) {
                serverErrors.afterCleaningPhotos = msg;
              }
              if (k === 'meter_reading' || k === 'reading') {
                serverErrors.meter_reading = msg;
              }
              if (k === 'next_due_date' || k === 'due_date') {
                serverErrors.next_due_date = msg;
              }
              if (k === 'jmr_report' || k === 'document') {
                serverErrors.jmrReport = msg;
              }
              if (k === 'digital_signature' || k === 'signature') {
                serverErrors.digitalSignature = msg;
              }
            }
          }
          setErrors((prev) => ({ ...prev, ...serverErrors }));
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err: any) {
      console.error('Submission error:', err);
      setToast({ type: 'error', message: err?.message || 'Server error occurred during submission. Please try again.' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSelectedSiteId('');
    setSiteDetail(null);
    setBeneficiaryName('');
    setBeneficiaryContact('');
    setBeforeCleaningPhotos([]);
    setAfterCleaningPhotos([]);
    setJmrReport(null);
    setMeterReading('');
    setInverterStatus('Working');
    setInverterRemarks('');
    setLaStatus('OK');
    setWiringStatus('OK');
    setEarthingStatus('OK');
    setAcdbStatus('Working');
    setDcdbStatus('Working');
    setRmsStatus('Working');
    setReminderNotes('');
    setDigitalSignature(null);
    setRemarks('');
    setRaiseComplaint(false);
    setComplaintImage1(null);
    setComplaintImage2(null);
    setComplaintText('');
    setErrors({});
    setToast(null);
  };

  return (
    <div className="ax-page resco-amc-form">
      <style>{RESCO_AMC_CSS}</style>

      <PageHead
        title="UP RESCO — Submit Pending AMC Report"
        subtitle={
          <span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>
            Complete scheduled periodic maintenance for assigned RESCO rooftop solar sites
          </span>
        }
        breadcrumbs={[
          { label: 'Home', href: '/v' },
          { label: 'UP AMC' },
          { label: 'Resco', href: '/v/up-resco-amc-view-site' },
          { label: 'Pending AMC' },
        ]}
        actions={
          <Link to="/v/up-resco-amc-view-site" className="ax-btn ax-btn--secondary ax-btn--pill">
            <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12l14 0" />
              <path d="M5 12l6 6" />
              <path d="M5 12l6 -6" />
            </svg>
            <span className="ax-btn__label">View Completed AMC</span>
          </Link>
        }
      />

      {/* Toast Alert */}
      {toast && (
        <div
          className={`ax-alert ax-alert--${toast.type === 'success' ? 'success' : 'danger'}`}
          role="status"
          style={{ marginBottom: 'var(--ax-space-6)', animation: 'fadeIn .25s ease' }}
        >
          <span className="ax-alert__icon">
            {toast.type === 'success' ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5l10 -10" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4" /><path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0" /><path d="M12 16h.01" /></svg>
            )}
          </span>
          <div className="ax-alert__content">
            <h3 className="ax-alert__title" style={{ fontSize: 'var(--ax-text-base)', fontWeight: 600 }}>
              {toast.type === 'success' ? 'Report Submitted' : 'Validation Error'}
            </h3>
            <p className="ax-alert__message">{toast.message}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="ax-card">
          {/* Header with Quick Jump Pills */}
          <div className="ax-card__header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <h2 style={{ fontSize: 'var(--ax-text-lg)', fontWeight: 700, margin: 0, color: 'var(--ax-text-strong)' }}>
                  UP Resco AMC Site Information
                </h2>
                <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
                  All 7 maintenance sections organized inside one card
                </span>
              </div>
              <span className="ax-badge ax-badge--info">Uttar Pradesh RESCO</span>
            </div>

            <div className="resco-section-pills" role="navigation" aria-label="Sections">
              {SECTIONS.map((sec) => (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => scrollToSection(sec.id)}
                  className="resco-section-pill-btn"
                >
                  <span className="pill-num">{sec.num}</span>
                  <span>{sec.title}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="ax-card__body">
            {/* ── Section 1: Site Selection & Information ── */}
            <div id="sec-site-info" className="resco-section-block">
              <div className="resco-section-header">
                <div className="resco-section-title-wrap">
                  <span style={{ fontSize: 'var(--ax-text-xs)', fontWeight: 600, color: 'var(--ax-accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Section 1 of {SECTIONS.length}
                  </span>
                  <h3 style={{ fontSize: 'var(--ax-text-base)', fontWeight: 600, margin: 0, color: 'var(--ax-text-strong)' }}>
                    Site Selection & Information
                  </h3>
                </div>
              </div>

              {/* Year, Month, Site Selectors */}
              <div className="resco-form-grid resco-form-grid--3col" style={{ marginBottom: 'var(--ax-space-4)' }}>
                {/* AMC Year */}
                <div>
                  <div className="ax-float ax-float--select">
                    <select
                      id="amc-year"
                      className={`ax-float__input ${errors.year ? 'is-invalid' : ''}`}
                      value={selectedYear}
                      onChange={(e) => {
                        setSelectedYear(Number(e.target.value));
                        setSelectedMonth('');
                        setSelectedSiteId('');
                        clearError('year');
                      }}
                      disabled={loadingYears}
                    >
                      <option value="">Select Year</option>
                      {years.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                    <label htmlFor="amc-year" className="ax-float__label">AMC Year *</label>
                  </div>
                  {errors.year && <div className="ax-field-feedback ax-field-feedback--error">{errors.year}</div>}
                </div>

                {/* AMC Month */}
                <div>
                  <div className="ax-float ax-float--select">
                    <select
                      id="amc-month"
                      className={`ax-float__input ${errors.month ? 'is-invalid' : ''}`}
                      value={selectedMonth}
                      onChange={(e) => {
                        setSelectedMonth(e.target.value);
                        setSelectedSiteId('');
                        clearError('month');
                      }}
                      disabled={loadingMonths || !selectedYear}
                    >
                      <option value="">{!selectedYear ? 'Select Year First' : 'Select Month'}</option>
                      {months.map((m) => (
                        <option key={m.id} value={m.id}>{m.label}</option>
                      ))}
                    </select>
                    <label htmlFor="amc-month" className="ax-float__label">AMC Month *</label>
                  </div>
                  {errors.month && <div className="ax-field-feedback ax-field-feedback--error">{errors.month}</div>}
                </div>

                {/* Site Name */}
                <div>
                  <div className="ax-float ax-float--select">
                    <select
                      id="site-select"
                      className={`ax-float__input ${errors.site ? 'is-invalid' : ''}`}
                      value={selectedSiteId}
                      onChange={(e) => {
                        setSelectedSiteId(e.target.value);
                        clearError('site');
                      }}
                      disabled={loadingSites || !selectedYear || !selectedMonth}
                    >
                      <option value="">
                        {!selectedYear
                          ? 'Select Year First'
                          : !selectedMonth
                          ? 'Select Month First'
                          : loadingSites
                          ? 'Loading sites…'
                          : 'Select Site'}
                      </option>
                      {sites.map((s) => (
                        <option key={s.id} value={s.id}>{s.label}</option>
                      ))}
                    </select>
                    <label htmlFor="site-select" className="ax-float__label">Site Name *</label>
                  </div>
                  {errors.site && <div className="ax-field-feedback ax-field-feedback--error">{errors.site}</div>}
                </div>
              </div>

              {/* Site Details Preview Card */}
              {siteDetail && (
                <div className="resco-info-box">
                  <div className="resco-info-cell">
                    <span className="resco-info-label">State</span>
                    <span className="resco-info-val">{siteDetail.state || 'UP'}</span>
                  </div>
                  <div className="resco-info-cell">
                    <span className="resco-info-label">District</span>
                    <span className="resco-info-val">{siteDetail.district || '—'}</span>
                  </div>
                  <div className="resco-info-cell">
                    <span className="resco-info-label">Department Name</span>
                    <span className="resco-info-val">{siteDetail.dept_name || '—'}</span>
                  </div>
                  <div className="resco-info-cell">
                    <span className="resco-info-label">Site Name</span>
                    <span className="resco-info-val">{siteDetail.site_name || '—'}</span>
                  </div>
                  <div className="resco-info-cell">
                    <span className="resco-info-label">Location</span>
                    <span className="resco-info-val">{siteDetail.location || '—'}</span>
                  </div>
                  <div className="resco-info-cell">
                    <span className="resco-info-label">CA NO.</span>
                    <span className="resco-info-val">{siteDetail.ca_no || '—'}</span>
                  </div>
                  <div className="resco-info-cell">
                    <span className="resco-info-label">Sanction Load (kVA)</span>
                    <span className="resco-info-val">{siteDetail.sanction_load || '—'}</span>
                  </div>
                  <div className="resco-info-cell">
                    <span className="resco-info-label">Plan SC (kVA)</span>
                    <span className="resco-info-val">{siteDetail.plant_sc || '—'}</span>
                  </div>
                </div>
              )}

              {!selectedSiteId && (
                <div style={{
                  padding: 'var(--ax-space-5)',
                  marginBottom: 'var(--ax-space-5)',
                  background: 'var(--ax-surface-subtle)',
                  borderRadius: 'var(--ax-radius-lg)',
                  border: '1px dashed var(--ax-border)',
                  color: 'var(--ax-text-muted)',
                  fontSize: 'var(--ax-text-sm)',
                  textAlign: 'center'
                }}>
                  Please select <strong>AMC Year</strong>, <strong>AMC Month</strong>, and <strong>Site Name</strong> above to unlock the report form fields.
                </div>
              )}

              {/* Visit Date, Time, GPS, Beneficiary Info */}
              <div className="resco-form-grid resco-form-grid--3col">
                {/* Visit Date */}
                <div>
                  <div className="ax-float ax-float--date">
                    <input
                      id="visit-date"
                      type="date"
                      disabled={!selectedSiteId}
                      className={`ax-float__input ${errors.visitDate ? 'is-invalid' : ''}`}
                      value={visitDate}
                      onChange={(e) => handleVisitDateChange(e.target.value)}
                    />
                    <label htmlFor="visit-date" className="ax-float__label">Visit Date *</label>
                  </div>
                  {errors.visitDate && <div className="ax-field-feedback ax-field-feedback--error">{errors.visitDate}</div>}
                </div>

                {/* Visit Time */}
                <div>
                  <div className="ax-float ax-float--date">
                    <input
                      id="visit-time"
                      type="time"
                      disabled={!selectedSiteId}
                      className={`ax-float__input ${errors.visitTime ? 'is-invalid' : ''}`}
                      value={visitTime}
                      onChange={(e) => {
                        setVisitTime(e.target.value);
                        clearError('visitTime');
                      }}
                    />
                    <label htmlFor="visit-time" className="ax-float__label">Visit Time *</label>
                  </div>
                  {errors.visitTime && <div className="ax-field-feedback ax-field-feedback--error">{errors.visitTime}</div>}
                </div>

                {/* GPS Location Auto-detect */}
                <div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <div className="ax-float" style={{ flex: 1 }}>
                      <input
                        id="gps-lat"
                        type="text"
                        disabled={!selectedSiteId}
                        placeholder="Latitude"
                        className={`ax-float__input ${errors.latitude ? 'is-invalid' : ''}`}
                        value={latitude}
                        onChange={(e) => {
                          setLatitude(e.target.value);
                          clearError('latitude');
                        }}
                      />
                      <label htmlFor="gps-lat" className="ax-float__label">Latitude *</label>
                    </div>
                    <div className="ax-float" style={{ flex: 1 }}>
                      <input
                        id="gps-lng"
                        type="text"
                        disabled={!selectedSiteId}
                        placeholder="Longitude"
                        className={`ax-float__input ${errors.longitude ? 'is-invalid' : ''}`}
                        value={longitude}
                        onChange={(e) => {
                          setLongitude(e.target.value);
                          clearError('longitude');
                        }}
                      />
                      <label htmlFor="gps-lng" className="ax-float__label">Longitude *</label>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDetectGps(false)}
                      className="ax-btn ax-btn--secondary"
                      style={{ height: 46, padding: '0 12px', whiteSpace: 'nowrap' }}
                      title="Auto-detect current GPS location"
                      disabled={!selectedSiteId || gpsStatus === 'fetching'}
                    >
                      {gpsStatus === 'fetching' ? (
                        <span style={{ fontSize: 11 }}>Locating…</span>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
                          <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {(errors.latitude || errors.longitude) && (
                    <div className="ax-field-feedback ax-field-feedback--error">
                      {errors.latitude || errors.longitude}
                    </div>
                  )}
                </div>

                {/* Beneficiary Name */}
                <div>
                  <div className="ax-float">
                    <input
                      id="ben-name"
                      type="text"
                      disabled={!selectedSiteId}
                      placeholder="Beneficiary Name"
                      className={`ax-float__input ${errors.beneficiaryName ? 'is-invalid' : ''}`}
                      value={beneficiaryName}
                      onChange={(e) => {
                        setBeneficiaryName(e.target.value);
                        clearError('beneficiaryName');
                      }}
                    />
                    <label htmlFor="ben-name" className="ax-float__label">Beneficiary Name *</label>
                  </div>
                  {errors.beneficiaryName && <div className="ax-field-feedback ax-field-feedback--error">{errors.beneficiaryName}</div>}
                </div>

                {/* Beneficiary Contact */}
                <div>
                  <div className="ax-float">
                    <input
                      id="ben-contact"
                      type="tel"
                      maxLength={10}
                      disabled={!selectedSiteId}
                      placeholder="Beneficiary Contact"
                      className={`ax-float__input ${errors.beneficiaryContact ? 'is-invalid' : ''}`}
                      value={beneficiaryContact}
                      onChange={(e) => {
                        setBeneficiaryContact(e.target.value.replace(/\D/g, '').slice(0, 10));
                        clearError('beneficiaryContact');
                      }}
                    />
                    <label htmlFor="ben-contact" className="ax-float__label">Beneficiary Contact *</label>
                  </div>
                  {errors.beneficiaryContact && <div className="ax-field-feedback ax-field-feedback--error">{errors.beneficiaryContact}</div>}
                </div>
              </div>
            </div>

            <hr className="resco-section-divider" />

            {/* ── Section 2: 1. Cleaning Module ── */}
            <div id="sec-cleaning" className="resco-section-block">
              <div className="resco-section-header">
                <div className="resco-section-title-wrap">
                  <span style={{ fontSize: 'var(--ax-text-xs)', fontWeight: 600, color: 'var(--ax-accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Section 2 of {SECTIONS.length}
                  </span>
                  <h3 style={{ fontSize: 'var(--ax-text-base)', fontWeight: 600, margin: 0, color: 'var(--ax-text-strong)' }}>
                    1. Cleaning Module
                  </h3>
                  <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
                    Photo will be geotagged with GPS coordinates and timestamp automatically.
                  </span>
                </div>
              </div>

              <div className="resco-form-grid resco-form-grid--2col">
                {/* Before Cleaning Photos */}
                <div className="resco-photo-box">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: 'var(--ax-text-xs)', fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                      Before Cleaning Photos * <span style={{ fontWeight: 400, color: 'var(--ax-text-muted)' }}>(Max 5)</span>
                    </label>
                    <span style={{ fontSize: '11px', color: beforeCleaningPhotos.length >= 5 ? 'var(--ax-danger, #ef4444)' : 'var(--ax-text-muted)' }}>
                      {beforeCleaningPhotos.length} / 5 selected
                    </span>
                  </div>
                  <input
                    id="before-cleaning-input"
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={!selectedSiteId || beforeCleaningPhotos.length >= 5}
                    style={{ fontSize: 'var(--ax-text-xs)' }}
                    onChange={(e) => {
                      if (e.target.files) {
                        const files = Array.from(e.target.files);
                        setBeforeCleaningPhotos((prev) => {
                          const combined = [...prev, ...files];
                          if (combined.length > 5) {
                            setToast({ type: 'error', message: 'Maximum 5 Before Cleaning photos allowed. Extra photos truncated.' });
                            return combined.slice(0, 5);
                          }
                          return combined;
                        });
                        clearError('beforeCleaningPhotos');
                        clearError('before_cleaning_photo');
                      }
                      e.target.value = '';
                    }}
                  />
                  {beforeCleaningPhotos.length > 0 && (
                    <div className="resco-photo-previews">
                      {beforeCleaningPhotos.map((f, i) => (
                        <div key={i} className="resco-thumb-wrap">
                          <img src={URL.createObjectURL(f)} alt={`Before ${i + 1}`} className="resco-thumb-img" />
                          <button
                            type="button"
                            className="resco-thumb-del"
                            onClick={() => {
                              setBeforeCleaningPhotos((prev) => prev.filter((_, idx) => idx !== i));
                              clearError('beforeCleaningPhotos');
                              clearError('before_cleaning_photo');
                            }}
                            title="Remove photo"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {(errors.beforeCleaningPhotos || errors.before_cleaning_photo) && (
                    <div className="ax-field-feedback ax-field-feedback--error">
                      {errors.beforeCleaningPhotos || errors.before_cleaning_photo}
                    </div>
                  )}
                </div>

                {/* After Cleaning Photos */}
                <div className="resco-photo-box">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: 'var(--ax-text-xs)', fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                      After Cleaning Photos * <span style={{ fontWeight: 400, color: 'var(--ax-text-muted)' }}>(Max 5)</span>
                    </label>
                    <span style={{ fontSize: '11px', color: afterCleaningPhotos.length >= 5 ? 'var(--ax-danger, #ef4444)' : 'var(--ax-text-muted)' }}>
                      {afterCleaningPhotos.length} / 5 selected
                    </span>
                  </div>
                  <input
                    id="after-cleaning-input"
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={!selectedSiteId || afterCleaningPhotos.length >= 5}
                    style={{ fontSize: 'var(--ax-text-xs)' }}
                    onChange={(e) => {
                      if (e.target.files) {
                        const files = Array.from(e.target.files);
                        setAfterCleaningPhotos((prev) => {
                          const combined = [...prev, ...files];
                          if (combined.length > 5) {
                            setToast({ type: 'error', message: 'Maximum 5 After Cleaning photos allowed. Extra photos truncated.' });
                            return combined.slice(0, 5);
                          }
                          return combined;
                        });
                        clearError('afterCleaningPhotos');
                        clearError('after_cleaning_photo');
                      }
                      e.target.value = '';
                    }}
                  />
                  {afterCleaningPhotos.length > 0 && (
                    <div className="resco-photo-previews">
                      {afterCleaningPhotos.map((f, i) => (
                        <div key={i} className="resco-thumb-wrap">
                          <img src={URL.createObjectURL(f)} alt={`After ${i + 1}`} className="resco-thumb-img" />
                          <button
                            type="button"
                            className="resco-thumb-del"
                            onClick={() => {
                              setAfterCleaningPhotos((prev) => prev.filter((_, idx) => idx !== i));
                              clearError('afterCleaningPhotos');
                              clearError('after_cleaning_photo');
                            }}
                            title="Remove photo"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {(errors.afterCleaningPhotos || errors.after_cleaning_photo) && (
                    <div className="ax-field-feedback ax-field-feedback--error">
                      {errors.afterCleaningPhotos || errors.after_cleaning_photo}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <hr className="resco-section-divider" />

            {/* ── Section 3: 2. Inverter Section (CRITICAL FIX FOR METER READING) ── */}
            <div id="sec-inverter" className="resco-section-block">
              <div className="resco-section-header">
                <div className="resco-section-title-wrap">
                  <span style={{ fontSize: 'var(--ax-text-xs)', fontWeight: 600, color: 'var(--ax-accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Section 3 of {SECTIONS.length}
                  </span>
                  <h3 style={{ fontSize: 'var(--ax-text-base)', fontWeight: 600, margin: 0, color: 'var(--ax-text-strong)' }}>
                    2. Inverter Section
                  </h3>
                  <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
                    Capture Joint Meter Reading (JMR), energy meter units, and inverter working parameters
                  </span>
                </div>
              </div>

              <div className="resco-form-grid resco-form-grid--2col">
                {/* JMR Report Upload */}
                <div className="resco-photo-box">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: 'var(--ax-text-xs)', fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                      JMR Report Upload *
                    </label>
                    {jmrReport && (
                      <span style={{ fontSize: '11px', color: 'var(--ax-success-500)', fontWeight: 600 }}>
                        {jmrReport.name} ({(jmrReport.size / 1024).toFixed(1)} KB)
                      </span>
                    )}
                  </div>
                  <input
                    id="jmr-report-input"
                    type="file"
                    accept="image/*,.pdf"
                    style={{ fontSize: 'var(--ax-text-xs)' }}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setJmrReport(e.target.files[0]);
                        clearError('jmrReport');
                      }
                    }}
                  />
                  {errors.jmrReport && <div className="ax-field-feedback ax-field-feedback--error">{errors.jmrReport}</div>}
                </div>

                {/* Meter Reading (kWh) - MANDATORY */}
                <div>
                  <div className="ax-float">
                    <input
                      id="meter-reading"
                      type="number"
                      step="any"
                      placeholder="Meter Reading"
                      className={`ax-float__input ${errors.meter_reading ? 'is-invalid' : ''}`}
                      value={meterReading}
                      onChange={(e) => {
                        setMeterReading(e.target.value);
                        clearError('meter_reading');
                      }}
                      required
                    />
                    <label htmlFor="meter-reading" className="ax-float__label">
                      Meter Reading (kWh) *
                    </label>
                  </div>
                  {errors.meter_reading && (
                    <div className="ax-field-feedback ax-field-feedback--error">{errors.meter_reading}</div>
                  )}
                  <span style={{ fontSize: '11px', color: 'var(--ax-text-muted)', marginTop: 2, display: 'block' }}>
                    Enter current cumulative generation reading in kWh
                  </span>
                </div>

                {/* Inverter Status */}
                <div>
                  <div className="ax-float ax-float--select">
                    <select
                      id="inverter-status"
                      className={`ax-float__input ${errors.inverterStatus ? 'is-invalid' : ''}`}
                      value={inverterStatus}
                      onChange={(e) => {
                        setInverterStatus(e.target.value);
                        clearError('inverterStatus');
                      }}
                    >
                      <option value="Working">Working</option>
                      <option value="Non-Working">Non-Working</option>
                      <option value="Other">Other</option>
                    </select>
                    <label htmlFor="inverter-status" className="ax-float__label">Inverter Status *</label>
                  </div>
                  {errors.inverterStatus && <div className="ax-field-feedback ax-field-feedback--error">{errors.inverterStatus}</div>}
                </div>

                {/* Inverter Remarks */}
                <div>
                  <div className="ax-float">
                    <input
                      id="inverter-remarks"
                      type="text"
                      placeholder="Inverter Remarks"
                      className={`ax-float__input ${errors.inverterRemarks ? 'is-invalid' : ''}`}
                      value={inverterRemarks}
                      onChange={(e) => {
                        setInverterRemarks(e.target.value);
                        clearError('inverterRemarks');
                      }}
                    />
                    <label htmlFor="inverter-remarks" className="ax-float__label">Inverter Remarks *</label>
                  </div>
                  {errors.inverterRemarks && <div className="ax-field-feedback ax-field-feedback--error">{errors.inverterRemarks}</div>}
                </div>
              </div>
            </div>

            <hr className="resco-section-divider" />

            {/* ── Section 4: 3. Equipment Status ── */}
            <div id="sec-equipment" className="resco-section-block">
              <div className="resco-section-header">
                <div className="resco-section-title-wrap">
                  <span style={{ fontSize: 'var(--ax-text-xs)', fontWeight: 600, color: 'var(--ax-accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Section 4 of {SECTIONS.length}
                  </span>
                  <h3 style={{ fontSize: 'var(--ax-text-base)', fontWeight: 600, margin: 0, color: 'var(--ax-text-strong)' }}>
                    3. Equipment Status
                  </h3>
                  <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
                    Verify Lightning Arrester, Earthing, Wiring, and Distribution Boxes
                  </span>
                </div>
              </div>

              <div className="resco-form-grid resco-form-grid--3col">
                {/* LA Status */}
                <div>
                  <div className="ax-float ax-float--select">
                    <select
                      id="la-status"
                      className={`ax-float__input ${errors.laStatus ? 'is-invalid' : ''}`}
                      value={laStatus}
                      onChange={(e) => {
                        setLaStatus(e.target.value);
                        clearError('laStatus');
                      }}
                    >
                      <option value="OK">OK</option>
                      <option value="Broken">Broken</option>
                    </select>
                    <label htmlFor="la-status" className="ax-float__label">LA Status *</label>
                  </div>
                  {errors.laStatus && <div className="ax-field-feedback ax-field-feedback--error">{errors.laStatus}</div>}
                </div>

                {/* Wiring Status */}
                <div>
                  <div className="ax-float ax-float--select">
                    <select
                      id="wiring-status"
                      className={`ax-float__input ${errors.wiringStatus ? 'is-invalid' : ''}`}
                      value={wiringStatus}
                      onChange={(e) => {
                        setWiringStatus(e.target.value);
                        clearError('wiringStatus');
                      }}
                    >
                      <option value="OK">OK</option>
                      <option value="Not OK">Not OK</option>
                    </select>
                    <label htmlFor="wiring-status" className="ax-float__label">Wiring Status *</label>
                  </div>
                  {errors.wiringStatus && <div className="ax-field-feedback ax-field-feedback--error">{errors.wiringStatus}</div>}
                </div>

                {/* Earthing Status */}
                <div>
                  <div className="ax-float ax-float--select">
                    <select
                      id="earthing-status"
                      className={`ax-float__input ${errors.earthingStatus ? 'is-invalid' : ''}`}
                      value={earthingStatus}
                      onChange={(e) => {
                        setEarthingStatus(e.target.value);
                        clearError('earthingStatus');
                      }}
                    >
                      <option value="OK">OK</option>
                      <option value="Broken">Broken</option>
                    </select>
                    <label htmlFor="earthing-status" className="ax-float__label">Earthing Status *</label>
                  </div>
                  {errors.earthingStatus && <div className="ax-field-feedback ax-field-feedback--error">{errors.earthingStatus}</div>}
                </div>

                {/* ACDB Status */}
                <div>
                  <div className="ax-float ax-float--select">
                    <select
                      id="acdb-status"
                      className={`ax-float__input ${errors.acdbStatus ? 'is-invalid' : ''}`}
                      value={acdbStatus}
                      onChange={(e) => {
                        setAcdbStatus(e.target.value);
                        clearError('acdbStatus');
                      }}
                    >
                      <option value="Working">Working</option>
                      <option value="Not Working">Not Working</option>
                    </select>
                    <label htmlFor="acdb-status" className="ax-float__label">ACDB Status *</label>
                  </div>
                  {errors.acdbStatus && <div className="ax-field-feedback ax-field-feedback--error">{errors.acdbStatus}</div>}
                </div>

                {/* DCDB Status */}
                <div>
                  <div className="ax-float ax-float--select">
                    <select
                      id="dcdb-status"
                      className={`ax-float__input ${errors.dcdbStatus ? 'is-invalid' : ''}`}
                      value={dcdbStatus}
                      onChange={(e) => {
                        setDcdbStatus(e.target.value);
                        clearError('dcdbStatus');
                      }}
                    >
                      <option value="Working">Working</option>
                      <option value="Not Working">Not Working</option>
                    </select>
                    <label htmlFor="dcdb-status" className="ax-float__label">DCDB Status *</label>
                  </div>
                  {errors.dcdbStatus && <div className="ax-field-feedback ax-field-feedback--error">{errors.dcdbStatus}</div>}
                </div>

                {/* RMS Status (Optional) */}
                <div>
                  <div className="ax-float ax-float--select">
                    <select
                      id="rms-status"
                      className="ax-float__input"
                      value={rmsStatus}
                      onChange={(e) => setRmsStatus(e.target.value)}
                    >
                      <option value="Working">Working</option>
                      <option value="Not Working">Not Working</option>
                      <option value="NA">NA / Not Applicable</option>
                      <option value="Other">Other</option>
                    </select>
                    <label htmlFor="rms-status" className="ax-float__label">RMS Status (Optional)</label>
                  </div>
                </div>
              </div>
            </div>

            <hr className="resco-section-divider" />

            {/* ── Section 5: 4. Reminder & Due Date (CRITICAL FIX FOR NEXT DUE DATE) ── */}
            <div id="sec-reminder" className="resco-section-block">
              <div className="resco-section-header">
                <div className="resco-section-title-wrap">
                  <span style={{ fontSize: 'var(--ax-text-xs)', fontWeight: 600, color: 'var(--ax-accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Section 5 of {SECTIONS.length}
                  </span>
                  <h3 style={{ fontSize: 'var(--ax-text-base)', fontWeight: 600, margin: 0, color: 'var(--ax-text-strong)' }}>
                    4. Reminder & Due Date
                  </h3>
                  <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
                    Specify next periodic visit schedule and operational notes
                  </span>
                </div>
              </div>

              <div className="resco-form-grid resco-form-grid--2col">
                {/* Next Due Date - MANDATORY */}
                <div>
                  <div className="ax-float ax-float--date">
                    <input
                      id="next-due-date"
                      type="date"
                      className={`ax-float__input ${errors.next_due_date ? 'is-invalid' : ''}`}
                      value={nextDueDate}
                      onChange={(e) => {
                        setNextDueDate(e.target.value);
                        clearError('next_due_date');
                      }}
                      required
                    />
                    <label htmlFor="next-due-date" className="ax-float__label">
                      Next Due Date *
                    </label>
                  </div>
                  {errors.next_due_date && (
                    <div className="ax-field-feedback ax-field-feedback--error">{errors.next_due_date}</div>
                  )}
                  <span style={{ fontSize: '11px', color: 'var(--ax-text-muted)', marginTop: 2, display: 'block' }}>
                    Scheduled date for next AMC maintenance visit (auto-defaults to +30 days)
                  </span>
                </div>

                {/* Reminder Notes */}
                <div>
                  <div className="ax-float">
                    <input
                      id="reminder-notes"
                      type="text"
                      placeholder="Reminder Notes"
                      className="ax-float__input"
                      value={reminderNotes}
                      onChange={(e) => setReminderNotes(e.target.value)}
                    />
                    <label htmlFor="reminder-notes" className="ax-float__label">Reminder Notes</label>
                  </div>
                </div>
              </div>
            </div>

            <hr className="resco-section-divider" />

            {/* ── Section 6: 5. Technician/User Acknowledgement ── */}
            <div id="sec-ack" className="resco-section-block">
              <div className="resco-section-header">
                <div className="resco-section-title-wrap">
                  <span style={{ fontSize: 'var(--ax-text-xs)', fontWeight: 600, color: 'var(--ax-accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Section 6 of {SECTIONS.length}
                  </span>
                  <h3 style={{ fontSize: 'var(--ax-text-base)', fontWeight: 600, margin: 0, color: 'var(--ax-text-strong)' }}>
                    5. Technician/User Acknowledgement
                  </h3>
                  <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
                    Upload digital signature and certify periodic checkup execution
                  </span>
                </div>
              </div>

              <div className="resco-form-grid resco-form-grid--2col">
                {/* Digital Signature Upload */}
                <div className="resco-photo-box">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: 'var(--ax-text-xs)', fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                      Digital Signature Upload *
                    </label>
                    {digitalSignature && (
                      <span style={{ fontSize: '11px', color: 'var(--ax-success-500)', fontWeight: 600 }}>
                        {digitalSignature.name} ({(digitalSignature.size / 1024).toFixed(1)} KB)
                      </span>
                    )}
                  </div>
                  <input
                    id="digital-signature-input"
                    type="file"
                    accept="image/*"
                    style={{ fontSize: 'var(--ax-text-xs)' }}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setDigitalSignature(e.target.files[0]);
                        clearError('digitalSignature');
                      }
                    }}
                  />
                  {digitalSignature && (
                    <div style={{ width: 100, height: 60, border: '1px solid var(--ax-border)', borderRadius: 4, overflow: 'hidden', marginTop: 4 }}>
                      <img src={URL.createObjectURL(digitalSignature)} alt="Signature" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                  )}
                  {errors.digitalSignature && (
                    <div className="ax-field-feedback ax-field-feedback--error">{errors.digitalSignature}</div>
                  )}
                </div>

                {/* Acknowledgement Confirmation Checkbox */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, justifyContent: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-strong)' }}>
                    <input
                      type="checkbox"
                      checked={acknowledgement}
                      onChange={(e) => {
                        setAcknowledgement(e.target.checked);
                        clearError('acknowledgement');
                      }}
                      style={{ width: 18, height: 18, accentColor: 'var(--ax-accent)' }}
                    />
                    <span>
                      <strong>Acknowledgement Confirmation *</strong>: I confirm all maintenance activity has been completed.
                    </span>
                  </label>
                  {errors.acknowledgement && (
                    <div className="ax-field-feedback ax-field-feedback--error">{errors.acknowledgement}</div>
                  )}

                  {/* Remarks */}
                  <div className="ax-float ax-float--area">
                    <textarea
                      id="general-remarks"
                      placeholder="Remarks"
                      className="ax-float__input"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                    />
                    <label htmlFor="general-remarks" className="ax-float__label">Remarks</label>
                  </div>
                </div>
              </div>
            </div>

            <hr className="resco-section-divider" />

            {/* ── Section 7: Raised Complaint ── */}
            <div id="sec-complaint" className="resco-section-block">
              <div className="resco-section-header">
                <div className="resco-section-title-wrap">
                  <span style={{ fontSize: 'var(--ax-text-xs)', fontWeight: 600, color: 'var(--ax-accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Section 7 of {SECTIONS.length}
                  </span>
                  <h3 style={{ fontSize: 'var(--ax-text-base)', fontWeight: 600, margin: 0, color: 'var(--ax-text-strong)' }}>
                    Raised Complaint
                  </h3>
                  <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
                    Log warranty defects or damage requiring department resolution
                  </span>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 'var(--ax-text-xs)', fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                  <input
                    type="checkbox"
                    checked={raiseComplaint}
                    onChange={(e) => setRaiseComplaint(e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: 'var(--ax-accent)' }}
                  />
                  <span>Raise Complaint for this Site</span>
                </label>
              </div>

              {raiseComplaint && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-4)', padding: 'var(--ax-space-4)', background: 'var(--ax-surface-subtle)', borderRadius: 'var(--ax-radius-lg)', border: '1px solid var(--ax-border)' }}>
                  <div className="resco-form-grid resco-form-grid--2col">
                    {/* Complaint Image 1 */}
                    <div className="resco-photo-box">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label style={{ fontSize: 'var(--ax-text-xs)', fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                          Complaint Image 1 *
                        </label>
                        {complaintImage1 && (
                          <span style={{ fontSize: '11px', color: 'var(--ax-success-500)', fontWeight: 600 }}>
                            {complaintImage1.name}
                          </span>
                        )}
                      </div>
                      <input
                        id="complaint-img1"
                        type="file"
                        accept="image/*"
                        style={{ fontSize: 'var(--ax-text-xs)' }}
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setComplaintImage1(e.target.files[0]);
                            clearError('complaintImage1');
                          }
                        }}
                      />
                      {errors.complaintImage1 && (
                        <div className="ax-field-feedback ax-field-feedback--error">{errors.complaintImage1}</div>
                      )}
                    </div>

                    {/* Complaint Image 2 */}
                    <div className="resco-photo-box">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label style={{ fontSize: 'var(--ax-text-xs)', fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                          Complaint Image 2 (Optional)
                        </label>
                        {complaintImage2 && (
                          <span style={{ fontSize: '11px', color: 'var(--ax-success-500)', fontWeight: 600 }}>
                            {complaintImage2.name}
                          </span>
                        )}
                      </div>
                      <input
                        id="complaint-img2"
                        type="file"
                        accept="image/*"
                        style={{ fontSize: 'var(--ax-text-xs)' }}
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setComplaintImage2(e.target.files[0]);
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Complaint Description */}
                  <div className="ax-float ax-float--area">
                    <textarea
                      id="complaint-desc"
                      placeholder="Complaint Details"
                      className={`ax-float__input ${errors.complaint ? 'is-invalid' : ''}`}
                      value={complaintText}
                      onChange={(e) => {
                        setComplaintText(e.target.value);
                        clearError('complaint');
                      }}
                    />
                    <label htmlFor="complaint-desc" className="ax-float__label">Complaint *</label>
                  </div>
                  {errors.complaint && (
                    <div className="ax-field-feedback ax-field-feedback--error">{errors.complaint}</div>
                  )}
                </div>
              )}
            </div>

            {/* ── Sticky Bottom Action Bar ── */}
            <div className="resco-form-sticky-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
                  {Object.keys(errors).length > 0 ? (
                    <span style={{ color: 'var(--ax-danger-500)', fontWeight: 600 }}>
                      ⚠️ {Object.keys(errors).length} field(s) require your attention
                    </span>
                  ) : (
                    <span>Ready to submit maintenance report</span>
                  )}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  type="button"
                  onClick={handleReset}
                  className="ax-btn ax-btn--secondary"
                  disabled={submitting}
                >
                  Reset Form
                </button>
                <button
                  type="submit"
                  className="ax-btn ax-btn--primary"
                  disabled={submitting || !selectedSiteId}
                  style={{ minWidth: 160 }}
                >
                  {submitting ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <span className="ax-spinner" aria-hidden="true" />
                      Submitting…
                    </span>
                  ) : !selectedSiteId ? (
                    'Select Site to Submit'
                  ) : (
                    'Submit AMC Report'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default UP_AMC_Resco_PendingAMC;
