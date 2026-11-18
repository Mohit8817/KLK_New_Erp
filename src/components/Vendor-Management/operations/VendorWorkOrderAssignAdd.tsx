import { useState, useEffect, useRef, type FormEvent, type ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHead } from '../../shell/PageHead';
import {
  vendorOperationsService,
  type VendorMasterItem,
  type WorkOrderItem,
} from './vendorOperationsService';

/* ───────── Responsive page CSS (Exact Solar ERP Design Standard) ───────── */
const PAGE_CSS = `
  .solar-erp-page {
    --asw-primary: var(--ax-accent, #2563eb);
    --asw-primary-rgb: var(--ax-accent-rgb, 37, 99, 235);
  }
  .solar-erp-page .ax-card { min-width: 0; }
  .solar-erp-page .ax-card__footer { width: 100%; box-sizing: border-box; }
`;

/* Unified Single-Card Layout with Floating Labels & Section Dividers (matching Assam SWP reference) */
const SINGLE_CARD_FORM_CSS = `
.swp-inst-form .ax-card {
  border: 1px solid var(--ax-border, #e2e8f0);
  border-radius: var(--ax-radius-xl, 16px);
  background: var(--ax-surface-solid, #ffffff);
  box-shadow: var(--ax-shadow-sm, 0 1px 3px rgba(0,0,0,0.05));
  overflow: hidden;
}
.swp-inst-form .ax-card__header {
  padding: var(--ax-space-5, 20px) var(--ax-space-6, 24px);
  border-bottom: 1px solid var(--ax-border-subtle, #f1f5f9);
  background: var(--ax-surface-subtle, #f8fafc);
  display: flex;
  flex-direction: column;
  gap: var(--ax-space-4, 16px);
}
.swp-inst-form .ax-card__body { padding: var(--ax-space-6, 24px); }

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
  color: var(--ax-text, #1e293b);
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
  padding: 14px 14px 4px 14px;
  font-size: var(--ax-text-sm, 13px);
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
.ax-float__input:disabled { opacity: .7; cursor: not-allowed; background: var(--ax-surface-subtle, #f8fafc); }

.ax-float__label {
  position: absolute;
  inset-inline-start: 12px;
  top: 50%;
  transform: translateY(-50%);
  margin: 0;
  padding: 0 4px;
  font-size: var(--ax-text-sm, 13px);
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
  font-weight: 600;
  color: #2563eb;
}
.ax-float__label.has-val:not(.floating) {
  top: 0;
  font-size: 11px;
  font-weight: 600;
  color: var(--ax-text-muted, #64748b);
}
`;

const INDIAN_STATES = [
  'Assam',
  'Bihar',
  'Haryana',
  'Himachal Pradesh',
  'Jammu',
  'Karnataka',
  'Kashmir',
  'Tripura',
  'Jharkhand',
  'Uttar Pradesh',
  'Goa',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Chhattisgarh',
  'Gujarat',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Punjab',
  'Rajasthan',
  'Tamil Nadu',
  'Telangana',
  'Uttarakhand',
  'West Bengal',
  'Delhi',
];

interface FloatingFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  required?: boolean;
  disabled?: boolean;
  type?: string;
  placeholder?: string;
}

function FloatingInput({ label, name, value, onChange, required, disabled, type = 'text', placeholder }: FloatingFieldProps) {
  const [focused, setFocused] = useState(false);
  const hasVal = Boolean(value && String(value).length > 0);

  return (
    <div className="ax-float">
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
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
    </div>
  );
}

export function VendorWorkOrderAssignAdd() {
  const navigate = useNavigate();

  const [vendors, setVendors] = useState<VendorMasterItem[]>([]);
  const [workorders, setWorkorders] = useState<WorkOrderItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [formData, setFormData] = useState({
    vendor: '',
    vendor_id: '',
    workorder: '',
    state: '',
    district: '',
    block: '',
    start_date: new Date().toISOString().slice(0, 10),
    end_date: '',
    quantity: '',
    remarks: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Section Refs for Quick Nav Pills
  const sec1 = useRef<HTMLDivElement>(null);
  const sec2 = useRef<HTMLDivElement>(null);
  const sec3 = useRef<HTMLDivElement>(null);

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    async function loadDropdowns() {
      try {
        setLoadingData(true);
        const [vList, wList] = await Promise.all([
          vendorOperationsService.getVendors(),
          vendorOperationsService.getWorkOrders(),
        ]);
        setVendors(vList.filter((v) => v.status === 'Active'));
        setWorkorders(wList);
      } catch (err) {
        console.error('Failed to load vendors/workorders:', err);
      } finally {
        setLoadingData(false);
      }
    }
    loadDropdowns();
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'vendor') {
      const selected = vendors.find((v) => v.company_name === value || v.name === value);
      setFormData((prev) => ({
        ...prev,
        vendor: value,
        vendor_id: selected ? String(selected.id) : '',
        state: selected?.state || prev.state,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!formData.vendor) {
      setErrorMsg('Please select a Vendor.');
      return;
    }
    if (!formData.workorder) {
      setErrorMsg('Please select a Work Order.');
      return;
    }
    if (!formData.state) {
      setErrorMsg('Please select a State.');
      return;
    }
    if (!formData.district.trim()) {
      setErrorMsg('District is required.');
      return;
    }
    if (!formData.block.trim()) {
      setErrorMsg('Block is required.');
      return;
    }
    if (!formData.quantity || Number(formData.quantity) <= 0) {
      setErrorMsg('Please enter a valid Work Order Quantity.');
      return;
    }
    if (!formData.start_date) {
      setErrorMsg('Start Date is required.');
      return;
    }
    if (!formData.end_date) {
      setErrorMsg('Deadline / End Date is required.');
      return;
    }

    try {
      setSubmitting(true);
      await vendorOperationsService.createAssignment({
        workorder: formData.workorder,
        vendor: formData.vendor,
        vendor_id: formData.vendor_id || undefined,
        state: formData.state,
        district: formData.district,
        block: formData.block,
        start_date: formData.start_date,
        end_date: formData.end_date,
        quantity: Number(formData.quantity),
        remarks: formData.remarks,
      });

      setSuccessMsg('Work order assigned to vendor successfully! Redirecting...');
      setTimeout(() => {
        navigate('/vendor-management/workorder-assign/view');
      }, 1200);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to assign work order.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="solar-erp-page swp-inst-form" style={{ padding: '24px' }}>
      <style>{PAGE_CSS}</style>
      <style>{SINGLE_CARD_FORM_CSS}</style>

      {/* Header */}
      <PageHead
        title="Assign Work Order"
        subtitle="Allot tender capacity quotas to registered vendors across designated districts and blocks"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Work Order Assign', href: '/vendor-management/workorder-assign/view' },
          { label: 'Assign Work Order' },
        ]}
        actions={
          <Link
            to="/vendor-management/workorder-assign/view"
            className="ax-btn ax-btn--primary ax-btn--sm"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              height: 32,
              padding: '0 12px',
              fontSize: 12,
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
              <path d="M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6" />
            </svg>
            View Work Order Assign
          </Link>
        }
      />

      {/* Status Alerts */}
      {errorMsg && (
        <div
          style={{
            padding: '12px 16px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>✕ {errorMsg}</span>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            style={{ background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer', fontSize: 16 }}
          >
            ×
          </button>
        </div>
      )}

      {successMsg && (
        <div
          style={{
            padding: '12px 16px',
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#065f46',
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>✓ {successMsg}</span>
          <span style={{ fontSize: 12, opacity: 0.8 }}>Redirecting...</span>
        </div>
      )}

      {/* Main Single Card Form */}
      <form onSubmit={handleSubmit} className="ax-card">
        {/* Header with Section Navigation Pills */}
        <div className="ax-card__header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h2 className="ax-card__title" style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--ax-text-strong, #0f172a)' }}>
                Assign Work Order
              </h2>
              <p className="ax-card__subtitle" style={{ fontSize: '0.85rem', color: '#ef4444', margin: '4px 0 0' }}>
                The field labels marked with * are required input fields.
              </p>
            </div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: '9999px',
                backgroundColor: '#eff6ff',
                color: '#1d4ed8',
                border: '1px solid #bfdbfe',
              }}
            >
              Execution Allocation
            </span>
          </div>

          <div className="swp-section-pills">
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec1)}>
              <span className="pill-num">1</span> Vendor & Work Order
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec2)}>
              <span className="pill-num">2</span> Target Region (District/Block)
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec3)}>
              <span className="pill-num">3</span> Volume & Timeline
            </button>
          </div>
        </div>

        <div className="ax-card__body">
          {/* Section 1: Vendor & Work Order */}
          <div ref={sec1} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>1. Partner Vendor & Tender Order</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Select active contractor vendor and master tender work order
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {/* Vendor * */}
              <div className="ax-float">
                <select
                  id="vendor_select"
                  name="vendor"
                  className="ax-float__input"
                  value={formData.vendor}
                  onChange={handleChange}
                  required
                  disabled={loadingData || submitting}
                >
                  <option value="">{loadingData ? 'Loading vendors...' : 'Select Vendor...'}</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.company_name || v.name}>
                      {v.company_name} ({v.name}) — {v.state}
                    </option>
                  ))}
                </select>
                <label htmlFor="vendor_select" className="ax-float__label floating">
                  Vendor <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              {/* Work Order * */}
              <div className="ax-float">
                <select
                  id="workorder_select"
                  name="workorder"
                  className="ax-float__input"
                  value={formData.workorder}
                  onChange={handleChange}
                  required
                  disabled={loadingData || submitting}
                >
                  <option value="">{loadingData ? 'Loading work orders...' : 'Select Work Order...'}</option>
                  {workorders.map((w) => (
                    <option key={w.id} value={w.workorder}>
                      {w.workorder} ({w.workorder_number}) — {w.state}
                    </option>
                  ))}
                </select>
                <label htmlFor="workorder_select" className="ax-float__label floating">
                  Work Order <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              {/* State * */}
              <div className="ax-float">
                <select
                  id="state"
                  name="state"
                  className="ax-float__input"
                  value={formData.state}
                  onChange={handleChange}
                  required
                  disabled={submitting}
                >
                  <option value="">Select State...</option>
                  {INDIAN_STATES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
                <label htmlFor="state" className="ax-float__label floating">
                  State <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>
            </div>
          </div>

          <hr className="swp-section-divider" />

          {/* Section 2: Target Region (District/Block) */}
          <div ref={sec2} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>2. Target Region (District & Block)</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Designated territorial division for field installations
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {/* District * */}
              <FloatingInput
                label="District"
                name="district"
                value={formData.district}
                onChange={handleChange}
                required
                disabled={submitting}
                placeholder="Enter District Name"
              />

              {/* Block * */}
              <FloatingInput
                label="Block"
                name="block"
                value={formData.block}
                onChange={handleChange}
                required
                disabled={submitting}
                placeholder="Enter Block Name"
              />
            </div>
          </div>

          <hr className="swp-section-divider" />

          {/* Section 3: Volume & Timeline */}
          <div ref={sec3} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>3. Volume Allocation & Milestones</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Assigned site quota, commencement schedule, and completion deadline
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: 16 }}>
              {/* Quantity * */}
              <FloatingInput
                label="Work Order Quantity (Sites / Units)"
                name="quantity"
                type="number"
                value={formData.quantity}
                onChange={handleChange}
                required
                disabled={submitting}
                placeholder="e.g. 50"
              />

              {/* Start Date * */}
              <FloatingInput
                label="Assignment Start Date"
                name="start_date"
                type="date"
                value={formData.start_date}
                onChange={handleChange}
                required
                disabled={submitting}
              />

              {/* End Date * */}
              <FloatingInput
                label="Deadline Date"
                name="end_date"
                type="date"
                value={formData.end_date}
                onChange={handleChange}
                required
                disabled={submitting}
              />
            </div>

            {/* Remarks */}
            <div style={{ maxWidth: '640px' }}>
              <FloatingInput
                label="Remarks"
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                disabled={submitting}
                placeholder="Optional assignment instructions or notes"
              />
            </div>
          </div>

          {/* Form Actions Footer */}
          <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid var(--ax-border, #e2e8f0)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px' }}>
            <Link to="/vendor-management/workorder-assign/view" className="ax-btn ax-btn--secondary">
              Cancel
            </Link>
            <button
              type="submit"
              className="ax-btn ax-btn--primary"
              disabled={submitting}
              style={{
                minWidth: 160,
                fontWeight: 700,
              }}
            >
              {submitting ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <span className="ax-spinner" /> Assigning...
                </span>
              ) : (
                'Assign Work Order'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default VendorWorkOrderAssignAdd;
