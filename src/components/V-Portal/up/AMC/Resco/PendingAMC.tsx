import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { upRescoAmcApi } from '../../up-services';
import { authService } from '../../../../../services/authService';

// Unified Single-Card Layout CSS with Floating Labels (Same design as Bihar SRT AMC)
const SINGLE_CARD_FORM_CSS = `
.resco-single-card-form .ax-card {
  border: 1px solid var(--ax-border);
  border-radius: var(--ax-radius-xl);
  background: var(--ax-surface-solid);
  box-shadow: var(--ax-shadow-sm);
  overflow: hidden;
}
.resco-single-card-form .ax-card__header {
  padding: var(--ax-space-5) var(--ax-space-6);
  border-bottom: 1px solid var(--ax-border-subtle);
  background: var(--ax-surface-subtle);
  display: flex;
  flex-direction: column;
  gap: var(--ax-space-4);
}
.resco-single-card-form .ax-card__body {
  padding: var(--ax-space-6);
}

.resco-section-pills {
  display: flex;
  gap: var(--ax-space-2);
  flex-wrap: wrap;
  padding-top: var(--ax-space-1);
}
.resco-section-pill-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: var(--ax-radius-pill);
  font-size: var(--ax-text-xs);
  font-weight: 600;
  border: 1px solid var(--ax-border);
  background: var(--ax-surface-solid);
  color: var(--ax-text-muted);
  cursor: pointer;
  transition: all var(--ax-motion-fast) var(--ax-ease-standard);
}
.resco-section-pill-btn:hover {
  background: var(--ax-surface-hover);
  color: var(--ax-text-strong);
  border-color: var(--ax-border-strong);
}
.resco-section-pill-btn .pill-num {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--ax-surface-subtle);
  color: var(--ax-text-subtle);
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
.resco-section-block + .resco-section-block {
  margin-top: var(--ax-space-8);
  padding-top: var(--ax-space-6);
  border-top: 1px solid var(--ax-border-subtle);
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
.ax-float--date .ax-float__label {
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
  .resco-form-grid--2col {
    grid-template-columns: repeat(2, 1fr);
  }
  .resco-form-grid--3col {
    grid-template-columns: repeat(3, 1fr);
  }
  .resco-form-grid--4col {
    grid-template-columns: repeat(4, 1fr);
  }
}
.resco-form-col-span-full {
  grid-column: 1 / -1;
}

.resco-info-card {
  background: var(--ax-surface-subtle);
  border: 1px solid var(--ax-border);
  border-radius: var(--ax-radius-lg);
  padding: var(--ax-space-4);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--ax-space-3);
  font-size: var(--ax-text-xs);
}
.resco-info-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.resco-info-label {
  color: var(--ax-text-muted);
  font-weight: 500;
  font-size: 11px;
}
.resco-info-value {
  color: var(--ax-text-strong);
  font-weight: 600;
  word-break: break-word;
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

@keyframes resco-spin {
  to { transform: rotate(360deg); }
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
  { id: 'sec-select', num: '1', title: 'Select Year, Month & Site' },
  { id: 'sec-site-info', num: '2', title: 'Site Information' },
  { id: 'sec-visit', num: '3', title: 'Visit Details' },
  { id: 'sec-cleaning', num: '4', title: 'Cleaning Module' },
  { id: 'sec-inverter', num: '5', title: 'Inverter Section' },
  { id: 'sec-equipment', num: '6', title: 'Equipment Status' },
  { id: 'sec-reminder', num: '7', title: 'Reminder & Due Date' },
  { id: 'sec-ack', num: '8', title: 'Acknowledgement' },
  { id: 'sec-complaint', num: '9', title: 'Raised Complaint' },
];

export function UP_AMC_Resco_PendingAMC() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const querySiteId = searchParams.get('id') || searchParams.get('site_id') || '';

  // ── Selection States ──
  const [years, setYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | ''>('');
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

  // Cleaning Module
  const [beforeCleaningPhotos, setBeforeCleaningPhotos] = useState<File[]>([]);
  const [afterCleaningPhotos, setAfterCleaningPhotos] = useState<File[]>([]);

  // Inverter Section
  const [jmrReport, setJmrReport] = useState<File | null>(null);
  const [meterReading, setMeterReading] = useState<string>('');
  const [inverterStatus, setInverterStatus] = useState<string>('Working');
  const [inverterRemarks, setInverterRemarks] = useState<string>('');

  // Equipment Status
  const [laStatus, setLaStatus] = useState<string>('OK');
  const [wiringStatus, setWiringStatus] = useState<string>('OK');
  const [earthingStatus, setEarthingStatus] = useState<string>('OK');
  const [acdbStatus, setAcdbStatus] = useState<string>('Working');
  const [dcdbStatus, setDcdbStatus] = useState<string>('Working');
  const [rmsStatus, setRmsStatus] = useState<string>('Working');

  // Reminder & Due Date
  const [nextDueDate, setNextDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });
  const [reminderNotes, setReminderNotes] = useState<string>('');

  // Acknowledgement
  const [digitalSignature, setDigitalSignature] = useState<File | null>(null);
  const [acknowledgement, setAcknowledgement] = useState<boolean>(true);
  const [remarks, setRemarks] = useState<string>('');

  // Raised Complaint
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSiteId]);

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
          const numYears = arr.map(Number).filter((n: number) => !Number.isNaN(n) && n > 0);
          setYears(numYears);
          if (numYears.length > 0) {
            const curY = new Date().getFullYear();
            setSelectedYear(numYears.includes(curY) ? curY : numYears[0]);
          } else {
            setSelectedYear('');
          }
        } else if (active) {
          setYears([]);
          setSelectedYear('');
        }
      } catch (err) {
        console.error('Error fetching Resco AMC years:', err);
        if (active) {
          setYears([]);
          setSelectedYear('');
        }
      } finally {
        if (active) setLoadingYears(false);
      }
    })();
    return () => { active = false; };
  }, []);

  // ── 2. Fetch Months when Year changes ──
  useEffect(() => {
    if (!selectedYear) {
      setMonths([]);
      setSelectedMonth('');
      return;
    }
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

        const normalized = list.map((m: any) => {
          const val = typeof m === 'object' && m !== null ? (m.month ?? m.months ?? m.id ?? m.value ?? m) : m;
          const strVal = String(val);
          const label = MONTH_NAMES[strVal] || strVal;
          return { id: strVal, label };
        });

        if (active) {
          setMonths(normalized);
          if (normalized.length > 0) {
            const curM = String(new Date().getMonth() + 1);
            const match = normalized.find((m) => m.id === curM || m.label.toLowerCase() === MONTH_NAMES[curM]?.toLowerCase());
            setSelectedMonth(match ? String(match.id) : String(normalized[0].id));
          } else {
            setSelectedMonth('');
          }
        }
      } catch (err) {
        console.error('Error fetching Resco AMC months:', err);
        if (active) {
          setMonths([]);
          setSelectedMonth('');
        }
      } finally {
        if (active) setLoadingMonths(false);
      }
    })();
    return () => { active = false; };
  }, [selectedYear]);

  // ── 3. Fetch Sites when Year or Month changes ──
  useEffect(() => {
    if (!selectedYear || !selectedMonth) {
      setSites([]);
      return;
    }
    let active = true;
    (async () => {
      setLoadingSites(true);
      try {
        const res: any = await upRescoAmcApi.getSiteName(selectedYear, selectedMonth);
        let list: any[] = [];
        if (Array.isArray(res)) list = res;
        else if (Array.isArray(res?.srtamc)) list = res.srtamc;
        else if (Array.isArray(res?.data?.srtamc)) list = res.data.srtamc;
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
          res?.data?.srtamc ||
          res?.srtamc ||
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
            state: d.state || '',
            district: d.district || d.f_district || '—',
            dept_name: d.dept_name || d.department || d.department_name || '—',
            site_name: d.site_name || d.name || '—',
            location: d.location || d.address || d.village || '—',
            ca_no: d.ca_no || d.consumer_no || d.f_sr_no || d.application_no || d.serial_number || '—',
            sanction_load: d.sanction_load || d.volume || d.capacity || '—',
            plant_sc: d.plant_sc || d.plan_sc || d.plant_capacity || '—',
            beneficiary_name: d.beneficiary_name || d.contact_person || d.name || '',
            beneficiary_contact: String(d.beneficiary_contact || d.contact_number || d.contact || d.mobile || d.contact_person_number || '').replace(/\D/g, '').slice(-10),
            amc_type: d.amc_type || '',
          };
          setSiteDetail(info);
          setBeneficiaryName(info.beneficiary_name || '');
          setBeneficiaryContact(info.beneficiary_contact || '');
        }
      } catch (err) {
        console.error('Error fetching Resco AMC site details:', err);
      } finally {
        if (active) setLoadingDetail(false);
      }
    })();
    return () => { active = false; };
  }, [selectedSiteId]);

  // When visitDate changes, keep nextDueDate at +30 days
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

    if (!jmrReport) errs.jmrReport = 'JMR Report Upload is required.';
    if (!meterReading.trim()) errs.meter_reading = 'The meter reading field is required.';
    if (!inverterStatus) errs.inverterStatus = 'Inverter Status is required.';
    if (!inverterRemarks.trim()) errs.inverterRemarks = 'Inverter Remarks is required.';

    if (!laStatus) errs.laStatus = 'LA Status is required.';
    if (!wiringStatus) errs.wiringStatus = 'Wiring Status is required.';
    if (!earthingStatus) errs.earthingStatus = 'Earthing Status is required.';
    if (!acdbStatus) errs.acdbStatus = 'ACDB Status is required.';
    if (!dcdbStatus) errs.dcdbStatus = 'DCDB Status is required.';

    if (!nextDueDate.trim()) errs.next_due_date = 'The next due date field is required.';

    if (!digitalSignature) errs.digitalSignature = 'Digital Signature Upload is required.';
    if (!acknowledgement) errs.acknowledgement = 'You must confirm that all maintenance activity has been completed.';

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

      const numMonth = parseMonthNumber(selectedMonth);
      const strMonth = String(numMonth);
      const paddedMonth = strMonth.padStart(2, '0');
      const monthName = MONTH_NAMES[strMonth] || String(selectedMonth);
      const monthYear = `${paddedMonth}-${selectedYear}`;

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

      fd.append('amc_years', String(selectedYear));
      fd.append('year', String(selectedYear));
      fd.append('report_year', String(selectedYear));

      fd.append('months', strMonth);
      fd.append('month', strMonth);
      fd.append('amc_months', strMonth);
      fd.append('report_month', strMonth);
      fd.append('month_name', monthName);
      fd.append('month_year', monthYear);

      fd.append('amc_date', visitDate);
      fd.append('visit_date', visitDate);
      fd.append('date', visitDate);
      fd.append('report_date', visitDate);
      fd.append('visit_time', visitTime);

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
      const resolvedCompanyId = session?.company_id || cleanStr(siteDetail?.company_id);
      if (resolvedCompanyId) {
        fd.append('company_id', String(resolvedCompanyId));
      }
      const firm = cleanStr(siteDetail?.firm_name);
      if (firm) fd.append('firm_name', firm);

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
      if (sName) fd.append('site_name', sName);

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

      const sLoad = cleanNum(siteDetail?.sanction_load || siteDetail?.volume || siteDetail?.capacity);
      if (sLoad) fd.append('sanction_load', sLoad);

      const pSc = cleanNum(siteDetail?.plant_sc || siteDetail?.plan_sc || siteDetail?.plant_capacity);
      if (pSc) fd.append('plant_sc', pSc);

      const amcLower = (cleanStr(siteDetail?.amc_type) || 'monthly').toLowerCase();
      let rawAmc = 'Monthly';
      let aCode = 'M';
      let aId = '1';
      if (['quarterly', '3', 'q'].includes(amcLower)) {
        rawAmc = 'Quarterly';
        aCode = 'Q';
        aId = '3';
      } else if (['half-yearly', 'half yearly', 'halfyearly', '6', 'h'].includes(amcLower)) {
        rawAmc = 'Half-Yearly';
        aCode = 'H';
        aId = '6';
      } else if (['yearly', '12', 'y'].includes(amcLower)) {
        rawAmc = 'Yearly';
        aCode = 'Y';
        aId = '12';
      }
      fd.append('amc_type', rawAmc);
      fd.append('amc_type_code', aCode);
      fd.append('amc_type_id', aId);

      // Cleaning Module Photos — ONLY array brackets (Laravel array validator)
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

      // Inverter Section
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

      // Equipment Status
      fd.append('la_status', laStatus);
      fd.append('lightning_arrester_status', laStatus);
      fd.append('wiring_status', wiringStatus);
      fd.append('earthing_status', earthingStatus);
      fd.append('acdb_status', acdbStatus);
      fd.append('dcdb_status', dcdbStatus);
      if (rmsStatus) fd.append('rms_status', rmsStatus);

      // Reminder & Due Date
      fd.append('next_due_date', nextDueDate);
      fd.append('due_date', nextDueDate);
      if (reminderNotes.trim()) {
        fd.append('reminder_notes', reminderNotes.trim());
        fd.append('reminder_note', reminderNotes.trim());
      }

      // Acknowledgement
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

      // Raised Complaint
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
              if (k === 'before_cleaning_photo' || k.startsWith('before_cleaning_photo.')) serverErrors.beforeCleaningPhotos = msg;
              if (k === 'after_cleaning_photo' || k.startsWith('after_cleaning_photo.')) serverErrors.afterCleaningPhotos = msg;
              if (k === 'meter_reading' || k === 'reading') serverErrors.meter_reading = msg;
              if (k === 'next_due_date' || k === 'due_date') serverErrors.next_due_date = msg;
              if (k === 'jmr_report' || k === 'document') serverErrors.jmrReport = msg;
              if (k === 'digital_signature' || k === 'signature') serverErrors.digitalSignature = msg;
            }
          }
          setErrors((prev) => ({ ...prev, ...serverErrors }));
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err: any) {
      console.error('Submission error:', err);
      const serverData = err?.response?.data || err?.data || null;
      const serverMsg =
        (serverData?.errors ? Object.values(serverData.errors).flat().join(' ') : null) ||
        serverData?.message ||
        serverData?.error ||
        err?.message;
      setToast({ type: 'error', message: serverMsg || 'Server error occurred during submission. Please try again.' });
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

  const T = SECTIONS.length;
  const noSite = !selectedSiteId;

  return (
    <div className="resco-single-card-form">
      <style>{SINGLE_CARD_FORM_CSS}</style>

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
            <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l14 0" /><path d="M5 12l6 6" /><path d="M5 12l6 -6" /></svg>
            <span className="ax-btn__label">View Completed AMC</span>
          </Link>
        }
      />

      {/* Success Alert */}
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

      {/* Error Alert */}
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
          <div className="ax-card__header">
            <div>
              <span className="ax-card__eyebrow">Uttar Pradesh RESCO</span>
              <h2 className="ax-card__title" style={{ margin: 0 }}>
                UP Resco AMC Site Information
              </h2>
              <p className="ax-card__subtitle" style={{ margin: '4px 0 0' }}>
                Select Year, Month and Site to populate technical details, then record maintenance visit information.
              </p>
            </div>

            <div className="resco-section-pills" role="navigation" aria-label="Jump to section">
              {SECTIONS.map((s) => (
                <button key={s.id} type="button" onClick={() => scrollToSection(s.id)} className="resco-section-pill-btn">
                  <span className="pill-num">{s.num}</span>
                  <span>{s.title}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="ax-card__body">
            {/* Section 1: Selection */}
            <div id="sec-select" className="resco-section-block">
              <SectionHeader num="1" total={T} title="Select Year, Month & Site" desc="Choose the AMC period and assigned site." />
              <div className="resco-form-grid resco-form-grid--3col">
                <FloatingSelect
                  id="amc-year"
                  label="AMC Year"
                  required
                  placeholder={loadingYears ? 'Loading years...' : '-- Select Year --'}
                  value={selectedYear === '' ? '' : String(selectedYear)}
                  options={years.map((y) => ({ value: String(y), label: String(y) }))}
                  disabled={loadingYears}
                  onChange={(val) => {
                    setSelectedYear(val ? Number(val) : '');
                    setSelectedMonth('');
                    setSelectedSiteId('');
                    clearError('year');
                  }}
                  error={errors.year}
                />
                <FloatingSelect
                  id="amc-month"
                  label="AMC Month"
                  required
                  placeholder={!selectedYear ? 'Select Year First' : loadingMonths ? 'Loading months...' : '-- Select Month --'}
                  value={selectedMonth}
                  options={months.map((m) => ({ value: String(m.id), label: m.label }))}
                  disabled={loadingMonths || !selectedYear}
                  onChange={(val) => {
                    setSelectedMonth(val);
                    setSelectedSiteId('');
                    clearError('month');
                  }}
                  error={errors.month}
                />
                <FloatingSelect
                  id="site-select"
                  label="Site Name"
                  required
                  placeholder={
                    !selectedYear
                      ? 'Select Year First'
                      : !selectedMonth
                      ? 'Select Month First'
                      : loadingSites
                      ? 'Loading sites...'
                      : sites.length === 0
                      ? 'No sites available'
                      : '-- Select Site --'
                  }
                  value={selectedSiteId}
                  options={sites.map((s) => ({ value: String(s.id), label: s.label }))}
                  disabled={loadingSites || !selectedYear || !selectedMonth || sites.length === 0}
                  onChange={(val) => {
                    setSelectedSiteId(val);
                    clearError('site');
                  }}
                  error={errors.site}
                />
              </div>
            </div>

            {/* Section 2: Site Information */}
            <div id="sec-site-info" className="resco-section-block">
              <SectionHeader num="2" total={T} title="Site Information" desc="Read-only site metadata fetched from master records." />
              {loadingDetail ? (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--ax-text-muted)' }}>
                  <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading site information…
                </div>
              ) : siteDetail ? (
                <div className="resco-info-card">
                  <InfoItem label="State" value={siteDetail.state || 'UP'} />
                  <InfoItem label="District" value={siteDetail.district} />
                  <InfoItem label="Department Name" value={siteDetail.dept_name} />
                  <InfoItem label="Site Name" value={siteDetail.site_name} />
                  <InfoItem label="Location" value={siteDetail.location} />
                  <InfoItem label="CA No." value={siteDetail.ca_no} />
                  <InfoItem label="Sanction Load (kVA)" value={siteDetail.sanction_load} />
                  <InfoItem label="Plant SC (kVA)" value={siteDetail.plant_sc} />
                </div>
              ) : (
                <div style={{ padding: 20, textAlign: 'center', background: 'var(--ax-surface-subtle)', borderRadius: 8, color: 'var(--ax-text-muted)', fontSize: 13 }}>
                  Please select Year, Month and Site above to preview site details.
                </div>
              )}
            </div>

            {/* Section 3: Visit Details */}
            <div id="sec-visit" className="resco-section-block">
              <SectionHeader num="3" total={T} title="Visit Details" desc="The field labels marked with * are required fields." />
              <div className="resco-form-grid resco-form-grid--3col">
                <FloatingInput
                  id="visit-date"
                  label="Visit Date"
                  required
                  type="date"
                  disabled={noSite}
                  value={visitDate}
                  onChange={handleVisitDateChange}
                  error={errors.visitDate}
                />
                <FloatingInput
                  id="visit-time"
                  label="Visit Time"
                  required
                  type="time"
                  disabled={noSite}
                  value={visitTime}
                  onChange={(val) => {
                    setVisitTime(val);
                    clearError('visitTime');
                  }}
                  error={errors.visitTime}
                />
                <FloatingInput
                  id="ben-name"
                  label="Beneficiary Name"
                  required
                  disabled={noSite}
                  placeholder="Enter Beneficiary Name"
                  value={beneficiaryName}
                  onChange={(val) => {
                    setBeneficiaryName(val);
                    clearError('beneficiaryName');
                  }}
                  error={errors.beneficiaryName}
                />
                <FloatingInput
                  id="ben-contact"
                  label="Beneficiary Contact (10 Digits)"
                  required
                  type="tel"
                  maxLength={10}
                  disabled={noSite}
                  placeholder="10-digit mobile number"
                  value={beneficiaryContact}
                  onChange={(val) => {
                    setBeneficiaryContact(val.replace(/\D/g, '').slice(0, 10));
                    clearError('beneficiaryContact');
                  }}
                  error={errors.beneficiaryContact}
                />

                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <FloatingInput
                      id="gps-lat"
                      label="Latitude"
                      required
                      readOnly
                      disabled={noSite}
                      placeholder="Auto-detected GPS Latitude"
                      value={latitude}
                      onChange={() => {}}
                      error={errors.latitude}
                    />
                  </div>
                  <button
                    type="button"
                    className="ax-btn ax-btn--secondary"
                    style={{ height: 46, whiteSpace: 'nowrap', padding: '0 12px' }}
                    onClick={() => handleDetectGps(false)}
                    disabled={noSite || gpsStatus === 'fetching'}
                    title="Get current GPS coordinates"
                  >
                    {gpsStatus === 'fetching' ? (
                      <span className="ax-spinner" style={{ width: 14, height: 14 }} />
                    ) : (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="3" /><circle cx="12" cy="12" r="8" /><line x1="12" y1="2" x2="12" y2="4" /><line x1="12" y1="20" x2="12" y2="22" /><line x1="2" y1="12" x2="4" y2="12" /><line x1="20" y1="12" x2="22" y2="12" /></svg>
                    )}
                    <span className="ax-btn__label" style={{ fontSize: 11 }}>GPS</span>
                  </button>
                </div>

                <FloatingInput
                  id="gps-lng"
                  label="Longitude"
                  required
                  readOnly
                  disabled={noSite}
                  placeholder="Auto-detected GPS Longitude"
                  value={longitude}
                  onChange={() => {}}
                  error={errors.longitude}
                />
              </div>
            </div>

            {/* Section 4: Cleaning Module */}
            <div id="sec-cleaning" className="resco-section-block">
              <SectionHeader
                num="4"
                total={T}
                title="Cleaning Module"
                desc="Upload geo-tagged before and after cleaning photos (min 1, max 5 each, JPG/PNG)."
              />
              <div className="resco-form-grid resco-form-grid--2col">
                <MultiFileDrop
                  id="before-cleaning-input"
                  label="Before Cleaning Photos"
                  required
                  max={5}
                  disabled={noSite}
                  files={beforeCleaningPhotos}
                  onChange={(f) => {
                    setBeforeCleaningPhotos(f);
                    clearError('beforeCleaningPhotos');
                    clearError('before_cleaning_photo');
                  }}
                  onOverflow={() => setToast({ type: 'error', message: 'Maximum 5 Before Cleaning photos allowed. Extra photos truncated.' })}
                  error={errors.beforeCleaningPhotos || errors.before_cleaning_photo}
                />
                <MultiFileDrop
                  id="after-cleaning-input"
                  label="After Cleaning Photos"
                  required
                  max={5}
                  disabled={noSite}
                  files={afterCleaningPhotos}
                  onChange={(f) => {
                    setAfterCleaningPhotos(f);
                    clearError('afterCleaningPhotos');
                    clearError('after_cleaning_photo');
                  }}
                  onOverflow={() => setToast({ type: 'error', message: 'Maximum 5 After Cleaning photos allowed. Extra photos truncated.' })}
                  error={errors.afterCleaningPhotos || errors.after_cleaning_photo}
                />
              </div>
            </div>

            {/* Section 5: Inverter Section */}
            <div id="sec-inverter" className="resco-section-block">
              <SectionHeader
                num="5"
                total={T}
                title="Inverter Section"
                desc="Capture Joint Meter Reading (JMR), energy meter units, and inverter working parameters."
              />
              <div className="resco-form-grid resco-form-grid--2col">
                <FloatingFileInput
                  id="jmr-report-input"
                  label="JMR Report Upload"
                  required
                  accept="image/*,.pdf"
                  file={jmrReport}
                  onChange={(f) => {
                    setJmrReport(f);
                    clearError('jmrReport');
                  }}
                  error={errors.jmrReport}
                />
                <FloatingInput
                  id="meter-reading"
                  label="Meter Reading (kWh)"
                  required
                  type="number"
                  placeholder="Enter current cumulative generation in kWh"
                  value={meterReading}
                  onChange={(val) => {
                    setMeterReading(val);
                    clearError('meter_reading');
                  }}
                  error={errors.meter_reading}
                />
                <FloatingSelect
                  id="inverter-status"
                  label="Inverter Status"
                  required
                  placeholder="-- Select --"
                  value={inverterStatus}
                  options={[
                    { value: 'Working', label: 'Working' },
                    { value: 'Non-Working', label: 'Non-Working' },
                    { value: 'Other', label: 'Other' },
                  ]}
                  onChange={(val) => {
                    setInverterStatus(val);
                    clearError('inverterStatus');
                  }}
                  error={errors.inverterStatus}
                />
                <FloatingInput
                  id="inverter-remarks"
                  label="Inverter Remarks"
                  required
                  placeholder="Enter Inverter Remarks"
                  value={inverterRemarks}
                  onChange={(val) => {
                    setInverterRemarks(val);
                    clearError('inverterRemarks');
                  }}
                  error={errors.inverterRemarks}
                />
              </div>
            </div>

            {/* Section 6: Equipment Status */}
            <div id="sec-equipment" className="resco-section-block">
              <SectionHeader
                num="6"
                total={T}
                title="Equipment Status"
                desc="Verify Lightning Arrester, Earthing, Wiring, and Distribution Boxes."
              />
              <div className="resco-form-grid resco-form-grid--3col">
                <FloatingSelect
                  id="la-status"
                  label="LA Status"
                  required
                  placeholder="-- Select --"
                  value={laStatus}
                  options={[{ value: 'OK', label: 'OK' }, { value: 'Broken', label: 'Broken' }]}
                  onChange={(val) => { setLaStatus(val); clearError('laStatus'); }}
                  error={errors.laStatus}
                />
                <FloatingSelect
                  id="wiring-status"
                  label="Wiring Status"
                  required
                  placeholder="-- Select --"
                  value={wiringStatus}
                  options={[{ value: 'OK', label: 'OK' }, { value: 'Not OK', label: 'Not OK' }]}
                  onChange={(val) => { setWiringStatus(val); clearError('wiringStatus'); }}
                  error={errors.wiringStatus}
                />
                <FloatingSelect
                  id="earthing-status"
                  label="Earthing Status"
                  required
                  placeholder="-- Select --"
                  value={earthingStatus}
                  options={[{ value: 'OK', label: 'OK' }, { value: 'Broken', label: 'Broken' }]}
                  onChange={(val) => { setEarthingStatus(val); clearError('earthingStatus'); }}
                  error={errors.earthingStatus}
                />
                <FloatingSelect
                  id="acdb-status"
                  label="ACDB Status"
                  required
                  placeholder="-- Select --"
                  value={acdbStatus}
                  options={[{ value: 'Working', label: 'Working' }, { value: 'Not Working', label: 'Not Working' }]}
                  onChange={(val) => { setAcdbStatus(val); clearError('acdbStatus'); }}
                  error={errors.acdbStatus}
                />
                <FloatingSelect
                  id="dcdb-status"
                  label="DCDB Status"
                  required
                  placeholder="-- Select --"
                  value={dcdbStatus}
                  options={[{ value: 'Working', label: 'Working' }, { value: 'Not Working', label: 'Not Working' }]}
                  onChange={(val) => { setDcdbStatus(val); clearError('dcdbStatus'); }}
                  error={errors.dcdbStatus}
                />
                <FloatingSelect
                  id="rms-status"
                  label="RMS Status (Optional)"
                  placeholder="-- Select --"
                  value={rmsStatus}
                  options={[
                    { value: 'Working', label: 'Working' },
                    { value: 'Not Working', label: 'Not Working' },
                    { value: 'NA', label: 'NA / Not Applicable' },
                    { value: 'Other', label: 'Other' },
                  ]}
                  onChange={setRmsStatus}
                />
              </div>
            </div>

            {/* Section 7: Reminder & Due Date */}
            <div id="sec-reminder" className="resco-section-block">
              <SectionHeader
                num="7"
                total={T}
                title="Reminder & Due Date"
                desc="Specify next periodic visit schedule (auto-defaults to +30 days) and operational notes."
              />
              <div className="resco-form-grid resco-form-grid--2col">
                <FloatingInput
                  id="next-due-date"
                  label="Next Due Date"
                  required
                  type="date"
                  value={nextDueDate}
                  onChange={(val) => {
                    setNextDueDate(val);
                    clearError('next_due_date');
                  }}
                  error={errors.next_due_date}
                />
                <FloatingInput
                  id="reminder-notes"
                  label="Reminder Notes"
                  placeholder="Enter Reminder Notes"
                  value={reminderNotes}
                  onChange={setReminderNotes}
                />
              </div>
            </div>

            {/* Section 8: Acknowledgement */}
            <div id="sec-ack" className="resco-section-block">
              <SectionHeader
                num="8"
                total={T}
                title="Technician/User Acknowledgement"
                desc="Upload digital signature and certify periodic checkup execution."
              />
              <div className="resco-form-grid resco-form-grid--2col">
                <FloatingFileInput
                  id="digital-signature-input"
                  label="Digital Signature Upload"
                  required
                  file={digitalSignature}
                  onChange={(f) => {
                    setDigitalSignature(f);
                    clearError('digitalSignature');
                  }}
                  error={errors.digitalSignature}
                />
                <div>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      className="ax-checkbox"
                      checked={acknowledgement}
                      onChange={(e) => {
                        setAcknowledgement(e.target.checked);
                        clearError('acknowledgement');
                      }}
                    />
                    <span>
                      Acknowledgement Confirmation <Asterisk /> — I confirm all maintenance activity has been completed.
                    </span>
                  </label>
                  <FieldFeedback error={errors.acknowledgement} />
                </div>
                <div className="resco-form-col-span-full">
                  <FloatingTextarea
                    id="general-remarks"
                    label="Remarks"
                    placeholder="Enter Remarks..."
                    value={remarks}
                    rows={3}
                    onChange={setRemarks}
                  />
                </div>
              </div>
            </div>

            {/* Section 9: Raised Complaint */}
            <div id="sec-complaint" className="resco-section-block">
              <SectionHeader
                num="9"
                total={T}
                title="Raised Complaint (Optional)"
                desc="Log warranty defects or damage requiring department resolution."
              />

              <div style={{ marginBottom: 'var(--ax-space-3)' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    className="ax-checkbox"
                    checked={raiseComplaint}
                    onChange={(e) => {
                      setRaiseComplaint(e.target.checked);
                      clearError('complaint');
                      clearError('complaintImage1');
                    }}
                  />
                  <span>Raise Complaint for this Site</span>
                </label>
              </div>

              {raiseComplaint && (
                <div className="resco-form-grid resco-form-grid--2col" style={{ marginTop: 12 }}>
                  <FloatingFileInput
                    id="complaint-img1"
                    label="Complaint Image 1"
                    required
                    file={complaintImage1}
                    onChange={(f) => {
                      setComplaintImage1(f);
                      clearError('complaintImage1');
                    }}
                    error={errors.complaintImage1}
                  />
                  <FloatingFileInput
                    id="complaint-img2"
                    label="Complaint Image 2 (Optional)"
                    file={complaintImage2}
                    onChange={setComplaintImage2}
                  />
                  <div className="resco-form-col-span-full">
                    <FloatingTextarea
                      id="complaint-desc"
                      label="Complaint Description"
                      required
                      placeholder="Describe the complaint in detail..."
                      value={complaintText}
                      rows={3}
                      onChange={(val) => {
                        setComplaintText(val);
                        clearError('complaint');
                      }}
                      error={errors.complaint}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sticky Action Bar */}
        <div className="resco-form-sticky-bar">
          <span className="ax-badge ax-badge--soft ax-badge--primary ax-badge--pill">
            {Object.keys(errors).length > 0
              ? `${Object.keys(errors).length} field(s) require attention`
              : 'RESCO AMC Submission'}
          </span>
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)' }}>
            <button type="button" className="ax-btn ax-btn--secondary" onClick={handleReset} disabled={submitting}>
              <span className="ax-btn__label">Reset Form</span>
            </button>
            <button type="submit" disabled={submitting || noSite} className="ax-btn ax-btn--primary" style={{ minWidth: 200 }}>
              {submitting ? (
                <>
                  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ animation: 'resco-spin 1s linear infinite' }}><path d="M12 3a9 9 0 1 0 9 9" /></svg>
                  <span className="ax-btn__label">Submitting…</span>
                </>
              ) : (
                <>
                  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5l10 -10" /></svg>
                  <span className="ax-btn__label">{noSite ? 'Select Site to Submit' : 'Submit AMC Report'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

/* ── Section Header ── */
function SectionHeader({ num, total, title, desc }: { num: string; total: number; title: string; desc: string }) {
  return (
    <div className="resco-section-header">
      <div className="resco-section-title-wrap">
        <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', alignItems: 'center' }}>
          <span className="ax-badge ax-badge--soft ax-badge--primary ax-badge--pill" style={{ fontWeight: 600 }}>
            Step {num} of {total}
          </span>
          <h3 style={{ fontSize: 'var(--ax-text-base)', fontWeight: 600, margin: 0, color: 'var(--ax-text-strong)' }}>
            {title}
          </h3>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
          {desc}
        </p>
      </div>
    </div>
  );
}

/* ── Read-only Info Item ── */
function InfoItem({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="resco-info-item">
      <span className="resco-info-label">{label}</span>
      <span className="resco-info-value">{value || '—'}</span>
    </div>
  );
}

/* ── Asterisk ── */
const Asterisk = () => <span style={{ color: 'var(--ax-danger-500)', marginLeft: 3 }}>*</span>;

/* ── Field Feedback ── */
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

/* ── Floating Input ── */
function FloatingInput({
  id, label, type = 'text', required, readOnly, disabled, placeholder = ' ', value, maxLength, onChange, error,
}: {
  id: string; label: string; type?: string; required?: boolean; readOnly?: boolean; disabled?: boolean; placeholder?: string; value: string; maxLength?: number; onChange?: (val: string) => void; error?: string;
}) {
  const floated = type === 'date' || type === 'time';
  return (
    <div>
      <div className={`ax-float ${floated ? 'ax-float--date' : ''}`}>
        <input
          id={id}
          type={type}
          step={type === 'number' ? 'any' : undefined}
          readOnly={readOnly}
          disabled={disabled}
          maxLength={maxLength}
          className={`ax-input ax-float__input ${error ? 'is-invalid' : ''}`}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          aria-invalid={Boolean(error)}
          style={readOnly ? { cursor: 'not-allowed', backgroundColor: 'var(--ax-surface-subtle, #f8fafc)' } : undefined}
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

/* ── Floating Select ── */
function FloatingSelect({
  id, label, required, disabled, placeholder = '-- Select --', value, options, onChange, error,
}: {
  id: string; label: string; required?: boolean; disabled?: boolean; placeholder?: string; value: string; options: { value: string; label: string }[]; onChange: (val: string) => void; error?: string;
}) {
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

/* ── Floating Textarea ── */
function FloatingTextarea({
  id, label, required, placeholder = 'Enter Remarks...', value, rows = 3, onChange, error,
}: {
  id: string; label: string; required?: boolean; placeholder?: string; value: string; rows?: number; onChange: (val: string) => void; error?: string;
}) {
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

/* ── Floating File Input (Drag & drop with image preview) ── */
function FloatingFileInput({
  id, label, required, accept = 'image/*', file, onChange, error,
}: {
  id: string; label: string; required?: boolean; accept?: string; file: File | null; onChange: (file: File | null) => void; error?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  useEffect(() => {
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setObjectUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setObjectUrl(null);
  }, [file]);

  return (
    <div className={error ? 'is-invalid' : undefined} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label
        htmlFor={id}
        style={{
          fontSize: '11px',
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
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const f = e.dataTransfer.files?.[0];
          if (f) onChange(f);
        }}
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
          padding: file ? '8px 10px' : '12px 10px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          minHeight: 88,
        }}
      >
        {file ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, textAlign: 'left' }}>
              {objectUrl && (
                <img
                  src={objectUrl}
                  alt={label}
                  style={{ width: 38, height: 38, objectFit: 'cover', borderRadius: 4, border: '1px solid var(--ax-border)', flexShrink: 0 }}
                />
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ax-text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file.name}
                </div>
                <div style={{ fontSize: 10, color: 'var(--ax-text-muted)' }}>
                  {(file.size / 1024).toFixed(0)} KB
                </div>
              </div>
            </div>
            <button
              type="button"
              className="ax-btn ax-btn--ghost ax-btn--xs"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
                if (inputRef.current) inputRef.current.value = '';
              }}
              style={{ color: '#ef4444', flexShrink: 0, padding: '2px 6px' }}
              title="Remove file"
            >
              ✕
            </button>
          </div>
        ) : (
          <>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 4 }}>
              <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
              <path d="M12 12v9" />
              <path d="m8 16 4-4 4 4" />
            </svg>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ax-text-strong, #1e293b)' }}>
              Choose File
            </div>
            <div style={{ fontSize: 10, color: 'var(--ax-text-muted, #64748b)' }}>
              No file chosen
            </div>
          </>
        )}
      </div>

      <FieldFeedback error={error} />
    </div>
  );
}

/* ── Multi File Drop (same drag & drop style, multiple images with thumbnails) ── */
function MultiFileDrop({
  id, label, required, max = 5, disabled, files, onChange, onOverflow, error,
}: {
  id: string; label: string; required?: boolean; max?: number; disabled?: boolean; files: File[]; onChange: (files: File[]) => void; onOverflow?: () => void; error?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const urls = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => urls.forEach((u) => URL.revokeObjectURL(u)), [urls]);

  const addFiles = (incoming: File[]) => {
    const imgs = incoming.filter((f) => f.type.startsWith('image/'));
    if (imgs.length === 0) return;
    const combined = [...files, ...imgs];
    if (combined.length > max) onOverflow?.();
    onChange(combined.slice(0, max));
  };

  const full = files.length >= max;
  const inactive = disabled || full;

  return (
    <div className={error ? 'is-invalid' : undefined} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label
        htmlFor={id}
        style={{
          fontSize: '11px',
          fontWeight: 600,
          color: error ? 'var(--ax-danger-500, #ef4444)' : 'var(--ax-text-strong, #334155)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 4,
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center' }}>
          {label}
          {required && <Asterisk />}
          <span style={{ fontWeight: 400, color: 'var(--ax-text-muted)', marginLeft: 6 }}>(Max {max})</span>
        </span>
        <span style={{ fontWeight: 500, color: full ? 'var(--ax-danger-500, #ef4444)' : 'var(--ax-text-muted)' }}>
          {files.length} / {max}
        </span>
      </label>

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/*"
        multiple
        disabled={inactive}
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files) addFiles(Array.from(e.target.files));
          e.target.value = '';
        }}
      />

      <div
        onClick={() => !inactive && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); if (!inactive) setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (!inactive) addFiles(Array.from(e.dataTransfer.files || []));
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        role="button"
        tabIndex={inactive ? -1 : 0}
        onKeyDown={(e) => {
          if (inactive) return;
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
            : isHovered && !inactive ? '1.5px dashed #94a3b8' : '1.5px dashed #cbd5e1',
          borderRadius: 8,
          background: isDragging
            ? '#eff6ff'
            : error
            ? '#fef2f2'
            : isHovered && !inactive ? '#fbfcfd' : '#ffffff',
          padding: '12px 10px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          cursor: inactive ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.7 : 1,
          transition: 'all 0.2s ease',
          minHeight: 88,
          gap: 8,
        }}
      >
        {files.length === 0 ? (
          <>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
              <path d="M12 12v9" />
              <path d="m8 16 4-4 4 4" />
            </svg>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ax-text-strong, #1e293b)' }}>
              Choose Files or Drag & Drop
            </div>
            <div style={{ fontSize: 10, color: 'var(--ax-text-muted, #64748b)' }}>
              No file chosen
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', width: '100%' }}>
              {files.map((f, i) => (
                <div
                  key={`${f.name}-${i}`}
                  style={{ position: 'relative', width: 64, height: 64, borderRadius: 6, overflow: 'hidden', border: '1px solid var(--ax-border)' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <img src={urls[i]} alt={`${label} ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button
                    type="button"
                    title="Remove photo"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange(files.filter((_, idx) => idx !== i));
                    }}
                    style={{
                      position: 'absolute', top: 2, right: 2, width: 18, height: 18, borderRadius: '50%',
                      background: 'rgba(0,0,0,0.7)', color: '#fff', border: 'none', cursor: 'pointer',
                      fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 10, color: 'var(--ax-text-muted, #64748b)' }}>
              {full ? 'Maximum photos selected' : 'Click or drop to add more'}
            </div>
          </>
        )}
      </div>

      <FieldFeedback error={error} />
    </div>
  );
}

export default UP_AMC_Resco_PendingAMC;