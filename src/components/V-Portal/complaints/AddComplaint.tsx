import { useState, useEffect, useRef, type FormEvent, type ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHead } from '../../shell/PageHead';
import {
  vendorCommonService,
  type VendorComplaintWoItem,
} from '../common-services/vendorCommonService';

/* ───────── Unified Single-Card Layout matching Reference Design ───────── */
const SINGLE_CARD_FORM_CSS = `
.solar-erp-page {
  --asw-primary: #2563eb;
  --asw-primary-rgb: 37, 99, 235;
}
.complaint-form .ax-card {
  border: 1px solid var(--ax-border, #e2e8f0);
  border-radius: var(--ax-radius-xl, 16px);
  background: var(--ax-surface-solid, #ffffff);
  box-shadow: var(--ax-shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.05));
  overflow: hidden;
}
.complaint-form .ax-card__header {
  padding: var(--ax-space-5, 20px) var(--ax-space-6, 24px);
  border-bottom: 1px solid var(--ax-border-subtle, #f1f5f9);
  background: var(--ax-surface-subtle, #f8fafc);
  display: flex;
  flex-direction: column;
  gap: var(--ax-space-4, 16px);
}
.complaint-form .ax-card__body { padding: var(--ax-space-6, 24px); }

/* Quick Section Nav Pills */
.swp-section-pills {
  display: flex;
  gap: var(--ax-space-2, 8px);
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: thin;
}
.swp-section-pill-btn {
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
.swp-section-pill-btn:hover {
  border-color: #2563eb;
  color: #2563eb;
  background: color-mix(in srgb, #2563eb 6%, var(--ax-surface-solid, #ffffff));
}
.swp-section-pill-btn .pill-num {
  width: 18px; height: 18px; border-radius: 50%;
  background: var(--ax-surface-subtle, #f1f5f9);
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 700;
}

/* Section Block */
.swp-section-block { padding-top: var(--ax-space-2, 8px); }
.swp-section-header {
  display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap;
  gap: var(--ax-space-2, 8px);
  margin-bottom: var(--ax-space-5, 20px);
  padding-bottom: var(--ax-space-3, 12px);
  border-bottom: 1px solid var(--ax-border-subtle, #f1f5f9);
}
.swp-section-title-wrap { display: flex; flex-direction: column; gap: 4px; }
.swp-section-divider {
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
.ax-float__input:focus::placeholder { color: #94a3b8; }
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

.complaint-upload-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  margin-top: 8px;
}
`;

interface FloatingInputProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  required?: boolean;
  disabled?: boolean;
  type?: string;
  placeholder?: string;
}

function FloatingInput({
  label,
  name,
  value,
  onChange,
  required,
  disabled,
  type = 'text',
  placeholder,
}: FloatingInputProps) {
  const [focused, setFocused] = useState(false);
  const hasVal = Boolean(value && String(value).length > 0);

  return (
    <div className="ax-float" style={{ flex: 1, minWidth: 0 }}>
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        required={required}
        disabled={disabled}
        placeholder={placeholder || label}
        className="ax-float__input"
      />
      <label htmlFor={name} className={`ax-float__label ${focused ? 'floating' : hasVal ? 'has-val' : ''}`}>
        {label} {required && <span style={{ color: 'var(--ax-danger, #ef4444)' }}>*</span>}
      </label>
    </div>
  );
}

/* ───────── Upload Dropzone ───────── */
interface UploadDropzoneProps {
  id: string;
  label: string;
  required?: boolean;
  accept?: string;
  file: File | null;
  preview?: string;
  onSelect: (file: File) => void;
  onRemove: () => void;
  error?: string;
}

function UploadDropzone({
  id,
  label,
  required,
  accept = 'image/jpeg,image/png,image/jpg',
  file,
  preview,
  onSelect,
  onRemove,
  error,
}: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove();
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
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
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onSelect(f);
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
            ? '#fbfcfd'
            : '#ffffff',
          padding: file || preview ? '12px 14px' : '20px 16px',
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
        {file || preview ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, textAlign: 'left' }}>
              {preview ? (
                <img
                  src={preview}
                  alt={label}
                  style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--ax-border, #cbd5e1)' }}
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
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong, #0f172a)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file ? file.name : label}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ax-text-muted, #64748b)', marginTop: 2 }}>
                  {file ? `${(file.size / 1024).toFixed(0)} KB · Ready to upload` : 'File selected'}
                </div>
              </div>
            </div>
            <button
              type="button"
              className="ax-btn ax-btn--ghost ax-btn--sm"
              onClick={handleClear}
              style={{ color: '#ef4444', flexShrink: 0 }}
              title="Remove photo"
            >
              Remove
            </button>
          </div>
        ) : (
          <>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: '#eff6ff',
                color: '#3b82f6',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 6,
              }}
            >
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                <path d="M12 12v9" />
                <path d="m8 16 4-4 4 4" />
              </svg>
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ax-text-strong, #1e293b)' }}>
              Choose Complaint Photo <span style={{ fontWeight: 400, color: 'var(--ax-text-muted, #64748b)', fontSize: 11.5 }}>No file chosen</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--ax-text-muted, #64748b)', marginTop: 2 }}>
              JPG, JPEG or PNG (max 5 MB)
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

export function AddComplaint() {
  const navigate = useNavigate();

  // Work Orders List (from C1)
  const [workOrders, setWorkOrders] = useState<VendorComplaintWoItem[]>([]);
  const [loadingWo, setLoadingWo] = useState(false);

  // Form Fields (C2)
  const [workorder, setWorkorder] = useState<string>('');
  const [complaintText, setComplaintText] = useState<string>('');
  const [stateVal, setStateVal] = useState<string>('');
  const [districtVal, setDistrictVal] = useState<string>('');
  const [locationVal, setLocationVal] = useState<string>('');
  const [complainantName, setComplainantName] = useState<string>('');
  const [mobileVal, setMobileVal] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [siteVal, setSiteVal] = useState<string>('');
  const [resolvedBy, setResolvedBy] = useState<string>('');

  // Image Upload
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  // Status & Feedback
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  // Section Refs for Scrolling
  const sec1 = useRef<HTMLDivElement>(null);
  const sec2 = useRef<HTMLDivElement>(null);
  const sec3 = useRef<HTMLDivElement>(null);

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Fetch Work Orders for Complaint (C1: GET /vendor-add-complaint)
  const fetchWorkOrders = async () => {
    setLoadingWo(true);
    try {
      const data = await vendorCommonService.getWorkOrdersForComplaint();
      setWorkOrders(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('[AddComplaint] fetchWorkOrders error:', err);
      setWorkOrders([]);
      setFeedback({ type: 'danger', text: err?.message || 'Failed to load assigned work orders for complaints.' });
    } finally {
      setLoadingWo(false);
    }
  };

  useEffect(() => {
    fetchWorkOrders();
  }, []);

  // Form Submit Handler (C2: POST /vendor-save-complaint)
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!workorder.trim()) {
      setFeedback({ type: 'danger', text: 'Please select a Work Order.' });
      scrollTo(sec1);
      return;
    }

    if (!complaintText.trim()) {
      setFeedback({ type: 'danger', text: 'Complaint issue description is required.' });
      scrollTo(sec1);
      return;
    }

    if (!complainantName.trim()) {
      setFeedback({ type: 'danger', text: 'Complainant Name is required.' });
      scrollTo(sec2);
      return;
    }

    const cleanMobile = mobileVal.replace(/\D/g, '').trim();
    if (!cleanMobile || cleanMobile.length < 10) {
      setFeedback({ type: 'danger', text: 'Please enter a valid 10-digit mobile number.' });
      scrollTo(sec2);
      return;
    }

    if (!stateVal.trim()) {
      setFeedback({ type: 'danger', text: 'State is required.' });
      scrollTo(sec2);
      return;
    }

    if (!districtVal.trim()) {
      setFeedback({ type: 'danger', text: 'District is required.' });
      scrollTo(sec2);
      return;
    }

    if (!locationVal.trim()) {
      setFeedback({ type: 'danger', text: 'Location is required.' });
      scrollTo(sec2);
      return;
    }

    if (!remarks.trim()) {
      setFeedback({ type: 'danger', text: 'Remarks are required.' });
      scrollTo(sec3);
      return;
    }

    try {
      setSubmitting(true);
      setFeedback(null);

      const formData = new FormData();
      formData.append('workorder', workorder.trim());
      formData.append('complaint', complaintText.trim());
      formData.append('name', complainantName.trim());
      formData.append('mobile', cleanMobile);
      formData.append('state', stateVal.trim());
      formData.append('district', districtVal.trim());
      formData.append('location', locationVal.trim());
      formData.append('remarks', remarks.trim());

      if (siteVal.trim()) {
        formData.append('site', siteVal.trim());
      }
      if (resolvedBy.trim()) {
        formData.append('resolved_by', resolvedBy.trim());
      }
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const res = await vendorCommonService.saveComplaint(formData);

      setFeedback({
        type: 'success',
        text: res?.message || 'Complaint Registered Successfully!',
      });

      setTimeout(() => {
        navigate('/v/complaints/view-complaint');
      }, 1500);
    } catch (err: any) {
      console.error('[AddComplaint] submit error:', err);
      setFeedback({
        type: 'danger',
        text: err?.message || 'Failed to register complaint. Please verify required fields.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="solar-erp-page complaint-form">
      <style>{SINGLE_CARD_FORM_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="Register Vendor Complaint"
        subtitle="Log service defects, breakdown issues, beneficiary complaints, and upload field photographs for assigned work orders"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Complaints' },
          { label: 'Add Complaint' },
        ]}
        actions={
          <Link to="/v/complaints/view-complaint" className="ax-btn ax-btn--secondary ax-btn--sm">
            View Complaints
          </Link>
        }
      />

      {feedback && (
        <div className={`ax-alert ax-alert--${feedback.type}`} style={{ marginBottom: 'var(--ax-space-4)' }} role="alert">
          <div className="ax-alert__title">{feedback.type === 'success' ? 'Success' : 'Error'}</div>
          <div className="ax-alert__text">{feedback.text}</div>
        </div>
      )}

      {/* ── Main Form Card ── */}
      <form onSubmit={handleSubmit} className="ax-card">
        {/* ── Header with Section Pills ── */}
        <div className="ax-card__header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h2 className="ax-card__title" style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                Register New Complaint Ticket
              </h2>
              <p className="ax-card__subtitle" style={{ fontSize: '0.85rem', color: 'var(--ax-text-muted, #64748b)', margin: '2px 0 0' }}>
                Complaint will initialize with Open status and today's registration timestamp.
              </p>
            </div>
            {workorder && (
              <span className="ax-badge ax-badge--soft ax-badge--info" style={{ fontWeight: 600 }}>
                Work Order: {workorder}
              </span>
            )}
          </div>

          {/* Quick Nav Pills */}
          <div className="swp-section-pills" role="navigation" aria-label="Section navigation">
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec1)}>
              <span className="pill-num">1</span> Work Order & Issue
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec2)}>
              <span className="pill-num">2</span> Complainant & Location
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec3)}>
              <span className="pill-num">3</span> Remarks & Photos
            </button>
          </div>
        </div>

        <div className="ax-card__body">
          {/* ════════ Section 1: Work Order & Complaint Issue ════════ */}
          <div ref={sec1} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>Work Order & Issue Summary</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Select the assigned work order and specify the nature of the issue
                </span>
              </div>
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--sm"
                onClick={fetchWorkOrders}
                disabled={loadingWo}
              >
                {loadingWo ? 'Refreshing…' : 'Refresh Work Orders'}
              </button>
            </div>

            <div className="ax-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <div className="ax-float">
                <select
                  id="complaint_select_wo"
                  className="ax-float__input"
                  value={workorder}
                  onChange={(e) => setWorkorder(e.target.value)}
                  disabled={loadingWo || submitting}
                  required
                >
                  <option value="">-- Select Work Order --</option>
                  {workOrders.map((item, idx) => (
                    <option key={item.wo || idx} value={item.wo}>
                      {item.wo}
                    </option>
                  ))}
                </select>
                <label htmlFor="complaint_select_wo" className="ax-float__label floating">
                  Assigned Work Order <span style={{ color: 'var(--ax-danger, #ef4444)' }}>*</span>
                </label>
              </div>

              <FloatingInput
                label="Complaint Summary / Issue Description"
                name="complaint"
                value={complaintText}
                onChange={(e) => setComplaintText(e.target.value)}
                placeholder="e.g. Light not turning on at night / inverter error"
                required
              />
            </div>
          </div>

          <hr className="swp-section-divider" />

          {/* ════════ Section 2: Complainant & Location ════════ */}
          <div ref={sec2} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>Complainant & Location Details</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Beneficiary or reporting person contact information and site address
                </span>
              </div>
            </div>

            <div className="ax-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <FloatingInput
                label="Complainant Name"
                name="name"
                value={complainantName}
                onChange={(e) => setComplainantName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                required
              />

              <FloatingInput
                label="Complainant Mobile No."
                name="mobile"
                type="tel"
                value={mobileVal}
                onChange={(e) => setMobileVal(e.target.value.replace(/\D/g, '').slice(0, 15))}
                placeholder="e.g. 9876543210"
                required
              />

              <FloatingInput
                label="State"
                name="state"
                value={stateVal}
                onChange={(e) => setStateVal(e.target.value)}
                placeholder="e.g. Uttar Pradesh"
                required
              />

              <FloatingInput
                label="District"
                name="district"
                value={districtVal}
                onChange={(e) => setDistrictVal(e.target.value)}
                placeholder="e.g. Lucknow"
                required
              />

              <FloatingInput
                label="Location / Village"
                name="location"
                value={locationVal}
                onChange={(e) => setLocationVal(e.target.value)}
                placeholder="e.g. Kakori / Main Market"
                required
              />

              <FloatingInput
                label="Site / Landmark (Optional)"
                name="site"
                value={siteVal}
                onChange={(e) => setSiteVal(e.target.value)}
                placeholder="e.g. Near Panchayat Bhavan"
              />
            </div>
          </div>

          <hr className="swp-section-divider" />

          {/* ════════ Section 3: Remarks & Photographs ════════ */}
          <div ref={sec3} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>Remarks & Site Photo</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Provide technical notes and attach defect photograph
                </span>
              </div>
            </div>

            <div className="ax-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <FloatingInput
                label="Assigned Technician / Resolved By (Optional)"
                name="resolved_by"
                value={resolvedBy}
                onChange={(e) => setResolvedBy(e.target.value)}
                placeholder="Technician name if assigned directly"
              />

              <div style={{ gridColumn: '1 / -1' }}>
                <FloatingInput
                  label="Detailed Remarks"
                  name="remarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter detailed technical observations, cause of breakdown, or instructions..."
                  required
                />
              </div>
            </div>

            {/* Photo Upload Dropzone */}
            <div style={{ marginTop: 24 }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b', margin: '0 0 6px 0' }}>
                Issue Photograph (Optional, Max 5MB)
              </h4>
              <p style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)', margin: '0 0 14px 0' }}>
                Upload photo showing breakdown or component defect (JPG, JPEG or PNG).
              </p>

              <div className="complaint-upload-grid">
                <UploadDropzone
                  id="complaint_photo_file"
                  label="Complaint Photo"
                  file={imageFile}
                  preview={imagePreview}
                  onSelect={(f) => {
                    setImageFile(f);
                    setImagePreview(URL.createObjectURL(f));
                  }}
                  onRemove={() => {
                    setImageFile(null);
                    setImagePreview('');
                  }}
                />
              </div>
            </div>
          </div>

          {/* ════════ Submit Footer ════════ */}
          <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid var(--ax-border, #e2e8f0)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <Link to="/v/complaints/view-complaint" className="ax-btn ax-btn--secondary">
              Cancel
            </Link>
            <button
              type="submit"
              className="ax-btn ax-btn--primary"
              disabled={submitting || !workorder}
              style={{ minWidth: 180 }}
            >
              {submitting ? 'Registering Complaint…' : 'Register Complaint'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default AddComplaint;
