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
.ax-float--readonly .ax-float__input { background: var(--ax-surface-subtle); cursor: default; color: var(--ax-text-strong); font-weight: 500; }
.ax-float--readonly .ax-float__label { top: 0; transform: translateY(-50%); font-size: var(--ax-text-2xs, 11px); font-weight: 500; color: var(--ax-text-muted); }

.ax-float__label { position: absolute; inset-inline-start: 12px; top: 50%; transform: translateY(-50%); margin: 0; padding: 0 4px; font-size: var(--ax-text-sm); color: var(--ax-text-subtle); background: var(--ax-surface-solid); border-radius: var(--ax-radius-xs); pointer-events: none; transition: top var(--ax-motion-fast, 0.15s) var(--ax-ease-standard, ease), font-size var(--ax-motion-fast, 0.15s) var(--ax-ease-standard, ease), color var(--ax-motion-fast, 0.15s) var(--ax-ease-standard, ease); z-index: 2; white-space: nowrap; max-width: calc(100% - 24px); overflow: hidden; text-overflow: ellipsis; }

.ax-float__input:focus + .ax-float__label,
.ax-float__input:not(:placeholder-shown) + .ax-float__label,
.ax-float--select .ax-float__label,
.ax-float--file .ax-float__label { top: 0; transform: translateY(-50%); font-size: var(--ax-text-2xs, 11px); font-weight: 500; color: var(--ax-text-muted); }
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

/* Sticky footer bar */
.up-form-sticky-bar { position: sticky; bottom: var(--ax-space-4); z-index: 30; margin-top: var(--ax-space-6); padding: var(--ax-space-3) var(--ax-space-5); background: var(--ax-surface-solid); border: 1px solid var(--ax-border); border-radius: var(--ax-radius-xl); box-shadow: var(--ax-shadow-lg); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--ax-space-3); backdrop-filter: blur(12px); }

@keyframes up-spin { to { transform: rotate(360deg); } }
`;

// ── Section pill definitions ──
const SECTIONS = [
  { id: 'sec-1', num: '1', title: 'Period & Site' },
  { id: 'sec-2', num: '2', title: 'Site Info' },
  { id: 'sec-3', num: '3', title: 'Beneficiary & Inspection' },
  { id: 'sec-4', num: '4', title: 'Photos' },
  { id: 'sec-5', num: '5', title: 'Complaint' },
];

const MONTH_NAMES = [
  '',
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const formatMonthLabel = (m: string | number) => {
  const num = Number(m);
  if (!isNaN(num) && num >= 1 && num <= 12) {
    return MONTH_NAMES[num];
  }
  return String(m);
};

export interface UpAmcPendingFormProps {
  title: string;
  subtitle: string;
  projectEyebrow: string;
  breadcrumbs: { label: string; href?: string }[];
  viewLink: string;
  viewLabel: string;
  mode: 'resco' | 'ssl' | 'ssl18w' | 'schedule';
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
    photoMode = 'fourImages',
    hasDigitalSignature = false,
    hasJmrReport = false,
  } = props;

  const navigate = useNavigate();

  // Selection states
  const [years, setYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | ''>('');
  const [months, setMonths] = useState<(number | string)[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [sites, setSites] = useState<{ id: number | string; label: string; [key: string]: any }[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');

  // Form inputs
  const [siteDetails, setSiteDetails] = useState<Record<string, any>>({});
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [beneficiaryContact, setBeneficiaryContact] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [meterReading, setMeterReading] = useState('');
  const [nextDueDate, setNextDueDate] = useState('');
  const [visitTime, setVisitTime] = useState(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });
  const [amcDate, setAmcDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [remark, setRemark] = useState('');

  // Complaint
  const [raisedComplaint, setRaisedComplaint] = useState(false);
  const [complaintText, setComplaintText] = useState('');
  const [complaintFile, setComplaintFile] = useState<File | null>(null);

  // Photos
  const [beforePhotos, setBeforePhotos] = useState<File[]>([]);
  const [afterPhotos, setAfterPhotos] = useState<File[]>([]);
  const [image1, setImage1] = useState<File | null>(null);
  const [image2, setImage2] = useState<File | null>(null);
  const [image3, setImage3] = useState<File | null>(null);
  const [image4, setImage4] = useState<File | null>(null);
  const [jmrReport, setJmrReport] = useState<File | null>(null);
  const [digitalSignature, setDigitalSignature] = useState<File | null>(null);

  // States
  const [loading, setLoading] = useState(false);
  const [loadingYears, setLoadingYears] = useState(false);
  const [loadingMonths, setLoadingMonths] = useState(false);
  const [loadingSites, setLoadingSites] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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

  // Load Months or Sites when Year changes
  useEffect(() => {
    if (!selectedYear) return;
    let active = true;

    if (onFetchMonths) {
      // FIX: Clear stale month & sites immediately so effect 2 won't fire with wrong month
      setSelectedMonth('');
      setSites([]);
      setSelectedSiteId('');
      setSiteDetails({});

      setLoadingMonths(true);
      onFetchMonths(Number(selectedYear))
        .then((mList) => {
          if (!active) return;
          setMonths(mList);
          if (mList.length > 0) {
            setSelectedMonth(String(mList[0]));
          } else {
            setSelectedMonth('');
          }
        })
        .catch(() => { if (active) setMonths([]); })
        .finally(() => { if (active) setLoadingMonths(false); });
    } else {
      // No month-based flow — directly fetch sites for the year
      setSites([]);
      setSelectedSiteId('');
      setSiteDetails({});

      setLoadingSites(true);
      onFetchSites(Number(selectedYear))
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
    }
    return () => { active = false; };
  }, [selectedYear, onFetchMonths, onFetchSites]);

  // Load Sites when Month changes (only when onFetchMonths exists)
  useEffect(() => {
    if (!selectedYear || !onFetchMonths) return;
    // FIX: Don't fetch sites until a valid month is actually selected
    if (!selectedMonth) return;

    let active = true;
    setLoadingSites(true);
    onFetchSites(Number(selectedYear), selectedMonth)
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
  }, [selectedYear, selectedMonth, onFetchMonths, onFetchSites]);

  // Load Site Details when selectedSiteId changes
  useEffect(() => {
    if (!selectedSiteId) {
      setSiteDetails({});
      return;
    }
    let active = true;
    onFetchSiteDetails(selectedSiteId, selectedYear ? Number(selectedYear) : undefined, selectedMonth || undefined)
      .then((det) => {
        if (!active || !det) return;
        setSiteDetails(det);
        const bName = det.beneficiary_name || det.beneficiary || det.farmer_name || det.f_farmer_name || det.contact_person || det.contact_name || '';
        const bContact = det.beneficiary_contact || det.contact || det.mobile || det.f_mobile || det.contact_number || det.contact_no || '';
        if (bName) setBeneficiaryName(String(bName));
        if (bContact) setBeneficiaryContact(String(bContact));
        if (det.latitude) setLatitude(String(det.latitude));
        if (det.longitude) setLongitude(String(det.longitude));
      })
      .catch((err) => { console.error('Error fetching site details:', err); });
    return () => { active = false; };
  }, [selectedSiteId, selectedYear, selectedMonth, onFetchSiteDetails]);

  // GPS Auto-detect
  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      setToast({ type: 'error', message: 'Geolocation is not supported by your browser.' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
        setToast({ type: 'success', message: 'Current GPS coordinates detected!' });
      },
      (err) => { setToast({ type: 'error', message: `GPS error: ${err.message}` }); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleReset = () => {
    setBeneficiaryName('');
    setBeneficiaryContact('');
    setLatitude('');
    setLongitude('');
    setMeterReading('');
    setNextDueDate('');
    setVisitTime('');
    setRemark('');
    setRaisedComplaint(false);
    setComplaintText('');
    setComplaintFile(null);
    setBeforePhotos([]);
    setAfterPhotos([]);
    setImage1(null);
    setImage2(null);
    setImage3(null);
    setImage4(null);
    setJmrReport(null);
    setDigitalSignature(null);
    setErrors({});
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!selectedSiteId) errs.site = 'Please select a site';
    if (!beneficiaryName.trim()) errs.beneficiaryName = 'Beneficiary Name is required';
    if (!beneficiaryContact.trim()) {
      errs.beneficiaryContact = 'Contact Number is required';
    } else if (!/^\d{10,15}$/.test(beneficiaryContact.trim())) {
      errs.beneficiaryContact = 'Must be 10 to 15 digits';
    }
    if (photoMode === 'beforeAfter') {
      if (beforePhotos.length === 0) errs.beforePhotos = 'At least 1 Before Cleaning photo is required';
      if (afterPhotos.length === 0) errs.afterPhotos = 'At least 1 After Cleaning photo is required';
    } else {
      if (!image1) errs.image1 = 'Image 1 is required';
    }
    if (raisedComplaint && !complaintText.trim()) {
      errs.complaint = 'Please describe the complaint';
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
        fd.append('report_year', String(selectedYear));
      }
      if (selectedMonth) {
        fd.append('amc_months', String(selectedMonth));
        fd.append('months', String(selectedMonth));
        fd.append('report_month', String(selectedMonth));
        fd.append('month_year', `${String(selectedMonth).padStart(2, '0')}-${selectedYear}`);
      }
      fd.append('beneficiary_name', beneficiaryName.trim());
      fd.append('beneficiary_contact', beneficiaryContact.trim());
      fd.append('amc_beneficiary_contact', beneficiaryContact.trim());
      if (latitude) { fd.append('latitude', latitude); fd.append('amc_latitude', latitude); }
      if (longitude) { fd.append('longitude', longitude); fd.append('amc_longitude', longitude); }
      if (meterReading) fd.append('meter_reading', meterReading);
      if (nextDueDate) fd.append('next_due_date', nextDueDate);
      if (visitTime) fd.append('visit_time', visitTime);
      if (amcDate) fd.append('amc_date', amcDate);
      if (remark) { fd.append('remark', remark); fd.append('amc_remark', remark); fd.append('remarks', remark); }
      if (raisedComplaint) {
        fd.append('raised_complaint', '1');
        fd.append('complaint', complaintText.trim());
        if (complaintFile) { fd.append('file', complaintFile); fd.append('file1', complaintFile); fd.append('complaint_image', complaintFile); }
      } else {
        fd.append('raised_complaint', '0');
      }
      if (photoMode === 'beforeAfter') {
        beforePhotos.forEach((f) => fd.append('before_cleaning_photo[]', f));
        afterPhotos.forEach((f) => fd.append('after_cleaning_photo[]', f));
        if (jmrReport) fd.append('jmr_report', jmrReport);
        if (digitalSignature) fd.append('digital_signature', digitalSignature);
      } else {
        if (image1) fd.append('image1', image1);
        if (image2) fd.append('image2', image2);
        if (image3) fd.append('image3', image3);
        if (image4) fd.append('image4', image4);
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

  const totalSections = 5;

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
                All fields organized inside one card across {SECTIONS.length} dedicated sections.
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
            {/* ── Section 1: Period & Site ── */}
            <div id="sec-1" className="up-section-block">
              <SectionHeader num="1" total={totalSections} title="Select AMC Period & Assigned Site" desc="Select the pending AMC year and month to display your eligible assigned sites" />
              <div className="up-form-grid up-form-grid--3col">
                {/* Year Select */}
                <FloatingSelect
                  id="up-amc-year"
                  label="AMC Year"
                  required
                  placeholder={loadingYears ? 'Loading years…' : '— Select Year —'}
                  value={selectedYear ? String(selectedYear) : ''}
                  options={years.map((y) => ({ value: String(y), label: String(y) }))}
                  disabled={loadingYears}
                  onChange={(v) => setSelectedYear(v ? Number(v) : '')}
                />

                {/* Month Select */}
                {onFetchMonths && (
                  <FloatingSelect
                    id="up-amc-month"
                    label="AMC Month"
                    required
                    placeholder={loadingMonths ? 'Loading months…' : '— Select Month —'}
                    value={selectedMonth}
                    options={months.map((m) => ({ value: String(m), label: formatMonthLabel(m) }))}
                    disabled={loadingMonths || !selectedYear}
                    onChange={(v) => setSelectedMonth(v)}
                  />
                )}

                {/* Site Select */}
                <div className="up-form-col-span-2">
                  <FloatingSelect
                    id="up-amc-site"
                    label="Assigned Site / Beneficiary"
                    required
                    placeholder={
                      loadingSites
                        ? 'Loading sites…'
                        : sites.length === 0
                        ? 'No pending sites found for selected period'
                        : '— Select Site —'
                    }
                    value={selectedSiteId}
                    options={sites.map((s) => ({
                      value: String(s.id),
                      label: s.label || s.site_name || s.farmer_name || s.beneficiary_name || `Site #${s.id}`,
                    }))}
                    disabled={loadingSites || (!selectedMonth && !!onFetchMonths)}
                    onChange={(v) => setSelectedSiteId(v)}
                    error={errors.site}
                  />
                </div>
              </div>
            </div>

            <hr className="up-section-divider" />

            {/* ── Section 2: Site Information (Read-only) ── */}
            <div id="sec-2" className="up-section-block">
              <SectionHeader num="2" total={totalSections} title="Site & Installation Details" desc="Auto-populated from system records for the selected site (Read-only)." />
              <div className="up-form-grid up-form-grid--3col">
                <FloatingInput id="up-ro-state" label="State" readOnly value={siteDetails.state || 'UP'} />
                <FloatingInput id="up-ro-district" label="District" readOnly value={siteDetails.district || siteDetails.f_district || siteDetails.installation_dsitrict || '—'} />
                <FloatingInput id="up-ro-sitename" label="Site Name" readOnly value={siteDetails.site_name || siteDetails.name || '—'} />
                <FloatingInput id="up-ro-location" label="Location" readOnly value={siteDetails.location || siteDetails.address || siteDetails.village || siteDetails.f_village || '—'} />
                <FloatingInput id="up-ro-ca" label="CA / Application No" readOnly value={siteDetails.ca_no || siteDetails.saral_id || siteDetails.application_no || '—'} />
                <FloatingInput id="up-ro-capacity" label="Sanction Load (kVA / kW)" readOnly value={siteDetails.sanction_load || siteDetails.pump_capacity || siteDetails.plant_capacity || siteDetails.volume || '—'} />
                <FloatingInput id="up-ro-plantsc" label="Plan SC (kVA / kW)" readOnly value={siteDetails.plant_sc || siteDetails.plan_sc || siteDetails.capacity || '—'} />
                <FloatingInput id="up-ro-dept" label="Department / Block" readOnly value={siteDetails.dept_name || siteDetails.department || siteDetails.block || '—'} />
                <FloatingInput id="up-ro-wo" label="Work Order / Lot No" readOnly value={siteDetails.wo_no || siteDetails.work_order_no || siteDetails.lot_no || '—'} />
              </div>
            </div>

            <hr className="up-section-divider" />

            {/* ── Section 3: Beneficiary & Inspection ── */}
            <div id="sec-3" className="up-section-block">
              <SectionHeader
                num="3"
                total={totalSections}
                title="Beneficiary & Inspection Details"
                desc="Enter contact details, GPS coordinates, and inspection metrics"
                action={
                  <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={handleDetectGps}>
                    <span className="ax-btn__label">📍 Detect Current GPS</span>
                  </button>
                }
              />
              <div className="up-form-grid up-form-grid--3col">
                <FloatingInput
                  id="up-beneficiary-name"
                  label="Beneficiary Name"
                  required
                  placeholder="Enter beneficiary name"
                  value={beneficiaryName}
                  onChange={(v) => setBeneficiaryName(v)}
                  error={errors.beneficiaryName}
                />
                <FloatingInput
                  id="up-beneficiary-contact"
                  label="Beneficiary Contact Number"
                  type="tel"
                  required
                  placeholder="Enter contact number"
                  value={beneficiaryContact}
                  onChange={(v) => setBeneficiaryContact(v)}
                  error={errors.beneficiaryContact}
                />
                <FloatingInput
                  id="up-latitude"
                  label="Latitude"
                  type="number"
                  placeholder="e.g. 26.8467"
                  value={latitude}
                  onChange={(v) => setLatitude(v)}
                />
                <FloatingInput
                  id="up-longitude"
                  label="Longitude"
                  type="number"
                  placeholder="e.g. 80.9462"
                  value={longitude}
                  onChange={(v) => setLongitude(v)}
                />

                {mode === 'resco' && (
                  <>
                    <FloatingInput
                      id="up-meter-reading"
                      label="Meter Reading (kWh)"
                      type="number"
                      placeholder="Enter meter reading"
                      value={meterReading}
                      onChange={(v) => setMeterReading(v)}
                    />
                    <FloatingInput
                      id="up-next-due"
                      label="Next Due Date"
                      type="date"
                      value={nextDueDate}
                      onChange={(v) => setNextDueDate(v)}
                    />
                    <FloatingInput
                      id="up-visit-time"
                      label="Visit Time"
                      type="time"
                      value={visitTime}
                      onChange={(v) => setVisitTime(v)}
                    />
                  </>
                )}

                <FloatingInput
                  id="up-amc-date"
                  label="AMC Date"
                  type="date"
                  value={amcDate}
                  onChange={(v) => setAmcDate(v)}
                />

                <div className="up-form-col-span-full">
                  <FloatingTextarea
                    id="up-remark"
                    label="Maintenance Remark (optional)"
                    placeholder="Describe maintenance / cleaning work completed…"
                    value={remark}
                    onChange={(v) => setRemark(v)}
                  />
                </div>
              </div>
            </div>

            <hr className="up-section-divider" />

            {/* ── Section 4: Photos ── */}
            <div id="sec-4" className="up-section-block">
              <SectionHeader num="4" total={totalSections} title="Cleaning & Inspection Photos" desc="Upload geotagged photos of the site maintenance and equipment" />

              {photoMode === 'beforeAfter' ? (
                <div className="up-form-grid up-form-grid--3col">
                  <FloatingFileInput
                    id="up-before-photos"
                    label="Before Cleaning Photos (Max 5)"
                    required
                    accept="image/*"
                    multiple
                    files={beforePhotos}
                    onChange={(fileList) => setBeforePhotos(fileList.slice(0, 5))}
                    error={errors.beforePhotos}
                  />
                  <FloatingFileInput
                    id="up-after-photos"
                    label="After Cleaning Photos (Max 5)"
                    required
                    accept="image/*"
                    multiple
                    files={afterPhotos}
                    onChange={(fileList) => setAfterPhotos(fileList.slice(0, 5))}
                    error={errors.afterPhotos}
                  />
                  {hasJmrReport && (
                    <FloatingFileInputSingle
                      id="up-jmr-report"
                      label="JMR Report (PDF/Image)"
                      accept="image/*,.pdf"
                      file={jmrReport}
                      onChange={(f) => setJmrReport(f)}
                    />
                  )}
                  {hasDigitalSignature && (
                    <FloatingFileInputSingle
                      id="up-digital-sig"
                      label="Digital Signature"
                      accept="image/*"
                      file={digitalSignature}
                      onChange={(f) => setDigitalSignature(f)}
                    />
                  )}
                </div>
              ) : (
                <div className="up-form-grid up-form-grid--4col">
                  <FloatingFileInputSingle
                    id="up-image1"
                    label="Photo 1 (Mandatory)"
                    required
                    accept="image/*"
                    file={image1}
                    onChange={(f) => setImage1(f)}
                    error={errors.image1}
                  />
                  <FloatingFileInputSingle
                    id="up-image2"
                    label="Photo 2 (Optional)"
                    accept="image/*"
                    file={image2}
                    onChange={(f) => setImage2(f)}
                  />
                  <FloatingFileInputSingle
                    id="up-image3"
                    label="Photo 3 (Optional)"
                    accept="image/*"
                    file={image3}
                    onChange={(f) => setImage3(f)}
                  />
                  <FloatingFileInputSingle
                    id="up-image4"
                    label="Photo 4 (Optional)"
                    accept="image/*"
                    file={image4}
                    onChange={(f) => setImage4(f)}
                  />
                </div>
              )}
            </div>

            <hr className="up-section-divider" />

            {/* ── Section 5: Complaint (Optional) ── */}
            <div id="sec-5" className="up-section-block">
              <SectionHeader num="5" total={totalSections} title="Complaint Raise (Optional)" desc="If any breakdown or issue was observed during AMC, raise a complaint directly here" />

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                  <input
                    type="checkbox"
                    checked={raisedComplaint}
                    onChange={(e) => setRaisedComplaint(e.target.checked)}
                  />
                  <span><b>Raise Complaint for this Site</b> (Sends notification to maintenance desk)</span>
                </label>
              </div>

              {raisedComplaint && (
                <div className="up-form-grid up-form-grid--3col">
                  <div className="up-form-col-span-full" style={{ maxWidth: 700 }}>
                    <FloatingTextarea
                      id="up-complaint-desc"
                      label="Complaint Description"
                      required
                      placeholder="Detail the defect, inverter fault, broken panel, missing cable, etc.…"
                      value={complaintText}
                      onChange={(v) => setComplaintText(v)}
                      error={errors.complaint}
                    />
                  </div>
                  <FloatingFileInputSingle
                    id="up-complaint-file"
                    label="Complaint Attachment / Photo"
                    accept="image/*,.pdf"
                    file={complaintFile}
                    onChange={(f) => setComplaintFile(f)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Sticky Action Footer ── */}
        <div className="up-form-sticky-bar">
          <span className="ax-badge ax-badge--soft ax-badge--primary ax-badge--pill">
            AMC Report
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
 * Reusable Floating Components (Goa-style)
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

/* ── Drag & drop single file input (Goa style) ── */
interface FloatingFileInputSingleProps {
  id: string;
  label: string;
  required?: boolean;
  accept?: string;
  file: File | null;
  onChange: (file: File | null) => void;
  error?: string;
}

function FloatingFileInputSingle({ id, label, required, accept, file, onChange, error }: FloatingFileInputSingleProps) {
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
    if (chosen) onChange(chosen);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
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
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputRef.current?.click(); }
        }}
        style={{
          border: isDragging ? '1.5px dashed #2563eb' : error ? '1.5px dashed var(--ax-danger-500, #ef4444)' : isHovered ? '1.5px dashed #94a3b8' : '1.5px dashed #cbd5e1',
          borderRadius: 8,
          background: isDragging ? '#eff6ff' : error ? '#fef2f2' : isHovered ? '#fbfcfd' : '#ffffff',
          padding: file ? '12px 16px' : '22px 16px',
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
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
                <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', marginTop: 2 }}>{(file.size / 1024).toFixed(0)} KB · Ready to upload</div>
              </div>
            </div>
            <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" onClick={handleClear} style={{ color: '#ef4444', flexShrink: 0 }} title="Remove file">Remove</button>
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
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong, #1e293b)' }}>Click to upload or drag & drop</div>
            <div style={{ fontSize: 11, color: 'var(--ax-text-muted, #64748b)', marginTop: 3 }}>JPG, PNG or WEBP up to 5MB</div>
          </>
        )}
      </div>
      <FieldFeedback error={error} />
    </div>
  );
}

/* ── Drag & drop multi-file input (for before/after photos) ── */
interface FloatingFileInputProps {
  id: string;
  label: string;
  required?: boolean;
  accept?: string;
  multiple?: boolean;
  files: File[];
  onChange: (files: File[]) => void;
  error?: string;
}

function FloatingFileInput({ id, label, required, accept, multiple, files: selectedFiles, onChange, error }: FloatingFileInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const chosen = Array.from(e.dataTransfer.files || []);
    if (chosen.length > 0) onChange(chosen);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
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
        multiple={multiple}
        style={{ display: 'none' }}
        onChange={(e) => {
          const fl = Array.from(e.target.files || []);
          onChange(fl);
        }}
      />

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputRef.current?.click(); }
        }}
        style={{
          border: isDragging ? '1.5px dashed #2563eb' : error ? '1.5px dashed var(--ax-danger-500, #ef4444)' : isHovered ? '1.5px dashed #94a3b8' : '1.5px dashed #cbd5e1',
          borderRadius: 8,
          background: isDragging ? '#eff6ff' : error ? '#fef2f2' : isHovered ? '#fbfcfd' : '#ffffff',
          padding: selectedFiles.length > 0 ? '12px 16px' : '22px 16px',
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
        {selectedFiles.length > 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, textAlign: 'left' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong)' }}>{selectedFiles.length} file(s) selected</div>
                <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', marginTop: 2 }}>Click to change · Ready to upload</div>
              </div>
            </div>
            <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" onClick={handleClear} style={{ color: '#ef4444', flexShrink: 0 }} title="Remove files">Remove</button>
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
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong, #1e293b)' }}>Click to upload or drag & drop</div>
            <div style={{ fontSize: 11, color: 'var(--ax-text-muted, #64748b)', marginTop: 3 }}>Select multiple images up to 5MB each</div>
          </>
        )}
      </div>
      <FieldFeedback error={error} />
    </div>
  );
}