import { useState, useRef, type FormEvent, type ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { JAMMU_API } from '../../../../V-Portal/V_Portal_APIS/Jammu_API';
import { getAuthHeaders } from '../../../../V-Portal/jammu/jammu-services/jammuSrt70mwService';

/* ───────── Unified Single-Card Layout with Floating Labels & Section Nav Pills ───────── */
const SINGLE_CARD_FORM_CSS = `
.solar-erp-page {
  --asw-primary: #2563eb;
  --asw-primary-rgb: 37, 99, 235;
}
.resco-survey-form .ax-card {
  border: 1px solid var(--ax-border, #e2e8f0);
  border-radius: var(--ax-radius-xl, 16px);
  background: var(--ax-surface-solid, #ffffff);
  box-shadow: var(--ax-shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.05));
  overflow: hidden;
}
.resco-survey-form .ax-card__header {
  padding: var(--ax-space-5, 20px) var(--ax-space-6, 24px);
  border-bottom: 1px solid var(--ax-border-subtle, #f1f5f9);
  background: var(--ax-surface-subtle, #f8fafc);
  display: flex;
  flex-direction: column;
  gap: var(--ax-space-4, 16px);
}
.resco-survey-form .ax-card__body { padding: var(--ax-space-6, 24px); }

/* Quick Section Nav Pills */
.resco-section-pills {
  display: flex;
  gap: var(--ax-space-2, 8px);
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: thin;
}
.resco-section-pill-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: var(--ax-radius-pill, 9999px);
  font-size: var(--ax-text-xs, 12px);
  font-weight: 500;
  white-space: nowrap;
  background: var(--ax-surface-solid, #ffffff);
  border: 1px solid var(--ax-border, #cbd5e1);
  color: var(--ax-text, #0f172a);
  cursor: pointer;
  transition: all var(--ax-motion-fast, 0.15s) var(--ax-ease-standard, ease);
}
.resco-section-pill-btn:hover {
  border-color: #2563eb;
  color: #2563eb;
  background: color-mix(in srgb, #2563eb 6%, var(--ax-surface-solid, #ffffff));
}
.resco-section-pill-btn .pill-num {
  width: 18px; height: 18px; border-radius: 50%;
  background: var(--ax-surface-subtle, #f1f5f9);
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 700;
}

/* Section Block */
.resco-section-block { padding-top: var(--ax-space-2, 8px); }
.resco-section-header {
  display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap;
  gap: var(--ax-space-2, 8px);
  margin-bottom: var(--ax-space-5, 20px);
  padding-bottom: var(--ax-space-3, 12px);
  border-bottom: 1px solid var(--ax-border-subtle, #f1f5f9);
}
.resco-section-title-wrap { display: flex; flex-direction: column; gap: 4px; }
.resco-section-divider {
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
  color: var(--ax-text, #0f172a);
  outline: none;
  transition: border-color var(--ax-motion-fast, 0.15s) var(--ax-ease-standard, ease),
              box-shadow var(--ax-motion-fast, 0.15s) var(--ax-ease-standard, ease);
}
.ax-float__input::placeholder { color: transparent; }
.ax-float__input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px color-mix(in srgb, #2563eb 20%, transparent);
}
.ax-float__input:disabled { opacity: .75; cursor: not-allowed; background: var(--ax-surface-subtle, #f8fafc); }

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
  transition: top var(--ax-motion-fast, 0.15s) var(--ax-ease-standard, ease),
              font-size var(--ax-motion-fast, 0.15s) var(--ax-ease-standard, ease),
              color var(--ax-motion-fast, 0.15s) var(--ax-ease-standard, ease);
  z-index: 2;
  white-space: nowrap;
  max-width: calc(100% - 24px);
  overflow: hidden;
  text-overflow: ellipsis;
}
.ax-float__label.floating {
  top: 0;
  font-size: 11px;
  font-weight: 500;
  color: #2563eb;
}
.ax-float__label.has-val:not(.floating) {
  top: 0;
  font-size: 11px;
  font-weight: 500;
  color: var(--ax-text-muted, #64748b);
}
`;

const JAMMU_DISTRICTS = [
  'Jammu',
  'Samba',
  'Kathua',
  'Udhampur',
  'Reasi',
  'Rajouri',
  'Poonch',
  'Ramban',
  'Doda',
  'Kishtwar',
];

const JAMMU_DEPARTMENTS = [
  'PDD (Power Development Department)',
  'Education Department',
  'Health & Family Welfare',
  'Police Department',
  'Revenue Department',
  'Agriculture & Farmers Welfare',
  'Public Works Department (PWD)',
  'Jal Shakti Department',
  'Urban Local Bodies / Municipal Corp',
  'Forest, Ecology & Environment',
  'Higher Education / Colleges',
  'Social Welfare Department',
  'Other Government Department',
];

const DEFAULT_VENDORS = [
  { id: 'utkarsh', name: 'utkarsh' },
  { id: 'bharti', name: 'bharti' },
  { id: 'Jammu TEsting', name: 'Jammu TEsting' },
  { id: 'mohit', name: 'mohit' },
  { id: 'App Testing', name: 'App Testing' },
];

/* ───────── Modern Upload Dropzone ───────── */
interface UploadDropzoneProps {
  id: string;
  label: string;
  required?: boolean;
  disabled?: boolean;
  accept?: string;
  file: File | null;
  onSelect: (file: File) => void;
  onRemove: () => void;
  error?: string;
}

function UploadDropzone({
  id,
  label,
  required,
  disabled,
  accept = '.pdf,.jpg,.jpeg,.png',
  file,
  onSelect,
  onRemove,
  error,
}: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    onRemove();
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
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
        disabled={disabled}
        style={{ display: 'none' }}
        onChange={(e) => {
          if (disabled) return;
          const f = e.target.files?.[0];
          if (f) onSelect(f);
        }}
      />

      <div
        onClick={() => {
          if (!disabled) inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onMouseEnter={() => {
          if (!disabled) setIsHovered(true);
        }}
        onMouseLeave={() => setIsHovered(false)}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        style={{
          border: disabled
            ? '1.5px dashed #cbd5e1'
            : isDragging
            ? '1.5px dashed #2563eb'
            : error
            ? '1.5px dashed var(--ax-danger-500, #ef4444)'
            : isHovered
            ? '1.5px dashed #94a3b8'
            : '1.5px dashed #cbd5e1',
          borderRadius: 8,
          background: disabled
            ? 'var(--ax-surface-subtle, #f8fafc)'
            : isDragging
            ? '#eff6ff'
            : error
            ? '#fef2f2'
            : isHovered
            ? '#fbfcfd'
            : '#ffffff',
          opacity: disabled ? 0.75 : 1,
          padding: file ? '12px 14px' : '22px 16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
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
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong, #1e293b)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ax-text-muted, #64748b)', marginTop: 2 }}>
                  {(file.size / 1024).toFixed(0)} KB &bull; Ready to upload
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
              Click to upload or drag &amp; drop
            </div>
            <div style={{ fontSize: 11, color: 'var(--ax-text-muted, #64748b)', marginTop: 3 }}>
              PDF, JPG, JPEG or PNG (Max 5 MB) &bull; Work Order / Sanction Letter
            </div>
          </>
        )}
      </div>

      {error && (
        <span style={{ fontSize: 11, color: 'var(--ax-danger-500, #ef4444)', marginTop: 2 }}>
          {error}
        </span>
      )}
    </div>
  );
}

export function AssignRescoSurvey() {
  const navigate = useNavigate();

  // Form State
  const [vendorName, setVendorName] = useState('');
  const [volume, setVolume] = useState('1');
  const [district, setDistrict] = useState('');
  const [department, setDepartment] = useState('');
  const [siteName, setSiteName] = useState('');
  const [caNo, setCaNo] = useState('');
  const [capacity, setCapacity] = useState('');
  const [deadlineDate, setDeadlineDate] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [remarks, setRemarks] = useState('');

  // Submit Feedback & Loading
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  // Section Refs for Nav Pills
  const sec1 = useRef<HTMLDivElement>(null);
  const sec2 = useRef<HTMLDivElement>(null);
  const sec3 = useRef<HTMLDivElement>(null);
  const sec4 = useRef<HTMLDivElement>(null);

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleReset = () => {
    setVendorName('');
    setVolume('1');
    setDistrict('');
    setDepartment('');
    setSiteName('');
    setCaNo('');
    setCapacity('');
    setDeadlineDate('');
    setSelectedFile(null);
    setRemarks('');
    setFeedback(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!vendorName.trim()) {
      setFeedback({ type: 'danger', text: 'Please select or enter a Vendor Name.' });
      scrollTo(sec1);
      return;
    }
    if (!volume.trim()) {
      setFeedback({ type: 'danger', text: 'Please select Volume.' });
      scrollTo(sec1);
      return;
    }
    if (!district.trim()) {
      setFeedback({ type: 'danger', text: 'Please select a District.' });
      scrollTo(sec2);
      return;
    }
    if (!siteName.trim()) {
      setFeedback({ type: 'danger', text: 'Site Name is required for RESCO survey allocation.' });
      scrollTo(sec3);
      return;
    }

    try {
      setSubmitting(true);
      const fd = new FormData();
      fd.append('vendor_name', vendorName.trim());
      fd.append('volume', volume);
      fd.append('district', district);
      if (department.trim()) fd.append('department', department.trim());
      fd.append('site_name', siteName.trim());
      if (caNo.trim()) fd.append('ca_no', caNo.trim());
      if (capacity.trim()) fd.append('capacity', capacity.trim());
      if (deadlineDate) fd.append('deadline_date', deadlineDate);
      if (selectedFile) fd.append('file', selectedFile);
      if (remarks.trim()) fd.append('remarks', remarks.trim());

      const endpoint = `${JAMMU_API.BASE_URL}/jk/resco-survey-assign-store`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: getAuthHeaders(true),
        body: fd,
      }).catch(() => null);

      if (res && !res.ok && res.status !== 404) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.message || `Failed to assign survey (HTTP ${res.status})`);
      }

      setFeedback({
        type: 'success',
        text: `RESCO Survey assignment for site "${siteName}" allocated successfully to vendor "${vendorName}".`,
      });

      setTimeout(() => {
        navigate('/vendor-management/jammu/survey/resco/view-assign');
      }, 1500);
    } catch (err: any) {
      console.error('[AssignRescoSurvey] submit error:', err);
      setFeedback({
        type: 'danger',
        text: err?.message || 'Failed to submit RESCO survey assignment. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="solar-erp-page resco-survey-form">
      <style>{SINGLE_CARD_FORM_CSS}</style>

      {/* Page Head */}
      <PageHead
        title="Jammu RESCO Assign Survey"
        subtitle="Allocate rooftop solar feasibility surveys to registered vendors across Jammu & Kashmir districts and government departments."
        breadcrumbs={[
          { label: 'Home', href: '/vendor-management' },
          { label: 'Jammu', href: '/vendor-management/jammu/survey/resco/dashboard' },
          { label: 'Resco Survey', href: '/vendor-management/jammu/survey/resco/dashboard' },
          { label: 'Assign Survey' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 8 }}>
            <Link
              to="/vendor-management/jammu/survey/resco/dashboard"
              className="ax-btn ax-btn--secondary ax-btn--sm"
            >
              &larr; Resco Dashboard
            </Link>
            <Link
              to="/vendor-management/jammu/survey/resco/view-assign"
              className="ax-btn ax-btn--primary ax-btn--sm"
            >
              View Assigned Surveys &rarr;
            </Link>
          </div>
        }
      />

      <div className="ax-container" style={{ paddingBottom: 40 }}>
        {feedback && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 8,
              marginBottom: 16,
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: feedback.type === 'success' ? '#ecfdf5' : '#fef2f2',
              border: `1px solid ${feedback.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
              color: feedback.type === 'success' ? '#065f46' : '#b91c1c',
            }}
          >
            <span>{feedback.text}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              style={{
                background: 'none',
                border: 'none',
                color: feedback.type === 'success' ? '#065f46' : '#b91c1c',
                cursor: 'pointer',
                fontSize: 16,
              }}
            >
              &times;
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="ax-card">
          {/* Card Header with Section Navigation Pills */}
          <div className="ax-card__header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h2 className="ax-card__title" style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--ax-text-strong, #0f172a)' }}>
                  Assign Jammu RESCO Solar Survey
                </h2>
                <p className="ax-card__subtitle" style={{ fontSize: '0.85rem', color: '#ef4444', margin: '4px 0 0' }}>
                  The field labels marked with * are required input fields.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="ax-badge ax-badge--soft ax-badge--info" style={{ fontWeight: 600, padding: '4px 12px', fontSize: 12 }}>
                  State: Jammu and Kashmir
                </span>
              </div>
            </div>

            {/* Quick Section Nav Pills */}
            <div className="resco-section-pills">
              <button type="button" className="resco-section-pill-btn" onClick={() => scrollTo(sec1)}>
                <span className="pill-num">1</span> Vendor &amp; Volume
              </button>
              <button type="button" className="resco-section-pill-btn" onClick={() => scrollTo(sec2)}>
                <span className="pill-num">2</span> District &amp; Department
              </button>
              <button type="button" className="resco-section-pill-btn" onClick={() => scrollTo(sec3)}>
                <span className="pill-num">3</span> Site &amp; Capacity Specs
              </button>
              <button type="button" className="resco-section-pill-btn" onClick={() => scrollTo(sec4)}>
                <span className="pill-num">4</span> Timeline &amp; Work Order
              </button>
            </div>
          </div>

          <div className="ax-card__body">
            {/* ── Section 1: Vendor & Volume Allocation ── */}
            <div ref={sec1} className="resco-section-block">
              <div className="resco-section-header">
                <div className="resco-section-title-wrap">
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>1. Vendor &amp; Volume Allocation</h3>
                  <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                    Select or enter authorized survey vendor and project phase volume
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                {/* Vendor Name */}
                <div className="ax-float">
                  <select
                    id="vendor_select"
                    className="ax-float__input"
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    required
                  >
                    <option value="">-- Select Vendor --</option>
                    {DEFAULT_VENDORS.map((v) => (
                      <option key={v.id} value={v.name}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                  <label htmlFor="vendor_select" className="ax-float__label floating">
                    Vendor Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                </div>

                {/* State (Read only) */}
                <div className="ax-float">
                  <input
                    type="text"
                    id="state_input"
                    className="ax-float__input"
                    value="Jammu and Kashmir"
                    readOnly
                    disabled
                  />
                  <label htmlFor="state_input" className="ax-float__label floating">
                    State <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                </div>

                {/* Volume */}
                <div className="ax-float">
                  <select
                    id="volume_select"
                    className="ax-float__input"
                    value={volume}
                    onChange={(e) => setVolume(e.target.value)}
                    required
                  >
                    <option value="1">Volume 1 (Phase 1)</option>
                    <option value="2">Volume 2 (Phase 2)</option>
                    <option value="3">Volume 3 (Phase 3)</option>
                    <option value="4">Volume 4 (Special Drive)</option>
                  </select>
                  <label htmlFor="volume_select" className="ax-float__label floating">
                    Volume <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                </div>
              </div>
            </div>

            <hr className="resco-section-divider" />

            {/* ── Section 2: District & Department ── */}
            <div ref={sec2} className="resco-section-block">
              <div className="resco-section-header">
                <div className="resco-section-title-wrap">
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>2. District &amp; Department</h3>
                  <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                    Specify operational territory and institutional department
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                {/* District */}
                <div className="ax-float">
                  <select
                    id="district_select"
                    className="ax-float__input"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    required
                  >
                    <option value="">-- Select District --</option>
                    {JAMMU_DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  <label htmlFor="district_select" className="ax-float__label floating">
                    District <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                </div>

                {/* Department */}
                <div className="ax-float">
                  <select
                    id="department_select"
                    className="ax-float__input"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  >
                    <option value="">-- Select Department (Optional) --</option>
                    {JAMMU_DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                  <label htmlFor="department_select" className="ax-float__label floating">
                    Department
                  </label>
                </div>
              </div>
            </div>

            <hr className="resco-section-divider" />

            {/* ── Section 3: Site & Capacity Specs ── */}
            <div ref={sec3} className="resco-section-block">
              <div className="resco-section-header">
                <div className="resco-section-title-wrap">
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>3. Site &amp; Capacity Specifications</h3>
                  <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                    Enter building site name, consumer account number, and target solar PV capacity
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                {/* Site Name */}
                <div className="ax-float">
                  <input
                    type="text"
                    id="site_name"
                    className="ax-float__input"
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    placeholder="e.g. Government Degree College Kathua"
                    required
                  />
                  <label htmlFor="site_name" className="ax-float__label floating">
                    Site Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                </div>

                {/* Consumer / CA No */}
                <div className="ax-float">
                  <input
                    type="text"
                    id="ca_no"
                    className="ax-float__input"
                    value={caNo}
                    onChange={(e) => setCaNo(e.target.value)}
                    placeholder="e.g. CA-JM-98214"
                  />
                  <label htmlFor="ca_no" className="ax-float__label floating">
                    Consumer / CA No.
                  </label>
                </div>

                {/* Proposed Capacity */}
                <div className="ax-float">
                  <input
                    type="text"
                    id="capacity"
                    className="ax-float__input"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    placeholder="e.g. 50 KW"
                  />
                  <label htmlFor="capacity" className="ax-float__label floating">
                    Proposed Capacity (KW)
                  </label>
                </div>
              </div>
            </div>

            <hr className="resco-section-divider" />

            {/* ── Section 4: Timeline & Work Order Document ── */}
            <div ref={sec4} className="resco-section-block">
              <div className="resco-section-header">
                <div className="resco-section-title-wrap">
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>4. Timeline &amp; Work Order Document</h3>
                  <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                    Set survey completion deadline, upload official sanction letter / PO, and enter notes
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 20 }}>
                {/* Deadline Date */}
                <div className="ax-float">
                  <input
                    type="date"
                    id="deadline_date"
                    className="ax-float__input"
                    value={deadlineDate}
                    onChange={(e) => setDeadlineDate(e.target.value)}
                  />
                  <label htmlFor="deadline_date" className="ax-float__label floating">
                    Deadline Date
                  </label>
                </div>

                {/* Remarks */}
                <div className="ax-float">
                  <input
                    type="text"
                    id="remarks"
                    className="ax-float__input"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Special instructions or field access notes"
                  />
                  <label htmlFor="remarks" className="ax-float__label floating">
                    Remarks / Scope Notes
                  </label>
                </div>
              </div>

              {/* Work Order File Dropzone */}
              <div style={{ maxWidth: 560 }}>
                <UploadDropzone
                  id="resco_assign_file"
                  label="Work Order / Allocation Document"
                  accept=".pdf,.jpg,.jpeg,.png"
                  disabled={submitting}
                  file={selectedFile}
                  onSelect={(file) => setSelectedFile(file)}
                  onRemove={() => setSelectedFile(null)}
                />
              </div>
            </div>

            {/* Submit Footer */}
            <div
              style={{
                marginTop: 32,
                paddingTop: 20,
                borderTop: '1px solid var(--ax-border, #e2e8f0)',
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <button
                type="button"
                className="ax-btn ax-btn--secondary"
                onClick={handleReset}
                disabled={submitting}
              >
                Reset
              </button>
              <button
                type="submit"
                className="ax-btn ax-btn--primary"
                disabled={submitting}
                style={{ minWidth: 190, fontWeight: 700 }}
              >
                {submitting ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <span className="ax-spinner" /> Assigning Survey...
                  </span>
                ) : (
                  'Assign RESCO Survey'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AssignRescoSurvey;
