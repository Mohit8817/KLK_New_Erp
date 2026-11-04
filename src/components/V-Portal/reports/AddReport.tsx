import { useState, useEffect, useRef, type FormEvent, type ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHead } from '../../shell/PageHead';
import {
  vendorCommonService,
  type VendorProgressWoItem,
  type WorkOrderDetails,
} from '../common-services/vendorCommonService';

/* ───────── Unified Single-Card Layout matching Reference Design ───────── */
const SINGLE_CARD_FORM_CSS = `
.solar-erp-page {
  --asw-primary: #2563eb;
  --asw-primary-rgb: 37, 99, 235;
}
.report-inst-form .ax-card {
  border: 1px solid var(--ax-border, #e2e8f0);
  border-radius: var(--ax-radius-xl, 16px);
  background: var(--ax-surface-solid, #ffffff);
  box-shadow: var(--ax-shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.05));
  overflow: hidden;
}
.report-inst-form .ax-card__header {
  padding: var(--ax-space-5, 20px) var(--ax-space-6, 24px);
  border-bottom: 1px solid var(--ax-border-subtle, #f1f5f9);
  background: var(--ax-surface-subtle, #f8fafc);
  display: flex;
  flex-direction: column;
  gap: var(--ax-space-4, 16px);
}
.report-inst-form .ax-card__body { padding: var(--ax-space-6, 24px); }

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

/* Upload dropzone */
.report-upload-grid {
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
              Choose File <span style={{ fontWeight: 400, color: 'var(--ax-text-muted, #64748b)', fontSize: 11.5 }}>No file chosen</span>
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

export function AddReport() {
  const navigate = useNavigate();

  // Work Orders List (from A1)
  const [workOrders, setWorkOrders] = useState<VendorProgressWoItem[]>([]);
  const [loadingWo, setLoadingWo] = useState(false);

  // Selected WO & Details (from A5)
  const [selectedWo, setSelectedWo] = useState<string>('');
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [woDetails, setWoDetails] = useState<WorkOrderDetails | null>(null);

  // Form Fields (A2)
  const [stateVal, setStateVal] = useState<string>('');
  const [districtVal, setDistrictVal] = useState<string>('');
  const [orderQty, setOrderQty] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [reportNotes, setReportNotes] = useState<string>('');

  // File Uploads (img1, img2)
  const [img1File, setImg1File] = useState<File | null>(null);
  const [img1Preview, setImg1Preview] = useState<string>('');
  const [img2File, setImg2File] = useState<File | null>(null);
  const [img2Preview, setImg2Preview] = useState<string>('');

  // Status & Feedback
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  // Section Refs for Smooth Scrolling
  const sec1 = useRef<HTMLDivElement>(null);
  const sec2 = useRef<HTMLDivElement>(null);
  const sec3 = useRef<HTMLDivElement>(null);

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // 1. Fetch available work orders (A1)
  const fetchWorkOrders = async () => {
    setLoadingWo(true);
    try {
      const data = await vendorCommonService.getWorkOrdersForProgress();
      setWorkOrders(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('[AddReport] fetchWorkOrders error:', err);
      setWorkOrders([]);
      setFeedback({ type: 'danger', text: err?.message || 'Failed to load work orders list.' });
    } finally {
      setLoadingWo(false);
    }
  };

  useEffect(() => {
    fetchWorkOrders();
  }, []);

  // 2. On selecting a work order, fetch its state, district, order_qty (A5)
  const handleWorkOrderSelect = async (woId: string) => {
    setSelectedWo(woId);
    setWoDetails(null);
    setStateVal('');
    setDistrictVal('');
    setOrderQty('');
    setQuantity('');
    setReportNotes('');
    setFeedback(null);

    if (!woId) return;

    setLoadingDetails(true);
    try {
      const details = await vendorCommonService.getWorkOrderDetails(woId);
      if (details) {
        setWoDetails(details);
        if (details.state) setStateVal(details.state);
        if (details.district) setDistrictVal(details.district);
        if (details.quantity != null) setOrderQty(String(details.quantity));
      }
    } catch (err: any) {
      console.warn('[AddReport] getWorkOrderDetails error:', err);
      setFeedback({ type: 'danger', text: err?.message || 'Could not fetch work order details automatically.' });
    } finally {
      setLoadingDetails(false);
    }
  };

  // 3. Form Submit Handler (A2)
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!selectedWo.trim()) {
      setFeedback({ type: 'danger', text: 'Please select a Work Order.' });
      scrollTo(sec1);
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

    const nOrderQty = Number(orderQty);
    if (!orderQty || isNaN(nOrderQty) || nOrderQty < 1) {
      setFeedback({ type: 'danger', text: 'Order Quantity must be a valid number >= 1.' });
      scrollTo(sec2);
      return;
    }

    const nQty = Number(quantity);
    if (!quantity || isNaN(nQty) || nQty < 1) {
      setFeedback({ type: 'danger', text: 'Quantity done must be a valid number >= 1.' });
      scrollTo(sec3);
      return;
    }

    try {
      setSubmitting(true);
      setFeedback(null);

      const formData = new FormData();
      formData.append('workorder', selectedWo.trim());
      formData.append('state', stateVal.trim());
      formData.append('district', districtVal.trim());
      formData.append('order_qty', String(nOrderQty));
      formData.append('quantity', String(nQty));

      if (reportNotes.trim()) {
        formData.append('report', reportNotes.trim());
      }
      if (img1File) {
        formData.append('img1', img1File);
      }
      if (img2File) {
        formData.append('img2', img2File);
      }

      const res = await vendorCommonService.saveProgressReport(formData);

      setFeedback({
        type: 'success',
        text: res?.message || 'Progress Data Added Successfully!',
      });

      setTimeout(() => {
        navigate('/v/reports/view-report');
      }, 1500);
    } catch (err: any) {
      console.error('[AddReport] submit error:', err);
      setFeedback({
        type: 'danger',
        text: err?.message || 'Failed to save progress report. Please check required fields.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="solar-erp-page report-inst-form">
      <style>{SINGLE_CARD_FORM_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="Add Daily Work Order Progress"
        subtitle="Log work order progress achievements, quantity executed today, site photographs, and execution remarks"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Reports' },
          { label: 'Add Report' },
        ]}
        actions={
          <Link to="/v/reports/view-report" className="ax-btn ax-btn--secondary ax-btn--sm">
            View My Reports
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
        {/* ── Card Header with Nav Pills ── */}
        <div className="ax-card__header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h2 className="ax-card__title" style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                Progress Report Submission
              </h2>
              <p className="ax-card__subtitle" style={{ fontSize: '0.85rem', color: 'var(--ax-text-muted, #64748b)', margin: '2px 0 0' }}>
                Select assigned work order, verify project parameters, and record daily work milestones.
              </p>
            </div>
            {selectedWo && (
              <span className="ax-badge ax-badge--soft ax-badge--info" style={{ fontWeight: 600 }}>
                Work Order: {selectedWo}
              </span>
            )}
          </div>

          {/* Quick Nav Pills */}
          <div className="swp-section-pills" role="navigation" aria-label="Section navigation">
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec1)}>
              <span className="pill-num">1</span> Select Work Order
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec2)}>
              <span className="pill-num">2</span> Specifications
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec3)}>
              <span className="pill-num">3</span> Progress Details & Photos
            </button>
          </div>
        </div>

        <div className="ax-card__body">
          {/* ════════ Section 1: Select Work Order ════════ */}
          <div ref={sec1} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>Select Work Order</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Choose from active work order assignments to record progress
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
                  id="select_workorder_id"
                  className="ax-float__input"
                  value={selectedWo}
                  onChange={(e) => handleWorkOrderSelect(e.target.value)}
                  disabled={loadingWo || submitting}
                  required
                >
                  <option value="">-- Select Work Order --</option>
                  {workOrders.map((item, idx) => (
                    <option key={item.wassign_id || idx} value={item.wassign_id}>
                      {item.wassign_id}
                    </option>
                  ))}
                </select>
                <label htmlFor="select_workorder_id" className="ax-float__label floating">
                  Work Order ID <span style={{ color: 'var(--ax-danger, #ef4444)' }}>*</span>
                </label>
              </div>
            </div>

            {loadingDetails && (
              <div style={{ padding: '14px 0', color: '#2563eb', fontSize: '13px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="ax-spinner" /> Fetching state, district and order quantity for {selectedWo}…
              </div>
            )}
          </div>

          <hr className="swp-section-divider" />

          {/* ════════ Section 2: Work Order Specifications ════════ */}
          <div ref={sec2} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>Work Order Specifications</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Auto-populated assignment details (Editable if required)
                </span>
              </div>
            </div>

            <div className="ax-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
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
                label="Total Order Quantity"
                name="order_qty"
                type="number"
                value={orderQty}
                onChange={(e) => setOrderQty(e.target.value)}
                placeholder="e.g. 500"
                required
              />
            </div>
          </div>

          <hr className="swp-section-divider" />

          {/* ════════ Section 3: Progress Details & Photos ════════ */}
          <div ref={sec3} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>Fill Progress Details</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Fields marked with <span style={{ color: 'var(--ax-danger, #ef4444)', fontWeight: 600 }}>*</span> are required.
                </span>
              </div>
            </div>

            <div className="ax-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <FloatingInput
                label="Quantity Completed Today"
                name="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g. 50"
                required
              />

              <div style={{ gridColumn: '1 / -1' }}>
                <FloatingInput
                  label="Daily Progress Report / Remarks"
                  name="report_notes"
                  value={reportNotes}
                  onChange={(e) => setReportNotes(e.target.value)}
                  placeholder="Enter detailed execution progress notes..."
                />
              </div>
            </div>

            {/* Photo Uploads (img1, img2) */}
            <div style={{ marginTop: 24 }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b', margin: '0 0 6px 0' }}>
                Site Photographs (Optional, Max 5MB Each)
              </h4>
              <p style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)', margin: '0 0 14px 0' }}>
                Attach clear JPG or PNG photographs of work executed on site today.
              </p>

              <div className="report-upload-grid">
                <UploadDropzone
                  id="progress_img1"
                  label="Site Photograph 1"
                  file={img1File}
                  preview={img1Preview}
                  onSelect={(f) => {
                    setImg1File(f);
                    setImg1Preview(URL.createObjectURL(f));
                  }}
                  onRemove={() => {
                    setImg1File(null);
                    setImg1Preview('');
                  }}
                />

                <UploadDropzone
                  id="progress_img2"
                  label="Site Photograph 2"
                  file={img2File}
                  preview={img2Preview}
                  onSelect={(f) => {
                    setImg2File(f);
                    setImg2Preview(URL.createObjectURL(f));
                  }}
                  onRemove={() => {
                    setImg2File(null);
                    setImg2Preview('');
                  }}
                />
              </div>
            </div>
          </div>

          {/* ════════ Submit Footer ════════ */}
          <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid var(--ax-border, #e2e8f0)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <Link to="/v/reports/view-report" className="ax-btn ax-btn--secondary">
              Cancel
            </Link>
            <button
              type="submit"
              className="ax-btn ax-btn--primary"
              disabled={submitting || !selectedWo}
              style={{ minWidth: 180 }}
            >
              {submitting ? 'Submitting Report…' : 'Save Progress Report'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default AddReport;
