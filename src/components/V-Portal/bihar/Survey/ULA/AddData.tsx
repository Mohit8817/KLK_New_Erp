import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { biharUlaSurveyService } from '../../bihar-services';

// CSS for Unified Single-Card Layout with Floating Labels & Section Dividers (same as Jammu form)
const SINGLE_CARD_FORM_CSS = `
.ula-single-card-form .ax-card {
  border: 1px solid var(--ax-border);
  border-radius: var(--ax-radius-xl);
  background: var(--ax-surface-solid);
  box-shadow: var(--ax-shadow-sm);
  overflow: hidden;
}
.ula-single-card-form .ax-card__header {
  padding: var(--ax-space-5) var(--ax-space-6);
  border-bottom: 1px solid var(--ax-border-subtle);
  background: var(--ax-surface-subtle);
  display: flex;
  flex-direction: column;
  gap: var(--ax-space-4);
}
.ula-single-card-form .ax-card__body { padding: var(--ax-space-6); }

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
.ax-float--select .ax-float__label,
.ax-float--file .ax-float__label {
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
.ax-float__input.is-invalid + .ax-float__label,
.ax-float--file.is-invalid .ax-float__label { color: var(--ax-danger-500) !important; }
.ax-float__input.is-valid { border-color: var(--ax-success-500) !important; }
.ax-float__input.is-valid:focus { box-shadow: 0 0 0 3px color-mix(in srgb, var(--ax-success-500) 24%, transparent) !important; }
.ax-float__input.is-valid + .ax-float__label,
.ax-float--file.is-valid .ax-float__label { color: var(--ax-success-500) !important; }

/* Textarea */
.ax-float--area .ax-float__input { height: auto; min-height: 84px; padding-top: 18px; resize: vertical; }
.ax-float--area .ax-float__label { top: 18px; transform: none; }
.ax-float--area .ax-float__input:focus + .ax-float__label,
.ax-float--area .ax-float__input:not(:placeholder-shown) + .ax-float__label {
  top: 0; transform: translateY(-50%);
}

/* File upload */
.ax-float--file .ax-file-box {
  display: flex; align-items: center; justify-content: space-between;
  gap: var(--ax-space-3);
  height: 46px;
  padding: 6px 12px;
  background: var(--ax-surface-solid);
  border: 1px solid var(--ax-border);
  border-radius: var(--ax-radius-md);
  cursor: pointer;
  transition: all var(--ax-motion-fast) var(--ax-ease-standard);
}
.ax-float--file .ax-file-box:hover { border-color: var(--ax-border-strong); background: var(--ax-surface-subtle); }
.ax-float--file.is-invalid .ax-file-box { border-color: var(--ax-danger-500) !important; }
.ax-float--file.is-valid .ax-file-box { border-color: var(--ax-success-500) !important; }

/* Feedback */
.ax-field-feedback {
  display: flex; align-items: center; gap: 4px;
  margin-top: 4px;
  font-size: var(--ax-text-2xs);
  min-height: 16px;
}
.ax-field-feedback--error { color: var(--ax-danger-500); }
.ax-field-feedback--success { color: var(--ax-success-500); }
.ax-field-feedback--hint { color: var(--ax-text-muted); }

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

const GENDERS = ['Male', 'Female', 'Other'];

type FileKey = 'electricity_bill_photo' | 'consent_form_photo' | 'aadhar_card_photo';

interface FieldStatusProps {
  className: string;
  isValid: boolean;
  isInvalid: boolean;
}

export function Bihar_Survey_ULA_AddData() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');


  const [initialLoading, setInitialLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [geoError, setGeoError] = useState('');
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  // Dropdown options
  const [districts, setDistricts] = useState<string[]>([]);
  const [blocks, setBlocks] = useState<string[]>([]);
  const [panchayats, setPanchayats] = useState<string[]>([]);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [loadingPanchayats, setLoadingPanchayats] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    district: '',
    block: '',
    panchayat: '',
    village: '',
    address: '',
    consumer_name: '',
    gender: 'Male',
    contact_no: '',
    aadhar_no: '',
    ca_number: '',
    feasible_status: '1', // '1' = Feasible, '0' = Not Feasible
    smart_meter: '0', // '1' = Yes, '0' = No
    smart_meter_no: '',
    smart_meter_functional: '1', // '1' = Yes, '0' = No
    latitude: '',
    longitude: '',
    remarks: '',
  });

  // Photo files
  const [files, setFiles] = useState<Record<FileKey, File | null>>({
    electricity_bill_photo: null,
    consent_form_photo: null,
    aadhar_card_photo: null,
  });

  // Existing photo URLs for edit mode
  const [existingPhotos, setExistingPhotos] = useState<{
    electricity_bill_photo?: string | null;
    consent_form_photo?: string | null;
    aadhar_card_photo?: string | null;
  }>({});

  const isFeasible = formData.feasible_status === '1';

  // 1. Initial Load: Districts & Edit record if present
  useEffect(() => {
    const init = async () => {
      setInitialLoading(true);
      setErrorMsg('');
      try {
        const distList = await biharUlaSurveyService.getDistricts();
        setDistricts(distList);

        if (editId) {
          const { survey } = await biharUlaSurveyService.getSurveyForEdit(editId);
          if (survey) {
            setFormData({
              district: survey.district || '',
              block: survey.block || '',
              panchayat: survey.panchayat || '',
              village: survey.village || '',
              address: survey.address || '',
              consumer_name: survey.consumer_name || '',
              gender: survey.gender || 'Male',
              contact_no: survey.contact_no || '',
              aadhar_no: survey.aadhar_no || '',
              ca_number: survey.ca_number || '',
              feasible_status: String(survey.feasible_status ?? 1),
              smart_meter: String(survey.smart_meter ?? 0),
              smart_meter_no: survey.smart_meter_no || '',
              smart_meter_functional: String(survey.smart_meter_functional ?? 1),
              latitude: survey.latitude ? String(survey.latitude) : '',
              longitude: survey.longitude ? String(survey.longitude) : '',
              remarks: survey.remarks || '',
            });

            setExistingPhotos({
              electricity_bill_photo: survey.electricity_bill_photo,
              consent_form_photo: survey.consent_form_photo,
              aadhar_card_photo: survey.aadhar_card_photo,
            });

            // Load blocks & panchayats for existing record
            if (survey.district) {
              const bList = await biharUlaSurveyService.getBlocks(survey.district);
              setBlocks(bList);
              if (survey.block) {
                const pList = await biharUlaSurveyService.getPanchayats(survey.district, survey.block);
                setPanchayats(pList);
              }
            }
          }
        } else {
          // Auto fetch coordinates on new survey
          detectCoordinates();
        }
      } catch (err: any) {
        console.error('[ULA Survey] Init failed:', err);
        setErrorMsg(err?.message || 'Failed to initialize survey form');
      } finally {
        setInitialLoading(false);
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  // Geolocation detector
  const detectCoordinates = () => {
    setGeoError('');
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
      },
      (_err) => {
        setGeoError(
          'Location permission denied. Please allow location access in your browser/site settings, then retry — or continue and enter address manually.'
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  /* ───────── Validation ───────── */
  type FormKey = keyof typeof formData;

  const validateField = (
    name: string,
    value: unknown,
    ctx: { feasible: boolean; smartMeter: string } = { feasible: isFeasible, smartMeter: formData.smart_meter }
  ): string => {
    const str = String(value ?? '').trim();
    switch (name) {
      case 'district':
        return str ? '' : 'Please select a District.';
      case 'block':
        return str ? '' : 'Please select a Block.';
      case 'panchayat':
        return str ? '' : 'Please select a Panchayat.';
      case 'village':
        return str ? '' : 'Village is required.';
      case 'address':
        return str ? '' : 'Address is required.';
      case 'consumer_name':
        return str ? '' : 'Consumer name is required.';
      case 'contact_no':
        return /^\d{10}$/.test(str) ? '' : 'Contact number must be exactly 10 digits.';
      case 'aadhar_no':
        return !str || /^\d{12}$/.test(str) ? '' : 'Aadhaar number must be exactly 12 digits.';
      case 'ca_number':
        return str ? '' : 'CA Number is required.';
      case 'smart_meter_no':
        return ctx.feasible && ctx.smartMeter === '1' && !str ? 'Smart Meter Number is required when Smart Meter is Yes.' : '';
      case 'remarks':
        return !ctx.feasible && !str ? 'Remarks are required when Feasible Status is Not Feasible.' : '';
      default:
        return '';
    }
  };

  const validateFile = (name: FileKey, file: File | null, feasible: boolean): string => {
    if (!feasible || editId) return '';
    if (file) return '';
    const label =
      name === 'electricity_bill_photo' ? 'Electricity Bill Photo' : name === 'consent_form_photo' ? 'Consent Form Photo' : 'Aadhaar Card Photo';
    return `${label} is required when Feasible Status is Yes.`;
  };

  const handleChange = (name: FormKey, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    const nextCtx = {
      feasible: name === 'feasible_status' ? value === '1' : isFeasible,
      smartMeter: name === 'smart_meter' ? value : formData.smart_meter,
    };
    setErrors((prev) => {
      const next = { ...prev, [name]: validateField(name, value, nextCtx) };
      // Re-validate dependent fields when toggles change
      if (name === 'feasible_status' || name === 'smart_meter') {
        next.remarks = '';
        next.smart_meter_no = '';
        (['electricity_bill_photo', 'consent_form_photo', 'aadhar_card_photo'] as FileKey[]).forEach((k) => {
          next[k] = '';
        });
      }
      return next;
    });
  };

  const handleBlur = (name: string) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleFileChange = (name: FileKey, file: File | null) => {
    if (file && file.size > 2 * 1024 * 1024) {
      alert('File size exceeds 2 MB limit.');
      return;
    }
    setFiles((prev) => ({ ...prev, [name]: file }));
    setErrors((prev) => ({ ...prev, [name]: validateFile(name, file, isFeasible) }));
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const getFieldStatus = (name: string, value: unknown): FieldStatusProps => {
    const isFieldTouched = touched[name] || submitted;
    if (!isFieldTouched) return { className: '', isValid: false, isInvalid: false };
    if (errors[name]) return { className: 'is-invalid', isValid: false, isInvalid: true };
    if (value !== null && value !== undefined && String(value).trim() !== '') {
      return { className: 'is-valid', isValid: true, isInvalid: false };
    }
    return { className: '', isValid: false, isInvalid: false };
  };

  const fieldStatus = (name: FormKey) => getFieldStatus(name, formData[name]);
  const fileStatus = (name: FileKey) => getFieldStatus(name, files[name] || existingPhotos[name]);

  // Handle District change -> fetch blocks
  const handleDistrictChange = async (dist: string) => {
    setFormData((prev) => ({ ...prev, district: dist, block: '', panchayat: '' }));
    setErrors((prev) => ({ ...prev, district: validateField('district', dist), block: '', panchayat: '' }));
    setBlocks([]);
    setPanchayats([]);
    if (!dist) return;

    setLoadingBlocks(true);
    try {
      const bList = await biharUlaSurveyService.getBlocks(dist);
      setBlocks(bList);
    } catch (err) {
      console.error('[ULA Survey] Error fetching blocks:', err);
    } finally {
      setLoadingBlocks(false);
    }
  };

  // Handle Block change -> fetch panchayats
  const handleBlockChange = async (blk: string) => {
    setFormData((prev) => ({ ...prev, block: blk, panchayat: '' }));
    setErrors((prev) => ({ ...prev, block: validateField('block', blk), panchayat: '' }));
    setPanchayats([]);
    if (!blk || !formData.district) return;

    setLoadingPanchayats(true);
    try {
      const pList = await biharUlaSurveyService.getPanchayats(formData.district, blk);
      setPanchayats(pList);
    } catch (err) {
      console.error('[ULA Survey] Error fetching panchayats:', err);
    } finally {
      setLoadingPanchayats(false);
    }
  };

  // Required-field list for current state (drives completion badge + submit validation)
  const requiredKeys: FormKey[] = [
    'district',
    'block',
    'panchayat',
    'village',
    'address',
    'consumer_name',
    'contact_no',
    'ca_number',
    ...(isFeasible ? (formData.smart_meter === '1' ? (['smart_meter_no'] as FormKey[]) : []) : (['remarks'] as FormKey[])),
  ];
  const requiredFileKeys: FileKey[] = isFeasible && !editId ? ['electricity_bill_photo', 'consent_form_photo', 'aadhar_card_photo'] : [];

  const totalRequired = requiredKeys.length + requiredFileKeys.length;
  const completedRequired =
    requiredKeys.filter((k) => String(formData[k] ?? '').trim() !== '').length +
    requiredFileKeys.filter((k) => !!files[k]).length;
  const progressPercent = totalRequired ? Math.round((completedRequired / totalRequired) * 100) : 100;

  // Form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setSubmitted(true);

    const newErrors: Record<string, string> = {};
    let firstMessage = '';

    [...requiredKeys, 'aadhar_no' as FormKey].forEach((k) => {
      const err = validateField(k, formData[k]);
      if (err) {
        newErrors[k] = err;
        if (!firstMessage) firstMessage = err;
      }
    });
    requiredFileKeys.forEach((k) => {
      const err = validateFile(k, files[k], isFeasible);
      if (err) {
        newErrors[k] = err;
        if (!firstMessage) firstMessage = err;
      }
    });

    setErrors(newErrors);

    if (firstMessage) {
      setErrorMsg(firstMessage);
      setTimeout(() => {
        const firstErr = document.querySelector('.ula-single-card-form .is-invalid');
        if (firstErr) {
          firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
          (firstErr as HTMLElement).focus?.();
        }
      }, 50);
      return;
    }

    const payload = new FormData();
    if (editId) {
      payload.append('id', editId);
    }
    payload.append('district', formData.district);
    payload.append('block', formData.block);
    payload.append('panchayat', formData.panchayat);
    payload.append('village', formData.village);
    payload.append('address', formData.address);
    payload.append('consumer_name', formData.consumer_name);
    payload.append('gender', formData.gender);
    payload.append('contact_no', formData.contact_no);
    if (formData.aadhar_no.trim()) {
      payload.append('aadhar_no', formData.aadhar_no);
    }
    payload.append('ca_number', formData.ca_number);
    payload.append('feasible_status', formData.feasible_status);

    if (formData.latitude) payload.append('latitude', formData.latitude);
    if (formData.longitude) payload.append('longitude', formData.longitude);

    if (isFeasible) {
      payload.append('smart_meter', formData.smart_meter);
      if (formData.smart_meter === '1') {
        payload.append('smart_meter_no', formData.smart_meter_no);
        payload.append('smart_meter_functional', formData.smart_meter_functional);
      }
      if (files.electricity_bill_photo) {
        payload.append('electricity_bill_photo', files.electricity_bill_photo);
      }
      if (files.consent_form_photo) {
        payload.append('consent_form_photo', files.consent_form_photo);
      }
      if (files.aadhar_card_photo) {
        payload.append('aadhar_card_photo', files.aadhar_card_photo);
      }
      if (formData.remarks.trim()) {
        payload.append('remarks', formData.remarks);
      }
    } else {
      payload.append('remarks', formData.remarks);
    }

    setSaving(true);
    try {
      if (editId) {
        const resp = await biharUlaSurveyService.updateSurvey(payload);
        setSuccessMsg(resp.message || 'ULA Survey updated successfully.');
      } else {
        const resp = await biharUlaSurveyService.storeSurvey(payload);
        setSuccessMsg(resp.message || 'ULA Survey saved successfully.');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => {
        navigate('/v/bihar/ula-surveys/view');
      }, 1500);
    } catch (err: any) {
      console.error('[ULA Survey] Submit error:', err);
      setErrorMsg(err?.message || 'Failed to save survey. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const errorCount = Object.keys(errors).filter((k) => errors[k]).length;

  return (
    <div className="ax-page ula-single-card-form">
      <style>{SINGLE_CARD_FORM_CSS}</style>

      <PageHead
        title={editId ? `Edit Bihar ULA Survey (#${editId})` : 'Bihar ULA Survey Details'}
        subtitle="ULA solar rooftop survey entry form"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Bihar' },
          { label: 'Survey' },
          { label: 'ULA', href: '/v/bihar/ula-surveys/view' },
          { label: editId ? 'Edit' : 'Add Survey' },
        ]}
        actions={
          <Link to="/v/bihar/ula-surveys/view" className="ax-btn ax-btn--secondary ax-btn--pill">
            <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12l14 0" />
              <path d="M5 12l6 6" />
              <path d="M5 12l6 -6" />
            </svg>
            <span className="ax-btn__label">View All Surveys</span>
          </Link>
        }
      />

      {/* Success Banner */}
      {successMsg && (
        <div className="ax-alert ax-alert--success" role="status" style={{ marginBottom: 'var(--ax-space-6)' }}>
          <span className="ax-alert__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5l10 -10" /></svg>
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
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4" /><path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0" /><path d="M12 16h.01" /></svg>
          </span>
          <div className="ax-alert__content">
            <h4 className="ax-alert__title" style={{ fontWeight: 600 }}>{errorMsg}</h4>
            {submitted && errorCount > 1 && (
              <p className="ax-alert__message" style={{ margin: '4px 0 0' }}>
                {errorCount} fields need attention before this survey can be saved.
              </p>
            )}
          </div>
        </div>
      )}

      {initialLoading ? (
        <div className="ax-card" style={{ padding: 'var(--ax-space-10)', textAlign: 'center' }}>
          <span className="ax-spinner" style={{ width: 28, height: 28, margin: '0 auto var(--ax-space-3)' }} />
          <p style={{ color: 'var(--ax-text-muted)' }}>Loading survey data…</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <div className="ax-card">
            {/* Card Header with Title and Section Pills */}
            <div className="ax-card__header">
              <div className="ax-cluster" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--ax-space-3)' }}>
                <div>
               
                  <h2 className="ax-card__title" style={{ margin: 0 }}>
                    {editId ? 'Edit Bihar ULA Survey' : 'Add Bihar ULA Survey'}
                  </h2>
                  <p className="ax-card__subtitle" style={{ margin: '4px 0 0' }}>
                    Location, customer and feasibility details organized in one main card.
                  </p>
                </div>
              </div>

              <div className="ula-section-pills" role="navigation" aria-label="ump to section">
                {[
                  { id: 'ula-sec-1', num: '1', title: 'Location Details' },
                  { id: 'ula-sec-2', num: '2', title: 'Customer Details' },
                  { id: 'ula-sec-3', num: '3', title: isFeasible ? 'Meter & Documents' : 'Non-Feasibility' },
                ].map((s) => (
                  <button key={s.id} type="button" onClick={() => scrollToSection(s.id)} className="ula-section-pill-btn">
                    <span className="pill-num">{s.num}</span>
                    <span>{s.title}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="ax-card__body">
              {/* ========== Section 1: Location Details ========== */}
              <div id="ula-sec-1" className="ula-section-block">
                <SectionHeader
                  num="1"
                  total="3"
                  title="Location Details"
                  subtitle="Select district, block, panchayat, and geographic position."
                />

                <div className="ula-form-grid ula-form-grid--3col">
                  <FloatingSelect
                    id="ula-district"
                    label="District"
                    required
                    placeholder="Select District"
                    value={formData.district}
                    options={districts}
                    onChange={handleDistrictChange}
                    onBlur={() => handleBlur('district')}
                    status={fieldStatus('district')}
                    error={errors.district}
                  />

                  <FloatingSelect
                    id="ula-block"
                    label={loadingBlocks ? 'Block (Loading…)' : 'Block'}
                    required
                    placeholder={formData.district ? 'Select Block' : 'Select District First'}
                    value={formData.block}
                    options={blocks}
                    disabled={!formData.district || loadingBlocks}
                    onChange={handleBlockChange}
                    onBlur={() => handleBlur('block')}
                    status={fieldStatus('block')}
                    error={errors.block}
                  />

                  <FloatingSelect
                    id="ula-panchayat"
                    label={loadingPanchayats ? 'Panchayat (Loading…)' : 'Panchayat'}
                    required
                    placeholder={formData.block ? 'Select Panchayat' : 'Select Block First'}
                    value={formData.panchayat}
                    options={panchayats}
                    disabled={!formData.block || loadingPanchayats}
                    onChange={(val) => handleChange('panchayat', val)}
                    onBlur={() => handleBlur('panchayat')}
                    status={fieldStatus('panchayat')}
                    error={errors.panchayat}
                  />

                  <div className="ula-form-col-span-full">
                    <FloatingInput
                      id="ula-village"
                      label="Village"
                      required
                      placeholder="Enter village name"
                      maxLength={255}
                      value={formData.village}
                      onChange={(val) => handleChange('village', val)}
                      onBlur={() => handleBlur('village')}
                      status={fieldStatus('village')}
                      error={errors.village}
                    />
                  </div>

                  <div className="ula-form-col-span-full">
                    <FloatingTextarea
                      id="ula-address"
                      label="Address"
                      required
                      rows={2}
                      placeholder="Enter full address / ward details"
                      value={formData.address}
                      onChange={(val) => handleChange('address', val)}
                      onBlur={() => handleBlur('address')}
                      status={fieldStatus('address')}
                      error={errors.address}
                    />
                  </div>

                  <FloatingInput
                    id="ula-latitude"
                    label="Latitude"
                    placeholder="e.g. 26.120000"
                    value={formData.latitude}
                    onChange={(val) => handleChange('latitude', val)}
                    onBlur={() => handleBlur('latitude')}
                    status={fieldStatus('latitude')}
                  />

                  <FloatingInput
                    id="ula-longitude"
                    label="Longitude"
                    placeholder="e.g. 85.360000"
                    value={formData.longitude}
                    onChange={(val) => handleChange('longitude', val)}
                    onBlur={() => handleBlur('longitude')}
                    status={fieldStatus('longitude')}
                  />

                  <div>
                    <button
                      type="button"
                      className="ax-btn ax-btn--secondary"
                      onClick={detectCoordinates}
                      style={{ width: '100%', height: 46 }}
                    >
                      <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
                        <path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0" />
                      </svg>
                      <span className="ax-btn__label">Auto Detect Location</span>
                    </button>
                  </div>
                </div>

                {geoError && (
                  <div
                    className="ax-alert ax-alert--warning"
                    role="alert"
                    style={{ marginTop: 'var(--ax-space-3)', fontSize: 'var(--ax-text-xs)' }}
                  >
                    <div className="ax-alert__content">
                      <p className="ax-alert__message" style={{ margin: 0 }}>{geoError}</p>
                    </div>
                  </div>
                )}
              </div>

              <hr className="ula-section-divider" />

              {/* ========== Section 2: Customer Details ========== */}
              <div id="ula-sec-2" className="ula-section-block">
                <SectionHeader
                  num="2"
                  total="3"
                  title="Customer Details"
                  subtitle="Consumer information, identifier numbers, and feasibility."
                />

                <div className="ula-form-grid ula-form-grid--3col">
                  <FloatingInput
                    id="ula-consumer-name"
                    label="Consumer Name"
                    required
                    placeholder="Enter consumer name"
                    value={formData.consumer_name}
                    onChange={(val) => handleChange('consumer_name', val)}
                    onBlur={() => handleBlur('consumer_name')}
                    status={fieldStatus('consumer_name')}
                    error={errors.consumer_name}
                  />

                  <FloatingSelect
                    id="ula-gender"
                    label="Gender"
                    required
                    placeholder="-- Select --"
                    value={formData.gender}
                    options={GENDERS}
                    onChange={(val) => handleChange('gender', val)}
                    onBlur={() => handleBlur('gender')}
                    status={fieldStatus('gender')}
                  />

                  <FloatingInput
                    id="ula-contact-no"
                    label="Contact No. (Registered Mobile No.)"
                    type="tel"
                    required
                    placeholder="Enter 10-digit mobile number"
                    maxLength={10}
                    value={formData.contact_no}
                    onChange={(val) => handleChange('contact_no', val)}
                    onBlur={() => handleBlur('contact_no')}
                    status={fieldStatus('contact_no')}
                    error={errors.contact_no}
                  />

                  <FloatingInput
                    id="ula-aadhar-no"
                    label="Aadhaar No."
                    placeholder="Enter 12-digit Aadhaar number"
                    maxLength={12}
                    value={formData.aadhar_no}
                    onChange={(val) => handleChange('aadhar_no', val)}
                    onBlur={() => handleBlur('aadhar_no')}
                    status={fieldStatus('aadhar_no')}
                    error={errors.aadhar_no}
                  />

                  <FloatingInput
                    id="ula-ca-number"
                    label="CA No."
                    required
                    placeholder="Enter CA number"
                    maxLength={100}
                    value={formData.ca_number}
                    onChange={(val) => handleChange('ca_number', val)}
                    onBlur={() => handleBlur('ca_number')}
                    status={fieldStatus('ca_number')}
                    error={errors.ca_number}
                  />

                  <FloatingSelect
                    id="ula-feasible"
                    label="Feasibility Status"
                    required
                    placeholder="-- Select --"
                    value={formData.feasible_status}
                    options={['1', '0']}
                    optionLabel={(v) => (v === '1' ? 'Feasible' : 'Not Feasible')}
                    onChange={(val) => handleChange('feasible_status', val)}
                    onBlur={() => handleBlur('feasible_status')}
                    status={fieldStatus('feasible_status')}
                  />
                </div>
              </div>

              <hr className="ula-section-divider" />

              {/* ========== Section 3: Feasible / Not Feasible ========== */}
              {isFeasible ? (
                <div id="ula-sec-3" className="ula-section-block">
                  <SectionHeader
                    num="3"
                    total="3"
                    title="Meter & Mandatory Documents"
                    subtitle="Smart meter specs and mandatory survey photographs (Feasible Site)."
                  />

                  <div className="ula-form-grid ula-form-grid--3col">
                    <FloatingSelect
                      id="ula-smart-meter"
                      label="Smart Meter"
                      required
                      placeholder="-- Select --"
                      value={formData.smart_meter}
                      options={['0', '1']}
                      optionLabel={(v) => (v === '1' ? 'Yes' : 'No')}
                      onChange={(val) => handleChange('smart_meter', val)}
                      onBlur={() => handleBlur('smart_meter')}
                      status={fieldStatus('smart_meter')}
                    />

                    {formData.smart_meter === '1' && (
                      <>
                        <FloatingInput
                          id="ula-smart-meter-no"
                          label="Smart Meter No."
                          required
                          placeholder="Enter Smart Meter Number"
                          value={formData.smart_meter_no}
                          onChange={(val) => handleChange('smart_meter_no', val)}
                          onBlur={() => handleBlur('smart_meter_no')}
                          status={fieldStatus('smart_meter_no')}
                          error={errors.smart_meter_no}
                        />

                        <FloatingSelect
                          id="ula-smart-meter-functional"
                          label="Smart Meter Functional"
                          required
                          placeholder="-- Select --"
                          value={formData.smart_meter_functional}
                          options={['1', '0']}
                          optionLabel={(v) => (v === '1' ? 'Yes' : 'No')}
                          onChange={(val) => handleChange('smart_meter_functional', val)}
                          onBlur={() => handleBlur('smart_meter_functional')}
                          status={fieldStatus('smart_meter_functional')}
                        />
                      </>
                    )}

                    <div className="ula-form-col-span-full">
                      <FloatingTextarea
                        id="ula-remarks"
                        label="Survey Remarks (Optional)"
                        rows={2}
                        placeholder="Enter any additional observations…"
                        value={formData.remarks}
                        onChange={(val) => handleChange('remarks', val)}
                        onBlur={() => handleBlur('remarks')}
                        status={fieldStatus('remarks')}
                      />
                    </div>

                    {/* Photos */}
                    <div className="ula-form-col-span-full">
                      <h4 style={{ margin: '0', fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-strong)', fontWeight: 600 }}>
                        Mandatory Photographs
                      </h4>
                      <p style={{ margin: '2px 0 0', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
                        Max 2MB each: JPG, JPEG, PNG
                      </p>
                    </div>

                    <FloatingFileInput
                      id="ula-electricity-bill"
                      label="Electricity Bill Photo"
                      required={!editId}
                      accept="image/jpeg,image/png,image/jpg"
                      file={files.electricity_bill_photo}
                      existing={existingPhotos.electricity_bill_photo}
                      onChange={(file) => handleFileChange('electricity_bill_photo', file)}
                      status={fileStatus('electricity_bill_photo')}
                      error={errors.electricity_bill_photo}
                    />

                    <FloatingFileInput
                      id="ula-consent-form"
                      label="Consent Form Photo"
                      required={!editId}
                      accept="image/jpeg,image/png,image/jpg"
                      file={files.consent_form_photo}
                      existing={existingPhotos.consent_form_photo}
                      onChange={(file) => handleFileChange('consent_form_photo', file)}
                      status={fileStatus('consent_form_photo')}
                      error={errors.consent_form_photo}
                    />

                    <FloatingFileInput
                      id="ula-aadhar-card"
                      label="Aadhaar Card Photo"
                      required={!editId}
                      accept="image/jpeg,image/png,image/jpg"
                      file={files.aadhar_card_photo}
                      existing={existingPhotos.aadhar_card_photo}
                      onChange={(file) => handleFileChange('aadhar_card_photo', file)}
                      status={fileStatus('aadhar_card_photo')}
                      error={errors.aadhar_card_photo}
                    />
                  </div>
                </div>
              ) : (
                <div id="ula-sec-3" className="ula-section-block">
                  <SectionHeader
                    num="3"
                    total="3"
                    title="Non-Feasibility Reason"
                    subtitle="Please explain why this site is not feasible."
                  />

                  <div className="ula-form-grid">
                    <div className="ula-form-col-span-full">
                      <FloatingTextarea
                        id="ula-remarks-nf"
                        label="Remarks / Reason for Non-Feasibility"
                        required
                        rows={4}
                        placeholder="State clear reasons why the site is not feasible (e.g. shadow issues, damaged roof, dispute, etc.)"
                        value={formData.remarks}
                        onChange={(val) => handleChange('remarks', val)}
                        onBlur={() => handleBlur('remarks')}
                        status={fieldStatus('remarks')}
                        error={errors.remarks}
                      />
                    </div>
                  </div>
                </div>
              )}
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
              <button
                type="button"
                className="ax-btn ax-btn--secondary"
                onClick={() => navigate('/v/bihar/ula-surveys/view')}
                disabled={saving}
              >
                <span className="ax-btn__label">Cancel</span>
              </button>
              <button type="submit" disabled={saving} className="ax-btn ax-btn--primary" style={{ minWidth: 200 }}>
                {saving ? (
                  <>
                    <span className="ax-spinner" style={{ width: 16, height: 16, marginRight: 8 }} />
                    <span className="ax-btn__label">Saving…</span>
                  </>
                ) : (
                  <>
                    <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5l10 -10" /></svg>
                    <span className="ax-btn__label">{editId ? 'Update ULA Survey' : 'Submit ULA Survey'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}



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
  options: string[];
  optionLabel?: (v: string) => string;
  disabled?: boolean;
  onChange: (val: string) => void;
  onBlur: () => void;
  status: FieldStatusProps;
  error?: string;
}

function FloatingSelect({
  id, label, required, placeholder = '-- Select --', value, options, optionLabel, disabled, onChange, onBlur, status, error,
}: FloatingSelectProps) {
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
            <option key={opt} value={opt}>
              {optionLabel ? optionLabel(opt) : opt}
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

interface FloatingTextareaProps {
  id: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  value: string;
  rows?: number;
  onChange: (val: string) => void;
  onBlur: () => void;
  status: FieldStatusProps;
  error?: string;
}

function FloatingTextarea({ id, label, required, placeholder = 'Enter Remarks...', value, rows = 3, onChange, onBlur, status, error }: FloatingTextareaProps) {
  return (
    <div>
      <div className="ax-float ax-float--area">
        <textarea
          id={id}
          rows={rows}
          className={`ax-textarea ax-float__input ${status.className}`}
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

interface FloatingFileInputProps {
  id: string;
  label: string;
  required?: boolean;
  accept?: string;
  file: File | null;
  existing?: string | null;
  onChange: (file: File | null) => void;
  status: FieldStatusProps;
  error?: string;
}

function FloatingFileInput({ id, label, required, accept, file, existing, onChange, status, error }: FloatingFileInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = e.target.files?.[0] || null;
    if (chosen && chosen.size > 2 * 1024 * 1024) {
      e.target.value = '';
    }
    onChange(chosen);
  };

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
      if (chosen.size > 2 * 1024 * 1024) {
        return;
      }
      onChange(chosen);
    }
  };

  const existingName = existing ? existing.split('/').pop() : null;
  const isErr = Boolean(error || status.className?.includes('is-invalid'));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label
        htmlFor={id}
        style={{
          fontSize: '12px',
          fontWeight: 600,
          color: isErr ? 'var(--ax-danger-500, #ef4444)' : 'var(--ax-text-strong, #334155)',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <span>{label}</span>
        {required && <Req />}
      </label>

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        style={{ display: 'none' }}
        onChange={handleFileChange}
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
            : isErr
            ? '1.5px dashed var(--ax-danger-500, #ef4444)'
            : isHovered ? '1.5px dashed #94a3b8' : '1.5px dashed #cbd5e1',
          borderRadius: 8,
          background: isDragging
            ? '#eff6ff'
            : isErr
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
              PDF, JPG or PNG — single file
            </div>
          </>
        )}
      </div>

      {!error && !file && existing ? (
        <span className="ax-field-feedback ax-field-feedback--hint" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          Current file: {existing}
        </span>
      ) : (
        <FieldFeedback error={error} isValid={status.isValid} />
      )}
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

export default Bihar_Survey_ULA_AddData;